// 营业/晨备的少量 HUD：日期与天气、钱匣、风铃口碑、暂停。演出时隐藏。
BSX.define('ui/hud', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  function weatherIcon(ctx, w, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    if (w === 'sun') { ctx.fillStyle = '#f5b423'; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, 7); ctx.fill(); ctx.strokeStyle = '#f5b423'; ctx.lineWidth = 3; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4); ctx.lineTo(Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52); ctx.stroke(); } }
    else { ctx.fillStyle = w === 'rain' ? '#9aa8b4' : '#d8dde0'; ctx.beginPath(); ctx.arc(-s * 0.15, 0, s * 0.22, 0, 7); ctx.arc(s * 0.12, -s * 0.06, s * 0.27, 0, 7); ctx.arc(s * 0.3, s * 0.05, s * 0.18, 0, 7); ctx.fill(); if (w === 'rain') { ctx.strokeStyle = '#5a9ad0'; ctx.lineWidth = 3; for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-s * 0.2 + j * s * 0.2, s * 0.25); ctx.lineTo(-s * 0.26 + j * s * 0.2, s * 0.42); ctx.stroke(); } } }
    ctx.restore();
  }
  function draw(ctx, app, o) {
    var s = app.state; if (!s) return;
    o = o || {};
    // 左上：日期牌
    U.panel(ctx, 20, 16, 168, 62, 'wood');
    U.text(ctx, s.mode === 'week' ? '常营业 ' + s.day + '/7' : '第' + s.day + '日', 36, 58, { size: 28, bold: true, color: '#fff8e8', stroke: '#5a3418', maxW: 100 });
    weatherIcon(ctx, s.today.weather, 160, 46, 46);
    // 钱匣
    U.panel(ctx, 200, 16, 196, 62, 'cream');
    A.cell(ctx, 'atlas_ui', 12, 208, 22, 50, 50, { trim: true, fit: true, anchor: 'center' });
    var cash = Math.round(s.cash / 100);
    U.text(ctx, String(cash), 266, 60, { size: 30, bold: true, color: cash < 0 ? '#b8432f' : '#3b2a1a', maxW: 120 });
    if (o.cashDelta) { var k = Math.min(1, o.cashDelta.t * 2); U.text(ctx, (o.cashDelta.v > 0 ? '+' : '') + o.cashDelta.v, 380, 50 - k * 20, { size: 24, bold: true, color: '#e8b54a', stroke: '#4a2a12', align: 'right', alpha: 1 - k }); }
    // 风铃口碑
    U.panel(ctx, 408, 16, 128, 62, 'cream');
    A.cell(ctx, 'atlas_ui', 13, 414, 22, 50, 50, { trim: true, fit: true, anchor: 'center' });
    U.text(ctx, String(Math.round(s.rep)), 470, 60, { size: 30, bold: true, color: '#2f6f66' });
    // 暂停（避开微信胶囊）
    var px = 1280 - 84 - (app.rightInset || 0);
    U.iconButton(ctx, 'hud_pause', px, 18, 62, 4, { aria: '暂停', onTap: function () { app.pause(); } });
  }
  return { draw: draw, weatherIcon: weatherIcon };
});
