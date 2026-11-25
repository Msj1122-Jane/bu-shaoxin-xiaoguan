// 标题页：柳河街的早晨。主视觉是工程里那张店面图（assets/shop.png → bg_title）。
// 店名写在门口的布幌子上；门头那块招牌是空的——上个月写过什么，这里就留着什么。
// 入口：接着开店 / 开张（选节奏、带一件旧物）/ 小本子 / 招牌墙（八个结局）/ 设置 / 关于。
BSX.define('ui/s_title', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var SIGN = { x: 499, y: 172, w: 400 };
  var TEASE = [
    '“油三天一换，别省。”——抽屉里的一张条子',
    '补偿金四万二。盘这间铺子，花了三万。',
    '门头的招牌是空的。写什么，月底再说。',
    '六点零五，头班车。六点四十，一老一小。',
    '一碗早饭，不亏心地卖，能不能活？'
  ];
  var PACE = [
    { name: '慢慢来', sub: '客人更有耐心，来的人少一点', text: '想看故事、头一回玩，选这个。' },
    { name: '照常', sub: '柳河街平常的早晨', text: '忙，但顾得过来。' },
    { name: '赶早高峰', sub: '人多、性子急，小费也多', text: '手熟了再来。' }
  ];
  var HINT = { E_HONEST: '油勤换，单子贴出来。贵一点，也有人认。', E_CANTEEN: '薄利。记得每个人的老样子。', E_PRIVATE: '提价，把少数几位照顾到家。', E_REOPEN: '出了事，认，然后改。', E_PILLS: '一锅油用到底。', E_FAREWELL: '租没续上，可有人记得你。', E_TRANSFER: '租没续上，也没人来问。', E_SOMEONE: '不好不坏地做完一个月。' };

  function Title(app) {
    this.app = app; this.name = 'title'; this.t = 0; this.lit = 0; this.go = null; this.mode = 'main'; this.pick = null; this.pace = 1; this.mt = 0;
    this.has = app.store.hasRun(); this.saved = this.has ? app.store.loadRun() : null;
    this.steam = []; this.leaves = []; this.birds = [];
    if (app.store.notice) { app.notice(app.store.notice); app.store.notice = null; }
    Au.setScene({ place: 'street', rain: 0, crowd: 0.25, dawn: 1, music: 'dawn' });
    for (var i = 0; i < 8; i++) this.leaves.push(this.leaf(true));
  }
  var T = Title.prototype;
  T.leaf = function (any) { return { x: Math.random() * 520 - 60, y: any ? Math.random() * 600 : -10 - Math.random() * 60, vx: 14 + Math.random() * 22, vy: 16 + Math.random() * 20, r: Math.random() * 6, vr: (Math.random() - 0.5) * 3, s: 4 + Math.random() * 4, c: ['#7fae4a', '#a8c45a', '#d8b84a', '#5f9440'][Math.floor(Math.random() * 4)], ph: Math.random() * 6 }; };
  T.setMode = function (m) { this.mode = m; this.mt = 0; this.confirm = false; };
  T.update = function (dt) {
    var self = this; this.t += dt; this.mt += dt;
    if (this.go && this.ready()) { this.lit = Math.min(1, this.lit + dt * 1.2); if (this.lit >= 1 && !this.fired) { this.fired = true; this.go(); } }
    if (Math.random() < dt * 0.22) Au.play('sparrow', { vol: 0.35 });
    if (!Fx.lowFx) {
      if (Math.random() < dt * 9) this.steam.push({ x: (Math.random() < 0.55 ? 318 : 386) + (Math.random() - 0.5) * 34, y: Math.random() < 0.55 ? 352 : 388, r: 7 + Math.random() * 6, t: 0, life: 2.2 + Math.random() * 1.4, dx: (Math.random() - 0.3) * 12 });
      if (Math.random() < dt * 0.06 && this.birds.length < 1) this.birds.push({ x: -40, y: 60 + Math.random() * 70, t: 0 });
    }
    this.steam = this.steam.filter(function (p) { p.t += dt; p.y -= dt * (26 - p.t * 5); p.x += dt * (p.dx + Math.sin(p.t * 2 + p.r) * 6); return p.t < p.life; });
    this.leaves.forEach(function (l, i) { l.x += dt * (l.vx + Math.sin(self.t * 1.3 + l.ph) * 18); l.y += dt * l.vy; l.r += dt * l.vr; if (l.y > 650 || l.x > 760) self.leaves[i] = self.leaf(false); });
    this.birds = this.birds.filter(function (b) { b.t += dt; b.x += dt * 150; b.y += Math.sin(b.t * 2) * dt * 16; return b.x < 1340; });
  };
  // 开店前要等的图：早市、人物都在 boot / chars 两组
  T.ready = function () { return A.groupState.boot === 'done' && A.groupState.chars === 'done'; };
  T.progress = function () { var es = A.manifest.entries.filter(function (e) { return e.group === 'boot' || e.group === 'chars'; }), n = es.filter(function (e) { return A.loaded[e.id]; }).length; return es.length ? n / es.length : 1; };
  T.start = function (fn) { if (this.go) return; this.go = fn; Au.play('lamp'); Au.play('shutter_up', { vol: 0.7 }); };
  T.launch = function (o) { var app = this.app; this.start(function () { app.newRun(o); }); };

  T.drawBanner = function (ctx, a) {
    // 布幌子：挂在右边电线杆伸出来的横杆上
    var t = this.t, bx = 1010, by = 30, bw = 104, bh = 330, sway = Math.sin(t * 1.1) * 0.012 + Math.sin(t * 2.7) * 0.004;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(bx - 26, by - 6, 290, 9); ctx.fillStyle = '#7a5230'; ctx.fillRect(bx - 26, by - 6, 290, 3);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(bx + 6, by + 3, 3, 12); ctx.fillRect(bx + bw - 9, by + 3, 3, 12);
    ctx.translate(bx + bw / 2, by + 12); ctx.transform(1, 0, sway * 6, 1, 0, 0); ctx.rotate(sway);
    ctx.fillStyle = 'rgba(30,18,8,.3)'; ctx.fillRect(-bw / 2 + 5, 6, bw, bh);
    ctx.fillStyle = '#f6eed8'; ctx.fillRect(-bw / 2, 0, bw, bh);
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(-bw / 2, 0, bw, 16);
    ctx.fillStyle = '#e6dcc0'; for (var i = 0; i < 6; i++) ctx.fillRect(-bw / 2 + 8 + i * 16, 22, 2, bh - 60);
    // 下摆的波浪边
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(-bw / 2, bh - 26, bw, 8);
    ctx.fillStyle = '#f6eed8'; for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-bw / 2 + 13 + i * 26, bh, 13, 0, Math.PI); ctx.fill(); }
    ctx.strokeStyle = '#b8a47a'; ctx.lineWidth = 2; ctx.strokeRect(-bw / 2, 0, bw, bh);
    '不烧心小馆'.split('').forEach(function (ch, k) { U.text(ctx, ch, 0, 68 + k * 52, { size: 50, bold: true, kai: true, align: 'center', color: '#27433d' }); });
    // 红印
    ctx.fillStyle = '#b8432f'; U.rr(ctx, 14, bh - 60, 30, 30, 4); ctx.fill();
    U.text(ctx, '早', 29, bh - 38, { size: 20, bold: true, kai: true, align: 'center', color: '#fff3e0' });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    '柳河街·二十八天'.split('').forEach(function (ch, k) { U.text(ctx, ch, bx - 44, by + 54 + k * 26, { size: 21, kai: true, bold: true, align: 'center', color: '#fff3d6', stroke: 'rgba(40,24,10,.82)', strokeW: 4 }); });
    ctx.restore();
  };

  T.draw = function (ctx) {
    var app = this.app, self = this, bg = A.img('bg_title') || A.img('bg_ext_morning'), L = app.legacy, t = this.t, i;
    var zoom = 1.025 + Math.sin(t * 0.13) * 0.006 + Fx.ease.inOut(this.lit) * 0.22, dx = Math.sin(t * 0.09) * 5;
    ctx.save();
    ctx.translate(480, 330); ctx.scale(zoom, zoom); ctx.translate(-480 + dx, -330);
    if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, -16, -9, 1312, 738); ctx.imageSmoothingEnabled = true; } else { ctx.fillStyle = '#c8a878'; ctx.fillRect(0, 0, 1280, 720); }
    // 招牌：上个月写下的字（第一次是空的）
    if (L.lastSign) { ctx.save(); ctx.globalAlpha = 0.86; U.text(ctx, L.lastSign, SIGN.x, SIGN.y + 18, { size: 50, bold: true, kai: true, align: 'center', color: '#4a2c14', maxW: SIGN.w }); ctx.restore(); }
    // 蒸笼的气
    this.steam.forEach(function (p) { var k = p.t / p.life, r = p.r * 0.7 + k * 15; ctx.fillStyle = 'rgba(255,252,244,' + (0.2 * (1 - k) * Math.min(1, p.t * 3)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.arc(p.x + r * 0.7, p.y - r * 0.5, r * 0.7, 0, 7); ctx.fill(); });
    // 灯笼的一点暖光
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; Shop.glow(ctx, 780, 286, 70 + Math.sin(t * 1.7) * 6, '255,120,70', 0.22); Shop.glow(ctx, 541, 316, 120, '255,206,130', 0.16 + Math.sin(t * 2.3) * 0.02); ctx.restore();
    // 落叶
    this.leaves.forEach(function (l) { ctx.save(); ctx.translate(Math.round(l.x), Math.round(l.y)); ctx.rotate(l.r); ctx.fillStyle = l.c; ctx.fillRect(-l.s / 2, -l.s / 3, l.s, l.s * 0.66); ctx.restore(); });
    this.birds.forEach(function (b) { var w = Math.sin(b.t * 14) > 0 ? 4 : -2; ctx.fillStyle = '#4a3a30'; ctx.fillRect(b.x, b.y, 8, 4); ctx.fillRect(b.x - 6, b.y - w, 6, 3); ctx.fillRect(b.x + 6, b.y - w, 6, 3); });
    ctx.restore();
    // 斜进来的晨光
    if (!Fx.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 3; i++) { var sx = 560 + i * 190 + Math.sin(t * 0.2 + i) * 12; ctx.fillStyle = 'rgba(255,236,190,' + (0.045 + Math.sin(t * 0.5 + i * 2) * 0.012).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(sx + 300, 0); ctx.lineTo(sx + 390, 0); ctx.lineTo(sx - 150, 720); ctx.lineTo(sx - 300, 720); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    // 四角压暗
    var vg = ctx.createRadialGradient(560, 340, 300, 640, 360, 820); vg.addColorStop(0, 'rgba(24,14,6,0)'); vg.addColorStop(1, 'rgba(24,14,6,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
    var a = Math.max(0, 1 - this.lit * 1.8); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    var g = ctx.createLinearGradient(820, 0, 1280, 0); g.addColorStop(0, 'rgba(24,14,6,0)'); g.addColorStop(1, 'rgba(24,14,6,.5)'); ctx.fillStyle = g; ctx.fillRect(820, 0, 460, 720);
    g = ctx.createLinearGradient(0, 590, 0, 720); g.addColorStop(0, 'rgba(18,12,6,0)'); g.addColorStop(1, 'rgba(18,12,6,.72)'); ctx.fillStyle = g; ctx.fillRect(0, 590, 1280, 130);
    ctx.restore();
    this.drawBanner(ctx, a);
    ctx.save(); ctx.globalAlpha = a;
    // 左下：一句老周的话，隔几秒换一句
    var ti = Math.floor(t / 6.5) % TEASE.length, tk = (t % 6.5), ta = Math.min(1, tk * 1.4) * Math.min(1, (6.5 - tk) * 1.4);
    U.text(ctx, TEASE[ti], 56, 668, { size: 25, kai: true, bold: true, color: '#fff3d6', stroke: 'rgba(30,18,8,.8)', strokeW: 5, alpha: ta });
    U.text(ctx, L.runs ? '第 ' + (L.runs + 1) + ' 个月 · 写过 ' + Object.keys(L.endings || {}).length + ' / 8 块招牌' : '短租二十八天 · 一块空招牌', 58, 700, { size: 16, color: '#e8d8b8', stroke: 'rgba(30,18,8,.7)', strokeW: 3 });
    if (!this.ready()) { var pr = this.progress(); ctx.fillStyle = 'rgba(20,12,6,.55)'; U.rr(ctx, 900, 676, 344, 26, 13); ctx.fill(); ctx.fillStyle = '#e8b54a'; U.rr(ctx, 903, 679, 338 * pr, 20, 10); ctx.fill(); U.text(ctx, (this.go ? '还在备料，马上开门… ' : '后台备料中 ') + Math.round(pr * 100) + '%', 1072, 695, { size: 14, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(30,18,8,.8)', strokeW: 3 }); }
    if (this.mode === 'main') this.drawMenu(ctx);
    else if (this.mode === 'new') this.drawNew(ctx);
    else if (this.mode === 'wall') this.drawWall(ctx);
    else this.drawAbout(ctx);
    ctx.restore();
  };

  T.drawMenu = function (ctx) {
    var app = this.app, self = this, L = app.legacy, x = 900, w = 344, y = 386, k = Fx.ease.out3(Math.min(1, this.mt * 2.2));
    ctx.save(); ctx.translate((1 - k) * 60, 0); ctx.globalAlpha *= k;
    if (this.has && this.saved) { K.tag(ctx, 'continue', x, y, w, 66, '接着开店', { sub: '第 ' + this.saved.state.day + ' 天 · ' + K.yuan(this.saved.state.cash), kind: 'teal', size: 27, onTap: function () { self.start(function () { app.continueRun(); }); } }); y += 78; }
    else y += 18;
    K.tag(ctx, 'new', x, y, w, this.has ? 58 : 70, this.has ? '新的一个月' : '开张', { sub: this.has ? '从第一天重新来' : '五点半，拉起卷帘门', kind: this.has ? 'wood' : 'teal', size: this.has ? 24 : 30, onTap: function () { self.setMode('new'); } }); y += this.has ? 70 : 84;
    var hw = (w - 12) / 2;
    K.tag(ctx, 'book', x, y, hw, 54, '小本子', { sub: '街坊 · 菜谱', kind: 'wood', size: 21, onTap: function () { app.openOverlay(require('ui/s_book').Book, { legacy: true }); } });
    K.tag(ctx, 'wall', x + hw + 12, y, hw, 54, '招牌墙', { sub: Object.keys(L.endings || {}).length + ' / 8', kind: 'wood', size: 21, onTap: function () { self.setMode('wall'); } }); y += 66;
    K.tag(ctx, 'settings', x, y, hw, 54, '设置', { sub: '声音 · 字号', kind: 'wood', size: 21, onTap: function () { app.openOverlay(require('ui/s_basic').Pause, { settings: true }); } });
    K.tag(ctx, 'about', x + hw + 12, y, hw, 54, '关于', { sub: '怎么玩 · 谁做的', kind: 'wood', size: 21, onTap: function () { self.setMode('about'); } });
    ctx.restore();
  };

  T.sheet = function (ctx, title, w, h) {
    var k = Fx.ease.out3(Math.min(1, this.mt * 3)), x = 640 - w / 2 - 60, y = 360 - h / 2 + (1 - k) * 26;
    K.dim(ctx, 0.42 * k);
    U.hit('sheet_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    ctx.globalAlpha *= k;
    K.paper(ctx, x, y, w, h, { pin: K.col.red });
    U.text(ctx, title, x + 40, y + 62, { size: 34, bold: true, kai: true, color: K.col.ink });
    ctx.strokeStyle = 'rgba(120,90,50,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 36, y + 78); ctx.lineTo(x + w - 36, y + 78); ctx.stroke();
    return { x: x, y: y, w: w, h: h };
  };

  // 开张：选节奏，带一件上个月的东西
  T.drawNew = function (ctx) {
    var app = this.app, self = this, L = app.legacy, hs = Cast.heirlooms.filter(function (h) { return L.runs > 0 && L.heirlooms.indexOf(h.id) >= 0; });
    var r = this.sheet(ctx, '开张', 760, hs.length ? 590 : 400), x = r.x, y = r.y;
    U.text(ctx, '这个月的早晨', x + 40, y + 114, { size: 19, bold: true, color: K.col.mute });
    PACE.forEach(function (p, i) {
      var bx = x + 40 + i * 230, sel = self.pace === i;
      K.tag(ctx, 'pace' + i, bx, y + 128, 216, 74, p.name, { sub: p.sub, kind: sel ? 'teal' : 'paper', size: 24, onTap: function () { self.pace = i; } });
    });
    U.text(ctx, PACE[this.pace].text, x + 40, y + 234, { size: 17, color: K.col.mute });
    var yy = y + 262;
    if (hs.length) {
      U.text(ctx, '带一件上个月的东西', x + 40, yy + 10, { size: 19, bold: true, color: K.col.mute });
      hs.slice(0, 5).forEach(function (h, i) {
        var hx = x + 40 + (i % 2) * 344, hy = yy + 24 + Math.floor(i / 2) * 60, sel = self.pick === h.id;
        var st = U.hit('heir' + i, hx, hy, 336, 52, { onTap: function () { self.pick = sel ? null : h.id; }, label: h.name });
        ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : 'rgba(120,90,50,.08)'; U.rr(ctx, hx, hy, 336, 52, 8); ctx.fill(); if (sel) { ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 2; ctx.stroke(); }
        U.text(ctx, h.name, hx + 12, hy + 22, { size: 18, bold: true, color: K.col.ink }); U.text(ctx, h.text, hx + 12, hy + 42, { size: 13, color: K.col.mute, maxW: 314 });
      });
      yy += 24 + Math.ceil(Math.min(5, hs.length) / 2) * 60 + 6;
    }
    if (this.has) U.text(ctx, '现在这个月（第 ' + (this.saved ? this.saved.state.day : '?') + ' 天）会被放弃。', x + 40, r.y + r.h - 96, { size: 17, bold: true, color: K.col.red });
    K.tag(ctx, 'new_back', x + 40, r.y + r.h - 78, 150, 54, '再想想', { kind: 'paper', size: 21, onTap: function () { self.setMode('main'); } });
    K.tag(ctx, 'new_go', x + r.w - 40 - 330, r.y + r.h - 82, 330, 62, '拉起卷帘门', { kind: 'teal', size: 26, sub: PACE[this.pace].name + (this.pick ? ' · 带着旧物' : ''), onTap: function () { self.launch({ pace: self.pace, heirloom: self.pick }); } });
  };

  // 招牌墙：八个结局，写过的留着字
  T.drawWall = function (ctx) {
    var app = this.app, self = this, L = app.legacy, r = this.sheet(ctx, '招牌墙', 860, 600), x = r.x, y = r.y;
    U.text(ctx, '每个月底，空招牌上会写下不一样的字。', x + 200, y + 60, { size: 17, color: K.col.mute });
    Story.endIds.forEach(function (id, i) {
      var e = Story.endings[id], n = (L.endings || {})[id] || 0, bx = x + 40 + (i % 2) * 396, by = y + 98 + Math.floor(i / 2) * 106, bw = 384, bh = 94;
      ctx.fillStyle = 'rgba(30,18,8,.25)'; U.rr(ctx, bx + 2, by + 4, bw, bh, 8); ctx.fill();
      ctx.fillStyle = n ? '#c98a4e' : '#bfb49c'; U.rr(ctx, bx, by, bw, bh, 8); ctx.fill(); ctx.strokeStyle = n ? '#6e4224' : '#8d8370'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = n ? '#f3e6c8' : '#d8cfba'; U.rr(ctx, bx + 10, by + 10, 150, bh - 20, 4); ctx.fill();
      if (n) U.text(ctx, e.sign || (id === 'E_TRANSFER' ? '转让' : '（空着）'), bx + 85, by + 57, { size: 26, bold: true, kai: true, align: 'center', color: e.sign ? '#4a2c14' : '#8d7a60', maxW: 136 });
      else U.text(ctx, '？', bx + 85, by + 60, { size: 34, bold: true, kai: true, align: 'center', color: '#a89c84' });
      U.text(ctx, n ? e.title : '还没写过', bx + 174, by + 36, { size: 18, bold: true, color: n ? '#fff8e8' : '#6a6050', maxW: 200 });
      U.para(ctx, HINT[id] || '', bx + 174, by + 58, 198, { size: 14, lh: 19, color: n ? '#fbe8c8' : '#7a705e' });
      if (n > 1) U.text(ctx, '×' + n, bx + bw - 14, by + 24, { size: 15, bold: true, align: 'right', color: '#fff8e8' });
    });
    K.tag(ctx, 'wall_back', x + r.w - 40 - 170, r.y + r.h - 70, 170, 50, '回门口', { kind: 'teal', size: 21, onTap: function () { self.setMode('main'); } });
  };

  T.drawAbout = function (ctx) {
    var self = this, r = this.sheet(ctx, '关于这间铺子', 760, 560), x = r.x + 40, y = r.y + 116, w = r.w - 80;
    var rows = [
      ['你是谁', '老周，四十八岁。在食品厂食堂管了二十年后勤，下岗，拿补偿金盘下柳河街一间十平米的早餐铺，短租二十八天。'],
      ['早上', '整个早市都站在柜台后面。点＝顺手递给最急的那位；拖＝指定给谁，或先搁出餐台；按住＝接豆浆、磨豆、拉卷帘门。'],
      ['下午', '收了摊，可以出门：去批发市场验货，去桥头、总站、校门口走走。货好不好，人熟不熟，都在这半天。'],
      ['月底', '油换不换、料买谁的、价怎么定、话怎么回——这些加起来，是月底写在空招牌上的字。']
    ];
    rows.forEach(function (rw) { U.text(ctx, rw[0], x, y, { size: 19, bold: true, kai: true, color: K.col.red }); y += U.para(ctx, rw[1], x + 70, y, w - 70, { size: 18, lh: 27, color: K.col.ink }) + 14; });
    U.para(ctx, '第三版。画面与文字含 AI 辅助创作；人物与店铺均为虚构。"烧心"在这里是街坊的说法，不是医学诊断。', x, r.y + r.h - 100, w - 190, { size: 14, lh: 21, color: K.col.mute });
    K.tag(ctx, 'about_back', r.x + r.w - 40 - 170, r.y + r.h - 70, 170, 50, '回门口', { kind: 'teal', size: 21, onTap: function () { self.setMode('main'); } });
  };
  T.key = function (k) { if (k === 'Escape' && this.mode !== 'main') this.setMode('main'); };
  T.describe = function () { return { mode: this.mode, hasSave: this.has, runs: this.app.legacy.runs, pace: this.pace }; };
  return { Title: Title, SIGN: SIGN, PACE: PACE };
});
