use mls::{
    Invitation, ProcessedMessage, create_group, encrypt_message, export_ratchet_tree, generate_credential_with_key, generate_key_package, invite
};
use openmls::prelude::KeyPackage;
use openmls::group::GroupId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::*;

// Run in a browser (needed for OpenMLS) -- NEED TO HAVE THE CORRECT BROWSER INSTALLED
wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct Kpg {
    key_package: KeyPackage,
}

impl Kpg {
    pub fn inner(self) -> KeyPackage {
        self.key_package
    }
}

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct CredentialWrapper {
    credentials: mls::Credentials,
}

impl CredentialWrapper {
    pub fn inner(self) -> mls::Credentials {
        self.credentials
    }
}

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct GroupIdWrapper {
    group_id: GroupId,
}

impl GroupIdWrapper {
    pub fn inner(self) -> GroupId {
        self.group_id
    }
}

#[wasm_bindgen]
#[derive(Deserialize, Serialize)]
pub struct InvitationWrapper {
    invitation: Invitation,
}

impl InvitationWrapper {
    pub fn inner(self) -> Invitation {
        self.invitation
    }
}

#[wasm_bindgen_test]
fn send_message() {
    let msg = "hello";

    // Setup credentials and key packages for both parties
    let sender_creds = generate_credential_with_key([0].to_vec());
    let receiver_creds = generate_credential_with_key([1].to_vec());
    let receiver_kpg = generate_key_package(receiver_creds.clone()).unwrap();

    // Make a copy of receiver's provider storage before sender modifies it
    let receiver_provider_storage: HashMap<Vec<u8>, Vec<u8>> =
        serde_wasm_bindgen::from_value(mls::get_provider_storage().unwrap()).unwrap();

    // SENDER SIDE:
    // Sender creates the group
    let group = create_group(sender_creds.clone()).unwrap();
    let group_id: GroupId = serde_wasm_bindgen::from_value(group.clone()).unwrap();

    // Sender invites receiver to the group
    let invitation = Invitation::new(
        serde_wasm_bindgen::from_value(sender_creds.clone()).unwrap(),
        serde_wasm_bindgen::from_value::<Kpg>(receiver_kpg)
            .unwrap()
            .inner(),
        group_id.clone(),
    );

    let invitation_js = serde_wasm_bindgen::to_value(&invitation).unwrap();
    let welcome_out: Vec<u8> =
        serde_wasm_bindgen::from_value(invite(invitation_js).unwrap()).unwrap();
    let tree = export_ratchet_tree(group.clone().into()).unwrap();

    // Sender encrypts a message for the group
    let encrypt_info = mls::MessageEncryptInfo::new(
        group_id.clone(),
        msg.as_bytes().to_vec(),
        serde_wasm_bindgen::from_value(sender_creds).unwrap(),
    );

    let encrypt_info_js = serde_wasm_bindgen::to_value(&encrypt_info).unwrap();
    let encrypted_message = encrypt_message(encrypt_info_js).unwrap();
    let encrypted_bytes: Vec<u8> =
        serde_wasm_bindgen::from_value(encrypted_message.clone()).unwrap();

    // RECEIVER SIDE: 
    // Accept invitation and decrypt message
    mls::load_provider_storage(serde_wasm_bindgen::to_value(&receiver_provider_storage).unwrap())
        .unwrap();

    // Receiver accepts the invitation
    let accept_invitation =
        mls::AcceptInvitation::new(serde_wasm_bindgen::from_value(tree).unwrap(), welcome_out);

    let accept_invitation_js = serde_wasm_bindgen::to_value(&accept_invitation).unwrap();
    let group_after_accept: GroupId =
        serde_wasm_bindgen::from_value(mls::accept_invitation(accept_invitation_js).unwrap())
            .unwrap();

    assert_eq!(group_after_accept, group_id);

    // Receiver decrypts the message
    let message_info = mls::MessageInfo::new(group_after_accept, encrypted_bytes);

    let message_info_js = serde_wasm_bindgen::to_value(&message_info).unwrap();
    let decrypted_message = mls::process_message(message_info_js).unwrap();
    let decrypted_message_deserialized: ProcessedMessage = serde_wasm_bindgen::from_value(decrypted_message).unwrap();

    assert_eq!(decrypted_message_deserialized.get_kind(), &String::from("Application"));

    assert_eq!(b"hello", decrypted_message_deserialized.get_content("message").unwrap().as_slice());
}
