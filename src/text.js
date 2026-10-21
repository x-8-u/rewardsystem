// ===== 周易文本加载与解析 =====
// 文本通过 Vite ?raw 静态导入，打进 bundle，离线可用，无需 fetch。
// 解析逻辑保持不变，仅数据来源从 fetch 改为 import。

import benjingRaw from './assets/text/周易本经.txt?raw';
import daxiangRaw from './assets/text/大象传.txt?raw';
import guafuRaw  from './assets/text/卦符.txt?raw';

let _benjingCache = null;   // 周易本经：{卦名: 文本块}
let _daxiangCache = null;   // 大象传：{卦名: 象曰内容}
let _guafuCache = null;     // 卦符：{卦名: 卦符字符}

// 解析周易本经：按 ━━━ 分隔线切块，从标题行提取卦名
function parseBenjing(text) {
  const cache = {};
  const blocks = text.split(/^━+$/m);
  for (const block of blocks) {
    const m = block.match(/第[一二三四五六七八九十百]+卦\s+(.+?)（/);
    if (m) cache[m[1].trim()] = block.trim();
  }
  return cache;
}

// 解析大象传：每行 "卦名-象曰：内容"
function parseDaxiang(text) {
  const cache = {};
  text.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line === '下经') return;
    const idx = line.indexOf('-');
    if (idx > 0) {
      cache[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
  });
  return cache;
}

// 解析卦符：每行 "卦名：卦符"
function parseGuafu(text) {
  const cache = {};
  text.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    const idx = line.indexOf('：');
    if (idx > 0) {
      cache[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
  });
  return cache;
}

// 兼容旧接口：仍返回 Promise，但实际是同步解析
export async function loadHexagramTexts() {
  if (_benjingCache && _daxiangCache && _guafuCache) return;
  _benjingCache = parseBenjing(benjingRaw);
  _daxiangCache = parseDaxiang(daxiangRaw);
  _guafuCache = parseGuafu(guafuRaw);
}

export function getBenjingText(name) {
  return _benjingCache ? (_benjingCache[name] || '') : '';
}

export function getDaxiangText(name) {
  return _daxiangCache ? (_daxiangCache[name] || '') : '';
}

export function getGuafuText(name) {
  return _guafuCache ? (_guafuCache[name] || '') : '';
}
