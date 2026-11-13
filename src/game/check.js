// 副本·后厨自查：对面被查封那天，老周先把自家后厨查一遍。40 秒内在后厨图里找出隐患，点错扣 2 秒。
// 隐患位置来自 Lovart 干净版 / 隐患版两张图的差异（tools 里算出来后手工拆分命名）。
BSX.define('game/check', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Au = require('game/audio');
  var HAZ = [
    { id: 'fridge', x: 173, y: 382, w: 106, h: 89, name: '冰柜门没关严，里面的东西化了' },
    { id: 'rice', x: 170, y: 585, w: 98, h: 91, name: '米袋破了，米撒一地，招虫' },
    { id: 'spice', x: 614, y: 148, w: 123, h: 45, name: '调料罐都敞着口' },
    { id: 'wok', x: 466, y: 307, w: 98, h: 41, name: '锅里是炸了好几天的黑油' },
    { id: 'cabinet', x: 365, y: 352, w: 69, h: 55, name: '柜门开着，塞着没标签的油', jin: '老金那桶没字的油，还在柜子里' },
    { id: 'floor', x: 320, y: 440, w: 104, h: 74, name: '地上的油没擦，踩上去打滑' },
    { id: 'dough', x: 410, y: 452, w: 128, h: 66, name: '生面坯没盖，挨着地' },
    { id: 'leak', x: 1027, y: 515, w: 172, h: 72, name: '水池底下漏水' },
    { id: 'mouse', x: 1231, y: 518, w: 41, h: 60, name: '墙角有个老鼠洞' }
  ];
  var TIME = 40;
  function Check(opts) { this.o = opts || {}; this.t = 0; this.found = {}; this.marks = []; this.done = false; this.over = false; this.penalty = 0; this.result = null; }
  var P = Check.prototype;
  P.left = function () { return Math.max(0, TIME - this.t - this.penalty); };
  P.update = function (dt) {
    this.t += dt;
    this.marks.forEach(function (m) { m.t += dt; }); this.marks = this.marks.filter(function (m) { return m.keep || m.t < 1; });
    if (this.over) { this.overT += dt; return; }
    if (Object.keys(this.found).length >= HAZ.length || this.left() <= 0) this.finish();
  };
  P.tapAt = function (x, y) {
    if (this.over) { if (this.overT > 0.6) this.done = true; return; }
    for (var i = 0; i < HAZ.length; i++) {
      var h = HAZ[i];
      if (x >= h.x - 18 && x <= h.x + h.w + 18 && y >= h.y - 18 && y <= h.y + h.h + 18) {
        if (this.found[h.id]) return;
        this.found[h.id] = true; Au.play('perfect');
        this.marks.push({ x: h.x + h.w / 2, y: h.y + h.h / 2, r: Math.max(h.w, h.h) * 0.62, t: 0, keep: true, ok: true, text: this.o.jinOil && h.jin ? h.jin : h.name });
        return;
      }
    }
    this.penalty += 2; Au.play('drop');
    this.marks.push({ x: x, y: y, r: 26, t: 0, ok: false, text: '这儿没问题（−2 秒）' });
  };
  P.finish = function () { if (this.over) return; this.over = true; this.overT = 0; var n = Object.keys(this.found).length; this.result = { id: 'check', found: n, total: HAZ.length }; Au.play('stamp'); };
  P.pointer = function (type, x, y) { if (type === 'down') this.tapAt(x, y); return true; };
  P.draw = function (ctx) {
    var self = this, bg = A.img(this.over ? 'scene_check_clean' : 'scene_check_hazard');
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (bg) ctx.drawImage(this.over && this.overT < 0.6 ? A.img('scene_check_hazard') || bg : bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.restore();
    // 顶栏
    ctx.fillStyle = 'rgba(20,12,6,.75)'; ctx.fillRect(0, 0, 1280, 64);
    var n = Object.keys(this.found).length, left = this.left();
    U.pixelText(ctx, '后厨自查  ' + n + ' / ' + HAZ.length, 30, 34, { size: 26, px: 2, color: '#fff3d6', outline: '#1e120a' });
    ctx.fillStyle = '#3b2412'; ctx.fillRect(420, 24, 560, 16); ctx.fillStyle = left < 10 ? '#e0603a' : '#f2b440'; ctx.fillRect(422, 26, 556 * left / TIME, 12);
    U.pixelText(ctx, '检查员 ' + Math.ceil(left) + ' 秒后到', 1250, 34, { size: 22, px: 2, align: 'right', color: '#ffe08a', outline: '#1e120a' });
    if (this.t < 3.5 && !this.over) U.pixelText(ctx, '检查员要来了。把后厨里不对劲的地方一个个点出来。', 640, 690, { size: 24, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: Math.min(1, (3.5 - this.t) * 2) });
    this.marks.forEach(function (m) {
      ctx.save(); ctx.strokeStyle = m.ok ? '#ffe08a' : '#ff6a4a'; ctx.lineWidth = 5; ctx.globalAlpha = m.ok ? 1 : 1 - m.t;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * (m.ok ? Math.min(1, 0.6 + m.t * 3) : 1), 0, 7); ctx.stroke(); ctx.restore();
      if (m.ok ? m.t < 2.2 : true) U.pixelText(ctx, m.text, Math.max(180, Math.min(1100, m.x)), m.y - m.r - 18, { size: 20, px: 2, align: 'center', color: m.ok ? '#fff3d6' : '#ffb08a', outline: '#1e120a', alpha: m.ok ? Math.min(1, 2.2 - m.t) : 1 - m.t });
    });
    if (this.over) {
      var r = this.result, k = Math.min(1, this.overT * 2);
      ctx.save(); ctx.globalAlpha = k * 0.8; ctx.fillStyle = '#140c06'; ctx.fillRect(240, 200, 800, 300); ctx.restore();
      U.pixelText(ctx, r.found >= 7 ? '收拾干净了' : r.found >= 4 ? '还漏了几处' : '检查员已经到门口了', 640, 270, { size: 44, px: 4, align: 'center', color: '#ffe08a', outline: '#3b2412', alpha: k });
      U.pixelText(ctx, '找出 ' + r.found + ' / ' + r.total + ' 处隐患', 640, 340, { size: 30, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: k });
      U.pixelText(ctx, r.found >= 7 ? '烧心 −10，口碑 +1' : r.found >= 4 ? '烧心 −4' : '口碑 −1', 640, 392, { size: 24, px: 2, align: 'center', color: '#e8c89a', outline: '#1e120a', alpha: k });
      if (this.overT > 0.6) U.pixelText(ctx, '点一下继续', 640, 460, { size: 22, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: 0.6 + Math.sin(this.overT * 4) * 0.3 });
      U.hit('ck_done', 0, 0, 1280, 720, { label: '继续', minSize: 0, onTap: function () { if (self.overT > 0.6) self.done = true; } });
    }
  };
  P.describe = function () { var f = this.found; return { t: Math.round(this.t * 10) / 10, over: this.over, result: this.result, left: Math.round(this.left()), todo: HAZ.filter(function (h) { return !f[h.id]; }).map(function (h) { return { id: h.id, x: h.x + h.w / 2, y: h.y + h.h / 2 }; }) }; };
  return { Check: Check, HAZ: HAZ, TIME: TIME };
});
