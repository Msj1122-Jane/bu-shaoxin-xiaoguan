// 结局：第 28 天之后，空了一个月的招牌上终于写了字（或者还空着）。
// 不展示"最终数值"，而是把这个月做过的事一件件收回来：那几个选择、每位街坊的后来、小郑论文里的附录、一封信。
BSX.define('ui/s_ending', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var SIGN = require('ui/s_title').SIGN;
  var Basic = require('ui/s_basic');
  var INK = '#3b2a1a', MUTE = '#8d7a60';
  var MOOD = { E_HONEST: [255, 246, 226], E_CANTEEN: [255, 240, 214], E_PRIVATE: [250, 226, 196], E_REOPEN: [246, 240, 230], E_SOMEONE: [240, 232, 222], E_PILLS: [170, 176, 190], E_FAREWELL: [236, 196, 170], E_TRANSFER: [150, 160, 196] };

  function Ending(app) {
    var s = app.state;
    this.app = app; this.name = 'ending'; this.s = s; this.t = 0; this.stage = 0; this.st = 0; this.n = 0;
    this.end = Story.endings[s.ending] || Story.endings.E_SOMEONE; this.epi = Run.epilogue(s); this.m = Run.stats(s);
    this.sign = this.end.sign || ''; this.written = 0;
    var from = this.end.letter && this.end.letter.from; this.from = from === 'best' || !from ? Run.best(s) : from;
    Fx.reset(); require('game/stations').silence();
    Au.setScene({ place: 'street', rain: 0, crowd: 0, dawn: 1, music: 'ending' });
    this.stages = ['sign', 'text', 'echo', 'people', 'thesis', 'letter'].filter(function (k) { return k !== 'echo' || this.epi.echoes.length; }, this).filter(function (k) { return k !== 'people' || this.epi.people.length; }, this);
  }
  var P = Ending.prototype;
  P.cur = function () { return this.stages[this.stage]; };
  P.update = function (dt) {
    this.t += dt; this.st += dt;
    if (this.cur() === 'sign' && this.st > 1.2 && this.written < this.sign.length) { var w = Math.min(this.sign.length, Math.floor((this.st - 1.2) / 0.42) + 1); if (w !== this.written) { this.written = w; Au.play('chalk'); } }
  };
  P.advance = function () {
    var c = this.cur();
    if (c === 'sign' && this.st < 1.2 + this.sign.length * 0.42 + 0.6) return;
    if (c === 'text' && this.n < this.end.text.length - 1) { this.n++; this.st = 0; Au.play('page'); return; }
    if (c === 'letter') return;
    if (this.st < 0.5) return;
    this.stage++; this.st = 0; this.n = 0; Au.play('page');
  };
  P.pointer = function (type) { if (type === 'down') this.advance(); return null; };
  P.key = function (k) { if (k === ' ' || k === 'Enter') this.advance(); };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, e = this.end, c = this.cur(), t = this.t;
    var bg = A.img('bg_title') || A.img('bg_ext_morning'); if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; }
    // 招牌上的字
    if (this.sign) { ctx.save(); ctx.globalAlpha = 0.86; var shown = c === 'sign' ? this.sign.slice(0, this.written) : this.sign; ctx.font = U.font(50, 'bold', true); var full = Math.min(SIGN.w, ctx.measureText(this.sign).width), sx = SIGN.x - full / 2; ctx.textAlign = 'left'; ctx.fillStyle = '#4a2c14'; ctx.fillText(shown, sx, SIGN.y + 18, SIGN.w); ctx.restore(); }
    var m = MOOD[s.ending] || MOOD.E_SOMEONE, k0 = Math.min(1, t / 1.4);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(' + m.map(function (v) { return Math.round(v * (0.35 + 0.65 * k0)); }).join(',') + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    if (s.ending === 'E_TRANSFER' || s.ending === 'E_FAREWELL') { // 灯灭了，店里没人
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(58,56,70)'; ctx.fillRect(214, 262, 534, 270); ctx.restore();
      if (s.ending === 'E_TRANSFER') { ctx.save(); ctx.translate(520, 330); ctx.rotate(-0.04); ctx.fillStyle = '#fbf5e4'; ctx.fillRect(-70, -44, 140, 88); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 4; ctx.strokeRect(-70, -44, 140, 88); U.text(ctx, '旺铺转让', 0, 12, { size: 30, bold: true, align: 'center', color: '#b8432f' }); ctx.restore(); }
    } else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 520, 340, 260, '255,196,110', '0.3'); ctx.restore(); if (!Fx.lowFx && Math.random() < 0.2) Fx.burst(318 + Math.random() * 60, 350, 'steam', 1, 8); Fx.drawParts(ctx); }
    var g = ctx.createLinearGradient(0, 470, 0, 720); g.addColorStop(0, 'rgba(18,13,9,0)'); g.addColorStop(1, 'rgba(18,13,9,.82)'); ctx.fillStyle = g; ctx.fillRect(0, 470, 1280, 250);
    var ready = c !== 'sign' || this.st > 1.2 + this.sign.length * 0.42 + 0.3;
    if (ready) { ctx.save(); ctx.globalAlpha = c === 'sign' ? Math.min(1, (this.st - 1.2 - this.sign.length * 0.42 - 0.3) * 2) : 1; U.text(ctx, '第 ' + s.gen + ' 个月 · 结局', 62, 606, { size: 20, color: '#e8d8b8', stroke: 'rgba(20,14,8,.7)' }); U.text(ctx, e.title, 60, 664, { size: 50, bold: true, color: '#fff3d6', stroke: 'rgba(40,22,8,.92)', strokeW: 9, maxW: 640 }); if (e.mood) U.text(ctx, e.mood, 62, 700, { size: 21, color: '#f0e2c4', stroke: 'rgba(20,14,8,.7)', maxW: 640 }); ctx.restore(); }
    var px = 716, py = 96, pw = 524, ph = 500, k = Fx.ease.out3(Math.min(1, this.st * 3));
    function panel(title) { ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 24); K.paper(ctx, px, py, pw, ph, { pin: K.col.red }); U.text(ctx, title, px + 30, py + 58, { size: 27, bold: true, color: INK }); }
    if (c === 'text') {
      panel('后来');
      var yy = py + 96; e.text.slice(0, this.n + 1).forEach(function (para, i) { ctx.save(); if (i === self.n) ctx.globalAlpha *= Math.min(1, self.st * 2.5); yy += U.para(ctx, para, px + 30, yy, pw - 60, { size: 21, lh: 33, color: INK }) + 18; ctx.restore(); });
      ctx.restore();
    } else if (c === 'echo') {
      panel('这个月，你');
      var y2 = py + 100; this.epi.echoes.forEach(function (tx, i) { var a = Math.max(0, Math.min(1, (self.st - 0.3 - i * 0.7) * 2)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.col.red; ctx.beginPath(); ctx.arc(px + 38, y2 - 6, 5, 0, 7); ctx.fill(); y2 += U.para(ctx, tx, px + 56, y2, pw - 90, { size: 20, lh: 31, color: INK }) + 20; ctx.restore(); });
      ctx.restore();
    } else if (c === 'people') {
      panel('街坊');
      this.epi.people.slice(0, 4).forEach(function (p, i) { var y3 = py + 84 + i * 102, a = Math.max(0, Math.min(1, (self.st - 0.2 - i * 0.5) * 2)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#f2e8d0'; U.rr(ctx, px + 24, y3, 76, 76, 8); ctx.fill(); People.portrait(ctx, p.id, px + 26, y3 + 2, 72); U.text(ctx, Story.regs[p.id].name, px + 114, y3 + 22, { size: 19, bold: true, color: INK }); U.para(ctx, p.text, px + 114, y3 + 48, pw - 144, { size: 17, lh: 25, color: INK }); ctx.restore(); });
      ctx.restore();
    } else if (c === 'thesis') {
      var zh = s.reg.zheng.met; panel(zh ? '附录 · 小郑的论文' : '账本最后一页');
      if (zh) U.text(ctx, '《一家早餐店的诚实成本》表 3', px + pw - 30, py + 56, { size: 15, align: 'right', color: MUTE });
      var st = s.stats, rows = [['营业', s.hist.filter(function (h) { return !h.closed; }).length + ' 天'], ['端出去', st.served + ' 位客人'], ['等走了', (st.walked + st.balked) + ' 位'], ['换油', st.oilChanges + ' 回' + (st.oldOilDays ? '，老油用了 ' + st.oldOilDays + ' 天' : '')], ['进货单贴了', st.slipDays + ' 天'], ['记得"老样子"', st.remembered + ' 回'], ['接过的话', st.chats + ' 回'], ['多给的钱', '还了 ' + st.returned + ' 回' + (st.kept ? '，收了 ' + st.kept + ' 回' : '')], ['墙上留下', s.mementos.length + ' 样东西'], ['零钱盒里', K.yuan(s.cash)]];
      rows.forEach(function (r, i) { var y4 = py + 100 + i * 38; ctx.strokeStyle = 'rgba(120,90,50,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 30, y4 + 10); ctx.lineTo(px + pw - 30, y4 + 10); ctx.stroke(); U.text(ctx, r[0], px + 34, y4, { size: 19, color: MUTE }); U.text(ctx, r[1], px + pw - 34, y4, { size: 20, bold: true, align: 'right', color: INK, maxW: pw - 200 }); });
      ctx.restore();
    } else if (c === 'letter') {
      panel('一张字条');
      var who = Story.regs[this.from] ? Story.regs[this.from].name : '街坊';
      U.para(ctx, (e.letter && e.letter.text) || '明天还开吧？', px + 34, py + 110, pw - 68, { size: 24, lh: 38, color: INK });
      U.text(ctx, '—— ' + who, px + pw - 34, py + 250, { size: 20, align: 'right', color: MUTE });
      if (Story.regs[this.from]) { ctx.fillStyle = '#f2e8d0'; U.rr(ctx, px + 34, py + 206, 66, 66, 8); ctx.fill(); People.portrait(ctx, this.from, px + 36, py + 208, 62); }
      if (e.last && this.st > 1) U.text(ctx, e.last, px + pw / 2, py + 326, { size: 22, bold: true, align: 'center', color: K.col.teal, alpha: Math.min(1, (this.st - 1) * 1.5) });
      ctx.restore();
      if (this.st > 1.2) {
        K.tag(ctx, 'again', px + 30, py + ph - 96, pw - 60 - 170, 62, '再开一个月', { kind: 'teal', sub: '带一件旧物，街坊还认得你', onTap: function () { app.state = null; app.store.clearRun(); app.go(Basic.Title, {}, true); } });
        K.tag(ctx, 'home', px + pw - 190, py + ph - 96, 160, 62, '回到门口', { kind: 'wood', size: 20, onTap: function () { app.state = null; app.store.clearRun(); app.go(Basic.Title, {}, true); } });
      }
    }
    if (c !== 'letter' && ready && this.st > 0.8) U.text(ctx, '点一下，往下看', 1240, 690, { size: 17, align: 'right', color: '#f0e2c4', alpha: 0.5 + Math.sin(t * 4) * 0.3, stroke: 'rgba(20,14,8,.7)' });
  };
  P.describe = function () { return { ending: this.s.ending, title: this.end.title, sign: this.sign, stage: this.cur(), echoes: this.epi.echoes, people: this.epi.people.map(function (p) { return p.id; }) }; };
  return { Ending: Ending };
});
