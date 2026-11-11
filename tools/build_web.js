// 网页版构建：node tools/build_web.js → dist/web/（可直接放到 GitHub Pages / 任意静态托管）
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'dist/web');
require('./gen_entries.js');
const L = require(path.join(root, 'src/modules.list.json'));
fs.rmSync(out, { recursive: true, force: true });
const copy = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
L.core.concat(L.game, L.web).forEach(f => copy(path.join(root, 'src', f), path.join(out, 'src', f)));
copy(path.join(root, 'index.html'), path.join(out, 'index.html'));
const m = JSON.parse(fs.readFileSync(path.join(root, 'assets/runtime/manifest.json'), 'utf8'));
m.entries = m.entries.filter(e => e.group !== 'unused');
const src = fs.existsSync(path.join(root, 'assets/runtime_wx')) ? 'assets/runtime_wx' : 'assets/runtime';
m.entries.forEach(e => { const from = fs.existsSync(path.join(root, src, e.path)) ? path.join(root, src, e.path) : path.join(root, 'assets/runtime', e.path); copy(from, path.join(out, 'assets/runtime', e.path)); e.bytes = fs.statSync(path.join(out, 'assets/runtime', e.path)).size; });
fs.writeFileSync(path.join(out, 'assets/runtime/manifest.json'), JSON.stringify(m));
// 配乐（tools/compose_music.py 生成的 mp3）
const audDir = path.join(root, 'assets/runtime/audio'); if (fs.existsSync(audDir)) fs.readdirSync(audDir).filter(f => f.endsWith('.mp3')).forEach(f => copy(path.join(audDir, f), path.join(out, 'assets/runtime/audio', f)));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, x) => s + (x.isDirectory() ? size(path.join(d, x.name)) : fs.statSync(path.join(d, x.name)).size), 0);
console.log('dist/web built:', Math.round(size(out) / 1024), 'KB');
