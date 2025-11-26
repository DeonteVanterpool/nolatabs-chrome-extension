use lazy_static::lazy_static;
use openmls::prelude::tls_codec::Serialize as SerializeOpenMLS;
use openmls::prelude::*;
use openmls_basic_credential::SignatureKeyPair;
use openmls_rust_crypto::OpenMlsRustCrypto;
use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Define ciphersuite ...
static CIPHERSUITE: openmls::prelude::Ciphersuite =
    Ciphersuite::MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519;
// ... and the crypto provider to use.
lazy_static! {
    static ref PROVIDER: OpenMlsRustCrypto = OpenMlsRustCrypto::default();
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct Credentials {
    cwk: CredentialWithKey,
    skp: SignatureKeyPair,
}

#[wasm_bindgen]
pub fn get_provider_storage() -> Result<JsValue, JsError> {
    let storage = &*PROVIDER.storage().values.read().unwrap();
    return Ok(serde_wasm_bindgen::to_value(storage)?);
}

#[wasm_bindgen]
pub fn load_provider_storage(val: JsValue) -> Result<(), JsError> {
  let storage: HashMap<Vec<u8>, Vec<u8>> = serde_wasm_bindgen::from_value(val)?;
    let mut w = PROVIDER.storage().values.write().unwrap(); // ✅ Correct reference
    *w = storage;
    Ok(())
}

#[wasm_bindgen]
// A helper to create and store credentials.
pub fn generate_credential_with_key(identity: Vec<u8>) -> JsValue {
    let credential = BasicCredential::new(identity);
    let signature_keys = SignatureKeyPair::new(CIPHERSUITE.signature_algorithm())
        .expect("Error generating a signature key pair.");

    // Store the signature key into the key store so OpenMLS has access
    // to it.
    signature_keys
        .store(PROVIDER.storage())
        .expect("Error storing signature keys in key store.");

    serde_wasm_bindgen::to_value(&Credentials {
        cwk: CredentialWithKey {
            credential: credential.into(),
            signature_key: signature_keys.public().into(),
        },
        skp: signature_keys,
    })
    .unwrap()
}

#[wasm_bindgen]
// A helper to create key package bundles.
pub fn generate_key_package(val: JsValue) -> Result<JsValue, JsError> {
    let creds: Credentials = serde_wasm_bindgen::from_value(val)?;
    // Create the key package
    Ok(serde_wasm_bindgen::to_value(
        &KeyPackage::builder()
            .build(CIPHERSUITE, &*PROVIDER, &creds.skp, creds.cwk)
            .unwrap(),
    )?)
}

#[wasm_bindgen]
pub fn create_group(val: JsValue) -> Result<JsValue, JsError> {
    let creds: Credentials = serde_wasm_bindgen::from_value(val)?;
    // Now Sasha starts a new group ...
    Ok(serde_wasm_bindgen::to_value(
        &MlsGroup::new(
            &*PROVIDER,
            &creds.skp,
            &MlsGroupCreateConfig::default(),
            creds.cwk,
        )
        .expect("An unexpected error occurred.")
        .group_id(),
    )?)
}

fn get_group(id: &GroupId) -> Option<MlsGroup> {
    MlsGroup::load(&*PROVIDER.storage(), id).ok()?
}

#[wasm_bindgen]
#[derive(Deserialize, Serialize)]
pub struct Invitation {
    creds: Credentials,
    kpg: KeyPackage,
    group_id: GroupId,
}

impl Invitation {
    pub fn new(creds: Credentials, kpg: KeyPackage, group_id: GroupId) -> Self {
        Invitation {
            creds,
            kpg,
            group_id,
        }
    }
}

// returns invitation message (Vec<u8>)
#[wasm_bindgen]
pub fn invite(val: JsValue) -> Result<JsValue, JsError> {
    let inv: Invitation = serde_wasm_bindgen::from_value(val)?;
    // ... and invites Maxim.
    // The key package has to be retrieved from Maxim in some way. Most likely
    // via a server storing key packages for users.
    let mut group = get_group(&inv.group_id).ok_or_else(|| JsError::new("Error finding group"))?;
    let (_mls_message_out, welcome_out, _group_info) = group
        .add_members(&*PROVIDER, &inv.creds.skp, core::slice::from_ref(&inv.kpg))
        .expect("Could not add members.");

    group.merge_pending_commit(&*PROVIDER)?;

    Ok(serde_wasm_bindgen::to_value(
        &welcome_out.tls_serialize_detached()?,
    )?)
}

#[wasm_bindgen]
#[derive(Deserialize, Serialize)]
pub struct AcceptInvitation {
    tree: Vec<u8>,
    welcome: Vec<u8>,
}

impl AcceptInvitation {
    pub fn new(tree: Vec<u8>, welcome: Vec<u8>) -> Self {
        AcceptInvitation { tree, welcome }
    }
}

#[wasm_bindgen]
pub fn export_ratchet_tree(val: JsValue) -> Result<JsValue, JsError> {
    let group_id: GroupId = serde_wasm_bindgen::from_value(val)?;
    let group = get_group(&group_id).ok_or_else(|| JsError::new("Error finding group"))?;

    // Export the ratchet tree and TLS serialize it to bytes
    let tree = group.export_ratchet_tree();
    let tree_bytes = tree
        .tls_serialize_detached()
        .map_err(|e| JsError::new(&format!("Failed to serialize ratchet tree: {:?}", e)))?;

    Ok(serde_wasm_bindgen::to_value(&tree_bytes)?)
}

#[wasm_bindgen]
pub fn accept_invitation(val: JsValue) -> Result<JsValue, JsError> {
    let inv: AcceptInvitation = serde_wasm_bindgen::from_value(val)?;
    let (mls_message_in, remaining_bytes) =
        MlsMessageIn::tls_deserialize_bytes(&mut inv.welcome.as_slice())
            .expect("An unexpected error occurred.");

    // Deserialize the ratchet tree from TLS-serialized bytes
    let tree = tls_codec::Deserialize::tls_deserialize(&mut inv.tree.as_slice())
        .map_err(|e| JsError::new(&format!("Failed to deserialize ratchet tree: {:?}", e)))?;

    // Check if we consumed all bytes
    if !remaining_bytes.is_empty() {
        return Err(JsError::new(&format!(
            "Extra bytes after deserialization: {} bytes remaining",
            remaining_bytes.len()
        )));
    }

    // ... and inspect the message.
    let welcome = match mls_message_in.extract() {
        MlsMessageBodyIn::Welcome(welcome) => welcome,
        // We know it's a welcome message, so we ignore all other cases.
        _ => unreachable!("Unexpected message type."),
    };

    let staged_join = StagedWelcome::new_from_welcome(
        &*PROVIDER,
        &MlsGroupJoinConfig::default(),
        welcome,
        // The public tree is needed and transferred out of band.
        // It is also possible to use the [`RatchetTreeExtension`]
        Some(tree),
    )
    .expect("Error creating a staged join from Welcome");

    let group = staged_join
        .into_group(&*PROVIDER)
        .expect("Error creating the group from the staged join");

    return Ok(serde_wasm_bindgen::to_value(group.group_id())?);
}

// message should be passed as an argument
#[wasm_bindgen]
pub fn decrypt_message(val: JsValue) -> Result<JsValue, JsError> {
    let mut info: MessageInfo = serde_wasm_bindgen::from_value(val)?;
    let mut group = get_group(&info.group_id).ok_or_else(|| JsError::new("Error finding group"))?;

    let (mls_message_in, _) = MlsMessageIn::tls_deserialize_bytes(&mut info.message.as_mut())
        .expect("An unexpected error occurred.");

    // ... and inspect the message.
    let message_processed = match mls_message_in.extract() {
        MlsMessageBodyIn::PublicMessage(message) => group.process_message(&*PROVIDER, message)?,
        MlsMessageBodyIn::PrivateMessage(message) => group.process_message(&*PROVIDER, message)?,
        _ => panic!("Error"),
    };

    let message = match message_processed.into_content() {
        ProcessedMessageContent::ApplicationMessage(message) => message.into_bytes(),
        _ => panic!("Error"),
    };

    return Ok(serde_wasm_bindgen::to_value(&message)?);
}

#[wasm_bindgen]
#[derive(Deserialize, Serialize)]
pub struct MessageInfo {
    group_id: GroupId,
    message: Vec<u8>,
}

impl MessageInfo {
    pub fn new(group_id: GroupId, message: Vec<u8>) -> Self {
        MessageInfo { group_id, message }
    }
}

#[wasm_bindgen]
#[derive(Deserialize, Serialize)]
pub struct MessageEncryptInfo {
    group_id: GroupId,
    message: Vec<u8>,
    creds: Credentials,
}

impl MessageEncryptInfo {
    pub fn new(group_id: GroupId, message: Vec<u8>, creds: Credentials) -> Self {
        MessageEncryptInfo {
            group_id,
            message,
            creds,
        }
    }
}

// message should be passed as an argument
#[wasm_bindgen]
pub fn encrypt_message(val: JsValue) -> Result<JsValue, JsError> {
    let info: MessageEncryptInfo = serde_wasm_bindgen::from_value(val)?;
    // ... and invites Maxim.
    // The key package has to be retrieved from Maxim in some way. Most likely
    // via a server storing key packages for users.
    let mut group = get_group(&info.group_id).ok_or_else(|| JsError::new("Error finding group"))?;
    let mls_message_out = group
        .create_message(&*PROVIDER, &info.creds.skp, &info.message)
        .expect("Could not create message");

    Ok(serde_wasm_bindgen::to_value(
        &mls_message_out.tls_serialize_detached()?,
    )?)
}
