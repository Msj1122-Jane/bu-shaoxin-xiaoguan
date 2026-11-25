// 网页发布包：node tools/build_web.js [输出目录，默认 dist/web]
// 把 40 个脚本按加载顺序合成一个 game.bundle.js（网速慢时少 39 次往返），连同图片拷到输出目录。
// 开发时照常用根目录的 index.html（逐个加载源文件，改完刷新即可）。
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.resolve(root, process.argv[2] || 'dist/web');
const L = require(path.join(root, 'src/modules.list.json'));
const files = L.core.concat(L.game, L.web);
// 只去掉整行注释和行尾多余空白，不改代码本身
const strip = src => src.split('\n').filter(l => !/^\s*\/\/(?!#)/.test(l)).map(l => l.replace(/\s+$/, '')).filter(l => l.length).join('\n');
const bundle = files.map(f => '/* ' + f + ' */\n' + strip(fs.readFileSync(path.join(root, 'src', f), 'utf8'))).join('\n;\n') +
  "\n;(function(){var b=document.getElementById('boot');if(b)b.parentNode.removeChild(b);})();\n";
const ver = Date.now().toString(36);
const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
  <title>不烧心小馆</title>
  <style>
    html, body { margin: 0; height: 100%; background: #1d1712; overflow: hidden; overscroll-behavior: none; }
    canvas { display: block; touch-action: none; -webkit-user-select: none; user-select: none; outline: none; }
    #boot { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; color: #d8c8a8; font: 18px "PingFang SC","Microsoft YaHei",sans-serif; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div id="boot">灶上的水快开了…</div>
  <canvas id="game" tabindex="0" aria-label="不烧心小馆：横屏早餐铺经营与做饭游戏。键盘 Tab 切换焦点，回车确认，P 暂停，F 全屏。"></canvas>
  <script src="game.bundle.js?v=${ver}"></script>
</body>
</html>
`;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'game.bundle.js'), bundle);
fs.cpSync(path.join(root, 'assets/runtime'), path.join(out, 'assets/runtime'), { recursive: true });
let imgs = 0; (function walk(d) { fs.readdirSync(d).forEach(f => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else imgs += fs.statSync(p).size; }); })(path.join(out, 'assets/runtime'));
console.log(out, '脚本', files.length, '个合成', Math.round(bundle.length / 1024) + 'K；图片', Math.round(imgs / 1024) + 'K');
