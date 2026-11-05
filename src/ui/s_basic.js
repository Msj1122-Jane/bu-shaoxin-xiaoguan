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
    A.loadGroup('boot', function (p) { self.p = p * 0.75; }, function () {
      A.loadGroup('chars', function (p) { self.p = 0.75 + p * 0.25; }, function () {
        self.p = 1; self.state = A.errors.length ? 'error' : 'done';
        if (!A.errors.length) A.loadGroup('late');
      });
    });
  };
  X.Loading.prototype.update = function (dt) { this.t += dt; if (this.state === 'done' && this.t > 0.4) { this.app.go(X.Title); } };
  X.Loading.prototype.draw = function (ctx) {
    var self = this, app = this.app;
    ctx.fillStyle = '#2a1e14'; ctx.fillRect(0, 0, 1280, 720);
    // 卷帘门
    ctx.fillStyle = '#7f8c86'; ctx.fillRect(340, 120, 600, 380);
    for (var y = 124; y < 500; y += 12) { ctx.fillStyle = '#93a19a'; ctx.fillRect(340, y, 600, 4); ctx.fillStyle = '#65716b'; ctx.fillRect(340, y + 7, 600, 2); }
    U.text(ctx, '不烧心小馆', 640, 290, { size: 72, bold: true, align: 'center', color: '#fff3d6', stroke: '#4a2a12', strokeW: 10 });
    U.text(ctx, '当代江南社区早餐铺', 640, 350, { size: 26, align: 'center', color: '#fff3d6', stroke: '#4a2a12' });
    ctx.fillStyle = 'rgba(0,0,0,.4)'; U.rr(ctx, 390, 560, 500, 22, 11); ctx.fill();
    ctx.fillStyle = '#e8b54a'; U.rr(ctx, 390, 560, Math.max(22, 500 * this.p), 22, 11); ctx.fill();
    U.text(ctx, this.state === 'error' ? '有 ' + A.errors.length + ' 个资源没加载上' : '生火中… ' + Math.round(this.p * 100) + '%', 640, 620, { size: 22, align: 'center', color: '#fff3d6' });
    if (this.state === 'error') {
      A.errors.slice(0, 3).forEach(function (e, i) { U.text(ctx, e.path, 640, 650 + i * 22, { size: 16, align: 'center', color: '#ffb08a' }); });
      U.button(ctx, 'load_retry', 420, 470, 200, 60, '重试', { onTap: function () { self.start(); } });
      U.button(ctx, 'load_continue', 660, 470, 220, 60, '用占位继续', { kind: 'wood', onTap: function () { self.app.go(X.Title); } });
    }
  };
  X.Loading.prototype.describe = function () { return { progress: Math.round(this.p * 100) / 100, state: this.state, errors: A.errors.map(function (e) { return e.id; }) }; };

  // ───────── 标题
  X.Title = function (app) {
    this.name = 'title'; this.app = app; this.t = 0;
    Sc.set({ view: 'ext', time: 'morning', weather: 'sun', shutter: 0.55, crowd: 0 }); Sc.moveCam(640, 360, 1, 0);
    var r = app.store.loadRun(); this.canContinue = !!(r && r.state.phase !== 'ended'); this.contDay = r ? r.state.day : 0; this.contMode = r ? r.state.mode : null;
    this.notice = app.store.notice; app.store.notice = null;
    Au.setAmbience('morning', false);
  };
  X.Title.prototype.update = function (dt) { this.t += dt; };
  X.Title.prototype.draw = function (ctx) {
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
    if (L.runs) U.text(ctx, '店史：第 ' + L.runs + ' 个月 · 印章 ' + Object.keys(L.endings).length + '/8', 1240, 700, { size: 18, align: 'right', color: '#fff3d6', stroke: '#4a2a12' });
  };
  X.Title.prototype.describe = function () { return { canContinue: this.canContinue, continueDay: this.contDay, legacyRuns: this.app.legacy.runs, notice: this.notice }; };

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
    U.button(ctx, 'nm_go', 440, 540, 260, 70, self.pick ? '带上它开门' : '空手开门', { size: 28, onTap: function () { app.newRun({ seed: (Date.now() % 1e9) >>> 0, heirloom: self.pick, generation: L.runs + 1, preferUnseen: Legacy.unseenEvents(L) }); } });
    U.button(ctx, 'nm_back', 720, 540, 160, 70, '返回', { kind: 'paper', onTap: function () { app.closeOverlay(); } });
  };
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
      if (r[2] === 'vol') { [0, 0.25, 0.5, 0.75, 1].forEach(function (v, j) { var on = s[r[1]] >= v - 0.01 && v > 0; U.button(ctx, 'set_' + r[1] + '_' + j, x + 130 + j * 44, y + 8, 38, 44, '', { kind: on ? 'primary' : 'paper', minSize: 44, onTap: function () { s[r[1]] = v; app.applySettings(); Au.play('tap'); } }); }); }
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
