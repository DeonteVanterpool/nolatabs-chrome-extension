import {get_public_key, sign, argon2_verify_password, argon2_set_password, logged_in, aes_encrypt, aes_decrypt, Packet, set_master_key, aes_encrypt_kek, aes_decrypt_kek} from 'src/wasm/crypto/pkg/crypto.js';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function encrypt(data: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    return aes_encrypt(data, nonce);
}

export async function decrypt(ciphertext: Uint8Array, nonce: Uint8Array): Promise<Packet> {
    return aes_decrypt(ciphertext, nonce);
}

export async function encrypt_kek(data: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    return aes_encrypt_kek(data, nonce);
}

export async function decrypt_kek(data: Uint8Array, nonce: Uint8Array) {
    return aes_decrypt_kek(data, nonce);
}

export async function sha2Hash(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

export async function sha2Verify(data: Uint8Array<ArrayBuffer>, hash: Uint8Array): Promise<boolean> {
    const digest = await sha2Hash(data);
    if (digest.length !== hash.length) return false;
    for (let i = 0; i < digest.length; i++) {
        if (digest[i] !== hash[i]) return false;
    }
    return true;
}

/** 
 * Takes in password and salt. Returns a verification key, which can be used with passwordVerify
 * */
export async function argon2HashMasterKey(password: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
    const verification = argon2_set_password(password, salt);
    console.log("password: ", password)
    console.log("salt: ", salt)
    console.log("verification: ", verification)
    return verification;
}

export async function setMasterKey(masterkey: Uint8Array): Promise<void> {
    const verification = set_master_key(masterkey);
    console.log("masterkey: ", masterkey)
    console.log("verification: ", verification)
    console.log("sent message");
}

export function uuid(): string {
    return crypto.randomUUID();
}

export async function isLoggedIn() {
    console.log("isloggedin")
    console.log(logged_in())
    await chrome.storage.session.set({"masterKey": "set"})
    return logged_in();
}

export async function passwordVerify(password: Uint8Array, against: Uint8Array, salt: Uint8Array): Promise<boolean> {
    console.log("password: ", password, "against: ", against, "salt: ", salt)
    return argon2_verify_password(password, against, salt);
}

export function hookLogin(f: () => void) {
    const handler = (changes: {[key: string]: chrome.storage.StorageChange}) => {
        if (changes["masterKey"]) {
            console.log("hookLogin triggered")
            f();
        }
    };
    chrome.storage.session.onChanged.addListener(handler);
    return () => chrome.storage.session.onChanged.removeListener(handler);
}

export function encode(data: string): Uint8Array {
    return encoder.encode(data);
}

export function decode(data: Uint8Array): string {
    return decoder.decode(data);
}

/**
* Generate a salt of length bytes using the Web Crypto API. The default length is 16 bytes (128 bits). 
* @param [length=16] The length of the salt in bytes. Must be a positive integer.
* */
export function generateSalt(length = 16): Uint8Array {
    const array = new Uint8Array(length);
    return crypto.getRandomValues(array);
}

export function uint8ArrayToBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export function public_key(): string {
    return decode(get_public_key());
}

export function sign_message(data: Uint8Array): string {
    return decode(sign(data));
}
