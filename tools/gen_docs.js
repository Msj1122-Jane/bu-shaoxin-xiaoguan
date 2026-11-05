// 由内容配置与资源清单生成 docs/NARRATIVE_MAP.md 与 docs/ASSET_USAGE.md，保证文档与代码一致。
const fs = require('fs'), path = require('path');
const BSX = require('../tests/helpers/load.js');
const root = path.resolve(__dirname, '..');
const D = BSX.require('content/dishes'), R = BSX.require('content/regulars'), E = BSX.require('content/events'), ST = BSX.require('content/story'), EN = BSX.require('content/endings');
const T = { tense: '紧张', daily: '日常', relax: '松拍' };
let n = '# 叙事地图（NARRATIVE_MAP）\n\n> 由 `node tools/gen_docs.js` 从 `src/content/` 生成，勿手改。文案为 AI 初稿，待 T2 审校（HUMAN_TASKS H03/H04）。\n\n';
n += '## 六幕与 7 段 S 级主线演出\n\n| 幕 | 日 | S 演出 | 相位 | 玩家动作 | 分支/变体 |\n| --- | --- | --- | --- | --- | --- |\n';
const actNames = ['序幕·开门', '第一幕·留下的人', '第二幕·便宜的代价', '第三幕·一句话传开', '第四幕·这条街的晚饭', '终幕·月底'];
const walk = (beats, f) => beats.forEach(b => { f(b); if (b.then) walk(b.then, f); if (b.else) walk(b.else, f); });
ST.acts.forEach((a, i) => {
  const ids = Object.keys(ST.main).filter(k => ST.main[k].day >= a[0] && ST.main[k].day <= a[1]);
  ids.forEach(id => { const s = ST.main[id]; const acts = [], ch = [], ifs = []; walk(s.beats, b => { if (b.act) acts.push(b.act.label); if (b.choice) b.choice.forEach(c => ch.push(c.label)); if (b.eventChoice) E.byId[b.eventChoice].choices.forEach(c => ch.push(c.label)); if (b.if) ifs.push(Object.keys(b.if).join('+')); });
    n += `| ${actNames[i]} | ${a[0]}–${a[1]} | ${id} ${s.title}（第${s.day}日） | ${s.phase === 'pre' ? '开店前' : '营业后'} | ${acts.join('；') || '—'} | ${ch.join(' / ') || '—'}${ifs.length ? '；条件片段：' + ifs.join('、') : ''} |\n`; });
});
n += '\n## 八位常客与 24 个故事节点（好感 3 / 5 / 7）\n\n| 常客 | 识别点 | 到访偏好 | 节点 3 | 节点 5 | 节点 7 | 解锁 |\n| --- | --- | --- | --- | --- | --- | --- |\n';
R.list.forEach(r => { const v = r.visit; const pref = [v.price[0] > 1.2 ? '亲民价' : '', v.material[2] > 1.2 ? '可追溯' : v.material[1] > 1.2 ? '鲜货' : '', v.oil[2] > 1.2 ? '新油' : '', v.rain > 1.2 ? '雨天' : '', v.burnPause ? '烧心≥' + v.burnPause + '暂停' : '', v.morning ? '清晨' : ''].filter(Boolean).join('、') || '全档位';
  n += `| ${r.full} | ${r.tag} | ${pref} | ${r.nodes.map(x => x.title + '（' + ST.all[x.cs].tier + '）').join(' | ')} | ${r.nodes.filter(x => x.unlock).map(x => D.byId[x.unlock].name).join('、') || '—'} |\n`; });
n += '\nA 级 16 段 = 每人节点 5、7；节点 3 为短演出（B 级舞台）。节点按好感阈值在营业后触发，每日至多 2 段。\n';
n += '\n## 30 张事件\n\n| ID | 名称 | 类型 | 阶段 | 出现条件 | 选项 → 后果 |\n| --- | --- | --- | --- | --- | --- |\n';
E.list.forEach(e => { const w = JSON.stringify(e.when).replace(/[{}"]/g, '').replace(/,/g, ' '); n += `| ${e.id} | ${e.name} | ${T[e.type]} | ${e.phase === 'pre' ? '开店前' : '营业后'} | ${e.story ? '第22日主线内' : e.fixed ? '固定第27日' : e.chainOnly ? 'E05 试用/隐瞒后 3 日' : (w || '无') + (e.once ? ' · 一次性' : ' · 冷却' + e.cd + '日')} | ${e.choices.map(c => c.label + '：' + Object.entries(c.effect || {}).map(([k, v]) => k + '=' + (typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '') : v)).join(' ')).join('<br>')} |\n`; });
n += '\n## 8 个结局（判定顺序见 GDD §10.1，实现见 core/run.determineEnding）\n\n| ID | 结局 | 条件 | 回放路线（tools/sim.js） |\n| --- | --- | --- | --- |\n';
const route = { E_HONEST: 'honest', E_PRIVATE: 'private', E_CANTEEN: 'canteen', E_REOPEN: 'reopen', E_PILLS: 'pills', E_FAREWELL: 'farewell', E_TRANSFER: 'transfer', E_SOMEONE: 'average' };
EN.list.forEach(e => { n += `| ${e.id} | ${e.name} | ${e.cond} | ${route[e.id]} |\n`; });
n += '\n## 七日常营业主题\n\n' + EN.themes.map(t => `- **${t.name}**：${t.desc} 目标三选一：${t.goals.map(g => g.label).join(' / ')}`).join('\n') + '\n\n## 传承物\n\n' + EN.heirlooms.map(h => `- ${h.name}：${h.desc}`).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'docs/NARRATIVE_MAP.md'), n);
// 资源
const m = JSON.parse(fs.readFileSync(path.join(root, 'assets/runtime/manifest.json'), 'utf8'));
let a = '# 运行时资源（ASSET_USAGE）\n\n> 由 `node tools/gen_docs.js` 从 `assets/runtime/manifest.json` 生成。所有运行时图片经统一清单按组加载（boot 首屏 / chars 人物 / late 延迟）。缺图时显示洋红棋盘占位并记入 `__bsx.errors()`。中文全部由程序渲染。\n\n';
a += '| 资源 ID | 运行时路径 | 尺寸 | 图集 | 加载组 | 来源 | 用途 | 许可状态 | 占位 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
m.entries.forEach(e => { a += `| ${e.id} | assets/runtime/${e.path} | ${e.w}×${e.h} | ${e.cols ? e.cols + '×' + e.rows : '—'} | ${e.group} | ${e.source} | ${e.use || '—'} | ${e.license} | ${e.use && e.use.indexOf('未使用') === 0 ? '未使用' : '否'} |\n`; });
const total = m.entries.reduce((s, e) => s + e.bytes, 0);
a += `\n合计 ${m.entries.length} 个文件，${(total / 1024 / 1024).toFixed(2)} MB；首屏组 boot ${(m.entries.filter(e => e.group === 'boot').reduce((s, e) => s + e.bytes, 0) / 1024 / 1024).toFixed(2)} MB。\n\n`;
a += '## 程序化绘制（开发占位，已登记 HUMAN_TASKS H16）\n\n- 路人与配角（房东、供应商、检查员、博主、同行、回收商、帮工、摄像、学生、街坊）：`game/actors.js` 32×64 像素小人放大。\n- 菜品补图：煎蛋、蛋炒饭、糖油果子、叶儿粑（`game/assets.js` proc）；骨汤鸡汤面/米线/羊肉汤/荷包蛋面用图集格位叠色或叠加。\n- 道具：租约、笔记本、手机、菜筐、面案、增香粉、价牌、茶杯、公交车、南瓜、蜡烛等（`game/cutscene.js` drawProp）。\n- 平底锅、炒锅、蒸笼、卤锅的操作台小图与近景锅面（`game/cooking.js`）。\n- 卷帘门、雨丝、落叶、行人剪影、灯笼光晕、积水反光（`game/scene.js`）。\n- 全部音效与环境音为 WebAudio 程序合成（`game/audio.js`，D008，H05）。\n\n## 资产包中未进入运行时的目录\n\n`01_原始视觉方案/ 02_Lovart/ 03_ImageGen/ 04_旧原型参考/ 05_PPT拆图归档/ 08_Lovart生成预览_待换高清/ 09_Claude占位图/` 仅作参考，不打包。`11_Lovart_2K原图/` 已由 `tools/build_assets.py` 处理为 `assets/runtime/atlas/`。\n';
fs.writeFileSync(path.join(root, 'docs/ASSET_USAGE.md'), a);
console.log('docs generated');
