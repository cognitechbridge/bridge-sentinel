// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Once;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn set_secret(secret: &str) -> bool {
    let app = get_ui_app();
    app.set_secret(secret.to_string());
    true
}

static mut UI_APP: Option<UiApp> = None;
static INIT: Once = Once::new();

fn get_ui_app() -> &'static mut UiApp {
    unsafe {
        INIT.call_once(|| {
            UI_APP = Some(UiApp::new());
        });
        UI_APP.as_mut().unwrap()
    }
}

struct UiApp {
    secret: String,
}

impl UiApp {
    fn new() -> Self {
        Self {
            secret: "".to_string(),
        }
    }

    fn run(&self) {
        tauri::Builder::default()
            .plugin(tauri_plugin_store::Builder::default().build())
            .invoke_handler(tauri::generate_handler![set_secret])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }

    fn set_secret(&mut self, secret: String) {
        self.secret = secret;
    }

    fn get_secret(&self) -> &str {
        &self.secret
    }
}

fn main() {
    let ui_app = UiApp::new();
    ui_app.run();
}
