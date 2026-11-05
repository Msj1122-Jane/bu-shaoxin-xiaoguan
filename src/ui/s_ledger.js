// 晚账：先给今日结论，再允许展开收入、成本、食材、口碑、关系与风险线索（GDD §4.1）。
BSX.define('ui/s_ledger', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var Act = require('game/actors');
  var D = require('content/dishes');
  var R = require('content/regulars');
  var Prep = require('ui/s_prep');
  function burnClue(s) {
    if (s.burn >= 80) return '夜里胃一阵阵发紧。门口有人在议论这家店。';
    if (s.burn >= 60) return '小郑这几天没来。账本边上多了一行：用油记录？';
    if (s.burn >= 30) return '有客人皱了下眉。老周把台面擦了三遍。';
    return null;
  }
  function Ledger(app) {
    this.name = 'ledger'; this.app = app; this.t = 0; this.open = false; this.pausable = true;
    var s = app.state;
    Sc.set({ view: 'room', time: 'night', weather: s.today.weather, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    Au.setAmbience('night', s.today.weather === 'rain'); Au.play('page');
  }
  var P = Ledger.prototype;
  P.update = function (dt) { this.t += dt; };
  P.draw = function (ctx) {
    var app = this.app, s = app.state, L = s.ledger, self = this;
    Sc.drawBack(ctx); Sc.drawFront(ctx);
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.45)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    if (!L) return;
    var net = L.cashClose - L.cashOpen;
    U.panel(ctx, 140, 40, 1000, 640, 'paper');
    // 账本装饰
    A.cell(ctx, 'atlas_ui', 6, 160, 52, 70, 70, { trim: true, fit: true, anchor: 'center' });
    U.text(ctx, (s.mode === 'week' ? '常营业 ' : '第') + s.day + (s.mode === 'week' ? '/7' : '日') + ' 晚账', 240, 100, { size: 30, bold: true });
    // 结论
    var k = Math.min(1, this.t * 2);
    U.text(ctx, net >= 0 ? '今天净赚' : '今天亏了', 640, 170, { size: 30, align: 'center', color: '#7d5a35' });
    U.text(ctx, U.coin(Math.abs(net) * k) + ' 元', 640, 236, { size: 66, bold: true, align: 'center', color: net >= 0 ? '#2f6f66' : '#b8432f' });
    if (this.t > 0.6 && !this.stamped) { this.stamped = true; Au.play('stamp'); }
    if (this.t > 0.6) { ctx.save(); ctx.translate(950, 190); ctx.rotate(-0.2); ctx.strokeStyle = net >= 0 ? '#b8432f' : '#7d5a35'; ctx.lineWidth = 4; ctx.strokeRect(-70, -34, 140, 68); U.text(ctx, L.closed ? '整改' : net >= 0 ? (L.grades.sig >= 2 ? '手艺好' : '没白忙') : '要调整', 0, 12, { size: 30, bold: true, align: 'center', color: net >= 0 ? '#b8432f' : '#7d5a35' }); ctx.restore(); }
    // 三条原因（图标＋短句）
    var y = 290;
    var lines = [];
    lines.push(['🍚', '卖出 ' + L.served + ' 份' + (L.lost ? '，' + L.lost + ' 位没等到' : '，没让人空等')]);
    var best = L.sales.slice().sort(function (a, b) { return b.qty * b.price - a.qty * a.price; })[0];
    if (best && best.qty) lines.push(['dish:' + best.id, D.byId[best.id].name + '卖得最好（' + best.qty + ' 份）']);
    lines.push(['💬', L.quote]);
    var clue = burnClue(s); if (clue) lines.push(['⚠', clue]);
    (L.choices || []).slice(0, 1).forEach(function (c) { lines.push(['✎', c.result]); });
    (L.notes || []).slice(0, 2).forEach(function (n) { lines.push(['✎', n]); });
    lines.slice(0, 5).forEach(function (l, i) {
      var ly = y + i * 50;
      if (l[0].indexOf('dish:') === 0) A.food(ctx, l[0].slice(5), 214, ly - 34, 44);
      else if (l[0] === '⚠') A.cell(ctx, 'atlas_ui', 14, 214, ly - 34, 44, 44, { trim: true, fit: true, anchor: 'center' });
      else { ctx.fillStyle = '#7d5a35'; ctx.beginPath(); ctx.arc(236, ly - 12, 6, 0, 7); ctx.fill(); }
      U.text(ctx, l[1], 274, ly, { size: 24, maxW: 820, color: l[0] === '⚠' ? '#b8432f' : '#3b2a1a' });
    });
    // 关系：今天来过的常客
    var vx = 214;
    U.text(ctx, '今天来过', 214, 572, { size: 18, color: '#7d5a35' });
    L.visitors.forEach(function (id, i) {
      ctx.save(); ctx.beginPath(); ctx.arc(vx + 120 + i * 70, 560, 28, 0, 7); ctx.fillStyle = '#efe0bf'; ctx.fill(); ctx.clip(); Act.portrait(ctx, id, vx + 92 + i * 70, 532, 56); ctx.restore();
      var aff = s.regulars[id].aff; for (var h = 0; h < 7; h++) { ctx.fillStyle = h < Math.floor(aff) ? '#d0603a' : 'rgba(122,90,53,.25)'; ctx.fillRect(vx + 96 + i * 70 + h * 7, 594, 5, 5); }
    });
    // 口碑
    var dr = Math.round((L.rep1 - L.rep0) * 10) / 10;
    A.cell(ctx, 'atlas_ui', 13, 820, 530, 50, 50, { trim: true, fit: true, anchor: 'center' });
    U.text(ctx, Math.round(L.rep1) + (dr ? (dr > 0 ? ' ↑' : ' ↓') : ''), 878, 566, { size: 28, bold: true, color: dr >= 0 ? '#2f6f66' : '#b8432f' });
    if (s.day === 1 && s.mode === 'story') U.para(ctx, '明天开门前，可以挑油、挑料、定价牌。便宜省成本，好料留客人。', 640, 640 - 40, 460, { size: 18, color: '#7d5a35', align: 'left', lh: 24 });
    U.button(ctx, 'ledger_detail', 214, 616, 200, 52, this.open ? '收起明细' : '展开明细', { kind: 'paper', size: 22, onTap: function () { self.open = !self.open; Au.play('page'); } });
    var last = s.early || s.day >= s.days;
    U.button(ctx, 'ledger_next', 900, 610, 220, 60, last ? '月底' : '明天', { size: 28, onTap: function () { self.next(); } });
    if (this.open) this.drawDetail(ctx, s, L);
  };
  P.next = function () {
    var app = this.app;
    if (app.dispatch({ t: 'nextDay' })) { Au.play('page'); app.route(); }
  };
  P.drawDetail = function (ctx, s, L) {
    U.panel(ctx, 180, 110, 920, 490, 'cream');
    U.text(ctx, '明细', 640, 154, { size: 28, bold: true, align: 'center' });
    var rows = [['营业收入', L.revenue], ['招牌小费', L.tips], ['食材', -L.ingredient], ['用油（' + Prep.TIERS.oil.names[L.oil] + '）', -L.oilCost], ['房租水电', -L.fixed], ['帮工工资', -L.wage], ['事件', L.eventCash]];
    rows.forEach(function (r, i) { if (!r[1] && i > 1) return; U.text(ctx, r[0], 230, 200 + i * 40, { size: 22 }); U.text(ctx, U.yuan(r[1], true), 560, 200 + i * 40, { size: 22, align: 'right', bold: true, color: r[1] < 0 ? '#b8432f' : '#2f6f66' }); });
    U.text(ctx, '净', 230, 200 + 7 * 40 + 10, { size: 24, bold: true }); U.text(ctx, U.yuan(L.cashClose - L.cashOpen, true), 560, 200 + 7 * 40 + 10, { size: 24, align: 'right', bold: true });
    U.text(ctx, '钱匣 ' + U.coin(L.cashClose) + ' 元', 230, 560, { size: 22, color: '#7d5a35' });
    // 逐菜
    L.sales.forEach(function (x, i) { var y = 196 + i * 62; A.food(ctx, x.id, 640, y - 30, 52); U.text(ctx, D.byId[x.id].name, 702, y, { size: 20 }); U.text(ctx, x.qty + '份 × ' + U.coin(x.price) + '元', 1050, y, { size: 20, align: 'right' }); U.text(ctx, '成本 ' + U.coin(x.cost) + '元/份', 1050, y + 22, { size: 16, align: 'right', color: '#8d7a60' }); });
    U.text(ctx, '客流 ' + L.flow + ' · 产能 ' + L.cap + ' · 手做均分 ' + Math.round(L.avgQ * 100), 702, 520, { size: 18, color: '#7d5a35' });
    U.text(ctx, Prep.TIERS.oil.short[L.oil] + ' · ' + Prep.TIERS.material.short[L.material] + ' · ' + Prep.TIERS.price.short[L.price], 702, 550, { size: 18, color: '#7d5a35' });
  };
  P.describe = function () { var L = this.app.state.ledger; return L ? { day: L.day, net: L.cashClose - L.cashOpen, revenue: L.revenue, ingredient: L.ingredient, oil: L.oilCost, fixed: L.fixed, wage: L.wage, tips: L.tips, eventCash: L.eventCash, served: L.served, lost: L.lost, flow: L.flow, cap: L.cap, grades: L.grades, quote: L.quote, rep: [L.rep0, L.rep1], expanded: this.open, clue: burnClue(this.app.state) } : null; };
  return { Ledger: Ledger, burnClue: burnClue };
});
