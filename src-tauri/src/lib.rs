use tauri::{
    api::process::{Command, CommandEvent},
    Manager,
};

pub mod app;

/// Sets a new secret using the provided `secret` and `salt`.
/// Returns the hashed secret as a `String`.
#[tauri::command]
fn set_new_secret(secret: &str, salt: &str, root_key: &str) -> String {
    let app = app::get_ui_app();
    let encrypted_key = app.set_new_secret(secret, salt, root_key).unwrap();
    encrypted_key.to_string()
}

/// Encrypts the provided `plain` text using the provided `secret` and `salt`.
/// Returns the encrypted text as a `String`.
#[tauri::command]
fn encrypt_by_secret(secret: &str, salt: &str, plain: &str) -> String {
    let app = app::get_ui_app();
    app.encrypt_by_secret(secret, salt, plain).unwrap()
}

/// Decrypts the provided `encrypted` text using the provided `secret`.
/// Returns the decrypted text as a `String`.
#[tauri::command]
fn decrypt_by_secret(secret: &str, salt: &str, encrypted: &str) -> String {
    let app = app::get_ui_app();
    app.decrypt_by_secret(secret, salt, encrypted).unwrap()
}

/// Checks if the provided `secret` matches the `hash` and `salt`.
/// Returns `true` if the secret matches, `false` otherwise.
#[tauri::command]
fn check_set_secret(secret: &str, salt: &str, encrypted_root_key: &str) -> bool {
    let app = app::get_ui_app();
    app.check_set_secret(secret, salt, encrypted_root_key)
        .unwrap()
}

/// Mounts the specified `path` asynchronously.
/// Returns the process ID of the mounted path as a `u32`.
#[tauri::command]
async fn mount(path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_root_key();
    let (mut rx, child) = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(["mount", "-p", &path, "-k", &key, "-o", "json"])
        .spawn()
        .expect("msg");
    app.add_mounted_path(&path, child);

    let mut stdout = String::new();
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                let (comment, modified_line) = check_and_remove_comment(line.as_str());
                stdout.push_str(modified_line.as_str());
                stdout.push('\n');
                if comment {
                    break;
                }
            }
            CommandEvent::Stderr(line) => {
                let (comment, modified_line) = check_and_remove_comment(line.as_str());
                stdout.push_str(modified_line.as_str());
                stdout.push('\n');
                if comment {
                    break;
                }
            }
            CommandEvent::Error(_) => {}
            _ => {}
        }
    }
    stdout
}

/// Checks if the provided `string` contains "/*" and returns a tuple of a boolean indicating if "/*" is present and the modified string.
fn check_and_remove_comment(string: &str) -> (bool, String) {
    if let Some(index) = string.find("/*") {
        let modified_string = string[..index].to_string();
        (true, modified_string)
    } else {
        (false, string.to_string())
    }
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

/// Shares the specified `path` with the specified `recipient` asynchronously.
#[tauri::command]
async fn share(repo_path: String, recipient: String, path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_root_key();
    let (res, _) = spawn_sidecar([
        // -j: join if not already joined, -r: recipient
        "share", "-j", &path, "-p", &repo_path, "-r", &recipient, "-k", &key, "-o", "json",
    ])
    .await;
    res
}

/// Unshares the specified `path` with the specified `recipient` asynchronously.
#[tauri::command]
async fn unshare(repo_path: String, recipient: String, path: String) -> String {
    let (res, _) = spawn_sidecar([
        // -j: join if not already joined, -r: recipient
        "unshare", &path, "-p", &repo_path, "-r", &recipient, "-o", "json",
    ])
    .await;
    res
}

/// Initializes the specified `path` asynchronously.
#[tauri::command]
async fn init(path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_root_key();
    let (res, _) = spawn_sidecar(["init", "-p", &path, "-k", &key, "-o", "json"]).await;
    res
}

/// Gets the status of the specified `path` asynchronously.
/// Returns the status as a `String`.
#[tauri::command]
async fn get_status(path: String) -> String {
    let app = app::get_ui_app();
    let key = app.get_root_key();
    let (res, _) = spawn_sidecar(["status", "-p", &path, "-k", &key, "-o", "json"]).await;
    res
}

/// Lists the access of the specified `path` asynchronously.
#[tauri::command]
async fn list_access(repo_path: String, path: String) -> String {
    let (res, _) = spawn_sidecar(["list-access", &path, "-p", &repo_path, "-o", "json"]).await;
    res
}

/// Spawns a sidecar process with the provided arguments asynchronously.
/// Returns the stdout and stderr output as a tuple of `String`.
async fn spawn_sidecar<I, S>(args: I) -> (String, String)
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let output = Command::new_sidecar("storage")
        .expect("failed to create sidecar")
        .args(args)
        .output()
        .expect("error while spawning sidecar process");

    (output.stdout, output.stderr)
}

/// Runs the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit_all("new-instance", app::NewInstancePayload::new(argv, cwd))
                .unwrap();
        }))
        .invoke_handler(tauri::generate_handler![
            set_new_secret,
            encrypt_by_secret,
            decrypt_by_secret,
            check_set_secret,
            mount,
            unmount,
            init,
            get_status,
            share,
            unshare,
            list_access
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
