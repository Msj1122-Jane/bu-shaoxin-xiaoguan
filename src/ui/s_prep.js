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
    // 今日小目标 + 盘店基金（D042/D041）
    drawGoals(ctx, s, 430, 104);
    // 验货（D040）
    var dv = s.today.delivery;
    if (dv && dv.state === 'pending' && this.tutorial < 0) {
      if (!this.dlvShown) { this.dlvShown = true; self.app.openOverlay(Delivery); }
      U.button(ctx, 'prep_delivery', 310, 664, 200, 48, '送货待验', { kind: 'primary', size: 20, onTap: function () { self.app.openOverlay(Delivery); } });
    }
    if (this.tutorial >= 0 && this.tutorial < 3) U.text(ctx, ['先看看油壶', '再看看食材篮', '最后定价牌'][this.tutorial], 70 + this.tutorial * 250 + 110, 396, { size: 22, bold: true, align: 'center', color: '#ffe28a', stroke: '#4a2a12' });
  };
  function drawGoals(ctx, s, x, y) {
    var goals = s.today.goals || [], buy = s.mode === 'story' && !s.flags.owner && s.day <= C.buyout.day;
    if (!goals.length && !buy) return;
    var h = 36 + goals.length * 30 + (buy ? 46 : 0);
    U.panel(ctx, x, y, 370, h, 'paper', { alpha: 0.95 });
    U.text(ctx, goals.length ? '今日小目标' : '盘店基金', x + 18, y + 30, { size: 20, bold: true });
    if (goals.length) U.text(ctx, '每个 +' + C.goals.reward / 100 + ' 元，全中再 +' + C.goals.allBonus / 100, x + 352, y + 30, { size: 15, align: 'right', color: '#7d5a35' });
    goals.forEach(function (g, i) {
      var gy = y + 60 + i * 30;
      ctx.strokeStyle = g.id === 'nocheat' ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = 2; ctx.strokeRect(x + 20, gy - 15, 16, 16);
      if (g.done) U.text(ctx, '✓', x + 28, gy, { size: 18, bold: true, align: 'center', color: '#2f6f66' });
      U.text(ctx, g.label, x + 46, gy, { size: 18, color: g.id === 'nocheat' ? '#2f6f66' : '#3b2a1a', maxW: 310 });
    });
    if (buy) {
      var by = y + h - 26, k = Math.max(0, Math.min(1, s.cash / C.buyout.price));
      if (goals.length) U.text(ctx, '盘店基金', x + 20, by + 6, { size: 16, bold: true, color: '#7d5a35' });
      ctx.fillStyle = 'rgba(122,90,53,.2)'; U.rr(ctx, x + 96, by - 8, 190, 16, 8); ctx.fill();
      ctx.fillStyle = k >= 1 ? '#2f6f66' : '#e8b54a'; U.rr(ctx, x + 96, by - 8, Math.max(16, 190 * k), 16, 8); ctx.fill();
      U.text(ctx, Math.round(s.cash / 100) + '/' + C.buyout.price / 100, x + 352, by + 6, { size: 15, align: 'right', color: '#7d5a35' });
    }
  }
  // 验货：把试纸拖到货上，假货会变色（参考深空当铺色卡鉴定）
  function Delivery(app) { this.name = 'delivery'; this.app = app; this.t = 0; this.strip = { x: 300, y: 470, drag: false }; this.tested = false; this.done = null; }
  var DP = Delivery.prototype;
  DP.update = function (dt) { this.t += dt; if (this.done && (this.t - this.done.t > 1.8)) this.app.closeOverlay(); };
  DP.draw = function (ctx) {
    var app = this.app, s = app.state, self = this, dv = s.today.delivery;
    if (!dv) { app.closeOverlay(); return; }
    var it = C.delivery.items.filter(function (x) { return x.id === dv.item; })[0];
    ctx.fillStyle = 'rgba(20,14,8,.72)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 160, 60, 960, 600, 'paper');
    U.text(ctx, '送货上门', 640, 112, { size: 32, bold: true, align: 'center' });
    Act.draw(ctx, 'supplier', 300, 380, 230, { t: this.t, noShadow: true });
    ctx.fillStyle = '#fff'; U.rr(ctx, 390, 150, 420, 64, 14); ctx.fill();
    U.text(ctx, '“' + it.name + '，老板，这批便宜点。”', 410, 190, { size: 22, maxW: 390 });
    // 货
    var gx = 700, gy = 340;
    ctx.save(); ctx.translate(gx, gy); drawGoods(ctx, dv.item, dv.fake && this.tested); ctx.restore();
    // 试纸
    var tint = !this.tested ? '#e8e0a0' : dv.fake ? '#8a2a5a' : '#c8d880';
    var sx = this.strip.x, sy = this.strip.y;
    if (!this.done) {
      U.hit('strip', sx - 30, sy - 70, 60, 140, { label: '试纸', minSize: 56, onDown: function (x0, y0) {
        self.strip.drag = true; Au.play('pickup');
        return function (type, x2, y2) {
          self.strip.x = x2; self.strip.y = y2;
          if (type === 'up') { self.strip.drag = false; if (Math.hypot(x2 - gx, y2 - gy) < 140) { self.tested = true; Au.play(dv.fake ? 'wrong' : 'perfect'); app.P.vibrate(dv.fake ? 'heavy' : 'light'); } self.strip.x = 300; self.strip.y = 470; }
        };
      } });
    }
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(this.strip.drag ? 0.15 : 0);
    ctx.fillStyle = '#f6efe0'; ctx.fillRect(-18, -64, 36, 128); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2; ctx.strokeRect(-18, -64, 36, 128);
    ctx.fillStyle = tint; ctx.fillRect(-14, 10, 28, 46); ctx.restore();
    if (!this.tested && !this.done) U.text(ctx, '把试纸拖到货上验一验', 300, 590, { size: 20, align: 'center', color: '#7d5a35' });
    if (this.tested) U.text(ctx, dv.fake ? '试纸变紫了——有问题！' : '颜色正常，是好货', gx, 540, { size: 26, bold: true, align: 'center', color: dv.fake ? '#b8432f' : '#2f6f66' });
    if (this.done) { U.para(ctx, this.done.text, 640, 590, 760, { size: 22, align: 'center', color: '#3b2a1a' }); return; }
    var save = it.save / 100;
    U.button(ctx, 'dlv_accept', 520, 580, 220, 58, '收下', { kind: 'paper', size: 24, onTap: function () { self.finish(true); } });
    U.button(ctx, 'dlv_reject', 760, 580, 220, 58, '退货', { kind: 'primary', size: 24, onTap: function () { self.finish(false); } });
    if (!this.tested) U.text(ctx, '收下能省 ' + save + ' 元', 630, 656, { size: 16, align: 'center', color: '#8d7a60' });
  };
  DP.finish = function (accept) {
    var app = this.app, dv = app.state.today.delivery, fake = dv.fake;
    if (!app.dispatch({ t: 'delivery', accept: accept, tested: this.tested })) { app.closeOverlay(); return; }
    Au.play(accept ? 'coin' : 'page');
    var it = C.delivery.items.filter(function (x) { return x.id === dv.item; })[0];
    var text = accept && fake ? (this.tested ? '省了 ' + it.save / 100 + ' 元。门口的灯笼，暗了一点。' : '收下了。没人知道这批货有问题——至少现在没人知道。') : !accept && fake ? '假货当场退回。街坊听说了，都说老周眼尖。' : accept ? '好货，收下。' : '货其实没问题，白搭了 3 元运费。';
    this.done = { t: this.t, text: text };
  };
  DP.describe = function () { var dv = this.app.state.today.delivery; return { item: dv && dv.item, tested: this.tested, fake: this.tested ? dv.fake : undefined, done: !!this.done, strip: { x: 300, y: 470 }, target: { x: 700, y: 340 } }; };
  function drawGoods(ctx, id, bad) {
    if (id === 'oil') { A.cell(ctx, 'atlas_ui', 8, -90, -100, 180, 180, { trim: true, fit: true, anchor: 'center' }); if (bad) { ctx.fillStyle = 'rgba(90,40,10,.45)'; U.rr(ctx, -40, -20, 80, 90, 10); ctx.fill(); } }
    else if (id === 'egg') {
      ctx.fillStyle = '#c8a070'; ctx.fillRect(-110, -10, 220, 90); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 4; ctx.strokeRect(-110, -10, 220, 90);
      for (var i = 0; i < 6; i++) { ctx.fillStyle = bad ? '#e8dcc8' : '#f4e2c4'; ctx.beginPath(); ctx.ellipse(-80 + i * 32, -16, 14, 18, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#b89a70'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#b8432f'; ctx.fillRect(-60, 20, 120, 34); U.text(ctx, '土鸡蛋', 0, 46, { size: 22, bold: true, align: 'center', color: '#fff3d6' });
    } else {
      ctx.fillStyle = '#efe6d2'; U.rr(ctx, -80, -90, 160, 180, 24); ctx.fill(); ctx.strokeStyle = '#a89070'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#2f6f66'; ctx.fillRect(-50, -20, 100, 40); U.text(ctx, '面粉', 0, 10, { size: 24, bold: true, align: 'center', color: '#fff' });
      if (bad) { ctx.fillStyle = 'rgba(120,120,60,.35)'; ctx.beginPath(); ctx.arc(30, 50, 18, 0, 7); ctx.fill(); }
    }
  }
  function drawTierObject(ctx, k, v) {
    if (k === 'oil') {
      if (v === 0) { A.cell(ctx, 'atlas_ui', 8, -70, -80, 140, 140, { trim: true, fit: true, anchor: 'center' }); ctx.fillStyle = 'rgba(70,40,10,.55)'; U.rr(ctx, -34, -22, 68, 78, 10); ctx.fill(); ctx.fillStyle = '#d8c8a0'; ctx.save(); ctx.rotate(-0.12); ctx.fillRect(-30, -6, 60, 20); ctx.restore(); U.text(ctx, '回收', 0, 10, { size: 16, bold: true, align: 'center', color: '#5a3418' }); }
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
    U.panel(ctx, 90, 30, 1100, 660, 'paper');
    U.text(ctx, '升级小馆', 640, 80, { size: 32, bold: true, align: 'center' });
    U.text(ctx, '钱匣 ' + Math.round(s.cash / 100) + ' 元', 1160, 80, { size: 22, bold: true, align: 'right', color: '#2f6f66' });
    C.upgrades.forEach(function (u, i) {
      var cw = 200, ch = 262, x = 120 + (i % 5) * 210, y = 100 + Math.floor(i / 5) * 272, own = s.upgrades.indexOf(u.id) >= 0, can = !own && s.cash >= u.cost;
      ctx.save(); ctx.fillStyle = own ? '#e6f4ea' : '#fff8e8'; U.rr(ctx, x, y, cw, ch, 12); ctx.fill(); ctx.strokeStyle = own ? '#2f6f66' : '#c8a878'; ctx.lineWidth = own ? 4 : 2; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x + cw / 2, y + 54); ctx.scale(0.8, 0.8); upIcon(ctx, u.id, 0, 0); ctx.restore();
      if (u.passive) { ctx.fillStyle = '#2f6f66'; U.rr(ctx, x + 8, y + 8, 64, 24, 8); ctx.fill(); U.text(ctx, '夜间进账', x + 40, y + 26, { size: 13, bold: true, align: 'center', color: '#fff' }); }
      U.text(ctx, u.name, x + cw / 2, y + 122, { size: 22, bold: true, align: 'center', maxW: cw - 16 });
      U.para(ctx, u.desc, x + 12, y + 146, cw - 24, { size: 15, color: '#7d5a35', lh: 19, maxLines: 4 });
      if (own) U.text(ctx, '已添置', x + cw / 2, y + 246, { size: 20, bold: true, align: 'center', color: '#2f6f66' });
      else U.button(ctx, 'buy_' + u.id, x + 30, y + 216, cw - 60, 38, u.cost / 100 + ' 元', { kind: can ? 'primary' : 'paper', size: 20, disabled: !can, minSize: 44, onTap: function () { if (app.dispatch({ t: 'buy', id: u.id })) { Au.play('coin'); Au.play('perfect'); app.notice('添置了 ' + u.name); } } });
    });
    U.button(ctx, 'shop_close', 1010, 40, 160, 48, '好了', { onTap: function () { app.closeOverlay(); } });
  };
  Shop.prototype.describe = function () { return { owned: this.app.state.upgrades, cash: this.app.state.cash }; };
  function upIcon(ctx, id, x, y) {
    ctx.save(); ctx.translate(x, y);
    var I = { fire: [2, 'equipment'], tray: [7, 'equipment'], pot2: [1, 'equipment'], counter: [5, 'equipment'], sign: [10, 'ui'], board: [11, 'ui'], soymaker: [3, 'equipment'] }[id];
    if (I && I[0] != null) A.cell(ctx, I[1] === 'ui' ? 'atlas_ui' : 'atlas_equipment', I[0], -50, -46, 100, 92, { trim: true, fit: true, anchor: 'center' });
    else if (id === 'tables') { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-46, -14, 92, 12); ctx.fillStyle = '#6a4220'; ctx.fillRect(-40, -2, 8, 44); ctx.fillRect(32, -2, 8, 44); ctx.fillStyle = '#a87040'; ctx.fillRect(-46, -18, 92, 6); ctx.fillStyle = '#7a4a22'; ctx.fillRect(-62, 14, 22, 8); ctx.fillRect(40, 14, 22, 8); ctx.fillRect(-58, 22, 4, 20); ctx.fillRect(54, 22, 4, 20); }
    else if (id === 'preorder') { ctx.fillStyle = '#2a3a32'; ctx.fillRect(-48, -40, 96, 72); ctx.strokeStyle = '#a87040'; ctx.lineWidth = 6; ctx.strokeRect(-48, -40, 96, 72); ctx.fillStyle = '#f0f0e8'; for (var i = 0; i < 4; i++) ctx.fillRect(-36, -28 + i * 15, 50 + (i % 2) * 18, 4); }
    else Act.draw(ctx, 'helper', 0, 46, 100, { noShadow: true });
    if (id === 'fire') { ctx.fillStyle = 'rgba(255,120,30,.8)'; ctx.beginPath(); ctx.ellipse(0, 40, 30, 8, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  return { Prep: Prep, TIERS: TIERS, Shop: Shop, Delivery: Delivery, drawGoals: drawGoals };
});
