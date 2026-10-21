// ===== Tauri 命令：暴露给前端 invoke 的接口 =====
// 前端通过 @tauri-apps/api/core 的 invoke 调用。

use crate::{migration, persistence, state::AppState};
use serde_json::Value;
use tauri::{AppHandle, State};

/// 读取完整状态（启动时由前端 initState 调用一次）
#[tauri::command]
pub fn load_state(state: State<'_, AppState>) -> Value {
    state.0.lock().clone()
}

/// 写入完整状态（前端防抖落盘调用）
#[tauri::command]
pub fn save_state(
    v: Value,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    *state.0.lock() = v.clone();
    persistence::save(&app, &v)
}

/// 立即落盘（窗口关闭/手动 flush 时调用，跳过前端防抖）
#[tauri::command]
pub fn flush_state(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let v = state.0.lock().clone();
    persistence::save(&app, &v)
}

/// 导出：返回完整 JSON 字符串，前端拿到后写文件
#[tauri::command]
pub fn export_state(state: State<'_, AppState>) -> Result<String, String> {
    serde_json::to_string_pretty(&*state.0.lock()).map_err(|e| e.to_string())
}

/// 导入：接收 JSON Value，迁移后写入内存与磁盘
#[tauri::command]
pub fn import_state(
    v: Value,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let migrated = migration::migrate(v);
    *state.0.lock() = migrated.clone();
    persistence::save(&app, &migrated)?;
    Ok(migrated)
}

/// 清零：用空状态覆盖
#[tauri::command]
pub fn reset_state(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let empty = serde_json::json!({});
    *state.0.lock() = empty.clone();
    persistence::save(&app, &empty)
}

/// 读取小 flag（soundEnabled / healthNoticeShown / onboardingShown / lastDailySigninDate）
/// 统一存在 state.meta.<key> 中，避免散落多个 localStorage key
#[tauri::command]
pub fn get_flag(key: String, state: State<'_, AppState>) -> Value {
    let guard = state.0.lock();
    guard
        .get("meta")
        .and_then(|m| m.get(&key))
        .cloned()
        .unwrap_or(Value::Null)
}

/// 写入小 flag
#[tauri::command]
pub fn set_flag(
    key: String,
    value: Value,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.0.lock();
    let obj = guard
        .as_object_mut()
        .ok_or_else(|| "state is not an object".to_string())?;
    let meta = obj
        .entry("meta".to_string())
        .or_insert_with(|| Value::Object(serde_json::Map::new()));
    if let Some(m) = meta.as_object_mut() {
        m.insert(key, value);
    }
    let v = guard.clone();
    drop(guard);
    persistence::save(&app, &v)
}
