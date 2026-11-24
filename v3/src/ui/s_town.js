// 下午：柳河街的地图。收了摊，老周能出门半天——去一个地方。
// 批发市场（验货小游戏）· 7 路总站（接明早的包餐）· 街坊家（串门，看常客不在店里的样子）· 桥头（听明天的天气）· 回店练手。
BSX.define('ui/s_town', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var T = require('core/town');
  var Tn = require('content/town');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var INK = '#3b2a1a', MUTE = '#8d7a60', RED = '#b8432f', TEAL = '#2f6f66';

  function Town(app) {
    var s = app.state;
    this.app = app; this.name = 'town'; this.pausable = true; this.s = s; this.t = 0; this.mt = 0; this.mode = 'map'; this.sel = null;
    this.list = T.places(s);
    var first = this.list.filter(function (p) { return !p.why && p.id !== 'home'; })[0]; this.sel = first ? first.id : 'home';
    Fx.reset(); Shop.reset('day', s.today.weather);
    Au.setScene({ place: 'street', rain: s.today.weather === 'rain' ? 0.6 : 0, crowd: 0.2, dawn: 1, music: 'close' });
    this.walkers = []; for (var i = 0; i < 3; i++) this.walkers.push(this.walker(true));
  }
  var P = Town.prototype;
  P.walker = function (any) { var dir = Math.random() < 0.5 ? 1 : -1, arch = ['office', 'elder', 'student', 'worker', 'parent'][Math.floor(Math.random() * 5)]; return { x: any ? 200 + Math.random() * 900 : (dir > 0 ? -60 : 1340), y: 560 + Math.random() * 60, dir: dir, v: 26 + Math.random() * 20, arch: arch, seed: Math.floor(Math.random() * 1e6), ph: Math.random() * 6 }; };
  P.setMode = function (m) { this.mode = m; this.mt = 0; };
  P.update = function (dt) {
    var self = this; this.t += dt; this.mt += dt;
    this.walkers.forEach(function (w, i) { w.x += w.dir * w.v * dt; if (w.x < -80 || w.x > 1360) self.walkers[i] = self.walker(false); });
    if (Math.random() < dt * 0.15) Au.play('sparrow', { vol: 0.3 });
  };
  P.finish = function (kind, info) { var app = this.app, s = this.s; T.done(s, kind, info); app.save(); app.route(true); };

  // ───────── 绘制
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, t = this.t;
    Shop.drawPlace(ctx, 'bg_street', t, { tint: s.today.weather === 'rain' ? 'rgb(200,210,222)' : 'rgb(255,232,200)' });
    // 街上走的人
    this.walkers.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (w) { People.draw(ctx, 'walk', w.x, w.y, 150, { look: { arch: w.arch, seed: w.seed }, flip: w.dir < 0, bob: Math.abs(Math.sin(self.t * 7 + w.ph)) * -3 }); });
    if (s.today.weather === 'rain' && !Fx.lowFx) { ctx.save(); ctx.strokeStyle = 'rgba(220,232,245,.35)'; ctx.lineWidth = 1.5; for (var r = 0; r < 70; r++) { var rx = (r * 97 + t * 420) % 1320 - 20, ry = (r * 53 + t * 900) % 760 - 20; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); ctx.stroke(); } ctx.restore(); }
    var g = ctx.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, 'rgba(24,14,6,.55)'); g.addColorStop(1, 'rgba(24,14,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 120);
    K.dayChip(ctx, s, 14, 12, t);
    U.text(ctx, '下午 · 出门走走', 198, 40, { size: 26, bold: true, kai: true, color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 5 });
    U.text(ctx, '收了摊，还有半天。只够去一个地方。', 199, 66, { size: 16, color: '#f4e4c4', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    // 右上：木牌挂钟和零钱盒
    ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, 1062, 14, 206, 64, 10); ctx.fill();
    ctx.fillStyle = '#c98a4e'; U.rr(ctx, 1058, 8, 206, 64, 10); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 3; ctx.stroke();
    K.tin(ctx, 1100, 38, s.cash, 0);
    if (this.mode === 'map') this.drawMap(ctx);
    else if (this.mode === 'market') this.drawMarket(ctx);
    else if (this.mode === 'depot') this.drawDepot(ctx);
    else if (this.mode === 'visit') this.drawVisit(ctx);
    else if (this.mode === 'result') this.drawResult(ctx);
  };

  P.drawMap = function (ctx) {
    var self = this, t = this.t, s = this.s;
    this.list.forEach(function (p, i) {
      var on = self.sel === p.id, off = !!p.why, bob = Math.sin(t * 2.4 + i) * 4 * (off ? 0 : 1), x = p.x, y = p.y + bob;
      var st = U.hit('pl_' + p.id, x - 46, y - 92, 92, 120, { onTap: function () { self.sel = p.id; Au.play('page'); }, label: p.name });
      ctx.save(); if (off) ctx.globalAlpha *= 0.55;
      ctx.fillStyle = 'rgba(20,12,6,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, 20, 7, 0, 0, 7); ctx.fill();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, x, y - 46, 70, '255,220,140', 0.45); ctx.restore(); }
      // 图钉：圆头＋尖
      ctx.fillStyle = on ? RED : off ? '#8d8370' : TEAL;
      ctx.beginPath(); ctx.moveTo(x - 13, y - 34); ctx.lineTo(x, y); ctx.lineTo(x + 13, y - 34); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 50, 27 * (st.pressed ? 0.94 : 1), 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 3.5; ctx.stroke();
      U.text(ctx, p.mark, x, y - 41, { size: 26, bold: true, kai: true, align: 'center', color: '#fff8e8' });
      ctx.font = U.font(17, 'bold'); var nw = ctx.measureText(p.name).width + 22;
      ctx.fillStyle = on ? '#fff3d6' : 'rgba(255,248,232,.9)'; U.rr(ctx, x - nw / 2, y + 12, nw, 28, 8); ctx.fill(); ctx.strokeStyle = on ? RED : '#7d5a35'; ctx.lineWidth = 2; ctx.stroke();
      U.text(ctx, p.name, x, y + 32, { size: 17, bold: true, align: 'center', color: INK });
      ctx.restore();
    });
    // 选中地点的说明卡（盖住右下角）
    var p = this.list.filter(function (q) { return q.id === self.sel; })[0]; if (!p) return;
    var x = 868, y = 478, w = 392, h = 226;
    K.paper(ctx, x, y, w, h, { pin: RED });
    U.text(ctx, p.name, x + 28, y + 50, { size: 30, bold: true, kai: true, color: INK });
    U.para(ctx, p.desc, x + 28, y + 84, w - 56, { size: 17, lh: 25, color: INK });
    if (p.why) U.text(ctx, p.why, x + 28, y + h - 30, { size: 18, bold: true, color: RED });
    else K.tag(ctx, 'go', x + w - 28 - 170, y + h - 70, 170, 52, p.id === 'home' ? '回店' : '就去这儿', { kind: 'teal', size: 22, onTap: function () { self.go(self.sel); } });
    if (!p.why && p.id !== 'home') K.tag(ctx, 'go_home', x + 28, y + h - 64, 130, 44, '不去了', { kind: 'paper', size: 18, onTap: function () { self.go('home'); } });
  };
  P.go = function (id) {
    var s = this.s;
    Au.play('page');
    if (id === 'market') { this.lots = T.lots(s); this.looks = 2; this.seen = this.lots.map(function () { return [false, false, false]; }); this.take = this.lots.map(function () { return false; }); this.setMode('market'); }
    else if (id === 'depot') { this.offers = T.offers(s); this.setMode('depot'); }
    else if (id === 'visit') { this.vis = T.visitable(s); this.setMode('visit'); }
    else if (id === 'bridge') { var b = T.bridge(s); this.res = { title: '桥头', kind: 'bridge', w: b.w, lines: [b.river, b.text] }; this.setMode('result'); }
    else { var r = T.practice(s); this.res = { title: '回店练手', kind: 'home', lines: ['我把卷帘门拉下一半，一个人对着' + r.name + '练了一下午。', r.name + '的手感又熟了一点。'] }; this.setMode('result'); }
  };

  // ───────── 批发市场：验货
  function drawGoods(ctx, item, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    if (item === 'oil') A.cell(ctx, 'atlas_ui', 8, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    else if (item === 'meat') A.cell(ctx, 'atlas_ui', 9, -s / 2, -s / 2, s, s, { trim: true, fit: true, anchor: 'center' });
    else if (item === 'veg') { [['#3f7a3a', -26, -14], ['#5a9a4a', 22, -12], ['#4f8a4b', -6, -22], ['#6aa85a', 8, -6], ['#3f7a3a', -18, 0]].forEach(function (q) { ctx.fillStyle = q[0]; ctx.beginPath(); ctx.ellipse(q[1] * s / 110, q[2] * s / 110, s * 0.17, s * 0.12, q[1] * 0.02, 0, 7); ctx.fill(); ctx.fillStyle = '#e8f0d0'; ctx.fillRect(q[1] * s / 110 - 2, q[2] * s / 110 - 2, 4, s * 0.1); }); ctx.fillStyle = '#b8823a'; U.rr(ctx, -s * 0.42, 0, s * 0.84, s * 0.34, 8); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(90,50,20,.45)'; ctx.lineWidth = 2; for (var vv = 1; vv < 6; vv++) { ctx.beginPath(); ctx.moveTo(-s * 0.42 + vv * s * 0.14, 2); ctx.lineTo(-s * 0.42 + vv * s * 0.14, s * 0.33); ctx.stroke(); } }
    else if (item === 'eggs') { ctx.fillStyle = '#b8823a'; U.rr(ctx, -s * 0.42, -s * 0.12, s * 0.84, s * 0.4, 6); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 3; ctx.stroke(); for (var i = 0; i < 4; i++) { ctx.fillStyle = '#f6ead2'; ctx.beginPath(); ctx.ellipse(-s * 0.3 + i * s * 0.2, -s * 0.14, s * 0.08, s * 0.1, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8b08a'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    else { ctx.fillStyle = '#c8a46a'; ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.36); ctx.quadraticCurveTo(-s * 0.44, -s * 0.1, -s * 0.22, -s * 0.3); ctx.lineTo(s * 0.22, -s * 0.3); ctx.quadraticCurveTo(s * 0.44, -s * 0.1, s * 0.32, s * 0.36); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-s * 0.22, -s * 0.34, s * 0.44, s * 0.08); ctx.fillStyle = item === 'beans' ? '#e0c060' : '#f4f0e2'; ctx.beginPath(); ctx.ellipse(0, -s * 0.26, s * 0.18, s * 0.06, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,20,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 0.2, 0); ctx.moveTo(-s * 0.18, s * 0.16); ctx.lineTo(s * 0.18, s * 0.16); ctx.stroke(); }
    ctx.restore();
  }
  P.drawMarket = function (ctx) {
    var self = this, s = this.s, k = Fx.ease.out3(Math.min(1, this.mt * 3));
    K.dim(ctx, 0.5 * k);
    ctx.save(); ctx.globalAlpha *= k;
    // 木台面
    ctx.fillStyle = '#8f5a2c'; ctx.fillRect(0, 560, 1280, 160); ctx.fillStyle = '#c98a4e'; ctx.fillRect(0, 556, 1280, 8);
    U.text(ctx, '批发市场 · 验货', 640, 122, { size: 34, bold: true, kai: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 6 });
    U.text(ctx, '还能细看 ' + this.looks + ' 次。看过的会写在牌子上；看不准的，自己掂量。', 640, 154, { size: 18, align: 'center', color: '#f4e4c4', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    var total = 0;
    this.lots.forEach(function (l, i) {
      var x = 100 + i * 370, y = 180, w = 340, h = 400, g = Tn.goods[l.item], sel = Tn.sellers[l.seller], tk = self.take[i];
      if (tk) total += l.price;
      ctx.fillStyle = 'rgba(20,12,6,.35)'; U.rr(ctx, x + 4, y + 8, w, h, 12); ctx.fill();
      ctx.fillStyle = tk ? '#fff6d8' : '#fbf5e4'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = tk ? '#2f6f66' : '#7d5a35'; ctx.lineWidth = tk ? 5 : 3; ctx.stroke();
      ctx.fillStyle = l.seller === 'qin' ? '#4f8a4b' : l.seller === 'hu' ? '#3f6a8a' : '#8a6a4a'; U.rr(ctx, x, y, w, 36, { 0: 12 }[0]); ctx.fill();
      U.text(ctx, sel.name, x + 16, y + 25, { size: 18, bold: true, color: '#fff8e8' });
      drawGoods(ctx, l.item, x + 84, y + 100, 110);
      U.text(ctx, g.name, x + 160, y + 86, { size: 24, bold: true, kai: true, color: INK });
      U.text(ctx, '抵明天进货 ' + K.yuan(l.v), x + 160, y + 114, { size: 15, color: MUTE });
      // 价签
      ctx.save(); ctx.translate(x + 230, y + 142); ctx.rotate(-0.06); ctx.fillStyle = '#f2d27a'; U.rr(ctx, -46, -18, 104, 36, 6); ctx.fill(); ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, K.yuan(l.price), 6, 8, { size: 22, bold: true, align: 'center', color: '#5a3a10' }); ctx.restore();
      // 三样细看
      Tn.tools.forEach(function (tl, j) {
        var bx = x + 14 + j * 106, by = y + 178, seen = self.seen[i][j];
        K.tag(ctx, 'look_' + i + '_' + j, bx, by, 98, 40, tl.name, { kind: seen ? 'teal' : 'paper', size: 17, disabled: !seen && self.looks <= 0, onTap: function () { if (self.seen[i][j] || self.looks <= 0) return; self.seen[i][j] = true; self.looks--; Au.play('page'); } });
      });
      var yy = y + 248;
      self.seen[i].forEach(function (sn, j) { if (!sn) return; var c = T.clue(l, j); yy += U.para(ctx, '· ' + c, x + 16, yy, w - 32, { size: 16, lh: 22, color: INK }) + 4; });
      if (!self.seen[i].some(Boolean)) U.para(ctx, sel.line, x + 16, yy, w - 32, { size: 15, lh: 21, color: MUTE });
      K.tag(ctx, 'take_' + i, x + 14, y + h - 60, w - 28, 46, tk ? '收下了（再点退回）' : '收下', { kind: tk ? 'teal' : 'wood', size: 20, onTap: function () { self.take[i] = !self.take[i]; Au.play(self.take[i] ? 'coin' : 'page'); } });
    });
    U.text(ctx, '一共 ' + K.yuan(total), 400, 650, { size: 26, bold: true, color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 5 });
    K.tag(ctx, 'pay', 840, 618, 230, 58, total ? '付钱，回店' : '一样都不要', { kind: 'teal', size: 22, disabled: total > Math.max(0, s.cash), onTap: function () { self.pay(); } });
    K.tag(ctx, 'mk_back', 1090, 618, 150, 58, '换个地方', { kind: 'paper', size: 19, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.pay = function () {
    var s = this.s, ls = this.lots, picks = this.take, p = T.buy(s, ls, picks), n = picks.filter(Boolean).length;
    if (n) Au.play('coin');
    this.res = { title: '批发市场', kind: 'market', lines: n ? ['付了 ' + K.yuan(p.spent) + '，收了 ' + n + ' 样。明早进货能抵 ' + K.yuan(p.credit) + '。', '货好不好，明天开箱就知道了。'] : ['转了一圈，一样没收。', '老胡在后面喊：兄弟，下回来早点！'] };
    this.setMode('result');
  };

  // ───────── 7 路总站：包餐
  P.drawDepot = function (ctx) {
    var self = this, k = Fx.ease.out3(Math.min(1, this.mt * 3));
    K.dim(ctx, 0.5 * k); ctx.save(); ctx.globalAlpha *= k;
    U.text(ctx, '7 路总站 · 明早的包餐', 640, 140, { size: 34, bold: true, kai: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 6 });
    U.text(ctx, '接了，开门前先交货，钱当场结。交不齐，丢人，也丢客。', 640, 172, { size: 18, align: 'center', color: '#f4e4c4', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    var n = this.offers.length, w = 440, gap = 40, x0 = 640 - (n * w + (n - 1) * gap) / 2;
    this.offers.forEach(function (o, i) {
      var x = x0 + i * (w + gap), y = 206, h = 360, d = D.byId[o.dish];
      K.paper(ctx, x, y, w, h, { pin: RED });
      U.text(ctx, o.who, x + 30, y + 54, { size: 28, bold: true, kai: true, color: INK });
      if (o.from) { ctx.save(); U.rr(ctx, x + w - 96, y + 18, 70, 70, 8); ctx.clip(); People.portrait(ctx, o.from, x + w - 96, y + 18, 70, {}); ctx.restore(); }
      U.para(ctx, '"' + o.line.replace(/^[^：]*：/, '') + '"', x + 30, y + 98, w - 60, { size: 17, lh: 25, color: INK, kai: true, bold: true });
      A.food(ctx, o.dish, x + 30, y + 190, 80, {});
      U.text(ctx, d.name + ' × ' + o.n, x + 124, y + 226, { size: 24, bold: true, color: INK });
      U.text(ctx, '每份 ' + K.yuan(o.unit) + '（牌价 ' + K.yuan(Run.price(self.s, o.dish)) + '）', x + 124, y + 254, { size: 16, color: MUTE });
      U.text(ctx, '交齐收 ' + K.yuan(o.unit * o.n), x + 30, y + 300, { size: 22, bold: true, color: TEAL });
      K.tag(ctx, 'acc_' + i, x + w - 30 - 160, y + h - 72, 160, 52, '接下', { kind: 'teal', size: 22, onTap: function () { T.accept(self.s, o); Au.play('stamp'); self.res = { title: '7 路总站', kind: 'depot', lines: ['接了' + o.who + '的单：明早 ' + o.n + ' 份' + d.name + '。', '晨备的时候会多备出来。记得开门前，灶上先把这一批做好。'] }; self.setMode('result'); } });
    });
    K.tag(ctx, 'dp_skip', 640 - 260, 610, 240, 56, '都不接，回店', { kind: 'paper', size: 20, onTap: function () { self.res = { title: '7 路总站', kind: 'depot', lines: ['我在总站门口站了一会儿，看司机们交班。', '单子没接。明早照常。'] }; self.setMode('result'); } });
    K.tag(ctx, 'dp_back', 640 + 20, 610, 240, 56, '换个地方', { kind: 'wood', size: 20, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };

  // ───────── 串门
  P.drawVisit = function (ctx) {
    var self = this, app = this.app, s = this.s, k = Fx.ease.out3(Math.min(1, this.mt * 3));
    K.dim(ctx, 0.5 * k); ctx.save(); ctx.globalAlpha *= k;
    U.text(ctx, '去谁那儿坐坐', 640, 140, { size: 34, bold: true, kai: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.85)', strokeW: 6 });
    var n = this.vis.length, per = Math.min(4, n), w = 250, gap = 24, x0 = 640 - (per * w + (per - 1) * gap) / 2;
    this.vis.slice(0, 8).forEach(function (v, i) {
      var x = x0 + (i % 4) * (w + gap), y = 180 + Math.floor(i / 4) * 214, h = 196, r = Cast.regulars[v.id];
      var st = U.hit('vis_' + v.id, x, y, w, h, { onTap: function () { self.visit(v); }, label: r.name });
      ctx.fillStyle = 'rgba(20,12,6,.35)'; U.rr(ctx, x + 3, y + 6, w, h, 10); ctx.fill();
      ctx.fillStyle = st.hover ? '#fffaf0' : '#fbf5e4'; U.rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); U.rr(ctx, x + 12, y + 12, 96, 120, 8); ctx.fillStyle = '#ecdcb8'; ctx.fill(); ctx.clip(); A.cell(ctx, 'atlas_regulars', r.portrait, x + 12, y + 14, 96, 120, { trim: true, fit: true }); ctx.restore();
      U.text(ctx, r.name, x + 122, y + 46, { size: 24, bold: true, kai: true, color: INK });
      U.text(ctx, v.place, x + 122, y + 74, { size: 15, color: MUTE });
      U.text(ctx, '「' + v.scene.title + '」', x + 122, y + 104, { size: 17, bold: true, color: TEAL, maxW: w - 132 });
      var aff = s.reg[v.id].aff; for (var hh = 0; hh < 5; hh++) { ctx.fillStyle = aff >= (hh + 1) * 2 ? '#e06060' : 'rgba(120,90,50,.2)'; Fx.heart(ctx, x + 22 + hh * 20, y + 162, 7); }
      U.text(ctx, v.scene.tier ? '第二回' : '头一回', x + w - 16, y + 168, { size: 14, align: 'right', color: MUTE });
    });
    K.tag(ctx, 'vs_back', 640 - 120, 620, 240, 56, '换个地方', { kind: 'wood', size: 20, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.visit = function (v) {
    var app = this.app, s = this.s, Screens = require('ui/screens');
    Au.play('page');
    app.go(Screens.Scene, { ids: [v.scene.id], when: 'town', place: v.scene.place, done: function () { T.done(s, 'visit', v.id); app.save(); app.route(true); } }, true);
  };

  // ───────── 结果
  P.drawResult = function (ctx) {
    var self = this, r = this.res, k = Fx.ease.out3(Math.min(1, this.mt * 3)), x = 340, y = 190 + (1 - k) * 30, w = 600, h = 320;
    K.dim(ctx, 0.42 * k); ctx.save(); ctx.globalAlpha *= k;
    K.paper(ctx, x, y, w, h, { pin: RED, lines: 34, top: 110 });
    U.text(ctx, r.title, x + 40, y + 62, { size: 32, bold: true, kai: true, color: INK });
    if (r.w) K.weather(ctx, r.w, x + w - 70, y + 50, 44, this.t);
    var yy = y + 120; r.lines.forEach(function (l) { yy += U.para(ctx, l, x + 40, yy, w - 80, { size: 21, lh: 32, kai: true, bold: true, color: INK }) + 8; });
    K.tag(ctx, 'town_done', x + w - 40 - 220, y + h - 76, 220, 56, '回店算账', { kind: 'teal', size: 22, onTap: function () { self.finish(r.kind); } });
    ctx.restore();
  };
  P.key = function (k) { if (k === 'Escape' && this.mode !== 'map' && this.mode !== 'result') this.setMode('map'); };
  P.describe = function () { return { mode: this.mode, sel: this.sel, places: this.list.map(function (p) { return p.id + (p.why ? '×' : ''); }), looks: this.looks, take: this.take, offers: this.offers ? this.offers.map(function (o) { return o.id; }) : null, vis: this.vis ? this.vis.map(function (v) { return v.id; }) : null, res: this.res ? this.res.kind : null }; };
  return { Town: Town };
});
