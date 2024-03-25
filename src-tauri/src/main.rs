// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use argon2::{password_hash::rand_core::Error, Argon2, Params};
use std::sync::Once;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn set_secret(secret: &str, salt: &str) -> bool {
    let app = get_ui_app();
    app.set_secret(secret.to_string(), salt);
    true
}

static mut UI_APP: Option<UiApp> = None;
static INIT: Once = Once::new();

/// Returns a mutable reference to the `UiApp` instance, initializing it if necessary.
fn get_ui_app() -> &'static mut UiApp {
    unsafe {
        INIT.call_once(|| {
            UI_APP = Some(UiApp::new());
        });
        UI_APP.as_mut().unwrap()
    }
}

/// Represents the UI application.
struct UiApp {
    key: Vec<u8>,
}

impl UiApp {
    /// Creates a new `UiApp` instance with an empty secret.
    fn new() -> Self {
        Self { key: vec![0, 32] }
    }

    /// Runs the Tauri application.
    fn run(&self) {
        tauri::Builder::default()
            .plugin(tauri_plugin_store::Builder::default().build())
            .invoke_handler(tauri::generate_handler![set_secret])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }

    // Derives a key from the secret and sets it.
    fn set_secret(&mut self, secret: String, salt: &str) {
        self.key = Self::derive_key_from_secret(&secret, salt.as_bytes()).unwrap();
    }

    /// Derives a key from the secret using Argon2id.
    fn derive_key_from_secret(secret: &str, salt: &[u8]) -> Result<Vec<u8>, Error> {
        let params = Params::new(64 * 1024, 2, 8, Some(32)).unwrap();
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
        let mut key = vec![0; 32];
        if let Err(err) = argon2.hash_password_into(secret.as_bytes(), salt, &mut key) {
            panic!("Error hashing password: {:?}", err);
        }
        Ok(key)
    }
}

fn main() {
    let ui_app = get_ui_app();
    ui_app.run();
}
