// 开发/测试：自动操作。Bot 通过与玩家相同的指针事件（逻辑坐标）操作界面——点器具、拖料、画圈、按住倾倒、滑动、看准时机、拖托盘交付、推进剧情、做选择。
BSX.define('dev/autoplay', function (require) {
  var Run = require('core/run');
  var D = require('content/dishes');
  var E = require('content/events');
  var ST = require('content/story');
  var Cook = require('game/cooking');
  var U = require('ui/ui');
  var POL = {
    average: { tiers: { oil: 1, material: 1, price: 1 }, prefer: { S26: 'renew' }, skill: 'good' },
    canteen: { tiers: { oil: 1, material: 1, price: 0 }, prefer: { E07: 'ask', E12: 'help', E29: 'take', E20: 'free', E03: 'more', E05: 'refuse', E14: 'refuse', S12: 'paper', S18: 'cook', S26: 'renew', E22: 'hire' }, skill: 'good' },
    honest: { buy: ['board', 'tables', 'sign', 'helper'], tiers: { oil: 2, material: 2, price: 1 }, admit: true, prefer: { S02: 'refuse', S24: 'confront', E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'post', S26: 'buy', E08: 'public', E04: 'show', E22: 'hire', E11: 'some' }, skill: 'great', menu: ['pidan', 'shengjian', 'congee', 'soy'] },
    pills: { tiers: { oil: 0, material: 0, price: 1 }, prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S12: 'cheap', S26: 'renew', CRISIS: 'hold', E23: 'deny', E18: 'go', E10: 'risk', E04: 'delay', E08: 'silent' }, skill: 'sloppy' },
    black: { tiers: { oil: 0, material: 0, price: 1 }, prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S02: 'take', S24: 'deal', S12: 'cheap', S04: 'compete', S26: 'renew', CRISIS: 'hold', E23: 'deny', E18: 'go', E04: 'delay', E08: 'silent' }, skill: 'good', cheat: 0.85, greedy: true, buy: ['fire', 'tray'] },
    neglect: { tiers: { oil: 1, material: 1, price: 1 }, prefer: { S26: 'renew' }, skill: 'sloppy', idle: 0.12 },
    chef: { tiers: { oil: 2, material: 2, price: 1 }, prefer: { S12: 'paper', S26: 'renew' }, skill: 'great', menu: ['chicken', 'mutton', 'pidan', 'shengjian'] },
    farewell: { tiers: { oil: 1, material: 1, price: 1 }, prefer: { S26: 'leave', E22: 'no' }, skill: 'good' }
  };
  function choose(s, item, pol, dir) {
    var want = pol.prefer[item.kind === 'crisis' ? 'CRISIS' : item.kind === 'rescue' ? 'RESCUE' : item.id];
    var list = dir && dir.choice ? dir.choice.list : [];
    var pick = list.filter(function (c) { return c.id === want; })[0] || list[0];
    return pick;
  }
  // ───────── 无界面快速推进（开发命令）
  function simTo(app, stopFn, policy) {
    var sim = { play: null };
    var pol = POL[policy || 'average'];
    var s = app.state || Run.create({ seed: 1 }), guard = 0;
    while (!stopFn(s) && s.phase !== 'ended' && guard++ < 3000) {
      if (['dawn', 'open', 'dusk'].indexOf(s.phase) >= 0) {
        var it = s.pending[0], c;
        var want = pol.prefer[it.kind === 'crisis' ? 'CRISIS' : it.kind === 'rescue' ? 'RESCUE' : it.id];
        if (it.kind === 'crisis') c = want || 'rectify'; else if (it.kind === 'rescue') c = want || 'borrow';
        else if (it.kind === 'event') { var ev = E.byId[it.id]; c = ev.choices.some(function (x) { return x.id === want; }) ? want : ev.choices[0].id; }
        else { var sc = ST.all[it.id]; c = want && Run.findStoryChoice(sc, want, s) ? want : undefined; if (!c) { var m = /"(?:choice)":\[\{"id":"(\w+)"/.exec(JSON.stringify(sc.beats)); if (m && Run.findStoryChoice(sc, m[1], s)) c = m[1]; else if (JSON.stringify(sc.beats).indexOf('eventChoice') >= 0) c = E.byId['E20'].choices[0].id; else if (m) { var all = []; JSON.stringify(sc.beats).replace(/"id":"(\w+)"/g, function (_, id) { all.push(id); }); c = all.filter(function (id) { return Run.findStoryChoice(sc, id, s); })[0]; } } }
        var n = Run.reduce(s, { t: 'resolve', choice: c, dungeon: it.id === 'S03' ? { id: 'market', good: 7, bad: 0 } : it.id === 'S15' ? { id: 'check', found: 7 } : it.id === 'S24' && c === 'confront' ? { id: 'face', score: 2 } : undefined }); if (n === s) throw new Error('autoplay stuck ' + JSON.stringify(it)); s = n;
      } else if (s.phase === 'prep') {
        ['oil', 'material', 'price'].forEach(function (k) { s = Run.reduce(s, { t: 'tier', key: k, v: pol.tiers[k] }); });
        s = Run.reduce(s, { t: 'confirmPrep' });
      } else if (s.phase === 'service') {
        var orders = Run.planOrders(s).map(function (o, i) { var g = i % 3 === 0 ? 'sig' : 'home'; return { id: o.id, regular: o.regular, items: o.items, grade: g, quality: g === 'sig' ? 0.92 : 0.75 }; });
        s = Run.reduce(s, { t: 'serviceDone', result: { orders: orders } });
      } else if (s.phase === 'ledger') s = Run.reduce(s, { t: 'nextDay' });
    }
    app.state = s; app.save(); if (s.phase === 'ended') app.onEnded(); app.route();
  }
  function fastForward(app, day, policy) { simTo(app, function (s) { return s.day >= day && s.phase === 'prep'; }, policy); }
  function toEnding(app, policy) { simTo(app, function () { return false; }, policy); }

  // ───────── 界面级机器人
  function Bot(app, opts) { this.app = app; this.o = opts || {}; this.pol = POL[this.o.policy || 'average']; this.q = []; this.wait = 0; this.log = []; this.t = 0; this.stats = { taps: 0, gestures: {}, dishes: 0, delivered: 0, choices: [] }; this.stopAt = this.o.stopAt || null; }
  var B = Bot.prototype;
  B.ev = function (type, x, y, delay) { this.q.push({ type: type, x: x, y: y, d: delay || 0 }); };
  B.tap = function (x, y, delay) { this.ev('down', x, y, delay || 0.08); this.ev('up', x, y, 0.06); this.stats.taps++; };
  B.tapHit = function (id, delay) { var h = U.hits.filter(function (z) { return z.id === id && !z.disabled; })[0]; if (!h) return false; this.tap(h.x + h.w / 2, h.y + h.h / 2, delay); return true; };
  B.update = function (dt) {
    this.t += dt;
    if (this.q.length) { this.wait -= dt; if (this.wait <= 0) { var e = this.q.shift(); var v = this.app.view; this.app.input(e.type, e.x * v.s + v.ox, e.y * v.s + v.oy); this.wait = this.q.length ? this.q[0].d : 0; } return; }
    if (this.wait > 0) { this.wait -= dt; return; }
    this.think();
  };
  B.g = function (k) { this.stats.gestures[k] = (this.stats.gestures[k] || 0) + 1; };
  B.think = function () {
    var app = this.app, scr = app.overlay || app.screen;
    if (!scr) return;
    if (this.stopAt && this.stopAt(app)) { this.done = true; return; }
    var name = scr.name, s = app.state;
    if (name === 'loading') { this.wait = 0.2; if (scr.state === 'done') this.tapHit('load_enter'); return; }
    if (name === 'intro') { this.tapHit('intro_skip'); this.wait = 0.5; return; }
    if (name === 'pause' && !this.o.keepPause) { this.tapHit('pause_resume'); return; }
    if (name === 'encounter') { var d0 = scr.describe(); if (d0.picked) { this.tapHit('enc_close'); this.wait = 0.3; return; } var qq = BSX.require('content/encounters').byId[d0.id], greedy = this.pol.greedy; var pk = qq.choices.slice().sort(function (x, y) { return greedy ? (y.effect.cash || 0) - (x.effect.cash || 0) : (x.effect.burn || 0) - (y.effect.burn || 0) || (y.effect.rep || 0) - (x.effect.rep || 0); })[0]; this.stats.choices.push(qq.id + ':' + pk.id); this.tapHit('enc_' + pk.id, 0.4); this.wait = 0.6; return; }
    if (name === 'leisure') { var d1 = scr.describe(); if (d1.done) this.tapHit('rps_close'); else this.tapHit('rps_' + ['rock', 'scissors', 'paper'][Math.floor(Math.random() * 3)], 0.3); this.g('leisure'); this.wait = 0.4; return; }
    if (name === 'shop') { var want = (this.pol.buy || []).filter(function (id) { return s.upgrades.indexOf(id) < 0; }); var aff = want.filter(function (id) { return s.cash >= BSX.require('core/run').upgradeById(id).cost + 40000; })[0]; if (aff) { this.tapHit('buy_' + aff); this.stats.choices.push('buy:' + aff); } else { this.tapHit('shop_close'); this.shopDay = s.day; } this.wait = 0.3; return; }
    if (name === 'delivery') {
      var dd = scr.describe(), sly = this.pol.cheat || this.pol.greedy;
      if (dd.done) { this.wait = 0.5; return; }
      if (!sly && !dd.tested) { var sx = dd.strip.x, sy = dd.strip.y, tx = dd.target.x, ty = dd.target.y; this.ev('down', sx, sy, 0.1); for (var k = 1; k <= 8; k++) this.ev('move', sx + (tx - sx) * k / 8, sy + (ty - sy) * k / 8, 0.03); this.ev('up', tx, ty, 0.05); this.g('test'); this.wait = 0.4; return; }
      var fk = dd.tested ? dd.fake : false; this.stats.choices.push('dlv:' + (sly || !fk ? 'accept' : 'reject')); this.tapHit(sly || !fk ? 'dlv_accept' : 'dlv_reject', 0.3); this.wait = 0.5; return;
    }
    if (name === 'chores') {
      var dc = scr.describe(), lazy = !!this.pol.cheat;
      var flip = ['hood', 'waste', 'sanitize'].filter(function (c) { return dc.plan[c] === lazy; })[0];
      if (flip) { this.tapHit('chore_' + flip); this.wait = 0.2; return; }
      this.tapHit('chores_done'); this.wait = 0.5; return;
    }
    if (name === 'origin') { this.tapHit('origin_go'); this.wait = 0.5; return; }
    if (name === 'title') { if (!this.tapHit('title_continue')) this.tapHit('title_start'); this.wait = 0.5; return; }
    if (name === 'newMonth') { this.tapHit('nm_go'); this.wait = 0.5; return; }
    if (name === 'prep') return this.prep(scr, s);
    if (name === 'service') return this.service(scr, s);
    if (name === 'story') return this.story(scr, s);
    if (name === 'ledger') { this.wait = 0.4; if (!s.today.leisure && this.tapHit('ledger_leisure')) return; if (this.pol.cheat && s.chores && s.chores.plan.hood && this.tapHit('ledger_chores')) return; this.tapHit('ledger_next'); return; }
    if (name === 'ending' || name === 'weekResult') { this.done = true; return; }
    this.wait = 0.3;
  };
  B.prep = function (scr, s) {
    var pol = this.pol, self = this;
    if (scr.tutorial >= 0 && scr.tutorial < 3) { var k = ['oil', 'material', 'price'][scr.tutorial]; this.tapHit('tier_' + k + '_' + pol.tiers[k]); this.wait = 0.3; return; }
    for (var k2 in pol.tiers) if (s[k2] !== pol.tiers[k2]) { this.tapHit('tier_' + k2 + '_' + pol.tiers[k2]); this.wait = 0.3; return; }
    if (pol.menu) { var want = pol.menu.filter(function (id) { return Run.availableDishes(s).some(function (d) { return d.id === id; }); }); var add = want.filter(function (id) { return s.menu.indexOf(id) < 0; })[0]; if (add && s.menu.length < Run.menuSize(s)) { this.tapHit('dish_' + add); this.wait = 0.2; return; } var extra = s.menu.filter(function (id) { return want.indexOf(id) < 0; })[0]; if (extra && add) { this.tapHit('menu_' + extra); this.wait = 0.2; return; } }
    if (this.o.tryNewDishes) { var nd = Run.availableDishes(s).filter(function (d) { return !s.prof[d.id].n && s.menu.indexOf(d.id) < 0; })[0]; if (nd && s.menu.length >= Run.menuSize(s)) { var old = s.menu.filter(function (id) { return s.prof[id].n >= 1; })[0]; if (old) { this.tapHit('menu_' + old); this.wait = 0.2; return; } } if (nd && s.menu.length < Run.menuSize(s)) { this.tapHit('dish_' + nd.id); this.wait = 0.2; return; } }
    if (this.shopDay !== s.day && (this.pol.buy || []).some(function (id) { return s.upgrades.indexOf(id) < 0 && s.cash >= BSX.require('core/run').upgradeById(id).cost + 40000; }) && this.tapHit('prep_shop')) { this.wait = 0.3; return; }
    this.tapHit('prep_open'); this.wait = 0.6;
  };
  B.story = function (scr, s) {
    var d = scr.dir; if (!d) { this.wait = 0.2; return; }
    if (d.mini && d.mini.describe().face) {
      var fm = d.mini.describe();
      if (fm.over) { this.tapHit('face_done'); this.wait = 0.8; return; }
      if (fm.state === 'claim') { var adm = this.pol.admit; var c = fm.cards.filter(function (x) { return fm.ok.indexOf(x) >= 0 && (x !== 'admit' || adm); })[0]; if (c == null) c = fm.cards.filter(function (x) { return x !== 'admit'; })[0] || fm.cards[0]; this.g('face_pick'); this.tapHit('face_' + c, 0.7); this.wait = 1.2; return; }
      this.tapHit('face_next', 0.6); this.wait = 0.8; return;
    }
    if (d.mini && d.mini.describe().todo) {
      var cm = d.mini.describe(), lazy = this.pol.cheat || this.pol.greedy;
      if (cm.over) { this.tapHit('ck_done'); this.wait = 0.8; return; }
      if (cm.todo.length && !(lazy && 9 - cm.todo.length >= 3)) { this.g('check_find'); this.tap(cm.todo[0].x, cm.todo[0].y, 0.1); this.wait = 0.6; return; }
      this.wait = 0.5; return;
    }
    if (d.mini) {
      var mm = d.mini.describe(), greedy = this.pol.cheat || this.pol.greedy;
      if (mm.over) { this.tapHit('mk_done'); this.wait = 0.8; return; }
      var tgt = mm.slots.filter(function (x) { return x && x.ready && (greedy || !x.bad); })[0];
      if (tgt) { this.g('market_pick'); this.tapHit('mk_slot' + tgt.i, 0.15); this.wait = 0.35; return; }
      this.wait = 0.2; return;
    }
    if (d.act) {
      var a = d.describe().act; this.g('story_' + a.kind);
      if (a.kind === 'tap') this.tap(a.x, a.y, 0.2);
      else if (a.kind === 'hold') { this.ev('down', a.x, a.y, 0.2); this.ev('up', a.x, a.y, 1.3); }
      else { this.ev('down', a.x - 120, a.y, 0.2); for (var i = 1; i <= 6; i++) this.ev('move', a.x - 120 + i * 40, a.y, 0.03); this.ev('up', a.x + 120, a.y, 0.03); }
      this.wait = 0.4; return;
    }
    if (d.choice) {
      var item = scr.item, pick = choose(s, item, this.pol, d);
      if (this.tapHit('choice_' + pick.id, 0.3)) this.stats.choices.push((item.id || item.kind) + ':' + pick.id);
      this.wait = 0.5; return;
    }
    if (d.line || d.ov) { this.tap(640, 400, this.o.fast ? 0.05 : 0.35); this.wait = d.ov ? 0.6 : 0.1; return; }
    this.wait = 0.2;
  };
  B.service = function (scr, s) {
    if (this.pol.idle && !scr.done && Math.random() < this.pol.idle) { this.wait = 3; return; }
    var k = scr.kitchen, G = k.geometry(), self = this, skill = this.pol.skill;
    if (scr.closed) { this.tapHit('svc_closed_done'); this.wait = 0.5; return; }
    if (scr.done) { if (scr.endT > 0.7) this.tapHit('svc_done'); this.wait = 0.3; return; }
    // 近景中：执行当前手势
    if (scr.enc && scr.enc.state === 'stand' && this.tapHit('encounter')) { this.wait = 0.3; return; }
    if (k.open && k.open.job) {
      var st = k.open, step = k.stepOf(st), js = st.job.s, V = G.vessel;
      if (!st.job.mat) { var cheapPick = this.pol.cheat && Math.random() < this.pol.cheat; this.tapHit(cheapPick ? 'mat_cheap' : 'mat_good', 0.1); if (cheapPick) this.g('cheat'); this.wait = 0.25; return; }
      this.g(js.g);
      if (js.g === 'drag') {
        var src = step.key === 'scoop' ? { x: V.x, y: V.y } : G.source, tg = step.key === 'scoop' ? G.bowl : V;
        this.ev('down', src.x, src.y, 0.15); for (var i = 1; i <= 8; i++) this.ev('move', src.x + (tg.x - src.x) * i / 8, src.y + (tg.y - src.y) * i / 8, 0.03); this.ev('up', tg.x, tg.y, 0.05);
      } else if (js.g === 'circle') {
        if (k.assist) { var dk = js.dots % 3, aa = -Math.PI / 2 + dk * Math.PI * 2 / 3; this.tap(V.x + Math.cos(aa) * V.r * 0.7, V.y + Math.sin(aa) * V.r * 0.7, 0.15); }
        else { var r = V.r * 0.6, a0 = 0, w = skill === 'sloppy' ? 9 : 4.5, n = Math.ceil(step.turns * 2 * Math.PI / (w / 60)) + 6; this.ev('down', V.x + r, V.y, 0.1); for (var j = 1; j <= n; j++) { var ang = a0 + j * w / 60; this.ev('move', V.x + Math.cos(ang) * r, V.y + Math.sin(ang) * r, 1 / 60); } this.ev('up', V.x + r, V.y, 0.02); }
      } else if (js.g === 'hold') {
        var b = step.band, target = skill === 'sloppy' ? b[1] + 0.08 : (b[0] + b[1]) / 2, rate = step.rate * (k.assist ? 0.6 : 1), dur = Math.max(0.05, (target - js.level) / rate);
        this.ev('down', 640, 420, 0.1); this.ev('up', 640, 420, dur);
      } else if (js.g === 'swipe') {
        var hz = step.dir === 'h', sx = hz ? V.x - 130 : V.x, sy = hz ? V.y - 40 : V.y + 80;
        this.ev('down', sx, sy, 0.15); for (var q = 1; q <= 6; q++) this.ev('move', hz ? sx + q * 45 : sx, hz ? sy : sy - q * 32, 0.03); this.ev('up', hz ? sx + 270 : sx, hz ? sy : sy - 192, 0.03);
      } else if (js.g === 'timing') {
        var win = k.windowFor(st.job, step), aim = skill === 'sloppy' ? win[1] + 0.12 : skill === 'great' ? (win[0] + win[1]) / 2 : win[0] + (win[1] - win[0]) * 0.4;
        if (js.p >= aim) { this.tap(V.x, V.y, 0.02); }
        else if (step.bg && (aim - js.p) * step.dur > 1.2 && this.otherWork(scr)) { this.tapHit('closeup_close', 0.05); }
        else this.wait = 1 / 30;
      }
      this.wait = Math.max(this.wait, 0.05);
      return;
    }
    if (k.picker) { var need0 = this.nextNeed(scr); var pid = need0 && k.picker.dishes.indexOf(need0) >= 0 ? need0 : k.picker.dishes[0]; this.tapHit('pick_' + k.picker.id + '_' + pid); this.wait = 0.3; return; }
    // 有正在后台加热且到时机的器具 → 回去
    var ready = k.stations.filter(function (st2) { if (!st2.job) return false; var step2 = k.stepOf(st2), s2 = st2.job.s; if (s2.g !== 'timing' || !step2.bg) return false; var w2 = k.windowFor(st2.job, step2); return s2.p >= w2[0] - 0.1; })[0];
    if (ready) { this.tapHit('st_' + ready.id); this.wait = 0.2; return; }
    // 托盘上有可交付的：拖给对应顾客
    var custs = scr.customers.filter(function (c) { return !c.resolved && c.state !== 'enter'; });
    var trayReady = k.tray.filter(function (t) { return t.fly >= 1; });
    var target = custs.filter(function (c) { var rem = c.o.items.slice(); c.delivered.forEach(function (d0) { var i0 = rem.indexOf(d0); if (i0 >= 0) rem.splice(i0, 1); }); return trayReady.some(function (t) { return rem.indexOf(t.dish) >= 0; }); })[0];
    if (target) { var T = k.trayRect, tx = T.x + T.w / 2, ty = T.y + T.h / 2; this.ev('down', tx, ty, 0.15); for (var m = 1; m <= 8; m++) this.ev('move', tx + (target.x - tx) * m / 8, ty + (330 - ty) * m / 8, 0.03); this.ev('up', target.x, 330, 0.05); this.stats.delivered++; this.wait = 0.3; return; }
    // 托盘有没人要的菜：留着（下一位可能要）
    var need = this.nextNeed(scr);
    if (need) {
      var st3 = k.station(D.byId[need].station);
      if (st3 && !st3.job) { this.tapHit('st_' + st3.id); this.stats.dishes++; this.wait = 0.25; return; }
      if (st3 && st3.job) { var s3 = st3.job.s, step3 = k.stepOf(st3); if (!(s3.g === 'timing' && step3.bg)) { this.tapHit('st_' + st3.id); this.wait = 0.2; return; } }
    }
    this.wait = 0.1;
  };
  B.otherWork = function (scr) { var n = this.nextNeed(scr, true); return !!n; };
  B.nextNeed = function (scr, excludeBusy) {
    var k = scr.kitchen, pending = [];
    k.stations.forEach(function (st) { if (st.job) pending.push(st.job.dish); });
    var tray = k.tray.map(function (t) { return t.dish; });
    var custs = scr.customers.filter(function (c) { return !c.resolved && c.state !== 'enter'; }).sort(function (a, b) { return a.pat - b.pat; });
    for (var i = 0; i < custs.length; i++) {
      var c = custs[i], rem = c.o.items.slice();
      c.delivered.forEach(function (d) { var j = rem.indexOf(d); if (j >= 0) rem.splice(j, 1); });
      for (var j2 = 0; j2 < rem.length; j2++) {
        var id = rem[j2], ti = tray.indexOf(id), pi = pending.indexOf(id);
        if (ti >= 0) { tray.splice(ti, 1); continue; }
        if (pi >= 0) { pending.splice(pi, 1); continue; }
        var st = k.station(D.byId[id].station);
        if (excludeBusy && st && st.job) continue;
        return id;
      }
    }
    return null;
  };
  function start(app, opts) { app.bot = new Bot(app, opts); var orig = app.step; if (!app._botHooked) { app._botHooked = true; app.step = function (dt) { if (app.bot && !app.bot.done) app.bot.update(dt); orig.call(app, dt); }; } return app.bot; }
  return { fastForward: fastForward, toEnding: toEnding, start: start, Bot: Bot, POL: POL };
});
