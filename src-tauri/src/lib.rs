pub mod app;

#[tauri::command]
fn set_new_secret(secret: &str, salt: &str) -> String {
    let app = app::get_ui_app();
    let hashed_secret = app.set_new_secret(secret, salt).unwrap();
    hashed_secret.to_string()
}

#[tauri::command]
fn check_set_secret(secret: &str, hash: &str, salt: &str) -> bool {
    let app = app::get_ui_app();
    app.check_set_secret(secret, hash, salt).unwrap()
}

// #[tauri::command]
// fn sample(secret: &str, salt: &str, app_handle: tauri::AppHandle) {
//     let stores = app_handle.state::<StoreCollection<Wry>>();
//     let path = PathBuf::from("config.json");
//     with_store(app_handle.clone(), stores, path, |store| {
//         store.insert("a".to_string(), json!("b")).unwrap();
//         store.save()
//     })
//     .unwrap();
// }

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![set_new_secret, check_set_secret])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
