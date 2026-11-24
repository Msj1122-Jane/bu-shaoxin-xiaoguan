// 下午外出的规则：去哪、看到什么、带回什么。确定性：同一个种子、同一天，市场上摆的是同样三份货。
// 效果落到局状态上：s.pantry（明天抵进货钱、出品分、烧心）、s.preorder（明早的包餐）、s.forecast（明天的天气）。
// 这些在 core/run 的 beginDay / planCost / openShop / finishService 里兑现。
BSX.define('core/town', function (require) {
  var R = require('core/rng');
  var D = require('content/dishes');
  var Cond = require('core/cond');
  var Run = require('core/run');
  var Tn = require('content/town');
  var Cast = require('content/cast');
  var C = require('content/config');
  function rng(s, salt) { return { rng: R.hashSeed((s.seed ^ Math.imul(s.day + 1, 7919) ^ salt) >>> 0) }; }
  function ok(s) { return s.day >= 3 && s.day < s.days && !s.early && !(s.today && s.today.closed); }
  function nextVisit(s, id) {
    var v = Tn.visits[id]; if (!v || !s.reg[id] || !s.reg[id].met) return null;
    for (var i = 0; i < v.scenes.length; i++) { var sc = v.scenes[i]; if (s.seen[sc.id]) continue; return Cond.check(s, sc.need) ? sc : null; }
    return null;
  }
  function visitable(s) { return Cast.regIds.filter(function (id) { return !!nextVisit(s, id); }).map(function (id) { return { id: id, scene: nextVisit(s, id), place: Tn.visits[id].place }; }); }
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
    var h = rng(s, 0x0de7), list = Tn.orders.filter(function (o) { return Cond.check(s, o.need) && dishFor(s, o) && !(s.flags['o_' + o.id] && s.day - s.flags['o_' + o.id] < 6); });
    var out = [];
    while (list.length && out.length < 2) { var i = Math.floor(R.rand(h) * list.length) % list.length; out.push(list.splice(i, 1)[0]); }
    return out.map(function (o) { var d = dishFor(s, o); return { id: o.id, who: o.who, from: o.from, dish: d, n: o.n, unit: Math.round(Run.price(s, d) * o.unit / 10) * 10, line: o.line }; });
  }
  function places(s) {
    var vs = visitable(s), of = s.day >= 5 ? offers(s) : [];
    return Tn.places.map(function (p) {
      var why = '';
      if (s.day < p.from) why = '第 ' + p.from + ' 天以后';
      else if (p.id === 'visit' && !vs.length) why = '还没有熟到能串门的人';
      else if (p.id === 'depot' && !of.length) why = '今天没人订';
      else if (p.id === 'market' && s.cash < 1500) why = '手头太紧';
      return { id: p.id, name: p.name, mark: p.mark, x: p.x, y: p.y, desc: p.desc, why: why };
    });
  }
  // 收下市场的货：现在付钱，明天抵进货
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
    return p;
  }
  function accept(s, o) {
    s.preorder = { day: s.day + 1, id: o.id, who: o.who, from: o.from, dish: o.dish, n: o.n, unit: o.unit };
    s.flags['o_' + o.id] = s.day;
    return s.preorder;
  }
  function bridge(s) {
    var d = s.day + 1, w = C.fixedWeather[d];
    if (!w) { var h = rng(s, 0xb81d), x = R.rand(h); w = x < C.weatherOdds.sun ? 'sun' : x < C.weatherOdds.sun + C.weatherOdds.cloud ? 'cloud' : 'rain'; }
    s.forecast = { day: d, w: w };
    var h2 = rng(s, 0x71e5);
    return { w: w, text: R.pick(h2, Tn.forecast[w]), river: R.pick(h2, Tn.riverLines) };
  }
  function practice(s) {
    var best = null, n = -1;
    D.stationsFor(s.plan.menu).forEach(function (k) { if (k === 'side') return; var v = s.stats.st[k] || 0; if (v > n) { n = v; best = k; } });
    best = best || 'pot';
    s.stats.st[best] = (s.stats.st[best] || 0) + 8;
    return { st: best, name: D.stations[best] ? D.stations[best].name : best, lv: Run.skillLv(s, best) };
  }
  function done(s, kind, info) { s.today.town = { kind: kind, info: info || null }; Run.toNight(s); }
  // 无界面：模拟与测试用
  function auto(s, kind) {
    if (!ok(s)) return null;
    if (kind === 'market') { var ls = lots(s); return buy(s, ls, ls.map(function (l) { return !l.bad; })); }
    if (kind === 'depot') { var of = offers(s); return of.length ? accept(s, of[0]) : null; }
    if (kind === 'bridge') return bridge(s);
    if (kind === 'visit') { var v = visitable(s)[0]; if (v) require('core/sim').scene(s, v.scene.id); return v; }
    return practice(s);
  }
  return { ok: ok, places: places, visitable: visitable, nextVisit: nextVisit, lots: lots, clue: clue, offers: offers, buy: buy, accept: accept, bridge: bridge, practice: practice, done: done, auto: auto };
});
