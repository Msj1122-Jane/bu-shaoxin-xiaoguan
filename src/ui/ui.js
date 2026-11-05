// 即时模式 UI：每帧注册热区（hit），统一处理按下/悬停/选中/不可用/焦点状态；文字带描边或承载面。
BSX.define('ui/ui', function (require) {
  var A = require('game/assets');
  var FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
  var COL = { ink: '#3b2a1a', paper: '#f6ecd6', paper2: '#efe0bf', wood: '#a86b3c', woodDark: '#6e4224', teal: '#2f6f66', tealDark: '#1f4d47', cream: '#fff8e8', red: '#b8432f', gold: '#e8b54a', shadow: 'rgba(30,18,8,.35)', mute: '#8d7a60', green: '#4f8a4b' };
  var U = { hits: [], pressed: null, hover: null, focusIdx: -1, keyboard: false, textScale: 1, time: 0, FONT: FONT, COL: COL, tips: [] };
  U.begin = function () { U.hits = []; };
  U.hit = function (id, x, y, w, h, o) {
    o = o || {};
    // 触控热区至少 48dp：逻辑像素 56（1280 宽 ≈ 手机 740dp 时 1dp≈1.73px）
    var minS = o.minSize == null ? 56 : o.minSize, ex = Math.max(0, (minS - w) / 2), ey = Math.max(0, (minS - h) / 2);
    var hit = { id: id, x: x - ex, y: y - ey, w: w + ex * 2, h: h + ey * 2, vx: x, vy: y, vw: w, vh: h, onTap: o.onTap, onDown: o.onDown, disabled: !!o.disabled, label: o.label || id, kind: o.kind || 'button', cursor: o.cursor || 'pointer', data: o.data };
    U.hits.push(hit);
    return { pressed: U.pressed === id && !hit.disabled, hover: U.hover === id, focus: U.keyboard && U.focusIdx >= 0 && U.focusable()[U.focusIdx] === hit, hit: hit };
  };
  U.find = function (x, y) { for (var i = U.hits.length - 1; i >= 0; i--) { var h = U.hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; };
  U.focusable = function () { return U.hits.filter(function (h) { return h.onTap && !h.disabled; }); };
  U.font = function (size, weight) { return (weight || 'normal') + ' ' + Math.round(size * U.textScale) + 'px ' + FONT; };
  U.text = function (ctx, str, x, y, o) {
    o = o || {}; var size = o.size || 22;
    ctx.save();
    ctx.font = U.font(size, o.weight || (o.bold ? 'bold' : 'normal'));
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.maxW) { var m = ctx.measureText(str).width; if (m > o.maxW) { ctx.font = U.font(size * o.maxW / m, o.weight || (o.bold ? 'bold' : 'normal')); } }
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || Math.max(3, size * 0.22); ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowOffsetY = 2; ctx.shadowBlur = 0; }
    ctx.fillStyle = o.color || COL.ink; ctx.fillText(str, x, y);
    ctx.restore();
  };
  U.wrap = function (ctx, str, maxW, size, weight) {
    ctx.save(); ctx.font = U.font(size, weight); var lines = [], line = '';
    // 词元：连续的数字/字母/符号（如 +0.3、25%、+12）不拆行；中文逐字
    var toks = str.match(/\n|[0-9A-Za-z+\-.%×/]+|[\s\S]/g) || [];
    for (var i = 0; i < toks.length; i++) { var ch = toks[i]; if (ch === '\n') { lines.push(line); line = ''; continue; } var t = line + ch; if (ctx.measureText(t).width > maxW && line) { if ('，。！？、”：；）'.indexOf(ch) >= 0) { line = t; continue; } lines.push(line); line = ch; } else line = t; }
    if (line) lines.push(line); ctx.restore(); return lines;
  };
  U.para = function (ctx, str, x, y, maxW, o) { o = o || {}; var size = o.size || 22, lh = o.lh || size * 1.5; var lines = U.wrap(ctx, str, maxW, size, o.weight); if (o.maxLines && lines.length > o.maxLines) { lines = lines.slice(0, o.maxLines); lines[o.maxLines - 1] = lines[o.maxLines - 1].slice(0, -1) + '…'; } lines.forEach(function (l, i) { U.text(ctx, l, x, y + i * lh * U.textScale, o); }); return lines.length * lh * U.textScale; };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
  U.rr = rr;
  U.panel = function (ctx, x, y, w, h, style, o) {
    o = o || {};
    var S = { paper: [COL.paper, COL.woodDark, COL.paper2], wood: ['#c88a52', COL.woodDark, '#b07440'], dark: ['rgba(28,22,16,.82)', 'rgba(255,240,210,.35)', 'rgba(0,0,0,0)'], teal: [COL.teal, COL.tealDark, '#3b8076'], cream: [COL.cream, '#c8a878', COL.paper] }[style || 'paper'];
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = COL.shadow; rr(ctx, x + 3, y + 5, w, h, 12); ctx.fill();
    ctx.fillStyle = S[0]; rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = S[1]; ctx.stroke();
    if (style === 'paper' || style === 'cream') { ctx.strokeStyle = S[2]; ctx.lineWidth = 2; rr(ctx, x + 6, y + 6, w - 12, h - 12, 8); ctx.stroke(); }
    if (style === 'wood') { ctx.strokeStyle = 'rgba(80,40,10,.18)'; ctx.lineWidth = 2; for (var i = y + 10; i < y + h - 6; i += 9) { ctx.beginPath(); ctx.moveTo(x + 8, i); ctx.bezierCurveTo(x + w * 0.3, i + 3, x + w * 0.7, i - 3, x + w - 8, i); ctx.stroke(); } }
    ctx.restore();
  };
  // 按钮：kind = primary(青) / wood / paper / ghost
  U.button = function (ctx, id, x, y, w, h, label, o) {
    o = o || {};
    var st = U.hit(id, x, y, w, h, { onTap: o.onTap, disabled: o.disabled, label: label || o.aria || id, minSize: o.minSize });
    var press = st.pressed ? 3 : 0, kind = o.kind || 'primary';
    var fill = { primary: COL.teal, wood: '#b9773f', paper: COL.cream, ghost: 'rgba(255,248,232,.12)', red: COL.red }[kind];
    var line = { primary: COL.tealDark, wood: COL.woodDark, paper: '#b48c5a', ghost: 'rgba(255,248,232,.6)', red: '#6d2014' }[kind];
    var tc = kind === 'paper' ? COL.ink : COL.cream;
    ctx.save();
    if (o.disabled) ctx.globalAlpha *= 0.42;
    if (kind !== 'ghost') { ctx.fillStyle = COL.shadow; rr(ctx, x, y + 5, w, h, 10); ctx.fill(); }
    ctx.fillStyle = o.selected ? COL.gold : fill; rr(ctx, x, y + press, w, h - 1, 10); ctx.fill();
    ctx.lineWidth = o.selected ? 4 : 3; ctx.strokeStyle = o.selected ? COL.woodDark : line; ctx.stroke();
    if (st.hover && !o.disabled) { ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(ctx, x, y + press, w, h - 1, 10); ctx.fill(); }
    if (kind !== 'ghost') { ctx.fillStyle = 'rgba(255,255,255,.16)'; rr(ctx, x + 4, y + 3 + press, w - 8, Math.max(4, h * 0.22), 6); ctx.fill(); }
    var tx = x + w / 2;
    if (o.icon) { var is = Math.min(h - 10, 44); A.cell(ctx, o.icon[0], o.icon[1], label ? x + 10 : x + (w - is) / 2, y + (h - is) / 2 + press, is, is, { trim: true, fit: true, anchor: 'center' }); if (label) tx = x + 10 + is + (w - 20 - is) / 2; }
    if (label) U.text(ctx, label, tx, y + h / 2 + press + 1, { size: o.size || 24, align: 'center', base: 'middle', color: o.selected ? COL.ink : tc, bold: true, maxW: w - (o.icon ? 64 : 16) });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); rr(ctx, x - 5, y - 5, w + 10, h + 10, 12); ctx.stroke(); }
    ctx.restore();
    return st;
  };
  U.iconButton = function (ctx, id, x, y, s, atlasIdx, o) {
    o = o || {};
    var st = U.hit(id, x, y, s, s, { onTap: o.onTap, disabled: o.disabled, label: o.aria || id });
    var p = st.pressed ? 0.9 : st.hover ? 1.06 : 1;
    ctx.save(); if (o.disabled) ctx.globalAlpha *= 0.4;
    ctx.translate(x + s / 2, y + s / 2); ctx.scale(p, p);
    A.cell(ctx, 'atlas_ui', atlasIdx, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    ctx.restore();
    if (st.focus) { ctx.save(); ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 4; ctx.setLineDash([6, 4]); rr(ctx, x - 4, y - 4, s + 8, s + 8, 10); ctx.stroke(); ctx.restore(); }
    return st;
  };
  U.ring = function (ctx, x, y, r, frac, color, width) {
    ctx.save(); ctx.lineWidth = width || 6; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac))); ctx.stroke(); ctx.restore();
  };
  U.bubble = function (ctx, x, y, w, h, tailX, o) {
    o = o || {};
    ctx.save(); ctx.fillStyle = o.fill || COL.cream; ctx.strokeStyle = o.line || '#7d5a35'; ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tailX - 10, y + h - 1); ctx.lineTo(tailX, y + h + 14); ctx.lineTo(tailX + 10, y + h - 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tailX - 10, y + h); ctx.lineTo(tailX, y + h + 14); ctx.lineTo(tailX + 10, y + h); ctx.stroke();
    ctx.restore();
  };
  U.coin = function (n) { var y = Math.round(n) / 100; return (Math.abs(y) >= 100 ? Math.round(y) : Math.round(y * 10) / 10).toString(); };
  U.yuan = function (fen, sign) { var s = (fen < 0 ? '−' : sign && fen > 0 ? '+' : '') + U.coin(Math.abs(fen)); return s + '元'; };
  return U;
});
