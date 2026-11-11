// 微信小游戏构建与静态兼容检查：node tools/build_wechat.js
// 产出 dist/wechat/（可直接用微信开发者工具“导入项目”），并打印检查报告。真机与工具内运行需要用户账号（HUMAN_TASKS H02）。
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'dist/wechat');
require('./gen_entries.js');
const L = require(path.join(root, 'src/modules.list.json'));
const files = L.core.concat(L.game, L.wechat);
fs.rmSync(out, { recursive: true, force: true });
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
files.forEach(f => copy(path.join(root, 'src', f), path.join(out, 'src', f)));
copy(path.join(root, 'game.js'), path.join(out, 'game.js'));
fs.writeFileSync(path.join(out, 'game.json'), JSON.stringify({ deviceOrientation: 'landscape', showStatusBar: false, networkTimeout: { request: 10000, downloadFile: 10000 } }, null, 1));
const pc = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
pc.compileType = 'game'; pc.setting = Object.assign({ es6: true, minified: true }, pc.setting || {}); delete pc.packOptions;
fs.writeFileSync(path.join(out, 'project.config.json'), JSON.stringify(pc, null, 1));
const m = JSON.parse(fs.readFileSync(path.join(root, 'assets/runtime/manifest.json'), 'utf8'));
m.entries = m.entries.filter(e => e.group !== 'unused' && e.group !== 'story'); // 剧情美术（约 9MB）不进小游戏主包：后续放 CDN，缺图时代码已有降级
const wxDir = fs.existsSync(path.join(root, 'assets/runtime_wx')) ? 'assets/runtime_wx' : 'assets/runtime';
m.entries.forEach(e => { copy(path.join(root, wxDir, e.path), path.join(out, 'assets/runtime', e.path)); e.bytes = fs.statSync(path.join(out, 'assets/runtime', e.path)).size; });
fs.writeFileSync(path.join(out, 'assets/runtime/manifest.js'), 'module.exports = ' + JSON.stringify(m) + ';\n');
// 配乐（tools/compose_music.py 生成的 mp3）
const audDir = fs.existsSync(path.join(root, 'assets/runtime_wx/audio')) ? path.join(root, 'assets/runtime_wx/audio') : path.join(root, 'assets/runtime/audio'); if (fs.existsSync(audDir)) fs.readdirSync(audDir).filter(f => f.endsWith('.mp3')).forEach(f => copy(path.join(audDir, f), path.join(out, 'assets/runtime/audio', f)));
// ── 检查
const report = { errors: [], warnings: [], info: {} };
const FORBID = [/\bdocument\./, /\blocalStorage\b/, /\bfetch\(/, /new Image\(/, /\bURLSearchParams\b/, /\bperformance\./, /\bnavigator\./, /\bwindow\.(?!__)/];
files.filter(f => f !== 'platform/wechat.js').forEach(f => {
  const src = fs.readFileSync(path.join(root, 'src', f), 'utf8');
  src.split('\n').forEach((line, i) => { FORBID.forEach(re => { if (re.test(line) && !/typeof window/.test(line)) report.errors.push(`${f}:${i + 1} 使用了微信不可用的 API：${line.trim().slice(0, 90)}`); }); });
  if (/\.filter\s*=/.test(src)) report.warnings.push(f + '：ctx.filter 在微信中不生效（仅影响图鉴未解锁剪影的灰度，已有透明度兜底）');
  if (/soft-light/.test(src)) report.warnings.push(f + '：soft-light 混合模式在部分微信基础库不支持，不支持时退化为普通叠加（清晨暖光略弱）');
});
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]);
const all = walk(out), total = all.reduce((s, f) => s + fs.statSync(f).size, 0);
report.info.files = all.length; report.info.totalKB = Math.round(total / 1024);
report.info.codeKB = Math.round(all.filter(f => f.endsWith('.js')).reduce((s, f) => s + fs.statSync(f).size, 0) / 1024);
report.info.assetsKB = Math.round(all.filter(f => /\.(png|jpg)$/.test(f)).reduce((s, f) => s + fs.statSync(f).size, 0) / 1024);
if (total > 4 * 1024 * 1024) report.errors.push('主包超过 4MB：' + report.info.totalKB + 'KB（需要分包）');
// 入口 require 与文件一致
const game = fs.readFileSync(path.join(out, 'game.js'), 'utf8');
(game.match(/require\('\.\/(.+?)'\)/g) || []).forEach(r => { const p = r.slice(11, -2); if (!fs.existsSync(path.join(out, p))) report.errors.push('game.js 引用缺失：' + p); });
m.entries.forEach(e => { if (!fs.existsSync(path.join(out, 'assets/runtime', e.path))) report.errors.push('资源缺失：' + e.path); });
if (pc.appid === 'touristappid') report.warnings.push('project.config.json 仍为游客 AppID：真机预览与上传需替换为自己的小游戏 AppID（H02）');
fs.writeFileSync(path.join(root, 'docs/WECHAT_BUILD_REPORT.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
process.exit(report.errors.length ? 1 : 0);
