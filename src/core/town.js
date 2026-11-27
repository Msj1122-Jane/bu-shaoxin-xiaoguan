// 下午自由走动的规则（V4 自由地图）。
// 一个下午 13:00 出门，19:30 前回店。走路按远近花时间，做事也花时间；常客按作息出现在各自的地方；
// 串门戏放在具体地点，人在、条件够才演；第二回过了期限没看，第二天早上会有人提一句（错过照样算数）。
// 效果落到局状态上：s.pantry（明天抵进货钱、出品分、烧心）、s.preorder（明早的包餐）、s.forecast（明天的天气），
// 在 core/run 的 beginDay / planCost / openShop / finishService 里兑现。确定性：同一个种子、同一天，看到的一样。
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
  // ───────── 下午的状态（存在 s.today.town 里，存档跟着走）
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
  // 去不了的原因（空字符串＝能去）
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
  // ───────── 人在哪
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
  // 今天晚些时候会来这里的熟人：[{ id, from }]
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
  // ───────── 串门戏
  function expired(s, sc) { var ms = Tn.miss[sc.id]; return !!(ms && s.day > ms.until); }
  function nextVisit(s, id) {
    var v = Tn.visits[id]; if (!v || !s.reg[id] || !s.reg[id].met) return null;
    for (var i = 0; i < v.scenes.length; i++) { var sc = v.scenes[i]; if (s.seen[sc.id] || expired(s, sc)) continue; return Cond.check(s, sc.need) ? sc : null; }
    return null;
  }
  function visitable(s) { return Cast.regIds.filter(function (id) { return !!nextVisit(s, id); }).map(function (id) { return { id: id, scene: nextVisit(s, id), place: Tn.visits[id].place, at: Tn.sceneAt[id] }; }); }
  // 某地此刻能演的戏：戏放在这里、人此刻在这里
  function eventsAt(s, pid, m) {
    if (m == null) m = ensure(s).clock;
    return visitable(s).filter(function (v) { return v.at === pid && where(s, v.id, m) === pid && m + COST.scene <= END + 15; });
  }
  // ───────── 市场、包餐（沿用 V3 的规则）
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
    // 一单接完，三天内总站没人再找你
    if (s.lastOrder && s.day - s.lastOrder < 3) return [];
    var h = rng(s, 0x0de7), list = Tn.orders.filter(function (o) { return Cond.check(s, o.need) && dishFor(s, o) && !(s.flags['o_' + o.id] && s.day - s.flags['o_' + o.id] < 6); });
    var out = [];
    while (list.length && out.length < 2) { var i = Math.floor(R.rand(h) * list.length) % list.length; out.push(list.splice(i, 1)[0]); }
    return out.map(function (o) { var d = dishFor(s, o); return { id: o.id, who: o.who, from: o.from, dish: d, n: o.n, unit: Math.round(Run.price(s, d) * o.unit * 0.75 / 10) * 10, line: o.line }; });
  }
  // ───────── 某地能做的事：{ id, kind, label, mins, why, who? }
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
  // 小本子"今天可能遇到"
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
  // ───────── 做事
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
  // 错过的第二回串门戏：过期第二天早上，有人提一句（core/run 的 beginDay 调用）
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
  // 无界面：模拟与测试用（一个下午只做一件事）
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
