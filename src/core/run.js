// 一局（28 天）的规则：晨备 → 早市 → 收摊 → 晚账。状态是一个可序列化对象，函数就地修改它。
// 收入只来自早市里亲手卖出去的每一份；这里负责：日程（谁来、哪场戏）、进货成本、结算、口碑、烧心、结局。
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

  // ───────── 价格、成本、可用菜
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
    // 包餐单独备一批料：不占菜单，也不动晨备的份数
    var po = s.preorder && s.preorder.day === s.day ? s.preorder : null, pre = po ? po.n * unitCost(s, po.dish) : 0;
    return { lines: lines, goods: goods, oil: oil, pantry: pan, pre: pre, preLine: po ? { who: po.who, dish: po.dish, n: po.n } : null, total: goods + oil - pan + pre };
  }
  // 晨备修改（界面调用）。返回 false 表示不允许。
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

  // ───────── 一天开始：天气、谁来、哪场戏、条子
  function hread(s, id) { var h = Cond.read(s); h.aff = id ? s.reg[id].aff : 0; return h; }
  // 每位常客每天最多走一个节拍：按顺序找第一个没走过、没过期、同组没走过、条件满足的（CONTENT_SPEC §5）
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
    // 到期的延迟后果
    var notes = [];
    s.later = s.later.filter(function (l) { if (l.day <= day) { Cond.apply(s, l.fx); if (l.note) notes.push({ text: l.note, kind: 'later' }); return false; } return true; });
    var w = C.fixedWeather[day] || (s.forecast && s.forecast.day === day ? s.forecast.w : null);
    if (!w) { var x = R.rand(s); w = x < C.weatherOdds.sun ? 'sun' : x < C.weatherOdds.sun + C.weatherOdds.cloud ? 'cloud' : 'rain'; }
    s.today = { weather: w, beats: {}, visitors: [], absent: {}, open: null, closeEvent: null, notes: notes, flow: s.nextFlow || 1, shift: 1, closed: !!s.closeNext, news: [], found: [], newDishes: [] };
    s.nextFlow = 1; s.closeNext = false;
    // 解锁
    D.list.forEach(function (d) { if (!s.unlocked[d.id] && d.day <= day && d.id !== 'mutton') { s.unlocked[d.id] = day; if (day > 1) s.today.newDishes.push(d.id); } });
    if (day === 18) { var vf = viralFlag(s); s.flags[vf] = day; s.today.flow *= C.viralFlow[vf.slice(6)]; }
    if (s.today.closed) { s.phase = 'prep'; return; }
    var h = hread(s);
    // 常客
    Cast.regIds.forEach(function (id) {
      var hh = hread(s, id), b = pickBeat(s, id, hh), st = s.reg[id];
      if (b) {
        if (b.act === 'absent') { s.today.absent[id] = b.id; return; }
        if (b.key || R.rand(s) < 0.9) { s.today.beats[id] = b.id; s.today.visitors.push(id); if (b.note) s.today.notes.push({ text: b.note, from: id, kind: 'order' }); return; }
      }
      if (st.met && R.rand(s) < clamp(St.regs[id].attend(hh) + (s.heirloom === 'H_CURTAIN' ? 0.05 : 0), 0.05, 0.97)) s.today.visitors.push(id);
    });
    // 开门戏：主线 > 救急 > 事件
    var m = St.mainBy[day + '/open'];
    if (m && Cond.check(s, m.need, h)) s.today.open = m.id;
    else if (s.negDays >= 2 && !s.rescueUsed) s.today.open = 'rescue';
    else s.today.open = pickEvent(s, 'open', h, 0.5);
    s.today.closeEvent = pickEvent(s, 'close', h, s.today.open && St.scenes[s.today.open] && St.scenes[s.today.open].event ? 0.25 : 0.5);
    // 菜单沿用昨天
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
    // 下午错过的串门戏：有人提一句
    if (BSX.has('core/town')) require('core/town').missed(s).forEach(function (n) { s.today.notes.push(n); });
    s.phase = 'prep';
  }

  // ───────── 开门：付进货钱、处理油
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

  // ───────── 早市计划：到店时刻表（确定性，不消耗局内随机数）
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
  // 满意度：出品平均分 × 等候 ＋ 说中了偏好
  function satisfaction(qAvg, waitFrac, bonus) { return clamp(qAvg * (waitFrac < 0.5 ? 1 : 1 - (waitFrac - 0.5) * 0.5) + (bonus || 0), 0, 1.1); }
  function grade(sat) { return sat >= C.delight ? 'delight' : sat >= C.fine ? 'fine' : 'meh'; }

  // ───────── 收摊结算
  // res：早市控制器（或模拟器）交回的结果，见 game/service 的 result()
  function finishService(s, res) {
    var t = s.today, p = s.plan, st = s.stats, k;
    var fixed = C.utilities + (s.helper ? C.helperWage : 0);
    s.cash += res.revenue + res.tips - fixed;
    // 口碑
    var rd = res.delighted * C.repDelta.delight + res.fine * C.repDelta.fine + res.meh * C.repDelta.meh + res.walked * C.repDelta.walk + res.balked * C.repDelta.balk + (res.soldout || 0) * C.repDelta.soldout;
    if (p.post) rd += t.oilAge <= 1 && p.mat >= 1 ? 0.3 : t.oilAge >= 3 ? -0.5 : 0.1;
    if (s.flags.e_leftover_give && res.leftover >= 3) { rd += 0.15; st.given += res.leftover; }
    if (s.crisis === 'hold') rd -= 0.8;
    if (rd > 0 && s.rep > 80) rd *= 0.45;
    rd = clamp(rd, -C.repDayCap, C.repDayCap);
    s.rep = clamp(s.rep + rd, 0, 100);
    // 烧心
    var bd = (res.burnAdd || 0) * (s.upg.hood ? C.hoodBurn : 1);
    if (s.flags.powder_hidden) bd += 1.3;
    if (s.flags.cheap_mutton && res.sold && res.sold.mutton) bd += 0.3 * res.sold.mutton;
    if (bd <= 0.01 && (!usesOil(s) || t.oilAge <= 1)) bd = -C.burnDecay;
    s.burn = clamp(s.burn + bd, 0, 100);
    // 常客
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
    // 统计
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
    // 危机
    if (s.burn >= 100 && !s.crisis) s.crisis = 'pending';
    if (s.day === s.days || s.early) setEndFlag(s);
    t.closeList = closeList(s, res);
    s.phase = 'close';
    return rec;
  }
  // 停业的一天（整改）
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
  // 收摊后：第 3–27 天可以出门半天（core/town）
  function toTown(s) { s.phase = s.day >= 3 && s.day < s.days && !s.early && !s.today.closed && !(s.today.town && s.today.town.over) ? 'town' : 'night'; }

  // ───────── 添置
  function canBuy(s, id) { var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; return !!u && !s.upg[id] && s.day >= u.day && s.cash >= u.cost; }
  function buy(s, id) { if (!canBuy(s, id)) return false; var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; s.cash -= u.cost; s.upg[id] = s.day; s.flags[id] = s.day; if (s.hist.length) s.hist[s.hist.length - 1].bought = (s.hist[s.hist.length - 1].bought || []).concat([id]); return true; }

  // ───────── 下一天 / 月底
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
  // 结局页用：回响、每位常客的一段
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

  // ───────── 店史（跨局）
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
