// 20 道菜（GDD §5.3）。售价/成本单位：元（合理价、鲜货＋日常换油）。
// steps：五类基础手势组合。g = circle 画圈 | drag 拖拽 | hold 按住倾倒 | swipe 滑动拉伸翻面 | timing 时机火候
// timing.bg=true 表示进入后台持续加热，可离开近景去做别的（并行状态）。
// fit：[冻储, 鲜货, 可追溯] 的口感适配，影响需求与口碑。
BSX.define('content/dishes', function () {
  var S = {
    drag: function (key, item, n) { return { g: 'drag', key: key, item: item, n: n || 1, w: 0.6 }; },
    circle: function (key, turns) { return { g: 'circle', key: key, turns: turns, w: 1.2 }; },
    hold: function (key, band) { return { g: 'hold', key: key, band: band || [0.78, 0.92], rate: 0.32, w: 1.2 }; },
    swipe: function (key, dir, n) { return { g: 'swipe', key: key, dir: dir, n: n, w: 1 }; },
    timing: function (key, dur, win, bg) { return { g: 'timing', key: key, dur: dur, win: win || [0.70, 0.88], bg: !!bg, w: 1.4 }; }
  };
  var list = [
    { id: 'soy', name: '现磨豆浆', price: 4, cost: 1, station: 'soy', icon: { cell: 10 }, unlock: { type: 'start' }, fit: [1, 1, 1.05], pop: 1.2,
      steps: [S.circle('grind', 2), S.hold('pour', [0.78, 0.92])] },
    { id: 'congee', name: '熬白粥', price: 4, cost: 1, station: 'pot', icon: { cell: 0 }, unlock: { type: 'start' }, fit: [1, 1, 1.05], pop: 1.2,
      steps: [S.drag('rice', 'rice'), S.circle('stir', 1.5), S.timing('thicken', 3.2, [0.66, 0.86]), S.drag('scoop', 'ladle')] },
    { id: 'youtiao', name: '油条', price: 3, cost: 1, station: 'fryer', oil: true, icon: { cell: 7 }, unlock: { type: 'start' }, fit: [0.95, 1, 1.05], pop: 1.25,
      steps: [S.swipe('pull', 'h', 1), S.drag('drop', 'dough'), S.timing('flip', 4.2, [0.68, 0.86], true), S.timing('lift', 2.4, [0.6, 0.85])] },
    { id: 'scallion', name: '葱油饼', price: 6, cost: 2, station: 'pan', oil: true, icon: { cell: 8 }, unlock: { type: 'start' }, fit: [0.95, 1, 1.05], pop: 0.9,
      steps: [S.swipe('roll', 'h', 3), S.drag('lay', 'cake'), S.timing('flip', 4.4, [0.68, 0.86], true), S.timing('lift', 2.6, [0.6, 0.85])] },
    { id: 'egg', name: '煎蛋', price: 3, cost: 1, station: 'pan', oil: true, icon: { proc: 'egg' }, unlock: { type: 'start' }, fit: [1, 1, 1.05], pop: 0.9,
      steps: [S.drag('crack', 'egg'), S.swipe('shake', 'h', 2), S.timing('set', 3.0, [0.64, 0.88])] },
    { id: 'noodle', name: '挑面小面', price: 9, cost: 4, station: 'noodle', icon: { cell: 14 }, unlock: { type: 'start' }, fit: [0.85, 1, 1.1], pop: 1,
      steps: [S.drag('drop', 'noodle'), S.timing('boil', 3.6, [0.66, 0.88], true), S.swipe('lift', 'v', 2), S.hold('broth', [0.72, 0.9])] },
    { id: 'friedrice', name: '蛋炒饭', price: 10, cost: 4, station: 'wok', oil: true, icon: { proc: 'rice' }, unlock: { type: 'day', day: 7 }, fit: [1, 1, 1.05], pop: 1,
      steps: [S.drag('egg', 'egg'), S.drag('rice', 'rice'), S.swipe('toss', 'v', 4)] },
    { id: 'soyyt', name: '豆浆泡油条', price: 7, cost: 2, station: 'soy', oil: true, icon: { cell: 10, overlay: 7 }, unlock: { type: 'aff', who: 'zhao', aff: 3 }, fit: [1, 1, 1.05], pop: 1.1,
      steps: [S.hold('pour', [0.7, 0.88]), S.drag('dip', 'youtiao')] },
    { id: 'pidan', name: '皮蛋瘦肉粥', price: 9, cost: 4, station: 'pot', icon: { cell: 3 }, unlock: { type: 'material', min: 1 }, fit: [0.7, 1, 1.12], pop: 1,
      steps: [S.drag('rice', 'rice'), S.circle('stir', 1.5), S.timing('add', 3.0, [0.62, 0.85]), S.drag('scoop', 'ladle')] },
    { id: 'shengjian', name: '生煎包', price: 8, cost: 3, station: 'pan', oil: true, icon: { cell: 6 }, unlock: { type: 'material', min: 1 }, fit: [0.8, 1, 1.1], pop: 1.05,
      steps: [S.drag('place', 'bun', 3), S.timing('sear', 4.6, [0.66, 0.86], true), S.timing('lid', 2.4, [0.6, 0.88])] },
    { id: 'chicken', name: '骨汤鸡汤面', price: 16, cost: 8, station: 'noodle', icon: { cell: 14, tint: '#f2c04a' }, unlock: { type: 'dayMaterial', day: 12, min: 2 }, fit: [0.6, 0.9, 1.2], pop: 0.85,
      steps: [S.timing('skim', 2.6, [0.55, 0.85]), S.drag('drop', 'noodle'), S.timing('boil', 3.4, [0.66, 0.88], true), S.hold('broth', [0.74, 0.9])] },
    { id: 'mixian', name: '米线', price: 12, cost: 5, station: 'noodle', icon: { cell: 14, tint: '#ffffff' }, unlock: { type: 'day', day: 14 }, fit: [0.85, 1, 1.1], pop: 0.95,
      steps: [S.drag('drop', 'mixian'), S.timing('blanch', 2.4, [0.6, 0.88]), S.hold('broth', [0.72, 0.9])] },
    { id: 'pumpkin', name: '南瓜粥', price: 7, cost: 2, station: 'pot', icon: { cell: 2 }, unlock: { type: 'aff', who: 'qin', aff: 5 }, fit: [0.9, 1, 1.1], pop: 1,
      steps: [S.drag('add', 'pumpkin'), S.circle('stir', 2), S.drag('scoop', 'ladle')] },
    { id: 'teaegg', name: '茶叶蛋', price: 3, cost: 1, station: 'stew', icon: { cell: 9 }, unlock: { type: 'aff', who: 'gong', aff: 5 }, fit: [1, 1, 1.05], pop: 1.1,
      steps: [S.drag('eggs', 'egg', 2), S.timing('stew', 7.0, [0.55, 0.95], true)] },
    { id: 'tangyou', name: '糖油果子', price: 6, cost: 2, station: 'fryer', oil: true, icon: { proc: 'balls' }, unlock: { type: 'aff', who: 'man', aff: 3 }, fit: [1, 1, 1.05], pop: 0.95,
      steps: [S.drag('drop', 'ball', 3), S.circle('sugar', 1), S.timing('fry', 3.6, [0.66, 0.86], true)] },
    { id: 'yeerba', name: '叶儿粑', price: 6, cost: 2, station: 'steamer', icon: { proc: 'leaf' }, unlock: { type: 'aff', who: 'man', aff: 7 }, fit: [0.9, 1, 1.1], pop: 0.9,
      steps: [S.swipe('wrap', 'h', 2), S.drag('place', 'leafbun', 2), S.timing('steam', 4.4, [0.64, 0.9], true)] },
    { id: 'poachnoodle', name: '荷包蛋面', price: 12, cost: 5, station: 'noodle', icon: { cell: 14, overlay: 'egg' }, unlock: { type: 'aff', who: 'ali', aff: 5 }, fit: [0.9, 1, 1.1], pop: 1,
      steps: [S.drag('egg', 'egg'), S.timing('poach', 3.2, [0.62, 0.86], true), S.drag('drop', 'noodle'), S.hold('broth', [0.72, 0.9])] },
    { id: 'tangyuan', name: '醪糟汤圆', price: 10, cost: 3, station: 'pot', icon: { cell: 12 }, unlock: { type: 'day', day: 22 }, fit: [1, 1, 1.05], pop: 1.05,
      steps: [S.drag('drop', 'ball', 3), S.circle('stir', 2), S.drag('scoop', 'ladle')] },
    { id: 'dumpling', name: '饺子', price: 12, cost: 4, station: 'noodle', icon: { cell: 13 }, unlock: { type: 'day', day: 22 }, fit: [1.05, 1, 1.05], pop: 1.1,
      steps: [S.swipe('pleat', 'h', 3), S.drag('drop', 'dumpling', 2), S.timing('boil', 3.8, [0.66, 0.88], true), S.drag('scoop', 'ladle')] },
    { id: 'mutton', name: '羊肉汤', price: 18, cost: 10, station: 'noodle', icon: { cell: 11, tint: '#e9d2a8' }, unlock: { type: 'day', day: 12 }, fit: [0.8, 1, 1.15], pop: 0.8,
      steps: [S.timing('skim', 2.6, [0.55, 0.85]), S.circle('season', 1), S.hold('broth', [0.74, 0.92])] }
  ];
  var stations = {
    pot: { name: '粥锅', equip: 1, view: 'pot' },
    fryer: { name: '油锅', equip: 2, view: 'fryer' },
    soy: { name: '豆浆壶', equip: 3, view: 'cup' },
    pan: { name: '平底锅', equip: 0, view: 'pan' },
    wok: { name: '炒锅', equip: 0, view: 'wok' },
    noodle: { name: '汤面锅', equip: 1, view: 'noodle' },
    stew: { name: '卤锅', equip: 0, view: 'stew' },
    steamer: { name: '蒸笼', equip: 0, view: 'steamer' }
  };
  var byId = {};
  list.forEach(function (d) { byId[d.id] = d; });
  return { list: list, byId: byId, stations: stations };
});
