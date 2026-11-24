// 故事总表：把人物表、两份常客线、主线与事件、结局、环境语料合成一份供引擎查询。
// 任何一份内容文件缺席时，这里给出能跑的兜底，保证游戏不因缺内容而停摆。
BSX.define('content/story', function (require) {
  var Cast = require('content/cast');
  function opt(name, dflt) { try { return BSX.has(name) ? require(name) : dflt; } catch (e) { if (typeof console !== 'undefined') console.error('内容加载失败 ' + name, e); return dflt; } }
  var arcs = {}, a = opt('content/arcs_a', {}), b = opt('content/arcs_b', {}), k;
  for (k in a) arcs[k] = a[k];
  for (k in b) arcs[k] = b[k];
  var sc = opt('content/scenes', { main: {}, events: [] });
  var endings = opt('content/endings', { list: [], echoes: [] });
  var ambient = opt('content/ambient', {});
  var town = opt('content/town', { scenes: {} });
  var defUsual = { zhao: ['congee', 'youtiao', 'youtiao:嫩'], song: ['congee'], ge: ['congee', 'youtiao'], ali: ['youtiao', 'soy'], gong: ['soy', 'youtiao:老'], man: ['congee'], zheng: ['soy', 'youtiao'], qin: ['congee', 'youtiao'] };
  var regs = {}, scenes = {}, mementos = {}, facts = {};
  Cast.regIds.forEach(function (id) {
    var c = Cast.regulars[id], arc = arcs[id] || {}, r = {};
    for (k in c) r[k] = c[k];
    r.id = id;
    r.usual = arc.usual || defUsual[id];
    r.beats = arc.beats || [{ id: id + '_first', need: { day: [c.first] }, key: true, order: 'usual', say: { in: '来一份。' } }];
    r.barks = arc.barks || {};
    r.epilogue = arc.epilogue || [{ text: c.name + '还是会来。' }];
    r.firstNote = arc.first || c.full;
    r.factText = arc.facts || {};
    for (k in (arc.mementos || {})) { mementos[k] = arc.mementos[k]; mementos[k].who = id; }
    for (k in (arc.scenes || {})) { scenes[k] = arc.scenes[k]; scenes[k].id = k; scenes[k].who = id; }
    for (k in r.factText) facts[id + '/' + k] = r.factText[k];
    r.beatById = {};
    r.beats.forEach(function (bt) { r.beatById[bt.id] = bt; });
    regs[id] = r;
  });
  // 主线与全局纪念物
  var globalMementos = {
    m_heyi_note: { name: '何姨的条子', text: '"油三天一换，别省。——何"', kind: 'note' },
    m_recipe: { name: '手写粥谱', text: '米要泡，水要宽，火要小。', kind: 'paper' },
    m_lease: { name: '续租通知', text: '押金一千二，月底给话。', kind: 'paper' },
    m_slip: { name: '第一张进货单', text: '贴在门口的那张，边角卷了。', kind: 'paper' },
    m_candle: { name: '半截蜡烛', text: '停电那天早上点的。', kind: 'tool' },
    m_ticket: { name: '7 路车票', text: '最后一班，司机签了名。', kind: 'paper' },
    m_video: { name: '那条视频的截图', text: '评论区第一条是"地址？"', kind: 'photo' }
  };
  for (k in globalMementos) if (!mementos[k]) mementos[k] = globalMementos[k];
  var mainBy = {};
  for (k in sc.main) { var m = sc.main[k]; m.id = m.id || k; scenes[m.id] = m; if (m.day) mainBy[m.day + '/' + m.when] = m; }
  (sc.events || []).forEach(function (e) { scenes[e.id] = e; e.event = true; });
  for (k in town.scenes) scenes[k] = town.scenes[k];
  // 兜底主线：保证 28 天能走完
  function fallback(id, day, when, beats) { if (!scenes[id]) { var s = { id: id, title: id, day: day, when: when, beats: beats, fallback: true }; scenes[id] = s; if (day) mainBy[day + '/' + when] = s; } }
  fallback('m01_open', 1, 'open', [['n', '五点半。'], { do: 'hold', label: '按住，拉起卷帘门' }, { shutter: 'up' }, ['z', '十平米，也是自己的店。']]);
  fallback('m02_close', 2, 'close', [['n', '灶台底下有一口老煎锅。'], { fx: { unlock: ['scallion', 'egg'] } }]);
  fallback('m07_close', 7, 'close', [{ enter: 'landlord', slot: 2 }, ['landlord', '短租月底到期，押金一千二。'], { exit: 'landlord' }]);
  fallback('m12_open', 12, 'open', [{ enter: 'hu', slot: 2 }, ['hu', '羊肉，要不要？'], { choice: [{ label: '要有票的', fx: { unlock: 'mutton' } }, { label: '不做羊肉', fx: {} }] }, { exit: 'hu' }]);
  fallback('m22_open', 22, 'open', [['n', '整条街停电了。'], { fx: { unlock: 'dumpling' } }]);
  fallback('m26_close', 26, 'close', [{ enter: 'landlord', slot: 2 }, ['landlord', '签不签，给句话。'], { choice: [{ label: '续租', need: { cash: [1200] }, fx: { payDeposit: true, set: ['renewed'] } }, { label: '街坊凑一凑', need: { affSum: [30] }, fx: { chipin: true, set: ['chipin'] } }, { label: '不签了', fx: { set: ['left'] } }] }, { exit: 'landlord' }]);
  fallback('m28_close', 28, 'close', [['n', '第二十八天。'], { do: 'hold', label: '按住，拉下卷帘门' }, { shutter: 'down' }]);
  fallback('crisis', 0, 'close', [['n', '有人吃坏了肚子，找上门来。'], { choice: [{ label: '停业整改', fx: { set: ['crisis_rectify'] } }, { label: '逐个退赔', fx: { set: ['crisis_refund'] } }, { label: '硬撑', fx: { set: ['crisis_hold'] } }] }]);
  fallback('rescue', 0, 'open', [{ enter: 'landlord', slot: 2 }, ['landlord', '账上是负的了。'], { choice: [{ label: '卖设备', fx: { set: ['s_sold'] } }, { label: '向小满借', need: { aff: { man: 3 } }, fx: { set: ['s_borrow'] } }, { label: '再撑一天', fx: { set: ['s_refuse'] } }] }, { exit: 'landlord' }]);
  var endById = {};
  (endings.list || []).forEach(function (e) { endById[e.id] = e; });
  var END_IDS = ['E_HONEST', 'E_CANTEEN', 'E_PRIVATE', 'E_REOPEN', 'E_PILLS', 'E_FAREWELL', 'E_TRANSFER', 'E_SOMEONE'];
  var endTitles = { E_HONEST: '贵是贵点，吃了不烧心', E_CANTEEN: '街坊食堂', E_PRIVATE: '只做熟客的私房小馆', E_REOPEN: '整改之后，重新开张', E_PILLS: '胃药和账单', E_FAREWELL: '搬走那天，常客来送行', E_TRANSFER: '转让', E_SOMEONE: '月底那天，还是有人来了' };
  END_IDS.forEach(function (id) { if (!endById[id]) endById[id] = { id: id, title: endTitles[id], sign: id === 'E_HONEST' ? '不烧心小馆' : '', mood: '', text: [endTitles[id] + '。'], letter: { from: 'best', text: '明天还开吧？' }, last: '' }; });
  return {
    regs: regs, regIds: Cast.regIds, scenes: scenes, events: sc.events || [], mainBy: mainBy, mementos: mementos, facts: facts,
    endings: endById, endIds: END_IDS, echoes: endings.echoes || [], ambient: ambient,
    scene: function (id) { return scenes[id] || null; },
    memento: function (id) { return mementos[id] || { name: id, text: '', kind: 'paper' }; },
    who: function (id) { return regs[id] ? regs[id].name : Cast.npcs[id] ? Cast.npcs[id].name : id === 'z' ? '老周' : id; }
  };
});
