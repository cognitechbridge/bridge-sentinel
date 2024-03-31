use tauri::api::process::{Command, CommandEvent};

pub mod app;

/// Sets a new secret using the provided `secret` and `salt`.
/// Returns the hashed secret as a `String`.
#[tauri::command]
fn set_new_secret(secret: &str, salt: &str) -> String {
    let app = app::get_ui_app();
    let hashed_secret = app.set_new_secret(secret, salt).unwrap();
    hashed_secret.to_string()
}

/// Checks if the provided `secret` matches the `hash` and `salt`.
/// Returns `true` if the secret matches, `false` otherwise.
#[tauri::command]
fn check_set_secret(secret: &str, hash: &str, salt: &str) -> bool {
    let app = app::get_ui_app();
    app.check_set_secret(secret, hash, salt).unwrap()
}

/// Mounts the specified `path` asynchronously.
/// Returns the process ID of the mounted path as a `u32`.
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

/// Unmounts the specified `path`
#[tauri::command]
fn unmount(path: String) {
    let child = app::get_ui_app()
        .remove_mounted_child(&path)
        .expect("No child process found for path");
    let res = child.kill();
    res.expect("Error killing child process");
}

/// Initializes the specified `path` asynchronously.
#[tauri::command]
async fn init(path: String) -> u32 {
    let app = app::get_ui_app();
    let key = app.get_secret_base58();
    let (_, child) = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(["init", "-p", &path, "-k", &key, "-o", "json"])
        .spawn()
        .expect("msg");
    let pid = child.pid();
    app.add_mounted_path(&path, child);
    pid
}

/// Gets the status of the specified `path` asynchronously.
/// Returns the status as a `String`.
#[tauri::command]
async fn get_status(path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_secret_base58();
    let (res, _) = spawn_sidecar(["status", "-p", &path, "-k", &key, "-o", "json"]).await;
    res
}

/// Spawns a sidecar process with the provided arguments asynchronously.
/// Returns the stdout and stderr output as a tuple of `String`.
async fn spawn_sidecar<I, S>(args: I) -> (String, String)
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let (mut rx, _) = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(args)
        .spawn()
        .expect("error while spawning sidecar process");
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

/// Runs the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            set_new_secret,
            check_set_secret,
            mount,
            unmount,
            init,
            get_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
