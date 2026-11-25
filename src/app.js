// 总控：平台 → 逻辑画布 1280×720（等比缩放＋安全区）→ 屏幕路由 → 固定步长更新 → 存档 → 测试接口。
// 一天的路由：开门前的戏（可无）→ 晨备（第 2 日起）→ 早市 → 收摊戏（可无）→ 晚账 → 下一天 / 结局。
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
  // ───────── 局状态
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
  // 小卡片：学会新菜、留下纪念物、小本子记下一条
  Ap.news = function (n) {
    var c = null;
    if (n.type === 'dish') { var d = D.byId[n.id]; if (d) c = { dish: n.id, title: '学会了 ' + d.name, text: '明早可以写上菜单牌。' }; }
    else if (n.type === 'memento') { var m = Story.memento(n.id); c = { memento: m.kind, title: '留下了 ' + m.name, text: m.text }; }
    else if (n.type === 'fact') { var who = String(n.id).split('/')[0]; c = { book: true, title: '小本子 · ' + Story.who(who), text: Story.facts[n.id] || '记下一条。' }; }
    if (c) { c.t = 0; this.cards.push(c); }
  };
  // ───────── 输入（单指：其余手指忽略）
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
  // ───────── 主循环
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
  // ───────── 测试接口
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
