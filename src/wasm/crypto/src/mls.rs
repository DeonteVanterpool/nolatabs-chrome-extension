//! This module handles all MLS (messaging layer security) operations. It is based around the
//! OpenMLS library.
//!
//! `get_storage` can be used to get the *encrypted* provider storage object. this is helpful to be able to
//! persiste it.
//! `load_storage` can be used to load an encrypted storage object from your persisted storage.
//!
//! Be sure to use `init` if loading the library for the first time with no credentials or provider. Or `load_storage` on startup if you already have a provider
//!
//! Be careful with types, as nearly everything is a vector of integers to prevent extra copies used
//! by serde_wasm_bindgen, and to standardize how data is serialized and deserialized.
//!
//! Note: this library is single threaded because Javascript is single threaded. It will most
//! likely panic on multithreaded code

use openmls_traits::signatures::Signer;
use crate::mls_helpers;
use openmls::key_packages::KeyPackage as OpenMlsKeyPackage;
use openmls::prelude::tls_codec::Serialize as SerializeOpenMLS;
use openmls::prelude::*;
use openmls_basic_credential::SignatureKeyPair;
use openmls_rust_crypto::OpenMlsRustCrypto;
use std::cell::RefCell;
use std::ops::Deref;
use zeroize::ZeroizeOnDrop;

use wasm_bindgen::prelude::*;

static CIPHERSUITE: openmls::prelude::Ciphersuite =
    Ciphersuite::MLS_256_MLKEM1024_AES256GCM_SHA512_MLDSA87;

thread_local! {
    static PROVIDER: RefCell<Option<OpenMlsRustCrypto>> = RefCell::new(None);
    static CREDENTIALS: RefCell<Option<Credentials>> = RefCell::new(None);
}

#[wasm_bindgen]
pub struct Credentials {
    cwk: CredentialWithKey,
    skp: SignatureKeyPair,
}

impl ZeroizeOnDrop for Credentials {}

/// Get the provider storage as a JS value. DO NOT PERIST OLD VERSIONS OF THE STORAGE. THIS BREAKS THE OPENMLS SECURITY MODEL.
#[wasm_bindgen]
pub fn get_storage(nonce: &[u8]) -> Result<Vec<u8>, JsError> {
    PROVIDER.with(|p| {
        let p_ref = p.borrow();
        let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;

        let storage = provider.storage().values.read()?;

        let out = oxicode::encode_to_vec(storage.deref())?;

        Ok(crate::aes_encrypt(out, nonce))
    })
}

/// load the provider storage object. the nonce used must be the same nonce originally provided
/// during get_storage

#[wasm_bindgen]
pub fn load_storage(
    storage: &[u8],
    nonce: &[u8],
    public_key: &[u8],
    identity: &[u8],
) -> Result<(), JsError> {
    default_provider()?;
    let credential = BasicCredential::new(identity.to_vec());
    let packet = crate::aes_decrypt(storage.to_vec(), &nonce);
    let storage_decrypted = unsafe { std::slice::from_raw_parts(packet.1, packet.0 as usize) };
    {
        PROVIDER.with(|p| {
            let p_ref = p.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let mut w = provider.storage().values.write()?;
            *w = oxicode::decode_value(storage_decrypted)?;
            Ok::<(), JsError>(())
        })?;
        crate::free_packet(packet);
    }

    read_keypair(public_key, credential)?;
    Ok(())
}

/// returns public key
pub fn init(identity: &[u8]) -> Result<Vec<u8>, JsError> {
    default_provider()?;

    let credential = BasicCredential::new(identity.to_vec());
    let signature_keys = SignatureKeyPair::new(CIPHERSUITE.signature_algorithm())?;
    let public_key = signature_keys.public().to_vec();

    PROVIDER.with(|p| {
        let p_ref = p.borrow();
        let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
        signature_keys.store(provider.storage())?;
        Ok::<(), JsError>(())
    })?;
    read_keypair(&public_key, credential)?;
    Ok(public_key)
}

/// returns the key package
#[wasm_bindgen]
pub fn generate_key_package() -> Result<Vec<u8>, JsError> {
    PROVIDER.with(|p| {
        CREDENTIALS.with(|c| {
            let p_ref = p.borrow();
            let c_ref = c.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;

            Ok(OpenMlsKeyPackage::builder()
                .build(
                    CIPHERSUITE,
                    provider,
                    &credentials.skp,
                    credentials.cwk.clone(),
                )?
                .key_package()
                .tls_serialize_detached()?)
        })
    })
}

#[wasm_bindgen]
pub fn create_group() -> Result<Vec<u8>, JsError> {
    let group_config = MlsGroupCreateConfig::builder()
        .ciphersuite(CIPHERSUITE)
        .build();

    PROVIDER.with(|p| {
        CREDENTIALS.with(|c| {
            let p_ref = p.borrow();
            let c_ref = c.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;

            Ok(MlsGroup::new(
                provider,
                &credentials.skp,
                &group_config,
                credentials.cwk.clone(),
            )?
            .group_id()
            .tls_serialize_detached()?)
        })
    })
}

/// get the public key currently stored
#[wasm_bindgen]
pub fn get_public_key() -> Result<Vec<u8>, JsError> {
    CREDENTIALS.with(|c| {
        let c_ref = c.borrow();
        let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;
        Ok(credentials.skp.public().to_vec())
    })
}

/// sign a message with the current credentials. returns the signature as a vector of bytes
#[wasm_bindgen]
pub fn sign(message: &[u8]) -> Result<Vec<u8>, JsError> {
    CREDENTIALS.with(|c| {
        let c_ref = c.borrow();
        let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;
        let signature = credentials.skp.sign(message).map_err(|e| JsError::new(&format!("Signing failed: {e:?}")))?;
        Ok(signature)
    })
}

/// returns serialized welcome message (Vec<u8>). The key package has to be retrieved from the other user in some way. Most likely via a server storing key packages for users
#[wasm_bindgen]
pub fn invite(kpkg_bytes: &[u8], group_id: &[u8]) -> Result<Vec<u8>, JsError> {
    let kpkg = mls_helpers::key_package_from_bytes(kpkg_bytes)?;
    let group_id = mls_helpers::group_id_from_bytes(group_id)?;
    let mut group = get_group(&group_id)?.ok_or_else(|| JsError::new("Error finding group"))?;

    PROVIDER.with(|p| {
        CREDENTIALS.with(|c| {
            let p_ref = p.borrow();
            let c_ref = c.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;

            let (_m, welcome_out, _gi) =
                group.add_members(provider, &credentials.skp, core::slice::from_ref(&kpkg))?;
            group.merge_pending_commit(provider)?;
            Ok(welcome_out.tls_serialize_detached()?)
        })
    })
}

/// Export the ratchet tree for a given groupId. Returns the tree serialized as bytes.
#[wasm_bindgen]
pub fn export_ratchet_tree(group_id_bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    let group_id: GroupId = mls_helpers::group_id_from_bytes(group_id_bytes)?;
    let group = get_group(&group_id)?.ok_or_else(|| JsError::new("Error finding group"))?;

    // Export the ratchet tree and TLS serialize it to bytes
    let tree = group.export_ratchet_tree();
    let tree_bytes = tree
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize ratchet tree: {:?}", e)))?;

    Ok(tree_bytes)
}

/// accepts an external invitation to join a group. returns serialized group id
#[wasm_bindgen]
pub fn accept_invitation(welcome_bytes: &[u8], tree_bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    let tree: RatchetTreeIn = mls_helpers::ratchet_tree_from_bytes(tree_bytes)?;
    let welcome = mls_helpers::welcome_message_from_bytes(welcome_bytes)?;

    PROVIDER.with(|p| {
        let p_ref = p.borrow();
        let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
        let staged_join = StagedWelcome::new_from_welcome(
            provider,
            &MlsGroupJoinConfig::default(),
            welcome,
            Some(tree),
        )?;
        let group = staged_join.into_group(provider)?;
        Ok(group.group_id().tls_serialize_detached()?)
    })
}

/// message should be passed as an argument. returns the message if it was an application message.
/// otherwise, if it was a pending proposal, it merges the staged commit, and returns None
#[wasm_bindgen]
pub fn process_message(group_id_bytes: &[u8], message: &[u8]) -> Result<Option<Vec<u8>>, JsError> {
    let group_id = mls_helpers::group_id_from_bytes(group_id_bytes)?;
    let mut group = get_group(&group_id)?.ok_or(JsError::new("No group found"))?;

    PROVIDER.with(|p| {
        let p_ref = p.borrow();
        let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
        let processed_message =
            group.process_message(provider, mls_helpers::message_from_bytes(message)?)?;
        let message_content = processed_message.into_content();

        match message_content {
            ProcessedMessageContent::ApplicationMessage(m) => Ok(Some(m.into_bytes())),
            ProcessedMessageContent::StagedCommitMessage(s) => {
                group.merge_staged_commit(provider, *s)?;
                Ok(None)
            }
            _ => Err(JsError::new("unexpected message type")),
        }
    })
}

/// encrypt a message to a group. returns the encrypted message as a vector of bytes
#[wasm_bindgen]
pub fn encrypt_message(group_id_bytes: &[u8], message: &[u8]) -> Result<Vec<u8>, JsError> {
    let group_id = mls_helpers::group_id_from_bytes(group_id_bytes)?;
    let mut group = get_group(&group_id)?.ok_or(JsError::new("Error finding group"))?;

    PROVIDER.with(|p| {
        CREDENTIALS.with(|c| {
            let p_ref = p.borrow();
            let c_ref = c.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let credentials = c_ref.as_ref().ok_or(mls_helpers::MlsError::NoCredentials)?;
            let mls_message_out = group.create_message(provider, &credentials.skp, message)?;
            Ok(mls_message_out.tls_serialize_detached()?)
        })
    })
}

fn get_group(id: &GroupId) -> Result<Option<MlsGroup>, mls_helpers::MlsError> {
    PROVIDER.with(|p| {
        let p_ref = p.borrow();
        let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
        Ok(MlsGroup::load(provider.storage(), id)
            .map_err(|e| mls_helpers::MlsError::Unknown(e.to_string()))?)
    })
}

fn default_provider() -> Result<(), mls_helpers::MlsError> {
    PROVIDER.with(|p| *p.borrow_mut() = Some(OpenMlsRustCrypto::default()));
    Ok(())
}

fn read_keypair(
    public_key: &[u8],
    credential: BasicCredential,
) -> Result<(), mls_helpers::MlsError> {
    PROVIDER.with(|p| {
        CREDENTIALS.with(|c| {
            let p_ref = p.borrow();
            let provider = p_ref.as_ref().ok_or(mls_helpers::MlsError::NoProvider)?;
            let skp = SignatureKeyPair::read(
                provider.storage(),
                public_key,
                CIPHERSUITE.signature_algorithm(),
            )
            .ok_or(mls_helpers::MlsError::NoSkp)?;
            let cwk = CredentialWithKey {
                credential: credential.into(),
                signature_key: public_key.into(),
            };
            *c.borrow_mut() = Some(Credentials { skp, cwk });
            Ok(())
        })
    })
}
