use openmls::prelude::*;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MlsError {
    #[error("error trying to validate keypackage: {0}")]
    ValidationError(String),
    #[error("error trying to deserialize data: {0}")]
    DeserializationError(String),
    #[error("No provider")]
    NoProvider,
    #[error("No credentials")]
    NoCredentials,
    #[error("No signature keypair")]
    NoSkp,
    #[error("Unknown error occured: {0}")]
    Unknown(String),
}

pub fn key_package_from_bytes(bytes: &[u8]) -> Result<KeyPackage, MlsError> {
    return KeyPackageIn::tls_deserialize_exact_bytes(bytes)
        .map_err(|e| MlsError::DeserializationError(e.to_string()))?
        .validate(
            &openmls_rust_crypto::RustCrypto::default(),
            ProtocolVersion::Mls10,
        )
        .map_err(|e| MlsError::ValidationError(e.to_string()));
}

pub fn group_id_from_bytes(bytes: &[u8]) -> Result<GroupId, MlsError> {
    return GroupId::tls_deserialize_exact_bytes(bytes)
        .map_err(|e| MlsError::DeserializationError(e.to_string()));
}

pub fn ratchet_tree_from_bytes(bytes: &[u8]) -> Result<RatchetTreeIn, MlsError> {
    return RatchetTreeIn::tls_deserialize_exact_bytes(bytes)
        .map_err(|e| MlsError::DeserializationError(e.to_string()));
}

pub fn welcome_message_from_bytes(bytes: &[u8]) -> Result<Welcome, MlsError> {
    let (mls_message_in, remaining_bytes) = MlsMessageIn::tls_deserialize_bytes(bytes)
        .map_err(|e| MlsError::DeserializationError(e.to_string()))?;

    // Check if we consumed all bytes
    if !remaining_bytes.is_empty() {
        return Err(MlsError::DeserializationError(format!(
            "Extra bytes after deserialization: {} bytes remaining",
            remaining_bytes.len()
        )));
    }

    // and inspect the message.
    return match mls_message_in.extract() {
        MlsMessageBodyIn::Welcome(welcome) => Ok(welcome),
        // We know it's a welcome message, so we ignore all other cases.
        _ => Err(MlsError::DeserializationError(String::from(
            "invalid mls message type. expected welcome message.",
        ))),
    };
}

pub fn message_from_bytes(bytes: &[u8]) -> Result<ProtocolMessage, MlsError> {
    let (mls_message_in, _) = MlsMessageIn::tls_deserialize_bytes(bytes)
        .map_err(|e| MlsError::DeserializationError(e.to_string()))?;

    return match mls_message_in.extract() {
        MlsMessageBodyIn::PublicMessage(message) => Ok(message.into()),
        MlsMessageBodyIn::PrivateMessage(message) => Ok(message.into()),
        _ => Err(MlsError::DeserializationError(String::from(
            "invalid mls message type. expected public message or private message.",
        ))),
    };
}
