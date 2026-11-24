// 20 道菜。每道菜属于一个灶台（st）。价格、成本单位：元（公道价、老秦的鲜货）。
// 灶台两种原型：
//   桶/锅（vat）：pot 粥锅、soy 豆浆桶、side 小炉——整批备好，盛出即成；
//   火候格（slots）：fryer 油锅、griddle 煎锅、boil 面锅——下锅后随时间变熟，翻面（flips）并在正好时出锅。
// tags 是口味标签：客人说不清要什么时按标签点（"来点带汤的"）。
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
  // 一份菜的做法组成：套餐拆成两样
  function parts(id) { var d = byId[id]; return d && d.set ? d.set.slice() : [id]; }
  function stationOf(id) { var d = byId[id]; return d ? d.st : null; }
  // 菜单需要哪些灶台
  function stationsFor(menu) {
    var need = {};
    menu.forEach(function (id) { parts(id).forEach(function (p) { need[byId[p].st] = true; }); });
    return order.filter(function (k) { return need[k]; });
  }
  var TAGS = ['汤水', '顶饱', '清淡', '油香', '甜', '肉', '快'];
  return { list: list, byId: byId, stations: stations, order: order, parts: parts, stationOf: stationOf, stationsFor: stationsFor, TAGS: TAGS };
});
