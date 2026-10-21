// ===== Tauri 应用前端入口 =====
// 职责：
// 1. 启动时从 Rust 侧加载 state，完成 migrate（initState）
// 2. 绑定 data-ext-url 外链 → 系统浏览器打开
// 3. 调用 events.js 的 initEvents() 完成事件绑定与首屏渲染

import { initState } from './state.js';
import { openExternal } from './bridge.js';
import { initEvents } from './events.js';

async function bootstrap() {
  // 1. 异步加载并迁移状态（必须先于 initEvents，否则首屏读到空 state）
  await initState();

  // 2. 绑定所有 data-ext-url 外链 → 系统浏览器打开
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-ext-url]');
    if (!link) return;
    e.preventDefault();
    const url = link.getAttribute('data-ext-url');
    if (url) openExternal(url);
  });

  // 3. 事件绑定 + 首屏渲染
  initEvents();
}

// 模块脚本是 defer 的，DOM 已就绪；直接启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
