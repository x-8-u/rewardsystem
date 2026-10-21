// ===== Tauri 桥接层 =====
// 统一封装 invoke 调用，隔离 @tauri-apps/api 依赖，便于测试与未来替换。
// 同时提供 Web 回退（非 Tauri 环境降级到 localStorage），保证纯浏览器预览仍可用。

import { invoke } from '@tauri-apps/api/core';
import { open as openShell } from '@tauri-apps/plugin-shell';

// 检测是否运行在 Tauri webview 中
const IS_TAURI = typeof window !== 'undefined'
  && '__TAURI_INTERNALS__' in window;

export const isTauri = () => IS_TAURI;

// ---- 状态持久化 ----
export async function loadState() {
  if (IS_TAURI) return invoke('load_state');
  // 浏览器回退
  try {
    const raw = localStorage.getItem('rewardWheelState');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function saveState(v) {
  if (IS_TAURI) return invoke('save_state', { v });
  localStorage.setItem('rewardWheelState', JSON.stringify(v));
}

export async function flushState() {
  if (IS_TAURI) return invoke('flush_state');
  // 浏览器环境无防抖，无需 flush
}

export async function exportState() {
  if (IS_TAURI) return invoke('export_state');
  return localStorage.getItem('rewardWheelState') || '{}';
}

export async function importState(v) {
  if (IS_TAURI) return invoke('import_state', { v });
  localStorage.setItem('rewardWheelState', JSON.stringify(v));
  return v;
}

export async function resetState() {
  if (IS_TAURI) return invoke('reset_state');
  localStorage.removeItem('rewardWheelState');
}

// ---- 小 flag（meta 字段） ----
export async function getFlag(key) {
  if (IS_TAURI) return invoke('get_flag', { key });
  return localStorage.getItem(key);
}

export async function setFlag(key, value) {
  if (IS_TAURI) return invoke('set_flag', { key, value });
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

// ---- 外链：系统浏览器打开 ----
export function openExternal(url) {
  if (IS_TAURI) {
    openShell(url).catch(e => console.error('[shell.open] 失败:', e));
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ---- 剪贴板（带 Tauri 回退） ----
export async function writeClipboard(text) {
  if (IS_TAURI) {
    try {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
      return true;
    } catch (e) {
      console.warn('[clipboard] Tauri 写入失败，回退 web:', e);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 最终回退：execCommand
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
