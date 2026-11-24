// 晨备：卷帘门还没拉。定今天的菜单和每样备多少份（黑板）、油换不换、料买谁的、价钱（三张小卡）、看一眼进货小票，然后按住把门拉起来。
// 功能按天逐步开放：第 2 天只有备料和油，第 3 天能换菜单，第 4 天选用料，第 5 天定价，第 8 天可以把进货单贴出去。
BSX.define('ui/s_prep', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Run = require('core/run');
  var C = require('content/config');
  var D = require('content/dishes');
  var Story = require('content/story');
  var Cond = require('core/cond');
  var CHALK = '#f4f0e0', CHALK2 = '#f2d27a';
  var STN_COL = { pot: '#e8dcc0', fryer: '#e8b84a', griddle: '#8a8078', boil: '#6f9a96', soy: '#3b8076', side: '#b8823a' };

  function Prep(app, p) {
    var s = app.state;
    this.app = app; this.name = 'prep'; this.pausable = true; this.s = s; this.t = 0; this.closed = !!p.closed; this.hold = 0; this.holding = false; this.opened = false;
    Fx.reset(); require('game/stations').silence();
    Shop.reset('night', s.today.weather); Shop.setShutter(1, true); Shop.crowd = 0.15;
    Au.setScene({ place: 'shop', rain: s.today.weather === 'rain' ? 0.8 : 0, crowd: 0, dawn: 0, music: 'dawn' });
    this.f = Run.features(s);
    this.notes = this.buildNotes();
    (s.today.news || []).forEach(function (n) { if (!n.shown) { n.shown = true; } });
  }
  var P = Prep.prototype;
  P.buildNotes = function () {
    var s = this.s, t = s.today, out = [], y = s.hist[s.hist.length - 1];
    (t.notes || []).forEach(function (n) { out.push({ text: n.text, col: n.kind === 'order' ? '#fff3b8' : '#f6ecd6', from: n.from }); });
    t.newDishes.forEach(function (id) { out.push({ text: '新学会：' + D.byId[id].name + '。可以写上菜单了。', col: '#d8f0d0' }); });
    var toRent = 7 - (s.day % 7); if (s.day % 7 === 0) toRent = 0;
    if (s.day < 28 && toRent <= 1 && s.day % 7 !== 1) out.push({ text: (toRent === 0 ? '今晚' : '明晚') + '交房租 ' + K.yuan(C.rentWeekly) + '。', col: '#ffd9c8' });
    if (s.day >= 8 && s.day <= 26 && !s.depositPaid && (s.day % 3 === 0 || s.day >= 24)) out.push({ text: '续租押金 ' + K.yuan(s.deposit) + '，第 26 天给话。', col: '#ffd9c8' });
    var tips = { 2: '油每用一天就老一点：熟得快、容易焦。何姨说三天一换。', 3: '灶台底下那口老煎锅能用了。菜单最多写四样，三口灶。', 4: '今天起可以挑用料。便宜的省钱，好的出品更香。', 5: '今天起可以自己定价。薄利人多，提价人少。', 8: '可以把进货单贴在门口——油和料都摆在明面上。' };
    if (tips[s.day]) out.push({ text: tips[s.day], col: '#e0ecf4' });
    if (Run.costUpNow(s) && (s.day === C.costUp.from || s.day === C.costUp.from + 1)) out.push({ text: '鲜货和好料这几天涨价一成半。', col: '#ffd9c8' });
    return out.slice(0, 4);
  };
  P.update = function (dt) {
    var s = this.s, app = this.app;
    this.t += dt;
    if (this.opened) return;
    if (this.holding) {
      this.hold = Math.min(1, this.hold + dt / 0.9); var tk = Math.floor(this.hold * 8); if (tk !== this.tick) { this.tick = tk; Au.play('shutter_tick'); }
      if (this.hold >= 1) { this.opened = true; this.holding = false; app.capture = null; Run.openShop(s); app.save(); app.P.vibrate('heavy'); Au.play('shutter_up'); Shop.setShutter(0); app.go(require('ui/s_play').Shift, {}, false); }
    } else this.hold = Math.max(0, this.hold - dt * 1.6);
    Shop.setShutter(1 - this.hold * 0.35, false);
  };
  P.canOpen = function () { var s = this.s, c = Run.planCost(s); if (c.total > Math.max(0, s.cash) + 8000) return '钱不够进这么多货'; if (!s.plan.menu.some(function (id) { return (s.plan.stock[id] || 0) > 0; })) return '什么都没备'; return ''; };
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, p = s.plan, f = this.f, t = this.t;
    Shop.drawBack(ctx, s, { curtain: !!s.flags.man_curtain }); Shop.drawCounter(ctx); Shop.drawLight(ctx); Shop.drawShutter(ctx);
    K.dim(ctx, 0.28);
    K.dayChip(ctx, s, 14, 12, t);
    U.text(ctx, '清晨 · 备料', 198, 48, { size: 26, bold: true, color: '#fbeed0', stroke: 'rgba(30,18,8,.85)' });
    K.iconBtn(ctx, 'pause', 1280 - 62 - (app.rightInset || 0), 10, 48, 'pause', function () { app.pause(); }, { label: '暂停' });
    K.iconBtn(ctx, 'book', 1280 - 122 - (app.rightInset || 0), 10, 48, 'book', function () { app.openOverlay(require('ui/s_book').Book, {}); }, { label: '小本子' });
    K.tin(ctx, 1010, 34, s.cash, 0);
    if (this.closed) {
      K.paper(ctx, 340, 220, 600, 280, { pin: K.col.red });
      U.text(ctx, '停业整改', 640, 290, { size: 40, bold: true, align: 'center', color: K.col.ink });
      U.para(ctx, '今天不开门。把油锅刷了，台面、地漏、抹布，一样一样过。', 400, 340, 480, { size: 22, color: K.col.ink });
      K.tag(ctx, 'prep_closed', 500, 420, 280, 58, '干到天黑', { kind: 'teal', onTap: function () { Run.closedDay(s); app.save(); app.route(true); } });
      return;
    }
    // ── 菜单牌（黑板）：今日菜单 + 每样备多少
    var bx = 22, by = 78, bw = 420, bh = 624;
    K.board(ctx, bx, by, bw, bh);
    var hot = Run.hotCount(p.menu), maxM = C.menuMax(s), burners = C.burners(s);
    U.text(ctx, '今日菜单', bx + 28, by + 52, { size: 28, bold: true, color: CHALK });
    if (f.menu) U.text(ctx, p.menu.length + '/' + maxM + ' 样 · 灶 ' + hot + '/' + burners, bx + bw - 28, by + 50, { size: 18, align: 'right', color: hot >= burners || p.menu.length >= maxM ? CHALK2 : 'rgba(244,240,224,.7)' });
    ctx.strokeStyle = 'rgba(244,240,224,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 24, by + 66); ctx.lineTo(bx + bw - 24, by + 66); ctx.stroke();
    var rh = p.menu.length > 5 ? 58 : 64, y0 = by + 76, yst = s.hist[s.hist.length - 1];
    p.menu.forEach(function (id, i) {
      var d = D.byId[id], y = y0 + i * rh, n = p.stock[id] || 0;
      ctx.fillStyle = STN_COL[d.st]; ctx.fillRect(bx + 20, y + 6, 5, rh - 14);
      A.food(ctx, id, bx + 30, y + 2, rh - 8, {});
      U.text(ctx, d.name, bx + 32 + rh, y + 28, { size: 22, bold: true, color: CHALK, maxW: 128 });
      U.text(ctx, K.yuan(Run.price(s, id)), bx + 32 + rh, y + 50, { size: 17, color: CHALK2 });
      if (yst && yst.want && yst.want[id] != null) U.text(ctx, '昨天要 ' + yst.want[id], bx + 96 + rh, y + 50, { size: 14, color: 'rgba(244,240,224,.6)' });
      if (f.stock) {
        var sx = bx + bw - (f.menu ? 190 : 150);
        K.tag(ctx, 'dec_' + id, sx, y + 10, 42, 42, '−', { kind: 'dark', size: 24, disabled: n <= 0, onTap: function () { Run.setStock(s, id, n - 2); Au.play('chalk'); } });
        U.text(ctx, String(n), sx + 68, y + 41, { size: 28, bold: true, align: 'center', color: n === 0 ? '#ffb0a0' : CHALK });
        K.tag(ctx, 'inc_' + id, sx + 94, y + 10, 42, 42, '+', { kind: 'dark', size: 24, onTap: function () { Run.setStock(s, id, n + 2); Au.play('chalk'); } });
        if (f.menu && p.menu.length > 1) K.tag(ctx, 'rm_' + id, bx + bw - 54, y + 12, 36, 38, '×', { kind: 'dark', size: 20, onTap: function () { Run.setMenu(s, id, false); Au.play('soldout'); } });
      } else U.text(ctx, '备 ' + n + ' 份', bx + bw - 30, y + 38, { size: 22, align: 'right', color: CHALK });
    });
    var yy = y0 + p.menu.length * rh + 6;
    if (f.stock && yst) K.tag(ctx, 'suggest', bx + 24, yy, 176, 40, '照昨天卖的备', { kind: 'dark', size: 17, onTap: function () { p.menu.forEach(function (id) { Run.setStock(s, id, Run.suggest(s, id)); }); Au.play('chalk'); } });
    var sets = Run.setsOn(s); if (sets.length) U.text(ctx, '搭着卖：' + sets.map(function (id) { return D.byId[id].name + ' ' + K.yuan(Run.price(s, id)); }).join('、'), bx + (f.stock && yst ? 212 : 28), yy + 27, { size: 15, color: CHALK2, maxW: 200 });
    if (f.menu) {
      var rest = Run.menuChoices(s).filter(function (d) { return p.menu.indexOf(d.id) < 0; });
      yy += 52;
      if (rest.length) {
        U.text(ctx, '还能写上去的', bx + 28, yy + 14, { size: 16, color: 'rgba(244,240,224,.7)' });
        var cols = 6, cs = 62, rowsLeft = Math.max(1, Math.floor((by + bh - 18 - (yy + 22)) / (cs + 4)));
        rest.slice(0, cols * rowsLeft).forEach(function (d, i) {
          var cx = bx + 24 + (i % cols) * (cs + 2), cy = yy + 22 + Math.floor(i / cols) * (cs + 4), why = Run.whyNot(s, d.id), isNew = s.today.newDishes.indexOf(d.id) >= 0;
          var st = U.hit('add_' + d.id, cx, cy, cs, cs, { label: '加 ' + d.name, onTap: function () { if (!Run.setMenu(s, d.id, true)) { app.notice(Run.whyNot(s, d.id) || '加不上'); Au.play('wrong'); } else Au.play('chalk'); } });
          ctx.fillStyle = st.hover ? 'rgba(244,240,224,.2)' : 'rgba(244,240,224,.08)'; U.rr(ctx, cx, cy, cs - 2, cs, 8); ctx.fill();
          ctx.save(); if (why) ctx.globalAlpha = 0.45; A.food(ctx, d.id, cx + 6, cy + 1, cs - 16, {}); ctx.restore();
          U.text(ctx, d.name.length > 3 ? d.name.slice(0, 3) : d.name, cx + cs / 2 - 1, cy + cs - 5, { size: 13, align: 'center', color: CHALK });
          ctx.fillStyle = STN_COL[d.st]; ctx.fillRect(cx + 3, cy + 4, 4, 12);
          if (isNew) { ctx.fillStyle = '#d8432f'; ctx.beginPath(); ctx.arc(cx + cs - 10, cy + 9, 6, 0, 7); ctx.fill(); }
        });
      }
    }
    // ── 三张小卡：油 / 料 / 价
    var cx0 = 462, cw = 420, cy0 = 78;
    function card(y, h, title, sub) { K.paper(ctx, cx0, y, cw, h, {}); U.text(ctx, title, cx0 + 20, y + 34, { size: 23, bold: true, color: K.col.ink }); if (sub) U.text(ctx, sub, cx0 + 60, y + 33, { size: 15, color: K.col.mute, maxW: cw - 80 }); }
    function opts(y, list, cur, set) { var w = (cw - 32 - (list.length - 1) * 8) / list.length; list.forEach(function (o, i) { K.tag(ctx, o.id, cx0 + 16 + i * (w + 8), y, w, 54, o.label, { kind: 'paper', selected: cur === o.v, sub: o.sub, size: 19, onTap: function () { set(o.v); Au.play('page'); } }); }); }
    var y = cy0;
    if (f.oil && Run.usesOil(s)) {
      var age = s.oil.age, rate = s.oil.bulk ? C.oil.bulkRate : 1, will = p.oil === 'new' ? 0 : p.oil === 'bulk' ? C.oil.bulkAge : age + (p.oil === 'filter' ? 0.5 : 1) * rate;
      card(y, 128, '油', '用下来今天算第 ' + (Math.round(will * 10) / 10 + 1).toFixed(will % 1 ? 1 : 0) + ' 天' + (will >= 3 ? '：熟得快，窗口窄，会冒烟' : will >= 2 ? '：有点老了' : will < 1 ? '：清亮' : ''));
      var kk = Math.min(1, will / 5); ctx.fillStyle = 'rgb(' + Math.round(236 - 132 * kk) + ',' + Math.round(184 - 120 * kk) + ',' + Math.round(74 - 50 * kk) + ')'; U.rr(ctx, cx0 + cw - 54, y + 12, 34, 34, 6); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2; ctx.stroke();
      var ol = [{ id: 'oil_keep', v: 'keep', label: '接着用', sub: '不花钱' }, { id: 'oil_filter', v: 'filter', label: '滤一滤', sub: K.yuan(C.oil.filter) }, { id: 'oil_new', v: 'new', label: '换新油', sub: K.yuan(C.oil.fresh) }];
      if (s.day >= 8) ol.push({ id: 'oil_bulk', v: 'bulk', label: '散装油', sub: K.yuan(C.oil.bulk) + ' · 老得快' });
      opts(y + 58, ol, p.oil, function (v) { p.oil = v; });
      y += 140;
    }
    if (f.mat) {
      card(y, 128, '料', ['便宜两成，出品差一点', '老秦天不亮送来的', '贵三成，有票可查，出品更香'][p.mat]);
      var ml = [{ id: 'mat0', v: 0, label: '批发冻品', sub: '省' }, { id: 'mat1', v: 1, label: '老秦的鲜货', sub: '平' }];
      if (f.mat2) ml.push({ id: 'mat2', v: 2, label: '有票的好料', sub: '贵' });
      opts(y + 58, ml, p.mat, function (v) { Run.setMat(s, v); });
      y += 140;
    }
    if (f.price) {
      card(y, 128, '价', ['来的人多，每份赚得少', '街坊都认的价', '来的人少些，每份多赚'][p.price]);
      opts(y + 58, [{ id: 'price0', v: 0, label: '薄利', sub: '八五折' }, { id: 'price1', v: 1, label: '公道', sub: '原价' }, { id: 'price2', v: 2, label: '提价', sub: '加两成半' }], p.price, function (v) { p.price = v; });
      y += 140;
    }
    if (f.post) { K.tag(ctx, 'post', cx0, y, cw, 50, p.post ? '进货单：贴在门口了' : '进货单：收在抽屉里', { kind: p.post ? 'teal' : 'paper', size: 20, sub: p.post ? '油第几天、料哪来的，谁都看得见' : '点一下，贴出去', onTap: function () { p.post = !p.post; Au.play('page'); } }); y += 62; }
    // 便条
    var ny = Math.max(y + 4, 300);
    this.notes.forEach(function (n, i) {
      var nyy = ny + i * 62; if (nyy > 640) return;
      ctx.save(); ctx.translate(cx0 + cw / 2, nyy + 27); ctx.rotate((i % 2 ? 1 : -1) * 0.008); ctx.translate(-(cx0 + cw / 2), -(nyy + 27));
      ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.fillRect(cx0 + 3, nyy + 5, cw, 54); ctx.fillStyle = n.col; ctx.fillRect(cx0, nyy, cw, 54);
      var ls = U.wrap(ctx, n.text, cw - 28, 17); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, cx0 + 14, nyy + (ls.length > 1 ? 23 : 33) + j * 22, { size: 17, color: K.col.ink }); });
      ctx.restore();
    });
    // ── 进货小票 + 开门
    var rx = 902, rw = 356, cost = Run.planCost(s), ry = 78;
    K.paper(ctx, rx, ry, rw, 420, { r: 4 });
    U.text(ctx, '进货小票', rx + rw / 2, ry + 40, { size: 24, bold: true, align: 'center', color: K.col.ink });
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rx + 16, ry + 54); ctx.lineTo(rx + rw - 16, ry + 54); ctx.stroke(); ctx.setLineDash([]);
    var ly = ry + 82, lh = cost.lines.length > 5 ? 28 : 32;
    cost.lines.forEach(function (l) { U.text(ctx, D.byId[l.id].name + ' ×' + l.n, rx + 22, ly, { size: 18, color: K.col.ink, maxW: 210 }); U.text(ctx, K.yuan(l.sum), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.ink }); ly += lh; });
    if (cost.oil) { U.text(ctx, p.oil === 'new' ? '新油一锅' : p.oil === 'bulk' ? '散装油' : '滤油', rx + 22, ly, { size: 18, color: K.col.ink }); U.text(ctx, K.yuan(cost.oil), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.ink }); ly += lh; }
    if (cost.pantry) { U.text(ctx, '昨天市场收的货抵', rx + 22, ly, { size: 18, color: K.col.teal }); U.text(ctx, '−' + K.yuan(cost.pantry), rx + rw - 22, ly, { size: 18, align: 'right', color: K.col.teal }); ly += lh; }
    ctx.strokeStyle = '#a88a5a'; ctx.beginPath(); ctx.moveTo(rx + 16, ly - 14); ctx.lineTo(rx + rw - 16, ly - 14); ctx.stroke();
    U.text(ctx, '合计', rx + 22, ly + 14, { size: 21, bold: true, color: K.col.ink }); U.text(ctx, K.yuan(cost.total), rx + rw - 22, ly + 14, { size: 24, bold: true, align: 'right', color: K.col.red });
    var after = s.cash - cost.total;
    U.text(ctx, '付完手头剩', rx + 22, ly + 46, { size: 17, color: K.col.mute }); U.text(ctx, K.yuan(after), rx + rw - 22, ly + 46, { size: 19, bold: true, align: 'right', color: after < 0 ? K.col.red : K.col.ink });
    var gross = 0; p.menu.forEach(function (id) { gross += (p.stock[id] || 0) * Run.price(s, id); });
    U.text(ctx, '全卖完能收', rx + 22, ly + 74, { size: 17, color: K.col.mute }); U.text(ctx, K.yuan(gross), rx + rw - 22, ly + 74, { size: 19, align: 'right', color: K.col.ink });
    var guess = yst ? Math.round((yst.served + yst.walked + yst.balked) * (s.today.flow || 1)) : (s.day === 2 ? 11 : 12);
    U.text(ctx, (s.today.weather === 'rain' ? '下雨，人会少些。' : '') + '今天大概来 ' + Math.max(4, guess - 2) + '–' + (guess + 3) + ' 位。', rx + rw / 2, ry + 400, { size: 16, align: 'center', color: K.col.mute, maxW: rw - 30 });
    var why = this.canOpen(), hx = rx, hy = 520, hw = rw, hh = 150;
    var st = U.hit('open', hx, hy, hw, hh, { label: '按住拉起卷帘门', disabled: !!why, onDown: function () { self.holding = true; return function (type) { if (type === 'up' || type === 'cancel') self.holding = false; }; } });
    ctx.save(); if (why) ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(30,18,8,.4)'; U.rr(ctx, hx + 3, hy + 7, hw, hh, 14); ctx.fill();
    ctx.fillStyle = '#6f7a80'; U.rr(ctx, hx, hy, hw, hh, 14); ctx.fill(); ctx.strokeStyle = '#3c4448'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); U.rr(ctx, hx, hy, hw, hh, 14); ctx.clip();
    var off = this.hold * hh * 0.9;
    for (var sy = hy - 16 - off; sy < hy + hh; sy += 16) { ctx.fillStyle = '#8c979c'; ctx.fillRect(hx, sy, hw, 5); ctx.fillStyle = '#4c555a'; ctx.fillRect(hx, sy + 13, hw, 3); }
    if (this.hold > 0) { var g = ctx.createLinearGradient(0, hy + hh - off - 30, 0, hy + hh); g.addColorStop(0, 'rgba(255,224,150,0)'); g.addColorStop(0.3, 'rgba(255,224,150,.95)'); g.addColorStop(1, 'rgba(255,236,190,1)'); ctx.fillStyle = g; ctx.fillRect(hx, hy + hh - off - 30, hw, off + 30); }
    ctx.restore();
    U.text(ctx, why || '按住 · 拉起卷帘门', hx + hw / 2, hy + 70 - this.hold * 20, { size: why ? 22 : 28, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(30,24,20,.9)', strokeW: 6 });
    if (!why) U.text(ctx, '开门就不能改了', hx + hw / 2, hy + 104 - this.hold * 20, { size: 16, align: 'center', color: '#e8e0d0', stroke: 'rgba(30,24,20,.8)' });
    ctx.restore();
    if (st.focus) { ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); U.rr(ctx, hx - 4, hy - 4, hw + 8, hh + 8, 16); ctx.stroke(); ctx.setLineDash([]); }
  };
  P.key = function (k) { if (k === 'o' && !this.canOpen()) { this.hold = 1; this.holding = true; } };
  P.describe = function () { var s = this.s; return { features: this.f, plan: s.plan, cost: Run.planCost(s).total / 100, canOpen: !this.canOpen(), why: this.canOpen(), notes: this.notes.map(function (n) { return n.text; }), choices: Run.menuChoices(s).map(function (d) { return d.id; }) }; };
  return { Prep: Prep };
});
