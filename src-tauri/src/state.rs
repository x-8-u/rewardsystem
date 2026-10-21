// ===== 应用内存态 =====
// 用 parking_lot::Mutex 保护 serde_json::Value，前端通过命令读写。
// 选择 Value 而非强类型：兼容 JS 端 migrateState 的字段演进，避免 Rust 端频繁改动。

use parking_lot::Mutex;
use serde_json::Value;

pub struct AppState(pub Mutex<Value>);

impl Default for AppState {
    fn default() -> Self {
        Self(Mutex::new(Value::Object(serde_json::Map::new())))
    }
}
