// 加载、标题、暂停与设置。标题画面的目的只有一个：让人想把这家店的灯拉亮。
BSX.define('ui/s_basic', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var Cast = require('content/cast');
  var Story = require('content/story');

  function Loading(app) {
    var self = this; this.app = app; this.name = 'loading'; this.p = 0; this.t = 0;
    A.loadGroup('boot', function (p) { self.p = p * 0.6; }, function () { A.loadGroup('chars', function (p) { self.p = 0.6 + p * 0.3; }, function () { self.p = 1; A.loadGroup('late', null, null); }); });
  }
  Loading.prototype.update = function (dt) { this.t += dt; if (this.p >= 1 && this.t > 0.4) this.app.go(Title, {}, false); };
  Loading.prototype.draw = function (ctx) {
    ctx.fillStyle = '#1f1812'; ctx.fillRect(0, 0, 1280, 720);
    var cx = 640, cy = 330;
    ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.ellipse(cx, cy + 30, 70, 26, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(cx - 70, cy + 22, 140, 10);
    ctx.fillStyle = '#2f6f66'; ctx.fillRect(cx - 70, cy + 30, 140, 6);
    ctx.strokeStyle = 'rgba(255,248,232,.5)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (var i = -1; i <= 1; i++) { ctx.beginPath(); for (var k = 0; k <= 10; k++) { var yy = cy + 10 - k * 6, xx = cx + i * 30 + Math.sin(this.t * 3 + k * 0.7 + i) * 6; if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
    U.text(ctx, '灶上的水快开了…', cx, cy + 110, { size: 22, align: 'center', color: '#d8c8a8' });
    ctx.fillStyle = 'rgba(255,248,232,.15)'; U.rr(ctx, cx - 160, cy + 132, 320, 8, 4); ctx.fill(); ctx.fillStyle = '#e8b54a'; U.rr(ctx, cx - 160, cy + 132, 320 * this.p, 8, 4); ctx.fill();
  };
  Loading.prototype.describe = function () { return { p: this.p }; };

  // 标题页在 ui/s_title
  function Title(app, p) { return new (require('ui/s_title').Title)(app, p); }

  // ───────── 暂停 / 设置
  function Pause(app, p) { this.app = app; this.name = p.settings ? 'settings' : 'pause'; this.settings = !!p.settings; this.t = 0; }
  var Pp = Pause.prototype;
  Pp.update = function (dt) { this.t += dt; };
  Pp.draw = function (ctx) {
    var app = this.app, s = app.settings, self = this, k = Fx.ease.out3(Math.min(1, this.t * 5));
    K.dim(ctx, 0.55 * k);
    U.hit('pause_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 360, y = 96 + (1 - k) * 30, w = 560, h = 528;
    K.paper(ctx, x, y, w, h, { pin: K.col.teal });
    U.text(ctx, this.settings ? '设置' : '歇一会儿', x + w / 2, y + 58, { size: 32, bold: true, align: 'center', color: K.col.ink });
    function steps(id, label, key, yy) {
      U.text(ctx, label, x + 44, yy + 30, { size: 22, bold: true, color: K.col.ink });
      for (var i = 0; i <= 4; i++) (function (i) { var v = i / 4, on = Math.abs(s[key] - v) < 0.13; K.tag(ctx, id + i, x + 190 + i * 66, yy, 56, 44, i === 0 ? '关' : String(i), { kind: on ? 'teal' : 'paper', size: 19, onTap: function () { s[key] = v; app.applySettings(); Au.play('good'); } }); })(i);
    }
    function toggle(id, label, key, xx, yy) { K.tag(ctx, id, xx, yy, 228, 46, label + (s[key] ? '：开' : '：关'), { kind: s[key] ? 'teal' : 'paper', size: 19, onTap: function () { s[key] = !s[key]; app.applySettings(); } }); }
    steps('vm', '音乐', 'music', y + 86); steps('vs', '音效', 'sfx', y + 144);
    toggle('t_vib', '震动', 'vibrate', x + 44, y + 210); toggle('t_auto', '剧情自动播放', 'autoPlay', x + 288, y + 210);
    toggle('t_hint', '操作提示', 'hints', x + 44, y + 266); toggle('t_low', '省电画面', 'lowFx', x + 288, y + 266);
    K.tag(ctx, 't_text', x + 44, y + 322, 228, 46, '字号：' + (s.textScale > 1.05 ? '大' : '标准'), { kind: 'paper', size: 19, onTap: function () { s.textScale = s.textScale > 1.05 ? 1 : 1.14; app.applySettings(); } });
    K.tag(ctx, 't_full', x + 288, y + 322, 228, 46, '全屏', { kind: 'paper', size: 19, onTap: function () { app.P.fullscreen(); } });
    if (this.settings) K.tag(ctx, 'p_close', x + 150, y + 430, 260, 62, '好了', { kind: 'teal', onTap: function () { app.closeOverlay(); } });
    else {
      K.tag(ctx, 'p_resume', x + 44, y + 430, 228, 62, '接着忙', { kind: 'teal', onTap: function () { app.closeOverlay(); } });
      K.tag(ctx, 'p_title', x + 288, y + 430, 228, 62, '回到门口', { kind: 'wood', sub: app.state && app.state.phase === 'service' ? '今天的早市要重来' : '进度已存', onTap: function () { require('game/stations').silence(); app.closeOverlay(); app.state = null; app.go(Title, {}, true); } });
    }
    U.text(ctx, '不烧心小馆 · 第二版 · 画面与文字含 AI 辅助创作', x + w / 2, y + h - 16, { size: 13, align: 'center', color: K.col.mute });
  };
  Pp.describe = function () { return { settings: this.app.settings }; };
  return { Loading: Loading, Title: Title, Pause: Pause };
});
