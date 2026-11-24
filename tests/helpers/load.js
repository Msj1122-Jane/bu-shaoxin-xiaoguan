// Node 测试加载：只载入 core 组（规则与内容，不含画面）
const path = require('path'), root = path.resolve(__dirname, '../..');
require(path.join(root, 'src/modules.list.json')).core.forEach(f => require(path.join(root, 'src', f)));
module.exports = globalThis.BSX;
