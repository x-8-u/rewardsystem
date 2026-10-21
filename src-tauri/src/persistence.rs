// ===== 持久化层：JSON 文件原子读写 =====
// 文件位置：app_data_dir/state.json
// 写入策略：先写 .tmp，再 rename，保证原子性，避免半写损坏。

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const STATE_FILE: &str = "state.json";

pub fn state_file(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("app_data_dir unavailable");
    let _ = std::fs::create_dir_all(&dir);
    dir.join(STATE_FILE)
}

pub fn load(app: &AppHandle) -> serde_json::Value {
    let p = state_file(app);
    match std::fs::read_to_string(&p) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_else(|_| serde_json::json!({})),
        Err(_) => serde_json::json!({}),
    }
}

pub fn save(app: &AppHandle, v: &serde_json::Value) -> Result<(), String> {
    let p = state_file(app);
    let tmp = p.with_extension("json.tmp");
    let body = serde_json::to_string_pretty(v).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, body).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &p).map_err(|e| e.to_string())?;
    Ok(())
}
