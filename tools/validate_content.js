// 构建前内容与资源引用校验：node tools/validate_content.js（失败时退出码 1，不覆盖上一份有效配置）
const fs = require('fs'), path = require('path');
const BSX = require('../tests/helpers/load.js');
const root = path.resolve(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'assets/runtime/manifest.json'), 'utf8'));
const missing = m.entries.filter(e => !fs.existsSync(path.join(root, 'assets/runtime', e.path))).map(e => e.path);
const v = BSX.require('core/validate').run(m.entries.map(e => e.id));
if (missing.length) v.errors.push('资源文件缺失：' + missing.join(', '));
console.log(JSON.stringify(v.counts));
v.warnings.forEach(w => console.log('WARN', w));
v.errors.forEach(e => console.log('ERROR', e));
console.log(v.errors.length ? '内容校验失败' : '内容校验通过');
process.exit(v.errors.length ? 1 : 0);
