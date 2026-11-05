// 总控：平台 → 逻辑画布 1280×720（等比缩放＋扩展背景＋安全区）→ 屏幕路由 → 固定步长更新 → 存档 → 测试接口。
BSX.define('app', function (require) {
  var Run = require('core/run');
  var Save = require('core/save');
  var Legacy = require('core/legacy');
  var A = require('game/assets');
  var Au = require('game/audio');
  var Sc = require('game/scene');
  var U = require('ui/ui');
  var Screens = require('ui/screens');
  var STEP = 1 / 60;

  function App(P, manifest) {
    var app = this;
    this.P = P; this.ctx = P.ctx; this.t = 0; this.acc = 0; this.frames = 0; this.fps = 60; this.fpsT = 0; this.fpsN = 0; this.errors = []; this.manual = false;
    this.store = new Save.Store(P.storage);
    this.settings = Object.assign({ music: 0.5, sfx: 0.8, vibrate: true, textScale: 1, reduceMotion: false, assistCook: false, autoPlay: false, skipSeen: true, lowFx: false, seenTutorial: false }, this.store.loadSettings() || {});
    this.legacy = this.store.loadLegacy() || Legacy.create();
    this.state = null; this.screen = null; this.overlay = null; this.storyLog = []; this.seenCs = {}; this.lastSave = null; this.dev = !!P.devMode; this.paused = false;
    A.init(P, manifest);
    Au.init(P, this.settings);
    this.applySettings();
    P.onInput(function (type, px, py, id) { app.input(type, px, py, id); });
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
  Ap.applySettings = function () {
    var s = this.settings; U.textScale = s.textScale; Sc.reduceMotion = s.reduceMotion; Sc.lowFx = s.lowFx || s.reduceMotion; Au.setVolumes(s);
    this.store.saveSettings(s);
  };
  // 视口：逻辑 1280×720 放进安全区内，四周用扩展背景填充，不拉伸人物
  Ap.layout = function () {
    var P = this.P, W = P.canvas.width, H = P.canvas.height, ins = P.safeInsets();
    var aw = W - ins.l - ins.r, ah = H - ins.t - ins.b;
    var s = Math.min(aw / 1280, ah / 720);
    this.view = { s: s, ox: ins.l + (aw - 1280 * s) / 2, oy: ins.t + (ah - 720 * s) / 2, W: W, H: H };
    var cap = P.capsule();
    this.capsule = cap ? { x: (cap.x - this.view.ox) / s, y: (cap.y - this.view.oy) / s, w: cap.w / s, h: cap.h / s } : null;
    // 右上角为微信胶囊让位
    this.rightInset = this.capsule ? Math.max(0, 1280 - this.capsule.x + 12) : 0;
  };
  Ap.toLogical = function (px, py) { return { x: (px - this.view.ox) / this.view.s, y: (py - this.view.oy) / this.view.s }; };
  Ap.go = function (Scr, params) {
    if (this.screen && this.screen.exit) this.screen.exit();
    this.screen = new Scr(this, params || {});
    this.overlay = null; U.pressed = null; this.capture = null;
  };
  Ap.openOverlay = function (Scr, params) { this.overlay = new Scr(this, params || {}); this.capture = null; U.pressed = null; };
  Ap.closeOverlay = function () { this.overlay = null; this.paused = false; this.capture = null; };
  Ap.pause = function (fromSystem) {
    if (this.overlay || !this.screen || !this.screen.pausable) return;
    this.paused = true; this.openOverlay(Screens.Pause, { system: fromSystem });
  };
  // ───────── 局状态
  Ap.newRun = function (opts) {
    this.store.clearRun();
    this.state = Run.create(opts);
    this.storyLog = [];
    this.save();
    this.route();
  };
  Ap.dispatch = function (a) {
    var before = this.state, after = Run.reduce(before, a);
    if (after === before) return false;
    this.state = after;
    this.save();
    if (after.phase === 'ended' && before.phase !== 'ended') this.onEnded();
    return true;
  };
  Ap.save = function () {
    if (!this.state) return;
    var ok = this.store.saveRun(this.state);
    this.lastSave = { ok: ok, day: this.state.day, phase: this.state.phase, t: this.t };
    this.stamp = ok ? 1 : 0;
    if (!ok) this.errors.push(this.store.notice);
  };
  Ap.onEnded = function () {
    var s = this.state;
    if (s.mode === 'story' && s.ending) { this.legacy = Legacy.recordEnding(this.legacy, s); this.store.saveLegacy(this.legacy); }
    else if (s.mode === 'week') { var W = require('core/week'), m = W.summary(s), th = Run.theme(s), g = th.goals.filter(function (x) { return x.id === s.goal; })[0] || th.goals[0]; this.weekResult = { summary: m, goal: g, done: W.check(g.check, m) }; this.legacy = Legacy.recordWeek(this.legacy, s, this.weekResult.done, Object.assign({ goal: g.label }, m)); this.store.saveLegacy(this.legacy); }
  };
  Ap.continueRun = function () { var r = this.store.loadRun(); if (!r) return false; this.state = r.state; this.route(); return true; };
  Ap.route = function () {
    var s = this.state;
    if (!s) return this.go(Screens.Title);
    switch (s.phase) {
      case 'dawn': case 'open': case 'dusk': return this.go(Screens.Story);
      case 'prep': return this.go(Screens.Prep);
      case 'service': return this.go(Screens.Service);
      case 'ledger': return this.go(Screens.Ledger);
      case 'ended': return this.go(s.mode === 'week' ? Screens.WeekResult : Screens.Ending);
    }
  };
  // ───────── 输入
  Ap.input = function (type, px, py) {
    Au.unlock();
    var p = this.toLogical(px, py), x = p.x, y = p.y;
    this.lastPointer = { type: type, x: x, y: y, t: this.t };
    U.keyboard = false;
    if (type === 'hover') { var h0 = U.find(x, y); U.hover = h0 ? h0.id : null; return; }
    var scr = this.overlay || this.screen;
    if (!scr) return;
    if (this.capture) { // 拖拽/画圈/按住期间由捕获者处理
      var c = this.capture; c(type, x, y);
      if (type === 'up' || type === 'cancel') { this.capture = null; U.pressed = null; }
      return;
    }
    if (type === 'down') {
      var h = U.find(x, y);
      if (scr.pointerFirst) { var pf = scr.pointerFirst(type, x, y, h); if (pf) { if (typeof pf === 'function') this.capture = pf; return; } }
      if (h && !h.disabled) {
        U.pressed = h.id; this.pressHit = h; Au.play(h.kind === 'button' ? 'tap' : 'tap');
        if (h.onDown) { var cap = h.onDown(x, y); if (typeof cap === 'function') this.capture = cap; }
        return;
      }
      if (scr.pointer) { var cap2 = scr.pointer(type, x, y); if (typeof cap2 === 'function') this.capture = cap2; }
      return;
    }
    if (type === 'up') {
      var ph = this.pressHit; this.pressHit = null; U.pressed = null;
      if (ph) { var h2 = U.find(x, y); if (h2 && h2.id === ph.id && ph.onTap) ph.onTap(); return; }
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
    if (key === 'Escape' || key === 'p') { if (this.overlay && this.overlay.closeable !== false) this.closeOverlay(); else this.pause(); return; }
    if (key === 'f') this.P.fullscreen();
    if (this.screen && this.screen.key) this.screen.key(key);
  };
  // ───────── 主循环
  Ap.frame = function () {
    var now = this.P.now(), dt = Math.min(0.1, (now - this.lastNow) / 1000); this.lastNow = now;
    if (!this.manual && !this.hidden) { this.acc += dt; var n = 0; while (this.acc >= STEP && n < 6) { this.step(STEP); this.acc -= STEP; n++; } if (n === 6) this.acc = 0; }
    this.fpsN++; this.fpsT += dt; if (this.fpsT >= 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsN = 0; this.fpsT = 0; this.autoLowFx(); }
    this.render();
  };
  Ap.autoLowFx = function () {
    // 低性能降级：持续低于 40fps 自动开启轻特效（判定不依赖帧率：逻辑固定步长）
    if (this.manual) return;
    this.lowCount = this.fps < 40 ? (this.lowCount || 0) + 1 : 0;
    if (this.lowCount >= 6 && !Sc.lowFx) { Sc.lowFx = true; this.notice('已切换到省电画面'); }
  };
  Ap.step = function (dt) {
    this.t += dt; U.time = this.t;
    if (this.stamp > 0) this.stamp = Math.max(0, this.stamp - dt);
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 2.4) this.toast = null; }
    if (this.overlay && this.overlay.update) this.overlay.update(dt);
    if (this.paused) return;
    Sc.update(dt); Au.update(dt);
    if (this.screen && this.screen.update) this.screen.update(dt);
  };
  Ap.notice = function (text) { this.toast = { text: text, t: 0 }; };
  Ap.render = function () {
    var ctx = this.ctx, v = this.view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d1712'; ctx.fillRect(0, 0, v.W, v.H);
    ctx.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
    ctx.imageSmoothingEnabled = v.s < 1;
    U.begin();
    // 扩展背景：把场景边缘拉伸填满留边（不拉伸人物）
    ctx.save();
    try {
      if (this.screen && this.screen.draw) this.screen.draw(ctx);
      if (this.overlay && this.overlay.draw) this.overlay.draw(ctx);
    } catch (e) { this.reportError(e); for (var r = 0; r < 64; r++) ctx.restore(); ctx.save(); }
    ctx.restore();
    ctx.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
    this.drawChrome(ctx);
    // 扩展背景：逻辑画布外的留边用当前场景放大铺满并压暗（不拉伸人物，只延展环境）
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var rx = v.ox + 1280 * v.s, by = v.oy + 720 * v.s;
    if (v.ox > 0.5 || v.oy > 0.5 || rx < v.W - 0.5 || by < v.H - 0.5) {
      var bg = A.img(Sc.bgId()), bars = [];
      if (v.ox > 0.5) bars.push([0, 0, Math.ceil(v.ox), v.H]);
      if (rx < v.W - 0.5) bars.push([Math.floor(rx), 0, v.W, v.H]);
      if (v.oy > 0.5) bars.push([0, 0, v.W, Math.ceil(v.oy)]);
      if (by < v.H - 0.5) bars.push([0, Math.floor(by), v.W, v.H]);
      ctx.save(); ctx.beginPath(); bars.forEach(function (b) { ctx.rect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }); ctx.clip();
      ctx.fillStyle = '#1d1712'; ctx.fillRect(0, 0, v.W, v.H);
      if (bg) { var cs = Math.max(v.W / 1280, v.H / 720) * 1.08; ctx.globalAlpha = 0.55; ctx.drawImage(bg, (v.W - 1280 * cs) / 2, (v.H - 720 * cs) / 2, 1280 * cs, 720 * cs); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(20,12,6,.45)'; ctx.fillRect(0, 0, v.W, v.H);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6 * v.s; ctx.strokeRect(v.ox, v.oy, 1280 * v.s, 720 * v.s);
    }
    if (this.P.portrait && this.P.portrait()) { ctx.fillStyle = 'rgba(20,14,8,.92)'; ctx.fillRect(0, 0, v.W, v.H); ctx.fillStyle = '#fff3d6'; ctx.font = 'bold ' + Math.round(v.W / 16) + 'px ' + U.FONT; ctx.textAlign = 'center'; ctx.fillText('请横过手机', v.W / 2, v.H / 2); ctx.font = Math.round(v.W / 26) + 'px ' + U.FONT; ctx.fillText('小馆需要横屏营业', v.W / 2, v.H / 2 + v.W / 12); }
  };
  Ap.drawChrome = function (ctx) {
    if (this.stamp > 0 && this.lastSave && this.lastSave.ok) { ctx.save(); ctx.globalAlpha = Math.min(1, this.stamp * 2); ctx.translate(46, 676); ctx.rotate(-0.15); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 3; ctx.strokeRect(-26, -16, 52, 32); U.text(ctx, '已存', 0, 8, { size: 18, color: '#b8432f', align: 'center', bold: true }); ctx.restore(); }
    if (this.toast) { var k = Math.min(1, this.toast.t * 4) * Math.min(1, (2.4 - this.toast.t) * 3); ctx.save(); ctx.globalAlpha = k; U.panel(ctx, 380, 300, 520, 70, 'dark'); U.text(ctx, this.toast.text, 640, 344, { size: 24, align: 'center', color: '#fff3d6' }); ctx.restore(); }
    if (this.dev) { U.text(ctx, this.fps + 'fps ' + (this.state ? 'd' + this.state.day + ' ' + this.state.phase + ' 烧' + Math.round(this.state.burn) : ''), 8, 712, { size: 14, color: '#0f0', stroke: '#000' }); }
    if (this.capsule && this.dev) { ctx.save(); ctx.strokeStyle = 'rgba(255,0,0,.6)'; ctx.strokeRect(this.capsule.x, this.capsule.y, this.capsule.w, this.capsule.h); ctx.restore(); }
  };
  Ap.reportError = function (e) {
    var msg = String(e && e.stack || e);
    if (this.errors.indexOf(msg) < 0) this.errors.push(msg);
    if (typeof console !== 'undefined') console.error(e);
    if (this.errors.length > 20) this.errors.shift();
  };
  // ───────── 测试接口
  Ap.installTestApi = function () {
    var app = this, g = typeof window !== 'undefined' ? window : (typeof GameGlobal !== 'undefined' ? GameGlobal : {});
    g.advanceTime = function (ms) { app.manual = true; var n = Math.max(1, Math.round(ms / (STEP * 1000))); for (var i = 0; i < n; i++) { app.step(STEP); if (i % 4 === 3) app.render(); } app.render(); return app.t; };
    g.render_game_to_text = function () { return JSON.stringify(app.describe()); };
    g.__bsx = {
      app: app, Run: Run,
      inject: function (type, x, y) { var v = app.view; app.input(type, x * v.s + v.ox, y * v.s + v.oy); },
      tap: function (x, y) { this.inject('down', x, y); this.inject('up', x, y); },
      tapId: function (id) { var h = U.hits.filter(function (z) { return z.id === id; })[0]; if (!h) return false; this.tap(h.x + h.w / 2, h.y + h.h / 2); return true; },
      hits: function () { return U.hits.map(function (h) { return { id: h.id, x: Math.round(h.x + h.w / 2), y: Math.round(h.y + h.h / 2), disabled: h.disabled }; }); },
      newRun: function (o) { app.newRun(o || {}); },
      setSeed: function (seed) { app.newRun({ seed: seed }); },
      jumpDay: function (d) { // 开发：以默认选择快速推进到第 d 日晨备
        var sim = BSX.require('dev/autoplay'); sim.fastForward(app, d);
      },
      trigger: function (eventId) { var s = JSON.parse(JSON.stringify(app.state)); s.pending.unshift({ kind: 'event', id: eventId }); if (['dawn', 'open', 'dusk'].indexOf(s.phase) < 0) s.phase = 'dusk'; app.state = s; app.route(); },
      set: function (k, v) { var s = JSON.parse(JSON.stringify(app.state)); s[k] = v; app.state = s; },
      toEnding: function (policy) { BSX.require('dev/autoplay').toEnding(app, policy || 'average'); },
      errors: function () { return app.errors.concat(A.errors.map(function (e) { return '资源 ' + e.id + ' ' + e.msg; })); }
    };
  };
  Ap.describe = function () {
    var s = this.state, scr = this.overlay || this.screen;
    var out = {
      coords: 'logical 1280x720, origin top-left, y down',
      screen: this.screen ? this.screen.name : null, overlay: this.overlay ? this.overlay.name : null, paused: this.paused,
      fps: this.fps, t: Math.round(this.t * 100) / 100,
      scene: { view: Sc.view, time: Sc.time, weather: Sc.weather, cam: { x: Math.round(Sc.cam.x), y: Math.round(Sc.cam.y), z: Math.round(Sc.cam.z * 100) / 100 } },
      run: s ? { mode: s.mode, day: s.day, days: s.days, phase: s.phase, cash: s.cash, cashYuan: Math.round(s.cash) / 100, rep: s.rep, burn: this.dev ? s.burn : undefined, oil: s.oil, material: s.material, price: s.price, menu: s.menu, helper: s.helper, pending: s.pending.map(function (p) { return p.kind + ':' + (p.id || ''); }), ending: s.ending, crisis: s.crisis.state } : null,
      save: this.lastSave, interactive: U.hits.filter(function (h) { return !h.disabled; }).slice(-40).map(function (h) { return { id: h.id, label: h.label, x: Math.round(h.x + h.w / 2), y: Math.round(h.y + h.h / 2), w: Math.round(h.w), h: Math.round(h.h) }; }),
      detail: scr && scr.describe ? scr.describe() : null,
      errors: this.errors.length, assetErrors: A.errors.length
    };
    return out;
  };
  return { App: App };
});
