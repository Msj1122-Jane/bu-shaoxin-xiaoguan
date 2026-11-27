// 下午：柳河街自由走动（V4 自由地图）。13:00 出门，19:30 前回店。
// 地图上 12 处地点；走路和做事都花时间；常客按作息出现在各自的地方；"!"＝有戏，"…"＝熟人在，"¥"＝有生意。
// 底图：有 Lovart 画好的 map_liuhe 就用它，没有就用程序画的示意地图。
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
  var INK = '#3b2a1a', MUTE = '#8d7a60', RED = '#b8432f', TEAL = '#2f6f66';
  var CARD = { x: 872, y: 418, w: 394, h: 288 };

  // ───────── 程序画的示意地图（缓存成一张画布）
  var mapCache = null;
  function buildMap() {
    var c = A.P.createCanvas(1280, 720), g = c.getContext('2d'), i;
    function rnd(n) { var x = Math.sin(n * 91.7) * 43758.5; return x - Math.floor(x); }
    g.fillStyle = '#efdcb4'; g.fillRect(0, 0, 1280, 720);
    for (i = 0; i < 900; i++) { g.fillStyle = 'rgba(160,120,60,' + (0.04 + rnd(i) * 0.05).toFixed(3) + ')'; g.fillRect(rnd(i + 3) * 1280, rnd(i + 7) * 720, 2, 2); }
    // 草地
    g.fillStyle = '#cfd59a'; [[120, 230, 90], [1180, 230, 80], [560, 640, 120], [940, 70, 70], [330, 120, 70]].forEach(function (q) { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[2] * 0.6, 0, 0, 7); g.fill(); });
    // 河
    g.fillStyle = '#5f9a8e'; g.beginPath(); g.moveTo(0, 440); g.bezierCurveTo(220, 405, 360, 470, 540, 450); g.bezierCurveTo(720, 430, 820, 392, 1000, 420); g.bezierCurveTo(1130, 440, 1210, 415, 1280, 408);
    g.lineTo(1280, 530); g.bezierCurveTo(1190, 538, 1110, 562, 1000, 545); g.bezierCurveTo(820, 522, 720, 560, 540, 570); g.bezierCurveTo(360, 580, 220, 530, 0, 562); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(220,240,232,.55)'; g.lineWidth = 3; [[80, 500], [300, 520], [700, 490], [960, 470], [1150, 478]].forEach(function (q) { g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[0] + 30, q[1] - 7, q[0] + 60, q[1]); g.stroke(); });
    g.strokeStyle = '#3f7a70'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 440); g.bezierCurveTo(220, 405, 360, 470, 540, 450); g.bezierCurveTo(720, 430, 820, 392, 1000, 420); g.bezierCurveTo(1130, 440, 1210, 415, 1280, 408); g.stroke();
    // 路
    function road(pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }
    var main = [[70, 372], [300, 362], [600, 368], [900, 350], [1250, 338]];
    road(main, 40, '#c9a46a'); road(main, 32, '#ead6ab');
    [[[425, 360], [425, 220], [660, 200], [930, 150]], [[175, 365], [175, 230]], [[1015, 345], [1015, 268]], [[930, 350], [930, 150]], [[80, 640], [400, 628], [700, 650], [1100, 640]], [[355, 560], [355, 630]], [[690, 560], [700, 640]]].forEach(function (r) { road(r, 20, '#dcc497'); road(r, 14, '#ebdab4'); });
    // 房子
    function house(x, y, w, h, roof) { g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(x + 4, y + 6, w, h); g.fillStyle = '#e9d9bc'; g.fillRect(x, y, w, h); g.fillStyle = roof || '#3f6a62'; g.fillRect(x - 4, y - 10, w + 8, 14); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 4, y + 2, w + 8, 3); g.fillStyle = '#8a5a2c'; g.fillRect(x + w / 2 - 6, y + h - 14, 12, 14); }
    [[90, 300, 60, 40], [240, 300, 50, 38], [380, 286, 90, 52, '#b8432f'], [482, 290, 70, 46], [580, 296, 60, 42], [700, 290, 70, 40], [800, 286, 64, 44], [1080, 280, 60, 40], [1110, 300, 110, 56, '#6a6a72'],
     [600, 120, 120, 70, '#7a6a5a'], [880, 70, 110, 70, '#5a6a8a'], [970, 220, 90, 46, '#8a6a3a'], [140, 240, 80, 50, '#4f6a8a'], [1140, 110, 80, 60, '#7a5a4a'],
     [150, 600, 110, 60, '#6a6a72'], [760, 600, 110, 70, '#c8c8c8'], [300, 660, 60, 40], [1000, 640, 90, 50], [1150, 620, 80, 46]].forEach(function (h) { house(h[0], h[1], h[2], h[3], h[4]); });
    // 树
    function tree(x, y, r) { g.fillStyle = 'rgba(40,60,20,.25)'; g.beginPath(); g.ellipse(x + 4, y + r * 0.7, r, r * 0.4, 0, 0, 7); g.fill(); g.fillStyle = '#4f7a3a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#6a9a48'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, 7); g.fill(); }
    [[60, 200, 26], [330, 230, 18], [520, 600, 40], [600, 640, 22], [470, 650, 18], [1230, 200, 24], [860, 230, 16], [40, 600, 22], [1240, 600, 20], [760, 170, 16], [1040, 130, 18]].forEach(function (q) { tree(q[0], q[1], q[2]); });
    for (i = 0; i < 14; i++) { var lx = 60 + i * 90; g.strokeStyle = '#6a9a48'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 432 + Math.sin(i) * 6); g.quadraticCurveTo(lx + 6, 452, lx + 2, 468); g.stroke(); }
    // 石桥
    g.save(); g.translate(690, 505); g.rotate(-0.12); g.fillStyle = 'rgba(40,30,20,.3)'; g.fillRect(-30, -78, 66, 160); g.fillStyle = '#cdb88e'; g.fillRect(-34, -82, 66, 160); g.strokeStyle = '#7a6040'; g.lineWidth = 3; g.strokeRect(-34, -82, 66, 160);
    g.strokeStyle = '#a89068'; g.lineWidth = 2; for (i = -60; i < 78; i += 22) { g.beginPath(); g.moveTo(-34, i); g.lineTo(32, i); g.stroke(); } g.restore();
    // 码头石阶
    g.fillStyle = '#b8a888'; for (i = 0; i < 4; i++) g.fillRect(320 + i * 6, 470 + i * 12, 70 - i * 12, 10);
    // 7 路线
    g.strokeStyle = 'rgba(184,67,47,.85)'; g.lineWidth = 3; g.setLineDash([12, 9]); g.beginPath(); g.moveTo(175, 340); g.lineTo(600, 344); g.lineTo(900, 328); g.lineTo(930, 150); g.lineTo(1180, 150); g.stroke(); g.setLineDash([]);
    return c;
  }
  function drawMap(ctx, t, clock) {
    var img = A.img('map_liuhe');
    if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; }
    else { if (!mapCache) mapCache = buildMap(); ctx.drawImage(mapCache, 0, 0); }
    // 时辰：越晚越暖、越暗
    var k = Math.max(0, Math.min(1, (clock - T.START) / (T.END - T.START)));
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(' + Math.round(255 - 30 * k) + ',' + Math.round(250 - 80 * k) + ',' + Math.round(240 - 120 * k) + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    // 河面一闪一闪
    if (!Fx.lowFx) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#e8f6f1'; for (var i = 0; i < 10; i++) { var x = (i * 137 + t * 22) % 1300 - 20, y = 470 + Math.sin(i * 1.7) * 30 + (x > 600 ? -20 : 0); ctx.fillRect(x, y, 14, 2); } ctx.restore(); }
  }

  // 每个地点的场景图
  function placeBg(id, clock) {
    if (id === 'shop') return 'bg_room_main';
    if (id === 'wharf') return clock >= 18 * 60 + 30 ? 'bg_wharf_night' : 'bg_wharf_dusk';
    return 'bg_' + id;
  }
  function Town(app) {
    var s = app.state;
    this.app = app; this.name = 'town'; this.pausable = true; this.s = s; this.t = 0; this.mt = 0; this.mode = 'map';
    this.st = T.ensure(s);
    this.sel = this.st.at; this.anim = null; this.note = null;
    var ls = T.leads(s); if (this.st.clock === T.START && ls[0] && ls[0].at) this.sel = ls[0].at;
    Fx.reset(); Shop.reset('day', s.today.weather);
    Au.setScene({ place: 'street', rain: s.today.weather === 'rain' ? 0.6 : 0, crowd: 0.2, dawn: 1, music: 'close' });
  }
  var P = Town.prototype;
  P.setMode = function (m) { this.mode = m; this.mt = 0; };
  P.update = function (dt) {
    this.t += dt; this.mt += dt;
    if (this.anim) { this.anim.t += dt; if (this.anim.t >= this.anim.d) this.anim = null; }
    if (Math.random() < dt * 0.12) Au.play('sparrow', { vol: 0.25 });
  };
  P.finish = function () { var app = this.app; T.done(this.s); app.save(); app.route(true); };
  P.go = function (id) {
    var s = this.s, from = this.st.at, w = T.travel(s, id);
    if (w) { this.app.notice(w); Au.play('wrong'); return; }
    var a = T.place(from), b = T.place(id); this.anim = { ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, d: 0.75 };
    Au.play('page'); this.app.save();
  };
  P.act = function (a) {
    var s = this.s, app = this.app, self = this;
    if (a.why) { app.notice(a.why); return; }
    if (a.kind === 'talk') { var line = T.doTalk(s, a.who); this.note = { who: a.who, text: line }; this.setMode('note'); }
    else if (a.kind === 'wait') { T.spend(s, a.mins); app.notice('等到了 ' + T.clockText(this.st.clock)); }
    else if (a.kind === 'idle') { this.note = { who: 'n', text: T.doIdle(s, this.st.at) }; this.setMode('note'); }
    else if (a.kind === 'practice') { T.spend(s, a.mins); var r = T.practice(s); this.res = { title: '关起门练手', lines: ['我把卷帘门拉下一半，一个人对着' + r.name + '练了一个钟头。', r.name + '的手感又熟了一点。'] }; this.setMode('result'); }
    else if (a.kind === 'bridge') { T.spend(s, a.mins); var b = T.bridge(s); this.res = { title: '桥头', w: b.w, lines: [b.river, b.text] }; this.setMode('result'); }
    else if (a.kind === 'market') { T.spend(s, a.mins); this.st.did.market = 1; this.lots = T.lots(s); this.looks = 2; this.seen = this.lots.map(function () { return [false, false, false]; }); this.take = this.lots.map(function () { return false; }); this.setMode('market'); }
    else if (a.kind === 'depot') { T.spend(s, a.mins); this.st.did.depot = 1; this.offers = T.offers(s); this.setMode('depot'); }
    else if (a.kind === 'scene') {
      var Screens = require('ui/screens'), sc = Tn.scenes[a.scene];
      T.spend(s, a.mins); app.save(); Au.play('page');
      app.go(Screens.Scene, { ids: [a.scene], when: 'town', place: sc.place, done: function () { app.save(); app.route(true); } }, true);
      return;
    }
    Au.play('tap'); app.save();
  };

  // ───────── 绘制
  P.draw = function (ctx) {
    var s = this.s, app = this.app, self = this, st = this.st;
    var bgId = this.mode !== 'map' ? placeBg(st.at, st.clock) : null;
    if (bgId && A.img(bgId)) { Shop.drawPlace(ctx, bgId, this.t, { tint: 'rgb(255,240,222)' }); }
    else drawMap(ctx, this.t, st.clock);
    if (s.today.weather === 'rain' && !Fx.lowFx) { ctx.save(); ctx.strokeStyle = 'rgba(220,232,245,.35)'; ctx.lineWidth = 1.5; for (var r = 0; r < 70; r++) { var rx = (r * 97 + this.t * 420) % 1320 - 20, ry = (r * 53 + this.t * 900) % 760 - 20; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); ctx.stroke(); } ctx.restore(); }
    if (this.mode === 'map' || !(bgId && A.img(bgId))) this.drawPins(ctx);
    this.drawHud(ctx);
    if (this.mode === 'map') { this.drawLeads(ctx); this.drawCard(ctx); }
    else if (this.mode === 'note') this.drawNote(ctx);
    else if (this.mode === 'market') this.drawMarket(ctx);
    else if (this.mode === 'depot') this.drawDepot(ctx);
    else if (this.mode === 'result') this.drawResult(ctx);
    Shop.grade(ctx);
  };
  P.drawHud = function (ctx) {
    var s = this.s, app = this.app, self = this, st = this.st, t = this.t;
    K.dayChip(ctx, s, 14, 12, t);
    // 钟
    var k = (st.clock - T.START) / (T.END - T.START), left = T.left(s);
    ctx.fillStyle = 'rgba(28,22,16,.74)'; U.rr(ctx, 470, 12, 340, 46, 23); ctx.fill();
    U.text(ctx, T.clockText(st.clock), 492, 44, { size: 24, bold: true, color: '#fff8e8' });
    ctx.fillStyle = 'rgba(255,240,210,.22)'; U.rr(ctx, 572, 29, 220, 12, 6); ctx.fill();
    ctx.fillStyle = left < 60 ? '#e8862a' : '#ffe28a'; U.rr(ctx, 572, 29, 220 * Math.min(1, k), 12, 6); ctx.fill();
    U.text(ctx, left > 0 ? '天黑前还能走 ' + (left >= 60 ? Math.floor(left / 60) + ' 小时 ' : '') + (left % 60 ? Math.round(left % 60) + ' 分' : '') : '天黑了', 640, 80, { size: 15, bold: true, align: 'center', color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 4 });
    ctx.fillStyle = 'rgba(30,18,8,.35)'; U.rr(ctx, 1062, 14, 206, 56, 10); ctx.fill();
    ctx.fillStyle = '#c98a4e'; U.rr(ctx, 1058, 8, 206, 56, 10); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 3; ctx.stroke();
    K.tin(ctx, 1100, 34, s.cash, 0);
    if (this.mode === 'map') K.tag(ctx, 'end', 1090, 74, 174, 48, left > 0 ? '回店算账' : '天黑了，回店', { kind: left > 0 ? 'wood' : 'teal', size: 19, onTap: function () { self.finish(); } });
  };
  P.drawPins = function (ctx) {
    var self = this, s = this.s, st = this.st, t = this.t;
    Tn.places.forEach(function (p, i) {
      var locked = p.lock && !s.flags[p.lock]; if (locked) return;
      var on = self.sel === p.id, here = st.at === p.id, w = T.whyNot(s, p.id), mk = self.mode === 'map' ? T.markers(s, p.id) : { people: [] };
      var bob = Math.sin(t * 2.4 + i) * (mk.event ? 4 : 1.5), x = p.x, y = p.y + bob;
      U.hit('pl_' + p.id, x - 34, y - 70, 68, 100, { onTap: function () { self.sel = p.id; Au.play('page'); }, label: p.name, disabled: self.mode !== 'map' });
      ctx.save(); if (w && !here) ctx.globalAlpha *= 0.55;
      ctx.fillStyle = 'rgba(20,12,6,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 16, 6, 0, 0, 7); ctx.fill();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, x, y - 36, 60, '255,220,140', 0.45); ctx.restore(); }
      ctx.fillStyle = on ? RED : (p.open != null && !T.isOpenAt(p, st.clock)) ? '#6a4a8a' : TEAL;
      ctx.beginPath(); ctx.moveTo(x - 10, y - 24); ctx.lineTo(x, y); ctx.lineTo(x + 10, y - 24); ctx.fill();
      if (A.img('map_pins')) { ctx.beginPath(); ctx.arc(x, y - 42, 27, 0, 7); ctx.fill(); A.cell(ctx, 'map_pins', i, x - 24, y - 66, 48, 48, {}); }
      else { ctx.beginPath(); ctx.arc(x, y - 38, 20, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 3; ctx.stroke(); U.text(ctx, p.mark, x, y - 31, { size: 20, bold: true, kai: true, align: 'center', color: '#fff8e8' }); }
      ctx.font = U.font(14, 'bold'); var nw = ctx.measureText(p.name).width + 16;
      ctx.fillStyle = on ? '#fff3d6' : 'rgba(255,248,232,.92)'; U.rr(ctx, x - nw / 2, y + 8, nw, 22, 6); ctx.fill(); ctx.strokeStyle = on ? RED : '#7d5a35'; ctx.lineWidth = 1.5; ctx.stroke();
      U.text(ctx, p.name, x, y + 24, { size: 14, bold: true, align: 'center', color: INK });
      // 标记：! 有戏，… 有熟人，¥ 有生意
      var bx = x + 18, by = y - 64;
      if (A.img('map_marks')) {
        if (mk.event) { A.cell(ctx, 'map_marks', 0, bx - 14, by - 16, 28, 28, {}); bx += 26; }
        if (mk.people.length) { A.cell(ctx, 'map_marks', 1, bx - 15, by - 15, 30, 30, {}); bx += 28; }
        if (mk.biz) A.cell(ctx, 'map_marks', 2, bx - 13, by - 13, 26, 26, {});
        mk = { people: [] };
      }
      if (mk.event) { ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(bx, by, 11, 0, 7); ctx.fill(); ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 2; ctx.stroke(); U.text(ctx, '!', bx, by + 6, { size: 16, bold: true, align: 'center', color: INK }); bx += 24; }
      if (mk.people.length) { ctx.fillStyle = '#fff8e8'; U.rr(ctx, bx - 12, by - 10, 26, 20, 6); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 1.5; ctx.stroke(); U.text(ctx, '…', bx + 1, by + 4, { size: 14, bold: true, align: 'center', color: INK }); bx += 28; }
      if (mk.biz) { ctx.fillStyle = '#fff8e8'; U.rr(ctx, bx - 11, by - 10, 22, 20, 6); ctx.fill(); ctx.strokeStyle = TEAL; ctx.lineWidth = 1.5; ctx.stroke(); U.text(ctx, '¥', bx, by + 5, { size: 14, bold: true, align: 'center', color: TEAL }); }
      ctx.restore();
    });
    // 老周
    var cur = T.place(st.at), zx = cur.x, zy = cur.y;
    if (this.anim) { var k = Fx.ease.inOut(Math.min(1, this.anim.t / this.anim.d)); zx = this.anim.ax + (this.anim.bx - this.anim.ax) * k; zy = this.anim.ay + (this.anim.by - this.anim.ay) * k; }
    var hop = this.anim ? Math.abs(Math.sin(this.t * 14)) * -5 : 0;
    if (A.img('map_zhou')) {
      var row = 0, an = this.anim; if (an) { var dx = an.bx - an.ax, dy = an.by - an.ay; row = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); this.facing = row; } else row = this.facing || 0;
      var fr = an ? Math.floor(this.t * 9) % 4 : 0;
      ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.beginPath(); ctx.ellipse(zx + 30, zy + 2, 15, 5, 0, 0, 7); ctx.fill();
      A.cell(ctx, 'map_zhou', row * 4 + fr, zx + 30 - 19, zy + 4 - 60, 38, 60, {});
      return;
    }
    ctx.fillStyle = 'rgba(20,12,6,.35)'; ctx.beginPath(); ctx.ellipse(zx + 26, zy + 2, 12, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(zx + 26, zy - 12 + hop, 15, 0, 7); ctx.fill(); ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.stroke();
    U.text(ctx, '周', zx + 26, zy - 6 + hop, { size: 15, bold: true, align: 'center', color: RED });
  };
  P.drawLeads = function (ctx) {
    var s = this.s, self = this, ls = T.leads(s), x = 448, y = 94, w = 384, h = 34 + ls.length * 24;
    ctx.fillStyle = 'rgba(251,245,228,.94)'; U.rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2; ctx.stroke();
    U.text(ctx, '小本子 · 今天可能遇到', x + 14, y + 24, { size: 15, bold: true, color: TEAL });
    ls.forEach(function (l, i) {
      var yy = y + 32 + i * 24;
      if (l.at) U.hit('lead' + i, x + 6, yy, w - 12, 22, { onTap: function () { self.sel = l.at; Au.play('page'); }, label: l.text, minSize: 22 });
      U.text(ctx, (l.star ? '★ ' : '· ') + l.text, x + 14, yy + 17, { size: 14, color: l.star ? RED : INK, maxW: w - 28 });
    });
  };
  P.drawCard = function (ctx) {
    var s = this.s, self = this, st = this.st, p = T.place(this.sel); if (!p) return;
    var c = CARD, here = st.at === p.id, x = p.x >= 640 ? 14 : c.x, y = c.y;
    K.paper(ctx, x, y, c.w, c.h, { pin: RED });
    K.iconBtn(ctx, 'card_x', x + c.w - 22, y - 18, 34, 'close', function () { self.sel = null; }, { label: '收起' });
    U.text(ctx, p.full || p.name, x + 22, y + 44, { size: 24, bold: true, kai: true, color: INK, maxW: c.w - 140 });
    var mins = T.travelMins(st.at, p.id), w = T.whyNot(s, p.id);
    U.text(ctx, here ? '你在这儿' : (p.bus ? '坐 7 路 ' : '走过去 ') + mins + ' 分钟', x + c.w - 26, y + 42, { size: 14, align: 'right', color: here ? TEAL : MUTE, bold: here });
    if (!here) {
      U.para(ctx, p.desc, x + 22, y + 72, c.w - 44, { size: 15, lh: 22, color: INK });
      var arrive = st.clock + mins, ppl = T.presentAt(s, p.id, arrive), ev = T.eventsAt(s, p.id, arrive);
      var yy = y + 150;
      if (ppl.length) { U.text(ctx, T.clockText(arrive) + ' 到，那时在：', x + 22, yy, { size: 14, color: MUTE }); ppl.slice(0, 5).forEach(function (id, i) { self.face(ctx, id, x + 22 + i * 58, yy + 8, 50); }); yy += 66; }
      else { var cm = T.comingAt(s, p.id, arrive); U.text(ctx, T.clockText(arrive) + ' 到，没碰到熟人。' + (cm.length ? cm.map(function (c) { return Cast.regulars[c.id].name + ' ' + Math.floor(c.from) + ' 点后会来'; }).join('，') + '。' : ''), x + 22, yy, { size: 14, color: MUTE, maxW: c.w - 44 }); yy += 18; }
      if (ev.length) U.text(ctx, '! ' + ev.map(function (v) { return Cast.regulars[v.id].name + '好像有话想说'; }).join('；'), x + 22, yy + 8, { size: 14, bold: true, color: RED, maxW: c.w - 44 });
      if (w) U.text(ctx, w, x + 22, y + c.h - 26, { size: 16, bold: true, color: RED });
      else K.tag(ctx, 'go', x + c.w - 22 - 170, y + c.h - 62, 170, 46, p.bus ? '坐车过去' : '走过去', { kind: 'teal', size: 20, onTap: function () { self.go(self.sel); } });
      return;
    }
    // 在这儿：能做的事
    var acts = T.actionsAt(s, p.id), ppl2 = T.presentAt(s, p.id), ay = y + 60;
    if (ppl2.length) { ppl2.slice(0, 5).forEach(function (id, i) { self.face(ctx, id, x + 22 + i * 54, ay, 46); }); ay += 54; }
    else { var cm2 = T.comingAt(s, p.id); U.text(ctx, '这会儿没碰到熟人。' + (cm2.length ? cm2.map(function (c) { return Cast.regulars[c.id].name + ' ' + Math.floor(c.from) + ' 点后会来'; }).join('，') + '。' : ''), x + 22, ay + 18, { size: 14, color: MUTE, maxW: c.w - 44 }); ay += 28; }
    acts.slice(0, 5).forEach(function (a, i) {
      var by = ay + i * 40, dis = !!a.why;
      K.tag(ctx, 'act_' + a.id, x + 18, by, c.w - 36, 34, a.label, { kind: a.star ? 'teal' : 'paper', size: 16, disabled: dis, onTap: function () { self.act(a); } });
      U.text(ctx, dis ? a.why : a.mins + ' 分钟', x + c.w - 28, by + 23, { size: 12, align: 'right', color: dis ? RED : a.star ? '#e8f4f0' : MUTE });
    });
  };
  P.face = function (ctx, id, x, y, s) { ctx.save(); U.rr(ctx, x, y, s, s, 7); ctx.fillStyle = '#ecdcb8'; ctx.fill(); ctx.strokeStyle = '#b48c5a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.clip(); var r = Cast.regulars[id]; if (r) A.cell(ctx, 'atlas_regulars', r.portrait, x + 1, y + 2, s - 2, s, { trim: true, fit: true }); ctx.restore(); };
  P.drawNote = function (ctx) {
    var self = this, n = this.note, k = Fx.ease.out3(Math.min(1, this.mt * 4)), x = 300, y = 470 + (1 - k) * 20, w = 680, h = 150;
    ctx.save(); ctx.globalAlpha *= k;
    ctx.fillStyle = 'rgba(20,12,6,.4)'; U.rr(ctx, x + 4, y + 7, w, h, 12); ctx.fill();
    ctx.fillStyle = n.who === 'n' ? 'rgba(22,16,10,.88)' : '#fbf5e4'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = n.who === 'n' ? 'rgba(232,200,150,.5)' : '#7d5a35'; ctx.lineWidth = 3; ctx.stroke();
    var tx = x + 28;
    if (n.who !== 'n') { this.face(ctx, n.who, x + 20, y + 20, 110); tx = x + 150; U.text(ctx, Cast.regulars[n.who].name, tx, y + 44, { size: 20, bold: true, kai: true, color: RED }); }
    U.para(ctx, n.text, tx, y + (n.who === 'n' ? 62 : 84), w - (tx - x) - 28, { size: 22, lh: 32, bold: true, kai: true, color: n.who === 'n' ? '#f4e4c4' : INK });
    U.hit('note_ok', 0, 0, 1280, 720, { onTap: function () { self.setMode('map'); }, label: '继续', minSize: 0 });
    if (this.mt > 0.4) U.text(ctx, '点一下继续', x + w - 20, y + h - 14, { size: 13, align: 'right', color: n.who === 'n' ? '#d8c8a8' : MUTE });
    ctx.restore();
  };

  // ───────── 批发市场：验货（花 60 分钟）
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
    K.tag(ctx, 'mk_back', 1090, 618, 150, 58, '不看了', { kind: 'paper', size: 19, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };

  P.pay = function () {
    var s = this.s, ls = this.lots, picks = this.take, p = T.buy(s, ls, picks), n = picks.filter(Boolean).length;
    if (n) Au.play('coin');
    this.res = { title: '批发市场', lines: n ? ['付了 ' + K.yuan(p.spent) + '，收了 ' + n + ' 样。明早进货能抵 ' + K.yuan(p.credit) + '。', '货好不好，明天开箱就知道了。'] : ['转了一圈，一样没收。', '老胡在后面喊：兄弟，下回来早点！'] };
    this.setMode('result'); this.app.save();
  };

  // ───────── 7 路总站：包餐（花 30 分钟）
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
      K.tag(ctx, 'acc_' + i, x + w - 30 - 160, y + h - 72, 160, 52, '接下', { kind: 'teal', size: 22, onTap: function () { T.accept(self.s, o); Au.play('stamp'); self.res = { title: '7 路总站', kind: 'depot', lines: ['接了' + o.who + '的单：明早 ' + o.n + ' 份' + d.name + '。', '晨备的时候会多备出来。记得开门前，灶上先把这一批做好。'] }; self.setMode('result'); self.app.save(); } });
    });
    K.tag(ctx, 'dp_skip', 640 - 260, 610, 240, 56, '都不接', { kind: 'paper', size: 20, onTap: function () { self.res = { title: '7 路总站', kind: 'depot', lines: ['我在总站门口站了一会儿，看司机们交班。', '单子没接。明早照常。'] }; self.setMode('result'); } });
    K.tag(ctx, 'dp_back', 640 + 20, 610, 240, 56, '回到街上', { kind: 'wood', size: 20, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };


  // ───────── 结果
  P.drawResult = function (ctx) {
    var self = this, r = this.res, k = Fx.ease.out3(Math.min(1, this.mt * 3)), x = 340, y = 190 + (1 - k) * 30, w = 600, h = 320;
    K.dim(ctx, 0.42 * k); ctx.save(); ctx.globalAlpha *= k;
    K.paper(ctx, x, y, w, h, { pin: RED, lines: 34, top: 110 });
    U.text(ctx, r.title, x + 40, y + 62, { size: 32, bold: true, kai: true, color: INK });
    if (r.w) K.weather(ctx, r.w, x + w - 70, y + 50, 44, this.t);
    var yy = y + 120; r.lines.forEach(function (l) { yy += U.para(ctx, l, x + 40, yy, w - 80, { size: 21, lh: 32, kai: true, bold: true, color: INK }) + 8; });
    K.tag(ctx, 'res_ok', x + w - 40 - 220, y + h - 76, 220, 56, '回到街上', { kind: 'teal', size: 22, onTap: function () { self.setMode('map'); } });
    ctx.restore();
  };
  P.key = function (k) { if (k === 'Escape' && (this.mode === 'note' || this.mode === 'result')) this.setMode('map'); };
  P.describe = function () {
    var s = this.s, st = this.st;
    return { mode: this.mode, clock: T.clockText(st.clock), at: st.at, sel: this.sel, left: T.left(s), leads: T.leads(s).map(function (l) { return l.text; }),
      actions: T.actionsAt(s, st.at).map(function (a) { return a.id + (a.why ? '×' : ''); }), looks: this.looks, take: this.take, offers: this.offers ? this.offers.map(function (o) { return o.id; }) : null };
  };
  return { Town: Town };
});
