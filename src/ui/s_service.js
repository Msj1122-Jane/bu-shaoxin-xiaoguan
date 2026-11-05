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
    Au.setAmbience(s.today.weather === 'rain' ? 'rain' : time, s.today.weather === 'rain');
    var th = Run.theme(s);
    this.patienceMul = th && th.mods.patience ? th.mods.patience : 1;
    this.plan = Run.planOrders(s);
    this.queue = this.plan.slice();
    this.customers = []; this.results = [];
    this.kitchen = new Cook.Kitchen({ menu: s.menu, prof: s.prof, assist: app.settings.assistCook, reduceMotion: app.settings.reduceMotion, vibrate: function (k) { if (app.settings.vibrate) app.P.vibrate(k); } });
    this.tutorial = !app.settings.seenTutorial || (s.mode === 'story' && s.day === 1);
    this.closed = s.today.closed;
    this.coinSeed = 1;
  }
  var P = Service.prototype;
  P.onSettings = function () { this.kitchen.assist = this.app.settings.assistCook; this.kitchen.reduceMotion = this.app.settings.reduceMotion; };
  P.spawn = function (o) {
    var free = [0, 1, 2].filter(function (i) { return !this.customers.some(function (c) { return c.slot === i && c.state !== 'gone'; }); }, this);
    if (!free.length) return false;
    var slot = free[0], s = this.app.state, reg = o.regular ? R.byId[o.regular] : null;
    var base = reg ? reg.patience : C.patience.normal[0] + ((o.id.charCodeAt(1) * 7) % (C.patience.normal[1] - C.patience.normal[0]));
    if (s.day <= 2 || this.tutorial) base += C.patience.tutorialBonus;
    base *= this.patienceMul;
    this.customers.push({ o: o, slot: slot, x: 60, tx: SLOTS[slot], state: 'enter', pat: base, patMax: base, delivered: [], grades: [], talk: reg ? { text: reg.lines.order, t: 2.0 } : null, seed: (o.id.charCodeAt(1) * 13) % 97, react: 0, bob: 0 });
    Au.play('bell');
    return true;
  };
  P.update = function (dt) {
    var self = this, s = this.app.state;
    this.t += dt; this.kitchen.update(dt); this.idle += dt; this.kitchen.idle = this.idle; this.zhouT += dt;
    if (this.cashFx) { this.cashFx.t += dt; if (this.cashFx.t > 1.2) this.cashFx = null; }
    if (this.closed) return;
    // 到店：按计划；若店里空着就提前叫下一位
    var waiting = this.customers.filter(function (c) { return c.state !== 'gone'; }).length;
    if (this.queue.length && (this.t >= this.queue[0].arrive || waiting === 0 && this.t > 1)) { if (this.spawn(this.queue[0])) this.queue.shift(); }
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
      } else if (c.state === 'eat') { c.eat -= dt; if (c.eat <= 0) { c.state = 'out'; c.tx = 1400; } }
      if (c.state === 'out' && c.x >= 1390) c.state = 'gone';
    });
    this.customers = this.customers.filter(function (c) { return c.state !== 'gone'; });
    // 老周姿态
    var open = this.kitchen.open;
    this.zhouPose = open ? ({ pot: 'stir', noodle: 'scoop', fryer: 'add', pan: 'add', wok: 'stir', soy: 'carry', stew: 'scoop', steamer: 'add' }[open.id] || 'stir') : this.customers.filter(function (c) { return c.state === 'leaving'; }).length ? 'wipe' : this.lastHappy > 0 ? 'happy' : 'idle';
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
      if (c.o.regular) { var r = R.byId[c.o.regular]; c.talk = { text: grade === 'rush' ? r.lines.meh : r.lines.happy, t: 1.6 }; }
    } else { c.state = 'out'; c.tx = -200; Au.play('wrong'); if (c.o.regular) c.talk = { text: R.byId[c.o.regular].lines.wait, t: 1.6 }; }
    this.results.push({ id: c.o.id, regular: c.o.regular, items: c.o.items, grade: grade, quality: Math.round(q * 100) / 100 });
  };
  P.deliverTo = function (c) {
    if (!c || c.resolved || c.state === 'enter') return false;
    var need = c.o.items.filter(function (id, i) { var used = c.delivered.filter(function (x) { return x === id; }).length, req = c.o.items.slice(0, i + 1).filter(function (x) { return x === id; }).length; return req > used; });
    var remaining = c.o.items.slice(); c.delivered.forEach(function (d) { var i = remaining.indexOf(d); if (i >= 0) remaining.splice(i, 1); });
    var got = this.kitchen.takeForOrder(remaining);
    if (!got.length) { c.wrong = 0.4; Au.play('wrong'); return false; }
    var self = this;
    got.forEach(function (it) { c.delivered.push(it.dish); c.grades.push({ dish: it.dish, q: it.q, grade: it.grade }); });
    Au.play('bowl'); c.bob = 0.3; this.idle = 0;
    if (c.delivered.length >= c.o.items.length) this.finish(c, false);
    return true;
  };
  P.customerAt = function (x, y) { return this.customers.filter(function (c) { return !c.resolved && Math.abs(c.x - x) < 110 && y > 120 && y < 560; })[0]; };
  // 输入：近景优先；托盘拖拽；器具点按
  P.pointerFirst = function (type, x, y, hit) {
    if (this.kitchen.open) {
      this.idle = 0;
      if (hit && hit.id === 'closeup_close') return false;
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
    k.drawPicker(ctx);
    Hud.draw(ctx, app, { cashDelta: this.cashFx });
    // 剩余顾客（门口小脚印）
    var left = this.queue.length; for (var i = 0; i < Math.min(left, 6); i++) { ctx.fillStyle = 'rgba(255,248,232,.7)'; ctx.beginPath(); ctx.ellipse(568 + i * 18, 52, 5, 8, 0.3, 0, 7); ctx.fill(); }
    if (tut && tut.ghost && this.idle > 3) { k.hand(ctx, tut.ghost.x, tut.ghost.y + Math.abs(Math.sin(this.t * 4)) * 12); if (this.idle > 6) U.text(ctx, tut.text, tut.ghost.x, tut.ghost.y - 30, { size: 22, align: 'center', bold: true, color: '#ffe28a', stroke: '#4a2a12' }); }
    k.drawCloseup(ctx);
    if (!k.open) k.drawFloats(ctx);
    if (this.closed) { ctx.fillStyle = 'rgba(20,14,8,.6)'; ctx.fillRect(0, 0, 1280, 720); U.panel(ctx, 390, 240, 500, 220, 'paper'); U.text(ctx, '今天停业整改', 640, 310, { size: 34, bold: true, align: 'center' }); U.text(ctx, '擦灶台、换油、重新贴台账', 640, 356, { size: 22, align: 'center', color: '#7d5a35' }); U.button(ctx, 'svc_closed_done', 540, 384, 200, 60, '收工', { onTap: function () { self.submit(); } }); }
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
    app.dispatch({ t: 'serviceDone', result: { orders: this.results } });
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
  P.drawCustomer = function (ctx, c) {
    var o = c.o, who = o.regular || 'neighbor', t = this.t;
    var bob = c.bob > 0 ? Math.sin((0.3 - c.bob) / 0.3 * Math.PI) * -12 : 0; if (c.bob > 0) c.bob -= 1 / 60;
    var wrongX = c.wrong > 0 ? Math.sin(t * 60) * 8 : 0; if (c.wrong > 0) c.wrong -= 1 / 60;
    var lean = c.state === 'leaving' ? Math.sin(t * 10) * 3 : 0;
    var flip = c.state === 'out' && c.tx < c.x;
    if (this.hoverCust === c) { ctx.save(); ctx.globalAlpha = 0.5; Sc.glow(ctx, c.x, 360, 160, 'rgba(255,220,120,.8)'); ctx.restore(); }
    ctx.save(); ctx.translate(lean, bob);
    if (o.regular) Act.draw(ctx, who, c.x + wrongX, FOOT, who === 'zhao' ? H * 0.95 : H, { t: t, flip: flip, ph: c.seed });
    else Act.draw(ctx, 'neighbor', c.x + wrongX, FOOT, H * 0.95, { t: t, seed: c.seed, flip: flip, walk: c.state === 'enter' || c.state === 'out' });
    ctx.restore();
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
      var k2 = 1 - c.eat / 1.6, icon = c.grade === 'sig' ? 10 : c.grade === 'home' ? 9 : null;
      if (icon != null) A.cell(ctx, 'atlas_vfx', icon, c.x - 40, 150 - k2 * 40, 80, 80, { trim: true, fit: true, anchor: 'center' });
      A.cell(ctx, 'atlas_vfx', 8, c.x + 30, 220 - k2 * 120, 46, 46, { trim: true, fit: true, anchor: 'center' });
    }
    if (c.talk) { var tw = 40 + c.talk.text.length * 26; U.bubble(ctx, c.x - tw / 2 + 60, 60, tw, 46, c.x + 30, { fill: '#2f6f66', line: '#1f4d47' }); U.text(ctx, c.talk.text, c.x + 60, 92, { size: 24, align: 'center', color: '#fff8e8', bold: true }); }
  };
  P.describe = function () {
    var k = this.kitchen;
    return {
      closed: this.closed, done: this.done, queue: this.queue.length, planned: this.plan.length, served: this.results.length, results: this.results,
      customers: this.customers.map(function (c) { return { id: c.o.id, regular: c.o.regular, items: c.o.items, delivered: c.delivered, state: c.state, patience: Math.round(c.pat * 10) / 10, x: Math.round(c.x), y: 330 }; }),
      kitchen: k.describe(), geometry: k.geometry(), tutorial: !!this.tutorial
    };
  };
  return { Service: Service };
});
