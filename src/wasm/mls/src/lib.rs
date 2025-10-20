use lazy_static::lazy_static;
use openmls::prelude::tls_codec::Serialize as SerializeOpenMLS;
use openmls::prelude::*;
use openmls::treesync::RatchetTree;
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
    return Ok(serde_wasm_bindgen::to_value(
        &*OpenMlsRustCrypto::default()
            .storage()
            .values
            .read()
            .unwrap(),
    )?);
}

#[wasm_bindgen]
pub fn load_provider_storage(val: JsValue) -> Result<(), JsError> {
    let storage: HashMap<Vec<u8>, Vec<u8>> = serde_wasm_bindgen::from_value(val)?;
    let mut w = PROVIDER.storage().values.write().unwrap();
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
    MlsGroup::load(PROVIDER.storage(), id).ok()?
}

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct Invitation {
    creds: Credentials,
    kpg: KeyPackage,
    group_id: GroupId,
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
#[derive(Deserialize)]
pub struct AcceptInvitation {
    tree: RatchetTree,
    welcome: Vec<u8>,
}

pub fn accept_invatation(val: JsValue) -> Result<JsValue, JsError> {
    let inv: AcceptInvitation = serde_wasm_bindgen::from_value(val)?;
    let (mls_message_in, _) = MlsMessageIn::tls_deserialize_bytes(&mut inv.welcome.as_slice())
        .expect("An unexpected error occurred.");

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
        Some(inv.tree.into()),
    )
    .expect("Error creating a staged join from Welcome");

    let group = staged_join
        .into_group(&*PROVIDER)
        .expect("Error creating the group from the staged join");

    return Ok(serde_wasm_bindgen::to_value(group.group_id())?);
}
