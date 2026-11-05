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
  var C = require('content/config');
  var Run = require('core/run');
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
    var lostO = L.lostOrders != null ? L.lostOrders : L.lost, over = L.overflow || 0;
    lines.push(['🍚', L.closed ? (s.today.sealed ? '封条停业的一天' : '停业整改的一天') : '卖出 ' + L.served + ' 份' + (lostO ? '，' + lostO + ' 位没等到' : '，没让人空等')]);
    if (over >= 5 && !L.closed) lines.push(['★', '门口还有 ' + over + ' 人排不上——生意好到做不过来（帮工、第二口锅能多做）']);
    var gl = L.goals || []; if (gl.length) { var gd = gl.filter(function (g) { return g.done; }).length; lines.push([gd ? '★' : '⚠', '今日小目标 ' + gd + '/' + gl.length + (gd ? '，奖励 +' + U.coin(L.goalCash) + ' 元' : '') + (gl[0] && !gl[0].done && gl[0].id === 'nocheat' ? '（走了捷径，“不偷懒”没达成）' : '')]); }
    if (L.passive) lines.push(['★', '夜里自助进账 +' + U.coin(L.passive) + ' 元']);
    var best = L.sales.slice().sort(function (a, b) { return b.qty * b.price - a.qty * a.price; })[0];
    if (best && best.qty) lines.push(['dish:' + best.id, D.byId[best.id].name + '卖得最好（' + best.qty + ' 份）']);
    if (L.maxCombo >= 3) lines.push(['★', '早高峰最高连击 ×' + L.maxCombo + '，小费 +' + U.coin(L.comboTips) + ' 元']);
    if (L.honestStreak >= 2) lines.push(['★', '连续放心经营 ' + L.honestStreak + ' 天：明天客流 +' + Math.round(Math.min(C.honesty.streakFlowMax, L.honestStreak * C.honesty.streakFlow) * 100) + '%']);
    if (L.cheats) { var t0 = Run.lanternTier(L.burn - L.cheats * C.honesty.cheatBurn).idx, t1 = Run.lanternTier(L.burn).idx; lines.push(['⚠', '偷懒 ' + L.cheats + ' 次，当场多赚 ' + U.coin(L.cheatGain) + ' 元，' + (t1 > t0 ? '良心灯笼掉了一档' : '良心灯笼的光弱了一点')]); }
    if (L.sick) lines.push(['⚠', L.sick + ' 位客人吃坏肚子，退款 ' + U.coin(L.refunds) + ' 元，差评传开了']);
    lines.push(['💬', L.quote]);
    var clue = burnClue(s); if (clue) lines.push(['⚠', clue]);
    (L.choices || []).slice(0, 1).forEach(function (c) { lines.push(['✎', c.result]); });
    (L.notes || []).slice(0, 2).forEach(function (n) { lines.push(['✎', n]); });
    lines = lines.slice(0, 7);
    var lh = lines.length > 6 ? 38 : 44;
    lines.forEach(function (l, i) {
      var ly = y + i * lh;
      if (l[0].indexOf('dish:') === 0) A.food(ctx, l[0].slice(5), 214, ly - 34, 44);
      else if (l[0] === '⚠') A.cell(ctx, 'atlas_ui', 14, 214, ly - 34, 44, 44, { trim: true, fit: true, anchor: 'center' });
      else if (l[0] === '★') A.cell(ctx, 'atlas_vfx', 15, 214, ly - 34, 44, 44, { trim: true, fit: true, anchor: 'center' });
      else { ctx.fillStyle = '#7d5a35'; ctx.beginPath(); ctx.arc(236, ly - 12, 6, 0, 7); ctx.fill(); }
      U.text(ctx, l[1], 274, ly, { size: lines.length > 6 ? 22 : 24, maxW: 820, color: l[0] === '⚠' ? '#b8432f' : '#3b2a1a' });
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
    BSX.require('ui/hud').lantern(ctx, 950, 528, s.burn, 0, this.t);
    if (s.day === 1 && s.mode === 'story') U.text(ctx, '明天开门前，可以挑油、挑料、定价牌。便宜省成本，好料留客人。', 214, 506, { size: 18, color: '#7d5a35', maxW: 900 });
    U.button(ctx, 'ledger_detail', 214, 616, 200, 52, this.open ? '收起明细' : '展开明细', { kind: 'paper', size: 22, onTap: function () { self.open = !self.open; Au.play('page'); } });
    // 打烊小玩法：和今天来过的常客猜拳（参考燕云的闲时玩法，D038）
    var mate = (L.visitors || [])[0];
    if (mate && !s.today.leisure && !this.open) U.button(ctx, 'ledger_leisure', 430, 616, 250, 52, '和' + R.byId[mate].name + '猜拳', { kind: 'wood', size: 22, onTap: function () { self.app.openOverlay(Leisure, { who: mate }); } });
    else if (s.today.leisure && !this.open) U.text(ctx, R.byId[s.today.leisure.who].name + (s.today.leisure.win ? '：“再来一盘！”' : '：“承让承让”'), 440, 650, { size: 20, color: '#7d5a35' });
    var last = s.early || s.day >= s.days;
    U.button(ctx, 'ledger_next', 900, 610, 220, 60, last ? '月底' : '收工', { size: 28, onTap: function () { if (last || !s.chores) self.next(); else self.app.openOverlay(Chores, { ledger: self }); } });
    if (this.open) this.drawDetail(ctx, s, L);
  };
  P.next = function () {
    var app = this.app;
    if (app.dispatch({ t: 'nextDay' })) { Au.play('page'); app.route(); }
  };
  P.drawDetail = function (ctx, s, L) {
    U.panel(ctx, 180, 110, 920, 490, 'cream');
    U.text(ctx, '明细', 640, 154, { size: 28, bold: true, align: 'center' });
    var rows = [['营业收入', L.revenue], ['招牌与连击小费', L.tips + (L.comboTips || 0)], ['偷懒省下', L.cheatGain || 0], ['吃坏肚子退款', -(L.refunds || 0)], ['食材', -L.ingredient], ['用油（' + Prep.TIERS.oil.names[L.oil] + '）', -L.oilCost], ['房租水电', -L.fixed], ['帮工工资', -L.wage], ['事件', L.eventCash], ['小目标奖励', L.goalCash || 0], ['夜间自助进账', L.passive || 0]];
    var ri = 0; rows.forEach(function (r, i) { if (!r[1] && i > 1) return; var i2 = ri++; if (i2 > 8) return; U.text(ctx, r[0], 230, 200 + i2 * 36, { size: 22 }); U.text(ctx, U.yuan(r[1], true), 560, 200 + i2 * 36, { size: 22, align: 'right', bold: true, color: r[1] < 0 ? '#b8432f' : '#2f6f66' }); });
    U.text(ctx, '净', 230, 548, { size: 24, bold: true }); U.text(ctx, U.yuan(L.cashClose - L.cashOpen, true), 560, 548, { size: 24, align: 'right', bold: true });
    U.text(ctx, '钱匣 ' + U.coin(L.cashClose) + ' 元', 230, 584, { size: 22, color: '#7d5a35' });
    // 逐菜
    L.sales.forEach(function (x, i) { var y = 196 + i * 62; A.food(ctx, x.id, 640, y - 30, 52); U.text(ctx, D.byId[x.id].name, 702, y, { size: 20 }); U.text(ctx, x.qty + '份 × ' + U.coin(x.price) + '元', 1050, y, { size: 20, align: 'right' }); U.text(ctx, '成本 ' + U.coin(x.cost) + '元/份', 1050, y + 22, { size: 16, align: 'right', color: '#8d7a60' }); });
    U.text(ctx, '客流 ' + L.flow + ' · 产能 ' + L.cap + ' · 手做均分 ' + Math.round(L.avgQ * 100), 702, 520, { size: 18, color: '#7d5a35' });
    U.text(ctx, Prep.TIERS.oil.short[L.oil] + ' · ' + Prep.TIERS.material.short[L.material] + ' · ' + Prep.TIERS.price.short[L.price], 702, 550, { size: 18, color: '#7d5a35' });
  };
  P.describe = function () { var L = this.app.state.ledger; return L ? { day: L.day, net: L.cashClose - L.cashOpen, revenue: L.revenue, ingredient: L.ingredient, oil: L.oilCost, fixed: L.fixed, wage: L.wage, tips: L.tips, eventCash: L.eventCash, served: L.served, lost: L.lost, flow: L.flow, cap: L.cap, grades: L.grades, quote: L.quote, rep: [L.rep0, L.rep1], expanded: this.open, clue: burnClue(this.app.state) } : null; };
  // 打烊收尾清单（参考深空当铺“夜间服务”，D040）：花点小钱把该做的做了；隔一天不做没事，连着两天不做就出问题。
  function Chores(app, p) { this.name = 'chores'; this.app = app; this.ledger = p.ledger; this.t = 0; }
  Chores.prototype.update = function (dt) { this.t += dt; };
  Chores.prototype.draw = function (ctx) {
    var app = this.app, s = app.state, self = this;
    ctx.fillStyle = 'rgba(20,14,8,.72)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 170, 70, 940, 580, 'cream');
    U.text(ctx, '打烊收尾', 640, 128, { size: 32, bold: true, align: 'center' });
    U.text(ctx, '隔一天不做没事，连着两天不做就要出问题', 640, 166, { size: 20, align: 'center', color: '#7d5a35' });
    C.chores.forEach(function (c, i) {
      var x = 210 + i * 300, y = 200, on = s.chores.plan[c.id], miss = s.chores.missed[c.id];
      var st = U.hit('chore_' + c.id, x, y, 260, 300, { label: c.name, onTap: function () { if (app.dispatch({ t: 'chore', id: c.id, on: !on })) Au.play(on ? 'tap' : 'knob'); } });
      ctx.save(); ctx.fillStyle = on ? '#e6f4ea' : '#f6e6d6'; U.rr(ctx, x, y, 260, 300, 14); ctx.fill(); ctx.strokeStyle = on ? '#2f6f66' : miss >= 1 ? '#b8432f' : '#c8a878'; ctx.lineWidth = on ? 4 : 3; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x + 130, y + 80); choreIcon(ctx, c.id, on, self.t); ctx.restore();
      U.text(ctx, c.name, x + 130, y + 170, { size: 24, bold: true, align: 'center' });
      U.text(ctx, on ? '−' + c.cost / 100 + ' 元' : '省 ' + c.cost / 100 + ' 元', x + 130, y + 204, { size: 22, bold: true, align: 'center', color: on ? '#7d5a35' : '#b8432f' });
      U.para(ctx, miss >= 1 && !on ? '昨天就没做！今晚再不做，明天要出事' : c.desc, x + 18, y + 236, 224, { size: 16, color: miss >= 1 && !on ? '#b8432f' : '#8d7a60', lh: 21, maxLines: 3 });
      ctx.save(); ctx.fillStyle = on ? '#2f6f66' : 'rgba(122,90,53,.3)'; ctx.beginPath(); ctx.arc(x + 230, y + 30, 16, 0, 7); ctx.fill(); ctx.restore();
      if (on) U.text(ctx, '✓', x + 230, y + 37, { size: 20, bold: true, align: 'center', color: '#fff' });
    });
    var cost = Run.choreCost(s);
    U.text(ctx, '今晚收尾 ' + cost / 100 + ' 元', 240, 588, { size: 24, bold: true, color: '#7d5a35' });
    U.button(ctx, 'chores_done', 860, 556, 220, 60, '收工，明天见', { size: 24, onTap: function () { app.closeOverlay(); self.ledger.next(); } });
    U.button(ctx, 'chores_back', 620, 556, 200, 60, '再看看账', { kind: 'paper', size: 22, onTap: function () { app.closeOverlay(); } });
  };
  function choreIcon(ctx, id, on, t) {
    ctx.lineWidth = 4; ctx.strokeStyle = '#5a3418';
    if (id === 'hood') { ctx.fillStyle = on ? '#c8ccd0' : '#7a6a50'; ctx.beginPath(); ctx.moveTo(-70, 30); ctx.lineTo(70, 30); ctx.lineTo(40, -30); ctx.lineTo(-40, -30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-16, -60, 32, 30); if (!on) { ctx.fillStyle = 'rgba(80,60,30,.6)'; for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-40 + i * 26, 22 + (i % 2) * 4, 5, 0, 7); ctx.fill(); } } else { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-30, -14, 8, 30); } }
    else if (id === 'waste') { ctx.fillStyle = on ? '#3f7a5a' : '#6a5a3a'; ctx.fillRect(-40, -40, 80, 90); ctx.strokeRect(-40, -40, 80, 90); ctx.fillStyle = on ? '#2f6f46' : '#4a3a2a'; ctx.fillRect(-48, -54, 96, 16); if (on) { ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('回收', 0, 14); } else { ctx.fillStyle = 'rgba(160,140,60,.7)'; ctx.beginPath(); ctx.arc(0, -46, 30, Math.PI, 0); ctx.fill(); } }
    else { for (var j = 0; j < 3; j++) { ctx.fillStyle = on ? '#fbfbf6' : '#e6dcc4'; ctx.beginPath(); ctx.ellipse(0, 30 - j * 22, 60, 16, 0, 0, 7); ctx.fill(); ctx.stroke(); } if (on) { ctx.strokeStyle = 'rgba(120,200,255,.8)'; ctx.lineWidth = 3; for (var k = 0; k < 3; k++) { var a = t * 3 + k * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 50, -40 + Math.sin(a) * 10, 5, 0, 7); ctx.stroke(); } } }
  }
  Chores.prototype.describe = function () { var s = this.app.state; return { plan: s.chores.plan, missed: s.chores.missed, cost: Run.choreCost(s) }; };
  var HANDS = [['rock', '石头'], ['scissors', '剪刀'], ['paper', '布']];
  function Leisure(app, p) { this.name = 'leisure'; this.app = app; this.who = p.who; this.me = 0; this.them = 0; this.round = 0; this.last = null; this.t = 0; this.done = false; }
  Leisure.prototype.update = function (dt) { this.t += dt; if (this.done) { this.dt = (this.dt || 0) + dt; } };
  Leisure.prototype.play = function (h) {
    var s = this.app.state, seed = (s.seed * 7 + s.day * 131 + this.round * 17) >>> 0, them = HANDS[(seed % 3 + 3) % 3][0];
    var win = (h === 'rock' && them === 'scissors') || (h === 'scissors' && them === 'paper') || (h === 'paper' && them === 'rock');
    var draw = h === them;
    if (win) this.me++; else if (!draw) this.them++;
    this.round++; this.last = { me: h, them: them, res: win ? '赢' : draw ? '平' : '输' };
    Au.play(win ? 'perfect' : draw ? 'tap' : 'rushed');
    if (this.me >= 2 || this.them >= 2 || this.round >= 5) { this.done = true; this.app.dispatch({ t: 'leisure', who: this.who, win: this.me > this.them }); }
  };
  function drawHand(ctx, h, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#f0c8a0'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3;
    if (h === 'rock') { ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, 7); ctx.fill(); ctx.stroke(); for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.18, -s * 0.38); ctx.lineTo(i * s * 0.18, -s * 0.15); ctx.stroke(); } }
    else if (h === 'paper') { ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.34, s * 0.3, 0, 0, 7); ctx.fill(); ctx.stroke(); for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(-s * 0.27 + j * s * 0.18, -s * 0.28, s * 0.07, s * 0.2, 0, 0, 7); ctx.fill(); ctx.stroke(); } }
    else { ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.3, 0, 7); ctx.fill(); ctx.stroke(); [[-0.12, -0.25], [0.12, -0.25]].forEach(function (p, k) { ctx.save(); ctx.rotate(k ? 0.25 : -0.25); ctx.beginPath(); ctx.ellipse(p[0] * s, p[1] * s, s * 0.07, s * 0.24, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }); }
    ctx.restore();
  }
  Leisure.prototype.draw = function (ctx) {
    var self = this, app = this.app, r = R.byId[this.who];
    ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 240, 90, 800, 540, 'cream');
    U.text(ctx, '打烊后，和' + r.name + '猜拳', 640, 146, { size: 30, bold: true, align: 'center' });
    U.text(ctx, '三局两胜 · 你 ' + this.me + ' : ' + this.them + ' ' + r.name, 640, 186, { size: 22, align: 'center', color: '#7d5a35' });
    ctx.save(); ctx.fillStyle = '#efe0bf'; U.rr(ctx, 860, 210, 140, 140, 12); ctx.fill(); ctx.beginPath(); U.rr(ctx, 860, 210, 140, 140, 12); ctx.clip(); Act.portrait(ctx, this.who, 860, 210, 140); ctx.restore();
    if (this.last) { drawHand(ctx, this.last.me, 470, 300, 110); U.text(ctx, 'VS', 640, 312, { size: 30, bold: true, align: 'center', color: '#b8432f' }); drawHand(ctx, this.last.them, 780, 300, 110); U.text(ctx, this.last.res, 640, 370, { size: 34, bold: true, align: 'center', color: this.last.res === '赢' ? '#2f6f66' : this.last.res === '输' ? '#b8432f' : '#7d5a35' }); }
    if (!this.done) HANDS.forEach(function (h, i) { var bx = 330 + i * 220; var st = U.hit('rps_' + h[0], bx, 420, 180, 150, { label: h[1], onTap: function () { self.play(h[0]); } }); ctx.save(); ctx.fillStyle = st.pressed ? '#e8b54a' : '#fff8e8'; U.rr(ctx, bx, 420, 180, 150, 14); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); drawHand(ctx, h[0], bx + 90, 480, 90); U.text(ctx, h[1], bx + 90, 556, { size: 22, bold: true, align: 'center' }); });
    else { var win = this.me > this.them; U.text(ctx, win ? r.name + '：“手气真好，下回再来！”' : r.name + '：“哈哈，明天接着来！”', 640, 470, { size: 26, align: 'center', color: '#2f6f66' }); U.text(ctx, win ? '好感 +0.4' : '好感 +0.15', 640, 510, { size: 20, align: 'center', color: '#7d5a35' }); U.button(ctx, 'rps_close', 540, 550, 200, 56, '好', { onTap: function () { app.closeOverlay(); } }); }
  };
  Leisure.prototype.describe = function () { return { who: this.who, me: this.me, them: this.them, done: this.done }; };
  return { Ledger: Ledger, burnClue: burnClue, Leisure: Leisure, Chores: Chores };
});
