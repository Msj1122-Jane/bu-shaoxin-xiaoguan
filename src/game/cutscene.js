// 数据驱动演出导演：S/A/B 三级共用。镜头、人物、道具、灯光、天气、逐句对白、自动播放、跳过（停在动作/选择点）、回看、可操作动作、分支选择、条件片段。
BSX.define('game/cutscene', function (require) {
  var Sc = require('game/scene');
  var Act = require('game/actors');
  var Cond = require('core/cond');
  var E = require('content/events');
  var R = require('content/regulars');
  var U = require('ui/ui');
  var Au = require('game/audio');
  var A = require('game/assets');

  var CARDS = [['序章', '开门'], ['第一章', '第一锅油'], ['第二章', '对街'], ['第三章', '风声'], ['第四章', '旧账'], ['终章', '月底那天']];
  // 新立绘（Lovart 新增）：角色 → 编号；表情 face → 文件后缀
  var PT = { zhou: 'c01', father: 'c02', jin: 'c03', peer: 'c04', zhao: 'c05', man: 'c06', zheng: 'c07', ali: 'c08', qin: 'c09' };
  var FACE = ['calm', 'happy', 'worried', 'angry', 'sad'];
  function bigPortrait(who, face) {
    var c = PT[who]; if (!c) return null;
    var f = FACE[face || 0] || 'calm';
    if (who === 'zhou') f = ['worried', 'happy', 'worried', 'worried', 'sad'][face || 0];
    return A.img('pt_' + c + '_' + f) || A.img('pt_' + c + '_calm') || A.img('pt_' + c + '_worried');
  }
  function Director(script, opts) {
    this.script = script; this.o = opts || {}; this.state = this.o.state;
    this.beats = this.flatten(script.beats, []);
    this.i = -1; this.actors = {}; this.props = {}; this.line = null; this.typed = 0; this.wait = 0; this.choice = null; this.act = null; this.done = false; this.t = 0; this.auto = !!this.o.auto; this.lineT = 0;
    this.result = { choice: null, unlocks: [], photo: null };
    this.log = this.o.log || [];
    var st = script.stage || {};
    var view = st.view || 'room';
    var time = st.time && st.time !== 'auto' ? st.time : (this.o.time || 'morning');
    var weather = st.weather && st.weather !== 'auto' ? st.weather : (this.o.weather || 'sun');
    Sc.set({ view: view, time: time, weather: weather, shutter: view === 'ext' && script.id === 'S01' ? 1 : view === 'ext' && script.id === 'S28' ? 0 : 0, crowd: 0 });
    Sc.moveCam(640, 360, 1, 0);
    this.view = view;
    this.foot = view === 'ext' ? 650 : 600; this.h = view === 'ext' ? 250 : 330;
    if (view === 'room') this.actors.zhou = { who: 'zhou', x: 230, tx: 230, a: 1, ta: 1, pose: 'idle' };
    else if (script.id !== 'S01') this.actors.zhou = { who: 'zhou', x: 520, tx: 520, a: 1, ta: 1, pose: 'idle' };
    Au.setAmbience(time === 'night' ? 'night' : weather === 'rain' ? 'rain' : time === 'dusk' ? 'dusk' : 'story', weather === 'rain');
    this.next();
  }
  var P = Director.prototype;
  P.ctxCond = function () { return { ending: this.o.ending }; };
  P.resolveWho = function (who) {
    if (who === 'best') { var s = this.state, best = null, v = -1; R.list.forEach(function (r) { var st = s.regulars[r.id]; if (st.visits > 0 && st.aff * 10 + st.visits > v) { v = st.aff * 10 + st.visits; best = r.id; } }); return best || 'neighbor'; }
    return who;
  };
  P.flatten = function (beats, out) {
    var self = this;
    beats.forEach(function (b) {
      if (b.if) { var ok = Cond.check(self.state, b.if, self.ctxCond()); self.flatten(ok ? (b.then || []) : (b.else || []), out); }
      else out.push(b);
    });
    return out;
  };
  P.next = function () {
    this.line = null; this.choice = null; this.act = null;
    while (++this.i < this.beats.length) {
      var b = this.beats[this.i];
      if (this.exec(b)) return;
    }
    this.done = true;
  };
  // 返回 true 表示需要等待
  P.exec = function (b) {
    var self = this;
    if (b.cam) { Sc.moveCam(b.cam[0], b.cam[1], b.cam[2], b.t || 0); if (b.t && !this.skipping) { this.wait = b.t / 1000; return true; } return false; }
    if (b.light) { Sc.set({ time: b.light === 'rain' ? Sc.time : b.light }); if (b.light === 'rain') Sc.set({ weather: 'rain' }); return false; }
    if (b.weather) { Sc.set({ weather: b.weather }); Au.setAmbience(Au.mood, b.weather === 'rain'); return false; }
    if (b.view) { Sc.set({ view: b.view }); this.view = b.view; this.foot = b.view === 'ext' ? 650 : 600; this.h = b.view === 'ext' ? 250 : 330; return false; }
    if (b.enter === 'jin' && !this.skipping) Au.pushMusic('bgm_jin');
    if (b.card === 3) Au.music('bgm_tense');
    if (b.enter) { var w = this.resolveWho(b.enter); var from = b.x > 640 ? 1400 : -120; this.actors[b.enter] = { who: w, x: from, tx: b.x, a: 1, ta: 1, pose: 'walk', flip: b.x > 640 }; if (!this.skipping) { this.wait = 0.9; return true; } this.actors[b.enter].x = b.x; return false; }
    if (b.exit === 'jin') Au.popMusic();
    if (b.exit) { var a = this.actors[b.exit]; if (a) { a.tx = a.x > 640 ? 1450 : -150; a.leaving = true; a.pose = 'walk'; a.flip = !a.flip; } return false; }
    if (b.prop) { this.props[b.prop] = { x: b.x, y: b.y, a: 0 }; Au.play('drop'); return false; }
    if (b.hide) { delete this.props[b.hide]; return false; }
    if (b.shutter) { this.shutterAnim = { from: Sc.shutter, to: b.shutter === 'up' ? 0 : 1, t: 0 }; if (!this.skipping) { this.wait = 1.2; return true; } Sc.set({ shutter: b.shutter === 'up' ? 0 : 1 }); return false; }
    if (b.sfx) { Au.play(b.sfx); if (b.sfx === 'shutter') Sc.shake = 0.6; return false; }
    if (b.wait) { if (!this.skipping) { this.wait = b.wait / 1000; return true; } return false; }
    if (b.crowd != null) { Sc.crowd = b.crowd; return false; }
    if (b.visitors) { var s = this.state, list = R.list.filter(function (r) { return s.regulars[r.id].visits > 0; }).sort(function (x, y) { return s.regulars[y.id].aff - s.regulars[x.id].aff; }).slice(0, b.visitors); list.forEach(function (r, i) { self.actors['v' + i] = { who: r.id, x: 1400, tx: 760 + i * 170, a: 1, ta: 1, pose: 'walk', flip: true }; }); if (!this.skipping) { this.wait = 1; return true; } return false; }
    if (b.card != null) { this.ov = { kind: 'card', n: b.card, t: 0 }; Au.play('page'); if (this.skipping) { this.ov = null; return false; } return true; }
    if (b.memory) { Au.pushMusic('bgm_memory'); this.ov = { kind: 'memory', img: b.memory, lines: b.lines || [], li: 0, typed: 0, t: 0 }; Au.play('page'); (b.lines || []).forEach(function (l) { self.log.push({ who: '回忆', text: l, day: self.state && self.state.day }); }); if (this.skipping) { this.ov = null; return false; } return true; }
    if (b.page) { this.ov = { kind: 'page', n: b.page, t: 0 }; Au.play('stamp'); this.log.push({ who: '', text: '找到账本第 ' + b.page + ' 页', day: this.state && this.state.day }); if (this.skipping) { this.ov = null; return false; } return true; }
    if (b.dungeon) { this.skipping = false; if (b.dungeon === 'face') this.mini = new (require('game/face').Face)({ pages: (this.state && this.state.pages) || [] }); else if (b.dungeon === 'check') this.mini = new (require('game/check').Check)({ jinOil: !!(this.state && this.state.flags.jinOil) }); else this.mini = new (require('game/market').Market)({ seed: (this.state && this.state.seed || 7) + (this.state ? this.state.day : 0) * 31, auto: false }); Au.pushMusic(b.dungeon === 'market' ? 'bgm_rush' : b.dungeon === 'face' ? 'bgm_face' : 'bgm_tense'); return true; }
    if (b.bg !== undefined) { this.bg = b.bg; return false; }
    if (b.photo) { this.result.photo = b.photo; Sc.flash = 0.6; Au.play('stamp'); return false; }
    if (b.unlockDish) { this.result.unlocks.push(b.unlockDish); this.toast = { text: '新菜谱：' + BSX.require('content/dishes').byId[b.unlockDish].name, t: 0, dish: b.unlockDish }; Au.play('open'); return false; }
    if (b.narr) { this.line = { who: 'zhou', key: 'zhou', text: b.narr, narr: true }; this.typed = 0; this.lineT = 0; this.log.push({ who: '', text: b.narr, day: this.state && this.state.day }); if (this.skipping && this.o.canSkip) return false; return true; }
    if (b.say) {
      var who = this.resolveWho(b.say);
      if (b.say === 'best' && !this.actors.best && who !== 'neighbor') { this.actors.best = { who: who, x: 1400, tx: 980, a: 1, ta: 1, pose: 'walk', flip: true }; }
      this.line = { who: who, key: b.say, text: b.text, face: b.face || 0 }; this.typed = 0; this.lineT = 0;
      this.log.push({ who: Act.nameOf(who), text: b.text, day: this.state && this.state.day });
      Au.setDuck(true);
      if (this.skipping && this.o.canSkip) return false;
      return true;
    }
    if (b.act) { this.skipping = false; this.act = { kind: b.act.kind, label: b.act.label, x: b.act.x, y: b.act.y, need: b.act.count || 1, n: 0, hold: 0, prop: b.act.prop }; return true; }
    if (b.choice || b.eventChoice) {
      this.skipping = false;
      var list2 = b.choice ? b.choice.filter(function (c) { return !c.when || Cond.check(self.state, c.when); }) : E.byId[b.eventChoice].choices;
      this.choice = { list: list2, title: b.eventChoice ? E.byId[b.eventChoice].text : null };
      return true;
    }
    return false;
  };
  P.update = function (dt) {
    this.t += dt;
    var self = this;
    for (var k in this.actors) {
      var a = this.actors[k], d = a.tx - a.x, sp = 420 * dt;
      if (Math.abs(d) > 1) { a.x += Math.sign(d) * Math.min(Math.abs(d), sp); a.pose = 'walk'; }
      else { a.x = a.tx; if (a.leaving) delete this.actors[k]; else if (a.pose === 'walk') a.pose = 'idle'; }
    }
    for (var p in this.props) this.props[p].a = Math.min(1, this.props[p].a + dt * 3);
    if (this.shutterAnim) { var s = this.shutterAnim; s.t += dt / 1.2; Sc.set({ shutter: s.from + (s.to - s.from) * Math.min(1, s.t) }); if (s.t >= 1) this.shutterAnim = null; }
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 2.6) this.toast = null; }
    if (this.paused) return;
    if (this.mini) { this.mini.update(dt); if (this.mini.done) { this.result.dungeon = this.mini.result; this.mini = null; Au.popMusic(); this.next(); } return; }
    if (this.ov) {
      var o = this.ov; o.t += dt;
      if (o.kind === 'memory') { var L0 = o.lines[o.li] || ''; o.typed = Math.min(L0.length, o.typed + dt * 14); if (this.auto && o.typed >= L0.length && o.t > 1.6 + L0.length * 0.1) this.ovAdvance(); }
      else if (this.auto && o.t > 2.4) this.ovAdvance();
      return;
    }
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) this.next(); return; }
    if (this.line) {
      this.typed = Math.min(this.line.text.length, this.typed + dt * 28);
      this.lineT += dt;
      if (this.auto && this.typed >= this.line.text.length && this.lineT > 1.2 + this.line.text.length * 0.08) this.advance();
    }
    if (this.act && this.act.kind === 'hold' && this.act.holding) { this.act.hold += dt; if (this.act.hold >= 1.1) this.completeAct(); }
  };
  P.ovAdvance = function () {
    var o = this.ov; if (!o) return;
    if (o.kind === 'memory') {
      var L0 = o.lines[o.li] || '';
      if (o.typed < L0.length) { o.typed = L0.length; return; }
      if (o.li < o.lines.length - 1) { o.li++; o.typed = 0; o.t = 0; Au.play('tap'); return; }
    } else if (o.t < 0.5) return;
    if (o.kind === 'memory') Au.popMusic();
    this.ov = null; Au.play('tap'); this.next();
  };
  P.advance = function () {
    if (this.line) { if (this.typed < this.line.text.length) { this.typed = this.line.text.length; return; } Au.setDuck(false); this.next(); Au.play('tap'); }
  };
  P.skip = function () { // 跳到下一个动作/选择点或结束
    if (this.act || this.choice || this.mini) return;
    this.skipping = true; this.wait = 0; this.o.canSkip = true; if (this.ov && this.ov.kind === 'memory') Au.popMusic(); this.ov = null;
    Au.setDuck(false);
    this.next();
    this.skipping = false;
    if (this.act || this.choice || this.done) this.line = null;
    for (var k in this.actors) { var a = this.actors[k]; a.x = a.tx; if (a.leaving) delete this.actors[k]; }
    if (this.shutterAnim) { Sc.set({ shutter: this.shutterAnim.to }); this.shutterAnim = null; }
    if (Sc.camAnim) { Sc.cam = Sc.camAnim.to; Sc.camAnim = null; }
  };
  P.completeAct = function () {
    var a = this.act; this.act = null;
    if (a.prop === 'pricetag') Au.play('tear');
    Au.play('perfect'); Sc.flash = 0.25;
    this.next();
  };
  P.pick = function (c) { this.result.choice = c.id; this.choiceResult = c.result; this.choice = null; if (c.then) { var more = this.flatten(c.then, []); Array.prototype.splice.apply(this.beats, [this.i + 1, 0].concat(more)); } Au.play('stamp'); this.line = { who: 'zhou', key: 'zhou', text: c.result, face: 0, narr: true }; this.typed = 0; this.lineT = 0; this.log.push({ who: '', text: c.result, day: this.state && this.state.day }); };
  // 输入：对白点击推进；动作需在目标处完成
  P.pointer = function (type, x, y) {
    if (this.mini) return this.mini.pointer(type, x, y);
    var a = this.act;
    if (a) {
      var tp = Sc.toScreen(a.x, a.y), near = Math.hypot(x - tp.x, y - tp.y) < 150;
      if (a.kind === 'tap' && type === 'down' && near) { a.n++; Au.play('tap'); Sc.shake = 0.15; a.pop = 0.2; if (a.n >= a.need) this.completeAct(); return true; }
      if (a.kind === 'hold') { if (type === 'down' && near) { a.holding = true; Au.play('tap'); } if (type === 'up' || type === 'cancel') { a.holding = false; if (a.hold < 1.1) a.hold = 0; } return true; }
      if (a.kind === 'swipe') { if (type === 'down' && near) a.sx = x; if (type === 'up' && a.sx != null) { if (Math.abs(x - a.sx) > 120) this.completeAct(); a.sx = null; } return true; }
      return true;
    }
    if (type === 'down' && this.ov) { this.ovAdvance(); return true; }
    if (type === 'down' && this.line) { this.advance(); return true; }
    return false;
  };
  P.drawWorld = function (ctx) {
    var self = this, list = [];
    for (var k in this.actors) list.push(this.actors[k]);
    list.sort(function (a, b) { return a.x - b.x; });
    for (var p in this.props) drawProp(ctx, p, this.props[p], this.t);
    list.forEach(function (a) {
      var talking = self.line && self.resolveWho(self.line.key) === a.who && self.typed < self.line.text.length;
      Act.draw(ctx, a.who, a.x, self.foot, a.who === 'zhou' ? self.h * 1.02 : self.h, { t: self.t, pose: a.who === 'zhou' ? (talking ? 'greet' : self.line && self.line.face === 2 ? 'worried' : self.line && self.line.face === 4 ? 'tired' : self.line && self.line.face === 1 ? 'happy' : a.pose) : a.pose, flip: a.flip, walk: a.pose === 'walk', squash: talking ? Math.sin(self.t * 18) * 0.012 : undefined, seed: a.who === 'neighbor' ? 3 : undefined });
    });
    if (this.act) {
      var a = this.act, t = this.t;
      ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 5) * 0.3; ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(a.x, a.y, 70 + Math.sin(t * 5) * 6, 0, 7); ctx.stroke(); ctx.restore();
      if (a.kind === 'hold') U.ring(ctx, a.x, a.y, 86, a.hold / 1.1, '#ffd45a', 10);
    }
  };
  function drawProp(ctx, name, p, t) {
    ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y);
    var paper = function (w, h, col) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); ctx.fillStyle = col || '#f6efe0'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#9a8a70'; for (var i = 0; i < 4; i++) ctx.fillRect(-w / 2 + 8, -h / 2 + 10 + i * 10, w - 16 - (i % 2) * 14, 2); };
    switch (name) {
      case 'lease': case 'contract': case 'paper': case 'report': case 'list': case 'flyer': paper(70, 56, name === 'report' ? '#fff8e0' : name === 'flyer' ? '#ffd0c0' : null); if (name === 'lease' || name === 'contract') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(20, 14, 7, 0, 7); ctx.fill(); } break;
      case 'notebook': ctx.fillStyle = '#2f6f66'; ctx.fillRect(-34, -24, 68, 48); ctx.fillStyle = '#f6efe0'; ctx.fillRect(-30, -20, 60, 40); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-2, -24, 4, 48); break;
      case 'phone': case 'phoneglow': ctx.fillStyle = '#222'; ctx.fillRect(-12, -22, 24, 44); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-9, -18, 18, 34); if (name === 'phoneglow') Sc.glow(ctx, 0, 0, 120, 'rgba(150,210,255,.35)'); break;
      case 'crate': case 'box': ctx.fillStyle = '#a8804a'; ctx.fillRect(-60, -40, 120, 70); ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 4; ctx.strokeRect(-60, -40, 120, 70); if (name === 'crate') { ctx.fillStyle = '#5a9a3a'; for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-44 + i * 22, -42, 12, 0, 7); ctx.fill(); } } break;
      case 'dough': ctx.fillStyle = '#c88a52'; ctx.fillRect(-120, -10, 240, 30); ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.ellipse(0, -16, 60, 20, 0, 0, 7); ctx.fill(); for (var d = 0; d < 4; d++) { ctx.beginPath(); ctx.moveTo(-90 + d * 50, -12); ctx.quadraticCurveTo(-80 + d * 50, -34, -70 + d * 50, -12); ctx.fill(); } break;
      case 'powder': ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-26, -34, 52, 60); ctx.fillStyle = '#c8b8a0'; ctx.fillRect(-26, -34, 52, 10); break;
      case 'pricetag': A.cell(ctx, 'atlas_ui', 10, -60, -50, 120, 100, { trim: true, fit: true, anchor: 'center' }); break;
      case 'teacup': ctx.fillStyle = '#f2f2ea'; ctx.fillRect(-18, -30, 36, 44); ctx.fillStyle = '#c0392b'; ctx.fillRect(-18, -10, 36, 6); ctx.strokeStyle = '#f2f2ea'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(22, -8, 10, -1.2, 1.2); ctx.stroke(); break;
      case 'bus': ctx.fillStyle = '#2f8a5a'; U.rr(ctx, -200, -110, 400, 130, 16); ctx.fill(); ctx.fillStyle = '#cfe8f0'; for (var w = 0; w < 5; w++) ctx.fillRect(-180 + w * 72, -96, 60, 44); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-120, 22, 22, 0, 7); ctx.arc(120, 22, 22, 0, 7); ctx.fill(); break;
      case 'pumpkin': ctx.fillStyle = '#e8902a'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 40, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4a6a2a'; ctx.fillRect(-4, -50, 8, 14); break;
      case 'ledger': A.cell(ctx, 'atlas_ui', 6, -50, -50, 100, 100, { trim: true, fit: true, anchor: 'center' }); break;
      case 'candle': ctx.fillStyle = '#f6efe0'; ctx.fillRect(-6, -30, 12, 36); ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.ellipse(0, -38 + Math.sin(t * 10) * 1.5, 5, 9, 0, 0, 7); ctx.fill(); Sc.glow(ctx, 0, -38, 160, 'rgba(255,170,70,.4)'); break;
      default: ctx.fillStyle = '#d8c8a0'; ctx.fillRect(-26, -26, 52, 52); ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 3; ctx.strokeRect(-26, -26, 52, 52);
    }
    ctx.restore();
  }
  P.drawUI = function (ctx, opts) {
    var self = this;
    if (this.mini) { this.mini.draw(ctx); return; }
    // 动作提示
    if (this.act) {
      var a = this.act, sp = Sc.toScreen(a.x, a.y);
      U.text(ctx, a.label + (a.need > 1 ? '（' + a.n + '/' + a.need + '）' : ''), 640, 120, { size: 30, align: 'center', bold: true, color: '#fff8e8', stroke: '#3b2412' });
      var hx = sp.x + 10, hy = sp.y + 10 + (a.kind === 'swipe' ? 0 : Math.abs(Math.sin(this.t * 4)) * 14);
      if (a.kind === 'swipe') hx = sp.x - 100 + ((this.t % 1.2) / 1.2) * 200;
      BSX.require('game/cooking').Kitchen.prototype.hand(ctx, hx, hy);
      U.hit('cs_act', sp.x - 120, sp.y - 120, 240, 240, { label: a.label, kind: 'act' });
    }
    // 对白框
    if (this.line && !this.ov) {
      var L = this.line, bx = 120, by = 562, bw = 1040, bh = 122;
      var big = !L.narr && bigPortrait(L.who, L.face), tx = bx + 134;
      if (big) {
        // 立绘站在对话框后面：老周在左，其他人在右
        var left = L.who === 'zhou', ph = 330, pw = big.width * ph / big.height, px = left ? bx + 10 : bx + bw - pw - 10, py = by - ph + 40;
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = Math.min(1, this.lineT * 6);
        ctx.drawImage(big, px, py + Math.max(0, 1 - this.lineT * 6) * 16, pw, ph); ctx.restore();
      }
      U.panel(ctx, bx, by, bw, bh, L.narr ? 'dark' : 'cream');
      if (!L.narr && !big) {
        ctx.save(); ctx.fillStyle = '#efe0bf'; U.rr(ctx, bx + 14, by + 11, 100, 100, 12); ctx.fill(); ctx.beginPath(); U.rr(ctx, bx + 14, by + 11, 100, 100, 12); ctx.clip(); Act.portrait(ctx, L.who, bx + 14, by + 11, 100, L.face); ctx.restore();
      }
      if (big) tx = L.who === 'zhou' ? bx + 260 : bx + 40;
      if (!L.narr) U.text(ctx, Act.nameOf(L.who), tx, by + 38, { size: 24, bold: true, color: '#2f6f66' });
      U.para(ctx, L.text.slice(0, Math.floor(this.typed)), L.narr ? bx + 40 : tx, by + (L.narr ? 52 : 80), L.narr ? bw - 80 : (big ? bw - 300 : bw - 174), { size: 26, color: L.narr ? '#fff3d6' : '#3b2a1a', lh: 34 });
      if (this.typed >= L.text.length) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(this.t * 6) * 0.4; U.text(ctx, '▼', bx + bw - 34, by + bh - 20, { size: 22, color: L.narr ? '#fff3d6' : '#7d5a35' }); ctx.restore(); }
      U.hit('cs_next', 0, 0, 1280, 720, { label: '继续', onTap: function () { self.advance(); }, minSize: 0 });
    }
    if (this.ov) this.drawOverlay(ctx);
    // 选择
    if (this.choice) {
      var list = this.choice.list, h = 76, gap = 16, total = list.length * (h + gap) - gap, y0 = 360 - total / 2 + (this.choice.title ? 50 : 0);
      if (this.choice.title) { U.panel(ctx, 220, y0 - 130, 840, 100, 'dark'); U.para(ctx, this.choice.title, 250, y0 - 88, 780, { size: 24, color: '#fff3d6', lh: 34 }); }
      list.forEach(function (c, i) { U.button(ctx, 'choice_' + c.id, 340, y0 + i * (h + gap), 600, h, c.label, { kind: 'paper', size: 28, onTap: function () { self.pick(c); } }); });
    }
    // 控制条：自动 / 跳过 / 回看
    if (!opts || !opts.noControls) {
      var y = 24, x = 1280 - 24;
      ctx.save(); ctx.fillStyle = 'rgba(18,12,8,.6)'; U.rr(ctx, x - (this.o.onLog ? 392 : 262), y - 8, (this.o.onLog ? 392 : 262) + 12, 68, 14); ctx.fill(); ctx.restore();
      var sk = U.button(ctx, 'cs_skip', x - 120, y, 120, 52, '跳过', { kind: 'ghost', size: 22, disabled: !!(this.act || this.choice), onTap: function () { self.skip(); } });
      U.button(ctx, 'cs_auto', x - 250, y, 120, 52, this.auto ? '自动●' : '自动', { kind: 'ghost', size: 22, selected: this.auto, onTap: function () { self.auto = !self.auto; } });
      if (this.o.onLog) U.button(ctx, 'cs_log', x - 380, y, 120, 52, '回看', { kind: 'ghost', size: 22, onTap: function () { self.o.onLog(); } });
    }
    if (this.toast) { var k = Math.min(1, this.toast.t * 3) * Math.min(1, (2.6 - this.toast.t) * 3); ctx.save(); ctx.globalAlpha = k; U.panel(ctx, 440, 90, 400, 90, 'cream'); A.food(ctx, this.toast.dish, 456, 96, 78); U.text(ctx, this.toast.text, 690, 145, { size: 26, bold: true, align: 'center' }); ctx.restore(); }
  };
  // 章节标题卡 / 回忆插画 / 找到账页
  P.drawOverlay = function (ctx) {
    var o = this.ov, self = this, k = Math.min(1, o.t * 3);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (o.kind === 'card') {
      var im = A.img('card_' + o.n), z = 1.04 - Math.min(1, o.t / 3) * 0.04;
      ctx.fillStyle = '#0b0805'; ctx.fillRect(0, 0, 1280, 720);
      ctx.globalAlpha = k; if (im) ctx.drawImage(im, 640 - 640 * z, 360 - 360 * z, 1280 * z, 720 * z);
      var g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(10,6,4,.75)'); g.addColorStop(1, 'rgba(10,6,4,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 300);
      var c = CARDS[o.n] || ['', ''], a2 = Math.max(0, Math.min(1, (o.t - 0.4) * 2.5));
      U.pixelText(ctx, c[0], 640, 92, { size: 34, px: 2, align: 'center', color: '#f2d9a0', outline: '#1e120a', alpha: a2 });
      U.pixelText(ctx, c[1], 640, 162, { size: 76, px: 4, align: 'center', color: '#fff3d6', outline: '#3b2412', shadow: '#1e120a', alpha: a2 });
      if (o.t > 1) U.pixelText(ctx, '点一下继续', 1240, 690, { size: 20, px: 2, align: 'right', color: '#fff3d6', outline: '#1e120a', alpha: 0.6 + Math.sin(o.t * 4) * 0.3 });
    } else if (o.kind === 'memory') {
      var im2 = A.img(o.img), pan = Math.min(1, o.t / 8 + o.li * 0.2);
      ctx.fillStyle = '#120c07'; ctx.fillRect(0, 0, 1280, 720);
      ctx.globalAlpha = k;
      if (im2) { var zz = 1.08 + pan * 0.06, w = 1280 * zz, h = 720 * zz; ctx.drawImage(im2, (1280 - w) / 2 - 30 + pan * 60, (720 - h) / 2, w, h); }
      // 泛黄与暗角
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(220,190,140,.35)'; ctx.fillRect(0, 0, 1280, 720); ctx.globalCompositeOperation = 'source-over';
      var vg = ctx.createRadialGradient(640, 360, 280, 640, 360, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,2,.7)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = 'rgba(12,8,4,.72)'; ctx.fillRect(0, 590, 1280, 130);
      var line = o.lines[o.li] || '';
      U.pixelText(ctx, line.slice(0, Math.floor(o.typed)), 640, 652, { size: 32, px: 2, align: 'center', color: '#f6e6c4', outline: '#1e120a' });
      U.pixelText(ctx, '回忆', 40, 40, { size: 22, px: 2, color: '#e8c89a', outline: '#1e120a', alpha: 0.8 });
      if (o.typed >= line.length) U.text(ctx, '▼', 1220, 690, { size: 22, color: '#f6e6c4' });
    } else if (o.kind === 'page') {
      ctx.fillStyle = 'rgba(14,9,5,' + 0.7 * k + ')'; ctx.fillRect(0, 0, 1280, 720);
      var pg = A.img('ledger_page_' + o.n), e = Math.min(1, o.t * 2.2), sc = 0.6 + 0.4 * (1 - Math.pow(1 - e, 3)), rot = (1 - e) * -0.3;
      if (pg) { ctx.save(); ctx.translate(640, 330); ctx.rotate(rot); ctx.scale(sc * 1.25, sc * 1.25); ctx.drawImage(pg, -pg.width / 2, -pg.height / 2); ctx.restore(); }
      U.pixelText(ctx, '找到账本第 ' + o.n + ' 页', 640, 600, { size: 40, px: 2, align: 'center', color: '#ffe28a', outline: '#3b2412', alpha: e });
      var have = (this.state && this.state.pages ? this.state.pages.length : 0) + ((this.state && this.state.pages && this.state.pages.indexOf(o.n) >= 0) ? 0 : 1);
      U.pixelText(ctx, '已找回 ' + Math.min(7, have) + ' / 7', 640, 650, { size: 24, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412', alpha: e });
    }
    ctx.restore();
    U.hit('cs_next', 0, 0, 1280, 720, { label: '继续', onTap: function () { self.ovAdvance(); }, minSize: 0 });
  };
  P.describe = function () {
    return { id: this.script.id, beat: this.i, of: this.beats.length, line: this.line ? { who: this.line.who, text: this.line.text, typed: this.typed >= this.line.text.length } : null,
      act: this.act ? { kind: this.act.kind, label: this.act.label, x: Math.round(Sc.toScreen(this.act.x, this.act.y).x), y: Math.round(Sc.toScreen(this.act.x, this.act.y).y), progress: this.act.n || Math.round(this.act.hold * 100) / 100 } : null,
      choice: this.choice ? this.choice.list.map(function (c) { return { id: c.id, label: c.label }; }) : null, overlay: this.ov ? this.ov.kind : null, mini: this.mini ? this.mini.describe() : null, bg: this.bg || null, auto: this.auto, done: this.done, actors: Object.keys(this.actors) };
  };
  return { Director: Director, bigPortrait: bigPortrait, CARDS: CARDS };
});
