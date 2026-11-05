// 会呼吸的场景：背景切换淡入、四套光照（清晨/正午/黄昏/夜晚）＋晴阴雨、窗外行人、落叶、雨丝、积水反光、门帘摆动、灯笼光晕、镜头。
// 所有粒子有数量上限；lowFx（减少动效/低性能）时降级。
BSX.define('game/scene', function (require) {
  var A = require('game/assets');
  var Sc = {
    view: 'ext', time: 'morning', weather: 'sun', shutter: 0, t: 0,
    cam: { x: 640, y: 360, z: 1 }, camFrom: null, camTo: null, camT: 0, camDur: 0, shake: 0,
    prevBg: null, fade: 0, rain: [], leaves: [], walkers: [], lowFx: false, reduceMotion: false, crowd: 0, flash: 0,
    WINDOW: { x: 368, y: 78, w: 610, h: 222 }, DOOR: { x: 12, y: 60, w: 150, h: 430 }
  };
  var CAP = { rain: 140, leaves: 8, walkers: 3 };
  function bgId() {
    if (Sc.view === 'ext') return Sc.weather === 'rain' ? 'bg_ext_rain' : (Sc.time === 'dusk' || Sc.time === 'night') ? 'bg_ext_dusk' : 'bg_ext_morning';
    if (Sc.time === 'night') return 'bg_room_night';
    if (Sc.weather === 'rain') return 'bg_room_rain';
    return 'bg_room_main';
  }
  Sc.set = function (o) {
    var before = bgId();
    for (var k in o) if (o[k] != null) Sc[k] = o[k];
    var after = bgId();
    if (before !== after) { Sc.prevBg = before; Sc.fade = 1; }
  };
  Sc.camTo = null;
  Sc.moveCam = function (x, y, z, ms) {
    if (Sc.reduceMotion) ms = Math.min(ms, 1);
    if (!ms) { Sc.cam = { x: x, y: y, z: z }; Sc.camAnim = null; return; }
    Sc.camAnim = { from: { x: Sc.cam.x, y: Sc.cam.y, z: Sc.cam.z }, to: { x: x, y: y, z: z }, t: 0, d: ms / 1000 };
  };
  Sc.camBusy = function () { return !!Sc.camAnim; };
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  Sc.update = function (dt) {
    Sc.t += dt;
    if (Sc.fade > 0) Sc.fade = Math.max(0, Sc.fade - dt / 0.7);
    if (Sc.camAnim) { var a = Sc.camAnim; a.t += dt; var k = ease(Math.min(1, a.t / a.d)); Sc.cam = { x: a.from.x + (a.to.x - a.from.x) * k, y: a.from.y + (a.to.y - a.from.y) * k, z: a.from.z + (a.to.z - a.from.z) * k }; if (a.t >= a.d) Sc.camAnim = null; }
    if (Sc.shake > 0) Sc.shake = Math.max(0, Sc.shake - dt);
    if (Sc.flash > 0) Sc.flash = Math.max(0, Sc.flash - dt);
    var lim = Sc.lowFx ? 0.35 : 1;
    // 雨
    if (Sc.weather === 'rain') {
      var want = Math.floor(CAP.rain * lim);
      while (Sc.rain.length < want) Sc.rain.push({ x: Math.random() * 1400 - 60, y: Math.random() * 720, v: 700 + Math.random() * 400, l: 10 + Math.random() * 16 });
      Sc.rain.forEach(function (r) { r.y += r.v * dt; r.x -= r.v * 0.12 * dt; if (r.y > 730) { r.y = -20; r.x = Math.random() * 1400 - 60; } });
    } else Sc.rain.length = 0;
    // 落叶（晴/阴）
    if (Sc.weather !== 'rain' && !Sc.lowFx) {
      if (Sc.leaves.length < CAP.leaves && Math.random() < dt * 0.6) Sc.leaves.push({ x: Sc.view === 'room' ? Sc.WINDOW.x + Math.random() * Sc.WINDOW.w : Math.random() * 600, y: Sc.view === 'room' ? Sc.WINDOW.y : 40, vx: 12 + Math.random() * 20, vy: 22 + Math.random() * 14, p: Math.random() * 6, c: Math.random() < 0.5 ? '#c8a23a' : '#7a9a3a' });
      Sc.leaves = Sc.leaves.filter(function (l) { l.p += dt * 3; l.x += (l.vx + Math.sin(l.p) * 18) * dt; l.y += l.vy * dt; return l.y < (Sc.view === 'room' ? Sc.WINDOW.y + Sc.WINDOW.h : 640); });
    } else Sc.leaves.length = 0;
    // 窗外/街上行人
    var wantW = Sc.lowFx ? 1 : CAP.walkers;
    if (Sc.time !== 'night' && Sc.walkers.length < wantW && Math.random() < dt * 0.25) {
      var dir = Math.random() < 0.5 ? 1 : -1;
      Sc.walkers.push({ x: dir > 0 ? -40 : 1320, dir: dir, v: 40 + Math.random() * 30, ph: Math.random() * 6, c: ['#5b6e8c', '#8c5b4a', '#4a7a5a', '#a07a3a', '#6a5a7a'][Math.floor(Math.random() * 5)], h: 0.85 + Math.random() * 0.3, umb: Sc.weather === 'rain' });
    }
    Sc.walkers = Sc.walkers.filter(function (w) { w.x += w.dir * w.v * dt; w.ph += dt * 8; return w.x > -60 && w.x < 1340; });
  };
  function person(ctx, x, foot, h, c, ph, umb) {
    var b = Math.abs(Math.sin(ph)) * 2;
    ctx.fillStyle = c; ctx.fillRect(x - h * 0.13, foot - h * 0.78 - b, h * 0.26, h * 0.42);
    ctx.fillStyle = '#e8c39e'; ctx.beginPath(); ctx.arc(x, foot - h * 0.86 - b, h * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - h * 0.1, foot - h * 0.97 - b, h * 0.2, h * 0.06);
    ctx.fillStyle = '#3d3a40'; var s = Math.sin(ph) * h * 0.08; ctx.fillRect(x - h * 0.1 + s, foot - h * 0.36, h * 0.08, h * 0.36); ctx.fillRect(x + h * 0.02 - s, foot - h * 0.36, h * 0.08, h * 0.36);
    if (umb) { ctx.fillStyle = '#2f6f66'; ctx.beginPath(); ctx.arc(x, foot - h * 1.0, h * 0.3, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 1, foot - h * 1.0, 2, h * 0.3); }
  }
  Sc.person = person;
  function drawBg(ctx, id, alpha) {
    var im = A.img(id);
    if (!im) { ctx.fillStyle = '#2a3a34'; ctx.fillRect(0, 0, 1280, 720); return; }
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(im, 0, 0, 1280, 720); ctx.restore();
  }
  Sc.drawBack = function (ctx) {
    var id = bgId();
    drawBg(ctx, id, 1);
    if (Sc.fade > 0 && Sc.prevBg) drawBg(ctx, Sc.prevBg, Sc.fade);
    var W = Sc.WINDOW;
    if (Sc.view === 'room') {
      // 窗外：行人、落叶、雨丝（裁剪在窗内）
      ctx.save(); ctx.beginPath(); ctx.rect(W.x, W.y, W.w, W.h); ctx.rect(Sc.DOOR.x, Sc.DOOR.y, Sc.DOOR.w, Sc.DOOR.h); ctx.clip();
      ctx.globalAlpha = Sc.time === 'night' ? 0.5 : 0.8;
      Sc.walkers.forEach(function (w) { person(ctx, w.x, W.y + W.h - 18, 46 * w.h, w.c, w.ph, w.umb); });
      ctx.globalAlpha = 1;
      Sc.leaves.forEach(function (l) { ctx.fillStyle = l.c; ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.p); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); });
      if (Sc.weather === 'rain') { ctx.strokeStyle = 'rgba(200,220,240,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); Sc.rain.forEach(function (r) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.l * 0.15, r.y + r.l); }); ctx.stroke(); }
      ctx.restore();
      // 门帘（窗顶蓝布）轻摆：切片位移
      var im = A.img(id);
      if (im && !Sc.reduceMotion) {
        var sx = W.x - 12, sw = W.w + 30, sy = 78, sh = 40;
        for (var i = 0; i < sw; i += 20) { var off = Math.sin(Sc.t * 1.6 + i * 0.03) * 1.8; ctx.drawImage(im, sx + i, sy, 20, sh, sx + i, sy + off, 20, sh); }
      }
      // 灯笼光晕
      var flick = 0.75 + Math.sin(Sc.t * 7.3) * 0.05 + Math.sin(Sc.t * 2.1) * 0.06;
      var lamp = Sc.time === 'night' || Sc.time === 'dusk' || Sc.time === 'dawn' || Sc.weather === 'rain' ? 1 : 0.35;
      glow(ctx, 1048, 30, 120, 'rgba(255,190,90,' + (0.35 * flick * lamp) + ')');
      glow(ctx, 112, 92, 60, 'rgba(255,120,70,' + (0.3 * flick * lamp) + ')');
      // 雨天地面积水反光
      if (Sc.weather === 'rain') { ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#cfe2f0'; ctx.lineWidth = 2; for (var j = 0; j < 7; j++) { var yy = 520 + j * 26, xx = 60 + ((Sc.t * 30 + j * 97) % 260); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 50 + j * 6, yy); ctx.stroke(); } ctx.restore(); }
    } else {
      // 店外：行人、卷帘门、街上落叶
      Sc.walkers.forEach(function (w) { person(ctx, w.x, 650, 96 * w.h, w.c, w.ph, w.umb); });
      Sc.leaves.forEach(function (l) { ctx.fillStyle = l.c; ctx.save(); ctx.translate(l.x, l.y + 100); ctx.rotate(l.p); ctx.fillRect(-4, -2, 8, 4); ctx.restore(); });
      if (Sc.shutter > 0.01) drawShutter(ctx, id);
      if (Sc.weather === 'rain') { ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#d6e6f2'; ctx.lineWidth = 2; for (var q = 0; q < 9; q++) { var y2 = 660 + q * 7, x2 = (Sc.t * 40 + q * 151) % 1280; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 + 70, y2); ctx.stroke(); } ctx.restore(); }
    }
    // 门口人群（剧情用）
    for (var c = 0; c < Sc.crowd; c++) person(ctx, Sc.view === 'ext' ? 120 + c * 70 : 1000 + (c % 3) * 60, Sc.view === 'ext' ? 690 : 470 + Math.floor(c / 3) * 20, Sc.view === 'ext' ? 120 : 90, ['#5b6e8c', '#8c5b4a', '#4a7a5a', '#a07a3a', '#6a5a7a', '#7a3a3a'][c % 6], Sc.t * 2 + c, Sc.weather === 'rain');
  };
  function glow(ctx, x, y, r, col) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
  Sc.glow = glow;
  // 卷帘门：覆盖在店铺门洞
  Sc.SHOP = { ext_morning: { x: 262, y: 246, w: 538, h: 200 }, ext_rain: { x: 400, y: 248, w: 400, h: 230 }, ext_dusk: { x: 232, y: 238, w: 390, h: 280 } };
  function drawShutter(ctx, id) {
    var r = Sc.SHOP[id.replace('bg_', '')] || Sc.SHOP.ext_morning;
    var h = r.h * Sc.shutter;
    ctx.save();
    ctx.fillStyle = '#7f8c86'; ctx.fillRect(r.x, r.y, r.w, h);
    for (var y = r.y + 4; y < r.y + h; y += 9) { ctx.fillStyle = '#93a19a'; ctx.fillRect(r.x, y, r.w, 3); ctx.fillStyle = '#65716b'; ctx.fillRect(r.x, y + 5, r.w, 2); }
    ctx.fillStyle = '#4f5a55'; ctx.fillRect(r.x, r.y + h - 8, r.w, 8);
    ctx.fillStyle = '#c9b27a'; ctx.fillRect(r.x + r.w / 2 - 18, r.y + h - 14, 36, 6);
    ctx.fillStyle = '#4b3a2a'; ctx.fillRect(r.x - 6, r.y - 10, r.w + 12, 12);
    ctx.restore();
  }
  var GRADE = { dawn: ['#7d8fc4', 0.32], morning: ['#ffd9a0', 0.10], noon: null, dusk: ['#ff8a3c', 0.22], night: ['#2a3870', 0.30] };
  Sc.drawFront = function (ctx) {
    if (Sc.view === 'ext' && Sc.weather === 'rain') { ctx.save(); ctx.strokeStyle = 'rgba(210,225,240,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); Sc.rain.forEach(function (r) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.l * 0.15, r.y + r.l); }); ctx.stroke(); ctx.restore(); }
    var g = GRADE[Sc.time];
    var isNightBg = bgId() === 'bg_room_night';
    if (g && !(isNightBg && Sc.time === 'night')) { ctx.save(); ctx.globalCompositeOperation = Sc.time === 'morning' ? 'soft-light' : 'multiply'; ctx.globalAlpha = g[1]; ctx.fillStyle = g[0]; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
    if (Sc.weather === 'cloud') { ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#6a7680'; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
    if (Sc.flash > 0) { ctx.save(); ctx.globalAlpha = Sc.flash * 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1280, 720); ctx.restore(); }
  };
  Sc.applyCam = function (ctx) {
    var c = Sc.cam, sx = 0, sy = 0;
    if (Sc.shake > 0 && !Sc.reduceMotion) { sx = (Math.random() - 0.5) * 8 * Sc.shake; sy = (Math.random() - 0.5) * 8 * Sc.shake; }
    // 镜头不露空：限制中心使视窗留在 1280×720 内
    var hw = 640 / c.z, hh = 360 / c.z, cx = Math.max(hw, Math.min(1280 - hw, c.x)), cy = Math.max(hh, Math.min(720 - hh, c.y));
    ctx.translate(640 + sx, 360 + sy); ctx.scale(c.z, c.z); ctx.translate(-cx, -cy);
  };
  Sc.toScreen = function (x, y) { var c = Sc.cam, hw = 640 / c.z, hh = 360 / c.z, cx = Math.max(hw, Math.min(1280 - hw, c.x)), cy = Math.max(hh, Math.min(720 - hh, c.y)); return { x: (x - cx) * c.z + 640, y: (y - cy) * c.z + 360 }; };
  Sc.bgId = bgId;
  return Sc;
});
