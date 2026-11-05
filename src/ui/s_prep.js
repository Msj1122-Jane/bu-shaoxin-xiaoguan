// 晨备：油壶、食材篮、价牌三件实物（点按或左右滑切档，咔哒吸附）＋ 菜单托盘 ＋ 用图标表达的预计成本/客流/风险。
BSX.define('ui/s_prep', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var Act = require('game/actors');
  var Hud = require('ui/hud');
  var Run = require('core/run');
  var D = require('content/dishes');
  var C = require('content/config');
  var TIERS = {
    oil: { names: ['循环用油', '日常换油', '勤换新油'], icon: 8, short: ['旧油', '常油', '新油'] },
    material: { names: ['标准冻储', '当日鲜货', '小批可追溯'], icon: 9, short: ['冻储', '鲜货', '可追溯'] },
    price: { names: ['亲民', '合理', '劝退'], icon: 10, short: ['亲民', '合理', '劝退'] }
  };
  function Prep(app) {
    this.name = 'prep'; this.app = app; this.t = 0; this.pausable = true; this.anim = { oil: 0, material: 0, price: 0 }; this.fq = null;
    var s = app.state;
    Sc.set({ view: 'room', time: 'dawn', weather: s.today.weather, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    Au.setAmbience(s.today.weather === 'rain' ? 'rain' : 'morning', s.today.weather === 'rain');
    // 第 1 日：先做饭，不展示完整晨备（GDD §4.2）
    if (s.mode === 'story' && s.day === 1) { this.skipFirst = true; }
    this.tutorial = s.mode === 'story' && s.day === 2 ? 0 : -1;
  }
  var P = Prep.prototype;
  P.update = function (dt) { if (this.skipFirst) { this.skipFirst = false; this.app.dispatch({ t: 'confirmPrep' }); this.app.route(); return; } this.t += dt; for (var k in this.anim) this.anim[k] = Math.max(0, this.anim[k] - dt * 3); };
  P.setTier = function (key, v) {
    if (this.app.dispatch({ t: 'tier', key: key, v: v })) { this.anim[key] = 1; Au.play('knob'); this.app.P.vibrate('light'); if (this.tutorial >= 0 && ['oil', 'material', 'price'][this.tutorial] === key) this.tutorial++; }
  };
  P.draw = function (ctx) {
    var app = this.app, s = app.state, self = this;
    if (!s || this.skipFirst) { ctx.fillStyle = '#1d1712'; ctx.fillRect(0, 0, 1280, 720); return; }
    Sc.drawBack(ctx);
    // 老周在后厨备料
    Act.draw(ctx, 'zhou', 250, 520, 300, { t: this.t, pose: Math.floor(this.t / 3) % 3 === 1 ? 'cut' : 'idle' });
    Sc.drawFront(ctx);
    ctx.save(); ctx.fillStyle = 'rgba(30,18,8,.25)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    Hud.draw(ctx, app);
    // 三件实物
    var q = Run.quote(s);
    var keys = ['oil', 'material', 'price'];
    keys.forEach(function (k, i) {
      var x = 70 + i * 250, y = 410, w = 220, h = 250;
      var locked = self.tutorial >= 0 && i > self.tutorial;
      var hint = self.tutorial === i;
      U.panel(ctx, x, y, w, h, 'wood', { alpha: locked ? 0.35 : 1 });
      if (locked) { U.text(ctx, '？', x + w / 2, y + 140, { size: 60, align: 'center', color: '#fff3d6', alpha: 0.6 }); return; }
      var v = s[k], bounce = self.anim[k];
      var hit = U.hit('tier_' + k, x, y, w, 170, { label: TIERS[k].names[v], onTap: function () { self.setTier(k, (s[k] + 1) % 3); },
        onDown: function (x0) { var sx = x0; return function (type, x2) { if (type !== 'up') return; var cur = self.app.state[k]; if (Math.abs(x2 - sx) > 50) self.setTier(k, Math.max(0, Math.min(2, cur + (x2 > sx ? 1 : -1)))); else self.setTier(k, (cur + 1) % 3); }; } });
      if (hint) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(self.t * 5) * 0.4; ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 6; U.rr(ctx, x - 6, y - 6, w + 12, h + 12, 16); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.translate(x + w / 2, y + 95); var sc = 1 + bounce * 0.12 - (hit.pressed ? 0.06 : 0); ctx.scale(sc, sc); ctx.rotate(Math.sin(bounce * 12) * 0.08 * bounce);
      drawTierObject(ctx, k, v);
      ctx.restore();
      // 三段吸附刻度
      for (var j = 0; j < 3; j++) {
        var px = x + 50 + j * 60;
        U.hit('tier_' + k + '_' + j, px - 26, y + 180, 52, 44, { label: TIERS[k].names[j], onTap: (function (jj) { return function () { self.setTier(k, jj); }; })(j), minSize: 48 });
        ctx.fillStyle = j === v ? '#ffd45a' : 'rgba(255,248,232,.35)'; ctx.beginPath(); ctx.arc(px, y + 196, j === v ? 11 : 8, 0, 7); ctx.fill();
      }
      U.text(ctx, TIERS[k].names[v], x + w / 2, y + 238, { size: 24, bold: true, align: 'center', color: '#fff8e8', stroke: '#4a2a12' });
    });
    // 价位与菜品错配提示
    // 菜单托盘
    var avail = Run.availableDishes(s), size = Run.menuSize(s);
    U.panel(ctx, 820, 96, 440, 380, 'paper');
    U.text(ctx, '今日菜单 ' + s.menu.length + '/' + size, 846, 136, { size: 24, bold: true });
    for (var m = 0; m < size; m++) {
      var mx = 846 + m * (size === 5 ? 78 : 96), my = 150, id = s.menu[m];
      ctx.fillStyle = 'rgba(122,90,53,.15)'; U.rr(ctx, mx, my, size === 5 ? 72 : 88, 100, 10); ctx.fill();
      if (id) {
        var d = D.byId[id];
        U.hit('menu_' + id, mx, my, size === 5 ? 72 : 88, 100, { label: '撤下' + d.name, onTap: (function (dd) { return function () { if (self.app.dispatch({ t: 'dish', id: dd })) Au.play('tap'); }; })(id) });
        A.food(ctx, id, mx + 6, my + 2, size === 5 ? 60 : 76);
        var price = Math.round(d.price * C.price.mult[s.price]);
        U.text(ctx, price + '元', mx + (size === 5 ? 36 : 44), my + 94, { size: 20, bold: true, align: 'center', color: '#b8432f' });
        if (d.fit[s.material] < 0.9) { ctx.fillStyle = '#b8432f'; ctx.beginPath(); ctx.arc(mx + 10, my + 10, 9, 0, 7); ctx.fill(); U.text(ctx, '!', mx + 10, my + 16, { size: 16, bold: true, align: 'center', color: '#fff' }); }
      }
    }
    // 可选菜
    var cols = 6, tw = 64;
    avail.forEach(function (d, i) {
      var tx = 846 + (i % cols) * (tw + 4), ty = 268 + Math.floor(i / cols) * (tw + 6), on = s.menu.indexOf(d.id) >= 0;
      var st = U.hit('dish_' + d.id, tx, ty, tw, tw, { label: d.name, onTap: function () { if (self.app.dispatch({ t: 'dish', id: d.id })) Au.play(on ? 'tap' : 'pickup'); else Au.play('wrong'); }, minSize: 56 });
      ctx.save(); ctx.fillStyle = on ? 'rgba(232,181,74,.6)' : st.pressed ? 'rgba(122,90,53,.3)' : 'rgba(255,255,255,.5)'; U.rr(ctx, tx, ty, tw, tw, 8); ctx.fill(); ctx.restore();
      A.food(ctx, d.id, tx + 4, ty + 2, tw - 8, { alpha: on ? 0.45 : 1 });
      if (!s.prof[d.id].n) { ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(tx + tw - 8, ty + 8, 7, 0, 7); ctx.fill(); }
    });
    U.text(ctx, '点菜上牌 · 绿点为新菜', 846, 462, { size: 16, color: '#8d7a60' });
    // 预计：图标为主
    U.panel(ctx, 820, 486, 440, 150, 'cream');
    // 客流：小人剪影数量
    var people = Math.round((q.flowLow + q.flowHigh) / 2 / 8);
    for (var p = 0; p < Math.min(10, people); p++) { ctx.fillStyle = '#5b6e8c'; ctx.beginPath(); ctx.arc(850 + p * 22, 512, 7, 0, 7); ctx.fill(); ctx.fillRect(844 + p * 22, 520, 12, 18); }
    U.text(ctx, q.flowLow + '–' + q.flowHigh + '人', 1240, 534, { size: 20, align: 'right', bold: true });
    // 单份毛利：钱袋
    A.cell(ctx, 'atlas_ui', 12, 840, 548, 36, 36, { trim: true, fit: true, anchor: 'center' });
    U.text(ctx, '每份约赚 ' + (Math.round(q.margin * 10) / 10) + ' 元', 884, 574, { size: 20, bold: true, color: q.margin < 2 ? '#b8432f' : '#3b2a1a' });
    U.text(ctx, '最多做 ' + q.cap + ' 份', 1240, 574, { size: 18, align: 'right', color: '#7d5a35' });
    // 风险倾向（不显示精确烧心）
    if (q.risk) { A.cell(ctx, 'atlas_ui', 14, 840, 590, 36, 36, { trim: true, fit: true, anchor: 'center' }); U.text(ctx, q.risk > 1 ? '油已用了好几天' : '油会越用越旧', 884, 616, { size: 18, color: '#b8432f' }); }
    else { var likely = Run.likelyVisitors(s); U.text(ctx, '可能来：', 840, 616, { size: 18, color: '#7d5a35' }); likely.forEach(function (id, i) { ctx.save(); ctx.beginPath(); ctx.arc(940 + i * 46, 608, 20, 0, 7); ctx.clip(); Act.portrait(ctx, id, 920 + i * 46, 588, 40); ctx.restore(); }); }
    // 开门 / 沿用昨日
    if (s.history.length && s.day >= 7) U.button(ctx, 'prep_yesterday', 820, 650, 170, 58, '沿用昨日', { kind: 'paper', size: 22, onTap: function () { self.app.dispatch({ t: 'yesterday' }); Au.play('knob'); } });
    if (s.day >= 2 || s.mode === 'week') U.button(ctx, 'prep_shop', 70, 664 - 0, 230, 48, '升级小馆 ' + s.upgrades.length + '/' + C.upgrades.length, { kind: 'wood', size: 20, onTap: function () { self.app.openOverlay(Shop); } });
    U.button(ctx, 'prep_open', 1010, 650, 250, 60, '开门营业', { size: 28, disabled: !s.menu.length || this.tutorial >= 0 && this.tutorial < 3, onTap: function () { Au.play('open'); self.app.dispatch({ t: 'confirmPrep' }); self.app.route(); } });
    if (this.tutorial >= 0 && this.tutorial < 3) U.text(ctx, ['先看看油壶', '再看看食材篮', '最后定价牌'][this.tutorial], 70 + this.tutorial * 250 + 110, 396, { size: 22, bold: true, align: 'center', color: '#ffe28a', stroke: '#4a2a12' });
  };
  function drawTierObject(ctx, k, v) {
    if (k === 'oil') {
      if (v === 0) { ctx.fillStyle = '#5a4020'; U.rr(ctx, -40, -60, 80, 110, 14); ctx.fill(); ctx.fillStyle = '#3a2810'; ctx.fillRect(-14, -78, 28, 22); ctx.fillStyle = 'rgba(160,110,40,.8)'; ctx.fillRect(-32, -10, 64, 52); }
      else if (v === 1) A.cell(ctx, 'atlas_ui', 8, -70, -80, 140, 140, { trim: true, fit: true, anchor: 'center' });
      else { A.cell(ctx, 'atlas_ui', 8, -70, -80, 140, 140, { trim: true, fit: true, anchor: 'center' }); ctx.fillStyle = '#fff8e8'; ctx.fillRect(-26, -4, 52, 22); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-22, 0, 44, 4); ctx.fillRect(-22, 8, 30, 4); }
    } else if (k === 'material') {
      if (v === 0) { ctx.fillStyle = '#cfe6f2'; U.rr(ctx, -60, -46, 120, 90, 10); ctx.fill(); ctx.strokeStyle = '#7aa6c0'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#fff'; for (var i = 0; i < 4; i++) { ctx.fillRect(-40 + i * 24, -24, 4, 4); } }
      else A.cell(ctx, 'atlas_ui', 9, -72, -76, 144, 144, { trim: true, fit: true, anchor: 'center' });
      if (v === 2) { ctx.fillStyle = '#fff8e8'; ctx.save(); ctx.rotate(0.2); ctx.fillRect(14, -60, 42, 52); ctx.fillStyle = '#7d5a35'; for (var j = 0; j < 4; j++) ctx.fillRect(18, -52 + j * 10, 32, 3); ctx.restore(); }
    } else {
      ctx.save(); ctx.rotate(-0.1); A.cell(ctx, 'atlas_ui', 10, -80, -70, 160, 130, { trim: true, fit: true, anchor: 'center' }); ctx.restore();
      U.text(ctx, ['×0.85', '×1', '×1.25'][v], 0, 2, { size: 26, bold: true, align: 'center', color: ['#2f6f66', '#3b2a1a', '#b8432f'][v] });
    }
  }
  P.describe = function () {
    var s = this.app.state, q = Run.quote(s);
    return { tiers: { oil: s.oil, material: s.material, price: s.price }, menu: s.menu, menuSize: Run.menuSize(s), available: Run.availableDishes(s).map(function (d) { return d.id; }), quote: { flow: [q.flowLow, q.flowHigh], cap: q.cap, margin: Math.round(q.margin * 10) / 10, risk: q.risk }, tutorial: this.tutorial };
  };
  // 升级商店：钱花在看得见的地方
  function Shop(app) { this.name = 'shop'; this.app = app; }
  Shop.prototype.draw = function (ctx) {
    var app = this.app, s = app.state, self = this;
    ctx.fillStyle = 'rgba(20,14,8,.72)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 110, 50, 1060, 620, 'paper');
    U.text(ctx, '升级小馆', 640, 108, { size: 34, bold: true, align: 'center' });
    U.text(ctx, '钱匣 ' + Math.round(s.cash / 100) + ' 元', 1130, 108, { size: 22, bold: true, align: 'right', color: '#2f6f66' });
    C.upgrades.forEach(function (u, i) {
      var x = 150 + (i % 4) * 250, y = 140 + Math.floor(i / 4) * 230, own = s.upgrades.indexOf(u.id) >= 0, can = !own && s.cash >= u.cost;
      ctx.save(); ctx.fillStyle = own ? '#e6f4ea' : '#fff8e8'; U.rr(ctx, x, y, 230, 210, 12); ctx.fill(); ctx.strokeStyle = own ? '#2f6f66' : '#c8a878'; ctx.lineWidth = own ? 4 : 2; ctx.stroke(); ctx.restore();
      upIcon(ctx, u.id, x + 115, y + 58);
      U.text(ctx, u.name, x + 115, y + 118, { size: 24, bold: true, align: 'center' });
      U.para(ctx, u.desc, x + 16, y + 146, 198, { size: 16, color: '#7d5a35', lh: 21 });
      if (own) U.text(ctx, '已添置', x + 115, y + 198, { size: 20, bold: true, align: 'center', color: '#2f6f66' });
      else U.button(ctx, 'buy_' + u.id, x + 40, y + 168, 150, 38, u.cost / 100 + ' 元', { kind: can ? 'primary' : 'paper', size: 20, disabled: !can, minSize: 44, onTap: function () { if (app.dispatch({ t: 'buy', id: u.id })) { Au.play('coin'); Au.play('perfect'); app.notice('添置了 ' + u.name); } } });
    });
    U.button(ctx, 'shop_close', 540, 610, 200, 52, '好了', { onTap: function () { app.closeOverlay(); } });
  };
  Shop.prototype.describe = function () { return { owned: this.app.state.upgrades, cash: this.app.state.cash }; };
  function upIcon(ctx, id, x, y) {
    ctx.save(); ctx.translate(x, y);
    var I = { fire: [2, 'equipment'], tray: [7, 'equipment'], pot2: [1, 'equipment'], counter: [5, 'equipment'], sign: [10, 'ui'], board: [11, 'ui'], tables: [0, 'ui'], helper: [null] }[id];
    if (I && I[0] != null) A.cell(ctx, I[1] === 'ui' ? 'atlas_ui' : 'atlas_equipment', I[0], -50, -46, 100, 92, { trim: true, fit: true, anchor: 'center' });
    else Act.draw(ctx, 'helper', 0, 46, 100, { noShadow: true });
    if (id === 'fire') { ctx.fillStyle = 'rgba(255,120,30,.8)'; ctx.beginPath(); ctx.ellipse(0, 40, 30, 8, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  return { Prep: Prep, TIERS: TIERS, Shop: Shop };
});
