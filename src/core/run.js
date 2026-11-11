// 单月（或七日常营业）状态机。纯函数：reduce(state, action) → 新 state，非法动作原样返回（幂等）。
// 一日相位：dawn(晨间剧情/通牒) → prep(晨备) → open(开店前事件) → service(营业做饭) → dusk(营业后事件/常客节点/主线) → ledger(晚账) → 下一日 / ended
BSX.define('core/run', function (require) {
  var C = require('content/config');
  var D = require('content/dishes');
  var R = require('content/regulars');
  var E = require('content/events');
  var ST = require('content/story');
  var EN = require('content/endings');
  var RNG = require('core/rng');
  var Cond = require('core/cond');
  var Q = require('content/encounters');
  var SCHEMA = 3;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function round1(v) { return Math.round(v * 100) / 100; }

  // ───────────────────────── 新局
  function create(opts) {
    opts = opts || {};
    var seed = (opts.seed == null ? 20261105 : opts.seed) >>> 0;
    var mode = opts.mode || 'story';
    var theme = opts.theme ? EN.themes.filter(function (t) { return t.id === opts.theme; })[0] : null;
    var s = {
      schema: SCHEMA, cv: C.contentVersion, mode: mode, seed: seed, rng: RNG.hashSeed(seed),
      days: mode === 'week' ? 7 : C.days, theme: theme ? theme.id : null, goal: opts.goal || null,
      heirloom: opts.heirloom || null, generation: opts.generation || 1, prefer: opts.preferUnseen || [],
      day: 1, phase: 'dawn', pending: [],
      cash: C.startCash, rep: C.startRep, burn: 0,
      oil: 1, material: 1, price: 1, menu: ['congee', 'youtiao', 'soy', 'scallion'],
      helper: false, upgrades: [], oilStreak: 0,
      prof: {}, regulars: {}, unlocked: {},
      events: { seen: [], cd: {}, delayed: [], chains: [], lastType: null },
      flags: {}, crisis: { state: 'none', day: null }, rescue: { used: false, choice: null, refused: false },
      negativeDays: 0, early: null, ending: null,
      history: [], keyChoices: [], photos: [], nodesDone: [], storySeen: [], pages: [],
      stats: { tierDays: { oil: [0, 0, 0], material: [0, 0, 0], price: [0, 0, 0] }, goodDays: 0, recycleDays: 0, signature: 0, rushed: 0, lostTotal: 0, noWaitDays: 0, bestStreak: 0, streak: 0, cooked: {}, startRep: C.startRep, startCash: C.startCash, burnStart: 0 },
      weatherPlan: [], today: null, ledger: null, executed: []
    };
    R.list.forEach(function (r) { s.regulars[r.id] = { aff: 0, visits: 0, last: 0, nodes: [] }; });
    D.list.forEach(function (d) { s.prof[d.id] = { n: 0, star: 0 }; });
    // 开局身份与一正一负特性（D039）
    var org = C.origins.filter(function (o) { return o.id === opts.origin; })[0] || C.origins[0];
    s.origin = org.id; s.cash += org.cash; s.rep = clamp(s.rep + org.rep, 0, 100);
    if (org.debt) s.flags.debt = org.debt;
    if (org.prof) D.list.forEach(function (d) { if (d.unlock.type === 'start') { s.prof[d.id].n = org.prof; var st0 = 0; C.profThresholds.forEach(function (t) { if (org.prof >= t) st0++; }); s.prof[d.id].star = st0; } });
    var plus = C.perks.plus.filter(function (p) { return p.id === opts.perkPlus; })[0], minus = C.perks.minus.filter(function (p) { return p.id === opts.perkMinus; })[0];
    s.perks = plus && minus ? { plus: plus.id, minus: minus.id } : { plus: null, minus: minus ? minus.id : null };
    if (s.perks.plus === 'savings') s.cash += 60000;
    if (s.perks.plus === 'neighbors') { s.rep = clamp(s.rep + 8, 0, 100); R.list.forEach(function (r) { s.regulars[r.id].aff = 0.5; }); }
    if (s.perks.plus === 'quickhands') s.upgrades.push('fire');
    s.stats.startRep = s.rep; s.stats.startCash = s.cash;
    s.chores = { plan: { hood: true, waste: true, sanitize: true }, missed: { hood: 0, waste: 0, sanitize: 0 } };
    if (opts.unlockAll) D.list.forEach(function (d) { s.unlocked[d.id] = true; });
    if (opts.unlocked) opts.unlocked.forEach(function (id) { s.unlocked[id] = true; });
    if (s.heirloom === 'H_NOTEBOOK') s.unlocked.friedrice = true;
    if (s.heirloom === 'H_APRON') D.list.forEach(function (d) { s.prof[d.id].n = 1; });
    // 天气计划
    for (var i = 1; i <= s.days; i++) {
      var x = RNG.rand(s), w = x < C.weatherOdds.sun ? 'sun' : x < C.weatherOdds.sun + C.weatherOdds.cloud ? 'cloud' : 'rain';
      if (theme && theme.mods.weather) w = theme.mods.weather;
      s.weatherPlan.push(w);
    }
    if (mode === 'story') { s.weatherPlan[0] = 'sun'; s.weatherPlan[1] = 'sun'; s.weatherPlan[11] = 'rain'; s.weatherPlan[27] = 'sun'; s.weatherPlan[2] = 'rain'; }
    beginDay(s);
    return s;
  }

  // ───────────────────────── 菜谱解锁
  function dishAvailable(s, d) {
    if (s.unlocked[d.id]) return true;
    var u = d.unlock;
    if (u.type === 'start') return true;
    if (u.type === 'day') return s.day >= u.day;
    if (u.type === 'material') return s.material >= u.min;
    if (u.type === 'dayMaterial') return s.day >= u.day && s.material >= u.min;
    if (u.type === 'aff') return false;
    return false;
  }
  function dishLockedToday(s, d) { // 已解锁（永久）但今日料档不满足
    if (d.unlock.type === 'material' && s.material < d.unlock.min) return true;
    if (d.unlock.type === 'dayMaterial' && s.material < d.unlock.min) return true;
    return false;
  }
  function availableDishes(s) { return D.list.filter(function (d) { return dishAvailable(s, d) && !dishLockedToday(s, d); }); }
  function menuSize(s) { return s.upgrades.indexOf('counter') >= 0 ? C.menuSizeUpgraded : C.menuSize; }
  function theme(s) { return s.theme ? EN.themes.filter(function (t) { return t.id === s.theme; })[0] : null; }

  // ───────────────────────── 一日开始
  function beginDay(s) {
    var w = s.weatherPlan[s.day - 1];
    s.today = { weather: w, visitors: [], preEvent: null, postEvent: null, flow: 1, cap: 0, closed: false, eventCash: 0, notes: [], story: null, choices: [], nodeQueue: [] };
    s.ledger = null;
    // 菜单合法化（料档变化可能让菜不可用）
    s.menu = s.menu.filter(function (id) { var d = D.byId[id]; return d && dishAvailable(s, d) && !dishLockedToday(s, d); });
    // 整改停业
    if (s.flags.closeToday === s.day) s.today.closed = true;
    // 良心灯笼到“封条”档：贴封条停业一天（D031，评审 #4），四天内不重复
    if (s.mode === 'story' && s.day > 1 && lanternTier(s.burn).idx === 4 && !(s.flags.sealDay > s.day - 4)) { s.today.closed = true; s.today.sealed = true; s.flags.sealDay = s.day; s.burn = clamp(s.burn - 12, 0, 100); s.today.notes.push('门口贴了封条：停业一天，整改'); }
    // 延期效果（开店前）
    applyDelayed(s, 'pre');
    beginDayExtras(s);
    s.pending = [];
    if (s.rescue.pendingDay === s.day) s.pending.push({ kind: 'rescue' });
    if (s.mode === 'story') {
      var sid = ST.storyDays[s.day];
      if (sid && ST.main[sid].phase === 'pre') { s.today.story = sid; s.pending.push({ kind: 'story', id: sid }); }
    }
    s.phase = s.pending.length ? 'dawn' : 'prep';
  }

  // ───────────────────────── 深空当铺参考：收尾清单、验货、每日目标（D040–D043）
  function hashU(s, k) { return RNG.hashSeed((s.seed * 2654435761 + s.day * 40503 + k * 9973) >>> 0) / 4294967296; }
  function perk(s, id) { return s.perks && (s.perks.plus === id || s.perks.minus === id); }
  var GOALS = [
    { id: 'nocheat', label: '今天一次捷径都不走', test: function (x) { return x.cheats === 0 && x.orders > 0; } },
    { id: 'combo5', min: 2, label: '早高峰连击 ≥5', test: function (x) { return x.maxCombo >= 5; } },
    { id: 'combo8', min: 9, label: '早高峰连击 ≥8', test: function (x) { return x.maxCombo >= 8; } },
    { id: 'sig3', min: 2, label: '做出 3 份招牌品质', test: function (x) { return x.sig >= 3; } },
    { id: 'sig6', min: 9, label: '做出 6 份招牌品质', test: function (x) { return x.sig >= 6; } },
    { id: 'nowait', min: 2, label: '不让一位客人空等走掉', test: function (x) { return x.lostOrders === 0 && x.orders > 0; } },
    { id: 'regular', min: 2, label: '让一位常客满意离开', test: function (x) { return x.happyRegulars > 0; } },
    { id: 'served', min: 4, label: '卖出 {n} 份', n: function (s) { return Math.round((50 + s.day * 1.5) / 5) * 5; }, test: function (x, g) { return x.served >= g.n; } }
  ];
  function pickGoals(s) {
    if (s.day < 2 || s.today.closed) return [];
    var pool = GOALS.filter(function (g) { return g.id !== 'nocheat' && (g.min || 1) <= s.day && !(g.id === 'combo5' && s.day >= 9) && !(g.id === 'sig3' && s.day >= 9); });
    var out = [{ id: 'nocheat', label: GOALS[0].label, done: false }], k = 1;
    while (out.length < 3 && pool.length) { var i = Math.floor(hashU(s, k++) * pool.length), g = pool.splice(i, 1)[0]; var n = g.n ? g.n(s) : null; out.push({ id: g.id, n: n, label: g.label.replace('{n}', n), done: false }); }
    return out;
  }
  function beginDayExtras(s) {
    if (!s.chores) s.chores = { plan: { hood: true, waste: true, sanitize: true }, missed: { hood: 0, waste: 0, sanitize: 0 } };
    var m = s.chores.missed;
    if (m.hood >= 2) { s.rep = clamp(s.rep - 1, 0, 100); s.burn = clamp(s.burn + 2, 0, 100); s.today.notes.push('油烟机两天没洗，进门的人直皱眉'); }
    if (m.waste >= 2) { s.burn = clamp(s.burn + 4, 0, 100); s.today.notes.push('没交正规回收的泔水，被人半夜拉走了'); }
    if (m.sanitize >= 2) { s.today.sickBoost = 0.08; s.today.notes.push('碗筷两天没消毒'); }
    s.today.goals = pickGoals(s);
    if (s.mode === 'story' && s.day >= 3 && !s.today.closed && hashU(s, 101) < C.delivery.chance) {
      var it = C.delivery.items[Math.floor(hashU(s, 102) * C.delivery.items.length)];
      s.today.delivery = { item: it.id, fake: hashU(s, 103) < C.delivery.fakeChance + Math.min(0.2, (s.day - 3) * 0.01), state: 'pending' };
    }
  }
  function resolveDelivery(s, accept, tested) {
    var dv = s.today.delivery; if (!dv || dv.state !== 'pending') return false;
    var it = C.delivery.items.filter(function (x) { return x.id === dv.item; })[0];
    dv.state = 'done'; dv.accept = !!accept; dv.tested = !!tested;
    if (accept && dv.fake) { s.cash += it.save; s.burn = clamp(s.burn + it.burn, 0, 100); s.today.fakeUsed = true; s.stats.fakeAccepted = (s.stats.fakeAccepted || 0) + 1; s.today.notes.push(tested ? '明知是假货还是收了，省下 ' + it.save / 100 + ' 元' : '没验货，收下了一批有问题的' + it.name); }
    else if (!accept && dv.fake) { s.rep = clamp(s.rep + 0.5, 0, 100); s.stats.fakeCaught = (s.stats.fakeCaught || 0) + 1; s.today.notes.push('验出假货，当场退了：' + it.name); }
    else if (!accept && !dv.fake) { s.cash -= 300; s.today.notes.push('货没问题，退回去白搭了 3 元运费'); }
    return true;
  }
  function choreCost(s) { return C.chores.reduce(function (n, c) { return n + (s.chores && s.chores.plan[c.id] ? c.cost : 0); }, 0); }
  function applyChores(s) {
    if (!s.chores || s.phase === 'ended') return;
    var cost = choreCost(s);
    if (s.today.closed) cost = 0;
    s.cash -= cost;
    C.chores.forEach(function (c) { s.chores.missed[c.id] = s.chores.plan[c.id] || s.today.closed ? 0 : s.chores.missed[c.id] + 1; });
    if (s.ledger) { s.ledger.choreCost = cost; s.ledger.chores = C.chores.filter(function (c) { return s.chores.plan[c.id]; }).map(function (c) { return c.id; }); s.ledger.cashClose = s.cash; }
  }

  function regularWeight(s, r) {
    var st = s.regulars[r.id], v = r.visit;
    if (v.burnPause && s.burn >= v.burnPause) return 0;
    if (r.id === 'song' && s.flags.songAway) return 0.05;
    var w = v.base * v.price[s.price] * v.material[s.material] * v.oil[s.oil];
    if (s.today.weather === 'rain') w *= v.rain;
    if (st.last === s.day - 1) w *= 0.65; // 不要天天同一人
    w *= 1 + Math.min(0.5, st.aff * 0.06);
    var th = theme(s); if (th && th.mods.regular && th.mods.regular[r.id]) w *= th.mods.regular[r.id];
    if (s.heirloom === 'H_TEACUP' && v.morning) w *= 1.2;
    return w;
  }
  function pickVisitors(s) {
    if (s.today.closed) return;
    var day = s.day, want = s.mode === 'story' ? (day === 1 ? 1 : day <= 3 ? 2 : day <= 10 ? 2 : 3) : 3;
    var pool = R.list.slice(), out = [];
    if (s.mode === 'story' && day === 1) { s.today.visitors = ['zhao']; return; }
    if (s.mode === 'story' && day === 2) { out.push('song'); pool = pool.filter(function (r) { return r.id !== 'song'; }); }
    while (out.length < want && pool.length) {
      var pick = RNG.weighted(s, pool, function (r) { return regularWeight(s, r); });
      if (!pick) break;
      if (RNG.rand(s) < Math.min(0.95, regularWeight(s, pick) * 1.25)) out.push(pick.id);
      pool = pool.filter(function (r) { return r !== pick; });
    }
    s.today.visitors = out;
  }

  // ───────────────────────── 效果
  function applyEffect(s, eff, src) {
    if (!eff) return;
    var before = s.cash;
    if (eff.cash) s.cash += eff.cash;
    if (eff.rep) s.rep = clamp(s.rep + eff.rep, 0, 100);
    if (eff.burn) s.burn = clamp(s.burn + eff.burn, 0, 100);
    if (eff.flow) s.today.flow *= eff.flow;
    if (eff.cap) s.today.cap += eff.cap;
    if (eff.aff) for (var id in eff.aff) if (s.regulars[id]) s.regulars[id].aff = clamp(round1(s.regulars[id].aff + eff.aff[id]), 0, 7);
    if (eff.flag) for (var f in eff.flag) s.flags[f] = eff.flag[f];
    if (eff.hireHelper) { s.helper = true; s.today.notes.push('明天起有帮工'); }
    if (eff.helperLeave) s.helper = false;
    if (eff.renewalDelta) s.flags.renewalDelta = (s.flags.renewalDelta || 0) + eff.renewalDelta;
    if (eff.audit) audit(s);
    if (eff.delayed) eff.delayed.forEach(function (d, i) { s.events.delayed.push(Object.assign({ uid: (src || 'x') + '#' + s.day + '#' + i, at: s.day + d.after }, d)); });
    if (eff.chain) s.events.chains.push({ id: eff.chain.id, at: s.day + eff.chain.after });
    if (eff.unlockDish) s.unlocked[eff.unlockDish] = true;
    if (eff.renew) { s.flags.renewed = true; if (!eff.borrowNeighbors) s.cash -= Cond.renewCost(s); else s.flags.neighborLoan = true; }
    if (eff.leave) { s.early = { day: s.day, reason: 'leave' }; if (s.mode === 'story' && ST.all.X_LEAVE) s.pending.splice(1, 0, { kind: 'story', id: 'X_LEAVE' }); }
    if (eff.recall) s.flags.recalled = true;
    if (eff.buyout) { s.flags.renewed = true; s.flags.owner = true; s.cash -= C.buyout.price; s.today.notes.push('铺面盘下来了，从此不用再看房东脸色'); }
    s.today.eventCash += s.cash - before;
  }
  function audit(s) {
    if (s.burn >= 40) { s.cash -= 30000; s.rep = clamp(s.rep - 3, 0, 100); s.burn = clamp(s.burn - 10, 0, 100); s.today.notes.push('检查发现问题，罚款整改'); }
    else if (s.burn >= 20) { s.rep = clamp(s.rep - 1, 0, 100); s.today.notes.push('检查提出整改意见'); }
    else { s.rep = clamp(s.rep + 2, 0, 100); s.today.notes.push('检查通过，门口贴了公示'); }
  }
  function applyDelayed(s, when) {
    var keep = [];
    s.events.delayed.forEach(function (d) {
      if (d.at <= s.day && s.executed.indexOf(d.uid) < 0) {
        var isPre = d.flow != null || d.cap != null;
        if ((when === 'pre') === isPre || when === 'any') {
          s.executed.push(d.uid);
          var eff = clone(d); delete eff.at; delete eff.after; delete eff.uid; var note = eff.note; delete eff.note;
          applyEffect(s, eff, 'delayed');
          if (note) s.today.notes.push(note);
          return;
        }
      }
      keep.push(d);
    });
    s.events.delayed = keep;
  }

  // ───────────────────────── 事件抽取（GDD §9.1）
  function eventEligible(s, e, phase) {
    if (e.phase !== phase || e.chainOnly || e.story || e.fixed) return false;
    if (e.once && s.events.seen.indexOf(e.id) >= 0) return false;
    if (s.events.cd[e.id] && s.day < s.events.cd[e.id]) return false;
    if (s.mode === 'week' && e.type === 'tense' && ['E05', 'E09', 'E08'].indexOf(e.id) >= 0) return false;
    if (!Cond.check(s, e.when)) return false;
    return true;
  }
  function rollEvent(s, phase) {
    if (s.today.preEvent || s.today.postEvent) return null;
    if (s.mode === 'story' && (ST.storyDays[s.day] || s.day === 1)) return null;
    // 连锁事件强制
    for (var i = 0; i < s.events.chains.length; i++) {
      var ch = s.events.chains[i], ev = E.byId[ch.id];
      if (ch.at <= s.day && ev.phase === phase && s.events.seen.indexOf(ch.id) < 0) { s.events.chains.splice(i, 1); return ch.id; }
    }
    if (s.mode === 'story' && s.day === 27 && phase === 'post') return 'E30';
    if (RNG.rand(s) >= C.eventChance * (phase === 'pre' ? 0.7 : 1.0)) return null;
    var pool = E.list.filter(function (e) { return eventEligible(s, e, phase); });
    var last = s.events.lastType;
    var pick = RNG.weighted(s, pool, function (e) {
      var w = e.w;
      if (last === 'tense') w *= e.type === 'relax' ? 2.2 : e.type === 'tense' ? 0.35 : 1;
      if (s.prefer.indexOf(e.id) >= 0) w *= 1.6;
      if (s.day <= 3 && e.type === 'tense') w *= 0.5;
      return w;
    });
    return pick ? pick.id : null;
  }
  function markSeen(s, id) {
    var e = E.byId[id];
    if (s.events.seen.indexOf(id) < 0) s.events.seen.push(id);
    if (e.cd) s.events.cd[id] = s.day + e.cd;
    s.events.lastType = e.type;
  }

  // ───────────────────────── 晨备
  function quote(s) {
    var th = theme(s);
    var ds = s.menu.map(function (id) { return D.byId[id]; });
    var priceMult = C.price.mult[s.price];
    var avgPrice = ds.length ? ds.reduce(function (n, d) { return n + Math.round(d.price * priceMult); }, 0) / ds.length : 0;
    var matMult = C.material.cost[s.material] * (th && th.mods.materialCost ? th.mods.materialCost[s.material] : 1);
    if (s.heirloom === 'H_BASKET' && s.day <= 3 && s.material >= 1) matMult *= 0.8;
    var avgCost = ds.length ? ds.reduce(function (n, d) { return n + d.cost * matMult; }, 0) / ds.length : 0;
    var fit = ds.length ? ds.reduce(function (n, d) { return n + d.fit[s.material] * d.pop; }, 0) / ds.length : 0;
    var flow = C.baseFlow * C.price.flow[s.price] * (C.repFlow.base + s.rep / C.repFlow.div) * fit * C.weatherFlow[s.today.weather];
    if (th && th.mods.flow) flow *= th.mods.flow;
    var cap = capacity(s);
    var expect = Math.max(1, Math.min(cap, flow)), hasOil = ds.some(function (d) { return d.oil; });
    var oilPer = C.oil.daily[s.oil] * (hasOil ? 1 : 0.3) / 100 / expect;
    return { avgPrice: avgPrice, avgCost: avgCost, oilPer: oilPer, flowLow: Math.round(flow * 0.9), flowHigh: Math.round(flow * 1.1 * 1.1), cap: cap, margin: avgPrice - avgCost - oilPer, fit: fit,
      risk: s.oil === 0 ? (s.oilStreak >= 1 ? 2 : 1) : 0, oilCost: C.oil.daily[s.oil] };
  }
  function totalStars(s) { var n = 0; for (var k in s.prof) n += s.prof[k].star; return n; }
  function capacity(s) {
    var cap = C.baseCapacity + (s.helper ? C.helper.capacity : 0) + (s.upgrades.indexOf('pot2') >= 0 ? 12 : 0) + (s.upgrades.indexOf('fire') >= 0 ? 8 : 0);
    cap += Math.min(C.starCapacity.max, Math.floor(totalStars(s) / C.starCapacity.per) * C.starCapacity.add);
    var th = theme(s); if (th && th.mods.capacity) cap += th.mods.capacity;
    if (perk(s, 'oldstove')) cap -= 10;
    return cap;
  }

  // 诚信、对手、升级带来的客流修正（D031–D033）
  function flowMods(s) {
    var m = 1 + Math.min(C.honesty.streakFlowMax, (s.stats.honestStreak || 0) * C.honesty.streakFlow);
    if (s.burn >= 50) m *= 1 - (s.burn - 50) / 320;
    if (s.upgrades.indexOf('sign') >= 0) m *= 1.1;
    var fe = festival(s); if (fe) m *= fe.flow;
    if (s.mode === 'story') { var r = rivalPhase(s); if (r === 'open') m *= C.rival.steal; if (r === 'back') m *= C.rival.back; }
    return m;
  }
  function festival(s) { if (s.mode !== 'story') return null; return C.festivals.filter(function (f) { return f.day === s.day; })[0] || null; }
  function lanternTier(burn) { var lv = 100 - burn; for (var i = 0; i < C.lanternTiers.length; i++) if (lv >= C.lanternTiers[i].min) return Object.assign({ idx: i }, C.lanternTiers[i]); return Object.assign({ idx: 4 }, C.lanternTiers[4]); }
  // 常客记得你（D037）：进门第一句话由过去的经历决定
  function greeting(s, id) {
    var st = s.regulars[id], r = R.byId[id];
    if (st.sick > 0 && st.lastSickDay >= s.day - 6) return { text: '上次吃完肚子疼…', mood: 'wary' };
    if (st.bad >= 2 && s.burn >= 30) return { text: '今天别糊弄我啊', mood: 'wary' };
    if (st.good >= 4 && s.burn < 30) return { text: '我把同事也带来了', mood: 'friend' };
    if (st.good >= 2) return { text: r.lines.order, mood: 'warm' };
    return { text: r.lines.order, mood: 'plain' };
  }
  function rivalPhase(s) { if (s.mode !== 'story') return null; if (s.day >= C.rival.open && s.day < C.rival.closed) return 'open'; if (s.day >= C.rival.closed && s.day < C.rival.closed + 3) return 'back'; return s.day >= C.rival.closed ? 'gone' : null; }
  // 吃坏肚子：确定性，浏览器/微信/模拟一致
  function sickRoll(s, orderId, cheats) {
    var p = cheats ? Math.min(0.85, C.honesty.sickBase + C.honesty.sickPer * (cheats - 1) + s.burn / C.honesty.sickBurnDiv) : (s.burn >= 60 ? 0.1 : 0);
    if (s.today) p = Math.min(0.85, p + (s.today.sickBoost || 0) + (s.today.fakeUsed ? 0.05 : 0));
    if (!p) return false;
    var h = RNG.hashSeed((s.seed * 131 + s.day * 7919 + String(orderId).split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0); }, 7)) >>> 0);
    return h / 4294967296 < p;
  }
  function upgradeById(id) { return C.upgrades.filter(function (u) { return u.id === id; })[0]; }

  // ───────────────────────── 营业结算（GDD §7）
  function settle(s, result) {
    var th = theme(s);
    var orders = (result && result.orders) || [];
    var grades = { sig: 0, home: 0, rush: 0, lost: 0 }, qsum = 0, qn = 0;
    orders.forEach(function (o) {
      grades[o.grade] = (grades[o.grade] || 0) + 1;
      if (o.grade !== 'lost') { qsum += o.quality; qn++; }
      (o.items || []).forEach(function (it) {
        if (o.grade === 'lost') return;
        var p = s.prof[it.id || it]; if (!p) return;
        p.n++; s.stats.cooked[it.id || it] = (s.stats.cooked[it.id || it] || 0) + 1;
        var st = 0; C.profThresholds.forEach(function (t) { if (p.n >= t) st++; }); p.star = st;
      });
    });
    var avgQ = qn ? qsum / qn : 0.7;
    s.stats.signature += grades.sig; s.stats.rushed += grades.rush;
    // 常客关系
    var visitorsServed = [];
    orders.forEach(function (o) {
      if (!o.regular) return;
      var st = s.regulars[o.regular]; if (!st) return;
      st.visits++; st.last = s.day;
      var gain = o.grade === 'sig' ? 0.85 : o.grade === 'home' ? 0.6 : o.grade === 'rush' ? 0.3 : -0.5;
      if (o.regular === 'song' && s.oil === 0 && s.oilStreak >= 2) gain -= 0.4;
      if (o.regular === 'zheng' && s.burn >= 40) gain -= 0.3;
      if (o.cheats) { st.bad = (st.bad || 0) + 1; gain -= 0.2; }
      if (o.sick) { st.sick = (st.sick || 0) + 1; st.lastSickDay = s.day; gain -= 1; }
      if (!o.cheats && !o.sick && (o.grade === 'sig' || o.grade === 'home')) st.good = (st.good || 0) + 1;
      st.aff = clamp(round1(st.aff + gain), 0, 7);
      if (o.grade !== 'lost') visitorsServed.push(o.regular);
    });
    // 客流
    var rnd = RNG.range(s, C.flowRandom[0], C.flowRandom[1]);
    var regularMod = 1 + Math.min(C.regularFlowCap, visitorsServed.length * 0.04 + Cond.affSum(s) * 0.004);
    var ds = s.menu.map(function (id) { return D.byId[id]; });
    var fit = ds.reduce(function (n, d) { var b = d.fit[s.material] * d.pop; if (th && th.mods.dishBoost && th.mods.dishBoost.indexOf(d.id) >= 0) b *= 1.25; var fz = festival(s); if (fz && fz.dishes.indexOf(d.id) >= 0) b *= fz.boost; return n + b; }, 0) / Math.max(1, ds.length);
    var flow = C.baseFlow * C.price.flow[s.price] * (C.repFlow.base + s.rep / C.repFlow.div) * regularMod * C.weatherFlow[s.today.weather] * s.today.flow * fit * rnd;
    if (th && th.mods.flow) flow *= th.mods.flow;
    if (s.burn >= 80) flow *= 0.92;
    if (s.heirloom === 'H_TEACUP') flow *= 1 + C.legacyFlowBonus;
    flow *= flowMods(s);
    if (s.today.closed) flow = 0;
    flow = Math.round(flow);
    var eff = 1 + (avgQ >= C.quality.signature ? C.qualityEff.signature : avgQ < C.quality.home ? C.qualityEff.rushed : 0);
    var cap = Math.max(0, Math.round((capacity(s) + s.today.cap) * eff));
    var served = Math.min(flow, cap), lost = Math.max(0, flow - cap) + grades.lost;
    // 菜品销量分配（按受欢迎度）
    var wsum = ds.reduce(function (n, d) { return n + d.pop * d.fit[s.material]; }, 0) || 1;
    var sales = [], left = served;
    ds.forEach(function (d, i) {
      var q = i === ds.length - 1 ? left : Math.round(served * d.pop * d.fit[s.material] / wsum);
      q = Math.min(q, left); left -= q;
      var price = Math.round(d.price * C.price.mult[s.price]) * 100;
      var matMult = C.material.cost[s.material] * (th && th.mods.materialCost ? th.mods.materialCost[s.material] : 1);
      if (s.heirloom === 'H_BASKET' && s.day <= 3 && s.material >= 1) matMult *= 0.8;
      var cost = Math.round(d.cost * 100 * matMult);
      sales.push({ id: d.id, qty: q, price: price, cost: cost });
    });
    var revenue = sales.reduce(function (n, x) { return n + x.qty * x.price; }, 0);
    var ingredient = sales.reduce(function (n, x) { return n + x.qty * x.cost; }, 0);
    var hasOil = ds.some(function (d) { return d.oil; });
    var oilCost = s.today.closed ? 0 : Math.round(C.oil.daily[s.oil] * (hasOil ? 1 : 0.3));
    var tips = grades.sig * C.tipSignature;
    var fixed = C.fixedCost + (perk(s, 'rent') ? 2000 : 0), wage = s.helper ? C.helper.wage : 0;
    var cheats = 0, sick = 0, cheatGain = 0, refunds = 0;
    orders.forEach(function (o) { cheats += o.cheats || 0; cheatGain += o.cheatGain || 0; if (o.sick) { sick++; refunds += o.refund || 0; } });
    var comboTips = Math.max(0, Math.round((result && result.comboTips) || 0)), maxCombo = (result && result.maxCombo) || 0;
    var cashBefore = s.cash;
    s.cash += revenue + tips + cheatGain + comboTips - refunds - ingredient - oilCost - fixed - wage;
    // 口碑
    var rep0 = s.rep, dRep = C.price.rep[s.price] + C.material.rep[s.material] + C.oil.rep[s.oil];
    dRep += grades.sig * C.qualityRep.signature / Math.max(1, orders.length) * 2 + grades.home * C.qualityRep.home / Math.max(1, orders.length) + grades.rush * C.qualityRep.rushed / Math.max(1, orders.length) * 2;
    dRep -= Math.floor(lost / C.lostPer) * C.lostRep * (perk(s, 'picky') ? 2 : 1);
    if (s.oil === 0 && s.oilStreak >= 2) dRep -= 0.5;
    if (s.burn >= 80) dRep -= 0.6;
    if (s.crisis.state === 'hold') dRep -= 0.6;
    dRep -= sick * C.honesty.sickRep + cheats * C.honesty.cheatRep;
    if (s.upgrades.indexOf('board') >= 0 && s.burn < 30) dRep += 0.3;
    if ((s.crisis.state === 'rectify' || s.crisis.state === 'refund') && (result && result.orders || []).every(function (o) { return !o.cheats; }) && s.oil > 0) dRep += 0.5; // 整改后坚持诚信：信任一点点回来
    if (s.today.closed) dRep = 0.2;
    s.rep = clamp(round1(s.rep + dRep), 0, 100);
    // 烧心：用油
    var b0 = s.burn;
    if (s.oil === 0) {
      s.oilStreak++; s.stats.recycleDays++;
      var add = s.oilStreak === 1 ? 0 : s.oilStreak === 2 ? C.burnOil.streak2 : Math.min(C.burnOil.cap, C.burnOil.streak3 + (s.oilStreak - 3) * C.burnOil.step);
      s.burn = clamp(s.burn + add, 0, 100);
    } else {
      s.oilStreak = 0;
      if (s.oil === 2) s.burn = clamp(s.burn - C.burnOil.newOilRelief, 0, 100);
    }
    // 烧心：捷径与吃坏肚子；诚信连续天数
    s.burn = clamp(s.burn + cheats * C.honesty.cheatBurn + sick * C.honesty.sickBurn, 0, 100);
    var honestToday = cheats === 0 && s.oil > 0 && s.burn < 30 && !s.today.closed;
    s.stats.honestStreak = honestToday ? (s.stats.honestStreak || 0) + 1 : 0;
    s.stats.cheats = (s.stats.cheats || 0) + cheats; s.stats.sick = (s.stats.sick || 0) + sick; s.stats.maxCombo = Math.max(s.stats.maxCombo || 0, maxCombo);
    if (s.stats.honestStreak === 5) s.today.notes.push('连着五天放心经营，街坊开始带朋友来了');
    if (sick) s.today.notes.push(sick + ' 位客人吃坏了肚子，退了钱，还发了差评');
    // 街头奇遇（只认今天安排的那一个）
    ((result && result.encounters) || []).forEach(function (en) {
      var q = Q.byId[en.id]; if (!q || s.today.encounter !== en.id || s.today.encounterDone) return;
      var ch = q.choices.filter(function (c) { return c.id === en.choice; })[0]; if (!ch) return;
      s.today.encounterDone = true; s.stats.encounters = (s.stats.encounters || []).concat([en.id + ':' + ch.id]);
      applyEffect(s, ch.effect, en.id); s.today.notes.push(q.name + '：' + ch.result);
    });
    // 夜间被动进账（D044）
    var passive = 0;
    if (!s.today.closed) {
      if (s.upgrades.indexOf('soymaker') >= 0 && s.burn < 50) passive += 1500;
      if (s.upgrades.indexOf('preorder') >= 0) passive += 300 * R.list.filter(function (r) { return s.regulars[r.id].aff >= 3; }).length;
    }
    s.cash += passive;
    // 每日目标（D042）
    var gx = { cheats: cheats, maxCombo: maxCombo, sig: grades.sig, lostOrders: grades.lost, orders: orders.length, served: served, happyRegulars: orders.filter(function (o) { return o.regular && (o.grade === 'sig' || o.grade === 'home') && !o.sick; }).length };
    var goalCash = 0, goals = (s.today.goals || []).map(function (g) { var def = GOALS.filter(function (x) { return x.id === g.id; })[0]; var ok = !!(def && def.test(gx, g)); if (ok) { goalCash += C.goals.reward; s.rep = clamp(s.rep + C.goals.rewardRep, 0, 100); } return Object.assign({}, g, { done: ok }); });
    if (goals.length && goals.every(function (g) { return g.done; })) goalCash += C.goals.allBonus;
    s.cash += goalCash; s.today.goals = goals;
    if (goals.length) s.stats.goalsDone = (s.stats.goalsDone || 0) + goals.filter(function (g) { return g.done; }).length;
    // 检查员突击（开门时已决定）
    if (s.today.raid === 'bad') { s.cash -= C.honesty.raidFine; s.rep = clamp(s.rep - 3, 0, 100); s.burn = clamp(s.burn - 10, 0, 100); s.today.notes.push('检查员突击：罚款 ' + C.honesty.raidFine / 100 + ' 元，责令整改'); }
    if (s.today.raid === 'good') { s.rep = clamp(s.rep + 2, 0, 100); s.today.notes.push('检查员突击：门口贴上了“放心早餐”'); s.flags.praised = (s.flags.praised || 0) + 1; }
    // 统计
    s.stats.tierDays.oil[s.oil]++; s.stats.tierDays.material[s.material]++; s.stats.tierDays.price[s.price]++;
    var good = (s.oil === 2 || s.material === 2) && !s.flags.additiveHidden;
    if (good) s.stats.goodDays++;
    s.stats.lostTotal += lost;
    if (lost === 0 && !s.today.closed) s.stats.noWaitDays++;
    s.stats.streak = grades.sig >= orders.length && orders.length ? s.stats.streak + 1 : 0;
    s.stats.bestStreak = Math.max(s.stats.bestStreak, s.stats.streak);
    var quoteLine = pickQuote(s, orders);
    s.ledger = {
      day: s.day, weather: s.today.weather, oil: s.oil, material: s.material, price: s.price, menu: s.menu.slice(),
      flow: flow, cap: cap, served: served, lost: lost, sales: sales, revenue: revenue, tips: tips, ingredient: ingredient, oilCost: oilCost,
      fixed: fixed, wage: wage, eventCash: 0, cashOpen: cashBefore, cashClose: s.cash, rep0: rep0, rep1: s.rep, burnUp: s.burn > b0,
      cheats: cheats, sick: sick, cheatGain: cheatGain, refunds: refunds, comboTips: comboTips, maxCombo: maxCombo, honestStreak: s.stats.honestStreak, raid: s.today.raid || null, burn: s.burn, passive: passive, goals: goals, goalCash: goalCash, delivery: s.today.delivery || null,
      overflow: Math.max(0, flow - cap), lostOrders: grades.lost, grades: grades, avgQ: Math.round(avgQ * 100) / 100, visitors: visitorsServed, quote: quoteLine, notes: s.today.notes.slice(), closed: s.today.closed
    };
  }
  function pickQuote(s, orders) {
    var o = orders.filter(function (x) { return x.regular; })[0];
    if (!o) return s.burn >= 60 ? '有人说：“最近味道变了。”' : '有街坊说：“明天还来。”';
    var r = R.byId[o.regular];
    if (s.burn >= 60 || o.sick) return r.name + '：“' + (o.sick ? '昨天吃完，肚子疼了一宿。' : '最近……味道好像不太对。') + '”';
    return r.name + '：“' + (o.grade === 'sig' ? r.lines.happy : o.grade === 'lost' ? r.lines.wait : r.lines.meh === undefined ? r.lines.happy : (o.grade === 'home' ? r.lines.happy : r.lines.meh)) + '”';
  }

  // ───────────────────────── 营业后队列
  function buildDusk(s) {
    var q = [];
    // 危机（GDD §7.6）
    if (s.burn >= 100 && s.crisis.state === 'none') {
      s.crisis.state = 'pending'; s.crisis.day = s.day;
      s.rep = clamp(s.rep + C.crisis.rep, 0, 100); s.cash += C.crisis.cash; s.today.eventCash += C.crisis.cash;
      q.push({ kind: 'crisis' });
    }
    applyDelayed(s, 'any');
    var post = rollEvent(s, 'post');
    if (post) { s.today.postEvent = post; q.push({ kind: 'event', id: post }); }
    // 常客节点（每日至多 2 个；灯笼冒烟以上时温情节点暂缓，评审 #5）
    var nodes = [];
    if (s.burn < 60) R.list.forEach(function (r) {
      var st = s.regulars[r.id];
      r.nodes.forEach(function (n, i) {
        if (st.aff >= n.aff && st.nodes.indexOf(i) < 0 && (i === 0 || st.nodes.indexOf(i - 1) >= 0)) nodes.push({ r: r.id, i: i, cs: n.cs });
      });
    });
    nodes.slice(0, s.mode === 'story' ? 2 : 1).forEach(function (n) { q.push({ kind: 'node', id: n.cs, who: n.r, idx: n.i }); });
    if (s.mode === 'story') {
      var sid = ST.storyDays[s.day];
      if (sid && ST.main[sid].phase === 'post') { s.today.story = sid; q.push({ kind: 'story', id: sid }); }
    }
    s.pending = q;
  }

  function prospectiveEnding(s) { return determineEnding(s).id; }

  // ───────────────────────── 结局判定（GDD §10.1）
  function determineEnding(s) {
    var days = Math.max(1, s.stats.tierDays.price.reduce(function (a, b) { return a + b; }, 0));
    if (s.crisis.state === 'hold' && (!s.early || s.early.reason === 'leave')) return { id: 'E_PILLS' };
    if (s.early) return { id: s.rep >= 60 ? 'E_FAREWELL' : 'E_TRANSFER' };
    // 真结局「最后一页」：对质时把账本摊开（连父亲的错一起认），收齐 6 页，赵爷爷的旧事听完，心里没鬼
    if (s.flags.truth && (s.pages || []).length >= 6 && s.burn <= 40 && s.rep >= 55 && s.crisis.state !== 'hold') return { id: 'E_TRUTH' };
    if ((s.crisis.state === 'rectify' || s.crisis.state === 'refund') && s.burn < 70 && s.rep >= 55) return { id: 'E_REOPEN' };
    var peopleNodes = R.list.filter(function (r) { return s.regulars[r.id].nodes.length > 0; }).length;
    var highShare = s.stats.tierDays.price[2] / days, lowShare = s.stats.tierDays.price[0] / days;
    var priv = s.rep >= 65 && peopleNodes >= 5 && highShare >= 0.45;
    var cant = s.rep >= 65 && s.regulars.man.aff >= 5 && lowShare >= 0.45;
    if (priv && cant) return { id: highShare >= lowShare ? 'E_PRIVATE' : 'E_CANTEEN' };
    if (priv) return { id: 'E_PRIVATE' };
    if (cant) return { id: 'E_CANTEEN' };
    if (s.rep >= 80 && s.burn <= 30 && s.stats.goodDays / days >= 0.6) return { id: 'E_HONEST' };
    return { id: 'E_SOMEONE', tier: s.rep < 50 ? 0 : s.rep < 70 ? 1 : 2 };
  }

  // ───────────────────────── 处理 pending 项
  function resolvePending(s, a) {
    var item = s.pending[0];
    if (!item) return false;
    var choiceId = a.choice;
    if (item.kind === 'event') {
      var ev = E.byId[item.id];
      var ch = ev.choices.filter(function (c) { return c.id === choiceId; })[0];
      if (!ch) return false;
      markSeen(s, ev.id);
      applyEffect(s, ch.effect, ev.id);
      s.keyChoices.push({ day: s.day, src: ev.id, title: ev.name, choice: ch.id, label: ch.label, weight: ev.type === 'tense' ? 3 : 1 });
      s.today.choices.push({ src: ev.id, label: ch.label, result: ch.result });
    } else if (item.kind === 'story') {
      var sc = ST.all[item.id];
      if (s.storySeen.indexOf(item.id) < 0) s.storySeen.push(item.id);
      if (choiceId) {
        var c2 = findStoryChoice(sc, choiceId, s);
        if (!c2) return false;
        if (c2.ev) { markSeen(s, c2.ev.id); }
        applyEffect(s, c2.effect, item.id);
        s.keyChoices.push({ day: s.day, src: item.id, title: sc.title || (c2.ev && c2.ev.name), choice: c2.id, label: c2.label, weight: 4 });
        s.today.choices.push({ src: item.id, label: c2.label, result: c2.result });
      } else if (storyHasChoice(sc)) return false;
      (a.unlocks || []).forEach(function (id) { s.unlocked[id] = true; });
      if (a.dungeon && JSON.stringify(sc.beats).indexOf('"dungeon"') >= 0) applyDungeon(s, a.dungeon, sc);
    } else if (item.kind === 'node') {
      var st = s.regulars[item.who];
      if (st.nodes.indexOf(item.idx) < 0) st.nodes.push(item.idx);
      if (s.nodesDone.indexOf(item.id) < 0) s.nodesDone.push(item.id);
      var nd = R.byId[item.who].nodes[item.idx];
      if (nd.unlock) s.unlocked[nd.unlock] = true;
      if (nd.rep) s.rep = clamp(s.rep + nd.rep, 0, 100);
      var sc3 = ST.all[item.id];
      if (choiceId) { var c3 = findStoryChoice(sc3, choiceId, s); if (c3) applyEffect(s, c3.effect, item.id); }
      if (JSON.stringify(sc3.beats).indexOf('"photo"') >= 0 && s.photos.indexOf(item.who) < 0) s.photos.push(item.who);
    } else if (item.kind === 'crisis') {
      var cc = C.crisisChoices[choiceId];
      if (!cc) return false;
      if (choiceId === 'rectify') { s.cash += cc.cash; s.burn = cc.burnTo; s.rep = clamp(s.rep + cc.rep, 0, 100); s.flags.closeToday = s.day + 1; s.crisis.state = 'rectify'; s.today.eventCash += cc.cash;  s.events.delayed.push({ uid: 'crisis-rectify', at: s.day + 5, rep: 6, note: '街坊说：这店真改了' }); }
      if (choiceId === 'refund') { s.cash += cc.cash; s.rep = clamp(s.rep + cc.rep, 0, 100); s.burn = clamp(s.burn + cc.burn, 0, 100); s.crisis.state = 'refund'; s.today.eventCash += cc.cash;
        s.events.delayed.push({ uid: 'crisis-refund', at: s.day + cc.delayDays, rep: Math.min(10, 2 + Math.round(Cond.affSum(s) / 6)), note: '街坊们又回来了' }); }
      if (choiceId === 'hold') { s.crisis.state = 'hold'; }
      s.keyChoices.push({ day: s.day, src: 'CRISIS', title: '危机夜', choice: choiceId, label: { rectify: '停业整改', refund: '挨家退款', hold: '硬撑' }[choiceId], weight: 5 });
    } else if (item.kind === 'rescue') {
      if (['sell', 'borrow', 'refuse'].indexOf(choiceId) < 0) return false;
      s.rescue.used = true; s.rescue.choice = choiceId;
      if (choiceId === 'sell') { s.cash += C.rescue.sell; if (s.helper) s.helper = false; else s.flags.soldEquipment = true; }
      if (choiceId === 'borrow') { s.cash += C.rescue.borrow; s.flags.debt = C.rescue.repay; }
      if (choiceId === 'refuse') s.rescue.refused = true;
      s.keyChoices.push({ day: s.day, src: 'RESCUE', title: '房东通牒', choice: choiceId, label: { sell: '卖掉设备', borrow: '街坊短借', refuse: '不借' }[choiceId], weight: 4 });
    }
    if ((item.kind === 'story' || item.kind === 'node') && ST.all[item.id]) grantPages(s, ST.all[item.id]);
    s.pending.shift();
    return true;
  }
  // 副本结算（凌晨早市）：坏料每样省 15 元、烧心 +3；全挑好料且基本买齐 → 老秦好感、口碑；没买到太多 → 口碑 −1
  function applyDungeon(s, r, sc) {
    var good = Math.max(0, Math.min(8, r.good | 0)), bad = Math.max(0, Math.min(8 - good, r.bad | 0)), missed = 8 - good - bad;
    var e = { cash: bad * 1500, burn: bad * 3 };
    if (!bad && missed <= 1) { e.rep = 1; e.aff = { qin: 1 }; e.flag = { marketClean: true }; }
    if (missed >= 4) e.rep = (e.rep || 0) - 1;
    applyEffect(s, e, sc.id);
    s.dungeons = s.dungeons || {}; s.dungeons[r.id || 'market'] = { good: good, bad: bad, missed: missed };
    s.keyChoices.push({ day: s.day, src: sc.id, title: '凌晨早市', choice: 'market', label: '好料 ' + good + ' · 坏料 ' + bad, weight: bad >= 3 ? 4 : 2 });
  }
  // 账本缺页：剧本里的 { page: n } 指令（不放在条件分支里），结算时记入 s.pages
  function grantPages(s, sc) {
    if (!s.pages) s.pages = [];
    sc.beats.forEach(function (b) { if (b.page && s.pages.indexOf(b.page) < 0) { s.pages.push(b.page); s.pages.sort(); } });
  }
  function storyHasChoice(sc) { return JSON.stringify(sc.beats).indexOf('"choice"') >= 0 || JSON.stringify(sc.beats).indexOf('eventChoice') >= 0; }
  function findStoryChoice(sc, id, s) {
    var found = null;
    (function walk(beats) {
      beats.forEach(function (b) {
        if (found) return;
        if (b.choice) b.choice.forEach(function (c) { if (c.id === id) found = c; });
        if (b.eventChoice) { var ev = E.byId[b.eventChoice]; ev.choices.forEach(function (c) { if (c.id === id) found = Object.assign({ ev: ev }, c); }); }
        if (b.then) walk(b.then);
        if (b.else) walk(b.else);
      });
    })(sc.beats);
    if (found && found.when && !Cond.check(s, found.when)) return null;
    return found;
  }

  // ───────────────────────── 下一阶段推进
  function advanceAfterPending(s) {
    if (s.pending.length) return;
    if (s.phase === 'dawn') s.phase = 'prep';
    else if (s.phase === 'open') s.phase = 'service';
    else if (s.phase === 'dusk') finishDay(s);
  }
  function finishDay(s) {
    if (s.ledger) { s.ledger.eventCash = s.today.eventCash; s.ledger.cashClose = s.cash; s.ledger.rep1 = s.rep; s.ledger.choices = s.today.choices.slice(); s.ledger.notes = s.today.notes.slice(); }
    s.phase = 'ledger';
  }

  function nextDay(s) {
    applyChores(s);
    s.history.push(s.ledger);
    // 破产判定（GDD §7.7）
    s.negativeDays = s.cash < 0 ? s.negativeDays + 1 : 0;
    var endNow = false;
    if (s.cash < 0 && s.rescue.refused && s.rescue.pendingDay <= s.day) endNow = true;
    if (s.negativeDays >= 2 && !s.rescue.used && s.rescue.pendingDay == null) s.rescue.pendingDay = s.day + 1;
    if (s.negativeDays >= 3 && s.rescue.used && s.rescue.choice !== 'refuse') endNow = true;
    if (endNow && !s.early) s.early = { day: s.day, reason: 'bankrupt' };
    if (s.early || s.day >= s.days) {
      if (s.flags.debt && !s.early) { s.cash -= s.flags.debt; s.flags.debtPaid = true; }
      s.phase = 'ended';
      if (s.mode === 'story') s.ending = determineEnding(s);
      return;
    }
    s.day++;
    beginDay(s);
  }

  // ───────────────────────── reducer
  function reduce(state, a) {
    if (!state || !a || !a.t) return state;
    var s = clone(state), ok = true;
    switch (a.t) {
      case 'resolve':
        if (['dawn', 'open', 'dusk'].indexOf(s.phase) < 0) return state;
        ok = resolvePending(s, a); if (!ok) return state;
        advanceAfterPending(s);
        break;
      case 'tier':
        if (s.phase !== 'prep' || ['oil', 'material', 'price'].indexOf(a.key) < 0 || [0, 1, 2].indexOf(a.v) < 0) return state;
        s[a.key] = a.v;
        if (a.key === 'material') s.menu = s.menu.filter(function (id) { return !dishLockedToday(s, D.byId[id]); });
        break;
      case 'dish':
        if (s.phase !== 'prep' || !D.byId[a.id]) return state;
        var d = D.byId[a.id];
        if (s.menu.indexOf(a.id) >= 0) { if (s.menu.length <= 1) return state; s.menu = s.menu.filter(function (x) { return x !== a.id; }); }
        else { if (!dishAvailable(s, d) || dishLockedToday(s, d) || s.menu.length >= menuSize(s)) return state; s.menu.push(a.id); }
        break;
      case 'yesterday':
        if (s.phase !== 'prep' || !s.history.length) return state;
        var y = s.history[s.history.length - 1];
        s.oil = y.oil; s.material = y.material; s.price = y.price;
        s.menu = y.menu.filter(function (id) { return dishAvailable(s, D.byId[id]) && !dishLockedToday(s, D.byId[id]); });
        if (!s.menu.length) s.menu = ['congee'];
        break;
      case 'buy':
        var u = upgradeById(a.id);
        if (s.phase !== 'prep' || !u || s.upgrades.indexOf(a.id) >= 0 || s.cash < u.cost) return state;
        s.cash -= u.cost; s.upgrades.push(a.id);
        if (a.id === 'helper') s.helper = true;
        break;
      case 'delivery':
        if (s.phase !== 'prep' || !resolveDelivery(s, a.accept, a.tested)) return state;
        break;
      case 'chore':
        if (s.phase !== 'ledger' || !s.chores || !C.chores.some(function (c) { return c.id === a.id; })) return state;
        s.chores.plan[a.id] = !!a.on;
        break;
      case 'confirmPrep':
        if (s.phase !== 'prep' || !s.menu.length) return state;
        if (s.today.delivery && s.today.delivery.state === 'pending') resolveDelivery(s, true, false);
        pickVisitors(s);
        if (s.day >= 5 && !s.today.closed) { var rr = RNG.rand(s), tier = lanternTier(s.burn); s.today.raid = tier.raid && !(s.flags.lastRaid > s.day - 4) ? (rr < tier.raid ? 'bad' : null) : s.burn < 20 && rr < 0.12 ? 'good' : null; if (s.today.raid) s.flags.lastRaid = s.day; }
        if (s.day >= 2 && !s.today.closed && RNG.rand(s) < C.encounterChance) { var seenQ = s.stats.encounters || [], poolQ = Q.list.filter(function (q) { return !seenQ.some(function (x) { return x.indexOf(q.id + ':') === 0; }); }); if (!poolQ.length) poolQ = Q.list; s.today.encounter = RNG.pick(s, poolQ).id; }
        var pre = rollEvent(s, 'pre');
        s.pending = [];
        if (pre) { s.today.preEvent = pre; s.pending.push({ kind: 'event', id: pre }); }
        s.phase = s.pending.length ? 'open' : 'service';
        if (s.today.closed) { s.pending = []; s.phase = 'service'; }
        break;
      case 'serviceDone':
        if (s.phase !== 'service') return state;
        settle(s, a.result || { orders: [] });
        buildDusk(s);
        s.phase = 'dusk';
        advanceAfterPending(s);
        break;
      case 'leisure':
        if (s.phase !== 'ledger' || s.today.leisure || !s.regulars[a.who] || (s.ledger.visitors || []).indexOf(a.who) < 0) return state;
        s.today.leisure = { who: a.who, win: !!a.win };
        s.regulars[a.who].aff = clamp(round1(s.regulars[a.who].aff + (a.win ? 0.4 : 0.15)), 0, 7);
        s.ledger.leisure = s.today.leisure;
        break;
      case 'nextDay':
        if (s.phase !== 'ledger') return state;
        nextDay(s);
        break;
      default: return state;
    }
    return s;
  }

  // 当日代表性订单（UI 按此生成顾客）。确定性：基于 seed 与日期。
  function planOrders(s) {
    var holder = { rng: RNG.hashSeed(s.seed * 31 + s.day * 977) };
    var n = s.today.closed ? 0 : C.service.ordersByDay(s.day);
    if (s.mode === 'week') n = 10;
    var menu = s.menu.slice(), out = [];
    var visitors = s.today.visitors.slice();
    var firstOrders = s.mode === 'story' && s.day === 1, t = 0;
    for (var i = 0; i < n; i++) {
      var reg = null;
      if (visitors.length && (i === 0 || i === 2 || i === 4 || i >= n - visitors.length)) reg = visitors.shift();
      var items = [];
      var size = s.day <= 2 ? 1 + (i === 0 && firstOrders ? 1 : 0) : 1 + Math.floor(RNG.rand(holder) * Math.min(3, menu.length === 1 ? 1 : 2.4));
      if (reg) {
        var favs = R.byId[reg].fav.filter(function (id) { return menu.indexOf(id) >= 0; });
        if (favs.length) items.push(favs[0]);
      }
      if (firstOrders && i === 0) items = menu.indexOf('congee') >= 0 && menu.indexOf('youtiao') >= 0 ? ['congee', 'youtiao'] : [menu[0]];
      // 首次出现的新菜必须亲手做：优先放入
      menu.forEach(function (id) { if (!s.prof[id].n && items.length < size && items.indexOf(id) < 0 && out.every(function (o) { return o.items.indexOf(id) < 0; })) items.push(id); });
      while (items.length < size) { var pick = RNG.pick(holder, menu); if (items.indexOf(pick) < 0 || menu.length === 1) items.push(pick); else if (items.length >= menu.length) break; }
      if (!items.length) items.push(menu[0]);
      var ph = i / Math.max(1, n), rushNow = !firstOrders && s.day > 1 && ph >= 0.3 && ph < 0.75;
      t += i === 0 ? 0.5 : firstOrders ? 9 : rushNow ? 2.5 + RNG.rand(holder) * 1.5 : 6 + RNG.rand(holder) * 3;
      out.push({ id: 'o' + (i + 1), regular: reg, items: items.slice(0, 3), arrive: Math.round(t * 10) / 10, rush: rushNow });
    }
    while (visitors.length && out.length) { out[out.length - 1].regular = visitors.shift(); }
    // 常客带朋友来：多一单
    var extra = [];
    out.forEach(function (o, i) { if (o.regular && greeting(s, o.regular).mood === 'friend') extra.push({ at: i + 1, o: { id: o.id + 'f', regular: null, friendOf: o.regular, items: o.items.slice(0, 2), arrive: o.arrive + 1.5, rush: o.rush } }); });
    extra.reverse().forEach(function (e) { out.splice(e.at, 0, e.o); });
    var fz = festival(s);
    if (fz) out.forEach(function (o, i) { if (i % 2 === 0) { var fd = fz.dishes.filter(function (id) { return menu.indexOf(id) >= 0; })[0]; if (fd && o.items.indexOf(fd) < 0) o.items[o.items.length - 1] = fd; } });
    return out;
  }

  function likelyVisitors(s) { return R.list.map(function (r) { return { id: r.id, w: regularWeight(s, r) }; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 3).map(function (x) { return x.id; }); }
  return {
    likelyVisitors: likelyVisitors, choreCost: choreCost, perk: perk, GOALS: GOALS, sickRoll: sickRoll, festival: festival, lanternTier: lanternTier, greeting: greeting, flowMods: flowMods, rivalPhase: rivalPhase, upgradeById: upgradeById,
    SCHEMA: SCHEMA, create: create, reduce: reduce, quote: quote, capacity: capacity, availableDishes: availableDishes, dishAvailable: dishAvailable,
    dishLockedToday: dishLockedToday, menuSize: menuSize, planOrders: planOrders, determineEnding: determineEnding, prospectiveEnding: prospectiveEnding,
    findStoryChoice: findStoryChoice, theme: theme, totalStars: totalStars
  };
});
