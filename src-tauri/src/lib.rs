// ===== 应用入口（库形态） =====
// main.rs 仅调用 run()，便于移动端/测试复用。

mod commands;
mod migration;
mod persistence;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 已有实例运行时，把已有窗口聚焦到前台
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState::default())
        .setup(|app| {
            // 启动时一次性把磁盘 state.json 载入到内存
            let loaded = persistence::load(app.handle());
            *app.state::<AppState>().0.lock() = loaded;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_state,
            commands::save_state,
            commands::export_state,
            commands::import_state,
            commands::reset_state,
            commands::get_flag,
            commands::set_flag,
            commands::flush_state,
        ])
        .on_window_event(|window, event| {
            // 关闭窗口前强制落盘，避免防抖丢数据
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let app = window.app_handle();
                let state = app.state::<AppState>();
                let v = state.0.lock().clone();
                let _ = persistence::save(app, &v);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
