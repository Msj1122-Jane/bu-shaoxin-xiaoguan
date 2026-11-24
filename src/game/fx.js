// 轻量特效：粒子、飘字、飞行物、缓动。所有反馈克制统一——蒸汽、油星、面粉、硬币、心，不用发光堆砌。
BSX.define('game/fx', function (require) {
  var U = require('ui/ui');
  var Fx = { parts: [], floats: [], flies: [], lowFx: false, shakeT: 0, shakeA: 0 };
  var ease = {
    out: function (t) { return 1 - (1 - t) * (1 - t); },
    out3: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: function (t) { return t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 8 - 0.75) * 2.094) + 1; }
  };
  Fx.ease = ease;
  Fx.reset = function () { Fx.parts = []; Fx.floats = []; Fx.flies = []; };
  var KIND = {
    steam: { life: [1.1, 1.9], vx: [-8, 8], vy: [-34, -18], g: -6, r: [7, 13], col: '255,252,244', a: 0.34, grow: 14 },
    smoke: { life: [1.2, 2.2], vx: [-10, 14], vy: [-40, -22], g: -4, r: [8, 14], col: '70,62,56', a: 0.3, grow: 16 },
    spark: { life: [0.35, 0.6], vx: [-90, 90], vy: [-130, -40], g: 320, r: [2, 3.5], col: '255,214,120', a: 0.95, grow: 0 },
    oil: { life: [0.3, 0.55], vx: [-70, 70], vy: [-120, -50], g: 380, r: [1.6, 3], col: '244,196,90', a: 0.9, grow: 0 },
    splash: { life: [0.35, 0.6], vx: [-80, 80], vy: [-140, -60], g: 420, r: [2, 3.5], col: '250,246,232', a: 0.9, grow: 0 },
    drop: { life: [0.4, 0.7], vx: [-50, 50], vy: [-110, -40], g: 460, r: [2, 3], col: '246,238,214', a: 0.9, grow: 0 },
    flour: { life: [0.5, 0.9], vx: [-50, 50], vy: [-60, -10], g: 60, r: [3, 6], col: '255,250,238', a: 0.5, grow: 8 },
    crumb: { life: [0.4, 0.7], vx: [-60, 60], vy: [-100, -30], g: 420, r: [1.5, 2.6], col: '196,138,62', a: 1, grow: 0 },
    rice: { life: [0.45, 0.7], vx: [-40, 40], vy: [-60, 10], g: 360, r: [1.4, 2.2], col: '255,253,244', a: 1, grow: 0 },
    heart: { life: [0.9, 1.2], vx: [-14, 14], vy: [-46, -30], g: 0, r: [7, 9], col: '224,96,96', a: 1, grow: 0, shape: 'heart' },
    note: { life: [0.9, 1.2], vx: [-14, 14], vy: [-46, -30], g: 0, r: [6, 8], col: '70,120,110', a: 1, grow: 0, shape: 'note' },
    glint: { life: [0.35, 0.55], vx: [-6, 6], vy: [-10, 4], g: 0, r: [5, 9], col: '255,240,190', a: 1, grow: 0, shape: 'star' },
    dust: { life: [0.6, 1.0], vx: [-30, 30], vy: [-20, 6], g: 20, r: [4, 8], col: '160,140,120', a: 0.35, grow: 10 }
  };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  Fx.burst = function (x, y, kind, n, spread) {
    var K = KIND[kind]; if (!K) return;
    n = Fx.lowFx ? Math.ceil(n / 2) : n; spread = spread || 0;
    for (var i = 0; i < n && Fx.parts.length < 220; i++) {
      var life = rnd(K.life[0], K.life[1]);
      Fx.parts.push({ x: x + rnd(-spread, spread), y: y + rnd(-spread * 0.5, spread * 0.5), vx: rnd(K.vx[0], K.vx[1]), vy: rnd(K.vy[0], K.vy[1]), g: K.g, r: rnd(K.r[0], K.r[1]), col: K.col, a: K.a, t: 0, life: life, grow: K.grow, shape: K.shape });
    }
  };
  // 飘字：短促、落位准
  Fx.float = function (x, y, text, o) { o = o || {}; Fx.floats.push({ x: x, y: y, text: text, t: 0, life: o.life || 1.1, color: o.color || '#fff8e8', size: o.size || 22, stroke: o.stroke || 'rgba(60,36,16,.85)' }); if (Fx.floats.length > 14) Fx.floats.shift(); };
  // 飞行物：draw(ctx, x, y, k) 由调用者提供；arc 为抛物线高度
  Fx.fly = function (o) { o.t = 0; o.dur = o.dur || 0.38; o.arc = o.arc == null ? 46 : o.arc; Fx.flies.push(o); return o; };
  Fx.shake = function (a, t) { Fx.shakeA = Math.max(Fx.shakeA, a); Fx.shakeT = Math.max(Fx.shakeT, t || 0.25); };
  Fx.update = function (dt) {
    var i, p;
    for (i = Fx.parts.length - 1; i >= 0; i--) { p = Fx.parts[i]; p.t += dt; if (p.t >= p.life) { Fx.parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.grow * dt; }
    for (i = Fx.floats.length - 1; i >= 0; i--) { p = Fx.floats[i]; p.t += dt; if (p.t >= p.life) Fx.floats.splice(i, 1); }
    for (i = Fx.flies.length - 1; i >= 0; i--) { p = Fx.flies[i]; p.t += dt; if (p.t >= p.dur) { Fx.flies.splice(i, 1); if (p.done) p.done(); } }
    if (Fx.shakeT > 0) { Fx.shakeT -= dt; if (Fx.shakeT <= 0) Fx.shakeA = 0; }
  };
  Fx.offset = function () { if (Fx.shakeT <= 0) return { x: 0, y: 0 }; var a = Fx.shakeA * Math.min(1, Fx.shakeT * 6); return { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a }; };
  function heart(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.5, y - r * 0.2, x - r * 0.7, y - r * 1.2, x, y - r * 0.35); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.2, x, y + r * 0.9); ctx.fill(); }
  function star(ctx, x, y, r) { ctx.beginPath(); for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  Fx.heart = heart; Fx.star = star;
  Fx.drawParts = function (ctx) {
    for (var i = 0; i < Fx.parts.length; i++) {
      var p = Fx.parts[i], k = p.t / p.life, a = p.a * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
      ctx.fillStyle = 'rgba(' + p.col + ',' + Math.max(0, a).toFixed(3) + ')';
      if (p.shape === 'heart') heart(ctx, p.x, p.y, p.r);
      else if (p.shape === 'star') star(ctx, p.x, p.y, p.r * (1 - k * 0.4));
      else if (p.shape === 'note') { ctx.fillRect(p.x + p.r * 0.5, p.y - p.r * 1.6, 2.5, p.r * 1.7); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 0.7, p.r * 0.5, -0.4, 0, 7); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    }
  };
  Fx.drawFlies = function (ctx) {
    for (var i = 0; i < Fx.flies.length; i++) {
      var f = Fx.flies[i], k = ease.inOut(Math.min(1, f.t / f.dur));
      var x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.arc;
      f.draw(ctx, x, y, k);
    }
  };
  Fx.drawFloats = function (ctx) {
    for (var i = 0; i < Fx.floats.length; i++) {
      var f = Fx.floats[i], k = f.t / f.life, pop = k < 0.12 ? ease.back(k / 0.12) : 1;
      ctx.save(); ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      U.text(ctx, f.text, f.x, f.y - 30 * ease.out(k), { size: f.size * pop, align: 'center', bold: true, color: f.color, stroke: f.stroke });
      ctx.restore();
    }
  };
  return Fx;
});
