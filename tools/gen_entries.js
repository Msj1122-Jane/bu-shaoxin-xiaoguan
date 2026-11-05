// 由 src/modules.list.json 生成 index.html（浏览器）与 game.js（微信）的加载段。新增源文件只改清单。
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const L = require(path.join(root, 'src/modules.list.json'));
const web = L.core.concat(L.game, L.web);
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
  <title>不烧心小馆</title>
  <style>
    html, body { margin: 0; height: 100%; background: #1d1712; overflow: hidden; overscroll-behavior: none; }
    canvas { display: block; touch-action: none; -webkit-user-select: none; user-select: none; outline: none; }
  </style>
</head>
<body>
  <canvas id="game" tabindex="0" aria-label="不烧心小馆：横屏早餐铺经营与做饭游戏。键盘 Tab 切换焦点，回车确认，P 暂停，F 全屏。"></canvas>
${web.map(f => `  <script src="src/${f}"></script>`).join('\n')}
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
const wx = L.core.concat(L.game, L.wechat);
const game = `// 微信小游戏入口（由 tools/gen_entries.js 生成）。需在微信开发者工具与真机验证，见 docs/WECHAT_GUIDE.md。
${wx.map(f => `require('./src/${f}');`).join('\n')}
var P = BSX.require('platform/wechat').create();
var manifest = require('./assets/runtime/manifest.js');
GameGlobal.__app = new (BSX.require('app').App)(P, manifest);
`;
fs.writeFileSync(path.join(root, 'game.js'), game);
// 微信不支持 require JSON：生成 manifest.js
const m = fs.readFileSync(path.join(root, 'assets/runtime/manifest.json'), 'utf8');
fs.writeFileSync(path.join(root, 'assets/runtime/manifest.js'), 'module.exports = ' + m.trim() + ';\n');
console.log('index.html / game.js / manifest.js generated:', web.length, 'web files,', wx.length, 'wechat files');
