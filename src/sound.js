// ===== 音效系统 =====
// 统一管理所有音效的预加载、播放与开关状态。
// 开关状态：Tauri 模式下存入 Rust state.meta.soundEnabled；浏览器回退到 localStorage。
// 资源路径：Vite 通过 import.meta.url 处理，生产构建自动 hash。

import { CONFIG } from './config.js';
import { getFlag, setFlag, isTauri } from './bridge.js';

// 音效文件：Vite ?url 后缀返回构建后 URL，dev 与 prod 都正确
import shakeUrl from './assets/sound/shake.mp3?url';
import spinUrl  from './assets/sound/spin.mp3?url';
import coinUrl  from './assets/sound/coin.mp3?url';
import bonusUrl from './assets/sound/bonus.mp3?url';
import clickUrl from './assets/sound/click.mp3?url';

const SOUND_PATHS = {
  shake: shakeUrl,
  spin:  spinUrl,
  coin:  coinUrl,
  bonus: bonusUrl,
  click: clickUrl
};

// 预加载音频对象，避免首次播放延迟
const _audioCache = {};
Object.keys(SOUND_PATHS).forEach(key => {
  const audio = new Audio(SOUND_PATHS[key]);
  audio.preload = 'auto';
  audio.load();
  _audioCache[key] = audio;
});

// 开关状态：异步加载，默认开。Tauri 用 set_flag，浏览器用 localStorage。
let _enabled = true;
let _loaded = false;

// 启动时异步读取开关状态（main.js initState 之后自动触发）
(async () => {
  try {
    const v = await getFlag(CONFIG.SOUND_ENABLED_KEY);
    // Tauri 返回值可能是 '0'/'1' 字符串或 boolean/null
    if (v === null || v === undefined) _enabled = true;
    else if (typeof v === 'string') _enabled = v !== '0';
    else _enabled = !!v;
  } catch {
    _enabled = true;
  }
  _loaded = true;
})();

export function isSoundEnabled() {
  return _enabled;
}

export async function setSoundEnabled(enabled) {
  _enabled = !!enabled;
  // Tauri 存 '1'/'0' 字符串，浏览器存同款以兼容
  await setFlag(CONFIG.SOUND_ENABLED_KEY, _enabled ? '1' : '0');
}

// 播放指定音效（仅在开关开启时播放）
export function playSound(name) {
  if (!_enabled) return;
  const base = _audioCache[name];
  if (!base) return;
  try {
    // 克隆节点以支持快速连续播放
    const audio = base.cloneNode(true);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (e) {
    // 克隆失败时回退到新建 Audio
    try {
      const audio = new Audio(SOUND_PATHS[name]);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e2) {}
  }
}
