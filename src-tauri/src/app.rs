use anyhow::{anyhow, Result};
use argon2::{Argon2, Params};
use bs58;
use chacha20poly1305::aead::generic_array::GenericArray;
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Key, Nonce,
};
use hkdf::Hkdf;
use rand::RngCore;
use sha2::Sha256;
use std::collections::HashMap;
use std::sync::Once;
use tauri::api::process::CommandChild;

static mut UI_APP: Option<UiApp> = None;
static INIT: Once = Once::new();

/// Represents the payload for creating a new instance.
#[derive(Clone, serde::Serialize)]
pub struct NewInstancePayload {
    args: Vec<String>,
    cwd: String,
}

impl NewInstancePayload {
    /// Creates a new `NewInstancePayload` instance.
    pub fn new(args: Vec<String>, cwd: String) -> Self {
        Self { args, cwd }
    }
}

/// Returns a mutable reference to the `UiApp` instance, initializing it if necessary.
pub fn get_ui_app() -> &'static mut UiApp {
    unsafe {
        INIT.call_once(|| {
            UI_APP = Some(UiApp::new());
        });
        UI_APP.as_mut().unwrap()
    }
}

/// Represents the UI application.
pub struct UiApp {
    root_key: String,
    mounted_paths: HashMap<String, CommandChild>,
}

const CHA_CHA20_POLY1350_V1_INFO: &str = "cognitechbridge.com/v1/ChaCha20Poly1350";

impl UiApp {
    /// Creates a new `UiApp` instance with an empty secret.
    fn new() -> Self {
        Self {
            root_key: "".to_string(),
            mounted_paths: HashMap::new(),
        }
    }

    /// Derives a key from the secret and sets it.
    pub fn set_new_secret(&mut self, secret: &str, salt: &str, key: &str) -> Result<String> {
        let secret_key = Self::derive_key_from_secret(secret, salt.as_bytes())?;
        let encrypted_key = self.encrypt_root_key(key, &secret_key)?;
        self.root_key = key.to_string();
        Ok(encrypted_key)
    }

    /// Encrypts a key using a key derived from the secret.
    pub fn encrypt_by_secret(&self, secret: &str, salt: &str, plain: &str) -> Result<String> {
        let secret_key = Self::derive_key_from_secret(secret, salt.as_bytes())?;
        let encrypted = self.encrypt_plain_by_key(&plain.as_bytes().to_vec(), &secret_key)?;
        Ok(encrypted)
    }

    /// Decrypts a text using a key derived from the secret.
    pub fn decrypt_by_secret(&self, secret: &str, salt: &str, encrypted: &str) -> Result<String> {
        let secret_key = Self::derive_key_from_secret(secret, salt.as_bytes())?;
        let decrypted = self.decrypt_by_key(encrypted, &secret_key)?;
        Ok(String::from_utf8(decrypted).unwrap())
    }

    /// Checks if the secret is valid and sets the key.
    pub fn check_set_secret(
        &mut self,
        secret: &str,
        salt: &str,
        encrypted_key: &str,
    ) -> Result<bool> {
        let derived_key = Self::derive_key_from_secret(secret, salt.as_bytes())?;
        let decrypt_result = self.decrypt_root_key(encrypted_key, &derived_key);
        let is_valid = decrypt_result.is_ok();
        if is_valid {
            self.root_key = decrypt_result.unwrap()
        }
        Ok(is_valid)
    }

    /// Adds a mounted path to the list of mounted paths.
    pub fn add_mounted_path(&mut self, path: &str, command_child: CommandChild) {
        self.mounted_paths.insert(path.to_string(), command_child);
    }

    /// Returns a mounted child process by path.
    pub fn get_mounted_child(&mut self, path: &str) -> Option<&mut CommandChild> {
        self.mounted_paths.get_mut(path)
    }

    /// Removes a mounted child process by path and returns it.
    pub fn remove_mounted_child(&mut self, path: &str) -> Option<CommandChild> {
        self.mounted_paths.remove(path)
    }

    /// Derives a key from the secret using Argon2id.
    fn derive_key_from_secret(secret: &str, salt: &[u8]) -> Result<Vec<u8>> {
        let argon2 = Self::generate_argon()?;
        let mut key = vec![0; 32];
        if let Err(err) = argon2.hash_password_into(secret.as_bytes(), salt, &mut key) {
            panic!("Error hashing password: {:?}", err);
        }
        Ok(key)
    }

    /// Generates an Argon2 instance with the recommended parameters.
    fn generate_argon() -> Result<Argon2<'static>> {
        let params = Params::new(64 * 1024, 2, 8, Some(32)).unwrap();
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
        Ok(argon2)
    }

    pub fn get_root_key(&self) -> String {
        self.root_key.clone()
    }

    /// Encrypts a plain text using ChaCha20Poly1305.
    pub fn encrypt_plain_by_key(&self, plain: &Vec<u8>, secret_key: &[u8]) -> Result<String> {
        // Generate a random salt
        let mut salt = [0u8; 32];
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut salt);
        // Derive a key from the root key, salt, and repo name
        let derived_key = Self::derive_key(secret_key, &salt, CHA_CHA20_POLY1350_V1_INFO)?;
        // Encrypt the key using ChaCha20Poly1305
        let cipher = ChaCha20Poly1305::new(&derived_key);
        let nonce = Nonce::from_slice(&[0u8; 12]); // 96-bit zroed nonce
        let ciphertext = cipher
            .encrypt(nonce, plain.as_slice())
            .expect("encryption failure!");
        // Encode the salt and ciphertext as base58
        let salt_string = bs58::encode(salt).into_string();
        let ciphertext_string = bs58::encode(ciphertext).into_string();
        // Combine the salt and ciphertext
        let encrypted_key = format!("{}:{}", salt_string, ciphertext_string);
        Ok(encrypted_key)
    }

    /// Decrypts a encrypted with ChaCha20Poly1305.
    pub fn decrypt_by_key(&self, encrypted: &str, secret_key: &[u8]) -> Result<Vec<u8>> {
        // Split the encrypted key into salt and ciphertext parts
        let parts: Vec<&str> = encrypted.split(':').collect();
        if parts.len() != 2 {
            return Err(anyhow!("Invalid encrypted key"));
        }

        // Decode the salt and ciphertext from base58
        let salt = bs58::decode(parts[0]).into_vec().unwrap();
        let ciphertext = bs58::decode(parts[1]).into_vec().unwrap();

        // Derive the key using the same method as in encryption
        let derived_key = Self::derive_key(secret_key, &salt, CHA_CHA20_POLY1350_V1_INFO)?;

        // Decrypt the ciphertext using ChaCha20Poly1305
        let cipher = ChaCha20Poly1305::new(&derived_key);
        let nonce = Nonce::from_slice(&[0u8; 12]); // 96-bit zeroed nonce, same as encryption
        let plain_result = cipher.decrypt(nonce, ciphertext.as_ref());
        if plain_result.is_err() {
            return Err(anyhow!("Error decrypting key"));
        }

        Ok(plain_result.unwrap())
    }

    /// Encrypts a repository key using ChaCha20Poly1305.
    pub fn encrypt_root_key(&self, root_key: &str, secret_key: &[u8]) -> Result<String> {
        let decoded_key = bs58::decode(root_key).into_vec().unwrap();
        self.encrypt_plain_by_key(&decoded_key, secret_key)
    }

    /// Decrypts a repository key encrypted with ChaCha20Poly1305.
    pub fn decrypt_root_key(&self, encrypted_root_key: &str, secret_key: &[u8]) -> Result<String> {
        let unencrypted_key = self.decrypt_by_key(encrypted_root_key, secret_key)?;

        // Convert the unencrypted key to a base58-encoded string
        let unencrypted_encoded_key = bs58::encode(unencrypted_key).into_string();

        Ok(unencrypted_encoded_key)
    }

    /// Derives a key from the root key, salt, and info using HKDF and SHA-256.
    fn derive_key(root_key: &[u8], salt: &[u8], info: &str) -> Result<Key> {
        // Derive a key from the root key, salt, and info using HKDF and SHA-256
        let hk = Hkdf::<Sha256>::new(Some(salt), root_key);
        let mut derived_key = GenericArray::default();

        // Extract and expand the key
        hk.expand(info.as_bytes(), &mut derived_key)
            .expect("Error deriving key from root key, salt, and info");

        Ok(derived_key)
    }
}
