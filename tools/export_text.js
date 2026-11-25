// 导出游戏里的全部文字：node tools/export_text.js [输出路径]
// 读内容数据（剧情、常客线、下午、结局、环境语料、菜、人物），再从界面代码里摘出写死的中文字符串。
const fs = require('fs'), path = require('path'), root = path.resolve(__dirname, '..');
require(path.join(root, 'src/modules.js'));
const L = require(path.join(root, 'src/modules.list.json'));
L.core.forEach(f => require(path.join(root, 'src', f)));
const St = BSX.require('content/story'), Cast = BSX.require('content/cast'), D = BSX.require('content/dishes'), Tn = BSX.require('content/town'), E = BSX.require('content/endings');
const out = [], P = s => out.push(s);
const who = id => id === 'z' ? '老周' : St.who(id);
const dish = id => { const [a, m] = String(id).split(':'); return (D.byId[a] ? D.byId[a].name : a) + (m ? '（' + m + '）' : ''); };
const ENDN = { HONEST: '贵是贵点，吃了不烧心', CANTEEN: '街坊食堂', PRIVATE: '私房小馆', REOPEN: '整改重开', PILLS: '胃药和账单', FAREWELL: '常客送行', TRANSFER: '转让', SOMEONE: '还是有人来了' };
const FLAG = { returned_extra: '还过多给的钱', kept_extra: '收下了多给的钱', viral_good: '视频口碑好', viral_bad: '视频翻车', viral_plain: '视频不咸不淡', crisis_rectify: '危机后停业整改', crisis_refund: '危机后逐个退赔', crisis_hold: '危机后硬撑', renewed: '续了租', chipin: '街坊凑了押金', left: '没续租', powder_used: '用过增香粉', powder_hidden: '偷偷用增香粉', cheap_mutton: '收了无票羊肉', slip_ever: '贴过进货单', hood: '装了排烟罩', helper: '请了帮工', awning: '搭了雨棚', rent_late: '房租没交齐' };
function flagName(f) { if (FLAG[f]) return FLAG[f]; if (/^end_/.test(f)) return '结局：' + (ENDN[f.slice(4)] || f.slice(4)); return f; }
function rng(r, unit) { if (!Array.isArray(r)) r = [r]; return r[1] == null ? '≥' + r[0] + (unit || '') : r[0] === r[1] ? r[0] + (unit || '') : r[0] + '–' + r[1] + (unit || ''); }
function needText(n) {
  if (!n) return '';
  const a = [];
  if (n.day) a.push(Array.isArray(n.day) && n.day[1] != null ? '第 ' + n.day[0] + (n.day[1] !== n.day[0] ? '–' + n.day[1] : '') + ' 天' : '第 ' + [].concat(n.day)[0] + ' 天起');
  if (n.aff) for (const k in n.aff) a.push(who(k) + '好感≥' + n.aff[k]);
  if (n.affSum) a.push('好感合计' + rng(n.affSum));
  if (n.flags) a.push(n.flags.map(flagName).join('、'));
  if (n.not) a.push('没有：' + n.not.map(flagName).join('、'));
  if (n.seen) a.push('看过：' + n.seen.join('、'));
  if (n.unseen) a.push('没看过：' + n.unseen.join('、'));
  if (n.weather) a.push({ rain: '下雨', sun: '晴天', cloud: '阴天' }[n.weather]);
  if (n.burn) a.push('烧心' + rng(n.burn)); if (n.rep) a.push('口碑' + rng(n.rep)); if (n.cash) a.push('手头' + rng(n.cash, '元'));
  if (n.oilAge) a.push('油用了' + rng(n.oilAge, '天'));
  if (n.price) a.push('价位：' + [].concat(n.price).map(v => ['薄利', '公道', '提价'][v]).join('到'));
  if (n.priceAvg) a.push('近五天均价' + rng(n.priceAvg));
  if (n.mat) a.push('用料：' + [].concat(n.mat).map(v => ['冻品', '鲜货', '好料'][v]).join('到'));
  if (n.menu) a.push('菜单有' + n.menu.map(dish).join('、'));
  if (n.helper != null) a.push(n.helper ? '请了帮工' : '没请帮工');
  if (n.posted != null) a.push(n.posted ? '今天贴了进货单' : '今天没贴进货单');
  if (n.fast != null) a.push(n.fast ? '昨天出餐快' : '昨天出餐慢');
  if (n.quality) a.push('昨天出品' + rng(n.quality));
  if (n.credit) a.push('老葛欠账' + rng(n.credit, '元'));
  if (n.any) a.push('其一：' + n.any.map(needText).join(' / '));
  return a.join('，');
}
function fxText(f) {
  if (!f) return [];
  const a = [];
  if (f.memento) { const m = St.memento(f.memento); a.push('留下了「' + m.name + '」：' + m.text); }
  if (f.fact) a.push('小本子记下：' + (St.facts[f.fact[0] + '/' + f.fact[1]] || f.fact[1]));
  if (f.unlock) [].concat(f.unlock).forEach(d => a.push('学会了' + dish(d)));
  if (f.later && f.later.note) a.push('（过几天晚账上：' + f.later.note + '）');
  return a;
}
function beats(list, ind) {
  ind = ind || '';
  (list || []).forEach(b => {
    if (Array.isArray(b)) { P(ind + (b[0] === 'n' ? '> *（老周心里）' + b[1] + '*' : '**' + who(b[0]) + '**：' + b[1])); P(''); return; }
    if (b.enter) { P(ind + '（' + who(b.enter) + '走过来）'); P(''); }
    if (b.prop && !b.off && b.label) { P(ind + '〔' + b.label + '〕'); P(''); }
    if (b.do) { P(ind + '【' + (b.do === 'hold' ? '' : '') + b.label + '】'); P(''); }
    if (b.fx) fxText(b.fx).forEach(t => { P(ind + '✦ ' + t); P(''); });
    if (b.if) { P(ind + '▸ **如果' + (needText(b.if) || '条件满足') + '：**'); P(''); beats(b.then, ind + '> '); if (b.else && b.else.length) { P(ind + '▸ **否则：**'); P(''); beats(b.else, ind + '> '); } }
    if (b.choice) { P(ind + '◆ **选择：**'); P(''); b.choice.forEach(c => { P(ind + '- **' + c.label + '**' + (c.hint ? '（' + c.hint + '）' : '') + (c.need ? ' ［需要：' + needText(c.need) + '］' : '')); fxText(c.fx).forEach(t => P(ind + '  - ✦ ' + t)); }); P(''); b.choice.forEach(c => { if (c.then && c.then.some(x => Array.isArray(x) || x.choice || x.if)) { P(ind + '▸ 选「' + c.label + '」之后：'); P(''); beats(c.then, ind + '> '); } }); }
  });
}
function scene(sc, h) { P(h + ' ' + (sc.title || sc.id) + '　`' + sc.id + '`'); P(''); const meta = []; if (sc.day) meta.push('第 ' + sc.day + ' 天'); if (sc.when) meta.push({ open: '开门前', close: '收摊后', town: '下午' }[sc.when] || sc.when); if (sc.need) meta.push(needText(sc.need)); if (meta.length) { P('*' + meta.join(' · ') + '*'); P(''); } beats(sc.beats); }

const date = new Date().toISOString().slice(0, 10);
P('# 《不烧心小馆》全部文字（柳河街重制版 V3）'); P('');
P('导出日期 ' + date + '。由 `tools/export_text.js` 从游戏源码自动生成，改了内容后重跑一次即可更新。'); P('');
P('读法：**粗体名字**是说话的人；*（老周心里）* 是旁白；【】是玩家要做的动作；〔〕是摆上柜台的东西；✦ 是这句话带来的结果（留下的东西、小本子、学会的菜）；▸ 是按经营情况分叉；◆ 是玩家的选择。早市里的话很短，是因为它们显示在客人头顶的小气泡里。'); P('');
P('## 目录'); P('');
['一、主线（按天）', '二、每日事件', '三、八位常客', '四、下午外出', '五、结局与回响', '六、街上的声音（散客、排队、晚账）', '七、菜、添置、旧物、配角', '八、界面上写死的文字'].forEach(t => P('- ' + t)); P('');

// 一、主线
P('## 一、主线（按天）'); P('');
Object.keys(St.scenes).map(k => St.scenes[k]).filter(s => !s.event && !s.who && !s.fallback && (s.day || s.id === 'crisis' || s.id === 'rescue'))
  .sort((a, b) => (a.day || 99) - (b.day || 99) || (a.when === 'open' ? -1 : 1)).forEach(s => scene(s, '###'));
// 二、事件
P('## 二、每日事件'); P(''); P('没有主线戏的日子，从满足条件的事件里抽一场，放在开门前或收摊后。'); P('');
St.events.forEach(s => scene(s, '###'));

// 三、常客
P('## 三、八位常客'); P('');
const BTAG = { in: '到柜台', good: '吃得好', ok: '还行', bad: '没吃好', slow: '等久了', out: '走的时候' };
const BARK = { in: '平常进门', inRain: '下雨天', inOilOld: '油用旧了', inPriceUp: '提价那几天', inPriceDown: '薄利那几天', inBusy: '人多的时候', good: '吃得好', ok: '还行', bad: '没吃好', slow: '等久了', out: '走的时候' };
const ACT = { overpay: '多给了钱（点硬币可以还回去）', credit: '赊账', repay: '还账', treat: '替后面的人付钱', coins: '一把数好的硬币', peek: '只站着看，不买', absent: '今天没来', big: '大单' };
const COMP = { zhao: '豆豆' };
St.regIds.forEach(id => {
  const r = St.regs[id], c = Cast.regulars[id];
  P('### ' + r.full + '（' + r.name + '）'); P('');
  if (r.firstNote) { P('*' + r.firstNote + '*'); P(''); }
  P('**老样子**：' + r.usual.map(dish).join('、')); P('');
  P('#### 早市里的节拍'); P('');
  r.beats.forEach((b, i) => {
    const meta = [needText(b.need)]; if (b.hide) meta.push('票据只写"老样子"'); if (b.act) meta.push(ACT[b.act] || b.act); if (b.togo) meta.push('打包');
    P('**' + (i + 1) + '. `' + b.id + '`**　' + meta.filter(Boolean).join('；')); P('');
    if (Array.isArray(b.order) && b.order.length) { P('点：' + b.order.map(o => typeof o === 'string' ? dish(o) : '说不清，要「' + o.wish + '」的').join('、')); P(''); }
    if (b.note) { P('备料板上的条子：' + b.note); P(''); }
    const s = b.say || {};
    Object.keys(BTAG).forEach(k => { if (s[k]) P('- ' + BTAG[k] + '：' + s[k]); });
    if (s.chat) { P('- 点"…"接话：'); s.chat.forEach(l => P('  - **' + (l[0] === 'a' ? r.name : l[0] === 'z' ? '老周' : (COMP[id] || '同行的人')) + '**：' + l[1])); }
    if (b.remark) P('- 没来，' + (b.remark.who === 'walkin' ? '有客人' : who(b.remark.who)) + '提了一句：' + b.remark.line);
    if (b.leave) P('- 落下东西：' + (b.leave.line || '') + '（' + St.memento(b.leave.memento).name + '）');
    [b.fx, b.fxGood, b.fxBad].forEach(f => fxText(f).forEach(t => P('- ✦ ' + t)));
    if (b.after) P('- 当晚收摊加演：「' + (St.scenes[b.after] ? St.scenes[b.after].title : b.after) + '」');
    P('');
  });
  const own = Object.keys(St.scenes).filter(k => St.scenes[k].who === id && !/^v_/.test(k));
  if (own.length) { P('#### 收摊后的戏'); P(''); own.forEach(k => scene(St.scenes[k], '#####')); }
  const vis = Object.keys(St.scenes).filter(k => St.scenes[k].who === id && /^v_/.test(k));
  if (vis.length) { P('#### 下午串门（' + Tn.visits[id].place + '）'); P(''); vis.forEach(k => scene(St.scenes[k], '#####')); }
  P('#### 平常日子的话'); P('');
  Object.keys(BARK).forEach(k => { if (r.barks[k] && r.barks[k].length) P('- **' + BARK[k] + '**：' + r.barks[k].join(' ／ ')); }); P('');
  P('#### 小本子'); P(''); Object.keys(r.factText).forEach(k => P('- ' + r.factText[k])); P('');
  const ms = Object.keys(St.mementos).filter(k => St.mementos[k].who === id);
  if (ms.length) { P('#### 留下的东西'); P(''); ms.forEach(k => P('- **' + St.mementos[k].name + '**：' + St.mementos[k].text)); P(''); }
  P('#### 结局里的他／她'); P(''); r.epilogue.forEach(e => P('- ' + (e.need ? '［' + needText(e.need) + '］' : '［其他情况］') + ' ' + e.text)); P('');
});

// 四、下午
P('## 四、下午外出'); P(''); P('第 3–27 天收摊后，只够去一个地方。'); P('');
Tn.places.forEach(p => P('- **' + p.name + '**（第 ' + p.from + ' 天起）：' + p.desc)); P('');
P('### 批发市场：三家摊子'); P(''); Object.keys(Tn.sellers).forEach(k => P('- **' + Tn.sellers[k].name + '**：' + Tn.sellers[k].line)); P('');
P('### 批发市场：货和线索（闻一闻 ／ 看标签 ／ 上手掂）'); P('');
Object.keys(Tn.goods).forEach(k => { const g = Tn.goods[k]; P('**' + g.name + '**'); P(''); P('- 好货：' + g.good.join(' ／ ')); P('- 坏货：' + g.bad.join(' ／ ')); P(''); });
P('看不出名堂时：看不出什么名堂。'); P('');
P('### 7 路总站：包餐'); P(''); Tn.orders.forEach(o => P('- **' + o.who + '**（' + dish(o.dish) + ' ×' + o.n + (o.need ? '；' + needText(o.need) : '') + '）：' + o.line)); P('');
P('### 桥头'); P(''); Object.keys(Tn.forecast).forEach(w => P('- ' + { sun: '明天晴', cloud: '明天阴', rain: '明天雨' }[w] + '：' + Tn.forecast[w].join(' ／ '))); P(''); P('河边看到的：'); P(''); Tn.riverLines.forEach(l => P('- ' + l)); P('');
P('串门的戏见第三部分每位常客下面。'); P('');

// 五、结局
P('## 五、结局与回响'); P('');
St.endIds.forEach(id => { const e = St.endings[id]; P('### ' + e.title + '　`' + id + '`'); P(''); P('招牌上写：' + (e.sign ? '「' + e.sign + '」' : '（空着）')); P(''); if (e.mood) { P('*' + e.mood + '*'); P(''); } (e.text || []).forEach(t => { P(t); P(''); }); if (e.letter) { P('一张字条（' + (e.letter.from === 'best' ? '好感最高的常客' : who(e.letter.from)) + '）：' + e.letter.text); P(''); } if (e.last) { P('最后一句：' + e.last); P(''); } });
P('### 回响（"这个月，你……"，取满足条件的前四条）'); P(''); St.echoes.forEach(e => P('- ［' + (needText(e.need) || '任何情况') + '］' + e.text)); P('');

// 六、环境
const A = St.ambient, ARCH = { student: '学生', office: '上班族', worker: '干活的', elder: '老人', parent: '带娃的', rider: '骑手' }, WK = { in: '进门', good: '吃得好', ok: '还行', bad: '没吃好', slow: '等久了', soldout: '卖完了', treat: '被人请客' };
P('## 六、街上的声音'); P(''); P('### 散客'); P('');
Object.keys(A.walkins).forEach(k => { P('**' + (ARCH[k] || k) + '**'); P(''); Object.keys(WK).forEach(t => { if (A.walkins[k][t]) P('- ' + WK[t] + '：' + A.walkins[k][t].join(' ／ ')); }); P(''); });
P('### 说不清要什么的时候'); P(''); Object.keys(A.wish).forEach(k => P('- 要「' + k + '」的：' + A.wish[k].join(' ／ '))); P('');
P('### 做法要求'); P(''); Object.keys(A.mods).forEach(k => P('- ' + k + '：' + A.mods[k].join(' ／ '))); P('');
P('### 门口排队的闲聊'); P(''); A.queue.forEach(q => { P('- ［' + (needText(q.need) || '平常') + '］'); q.lines.forEach(l => P('  - ' + l.join(' —— '))); }); P('');
P('### 晚账上"街坊的话"'); P(''); A.quotes.forEach(q => P('- ［' + (needText(q.need) || '平常') + '］' + q.text + '　—— ' + q.from)); P('');
P('### 晚账页脚，老周心里的话'); P(''); A.zhou.forEach(q => P('- ［' + (needText(q.need) || '平常') + '］' + q.text)); P('');
P('### 柜台上的胃药'); P(''); (A.pills || []).forEach(t => P('- ' + t)); P('');
P('### 卖完了'); P(''); (A.soldout || []).forEach(t => P('- ' + t)); P('');

// 七、菜等
P('## 七、菜、添置、旧物、配角'); P(''); P('### 菜单（20 道）'); P('');
D.list.forEach(d => P('- **' + d.name + '**　' + (d.price ? '¥' + d.price : '') + (d.tags ? '　' + d.tags.join(' ') : '') + (d.set ? '　（' + d.set.map(dish).join('＋') + '）' : ''))); P('');
P('### 灶台'); P(''); Object.keys(D.stations).forEach(k => { const s = D.stations[k]; P('- **' + s.name + '**：熟练后「' + s.skill[0] + '」——' + s.skill[1]); }); P('');
P('### 添置'); P(''); Cast.upgrades.forEach(u => P('- **' + u.name + '**（¥' + u.cost / 100 + '）：' + u.text)); P('');
P('### 上个月带来的旧物'); P(''); Cast.heirlooms.forEach(h => P('- **' + h.name + '**：' + h.text)); P('');
P('### 主线里留下的东西'); P(''); Object.keys(St.mementos).filter(k => !St.mementos[k].who).forEach(k => P('- **' + St.mementos[k].name + '**：' + St.mementos[k].text)); P('');
P('### 配角'); P(''); P(Object.keys(Cast.npcs).map(k => Cast.npcs[k].name).join('、') + '；散客六类：' + Object.keys(Cast.archetypes).map(k => Cast.archetypes[k].name).join('、')); P('');

// 八、界面
P('## 八、界面上写死的文字'); P(''); P('从界面代码里摘出的中文字符串（按文件，去重，不含注释）。拼接出来的句子会被拆成几段。'); P('');
const files = ['ui/s_title.js', 'ui/s_basic.js', 'ui/s_prep.js', 'ui/s_play.js', 'game/service.js', 'game/stations.js', 'ui/s_town.js', 'ui/s_night.js', 'ui/s_book.js', 'ui/s_ending.js', 'ui/kit.js', 'app.js', 'core/run.js', 'core/town.js', 'core/cond.js', 'content/config.js'];
files.forEach(f => {
  const src = fs.readFileSync(path.join(root, 'src', f), 'utf8').split('\n').map(l => l.replace(/^\s*\/\/.*$/, '').replace(/\s\/\/ .*$/, '')).join('\n');
  const seen = new Set(), list = [];
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) { const s = (m[1] != null ? m[1] : m[2]).replace(/\\'/g, "'"); if (/[一-鿿]/.test(s) && !/PingFang|Kaiti|STKaiti|楷体|Hiragino|Microsoft|Noto|Songti|SimSun|STSong/.test(s) && !seen.has(s)) { seen.add(s); list.push(s); } }
  if (!list.length) return;
  P('### `' + f + '`'); P(''); P(list.map(s => '「' + s + '」').join('　')); P('');
});
const file = process.argv[2] || path.join(root, 'docs', '全部文字.md');
fs.writeFileSync(file, out.join('\n'));
const txt = out.join('\n'), cn = (txt.match(/[一-鿿]/g) || []).length;
console.log(file, out.length + ' 行，约 ' + cn + ' 个汉字');
