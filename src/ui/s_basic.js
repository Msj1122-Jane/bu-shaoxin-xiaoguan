// 加载 / 标题 / 暂停与设置 / 回看日志 / 新月份（传承物）/ 常营业主题选择
BSX.define('ui/s_basic', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var EN = require('content/endings');
  var Legacy = require('core/legacy');
  var X = {};

  // ───────── 加载
  X.Loading = function (app) {
    var self = this; this.name = 'loading'; this.app = app; this.p = 0; this.t = 0; this.state = 'loading';
    this.start();
  };
  X.Loading.prototype.start = function () {
    var self = this; this.state = 'loading'; this.p = 0; A.errors.length = 0; A.groupState = {};
    A.loadGroup('pre', null, function () {
      A.loadGroup('boot', function (p) { self.p = p * 0.75; }, function () {
        A.loadGroup('chars', function (p) { self.p = 0.75 + p * 0.25; }, function () {
          self.p = 1; self.state = A.errors.length ? 'error' : 'done';
          if (!A.errors.length) { A.loadGroup('late'); A.loadGroup('story'); }
        });
      });
    });
    this.tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  };
  // 加载完：像素风“点一下进门”（顺便解锁音频），首次进入播放片头，之后直接到首页
  X.Loading.prototype.update = function (dt) {
    this.t += dt;
    if (this.state === 'done' && !this.doneT) this.doneT = this.t;
    var pr = this.app.P.params, auto = ((pr && (pr.has('dev') || pr.has('auto'))) || this.app.P.webdriver) && !(pr && pr.has('intro'));
    if (this.state === 'done' && auto && this.t > 0.4) this.enter();
  };
  X.Loading.prototype.enter = function () {
    if (this.entered) return; this.entered = true;
    var st = this.app.P.storage, seen = false; try { seen = st.get('bsx_intro') === '1'; } catch (e) {}
    var pr = this.app.P.params, force = pr && pr.has('intro'), auto = ((pr && (pr.has('dev') || pr.has('auto'))) || this.app.P.webdriver) && !force;
    var nu = !(pr && pr.has('oldui'));
    if (((!seen && !auto) && nu) || force) { try { st.set('bsx_intro', '1'); } catch (e) {} this.app.go(X.Intro); } else this.app.go(X.Title);
  };
  // 加载页小贴士：物品描述里藏着里剧情（单看是闲笔，合起来是真相）
  var TIPS = ['旧油壶底有一层洗不掉的黄。父亲说，那是好油留下的。', '蒸笼用了十几年，竹篾磨得发亮。', '靠窗那张桌子，桌板有点松。',
    '赵爷爷每天只喝一碗粥，从不加糖。', '老秦的菜筐里，最好的那筐总是放在最底下。', '父亲的旧茶杯，杯口缺了一小块。', '账本封皮上的“周记”，是父亲用毛笔写的。',
    '好油炸出来的油条，放凉了也不塌。', '巷口那棵槐树，比周记还老。'];
  X.Loading.prototype.draw = function (ctx) {
    var self = this, app = this.app, t = this.t, bg = A.img('loading_bg');
    ctx.fillStyle = '#17110c'; ctx.fillRect(0, 0, 1280, 720);
    if (bg) { ctx.save(); ctx.imageSmoothingEnabled = false; var z = 1.04 + Math.sin(t * 0.3) * 0.01; ctx.drawImage(bg, 640 - 640 * z, 360 - 360 * z, 1280 * z, 720 * z); ctx.restore(); }
    else { pixelShutter(ctx, 340, 150, 600, 330, 1, t); }
    // 底部：木招牌进度条 + 小贴士
    ctx.fillStyle = 'rgba(20,12,6,.72)'; ctx.fillRect(0, 556, 1280, 164);
    ctx.fillStyle = '#3b2412'; ctx.fillRect(236, 600, 808, 34); ctx.fillStyle = '#5a3418'; ctx.fillRect(240, 604, 800, 26);
    var fw = Math.round(792 * this.p / 8) * 8; ctx.fillStyle = '#f2b440'; ctx.fillRect(244, 608, fw, 18); ctx.fillStyle = '#ffe08a'; ctx.fillRect(244, 608, fw, 5);
    U.pixelText(ctx, this.tip || '', 640, 676, { size: 22, px: 2, align: 'center', color: '#f2e2c0', outline: '#1e120a' });
    U.pixelText(ctx, this.state === 'done' ? '' : '正在备料开铺…  ' + Math.round(this.p * 100) + '%', 640, 582, { size: 22, px: 2, align: 'center', color: '#ffe08a', outline: '#1e120a' });
    if (this.state === 'done') {
      var k = 0.6 + Math.sin(t * 4) * 0.4;
      U.hit('load_enter', 0, 0, 1280, 720, { label: '进门', minSize: 0, onTap: function () { self.enter(); } });
      U.pixelText(ctx, '点一下，进门', 640, 582, { size: 30, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412', alpha: k });
    } else if (this.state === 'error') U.pixelText(ctx, '有 ' + A.errors.length + ' 个资源没加载上', 640, 520, { size: 26, px: 2, align: 'center', color: '#e8c89a', outline: '#2a1a10' });
    if (this.state === 'error') {
      A.errors.slice(0, 3).forEach(function (e, i) { U.text(ctx, e.path, 640, 650 + i * 22, { size: 16, align: 'center', color: '#ffb08a' }); });
      U.button(ctx, 'load_retry', 420, 470, 200, 60, '重试', { onTap: function () { self.start(); } });
      U.button(ctx, 'load_continue', 660, 470, 220, 60, '用占位继续', { kind: 'wood', onTap: function () { self.state = 'done'; self.enter(); } });
    }
  };
  // 像素卷帘门：横条、铆钉、底杠、把手、锈迹；k=放下比例
  function pixelShutter(ctx, x, y, w, h, k, t) {
    var hh = Math.round(h * k); if (hh <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
    for (var yy = y + hh - h; yy < y + hh; yy += 12) {
      ctx.fillStyle = '#7d8a84'; ctx.fillRect(x, yy, w, 12);
      ctx.fillStyle = '#9aa7a0'; ctx.fillRect(x, yy, w, 3);
      ctx.fillStyle = '#5f6b66'; ctx.fillRect(x, yy + 9, w, 3);
    }
    ctx.fillStyle = 'rgba(120,70,30,.25)'; for (var i = 0; i < 9; i++) ctx.fillRect(x + ((i * 97) % (w - 30)), y + hh - h + ((i * 61) % h), 18, 6);
    ctx.restore();
    ctx.fillStyle = '#3e4844'; ctx.fillRect(x, y + hh - 10, w, 10); ctx.fillStyle = '#2a302d'; ctx.fillRect(x, y + hh - 2, w, 2);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(x + w / 2 - 22, y + hh - 18, 44, 8); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(x + w / 2 - 22, y + hh - 12, 44, 2);
    ctx.fillStyle = '#3b2412'; ctx.fillRect(x - 8, y - 12, w + 16, 14); ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 8, y - 12, w + 16, 4);
  }
  X.pixelShutter = pixelShutter;
  // 像素小木牌标签（替代圆角按钮）
  function tag(ctx, id, label, cx, cy, o) {
    o = o || {}; var tw = U.pixelText(ctx, label, -9999, -9999, { size: o.size || 26, px: 2, color: '#fff3d6' }).w, w = tw + 28, h = 42, x = cx - w / 2, y = cy - h / 2;
    var hit = U.hit(id, o.hx != null ? o.hx : x, o.hy != null ? o.hy : y, o.hw || w, o.hh || h, { label: label, onTap: o.onTap, onDown: o.onDown, minSize: 44 });
    var lift = hit.pressed ? 2 : U.hover === id ? -2 : 0;
    ctx.fillStyle = 'rgba(30,18,8,.45)'; ctx.fillRect(x + 4, y + 6, w, h);
    ctx.fillStyle = '#3b2412'; ctx.fillRect(x - 2, y - 2 + lift, w + 4, h + 4);
    ctx.fillStyle = o.red ? '#a8432f' : '#8a5a2a'; ctx.fillRect(x, y + lift, w, h);
    ctx.fillStyle = o.red ? '#c8604a' : '#a8743c'; ctx.fillRect(x, y + lift, w, 4);
    ctx.fillStyle = '#e8c070'; ctx.fillRect(x + 6, y + 6 + lift, 3, 3); ctx.fillRect(x + w - 9, y + 6 + lift, 3, 3);
    U.pixelText(ctx, label, cx, cy + lift + 1, { size: o.size || 26, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412' });
    return hit;
  }
  X.tag = tag;
  function glowAt(ctx, x, y, r, col) { Sc.glow(ctx, x, y, r, col); }

  // ───────── 片头：四个镜头，约 17 秒，点一下跳过
  X.Intro = function (app) {
    this.name = 'intro'; this.app = app; this.t = 0; this.parts = []; this.fired = {};
    Sc.set({ view: 'ext', time: 'morning', weather: 'sun', shutter: 0, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    Au.music('bgm_dawn');
  };
  var SHOTS = [
    { from: 0, to: 4.6, text: '清晨五点，老街还没醒。' },
    { from: 4.6, to: 9.2, text: '巷口那间早点铺，灯先亮了。' },
    { from: 9.2, to: 13.4, text: '一锅粥，熬的是米，也是良心。' },
    { from: 13.4, to: 18.5, text: '' }
  ];
  X.Intro.prototype.update = function (dt) {
    this.t += dt; var t = this.t, self = this;
    var once = function (k, fn) { if (t >= k && !self.fired[k]) { self.fired[k] = 1; fn(); } };
    once(5.0, function () { Au.play('bell'); });
    once(9.3, function () { Au.play('bubble'); Au.play('steam'); });
    once(11.2, function () { Au.play('bubble'); });
    for (var i = 0; i < 5; i++) once(14.2 + i * 0.22, (function (j) { return function () { Au.play('stamp'); self.dust(360 + j * 85, 160); }; })(i));
    once(15.7, function () { Au.play('open'); });
    // 蒸汽粒子
    var steamOn = (t > 5.2 && t < 9.2) || (t > 9.2 && t < 13.4) || t > 13.4;
    if (steamOn && Math.random() < (t > 9.2 && t < 13.4 ? 0.9 : 0.35)) {
      var close = t > 9.2 && t < 13.4;
      this.parts.push({ x: close ? 560 + Math.random() * 180 : 660 + Math.random() * 90, y: close ? 380 : 360, vx: (Math.random() - 0.5) * 14, vy: close ? -60 - Math.random() * 40 : -30 - Math.random() * 20, r: close ? 22 + Math.random() * 20 : 8 + Math.random() * 8, life: close ? 2.4 : 2, t: 0, k: 'steam' });
    }
    this.parts.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.k === 'dust' ? 260 : 0) * dt; });
    this.parts = this.parts.filter(function (p) { return p.t < p.life; });
    if (t > 18.5) this.app.go(X.Title, { fromIntro: true });
  };
  X.Intro.prototype.dust = function (x, y) { for (var i = 0; i < 10; i++) this.parts.push({ x: x, y: y + 30, vx: (Math.random() - 0.5) * 220, vy: -80 - Math.random() * 90, r: 3 + Math.random() * 3, life: 0.7, t: 0, k: 'dust' }); };
  X.Intro.prototype.draw = function (ctx) {
    var t = this.t, self = this, img = function (id) { return A.img(id); };
    var shot = t < 4.6 ? 0 : t < 9.2 ? 1 : t < 13.4 ? 2 : 3, s = SHOTS[shot], lt = t - s.from;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (shot === 2) {
      // 特写：灶上的锅，缓慢推近
      var z = 1 + lt * 0.035, k2 = img('bg_kitchen_closeup');
      ctx.translate(640, 380); ctx.scale(z, z); ctx.translate(-640, -380);
      if (k2) ctx.drawImage(k2, 0, 0, 1280, 720);
      glowAt(ctx, 640, 470, 260, 'rgba(255,170,80,' + (0.25 + Math.sin(t * 7) * 0.05) + ')');
    } else {
      var pan = shot === 0 ? -40 + lt * 6 : shot === 1 ? -12 + lt * 2.6 : 0, zz = shot === 3 ? 1 : 1.06;
      ctx.translate(640, 360); ctx.scale(zz, zz); ctx.translate(-640 + pan, -360);
      var bg = img('bg_ext_morning'); if (bg) ctx.drawImage(bg, 0, 0, 1280, 720);
      // 店门：卷帘门（第二镜头末尾拉起一条缝，透出暖光）
      var open = shot === 1 ? Math.min(0.2, Math.max(0, (lt - 1.5) * 0.08)) : 0;
      if (open > 0) { ctx.fillStyle = 'rgba(255,190,100,.55)'; ctx.fillRect(304, 552 - (552 - 238) * open, 482, (552 - 238) * open); }
      pixelShutter(ctx, 304, 238, 482, 314, 1 - open, t);
      // 夜色 → 拂晓
      var night = shot === 0 ? 0.78 : shot === 1 ? Math.max(0.25, 0.78 - lt * 0.14) : 0;
      if (night > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,52,110,' + night + ')'; ctx.fillRect(-100, 0, 1500, 720); ctx.restore();
        for (var i = 0; i < 40; i++) { var sx = (i * 173) % 1280, sy = (i * 67) % 110, tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = 'rgba(255,250,220,' + (night * 0.9 * tw) + ')'; ctx.fillRect(sx, sy, 3, 3); }
      }
      // 灯笼（第二镜头 0.4 秒时点亮）
      var lit = shot >= 2 || (shot === 1 && lt > 0.4);
      if (lit) { var fl = 0.8 + Math.sin(t * 9) * 0.08; glowAt(ctx, 822, 280, 150, 'rgba(255,170,70,' + 0.55 * fl + ')'); if (shot === 1 && lt < 0.8) { ctx.fillStyle = 'rgba(255,230,160,' + (0.8 - lt) + ')'; ctx.fillRect(-100, 0, 1500, 720); } }
      // 第四镜头：招牌上的字一个个落下来
      if (shot === 3) {
        var chars = ['不', '烧', '心', '小', '馆'];
        chars.forEach(function (ch, j) {
          var st = 0.8 + j * 0.22, p = Math.max(0, Math.min(1, (lt - st) / 0.28)); if (p <= 0) return;
          var yy = 150 - (1 - p) * 220 + (p >= 1 ? Math.sin(Math.min(1, (lt - st - 0.28) / 0.25) * Math.PI) * -8 : 0);
          var full = U.pixelText(ctx, '不烧心小馆', -9999, -9999, { size: 84, px: 4, color: '#5a2a12', outline: '#f3e3c0', shadow: '#c8a878' }).w, cw = (full - 24) / 5, cx0 = 531 - full / 2 + 12 + cw / 2;
          U.pixelText(ctx, ch, cx0 + j * cw, yy, { size: 84, px: 4, align: 'center', color: '#5a2a12', outline: '#f3e3c0', shadow: '#c8a878' });
        });
        if (lt > 2.4) U.pixelText(ctx, '一个月 · 一间早餐铺 · 一条街的人', 640, 676, { size: 28, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412', alpha: Math.min(1, (lt - 2.4) * 2) });
      }
    }
    // 粒子
    this.parts.forEach(function (p) { var a = 1 - p.t / p.life; if (p.k === 'dust') { ctx.fillStyle = 'rgba(200,170,120,' + a + ')'; ctx.fillRect(p.x, p.y, p.r, p.r); } else { ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * a) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 0.6), 0, 7); ctx.fill(); } });
    ctx.restore();
    // 电影黑边 + 字幕（像素字，逐字打出）
    if (shot < 3) {
      ctx.fillStyle = '#0b0805'; ctx.fillRect(0, 0, 1280, 56); ctx.fillRect(0, 664, 1280, 56);
      var n = Math.min(s.text.length, Math.floor(Math.max(0, lt - 0.5) * 9));
      if (n > 0) U.pixelText(ctx, s.text.slice(0, n), 640, 692, { size: 30, px: 2, align: 'center', color: '#fff3d6', outline: '#0b0805' });
    }
    // 镜头切换：像素溶解
    var edges = [4.6, 9.2, 13.4], d = 0.35;
    edges.forEach(function (e) { var k = 1 - Math.abs(t - e) / d; if (k <= 0) return; ctx.fillStyle = '#0b0805'; for (var gy = 0; gy < 720; gy += 40) for (var gx = 0; gx < 1280; gx += 40) { var h = ((gx * 73856093) ^ (gy * 19349663)) % 1000 / 1000; if (h < k) ctx.fillRect(gx, gy, 40, 40); } });
    if (t < 0.6) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.6) + ')'; ctx.fillRect(0, 0, 1280, 720); }
    U.hit('intro_skip', 0, 0, 1280, 720, { label: '跳过片头', minSize: 0, onTap: function () { self.app.go(X.Title, { fromIntro: true }); } });
    U.pixelText(ctx, '点一下跳过', 1240, 30, { size: 20, px: 2, align: 'right', color: '#c8b8a0', outline: '#0b0805', alpha: 0.7 });
  };
  X.Intro.prototype.describe = function () { return { t: Math.round(this.t * 10) / 10 }; };
  X.Loading.prototype.describe = function () { return { progress: Math.round(this.p * 100) / 100, state: this.state, errors: A.errors.map(function (e) { return e.id; }) }; };

  // ───────── 标题
  // ───────── 首页：画就是菜单（卷帘门=开门，小黑板=重新开张，墙上告示=店史，电表箱=设置，自行车=常营业）
  X.TitleNew = function (app, p) {
    this.name = 'title'; this.app = app; this.t = 0; this.lift = 0; this.hold = 0; this.go = null; this.parts = [];
    Sc.set({ view: 'ext', time: 'morning', weather: 'sun', shutter: 0, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    var r = app.store.loadRun(); this.canContinue = !!(r && r.state.phase !== 'ended'); this.contDay = r ? r.state.day : 0; this.contMode = r ? r.state.mode : null;
    this.notice = app.store.notice; app.store.notice = null;
    Au.setAmbience('morning', false); Au.music('bgm_dawn');
  };
  X.TitleNew.prototype.update = function (dt) {
    this.t += dt;
    if (this.holding) { this.hold = Math.min(1, this.hold + dt / 0.55); if (this.hold >= 1) this.fire(); } else if (!this.go) this.hold = Math.max(0, this.hold - dt * 2);
    if (this.go) { this.lift = Math.min(1, this.lift + dt * 1.6); if (this.lift >= 1 && !this.go.done) { this.go.done = true; this.go.fn(); } }
    if (Math.random() < 0.3) this.parts.push({ x: 660 + Math.random() * 90, y: 350, vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 16, r: 7 + Math.random() * 7, life: 2.2, t: 0 });
    this.parts.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }); this.parts = this.parts.filter(function (p) { return p.t < p.life; });
  };
  X.TitleNew.prototype.action = function () {
    var app = this.app, self = this, any = app.legacy.runs > 0;
    if (this.canContinue) return function () { if (!app.continueRun()) app.notice('没有可继续的存档'); };
    return function () { if (any) { self.go = null; self.lift = 0; app.openOverlay(X.NewMonth); } else app.newRun({ seed: (Date.now() % 1e9) >>> 0 }); };
  };
  X.TitleNew.prototype.fire = function () { if (this.go) return; this.holding = false; Au.play('shutter'); this.go = { fn: this.action(), done: false }; };
  X.TitleNew.prototype.draw = function (ctx) {
    var app = this.app, self = this, L = app.legacy, t = this.t, any = L.runs > 0;
    Sc.drawBack(ctx); Sc.drawFront(ctx);
    // 卷帘门后：拉起时露出店里的暖光
    var k = 1 - Math.max(this.lift, this.hold * 0.18);
    if (k < 1) { ctx.fillStyle = 'rgba(255,190,110,.35)'; ctx.fillRect(304, 238 + 314 * k, 482, 314 * (1 - k)); }
    pixelShutter(ctx, 304, 238, 482, 314, k, t);
    // 招牌：像素店名
    U.pixelText(ctx, '不烧心小馆', 531, 150, { size: 84, px: 4, align: 'center', color: '#5a2a12', outline: '#f3e3c0', shadow: '#c8a878' });
    // 灯笼光、蒸汽
    Sc.glow(ctx, 822, 280, 140, 'rgba(255,170,70,' + (0.35 + Math.sin(t * 8) * 0.04) + ')');
    this.parts.forEach(function (p) { ctx.fillStyle = 'rgba(255,255,255,' + 0.3 * (1 - p.t / p.life) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 0.5), 0, 7); ctx.fill(); });
    // 卷帘门本身就是“开门”：按住往上拉（点一下也行）
    var mainId = this.canContinue ? 'title_continue' : 'title_start';
    U.hit(mainId, 304, 238, 482, 314, { label: this.canContinue ? '接着营业' : '开门营业', minSize: 0,
      onTap: function () { self.fire(); },
      onDown: function () { self.holding = true; Au.play('knob'); return function (type) { if (type === 'up') { self.holding = false; self.fire(); } else if (type === 'cancel') self.holding = false; }; } });
    if (!this.go) {
      var pulse = 0.65 + Math.sin(t * 3.2) * 0.35;
      U.pixelText(ctx, this.canContinue ? '接着营业' : '开门营业', 545, 360, { size: 56, px: 4, align: 'center', color: '#fff8e8', outline: '#3b2412', alpha: 0.95 });
      U.pixelText(ctx, this.canContinue ? (this.contMode === 'week' ? '常营业' : '第 ' + this.contDay + ' 日') + ' · 按住拉开卷帘门' : '按住，拉开卷帘门', 545, 430, { size: 30, px: 2, align: 'center', color: '#fff3c0', outline: '#2a1a0c', alpha: 0.75 + pulse * 0.25 });
      // 手指提示
      // 往上推的像素箭头（三层，依次亮起）
      for (var ai = 0; ai < 3; ai++) { var on = Math.floor(t * 4) % 3 === 2 - ai, ay = 470 + ai * 18; ctx.fillStyle = on ? '#ffe8a8' : 'rgba(255,248,232,.45)'; for (var aj = 0; aj < 6; aj++) { ctx.fillRect(545 - 4 - aj * 4, ay + aj * 4, 8, 4); ctx.fillRect(545 - 4 + aj * 4, ay + aj * 4, 8, 4); } }
    }
    // 小黑板（有存档或玩过时）：重新开张 / 新的一月
    if (this.canContinue || any) {
      ctx.fillStyle = '#5a3418'; ctx.fillRect(70, 470, 8, 120); ctx.fillRect(196, 470, 8, 120);
      ctx.fillStyle = '#3b2412'; ctx.fillRect(56, 392, 162, 112); ctx.fillStyle = '#2f3a34'; ctx.fillRect(62, 398, 150, 100);
      var nb = U.hit('title_start', 56, 392, 162, 112, { label: any ? '新的一月' : '重新开张', onTap: function () { var go = function () { if (any) app.openOverlay(X.NewMonth); else app.newRun({ seed: (Date.now() % 1e9) >>> 0 }); }; if (self.canContinue) app.openOverlay(X.Confirm, { text: '开新的一月会覆盖当前进度（' + (self.contMode === 'week' ? '常营业' : '第' + self.contDay + '日') + '）。店史、图鉴和结局印章不受影响。', ok: '覆盖并开始', onOk: go }); else go(); } });
      if (this.canContinue && this.go) {} // 占位：正在开门时不再响应
      U.pixelText(ctx, any ? '新的一月' : '重新开张', 137, 432 + (nb.pressed ? 2 : 0), { size: 28, px: 2, align: 'center', color: '#f2f2e8', outline: '#1e2622' });
      U.pixelText(ctx, any ? '带着店史再开一次' : '从第 1 日开始', 137, 470, { size: 18, px: 2, align: 'center', color: '#c8d8c8' });
    }
    // 墙上告示 = 店史
    tag(ctx, 'title_history', L.runs ? '店史 · 印章 ' + Object.keys(L.endings).length + '/9' : '店史', 1010, 410, { hx: 950, hy: 290, hw: 120, hh: 140, onTap: function () { app.go(BSX.require('ui/s_codex').Codex, { from: 'title' }); } });
    // 电表箱 = 设置
    tag(ctx, 'title_settings', '设置', 940, 236, { size: 22, hx: 900, hy: 140, hw: 80, hh: 120, onTap: function () { app.openOverlay(X.Settings); } });
    // 自行车 = 常营业（首次结局后才出现）
    if (any) tag(ctx, 'title_week', '常营业', 1145, 600, { hx: 1020, hy: 420, hw: 250, hh: 200, onTap: function () { app.openOverlay(X.WeekPick); } });
    U.pixelText(ctx, '一个月 · 一间早餐铺 · 一条街的人', 640, 690, { size: 26, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412' });
    if (this.notice) { U.panel(ctx, 520, 600, 700, 80, 'dark'); U.para(ctx, this.notice, 540, 632, 660, { size: 20, color: '#ffd9b0', lh: 28 }); }
  };
  // ───────── 首页（Lovart 封面：街角周记 + 木牌按钮，用户 11-11 提供）
  X.TitleArt = function (app, p) {
    this.name = 'title'; this.app = app; this.t = 0;
    var r = app.store.loadRun(); this.canContinue = !!(r && r.state.phase !== 'ended'); this.contDay = r ? r.state.day : 0; this.contMode = r ? r.state.mode : null;
    this.pages = (r && r.state.pages) || [];
    this.notice = app.store.notice; app.store.notice = null;
    Au.setAmbience('morning', false); Au.music('bgm_dawn');
  };
  X.TitleArt.prototype.update = function (dt) { this.t += dt; };
  function imgButton(ctx, id, imgId, x, y, w, o) {
    o = o || {}; var im = A.img(imgId), h = im ? Math.round(im.height * w / im.width) : 80;
    var hit = U.hit(id, x, y, w, h, { label: o.label, onTap: o.disabled ? null : o.onTap, minSize: 44 });
    var hov = U.hover === id && !o.disabled, dy = hit.pressed ? 3 : hov ? -3 : 0, sc = hov ? 1.03 : 1;
    ctx.save(); if (o.disabled) ctx.globalAlpha = 0.45;
    if (im) { ctx.translate(x + w / 2, y + h / 2 + dy); ctx.scale(sc, sc); ctx.drawImage(im, -w / 2, -h / 2, w, h); }
    else { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x, y, w, h); U.pixelText(ctx, o.label || id, x + w / 2, y + h / 2, { size: 24, px: 2, align: 'center', color: '#fff3d6' }); }
    ctx.restore(); return { hit: hit, h: h };
  }
  X.imgButton = imgButton;
  X.TitleArt.prototype.draw = function (ctx) {
    var app = this.app, self = this, L = app.legacy, t = this.t, any = L.runs > 0, bg = A.img('cover_bg');
    if (bg) { ctx.save(); ctx.imageSmoothingEnabled = false; var z = 1.02 + Math.sin(t * 0.25) * 0.01; ctx.drawImage(bg, 640 - 640 * z + Math.sin(t * 0.2) * 6, 360 - 360 * z, 1280 * z, 720 * z); ctx.restore(); }
    else { Sc.drawBack(ctx); Sc.drawFront(ctx); }
    // 左侧压暗，让牌匾和按钮站得住
    var g = ctx.createLinearGradient(0, 0, 560, 0); g.addColorStop(0, 'rgba(24,14,6,.55)'); g.addColorStop(1, 'rgba(24,14,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 560, 720);
    var pl = A.img('title_plaque'), bob = Math.sin(t * 1.4) * 3;
    if (pl) { var pw = 440, ph = pl.height * pw / pl.width; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(pl, 46, 24 + bob, pw, ph); ctx.restore(); }
    else U.pixelText(ctx, '不烧心小馆', 266, 120, { size: 72, px: 4, align: 'center', color: '#fff3d6', outline: '#3b2412' });
    var x = 126, y = 292, w = 288, gap = 98;
    var startFn = function () { var go = function () { if (any) app.openOverlay(X.NewMonth); else app.newRun({ seed: (Date.now() % 1e9) >>> 0 }); }; if (self.canContinue) app.openOverlay(X.Confirm, { text: '开新的一月会覆盖当前进度（' + (self.contMode === 'week' ? '常营业' : '第' + self.contDay + '日') + '）。店史、图鉴和结局印章不受影响。', ok: '覆盖并开始', onOk: go }); else go(); };
    imgButton(ctx, 'title_start', 'btn_start', x, y, w, { label: any ? '新的一月' : '开始游戏', onTap: startFn });
    imgButton(ctx, 'title_continue', 'btn_continue', x, y + gap, w, { label: '继续游戏', disabled: !this.canContinue, onTap: function () { if (!app.continueRun()) app.notice('没有可继续的存档'); } });
    if (this.canContinue) X.tag(ctx, 'title_cont_day', this.contMode === 'week' ? '常营业' : '第 ' + this.contDay + ' 日', x + w + 54, y + gap + 44, { size: 20, onTap: function () { if (!app.continueRun()) app.notice('没有可继续的存档'); } });
    imgButton(ctx, 'title_history', 'btn_records', x, y + gap * 2, w, { label: '旧账图鉴', onTap: function () { app.go(BSX.require('ui/s_codex').Codex, { from: 'title' }); } });
    imgButton(ctx, 'title_settings', 'btn_settings', x, y + gap * 3, w, { label: '游戏设置', onTap: function () { app.openOverlay(X.Settings); } });
    // 右下角：旧账本（宝箱）、常营业（日历）
    imgButton(ctx, 'title_ledger', 'ico_chest', 1170, 614, 84, { label: '旧账本', onTap: function () { app.openOverlay(X.Ledger, { pages: self.pages }); } });
    U.pixelText(ctx, '旧账本', 1212, 600, { size: 18, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a' });
    if (any) { imgButton(ctx, 'title_week', 'ico_calendar', 1070, 614, 84, { label: '常营业', onTap: function () { app.openOverlay(X.WeekPick); } }); U.pixelText(ctx, '常营业', 1112, 600, { size: 18, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a' }); }
    if (L.runs) U.pixelText(ctx, '店史 · 第 ' + L.runs + ' 个月 · 印章 ' + Object.keys(L.endings).length + '/9', 1250, 30, { size: 18, px: 2, align: 'right', color: '#fff3d6', outline: '#1e120a' });
    if (this.notice) { U.panel(ctx, 520, 600, 520, 80, 'dark'); U.para(ctx, this.notice, 540, 632, 480, { size: 20, color: '#ffd9b0', lh: 28 }); }
  };
  X.TitleArt.prototype.describe = function () { return { canContinue: this.canContinue, continueDay: this.contDay, legacyRuns: this.app.legacy.runs, notice: this.notice, pages: this.pages }; };

  // ───────── 旧账本：七页，找回的能翻看；第 7 页空白，真结局后写上
  X.Ledger = function (app, p) { this.name = 'ledger_book'; this.app = app; this.t = 0; this.p = p || {}; this.sel = null; };
  X.Ledger.prototype.update = function (dt) { this.t += dt; };
  X.Ledger.prototype.draw = function (ctx) {
    var app = this.app, self = this, ST = BSX.require('content/story'), L = app.legacy;
    var have = {}; (L.pages || []).concat(this.p.pages || []).concat(app.state && app.state.pages || []).forEach(function (n) { have[n] = true; });
    var bk = A.img('ledger_book');
    ctx.fillStyle = 'rgba(14,9,5,.86)'; ctx.fillRect(0, 0, 1280, 720);
    if (bk) { ctx.save(); ctx.globalAlpha = 0.35; ctx.drawImage(bk, 0, 0, 1280, 720); ctx.restore(); }
    U.pixelText(ctx, '父亲的旧账本', 640, 62, { size: 40, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412' });
    var n = Object.keys(have).length;
    U.pixelText(ctx, '找回 ' + n + ' / 7 页', 640, 108, { size: 22, px: 2, align: 'center', color: '#e8c89a', outline: '#1e120a' });
    if (this.sel == null) { for (var q = 1; q <= 7; q++) if (have[q]) { this.sel = q; break; } }
    ST.pages.forEach(function (pg, i) {
      var x = 70 + i * 162, y = 150, w = 130, h = 162, on = have[pg.n], im = A.img('ledger_page_' + pg.n);
      U.hit('ledger_p' + pg.n, x, y, w, h, { label: '第' + pg.n + '页', onTap: on ? function () { self.sel = pg.n; } : null });
      ctx.save();
      if (on && im) { ctx.drawImage(im, x, y, w, h); if (self.sel === pg.n) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 4; ctx.strokeRect(x - 4, y - 4, w + 8, h + 8); } }
      else { ctx.fillStyle = 'rgba(255,240,210,.08)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,240,210,.3)'; ctx.setLineDash([6, 6]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]); U.pixelText(ctx, '缺页', x + w / 2, y + h / 2, { size: 22, px: 2, align: 'center', color: 'rgba(255,240,210,.5)' }); }
      ctx.restore();
      U.pixelText(ctx, String(pg.n), x + w / 2, y + h + 22, { size: 18, px: 2, align: 'center', color: on ? '#fff3d6' : '#8a7a62' });
    });
    if (this.sel) {
      var pg = ST.pages[this.sel - 1], im = A.img('ledger_page_' + this.sel);
      if (im) ctx.drawImage(im, 300, 360, 400, 300);
      var lines = pg.text.length ? pg.text : (L.lastPage ? pg.last : ['（空白）']);
      lines.forEach(function (l, i) { U.pixelText(ctx, l, 500, 440 + i * 44, { size: 24, px: 2, align: 'center', color: '#4a2a12' }); });
      U.pixelText(ctx, '第 ' + pg.n + ' 页 · 在' + pg.where + '找到', 740, 440, { size: 22, px: 2, color: '#e8c89a', outline: '#1e120a' });
      if (this.sel === 7 && !L.lastPage) U.pixelText(ctx, '父亲没写完的一页。', 740, 484, { size: 22, px: 2, color: '#fff3d6', outline: '#1e120a' });
    } else U.pixelText(ctx, '还一页都没找回来。开门营业，慢慢会找到的。', 640, 470, { size: 24, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a' });
    U.button(ctx, 'ledger_close', 1080, 640, 160, 56, '合上', { kind: 'wood', onTap: function () { app.closeOverlay(); } });
  };
  X.Ledger.prototype.describe = function () { return { sel: this.sel }; };

  X.TitleOld = function (app) {
    this.name = 'title'; this.app = app; this.t = 0;
    Sc.set({ view: 'ext', time: 'morning', weather: 'sun', shutter: 0.55, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    var r = app.store.loadRun(); this.canContinue = !!(r && r.state.phase !== 'ended'); this.contDay = r ? r.state.day : 0; this.contMode = r ? r.state.mode : null;
    this.notice = app.store.notice; app.store.notice = null;
    Au.setAmbience('morning', false);
  };
  X.TitleOld.prototype.update = function (dt) { this.t += dt; };
  X.TitleOld.prototype.draw = function (ctx) {
    var app = this.app, self = this, L = app.legacy;
    Sc.drawBack(ctx); Sc.drawFront(ctx);
    ctx.save(); var g = ctx.createLinearGradient(0, 0, 520, 0); g.addColorStop(0, 'rgba(30,20,10,.72)'); g.addColorStop(1, 'rgba(30,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 720); ctx.restore();
    var bob = Math.sin(this.t * 1.2) * 3;
    U.text(ctx, '不烧心小馆', 60, 150 + bob, { size: 84, bold: true, color: '#fff3d6', stroke: '#4a2a12', strokeW: 12 });
    U.text(ctx, '一个月，一间早餐铺，一条街的人', 66, 200, { size: 24, color: '#fff3d6', stroke: '#4a2a12' });
    var y = 260, any = L.runs > 0;
    var self2 = this; U.button(ctx, 'title_start', 60, y, 340, 70, any ? '新的一月' : '开门营业', { size: 30, onTap: function () { var go = function () { if (any) app.openOverlay(X.NewMonth); else app.newRun({ seed: (Date.now() % 1e9) >>> 0 }); }; if (self2.canContinue) app.openOverlay(X.Confirm, { text: '开新的一月会覆盖当前进度（' + (self2.contMode === 'week' ? '常营业' : '第' + self2.contDay + '日') + '）。店史、图鉴和结局印章不受影响。', ok: '覆盖并开始', onOk: go }); else go(); } });
    U.button(ctx, 'title_continue', 60, y + 88, 340, 66, this.canContinue ? '继续 · ' + (this.contMode === 'week' ? '常营业' : '第' + this.contDay + '日') : '继续', { kind: 'wood', disabled: !this.canContinue, onTap: function () { if (!app.continueRun()) app.notice('没有可继续的存档'); } });
    U.button(ctx, 'title_week', 60, y + 172, 160, 60, '常营业', { kind: 'paper', disabled: !any, onTap: function () { app.openOverlay(X.WeekPick); } });
    U.button(ctx, 'title_history', 240, y + 172, 160, 60, '店史', { kind: 'paper', onTap: function () { app.go(BSX.require('ui/s_codex').Codex, { from: 'title' }); } });
    U.button(ctx, 'title_settings', 60, y + 250, 340, 56, '设置', { kind: 'ghost', size: 24, onTap: function () { app.openOverlay(X.Settings); } });
    if (!any) U.text(ctx, '首次结局后开放常营业', 230, y + 254 - 10 + 90, { size: 16, color: '#f2e6c8', align: 'center' });
    if (this.notice) { U.panel(ctx, 520, 600, 700, 80, 'dark'); U.para(ctx, this.notice, 540, 632, 660, { size: 20, color: '#ffd9b0', lh: 28 }); }
    if (L.runs) U.text(ctx, '店史：第 ' + L.runs + ' 个月 · 印章 ' + Object.keys(L.endings).length + '/9', 1240, 700, { size: 18, align: 'right', color: '#fff3d6', stroke: '#4a2a12' });
  };
  X.TitleOld.prototype.describe = function () { return { canContinue: this.canContinue, continueDay: this.contDay, legacyRuns: this.app.legacy.runs, notice: this.notice }; };
  X.TitleNew.prototype.describe = X.TitleOld.prototype.describe;
  // 默认用像素风街景首页（用户 11-09 确认）；?oldui 可看旧首页
  X.Title = function (app, p) { var pr = app.P.params, T = pr && pr.has('oldui') ? X.TitleOld : pr && pr.has('streetui') ? X.TitleNew : X.TitleArt; return new T(app, p); };

  // ───────── 确认弹窗
  X.Confirm = function (app, p) { this.name = 'confirm'; this.app = app; this.p = p; };
  X.Confirm.prototype.draw = function (ctx) {
    var app = this.app, p = this.p;
    ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 340, 220, 600, 280, 'paper');
    U.para(ctx, p.text, 380, 290, 520, { size: 24, lh: 36 });
    U.button(ctx, 'confirm_ok', 380, 410, 250, 64, p.ok || '确定', { kind: 'red', onTap: function () { app.closeOverlay(); p.onOk(); } });
    U.button(ctx, 'confirm_cancel', 650, 410, 250, 64, '取消', { kind: 'paper', onTap: function () { app.closeOverlay(); } });
  };
  X.Confirm.prototype.describe = function () { return { text: this.p.text }; };

  // ───────── 新的一月：继承重开
  X.NewMonth = function (app) { this.name = 'newMonth'; this.app = app; this.pick = null; };
  X.NewMonth.prototype.draw = function (ctx) {
    var app = this.app, self = this, L = app.legacy;
    ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 160, 70, 960, 580, 'paper');
    U.text(ctx, '新的一月：带上一件东西', 640, 130, { size: 34, bold: true, align: 'center' });
    U.text(ctx, '图鉴、照片、来信和结局印章都会留下。未见过的事件会更常出现。', 640, 172, { size: 20, align: 'center', color: '#7d5a35' });
    EN.heirlooms.forEach(function (h, i) {
      var x = 200 + (i % 2) * 450, y = 210 + Math.floor(i / 2) * 150, has = L.heirlooms.indexOf(h.id) >= 0;
      var st = U.hit('heir_' + h.id, x, y, 420, 130, { label: h.name, disabled: !has, onTap: function () { self.pick = self.pick === h.id ? null : h.id; } });
      ctx.save(); if (!has) ctx.globalAlpha = 0.4; ctx.fillStyle = self.pick === h.id ? '#e8b54a' : st.pressed ? '#e6d2a8' : '#fff8e8'; U.rr(ctx, x, y, 420, 130, 12); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = self.pick === h.id ? 5 : 2; ctx.stroke(); ctx.restore();
      U.text(ctx, has ? h.name : '？？？', x + 24, y + 48, { size: 26, bold: true, alpha: has ? 1 : 0.5 });
      U.text(ctx, has ? h.desc : '与一位常客更熟后获得', x + 24, y + 90, { size: 20, color: '#7d5a35', alpha: has ? 1 : 0.6 });
    });
    U.button(ctx, 'nm_go', 440, 540, 260, 70, self.pick ? '带上它，下一步' : '空手，下一步', { size: 28, onTap: function () { app.openOverlay(X.Origin, { base: { seed: (Date.now() % 1e9) >>> 0, heirloom: self.pick, generation: L.runs + 1, preferUnseen: Legacy.unseenEvents(L) } }); } });
    U.button(ctx, 'nm_back', 720, 540, 160, 70, '返回', { kind: 'paper', onTap: function () { app.closeOverlay(); } });
  };
  // ───────── 开局身份＋一正一负特性（参考深空当铺开局剧本与 Starting Perks，D039）
  X.Origin = function (app, p) { this.name = 'origin'; this.app = app; this.base = p.base || {}; this.origin = 'heir'; this.plus = null; this.minus = null; };
  X.Origin.prototype.draw = function (ctx) {
    var app = this.app, self = this, CF = BSX.require('content/config');
    ctx.fillStyle = 'rgba(20,14,8,.75)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 100, 30, 1080, 660, 'paper');
    U.text(ctx, '这一月，老周从哪里起步？', 640, 84, { size: 32, bold: true, align: 'center' });
    CF.origins.forEach(function (o, i) {
      var x = 140 + i * 340, y = 108, on = self.origin === o.id;
      var st = U.hit('origin_' + o.id, x, y, 320, 170, { label: o.name, onTap: function () { self.origin = o.id; } });
      ctx.save(); ctx.fillStyle = on ? '#e8b54a' : st.pressed ? '#e6d2a8' : '#fff8e8'; U.rr(ctx, x, y, 320, 170, 12); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = on ? 5 : 2; ctx.stroke(); ctx.restore();
      U.text(ctx, o.name, x + 20, y + 44, { size: 26, bold: true });
      if (o.id === 'debt') U.text(ctx, '难', x + 296, y + 44, { size: 22, bold: true, align: 'right', color: '#b8432f' });
      U.para(ctx, o.desc, x + 20, y + 82, 280, { size: 18, color: '#7d5a35', lh: 25, maxLines: 3 });
    });
    U.text(ctx, '特性：先选一个代价，才能换一个好处（也可以都不选）', 640, 318, { size: 22, bold: true, align: 'center', color: '#3b2a1a' });
    [['minus', '代价', '#b8432f'], ['plus', '好处', '#2f6f66']].forEach(function (row, r) {
      var list = CF.perks[row[0]], y = 344 + r * 132;
      U.text(ctx, row[1], 150, y + 66, { size: 24, bold: true, color: row[2] });
      list.forEach(function (pk, i) {
        var x = 230 + i * 310, on = self[row[0]] === pk.id, lock = row[0] === 'plus' && !self.minus;
        var st = U.hit('perk_' + pk.id, x, y, 290, 116, { label: pk.name, disabled: lock, onTap: function () { self[row[0]] = on ? null : pk.id; if (row[0] === 'minus' && !self.minus) self.plus = null; } });
        ctx.save(); if (lock) ctx.globalAlpha = 0.4; ctx.fillStyle = on ? (r ? '#d6eee4' : '#f6d6cc') : st.pressed ? '#e6d2a8' : '#fff8e8'; U.rr(ctx, x, y, 290, 116, 12); ctx.fill(); ctx.strokeStyle = on ? row[2] : '#c8a878'; ctx.lineWidth = on ? 5 : 2; ctx.stroke(); ctx.restore();
        U.text(ctx, pk.name, x + 18, y + 42, { size: 24, bold: true, color: row[2], alpha: lock ? 0.5 : 1 });
        U.text(ctx, pk.desc, x + 18, y + 84, { size: 18, color: '#7d5a35', maxW: 260, alpha: lock ? 0.5 : 1 });
      });
    });
    U.button(ctx, 'origin_go', 700, 618, 260, 60, '开门营业', { size: 28, onTap: function () { app.newRun(Object.assign({}, self.base, { origin: self.origin, perkPlus: self.plus, perkMinus: self.minus })); } });
    U.button(ctx, 'origin_back', 980, 618, 160, 60, '返回', { kind: 'paper', onTap: function () { app.openOverlay(X.NewMonth); } });
  };
  X.Origin.prototype.describe = function () { return { origin: this.origin, plus: this.plus, minus: this.minus }; };
  X.NewMonth.prototype.describe = function () { return { pick: this.pick, available: this.app.legacy.heirlooms }; };

  // ───────── 常营业主题
  X.WeekPick = function (app) { this.name = 'weekPick'; this.app = app; this.theme = EN.themes[0].id; this.goal = null; };
  X.WeekPick.prototype.draw = function (ctx) {
    var app = this.app, self = this, L = app.legacy;
    ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 80, 50, 1120, 620, 'paper');
    U.text(ctx, '七日常营业', 640, 108, { size: 34, bold: true, align: 'center' });
    EN.themes.forEach(function (t, i) {
      var x = 110 + (i % 3) * 360, y = 136 + Math.floor(i / 3) * 132, sel = self.theme === t.id, rec = L.weeks[t.id];
      U.hit('wk_' + t.id, x, y, 340, 118, { label: t.name, onTap: function () { self.theme = t.id; self.goal = null; } });
      ctx.save(); ctx.fillStyle = sel ? '#e8b54a' : '#fff8e8'; U.rr(ctx, x, y, 340, 118, 12); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = sel ? 5 : 2; ctx.stroke(); ctx.restore();
      U.text(ctx, t.name, x + 18, y + 40, { size: 26, bold: true });
      U.para(ctx, t.desc, x + 18, y + 72, 304, { size: 18, color: '#7d5a35', lh: 24 });
      if (rec) U.text(ctx, '完成 ' + rec.done + '/' + rec.plays, x + 322, y + 40, { size: 16, align: 'right', color: '#2f6f66' });
    });
    var th = EN.themes.filter(function (t) { return t.id === self.theme; })[0];
    U.text(ctx, '本周只选一个小目标：', 120, 448, { size: 22, bold: true });
    th.goals.forEach(function (g, i) { U.button(ctx, 'goal_' + g.id, 120 + i * 330, 470, 310, 64, g.label, { kind: 'paper', selected: self.goal === g.id, size: 22, onTap: function () { self.goal = g.id; } }); });
    U.button(ctx, 'wk_go', 420, 570, 260, 70, '开门', { size: 28, disabled: !self.goal, onTap: function () { app.newRun({ mode: 'week', theme: self.theme, goal: self.goal, seed: (Date.now() % 1e9) >>> 0, unlocked: L.unlocked.concat(['congee', 'youtiao', 'soy', 'scallion', 'egg', 'noodle', 'friedrice', 'pidan', 'shengjian', 'mixian']) }); } });
    U.button(ctx, 'wk_back', 700, 570, 160, 70, '返回', { kind: 'paper', onTap: function () { app.closeOverlay(); } });
  };
  X.WeekPick.prototype.describe = function () { return { theme: this.theme, goal: this.goal }; };

  // ───────── 暂停（含设置入口、重开当天、回标题）
  X.Pause = function (app, p) { this.name = 'pause'; this.app = app; this.system = p.system; };
  X.Pause.prototype.draw = function (ctx) {
    var app = this.app, self = this;
    ctx.fillStyle = 'rgba(20,14,8,.66)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 420, 120, 440, 480, 'paper');
    U.text(ctx, '暂停', 640, 182, { size: 36, bold: true, align: 'center' });
    U.text(ctx, '计时已停', 640, 214, { size: 18, align: 'center', color: '#7d5a35' });
    U.button(ctx, 'pause_resume', 480, 240, 320, 64, '继续', { size: 28, onTap: function () { app.closeOverlay(); } });
    U.button(ctx, 'pause_settings', 480, 318, 320, 60, '设置', { kind: 'wood', onTap: function () { app.openOverlay(X.Settings, { back: X.Pause }); app.paused = true; } });
    var canRestart = app.state && app.screen && app.screen.name === 'service';
    U.button(ctx, 'pause_restart', 480, 392, 320, 60, '重开今天营业', { kind: 'paper', disabled: !canRestart, onTap: function () { app.closeOverlay(); app.route(); app.notice('从营业开始重来'); } });
    U.button(ctx, 'pause_title', 480, 466, 320, 60, '回到标题（已存档）', { kind: 'paper', onTap: function () { app.closeOverlay(); app.go(X.Title); } });
    U.button(ctx, 'pause_log', 480, 540, 320, 44, '剧情回看', { kind: 'ghost', size: 20, onTap: function () { app.openOverlay(X.Log, { back: X.Pause }); app.paused = true; } });
  };
  X.Pause.prototype.describe = function () { return { system: !!this.system }; };

  // ───────── 设置
  X.Settings = function (app, p) { this.name = 'settings'; this.app = app; this.back = p && p.back; };
  X.Settings.prototype.draw = function (ctx) {
    var app = this.app, s = app.settings, self = this;
    ctx.fillStyle = 'rgba(20,14,8,.7)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 220, 40, 840, 640, 'paper');
    U.text(ctx, '设置', 640, 96, { size: 34, bold: true, align: 'center' });
    var rows = [
      ['音乐', 'music', 'vol'], ['音效', 'sfx', 'vol'], ['震动', 'vibrate', 'bool'], ['大字号', 'textScale', 'scale'], ['减少动效', 'reduceMotion', 'bool'],
      ['简化做饭', 'assistCook', 'bool'], ['剧情自动播放', 'autoPlay', 'bool'], ['跳过已看剧情', 'skipSeen', 'bool'], ['省电画面', 'lowFx', 'bool']
    ];
    rows.forEach(function (r, i) {
      var x = 270 + (i % 2) * 400, y = 130 + Math.floor(i / 2) * 84;
      U.text(ctx, r[0], x, y + 40, { size: 24, bold: true });
      if (r[2] === 'vol') { [0, 0.25, 0.5, 0.75, 1].forEach(function (v, j) { var on = j === 0 ? s[r[1]] < 0.01 : s[r[1]] >= v - 0.01; U.button(ctx, 'set_' + r[1] + '_' + j, x + 130 + j * 44, y + 8, 38, 44, j === 0 ? '关' : '', { kind: on ? 'primary' : 'paper', minSize: 44, onTap: function () { s[r[1]] = v; app.applySettings(); Au.play('tap'); } }); }); }
      else if (r[2] === 'scale') U.button(ctx, 'set_' + r[1], x + 170, y + 6, 150, 50, s.textScale > 1 ? '开' : '关', { kind: s.textScale > 1 ? 'primary' : 'paper', onTap: function () { s.textScale = s.textScale > 1 ? 1 : 1.15; app.applySettings(); } });
      else U.button(ctx, 'set_' + r[1], x + 170, y + 6, 150, 50, s[r[1]] ? '开' : '关', { kind: s[r[1]] ? 'primary' : 'paper', onTap: function () { s[r[1]] = !s[r[1]]; app.applySettings(); if (app.screen && app.screen.onSettings) app.screen.onSettings(); } });
    });
    U.button(ctx, 'set_tutorial', 270, 560, 330, 56, '重看做饭教学', { kind: 'wood', onTap: function () { s.seenTutorial = false; app.applySettings(); app.notice('下次营业时会重新示范'); } });
    U.button(ctx, 'set_full', 620, 560, 200, 56, '全屏', { kind: 'paper', onTap: function () { app.P.fullscreen(); } });
    U.button(ctx, 'set_close', 840, 560, 170, 56, '好了', { onTap: function () { if (self.back) { app.openOverlay(self.back, {}); app.paused = true; } else app.closeOverlay(); } });
    U.text(ctx, '素材为 AI 辅助生成的内测版本 · 音效为程序合成临时音', 640, 650, { size: 16, align: 'center', color: '#8d7a60' });
  };
  X.Settings.prototype.describe = function () { return this.app.settings; };

  // ───────── 剧情回看
  X.Log = function (app, p) { this.name = 'log'; this.app = app; this.back = p && p.back; this.scroll = 0; };
  X.Log.prototype.draw = function (ctx) {
    var app = this.app, self = this, log = app.storyLog;
    ctx.fillStyle = 'rgba(20,14,8,.8)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 180, 40, 920, 640, 'paper');
    U.text(ctx, '剧情回看', 640, 96, { size: 30, bold: true, align: 'center' });
    var lines = log.slice(Math.max(0, log.length - 14 - this.scroll), log.length - this.scroll);
    lines.forEach(function (l, i) { U.text(ctx, (l.day ? '第' + l.day + '日 ' : '') + (l.who ? l.who + '：' : ''), 220, 140 + i * 34, { size: 20, color: '#2f6f66', bold: true }); U.text(ctx, l.text, 400, 140 + i * 34, { size: 20, maxW: 660 }); });
    if (!log.length) U.text(ctx, '还没有剧情记录', 640, 340, { size: 24, align: 'center', color: '#8d7a60' });
    U.button(ctx, 'log_up', 1000, 140, 70, 60, '↑', { kind: 'paper', disabled: log.length - this.scroll <= 14, onTap: function () { self.scroll = Math.min(log.length - 1, self.scroll + 7); } });
    U.button(ctx, 'log_down', 1000, 520, 70, 60, '↓', { kind: 'paper', disabled: this.scroll <= 0, onTap: function () { self.scroll = Math.max(0, self.scroll - 7); } });
    U.button(ctx, 'log_close', 540, 610, 200, 56, '关闭', { onTap: function () { if (self.back) { app.openOverlay(self.back, {}); app.paused = true; } else { app.closeOverlay(); } } });
  };
  X.Log.prototype.describe = function () { return { lines: this.app.storyLog.length }; };
  return X;
});
