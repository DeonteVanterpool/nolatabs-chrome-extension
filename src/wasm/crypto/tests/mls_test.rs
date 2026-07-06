use crypto::mls::*;
use crypto::*;
use wasm_bindgen_test::*;

// Run in a browser (needed for OpenMLS random number generation usually)
wasm_bindgen_test_configure!(run_in_browser);

const NONCE_ALICE: &[u8] = &[0u8; 12];
const NONCE_BOB: &[u8] = &[1u8; 12];

#[wasm_bindgen_test]
fn test_storage_save_and_reload() {
    set_master_key(vec![1;32]);
    let identity = b"test_user";
    
    // 1. Initialize user
    let pub_key = init(identity).expect("Failed to init user");

    // 2. Create a group so there is meaningful state to save
    let group_id = create_group().expect("Failed to create group");

    // 3. Export and encrypt the storage
    let encrypted_storage = get_storage(NONCE_ALICE).expect("Failed to get storage");

    // 4. Simulate unloading the provider/restarting the app by overriding the global state
    // with a completely different dummy initialization
    let _dummy_pub = init(b"dummy_user").expect("Failed to init dummy");

    // 5. Reload the original user's state
    load_storage(&encrypted_storage, NONCE_ALICE, &pub_key, identity)
        .expect("Failed to load storage");

    // 6. Verify state was restored by successfully interacting with the previously created group
    let msg = b"ping";
    let _encrypted = encrypt_message(&group_id, msg)
        .expect("Failed to encrypt message after reloading storage; state was lost");
}

#[wasm_bindgen_test]
fn test_mls_messaging_flow() {
    set_master_key(vec![1;32]);
    let alice_identity = b"alice";
    let bob_identity = b"bob";

    // setup for bob
    let bob_pub = init(bob_identity).expect("Failed to init Bob");
    let bob_kpkg = generate_key_package().expect("Failed to generate Bob's key package");
    
    // Save Bob's state so we can switch contexts to Alice
    let bob_storage = get_storage(NONCE_BOB).expect("Failed to save Bob's storage");

    // setup alice
    let _alice_pub = init(alice_identity).expect("Failed to init Alice");
    
    // Alice creates the group
    let group_id = create_group().expect("Failed to create Alice's group");

    // Alice invites Bob
    let welcome_msg = invite(&bob_kpkg, &group_id).expect("Failed to invite Bob");
    
    // Alice exports the ratchet tree for Bob
    let ratchet_tree = export_ratchet_tree(&group_id).expect("Failed to export ratchet tree");

    // Alice encrypts a message for the group
    let plain_msg = b"Hello Bob!";
    let encrypted_msg = encrypt_message(&group_id, plain_msg).expect("Failed to encrypt message");

    // Reload Bob's state (simulating Bob opening his app / context switching)
    load_storage(&bob_storage, NONCE_BOB, &bob_pub, bob_identity)
        .expect("Failed to load Bob's storage");

    // Bob accepts the invitation
    let bob_group_id = accept_invitation(&welcome_msg, &ratchet_tree)
        .expect("Failed to accept invitation");
    
    assert_eq!(group_id, bob_group_id, "Group IDs should match between sender and receiver");

    // Bob processes and decrypts the message
    let processed = process_message(&bob_group_id, &encrypted_msg)
        .expect("Failed to process message");
        
    let decrypted_msg = processed.expect("Expected an application message, got a staged commit");

    assert_eq!(decrypted_msg, plain_msg, "Decrypted message must match original payload");
}
