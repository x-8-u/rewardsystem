import { defineConfig } from 'vite';

// Tauri 专用 Vite 配置
// 关键：strictPort 防止端口顺延导致 Tauri 加载到别的软件界面
export default defineConfig({
  base: './',                // 相对路径，兼容 GitHub Pages 子路径部署（Tauri 桌面端同样可用）
  clearScreen: false,
  server: {
    port: 2000,
    strictPort: true,           // 端口被占用直接报错，绝不顺延
    host: '127.0.0.1',          // 仅本机访问，避免暴露到局域网
    watch: {
      // 忽略 Rust 端，避免触发前端 HMR
      ignored: ['**/src-tauri/**'],
    },
  },
  // 仅暴露 VITE_/TAURI_ 前缀变量给前端
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri webview 支持 es2021
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false,
    // 输出到 dist，与 tauri.conf.json 的 frontendDist 对齐
    outDir: 'dist',
    emptyOutDir: true,
  },
});
