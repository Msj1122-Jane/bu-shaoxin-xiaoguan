// 灶台：粥锅、油锅、煎锅、面锅、豆浆桶、小炉。全部在台面上就地操作，不弹特写、不暂停店面。
// 两种原型：
//   桶/锅（粥锅、豆浆桶、小炉）——整批备好，盛出即成；要照看（搅锅底、添米、磨豆、接到线）。
//   火候格（油锅、煎锅、面锅）——下锅后随时间变熟：点一下翻面/点水/翻炒，正好时再点一下出锅。
// press(x,y) 返回动作：{tap:fn} 立即生效；{grab:{dish, make()}, tap:fn} 可点可拖；{hold:{end()}} 按住。
BSX.define('game/stations', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var C = require('content/config');
  var D = require('content/dishes');
  var TEAL = '#2f6f66', TEALD = '#1f4d47', CREAM = '#f2ead8', STEEL = '#cfc8b8', LINE = '#4a3524';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mix(c1, c2, k) { k = clamp(k, 0, 1); return 'rgb(' + Math.round(lerp(c1[0], c2[0], k)) + ',' + Math.round(lerp(c1[1], c2[1], k)) + ',' + Math.round(lerp(c1[2], c2[2], k)) + ')'; }
  // 熟度颜色：生 → 金黄 → 焦褐 → 黑
  function doneCol(d, raw) { raw = raw || [244, 230, 196]; if (d < 0.9) return mix(raw, [228, 164, 66], d / 0.9); if (d < 1.3) return mix([228, 164, 66], [150, 86, 32], (d - 0.9) / 0.4); return mix([150, 86, 32], [44, 34, 28], (d - 1.3) / 0.3); }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); }
  function badge(ctx, x, y, n, warn) { var t = String(n), w = Math.max(30, 16 + t.length * 12); ctx.fillStyle = warn ? '#b8432f' : '#fbf3dc'; U.rr(ctx, x - w / 2, y - 13, w, 26, 8); ctx.fill(); ctx.strokeStyle = warn ? '#6d2014' : '#8a6a3a'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, t, x, y + 1, { size: 17, bold: true, align: 'center', base: 'middle', color: warn ? '#fff3d6' : '#3b2a1a' }); }
  function stove(ctx, x, y, w, h, on) {
    ctx.fillStyle = 'rgba(40,20,8,.3)'; U.rr(ctx, x - 2, y + 5, w + 4, h, 12); ctx.fill();
    ctx.fillStyle = TEAL; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; U.rr(ctx, x + 6, y + 4, w - 12, 8, 4); ctx.fill();
    for (var i = 0; i < 3; i++) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x + w / 2 + (i - 1) * 34, y + h - 20, 9, 0, 7); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = on ? '#e8b54a' : '#8a8a7a'; ctx.fillRect(x + w / 2 + (i - 1) * 34 - 1.5, y + h - 27, 3, 8); }
  }
  function flame(ctx, x, y, w, t) { for (var i = 0; i < 7; i++) { var fx = x - w / 2 + (i + 0.5) * w / 7, h = 9 + Math.sin(t * 9 + i * 1.7) * 3.5; ctx.fillStyle = '#e8862a'; ctx.beginPath(); ctx.moveTo(fx - 5, y); ctx.quadraticCurveTo(fx, y - h * 2, fx + 5, y); ctx.fill(); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.moveTo(fx - 2.5, y); ctx.quadraticCurveTo(fx, y - h, fx + 2.5, y); ctx.fill(); } }
  function ring(ctx, x, y, r, d, win, burnt) {
    var MAX = 1.5, a0 = -Math.PI / 2, full = Math.PI * 2;
    ctx.lineCap = 'butt'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,20,10,.35)'; ctx.beginPath(); ctx.arc(x, y, r, 0, full); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,224,130,.95)'; ctx.beginPath(); ctx.arc(x, y, r, a0 + full * win[0] / MAX, a0 + full * win[1] / MAX); ctx.stroke();
    var a = a0 + full * clamp(d, 0, MAX) / MAX;
    ctx.fillStyle = burnt ? '#2a2018' : d >= win[0] && d <= win[1] ? '#fffbe6' : d > win[1] ? '#d8552f' : '#fff3d6';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 6, 0, 7); ctx.fill(); ctx.stroke();
  }
  // 源头小盘：生坯/面团/馅料，带剩余份数
  function source(ctx, x, y, dish, n, t, hot) {
    var bob = hot ? Math.sin(t * 6) * 2 : 0;
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, x, y + 26, 30, 8); ctx.fill();
    ctx.save(); if (n <= 0) ctx.globalAlpha = 0.35;
    A.food(ctx, dish, x - 30, y - 32 + bob, 60, {});
    ctx.restore();
    badge(ctx, x + 24, y + 22, n, n <= 0);
  }

  // ───────── 出品评分（送到客人手上那一刻算）
  function windowOf(it, env) {
    var d = D.byId[it.dish], lv = env.lv[d.st] || 0, a = 0.78 - lv * C.skillWindow, b = 1.0 + lv * 0.02;
    if (d.oil) { var c = (a + b) / 2, w = (b - a) * C.oilWindow(env.oilAge); a = c - w / 2; b = c + w / 2; }
    return [a, b];
  }
  function quality(it, mod, env) {
    var d = D.byId[it.dish], q;
    if (d.cook) {
      var w = windowOf(it, env), tg = mod === '嫩' ? [w[0] - 0.2, w[0] - 0.01] : mod === '老' ? [w[1] + 0.01, w[1] + 0.22] : w;
      var dist = it.d < tg[0] ? tg[0] - it.d : it.d > tg[1] ? it.d - tg[1] : 0;
      q = 1 - dist * 2.3; if (it.d < 0.45) q = Math.min(q, 0.3);
      q *= Math.pow(0.78, it.miss || 0);
      if (d.oil) q += C.oilQ(env.oilAge);
      if (mod && dist === 0) q += 0.03;
    } else q = it.q0;
    var age = env.t - it.out, hold = d.hold * (env.s.upg.shelf ? 1.6 : 1);
    if (mod === '温') q += age >= 5 ? 0.03 : -0.2;
    else if (age > hold) q -= Math.min(0.3, (age - hold) * 0.012);
    return clamp(q + C.matQ[env.s.plan.mat] + (env.s.today.pantryQ || 0), 0.1, 1);
  }
  function word(q) { return q >= 0.92 ? '正好' : q >= 0.78 ? '不错' : q >= 0.6 ? '还行' : '差点'; }

  // ───────── 火候格灶台（油锅 / 煎锅 / 面锅）
  function SlotStation(type, dishes, r, env) {
    this.type = type; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.n = type === 'fryer' ? C.fryerSlots(env.s) : 3;
    this.slots = []; for (var i = 0; i < this.n; i++) this.slots.push(null);
    this.cx = r.x + r.w / 2; this.cy = r.y + (type === 'fryer' ? 134 : 136);
    this.rx = Math.min(r.w * 0.44, type === 'fryer' ? 118 : 100); this.ry = this.rx * (type === 'fryer' ? 0.46 : 0.56);
    this.smokeT = 0;
  }
  var SP = SlotStation.prototype;
  SP.slotPos = function (i) {
    var cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry;
    if (this.type === 'fryer') { var n = this.n, per = Math.min(46, rx * 1.7 / n); return { x: cx + (i - (n - 1) / 2) * per, y: cy - 2, r: Math.min(22, per / 2) }; }
    var P = [[-0.5, -0.12], [0.5, -0.12], [0, 0.42]][i];
    return { x: cx + P[0] * rx, y: cy + P[1] * ry * 1.25, r: 27 };
  };
  SP.srcPos = function (i) { var n = this.dishes.length, gap = Math.min(70, (this.r.w - 16) / n); return { x: this.cx + (i - (n - 1) / 2) * gap, y: this.r.y + 32 }; };
  SP.speed = function (dish) { var d = D.byId[dish]; return (1 / d.cook.t) * (d.oil ? C.oilSpeed(this.env.oilAge) : 1); };
  SP.free = function () { for (var i = 0; i < this.n; i++) if (!this.slots[i]) return i; return -1; };
  SP.count = function (dish) { return this.slots.filter(function (s) { return s && s.dish === dish && !s.burnt; }).length; };
  SP.add = function (dish) {
    var env = this.env, i = this.free();
    if ((env.stock[dish] || 0) <= 0) { env.svc.say(this.cx, this.r.y + 40, '备的卖完了'); Au.play('wrong'); return false; }
    if (i < 0) { env.svc.say(this.cx, this.cy - 40, '锅里满了'); Au.play('wrong'); return false; }
    env.stock[dish]--; env.svc.cooked(dish);
    this.slots[i] = { dish: dish, d: 0, flips: 0, need: D.byId[dish].cook.flips, born: this.t, drop: 0, fa: 0, cued: 0, rdy: false };
    var p = this.slotPos(i);
    if (this.type === 'fryer') { Au.play('drop_oil'); Fx.burst(p.x, p.y, 'oil', 9, 10); }
    else if (this.type === 'griddle') { Au.play(dish === 'egg' ? 'crack' : 'pan_in'); Fx.burst(p.x, p.y, 'steam', 3, 8); }
    else { Au.play('noodle'); Fx.burst(p.x, p.y, 'splash', 7, 8); }
    return true;
  };
  SP.flip = function (i) {
    var it = this.slots[i], p = this.slotPos(i), d = D.byId[it.dish]; it.flips++; it.fa = 1;
    var verb = d.cook.verb || '翻面';
    if (verb === '点水' || verb === '加水') { Au.play('water'); Fx.burst(p.x, p.y, 'splash', 8, 8); Fx.burst(p.x, p.y - 8, 'steam', 4, 10); }
    else if (verb === '翻炒') { Au.play('toss'); Fx.burst(p.x, p.y - 6, 'rice', 8, 10); }
    else { Au.play('flip'); Fx.burst(p.x, p.y, this.type === 'fryer' ? 'oil' : 'steam', 5, 8); }
    this.env.svc.say(p.x, p.y - 34, verb, 16);
  };
  SP.take = function (i) {
    var it = this.slots[i]; this.slots[i] = null;
    Au.play(this.type === 'fryer' ? 'fish' : this.type === 'boil' ? 'basket' : 'rack');
    return { dish: it.dish, d: it.d, miss: Math.max(0, it.need - it.flips), out: this.env.t, st: this.type };
  };
  SP.update = function (dt) {
    this.t += dt;
    var env = this.env, active = 0, self = this, old = this.type !== 'boil' && env.oilAge >= 3;
    for (var i = 0; i < this.n; i++) {
      var it = this.slots[i]; if (!it) continue;
      active++;
      var w = windowOf(it, env), sp = this.speed(it.dish), p = this.slotPos(i);
      if (it.d > w[1] && this.type === 'boil' && (env.lv.boil || 0) >= 2) sp *= 0.55;
      var before = it.d; it.d += dt * sp; it.drop = Math.min(1, it.drop + dt * 5); if (it.fa > 0) it.fa = Math.max(0, it.fa - dt * 3.2);
      if (before < w[0] && it.d >= w[0]) { it.rdy = true; Fx.burst(p.x, p.y - 8, 'glint', 3, 10); Au.play('good', { vol: 0.5, pitch: 1.3 }); }
      // 该翻面了：提示一次（煎锅熟练后会"响一声"）
      var due = (it.flips + 1) / (it.need + 1) * w[0] * 0.92;
      if (it.flips < it.need && it.d >= due && it.cued <= it.flips) { it.cued = it.flips + 1; if (this.type === 'griddle' && (env.lv.griddle || 0) >= 2) Au.play('spoon', { vol: 0.7 }); }
      if (!it.burnt && it.d >= 1.5) { it.burnt = true; Au.play('burnt'); Fx.burst(p.x, p.y - 6, 'smoke', 8, 10); env.svc.wasted(it.dish); env.svc.say(p.x, p.y - 34, '糊了', 18, '#3a2a20'); }
      if (!Fx.lowFx && Math.random() < dt * (this.type === 'boil' ? 1.4 : 2.4)) Fx.burst(p.x + (Math.random() - 0.5) * 20, p.y - 4, this.type === 'boil' ? 'steam' : it.d > w[1] + 0.12 ? 'smoke' : this.type === 'fryer' ? 'oil' : 'steam', 1, 4);
    }
    if (old && active) { this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = env.s.upg.hood ? 0.9 : 0.35; Fx.burst(this.cx + (Math.random() - 0.5) * this.rx, this.cy - this.ry, 'smoke', 1, 12); } }
    var lv = active / this.n;
    if (this.type === 'fryer') { Au.loop('sizzle', lv); Au.loop('smoke', old && active ? 0.5 : 0); } else if (this.type === 'griddle') Au.loop('griddle', lv); else Au.loop('boil', 0.25 + lv * 0.6);
  };
  SP.press = function (x, y) {
    var self = this, env = this.env, i, p;
    for (i = 0; i < this.dishes.length; i++) { p = this.srcPos(i); if (Math.abs(x - p.x) < 36 && Math.abs(y - p.y) < 40) { var dish = this.dishes[i]; return { tap: function () { var ok = self.add(dish); if (ok && self.type === 'fryer' && (env.lv.fryer || 0) >= 2 && self.free() >= 0 && (env.stock[dish] || 0) > 0 && env.svc.wants(dish) > 1) self.add(dish); } }; } }
    for (i = 0; i < this.n; i++) {
      var it = this.slots[i]; if (!it) continue; p = this.slotPos(i);
      var hw = this.type === 'fryer' ? p.r + 4 : 36, hh = this.type === 'fryer' ? 56 : 36;
      if (Math.abs(x - p.x) <= hw && Math.abs(y - p.y) <= hh) return this.slotAction(i);
    }
    return null;
  };
  SP.slotAction = function (i) {
    var self = this, it = this.slots[i], env = this.env, p = this.slotPos(i);
    if (it.burnt) return { tap: function () { self.slots[i] = null; Au.play('trash'); Fx.burst(p.x, p.y, 'dust', 6, 8); } };
    var grab = { dish: it.dish, x: p.x, y: p.y, make: function () { return self.slots[i] === it ? self.take(i) : null; } };
    return { grab: grab, tap: function () {
      if (self.slots[i] !== it) return;
      if (it.flips < it.need) { self.flip(i); return; }
      if (it.d < 0.45) { it.fa = 0.6; env.svc.say(p.x, p.y - 34, '还没熟', 16); Au.play('wrong', { vol: 0.5 }); return; }
      env.svc.smart(grab);
    } };
  };
  SP.points = function () {
    var o = {}, self = this;
    this.dishes.forEach(function (d, i) { var p = self.srcPos(i); o['src_' + d] = [p.x, p.y]; });
    for (var i = 0; i < this.n; i++) { var p = this.slotPos(i); o['slot' + i] = [p.x, p.y]; }
    return o;
  };
  SP.describe = function () { var env = this.env; return { type: this.type, slots: this.slots.map(function (it) { return it ? { dish: it.dish, d: +it.d.toFixed(2), flips: it.flips, need: it.need, win: windowOf(it, env).map(function (v) { return +v.toFixed(2); }), burnt: !!it.burnt } : null; }) }; };
  function drawItem(ctx, st, it, p, t) {
    var d = it.d, dish = it.dish, drop = Fx.ease.back(it.drop), sq = 1 + it.fa * 0.25, hop = Math.sin(it.fa * Math.PI) * 14;
    ctx.save(); ctx.translate(p.x, p.y - hop); ctx.scale(drop * sq, drop * (2 - sq));
    var col = doneCol(d), dark = doneCol(d + 0.25);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(70,40,14,.75)';
    if (dish === 'youtiao') { var w = Math.min(p.r * 0.72, 13), L = 40 + Math.min(1, d) * 9; for (var k = -1; k <= 1; k += 2) { ctx.fillStyle = k * (it.flips % 2 ? -1 : 1) > 0 ? col : dark; U.rr(ctx, k * w * 0.5 - w * 0.55, -L, w * 1.1, L * 2, w * 0.55); ctx.fill(); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w * 0.75, -L + 8, 2.5, L * 1.2); }
    else if (dish === 'tangyou') { [[-9, -14], [8, -8], [-6, 6], [9, 14]].forEach(function (q, j) { ctx.fillStyle = j % 2 ? col : dark; ctx.beginPath(); ctx.arc(q[0], q[1], 10.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(q[0] - 5, q[1] - 6, 3, 3); }); }
    else if (dish === 'scallion') { ctx.fillStyle = col; ell(ctx, 0, 0, 30, 20); ctx.fill(); ctx.stroke(); ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.beginPath(); for (var a = 0; a < 12; a += 0.4) { var rr = a * 2.1; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.66); } ctx.stroke(); ctx.fillStyle = '#5aa04a'; [[-12, -4], [8, -8], [14, 5], [-4, 9], [2, -2]].forEach(function (q) { ctx.fillRect(q[0], q[1], 4, 2); }); }
    else if (dish === 'egg') { ctx.fillStyle = mix([255, 252, 242], [226, 170, 90], clamp((d - 0.7) / 0.8, 0, 1)); ctx.beginPath(); ctx.ellipse(0, 0, 28, 19, 0.2, 0, 7); ctx.fill(); ctx.stroke(); if (it.flips % 2 === 0) { ctx.fillStyle = '#f5b423'; ctx.beginPath(); ctx.arc(3, -1, 9.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-1, -6, 4, 3); } else { ctx.fillStyle = 'rgba(190,120,50,.5)'; ell(ctx, 0, 0, 16, 10); ctx.fill(); } }
    else if (dish === 'shengjian') { [[-12, -8], [12, -8], [-12, 9], [12, 9]].forEach(function (q) { ctx.fillStyle = mix([250, 244, 228], [222, 168, 84], clamp(d / 1.1, 0, 1)); ctx.beginPath(); ctx.arc(q[0], q[1], 11.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); }); if (it.flips >= 1 && d < 1.0) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, 0, 0, 30, 21); ctx.fill(); } }
    else if (dish === 'friedrice') { ctx.fillStyle = mix([250, 244, 222], [226, 180, 96], clamp(d / 1.1, 0, 1)); ell(ctx, 0, 2, 29, 19); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2c94c'; [[-10, -4], [6, -8], [12, 3], [-3, 6], [-14, 6], [2, -1]].forEach(function (q) { ctx.fillRect(q[0], q[1], 5, 4); }); ctx.fillStyle = '#5aa04a'; [[-6, -9], [10, -2], [-11, 1], [4, 9]].forEach(function (q) { ctx.fillRect(q[0], q[1], 4, 2); }); }
    else { // 面锅：漏勺里的东西
      var rise = it.rdy ? Math.sin(t * 5 + p.x) * 2 - 3 : 2;
      ctx.translate(0, rise);
      if (dish === 'dumpling') { [[-11, -6], [9, -8], [-3, 6], [13, 6]].forEach(function (q, j) { ctx.fillStyle = '#f8f2e2'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 10, 6.5, j * 0.5, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else if (dish === 'tangyuan') { [[-10, -6], [8, -8], [-2, 6], [12, 6], [-14, 6]].forEach(function (q) { ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.arc(q[0], q[1], 7.5, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else if (dish === 'mutton') { [[-10, -5], [6, -7], [-2, 5], [12, 5]].forEach(function (q, j) { ctx.fillStyle = mix([200, 120, 110], [150, 104, 84], clamp(d, 0, 1)); ctx.beginPath(); ctx.ellipse(q[0], q[1], 11, 5.5, j * 0.7, 0, 7); ctx.fill(); ctx.stroke(); }); }
      else { ctx.strokeStyle = dish === 'mixian' ? '#fbfaf2' : '#f0d890'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; for (var j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc((j - 2) * 6, Math.sin(j * 2.1) * 5, 11, j * 1.1, j * 1.1 + 3.6); ctx.stroke(); } if (dish === 'poachnoodle') A.drawEgg(ctx, 2, -2, 8); if (dish === 'chicken') { ctx.fillStyle = '#f6e2a0'; ctx.fillRect(-9, -3, 8, 5); ctx.fillRect(4, 2, 8, 5); } }
    }
    ctx.restore();
  }
  SP.draw = function (ctx) {
    var r = this.r, env = this.env, cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry, t = this.t, i, self = this;
    stove(ctx, cx - rx * 0.96, cy + ry * 0.5, rx * 1.92, r.y + r.h - 6 - (cy + ry * 0.5), true);
    flame(ctx, cx, cy + ry * 0.98, rx * 1.2, t);
    if (this.type === 'fryer') {
      // 方口油锅
      var x0 = cx - rx, y0 = cy - ry - 6, w = rx * 2, h = ry * 2 + 12;
      ctx.fillStyle = '#3a3836'; U.rr(ctx, x0 - 6, y0 - 4, w + 12, h + 14, 14); ctx.fill(); ctx.strokeStyle = '#1e1c1a'; ctx.lineWidth = 3; ctx.stroke();
      var k = clamp(env.oilAge / 5, 0, 1); ctx.fillStyle = mix([236, 184, 74], [104, 64, 24], k); U.rr(ctx, x0, y0, w, h, 10); ctx.fill();
      ctx.save(); U.rr(ctx, x0, y0, w, h, 10); ctx.clip();
      ctx.fillStyle = 'rgba(255,240,190,' + (0.22 - k * 0.14).toFixed(2) + ')';
      for (i = 0; i < 4; i++) { ell(ctx, x0 + ((i * 71 + t * 14) % (w + 60)) - 30, y0 + 16 + i * (h - 26) / 3, 34, 4); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; U.rr(ctx, x0 + 3, y0 + 3, w - 6, h - 6, 8); ctx.stroke();
    } else if (this.type === 'griddle') {
      ctx.fillStyle = '#2c2a28'; ctx.save(); ctx.translate(cx + rx * 0.86, cy + ry * 0.7); ctx.rotate(0.6); U.rr(ctx, 0, -9, rx * 0.75, 18, 8); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#1e1c1b'; ell(ctx, cx, cy + 6, rx + 5, ry + 5); ctx.fill();
      ctx.fillStyle = '#3b3835'; ell(ctx, cx, cy, rx + 4, ry + 4); ctx.fill(); ctx.strokeStyle = '#161514'; ctx.lineWidth = 3; ctx.stroke();
      var ko = clamp(env.oilAge / 5, 0, 1); ctx.fillStyle = mix([72, 62, 48], [44, 36, 30], ko); ell(ctx, cx, cy, rx - 6, ry - 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,150,.10)'; ell(ctx, cx - rx * 0.3, cy - ry * 0.3, rx * 0.4, ry * 0.2); ctx.fill();
    } else {
      ctx.fillStyle = '#a9a294'; ell(ctx, cx, cy + 22, rx, ry); ctx.fill(); ctx.fillRect(cx - rx, cy, rx * 2, 22);
      ctx.fillStyle = STEEL; ell(ctx, cx, cy, rx, ry); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#5f7f7c'; ell(ctx, cx, cy, rx - 9, ry - 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      for (i = 0; i < 6; i++) { var bp = (t * 0.9 + i * 0.37) % 1, bx = cx + Math.cos(i * 2.4) * rx * 0.6, by = cy + Math.sin(i * 1.7) * ry * 0.5; ctx.globalAlpha = 1 - bp; ctx.beginPath(); ctx.arc(bx, by, 3 + bp * 9, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = TEAL; U.rr(ctx, cx - rx - 16, cy - 8, 20, 16, 5); ctx.fill(); U.rr(ctx, cx + rx - 4, cy - 8, 20, 16, 5); ctx.fill();
    }
    for (i = 0; i < this.n; i++) {
      var p = this.slotPos(i), it = this.slots[i];
      if (this.type === 'boil') { ctx.strokeStyle = '#7a7468'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(40,60,58,.35)'; ctx.fill(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x + 22, p.y - 22); ctx.lineTo(p.x + 40, p.y - 44); ctx.stroke(); }
      else if (!it) { ctx.strokeStyle = 'rgba(255,240,200,.16)'; ctx.setLineDash([5, 6]); ctx.lineWidth = 2; if (this.type === 'fryer') { U.rr(ctx, p.x - p.r * 0.7, p.y - 44, p.r * 1.4, 88, 10); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, 7); ctx.stroke(); } ctx.setLineDash([]); }
      if (it) {
        drawItem(ctx, this, it, p, t);
        var w2 = windowOf(it, env), ry2 = this.type === 'fryer' ? p.y + 62 : p.y + 34;
        ring(ctx, p.x, ry2, 13, it.d, w2, it.burnt);
        if (it.flips < it.need && !it.burnt) { var due = (it.flips + 1) / (it.need + 1) * w2[0] * 0.92, on = it.d >= due; ctx.save(); ctx.globalAlpha = on ? 0.75 + Math.sin(t * 9) * 0.25 : 0.4; ctx.fillStyle = on ? '#fff3b8' : '#fff8e8'; ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, ry2, 8.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, ry2, 4.5, -2.4, 1.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x + 1, ry2 + 5.5); ctx.lineTo(p.x + 5, ry2 + 3); ctx.lineTo(p.x + 5, ry2 + 7); ctx.fill(); ctx.restore(); }
      }
    }
    this.dishes.forEach(function (d, j) { var sp = self.srcPos(j); source(ctx, sp.x, sp.y, d, env.stock[d] || 0, t, false); });
  };

  // ───────── 粥锅
  function Pot(dishes, r, env) {
    this.type = 'pot'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.cap = C.potCap(env.s);
    this.base = dishes.indexOf('congee') >= 0 ? 'congee' : dishes[0];
    this.tops = dishes.filter(function (d) { return D.byId[d].top; });
    this.total = function () { var n = 0; dishes.forEach(function (d) { n += env.stock[d] || 0; }); return n; };
    this.servings = Math.min(this.cap, this.total()); this.cookT = 0; this.batch = 0;
    this.stick = 0; this.scorched = false; this.stirT = 0; this.ladleT = 0;
    this.cx = r.x + r.w / 2 - (this.tops.length ? 6 : 0); this.cy = r.y + 130; this.rx = Math.min(r.w * 0.4, 100); this.ry = this.rx * 0.56;
  }
  var PP = Pot.prototype;
  PP.reserve = function () { return Math.max(0, this.total() - this.servings - this.batch); };
  PP.count = function () { return 0; };
  PP.spoon = function () { return { x: this.cx + this.rx * 0.82, y: this.cy - this.ry * 1.15 }; };
  PP.sack = function () { return { x: this.r.x + 36, y: this.r.y + 36 }; };
  PP.topPos = function (i) { return { x: this.r.x + this.r.w - 38 - i * 66, y: this.r.y + 34 }; };
  PP.potQ = function () { return 0.93 + (this.stick < 0.5 ? 0.07 : 0) - (this.scorched ? 0.3 : 0); };
  PP.update = function (dt) {
    this.t += dt; var env = this.env;
    if (this.stirT > 0) this.stirT = Math.max(0, this.stirT - dt * 1.8);
    if (this.ladleT > 0) this.ladleT = Math.max(0, this.ladleT - dt * 3);
    if (this.cookT > 0) { this.cookT -= dt; if (this.cookT <= 0) { this.servings += this.batch; this.batch = 0; Au.play('lid'); Fx.burst(this.cx, this.cy - 20, 'steam', 10, 30); env.svc.say(this.cx, this.cy - 50, '新的一锅好了', 18); } }
    if (this.servings > 0) { this.stick += dt / (40 + (env.lv.pot || 0) * 14); if (this.stick >= 1 && !this.scorched) { this.scorched = true; Au.play('burnt', { vol: 0.6 }); env.svc.say(this.cx, this.cy - 50, '糊底了', 18, '#3a2a20'); } }
    else { this.stick = 0; this.scorched = false; }
    if (!Fx.lowFx && this.servings > 0 && Math.random() < dt * 1.3) Fx.burst(this.cx + (Math.random() - 0.5) * this.rx, this.cy - 10, 'steam', 1, 6);
    Au.loop('simmer', this.servings > 0 || this.cookT > 0 ? 0.6 : 0);
  };
  PP.stir = function () { this.stirT = 1; this.stick = Math.max(0, this.stick - 0.55); Au.play('stir'); Fx.burst(this.cx, this.cy - 14, 'steam', 3, 16); };
  PP.refill = function () {
    var env = this.env, n = Math.min(this.cap - this.servings, this.reserve());
    if (this.cookT > 0) { env.svc.say(this.cx, this.cy - 50, '这锅还在熬', 16); return; }
    if (n <= 0) { env.svc.say(this.sack().x + 30, this.sack().y - 20, this.reserve() <= 0 ? '备的米用完了' : '锅还满着', 16); Au.play('wrong', { vol: 0.5 }); return; }
    this.batch = n; this.cookT = 9; Au.play('rice'); Fx.burst(this.cx, this.cy - 8, 'rice', 12, 24);
    if (this.servings <= 0) { this.stick = 0; this.scorched = false; }
  };
  PP.grabFor = function (dish, x, y) {
    var self = this, env = this.env;
    return { dish: dish, x: x, y: y, make: function () {
      if (self.servings < 1 || (env.stock[dish] || 0) < 1) { env.svc.say(self.cx, self.cy - 50, self.cookT > 0 ? '还在熬' : (env.stock[dish] || 0) < 1 ? '卖完了' : '锅空了，添米', 16); Au.play('wrong', { vol: 0.5 }); return null; }
      self.servings--; env.stock[dish]--; env.svc.cooked(dish); self.ladleT = 1; Au.play('ladle'); Fx.burst(self.cx, self.cy - 10, 'drop', 4, 10);
      return { dish: dish, q0: self.potQ(), out: env.t, st: 'pot' };
    } };
  };
  PP.press = function (x, y) {
    var self = this, sp = this.spoon(), sk = this.sack(), i;
    if (Math.hypot(x - sp.x, y - sp.y) < 36) return { tap: function () { self.stir(); } };
    if (Math.abs(x - sk.x) < 36 && Math.abs(y - sk.y) < 38) return { tap: function () { self.refill(); } };
    for (i = 0; i < this.tops.length; i++) { var tp = this.topPos(i); if (Math.abs(x - tp.x) < 34 && Math.abs(y - tp.y) < 36) return { grab: this.grabFor(this.tops[i], tp.x, tp.y) }; }
    var dx = (x - this.cx) / (this.rx + 6), dy = (y - this.cy) / (this.ry + 14);
    if (dx * dx + dy * dy <= 1 && this.dishes.indexOf('congee') >= 0) return { grab: this.grabFor('congee', this.cx, this.cy) };
    return null;
  };
  PP.points = function () { var o = { take: [this.cx, this.cy + 6], stir: [this.spoon().x, this.spoon().y], refill: [this.sack().x, this.sack().y] }, self = this; this.tops.forEach(function (d, i) { var p = self.topPos(i); o['top_' + d] = [p.x, p.y]; }); return o; };
  PP.describe = function () { return { type: 'pot', servings: this.servings, reserve: this.reserve(), stick: +this.stick.toFixed(2), scorched: this.scorched, cooking: this.cookT > 0 }; };
  PP.draw = function (ctx) {
    var r = this.r, env = this.env, cx = this.cx, cy = this.cy, rx = this.rx, ry = this.ry, t = this.t, i, self = this;
    stove(ctx, cx - rx * 0.96, cy + ry * 0.55, rx * 1.92, r.y + r.h - 6 - (cy + ry * 0.55), true);
    flame(ctx, cx, cy + ry + 22, rx * 1.2, t);
    ctx.fillStyle = '#b3ab9b'; ell(ctx, cx, cy + 26, rx, ry); ctx.fill(); ctx.fillRect(cx - rx, cy, rx * 2, 26);
    ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy + 26, rx, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = TEAL; U.rr(ctx, cx - rx - 18, cy - 9, 22, 18, 6); ctx.fill(); U.rr(ctx, cx + rx - 4, cy - 9, 22, 18, 6); ctx.fill();
    ctx.fillStyle = STEEL; ell(ctx, cx, cy, rx, ry); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#7d766a'; ell(ctx, cx, cy, rx - 8, ry - 6); ctx.fill();
    var lvl = clamp(this.servings / this.cap, 0, 1), cooking = this.cookT > 0;
    if (this.servings > 0 || cooking) {
      var k = 0.7 + 0.3 * Math.max(lvl, cooking ? 0.6 : 0), sy = cy + (1 - k) * 16;
      ctx.fillStyle = cooking && this.servings <= 0 ? '#e9ece2' : this.scorched ? '#e6d8b8' : '#f7f1de'; ell(ctx, cx, sy, (rx - 9) * k, (ry - 7) * k); ctx.fill();
      ctx.save(); ell(ctx, cx, sy, (rx - 9) * k, (ry - 7) * k); ctx.clip();
      if (this.stick > 0.45) { ctx.strokeStyle = 'rgba(150,96,40,' + clamp((this.stick - 0.45) * 1.1, 0, 0.7).toFixed(2) + ')'; ctx.lineWidth = 10; ell(ctx, cx, sy, (rx - 12) * k, (ry - 9) * k); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for (i = 0; i < 9; i++) { ctx.fillRect(cx + Math.cos(i * 2.3 + this.stirT * 6) * rx * 0.5 * k, sy + Math.sin(i * 1.9 + this.stirT * 6) * ry * 0.45 * k, 5, 2.5); }
      ctx.strokeStyle = 'rgba(190,176,140,.8)'; ctx.lineWidth = 2;
      for (i = 0; i < 4; i++) { var bp = (t * (cooking ? 1.4 : 0.55) + i * 0.29) % 1; ctx.globalAlpha = 1 - bp; ctx.beginPath(); ctx.arc(cx + Math.cos(i * 2.6 + 1) * rx * 0.45 * k, sy + Math.sin(i * 1.7) * ry * 0.4 * k, 2 + bp * 8, 0, 7); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    // 木勺
    var sp = this.spoon(), a = this.stirT > 0 ? this.stirT * 12 : 0, tipx = cx + Math.cos(a) * rx * 0.34, tipy = cy + Math.sin(a) * ry * 0.34 - 2, urge = this.stick > 0.55 && this.stirT <= 0 ? Math.sin(t * 10) * 3 : 0;
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(sp.x + urge, sp.y); ctx.stroke();
    ctx.strokeStyle = '#b07a40'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tipx, tipy - 1); ctx.lineTo(sp.x + urge, sp.y - 1); ctx.stroke();
    ctx.fillStyle = '#a06a34'; ctx.beginPath(); ctx.arc(sp.x + urge, sp.y, 9, 0, 7); ctx.fill();
    if (this.stick > 0.55 && this.stirT <= 0) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '搅一搅', sp.x + 4, sp.y - 20, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
    // 盛粥的瞬间
    if (this.ladleT > 0) { var ly = cy - 26 * Math.sin(this.ladleT * Math.PI); ctx.fillStyle = STEEL; ell(ctx, cx - 10, ly, 16, 10); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f7f1de'; ell(ctx, cx - 10, ly, 12, 7); ctx.fill(); }
    // 米袋
    var sk = this.sack(), res = this.reserve(), want = this.servings <= 2 && res > 0 && !cooking;
    ctx.save(); ctx.translate(sk.x, sk.y + (want ? Math.sin(t * 7) * 2.5 : 0));
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, 0, 28, 30, 7); ctx.fill();
    ctx.fillStyle = '#d9c7a0'; U.rr(ctx, -28, -22, 56, 50, 10); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#fbfaf2'; ell(ctx, 0, -20, 22, 7); ctx.fill(); ctx.stroke();
    U.text(ctx, '米', 0, 13, { size: 22, bold: true, align: 'center', color: '#8a4a2a' });
    ctx.restore();
    badge(ctx, sk.x + 26, sk.y + 24, res, res <= 0);
    if (cooking) U.ring(ctx, sk.x, sk.y + 2, 36, 1 - this.cookT / 9, '#ffe28a', 5);
    else if (want) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '添米', sk.x, sk.y - 30, { size: 17, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
    this.tops.forEach(function (d, j) { var tp = self.topPos(j); source(ctx, tp.x, tp.y, d, env.stock[d] || 0, t, false); });
    badge(ctx, cx - rx + 6, cy - ry - 4, this.servings + '碗', this.servings <= 0);
  };

  // ───────── 豆浆桶
  function Soy(dishes, r, env) {
    this.type = 'soy'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0;
    this.cap = 10; this.cups = Math.min(this.cap, env.stock.soy || 0);
    this.fill = 0; this.pouring = false; this.grinding = false; this.grind = 0; this.spillT = 0; this.millA = 0;
    this.cx = r.x + r.w / 2 + 16; this.top = r.y + 12;
  }
  var YP = Soy.prototype;
  YP.reserve = function () { return Math.max(0, (this.env.stock.soy || 0) - this.cups); };
  YP.count = function () { return 0; };
  YP.cupPos = function () { return { x: this.cx, y: this.r.y + 184 }; };
  YP.mill = function () { return { x: this.r.x + 32, y: this.r.y + 168 }; };
  YP.update = function (dt) {
    this.t += dt; var env = this.env, lv = env.lv.soy || 0;
    if (this.spillT > 0) this.spillT -= dt;
    if (this.pouring) {
      var rate = 0.95; if (lv >= 2 && this.fill > 0.78) rate *= 0.5;
      this.fill += dt * rate; Au.loop('pour', 1, this.fill);
      if (this.fill >= 1.04) this.endPour(true);
    } else Au.loop('pour', 0, 0);
    if (this.grinding) { this.grind += dt / 2.1; this.millA += dt * 7; Au.loop('grind', 1); if (this.grind >= 1) { var n = Math.min(this.cap - this.cups, this.reserve()); this.cups += n; this.grind = 0; this.grinding = false; Au.play('lid'); env.svc.say(this.mill().x + 20, this.mill().y - 40, '磨好 ' + n + ' 杯', 17); } }
    else Au.loop('grind', 0);
  };
  YP.endPour = function (over) {
    if (!this.pouring) return; this.pouring = false;
    var f = this.fill, env = this.env, lv = env.lv.soy || 0, c = this.cupPos(), lo = 0.8 - lv * 0.025;
    if (f < 0.3) { this.fill = 0; return; }
    var q = over ? 0.78 : f >= lo && f <= 1.0 ? 1 : f >= lo - 0.14 ? 0.84 : 0.62;
    if (over) { this.spillT = 0.5; Au.play('spill'); Fx.burst(c.x, c.y - 10, 'splash', 10, 12); env.svc.say(c.x, c.y - 50, '溢了', 17); if (this.cups > 1 && Math.random() < 0.5) { this.cups--; env.stock.soy--; env.svc.wasted('soy'); } }
    else { Au.play('cup'); env.svc.say(c.x, c.y - 50, q >= 1 ? '正好' : q >= 0.8 ? '差一点满' : '不满', 17, q >= 1 ? '#fff3b8' : null); }
    this.cups--; env.stock.soy--; env.svc.cooked('soy');
    this.fill = 0;
    env.svc.produce({ dish: 'soy', q0: q, out: env.t, st: 'soy' }, c.x, c.y - 10);
  };
  YP.press = function (x, y) {
    var self = this, env = this.env, c = this.cupPos(), m = this.mill();
    if (Math.abs(x - m.x) < 38 && Math.abs(y - m.y) < 44) {
      if (this.reserve() <= 0 || this.cups >= this.cap) { return { tap: function () { env.svc.say(m.x + 20, m.y - 40, self.reserve() <= 0 ? '豆子磨完了' : '桶还满着', 16); Au.play('wrong', { vol: 0.5 }); } }; }
      this.grinding = true; return { hold: { end: function () { self.grinding = false; } } };
    }
    if (Math.abs(x - c.x) < 62 && y > this.r.y + 60 && y < this.r.y + this.r.h) {
      if (this.cups <= 0) return { tap: function () { env.svc.say(c.x, c.y - 50, self.reserve() > 0 ? '桶空了，先磨豆' : '豆浆卖完了', 16); Au.play('wrong', { vol: 0.5 }); } };
      if (!env.svc.canTake('soy')) return { tap: function () { env.svc.say(c.x, c.y - 50, '台面满了', 16); Au.play('wrong', { vol: 0.5 }); } };
      this.pouring = true; this.fill = Math.max(this.fill, 0.02);
      return { hold: { end: function () { self.endPour(false); } } };
    }
    return null;
  };
  YP.points = function () { var c = this.cupPos(), m = this.mill(); return { pour: [c.x, c.y], mill: [m.x, m.y] }; };
  YP.describe = function () { return { type: 'soy', cups: this.cups, reserve: this.reserve(), fill: +this.fill.toFixed(2), pouring: this.pouring, grinding: this.grinding, band: [0.8 - (this.env.lv.soy || 0) * 0.025, 1.0] }; };
  YP.draw = function (ctx) {
    var r = this.r, cx = this.cx, top = this.top, t = this.t, c = this.cupPos(), m = this.mill();
    ctx.fillStyle = 'rgba(40,20,8,.28)'; ell(ctx, cx, r.y + r.h - 14, 62, 12); ctx.fill();
    // 桶身
    ctx.fillStyle = TEAL; U.rr(ctx, cx - 48, top + 16, 96, 112, 16); ctx.fill(); ctx.strokeStyle = TEALD; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = CREAM; ctx.fillRect(cx - 47, top + 52, 94, 30); ctx.strokeStyle = TEALD; ctx.lineWidth = 2; ctx.strokeRect(cx - 47, top + 52, 94, 30);
    U.text(ctx, '豆浆', cx, top + 74, { size: 19, bold: true, align: 'center', color: TEALD });
    ctx.fillStyle = 'rgba(255,255,255,.16)'; U.rr(ctx, cx - 40, top + 22, 12, 96, 6); ctx.fill();
    ctx.fillStyle = TEALD; U.rr(ctx, cx - 40, top, 80, 20, 9); ctx.fill(); ctx.fillStyle = '#3a3836'; U.rr(ctx, cx - 9, top - 9, 18, 12, 5); ctx.fill();
    // 存量窗
    ctx.fillStyle = '#16332f'; U.rr(ctx, cx + 30, top + 24, 9, 24, 3); ctx.fill(); ctx.fillStyle = '#fbf6e6'; var lv = this.cups / this.cap; ctx.fillRect(cx + 32, top + 46 - 20 * lv, 5, 20 * lv);
    // 龙头
    ctx.fillStyle = '#b8b0a0'; ctx.fillRect(cx - 6, top + 126, 12, 16); ctx.fillStyle = '#3a3836'; U.rr(ctx, cx - 14, top + 122, 28, 8, 3); ctx.fill();
    // 杯子
    var cw = 38, ch = 44, cyTop = c.y - ch / 2;
    if (this.pouring || this.fill > 0) { ctx.fillStyle = '#fbf6e6'; ctx.fillRect(cx - 2.5, top + 142, 5, cyTop + ch - (top + 142) - ch * Math.min(1, this.fill)); }
    ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.moveTo(c.x - cw / 2, cyTop); ctx.lineTo(c.x + cw / 2, cyTop); ctx.lineTo(c.x + cw / 2 - 5, cyTop + ch); ctx.lineTo(c.x - cw / 2 + 5, cyTop + ch); ctx.closePath(); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.stroke();
    var f = Math.min(1, this.fill);
    if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(c.x - cw / 2, cyTop + ch * (1 - f), cw, ch * f); ctx.clip(); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(c.x - cw / 2 + 2, cyTop); ctx.lineTo(c.x + cw / 2 - 2, cyTop); ctx.lineTo(c.x + cw / 2 - 6, cyTop + ch - 2); ctx.lineTo(c.x - cw / 2 + 6, cyTop + ch - 2); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // 刻线（最佳区间）
    var lo = 0.8 - (this.env.lv.soy || 0) * 0.025;
    ctx.strokeStyle = '#2f6f66'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c.x - cw / 2 - 5, cyTop + ch * (1 - lo)); ctx.lineTo(c.x - cw / 2 + 7, cyTop + ch * (1 - lo)); ctx.moveTo(c.x + cw / 2 + 5, cyTop + ch * (1 - lo)); ctx.lineTo(c.x + cw / 2 - 7, cyTop + ch * (1 - lo)); ctx.stroke();
    ctx.fillStyle = '#7a7468'; U.rr(ctx, c.x - 34, c.y + ch / 2 - 2, 68, 10, 4); ctx.fill();
    badge(ctx, cx - 44, top + 6, this.cups + '杯', this.cups <= 0);
    // 石磨
    var res = this.reserve(), want = this.cups <= 2 && res > 0 && !this.grinding;
    ctx.fillStyle = 'rgba(40,20,8,.25)'; ell(ctx, m.x, m.y + 30, 30, 8); ctx.fill();
    ctx.fillStyle = '#8f8a82'; U.rr(ctx, m.x - 26, m.y, 52, 26, 8); ctx.fill(); ctx.strokeStyle = '#4a4744'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#a8a39a'; ell(ctx, m.x, m.y - 2, 26, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a665e'; ell(ctx, m.x, m.y - 2, 6, 3); ctx.fill();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x, m.y - 2); ctx.lineTo(m.x + Math.cos(this.millA) * 30, m.y - 2 + Math.sin(this.millA) * 12 - 8); ctx.stroke();
    if (res > 0) badge(ctx, m.x + 20, m.y + 34, res, false);
    if (this.grinding) U.ring(ctx, m.x, m.y + 4, 38, this.grind, '#ffe28a', 5);
    else if (want) { ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3; U.text(ctx, '按住磨豆', m.x + 6, m.y - 26, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); ctx.restore(); }
  };

  // ───────── 小炉（茶叶蛋、叶儿粑：早上备好，顺手拿）
  function Side(dishes, r, env) { this.type = 'side'; this.dishes = dishes; this.r = r; this.env = env; this.t = 0; this.cx = r.x + r.w / 2; }
  var DP = Side.prototype;
  DP.count = function () { return 0; };
  DP.pos = function (i) { var n = this.dishes.length; return { x: this.cx, y: this.r.y + (n === 1 ? 130 : 70 + i * 112) }; };
  DP.update = function (dt) { this.t += dt; if (!Fx.lowFx && Math.random() < dt * 0.8) { var p = this.pos(0); Fx.burst(p.x + (Math.random() - 0.5) * 30, p.y - 20, 'steam', 1, 6); } };
  DP.press = function (x, y) {
    var self = this, env = this.env;
    for (var i = 0; i < this.dishes.length; i++) { var p = this.pos(i); if (Math.abs(x - p.x) < 58 && Math.abs(y - p.y) < 52) return { grab: (function (dish, p2) { return { dish: dish, x: p2.x, y: p2.y, make: function () { if ((env.stock[dish] || 0) < 1) { env.svc.say(p2.x, p2.y - 50, '卖完了', 16); Au.play('wrong', { vol: 0.5 }); return null; } env.stock[dish]--; env.svc.cooked(dish); Au.play('spoon'); return { dish: dish, q0: 0.95, out: env.t, st: 'side' }; } }; })(this.dishes[i], p) }; }
    return null;
  };
  DP.points = function () { var o = {}, self = this; this.dishes.forEach(function (d, i) { var p = self.pos(i); o['src_' + d] = [p.x, p.y]; }); return o; };
  DP.describe = function () { return { type: 'side' }; };
  DP.draw = function (ctx) {
    var self = this, env = this.env, t = this.t;
    this.dishes.forEach(function (d, i) {
      var p = self.pos(i), n = env.stock[d] || 0;
      ctx.fillStyle = 'rgba(40,20,8,.28)'; ell(ctx, p.x, p.y + 40, 54, 10); ctx.fill();
      if (d === 'teaegg') {
        ctx.fillStyle = '#8a5a3a'; U.rr(ctx, p.x - 50, p.y - 6, 100, 46, 14); ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#3a2416'; ell(ctx, p.x, p.y - 4, 46, 17); ctx.fill(); ctx.stroke();
        for (var k = 0; k < Math.min(5, n); k++) { ctx.fillStyle = '#a06a3a'; ctx.beginPath(); ctx.ellipse(p.x - 26 + k * 13, p.y - 5 + (k % 2) * 4, 8, 10, 0.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 1.5; ctx.stroke(); }
      } else {
        ctx.fillStyle = '#c99a5a'; U.rr(ctx, p.x - 50, p.y - 8, 100, 46, 10); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = 'rgba(90,56,20,.5)'; ctx.lineWidth = 2; for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(p.x - 48, p.y + j * 9); ctx.lineTo(p.x + 48, p.y + j * 9); ctx.stroke(); }
        ctx.fillStyle = '#e6d2a8'; ell(ctx, p.x, p.y - 8, 46, 16); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke();
        for (var q = 0; q < Math.min(4, n); q++) { ctx.fillStyle = '#3f7d3a'; ctx.beginPath(); ctx.ellipse(p.x - 26 + q * 17, p.y - 8, 10, 7, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#f4efe3'; ctx.beginPath(); ctx.ellipse(p.x - 26 + q * 17, p.y - 9, 5.5, 4, 0.3, 0, 7); ctx.fill(); }
      }
      badge(ctx, p.x + 40, p.y + 30, n, n <= 0);
    });
  };

  // 按今天菜单在台面上排灶台。area = {x, y, w, h}
  function layout(menu, area, env) {
    var types = D.stationsFor(menu), W = { pot: 1, fryer: 1.06, griddle: 1, boil: 1, soy: 0.72, side: 0.62 }, MAXW = { pot: 250, fryer: 262, griddle: 250, boil: 250, soy: 176, side: 150 };
    var gap = 8, sum = 0; types.forEach(function (k) { sum += W[k]; });
    var unit = Math.min(250, (area.w - gap * (types.length - 1)) / sum), widths = types.map(function (k) { return Math.min(MAXW[k], unit * W[k]); });
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (types.length - 1), x = area.x + Math.max(0, (area.w - total) / 2), out = [];
    types.forEach(function (k, i) {
      var r = { x: x, y: area.y, w: widths[i], h: area.h }, ds = menu.filter(function (id) { return D.byId[id].st === k; });
      // 套餐的部件即使没单独上菜单也不会出现（套餐要求部件都在菜单上）
      out.push(k === 'pot' ? new Pot(ds, r, env) : k === 'soy' ? new Soy(ds, r, env) : k === 'side' ? new Side(ds, r, env) : new SlotStation(k, ds, r, env));
      x += widths[i] + gap;
    });
    return out;
  }
  function silence() { ['sizzle', 'smoke', 'griddle', 'boil', 'simmer', 'grind'].forEach(function (n) { Au.loop(n, 0); }); Au.loop('pour', 0, 0); }
  return { layout: layout, quality: quality, word: word, windowOf: windowOf, doneCol: doneCol, badge: badge, silence: silence };
});
