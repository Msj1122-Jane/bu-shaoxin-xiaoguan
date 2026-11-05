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
    // 良心灯笼（看得见的黑心值，D034）
    lantern(ctx, 548, 16, Math.min(100, o.liveBurn != null ? o.liveBurn : s.burn), o.lanternFlash || 0, app.t);
    // 暂停（避开微信胶囊）
    var px = 1280 - 84 - (app.rightInset || 0);
    U.iconButton(ctx, 'hud_pause', px, 18, 62, 4, { aria: '暂停', onTap: function () { app.pause(); } });
  }
  function lantern(ctx, x, y, burn, flash, t) {
    var cs = 1 - burn / 100, lvl = Math.round(cs * 5);
    U.panel(ctx, x, y, 176, 62, flash > 0 ? 'dark' : 'cream');
    var cx = x + 34, cy = y + 32, col = cs >= 0.7 ? '#e8b54a' : cs >= 0.4 ? '#e07a3a' : '#c0392b';
    ctx.save();
    var g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30); g.addColorStop(0, cs >= 0.7 ? 'rgba(255,220,120,.9)' : cs >= 0.4 ? 'rgba(255,150,80,.6)' : 'rgba(200,50,30,.45)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 30, cy - 30, 60, 60);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cx - 2, y + 4, 4, 6); ctx.fillRect(cx - 9, cy - 16, 18, 4); ctx.fillRect(cx - 9, cy + 13, 18, 4);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, 15, 15, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(80,30,10,.45)'; ctx.lineWidth = 1.5; for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(i) * 8 + 2, 15, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#c8952a'; ctx.fillRect(cx - 2, cy + 17, 4, 8);
    if (cs < 0.4) { for (var k = 0; k < 2; k++) { var p = (t * 0.6 + k * 0.5) % 1; ctx.fillStyle = 'rgba(60,50,45,' + (0.5 * (1 - p)) + ')'; ctx.beginPath(); ctx.arc(cx + Math.sin(t * 2 + k) * 4, cy - 18 - p * 16, 4 + p * 6, 0, 7); ctx.fill(); } }
    ctx.restore();
    U.text(ctx, '良心', x + 62, y + 28, { size: 18, bold: true, color: flash > 0 ? '#ffb08a' : '#7d5a35' });
    for (var j = 0; j < 5; j++) { ctx.fillStyle = j < lvl ? col : 'rgba(122,90,53,.25)'; U.rr(ctx, x + 62 + j * 21, y + 38, 17, 12, 3); ctx.fill(); }
  }
  return { draw: draw, weatherIcon: weatherIcon, lantern: lantern };
});
