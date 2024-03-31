use tauri::api::process::{Command, CommandEvent};

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

#[tauri::command]
async fn mount(path: String) -> u32 {
    let app = app::get_ui_app();
    let key = app.get_secret_base58();
    let (_, child) = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(["mount", "-p", &path, "-k", &key, "-o", "json"])
        .spawn()
        .expect("msg");
    let pid = child.pid();
    app.add_mounted_path(&path, child);
    pid
}

#[tauri::command]
async fn unmount(path: String) {
    let child = app::get_ui_app()
        .remove_mounted_child(&path)
        .expect("No child process found for path");
    let res = child.kill();
    res.expect("Error killing child process");
}

#[tauri::command]
async fn get_status(path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_secret_base58();
    let (res, _) = spawn_sidecar(["status", "-p", &path, "-k", &key, "-o", "json"]).await;
    res
}

async fn spawn_sidecar<I, S>(args: I) -> (String, String)
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let (mut rx, _) = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(args)
        .spawn()
        .expect("msg");
    let stdout = tauri::async_runtime::spawn(async move {
        let mut stdout: String = "".to_string();
        let mut stderr: String = "".to_string();
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                stdout = format!("{}{}", stdout, line);
            } else if let CommandEvent::Stderr(line) = event {
                stderr = format!("{}{}", stdout, line);
            }
        }
        (stdout, stderr)
    });
    let res = stdout.await;
    res.unwrap()
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
        .invoke_handler(tauri::generate_handler![
            set_new_secret,
            check_set_secret,
            mount,
            unmount,
            get_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
