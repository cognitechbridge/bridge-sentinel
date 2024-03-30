// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use ui::get_ui_app;

fn main() {
    let ui_app = get_ui_app();
    ui_app.run();
}
