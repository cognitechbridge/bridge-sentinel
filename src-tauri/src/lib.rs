use argon2::{password_hash::rand_core::Error, Argon2, Params};
use std::{path::PathBuf, sync::Once};
use tauri::Manager;

use serde_json::json;
use tauri::Wry;
use tauri_plugin_store::with_store;
use tauri_plugin_store::StoreCollection;

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

#[tauri::command]
fn set_secret(secret: &str, salt: &str, app_handle: tauri::AppHandle) -> bool {
    let stores = app_handle.state::<StoreCollection<Wry>>();
    let path = PathBuf::from("config.json");
    println!("path: {:?}", path);

    with_store(app_handle.clone(), stores, path, |store| {
        store.insert("a".to_string(), json!("b"));
        store.save()
    });

    let app = get_ui_app();
    app.set_secret(secret.to_string(), salt);
    true
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

    /// Runs the Tauri application.
    pub fn run(&self) {
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
