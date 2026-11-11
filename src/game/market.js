// 副本·凌晨早市：35 秒内把单子上的 8 样货买齐。每个摊位轮流摆出好料或坏料；坏料标“半价”，也能顶单子，但吃进嘴里的是烧心。
// 程序修辞：赶时间时，便宜货永远离你最近。
BSX.define('game/market', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Au = require('game/audio');
  var ITEMS = [
    { name: '葱和青菜', sheet: 'mk_veg', row: 0, price: 12 }, { name: '萝卜番茄', sheet: 'mk_veg', row: 1, price: 14 },
    { name: '肉馅', sheet: 'mk_veg', row: 2, price: 38 }, { name: '鸡蛋', sheet: 'mk_veg', row: 3, price: 22 },
    { name: '食用油', sheet: 'mk_grain', row: 0, price: 66 }, { name: '黄豆', sheet: 'mk_grain', row: 1, price: 18 },
    { name: '面粉', sheet: 'mk_grain', row: 2, price: 30 }, { name: '大米', sheet: 'mk_grain', row: 3, price: 34 }
  ];
  var TIME = 35, SLOTS = [{ x: 330, y: 420 }, { x: 640, y: 440 }, { x: 950, y: 420 }];
  function Market(opts) {
    this.o = opts || {}; this.t = 0; this.got = ITEMS.map(function () { return null; }); this.slots = [null, null, null];
    this.floats = []; this.done = false; this.over = false; this.seed = (this.o.seed || 7) >>> 0; this.k = 0; this.tip = 0;
    this.result = null;
  }
  var P = Market.prototype;
  P.rand = function () { this.seed = (this.seed * 1103515245 + 12345) >>> 0; return (this.seed >>> 8) / 16777216; };
  P.remaining = function () { var out = []; for (var i = 0; i < 8; i++) if (!this.got[i]) out.push(i); return out; };
  P.spawn = function (i) {
    var rem = this.remaining(), self = this;
    var onShow = this.slots.filter(function (s) { return s; }).map(function (s) { return s.type; });
    var pool = rem.filter(function (t) { return onShow.indexOf(t) < 0; }); if (!pool.length) pool = rem;
    if (!pool.length) { this.slots[i] = null; return; }
    var type = pool[Math.floor(this.rand() * pool.length)];
    // 越到后面，坏料越多、停留越短
    var late = Math.min(1, this.t / TIME), bad = this.rand() < 0.4 + late * 0.25;
    this.slots[i] = { type: type, bad: bad, t: 0, life: 2.8 - late * 1.0 + this.rand() * 0.5, gone: false };
  };
  P.update = function (dt) {
    this.t += dt;
    if (this.over) { this.overT += dt; if (this.o.auto && this.overT > 2.2) this.done = true; return; }
    for (var i = 0; i < 3; i++) {
      var s = this.slots[i];
      if (!s) { if (this.t > 0.6 + i * 0.35) this.spawn(i); continue; }
      s.t += dt; if (s.t > s.life) this.spawn(i);
    }
    this.floats.forEach(function (f) { f.t += dt; }); this.floats = this.floats.filter(function (f) { return f.t < 1.1; });
    if (!this.remaining().length || this.t >= TIME) this.finish();
  };
  P.pick = function (i) {
    var s = this.slots[i]; if (!s || this.over || s.t < 0.15) return;
    this.got[s.type] = s.bad ? 'bad' : 'good';
    var sl = SLOTS[i];
    this.floats.push({ x: sl.x, y: sl.y - 90, t: 0, text: s.bad ? '半价！省 ' + Math.round(ITEMS[s.type].price / 2) + ' 元' : '好料 ✓', col: s.bad ? '#ffb070' : '#bff0a0' });
    Au.play(s.bad ? 'drop' : 'perfect');
    this.spawn(i);
  };
  P.finish = function () {
    if (this.over) return;
    var g = 0, b = 0, m = 0; this.got.forEach(function (x) { if (x === 'good') g++; else if (x === 'bad') b++; else m++; });
    this.result = { id: 'market', good: g, bad: b, missed: m };
    this.over = true; this.overT = 0; Au.play('stamp');
  };
  P.pointer = function (type, x, y) {
    if (type !== 'down') return true;
    if (this.over) { if (this.overT > 0.6) this.done = true; return true; }
    for (var i = 0; i < 3; i++) { var sl = SLOTS[i]; if (this.slots[i] && Math.abs(x - sl.x) < 140 && Math.abs(y - sl.y) < 110) { this.pick(i); return true; } }
    return true;
  };
  function icon(ctx, it, bad, x, y, w, h, alpha) {
    if (!A.img(it.sheet)) { ctx.fillStyle = bad ? '#7a6a3a' : '#e8c070'; ctx.fillRect(x, y, w, h); return; }
    ctx.save(); if (alpha != null) ctx.globalAlpha *= alpha;
    A.cell(ctx, it.sheet, it.row * 2 + (bad ? 1 : 0), x, y, w, h, { fit: true, anchor: 'center' });
    ctx.restore();
  }
  P.draw = function (ctx) {
    var self = this, bg = A.img('scene_market'), pan = Math.min(1, this.t / TIME);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (bg) { var bw = bg.width * 720 / bg.height; ctx.drawImage(bg, -pan * (bw - 1280), 0, bw, 720); }
    else { ctx.fillStyle = '#1e2430'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.fillStyle = 'rgba(10,8,14,.25)'; ctx.fillRect(0, 0, 1280, 720);
    // 单子
    ctx.fillStyle = 'rgba(244,233,216,.94)'; ctx.fillRect(40, 18, 1200, 120); ctx.strokeStyle = '#7a5a35'; ctx.lineWidth = 4; ctx.strokeRect(40, 18, 1200, 120);
    U.pixelText(ctx, '今天的单子', 66, 44, { size: 20, px: 2, color: '#5a3418' });
    ITEMS.forEach(function (it, i) {
      var x = 70 + i * 146, g = self.got[i];
      icon(ctx, it, g === 'bad', x, 54, 120, 60, g ? 1 : 0.28);
      U.pixelText(ctx, it.name, x + 60, 126, { size: 16, px: 2, align: 'center', color: g === 'bad' ? '#a8432f' : g ? '#2f6f3a' : '#8a7a62' });
      if (g === 'good') U.text(ctx, '✓', x + 108, 72, { size: 26, bold: true, color: '#2f8a3a' });
      if (g === 'bad') U.text(ctx, '✗', x + 108, 72, { size: 26, bold: true, color: '#c0392b' });
    });
    // 计时：天快亮了
    var left = Math.max(0, TIME - this.t);
    ctx.fillStyle = '#3b2412'; ctx.fillRect(40, 148, 1200, 14); ctx.fillStyle = left < 8 ? '#e0603a' : '#f2b440'; ctx.fillRect(42, 150, 1196 * left / TIME, 10);
    U.pixelText(ctx, '天亮前 ' + Math.ceil(left) + ' 秒', 1236, 182, { size: 20, px: 2, align: 'right', color: '#fff3d6', outline: '#1e120a' });
    // 摊位
    for (var i = 0; i < 3; i++) {
      var s = this.slots[i], sl = SLOTS[i];
      ctx.fillStyle = 'rgba(40,28,16,.78)'; ctx.fillRect(sl.x - 140, sl.y + 70, 280, 22);
      if (!s) continue;
      var it = ITEMS[s.type], a = Math.min(1, s.t * 6) * Math.min(1, (s.life - s.t) * 4), bob = Math.sin(this.t * 4 + i) * 3;
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = 'rgba(255,240,210,.16)'; ctx.fillRect(sl.x - 140, sl.y - 90, 280, 160);
      icon(ctx, it, s.bad, sl.x - 130, sl.y - 80 + bob, 260, 130);
      // 价签
      var tag = s.bad ? '半价 ¥' + Math.round(it.price / 2) : '¥' + it.price, tw = s.bad ? 150 : 90;
      ctx.fillStyle = s.bad ? '#c0392b' : '#f6efe0'; ctx.fillRect(sl.x - tw / 2, sl.y + 98, tw, 34);
      U.pixelText(ctx, tag, sl.x, sl.y + 116, { size: 20, px: 2, align: 'center', color: s.bad ? '#fff3d6' : '#3b2412' });
      // 剩余时间细条
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(sl.x - 120, sl.y + 140, 240 * Math.max(0, 1 - s.t / s.life), 4);
      ctx.restore();
      U.hit('mk_slot' + i, sl.x - 140, sl.y - 100, 280, 250, { label: (s.bad ? '坏料' : '好料') + it.name, minSize: 0, onTap: (function (j) { return function () { self.pick(j); }; })(i) });
    }
    this.floats.forEach(function (f) { U.pixelText(ctx, f.text, f.x, f.y - f.t * 50, { size: 28, px: 2, align: 'center', color: f.col, outline: '#1e120a', alpha: 1 - f.t / 1.1 }); });
    if (this.t < 3.2) U.pixelText(ctx, '点摊位上的货，把单子买齐。挑仔细点。', 640, 650, { size: 26, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: Math.min(1, (3.2 - this.t) * 2) });
    ctx.restore();
    if (this.over) {
      var r = this.result, k = Math.min(1, this.overT * 3);
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(14,9,5,.78)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
      U.pixelText(ctx, '天亮了', 640, 210, { size: 56, px: 4, align: 'center', color: '#ffe08a', outline: '#3b2412', alpha: k });
      U.pixelText(ctx, '好料 ' + r.good + '   ·   坏料 ' + r.bad + '   ·   没买到 ' + r.missed, 640, 300, { size: 32, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: k });
      var line = r.bad === 0 && r.missed <= 1 ? '老秦：“眼睛够毒。往后好货给你留着。”' : r.bad >= 3 ? '老秦：“便宜是便宜……你自己掂量。”' : r.missed >= 3 ? '老秦：“天一亮，好货都让人挑走了。”' : '老秦：“还行，下回早点来。”';
      U.pixelText(ctx, line, 640, 380, { size: 28, px: 2, align: 'center', color: '#e8c89a', outline: '#1e120a', alpha: k });
      if (r.bad) U.pixelText(ctx, '省了 ' + Math.round(r.bad * 15) + ' 元，烧心 +' + r.bad * 3, 640, 440, { size: 24, px: 2, align: 'center', color: '#ffb070', outline: '#1e120a', alpha: k });
      if (this.overT > 0.6) U.pixelText(ctx, '点一下继续', 640, 620, { size: 22, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: 0.6 + Math.sin(this.overT * 4) * 0.3 });
      U.hit('mk_done', 0, 0, 1280, 720, { label: '继续', minSize: 0, onTap: function () { if (self.overT > 0.6) self.done = true; } });
    }
  };
  P.describe = function () {
    var self = this;
    return { t: Math.round(this.t * 10) / 10, over: this.over, result: this.result, got: this.got.slice(),
      slots: this.slots.map(function (s, i) { return s ? { i: i, bad: s.bad, name: ITEMS[s.type].name, x: SLOTS[i].x, y: SLOTS[i].y, ready: s.t > 0.2 } : null; }) };
  };
  // 结算：坏料每样省 15 元、烧心 +3；全挑好料且基本买齐 → 老秦好感、口碑
  function effectOf(r) {
    var e = { cash: (r.bad || 0) * 1500, burn: (r.bad || 0) * 3 };
    if (!r.bad && r.missed <= 1) { e.rep = 1; e.aff = { qin: 1 }; e.flag = { marketClean: true }; }
    if (r.missed >= 4) e.rep = (e.rep || 0) - 1;
    return e;
  }
  return { Market: Market, ITEMS: ITEMS, effectOf: effectOf, TIME: TIME };
});
