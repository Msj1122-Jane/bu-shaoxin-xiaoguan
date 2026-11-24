// Node 端按清单加载与浏览器/微信相同的源文件
const path = require('node:path');
const list = require('../../src/modules.list.json');
for (const f of list.core) require(path.join(__dirname, '../../src', f));
module.exports = globalThis.BSX;
