// 晚账：卷帘门拉下，灯下摊开一本账。左页是今天的流水，右页是街坊的话、剩下的东西和明天要惦记的事。
// 经营数字只在这里出现，而且是手写在账本上的——不是面板。
BSX.define('ui/s_night', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var INK = '#3b2a1a', MUTE = '#8d7a60', RED = '#b8432f', BLUE = '#2f4f7a';

  function Night(app) {
    var s = app.state, self = this;
    this.app = app; this.name = 'night'; this.pausable = true; this.s = s; this.t = 0; this.shop = false; this.out = 0;
    Fx.reset(); require('game/stations').silence();
    Shop.reset('night', s.today.weather); Shop.setShutter(1, true); Shop.crowd = 0.05;
    Au.setScene({ place: 'night', rain: s.today.weather === 'rain' ? 0.5 : 0, crowd: 0, dawn: 0, music: 'night' });
    this.rec = s.hist[s.hist.length - 1];
    if (!s.today.night) s.today.night = this.compose();
    this.n = s.today.night;
    Au.play('page');
  }
  var P = Night.prototype;
  // 当晚的文字只生成一次，存进当天记录（读档回来还是同一页）
  P.compose = function () {
    var s = this.s, r = this.rec, h = Cond.read(s), am = Story.ambient, quotes = (r.quotes || []).slice(0, 2).map(function (q) { return { from: q.from, text: q.text }; });
    function rot(list, k) { if (!list.length) return null; return list[(s.day * 7 + k * 3 + s.seed) % list.length]; }
    var cond = (am.quotes || []).filter(function (q) { return q.need && Cond.check(s, q.need, h); }), free = (am.quotes || []).filter(function (q) { return !q.need; }), k = 0;
    while (quotes.length < 3 && (cond.length || free.length)) { var src = cond.length ? cond : free, q = rot(src, k++); src.splice(src.indexOf(q), 1); if (!quotes.some(function (x) { return x.text === q.text; })) quotes.push({ from: q.from || '街坊', text: q.text }); }
    var zc = (am.zhou || []).filter(function (z) { return z.need && Cond.check(s, z.need, h); }), zf = (am.zhou || []).filter(function (z) { return !z.need; }), z = rot(zc.length ? zc : zf, 1);
    var left = []; for (var id in r.left) left.push(r.left[id] + ' 份' + D.byId[id].name);
    var net = r.net, stamp = r.closed ? '停业' : net <= 0 ? '白忙一天' : r.q >= 0.88 && r.walked + r.balked === 0 ? '手艺好' : r.walked + r.balked >= 4 ? '忙不过来' : '没白忙';
    var pill = s.burn >= 85 ? 2 : s.burn >= 60 ? 1 : s.burn >= 30 ? 0 : -1;
    return { quotes: quotes, zhou: z ? z.text : '', left: left.slice(0, 4), stamp: stamp, pill: pill >= 0 && am.pills ? am.pills[pill] : '', later: (s.today.notes || []).filter(function (n) { return n.kind === 'later'; }).map(function (n) { return n.text; }) };
  };
  P.update = function (dt) {
    this.t += dt;
    if (this.out > 0) { this.out += dt; if (this.out > 0.7 && !this.gone) { this.gone = true; this.sleep(); } }
  };
  P.sleep = function () {
    var s = this.s, app = this.app;
    Run.nextDay(s);
    if (s.phase === 'ended') app.endRun();
    app.save(); app.route(true);
  };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, r = this.rec, n = this.n, t = this.t;
    Shop.drawBack(ctx, s, { curtain: !!s.flags.man_curtain }); Shop.drawCounter(ctx); Shop.drawLight(ctx); Shop.drawShutter(ctx);
    K.dim(ctx, 0.2 + Math.min(0.7, this.out * 1.2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 640, 330, 620, '255,196,120', (0.2 * (1 - Math.min(1, this.out * 1.6))).toFixed(2)); ctx.restore();
    K.dayChip(ctx, s, 14, 12, t);
    U.text(ctx, '夜里 · 算账', 198, 48, { size: 26, bold: true, color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' });
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    K.tin(ctx, 1010, 34, s.cash, 0);
    // 账本
    var x = 132, y = 78, w = 1016, h = 560, mid = x + w / 2, k = Fx.ease.out3(Math.min(1, t * 2.2));
    ctx.save(); ctx.translate(0, (1 - k) * 40); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(20,12,6,.45)'; U.rr(ctx, x - 6, y + 10, w + 20, h + 6, 10); ctx.fill();
    ctx.fillStyle = '#2f6f66'; U.rr(ctx, x - 12, y - 8, w + 24, h + 18, 10); ctx.fill(); ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w / 2 - 4, h, 6); ctx.fill(); U.rr(ctx, mid + 4, y, w / 2 - 4, h, 6); ctx.fill();
    var g = ctx.createLinearGradient(mid - 40, 0, mid + 40, 0); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(0.5, 'rgba(90,60,30,.28)'); g.addColorStop(1, 'rgba(90,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(mid - 40, y, 80, h);
    ctx.strokeStyle = 'rgba(120,150,170,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (var ly = y + 96; ly < y + h - 14; ly += 38) { ctx.moveTo(x + 22, ly); ctx.lineTo(mid - 26, ly); ctx.moveTo(mid + 26, ly); ctx.lineTo(x + w - 22, ly); } ctx.stroke();
    ctx.strokeStyle = 'rgba(200,90,70,.45)'; ctx.beginPath(); ctx.moveTo(x + 64, y + 10); ctx.lineTo(x + 64, y + h - 10); ctx.stroke();
    // 左页：流水
    var lx = x + 78, rx2 = mid - 34, yy = y + 52;
    U.text(ctx, '第 ' + s.day + ' 天', lx, yy, { size: 30, bold: true, color: INK });
    U.text(ctx, K.weatherName[r.weather] + ' · ' + (r.closed ? '停业' : '来了 ' + (r.served + r.walked + r.balked + r.soldout) + ' 位'), rx2, yy, { size: 18, align: 'right', color: MUTE });
    yy += 38;
    function row(label, val, col, big) { U.text(ctx, label, lx, yy + 26, { size: big ? 24 : 20, bold: !!big, color: INK, maxW: 250 }); U.text(ctx, val, rx2, yy + 26, { size: big ? 30 : 21, bold: true, align: 'right', color: col || INK }); yy += 38; }
    if (!r.closed) { row('卖出 ' + r.served + ' 位', '+' + K.yuan(r.rev), BLUE); if (r.tips) row('小费', '+' + K.yuan(r.tips), BLUE); row('进货', '−' + K.yuan(r.goods).slice(0)); if (r.oil) row('油', '−' + K.yuan(r.oil)); }
    row(s.helper ? '水电煤、桂芬的工钱' : '水电煤', '−' + K.yuan(r.fixed));
    if (r.credit) row('记在账上（没收到）', K.yuan(r.credit), MUTE);
    if (r.bought && r.bought.length) row('添置', '−' + K.yuan(r.bought.reduce(function (a, id) { return a + Cast.upgrades.filter(function (u) { return u.id === id; })[0].cost; }, 0)));
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, yy + 4); ctx.lineTo(rx2, yy + 4); ctx.stroke(); yy += 6;
    row('今天净赚', (r.net >= 0 ? '+' : '−') + K.yuan(Math.abs(r.net)), r.net >= 0 ? BLUE : RED, true);
    if (Run.rentDue(s)) { row('今晚交房租', '−' + K.yuan(C.rentWeekly), RED); row('交完手头', K.yuan(s.cash - C.rentWeekly), s.cash - C.rentWeekly < 0 ? RED : INK); }
    if (t > 0.9) K.stamp(ctx, lx + 96, Math.min(yy + 64, y + h - 110), n.stamp, n.stamp === '白忙一天' || n.stamp === '忙不过来' ? '#8d7a60' : RED, -0.12, 28);
    // 老葛理过的细账
    if (s.flags.ge_books && !r.closed) { var items = Object.keys(r.sold).sort(function (a, b) { return r.sold[b] - r.sold[a]; }).slice(0, 4), txt = items.map(function (id) { return D.byId[id].name + r.sold[id]; }).join(' · '); U.text(ctx, '细账（老葛的字）：' + txt, lx, y + h - 60, { size: 15, color: BLUE, maxW: rx2 - lx }); }
    if (n.zhou) U.para(ctx, n.zhou, lx, y + h - 30, rx2 - lx, { size: 17, color: MUTE });
    // 右页：街坊的话、剩下的、明天
    var px = mid + 36, pr = x + w - 30; yy = y + 52;
    U.text(ctx, '街坊的话', px, yy, { size: 24, bold: true, color: INK }); yy += 22;
    n.quotes.forEach(function (q) { var ls = U.wrap(ctx, '"' + q.text + '"', pr - px - 10, 19); ls.slice(0, 2).forEach(function (l, i) { U.text(ctx, l, px, yy + 26 + i * 26, { size: 19, color: INK }); }); yy += ls.length > 1 ? 54 : 30; U.text(ctx, '—— ' + q.from, pr, yy + 16, { size: 15, align: 'right', color: MUTE }); yy += 30; });
    yy = Math.max(yy + 6, y + 268);
    U.text(ctx, '剩下的', px, yy, { size: 21, bold: true, color: INK });
    U.text(ctx, n.left.length ? n.left.join('、') + (s.flags.e_leftover_give ? '。留给巷口的老两口了。' : '。') : r.closed ? '今天没开火。' : '都卖完了。', px + 76, yy, { size: 17, color: MUTE, maxW: pr - px - 80 });
    yy += 40;
    U.text(ctx, '惦记着', px, yy, { size: 21, bold: true, color: INK }); yy += 10;
    var todo = [];
    if (!s.depositPaid && s.day >= 7 && s.day <= 26) todo.push({ text: '续租押金 ' + K.yuan(s.deposit) + '，第 26 天给话', bar: Math.max(0, s.cash) / s.deposit });
    var toRent = s.day % 7 === 0 ? 0 : 7 - (s.day % 7); if (s.day < 28 && s.day + toRent < 28 && toRent > 0 && toRent <= 3) todo.push({ text: '再过 ' + toRent + ' 天交房租 ' + K.yuan(C.rentWeekly) });
    var cr = 0; for (var id2 in s.credit) cr += s.credit[id2]; if (cr > 0) todo.push({ text: '老葛赊着 ' + K.yuan(cr) });
    if (s.owe) todo.push({ text: '欠小满 ' + K.yuan(s.owe) + '，月底还' });
    if (n.pill) todo.push({ text: n.pill });
    n.later.forEach(function (l) { todo.push({ text: l }); });
    if (s.closeNext) todo.push({ text: '明天停业整改一天' });
    if (!todo.length) todo.push({ text: s.day >= s.days ? '明天，没有明天的进货单了。' : '明天还是五点半。' });
    todo.slice(0, 5).forEach(function (td) { U.text(ctx, '· ' + td.text, px, yy + 26, { size: 17, color: INK, maxW: pr - px }); yy += 30; if (td.bar != null) { ctx.fillStyle = 'rgba(60,40,20,.15)'; U.rr(ctx, px + 14, yy + 2, 260, 10, 5); ctx.fill(); ctx.fillStyle = td.bar >= 1 ? '#5a9a56' : '#e0a030'; U.rr(ctx, px + 14, yy + 2, 260 * Math.min(1, td.bar), 10, 5); ctx.fill(); yy += 18; } });
    ctx.restore();
    // 底部
    if (this.out > 0) return;
    var f = Run.features(s), by = 652;
    if (f.upgrades) { var can = Cast.upgrades.some(function (u) { return Run.canBuy(s, u.id); }); K.tag(ctx, 'upg', 132, by, 190, 56, '添置', { kind: 'wood', sub: can ? '有买得起的' : '旧货单', onTap: function () { self.shop = true; Au.play('page'); } }); }
    K.tag(ctx, 'book', 334, by, 170, 56, '小本子', { kind: 'wood', onTap: function () { app.openOverlay(require('ui/s_book').Book, {}); } });
    K.tag(ctx, 'sleep', 868, by, 280, 56, s.day >= s.days ? '熄灯' : '熄灯 · 明天见', { kind: 'teal', size: 25, onTap: function () { if (self.out > 0) return; self.out = 0.01; Au.play('switch'); Au.setScene({ music: null }); } });
    if (this.shop) this.drawShop(ctx);
  };
  P.drawShop = function (ctx) {
    var s = this.s, self = this, list = Cast.upgrades.filter(function (u) { return s.day >= u.day || s.upg[u.id]; });
    K.dim(ctx, 0.5); U.hit('upg_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 300, y = 70, w = 680, h = 80 + Math.max(1, list.length) * 68 + 76;
    K.paper(ctx, x, y, w, h, { pin: K.col.teal });
    U.text(ctx, '旧货单', x + 30, y + 54, { size: 30, bold: true, color: INK });
    U.text(ctx, '手头 ' + K.yuan(s.cash) + (s.depositPaid || s.day > 26 ? '' : ' · 押金要留 ' + K.yuan(s.deposit)), x + w - 30, y + 52, { size: 18, align: 'right', color: MUTE });
    if (!list.length) U.text(ctx, '收旧货的还没来过。', x + w / 2, y + 120, { size: 20, align: 'center', color: MUTE });
    list.forEach(function (u, i) {
      var yy = y + 78 + i * 68, has = !!s.upg[u.id], ok = Run.canBuy(s, u.id);
      ctx.strokeStyle = 'rgba(120,90,50,.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 24, yy + 64); ctx.lineTo(x + w - 24, yy + 64); ctx.stroke();
      U.text(ctx, u.name, x + 30, yy + 30, { size: 23, bold: true, color: has ? MUTE : INK }); U.text(ctx, u.text, x + 30, yy + 54, { size: 16, color: MUTE, maxW: w - 220 });
      if (has) K.stamp(ctx, x + w - 96, yy + 34, '已添', RED, -0.1, 20);
      else K.tag(ctx, 'buy_' + u.id, x + w - 170, yy + 8, 140, 48, K.yuan(u.cost), { kind: ok ? 'teal' : 'paper', size: 21, disabled: !ok, onTap: function () { if (Run.buy(s, u.id)) { Au.play('coins'); Au.play('stamp'); self.app.save(); } } });
    });
    K.tag(ctx, 'upg_close', x + w / 2 - 110, y + h - 66, 220, 50, '合上', { kind: 'wood', onTap: function () { self.shop = false; } });
  };
  P.describe = function () { var r = this.rec; return { day: this.s.day, net: r.net / 100, rev: r.rev / 100, served: r.served, stamp: this.n.stamp, quotes: this.n.quotes, zhou: this.n.zhou, shop: this.shop, canBuy: Cast.upgrades.filter(function (u) { return Run.canBuy(this.s, u.id); }, this).map(function (u) { return u.id; }) }; };
  return { Night: Night };
});
