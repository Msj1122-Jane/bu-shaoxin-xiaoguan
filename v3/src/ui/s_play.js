// 剧情屏（开门前 / 收摊后）与早市屏。两者画的是同一间店：剧情里人物站在玩家刚刚忙过的柜台前。
BSX.define('ui/s_play', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var Story = require('content/story');
  var D = require('content/dishes');
  var Dir = require('game/director');
  var Svc = require('game/service');
  var Stn = require('game/stations');

  // ───────── 剧情屏
  function Scene(app, p) {
    var s = app.state, self = this;
    this.app = app; this.name = 'scene'; this.pausable = true; this.s = s; this.when = p.when; this.done = p.done; this.t = 0;
    this.list = (p.ids || []).map(function (id) { return Story.scenes[id]; }).filter(Boolean);
    // 落在柜台上的东西：收摊时被发现
    (p.found || []).forEach(function (f, i) { var m = Story.memento(f.memento); self.list.unshift({ id: 'found_' + f.memento, title: '落下的东西', synthetic: f, beats: [['n', f.line || ('柜台上落了一样东西：' + m.name + '。')], { prop: 'paper', label: m.name }, { fx: { memento: f.memento } }, { wait: 0.5 }] }); });
    Fx.reset(); Stn.silence();
    var first = this.list[0], closedStart = first && first.beats.some(function (b) { return b && b.shutter === 'up'; });
    var rainy = s.today.weather === 'rain';
    this.place = p.place || null;
    if (this.place) { Shop.reset('day', s.today.weather); Au.setScene({ place: 'street', rain: rainy ? 0.5 : 0, crowd: 0.15, dawn: 1, music: 'story' }); }
    else if (this.when === 'open') { Shop.reset('dawn', s.today.weather); Shop.setShutter(closedStart ? 1 : 0, true); Au.setScene({ place: 'shop', rain: rainy ? 1 : 0, crowd: 0, dawn: 0.1, music: 'story' }); }
    else { Shop.reset(rainy ? 'rain' : 'day', s.today.weather); Shop.setLight('dusk'); Shop.setShutter(0, true); Au.setScene({ place: 'shop', rain: rainy ? 0.7 : 0, crowd: 0, dawn: 1, music: 'close' }); }
    Shop.crowd = this.when === 'open' ? 0.2 : 0.5;
    this.i = -1; this.dir = null; this.title = null;
    this.nextScene();
  }
  var S = Scene.prototype;
  S.nextScene = function () {
    var self = this, app = this.app;
    this.i++;
    if (this.i >= this.list.length) { this.dir = null; if (this.done) { var f = this.done; this.done = null; f(); } return; }
    var sc = this.list[this.i];
    if (sc.synthetic) sc.synthetic.shown = true;
    this.title = { text: sc.title, t: 0 };
    this.dir = new Dir.Director(app, this.s, sc, function () { app.save(); self.nextScene(); });
    if (this.place) { this.dir.foot = 600; this.dir.scale = 1.02; }
  };
  S.update = function (dt) { this.t += dt; if (this.title) this.title.t += dt; if (this.dir) this.dir.update(dt); };
  S.pointer = function (type, x, y) { return this.dir ? this.dir.pointer(type, x, y) : null; };
  S.key = function (k) { if ((k === ' ' || k === 'Enter') && this.dir) this.dir.pointer('down', 640, 360); };
  S.draw = function (ctx) {
    var s = this.s, d = this.dir, self = this, app = this.app;
    if (this.place) {
      Shop.drawPlace(ctx, this.place, this.t, { tint: 'rgb(255,226,190)' });
      if (d) d.drawActors(ctx);
      if (d) d.drawProps(ctx);
      Fx.drawParts(ctx);
    } else {
    Shop.drawBack(ctx, s, { post: s.plan.post && this.when === 'close', curtain: !!s.flags.man_curtain });
    if (d) d.drawActors(ctx);
    Shop.drawCounter(ctx);
    // 台面：收好的碗、抹布
    A.cell(ctx, 'atlas_equipment', 6, 60, 470, 120, 120, { trim: true, fit: true });
    A.cell(ctx, 'atlas_equipment', 7, 1040, 520, 190, 130, { trim: true, fit: true });
    if (d) d.drawProps(ctx);
    Fx.drawParts(ctx);
    Shop.drawLight(ctx);
    Shop.drawShutter(ctx);
    }
    Shop.grade(ctx, !!this.place);
    if (d) d.drawSpeech(ctx);
    Fx.drawFloats(ctx);
    K.dayChip(ctx, s, 14, 12, this.t);
    U.text(ctx, this.when === 'open' ? '开门前' : this.when === 'town' ? '下午' : '收摊后', 196, 46, { size: 18, bold: true, color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (this.title && this.title.t < 2.6 && this.title.text) { ctx.save(); ctx.globalAlpha = Math.min(1, this.title.t * 3, (2.6 - this.title.t) * 2); U.text(ctx, '—  ' + this.title.text + '  —', 640, 62, { size: 24, bold: true, align: 'center', color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' }); ctx.restore(); }
    if (d) {
      var x = 1280 - 66 - (app.rightInset || 0);
      K.iconBtn(ctx, 'sc_pause', x, 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' }); x -= 60;
      K.iconBtn(ctx, 'sc_log', x, 10, 48, 'log', function () { app.openOverlay(require('ui/s_book').Book, { tab: 3 }); }, { label: '回看', text: '回看' }); x -= 60;
      K.iconBtn(ctx, 'sc_auto', x, 10, 48, 'play', function () { d.auto = !d.auto; app.settings.autoPlay = d.auto; app.applySettings(); }, { label: '自动', text: '自动', on: d.auto }); x -= 60;
      K.iconBtn(ctx, 'sc_fast', x, 10, 48, 'fast', function () { d.fast = !d.fast; }, { label: '快进', text: '快进', on: d.fast }); x -= 60;
      if (d.canSkip) K.iconBtn(ctx, 'sc_skip', x, 10, 48, 'skip', function () { d.skip(); }, { label: '跳过', text: '看过·跳' });
    }
  };
  S.describe = function () { return { when: this.when, index: this.i, total: this.list.length, director: this.dir ? this.dir.describe() : null }; };

  // ───────── 早市屏
  function Shift(app) {
    var s = app.state;
    this.app = app; this.name = 'shift'; this.pausable = true; this.s = s; this.t = 0; this.phase = 'intro'; this.pt = 0;
    Fx.reset();
    this.plan = Run.buildService(s);
    this.svc = new Svc.Service(app, s, this.plan);
    var rainy = s.today.weather === 'rain';
    Shop.reset('dawn', s.today.weather); Shop.setShutter(0, true); Shop.setDawn(0, rainy); Shop.crowd = 0.3;
    if (s.today.light === 'candle' || (s.day === 22 && Story.scenes.m22_open && !Story.scenes.m22_open.fallback)) { this.candle = true; Shop.setLight('candle'); }
    Au.setScene({ place: 'shop', rain: rainy ? 1 : 0, crowd: 0, dawn: 0.2, music: 'open' });
    // 新手那几天、或今天有没用过的灶台时，给出手势提示
    this.guide = app.settings.hints && (s.day <= 2 || this.svc.stations.some(function (st) { return !(s.stats.st[st.type] > 0); }));
    this.idle = 0; this.hint = null; this.mood = '';
    this.news = (s.today.news || []).length;
  }
  var H = Shift.prototype;
  H.update = function (dt) {
    var s = this.s, svc = this.svc, app = this.app;
    this.t += dt; this.pt += dt;
    if (this.phase === 'intro') { if (this.pt > 1.5) { this.phase = 'open'; this.pt = 0; } return; }
    if (this.phase === 'open') {
      svc.update(dt);
      var f = svc.t / svc.len;
      if (!this.candle) Shop.setDawn(f * 1.5, s.today.weather === 'rain');
      Shop.crowd = 0.3 + Math.min(1, f) * 0.6;
      var busy = svc.cust.length + svc.queue.length, mood = f >= 1 ? 'lull' : busy >= 4 ? 'rush' : 'lull';
      if (mood !== this.mood && this.pt > 4) { this.mood = mood; Au.setScene({ music: mood }); }
      this.dawnT = (this.dawnT || 0) - dt; if (this.dawnT <= 0) { this.dawnT = 2; Au.setScene({ dawn: Math.min(1, 0.15 + f * 1.4) }); }
      if (s.day === 27 && s.flags.s_bus_stop && !this.bus && svc.t > 3) { this.bus = true; Shop.busPass(true); Au.play('horn'); }
      else if (!this.bus && s.day >= 2 && svc.t > svc.len * 0.06) { this.bus = true; Shop.busPass(false); Au.play('bus', { vol: 0.5 }); }
      this.idle += dt;
      if (this.guide) this.hint = this.idle > (s.day === 1 ? 0.9 : 2.2) ? svc.nextAction({ chat: svc.queue.length === 0, remember: false }) : null;
      if (svc.state === 'done') this.close();
    } else if (this.phase === 'closing') { if (this.pt > 0.2 && !this.rec) { } }
  };
  H.close = function () {
    var s = this.s, app = this.app;
    this.phase = 'closing'; this.pt = 0; this.hint = null;
    this.res = this.svc.result();
    this.rec = Run.finishService(s, this.res);
    var news = s.today.news || []; for (var i = this.news; i < news.length; i++) app.news(news[i]);
    app.save();
    Au.setScene({ crowd: 0, music: 'close' }); Au.play('day_end'); Shop.setLight(s.today.weather === 'rain' ? 'rain' : 'day');
  };
  H.pointer = function (type, x, y) {
    if (this.phase === 'open') { if (type === 'down') { this.idle = 0; this.hint = null; } return this.svc.pointer(type, x, y); }
    if (this.phase === 'closing' && type === 'down' && this.pt > 1.1) { this.app.route(true); }
    return null;
  };
  H.key = function (k) { if (this.phase === 'closing' && (k === ' ' || k === 'Enter') && this.pt > 1.1) this.app.route(true); };
  H.onHide = function () { Stn.silence(); };
  H.exit = function () { Stn.silence(); Au.setScene({ crowd: 0 }); };
  H.draw = function (ctx) {
    var s = this.s, svc = this.svc, app = this.app, self = this;
    svc.draw(ctx);
    // HUD：日历页、钟、零钱盒、暂停
    K.dayChip(ctx, s, 14, 12, this.t);
    K.clock(ctx, 640, 32, svc.t / svc.len, svc.t >= svc.len);
    if (svc.tinPop > 0) svc.tinPop = Math.max(0, svc.tinPop - 0.06);
    K.tin(ctx, Svc.TIN.x, Svc.TIN.y, svc.cash0 + svc.res.revenue + svc.res.tips, svc.tinPop);
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    if (this.phase === 'intro') {
      var k = Math.min(1, this.pt * 3) * Math.min(1, (1.5 - this.pt) * 4);
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(24,18,12,.55)'; ctx.fillRect(0, 286, 1280, 120);
      U.text(ctx, '第 ' + s.day + ' 天 · 开门', 640, 348, { size: 44, bold: true, align: 'center', color: '#fbeed0' });
      U.text(ctx, '点 = 顺手递给最急的那位　　拖 = 指定给谁　　按住 = 接豆浆', 640, 388, { size: 19, align: 'center', color: '#e8d8b8' });
      ctx.restore();
    }
    if (this.hint) {
      var h = this.hint, p = 1 + Math.sin(this.t * 6) * 0.1;
      ctx.save(); ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 4; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(h.x, h.y, 34 * p, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(h.x, h.y, 46 * p, 0, 7); ctx.stroke(); ctx.restore();
      ctx.font = U.font(19, 'bold'); var tw = ctx.measureText(h.label).width + 26, tx = Math.max(10, Math.min(1270 - tw, h.x - tw / 2)), ty = h.y > 560 ? h.y - 92 : h.y + 46; if (h.y < 470) ty = h.y + 50;
      ctx.fillStyle = 'rgba(28,22,16,.84)'; U.rr(ctx, tx, ty, tw, 36, 10); ctx.fill(); U.text(ctx, h.label, tx + tw / 2, ty + 25, { size: 19, bold: true, align: 'center', color: '#fff3d6' });
    }
    if (this.phase === 'open' && svc.t >= svc.len && (svc.cust.length || svc.queue.length)) U.text(ctx, '最后几位', 640, 74, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (this.phase === 'closing') {
      var r = this.rec, k2 = Fx.ease.out3(Math.min(1, this.pt * 2.4));
      K.dim(ctx, 0.4 * k2);
      var x = 340, y = 190 + (1 - k2) * 40, w = 600, hh = 300;
      ctx.save(); ctx.globalAlpha = k2; K.paper(ctx, x, y, w, hh, { pin: K.col.red });
      U.text(ctx, '收摊', x + w / 2, y + 66, { size: 40, bold: true, align: 'center', color: K.col.ink });
      var cells = [['卖出', (r.served) + ' 位'], ['入账', K.yuan(r.rev + r.tips)], ['等走了', (r.walked + r.balked) + ' 位']];
      cells.forEach(function (c, i) { var cx = x + 110 + i * 190; U.text(ctx, c[0], cx, y + 124, { size: 20, align: 'center', color: K.col.mute }); U.text(ctx, c[1], cx, y + 168, { size: 34, bold: true, align: 'center', color: i === 2 && (r.walked + r.balked) > 0 ? K.col.red : K.col.ink }); });
      var best = null, bn = 0; for (var id in r.sold) if (r.sold[id] > bn) { bn = r.sold[id]; best = id; }
      var line = best ? '卖得最好的是' + D.byId[best].name + '，' + bn + ' 份。' : '今天没卖出什么。';
      if (r.leftover > 0) line += '剩下 ' + r.leftover + ' 份。';
      U.text(ctx, line, x + w / 2, y + 222, { size: 20, align: 'center', color: K.col.ink, maxW: w - 60 });
      if (this.pt > 1.1) U.text(ctx, '点一下，收拾台面', x + w / 2, y + 268, { size: 18, align: 'center', color: K.col.mute, alpha: 0.6 + Math.sin(this.t * 4) * 0.3 });
      ctx.restore();
    }
  };
  H.describe = function () { var d = this.svc.describe(); d.phase = this.phase; d.hint = this.hint; d.rec = this.rec ? { rev: this.rec.rev, served: this.rec.served, net: this.rec.net } : null; return d; };
  return { Scene: Scene, Shift: Shift };
});
