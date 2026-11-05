// 统一资源清单与加载：按组按需加载（boot / chars / late）。缺图时生成明显的开发占位（洋红格＋资源名），并记录错误。
BSX.define('game/assets', function (require) {
  var D = require('content/dishes');
  var A = { manifest: null, imgs: {}, entries: {}, errors: [], loaded: {}, groupState: {}, procCache: {}, P: null, base: 'assets/runtime/' };
  A.init = function (P, manifest) { A.P = P; A.manifest = manifest; manifest.entries.forEach(function (e) { A.entries[e.id] = e; }); };
  A.loadGroup = function (g, onProgress, done) {
    if (A.groupState[g] === 'done') return done && done();
    var list = A.manifest.entries.filter(function (e) { return e.group === g; });
    var left = list.length, n = 0;
    A.groupState[g] = 'loading';
    if (!left) { A.groupState[g] = 'done'; return done && done(); }
    list.forEach(function (e) {
      A.P.loadImage(A.base + e.path, function (err, img) {
        n++;
        if (err) { A.errors.push({ id: e.id, path: e.path, msg: String(err.message || err) }); A.imgs[e.id] = placeholder(e); }
        else A.imgs[e.id] = img;
        A.loaded[e.id] = true;
        onProgress && onProgress(n / list.length, e.id);
        if (--left === 0) { A.groupState[g] = 'done'; done && done(); }
      });
    });
  };
  function placeholder(e) {
    var c = A.P.createCanvas(e.w || 256, e.h || 256), x = c.getContext('2d');
    for (var i = 0; i < c.width; i += 32) for (var j = 0; j < c.height; j += 32) { x.fillStyle = ((i + j) / 32) % 2 ? '#ff00ff' : '#222'; x.fillRect(i, j, 32, 32); }
    x.fillStyle = '#fff'; x.font = 'bold 22px sans-serif'; x.fillText('缺图 ' + e.id, 10, 30);
    c.__placeholder = true; return c;
  }
  A.img = function (id) { var im = A.imgs[id]; if (!im && A.entries[id] && !A.loaded[id]) return null; return im || null; };
  A.ready = function (id) { return !!A.imgs[id]; };
  // 绘制图集格位：opts.trim 时用 cellTrim 去除透明边；anchor 'bottom' 时以脚底对齐
  A.cell = function (ctx, id, idx, x, y, w, h, opts) {
    var e = A.entries[id], im = A.imgs[id];
    if (!e || !im) { ctx.fillStyle = 'rgba(255,0,255,.5)'; ctx.fillRect(x, y, w, h); return; }
    var cw = e.cellW, ch = e.cellH, cx = (idx % e.cols) * cw, cy = Math.floor(idx / e.cols) * ch;
    opts = opts || {};
    if (opts.trim && e.cellTrim) { var t = e.cellTrim[idx]; cx += t[0]; cy += t[1]; cw = t[2] - t[0]; ch = t[3] - t[1]; }
    if (opts.fit) { // 保持比例放进 w×h，底部对齐
      var s = Math.min(w / cw, h / ch), dw = cw * s, dh = ch * s;
      x += (w - dw) / 2; y += opts.anchor === 'center' ? (h - dh) / 2 : h - dh; w = dw; h = dh;
    }
    if (opts.flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, cx, cy, cw, ch, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(im, cx, cy, cw, ch, x, y, w, h);
  };
  // 全身立绘：脚底中心 (cx, footY)，高度 h
  A.sprite = function (ctx, id, cx, footY, h, opts) {
    var e = A.entries[id], im = A.imgs[id];
    opts = opts || {};
    if (!im) { ctx.fillStyle = 'rgba(255,0,255,.6)'; ctx.fillRect(cx - h * 0.2, footY - h, h * 0.4, h); ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText('缺 ' + id, cx - h * 0.2, footY - h / 2); return; }
    var t = e.trim || [0, 0, im.width, im.height];
    var sh = t[3] - t[1], s = h / sh, sw = im.width * s;
    var x = cx - sw / 2, y = footY - (t[3]) * s;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    if (opts.flip) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }
    if (opts.squash) { ctx.translate(cx, footY); ctx.scale(1 + opts.squash, 1 - opts.squash); ctx.translate(-cx, -footY); }
    ctx.drawImage(im, 0, 0, im.width, im.height, x, y, sw, im.height * s);
    ctx.restore();
  };
  // 菜品图标（含叠加与程序化补图，见 D014）
  A.food = function (ctx, dishId, x, y, size, opts) {
    var d = D.byId[dishId]; if (!d) return;
    var ic = d.icon;
    opts = opts || {};
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
    if (ic.cell != null) {
      A.cell(ctx, 'atlas_food', ic.cell, x, y, size, size, { trim: true, fit: true, anchor: 'center' });
      if (ic.tint) { ctx.globalCompositeOperation = 'source-atop'; }
      if (ic.tint) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= 0.28; ctx.fillStyle = ic.tint; ctx.beginPath(); ctx.ellipse(x + size / 2, y + size * 0.42, size * 0.3, size * 0.12, 0, 0, 7); ctx.fill(); ctx.globalAlpha /= 0.28; }
      if (ic.overlay === 'egg') drawEgg(ctx, x + size * 0.55, y + size * 0.38, size * 0.18);
      else if (typeof ic.overlay === 'number') A.cell(ctx, 'atlas_food', ic.overlay, x + size * 0.38, y - size * 0.05, size * 0.62, size * 0.62, { trim: true, fit: true, anchor: 'center' });
    } else proc(ctx, ic.proc, x, y, size);
    ctx.restore();
  };
  function drawEgg(ctx, cx, cy, r) {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.25, r, 0.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke();
    ctx.fillStyle = '#f5b423'; ctx.beginPath(); ctx.arc(cx + r * 0.1, cy - r * 0.05, r * 0.45, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(cx - r * 0.1, cy - r * 0.3, r * 0.18, r * 0.12);
  }
  function plate(ctx, cx, cy, r) {
    ctx.fillStyle = '#e9f0ea'; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3d7d72'; ctx.lineWidth = Math.max(2, r * 0.07); ctx.stroke();
    ctx.strokeStyle = '#2d4b45'; ctx.lineWidth = Math.max(1, r * 0.03); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.05, r * 1.02, r * 0.66, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  function proc(ctx, kind, x, y, s) {
    var key = kind + '@' + Math.round(s);
    var c = A.procCache[key];
    if (!c) {
      // 以低分辨率绘制再放大，保持像素颗粒感
      var lo = 32; c = A.P.createCanvas(lo, lo); var g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      var cx = 16, cy = 18;
      plate(g, cx, cy, 13);
      if (kind === 'egg') drawEgg(g, cx, cy - 1, 7);
      if (kind === 'rice') { g.fillStyle = '#f7e7b0'; g.beginPath(); g.ellipse(cx, cy - 2, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = '#f2c94c'; [[-4, -3], [3, -4], [0, 0], [5, 0], [-6, 0], [2, -6]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 2, 2); }); g.fillStyle = '#5aa04a'; [[-2, -5], [4, -2], [-5, -2]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 2, 1); }); }
      if (kind === 'balls') { [[-5, -2], [0, -4], [5, -2], [-2, 1], [3, 1]].forEach(function (p) { g.fillStyle = '#b5651d'; g.beginPath(); g.arc(cx + p[0], cy + p[1], 3.4, 0, 7); g.fill(); g.fillStyle = '#e8a54b'; g.fillRect(cx + p[0] - 1, cy + p[1] - 2, 2, 1); }); g.fillStyle = '#fff'; [[-3, -6], [6, -5], [1, 2]].forEach(function (p) { g.fillRect(cx + p[0], cy + p[1], 1, 1); }); }
      if (kind === 'leaf') { [[-4, -2], [4, -2]].forEach(function (p) { g.fillStyle = '#3f7d3a'; g.beginPath(); g.ellipse(cx + p[0], cy + p[1], 6, 4, 0.3, 0, 7); g.fill(); g.fillStyle = '#f4efe3'; g.beginPath(); g.ellipse(cx + p[0], cy + p[1] - 1, 3.5, 2.5, 0.3, 0, 7); g.fill(); }); }
      A.procCache[key] = c;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, x, y, s, s);
  }
  A.drawEgg = drawEgg;
  return A;
});
