/* modules.js */
(function (g) {
  var BSX = g.BSX || (g.BSX = {});
  if (BSX.define) return;
  var defs = {}, cache = {}, loading = {};
  BSX.define = function (name, factory) { defs[name] = factory; };
  BSX.require = function (name) {
    if (Object.prototype.hasOwnProperty.call(cache, name)) return cache[name];
    if (!defs[name]) throw new Error('BSX module not found: ' + name);
    if (loading[name]) throw new Error('BSX circular require: ' + name);
    loading[name] = true;
    var out = defs[name](BSX.require);
    loading[name] = false;
    cache[name] = out;
    return out;
  };
  BSX.has = function (name) { return !!defs[name]; };
  BSX.names = function () { return Object.keys(defs); };
})(typeof GameGlobal !== 'undefined' ? GameGlobal : (typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)));
;
/* content/config.js */
BSX.define('content/config', function () {
  return {
    contentVersion: '2.0.0',
    days: 28,
    startCash: 70000,            // 700 元：盘店之后剩下的
    startRep: 50,
    rentWeekly: 24000,           // 每七天交一次房租
    deposit: 120000,             // 第 26 日的续租押金
    utilities: 800,             // 每天水电煤
    helperWage: 3000,
    priceMul: [0.85, 1.0, 1.25],
    priceFlow: [1.18, 1.0, 0.84],
    priceItems: [0.15, 0, -0.18],        // 每单件数的偏移
    matCost: [0.8, 1.0, 1.28],
    matQ: [-0.06, 0, 0.07],
    matName: ['批发冻品', '老秦的鲜货', '有票的好料'],
    priceName: ['薄利', '公道', '提价'],
    oil: { fresh: 2000, filter: 400, bulk: 1000, bulkAge: 1, bulkRate: 1.5 },
    oilSpeed: function (a) { return 1 + Math.min(0.45, 0.07 * a); },
    oilWindow: function (a) { return Math.max(0.55, 1 - 0.09 * a); },
    oilQ: function (a) { return a <= 2 ? 0 : -Math.min(0.2, 0.05 * (a - 2)); },
    oilBurn: function (a, bulk) { return Math.max(0, a - 2) * 0.22 + (bulk ? 0.15 : 0); }, // 每卖出一份油炸/油煎
    burnDecay: 1.2,              // 新油或无油的日子每天回落
    hoodBurn: 0.6,               // 排烟罩：烧心累积打六折
    baseFlow: function (day) { return 5.5 + Math.min(day, 21) * 0.72; },
    repFlow: function (rep) { return 0.6 + rep / 100 * 0.8; },
    weatherOdds: { sun: 0.5, cloud: 0.3, rain: 0.2 },
    weatherFlow: { sun: 1.0, cloud: 0.97, rain: 0.84 },
    fixedWeather: { 1: 'sun', 2: 'sun', 3: 'cloud', 4: 'rain', 12: 'rain', 18: 'sun', 22: 'cloud', 27: 'sun', 28: 'sun' },
    shiftLen: function (day) { return day <= 1 ? 92 : day === 2 ? 118 : day === 3 ? 136 : day <= 7 ? 150 : day <= 14 ? 162 : 174; },
    slots: function (day) { return day >= 6 ? 4 : 3; },
    patience: { walk: [30, 40], regular: 46, queue: [34, 46], tutorial: 30 },
    menuMax: function (s) { return 4 + (s.day >= 8 ? 1 : 0) + (s.upg.board ? 1 : 0); },
    burners: function (s) { return 3 + (s.upg.burner ? 1 : 0); },
    shelf: function (s) { return 4 + (s.upg.shelf ? 2 : 0); },
    potCap: function (s) { return s.upg.bigpot ? 14 : 8; },
    fryerSlots: function (s) { return s.upg.fryer ? 6 : 4; },
    delight: 0.86, fine: 0.62,
    repDelta: { delight: 0.05, fine: 0.012, meh: -0.07, walk: -0.22, balk: -0.09, soldout: -0.04 },
    repDayCap: 2.4,
    tip: { delight: 50 },        // 5 毛
    aff: { delight: 0.2, fine: 0.09, meh: -0.2, walk: -0.5, chat: 0.12, remember: 0.1, ask: -0.1, returned: 0.4, beat: 0.4 },
    skill: [12, 40, 90],
    skillWindow: 0.035,
    costUp: { from: 9, to: 16, mul: 1.15 },
    crisis: { rectify: { cash: -40000, burnTo: 35, rep: 6 }, refund: { cash: -26000, rep: -8, burn: -55, laterRep: 5 }, hold: { rep: -3 } },
    rescue: { sell: 30000, borrow: 25000, repay: 30000 },
    viralFlow: { good: 1.6, plain: 1.25, bad: 1.15 }
  };
});
;
/* content/dishes.js */
BSX.define('content/dishes', function () {
  var list = [
    { id: 'congee', name: '白粥', st: 'pot', price: 3, cost: 0.7, tags: ['汤水', '清淡', '快'], pop: 1.25, day: 1, icon: { cell: 0 }, hold: 55, temp: true },
    { id: 'youtiao', name: '油条', st: 'fryer', price: 2.5, cost: 0.6, tags: ['油香', '快'], pop: 1.3, day: 1, icon: { cell: 7 }, cook: { t: 7.5, flips: 1 }, oil: true, pref: true, hold: 32 },
    { id: 'soy', name: '现磨豆浆', st: 'soy', price: 3, cost: 0.8, tags: ['汤水', '清淡', '甜', '快'], pop: 1.2, day: 1, icon: { cell: 10 }, hold: 70, temp: true },
    { id: 'scallion', name: '葱油饼', st: 'griddle', price: 6, cost: 1.6, tags: ['油香', '顶饱'], pop: 1.0, day: 3, icon: { cell: 8 }, cook: { t: 9, flips: 1 }, oil: true, pref: true, hold: 40 },
    { id: 'egg', name: '煎蛋', st: 'griddle', price: 3, cost: 1.1, tags: ['油香', '快'], pop: 0.85, day: 3, icon: { proc: 'egg' }, cook: { t: 5.5, flips: 1 }, oil: true, pref: true, hold: 40 },
    { id: 'pidan', name: '皮蛋瘦肉粥', st: 'pot', top: true, price: 7, cost: 2.6, tags: ['汤水', '肉', '顶饱'], pop: 1.0, day: 7, minMat: 1, icon: { cell: 3 }, hold: 55, temp: true },
    { id: 'teaegg', name: '茶叶蛋', st: 'side', price: 2, cost: 0.8, tags: ['快', '清淡'], pop: 1.0, day: 8, icon: { cell: 9 }, hold: 999 },
    { id: 'noodle', name: '小面', st: 'boil', price: 9, cost: 3.0, tags: ['汤水', '顶饱'], pop: 1.1, day: 8, icon: { cell: 14 }, cook: { t: 6.5, flips: 0 }, hold: 35, temp: true },
    { id: 'friedrice', name: '蛋炒饭', st: 'griddle', price: 9, cost: 3.2, tags: ['顶饱', '油香'], pop: 0.95, day: 9, icon: { proc: 'rice' }, cook: { t: 8, flips: 2, verb: '翻炒' }, oil: true, hold: 45 },
    { id: 'shengjian', name: '生煎包', st: 'griddle', price: 7, cost: 2.6, tags: ['油香', '肉', '顶饱'], pop: 1.05, day: 10, minMat: 1, icon: { cell: 6 }, cook: { t: 11, flips: 1, verb: '加水' }, oil: true, pref: true, hold: 45 },
    { id: 'soyyt', name: '豆浆泡油条', set: ['soy', 'youtiao'], price: 5, cost: 1.4, tags: ['汤水', '油香'], pop: 0.9, day: 10, icon: { cell: 10, overlay: 7 }, oil: true },
    { id: 'mutton', name: '羊肉汤', st: 'boil', price: 16, cost: 7.5, tags: ['汤水', '肉', '顶饱'], pop: 0.8, day: 12, icon: { cell: 11 }, cook: { t: 6, flips: 0 }, hold: 45, temp: true },
    { id: 'chicken', name: '鸡汤面', st: 'boil', price: 14, cost: 6.0, tags: ['汤水', '肉', '顶饱'], pop: 0.85, day: 13, minMat: 2, icon: { cell: 14, tint: '#f6e2a0' }, cook: { t: 7.5, flips: 0 }, hold: 35, temp: true },
    { id: 'mixian', name: '米线', st: 'boil', price: 10, cost: 3.8, tags: ['汤水', '顶饱'], pop: 0.95, day: 14, icon: { cell: 14, tint: '#ffffff' }, cook: { t: 7, flips: 0 }, hold: 35, temp: true },
    { id: 'tangyou', name: '糖油果子', st: 'fryer', price: 4, cost: 1.2, tags: ['甜', '油香'], pop: 0.9, day: 15, icon: { proc: 'balls' }, cook: { t: 9.5, flips: 1 }, oil: true, pref: true, hold: 50 },
    { id: 'poachnoodle', name: '荷包蛋面', st: 'boil', price: 10, cost: 4.0, tags: ['汤水', '顶饱'], pop: 1.0, day: 16, icon: { cell: 14, overlay: 'egg' }, cook: { t: 8, flips: 0 }, hold: 35, temp: true },
    { id: 'pumpkin', name: '南瓜粥', st: 'pot', top: true, price: 5, cost: 1.6, tags: ['汤水', '甜', '清淡'], pop: 1.0, day: 18, icon: { cell: 2 }, hold: 55, temp: true },
    { id: 'yeerba', name: '叶儿粑', st: 'side', price: 5, cost: 1.8, tags: ['甜', '清淡'], pop: 0.85, day: 20, icon: { proc: 'leaf' }, hold: 999 },
    { id: 'tangyuan', name: '醪糟汤圆', st: 'boil', price: 7, cost: 2.4, tags: ['甜', '汤水'], pop: 0.95, day: 20, icon: { cell: 12 }, cook: { t: 8.5, flips: 0 }, hold: 45, temp: true },
    { id: 'dumpling', name: '饺子', st: 'boil', price: 10, cost: 3.8, tags: ['顶饱', '肉'], pop: 1.1, day: 22, icon: { cell: 13 }, cook: { t: 10, flips: 2, verb: '点水' }, hold: 40 }
  ];
  var byId = {};
  list.forEach(function (d) { byId[d.id] = d; });
  var stations = {
    pot: { name: '粥锅', hot: true, w: 236, skill: ['米油', '锅底不容易糊'] },
    fryer: { name: '油锅', hot: true, w: 250, skill: ['双手下锅', '点面板一次下两根'] },
    griddle: { name: '煎锅', hot: true, w: 236, skill: ['听声', '该翻面时锅边会响一声'] },
    boil: { name: '面锅', hot: true, w: 236, skill: ['宽汤', '煮过头得更慢'] },
    soy: { name: '豆浆桶', hot: false, w: 168, skill: ['手稳', '快满时水流自己收细'] },
    side: { name: '小炉', hot: false, w: 150, skill: ['顺手', '小炉上的东西放不凉'] }
  };
  var order = ['pot', 'fryer', 'griddle', 'boil', 'soy', 'side'];
  function parts(id) { var d = byId[id]; return d && d.set ? d.set.slice() : [id]; }
  function stationOf(id) { var d = byId[id]; return d ? d.st : null; }
  function stationsFor(menu) {
    var need = {};
    menu.forEach(function (id) { parts(id).forEach(function (p) { need[byId[p].st] = true; }); });
    return order.filter(function (k) { return need[k]; });
  }
  var TAGS = ['汤水', '顶饱', '清淡', '油香', '甜', '肉', '快'];
  return { list: list, byId: byId, stations: stations, order: order, parts: parts, stationOf: stationOf, stationsFor: stationsFor, TAGS: TAGS };
});
;
/* content/cast.js */
BSX.define('content/cast', function () {
  var regulars = {
    zhao: { name: '赵爷爷', full: '赵爷爷和豆豆', sprite: 'spr_grandpa', portrait: 7, h: 268, at: 'early', likes: ['清淡', '汤水'], first: 1,
      attend: function (h) { return 0.74 + h.aff * 0.02 - (h.price === 2 ? 0.14 : 0); } },
    song: { name: '小宋', full: '护士小宋', sprite: 'spr_xiaosong', portrait: 0, h: 262, at: 'open', likes: ['清淡', '汤水'], first: 2,
      attend: function (h) { return 0.66 + h.aff * 0.03 - Math.max(0, h.oilAge - 2) * 0.2 - (h.burn > 60 ? 0.3 : 0); } },
    ge: { name: '老葛', full: '西装老葛', sprite: 'spr_laoge', portrait: 1, h: 272, at: 'rush', likes: ['顶饱'], first: 3,
      attend: function (h) { return [0.82, 0.66, 0.26][h.price] + h.aff * 0.02; } },
    ali: { name: '阿力', full: '骑手阿力', sprite: 'spr_ali', portrait: 2, h: 262, at: 'rush', likes: ['快', '顶饱'], first: 4,
      attend: function (h) { return (h.weather === 'rain' ? 0.9 : 0.52) + h.aff * 0.03 - (h.fast === false ? 0.15 : 0); } },
    gong: { name: '龚师傅', full: '7 路龚师傅', sprite: 'spr_gong', portrait: 3, h: 276, at: 'open', likes: ['油香'], first: 2,
      attend: function (h) { return 0.8 + h.aff * 0.02; } },
    man: { name: '小满', full: '裁缝小满', sprite: 'spr_xiaoman', portrait: 4, h: 262, at: 'late', likes: ['清淡', '甜'], first: 3,
      attend: function (h) { return 0.5 + h.aff * 0.04 - (h.oilAge >= 3 && !h.hood ? 0.4 : 0); } },
    zheng: { name: '小郑', full: '学生小郑', sprite: 'spr_xiaozheng', portrait: 5, h: 258, at: 'rush', likes: ['油香', '快'], first: 5,
      attend: function (h) { return 0.6 + h.aff * 0.03 - (h.burn >= 60 ? 0.5 : 0); } },
    qin: { name: '老秦', full: '菜贩老秦', sprite: 'spr_laoqin', portrait: 6, h: 250, at: 'last', likes: ['汤水', '顶饱'], first: 6,
      attend: function (h) { return [0.3, 0.72, 0.8][h.mat] + h.aff * 0.03; } }
  };
  var regIds = ['zhao', 'song', 'ge', 'ali', 'gong', 'man', 'zheng', 'qin'];
  var npcs = {
    landlord: { name: '汪姐', sprite: 'spr_landlord', body: '#8a5a6e', pants: '#3b3440', hair: 'bob', hairCol: '#4a3028', acc: 'keys', skin: 0 },
    hu: { name: '老胡', sprite: 'spr_hu', body: '#3f6a8a', pants: '#2d3440', hair: 'cap', hairCol: '#27323c', acc: 'vest', skin: 1 },
    powder: { name: '推销员', body: '#c9b037', pants: '#3a3a44', hair: 'short', hairCol: '#1f1712', acc: 'tie', skin: 0 },
    inspector: { name: '小陈', sprite: 'spr_inspector', body: '#2f4f7a', pants: '#26303d', hair: 'short', hairCol: '#1f1712', acc: 'clip', skin: 0 },
    vlogger: { name: '探店博主', body: '#e07a5f', pants: '#3b3b58', hair: 'pony', hairCol: '#5a3020', acc: 'phone', skin: 0 },
    recycler: { name: '收油的', body: '#5c6b3c', pants: '#3e3a2c', hair: 'cap', hairCol: '#3a3a2a', acc: null, skin: 2 },
    guifen: { name: '桂芬', body: '#8a6aa0', pants: '#3e3348', hair: 'bun', hairCol: '#2a1a14', acc: 'apron', skin: 1 },
    heyi: { name: '何姨', sprite: 'spr_heyi', body: '#a05a4a', pants: '#4a3a34', hair: 'gray', hairCol: '#c8c2b8', acc: 'apron', skin: 1 },
    peer: { name: '早餐车老板', sprite: 'spr_peer', body: '#a8423a', pants: '#3a2f2a', hair: 'short', hairCol: '#1a1410', acc: 'apron', skin: 2 },
    doudou: { name: '豆豆', sprite: 'spr_doudou', body: '#f0ede4', pants: '#2f4a7a', hair: 'short', hairCol: '#3a2418', acc: 'scarf', skin: 0, kid: true },
    tangtang: { name: '糖糖', sprite: 'spr_tangtang', body: '#f2c6cf', pants: '#6a4a7a', hair: 'pony', hairCol: '#3a2418', acc: null, skin: 0, kid: true },
    aunty: { name: '刘姐', body: '#c86a8a', pants: '#3a3440', hair: 'bob', hairCol: '#3a2018', acc: 'phone', skin: 0 },
    tv: { name: '记者', body: '#4a5a6a', pants: '#2a2a30', hair: 'bob', hairCol: '#2a1a14', acc: 'cam', skin: 0 },
    wu: { name: '吴奶奶', sprite: 'spr_wu', body: '#8a6a7a', pants: '#4a3a34', hair: 'gray', hairCol: '#d8d2c8', acc: 'cane', skin: 1, h: 0.86 },
    wang: { name: '王阿姨', sprite: 'spr_wang', body: '#a05a5a', pants: '#3a3030', hair: 'bun', hairCol: '#a8a29a', acc: null, skin: 1 },
    neighbor: { name: '街坊', body: '#6e8a6a', pants: '#3a3a3a', hair: 'gray', hairCol: '#b8b0a4', acc: null, skin: 1 },
    kid: { name: '学生娃', body: '#f0ede4', pants: '#2f4a7a', hair: 'short', hairCol: '#2a1810', acc: 'pack', skin: 0, kid: true }
  };
  var archetypes = {
    student: { name: '学生', w: 1.1, rain: 0.8, likes: ['快', '甜', '油香'], items: [0.5, 0.42, 0.08], tip: 0.2, sens: 1.3, patience: 0.9,
      looks: { body: ['#f0ede4', '#dfe8f2', '#3c6fb0'], pants: ['#2f4a7a', '#33384a'], hair: ['short', 'pony', 'bob'], acc: ['pack', 'pack', 'glasses'] } },
    office: { name: '上班族', w: 1.2, rain: 0.9, likes: ['快', '清淡'], items: [0.38, 0.5, 0.12], tip: 0.7, sens: 0.8, patience: 0.85,
      looks: { body: ['#56627a', '#7a6a58', '#d8d2c4', '#4a6a66'], pants: ['#2c2f3a', '#3a3430'], hair: ['short', 'bob', 'bun'], acc: ['tie', 'glasses', null] } },
    worker: { name: '干活的', w: 1.0, rain: 0.7, likes: ['顶饱', '肉', '油香'], items: [0.2, 0.5, 0.3], tip: 0.3, sens: 1.1, patience: 1.0,
      looks: { body: ['#c9762f', '#5c6b3c', '#4a5a7a', '#8a4a3a'], pants: ['#3e3a2c', '#2d3440'], hair: ['short', 'cap', 'bald'], acc: ['vest', null, 'scarf'] } },
    elder: { name: '老人', w: 0.9, rain: 0.6, likes: ['清淡', '汤水'], items: [0.45, 0.45, 0.1], tip: 0.2, sens: 1.2, patience: 1.25,
      looks: { body: ['#7a8a6a', '#8a6a5a', '#6a6a7a', '#a08a6a'], pants: ['#3a3a3a', '#4a3a34'], hair: ['gray', 'gray', 'bald'], acc: ['cane', 'basket', null] } },
    parent: { name: '带娃的', w: 0.8, rain: 0.7, likes: ['清淡', '甜', '汤水'], items: [0.15, 0.5, 0.35], tip: 0.5, sens: 1.0, patience: 0.95,
      looks: { body: ['#c86a8a', '#6a8aa0', '#d8a05a', '#7a9a7a'], pants: ['#3a3440', '#2f3a4a'], hair: ['bun', 'bob', 'pony', 'short'], acc: ['basket', null, 'glasses'] } },
    rider: { name: '骑手', w: 0.5, rain: 2.6, likes: ['快', '顶饱'], items: [0.55, 0.4, 0.05], tip: 0.2, sens: 1.0, patience: 0.7,
      looks: { body: ['#e0b020', '#2f8a7a', '#3a6ad0'], pants: ['#2a2a30'], hair: ['helmet'], acc: [null] } }
  };
  var upgrades = [
    { id: 'shelf', name: '保温出餐台', cost: 11000, day: 3, text: '台面多两格，放着的东西凉得慢。' },
    { id: 'bigpot', name: '大号粥锅', cost: 9000, day: 4, text: '一锅多熬六碗，少添几回米。' },
    { id: 'fryer', name: '油锅加两格', cost: 10000, day: 5, text: '一次能炸六根。' },
    { id: 'burner', name: '添一口灶', cost: 24000, day: 8, text: '粥、油、煎、面，四口灶都能开。' },
    { id: 'hood', name: '排烟罩', cost: 18000, day: 6, text: '油烟往上走，不往隔壁飘。' },
    { id: 'awning', name: '门口雨棚', cost: 11000, day: 4, text: '下雨天排队的人不那么急着走。' },
    { id: 'board', name: '加长菜单牌', cost: 8000, day: 10, text: '菜单上多写一道菜。' }
  ];
  var heirlooms = [
    { id: 'H_APRON', name: '洗得发白的围裙', text: '上个月的手还记得。每口灶起步多一级熟练。' },
    { id: 'H_NOTE', name: '何姨的粥谱', text: '第一天就能做皮蛋瘦肉粥。' },
    { id: 'H_MUG', name: '龚师傅的茶缸', text: '头班车的人认得它。每天多两位早客。' },
    { id: 'H_CURTAIN', name: '小满缝的门帘', text: '街坊愿意多等一会儿。' },
    { id: 'H_TIN', name: '零钱盒', text: '开局多一百块。' }
  ];
  return { regulars: regulars, regIds: regIds, npcs: npcs, archetypes: archetypes, upgrades: upgrades, heirlooms: heirlooms };
});
;
/* content/arcs_a.js */
BSX.define('content/arcs_a', function () {
  return {
    /* ───────────── 赵爷爷和豆豆 ───────────── */
    zhao: {
      first: '军绿马甲，布钱包，带着换牙的孙子。',
      usual: ['congee', 'youtiao', 'youtiao:嫩'],
      facts: {
        f_usual: '白粥一碗，油条两根。一根炸嫩，豆豆在换牙。',
        f_twice: '爷爷有时把钱给两回。豆豆会小声拦。',
        f_class: '豆豆读三年二班，和隔壁糖糖同班。',
        f_price: '提价那天，两根油条改成了一根。嫩的，给豆豆。',
        f_repeat: '同一句话，爷爷一早上说了三遍。',
        f_door: '爷爷一个人走到柜台前，忘了要买什么。',
        f_road: '有一天爷爷不认得路了。老样子，豆豆替他记着。',
        f_card: '爷爷钱包里有张卡片：正面是家，背面是老样子。'
      },
      mementos: {
        m_homework: { name: '作业本里的一页', text: '造句："每天——爷爷每天带我吃早饭。"铅笔写的，没交。', kind: 'paper' },
        m_essay: { name: '作文《我家楼下的早餐店》', text: '第一句："它还没有名字。"老师批了个优。', kind: 'paper' }
      },
      beats: [
        { id: 'zhao_first', need: { day: [1, 2] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩'], act: 'coins',
          say: {
            in: '白粥一碗，油条要两根哈。',
            chat: [['a', '一根炸嫩点哈，娃儿在换牙。'], ['b', '我掉了两颗了！门牙！'], ['z', '那嫩的我单炸，不跟老的一锅。'], ['a', '钱是数好的，你点一哈。'], ['b', '爷爷在屋头数了两遍。']],
            good: '豆豆，慢慢嚼，莫噎到。', ok: '要得，能吃。', bad: '嫩那根炸硬了嘛。', slow: '娃儿七点二十要到校。', out: '明天还是这个点哈。'
          },
          fx: { fact: ['zhao', 'f_usual'] }, fxGood: { aff: { zhao: 1 } } },
        { id: 'zhao_over', need: { day: [4, 6] }, key: true, at: 'early',
          order: 'usual', hide: true, act: 'overpay',
          say: {
            in: '老周，老样子。',
            chat: [['a', '钱我给过没得？咋个记不到了。'], ['z', '粥先端好，钱不急。'], ['a', '那再给一道，多了你退我嘛。'], ['b', '爷爷……'], ['b', '周爷爷，他给过了的。']],
            good: '这粥熬出米油了。', ok: '要得。', bad: '豆豆说，有点糊。', slow: '我不急，是豆豆急。', out: '豆豆，钱给了没得？'
          },
          fx: { fact: ['zhao', 'f_twice'] } },
        { id: 'zhao_hw', need: { day: [7, 9] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩'],
          say: {
            in: '老样子。豆豆，坐到写。',
            chat: [['b', '周爷爷，"每天"咋个造句？'], ['z', '我每天五点起来熬粥。'], ['b', '那是你的嘛，我要写我的。'], ['a', '屋头不写，跑来这儿写。'], ['b', '在屋头你老问我吃没吃。']],
            good: '写完了？那快吃。', ok: '要得。', bad: '豆豆说油条咬不动。', slow: '哦豁，要打预备铃了。', out: '书包！书包背起。'
          },
          leave: { memento: 'm_homework', line: '凳子上落了本作业本，封面写着三年二班。' },
          fx: { fact: ['zhao', 'f_class'] },
          after: 'sc_zhao_homework' },
        { id: 'zhao_price_up', group: 'zhao_price', need: { day: [10, 14], price: [2] }, key: true, at: 'early',
          order: ['congee', 'youtiao:嫩'],
          say: {
            in: '粥一碗。油条……就一根。',
            chat: [['b', '爷爷，你不吃油条了啊？'], ['a', '爷爷早上不饿。'], ['b', '昨天你也说不饿。'], ['a', '嫩的那根，给他。'], ['z', '那我给他挑根大的。']],
            good: '豆豆，吃干净，莫剩。', ok: '要得。', bad: '就这一根，还炸老了。', slow: '不急，慢慢来。', out: '走嘛，豆豆。'
          },
          fx: { set: ['zhao_one'], fact: ['zhao', 'f_price'] } },
        { id: 'zhao_price_ok', group: 'zhao_price', need: { day: [10, 14], price: [0, 1] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩', 'egg:嫩'],
          say: {
            in: '老样子。给豆豆加个蛋。',
            chat: [['a', '他今天月考哦。'], ['b', '我要考双百！'], ['z', '那蛋给你煎嫩点，好咬。'], ['a', '豆豆，今天是月考吧？'], ['b', '……爷爷，你刚说过了。']],
            good: '吃了蛋，考一百。', ok: '要得。', bad: '蛋煎老了，他嚼不动。', slow: '考试迟到不得行哦。', out: '老周，他今天月考哦。'
          },
          fx: { fact: ['zhao', 'f_repeat'] }, fxGood: { aff: { zhao: 1 } } },
        { id: 'zhao_door', need: { day: [15, 17] }, key: true, at: 'early',
          order: [], act: 'peek',
          say: {
            in: '我来买……买啥子来着。',
            chat: [['z', '老样子？'], ['a', '对头，老样子。'], ['a', '……老样子是哪几样嘛？'], ['z', '一碗粥，两根油条，一根嫩的。'], ['a', '钱包没揣。我回去拿哈。']],
            out: '我回去拿钱包，马上来。'
          },
          fx: { fact: ['zhao', 'f_door'] } },
        { id: 'zhao_absent', need: { day: [18, 19] }, key: true, act: 'absent',
          remark: { who: 'gong', line: '老赵今天没下楼？六点四十，他从来不误点的。' } },
        { id: 'zhao_alone', need: { day: [20, 23] }, key: true, at: 'early',
          order: 'usual', hide: true, togo: true, act: 'coins',
          say: {
            in: '爷爷今天不认得路了。老样子。',
            chat: [['b', '钱我数好了，数了三遍。'], ['z', '你一个人来的？爷爷呢？'], ['b', '在楼下坐着。糖糖妈妈送我到街口。'], ['b', '周爷爷，你记得的吧？'], ['z', '记得。你站这儿等我。']],
            good: '对的！跟爷爷买的一样。', ok: '谢谢周爷爷。', bad: '不对……爷爷那根不是这样。', slow: '爷爷一个人在楼下坐着。', out: '我认得路。我走了哈。'
          },
          fx: { fact: ['zhao', 'f_road'] },
          fxGood: { aff: { zhao: 2 }, set: ['zhao_remembered'] }, fxBad: { aff: { zhao: -1 } },
          after: 'sc_zhao_road' },
        { id: 'zhao_last_r', group: 'zhao_last', need: { day: [27, 28], flags: ['returned_extra'] }, key: true, at: 'early',
          order: 'usual', hide: true,
          say: {
            in: '老样子。',
            chat: [['b', '周爷爷，我作文得了优！'], ['a', '他写的就是你这儿。'], ['a', '你这店不多收钱，我记得到。'], ['a', '就是店名，老是记不住。'], ['z', '还没起呢。您帮我想一个？']],
            good: '还是这个味道。', ok: '要得。', bad: '豆豆说，今天的糊了。', slow: '不急，我们等嘛。', out: '明天还是这个点哈。'
          },
          leave: { memento: 'm_essay', line: '粥碗底下压着一张作文纸。' },
          fx: { aff: { zhao: 1 } } },
        { id: 'zhao_last_k', group: 'zhao_last', need: { day: [27, 28] }, key: true, at: 'early',
          order: 'usual', hide: true, act: 'coins',
          say: {
            in: '老样子。',
            chat: [['b', '钱我来数。'], ['b', '一、二、三……我数两遍。'], ['a', '这娃儿，现在管我的钱包了。'], ['z', '管得好。比我管账强。'], ['b', '周爷爷，我作文得了优。']],
            good: '还是这个味道。', ok: '要得。', bad: '豆豆说，今天的糊了。', slow: '不急，我们等嘛。', out: '钱给了没得？哦，给了。'
          },
          leave: { memento: 'm_essay', line: '粥碗底下压着一张作文纸。' } }
      ],
      barks: {
        in: ['老周，老样子。', '老样子，一根炸嫩点。', '豆豆，叫周爷爷。', '还是这个点，老样子哈。'],
        inRain: ['落雨，豆豆非要去踩水。', '伞在滴水，我放门口哈。', '落雨天，粥要烫的。'],
        inOilOld: ['今天油条颜色深了点。', '豆豆说油条有点苦。', '老周，这油该换了吧？'],
        inPriceUp: ['涨了？……那就一根嘛。', '牌子上的数改了哦。', '我再数一哈。钱不够了。'],
        inPriceDown: ['便宜了？莫亏到自己。', '那给豆豆加个蛋。', '价低了，量莫少哈。'],
        inBusy: ['人多，我们靠边等。', '豆豆，莫挤到人家。', '不急，先紧上班的。'],
        good: ['豆豆吃得香。', '这粥有米油，巴适。', '嫩那根，刚刚好。', '豆豆，碗都舔干净了。'],
        ok: ['要得。', '能吃。', '还将就。'],
        bad: ['豆豆说，糊了。', '嫩那根炸硬了。', '粥稀了点哦。', '他咬不动，我掰给他。'],
        slow: ['娃儿要迟到了。', '豆豆，再等一哈。', '七点二十要到校的。'],
        out: ['明天还是这个点。', '豆豆，跟周爷爷说再见。', '钱给了吧？……给了。', '这条街从前是河，小龚晓得。']
      },
      epilogue: [
        { need: { flags: ['returned_extra', 'zhao_keep'] }, text: '每天六点四十，柜台上晾着一份老样子。豆豆牵着爷爷来取。爷爷每回都问店叫什么，每回都记得你不多收钱。' },
        { need: { flags: ['kept_extra', 'zhao_remembered'] }, text: '豆豆还是把硬币数两遍才推过来。可那份老样子，他已经不用开口了。' },
        { need: { flags: ['kept_extra'] }, text: '后来都是豆豆管钱包，硬币数两遍。多给的那一回，谁也没再提。' },
        { need: { flags: ['zhao_remembered'] }, text: '那天豆豆一个人来，你没问就装对了。作文里写的就是那个早上。爷爷有时认得路，有时不认得。' },
        { text: '赵爷爷还来，有时认得你，有时不认得。豆豆认得。老样子，他替爷爷记着。' }
      ],
      scenes: {
        sc_zhao_homework: { id: 'sc_zhao_homework', title: '作业本', when: 'close', light: 'dusk',
          beats: [
            { enter: 'zhao', slot: 1 },
            ['n', '卷帘门拉到一半，底下露出一双布鞋。是赵爷爷，没带豆豆。'],
            ['z', '赵爷爷？这个点了，粥都卖完了。'],
            ['zhao', '我来拿个东西。'],
            ['zhao', '……拿啥子来着。你看我这脑壳。'],
            { prop: 'homework', label: '作业本' },
            ['z', '是不是这个？凳子上捡的，我收起了。'],
            ['zhao', '对对对！豆豆在屋头急得哭。'],
            ['zhao', '说明天要交，不交老师要喊家长。'],
            { if: { flags: ['kept_extra'] }, then: [
              ['zhao', '前两天，我是不是多给了你钱？'],
              ['z', '那天人多，盒子我……没细数。'],
              ['zhao', '记不清了。算了，不说了，不说了。']
            ], else: [] },
            { if: { flags: ['returned_extra'] }, then: [
              ['zhao', '豆豆说，你上回追出来把钱还了。'],
              ['z', '多的放盒子里，我夜里睡不着。']
            ], else: [] },
            ['z', '您等一下。带根油条回去给他。'],
            { do: 'tap', label: '把油条掰进豆浆' },
            ['z', '泡软了吃，换牙的也咬得动。我小时候我妈这么弄。'],
            ['zhao', '这个吃法好。明天他准要点这个。'],
            { fx: { unlock: 'soyyt', aff: { zhao: 1 } } },
            { prop: 'homework', off: true },
            ['n', '他把作业本揣进马甲，拍了两下。走到门口，又拍了一下。'],
            { exit: 'zhao' }
          ] },
        sc_zhao_road: { id: 'sc_zhao_road', title: '老样子', when: 'close', light: 'dusk',
          beats: [
            { enter: 'doudou', slot: 1 }, { enter: 'zhao', slot: 2 },
            ['n', '傍晚，豆豆牵着爷爷的袖子进来。那截袖口，磨得发白。'],
            ['doudou', '周爷爷，爷爷下午又认得了。'],
            ['zhao', '老周。你这店叫啥子来着？'],
            ['z', '还没想好。招牌还空着。'],
            ['zhao', '哦。头一天你也是这么说的。'],
            ['doudou', '……头一天你倒是记得。'],
            { prop: 'paper', label: '一张卡片' },
            ['doudou', '我写了张卡片，塞在他钱包里。'],
            ['doudou', '正面写的家，背面写的老样子。'],
            ['z', '老样子……你咋个写的？'],
            ['doudou', '白粥一碗，油条两根。"嫩"字我不会写，画了颗牙。'],
            { if: { flags: ['zhao_remembered'] },
              then: [['doudou', '早上你都没问我，就装对了。']],
              else: [['doudou', '早上那份……嫩的那根不对。']] },
            ['zhao', '我要是哪天又走岔了……'],
            { choice: [
              { label: '每天留一份', hint: '每天搭一份备料', fx: { cash: -4, set: ['zhao_keep'], aff: { zhao: 2 } },
                then: [['z', '六点四十，粥我盛好晾着，等你们来拿。'], ['doudou', '那我认得路，我来拿！'], ['zhao', '豆豆认得，豆豆认得。']] },
              { label: '来了现做', hint: '不占备料', fx: { set: ['zhao_wait'], aff: { zhao: 1 } },
                then: [['z', '来了就现做，热的。不来我不问。'], ['zhao', '要得。不给你添麻烦。']] }
            ] },
            { fx: { fact: ['zhao', 'f_card'] } },
            { prop: 'paper', off: true },
            ['n', '豆豆走在前头，爷爷攥着他的书包带子。我把灯多开了一会儿。'],
            { exit: 'zhao' }, { exit: 'doudou' }
          ] }
      }
    },
    /* ───────────── 小宋 ───────────── */
    song: {
      first: '开门第一个。外套底下是护士服。',
      usual: ['congee:温'],
      facts: {
        f_plain: '六点整，第一个。只要白粥，不要油的。',
        f_warm: '粥要晾一下再装。烫的她咽不下去。',
        f_nose: '鼻子灵。油用到第几天，她进门就闻得出来。',
        f_ward: '她让出院的病人第一顿来喝你的粥。没跟你提过。',
        f_resign: '她兜里揣着一封申请，写了半个月，没交。',
        f_wu: '十二床是六楼的吴奶奶。阿力天天送粥的那位。',
        f_board: '护士站的小黑板上，写着小馆的电话。'
      },
      mementos: {
        m_letter: { name: '没封口的信封', text: '她拿回去了。凳子上留了个圆印子，是粥碗压的。', kind: 'paper' },
        m_band: { name: '一条住院腕带', text: '出院那天剪下来的。他说留这儿，算个凭证。', kind: 'paper' }
      },
      beats: [
        { id: 'song_first', need: { day: [1, 2] }, key: true, at: 'open',
          order: ['congee'],
          say: {
            in: '白粥，一碗。不加任何东西。',
            chat: [['z', '油条刚出锅，来一根？'], ['a', '不了。胃今天不接诊。'], ['z', '那粥给你盛稠点。'], ['a', '稠稀都行。我站着喝，坐下就睡了。']],
            good: '嗯。是米熬出来的。', ok: '可以。', bad: '锅底糊了，有苦味。', slow: '我站着都能睡着。', out: '明天还这个点。'
          },
          fx: { fact: ['song', 'f_plain'] }, fxGood: { aff: { song: 1 } } },
        { id: 'song_warm', need: { day: [3, 5] }, key: true, at: 'open',
          order: ['congee:温'],
          say: {
            in: '白粥。晾两分钟再装。',
            chat: [['a', '烫的咽不下去，喉咙下班了。'], ['z', '刚下夜班？眼睛都是红的。'], ['a', '嗯。十四张床，一宿没坐。'], ['a', '你这儿几点收摊？'], ['z', '九点。卖完就收。']],
            good: '这个温度，刚好。', ok: '可以。', bad: '还是烫。算了。', slow: '再等我就睡过去了。', out: '九点就收。真好。'
          },
          fx: { fact: ['song', 'f_warm'] } },
        { id: 'song_oil_old', group: 'song_oil', need: { day: [6, 11], oilAge: [3] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。……你这油几天了？',
            chat: [['z', '粥里又没放油。'], ['a', '屋里有。我鼻子比化验单准。'], ['a', '油有点哈了。'], ['z', '……才第三天。还能用。'], ['a', '胃不好的，闻着就反酸。建议换。']],
            good: '粥是好的。油不是。', ok: '可以。', bad: '粥都串上油味了。', slow: '我门口等。里头呛。', out: '油该换了。我走了。'
          },
          fx: { set: ['song_oilwarn'], fact: ['song', 'f_nose'], aff: { song: -1 } } },
        { id: 'song_oil_new', group: 'song_oil', need: { day: [6, 11], oilAge: [0, 1] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。今天油是新的。',
            chat: [['z', '你咋晓得？我天不亮才换的。'], ['a', '闻的。病房里练出来的。'], ['a', '这屋里，病人待得住。'], ['z', '啥子病人？'], ['a', '没什么。粥晾好了吗？']],
            good: '嗯。就是这个。', ok: '可以。', bad: '今天粥不如油。', slow: '没事。这屋里不呛。', out: '走了。回去补觉。'
          },
          fx: { set: ['song_oilgood'], fact: ['song', 'f_nose'], aff: { song: 1 } } },
        { id: 'song_gone', group: 'song_ward', need: { day: [13, 17], oilAge: [3], flags: ['song_oilwarn'] }, key: true, act: 'absent',
          remark: { who: 'gong', line: '咦，今天我成头一个了？那个小护士呢？' },
          fx: { set: ['song_gone'], aff: { song: -1 } },
          after: 'sc_song_family' },
        { id: 'song_big', group: 'song_ward', need: { day: [13, 17], oilAge: [0, 2] }, key: true, at: 'open',
          act: 'big', togo: true,
          note: '今早六碗白粥，晾温，六点来取。—消化科 宋',
          order: ['congee:温', 'congee:温', 'congee:温', 'congee:温', 'congee:温', 'congee:温'],
          say: {
            in: '条子看见了吧？六碗。',
            chat: [['z', '六碗，你一个人喝得完？'], ['a', '科里的。今天出院六个。'], ['a', '盖子别扣死，会闷出水。'], ['z', '你们科还管饭？'], ['a', '不管。是我多嘴。……只管这一顿。']],
            good: '六碗都是温的。可以。', ok: '行，我拎走了。', bad: '这几碗我不敢给病人。', slow: '七点交班，我得走了。', out: '钱在这儿，你点点。'
          },
          fx: { set: ['song_big'], rep: 1 },
          fxGood: { aff: { song: 2 }, later: { days: 2, fx: { rep: 2 }, note: '有人说，是消化科的护士让来的。' } },
          fxBad: { aff: { song: -1 } },
          after: 'sc_song_firstmeal' },
        { id: 'song_letter', need: { day: [18, 20], not: ['song_gone'] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。我坐一下。',
            chat: [['z', '今天舍得坐了？'], ['a', '腿不是我的了。打了报告请假。'], ['a', '周叔，熬粥要考证吗？'], ['z', '不用。要考我也考不过。'], ['a', '……真好。']],
            good: '……嗯？哦。喝完了。', ok: '可以。', bad: '今天粥不对。我也不对。', slow: '不急。我眯一会儿。', out: '几点了？我得走了。'
          },
          leave: { memento: 'm_letter', line: '凳子上落了个信封，没封口。' },
          after: 'sc_song_letter' },
        { id: 'song_off', need: { day: [21, 23], not: ['song_gone'], seen: ['song_letter'] }, key: true, act: 'absent',
          remark: { who: 'ali', line: '周叔，宋护士今天下不来，科里在抢救。' } },
        { id: 'song_wu', need: { day: [23, 25], not: ['song_gone'] }, at: 'open', togo: true,
          order: ['congee:温', 'congee:温'],
          say: {
            in: '两碗，晾温，带走。',
            chat: [['a', '一碗给十二床。'], ['a', '老太太只认你家的粥。'], ['z', '哪个老太太？'], ['a', '住六楼的。有个骑手天天给她送。'], ['a', '前天抢回来的就是她。']],
            good: '她能喝半碗了。', ok: '可以。', bad: '这碗我自己喝。不给她。', slow: '查房前我得赶回去。', out: '走了。十二床等着。'
          },
          fx: { fact: ['song', 'f_wu'] }, fxGood: { aff: { song: 1 } } },
        { id: 'song_last', need: { day: [26, 28], oilAge: [0, 1] }, key: true, at: 'open',
          order: ['congee:温', 'youtiao:嫩'],
          say: {
            in: '白粥晾温。再来根油条。',
            chat: [['z', '你不是不要油的？'], ['a', '今天的油，准予食用。'], ['a', '我下个月还上夜班。'], ['z', '那六点的粥，我给你留着。'], ['a', '护士站黑板上，我写了你电话。']],
            good: '头一回吃你的油条。', ok: '可以。', bad: '油条还是算了。', slow: '今天不赶。我调休。', out: '明天还是第一个。'
          },
          fx: { set: ['song_stay'], fact: ['song', 'f_board'] }, fxGood: { aff: { song: 2 } } }
      ],
      barks: {
        in: ['白粥。别的我闻都不想闻。', '老样子。', '白粥，晾温。谢谢。', '老样子。不要油的。'],
        inRain: ['伞又忘在科里了。', '下雨，急诊又要爆。', '粥。我淋了一路。'],
        inOilOld: ['你这油，第几天了？', '油有点哈。', '今天我在门口喝。', '这味，病人闻不得。'],
        inPriceUp: ['涨了？粥也涨？', '可以。夜班费没涨。', '涨就涨，别减米。'],
        inPriceDown: ['便宜了。米没少吧？', '降价了？油还换吗？', '别亏本。我还要来的。'],
        inBusy: ['今天比急诊人还多。', '我排着。站得住。', '第一个也要排？可以。'],
        good: ['嗯。是米熬的。', '温的，正好。', '活过来了。', '这碗能给病人喝。'],
        ok: ['可以。', '还行。', '能喝。'],
        bad: ['烫。咽不下去。', '有糊味。', '粥串了油味。', '今天不如昨天。'],
        slow: ['我站着能睡着。', '再等要交班了。', '快点，眼皮要闭了。'],
        out: ['走了。回去睡觉。', '明天还这个点。', '九点收摊。真好。', '周叔，记得换油。']
      },
      epilogue: [
        { need: { flags: ['song_big'], not: ['song_gone'] }, text: '消化科护士站的小黑板上，值班表旁边多了一行小馆的电话。出院第一顿：白粥，晾温。小宋没辞。' },
        { need: { flags: ['song_gone', 'song_denied'] }, text: '小宋没再从柳河街走。有出院的病人问粥店，她说：换一家吧。黑板上那行电话，是她自己擦的。' },
        { need: { flags: ['song_gone', 'song_stay'] }, text: '黑板上那行电话她擦过一回。月底她闻了闻你的油，又用粉笔描了回去。她没辞。' },
        { need: { flags: ['song_gone'] }, text: '小宋后来不大来了。听阿力说她没辞，还在十二床那一层，只是下了夜班不再往这边走。' },
        { text: '小宋没辞。下了夜班还是第一个到，白粥，晾温，站着喝完。那封信，她说找不着了。' }
      ],
      scenes: {
        sc_song_firstmeal: { id: 'sc_song_firstmeal', title: '出院第一顿', when: 'close', light: 'dusk',
          beats: [
            { enter: 'neighbor', slot: 1 },
            ['n', '收摊的时候进来个人，手腕上还套着住院腕带。'],
            ['neighbor', '老板，还有粥没得？宋护士让来的。'],
            ['z', '收摊了。……锅底还有一碗，您不嫌的话。'],
            { sfx: 'pour' },
            ['neighbor', '她说出院头一顿，得喝你家的。'],
            ['neighbor', '说了小半个月了，一科室都晓得。'],
            ['z', '她没跟我提过。每天就站着喝一碗，喝完就走。'],
            ['neighbor', '她还说，哪天油不对了就莫来。'],
            ['z', '……那我得天天闻着点。'],
            ['neighbor', '多少钱？'],
            ['z', '锅底的，不算钱。'],
            ['neighbor', '那这个留给你。算个凭证。'],
            { fx: { fact: ['song', 'f_ward'], memento: 'm_band', rep: 1 } },
            ['n', '腕带上印着名字和床号。我没细看，挂在了墙上的钉子上。'],
            { exit: 'neighbor' }
          ] },
        sc_song_family: { id: 'sc_song_family', title: '找上门', when: 'close', light: 'dusk',
          beats: [
            { enter: 'neighbor', slot: 1 },
            ['n', '一个中年人站在门口，没进来。手里捏着张出院单。'],
            ['neighbor', '你就是宋护士说的那家粥店？'],
            ['z', '是我。您……进来坐？'],
            ['neighbor', '不坐了。我爸出院头一顿，她让来你这儿。'],
            ['neighbor', '喝完回去烧心，折腾了一宿。'],
            ['neighbor', '粥是白的。可你这屋里的油味……'],
            ['neighbor', '她在科里替你赔了不是。'],
            { fx: { fact: ['song', 'f_ward'] } },
            { choice: [
              { label: '退钱赔不是', hint: '退三十元', fx: { cash: -30, rep: 1, set: ['song_apology'] },
                then: [['z', '对不住。钱您拿着，给老人家买点好的。'], ['neighbor', '钱是小事。莫砸了她的话。']] },
              { label: '当面把油倒了', hint: '这锅油作废', fx: { cash: -20, burn: -6, aff: { song: 1 }, set: ['song_dumped'] },
                then: [{ sfx: 'pour' }, ['z', '这锅我当您面倒了。明天是新的。'], ['neighbor', '……我会跟她说。']] },
              { label: '粥里没有油', hint: '不花钱', fx: { rep: -2, aff: { song: -2 }, set: ['song_denied'] },
                then: [['z', '他喝的是白粥。粥里一滴油都没有。'], ['neighbor', '要得。我原话带给她。']] }
            ] },
            { exit: 'neighbor' }
          ] },
        sc_song_letter: { id: 'sc_song_letter', title: '信封', when: 'close', light: 'dusk',
          beats: [
            { enter: 'song', slot: 1 },
            ['n', '天擦黑，小宋回来了。外套底下还是那身护士服。'],
            ['song', '周叔，我早上是不是落了个信封？'],
            { prop: 'envelope', label: '没封口的信封' },
            ['z', '压在零钱盒底下。没动。'],
            ['song', '……没封口。你没看？'],
            ['z', '就看见两个字，"申请"。不是故意的。'],
            ['song', '写了半个月，改了四遍。主任名字都写错过一回。'],
            ['song', '周叔，你这儿真不招人？'],
            { choice: [
              { label: '招，你来', hint: '她不一定来', fx: { set: ['song_offer'], aff: { song: 1 } },
                then: [['z', '招。早上五点到。'], ['song', '五点。比夜班还早。'], ['song', '……我再想想。信先不交。']] },
              { label: '我只租了一个月', hint: '说实话，丢面子', fx: { set: ['song_truth'], aff: { song: 2 } },
                then: [['z', '我这店只租了二十八天。'], ['song', '二十八天，你还天天五点起？'], ['z', '……锅都买了。'], ['song', '行。那我也再上一个月。']] },
              { label: '先喝碗粥', hint: '搭一碗粥', fx: { cash: -3, set: ['song_bowl'], aff: { song: 1 } },
                then: [{ sfx: 'pour' }, ['z', '先喝粥。晾过了。'], ['song', '你就会这一句。'], ['song', '……比我们主任会说。']] }
            ] },
            { fx: { fact: ['song', 'f_resign'] } },
            { prop: 'envelope', off: true },
            { exit: 'song' }
          ] }
      }
    },
    /* ───────────── 老葛 ───────────── */
    ge: {
      first: '旧西装，袖口磨亮了。先问价。',
      usual: ['congee', 'youtiao'],
      facts: {
        f_ask: '先问价，再点。点最顶饱最便宜的。',
        f_less: '提价以后，他少点了一样。',
        f_phone: '手机充着电，亮着的是招聘页面。',
        f_acct: '落下的那张纸上写着：成本会计，十九年。',
        f_sit: '一杯豆浆，坐到八点半。说是去公司。',
        f_home: '上个月起就没班上了。家里不知道。',
        f_books: '他替你理账，早饭记账上。七点到，自己带笔。',
        f_cart: '他改去公交站台的早餐车了。那边便宜五毛。',
        f_interview: '他去面试了。小郑说，西装是熨过的。',
        f_wife: '钱是他爱人给的。头一个礼拜她就知道了。'
      },
      mementos: {
        m_resume: { name: '一份简历', text: '"成本会计，十九年。期望薪资：面议。"照片上的西装是新的。', kind: 'paper' },
        m_ledger: { name: '老葛理的账', text: '横平竖直，一笔不差。最后一页只有两个字：两清。', kind: 'book' }
      },
      beats: [
        { id: 'ge_first', need: { day: [1, 3] }, key: true, at: 'rush',
          order: ['congee', 'youtiao'],
          say: {
            in: '劳驾，粥多少钱一碗？',
            chat: [['z', '牌子上有。您看看。'], ['a', '看见了。问一声，心里踏实。'], ['a', '麻烦您，一碗粥，一根油条。'], ['a', '按理说……这儿能坐多久？'], ['z', '随便坐。我这儿不赶人。']],
            good: '实在。粥是稠的。', ok: '还说得过去。', bad: '按这个价，粥稀了。', slow: '不赶。我八点半的班。', out: '到点了，上班去。'
          },
          fx: { fact: ['ge', 'f_ask'] }, fxGood: { aff: { ge: 1 } } },
        { id: 'ge_up', group: 'ge_price', need: { day: [6, 11], any: [{ price: [2] }, { priceAvg: [1.4] }] }, key: true, at: 'rush',
          order: ['congee'],
          say: {
            in: '涨了？……那就一碗粥。',
            chat: [['z', '油条不要了？'], ['a', '油条吃多了犯困。下午要对账。'], ['a', '劳驾，借个插座。手机没电了。'], ['z', '插座在冰柜后头，线短。'], ['a', '不碍事。我凑过去坐。']],
            good: '粥还是稠的。', ok: '还说得过去。', bad: '涨了价，粥倒稀了。', slow: '我不赶。', out: '到点了，上班去。'
          },
          fx: { set: ['ge_less'], fact: ['ge', 'f_less'] } },
        { id: 'ge_fair', group: 'ge_price', need: { day: [6, 11], price: [0, 1], priceAvg: [0, 1.3] }, key: true, at: 'rush',
          order: 'usual', hide: true,
          say: {
            in: '老样子。价没动吧？',
            chat: [['a', '没动就好。整条街都在涨，平均两成。'], ['z', '您中午吃啥？'], ['a', '带了饭。她装的。'], ['a', '劳驾，借个插座。手机没电了。'], ['z', '冰柜后头。线短，您凑合。']],
            good: '实在。', ok: '还说得过去。', bad: '今天这根油条是凉的。', slow: '我不赶。', out: '到点了，上班去。'
          },
          fx: { fact: ['ge', 'f_phone'] }, fxGood: { aff: { ge: 1 } } },
        { id: 'ge_resume', need: { day: [12, 14] }, key: true, at: 'rush',
          order: [{ wish: '顶饱' }],
          say: {
            in: '劳驾，今天哪样最顶饱？',
            chat: [['a', '喂？……是我，是我。'], ['a', '……好的好的，我等通知。'], ['z', '公司的事？'], ['a', '推销的。现在推销的也客气。'], ['a', '麻烦您，再给杯白开水。']],
            good: '这个能顶到中午。', ok: '还说得过去。', bad: '这个不太顶饱。', slow: '我不赶。今天不赶。', out: '……到点了。走了。'
          },
          leave: { memento: 'm_resume', line: '桌上落了张纸，是份简历。' },
          fx: { fact: ['ge', 'f_acct'] } },
        { id: 'ge_soy', group: 'ge_mid', need: { day: [15, 17], any: [{ price: [2] }, { priceAvg: [1.4] }] }, key: true, at: 'rush',
          order: ['soy'],
          say: {
            in: '劳驾，就一杯豆浆。',
            chat: [['z', '不吃点干的？'], ['a', '家里吃过了。吃得很饱。'], ['a', '……光喝豆浆，能坐吧？'], ['z', '坐。凳子又不收钱。'], ['a', '站台新来个早餐车，便宜五毛。']],
            good: '豆浆是现磨的。', ok: '还说得过去。', bad: '豆浆兑了水吧。', slow: '我不赶。', out: '到点了。'
          },
          fx: { set: ['ge_soyonly'], fact: ['ge', 'f_sit'], aff: { ge: -1 } } },
        { id: 'ge_offer', group: 'ge_mid', need: { day: [15, 17], price: [0, 1], priceAvg: [0, 1.3] }, key: true, at: 'rush',
          order: 'usual',
          say: {
            in: '老样子。听说来查账了？',
            chat: [['z', '要台账。我只有本粗账。'], ['a', '方便的话，拿来我看一眼。'], ['a', '进货跟流水记在一页？这不行。'], ['z', '厂里管油，我只记桶数。'], ['a', '收摊别急着走。我等你。']],
            good: '实在。', ok: '还说得过去。', bad: '今天这粥对不住这价。', slow: '我不赶。我看账。', out: '我不走。收摊再说。'
          },
          after: 'sc_ge_books' },
        { id: 'ge_credit', need: { day: [17, 21], flags: ['ge_books'] }, key: true, at: 'rush',
          order: 'usual', hide: true, act: 'credit',
          note: '葱的票找不着了，今天补一张。—葛',
          say: {
            in: '老样子。记账上。',
            chat: [['a', '你把豆子钱记成了收入。'], ['a', '我改过来了，红笔，你看得清。'], ['a', '那个学生问我，成本怎么摊。'], ['a', '我说，良心不入账。'], ['z', '那它记在哪一栏？']],
            good: '实在。这顿记原价。', ok: '还过得去。照记。', bad: '糊了也记原价。规矩。', slow: '我不赶。账还没对完。', out: '今天这笔，我记上了。'
          },
          fx: { aff: { ge: 1 } } },
        { id: 'ge_cart', need: { day: [18, 23], not: ['ge_books'], any: [{ flags: ['ge_soyonly'] }, { flags: ['ge_refused'] }, { flags: ['ge_charity'] }] },
          key: true, act: 'absent',
          remark: { who: 'gong', line: '老葛啊？在站台早餐车那儿站着吃呢。' },
          fx: { set: ['ge_cart'], fact: ['ge', 'f_cart'] } },
        { id: 'ge_interview', need: { day: [22, 25], flags: ['ge_books'] }, key: true, act: 'absent',
          remark: { who: 'zheng', line: '周叔，葛叔今天面试去了！西装是熨过的。' },
          fx: { set: ['ge_interview'], fact: ['ge', 'f_interview'] } },
        { id: 'ge_last', need: { day: [26, 28], flags: ['ge_books'] }, key: true, at: 'rush',
          order: 'usual', act: 'repay',
          say: {
            in: '老样子。今天起，付现钱。',
            chat: [['z', '找着了？'], ['a', '下月一号报到。管成本。'], ['a', '小公司。袖口不用那么亮了。'], ['z', '恭喜。……我嘴笨，就这一句。'], ['a', '账我今天结清。劳驾，点一点。']],
            good: '实在。一直都实在。', ok: '还说得过去。', bad: '最后一笔，给我糊了。', slow: '我不赶。还没到一号。', out: '收摊我再来。有本账。'
          },
          fx: { set: ['ge_repaid'] },
          after: 'sc_ge_clear' }
      ],
      barks: {
        in: ['劳驾，粥今天什么价？', '老样子。价没动吧？', '麻烦您，哪样最顶饱？', '还是靠墙那个座。'],
        inRain: ['下雨，我多坐一会儿。', '皮鞋进水了。不碍事。', '雨天，公司……不急。'],
        inOilOld: ['油条颜色不太对。', '这油，折旧折过头了。', '油钱省了，药钱补。'],
        inPriceUp: ['涨了？那少要一样。', '涨五毛，一月十五块。', '那……就一杯豆浆吧。', '我算算。……算了。'],
        inPriceDown: ['降了？别做亏本账。', '那劳驾，加根油条。', '薄利，就得靠量。'],
        inBusy: ['人多，我让个座？', '我往角上挪挪。', '生意好，账更要清。'],
        good: ['实在。', '这顿值这个价。', '稠。能顶到中午。', '按理说，这价你亏了。'],
        ok: ['还说得过去。', '还行。', '对得起这个价。'],
        bad: ['这价，不该是这个味。', '粥稀了。', '凉的。我不说第二回。', '糊了。糊了也是成本。'],
        slow: ['我不赶。', '不急，八点半的班。', '慢点没事，别出错。'],
        out: ['到点了，上班去。', '座给您腾出来了。', '明天还这个价吧？', '走了。去公司。']
      },
      epilogue: [
        { need: { flags: ['ge_books', 'ge_repaid'] }, text: '老葛下月一号报到。头一个月工资下来，他来请你吃早饭——在你店里请你，自己掏钱，自己记账。' },
        { need: { flags: ['ge_books'] }, text: '账记得横平竖直，欠的早饭一笔没漏。老葛还在找活，七点到，带着自己的笔。' },
        { need: { flags: ['ge_charity'] }, text: '那句"饭照吃"之后，老葛没再进门。听小郑说他找着活了，在城那头，早饭在公交站解决。' },
        { need: { flags: ['ge_cart'] }, text: '老葛在站台的早餐车前站着吃，便宜五毛。西装还是那件。八点半，他照旧"去公司"。' },
        { text: '老葛还是先问价，再点最顶饱的，八点半起身说去公司。你没问是哪家。' }
      ],
      scenes: {
        sc_ge_books: { id: 'sc_ge_books', title: '粗账', when: 'close', light: 'dusk',
          beats: [
            { enter: 'ge', slot: 1 },
            { prop: 'ledger', label: '老周的账本' },
            ['n', '收摊了。老葛还坐着，面前摊着我那本账，像在批作业。'],
            ['ge', '老周，进货和流水记在一页上，是查不清的。'],
            ['z', '你懂这个？'],
            ['ge', '成本会计。干了十九年。'],
            ['ge', '按理说，不该在早点铺子里跟人讲这个。'],
            { if: { seen: ['ge_resume'] }, then: [['z', '那张纸我捡着了。没往外说。']], else: [] },
            ['z', '你那写字楼……是不是不用去了？'],
            ['ge', '……上个月起。家里还不知道。'],
            ['ge', '我每天照样打领带出门。领带是她买的。'],
            ['ge', '这样。账我替你理清，早饭在你这儿记一个月账。'],
            ['ge', '找着活了，一笔一笔还你。利息就免了吧。'],
            { fx: { fact: ['ge', 'f_home'] } },
            { choice: [
              { label: '行，记账上', hint: '一个月早饭先欠着', fx: { set: ['ge_books'], aff: { ge: 2 }, fact: ['ge', 'f_books'] },
                then: [{ sfx: 'page' }, ['z', '行。记账上。我那字丑，您多担待。'], ['ge', '明天七点到。我自己带笔。']] },
              { label: '账不用，饭照吃', hint: '白送一个月早饭', fx: { set: ['ge_charity'], aff: { ge: -1 } },
                then: [['z', '账不用理。饭你照吃。'], ['ge', '老周，我不是来讨饭的。'], ['ge', '……这话，当我没说过。']] },
              { label: '小本生意不赊', hint: '现钱现货', fx: { set: ['ge_refused'] },
                then: [['z', '我这小本生意，赊不起。'], ['ge', '应该的，应该的。是我唐突了。']] }
            ] },
            { prop: 'ledger', off: true },
            { exit: 'ge' }
          ] },
        sc_ge_clear: { id: 'sc_ge_clear', title: '两清', when: 'close', light: 'dusk',
          beats: [
            { enter: 'ge', slot: 1 },
            { prop: 'ledger', label: '理好的账' },
            ['n', '老葛把账本推过来，两只手推的，像递一份报表。'],
            ['ge', '账在这儿。从头一天起，一笔不差。'],
            ['z', '欠的那些，早上你都结了。'],
            ['ge', '所以最后一页写的是"两清"。'],
            ['z', '两个字占一整页，你也舍得。'],
            ['ge', '钱是她给的。她早就知道了。'],
            ['z', '知道多久了？'],
            ['ge', '头一个礼拜。饭盒她照样装，一句没问。'],
            ['ge', '头一个月工资下来，我请你吃早饭。'],
            ['z', '上哪儿请？'],
            ['ge', '就这儿。在你店里请你。我付钱，我记账。'],
            { fx: { aff: { ge: 1 }, memento: 'm_ledger', fact: ['ge', 'f_wife'], set: ['ge_clear'] } },
            { exit: 'ge' }
          ] }
      }
    },
    /* ───────────── 阿力 ───────────── */
    ali: {
      first: '头盔没摘，站着吃，电瓶车没熄火。',
      usual: ['soy', 'youtiao', 'congee:温'],
      facts: {
        f_fast: '要快的。头盔不摘，站着吃。',
        f_two: '每天多带一碗白粥，要晾过的。他说是客人备注。',
        f_dock: '出餐慢了，他是真的被扣钱。一回八块。',
        f_sit: '下雨那天他摔了，雨衣撕了。头一回坐下来。',
        f_wu: '那碗粥送六楼吴奶奶。平台上没有这一单。',
        f_hosp: '吴奶奶夜里被救护车接走了。粥不要了。',
        f_ten: '每天坐十分钟。"这十分钟算我的。"'
      },
      mementos: {
        m_slip: { name: '一张手写的条子', text: '"六楼吴 白粥一碗 晾一下再装 牙不好 敲门轻点"。没有单号。', kind: 'note' },
        m_stool: { name: '靠门的那张凳子', text: '凳腿上缠了圈胶布，写着"力"。每天十分钟。', kind: 'tool' }
      },
      beats: [
        { id: 'ali_first', need: { day: [1, 3] }, key: true, at: 'rush',
          order: ['soy', 'youtiao'],
          say: {
            in: '豆浆油条！要快的！',
            chat: [['z', '坐着吃嘛，凳子空着。'], ['a', '不坐不坐，车没熄火。'], ['a', '手上还挂三单，还剩——四分钟。'], ['z', '那油条我给你套个袋子。']],
            good: '行，够快。', ok: '走了走了。', bad: '油条是凉的啊。', slow: '哎这单要超时了！', out: '走了！'
          },
          fx: { fact: ['ali', 'f_fast'] }, fxGood: { aff: { ali: 1 } } },
        { id: 'ali_two', need: { day: [4, 7] }, key: true, at: 'rush', togo: true,
          order: ['soy', 'youtiao', 'congee:温'],
          say: {
            in: '豆浆油条。加碗粥带走。',
            chat: [['a', '周叔，粥晾一下再装啊。'], ['z', '凉了不好喝。'], ['a', '客人备注的，牙不好。'], ['a', '六楼没电梯，爬上去正好温。'], ['z', '哪个客人这么讲究？']],
            good: '温的，行。', ok: '走了。', bad: '太烫了，没法送。', slow: '粥那单要超了！', out: '明天还要一碗啊。'
          },
          fx: { fact: ['ali', 'f_two'] } },
        { id: 'ali_fast', group: 'ali_speed', need: { day: [8, 11], fast: true }, key: true, at: 'rush', togo: true,
          order: 'usual', hide: true,
          say: {
            in: '老样子。周叔你这儿快！',
            chat: [['a', '快两分钟，就能多跑一单。'], ['a', '一单四块，四块够一碗粥。'], ['z', '粥还是晾？'], ['a', '晾。天天都晾。'], ['z', '那位牙不好的，天天点？']],
            good: '行，够快。', ok: '走了。', bad: '今天咋回事啊。', slow: '昨天不这样啊！', out: '走了，明天还来。'
          },
          fx: { set: ['ali_fast'], aff: { ali: 1 } } },
        { id: 'ali_slow', group: 'ali_speed', need: { day: [8, 11] }, key: true, at: 'rush', togo: true,
          order: ['soy', 'congee:温'],
          say: {
            in: '昨天等久了，超时了。',
            chat: [['a', '扣了八块。八块！'], ['a', '油条不要了，省时间。'], ['z', '……对不住。今天先出你的。'], ['a', '粥照旧，晾一下。别的不要。']],
            good: '今天可以。', ok: '走了。', bad: '又慢又烫。', slow: '又要扣钱了啊。', out: '再慢我真不来了。'
          },
          fx: { set: ['ali_slow'], fact: ['ali', 'f_dock'] } },
        { id: 'ali_fall', need: { day: [12, 16], weather: 'rain' }, key: true, at: 'late',
          order: [{ wish: '汤水' }, 'congee:温'],
          say: {
            in: '……有热的带汤的吗？',
            chat: [['z', '雨衣咋个撕了？'], ['a', '桥头滑了一下。没事没事。'], ['a', '粥洒了。得重买一碗。'], ['z', '坐下。头盔摘了，滴我一地。'], ['a', '……就坐五分钟。五分钟。']],
            good: '……暖过来了。', ok: '行。', bad: '凉的。跟外头一样。', slow: '没事。今天不赶了。', out: '六楼还等着。走了。'
          },
          leave: { memento: 'm_slip', line: '凳子底下有张湿了的条子。' },
          fx: { fact: ['ali', 'f_sit'] }, fxGood: { aff: { ali: 1 } },
          after: 'sc_ali_sit' },
        { id: 'ali_cancel', need: { day: [17, 19] }, key: true, at: 'rush',
          order: ['soy', 'youtiao'],
          say: {
            in: '老样子。……粥不要了。',
            chat: [['z', '今天没那一碗？'], ['a', '敲了，没人开门。'], ['a', '对门说，夜里救护车来过。'], ['z', '哪个医院？'], ['a', '……我先跑单。跑完再说。']],
            good: '嗯。', ok: '走了。', bad: '……算了。', slow: '今天不催你。', out: '走了。'
          },
          fx: { set: ['ali_wuhosp'], fact: ['ali', 'f_hosp'] } },
        { id: 'ali_absent', need: { day: [19, 21], seen: ['ali_cancel'] }, key: true, act: 'absent',
          remark: { who: 'song', line: '戴头盔那个骑手，昨晚在我们科陪床。坐着睡的。' } },
        { id: 'ali_hosp_fast', group: 'ali_hosp', need: { day: [21, 25], fast: true }, key: true, at: 'early', togo: true,
          order: 'usual', hide: true,
          say: {
            in: '老样子。粥送医院。',
            chat: [['a', '她说医院的粥没米味。'], ['a', '宋护士说，你家的能喝。'], ['z', '喝口豆浆再走。'], ['a', '……坐两分钟。就两分钟。'], ['a', '探视七点半才开门。']],
            good: '温的。她能喝。', ok: '走了。', bad: '这碗不能给她。', slow: '探视要赶不上了！', out: '走了，十二床。'
          },
          fx: { set: ['ali_sits'], aff: { ali: 1 } } },
        { id: 'ali_hosp_slow', group: 'ali_hosp', need: { day: [21, 25] }, key: true, at: 'early', togo: true,
          order: ['congee:温'],
          say: {
            in: '就一碗粥，晾温。快。',
            chat: [['z', '你自己不吃？'], ['a', '来不及。'], ['a', '探视就半个钟头。'], ['a', '你这儿排一回，就赶不上了。']],
            good: '行。', ok: '走了。', bad: '烫的。路上我拿手扇。', slow: '赶不上了。……算了。', out: '走了。'
          },
          fx: { set: ['ali_rush'] } },
        { id: 'ali_last', need: { day: [26, 28], fast: true }, key: true, at: 'rush',
          order: 'usual', hide: true,
          say: {
            in: '老样子。',
            chat: [['z', '粥又要了？'], ['a', '昨天出的院。又回六楼了。'], ['a', '我坐十分钟再送。'], ['z', '不怕超时？系统不是在读秒？'], ['a', '这十分钟算我的。']],
            good: '坐着吃，是不一样。', ok: '行。', bad: '坐下才吃出来，凉的。', slow: '不催。我坐着等。', out: '到点了。六楼。'
          },
          fx: { set: ['ali_ten'], fact: ['ali', 'f_ten'], memento: 'm_stool' }, fxGood: { aff: { ali: 2 } } }
      ],
      barks: {
        in: ['周叔，老样子，快的！', '豆浆油条，走着吃。', '啥最快来啥。', '老样子。别太烫啊。'],
        inRain: ['雨天单多，快快快。', '雨衣不脱了，滴水莫怪。', '来碗热的，手僵了。', '路滑，粥盖紧点。'],
        inOilOld: ['油条有股味啊。', '今天不要油条了。', '这油，客人要投诉的。'],
        inPriceUp: ['涨了？一单才四块。', '那油条不要了。', '行吧，快就行。'],
        inPriceDown: ['便宜了？那加个蛋。', '周叔，降价别降速啊。', '行，多来一根。'],
        inBusy: ['排这么长？要超时了。', '周叔，能先出我的吗？', '我站门口，好了喊我。'],
        good: ['行，够快。', '够劲。', '温的，正好。', '这速度，五星好评。'],
        ok: ['走了。', '行。', '还成。'],
        bad: ['凉的。', '粥太烫，没法送。', '下回别这样啊。', '油条软了。'],
        slow: ['超时了超时了！', '又要扣钱了。', '周叔，还剩三十秒！', '我手上还有三单！'],
        out: ['走了！', '明天还来。', '六楼还等着。', '车没熄火，走了。']
      },
      epilogue: [
        { need: { flags: ['ali_ten', 'ali_share'] }, text: '阿力每天坐下吃十分钟，头盔搁在凳子上。吴奶奶那碗粥，账上记的是"一人一半"。' },
        { need: { flags: ['ali_ten'] }, text: '阿力每天坐下吃十分钟。"这十分钟算我的。"吃完拎着晾温的粥，上六楼。' },
        { need: { flags: ['ali_rush'] }, text: '阿力还是站着吃，眼睛盯着倒计时。吴奶奶的粥他改在别处买了，那家出得快。' },
        { text: '阿力还来，雨天来得多。头盔不摘，车不熄火，一碗晾温的粥挂在车把上。' }
      ],
      scenes: {
        sc_ali_sit: { id: 'sc_ali_sit', title: '没有单号', when: 'close', light: 'rain',
          beats: [
            { sfx: 'rain' },
            { enter: 'ali', slot: 1 },
            ['n', '雨没停。阿力又折回来了，头盔还在往下滴水。'],
            ['ali', '周叔，我掉了张条子没有？就一张，巴掌大。'],
            { prop: 'paper', label: '湿了的条子' },
            ['z', '凳子底下捡的。不是平台的票。'],
            ['z', '没单号。字是手写的，墨都泡开了。'],
            ['ali', '……头一个月，是她儿子在平台上点的。'],
            ['ali', '后来不点了。她还开着门等。'],
            ['ali', '我一敲门，她就说"小伙子来了"。也不问钱。'],
            ['z', '那这钱谁出？'],
            ['ali', '一碗粥嘛。我多跑一单就有了。'],
            { do: 'hold', label: '按住，卧一个荷包蛋' },
            { sfx: 'sizzle' },
            ['z', '坐下吃。面是刚下的。'],
            ['ali', '我没点啊。'],
            ['z', '没单号的，我这儿也有。'],
            { fx: { unlock: 'poachnoodle', fact: ['ali', 'f_wu'], aff: { ali: 1 } } },
            { choice: [
              { label: '粥钱以后算我的', hint: '每天少收一碗粥钱', fx: { set: ['ali_share'], aff: { ali: 1 } },
                then: [['ali', '不行不行。……一人一半。']] },
              { label: '钱照收，先出你的', hint: '别的客人多等一会', fx: { set: ['ali_first'], aff: { ali: 1 } },
                then: [['ali', '行。这个比免单实在。']] }
            ] },
            { prop: 'paper', off: true },
            { exit: 'ali' }
          ] }
      }
    }
  };
});
;
/* content/arcs_b.js */
BSX.define('content/arcs_b', function () {
  var FRESH = [{ flags: ['hood'] }, { oilAge: [0, 2] }];
  /* ───────────────────────── 龚师傅 ───────────────────────── */
  var gong = {
    first: '六点零五到，嗓门比喇叭大。零钱一个钢镚不差。',
    usual: ['soy', 'youtiao:老'],
    facts: {
      f_exact: '龚师傅的零钱是头天晚上数好的，一个钢镚不多。',
      f_tea: '煮茶叶蛋的茶是龚师傅带的。他说何姨就这么煮，蛋壳先敲裂。',
      f_oil: '油旧了他不骂人，只说今天光灌豆浆。',
      f_river: '他说柳河街从前是条河，他在里头摸过螃蟹。填了才通的7路。',
      f_retire: '龚师傅二十七号退休，开最后一趟头班车。他叫我莫往外摆。',
      f_route: '7路下月并线，柳河街这一站要撤。早上那拨人得走到桥头去坐。',
      f_morning: '退休头一天，他八点半才来。四点半就醒了，不晓得早晨拿来做啥。'
    },
    mementos: {
      m_notice: { name: '7路并线通知', text: '柳河街站那一行，他拿圆珠笔划了一道，又描了一遍。', kind: 'paper' },
      m_mug: { name: '搪瓷茶缸', text: '缸底一圈茶垢，把手上缠着胶布。他说先搁我这儿。', kind: 'mug' }
    },
    beats: [
      { id: 'gong1', need: { day: [2, 3] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '豆浆灌缸里！油条炸老点！',
          chat: [['a', '六点十分发车，一分不能晚。'], ['z', '来得及。您开7路的？'], ['a', '头班车。全车人等我一个。'], ['a', '炸老点，嚼起要有个响动。'], ['z', '老我会。焦了您莫怪。']],
          good: '要得！是老法子炸的。', ok: '还将就。明天再老点。', bad: '老是老，莫给我炸焦嘛。', slow: '快点哦，车不等人！', out: '钱正好，莫数了。发车！'
        },
        fx: { fact: ['gong', 'f_exact'] }, fxGood: { aff: { gong: 1 } } },
      { id: 'gong2', need: { day: [4, 7] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样！给你带了包茶。',
          chat: [['a', '何姨就拿这个茶煮蛋。'], ['z', '您认得何姨？'], ['a', '吃了她十一年早饭噻。'], ['a', '蛋壳先敲裂，才进味。'], ['z', '我试试。煮咸了您莫骂。']],
          good: '火候跟上了，有点像她。', ok: '还成。比头回强。', bad: '今天炸嫩了，没得响动。', slow: '老周，还有四分钟哈！', out: '茶叶搁你灶边了。走了！'
        },
        fx: { unlock: 'teaegg', fact: ['gong', 'f_tea'] }, fxGood: { aff: { gong: 1 } } },
      { id: 'gong3a', group: 'gong_oil', need: { day: [9, 12], oilAge: [3] }, key: true, at: 'early',
        order: ['soy'],
        say: {
          in: '今天光灌豆浆，不要油条。',
          chat: [['z', '油条不要了？给您炸老的。'], ['a', '炸老的最吃油，你晓得噻。'], ['a', '何姨是三天一换。'], ['z', '……我明天换。'], ['a', '我啥子都没说哈。']],
          good: '豆浆没得毛病。', ok: '嗯。灌满就行。', bad: '咋个豆浆都不烫了？', slow: '算了算了，路上喝。', out: '换了油，我再要油条。'
        },
        fx: { fact: ['gong', 'f_oil'], set: ['gong_sawold'] }, fxBad: { aff: { gong: -1 } } },
      { id: 'gong3b', group: 'gong_oil', need: { day: [9, 12] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子！你晓得的。',
          chat: [['a', '看到你倒油了，清亮。'], ['a', '从前这条河也照得见人。'], ['z', '河？这街上哪来的河？'], ['a', '就你脚底下。我摸过螃蟹。'], ['a', '后来填了，才通的7路。']],
          good: '脆！一路上都是香的。', ok: '要得，将就。', bad: '咋个，今天手生了？', slow: '各位乘客，司机还没吃。', out: '走了！明天六点零五。'
        },
        fx: { fact: ['gong', 'f_river'] }, fxGood: { aff: { gong: 1 } } },
      { id: 'gong4a', group: 'gong_slip', need: { day: [13, 15], priceAvg: [1.5] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '涨了？等我重数一遍。',
          chat: [['a', '你涨得，退休金涨不得。'], ['z', '退休？您要退了？'], ['a', '二十七号，最后一趟。'], ['a', '车队都没几个晓得。'], ['a', '你莫往外摆哈。']],
          good: '贵两毛，这根值。', ok: '行嘛。贵是贵了点。', bad: '贵了，还没给我炸老！', slow: '剩十几趟了，莫给我误。', out: '数好了，还是正好。'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },
      { id: 'gong4b', group: 'gong_slip', need: { day: [13, 15] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子！问你个事。',
          chat: [['a', '二十七号你开不开门？'], ['z', '开。咋个了？'], ['a', '没啥子。我最后一趟。'], ['z', '……您要退了？'], ['a', '到站了噻。你莫声张。']],
          good: '安逸。还能吃十几回。', ok: '要得。', bad: '今天不脆，扣你一分。', slow: '车不等人，我也不等。', out: '六点零九。走了！'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },
      { id: 'gong5', need: { day: [16, 17] }, key: true, act: 'absent', order: [],
        remark: { who: 'zhao', line: '咦，头班车今天不是老龚开。' } },
      { id: 'gong6', need: { day: [19, 23] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样。那天我签字去了。',
          chat: [['a', '7路下个月并线。'], ['a', '柳河街这一站，不停了。'], ['z', '那早上这拨人咋个办？'], ['a', '走到桥头去坐，多走八分钟。'], ['a', '收了车我再来找你。']],
          good: '站撤得脱，这口撤不脱。', ok: '嗯。吃嘛。', bad: '心头有事，吃不出味。', slow: '走了，拿到车上吃。', out: '站牌上也贴起了。'
        },
        leave: { memento: 'm_notice', line: '他把并线通知落在柜台上了。' },
        fx: { set: ['gong_route'], fact: ['gong', 'f_route'] },
        after: 'sc_gong_route' },
      { id: 'gong7', need: { day: [27, 27] }, key: true, at: 'early',
        order: 'usual', hide: true, act: 'treat',
        note: '二十七号早点开门。最后一趟，莫迟到 —龚',
        say: {
          in: '最后一趟。老样子！',
          chat: [['a', '后头那个学生娃算我的。'], ['a', '坐了我三年车，没迟到过。'], ['a', '老赵爷孙俩，你多看到点。'], ['z', '晓得。今天这根我请。'], ['a', '莫来这套。两份钱，正好。']],
          good: '要得。这个味我记到了。', ok: '行。够了。', bad: '最后一回，还是没炸老。', slow: '今天……喊车等我一回。', out: '六点十分。7路，发车！'
        },
        fxGood: { aff: { gong: 1 } } },
      { id: 'gong8', need: { day: [28, 28] }, key: true, at: 'late',
        order: [{ wish: '汤水' }, 'youtiao:老'],
        say: {
          in: '八点半了。整口带汤的。',
          chat: [['a', '四点半就醒了，改不脱。'], ['a', '走到车场，才想起不用去。'], ['z', '坐嘛。今天不赶车。'], ['a', '不赶车，我还不会点菜了。'], ['a', '茶缸先搁你这儿哈。']],
          good: '原来早饭可以坐到吃。', ok: '慢慢吃，是这个味。', bad: '不赶车，嘴还刁起来了。', slow: '不急不急。我今天不赶。', out: '明天……还是这个点哈。'
        },
        leave: { memento: 'm_mug', line: '茶缸留在架子上，他没带走。' },
        fx: { fact: ['gong', 'f_morning'], set: ['gong_mug'] }, fxGood: { aff: { gong: 1 } } }
    ],
    barks: {
      in: ['老样子！六点零五，没晚。', '豆浆灌缸里，灌满！', '油条炸老，零钱正好。', '各位乘客，司机先吃。'],
      inRain: ['落雨天，车要慢慢开。', '雨刮器又该换了。', '这种雨，从前河要涨水。'],
      inOilOld: ['今天油条少来一根。', '锅头颜色深了哈。', '何姨是三天一换。'],
      inPriceUp: ['涨了？等我重数。', '多两毛，零钱要另备。', '贵了嘛，就要炸老点。'],
      inPriceDown: ['便宜了？莫亏到自己。', '零钱还多出两毛。', '薄利可以，油要换哈。'],
      inBusy: ['人多，我掐到表的。', '队都排到站牌了！', '先紧到赶车的做。'],
      good: ['脆！嚼起有响动。', '要得，老得正好。', '这一口顶一上午。', '巴适，没得毛病。'],
      ok: ['还将就。', '要得嘛。', '凑合，没误点。'],
      bad: ['老是老，莫焦嘛。', '今天炸嫩了，没响动。', '豆浆不烫，扣一分。'],
      slow: ['车不等人哦！', '还有三分钟发车。', '算了，拿到路上吃。'],
      out: ['走了，发车！', '六点零九，正点。', '明天见，莫睡过头。', '下一站，车场。']
    },
    epilogue: [
      { need: { flags: ['gong_mug', 'gong_bridge'], not: ['left'] },
        text: '7路并了线。桥头多了张折叠桌，卖的是小馆的粥。龚师傅坐在边上指哪个口子人多，茶缸搁在桌角。' },
      { need: { flags: ['gong_mug'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '茶缸还在架子上。龚师傅每天八点半来，坐着喝完一碗粥，再走到桥头，看别个开他的7路。' },
      { need: { flags: ['gong_mug', 'left'] },
        text: '茶缸跟着铺盖一起搬走了。龚师傅说，新铺子开在哪儿，他就坐哪路车去，反正现在有的是早晨。' },
      { need: { flags: ['gong_retire'] },
        text: '7路并了线，柳河街的站牌拆了。有人看见龚师傅清早还在老地方站着，看一眼表，站一会儿就走。' },
      { text: '7路头班车换了司机，六点十分照样过站。再没有人跳下来，喊一声“豆浆灌缸里”。' }
    ],
    scenes: {
      sc_gong_route: { id: 'sc_gong_route', title: '并线通知', when: 'close', light: 'dusk', beats: [
        { enter: 'gong', slot: 1 },
        ['n', '傍晚他又来了，没穿制服。离了方向盘，他手不晓得往哪儿搁。'],
        ['gong', '“各位乘客，柳河街到了”——这句话，下个月就不报了。'],
        ['gong', '通知落你这儿了。莫还我，我车上还有一摞。'],
        { prop: 'paper', label: '并线通知' },
        ['z', '我看了。划了道杠的那一行，是我门口这个站。'],
        ['gong', '我划的。划完又想，划它有啥子用。'],
        ['gong', '说正事。下月起，早上那拨人不从你门口过了。'],
        ['z', '……少好多？您给个数。'],
        ['gong', '我车上每天四十来个，一半在这站下。二十个，你算嘛。'],
        ['z', '二十碗粥，二十根油条。……我不敢往下算。'],
        ['gong', '莫慌。何姨那年修路，门口挖了三个月，也这么熬过来的。'],
        ['z', '她咋个熬的？'],
        ['gong', '把粥端到桥头去卖。就这么笨，笨了三个月。'],
        { choice: [
          { label: '贴在门口', hint: '明天客流少一点', fx: { rep: +2, flowNext: 0.92, set: ['gong_told'] },
            then: [['z', '贴门口。街坊早晚要晓得，不如从我这儿晓得。'], ['gong', '要得。老实人的办法。明天少几个人，你莫怨我。']] },
          { label: '去桥头试卖', hint: '多备二十碗料', fx: { cash: -20, set: ['gong_bridge'], later: { days: 2, fx: { cash: +36, rep: +1 }, note: '桥头试卖的二十碗粥卖完了。龚师傅指的那个口子，人是多。' } },
            then: [['z', '明早我端一锅粥去桥头，先试二十碗。'], ['gong', '我指给你哪个口子人多。那一站我闭到眼睛都报得出。']] },
          { label: '先不声张', hint: '照常做生意', fx: { set: ['gong_quiet'], later: { days: 3, fx: { rep: -1 }, note: '有人在门口说：站要撤了，老周早就晓得，就是不讲。' } },
            then: [['z', '先不说。月底……月底再看。'], ['gong', '随你。反正站牌上贴起的，认得字的都看得到。']] }
        ] },
        { fx: { aff: { gong: 1 } } },
        ['gong', '走了。明早六点零五，油条还是炸老点。'],
        { exit: 'gong' }
      ] }
    }
  };
  /* ───────────────────────── 小满 ───────────────────────── */
  var man = {
    first: '隔壁改衣的。站我门口数人，嘴里念念有词，一样不买。',
    usual: ['scallion', 'congee:温'],
    facts: {
      f_count: '小满站我门口数客人，数到十一个，扭头就回去了。',
      f_window: '我五点四十起油锅，她五点半就把后窗关死。',
      f_cough: '隔壁后窗糊了层报纸。豆豆说，他同桌糖糖又请假了。',
      f_tangtang: '白粥是给糖糖带的，要晾温。糖糖和豆豆是同桌。',
      f_smoke: '我的油烟顺着后窗灌进小满店里。糖糖气管不好。'
    },
    mementos: {
      m_drawing: { name: '糖糖的画', text: '蜡笔画的小馆，门口站个胖子。烟囱上没画烟。', kind: 'drawing' },
      m_curtain: { name: '蓝布门帘', text: '小满缝的。右下角留了一块空，等店名。', kind: 'cloth' }
    },
    beats: [
      { id: 'man1', need: { day: [3, 3] }, key: true, at: 0.5, act: 'peek', order: [],
        say: {
          in: '不买，我就看一哈。',
          chat: [['a', '九个，十个……十一个。'], ['z', '您数啥子？买东西里边请。'], ['a', '数人。量衣服量惯了，手痒。'], ['z', '那……量出来合不合身？'], ['a', '合身。就是领口紧了点。']],
          out: '回了，店里没人守。'
        },
        fx: { fact: ['man', 'f_count'] } },
      { id: 'man2', need: { day: [4, 6] }, key: true, at: 'early', act: 'peek', order: [],
        say: {
          in: '老周，你几点起油锅？',
          chat: [['z', '五点四十。吵到您了？'], ['a', '不吵。问个尺寸，好下剪子。'], ['z', '起锅的钟点也算尺寸？'], ['a', '算。那我五点半关后窗。'], ['z', '关窗？天又不冷。']],
          out: '十四锅了。我回了。'
        },
        fx: { fact: ['man', 'f_window'] } },
      { id: 'man3a', group: 'man_air', need: { day: [7, 11], oilAge: [3], not: ['hood'] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'zhao', line: '豆豆说，他那同桌又没来，咳嗽。' },
        fx: { fact: ['man', 'f_cough'], set: ['man_shut'] } },
      { id: 'man3b', group: 'man_air', need: { day: [7, 11] }, key: true, at: 'rush',
        order: ['scallion:嫩'],
        say: {
          in: '葱油饼一张，要嫩的。',
          chat: [['z', '今天咋个舍得进来了？'], ['a', '路过。后窗今天没关。'], ['z', '后窗？'], ['a', '没啥子。闻起是香的。'], ['a', '头一回，闻起是香的。']],
          good: '嗯，针脚匀。手艺不坏。', ok: '还行，差半寸火候。', bad: '煎过了，边上发苦。', slow: '店里没人守，快点嘛。', out: '钱放这儿了，不找。'
        },
        fx: { set: ['man_buys'] }, fxGood: { aff: { man: 1 } } },
      { id: 'man4', need: { day: [12, 22], oilAge: [3], not: ['hood'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '我不买。收了摊找你。',
          chat: [['z', '有事？现在说嘛。'], ['a', '当到客人，不好开口。'], ['z', '是不是我哪里得罪……'], ['a', '收了摊说。你手上饼要糊了。']],
          out: '我在隔壁等你。'
        },
        after: 'sc_man_knock' },
      { id: 'man5', need: { day: [12, 20], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '葱油饼，再打包碗粥。',
          chat: [['a', '粥晾一哈，娃儿喝。'], ['z', '糖糖？豆豆那个同桌？'], ['a', '你倒记得清。她最馋糖油果子。'], ['z', '那个我不会，没炸过。'], ['a', '明天我来教。比锁边简单。']],
          good: '温的，刚好端回去。', ok: '要得，凑合。', bad: '太烫了，她喝不得。', slow: '娃儿等到上学的！', out: '碗我下午拿来还。'
        },
        fx: { unlock: 'tangyou', fact: ['man', 'f_tangtang'], set: ['man_buys', 'man_congee'] },
        fxGood: { aff: { man: 1 } } },
      { id: 'man6', need: { day: [15, 23], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        note: '留碗粥晾起，糖糖要喝 —小满',
        say: {
          in: '老样子，打包。',
          chat: [['a', '糖糖跟豆豆是同桌。'], ['a', '画了张画，非要给你。'], ['z', '给我？画的啥子？'], ['a', '你这店。她问我咋不关窗了。'], ['a', '……粥晾好没？我赶时间。']],
          good: '她昨晚睡了个整觉。', ok: '行，温度够了。', bad: '烫的！你忘了？', slow: '她等到上学呢。', out: '画搁柜台上了，莫弄脏。'
        },
        leave: { memento: 'm_drawing', line: '零钱盒边上压着一张蜡笔画。' },
        fxGood: { aff: { man: 1 } } },
      { id: 'man7', need: { day: [18, 25], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        say: {
          in: '老样子。今天带了东西。',
          chat: [['a', '从前你一起锅，她就咳。'], ['z', '……是我的油烟？'], ['a', '现在不咳了。不说这个。'], ['a', '叶儿粑，我妈的方子，你尝。'], ['z', '我收了。明天学起来卖。']],
          good: '糖糖说粥有米油了。', ok: '要得。', bad: '今天粥稀了点。', slow: '我店里熨斗还烫着。', out: '你那门框，我量过了。'
        },
        fx: { unlock: 'yeerba', fact: ['man', 'f_smoke'], set: ['man_yeerba'] },
        fxGood: { aff: { man: 1 } } },
      { id: 'man8a', group: 'man_end', need: { day: [27, 28], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '一张饼，一碗粥晾温。',
          chat: [['a', '你那门帘，油都吃透了。'], ['a', '我裁了块新的，蓝布。'], ['z', '多少钱？我给。'], ['a', '提钱我就拿回去拆了。'], ['z', '……那我不提了。']],
          good: '吃了一个月，没吃腻。', ok: '行嘛。', bad: '月底了，手莫松。', slow: '不急，今天不赶活。', out: '收了摊莫走，等我。'
        },
        after: 'sc_man_curtain' },
      { id: 'man8b', group: 'man_end', need: { day: [27, 28] }, key: true, at: 'late',
        act: 'peek', order: [],
        say: {
          in: '听说你月底到期？',
          chat: [['z', '到期。续不续还没想好。'], ['a', '你要留下嘛，我有个条件。'], ['z', '您说。'], ['a', '油勤换。勤换，窗我就开。'], ['a', '糖糖……想喝你的粥。']],
          out: '我回了，针还插起的。'
        },
        fx: { set: ['man_closed'] } }
    ],
    barks: {
      in: ['葱油饼，打包。', '一张饼，一碗温粥。', '老样子，糖糖等到的。', '饼要软，莫煎硬了。'],
      inRain: ['落雨，窗本来就关起的。', '雨天活少，来坐一哈。', '伞搁门口了，滴水。'],
      inOilOld: ['今天我把窗关了。', '这油，该换了噻。', '味道飘过来了哈。'],
      inPriceUp: ['涨了？布也在涨。', '行嘛，都不容易。', '贵了，饼莫做小了。'],
      inPriceDown: ['便宜了？莫做亏了。', '你这是让利还是甩卖？', '省的钱给糖糖买本子。'],
      inBusy: ['今天二十几个了，我数的。', '人多，我等一哈。', '先紧到上班的。'],
      good: ['手艺不坏。', '糖糖喝得完。', '饼是软的，针脚匀。', '粥有米油了。'],
      ok: ['还行。', '还成，差半寸。', '将就。'],
      bad: ['饼煎苦了。', '粥太烫，她喝不得。', '今天不如昨天。'],
      slow: ['店里没人守。', '熨斗还烫起的！', '娃儿要迟到了。'],
      out: ['回了。', '碗下午还你。', '有活要赶。', '走了，针还插起的。']
    },
    epilogue: [
      { need: { flags: ['man_curtain'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '门帘右下角绣上了店名，蓝布白线。小满的后窗一直开着，糖糖趴在窗台上写作业，闻得见粥香。' },
      { need: { flags: ['man_curtain', 'left'] },
        text: '门帘卷起来，跟铺盖一起搬走了，右下角还空着。小满说，新店开在哪儿，她去量门框。' },
      { need: { flags: ['man_sealed'] },
        text: '小满的后窗封死了，店里白天也开着灯。糖糖不咳了。她没再来买过东西，也没再说什么。' },
      { need: { flags: ['man_congee'] },
        text: '小满还是每天来打包一碗白粥，要晾温的。糖糖长高了，碗自己端得稳了。' },
      { text: '隔壁的缝纫机每天响到天黑。早上五点半，那扇后窗照旧先关上。' }
    ],
    scenes: {
      sc_man_knock: { id: 'sc_man_knock', title: '后窗', when: 'close', light: 'dusk', beats: [
        { sfx: 'knock' },
        { enter: 'man', slot: 1 },
        ['n', '卷帘门刚拉一半，有人敲。小满手里攥着块湿毛巾，没进来。'],
        ['man', '老周，我量人量惯了，说话也直，你莫见怪。'],
        ['man', '你的油烟，顺着后窗往我店里灌。一早上没断过。'],
        ['z', '我当……我当您是嫌我抢生意。'],
        ['man', '抢啥子？我卖的是裤脚，你卖的是油条。'],
        ['man', '糖糖气管不好。你一起锅，她咳得跟拉风箱一样。'],
        ['z', '她咳……咳多久了？'],
        ['man', '我门口数的不是你客人，是你一早上炸了几锅。'],
        ['man', '油新那两天，她能睡个整觉。油一老，半夜就咳醒。'],
        ['z', '您该早点来说的。'],
        ['man', '你才开张，招牌还是白的。我张不开这个嘴。'],
        { fx: { fact: ['man', 'f_smoke'], set: ['man_knocked'] } },
        { choice: [
          { label: '明天就换油', hint: '订一桶新油', fx: { cash: -45, aff: { man: 1 }, set: ['man_promise'] },
            then: [['z', '明天就换。往后三天一换，抽屉里有张条子管着我。'], ['man', '好。那我先开条缝试试，看她咳不咳。']] },
          { label: '帮她封后窗', hint: '花三十，今晚干', fx: { cash: -30, set: ['man_sealed'] },
            then: [['z', '后窗我给您打胶封死，今晚就弄。'], ['man', '封了，店里就没得亮了。……封嘛。灯我多开一盏。']] },
          { label: '罩子再等等', hint: '眼下不花钱', fx: { aff: { man: -1 }, set: ['man_wait'] },
            then: [['z', '排烟罩要好几百。等我缓过这个月，行不？'], ['man', '行。那我接着关窗。毛巾我多打湿两条。']] }
        ] },
        { exit: 'man' }
      ] },
      sc_man_curtain: { id: 'sc_man_curtain', title: '门帘', when: 'close', light: 'dusk', beats: [
        { enter: 'man', slot: 1 },
        { enter: 'tangtang', slot: 2 },
        ['n', '小满抱着一卷蓝布进来，布边还挂着线头。糖糖跟在她后头。'],
        { prop: 'curtain', label: '蓝布门帘' },
        ['man', '旧那块油都吃透了，搓都搓不出本色。我换了。'],
        ['man', '你这门框我量了三回，左边比右边矮半公分。'],
        ['z', '何姨那时候就是歪的。我还当是我眼睛不好。'],
        ['tangtang', '周爷爷，右下角是空的！'],
        ['man', '留到绣店名的。你想好了，跟我说一声。'],
        ['z', '还没想好。想好了，头一个跟您说。'],
        { if: { flags: ['man_promise'] }, then: [['man', '你说换油，就真换了。我后窗开了半个月，记到的。']], else: [] },
        { if: { flags: ['hood'] }, then: [['man', '装了罩子那天起，我后窗就没关过。']], else: [] },
        ['z', '我嘴笨，不晓得咋个谢您。'],
        ['man', '莫谢。踩个凳子，挂上。'],
        { do: 'hold', label: '按住，把门帘挂上' },
        { fx: { memento: 'm_curtain', set: ['man_curtain'], aff: { man: 1 } } },
        ['tangtang', '妈妈，挂歪啦！'],
        ['man', '门框歪，帘子是正的。……明天我拿颗钉子来。'],
        { exit: 'tangtang' },
        { exit: 'man' }
      ] }
    }
  };
  /* ───────────────────────── 小郑 ───────────────────────── */
  var zheng = {
    first: '豆浆加煎蛋。本子摊在柜台上，问题比钱先掏出来。',
    usual: ['soy', 'egg'],
    facts: {
      f_cost: '小郑问我一根油条成本多少。我答不上来。',
      f_oilnote: '他问这锅油第几天了。我说了，他记在本子上。',
      f_photo: '他拍我的油锅，说油清得照得见人。',
      f_ge: '小郑请老葛吃过一碗面，问了他一下午。',
      f_video: '第十八天那条视频是小郑发的。他照实拍，照实写。',
      f_thesis: '他的毕业论文叫《一家早餐店的诚实成本》。写的是我。'
    },
    mementos: {
      m_page: { name: '落下的一页纸', text: '油条：面三毛一，油一毛八。人工那栏打了个问号。', kind: 'note' },
      m_photo: { name: '清晨的油锅', text: '小郑拍的。背面写着：数据都是真的，谢谢周叔。', kind: 'photo' }
    },
    beats: [
      { id: 'zheng1', need: { day: [5, 6] }, key: true, at: 0.6,
        order: ['soy', 'egg'],
        say: {
          in: '周叔早！豆浆，加个煎蛋。',
          chat: [['a', '周叔，我能问个冒昧的问题吗？'], ['z', '问嘛。莫问我岁数就行。'], ['a', '一根油条，成本多少钱？'], ['z', '……这个，没算过。'], ['a', '面、油、气、您的工。我帮您算？']],
          good: '蛋边是脆的，记一笔。', ok: '还行，七十分吧。', bad: '蛋煎老了，也记一笔。', slow: '周叔，我八点有课……', out: '明天还来，打扰了！'
        },
        fx: { fact: ['zheng', 'f_cost'] }, fxGood: { aff: { zheng: 1 } } },
      { id: 'zheng2a', group: 'zheng_fryer', need: { day: [8, 12], oilAge: [3] }, key: true, at: 0.6,
        order: ['soy'],
        say: {
          in: '今天只要豆浆，谢谢。',
          chat: [['z', '蛋不要了？今天鸡蛋新鲜。'], ['a', '周叔，这锅油第几天了？'], ['z', '……第三天吧。'], ['a', '好的。我记一下，不介意吧？'], ['a', '能拍张锅吗？就拍锅。']],
          good: '豆浆没问题，满分。', ok: '嗯，正常发挥。', bad: '豆浆也有点糊味。', slow: '不急，正好写两行。', out: '照片我不乱发，放心。'
        },
        fx: { fact: ['zheng', 'f_oilnote'], set: ['zheng_sawold'] } },
      { id: 'zheng2b', group: 'zheng_fryer', need: { day: [8, 12] }, key: true, at: 0.6,
        order: 'usual', hide: true,
        say: {
          in: '老样子！能拍张油锅吗？',
          chat: [['z', '油锅有啥子好拍的。'], ['a', '清的，能照见人。很出片。'], ['a', '冒昧问一下，您几天一换？'], ['z', '三天。何姨留的规矩。'], ['a', '这句太好了，我原话记下来。']],
          good: '脆边，跟上回一样稳。', ok: '可以，及格线以上。', bad: '今天蛋煎散了哎。', slow: '周叔，八点有课！', out: '照片回头洗给您！'
        },
        fx: { fact: ['zheng', 'f_photo'], set: ['zheng_sawfresh'] }, fxGood: { aff: { zheng: 1 } } },
      { id: 'zheng3', need: { day: [13, 17] }, key: true, at: 0.6,
        order: ['soy', 'egg', { wish: '顶饱' }],
        say: {
          in: '老样子，再来个顶饱的。',
          chat: [['a', '昨天请葛叔吃了碗面。'], ['z', '你认得老葛？'], ['a', '聊了一下午，他特别专业。'], ['a', '就是让我千万别写他名字。'], ['z', '写？你写啥子？']],
          good: '现做的，人工得算进去。', ok: '嗯，很稳定。', bad: '今天凉了半截。', slow: '我等，正好数数人。', out: '下午还要访谈，先走！'
        },
        leave: { memento: 'm_page', line: '他坐过的凳子上落了一页纸，是张成本表。' },
        fx: { fact: ['zheng', 'f_ge'] } },
      { id: 'zheng4', need: { day: [18, 18] }, key: true, act: 'absent', order: [],
        remark: { who: 'walkin', line: '拍视频那个，是不是个学生？' } },
      { id: 'zheng5', need: { day: [19, 19] }, key: true, act: 'absent', order: [],
        remark: { who: 'ge', line: '恕我多嘴，视频是小郑发的。' },
        fx: { fact: ['zheng', 'f_video'], set: ['zheng_known'] } },
      { id: 'zheng6a', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_good'] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '周叔……视频是我发的。',
          chat: [['z', '老葛说了。'], ['a', '我应该先问您的，对不起。'], ['z', '吃了再说。蛋还要脆边？'], ['a', '……要。'], ['a', '您真的不生气啊？']],
          good: '还是那个味，我没写错。', ok: '嗯，跟视频里一样。', bad: '今天不如视频里。', slow: '我等，多久都等。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_good' },
      { id: 'zheng6b', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_bad'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '周叔，视频……是我发的。',
          chat: [['z', '……嗯。晓得了。'], ['a', '我只是照实拍的，没剪。'], ['a', '没想到会有这么多人骂。'], ['z', '收了摊再说。你先站边上。']],
          out: '我在门口等您。'
        },
        after: 'sc_zheng_bad' },
      { id: 'zheng6c', group: 'zheng_viral', need: { day: [20, 23] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子。视频是我发的。',
          chat: [['z', '老葛说了，说没几个人看。'], ['a', '一千二百播放，不算少了。'], ['a', '评论区有人问粥多少钱。'], ['z', '那你告诉他嘛。'], ['a', '说了。还说了油三天一换。']],
          good: '脆边。我得补一条更新。', ok: '嗯，数据稳定。', bad: '今天这个，我也照记。', slow: '不急，我理理本子。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_plain' },
      { id: 'zheng7', need: { day: [25, 28] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子！论文交了！',
          chat: [['a', '附录全是您这一个月。'], ['a', '换了几回油，倒了几碗粥。'], ['z', '老师咋个说？'], ['a', '说数太碎。我说碎才是真的。'], ['a', '给您洗了张照片，别嫌丑。']],
          good: '这口我写进致谢了。', ok: '嗯，跟数据对得上。', bad: '今天这笔，我也照记。', slow: '不急，今天没课了。', out: '毕业了我还来吃！'
        },
        leave: { memento: 'm_photo', line: '零钱盒底下压着一张照片，背面有字。' },
        fx: { fact: ['zheng', 'f_thesis'], set: ['zheng_thesis'] }, fxGood: { aff: { zheng: 1 } } }
    ],
    barks: {
      in: ['周叔早！豆浆加煎蛋。', '老样子，蛋要脆边。', '周叔，今天油第几天？', '老样子，我坐角上写。'],
      inRain: ['下雨，客流会少两成吧？', '本子差点淋湿了。', '雨天的成本怎么算啊？'],
      inOilOld: ['今天不要煎的，谢谢。', '这锅颜色，我记一下。', '周叔，油该换了吧？'],
      inPriceUp: ['涨了五毛？我记一笔。', '涨价前后我都数人。', '学生党，有点肉疼。'],
      inPriceDown: ['降了？毛利还够吗？', '便宜归便宜，别省油。', '这价我得重新算。'],
      inBusy: ['排了十一个，我数的。', '人多，我先写两行。', '翻台率挺高啊。'],
      good: ['脆边，记一笔。', '跟昨天一样稳。', '这个蛋值这个价。', '豆浆是现磨的吧？'],
      ok: ['还行。', '及格。', '嗯，正常。'],
      bad: ['蛋老了。', '豆浆有糊味。', '这个我也得记。'],
      slow: ['八点有课……', '周叔，我要迟到了。', '等了六分钟，我掐的。'],
      out: ['明天还来！', '走了，上课去。', '周叔回见！', '打扰了，谢谢周叔。']
    },
    epilogue: [
      { need: { flags: ['zheng_redo'] },
        text: '小郑在同一个号上发了第二条：凌晨五点半，一锅旧油倒进桶里。论文里，这一天单独占了一页。' },
      { need: { flags: ['zheng_deleted'] },
        text: '视频删了，论文里那一章没删。小郑毕业那天来喝了碗豆浆，把本子留在柜台上，没说话。' },
      { need: { flags: ['zheng_thesis', 'viral_good'] },
        text: '答辩过了。附录第一页是那张油锅的照片，表格最后一栏写着“倒掉的油”。评语只有一句：数据可信。' },
      { need: { flags: ['zheng_thesis'] },
        text: '《一家早餐店的诚实成本》装订好了，他送来一本。致谢里写：感谢周叔，让我每天都有东西可记。' },
      { text: '那个带笔记本的学生毕了业。有人说在别的街上见过他，还是先点豆浆，再问成本。' }
    ],
    scenes: {
      sc_zheng_good: { id: 'sc_zheng_good', title: '是我发的', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他把手机扣在柜台上，屏幕朝下，像怕它自己亮起来。'],
        { prop: 'phone' },
        ['zheng', '周叔，我得跟您坦白一件事。我在写毕业论文。'],
        ['zheng', '题目叫《一家早餐店的诚实成本》。写的是您。'],
        ['z', '我？我有啥子好写的。诚实还要本钱？'],
        ['zheng', '要的。您换一回油，少挣四十。这是我算的。'],
        ['zheng', '我把这笔账拍出来了，一句好话都没加。'],
        ['z', '门口排队那些，都是看了那个来的？'],
        ['zheng', '对。昨天有个阿姨从城北过来的。'],
        ['z', '城北……那要转两趟车。'],
        ['zheng', '可我应该先问您的。这个我没做到。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '接着拍', hint: '往后都在镜头里', fx: { rep: +2, aff: { zheng: 1 }, set: ['zheng_open'] },
            then: [['z', '拍嘛。哪天油旧了，你也照拍，莫给我留面子。'], ['zheng', '那当然。周叔，这句我也能记吗？']] },
          { label: '到此为止', hint: '明天人少些', fx: { flowNext: 0.9, set: ['zheng_stop'] },
            then: [['z', '够了。我是卖早饭的，不是演戏的。'], ['zheng', '明白。论文里我不写店名，就写“某早餐店”。']] }
        ] },
        { prop: 'phone', off: true },
        { exit: 'zheng' }
      ] },
      sc_zheng_bad: { id: 'sc_zheng_bad', title: '照实拍的', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '卷帘门拉下一半，他还站在外头，弯着腰往里看。'],
        ['zheng', '周叔，对不起。真的对不起。'],
        ['zheng', '我拍的是第三天的油。没剪，也没配那些字。'],
        ['z', '我晓得。你没编。'],
        ['zheng', '我在写论文，《一家早餐店的诚实成本》。'],
        ['zheng', '我以为我写的是您省下的钱。'],
        ['zheng', '结果写成了客人替您付的那一部分。'],
        ['z', '底下那些评论，我戴起老花镜，一条一条看了。'],
        ['z', '胃药我兜里也揣着。在厂里吃了二十年回锅油。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '让他拍换油', hint: '明早倒掉这锅', fx: { cash: -45, burn: -6, aff: { zheng: 1 }, set: ['zheng_redo'] },
            then: [['z', '明早五点半来。拍我倒油，一滴都不留。'], ['zheng', '好。我发在同一个号上，前面那条不删。']] },
          { label: '请他删掉', hint: '视频下架', fx: { rep: -1, aff: { zheng: -1 }, set: ['zheng_deleted'] },
            then: [['z', '删了吧。我就一个月的短租，经不起。'], ['zheng', '我删。可是论文里……那一章我得留着。']] },
          { label: '不怪他', hint: '什么也不做', fx: { set: ['zheng_stays'] },
            then: [['z', '你没写错。回去吧，天黑了。'], ['zheng', '周叔，我明天还来吃。照样付钱。']] }
        ] },
        { exit: 'zheng' }
      ] },
      sc_zheng_plain: { id: 'sc_zheng_plain', title: '差一栏', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他把本子摊开，推到零钱盒边上。一页一页，记的全是我的油锅。'],
        { prop: 'notebook' },
        ['zheng', '周叔，坦白一下：我在写论文，写的就是您这店。'],
        ['zheng', '叫《一家早餐店的诚实成本》。名字有点大，我知道。'],
        ['z', '没几个人看的东西，也算论文？'],
        ['zheng', '视频没人看不要紧，账是真的就行。'],
        ['zheng', '葛叔帮我对过一遍数，他说一分不差。'],
        ['z', '老葛？他还会这个？'],
        ['zheng', '他以前是会计啊。您不知道？'],
        ['zheng', '现在就差一栏：您每天倒掉多少。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '把账给他看', hint: '进货价都在上面', fx: { aff: { zheng: 1 }, set: ['zheng_ledger'] },
            then: [['z', '账在抽屉里，第二格。莫弄乱了。'], ['zheng', '我抄完就还，一个字都不改。']] },
          { label: '只许问不许抄', hint: '账本不出抽屉', fx: { set: ['zheng_ask'] },
            then: [['z', '你问，我说。本子不出抽屉。'], ['zheng', '行。那我天天来问，您可别嫌我烦。']] }
        ] },
        { prop: 'notebook', off: true },
        { exit: 'zheng' }
      ] }
    }
  };
  /* ───────────────────────── 老秦 ───────────────────────── */
  var qin = {
    first: '三轮车停门口，裤脚带泥。每天最后一个来。',
    usual: ['noodle'],
    facts: {
      f_last: '老秦收了摊才来，吃的是我当天最后一碗。',
      f_hu: '批发商老胡的货车，天天堵在老秦的三轮前头。',
      f_kept: '涨价那几天我还要他的菜。他说：“我记到的。”',
      f_cart: '我买冻品那几天，他车上的菜剩了大半。',
      f_heyi: '老秦认得何姨。他落下的借条背面写着：不用还了。',
      f_cost: '他给我的价一直不够本。何姨帮过他，他在还。'
    },
    mementos: {
      m_pumpkin: { name: '老南瓜', text: '老秦自家地里的，放了一冬，皮上起了层白霜。', kind: 'food' },
      m_iou: { name: '一张旧借条', text: '“秦某借何某八百元。”背面一行：不用还了。', kind: 'paper' }
    },
    beats: [
      { id: 'qin1', need: { day: [6, 7] }, key: true, at: 'last',
        order: ['congee', 'scallion'],
        say: {
          in: '还有粥没得？再来张饼。',
          chat: [['z', '这个点才吃早饭？'], ['a', '收了摊才算完。'], ['a', '车上剩几个皮蛋，给你。'], ['z', '这咋个好意思……'], ['a', '何姨拿它熬粥。你也熬。']],
          good: '热的。要得。', ok: '垫一口，够了。', bad: '锅底的，我不挑。', slow: '不急，我收摊了。', out: '皮蛋搁灶台上了。'
        },
        fx: { unlock: 'pidan', fact: ['qin', 'f_last'] }, fxGood: { aff: { qin: 1 } } },
      { id: 'qin2', need: { day: [8, 9] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '听说有面了？整一碗。',
          chat: [['a', '老胡的货车又堵我前头。'], ['z', '批发那个老胡？'], ['a', '他一车，顶我一个月。'], ['z', '那您咋个……'], ['a', '不说了。面要宽汤。']],
          good: '宽汤，热乎。往后就它。', ok: '要得。', bad: '面坨了。收摊的命。', slow: '不急，我收摊了。', out: '走了。明早四点起。'
        },
        fx: { fact: ['qin', 'f_hu'] }, fxGood: { aff: { qin: 1 } } },
      { id: 'qin3a', group: 'qin_supply', need: { day: [10, 13], mat: [1] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '菜搁后门了。涨了几毛，对不住 —秦',
        say: {
          in: '老样子。秤我没压。',
          chat: [['a', '涨价的事，对不住。'], ['z', '菜都涨了，该涨就涨。'], ['a', '老胡那边便宜三成。'], ['z', '他的葱，叶子是黄的。'], ['a', '……你还要我的。我记到的。']],
          good: '嗯。今天面筋道。', ok: '行。', bad: '今天汤咸了。', slow: '不急。你先收拾。', out: '明早有嫩豆苗。'
        },
        fx: { set: ['qin_kept'], fact: ['qin', 'f_kept'] }, fxGood: { aff: { qin: 1 } } },
      { id: 'qin3b', group: 'qin_supply', need: { day: [10, 13], mat: [0, 0] }, key: true, at: 'last',
        order: ['congee'],
        say: {
          in: '今天……来碗粥就行。',
          chat: [['z', '不吃面了？'], ['a', '粥就行。'], ['z', '车上还剩恁多菜？'], ['a', '天阴，今天走得慢。']],
          good: '热的。够了。', ok: '嗯。', bad: '……没事。', slow: '不急。我也没处去。', out: '走了。菜我推回去。'
        },
        fx: { fact: ['qin', 'f_cart'], set: ['qin_frozen'] } },
      { id: 'qin4a', group: 'qin_mid', need: { day: [14, 16], mat: [1], flags: ['qin_kept'] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '南瓜搁门口了，老的，甜 —秦',
        say: {
          in: '老样子。南瓜看到没？',
          chat: [['a', '自家地里的，放了一冬。'], ['z', '这个我得给钱。称一哈。'], ['a', '不卖。没上秤。'], ['a', '熬粥。何姨那时候也熬。']],
          good: '这面，吃得踏实。', ok: '行。', bad: '今天面软了。', slow: '你忙你的。', out: '南瓜莫削皮，蒸了剥。'
        },
        fx: { unlock: 'pumpkin', memento: 'm_pumpkin', set: ['qin_pumpkin'] }, fxGood: { aff: { qin: 1 } } },
      { id: 'qin4b', group: 'qin_mid', need: { day: [14, 16], mat: [0, 0] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'gong', line: '咦，老秦那三轮今早没见到。' },
        fx: { set: ['qin_missed'] } },
      { id: 'qin5', need: { day: [17, 20] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '一碗面。啥子都不加。',
          chat: [['a', '今天剩了半车。'], ['z', '老胡又压价了？'], ['a', '他卖的比我进的还贱。'], ['z', '那他图啥子？'], ['a', '吃完。吃完我有话说。']],
          good: '热汤下去，好受点。', ok: '嗯。', bad: '……吃不出味。', slow: '不急。菜也不急了。', out: '你先收。我去推车。'
        },
        after: 'sc_qin_veg' },
      { id: 'qin6', need: { day: [21, 25] }, key: true, at: 'last',
        order: 'usual', hide: true,
        say: {
          in: '老样子。下午要落雨。',
          chat: [['a', '何姨来过信没得？'], ['z', '没有。您跟她熟？'], ['a', '认得。'], ['z', '咋个认得的？'], ['a', '……她那锅粥，救过急。']],
          good: '跟她那时候一个路子。', ok: '行。', bad: '她不这么下面。', slow: '不急。', out: '走了。车链子要修。'
        },
        leave: { memento: 'm_iou', line: '他坐的凳子底下落了张旧借条，折了四折。' },
        fx: { fact: ['qin', 'f_heyi'] }, fxGood: { aff: { qin: 1 } } },
      { id: 'qin7a', group: 'qin_end', need: { day: [27, 28], mat: [1] }, key: true, at: 'last',
        order: ['noodle', 'egg'],
        say: {
          in: '一碗面。今天加个蛋。',
          chat: [['a', '借条你捡到了？'], ['z', '压在零钱盒底下。还您？'], ['a', '留你那儿。'], ['a', '老胡说收了摊来找我。'], ['z', '找您做啥子？']],
          good: '加了蛋，像过节。', ok: '行。', bad: '月底了，都累。', slow: '不急。等个人。', out: '我不走。等老胡。'
        },
        after: 'sc_qin_cost' },
      { id: 'qin7b', group: 'qin_end', need: { day: [27, 28], mat: [0, 0] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '面不吃了。说句话就走。',
          chat: [['a', '三轮我卖了。'], ['z', '卖了？那您明天……'], ['a', '收了摊莫急到关门。']],
          out: '我在门口抽根烟。'
        },
        after: 'sc_qin_home' }
    ],
    barks: {
      in: ['老样子。一碗面。', '收摊了，来碗宽汤面。', '还有面没得？', '最后一个，又是我。'],
      inRain: ['落雨，菜不好卖。', '雨衣搁门口了，滴水。', '淋了一早上，整口热的。'],
      inOilOld: ['面就行，炸的不要。', '油该换了。何姨三天一换。', '今天不加煎蛋。'],
      inPriceUp: ['涨了？菜也涨，没法子。', '该涨。你也要活。', '贵点行，料莫减。'],
      inPriceDown: ['这价，你够本没得？', '便宜了。莫学我。', '薄利？我懂。难。'],
      inBusy: ['这个点还有人？好事。', '我等等，先紧到别人。', '不急，我收摊了。'],
      good: ['宽汤，热乎。', '这碗踏实。', '嗯，一早上值了。', '面筋道。'],
      ok: ['行。', '垫一口。', '嗯。'],
      bad: ['面坨了。', '汤咸了。', '收摊的命，不挑。'],
      slow: ['不急。', '你先收拾。', '我坐一哈。'],
      out: ['走了。明早四点起。', '碗搁这儿了。', '回了，车还要推。', '明天要晴。']
    },
    epilogue: [
      { need: { flags: ['qin_paid'] },
        text: '差价补上了。三轮车每天清晨停在门口，菜带着露水。老秦把那张借条要了回去，贴在自己的秤盒里。' },
      { need: { flags: ['qin_stay'] },
        text: '三轮车赎回来了。老秦没回乡下，天不亮照旧来送菜，只是再也不肯少算一分钱。' },
      { need: { flags: ['qin_home'] },
        text: '老秦回了乡下。年底有人捎来一袋红薯，袋口拴着张纸条：自家地里的，不要钱。' },
      { need: { flags: ['qin_pumpkin'] },
        text: '三轮车还是每天清晨停在门口。南瓜粥成了秋天的招牌，菜单上那一行写的是“老秦的南瓜”。' },
      { text: '清晨的柳河街只剩老胡的货车。有人问起那辆三轮，卖菜的都说：早不来了。' }
    ],
    scenes: {
      sc_qin_veg: { id: 'sc_qin_veg', title: '半筐菜', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        ['n', '三轮车斜在门口，筐里的菜叶打了蔫。他没坐，站着。'],
        { prop: 'veg', label: '半筐菜' },
        ['qin', '卖不脱的。你拿去。'],
        ['z', '这一筐得有二十斤。我称一哈，给钱。'],
        ['qin', '莫称。明天就烂了，烂在哪儿都是烂。'],
        { if: { mat: [1] },
          then: [['qin', '你天天要我的，我才撑到今天。']],
          else: [['qin', '你现在用老胡的，我晓得。不怪你。'], ['z', '……老胡的便宜。我这个月，紧。']] },
        ['qin', '老胡跟我说，这条街往后归他送。'],
        ['z', '你咋个回他的？'],
        ['qin', '我说，我的菜是早上四点割的，露水还在上头。'],
        ['qin', '他笑。他车上那些，是前天割的。'],
        { choice: [
          { label: '照价给钱', hint: '花四十', need: { cash: [40] }, fx: { cash: -40, aff: { qin: 1 }, set: ['qin_veg_paid'] },
            then: [['z', '菜是菜，钱是钱。拿着，莫推。'], ['qin', '……那我明早多带一把葱。']] },
          { label: '收下，熬成粥', hint: '明天粥料省了', fx: { cash: +15, set: ['qin_veg_taken'] },
            then: [['z', '要得。明天粥里都是你的菜。'], ['qin', '嗯。莫糟蹋就行。']] },
          { label: '不能白要', hint: '菜他推回去', fx: { aff: { qin: -1 }, set: ['qin_veg_refused'] },
            then: [['z', '白拿你的，我夜里睡不着。推回去吧。'], ['qin', '推回去，也是喂鸡。']] }
        ] },
        { exit: 'qin' }
      ] },
      sc_qin_cost: { id: 'sc_qin_cost', title: '够本吗', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        { enter: 'hu', slot: 2 },
        ['n', '老胡的货车没熄火，就停在三轮后头，突突地抖。'],
        ['hu', '老秦，老哥，你给老周那个价，够本不？'],
        ['qin', '我的事。'],
        ['hu', '一斤亏两毛，亏了一个月。兄弟，图啥子嘛？'],
        ['hu', '老周，我那儿便宜的管够。票嘛，下回补。'],
        { exit: 'hu' },
        ['z', '……他说的是真的？'],
        ['qin', '秤是我的，我晓得。'],
        ['qin', '那年我女人住院，何姨赊了我半年早饭。'],
        ['qin', '还借我八百。后来她说，不用还了。'],
        ['qin', '这铺子哪个接，我就按那个价送。'],
        ['z', '我不是何姨。她那本粥谱，我都还没看全。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '补上差价', hint: '花一百二', need: { cash: [120] }, fx: { cash: -120, aff: { qin: 2 }, set: ['qin_paid'] },
            then: [['z', '这一个月的差价，你拿着。往后按市价。'], ['qin', '……要得。按市价，菜我挑好的给你。']] },
          { label: '往后按市价', hint: '进货贵一点', fx: { aff: { qin: 1 }, set: ['qin_fair'] },
            then: [['z', '从明天起按市价。亏本的菜，我吃不下去。'], ['qin', '你跟她一个脾气。']] },
          { label: '先这样吧', hint: '价钱照旧', fx: { set: ['qin_owed'] },
            then: [['z', '我这月也紧。先记着，行不？'], ['qin', '记啥子。本来就没打算要。']] }
        ] },
        { exit: 'qin' }
      ] },
      sc_qin_home: { id: 'sc_qin_home', title: '最后一筐', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        ['n', '门口没有三轮车。他是走着来的，裤脚上还是泥。'],
        ['qin', '下月不出摊了。回乡下。'],
        ['z', '是因为我换了老胡的货？'],
        ['qin', '不光你一家。整条街都换了。'],
        ['qin', '给你的价，我一直没敢涨够。'],
        ['z', '为啥子？您自己都不够本。'],
        ['qin', '何姨帮过我。这铺子，我当是她的。'],
        { prop: 'veg', label: '最后一筐菜' },
        ['qin', '最后一筐。地里的，没打药。'],
        ['z', '三轮呢？'],
        ['qin', '卖了，八十。骑了十一年。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '只要你的菜', hint: '花八十赎车', need: { cash: [80] }, fx: { cash: -80, aff: { qin: 2 }, set: ['qin_stay'] },
            then: [['z', '车我帮你赎回来。往后我只要你的菜。'], ['qin', '……我回去跟屋头商量。']] },
          { label: '买下这筐', hint: '花三十', need: { cash: [30] }, fx: { cash: -30, aff: { qin: 1 }, set: ['qin_home'] },
            then: [['z', '这筐我买，按你该卖的价。'], ['qin', '要得。头一回，按足价。']] },
          { label: '请他吃碗面', hint: '一碗面的料', fx: { cash: -4, set: ['qin_home'] },
            then: [['z', '坐。面我请，吃了再走。'], ['qin', '宽汤。跟头一回一样。']] }
        ] },
        { exit: 'qin' }
      ] }
    }
  };
  return { gong: gong, man: man, zheng: zheng, qin: qin };
});
;
/* content/scenes.js */
BSX.define('content/scenes', function () {
  var main = {};
  main.m01_open = { id: 'm01_open', title: '开门', day: 1, when: 'open', light: 'dawn', beats: [
    ['n', '五点半。柳河街黑着，就我这扇门底下漏一条光。'],
    { do: 'hold', label: '按住，拉起卷帘门' },
    { shutter: 'up' }, { sfx: 'shutter' },
    ['z', '十平米。转个身，胳膊肘就碰到灶。'],
    ['n', '补偿金盘下来的。兜里剩七百，够我错一个月。'],
    ['n', '招牌是块白板。笔我买了，没敢往上落。'],
    { enter: 'zhao', slot: 1 },
    ['zhao', '哟，这扇门又响了！我还当它要一直关起。'],
    ['z', '头一天，手生。您老多担待。'],
    ['zhao', '门头咋个是白的？开店嘛，总要有个名字。'],
    ['z', '没想好。怕起大了，撑不起。'],
    ['zhao', '那不急。粥先熬起，名字是吃出来的。'],
    ['zhao', '看你拿勺那个手，不像厨子。以前做啥子的？'],
    ['z', '厂里管食堂后勤。管了二十年油盐米面，没掌过勺。'],
    ['zhao', '管食堂的出来卖早饭……要得，要得。'],
    ['zhao', '六点四十，我带孙子来。他嘴刁，你莫怪。'],
    ['z', '六点四十。头一锅粥给您留着。'],
    { exit: 'zhao' },
    { sfx: 'bell' }
  ] };
  main.m01_close = { id: 'm01_close', title: '抽屉里的条子', day: 1, when: 'close', light: 'dusk', beats: [
    ['n', '头一天收摊。零钱盒端起来，比我想的轻。'],
    { do: 'tap', label: '拉开柜台下的抽屉' },
    { sfx: 'page' },
    { prop: 'paper', label: '何姨的条子' },
    ['n', '抽屉里一张条子，压着一本手写的粥谱。'],
    ['z', '“油三天一换，别省。省下来的都要还。”'],
    ['z', '……前头那位何姨留的。字写得凶。'],
    { prop: 'notebook', label: '粥谱' },
    ['z', '“米一水十二，冬天一比十。先泡米，小火。”'],
    ['z', '“顺一个方向搅，莫偷懒。”……连这个都写了。'],
    ['n', '厂里那锅油用到第几天，哪个本子上都不写。我晓得。'],
    { fx: { memento: 'm_heyi_note' } },
    { fx: { memento: 'm_recipe' } },
    { do: 'tap', label: '把条子贴在灶台边' },
    { prop: 'paper', off: true },
    ['z', '贴这儿。炸油条一抬头就看得见。'],
    ['n', '胃又顶了一下。药在兜里，我没去摸。'],
    { light: 'night' }
  ] };
  main.m02_close = { id: 'm02_close', title: '老煎锅', day: 2, when: 'close', light: 'dusk', beats: [
    ['n', '灶台底下有个铁家伙，旧报纸包了好几层。'],
    { do: 'hold', label: '按住，把它拖出来' },
    { sfx: 'knock' },
    ['z', '一口煎锅。沉得很，锅底黑得发亮。'],
    { enter: 'qin', slot: 2 },
    ['qin', '哦，这口锅还在。'],
    ['qin', '何姨拿它烙葱油饼。煎蛋也不粘。'],
    ['z', '我没烙过饼。在厂里，我只管签字领面粉。'],
    ['qin', '粥谱后头几页有。她啥子都写了的。'],
    ['qin', '头一回先拿油养一哈。莫用洗洁精，伤锅。'],
    ['z', '养锅要多少油？我怕手重了。'],
    ['qin', '一勺。抹匀，小火烤干。跟养地一样，急不得。'],
    { sfx: 'sizzle' },
    { fx: { unlock: 'scallion' } },
    { fx: { unlock: 'egg' } },
    ['n', '油抹上去，锅“吱”了一声。它比我熟这间铺子。'],
    ['qin', '明早的葱，我多放一把。莫给钱。'],
    ['z', '那不行。该多少是多少。'],
    ['qin', '……那你烙出来，给我留一张。'],
    { exit: 'qin' }
  ] };
  main.m07_close = { id: 'm07_close', title: '七天一交', day: 7, when: 'close', light: 'dusk', beats: [
    { enter: 'landlord', slot: 2 },
    { prop: 'keys', label: '一串钥匙' },
    ['landlord', '老周，今天第七天。我是路过，不是来催你。'],
    ['landlord', '……好嘛，是来催你。二百四，七天一交。'],
    ['z', '晓得。盒子里的钱，我数过两遍了。'],
    ['landlord', '数两遍它也不得多一张。晚上账上扣。'],
    { prop: 'lease', label: '短租合同' },
    ['landlord', '说正事。短租二十八号到头，要续，押金一千二。'],
    ['landlord', '二十六号晚上我来，你给句话。我也有房贷嘛。'],
    { if: { rep: [60] },
      then: [
        ['landlord', '你门口这几天排队，我在楼上打望到了的。'],
        ['landlord', '有人来问这个门脸，出价不低。我先没应。']
      ],
      else: [
        { if: { cash: [-100000, 150] },
          then: [
            ['landlord', '零钱盒我不看也晓得。撑不住就早点说。'],
            ['landlord', '莫拖到月底，两个人都恼火。']
          ],
          else: [
            ['landlord', '生意嘛，不咸不淡。你自己掂量。']
          ] }
      ] },
    ['landlord', '我就搞不懂，你一个吃公家饭的，咋个想起卖早饭？'],
    ['z', '……锅还没刷。汪姐，合同我收到了。'],
    { exit: 'landlord' },
    { prop: 'keys', off: true },
    { do: 'tap', label: '把合同压在账本底下' },
    { prop: 'lease', off: true }, { sfx: 'page' },
    { fx: { memento: 'm_lease' } },
    ['n', '厂里食堂的饭，我吃了二十年。胃是那时候吃坏的。'],
    ['n', '油是我签字领的。哪一锅早该倒了，我比谁都清楚。'],
    ['z', '还有二十一天。'],
    { light: 'night' }
  ] };
  main.m09_open = { id: 'm09_open', title: '都涨了', day: 9, when: 'open', light: 'dawn', beats: [
    { enter: 'qin', slot: 1 },
    { prop: 'veg', label: '老秦的菜' },
    ['qin', '老周，跟你说个事。米面油，这两天都涨了。'],
    ['qin', '我这菜……也得加一成。我不好开这个口。'],
    ['z', '一成是多少？你报个数，我好算。'],
    { enter: 'hu', slot: 3 },
    ['hu', '加一成？哎哟老哥，莫算了，听兄弟一句。'],
    ['hu', '我的冻品不涨，还降。整箱送到门口，便宜三成。'],
    ['z', '冻了多久的？'],
    ['hu', '冻起的东西哪个问日子嘛。煮透了一个味。'],
    ['n', '老秦没接话，把菜筐往里挪了挪。我看见了。'],
    { fx: { set: ['s_costup'] } },
    { choice: [
      { label: '换老胡的货', hint: '进货省 50 元',
        fx: { cash: 50, burn: 4, aff: { qin: -2 }, set: ['s_hu_supply'] },
        then: [
          ['hu', '爽快！明早五点，箱子码到你门口。'],
          { prop: 'veg', off: true },
          ['n', '老秦把菜筐搬回了三轮车。我没好意思去搭手。']
        ] },
      { label: '自己扛着', hint: '进货贵到月中',
        fx: { aff: { qin: 1 }, set: ['s_absorb'] },
        then: [
          ['z', '照旧送。价钱按你说的，一成就一成。'],
          ['qin', '……要得。葱我多放一把。'],
          ['hu', '老哥有良心。良心几个钱一斤嘛？'],
          ['z', '不晓得。我也想晓得。']
        ] },
      { label: '跟着涨价', hint: '多进账，客人少',
        fx: { cash: 30, rep: -2, flow: 0.9, aff: { ge: -1 }, set: ['s_raised'] },
        then: [
          ['z', '货照旧。价牌我改一下，各涨五毛。'],
          ['qin', '改嘛。都恼火。'],
          { do: 'tap', label: '把价牌上的数字擦掉' },
          ['n', '粉笔灰落在手背上。五毛，老葛是要皱眉头的。']
        ] }
    ] },
    { exit: 'hu' }, { exit: 'qin' }
  ] };
  main.m12_open = { id: 'm12_open', title: '下回补', day: 12, when: 'open', light: 'rain', beats: [
    { sfx: 'rain' },
    { enter: 'hu', slot: 2 },
    { prop: 'meat', label: '羊肉' },
    ['hu', '老哥！这雨一下，就是喝羊肉汤的天。'],
    ['hu', '半扇羊，便宜你三成。今天就能上锅，一碗卖十六。'],
    ['z', '票呢？检疫的章盖在哪儿？'],
    ['hu', '票嘛，下回补。肉你自己看噻，红的。'],
    ['n', '“下回补”。这三个字，我在厂里听了二十年。'],
    ['n', '补没补过，签字的人最清楚。签字的是我。'],
    { if: { aff: { qin: 3 } },
      then: [
        { enter: 'qin', slot: 0 },
        ['qin', '我认得一家，带检疫章的。贵，贵一截。'],
        ['hu', '老秦，你卖你的葱嘛。']
      ],
      else: [
        ['n', '雨水顺着箱子角往下滴，滴在我鞋面上。']
      ] },
    { choice: [
      { label: '收下', hint: '便宜三成',
        fx: { cash: 60, burn: 10, set: ['cheap_mutton'], unlock: 'mutton' },
        then: [
          ['hu', '爽快！兄弟就晓得你是明白人。'],
          ['z', '……票记得补。'],
          ['hu', '补，补。下回嘛。'],
          ['n', '箱子拖进后厨，地上一道水印。我拿拖把抹了。']
        ] },
      { label: '只要有票的', hint: '多花 40 元',
        fx: { cash: -40, rep: 1, aff: { qin: 1 }, set: ['s_mutton_paper'], unlock: 'mutton' },
        then: [
          ['z', '我要带章的。贵就贵，四十我认。'],
          ['hu', '行行行，讲究人。箱子我搬走，莫后悔哈。'],
          ['z', '后悔了我自己吃药。']
        ] },
      { label: '不做羊肉', hint: '菜单不添新菜',
        fx: { set: ['s_no_mutton'] },
        then: [
          ['z', '羊肉我先不做。粥我都还没熬明白。'],
          ['hu', '随你。公交站那辆车，一口气要了两箱。']
        ] }
    ] },
    { prop: 'meat', off: true },
    { exit: 'hu' },
    { if: { aff: { qin: 3 } }, then: [{ exit: 'qin' }], else: [] }
  ] };
  main.m15_open = { id: 'm15_open', title: '台账', day: 15, when: 'open', light: 'dawn', beats: [
    { enter: 'inspector', slot: 2 },
    ['inspector', '周师傅是吧？例行检查。台账、进货单、油，都看一下。'],
    ['z', '都在这儿。……您坐，我给您擦个凳子。'],
    ['inspector', '不坐，站着看。您忙您的。'],
    { prop: 'ledger', label: '台账' }, { sfx: 'page' },
    ['n', '以前是我陪着人查食堂。账怎么做得好看，我会。'],
    ['n', '这本没做过。我想看看，真账过不过得了。'],
    { if: { flags: ['ge_books'] },
      then: [
        ['inspector', '这账谁理的？一笔一笔都对得上。'],
        ['z', '一个老主顾，干过会计。拿早饭抵的工钱。']
      ],
      else: [
        ['inspector', '记得太粗。哪天进的货、进了多少，都没写。'],
        ['z', '以前我的账有人替我抄。……我回头补。'],
        ['inspector', '月底我再来。到时候要一笔一笔对得上。']
      ] },
    { prop: 'oilcan', label: '油桶' },
    { if: { any: [{ burn: [50] }, { oilAge: [4] }] },
      then: [
        ['inspector', '这油几天了？都发黑了。'],
        ['z', '有几天了。……这回能不能算口头提醒？'],
        ['inspector', '不能。整改单，罚款一百，三天内换油。'],
        { sfx: 'stamp' },
        { fx: { cash: -100, rep: -2, set: ['s_insp_fine'] } },
        ['n', '一百块。在厂里那些年，这张单子落不到我头上。'],
        ['z', '我今天就换。']
      ],
      else: [
        { if: { burn: [0, 25], oilAge: [0, 1], flags: ['slip_ever'] },
          then: [
            ['inspector', '油是新的。门口贴的那张，是进货单？'],
            ['z', '是。贴给街坊看的，字丑。'],
            ['inspector', '这条街就您一家贴。合格。'],
            { sfx: 'stamp' },
            { fx: { rep: 3, set: ['s_insp_pass'] } },
            ['z', '……章盖重点。这张我想留着。']
          ],
          else: [
            ['inspector', '油还行。再用一天就该换了。'],
            ['inspector', '这回口头提醒，不开单。进货单留好。'],
            { fx: { set: ['s_insp_warn'] } },
            ['z', '要得。明天换，条子上写着的。']
          ] }
      ] },
    { prop: 'oilcan', off: true }, { prop: 'ledger', off: true },
    { exit: 'inspector' }
  ] };
  main.m18_open = { id: 'm18_open', title: '那条视频', day: 18, when: 'open', light: 'dawn', beats: [
    { prop: 'phone', label: '手机' }, { sfx: 'phone' },
    ['n', '手机在柜台上震了一早上。我还当是催话费的。'],
    { enter: 'neighbor', slot: 1 },
    { if: { flags: ['viral_good'] },
      then: [
        ['neighbor', '就是这家！视频里那锅粥，就是这口锅。'],
        ['neighbor', '说油三天一换，条子就贴在灶台边。真贴了？'],
        ['z', '贴了的。……慢点慢点，都有，莫挤。']
      ],
      else: [
        { if: { flags: ['viral_bad'] },
          then: [
            ['neighbor', '老周，视频里那桶油，是你家的吧？'],
            ['neighbor', '我不买哈。我就来看一眼。'],
            ['z', '……哪个拍的？'],
            ['neighbor', '不晓得。号是新的。拍得倒是清楚。']
          ],
          else: [
            ['neighbor', '刷到你家了。底下说“还行，实在”。'],
            ['z', '哪个发的？这条街我都认不得几个人。'],
            ['neighbor', '不晓得。号是新的，没几个粉丝。']
          ] }
      ] },
    ['n', '这半个月我怎么做的，它就怎么拍的。一刀没剪。'],
    ['n', '照实卖，到底有没有人买账。今天怕是要见分晓。'],
    { choice: [
      { label: '拉开后厨帘子', hint: '后厨随便看',
        fx: { set: ['s_curtain_open'] },
        then: [
          { do: 'hold', label: '按住，拉开帘子' },
          { if: { oilAge: [3] },
            then: [
              ['neighbor', '这油……比视频里的还深。'],
              ['z', '……是该换了。我认。'],
              ['n', '门口有人把手机举起来了。我没去挡。'],
              { fx: { rep: -4, burn: 5, flow: 0.75 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '咦，今天这油是清的嘛。'],
                  ['neighbor', '那视频拍的是哪天的？'],
                  ['z', '前几天的。那天的油，是我舍不得倒。'],
                  { fx: { rep: 2, flow: 0.95 } }
                ],
                else: [
                  ['neighbor', '锅、油、米袋子，都在明处。'],
                  ['neighbor', '要得。给我来两份，一份打包。'],
                  { fx: { rep: 3, flow: 1.05 } }
                ] }
            ] }
        ] },
      { label: '贴出进货单', hint: '今天的单子贴门口',
        fx: { set: ['s_slip_day18'] },
        then: [
          { prop: 'slip', label: '进货单' },
          { if: { mat: [0, 0] },
            then: [
              ['neighbor', '冻品，批发的。……倒是没藏着。'],
              ['z', '冻的就写冻的。'],
              { fx: { rep: 1, flow: 0.95 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '今天的是好。前几天的单子呢？'],
                  ['z', '……前几天的没留。'],
                  ['neighbor', '那就不好说了噻。'],
                  { fx: { rep: 1, flow: 0.9 } }
                ],
                else: [
                  ['neighbor', '哪家的菜、几点到的，都写着。'],
                  ['neighbor', '老秦的葱嘛。他那辆三轮我认得。'],
                  { fx: { rep: 2, flow: 1.1 } }
                ] }
            ] }
        ] },
      { label: '照常做', hint: '不解释，开火',
        fx: {},
        then: [
          { if: { flags: ['viral_good'] },
            then: [
              ['z', '排好队哈。粥要一锅一锅熬，快不起来。'],
              ['n', '队排到了隔壁改衣店门口。小满探头看了一眼。'],
              { fx: { flow: 1.15 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['z', '看嘛。我开火了。'],
                  ['n', '围着的人看了一阵，散了一半。'],
                  { fx: { rep: -2, flow: 0.8 } }
                ],
                else: [
                  ['z', '要得。……我开火了。'],
                  { fx: { flow: 1.0 } }
                ] }
            ] }
        ] }
    ] },
    { fx: { memento: 'm_video' } },
    { prop: 'phone', off: true },
    { exit: 'neighbor' }
  ] };
  main.m22_open = { id: 'm22_open', title: '只有这口灶亮着', day: 22, when: 'open', light: 'candle', beats: [
    ['n', '整条街黑着。只有我这口煤气灶，还有一圈蓝火。'],
    { prop: 'candle', label: '蜡烛' },
    { if: { aff: { man: 4 } },
      then: [
        { enter: 'man', slot: 0 },
        ['man', '老周，借个火。我那电饭锅成摆设了。'],
        ['man', '韭菜鸡蛋馅，糖糖剁的。粗得跟她缝的针脚一样。']
      ],
      else: [
        { enter: 'neighbor', slot: 0 },
        ['neighbor', '老周，借个火嘛。电饭锅用不成了。'],
        ['neighbor', '馅我拌好了的，白菜猪肉。就差一口锅。']
      ] },
    { if: { aff: { zhao: 3 } }, then: [
      { enter: 'zhao', slot: 1 },
      ['zhao', '豆豆要学包饺子。面我在屋头和好了，和好了的。']
    ], else: [] },
    { if: { aff: { ge: 4 } }, then: [
      { enter: 'ge', slot: 2 },
      ['ge', '劳驾，擀面杖借我。以前单位包饺子，数我擀得圆。']
    ], else: [] },
    { if: { aff: { qin: 3 } }, then: [
      { enter: 'qin', slot: 3 },
      ['qin', '车上还有两棵白菜。不够我再去拉。']
    ], else: [] },
    ['z', '案板不够大。……等一下，我卸块门板下来。'],
    { do: 'tap', label: '捏三个褶' },
    { fx: { unlock: 'dumpling', memento: 'm_candle' } },
    ['n', '在食堂二十年，我没跟谁围着一口锅包过东西。'],
    { choice: [
      { label: '只收皮钱', hint: '一份少赚一半',
        fx: { cash: -30, rep: 2, flow: 1.2, set: ['s_dumpling_half'] },
        then: [
          ['z', '馅是你们的。我只收皮钱、火钱。'],
          ['n', '有人往零钱盒里多放了一块。我没看清是谁。']
        ] },
      { label: '今天不收钱', hint: '白忙一个早晨',
        fx: { cash: -80, rep: 3, flow: 1.35, aff: { man: 1, zhao: 1, ge: 1 }, set: ['s_dumpling_free'] },
        then: [
          ['z', '今天这锅不卖。哪个来了哪个吃。'],
          ['n', '烛光底下，队排到了桥头。没有一个人催。']
        ] },
      { label: '照牌价卖', hint: '一分不少收',
        fx: { cash: 40, rep: -1, set: ['s_dumpling_full'] },
        then: [
          ['z', '饺子照牌价。馅钱我回头算给你们。'],
          ['n', '没人开腔。有人把馅盆往回挪了挪。']
        ] }
    ] },
    { sfx: 'sizzle' },
    { if: { aff: { man: 4 } }, then: [{ exit: 'man' }], else: [{ exit: 'neighbor' }] },
    { if: { aff: { zhao: 3 } }, then: [{ exit: 'zhao' }], else: [] },
    { if: { aff: { ge: 4 } }, then: [{ exit: 'ge' }], else: [] },
    { if: { aff: { qin: 3 } }, then: [{ exit: 'qin' }], else: [] }
  ] };
  main.m26_close = { id: 'm26_close', title: '给句话', day: 26, when: 'close', light: 'night', beats: [
    { enter: 'landlord', slot: 2 },
    { prop: 'lease', label: '续租合同' },
    ['landlord', '合同带来了。一千二，这个数你背都背得到。'],
    ['z', '背得到。这二十六天，我天天在算它。'],
    { if: { flags: ['rent_late'] },
      then: [
        ['landlord', '上回房租你拖了的。我没往外头说。'],
        ['landlord', '这回押金要一次给齐。我也有房贷嘛。']
      ],
      else: [
        { if: { rep: [65] },
          then: [
            ['landlord', '这条街早上有人气，是从你这口锅起的头。'],
            ['landlord', '别个出的价比你高。我没应，莫问我为啥子。']
          ],
          else: [
            ['landlord', '说老实话，别个出的价比你高。'],
            ['landlord', '先来后到。我先问你。']
          ] }
      ] },
    ['landlord', '签不签，给句话。钥匙我都捏出汗了。'],
    ['n', '我抬头看门头那块白板。二十六天了，还是一个字没有。'],
    ['n', '这二十六天怎么卖的，够不够活，账本上一笔一笔都在。'],
    { choice: [
      { label: '签，续租', hint: '付清押金', need: { cash: [1200] },
        fx: { payDeposit: true, set: ['renewed'] },
        then: [
          { prop: 'cash', label: '押金' },
          { sfx: 'stamp' },
          ['z', '一千二。都是三块两块收起来的，您莫嫌零碎。'],
          ['landlord', '零碎的钱才扎实。……要得，钥匙你留着。'],
          ['landlord', '招牌该写了哈。白了一个月，像啥子话。'],
          ['z', '写。等我想好头两个字。']
        ] },
      { label: '请街坊凑', hint: '差的街坊垫上', need: { affSum: [30] },
        fx: { chipin: true, set: ['chipin'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '一家一家凑的。谁出了多少，名字都记在里头。'],
          ['man', '莫推。针脚都缝死了，拆不回去。'],
          ['landlord', '……要得嘛。我点一下。'],
          ['z', '我都还。一家一家还。'],
          ['man', '晓得你要还。所以才敢凑噻。'],
          { exit: 'man' }
        ] },
      { label: '不签了', hint: '月底交钥匙',
        fx: { set: ['left'] },
        then: [
          ['z', '不签了。我做到二十八号。'],
          ['landlord', '想好了？……那要得。'],
          ['landlord', '钥匙月底给我。灶台不用你拆。'],
          ['z', '灶台我擦干净了再走。']
        ] }
    ] },
    { prop: 'lease', off: true },
    { exit: 'landlord' }
  ] };
  main.m27_open = { id: 'm27_open', title: '最后一班', day: 27, when: 'open', light: 'dawn', beats: [
    ['n', '六点零五。7 路的车灯从桥那头过来，一分不差。'],
    { if: { aff: { gong: 5 } },
      then: [
        { bus: true }, { sfx: 'horn' },
        ['n', '车没进站。它拐了个弯，停在我门口。'],
        { enter: 'gong', slot: 1 },
        { prop: 'mug', label: '搪瓷茶缸' },
        ['gong', '各位乘客，柳河街早餐铺到了！下车吃饭！'],
        ['gong', '最后一班。我跟调度说了的，绕一脚。'],
        ['z', '……一车人？我粥才熬了两锅。'],
        ['gong', '那就再熬嘛！我开了一辈子车，头一回晚点。'],
        ['gong', '我的照旧。油条炸老点，嚼起来要有响动。'],
        ['z', '要得。……龚师傅，今天这根我请。'],
        ['gong', '不得行。零钱我数好了的，一分不差。'],
        { fx: { flow: 1.5, set: ['s_bus_stop'], memento: 'm_ticket' } },
        { exit: 'gong' }
      ],
      else: [
        { sfx: 'horn' },
        ['n', '车照常进站，照常开走。喇叭多响了一声。'],
        { enter: 'neighbor', slot: 2 },
        ['neighbor', '听说老龚今天最后一班。'],
        ['z', '听说了。……他的油条，我多炸老了一根。'],
        ['neighbor', '那他没下来拿？'],
        ['z', '没有。车不等人。'],
        { fx: { set: ['s_bus_pass'] } },
        { exit: 'neighbor' }
      ] }
  ] };
  main.m28_close = { id: 'm28_close', title: '第二十八天', day: 28, when: 'close', light: 'dusk', beats: [
    ['z', '第二十八天。锅刷了，灶还是温的。'],
    { if: { flags: ['end_HONEST'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '招牌还空着。都最后一天了，今天总该写了。'],
      ['z', '写啥子嘛。想了一个月，一个字没想出来。'],
      ['best', '不用你想。街上背地里早就有叫法了。'],
      ['best', '“去不烧心那家”。问路的都这么问。'],
      ['z', '……这也算名字？'],
      ['best', '算。吃出来的。'],
      { do: 'tap', label: '提笔，往白板上写' },
      ['n', '五个字。写到“心”字手抖了，那一点落得重。'],
      ['z', '……字丑。'],
      ['best', '丑才认得出是你写的。'],
      { exit: 'best' },
      ['n', '兜里那板胃药，还是月初那一板。我没掏出来。']
    ], else: [] },
    { if: { flags: ['end_CANTEEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天几点开？我来帮你摆凳子。'],
      ['z', '五点半。……凳子就四张，有啥子好摆的。'],
      ['best', '又凑了六张。各家搬来的，高矮不齐。'],
      ['best', '招牌我们也商量好了。你别嫌土。'],
      ['n', '白板上是粉笔字：柳河街坊食堂。好几个人的笔迹。'],
      ['z', '“堂”字少了一横。'],
      ['best', '小孩子写的。要不要擦了重来？'],
      ['z', '不擦。就这个。'],
      { exit: 'best' },
      ['n', '我搬张凳子踩上去，拿粉笔把那一横添上了。']
    ], else: [] },
    { if: { flags: ['end_PRIVATE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '下周三，老位子，给我留着。'],
      { prop: 'notebook', label: '小本子' },
      ['z', '记了。周三，靠墙那张。你的粥要稠点。'],
      ['best', '连稠的你都记？'],
      ['z', '记了的。你回回把碗底刮得响。'],
      ['best', '……招牌呢？总不能把这一本名字都写上去。'],
      ['z', '写小点。认得的人认得到就行了。'],
      ['n', '本子上二十几个名字。谁胃不好、谁赶车，都记了。'],
      { exit: 'best' },
      ['n', '我翻到明天那页。六个名字，我泡了六个人的米。']
    ], else: [] },
    { if: { flags: ['end_REOPEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '漆味还没散。你昨晚刷的？'],
      ['z', '刷了两遍。头一遍盖不住灶台后头那片油印子。'],
      ['best', '招牌的字都没干透，你就敢挂。'],
      ['z', '挂。挂上去了，我自己天天抬头看得见。'],
      ['best', '看得见又怎样？'],
      ['z', '看到了，手就不敢省那桶油。'],
      { exit: 'best' },
      ['n', '出事那天的日子，我添在了何姨那张条子底下。']
    ], else: [] },
    { if: { flags: ['end_PILLS'] }, then: [
      { prop: 'pills', label: '胃药' },
      ['n', '收银台上，一盒胃药压着一沓账单。我没翻。'],
      ['z', '招牌……就写“周记早点”嘛。'],
      ['z', '别的字，我写不上去。'],
      ['n', '厂里那锅油我吃了二十年。这个月，我自己又熬了一锅。'],
      ['n', '头班车进站。没有人下车往这边走。'],
      ['n', '我抠出两颗药，没倒水，干咽了。']
    ], else: [] },
    { if: { flags: ['end_FAREWELL'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '听说你不签了。大家凑了个主意。'],
      ['n', '白板摘下来了，背面朝上，摆在柜台上。'],
      ['best', '正面留给下一家。背面，我们签了名。'],
      ['z', '……这个油手印是哪个的？'],
      ['best', '不知道。都说不是自己按的。'],
      ['z', '这块板子我要带走。'],
      ['best', '本来就是给你的。下一家用不着背面。'],
      ['z', '我去哪儿开，还没定。定了……我来说一声。'],
      { exit: 'best' },
      ['n', '我解下围裙，把白板包了两层，夹在胳膊底下。']
    ], else: [] },
    { if: { flags: ['end_TRANSFER'] }, then: [
      { enter: 'landlord', slot: 2 },
      { prop: 'keys', label: '钥匙' },
      ['landlord', '接手的人明天来看灶台。卖卤菜的。'],
      ['z', '那口煎锅是何姨的。跟他说，莫用洗洁精。'],
      ['landlord', '你人都要走了，还操心一口锅。'],
      ['z', '条子我留在灶台边了。他看不看，随他。'],
      ['landlord', '招牌一个字没写，倒省得人家铲。'],
      ['landlord', '……老周，你这一个月，到底图个啥子？'],
      ['z', '想算一笔账。没算赢。'],
      { exit: 'landlord' },
      ['n', '钥匙交出去了。手揣回兜里，摸到的是那板药。']
    ], else: [] },
    { if: { flags: ['end_SOMEONE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天还开吧？'],
      ['z', '开。……你还来？'],
      ['best', '你开，我就来。'],
      ['best', '那招牌呢？空了一个月了。'],
      ['z', '先写两个字，“小馆”。前头空着。'],
      ['best', '空多久？'],
      ['z', '不晓得。明天的油是新的，这个我晓得。'],
      { exit: 'best' },
      ['n', '我写了“小馆”。前头留了三个字的地方。']
    ], else: [] },
    { light: 'night' },
    { do: 'hold', label: '按住，拉下卷帘门' },
    { shutter: 'down' }, { sfx: 'shutter' }
  ] };
  main.crisis = { id: 'crisis', title: '找上门', when: 'close', light: 'night', beats: [
    { sfx: 'knock' },
    { enter: 'neighbor', slot: 1 },
    { enter: 'song', slot: 2 },
    ['neighbor', '我爸昨天在你这儿吃的早饭。夜里吐了两回。'],
    ['song', '挂的我们科急诊。我下了夜班，陪他们过来的。'],
    { prop: 'paper', label: '病历' },
    ['z', '……吃的哪样？昨天卖的，我自己也吃了。'],
    ['song', '周叔，这礼拜第三例了。主诉都一样，烧心、反酸。'],
    ['song', '是不是你这儿的事，我下不了结论。'],
    ['song', '可出院第一顿来你这儿喝粥，是我跟病人说的。'],
    ['neighbor', '我不是来闹的。老周，你给个说法。'],
    ['n', '胃里那股酸水顶上来了。这个滋味我熟，吃了二十年。'],
    { choice: [
      { label: '停业整改', hint: '花 400 元，停一天',
        fx: { set: ['crisis_rectify'] },
        then: [
          ['z', '明天不开门。油、锅、料，全部换。'],
          { prop: 'paper', label: '停业整改' },
          ['song', '条子我帮你写。你那字，病人看不懂。'],
          ['song', '就写“停业一天，换油”。别的不用解释。']
        ] },
      { label: '逐个退赔', hint: '退赔 260 元',
        fx: { set: ['crisis_refund'] },
        then: [
          { prop: 'cash', label: '零钱盒里的钱' },
          ['z', '药费我出。这礼拜吃过的，来一个我退一个。'],
          ['neighbor', '……要得。我等你电话。'],
          ['song', '周叔，退钱归退钱。油呢？'],
          ['z', '……换。']
        ] },
      { label: '硬撑', hint: '明天照常开门',
        fx: { set: ['crisis_hold'] },
        then: [
          ['z', '我的粥我自己天天喝。我都没事。'],
          ['song', '周叔。你兜里那板药，我看见过的。'],
          ['n', '她没再说下去，扶着人走了。门没带上。']
        ] }
    ] },
    { exit: 'neighbor' }, { exit: 'song' }
  ] };
  main.rescue = { id: 'rescue', title: '零钱盒', when: 'open', light: 'dawn', beats: [
    { enter: 'landlord', slot: 2 },
    ['landlord', '老周，零钱盒拿来我看一眼。莫藏。'],
    ['n', '盒子里几个钢镚，一张进货的欠条。我自己都不想看。'],
    ['landlord', '两天了。明天的货，你拿啥子去进？'],
    ['z', '……米还有半袋。油条可以少炸点。'],
    ['landlord', '我不是来催租的。我是怕你明天这扇门拉不起来。'],
    { choice: [
      { label: '卖一件设备', hint: '到手 300 元',
        fx: { set: ['s_sold'] },
        then: [
          ['landlord', '收旧货的我认得。喊他下午来拉，不杀你价。'],
          ['z', '要得。能卖的先卖一件。煎锅不卖。']
        ] },
      { label: '向小满借', hint: '到手 250 元，要还', need: { aff: { man: 3 } },
        fx: { set: ['s_borrow'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '钱在里头。莫打条子，我记性比尺子准。'],
          ['z', '我还。下个礼拜就开始还。'],
          ['man', '还不上就拿葱油饼抵。糖糖爱吃。'],
          { exit: 'man' }
        ] },
      { label: '再撑一天', hint: '今天少备点货',
        fx: { flow: 0.85, set: ['s_refuse'] },
        then: [
          ['z', '再撑一天。今天少备点，卖完就收。'],
          ['landlord', '犟。……要得，明天我还来。']
        ] }
    ] },
    { exit: 'landlord' }
  ] };
  var powderLater = { days: 3, fx: { set: ['e_powder_due'] }, note: '这两天总有人问：粥是不是换了做法。' };
  var events = [
    { id: 'e_powder', title: '增香粉', when: 'open', need: { day: [4, 9] }, weight: 1.3, once: true, cool: 5, beats: [
      { enter: 'powder', slot: 2 },
      { prop: 'powder', label: '增香粉' },
      ['powder', '老板，撒一勺，香得半条街都闻得到！'],
      ['z', '袋子上怎么一个字都没有？'],
      ['powder', '厂里直接出的嘛，省下的包装钱都让给你了。'],
      ['powder', '公交站那辆早餐车，用了一个礼拜，队排好长。'],
      ['z', '里头是啥子？我以前管进货，没字的东西不签收。'],
      ['powder', '哎呀老板，现在你自己当家，哪个要你签字嘛。'],
      { choice: [
        { label: '推回去', hint: '香不过早餐车',
          fx: { flowNext: 0.95 },
          then: [
            ['z', '不要。你拿走。'],
            ['powder', '要得。等你门口没人了，再找我。']
          ] },
        { label: '试一次', hint: '10 元一包，更香',
          fx: { cash: -10, burn: 8, flow: 1.15, set: ['powder_used'], later: powderLater },
          then: [
            ['powder', '一勺就够。多了发苦。'],
            ['n', '我把小包塞进围裙兜。手在兜里捏了半天。']
          ] },
        { label: '用了别声张', hint: '30 元一袋，客更多',
          fx: { cash: -30, burn: 18, flow: 1.25, set: ['powder_used', 'powder_hidden'], later: powderLater },
          then: [
            ['powder', '懂行！哪个问起，都说是换了新米。'],
            ['z', '……嗯。'],
            ['n', '这一声“嗯”，跟我在厂里签字那阵一个声气。']
          ] }
      ] },
      { prop: 'powder', off: true },
      { exit: 'powder' }
    ] },
    { id: 'e_powder_after', title: '香得不对', when: 'close', need: { flags: ['powder_used', 'e_powder_due'] }, weight: 3, once: true, cool: 3, beats: [
      { enter: 'kid', slot: 1 },
      ['kid', '老板，你家粥是不是换配方了？'],
      ['kid', '我同桌说喝完一上午口干，上课一直要水喝。'],
      ['z', '……你同桌喝了几碗？'],
      ['kid', '就一碗。他平时都不喝水的。'],
      { exit: 'kid' },
      { enter: 'song', slot: 2 },
      ['song', '周叔，我也想问。这几天的粥，香得不对。'],
      ['song', '米香是往下沉的。这个香往鼻子里冲。'],
      { choice: [
        { label: '认了', hint: '剩的半袋扔掉',
          fx: { burn: -10, rep: -1, aff: { song: 1 }, clear: ['powder_hidden'], set: ['e_powder_admit'] },
          then: [
            { prop: 'powder', label: '增香粉' },
            ['z', '加了东西。就这袋，没字的。我扔了。'],
            { prop: 'powder', off: true },
            ['song', '嗯。这回不记病历。我就当没闻见过。']
          ] },
        { label: '说是新米', hint: '这事就过去了',
          fx: { burn: 6, aff: { song: -2 }, set: ['powder_hidden', 'e_powder_deny'] },
          then: [
            ['z', '换了新米。东北的，香些。'],
            ['song', '……哦。东北的。'],
            ['n', '她把粥钱放下就走了，没等我找零。']
          ] }
      ] },
      { exit: 'song' }
    ] },
    { id: 'e_recycler', title: '没挂牌的三轮', when: 'close', need: { day: [5], oilAge: [2] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'recycler', slot: 2 },
      { prop: 'oilcan', label: '废油' },
      ['recycler', '老板，废油有噻？我出四十一桶。'],
      ['z', '回收站的车才给十块。你怎么给得起四十？'],
      ['recycler', '所以找我嘛。现钱，不开票，不啰嗦。'],
      ['z', '拉到哪儿去？'],
      ['recycler', '这个你就莫问了。问了你也睡不着。'],
      ['n', '门口停了辆没挂牌的三轮。桶上的字都磨没了。'],
      ['n', '厂里的废油，每个月也有人来拉。我从来没问过。'],
      { choice: [
        { label: '等回收站的车', hint: '到手 10 元，有收据',
          fx: { cash: 10, burn: -2, set: ['e_oil_legal'] },
          then: [
            ['z', '不卖。我等回收站的车，人家给收据。'],
            ['recycler', '十块钱的命。']
          ] },
        { label: '卖给他', hint: '到手 40 元',
          fx: { cash: 40, burn: 8, set: ['e_oil_sold'] },
          then: [
            { sfx: 'coin' },
            ['recycler', '爽快。下回还找你。'],
            ['n', '桶搬上了三轮，盖子没拧紧。我看见了，没开腔。']
          ] }
      ] },
      { prop: 'oilcan', off: true },
      { exit: 'recycler' }
    ] },
    { id: 'e_helper', title: '招人吗', when: 'close', need: { day: [6], not: ['helper'] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['guifen', '老板，招人不？我在门口看了你三天了。'],
      ['guifen', '你一个人又炸又盛又收钱，油条都炸老了两根。'],
      ['z', '……炸老的那两根，是给龚师傅的。'],
      ['guifen', '哦。那我包子包得快，洗碗收钱都得行，不偷嘴。'],
      ['z', '工钱我给不了多少。'],
      ['guifen', '一天三十五。五点到，收了摊就走。'],
      ['guifen', '下午不得行。屋头离不得人。'],
      { choice: [
        { label: '明早来吧', hint: '每天工钱 35 元',
          fx: { helper: true, set: ['e_guifen_hired'] },
          then: [
            ['z', '明早五点。围裙我这儿有，就是大了点。'],
            ['guifen', '哎！我自己带了的。你看，都系上了。']
          ] },
        { label: '再等等', hint: '还是一个人忙',
          fx: { set: ['e_guifen_wait'] },
          then: [
            ['z', '再等等。眼下我一个人还转得开。'],
            { prop: 'paper', label: '电话号码' },
            ['guifen', '那我留个电话。转不开了就打，我走路十分钟。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },
    { id: 'e_helper_take', title: '保温桶', when: 'close', need: { helper: true, day: [10] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['n', '桂芬的布袋鼓着，露出半个保温桶盖。'],
      ['z', '桂芬。'],
      ['guifen', '……是剩的粥。锅底那点，都起锅巴了。'],
      ['guifen', '我想着反正要倒。老板，我不是那种人，真的。'],
      { choice: [
        { label: '先问问', hint: '每天少卖一碗粥',
          fx: { cash: -10, rep: 1, set: ['e_guifen_trust'] },
          then: [
            ['z', '带给哪个的？'],
            ['guifen', '我婆婆。躺了两年了，只咽得下稀的。'],
            ['z', '往后莫等锅底。头一锅熬好，先给她盛。'],
            ['guifen', '那……那从我工钱里扣。'],
            ['z', '不扣。一碗粥，七毛钱的米。']
          ] },
        { label: '扣一天工钱', hint: '省下 35 元',
          fx: { cash: 35, rep: -1, set: ['e_guifen_docked'],
            later: { days: 3, fx: { rep: -1 }, note: '后来才听说，那粥是带给她卧床的婆婆的。' } },
          then: [
            ['z', '规矩是规矩。今天的工钱不算。'],
            ['guifen', '……哎。'],
            ['n', '她把保温桶里的粥倒回了锅里。一滴没洒。']
          ] },
        { label: '让她别来了', hint: '明天起一个人',
          fx: { helper: false, rep: -1, set: ['e_guifen_fired'],
            later: { days: 2, fx: { rep: -1 }, note: '小满说，桂芬家里有个卧床的婆婆。' } },
          then: [
            ['z', '明天不用来了。工钱结到今天。'],
            ['guifen', '要得。围裙我洗了再还你。'],
            ['n', '话那么密的一个人，走的时候一句都没多说。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },
    { id: 'e_peer', title: '豆浆一块', when: 'open', need: { day: [10] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'peer', slot: 2 },
      { prop: 'paper', label: '传单' },
      ['peer', '周老板，来打个招呼。我的车停公交站那头。'],
      ['peer', '豆浆一块，油条买一送一。先卖一个礼拜。'],
      ['z', '一块？我算过，一杯光豆子就是八毛的本。'],
      ['peer', '先把人拢过来嘛。亏的后头再找补。'],
      ['z', '从哪儿找补？'],
      ['peer', '嘿，这个就各有各的办法了。混口饭，莫见怪。'],
      ['n', '老葛站在街对面，看看传单，又看看我这边。'],
      { choice: [
        { label: '跟着降价', hint: '今天少赚 40 元',
          fx: { cash: -40, flow: 1.15, set: ['e_peer_follow'] },
          then: [
            ['z', '豆浆今天我也卖一块。'],
            ['peer', '嚯。那就看哪个撑得久嘛。']
          ] },
        { label: '加量不加价', hint: '多搭料 25 元',
          fx: { cash: -25, rep: 2, aff: { ge: 1 }, set: ['e_peer_more'] },
          then: [
            ['z', '价不动。粥盛满，油条炸大一号。'],
            ['peer', '要得，各做各的。']
          ] },
        { label: '不跟', hint: '今天客人少一成半',
          fx: { flow: 0.85, set: ['e_peer_hold'] },
          then: [
            ['z', '我不跟。一块钱的豆浆，我磨不出来。'],
            ['peer', '那老主顾走了，莫怪我哈。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'peer' }
    ] },
    { id: 'e_vlogger', title: '免单换视频', when: 'open', need: { day: [9], rep: [55] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'vlogger', slot: 2 },
      { prop: 'phone', label: '手机支架' },
      ['vlogger', '老板！我粉丝两万，这条街我先拍你家。'],
      ['vlogger', '一套免单，我出一条视频，带定位，稳赚。'],
      ['z', '吃了好，你就说好。那要是不好呢？'],
      ['vlogger', '哎呀，都免单了，自然就是好嘛。'],
      ['z', '那我这三十块，买的是你一句话？'],
      ['vlogger', '老板，你这么说就没意思了。这叫合作。'],
      { choice: [
        { label: '免单', hint: '送出一套 30 元',
          fx: { cash: -30, flow: 1.15, set: ['e_vlog_free'],
            later: { days: 2, fx: { rep: 2, burn: 2 }, note: '那条探店视频里，粥冒着热气。夸得有点过。' } },
          then: [
            ['z', '……要得。坐嘛。'],
            ['vlogger', '老板上道！来，看镜头，笑一个。'],
            ['n', '我笑了。脸上的肉不大听使唤。']
          ] },
        { label: '照价收钱', hint: '他不一定发',
          fx: { rep: 1, set: ['e_vlog_paid'] },
          then: [
            ['z', '该多少是多少。拍，随你拍。'],
            ['vlogger', '……行吧。来碗粥。'],
            ['n', '他付了钱，吃完点了点头。手机一直没举起来。']
          ] },
        { label: '请他走', hint: '少一次露脸',
          fx: { rep: -1, aff: { zheng: 1 }, set: ['e_vlog_refuse'] },
          then: [
            ['z', '不拍。后头还有人等着买。'],
            ['vlogger', '这条街又不止你一家。'],
            ['n', '小郑排在队尾，往本子上记了一行。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'vlogger' }
    ] },
    { id: 'e_aunty', title: '三十份', when: 'open', need: { day: [7] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'aunty', slot: 2 },
      { prop: 'paper', label: '接龙名单' },
      ['aunty', '老周！我们小区群里接龙，要三十份。'],
      ['aunty', '粥加油条。明早七点前，送到门卫室。'],
      ['aunty', '量大嘛，你打个七折。我都跟群里说好了。'],
      ['z', '你都说好了，才来问我？'],
      ['aunty', '哎呀，先说好了才有人接龙噻。'],
      ['z', '七点前……正是我门口人最多的时候。'],
      ['aunty', '所以才来跟你商量嘛。'],
      { choice: [
        { label: '三十份全接', hint: '明天进账 90 元',
          fx: { flowNext: 0.8, set: ['e_group_all'],
            later: { days: 1, fx: { cash: 90, rep: -1 }, note: '三十份七点前送到了。门口有人等不及，走了。' } },
          then: [
            ['z', '接。我四点起来熬。'],
            ['aunty', '爽快！货到了我转你，一分不少。']
          ] },
        { label: '接十五份', hint: '明天进账 45 元',
          fx: { flowNext: 0.92, set: ['e_group_half'],
            later: { days: 1, fx: { cash: 45 }, note: '十五份送到了。刘姐说，下回还是要三十。' } },
          then: [
            ['z', '十五份。再多，门口的人要干等。'],
            ['aunty', '要得嘛。剩下的我找公交站那辆车。']
          ] },
        { label: '不接', hint: '散客照常',
          fx: { aff: { gong: 1 }, set: ['e_group_no'] },
          then: [
            ['z', '接不了。六点零五，有人要赶头班车。'],
            ['aunty', '一个司机顶我三十份？要得，你有原则。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'aunty' }
    ] },
    { id: 'e_tv', title: '老街的早晨', when: 'open', need: { day: [11] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'tv', slot: 2 },
      ['tv', '师傅您好，我们台在拍“老街的早晨”。'],
      ['tv', '等下客人来了，您能不能笑得开心一点？'],
      ['z', '我平时就这个脸。'],
      ['tv', '您再端一碗粥，对着镜头说句“几十年老味道”。'],
      ['z', '我开了才十来天。几十年的是前头那位何姨。'],
      ['tv', '没关系，观众看不出来的。'],
      { choice: [
        { label: '照常做', hint: '拍到什么算什么',
          fx: { rep: 2, set: ['e_tv_plain'] },
          then: [
            ['z', '你们拍你们的。那句词我说不出口。'],
            ['n', '后来播出来，镜头里是赵爷爷在低头数硬币。']
          ] },
        { label: '摆拍一回', hint: '今天客流多一成',
          fx: { flow: 1.12, rep: 1, burn: 3, set: ['e_tv_staged'] },
          then: [
            ['z', '几、几十年老味道。'],
            ['tv', '好！再来一条，笑自然一点。'],
            ['z', '……几十年老味道。'],
            ['n', '第二遍顺多了。顺得我自己心头一紧。']
          ] },
        { label: '不拍', hint: '机器转去别家',
          fx: { flow: 0.95, set: ['e_tv_no'] },
          then: [
            ['z', '不拍了。机器挡着人排队了。'],
            ['tv', '行。那我们去公交站那辆车。']
          ] }
      ] },
      { exit: 'tv' }
    ] },
    { id: 'e_water', title: '水黄了', when: 'open', need: { day: [12] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'gong', slot: 1 },
      { prop: 'mug', label: '茶缸' },
      ['gong', '老周！你这个水不对头。'],
      ['gong', '我缸子里接的，茶叶还没放，水先黄了。'],
      { sfx: 'pour' },
      ['n', '我拧开龙头。流出来的水带锈色，一股铁腥气。'],
      ['gong', '准是桥头又在挖管子。年年挖，说下午才修得好。'],
      ['z', '我粥还没下米。一锅要十二碗水。'],
      ['gong', '那你快点拿主意。我那趟头班车，不等人的。'],
      { choice: [
        { label: '买桶装水', hint: '花 40 元',
          fx: { cash: -40, rep: 1, set: ['e_water_buy'] },
          then: [
            ['z', '我去街口扛几桶。四十就四十。'],
            ['gong', '要得！茶我收了班回来再泡。']
          ] },
        { label: '不做汤水', hint: '只卖干的，客人少',
          fx: { flow: 0.75, rep: 1, set: ['e_water_stop'] },
          then: [
            { prop: 'paper', label: '今日无粥' },
            ['z', '粥和豆浆今天不做。我写张条子贴上。'],
            ['gong', '那我干啃油条。要得，炸老点就不噎。']
          ] },
        { label: '烧开了照用', hint: '不花钱，照常卖',
          fx: { burn: 10, set: ['e_water_used'] },
          then: [
            ['z', '烧开了一样的。厂里也是这么……烧开了就行。'],
            ['gong', '……我今天喝自己带的。']
          ] }
      ] },
      { prop: 'mug', off: true },
      { exit: 'gong' }
    ] },
    { id: 'e_leftover', title: '剩下的', when: 'close', need: { day: [3, 8] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'qin', slot: 2 },
      ['n', '锅里剩了两碗粥。筐里四根油条，凉了。'],
      ['qin', '剩了？'],
      ['z', '头几天，备多了。心里没个数。'],
      ['qin', '何姨那阵，剩的都留给巷口那老两口。'],
      ['qin', '收废品的。天天这个点从门口过。'],
      ['z', '我晚饭还没着落。……这个也是饭。'],
      { choice: [
        { label: '留给老两口', hint: '晚饭另买，8 元',
          fx: { cash: -8, set: ['e_leftover_give'],
            later: { days: 2, fx: { rep: 1 }, note: '巷口老两口把门前的纸箱捆走了，没要钱。' } },
          then: [
            { do: 'tap', label: '装袋，挂在门把上' },
            ['qin', '他们不进门的。挂外头就要得。'],
            ['z', '粥我多套了个袋子，怕洒。']
          ] },
        { label: '自己当晚饭', hint: '省一顿饭钱',
          fx: { set: ['e_leftover_self'] },
          then: [
            ['z', '我自己吃。省一顿。'],
            ['n', '凉油条泡粥。吃完，我摸了摸兜里那板药。']
          ] }
      ] },
      { exit: 'qin' }
    ] },
    { id: 'e_gas', title: '检修通知', when: 'open', need: { day: [6] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'landlord', slot: 2 },
      { prop: 'paper', label: '检修通知' },
      ['landlord', '老周，门上贴的通知你没看？'],
      ['landlord', '燃气检修，七点到八点半。灶不准开。'],
      ['z', '七点到八点半？那是我卖得最好的时候。'],
      ['landlord', '跟我说没用。人家是带着表来的。'],
      ['z', '一个半钟头，少说四十碗粥。'],
      ['landlord', '跟我算账？算账我比你凶。咋个弄，快说。'],
      { choice: [
        { label: '等修完再开', hint: '只卖半个早晨',
          fx: { shift: 0.6, rep: 1, set: ['e_gas_wait'] },
          then: [
            ['z', '八点半再开火。'],
            ['landlord', '要得。我喊他们先弄你这一段。']
          ] },
        { label: '赶在七点前卖', hint: '早开早收',
          fx: { shift: 0.75, flow: 1.1, set: ['e_gas_early'] },
          then: [
            ['z', '我现在就开。卖到七点收。'],
            ['landlord', '那你手脚快点。']
          ] },
        { label: '照常开火', hint: '整个早晨照卖',
          fx: { burn: 8, set: ['e_gas_risk'],
            later: { days: 1, fx: { rep: -2 }, note: '有人看见，检修那阵这口灶还开着。' } },
          then: [
            ['z', '我把火关小点。'],
            ['landlord', '……我啥子都没听到哈。我没来过。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'landlord' }
    ] },
    { id: 'e_rain_takeout', title: '十一单', when: 'open', light: 'rain', need: { weather: 'rain', day: [3] }, weight: 1.5, once: false, cool: 6, beats: [
      { sfx: 'rain' },
      { enter: 'ali', slot: 2 },
      { prop: 'phone', label: '外卖单' },
      ['ali', '周叔周叔，下雨了，单子爆了！'],
      ['ali', '光你这一家，我手上挂了十一单。十一单！'],
      ['n', '门口几个老人正在收伞，伞尖的水滴了一地。'],
      ['ali', '全接的话我来回跑。就是堂食的要等。'],
      ['z', '你雨衣怎么只穿了半边？'],
      ['ali', '哥……叔，莫管雨衣了，系统在读秒！'],
      { choice: [
        { label: '全接', hint: '今天客流多三成',
          fx: { flow: 1.3, rep: -1, aff: { ali: 1 } },
          then: [
            ['z', '接。路滑，你骑慢点。'],
            ['ali', '慢了要扣钱的！走了走了！']
          ] },
        { label: '接一半', hint: '今天客流多一成',
          fx: { flow: 1.12 },
          then: [
            ['z', '接六单。别的你推了。'],
            ['ali', '要得。六单也够我跑湿一身了。']
          ] },
        { label: '只做堂食', hint: '外卖今天不接',
          fx: { flow: 0.92, rep: 1, aff: { zhao: 1, ali: -1 } },
          then: [
            ['z', '今天不接。门口站的都是老人。'],
            ['ali', '……好嘛。那我去别家等单了。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'ali' }
    ] },
    { id: 'e_move', title: '最后一碗', when: 'close', need: { day: [14] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 2 },
      ['neighbor', '老周，来碗白粥。最后一碗了。'],
      ['z', '王阿姨，提这么大个包，要出远门？'],
      ['neighbor', '搬去儿子那儿。车在桥头等着，催了两道了。'],
      ['neighbor', '这个门脸的早饭，我吃了十一年。'],
      ['neighbor', '先是何姨的粥，后头是你的。差得不多。'],
      ['z', '差在哪儿？您说，我好改。'],
      ['neighbor', '她的稠一点点。……算了，我也吃不着了。'],
      { sfx: 'pour' },
      { choice: [
        { label: '这碗不收钱', hint: '白送一碗粥',
          fx: { cash: -3, rep: 2, set: ['e_move_free'] },
          then: [
            ['z', '这碗算我的。'],
            ['neighbor', '那咋个要得……唉，要得。我记着。']
          ] },
        { label: '照常收钱', hint: '照牌价收',
          fx: { cash: 3, set: ['e_move_paid'] },
          then: [
            { sfx: 'coin' },
            ['neighbor', '拿着。规矩是规矩。'],
            ['n', '零钱是她数好了的，一个钢镚都不差。']
          ] },
        { label: '抄一页粥谱', hint: '何姨的方子给她',
          fx: { rep: 1, set: ['e_move_recipe'] },
          then: [
            { prop: 'paper', label: '粥谱一页' },
            ['z', '何姨的方子，我抄了一页。您带上。'],
            ['neighbor', '那边的米不一样。……我试一哈。']
          ] }
      ] },
      { exit: 'neighbor' }
    ] },
    { id: 'e_complaint', title: '评论三百条', when: 'open', need: { day: [13], burn: [35] }, weight: 1.4, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 1 },
      { prop: 'phone', label: '投诉视频' },
      ['neighbor', '老周，你看一下这个。昨晚上发的。'],
      ['neighbor', '说在柳河街吃了早饭，烧心烧了一上午。'],
      ['neighbor', '没点名。可评论里有人认出你家门头了。'],
      ['z', '……门头是白的，怎么认得出来？'],
      ['neighbor', '就是白的才好认噻。整条街就你一家没字。'],
      ['neighbor', '三百多条了。你说句话不嘛？'],
      { choice: [
        { label: '公开回应', hint: '今天客人少一成',
          fx: { burn: -12, rep: -2, flow: 0.9, aff: { zheng: 1 }, set: ['e_complaint_public'] },
          then: [
            ['z', '我回。哪天的油、哪家的料，照实写。'],
            ['neighbor', '照实写？那写出来可不好看哦。'],
            ['z', '不好看就不好看。你帮我打字，我说。']
          ] },
        { label: '私下退钱', hint: '退赔 30 元',
          fx: { cash: -30, burn: -6, set: ['e_complaint_refund'] },
          then: [
            ['z', '帮我问一下是哪个。钱我退，药我买。'],
            ['neighbor', '要得。他删不删，我可不敢保。']
          ] },
        { label: '不理', hint: '今天照常开门',
          fx: { rep: -3, burn: 4, flow: 0.88, set: ['e_complaint_ignore'] },
          then: [
            ['z', '没点名。我一回，反倒是认了。'],
            ['n', '到中午，视频底下的评论过了五百。我没再点开。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'neighbor' }
    ] }
  ];
  return { main: main, events: events };
});
;
/* content/endings.js */
BSX.define('content/endings', function () {
  var list = [
    { id: 'E_HONEST', title: '贵是贵点，吃了不烧心', sign: '不烧心小馆',
      mood: '贵五毛。街上的人认了这五毛。',
      text: [
        '招牌是收了摊写的。五个字，写到“心”那一点，我手抖了，落得重。价牌比街口贵五毛，后来没人再提。',
        '天不亮，三轮车照旧停在门口。葱上带着泥，筐底压着一张单子，日期写的是今天。',
        '油还是三天一换，换下来那桶搁在后门等回收站的车。兜里那板胃药，过了期我才想起来扔。'
      ],
      letter: { from: 'best', text: '贵五毛我认了。吃完一上午，胃里是平的。明早，老样子。' },
      last: '水开了。我去下米。' },
    { id: 'E_CANTEEN', title: '街坊食堂', sign: '柳河街坊食堂',
      mood: '挣得薄。凳子不够坐。',
      text: [
        '招牌是粉笔写的，好几个人的笔迹。“堂”字少的那一横，是我踩着凳子添的。落一场雨，要描一回。',
        '凳子是各家拎来的，高矮不齐，吃完就留在店里。零钱盒老是满的，满的是毛票和钢镚。',
        '收摊的时候有人帮着摞碗。门帘一掀，带进来一阵河风，还有隔壁缝纫机的声音。'
      ],
      letter: { from: 'best', text: '明早我早点来摆凳子。莫给我免单，该收好多收好多。' },
      last: '隔壁的缝纫机还在响。' },
    { id: 'E_PRIVATE', title: '只做熟客的私房小馆', sign: '周记·熟客',
      mood: '人少了。名字我都叫得出。',
      text: [
        '门口不排队了。价牌没再往下改，来的人也不看价牌，坐下只说三个字：老样子。',
        '小本子写到了最后一页。谁的油条要炸老，谁的粥要晾一下，谁礼拜三来，我都记着。',
        '七点过后街上就静了。架子上一排碗倒扣着，各人用各人的。夜里我泡米，泡六个人的。'
      ],
      letter: { from: 'best', text: '礼拜三给我留个位子。不用问我吃啥子，你记得的。' },
      last: '小本子合上了。' },
    { id: 'E_REOPEN', title: '整改之后，重新开张', sign: '不烧心小馆',
      mood: '关过一回门。又拉起来了。',
      text: [
        '整改单我没撕，还贴在门里侧。新油桶上拿记号笔写着开封的日子，一桶一个。',
        '招牌是重开前一晚刷的，漆还发亮，凑近闻得到味。出事那天的日子，我写在何姨那张条子底下。',
        '头一个钟头只来了三个人。第四个在门口站了一阵，抬头看了看招牌，伸手推门。'
      ],
      letter: { from: 'best', text: '重新开张那天我来了。粥跟头几天一个味。往后我还来。' },
      last: '门上的铃响了一下。' },
    { id: 'E_PILLS', title: '胃药和账单', sign: '周记早点',
      mood: '钱还在。门口没人等。',
      text: [
        '收银台上，胃药压着一沓账单。药三盒，空了一盒。最上头那张是油钱，数目小得很。',
        '零钱盒换成了带锁的铁皮箱。招牌写的“周记早点”，字很正，挂到哪家门头上都行。',
        '六点整，门口没有人。头班车进站，停了一停，开走了。锅里的油还在响，响得发闷。'
      ],
      letter: { from: 'song', text: '周叔，护士站小黑板上你家的电话，我擦了。哪天换了油，你说一声，我再写上。' },
      last: '药盒没合上，搁在手边。' },
    { id: 'E_FAREWELL', title: '搬走那天，常客来送行', sign: '',
      mood: '店没留住。板子背面写满了。',
      text: [
        '招牌正面到底没写字。翻过来，背面签满了名字，圆珠笔的、蜡笔的，最底下是茶缸底印的一个圈。',
        '煎锅拿旧报纸包好，粥谱夹在里头。灶台擦了两遍。何姨那张条子我没揭，留给下一个人。',
        '东西不多，一辆三轮拉了两趟。拐过桥头，我回头看了一眼，门上的铃还在晃。'
      ],
      letter: { from: 'best', text: '板子你带走。哪天在别处开张了，翻过来接着签。' },
      last: '白板背面朝里，捆在车上。' },
    { id: 'E_TRANSFER', title: '转让', sign: '',
      mood: '账本停在那一页。',
      text: [
        '钥匙在兜里揣了一上午，交出去的时候是温的。汪姐数了一遍，一把不少，又数了一遍。',
        '账本停在那天，后头全是空页。招牌一个字没写，接手的人不用铲。汪姐说，倒省了一桩事。',
        '煎锅没带走，扣在灶台底下，还包着那张旧报纸。卷帘门拉下来，锁舌“咔哒”一声。'
      ],
      letter: { from: 'qin', text: '锅我看见了，还在灶台底下。新来的要是不会养，我教他。' },
      last: '招牌还是白的。' },
    { id: 'E_SOMEONE', title: '月底那天，还是有人来了', sign: '小馆',
      mood: '平常的一个月。月底那天也平常。',
      text: [
        '月底那天和别的日子差不多。粥熬稠了一点，油条炸到第三锅才顺手。',
        '招牌上先写了“小馆”两个字，前头空着一截。有人问空的写啥子，我说再想想。',
        '六点四十，门口有脚步声，停住了。布钱包的搭扣，“嗒”地响了一下。'
      ],
      letter: { from: 'best', text: '也没啥子特别的。就是早上走到这儿，脚自己就拐进来了。' },
      last: '“老样子。”' }
  ];
  var echoes = [
    { need: { flags: ['crisis_hold'] }, text: '那一晚过后，第二天你照样五点半拉起了门。' },
    { need: { flags: ['crisis_rectify'] }, text: '门上贴过一天“停业一天，换油”。字是小宋写的。' },
    { need: { flags: ['crisis_refund'] }, text: '你挨家退过钱。有两家没要，又推了回来。' },
    { need: { flags: ['powder_hidden'] }, text: '有人问过粥咋个变香了。你说是东北的新米。' },
    { need: { flags: ['powder_used'], not: ['powder_hidden'] }, text: '那包没字的粉，你用过。后来它不在围裙兜里了。' },
    { need: { flags: ['cheap_mutton'] }, text: '那锅羊肉汤卖得好。票，老胡到月底也没补。' },
    { need: { flags: ['kept_extra'] }, text: '赵爷爷多给过一回钱。那几个硬币，还单放在零钱盒一格里。' },
    { need: { flags: ['s_sold'] }, text: '收旧货的来拉过一趟。墙上留下一块比别处白的印子。' },
    { need: { flags: ['s_borrow'] }, text: '小满借过你一笔钱，没打条子。她说她记性比尺子准。' },
    { need: { flags: ['rent_late'] }, text: '有一个礼拜的房租，你分两回才交齐。' },
    { need: { flags: ['chipin'] }, text: '押金里有一沓是零钱。信封里记着十几个名字，口子缝死了。' },
    { need: { flags: ['left'], cash: [1200] }, text: '押金的数，零钱盒里是够的。你没签。' },
    { need: { flags: ['viral_bad'] }, text: '那条视频里的油，颜色比你记得的深。' },
    { need: { flags: ['viral_good'] }, text: '那条视频拍到了灶台边何姨的条子。字凶，看得清。' },
    { need: { flags: ['s_curtain_open'] }, text: '后厨的帘子拉开过一回，后来就没再拉上。' },
    { need: { flags: ['man_curtain'] }, text: '门口那幅帘子是小满缝的，针脚比买的密。' },
    { need: { flags: ['ge_books'] }, text: '账本从月中起换了笔迹。一笔一笔，对得上。' },
    { need: { flags: ['e_leftover_give'] }, text: '头几天剩的粥挂在门把上。第二天，袋子总是空的。' },
    { need: { flags: ['hood'] }, text: '排烟罩装上以后，隔壁的后窗又开了。' },
    { need: { flags: ['returned_extra'] }, text: '赵爷爷多给的钱，你追出去还了。是豆豆伸手接的。' },
    { need: { credit: [1] }, text: '赊账那页，老葛的名字底下还有几行没划掉。' },
    { need: { flags: ['helper'] }, text: '围裙钩上多挂了一条，是桂芬自己带来的。' },
    { need: { flags: ['slip_ever'], rep: [70] }, text: '进货单在门口贴到卷了边。后来没人再凑近看。' },
    { need: { flags: ['viral_plain'] }, text: '那条视频有人看，没人转。底下说：还行，实在。' },
    { need: { flags: ['renewed'] }, text: '押金是你一张一张数给汪姐的。她说不点，又点了一遍。' },
    { need: { priceAvg: [1.4] }, text: '价牌改过。往上改的那一回，你用的是铅笔。' },
    { need: { affSum: [40] }, text: '小本子上记了八个人的老样子。有几条划了重写。' },
    { need: { burn: [0, 45] }, text: '何姨的条子还贴在灶台边。油，大体是照它换的。' }
  ];
  return { list: list, echoes: echoes };
});
;
/* content/ambient.js */
BSX.define('content/ambient', function () {
  var walkins = {
    student: {
      in: ['叔叔快点，要打铃了！', '豆浆一杯，带走带走。', '有啥子马上拿得走的？', '一根油条，谢谢叔叔。', '今天月考，来个蛋。', '我妈说必须在这儿吃。'],
      good: ['好吃！明天还来！', '油条是脆的，咔嚓响。', '比我们食堂强多了。', '我要喊同桌也来。'],
      ok: ['还行吧。', '吃饱了，走了。', '嗯，能吃。'],
      bad: ['叔叔，这个有点糊……', '豆浆咋是凉的？', '油条咬不动，硌牙。', '我还是去吃食堂吧。'],
      slow: ['要打铃了要打铃了！', '叔叔，我真来不及了。', '还没好吗？', '算了算了，我不要了。'],
      soldout: ['啊？没得了？', '那我换一样嘛。', '明天给我留一份行不？'],
      treat: ['真的不要钱？', '谢谢前面那个叔叔！']
    },
    office: {
      in: ['豆浆带走，我赶车。', '随便来个顶饱的，快。', '老板，扫哪个码？', '两分钟能好吗？', '老样子……哦，我头回来。', '来份不油的，昨晚喝多了。'],
      good: ['可以，明天还要这个。', '比外卖强多了。', '这粥熬到位了。', '给同事也带一份。'],
      ok: ['凑合。', '行，就这样吧。', '还可以。'],
      bad: ['有点油，腻。', '这个味道不太对。', '咸了。', '下回换一家试试。'],
      slow: ['我九点要打卡的。', '还要多久？给个准数。', '能不能先给我？', '算了，来不及了。'],
      soldout: ['卖完了？这才几点。', '那有啥子来啥子。', '行，明天早点来。'],
      treat: ['啊？哪个请的？', '那……替我谢谢他。']
    },
    worker: {
      in: ['来个顶饱的，要干一天活。', '油条三根，粥一大碗。', '老板，有大碗的没得？', '多盛点，不够我加钱。', '有带肉的没得？', '快点，工头要点名了。'],
      good: ['扎实！', '这碗顶得到晌午。', '油条炸得透，巴适。', '明天带工友来。'],
      ok: ['吃得饱。', '要得。', '将就。'],
      bad: ['分量少了哦。', '油条是软的，没劲。', '这粥稀得照得见人。', '不值这个价。'],
      slow: ['车要开了！', '老板，我先来的噻。', '再不好我走了哈。', '等不起，等不起。'],
      soldout: ['没了？那来两个饼。', '这才几点就没得了。', '剩啥子给我啥子。'],
      treat: ['还有这种好事？', '谢了，兄弟。']
    },
    elder: {
      in: ['一碗粥，稠一点哈。', '豆浆莫放糖，血糖高。', '油条要软和的。', '慢慢来，我不急。', '跟昨天一样就要得。', '何姨搬走了哇？'],
      good: ['这粥熬出米油了。', '软和，好嚼。', '像从前那个味道。', '明天我还这个点来。'],
      ok: ['还要得。', '嗯，热乎的。', '将就吃。'],
      bad: ['有点哈喇味哦。', '太硬了，咬不动。', '粥是不是巴锅了？', '吃了有点反酸。'],
      slow: ['腿都站麻了。', '我那碗是不是忘了？', '年轻人先来，我等一哈。', '等不得了，回去吃药。'],
      soldout: ['没得了啊。那算了。', '明天我早点来。', '给我舀碗米汤也行。'],
      treat: ['这咋个好意思嘛。', '替我谢谢人家。']
    },
    parent: {
      in: ['一份我的，一份娃儿的。', '娃儿那份莫太烫。', '有不辣的吧？', '豆浆少糖，娃儿喝。', '快点，要送学校。', '宝宝，自己跟叔叔说。'],
      good: ['娃儿吃得精光。', '他平时挑得很。', '干净，放心。', '明天还带他来。'],
      ok: ['还行，吃了就走。', '娃儿说还可以。', '嗯。'],
      bad: ['娃儿说有股怪味。', '太油了，娃儿吃不得。', '烫到娃儿了！', '这个他不吃。'],
      slow: ['娃儿要迟到了。', '莫哭莫哭，马上好。', '能先做娃儿那份吗？', '不等了，路上买面包。'],
      soldout: ['没了？他就认这个。', '那换个不油的。', '宝宝，明天再吃好不好？'],
      treat: ['快，说谢谢叔叔。', '这多不好意思。']
    },
    rider: {
      in: ['哥，啥子快来啥子。', '打包，挂车把上就行。', '站着吃，不占座。', '一分钟出得来不？', '粥莫太烫，路上喝。', '两个饼，边骑边吃。'],
      good: ['出得快，谢了哥！', '这家我记下了。', '热乎的，安逸。', '下回接单先接你家。'],
      ok: ['要得，走了。', '还行。', '垫一口。'],
      bad: ['洒了一袋子……', '凉的。', '这油条隔夜的吧？', '下回不绕这条街了。'],
      slow: ['超时了，要扣钱的！', '哥，系统在读秒了！', '老板，真等不了了。', '不要了，退了吧。'],
      soldout: ['没了？那随便。', '有啥给啥。', '要得，下趟再来。'],
      treat: ['还有这种单？', '谢了哥们儿！']
    }
  };
  var wish = {
    '汤水': ['有带汤的没得？', '想喝口热乎的。', '来点稀的，润一哈。', '嗓子干，要汤汤水水的。'],
    '顶饱': ['哪样最顶饱？', '要撑得到中午的。', '来个扎实的。'],
    '清淡': ['有不油的吗？', '胃不舒服，来点清淡的。', '莫太咸，莫太油。', '素一点的就行。'],
    '油香': ['想吃口香的。', '来个现炸的。', '要油汪汪的那种。'],
    '甜': ['有甜的没得？', '想吃口甜的。', '娃儿要甜的。'],
    '肉': ['有带肉的没得？', '来点荤的。', '没肉吃不饱。'],
    '快': ['哪样最快？', '要马上拿得走的。', '赶时间，随便来。', '莫现做了，有现成的没？']
  };
  var mods = {
    '嫩': ['炸嫩一点哈。', '莫太焦，要嫩的。', '软一点，牙不好。'],
    '老': ['炸老一点。', '要焦的，嚼起有响动。', '多炸一会儿。'],
    '温': ['晾一哈再装。', '莫太烫。', '温的就要得。']
  };
  var queue = [
    { need: { day: [22, 22] }, lines: [['整条街都黑起的。', '就他家灶还亮着。'], ['你家馅端来了？', '端了，白菜猪肉。'], ['点蜡烛包饺子。', '跟小时候一样。']] },
    { need: { flags: ['viral_good'], day: [18, 24] }, lines: [['就是视频里那家。', '粥是真的稠。'], ['你也是刷到的？', '我姐转给我的。'], ['我拍一张。', '莫挡到人家出餐。']] },
    { need: { flags: ['viral_bad'], day: [18, 24] }, lines: [['那视频你看了没？', '看了。那桶油哦。'], ['你还敢来吃？', '我来看一眼。'], ['今天油换了没？', '哪个晓得。']] },
    { need: { flags: ['viral_plain'], day: [18, 22] }, lines: [['刷到过这家。', '底下说还行，实在。'], ['视频里就这门脸？', '就这，十平米。']] },
    { need: { day: [27, 28] }, lines: [['听说 7 路要并线。', '那这站还停不停？'], ['老龚要退休了。', '头班车换哪个开？']] },
    { need: { day: [25, 28] }, lines: [['月底了哦。', '这家续不续嘛？'], ['房东来过两回了。', '押金怕是不少。'], ['下个月还开不？', '开嘛，开着方便。']] },
    { need: { flags: ['powder_used'] }, lines: [['今天粥香得很。', '香得有点怪。'], ['隔老远就闻到了。', '以前没这么冲。']] },
    { need: { flags: ['cheap_mutton'], menu: ['mutton'] }, lines: [['羊肉汤才这个价？', '便宜还不好？'], ['这肉哪里来的？', '喝你的嘛。']] },
    { need: { flags: ['s_curtain_open'] }, lines: [['后厨帘子拉开了。', '锅都看得见。'], ['你盯着后厨看啥子？', '看一哈又不犯法。']] },
    { need: { burn: [55] }, lines: [['昨天吃了反酸。', '我也是。再试一回。'], ['他家最近不对头。', '看今天的嘛。']] },
    { need: { oilAge: [3] }, lines: [['闻到没得？', '油有点哈了。'], ['今天油烟呛人。', '隔壁窗子都关了。'], ['油条颜色好深。', '怕是老油哦。']] },
    { need: { oilAge: [0, 0] }, lines: [['今天油烟清爽。', '准是换油了。'], ['油条金黄金黄的。', '新油炸的，看得出。']] },
    { need: { posted: true }, lines: [['门口贴的啥子？', '进货单，今早的。'], ['哪家的菜都写了。', '敢贴就不怕看。'], ['你还真看啊？', '看一哈又不要钱。']] },
    { need: { price: [2, 2] }, lines: [['又贵了五毛。', '五毛也是钱噻。'], ['涨价了？', '牌子上改过了。'], ['贵是贵点。', '吃了不难受就行。']] },
    { need: { price: [0, 0] }, lines: [['这价，挣得到钱不？', '薄利嘛。'], ['比公交站还便宜。', '那我多拿一根。']] },
    { need: { any: [{ flags: ['e_peer_follow'] }, { flags: ['e_peer_more'] }, { flags: ['e_peer_hold'] }] }, lines: [['公交站豆浆一块。', '一块的豆浆能喝？'], ['那辆车人也不少。', '图便宜嘛。']] },
    { need: { flags: ['s_costup'], day: [9, 16] }, lines: [['菜又涨了。', '葱都快论根卖了。'], ['啥子都在涨。', '就工资不涨。']] },
    { need: { rep: [70] }, lines: [['队都排到改衣店了。', '值得等。'], ['前头还有几个？', '七八个，快得很。'], ['天天排这么长。', '说明没毛病。']] },
    { need: { helper: true }, lines: [['多了个帮手。', '出餐是快了。'], ['那大姐手脚麻利。', '收钱都不用看。']] },
    { need: { day: [1, 4] }, lines: [['这家新开的？', '原先何姨那间。'], ['换人了哦。', '尝一哈，不行再说。'], ['招牌咋是空的？', '怕是还没起名。']] },
    { need: { weather: 'rain' }, lines: [['这雨哦。', '伞都撑不住。'], ['鞋都湿透了。', '喝口热的就好了。'], ['下雨还排队？', '下雨才想喝粥噻。']] },
    { need: { any: [{ weather: 'sun' }, { weather: 'cloud' }] }, lines: [['河上起雾了。', '头班车开得慢。'], ['今天不落雨。', '被子晒得出去了。']] },
    { lines: [['今天吃啥子？', '先看还剩啥。'], ['你几点起的？', '五点，习惯了。'], ['头班车过了没？', '刚过。'], ['娃儿考得咋样？', '莫提了。']] },
    { lines: [['河边在修栏杆。', '修了半年了。'], ['改衣店几点开？', '她吃完就开。'], ['昨晚睡得好不？', '楼上又在拖凳子。']] }
  ];
  var quotes = [
    { need: { flags: ['crisis_rectify'] }, from: '街坊', text: '关了一天门。回来那油，清得见锅底。' },
    { need: { flags: ['viral_good'], day: [18, 23] }, from: '街坊', text: '看视频来的。来了才晓得，是真的。' },
    { need: { flags: ['viral_bad'], day: [18, 23] }, from: '街坊', text: '我是专门来看油的。今天的还行。' },
    { need: { flags: ['powder_used'] }, from: '学生', text: '粥比上礼拜香，喝完一上午口干。' },
    { need: { flags: ['cheap_mutton'], menu: ['mutton'] }, from: '干活的', text: '羊肉汤便宜，肉给得多。没问哪来的。' },
    { need: { flags: ['e_leftover_give'], day: [3, 12] }, from: '街坊', text: '门把上那袋粥，巷口老两口拿走了。' },
    { need: { flags: ['hood'] }, from: '街坊', text: '装了罩子过后，楼道里不呛人了。' },
    { need: { burn: [60] }, from: '老人', text: '吃完一上午，胸口都顶起的。' },
    { need: { burn: [35, 59] }, from: '上班族', text: '最近吃完老打嗝。说不好怪哪个。' },
    { need: { oilAge: [4] }, from: '老人', text: '吃完嗓子眼发紧，喝了半壶水。' },
    { need: { oilAge: [3] }, from: '街坊', text: '昨天那油烟，我在二楼都把窗子关了。' },
    { need: { oilAge: [0, 0] }, from: '街坊', text: '今早后门多了个空油桶。' },
    { need: { quality: [0.85], oilAge: [0, 1] }, from: '老人', text: '油条是脆的，掰开不见油。' },
    { need: { quality: [0.85] }, from: '街坊', text: '昨天那碗粥，米油都熬出来了。' },
    { need: { quality: [0, 0.45] }, from: '学生', text: '昨天的油条有点糊，我没好意思说。' },
    { need: { quality: [0, 0.45] }, from: '带娃的', text: '粥巴锅了，娃儿一口就尝出来。' },
    { need: { quality: [0.45, 0.7] }, from: '上班族', text: '不好不坏，吃得。' },
    { need: { rep: [70], fast: true }, from: '上班族', text: '队是长，可是动得快。' },
    { need: { fast: true }, from: '骑手', text: '昨天两分钟就出餐了，没超时。' },
    { need: { fast: true }, from: '学生', text: '昨天没迟到！' },
    { need: { rep: [70] }, from: '街坊', text: '排了十分钟。算了，值。' },
    { need: { posted: true }, from: '上班族', text: '进货单我真看了，葱是今早到的。' },
    { need: { mat: [2, 2] }, from: '带娃的', text: '有票的肉，给娃儿吃放心些。' },
    { need: { mat: [1, 1] }, from: '街坊', text: '葱上还带着泥，老秦的车来过了。' },
    { need: { mat: [0, 0] }, from: '街坊', text: '冻的就冻的嘛，煮透了一样吃。' },
    { need: { price: [2, 2] }, from: '干活的', text: '贵了五毛。五毛也是一根烟钱。' },
    { need: { priceAvg: [1.5] }, from: '老人', text: '油条改买一根了。也够。' },
    { need: { price: [0, 0] }, from: '干活的', text: '这个价，我敢多加一个蛋。' },
    { need: { priceAvg: [0, 0.5] }, from: '街坊', text: '这么个卖法，他自己吃啥子？' },
    { need: { helper: true }, from: '街坊', text: '桂芬收钱比老周快，还不找错。' },
    { need: { weather: 'rain' }, from: '骑手', text: '下雨天，就他家肯让我站门里头等。' },
    { need: { cash: [-100000, 60] }, from: '街坊', text: '找零的时候，他把盒子翻了半天。' },
    { need: { burn: [0, 15], day: [10] }, from: '老人', text: '吃了十来天，胃一回都没闹过。' },
    { need: { day: [23, 26] }, from: '街坊', text: '月底了，听说他还没签。' },
    { need: { day: [1, 5] }, from: '街坊', text: '新开的。先吃两天看看。' },
    { from: '街坊', text: '早上路过，粥锅冒着白气。' },
    { from: '学生', text: '我妈给的早饭钱，全花这儿了。' },
    { from: '老人', text: '这个门脸，早上亮着灯就好。' },
    { from: '上班族', text: '也没啥子特别的。顺路。' },
    { from: '骑手', text: '这条街，就他家开得最早。' }
  ];
  var zhou = [
    { need: { burn: [85] }, text: '我站在油锅跟前，半天没点火。' },
    { need: { burn: [60] }, text: '台面擦了三遍。手停不下来。' },
    { need: { burn: [40, 59] }, text: '胃药摸出来看了看，又揣回去了。' },
    { need: { flags: ['viral_bad'], day: [18, 20] }, text: '手机扣在柜台上。我没翻过来看。' },
    { need: { flags: ['powder_hidden'] }, text: '围裙兜里那包东西，我换了个兜放。' },
    { need: { flags: ['cheap_mutton'], day: [12, 16] }, text: '进货夹子翻到羊肉那页，是空的。' },
    { need: { flags: ['kept_extra'], day: [1, 14] }, text: '多出来的那几个硬币，我单放了一格。' },
    { need: { flags: ['rent_late'] }, text: '日历翻到下个礼拜，我折了个角。' },
    { need: { cash: [-100000, 0] }, text: '零钱盒是空的。我把盒子擦了一遍。' },
    { need: { cash: [1, 50] }, text: '零钱盒数了两遍，数目没变。' },
    { need: { cash: [1200], day: [20, 26] }, text: '够押金了。那一沓我又数了一遍。' },
    { need: { cash: [800] }, text: '整钱理齐，拿皮筋扎了两道。' },
    { need: { oilAge: [3] }, text: '我蹲下看油桶，拿指头蹭了一下桶沿。' },
    { need: { oilAge: [2, 2] }, text: '何姨的条子在灶台边。明天是第三天。' },
    { need: { oilAge: [0, 0] }, text: '新油。换下来那桶，我拎到了后门。' },
    { need: { quality: [0, 0.45] }, text: '炸糊的那根，我自己吃了。' },
    { need: { quality: [0.85] }, text: '锅底刮得干干净净，一粒米没剩。' },
    { need: { fast: true }, text: '今天没人催。这时候才觉出腿酸。' },
    { need: { price: [2, 2] }, text: '价牌上新写的数，我描了两遍。' },
    { need: { price: [0, 0] }, text: '计算器按了一遍，又按了一遍。' },
    { need: { priceAvg: [1.5] }, text: '今天有人少要了一根油条。我记得是哪个。' },
    { need: { rep: [75] }, text: '隔着街有人喊“老周”。我应了一声。' },
    { need: { rep: [0, 35] }, text: '我在门口站了一阵。街上没人往这边看。' },
    { need: { posted: true }, text: '门口那张进货单翘了个角，我按平了。' },
    { need: { helper: true }, text: '碗桂芬都洗了。我手不晓得往哪儿放。' },
    { need: { day: [1, 3] }, text: '抬头看了一眼招牌。还是白的。' },
    { need: { day: [13, 15] }, text: '半个月了。账本上那个数，我还看不出能不能活。' },
    { need: { day: [26, 27] }, text: '粥谱从头翻到尾。何姨卖了十几年，咋个撑下来的？' },
    { text: '围裙挂回钉子上。明天还是五点起。' },
    { text: '锅底那碗粥，我站着喝完了。' },
    { text: '灶台还是温的。我把手搁上去，搁了一会儿。' },
    { text: '明天的米量出来，泡进盆里了。' },
    { text: '卷帘门拉到一半，我又回去看了眼煤气。' }
  ];
  var pills = ['柜台角上多了一板胃药。', '胃药换成了一整盒。', '抽屉里三盒胃药，空了一盒。'];
  var soldout = ['没了？那算了嘛。', '卖完了啊。明天赶早。', '那换一样嘛。', '来晚了一步哦。'];
  return { walkins: walkins, wish: wish, mods: mods, queue: queue, quotes: quotes, zhou: zhou, pills: pills, soldout: soldout };
});
;
/* content/town.js */
BSX.define('content/town', function () {
  var goods = {
    oil: { name: '一桶油', v: 2000, icon: 'oilcan', burn: 7,
      good: ['清的，凑近了只有一点豆子香。', '生产日期上个月，票夹在桶把上。', '桶身干干净净，盖子是原封的。'],
      bad: ['盖子一拧，一股哈喇味。', '标签是后贴的，日期那一块糊了。', '桶口一圈黑垢，晃起来发稠。'] },
    meat: { name: '一扇肉', v: 3000, icon: 'meat', burn: 6,
      good: ['只有生肉的腥，没有别的味。', '皮上盖着检疫的蓝章。', '按一下，坑马上弹回来。'],
      bad: ['凑近了，有股说不清的酸。', '没有章，老板说"刚到的，章还没盖"。', '按下去的坑半天起不来，手上发黏。'] },
    rice: { name: '一袋米', v: 1600, icon: 'sack', burn: 3,
      good: ['一股新米的清香。', '袋子上印着今年的收割期。', '抓一把，米粒硬，手心不沾粉。'],
      bad: ['有股陈仓的霉气。', '日期是用笔改过的。', '抓一把，手心一层白粉，还有米虫。'] },
    veg: { name: '一筐菜', v: 1200, icon: 'veg', burn: 2,
      good: ['掐一下，一股青气。', '根上还带着湿泥，是早上拔的。', '叶子挺着，捏着是脆的。'],
      bad: ['捂得有点闷馊。', '底下那层黄了，拿好的盖在上面。', '一捏一手水，叶子是软的。'] },
    eggs: { name: '一箱鸡蛋', v: 1400, icon: 'eggs', burn: 3,
      good: ['没什么味道，就是蛋。', '壳上带着点草屑，日期是前天。', '拿起来沉，摇着不响。'],
      bad: ['箱子里有一股臭蛋气。', '没有日期，壳洗得过分干净。', '轻飘飘的，一摇里头晃荡。'] },
    beans: { name: '一袋黄豆', v: 1200, icon: 'sack', burn: 2,
      good: ['豆腥味正，是新豆子。', '袋子上写着产地和日期。', '颗颗饱满，咬一颗是脆的。'],
      bad: ['有股潮气，像在仓里捂了一冬。', '没有字，是散装倒进新袋的。', '瘪的多，掺了碎豆和土。'] }
  };
  var sellers = {
    hu: { name: '老胡的档口', bad: 0.6, line: '老胡：兄弟，这价你去别家问问。票嘛，下回补。', items: ['oil', 'meat', 'rice', 'eggs'] },
    qin: { name: '老秦的菜摊', bad: 0.08, line: '老秦：都是今早的。你看，我不说。', items: ['veg', 'beans', 'eggs'] },
    stall: { name: '市场里的散摊', bad: 0.4, line: '摊主：要就快点，收摊了收摊了。', items: ['oil', 'rice', 'veg', 'beans', 'meat'] }
  };
  var tools = [{ id: 0, name: '闻一闻' }, { id: 1, name: '看标签' }, { id: 2, name: '上手掂' }];
  var orders = [
    { id: 'o_school', who: '驾校早班', from: 'gong', need: { aff: { gong: 3 } }, dish: 'youtiao', n: 15, unit: 0.85, line: '龚师傅：驾校早班十五个学员，我替你揽的。油条，炸老点。' },
    { id: 'o_ward', who: '消化科夜班', from: 'song', need: { aff: { song: 4 } }, dish: 'congee', n: 12, unit: 0.95, line: '小宋：护士站十二碗白粥。下了夜班要吃热的。别放油。' },
    { id: 'o_site', who: '河对岸工地', from: null, need: { day: [6] }, dish: 'noodle', alt: 'youtiao', n: 18, unit: 0.8, line: '包工头：十八份，量要足。价嘛，你让一点。' },
    { id: 'o_elder', who: '老年活动中心', from: 'zhao', need: { aff: { zhao: 3 } }, dish: 'congee', n: 12, unit: 0.85, line: '赵爷爷：明早老哥几个练完拳，都想喝你一口粥。' },
    { id: 'o_dock', who: '快递分拣站', from: 'ali', need: { aff: { ali: 3 } }, dish: 'soy', n: 16, unit: 0.85, line: '阿力：分拣站十六杯豆浆！六点半前，我来拿。' },
    { id: 'o_exam', who: '中学月考', from: null, need: { day: [10] }, dish: 'egg', alt: 'youtiao', n: 14, unit: 0.95, line: '班主任：明天月考，娃儿们早上得吃个蛋。' },
    { id: 'o_tailor', who: '服装厂赶工', from: 'man', need: { aff: { man: 4 } }, dish: 'scallion', alt: 'youtiao', n: 12, unit: 0.95, line: '小满：厂里赶工，十二个葱油饼。我先替她们付一半。' }
  ];
  var forecast = {
    sun: ['桥头的老头们说，明天是个大太阳。', '河面平得像镜子。明天晴。'],
    cloud: ['风从下游来，明天怕是阴的。', '燕子飞得不高不低。明天阴天。'],
    rain: ['龚师傅说他的老寒腿疼。明天要下雨。', '蚂蚁在搬家。明天有雨，雨棚收好。']
  };
  var riverLines = [
    '我从桥上看自己的店。门头那块招牌，还是白的。',
    '下午的柳河街是另一条街：晒被子的、打牌的、睡午觉的猫。',
    '有人在河边洗拖把。水是绿的，柳条拖在水里。',
    '修鞋的老头问我是不是新来的。我说是，卖早饭的。',
    '桥洞底下有人在拉二胡。拉的什么我听不出，挺好听。'
  ];
  var visits = {
    zhao: { place: '桥头小公园', bg: 'bg_park', scenes: [
      { id: 'v_zhao_1', title: '树底下的棋', need: { aff: { zhao: 2 } }, beats: [
        ['n', '下午三点，桥头那棵黄桷树底下，一盘象棋围了五六个人。'],
        { enter: 'zhao', slot: 1 },
        ['zhao', '老周！来来来，你帮我看哈，这步马跳哪里？'],
        ['z', '我不会下。厂里午休光打扑克。'],
        ['zhao', '那你站到起，看我杀他个片甲不留。'],
        ['doudou', '周爷爷，我爷爷刚才那步已经走过了。'],
        ['zhao', '走过了？……哦，走过了。那就该他了嘛。'],
        ['n', '他说得很快，像是要把那一下盖过去。'],
        ['doudou', '周爷爷，明天油条还要嫩的哈。'],
        ['z', '晓得。给你留最嫩的那根。'],
        { fx: { aff: { zhao: 0.5 } } },
        { exit: 'zhao' }
      ] },
      { id: 'v_zhao_2', title: '回家的路', need: { aff: { zhao: 5 }, day: [12] }, beats: [
        ['n', '公园门口，豆豆一个人坐在台阶上，书包抱在怀里。'],
        { enter: 'doudou', slot: 1 },
        ['doudou', '周爷爷……我在等爷爷。他说去买盐，一个钟头了。'],
        ['z', '走，我们一起去找。你记得他往哪边走的？'],
        { do: 'tap', label: '牵着豆豆往菜市场走' },
        { exit: 'doudou' },
        { enter: 'zhao', slot: 2 },
        ['zhao', '豆豆？你咋个在这里？放学了？'],
        ['doudou', '爷爷，你说去买盐的。'],
        ['zhao', '盐……对头，盐。老周你也来买盐啊？'],
        ['z', '嗯。顺路，一起走回去。'],
        ['n', '那天我没买盐。我送他们到楼下，豆豆一路攥着爷爷的袖子。'],
        { fx: { aff: { zhao: 0.6 }, fact: ['zhao', 'f_repeat'] } },
        { exit: 'zhao' }
      ] }
    ] },
    song: { place: '医院后门', bg: 'bg_hospital', scenes: [
      { id: 'v_song_1', title: '食堂的粥', need: { aff: { song: 2 } }, beats: [
        ['n', '医院后门的台阶上，小宋穿着便服，端着一个饭盒。'],
        { enter: 'song', slot: 1 },
        ['song', '周叔？你来看病？……哦，路过。吓我一跳。'],
        ['song', '食堂的粥，你尝一口。不用尝，看。'],
        ['z', '米都没开花。这是开水泡的饭。'],
        ['song', '对。我们科的病人出院，第一顿就吃这个。'],
        ['song', '我跟他们说，柳河街有一家，粥是熬的。'],
        ['z', '那……我明早多熬一锅。'],
        ['song', '别多熬。照现在这样熬。油别碰，我鼻子灵。'],
        { fx: { aff: { song: 0.5 } } },
        { exit: 'song' }
      ] },
      { id: 'v_song_2', title: '没交的信', need: { aff: { song: 5 }, day: [12] }, beats: [
        ['n', '她坐在花坛边，手里折着一张纸，折成了好小一块。'],
        { enter: 'song', slot: 1 },
        ['song', '周叔，你当年下岗，是自己走的还是厂里让走的？'],
        ['z', '厂里让的。我在后勤干了二十年，一张单子就完了。'],
        ['song', '我这个，是自己写的。写了三个月，没交。'],
        ['z', '夜班太熬人了吧。'],
        ['song', '熬人我不怕。我怕的是，走了以后，就没人告诉他们去哪喝粥了。'],
        ['n', '她把那块纸塞回白大褂兜里，拍了两下。'],
        ['song', '算了。明早六点，白粥一碗。'],
        { fx: { aff: { song: 0.6 }, fact: ['song', 'f_resign'] } },
        { exit: 'song' }
      ] }
    ] },
    ge: { place: '人才市场门口', bg: 'bg_talent', scenes: [
      { id: 'v_ge_1', title: '等客户', need: { aff: { ge: 2 } }, beats: [
        ['n', '人才市场门口的长椅上，坐着一件我认得的旧西装。'],
        { enter: 'ge', slot: 2 },
        ['ge', '哟，老周。巧了，我在这儿……等个客户。'],
        ['z', '下午三点，在人才市场等客户。'],
        ['ge', '客户嘛，约在哪儿都行。这儿凉快。'],
        ['n', '他腿上那张报纸，招聘版，被红笔圈了四个。'],
        ['z', '葛哥，你那支红笔，借我用用。我记个账。'],
        ['ge', '……拿去。用完不用还了，我包里还有一支。'],
        { fx: { aff: { ge: 0.5 } } },
        { exit: 'ge' }
      ] },
      { id: 'v_ge_2', title: '一张表', need: { aff: { ge: 5 }, day: [12] }, beats: [
        { enter: 'ge', slot: 2 },
        ['ge', '老周，劳驾，"工作经历"这一栏，空着好还是写上好？'],
        ['z', '你干过啥就写啥嘛。'],
        ['ge', '会计，二十二年。最后那家，去年十一月倒的。'],
        ['ge', '我老婆以为我还在上班。每天七点出门，五点回去。'],
        ['z', '所以你在我店里坐到八点半。'],
        ['ge', '你那儿暖和。豆浆一块五，能坐一个钟头。按理说，挺划算。'],
        ['n', '他把表格填完，字一笔一画，像在做账。'],
        ['ge', '这事，你别跟别人说。'],
        ['z', '我嘴笨，说不出来。'],
        { fx: { aff: { ge: 0.6 }, fact: ['ge', 'f_interview'] } },
        { exit: 'ge' }
      ] }
    ] },
    ali: { place: '电动车充电桩', bg: 'bg_lane', scenes: [
      { id: 'v_ali_1', title: '充电二十分钟', need: { aff: { ali: 2 } }, beats: [
        { enter: 'ali', slot: 1 },
        ['ali', '周叔！你也来充电？哦你没车。那你来干啥？'],
        ['z', '随便走走。你吃饭没？'],
        ['ali', '吃了吃了。……冷饭，不算吃。充满二十分钟，我睡十五。'],
        ['ali', '下午单少，晚上那波才要命。'],
        ['z', '你那头盔，睡觉也不摘？'],
        ['ali', '摘了就起不来了。周叔你走吧，我闭会儿眼。'],
        ['n', '他靠在电瓶车上就睡着了。手机还亮着，接单的页面。'],
        { fx: { aff: { ali: 0.5 } } },
        { exit: 'ali' }
      ] },
      { id: 'v_ali_2', title: '六楼', need: { aff: { ali: 5 }, day: [12] }, beats: [
        ['n', '老小区，没电梯。阿力拎着一个保温桶，在楼梯口等我。'],
        { enter: 'ali', slot: 1 },
        ['ali', '周叔，帮个忙。六楼吴奶奶，我今天手被车把磕了。'],
        ['z', '这粥，是你每天在我那儿买的那份？'],
        ['ali', '嗯。她牙不好，我让你晾一下再装，就是给她的。'],
        ['ali', '不是单子。没人下单。我顺路。'],
        { do: 'tap', label: '把保温桶送上六楼' },
        ['n', '吴奶奶开门，说：小阿力今天咋个换人了？'],
        ['z', '他手磕了。明天还是他来。'],
        { fx: { aff: { ali: 0.6 }, fact: ['ali', 'f_wu'] } },
        { exit: 'ali' }
      ] }
    ] },
    gong: { place: '7 路总站', bg: 'bg_depot', scenes: [
      { id: 'v_gong_1', title: '交班', need: { aff: { gong: 2 } }, beats: [
        ['n', '7 路总站，龚师傅坐在调度室门口，刷他那个搪瓷缸。'],
        { enter: 'gong', slot: 1 },
        ['gong', '老周！稀客稀客。来，坐，这凳子我坐了十九年。'],
        ['gong', '你晓得柳河街为啥叫柳河街不？'],
        ['z', '因为有条河，河边有柳树？'],
        ['gong', '因为以前那条街就是河！填了才有的街。我小时候在那儿摸鱼。'],
        ['gong', '你店门口那块，是以前的码头。卖早饭的，一直都在那儿。'],
        ['z', '那我也算接了个老码头。'],
        ['gong', '对头！下一站——柳河街，请下车的乘客，带好早饭。'],
        { fx: { aff: { gong: 0.5 }, fact: ['gong', 'f_river'] } },
        { exit: 'gong' }
      ] },
      { id: 'v_gong_2', title: '线路调整通知', need: { aff: { gong: 5 }, day: [12] }, beats: [
        { enter: 'gong', slot: 1 },
        ['n', '调度室门上贴着一张新的纸。他站在纸前面，挡住了一半。'],
        ['gong', '你莫看。看了也是那几个字。'],
        ['z', '"7 路与 12 路合并，柳河街站撤销。"'],
        ['gong', '月底。跟我退休同一天。巧不巧？'],
        ['z', '那早上的人……'],
        ['gong', '少一车。我每天六点零五拉来的那一车。'],
        ['gong', '我开了三十一年，最后一班，我想开到你门口去。'],
        ['z', '你开来，我把油条炸好等你。炸老的。'],
        { fx: { aff: { gong: 0.6 }, fact: ['gong', 'f_route'] } },
        { exit: 'gong' }
      ] }
    ] },
    man: { place: '小满改衣', bg: 'bg_tailor', scenes: [
      { id: 'v_man_1', title: '一颗扣子', need: { aff: { man: 2 } }, beats: [
        ['n', '隔壁小满改衣，缝纫机哒哒响。我围裙上的扣子掉了一颗。'],
        { enter: 'man', slot: 1 },
        ['man', '脱下来。你那扣子缝的是死结，难怪掉。'],
        ['man', '你肩宽四十六，围裙是四十二的，勒着不难受？'],
        ['z', '盘店的时候一起买的，没得挑。'],
        ['n', '后屋里有个小女孩在咳，一声一声，像拉风箱。'],
        ['man', '糖糖，水在桌上，自己喝！……我女儿。气管不好。'],
        ['man', '好了。扣子给你钉的十字，再掉你来找我。'],
        { fx: { aff: { man: 0.5 }, fact: ['man', 'f_cough'] } },
        { exit: 'man' }
      ] },
      { id: 'v_man_2', title: '后窗', need: { aff: { man: 5 }, day: [12] }, beats: [
        { enter: 'man', slot: 1 },
        ['man', '你过来，看这个窗纱。'],
        ['n', '后窗的纱网上，一层薄薄的黄油泥。是我的油烟。'],
        ['z', '……这是我那边飘过来的。'],
        ['man', '我没说是你。刚开头那几天，黑的。现在是黄的。'],
        ['man', '你换油勤，我闻得出来。糖糖这礼拜就咳了两回。'],
        ['z', '我明天去问问排烟罩多少钱。'],
        ['man', '问嘛。问了我帮你砍价，那个装罩子的是我表哥。'],
        { fx: { aff: { man: 0.6 }, fact: ['man', 'f_window'] } },
        { exit: 'man' }
      ] }
    ] },
    zheng: { place: '学校图书馆', bg: 'bg_school', scenes: [
      { id: 'v_zheng_1', title: '一毛九', need: { aff: { zheng: 2 } }, beats: [
        { enter: 'zheng', slot: 2 },
        ['zheng', '周叔！你怎么在学校？是来……送外卖？'],
        ['z', '路过。你这电脑上啥子，密密麻麻的。'],
        ['zheng', '油条的成本表！面粉、油、电、您的人工……'],
        ['zheng', '一根油条一毛九。但您人工我按最低工资算的。'],
        ['z', '我的人工？我没算过我的人工。'],
        ['zheng', '那您其实是在亏本给我们炸油条。我能写进去吗？'],
        ['z', '你写嘛。写好看点。'],
        { fx: { aff: { zheng: 0.5 }, fact: ['zheng', 'f_cost'] } },
        { exit: 'zheng' }
      ] },
      { id: 'v_zheng_2', title: '论文题目', need: { aff: { zheng: 5 }, day: [12] }, beats: [
        { enter: 'zheng', slot: 2 },
        ['zheng', '周叔，我能问个冒昧的问题吗？'],
        ['zheng', '您明明知道换油要多花钱，为什么还换？'],
        ['z', '我在厂里食堂吃了二十年回锅油。胃吃坏了。'],
        ['z', '我晓得那是啥滋味。不想让别人也这样。'],
        ['n', '他没打字。他把这句写在本子上，用的是笔。'],
        ['zheng', '我的论文题目叫《一家早餐店的诚实成本》。'],
        ['zheng', '我导师说太小了。我觉得一点都不小。'],
        { fx: { aff: { zheng: 0.6 }, fact: ['zheng', 'f_thesis'] } },
        { exit: 'zheng' }
      ] }
    ] },
    qin: { place: '菜市场', bg: 'bg_veg', scenes: [
      { id: 'v_qin_1', title: '收摊的菜', need: { aff: { qin: 2 } }, beats: [
        ['n', '下午的菜市场，老秦在拣他卖剩的菜，好的一堆，蔫的一堆。'],
        { enter: 'qin', slot: 1 },
        ['qin', '老周。买菜？我这都收了。'],
        ['z', '你这蔫的，拿回去喂鸡？'],
        ['qin', '没鸡。自己吃。好的明早给你送。'],
        ['n', '斜对面一辆白色小货车，喇叭里喊"批发价，整箱送"。'],
        ['qin', '老胡的车。这条街，他一车顶我十车。'],
        ['z', '你的菜好。我吃得出来。'],
        ['qin', '……嗯。明早葱多放你一把。'],
        { fx: { aff: { qin: 0.5 }, fact: ['qin', 'f_hu'] } },
        { exit: 'qin' }
      ] },
      { id: 'v_qin_2', title: '一张旧照片', need: { aff: { qin: 5 }, day: [12] }, beats: [
        { enter: 'qin', slot: 1 },
        ['n', '老秦菜摊的秤杆上，用胶带贴着一张褪了色的照片。'],
        ['z', '这是……何姨？'],
        ['qin', '嗯。我刚来柳河街那年，三轮车被收了，是她去说的情。'],
        ['qin', '后来她的菜，我一直按本钱给。'],
        ['z', '那我的菜，你也是按本钱给的？'],
        ['qin', '你用她的锅。'],
        ['n', '他把照片的胶带按了按，没再说话，开始称明天的葱。'],
        { fx: { aff: { qin: 0.6 }, fact: ['qin', 'f_heyi'] } },
        { exit: 'qin' }
      ] }
    ] }
  };
  var scenes = {};
  var places = [
    { id: 'shop', name: '小馆', full: '不烧心小馆（自家店）', mark: '店', x: 565, y: 300, desc: '自家的十平米。下午拉下一半卷帘门，没人来的时候能练练手。' },
    { id: 'tailor', name: '小满改衣', full: '小满改衣（隔壁）', mark: '衣', x: 728, y: 300, open: 9, close: 19, desc: '隔壁的裁缝铺。缝纫机一下午不停，后窗开着一条缝。' },
    { id: 'depot', name: '7 路总站', full: '7 路总站', mark: '站', x: 168, y: 178, desc: '西头的公交总站。司机们在调度室门口抽烟交班，有时有人问包餐。' },
    { id: 'lane', name: '老小区', full: '老小区（六楼吴奶奶家）', mark: '楼', x: 345, y: 92, desc: '九十年代的六层楼，没电梯。阿力每天往六楼送一碗粥。' },
    { id: 'school', name: '学校图书馆', full: '学校与图书馆', mark: '校', x: 1040, y: 140, desc: '小学和老图书馆挨着。小郑下午在图书馆，豆豆四点半放学。' },
    { id: 'veg', name: '菜市场', full: '菜市场', mark: '菜', x: 1085, y: 232, close: 17, desc: '露天的菜市场。老秦的三轮车停在角上，下午收摊前菜最便宜。' },
    { id: 'whole', name: '批发市场', full: '批发市场（老胡档口）', mark: '批', x: 1192, y: 330, close: 18, desc: '东头的批发市场，老胡的档口最大。货要验，价要谈。' },
    { id: 'park', name: '桥头公园', full: '桥头小公园（黄桷树）', mark: '桥', x: 140, y: 548, desc: '过了石桥就是小公园。黄桷树底下天天有人下棋。' },
    { id: 'hospital', name: '医院后门', full: '医院后门', mark: '医', x: 880, y: 602, desc: '医院后门的花坛边。下了夜班的护士在这儿坐一会儿再回家。' },
    { id: 'talent', name: '人才市场', full: '人才市场门口', mark: '才', x: 1110, y: 652, close: 18, desc: '旧写字楼前的空地，公告栏贴满了招聘启事。' },
    { id: 'wharf', name: '码头夜市', full: '河边码头旧址 · 夜市', mark: '夜', x: 1128, y: 468, open: 18, desc: '废弃的码头石阶。天黑以后河边摆起小吃摊，灯泡一串一串亮起来。' },
    { id: 'heyi', name: '何姨家', full: '何姨女儿家（城北）', mark: '北', x: 62, y: 268, lock: 'heyi_lead', bus: 90, desc: '城北的老院子。坐 7 路过去要一个半钟头。' }
  ];
  var schedule = {
    zhao: [{ at: 'park', from: 15, to: 17.5, rainAt: 'lane' }],
    song: [{ at: 'hospital', from: 15, to: 17, since: 2 }],
    ge: [{ at: 'talent', from: 14, to: 17, until: 25 }],
    ali: [{ at: 'lane', from: 13, to: 15.5 }],
    gong: [{ at: 'depot', from: 13, to: 15, until: 27 }],
    man: [{ at: 'tailor', from: 13, to: 19 }],
    zheng: [{ at: 'school', from: 14, to: 18 }],
    qin: [{ at: 'veg', from: 13, to: 15 }]
  };
  var sceneAt = { zhao: 'park', song: 'hospital', ge: 'talent', ali: 'lane', gong: 'depot', man: 'tailor', zheng: 'school', qin: 'veg' };
  var miss = {
    v_zhao_2: { until: 21, who: '龚师傅', line: '老赵前天在菜市场转了一下午，豆豆满街喊爷爷。' },
    v_song_2: { until: 22, who: '护士', line: '宋护士在花坛边坐了很久，手里一直捏着一张纸。' },
    v_ge_2: { until: 22, who: '老葛', line: '劳驾，昨天那张表……算了，我自己填好了。' },
    v_ali_2: { until: 20, who: '阿力', line: '周叔，昨天六楼那碗是我手磕着送上去的。没事。' },
    v_gong_2: { until: 24, who: '龚师傅', line: '总站门口贴了张新通知，你怕是还不晓得。' },
    v_man_2: { until: 22, who: '小满', line: '后窗的纱我换了。黄的，你那边的油烟。' },
    v_zheng_2: { until: 24, who: '小郑', line: '周叔，我论文题目定了。改天给您看。' },
    v_qin_2: { until: 24, who: '老秦', line: '秤杆上那张照片，你没看见也好。' }
  };
  var talk = {
    zhao: ['这步马跳哪里？……你也不会？那你站到起。', '豆豆四点半放学，我等哈去接。', '你这店叫啥子来着？哦，还没取。'],
    song: ['刚睡醒。别跟我说话，五分钟。', '花坛边上晒太阳，比值班室的床舒服。', '今天的油，我早上闻了。还行。'],
    ge: ['巧了，我在这儿……等个客户。', '公告栏上的字，我都背得出来了。', '按理说，这个年纪不该来这种地方。'],
    ali: ['充电二十分钟，我睡十五。', '六楼，没电梯。我腿已经不是我的了。', '周叔你下午也出来逛？稀奇。'],
    gong: ['交班了交班了！下午这趟我不跑。', '我在这条线上跑了三十一年，闭着眼都能开。', '你店门口那块，以前是码头，晓得不？'],
    man: ['坐嘛。莫碰那个，针还没拔。', '你这围裙，肩宽差了四公分。', '糖糖在里屋写作业，小声点。'],
    zheng: ['周叔！我能问个冒昧的问题吗？', '我算了一下午，还是那个数：一毛九。', '图书馆空调开得太猛，我出来透口气。'],
    qin: ['收了。剩这些，蔫的自己吃。', '今天葱好。明早多给你一把。', '老胡的车又堵在路口。']
  };
  var idle = {
    shop: ['我把卷帘门拉下一半，一个人对着粥锅练搅。手腕酸了。', '我把何姨的粥谱又抄了一页，字比她的丑。'],
    tailor: ['缝纫机哒哒哒，跟我油锅的声音一个节奏。', '小满在给人改裤脚，嘴里叼着三根针，还能骂人。'],
    depot: ['两个司机在调度室门口下象棋，输的请对方一根烟。', '一辆空车慢慢开出站，车窗上贴着"7 路"两个字。'],
    lane: ['楼道里一辆旧自行车，车筐里种着一盆葱。', '三楼有人在炒回锅肉，香得我站住了。'],
    school: ['放学铃一响，一群娃儿从校门口冲出来。', '图书馆门口的梧桐树底下，有人在背单词。'],
    veg: ['卖鱼的在吆喝"最后几条，便宜卖"。', '一个老太太为了一毛钱跟摊主说了五分钟。'],
    whole: ['货车倒车的声音"倒车请注意"响了一下午。', '地上全是水，冻品箱子在往外冒白气。'],
    park: ['黄桷树底下，两个老头为一步棋吵起来了。', '桥洞底下有人拉二胡，调子慢悠悠的。'],
    hospital: ['花坛边上，一个病人家属在吃盒饭。', '救护车开进去，没响笛。'],
    talent: ['公告栏前站着几个中年人，谁也不跟谁说话。', '一个年轻人把简历折成纸飞机，又展开抚平。'],
    wharf: ['河边的小吃摊一串灯泡亮起来，烤红薯的味道飘过来。', '码头的石阶伸进水里，有人在最下面一级洗拖把。'],
    heyi: ['院子里晒着小孩的衣服。']
  };
  Object.keys(visits).forEach(function (id) { visits[id].scenes.forEach(function (sc, i) { sc.when = 'town'; sc.who = id; sc.tier = i; sc.place = visits[id].bg; sc.at = sceneAt[id]; scenes[sc.id] = sc; }); });
  return { goods: goods, sellers: sellers, tools: tools, orders: orders, forecast: forecast, riverLines: riverLines, visits: visits, scenes: scenes, places: places, schedule: schedule, sceneAt: sceneAt, miss: miss, talk: talk, idle: idle };
});
;
/* content/story.js */
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
;
/* core/rng.js */
BSX.define('core/rng', function () {
  function next(state) {
    var t = (state + 0x6D2B79F5) >>> 0;
    var r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return { state: t, value: ((r ^ (r >>> 14)) >>> 0) / 4294967296 };
  }
  function rand(holder) { var n = next(holder.rng >>> 0); holder.rng = n.state; return n.value; }
  function range(holder, a, b) { return a + (b - a) * rand(holder); }
  function pick(holder, arr) { return arr[Math.floor(rand(holder) * arr.length) % arr.length]; }
  function weighted(holder, items, wf) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += Math.max(0, wf(items[i]));
    if (total <= 0) return null;
    var x = rand(holder) * total;
    for (i = 0; i < items.length; i++) { x -= Math.max(0, wf(items[i])); if (x <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function hashSeed(n) { var h = (n >>> 0) ^ 0x9E3779B9; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35); return (h ^ (h >>> 16)) >>> 0; }
  return { next: next, rand: rand, range: range, pick: pick, weighted: weighted, hashSeed: hashSeed };
});
;
/* core/cond.js */
BSX.define('core/cond', function (require) {
  var C = require('content/config');
  var Cast = require('content/cast');
  function inR(v, r) { if (v == null || typeof v !== 'number' || isNaN(v)) return false; if (!Array.isArray(r)) r = [r]; return v >= r[0] && (r[1] == null || v <= r[1]); }
  function read(s) {
    var hist = s.hist, y = hist[hist.length - 1], last = hist.slice(-5), pa = s.plan.price, i, sum = 0;
    if (last.length) { for (i = 0; i < last.length; i++) sum += last[i].price; pa = sum / last.length; }
    var affSum = 0, credit = 0, k;
    for (k in s.reg) affSum += s.reg[k].aff;
    for (k in s.credit) credit += s.credit[k];
    return { day: s.day, weather: s.today ? s.today.weather : 'sun', burn: s.burn, rep: s.rep, cash: s.cash / 100, oilAge: s.oil.age, price: s.plan.price, priceAvg: pa,
      mat: s.plan.mat, helper: !!s.helper, posted: !!s.plan.post, fast: y ? y.wait < 0.46 : null, quality: y ? y.q : null, credit: credit / 100, affSum: affSum, hood: !!s.upg.hood };
  }
  function check(s, need, h) {
    if (!need) return true;
    h = h || read(s);
    var k, i;
    if (need.day && !inR(h.day, need.day)) return false;
    if (need.aff) for (k in need.aff) if (!s.reg[k] || s.reg[k].aff < need.aff[k]) return false;
    if (need.flags) for (i = 0; i < need.flags.length; i++) if (!s.flags[need.flags[i]]) return false;
    if (need.not) for (i = 0; i < need.not.length; i++) if (s.flags[need.not[i]]) return false;
    if (need.seen) for (i = 0; i < need.seen.length; i++) if (!s.seen[need.seen[i]]) return false;
    if (need.unseen) for (i = 0; i < need.unseen.length; i++) if (s.seen[need.unseen[i]]) return false;
    if (need.weather && h.weather !== need.weather) return false;
    var ranges = ['burn', 'rep', 'cash', 'oilAge', 'price', 'priceAvg', 'mat', 'quality', 'credit', 'affSum'];
    for (i = 0; i < ranges.length; i++) if (need[ranges[i]] != null && !inR(h[ranges[i]], need[ranges[i]])) return false;
    if (need.menu) for (i = 0; i < need.menu.length; i++) if (s.plan.menu.indexOf(need.menu[i]) < 0) return false;
    if (need.unlocked) for (i = 0; i < need.unlocked.length; i++) if (!s.unlocked[need.unlocked[i]]) return false;
    if (need.helper != null && !!need.helper !== h.helper) return false;
    if (need.posted != null && !!need.posted !== h.posted) return false;
    if (need.fast != null && (h.fast == null || !!need.fast !== h.fast)) return false;
    if (need.any) { var ok = false; for (i = 0; i < need.any.length; i++) if (check(s, need.any[i], h)) { ok = true; break; } if (!ok) return false; }
    return true;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function news(s, type, id) { if (s.today) { s.today.news = s.today.news || []; s.today.news.push({ type: type, id: id }); } }
  function onFlag(s, f) {
    var c;
    if (f === 'crisis_rectify') { c = C.crisis.rectify; s.cash += c.cash; s.burn = Math.min(s.burn, c.burnTo); s.rep = clamp(s.rep + c.rep, 0, 100); s.closeNext = true; s.crisis = 'rectify'; }
    else if (f === 'crisis_refund') { c = C.crisis.refund; s.cash += c.cash; s.rep = clamp(s.rep + c.rep, 0, 100); s.burn = clamp(s.burn + c.burn, 0, 100); s.later.push({ day: s.day + 3, fx: { rep: c.laterRep }, note: '退过钱的那几位，又有人推门进来了。' }); s.crisis = 'refund'; }
    else if (f === 'crisis_hold') { s.rep = clamp(s.rep + C.crisis.hold.rep, 0, 100); s.crisis = 'hold'; }
    else if (f === 's_sold') { s.cash += C.rescue.sell; s.rescueUsed = true; if (s.helper) s.helper = false; else { var ids = ['burner', 'hood', 'shelf', 'fryer', 'bigpot', 'awning', 'board']; for (var i = 0; i < ids.length; i++) if (s.upg[ids[i]]) { delete s.upg[ids[i]]; break; } } }
    else if (f === 's_borrow') { s.cash += C.rescue.borrow; s.rescueUsed = true; s.owe = C.rescue.repay; }
    else if (f === 's_refuse') { s.rescueUsed = true; }
    else if (f === 's_costup') { s.costUp = true; }
  }
  function apply(s, fx, affScale) {
    if (!fx) return;
    var k, i; affScale = affScale || 1;
    if (fx.cash) s.cash += Math.round(fx.cash * 100);
    if (fx.rep) s.rep = clamp(s.rep + fx.rep, 0, 100);
    if (fx.burn) s.burn = clamp(s.burn + fx.burn, 0, 100);
    if (fx.aff) for (k in fx.aff) if (s.reg[k]) s.reg[k].aff = clamp(s.reg[k].aff + fx.aff[k] * (fx.aff[k] > 0 ? affScale : 1), 0, 10);
    if (fx.set) for (i = 0; i < fx.set.length; i++) { if (!s.flags[fx.set[i]]) { s.flags[fx.set[i]] = s.day; onFlag(s, fx.set[i]); } }
    if (fx.clear) for (i = 0; i < fx.clear.length; i++) delete s.flags[fx.clear[i]];
    if (fx.unlock) [].concat(fx.unlock).forEach(function (d) { if (!s.unlocked[d]) { s.unlocked[d] = s.day; news(s, 'dish', d); } });
    if (fx.memento && !s.mementos.some(function (m) { return m.id === fx.memento; })) { s.mementos.push({ id: fx.memento, day: s.day }); news(s, 'memento', fx.memento); }
    if (fx.fact && s.reg[fx.fact[0]] && s.reg[fx.fact[0]].facts.indexOf(fx.fact[1]) < 0) { s.reg[fx.fact[0]].facts.push(fx.fact[1]); news(s, 'fact', fx.fact[0] + '/' + fx.fact[1]); }
    if (fx.flow && s.today) s.today.flow *= fx.flow;
    if (fx.flowNext) s.nextFlow = (s.nextFlow || 1) * fx.flowNext;
    if (fx.shift && s.today) s.today.shift *= fx.shift;
    if (fx.deposit) s.deposit = Math.max(0, s.deposit + Math.round(fx.deposit * 100));
    if (fx.helper != null) { s.helper = !!fx.helper; if (s.helper) s.flags.helper = s.day; else delete s.flags.helper; }
    if (fx.closeNext) s.closeNext = true;
    if (fx.payDeposit) { s.cash -= s.deposit; s.depositPaid = true; }
    if (fx.chipin) { s.chipAmount = Math.max(0, s.deposit - Math.max(0, s.cash)); s.cash = Math.max(0, s.cash - s.deposit); if (s.cash < 0) s.cash = 0; s.depositPaid = true; }
    if (fx.later) s.later.push({ day: s.day + (fx.later.days || 1), fx: fx.later.fx, note: fx.later.note });
  }
  return { check: check, apply: apply, read: read, inR: inR, clamp: clamp };
});
;
/* core/run.js */
BSX.define('core/run', function (require) {
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var St = require('content/story');
  var R = require('core/rng');
  var Cond = require('core/cond');
  var SCHEMA = 4;
  var clamp = Cond.clamp;
  function paceMul(s) { return [1.4, 1, 0.84][s.pace == null ? 1 : s.pace]; }
  function create(o) {
    o = o || {};
    var seed = (o.seed != null ? o.seed : 20261114) >>> 0;
    var s = {
      schema: SCHEMA, cv: C.contentVersion, seed: seed, rng: R.hashSeed(seed), gen: o.gen || 1, heirloom: o.heirloom || null, pace: o.pace == null ? 1 : o.pace, days: C.days,
      day: 1, phase: 'prep', cash: C.startCash, rep: C.startRep, burn: 0,
      plan: { menu: ['congee', 'youtiao', 'soy'], stock: { congee: 9, youtiao: 10, soy: 7 }, price: 1, mat: 1, oil: 'new', post: false },
      oil: { age: 0, bulk: false },
      unlocked: {}, upg: {}, helper: false,
      reg: {}, seen: {}, flags: {}, later: [], credit: {}, mementos: [], log: [], hist: [],
      stats: { cooked: {}, sold: {}, st: {}, served: 0, delighted: 0, fine: 0, meh: 0, walked: 0, balked: 0, slipDays: 0, freshDays: 0, oilDays: 0, oldOilDays: 0, priceDays: [0, 0, 0], matDays: [0, 0, 0], chats: 0, remembered: 0, wasted: 0, given: 0, tips: 0, qSum: 0, qN: 0, bestDay: 0, oilChanges: 0, returned: 0, kept: 0 },
      deposit: C.deposit, depositPaid: false, crisis: null, negDays: 0, rescueUsed: false, owe: 0,
      today: null, ending: null, early: null
    };
    Cast.regIds.forEach(function (id) { s.reg[id] = { aff: 0, visits: 0, last: 0, beats: [], usual: false, facts: [], met: 0 }; });
    if (s.heirloom === 'H_TIN') s.cash += 10000;
    if (s.heirloom === 'H_NOTE') s.unlocked.pidan = 1;
    if (s.heirloom === 'H_APRON') D.order.forEach(function (k) { s.stats.st[k] = C.skill[0]; });
    beginDay(s);
    return s;
  }
  function price(s, id) { return Math.round(D.byId[id].price * C.priceMul[s.plan.price] * 2) * 50; }
  function costUpNow(s) { return s.day >= C.costUp.from && s.day <= C.costUp.to && s.plan.mat >= 1; }
  function unitCost(s, id) { var d = D.byId[id], m = C.matCost[s.plan.mat] * (costUpNow(s) ? C.costUp.mul : 1) * (s.heirloom === 'H_BASKET' && s.day <= 3 ? 0.8 : 1); return Math.round(d.cost * 100 * m); }
  function available(s, id) { var d = D.byId[id]; return !!d && !!s.unlocked[id] && (d.minMat == null || s.plan.mat >= d.minMat); }
  function menuChoices(s) { return D.list.filter(function (d) { return !d.set && available(s, d.id); }); }
  function setsOn(s) { return D.list.filter(function (d) { return d.set && s.unlocked[d.id] && d.set.every(function (p) { return s.plan.menu.indexOf(p) >= 0; }); }).map(function (d) { return d.id; }); }
  function usesOil(s) { return s.plan.menu.some(function (id) { return D.byId[id].oil; }); }
  function stationsToday(s) { return D.stationsFor(s.plan.menu); }
  function hotCount(menu) { return D.stationsFor(menu).filter(function (k) { return D.stations[k].hot; }).length; }
  function skillLv(s, st) { var n = s.stats.st[st] || 0, lv = 0; C.skill.forEach(function (t) { if (n >= t) lv++; }); return lv; }
  function features(s) { var d = s.day; return { stock: d >= 2, oil: d >= 2, menu: d >= 3, mat: d >= 4, price: d >= 5, mat2: d >= 8, post: d >= 8, upgrades: d >= 3 }; }
  function planCost(s) {
    var p = s.plan, lines = [], goods = 0;
    p.menu.forEach(function (id) { var n = p.stock[id] || 0, u = unitCost(s, id); lines.push({ id: id, n: n, unit: u, sum: n * u }); goods += n * u; });
    var oil = 0;
    if (usesOil(s) && s.day > 1) oil = p.oil === 'new' ? C.oil.fresh : p.oil === 'filter' ? C.oil.filter : p.oil === 'bulk' ? C.oil.bulk : 0;
    var pan = s.pantry && s.pantry.day === s.day ? Math.min(s.pantry.credit, goods) : 0;
    var po = s.preorder && s.preorder.day === s.day ? s.preorder : null, pre = po ? po.n * unitCost(s, po.dish) : 0;
    return { lines: lines, goods: goods, oil: oil, pantry: pan, pre: pre, preLine: po ? { who: po.who, dish: po.dish, n: po.n } : null, total: goods + oil - pan + pre };
  }
  function setMenu(s, id, on) {
    var p = s.plan, i = p.menu.indexOf(id);
    if (on) {
      if (i >= 0 || !available(s, id) || p.menu.length >= C.menuMax(s)) return false;
      if (hotCount(p.menu.concat([id])) > C.burners(s)) return false;
      p.menu.push(id); if (!p.stock[id]) p.stock[id] = suggest(s, id);
    } else { if (i < 0 || p.menu.length <= 1) return false; p.menu.splice(i, 1); }
    return true;
  }
  function whyNot(s, id) {
    var p = s.plan;
    if (p.menu.length >= C.menuMax(s)) return '菜单牌写满了';
    if (hotCount(p.menu.concat([id])) > C.burners(s)) return '灶眼不够，先撤一口灶';
    return '';
  }
  function suggest(s, id) {
    var y = s.hist[s.hist.length - 1], d = D.byId[id];
    if (y && y.want && y.want[id] != null) return clamp(Math.ceil(y.want[id] * 1.12 + 1), 3, 40);
    return Math.round(clamp((4 + s.day * 0.32) * d.pop * (d.price >= 9 ? 0.55 : 1), 3, 14));
  }
  function setStock(s, id, n) { s.plan.stock[id] = clamp(Math.round(n), 0, 48); }
  function setMat(s, v) { s.plan.mat = v; s.plan.menu = s.plan.menu.filter(function (id) { return available(s, id); }); if (!s.plan.menu.length) s.plan.menu = ['congee']; }
  function hread(s, id) { var h = Cond.read(s); h.aff = id ? s.reg[id].aff : 0; return h; }
  function pickBeat(s, id, h) {
    var r = St.regs[id], st = s.reg[id], done = {};
    st.beats.forEach(function (bid) { var b = r.beatById[bid]; if (b && b.group) done[b.group] = 1; });
    for (var i = 0; i < r.beats.length; i++) {
      var b = r.beats[i], dy = b.need && b.need.day;
      if (st.beats.indexOf(b.id) >= 0 || (b.group && done[b.group])) continue;
      if (dy && dy[1] != null && s.day > dy[1]) continue;
      if (Cond.check(s, b.need, h)) return b;
    }
    return null;
  }
  function viralFlag(s) {
    var last = s.hist.slice(-7), oa = 0, q = 0;
    last.forEach(function (d) { oa += d.oilAge; q += d.q; });
    oa = last.length ? oa / last.length : 0; q = last.length ? q / last.length : 0.7;
    if (s.burn >= 32 || oa >= 2.6 || s.flags.powder_hidden) return 'viral_bad';
    if (s.burn <= 14 && oa <= 1.6 && q >= 0.7) return 'viral_good';
    return 'viral_plain';
  }
  function pickEvent(s, when, h, chance) {
    if (s.day < 3 || R.rand(s) > chance) return null;
    var list = St.events.filter(function (e) {
      if (e.when !== when) return false;
      if (s.seen[e.id] && (e.once !== false || s.day - s.seen[e.id] < (e.cool || 5))) return false;
      return Cond.check(s, e.need, h);
    });
    var e = R.weighted(s, list, function (x) { return x.weight || 1; });
    return e ? e.id : null;
  }
  function beginDay(s) {
    var day = s.day, i;
    var notes = [];
    s.later = s.later.filter(function (l) { if (l.day <= day) { Cond.apply(s, l.fx); if (l.note) notes.push({ text: l.note, kind: 'later' }); return false; } return true; });
    var w = C.fixedWeather[day] || (s.forecast && s.forecast.day === day ? s.forecast.w : null);
    if (!w) { var x = R.rand(s); w = x < C.weatherOdds.sun ? 'sun' : x < C.weatherOdds.sun + C.weatherOdds.cloud ? 'cloud' : 'rain'; }
    s.today = { weather: w, beats: {}, visitors: [], absent: {}, open: null, closeEvent: null, notes: notes, flow: s.nextFlow || 1, shift: 1, closed: !!s.closeNext, news: [], found: [], newDishes: [] };
    s.nextFlow = 1; s.closeNext = false;
    D.list.forEach(function (d) { if (!s.unlocked[d.id] && d.day <= day && d.id !== 'mutton') { s.unlocked[d.id] = day; if (day > 1) s.today.newDishes.push(d.id); } });
    if (day === 18) { var vf = viralFlag(s); s.flags[vf] = day; s.today.flow *= C.viralFlow[vf.slice(6)]; }
    if (s.today.closed) { s.phase = 'prep'; return; }
    var h = hread(s);
    Cast.regIds.forEach(function (id) {
      var hh = hread(s, id), b = pickBeat(s, id, hh), st = s.reg[id];
      if (b) {
        if (b.act === 'absent') { s.today.absent[id] = b.id; return; }
        if (b.key || R.rand(s) < 0.9) { s.today.beats[id] = b.id; s.today.visitors.push(id); if (b.note) s.today.notes.push({ text: b.note, from: id, kind: 'order' }); return; }
      }
      if (st.met && R.rand(s) < clamp(St.regs[id].attend(hh) + (s.heirloom === 'H_CURTAIN' ? 0.05 : 0), 0.05, 0.97)) s.today.visitors.push(id);
    });
    var m = St.mainBy[day + '/open'];
    if (m && Cond.check(s, m.need, h)) s.today.open = m.id;
    else if (s.negDays >= 2 && !s.rescueUsed) s.today.open = 'rescue';
    else s.today.open = pickEvent(s, 'open', h, 0.5);
    s.today.closeEvent = pickEvent(s, 'close', h, s.today.open && St.scenes[s.today.open] && St.scenes[s.today.open].event ? 0.25 : 0.5);
    s.plan.menu = s.plan.menu.filter(function (id) { return available(s, id); });
    if (!s.plan.menu.length) s.plan.menu = ['congee'];
    s.plan.menu.forEach(function (id) { if (s.plan.stock[id] == null) s.plan.stock[id] = suggest(s, id); });
    if (day > 1) s.plan.oil = 'keep';
    if (day === 2) { s.plan.stock = { congee: 12, youtiao: 14, soy: 12 }; }
    var pre = s.preorder;
    if (pre && pre.day === day) {
      s.today.notes.unshift({ text: '开门前要交' + pre.who + ' ' + pre.n + ' 份' + D.byId[pre.dish].name + '。料单独备，进货小票上有一行。', kind: 'order' });
    }
    if (s.pantry && s.pantry.day === day) s.pantry.notes.forEach(function (n) { s.today.notes.push({ text: n, kind: 'pantry' }); });
    if (BSX.has('core/town')) require('core/town').missed(s).forEach(function (n) { s.today.notes.push(n); });
    s.phase = 'prep';
  }
  function openShop(s) {
    var cost = planCost(s), p = s.plan, o = s.oil;
    s.cash -= cost.total;
    if (usesOil(s) && s.day > 1) {
      if (p.oil === 'new') { o.age = 0; o.bulk = false; s.stats.oilChanges++; }
      else if (p.oil === 'bulk') { o.age = C.oil.bulkAge; o.bulk = true; s.stats.oilChanges++; }
      else if (p.oil === 'filter') o.age += 0.5 * (o.bulk ? C.oil.bulkRate : 1);
      else o.age += 1 * (o.bulk ? C.oil.bulkRate : 1);
    }
    s.today.cost = cost; s.today.oilAge = o.age;
    if (s.pantry && s.pantry.day === s.day) { s.today.pantryQ = s.pantry.q; s.burn = clamp(s.burn + s.pantry.burn, 0, 100); s.pantry = null; }
    var pre = s.preorder;
    if (pre && pre.day === s.day) {
      var got = pre.n, rev = got * pre.unit;
      s.cash += rev; s.today.pre = { who: pre.who, dish: pre.dish, n: pre.n, got: got, rev: rev };
      if (got < pre.n) { s.rep = clamp(s.rep - 2, 0, 100); if (pre.from && s.reg[pre.from]) s.reg[pre.from].aff = clamp(s.reg[pre.from].aff - 0.5, 0, 10); }
      else if (pre.from && s.reg[pre.from]) s.reg[pre.from].aff = clamp(s.reg[pre.from].aff + 0.2, 0, 10);
      s.preorder = null;
    }
    if (p.post) { s.flags.slip_ever = s.flags.slip_ever || s.day; if (!s.mementos.some(function (m) { return m.id === 'm_slip'; })) s.mementos.push({ id: 'm_slip', day: s.day }); }
    s.phase = 'service';
    return cost;
  }
  function parseItem(x) {
    if (typeof x !== 'string') return x && x.wish ? [{ wish: x.wish }] : [];
    var a = x.split(':'), d = D.byId[a[0]];
    if (!d) return [];
    if (d.set) return d.set.map(function (p) { return { d: p, set: d.id }; });
    return [{ d: a[0], mod: a[1] || null }];
  }
  function expand(list) { var out = []; (list || []).forEach(function (x) { out = out.concat(parseItem(x)); }); return out; }
  function walkCount(s, h) {
    var p = s.plan, t = s.today;
    if (s.day === 1) return 4;
    var pf = C.priceFlow[p.price]; if (p.price === 2 && p.mat === 2) pf = 0.95;
    var n = C.baseFlow(s.day) * C.repFlow(s.rep) * pf * C.weatherFlow[t.weather] * t.flow * R.range(h, 0.93, 1.07);
    if (t.weather === 'rain' && s.upg.awning) n *= 1.1;
    n *= [0.88, 1, 1.12][s.pace == null ? 1 : s.pace];
    if (s.burn >= 70) n *= 0.86;
    if (p.post) n *= s.today.oilAge >= 3 ? 0.9 : (s.stats.slipDays >= 3 ? 1.07 : 1.02);
    if (s.heirloom === 'H_MUG') n += 2;
    return Math.max(3, Math.round(n));
  }
  function makeOrder(s, h, A) {
    var p = s.plan, menu = p.menu.concat(setsOn(s)), x = R.rand(h), k = x < A.items[0] ? 1 : x < A.items[0] + A.items[1] ? 2 : 3;
    var adj = C.priceItems[p.price] * A.sens * (p.price === 2 && p.mat === 2 ? 0.5 : 1);
    if (adj > 0 && R.rand(h) < adj) k++; if (adj < 0 && R.rand(h) < -adj) k--;
    k = clamp(k, 1, 3);
    var out = [], used = {};
    for (var i = 0; i < k; i++) {
      if (s.day >= 4 && R.rand(h) < 0.15) {
        var tags = A.likes.filter(function (tg) { return p.menu.some(function (id) { return D.byId[id].tags.indexOf(tg) >= 0; }); });
        if (tags.length) { out.push({ wish: R.pick(h, tags) }); continue; }
      }
      var id = R.weighted(h, menu, function (m) { var d = D.byId[m], w = d.pop, n = 0; d.tags.forEach(function (tg) { if (A.likes.indexOf(tg) >= 0) n++; }); w *= 1 + 0.45 * n; if (used[m]) w *= 0.3; if (d.price >= 9 && A.sens > 1.05) w *= 0.7; return w; }).toString();
      used[id] = 1;
      var d = D.byId[id], items = parseItem(id);
      if (items.length === 1) {
        if (d.pref && s.day >= 3 && R.rand(h) < 0.14) items[0].mod = R.rand(h) < 0.5 ? '嫩' : '老';
        else if (d.temp && s.day >= 5 && R.rand(h) < 0.05) items[0].mod = '温';
      }
      out = out.concat(items);
    }
    return out;
  }
  function atFrac(h, at, i) {
    if (typeof at === 'number') return at;
    switch (at) { case 'open': return 0.015 + i * 0.03; case 'early': return R.range(h, 0.1, 0.24); case 'late': return R.range(h, 0.74, 0.9); case 'last': return 1.02 + i * 0.02; default: return R.range(h, 0.4, 0.62); }
  }
  function buildService(s) {
    var h = { rng: R.hashSeed((s.seed ^ Math.imul(s.day, 7919)) >>> 0) }, t = s.today;
    var len = C.shiftLen(s.day) * t.shift, arrivals = [], i;
    var n = walkCount(s, h), archIds = Object.keys(Cast.archetypes);
    var centers = [0.19, 0.52, 0.83], wts = [0.3, 0.44, 0.26];
    for (i = 0; i < n; i++) {
      var u = R.rand(h), c = u < wts[0] ? 0 : u < wts[0] + wts[1] ? 1 : 2, f = clamp(centers[c] + (R.rand(h) + R.rand(h) + R.rand(h) - 1.5) * 0.14, 0.03, 0.97);
      if (s.day === 1) f = 0.2 + i * 0.17;
      var aid = R.weighted(h, archIds, function (a) { var A = Cast.archetypes[a], w = A.w * (t.weather === 'rain' ? A.rain : 1); if (s.plan.price === 2) w *= A.sens > 1.05 ? 0.7 : 1.15; if (s.plan.price === 0) w *= A.sens > 1.05 ? 1.2 : 0.95; if (s.day <= 2 && a === 'rider') w = 0; return w; });
      var A = Cast.archetypes[aid];
      arrivals.push({ t: f * len, kind: 'walk', arch: aid, seed: Math.floor(R.rand(h) * 1e6), order: makeOrder(s, h, A), patience: R.range(h, C.patience.walk[0], C.patience.walk[1]) * A.patience * paceMul(s) + (s.day === 1 ? C.patience.tutorial : s.day === 2 ? 12 : 0), tip: A.tip });
    }
    var openIdx = 0;
    t.visitors.forEach(function (id) {
      var r = St.regs[id], b = t.beats[id] ? r.beatById[t.beats[id]] : null, at = b && b.at != null ? b.at : r.at;
      var order;
      if (b && b.order && b.order !== 'usual') order = expand(b.order);
      else if (b && b.act === 'peek') order = [];
      else order = expand(r.usual);
      var hide = b ? !!b.hide : (s.reg[id].visits >= 2 && R.rand(h) < 0.6);
      arrivals.push({ t: atFrac(h, at, at === 'open' || at === 'last' ? openIdx++ : 0) * len, kind: 'reg', id: id, beat: b ? b.id : null, order: order, hide: hide, patience: C.patience.regular * paceMul(s) + (s.day <= 2 ? 16 : 0), last: at === 'last' });
    });
    arrivals.sort(function (a, b) { return a.t - b.t; });
    for (i = 1; i < arrivals.length; i++) if (arrivals[i].t < arrivals[i - 1].t + 1.6) arrivals[i].t = arrivals[i - 1].t + 1.6;
    var remarks = [];
    Object.keys(t.absent).forEach(function (id) { var b = St.regs[id].beatById[t.absent[id]]; if (b && b.remark) remarks.push({ t: R.range(h, 0.3, 0.7) * len, who: b.remark.who, line: b.remark.line, about: id }); });
    return { len: len, slots: C.slots(s.day), arrivals: arrivals, remarks: remarks, queuePatience: C.patience.queue, seed: h.rng };
  }
  function satisfaction(qAvg, waitFrac, bonus) { return clamp(qAvg * (waitFrac < 0.5 ? 1 : 1 - (waitFrac - 0.5) * 0.5) + (bonus || 0), 0, 1.1); }
  function grade(sat) { return sat >= C.delight ? 'delight' : sat >= C.fine ? 'fine' : 'meh'; }
  function finishService(s, res) {
    var t = s.today, p = s.plan, st = s.stats, k;
    var fixed = C.utilities + (s.helper ? C.helperWage : 0);
    s.cash += res.revenue + res.tips - fixed;
    var rd = res.delighted * C.repDelta.delight + res.fine * C.repDelta.fine + res.meh * C.repDelta.meh + res.walked * C.repDelta.walk + res.balked * C.repDelta.balk + (res.soldout || 0) * C.repDelta.soldout;
    if (p.post) rd += t.oilAge <= 1 && p.mat >= 1 ? 0.3 : t.oilAge >= 3 ? -0.5 : 0.1;
    if (s.flags.e_leftover_give && res.leftover >= 3) { rd += 0.15; st.given += res.leftover; }
    if (s.crisis === 'hold') rd -= 0.8;
    if (rd > 0 && s.rep > 80) rd *= 0.45;
    rd = clamp(rd, -C.repDayCap, C.repDayCap);
    s.rep = clamp(s.rep + rd, 0, 100);
    var bd = (res.burnAdd || 0) * (s.upg.hood ? C.hoodBurn : 1);
    if (s.flags.powder_hidden) bd += 1.3;
    if (s.flags.cheap_mutton && res.sold && res.sold.mutton) bd += 0.3 * res.sold.mutton;
    if (bd <= 0.01 && (!usesOil(s) || t.oilAge <= 1)) bd = -C.burnDecay;
    s.burn = clamp(s.burn + bd, 0, 100);
    for (k in res.regs) {
      var o = res.regs[k], rs = s.reg[k], r = St.regs[k], b = o.beat ? r.beatById[o.beat] : null, da = 0;
      rs.visits++; rs.last = s.day; if (!rs.met) rs.met = s.day;
      if (o.outcome === 'delight') da += C.aff.delight; else if (o.outcome === 'fine') da += C.aff.fine; else if (o.outcome === 'meh') da += C.aff.meh; else if (o.outcome === 'walk') da += C.aff.walk; else if (o.outcome === 'soldout') da -= 0.12;
      if (o.chat) { da += C.aff.chat; st.chats++; }
      if (o.remembered) { da += C.aff.remember; st.remembered++; rs.usual = true; }
      if (o.asked) da += C.aff.ask;
      if (o.extra === 'returned') { da += C.aff.returned; s.flags.returned_extra = s.day; st.returned++; }
      if (o.extra === 'kept') { s.flags.kept_extra = s.day; st.kept++; }
      if (o.credit) s.credit[k] = (s.credit[k] || 0) + o.credit;
      if (o.repaid) s.credit[k] = 0;
      rs.aff = clamp(rs.aff + da, 0, 10);
      if (b) {
        rs.beats.push(b.id); s.seen[b.id] = s.day;
        Cond.apply(s, b.fx, C.aff.beat);
        if (o.outcome === 'delight' || o.outcome === 'fine' || o.outcome === 'peek') Cond.apply(s, b.fxGood, C.aff.beat); else Cond.apply(s, b.fxBad, C.aff.beat);
        if (b.leave && b.leave.memento) { t.found.push({ memento: b.leave.memento, line: b.leave.line, who: k }); }
      }
    }
    for (k in t.absent) { s.reg[k].beats.push(t.absent[k]); s.seen[t.absent[k]] = s.day; var ab = St.regs[k].beatById[t.absent[k]]; if (ab) Cond.apply(s, ab.fx); }
    for (k in res.sold) st.sold[k] = (st.sold[k] || 0) + res.sold[k];
    for (k in res.cooked) { st.cooked[k] = (st.cooked[k] || 0) + res.cooked[k]; var stn = D.byId[k].st; st.st[stn] = (st.st[stn] || 0) + res.cooked[k]; }
    st.served += res.served; st.delighted += res.delighted; st.fine += res.fine; st.meh += res.meh; st.walked += res.walked; st.balked += res.balked; st.tips += res.tips; st.wasted += res.wasted || 0;
    st.qSum += res.qSum; st.qN += res.qN;
    st.priceDays[p.price]++; st.matDays[p.mat]++;
    if (p.post) st.slipDays++;
    if (usesOil(s)) { st.oilDays++; if (t.oilAge <= 1) st.freshDays++; if (t.oilAge >= 3) st.oldOilDays++; }
    var net = res.revenue + res.tips - t.cost.total - fixed + (t.pre ? t.pre.rev : 0);
    st.bestDay = Math.max(st.bestDay, net);
    var rec = { day: s.day, weather: t.weather, rev: res.revenue, tips: res.tips, goods: t.cost.goods, oil: t.cost.oil, fixed: fixed, net: net, rent: 0, served: res.served, walked: res.walked, balked: res.balked, soldout: res.soldout || 0,
      delighted: res.delighted, fine: res.fine, meh: res.meh, q: res.qN ? res.qSum / res.qN : 0.7, wait: res.waitN ? res.waitSum / res.waitN : 0.3, price: p.price, mat: p.mat, oilAge: t.oilAge, post: !!p.post,
      sold: res.sold, want: res.want || res.sold, left: res.leftovers || {}, leftover: res.leftover || 0, wasted: res.wasted || 0, rep: s.rep, repD: rd, burn: s.burn, cash: s.cash, credit: res.creditSum || 0, quotes: res.quotes || [], pre: t.pre || null, pantry: t.cost.pantry || 0 };
    s.hist.push(rec);
    if (res.log && res.log.length) addLog(s, '早市', res.log);
    if (s.burn >= 100 && !s.crisis) s.crisis = 'pending';
    if (s.day === s.days || s.early) setEndFlag(s);
    t.closeList = closeList(s, res);
    s.phase = 'close';
    return rec;
  }
  function closedDay(s) {
    var fixed = C.utilities + (s.helper ? C.helperWage : 0);
    s.cash -= fixed; s.burn = clamp(s.burn - 3, 0, 100);
    s.today.cost = { goods: 0, oil: 0, total: 0, lines: [] };
    s.hist.push({ day: s.day, weather: s.today.weather, rev: 0, tips: 0, goods: 0, oil: 0, fixed: fixed, net: -fixed, rent: 0, served: 0, walked: 0, balked: 0, soldout: 0, delighted: 0, fine: 0, meh: 0, q: 0.7, wait: 0.3, price: s.plan.price, mat: s.plan.mat, oilAge: 0, post: false, sold: {}, want: {}, left: {}, leftover: 0, wasted: 0, rep: s.rep, repD: 0, burn: s.burn, cash: s.cash, closed: true, quotes: [] });
    s.oil.age = 0; s.oil.bulk = false;
    s.today.closeList = [];
    s.phase = 'night';
  }
  function closeList(s, res) {
    var t = s.today, out = [], m = St.mainBy[s.day + '/close'];
    if (s.crisis === 'pending') out.push('crisis');
    if (m && Cond.check(s, m.need)) out.push(m.id);
    if (out.length < 2) {
      for (var k in res.regs) { var o = res.regs[k], b = o.beat ? St.regs[k].beatById[o.beat] : null; if (b && b.after && St.scenes[b.after] && out.length < 2 && o.outcome !== 'walk') out.push(b.after); }
    }
    if (!out.length && t.closeEvent && Cond.check(s, St.scenes[t.closeEvent].need)) out.push(t.closeEvent);
    return out;
  }
  function addLog(s, title, lines) { s.log.push({ day: s.day, title: title, lines: lines.slice(0, 40) }); if (s.log.length > 90) s.log.splice(0, s.log.length - 90); }
  function sceneDone(s, id, lines) { s.seen[id] = s.day; var sc = St.scenes[id]; if (lines && lines.length) addLog(s, sc ? sc.title : id, lines); }
  function toNight(s) { s.phase = 'night'; }
  function toTown(s) { s.phase = s.day >= 3 && s.day < s.days && !s.early && !s.today.closed && !(s.today.town && s.today.town.over) ? 'town' : 'night'; }
  function canBuy(s, id) { var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; return !!u && !s.upg[id] && s.day >= u.day && s.cash >= u.cost; }
  function buy(s, id) { if (!canBuy(s, id)) return false; var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; s.cash -= u.cost; s.upg[id] = s.day; s.flags[id] = s.day; if (s.hist.length) s.hist[s.hist.length - 1].bought = (s.hist[s.hist.length - 1].bought || []).concat([id]); return true; }
  function rentDue(s) { return s.day % 7 === 0 && s.day < s.days; }
  function nextDay(s) {
    var rec = s.hist[s.hist.length - 1];
    if (rentDue(s)) { s.cash -= C.rentWeekly; if (rec) rec.rent = C.rentWeekly; if (s.cash < 0) s.flags.rent_late = s.day; }
    if (s.day >= s.days && s.owe) { s.cash -= s.owe; s.owe = 0; }
    s.negDays = s.cash < 0 ? s.negDays + 1 : 0;
    if (s.negDays >= 4 || (s.negDays >= 3 && s.rescueUsed)) s.early = 'bankrupt';
    if (s.day >= s.days || s.early) { s.ending = ending(s); s.phase = 'ended'; return s; }
    s.day++;
    beginDay(s);
    return s;
  }
  function stats(s) {
    var st = s.stats, days = Math.max(1, st.priceDays[0] + st.priceDays[1] + st.priceDays[2]), affs = Cast.regIds.map(function (id) { return s.reg[id].aff; });
    return { days: days, cheap: st.priceDays[0] / days, high: st.priceDays[2] / days, affSum: affs.reduce(function (a, b) { return a + b; }, 0), deep: affs.filter(function (a) { return a >= 7; }).length, close: affs.filter(function (a) { return a >= 5; }).length,
      q: st.qN ? st.qSum / st.qN : 0.7, fresh: st.oilDays ? st.freshDays / st.oilDays : 1, slip: st.slipDays };
  }
  function ending(s) {
    var f = s.flags, m = stats(s);
    if (s.early === 'bankrupt' || f.left || !s.depositPaid) return (s.rep >= 55 || m.affSum >= 26) ? 'E_FAREWELL' : 'E_TRANSFER';
    if (f.crisis_hold || s.burn >= 70) return 'E_PILLS';
    if (f.crisis_rectify || f.crisis_refund) return (s.burn < 50 && s.rep >= 42) ? 'E_REOPEN' : 'E_SOMEONE';
    var good2 = s.stats.matDays[2] / m.days;
    var honest = s.burn <= 20 && s.rep >= 76 && m.q >= 0.8 && (m.slip >= 6 || (m.fresh >= 0.85 && good2 >= 0.4)) && !f.powder_hidden && !f.cheap_mutton;
    var canteen = m.cheap >= 0.42 && s.rep >= 56 && (m.affSum >= 26 || f.chipin);
    var priv = m.high >= 0.42 && m.deep >= 3 && s.rep >= 52;
    if (honest && m.slip >= 6) return 'E_HONEST';
    if (priv) return 'E_PRIVATE';
    if (canteen) return 'E_CANTEEN';
    if (honest) return 'E_HONEST';
    return 'E_SOMEONE';
  }
  function setEndFlag(s) {
    St.endIds.forEach(function (id) { delete s.flags['end_' + id.slice(2)]; });
    var save = s.early; if (s.day < s.days && !s.early) return;
    s.flags['end_' + ending(s).slice(2)] = s.day; s.early = save;
  }
  function best(s) { var b = null, v = -1; Cast.regIds.forEach(function (id) { if (s.reg[id].met && s.reg[id].aff > v) { v = s.reg[id].aff; b = id; } }); return b || 'zhao'; }
  function epilogue(s) {
    var out = { echoes: [], people: [] }, h = Cond.read(s);
    St.echoes.forEach(function (e) { if (out.echoes.length < 4 && Cond.check(s, e.need, h)) out.echoes.push(e.text); });
    Cast.regIds.forEach(function (id) {
      if (!s.reg[id].met) return;
      var list = St.regs[id].epilogue;
      for (var i = 0; i < list.length; i++) if (Cond.check(s, list[i].need, h)) { out.people.push({ id: id, text: list[i].text, aff: s.reg[id].aff }); break; }
    });
    out.people.sort(function (a, b) { return b.aff - a.aff; });
    return out;
  }
  function newLegacy() { return { v: 2, runs: 0, endings: {}, signs: [], heirlooms: ['H_APRON'], mementos: {}, facts: {}, best: { cash: 0, served: 0 } }; }
  function record(L, s) {
    L = JSON.parse(JSON.stringify(L || newLegacy()));
    L.runs++; L.endings[s.ending] = (L.endings[s.ending] || 0) + 1; L.lastSign = St.endings[s.ending].sign || '';
    L.signs.push({ gen: s.gen, ending: s.ending, sign: St.endings[s.ending].sign, cash: s.cash, served: s.stats.served });
    if (L.signs.length > 12) L.signs.shift();
    s.mementos.forEach(function (m) { L.mementos[m.id] = 1; });
    Cast.regIds.forEach(function (id) { s.reg[id].facts.forEach(function (f) { L.facts[id + '/' + f] = 1; }); });
    function grant(id) { if (L.heirlooms.indexOf(id) < 0) L.heirlooms.push(id); }
    if (s.mementos.some(function (m) { return m.id === 'm_recipe' || m.id === 'm_heyi_note'; })) grant('H_NOTE');
    if (s.reg.gong.aff >= 6) grant('H_MUG');
    if (s.flags.man_curtain || s.reg.man.aff >= 7) grant('H_CURTAIN');
    if (s.cash >= 150000) grant('H_TIN');
    L.best.cash = Math.max(L.best.cash, s.cash); L.best.served = Math.max(L.best.served, s.stats.served);
    L.lastSign = St.endings[s.ending].sign;
    return L;
  }
  return {
    SCHEMA: SCHEMA, create: create, beginDay: beginDay, openShop: openShop, buildService: buildService, finishService: finishService, closedDay: closedDay, sceneDone: sceneDone, toNight: toNight, toTown: toTown, nextDay: nextDay,
    price: price, unitCost: unitCost, available: available, menuChoices: menuChoices, setsOn: setsOn, usesOil: usesOil, stationsToday: stationsToday, hotCount: hotCount, skillLv: skillLv, features: features,
    planCost: planCost, setMenu: setMenu, whyNot: whyNot, suggest: suggest, setStock: setStock, setMat: setMat, canBuy: canBuy, buy: buy, rentDue: rentDue,
    satisfaction: satisfaction, grade: grade, expand: expand, parseItem: parseItem, ending: ending, stats: stats, best: best, epilogue: epilogue, addLog: addLog, costUpNow: costUpNow,
    newLegacy: newLegacy, record: record
  };
});
;
/* core/save.js */
BSX.define('core/save', function (require) {
  var Run = require('core/run');
  var KEYS = { run: 'bsx.run.v4', runBak: 'bsx.run.v4.bak', legacy: 'bsx.legacy.v2', legacyBak: 'bsx.legacy.v2.bak', settings: 'bsx.settings.v2', old: ['bsx-seven-day-v1', 'bsx-seven-day-v1-backup', 'bsx.run.v2', 'bsx.run.v3'] };
  function checksum(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function wrap(obj) { var body = JSON.stringify(obj); return JSON.stringify({ c: checksum(body), b: body, at: Date.now() }); }
  function unwrap(str) {
    if (!str) return { ok: false, reason: 'empty' };
    try { var w = JSON.parse(str); if (!w || typeof w.b !== 'string') return { ok: false, reason: 'format' }; if (checksum(w.b) !== w.c) return { ok: false, reason: 'checksum' }; return { ok: true, data: JSON.parse(w.b), at: w.at }; }
    catch (e) { return { ok: false, reason: 'parse' }; }
  }
  function validRun(s) {
    return !!s && s.schema === Run.SCHEMA && Number.isInteger(s.day) && s.day >= 1 && s.day <= s.days &&
      ['prep', 'service', 'close', 'town', 'night', 'ended'].indexOf(s.phase) >= 0 &&
      ['cash', 'rep', 'burn', 'rng'].every(function (k) { return typeof s[k] === 'number' && isFinite(s[k]); }) &&
      !!s.plan && Array.isArray(s.plan.menu) && s.plan.menu.length > 0 && !!s.today && Array.isArray(s.hist) && !!s.reg && !!s.stats;
  }
  function migrate(s) { return s; }
  function Store(storage) { this.st = storage; this.notice = null; }
  Store.prototype.saveRun = function (s) {
    var str = wrap(s);
    var prev = this.st.get(KEYS.run);
    try { if (prev) this.st.set(KEYS.runBak, prev); this.st.set(KEYS.run, str); return true; }
    catch (e) { this.notice = '存档写入失败：设备空间可能不足'; return false; }
  };
  Store.prototype.loadRun = function () {
    var a = unwrap(this.st.get(KEYS.run));
    if (a.ok) { var s = migrate(a.data); if (validRun(s)) return { state: s, from: 'main' }; }
    var b = unwrap(this.st.get(KEYS.runBak));
    if (b.ok) { var s2 = migrate(b.data); if (validRun(s2)) { this.notice = '主存档损坏，已从备份恢复（' + a.reason + '）'; return { state: s2, from: 'backup' }; } }
    var hadOld = KEYS.old.some(function (k) { return !!this.st.get(k); }, this);
    if (hadOld) this.notice = '检测到旧版本的存档。小馆重新装修过，旧档没法沿用（已保留，不会删除）。';
    else if (this.st.get(KEYS.run)) this.notice = '存档损坏且没有可用备份，请开始新的一局。';
    return null;
  };
  Store.prototype.hasRun = function () { var r = this.loadRun(); return !!(r && r.state.phase !== 'ended'); };
  Store.prototype.clearRun = function () { this.st.remove(KEYS.run); this.st.remove(KEYS.runBak); };
  Store.prototype.saveLegacy = function (l) { var prev = this.st.get(KEYS.legacy); try { if (prev) this.st.set(KEYS.legacyBak, prev); this.st.set(KEYS.legacy, wrap(l)); return true; } catch (e) { this.notice = '店史写入失败'; return false; } };
  Store.prototype.loadLegacy = function () {
    var a = unwrap(this.st.get(KEYS.legacy)); if (a.ok) return a.data;
    var b = unwrap(this.st.get(KEYS.legacyBak)); if (b.ok) { this.notice = '店史主档损坏，已从备份恢复'; return b.data; }
    return null;
  };
  Store.prototype.saveSettings = function (o) { try { this.st.set(KEYS.settings, JSON.stringify(o)); } catch (e) {} };
  Store.prototype.loadSettings = function () { try { return JSON.parse(this.st.get(KEYS.settings) || 'null'); } catch (e) { return null; } };
  function memoryStorage() { var m = {}; return { get: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, set: function (k, v) { m[k] = String(v); }, remove: function (k) { delete m[k]; }, _m: m }; }
  return { Store: Store, KEYS: KEYS, wrap: wrap, unwrap: unwrap, validRun: validRun, memoryStorage: memoryStorage };
});
;
/* core/sim.js */
BSX.define('core/sim', function (require) {
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var R = require('core/rng');
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function scene(s, id, choose) {
    var sc = Story.scenes[id]; if (!sc) return;
    var lines = [];
    (function walk(beats) {
      (beats || []).forEach(function (b) {
        if (Array.isArray(b)) { lines.push(b); return; }
        if (b.fx) Cond.apply(s, b.fx);
        if (b.if) walk(Cond.check(s, b.if) ? b.then : b.else);
        if (b.choice) {
          var ok = b.choice.map(function (c, i) { return { c: c, i: i, ok: Cond.check(s, c.need) }; }).filter(function (o) { return o.ok; });
          if (!ok.length) ok = [{ c: b.choice[b.choice.length - 1], i: b.choice.length - 1 }];
          var pick = choose ? choose(id, ok.map(function (o) { return o.c; }), s) : 0, o = ok[clamp(pick || 0, 0, ok.length - 1)];
          lines.push(['choice', o.c.label]); Cond.apply(s, o.c.fx); walk(o.c.then);
        }
      });
    })(sc.beats);
    Run.sceneDone(s, id, lines);
  }
  function priceOf(s, lines) {
    var sum = 0, sets = {};
    lines.forEach(function (l) { if (!l.got) return; if (l.set) sets[l.set] = (sets[l.set] || 0) + 1; sum += Run.price(s, l.gave); });
    for (var k in sets) { var n = Math.floor(sets[k] / D.byId[k].set.length); if (n > 0) { var parts = 0; D.byId[k].set.forEach(function (p) { parts += Run.price(s, p); }); sum -= n * (parts - Run.price(s, k)); } }
    return sum;
  }
  function service(s, plan, prof) {
    var h = { rng: (plan.seed ^ 0x51ed) >>> 0 }, res = { revenue: 0, tips: 0, served: 0, walked: 0, balked: 0, soldout: 0, delighted: 0, fine: 0, meh: 0, qSum: 0, qN: 0, waitSum: 0, waitN: 0, sold: {}, cooked: {}, want: {}, wasted: 0, burnAdd: 0, regs: {}, log: [], quotes: [], creditSum: 0 };
    var stock = {}, k; s.plan.menu.forEach(function (id) { stock[id] = s.plan.stock[id] || 0; });
    var queue = [], counter = [], ai = 0, t = 0, dt = 0.25, work = 0, arr = plan.arrivals, treat = false;
    var rate = prof.rate * (s.helper ? 1.18 : 1) * (1 + 0.04 * (Run.skillLv(s, 'fryer') + Run.skillLv(s, 'pot')));
    function pickDish(l) { if (l.d) return s.plan.menu.indexOf(l.d) >= 0 && stock[l.d] > 0 ? l.d : null; var c = s.plan.menu.filter(function (id) { return D.byId[id].tags.indexOf(l.wish) >= 0 && stock[id] > 0; }); return c[0] || null; }
    function open(c) { return c.lines.filter(function (l) { return !l.got && !l.dead; }); }
    function finish(c, timedOut) {
      var got = c.lines.filter(function (l) { return l.got; }), dead = c.lines.filter(function (l) { return l.dead; }).length, r = c.kind === 'reg' ? res.regs[c.id] : null;
      counter.splice(counter.indexOf(c), 1);
      if (c.peek) { r.outcome = 'peek'; r.chat = R.rand(h) < prof.chat; return; }
      if (!got.length) { if (timedOut) { res.walked++; if (r) r.outcome = 'walk'; res.waitSum += 1; res.waitN++; } else { res.soldout++; if (r) r.outcome = 'soldout'; } return; }
      var qa = 0; got.forEach(function (l) { qa += l.q; res.sold[l.gave] = (res.sold[l.gave] || 0) + 1; }); qa /= got.length;
      var wf = clamp(c.wait / c.pmax, 0, 1), remembered = c.hide && c.kind === 'reg' && !c.asked && !timedOut && !dead;
      var sat = Run.satisfaction(qa, wf, remembered ? 0.04 : 0) - dead * 0.07 - (timedOut ? 0.22 : 0) - (c.lines.length - got.length - dead) * 0.1 + (c.treated ? 0.1 : 0), g = Run.grade(sat);
      res.served++; res.waitSum += wf; res.waitN++;
      if (g === 'delight') res.delighted++; else if (g === 'fine') res.fine++; else res.meh++;
      var pay = priceOf(s, c.lines), tip = 0;
      if (c.treated) pay = 0;
      if (g === 'delight' && !c.treated && R.rand(h) < c.tip * 0.6) tip = C.tip.delight;
      if (r) { r.outcome = g; r.remembered = remembered; r.asked = c.asked; r.chat = !!c.chat && R.rand(h) < prof.chat; }
      if (c.act === 'credit') { r.credit = pay; res.creditSum += pay; pay = 0; tip = 0; }
      else if (c.act === 'repay') { pay += s.credit[c.id] || 0; r.repaid = true; }
      else if (c.act === 'treat') { pay *= 2; treat = true; }
      else if (c.act === 'overpay' && pay > 0) { if (prof.returnExtra) r.extra = 'returned'; else { r.extra = 'kept'; pay += Math.min(pay, 400); } }
      res.revenue += pay; res.tips += tip;
    }
    while (t < plan.len + 240) {
      t += dt;
      while (ai < arr.length && (arr[ai].t <= t || (t > plan.len + 2 && !counter.length && !queue.length))) { var a = arr[ai++], reg = a.kind === 'reg' ? Story.regs[a.id] : null, beat = reg && a.beat ? reg.beatById[a.beat] : null; queue.push({ kind: a.kind, id: a.id, hide: a.hide, tip: a.tip || 0.5, patience: a.patience, pmax: a.patience, wait: 0, qp: 40 + (s.day <= 2 ? 40 : 0), lines: a.order.map(function (o) { return { d: o.d || null, wish: o.wish || null, mod: o.mod, set: o.set, got: false, dead: false }; }), act: beat ? beat.act : null, peek: beat && beat.act === 'peek', chat: beat && beat.say && beat.say.chat, beat: beat, st: 0 }); }
      while (counter.length < plan.slots && queue.length) {
        var c = queue.shift(); counter.push(c);
        if (c.kind === 'reg') res.regs[c.id] = { outcome: null, beat: c.beat ? c.beat.id : null };
        c.lines.forEach(function (l) { if (l.d) res.want[l.d] = (res.want[l.d] || 0) + 1; if (!pickDish(l)) l.dead = true; });
        if (treat && c.kind === 'walk') { treat = false; c.treated = true; }
        if (c.hide && c.kind === 'reg' && !s.reg[c.id].usual && R.rand(h) > prof.remember) c.asked = true;
        if (!c.peek && !open(c).length && c.kind === 'reg') { var alt = Story.regs[c.id].likes.filter(function (tg) { return pickDish({ wish: tg }); })[0]; if (alt) { c.lines.push({ d: null, wish: alt, got: false, dead: false }); c.hide = false; } }
        if (!c.peek && !open(c).length) finish(c, false);
      }
      for (k = queue.length - 1; k >= 0; k--) { queue[k].qp -= dt; if (queue[k].qp <= 0) { var q = queue.splice(k, 1)[0]; res.balked++; if (q.kind === 'reg') res.regs[q.id] = { outcome: 'walk', beat: null }; } }
      work += rate * dt;
      var guard = 0;
      while (work >= 1 && guard++ < 6) {
        var cands = counter.filter(function (c) { return !c.peek && open(c).some(function (l) { return pickDish(l); }); }).sort(function (a, b) { return a.patience / a.pmax - b.patience / b.pmax; });
        if (!cands.length) { work = Math.min(work, 1.5); break; }
        var cc = cands[0], l = open(cc).filter(function (x) { return pickDish(x); })[0], dish = pickDish(l), d = D.byId[dish];
        stock[dish]--; res.cooked[dish] = (res.cooked[dish] || 0) + 1;
        var qv = clamp(prof.q + (R.rand(h) - 0.5) * (prof.qVar || 0.2) + C.matQ[s.plan.mat] + (s.today.pantryQ || 0) + (d.oil ? C.oilQ(s.oil.age) : 0) - (l.mod ? (1 - prof.q) * 0.5 : 0), 0.2, 1);
        if (d.cook && R.rand(h) < (1 - prof.q) * 0.25) { res.wasted++; work -= d.cook ? 1.15 : 0.8; continue; }
        l.got = true; l.q = qv; l.gave = dish; res.qSum += qv; res.qN++;
        if (d.oil) res.burnAdd += C.oilBurn(s.oil.age, s.oil.bulk);
        work -= d.cook ? 1.15 : 0.8;
        if (!open(cc).length) finish(cc, false);
      }
      counter.slice().forEach(function (c) {
        c.st += dt; c.patience -= dt; c.wait += dt;
        if (c.peek) { if (c.st > 5) finish(c, false); return; }
        open(c).forEach(function (l) { if (!pickDish(l)) l.dead = true; });
        if (!open(c).length) finish(c, false); else if (c.patience <= 0) finish(c, true);
      });
      if (t >= plan.len && ai >= arr.length && !queue.length && !counter.length) break;
    }
    var left = {}, n = 0; for (k in stock) if (stock[k] > 0) { left[k] = stock[k]; n += stock[k]; }
    res.leftovers = left; res.leftover = n;
    return res;
  }
  function prep(s, pol) {
    var p = s.plan, f = Run.features(s);
    if (f.mat && pol.mat != null) Run.setMat(s, Math.min(pol.mat, f.mat2 ? 2 : 1));
    if (f.price && pol.price != null) p.price = pol.price;
    if (f.post) p.post = !!pol.post;
    if (f.menu) {
      var want = pol.menu ? pol.menu(s) : null;
      if (!want) { want = Run.menuChoices(s).slice().sort(function (a, b) { return (b.price - b.cost) * b.pop - (a.price - a.cost) * a.pop; }).map(function (d) { return d.id; }); ['congee', 'youtiao', 'soy'].forEach(function (id) { want.splice(want.indexOf(id), 1); want.unshift(id); }); }
      p.menu.slice().forEach(function (id) { if (want.indexOf(id) < 0 || want.indexOf(id) >= C.menuMax(s)) Run.setMenu(s, id, false); });
      want.forEach(function (id) { if (p.menu.indexOf(id) < 0) Run.setMenu(s, id, true); });
    }
    p.menu.forEach(function (id) { Run.setStock(s, id, Math.round(Run.suggest(s, id) * (pol.stockMul || 1))); });
    if (f.oil && Run.usesOil(s)) p.oil = pol.oil ? pol.oil(s) : (s.oil.age >= 2 ? 'new' : 'keep');
  }
  function day(s, pol) {
    var t = s.today;
    if (t.closed) { Run.closedDay(s); }
    else {
      if (t.open && !t.openDone) { scene(s, t.open, pol.choose); t.openDone = true; }
      if (s.day > 1) prep(s, pol);
      Run.openShop(s);
      var plan = Run.buildService(s), res = service(s, plan, pol.skill);
      Run.finishService(s, res);
      (t.found || []).forEach(function (f) { Cond.apply(s, { memento: f.memento }); });
      (t.closeList || []).forEach(function (id) { scene(s, id, pol.choose); });
      if (pol.town && require('core/town').ok(s)) require('core/town').auto(s, pol.town(s));
      Run.toNight(s);
    }
    if (pol.buy) pol.buy.forEach(function (id) { if (Run.canBuy(s, id) && (pol.reckless || s.cash - 40000 > (Cast.upgrades.filter(function (u) { return u.id === id; })[0].cost))) Run.buy(s, id); });
    Run.nextDay(s);
    return s;
  }
  function month(s, pol, untilDay) { var guard = 0; while (s.phase !== 'ended' && guard++ < 40 && (!untilDay || s.day < untilDay)) day(s, pol); return s; }
  function byLabel() { var res = [].slice.call(arguments); return function (id, opts) { for (var k = 0; k < res.length; k++) for (var i = 0; i < opts.length; i++) if (res[k].test(opts[i].label)) return i; return 0; }; }
  var SK = { ok: { rate: 0.34, q: 0.8, qVar: 0.24, chat: 0.5, remember: 0.6, returnExtra: true }, good: { rate: 0.44, q: 0.92, qVar: 0.14, chat: 0.85, remember: 0.9, returnExtra: true }, sloppy: { rate: 0.4, q: 0.62, qVar: 0.3, chat: 0.1, remember: 0.2, returnExtra: false }, slow: { rate: 0.24, q: 0.78, qVar: 0.24, chat: 0.4, remember: 0.5, returnExtra: true } };
  var RENEW = [/续租/, /凑/];
  function pol(o, pats) { o.choose = byLabel.apply(null, pats); return o; }
  var policies = {
    average: pol({ skill: SK.ok, price: 1, mat: 1, buy: ['shelf', 'burner'] }, RENEW.concat([/照常|照价|只要有票|自己扛|等修完|接十五|再等等|正规|回收站|自己当/])),
    honest: pol({ skill: SK.good, price: 2, mat: 2, post: true, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['hood', 'shelf', 'burner'] }, RENEW.concat([/拒绝|只要有票|贴出|认了|公开|整改|先问|回收站|照价|不拍|买桶装|自己扛|等修完|明早来|留给/])),
    canteen: pol({ skill: SK.good, price: 0, mat: 1, stockMul: 1.15, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['bigpot', 'awning', 'shelf', 'burner'] }, RENEW.concat([/自己扛|加量|不收钱|留给|全接|明早来|先问|只收皮|只要有票|拒绝|回收站/])),
    private_: pol({ skill: SK.good, price: 2, mat: 2, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['shelf', 'burner', 'hood'] }, RENEW.concat([/只要有票|拒绝|涨价|照价|不接|不拍|回收站|照牌价/])),
    cheapskate: pol({ skill: SK.sloppy, price: 0, mat: 0, oil: function (s) { return s.oil.age >= 6 ? 'bulk' : 'keep'; }, buy: ['fryer'] }, RENEW.concat([/收下|别声张|卖给|换老胡|新米|不理|退赔|照常|烧开/])),
    pills: pol({ skill: { rate: 0.46, q: 0.9, qVar: 0.14, chat: 0.1, remember: 0.3, returnExtra: false }, price: 1, mat: 0, oil: function (s) { return s.oil.age >= 7 ? 'bulk' : 'keep'; }, buy: ['fryer'] }, RENEW.concat([/收下|别声张|卖给|换老胡|新米|不理|硬撑|照常|烧开/])),
    reopen: pol({ skill: SK.ok, price: 1, mat: 0, oil: function (s) { return s.crisis && s.crisis !== 'pending' ? (s.oil.age >= 2 ? 'new' : 'keep') : 'keep'; }, buy: [] }, RENEW.concat([/收下|别声张|卖给|换老胡|整改|认了|公开/])),
    leave: pol({ skill: SK.good, price: 1, mat: 1, buy: ['shelf'] }, [/不签/]),
    broke: pol({ skill: SK.slow, price: 2, mat: 2, stockMul: 2.2, oil: function () { return 'new'; }, buy: ['burner', 'hood', 'shelf', 'bigpot', 'awning', 'fryer', 'board'], reckless: true }, [/不签|免单|自己扛|不收钱|买桶装|再撑/])
  };
  return { scene: scene, service: service, prep: prep, day: day, month: month, policies: policies, SK: SK, byLabel: byLabel };
});
;
/* core/town.js */
BSX.define('core/town', function (require) {
  var R = require('core/rng');
  var D = require('content/dishes');
  var Cond = require('core/cond');
  var Run = require('core/run');
  var Tn = require('content/town');
  var Cast = require('content/cast');
  var C = require('content/config');
  var START = 13 * 60, END = 19 * 60 + 30;
  var COST = { wait: 30, scene: 40, talk: 15, idle: 20, market: 60, depot: 30, bridge: 30, practice: 60 };
  function rng(s, salt) { return { rng: R.hashSeed((s.seed ^ Math.imul(s.day + 1, 7919) ^ salt) >>> 0) }; }
  function ok(s) { return s.day >= 3 && s.day < s.days && !s.early && !(s.today && s.today.closed); }
  function place(id) { return Tn.places.filter(function (p) { return p.id === id; })[0]; }
  function ensure(s) {
    var t = s.today.town;
    if (!t || t.clock == null) t = s.today.town = { clock: START, at: 'shop', did: {}, talk: {}, over: false, log: [] };
    return t;
  }
  function clockText(m) { var h = Math.floor(m / 60), mm = Math.round(m % 60); return h + ':' + (mm < 10 ? '0' : '') + mm; }
  function left(s) { return Math.max(0, END - ensure(s).clock); }
  function spend(s, mins) { var t = ensure(s); t.clock = Math.min(END, t.clock + mins); return t.clock; }
  function travelMins(from, to) {
    var a = place(from), b = place(to); if (!a || !b || from === to) return 0;
    if (b.bus) return b.bus; if (a.bus) return a.bus;
    return Math.round(5 + Math.hypot(a.x - b.x, a.y - b.y) / 14);
  }
  function isOpenAt(p, m) { return (p.open == null || m >= p.open * 60) && (p.close == null || m < p.close * 60); }
  function whyNot(s, id) {
    var t = ensure(s), p = place(id); if (!p) return '没有这个地方';
    if (p.lock && !s.flags[p.lock]) return '还不知道在哪';
    if (id === t.at) return '';
    var arrive = t.clock + travelMins(t.at, id);
    if (arrive > END) return '走到天就黑了';
    if (p.close != null && arrive >= p.close * 60) return '到了也收摊了';
    if (p.open != null && arrive < p.open * 60) return p.open + ' 点以后才开';
    return '';
  }
  function travel(s, id) { var t = ensure(s), w = whyNot(s, id); if (w) return w; spend(s, travelMins(t.at, id)); t.at = id; t.log.push(clockText(t.clock) + ' 到了' + place(id).name); return ''; }
  function where(s, id, m) {
    var list = Tn.schedule[id] || [], rain = s.today && s.today.weather === 'rain', h = m / 60;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.since && s.day < e.since) continue;
      if (e.until && s.day > e.until) continue;
      if (h >= e.from && h < e.to) return rain && e.rainAt ? e.rainAt : e.at;
    }
    return null;
  }
  function comingAt(s, pid, m) {
    if (m == null) m = ensure(s).clock;
    var rain = s.today && s.today.weather === 'rain', out = [];
    Cast.regIds.forEach(function (id) { if (!s.reg[id] || !s.reg[id].met || (s.today.absent && s.today.absent[id])) return; (Tn.schedule[id] || []).forEach(function (e) { if ((e.since && s.day < e.since) || (e.until && s.day > e.until)) return; var at = rain && e.rainAt ? e.rainAt : e.at; if (at === pid && e.from * 60 > m && e.from * 60 < END) out.push({ id: id, from: e.from }); }); });
    return out;
  }
  function presentAt(s, pid, m) {
    if (m == null) m = ensure(s).clock;
    return Cast.regIds.filter(function (id) { return s.reg[id] && s.reg[id].met && !(s.today.absent && s.today.absent[id]) && where(s, id, m) === pid; });
  }
  function expired(s, sc) { var ms = Tn.miss[sc.id]; return !!(ms && s.day > ms.until); }
  function nextVisit(s, id) {
    var v = Tn.visits[id]; if (!v || !s.reg[id] || !s.reg[id].met) return null;
    for (var i = 0; i < v.scenes.length; i++) { var sc = v.scenes[i]; if (s.seen[sc.id] || expired(s, sc)) continue; return Cond.check(s, sc.need) ? sc : null; }
    return null;
  }
  function visitable(s) { return Cast.regIds.filter(function (id) { return !!nextVisit(s, id); }).map(function (id) { return { id: id, scene: nextVisit(s, id), place: Tn.visits[id].place, at: Tn.sceneAt[id] }; }); }
  function eventsAt(s, pid, m) {
    if (m == null) m = ensure(s).clock;
    return visitable(s).filter(function (v) { return v.at === pid && where(s, v.id, m) === pid && m + COST.scene <= END + 15; });
  }
  function lots(s) {
    var h = rng(s, 0x5a17), out = [];
    ['hu', 'stall', 'qin'].forEach(function (sid) {
      var sel = Tn.sellers[sid], item = R.pick(h, sel.items), g = Tn.goods[item], bad = R.rand(h) < sel.bad;
      out.push({ seller: sid, item: item, bad: bad, v: g.v, price: Math.round(g.v * (bad ? 0.5 : 0.84) / 50) * 50, blank: Math.floor(R.rand(h) * 3) % 3 });
    });
    return out;
  }
  function clue(lot, tool) { var g = Tn.goods[lot.item]; return tool === lot.blank ? '看不出什么名堂。' : (lot.bad ? g.bad : g.good)[tool]; }
  function dishFor(s, o) { if (s.unlocked[o.dish]) return o.dish; if (o.alt && s.unlocked[o.alt]) return o.alt; return null; }
  function offers(s) {
    if (s.lastOrder && s.day - s.lastOrder < 3) return [];
    var h = rng(s, 0x0de7), list = Tn.orders.filter(function (o) { return Cond.check(s, o.need) && dishFor(s, o) && !(s.flags['o_' + o.id] && s.day - s.flags['o_' + o.id] < 6); });
    var out = [];
    while (list.length && out.length < 2) { var i = Math.floor(R.rand(h) * list.length) % list.length; out.push(list.splice(i, 1)[0]); }
    return out.map(function (o) { var d = dishFor(s, o); return { id: o.id, who: o.who, from: o.from, dish: d, n: o.n, unit: Math.round(Run.price(s, d) * o.unit * 0.75 / 10) * 10, line: o.line }; });
  }
  function actionsAt(s, pid) {
    var t = ensure(s), m = t.clock, out = [];
    function add(a) { if (!a.why && m + a.mins > END + 15) a.why = '天快黑了'; out.push(a); }
    eventsAt(s, pid, m).forEach(function (v) { add({ id: 'scene_' + v.scene.id, kind: 'scene', scene: v.scene.id, who: v.id, label: '「' + v.scene.title + '」', mins: COST.scene, star: true }); });
    if (pid === 'whole') add({ id: 'market', kind: 'market', label: '验货', mins: COST.market, biz: true, why: t.did.market ? '今天看过了' : s.day < 4 ? '第 4 天以后' : s.cash < 1500 ? '手头太紧' : '' });
    if (pid === 'depot' && s.day >= 5) { var of = offers(s); add({ id: 'depot', kind: 'depot', label: '问问明早的包餐', mins: COST.depot, biz: true, why: t.did.depot ? '今天问过了' : !of.length ? '今天没人订' : s.preorder ? '明早已经接了一单' : '' }); }
    if (pid === 'park') add({ id: 'bridge', kind: 'bridge', label: '打听明天的天气', mins: COST.bridge, why: t.did.bridge ? '今天问过了' : '' });
    if (pid === 'shop') add({ id: 'practice', kind: 'practice', label: '关起门练手', mins: COST.practice, why: t.did.practice ? '今天练过了' : '' });
    presentAt(s, pid, m).forEach(function (id) { add({ id: 'talk_' + id, kind: 'talk', who: id, label: '和' + Cast.regulars[id].name + '聊几句', mins: COST.talk, why: t.talk[id] ? '今天聊过了' : '' }); });
    if (Tn.idle[pid]) add({ id: 'idle_' + pid, kind: 'idle', label: '随便走走', mins: COST.idle, why: t.did['idle_' + pid] ? '刚走过' : '' });
    if (comingAt(s, pid).length) add({ id: 'wait', kind: 'wait', label: '在这儿等半个钟头', mins: COST.wait });
    return out;
  }
  function markers(s, pid) {
    var t = ensure(s), m = t.clock + travelMins(t.at, pid);
    var ev = eventsAt(s, pid, m).length > 0, ppl = presentAt(s, pid, m), biz = false;
    if (pid === 'whole' && !t.did.market && s.day >= 4 && s.cash >= 1500) biz = true;
    if (pid === 'depot' && !t.did.depot && s.day >= 5 && !s.preorder && offers(s).length) biz = true;
    return { event: ev, people: ppl, biz: biz };
  }
  function leads(s) {
    var t = ensure(s), out = [];
    visitable(s).forEach(function (v) {
      var sch = (Tn.schedule[v.id] || [])[0]; if (!sch || (sch.since && s.day < sch.since) || (sch.until && s.day > sch.until)) return;
      var at = s.today.weather === 'rain' && sch.rainAt ? sch.rainAt : sch.at;
      if (at !== v.at) return;
      if (sch.to * 60 <= t.clock) return;
      out.push({ text: Cast.regulars[v.id].name + ' ' + fmtH(sch.from) + '–' + fmtH(sch.to) + ' 在' + place(at).name + '，好像有话想说', at: at, star: true });
    });
    if (s.day >= 5 && !t.did.depot && !s.preorder && offers(s).length) out.push({ text: '7 路总站有人在问明早的包餐', at: 'depot' });
    if (s.day >= 4 && !t.did.market && s.cash >= 1500) out.push({ text: '批发市场下午有货，去晚了就收摊', at: 'whole' });
    if (!t.did.bridge && !(s.forecast && s.forecast.day === s.day + 1)) out.push({ text: '桥头下棋的老头们知道明天的天气', at: 'park' });
    if (!out.length) out.push({ text: '今天没什么非去不可的。随便走走也好。' });
    return out.slice(0, 4);
  }
  function fmtH(h) { return Math.floor(h) + (h % 1 ? ':30' : ''); }
  function doTalk(s, id) {
    var t = ensure(s); if (t.talk[id]) return null; t.talk[id] = 1; spend(s, COST.talk);
    s.reg[id].aff = Math.min(10, s.reg[id].aff + 0.15);
    var lines = Tn.talk[id] || ['……'], h = rng(s, 0x7a1c + id.length * 31);
    return R.pick(h, lines);
  }
  function doIdle(s, pid) {
    var t = ensure(s); t.did['idle_' + pid] = 1; spend(s, COST.idle);
    var h = rng(s, 0x1d1e + pid.length * 17); return R.pick(h, Tn.idle[pid] || ['……']);
  }
  function buy(s, ls, picks) {
    var p = { day: s.day + 1, credit: 0, q: 0, burn: 0, notes: [], spent: 0 };
    ls.forEach(function (l, i) {
      if (!picks[i]) return;
      var g = Tn.goods[l.item], sel = Tn.sellers[l.seller];
      p.spent += l.price; p.credit += l.v;
      if (l.bad) { p.q -= 0.05; p.burn += g.burn; p.notes.push(sel.name.replace(/的档口|的菜摊|里的散摊/, '') + '那里收的' + g.name.slice(1) + '，打开一看，不对劲。' + g.bad[0]); }
      else { p.q += 0.03; p.notes.push(sel.name.replace(/的档口|的菜摊|里的散摊/, '') + '那里收的' + g.name.slice(1) + '，是好货。'); }
    });
    s.cash -= p.spent;
    if (p.spent > 0) s.pantry = p;
    if (picks.some(function (x, i) { return x && ls[i].seller === 'qin'; }) && s.reg.qin) s.reg.qin.aff = Math.min(10, s.reg.qin.aff + 0.2);
    if (s.today.town) { s.today.town.did.market = 1; }
    return p;
  }
  function accept(s, o) {
    s.preorder = { day: s.day + 1, id: o.id, who: o.who, from: o.from, dish: o.dish, n: o.n, unit: o.unit };
    s.flags['o_' + o.id] = s.day; s.lastOrder = s.day;
    return s.preorder;
  }
  function bridge(s) {
    var d = s.day + 1, w = C.fixedWeather[d];
    if (!w) { var h = rng(s, 0xb81d), x = R.rand(h); w = x < C.weatherOdds.sun ? 'sun' : x < C.weatherOdds.sun + C.weatherOdds.cloud ? 'cloud' : 'rain'; }
    s.forecast = { day: d, w: w };
    if (s.today.town) s.today.town.did.bridge = 1;
    var h2 = rng(s, 0x71e5);
    return { w: w, text: R.pick(h2, Tn.forecast[w]), river: R.pick(h2, Tn.riverLines) };
  }
  function practice(s) {
    var best = null, n = -1;
    D.stationsFor(s.plan.menu).forEach(function (k) { if (k === 'side') return; var v = s.stats.st[k] || 0; if (v > n) { n = v; best = k; } });
    best = best || 'pot';
    s.stats.st[best] = (s.stats.st[best] || 0) + 8;
    if (s.today.town) s.today.town.did.practice = 1;
    return { st: best, name: D.stations[best] ? D.stations[best].name : best, lv: Run.skillLv(s, best) };
  }
  function done(s, kind) { var t = ensure(s); t.over = true; if (kind) t.last = kind; Run.toNight(s); }
  function missed(s) {
    var out = [];
    Object.keys(Tn.miss).forEach(function (sid) {
      var ms = Tn.miss[sid], sc = Tn.scenes[sid];
      if (!sc || s.seen[sid] || s.day !== ms.until + 1 || !s.reg[sc.who] || !s.reg[sc.who].met) return;
      var need = {}; for (var k in sc.need) if (k !== 'day') need[k] = sc.need[k];
      if (!Cond.check(s, need)) return;
      out.push({ text: ms.who + '：' + ms.line, kind: 'missed', from: sc.who });
    });
    return out;
  }
  function auto(s, kind) {
    if (!ok(s)) return null;
    ensure(s);
    if (kind === 'market') { var ls = lots(s); return buy(s, ls, ls.map(function (l) { return !l.bad; })); }
    if (kind === 'depot') { var of = offers(s); return of.length ? accept(s, of[0]) : null; }
    if (kind === 'bridge') return bridge(s);
    if (kind === 'visit') { var v = visitable(s)[0]; if (v) require('core/sim').scene(s, v.scene.id); return v; }
    return practice(s);
  }
  return { START: START, END: END, COST: COST, ok: ok, place: place, ensure: ensure, clockText: clockText, left: left, spend: spend, travelMins: travelMins, isOpenAt: isOpenAt, whyNot: whyNot, travel: travel,
    where: where, presentAt: presentAt, comingAt: comingAt, eventsAt: eventsAt, actionsAt: actionsAt, markers: markers, leads: leads, doTalk: doTalk, doIdle: doIdle,
    visitable: visitable, nextVisit: nextVisit, lots: lots, clue: clue, offers: offers, buy: buy, accept: accept, bridge: bridge, practice: practice, done: done, missed: missed, auto: auto };
});
;
/* game/assets.js */
BSX.define('game/assets', function (require) {
  var D = require('content/dishes');
  var A = { manifest: null, imgs: {}, entries: {}, errors: [], loaded: {}, groupState: {}, procCache: {}, P: null, base: 'assets/runtime/' };
  A.init = function (P, manifest) { A.P = P; A.manifest = manifest; manifest.entries.forEach(function (e) { A.entries[e.id] = e; }); };
  A.loadGroup = function (g, onProgress, done) {
    if (A.groupState[g] === 'done') return done && done();
    var list = A.manifest.entries.filter(function (e) { return e.group === g; });
    var left = list.length, n = 0;
    A.groupState[g] = 'loading';
    if (!left) { A.groupState[g] = 'done'; return done && done(); }
    list.forEach(function (e) {
      A.P.loadImage(A.base + e.path, function (err, img) {
        n++;
        if (err) { A.errors.push({ id: e.id, path: e.path, msg: String(err.message || err) }); A.imgs[e.id] = placeholder(e); }
        else A.imgs[e.id] = img;
        A.loaded[e.id] = true;
        onProgress && onProgress(n / list.length, e.id);
        if (--left === 0) { A.groupState[g] = 'done'; done && done(); }
      });
    });
  };
  function placeholder(e) {
    var c = A.P.createCanvas(e.w || 256, e.h || 256), x = c.getContext('2d');
    for (var i = 0; i < c.width; i += 32) for (var j = 0; j < c.height; j += 32) { x.fillStyle = ((i + j) / 32) % 2 ? '#ff00ff' : '#222'; x.fillRect(i, j, 32, 32); }
    x.fillStyle = '#fff'; x.font = 'bold 22px sans-serif'; x.fillText('缺图 ' + e.id, 10, 30);
    c.__placeholder = true; return c;
  }
  A.img = function (id) { var im = A.imgs[id]; if (!im && A.entries[id] && !A.loaded[id]) return null; return im || null; };
  A.ready = function (id) { return !!A.imgs[id]; };
  A.cell = function (ctx, id, idx, x, y, w, h, opts) {
    var e = A.entries[id], im = A.imgs[id];
    if (!e || !im) { if (e && !A.loaded[id]) return; ctx.fillStyle = 'rgba(255,0,255,.5)'; ctx.fillRect(x, y, w, h); return; }
    var cw = e.cellW, ch = e.cellH, cx = (idx % e.cols) * cw, cy = Math.floor(idx / e.cols) * ch;
    opts = opts || {};
    if (opts.trim && e.cellTrim) { var t = e.cellTrim[idx]; cx += t[0]; cy += t[1]; cw = t[2] - t[0]; ch = t[3] - t[1]; }
    if (opts.fit) { // 保持比例放进 w×h，底部对齐
      var s = Math.min(w / cw, h / ch), dw = cw * s, dh = ch * s;
      x += (w - dw) / 2; y += opts.anchor === 'center' ? (h - dh) / 2 : h - dh; w = dw; h = dh;
    }
    if (opts.flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, cx, cy, cw, ch, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(im, cx, cy, cw, ch, x, y, w, h);
  };
  A.sprite = function (ctx, id, cx, footY, h, opts) {
    var e = A.entries[id], im = A.imgs[id];
    opts = opts || {};
    if (!im && e && !A.loaded[id]) return;
    if (!im) { ctx.fillStyle = 'rgba(255,0,255,.6)'; ctx.fillRect(cx - h * 0.2, footY - h, h * 0.4, h); ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText('缺 ' + id, cx - h * 0.2, footY - h / 2); return; }
    var t = e.trim || [0, 0, im.width, im.height];
    var sh = t[3] - t[1], s = h / sh, sw = im.width * s;
    var x = cx - sw / 2, y = footY - (t[3]) * s;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    if (opts.flip) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }
    if (opts.squash) { ctx.translate(cx, footY); ctx.scale(1 + opts.squash, 1 - opts.squash); ctx.translate(-cx, -footY); }
    ctx.drawImage(im, 0, 0, im.width, im.height, x, y, sw, im.height * s);
    ctx.restore();
  };
  A.food = function (ctx, dishId, x, y, size, opts) {
    var d = D.byId[dishId]; if (!d) return;
    var ic = d.icon;
    opts = opts || {};
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    if (ic.cell != null) {
      A.cell(ctx, 'atlas_food', ic.cell, x, y, size, size, { trim: true, fit: true, anchor: 'center' });
      if (ic.tint) { ctx.globalCompositeOperation = 'source-atop'; }
      if (ic.tint) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= 0.28; ctx.fillStyle = ic.tint; ctx.beginPath(); ctx.ellipse(x + size / 2, y + size * 0.42, size * 0.3, size * 0.12, 0, 0, 7); ctx.fill(); ctx.globalAlpha /= 0.28; }
      if (ic.overlay === 'egg') drawEgg(ctx, x + size * 0.55, y + size * 0.38, size * 0.18);
      else if (typeof ic.overlay === 'number') A.cell(ctx, 'atlas_food', ic.overlay, x + size * 0.38, y - size * 0.05, size * 0.62, size * 0.62, { trim: true, fit: true, anchor: 'center' });
    } else proc(ctx, ic.proc, x, y, size);
    ctx.restore();
  };
  function drawEgg(ctx, cx, cy, r) {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.25, r, 0.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke();
    ctx.fillStyle = '#f5b423'; ctx.beginPath(); ctx.arc(cx + r * 0.1, cy - r * 0.05, r * 0.45, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(cx - r * 0.1, cy - r * 0.3, r * 0.18, r * 0.12);
  }
  function plate(ctx, cx, cy, r) {
    ctx.fillStyle = '#e9f0ea'; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3d7d72'; ctx.lineWidth = Math.max(2, r * 0.07); ctx.stroke();
    ctx.strokeStyle = '#2d4b45'; ctx.lineWidth = Math.max(1, r * 0.03); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.05, r * 1.02, r * 0.66, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  function proc(ctx, kind, x, y, s) {
    var key = kind + '@' + Math.round(s);
    var c = A.procCache[key];
    if (!c) {
      var lo = 32; c = A.P.createCanvas(lo, lo); var g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      var cx = 16, cy = 18;
      plate(g, cx, cy, 13);
      if (kind === 'egg') drawEgg(g, cx, cy - 1, 7);
      if (kind === 'rice') { g.fillStyle = '#f7e7b0'; g.beginPath(); g.ellipse(cx, cy - 2, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = '#f2c94c'; [[-4, -3], [3, -4], [0, 0], [5, 0], [-6, 0], [2, -6]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 2, 2); }); g.fillStyle = '#5aa04a'; [[-2, -5], [4, -2], [-5, -2]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 2, 1); }); }
      if (kind === 'balls') { [[-5, -2], [0, -4], [5, -2], [-2, 1], [3, 1]].forEach(function (p) { g.fillStyle = '#b5651d'; g.beginPath(); g.arc(cx + p[0], cy + p[1], 3.4, 0, 7); g.fill(); g.fillStyle = '#e8a54b'; g.fillRect(cx + p[0] - 1, cy + p[1] - 2, 2, 1); }); g.fillStyle = '#fff'; [[-3, -6], [6, -5], [1, 2]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 1, 1); }); }
      if (kind === 'leaf') { [[-4, -2], [4, -2]].forEach(function (p) { g.fillStyle = '#3f7d3a'; g.beginPath(); g.ellipse(cx + p[0], cy + p[1], 6, 4, 0.3, 0, 7); g.fill(); g.fillStyle = '#f4efe3'; g.beginPath(); g.ellipse(cx + p[0], cy + p[1] - 1, 3.5, 2.5, 0.3, 0, 7); g.fill(); }); }
      A.procCache[key] = c;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, x, y, s, s);
  }
  A.drawEgg = drawEgg;
  return A;
});
;
/* game/audio.js */
BSX.define('game/audio', function (require) {
  'use strict';
  var Au = { ctx: null, P: null, vol: { music: 0.5, sfx: 0.8 }, muted: false, mood: null, log: [] };
  var ctx = null, nyq = 22050, live = 0, paused = false, duck = false, tries = 0, E = {};
  var bus = {}, bufs = {}, rms = { w: 0.577, p: 0.3, c: 1 };
  var pools = { sfx: [], mus: [], amb: [], lp: [] }, CAP = { sfx: 14, mus: 14, amb: 9, lp: 6 };
  var lastAt = {}, mx = { s: -1, m: -1, a: -1, l: -1 };
  var scene = { place: null, rain: 0, crowd: 0, dawn: 0, music: null };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return v === true ? 1 : v === false ? 0 : (typeof v === 'number' && v === v ? v : d); }
  function has(o, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  function rr(a, b) { return a + Math.random() * (b - a); }
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function setT(p, v, tc, now) { try { p.setTargetAtTime(v, now, tc); } catch (e) { try { p.value = v; } catch (e2) {} } }
  function noop() {}
  function est(kind, type, f, q) {
    var fr = 1, x;
    if (kind === 'c') return 1;
    if (kind === 'p') {
      if (type === 'lowpass') fr = Math.log(Math.max(f, 25) / 20) / 6.9;
      else if (type === 'highpass') fr = Math.log(nyq / Math.min(f, nyq * 0.9)) / 6.9;
      else if (type) { x = 0.5 / (q || 1); fr = 3.14 * Math.log(x + Math.sqrt(x * x + 1)) / 6.9; }
      return rms.p * Math.sqrt(clamp(fr, 0.03, 1));
    }
    if (type === 'lowpass') fr = f / nyq;
    else if (type === 'highpass') fr = 1 - f / nyq;
    else if (type) fr = 1.57 * f / ((q || 1) * nyq);
    return rms.w * Math.sqrt(clamp(fr, 0.003, 1));
  }
  function gl(kind, type, f, q, level) { return Math.min(level / est(kind, type, f, q), 16); }
  function mkbuf(sec, fill) {
    var sr = ctx.sampleRate || 44100, n = Math.floor(sr * sec), xf = Math.floor(sr * 0.04), i, k;
    var b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), tmp = new Float32Array(n + xf);
    fill(tmp, n + xf, sr);
    for (i = 0; i < n; i++) d[i] = tmp[i];
    for (i = 0; i < xf; i++) { k = i / xf; d[i] = tmp[i] * Math.sqrt(k) + tmp[n + i] * Math.sqrt(1 - k); } // 循环接缝做等功率交叉
    return b;
  }
  function measure(b) { var d = b.getChannelData(0), s = 0, i; for (i = 0; i < d.length; i += 7) s += d[i] * d[i]; return Math.sqrt(s / Math.ceil(d.length / 7)) || 0.3; }
  function makeBuffers() {
    bufs.w = mkbuf(2, function (d, n) { for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; });
    bufs.p = mkbuf(4, function (d, n) {
      var b0 = 0, b1 = 0, b2 = 0, w, i, pk = 0;
      for (i = 0; i < n; i++) {
        w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = b0 + b1 + b2 + w * 0.1848;
        if (Math.abs(d[i]) > pk) pk = Math.abs(d[i]);
      }
      pk = 0.95 / (pk || 1); for (i = 0; i < n; i++) d[i] *= pk;
    });
    bufs.c = mkbuf(4, function (d, n, sr) { // 稀疏爆点：油星、雨点、粉笔、谷粒都从这里取
      var i = 0, j, len, a;
      while (true) {
        i += 1 + Math.floor(-Math.log(1 - Math.random() * 0.999) * sr / 90);
        if (i >= n) break;
        a = Math.pow(Math.random(), 2.5) * (Math.random() < 0.5 ? -1 : 1);
        len = 6 + Math.floor(Math.random() * Math.random() * sr * 0.004);
        for (j = 0; j < len && i + j < n; j++) d[i + j] += a * (Math.random() * 2 - 1) * Math.exp(-5 * j / len);
      }
    });
    rms.w = measure(bufs.w); rms.p = measure(bufs.p);
  }
  function bg(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
  function build(c) {
    ctx = c; nyq = (c.sampleRate || 44100) / 2;
    makeBuffers();
    var out = bg(0.85), tail = out, comp, sh, d1, d2, f1, f2, fb1, fb2, xg, rout;
    out.connect(c.destination);
    if (c.createDynamicsCompressor) {
      try {
        comp = c.createDynamicsCompressor();
        comp.threshold.value = -15; comp.knee.value = 14; comp.ratio.value = 3.2; comp.attack.value = 0.008; comp.release.value = 0.24;
        comp.connect(out); tail = comp;
      } catch (e) { tail = out; }
    }
    try { sh = c.createBiquadFilter(); sh.type = 'highshelf'; sh.frequency.value = 7200; sh.gain.value = -3.5; sh.connect(tail); tail = sh; } catch (e2) {}
    bus.master = bg(1); bus.master.connect(tail);
    bus.sfx = bg(0); bus.mus = bg(0); bus.amb = bg(0);
    bus.sfx.connect(bus.master); bus.mus.connect(bus.master); bus.amb.connect(bus.master);
    bus.one = bg(1); bus.loop = bg(1); bus.one.connect(bus.sfx); bus.loop.connect(bus.sfx);
    if (c.createDelay) { // 小店的"屋子"：两条带低通的短反馈延时，不用卷积
      try {
        bus.room = bg(1); rout = bg(0.9); d1 = c.createDelay(0.25); d2 = c.createDelay(0.25);
        d1.delayTime.value = 0.0297; d2.delayTime.value = 0.0471;
        f1 = c.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 2400;
        f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1700;
        fb1 = bg(0.36); fb2 = bg(0.3); xg = bg(0.2);
        bus.room.connect(d1); d1.connect(f1); f1.connect(fb1); fb1.connect(d1); f1.connect(rout);
        bus.room.connect(d2); d2.connect(f2); f2.connect(fb2); fb2.connect(d2); f2.connect(rout); f1.connect(xg); xg.connect(d2);
        rout.connect(bus.master);
        bus.sendS = bg(0.11); bus.one.connect(bus.sendS); bus.sendS.connect(bus.room);
        bus.sendM = bg(0.2); bus.mus.connect(bus.sendM); bus.sendM.connect(bus.room);
      } catch (e3) {}
    }
    Au.ctx = c; mx.s = mx.m = mx.a = mx.l = -1;
    mix(c.currentTime || 0, true);
  }
  function mix(now, force) {
    var sum = 0, k, s, m, a, l, d = duck ? 0.45 : 1;
    for (k in loops) sum += Math.pow(loops[k].cur, loops[k].shape);
    s = Au.muted ? 0 : Au.vol.sfx; a = s * d * 0.9;
    m = Au.muted ? 0 : Au.vol.music * d * (1 - 0.22 * Math.min(1, sum)); // 灶上热闹时音乐让一步
    l = 1 / (1 + 0.4 * Math.max(0, sum - 1));                                  // 多层同时响时整体收一点
    if (force) { bus.sfx.gain.value = s; bus.mus.gain.value = m; bus.amb.gain.value = a; bus.loop.gain.value = l; mx.s = s; mx.m = m; mx.a = a; mx.l = l; return; }
    if (Math.abs(s - mx.s) > 0.003) { setT(bus.sfx.gain, s, 0.04, now); mx.s = s; }
    if (Math.abs(m - mx.m) > 0.003) { setT(bus.mus.gain, m, 0.12, now); mx.m = m; }
    if (Math.abs(a - mx.a) > 0.003) { setT(bus.amb.gain, a, 0.12, now); mx.a = a; }
    if (Math.abs(l - mx.l) > 0.01) { setT(bus.loop.gain, l, 0.15, now); mx.l = l; }
  }
  function release(v) {
    var i;
    for (i = 0; i < v.srcs.length; i++) { try { v.srcs[i].stop(); } catch (e) {} }
    for (i = 0; i < v.nodes.length; i++) { try { v.nodes[i].disconnect(); } catch (e2) {} }
    live -= v.nodes.length; v.nodes = []; v.srcs = [];
  }
  function reap(now) {
    var k, list, i;
    for (k in pools) { list = pools[k]; for (i = list.length - 1; i >= 0; i--) if (list[i].end <= now) { release(list[i]); list.splice(i, 1); } }
  }
  function spawn(pool, dest, fn, vol, pitch, pan, wantPan) {
    var list = pools[pool], now = ctx.currentTime, t = now + 0.006, i, j, v, pn, tail;
    if (list.length >= CAP[pool]) {
      if (pool !== 'sfx') return null;
      for (j = 0, i = 1; i < list.length; i++) if (list[i].end < list[j].end) j = i; // 让最快结束的那个声部让位
      release(list[j]); list.splice(j, 1);
    }
    v = { nodes: [], srcs: [], end: t, p: pitch || 1, out: ctx.createGain(), pan: null };
    v.out.gain.value = vol; v.nodes.push(v.out); live++; tail = v.out;
    if ((pan || wantPan) && ctx.createStereoPanner) {
      try { pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan || 0, -1, 1); v.nodes.push(pn); live++; v.out.connect(pn); tail = pn; v.pan = pn; } catch (e) { tail = v.out; }
    }
    tail.connect(dest); list.push(v);
    try { fn(v, t); } catch (e2) { v.end = now; }
    return v;
  }
  function env(p, t, a, peak, dur, hold, lin) {
    if (peak < 0.0002) peak = 0.0002;
    if (dur < a + hold + 0.006) dur = a + hold + 0.006;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    if (hold > 0) p.setValueAtTime(peak, t + a + hold);
    if (lin) p.linearRampToValueAtTime(0.0001, t + dur); else p.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function flt(v, type, f, q) {
    var n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = clamp(f, 20, nyq * 0.9); n.Q.value = q || 0.7;
    v.nodes.push(n); live++; return n;
  }
  function gn(v, val) { var g = ctx.createGain(); g.gain.value = val; v.nodes.push(g); live++; return g; }
  function tone(v, t, f, dur, peak, o) {
    o = o || E; f *= v.p;
    if (!(f > 0) || f > nyq * 0.92) return null;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    v.nodes.push(osc, g); live += 2; v.srcs.push(osc);
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(clamp(o.to * v.p, 20, nyq * 0.9), t + (o.tt || dur));
    else if (o.bend) osc.frequency.exponentialRampToValueAtTime(f * o.bend, t + dur);
    g.gain.value = 0; env(g.gain, t, o.a || 0.004, peak, dur, o.hold || 0, o.lin);
    osc.connect(g); g.connect(o.dest || v.out);
    osc.start(t); osc.stop(t + dur + 0.02);
    if (t + dur + 0.06 > v.end) v.end = t + dur + 0.06;
    return osc;
  }
  function modal(v, t, f, R, A, D, peak, o) { for (var i = 0; i < R.length; i++) tone(v, t, f * R[i], D[i], peak * A[i], o); }
  function nz(v, t, dur, peak, o) {
    var kind = o.buf || 'w', s = ctx.createBufferSource(), g = ctx.createGain(), last = s, f, x;
    var type = o.f ? (o.type || 'bandpass') : null, ff = o.f ? clamp(o.f * v.p, 20, nyq * 0.9) : 0;
    v.nodes.push(s, g); live += 2; v.srcs.push(s);
    s.buffer = bufs[kind]; s.loop = true;
    if (o.rate) s.playbackRate.value = o.rate;
    if (type) {
      f = flt(v, type, ff, o.q || 1);
      if (o.to) { f.frequency.setValueAtTime(ff, t); f.frequency.exponentialRampToValueAtTime(clamp(o.to * v.p, 20, nyq * 0.9), t + (o.tt || dur)); }
      last.connect(f); last = f;
    }
    if (o.hp) { x = flt(v, 'highpass', o.hp, 0.7); last.connect(x); last = x; }
    if (o.lp) { x = flt(v, 'lowpass', o.lp, 0.7); last.connect(x); last = x; }
    g.gain.value = 0; env(g.gain, t, o.a || 0.003, Math.min(peak / est(kind, type, ff, o.q || 1), 16), dur, o.hold || 0, o.lin);
    last.connect(g); g.connect(o.dest || v.out);
    s.start(t, Math.random() * ((bufs[kind] && bufs[kind].duration) || 1)); s.stop(t + dur + 0.02);
    if (t + dur + 0.06 > v.end) v.end = t + dur + 0.06;
  }
  function train(v, times, amps, blen, peak, freqs, q, slide, dur) {
    var s = ctx.createBufferSource(), gate = ctx.createGain(), og = ctx.createGain(), i, b, te, t0 = times[0], end = times[times.length - 1] + blen, f, x;
    v.nodes.push(s, gate, og); live += 3; v.srcs.push(s);
    s.buffer = bufs.w; s.loop = true; gate.gain.value = 0; og.gain.value = 1;
    gate.gain.setValueAtTime(0.0001, t0);
    for (i = 0; i < times.length; i++) {
      te = i + 1 < times.length ? Math.min(times[i] + blen, times[i + 1] - 0.006) : times[i] + blen;
      if (i > 0) gate.gain.setValueAtTime(0.0001, times[i]);
      gate.gain.linearRampToValueAtTime(Math.max(0.0002, amps[i]), times[i] + 0.003);
      gate.gain.exponentialRampToValueAtTime(0.0001, Math.max(te, times[i] + 0.012));
    }
    s.connect(gate);
    for (i = 0; i < freqs.length; i++) {
      f = clamp(freqs[i] * v.p, 40, nyq * 0.8);
      b = flt(v, 'bandpass', f, q);
      if (slide && slide !== 1) { b.frequency.setValueAtTime(f, t0); b.frequency.exponentialRampToValueAtTime(clamp(f * slide, 40, nyq * 0.85), t0 + dur); }
      x = gn(v, gl('w', 'bandpass', f, q, peak));
      gate.connect(b); b.connect(x); x.connect(og);
    }
    og.connect(v.out);
    s.start(t0, Math.random()); s.stop(end + 0.03);
    if (end + 0.08 > v.end) v.end = end + 0.08;
  }
  function wood(v, t, f, amp) { // 木头/塑料的"笃"
    tone(v, t, f, 0.05, amp, { to: f * 0.8, a: 0.0015 });
    tone(v, t, f * 2.37, 0.022, amp * 0.35, { a: 0.001 });
    nz(v, t, 0.014, amp * 0.18, { type: 'highpass', f: 2400, a: 0.001 });
  }
  function drip(v, t, amp, f) { tone(v, t, f, 0.04, amp, { to: f * 1.7, tt: 0.03, a: 0.003 }); }
  function coinHit(v, t, amp, k) {
    modal(v, t, 2500 * k, [1, 1.52, 2.31, 3.44], [1, 0.55, 0.3, 0.15], [0.2, 0.14, 0.09, 0.06], 0.065 * amp);
    nz(v, t, 0.012, 0.045 * amp, { type: 'highpass', f: 4000, a: 0.001 });
  }
  function tin(v, t, amp) { modal(v, t, 720, [1, 1.77, 2.6], [1, 0.6, 0.3], [0.09, 0.07, 0.05], amp); }
  function brass(v, t, f, amp, dec, bend) { // 门口的小铜铃
    modal(v, t, f, [1, 2.01, 2.83, 3.9, 5.2], [1, 0.5, 0.34, 0.18, 0.09], [dec, dec * 0.7, dec * 0.5, dec * 0.34, dec * 0.22], amp, bend ? { bend: bend, a: 0.002 } : { a: 0.002 });
    nz(v, t, 0.01, amp * 0.3, { type: 'highpass', f: 5000, a: 0.001 });
  }
  var I = {
    kalimba: function (v, t, f, vel) { tone(v, t, f, 1.0, 0.3 * vel, { a: 0.004 }); tone(v, t, f * 2, 0.4, 0.07 * vel); tone(v, t, f * 5.43, 0.09, 0.045 * vel); },
    glock: function (v, t, f, vel) { tone(v, t, f, 1.3, 0.21 * vel, { a: 0.003 }); tone(v, t, f * 2.756, 0.45, 0.055 * vel); tone(v, t, f * 5.404, 0.14, 0.025 * vel); },
    marimba: function (v, t, f, vel) { tone(v, t, f, 0.5, 0.32 * vel, { a: 0.004 }); tone(v, t, f * 3.98, 0.1, 0.07 * vel); tone(v, t, f * 9.2, 0.03, 0.025 * vel); },
    pluck: function (v, t, f, vel, len) {
      var lp = flt(v, 'lowpass', Math.min(f * 6, 1500), 0.7); len = clamp(len || 0.9, 0.5, 1.8);
      lp.frequency.setValueAtTime(Math.min(f * 6, 1500), t); lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.7, 200), t + 0.4);
      lp.connect(v.out);
      tone(v, t, f, len, 0.36 * vel, { type: 'triangle', a: 0.007, dest: lp }); tone(v, t, f * 2, 0.3, 0.07 * vel, { a: 0.005, dest: lp });
    },
    low: function (v, t, f, vel, len) { len = clamp(len || 3, 2, 4.5); tone(v, t, f, len, 0.3 * vel, { a: 0.03 }); tone(v, t, f * 2, len * 0.4, 0.07 * vel, { a: 0.02 }); tone(v, t, f * 3, 0.5, 0.025 * vel, { a: 0.01 }); },
    tick: function (v, t, f, vel) { tone(v, t, f, 0.17, 0.2 * vel, { a: 0.003 }); tone(v, t, f * 3.9, 0.03, 0.04 * vel); },
    pad: function (v, t, f, vel, len) { len = clamp(len || 4, 2, 9); tone(v, t, f, len + 2.2, 0.1 * vel, { a: 0.6, hold: len - 0.6, lin: true }); tone(v, t, f * 1.004, len + 2.2, 0.06 * vel, { a: 0.8, hold: len - 0.8, lin: true }); }
  };
  var CUE = {};
  CUE.tap = function (v, t) { wood(v, t, 900 * rr(0.95, 1.06), 0.15); };
  CUE.ui_open = function (v, t) { nz(v, t, 0.17, 0.04, { f: 800, to: 2400, q: 1.2, a: 0.03 }); wood(v, t + 0.01, 520, 0.1); wood(v, t + 0.075, 700, 0.07); };
  CUE.ui_close = function (v, t) { nz(v, t, 0.14, 0.04, { f: 2200, to: 700, q: 1.2, a: 0.02 }); wood(v, t + 0.06, 430, 0.12); };
  CUE.page = function (v, t) {
    nz(v, t, 0.17, 0.06, { f: 2800, to: 1500, q: 0.8, a: 0.035 }); nz(v, t + 0.08, 0.08, 0.04, { f: 4200, q: 1, a: 0.01 });
    nz(v, t + 0.13, 0.05, 0.05, { buf: 'p', type: 'lowpass', f: 350, a: 0.004 });
  };
  CUE.chalk = function (v, t) {
    nz(v, t, 0.24, 0.5, { buf: 'c', rate: 3.2, f: 3000, to: 3600, q: 2.2, a: 0.01, hold: 0.15 });
    nz(v, t, 0.22, 0.028, { f: 4300, q: 3, a: 0.02, hold: 0.12 }); wood(v, t + 0.23, 1500, 0.05);
  };
  CUE.stamp = function (v, t) { tone(v, t, 125, 0.16, 0.32, { to: 68, a: 0.002 }); nz(v, t, 0.08, 0.11, { buf: 'p', type: 'lowpass', f: 420, a: 0.002 }); wood(v, t + 0.004, 300, 0.1); };
  CUE.coin = function (v, t) { coinHit(v, t, 1, rr(0.97, 1.04)); coinHit(v, t + 0.075, 0.35, 1.05); tin(v, t, 0.09); };
  CUE.coins = function (v, t) {
    var at = [0, 0.06, 0.13, 0.21], i;
    for (i = 0; i < 4; i++) coinHit(v, t + at[i] + rr(0, 0.015), 0.9 - i * 0.15, rr(0.9, 1.12));
    tin(v, t, 0.09); tin(v, t + 0.13, 0.05);
  };
  CUE.till = function (v, t) {
    modal(v, t, 520, [1, 1.72, 3.1, 4.6], [1, 0.7, 0.4, 0.2], [0.16, 0.13, 0.09, 0.06], 0.09); nz(v, t, 0.02, 0.07, { type: 'highpass', f: 3000, a: 0.001 });
    tone(v, t, 170, 0.08, 0.13, { to: 110 }); modal(v, t + 0.085, 560, [1, 1.72, 3.1], [1, 0.6, 0.3], [0.08, 0.06, 0.04], 0.04);
  };
  CUE.bell = function (v, t) { brass(v, t, 1320, 0.075, 0.9); brass(v, t + 0.14, 1320, 0.04, 0.8); brass(v, t + 0.31, 1320, 0.022, 0.7); };
  CUE.knock = function (v, t) {
    var i, tt;
    for (i = 0; i < 3; i++) {
      tt = t + i * 0.17;
      tone(v, tt, 180, 0.07, 0.22, { to: 120, a: 0.002 });
      modal(v, tt, 310, [1, 1.69, 2.81, 4.5], [1, 0.7, 0.5, 0.3], [0.2, 0.16, 0.12, 0.08], 0.045);
      nz(v, tt, 0.05, 0.3, { buf: 'c', rate: 2.5, f: 1800, q: 1.5, a: 0.002 });
    }
  };
  CUE.phone = function (v, t) {
    var i, tt;
    for (i = 0; i < 2; i++) {
      tt = t + i * 0.48;
      tone(v, tt, 172, 0.34, 0.065, { type: 'triangle', a: 0.02, hold: 0.26 }); tone(v, tt, 86, 0.34, 0.055, { a: 0.02, hold: 0.26 });
      nz(v, tt, 0.34, 0.32, { buf: 'c', rate: 2.2, f: 750, q: 1.5, a: 0.02, hold: 0.26 });
    }
  };
  CUE.sigh = function (v, t) { nz(v, t, 0.75, 0.045, { f: 1300, to: 650, q: 1.1, a: 0.14, tt: 0.7, lin: true }); nz(v, t, 0.6, 0.018, { f: 2600, to: 1700, q: 1.5, a: 0.1, lin: true }); };
  CUE.bowl = function (v, t) { tone(v, t, 165, 0.1, 0.19, { to: 105, a: 0.002 }); wood(v, t, 330, 0.1); modal(v, t + 0.002, 1460, [1, 2.32, 3.86], [1, 0.4, 0.18], [0.14, 0.09, 0.05], 0.05); };
  CUE.spoon = function (v, t) { modal(v, t, 2780, [1, 1.61, 2.74], [1, 0.5, 0.25], [0.19, 0.11, 0.06], 0.065); nz(v, t, 0.012, 0.035, { type: 'highpass', f: 5000, a: 0.001 }); };
  CUE.ladle = function (v, t) {
    tone(v, t, 140, 0.11, 0.19, { to: 330, tt: 0.08, a: 0.012 }); tone(v, t + 0.08, 230, 0.12, 0.13, { to: 110, tt: 0.1, a: 0.01 });
    nz(v, t, 0.18, 0.065, { buf: 'p', f: 480, q: 1.4, a: 0.02 }); drip(v, t + 0.22, 0.035, 640);
  };
  CUE.stir = function (v, t) {
    nz(v, t, 0.34, 0.055, { buf: 'p', f: 520, to: 900, q: 1.3, a: 0.07, tt: 0.2 }); nz(v, t, 0.3, 0.26, { buf: 'c', rate: 1.6, f: 1100, q: 2, a: 0.05, hold: 0.12 });
    modal(v, t + 0.02, 430, [1, 2.3], [1, 0.4], [0.22, 0.12], 0.025, { a: 0.04 }); nz(v, t, 0.32, 0.035, { buf: 'p', type: 'lowpass', f: 360, a: 0.09 });
  };
  CUE.rice = function (v, t) {
    nz(v, t, 0.5, 0.5, { buf: 'c', rate: 2.6, f: 3400, q: 0.9, a: 0.05, hold: 0.22 }); nz(v, t, 0.45, 0.03, { f: 1500, q: 1, a: 0.06, hold: 0.15 });
    drip(v, t + 0.12, 0.03, rr(520, 700)); drip(v, t + 0.25, 0.03, rr(600, 860)); drip(v, t + 0.37, 0.022, rr(500, 800));
  };
  CUE.lid = function (v, t) {
    modal(v, t, 610, [1, 1.47, 2.09, 2.96, 3.9, 5.1], [1, 0.8, 0.6, 0.4, 0.25, 0.15], [0.34, 0.27, 0.2, 0.14, 0.1, 0.07], 0.06);
    nz(v, t, 0.02, 0.07, { type: 'highpass', f: 2500, a: 0.001 }); modal(v, t + 0.065, 640, [1, 1.47, 2.09], [1, 0.7, 0.4], [0.12, 0.1, 0.07], 0.028);
  };
  CUE.dough = function (v, t) {
    nz(v, t, 0.12, 0.15, { buf: 'p', type: 'lowpass', f: 750, to: 240, a: 0.002 }); tone(v, t, 118, 0.13, 0.25, { to: 72, a: 0.002 });
    nz(v, t, 0.1, 0.03, { f: 2300, q: 0.6, a: 0.008 }); nz(v, t + 0.1, 0.24, 0.025, { buf: 'p', f: 480, to: 860, q: 2, a: 0.09 });
  };
  CUE.drop_oil = function (v, t) {
    tone(v, t, 230, 0.07, 0.1, { to: 130 }); nz(v, t, 0.95, 0.085, { type: 'highpass', f: 3200, lp: 8500, a: 0.015 });
    nz(v, t, 1.15, 0.6, { buf: 'c', rate: 1.8, f: 4200, q: 0.8, a: 0.012 }); nz(v, t, 0.5, 0.04, { buf: 'p', f: 420, q: 1.2, a: 0.02 });
  };
  CUE.flip = function (v, t) {
    wood(v, t, 2100, 0.05); nz(v, t + 0.01, 0.24, 0.075, { f: 1900, to: 3600, q: 0.8, a: 0.012 });
    nz(v, t + 0.02, 0.38, 0.45, { buf: 'c', rate: 1.5, type: 'highpass', f: 3500, a: 0.02 }); tone(v, t + 0.015, 205, 0.06, 0.07, { to: 150 });
  };
  CUE.fish = function (v, t) {
    var at = [0.12, 0.22, 0.35, 0.52, 0.74], i;
    nz(v, t, 0.75, 0.045, { type: 'highpass', f: 3000, lp: 8000, a: 0.04 }); nz(v, t, 0.7, 0.36, { buf: 'c', rate: 1.1, f: 3000, q: 0.8, a: 0.04 });
    for (i = 0; i < 5; i++) drip(v, t + at[i] + rr(0, 0.02), 0.05 - i * 0.007, rr(900, 1300));
  };
  CUE.rack = function (v, t) {
    modal(v, t, 1310, [1, 1.56, 2.38, 3.29], [1, 0.7, 0.5, 0.3], [0.14, 0.11, 0.08, 0.05], 0.042); modal(v, t + 0.05, 1420, [1, 1.56, 2.38], [1, 0.6, 0.4], [0.07, 0.05, 0.04], 0.02);
    nz(v, t, 0.07, 0.4, { buf: 'c', rate: 2, f: 2500, q: 1, a: 0.003 });
  };
  CUE.crack = function (v, t) {
    wood(v, t, 1700, 0.15); nz(v, t, 0.015, 0.06, { type: 'highpass', f: 4000, a: 0.001 }); nz(v, t + 0.09, 0.08, 0.5, { buf: 'c', rate: 2.4, f: 3000, q: 1, a: 0.004 });
    tone(v, t + 0.19, 300, 0.08, 0.09, { to: 165, a: 0.006 }); nz(v, t + 0.19, 0.09, 0.03, { buf: 'p', f: 600, q: 1.2, a: 0.008 });
  };
  CUE.pan_in = function (v, t) {
    nz(v, t, 0.85, 0.075, { f: 5200, q: 0.5, a: 0.02, hold: 0.14 }); nz(v, t, 0.75, 0.42, { buf: 'c', rate: 1.2, type: 'highpass', f: 2500, a: 0.02 });
    nz(v, t, 0.08, 0.1, { buf: 'p', type: 'lowpass', f: 500, a: 0.003 });
  };
  CUE.toss = function (v, t) {
    modal(v, t, 520, [1, 2.27, 3.6], [1, 0.6, 0.3], [0.14, 0.1, 0.06], 0.035); nz(v, t, 0.42, 0.5, { buf: 'c', rate: 2.6, f: 3800, q: 0.7, a: 0.1 });
    nz(v, t, 0.3, 0.03, { buf: 'p', f: 500, to: 950, q: 1, a: 0.1 }); nz(v, t + 0.3, 0.22, 0.065, { f: 2600, q: 0.6, a: 0.005 });
  };
  CUE.water = function (v, t) {
    var i;
    nz(v, t, 0.5, 0.065, { f: 1300, to: 2400, q: 1, a: 0.04, hold: 0.14 }); nz(v, t, 0.45, 0.05, { buf: 'p', type: 'lowpass', f: 380, a: 0.05 });
    nz(v, t + 0.05, 0.5, 0.022, { type: 'highpass', f: 4500, a: 0.06 });
    for (i = 0; i < 4; i++) drip(v, t + 0.06 + i * 0.09 + rr(0, 0.03), 0.05, rr(300, 520));
  };
  CUE.noodle = function (v, t) {
    var i, tt;
    for (i = 0; i < 3; i++) { tt = t + i * 0.085 + rr(0, 0.02); tone(v, tt, rr(230, 280), 0.07, 0.085, { to: 150 }); nz(v, tt, 0.07, 0.03, { buf: 'p', f: 700, q: 1, a: 0.004 }); }
    nz(v, t, 0.32, 0.035, { f: 950, to: 1500, q: 1, a: 0.06 });
  };
  CUE.basket = function (v, t) {
    var i;
    modal(v, t, 1900, [1, 1.47], [1, 0.6], [0.05, 0.04], 0.03); nz(v, t + 0.02, 0.85, 0.06, { f: 2300, to: 1200, q: 0.7, a: 0.03, hold: 0.18 });
    nz(v, t + 0.02, 0.5, 0.03, { buf: 'p', f: 520, q: 1, a: 0.03 });
    for (i = 0; i < 5; i++) drip(v, t + 0.38 + i * 0.11 + rr(0, 0.04), 0.045 - i * 0.006, rr(700, 1100));
  };
  CUE.cup = function (v, t) { wood(v, t, 400, 0.16); tone(v, t, 225, 0.05, 0.08, { to: 180 }); nz(v, t, 0.02, 0.02, { type: 'highpass', f: 2500, a: 0.001 }); };
  CUE.spill = function (v, t) {
    nz(v, t, 0.36, 0.1, { f: 950, to: 2600, q: 0.7, a: 0.01 }); nz(v, t, 0.26, 0.085, { buf: 'p', type: 'lowpass', f: 520, a: 0.005 }); nz(v, t + 0.12, 0.2, 0.05, { f: 1600, q: 0.8, a: 0.01 });
    drip(v, t + 0.3, 0.045, 620); drip(v, t + 0.41, 0.035, 760); drip(v, t + 0.56, 0.025, 700);
  };
  CUE.steam = function (v, t) { nz(v, t, 1.0, 0.038, { f: 5200, q: 0.4, a: 0.12, hold: 0.2, lin: true }); nz(v, t, 0.8, 0.012, { f: 950, q: 0.5, a: 0.2, lin: true }); };
  CUE.burnt = function (v, t) {
    nz(v, t, 0.6, 0.065, { f: 2400, q: 1.5, a: 0.01 }); nz(v, t, 0.5, 0.4, { buf: 'c', rate: 0.9, f: 1800, q: 1, a: 0.01 });
    tone(v, t + 0.18, 95, 0.2, 0.25, { to: 58, a: 0.003 }); nz(v, t + 0.18, 0.13, 0.1, { buf: 'p', type: 'lowpass', f: 260, a: 0.003 });
  };
  CUE.trash = function (v, t) {
    nz(v, t, 0.13, 0.11, { buf: 'p', type: 'lowpass', f: 600, a: 0.003 }); modal(v, t, 180, [1, 1.83], [1, 0.5], [0.15, 0.1], 0.1);
    nz(v, t + 0.02, 0.3, 0.4, { buf: 'c', rate: 2.6, f: 4200, q: 0.8, a: 0.02 });
  };
  CUE.good = function (v, t) { I.marimba(v, t, mf(69), 1); };
  CUE.perfect = function (v, t) { I.marimba(v, t, mf(69), 0.9); I.marimba(v, t + 0.115, mf(74), 1); tone(v, t + 0.115, mf(86), 0.5, 0.028, { a: 0.006 }); };
  CUE.meh = function (v, t) { wood(v, t, 230, 0.2); tone(v, t, 175, 0.09, 0.1, { to: 150 }); };
  CUE.wrong = function (v, t) { for (var i = 0; i < 2; i++) { tone(v, t + i * 0.13, 150, 0.09, 0.19, { to: 118, a: 0.003 }); wood(v, t + i * 0.13, 270, 0.1 - i * 0.02); } };
  CUE.serve = function (v, t) {
    nz(v, t, 0.3, 0.05, { buf: 'p', f: 520, to: 820, q: 1, a: 0.05, tt: 0.25 }); nz(v, t, 0.28, 0.012, { f: 2300, q: 1, a: 0.05 });
    modal(v, t + 0.27, 1400, [1, 2.32], [1, 0.4], [0.1, 0.06], 0.035); tone(v, t + 0.27, 150, 0.07, 0.1, { to: 110 });
  };
  CUE.heart = function (v, t) { tone(v, t, mf(86), 0.55, 0.055, { a: 0.012 }); tone(v, t + 0.06, mf(93), 0.5, 0.045, { a: 0.012 }); tone(v, t, mf(74), 0.4, 0.03, { a: 0.02 }); };
  CUE.leave = function (v, t) { brass(v, t, 990, 0.055, 1.3, 0.985); brass(v, t + 0.42, 990, 0.014, 0.9, 0.985); };
  CUE.soldout = function (v, t) {
    nz(v, t, 0.32, 0.55, { buf: 'c', rate: 3.6, f: 3000, to: 3900, q: 2, a: 0.008, hold: 0.2 }); nz(v, t, 0.3, 0.028, { f: 4500, q: 3, a: 0.01, hold: 0.18 }); wood(v, t + 0.31, 1500, 0.06);
  };
  CUE.unlock = function (v, t) {
    var ms = [74, 76, 81, 86], at = [0, 0.11, 0.22, 0.36], i;
    for (i = 0; i < 4; i++) I.glock(v, t + at[i], mf(ms[i]), 0.75 + i * 0.05);
    I.kalimba(v, t + 0.36, mf(74), 0.55);
  };
  CUE.memento = function (v, t) {
    nz(v, t, 0.014, 0.11, { type: 'highpass', f: 2500, a: 0.001 }); wood(v, t, 900, 0.12); wood(v, t + 0.07, 640, 0.09); nz(v, t + 0.07, 0.03, 0.035, { f: 1800, q: 1 });
    tone(v, t + 0.17, mf(93), 0.5, 0.05, { a: 0.006 }); tone(v, t + 0.23, mf(98), 0.6, 0.042, { a: 0.006 });
  };
  CUE.note = function (v, t) {
    nz(v, t, 0.1, 0.035, { f: 2100, q: 1.2, a: 0.012 }); nz(v, t, 0.1, 0.3, { buf: 'c', rate: 3, f: 2400, q: 1.5, a: 0.01 });
    nz(v, t + 0.12, 0.13, 0.038, { f: 2500, to: 1900, q: 1.2, a: 0.015 }); nz(v, t + 0.12, 0.13, 0.3, { buf: 'c', rate: 3.4, f: 2600, q: 1.5, a: 0.012 });
  };
  function shutter(v, t, up) {
    var dur = up ? 1.3 : 1.15, n = up ? 12 : 11, i, tt = t + 0.04, times = [], amps = [], te = t + dur;
    for (i = 0; i < n && tt < te - 0.08; i++) { times.push(tt); amps.push(rr(0.6, 1)); tt += (up ? 0.135 - i * 0.005 : 0.14 - i * 0.007) * rr(0.92, 1.1); }
    nz(v, t, dur + 0.1, 0.12, { buf: 'p', type: 'lowpass', f: up ? 150 : 230, to: up ? 240 : 120, a: 0.12, hold: dur - 0.4 });   // 分量
    tone(v, t, up ? 52 : 70, dur, 0.11, { to: up ? 70 : 44, a: 0.1, hold: dur - 0.35 });
    train(v, times, amps, 0.07, 0.06, [640, 1130, 1810], 14, up ? 1.45 : 0.68, dur);                                        // 铁片
    nz(v, t, dur, 0.34, { buf: 'c', rate: up ? 1.1 : 1.3, f: up ? 1500 : 2400, to: up ? 2600 : 1300, q: 1.2, a: 0.08, hold: dur - 0.3 }); // 链条
    if (up) {
      tone(v, te, 112, 0.17, 0.28, { to: 70, a: 0.002 }); modal(v, te, 225, [1, 1.66, 2.7, 4.2], [1, 0.7, 0.4, 0.2], [0.2, 0.16, 0.1, 0.07], 0.065);
      nz(v, te, 0.05, 0.4, { buf: 'c', rate: 2.5, f: 1700, q: 1.4, a: 0.002 });
    } else {
      tone(v, te, 82, 0.28, 0.34, { to: 44, a: 0.002 }); nz(v, te, 0.2, 0.15, { buf: 'p', type: 'lowpass', f: 210, a: 0.003 });
      modal(v, te, 190, [1, 1.66, 2.7], [1, 0.6, 0.3], [0.22, 0.16, 0.1], 0.06); nz(v, te + 0.02, 0.12, 0.4, { buf: 'c', rate: 2.2, f: 1500, q: 1.4, a: 0.004 });
    }
  }
  CUE.shutter_up = function (v, t) { shutter(v, t, true); };
  CUE.shutter_down = function (v, t) { shutter(v, t, false); };
  CUE.shutter_tick = function (v, t) { var k = rr(0.92, 1.08); train(v, [t], [1], 0.07, 0.055, [660 * k, 1180 * k, 1850 * k], 14, 1, 0.08); tone(v, t, 92, 0.06, 0.07, { to: 70 }); };
  CUE.horn = function (v, t) {
    var lp = flt(v, 'lowpass', 1500, 0.7), at = [0, 0.27], len = [0.2, 0.36], i;
    lp.connect(v.out);
    for (i = 0; i < 2; i++) {
      tone(v, t + at[i], 392, len[i], 0.06, { type: 'sawtooth', a: 0.025, hold: len[i] - 0.1, dest: lp });
      tone(v, t + at[i], 494, len[i], 0.05, { type: 'sawtooth', a: 0.025, hold: len[i] - 0.1, dest: lp });
    }
  };
  CUE.bus = function (v, t) {
    var lp = flt(v, 'lowpass', 330, 0.8), d = 2.6, tp = t + 1.15, fs = [58, 87, 116.5], am = [0.16, 0.1, 0.05], i, o;
    lp.connect(v.out);
    for (i = 0; i < 3; i++) {
      o = tone(v, t, fs[i] * 1.05, d, am[i], { type: i === 0 ? 'sawtooth' : 'triangle', a: 1.0, hold: 0.25, lin: true, dest: lp });
      if (o) { o.frequency.setValueAtTime(fs[i] * 1.05 * v.p, tp - 0.25); o.frequency.exponentialRampToValueAtTime(fs[i] * 0.94 * v.p, tp + 0.35); } // 多普勒
    }
    nz(v, t, d, 0.055, { buf: 'p', f: 300, to: 650, q: 0.8, a: 1.1, tt: 1.15, hold: 0.2, lin: true }); nz(v, t, d, 0.014, { f: 1600, q: 0.6, a: 1.1, hold: 0.2, lin: true });
    nz(v, t + 2.25, 0.3, 0.02, { type: 'highpass', f: 3200, a: 0.02 });
    if (v.pan) { try { v.pan.pan.setValueAtTime(-0.65, t); v.pan.pan.linearRampToValueAtTime(0.65, t + d); } catch (e) {} }
  };
  CUE.bike = function (v, t) {
    var i, j, tt;
    for (j = 0; j < 2; j++) for (i = 0; i < 4; i++) {
      tt = t + j * 0.42 + i * 0.055;
      modal(v, tt, 2090, [1, 2.42], [1, 0.35], i === 3 ? [0.6, 0.3] : [0.25, 0.15], 0.032 * (i % 2 ? 0.7 : 1), { a: 0.002 });
    }
  };
  CUE.sparrow = function (v, t) {
    var n = Math.random() < 0.5 ? 2 : 3, i, tt = t, f, o;
    for (i = 0; i < n; i++) {
      f = rr(3500, 4500); o = tone(v, tt, f, 0.075, 0.045, { a: 0.008 });
      if (o) { o.frequency.linearRampToValueAtTime(f * 1.35 * v.p, tt + 0.025); o.frequency.linearRampToValueAtTime(f * 0.85 * v.p, tt + 0.07); }
      tt += rr(0.09, 0.16);
    }
  };
  CUE.rooster = function (v, t) { // 远处一声，可选
    var pre = gn(v, 1), b1 = flt(v, 'bandpass', 1250, 2.5), b2 = flt(v, 'bandpass', 2600, 3), g2 = gn(v, 0.5), syl = [[0, 0.14, 520, 700], [0.2, 0.14, 600, 760], [0.4, 0.2, 700, 860], [0.65, 0.75, 880, 520]], i, s;
    pre.connect(b1); pre.connect(b2); b1.connect(v.out); b2.connect(g2); g2.connect(v.out);
    for (i = 0; i < 4; i++) { s = syl[i]; tone(v, t + s[0], s[2], s[1], 0.07, { type: 'sawtooth', a: 0.03, hold: s[1] * 0.5, to: s[3], dest: pre }); }
  };
  CUE.thunder = function (v, t) {
    nz(v, t, 3.4, 0.13, { buf: 'p', type: 'lowpass', f: 95, to: 60, a: 0.3, hold: 0.5, lin: true }); nz(v, t + 0.15, 2.4, 0.08, { buf: 'p', type: 'lowpass', f: 220, to: 80, a: 0.2, tt: 1.5, lin: true });
    nz(v, t + 0.9, 2.0, 0.065, { buf: 'p', type: 'lowpass', f: 150, to: 70, a: 0.35, lin: true });
  };
  CUE['switch'] = function (v, t) { nz(v, t, 0.01, 0.09, { type: 'highpass', f: 2000, a: 0.001 }); wood(v, t, 1300, 0.12); wood(v, t + 0.035, 1000, 0.06); };
  CUE.lamp = function (v, t) {
    var at = [0, 0.12, 0.29], i;
    for (i = 0; i < 3; i++) { modal(v, t + at[i], 3100, [1, 1.52], [1, 0.5], [0.04, 0.03], 0.03); tone(v, t + at[i], 100, 0.06, 0.04, { type: 'triangle', a: 0.004, hold: 0.03 }); }
    tone(v, t + 0.42, 100, 1.0, 0.03, { type: 'triangle', a: 0.05, hold: 0.3, lin: true }); tone(v, t + 0.42, 200, 0.9, 0.012, { a: 0.05, hold: 0.25, lin: true });
    nz(v, t + 0.42, 0.7, 0.006, { f: 6200, q: 6, a: 0.05, hold: 0.2 });
  };
  CUE.power_out = function (v, t) {
    var lp = flt(v, 'lowpass', 600, 0.7); lp.connect(v.out);
    tone(v, t, 118, 1.2, 0.13, { type: 'triangle', to: 36, tt: 1.1, a: 0.01, lin: true, dest: lp }); tone(v, t, 236, 1.0, 0.045, { to: 60, tt: 0.95, a: 0.01, lin: true });
    wood(v, t, 420, 0.13); tone(v, t, 140, 0.07, 0.15, { to: 88 }); nz(v, t, 1.05, 0.035, { buf: 'p', f: 800, to: 120, q: 1, a: 0.02, tt: 1.0, lin: true });
  };
  CUE.candle = function (v, t) {
    nz(v, t, 0.11, 0.6, { buf: 'c', rate: 3.2, f: 3600, q: 1.2, a: 0.005 }); nz(v, t, 0.1, 0.035, { f: 4200, q: 1.5, a: 0.005 });
    nz(v, t + 0.09, 0.55, 0.055, { f: 1500, to: 700, q: 0.8, a: 0.04 }); nz(v, t + 0.12, 0.5, 0.2, { buf: 'c', rate: 0.8, type: 'highpass', f: 3000, a: 0.05 });
  };
  CUE.clock = function (v, t) { wood(v, t, 2300, 0.055); tone(v, t, 620, 0.03, 0.03); };
  CUE.day_end = function (v, t) {
    var ms = [78, 76, 74], i;
    for (i = 0; i < 3; i++) { I.marimba(v, t + i * 0.6, mf(ms[i]), 0.8); I.glock(v, t + i * 0.6, mf(ms[i] + 12), 0.3); }
    I.pluck(v, t + 1.2, mf(50), 0.6, 1.4);
  };
  function chopTick(v, t) { wood(v, t, rr(1700, 2600), 0.07); if (Math.random() < 0.4) wood(v, t + rr(0.05, 0.11), rr(1700, 2600), 0.045); }
  function rainDrop(v, t) { var f = rr(320, 620); tone(v, t, f, 0.05, 0.09, { to: f * 0.7, a: 0.0015 }); nz(v, t, 0.03, 0.04, { f: rr(1800, 3200), q: 1.5, a: 0.001 }); }
  function carPass(v, t) {
    nz(v, t, 3.2, 0.032, { buf: 'p', f: 260, to: 420, q: 0.7, a: 1.4, tt: 1.5, hold: 0.2, lin: true }); nz(v, t, 3.0, 0.007, { f: 1300, q: 0.5, a: 1.4, hold: 0.2, lin: true });
    if (v.pan) { try { var d = Math.random() < 0.5 ? -1 : 1; v.pan.pan.setValueAtTime(-0.7 * d, t); v.pan.pan.linearRampToValueAtTime(0.7 * d, t + 3.2); } catch (e) {} }
  }
  function cricket(v, t) { for (var i = 0; i < 3; i++) tone(v, t + i * 0.055, 4300, 0.04, 0.02, { a: 0.008 }); }
  function blup(v, t) { var f = rr(95, 165); tone(v, t, f, 0.12, 0.15, { to: f * 1.9, tt: 0.07, a: 0.02 }); nz(v, t + 0.06, 0.05, 0.018, { buf: 'p', f: 700, q: 1.5, a: 0.004 }); }
  function spit(v, t) { nz(v, t, rr(0.035, 0.08), 0.07, { f: rr(2600, 4400), q: 2, a: 0.002 }); if (Math.random() < 0.4) tone(v, t, rr(900, 1500), 0.02, 0.035, { a: 0.001 }); }
  var ALIAS = { knob: 'tap', bubble: 'ladle', sizzle: 'drop_oil', drop: 'bowl', pickup: 'tap', ok: 'good', rushed: 'meh', tear: 'page', open: 'ui_open', risk: 'wrong', pour: 'cup', shutter: 'shutter_up' };
  var WANT_PAN = { bus: 1 };
  var TRIM = { shutter_up: 0.63, shutter_down: 0.63, thunder: 0.5, unlock: 0.63, perfect: 0.67, day_end: 0.7, good: 0.7, burnt: 0.8, stamp: 0.8,
    bike: 2.5, sparrow: 2, rooster: 1.4, heart: 2, rack: 2, spoon: 1.6, fish: 1.6, chalk: 1.6, soldout: 1.6, leave: 1.6, bell: 1.8, steam: 1.4, clock: 1.6, lamp: 1.4,
    coin: 1.4, coins: 1.25, rice: 1.4, toss: 1.4, page: 1.25, ui_open: 1.25, note: 1.4, till: 1.25, lid: 1.4, horn: 1.6, serve: 1.25, stir: 1.25, candle: 1.25, noodle: 1.25, crack: 1.25 };
  function Layer(dest, tau, tauDown, shape, build) {
    this.dest = dest; this.tau = tau; this.tauDown = tauDown || tau; this.shape = shape || 1; this.build = build;
    this.target = 0; this.cur = 0; this.app = -1; this.x = 0; this.appx = -1; this.on = false; this.dead = false; this.idle = 0;
    this.nodes = []; this.srcs = []; this.out = null; this.tune = null;
  }
  Layer.prototype.mk = function (n) { this.nodes.push(n); live++; return n; };
  Layer.prototype.src = function (kind, rate) {
    var s = this.mk(ctx.createBufferSource()); s.buffer = bufs[kind]; s.loop = true; if (rate) s.playbackRate.value = rate;
    s.start(ctx.currentTime, Math.random() * ((bufs[kind] && bufs[kind].duration) || 1)); this.srcs.push(s); return s;
  };
  Layer.prototype.filt = function (type, f, q) { var n = this.mk(ctx.createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q || 0.7; return n; };
  Layer.prototype.g = function (v) { var g = this.mk(ctx.createGain()); g.gain.value = v; return g; };
  Layer.prototype.osc = function (type, f) { var o = this.mk(ctx.createOscillator()); o.type = type; o.frequency.value = f; o.start(ctx.currentTime); this.srcs.push(o); return o; };
  Layer.prototype.lfo = function (f, depth, param) { try { var o = this.osc('sine', f), g = this.g(depth); o.connect(g); g.connect(param); } catch (e) {} };
  Layer.prototype.band = function (src, kind, type, f, q, level) {
    var b = this.filt(type, f, q), g = this.g(gl(kind, type, f, q, level)); src.connect(b); b.connect(g); g.connect(this.out); return { f: b, g: g, v: g.gain.value };
  };
  Layer.prototype.open = function () {
    try { this.out = this.g(0); this.out.connect(bus[this.dest]); this.tune = null; this.build(this); this.on = true; this.app = -1; this.appx = -1; this.idle = 0; }
    catch (e) { this.close(); this.dead = true; }
  };
  Layer.prototype.close = function () {
    var i;
    for (i = 0; i < this.srcs.length; i++) { try { this.srcs[i].stop(); } catch (e) {} }
    for (i = 0; i < this.nodes.length; i++) { try { this.nodes[i].disconnect(); } catch (e2) {} }
    live -= this.nodes.length; this.nodes = []; this.srcs = []; this.out = null; this.tune = null; this.on = false;
  };
  Layer.prototype.step = function (dt, now) {
    if (!this.on) { if (this.target > 0.002 && !this.dead) this.open(); if (!this.on) { this.cur = 0; return; } }
    this.cur += (this.target - this.cur) * (1 - Math.exp(-dt / (this.target < this.cur ? this.tauDown : this.tau)));
    if (Math.abs(this.cur - this.target) < 0.002) this.cur = this.target;
    if (Math.abs(this.cur - this.app) > 0.004 || (this.cur === this.target && this.app !== this.cur)) {
      setT(this.out.gain, Math.pow(this.cur, this.shape), 0.03, now); this.app = this.cur;
      if (this.tune) this.tune(this.cur, this.x, now); this.appx = this.x;
    } else if (this.tune && Math.abs(this.x - this.appx) > 0.004) { this.tune(this.cur, this.x, now); this.appx = this.x; }
    if (this.target <= 0.002 && this.cur <= 0.002) { this.idle += dt; if (this.idle > 0.6) this.close(); } else this.idle = 0;
  };
  var loops = {
    pour: new Layer('loop', 0.12, 0, 0.8, function (L) {
      var s = L.src('w'), p = L.src('p'), a = L.band(s, 'w', 'bandpass', 520, 2.2, 0.023), b = L.band(s, 'w', 'bandpass', 1220, 2.5, 0.01);
      var c = L.band(p, 'p', 'lowpass', 320, 0.7, 0.014); L.band(s, 'w', 'highpass', 4200, 0.7, 0.005);
      L.lfo(11.3, a.v * 0.35, a.g.gain); L.lfo(17.9, b.v * 0.4, b.g.gain); L.lfo(6.1, c.v * 0.45, c.g.gain);
      L.tune = function (lv, fill, now) { var f = 520 * Math.pow(3, fill); setT(a.f.frequency, f, 0.06, now); setT(b.f.frequency, f * 2.35, 0.06, now); };
    }),
    grind: new Layer('loop', 0.12, 0, 1, function (L) {
      var p = L.src('p'), c = L.src('c', 1.3), a = L.band(p, 'p', 'lowpass', 240, 0.7, 0.032), b = L.band(p, 'p', 'bandpass', 700, 0.9, 0.013);
      var d = L.filt('bandpass', 1900, 1), g = L.g(0.18); c.connect(d); d.connect(g); g.connect(L.out);
      L.lfo(0.9, a.v * 0.45, a.g.gain); L.lfo(1.8, b.v * 0.4, b.g.gain); L.lfo(0.9, 0.1, g.gain);
    }),
    sizzle: new Layer('loop', 0.12, 0, 0.4, function (L) {
      var s = L.src('w'), c = L.src('c', 1.25), p = L.src('p'), hp = L.filt('highpass', 2600, 0.7), lp = L.filt('lowpass', 7800, 0.5);
      var g = L.g(0.027 / (rms.w * Math.sqrt(5200 / nyq))), bp = L.filt('bandpass', 3900, 0.7), g2 = L.g(0.42), b = L.band(p, 'p', 'bandpass', 380, 1.1, 0.013);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(L.out); c.connect(bp); bp.connect(g2); g2.connect(L.out);
      L.lfo(21, b.v * 0.55, b.g.gain);
      L.tune = function (lv, x, now) { setT(c.playbackRate, 0.85 + 0.75 * lv, 0.1, now); };
    }),
    griddle: new Layer('loop', 0.12, 0, 0.8, function (L) {
      var s = L.src('w'), c = L.src('c', 0.7), bp = L.filt('bandpass', 4300, 0.55), hp = L.filt('highpass', 1900, 0.7), g = L.g(gl('w', 'bandpass', 4300, 0.55, 0.034));
      var b2 = L.filt('bandpass', 2600, 1), g2 = L.g(0.21);
      s.connect(bp); bp.connect(hp); hp.connect(g); g.connect(L.out); c.connect(b2); b2.connect(g2); g2.connect(L.out);
    }),
    boil: new Layer('loop', 0.12, 0, 0.9, function (L) {
      var p = L.src('p'), s = L.src('w'), c = L.src('c', 0.32), a = L.band(p, 'p', 'bandpass', 250, 0.9, 0.034), b = L.band(s, 'w', 'bandpass', 1400, 0.8, 0.011);
      var lp = L.filt('lowpass', 900, 0.7), g = L.g(0.5); c.connect(lp); lp.connect(g); g.connect(L.out);
      L.lfo(5.3, a.v * 0.38, a.g.gain); L.lfo(8.9, a.v * 0.28, a.g.gain); L.lfo(13.1, b.v * 0.5, b.g.gain);
      L.tune = function (lv, x, now) { setT(c.playbackRate, 0.24 + 0.2 * lv, 0.1, now); };
    }),
    simmer: new Layer('loop', 0.12, 0, 1, function (L) { L.band(L.src('p'), 'p', 'lowpass', 200, 0.7, 0.012); }),
    smoke: new Layer('loop', 0.12, 0, 0.9, function (L) {
      var c = L.src('c', 1.9), s = L.src('w'), hp = L.filt('highpass', 2800, 0.7), bp = L.filt('bandpass', 5000, 1.1), g = L.g(0.65);
      c.connect(hp); hp.connect(bp); bp.connect(g); g.connect(L.out); L.band(s, 'w', 'bandpass', 1600, 0.5, 0.019);
    })
  };
  var beds = {
    hum: new Layer('amb', 0.7, 0, 1, function (L) { // 远处车流
      var p = L.src('p'), a = L.band(p, 'p', 'lowpass', 180, 0.7, 0.045); L.band(p, 'p', 'bandpass', 320, 0.8, 0.018); L.lfo(0.07, a.v * 0.3, a.g.gain);
    }),
    air: new Layer('amb', 0.7, 0, 1, function (L) { var a = L.band(L.src('p', 0.8), 'p', 'bandpass', 800, 0.35, 0.011); L.lfo(0.11, a.v * 0.4, a.g.gain); }),
    room: new Layer('amb', 0.7, 0, 1, function (L) { // 屋里的底噪 + 冰柜 100Hz
      var g = L.g(0.006), g2 = L.g(0.002);
      L.band(L.src('p'), 'p', 'lowpass', 300, 0.7, 0.013); L.osc('sine', 100).connect(g); g.connect(L.out); L.osc('sine', 200).connect(g2); g2.connect(L.out);
    }),
    rain: new Layer('amb', 0.6, 0, 0.8, function (L) { // 塑料雨棚：中高频噼啪 + 低频哗 + update 里的大雨点
      var c1 = L.src('c', 1.5), c2 = L.src('c', 0.8), s = L.src('w'), p = L.src('p'), b1 = L.filt('bandpass', 2700, 0.9), g1 = L.g(0.36), b2 = L.filt('bandpass', 950, 1.3), g2 = L.g(0.3);
      c1.connect(b1); b1.connect(g1); g1.connect(L.out); c2.connect(b2); b2.connect(g2); g2.connect(L.out);
      var sp = L.band(s, 'w', 'bandpass', 4600, 0.5, 0.017); L.band(p, 'p', 'lowpass', 450, 0.7, 0.028); L.lfo(0.13, sp.v * 0.25, sp.g.gain);
      L.tune = function (lv, x, now) { setT(c1.playbackRate, 0.9 + 0.8 * lv, 0.2, now); setT(c2.playbackRate, 0.5 + 0.5 * lv, 0.2, now); };
    }),
    crowd: new Layer('amb', 0.8, 0.22, 1.1, function (L) { // 人声嗡嗡：几条共振峰慢慢晃 + 音节起伏
      var p = L.src('p'), lp = L.filt('lowpass', 3200, 0.5), mid = L.g(1), F = [[260, 1.2, 0.011, 2.3, 0.19], [520, 1.6, 0.015, 3.1, 0.23], [1150, 2, 0.012, 4.3, 0.37], [1900, 2.4, 0.006, 5.2, 0.29]], i, f, b, g;
      mid.connect(lp); lp.connect(L.out);
      for (i = 0; i < F.length; i++) {
        f = F[i]; b = L.filt('bandpass', f[0], f[1]); g = L.g(gl('p', 'bandpass', f[0], f[1], f[2])); p.connect(b); b.connect(g); g.connect(mid);
        L.lfo(f[3], g.gain.value * 0.42, g.gain); L.lfo(f[3] * 0.37, g.gain.value * 0.25, g.gain); L.lfo(f[4], f[0] * 0.2, b.frequency);
      }
    })
  };
  var PLACE = {
    street: { hum: 1, air: 0.9, room: 0, birds: 0.55, bike: 1, cars: 1, crowd: 0.4, rain: 1, night: 0 },
    shop: { hum: 0.4, air: 0.25, room: 1, birds: 0.7, bike: 0.35, cars: 0.45, crowd: 1, rain: 0.85, night: 0 },
    night: { hum: 0.1, air: 0, room: 0.3, birds: 0, bike: 0, cars: 0.06, crowd: 0, rain: 0.55, night: 1 },
    title: { hum: 0.4, air: 0.4, room: 0.25, birds: 0.35, bike: 0.2, cars: 0.25, crowd: 0.4, rain: 0.8, night: 0 }
  }, NOPLACE = { hum: 0, air: 0, room: 0, birds: 0, bike: 0, cars: 0, crowd: 0.6, rain: 0.8, night: 0 };
  var tg = { birds: 0, bike: 0, cars: 0, night: 0 }, sm = { birds: 0, bike: 0, cars: 0, night: 0 };
  var ev = { bird: 3, bike: 8, car: 5, tick: 1, cricket: 2, chop: 1, drop: 0.5, blup: 0.5, spit: 0.3, alt: 0 };
  function targets() {
    var pl = has(PLACE, scene.place) ? PLACE[scene.place] : NOPLACE, d = scene.dawn, r = scene.rain;
    beds.hum.target = pl.hum * (0.6 + 0.4 * d); beds.air.target = pl.air; beds.room.target = pl.room;
    beds.rain.target = r * pl.rain; beds.crowd.target = scene.crowd * pl.crowd;
    tg.birds = (scene.place === 'shop' ? pl.birds * (1 - d) : pl.birds * (0.6 + 0.4 * d)) * (1 - 0.8 * r); // 店里：天亮了鸟声退掉；下雨鸟躲起来
    tg.bike = pl.bike * (1 - 0.7 * r); tg.cars = pl.cars * (0.5 + 0.5 * d); tg.night = pl.night;
  }
  function amb(fn, vol, pitch, pan) { spawn('amb', bus.amb, fn, vol, pitch, pan); }
  function events(dt) {
    var k = 1 - Math.exp(-dt / 0.6), key, c, r;
    for (key in tg) sm[key] += (tg[key] - sm[key]) * k;
    if (sm.birds > 0.04) { if ((ev.bird -= dt) <= 0) { ev.bird = rr(2.5, 8) / (0.3 + sm.birds); amb(CUE.sparrow, 0.3 + 0.9 * sm.birds, rr(0.9, 1.15), rr(-0.8, 0.8)); } } else ev.bird = rr(1, 4);
    if (sm.bike > 0.05) { if ((ev.bike -= dt) <= 0) { ev.bike = rr(14, 34) / (0.4 + sm.bike); amb(CUE.bike, 0.25 + 0.6 * sm.bike, rr(0.95, 1.08), rr(-0.7, 0.7)); } } else ev.bike = rr(5, 12);
    if (sm.cars > 0.04) { if ((ev.car -= dt) <= 0) { ev.car = rr(9, 22) / (0.4 + sm.cars); amb(carPass, 0.5 + 0.5 * sm.cars, rr(0.85, 1.2), 0.01); } } else ev.car = rr(3, 9);
    if (sm.night > 0.3) {
      if ((ev.tick -= dt) <= 0) { ev.tick = ev.tick < -1 ? 1 : ev.tick + 1; ev.alt = 1 - ev.alt; amb(CUE.clock, 0.9 * sm.night, ev.alt ? 1 : 0.88, 0.3); }
      if ((ev.cricket -= dt) <= 0) { ev.cricket = rr(1.4, 4.5); amb(cricket, 1.2 * sm.night, 1, -0.5); }
    }
    c = beds.crowd.cur;
    if (c > 0.05 && (ev.chop -= dt) <= 0) { ev.chop = rr(0.5, 2.2) / (0.3 + c); r = Math.random(); amb(r < 0.55 ? chopTick : r < 0.8 ? CUE.spoon : CUE.bowl, rr(0.4, 0.8) * (0.4 + 0.6 * c), rr(0.9, 1.2), rr(-0.7, 0.7)); }
    c = beds.rain.cur;
    if (c > 0.05 && (ev.drop -= dt) <= 0) { ev.drop = rr(0.15, 0.7) / (0.25 + c); amb(rainDrop, rr(0.3, 0.7) * (0.4 + 0.6 * c), 1, rr(-0.6, 0.6)); }
    c = loops.simmer.cur;
    if (c > 0.03 && (ev.blup -= dt) <= 0) { ev.blup = rr(0.25, 1.15) / (0.35 + 0.65 * c); spawn('lp', bus.loop, blup, 0.5 + 0.5 * c, 1, rr(-0.2, 0.2)); }
    c = loops.smoke.cur;
    if (c > 0.03 && (ev.spit -= dt) <= 0) { ev.spit = rr(0.08, 0.42) / (0.3 + 0.7 * c); spawn('lp', bus.loop, spit, rr(0.5, 1) * c, 1, 0); }
  }
  var GONG = [0, 2, 4, 7, 9], YU = [0, 3, 5, 7, 10], ZHI = [0, 2, 5, 7, 9];
  var SPARSE = [[[0, 4], [4, 4]], [[0, 2], [2, 6]], [[0, 3], [3, 1], [4, 4]], [[2, 2], [4, 4]], [[0, 6], [6, 2]]];
  var MID = [[[0, 2], [2, 2], [4, 4]], [[0, 3], [3, 1], [4, 2], [6, 2]], [[0, 2], [2, 1], [3, 1], [4, 4]], [[0, 4], [4, 2], [6, 2]]];
  var BUSY = [[[0, 2], [2, 1], [3, 1], [4, 4]], [[0, 1], [1, 1], [2, 2], [4, 2], [6, 2]], [[0, 3], [3, 1], [4, 2], [6, 2]], [[1, 1], [2, 2], [4, 1], [5, 3]], [[0, 2], [3, 1], [4, 2], [6, 1], [7, 1]]];
  var HES = [[[0, 1], [3, 1], [4, 2], [6, 2]], [[0, 2], [3, 1], [5, 3]], [[1, 1], [3, 1], [4, 4]]];
  var UP = [[0, 1, 2, 3], [0, 2, 3, 4], [0, 3, 4, 5]], DOWN = [[5, 4, 3, 2], [3, 2, 1, 0], [5, 3, 2, 1]];
  var LEIT = [[0, 2, 2], [2, 1, 3], [3, 1, 4], [4, 2, 3], [6, 2, 2], [8, 2, 4], [10, 1, 5], [11, 1, 4], [12, 2, 3], [14, 2, 2], [16, 2, 1], [18, 2, -1], [20, 8, 0]];
  var LEIT_BASS = [[0, 0], [8, -1], [16, 1], [20, 0]];
  var LEIT_BAR = [{ s: 0, l: 2, d: 2 }, { s: 2, l: 1, d: 3 }, { s: 3, l: 1, d: 4 }, { s: 4, l: 2, d: 3 }, { s: 6, l: 2, d: 2 }];
  var M = {
    dawn: { bpm: 54, root: 74, sc: GONG, lead: 'glock', lo: 0, hi: 7, cells: SPARSE, dens: 0.8, vel: 0.5, form: ['A', '-', 'R', '-', '-'], bass: 0.35, hum: 0.02, lead_in: 0.8, leit: [{ s: 0, l: 2, d: 2 }, { s: 2, l: 2, d: 3 }, { s: 4, l: 4, d: 4 }] },
    open: { bpm: 92, once: true, gen: function () { return genLeit(false); } },
    rush: { bpm: 100, root: 74, sc: GONG, lead: 'kalimba', lo: -1, hi: 7, cells: BUSY, dens: 0.9, vel: 0.6, form: ['A', 'A2', 'B', 'C'], bass: 'walk', pulse: true, bright: true, hum: 0.01, leit: LEIT_BAR },
    lull: { bpm: 76, root: 74, sc: GONG, lead: 'kalimba', lo: -2, hi: 5, cells: MID, dens: 0.8, vel: 0.5, form: ['A', '-', 'R', '-'], bass: 'bar', hum: 0.014, leit: LEIT_BAR },
    close: { bpm: 66, root: 74, sc: GONG, lead: 'kalimba', lo: -1, hi: 8, cells: MID, dens: 0.85, vel: 0.46, form: ['A', 'B', 'C', '-', '-'], bass: 'bar', dir: -1, start: [5, 6, 7], hum: 0.016 },
    night: { bpm: 44, lead_in: 1.5, gen: genNight },
    story: { bpm: 60, root: 69, sc: ZHI, lead: 'kalimba', lo: -1, hi: 5, cells: HES, dens: 1, vel: 0.4, form: ['A', '-', 'R', '-', '-'], bass: 0.25, rep: true, hum: 0.03, lead_in: 0.6 },
    tense: { bpm: 58, root: 59, sc: YU, lead: 'kalimba', lo: 0, hi: 5, cells: SPARSE, dens: 0.9, vel: 0.44, form: ['A', '-', 'A2', '-', 'B', '-', '-'], bass: 'drone', lean: true, hum: 0.012, lead_in: 0.6 },
    ending: { bpm: 60, once: true, lead_in: 0.6, gen: function () { return genLeit(true); } }
  };
  var seq = { mood: null, ev: [], i: 0, t0: 0, sd: 0.3, len: 0, done: false, sections: 0, notes: 0 }, mem = { k: 0 }, seed = 20261029, humz = 0.01;
  function mr() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function pick(a) { return a[Math.floor(mr() * a.length)]; }
  function deg(root, sc, d) { var o = Math.floor(d / 5); return root + 12 * o + sc[d - 5 * o]; }
  function near(d, set, avoid) { var ks = [0, -1, 1, -2, 2, -3, 3], i, x; for (i = 0; i < 7; i++) { x = d + ks[i]; if (x !== avoid && set.indexOf(((x % 5) + 5) % 5) >= 0) return x; } return d; }
  function N(s, inst, m, v, l, pan) { return { s: s, inst: inst, m: m, v: v * (0.9 + mr() * 0.2), l: l, o: (mr() - 0.5) * 2 * humz, pan: pan || 0 }; }
  function motif(c) {
    var cell = pick(c.cells), d = pick(c.start || [0, 2, 3, 5]), out = [], i, r, st;
    for (i = 0; i < cell.length; i++) {
      if (i > 0) {
        if (c.rep && i === 1) st = 0; // 迟疑：同一个音再试一次
        else {
          r = mr(); st = r < 0.3 ? -1 : r < 0.6 ? 1 : r < 0.72 ? -2 : r < 0.84 ? 2 : r < 0.92 ? 0 : (mr() < 0.5 ? -3 : 3);
          if (c.dir && mr() < 0.65) st = -Math.abs(st) || -1;
          if (st === 0 && (c.rep || i === 1)) st = mr() < 0.5 ? -1 : 1; // 不让动机原地踏步
        }
        if (d + st > c.hi || d + st < c.lo) st = -st; // 碰到音区边界就折回去
        d = clamp(d + st, c.lo, c.hi);
      }
      if (i > 0 && i < cell.length - 1 && mr() > c.dens) continue; // 抽稀在生成动机时定下，重复时保持一致
      out.push({ s: cell[i][0], l: cell[i][1], d: d });
    }
    return out;
  }
  function bar(tok, mot, c, sh) {
    var out = [], i, n, last;
    if (tok === 'B' && c.lean) { i = (mem.k % 2) ? 1 : 8; return [{ s: 0, l: 3, m: c.root + i, v: 0.85 }, { s: 3, l: 5, m: c.root + i - 1, v: 0.7 }]; } // 小二度叹息
    for (i = 0; i < mot.length; i++) { n = mot[i]; if (tok === 'C' && i > 0 && n.s >= 4) break; out.push({ s: n.s, l: n.l, d: n.d + (tok === 'B' ? sh : 0) }); }
    last = out[out.length - 1];
    if (tok === 'A2') last.d = near(last.d, [0, 2, 3], last.d);      // 答句：落在稳定音
    else if (tok === 'B') last.d = near(last.d, [1, 4]);             // 问句：悬在商/羽
    else if (tok === 'C') out.push({ s: 4, l: 4, d: c.dir ? Math.floor((last.d - 1) / 5) * 5 : near(last.d, [0]), fin: true }); // 收束：回宫（打烊时往下落）
    return out;
  }
  function gen(name) {
    var c = M[name], out = [], form, b, tok, ns, i, n, m, resp, sh, br, w;
    humz = c.hum || 0.01;
    if (c.gen) return c.gen(c);
    br = c.root - 24;
    if (!mem.mot) mem.mot = (c.leit && mr() < 0.5) ? c.leit.slice() : motif(c);
    else if (mr() > 0.62) mem.mot = motif(c);
    else if (mr() < 0.3 && mem.mot.length > 2) { ns = mem.mot.slice(); i = 1 + Math.floor(mr() * (ns.length - 2)); ns[i] = { s: ns[i].s, l: ns[i].l, d: ns[i].d + (mr() < 0.5 ? -1 : 1) }; mem.mot = ns; }
    resp = ['B', 'A2', 'C'][mem.k % 3]; sh = c.dir ? -(1 + (mr() < 0.4 ? 1 : 0)) : pick([-2, -1, 1, 2]);
    form = c.form.slice(); if (c.pulse && mr() < 0.35) form.push('-');
    if (!mem.wu || mr() < 0.3) { mem.wu = pick(UP); mem.wd = pick(DOWN); }
    for (b = 0; b < form.length; b++) {
      tok = form[b] === 'R' ? resp : form[b];
      if (tok !== '-') {
        ns = bar(tok, mem.mot, c, sh);
        for (i = 0; i < ns.length; i++) {
          n = ns[i]; m = n.m !== undefined ? n.m : deg(c.root, c.sc, n.d);
          out.push(N(b * 8 + n.s, c.lead, m, c.vel * (n.v || 1) * (n.s % 4 === 0 ? 1.08 : 0.94), n.l));
          if (n.fin && c.bright) out.push(N(b * 8 + n.s, 'glock', m + 12, c.vel * 0.45, n.l));
        }
        if (c.bass === 'bar') out.push(N(b * 8, 'pluck', deg(br, c.sc, tok === 'B' ? 3 : 0), 0.5, 6));
        else if (c.bass === 'drone') { if (tok === 'A') out.push(N(b * 8, 'pluck', c.root - 12, 0.55, 8)); }
        else if (typeof c.bass === 'number' && tok === 'A' && mr() < c.bass) out.push(N(b * 8, 'pluck', br, 0.45, 8));
      }
      if (c.bass === 'walk') { w = b % 2 ? mem.wd : mem.wu; for (i = 0; i < 4; i++) out.push(N(b * 8 + i * 2, 'pluck', deg(br, c.sc, w[i]), i === 0 ? 0.5 : 0.4, 2)); } // 走动的低音
      if (c.pulse) for (i = 1; i < 8; i += 2) out.push(N(b * 8 + i, 'tick', deg(c.root, c.sc, b % 2 ? 3 : 5), 0.4, 1, 0.3));                                         // 稳定的后半拍
    }
    mem.k++;
    return { len: form.length * 8, ev: out };
  }
  function genLeit(slow) {
    var out = [], i, n, m, ch = [62, 69, 78];
    for (i = 0; i < LEIT.length; i++) {
      n = LEIT[i]; m = deg(74, GONG, n[2]);
      out.push(N(n[0], 'kalimba', m, 0.6, n[1]));
      if (slow || n[0] % 8 === 0 || n[0] === 20) out.push(N(n[0], 'glock', m + 12, slow ? 0.3 : 0.36, n[1]));
    }
    for (i = 0; i < LEIT_BASS.length; i++) out.push(N(LEIT_BASS[i][0], 'pluck', deg(50, GONG, LEIT_BASS[i][1]), 0.5, 6));
    if (slow) for (i = 0; i < 3; i++) out.push(N(20, 'pad', ch[i], i === 0 ? 0.6 : 0.4, 12)); // 最后一个音托住
    return { len: slow ? 44 : 30, ev: out };
  }
  function genNight() {
    var d, out;
    if (!mem.cyc) { mem.cyc = pick([[0, 3, 2, 0], [0, 2, 3, 0], [3, 2, 1, 0]]); mem.i = 0; }
    d = mem.cyc[mem.i++ % 4]; out = [N(0, 'low', deg(59, YU, d), 0.5, 7)];
    if (mr() < 0.55) out.push(N(3 + Math.floor(mr() * 3), 'low', deg(59, YU, Math.min(d + pick([2, 3]), 4)), 0.3, 5)); // 偶尔有个回声似的答音
    return { len: 12 + 4 * Math.floor(mr() * 3), ev: out }; // 8~14 秒一句，其余是空白
  }
  function section() {
    var s = gen(seq.mood);
    s.ev.sort(function (a, b) { return (a.s - b.s) || (a.o - b.o); });
    seq.ev = s.ev; seq.len = s.len; seq.i = 0; seq.sections++;
  }
  function note(e, t) {
    seq.notes++;
    spawn('mus', bus.mus, function (v) { I[e.inst](v, t, mf(e.m), e.v, e.l * seq.sd); }, 1, 1, e.pan);
  }
  function sequencer(now) {
    var hz = now + 0.22, guard = 0, e, te, end;
    if (seq.mood !== scene.music) {
      seq.mood = scene.music; seq.done = false; seq.ev = []; seq.i = 0; seq.len = 0; mem = { k: 0 };
      if (seq.mood) { seq.sd = 30 / M[seq.mood].bpm; seq.t0 = now + (M[seq.mood].lead_in || 0.3); section(); }
    }
    if (!seq.mood || seq.done) return;
    while (guard++ < 48) {
      if (seq.i >= seq.ev.length) {
        end = seq.t0 + seq.len * seq.sd;
        if (end > hz) break;
        if (M[seq.mood].once) { seq.done = true; break; }
        seq.t0 = Math.max(end, now + 0.05); section(); continue;
      }
      e = seq.ev[seq.i]; te = seq.t0 + e.s * seq.sd + e.o;
      if (te > hz) break;
      seq.i++;
      if (te < now - 0.12) continue; // 掉帧/切后台回来：过期的音不补
      note(e, Math.max(te, now + 0.004));
    }
  }
  Au.init = function (P, settings) { Au.P = P || null; if (settings && typeof settings.seed === 'number') seed = settings.seed | 0; Au.setVolumes(settings); };
  Au.setVolumes = function (st) {
    if (st && typeof st === 'object') { Au.vol.music = clamp(num(st.music, Au.vol.music), 0, 1); Au.vol.sfx = clamp(num(st.sfx, Au.vol.sfx), 0, 1); }
    if (ctx) { try { mix(ctx.currentTime, false); } catch (e) {} }
  };
  Au.unlock = function () {
    var c = null, p;
    try {
      if (!ctx) {
        if (!Au.P || typeof Au.P.audio !== 'function' || tries > 2) return;
        try { c = Au.P.audio(); } catch (e) { c = null; }
        if (!c) return;
        tries++;
        if (!c.createGain || !c.createOscillator || !c.createBufferSource || !c.createBuffer || !c.createBiquadFilter || !c.destination) return;
        try { build(c); } catch (e2) { ctx = null; Au.ctx = null; return; }
      }
      paused = false;
      if (ctx.state === 'suspended' && ctx.resume) { p = ctx.resume(); if (p && p['catch']) p['catch'](noop); }
    } catch (e3) {}
  };
  Au.pause = function () { paused = true; if (ctx && ctx.suspend) { try { var p = ctx.suspend(); if (p && p['catch']) p['catch'](noop); } catch (e) {} } };
  Au.resume = function () { paused = false; if (ctx && ctx.resume) { try { var p = ctx.resume(); if (p && p['catch']) p['catch'](noop); } catch (e) {} } };
  Au.setDuck = function (on) { duck = !!on; if (ctx) { try { mix(ctx.currentTime, false); } catch (e) {} } };
  Au.play = function (name, opts) {
    try {
      Au.log.push(name); if (Au.log.length > 30) Au.log.shift();
      if (has(ALIAS, name)) name = ALIAS[name];
      if (!ctx || paused || Au.muted || !has(CUE, name) || ctx.state === 'closed') return;
      var now = ctx.currentTime, o = opts || E;
      if (lastAt[name] !== undefined && now >= lastAt[name] && now - lastAt[name] < 0.04) return; // 同名音效至少隔 40ms
      lastAt[name] = now;
      spawn('sfx', bus.one, CUE[name], clamp(num(o.vol, 1), 0, 2) * (TRIM[name] || 1), clamp(num(o.pitch, 1), 0.25, 4), clamp(num(o.pan, 0), -1, 1), WANT_PAN[name]);
    } catch (e) {}
  };
  Au.loop = function (name, level, x) {
    if (!has(loops, name)) return;
    loops[name].target = clamp(num(level, 0), 0, 1);
    if (x !== undefined) loops[name].x = clamp(num(x, 0), 0, 1);
  };
  Au.setScene = function (o) {
    if (!o || typeof o !== 'object') return;
    if (o.place !== undefined) scene.place = has(PLACE, o.place) ? o.place : null;
    if (o.rain !== undefined) scene.rain = clamp(num(o.rain, 0), 0, 1);
    if (o.crowd !== undefined) scene.crowd = clamp(num(o.crowd, 0), 0, 1);
    if (o.dawn !== undefined) scene.dawn = clamp(num(o.dawn, 0), 0, 1);
    if (o.music !== undefined) scene.music = has(M, o.music) ? o.music : null;
    targets();
  };
  var OLD = { morning: { place: 'shop', dawn: 0.5, music: 'lull' }, noon: { place: 'shop', dawn: 1, music: 'lull' }, rain: { place: 'shop', dawn: 0.6, music: 'lull' }, dusk: { place: 'shop', dawn: 1, music: 'close' }, night: { place: 'night', dawn: 0, music: 'night' }, story: { music: 'story' } };
  Au.setAmbience = function (mood, rain) {
    var o = has(OLD, mood) ? OLD[mood] : {};
    Au.mood = mood; Au.setScene({ place: o.place, dawn: o.dawn, music: o.music, rain: rain ? 0.8 : 0 });
  };
  Au.update = function (dt) {
    if (!ctx || paused || (ctx.state && ctx.state !== 'running')) return;
    try {
      var now = ctx.currentTime, k;
      dt = clamp(num(dt, 1 / 60), 0, 0.1);
      reap(now);
      for (k in loops) loops[k].step(dt, now);
      for (k in beds) beds[k].step(dt, now);
      mix(now, false);
      events(dt);
      sequencer(now);
    } catch (e) {}
  };
  Au.state = function () {
    var lv = {}, k, n = 0;
    for (k in loops) { lv[k] = Math.round(loops[k].cur * 1000) / 1000; if (loops[k].on) n++; }
    for (k in beds) if (beds[k].on) n++;
    return {
      running: !!ctx && !paused && (!ctx.state || ctx.state === 'running'), hasCtx: !!ctx, paused: paused, duck: duck,
      voices: pools.sfx.length, musicVoices: pools.mus.length, ambVoices: pools.amb.length + pools.lp.length, layers: n, nodes: live,
      scene: { place: scene.place, rain: scene.rain, crowd: scene.crowd, dawn: scene.dawn, music: scene.music },
      music: { mood: seq.mood, done: seq.done, sections: seq.sections, notes: seq.notes }, loops: lv,
      vol: { music: Au.vol.music, sfx: Au.vol.sfx }, last: Au.log.slice(-6)
    };
  };
  Au.cues = (function () { var a = [], k; for (k in CUE) a.push(k); return a; })();
  Au.aliases = ALIAS;
  return Au;
});
;
/* ui/ui.js */
BSX.define('ui/ui', function (require) {
  var A = require('game/assets');
  var FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
  var KAI = '"STKaiti","Kaiti SC","KaiTi","楷体","BiauKai","AR PL UKai CN","Songti SC","STSong","Noto Serif CJK SC","SimSun",serif';
  var COL = { ink: '#3b2a1a', paper: '#f6ecd6', paper2: '#efe0bf', wood: '#a86b3c', woodDark: '#6e4224', teal: '#2f6f66', tealDark: '#1f4d47', cream: '#fff8e8', red: '#b8432f', gold: '#e8b54a', shadow: 'rgba(30,18,8,.35)', mute: '#8d7a60', green: '#4f8a4b' };
  var U = { hits: [], pressed: null, hover: null, focusIdx: -1, keyboard: false, textScale: 1, time: 0, FONT: FONT, COL: COL, tips: [] };
  U.begin = function () { U.hits = []; };
  U.hit = function (id, x, y, w, h, o) {
    o = o || {};
    var minS = o.minSize == null ? 56 : o.minSize, ex = Math.max(0, (minS - w) / 2), ey = Math.max(0, (minS - h) / 2);
    var hit = { id: id, x: x - ex, y: y - ey, w: w + ex * 2, h: h + ey * 2, vx: x, vy: y, vw: w, vh: h, onTap: o.onTap, onDown: o.onDown, disabled: !!o.disabled, label: o.label || id, kind: o.kind || 'button', cursor: o.cursor || 'pointer', data: o.data };
    U.hits.push(hit);
    return { pressed: U.pressed === id && !hit.disabled, hover: U.hover === id, focus: U.keyboard && U.focusIdx >= 0 && U.focusable()[U.focusIdx] === hit, hit: hit };
  };
  U.find = function (x, y) { for (var i = U.hits.length - 1; i >= 0; i--) { var h = U.hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; };
  U.focusable = function () { return U.hits.filter(function (h) { return h.onTap && !h.disabled; }); };
  U.font = function (size, weight, kai) { return (weight || 'normal') + ' ' + Math.round(size * U.textScale) + 'px ' + (kai ? KAI : FONT); };
  U.KAI = KAI;
  U.text = function (ctx, str, x, y, o) {
    o = o || {}; var size = o.size || 22;
    ctx.save();
    ctx.font = U.font(size, o.weight || (o.bold ? 'bold' : 'normal'), o.kai);
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.maxW) { var m = ctx.measureText(str).width; if (m > o.maxW) { ctx.font = U.font(size * o.maxW / m, o.weight || (o.bold ? 'bold' : 'normal'), o.kai); } }
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || Math.max(3, size * 0.22); ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowOffsetY = 2; ctx.shadowBlur = 0; }
    ctx.fillStyle = o.color || COL.ink; ctx.fillText(str, x, y);
    ctx.restore();
  };
  U.wrap = function (ctx, str, maxW, size, weight, kai) {
    ctx.save(); ctx.font = U.font(size, weight, kai); var lines = [], line = '';
    for (var i = 0; i < str.length; i++) { var ch = str[i]; if (ch === '\n') { lines.push(line); line = ''; continue; } var t = line + ch; if (ctx.measureText(t).width > maxW && line) { if ('，。！？、”：；）…—》」'.indexOf(ch) >= 0) { line = t; continue; } lines.push(line); line = ch; } else line = t; }
    if (line) lines.push(line); ctx.restore(); return lines;
  };
  U.para = function (ctx, str, x, y, maxW, o) { o = o || {}; var size = o.size || 22, lh = o.lh || size * 1.5; var lines = U.wrap(ctx, str, maxW, size, o.weight || (o.bold ? 'bold' : undefined), o.kai); lines.forEach(function (l, i) { U.text(ctx, l, x, y + i * lh * U.textScale, o); }); return lines.length * lh * U.textScale; };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
  U.rr = rr;
  U.panel = function (ctx, x, y, w, h, style, o) {
    o = o || {};
    var S = { paper: [COL.paper, COL.woodDark, COL.paper2], wood: ['#c88a52', COL.woodDark, '#b07440'], dark: ['rgba(28,22,16,.82)', 'rgba(255,240,210,.35)', 'rgba(0,0,0,0)'], teal: [COL.teal, COL.tealDark, '#3b8076'], cream: [COL.cream, '#c8a878', COL.paper] }[style || 'paper'];
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = COL.shadow; rr(ctx, x + 3, y + 5, w, h, 12); ctx.fill();
    ctx.fillStyle = S[0]; rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = S[1]; ctx.stroke();
    if (style === 'paper' || style === 'cream') { ctx.strokeStyle = S[2]; ctx.lineWidth = 2; rr(ctx, x + 6, y + 6, w - 12, h - 12, 8); ctx.stroke(); }
    if (style === 'wood') { ctx.strokeStyle = 'rgba(80,40,10,.18)'; ctx.lineWidth = 2; for (var i = y + 10; i < y + h - 6; i += 9) { ctx.beginPath(); ctx.moveTo(x + 8, i); ctx.bezierCurveTo(x + w * 0.3, i + 3, x + w * 0.7, i - 3, x + w - 8, i); ctx.stroke(); } }
    ctx.restore();
  };
  U.button = function (ctx, id, x, y, w, h, label, o) {
    o = o || {};
    var st = U.hit(id, x, y, w, h, { onTap: o.onTap, disabled: o.disabled, label: label || o.aria || id, minSize: o.minSize });
    var press = st.pressed ? 3 : 0, kind = o.kind || 'primary';
    var fill = { primary: COL.teal, wood: '#b9773f', paper: COL.cream, ghost: 'rgba(255,248,232,.12)', red: COL.red }[kind];
    var line = { primary: COL.tealDark, wood: COL.woodDark, paper: '#b48c5a', ghost: 'rgba(255,248,232,.6)', red: '#6d2014' }[kind];
    var tc = kind === 'paper' ? COL.ink : COL.cream;
    ctx.save();
    if (o.disabled) ctx.globalAlpha *= 0.42;
    if (kind !== 'ghost') { ctx.fillStyle = COL.shadow; rr(ctx, x, y + 5, w, h, 10); ctx.fill(); }
    ctx.fillStyle = o.selected ? COL.gold : fill; rr(ctx, x, y + press, w, h - 1, 10); ctx.fill();
    ctx.lineWidth = o.selected ? 4 : 3; ctx.strokeStyle = o.selected ? COL.woodDark : line; ctx.stroke();
    if (st.hover && !o.disabled) { ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(ctx, x, y + press, w, h - 1, 10); ctx.fill(); }
    if (kind !== 'ghost') { ctx.fillStyle = 'rgba(255,255,255,.16)'; rr(ctx, x + 4, y + 3 + press, w - 8, Math.max(4, h * 0.22), 6); ctx.fill(); }
    var tx = x + w / 2;
    if (o.icon) { var is = Math.min(h - 10, 44); A.cell(ctx, o.icon[0], o.icon[1], label ? x + 10 : x + (w - is) / 2, y + (h - is) / 2 + press, is, is, { trim: true, fit: true, anchor: 'center' }); if (label) tx = x + 10 + is + (w - 20 - is) / 2; }
    if (label) U.text(ctx, label, tx, y + h / 2 + press + 1, { size: o.size || 24, align: 'center', base: 'middle', color: o.selected ? COL.ink : tc, bold: true, maxW: w - (o.icon ? 64 : 16) });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); rr(ctx, x - 5, y - 5, w + 10, h + 10, 12); ctx.stroke(); }
    ctx.restore();
    return st;
  };
  U.iconButton = function (ctx, id, x, y, s, atlasIdx, o) {
    o = o || {};
    var st = U.hit(id, x, y, s, s, { onTap: o.onTap, disabled: o.disabled, label: o.aria || id });
    var p = st.pressed ? 0.9 : st.hover ? 1.06 : 1;
    ctx.save(); if (o.disabled) ctx.globalAlpha *= 0.4;
    ctx.translate(x + s / 2, y + s / 2); ctx.scale(p, p);
    A.cell(ctx, 'atlas_ui', atlasIdx, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    ctx.restore();
    if (st.focus) { ctx.save(); ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); rr(ctx, x - 4, y - 4, s + 8, s + 8, 10); ctx.stroke(); ctx.restore(); }
    return st;
  };
  U.ring = function (ctx, x, y, r, frac, color, width) {
    ctx.save(); ctx.lineWidth = width || 6; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac))); ctx.stroke(); ctx.restore();
  };
  U.bubble = function (ctx, x, y, w, h, tailX, o) {
    o = o || {};
    ctx.save(); ctx.fillStyle = o.fill || COL.cream; ctx.strokeStyle = o.line || '#7d5a35'; ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tailX - 10, y + h - 1); ctx.lineTo(tailX, y + h + 14); ctx.lineTo(tailX + 10, y + h - 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tailX - 10, y + h); ctx.lineTo(tailX, y + h + 14); ctx.lineTo(tailX + 10, y + h); ctx.stroke();
    ctx.restore();
  };
  U.coin = function (n) { var y = Math.round(n) / 100; return (Math.abs(y) >= 100 ? Math.round(y) : Math.round(y * 10) / 10).toString(); };
  U.yuan = function (fen, sign) { var s = (fen < 0 ? '−' : sign && fen > 0 ? '+' : '') + U.coin(Math.abs(fen)); return s + '元'; };
  return U;
});
;
/* ui/kit.js */
BSX.define('ui/kit', function (require) {
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var C = require('content/config');
  var K = {};
  var INK = '#3b2a1a', PAPER = '#fbf5e4', WOOD = '#b9793f', WOODD = '#6e4224', TEAL = '#2f6f66', RED = '#b8432f';
  K.col = { ink: INK, paper: PAPER, wood: WOOD, woodD: WOODD, teal: TEAL, red: RED, mute: '#8d7a60', gold: '#e8b54a' };
  K.weather = function (ctx, w, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
    if (w === 'sun') { ctx.fillStyle = '#f0a830'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#f0a830'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + (t || 0) * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke(); } }
    else { ctx.fillStyle = w === 'rain' ? '#8fa2b4' : '#c4ccd2'; ctx.beginPath(); ctx.arc(-7, 0, 8, 0, 7); ctx.arc(3, -5, 10, 0, 7); ctx.arc(11, 1, 7, 0, 7); ctx.fill(); ctx.fillRect(-8, 0, 20, 8); if (w === 'rain') { ctx.strokeStyle = '#4a8ab8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-8 + j * 9, 12); ctx.lineTo(-11 + j * 9, 19); ctx.stroke(); } } }
    ctx.restore();
  };
  K.weatherName = { sun: '晴', cloud: '阴', rain: '雨' };
  K.dayChip = function (ctx, s, x, y, t) {
    ctx.fillStyle = 'rgba(30,18,8,.3)'; U.rr(ctx, x + 2, y + 4, 168, 54, 8); ctx.fill();
    ctx.fillStyle = PAPER; U.rr(ctx, x, y, 168, 54, 8); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = RED; U.rr(ctx, x + 3, y + 3, 58, 48, 6); ctx.fill();
    U.text(ctx, '第', x + 14, y + 22, { size: 13, color: '#ffe9d0', bold: true });
    U.text(ctx, String(s.day), x + 32, y + 43, { size: 30, bold: true, align: 'center', color: '#fff8e8' });
    U.text(ctx, '天', x + 50, y + 43, { size: 13, color: '#ffe9d0', bold: true, align: 'center' });
    K.weather(ctx, s.today ? s.today.weather : 'sun', x + 86, y + 26, 34, t);
    U.text(ctx, K.weatherName[s.today ? s.today.weather : 'sun'], x + 108, y + 24, { size: 17, bold: true, color: INK });
    U.text(ctx, s.day >= s.days ? '月底' : '还剩 ' + (s.days - s.day) + ' 天', x + 108, y + 44, { size: 14, color: '#8d7a60' });
  };
  K.tin = function (ctx, x, y, cash, pop) {
    var k = 1 + (pop || 0) * 0.12;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(30,18,8,.3)'; U.rr(ctx, -28, -14, 60, 40, 6); ctx.fill();
    ctx.fillStyle = '#4f8a80'; U.rr(ctx, -30, -18, 60, 40, 6); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#3b6f66'; ctx.fillRect(-30, -6, 60, 4); ctx.fillStyle = '#e8b54a'; U.rr(ctx, -7, -9, 14, 10, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-25, -15, 50, 3);
    ctx.restore();
    var str = '¥' + (cash / 100).toFixed(cash % 100 ? 1 : 0), neg = cash < 0;
    U.text(ctx, str, x + 40, y + 12, { size: 26, bold: true, color: neg ? '#ffb0a0' : '#fff8e8', stroke: 'rgba(50,28,10,.9)', strokeW: 5 });
  };
  K.icon = function (ctx, kind, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.fillStyle = col || PAPER; ctx.strokeStyle = col || PAPER; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'pause') { ctx.fillRect(-7, -8, 5, 16); ctx.fillRect(2, -8, 5, 16); }
    else if (kind === 'book') { U.rr(ctx, -9, -10, 18, 20, 2); ctx.fill(); ctx.fillStyle = TEAL; ctx.fillRect(-5, -6, 10, 3); ctx.fillRect(-5, 0, 7, 3); }
    else if (kind === 'gear') { for (var i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.fillRect(-2.5, -11, 5, 6); ctx.restore(); } ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); }
    else if (kind === 'close') { ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke(); }
    else if (kind === 'back') { ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(-5, 0); ctx.lineTo(4, 8); ctx.stroke(); }
    else if (kind === 'play') { ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(8, 0); ctx.lineTo(-5, 8); ctx.closePath(); ctx.fill(); }
    else if (kind === 'fast') { ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(0, 0); ctx.lineTo(-9, 7); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(1, -7); ctx.lineTo(10, 0); ctx.lineTo(1, 7); ctx.closePath(); ctx.fill(); }
    else if (kind === 'skip') { ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(3, 0); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.fillRect(5, -7, 4, 14); }
    else if (kind === 'log') { for (var j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(-8, j * 6); ctx.lineTo(8, j * 6); ctx.stroke(); } }
    ctx.restore();
  };
  K.iconBtn = function (ctx, id, x, y, s, kind, onTap, o) {
    o = o || {};
    var st = U.hit(id, x, y, s, s, { onTap: onTap, label: o.label || id, disabled: o.disabled }), p = st.pressed ? 2 : 0;
    ctx.save(); if (o.disabled) ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2 + 4, s / 2, 0, 7); ctx.fill();
    ctx.fillStyle = o.on ? '#e8b54a' : st.hover ? '#3b8076' : TEAL; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2 + p, s / 2, 0, 7); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; ctx.stroke();
    K.icon(ctx, kind, x + s / 2, y + s / 2 + p, s * 0.5, o.on ? INK : PAPER);
    if (o.text) U.text(ctx, o.text, x + s / 2, y + s + 16, { size: 13, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 + 5, 0, 7); ctx.stroke(); }
    ctx.restore(); return st;
  };
  K.paper = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.fillStyle = 'rgba(30,18,8,.32)'; U.rr(ctx, x + 4, y + 7, w, h, o.r || 8); ctx.fill();
    ctx.fillStyle = o.fill || PAPER; U.rr(ctx, x, y, w, h, o.r || 8); ctx.fill(); ctx.strokeStyle = o.line || '#a88a5a'; ctx.lineWidth = 2.5; ctx.stroke();
    if (o.lines) { ctx.strokeStyle = 'rgba(120,150,170,.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var yy = y + (o.top || 56); yy < y + h - 10; yy += o.lines) { ctx.moveTo(x + 14, yy); ctx.lineTo(x + w - 14, yy); } ctx.stroke(); }
    if (o.pin) { ctx.fillStyle = o.pin; ctx.beginPath(); ctx.arc(x + w / 2, y + 12, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + w / 2 - 3, y + 8, 2.5, 2.5); }
  };
  K.board = function (ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, x + 4, y + 7, w, h, 8); ctx.fill();
    ctx.fillStyle = '#8a5a2c'; U.rr(ctx, x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#2e4a40'; U.rr(ctx, x + 9, y + 9, w - 18, h - 18, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.035)'; for (var i = 0; i < 6; i++) ctx.fillRect(x + 20 + i * (w - 40) / 6, y + 14 + (i * 37) % (h - 60), (w - 40) / 7, 26);
  };
  K.tag = function (ctx, id, x, y, w, h, label, o) {
    o = o || {};
    var st = U.hit(id, x, y, w, h, { onTap: o.onTap, onDown: o.onDown, disabled: o.disabled, label: label }), p = st.pressed ? 3 : 0, kind = o.kind || 'wood';
    var fill = { wood: '#c98a4e', teal: TEAL, paper: PAPER, red: RED, dark: 'rgba(28,22,16,.7)' }[kind], line = { wood: WOODD, teal: '#1f4d47', paper: '#a88a5a', red: '#6d2014', dark: 'rgba(255,240,210,.5)' }[kind], tc = kind === 'paper' ? INK : '#fff8e8';
    ctx.save(); if (o.disabled) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(30,18,8,.34)'; U.rr(ctx, x + 2, y + 6, w, h, 10); ctx.fill();
    ctx.fillStyle = o.selected ? '#e8b54a' : fill; U.rr(ctx, x, y + p, w, h, 10); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke();
    if (st.hover && !o.disabled) { ctx.fillStyle = 'rgba(255,255,255,.13)'; U.rr(ctx, x, y + p, w, h, 10); ctx.fill(); }
    if (kind === 'wood') { ctx.strokeStyle = 'rgba(90,50,18,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + p + h * 0.33); ctx.bezierCurveTo(x + w * 0.3, y + p + h * 0.4, x + w * 0.7, y + p + h * 0.26, x + w - 10, y + p + h * 0.36); ctx.moveTo(x + 10, y + p + h * 0.7); ctx.bezierCurveTo(x + w * 0.3, y + p + h * 0.62, x + w * 0.7, y + p + h * 0.78, x + w - 10, y + p + h * 0.68); ctx.stroke(); }
    var sub = o.sub ? 10 : 0;
    U.text(ctx, label, x + w / 2, y + h / 2 + p - sub + 1, { size: o.size || 24, bold: true, align: 'center', base: 'middle', color: o.selected ? INK : tc, maxW: w - 18 });
    if (o.sub) U.text(ctx, o.sub, x + w / 2, y + h / 2 + p + 16, { size: 14, align: 'center', base: 'middle', color: o.selected ? '#5a4020' : kind === 'paper' ? '#8d7a60' : 'rgba(255,248,232,.8)', maxW: w - 14 });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); U.rr(ctx, x - 4, y - 4, w + 8, h + 8, 12); ctx.stroke(); }
    ctx.restore(); return st;
  };
  K.stamp = function (ctx, x, y, text, col, rot, size) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot == null ? -0.14 : rot); size = size || 26;
    ctx.font = U.font(size, 'bold'); var w = ctx.measureText(text).width + 22;
    ctx.strokeStyle = col || RED; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.9; U.rr(ctx, -w / 2, -size * 0.8, w, size * 1.6, 5); ctx.stroke();
    U.text(ctx, text, 0, size * 0.36, { size: size, bold: true, align: 'center', color: col || RED });
    ctx.restore();
  };
  K.dim = function (ctx, a) { ctx.fillStyle = 'rgba(18,13,9,' + a + ')'; ctx.fillRect(0, 0, 1280, 720); };
  K.yuan = function (fen) { var v = fen / 100; return (v < 0 ? '−' : '') + '¥' + Math.abs(v).toFixed(Math.abs(fen) % 100 ? 1 : 0); };
  K.clock = function (ctx, x, y, frac, closing) {
    var m = Math.round(360 + Math.min(1, frac) * 180), hh = Math.floor(m / 60), mm = m % 60, str = hh + ':' + (mm < 10 ? '0' : '') + mm;
    ctx.fillStyle = 'rgba(28,22,16,.62)'; U.rr(ctx, x - 78, y - 18, 156, 36, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,210,.22)'; U.rr(ctx, x - 22, y - 4, 88, 8, 4); ctx.fill();
    ctx.fillStyle = closing ? '#e8862a' : '#ffe28a'; U.rr(ctx, x - 22, y - 4, 88 * Math.min(1, frac), 8, 4); ctx.fill();
    U.text(ctx, str, x - 68, y + 7, { size: 20, bold: true, color: '#fff8e8' });
  };
  return K;
});
;
/* game/fx.js */
BSX.define('game/fx', function (require) {
  var U = require('ui/ui');
  var Fx = { parts: [], floats: [], flies: [], lowFx: false, shakeT: 0, shakeA: 0 };
  var ease = {
    out: function (t) { return 1 - (1 - t) * (1 - t); },
    out3: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: function (t) { return t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 8 - 0.75) * 2.094) + 1; }
  };
  Fx.ease = ease;
  Fx.reset = function () { Fx.parts = []; Fx.floats = []; Fx.flies = []; };
  var KIND = {
    steam: { life: [1.1, 1.9], vx: [-8, 8], vy: [-34, -18], g: -6, r: [7, 13], col: '255,252,244', a: 0.34, grow: 14 },
    smoke: { life: [1.2, 2.2], vx: [-10, 14], vy: [-40, -22], g: -4, r: [8, 14], col: '70,62,56', a: 0.3, grow: 16 },
    spark: { life: [0.35, 0.6], vx: [-90, 90], vy: [-130, -40], g: 320, r: [2, 3.5], col: '255,214,120', a: 0.95, grow: 0 },
    oil: { life: [0.3, 0.55], vx: [-70, 70], vy: [-120, -50], g: 380, r: [1.6, 3], col: '244,196,90', a: 0.9, grow: 0 },
    splash: { life: [0.35, 0.6], vx: [-80, 80], vy: [-140, -60], g: 420, r: [2, 3.5], col: '250,246,232', a: 0.9, grow: 0 },
    drop: { life: [0.4, 0.7], vx: [-50, 50], vy: [-110, -40], g: 460, r: [2, 3], col: '246,238,214', a: 0.9, grow: 0 },
    flour: { life: [0.5, 0.9], vx: [-50, 50], vy: [-60, -10], g: 60, r: [3, 6], col: '255,250,238', a: 0.5, grow: 8 },
    crumb: { life: [0.4, 0.7], vx: [-60, 60], vy: [-100, -30], g: 420, r: [1.5, 2.6], col: '196,138,62', a: 1, grow: 0 },
    rice: { life: [0.45, 0.7], vx: [-40, 40], vy: [-60, 10], g: 360, r: [1.4, 2.2], col: '255,253,244', a: 1, grow: 0 },
    heart: { life: [0.9, 1.2], vx: [-14, 14], vy: [-46, -30], g: 0, r: [7, 9], col: '224,96,96', a: 1, grow: 0, shape: 'heart' },
    note: { life: [0.9, 1.2], vx: [-14, 14], vy: [-46, -30], g: 0, r: [6, 8], col: '70,120,110', a: 1, grow: 0, shape: 'note' },
    glint: { life: [0.35, 0.55], vx: [-6, 6], vy: [-10, 4], g: 0, r: [5, 9], col: '255,240,190', a: 1, grow: 0, shape: 'star' },
    dust: { life: [0.6, 1.0], vx: [-30, 30], vy: [-20, 6], g: 20, r: [4, 8], col: '160,140,120', a: 0.35, grow: 10 }
  };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  Fx.burst = function (x, y, kind, n, spread) {
    var K = KIND[kind]; if (!K) return;
    n = Fx.lowFx ? Math.ceil(n / 2) : n; spread = spread || 0;
    for (var i = 0; i < n && Fx.parts.length < 220; i++) {
      var life = rnd(K.life[0], K.life[1]);
      Fx.parts.push({ x: x + rnd(-spread, spread), y: y + rnd(-spread * 0.5, spread * 0.5), vx: rnd(K.vx[0], K.vx[1]), vy: rnd(K.vy[0], K.vy[1]), g: K.g, r: rnd(K.r[0], K.r[1]), col: K.col, a: K.a, t: 0, life: life, grow: K.grow, shape: K.shape });
    }
  };
  Fx.float = function (x, y, text, o) { o = o || {}; Fx.floats.push({ x: x, y: y, text: text, t: 0, life: o.life || 1.1, color: o.color || '#fff8e8', size: o.size || 22, stroke: o.stroke || 'rgba(60,36,16,.85)' }); if (Fx.floats.length > 14) Fx.floats.shift(); };
  Fx.fly = function (o) { o.t = 0; o.dur = o.dur || 0.38; o.arc = o.arc == null ? 46 : o.arc; Fx.flies.push(o); return o; };
  Fx.shake = function (a, t) { Fx.shakeA = Math.max(Fx.shakeA, a); Fx.shakeT = Math.max(Fx.shakeT, t || 0.25); };
  Fx.update = function (dt) {
    var i, p;
    for (i = Fx.parts.length - 1; i >= 0; i--) { p = Fx.parts[i]; p.t += dt; if (p.t >= p.life) { Fx.parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.grow * dt; }
    for (i = Fx.floats.length - 1; i >= 0; i--) { p = Fx.floats[i]; p.t += dt; if (p.t >= p.life) Fx.floats.splice(i, 1); }
    for (i = Fx.flies.length - 1; i >= 0; i--) { p = Fx.flies[i]; p.t += dt; if (p.t >= p.dur) { Fx.flies.splice(i, 1); if (p.done) p.done(); } }
    if (Fx.shakeT > 0) { Fx.shakeT -= dt; if (Fx.shakeT <= 0) Fx.shakeA = 0; }
  };
  Fx.offset = function () { if (Fx.shakeT <= 0) return { x: 0, y: 0 }; var a = Fx.shakeA * Math.min(1, Fx.shakeT * 6); return { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a }; };
  function heart(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.5, y - r * 0.2, x - r * 0.7, y - r * 1.2, x, y - r * 0.35); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.2, x, y + r * 0.9); ctx.fill(); }
  function star(ctx, x, y, r) { ctx.beginPath(); for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  Fx.heart = heart; Fx.star = star;
  Fx.drawParts = function (ctx) {
    for (var i = 0; i < Fx.parts.length; i++) {
      var p = Fx.parts[i], k = p.t / p.life, a = p.a * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
      ctx.fillStyle = 'rgba(' + p.col + ',' + Math.max(0, a).toFixed(3) + ')';
      if (p.shape === 'heart') heart(ctx, p.x, p.y, p.r);
      else if (p.shape === 'star') star(ctx, p.x, p.y, p.r * (1 - k * 0.4));
      else if (p.shape === 'note') { ctx.fillRect(p.x + p.r * 0.5, p.y - p.r * 1.6, 2.5, p.r * 1.7); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 0.7, p.r * 0.5, -0.4, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    }
  };
  Fx.drawFlies = function (ctx) {
    for (var i = 0; i < Fx.flies.length; i++) {
      var f = Fx.flies[i], k = ease.inOut(Math.min(1, f.t / f.dur));
      var x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.arc;
      f.draw(ctx, x, y, k);
    }
  };
  Fx.drawFloats = function (ctx) {
    for (var i = 0; i < Fx.floats.length; i++) {
      var f = Fx.floats[i], k = f.t / f.life, pop = k < 0.12 ? ease.back(k / 0.12) : 1;
      ctx.save(); ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      U.text(ctx, f.text, f.x, f.y - 30 * ease.out(k), { size: f.size * pop, align: 'center', bold: true, color: f.color, stroke: f.stroke });
      ctx.restore();
    }
  };
  return Fx;
});
;
/* game/shop.js */
BSX.define('game/shop', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Story = require('content/story');
  var LIGHT = { dawn: [182, 190, 228], day: [255, 255, 255], dusk: [252, 218, 186], night: [84, 90, 140], candle: [58, 54, 86], rain: [168, 184, 204], dark: [30, 30, 48] };
  var Shop = { t: 0, col: [255, 255, 255], target: 'day', rain: 0, rainTarget: 0, shutter: 0, shutterTarget: 0, walkers: [], bus: null, crowd: 0.4, candles: false, spawnT: 0, streaks: [], lowFx: false };
  var WIN = { x: 364, y: 158, w: 621, h: 176 }, COUNTER_Y = 452;
  Shop.COUNTER_Y = COUNTER_Y;
  Shop.reset = function (light, weather) { Shop.target = light || 'day'; Shop.col = LIGHT[Shop.target].slice(); Shop.rain = Shop.rainTarget = weather === 'rain' ? 1 : 0; Shop.walkers = []; Shop.bus = null; Shop.candles = light === 'candle'; };
  Shop.setLight = function (name) { if (LIGHT[name]) { Shop.target = name; Shop.candles = name === 'candle'; } };
  Shop.setDawn = function (k, rainy) { var a = LIGHT.dawn, b = rainy ? LIGHT.rain : LIGHT.day; k = Math.max(0, Math.min(1, k)); Shop.target = null; Shop.goal = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  Shop.setRain = function (on) { Shop.rainTarget = on ? 1 : 0; };
  Shop.setShutter = function (v, instant) { Shop.shutterTarget = v; if (instant) Shop.shutter = v; };
  Shop.busPass = function (stop) { Shop.bus = { x: -380, stop: !!stop, hold: 0, v: 300 }; };
  Shop.update = function (dt) {
    Shop.t += dt;
    var g = Shop.target ? LIGHT[Shop.target] : Shop.goal, i, k = Math.min(1, dt * 1.6);
    for (i = 0; i < 3; i++) Shop.col[i] += (g[i] - Shop.col[i]) * k;
    Shop.rain += (Shop.rainTarget - Shop.rain) * Math.min(1, dt * 1.2);
    Shop.shutter += (Shop.shutterTarget - Shop.shutter) * Math.min(1, dt * 3.2);
    Shop.spawnT -= dt;
    if (Shop.spawnT <= 0 && Shop.walkers.length < 7) {
      Shop.spawnT = (1.2 + Math.random() * 3.2) / Math.max(0.15, Shop.crowd);
      var dir = Math.random() < 0.5 ? 1 : -1, bike = Math.random() < 0.18;
      Shop.walkers.push({ x: dir > 0 ? WIN.x - 30 : WIN.x + WIN.w + 30, dir: dir, v: (bike ? 110 : 34 + Math.random() * 22) * dir, h: 58 + Math.random() * 14, bike: bike, hue: Math.floor(Math.random() * 5), ph: Math.random() * 6, umb: Shop.rain > 0.5 && !bike });
    }
    for (i = Shop.walkers.length - 1; i >= 0; i--) { var w = Shop.walkers[i]; w.x += w.v * dt; if (w.x < WIN.x - 60 || w.x > WIN.x + WIN.w + 60) Shop.walkers.splice(i, 1); }
    var b = Shop.bus;
    if (b) {
      if (b.stop && b.hold < 5.5 && b.x > 500) { b.v = Math.max(0, b.v - 420 * dt); if (b.v === 0) b.hold += dt; }
      else if (b.stop && b.hold >= 5.5) b.v = Math.min(300, b.v + 240 * dt);
      b.x += b.v * dt; if (b.x > 1400) Shop.bus = null;
    }
  };
  function lum() { return (Shop.col[0] + Shop.col[1] + Shop.col[2]) / 765; }
  Shop.lum = lum;
  var WCOL = ['#3d5a66', '#5a4a3e', '#4a5a48', '#66504a', '#44506a'];
  function drawWindowLife(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(WIN.x, WIN.y, 199, WIN.h); ctx.rect(576, WIN.y, 190, WIN.h); ctx.rect(785, WIN.y, 200, WIN.h); ctx.clip();
    var base = WIN.y + WIN.h + 2, i;
    for (i = 0; i < Shop.walkers.length; i++) {
      var w = Shop.walkers[i], bob = Math.abs(Math.sin(Shop.t * 6 + w.ph)) * 2.5, h = w.h;
      ctx.globalAlpha = 0.72; ctx.fillStyle = WCOL[w.hue];
      if (w.bike) { ctx.fillRect(w.x - 9, base - h + 6, 18, h * 0.5); ctx.beginPath(); ctx.arc(w.x, base - h, 9, 0, 7); ctx.fill(); ctx.strokeStyle = WCOL[w.hue]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w.x - 20, base - 13, 12, 0, 7); ctx.arc(w.x + 20, base - 13, 12, 0, 7); ctx.moveTo(w.x - 20, base - 13); ctx.lineTo(w.x, base - 30); ctx.lineTo(w.x + 20, base - 13); ctx.stroke(); }
      else { ctx.fillRect(w.x - 8, base - h + 16 - bob, 16, h - 16); ctx.beginPath(); ctx.arc(w.x, base - h + 9 - bob, 9.5, 0, 7); ctx.fill(); if (w.umb) { ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(w.x, base - h - 6 - bob, 24, Math.PI, 0); ctx.fill(); ctx.fillRect(w.x - 1, base - h - 6 - bob, 2, 22); } }
    }
    ctx.globalAlpha = 1;
    var b = Shop.bus;
    if (b) {
      var bx = b.x, by = base - 128;
      ctx.fillStyle = '#2f7a70'; U.rr(ctx, bx, by, 360, 122, 14); ctx.fill();
      ctx.fillStyle = '#f2ead4'; ctx.fillRect(bx, by + 62, 360, 26);
      ctx.fillStyle = '#bfe0e6'; for (var k = 0; k < 5; k++) ctx.fillRect(bx + 18 + k * 66, by + 14, 52, 40);
      ctx.fillStyle = '#1f4d47'; ctx.fillRect(bx, by + 110, 360, 12);
      ctx.fillStyle = '#26221e'; ctx.beginPath(); ctx.arc(bx + 70, by + 120, 17, 0, 7); ctx.arc(bx + 290, by + 120, 17, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8b54a'; U.rr(ctx, bx + 300, by + 66, 44, 18, 4); ctx.fill();
      U.text(ctx, '7路', bx + 322, by + 80, { size: 14, bold: true, align: 'center', color: '#3b2a1a' });
    }
    if (Shop.rain > 0.02) {
      ctx.strokeStyle = 'rgba(214,230,240,' + (0.5 * Shop.rain).toFixed(2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
      var n = Shop.lowFx ? 26 : 54;
      for (i = 0; i < n; i++) { var rx = WIN.x + ((i * 97.3 + Shop.t * 260) % (WIN.w + 40)) - 20, ry = WIN.y + ((i * 53.7 + Shop.t * 640) % WIN.h); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(150,170,190,' + (0.16 * Shop.rain).toFixed(2) + ')'; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    }
    ctx.restore();
  }
  var PINS = [[396, 44], [440, 40], [484, 45], [528, 41], [752, 44], [796, 40], [840, 45], [884, 41], [928, 44], [214, 292], [256, 298]];
  var SHELF = [[1052, 210], [1100, 210], [1150, 210], [1052, 258], [1100, 258], [1150, 258], [1052, 306], [1100, 306], [1150, 306]];
  function drawMemento(ctx, kind, x, y, seed) {
    var rot = ((seed * 37) % 11 - 5) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (kind === 'photo') { ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-15, -18, 30, 36); ctx.fillStyle = ['#8fb8a8', '#d8a878', '#9fb0c8', '#c8b078'][seed % 4]; ctx.fillRect(-12, -15, 24, 22); ctx.fillStyle = 'rgba(60,40,20,.5)'; ctx.fillRect(-6, -6, 5, 10); ctx.fillRect(2, -4, 5, 8); ctx.fillStyle = '#c8442f'; ctx.beginPath(); ctx.arc(0, -17, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'note' || kind === 'paper') { ctx.fillStyle = kind === 'note' ? '#fff3b8' : '#f6ecd6'; ctx.fillRect(-14, -17, 28, 34); ctx.strokeStyle = 'rgba(90,70,40,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (var i = 0; i < 4; i++) { ctx.moveTo(-10, -9 + i * 6); ctx.lineTo(10 - (i === 3 ? 8 : 0), -9 + i * 6); } ctx.stroke(); ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(0, -16, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'drawing') { ctx.fillStyle = '#ffffff'; ctx.fillRect(-17, -14, 34, 28); ctx.strokeStyle = '#e07a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-6, -2, 6, 0, 7); ctx.stroke(); ctx.strokeStyle = '#4f8a4b'; ctx.beginPath(); ctx.moveTo(-14, 9); ctx.lineTo(14, 9); ctx.stroke(); ctx.strokeStyle = '#3a6ad0'; ctx.strokeRect(2, -6, 10, 12); ctx.fillStyle = '#c8442f'; ctx.beginPath(); ctx.arc(0, -13, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'mug') { ctx.fillStyle = '#f4f0e6'; ctx.fillRect(-10, -22, 20, 22); ctx.strokeStyle = '#2f5f9a'; ctx.lineWidth = 2.5; ctx.strokeRect(-10, -22, 20, 22); ctx.beginPath(); ctx.arc(12, -11, 6, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = '#c8442f'; ctx.fillRect(-5, -14, 10, 3); }
    else if (kind === 'food') { ctx.fillStyle = '#e08a2a'; ctx.beginPath(); ctx.ellipse(0, -11, 16, 12, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#a85a14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -11, 6, 12, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#5a7a3a'; ctx.fillRect(-2, -26, 4, 6); }
    else if (kind === 'book') { ctx.fillStyle = '#2f6f66'; ctx.fillRect(-13, -24, 26, 24); ctx.fillStyle = '#f6ecd6'; ctx.fillRect(-10, -3, 23, 3); ctx.fillStyle = '#e8b54a'; ctx.fillRect(-8, -18, 12, 3); }
    else if (kind === 'cloth') { ctx.fillStyle = '#f2ead8'; ctx.fillRect(-16, -14, 32, 14); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-16, -5, 32, 3); ctx.fillStyle = '#d9cdb4'; ctx.fillRect(-16, -9, 32, 1.5); }
    else { ctx.fillStyle = '#f4ead0'; ctx.fillRect(-4, -20, 8, 20); ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.ellipse(0, -24, 3, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#b89a6a'; ctx.fillRect(-9, -2, 18, 3); }
    ctx.restore();
  }
  Shop.drawMemento = drawMemento;
  Shop.mementoSpots = function (list) {
    var pi = 0, si = 0, out = [];
    list.forEach(function (m, i) {
      var k = Story.memento(m.id).kind, wall = k === 'photo' || k === 'note' || k === 'paper' || k === 'drawing', p;
      if (wall) { if (pi < PINS.length) p = PINS[pi++]; else return; } else if (si < SHELF.length) p = SHELF[si++]; else return;
      out.push({ id: m.id, kind: k, x: p[0], y: p[1], seed: i + 3 });
    });
    return out;
  };
  Shop.drawBack = function (ctx, s, o) {
    o = o || {};
    var bg = A.img('bg_room_main');
    if (bg) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#d8b88a'; ctx.fillRect(0, 0, 1280, 720); }
    drawWindowLife(ctx);
    if (s) { var spots = Shop.mementoSpots(s.mementos); if (spots.some(function (m) { return m.y < 60; })) { ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(372, 26); ctx.quadraticCurveTo(460, 30, 552, 26); ctx.moveTo(728, 26); ctx.quadraticCurveTo(840, 30, 952, 26); ctx.stroke(); } spots.forEach(function (m) { ctx.save(); if (m.y < 60) { ctx.translate(m.x, m.y); ctx.scale(0.86, 0.86); ctx.translate(-m.x, -m.y); } drawMemento(ctx, m.kind, m.x, m.y, m.seed); ctx.restore(); }); }
    if (o.post) { ctx.save(); ctx.translate(166, 232); ctx.rotate(0.03); ctx.fillStyle = '#fbf3dc'; ctx.fillRect(-20, -30, 40, 60); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5; ctx.strokeRect(-20, -30, 40, 60); ctx.fillStyle = '#b8432f'; ctx.fillRect(-14, -24, 28, 5); ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.beginPath(); for (var i = 0; i < 6; i++) { ctx.moveTo(-14, -12 + i * 6.5); ctx.lineTo(14, -12 + i * 6.5); } ctx.stroke(); ctx.restore(); }
    if (o.curtain) { ctx.save(); ctx.fillStyle = '#f2ead8'; for (var j = 0; j < 3; j++) { ctx.fillRect(42 + j * 31, 62, 29, 86 + Math.sin(Shop.t * 1.3 + j) * 2); } ctx.fillStyle = '#2f6f66'; ctx.fillRect(42, 62, 91, 7); ctx.fillStyle = '#2f6f66'; ctx.font = 'bold 20px ' + U.FONT; ctx.textAlign = 'center'; ['不', '烧', '心'].forEach(function (ch, j2) { ctx.fillText(ch, 56.5 + j2 * 31, 112); }); ctx.restore(); }
  };
  var cleaned = {};
  Shop.place = function (id) {
    if (cleaned[id]) return cleaned[id];
    var im = A.img(id); if (!im) return null;
    if (id !== 'bg_street') return (cleaned[id] = im);
    var c = A.P.createCanvas(1280, 720), g = c.getContext('2d');
    g.drawImage(im, 0, 0, 1280, 720);
    g.drawImage(c, 560, 556, 340, 140, 912, 560, 340, 140);
    g.drawImage(c, 680, 556, 120, 150, 1160, 566, 120, 150);
    g.drawImage(c, 1004, 0, 116, 140, 1146, 0, 116, 140);
    return (cleaned[id] = c);
  };
  Shop.drawPlace = function (ctx, id, t, o) {
    o = o || {};
    var im = Shop.place(id), z = 1.03 + Math.sin((t || 0) * 0.11) * 0.012;
    ctx.save(); ctx.translate(640, 360); ctx.scale(z, z); ctx.translate(-640 + Math.sin((t || 0) * 0.07) * 6, -360);
    if (im) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; } else { ctx.fillStyle = '#d8c09a'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.restore();
    if (o.warm !== false) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = o.tint || 'rgb(255,236,210)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
  };
  var counterCache = null;
  function buildCounter() {
    var y0 = COUNTER_Y, H = 720 - y0, c = A.P.createCanvas(1280, H + 14), g = c.getContext('2d'), i, j;
    function rnd(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
    var gr = g.createLinearGradient(0, 14, 0, H + 14); gr.addColorStop(0, '#c8884c'); gr.addColorStop(0.18, '#b8783e'); gr.addColorStop(1, '#7c4a22'); g.fillStyle = gr; g.fillRect(0, 14, 1280, H);
    var x = 0, k = 0;
    while (x < 1280) {
      var w = 150 + Math.floor(rnd(k + 1) * 130), tone = (rnd(k + 7) - 0.5) * 0.16;
      g.fillStyle = tone > 0 ? 'rgba(255,220,170,' + tone.toFixed(3) + ')' : 'rgba(60,30,10,' + (-tone).toFixed(3) + ')'; g.fillRect(x, 14, w, H);
      g.strokeStyle = 'rgba(90,48,16,.16)'; g.lineWidth = 1.4;
      for (j = 0; j < 7; j++) { var yy = 30 + rnd(k * 13 + j) * (H - 20); g.beginPath(); g.moveTo(x + 4, yy); g.bezierCurveTo(x + w * 0.3, yy + 4 * Math.sin(j + k), x + w * 0.7, yy - 4 * Math.cos(j), x + w - 4, yy + 2); g.stroke(); }
      if (rnd(k + 3) > 0.55) { var kx = x + 20 + rnd(k + 5) * (w - 40), ky = 60 + rnd(k + 9) * (H - 90); g.fillStyle = 'rgba(80,40,14,.28)'; g.beginPath(); g.ellipse(kx, ky, 9, 4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,40,14,.18)'; g.beginPath(); g.ellipse(kx, ky, 16, 7, 0, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(50,24,8,.5)'; g.fillRect(x + w - 2, 14, 2, H); g.fillStyle = 'rgba(255,220,170,.12)'; g.fillRect(x + w, 14, 1.5, H);
      x += w; k++;
    }
    for (i = 0; i < 9; i++) { var ox = rnd(i + 40) * 1280, oy = 40 + rnd(i + 60) * (H - 60); var rg = g.createRadialGradient(ox, oy, 2, ox, oy, 24 + rnd(i) * 20); rg.addColorStop(0, 'rgba(70,36,10,.18)'); rg.addColorStop(1, 'rgba(70,36,10,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(ox, oy, 46, 22, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,230,190,.14)'; g.lineWidth = 1;
    for (i = 0; i < 14; i++) { var cx = rnd(i + 90) * 1280, cy = 30 + rnd(i + 120) * (H - 40), a = rnd(i + 150) * 0.8 - 0.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.stroke(); }
    var lip = g.createLinearGradient(0, 0, 0, 16); lip.addColorStop(0, '#e9b877'); lip.addColorStop(0.45, '#d09858'); lip.addColorStop(1, '#8a5428'); g.fillStyle = lip; g.fillRect(0, 2, 1280, 14);
    g.fillStyle = 'rgba(255,240,200,.55)'; g.fillRect(0, 3, 1280, 2);
    g.fillStyle = '#6a3e1c'; g.fillRect(0, 15, 1280, 3);
    for (i = 40; i < 1280; i += 160) { g.fillStyle = '#5a3216'; g.beginPath(); g.arc(i, 9, 2.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,230,180,.6)'; g.fillRect(i - 1, 7, 1, 1); }
    var sh = g.createLinearGradient(0, 18, 0, 70); sh.addColorStop(0, 'rgba(40,18,4,.35)'); sh.addColorStop(1, 'rgba(40,18,4,0)'); g.fillStyle = sh; g.fillRect(0, 18, 1280, 52);
    return c;
  }
  Shop.drawCounter = function (ctx) {
    var y = COUNTER_Y;
    ctx.fillStyle = 'rgba(40,22,8,.32)'; ctx.fillRect(0, y - 12, 1280, 14);
    if (!counterCache && A.P && A.P.createCanvas) counterCache = buildCounter();
    if (counterCache) ctx.drawImage(counterCache, 0, y - 14);
    else { ctx.fillStyle = '#b9793f'; ctx.fillRect(0, y, 1280, 720 - y); }
    if (!Shop.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var f = 0.06 + Math.sin(Shop.t * 1.7) * 0.008; glow(ctx, 640, y + 70, 520, '255,200,130', f.toFixed(3)); ctx.restore(); }
  };
  Shop.grade = function (ctx, warm) {
    var vg = ctx.createRadialGradient(640, 330, 380, 640, 360, 860); vg.addColorStop(0, 'rgba(20,10,4,0)'); vg.addColorStop(1, 'rgba(20,10,4,' + (warm ? 0.42 : 0.34) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
  };
  function glow(ctx, x, y, r, rgb, a) {
    if (r <= 0) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(0.45, 'rgba(' + rgb + ',' + (a * 0.45).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  Shop.glow = glow;
  Shop.drawLight = function (ctx) {
    var c = Shop.col, l = lum();
    if (l < 0.985) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
      var dark = Math.max(0, 0.92 - l);
      if (dark > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (Shop.candles) { var f = 0.85 + Math.sin(Shop.t * 9) * 0.06 + Math.sin(Shop.t * 23) * 0.04; [[330, 440], [640, 436], [960, 440]].forEach(function (p) { glow(ctx, p[0], p[1] - 10, 250 * f, '255,176,86', (0.5 * f).toFixed(2)); }); }
        else { glow(ctx, 1053, 52, 330, '255,206,130', (dark * 0.95).toFixed(2)); glow(ctx, 640, 520, 520, '255,190,120', (dark * 0.3).toFixed(2)); }
        ctx.restore();
        if (Shop.candles) [[330, 440], [640, 436], [960, 440]].forEach(function (p) { ctx.fillStyle = '#f4ead0'; ctx.fillRect(p[0] - 5, p[1] - 6, 10, 22); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 14 + Math.sin(Shop.t * 11 + p[0]) * 1.2, 4, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 12, 1.8, 4, 0, 0, 7); ctx.fill(); });
      }
    }
  };
  Shop.drawShutter = function (ctx) {
    var v = Shop.shutter; if (v < 0.01) return;
    ctx.save();
    ctx.fillStyle = 'rgba(14,12,20,' + (0.62 * v).toFixed(2) + ')'; ctx.fillRect(0, 0, 1280, 720);
    function slats(x, y, w, h) {
      var hh = h * v; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
      ctx.fillStyle = '#6f7a80'; ctx.fillRect(x, y, w, hh);
      for (var yy = y + (hh % 16) - 16; yy < y + hh; yy += 16) { ctx.fillStyle = '#8c979c'; ctx.fillRect(x, yy, w, 5); ctx.fillStyle = '#4c555a'; ctx.fillRect(x, yy + 13, w, 3); }
      ctx.fillStyle = '#3c4448'; ctx.fillRect(x, y + hh - 9, w, 9); ctx.fillStyle = '#c8d0d4'; ctx.fillRect(x + w / 2 - 34, y + hh - 7, 68, 4);
      ctx.restore();
      if (v < 0.98) { var g = ctx.createLinearGradient(0, y + hh, 0, y + hh + 90); g.addColorStop(0, 'rgba(255,232,180,' + (0.4 * v).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,232,180,0)'); ctx.fillStyle = g; ctx.fillRect(x, y + hh, w, Math.min(90, h - hh)); }
    }
    slats(360, 72, 630, 266); slats(38, 56, 100, 428);
    ctx.restore();
  };
  return Shop;
});
;
/* game/people.js */
BSX.define('game/people', function (require) {
  var A = require('game/assets');
  var Cast = require('content/cast');
  var Fx = require('game/fx');
  var SKIN = ['#f6d3ab', '#eebf92', '#dba97a'];
  var HAIRS = ['#2a1e18', '#3d2a1e', '#5a3a22', '#1a1410', '#6b4a32'];
  var cache = {}, W = 44, H = 60, S = 2;
  function shade(hex, d) { var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function build(spec) {
    var c = A.P.createCanvas(W * S, H * S), g = c.getContext('2d');
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x * S), Math.round(y * S), Math.round(w * S), Math.round(h * S)); }
    var skin = SKIN[spec.skin || 0], skinD = shade(skin, -28), body = spec.body, bodyD = shade(body, -34), bodyL = shade(body, 22), pants = spec.pants, hair = spec.hairCol || '#2a1e18', hairL = shade(hair.charAt(0) === '#' ? hair : '#2a1e18', 26);
    var ox = 2; // 画布左右留边给配件
    if (spec.hair === 'pony') { px(ox + 29, 12, 4, 13, hair); px(ox + 30, 24, 3, 3, hair); }
    if (spec.hair === 'bun') { px(ox + 16, 1.5, 8, 5, hair); px(ox + 17, 1, 6, 1, hairL); }
    if (spec.hair === 'straw') { px(ox + 3, 9, 34, 3, '#d9b266'); }
    px(ox + 13.5, 45, 5, 9, pants); px(ox + 21.5, 45, 5, 9, pants); px(ox + 13.5, 45, 5, 1.5, shade(pants, -20));
    px(ox + 12.5, 53.5, 6.5, 3, '#2a1e16'); px(ox + 21, 53.5, 6.5, 3, '#2a1e16');
    px(ox + 8, 29, 3.5, 13, body); px(ox + 28.5, 29, 3.5, 13, body); px(ox + 8, 29, 1, 13, bodyD); px(ox + 31, 29, 1, 13, bodyD);
    px(ox + 8, 41.5, 3.5, 3, skin); px(ox + 28.5, 41.5, 3.5, 3, skin);
    px(ox + 11, 27.5, 18, 18, body); px(ox + 11, 27.5, 18, 2, bodyL); px(ox + 11, 43.5, 18, 2, bodyD); px(ox + 11, 27.5, 1, 18, bodyD); px(ox + 28, 27.5, 1, 18, bodyD);
    px(ox + 17, 25.5, 6, 3, skinD);
    px(ox + 9.5, 7, 21, 19, skin); px(ox + 8.5, 9, 23, 15, skin); px(ox + 10.5, 6, 19, 1.5, skin); px(ox + 10.5, 25.5, 19, 1, skinD);
    px(ox + 7.5, 15, 1.5, 4.5, skin); px(ox + 31, 15, 1.5, 4.5, skin);
    var hs = spec.hair;
    if (hs === 'short' || hs === 'pony' || hs === 'bun' || hs === 'gray') { px(ox + 8.5, 4, 23, 7.5, hair); px(ox + 10, 3, 20, 1.5, hair); px(ox + 8, 9, 2.5, 7, hair); px(ox + 29.5, 9, 2.5, 7, hair); px(ox + 12, 4.5, 9, 1.5, hairL); px(ox + 11, 11, 4, 1.5, hair); px(ox + 22, 11, 5, 1.5, hair); }
    if (hs === 'bob') { px(ox + 8.5, 4, 23, 7.5, hair); px(ox + 10, 3, 20, 1.5, hair); px(ox + 7.5, 9, 3, 15, hair); px(ox + 29.5, 9, 3, 15, hair); px(ox + 12, 4.5, 9, 1.5, hairL); px(ox + 11, 11, 18, 1.5, hair); }
    if (hs === 'bald') { px(ox + 8, 11, 2.5, 6, hair); px(ox + 29.5, 11, 2.5, 6, hair); px(ox + 13, 7.5, 5, 1, 'rgba(255,255,255,.35)'); }
    if (hs === 'cap') { var cc = shade(body.charAt(0) === '#' ? body : '#445566', -30); px(ox + 8.5, 3.5, 23, 7.5, cc); px(ox + 10, 2.5, 20, 1.5, cc); px(ox + 26, 10, 10, 2.5, cc); px(ox + 9, 9.5, 22, 1.5, shade('#888888', -60)); px(ox + 8, 11, 2.5, 5, hair); px(ox + 29.5, 11, 2, 5, hair); }
    if (hs === 'helmet') { px(ox + 7, 2.5, 26, 10.5, body); px(ox + 9, 1.5, 22, 1.5, body); px(ox + 18, 1.5, 4, 11.5, '#f4f0e6'); px(ox + 7, 12, 26, 1.5, bodyD); px(ox + 6.5, 13, 3, 8, '#2a2a30'); px(ox + 30.5, 13, 3, 8, '#2a2a30'); px(ox + 9, 3.5, 6, 1.5, bodyL); }
    if (hs === 'straw') { px(ox + 9, 2.5, 22, 7, '#e3c178'); px(ox + 11, 1.5, 18, 1.5, '#e3c178'); px(ox + 9, 7.5, 22, 1.5, '#7a5a2a'); px(ox + 3, 9, 34, 2.5, '#e3c178'); px(ox + 3, 11, 34, 1, '#b8924a'); }
    px(ox + 13.5, 15.5, 2.5, 3.5, '#2a1a12'); px(ox + 24, 15.5, 2.5, 3.5, '#2a1a12'); px(ox + 13.5, 15.5, 1, 1, '#ffffff'); px(ox + 24, 15.5, 1, 1, '#ffffff');
    px(ox + 11, 20, 3, 1.5, 'rgba(232,120,110,.45)'); px(ox + 26, 20, 3, 1.5, 'rgba(232,120,110,.45)');
    px(ox + 18, 22, 4, 1, '#9a5a44');
    if (spec.old) { px(ox + 12.5, 13.5, 4, 1, hair); px(ox + 23.5, 13.5, 4, 1, hair); px(ox + 16.5, 23.5, 7, 1, hairL); }
    var acc = spec.acc;
    if (acc === 'tie') { px(ox + 15, 27.5, 10, 2.5, '#f4f0e6'); px(ox + 18.5, 28.5, 3, 9, '#2f6f66'); px(ox + 18, 37, 4, 1.5, '#2f6f66'); }
    if (acc === 'apron') { px(ox + 13, 31, 14, 14.5, '#f2ead8'); px(ox + 13, 31, 14, 1, '#d8ccb0'); px(ox + 17, 27.5, 1.5, 4, '#f2ead8'); px(ox + 21.5, 27.5, 1.5, 4, '#f2ead8'); }
    if (acc === 'glasses') { px(ox + 12, 14.5, 6, 1, '#3a3a40'); px(ox + 12, 19, 6, 1, '#3a3a40'); px(ox + 12, 14.5, 1, 5, '#3a3a40'); px(ox + 17, 14.5, 1, 5, '#3a3a40'); px(ox + 22.5, 14.5, 6, 1, '#3a3a40'); px(ox + 22.5, 19, 6, 1, '#3a3a40'); px(ox + 22.5, 14.5, 1, 5, '#3a3a40'); px(ox + 27.5, 14.5, 1, 5, '#3a3a40'); px(ox + 18, 16, 4.5, 1, '#3a3a40'); }
    if (acc === 'pack') { px(ox + 12.5, 27.5, 2.5, 14, '#2f4f7a'); px(ox + 25, 27.5, 2.5, 14, '#2f4f7a'); px(ox + 6, 30, 3, 12, '#3a5f8a'); px(ox + 31, 30, 3, 12, '#3a5f8a'); }
    if (acc === 'scarf') { px(ox + 12, 26.5, 16, 2.5, '#d8432f'); px(ox + 18, 28.5, 4, 5, '#d8432f'); px(ox + 19, 33, 2, 2, '#b8321f'); }
    if (acc === 'keys') { px(ox + 26, 40, 1.5, 4, '#8a7a50'); px(ox + 25, 43.5, 4, 3.5, '#e8b54a'); px(ox + 26, 44.5, 2, 1.5, '#b8862a'); }
    if (acc === 'clip') { px(ox + 28, 32, 9, 12, '#d8c8a0'); px(ox + 28, 32, 9, 1, '#8a7a5a'); px(ox + 31, 31, 3, 2, '#666'); px(ox + 29.5, 35, 6, 1, '#777'); px(ox + 29.5, 37.5, 6, 1, '#777'); px(ox + 29.5, 40, 4, 1, '#777'); }
    if (acc === 'phone') { px(ox + 29.5, 33, 5, 9, '#222226'); px(ox + 30.5, 34, 3, 6, '#7fd0ff'); }
    if (acc === 'cam') { px(ox + 26, 30, 11, 8, '#26262a'); px(ox + 34, 31.5, 4, 5, '#55555c'); px(ox + 28, 28.5, 4, 2, '#26262a'); px(ox + 35, 33, 2, 2, '#9fd0ff'); }
    if (acc === 'basket') { px(ox + 28.5, 38, 9, 7, '#b8823a'); px(ox + 28.5, 38, 9, 1.5, '#8a5a22'); px(ox + 30, 36, 6, 2.5, '#4f8a4b'); px(ox + 31, 40.5, 1, 4, '#8a5a22'); px(ox + 34, 40.5, 1, 4, '#8a5a22'); }
    if (acc === 'cane') { px(ox + 33.5, 31, 1.5, 25, '#7a5230'); px(ox + 31.5, 30, 3.5, 1.5, '#7a5230'); }
    if (acc === 'vest') { px(ox + 12, 28.5, 16, 15, '#e8862a'); px(ox + 12, 34, 16, 1.5, '#f4f0c8'); px(ox + 12, 39, 16, 1.5, '#f4f0c8'); px(ox + 19, 28.5, 2, 15, shade(body, -10)); }
    var sil = A.P.createCanvas(c.width, c.height), sg = sil.getContext('2d');
    sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#3a2416'; sg.fillRect(0, 0, c.width, c.height);
    var out = A.P.createCanvas(c.width + 4, c.height + 4), og = out.getContext('2d');
    [[0, 2], [4, 2], [2, 0], [2, 4], [1, 1], [3, 1], [1, 3], [3, 3]].forEach(function (o) { og.drawImage(sil, o[0], o[1]); });
    og.drawImage(c, 2, 2);
    return out;
  }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }
  function walkSpec(arch, seed) {
    var A0 = Cast.archetypes[arch] || Cast.archetypes.office, L = A0.looks, h = hash(seed);
    function pk(arr, sh) { return arr[(h >>> sh) % arr.length]; }
    var hair = pk(L.hair, 3);
    return { body: pk(L.body, 0), pants: pk(L.pants, 6), hair: hair, hairCol: arch === 'elder' ? pk(['#c8c2b8', '#a8a29a', '#e0dcd4'], 9) : pk(HAIRS, 9), acc: pk(L.acc, 12), skin: (h >>> 15) % 3, old: arch === 'elder' };
  }
  function canvasFor(who, look) {
    var key = look ? 'w' + look.arch + look.seed : who;
    if (cache[key]) return cache[key];
    var spec = look ? walkSpec(look.arch, look.seed) : (Cast.npcs[who] || Cast.npcs.neighbor);
    return (cache[key] = build(spec));
  }
  var P = {};
  P.draw = function (ctx, who, x, footY, h, o) {
    o = o || {};
    var reg = Cast.regulars[who];
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    var sq = o.squash || 0, bob = o.bob || 0;
    if (reg) { A.sprite(ctx, reg.sprite, x, footY + bob, h, { flip: o.flip, squash: sq }); ctx.restore(); return; }
    var np = !o.look && Cast.npcs[who];
    if (np && np.sprite && A.img(np.sprite)) { A.sprite(ctx, np.sprite, x, footY + bob, h * (np.kid ? 0.66 : np.h || 0.94), { flip: o.flip, squash: sq }); ctx.restore(); return; }
    var c = canvasFor(who, o.look), kid = !o.look && Cast.npcs[who] && Cast.npcs[who].kid, hh = kid ? h * 0.7 : h * 0.84, s = hh / c.height, w = c.width * s;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, footY + bob); ctx.scale((o.flip ? -1 : 1) * (1 + sq), 1 - sq);
    ctx.drawImage(c, -w / 2, -hh, w, hh);
    ctx.restore();
  };
  P.FOOT = 552;
  P.height = function (who) { var r = Cast.regulars[who]; return Math.round((r ? r.h : 250) * 1.14); };
  P.portrait = function (ctx, who, x, y, size, o) {
    o = o || {};
    ctx.save();
    A.P && 0;
    ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
    var reg = Cast.regulars[who];
    if (reg) { var hh = size * (who === 'zhao' ? 1.75 : who === 'qin' ? 2.0 : 2.15); A.sprite(ctx, reg.sprite, x + size / 2 + (who === 'zhao' ? size * 0.2 : who === 'qin' ? -size * 0.52 : 0), y + hh + size * 0.04, hh, {}); }
    else if (!o.look && Cast.npcs[who] && Cast.npcs[who].sprite && A.img(Cast.npcs[who].sprite)) { var np = Cast.npcs[who], k = np.kid ? 1.55 : 2.0; A.sprite(ctx, np.sprite, x + size / 2, y + size * k * 0.98, size * k, {}); }
    else P.draw(ctx, who, x + size / 2, y + size * 2.25, size * 2.3, { look: o.look });
    ctx.restore();
  };
  P.emote = function (ctx, kind, x, y, t) {
    var k = Math.min(1, t * 5), pop = Fx.ease.back(k), bobY = Math.sin(t * 4) * 2;
    ctx.save(); ctx.translate(x, y + bobY); ctx.scale(pop, pop);
    if (kind === 'heart') { ctx.fillStyle = '#e06060'; Fx.heart(ctx, 0, 0, 11); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-7, -6, 3, 3); }
    else if (kind === 'sweat') { ctx.fillStyle = '#7fc4e8'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(9, 2, 0, 8); ctx.quadraticCurveTo(-9, 2, 0, -12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-3, 0, 2, 3); }
    else if (kind === 'anger') { ctx.strokeStyle = '#c8442f'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, -3); ctx.quadraticCurveTo(-3, -3, -3, -9); ctx.moveTo(9, -3); ctx.quadraticCurveTo(3, -3, 3, -9); ctx.moveTo(-9, 3); ctx.quadraticCurveTo(-3, 3, -3, 9); ctx.moveTo(9, 3); ctx.quadraticCurveTo(3, 3, 3, 9); ctx.stroke(); }
    else if (kind === 'q') { ctx.fillStyle = '#fff8e8'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7d5a35'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1); }
    else if (kind === 'note') { ctx.fillStyle = '#2f6f66'; ctx.fillRect(4, -12, 3, 14); ctx.beginPath(); ctx.ellipse(0, 3, 6, 4.5, -0.4, 0, 7); ctx.fill(); ctx.fillRect(4, -12, 8, 3); }
    else if (kind === 'zzz') { ctx.fillStyle = '#8fa8c8'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('z', -8, 4); ctx.font = 'bold 12px sans-serif'; ctx.fillText('z', 2, -4); }
    else { ctx.fillStyle = '#fff8e8'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 19, 13, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7d5a35'; for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 8, Math.sin(t * 6 + i) * 2, 2.6, 0, 7); ctx.fill(); } }
    ctx.restore();
  };
  P.walkName = function (arch) { return (Cast.archetypes[arch] || {}).name || '客人'; };
  return P;
});
;
/* game/stations.js */
BSX.define('game/stations', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var C = require('content/config');
  var D = require('content/dishes');
  var TEAL = '#2f6f66', TEALD = '#1f4d47', CREAM = '#f2ead8', STEEL = '#cfc8b8', LINE = '#4a3524';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mix(c1, c2, k) { k = clamp(k, 0, 1); return 'rgb(' + Math.round(lerp(c1[0], c2[0], k)) + ',' + Math.round(lerp(c1[1], c2[1], k)) + ',' + Math.round(lerp(c1[2], c2[2], k)) + ')'; }
  function doneCol(d, raw) { raw = raw || [244, 230, 196]; if (d < 0.9) return mix(raw, [228, 164, 66], d / 0.9); if (d < 1.3) return mix([228, 164, 66], [150, 86, 32], (d - 0.9) / 0.4); return mix([150, 86, 32], [44, 34, 28], (d - 1.3) / 0.3); }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); }
  function badge(ctx, x, y, n, warn) { var t = String(n), w = Math.max(30, 16 + t.length * 12); ctx.fillStyle = warn ? '#b8432f' : '#fbf3dc'; U.rr(ctx, x - w / 2, y - 13, w, 26, 8); ctx.fill(); ctx.strokeStyle = warn ? '#6d2014' : '#8a6a3a'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, t, x, y + 1, { size: 17, bold: true, align: 'center', base: 'middle', color: warn ? '#fff3d6' : '#3b2a1a' }); }
  function stove(ctx, x, y, w, h, on) {
    ctx.fillStyle = 'rgba(40,20,8,.3)'; U.rr(ctx, x - 2, y + 5, w + 4, h, 12); ctx.fill();
    ctx.fillStyle = TEAL; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; U.rr(ctx, x + 6, y + 4, w - 12, 8, 4); ctx.fill();
    for (var i = 0; i < 3; i++) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x + w / 2 + (i - 1) * 34, y + h - 20, 9, 0, 7); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = on ? '#e8b54a' : '#8a8a7a'; ctx.fillRect(x + w / 2 + (i - 1) * 34 - 1.5, y + h - 27, 3, 8); }
  }
  function flame(ctx, x, y, w, t) { for (var i = 0; i < 7; i++) { var fx = x - w / 2 + (i + 0.5) * w / 7, h = 9 + Math.sin(t * 9 + i * 1.7) * 3.5; ctx.fillStyle = '#e8862a'; ctx.beginPath(); ctx.moveTo(fx - 5, y); ctx.quadraticCurveTo(fx, y - h * 2, fx + 5, y); ctx.fill(); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.moveTo(fx - 2.5, y); ctx.quadraticCurveTo(fx, y - h, fx + 2.5, y); ctx.fill(); } }
  function ring(ctx, x, y, r, d, win, burnt) {
    var MAX = 1.5, a0 = -Math.PI / 2, full = Math.PI * 2;
    ctx.lineCap = 'butt'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,20,10,.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, full); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,224,130,.95)'; ctx.beginPath(); ctx.arc(x, y, r, a0 + full * win[0] / MAX, a0 + full * win[1] / MAX); ctx.stroke();
    var a = a0 + full * clamp(d, 0, MAX) / MAX;
    ctx.fillStyle = burnt ? '#2a2018' : d >= win[0] && d <= win[1] ? '#fffbe6' : d > win[1] ? '#d8552f' : '#fff3d6';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 6, 0, 7); ctx.fill(); ctx.stroke();
  }
  function source(ctx, x, y, dish, n, t, hot) {
    var bob = hot ? Math.sin(t * 6) * 2 : 0;
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, x, y + 26, 30, 8); ctx.fill();
    ctx.save(); if (n <= 0) ctx.globalAlpha = 0.35;
    A.food(ctx, dish, x - 30, y - 32 + bob, 60, {});
    ctx.restore();
    badge(ctx, x + 24, y + 22, n, n <= 0);
  }
  function windowOf(it, env) {
    var d = D.byId[it.dish], lv = env.lv[d.st] || 0, a = 0.78 - lv * C.skillWindow, b = 1.0 + lv * 0.02;
    if (d.oil) { var c = (a + b) / 2, w = (b - a) * C.oilWindow(env.oilAge); a = c - w / 2; b = c + w / 2; }
    return [a, b];
  }
  function quality(it, mod, env) {
    var d = D.byId[it.dish], q;
    if (d.cook) {
      var w = windowOf(it, env), tg = mod === '嫩' ? [w[0] - 0.2, w[0] - 0.01] : mod === '老' ? [w[1] + 0.01, w[1] + 0.22] : w;
      var dist = it.d < tg[0] ? tg[0] - it.d : it.d > tg[1] ? it.d - tg[1] : 0;
      q = 1 - dist * 2.3; if (it.d < 0.45) q = Math.min(q, 0.3);
      q *= Math.pow(0.78, it.miss || 0);
      if (d.oil) q += C.oilQ(env.oilAge);
      if (mod && dist === 0) q += 0.03;
    } else q = it.q0;
    var age = env.t - it.out, hold = d.hold * (env.s.upg.shelf ? 1.6 : 1);
    if (mod === '温') q += age >= 5 ? 0.03 : -0.2;
    else if (age > hold) q -= Math.min(0.3, (age - hold) * 0.012);
    return clamp(q + C.matQ[env.s.plan.mat] + (env.s.today.pantryQ || 0), 0.1, 1);
  }
  function word(q) { return q >= 0.92 ? '正好' : q >= 0.78 ? '不错' : q >= 0.6 ? '还行' : '差点'; }
  function SlotStation(type, dishes, r, env) {
    this.type = type; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.n = type === 'fryer' ? C.fryerSlots(env.s) : 3;
    this.slots = []; for (var i = 0; i < this.n; i++) this.slots.push(null);
    this.cx = r.x + r.w / 2; this.cy = r.y + (type === 'fryer' ? 134 : 136);
    this.rx = Math.min(r.w * 0.44, type === 'fryer' ? 118 : 100); this.ry = this.rx * (type === 'fryer' ? 0.46 : 0.56);
    this.smokeT = 0;
  }
  var SP = SlotStation.prototype;
  SP.slotPos = function (i) {
    var cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry;
    if (this.type === 'fryer') { var n = this.n, per = Math.min(46, rx * 1.7 / n); return { x: cx + (i - (n - 1) / 2) * per, y: cy - 2, r: Math.min(22, per / 2) }; }
    var P = [[-0.5, -0.12], [0.5, -0.12], [0, 0.42]][i];
    return { x: cx + P[0] * rx, y: cy + P[1] * ry * 1.25, r: 27 };
  };
  SP.srcPos = function (i) { var n = this.dishes.length, gap = Math.min(70, (this.r.w - 16) / n); return { x: this.cx + (i - (n - 1) / 2) * gap, y: this.r.y + 32 }; };
  SP.speed = function (dish) { var d = D.byId[dish]; return (1 / d.cook.t) * (d.oil ? C.oilSpeed(this.env.oilAge) : 1); };
  SP.free = function () { for (var i = 0; i < this.n; i++) if (!this.slots[i]) return i; return -1; };
  SP.count = function (dish) { return this.slots.filter(function (s) { return s && s.dish === dish && !s.burnt; }).length; };
  SP.add = function (dish) {
    var env = this.env, i = this.free();
    if ((env.stock[dish] || 0) <= 0) { env.svc.say(this.cx, this.r.y + 40, '备的卖完了'); Au.play('wrong'); return false; }
    if (i < 0) { env.svc.say(this.cx, this.cy - 40, '锅里满了'); Au.play('wrong'); return false; }
    env.stock[dish]--; env.svc.cooked(dish);
    this.slots[i] = { dish: dish, d: 0, flips: 0, need: D.byId[dish].cook.flips, born: this.t, drop: 0, fa: 0, cued: 0, rdy: false };
    var p = this.slotPos(i);
    if (this.type === 'fryer') { Au.play('drop_oil'); Fx.burst(p.x, p.y, 'oil', 9, 10); }
    else if (this.type === 'griddle') { Au.play(dish === 'egg' ? 'crack' : 'pan_in'); Fx.burst(p.x, p.y, 'steam', 3, 8); }
    else { Au.play('noodle'); Fx.burst(p.x, p.y, 'splash', 7, 8); }
    return true;
  };
  SP.flip = function (i) {
    var it = this.slots[i], p = this.slotPos(i), d = D.byId[it.dish]; it.flips++; it.fa = 1;
    var verb = d.cook.verb || '翻面';
    if (verb === '点水' || verb === '加水') { Au.play('water'); Fx.burst(p.x, p.y, 'splash', 8, 8); Fx.burst(p.x, p.y - 8, 'steam', 4, 10); }
    else if (verb === '翻炒') { Au.play('toss'); Fx.burst(p.x, p.y - 6, 'rice', 8, 10); }
    else { Au.play('flip'); Fx.burst(p.x, p.y, this.type === 'fryer' ? 'oil' : 'steam', 5, 8); }
    this.env.svc.say(p.x, p.y - 34, verb, 16);
  };
  SP.take = function (i) {
    var it = this.slots[i]; this.slots[i] = null;
    Au.play(this.type === 'fryer' ? 'fish' : this.type === 'boil' ? 'basket' : 'rack');
    return { dish: it.dish, d: it.d, miss: Math.max(0, it.need - it.flips), out: this.env.t, st: this.type };
  };
  SP.update = function (dt) {
    this.t += dt;
    var env = this.env, active = 0, self = this, old = this.type !== 'boil' && env.oilAge >= 3;
    for (var i = 0; i < this.n; i++) {
      var it = this.slots[i]; if (!it) continue;
      active++;
      var w = windowOf(it, env), sp = this.speed(it.dish), p = this.slotPos(i);
      if (it.d > w[1] && this.type === 'boil' && (env.lv.boil || 0) >= 2) sp *= 0.55;
      var before = it.d; it.d += dt * sp; it.drop = Math.min(1, it.drop + dt * 5); if (it.fa > 0) it.fa = Math.max(0, it.fa - dt * 3.2);
      if (before < w[0] && it.d >= w[0]) { it.rdy = true; Fx.burst(p.x, p.y - 8, 'glint', 3, 10); Au.play('good', { vol: 0.5, pitch: 1.3 }); }
      var due = (it.flips + 1) / (it.need + 1) * w[0] * 0.92;
      if (it.flips < it.need && it.d >= due && it.cued <= it.flips) { it.cued = it.flips + 1; if (this.type === 'griddle' && (env.lv.griddle || 0) >= 2) Au.play('spoon', { vol: 0.7 }); }
      if (!it.burnt && it.d >= 1.5) { it.burnt = true; Au.play('burnt'); Fx.burst(p.x, p.y - 6, 'smoke', 8, 10); env.svc.wasted(it.dish); env.svc.say(p.x, p.y - 34, '糊了', 18, '#3a2a20'); }
      if (!Fx.lowFx && Math.random() < dt * (this.type === 'boil' ? 1.4 : 2.4)) Fx.burst(p.x + (Math.random() - 0.5) * 20, p.y - 4, this.type === 'boil' ? 'steam' : it.d > w[1] + 0.12 ? 'smoke' : this.type === 'fryer' ? 'oil' : 'steam', 1, 4);
    }
    if (old && active) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = env.s.upg.hood ? 0.9 : 0.35; Fx.burst(this.cx + (Math.random() - 0.5) * this.rx, this.cy - this.ry, 'smoke', 1, 12); } }
    var lv = active / this.n;
    if (this.type === 'fryer') { Au.loop('sizzle', lv); Au.loop('smoke', old && active ? 0.5 : 0); } else if (this.type === 'griddle') Au.loop('griddle', lv); else Au.loop('boil', 0.25 + lv * 0.6);
  };
  SP.press = function (x, y) {
    var self = this, env = this.env, i, p;
    for (i = 0; i < this.dishes.length; i++) { p = this.srcPos(i); if (Math.abs(x - p.x) < 36 && Math.abs(y - p.y) < 40) { var dish = this.dishes[i]; return { tap: function () { var ok = self.add(dish); if (ok && self.type === 'fryer' && (env.lv.fryer || 0) >= 2 && self.free() >= 0 && (env.stock[dish] || 0) > 0 && env.svc.wants(dish) > 1) self.add(dish); } }; } }
    for (i = 0; i < this.n; i++) {
      var it = this.slots[i]; if (!it) continue; p = this.slotPos(i);
      var hw = this.type === 'fryer' ? p.r + 4 : 36, hh = this.type === 'fryer' ? 56 : 36;
      if (Math.abs(x - p.x) <= hw && Math.abs(y - p.y) <= hh) return this.slotAction(i);
    }
    return null;
  };
  SP.slotAction = function (i) {
    var self = this, it = this.slots[i], env = this.env, p = this.slotPos(i);
    if (it.burnt) return { tap: function () { self.slots[i] = null; Au.play('trash'); Fx.burst(p.x, p.y, 'dust', 6, 8); } };
    var grab = { dish: it.dish, x: p.x, y: p.y, make: function () { return self.slots[i] === it ? self.take(i) : null; } };
    return { grab: grab, tap: function () {
      if (self.slots[i] !== it) return;
      if (it.flips < it.need) { self.flip(i); return; }
      if (it.d < 0.45) { it.fa = 0.6; env.svc.say(p.x, p.y - 34, '还没熟', 16); Au.play('wrong', { vol: 0.5 }); return; }
      env.svc.smart(grab);
    } };
  };
  SP.points = function () {
    var o = {}, self = this;
    this.dishes.forEach(function (d, i) { var p = self.srcPos(i); o['src_' + d] = [p.x, p.y]; });
    for (var i = 0; i < this.n; i++) { var p = this.slotPos(i); o['slot' + i] = [p.x, p.y]; }
    return o;
  };
  SP.describe = function () { var env = this.env; return { type: this.type, slots: this.slots.map(function (it) { return it ? { dish: it.dish, d: +it.d.toFixed(2), flips: it.flips, need: it.need, win: windowOf(it, env).map(function (v) { return +v.toFixed(2); }), burnt: !!it.burnt } : null; }) }; };
  function drawItem(ctx, st, it, p, t) {
    var d = it.d, dish = it.dish, drop = Fx.ease.back(it.drop), sq = 1 + it.fa * 0.25, hop = Math.sin(it.fa * Math.PI) * 14;
    ctx.save(); ctx.translate(p.x, p.y - hop); ctx.scale(drop * sq, drop * (2 - sq));
    var col = doneCol(d), dark = doneCol(d + 0.25);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(70,40,14,.75)';
    if (dish === 'youtiao') { var w = Math.min(p.r * 0.72, 13), L = 40 + Math.min(1, d) * 9; for (var k = -1; k <= 1; k += 2) { ctx.fillStyle = k * (it.flips % 2 ? -1 : 1) > 0 ? col : dark; U.rr(ctx, k * w * 0.5 - w * 0.55, -L, w * 1.1, L * 2, w * 0.55); ctx.fill(); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w * 0.75, -L + 8, 2.5, L * 1.2); }
    else if (dish === 'tangyou') { [[-9, -14], [8, -8], [-6, 6], [9, 14]].forEach(function (q, j) { ctx.fillStyle = j % 2 ? col : dark; ctx.beginPath(); ctx.arc(q[0], q[1], 10.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(q[0] - 5, q[1] - 6, 3, 3); }); }
    else if (dish === 'scallion') { ctx.fillStyle = col; ell(ctx, 0, 0, 30, 20); ctx.fill(); ctx.stroke(); ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.beginPath(); for (var a = 0; a < 12; a += 0.4) { var rr = a * 2.1; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.66); } ctx.stroke(); ctx.fillStyle = '#5aa04a'; [[-12, -4], [8, -8], [14, 5], [-4, 9], [2, -2]].forEach(function (q) { ctx.fillRect(q[0], q[1], 4, 2); }); }
    else if (dish === 'egg') { ctx.fillStyle = mix([255, 252, 242], [226, 170, 90], clamp((d - 0.7) / 0.8, 0, 1)); ctx.beginPath(); ctx.ellipse(0, 0, 28, 19, 0.2, 0, 7); ctx.fill(); ctx.stroke(); if (it.flips % 2 === 0) { ctx.fillStyle = '#f5b423'; ctx.beginPath(); ctx.arc(3, -1, 9.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-1, -6, 4, 3); } else { ctx.fillStyle = 'rgba(190,120,50,.5)'; ell(ctx, 0, 0, 16, 10); ctx.fill(); } }
    else if (dish === 'shengjian') { [[-12, -8], [12, -8], [-12, 9], [12, 9]].forEach(function (q) { ctx.fillStyle = mix([250, 244, 228], [222, 168, 84], clamp(d / 1.1, 0, 1)); ctx.beginPath(); ctx.arc(q[0], q[1], 11.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); }); if (it.flips >= 1 && d < 1.0) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, 0, 0, 30, 21); ctx.fill(); } }
    else if (dish === 'friedrice') { ctx.fillStyle = mix([250, 244, 222], [226, 180, 96], clamp(d / 1.1, 0, 1)); ell(ctx, 0, 2, 29, 19); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2c94c'; [[-10, -4], [6, -8], [12, 3], [-3, 6], [-14, 6], [2, -1]].forEach(function (q) { ctx.fillRect(q[0], q[1], 5, 4); }); ctx.fillStyle = '#5aa04a'; [[-6, -9], [10, -2], [-11, 1], [4, 9]].forEach(function (q) { ctx.fillRect(q[0], q[1], 4, 2); }); }
    else { // 面锅：漏勺里的东西
      var rise = it.rdy ? Math.sin(t * 5 + p.x) * 2 - 3 : 2;
      ctx.translate(0, rise);
      if (dish === 'dumpling') { [[-11, -6], [9, -8], [-3, 6], [13, 6]].forEach(function (q, j) { ctx.fillStyle = '#f8f2e2'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 10, 6.5, j * 0.5, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else if (dish === 'tangyuan') { [[-10, -6], [8, -8], [-2, 6], [12, 6], [-14, 6]].forEach(function (q) { ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.arc(q[0], q[1], 7.5, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else if (dish === 'mutton') { [[-10, -5], [6, -7], [-2, 5], [12, 5]].forEach(function (q, j) { ctx.fillStyle = mix([200, 120, 110], [150, 104, 84], clamp(d, 0, 1)); ctx.beginPath(); ctx.ellipse(q[0], q[1], 11, 5.5, j * 0.7, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else { ctx.strokeStyle = dish === 'mixian' ? '#fbfaf2' : '#f0d890'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; for (var j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc((j - 2) * 6, Math.sin(j * 2.1) * 5, 11, j * 1.1, j * 1.1 + 3.6); ctx.stroke(); } if (dish === 'poachnoodle') A.drawEgg(ctx, 2, -2, 8); if (dish === 'chicken') { ctx.fillStyle = '#f6e2a0'; ctx.fillRect(-9, -3, 8, 5); ctx.fillRect(4, 2, 8, 5); } }
    }
    ctx.restore();
  }
  SP.draw = function (ctx) {
    var r = this.r, env = this.env, cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry, t = this.t, i, self = this;
    stove(ctx, cx - rx * 0.96, cy + ry * 0.5, rx * 1.92, r.y + r.h - 6 - (cy + ry * 0.5), true);
    flame(ctx, cx, cy + ry * 0.98, rx * 1.2, t);
    if (this.type === 'fryer') {
      var x0 = cx - rx, y0 = cy - ry - 6, w = rx * 2, h = ry * 2 + 12;
      ctx.fillStyle = '#3a3836'; U.rr(ctx, x0 - 6, y0 - 4, w + 12, h + 14, 14); ctx.fill(); ctx.strokeStyle = '#1e1c1a'; ctx.lineWidth = 3; ctx.stroke();
      var k = clamp(env.oilAge / 5, 0, 1); ctx.fillStyle = mix([236, 184, 74], [104, 64, 24], k); U.rr(ctx, x0, y0, w, h, 10); ctx.fill();
      ctx.save(); U.rr(ctx, x0, y0, w, h, 10); ctx.clip();
      ctx.fillStyle = 'rgba(255,240,190,' + (0.22 - k * 0.14).toFixed(2) + ')';
      for (i = 0; i < 4; i++) { ell(ctx, x0 + ((i * 71 + t * 14) % (w + 60)) - 30, y0 + 16 + i * (h - 26) / 3, 34, 4); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; U.rr(ctx, x0 + 3, y0 + 3, w - 6, h - 6, 8); ctx.stroke();
    } else if (this.type === 'griddle') {
      ctx.fillStyle = '#2c2a28'; ctx.save(); ctx.translate(cx + rx * 0.86, cy + ry * 0.7); ctx.rotate(0.6); U.rr(ctx, 0, -9, rx * 0.75, 18, 8); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#1e1c1b'; ell(ctx, cx, cy + 6, rx + 5, ry + 5); ctx.fill();
      ctx.fillStyle = '#3b3835'; ell(ctx, cx, cy, rx + 4, ry + 4); ctx.fill(); ctx.strokeStyle = '#161514'; ctx.lineWidth = 3; ctx.stroke();
      var ko = clamp(env.oilAge / 5, 0, 1); ctx.fillStyle = mix([72, 62, 48], [44, 36, 30], ko); ell(ctx, cx, cy, rx - 6, ry - 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,150,.10)'; ell(ctx, cx - rx * 0.3, cy - ry * 0.3, rx * 0.4, ry * 0.2); ctx.fill();
    } else {
      ctx.fillStyle = '#a9a294'; ell(ctx, cx, cy + 22, rx, ry); ctx.fill(); ctx.fillRect(cx - rx, cy, rx * 2, 22);
      ctx.fillStyle = STEEL; ell(ctx, cx, cy, rx, ry); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#5f7f7c'; ell(ctx, cx, cy, rx - 9, ry - 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      for (i = 0; i < 6; i++) { var bp = (t * 0.9 + i * 0.37) % 1, bx = cx + Math.cos(i * 2.4) * rx * 0.6, by = cy + Math.sin(i * 1.7) * ry * 0.5; ctx.globalAlpha = 1 - bp; ctx.beginPath(); ctx.arc(bx, by, 3 + bp * 9, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = TEAL; U.rr(ctx, cx - rx - 16, cy - 8, 20, 16, 5); ctx.fill(); U.rr(ctx, cx + rx - 4, cy - 8, 20, 16, 5); ctx.fill();
    }
    for (i = 0; i < this.n; i++) {
      var p = this.slotPos(i), it = this.slots[i];
      if (this.type === 'boil') { ctx.strokeStyle = '#7a7468'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(40,60,58,.35)'; ctx.fill(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x + 22, p.y - 22); ctx.lineTo(p.x + 40, p.y - 44); ctx.stroke(); }
      else if (!it) { ctx.strokeStyle = 'rgba(255,240,200,.16)'; ctx.setLineDash([5, 6]); ctx.lineWidth = 2; if (this.type === 'fryer') { U.rr(ctx, p.x - p.r * 0.7, p.y - 44, p.r * 1.4, 88, 10); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, 7); ctx.stroke(); } ctx.setLineDash([]); }
      if (it) {
        drawItem(ctx, this, it, p, t);
        var w2 = windowOf(it, env), ry2 = this.type === 'fryer' ? p.y + 62 : p.y + 34;
        ring(ctx, p.x, ry2, 13, it.d, w2, it.burnt);
        if (it.flips < it.need && !it.burnt) { var due = (it.flips + 1) / (it.need + 1) * w2[0] * 0.92, on = it.d >= due; ctx.save(); ctx.globalAlpha = on ? 0.75 + Math.sin(t * 9) * 0.25 : 0.4; ctx.fillStyle = on ? '#fff3b8' : '#fff8e8'; ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, ry2, 8.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, ry2, 4.5, -2.4, 1.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x + 1, ry2 + 5.5); ctx.lineTo(p.x + 5, ry2 + 3); ctx.lineTo(p.x + 5, ry2 + 7); ctx.fill(); ctx.restore(); }
      }
    }
    this.dishes.forEach(function (d, j) { var sp = self.srcPos(j); source(ctx, sp.x, sp.y, d, env.stock[d] || 0, t, false); });
  };
  function Pot(dishes, r, env) {
    this.type = 'pot'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.cap = C.potCap(env.s);
    this.base = dishes.indexOf('congee') >= 0 ? 'congee' : dishes[0];
    this.tops = dishes.filter(function (d) { return D.byId[d].top; });
    this.total = function () { var n = 0; dishes.forEach(function (d) { n += env.stock[d] || 0; }); return n; };
    this.servings = Math.min(this.cap, this.total()); this.cookT = 0; this.batch = 0;
    this.stick = 0; this.scorched = false; this.stirT = 0; this.ladleT = 0;
    this.cx = r.x + r.w / 2 - (this.tops.length ? 6 : 0); this.cy = r.y + 130; this.rx = Math.min(r.w * 0.4, 100); this.ry = this.rx * 0.56;
  }
  var PP = Pot.prototype;
  PP.reserve = function () { return Math.max(0, this.total() - this.servings - this.batch); };
  PP.count = function () { return 0; };
  PP.spoon = function () { return { x: this.cx + this.rx * 0.82, y: this.cy - this.ry * 1.15 }; };
  PP.sack = function () { return { x: this.r.x + 36, y: this.r.y + 36 }; };
  PP.topPos = function (i) { return { x: this.r.x + this.r.w - 38 - i * 66, y: this.r.y + 34 }; };
  PP.potQ = function () { return 0.93 + (this.stick < 0.5 ? 0.07 : 0) - (this.scorched ? 0.3 : 0); };
  PP.update = function (dt) {
    this.t += dt; var env = this.env;
    if (this.stirT > 0) this.stirT = Math.max(0, this.stirT - dt * 1.8);
    if (this.ladleT > 0) this.ladleT = Math.max(0, this.ladleT - dt * 3);
    if (this.cookT > 0) { this.cookT -= dt; if (this.cookT <= 0) { this.servings += this.batch; this.batch = 0; Au.play('lid'); Fx.burst(this.cx, this.cy - 20, 'steam', 10, 30); env.svc.say(this.cx, this.cy - 50, '新的一锅好了', 18); } }
    if (this.servings > 0) { this.stick += dt / (40 + (env.lv.pot || 0) * 14); if (this.stick >= 1 && !this.scorched) { this.scorched = true; Au.play('burnt', { vol: 0.6 }); env.svc.say(this.cx, this.cy - 50, '糊底了', 18, '#3a2a20'); } }
    else { this.stick = 0; this.scorched = false; }
    if (!Fx.lowFx && this.servings > 0 && Math.random() < dt * 1.3) Fx.burst(this.cx + (Math.random() - 0.5) * this.rx, this.cy - 10, 'steam', 1, 6);
    Au.loop('simmer', this.servings > 0 || this.cookT > 0 ? 0.6 : 0);
  };
  PP.stir = function () { this.stirT = 1; this.stick = Math.max(0, this.stick - 0.55); Au.play('stir'); Fx.burst(this.cx, this.cy - 14, 'steam', 3, 16); };
  PP.refill = function () {
    var env = this.env, n = Math.min(this.cap - this.servings, this.reserve());
    if (this.cookT > 0) { env.svc.say(this.cx, this.cy - 50, '这锅还在熬', 16); return; }
    if (n <= 0) { env.svc.say(this.sack().x + 30, this.sack().y - 20, this.reserve() <= 0 ? '备的米用完了' : '锅还满着', 16); Au.play('wrong', { vol: 0.5 }); return; }
    this.batch = n; this.cookT = 9; Au.play('rice'); Fx.burst(this.cx, this.cy - 8, 'rice', 12, 24);
    if (this.servings <= 0) { this.stick = 0; this.scorched = false; }
  };
  PP.grabFor = function (dish, x, y) {
    var self = this, env = this.env;
    return { dish: dish, x: x, y: y, make: function () {
      if (self.servings < 1 || (env.stock[dish] || 0) < 1) { env.svc.say(self.cx, self.cy - 50, self.cookT > 0 ? '还在熬' : (env.stock[dish] || 0) < 1 ? '卖完了' : '锅空了，添米', 16); Au.play('wrong', { vol: 0.5 }); return null; }
      self.servings--; env.stock[dish]--; env.svc.cooked(dish); self.ladleT = 1; Au.play('ladle'); Fx.burst(self.cx, self.cy - 10, 'drop', 4, 10);
      return { dish: dish, q0: self.potQ(), out: env.t, st: 'pot' };
    } };
  };
  PP.press = function (x, y) {
    var self = this, sp = this.spoon(), sk = this.sack(), i;
    if (Math.hypot(x - sp.x, y - sp.y) < 36) return { tap: function () { self.stir(); } };
    if (Math.abs(x - sk.x) < 36 && Math.abs(y - sk.y) < 38) return { tap: function () { self.refill(); } };
    for (i = 0; i < this.tops.length; i++) { var tp = this.topPos(i); if (Math.abs(x - tp.x) < 34 && Math.abs(y - tp.y) < 36) return { grab: this.grabFor(this.tops[i], tp.x, tp.y) }; }
    var dx = (x - this.cx) / (this.rx + 6), dy = (y - this.cy) / (this.ry + 14);
    if (dx * dx + dy * dy <= 1 && this.dishes.indexOf('congee') >= 0) return { grab: this.grabFor('congee', this.cx, this.cy) };
    return null;
  };
  PP.points = function () { var o = { take: [this.cx, this.cy + 6], stir: [this.spoon().x, this.spoon().y], refill: [this.sack().x, this.sack().y] }, self = this; this.tops.forEach(function (d, i) { var p = self.topPos(i); o['top_' + d] = [p.x, p.y]; }); return o; };
  PP.describe = function () { return { type: 'pot', servings: this.servings, reserve: this.reserve(), stick: +this.stick.toFixed(2), scorched: this.scorched, cooking: this.cookT > 0 }; };
  PP.draw = function (ctx) {
    var r = this.r, env = this.env, cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry, t = this.t, i, self = this;
    stove(ctx, cx - rx * 0.96, cy + ry * 0.55, rx * 1.92, r.y + r.h - 6 - (cy + ry * 0.55), true);
    flame(ctx, cx, cy + ry + 22, rx * 1.2, t);
    ctx.fillStyle = '#b3ab9b'; ell(ctx, cx, cy + 26, rx, ry); ctx.fill(); ctx.fillRect(cx - rx, cy, rx * 2, 26);
    ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy + 26, rx, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = TEAL; U.rr(ctx, cx - rx - 18, cy - 9, 22, 18, 6); ctx.fill(); U.rr(ctx, cx + rx - 4, cy - 9, 22, 18, 6); ctx.fill();
    ctx.fillStyle = STEEL; ell(ctx, cx, cy, rx, ry); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#7d766a'; ell(ctx, cx, cy, rx - 8, ry - 6); ctx.fill();
    var lvl = clamp(this.servings / this.cap, 0, 1), cooking = this.cookT > 0;
    if (this.servings > 0 || cooking) {
      var k = 0.7 + 0.3 * Math.max(lvl, cooking ? 0.6 : 0), sy = cy + (1 - k) * 16;
      ctx.fillStyle = cooking && this.servings <= 0 ? '#e9ece2' : this.scorched ? '#e6d8b8' : '#f7f1de'; ell(ctx, cx, sy, (rx - 9) * k, (ry - 7) * k); ctx.fill();
      ctx.save(); ell(ctx, cx, sy, (rx - 9) * k, (ry - 7) * k); ctx.clip();
      if (this.stick > 0.45) { ctx.strokeStyle = 'rgba(150,96,40,' + clamp((this.stick - 0.45) * 1.1, 0, 0.7).toFixed(2) + ')'; ctx.lineWidth = 10; ell(ctx, cx, sy, (rx - 12) * k, (ry - 9) * k); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for (i = 0; i < 9; i++) { ctx.fillRect(cx + Math.cos(i * 2.3 + this.stirT * 6) * rx * 0.5 * k, sy + Math.sin(i * 1.9 + this.stirT * 6) * ry * 0.45 * k, 5, 2.5); }
      ctx.strokeStyle = 'rgba(190,176,140,.8)'; ctx.lineWidth = 2;
      for (i = 0; i < 4; i++) { var bp = (t * (cooking ? 1.4 : 0.55) + i * 0.29) % 1; ctx.globalAlpha = 1 - bp; ctx.beginPath(); ctx.arc(cx + Math.cos(i * 2.6 + 1) * rx * 0.45 * k, sy + Math.sin(i * 1.7) * ry * 0.4 * k, 2 + bp * 8, 0, 7); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    var sp = this.spoon(), a = this.stirT > 0 ? this.stirT * 12 : 0, tipx = cx + Math.cos(a) * rx * 0.34, tipy = cy + Math.sin(a) * ry * 0.34 - 2, urge = this.stick > 0.55 && this.stirT <= 0 ? Math.sin(t * 10) * 3 : 0;
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(sp.x + urge, sp.y); ctx.stroke();
    ctx.strokeStyle = '#b07a40'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tipx, tipy - 1); ctx.lineTo(sp.x + urge, sp.y - 1); ctx.stroke();
    ctx.fillStyle = '#a06a34'; ctx.beginPath(); ctx.arc(sp.x + urge, sp.y, 9, 0, 7); ctx.fill();
    if (this.stick > 0.55 && this.stirT <= 0) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '搅一搅', sp.x + 4, sp.y - 20, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
    if (this.ladleT > 0) { var ly = cy - 26 * Math.sin(this.ladleT * Math.PI); ctx.fillStyle = STEEL; ell(ctx, cx - 10, ly, 16, 10); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f7f1de'; ell(ctx, cx - 10, ly, 12, 7); ctx.fill(); }
    var sk = this.sack(), res = this.reserve(), want = this.servings <= 2 && res > 0 && !cooking;
    ctx.save(); ctx.translate(sk.x, sk.y + (want ? Math.sin(t * 7) * 2.5 : 0));
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, 0, 28, 30, 7); ctx.fill();
    ctx.fillStyle = '#d9c7a0'; U.rr(ctx, -28, -22, 56, 50, 10); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#fbfaf2'; ell(ctx, 0, -20, 22, 7); ctx.fill(); ctx.stroke();
    U.text(ctx, '米', 0, 13, { size: 22, bold: true, align: 'center', color: '#8a4a2a' });
    ctx.restore();
    badge(ctx, sk.x + 26, sk.y + 24, res, res <= 0);
    if (cooking) U.ring(ctx, sk.x, sk.y + 2, 36, 1 - this.cookT / 9, '#ffe28a', 5);
    else if (want) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '添米', sk.x, sk.y - 30, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
    this.tops.forEach(function (d, j) { var tp = self.topPos(j); source(ctx, tp.x, tp.y, d, env.stock[d] || 0, t, false); });
    badge(ctx, cx - rx + 6, cy - ry - 4, this.servings + '碗', this.servings <= 0);
  };
  function Soy(dishes, r, env) {
    this.type = 'soy'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.cap = 10; this.cups = Math.min(this.cap, env.stock.soy || 0);
    this.fill = 0; this.pouring = false; this.grinding = false; this.grind = 0; this.spillT = 0; this.millA = 0;
    this.cx = r.x + r.w / 2 + 16; this.top = r.y + 12;
  }
  var YP = Soy.prototype;
  YP.reserve = function () { return Math.max(0, (this.env.stock.soy || 0) - this.cups); };
  YP.count = function () { return 0; };
  YP.cupPos = function () { return { x: this.cx, y: this.r.y + 184 }; };
  YP.mill = function () { return { x: this.r.x + 32, y: this.r.y + 168 }; };
  YP.update = function (dt) {
    this.t += dt; var env = this.env, lv = env.lv.soy || 0;
    if (this.spillT > 0) this.spillT -= dt;
    if (this.pouring) {
      var rate = 0.95; if (lv >= 2 && this.fill > 0.78) rate *= 0.5;
      this.fill += dt * rate; Au.loop('pour', 1, this.fill);
      if (this.fill >= 1.04) this.endPour(true);
    } else Au.loop('pour', 0, 0);
    if (this.grinding) { this.grind += dt / 2.1; this.millA += dt * 7; Au.loop('grind', 1); if (this.grind >= 1) { var n = Math.min(this.cap - this.cups, this.reserve()); this.cups += n; this.grind = 0; this.grinding = false; Au.play('lid'); env.svc.say(this.mill().x + 20, this.mill().y - 40, '磨好 ' + n + ' 杯', 17); } }
    else Au.loop('grind', 0);
  };
  YP.endPour = function (over) {
    if (!this.pouring) return; this.pouring = false;
    var f = this.fill, env = this.env, lv = env.lv.soy || 0, c = this.cupPos(), lo = 0.8 - lv * 0.025;
    if (f < 0.3) { this.fill = 0; return; }
    var q = over ? 0.78 : f >= lo && f <= 1.0 ? 1 : f >= lo - 0.14 ? 0.84 : 0.62;
    if (over) { this.spillT = 0.5; Au.play('spill'); Fx.burst(c.x, c.y - 10, 'splash', 10, 12); env.svc.say(c.x, c.y - 50, '溢了', 17); if (this.cups > 1 && Math.random() < 0.5) { this.cups--; env.stock.soy--; env.svc.wasted('soy'); } }
    else { Au.play('cup'); env.svc.say(c.x, c.y - 50, q >= 1 ? '正好' : q >= 0.8 ? '差一点满' : '不满', 17, q >= 1 ? '#fff3b8' : null); }
    this.cups--; env.stock.soy--; env.svc.cooked('soy');
    this.fill = 0;
    env.svc.produce({ dish: 'soy', q0: q, out: env.t, st: 'soy' }, c.x, c.y - 10);
  };
  YP.press = function (x, y) {
    var self = this, env = this.env, c = this.cupPos(), m = this.mill();
    if (Math.abs(x - m.x) < 38 && Math.abs(y - m.y) < 44) {
      if (this.reserve() <= 0 || this.cups >= this.cap) { return { tap: function () { env.svc.say(m.x + 20, m.y - 40, self.reserve() <= 0 ? '豆子磨完了' : '桶还满着', 16); Au.play('wrong', { vol: 0.5 }); } }; }
      this.grinding = true; return { hold: { end: function () { self.grinding = false; } } };
    }
    if (Math.abs(x - c.x) < 62 && y > this.r.y + 60 && y < this.r.y + this.r.h) {
      if (this.cups <= 0) return { tap: function () { env.svc.say(c.x, c.y - 50, self.reserve() > 0 ? '桶空了，先磨豆' : '豆浆卖完了', 16); Au.play('wrong', { vol: 0.5 }); } };
      if (!env.svc.canTake('soy')) return { tap: function () { env.svc.say(c.x, c.y - 50, '台面满了', 16); Au.play('wrong', { vol: 0.5 }); } };
      this.pouring = true; this.fill = Math.max(this.fill, 0.02);
      return { hold: { end: function () { self.endPour(false); } } };
    }
    return null;
  };
  YP.points = function () { var c = this.cupPos(), m = this.mill(); return { pour: [c.x, c.y], mill: [m.x, m.y] }; };
  YP.describe = function () { return { type: 'soy', cups: this.cups, reserve: this.reserve(), fill: +this.fill.toFixed(2), pouring: this.pouring, grinding: this.grinding, band: [0.8 - (this.env.lv.soy || 0) * 0.025, 1.0] }; };
  YP.draw = function (ctx) {
    var r = this.r, cx = this.cx, top = this.top, t = this.t, c = this.cupPos(), m = this.mill();
    ctx.fillStyle = 'rgba(40,20,8,.28)'; ell(ctx, cx, r.y + r.h - 14, 62, 12); ctx.fill();
    ctx.fillStyle = TEAL; U.rr(ctx, cx - 48, top + 16, 96, 112, 16); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = CREAM; ctx.fillRect(cx - 47, top + 52, 94, 30); ctx.strokeStyle = TEALD; ctx.lineWidth = 2; ctx.strokeRect(cx - 47, top + 52, 94, 30);
    U.text(ctx, '豆浆', cx, top + 74, { size: 19, bold: true, align: 'center', color: TEALD });
    ctx.fillStyle = 'rgba(255,255,255,.16)'; U.rr(ctx, cx - 40, top + 22, 12, 96, 6); ctx.fill();
    ctx.fillStyle = TEALD; U.rr(ctx, cx - 40, top, 80, 20, 9); ctx.fill(); ctx.fillStyle = '#3a3836'; U.rr(ctx, cx - 9, top - 9, 18, 12, 5); ctx.fill();
    ctx.fillStyle = '#16332f'; U.rr(ctx, cx + 30, top + 24, 9, 24, 3); ctx.fill(); ctx.fillStyle = '#fbf6e6'; var lv = this.cups / this.cap; ctx.fillRect(cx + 32, top + 46 - 20 * lv, 5, 20 * lv);
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(cx - 6, top + 126, 12, 16); ctx.fillStyle = '#3a3836'; U.rr(ctx, cx - 14, top + 122, 28, 8, 3); ctx.fill();
    var cw = 38, ch = 44, cyTop = c.y - ch / 2;
    if (this.pouring || this.fill > 0) { ctx.fillStyle = '#fbf6e6'; ctx.fillRect(cx - 2.5, top + 142, 5, cyTop + ch - (top + 142) - ch * Math.min(1, this.fill)); }
    ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.moveTo(c.x - cw / 2, cyTop); ctx.lineTo(c.x + cw / 2, cyTop); ctx.lineTo(c.x + cw / 2 - 5, cyTop + ch); ctx.lineTo(c.x - cw / 2 + 5, cyTop + ch); ctx.closePath(); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.stroke();
    var f = Math.min(1, this.fill);
    if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(c.x - cw / 2, cyTop + ch * (1 - f), cw, ch * f); ctx.clip(); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(c.x - cw / 2 + 2, cyTop); ctx.lineTo(c.x + cw / 2 - 2, cyTop); ctx.lineTo(c.x + cw / 2 - 6, cyTop + ch - 2); ctx.lineTo(c.x - cw / 2 + 6, cyTop + ch - 2); ctx.closePath(); ctx.fill(); ctx.restore(); }
    var lo = 0.8 - (this.env.lv.soy || 0) * 0.025;
    ctx.strokeStyle = '#2f6f66'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c.x - cw / 2 - 5, cyTop + ch * (1 - lo)); ctx.lineTo(c.x - cw / 2 + 7, cyTop + ch * (1 - lo)); ctx.moveTo(c.x + cw / 2 + 5, cyTop + ch * (1 - lo)); ctx.lineTo(c.x + cw / 2 - 7, cyTop + ch * (1 - lo)); ctx.stroke();
    ctx.fillStyle = '#7a7468'; U.rr(ctx, c.x - 34, c.y + ch / 2 - 2, 68, 10, 4); ctx.fill();
    badge(ctx, cx - 44, top + 6, this.cups + '杯', this.cups <= 0);
    var res = this.reserve(), want = this.cups <= 2 && res > 0 && !this.grinding;
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, m.x, m.y + 30, 30, 8); ctx.fill();
    ctx.fillStyle = '#8f8a82'; U.rr(ctx, m.x - 26, m.y, 52, 26, 8); ctx.fill(); ctx.strokeStyle = '#4a4744'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#a8a39a'; ell(ctx, m.x, m.y - 2, 26, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a665e'; ell(ctx, m.x, m.y - 2, 6, 3); ctx.fill();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x, m.y - 2); ctx.lineTo(m.x + Math.cos(this.millA) * 30, m.y - 2 + Math.sin(this.millA) * 12 - 8); ctx.stroke();
    if (res > 0) badge(ctx, m.x + 20, m.y + 34, res, false);
    if (this.grinding) U.ring(ctx, m.x, m.y + 4, 38, this.grind, '#ffe28a', 5);
    else if (want) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '按住磨豆', m.x + 6, m.y - 26, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
  };
  function Side(dishes, r, env) { this.type = 'side'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0; this.cx = r.x + r.w / 2; }
  var DP = Side.prototype;
  DP.count = function () { return 0; };
  DP.pos = function (i) { var n = this.dishes.length; return { x: this.cx, y: this.r.y + (n === 1 ? 130 : 70 + i * 112) }; };
  DP.update = function (dt) { this.t += dt; if (!Fx.lowFx && Math.random() < dt * 0.8) { var p = this.pos(0); Fx.burst(p.x + (Math.random() - 0.5) * 30, p.y - 20, 'steam', 1, 6); } };
  DP.press = function (x, y) {
    var self = this, env = this.env;
    for (var i = 0; i < this.dishes.length; i++) { var p = this.pos(i); if (Math.abs(x - p.x) < 58 && Math.abs(y - p.y) < 52) return { grab: (function (dish, p2) { return { dish: dish, x: p2.x, y: p2.y, make: function () { if ((env.stock[dish] || 0) < 1) { env.svc.say(p2.x, p2.y - 50, '卖完了', 16); Au.play('wrong', { vol: 0.5 }); return null; } env.stock[dish]--; env.svc.cooked(dish); Au.play('spoon'); return { dish: dish, q0: 0.95, out: env.t, st: 'side' }; } }; })(this.dishes[i], p) }; }
    return null;
  };
  DP.points = function () { var o = {}, self = this; this.dishes.forEach(function (d, i) { var p = self.pos(i); o['src_' + d] = [p.x, p.y]; }); return o; };
  DP.describe = function () { return { type: 'side' }; };
  DP.draw = function (ctx) {
    var self = this, env = this.env, t = this.t;
    this.dishes.forEach(function (d, i) {
      var p = self.pos(i), n = env.stock[d] || 0;
      ctx.fillStyle = 'rgba(40,20,8,.28)'; ell(ctx, p.x, p.y + 40, 54, 10); ctx.fill();
      if (d === 'teaegg') {
        ctx.fillStyle = '#8a5a3a'; U.rr(ctx, p.x - 50, p.y - 6, 100, 46, 14); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#3a2416'; ell(ctx, p.x, p.y - 4, 46, 17); ctx.fill(); ctx.stroke();
        for (var k = 0; k < Math.min(5, n); k++) { ctx.fillStyle = '#a06a3a'; ctx.beginPath(); ctx.ellipse(p.x - 26 + k * 13, p.y - 5 + (k % 2) * 4, 8, 10, 0.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 1.5; ctx.stroke(); }
      } else {
        ctx.fillStyle = '#c99a5a'; U.rr(ctx, p.x - 50, p.y - 8, 100, 46, 10); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = 'rgba(90,56,20,.5)'; ctx.lineWidth = 2; for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(p.x - 48, p.y + j * 9); ctx.lineTo(p.x + 48, p.y + j * 9); ctx.stroke(); }
        ctx.fillStyle = '#e6d2a8'; ell(ctx, p.x, p.y - 8, 46, 16); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke();
        for (var q = 0; q < Math.min(4, n); q++) { ctx.fillStyle = '#3f7d3a'; ctx.beginPath(); ctx.ellipse(p.x - 26 + q * 17, p.y - 8, 10, 7, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#f4efe3'; ctx.beginPath(); ctx.ellipse(p.x - 26 + q * 17, p.y - 9, 5.5, 4, 0.3, 0, 7); ctx.fill(); }
      }
      badge(ctx, p.x + 40, p.y + 30, n, n <= 0);
    });
  };
  function layout(menu, area, env) {
    var types = D.stationsFor(menu), W = { pot: 1, fryer: 1.06, griddle: 1, boil: 1, soy: 0.72, side: 0.62 }, MAXW = { pot: 250, fryer: 262, griddle: 250, boil: 250, soy: 176, side: 150 };
    var gap = 8, sum = 0; types.forEach(function (k) { sum += W[k]; });
    var unit = Math.min(250, (area.w - gap * (types.length - 1)) / sum), widths = types.map(function (k) { return Math.min(MAXW[k], unit * W[k]); });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (types.length - 1), x = area.x + Math.max(0, (area.w - total) / 2), out = [];
    types.forEach(function (k, i) {
      var r = { x: x, y: area.y, w: widths[i], h: area.h }, ds = menu.filter(function (id) { return D.byId[id].st === k; });
      out.push(k === 'pot' ? new Pot(ds, r, env) : k === 'soy' ? new Soy(ds, r, env) : k === 'side' ? new Side(ds, r, env) : new SlotStation(k, ds, r, env));
      x += widths[i] + gap;
    });
    return out;
  }
  function silence() { ['sizzle', 'smoke', 'griddle', 'boil', 'simmer', 'grind'].forEach(function (n) { Au.loop(n, 0); }); Au.loop('pour', 0, 0); }
  return { layout: layout, quality: quality, word: word, windowOf: windowOf, doneCol: doneCol, badge: badge, silence: silence };
});
;
/* game/service.js */
BSX.define('game/service', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Stn = require('game/stations');
  var TICKET_Y = 92, SHELF = { x: 1076, y: 472, w: 196, h: 242 }, TIN = { x: 1010, y: 34 };
  var FOOT = People.FOOT;
  function pick(a) { return a && a.length ? a[Math.floor(Math.random() * a.length)] : null; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function Service(app, s, plan) {
    var self = this;
    this.app = app; this.s = s; this.plan = plan; this.t = 0; this.len = plan.len; this.ai = 0; this.state = 'open';
    this.nSlots = plan.slots; this.slotX = plan.slots === 3 ? [410, 640, 870] : [300, 520, 740, 960];
    this.cust = []; this.queue = []; this.bubbles = []; this.extras = []; this.uid = 1;
    this.shelf = []; this.shelfN = C.shelf(s);
    this.stock = {}; s.plan.menu.forEach(function (id) { self.stock[id] = s.plan.stock[id] || 0; });
    this.start = {}; for (var k in this.stock) this.start[k] = this.stock[k];
    this.sets = Run.setsOn(s);
    this.env = { s: s, stock: this.stock, t: 0, lv: {}, oilAge: s.oil.age, bulk: s.oil.bulk, svc: {
      say: function (x, y, text, size, color) { Fx.float(x, y, text, { size: size || 18, color: color || '#fff8e8' }); },
      cooked: function (d) { self.res.cooked[d] = (self.res.cooked[d] || 0) + 1; },
      wasted: function (d) { self.res.wasted++; },
      produce: function (item, x, y) { self.place(item, x, y); },
      smart: function (g) { self.smart(g); },
      canTake: function (d) { return !!self.target(d) || self.shelf.length < self.shelfN; },
      wants: function (d) { return self.wants(d); }
    } };
    D.order.forEach(function (st) { self.env.lv[st] = Run.skillLv(s, st); });
    this.stations = Stn.layout(s.plan.menu, { x: 10, y: 468, w: SHELF.x - 22, h: 248 }, this.env);
    this.res = { revenue: 0, tips: 0, served: 0, walked: 0, balked: 0, soldout: 0, delighted: 0, fine: 0, meh: 0, qSum: 0, qN: 0, waitSum: 0, waitN: 0, sold: {}, cooked: {}, want: {}, wasted: 0, burnAdd: 0, regs: {}, log: [], quotes: [], creditSum: 0 };
    this.remarks = plan.remarks.slice(); this.chatterT = 9; this.checkT = 0; this.helperT = 3; this.treat = false; this.drag = null; this.zb = null;
    this.h = Cond.read(s);
    this.cash0 = s.cash;
  }
  var P = Service.prototype;
  function lines(order) { return order.map(function (o) { return { d: o.d || null, wish: o.wish || null, mod: o.mod || null, set: o.set || null, got: false, pend: false, dead: false, q: 0, gave: null }; }); }
  P.mkCust = function (a) {
    var reg = a.kind === 'reg' ? Story.regs[a.id] : null, beat = reg && a.beat ? reg.beatById[a.beat] : null;
    return { uid: this.uid++, kind: a.kind, id: a.id || null, arch: a.arch || null, seed: a.seed, reg: reg, beat: beat, lines: lines(a.order), hide: !!a.hide, patience: a.patience, pmax: a.patience, tip: a.tip || 0.5,
      state: 'queue', st: 0, slot: -1, x: 96, wait: 0, qp: C.patience.queue[0] + Math.random() * (C.patience.queue[1] - C.patience.queue[0]) + (this.s.upg.awning ? 10 : 0) + (this.s.day <= 2 ? 40 : 0),
      emote: null, et: 0, shake: 0, hop: 0, chat: beat && beat.say && beat.say.chat ? { lines: beat.say.chat, i: -1, t: 0, on: false, done: false } : null, asked: false, peek: beat && beat.act === 'peek', act: beat ? beat.act : null, togo: beat && beat.togo, warned: false };
  };
  P.avail = function (dish) {
    var n = this.stock[dish] || 0;
    this.stations.forEach(function (st) { n += st.count(dish); });
    this.shelf.forEach(function (it) { if (it.dish === dish) n++; });
    Fx.flies.forEach(function (f) { if (f.item && f.item.dish === dish) n++; });
    if (this.drag && this.drag.item && this.drag.item.dish === dish) n++;
    return n;
  };
  P.wishOk = function (tag) { var self = this; return this.s.plan.menu.some(function (id) { return D.byId[id].tags.indexOf(tag) >= 0 && self.avail(id) > 0; }); };
  P.wants = function (dish) { var n = 0; this.cust.forEach(function (c) { if (c.state === 'wait') c.lines.forEach(function (l) { if (!l.got && !l.dead && !l.pend && l.d === dish) n++; }); }); return n; };
  P.prune = function (c, first) {
    var self = this, dropped = 0;
    c.lines.forEach(function (l) {
      if (l.got || l.dead || l.pend) return;
      if (first && l.d) self.res.want[l.d] = (self.res.want[l.d] || 0) + 1;
      var ok = l.d ? (self.s.plan.menu.indexOf(l.d) >= 0 && self.avail(l.d) > 0) : self.wishOk(l.wish);
      if (!ok) { l.dead = true; dropped++; }
    });
    if (dropped) { Au.play('soldout'); if (!c.warned) { c.warned = true; this.say(c, pick((Story.ambient.soldout) || ['没了？那算了。'])); } }
    return dropped;
  };
  P.openLines = function (c) { return c.lines.filter(function (l) { return !l.got && !l.dead; }); };
  P.say = function (c, text, life, style) {
    if (!text) return;
    this.bubbles = this.bubbles.filter(function (b) { return b.owner !== c.uid || b.style !== (style || 'a'); });
    this.bubbles.push({ owner: c.uid, c: c, text: text, t: 0, life: life || (1.9 + text.length * 0.07), style: style || 'a' });
    if (c.kind === 'reg' && style !== 'q') this.res.log.push([style === 'z' ? 'z' : style === 'b' ? (c.id === 'zhao' ? 'doudou' : c.id) : c.id, text]);
  };
  P.lineOf = function (c, key) {
    var am = Story.ambient, h = this.h;
    if (c.beat && c.beat.say && c.beat.say[key]) return c.beat.say[key];
    if (c.reg) {
      var b = c.reg.barks || {}, pool = b[key];
      if (key === 'in') { pool = (this.s.oil.age >= 3 && Run.usesOil(this.s) && b.inOilOld && b.inOilOld.length) ? b.inOilOld : (h.weather === 'rain' && b.inRain && b.inRain.length) ? b.inRain : (h.price === 2 && b.inPriceUp && b.inPriceUp.length) ? b.inPriceUp : (h.price === 0 && b.inPriceDown && b.inPriceDown.length) ? b.inPriceDown : (this.queue.length >= 3 && b.inBusy && b.inBusy.length) ? b.inBusy : b.in; }
      return pick(pool);
    }
    var w = (am.walkins || {})[c.arch] || {};
    if (key === 'in') {
      var wl = c.lines.filter(function (l) { return l.wish; })[0], ml = c.lines.filter(function (l) { return l.mod; })[0];
      if (wl && am.wish) return pick(am.wish[wl.wish]);
      if (ml && am.mods) return pick(am.mods[ml.mod]);
      return Math.random() < 0.5 ? pick(w.in) : null;
    }
    var odds = { good: 0.55, ok: 0.2, bad: 0.85, slow: 0.75, out: 0, treat: 1 }[key];
    return Math.random() < (odds == null ? 0.3 : odds) ? pick(w[key]) : null;
  };
  P.update = function (dt) {
    var self = this, i, c;
    this.t += dt; this.env.t = this.t;
    var arr = this.plan.arrivals;
    while (this.ai < arr.length && (arr[this.ai].t <= this.t || (this.t > this.len + 2 && !this.cust.length && !this.queue.length))) { this.queue.push(this.mkCust(arr[this.ai++])); }
    for (i = 0; i < this.nSlots && this.queue.length; i++) {
      if (this.cust.some(function (x) { return x.slot === i; })) continue;
      c = this.queue.shift(); c.slot = i; c.state = 'in'; c.st = 0; c.x = 96; this.cust.push(c); Au.play('bell', { vol: 0.5, pitch: 0.94 + Math.random() * 0.12 });
    }
    for (i = this.queue.length - 1; i >= 0; i--) { c = this.queue[i]; c.qp -= dt; if (c.qp <= 0) { this.queue.splice(i, 1); this.res.balked++; if (c.kind === 'reg') this.res.regs[c.id] = { outcome: 'walk', beat: null }; Fx.float(110, 300, '等不及，走了', { size: 16, color: '#ffd9c8' }); Au.play('leave', { vol: 0.5 }); } }
    for (i = this.cust.length - 1; i >= 0; i--) this.stepCust(this.cust[i], dt, i);
    this.stations.forEach(function (st) { st.update(dt); });
    for (i = this.extras.length - 1; i >= 0; i--) { var e = this.extras[i]; e.t -= dt; if (e.t <= 0) { this.extras.splice(i, 1); this.res.revenue += e.amount; this.res.regs[e.id].extra = 'kept'; this.coins(e.x, e.y, e.amount); } }
    for (i = this.bubbles.length - 1; i >= 0; i--) { this.bubbles[i].t += dt; if (this.bubbles[i].t >= this.bubbles[i].life) this.bubbles.splice(i, 1); }
    if (this.zb) { this.zb.t += dt; if (this.zb.t >= this.zb.life) this.zb = null; }
    if (this.remarks.length && this.t >= this.remarks[0].t) {
      var rm = this.remarks[0], spk = this.cust.filter(function (x) { return x.state === 'wait' && (rm.who === 'walkin' ? x.kind === 'walk' : x.id === rm.who); })[0] || (this.t > rm.t + 25 ? this.cust.filter(function (x) { return x.state === 'wait'; })[0] : null);
      if (spk) { this.remarks.shift(); this.say(spk, rm.line, 3.2); this.res.log.push([spk.id || 'neighbor', rm.line]); }
      else if (this.t > this.len) this.remarks.shift();
    }
    this.chatterT -= dt;
    if (this.chatterT <= 0) { this.chatterT = 13 + Math.random() * 9; if (this.queue.length >= 2 && Story.ambient.queue) { var pool = Story.ambient.queue.filter(function (q) { return Cond.check(self.s, q.need, self.h); }), q = pick(pool.slice(0, 5)); if (q && q.lines && q.lines.length) { var pr = pick(q.lines); this.doorTalk = { a: pr[0], b: pr[1], t: 0 }; } } }
    if (this.doorTalk) { this.doorTalk.t += dt; if (this.doorTalk.t > 5) this.doorTalk = null; }
    this.checkT -= dt;
    if (this.checkT <= 0) { this.checkT = 1; this.cust.forEach(function (x) { if (x.state === 'wait' && !x.peek) { if (self.prune(x, false) && !self.openLines(x).length) self.complete(x, false); } }); }
    if (this.s.helper) this.helper(dt);
    Au.setScene({ crowd: clamp((this.cust.length + this.queue.length) / 7, 0, 1) });
    if (this.state === 'open' && this.t >= this.len && this.ai >= arr.length && !this.queue.length && !this.cust.length && !Fx.flies.length) { this.state = 'done'; Stn.silence(); }
  };
  P.stepCust = function (c, dt, idx) {
    var tx = this.slotX[c.slot], self2 = this;
    c.st += dt; if (c.et > 0) c.et -= dt; if (c.shake > 0) c.shake -= dt; if (c.hop > 0) c.hop -= dt * 3;
    if (c.state === 'in') {
      var k = Math.min(1, c.st / 0.85); c.x = 96 + (tx - 96) * Fx.ease.out3(k);
      if (k >= 1) {
        c.state = 'wait'; c.st = 0; c.x = tx;
        if (c.kind === 'reg' && !this.res.regs[c.id]) this.res.regs[c.id] = { outcome: null, beat: c.beat ? c.beat.id : null };
        this.prune(c, true);
        if (this.treat && c.kind === 'walk') { this.treat = false; c.treated = true; }
        if (!c.peek && !this.openLines(c).length && c.reg) { var alt = c.reg.likes.filter(function (tg) { return self2.wishOk(tg); })[0]; if (alt) { c.lines.push({ d: null, wish: alt, mod: null, set: null, got: false, pend: false, dead: false, q: 0, gave: null }); c.hide = false; this.say(c, '那来点别的吧。'); c.warned = true; } }
        if (!c.peek && !this.openLines(c).length) { c.soldout = true; this.res.soldout++; if (c.kind === 'reg') this.res.regs[c.id].outcome = 'soldout'; this.leave(c, 'out'); return; }
        var ln = c.treated ? this.lineOf(c, 'treat') : this.lineOf(c, 'in'); if (ln && !c.warned) this.say(c, ln);
        if (c.hide && !(c.reg && this.s.reg[c.id].usual)) c.hidden = true;
      }
    } else if (c.state === 'wait') {
      var chatting = c.chat && c.chat.on;
      if (chatting) this.stepChat(c, dt);
      else { c.patience -= dt; c.wait += dt; }
      if (c.peek) { if (c.st > 5.5 && !chatting) { c.outcome = 'peek'; this.res.regs[c.id].outcome = 'peek'; this.res.regs[c.id].chat = !!(c.chat && c.chat.done); this.leave(c, 'out'); } return; }
      var f = c.patience / c.pmax;
      if (f < 0.34 && !c.slowSaid) { c.slowSaid = true; c.emote = 'sweat'; c.et = 2.4; var s2 = this.lineOf(c, 'slow'); if (s2) this.say(c, s2); }
      if (c.patience <= 0) { if (c.lines.some(function (l) { return l.got; })) this.complete(c, true); else this.walk(c); }
    } else if (c.state === 'pay') { if (c.st > 1.25) this.leave(c, null); }
    else if (c.state === 'out') { var k2 = Math.min(1, c.st / 0.9); c.x = tx + (60 - tx) * Fx.ease.inOut(k2); if (k2 >= 1) this.cust.splice(this.cust.indexOf(c), 1); }
  };
  P.stepChat = function (c, dt) {
    var ch = c.chat; ch.t -= dt;
    if (ch.t > 0) return;
    ch.i++;
    if (ch.i >= ch.lines.length) { ch.on = false; ch.done = true; if (this.res.regs[c.id]) this.res.regs[c.id].chat = true; c.emote = 'note'; c.et = 1.6; return; }
    var l = ch.lines[ch.i], who = l[0], text = l[1];
    ch.t = 1.5 + text.length * 0.085;
    if (who === 'z') { this.zb = { text: text, t: 0, life: ch.t, x: c.x }; this.res.log.push(['z', text]); }
    else this.say(c, text, ch.t, who === 'b' ? 'b' : 'a');
  };
  P.leave = function (c, key) { if (key) { var l = this.lineOf(c, key); if (l) this.say(c, l); } c.state = 'out'; c.st = 0; };
  P.walk = function (c) {
    this.res.walked++; if (c.kind === 'reg') this.res.regs[c.id].outcome = 'walk';
    c.emote = 'anger'; c.et = 2; Au.play('leave'); var l = this.lineOf(c, 'bad') || this.lineOf(c, 'slow'); if (l) this.say(c, l);
    this.res.waitSum += 1; this.res.waitN++;
    c.state = 'out'; c.st = 0;
  };
  P.matchLine = function (c, item) {
    var best = null, bq = -1, self = this, tags = D.byId[item.dish].tags;
    c.lines.forEach(function (l) { if (l.got || l.dead || l.pend) return; if (l.d === item.dish) { var q = Stn.quality(item, l.mod, self.env) + 1; if (q > bq) { bq = q; best = l; } } else if (l.wish && tags.indexOf(l.wish) >= 0 && bq < 0.5) { bq = 0.5; best = l; } });
    return best;
  };
  P.target = function (dish) {
    var tags = D.byId[dish].tags, exact = null, wish = null;
    this.cust.forEach(function (c) {
      if (c.state !== 'wait') return;
      c.lines.forEach(function (l) { if (l.got || l.dead || l.pend) return; var f = c.patience / c.pmax; if (l.d === dish) { if (!exact || f < exact.f) exact = { c: c, f: f }; } else if (l.wish && tags.indexOf(l.wish) >= 0) { if (!wish || f < wish.f) wish = { c: c, f: f }; } });
    });
    return exact ? exact.c : wish ? wish.c : null;
  };
  P.smart = function (g) {
    var c = this.target(g.dish), item;
    if (c) { item = g.make(); if (item) this.send(item, g.x, g.y, c); return true; }
    if (this.shelf.length < this.shelfN) { item = g.make(); if (item) this.toShelf(item, g.x, g.y); return true; }
    Fx.float(g.x, g.y - 40, '台面满了', { size: 17 }); Au.play('wrong', { vol: 0.5 }); return false;
  };
  P.place = function (item, x, y) { var c = this.target(item.dish); if (c) this.send(item, x, y, c); else this.toShelf(item, x, y); };
  P.icon = function (item) { return function (ctx, x, y, k) { var s = 56 + Math.sin(k * Math.PI) * 10; A.food(ctx, item.dish, x - s / 2, y - s / 2, s, {}); }; };
  P.send = function (item, x, y, c) {
    var l = this.matchLine(c, item), self = this;
    if (!l) { this.toShelf(item, x, y); return; }
    l.pend = true;
    Fx.fly({ item: item, x0: x, y0: y, x1: c.x, y1: 330, dur: 0.3, arc: 60, draw: this.icon(item), done: function () { l.pend = false; if (c.state === 'wait') self.deliver(item, c, l); else self.toShelf(item, c.x, 330); } });
  };
  P.shelfPos = function (i) { var col = i % 2, row = Math.floor(i / 2); return { x: SHELF.x + 52 + col * 94, y: SHELF.y + 70 + row * 62 }; };
  P.toShelf = function (item, x, y) {
    var self = this, i = this.shelf.length; this.shelf.push(item); item.flying = true; var p = this.shelfPos(i);
    Fx.fly({ x0: x, y0: y, x1: p.x, y1: p.y, dur: 0.28, arc: 40, draw: this.icon(item), done: function () { item.flying = false; Au.play('bowl', { vol: 0.6 }); } });
  };
  P.deliver = function (item, c, l) {
    var q = Stn.quality(item, l.mod, this.env), d = D.byId[item.dish];
    l.got = true; l.q = q; l.gave = item.dish; c.hop = 1;
    this.res.qSum += q; this.res.qN++;
    if (d.oil) this.res.burnAdd += C.oilBurn(this.env.oilAge, this.env.bulk);
    Fx.float(c.x, 322, Stn.word(q), { size: 20, color: q >= 0.92 ? '#fff3b8' : q >= 0.6 ? '#fff8e8' : '#ffc9b0' });
    Au.play(q >= 0.92 ? 'perfect' : q >= 0.6 ? 'serve' : 'meh', { vol: 0.8 });
    if (q >= 0.92) Fx.burst(c.x, 330, 'glint', 4, 16);
    if (!this.openLines(c).length) this.complete(c, false);
  };
  P.priceOf = function (c) {
    var s = this.s, sum = 0, sets = {};
    c.lines.forEach(function (l) { if (!l.got) return; if (l.set) { sets[l.set] = (sets[l.set] || 0) + 1; } sum += Run.price(s, l.gave); });
    for (var k in sets) { var n = Math.floor(sets[k] / D.byId[k].set.length); if (n > 0) { var parts = 0; D.byId[k].set.forEach(function (p) { parts += Run.price(s, p); }); sum -= n * (parts - Run.price(s, k)); } }
    return sum;
  };
  P.complete = function (c, timedOut) {
    var got = c.lines.filter(function (l) { return l.got; }), dead = c.lines.filter(function (l) { return l.dead; }).length, self = this, res = this.res, s = this.s;
    if (!got.length) { this.res.soldout++; if (c.kind === 'reg') res.regs[c.id].outcome = 'soldout'; this.leave(c, 'bad'); return; }
    var qa = 0; got.forEach(function (l) { qa += l.q; res.sold[l.gave] = (res.sold[l.gave] || 0) + 1; }); qa /= got.length;
    var wf = clamp(c.wait / c.pmax, 0, 1), bonus = 0;
    c.lines.forEach(function (l) { if (l.wish && l.got && c.reg && D.byId[l.gave].tags.some(function (tg) { return c.reg.likes.indexOf(tg) >= 0; })) bonus += 0.03; });
    var remembered = c.hide && !c.asked && !timedOut && !dead && c.kind === 'reg';
    if (remembered) bonus += 0.04;
    var sat = Run.satisfaction(qa, wf, bonus) - dead * 0.07 - (timedOut ? 0.22 : 0) - (c.lines.length - got.length - dead) * 0.1 + (c.treated ? 0.1 : 0), g = Run.grade(sat);
    res.served++; res.waitSum += wf; res.waitN++;
    if (g === 'delight') res.delighted++; else if (g === 'fine') res.fine++; else res.meh++;
    var pay = this.priceOf(c), tip = 0, txt = null;
    if (c.treated) { pay = 0; txt = '有人请了'; }
    if (g === 'delight' && !c.treated && Math.random() < c.tip * 0.6) tip = C.tip.delight * (Math.random() < 0.25 ? 2 : 1);
    var r = c.kind === 'reg' ? res.regs[c.id] : null;
    if (r) { r.outcome = g; r.remembered = remembered; r.asked = c.asked; r.chat = !!(c.chat && c.chat.done); }
    if (c.act === 'credit') { r.credit = pay; res.creditSum += pay; txt = '记账 ' + U.yuan(pay); pay = 0; tip = 0; Au.play('note'); }
    else if (c.act === 'repay') { var owed = s.credit[c.id] || 0; pay += owed; r.repaid = true; if (owed) txt = '连欠的一起 +' + U.yuan(pay); }
    else if (c.act === 'treat') { pay *= 2; this.treat = true; txt = '多付一份 +' + U.yuan(pay); }
    res.revenue += pay; res.tips += tip;
    if (pay + tip > 0) { this.coins(c.x, 400, pay + tip, c.act === 'coins'); Fx.float(c.x, 276, txt || ('+' + U.yuan(pay) + (tip ? ' 小费' : '')), { size: 21, color: '#ffe28a' }); }
    else if (txt) Fx.float(c.x, 276, txt, { size: 20, color: '#ffe28a' });
    if (c.act === 'overpay' && pay > 0) { this.extras.push({ x: c.x + 96, y: 470, amount: Math.min(pay, 400), t: 7, id: c.id, c: c }); r.extra = null; }
    if (remembered) { Fx.float(c.x, 236, '你还记得', { size: 18, color: '#c8f0d8' }); Au.play('heart'); }
    c.emote = g === 'delight' ? 'heart' : g === 'meh' ? 'anger' : null; c.et = 1.6;
    if (g === 'delight') Fx.burst(c.x, 300, 'heart', 2, 14);
    var line = this.lineOf(c, g === 'delight' ? 'good' : g === 'fine' ? 'ok' : 'bad'); if (line) this.say(c, line);
    if (c.kind === 'walk' && line && (g !== 'fine') && res.quotes.length < 4) res.quotes.push({ from: People.walkName(c.arch), text: line, g: g });
    c.state = 'pay'; c.st = 0; c.outcome = g; c.hidden = false;
  };
  P.coins = function (x, y, amount, slow) {
    var n = clamp(Math.round(amount / 300) + 1, 1, slow ? 9 : 6);
    for (var i = 0; i < n; i++) (function (i) { Fx.fly({ x0: x + (Math.random() - 0.5) * 30, y0: y, x1: TIN.x, y1: TIN.y, dur: 0.45 + i * (slow ? 0.16 : 0.06), arc: 70 + i * 8, draw: function (ctx, cx, cy) { ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#8a5a14'; ctx.fillRect(cx - 2, cy - 2, 4, 4); }, done: function () { Au.play('coin', { vol: 0.6, pitch: 0.9 + i * 0.06 }); } }); })(i);
    this.tinPop = 1;
  };
  P.helper = function (dt) {
    this.helperT -= dt; if (this.helperT > 0) return; this.helperT = 3.6;
    var self = this, done = false;
    this.stations.forEach(function (st) {
      if (done) return;
      if (st.type === 'soy') { if (st.cups > 0 && self.target('soy') && !st.pouring) { st.cups--; self.stock.soy--; self.env.svc.cooked('soy'); self.place({ dish: 'soy', q0: 0.86, out: self.t, st: 'soy' }, st.cupPos().x, st.cupPos().y); done = true; } else if (st.cups <= 1 && st.reserve() > 0 && !st.grinding) { st.cups += Math.min(st.cap - st.cups, st.reserve()); done = true; } }
      else if (st.type === 'side') { st.dishes.forEach(function (d, i) { if (!done && self.stock[d] > 0 && self.target(d)) { self.stock[d]--; self.env.svc.cooked(d); self.place({ dish: d, q0: 0.92, out: self.t, st: 'side' }, st.pos(i).x, st.pos(i).y); done = true; } }); }
      else if (st.type === 'pot') { if (st.stick > 0.6) { st.stir(); done = true; } else if (st.servings <= 1 && st.reserve() > 0 && st.cookT <= 0) { st.refill(); done = true; } }
    });
    if (done) this.helperHop = 1;
  };
  P.pointer = function (type, x, y) {
    if (type !== 'down' || this.state !== 'open') return null;
    var self = this, i, c;
    for (i = 0; i < this.extras.length; i++) { var e = this.extras[i]; if (Math.hypot(x - e.x, y - e.y) < 34) { this.extras.splice(i, 1); this.res.regs[e.id].extra = 'returned'; Au.play('coin'); Fx.float(e.x, e.y - 30, '多给的，还他', { size: 18, color: '#c8f0d8' }); if (e.c && e.c.state !== 'out') { e.c.emote = 'heart'; e.c.et = 1.5; } return null; } }
    for (i = 0; i < this.cust.length; i++) {
      c = this.cust[i]; if (c.state !== 'wait') continue;
      if (c.chat && !c.chat.on && !c.chat.done && Math.hypot(x - (c.x + 74), y - 292) < 36) { c.chat.on = true; c.chat.t = 0; Au.play('tap'); return null; }
      if (c.hidden && Math.abs(x - c.x) < 70 && y > TICKET_Y && y < TICKET_Y + 130) { c.hidden = false; c.asked = true; Au.play('page'); this.say(c, c.id === 'zhao' ? '老样子嘛——' : '忘啦？', 1.6); return null; }
    }
    for (i = 0; i < this.shelf.length; i++) { var p = this.shelfPos(i), it = this.shelf[i]; if (!it.flying && Math.abs(x - p.x) < 44 && Math.abs(y - p.y) < 30) { var g = { dish: it.dish, x: p.x, y: p.y, make: function () { var k = self.shelf.indexOf(it); if (k < 0) return null; self.shelf.splice(k, 1); return it; } }; return this.begin({ grab: g, tap: function () { var t = self.target(it.dish); if (t) { var m = g.make(); if (m) self.send(m, p.x, p.y, t); } else { Fx.float(p.x, p.y - 30, '现在没人要', { size: 16 }); } } }, x, y); } }
    for (i = 0; i < this.stations.length; i++) { var st = this.stations[i], r = st.r; if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 6) { var act = st.press(x, y); if (act) return this.begin(act, x, y); } }
    return null;
  };
  P.begin = function (act, x0, y0) {
    var self = this;
    if (act.hold) return function (type) { if (type === 'up' || type === 'cancel') act.hold.end(); };
    if (!act.grab) { act.tap(); return null; }
    var g = act.grab, moved = false;
    return function (type, x, y) {
      if (type === 'move') {
        if (!moved && Math.hypot(x - x0, y - y0) > 18) { var item = g.make(); if (!item) { moved = true; self.drag = null; return; } moved = true; self.drag = { item: item, x: x, y: y, g: g }; Au.play('pickup'); }
        if (self.drag) { self.drag.x = x; self.drag.y = y; }
      } else if (type === 'up' || type === 'cancel') {
        if (self.drag) { var d = self.drag; self.drag = null; self.drop(d.item, x, y); }
        else if (!moved && type === 'up') { if (act.tap) act.tap(); else self.smart(g); }
      }
    };
  };
  P.drop = function (item, x, y) {
    var self = this;
    if (y < 470) {
      var c = this.cust.filter(function (k) { return k.state === 'wait' && Math.abs(x - k.x) < 105; }).sort(function (a, b) { return Math.abs(x - a.x) - Math.abs(x - b.x); })[0];
      if (c) { var l = this.matchLine(c, item); if (l) { this.deliver(item, c, l); return; } c.shake = 0.4; Au.play('wrong'); Fx.float(c.x, 322, '不是这位的', { size: 17 }); }
    }
    if (x > SHELF.x + SHELF.w - 46 && y < SHELF.y + 40 && y > SHELF.y - 10) { Au.play('trash'); this.res.wasted++; Fx.burst(x, y, 'dust', 6, 8); return; }
    if (x >= SHELF.x - 10 && y >= SHELF.y - 10) { this.shelf.push(item); Au.play('bowl', { vol: 0.6 }); return; }
    this.place(item, x, y);
  };
  P.nextAction = function (o) {
    o = o || {};
    var self = this, env = this.env, acts = [], needs = [], i;
    this.cust.slice().sort(function (a, b) { return a.patience / a.pmax - b.patience / b.pmax; }).forEach(function (c) { if (c.state !== 'wait' || c.peek) return; c.lines.forEach(function (l) { if (!l.got && !l.dead && !l.pend) needs.push({ c: c, l: l }); }); });
    function stationOf(type) { return self.stations.filter(function (s) { return s.type === type; })[0]; }
    function needMod(dish) { var n = needs.filter(function (k) { return k.l.d === dish; })[0]; return n ? n.l.mod : null; }
    var supply = {};
    this.shelf.forEach(function (it) { supply[it.dish] = (supply[it.dish] || 0) + 1; });
    Fx.flies.forEach(function (f) { if (f.item) supply[f.item.dish] = (supply[f.item.dish] || 0) + 1; });
    this.stations.forEach(function (st) {
      var pts = st.points();
      if (st.slots) st.slots.forEach(function (it, j) {
        if (!it) return; var p = pts['slot' + j];
        if (it.burnt) { acts.push({ pri: 5, kind: 'tap', x: p[0], y: p[1], label: '糊了，清掉' }); return; }
        supply[it.dish] = (supply[it.dish] || 0) + 1;
        var w = Stn.windowOf(it, env), due = (it.flips + 1) / (it.need + 1) * w[0] * 0.92, verb = D.byId[it.dish].cook.verb || '翻面';
        if (it.flips < it.need) { if (it.d >= due) acts.push({ pri: 8, kind: 'tap', x: p[0], y: p[1], label: '点一下' + verb }); return; }
        var mod = needMod(it.dish), aim = mod === '嫩' ? w[0] - 0.12 : mod === '老' ? w[1] + 0.08 : w[0] + (w[1] - w[0]) * (o.aim == null ? 0.35 : o.aim);
        if (it.d >= aim) acts.push({ pri: 9, kind: 'tap', x: p[0], y: p[1], label: '正好，点一下出锅' });
      });
      if (st.type === 'pot') {
        if (st.stick > (o.stir || 0.62)) acts.push({ pri: 6, kind: 'tap', x: pts.stir[0], y: pts.stir[1], label: '搅一搅，别糊底' });
        if (st.servings <= 1 && st.reserve() > 0 && st.cookT <= 0) acts.push({ pri: 7, kind: 'tap', x: pts.refill[0], y: pts.refill[1], label: '锅快空了，添米' });
      }
      if (st.type === 'soy' && st.cups <= 0 && st.reserve() > 0 && !st.grinding) acts.push({ pri: 7, kind: 'hold', x: pts.mill[0], y: pts.mill[1], dur: 2.3, label: '按住磨豆' });
    });
    for (i = 0; i < this.shelf.length; i++) { var it = this.shelf[i]; if (!it.flying && this.target(it.dish)) { var sp = this.shelfPos(i); acts.push({ pri: 8.5, kind: 'tap', x: sp.x, y: sp.y, label: '台上有现成的，递过去' }); break; } }
    var planned = {};
    needs.forEach(function (n) {
      var dish = n.l.d;
      if (!dish) { var cands = self.s.plan.menu.filter(function (id) { return D.byId[id].tags.indexOf(n.l.wish) >= 0 && self.avail(id) > 0; }); cands.sort(function (a, b) { return (D.byId[a].cook ? 1 : 0) - (D.byId[b].cook ? 1 : 0); }); dish = cands[0]; if (!dish) return; }
      if ((supply[dish] || 0) > (planned[dish] || 0)) { planned[dish] = (planned[dish] || 0) + 1; return; }
      planned[dish] = (planned[dish] || 0) + 1;
      var d = D.byId[dish], st = stationOf(d.st); if (!st) return; var pts = st.points(), pri = 4 - n.c.patience / n.c.pmax;
      if (n.c.hidden && !o.remember) { acts.push({ pri: 3, kind: 'tap', x: n.c.x, y: TICKET_Y + 60, label: '不记得就点票据问一句' }); return; }
      if (d.st === 'pot') { if (st.servings >= 1 && (self.stock[dish] || 0) > 0) { var pp = d.top ? pts['top_' + dish] : pts.take; acts.push({ pri: pri, kind: 'tap', x: pp[0], y: pp[1], label: d.top ? '点小碗，盛一碗' + d.name : '点粥锅，盛一碗' }); } }
      else if (d.st === 'soy') { if (st.cups > 0 && !st.pouring) { var band = st.describe().band; acts.push({ pri: pri, kind: 'hold', x: pts.pour[0], y: pts.pour[1], dur: ((band[0] + band[1]) / 2 + (o.pourErr || 0)) / 0.95, label: '按住接豆浆，到刻线松手' }); } }
      else if (d.st === 'side') { if ((self.stock[dish] || 0) > 0) acts.push({ pri: pri, kind: 'tap', x: pts['src_' + dish][0], y: pts['src_' + dish][1], label: '顺手拿一个' }); }
      else if (st.free() >= 0 && (self.stock[dish] || 0) > 0) acts.push({ pri: pri, kind: 'tap', x: pts['src_' + dish][0], y: pts['src_' + dish][1], label: d.st === 'fryer' ? '点面板，下锅' : d.st === 'boil' ? '点一下，下锅煮' : '点一下，上锅' });
    });
    if (o.chat) this.cust.forEach(function (c) { if (c.state === 'wait' && c.chat && !c.chat.on && !c.chat.done) acts.push({ pri: 2.5, kind: 'tap', x: c.x + 74, y: 292, label: '他有话说，点"…"接一句' }); });
    if (o.extra !== false) this.extras.forEach(function (e) { if (o.returnExtra !== false) acts.push({ pri: 9.5, kind: 'tap', x: e.x, y: e.y, label: '他多给了，点硬币还回去' }); });
    acts.sort(function (a, b) { return b.pri - a.pri; });
    return acts[0] || null;
  };
  P.result = function () {
    var res = this.res, left = {}, n = 0, k;
    for (k in this.stock) { if (this.stock[k] > 0) { left[k] = this.stock[k]; n += this.stock[k]; } }
    this.shelf.forEach(function (it) { left[it.dish] = (left[it.dish] || 0) + 1; n++; });
    res.leftovers = left; res.leftover = n;
    return res;
  };
  P.describe = function () {
    return { t: +this.t.toFixed(1), len: this.len, state: this.state, queue: this.queue.length, shelf: this.shelf.map(function (i) { return i.dish; }), stock: this.stock,
      customers: this.cust.map(function (c) { return { who: c.id || c.arch, slot: c.slot, x: Math.round(c.x), state: c.state, patience: +(c.patience / c.pmax).toFixed(2), hidden: !!c.hidden, chat: c.chat ? (c.chat.done ? 'done' : c.chat.on ? 'on' : 'offer') : null, lines: c.lines.map(function (l) { return (l.d || '?' + l.wish) + (l.mod ? ':' + l.mod : '') + (l.got ? '✓' : l.dead ? '✗' : ''); }) }; }),
      stations: this.stations.map(function (s) { var d = s.describe(); d.points = s.points(); return d; }), revenue: this.res.revenue, served: this.res.served, walked: this.res.walked, balked: this.res.balked, extras: this.extras.length };
  };
  function wrapBubble(ctx, text, max) { return U.wrap(ctx, text, max, 19, 'bold'); }
  P.drawBubble = function (ctx, b) {
    var c = b.c, k = Math.min(1, b.t * 7), fade = b.t > b.life - 0.25 ? (b.life - b.t) / 0.25 : 1, kid = b.style === 'b';
    var ls = wrapBubble(ctx, b.text, 220), w = 0; ctx.save(); ctx.font = U.font(19, 'bold'); ls.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); }); ctx.restore();
    var bw = w + 28, bh = 16 + ls.length * 25, x = clamp(c.x - bw / 2 + (kid ? -150 : 24), 150, 1270 - bw), y = (kid ? 448 : 428) - bh;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x + bw / 2, y + bh); ctx.scale(0.6 + 0.4 * Fx.ease.back(k), 0.6 + 0.4 * Fx.ease.back(k)); ctx.translate(-(x + bw / 2), -(y + bh));
    ctx.fillStyle = 'rgba(40,22,8,.25)'; U.rr(ctx, x + 2, y + 4, bw, bh, 13); ctx.fill();
    ctx.fillStyle = kid ? '#fff3c8' : '#fffaf0'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; U.rr(ctx, x, y, bw, bh, 13); ctx.fill(); ctx.stroke();
    var tx = clamp(c.x + (kid ? -60 : 0), x + 18, x + bw - 18);
    ctx.beginPath(); ctx.moveTo(tx - 8, y + 1); ctx.lineTo(tx, y - 12); ctx.lineTo(tx + 8, y + 1); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 8, y); ctx.lineTo(tx, y - 12); ctx.lineTo(tx + 8, y); ctx.stroke();
    ls.forEach(function (l, i) { U.text(ctx, l, x + bw / 2, y + 30 + i * 25, { size: 19, bold: true, align: 'center', color: '#3b2a1a' }); });
    ctx.restore();
  };
  P.drawTicket = function (ctx, c) {
    var groups = [], self = this;
    c.lines.forEach(function (l) { var key = (l.d || '?' + l.wish) + '|' + (l.mod || '') + '|' + (l.set || ''); var g = groups.filter(function (x) { return x.key === key && x.got === l.got && x.dead === l.dead; })[0]; if (g) g.n++; else groups.push({ key: key, l: l, n: 1, got: l.got, dead: l.dead }); });
    var rows = c.hidden ? 1 : groups.length, rh = rows > 3 ? 34 : rows > 2 ? 40 : 44, w = 136, h = 34 + (c.hidden ? 62 : rows * rh) + 8, x = c.x - w / 2, y = TICKET_Y, f = clamp(c.patience / c.pmax, 0, 1);
    var sway = Math.sin(this.t * 1.6 + c.uid) * 0.02 + (f < 0.3 && c.state === 'wait' ? Math.sin(this.t * 22) * 0.015 : 0) + (c.shake > 0 ? Math.sin(c.shake * 40) * 0.06 : 0);
    ctx.save(); ctx.translate(c.x, y - 6); ctx.rotate(sway); ctx.translate(-c.x, -(y - 6));
    ctx.fillStyle = 'rgba(40,22,8,.22)'; U.rr(ctx, x + 3, y + 4, w, h, 6); ctx.fill();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w, h, 6); ctx.fill(); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.stroke();
    var reg = c.reg, name = reg ? reg.name : People.walkName(c.arch);
    ctx.fillStyle = reg ? '#2f6f66' : '#b89a6a'; U.rr(ctx, x + 2, y + 2, w - 4, 24, 4); ctx.fill();
    U.text(ctx, name, x + 10, y + 20, { size: 16, bold: true, color: '#fff8e8' });
    if (c.togo) U.text(ctx, '打包', x + w - 10, y + 20, { size: 14, bold: true, align: 'right', color: '#ffe28a' });
    else if (c.treated) U.text(ctx, '有人请', x + w - 10, y + 20, { size: 14, bold: true, align: 'right', color: '#ffe28a' });
    ctx.fillStyle = 'rgba(60,40,20,.18)'; ctx.fillRect(x + 8, y + 29, w - 16, 4);
    ctx.fillStyle = f > 0.5 ? '#5a9a56' : f > 0.25 ? '#e0a030' : '#c8442f'; ctx.fillRect(x + 8, y + 29, (w - 16) * f, 4);
    if (c.hidden) {
      U.text(ctx, '老样子', c.x, y + 66, { size: 26, bold: true, align: 'center', color: '#3b2a1a' });
      U.text(ctx, '不记得？点这里问', c.x, y + 88, { size: 13, align: 'center', color: '#8d7a60' });
    } else groups.forEach(function (g, i) {
      var ry = y + 38 + i * rh, l = g.l, is = rh - 4;
      ctx.save(); if (g.got || g.dead) ctx.globalAlpha = 0.38;
      if (c.hide && !g.got) ctx.globalAlpha *= 0.8;
      if (l.d) A.food(ctx, l.d, x + 6, ry, is, {});
      else { ctx.fillStyle = '#e8d8b0'; U.rr(ctx, x + 8, ry + 3, is - 4, is - 8, 8); ctx.fill(); U.text(ctx, '?', x + 6 + is / 2, ry + is / 2 + 7, { size: 22, bold: true, align: 'center', color: '#8a6a3a' }); }
      var tx = x + 10 + is;
      if (l.wish) U.text(ctx, '要' + l.wish, tx, ry + is / 2 + 6, { size: 17, bold: true, color: '#3b2a1a' });
      else { if (g.n > 1) { U.text(ctx, '×' + g.n, tx, ry + is / 2 + 7, { size: 21, bold: true, color: '#3b2a1a' }); tx += 32; } if (l.mod) { ctx.fillStyle = l.mod === '嫩' ? '#f0c860' : l.mod === '老' ? '#b86a2a' : '#7fb0c8'; ctx.beginPath(); ctx.arc(tx + 14, ry + is / 2, 14, 0, 7); ctx.fill(); U.text(ctx, l.mod, tx + 14, ry + is / 2 + 6, { size: 17, bold: true, align: 'center', color: l.mod === '嫩' ? '#3b2a1a' : '#fff8e8' }); } }
      ctx.restore();
      if (g.got) { ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + w - 34, ry + is / 2); ctx.lineTo(x + w - 26, ry + is / 2 + 8); ctx.lineTo(x + w - 12, ry + is / 2 - 10); ctx.stroke(); }
      if (g.dead) { ctx.strokeStyle = '#8d7a60'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 8, ry + is / 2); ctx.lineTo(x + w - 8, ry + is / 2); ctx.stroke(); U.text(ctx, '没了', x + w - 10, ry + is / 2 + 5, { size: 14, align: 'right', color: '#8d7a60' }); }
    });
    if (c.act === 'credit' && c.state === 'pay') { ctx.save(); ctx.translate(c.x + 20, y + h - 26); ctx.rotate(-0.2); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 3; ctx.strokeRect(-30, -15, 60, 30); U.text(ctx, '记账', 0, 7, { size: 19, bold: true, align: 'center', color: '#b8432f' }); ctx.restore(); }
    ctx.fillStyle = '#c99a5a'; U.rr(ctx, c.x - 8, y - 12, 16, 20, 3); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  };
  P.drawBack = function (ctx) {
    var s = this.s, self = this, i;
    Shop.drawBack(ctx, s, { post: s.plan.post, curtain: !!s.flags.man_curtain });
    if (this.queue.length) {
      ctx.save(); ctx.beginPath(); ctx.rect(40, 150, 96, 330); ctx.clip();
      for (i = Math.min(2, this.queue.length - 1); i >= 0; i--) { var q = this.queue[i], bob = Math.sin(this.t * 2 + i * 1.7) * 2; People.draw(ctx, q.id || 'walk', 70 + i * 24, 482, 168, { look: q.kind === 'walk' ? { arch: q.arch, seed: q.seed } : null, bob: bob, alpha: 0.92 }); }
      ctx.restore();
      Stn.badge(ctx, 90, 136, '门外 ' + this.queue.length, this.queue.length >= 4);
    }
    this.cust.slice().sort(function (a, b) { return a.slot - b.slot; }).forEach(function (c) {
      var moving = c.state === 'in' || c.state === 'out', bob = moving ? Math.abs(Math.sin(c.st * 11)) * -7 : Math.sin(self.t * 1.9 + c.uid) * 1.6 - Math.max(0, c.hop) * 9;
      var sx = c.shake > 0 ? Math.sin(c.shake * 46) * 5 : 0, h = People.height(c.id);
      People.draw(ctx, c.id || 'walk', c.x + sx, FOOT, h, { look: c.kind === 'walk' ? { arch: c.arch, seed: c.seed } : null, bob: bob, flip: c.state === 'out', squash: c.hop > 0 ? -0.03 * c.hop : 0 });
    });
    if (s.helper) { this.helperHop = Math.max(0, (this.helperHop || 0) - 0.05); People.draw(ctx, 'guifen', 1178, FOOT + 6, 262, { bob: -this.helperHop * 8 + Math.sin(this.t * 1.7) * 1.5, flip: true }); }
  };
  P.drawShelf = function (ctx) {
    var x = SHELF.x, y = SHELF.y, w = SHELF.w, rows = Math.ceil(this.shelfN / 2), h = 46 + rows * 62, i;
    ctx.fillStyle = 'rgba(40,20,8,.28)'; U.rr(ctx, x, y + 6, w, h, 12); ctx.fill();
    ctx.fillStyle = '#d9a868'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#c4904e'; U.rr(ctx, x + 8, y + 36, w - 16, h - 44, 8); ctx.fill();
    U.text(ctx, '出餐台', x + 14, y + 26, { size: 17, bold: true, color: '#5a3418' });
    ctx.fillStyle = '#6f7a80'; U.rr(ctx, x + w - 40, y + 6, 28, 26, 5); ctx.fill(); ctx.strokeStyle = '#3c4448'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#3c4448'; ctx.fillRect(x + w - 42, y + 5, 32, 4);
    for (i = 0; i < this.shelfN; i++) { var p = this.shelfPos(i); ctx.fillStyle = 'rgba(90,52,20,.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 16, 36, 9, 0, 0, 7); ctx.fill(); }
    for (i = 0; i < this.shelf.length; i++) {
      var it = this.shelf[i]; if (it.flying) continue; var sp = this.shelfPos(i), d = D.byId[it.dish], age = this.t - it.out, hold = d.hold * (this.s.upg.shelf ? 1.6 : 1), cold = age > hold;
      A.food(ctx, it.dish, sp.x - 30, sp.y - 34, 60, { alpha: cold ? 0.72 : 1 });
      if (cold) U.text(ctx, '凉了', sp.x + 22, sp.y + 22, { size: 13, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(60,40,20,.9)' });
      else if (d.temp && age < hold * 0.6 && Math.sin(this.t * 3 + i) > 0.2) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(sp.x + Math.sin(this.t * 2 + i) * 5, sp.y - 34 - ((this.t * 14 + i * 7) % 14), 4, 0, 7); ctx.fill(); }
    }
  };
  P.draw = function (ctx) {
    var self = this, s = this.s, i;
    this.drawBack(ctx);
    Shop.drawCounter(ctx);
    var pill = s.burn >= 85 ? 3 : s.burn >= 60 ? 2 : s.burn >= 30 ? 1 : 0;
    for (i = 0; i < pill; i++) { var px = 1010 + i * 20, py = 452; ctx.fillStyle = '#f4f0e6'; U.rr(ctx, px, py - 8 - i * 3, 30, 14, 3); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#4a8ab8'; ctx.fillRect(px + 3, py - 5 - i * 3, 24, 4); }
    this.stations.forEach(function (st) { st.draw(ctx); });
    this.drawShelf(ctx);
    Fx.drawParts(ctx);
    Shop.drawLight(ctx);
    ctx.strokeStyle = 'rgba(90,60,30,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(190, TICKET_Y - 14); ctx.quadraticCurveTo(640, TICKET_Y - 4, 1000, TICKET_Y - 14); ctx.stroke();
    this.cust.forEach(function (c) { if (c.state === 'wait' || c.state === 'pay') { if (!c.peek) self.drawTicket(ctx, c); if (c.chat && !c.chat.on && !c.chat.done && c.state === 'wait') People.emote(ctx, 'dots', c.x + 74, 292, c.st); if (c.emote && c.et > 0) People.emote(ctx, c.emote, c.x - 70, 288, 1.8 - c.et + 0.2); } });
    if (this.doorTalk) { var dk = this.doorTalk, t1 = dk.t < 2.6 ? dk.a : dk.b, yy = dk.t < 2.6 ? 210 : 250, wv = Math.min(1, (dk.t % 2.6) * 6); if (t1) { ctx.save(); ctx.globalAlpha = Math.min(wv, dk.t > 4.6 ? (5 - dk.t) / 0.4 : 1) * 0.94; ctx.font = U.font(15, 'bold'); var tw = ctx.measureText(t1).width + 20; ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; U.rr(ctx, 140, yy, tw, 28, 10); ctx.fill(); ctx.stroke(); U.text(ctx, t1, 150, yy + 20, { size: 15, bold: true, color: '#5a4630' }); ctx.restore(); } }
    this.bubbles.forEach(function (b) { if (b.c.state !== 'out' || b.t < 1) self.drawBubble(ctx, b); });
    if (this.zb) { var z = this.zb, zk = Math.min(1, z.t * 7); ctx.save(); ctx.font = U.font(19, 'bold'); var zw = ctx.measureText(z.text).width + 30, zx = clamp(z.x - zw / 2 + 110, 20, 1260 - zw), zy = 462; ctx.globalAlpha = z.t > z.life - 0.25 ? (z.life - z.t) / 0.25 : zk; ctx.fillStyle = '#2f6f66'; ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; U.rr(ctx, zx, zy, zw, 40, 13); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(zx + zw / 2 - 8, zy + 39); ctx.lineTo(zx + zw / 2, zy + 52); ctx.lineTo(zx + zw / 2 + 8, zy + 39); ctx.fill(); U.text(ctx, z.text, zx + zw / 2, zy + 27, { size: 19, bold: true, align: 'center', color: '#fff8e8' }); ctx.restore(); }
    this.extras.forEach(function (e) { var k = 1 + Math.sin(self.t * 9) * 0.12; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(k, k); Shop.glow(ctx, 0, 0, 30, '255,226,138', 0.55); ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#8a5a14'; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); U.text(ctx, '多给了 · 点它还回去', e.x, e.y + 34, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); });
    Fx.drawFlies(ctx);
    Shop.grade(ctx);
    if (this.drag) { var dg = this.drag; ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(dg.x, dg.y + 30, 26, 8, 0, 0, 7); ctx.fill(); ctx.restore(); A.food(ctx, dg.item.dish, dg.x - 36, dg.y - 44, 72, {}); }
    Fx.drawFloats(ctx);
  };
  return { Service: Service, TIN: TIN, SHELF: SHELF, FOOT: FOOT, TICKET_Y: TICKET_Y };
});
;
/* game/director.js */
BSX.define('game/director', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var Shop = require('game/shop');
  var People = require('game/people');
  var SLOT = [330, 560, 790, 1020], FOOT = People.FOOT;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function Director(app, s, scene, onDone) {
    this.app = app; this.s = s; this.scene = scene; this.onDone = onDone;
    this.q = scene.beats.slice(); this.actors = []; this.props = []; this.cur = null; this.log = []; this.t = 0; this.done = false;
    this.auto = !!app.settings.autoPlay; this.fast = false; this.skipping = false;
    this.canSkip = !!(app.legacy.scenes && app.legacy.scenes[scene.id]);
    if (scene.light) Shop.setLight(scene.light);
    Au.setScene({ music: scene.id === 'crisis' || scene.id === 'rescue' ? 'tense' : 'story' });
    this.next();
  }
  var P = Director.prototype;
  P.actor = function (id) { return this.actors.filter(function (a) { return a.who === id && a.state !== 'gone'; })[0]; };
  P.resolve = function (id) { return id === 'best' ? Run.best(this.s) : id; };
  P.next = function () {
    var s = this.s, self = this;
    this.cur = null;
    while (this.q.length) {
      var b = this.q.shift();
      if (Array.isArray(b)) { var who = this.resolve(b[0]); this.cur = { type: 'say', who: who, text: b[1], n: 0, t: 0, hold: 0 }; this.log.push([who, b[1]]); if (this.skipping) continue; if (who !== 'n') Au.setDuck(true); return; }
      if (b.enter) { var id = this.resolve(b.enter), ex = this.actor(id); if (!ex) { this.actors.push({ who: id, slot: b.slot == null ? 2 : b.slot, x: 96, t: 0, state: 'in' }); Au.play('bell', { vol: 0.5 }); if (!this.skipping) { this.cur = { type: 'wait', left: 0.75, t: 0 }; return; } } continue; }
      if (b.exit) { var a = this.actor(this.resolve(b.exit)); if (a) { a.state = 'out'; a.t = 0; } continue; }
      if (b.prop) { if (b.off) this.props = this.props.filter(function (p) { return p.prop !== b.prop; }); else if (!this.props.some(function (p) { return p.prop === b.prop; })) { this.props.push({ prop: b.prop, label: b.label, t: 0 }); Au.play('bowl', { vol: 0.5 }); } continue; }
      if (b.fx) { this.apply(b.fx); continue; }
      if (b.if) { this.q = (Cond.check(s, b.if) ? (b.then || []) : (b.else || [])).concat(this.q); continue; }
      if (b.sfx) { if (!this.skipping) Au.play(b.sfx === 'rain' ? 'thunder' : b.sfx === 'sizzle' ? 'drop_oil' : b.sfx === 'pour' ? 'cup' : b.sfx); continue; }
      if (b.light) { Shop.setLight(b.light); if (b.light === 'candle') Au.play('candle'); continue; }
      if (b.bus) { Shop.busPass(!!s.flags.s_bus_stop); Au.play('bus'); continue; }
      if (b.shutter) { Shop.setShutter(b.shutter === 'up' ? 0 : b.shutter === 'half' ? 0.5 : 1); Au.play(b.shutter === 'down' ? 'shutter_down' : 'shutter_up'); if (b.shutter === 'up') { Shop.setLight('dawn'); Au.setScene({ music: 'open' }); } if (!this.skipping) { this.cur = { type: 'wait', left: 1.25, t: 0 }; return; } continue; }
      if (b.wait) { if (!this.skipping) { this.cur = { type: 'wait', left: b.wait, t: 0 }; return; } continue; }
      if (b.do) { if (this.skipping && !/卷帘门/.test(b.label || '')) continue; this.skipping = false; this.cur = { type: 'do', kind: b.do, label: b.label || '', p: 0, holding: false, t: 0 }; return; }
      if (b.choice) {
        this.skipping = false; Au.setDuck(false);
        var opts = b.choice.map(function (c) { return { c: c, ok: Cond.check(s, c.need) }; });
        if (!opts.some(function (o) { return o.ok; })) opts[opts.length - 1].ok = true;
        this.cur = { type: 'choice', opts: opts, t: 0 }; return;
      }
    }
    this.finish();
  };
  P.apply = function (fx) {
    var s = this.s, n0 = (s.today.news || []).length;
    Cond.apply(s, fx);
    var news = s.today.news || [];
    for (var i = n0; i < news.length; i++) this.app.news(news[i]);
  };
  P.finish = function () {
    if (this.done) return; this.done = true; Au.setDuck(false);
    this.actors.forEach(function (a) { if (a.state !== 'gone') { a.state = 'out'; a.t = 0; } });
    Run.sceneDone(this.s, this.scene.id, this.log);
    this.app.legacy.scenes = this.app.legacy.scenes || {}; this.app.legacy.scenes[this.scene.id] = 1;
    this.endT = 0.5;
  };
  P.choose = function (i) {
    var o = this.cur.opts[i]; if (!o || !o.ok) { Au.play('wrong'); return; }
    Au.play('stamp'); this.log.push(['choice', o.c.label]);
    this.apply(o.c.fx);
    this.q = (o.c.then || []).concat(this.q);
    this.next();
  };
  P.skip = function () { if (!this.canSkip || this.done) return; this.skipping = true; if (this.cur && this.cur.type !== 'choice' && this.cur.type !== 'do') this.next(); };
  P.update = function (dt) {
    var self = this, c = this.cur, sp = this.fast ? 4 : 1;
    this.t += dt;
    this.actors.forEach(function (a) {
      a.t += dt * sp; var tx = SLOT[a.slot];
      if (a.state === 'in') { var k = Math.min(1, a.t / 0.75); a.x = 96 + (tx - 96) * Fx.ease.out3(k); if (k >= 1) { a.state = 'idle'; a.x = tx; } }
      else if (a.state === 'out') { var k2 = Math.min(1, a.t / 0.8); a.x = tx + (60 - tx) * Fx.ease.inOut(k2); if (k2 >= 1) a.state = 'gone'; }
    });
    this.props.forEach(function (p) { p.t += dt; });
    if (this.done) { this.endT -= dt; if (this.endT <= 0 && this.onDone) { var f = this.onDone; this.onDone = null; f(); } return; }
    if (!c) return;
    c.t += dt * sp;
    if (c.type === 'say') {
      var full = c.text.length;
      if (c.n < full) { c.n = Math.min(full, c.n + dt * 34 * sp); if (Math.floor(c.n) % 3 === 0 && !this.fast) Au.play('tap', { vol: 0.12, pitch: c.who === 'z' ? 0.8 : 1.15 }); }
      else { c.hold += dt * sp; if ((this.auto || this.fast) && c.hold > 1.1 + full * 0.07) this.next(); }
    } else if (c.type === 'wait') { c.left -= dt * sp; if (c.left <= 0) { this.next(); return; } }
    if (c.type === 'do') {
      var shut = /卷帘门/.test(c.label), down = /拉下/.test(c.label);
      if (c.kind === 'hold') {
        if (c.holding) { c.p = Math.min(1, c.p + dt / 0.95); if (shut && Math.floor(c.p * 9) !== c.tick) { c.tick = Math.floor(c.p * 9); Au.play('shutter_tick'); } }
        else c.p = Math.max(0, c.p - dt * 1.4);
        if (shut) Shop.setShutter(down ? c.p * 0.3 : 1 - c.p * 0.3, false);
        if (c.p >= 1) { this.app.P.vibrate('heavy'); this.next(); }
      }
    }
  };
  P.pointer = function (type, x, y) {
    var c = this.cur, self = this;
    if (this.done || !c) return null;
    if (c.type === 'do' && c.kind === 'hold') { if (type === 'down') { c.holding = true; return function (t2) { if (t2 === 'up' || t2 === 'cancel') c.holding = false; }; } return null; }
    if (type !== 'down') return null;
    if (c.type === 'do') { Au.play('page'); this.next(); return null; }
    if (c.type === 'say') { if (c.n < c.text.length) c.n = c.text.length; else this.next(); }
    return null;
  };
  P.drawActors = function (ctx) {
    var self = this, c = this.cur;
    this.actors.forEach(function (a) {
      if (a.state === 'gone') return;
      var moving = a.state !== 'idle', talk = c && c.type === 'say' && c.who === a.who && c.n < c.text.length;
      var bob = moving ? Math.abs(Math.sin(a.t * 11)) * -7 : talk ? Math.abs(Math.sin(self.t * 9)) * -4 : Math.sin(self.t * 1.8 + a.slot) * 1.5;
      People.draw(ctx, a.who, a.x, self.foot || FOOT, People.height(a.who) * (self.scale || 1), { bob: bob, flip: a.state === 'out' });
    });
  };
  function drawProp(ctx, p, x, y, t) {
    var k = Fx.ease.back(Math.min(1, p.t * 5));
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(40,20,8,.28)'; ctx.beginPath(); ctx.ellipse(0, 24, 46, 9, 0, 0, 7); ctx.fill();
    var id = p.prop;
    function paper(w, h, col, lines) { ctx.save(); ctx.rotate(-0.05); ctx.fillStyle = col || '#fbf5e4'; ctx.fillRect(-w / 2, -h + 22, w, h); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -h + 22, w, h); ctx.strokeStyle = 'rgba(70,50,30,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var i = 0; i < (lines || 4); i++) { ctx.moveTo(-w / 2 + 8, -h + 38 + i * 9); ctx.lineTo(w / 2 - 8 - (i === lines - 1 ? 14 : 0), -h + 38 + i * 9); } ctx.stroke(); ctx.restore(); }
    if (id === 'lease' || id === 'paper' || id === 'slip') { paper(64, 82, '#fbf5e4', 6); if (id === 'lease') { ctx.fillStyle = '#b8432f'; ctx.beginPath(); ctx.arc(16, 6, 9, 0, 7); ctx.fill(); } }
    else if (id === 'envelope') { ctx.fillStyle = '#e8d8b0'; ctx.fillRect(-40, -26, 80, 48); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(-40, -26, 80, 48); ctx.beginPath(); ctx.moveTo(-40, -26); ctx.lineTo(0, 2); ctx.lineTo(40, -26); ctx.stroke(); }
    else if (id === 'powder') { ctx.fillStyle = '#f4f0e6'; U.rr(ctx, -26, -42, 52, 64, 6); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#d8a030'; ctx.fillRect(-26, -22, 52, 20); ctx.fillStyle = '#8a8a82'; ctx.fillRect(-14, -8 + 14, 28, 3); }
    else if (id === 'meat') { ctx.fillStyle = '#f4f0e6'; ctx.fillRect(-44, -6, 88, 26); ctx.fillStyle = '#c8605a'; ctx.beginPath(); ctx.ellipse(0, -6, 38, 20, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a3a34'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#f2d8cc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -10); ctx.quadraticCurveTo(0, -20, 22, -6); ctx.stroke(); }
    else if (id === 'phone') { ctx.save(); ctx.rotate(Math.sin(t * 40) * 0.03); ctx.fillStyle = '#26262a'; U.rr(ctx, -20, -40, 40, 62, 6); ctx.fill(); ctx.fillStyle = '#7fd0ff'; ctx.fillRect(-16, -34, 32, 46); ctx.fillStyle = '#fff'; ctx.fillRect(-12, -28, 24, 4); ctx.fillRect(-12, -20, 18, 4); ctx.restore(); }
    else if (id === 'mug') Shop.drawMemento(ctx, 'mug', 0, 20, 2);
    else if (id === 'pumpkin') { ctx.scale(2.2, 2.2); Shop.drawMemento(ctx, 'food', 0, 10, 2); }
    else if (id === 'notebook' || id === 'homework' || id === 'ledger') { ctx.save(); ctx.rotate(0.06); ctx.fillStyle = id === 'ledger' ? '#2f6f66' : id === 'homework' ? '#e8d05a' : '#3a4a6a'; U.rr(ctx, -36, -34, 72, 54, 4); ctx.fill(); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fbf5e4'; ctx.fillRect(-28, -26, 40, 14); ctx.restore(); }
    else if (id === 'candle') { ctx.fillStyle = '#f4ead0'; ctx.fillRect(-6, -26, 12, 46); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(0, -36 + Math.sin(t * 11) * 1.5, 5, 10, 0, 0, 7); ctx.fill(); }
    else if (id === 'keys') { ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -14, 14, 0, 7); ctx.stroke(); ctx.fillStyle = '#e8b54a'; [[-16, 4, -0.5], [0, 8, 0], [16, 4, 0.5]].forEach(function (q) { ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(q[2]); ctx.fillRect(-3, -8, 6, 22); ctx.fillRect(-3, 8, 9, 4); ctx.restore(); }); }
    else if (id === 'curtain') { ctx.fillStyle = '#f2ead8'; ctx.fillRect(-46, -30, 92, 46); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-46, -30, 92, 8); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.strokeRect(-46, -30, 92, 46); U.text(ctx, '不烧心', 0, 6, { size: 20, bold: true, align: 'center', color: '#2f6f66' }); }
    else if (id === 'photo') { ctx.scale(2, 2); Shop.drawMemento(ctx, 'photo', 0, 0, 1); }
    else if (id === 'pills') { ctx.fillStyle = '#f4f0e6'; U.rr(ctx, -34, -12, 68, 30, 4); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#4a8ab8'; ctx.fillRect(-28, -4, 56, 8); }
    else if (id === 'veg') { ctx.fillStyle = '#b8823a'; U.rr(ctx, -44, -8, 88, 30, 8); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 2; ctx.stroke(); ['#4f8a4b', '#6aa85a', '#3f7a3a', '#5a9a4a'].forEach(function (col, i) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(-30 + i * 20, -12, 14, 12, 0, 0, 7); ctx.fill(); }); }
    else if (id === 'oilcan') { ctx.fillStyle = '#e8c04a'; U.rr(ctx, -26, -44, 52, 66, 8); ctx.fill(); ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-10, -52, 20, 10); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-20, -36, 6, 50); }
    else if (id === 'cash') { ['#d86a5a', '#c85a4a', '#e07a6a'].forEach(function (col, i) { ctx.fillStyle = col; ctx.fillRect(-36 + i * 4, -6 - i * 5, 72, 22); ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 1.5; ctx.strokeRect(-36 + i * 4, -6 - i * 5, 72, 22); }); }
    else paper(60, 70, '#fbf5e4', 5);
    ctx.restore();
    if (p.label) U.text(ctx, p.label, x, y + 50, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(60,36,16,.85)' });
  }
  P.drawProps = function (ctx) {
    var n = this.props.length, t = this.t;
    this.props.forEach(function (p, i) { drawProp(ctx, p, 640 + (i - (n - 1) / 2) * 150, 492, t); });
  };
  P.drawSpeech = function (ctx) {
    var c = this.cur, self = this; if (!c) return;
    if (c.type === 'say') {
      var text = c.text.slice(0, Math.floor(c.n)), who = c.who, done = c.n >= c.text.length;
      var k = Math.min(1, c.t * 6), px = 150, pw = 980, ph = 158, py = 548 + (1 - Fx.ease.out3(k)) * 14;
      var gg = ctx.createLinearGradient(0, 470, 0, 720); gg.addColorStop(0, 'rgba(18,12,8,0)'); gg.addColorStop(1, 'rgba(18,12,8,.62)'); ctx.fillStyle = gg; ctx.fillRect(0, 470, 1280, 250);
      if (who === 'n') {
        ctx.fillStyle = 'rgba(22,16,10,.8)'; U.rr(ctx, px + 40, py + 8, pw - 80, ph - 16, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(232,200,150,.35)'; ctx.lineWidth = 1.5; U.rr(ctx, px + 48, py + 16, pw - 96, ph - 32, 6); ctx.stroke();
        var nl = U.wrap(ctx, c.text, pw - 200, 27, 'bold', true), ny = py + ph / 2 - (nl.length - 1) * 20 + 9;
        U.wrap(ctx, text, pw - 200, 27, 'bold', true).forEach(function (l, i) { U.text(ctx, l, 640, ny + i * 40, { size: 27, bold: true, kai: true, align: 'center', color: '#f4e4c4' }); });
        if (done) U.text(ctx, '▾', px + pw - 70, py + ph - 26 + Math.sin(self.t * 5) * 2, { size: 18, color: '#f4e4c4', align: 'center' });
        return;
      }
      var z = who === 'z', name = Story.who(who), reg = Cast.regulars[who], side = z ? 1 : 0;
      ctx.fillStyle = 'rgba(20,12,6,.4)'; U.rr(ctx, px + 4, py + 7, pw, ph, 12); ctx.fill();
      ctx.fillStyle = z ? '#eef0e2' : '#fbf5e4'; U.rr(ctx, px, py, pw, ph, 12); ctx.fill(); ctx.strokeStyle = z ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = z ? 'rgba(47,111,102,.25)' : 'rgba(125,90,53,.25)'; ctx.lineWidth = 1.5; U.rr(ctx, px + 7, py + 7, pw - 14, ph - 14, 8); ctx.stroke();
      var fw = 150, fx0 = side ? px + pw - fw - 16 : px + 16, fy0 = py - 46, fh = ph + 30;
      ctx.save(); U.rr(ctx, fx0, fy0, fw, fh, 10); ctx.fillStyle = z ? '#cfe0d8' : '#ecdcb8'; ctx.fill(); ctx.strokeStyle = z ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      if (z) { var mood = /……$|^……|唉|对不住|怪我/.test(c.text) ? 3 : /哈|要得|好嘞|谢|慢走|来嘛/.test(c.text) ? 1 : (self.scene.id === 'crisis' || self.scene.id === 'rescue') ? 2 : 0; A.cell(ctx, 'zhou_portraits', mood, fx0 - 22, fy0 + 2, fw + 44, fh + 26, {}); }
      else if (reg && reg.portrait != null) A.cell(ctx, 'atlas_regulars', reg.portrait, fx0 + 4, fy0 + 6, fw - 8, fh - 6, { trim: true, fit: true });
      else People.portrait(ctx, who, fx0 + 5, fy0 + 30, fw - 10, {});
      ctx.restore();
      var tx = side ? px + 30 : px + fw + 40, tw = pw - fw - 80;
      ctx.font = U.font(21, 'bold', true); var nw = ctx.measureText(name).width + 30, nx = side ? px + pw - fw - 30 - nw : px + fw + 34;
      ctx.fillStyle = z ? '#2f6f66' : '#b8432f'; U.rr(ctx, nx, py - 18, nw, 34, 7); ctx.fill();
      U.text(ctx, name, nx + nw / 2, py + 6, { size: 21, bold: true, kai: true, align: 'center', color: '#fff6e0' });
      var ls = U.wrap(ctx, c.text, tw, 28, 'bold', true), ly = py + (ls.length > 2 ? 44 : ls.length > 1 ? 62 : 84);
      U.wrap(ctx, text, tw, 28, 'bold', true).forEach(function (l, i) { U.text(ctx, l, tx, ly + i * 40, { size: 28, bold: true, kai: true, color: '#33241a' }); });
      if (done) U.text(ctx, '▾', side ? px + pw - fw - 44 : px + pw - 34, py + ph - 18 + Math.sin(self.t * 5) * 2, { size: 18, color: z ? '#2f6f66' : '#7d5a35', align: 'center' });
    } else if (c.type === 'choice') {
      var n = c.opts.length, cw = Math.min(340, (1180 - (n - 1) * 20) / n), x0 = 640 - (n * cw + (n - 1) * 20) / 2, k = Fx.ease.out3(Math.min(1, c.t * 3));
      c.opts.forEach(function (o, i) {
        var x = x0 + i * (cw + 20), y = 566 + (1 - k) * 60 + Math.sin(self.t * 2 + i) * 1.5, h = 112;
        var st = U.hit('choice' + i, x, y, cw, h, { onTap: function () { self.choose(i); }, disabled: !o.ok, label: o.c.label });
        ctx.save(); ctx.globalAlpha = k * (o.ok ? 1 : 0.5); ctx.translate(x + cw / 2, y + h / 2); ctx.rotate((i - (n - 1) / 2) * 0.012); if (st.pressed) ctx.scale(0.97, 0.97); ctx.translate(-(x + cw / 2), -(y + h / 2));
        ctx.fillStyle = 'rgba(40,22,8,.3)'; U.rr(ctx, x + 3, y + 6, cw, h, 10); ctx.fill();
        ctx.fillStyle = st.hover && o.ok ? '#fffdf4' : '#fbf5e4'; U.rr(ctx, x, y, cw, h, 10); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#b8432f'; ctx.beginPath(); ctx.arc(x + 20, y + 20, 6, 0, 7); ctx.fill();
        U.text(ctx, o.c.label, x + cw / 2, y + 50, { size: 27, bold: true, align: 'center', color: '#3b2a1a', maxW: cw - 30 });
        U.text(ctx, o.ok ? (o.c.hint || '') : (o.c.why || '现在做不到'), x + cw / 2, y + 86, { size: 18, align: 'center', color: o.ok ? '#8a6a3a' : '#b8432f', maxW: cw - 26 });
        ctx.restore();
      });
    } else if (c.type === 'do') {
      var cx = 640, cy = 588, pulse = 1 + Math.sin(this.t * 5) * 0.05;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(24,18,12,.6)'; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fbeed0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.stroke();
      ctx.fillStyle = '#fbeed0'; ctx.beginPath(); ctx.arc(0, 0, c.kind === 'hold' ? 16 + c.p * 18 : 18, 0, 7); ctx.fill();
      ctx.restore();
      if (c.kind === 'hold') U.ring(ctx, cx, cy, 56, c.p, '#ffe28a', 7);
      U.text(ctx, c.label, cx, cy + 96, { size: 24, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.9)' });
    }
  };
  P.describe = function () { var c = this.cur; return { scene: this.scene.id, cur: c ? (c.type === 'say' ? { type: 'say', who: c.who, text: c.text } : c.type === 'choice' ? { type: 'choice', opts: c.opts.map(function (o) { return { label: o.c.label, ok: o.ok }; }) } : { type: c.type, kind: c.kind, label: c.label }) : null, done: this.done }; };
  return { Director: Director, SLOT: SLOT, FOOT: FOOT };
});
;
/* ui/s_title.js */
BSX.define('ui/s_title', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var SIGN = { x: 499, y: 172, w: 400 };
  var TEASE = [
    '“油三天一换，别省。”——抽屉里的一张条子',
    '补偿金四万二。盘这间铺子，花了三万。',
    '门头的招牌是空的。写什么，月底再说。',
    '六点零五，头班车。六点四十，一老一小。',
    '一碗早饭，不亏心地卖，能不能活？'
  ];
  var PACE = [
    { name: '慢慢来', sub: '客人更有耐心，来的人少一点', text: '想看故事、头一回玩，选这个。' },
    { name: '照常', sub: '柳河街平常的早晨', text: '忙，但顾得过来。' },
    { name: '赶早高峰', sub: '人多、性子急，小费也多', text: '手熟了再来。' }
  ];
  var HINT = { E_HONEST: '油勤换，单子贴出来。贵一点，也有人认。', E_CANTEEN: '薄利。记得每个人的老样子。', E_PRIVATE: '提价，把少数几位照顾到家。', E_REOPEN: '出了事，认，然后改。', E_PILLS: '一锅油用到底。', E_FAREWELL: '租没续上，可有人记得你。', E_TRANSFER: '租没续上，也没人来问。', E_SOMEONE: '不好不坏地做完一个月。' };
  function Title(app) {
    this.app = app; this.name = 'title'; this.t = 0; this.lit = 0; this.go = null; this.mode = 'main'; this.pick = null; this.pace = 1; this.mt = 0;
    this.has = app.store.hasRun(); this.saved = this.has ? app.store.loadRun() : null;
    this.steam = []; this.leaves = []; this.birds = [];
    if (app.store.notice) { app.notice(app.store.notice); app.store.notice = null; }
    Au.setScene({ place: 'street', rain: 0, crowd: 0.25, dawn: 1, music: 'dawn' });
    for (var i = 0; i < 8; i++) this.leaves.push(this.leaf(true));
  }
  var T = Title.prototype;
  T.leaf = function (any) { return { x: Math.random() * 520 - 60, y: any ? Math.random() * 600 : -10 - Math.random() * 60, vx: 14 + Math.random() * 22, vy: 16 + Math.random() * 20, r: Math.random() * 6, vr: (Math.random() - 0.5) * 3, s: 4 + Math.random() * 4, c: ['#7fae4a', '#a8c45a', '#d8b84a', '#5f9440'][Math.floor(Math.random() * 4)], ph: Math.random() * 6 }; };
  T.setMode = function (m) { this.mode = m; this.mt = 0; this.confirm = false; };
  T.update = function (dt) {
    var self = this; this.t += dt; this.mt += dt;
    if (this.go && this.ready()) { this.lit = Math.min(1, this.lit + dt * 1.2); if (this.lit >= 1 && !this.fired) { this.fired = true; this.go(); } }
    if (Math.random() < dt * 0.22) Au.play('sparrow', { vol: 0.35 });
    if (!Fx.lowFx) {
      if (Math.random() < dt * 9) this.steam.push({ x: (Math.random() < 0.55 ? 318 : 386) + (Math.random() - 0.5) * 34, y: Math.random() < 0.55 ? 352 : 388, r: 7 + Math.random() * 6, t: 0, life: 2.2 + Math.random() * 1.4, dx: (Math.random() - 0.3) * 12 });
      if (Math.random() < dt * 0.06 && this.birds.length < 1) this.birds.push({ x: -40, y: 60 + Math.random() * 70, t: 0 });
    }
    this.steam = this.steam.filter(function (p) { p.t += dt; p.y -= dt * (26 - p.t * 5); p.x += dt * (p.dx + Math.sin(p.t * 2 + p.r) * 6); return p.t < p.life; });
    this.leaves.forEach(function (l, i) { l.x += dt * (l.vx + Math.sin(self.t * 1.3 + l.ph) * 18); l.y += dt * l.vy; l.r += dt * l.vr; if (l.y > 650 || l.x > 760) self.leaves[i] = self.leaf(false); });
    this.birds = this.birds.filter(function (b) { b.t += dt; b.x += dt * 150; b.y += Math.sin(b.t * 2) * dt * 16; return b.x < 1340; });
  };
  T.ready = function () { return A.groupState.boot === 'done' && A.groupState.chars === 'done'; };
  T.progress = function () { var es = A.manifest.entries.filter(function (e) { return e.group === 'boot' || e.group === 'chars'; }), n = es.filter(function (e) { return A.loaded[e.id]; }).length; return es.length ? n / es.length : 1; };
  T.start = function (fn) { if (this.go) return; this.go = fn; Au.play('lamp'); Au.play('shutter_up', { vol: 0.7 }); };
  T.launch = function (o) { var app = this.app; this.start(function () { app.newRun(o); }); };
  T.drawBanner = function (ctx, a) {
    var t = this.t, bx = 1010, by = 30, bw = 104, bh = 330, sway = Math.sin(t * 1.1) * 0.012 + Math.sin(t * 2.7) * 0.004;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(bx - 26, by - 6, 290, 9); ctx.fillStyle = '#7a5230'; ctx.fillRect(bx - 26, by - 6, 290, 3);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(bx + 6, by + 3, 3, 12); ctx.fillRect(bx + bw - 9, by + 3, 3, 12);
    ctx.translate(bx + bw / 2, by + 12); ctx.transform(1, 0, sway * 6, 1, 0, 0); ctx.rotate(sway);
    ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.fillRect(-bw / 2 + 5, 6, bw, bh);
    ctx.fillStyle = '#f6eed8'; ctx.fillRect(-bw / 2, 0, bw, bh);
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(-bw / 2, 0, bw, 16);
    ctx.fillStyle = '#e6dcc0'; for (var i = 0; i < 6; i++) ctx.fillRect(-bw / 2 + 8 + i * 16, 22, 2, bh - 60);
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(-bw / 2, bh - 26, bw, 8);
    ctx.fillStyle = '#f6eed8'; for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-bw / 2 + 13 + i * 26, bh, 13, 0, Math.PI); ctx.fill(); }
    ctx.strokeStyle = '#b8a47a'; ctx.lineWidth = 2; ctx.strokeRect(-bw / 2, 0, bw, bh);
    '不烧心小馆'.split('').forEach(function (ch, k) { U.text(ctx, ch, 0, 68 + k * 52, { size: 50, bold: true, kai: true, align: 'center', color: '#27433d' }); });
    ctx.fillStyle = '#b8432f'; U.rr(ctx, 14, bh - 60, 30, 30, 4); ctx.fill();
    U.text(ctx, '早', 29, bh - 38, { size: 20, bold: true, kai: true, align: 'center', color: '#fff3e0' });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    '柳河街·二十八天'.split('').forEach(function (ch, k) { U.text(ctx, ch, bx - 44, by + 54 + k * 26, { size: 21, kai: true, bold: true, align: 'center', color: '#fff3d6', stroke: 'rgba(40,24,10,.82)', strokeW: 4 }); });
    ctx.restore();
  };
  T.draw = function (ctx) {
    var app = this.app, self = this, bg = A.img('bg_title') || A.img('bg_ext_morning'), L = app.legacy, t = this.t, i;
    var zoom = 1.025 + Math.sin(t * 0.13) * 0.006 + Fx.ease.inOut(this.lit) * 0.22, dx = Math.sin(t * 0.09) * 5;
    ctx.save();
    ctx.translate(480, 330); ctx.scale(zoom, zoom); ctx.translate(-480 + dx, -330);
    if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, -16, -9, 1312, 738); ctx.imageSmoothingEnabled = true; } else { ctx.fillStyle = '#c8a878'; ctx.fillRect(0, 0, 1280, 720); }
    if (L.lastSign) { ctx.save(); ctx.globalAlpha = 0.86; U.text(ctx, L.lastSign, SIGN.x, SIGN.y + 18, { size: 50, bold: true, kai: true, align: 'center', color: '#4a2c14', maxW: SIGN.w }); ctx.restore(); }
    this.steam.forEach(function (p) { var k = p.t / p.life, r = p.r * 0.7 + k * 15; ctx.fillStyle = 'rgba(255,252,244,' + (0.2 * (1 - k) * Math.min(1, p.t * 3)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.arc(p.x + r * 0.7, p.y - r * 0.5, r * 0.7, 0, 7); ctx.fill(); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 780, 286, 70 + Math.sin(t * 1.7) * 6, '255,120,70', 0.22); Shop.glow(ctx, 541, 316, 120, '255,206,130', 0.16 + Math.sin(t * 2.3) * 0.02); ctx.restore();
    this.leaves.forEach(function (l) { ctx.save(); ctx.translate(Math.round(l.x), Math.round(l.y)); ctx.rotate(l.r); ctx.fillStyle = l.c; ctx.fillRect(-l.s / 2, -l.s / 3, l.s, l.s * 0.66); ctx.restore(); });
    this.birds.forEach(function (b) { var w = Math.sin(b.t * 14) > 0 ? 4 : -2; ctx.fillStyle = '#4a3a30'; ctx.fillRect(b.x, b.y, 8, 4); ctx.fillRect(b.x - 6, b.y - w, 6, 3); ctx.fillRect(b.x + 6, b.y - w, 6, 3); });
    ctx.restore();
    if (!Fx.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 3; i++) { var sx = 560 + i * 190 + Math.sin(t * 0.2 + i) * 12; ctx.fillStyle = 'rgba(255,236,190,' + (0.045 + Math.sin(t * 0.5 + i * 2) * 0.012).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(sx + 300, 0); ctx.lineTo(sx + 390, 0); ctx.lineTo(sx - 150, 720); ctx.lineTo(sx - 300, 720); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    var vg = ctx.createRadialGradient(560, 340, 300, 640, 360, 820); vg.addColorStop(0, 'rgba(24,14,6,0)'); vg.addColorStop(1, 'rgba(24,14,6,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
    var a = Math.max(0, 1 - this.lit * 1.8); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    var g = ctx.createLinearGradient(820, 0, 1280, 0); g.addColorStop(0, 'rgba(24,14,6,0)'); g.addColorStop(1, 'rgba(24,14,6,.5)'); ctx.fillStyle = g; ctx.fillRect(820, 0, 460, 720);
    g = ctx.createLinearGradient(0, 590, 0, 720); g.addColorStop(0, 'rgba(18,12,6,0)'); g.addColorStop(1, 'rgba(18,12,6,.72)'); ctx.fillStyle = g; ctx.fillRect(0, 590, 1280, 130);
    ctx.restore();
    this.drawBanner(ctx, a);
    ctx.save(); ctx.globalAlpha = a;
    var ti = Math.floor(t / 6.5) % TEASE.length, tk = (t % 6.5), ta = Math.min(1, tk * 1.4) * Math.min(1, (6.5 - tk) * 1.4);
    U.text(ctx, TEASE[ti], 56, 668, { size: 25, kai: true, bold: true, color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 5, alpha: ta });
    U.text(ctx, L.runs ? '第 ' + (L.runs + 1) + ' 个月 · 写过 ' + Object.keys(L.endings || {}).length + ' / 8 块招牌' : '短租二十八天 · 一块空招牌', 58, 700, { size: 16, color: '#e8d8b8', stroke: 'rgba(30,18,8,.7)', strokeW: 3 });
    if (!this.ready()) { var pr = this.progress(); ctx.fillStyle = 'rgba(20,12,6,.55)'; U.rr(ctx, 900, 676, 344, 26, 13); ctx.fill(); ctx.fillStyle = '#e8b54a'; U.rr(ctx, 903, 679, 338 * pr, 20, 10); ctx.fill(); U.text(ctx, (this.go ? '还在备料，马上开门… ' : '后台备料中 ') + Math.round(pr * 100) + '%', 1072, 695, { size: 14, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(30,18,8,.8)', strokeW: 3 }); }
    if (this.mode === 'main') this.drawMenu(ctx);
    else if (this.mode === 'new') this.drawNew(ctx);
    else if (this.mode === 'wall') this.drawWall(ctx);
    else this.drawAbout(ctx);
    ctx.restore();
  };
  T.drawMenu = function (ctx) {
    var app = this.app, self = this, L = app.legacy, x = 900, w = 344, y = 386, k = Fx.ease.out3(Math.min(1, this.mt * 2.2));
    ctx.save(); ctx.translate((1 - k) * 60, 0); ctx.globalAlpha *= k;
    if (this.has && this.saved) { K.tag(ctx, 'continue', x, y, w, 66, '接着开店', { sub: '第 ' + this.saved.state.day + ' 天 · ' + K.yuan(this.saved.state.cash), kind: 'teal', size: 27, onTap: function () { self.start(function () { app.continueRun(); }); } }); y += 78; }
    else y += 18;
    K.tag(ctx, 'new', x, y, w, this.has ? 58 : 70, this.has ? '新的一个月' : '开张', { sub: this.has ? '从第一天重新来' : '五点半，拉起卷帘门', kind: this.has ? 'wood' : 'teal', size: this.has ? 24 : 30, onTap: function () { self.setMode('new'); } }); y += this.has ? 70 : 84;
    var hw = (w - 12) / 2;
    K.tag(ctx, 'book', x, y, hw, 54, '小本子', { sub: '街坊 · 菜谱', kind: 'wood', size: 21, onTap: function () { app.openOverlay(require('ui/s_book').Book, { legacy: true }); } });
    K.tag(ctx, 'wall', x + hw + 12, y, hw, 54, '招牌墙', { sub: Object.keys(L.endings || {}).length + ' / 8', kind: 'wood', size: 21, onTap: function () { self.setMode('wall'); } }); y += 66;
    K.tag(ctx, 'settings', x, y, hw, 54, '设置', { sub: '声音 · 字号', kind: 'wood', size: 21, onTap: function () { app.openOverlay(require('ui/s_basic').Pause, { settings: true }); } });
    K.tag(ctx, 'about', x + hw + 12, y, hw, 54, '关于', { sub: '怎么玩 · 谁做的', kind: 'wood', size: 21, onTap: function () { self.setMode('about'); } });
    ctx.restore();
  };
  T.sheet = function (ctx, title, w, h) {
    var k = Fx.ease.out3(Math.min(1, this.mt * 3)), x = 640 - w / 2 - 60, y = 360 - h / 2 + (1 - k) * 26;
    K.dim(ctx, 0.42 * k);
    U.hit('sheet_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    ctx.globalAlpha *= k;
    K.paper(ctx, x, y, w, h, { pin: K.col.red });
    U.text(ctx, title, x + 40, y + 62, { size: 34, bold: true, kai: true, color: K.col.ink });
    ctx.strokeStyle = 'rgba(120,90,50,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 36, y + 78); ctx.lineTo(x + w - 36, y + 78); ctx.stroke();
    return { x: x, y: y, w: w, h: h };
  };
  T.drawNew = function (ctx) {
    var app = this.app, self = this, L = app.legacy, hs = Cast.heirlooms.filter(function (h) { return L.runs > 0 && L.heirlooms.indexOf(h.id) >= 0; });
    var r = this.sheet(ctx, '开张', 760, hs.length ? 590 : 400), x = r.x, y = r.y;
    U.text(ctx, '这个月的早晨', x + 40, y + 114, { size: 19, bold: true, color: K.col.mute });
    PACE.forEach(function (p, i) {
      var bx = x + 40 + i * 230, sel = self.pace === i;
      K.tag(ctx, 'pace' + i, bx, y + 128, 216, 74, p.name, { sub: p.sub, kind: sel ? 'teal' : 'paper', size: 24, onTap: function () { self.pace = i; } });
    });
    U.text(ctx, PACE[this.pace].text, x + 40, y + 234, { size: 17, color: K.col.mute });
    var yy = y + 262;
    if (hs.length) {
      U.text(ctx, '带一件上个月的东西', x + 40, yy + 10, { size: 19, bold: true, color: K.col.mute });
      hs.slice(0, 5).forEach(function (h, i) {
        var hx = x + 40 + (i % 2) * 344, hy = yy + 24 + Math.floor(i / 2) * 60, sel = self.pick === h.id;
        var st = U.hit('heir' + i, hx, hy, 336, 52, { onTap: function () { self.pick = sel ? null : h.id; }, label: h.name });
        ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : 'rgba(120,90,50,.08)'; U.rr(ctx, hx, hy, 336, 52, 8); ctx.fill(); if (sel) { ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2; ctx.stroke(); }
        U.text(ctx, h.name, hx + 12, hy + 22, { size: 18, bold: true, color: K.col.ink }); U.text(ctx, h.text, hx + 12, hy + 42, { size: 13, color: K.col.mute, maxW: 314 });
      });
      yy += 24 + Math.ceil(Math.min(5, hs.length) / 2) * 60 + 6;
    }
    if (this.has) U.text(ctx, '现在这个月（第 ' + (this.saved ? this.saved.state.day : '?') + ' 天）会被放弃。', x + 40, r.y + r.h - 96, { size: 17, bold: true, color: K.col.red });
    K.tag(ctx, 'new_back', x + 40, r.y + r.h - 78, 150, 54, '再想想', { kind: 'paper', size: 21, onTap: function () { self.setMode('main'); } });
    K.tag(ctx, 'new_go', x + r.w - 40 - 330, r.y + r.h - 82, 330, 62, '拉起卷帘门', { kind: 'teal', size: 26, sub: PACE[this.pace].name + (this.pick ? ' · 带着旧物' : ''), onTap: function () { self.launch({ pace: self.pace, heirloom: self.pick }); } });
  };
  T.drawWall = function (ctx) {
    var app = this.app, self = this, L = app.legacy, r = this.sheet(ctx, '招牌墙', 860, 600), x = r.x, y = r.y;
    U.text(ctx, '每个月底，空招牌上会写下不一样的字。', x + 200, y + 60, { size: 17, color: K.col.mute });
    Story.endIds.forEach(function (id, i) {
      var e = Story.endings[id], n = (L.endings || {})[id] || 0, bx = x + 40 + (i % 2) * 396, by = y + 98 + Math.floor(i / 2) * 106, bw = 384, bh = 94;
      ctx.fillStyle = 'rgba(30,18,8,.25)'; U.rr(ctx, bx + 2, by + 4, bw, bh, 8); ctx.fill();
      ctx.fillStyle = n ? '#c98a4e' : '#bfb49c'; U.rr(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.strokeStyle = n ? '#6e4224' : '#8d8370'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = n ? '#f3e6c8' : '#d8cfba'; U.rr(ctx, bx + 10, by + 10, 150, bh - 20, 4); ctx.fill();
      if (n) U.text(ctx, e.sign || (id === 'E_TRANSFER' ? '转让' : '（空着）'), bx + 85, by + 57, { size: 26, bold: true, kai: true, align: 'center', color: e.sign ? '#4a2c14' : '#8d7a60', maxW: 136 });
      else U.text(ctx, '？', bx + 85, by + 60, { size: 34, bold: true, kai: true, align: 'center', color: '#a89c84' });
      U.text(ctx, n ? e.title : '还没写过', bx + 174, by + 36, { size: 18, bold: true, color: n ? '#fff8e8' : '#6a6050', maxW: 200 });
      U.para(ctx, HINT[id] || '', bx + 174, by + 58, 198, { size: 14, lh: 19, color: n ? '#fbe8c8' : '#7a705e' });
      if (n > 1) U.text(ctx, '×' + n, bx + bw - 14, by + 24, { size: 15, bold: true, align: 'right', color: '#fff8e8' });
    });
    K.tag(ctx, 'wall_back', x + r.w - 40 - 170, r.y + r.h - 70, 170, 50, '回门口', { kind: 'teal', size: 21, onTap: function () { self.setMode('main'); } });
  };
  T.drawAbout = function (ctx) {
    var self = this, r = this.sheet(ctx, '关于这间铺子', 760, 560), x = r.x + 40, y = r.y + 116, w = r.w - 80;
    var rows = [
      ['你是谁', '老周，四十八岁。在食品厂食堂管了二十年后勤，下岗，拿补偿金盘下柳河街一间十平米的早餐铺，短租二十八天。'],
      ['早上', '整个早市都站在柜台后面。点＝顺手递给最急的那位；拖＝指定给谁，或先搁出餐台；按住＝接豆浆、磨豆、拉卷帘门。'],
      ['下午', '收了摊，可以出门：去批发市场验货，去桥头、总站、校门口走走。货好不好，人熟不熟，都在这半天。'],
      ['月底', '油换不换、料买谁的、价怎么定、话怎么回——这些加起来，是月底写在空招牌上的字。']
    ];
    rows.forEach(function (rw) { U.text(ctx, rw[0], x, y, { size: 19, bold: true, kai: true, color: K.col.red }); y += U.para(ctx, rw[1], x + 70, y, w - 70, { size: 18, lh: 27, color: K.col.ink }) + 14; });
    U.para(ctx, '第三版。画面与文字含 AI 辅助创作；人物与店铺均为虚构。"烧心"在这里是街坊的说法，不是医学诊断。', x, r.y + r.h - 100, w - 190, { size: 14, lh: 21, color: K.col.mute });
    K.tag(ctx, 'about_back', r.x + r.w - 40 - 170, r.y + r.h - 70, 170, 50, '回门口', { kind: 'teal', size: 21, onTap: function () { self.setMode('main'); } });
  };
  T.key = function (k) { if (k === 'Escape' && this.mode !== 'main') this.setMode('main'); };
  T.describe = function () { return { mode: this.mode, hasSave: this.has, runs: this.app.legacy.runs, pace: this.pace }; };
  return { Title: Title, SIGN: SIGN, PACE: PACE };
});
;
/* ui/s_basic.js */
BSX.define('ui/s_basic', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Cast = require('content/cast');
  var Story = require('content/story');
  function Loading(app) {
    var self = this; this.app = app; this.name = 'loading'; this.p = 0; this.t = 0;
    A.loadGroup('title', function (p) { self.p = p; }, function () { self.p = 1; A.loadGroup('boot', null, function () { A.loadGroup('chars', null, function () { A.loadGroup('late', null, null); }); }); });
  }
  Loading.prototype.update = function (dt) { this.t += dt; if (this.p >= 1 && this.t > 0.3) this.app.go(Title, {}, false); };
  Loading.prototype.draw = function (ctx) {
    ctx.fillStyle = '#1f1812'; ctx.fillRect(0, 0, 1280, 720);
    var cx = 640, cy = 330;
    ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(cx, cy + 30, 70, 26, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(cx - 70, cy + 22, 140, 10);
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(cx - 70, cy + 30, 140, 6);
    ctx.strokeStyle = 'rgba(255,248,232,.5)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (var i = -1; i <= 1; i++) { ctx.beginPath(); for (var k = 0; k <= 10; k++) { var yy = cy + 10 - k * 6, xx = cx + i * 30 + Math.sin(this.t * 3 + k * 0.7 + i) * 6; if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
    U.text(ctx, '灶上的水快开了…', cx, cy + 110, { size: 22, align: 'center', color: '#d8c8a8' });
    ctx.fillStyle = 'rgba(255,248,232,.15)'; U.rr(ctx, cx - 160, cy + 132, 320, 8, 4); ctx.fill(); ctx.fillStyle = '#e8b54a'; U.rr(ctx, cx - 160, cy + 132, 320 * this.p, 8, 4); ctx.fill();
  };
  Loading.prototype.describe = function () { return { p: this.p }; };
  function Title(app, p) { return new (require('ui/s_title').Title)(app, p); }
  function Pause(app, p) { this.app = app; this.name = p.settings ? 'settings' : 'pause'; this.settings = !!p.settings; this.t = 0; }
  var Pp = Pause.prototype;
  Pp.update = function (dt) { this.t += dt; };
  Pp.draw = function (ctx) {
    var app = this.app, s = app.settings, self = this, k = Fx.ease.out3(Math.min(1, this.t * 5));
    K.dim(ctx, 0.55 * k);
    U.hit('pause_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 360, y = 96 + (1 - k) * 30, w = 560, h = 528;
    K.paper(ctx, x, y, w, h, { pin: K.col.teal });
    U.text(ctx, this.settings ? '设置' : '歇一会儿', x + w / 2, y + 58, { size: 32, bold: true, align: 'center', color: K.col.ink });
    function steps(id, label, key, yy) {
      U.text(ctx, label, x + 44, yy + 30, { size: 22, bold: true, color: K.col.ink });
      for (var i = 0; i <= 4; i++) (function (i) { var v = i / 4, on = Math.abs(s[key] - v) < 0.13; K.tag(ctx, id + i, x + 190 + i * 66, yy, 56, 44, i === 0 ? '关' : String(i), { kind: on ? 'teal' : 'paper', size: 19, onTap: function () { s[key] = v; app.applySettings(); Au.play('good'); } }); })(i);
    }
    function toggle(id, label, key, xx, yy) { K.tag(ctx, id, xx, yy, 228, 46, label + (s[key] ? '：开' : '：关'), { kind: s[key] ? 'teal' : 'paper', size: 19, onTap: function () { s[key] = !s[key]; app.applySettings(); } }); }
    steps('vm', '音乐', 'music', y + 86); steps('vs', '音效', 'sfx', y + 144);
    toggle('t_vib', '震动', 'vibrate', x + 44, y + 210); toggle('t_auto', '剧情自动播放', 'autoPlay', x + 288, y + 210);
    toggle('t_hint', '操作提示', 'hints', x + 44, y + 266); toggle('t_low', '省电画面', 'lowFx', x + 288, y + 266);
    K.tag(ctx, 't_text', x + 44, y + 322, 228, 46, '字号：' + (s.textScale > 1.05 ? '大' : '标准'), { kind: 'paper', size: 19, onTap: function () { s.textScale = s.textScale > 1.05 ? 1 : 1.14; app.applySettings(); } });
    K.tag(ctx, 't_full', x + 288, y + 322, 228, 46, '全屏', { kind: 'paper', size: 19, onTap: function () { app.P.fullscreen(); } });
    if (this.settings) K.tag(ctx, 'p_close', x + 150, y + 430, 260, 62, '好了', { kind: 'teal', onTap: function () { app.closeOverlay(); } });
    else {
      K.tag(ctx, 'p_resume', x + 44, y + 430, 228, 62, '接着忙', { kind: 'teal', onTap: function () { app.closeOverlay(); } });
      K.tag(ctx, 'p_title', x + 288, y + 430, 228, 62, '回到门口', { kind: 'wood', sub: app.state && app.state.phase === 'service' ? '今天的早市要重来' : '进度已存', onTap: function () { require('game/stations').silence(); app.closeOverlay(); app.state = null; app.go(Title, {}, true); } });
    }
    U.text(ctx, '不烧心小馆 · 第二版 · 画面与文字含 AI 辅助创作', x + w / 2, y + h - 16, { size: 13, align: 'center', color: K.col.mute });
  };
  Pp.describe = function () { return { settings: this.app.settings }; };
  return { Loading: Loading, Title: Title, Pause: Pause };
});
;
/* ui/s_play.js */
BSX.define('ui/s_play', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var Story = require('content/story');
  var D = require('content/dishes');
  var Dir = require('game/director');
  var Svc = require('game/service');
  var Stn = require('game/stations');
  function Scene(app, p) {
    var s = app.state, self = this;
    this.app = app; this.name = 'scene'; this.pausable = true; this.s = s; this.when = p.when; this.done = p.done; this.t = 0;
    this.list = (p.ids || []).map(function (id) { return Story.scenes[id]; }).filter(Boolean);
    (p.found || []).forEach(function (f, i) { var m = Story.memento(f.memento); self.list.unshift({ id: 'found_' + f.memento, title: '落下的东西', synthetic: f, beats: [['n', f.line || ('柜台上落了一样东西：' + m.name + '。')], { prop: 'paper', label: m.name }, { fx: { memento: f.memento } }, { wait: 0.5 }] }); });
    Fx.reset(); Stn.silence();
    var first = this.list[0], closedStart = first && first.beats.some(function (b) { return b && b.shutter === 'up'; });
    var rainy = s.today.weather === 'rain';
    this.place = p.place || null;
    if (this.place) { Shop.reset('day', s.today.weather); Au.setScene({ place: 'street', rain: rainy ? 0.5 : 0, crowd: 0.15, dawn: 1, music: 'story' }); }
    else if (this.when === 'open') { Shop.reset('dawn', s.today.weather); Shop.setShutter(closedStart ? 1 : 0, true); Au.setScene({ place: 'shop', rain: rainy ? 1 : 0, crowd: 0, dawn: 0.1, music: 'story' }); }
    else { Shop.reset(rainy ? 'rain' : 'day', s.today.weather); Shop.setLight('dusk'); Shop.setShutter(0, true); Au.setScene({ place: 'shop', rain: rainy ? 0.7 : 0, crowd: 0, dawn: 1, music: 'close' }); }
    Shop.crowd = this.when === 'open' ? 0.2 : 0.5;
    this.i = -1; this.dir = null; this.title = null;
    this.nextScene();
  }
  var S = Scene.prototype;
  S.nextScene = function () {
    var self = this, app = this.app;
    this.i++;
    if (this.i >= this.list.length) { this.dir = null; if (this.done) { var f = this.done; this.done = null; f(); } return; }
    var sc = this.list[this.i];
    if (sc.synthetic) sc.synthetic.shown = true;
    this.title = { text: sc.title, t: 0 };
    this.dir = new Dir.Director(app, this.s, sc, function () { app.save(); self.nextScene(); });
    if (this.place) { this.dir.foot = 600; this.dir.scale = 1.02; }
  };
  S.update = function (dt) { this.t += dt; if (this.title) this.title.t += dt; if (this.dir) this.dir.update(dt); };
  S.pointer = function (type, x, y) { return this.dir ? this.dir.pointer(type, x, y) : null; };
  S.key = function (k) { if ((k === ' ' || k === 'Enter') && this.dir) this.dir.pointer('down', 640, 360); };
  S.draw = function (ctx) {
    var s = this.s, d = this.dir, self = this, app = this.app;
    if (this.place) {
      Shop.drawPlace(ctx, this.place, this.t, { tint: 'rgb(255,226,190)' });
      if (d) d.drawActors(ctx);
      if (d) d.drawProps(ctx);
      Fx.drawParts(ctx);
    } else {
    Shop.drawBack(ctx, s, { post: s.plan.post && this.when === 'close', curtain: !!s.flags.man_curtain });
    if (d) d.drawActors(ctx);
    Shop.drawCounter(ctx);
    A.cell(ctx, 'atlas_equipment', 6, 60, 470, 120, 120, { trim: true, fit: true });
    A.cell(ctx, 'atlas_equipment', 7, 1040, 520, 190, 130, { trim: true, fit: true });
    if (d) d.drawProps(ctx);
    Fx.drawParts(ctx);
    Shop.drawLight(ctx);
    Shop.drawShutter(ctx);
    }
    Shop.grade(ctx, !!this.place);
    if (d) d.drawSpeech(ctx);
    Fx.drawFloats(ctx);
    K.dayChip(ctx, s, 14, 12, this.t);
    U.text(ctx, this.when === 'open' ? '开门前' : this.when === 'town' ? '下午' : '收摊后', 196, 46, { size: 18, bold: true, color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (this.title && this.title.t < 2.6 && this.title.text) { ctx.save(); ctx.globalAlpha = Math.min(1, this.title.t * 3, (2.6 - this.title.t) * 2); U.text(ctx, '—  ' + this.title.text + '  —', 640, 62, { size: 24, bold: true, align: 'center', color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' }); ctx.restore(); }
    if (d) {
      var x = 1280 - 66 - (app.rightInset || 0);
      K.iconBtn(ctx, 'sc_pause', x, 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' }); x -= 60;
      K.iconBtn(ctx, 'sc_log', x, 10, 48, 'log', function () { app.openOverlay(require('ui/s_book').Book, { tab: 3 }); }, { label: '回看', text: '回看' }); x -= 60;
      K.iconBtn(ctx, 'sc_auto', x, 10, 48, 'play', function () { d.auto = !d.auto; app.settings.autoPlay = d.auto; app.applySettings(); }, { label: '自动', text: '自动', on: d.auto }); x -= 60;
      K.iconBtn(ctx, 'sc_fast', x, 10, 48, 'fast', function () { d.fast = !d.fast; }, { label: '快进', text: '快进', on: d.fast }); x -= 60;
      if (d.canSkip) K.iconBtn(ctx, 'sc_skip', x, 10, 48, 'skip', function () { d.skip(); }, { label: '跳过', text: '看过·跳' });
    }
  };
  S.describe = function () { return { when: this.when, index: this.i, total: this.list.length, director: this.dir ? this.dir.describe() : null }; };
  function Shift(app) {
    var s = app.state;
    this.app = app; this.name = 'shift'; this.pausable = true; this.s = s; this.t = 0; this.phase = 'intro'; this.pt = 0;
    Fx.reset();
    this.plan = Run.buildService(s);
    this.svc = new Svc.Service(app, s, this.plan);
    var rainy = s.today.weather === 'rain';
    Shop.reset('dawn', s.today.weather); Shop.setShutter(0, true); Shop.setDawn(0, rainy); Shop.crowd = 0.3;
    if (s.today.light === 'candle' || (s.day === 22 && Story.scenes.m22_open && !Story.scenes.m22_open.fallback)) { this.candle = true; Shop.setLight('candle'); }
    Au.setScene({ place: 'shop', rain: rainy ? 1 : 0, crowd: 0, dawn: 0.2, music: 'open' });
    this.guide = app.settings.hints && (s.day <= 2 || this.svc.stations.some(function (st) { return !(s.stats.st[st.type] > 0); }));
    this.idle = 0; this.hint = null; this.mood = '';
    this.news = (s.today.news || []).length;
  }
  var H = Shift.prototype;
  H.update = function (dt) {
    var s = this.s, svc = this.svc, app = this.app;
    this.t += dt; this.pt += dt;
    if (this.phase === 'intro') { if (this.pt > 1.5) { this.phase = 'open'; this.pt = 0; } return; }
    if (this.phase === 'open') {
      svc.update(dt);
      var f = svc.t / svc.len;
      if (!this.candle) Shop.setDawn(f * 1.5, s.today.weather === 'rain');
      Shop.crowd = 0.3 + Math.min(1, f) * 0.6;
      var busy = svc.cust.length + svc.queue.length, mood = f >= 1 ? 'lull' : busy >= 4 ? 'rush' : 'lull';
      if (mood !== this.mood && this.pt > 4) { this.mood = mood; Au.setScene({ music: mood }); }
      this.dawnT = (this.dawnT || 0) - dt; if (this.dawnT <= 0) { this.dawnT = 2; Au.setScene({ dawn: Math.min(1, 0.15 + f * 1.4) }); }
      if (s.day === 27 && s.flags.s_bus_stop && !this.bus && svc.t > 3) { this.bus = true; Shop.busPass(true); Au.play('horn'); }
      else if (!this.bus && s.day >= 2 && svc.t > svc.len * 0.06) { this.bus = true; Shop.busPass(false); Au.play('bus', { vol: 0.5 }); }
      this.idle += dt;
      if (this.guide) this.hint = this.idle > (s.day === 1 ? 0.9 : 2.2) ? svc.nextAction({ chat: svc.queue.length === 0, remember: false }) : null;
      if (svc.state === 'done') this.close();
    } else if (this.phase === 'closing') { if (this.pt > 0.2 && !this.rec) { } }
  };
  H.close = function () {
    var s = this.s, app = this.app;
    this.phase = 'closing'; this.pt = 0; this.hint = null;
    this.res = this.svc.result();
    this.rec = Run.finishService(s, this.res);
    var news = s.today.news || []; for (var i = this.news; i < news.length; i++) app.news(news[i]);
    app.save();
    Au.setScene({ crowd: 0, music: 'close' }); Au.play('day_end'); Shop.setLight(s.today.weather === 'rain' ? 'rain' : 'day');
  };
  H.pointer = function (type, x, y) {
    if (this.phase === 'open') { if (type === 'down') { this.idle = 0; this.hint = null; } return this.svc.pointer(type, x, y); }
    if (this.phase === 'closing' && type === 'down' && this.pt > 1.1) { this.app.route(true); }
    return null;
  };
  H.key = function (k) { if (this.phase === 'closing' && (k === ' ' || k === 'Enter') && this.pt > 1.1) this.app.route(true); };
  H.onHide = function () { Stn.silence(); };
  H.exit = function () { Stn.silence(); Au.setScene({ crowd: 0 }); };
  H.draw = function (ctx) {
    var s = this.s, svc = this.svc, app = this.app, self = this;
    svc.draw(ctx);
    K.dayChip(ctx, s, 14, 12, this.t);
    K.clock(ctx, 640, 32, svc.t / svc.len, svc.t >= svc.len);
    if (svc.tinPop > 0) svc.tinPop = Math.max(0, svc.tinPop - 0.06);
    K.tin(ctx, Svc.TIN.x, Svc.TIN.y, svc.cash0 + svc.res.revenue + svc.res.tips, svc.tinPop);
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    if (this.phase === 'intro') {
      var k = Math.min(1, this.pt * 3) * Math.min(1, (1.5 - this.pt) * 4);
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(24,18,12,.55)'; ctx.fillRect(0, 286, 1280, 120);
      U.text(ctx, '第 ' + s.day + ' 天 · 开门', 640, 348, { size: 44, bold: true, align: 'center', color: '#fbeed0' });
      U.text(ctx, '点 = 顺手递给最急的那位　　拖 = 指定给谁　　按住 = 接豆浆', 640, 388, { size: 19, align: 'center', color: '#e8d8b8' });
      ctx.restore();
    }
    if (this.hint) {
      var h = this.hint, p = 1 + Math.sin(this.t * 6) * 0.1;
      ctx.save(); ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 4; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(h.x, h.y, 34 * p, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(h.x, h.y, 46 * p, 0, 7); ctx.stroke(); ctx.restore();
      ctx.font = U.font(19, 'bold'); var tw = ctx.measureText(h.label).width + 26, tx = Math.max(10, Math.min(1270 - tw, h.x - tw / 2)), ty = h.y > 560 ? h.y - 92 : h.y + 46; if (h.y < 470) ty = h.y + 50;
      ctx.fillStyle = 'rgba(28,22,16,.84)'; U.rr(ctx, tx, ty, tw, 36, 10); ctx.fill(); U.text(ctx, h.label, tx + tw / 2, ty + 25, { size: 19, bold: true, align: 'center', color: '#fff3d6' });
    }
    if (this.phase === 'open' && svc.t >= svc.len && (svc.cust.length || svc.queue.length)) U.text(ctx, '最后几位', 640, 74, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (this.phase === 'closing') {
      var r = this.rec, k2 = Fx.ease.out3(Math.min(1, this.pt * 2.4));
      K.dim(ctx, 0.4 * k2);
      var x = 340, y = 190 + (1 - k2) * 40, w = 600, hh = 300;
      ctx.save(); ctx.globalAlpha = k2; K.paper(ctx, x, y, w, hh, { pin: K.col.red });
      U.text(ctx, '收摊', x + w / 2, y + 66, { size: 40, bold: true, align: 'center', color: K.col.ink });
      var cells = [['卖出', (r.served) + ' 位'], ['入账', K.yuan(r.rev + r.tips)], ['等走了', (r.walked + r.balked) + ' 位']];
      cells.forEach(function (c, i) { var cx = x + 110 + i * 190; U.text(ctx, c[0], cx, y + 124, { size: 20, align: 'center', color: K.col.mute }); U.text(ctx, c[1], cx, y + 168, { size: 34, bold: true, align: 'center', color: i === 2 && (r.walked + r.balked) > 0 ? K.col.red : K.col.ink }); });
      var best = null, bn = 0; for (var id in r.sold) if (r.sold[id] > bn) { bn = r.sold[id]; best = id; }
      var line = best ? '卖得最好的是' + D.byId[best].name + '，' + bn + ' 份。' : '今天没卖出什么。';
      if (r.leftover > 0) line += '剩下 ' + r.leftover + ' 份。';
      U.text(ctx, line, x + w / 2, y + 222, { size: 20, align: 'center', color: K.col.ink, maxW: w - 60 });
      if (this.pt > 1.1) U.text(ctx, '点一下，收拾台面', x + w / 2, y + 268, { size: 18, align: 'center', color: K.col.mute, alpha: 0.6 + Math.sin(this.t * 4) * 0.3 });
      ctx.restore();
    }
  };
  H.describe = function () { var d = this.svc.describe(); d.phase = this.phase; d.hint = this.hint; d.rec = this.rec ? { rev: this.rec.rev, served: this.rec.served, net: this.rec.net } : null; return d; };
  return { Scene: Scene, Shift: Shift };
});
;
/* ui/s_town.js */
BSX.define('ui/s_town', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var T = require('core/town');
  var Tn = require('content/town');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var INK = '#3b2a1a', MUTE = '#8d7a60', RED = '#b8432f', TEAL = '#2f6f66';
  var CARD = { x: 872, y: 418, w: 394, h: 288 };
  var mapCache = null;
  function buildMap() {
    var c = A.P.createCanvas(1280, 720), g = c.getContext('2d'), i;
    function rnd(n) { var x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); }
    g.fillStyle = '#efdcb4'; g.fillRect(0, 0, 1280, 720);
    for (i = 0; i < 900; i++) { g.fillStyle = 'rgba(160,120,60,' + (0.04 + rnd(i) * 0.05).toFixed(3) + ')'; g.fillRect(rnd(i + 3) * 1280, rnd(i + 7) * 720, 2, 2); }
    g.fillStyle = '#cfd59a'; [[120, 230, 90], [1180, 230, 80], [560, 640, 120], [940, 70, 70], [330, 120, 70]].forEach(function (q) { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.6, 0, 0, 7); g.fill(); });
    g.fillStyle = '#5f9a8e'; g.beginPath(); g.moveTo(0, 440); g.bezierCurveTo(220, 405, 360, 470, 540, 450); g.bezierCurveTo(720, 430, 820, 392, 1000, 420); g.bezierCurveTo(1130, 440, 1210, 415, 1280, 408);
    g.lineTo(1280, 530); g.bezierCurveTo(1190, 538, 1110, 562, 1000, 545); g.bezierCurveTo(820, 522, 720, 560, 540, 570); g.bezierCurveTo(360, 580, 220, 530, 0, 562); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(220,240,232,.55)'; g.lineWidth = 3; [[80, 500], [300, 520], [700, 490], [960, 470], [1150, 478]].forEach(function (q) { g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[0] + 30, q[1] - 7, q[0] + 60, q[1]); g.stroke(); });
    g.strokeStyle = '#3f7a70'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 440); g.bezierCurveTo(220, 405, 360, 470, 540, 450); g.bezierCurveTo(720, 430, 820, 392, 1000, 420); g.bezierCurveTo(1130, 440, 1210, 415, 1280, 408); g.stroke();
    function road(pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }
    var main = [[70, 372], [300, 362], [600, 368], [900, 350], [1250, 338]];
    road(main, 40, '#c9a46a'); road(main, 32, '#ead6ab');
    [[[425, 360], [425, 220], [660, 200], [930, 150]], [[175, 365], [175, 230]], [[1015, 345], [1015, 268]], [[930, 350], [930, 150]], [[80, 640], [400, 628], [700, 650], [1100, 640]], [[355, 560], [355, 630]], [[690, 560], [700, 640]]].forEach(function (r) { road(r, 20, '#dcc497'); road(r, 14, '#ebdab4'); });
    function house(x, y, w, h, roof) { g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(x + 4, y + 6, w, h); g.fillStyle = '#e9d9bc'; g.fillRect(x, y, w, h); g.fillStyle = roof || '#3f6a62'; g.fillRect(x - 4, y - 10, w + 8, 14); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 4, y + 2, w + 8, 3); g.fillStyle = '#8a5a2c'; g.fillRect(x + w / 2 - 6, y + h - 14, 12, 14); }
    [[90, 300, 60, 40], [240, 300, 50, 38], [380, 286, 90, 52, '#b8432f'], [482, 290, 70, 46], [580, 296, 60, 42], [700, 290, 70, 40], [800, 286, 64, 44], [1080, 280, 60, 40], [1110, 300, 110, 56, '#6a6a72'],
     [600, 120, 120, 70, '#7a6a5a'], [880, 70, 110, 70, '#5a6a8a'], [970, 220, 90, 46, '#8a6a3a'], [140, 240, 80, 50, '#4f6a8a'], [1140, 110, 80, 60, '#7a5a4a'],
     [150, 600, 110, 60, '#6a6a72'], [760, 600, 110, 70, '#c8c8c8'], [300, 660, 60, 40], [1000, 640, 90, 50], [1150, 620, 80, 46]].forEach(function (h) { house(h[0], h[1], h[2], h[3], h[4]); });
    function tree(x, y, r) { g.fillStyle = 'rgba(40,60,20,.25)'; g.beginPath(); g.ellipse(x + 4, y + r * 0.7, r, r * 0.4, 0, 0, 7); g.fill(); g.fillStyle = '#4f7a3a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#6a9a48'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, 7); g.fill(); }
    [[60, 200, 26], [330, 230, 18], [520, 600, 40], [600, 640, 22], [470, 650, 18], [1230, 200, 24], [860, 230, 16], [40, 600, 22], [1240, 600, 20], [760, 170, 16], [1040, 130, 18]].forEach(function (q) { tree(q[0], q[1], q[2]); });
    for (i = 0; i < 14; i++) { var lx = 60 + i * 90; g.strokeStyle = '#6a9a48'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 432 + Math.sin(i) * 6); g.quadraticCurveTo(lx + 6, 452, lx + 2, 468); g.stroke(); }
    g.save(); g.translate(690, 505); g.rotate(-0.12); g.fillStyle = 'rgba(40,30,20,.3)'; g.fillRect(-30, -78, 66, 160); g.fillStyle = '#cdb88e'; g.fillRect(-34, -82, 66, 160); g.strokeStyle = '#7a6040'; g.lineWidth = 3; g.strokeRect(-34, -82, 66, 160);
    g.strokeStyle = '#a89068'; g.lineWidth = 2; for (i = -60; i < 78; i += 22) { g.beginPath(); g.moveTo(-34, i); g.lineTo(32, i); g.stroke(); } g.restore();
    g.fillStyle = '#b8a888'; for (i = 0; i < 4; i++) g.fillRect(320 + i * 6, 470 + i * 12, 70 - i * 12, 10);
    g.strokeStyle = 'rgba(184,67,47,.85)'; g.lineWidth = 3; g.setLineDash([12, 9]); g.beginPath(); g.moveTo(175, 340); g.lineTo(600, 344); g.lineTo(900, 328); g.lineTo(930, 150); g.lineTo(1180, 150); g.stroke(); g.setLineDash([]);
    return c;
  }
  function drawMap(ctx, t, clock) {
    var img = A.img('map_liuhe');
    if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; }
    else { if (!mapCache) mapCache = buildMap(); ctx.drawImage(mapCache, 0, 0); }
    var k = Math.max(0, Math.min(1, (clock - T.START) / (T.END - T.START)));
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(' + Math.round(255 - 30 * k) + ',' + Math.round(250 - 80 * k) + ',' + Math.round(240 - 120 * k) + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    if (!Fx.lowFx) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#e8f6f1'; for (var i = 0; i < 10; i++) { var x = (i * 137 + t * 22) % 1300 - 20, y = 470 + Math.sin(i * 1.7) * 30 + (x > 600 ? -20 : 0); ctx.fillRect(x, y, 14, 2); } ctx.restore(); }
  }
  function placeBg(id, clock) {
    if (id === 'shop') return 'bg_room_main';
    if (id === 'wharf') return clock >= 18 * 60 + 30 ? 'bg_wharf_night' : 'bg_wharf_dusk';
    return 'bg_' + id;
  }
  function Town(app) {
    var s = app.state;
    this.app = app; this.name = 'town'; this.pausable = true; this.s = s; this.t = 0; this.mt = 0; this.mode = 'map';
    this.st = T.ensure(s);
    this.sel = this.st.at; this.anim = null; this.note = null;
    var ls = T.leads(s); if (this.st.clock === T.START && ls[0] && ls[0].at) this.sel = ls[0].at;
    Fx.reset(); Shop.reset('day', s.today.weather);
    Au.setScene({ place: 'street', rain: s.today.weather === 'rain' ? 0.6 : 0, crowd: 0.2, dawn: 1, music: 'close' });
  }
  var P = Town.prototype;
  P.setMode = function (m) { this.mode = m; this.mt = 0; };
  P.update = function (dt) {
    this.t += dt; this.mt += dt;
    if (this.anim) { this.anim.t += dt; if (this.anim.t >= this.anim.d) this.anim = null; }
    if (Math.random() < dt * 0.12) Au.play('sparrow', { vol: 0.25 });
  };
  P.finish = function () { var app = this.app; T.done(this.s); app.save(); app.route(true); };
  P.go = function (id) {
    var s = this.s, from = this.st.at, w = T.travel(s, id);
    if (w) { this.app.notice(w); Au.play('wrong'); return; }
    var a = T.place(from), b = T.place(id); this.anim = { ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, d: 0.75 };
    Au.play('page'); this.app.save();
  };
  P.act = function (a) {
    var s = this.s, app = this.app, self = this;
    if (a.why) { app.notice(a.why); return; }
    if (a.kind === 'talk') { var line = T.doTalk(s, a.who); this.note = { who: a.who, text: line }; this.setMode('note'); }
    else if (a.kind === 'wait') { T.spend(s, a.mins); app.notice('等到了 ' + T.clockText(this.st.clock)); }
    else if (a.kind === 'idle') { this.note = { who: 'n', text: T.doIdle(s, this.st.at) }; this.setMode('note'); }
    else if (a.kind === 'practice') { T.spend(s, a.mins); var r = T.practice(s); this.res = { title: '关起门练手', lines: ['我把卷帘门拉下一半，一个人对着' + r.name + '练了一个钟头。', r.name + '的手感又熟了一点。'] }; this.setMode('result'); }
    else if (a.kind === 'bridge') { T.spend(s, a.mins); var b = T.bridge(s); this.res = { title: '桥头', w: b.w, lines: [b.river, b.text] }; this.setMode('result'); }
    else if (a.kind === 'market') { T.spend(s, a.mins); this.st.did.market = 1; this.lots = T.lots(s); this.looks = 2; this.seen = this.lots.map(function () { return [false, false, false]; }); this.take = this.lots.map(function () { return false; }); this.setMode('market'); }
    else if (a.kind === 'depot') { T.spend(s, a.mins); this.st.did.depot = 1; this.offers = T.offers(s); this.setMode('depot'); }
    else if (a.kind === 'scene') {
      var Screens = require('ui/screens'), sc = Tn.scenes[a.scene];
      T.spend(s, a.mins); app.save(); Au.play('page');
      app.go(Screens.Scene, { ids: [a.scene], when: 'town', place: sc.place, done: function () { app.save(); app.route(true); } }, true);
      return;
    }
    Au.play('tap'); app.save();
  };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, st = this.st;
    var bgId = this.mode !== 'map' ? placeBg(st.at, st.clock) : null;
    if (bgId && A.img(bgId)) { Shop.drawPlace(ctx, bgId, this.t, { tint: 'rgb(255,240,222)' }); }
    else drawMap(ctx, this.t, st.clock);
    if (s.today.weather === 'rain' && !Fx.lowFx) { ctx.save(); ctx.strokeStyle = 'rgba(220,232,245,.35)'; ctx.lineWidth = 1.5; for (var r = 0; r < 70; r++) { var rx = (r * 97 + this.t * 420) % 1320 - 20, ry = (r * 53 + this.t * 900) % 760 - 20; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); ctx.stroke(); } ctx.restore(); }
    if (this.mode === 'map' || !(bgId && A.img(bgId))) this.drawPins(ctx);
    this.drawHud(ctx);
    if (this.mode === 'map') { this.drawLeads(ctx); this.drawCard(ctx); }
    else if (this.mode === 'note') this.drawNote(ctx);
    else if (this.mode === 'market') this.drawMarket(ctx);
    else if (this.mode === 'depot') this.drawDepot(ctx);
    else if (this.mode === 'result') this.drawResult(ctx);
    Shop.grade(ctx);
  };
  P.drawHud = function (ctx) {
    var s = this.s, app = this.app, self = this, st = this.st, t = this.t;
    K.dayChip(ctx, s, 14, 12, t);
    var k = (st.clock - T.START) / (T.END - T.START), left = T.left(s);
    ctx.fillStyle = 'rgba(28,22,16,.74)'; U.rr(ctx, 470, 12, 340, 46, 23); ctx.fill();
    U.text(ctx, T.clockText(st.clock), 492, 44, { size: 24, bold: true, color: '#fff8e8' });
    ctx.fillStyle = 'rgba(255,240,210,.22)'; U.rr(ctx, 572, 29, 220, 12, 6); ctx.fill();
    ctx.fillStyle = left < 60 ? '#e8862a' : '#ffe28a'; U.rr(ctx, 572, 29, 220 * Math.min(1, k), 12, 6); ctx.fill();
    U.text(ctx, left > 0 ? '天黑前还能走 ' + (left >= 60 ? Math.floor(left / 60) + ' 小时 ' : '') + (left % 60 ? Math.round(left % 60) + ' 分' : '') : '天黑了', 640, 80, { size: 15, bold: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, 1062, 14, 206, 56, 10); ctx.fill();
    ctx.fillStyle = '#c98a4e'; U.rr(ctx, 1058, 8, 206, 56, 10); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 3; ctx.stroke();
    K.tin(ctx, 1100, 34, s.cash, 0);
    if (this.mode === 'map') K.tag(ctx, 'end', 1090, 74, 174, 48, left > 0 ? '回店算账' : '天黑了，回店', { kind: left > 0 ? 'wood' : 'teal', size: 19, onTap: function () { self.finish(); } });
  };
  P.drawPins = function (ctx) {
    var self = this, s = this.s, st = this.st, t = this.t;
    Tn.places.forEach(function (p, i) {
      var locked = p.lock && !s.flags[p.lock]; if (locked) return;
      var on = self.sel === p.id, here = st.at === p.id, w = T.whyNot(s, p.id), mk = self.mode === 'map' ? T.markers(s, p.id) : { people: [] };
      var bob = Math.sin(t * 2.4 + i) * (mk.event ? 4 : 1.5), x = p.x, y = p.y + bob;
      U.hit('pl_' + p.id, x - 34, y - 70, 68, 100, { onTap: function () { self.sel = p.id; Au.play('page'); }, label: p.name, disabled: self.mode !== 'map' });
      ctx.save(); if (w && !here) ctx.globalAlpha *= 0.55;
      ctx.fillStyle = 'rgba(20,12,6,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 16, 6, 0, 0, 7); ctx.fill();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, x, y - 36, 60, '255,220,140', 0.45); ctx.restore(); }
      ctx.fillStyle = on ? RED : (p.open != null && !T.isOpenAt(p, st.clock)) ? '#6a4a8a' : TEAL;
      ctx.beginPath(); ctx.moveTo(x - 10, y - 24); ctx.lineTo(x, y); ctx.lineTo(x + 10, y - 24); ctx.fill();
      if (A.img('map_pins')) { ctx.beginPath(); ctx.arc(x, y - 42, 27, 0, 7); ctx.fill(); A.cell(ctx, 'map_pins', i, x - 24, y - 66, 48, 48, {}); }
      else { ctx.beginPath(); ctx.arc(x, y - 38, 20, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 3; ctx.stroke(); U.text(ctx, p.mark, x, y - 31, { size: 20, bold: true, kai: true, align: 'center', color: '#fff8e8' }); }
      ctx.font = U.font(14, 'bold'); var nw = ctx.measureText(p.name).width + 16;
      ctx.fillStyle = on ? '#fff3d6' : 'rgba(255,248,232,.92)'; U.rr(ctx, x - nw / 2, y + 8, nw, 22, 6); ctx.fill(); ctx.strokeStyle = on ? RED : '#7d5a35'; ctx.lineWidth = 1.5; ctx.stroke();
      U.text(ctx, p.name, x, y + 24, { size: 14, bold: true, align: 'center', color: INK });
      var bx = x + 18, by = y - 64;
      if (A.img('map_marks')) {
        if (mk.event) { A.cell(ctx, 'map_marks', 0, bx - 14, by - 16, 28, 28, {}); bx += 26; }
        if (mk.people.length) { A.cell(ctx, 'map_marks', 1, bx - 15, by - 15, 30, 30, {}); bx += 28; }
        if (mk.biz) A.cell(ctx, 'map_marks', 2, bx - 13, by - 13, 26, 26, {});
        mk = { people: [] };
      }
      if (mk.event) { ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(bx, by, 11, 0, 7); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, '!', bx, by + 6, { size: 16, bold: true, align: 'center', color: INK }); bx += 24; }
      if (mk.people.length) { ctx.fillStyle = '#fff8e8'; U.rr(ctx, bx - 12, by - 10, 26, 20, 6); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 1.5; ctx.stroke(); U.text(ctx, '…', bx + 1, by + 4, { size: 14, bold: true, align: 'center', color: INK }); bx += 28; }
      if (mk.biz) { ctx.fillStyle = '#fff8e8'; U.rr(ctx, bx - 11, by - 10, 22, 20, 6); ctx.fill(); ctx.strokeStyle = TEAL; ctx.lineWidth = 1.5; ctx.stroke(); U.text(ctx, '¥', bx, by + 5, { size: 14, bold: true, align: 'center', color: TEAL }); }
      ctx.restore();
    });
    var cur = T.place(st.at), zx = cur.x, zy = cur.y;
    if (this.anim) { var k = Fx.ease.inOut(Math.min(1, this.anim.t / this.anim.d)); zx = this.anim.ax + (this.anim.bx - this.anim.ax) * k; zy = this.anim.ay + (this.anim.by - this.anim.ay) * k; }
    var hop = this.anim ? Math.abs(Math.sin(this.t * 14)) * -5 : 0;
    if (A.img('map_zhou')) {
      var row = 0, an = this.anim; if (an) { var dx = an.bx - an.ax, dy = an.by - an.ay; row = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); this.facing = row; } else row = this.facing || 0;
      var fr = an ? Math.floor(this.t * 9) % 4 : 0;
      ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.beginPath(); ctx.ellipse(zx + 30, zy + 2, 15, 5, 0, 0, 7); ctx.fill();
      A.cell(ctx, 'map_zhou', row * 4 + fr, zx + 30 - 19, zy + 4 - 60, 38, 60, {});
      return;
    }
    ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.beginPath(); ctx.ellipse(zx + 26, zy + 2, 12, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(zx + 26, zy - 12 + hop, 15, 0, 7); ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.stroke();
    U.text(ctx, '周', zx + 26, zy - 6 + hop, { size: 15, bold: true, align: 'center', color: RED });
  };
  P.drawLeads = function (ctx) {
    var s = this.s, self = this, ls = T.leads(s), x = 448, y = 94, w = 384, h = 34 + ls.length * 24;
    ctx.fillStyle = 'rgba(251,245,228,.94)'; U.rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2; ctx.stroke();
    U.text(ctx, '小本子 · 今天可能遇到', x + 14, y + 24, { size: 15, bold: true, color: TEAL });
    ls.forEach(function (l, i) {
      var yy = y + 32 + i * 24;
      if (l.at) U.hit('lead' + i, x + 6, yy, w - 12, 22, { onTap: function () { self.sel = l.at; Au.play('page'); }, label: l.text, minSize: 22 });
      U.text(ctx, (l.star ? '★ ' : '· ') + l.text, x + 14, yy + 17, { size: 14, color: l.star ? RED : INK, maxW: w - 28 });
    });
  };
  P.drawCard = function (ctx) {
    var s = this.s, self = this, st = this.st, p = T.place(this.sel); if (!p) return;
    var c = CARD, here = st.at === p.id, x = p.x >= 640 ? 14 : c.x, y = c.y;
    K.paper(ctx, x, y, c.w, c.h, { pin: RED });
    K.iconBtn(ctx, 'card_x', x + c.w - 22, y - 18, 34, 'close', function () { self.sel = null; }, { label: '收起' });
    U.text(ctx, p.full || p.name, x + 22, y + 44, { size: 24, bold: true, kai: true, color: INK, maxW: c.w - 140 });
    var mins = T.travelMins(st.at, p.id), w = T.whyNot(s, p.id);
    U.text(ctx, here ? '你在这儿' : (p.bus ? '坐 7 路 ' : '走过去 ') + mins + ' 分钟', x + c.w - 26, y + 42, { size: 14, align: 'right', color: here ? TEAL : MUTE, bold: here });
    if (!here) {
      U.para(ctx, p.desc, x + 22, y + 72, c.w - 44, { size: 15, lh: 22, color: INK });
      var arrive = st.clock + mins, ppl = T.presentAt(s, p.id, arrive), ev = T.eventsAt(s, p.id, arrive);
      var yy = y + 150;
      if (ppl.length) { U.text(ctx, T.clockText(arrive) + ' 到，那时在：', x + 22, yy, { size: 14, color: MUTE }); ppl.slice(0, 5).forEach(function (id, i) { self.face(ctx, id, x + 22 + i * 58, yy + 8, 50); }); yy += 66; }
      else { var cm = T.comingAt(s, p.id, arrive); U.text(ctx, T.clockText(arrive) + ' 到，没碰到熟人。' + (cm.length ? cm.map(function (c) { return Cast.regulars[c.id].name + ' ' + Math.floor(c.from) + ' 点后会来'; }).join('，') + '。' : ''), x + 22, yy, { size: 14, color: MUTE, maxW: c.w - 44 }); yy += 18; }
      if (ev.length) U.text(ctx, '! ' + ev.map(function (v) { return Cast.regulars[v.id].name + '好像有话想说'; }).join('；'), x + 22, yy + 8, { size: 14, bold: true, color: RED, maxW: c.w - 44 });
      if (w) U.text(ctx, w, x + 22, y + c.h - 26, { size: 16, bold: true, color: RED });
      else K.tag(ctx, 'go', x + c.w - 22 - 170, y + c.h - 62, 170, 46, p.bus ? '坐车过去' : '走过去', { kind: 'teal', size: 20, onTap: function () { self.go(self.sel); } });
      return;
    }
    var acts = T.actionsAt(s, p.id), ppl2 = T.presentAt(s, p.id), ay = y + 60;
    if (ppl2.length) { ppl2.slice(0, 5).forEach(function (id, i) { self.face(ctx, id, x + 22 + i * 54, ay, 46); }); ay += 54; }
    else { var cm2 = T.comingAt(s, p.id); U.text(ctx, '这会儿没碰到熟人。' + (cm2.length ? cm2.map(function (c) { return Cast.regulars[c.id].name + ' ' + Math.floor(c.from) + ' 点后会来'; }).join('，') + '。' : ''), x + 22, ay + 18, { size: 14, color: MUTE, maxW: c.w - 44 }); ay += 28; }
    acts.slice(0, 5).forEach(function (a, i) {
      var by = ay + i * 40, dis = !!a.why;
      K.tag(ctx, 'act_' + a.id, x + 18, by, c.w - 36, 34, a.label, { kind: a.star ? 'teal' : 'paper', size: 16, disabled: dis, onTap: function () { self.act(a); } });
      U.text(ctx, dis ? a.why : a.mins + ' 分钟', x + c.w - 28, by + 23, { size: 12, align: 'right', color: dis ? RED : a.star ? '#e8f4f0' : MUTE });
    });
  };
  P.face = function (ctx, id, x, y, s) { ctx.save(); U.rr(ctx, x, y, s, s, 7); ctx.fillStyle = '#ecdcb8'; ctx.fill(); ctx.strokeStyle = '#b48c5a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.clip(); var r = Cast.regulars[id]; if (r) A.cell(ctx, 'atlas_regulars', r.portrait, x + 1, y + 2, s - 2, s, { trim: true, fit: true }); ctx.restore(); };
  P.drawNote = function (ctx) {
    var self = this, n = this.note, k = Fx.ease.out3(Math.min(1, this.mt * 4)), x = 300, y = 470 + (1 - k) * 20, w = 680, h = 150;
    ctx.save(); ctx.globalAlpha *= k;
    ctx.fillStyle = 'rgba(20,12,6,.4)'; U.rr(ctx, x + 4, y + 7, w, h, 12); ctx.fill();
    ctx.fillStyle = n.who === 'n' ? 'rgba(22,16,10,.88)' : '#fbf5e4'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = n.who === 'n' ? 'rgba(232,200,150,.5)' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
    var tx = x + 28;
    if (n.who !== 'n') { this.face(ctx, n.who, x + 20, y + 20, 110); tx = x + 150; U.text(ctx, Cast.regulars[n.who].name, tx, y + 44, { size: 20, bold: true, kai: true, color: RED }); }
    U.para(ctx, n.text, tx, y + (n.who === 'n' ? 62 : 84), w - (tx - x) - 28, { size: 22, lh: 32, bold: true, kai: true, color: n.who === 'n' ? '#f4e4c4' : INK });
    U.hit('note_ok', 0, 0, 1280, 720, { onTap: function () { self.setMode('map'); }, label: '继续', minSize: 0 });
    if (this.mt > 0.4) U.text(ctx, '点一下继续', x + w - 20, y + h - 14, { size: 13, align: 'right', color: n.who === 'n' ? '#d8c8a8' : MUTE });
    ctx.restore();
  };
  function drawGoods(ctx, item, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    if (item === 'oil') A.cell(ctx, 'atlas_ui', 8, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    else if (item === 'meat') A.cell(ctx, 'atlas_ui', 9, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    else if (item === 'veg') { [['#3f7a3a', -26, -14], ['#5a9a4a', 22, -12], ['#4f8a4b', -6, -22], ['#6aa85a', 8, -6], ['#3f7a3a', -18, 0]].forEach(function (q) { ctx.fillStyle = q[0]; ctx.beginPath(); ctx.ellipse(q[1] * s / 110, q[2] * s / 110, s * 0.17, s * 0.12, q[1] * 0.02, 0, 7); ctx.fill(); ctx.fillStyle = '#e8f0d0'; ctx.fillRect(q[1] * s / 110 - 2, q[2] * s / 110 - 2, 4, s * 0.1); }); ctx.fillStyle = '#b8823a'; U.rr(ctx, -s * 0.42, 0, s * 0.84, s * 0.34, 8); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(90,50,20,.45)'; ctx.lineWidth = 2; for (var vv = 1; vv < 6; vv++) { ctx.beginPath(); ctx.moveTo(-s * 0.42 + vv * s * 0.14, 2); ctx.lineTo(-s * 0.42 + vv * s * 0.14, s * 0.33); ctx.stroke(); } }
    else if (item === 'eggs') { ctx.fillStyle = '#b8823a'; U.rr(ctx, -s * 0.42, -s * 0.12, s * 0.84, s * 0.4, 6); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke(); for (var i = 0; i < 4; i++) { ctx.fillStyle = '#f6ead2'; ctx.beginPath(); ctx.ellipse(-s * 0.3 + i * s * 0.2, -s * 0.14, s * 0.08, s * 0.1, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8b08a'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    else { ctx.fillStyle = '#c8a46a'; ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.36); ctx.quadraticCurveTo(-s * 0.44, -s * 0.1, -s * 0.22, -s * 0.3); ctx.lineTo(s * 0.22, -s * 0.3); ctx.quadraticCurveTo(s * 0.44, -s * 0.1, s * 0.32, s * 0.36); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-s * 0.22, -s * 0.34, s * 0.44, s * 0.08); ctx.fillStyle = item === 'beans' ? '#e0c060' : '#f4f0e2'; ctx.beginPath(); ctx.ellipse(0, -s * 0.26, s * 0.18, s * 0.06, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,20,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 0.2, 0); ctx.moveTo(-s * 0.18, s * 0.16); ctx.lineTo(s * 0.18, s * 0.16); ctx.stroke(); }
    ctx.restore();
  }
  P.drawMarket = function (ctx) {
    var self = this, s = this.s, k = Fx.ease.out3(Math.min(1, this.mt * 3));
    K.dim(ctx, 0.5 * k);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.fillStyle = '#8f5a2c'; ctx.fillRect(0, 560, 1280, 160); ctx.fillStyle = '#c98a4e'; ctx.fillRect(0, 556, 1280, 8);
    U.text(ctx, '批发市场 · 验货', 640, 122, { size: 34, bold: true, kai: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 6 });
    U.text(ctx, '还能细看 ' + this.looks + ' 次。看过的会写在牌子上；看不准的，自己掂量。', 640, 154, { size: 18, align: 'center', color: '#f4e4c4', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    var total = 0;
    this.lots.forEach(function (l, i) {
      var x = 100 + i * 370, y = 180, w = 340, h = 400, g = Tn.goods[l.item], sel = Tn.sellers[l.seller], tk = self.take[i];
      if (tk) total += l.price;
      ctx.fillStyle = 'rgba(20,12,6,.35)'; U.rr(ctx, x + 4, y + 8, w, h, 12); ctx.fill();
      ctx.fillStyle = tk ? '#fff6d8' : '#fbf5e4'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = tk ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = tk ? 5 : 3; ctx.stroke();
      ctx.fillStyle = l.seller === 'qin' ? '#4f8a4b' : l.seller === 'hu' ? '#3f6a8a' : '#8a6a4a'; U.rr(ctx, x, y, w, 36, { 0: 12 }[0]); ctx.fill();
      U.text(ctx, sel.name, x + 16, y + 25, { size: 18, bold: true, color: '#fff8e8' });
      drawGoods(ctx, l.item, x + 84, y + 100, 110);
      U.text(ctx, g.name, x + 160, y + 86, { size: 24, bold: true, kai: true, color: INK });
      U.text(ctx, '抵明天进货 ' + K.yuan(l.v), x + 160, y + 114, { size: 15, color: MUTE });
      ctx.save(); ctx.translate(x + 230, y + 142); ctx.rotate(-0.06); ctx.fillStyle = '#f2d27a'; U.rr(ctx, -46, -18, 104, 36, 6); ctx.fill(); ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, K.yuan(l.price), 6, 8, { size: 22, bold: true, align: 'center', color: '#5a3a10' }); ctx.restore();
      Tn.tools.forEach(function (tl, j) {
        var bx = x + 14 + j * 106, by = y + 178, seen = self.seen[i][j];
        K.tag(ctx, 'look_' + i + '_' + j, bx, by, 98, 40, tl.name, { kind: seen ? 'teal' : 'paper', size: 17, disabled: !seen && self.looks <= 0, onTap: function () { if (self.seen[i][j] || self.looks <= 0) return; self.seen[i][j] = true; self.looks--; Au.play('page'); } });
      });
      var yy = y + 248;
      self.seen[i].forEach(function (sn, j) { if (!sn) return; var c = T.clue(l, j); yy += U.para(ctx, '· ' + c, x + 16, yy, w - 32, { size: 16, lh: 22, color: INK }) + 4; });
      if (!self.seen[i].some(Boolean)) U.para(ctx, sel.line, x + 16, yy, w - 32, { size: 15, lh: 21, color: MUTE });
      K.tag(ctx, 'take_' + i, x + 14, y + h - 60, w - 28, 46, tk ? '收下了（再点退回）' : '收下', { kind: tk ? 'teal' : 'wood', size: 20, onTap: function () { self.take[i] = !self.take[i]; Au.play(self.take[i] ? 'coin' : 'page'); } });
    });
    U.text(ctx, '一共 ' + K.yuan(total), 400, 650, { size: 26, bold: true, color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 5 });
    K.tag(ctx, 'pay', 840, 618, 230, 58, total ? '付钱，回店' : '一样都不要', { kind: 'teal', size: 22, disabled: total > Math.max(0, s.cash), onTap: function () { self.pay(); } });
    K.tag(ctx, 'mk_back', 1090, 618, 150, 58, '不看了', { kind: 'paper', size: 19, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.pay = function () {
    var s = this.s, ls = this.lots, picks = this.take, p = T.buy(s, ls, picks), n = picks.filter(Boolean).length;
    if (n) Au.play('coin');
    this.res = { title: '批发市场', lines: n ? ['付了 ' + K.yuan(p.spent) + '，收了 ' + n + ' 样。明早进货能抵 ' + K.yuan(p.credit) + '。', '货好不好，明天开箱就知道了。'] : ['转了一圈，一样没收。', '老胡在后面喊：兄弟，下回来早点！'] };
    this.setMode('result'); this.app.save();
  };
  P.drawDepot = function (ctx) {
    var self = this, k = Fx.ease.out3(Math.min(1, this.mt * 3));
    K.dim(ctx, 0.5 * k); ctx.save(); ctx.globalAlpha *= k;
    U.text(ctx, '7 路总站 · 明早的包餐', 640, 140, { size: 34, bold: true, kai: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 6 });
    U.text(ctx, '接了，开门前先交货，钱当场结。交不齐，丢人，也丢客。', 640, 172, { size: 18, align: 'center', color: '#f4e4c4', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    var n = this.offers.length, w = 440, gap = 40, x0 = 640 - (n * w + (n - 1) * gap) / 2;
    this.offers.forEach(function (o, i) {
      var x = x0 + i * (w + gap), y = 206, h = 360, d = D.byId[o.dish];
      K.paper(ctx, x, y, w, h, { pin: RED });
      U.text(ctx, o.who, x + 30, y + 54, { size: 28, bold: true, kai: true, color: INK });
      if (o.from) { ctx.save(); U.rr(ctx, x + w - 96, y + 18, 70, 70, 8); ctx.clip(); People.portrait(ctx, o.from, x + w - 96, y + 18, 70, {}); ctx.restore(); }
      U.para(ctx, '"' + o.line.replace(/^[^：]*：/, '') + '"', x + 30, y + 98, w - 60, { size: 17, lh: 25, color: INK, kai: true, bold: true });
      A.food(ctx, o.dish, x + 30, y + 190, 80, {});
      U.text(ctx, d.name + ' × ' + o.n, x + 124, y + 226, { size: 24, bold: true, color: INK });
      U.text(ctx, '每份 ' + K.yuan(o.unit) + '（牌价 ' + K.yuan(Run.price(self.s, o.dish)) + '）', x + 124, y + 254, { size: 16, color: MUTE });
      U.text(ctx, '交齐收 ' + K.yuan(o.unit * o.n), x + 30, y + 300, { size: 22, bold: true, color: TEAL });
      K.tag(ctx, 'acc_' + i, x + w - 30 - 160, y + h - 72, 160, 52, '接下', { kind: 'teal', size: 22, onTap: function () { T.accept(self.s, o); Au.play('stamp'); self.res = { title: '7 路总站', kind: 'depot', lines: ['接了' + o.who + '的单：明早 ' + o.n + ' 份' + d.name + '。', '晨备的时候会多备出来。记得开门前，灶上先把这一批做好。'] }; self.setMode('result'); self.app.save(); } });
    });
    K.tag(ctx, 'dp_skip', 640 - 260, 610, 240, 56, '都不接', { kind: 'paper', size: 20, onTap: function () { self.res = { title: '7 路总站', kind: 'depot', lines: ['我在总站门口站了一会儿，看司机们交班。', '单子没接。明早照常。'] }; self.setMode('result'); } });
    K.tag(ctx, 'dp_back', 640 + 20, 610, 240, 56, '回到街上', { kind: 'wood', size: 20, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.drawResult = function (ctx) {
    var self = this, r = this.res, k = Fx.ease.out3(Math.min(1, this.mt * 3)), x = 340, y = 190 + (1 - k) * 30, w = 600, h = 320;
    K.dim(ctx, 0.42 * k); ctx.save(); ctx.globalAlpha *= k;
    K.paper(ctx, x, y, w, h, { pin: RED, lines: 34, top: 110 });
    U.text(ctx, r.title, x + 40, y + 62, { size: 32, bold: true, kai: true, color: INK });
    if (r.w) K.weather(ctx, r.w, x + w - 70, y + 50, 44, this.t);
    var yy = y + 120; r.lines.forEach(function (l) { yy += U.para(ctx, l, x + 40, yy, w - 80, { size: 21, lh: 32, kai: true, bold: true, color: INK }) + 8; });
    K.tag(ctx, 'res_ok', x + w - 40 - 220, y + h - 76, 220, 56, '回到街上', { kind: 'teal', size: 22, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.key = function (k) { if (k === 'Escape' && (this.mode === 'note' || this.mode === 'result')) this.setMode('map'); };
  P.describe = function () {
    var s = this.s, st = this.st;
    return { mode: this.mode, clock: T.clockText(st.clock), at: st.at, sel: this.sel, left: T.left(s), leads: T.leads(s).map(function (l) { return l.text; }),
      actions: T.actionsAt(s, st.at).map(function (a) { return a.id + (a.why ? '×' : ''); }), looks: this.looks, take: this.take, offers: this.offers ? this.offers.map(function (o) { return o.id; }) : null };
  };
  return { Town: Town };
});
;
/* ui/s_prep.js */
BSX.define('ui/s_prep', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var C = require('content/config');
  var D = require('content/dishes');
  var Story = require('content/story');
  var Cond = require('core/cond');
  var CHALK = '#f4f0e0', CHALK2 = '#f2d27a';
  var STN_COL = { pot: '#e8dcc0', fryer: '#e8b84a', griddle: '#8a8078', boil: '#6f9a96', soy: '#3b8076', side: '#b8823a' };
  function Prep(app, p) {
    var s = app.state;
    this.app = app; this.name = 'prep'; this.pausable = true; this.s = s; this.t = 0; this.closed = !!p.closed; this.hold = 0; this.holding = false; this.opened = false;
    Fx.reset(); require('game/stations').silence();
    Shop.reset('night', s.today.weather); Shop.setShutter(1, true); Shop.crowd = 0.15;
    Au.setScene({ place: 'shop', rain: s.today.weather === 'rain' ? 0.8 : 0, crowd: 0, dawn: 0, music: 'dawn' });
    this.f = Run.features(s);
    this.notes = this.buildNotes();
    (s.today.news || []).forEach(function (n) { if (!n.shown) { n.shown = true; } });
  }
  var P = Prep.prototype;
  P.buildNotes = function () {
    var s = this.s, t = s.today, out = [], y = s.hist[s.hist.length - 1];
    (t.notes || []).forEach(function (n) { out.push({ text: n.text, col: n.kind === 'order' ? '#fff3b8' : '#f6ecd6', from: n.from }); });
    t.newDishes.forEach(function (id) { out.push({ text: '新学会：' + D.byId[id].name + '。可以写上菜单了。', col: '#d8f0d0' }); });
    var toRent = 7 - (s.day % 7); if (s.day % 7 === 0) toRent = 0;
    if (s.day < 28 && toRent <= 1 && s.day % 7 !== 1) out.push({ text: (toRent === 0 ? '今晚' : '明晚') + '交房租 ' + K.yuan(C.rentWeekly) + '。', col: '#ffd9c8' });
    if (s.day >= 8 && s.day <= 26 && !s.depositPaid && (s.day % 3 === 0 || s.day >= 24)) out.push({ text: '续租押金 ' + K.yuan(s.deposit) + '，第 26 天给话。', col: '#ffd9c8' });
    var tips = { 2: '油每用一天就老一点：熟得快、容易焦。何姨说三天一换。', 3: '灶台底下那口老煎锅能用了。菜单最多写四样，三口灶。', 4: '今天起可以挑用料。便宜的省钱，好的出品更香。', 5: '今天起可以自己定价。薄利人多，提价人少。', 8: '可以把进货单贴在门口——油和料都摆在明面上。' };
    if (tips[s.day]) out.push({ text: tips[s.day], col: '#e0ecf4' });
    if (Run.costUpNow(s) && (s.day === C.costUp.from || s.day === C.costUp.from + 1)) out.push({ text: '鲜货和好料这几天涨价一成半。', col: '#ffd9c8' });
    return out.slice(0, 4);
  };
  P.update = function (dt) {
    var s = this.s, app = this.app;
    this.t += dt;
    if (this.opened) return;
    if (this.holding) {
      this.hold = Math.min(1, this.hold + dt / 0.9); var tk = Math.floor(this.hold * 8); if (tk !== this.tick) { this.tick = tk; Au.play('shutter_tick'); }
      if (this.hold >= 1) { this.opened = true; this.holding = false; app.capture = null; Run.openShop(s); app.save(); app.P.vibrate('heavy'); Au.play('shutter_up'); Shop.setShutter(0); app.go(require('ui/s_play').Shift, {}, false); }
    } else this.hold = Math.max(0, this.hold - dt * 1.6);
    Shop.setShutter(1 - this.hold * 0.35, false);
  };
  P.canOpen = function () { var s = this.s, c = Run.planCost(s); if (c.total > Math.max(0, s.cash) + 8000) return '钱不够进这么多货'; if (!s.plan.menu.some(function (id) { return (s.plan.stock[id] || 0) > 0; })) return '什么都没备'; return ''; };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, p = s.plan, f = this.f, t = this.t;
    Shop.drawBack(ctx, s, { curtain: !!s.flags.man_curtain }); Shop.drawCounter(ctx); Shop.drawLight(ctx); Shop.drawShutter(ctx);
    K.dim(ctx, 0.28);
    K.dayChip(ctx, s, 14, 12, t);
    U.text(ctx, '清晨 · 备料', 198, 48, { size: 26, bold: true, color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' });
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    K.iconBtn(ctx, 'book', 1280 - 122 - (app.rightInset || 0), 10, 48, 'book', function () { app.openOverlay(require('ui/s_book').Book, {}); }, { label: '小本子' });
    K.tin(ctx, 1010, 34, s.cash, 0);
    if (this.closed) {
      K.paper(ctx, 340, 220, 600, 280, { pin: K.col.red });
      U.text(ctx, '停业整改', 640, 290, { size: 40, bold: true, align: 'center', color: K.col.ink });
      U.para(ctx, '今天不开门。把油锅刷了，台面、地漏、抹布，一样一样过。', 400, 340, 480, { size: 22, color: K.col.ink });
      K.tag(ctx, 'prep_closed', 500, 420, 280, 58, '干到天黑', { kind: 'teal', onTap: function () { Run.closedDay(s); app.save(); app.route(true); } });
      return;
    }
    var bx = 22, by = 78, bw = 420, bh = 624;
    K.board(ctx, bx, by, bw, bh);
    var hot = Run.hotCount(p.menu), maxM = C.menuMax(s), burners = C.burners(s);
    U.text(ctx, '今日菜单', bx + 28, by + 52, { size: 28, bold: true, color: CHALK });
    if (f.menu) U.text(ctx, p.menu.length + '/' + maxM + ' 样 · 灶 ' + hot + '/' + burners, bx + bw - 28, by + 50, { size: 18, align: 'right', color: hot >= burners || p.menu.length >= maxM ? CHALK2 : 'rgba(244,240,224,.7)' });
    ctx.strokeStyle = 'rgba(244,240,224,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 24, by + 66); ctx.lineTo(bx + bw - 24, by + 66); ctx.stroke();
    var rh = p.menu.length > 5 ? 58 : 64, y0 = by + 76, yst = s.hist[s.hist.length - 1];
    p.menu.forEach(function (id, i) {
      var d = D.byId[id], y = y0 + i * rh, n = p.stock[id] || 0;
      ctx.fillStyle = STN_COL[d.st]; ctx.fillRect(bx + 20, y + 6, 5, rh - 14);
      A.food(ctx, id, bx + 30, y + 2, rh - 8, {});
      U.text(ctx, d.name, bx + 32 + rh, y + 28, { size: 22, bold: true, color: CHALK, maxW: 128 });
      U.text(ctx, K.yuan(Run.price(s, id)), bx + 32 + rh, y + 50, { size: 17, color: CHALK2 });
      if (yst && yst.want && yst.want[id] != null) U.text(ctx, '昨天要 ' + yst.want[id], bx + 96 + rh, y + 50, { size: 14, color: 'rgba(244,240,224,.6)' });
      if (f.stock) {
        var sx = bx + bw - (f.menu ? 190 : 150);
        K.tag(ctx, 'dec_' + id, sx, y + 10, 42, 42, '−', { kind: 'dark', size: 24, disabled: n <= 0, onTap: function () { Run.setStock(s, id, n - 2); Au.play('chalk'); } });
        U.text(ctx, String(n), sx + 68, y + 41, { size: 28, bold: true, align: 'center', color: n === 0 ? '#ffb0a0' : CHALK });
        K.tag(ctx, 'inc_' + id, sx + 94, y + 10, 42, 42, '+', { kind: 'dark', size: 24, onTap: function () { Run.setStock(s, id, n + 2); Au.play('chalk'); } });
        if (f.menu && p.menu.length > 1) K.tag(ctx, 'rm_' + id, bx + bw - 54, y + 12, 36, 38, '×', { kind: 'dark', size: 20, onTap: function () { Run.setMenu(s, id, false); Au.play('soldout'); } });
      } else U.text(ctx, '备 ' + n + ' 份', bx + bw - 30, y + 38, { size: 22, align: 'right', color: CHALK });
    });
    var yy = y0 + p.menu.length * rh + 6;
    if (f.stock && yst) K.tag(ctx, 'suggest', bx + 24, yy, 176, 40, '照昨天卖的备', { kind: 'dark', size: 17, onTap: function () { p.menu.forEach(function (id) { Run.setStock(s, id, Run.suggest(s, id)); }); Au.play('chalk'); } });
    var sets = Run.setsOn(s); if (sets.length) U.text(ctx, '搭着卖：' + sets.map(function (id) { return D.byId[id].name + ' ' + K.yuan(Run.price(s, id)); }).join('、'), bx + (f.stock && yst ? 212 : 28), yy + 27, { size: 15, color: CHALK2, maxW: 200 });
    if (f.menu) {
      var rest = Run.menuChoices(s).filter(function (d) { return p.menu.indexOf(d.id) < 0; });
      yy += 52;
      if (rest.length) {
        U.text(ctx, '还能写上去的', bx + 28, yy + 14, { size: 16, color: 'rgba(244,240,224,.7)' });
        var cols = 6, cs = 62, rowsLeft = Math.max(1, Math.floor((by + bh - 18 - (yy + 22)) / (cs + 4)));
        rest.slice(0, cols * rowsLeft).forEach(function (d, i) {
          var cx = bx + 24 + (i % cols) * (cs + 2), cy = yy + 22 + Math.floor(i / cols) * (cs + 4), why = Run.whyNot(s, d.id), isNew = s.today.newDishes.indexOf(d.id) >= 0;
          var st = U.hit('add_' + d.id, cx, cy, cs, cs, { label: '加 ' + d.name, onTap: function () { if (!Run.setMenu(s, d.id, true)) { app.notice(Run.whyNot(s, d.id) || '加不上'); Au.play('wrong'); } else Au.play('chalk'); } });
          ctx.fillStyle = st.hover ? 'rgba(244,240,224,.2)' : 'rgba(244,240,224,.08)'; U.rr(ctx, cx, cy, cs - 2, cs, 8); ctx.fill();
          ctx.save(); if (why) ctx.globalAlpha = 0.45; A.food(ctx, d.id, cx + 6, cy + 1, cs - 16, {}); ctx.restore();
          U.text(ctx, d.name.length > 3 ? d.name.slice(0, 3) : d.name, cx + cs / 2 - 1, cy + cs - 5, { size: 13, align: 'center', color: CHALK });
          ctx.fillStyle = STN_COL[d.st]; ctx.fillRect(cx + 3, cy + 4, 4, 12);
          if (isNew) { ctx.fillStyle = '#d8432f'; ctx.beginPath(); ctx.arc(cx + cs - 10, cy + 9, 6, 0, 7); ctx.fill(); }
        });
      }
    }
    var cx0 = 462, cw = 420, cy0 = 78;
    function card(y, h, title, sub) { K.paper(ctx, cx0, y, cw, h, {}); U.text(ctx, title, cx0 + 20, y + 34, { size: 23, bold: true, color: K.col.ink }); if (sub) U.text(ctx, sub, cx0 + 60, y + 33, { size: 15, color: K.col.mute, maxW: cw - 80 }); }
    function opts(y, list, cur, set) { var w = (cw - 32 - (list.length - 1) * 8) / list.length; list.forEach(function (o, i) { K.tag(ctx, o.id, cx0 + 16 + i * (w + 8), y, w, 54, o.label, { kind: 'paper', selected: cur === o.v, sub: o.sub, size: 19, onTap: function () { set(o.v); Au.play('page'); } }); }); }
    var y = cy0;
    if (f.oil && Run.usesOil(s)) {
      var age = s.oil.age, rate = s.oil.bulk ? C.oil.bulkRate : 1, will = p.oil === 'new' ? 0 : p.oil === 'bulk' ? C.oil.bulkAge : age + (p.oil === 'filter' ? 0.5 : 1) * rate;
      card(y, 128, '油', '用下来今天算第 ' + (Math.round(will * 10) / 10 + 1).toFixed(will % 1 ? 1 : 0) + ' 天' + (will >= 3 ? '：熟得快，窗口窄，会冒烟' : will >= 2 ? '：有点老了' : will < 1 ? '：清亮' : ''));
      var kk = Math.min(1, will / 5); ctx.fillStyle = 'rgb(' + Math.round(236 - 132 * kk) + ',' + Math.round(184 - 120 * kk) + ',' + Math.round(74 - 50 * kk) + ')'; U.rr(ctx, cx0 + cw - 54, y + 12, 34, 34, 6); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2; ctx.stroke();
      var ol = [{ id: 'oil_keep', v: 'keep', label: '接着用', sub: '不花钱' }, { id: 'oil_filter', v: 'filter', label: '滤一滤', sub: K.yuan(C.oil.filter) }, { id: 'oil_new', v: 'new', label: '换新油', sub: K.yuan(C.oil.fresh) }];
      if (s.day >= 8) ol.push({ id: 'oil_bulk', v: 'bulk', label: '散装油', sub: K.yuan(C.oil.bulk) + ' · 老得快' });
      opts(y + 58, ol, p.oil, function (v) { p.oil = v; });
      y += 140;
    }
    if (f.mat) {
      card(y, 128, '料', ['便宜两成，出品差一点', '老秦天不亮送来的', '贵三成，有票可查，出品更香'][p.mat]);
      var ml = [{ id: 'mat0', v: 0, label: '批发冻品', sub: '省' }, { id: 'mat1', v: 1, label: '老秦的鲜货', sub: '平' }];
      if (f.mat2) ml.push({ id: 'mat2', v: 2, label: '有票的好料', sub: '贵' });
      opts(y + 58, ml, p.mat, function (v) { Run.setMat(s, v); });
      y += 140;
    }
    if (f.price) {
      card(y, 128, '价', ['来的人多，每份赚得少', '街坊都认的价', '来的人少些，每份多赚'][p.price]);
      opts(y + 58, [{ id: 'price0', v: 0, label: '薄利', sub: '八五折' }, { id: 'price1', v: 1, label: '公道', sub: '原价' }, { id: 'price2', v: 2, label: '提价', sub: '加两成半' }], p.price, function (v) { p.price = v; });
      y += 140;
    }
    if (f.post) { K.tag(ctx, 'post', cx0, y, cw, 50, p.post ? '进货单：贴在门口了' : '进货单：收在抽屉里', { kind: p.post ? 'teal' : 'paper', size: 20, sub: p.post ? '油第几天、料哪来的，谁都看得见' : '点一下，贴出去', onTap: function () { p.post = !p.post; Au.play('page'); } }); y += 62; }
    var ny = Math.max(y + 4, 300);
    this.notes.forEach(function (n, i) {
      var nyy = ny + i * 62; if (nyy > 640) return;
      ctx.save(); ctx.translate(cx0 + cw / 2, nyy + 27); ctx.rotate((i % 2 ? 1 : -1) * 0.008); ctx.translate(-(cx0 + cw / 2), -(nyy + 27));
      ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.fillRect(cx0 + 3, nyy + 5, cw, 54); ctx.fillStyle = n.col; ctx.fillRect(cx0, nyy, cw, 54);
      var ls = U.wrap(ctx, n.text, cw - 28, 17); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, cx0 + 14, nyy + (ls.length > 1 ? 23 : 33) + j * 22, { size: 17, color: K.col.ink }); });
      ctx.restore();
    });
    var rx = 902, rw = 356, cost = Run.planCost(s), ry = 78;
    K.paper(ctx, rx, ry, rw, 420, { r: 4 });
    U.text(ctx, '进货小票', rx + rw / 2, ry + 40, { size: 24, bold: true, align: 'center', color: K.col.ink });
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rx + 16, ry + 54); ctx.lineTo(rx + rw - 16, ry + 54); ctx.stroke(); ctx.setLineDash([]);
    var ly = ry + 82, lh = cost.lines.length > 5 ? 28 : 32;
    cost.lines.forEach(function (l) { U.text(ctx, D.byId[l.id].name + ' ×' + l.n, rx + 22, ly, { size: 18, color: K.col.ink, maxW: 210 }); U.text(ctx, K.yuan(l.sum), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.ink }); ly += lh; });
    if (cost.oil) { U.text(ctx, p.oil === 'new' ? '新油一锅' : p.oil === 'bulk' ? '散装油' : '滤油', rx + 22, ly, { size: 18, color: K.col.ink }); U.text(ctx, K.yuan(cost.oil), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.ink }); ly += lh; }
    if (cost.pre) { U.text(ctx, '包餐 · ' + cost.preLine.who + ' ' + D.byId[cost.preLine.dish].name + ' ×' + cost.preLine.n, rx + 22, ly, { size: 18, color: K.col.ink, maxW: 240 }); U.text(ctx, K.yuan(cost.pre), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.ink }); ly += lh; }
    if (cost.pantry) { U.text(ctx, '昨天市场收的货抵', rx + 22, ly, { size: 18, color: K.col.teal }); U.text(ctx, '−' + K.yuan(cost.pantry), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.teal }); ly += lh; }
    ctx.strokeStyle = '#a88a5a'; ctx.beginPath(); ctx.moveTo(rx + 16, ly - 14); ctx.lineTo(rx + rw - 16, ly - 14); ctx.stroke();
    U.text(ctx, '合计', rx + 22, ly + 14, { size: 21, bold: true, color: K.col.ink }); U.text(ctx, K.yuan(cost.total), rx + rw - 22, ly + 14, { size: 24, bold: true, align: 'right', color: K.col.red });
    var after = s.cash - cost.total;
    U.text(ctx, '付完手头剩', rx + 22, ly + 46, { size: 17, color: K.col.mute }); U.text(ctx, K.yuan(after), rx + rw - 22, ly + 46, { size: 19, bold: true, align: 'right', color: after < 0 ? K.col.red : K.col.ink });
    var gross = 0; p.menu.forEach(function (id) { gross += (p.stock[id] || 0) * Run.price(s, id); });
    U.text(ctx, '全卖完能收', rx + 22, ly + 74, { size: 17, color: K.col.mute }); U.text(ctx, K.yuan(gross), rx + rw - 22, ly + 74, { size: 19, align: 'right', color: K.col.ink });
    var guess = yst ? Math.round((yst.served + yst.walked + yst.balked) * (s.today.flow || 1)) : (s.day === 2 ? 11 : 12);
    U.text(ctx, (s.today.weather === 'rain' ? '下雨，人会少些。' : '') + '今天大概来 ' + Math.max(4, guess - 2) + '–' + (guess + 3) + ' 位。', rx + rw / 2, ry + 400, { size: 16, align: 'center', color: K.col.mute, maxW: rw - 30 });
    var why = this.canOpen(), hx = rx, hy = 520, hw = rw, hh = 150;
    var st = U.hit('open', hx, hy, hw, hh, { label: '按住拉起卷帘门', disabled: !!why, onDown: function () { self.holding = true; return function (type) { if (type === 'up' || type === 'cancel') self.holding = false; }; } });
    ctx.save(); if (why) ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(30,18,8,.4)'; U.rr(ctx, hx + 3, hy + 7, hw, hh, 14); ctx.fill();
    ctx.fillStyle = '#6f7a80'; U.rr(ctx, hx, hy, hw, hh, 14); ctx.fill(); ctx.strokeStyle = '#3c4448'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); U.rr(ctx, hx, hy, hw, hh, 14); ctx.clip();
    var off = this.hold * hh * 0.9;
    for (var sy = hy - 16 - off; sy < hy + hh; sy += 16) { ctx.fillStyle = '#8c979c'; ctx.fillRect(hx, sy, hw, 5); ctx.fillStyle = '#4c555a'; ctx.fillRect(hx, sy + 13, hw, 3); }
    if (this.hold > 0) { var g = ctx.createLinearGradient(0, hy + hh - off - 30, 0, hy + hh); g.addColorStop(0, 'rgba(255,224,150,0)'); g.addColorStop(0.3, 'rgba(255,224,150,.95)'); g.addColorStop(1, 'rgba(255,236,190,1)'); ctx.fillStyle = g; ctx.fillRect(hx, hy + hh - off - 30, hw, off + 30); }
    ctx.restore();
    U.text(ctx, why || '按住 · 拉起卷帘门', hx + hw / 2, hy + 70 - this.hold * 20, { size: why ? 22 : 28, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(30,24,20,.9)', strokeW: 6 });
    if (!why) U.text(ctx, '开门就不能改了', hx + hw / 2, hy + 104 - this.hold * 20, { size: 16, align: 'center', color: '#e8e0d0', stroke: 'rgba(30,24,20,.8)' });
    ctx.restore();
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); U.rr(ctx, hx - 4, hy - 4, hw + 8, hh + 8, 16); ctx.stroke(); ctx.setLineDash([]); }
  };
  P.key = function (k) { if (k === 'o' && !this.canOpen()) { this.hold = 1; this.holding = true; } };
  P.describe = function () { var s = this.s; return { features: this.f, plan: s.plan, cost: Run.planCost(s).total / 100, canOpen: !this.canOpen(), why: this.canOpen(), notes: this.notes.map(function (n) { return n.text; }), choices: Run.menuChoices(s).map(function (d) { return d.id; }) }; };
  return { Prep: Prep };
});
;
/* ui/s_night.js */
BSX.define('ui/s_night', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var INK = '#3b2a1a', MUTE = '#8d7a60', RED = '#b8432f', BLUE = '#2f4f7a';
  function Night(app) {
    var s = app.state, self = this;
    this.app = app; this.name = 'night'; this.pausable = true; this.s = s; this.t = 0; this.shop = false; this.out = 0;
    Fx.reset(); require('game/stations').silence();
    Shop.reset('night', s.today.weather); Shop.setShutter(1, true); Shop.crowd = 0.05;
    Au.setScene({ place: 'night', rain: s.today.weather === 'rain' ? 0.5 : 0, crowd: 0, dawn: 0, music: 'night' });
    this.rec = s.hist[s.hist.length - 1];
    if (!s.today.night) s.today.night = this.compose();
    this.n = s.today.night;
    Au.play('page');
  }
  var P = Night.prototype;
  P.compose = function () {
    var s = this.s, r = this.rec, h = Cond.read(s), am = Story.ambient, quotes = (r.quotes || []).slice(0, 2).map(function (q) { return { from: q.from, text: q.text }; });
    function rot(list, k) { if (!list.length) return null; return list[(s.day * 7 + k * 3 + s.seed) % list.length]; }
    var cond = (am.quotes || []).filter(function (q) { return q.need && Cond.check(s, q.need, h); }), free = (am.quotes || []).filter(function (q) { return !q.need; }), k = 0;
    while (quotes.length < 3 && (cond.length || free.length)) { var src = cond.length ? cond : free, q = rot(src, k++); src.splice(src.indexOf(q), 1); if (!quotes.some(function (x) { return x.text === q.text; })) quotes.push({ from: q.from || '街坊', text: q.text }); }
    var zc = (am.zhou || []).filter(function (z) { return z.need && Cond.check(s, z.need, h); }), zf = (am.zhou || []).filter(function (z) { return !z.need; }), z = rot(zc.length ? zc : zf, 1);
    var left = []; for (var id in r.left) left.push(r.left[id] + ' 份' + D.byId[id].name);
    var net = r.net, stamp = r.closed ? '停业' : net <= 0 ? '白忙一天' : r.q >= 0.88 && r.walked + r.balked === 0 ? '手艺好' : r.walked + r.balked >= 4 ? '忙不过来' : '没白忙';
    var pill = s.burn >= 85 ? 2 : s.burn >= 60 ? 1 : s.burn >= 30 ? 0 : -1;
    return { quotes: quotes, zhou: z ? z.text : '', left: left.slice(0, 4), stamp: stamp, pill: pill >= 0 && am.pills ? am.pills[pill] : '', later: (s.today.notes || []).filter(function (n) { return n.kind === 'later'; }).map(function (n) { return n.text; }) };
  };
  P.update = function (dt) {
    this.t += dt;
    if (this.out > 0) { this.out += dt; if (this.out > 0.7 && !this.gone) { this.gone = true; this.sleep(); } }
  };
  P.sleep = function () {
    var s = this.s, app = this.app;
    Run.nextDay(s);
    if (s.phase === 'ended') app.endRun();
    app.save(); app.route(true);
  };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, r = this.rec, n = this.n, t = this.t;
    Shop.drawBack(ctx, s, { curtain: !!s.flags.man_curtain }); Shop.drawCounter(ctx); Shop.drawLight(ctx); Shop.drawShutter(ctx);
    K.dim(ctx, 0.2 + Math.min(0.7, this.out * 1.2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 640, 330, 620, '255,196,120', (0.2 * (1 - Math.min(1, this.out * 1.6))).toFixed(2)); ctx.restore();
    K.dayChip(ctx, s, 14, 12, t);
    U.text(ctx, '夜里 · 算账', 198, 48, { size: 26, bold: true, color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' });
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    K.tin(ctx, 1010, 34, s.cash, 0);
    var x = 132, y = 78, w = 1016, h = 560, mid = x + w / 2, k = Fx.ease.out3(Math.min(1, t * 2.2));
    ctx.save(); ctx.translate(0, (1 - k) * 40); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(20,12,6,.45)'; U.rr(ctx, x - 6, y + 10, w + 20, h + 6, 10); ctx.fill();
    ctx.fillStyle = '#2f6f66'; U.rr(ctx, x - 12, y - 8, w + 24, h + 18, 10); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w / 2 - 4, h, 6); ctx.fill(); U.rr(ctx, mid + 4, y, w / 2 - 4, h, 6); ctx.fill();
    var g = ctx.createLinearGradient(mid - 40, 0, mid + 40, 0); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(0.5, 'rgba(90,60,30,.28)'); g.addColorStop(1, 'rgba(90,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(mid - 40, y, 80, h);
    ctx.strokeStyle = 'rgba(120,150,170,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var ly = y + 96; ly < y + h - 14; ly += 38) { ctx.moveTo(x + 22, ly); ctx.lineTo(mid - 26, ly); ctx.moveTo(mid + 26, ly); ctx.lineTo(x + w - 22, ly); } ctx.stroke();
    ctx.strokeStyle = 'rgba(200,90,70,.45)'; ctx.beginPath(); ctx.moveTo(x + 64, y + 10); ctx.lineTo(x + 64, y + h - 10); ctx.stroke();
    var lx = x + 78, rx2 = mid - 34, yy = y + 52;
    U.text(ctx, '第 ' + s.day + ' 天', lx, yy, { size: 30, bold: true, color: INK });
    U.text(ctx, K.weatherName[r.weather] + ' · ' + (r.closed ? '停业' : '来了 ' + (r.served + r.walked + r.balked + r.soldout) + ' 位'), rx2, yy, { size: 18, align: 'right', color: MUTE });
    yy += 38;
    function row(label, val, col, big) { U.text(ctx, label, lx, yy + 26, { size: big ? 24 : 20, bold: !!big, color: INK, maxW: 250 }); U.text(ctx, val, rx2, yy + 26, { size: big ? 30 : 21, bold: true, align: 'right', color: col || INK }); yy += 38; }
    if (!r.closed) { row('卖出 ' + r.served + ' 位', '+' + K.yuan(r.rev), BLUE); if (r.tips) row('小费', '+' + K.yuan(r.tips), BLUE); row('进货', '−' + K.yuan(r.goods).slice(0)); if (r.oil) row('油', '−' + K.yuan(r.oil)); }
    row(s.helper ? '水电煤、桂芬的工钱' : '水电煤', '−' + K.yuan(r.fixed));
    if (r.credit) row('记在账上（没收到）', K.yuan(r.credit), MUTE);
    if (r.bought && r.bought.length) row('添置', '−' + K.yuan(r.bought.reduce(function (a, id) { return a + Cast.upgrades.filter(function (u) { return u.id === id; })[0].cost; }, 0)));
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, yy + 4); ctx.lineTo(rx2, yy + 4); ctx.stroke(); yy += 6;
    row('今天净赚', (r.net >= 0 ? '+' : '−') + K.yuan(Math.abs(r.net)), r.net >= 0 ? BLUE : RED, true);
    if (Run.rentDue(s)) { row('今晚交房租', '−' + K.yuan(C.rentWeekly), RED); row('交完手头', K.yuan(s.cash - C.rentWeekly), s.cash - C.rentWeekly < 0 ? RED : INK); }
    if (t > 0.9) K.stamp(ctx, lx + 96, Math.min(yy + 64, y + h - 110), n.stamp, n.stamp === '白忙一天' || n.stamp === '忙不过来' ? '#8d7a60' : RED, -0.12, 28);
    if (s.flags.ge_books && !r.closed) { var items = Object.keys(r.sold).sort(function (a, b) { return r.sold[b] - r.sold[a]; }).slice(0, 4), txt = items.map(function (id) { return D.byId[id].name + r.sold[id]; }).join(' · '); U.text(ctx, '细账（老葛的字）：' + txt, lx, y + h - 60, { size: 15, color: BLUE, maxW: rx2 - lx }); }
    if (n.zhou) U.para(ctx, n.zhou, lx, y + h - 30, rx2 - lx, { size: 17, color: MUTE });
    var px = mid + 36, pr = x + w - 30; yy = y + 52;
    U.text(ctx, '街坊的话', px, yy, { size: 24, bold: true, color: INK }); yy += 22;
    n.quotes.forEach(function (q) { var ls = U.wrap(ctx, '"' + q.text + '"', pr - px - 10, 19); ls.slice(0, 2).forEach(function (l, i) { U.text(ctx, l, px, yy + 26 + i * 26, { size: 19, color: INK }); }); yy += ls.length > 1 ? 54 : 30; U.text(ctx, '—— ' + q.from, pr, yy + 16, { size: 15, align: 'right', color: MUTE }); yy += 30; });
    yy = Math.max(yy + 6, y + 268);
    U.text(ctx, '剩下的', px, yy, { size: 21, bold: true, color: INK });
    U.text(ctx, n.left.length ? n.left.join('、') + (s.flags.e_leftover_give ? '。留给巷口的老两口了。' : '。') : r.closed ? '今天没开火。' : '都卖完了。', px + 76, yy, { size: 17, color: MUTE, maxW: pr - px - 80 });
    yy += 40;
    U.text(ctx, '惦记着', px, yy, { size: 21, bold: true, color: INK }); yy += 10;
    var todo = [];
    if (!s.depositPaid && s.day >= 7 && s.day <= 26) todo.push({ text: '续租押金 ' + K.yuan(s.deposit) + '，第 26 天给话', bar: Math.max(0, s.cash) / s.deposit });
    var toRent = s.day % 7 === 0 ? 0 : 7 - (s.day % 7); if (s.day < 28 && s.day + toRent < 28 && toRent > 0 && toRent <= 3) todo.push({ text: '再过 ' + toRent + ' 天交房租 ' + K.yuan(C.rentWeekly) });
    var cr = 0; for (var id2 in s.credit) cr += s.credit[id2]; if (cr > 0) todo.push({ text: '老葛赊着 ' + K.yuan(cr) });
    if (s.owe) todo.push({ text: '欠小满 ' + K.yuan(s.owe) + '，月底还' });
    if (n.pill) todo.push({ text: n.pill });
    n.later.forEach(function (l) { todo.push({ text: l }); });
    if (s.closeNext) todo.push({ text: '明天停业整改一天' });
    if (!todo.length) todo.push({ text: s.day >= s.days ? '明天，没有明天的进货单了。' : '明天还是五点半。' });
    todo.slice(0, 5).forEach(function (td) { U.text(ctx, '· ' + td.text, px, yy + 26, { size: 17, color: INK, maxW: pr - px }); yy += 30; if (td.bar != null) { ctx.fillStyle = 'rgba(60,40,20,.15)'; U.rr(ctx, px + 14, yy + 2, 260, 10, 5); ctx.fill(); ctx.fillStyle = td.bar >= 1 ? '#5a9a56' : '#e0a030'; U.rr(ctx, px + 14, yy + 2, 260 * Math.min(1, td.bar), 10, 5); ctx.fill(); yy += 18; } });
    ctx.restore();
    if (this.out > 0) return;
    var f = Run.features(s), by = 652;
    if (f.upgrades) { var can = Cast.upgrades.some(function (u) { return Run.canBuy(s, u.id); }); K.tag(ctx, 'upg', 132, by, 190, 56, '添置', { kind: 'wood', sub: can ? '有买得起的' : '旧货单', onTap: function () { self.shop = true; Au.play('page'); } }); }
    K.tag(ctx, 'book', 334, by, 170, 56, '小本子', { kind: 'wood', onTap: function () { app.openOverlay(require('ui/s_book').Book, {}); } });
    K.tag(ctx, 'sleep', 868, by, 280, 56, s.day >= s.days ? '熄灯' : '熄灯 · 明天见', { kind: 'teal', size: 25, onTap: function () { if (self.out > 0) return; self.out = 0.01; Au.play('switch'); Au.setScene({ music: null }); } });
    if (this.shop) this.drawShop(ctx);
  };
  P.drawShop = function (ctx) {
    var s = this.s, self = this, list = Cast.upgrades.filter(function (u) { return s.day >= u.day || s.upg[u.id]; });
    K.dim(ctx, 0.5); U.hit('upg_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 300, y = 70, w = 680, h = 80 + Math.max(1, list.length) * 68 + 76;
    K.paper(ctx, x, y, w, h, { pin: K.col.teal });
    U.text(ctx, '旧货单', x + 30, y + 54, { size: 30, bold: true, color: INK });
    U.text(ctx, '手头 ' + K.yuan(s.cash) + (s.depositPaid || s.day > 26 ? '' : ' · 押金要留 ' + K.yuan(s.deposit)), x + w - 30, y + 52, { size: 18, align: 'right', color: MUTE });
    if (!list.length) U.text(ctx, '收旧货的还没来过。', x + w / 2, y + 120, { size: 20, align: 'center', color: MUTE });
    list.forEach(function (u, i) {
      var yy = y + 78 + i * 68, has = !!s.upg[u.id], ok = Run.canBuy(s, u.id);
      ctx.strokeStyle = 'rgba(120,90,50,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 24, yy + 64); ctx.lineTo(x + w - 24, yy + 64); ctx.stroke();
      U.text(ctx, u.name, x + 30, yy + 30, { size: 23, bold: true, color: has ? MUTE : INK }); U.text(ctx, u.text, x + 30, yy + 54, { size: 16, color: MUTE, maxW: w - 220 });
      if (has) K.stamp(ctx, x + w - 96, yy + 34, '已添', RED, -0.1, 20);
      else K.tag(ctx, 'buy_' + u.id, x + w - 170, yy + 8, 140, 48, K.yuan(u.cost), { kind: ok ? 'teal' : 'paper', size: 21, disabled: !ok, onTap: function () { if (Run.buy(s, u.id)) { Au.play('coins'); Au.play('stamp'); self.app.save(); } } });
    });
    K.tag(ctx, 'upg_close', x + w / 2 - 110, y + h - 66, 220, 50, '合上', { kind: 'wood', onTap: function () { self.shop = false; } });
  };
  P.describe = function () { var r = this.rec; return { day: this.s.day, net: r.net / 100, rev: r.rev / 100, served: r.served, stamp: this.n.stamp, quotes: this.n.quotes, zhou: this.n.zhou, shop: this.shop, canBuy: Cast.upgrades.filter(function (u) { return Run.canBuy(this.s, u.id); }, this).map(function (u) { return u.id; }) }; };
  return { Night: Night };
});
;
/* ui/s_ending.js */
BSX.define('ui/s_ending', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var SIGN = require('ui/s_title').SIGN;
  var Basic = require('ui/s_basic');
  var INK = '#3b2a1a', MUTE = '#8d7a60';
  var MOOD = { E_HONEST: [255, 246, 226], E_CANTEEN: [255, 240, 214], E_PRIVATE: [250, 226, 196], E_REOPEN: [246, 240, 230], E_SOMEONE: [240, 232, 222], E_PILLS: [170, 176, 190], E_FAREWELL: [236, 196, 170], E_TRANSFER: [150, 160, 196] };
  function Ending(app) {
    var s = app.state;
    this.app = app; this.name = 'ending'; this.s = s; this.t = 0; this.stage = 0; this.st = 0; this.n = 0;
    this.end = Story.endings[s.ending] || Story.endings.E_SOMEONE; this.epi = Run.epilogue(s); this.m = Run.stats(s);
    this.sign = this.end.sign || ''; this.written = 0;
    var from = this.end.letter && this.end.letter.from; this.from = from === 'best' || !from ? Run.best(s) : from;
    Fx.reset(); require('game/stations').silence();
    Au.setScene({ place: 'street', rain: 0, crowd: 0, dawn: 1, music: 'ending' });
    this.stages = ['sign', 'text', 'echo', 'people', 'thesis', 'letter'].filter(function (k) { return k !== 'echo' || this.epi.echoes.length; }, this).filter(function (k) { return k !== 'people' || this.epi.people.length; }, this);
  }
  var P = Ending.prototype;
  P.cur = function () { return this.stages[this.stage]; };
  P.update = function (dt) {
    this.t += dt; this.st += dt;
    if (this.cur() === 'sign' && this.st > 1.2 && this.written < this.sign.length) { var w = Math.min(this.sign.length, Math.floor((this.st - 1.2) / 0.42) + 1); if (w !== this.written) { this.written = w; Au.play('chalk'); } }
  };
  P.advance = function () {
    var c = this.cur();
    if (c === 'sign' && this.st < 1.2 + this.sign.length * 0.42 + 0.6) return;
    if (c === 'text' && this.n < this.end.text.length - 1) { this.n++; this.st = 0; Au.play('page'); return; }
    if (c === 'letter') return;
    if (this.st < 0.5) return;
    this.stage++; this.st = 0; this.n = 0; Au.play('page');
  };
  P.pointer = function (type) { if (type === 'down') this.advance(); return null; };
  P.key = function (k) { if (k === ' ' || k === 'Enter') this.advance(); };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, e = this.end, c = this.cur(), t = this.t;
    var bg = A.img('bg_title') || A.img('bg_ext_morning'); if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; }
    if (this.sign) { ctx.save(); ctx.globalAlpha = 0.86; var shown = c === 'sign' ? this.sign.slice(0, this.written) : this.sign; ctx.font = U.font(50, 'bold', true); var full = Math.min(SIGN.w, ctx.measureText(this.sign).width), sx = SIGN.x - full / 2; ctx.textAlign = 'left'; ctx.fillStyle = '#4a2c14'; ctx.fillText(shown, sx, SIGN.y + 18, SIGN.w); ctx.restore(); }
    var m = MOOD[s.ending] || MOOD.E_SOMEONE, k0 = Math.min(1, t / 1.4);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(' + m.map(function (v) { return Math.round(v * (0.35 + 0.65 * k0)); }).join(',') + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    if (s.ending === 'E_TRANSFER' || s.ending === 'E_FAREWELL') { // 灯灭了，店里没人
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(58,56,70)'; ctx.fillRect(214, 262, 534, 270); ctx.restore();
      if (s.ending === 'E_TRANSFER') { ctx.save(); ctx.translate(520, 330); ctx.rotate(-0.04); ctx.fillStyle = '#fbf5e4'; ctx.fillRect(-70, -44, 140, 88); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 4; ctx.strokeRect(-70, -44, 140, 88); U.text(ctx, '旺铺转让', 0, 12, { size: 30, bold: true, align: 'center', color: '#b8432f' }); ctx.restore(); }
    } else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 520, 340, 260, '255,196,110', '0.3'); ctx.restore(); if (!Fx.lowFx && Math.random() < 0.2) Fx.burst(318 + Math.random() * 60, 350, 'steam', 1, 8); Fx.drawParts(ctx); }
    var g = ctx.createLinearGradient(0, 470, 0, 720); g.addColorStop(0, 'rgba(18,13,9,0)'); g.addColorStop(1, 'rgba(18,13,9,.82)'); ctx.fillStyle = g; ctx.fillRect(0, 470, 1280, 250);
    var ready = c !== 'sign' || this.st > 1.2 + this.sign.length * 0.42 + 0.3;
    if (ready) { ctx.save(); ctx.globalAlpha = c === 'sign' ? Math.min(1, (this.st - 1.2 - this.sign.length * 0.42 - 0.3) * 2) : 1; U.text(ctx, '第 ' + s.gen + ' 个月 · 结局', 62, 606, { size: 20, color: '#e8d8b8', stroke: 'rgba(20,14,8,.7)' }); U.text(ctx, e.title, 60, 664, { size: 50, bold: true, color: '#fff3d6', stroke: 'rgba(40,22,8,.92)', strokeW: 9, maxW: 640 }); if (e.mood) U.text(ctx, e.mood, 62, 700, { size: 21, color: '#f0e2c4', stroke: 'rgba(20,14,8,.7)', maxW: 640 }); ctx.restore(); }
    var px = 716, py = 96, pw = 524, ph = 500, k = Fx.ease.out3(Math.min(1, this.st * 3));
    function panel(title) { ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 24); K.paper(ctx, px, py, pw, ph, { pin: K.col.red }); U.text(ctx, title, px + 30, py + 58, { size: 27, bold: true, color: INK }); }
    if (c === 'text') {
      panel('后来');
      var yy = py + 96; e.text.slice(0, this.n + 1).forEach(function (para, i) { ctx.save(); if (i === self.n) ctx.globalAlpha *= Math.min(1, self.st * 2.5); yy += U.para(ctx, para, px + 30, yy, pw - 60, { size: 21, lh: 33, color: INK }) + 18; ctx.restore(); });
      ctx.restore();
    } else if (c === 'echo') {
      panel('这个月，你');
      var y2 = py + 100; this.epi.echoes.forEach(function (tx, i) { var a = Math.max(0, Math.min(1, (self.st - 0.3 - i * 0.7) * 2)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.col.red; ctx.beginPath(); ctx.arc(px + 38, y2 - 6, 5, 0, 7); ctx.fill(); y2 += U.para(ctx, tx, px + 56, y2, pw - 90, { size: 20, lh: 31, color: INK }) + 20; ctx.restore(); });
      ctx.restore();
    } else if (c === 'people') {
      panel('街坊');
      this.epi.people.slice(0, 4).forEach(function (p, i) { var y3 = py + 84 + i * 102, a = Math.max(0, Math.min(1, (self.st - 0.2 - i * 0.5) * 2)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#f2e8d0'; U.rr(ctx, px + 24, y3, 76, 76, 8); ctx.fill(); People.portrait(ctx, p.id, px + 26, y3 + 2, 72); U.text(ctx, Story.regs[p.id].name, px + 114, y3 + 22, { size: 19, bold: true, color: INK }); U.para(ctx, p.text, px + 114, y3 + 48, pw - 144, { size: 17, lh: 25, color: INK }); ctx.restore(); });
      ctx.restore();
    } else if (c === 'thesis') {
      var zh = s.reg.zheng.met; panel(zh ? '附录 · 小郑的论文' : '账本最后一页');
      if (zh) U.text(ctx, '《一家早餐店的诚实成本》表 3', px + pw - 30, py + 56, { size: 15, align: 'right', color: MUTE });
      var st = s.stats, rows = [['营业', s.hist.filter(function (h) { return !h.closed; }).length + ' 天'], ['端出去', st.served + ' 位客人'], ['等走了', (st.walked + st.balked) + ' 位'], ['换油', st.oilChanges + ' 回' + (st.oldOilDays ? '，老油用了 ' + st.oldOilDays + ' 天' : '')], ['进货单贴了', st.slipDays + ' 天'], ['记得"老样子"', st.remembered + ' 回'], ['接过的话', st.chats + ' 回'], ['多给的钱', '还了 ' + st.returned + ' 回' + (st.kept ? '，收了 ' + st.kept + ' 回' : '')], ['墙上留下', s.mementos.length + ' 样东西'], ['零钱盒里', K.yuan(s.cash)]];
      rows.forEach(function (r, i) { var y4 = py + 100 + i * 38; ctx.strokeStyle = 'rgba(120,90,50,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 30, y4 + 10); ctx.lineTo(px + pw - 30, y4 + 10); ctx.stroke(); U.text(ctx, r[0], px + 34, y4, { size: 19, color: MUTE }); U.text(ctx, r[1], px + pw - 34, y4, { size: 20, bold: true, align: 'right', color: INK, maxW: pw - 200 }); });
      ctx.restore();
    } else if (c === 'letter') {
      panel('一张字条');
      var who = Story.regs[this.from] ? Story.regs[this.from].name : '街坊';
      U.para(ctx, (e.letter && e.letter.text) || '明天还开吧？', px + 34, py + 110, pw - 68, { size: 24, lh: 38, color: INK });
      U.text(ctx, '—— ' + who, px + pw - 34, py + 250, { size: 20, align: 'right', color: MUTE });
      if (Story.regs[this.from]) { ctx.fillStyle = '#f2e8d0'; U.rr(ctx, px + 34, py + 206, 66, 66, 8); ctx.fill(); People.portrait(ctx, this.from, px + 36, py + 208, 62); }
      if (e.last && this.st > 1) U.text(ctx, e.last, px + pw / 2, py + 326, { size: 22, bold: true, align: 'center', color: K.col.teal, alpha: Math.min(1, (this.st - 1) * 1.5) });
      ctx.restore();
      if (this.st > 1.2) {
        K.tag(ctx, 'again', px + 30, py + ph - 96, pw - 60 - 170, 62, '再开一个月', { kind: 'teal', sub: '带一件旧物，街坊还认得你', onTap: function () { app.state = null; app.store.clearRun(); app.go(Basic.Title, {}, true); } });
        K.tag(ctx, 'home', px + pw - 190, py + ph - 96, 160, 62, '回到门口', { kind: 'wood', size: 20, onTap: function () { app.state = null; app.store.clearRun(); app.go(Basic.Title, {}, true); } });
      }
    }
    if (c !== 'letter' && ready && this.st > 0.8) U.text(ctx, '点一下，往下看', 1240, 690, { size: 17, align: 'right', color: '#f0e2c4', alpha: 0.5 + Math.sin(t * 4) * 0.3, stroke: 'rgba(20,14,8,.7)' });
  };
  P.describe = function () { return { ending: this.s.ending, title: this.end.title, sign: this.sign, stage: this.cur(), echoes: this.epi.echoes, people: this.epi.people.map(function (p) { return p.id; }) }; };
  return { Ending: Ending };
});
;
/* ui/s_book.js */
BSX.define('ui/s_book', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var INK = '#3b2a1a', MUTE = '#8d7a60', TABS = ['街坊', '菜谱', '留下的', '回看'];
  function Book(app, p) {
    this.app = app; this.name = 'book'; this.t = 0; this.tab = p.tab || 0; this.legacy = !!p.legacy || !app.state; this.s = this.legacy ? null : app.state;
    this.sel = 0; this.dish = 0; this.page = -1;
    if (this.s) { var met = Cast.regIds.filter(function (id) { return app.state.reg[id].met; }); if (met.length) this.sel = Cast.regIds.indexOf(met[met.length - 1]); }
  }
  var P = Book.prototype;
  P.update = function (dt) { this.t += dt; };
  P.key = function (k) { if (k === 'ArrowRight') this.tab = (this.tab + 1) % 4; if (k === 'ArrowLeft') this.tab = (this.tab + 3) % 4; };
  P.draw = function (ctx) {
    var app = this.app, self = this, k = Fx.ease.out3(Math.min(1, this.t * 5));
    K.dim(ctx, 0.6 * k); U.hit('book_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 110, y = 60 + (1 - k) * 30, w = 1060, h = 610;
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(20,12,6,.45)'; U.rr(ctx, x - 4, y + 10, w + 16, h + 4, 10); ctx.fill();
    ctx.fillStyle = '#8a5a2c'; U.rr(ctx, x - 10, y - 8, w + 20, h + 16, 12); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w, h, 6); ctx.fill();
    TABS.forEach(function (name, i) { K.tag(ctx, 'tab' + i, x + 24 + i * 138, y - 34, 128, 46, name, { kind: self.tab === i ? 'paper' : 'wood', size: 20, onTap: function () { self.tab = i; self.page = -1; Au.play('page'); } }); });
    K.iconBtn(ctx, 'book_close', x + w - 60, y - 34, 46, 'close', function () { app.closeOverlay(); }, { label: '合上' });
    ctx.fillStyle = '#fbf5e4'; ctx.fillRect(x + 4, y + 2, w - 8, 14);
    [this.drawPeople, this.drawDishes, this.drawKept, this.drawLog][this.tab].call(this, ctx, x + 30, y + 30, w - 60, h - 56);
    ctx.restore();
  };
  P.drawPeople = function (ctx, x, y, w, h) {
    var s = this.s, L = this.app.legacy, self = this;
    Cast.regIds.forEach(function (id, i) {
      var met = s ? s.reg[id].met : Object.keys(L.facts || {}).some(function (kf) { return kf.indexOf(id + '/') === 0; }) || L.runs > 0;
      var cx = x + (i % 2) * 112, cy = y + Math.floor(i / 2) * 132, sel = self.sel === i;
      var st = U.hit('reg' + i, cx, cy, 100, 120, { label: Story.regs[id].name, onTap: function () { self.sel = i; Au.play('page'); } });
      ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : '#f2e8d0'; U.rr(ctx, cx, cy, 100, 120, 8); ctx.fill(); ctx.strokeStyle = sel ? '#8a6a1a' : '#c8b48a'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
      if (met) { People.portrait(ctx, id, cx + 10, cy + 8, 80); U.text(ctx, Story.regs[id].name, cx + 50, cy + 110, { size: 16, bold: true, align: 'center', color: INK }); }
      else { U.text(ctx, '？', cx + 50, cy + 66, { size: 44, bold: true, align: 'center', color: '#c8b48a' }); U.text(ctx, '还没来过', cx + 50, cy + 110, { size: 14, align: 'center', color: MUTE }); }
    });
    var id = Cast.regIds[this.sel], r = Story.regs[id], rs = s ? s.reg[id] : null, px = x + 250, pw = w - 250;
    ctx.strokeStyle = 'rgba(120,90,50,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 16, y); ctx.lineTo(px - 16, y + h); ctx.stroke();
    var met = rs ? rs.met : this.app.legacy.runs > 0;
    if (!met) { U.text(ctx, '这一页还空着。', px, y + 60, { size: 24, color: MUTE }); return; }
    U.text(ctx, r.full, px, y + 36, { size: 30, bold: true, color: INK });
    if (rs) U.text(ctx, '第 ' + rs.met + ' 天头一回来 · 来过 ' + rs.visits + ' 趟', px + pw, y + 34, { size: 16, align: 'right', color: MUTE });
    U.text(ctx, r.firstNote, px, y + 70, { size: 19, color: INK, maxW: pw });
    var yy = y + 104;
    if (rs) {
      U.text(ctx, '熟不熟', px, yy + 18, { size: 17, color: MUTE });
      for (var i = 0; i < 10; i++) { ctx.fillStyle = i < Math.floor(rs.aff + 0.001) ? '#e06060' : i < rs.aff ? '#f0b0a8' : 'rgba(120,90,50,.18)'; Fx.heart(ctx, px + 86 + i * 26, yy + 12, 8); }
      yy += 40;
      U.text(ctx, '老样子', px, yy + 22, { size: 17, color: MUTE });
      if (rs.usual) { var items = Run.expand(r.usual); items.forEach(function (it, j) { A.food(ctx, it.d, px + 78 + j * 54, yy - 6, 46, {}); if (it.mod) { ctx.fillStyle = it.mod === '嫩' ? '#f0c860' : it.mod === '老' ? '#b86a2a' : '#7fb0c8'; ctx.beginPath(); ctx.arc(px + 78 + j * 54 + 40, yy + 30, 11, 0, 7); ctx.fill(); U.text(ctx, it.mod, px + 78 + j * 54 + 40, yy + 35, { size: 14, bold: true, align: 'center', color: it.mod === '嫩' ? INK : '#fff8e8' }); } }); }
      else U.text(ctx, rs.visits >= 2 ? '他说"老样子"的时候，你得自己记得。' : '还不知道。', px + 78, yy + 22, { size: 17, color: INK });
      yy += 56;
    }
    U.text(ctx, '记下的事', px, yy + 18, { size: 17, color: MUTE }); yy += 30;
    var keys = Object.keys(r.factText), L2 = this.app.legacy.facts || {}, shown = 0;
    keys.forEach(function (fk) {
      var known = rs ? rs.facts.indexOf(fk) >= 0 : !!L2[id + '/' + fk]; if (!known || yy > y + h - 30) return; shown++;
      var ls = U.wrap(ctx, '· ' + r.factText[fk], pw - 10, 18); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, px, yy + 18 + j * 25, { size: 18, color: INK }); }); yy += ls.length > 1 ? 54 : 30;
    });
    if (!shown) U.text(ctx, '还没什么可写的。多打几回照面再说。', px, yy + 18, { size: 18, color: MUTE });
    var remain = keys.length - shown; if (remain > 0 && shown) U.text(ctx, '（这一页后面还空着 ' + remain + ' 行）', px, Math.min(yy + 22, y + h - 8), { size: 14, color: MUTE });
  };
  P.drawDishes = function (ctx, x, y, w, h) {
    var s = this.s, self = this, L = this.app.legacy;
    D.list.forEach(function (d, i) {
      var cx = x + (i % 5) * 96, cy = y + Math.floor(i / 5) * 104, known = s ? !!s.unlocked[d.id] : L.runs > 0, sel = self.dish === i;
      var st = U.hit('dish' + i, cx, cy, 88, 96, { label: known ? d.name : '没学会的菜', onTap: function () { self.dish = i; Au.play('page'); } });
      ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : '#f2e8d0'; U.rr(ctx, cx, cy, 88, 96, 8); ctx.fill(); ctx.strokeStyle = sel ? '#8a6a1a' : '#c8b48a'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
      if (known) { A.food(ctx, d.id, cx + 14, cy + 4, 60, {}); U.text(ctx, d.name, cx + 44, cy + 86, { size: 14, bold: true, align: 'center', color: INK, maxW: 82 }); }
      else U.text(ctx, '？', cx + 44, cy + 62, { size: 38, bold: true, align: 'center', color: '#c8b48a' });
    });
    var d = D.list[this.dish], known = s ? !!s.unlocked[d.id] : L.runs > 0, px = x + 500, pw = w - 500;
    ctx.strokeStyle = 'rgba(120,90,50,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 16, y); ctx.lineTo(px - 16, y + h); ctx.stroke();
    if (!known) { U.text(ctx, '还没学会。', px, y + 50, { size: 26, bold: true, color: MUTE }); U.text(ctx, d.day <= 28 ? '日子到了，或者有人教。' : '', px, y + 86, { size: 18, color: MUTE }); return; }
    A.food(ctx, d.id, px, y, 110, {});
    U.text(ctx, d.name, px + 124, y + 44, { size: 30, bold: true, color: INK });
    U.text(ctx, d.set ? '搭着卖' : D.stations[d.st].name, px + 124, y + 76, { size: 18, color: MUTE });
    var yy = y + 126;
    if (s) { U.text(ctx, '今天卖 ' + K.yuan(Run.price(s, d.id)) + (d.set ? '' : ' · 一份本钱 ' + K.yuan(Run.unitCost(s, d.id))), px, yy, { size: 19, color: INK }); yy += 34; U.text(ctx, '做过 ' + (s.stats.cooked[d.id] || 0) + ' 份 · 卖出 ' + (s.stats.sold[d.id] || 0) + ' 份', px, yy, { size: 19, color: INK }); yy += 40; }
    d.tags.forEach(function (tg, i) { ctx.fillStyle = '#e8dcc0'; U.rr(ctx, px + i * 74, yy - 22, 66, 30, 15); ctx.fill(); U.text(ctx, tg, px + i * 74 + 33, yy - 1, { size: 16, align: 'center', color: INK }); });
    yy += 34;
    if (d.cook) { U.text(ctx, '火候：下锅约 ' + Math.round(d.cook.t * 0.78) + ' 秒到正好' + (d.cook.flips ? '，中途' + (d.cook.verb || '翻面') + ' ' + d.cook.flips + ' 回。' : '。'), px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; if (d.pref) { U.text(ctx, '有人要嫩的（早点出锅），有人要老的（多等一口气）。', px, yy, { size: 17, color: MUTE, maxW: pw }); yy += 30; } }
    else if (d.st === 'pot') { U.text(ctx, '一锅一锅熬。记得搅，糊了底整锅都带苦味。', px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; }
    else if (d.st === 'soy') { U.text(ctx, '按住接，到刻线松手。满过头就溢。', px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; }
    if (d.temp) { U.text(ctx, '有人会说"晾一下再装"——先放出餐台上搁一会儿。', px, yy, { size: 17, color: MUTE, maxW: pw }); yy += 30; }
    if (s && !d.set) {
      var st = D.stations[d.st], lv = Run.skillLv(s, d.st), n = s.stats.st[d.st] || 0, next = C.skill[lv];
      yy += 12; U.text(ctx, st.name + ' · 手熟 ' + ['生手', '顺手', '老手', '闭着眼'][lv], px, yy, { size: 20, bold: true, color: INK }); yy += 14;
      ctx.fillStyle = 'rgba(60,40,20,.15)'; U.rr(ctx, px, yy, 300, 10, 5); ctx.fill(); ctx.fillStyle = '#2f6f66'; U.rr(ctx, px, yy, 300 * (next ? Math.min(1, n / next) : 1), 10, 5); ctx.fill(); yy += 34;
      U.text(ctx, lv >= 2 ? '窍门「' + st.skill[0] + '」：' + st.skill[1] + '。' : '再做 ' + Math.max(0, C.skill[1] - n) + ' 份，会摸出一个窍门。', px, yy, { size: 17, color: lv >= 2 ? INK : MUTE, maxW: pw });
    }
  };
  P.drawKept = function (ctx, x, y, w, h) {
    var s = this.s, L = this.app.legacy, list = s ? s.mementos : Object.keys(L.mementos || {}).map(function (id) { return { id: id }; });
    if (!list.length) { U.text(ctx, '墙上还空着。', x + w / 2, y + 120, { size: 26, align: 'center', color: MUTE }); U.text(ctx, '有人会落下东西，有人会送来东西。', x + w / 2, y + 160, { size: 18, align: 'center', color: MUTE }); return; }
    list.slice(0, 18).forEach(function (m, i) {
      var def = Story.memento(m.id), cx = x + (i % 3) * (w / 3), cy = y + Math.floor(i / 3) * 92;
      ctx.fillStyle = '#f2e8d0'; U.rr(ctx, cx, cy, w / 3 - 12, 82, 8); ctx.fill(); ctx.strokeStyle = '#c8b48a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx + 40, cy + (def.kind === 'photo' || def.kind === 'note' || def.kind === 'paper' || def.kind === 'drawing' ? 42 : 62)); ctx.scale(1.35, 1.35); Shop.drawMemento(ctx, def.kind, 0, 0, i + 3); ctx.restore();
      U.text(ctx, def.name, cx + 82, cy + 30, { size: 19, bold: true, color: INK, maxW: w / 3 - 100 });
      var ls = U.wrap(ctx, def.text || '', w / 3 - 104, 14); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, cx + 82, cy + 52 + j * 19, { size: 14, color: MUTE }); });
      if (m.day) U.text(ctx, '第' + m.day + '天', cx + w / 3 - 22, cy + 22, { size: 12, align: 'right', color: MUTE });
    });
    if (L.signs && L.signs.length && !s) U.text(ctx, '招牌上写过的字：' + L.signs.map(function (g) { return g.sign || '（空着）'; }).join(' · '), x, y + h - 6, { size: 16, color: MUTE, maxW: w });
  };
  P.drawLog = function (ctx, x, y, w, h) {
    var s = this.s, self = this;
    if (!s || !s.log.length) { U.text(ctx, s ? '还没说过什么。' : '回看只记这个月的话。', x + w / 2, y + 120, { size: 24, align: 'center', color: MUTE }); return; }
    var rows = [];
    s.log.forEach(function (e) { rows.push({ head: '第 ' + e.day + ' 天 · ' + e.title }); e.lines.forEach(function (l) { rows.push({ who: l[0], text: l[1] }); }); });
    var per = 15, pages = Math.ceil(rows.length / per); if (this.page < 0 || this.page >= pages) this.page = pages - 1;
    rows.slice(this.page * per, this.page * per + per).forEach(function (r, i) {
      var yy = y + 26 + i * 33;
      if (r.head) { ctx.fillStyle = '#e8dcc0'; U.rr(ctx, x, yy - 22, w, 30, 6); ctx.fill(); U.text(ctx, r.head, x + 12, yy, { size: 18, bold: true, color: INK }); return; }
      if (r.who === 'n') U.text(ctx, r.text, x + 20, yy, { size: 18, color: MUTE, maxW: w - 30 });
      else if (r.who === 'choice') U.text(ctx, '▸ 你选了：' + r.text, x + 20, yy, { size: 18, bold: true, color: K.col.red, maxW: w - 30 });
      else { var nm = Story.who(r.who); U.text(ctx, nm, x + 110, yy, { size: 17, bold: true, align: 'right', color: r.who === 'z' ? K.col.teal : '#7d5a35' }); U.text(ctx, r.text, x + 126, yy, { size: 18, color: INK, maxW: w - 140 }); }
    });
    K.tag(ctx, 'log_prev', x + w - 300, y + h - 30, 90, 40, '上一页', { kind: 'paper', size: 16, disabled: this.page <= 0, onTap: function () { self.page--; Au.play('page'); } });
    U.text(ctx, (this.page + 1) + ' / ' + pages, x + w - 150, y + h - 4, { size: 16, align: 'center', color: MUTE });
    K.tag(ctx, 'log_next', x + w - 90, y + h - 30, 90, 40, '下一页', { kind: 'paper', size: 16, disabled: this.page >= pages - 1, onTap: function () { self.page++; Au.play('page'); } });
  };
  P.describe = function () { return { tab: TABS[this.tab], legacy: this.legacy }; };
  return { Book: Book };
});
;
/* ui/screens.js */
BSX.define('ui/screens', function (require) {
  var B = require('ui/s_basic'), P = require('ui/s_play');
  return { Loading: B.Loading, Title: B.Title, Pause: B.Pause, Scene: P.Scene, Shift: P.Shift, Prep: require('ui/s_prep').Prep, Night: require('ui/s_night').Night, Ending: require('ui/s_ending').Ending, Book: require('ui/s_book').Book, Town: require('ui/s_town').Town };
});
;
/* dev/bot.js */
BSX.define('dev/bot', function (require) {
  var Run = require('core/run');
  var Sim = require('core/sim');
  var Cast = require('content/cast');
  var U = require('ui/ui');
  function Bot(app, o) {
    this.app = app; this.o = o || {}; this.cool = 0.5; this.hold = null; this.stopped = false; this.log = [];
    this.pol = Sim.policies[this.o.policy || 'average'] || Sim.policies.average;
    var sk = this.o.skill || 'good';
    this.sk = { react: sk === 'great' ? 0.16 : sk === 'good' ? 0.24 : 0.42, aim: sk === 'sloppy' ? 0.9 : 0.35, pourErr: sk === 'sloppy' ? -0.2 : 0, remember: sk !== 'sloppy', chat: sk !== 'sloppy', returnExtra: this.pol.skill.returnExtra !== false };
  }
  var B = Bot.prototype;
  B.inject = function (type, x, y) { var v = this.app.view; this.app.input(type, x * v.s + v.ox, y * v.s + v.oy, 77); };
  B.tap = function (x, y) { this.inject('down', x, y); this.inject('up', x, y); };
  B.tapId = function (id) { var h = U.hits.filter(function (z) { return z.id === id; })[0]; if (!h || h.disabled) return false; this.tap(h.x + h.w / 2, h.y + h.h / 2); return true; };
  B.holdAt = function (x, y, dur) { this.inject('down', x, y); this.hold = { x: x, y: y, t: dur }; };
  B.tick = function (dt) {
    var app = this.app, scr = app.overlay || app.screen, self = this;
    if (this.stopped || !scr || app.fadeDir) return;
    if (this.hold) { this.hold.t -= dt; if (this.hold.t <= 0) { this.inject('up', this.hold.x, this.hold.y); this.hold = null; this.cool = this.sk.react; } return; }
    this.cool -= dt; if (this.cool > 0) return;
    var s = app.state;
    switch (scr.name) {
      case 'title': app.newRun({ seed: this.o.seed || 7 }); this.cool = 0.5; break;
      case 'scene': {
        var d = scr.dir, c = d && d.cur; if (!c) { this.cool = 0.2; break; }
        if (c.type === 'say') { this.tap(640, 320); this.cool = this.o.fast ? 0.06 : 0.5; }
        else if (c.type === 'choice') { var ok = c.opts.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return x.o.ok; }), pick = this.pol.choose(d.scene.id, ok.map(function (x) { return x.o.c; }), s), ch = ok[Math.max(0, Math.min(ok.length - 1, pick))]; if (this.tapId('choice' + ch.i)) this.log.push(d.scene.id + ' → ' + ch.o.c.label); this.cool = 0.4; }
        else if (c.type === 'do') { if (c.kind === 'hold') this.holdAt(640, 588, 1.15); else this.tap(640, 588); this.cool = 0.3; }
        else this.cool = 0.1;
        break;
      }
      case 'prep': {
        if (scr.closed) { this.tapId('prep_closed'); this.cool = 0.5; break; }
        if (!scr.botDone) { Sim.prep(s, this.pol); for (var g = 0; g < 12 && Run.planCost(s).total > Math.max(0, s.cash) + 8000; g++) s.plan.menu.forEach(function (id) { Run.setStock(s, id, Math.max(1, Math.floor((s.plan.stock[id] || 0) * 0.7))); }); scr.botDone = true; this.cool = this.o.fast ? 0.1 : 0.8; break; }
        var h = U.hits.filter(function (z) { return z.id === 'open'; })[0]; if (h && !h.disabled) this.holdAt(h.x + h.w / 2, h.y + h.h / 2, 1.2); this.cool = 0.4; break;
      }
      case 'shift': {
        if (scr.phase === 'closing') { if (scr.pt > 1.3) { this.tap(640, 620); this.cool = 0.5; } break; }
        if (scr.phase !== 'open') break;
        var svc = scr.svc, a = svc.nextAction({ aim: this.sk.aim, pourErr: this.sk.pourErr, remember: this.sk.remember, chat: this.sk.chat && svc.queue.length < 2, returnExtra: this.sk.returnExtra });
        if (!a) { this.cool = 0.08; break; }
        if (a.kind === 'hold') this.holdAt(a.x, a.y, a.dur); else { this.tap(a.x, a.y); this.cool = this.sk.react * (0.8 + Math.random() * 0.5); }
        break;
      }
      case 'town': {
        var m = scr.mode, Tn = require('content/town'), T = require('core/town'), st = scr.st, self2 = this;
        this.cool = this.o.fast ? 0.45 : 0.7;
        if (m === 'note') { this.tapId('note_ok'); break; }
        if (m === 'result') { if (scr.mt > 0.5) this.tapId('res_ok'); break; }
        if (m === 'depot') { if (!this.tapId('acc_0')) this.tapId('dp_skip'); this.log.push('d' + s.day + ' 接包餐'); break; }
        if (m === 'market') {
          var li = scr.seen.map(function (x) { return x.some(Boolean); }).indexOf(false);
          if (scr.looks > 0 && li >= 0) { this.tapId('look_' + li + '_' + (li === scr.lots[li].blank ? 1 : 0)); break; }
          var todo = scr.lots.map(function (l, i) { var g = Tn.goods[l.item], seenBad = scr.seen[i].some(function (v, j) { return v && g.bad.indexOf(T.clue(l, j)) >= 0; }), seenGood = scr.seen[i].some(function (v, j) { return v && g.good.indexOf(T.clue(l, j)) >= 0; }); return (seenGood || (l.seller === 'qin' && !seenBad)) && !scr.take[i] && l.price < s.cash - 30000 ? i : -1; }).filter(function (i) { return i >= 0; });
          if (todo.length) { this.tapId('take_' + todo[0]); break; }
          this.tapId('pay'); this.log.push('d' + s.day + ' 验货收 ' + scr.take.filter(Boolean).length + ' 样'); break;
        }
        if (m !== 'map' || scr.anim) break;
        if (this.lastClock !== st.clock || this.lastAt !== st.at) { this.lastClock = st.clock; this.lastAt = st.at; this.stuck = 0; }
        if (this.o.town === 'home') { this.tapId('end'); break; }
        var acts = T.actionsAt(s, st.at), pick = function (f) { return acts.filter(function (x) { return !x.why && f(x); })[0]; };
        var a = pick(function (x) { return x.kind === 'scene'; });
        if (a) { this.tapId('act_' + a.id); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' ' + T.place(st.at).name + ' 看戏' + a.label); break; }
        var tgt = null, best = 1e9;
        Tn.places.forEach(function (p) { if (p.id === st.at || T.whyNot(s, p.id)) return; var mm = T.travelMins(st.at, p.id), ev = T.eventsAt(s, p.id, st.clock + mm).length; if (ev && mm < best) { best = mm; tgt = p.id; } });
        if (!tgt && T.comingAt(s, st.at).some(function (c) { var v = T.nextVisit(s, c.id); return v && Tn.sceneAt[c.id] === st.at; }) && pick(function (x) { return x.kind === 'wait'; })) { this.tapId('act_wait'); break; }
        if (!tgt) {
          var biz = s.day % 3 === 0 ? ['whole', 'depot'] : ['depot', 'whole'];
          for (var i = 0; i < biz.length && !tgt; i++) { if (biz[i] === st.at) continue; var mk = T.markers(s, biz[i]); if (mk.biz && !T.whyNot(s, biz[i])) tgt = biz[i]; }
          var here = pick(function (x) { return x.kind === 'market' || x.kind === 'depot'; });
          if (here && (st.at === 'whole' || st.at === 'depot')) { this.tapId('act_' + here.id); break; }
        }
        var talk = pick(function (x) { return x.kind === 'talk'; });
        if (!tgt && talk) { this.tapId('act_' + talk.id); break; }
        this.stuck = (this.stuck || 0) + 1; if (this.stuck > 40) { this.stuck = 0; this.tapId('end'); break; }
        if (tgt) { if (scr.sel !== tgt) this.tapId('pl_' + tgt); else { this.tapId('go'); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' 去' + T.place(tgt).name); } break; }
        this.tapId('end'); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' 回店'); break;
      }
      case 'night': {
        if (!scr.botDone) { scr.botDone = true; (this.pol.buy || []).forEach(function (id) { var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; if (Run.canBuy(s, id) && s.cash - 40000 > u.cost) Run.buy(s, id); }); this.cool = this.o.fast ? 0.1 : 1.2; break; }
        this.tapId('sleep'); this.cool = 0.5; break;
      }
      case 'ending': if (this.o.endTaps) { this.tap(640, 400); this.cool = 0.6; } else this.stopped = true; break;
      default: this.cool = 0.3;
    }
  };
  function start(app, o) {
    var bot = new Bot(app, o), orig = app.step;
    if (app._bot) app._bot.stopped = true;
    app._bot = bot;
    if (!app._botWrapped) { app._botWrapped = true; app.step = function (dt) { orig.call(app, dt); if (app._bot) app._bot.tick(dt); }; }
    return bot;
  }
  function jump(app, day, policy) {
    var s = app.state || Run.create({ seed: 7 }); app.state = s;
    Sim.month(s, Sim.policies[policy || 'average'], day);
    app.save(); app.route(false);
  }
  return { start: start, jump: jump, Bot: Bot };
});
;
/* app.js */
BSX.define('app', function (require) {
  var Run = require('core/run');
  var Save = require('core/save');
  var A = require('game/assets');
  var Au = require('game/audio');
  var Fx = require('game/fx');
  var Shop = require('game/shop');
  var U = require('ui/ui');
  var Story = require('content/story');
  var D = require('content/dishes');
  var Screens = require('ui/screens');
  var STEP = 1 / 60;
  function App(P, manifest) {
    var app = this;
    this.P = P; this.ctx = P.ctx; this.t = 0; this.acc = 0; this.fps = 60; this.fpsT = 0; this.fpsN = 0; this.errors = []; this.manual = false;
    this.store = new Save.Store(P.storage);
    this.settings = Object.assign({ music: 0.5, sfx: 0.8, vibrate: true, textScale: 1, reduceMotion: false, autoPlay: false, lowFx: false, hints: true }, this.store.loadSettings() || {});
    this.legacy = this.store.loadLegacy() || Run.newLegacy();
    if (!this.legacy.v || this.legacy.v < 2) this.legacy = Run.newLegacy();
    this.state = null; this.screen = null; this.overlay = null; this.lastSave = null; this.dev = !!P.devMode; this.paused = false; this.cards = []; this.fade = 0; this.fadeDir = 0; this.pid = null;
    A.init(P, manifest);
    Au.init(P, this.settings);
    this.applySettings();
    P.onInput(function (type, px, py, id) { app.input(type, px, py, id); });
    if (P.onGesture) P.onGesture(function () { if (P.audioSession) P.audioSession(); Au.unlock(); });
    P.onKey(function (key, e) { app.key(key, e); });
    P.onHide(function () { app.hidden = true; if (app.screen && app.screen.onHide) app.screen.onHide(); app.pause(true); Au.pause(); });
    P.onShow(function () { app.hidden = false; Au.resume(); app.lastNow = P.now(); });
    P.onResize(function () { app.layout(); });
    this.layout();
    this.go(Screens.Loading, {});
    this.lastNow = P.now();
    var loop = function () { app.frame(); P.raf(loop); };
    P.raf(loop);
    this.installTestApi();
  }
  var Ap = App.prototype;
  Ap.applySettings = function () { var s = this.settings; U.textScale = s.textScale; Fx.lowFx = Shop.lowFx = !!(s.lowFx || s.reduceMotion); Au.setVolumes(s); this.store.saveSettings(s); };
  Ap.layout = function () {
    var P = this.P, W = P.canvas.width, H = P.canvas.height, ins = P.safeInsets();
    var aw = W - ins.l - ins.r, ah = H - ins.t - ins.b, s = Math.min(aw / 1280, ah / 720);
    this.view = { s: s, ox: ins.l + (aw - 1280 * s) / 2, oy: ins.t + (ah - 720 * s) / 2, W: W, H: H };
    var cap = P.capsule();
    this.capsule = cap ? { x: (cap.x - this.view.ox) / s, y: (cap.y - this.view.oy) / s, w: cap.w / s, h: cap.h / s } : null;
    this.rightInset = this.capsule && this.capsule.y + this.capsule.h > 0 ? Math.max(0, 1280 - this.capsule.x + 12) : 0;
  };
  Ap.toLogical = function (px, py) { return { x: (px - this.view.ox) / this.view.s, y: (py - this.view.oy) / this.view.s }; };
  Ap.go = function (Scr, params, fade) {
    var app = this;
    function sw() { if (app.screen && app.screen.exit) app.screen.exit(); app.screen = new Scr(app, params || {}); app.overlay = null; app.paused = false; U.pressed = null; app.capture = null; }
    if (fade && this.screen && !this.manualFast) { this.fadeDir = 1; this.fadeTo = function () { sw(); if (app.fadeTo) { app.fadeDir = 1; app.fade = 1; } else app.fadeDir = -1; }; } else { if (this.fadeTo) { this.fadeTo = null; this.fadeDir = -1; } sw(); }
  };
  Ap.openOverlay = function (Scr, params) { this.overlay = new Scr(this, params || {}); this.capture = null; U.pressed = null; Au.play('ui_open'); };
  Ap.closeOverlay = function () { this.overlay = null; this.paused = false; this.capture = null; Au.play('ui_close'); };
  Ap.pause = function (fromSystem) { if (this.overlay || !this.screen || !this.screen.pausable) return; this.paused = true; this.openOverlay(Screens.Pause, { system: fromSystem }); };
  Ap.newRun = function (opts) {
    opts = opts || {}; opts.gen = (this.legacy.runs || 0) + 1;
    if (opts.seed == null) opts.seed = (Date.now() ^ (this.legacy.runs * 7919)) >>> 0;
    this.store.clearRun(); this.state = Run.create(opts); this.save(); this.route(true);
  };
  Ap.save = function () {
    if (!this.state) return;
    var ok = this.store.saveRun(this.state);
    this.lastSave = { ok: ok, day: this.state.day, phase: this.state.phase, t: this.t };
    this.stamp = ok ? 1 : 0; if (!ok) this.errors.push(this.store.notice);
    this.store.saveLegacy(this.legacy);
  };
  Ap.continueRun = function () { var r = this.store.loadRun(); if (!r) return false; this.state = r.state; if (this.store.notice) this.notice(this.store.notice); this.route(true); return true; };
  Ap.route = function (fade) {
    var s = this.state, app = this;
    if (!s) return this.go(Screens.Title, {}, fade);
    var t = s.today;
    switch (s.phase) {
      case 'prep':
        if (t.closed) { return this.go(Screens.Prep, { closed: true }, fade); }
        if (t.open && !t.openDone && Story.scenes[t.open]) return this.go(Screens.Scene, { ids: [t.open], when: 'open', done: function () { t.openDone = true; app.save(); app.route(true); } }, fade);
        if (s.day === 1) { Run.openShop(s); this.save(); return this.go(Screens.Shift, {}, false); }
        return this.go(Screens.Prep, {}, fade);
      case 'service': return this.go(Screens.Shift, {}, fade);
      case 'close':
        if (!(t.closeList || []).some(function (id) { return s.seen[id] !== s.day && Story.scenes[id]; }) && !(t.found || []).some(function (f) { return !f.shown; })) { Run.toTown(s); this.save(); return this.route(fade); }
        return this.go(Screens.Scene, { ids: (t.closeList || []).filter(function (id) { return s.seen[id] !== s.day; }), when: 'close', found: (t.found || []).filter(function (f) { return !f.shown; }), done: function () { Run.toTown(s); app.save(); app.route(true); } }, fade);
      case 'town': return this.go(Screens.Town, {}, fade);
      case 'night': return this.go(Screens.Night, {}, fade);
      case 'ended': return this.go(Screens.Ending, {}, fade);
    }
  };
  Ap.endRun = function () { this.legacy = Run.record(this.legacy, this.state); this.legacy.scenes = this.legacy.scenes || {}; this.store.saveLegacy(this.legacy); this.save(); };
  Ap.news = function (n) {
    var c = null;
    if (n.type === 'dish') { var d = D.byId[n.id]; if (d) c = { dish: n.id, title: '学会了 ' + d.name, text: '明早可以写上菜单牌。' }; }
    else if (n.type === 'memento') { var m = Story.memento(n.id); c = { memento: m.kind, title: '留下了 ' + m.name, text: m.text }; }
    else if (n.type === 'fact') { var who = String(n.id).split('/')[0]; c = { book: true, title: '小本子 · ' + Story.who(who), text: Story.facts[n.id] || '记下一条。' }; }
    if (c) { c.t = 0; this.cards.push(c); }
  };
  Ap.input = function (type, px, py, id) {
    Au.unlock();
    if (type === 'down') { if (this.pid != null && id !== this.pid) return; this.pid = id; }
    else if (type !== 'hover' && this.pid != null && id != null && id !== this.pid) return;
    if (type === 'up' || type === 'cancel') this.pid = null;
    var p = this.toLogical(px, py), x = p.x, y = p.y;
    this.lastPointer = { type: type, x: x, y: y, t: this.t };
    U.keyboard = false;
    if (type === 'hover') { var h0 = U.find(x, y); U.hover = h0 ? h0.id : null; return; }
    if (this.fadeDir) return;
    var scr = this.overlay || this.screen; if (!scr) return;
    if (this.capture) { var c = this.capture; c(type, x, y); if (type === 'up' || type === 'cancel') { this.capture = null; U.pressed = null; } return; }
    if (type === 'down') {
      var h = U.find(x, y);
      if (h && !h.disabled) { U.pressed = h.id; this.pressHit = h; if (h.onDown) { var cap = h.onDown(x, y); if (typeof cap === 'function') this.capture = cap; } return; }
      if (h && h.disabled) return;
      if (scr.pointer) { var cap2 = scr.pointer(type, x, y); if (typeof cap2 === 'function') this.capture = cap2; }
      return;
    }
    if (type === 'up') {
      var ph = this.pressHit; this.pressHit = null; U.pressed = null;
      if (ph) { var h2 = U.find(x, y); if (h2 && h2.id === ph.id && ph.onTap) { if (!ph.quiet) Au.play('tap'); ph.onTap(); } return; }
      if (scr.pointer) scr.pointer(type, x, y);
      return;
    }
    if (scr.pointer) scr.pointer(type, x, y);
  };
  Ap.key = function (key) {
    Au.unlock();
    var list = U.focusable();
    if (key === 'Tab') { U.keyboard = true; U.focusIdx = list.length ? (U.focusIdx + 1) % list.length : -1; return; }
    if ((key === 'Enter' || key === ' ') && U.keyboard && list[U.focusIdx]) { list[U.focusIdx].onTap(); return; }
    if (key === 'Escape' || key === 'p') { if (this.overlay) { if (this.overlay.closeable !== false) this.closeOverlay(); } else this.pause(); return; }
    if (key === 'f') this.P.fullscreen();
    var scr = this.overlay || this.screen; if (scr && scr.key) scr.key(key);
  };
  Ap.frame = function () {
    var now = this.P.now(), dt = Math.min(0.1, (now - this.lastNow) / 1000); this.lastNow = now;
    if (!this.manual && !this.hidden) { this.acc += dt; var n = 0; while (this.acc >= STEP && n < 6) { this.step(STEP); this.acc -= STEP; n++; } if (n === 6) this.acc = 0; }
    this.fpsN++; this.fpsT += dt; if (this.fpsT >= 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsN = 0; this.fpsT = 0; if (!this.manual) { this.lowCount = this.fps < 40 ? (this.lowCount || 0) + 1 : 0; if (this.lowCount >= 6 && !Fx.lowFx) { Fx.lowFx = Shop.lowFx = true; this.notice('已切换到省电画面'); } } }
    this.render();
  };
  Ap.step = function (dt) {
    this.t += dt; U.time = this.t;
    if (this.stamp > 0) this.stamp = Math.max(0, this.stamp - dt);
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 2.6) this.toast = null; }
    if (this.cards.length) { this.cards[0].t += dt; if (this.cards[0].t > 3.1) this.cards.shift(); }
    if (this.fadeDir) { this.fade += this.fadeDir * dt * 3.4; if (this.fadeDir > 0 && this.fade >= 1) { this.fade = 1; var f = this.fadeTo; this.fadeTo = null; if (f) f(); } else if (this.fadeDir < 0 && this.fade <= 0) { this.fade = 0; this.fadeDir = 0; } }
    Au.update(dt);
    if (this.overlay && this.overlay.update) this.overlay.update(dt);
    if (this.paused) return;
    Shop.update(dt); Fx.update(dt);
    if (this.screen && this.screen.update) this.screen.update(dt);
  };
  Ap.notice = function (text) { this.toast = { text: text, t: 0 }; };
  Ap.render = function () {
    var ctx = this.ctx, v = this.view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#17120e'; ctx.fillRect(0, 0, v.W, v.H);
    ctx.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
    ctx.imageSmoothingEnabled = true;
    U.begin();
    ctx.save();
    try {
      ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip();
      if (this.screen && this.screen.draw) this.screen.draw(ctx);
      if (this.overlay && this.overlay.draw) this.overlay.draw(ctx);
    } catch (e) { this.reportError(e); for (var r = 0; r < 64; r++) ctx.restore(); ctx.save(); }
    ctx.restore();
    ctx.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
    this.drawChrome(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.P.portrait && this.P.portrait()) { ctx.fillStyle = 'rgba(20,14,8,.94)'; ctx.fillRect(0, 0, v.W, v.H); ctx.fillStyle = '#fff3d6'; ctx.font = 'bold ' + Math.round(v.W / 16) + 'px ' + U.FONT; ctx.textAlign = 'center'; ctx.fillText('请横过手机', v.W / 2, v.H / 2); ctx.font = Math.round(v.W / 26) + 'px ' + U.FONT; ctx.fillText('小馆需要横屏营业', v.W / 2, v.H / 2 + v.W / 12); }
  };
  Ap.drawChrome = function (ctx) {
    if (this.cards.length) {
      var c = this.cards[0], k = c.t < 0.3 ? Fx.ease.back(c.t / 0.3) : c.t > 2.8 ? Math.max(0, (3.1 - c.t) / 0.3) : 1, w = 400, x = 640 - w / 2, y = -96 + k * 104;
      ctx.save(); ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, x + 3, y + 6, w, 84, 12); ctx.fill();
      ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w, 84, 12); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
      if (c.dish) A.food(ctx, c.dish, x + 12, y + 10, 64, {}); else if (c.memento) { ctx.save(); ctx.translate(x + 44, y + 58); ctx.scale(1.5, 1.5); Shop.drawMemento(ctx, c.memento, 0, 0, 2); ctx.restore(); } else { ctx.fillStyle = '#2f6f66'; U.rr(ctx, x + 22, y + 20, 40, 48, 4); ctx.fill(); ctx.fillStyle = '#fbf5e4'; ctx.fillRect(x + 28, y + 28, 22, 8); }
      U.text(ctx, c.title, x + 92, y + 36, { size: 23, bold: true, color: '#3b2a1a', maxW: w - 108 });
      U.text(ctx, c.text || '', x + 92, y + 64, { size: 17, color: '#8a6a3a', maxW: w - 108 });
      ctx.restore();
    }
    if (this.stamp > 0 && this.lastSave && this.lastSave.ok) { ctx.save(); ctx.globalAlpha = Math.min(1, this.stamp * 2) * 0.8; ctx.translate(40, 690); ctx.rotate(-0.12); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 2.5; ctx.strokeRect(-24, -14, 48, 28); U.text(ctx, '已存', 0, 7, { size: 16, color: '#b8432f', align: 'center', bold: true }); ctx.restore(); }
    if (this.toast) { var k2 = Math.min(1, this.toast.t * 4) * Math.min(1, (2.6 - this.toast.t) * 3); ctx.save(); ctx.globalAlpha = k2; ctx.font = U.font(22, 'bold'); var tw = Math.min(900, ctx.measureText(this.toast.text).width + 60); ctx.fillStyle = 'rgba(28,22,16,.86)'; U.rr(ctx, 640 - tw / 2, 316, tw, 60, 14); ctx.fill(); U.text(ctx, this.toast.text, 640, 354, { size: 22, bold: true, align: 'center', color: '#fff3d6', maxW: tw - 30 }); ctx.restore(); }
    if (this.fade > 0) { ctx.fillStyle = 'rgba(16,12,10,' + Math.min(1, this.fade).toFixed(3) + ')'; ctx.fillRect(-2, -2, 1284, 724); }
    if (this.dev) U.text(ctx, this.fps + 'fps ' + (this.state ? 'd' + this.state.day + ' ' + this.state.phase + ' 烧' + Math.round(this.state.burn) + ' 口' + Math.round(this.state.rep) : ''), 70, 712, { size: 13, color: '#0f0', stroke: '#000' });
  };
  Ap.reportError = function (e) { var msg = String(e && e.stack || e); if (this.errors.indexOf(msg) < 0) this.errors.push(msg); if (typeof console !== 'undefined') console.error(e); if (this.errors.length > 20) this.errors.shift(); };
  Ap.installTestApi = function () {
    var app = this, g = typeof window !== 'undefined' ? window : (typeof GameGlobal !== 'undefined' ? GameGlobal : {});
    g.advanceTime = function (ms) { app.manual = true; var n = Math.max(1, Math.round(ms / (STEP * 1000))); for (var i = 0; i < n; i++) app.step(STEP); app.render(); return app.t; };
    g.render_game_to_text = function () { return JSON.stringify(app.describe()); };
    g.__bsx = {
      app: app, Run: Run,
      inject: function (type, x, y) { var v = app.view; app.input(type, x * v.s + v.ox, y * v.s + v.oy, 1); },
      tap: function (x, y) { this.inject('down', x, y); this.inject('up', x, y); },
      tapId: function (id) { var h = U.hits.filter(function (z) { return z.id === id; })[0]; if (!h || h.disabled) return false; this.tap(h.x + h.w / 2, h.y + h.h / 2); return true; },
      hits: function () { return U.hits.map(function (h) { return { id: h.id, x: Math.round(h.x + h.w / 2), y: Math.round(h.y + h.h / 2), disabled: h.disabled }; }); },
      newRun: function (o) { app.newRun(o || {}); },
      bot: function (o) { return BSX.require('dev/bot').start(app, o || {}); },
      jump: function (day, policy) { BSX.require('dev/bot').jump(app, day, policy); },
      errors: function () { return app.errors.concat(A.errors.map(function (e) { return '资源 ' + e.id + ' ' + e.msg; })); }
    };
  };
  Ap.describe = function () {
    var s = this.state, scr = this.overlay || this.screen;
    return {
      coords: 'logical 1280x720, origin top-left, y down',
      screen: this.screen ? this.screen.name : null, overlay: this.overlay ? this.overlay.name : null, paused: this.paused, fps: this.fps, t: Math.round(this.t * 100) / 100,
      run: s ? { day: s.day, phase: s.phase, cash: Math.round(s.cash) / 100, rep: Math.round(s.rep * 10) / 10, burn: Math.round(s.burn * 10) / 10, plan: s.plan, oilAge: s.oil.age, weather: s.today && s.today.weather, upg: Object.keys(s.upg), helper: s.helper, ending: s.ending, flags: Object.keys(s.flags), aff: Object.keys(s.reg).map(function (k) { return k + ':' + Math.round(s.reg[k].aff * 10) / 10; }).join(' ') } : null,
      save: this.lastSave,
      interactive: U.hits.filter(function (h) { return !h.disabled; }).slice(-50).map(function (h) { return { id: h.id, label: h.label, x: Math.round(h.x + h.w / 2), y: Math.round(h.y + h.h / 2) }; }),
      detail: scr && scr.describe ? scr.describe() : null, errors: this.errors.length, assetErrors: A.errors.length
    };
  };
  return { App: App };
});
;
/* platform/web.js */
BSX.define('platform/web', function () {
  function create() {
    var canvas = document.getElementById('game');
    var params = new URLSearchParams(location.search);
    var mem = {};
    var storage = {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { if (e && /quota/i.test(String(e.name || e))) throw e; mem[k] = v; } },
      remove: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
    var inputFns = [], keyFns = [], hideFns = [], showFns = [], resizeFns = [], gestureFns = [], silentEl = null, SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    var simSafe = params.get('safe') === 'wechat';
    var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || params.get('rotate') === '1';
    var rotated = false;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var vw = window.innerWidth, vh = window.innerHeight;
      rotated = touch && params.get('rotate') !== '0' && vh > vw;
      var w = rotated ? vh : vw, h = rotated ? vw : vh;
      canvas.style.position = 'fixed'; canvas.style.left = '0px'; canvas.style.top = '0px';
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.style.transformOrigin = '0 0';
      canvas.style.transform = rotated ? 'translateX(' + vw + 'px) rotate(90deg)' : 'none';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      P.dpr = dpr; P.cssW = w; P.cssH = h; P.rotated = rotated;
      resizeFns.forEach(function (f) { f(); });
    }
    function pos(e) {
      if (rotated) return { x: e.clientY * P.dpr, y: (window.innerWidth - e.clientX) * P.dpr };
      var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * P.dpr, y: (e.clientY - r.top) * P.dpr };
    }
    ['touchend', 'click', 'keydown', 'pointerup'].forEach(function (ev) { window.addEventListener(ev, function () { gestureFns.forEach(function (f) { f(); }); }, true); });
    var down = false;
    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} down = true; var p = pos(e); inputFns.forEach(function (f) { f('down', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointermove', function (e) { var p = pos(e); inputFns.forEach(function (f) { f(down ? 'move' : 'hover', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointerup', function (e) { down = false; var p = pos(e); inputFns.forEach(function (f) { f('up', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointercancel', function (e) { down = false; var p = pos(e); inputFns.forEach(function (f) { f('cancel', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', function (e) { keyFns.forEach(function (f) { f(e.key, e); }); if ([' ', 'Tab', 'Enter', 'Escape'].indexOf(e.key) >= 0) e.preventDefault(); });
    document.addEventListener('visibilitychange', function () { (document.hidden ? hideFns : showFns).forEach(function (f) { f(); }); });
    window.addEventListener('blur', function () { hideFns.forEach(function (f) { f(); }); });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    var actx = null;
    var P = {
      name: 'web', canvas: canvas, ctx: canvas.getContext('2d'), params: params, dpr: 1, cssW: 0, cssH: 0, devMode: params.has('dev'),
      now: function () { return performance.now(); },
      raf: function (fn) { return requestAnimationFrame(fn); },
      storage: storage,
      loadImage: function (path, cb) { var img = new Image(); img.onload = function () { cb(null, img); }; img.onerror = function () { cb(new Error('加载失败 ' + path)); }; img.src = path; },
      createCanvas: function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; },
      onGesture: function (f) { gestureFns.push(f); }, onInput: function (f) { inputFns.push(f); }, onKey: function (f) { keyFns.push(f); },
      onHide: function (f) { hideFns.push(f); }, onShow: function (f) { showFns.push(f); }, onResize: function (f) { resizeFns.push(f); },
      safeInsets: function () { return simSafe ? { l: 44 * P.dpr, t: 0, r: 34 * P.dpr, b: 21 * P.dpr } : { l: 0, t: 0, r: 0, b: 0 }; },
      capsule: function () { return simSafe ? { x: P.canvas.width - 97 * P.dpr - 7 * P.dpr, y: 8 * P.dpr, w: 87 * P.dpr, h: 32 * P.dpr } : null; },
      vibrate: function (kind) { try { if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : 12); } catch (e) {} },
      audio: function () { if (!actx) { var A = window.AudioContext || window.webkitAudioContext; if (A) actx = new A(); } return actx; },
      audioSession: function () {
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
        try {
          if (!silentEl) { silentEl = document.createElement('audio'); silentEl.setAttribute('playsinline', ''); silentEl.loop = true; silentEl.src = SILENT; silentEl.volume = 0.01; }
          var pr = silentEl.play(); if (pr && pr.catch) pr.catch(function () {});
        } catch (e) {}
        try { if (actx && actx.state !== 'running') actx.resume(); } catch (e) {}
      },
      saveImage: function (cv, name) {
        return new Promise(function (res, rej) {
          try { var a = document.createElement('a'); a.download = name; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); res(true); }
          catch (e) { rej(e); }
        });
      },
      fullscreen: function () { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {} },
      portrait: function () { return !rotated && window.innerHeight > window.innerWidth * 1.05; }
    };
    resize();
    return P;
  }
  return { create: create };
});
;
/* boot/web.js */
(function () {
  function boot() {
    var P = BSX.require('platform/web').create();
    var App = BSX.require('app').App;
    fetch('assets/runtime/manifest.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (m) { window.__app = new App(P, m); })
      .catch(function (e) {
        var ctx = P.ctx; ctx.fillStyle = '#2a1e14'; ctx.fillRect(0, 0, P.canvas.width, P.canvas.height);
        ctx.fillStyle = '#fff3d6'; ctx.font = (24 * P.dpr) + 'px sans-serif'; ctx.fillText('资源清单加载失败：' + e.message + '（点击重试）', 40 * P.dpr, 80 * P.dpr);
        P.canvas.addEventListener('pointerdown', function () { location.reload(); }, { once: true });
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
;(function(){var b=document.getElementById('boot');if(b)b.parentNode.removeChild(b);})();
