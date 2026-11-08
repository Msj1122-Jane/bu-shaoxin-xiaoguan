// 营业：上半部顾客与图案订单，下半部可操作厨房（器具即按钮），右侧托盘拖给顾客交付。
BSX.define('ui/s_service', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var Act = require('game/actors');
  var Hud = require('ui/hud');
  var Run = require('core/run');
  var D = require('content/dishes');
  var R = require('content/regulars');
  var C = require('content/config');
  var Cook = require('game/cooking');
  var SLOTS = [470, 690, 910], FOOT = 540, H = 300;

  function Service(app) {
    var s = app.state;
    this.name = 'service'; this.app = app; this.t = 0; this.pausable = true; this.done = false; this.endT = 0; this.idle = 0; this.cashFx = null; this.zhouPose = 'idle'; this.zhouT = 0;
    var time = s.day <= 1 ? 'morning' : s.today.weather === 'rain' ? 'morning' : ['morning', 'noon', 'morning'][s.day % 3];
    Sc.set({ view: 'room', time: time, weather: s.today.weather, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    Au.setAmbience(s.today.weather === 'rain' ? 'rain' : time, s.today.weather === 'rain'); Au.music(s.today.closed ? 'bgm_tense' : 'bgm_rush');
    var th = Run.theme(s);
    this.patienceMul = th && th.mods.patience ? th.mods.patience : 1;
    this.plan = Run.planOrders(s);
    this.queue = this.plan.slice();
    this.customers = []; this.results = [];
    var up = function (id) { return s.upgrades.indexOf(id) >= 0; };
    this.kitchen = new Cook.Kitchen({ trayMax: up('tray') ? 6 : 4, heat: up('fire') ? 1.3 : 1, pot2: up('pot2'), menu: s.menu, prof: s.prof, oilAge: s.oil === 0 ? s.oilStreak + 1 : 0, burn: s.burn, assist: app.settings.assistCook, reduceMotion: app.settings.reduceMotion, vibrate: function (k) { if (app.settings.vibrate) app.P.vibrate(k); } });
    this.tutorial = !app.settings.seenTutorial || (s.mode === 'story' && s.day === 1);
    this.closed = s.today.closed;
    this.coinSeed = 1;
    if (up('tables')) this.patienceMul *= 1.25;
    this.combo = 0; this.maxCombo = 0; this.comboTips = 0; this.comboFx = null; this.banner = null; this.rushShown = false; this.lanternFlash = 0;
    this.raid = s.today.raid ? { kind: s.today.raid, state: 'wait', x: -120 } : null;
    this.helperT = 0; this.hasHelper = s.helper;
    this.rival = Run.rivalPhase(s); this.fest = Run.festival(s);
    this.enc = s.today.encounter && !s.today.closed ? { id: s.today.encounter, state: 'wait', at: Math.max(1, Math.floor(this.plan.length * 0.35)), x: -80, t: 0 } : null; this.encounters = [];
    if (this.fest) this.banner = { text: this.fest.name, sub: this.fest.line, t: 0 };
    var self = this;
    this.kitchen.onCheat = function () { self.lanternFlash = 1; };
  }
  var P = Service.prototype;
  P.onSettings = function () { this.kitchen.assist = this.app.settings.assistCook; this.kitchen.reduceMotion = this.app.settings.reduceMotion; };
  P.spawn = function (o) {
    var free = [0, 1, 2].filter(function (i) { return !this.customers.some(function (c) { return c.slot === i && c.state !== 'gone' && c.state !== 'out'; }); }, this);
    if (!free.length) return false;
    var slot = free[0], s = this.app.state, reg = o.regular ? R.byId[o.regular] : null;
    var base = reg ? reg.patience : C.patience.normal[0] + ((o.id.charCodeAt(1) * 7) % (C.patience.normal[1] - C.patience.normal[0]));
    if (s.day <= 2 || this.tutorial) base += C.patience.tutorialBonus;
    base *= this.patienceMul;
    var gr = reg ? Run.greeting(s, o.regular) : null; if (gr && gr.mood === 'wary') base *= 0.8;
    var talk0 = gr ? { text: gr.text, t: 2.0, mood: gr.mood } : o.friendOf ? { text: '听说这家实在', t: 1.8 } : null;
    this.customers.push({ o: o, slot: slot, x: 60, tx: SLOTS[slot], state: 'enter', pat: base, patMax: base, delivered: [], grades: [], talk: talk0, seed: (o.id.charCodeAt(1) * 13) % 97, react: 0, bob: 0 });
    Au.play('bell');
    return true;
  };
  P.update = function (dt) {
    var self = this, s = this.app.state;
    this.t += dt; this.kitchen.update(dt); this.idle += dt; this.kitchen.idle = this.idle; this.zhouT += dt;
    if (this.cashFx) { this.cashFx.t += dt; if (this.cashFx.t > 1.2) this.cashFx = null; }
    if (this.closed) return;
    // 到店：按计划；若店里空着就提前叫下一位
    var waiting = this.customers.filter(function (c) { return c.state !== 'gone' && c.state !== 'out'; }).length;
    if (this.queue.length && (this.t >= this.queue[0].arrive || waiting === 0 && this.t > 1)) { var nx = this.queue[0]; if (this.spawn(nx)) { this.queue.shift(); if (nx.rush && !this.rushShown) { this.rushShown = true; this.banner = { text: '早高峰！', sub: '连着做好菜，连击越叠越高', t: 0 }; Au.play('open'); Au.play('bell'); } } }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.2) this.banner = null; }
    if (this.comboFx) { this.comboFx.t += dt; if (this.comboFx.t > 1.4) this.comboFx = null; }
    if (this.lanternFlash > 0) this.lanternFlash -= dt;
    // 门口排队：口碑高、良心灯笼亮时队伍更长
    var lantern = 1 - s.burn / 100;
    Sc.queue = Math.max(0, Math.min(6, Math.round((s.rep - 35) / 10 * lantern) + (this.rival === 'back' ? 2 : 0) - (this.rival === 'open' ? 1 : 0)));
    Sc.conscience = lantern;
    // 帮工：自动把托盘上做好的菜端给需要的客人
    if (this.hasHelper) { this.helperT -= dt; if (this.helperT <= 0) { this.helperT = 2.2; var k0 = this.kitchen, tgt = this.customers.filter(function (c) { if (c.resolved || c.state === 'enter') return false; var rem = c.o.items.slice(); c.delivered.forEach(function (d) { var i = rem.indexOf(d); if (i >= 0) rem.splice(i, 1); }); return k0.tray.some(function (t) { return t.fly >= 1 && rem.indexOf(t.dish) >= 0; }); })[0]; if (tgt) { this.deliverTo(tgt); this.helperFx = { x: tgt.x, t: 0 }; } } }
    if (this.helperFx) { this.helperFx.t += dt; if (this.helperFx.t > 0.8) this.helperFx = null; }
    // 街头奇遇：门口有人停下，点他开始小插曲；20 秒没理会就走了
    if (this.enc) { var E0 = this.enc; if (E0.state === 'wait' && this.results.length >= E0.at) { E0.state = 'come'; Au.play('bell'); } if (E0.state === 'come') { E0.x = Math.min(150, E0.x + 200 * dt); if (E0.x >= 150) { E0.state = 'stand'; E0.t = 0; } } else if (E0.state === 'stand') { E0.t += dt; if (E0.t > 20) E0.state = 'leave'; } else if (E0.state === 'leave') { E0.x -= 200 * dt; if (E0.x < -100) E0.state = 'done'; } }
    // 检查员突击：营业过半时进门
    if (this.raid) { var R0 = this.raid; if (R0.state === 'wait' && this.results.length >= Math.floor(this.plan.length / 2)) { R0.state = 'in'; Au.play('risk'); } if (R0.state === 'in') { R0.x = Math.min(640, R0.x + 300 * dt); if (R0.x >= 640) { R0.state = 'talk'; R0.t = 0; Au.play(R0.kind === 'bad' ? 'wrong' : 'perfect'); if (R0.kind === 'bad') Sc.shake = 0.4; } } else if (R0.state === 'talk') { R0.t += dt; if (R0.t > 3.2) R0.state = 'out'; } else if (R0.state === 'out') { R0.x -= 360 * dt; if (R0.x < -150) R0.state = 'done'; } }
    this.kitchen.urgent = this.customers.some(function (c) { return (c.state === 'wait' && c.pat / c.patMax < 0.4) || c.state === 'leaving'; });
    this.customers.forEach(function (c) {
      var d = c.tx - c.x;
      if (Math.abs(d) > 2) c.x += Math.sign(d) * Math.min(Math.abs(d), 360 * dt);
      else { c.x = c.tx; if (c.state === 'enter') c.state = 'wait'; }
      if (c.react > 0) c.react -= dt;
      if (c.talk) { c.talk.t -= dt; if (c.talk.t <= 0) c.talk = null; }
      if (c.state === 'wait' && !c.talk) {
        c.pat -= dt;
        if (c.pat <= 0) { c.state = 'leaving'; c.grace = C.patience.leaveGrace; Au.play('risk'); }
      } else if (c.state === 'leaving') {
        c.grace -= dt; if (c.grace <= 0) self.finish(c, true);
      } else if (c.state === 'eat') { c.eat -= dt; if (c.sickPending && c.eat <= 0.6) { c.sickPending = false; c.state = 'sick'; c.sickT = 2.2; self.onSick(c); } else if (c.eat <= 0) { c.state = 'out'; c.tx = 1400; } }
      else if (c.state === 'sick') { c.sickT -= dt; if (c.sickT <= 0) { c.state = 'out'; c.tx = -200; } }
      if (c.state === 'out' && (c.x >= 1390 || c.x <= -190)) c.state = 'gone';
    });
    this.customers = this.customers.filter(function (c) { return c.state !== 'gone'; });
    // 老周姿态
    var open = this.kitchen.open;
    this.zhouPose = open ? ({ pot: 'stir', noodle: 'scoop', fryer: 'add', pan: 'add', wok: 'stir', soy: 'carry', stew: 'scoop', steamer: 'add' }[open.type] || 'stir') : this.customers.filter(function (c) { return c.state === 'leaving'; }).length ? 'wipe' : this.lastHappy > 0 ? 'happy' : (s.burn >= 60 && Math.floor(this.t / 4) % 3 === 2) ? 'tired' : (s.burn >= 30 && Math.floor(this.t / 5) % 4 === 3) ? 'wipe' : 'idle';
    if (this.lastHappy > 0) this.lastHappy -= dt;
    // 收摊
    if (!this.done && !this.queue.length && !this.customers.length && this.results.length === this.plan.length) { this.done = true; this.endT = 0; Au.play('bell'); }
    if (this.done) { this.endT += dt; }
  };
  P.finish = function (c, lost) {
    if (c.resolved) return; c.resolved = true;
    var grade = 'lost', q = 0;
    if (!lost) {
      var qs = c.grades.map(function (g) { return g.q; }); q = qs.reduce(function (a, b) { return a + b; }, 0) / qs.length;
      grade = q >= C.quality.signature ? 'sig' : q >= C.quality.home ? 'home' : 'rush';
      if (c.state === 'leaving') { q = Math.max(0.5, q - 0.1); grade = grade === 'sig' ? 'home' : grade; }
      c.state = 'eat'; c.eat = 1.6; c.react = 1.6; c.grade = grade;
      var price = c.o.items.reduce(function (n, id) { return n + Math.round(D.byId[id].price * C.price.mult[this.app.state.price]); }.bind(this), 0) + (grade === 'sig' ? 1 : 0);
      this.cashFx = { v: price, t: 0 }; Au.play('coin'); this.kitchen.burst(c.x, 300, 'spark', grade === 'sig' ? 10 : 4); this.lastHappy = grade === 'sig' ? 1.4 : 0;
      c.sick = Run.sickRoll(this.app.state, c.o.id, c.cheats || 0); c.sickPending = c.sick;
      if (!c.sick && grade === 'sig' && this.combo >= 2 && (this.walkins || 0) < 3 && this.queue.length < 6 && !c.cheats) {
        this.walkins = (this.walkins || 0) + 1; var menu0 = this.app.state.menu, wo = { id: 'w' + this.walkins, regular: null, items: [menu0[(this.walkins * 7 + this.results.length) % menu0.length]], arrive: this.t + 1.2, walkin: true };
        this.plan.push(wo); this.queue.splice(0, 0, wo); this.kitchen.float(c.x, 170, '闻香而来 +1 位', '#ffe28a', 28);
      }
      if (!c.sick && grade !== 'rush') { this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); if (this.combo >= 2) { var tip = Math.min(this.combo, C.combo.max) * C.combo.tipPer; this.comboTips += tip; this.comboFx = { n: this.combo, tip: tip, t: 0 }; for (var ci = 0; ci < Math.min(18, 4 + this.combo * 2); ci++) this.kitchen.parts.push({ x: 1125, y: 120, vx: (Math.random() - 0.5) * 300, vy: -200 - Math.random() * 200, t: 0, life: 1.1, kind: 'coin' }); Au.play('perfect'); } }
      else if (this.combo >= 2) { this.comboFx = { n: 0, t: 0 }; this.combo = 0; } else this.combo = 0;
      if (c.o.regular) { var r = R.byId[c.o.regular]; c.talk = { text: this.app.state.burn >= 60 ? '……味道好像变了' : grade === 'rush' ? r.lines.meh : r.lines.happy, t: 1.6, mood: this.app.state.burn >= 60 ? 'wary' : null }; }
      else if (this.app.state.burn >= 30 && (c.seed + this.results.length) % 3 === 0) { c.frown = true; c.talk = { text: this.app.state.burn >= 60 ? '胃有点烧…' : '有点腻', t: 1.6 }; }
    } else { c.state = 'out'; c.tx = -200; Au.play('wrong'); if (c.o.regular) c.talk = { text: R.byId[c.o.regular].lines.wait, t: 1.6 }; if (this.combo >= 2) this.comboFx = { n: 0, t: 0 }; this.combo = 0; }
    var st0 = this.app.state, refund = c.sick ? c.o.items.reduce(function (n, id) { return n + Math.round(D.byId[id].price * C.price.mult[st0.price]) * 100; }, 0) : 0;
    this.results.push({ id: c.o.id, regular: c.o.regular, items: c.o.items, grade: grade, quality: Math.round(q * 100) / 100, cheats: c.cheats || 0, cheatGain: c.cheatGain || 0, sick: !!c.sick, refund: refund });
  };
  P.onSick = function (c) {
    Au.play('wrong'); Au.play('risk'); Sc.shake = 0.3; this.lanternFlash = 1.2;
    c.talk = { text: c.o.regular ? '肚子疼…' : '肚子疼！退钱！', t: 2 };
    this.cashFx = { v: -c.o.items.reduce(function (n, id) { return n + Math.round(D.byId[id].price * C.price.mult[this.app.state.price]); }.bind(this), 0), t: 0 };
    this.kitchen.float(c.x, 200, '差评 −口碑', '#ff8a6a', 30);
    // 当场的连锁反应：排队的人看见了，掉头就走（D049）
    var other = this.customers.filter(function (o) { return o !== c && !o.resolved && o.state === 'wait' && !o.o.regular; })[0];
    if (other) { other.state = 'leaving'; other.grace = 0.7; other.talk = { text: '算了，不吃了', t: 1.4, mood: 'wary' }; this.kitchen.float(other.x, 170, '吓走一位', '#ff8a6a', 26); }
  };
  P.deliverTo = function (c) {
    if (!c || c.resolved || c.state === 'enter') return false;
    var need = c.o.items.filter(function (id, i) { var used = c.delivered.filter(function (x) { return x === id; }).length, req = c.o.items.slice(0, i + 1).filter(function (x) { return x === id; }).length; return req > used; });
    var remaining = c.o.items.slice(); c.delivered.forEach(function (d) { var i = remaining.indexOf(d); if (i >= 0) remaining.splice(i, 1); });
    var got = this.kitchen.takeForOrder(remaining);
    if (!got.length) { c.wrong = 0.4; Au.play('wrong'); return false; }
    var self = this;
    got.forEach(function (it) { c.delivered.push(it.dish); c.grades.push({ dish: it.dish, q: it.q, grade: it.grade }); c.cheats = (c.cheats || 0) + (it.cheats || 0); c.cheatGain = (c.cheatGain || 0) + (it.cheatGain || 0); });
    Au.play('bowl'); c.bob = 0.3; this.idle = 0;
    if (c.delivered.length >= c.o.items.length) this.finish(c, false);
    return true;
  };
  P.customerAt = function (x, y) { return this.customers.filter(function (c) { return !c.resolved && Math.abs(c.x - x) < 110 && y > 120 && y < 560; })[0]; };
  // 输入：近景优先；托盘拖拽；器具点按
  P.pointerFirst = function (type, x, y, hit) {
    if (this.kitchen.open) {
      this.idle = 0;
      if (hit && (hit.id === 'closeup_close' || hit.id === 'cheat_btn')) return false;
      if (hit && hit.id === 'hud_pause') return false;
      var k = this.kitchen;
      k.closeupPointer(type, x, y);
      if (type === 'down') return function (t2, x2, y2) { if (k.open) k.closeupPointer(t2, x2, y2); };
    }
    return false;
  };
  P.pointer = function (type, x, y) {
    if (this.kitchen.open) { var k = this.kitchen; k.closeupPointer(type, x, y); return function (t2, x2, y2) { if (k.open) k.closeupPointer(t2, x2, y2); }; }
  };
  P.startTrayDrag = function (x, y) {
    var self = this, k = this.kitchen;
    if (!k.tray.some(function (t) { return t.fly >= 1; })) return null;
    k.dragTray = { x: x, y: y }; Au.play('pickup'); this.idle = 0;
    return function (type, x2, y2) {
      if (type === 'move') { k.dragTray.x = x2; k.dragTray.y = y2; self.hoverCust = self.customerAt(x2, y2); }
      if (type === 'up' || type === 'cancel') { k.dragTray = null; var c = self.customerAt(x2, y2); self.hoverCust = null; if (c && type === 'up') self.deliverTo(c); else Au.play('drop'); }
    };
  };
  P.draw = function (ctx) {
    var self = this, app = this.app, s = app.state, k = this.kitchen;
    Sc.drawBack(ctx);
    this.drawShopExtras(ctx, s);
    if (this.fest) this.drawFestival(ctx, this.fest);
    // 顾客
    this.customers.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (c) { self.drawCustomer(ctx, c); });
    // 老周（操作台左侧）
    Act.draw(ctx, 'zhou', 82, 610, 290, { t: this.zhouT, pose: this.zhouPose, noShadow: true });
    Sc.drawFront(ctx);
    // 操作台与器具
    var tut = this.tutorialHint();
    k.drawCounter(ctx, tut);
    k.stations.forEach(function (st) {
      U.hit('st_' + st.id, st.x, st.y - 10, st.w, st.h + 10, { label: st.name, onTap: function () { self.idle = 0; k.tapStation(st); } });
    });
    if (k.tray.length) U.hit('tray', k.trayRect.x, k.trayRect.y - 10, k.trayRect.w, k.trayRect.h + 20, { label: '托盘', onDown: function (x, y) { return self.startTrayDrag(x, y); }, onTap: function () {} });
    // 顾客热区（点击也能交付：辅助）
    this.customers.forEach(function (c) { if (!c.resolved && c.state !== 'enter') U.hit('cust_' + c.o.id, c.x - 90, 160, 180, 340, { label: '顾客' + (c.o.regular ? R.byId[c.o.regular].name : ''), kind: 'customer', onTap: function () { if (k.tray.length) self.deliverTo(c); } }); });
    k.drawUrgent(ctx);
    k.drawPicker(ctx);
    this.drawRaid(ctx);
    this.drawEncounter(ctx);
    var sickN = this.results.filter(function (r) { return r.sick; }).length;
    Hud.draw(ctx, app, { cashDelta: this.cashFx, lanternFlash: this.lanternFlash, liveBurn: s.burn + k.cheatsUsed * C.honesty.cheatBurn + sickN * C.honesty.sickBurn });
    this.drawCombo(ctx);
    // 剩余顾客（门口小脚印）
    var left = this.queue.length; for (var i = 0; i < Math.min(left, 6); i++) { ctx.fillStyle = 'rgba(255,248,232,.7)'; ctx.beginPath(); ctx.ellipse(568 + i * 18, 52, 5, 8, 0.3, 0, 7); ctx.fill(); }
    if (tut && tut.ghost && this.idle > 3) { k.hand(ctx, tut.ghost.x, tut.ghost.y + Math.abs(Math.sin(this.t * 4)) * 12); if (this.idle > 6) U.text(ctx, tut.text, tut.ghost.x, tut.ghost.y - 30, { size: 22, align: 'center', bold: true, color: '#ffe28a', stroke: '#4a2a12' }); }
    k.drawCloseup(ctx);
    if (!k.open) k.drawFloats(ctx);
    if (this.closed) { ctx.fillStyle = 'rgba(20,14,8,.6)'; ctx.fillRect(0, 0, 1280, 720); ctx.save(); ctx.strokeStyle = '#f6efe0'; ctx.lineWidth = 46; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(1140, 640); ctx.moveTo(1140, 80); ctx.lineTo(140, 640); ctx.stroke(); ctx.restore(); U.text(ctx, '封', 640, 160, { size: 64, bold: true, align: 'center', color: '#c0392b', stroke: '#fff', strokeW: 6 }); U.panel(ctx, 390, 240, 500, 220, 'paper'); U.text(ctx, '今天停业整顿', 640, 310, { size: 34, bold: true, align: 'center' }); U.text(ctx, '擦灶台、换油、重新贴台账', 640, 356, { size: 22, align: 'center', color: '#7d5a35' }); U.button(ctx, 'svc_closed_done', 540, 384, 200, 60, '收工', { onTap: function () { self.submit(); } }); }
    if (this.done) {
      var a = Math.min(1, this.endT * 2);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,14,8,.5)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
      U.panel(ctx, 400, 220, 480, 260, 'paper', { alpha: a });
      var g = { sig: 0, home: 0, rush: 0, lost: 0 }; this.results.forEach(function (r) { g[r.grade]++; });
      U.text(ctx, '收摊', 640, 282, { size: 36, bold: true, align: 'center', alpha: a });
      [['sig', '招牌', '#e8b54a'], ['home', '家常', '#7d5a35'], ['rush', '匆忙', '#8d7a60'], ['lost', '没等到', '#b8432f']].forEach(function (x, i) { U.text(ctx, x[1] + ' ' + g[x[0]], 470 + i * 112, 346, { size: 22, bold: true, align: 'center', color: x[2], alpha: a }); });
      U.text(ctx, '其余客人照常卖', 640, 386, { size: 20, align: 'center', color: '#7d5a35', alpha: a });
      if (this.endT > 0.6) U.button(ctx, 'svc_done', 540, 404, 200, 60, '去算账', { onTap: function () { self.submit(); } });
    }
  };
  P.submit = function () {
    if (this.submitted) return; this.submitted = true;
    var app = this.app;
    if (!app.settings.seenTutorial) { app.settings.seenTutorial = true; app.applySettings(); }
    Au.play('page');
    app.dispatch({ t: 'serviceDone', result: { orders: this.results, comboTips: this.comboTips, maxCombo: this.maxCombo, encounters: this.encounters } });
    app.route();
  };
  P.tutorialHint = function () {
    if (!this.tutorial || this.closed) return null;
    var k = this.kitchen, c = this.customers.filter(function (x) { return !x.resolved && x.state !== 'enter'; })[0];
    if (!c) return null;
    if (k.tray.some(function (t) { return t.fly >= 1 && c.o.items.indexOf(t.dish) >= 0 && c.delivered.indexOf(t.dish) < 0; }) && !k.open) return { tray: true, ghost: { x: k.trayRect.x + 100, y: k.trayRect.y + 20 }, text: '把托盘拖给客人' };
    var need = c.o.items.filter(function (id) { return c.delivered.indexOf(id) < 0 && !k.tray.some(function (t) { return t.dish === id; }); })[0];
    if (!need) return null;
    var st = k.station(D.byId[need].station);
    if (!st || k.open) return null;
    return { station: st.id, ghost: { x: st.cx, y: st.y + 30 }, text: '点' + st.name };
  };
  // 店面随升级与对手变化；窗外能看到街对面的“快好早点”
  P.drawFestival = function (ctx, f) {
    var t = this.t, W = Sc.WINDOW;
    ctx.save(); ctx.strokeStyle = '#6a2a14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W.x - 20, 70); ctx.quadraticCurveTo(640, 120, W.x + W.w + 20, 70); ctx.stroke();
    for (var i = 0; i < 9; i++) { var px = W.x + i * W.w / 8, py = 70 + Math.sin(i / 8 * Math.PI) * 40 + Math.sin(t * 2 + i) * 2;
      if (f.deco === 'lanterns') { Sc.glow(ctx, px, py + 12, 26, 'rgba(255,120,60,.35)'); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(px, py + 12, 10, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8b54a'; ctx.fillRect(px - 1, py + 24, 2, 8); }
      else { ctx.fillStyle = '#c0392b'; ctx.save(); ctx.translate(px, py + 10); ctx.rotate(Math.PI / 4); ctx.fillRect(-10, -10, 20, 20); ctx.restore(); U.text(ctx, '福', px, py + 17, { size: 14, bold: true, align: 'center', color: '#ffd45a' }); } }
    ctx.restore();
  };
  P.drawShopExtras = function (ctx, s) {
    var t = this.t;
    if (this.rival === 'open' || this.rival === 'back' || this.rival === 'gone') {
      ctx.save(); ctx.beginPath(); ctx.rect(Sc.WINDOW.x, Sc.WINDOW.y, Sc.WINDOW.w, Sc.WINDOW.h); ctx.clip();
      var rx = 820, ry = 178;
      ctx.fillStyle = this.rival === 'open' ? '#c0392b' : '#6a5a50'; ctx.fillRect(rx, ry, 120, 34);
      ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = 3; ctx.strokeRect(rx, ry, 120, 34);
      U.text(ctx, '快好早点', rx + 60, ry + 24, { size: 18, bold: true, align: 'center', color: '#fff3d6' });
      if (this.rival === 'open') { U.text(ctx, '豆浆1元！', rx + 60, ry + 58, { size: 15, bold: true, align: 'center', color: '#ffe28a', stroke: '#6a1a10', strokeW: 3 }); for (var i = 0; i < 3; i++) Sc.person(ctx, rx + 20 + i * 36 + Math.sin(t + i) * 2, 296, 40, ['#5b6e8c', '#8c5b4a', '#6a5a7a'][i], t * 3 + i, false); }
      else { ctx.strokeStyle = '#f6efe0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 120, ry + 34); ctx.moveTo(rx + 120, ry); ctx.lineTo(rx, ry + 34); ctx.stroke(); U.text(ctx, '查封', rx + 60, ry + 58, { size: 16, bold: true, align: 'center', color: '#fff', stroke: '#6a1a10', strokeW: 3 }); }
      ctx.restore();
    }
    if (s.upgrades.indexOf('sign') >= 0) { ctx.fillStyle = '#5a3418'; U.rr(ctx, 1000, 100, 230, 46, 6); ctx.fill(); ctx.strokeStyle = '#e8b54a'; ctx.lineWidth = 3; ctx.stroke(); U.text(ctx, '不烧心小馆', 1115, 133, { size: 30, bold: true, align: 'center', color: '#ffd45a' }); }
    if (s.upgrades.indexOf('board') >= 0) { ctx.save(); ctx.translate(250, 270); ctx.rotate(-0.03); ctx.fillStyle = '#f6efe0'; ctx.fillRect(0, 0, 80, 100); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 80, 100); U.text(ctx, '进货公示', 40, 22, { size: 14, bold: true, align: 'center', color: '#2f6f66' }); ctx.fillStyle = '#9a8a70'; for (var j = 0; j < 5; j++) ctx.fillRect(10, 34 + j * 12, 60 - (j % 2) * 16, 3); if (s.burn < 30) { ctx.strokeStyle = '#c0392b'; ctx.beginPath(); ctx.arc(62, 82, 12, 0, 7); ctx.stroke(); } ctx.restore(); }
    if ((s.flags.praised || 0) > 0 && s.burn < 60) { ctx.save(); ctx.translate(Sc.WINDOW.x + 20, Sc.WINDOW.y + 140); ctx.rotate(-0.05); ctx.fillStyle = '#2f6f66'; U.rr(ctx, 0, 0, 92, 42, 6); ctx.fill(); U.text(ctx, '放心早餐', 46, 28, { size: 18, bold: true, align: 'center', color: '#fff3d6' }); ctx.restore(); }
    if (this.hasHelper) { Act.draw(ctx, 'helper', 1236, 560, 150, { t: t, noShadow: true }); }
  };
  P.drawEncounter = function (ctx) {
    var e = this.enc, self = this; if (!e || e.state === 'wait' || e.state === 'done') return;
    var q = BSX.require('content/encounters').byId[e.id];
    Act.draw(ctx, q.who, e.x, FOOT, H * 0.95, { t: this.t, walk: e.state !== 'stand', seed: 5, flip: e.state === 'leave' });
    if (e.state === 'stand') {
      var b = 1 + Math.sin(this.t * 6) * 0.08;
      ctx.save(); ctx.translate(e.x, 150); ctx.scale(b, b); ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 3; ctx.stroke(); U.text(ctx, '!', 0, 11, { size: 32, bold: true, align: 'center', color: '#4a2a12' }); ctx.restore();
      U.text(ctx, q.name, e.x, 196, { size: 18, bold: true, align: 'center', color: '#fff3d6', stroke: '#3b2412', strokeW: 3 });
      U.hit('encounter', e.x - 70, 120, 140, 400, { label: '奇遇：' + q.name, onTap: function () { self.openEncounter(); } });
    }
  };
  P.openEncounter = function () {
    var self = this, e = this.enc, q = BSX.require('content/encounters').byId[e.id];
    e.state = 'talk'; this.app.paused = true;
    this.app.openOverlay(EncounterCard, { q: q, onPick: function (c) { self.encounters.push({ id: q.id, choice: c.id }); e.state = 'leave'; e.result = c; Au.play(c.effect.burn > 0 ? 'risk' : 'perfect'); if (c.effect.cash > 0) self.cashFx = { v: c.effect.cash / 100, t: 0 }; if (c.effect.burn > 0) self.lanternFlash = 1; } });
  };
  P.drawRaid = function (ctx) {
    var r = this.raid; if (!r || r.state === 'wait' || r.state === 'done') return;
    Act.draw(ctx, 'inspector', r.x, FOOT, H, { t: this.t, walk: r.state !== 'talk', flip: r.state === 'out' });
    if (r.state === 'talk') {
      var bad = r.kind === 'bad', txt = bad ? '这油……罚款，整改！' : '干净！贴张放心早餐', tw = 40 + txt.length * 24;
      U.bubble(ctx, r.x - tw / 2, 120, tw, 50, r.x, { fill: bad ? '#ffe0d6' : '#e6f4ea', line: bad ? '#b8432f' : '#2f6f66' });
      U.text(ctx, txt, r.x, 154, { size: 22, bold: true, align: 'center', color: bad ? '#b8432f' : '#2f6f66' });
      var k = Math.min(1, r.t * 3);
      ctx.save(); ctx.translate(r.x + 140, 260); ctx.rotate(-0.2); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = k; ctx.strokeStyle = bad ? '#c0392b' : '#2f6f66'; ctx.lineWidth = 5; ctx.strokeRect(-70, -30, 140, 60); U.text(ctx, bad ? '罚 ' + Math.round(BSX.require('content/config').honesty.raidFine / 100) : '放心早餐', 0, 12, { size: 28, bold: true, align: 'center', color: bad ? '#c0392b' : '#2f6f66' }); ctx.restore();
    }
  };
  P.drawCombo = function (ctx) {
    var x = 1125, y = 118;
    if (this.combo >= 2) {
      var pulse = this.comboFx && this.comboFx.n ? 1 + Math.max(0, 0.4 - this.comboFx.t) : 1;
      ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
      U.panel(ctx, -78, -30, 156, 60, 'dark');
      U.text(ctx, '连击 ×' + this.combo, 0, 10, { size: 30, bold: true, align: 'center', color: this.combo >= 5 ? '#ffd45a' : '#fff3d6' });
      ctx.restore();
    }
    if (this.comboFx) { var f = this.comboFx, k = f.t / 1.4; if (f.n >= 2) U.text(ctx, '+' + (f.tip / 100).toFixed(1) + ' 小费', x, y + 52 - k * 20, { size: 22, bold: true, align: 'center', color: '#ffd45a', stroke: '#3b2412', alpha: 1 - k }); else U.text(ctx, '连击断了', x, y + 10 - k * 10, { size: 26, bold: true, align: 'center', color: '#ffb08a', stroke: '#3b2412', alpha: 1 - k }); }
    if (this.banner) { var b = this.banner, a = Math.min(1, b.t * 4) * Math.min(1, (2.2 - b.t) * 3), sx = (1 - Math.min(1, b.t * 3)) * 400;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(184,67,47,.9)'; ctx.fillRect(0, 300, 1280, 90); U.text(ctx, b.text, 640 + sx, 362, { size: 52, bold: true, align: 'center', color: '#fff3d6', stroke: '#5a1a10', strokeW: 8 }); U.text(ctx, b.sub, 640 - sx, 410, { size: 20, align: 'center', color: '#fff3d6', stroke: '#3b2412' }); ctx.restore(); }
  };
  P.drawCustomer = function (ctx, c) {
    var o = c.o, who = o.regular || 'neighbor', t = this.t;
    var bob = c.bob > 0 ? Math.sin((0.3 - c.bob) / 0.3 * Math.PI) * -12 : 0; if (c.bob > 0) c.bob -= 1 / 60;
    var wrongX = c.wrong > 0 ? Math.sin(t * 60) * 8 : 0; if (c.wrong > 0) c.wrong -= 1 / 60;
    var lean = c.state === 'leaving' ? Math.sin(t * 10) * 3 : c.state === 'sick' ? Math.sin(t * 28) * 5 : 0;
    var flip = c.state === 'out' && c.tx < c.x;
    if (this.hoverCust === c) { ctx.save(); ctx.globalAlpha = 0.5; Sc.glow(ctx, c.x, 360, 160, 'rgba(255,220,120,.8)'); ctx.restore(); }
    ctx.save(); ctx.translate(lean, bob);
    if (o.regular) Act.draw(ctx, who, c.x + wrongX, FOOT, who === 'zhao' ? H * 0.95 : H, { t: t, flip: flip, ph: c.seed });
    else Act.draw(ctx, 'neighbor', c.x + wrongX, FOOT, H * 0.95, { t: t, seed: c.seed, flip: flip, walk: c.state === 'enter' || c.state === 'out' });
    ctx.restore();
    if (c.state === 'sick') { var sk = Math.sin(this.t * 30) * 4; ctx.save(); ctx.globalAlpha = 0.85; for (var q = 0; q < 3; q++) { ctx.strokeStyle = '#7ab040'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(c.x + sk, 230 - q * 6, 14 + q * 8, this.t * 6 + q, this.t * 6 + q + 4); ctx.stroke(); } ctx.restore(); A.cell(ctx, 'atlas_ui', 14, c.x - 30 + sk, 120, 60, 60, { trim: true, fit: true, anchor: 'center' }); if (c.talk) { var tw0 = 40 + c.talk.text.length * 26; U.bubble(ctx, c.x - tw0 / 2 + 60, 198, tw0, 46, c.x + 30, { fill: '#b8432f', line: '#6d2014' }); U.text(ctx, c.talk.text, c.x + 60, 230, { size: 24, align: 'center', color: '#fff8e8', bold: true }); } return; }
    if (c.state === 'out' || c.state === 'enter') return;
    // 订单气泡：食物图案为主
    var n = o.items.length, bw = 30 + n * 70, bx = c.x - bw / 2, by = 112;
    if (c.state !== 'eat') {
      U.bubble(ctx, bx, by, bw, 84, c.x, { fill: c.state === 'leaving' ? '#ffe6d6' : '#fff8e8' });
      var used = c.delivered.slice();
      o.items.forEach(function (id, i) {
        var got = used.indexOf(id) >= 0; if (got) used.splice(used.indexOf(id), 1);
        var jump = c.wrong > 0 ? Math.abs(Math.sin(t * 30 + i)) * 8 : 0;
        A.food(ctx, id, bx + 18 + i * 70, by + 8 - jump, 66, { alpha: got ? 0.35 : 1 });
        if (got) { ctx.strokeStyle = '#2f6f66'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + 34 + i * 70, by + 44); ctx.lineTo(bx + 48 + i * 70, by + 58); ctx.lineTo(bx + 72 + i * 70, by + 28); ctx.stroke(); }
      });
      // 耐心环（颜色＋形状＋动作）
      var f = c.state === 'leaving' ? c.grace / C.patience.leaveGrace : c.pat / c.patMax;
      var col = f > 0.5 ? '#5aa04a' : f > 0.25 ? '#e8b54a' : '#d0603a';
      U.ring(ctx, bx - 4, by + 4, 20, f, col, 7);
      if (c.state === 'leaving') { U.text(ctx, '!', bx - 4, by + 13, { size: 24, bold: true, align: 'center', color: '#d0603a' }); }
      if (o.regular) { ctx.save(); ctx.beginPath(); ctx.arc(bx + bw + 4, by + 8, 20, 0, 7); ctx.fillStyle = '#efe0bf'; ctx.fill(); ctx.clip(); Act.portrait(ctx, o.regular, bx + bw - 16, by - 12, 40); ctx.restore(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + bw + 4, by + 8, 20, 0, 7); ctx.stroke(); }
    } else {
      // 接餐反应：招牌爱心、家常小花、匆忙点头
      var k2 = 1 - c.eat / 1.6, icon = c.frown ? null : c.grade === 'sig' ? 10 : c.grade === 'home' ? 9 : null;
      if (icon != null) A.cell(ctx, 'atlas_vfx', icon, c.x - 40, 150 - k2 * 40, 80, 80, { trim: true, fit: true, anchor: 'center' });
      A.cell(ctx, 'atlas_vfx', 8, c.x + 30, 220 - k2 * 120, 46, 46, { trim: true, fit: true, anchor: 'center' });
    }
    if (c.talk) { var tw = 40 + c.talk.text.length * 26, wary = c.talk.mood === 'wary', fr = c.talk.mood === 'friend'; U.bubble(ctx, c.x - tw / 2 + 60, 198, tw, 46, c.x + 30, { fill: wary ? '#8a5a3a' : fr ? '#c88a30' : '#2f6f66', line: '#fff3d6' }); U.text(ctx, c.talk.text, c.x + 60, 230, { size: 24, align: 'center', color: '#fff8e8', bold: true }); }
  };
  P.describe = function () {
    var k = this.kitchen;
    return {
      closed: this.closed, done: this.done, queue: this.queue.length, planned: this.plan.length, served: this.results.length, results: this.results,
      customers: this.customers.map(function (c) { return { id: c.o.id, regular: c.o.regular, items: c.o.items, delivered: c.delivered, state: c.state, patience: Math.round(c.pat * 10) / 10, x: Math.round(c.x), y: 330 }; }),
      kitchen: k.describe(), geometry: k.geometry(), tutorial: !!this.tutorial
    };
  };
  function EncounterCard(app, p) { this.name = 'encounter'; this.app = app; this.p = p; this.t = 0; this.picked = null; this.closeable = false; }
  EncounterCard.prototype.update = function (dt) { this.t += dt; if (this.picked) { this.pt += dt; if (this.pt > 1.8) this.app.closeOverlay(); } };
  EncounterCard.prototype.draw = function (ctx) {
    var q = this.p.q, self = this, app = this.app;
    ctx.fillStyle = 'rgba(20,14,8,.55)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 260, 150, 760, 420, 'cream');
    ctx.save(); ctx.fillStyle = '#efe0bf'; U.rr(ctx, 290, 180, 140, 140, 12); ctx.fill(); ctx.beginPath(); U.rr(ctx, 290, 180, 140, 140, 12); ctx.clip(); Act.portrait(ctx, q.who, 290, 180, 140); ctx.restore();
    U.text(ctx, '奇遇 · ' + q.name, 460, 220, { size: 28, bold: true, color: '#2f6f66' });
    U.para(ctx, q.text, 460, 262, 520, { size: 22, lh: 32 });
    if (!this.picked) q.choices.forEach(function (c, i) { U.button(ctx, 'enc_' + c.id, 300 + i * 350, 400, 330, 70, c.label, { kind: 'paper', size: 21, onTap: function () { self.picked = c; self.pt = 0; self.p.onPick(c); } }); });
    else {
      U.para(ctx, self.picked.result, 300, 420, 680, { size: 24, color: '#7d5a35', lh: 34 });
      var ef = self.picked.effect || {}, tags = [];
      if (ef.cash) tags.push([(ef.cash > 0 ? '+' : '−') + Math.abs(ef.cash) / 100 + ' 元', ef.cash > 0 ? '#2f6f66' : '#7d5a35']);
      if (ef.rep) tags.push(['口碑 ' + (ef.rep > 0 ? '+' : '−') + Math.abs(ef.rep), ef.rep > 0 ? '#2f6f66' : '#b8432f']);
      if (ef.burn) tags.push([ef.burn > 0 ? '良心灯笼暗了' : '良心灯笼亮了', ef.burn > 0 ? '#b8432f' : '#2f6f66']);
      if (ef.aff) tags.push(['常客好感 +', '#c88a30']);
      if (!tags.length) tags.push(['什么也没发生', '#8d7a60']);
      tags.forEach(function (tg, i) { var tw = 30 + tg[0].length * 20; ctx.save(); ctx.fillStyle = tg[1]; U.rr(ctx, 300 + i * 200, 500, tw, 40, 10); ctx.fill(); ctx.restore(); U.text(ctx, tg[0], 300 + i * 200 + tw / 2, 528, { size: 20, bold: true, align: 'center', color: '#fff8e8' }); });
      U.text(ctx, '点任意处继续', 980, 560, { size: 18, align: 'right', color: '#8d7a60' });
      U.hit('enc_close', 0, 0, 1280, 720, { minSize: 0, onTap: function () { app.closeOverlay(); } }); }
  };
  EncounterCard.prototype.describe = function () { return { id: this.p.q.id, choices: this.p.q.choices.map(function (c) { return c.id; }), picked: this.picked && this.picked.id }; };
  return { Service: Service, EncounterCard: EncounterCard };
});
