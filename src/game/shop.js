// 店面渲染：室内背景、窗外的街（行人、7 路车、雨）、墙上和架子上逐渐多起来的东西、光线（黎明→白天→黄昏→夜→烛光）、卷帘门、前景台面。
// 营业、剧情、收摊共用同一间店——故事发生在玩家正在经营的地方。
BSX.define('game/shop', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Story = require('content/story');
  var LIGHT = { dawn: [182, 190, 228], day: [255, 255, 255], dusk: [252, 218, 186], night: [84, 90, 140], candle: [58, 54, 86], rain: [168, 184, 204], dark: [30, 30, 48] };
  var Shop = { t: 0, col: [255, 255, 255], target: 'day', rain: 0, rainTarget: 0, shutter: 0, shutterTarget: 0, walkers: [], bus: null, crowd: 0.4, candles: false, spawnT: 0, streaks: [], lowFx: false };
  var WIN = { x: 364, y: 158, w: 621, h: 176 }, COUNTER_Y = 452;
  Shop.COUNTER_Y = COUNTER_Y;
  Shop.reset = function (light, weather) { Shop.target = light || 'day'; Shop.col = LIGHT[Shop.target].slice(); Shop.rain = Shop.rainTarget = weather === 'rain' ? 1 : 0; Shop.walkers = []; Shop.bus = null; Shop.candles = light === 'candle'; };
  Shop.setLight = function (name) { if (LIGHT[name]) { Shop.target = name; Shop.candles = name === 'candle'; } };
  // 营业中按时间从黎明过渡到白天：k 0→1
  Shop.setDawn = function (k, rainy) { var a = LIGHT.dawn, b = rainy ? LIGHT.rain : LIGHT.day; k = Math.max(0, Math.min(1, k)); Shop.target = null; Shop.goal = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  Shop.setRain = function (on) { Shop.rainTarget = on ? 1 : 0; };
  Shop.setShutter = function (v, instant) { Shop.shutterTarget = v; if (instant) Shop.shutter = v; };
  Shop.busPass = function (stop) { Shop.bus = { x: -380, stop: !!stop, hold: 0, v: 300 }; };
  Shop.update = function (dt) {
    Shop.t += dt;
    var g = Shop.target ? LIGHT[Shop.target] : Shop.goal, i, k = Math.min(1, dt * 1.6);
    for (i = 0; i < 3; i++) Shop.col[i] += (g[i] - Shop.col[i]) * k;
    Shop.rain += (Shop.rainTarget - Shop.rain) * Math.min(1, dt * 1.2);
    Shop.shutter += (Shop.shutterTarget - Shop.shutter) * Math.min(1, dt * 3.2);
    // 窗外行人
    Shop.spawnT -= dt;
    if (Shop.spawnT <= 0 && Shop.walkers.length < 7) {
      Shop.spawnT = (1.2 + Math.random() * 3.2) / Math.max(0.15, Shop.crowd);
      var dir = Math.random() < 0.5 ? 1 : -1, bike = Math.random() < 0.18;
      Shop.walkers.push({ x: dir > 0 ? WIN.x - 30 : WIN.x + WIN.w + 30, dir: dir, v: (bike ? 110 : 34 + Math.random() * 22) * dir, h: 58 + Math.random() * 14, bike: bike, hue: Math.floor(Math.random() * 5), ph: Math.random() * 6, umb: Shop.rain > 0.5 && !bike });
    }
    for (i = Shop.walkers.length - 1; i >= 0; i--) { var w = Shop.walkers[i]; w.x += w.v * dt; if (w.x < WIN.x - 60 || w.x > WIN.x + WIN.w + 60) Shop.walkers.splice(i, 1); }
    var b = Shop.bus;
    if (b) {
      if (b.stop && b.hold < 5.5 && b.x > 500) { b.v = Math.max(0, b.v - 420 * dt); if (b.v === 0) b.hold += dt; }
      else if (b.stop && b.hold >= 5.5) b.v = Math.min(300, b.v + 240 * dt);
      b.x += b.v * dt; if (b.x > 1400) Shop.bus = null;
    }
  };
  function lum() { return (Shop.col[0] + Shop.col[1] + Shop.col[2]) / 765; }
  Shop.lum = lum;
  var WCOL = ['#3d5a66', '#5a4a3e', '#4a5a48', '#66504a', '#44506a'];
  function drawWindowLife(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(WIN.x, WIN.y, 199, WIN.h); ctx.rect(576, WIN.y, 190, WIN.h); ctx.rect(785, WIN.y, 200, WIN.h); ctx.clip();
    var base = WIN.y + WIN.h + 2, i;
    for (i = 0; i < Shop.walkers.length; i++) {
      var w = Shop.walkers[i], bob = Math.abs(Math.sin(Shop.t * 6 + w.ph)) * 2.5, h = w.h;
      ctx.globalAlpha = 0.72; ctx.fillStyle = WCOL[w.hue];
      if (w.bike) { ctx.fillRect(w.x - 9, base - h + 6, 18, h * 0.5); ctx.beginPath(); ctx.arc(w.x, base - h, 9, 0, 7); ctx.fill(); ctx.strokeStyle = WCOL[w.hue]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w.x - 20, base - 13, 12, 0, 7); ctx.arc(w.x + 20, base - 13, 12, 0, 7); ctx.moveTo(w.x - 20, base - 13); ctx.lineTo(w.x, base - 30); ctx.lineTo(w.x + 20, base - 13); ctx.stroke(); }
      else { ctx.fillRect(w.x - 8, base - h + 16 - bob, 16, h - 16); ctx.beginPath(); ctx.arc(w.x, base - h + 9 - bob, 9.5, 0, 7); ctx.fill(); if (w.umb) { ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(w.x, base - h - 6 - bob, 24, Math.PI, 0); ctx.fill(); ctx.fillRect(w.x - 1, base - h - 6 - bob, 2, 22); } }
    }
    ctx.globalAlpha = 1;
    var b = Shop.bus;
    if (b) {
      var bx = b.x, by = base - 128;
      ctx.fillStyle = '#2f7a70'; U.rr(ctx, bx, by, 360, 122, 14); ctx.fill();
      ctx.fillStyle = '#f2ead4'; ctx.fillRect(bx, by + 62, 360, 26);
      ctx.fillStyle = '#bfe0e6'; for (var k = 0; k < 5; k++) ctx.fillRect(bx + 18 + k * 66, by + 14, 52, 40);
      ctx.fillStyle = '#1f4d47'; ctx.fillRect(bx, by + 110, 360, 12);
      ctx.fillStyle = '#26221e'; ctx.beginPath(); ctx.arc(bx + 70, by + 120, 17, 0, 7); ctx.arc(bx + 290, by + 120, 17, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8b54a'; U.rr(ctx, bx + 300, by + 66, 44, 18, 4); ctx.fill();
      U.text(ctx, '7路', bx + 322, by + 80, { size: 14, bold: true, align: 'center', color: '#3b2a1a' });
    }
    if (Shop.rain > 0.02) {
      ctx.strokeStyle = 'rgba(214,230,240,' + (0.5 * Shop.rain).toFixed(2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
      var n = Shop.lowFx ? 26 : 54;
      for (i = 0; i < n; i++) { var rx = WIN.x + ((i * 97.3 + Shop.t * 260) % (WIN.w + 40)) - 20, ry = WIN.y + ((i * 53.7 + Shop.t * 640) % WIN.h); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(150,170,190,' + (0.16 * Shop.rain).toFixed(2) + ')'; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    }
    ctx.restore();
  }
  // ───────── 纪念物（墙上钉的、架子上摆的）
  var PINS = [[396, 44], [440, 40], [484, 45], [528, 41], [752, 44], [796, 40], [840, 45], [884, 41], [928, 44], [214, 292], [256, 298]];
  var SHELF = [[1052, 210], [1100, 210], [1150, 210], [1052, 258], [1100, 258], [1150, 258], [1052, 306], [1100, 306], [1150, 306]];
  function drawMemento(ctx, kind, x, y, seed) {
    var rot = ((seed * 37) % 11 - 5) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (kind === 'photo') { ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-15, -18, 30, 36); ctx.fillStyle = ['#8fb8a8', '#d8a878', '#9fb0c8', '#c8b078'][seed % 4]; ctx.fillRect(-12, -15, 24, 22); ctx.fillStyle = 'rgba(60,40,20,.5)'; ctx.fillRect(-6, -6, 5, 10); ctx.fillRect(2, -4, 5, 8); ctx.fillStyle = '#c8442f'; ctx.beginPath(); ctx.arc(0, -17, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'note' || kind === 'paper') { ctx.fillStyle = kind === 'note' ? '#fff3b8' : '#f6ecd6'; ctx.fillRect(-14, -17, 28, 34); ctx.strokeStyle = 'rgba(90,70,40,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (var i = 0; i < 4; i++) { ctx.moveTo(-10, -9 + i * 6); ctx.lineTo(10 - (i === 3 ? 8 : 0), -9 + i * 6); } ctx.stroke(); ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(0, -16, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'drawing') { ctx.fillStyle = '#ffffff'; ctx.fillRect(-17, -14, 34, 28); ctx.strokeStyle = '#e07a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-6, -2, 6, 0, 7); ctx.stroke(); ctx.strokeStyle = '#4f8a4b'; ctx.beginPath(); ctx.moveTo(-14, 9); ctx.lineTo(14, 9); ctx.stroke(); ctx.strokeStyle = '#3a6ad0'; ctx.strokeRect(2, -6, 10, 12); ctx.fillStyle = '#c8442f'; ctx.beginPath(); ctx.arc(0, -13, 2.5, 0, 7); ctx.fill(); }
    else if (kind === 'mug') { ctx.fillStyle = '#f4f0e6'; ctx.fillRect(-10, -22, 20, 22); ctx.strokeStyle = '#2f5f9a'; ctx.lineWidth = 2.5; ctx.strokeRect(-10, -22, 20, 22); ctx.beginPath(); ctx.arc(12, -11, 6, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = '#c8442f'; ctx.fillRect(-5, -14, 10, 3); }
    else if (kind === 'food') { ctx.fillStyle = '#e08a2a'; ctx.beginPath(); ctx.ellipse(0, -11, 16, 12, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#a85a14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -11, 6, 12, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#5a7a3a'; ctx.fillRect(-2, -26, 4, 6); }
    else if (kind === 'book') { ctx.fillStyle = '#2f6f66'; ctx.fillRect(-13, -24, 26, 24); ctx.fillStyle = '#f6ecd6'; ctx.fillRect(-10, -3, 23, 3); ctx.fillStyle = '#e8b54a'; ctx.fillRect(-8, -18, 12, 3); }
    else if (kind === 'cloth') { ctx.fillStyle = '#f2ead8'; ctx.fillRect(-16, -14, 32, 14); ctx.fillStyle = '#2f6f66'; ctx.fillRect(-16, -5, 32, 3); ctx.fillStyle = '#d9cdb4'; ctx.fillRect(-16, -9, 32, 1.5); }
    else { ctx.fillStyle = '#f4ead0'; ctx.fillRect(-4, -20, 8, 20); ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.ellipse(0, -24, 3, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#b89a6a'; ctx.fillRect(-9, -2, 18, 3); }
    ctx.restore();
  }
  Shop.drawMemento = drawMemento;
  Shop.mementoSpots = function (list) {
    var pi = 0, si = 0, out = [];
    list.forEach(function (m, i) {
      var k = Story.memento(m.id).kind, wall = k === 'photo' || k === 'note' || k === 'paper' || k === 'drawing', p;
      if (wall) { if (pi < PINS.length) p = PINS[pi++]; else return; } else if (si < SHELF.length) p = SHELF[si++]; else return;
      out.push({ id: m.id, kind: k, x: p[0], y: p[1], seed: i + 3 });
    });
    return out;
  };
  // 背景层：s 可为空（标题等）。o.post 贴了进货单；o.curtain 小满的门帘
  Shop.drawBack = function (ctx, s, o) {
    o = o || {};
    var bg = A.img('bg_room_main');
    if (bg) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#d8b88a'; ctx.fillRect(0, 0, 1280, 720); }
    drawWindowLife(ctx);
    if (s) { var spots = Shop.mementoSpots(s.mementos); if (spots.some(function (m) { return m.y < 60; })) { ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(372, 26); ctx.quadraticCurveTo(460, 30, 552, 26); ctx.moveTo(728, 26); ctx.quadraticCurveTo(840, 30, 952, 26); ctx.stroke(); } spots.forEach(function (m) { ctx.save(); if (m.y < 60) { ctx.translate(m.x, m.y); ctx.scale(0.86, 0.86); ctx.translate(-m.x, -m.y); } drawMemento(ctx, m.kind, m.x, m.y, m.seed); ctx.restore(); }); }
    if (o.post) { ctx.save(); ctx.translate(166, 232); ctx.rotate(0.03); ctx.fillStyle = '#fbf3dc'; ctx.fillRect(-20, -30, 40, 60); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5; ctx.strokeRect(-20, -30, 40, 60); ctx.fillStyle = '#b8432f'; ctx.fillRect(-14, -24, 28, 5); ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.beginPath(); for (var i = 0; i < 6; i++) { ctx.moveTo(-14, -12 + i * 6.5); ctx.lineTo(14, -12 + i * 6.5); } ctx.stroke(); ctx.restore(); }
    if (o.curtain) { ctx.save(); ctx.fillStyle = '#f2ead8'; for (var j = 0; j < 3; j++) { ctx.fillRect(42 + j * 31, 62, 29, 86 + Math.sin(Shop.t * 1.3 + j) * 2); } ctx.fillStyle = '#2f6f66'; ctx.fillRect(42, 62, 91, 7); ctx.fillStyle = '#2f6f66'; ctx.font = 'bold 20px ' + U.FONT; ctx.textAlign = 'center'; ['不', '烧', '心'].forEach(function (ch, j2) { ctx.fillText(ch, 56.5 + j2 * 31, 112); }); ctx.restore(); }
  };
  // 前景台面（玩家的工作台）。人物站在它后面。
  // 外景图：桥头那张街景（原始视觉方案 c10）右下角和右上角烘了几块 UI 框，用旁边的石板路、树补掉。缓存成一张画布。
  var cleaned = {};
  Shop.place = function (id) {
    if (cleaned[id]) return cleaned[id];
    var im = A.img(id); if (!im) return id !== 'bg_street' && A.failed && A.failed[id] ? Shop.place('bg_street') : null;
    if (id !== 'bg_street') return (cleaned[id] = im);
    var c = A.P.createCanvas(1280, 720), g = c.getContext('2d');
    g.drawImage(im, 0, 0, 1280, 720);
    g.drawImage(c, 560, 556, 340, 140, 912, 560, 340, 140);
    g.drawImage(c, 680, 556, 120, 150, 1160, 566, 120, 150);
    g.drawImage(c, 1004, 0, 116, 140, 1146, 0, 116, 140);
    return (cleaned[id] = c);
  };
  // 外景铺满画面，带一点缓慢的推拉
  Shop.drawPlace = function (ctx, id, t, o) {
    o = o || {};
    var im = Shop.place(id), z = 1.03 + Math.sin((t || 0) * 0.11) * 0.012;
    ctx.save(); ctx.translate(640, 360); ctx.scale(z, z); ctx.translate(-640 + Math.sin((t || 0) * 0.07) * 6, -360);
    if (im) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true; } else { ctx.fillStyle = '#d8c09a'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.restore();
    if (o.warm !== false) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = o.tint || 'rgb(255,236,210)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
  };
  // 台面：木板拼的长台，边上一道包铜的沿，板缝、木纹、油渍、刀痕。画一次缓存起来。
  var counterCache = null;
  function buildCounter() {
    var y0 = COUNTER_Y, H = 720 - y0, c = A.P.createCanvas(1280, H + 14), g = c.getContext('2d'), i, j;
    function rnd(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
    // 底色：上浅下深
    var gr = g.createLinearGradient(0, 14, 0, H + 14); gr.addColorStop(0, '#c8884c'); gr.addColorStop(0.18, '#b8783e'); gr.addColorStop(1, '#7c4a22'); g.fillStyle = gr; g.fillRect(0, 14, 1280, H);
    // 木板：每块宽度不一，颜色略有差别
    var x = 0, k = 0;
    while (x < 1280) {
      var w = 150 + Math.floor(rnd(k + 1) * 130), tone = (rnd(k + 7) - 0.5) * 0.16;
      g.fillStyle = tone > 0 ? 'rgba(255,220,170,' + tone.toFixed(3) + ')' : 'rgba(60,30,10,' + (-tone).toFixed(3) + ')'; g.fillRect(x, 14, w, H);
      // 木纹
      g.strokeStyle = 'rgba(90,48,16,.16)'; g.lineWidth = 1.4;
      for (j = 0; j < 7; j++) { var yy = 30 + rnd(k * 13 + j) * (H - 20); g.beginPath(); g.moveTo(x + 4, yy); g.bezierCurveTo(x + w * 0.3, yy + 4 * Math.sin(j + k), x + w * 0.7, yy - 4 * Math.cos(j), x + w - 4, yy + 2); g.stroke(); }
      // 木节
      if (rnd(k + 3) > 0.55) { var kx = x + 20 + rnd(k + 5) * (w - 40), ky = 60 + rnd(k + 9) * (H - 90); g.fillStyle = 'rgba(80,40,14,.28)'; g.beginPath(); g.ellipse(kx, ky, 9, 4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,40,14,.18)'; g.beginPath(); g.ellipse(kx, ky, 16, 7, 0, 0, 7); g.stroke(); }
      // 板缝
      g.fillStyle = 'rgba(50,24,8,.5)'; g.fillRect(x + w - 2, 14, 2, H); g.fillStyle = 'rgba(255,220,170,.12)'; g.fillRect(x + w, 14, 1.5, H);
      x += w; k++;
    }
    // 油渍和刀痕
    for (i = 0; i < 9; i++) { var ox = rnd(i + 40) * 1280, oy = 40 + rnd(i + 60) * (H - 60); var rg = g.createRadialGradient(ox, oy, 2, ox, oy, 24 + rnd(i) * 20); rg.addColorStop(0, 'rgba(70,36,10,.18)'); rg.addColorStop(1, 'rgba(70,36,10,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(ox, oy, 46, 22, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,230,190,.14)'; g.lineWidth = 1;
    for (i = 0; i < 14; i++) { var cx = rnd(i + 90) * 1280, cy = 30 + rnd(i + 120) * (H - 40), a = rnd(i + 150) * 0.8 - 0.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.stroke(); }
    // 前沿：包了一道铜皮的圆边
    var lip = g.createLinearGradient(0, 0, 0, 16); lip.addColorStop(0, '#e9b877'); lip.addColorStop(0.45, '#d09858'); lip.addColorStop(1, '#8a5428'); g.fillStyle = lip; g.fillRect(0, 2, 1280, 14);
    g.fillStyle = 'rgba(255,240,200,.55)'; g.fillRect(0, 3, 1280, 2);
    g.fillStyle = '#6a3e1c'; g.fillRect(0, 15, 1280, 3);
    for (i = 40; i < 1280; i += 160) { g.fillStyle = '#5a3216'; g.beginPath(); g.arc(i, 9, 2.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,230,180,.6)'; g.fillRect(i - 1, 7, 1, 1); }
    // 台面靠里一侧的阴影（灶台底座落在这里）
    var sh = g.createLinearGradient(0, 18, 0, 70); sh.addColorStop(0, 'rgba(40,18,4,.35)'); sh.addColorStop(1, 'rgba(40,18,4,0)'); g.fillStyle = sh; g.fillRect(0, 18, 1280, 52);
    return c;
  }
  Shop.drawCounter = function (ctx) {
    var y = COUNTER_Y;
    ctx.fillStyle = 'rgba(40,22,8,.32)'; ctx.fillRect(0, y - 12, 1280, 14);
    if (!counterCache && A.P && A.P.createCanvas) counterCache = buildCounter();
    if (counterCache) ctx.drawImage(counterCache, 0, y - 14);
    else { ctx.fillStyle = '#b9793f'; ctx.fillRect(0, y, 1280, 720 - y); }
    // 头顶那盏灯落在台面上的一圈暖光
    if (!Shop.lowFx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var f = 0.06 + Math.sin(Shop.t * 1.7) * 0.008; glow(ctx, 640, y + 70, 520, '255,200,130', f.toFixed(3)); ctx.restore(); }
  };
  // 画面最后一层：四角压暗＋一点暖色，让每一屏都像在同一盏灯下
  Shop.grade = function (ctx, warm) {
    var vg = ctx.createRadialGradient(640, 330, 380, 640, 360, 860); vg.addColorStop(0, 'rgba(20,10,4,0)'); vg.addColorStop(1, 'rgba(20,10,4,' + (warm ? 0.42 : 0.34) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
  };
  // 柔光：中心亮、向外淡出的一团光（调用方负责混合模式）
  function glow(ctx, x, y, r, rgb, a) {
    if (r <= 0) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(0.45, 'rgba(' + rgb + ',' + (a * 0.45).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  Shop.glow = glow;
  // 光线叠加（画在人物和台面之上、界面之下）
  Shop.drawLight = function (ctx) {
    var c = Shop.col, l = lum();
    if (l < 0.985) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
      var dark = Math.max(0, 0.92 - l);
      if (dark > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (Shop.candles) { var f = 0.85 + Math.sin(Shop.t * 9) * 0.06 + Math.sin(Shop.t * 23) * 0.04; [[330, 440], [640, 436], [960, 440]].forEach(function (p) { glow(ctx, p[0], p[1] - 10, 250 * f, '255,176,86', (0.5 * f).toFixed(2)); }); }
        else { glow(ctx, 1053, 52, 330, '255,206,130', (dark * 0.95).toFixed(2)); glow(ctx, 640, 520, 520, '255,190,120', (dark * 0.3).toFixed(2)); }
        ctx.restore();
        if (Shop.candles) [[330, 440], [640, 436], [960, 440]].forEach(function (p) { ctx.fillStyle = '#f4ead0'; ctx.fillRect(p[0] - 5, p[1] - 6, 10, 22); ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 14 + Math.sin(Shop.t * 11 + p[0]) * 1.2, 4, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 12, 1.8, 4, 0, 0, 7); ctx.fill(); });
      }
    }
  };
  // 卷帘门（从店里看）：v 0 全开 → 1 全关。关着时屋里只有缝里漏进来的光。
  Shop.drawShutter = function (ctx) {
    var v = Shop.shutter; if (v < 0.01) return;
    ctx.save();
    ctx.fillStyle = 'rgba(14,12,20,' + (0.62 * v).toFixed(2) + ')'; ctx.fillRect(0, 0, 1280, 720);
    function slats(x, y, w, h) {
      var hh = h * v; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
      ctx.fillStyle = '#6f7a80'; ctx.fillRect(x, y, w, hh);
      for (var yy = y + (hh % 16) - 16; yy < y + hh; yy += 16) { ctx.fillStyle = '#8c979c'; ctx.fillRect(x, yy, w, 5); ctx.fillStyle = '#4c555a'; ctx.fillRect(x, yy + 13, w, 3); }
      ctx.fillStyle = '#3c4448'; ctx.fillRect(x, y + hh - 9, w, 9); ctx.fillStyle = '#c8d0d4'; ctx.fillRect(x + w / 2 - 34, y + hh - 7, 68, 4);
      ctx.restore();
      if (v < 0.98) { var g = ctx.createLinearGradient(0, y + hh, 0, y + hh + 90); g.addColorStop(0, 'rgba(255,232,180,' + (0.4 * v).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,232,180,0)'); ctx.fillStyle = g; ctx.fillRect(x, y + hh, w, Math.min(90, h - hh)); }
    }
    slats(360, 72, 630, 266); slats(38, 56, 100, 428);
    ctx.restore();
  };
  return Shop;
});
