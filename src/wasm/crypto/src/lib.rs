#![allow(static_mut_refs)] // should be safe to ignore this because JS is single threaded
use argon2::Argon2;
use once_cell::sync::Lazy;
use wasm_bindgen::prelude::*;
use zeroize::Zeroize;

use aes_gcm::{
    Aes256Gcm,
    Nonce, // Or `Aes128Gcm`
    aead::{Aead, KeyInit},
};

static mut KEK_BUF: [u8; 32] = [0; 32];
static mut MASTER_KEY_BUF: [u8; 32] = [0; 32];
static mut AES_CIPHER: Option<Aes256Gcm> = None;

static PASSWORD_HASHER: Lazy<Argon2<'static>> = Lazy::new(|| Argon2::default());

pub mod mls;
mod mls_helpers;

/// All decrypted text is sent back as packets. Packets have arbitrary size and can be Box::leaked to have a static lifetime and never drop. The main benefit of sending this Packet tuple is less copies. Copies are bad because sensitive data might lay around in memory, and you have to zeroize them after sending it to Javascript. Extra copies also hurt performance. With packets, we can just hava JS reach directly into WASM linear memory. These packets can be reused for performance critical stuff in the future.
/// NOTE: If using Box::leak, the onus goes on Javascript, or the caller to free (and zeroize) the memory when it isn't needed any longer
#[wasm_bindgen]
pub struct Packet(pub u32, pub *mut u8);

/// Takes in a password as vector of bytes. Returns a 128 bit verification key so that you can verify that the password is correct during login
#[wasm_bindgen]
pub fn argon2_set_password(mut password: Vec<u8>, salt: Vec<u8>) -> Vec<u8> {
    if password.len() == 0 {
        panic!("password unexpected length {}", password.len());
    }
    if salt.len() != 16 {
        panic!("salt unexpected length {}. expected 16 bytes", salt.len());
    }
    let mut buf: [u8; 64] = [0; 64];
    PASSWORD_HASHER
        .hash_password_into(&password, &salt, &mut buf)
        .unwrap();
    let (verification_key, key_encryption_key) = buf.split_at(32);
    unsafe { // unsafe should actually be safe because JS is single threaded.
        KEK_BUF.copy_from_slice(key_encryption_key);
    }
    password.zeroize();
    let ret = verification_key.to_vec();

    buf.zeroize();

    return ret; // ret is a verification key which can live in Javascript and be stored, so we don't have to zeroize it and can make an extra copy here
}

/// Set the master key in wasm memory. Make sure this master key is randomly generated
#[wasm_bindgen]
pub fn set_master_key(mut master_key: Vec<u8>) {
    if master_key.len() != 32 {
        panic!(
            "master key unexpected length {}. expected 32 bytes",
            master_key.len()
        );
    }
    unsafe {
        MASTER_KEY_BUF.copy_from_slice(&master_key);
        AES_CIPHER = Some(Aes256Gcm::new_from_slice(&MASTER_KEY_BUF).unwrap());
    }
    master_key.zeroize();
}

#[wasm_bindgen]
pub fn clear_master_key() {
    unsafe {
        MASTER_KEY_BUF.zeroize();
    }
}

#[wasm_bindgen]
pub fn argon2_verify_password(mut password: Vec<u8>, hash: Vec<u8>, salt: Vec<u8>) -> bool {
    let mut buf: [u8; 32] = [0; 32];
    PASSWORD_HASHER
        .hash_password_into(&password, &salt, &mut buf)
        .unwrap();
    password.zeroize();
    let result = buf.to_vec();
    buf.zeroize();

    return result == hash;
}

#[wasm_bindgen]
pub fn aes_encrypt(mut data: Vec<u8>, nonce: &[u8]) -> Vec<u8> {
    let cipher = unsafe { AES_CIPHER.as_ref().unwrap() };
    let ciphertext = cipher
        .encrypt(&Nonce::try_from(nonce).unwrap(), data.as_ref())
        .unwrap();

    data.zeroize();
    return ciphertext;
}

#[wasm_bindgen]
pub fn aes_decrypt(ciphertext: Vec<u8>, nonce: &[u8]) -> Packet {
    let cipher = unsafe { AES_CIPHER.as_ref().unwrap() };
    let data: Box<[u8]> =
        cipher
            .decrypt(&Nonce::try_from(nonce).unwrap(), ciphertext.as_ref())
            .unwrap()
            .into_boxed_slice();
    let size = data.len() as u32;
    let static_data = Box::leak::<'static>(data);

    return Packet(size, static_data.as_mut_ptr()); // need mut_ptr to be able to zeroize
}

/// free and automatically zeroize a packet
#[wasm_bindgen]
pub fn free_packet(packet: Packet) {
    unsafe {
        let slice_ptr = std::ptr::slice_from_raw_parts_mut(packet.1, packet.0 as usize);
        Box::from_raw(slice_ptr).zeroize();
    }
}
