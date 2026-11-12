// 结局页（横屏）＋ 竖屏分享卡 ＋ 常营业周结算
BSX.define('ui/s_ending', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var Act = require('game/actors');
  var EN = require('content/endings');
  var R = require('content/regulars');
  var ST = require('content/story');
  var Legacy = require('core/legacy');
  var Run = require('core/run');
  // 篆刻风朱印：方形红底白字，两字竖排（替代原来圆圈里的“印”字）
  var SEAL = { E_HONEST: '放心', E_PRIVATE: '私房', E_CANTEEN: '食堂', E_REOPEN: '重开', E_PILLS: '胃药', E_FAREWELL: '送行', E_TRANSFER: '转让', E_SOMEONE: '记得', E_TRUTH: '正名' };
  // 结局关键帧（Lovart V02–V10）
  var KEYART = { E_TRUTH: 'end_02', E_HONEST: 'end_03', E_PRIVATE: 'end_04', E_CANTEEN: 'end_05', E_REOPEN: 'end_06', E_PILLS: 'end_07', E_FAREWELL: 'end_08', E_TRANSFER: 'end_09', E_SOMEONE: 'end_10' };
  function seal(ctx, txt, r) {
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = '#fbe9d8'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeRect(-r * 0.82, -r * 0.82, r * 1.64, r * 1.64);
    ctx.fillStyle = '#fbe9d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * 0.72) + 'px ' + U.FONT;
    ctx.fillText(txt[0], 0, -r * 0.38); ctx.fillText(txt[1] || '', 0, r * 0.4); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (var i = 0; i < 6; i++) ctx.fillRect(-r + ((i * 37) % (r * 2)), -r + ((i * 53) % (r * 2)), 4, 3);
  }
  function keyChoices(s) { return s.keyChoices.slice().sort(function (a, b) { return b.weight - a.weight || a.day - b.day; }).slice(0, 3).sort(function (a, b) { return a.day - b.day; }); }
  function chart(ctx, xs, x, y, w, h, col, label) {
    var mn = Math.min.apply(null, xs), mx = Math.max.apply(null, xs); if (mx === mn) mx = mn + 1;
    ctx.save(); ctx.strokeStyle = 'rgba(122,90,53,.3)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
    xs.forEach(function (v, i) { var px = x + w * i / Math.max(1, xs.length - 1), py = y + h - (v - mn) / (mx - mn) * h; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.stroke(); ctx.restore();
    U.text(ctx, label, x, y - 8, { size: 16, color: '#7d5a35' });
  }
  function Ending(app) {
    this.name = 'ending'; this.app = app; this.t = 0; var s = app.state;
    this.e = EN.byId[s.ending.id]; this.best = Legacy.bestRegular(s); this.choices = keyChoices(s);
    var total = Object.keys(ST.nodes).length, seen = s.nodesDone.length; this.missed = total - seen;
    Sc.set({ view: 'ext', time: 'dusk', weather: 'sun', shutter: s.ending.id === 'E_TRANSFER' || s.ending.id === 'E_FAREWELL' ? 1 : 0.2, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    Au.stack = []; Au.lockTrack = true; Au.music(['E_PILLS', 'E_TRANSFER'].indexOf(s.ending.id) >= 0 ? 'bgm_bad' : 'bgm_good'); Au.setAmbience('dusk', false); Au.lockTrack = false; Au.play('bell');
  }
  var P = Ending.prototype;
  P.update = function (dt) { this.t += dt; };
  P.draw = function (ctx) {
    var app = this.app, s = app.state, self = this, e = this.e;
    var art = A.img(KEYART[e.id]);
    if (art) { var z = 1.06 - Math.min(1, this.t / 8) * 0.06; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(art, 640 - 640 * z, 360 - 360 * z, 1280 * z, 720 * z); ctx.restore(); }
    else { Sc.drawBack(ctx); Sc.drawFront(ctx); }
    // 先让结局画面独自停 2.2 秒，再压暗出文字
    var dim = art ? Math.max(0, Math.min(1, (this.t - 2.2) / 0.8)) : 1;
    ctx.save(); ctx.fillStyle = 'rgba(20,12,6,' + 0.62 * dim + ')'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    if (art && dim < 1) { U.pixelText(ctx, e.name, 640, 660, { size: 48, px: 2, align: 'center', color: '#fff3d6', outline: '#3b2412', alpha: Math.min(1, this.t / 0.8) * (1 - dim) }); if (dim <= 0) { U.hit('end_reveal', 0, 0, 1280, 720, { label: '继续', minSize: 0, onTap: function () { self.t = Math.max(self.t, 2.2); } }); return; } }
    var k = art ? dim : Math.min(1, this.t / 1.2);
    U.text(ctx, '终章 · 月底那天', 80, 90, { size: 24, color: '#ffd9a0', alpha: k });
    U.text(ctx, e.name, 80, 156, { size: 50, bold: true, color: '#fff3d6', stroke: '#3b2412', strokeW: 8, alpha: k, maxW: 760 });
    var mood = e.id === 'E_SOMEONE' ? e.tiers[s.ending.tier || 0] : e.mood;
    U.text(ctx, mood, 82, 202, { size: 24, color: '#fff3d6', alpha: k });
    if (s.flags && s.flags.owner) { ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#b8432f'; U.rr(ctx, 640, 36, 320, 40, 8); ctx.fill(); ctx.restore(); U.text(ctx, '★ 铺面盘下来了，这间店姓周', 800, 63, { align: 'center', size: 20, bold: true, color: '#fff3d6', alpha: k }); }
    // 三次关键选择
    U.panel(ctx, 70, 236, 560, 300, 'paper', { alpha: k });
    U.text(ctx, '这个月的三个决定', 96, 278, { size: 24, bold: true });
    this.choices.forEach(function (c, i) { U.text(ctx, '第' + c.day + '日 · ' + c.title, 100, 324 + i * 66, { size: 18, color: '#7d5a35' }); U.text(ctx, c.label, 100, 352 + i * 66, { size: 24, bold: true }); });
    if (!this.choices.length) U.text(ctx, '一个平平常常的月。', 100, 340, { size: 22 });
    // 最常来的常客
    U.panel(ctx, 660, 236, 280, 300, 'cream', { alpha: k });
    U.text(ctx, '最常来的人', 800, 276, { size: 22, bold: true, align: 'center' });
    if (this.best) { Act.draw(ctx, this.best, 800, 500, 200, { t: this.t }); U.text(ctx, R.byId[this.best].name, 800, 524, { size: 22, bold: true, align: 'center' }); }
    else U.text(ctx, '还没有熟客', 800, 400, { size: 22, align: 'center' });
    // 曲线
    U.panel(ctx, 970, 236, 260, 300, 'cream', { alpha: k });
    chart(ctx, [s.stats.startCash].concat(s.history.map(function (h) { return h.cashClose; })), 994, 290, 210, 90, '#2f6f66', '现金');
    chart(ctx, [s.stats.startRep].concat(s.history.map(function (h) { return h.rep1; })), 994, 420, 210, 90, '#b8432f', '口碑');
    U.text(ctx, '错过的故事 ' + this.missed + ' 段', 994, 530, { size: 16, color: '#7d5a35' });
    // 结局印章
    if (this.t > 1.2) { if (!this.stamped) { this.stamped = true; Au.play('stamp'); } ctx.save(); ctx.translate(1120, 130); ctx.rotate(-0.18); var sk = Math.max(1, 1.6 - (this.t - 1.2) * 3); ctx.scale(sk, sk); seal(ctx, SEAL[s.ending.id] || '月底', 56); ctx.restore(); }
    var y = 570;
    U.button(ctx, 'end_share', 70, y, 220, 64, '分享卡', { kind: 'wood', onTap: function () { app.openOverlay(Share, {}); } });
    U.button(ctx, 'end_newmonth', 310, y, 240, 64, '继承店史重开', { onTap: function () { app.openOverlay(BSX.require('ui/s_basic').NewMonth); } });
    U.button(ctx, 'end_week', 570, y, 220, 64, '七日常营业', { kind: 'paper', onTap: function () { app.openOverlay(BSX.require('ui/s_basic').WeekPick); } });
    U.button(ctx, 'end_history', 810, y, 180, 64, '店史', { kind: 'paper', onTap: function () { app.go(BSX.require('ui/s_codex').Codex, { from: 'ending' }); } });
    U.button(ctx, 'end_title', 1010, y, 200, 64, '回标题', { kind: 'paper', onTap: function () { app.go(BSX.require('ui/s_basic').Title); } });
    var letter = app.legacy.letters[app.legacy.letters.length - 1];
    if (letter) U.text(ctx, '来信：' + letter.text, 640, 680, { size: 20, align: 'center', color: '#ffd9a0', maxW: 1100 });
  };
  P.describe = function () { var s = this.app.state; return { ending: s.ending, name: this.e.name, best: this.best, choices: this.choices.map(function (c) { return c.label; }), missed: this.missed }; };

  // ───────── 竖屏分享卡（544×960，不含二维码、不剧透未解锁剧情）
  function buildCard(app) {
    var s = app.state, e = EN.byId[s.ending.id], best = Legacy.bestRegular(s), ch = keyChoices(s);
    var c = app.P.createCanvas(544, 960), x = c.getContext('2d');
    var bg = A.img('bg_ending_poster');
    if (bg) x.drawImage(bg, 0, 0, 544, 960); else { x.fillStyle = '#c86a3a'; x.fillRect(0, 0, 544, 960); }
    var g = x.createLinearGradient(0, 520, 0, 960); g.addColorStop(0, 'rgba(30,18,8,0)'); g.addColorStop(0.35, 'rgba(30,18,8,.82)'); g.addColorStop(1, 'rgba(30,18,8,.92)');
    x.fillStyle = g; x.fillRect(0, 480, 544, 480);
    function t(str, px, py, size, col, bold, align) { x.font = (bold ? 'bold ' : '') + size + 'px ' + U.FONT; x.textAlign = align || 'left'; x.lineJoin = 'round'; x.lineWidth = Math.max(3, size / 5); x.strokeStyle = 'rgba(40,20,8,.9)'; x.strokeText(str, px, py); x.fillStyle = col || '#fff3d6'; x.fillText(str, px, py); }
    t('不烧心小馆', 272, 70, 46, '#fff3d6', true, 'center');
    t('第 ' + (s.generation || 1) + ' 个月', 272, 108, 22, '#ffd9a0', false, 'center');
    t(e.name, 272, 650, e.name.length > 9 ? 34 : 40, '#fff3d6', true, 'center');
    ch.forEach(function (c2, i) { t('第' + c2.day + '日 ' + c2.label, 52, 714 + i * 40, 24, '#ffe9c4'); });
    if (best) { t('最常来：' + R.byId[best].name, 52, 850, 26, '#fff3d6', true); }
    t('现金 ' + Math.round(s.cash / 100) + ' 元 · 口碑 ' + Math.round(s.rep), 52, 892, 22, '#ffd9a0');
    x.save(); x.translate(450, 860); x.rotate(-0.2); seal(x, SEAL[s.ending.id] || '月底', 46); x.restore();
    return c;
  }
  function Share(app) { this.name = 'share'; this.app = app; this.card = buildCard(app); this.status = null; }
  Share.prototype.draw = function (ctx) {
    var app = this.app, self = this;
    ctx.fillStyle = 'rgba(15,10,6,.85)'; ctx.fillRect(0, 0, 1280, 720);
    var h = 640, w = h * 544 / 960;
    ctx.drawImage(this.card, 200, 40, w, h);
    U.text(ctx, '竖屏分享卡', 680, 140, { size: 30, bold: true, color: '#fff3d6' });
    U.para(ctx, '不含二维码，也不会透露你还没看到的剧情。', 680, 190, 480, { size: 22, color: '#fff3d6', lh: 32 });
    U.button(ctx, 'share_save', 680, 280, 260, 64, '保存图片', { onTap: function () { self.status = '保存中…'; app.P.saveImage(self.card, 'bushaoxin-ending.png').then(function () { self.status = '已保存'; }, function () { self.status = '保存失败：可再试一次，或直接截屏'; }); } });
    U.button(ctx, 'share_close', 680, 370, 260, 60, '返回', { kind: 'paper', onTap: function () { app.closeOverlay(); } });
    if (this.status) U.text(ctx, this.status, 680, 470, { size: 22, color: '#ffd9a0' });
  };
  Share.prototype.describe = function () { return { w: this.card.width, h: this.card.height, status: this.status }; };

  // ───────── 常营业周结算
  function WeekResult(app) { this.name = 'weekResult'; this.app = app; this.t = 0; Sc.set({ view: 'ext', time: 'dusk', weather: 'sun', shutter: 0.3 }); if (!app.weekResult) app.onEnded(); Au.play('bell'); }
  WeekResult.prototype.update = function (dt) { this.t += dt; };
  WeekResult.prototype.draw = function (ctx) {
    var app = this.app, r = app.weekResult, s = app.state, th = Run.theme(s);
    Sc.drawBack(ctx); Sc.drawFront(ctx);
    ctx.fillStyle = 'rgba(20,12,6,.55)'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 240, 80, 800, 540, 'paper');
    U.text(ctx, th.name + ' · 七日结束', 640, 150, { size: 36, bold: true, align: 'center' });
    U.text(ctx, '目标：' + r.goal.label, 640, 214, { size: 26, align: 'center' });
    U.text(ctx, r.done ? '完成！' : '这次没做到', 640, 290, { size: 48, bold: true, align: 'center', color: r.done ? '#2f6f66' : '#b8432f' });
    var m = r.summary;
    [['净赚', U.coin(m.profit) + ' 元'], ['招牌', m.signature + ' 份'], ['没等到', m.lost + ' 人'], ['口碑变化', (m.repDelta >= 0 ? '+' : '') + Math.round(m.repDelta)]].forEach(function (x, i) { U.text(ctx, x[0], 340 + i * 160, 380, { size: 20, color: '#7d5a35', align: 'center' }); U.text(ctx, x[1], 340 + i * 160, 420, { size: 28, bold: true, align: 'center' }); });
    var rec = app.legacy.weeks[s.theme];
    if (rec) U.text(ctx, '本主题已完成 ' + rec.done + ' 次 / 共 ' + rec.plays + ' 次 · 失败不扣任何东西', 640, 480, { size: 20, align: 'center', color: '#7d5a35' });
    U.button(ctx, 'wr_again', 360, 520, 260, 64, '再开一周', { onTap: function () { app.openOverlay(BSX.require('ui/s_basic').WeekPick); } });
    U.button(ctx, 'wr_title', 660, 520, 260, 64, '回标题', { kind: 'paper', onTap: function () { app.go(BSX.require('ui/s_basic').Title); } });
  };
  WeekResult.prototype.describe = function () { return this.app.weekResult; };
  return { Ending: Ending, Share: Share, WeekResult: WeekResult, buildCard: buildCard };
});
