// 界面零件：日历页、零钱盒、木牌按钮、纸、黑板、图章、手绘小图标。所有界面共用，保证像同一款游戏。
BSX.define('ui/kit', function (require) {
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var C = require('content/config');
  var K = {};
  var INK = '#3b2a1a', PAPER = '#fbf5e4', WOOD = '#b9793f', WOODD = '#6e4224', TEAL = '#2f6f66', RED = '#b8432f';
  K.col = { ink: INK, paper: PAPER, wood: WOOD, woodD: WOODD, teal: TEAL, red: RED, mute: '#8d7a60', gold: '#e8b54a' };
  K.weather = function (ctx, w, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
    if (w === 'sun') { ctx.fillStyle = '#f0a830'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#f0a830'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + (t || 0) * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke(); } }
    else { ctx.fillStyle = w === 'rain' ? '#8fa2b4' : '#c4ccd2'; ctx.beginPath(); ctx.arc(-7, 0, 8, 0, 7); ctx.arc(3, -5, 10, 0, 7); ctx.arc(11, 1, 7, 0, 7); ctx.fill(); ctx.fillRect(-8, 0, 20, 8); if (w === 'rain') { ctx.strokeStyle = '#4a8ab8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-8 + j * 9, 12); ctx.lineTo(-11 + j * 9, 19); ctx.stroke(); } } }
    ctx.restore();
  };
  K.weatherName = { sun: '晴', cloud: '阴', rain: '雨' };
  // 日历页：第几天、天气、离月底
  K.dayChip = function (ctx, s, x, y, t) {
    ctx.fillStyle = 'rgba(30,18,8,.3)'; U.rr(ctx, x + 2, y + 4, 168, 54, 8); ctx.fill();
    ctx.fillStyle = PAPER; U.rr(ctx, x, y, 168, 54, 8); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = RED; U.rr(ctx, x + 3, y + 3, 58, 48, 6); ctx.fill();
    U.text(ctx, '第', x + 14, y + 22, { size: 13, color: '#ffe9d0', bold: true });
    U.text(ctx, String(s.day), x + 32, y + 43, { size: 30, bold: true, align: 'center', color: '#fff8e8' });
    U.text(ctx, '天', x + 50, y + 43, { size: 13, color: '#ffe9d0', bold: true, align: 'center' });
    K.weather(ctx, s.today ? s.today.weather : 'sun', x + 86, y + 26, 34, t);
    U.text(ctx, K.weatherName[s.today ? s.today.weather : 'sun'], x + 108, y + 24, { size: 17, bold: true, color: INK });
    U.text(ctx, s.day >= s.days ? '月底' : '还剩 ' + (s.days - s.day) + ' 天', x + 108, y + 44, { size: 14, color: '#8d7a60' });
  };
  // 铁皮零钱盒
  K.tin = function (ctx, x, y, cash, pop) {
    var k = 1 + (pop || 0) * 0.12;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(30,18,8,.3)'; U.rr(ctx, -28, -14, 60, 40, 6); ctx.fill();
    ctx.fillStyle = '#4f8a80'; U.rr(ctx, -30, -18, 60, 40, 6); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#3b6f66'; ctx.fillRect(-30, -6, 60, 4); ctx.fillStyle = '#e8b54a'; U.rr(ctx, -7, -9, 14, 10, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-25, -15, 50, 3);
    ctx.restore();
    var str = '¥' + (cash / 100).toFixed(cash % 100 ? 1 : 0), neg = cash < 0;
    U.text(ctx, str, x + 40, y + 12, { size: 26, bold: true, color: neg ? '#ffb0a0' : '#fff8e8', stroke: 'rgba(50,28,10,.9)', strokeW: 5 });
  };
  K.icon = function (ctx, kind, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.fillStyle = col || PAPER; ctx.strokeStyle = col || PAPER; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'pause') { ctx.fillRect(-7, -8, 5, 16); ctx.fillRect(2, -8, 5, 16); }
    else if (kind === 'book') { U.rr(ctx, -9, -10, 18, 20, 2); ctx.fill(); ctx.fillStyle = TEAL; ctx.fillRect(-5, -6, 10, 3); ctx.fillRect(-5, 0, 7, 3); }
    else if (kind === 'gear') { for (var i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.fillRect(-2.5, -11, 5, 6); ctx.restore(); } ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); }
    else if (kind === 'close') { ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke(); }
    else if (kind === 'back') { ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(-5, 0); ctx.lineTo(4, 8); ctx.stroke(); }
    else if (kind === 'play') { ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(8, 0); ctx.lineTo(-5, 8); ctx.closePath(); ctx.fill(); }
    else if (kind === 'fast') { ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(0, 0); ctx.lineTo(-9, 7); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(1, -7); ctx.lineTo(10, 0); ctx.lineTo(1, 7); ctx.closePath(); ctx.fill(); }
    else if (kind === 'skip') { ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(3, 0); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.fillRect(5, -7, 4, 14); }
    else if (kind === 'log') { for (var j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(-8, j * 6); ctx.lineTo(8, j * 6); ctx.stroke(); } }
    ctx.restore();
  };
  // 圆木钮
  K.iconBtn = function (ctx, id, x, y, s, kind, onTap, o) {
    o = o || {};
    var st = U.hit(id, x, y, s, s, { onTap: onTap, label: o.label || id, disabled: o.disabled }), p = st.pressed ? 2 : 0;
    ctx.save(); if (o.disabled) ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2 + 4, s / 2, 0, 7); ctx.fill();
    ctx.fillStyle = o.on ? '#e8b54a' : st.hover ? '#3b8076' : TEAL; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2 + p, s / 2, 0, 7); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; ctx.stroke();
    K.icon(ctx, kind, x + s / 2, y + s / 2 + p, s * 0.5, o.on ? INK : PAPER);
    if (o.text) U.text(ctx, o.text, x + s / 2, y + s + 16, { size: 13, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(40,24,10,.85)' });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 + 5, 0, 7); ctx.stroke(); }
    ctx.restore(); return st;
  };
  // 纸张面板
  K.paper = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.fillStyle = 'rgba(30,18,8,.32)'; U.rr(ctx, x + 4, y + 7, w, h, o.r || 8); ctx.fill();
    ctx.fillStyle = o.fill || PAPER; U.rr(ctx, x, y, w, h, o.r || 8); ctx.fill(); ctx.strokeStyle = o.line || '#a88a5a'; ctx.lineWidth = 2.5; ctx.stroke();
    if (o.lines) { ctx.strokeStyle = 'rgba(120,150,170,.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var yy = y + (o.top || 56); yy < y + h - 10; yy += o.lines) { ctx.moveTo(x + 14, yy); ctx.lineTo(x + w - 14, yy); } ctx.stroke(); }
    if (o.pin) { ctx.fillStyle = o.pin; ctx.beginPath(); ctx.arc(x + w / 2, y + 12, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + w / 2 - 3, y + 8, 2.5, 2.5); }
  };
  // 黑板
  K.board = function (ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, x + 4, y + 7, w, h, 8); ctx.fill();
    ctx.fillStyle = '#8a5a2c'; U.rr(ctx, x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#2e4a40'; U.rr(ctx, x + 9, y + 9, w - 18, h - 18, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.035)'; for (var i = 0; i < 6; i++) ctx.fillRect(x + 20 + i * (w - 40) / 6, y + 14 + (i * 37) % (h - 60), (w - 40) / 7, 26);
  };
  // 木牌按钮（主行动）
  K.tag = function (ctx, id, x, y, w, h, label, o) {
    o = o || {};
    var st = U.hit(id, x, y, w, h, { onTap: o.onTap, onDown: o.onDown, disabled: o.disabled, label: label }), p = st.pressed ? 3 : 0, kind = o.kind || 'wood';
    var fill = { wood: '#c98a4e', teal: TEAL, paper: PAPER, red: RED, dark: 'rgba(28,22,16,.7)' }[kind], line = { wood: WOODD, teal: '#1f4d47', paper: '#a88a5a', red: '#6d2014', dark: 'rgba(255,240,210,.5)' }[kind], tc = kind === 'paper' ? INK : '#fff8e8';
    ctx.save(); if (o.disabled) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(30,18,8,.34)'; U.rr(ctx, x + 2, y + 6, w, h, 10); ctx.fill();
    ctx.fillStyle = o.selected ? '#e8b54a' : fill; U.rr(ctx, x, y + p, w, h, 10); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke();
    if (st.hover && !o.disabled) { ctx.fillStyle = 'rgba(255,255,255,.13)'; U.rr(ctx, x, y + p, w, h, 10); ctx.fill(); }
    if (kind === 'wood') { ctx.strokeStyle = 'rgba(90,50,18,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + p + h * 0.33); ctx.bezierCurveTo(x + w * 0.3, y + p + h * 0.4, x + w * 0.7, y + p + h * 0.26, x + w - 10, y + p + h * 0.36); ctx.moveTo(x + 10, y + p + h * 0.7); ctx.bezierCurveTo(x + w * 0.3, y + p + h * 0.62, x + w * 0.7, y + p + h * 0.78, x + w - 10, y + p + h * 0.68); ctx.stroke(); }
    var sub = o.sub ? 10 : 0;
    U.text(ctx, label, x + w / 2, y + h / 2 + p - sub + 1, { size: o.size || 24, bold: true, align: 'center', base: 'middle', color: o.selected ? INK : tc, maxW: w - 18 });
    if (o.sub) U.text(ctx, o.sub, x + w / 2, y + h / 2 + p + 16, { size: 14, align: 'center', base: 'middle', color: o.selected ? '#5a4020' : kind === 'paper' ? '#8d7a60' : 'rgba(255,248,232,.8)', maxW: w - 14 });
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); U.rr(ctx, x - 4, y - 4, w + 8, h + 8, 12); ctx.stroke(); }
    ctx.restore(); return st;
  };
  K.stamp = function (ctx, x, y, text, col, rot, size) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot == null ? -0.14 : rot); size = size || 26;
    ctx.font = U.font(size, 'bold'); var w = ctx.measureText(text).width + 22;
    ctx.strokeStyle = col || RED; ctx.lineWidth = 3.5; ctx.globalAlpha = 0.9; U.rr(ctx, -w / 2, -size * 0.8, w, size * 1.6, 5); ctx.stroke();
    U.text(ctx, text, 0, size * 0.36, { size: size, bold: true, align: 'center', color: col || RED });
    ctx.restore();
  };
  K.dim = function (ctx, a) { ctx.fillStyle = 'rgba(18,13,9,' + a + ')'; ctx.fillRect(0, 0, 1280, 720); };
  K.yuan = function (fen) { var v = fen / 100; return (v < 0 ? '−' : '') + '¥' + Math.abs(v).toFixed(Math.abs(fen) % 100 ? 1 : 0); };
  // 钟：6:00 → 9:00
  K.clock = function (ctx, x, y, frac, closing) {
    var m = Math.round(360 + Math.min(1, frac) * 180), hh = Math.floor(m / 60), mm = m % 60, str = hh + ':' + (mm < 10 ? '0' : '') + mm;
    ctx.fillStyle = 'rgba(28,22,16,.62)'; U.rr(ctx, x - 78, y - 18, 156, 36, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,210,.22)'; U.rr(ctx, x - 22, y - 4, 88, 8, 4); ctx.fill();
    ctx.fillStyle = closing ? '#e8862a' : '#ffe28a'; U.rr(ctx, x - 22, y - 4, 88 * Math.min(1, frac), 8, 4); ctx.fill();
    U.text(ctx, str, x - 68, y + 7, { size: 20, bold: true, color: '#fff8e8' });
  };
  return K;
});
