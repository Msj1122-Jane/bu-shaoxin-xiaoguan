// 剧情演出：人物站在柜台前说话（气泡在人头顶，不是文本框），选择是摆在台面上的几张纸条。
// 脚本格式见 docs/CONTENT_SPEC.md §7。支持：点击推进、自动播放、快进、跳过已看过的、回看。
BSX.define('game/director', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var Shop = require('game/shop');
  var People = require('game/people');
  var SLOT = [330, 560, 790, 1020], FOOT = People.FOOT;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function Director(app, s, scene, onDone) {
    this.app = app; this.s = s; this.scene = scene; this.onDone = onDone;
    this.q = scene.beats.slice(); this.actors = []; this.props = []; this.cur = null; this.log = []; this.t = 0; this.done = false;
    this.auto = !!app.settings.autoPlay; this.fast = false; this.skipping = false;
    this.canSkip = !!(app.legacy.scenes && app.legacy.scenes[scene.id]);
    if (scene.light) Shop.setLight(scene.light);
    Au.setScene({ music: scene.id === 'crisis' || scene.id === 'rescue' ? 'tense' : 'story' });
    this.next();
  }
  var P = Director.prototype;
  P.actor = function (id) { return this.actors.filter(function (a) { return a.who === id && a.state !== 'gone'; })[0]; };
  P.resolve = function (id) { return id === 'best' ? Run.best(this.s) : id; };
  P.next = function () {
    var s = this.s, self = this;
    this.cur = null;
    while (this.q.length) {
      var b = this.q.shift();
      if (Array.isArray(b)) { var who = this.resolve(b[0]); this.cur = { type: 'say', who: who, text: b[1], n: 0, t: 0, hold: 0 }; this.log.push([who, b[1]]); if (this.skipping) continue; if (who !== 'n') Au.setDuck(true); return; }
      if (b.enter) { var id = this.resolve(b.enter), ex = this.actor(id); if (!ex) { this.actors.push({ who: id, slot: b.slot == null ? 2 : b.slot, x: 96, t: 0, state: 'in' }); Au.play('bell', { vol: 0.5 }); if (!this.skipping) { this.cur = { type: 'wait', left: 0.75, t: 0 }; return; } } continue; }
      if (b.exit) { var a = this.actor(this.resolve(b.exit)); if (a) { a.state = 'out'; a.t = 0; } continue; }
      if (b.prop) { if (b.off) this.props = this.props.filter(function (p) { return p.prop !== b.prop; }); else if (!this.props.some(function (p) { return p.prop === b.prop; })) { this.props.push({ prop: b.prop, label: b.label, t: 0 }); Au.play('bowl', { vol: 0.5 }); } continue; }
      if (b.fx) { this.apply(b.fx); continue; }
      if (b.if) { this.q = (Cond.check(s, b.if) ? (b.then || []) : (b.else || [])).concat(this.q); continue; }
      if (b.sfx) { if (!this.skipping) Au.play(b.sfx === 'rain' ? 'thunder' : b.sfx === 'sizzle' ? 'drop_oil' : b.sfx === 'pour' ? 'cup' : b.sfx); continue; }
      if (b.light) { Shop.setLight(b.light); if (b.light === 'candle') Au.play('candle'); continue; }
      if (b.bus) { Shop.busPass(!!s.flags.s_bus_stop); Au.play('bus'); continue; }
      if (b.shutter) { Shop.setShutter(b.shutter === 'up' ? 0 : b.shutter === 'half' ? 0.5 : 1); Au.play(b.shutter === 'down' ? 'shutter_down' : 'shutter_up'); if (b.shutter === 'up') { Shop.setLight('dawn'); Au.setScene({ music: 'open' }); } if (!this.skipping) { this.cur = { type: 'wait', left: 1.25, t: 0 }; return; } continue; }
      if (b.wait) { if (!this.skipping) { this.cur = { type: 'wait', left: b.wait, t: 0 }; return; } continue; }
      if (b.do) { if (this.skipping && !/卷帘门/.test(b.label || '')) continue; this.skipping = false; this.cur = { type: 'do', kind: b.do, label: b.label || '', p: 0, holding: false, t: 0 }; return; }
      if (b.choice) {
        this.skipping = false; Au.setDuck(false);
        var opts = b.choice.map(function (c) { return { c: c, ok: Cond.check(s, c.need) }; });
        if (!opts.some(function (o) { return o.ok; })) opts[opts.length - 1].ok = true;
        this.cur = { type: 'choice', opts: opts, t: 0 }; return;
      }
    }
    this.finish();
  };
  P.apply = function (fx) {
    var s = this.s, n0 = (s.today.news || []).length;
    Cond.apply(s, fx);
    var news = s.today.news || [];
    for (var i = n0; i < news.length; i++) this.app.news(news[i]);
  };
  P.finish = function () {
    if (this.done) return; this.done = true; Au.setDuck(false);
    this.actors.forEach(function (a) { if (a.state !== 'gone') { a.state = 'out'; a.t = 0; } });
    Run.sceneDone(this.s, this.scene.id, this.log);
    this.app.legacy.scenes = this.app.legacy.scenes || {}; this.app.legacy.scenes[this.scene.id] = 1;
    this.endT = 0.5;
  };
  P.choose = function (i) {
    var o = this.cur.opts[i]; if (!o || !o.ok) { Au.play('wrong'); return; }
    Au.play('stamp'); this.log.push(['choice', o.c.label]);
    this.apply(o.c.fx);
    this.q = (o.c.then || []).concat(this.q);
    this.next();
  };
  P.skip = function () { if (!this.canSkip || this.done) return; this.skipping = true; if (this.cur && this.cur.type !== 'choice' && this.cur.type !== 'do') this.next(); };
  P.update = function (dt) {
    var self = this, c = this.cur, sp = this.fast ? 4 : 1;
    this.t += dt;
    this.actors.forEach(function (a) {
      a.t += dt * sp; var tx = SLOT[a.slot];
      if (a.state === 'in') { var k = Math.min(1, a.t / 0.75); a.x = 96 + (tx - 96) * Fx.ease.out3(k); if (k >= 1) { a.state = 'idle'; a.x = tx; } }
      else if (a.state === 'out') { var k2 = Math.min(1, a.t / 0.8); a.x = tx + (60 - tx) * Fx.ease.inOut(k2); if (k2 >= 1) a.state = 'gone'; }
    });
    this.props.forEach(function (p) { p.t += dt; });
    if (this.done) { this.endT -= dt; if (this.endT <= 0 && this.onDone) { var f = this.onDone; this.onDone = null; f(); } return; }
    if (!c) return;
    c.t += dt * sp;
    if (c.type === 'say') {
      var full = c.text.length;
      if (c.n < full) { c.n = Math.min(full, c.n + dt * 34 * sp); if (Math.floor(c.n) % 3 === 0 && !this.fast) Au.play('tap', { vol: 0.12, pitch: c.who === 'z' ? 0.8 : 1.15 }); }
      else { c.hold += dt * sp; if ((this.auto || this.fast) && c.hold > 1.1 + full * 0.07) this.next(); }
    } else if (c.type === 'wait') { c.left -= dt * sp; if (c.left <= 0) { this.next(); return; } }
    if (c.type === 'do') {
      var shut = /卷帘门/.test(c.label), down = /拉下/.test(c.label);
      if (c.kind === 'hold') {
        if (c.holding) { c.p = Math.min(1, c.p + dt / 0.95); if (shut && Math.floor(c.p * 9) !== c.tick) { c.tick = Math.floor(c.p * 9); Au.play('shutter_tick'); } }
        else c.p = Math.max(0, c.p - dt * 1.4);
        if (shut) Shop.setShutter(down ? c.p * 0.3 : 1 - c.p * 0.3, false);
        if (c.p >= 1) { this.app.P.vibrate('heavy'); this.next(); }
      }
    }
  };
  P.pointer = function (type, x, y) {
    var c = this.cur, self = this;
    if (this.done || !c) return null;
    if (c.type === 'do' && c.kind === 'hold') { if (type === 'down') { c.holding = true; return function (t2) { if (t2 === 'up' || t2 === 'cancel') c.holding = false; }; } return null; }
    if (type !== 'down') return null;
    if (c.type === 'do') { Au.play('page'); this.next(); return null; }
    if (c.type === 'say') { if (c.n < c.text.length) c.n = c.text.length; else this.next(); }
    return null;
  };
  // ───────── 绘制
  P.drawActors = function (ctx) {
    var self = this, c = this.cur;
    this.actors.forEach(function (a) {
      if (a.state === 'gone') return;
      var moving = a.state !== 'idle', talk = c && c.type === 'say' && c.who === a.who && c.n < c.text.length;
      var bob = moving ? Math.abs(Math.sin(a.t * 11)) * -7 : talk ? Math.abs(Math.sin(self.t * 9)) * -4 : Math.sin(self.t * 1.8 + a.slot) * 1.5;
      People.draw(ctx, a.who, a.x, self.foot || FOOT, People.height(a.who) * (self.scale || 1), { bob: bob, flip: a.state === 'out' });
    });
  };
  function drawProp(ctx, p, x, y, t) {
    var k = Fx.ease.back(Math.min(1, p.t * 5));
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(40,20,8,.28)'; ctx.beginPath(); ctx.ellipse(0, 24, 46, 9, 0, 0, 7); ctx.fill();
    var id = p.prop;
    function paper(w, h, col, lines) { ctx.save(); ctx.rotate(-0.05); ctx.fillStyle = col || '#fbf5e4'; ctx.fillRect(-w / 2, -h + 22, w, h); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -h + 22, w, h); ctx.strokeStyle = 'rgba(70,50,30,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var i = 0; i < (lines || 4); i++) { ctx.moveTo(-w / 2 + 8, -h + 38 + i * 9); ctx.lineTo(w / 2 - 8 - (i === lines - 1 ? 14 : 0), -h + 38 + i * 9); } ctx.stroke(); ctx.restore(); }
    if (id === 'lease' || id === 'paper' || id === 'slip') { paper(64, 82, '#fbf5e4', 6); if (id === 'lease') { ctx.fillStyle = '#b8432f'; ctx.beginPath(); ctx.arc(16, 6, 9, 0, 7); ctx.fill(); } }
    else if (id === 'envelope') { ctx.fillStyle = '#e8d8b0'; ctx.fillRect(-40, -26, 80, 48); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(-40, -26, 80, 48); ctx.beginPath(); ctx.moveTo(-40, -26); ctx.lineTo(0, 2); ctx.lineTo(40, -26); ctx.stroke(); }
    else if (id === 'powder') { ctx.fillStyle = '#f4f0e6'; U.rr(ctx, -26, -42, 52, 64, 6); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#d8a030'; ctx.fillRect(-26, -22, 52, 20); ctx.fillStyle = '#8a8a82'; ctx.fillRect(-14, -8 + 14, 28, 3); }
    else if (id === 'meat') { ctx.fillStyle = '#f4f0e6'; ctx.fillRect(-44, -6, 88, 26); ctx.fillStyle = '#c8605a'; ctx.beginPath(); ctx.ellipse(0, -6, 38, 20, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a3a34'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#f2d8cc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -10); ctx.quadraticCurveTo(0, -20, 22, -6); ctx.stroke(); }
    else if (id === 'phone') { ctx.save(); ctx.rotate(Math.sin(t * 40) * 0.03); ctx.fillStyle = '#26262a'; U.rr(ctx, -20, -40, 40, 62, 6); ctx.fill(); ctx.fillStyle = '#7fd0ff'; ctx.fillRect(-16, -34, 32, 46); ctx.fillStyle = '#fff'; ctx.fillRect(-12, -28, 24, 4); ctx.fillRect(-12, -20, 18, 4); ctx.restore(); }
    else if (id === 'mug') Shop.drawMemento(ctx, 'mug', 0, 20, 2);
    else if (id === 'pumpkin') { ctx.scale(2.2, 2.2); Shop.drawMemento(ctx, 'food', 0, 10, 2); }
    else if (id === 'notebook' || id === 'homework' || id === 'ledger') { ctx.save(); ctx.rotate(0.06); ctx.fillStyle = id === 'ledger' ? '#2f6f66' : id === 'homework' ? '#e8d05a' : '#3a4a6a'; U.rr(ctx, -36, -34, 72, 54, 4); ctx.fill(); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fbf5e4'; ctx.fillRect(-28, -26, 40, 14); ctx.restore(); }
    else if (id === 'candle') { ctx.fillStyle = '#f4ead0'; ctx.fillRect(-6, -26, 12, 46); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(0, -36 + Math.sin(t * 11) * 1.5, 5, 10, 0, 0, 7); ctx.fill(); }
    else if (id === 'keys') { ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -14, 14, 0, 7); ctx.stroke(); ctx.fillStyle = '#e8b54a'; [[-16, 4, -0.5], [0, 8, 0], [16, 4, 0.5]].forEach(function (q) { ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(q[2]); ctx.fillRect(-3, -8, 6, 22); ctx.fillRect(-3, 8, 9, 4); ctx.restore(); }); }
    else if (id === 'curtain') { ctx.fillStyle = '#f2ead8'; ctx.fillRect(-46, -30, 92, 46); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-46, -30, 92, 8); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.strokeRect(-46, -30, 92, 46); U.text(ctx, '不烧心', 0, 6, { size: 20, bold: true, align: 'center', color: '#2f6f66' }); }
    else if (id === 'photo') { ctx.scale(2, 2); Shop.drawMemento(ctx, 'photo', 0, 0, 1); }
    else if (id === 'pills') { ctx.fillStyle = '#f4f0e6'; U.rr(ctx, -34, -12, 68, 30, 4); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#4a8ab8'; ctx.fillRect(-28, -4, 56, 8); }
    else if (id === 'veg') { ctx.fillStyle = '#b8823a'; U.rr(ctx, -44, -8, 88, 30, 8); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 2; ctx.stroke(); ['#4f8a4b', '#6aa85a', '#3f7a3a', '#5a9a4a'].forEach(function (col, i) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(-30 + i * 20, -12, 14, 12, 0, 0, 7); ctx.fill(); }); }
    else if (id === 'oilcan') { ctx.fillStyle = '#e8c04a'; U.rr(ctx, -26, -44, 52, 66, 8); ctx.fill(); ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-10, -52, 20, 10); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-20, -36, 6, 50); }
    else if (id === 'cash') { ['#d86a5a', '#c85a4a', '#e07a6a'].forEach(function (col, i) { ctx.fillStyle = col; ctx.fillRect(-36 + i * 4, -6 - i * 5, 72, 22); ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 1.5; ctx.strokeRect(-36 + i * 4, -6 - i * 5, 72, 22); }); }
    else paper(60, 70, '#fbf5e4', 5);
    ctx.restore();
    if (p.label) U.text(ctx, p.label, x, y + 50, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(60,36,16,.85)' });
  }
  P.drawProps = function (ctx) {
    var n = this.props.length, t = this.t;
    this.props.forEach(function (p, i) { drawProp(ctx, p, 640 + (i - (n - 1) / 2) * 150, 492, t); });
  };
  P.drawSpeech = function (ctx) {
    var c = this.cur, self = this; if (!c) return;
    if (c.type === 'say') {
      var text = c.text.slice(0, Math.floor(c.n)), who = c.who, done = c.n >= c.text.length;
      var k = Math.min(1, c.t * 6), px = 150, pw = 980, ph = 158, py = 548 + (1 - Fx.ease.out3(k)) * 14;
      // 下沿压暗，让字和人都立得住
      var gg = ctx.createLinearGradient(0, 470, 0, 720); gg.addColorStop(0, 'rgba(18,12,8,0)'); gg.addColorStop(1, 'rgba(18,12,8,.62)'); ctx.fillStyle = gg; ctx.fillRect(0, 470, 1280, 250);
      if (who === 'n') {
        // 老周心里的话：没有头像，像写在账本边上的字
        ctx.fillStyle = 'rgba(22,16,10,.8)'; U.rr(ctx, px + 40, py + 8, pw - 80, ph - 16, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(232,200,150,.35)'; ctx.lineWidth = 1.5; U.rr(ctx, px + 48, py + 16, pw - 96, ph - 32, 6); ctx.stroke();
        var nl = U.wrap(ctx, c.text, pw - 200, 27, 'bold', true), ny = py + ph / 2 - (nl.length - 1) * 20 + 9;
        U.wrap(ctx, text, pw - 200, 27, 'bold', true).forEach(function (l, i) { U.text(ctx, l, 640, ny + i * 40, { size: 27, bold: true, kai: true, align: 'center', color: '#f4e4c4' }); });
        if (done) U.text(ctx, '▾', px + pw - 70, py + ph - 26 + Math.sin(self.t * 5) * 2, { size: 18, color: '#f4e4c4', align: 'center' });
        return;
      }
      var z = who === 'z', name = Story.who(who), reg = Cast.regulars[who], side = z ? 1 : 0;
      // 纸面
      ctx.fillStyle = 'rgba(20,12,6,.4)'; U.rr(ctx, px + 4, py + 7, pw, ph, 12); ctx.fill();
      ctx.fillStyle = z ? '#eef0e2' : '#fbf5e4'; U.rr(ctx, px, py, pw, ph, 12); ctx.fill(); ctx.strokeStyle = z ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = z ? 'rgba(47,111,102,.25)' : 'rgba(125,90,53,.25)'; ctx.lineWidth = 1.5; U.rr(ctx, px + 7, py + 7, pw - 14, ph - 14, 8); ctx.stroke();
      // 头像：常客用半身像，老周用表情头像，其他人用小人
      var fw = 150, fx0 = side ? px + pw - fw - 16 : px + 16, fy0 = py - 46, fh = ph + 30;
      ctx.save(); U.rr(ctx, fx0, fy0, fw, fh, 10); ctx.fillStyle = z ? '#cfe0d8' : '#ecdcb8'; ctx.fill(); ctx.strokeStyle = z ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      if (z) { var mood = /……$|^……|唉|对不住|怪我/.test(c.text) ? 3 : /哈|要得|好嘞|谢|慢走|来嘛/.test(c.text) ? 1 : (self.scene.id === 'crisis' || self.scene.id === 'rescue') ? 2 : 0; A.cell(ctx, 'zhou_portraits', mood, fx0 - 22, fy0 + 2, fw + 44, fh + 26, {}); }
      else if (reg && reg.portrait != null) A.cell(ctx, 'atlas_regulars', reg.portrait, fx0 + 4, fy0 + 6, fw - 8, fh - 6, { trim: true, fit: true });
      else People.portrait(ctx, who, fx0 + 5, fy0 + 30, fw - 10, {});
      ctx.restore();
      // 名牌
      var tx = side ? px + 30 : px + fw + 40, tw = pw - fw - 80;
      ctx.font = U.font(21, 'bold', true); var nw = ctx.measureText(name).width + 30, nx = side ? px + pw - fw - 30 - nw : px + fw + 34;
      ctx.fillStyle = z ? '#2f6f66' : '#b8432f'; U.rr(ctx, nx, py - 18, nw, 34, 7); ctx.fill();
      U.text(ctx, name, nx + nw / 2, py + 6, { size: 21, bold: true, kai: true, align: 'center', color: '#fff6e0' });
      var ls = U.wrap(ctx, c.text, tw, 28, 'bold', true), ly = py + (ls.length > 2 ? 44 : ls.length > 1 ? 62 : 84);
      U.wrap(ctx, text, tw, 28, 'bold', true).forEach(function (l, i) { U.text(ctx, l, tx, ly + i * 40, { size: 28, bold: true, kai: true, color: '#33241a' }); });
      if (done) U.text(ctx, '▾', side ? px + pw - fw - 44 : px + pw - 34, py + ph - 18 + Math.sin(self.t * 5) * 2, { size: 18, color: z ? '#2f6f66' : '#7d5a35', align: 'center' });
    } else if (c.type === 'choice') {
      var n = c.opts.length, cw = Math.min(340, (1180 - (n - 1) * 20) / n), x0 = 640 - (n * cw + (n - 1) * 20) / 2, k = Fx.ease.out3(Math.min(1, c.t * 3));
      c.opts.forEach(function (o, i) {
        var x = x0 + i * (cw + 20), y = 566 + (1 - k) * 60 + Math.sin(self.t * 2 + i) * 1.5, h = 112;
        var st = U.hit('choice' + i, x, y, cw, h, { onTap: function () { self.choose(i); }, disabled: !o.ok, label: o.c.label });
        ctx.save(); ctx.globalAlpha = k * (o.ok ? 1 : 0.5); ctx.translate(x + cw / 2, y + h / 2); ctx.rotate((i - (n - 1) / 2) * 0.012); if (st.pressed) ctx.scale(0.97, 0.97); ctx.translate(-(x + cw / 2), -(y + h / 2));
        ctx.fillStyle = 'rgba(40,22,8,.3)'; U.rr(ctx, x + 3, y + 6, cw, h, 10); ctx.fill();
        ctx.fillStyle = st.hover && o.ok ? '#fffdf4' : '#fbf5e4'; U.rr(ctx, x, y, cw, h, 10); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#b8432f'; ctx.beginPath(); ctx.arc(x + 20, y + 20, 6, 0, 7); ctx.fill();
        U.text(ctx, o.c.label, x + cw / 2, y + 50, { size: 27, bold: true, align: 'center', color: '#3b2a1a', maxW: cw - 30 });
        U.text(ctx, o.ok ? (o.c.hint || '') : (o.c.why || '现在做不到'), x + cw / 2, y + 86, { size: 18, align: 'center', color: o.ok ? '#8a6a3a' : '#b8432f', maxW: cw - 26 });
        ctx.restore();
      });
    } else if (c.type === 'do') {
      var cx = 640, cy = 588, pulse = 1 + Math.sin(this.t * 5) * 0.05;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(24,18,12,.6)'; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fbeed0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.stroke();
      ctx.fillStyle = '#fbeed0'; ctx.beginPath(); ctx.arc(0, 0, c.kind === 'hold' ? 16 + c.p * 18 : 18, 0, 7); ctx.fill();
      ctx.restore();
      if (c.kind === 'hold') U.ring(ctx, cx, cy, 56, c.p, '#ffe28a', 7);
      U.text(ctx, c.label, cx, cy + 96, { size: 24, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.9)' });
    }
  };
  P.describe = function () { var c = this.cur; return { scene: this.scene.id, cur: c ? (c.type === 'say' ? { type: 'say', who: c.who, text: c.text } : c.type === 'choice' ? { type: 'choice', opts: c.opts.map(function (o) { return { label: o.c.label, ok: o.ok }; }) } : { type: c.type, kind: c.kind, label: c.label }) : null, done: this.done }; };
  return { Director: Director, SLOT: SLOT, FOOT: FOOT };
});
