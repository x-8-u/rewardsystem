// ===== 状态迁移层 =====
// 设计原则：JS 端 state.js 的 migrateState 是单一事实源。
// Rust 端仅做最小字段补全（确保是 object、保留 meta），不做业务字段迁移。
// 真正的字段补全由 JS 端 migrateState 在加载后完成，避免双份维护。

use serde_json::Value;

pub fn migrate(mut v: Value) -> Value {
    if !v.is_object() {
        return serde_json::json!({});
    }
    let obj = v.as_object_mut().expect("checked object");
    // meta 字段（小 flag 聚合）
    if !obj.contains_key("meta") {
        obj.insert("meta".into(), serde_json::json!({}));
    }
    v
}
