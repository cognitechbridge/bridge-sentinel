use anyhow::Result;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2, Params,
};
use std::sync::Once;

static mut UI_APP: Option<UiApp> = None;
static INIT: Once = Once::new();

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
    key: Vec<u8>,
}

impl UiApp {
    /// Creates a new `UiApp` instance with an empty secret.
    fn new() -> Self {
        Self { key: vec![0, 32] }
    }

    /// Derives a key from the secret and sets it.
    pub fn set_new_secret(&mut self, secret: &str, salt: &str) -> Result<String> {
        self.key = Self::derive_key_from_secret(secret, salt.as_bytes())?;
        let hash_secret = Self::hash_secret(secret)?;
        Ok(hash_secret)
    }

    /// Checks if the secret matches the stored hash.
    pub fn check_secret(&self, secret: &str, hash: &str) -> Result<bool> {
        let argon2 = Argon2::default();
        let password_hash = PasswordHash::new(hash).unwrap();
        let is_valid = argon2
            .verify_password(secret.as_bytes(), &password_hash)
            .is_ok();
        Ok(is_valid)
    }

    /// Hashes a secret using Argon2id.
    fn hash_secret(secret: &str) -> Result<String> {
        let argon2 = Self::generate_argon()?;

        let salt = SaltString::generate(&mut OsRng);
        let password_hash = argon2
            .hash_password(secret.as_bytes(), &salt)
            .unwrap()
            .to_string();
        Ok(password_hash)
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
}
