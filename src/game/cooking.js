// 烹饪系统（docs/COOKING_SYSTEM.md）：
//   器具状态机（每个器具一次做一份） → 工序（五类手势）→ 品质（招牌/家常/匆忙） → 托盘 → 拖到顾客交付
//   timing.bg 工序在后台持续加热：玩家可以离开近景去做别的菜（并行状态），器具在操作台上显示熟度环与呼吸光。
// 输入反馈链：输入 → 状态变化 → 动画/声音/粒子/轻震 → 清楚结果 → 下一步诱因
BSX.define('game/cooking', function (require) {
  var D = require('content/dishes');
  var C = require('content/config');
  var A = require('game/assets');
  var Au = require('game/audio');
  var U = require('ui/ui');
  var TAU = Math.PI * 2;
  var PANEL = { x: 214, y: 132, w: 852, h: 560 };
  var VC = { x: 610, y: 430, r: 165 };
  var SRC = { x: 330, y: 560 }, BOWL = { x: 900, y: 560 };
  var LABEL = { grind: '磨浆', pour: '倒豆浆', rice: '下米', stir: '搅', thicken: '看稠度', scoop: '盛碗', pull: '拉面坯', drop: '下锅', flip: '翻面', lift: '起锅', roll: '擀饼', lay: '下锅', crack: '打蛋', shake: '晃锅', set: '起锅', boil: '煮', broth: '浇汤', egg: '打蛋', toss: '颠锅', dip: '泡油条', add: '下料', place: '摆好', sear: '煎底', lid: '开盖', skim: '撇沫', blanch: '烫', eggs: '放蛋', stew: '卤', sugar: '裹糖', fry: '炸', wrap: '包', steam: '蒸', poach: '卧蛋', pleat: '捏褶', season: '调味' };
  var VERB = { circle: '画圈', drag: '拖', hold: '按住', swipe: '滑', timing: '看准时机点' };

  function Kitchen(opts) {
    this.menu = opts.menu; this.prof = opts.prof || {}; this.oilAge = opts.oilAge || 0; this.burn = opts.burn || 0; this.assist = !!opts.assist; this.reduceMotion = !!opts.reduceMotion; this.vibrate = opts.vibrate || function () {};
    this.stations = []; this.tray = []; this.parts = []; this.floats = []; this.open = null; this.picker = null; this.t = 0; this.dragTray = null; this.log = [];
    var types = [];
    this.menu.forEach(function (id) { var st = D.byId[id].station; if (types.indexOf(st) < 0) types.push(st); });
    this.trayMax = opts.trayMax || 4; this.heat = opts.heat || 1; this.cheatsUsed = 0;
    var list = types.map(function (tp) { return { id: tp, type: tp }; });
    if (opts.pot2) { var dup = types.filter(function (tp) { return ['pot', 'noodle', 'fryer', 'pan'].indexOf(tp) >= 0; })[0] || types[0]; var at = types.indexOf(dup); list.splice(at + 1, 0, { id: dup + '2', type: dup }); }
    var n = list.length, x0 = n >= 5 ? 150 : 190, x1 = n >= 5 ? 950 : 930, self = this;
    list.forEach(function (it, i) {
      var cx = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (n - 1), w = n >= 5 ? 128 : 144;
      self.stations.push({ id: it.id, type: it.type, name: D.stations[it.type].name + (it.id !== it.type ? '２' : ''), x: cx - w / 2, y: 548, w: w, h: 132, cx: cx, job: null, pulse: 0, dishes: self.menu.filter(function (d) { return D.byId[d].station === it.type; }) });
    });
    this.trayRect = { x: 1010, y: 560, w: 230, h: 120 };
  }
  var K = Kitchen.prototype;
  K.station = function (id) { var all = this.stations.filter(function (s) { return s.id === id || s.type === id; }); return all.filter(function (s) { return !s.job; })[0] || all[0]; };
  K.stars = function (dish) { var p = this.prof[dish]; return p ? p.star : 0; };
  K.windowFor = function (job, step) {
    var w = step.win.slice(), bonus = this.stars(job.dish) * C.starWindowBonus;
    if (this.assist) bonus += (w[1] - w[0]) * 0.3;
    return [Math.max(0.05, w[0] - bonus), Math.min(0.99, w[1] + bonus)];
  };
  K.startJob = function (st, dish) {
    st.job = { dish: dish, idx: 0, scores: [], s: null, done: false, attempts: 0, mat: null };
    this.beginStep(st);
    this.log.push('start ' + dish);
  };
  K.beginStep = function (st) {
    var job = st.job, step = D.byId[job.dish].steps[job.idx];
    var n = step.n || 1;
    if (step.g === 'swipe' && this.assist) n = Math.ceil(n / 2);
    job.s = { g: step.g, key: step.key, t: 0, p: 0, angle: 0, inBand: 0, total: 0, level: 0, holding: false, count: 0, need: n, placed: 0, misses: 0, lastAng: null, dir: 0, dots: 0, early: 0, committed: false, spill: false, bgRunning: step.g === 'timing' && step.bg, splash: 0 };
    if (step.g === 'timing' && step.bg) st.bgStart = this.t;
  };
  K.stepOf = function (st) { return st.job ? D.byId[st.job.dish].steps[st.job.idx] : null; };
  K.finishStep = function (st, score) {
    var job = st.job, step = this.stepOf(st);
    score = Math.max(0.3, Math.min(1, score));
    job.scores.push({ key: step.key, score: score, w: step.w });
    var tag = score >= 0.9 ? 'great' : score >= 0.65 ? 'ok' : 'meh';
    this.float(this.open === st ? VC.x : st.cx, this.open === st ? VC.y - VC.r - 20 : st.y - 10, tag === 'great' ? (score >= 0.95 ? '完美！' : '好！') : tag === 'ok' ? '行' : '差点', tag === 'great' ? '#ffe28a' : tag === 'ok' ? '#fff' : '#d9c3a0');
    if (tag === 'great') {
      Au.play('perfect'); this.burst(this.open === st ? VC.x : st.cx, this.open === st ? VC.y : st.y + 40, 'spark', 12);
      if (score >= 0.95 && (step.g === 'timing' || step.g === 'hold')) { this.hitStop = this.reduceMotion ? 0 : 0.11; this.perfectFx = { x: this.open === st ? VC.x : st.cx, y: this.open === st ? VC.y : st.y + 40, t: 0 }; Au.play('sizzle'); this.vibrate('heavy'); }
    }
    else Au.play(tag === 'ok' ? 'ok' : 'rushed');
    job.idx++;
    if (job.idx >= D.byId[job.dish].steps.length) this.completeDish(st);
    else this.beginStep(st);
  };
  K.completeDish = function (st) {
    var job = st.job, sum = 0, ws = 0;
    job.scores.forEach(function (x) { sum += x.score * x.w; ws += x.w; });
    var q = ws ? sum / ws : 0.7;
    var grade = q >= C.quality.signature ? 'sig' : q >= C.quality.home ? 'home' : 'rush';
    this.tray.push({ dish: job.dish, cheats: job.cheats || 0, cheatGain: job.cheatGain || 0, q: Math.round(q * 100) / 100, grade: grade, fly: 0, from: { x: this.open === st ? VC.x : st.cx, y: this.open === st ? VC.y : st.y } });
    this.float(this.open === st ? VC.x : st.cx, (this.open === st ? VC.y : st.y) - 40, grade === 'sig' ? '招牌' : grade === 'home' ? '家常' : '匆忙', grade === 'sig' ? '#ffd45a' : grade === 'home' ? '#fff3d6' : '#cdb79a', grade === 'sig' ? 40 : 30);
    Au.play(grade === 'sig' ? 'perfect' : 'bowl'); if (grade === 'sig') this.vibrate('light');
    // 差在哪一步：不是招牌时点名最弱的一步（评审 #20）
    if (grade !== 'sig' && job.scores.length) { var worst = job.scores.slice().sort(function (x, y) { return x.score - y.score; })[0]; var stp = D.byId[job.dish].steps.filter(function (z) { return z.key === worst.key; })[0]; var why = stp && stp.g === 'timing' ? (worst.early ? '早了点' : '火候没卡准') : stp && stp.g === 'hold' ? '没停在刚好' : stp && stp.g === 'circle' ? '圈没画匀' : '慢了点'; this.float(this.open === st ? VC.x : st.cx, (this.open === st ? VC.y : st.y) + 6, (LABEL[worst.key] || '这一步') + why, '#ffd9b0', 22); }
    this.log.push('done ' + job.dish + ' ' + grade + ' ' + q.toFixed(2));
    st.job = null;
    if (this.open === st) this.open = null;
    this.lastDone = { dish: job.dish, grade: grade, q: q };
  };
  // 黑心捷径：直接完成当前工序，当场多赚，黑心值上涨，顾客可能吃坏肚子（D031）
  K.cheat = function (st) {
    var job = st && st.job; if (!job || job.cheats) return false;
    var c = D.stations[st.type].cheat;
    job.cheats = 1; job.cheatGain = c.save; this.cheatsUsed++;
    Au.play('coin'); Au.play('risk'); this.vibrate('light');
    var fx = this.open === st ? VC.x + 210 : st.cx, fy = this.open === st ? VC.y + 80 : st.y - 40;
    this.float(fx, fy, '偷懒 +' + (c.save / 100) + '元', '#ffd45a', 34);
    for (var i = 0; i < 6; i++) this.parts.push({ x: fx, y: fy + 40, vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 120, t: 0, life: 0.9, kind: 'coin' });
    if (this.onCheat) this.onCheat(st, c);
    // 一下做完：剩下的工序全部糊弄过去（省时间，但这一碗是在赌）
    var guard = 0; while (st.job === job && guard++ < 8) this.finishStep(st, 0.78);
    return true;
  };
  K.float = function (x, y, text, col, size) { this.floats.push({ x: x, y: y, text: text, col: col, size: size || 30, t: 0 }); };
  K.burst = function (x, y, kind, n) {
    if (this.parts.length > 120) return;
    if (this.reduceMotion) n = Math.ceil(n / 3);
    for (var i = 0; i < n; i++) { var a = Math.random() * TAU, v = 60 + Math.random() * 140; this.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, life: 0.5 + Math.random() * 0.4, kind: kind }); }
  };
  K.steam = function (x, y, n) { if (this.parts.length > 120 || this.reduceMotion && Math.random() < 0.6) return; for (var i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 60, y: y, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 30, t: 0, life: 1.4 + Math.random(), kind: 'steam', r: 10 + Math.random() * 12 }); };

  // ───────────────────────── 更新
  K.update = function (dt) {
    var self = this; this.t += dt;
    if (this.perfectFx) { this.perfectFx.t += dt; if (this.perfectFx.t > 0.7) this.perfectFx = null; }
    if (this.hitStop > 0) { this.hitStop -= dt; return; }
    this.stations.forEach(function (st) {
      st.pulse += dt;
      var job = st.job; if (!job) { if (Math.random() < dt * 0.4 && st.type !== 'soy') self.steam(st.cx, st.y + 10, 1); return; }
      var step = self.stepOf(st), s = job.s;
      if (s.g === 'timing' && (step.bg || self.open === st) && !s.committed) {
        s.p += dt * self.heat / (step.dur * (self.assist ? 1.15 : 1));
        if (s.p > 1.6) s.p = 1.6;
        var w = self.windowFor(job, step);
        if (s.p >= w[0] && !s.pinged) { s.pinged = true; Au.play('bell'); }
        if (Math.random() < dt * (2 + s.p * 6)) { self.steam(self.open === st ? VC.x : st.cx, self.open === st ? VC.y - 60 : st.y + 10, 1); if (self.open === st) Au.play(st.type === 'fryer' || st.type === 'pan' ? 'sizzle' : 'bubble'); }
        if (s.p > w[1] + 0.25 && !s.warned) { s.warned = true; self.float(self.open === st ? VC.x : st.cx, self.open === st ? VC.y - 100 : st.y - 20, '快！', '#ffb08a'); Au.play('risk'); }
      }
      if (s.g === 'hold' && s.holding) {
        var rate = step.rate * (self.assist ? 0.6 : 1);
        s.level = Math.min(1.12, s.level + rate * dt);
        if (s.level > 1.0 && !s.spill) { s.spill = true; Au.play('wrong'); self.burst(BOWL.x, BOWL.y - 60, 'drop', 6); }
        if (Math.random() < dt * 10) Au.play('pour');
      }
      if (s.splash > 0) s.splash -= dt;
    });
    this.tray.forEach(function (it) { it.fly = Math.min(1, it.fly + dt * 2.5); });
    this.parts = this.parts.filter(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind !== 'steam' && p.kind !== 'smoke') p.vy += (p.kind === 'coin' ? 500 : 300) * dt; else p.vx += Math.sin(p.t * 3) * 6 * dt; return p.t < p.life; });
    this.floats = this.floats.filter(function (f) { f.t += dt; return f.t < 1.1; });
  };

  // ───────────────────────── 输入（逻辑坐标）。返回 true 表示已消费
  K.pointer = function (type, x, y) {
    if (this.open) return this.closeupPointer(type, x, y);
    return false;
  };
  K.tapStation = function (st) {
    if (st.job) { this.open = st; Au.play('tap'); this.picker = null; return 'open'; }
    if (this.tray.length >= this.trayMax) { this.float(st.cx, st.y - 20, '托盘满了', '#ffb08a'); Au.play('wrong'); return 'full'; }
    if (st.dishes.length === 1) { this.startJob(st, st.dishes[0]); this.open = st; Au.play('pickup'); return 'start'; }
    this.picker = this.picker === st ? null : st; Au.play('tap'); return 'picker';
  };
  K.pickDish = function (st, dish) { this.picker = null; this.startJob(st, dish); this.open = st; Au.play('pickup'); };
  K.close = function () { if (this.open) { var s = this.open.job && this.open.job.s; if (s && s.holding) s.holding = false; this.open = null; Au.play('tap'); } };
  K.closeupPointer = function (type, x, y) {
    var st = this.open, job = st.job;
    if (!job) { this.open = null; return false; }
    if (!job.mat) return false; // 先选料：交给选料按钮处理

    var step = this.stepOf(st), s = job.s;
    var inPanel = x >= PANEL.x && x <= PANEL.x + PANEL.w && y >= PANEL.y && y <= PANEL.y + PANEL.h;
    if (type === 'down' && !inPanel) { this.close(); return true; }
    var h = this['g_' + s.g];
    if (h) h.call(this, st, step, s, type, x, y);
    return true;
  };
  function dist(a, b, x, y) { return Math.hypot(a - x, b - y); }
  function itemPos(s, step) { return step.key === 'scoop' ? { x: VC.x, y: VC.y } : { x: SRC.x, y: SRC.y }; }
  function targetPos(step) { return step.key === 'scoop' ? BOWL : VC; }
  // 拖拽：抬起、阴影、吸附、落下、错误区域回弹
  K.g_drag = function (st, step, s, type, x, y) {
    var src = itemPos(s, step), tg = targetPos(step);
    if (type === 'down') { if (dist(src.x, src.y, x, y) < 90) { s.dragging = true; s.dx = x; s.dy = y; Au.play('pickup'); this.vibrate('light'); } return; }
    if (type === 'move' && s.dragging) { s.dx = x; s.dy = y; s.near = dist(tg.x, tg.y, x, y) < (step.key === 'scoop' ? 110 : VC.r * 0.9); return; }
    if ((type === 'up' || type === 'cancel') && s.dragging) {
      s.dragging = false;
      var ok = type === 'up' && dist(tg.x, tg.y, x, y) < (step.key === 'scoop' ? 120 : VC.r * 0.95);
      if (ok) {
        s.placed++; Au.play(step.key === 'scoop' ? 'bowl' : 'drop'); this.burst(x, y, step.key === 'scoop' ? 'drop' : 'splash', 5); s.land = { x: x, y: y, t: 0 };
        if (s.placed >= s.need) this.finishStep(st, s.misses ? 0.82 : 1);
      } else { s.misses++; s.bounce = { x: x, y: y, t: 0 }; Au.play('wrong'); }
    }
  };
  // 画圈：速度与连续性影响稠度；方向可逆；太快溅出可补救
  K.g_circle = function (st, step, s, type, x, y) {
    var need = step.turns * TAU;
    if (this.assist) {
      if (type !== 'down') return;
      var k = s.dots % 3, a = -Math.PI / 2 + k * TAU / 3, dx = VC.x + Math.cos(a) * VC.r * 0.7, dy = VC.y + Math.sin(a) * VC.r * 0.7;
      if (dist(dx, dy, x, y) < 70) { s.dots++; s.angle = s.dots * TAU / 3; s.inBand += 1; s.total += 1; Au.play('stir'); if (s.angle >= need - 0.01) this.finishStep(st, 0.9); }
      return;
    }
    var ang = Math.atan2(y - VC.y, x - VC.x), r = dist(VC.x, VC.y, x, y);
    if (type === 'down') { if (r < VC.r * 1.15) { s.stirring = true; s.lastAng = ang; s.lastT = this.t; s.sx = x; s.sy = y; } return; }
    if (type === 'move' && s.stirring) {
      s.sx = x; s.sy = y;
      if (r < 25) return; // 中心附近角度不稳，忽略
      var d = ang - s.lastAng; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      var dt = Math.max(0.004, this.t - s.lastT);
      var w = Math.abs(d) / dt; // rad/s
      var dir = d > 0 ? 1 : -1;
      if (s.dir && dir !== s.dir && Math.abs(d) > 0.05) { s.angle = Math.max(0, s.angle - 0.4); }
      s.dir = dir;
      s.angle += Math.abs(d); s.lastAng = ang; s.lastT = this.t; s.w = w;
      var lo = 2.2 - this.stars(st.job.dish) * 0.2, hi = 7.5 + this.stars(st.job.dish) * 0.6;
      var seg = Math.abs(d);
      s.total += seg; if (w >= lo && w <= hi) s.inBand += seg;
      if (w > hi + 2 && s.splash <= 0) { s.splash = 0.35; this.burst(x, y, 'splash', 4); Au.play('drop'); }
      if (Math.random() < 0.18) Au.play('stir');
      if (s.angle >= need) { s.stirring = false; this.finishStep(st, 0.5 + 0.5 * (s.total ? s.inBand / s.total : 1)); }
      return;
    }
    if (type === 'up' || type === 'cancel') s.stirring = false;
  };
  // 按住倾倒：液面、流速、声音和目标刻度共同反馈；早松可再按补，溢出算匆忙但不报废
  K.g_hold = function (st, step, s, type, x, y) {
    if (type === 'down') { s.holding = true; this.vibrate('light'); return; }
    if ((type === 'up' || type === 'cancel') && s.holding) {
      s.holding = false;
      var b = step.band || [0.75, 0.9], bonus = this.stars(st.job.dish) * 0.02 + (this.assist ? 0.04 : 0), lo = b[0] - bonus, hi = b[1] + bonus;
      if (s.level < lo - 0.12) { this.float(BOWL.x, BOWL.y - 150, '还不够', '#fff'); return; }
      var score = s.level >= lo && s.level <= hi ? 1 - Math.abs(s.level - (lo + hi) / 2) / ((hi - lo) / 2) * 0.12 : s.level < lo ? 0.72 : s.level <= 1.0 ? 0.7 : 0.5;
      this.finishStep(st, score);
    }
  };
  // 滑动：拉伸/擀/颠/挑/捏，长度与方向决定形态
  K.g_swipe = function (st, step, s, type, x, y) {
    if (type === 'down') { s.sw = { x0: x, y0: y, x: x, y: y }; return; }
    if (type === 'move' && s.sw) { s.sw.x = x; s.sw.y = y; s.stretch = step.dir === 'h' ? Math.min(1, Math.abs(x - s.sw.x0) / 220) : Math.min(1, Math.max(0, s.sw.y0 - y) / 160); return; }
    if ((type === 'up' || type === 'cancel') && s.sw) {
      var dx = s.sw.x - s.sw.x0, dy = s.sw.y0 - s.sw.y, len = step.dir === 'h' ? Math.abs(dx) : dy, need = step.dir === 'h' ? 150 : 110;
      s.sw = null; s.stretch = 0;
      if (len >= need * 0.55) {
        s.count++; s.q = (s.q || 0) + Math.min(1, len / need); s.pop = 0.3;
        Au.play(step.key === 'toss' || step.key === 'shake' ? 'sizzle' : 'flip'); this.burst(VC.x, VC.y - 20, step.key === 'toss' ? 'rice' : 'flour', 5);
        if (s.count >= s.need) this.finishStep(st, Math.min(1, 0.55 + 0.45 * s.q / s.count));
      } else if (len > 20) { this.float(VC.x, VC.y - 120, step.dir === 'h' ? '再长一点' : '再往上', '#fff'); }
    }
  };
  // 时机：颜色、气泡、蒸汽、声音提示；太早轻晃不提交，过头可补救（最低匆忙）
  K.g_timing = function (st, step, s, type, x, y) {
    if (type !== 'down' || s.committed) return;
    if (dist(VC.x, VC.y, x, y) > VC.r * 1.3) return;
    var w = this.windowFor(st.job, step), p = s.p;
    if (p < w[0] - 0.18) { s.early++; s.wiggle = 0.3; this.float(VC.x, VC.y - 140, '还没好', '#fff'); Au.play('tap'); return; }
    var score;
    if (p < w[0]) score = 0.72; else if (p <= w[1]) { var mid = (w[0] + w[1]) / 2; score = 1 - Math.abs(p - mid) / ((w[1] - w[0]) / 2) * 0.1; } else score = Math.max(0.35, 0.85 - (p - w[1]) * 1.6);
    score -= s.early * 0.04;
    s.committed = true; Au.play('flip'); this.vibrate('light');
    this.finishStep(st, score);
  };

  // 托盘交付（由营业界面调用）：返回交付掉的条目
  K.takeForOrder = function (need) {
    var out = [], left = need.slice(), self = this;
    this.tray = this.tray.filter(function (it) { var i = left.indexOf(it.dish); if (i >= 0 && it.fly >= 1) { left.splice(i, 1); out.push(it); return false; } return true; });
    return out;
  };
  K.trashFromTray = function (i) { this.tray.splice(i, 1); };

  // ───────────────────────── 绘制：操作台
  K.drawCounter = function (ctx, hints) {
    var self = this;
    // 木操作台
    ctx.save();
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, 520, 1280, 200);
    var g = ctx.createLinearGradient(0, 500, 0, 560); g.addColorStop(0, '#c98d55'); g.addColorStop(1, '#a56c3c');
    ctx.fillStyle = g; ctx.fillRect(0, 500, 1280, 60);
    ctx.fillStyle = '#6e4224'; ctx.fillRect(0, 556, 1280, 6);
    ctx.strokeStyle = 'rgba(70,35,10,.22)'; ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 575 + i * 24); ctx.bezierCurveTo(400, 580 + i * 24, 800, 568 + i * 24, 1280, 576 + i * 24); ctx.stroke(); }
    ctx.restore();
    this.stations.forEach(function (st) { self.drawStation(ctx, st, hints && hints.station === st.id); });
    // 托盘
    var T = this.trayRect;
    A.cell(ctx, 'atlas_equipment', 7, T.x, T.y - 10, T.w, T.h + 20, { trim: true, fit: true, anchor: 'center' });
    this.tray.forEach(function (it, i) {
      var tx = T.x + 40 + (i % 3) * 64, ty = T.y + 18 + Math.floor(i / 3) * 40;
      if (self.dragTray) return;
      var k = it.fly, x = it.from.x + (tx - it.from.x) * k, y = it.from.y + (ty - it.from.y) * k - Math.sin(k * Math.PI) * 80;
      A.food(ctx, it.dish, x - 30, y - 30, 60);
      if (it.grade === 'sig' && k >= 1) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(self.t * 4) * 0.3; A.cell(ctx, 'atlas_vfx', 15, x + 8, y - 34, 28, 28, { trim: true, fit: true }); ctx.restore(); }
    });
    if (hints && hints.tray && this.tray.length) { ctx.save(); ctx.strokeStyle = 'rgba(255,226,138,' + (0.5 + Math.sin(this.t * 5) * 0.4) + ')'; ctx.lineWidth = 5; U.rr(ctx, T.x - 4, T.y - 4, T.w + 8, T.h + 8, 14); ctx.stroke(); ctx.restore(); }
    // 拖动中的托盘
    if (this.dragTray) {
      var d = this.dragTray;
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 50, 110, 22, 0, 0, 7); ctx.fill(); ctx.restore();
      A.cell(ctx, 'atlas_equipment', 7, d.x - 115, d.y - 60, 230, 130, { trim: true, fit: true, anchor: 'center' });
      this.tray.forEach(function (it, i) { A.food(ctx, it.dish, d.x - 85 + (i % 3) * 60, d.y - 48 + Math.floor(i / 3) * 36, 56); });
    }
    this.drawParts(ctx, false);
  };
  K.drawStation = function (ctx, st, hint) {
    var job = st.job, s = job && job.s, step = job && this.stepOf(st);
    var glow = 0;
    if (s && s.g === 'timing' && step.bg) { var w = this.windowFor(job, step); if (s.p >= w[0] - 0.15) glow = s.p > w[1] ? 1 : 0.6 + Math.sin(this.t * 10) * 0.4; }
    var hov = U.hover === 'st_' + st.id, press = U.pressed === 'st_' + st.id;
    ctx.save();
    var sc = press ? 0.95 : hov ? 1.04 : 1;
    ctx.translate(st.cx, st.y + st.h); ctx.scale(sc, sc); ctx.translate(-st.cx, -(st.y + st.h));
    if (hint) { ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(this.t * 4) * 0.3; Sc().glow(ctx, st.cx, st.y + 60, 110, 'rgba(255,220,120,.9)'); ctx.restore(); }
    if (glow) { ctx.save(); ctx.globalAlpha = glow; Sc().glow(ctx, st.cx, st.y + 50, 110, s.p > this.windowFor(job, step)[1] ? 'rgba(255,90,40,.9)' : 'rgba(255,200,80,.9)'); ctx.restore(); }
    var eq = D.stations[st.type].equip, view = D.stations[st.type].view;
    if (view === 'pan' || view === 'wok') miniPan(ctx, st.cx, st.y + 80, view === 'wok', job, s);
    else if (view === 'steamer') miniSteamer(ctx, st.cx, st.y + 78);
    else if (view === 'stew') { A.cell(ctx, 'atlas_equipment', 0, st.x + 8, st.y + 8, st.w - 16, st.h - 16, { trim: true, fit: true }); ctx.fillStyle = 'rgba(90,50,20,.55)'; ctx.beginPath(); ctx.ellipse(st.cx, st.y + 52, 46, 12, 0, 0, 7); ctx.fill(); }
    else A.cell(ctx, 'atlas_equipment', job && view !== 'cup' ? (eq === 0 ? 1 : eq) : eq, st.x + 8, st.y + 4, st.w - 16, st.h - 8, { trim: true, fit: true });
    if (view === 'fryer' && this.oilAge >= 2) { ctx.fillStyle = 'rgba(60,30,8,' + Math.min(0.55, this.oilAge * 0.12) + ')'; ctx.beginPath(); ctx.ellipse(st.cx - 4, st.y + 44, 40, 12, 0, 0, 7); ctx.fill(); if (this.oilAge >= 3 && Math.random() < 0.05 && this.parts.length < 120) this.parts.push({ x: st.cx, y: st.y + 30, vx: (Math.random() - 0.5) * 8, vy: -26, t: 0, life: 1.6, kind: 'smoke', r: 10 }); }
    ctx.restore();
    // 当前菜与熟度环
    if (job) {
      A.food(ctx, job.dish, st.cx + 30, st.y - 18, 46);
      if (s.g === 'timing' && step.bg) { var w2 = this.windowFor(job, step); U.ring(ctx, st.cx + 53, st.y + 5, 26, Math.min(1, s.p), s.p > w2[1] ? '#e0603a' : s.p >= w2[0] ? '#ffd45a' : '#f2e6c8', 6); }
      else { ctx.save(); ctx.fillStyle = 'rgba(30,20,10,.6)'; U.rr(ctx, st.cx - 60, st.y - 10, 82, 26, 8); ctx.fill(); ctx.restore(); U.text(ctx, (job.idx + 1) + '/' + D.byId[job.dish].steps.length, st.cx - 19, st.y + 8, { size: 18, align: 'center', color: '#fff3d6', bold: true }); }
    }
  };
  // 好料 / 便宜料并排放：拿哪个下锅就是良心选择（D051，替代“偷懒”按钮）
  var MAT = { pot: ['新米', '陈米'], fryer: ['新油', '回锅油'], soy: ['现磨黄豆', '兑水豆浆'], pan: ['新油', '回锅油'], wok: ['现蒸米饭', '隔夜饭'], noodle: ['鲜面·新汤', '隔夜汤'], stew: ['新卤汁', '隔夜卤'], steamer: ['鲜肉馅', '过期馅'] };
  K.MAT = MAT;
  // 菜 → 生熟三阶段格位（cook_stages：0–2 油条，3–5 包子，6–8 豆浆，9–11 煎饼）
  var STAGES = { youtiao: [0, 1, 2], yeerba: [3, 4, 5], soy: [6, 7, 8], scallion: [9, 10, 10] };
  // 用早市副本的好料/坏料图（D058）：工位 → [图集, 行]
  var MATART = { pot: ['mk_grain', 3], wok: ['mk_grain', 3], fryer: ['mk_grain', 0], pan: ['mk_grain', 0], soy: ['mk_grain', 1], noodle: ['mk_grain', 2], stew: ['mk_veg', 3], steamer: ['mk_veg', 2] };
  K.chooseMat = function (st, cheap) {
    var job = st.job; if (!job || job.mat) return;
    job.mat = cheap ? 'cheap' : 'good';
    if (cheap) {
      var c = D.stations[st.type].cheat; job.cheats = 1; job.cheatGain = c.save; this.cheatsUsed++;
      Au.play('coin'); Au.play('risk'); this.vibrate('light');
      this.float(VC.x + 160, VC.y - 60, '+' + c.save / 100 + '元', '#ffd45a', 34);
      for (var i = 0; i < 6; i++) this.parts.push({ x: VC.x + 160, y: VC.y, vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 120, t: 0, life: 0.9, kind: 'coin' });
      if (this.onCheat) this.onCheat(st, c);
    } else { Au.play('pickup'); this.burst(VC.x - 160, VC.y, 'spark', 6); }
  };
  K.drawMaterialChoice = function (ctx, st) {
    var self = this, names = MAT[st.type] || ['好料', '便宜料'], save = (D.stations[st.type].cheat || { save: 250 }).save / 100;
    ctx.save(); ctx.fillStyle = 'rgba(20,12,6,.62)'; U.rr(ctx, PANEL.x + 20, PANEL.y + 80, PANEL.w - 40, PANEL.h - 100, 18); ctx.fill(); ctx.restore();
    U.text(ctx, '用哪份料？', PANEL.x + PANEL.w / 2, PANEL.y + 136, { size: 32, bold: true, align: 'center', color: '#fff3d6', stroke: '#3b2412' });
    [[0, names[0], '#2f6f66', '放心', 'mat_good'], [1, names[1], '#a8432f', '省 ' + save + ' 元', 'mat_cheap']].forEach(function (o) {
      var w = 230, h = 250, x = PANEL.x + PANEL.w / 2 - w - 20 + o[0] * (w + 40), y = PANEL.y + 170;
      var hit = U.hit(o[4], x, y, w, h, { label: o[1], onTap: function () { self.chooseMat(st, o[0] === 1); } });
      var lift = hit.pressed ? 4 : Math.sin(self.t * 3 + o[0]) * 2;
      ctx.save(); ctx.fillStyle = '#fff8e8'; U.rr(ctx, x, y + lift, w, h, 16); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = o[2]; ctx.stroke(); ctx.restore();
      // 料：好料是干净的白袋/金黄油瓶，便宜料是灰暗、带污渍的
      var cx = x + w / 2, cy = y + 104 + lift, mi = MATART[st.type];
      if (mi && A.img(mi[0])) { A.cell(ctx, mi[0], mi[1] * 2 + o[0], cx - 105, cy - 70, 210, 140, { fit: true, anchor: 'center' }); if (!o[0]) { ctx.fillStyle = '#ffd45a'; ctx.beginPath(); ctx.arc(cx + 88, cy - 58, 14, 0, 7); ctx.fill(); U.text(ctx, '鲜', cx + 88, cy - 51, { size: 16, bold: true, align: 'center', color: '#5a3418' }); } }
      else {
      ctx.fillStyle = o[0] ? '#8a7a62' : '#efe6d2'; U.rr(ctx, cx - 50, cy - 56, 100, 112, 20); ctx.fill();
      ctx.fillStyle = o[0] ? '#6a5a42' : '#d8ccb0'; ctx.fillRect(cx - 30, cy - 66, 60, 16);
      if (o[0]) { ctx.fillStyle = 'rgba(60,40,20,.5)'; ctx.beginPath(); ctx.arc(cx + 22, cy + 22, 14, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 18, cy - 10, 8, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = '#ffd45a'; ctx.beginPath(); ctx.arc(cx + 30, cy - 34, 14, 0, 7); ctx.fill(); U.text(ctx, '鲜', cx + 30, cy - 27, { size: 16, bold: true, align: 'center', color: '#5a3418' }); }
      }
      U.text(ctx, o[1], cx, y + 196 + lift, { size: 24, bold: true, align: 'center', color: '#3b2a1a', maxW: w - 20 });
      ctx.save(); ctx.fillStyle = o[2]; U.rr(ctx, cx - 60, y + 210 + lift, 120, 30, 8); ctx.fill(); ctx.restore();
      U.text(ctx, o[3], cx, y + 232 + lift, { size: 18, bold: true, align: 'center', color: '#fff' });
    });
  };
  // 客人快等不及时，锅上冒出“偷懒·一下做完”：诱惑就在手边（D049）
  K.drawUrgent = function (ctx) {
    if (!this.urgent) return;
    var self = this;
    this.stations.forEach(function (st) {
      var job = st.job; if (!job || job.cheats || self.open === st) return;
      var x = st.cx - 70, y = st.y - 74, pulse = 1 + Math.sin(self.t * 8) * 0.05;
      var h = U.hit('cheat_st_' + st.id, x, y, 140, 44, { label: '偷懒·一下做完', minSize: 44, onTap: function () { self.cheat(st); } });
      ctx.save(); ctx.translate(st.cx, y + 22); ctx.scale(pulse * (h.pressed ? 0.94 : 1), pulse * (h.pressed ? 0.94 : 1));
      ctx.fillStyle = '#7a1e14'; U.rr(ctx, -72, -20, 144, 44, 12); ctx.fill();
      ctx.fillStyle = '#c0392b'; U.rr(ctx, -70, -22, 140, 40, 12); ctx.fill();
      ctx.restore();
      U.text(ctx, '偷懒·一下做完', st.cx, y + 29, { size: 18, bold: true, align: 'center', color: '#fff3d6' });
    });
  };
  // 多菜共用器具的选菜气泡：最后绘制、最后注册热区，位于最上层
  K.drawPicker = function (ctx) {
    var st = this.picker; if (!st) return;
    {
      var n = st.dishes.length, bw = n * 84 + 16, bx = st.cx - bw / 2, by = st.y - 120;
      U.bubble(ctx, bx, by, bw, 96, st.cx);
      var self = this;
      st.dishes.forEach(function (d, i) {
        var x = bx + 12 + i * 84;
        var h = U.hit('pick_' + st.id + '_' + d, x, by + 8, 80, 80, { label: D.byId[d].name, onTap: function () { self.pickDish(st, d); } });
        if (h.pressed || h.hover) { ctx.save(); ctx.fillStyle = 'rgba(232,181,74,.35)'; U.rr(ctx, x, by + 8, 80, 80, 10); ctx.fill(); ctx.restore(); }
        A.food(ctx, d, x + 6, by + 10, 68);
      });
    }
  };
  function Sc() { return BSX.require('game/scene'); }
  function miniPan(ctx, cx, cy, wok, job, s) {
    ctx.save();
    // 像素化：先画到 1/4 精度再放大的观感——用块状描边与高光
    function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    if (wok) {
      // 炒锅：深圆底、钢灰、双耳 + 木柄，锅底有火
      px(cx - 40, cy + 18, 80, 10, 'rgba(255,120,40,.55)');
      ctx.fillStyle = '#2e2b2a'; ctx.beginPath(); ctx.moveTo(cx - 64, cy - 14); ctx.quadraticCurveTo(cx, cy + 46, cx + 64, cy - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a6e74'; ctx.beginPath(); ctx.ellipse(cx, cy - 14, 64, 16, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a3c40'; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 56, 12, 0, 0, 7); ctx.fill();
      px(cx - 40, cy - 20, 22, 4, 'rgba(255,255,255,.35)');
      px(cx - 80, cy - 20, 18, 8, '#2e2b2a'); px(cx - 84, cy - 22, 8, 12, '#2e2b2a');
      px(cx + 62, cy - 22, 50, 10, '#7a4a22'); px(cx + 62, cy - 22, 50, 3, '#a87040'); px(cx + 108, cy - 24, 8, 14, '#5a3418');
      if (job && s && s.g === 'timing') { ctx.fillStyle = doneCol(s.p, '#f3dfa8'); ctx.beginPath(); ctx.ellipse(cx, cy - 10, 30, 8, 0, 0, 7); ctx.fill(); }
    } else {
      // 平底锅：扁平黑、长直柄、侧面厚边
      px(cx - 58, cy - 2, 116, 14, '#1c1c20');
      ctx.fillStyle = '#26262a'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 58, 22, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#44444c'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 50, 17, 0, 0, 7); ctx.fill();
      px(cx - 30, cy - 14, 18, 3, 'rgba(255,255,255,.3)');
      px(cx + 56, cy - 6, 70, 9, '#1c1c20'); px(cx + 96, cy - 7, 32, 11, '#8a2a2a'); px(cx + 96, cy - 7, 32, 3, '#b84a3a');
      if (job && s && s.g === 'timing') { ctx.fillStyle = doneCol(s.p, '#f3dfa8'); ctx.beginPath(); ctx.ellipse(cx, cy - 5, 28, 11, 0, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  function miniSteamer(ctx, cx, cy) {
    ctx.save(); for (var i = 0; i < 2; i++) { ctx.fillStyle = i ? '#c8a060' : '#b08850'; ctx.beginPath(); ctx.ellipse(cx, cy - i * 22, 58, 26, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = '#d8b878'; ctx.beginPath(); ctx.ellipse(cx, cy - 34, 54, 22, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a5a30'; ctx.stroke(); ctx.restore();
  }
  function lerpCol(a, b, k) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); var r = Math.round((pa >> 16) + ((pb >> 16) - (pa >> 16)) * k), g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * k), bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k); return 'rgb(' + r + ',' + g + ',' + bl + ')'; }
  function doneCol(p, raw) { return p < 0.75 ? lerpCol(raw || '#f3dfa8', '#e3a443', Math.min(1, p / 0.75)) : lerpCol('#e3a443', '#7a3e14', Math.min(1, (p - 0.75) / 0.6)); }

  // ───────────────────────── 绘制：近景
  K.drawCloseup = function (ctx) {
    var st = this.open; if (!st || !st.job) return;
    var job = st.job, step = this.stepOf(st), s = job.s, dish = D.byId[job.dish];
    ctx.save(); ctx.fillStyle = 'rgba(20,14,8,.45)'; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
    // 灶台近景：木框＋深色灶面＋火圈（火光随加热进度变化）
    ctx.save();
    ctx.fillStyle = 'rgba(30,18,8,.5)'; U.rr(ctx, PANEL.x + 4, PANEL.y + 8, PANEL.w, PANEL.h, 18); ctx.fill();
    ctx.fillStyle = '#8a5a34'; U.rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18); ctx.fill();
    ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 4; ctx.stroke();
    var gin = ctx.createRadialGradient(VC.x, VC.y + 20, 60, VC.x, VC.y + 20, 520); gin.addColorStop(0, '#3a302a'); gin.addColorStop(1, '#1e1814');
    ctx.fillStyle = gin; U.rr(ctx, PANEL.x + 14, PANEL.y + 96, PANEL.w - 28, PANEL.h - 110, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,.08)'; ctx.lineWidth = 2; for (var gy = PANEL.y + 120; gy < PANEL.y + PANEL.h - 20; gy += 28) { ctx.beginPath(); ctx.moveTo(PANEL.x + 24, gy); ctx.lineTo(PANEL.x + PANEL.w - 24, gy); ctx.stroke(); }
    var heat = s.g === 'timing' ? 0.55 + Math.min(1, s.p) * 0.45 : 0.45;
    var fl = heat * (0.85 + Math.sin(this.t * 13) * 0.08 + Math.sin(this.t * 5.3) * 0.07);
    if (D.stations[st.type].view !== 'cup' && s.g !== 'hold') { var gf = ctx.createRadialGradient(VC.x, VC.y + 40, VC.r * 0.6, VC.x, VC.y + 40, VC.r * 1.5); gf.addColorStop(0, 'rgba(255,140,40,' + (0.55 * fl) + ')'); gf.addColorStop(0.5, 'rgba(255,90,20,' + (0.25 * fl) + ')'); gf.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = gf; ctx.beginPath(); ctx.ellipse(VC.x, VC.y + 40, VC.r * 1.5, VC.r * 1.0, 0, 0, 7); ctx.fill();
      for (var fi = 0; fi < 18; fi++) { var fa = fi / 18 * TAU, fr = VC.r + 22; ctx.fillStyle = 'rgba(' + (fi % 2 ? '255,190,80' : '120,170,255') + ',' + (0.55 * fl) + ')'; ctx.beginPath(); ctx.ellipse(VC.x + Math.cos(fa) * fr, VC.y + 40 + Math.sin(fa) * fr * 0.62, 6, 10 + Math.sin(this.t * 20 + fi) * 3, 0, 0, 7); ctx.fill(); } }
    ctx.restore();
    // 顶部：菜名小牌 + 工序点
    A.food(ctx, job.dish, PANEL.x + 18, PANEL.y + 12, 62);
    U.text(ctx, dish.name, PANEL.x + 90, PANEL.y + 52, { size: 28, bold: true, color: '#fff8e8', stroke: '#4a2a12' });
    var steps = dish.steps;
    for (var i = 0; i < steps.length; i++) { var x = PANEL.x + 92 + i * 30; ctx.fillStyle = i < job.idx ? '#ffd45a' : i === job.idx ? '#fff8e8' : 'rgba(255,248,232,.3)'; ctx.beginPath(); ctx.arc(x + 8, PANEL.y + 74, i === job.idx ? 8 : 6, 0, 7); ctx.fill(); }
    // 器具大视图
    this.drawVessel(ctx, st, step, s);
    // 手势提示（图形为主，文字≤8字）
    this.drawGestureHint(ctx, st, step, s);
    // 关闭/放一放
    var self = this;
    var cl = U.hit('closeup_close', PANEL.x + PANEL.w - 74, PANEL.y + 12, 60, 60, { label: '放一放', onTap: function () { self.close(); } });
    ctx.save(); ctx.fillStyle = cl.pressed ? '#6e4224' : 'rgba(60,30,10,.55)'; U.rr(ctx, PANEL.x + PANEL.w - 74, PANEL.y + 12, 60, 60, 12); ctx.fill(); ctx.restore();
    U.text(ctx, step.bg && s.g === 'timing' ? '⇣' : '×', PANEL.x + PANEL.w - 44, PANEL.y + 54, { size: 34, align: 'center', color: '#fff8e8', bold: true });
    if (!st.job.mat) this.drawMaterialChoice(ctx, st);
    if (step.bg && s.g === 'timing') U.text(ctx, '可以先去忙', PANEL.x + PANEL.w - 90, PANEL.y + 98, { size: 18, align: 'right', color: '#fff3d6', stroke: '#4a2a12', strokeW: 3 });
    this.drawParts(ctx, true);
    this.drawPerfect(ctx);
    this.drawFloats(ctx);
  };
  K.drawPerfect = function (ctx) {
    var f = this.perfectFx; if (!f) return;
    var k = f.t / 0.7;
    ctx.save();
    if (f.t < 0.12 && !this.reduceMotion) { ctx.globalAlpha = 0.55 * (1 - f.t / 0.12); ctx.fillStyle = '#fffbe8'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffd45a'; ctx.lineWidth = 14 * (1 - k) + 2;
    ctx.beginPath(); ctx.arc(f.x, f.y, 60 + k * 260, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 30 + k * 180, 0, 7); ctx.stroke();
    for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2, r1 = 80 + k * 200, r2 = r1 + 40 * (1 - k); ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); ctx.lineTo(f.x + Math.cos(a) * r2, f.y + Math.sin(a) * r2); ctx.stroke(); }
    ctx.restore();
  };
  K.drawFloats = function (ctx) {
    this.floats.forEach(function (f) { var k = f.t / 1.1; U.text(ctx, f.text, f.x, f.y - k * 50, { size: f.size * (1 + Math.max(0, 0.25 - f.t) * 1.2), align: 'center', color: f.col, stroke: '#3b2412', bold: true, alpha: 1 - k * k }); });
  };
  K.drawParts = function (ctx, top) {
    var self = this;
    this.parts.forEach(function (p) {
      var k = p.t / p.life;
      ctx.save(); ctx.globalAlpha = (1 - k) * (p.kind === 'steam' ? 0.35 : 0.9);
      if (p.kind === 'steam' || p.kind === 'smoke') { ctx.fillStyle = p.kind === 'smoke' ? '#4a423e' : '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k), 0, 7); ctx.fill(); }
      else if (p.kind === 'spark') { A.cell(ctx, 'atlas_vfx', 15, p.x - 12, p.y - 12, 24, 24, { trim: true, fit: true }); }
      else if (p.kind === 'coin') { A.cell(ctx, 'atlas_ui', 12, p.x - 14, p.y - 14, 28, 28, { trim: true, fit: true, anchor: 'center' }); }
      else { ctx.fillStyle = p.kind === 'splash' ? '#f4ead2' : p.kind === 'rice' ? '#f7e7b0' : p.kind === 'flour' ? '#fff' : '#d8ecf4'; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      ctx.restore();
    });
  };
  K.drawVessel = function (ctx, st, step, s) {
    var view = D.stations[st.type].view, job = st.job, x = VC.x, y = VC.y, r = VC.r, t = this.t;
    var wob = s.wiggle > 0 ? Math.sin(t * 60) * 6 * s.wiggle : 0; if (s.wiggle > 0) s.wiggle -= 1 / 60;
    ctx.save(); ctx.translate(wob, 0);
    var tp = s.g === 'timing' ? s.p : (job.idx > 0 ? 0.5 : 0);
    if (s.g === 'hold') { drawPourScene(ctx, this, st, step, s); ctx.restore(); return; }
    // Lovart 生熟三阶段图（D059）：油条 / 叶儿粑 / 豆浆 / 葱油饼，有图时整锅换成插画，没图回退程序绘制
    var SG = STAGES[job.dish];
    if (SG && A.img('cook_stages')) {
      var from = SG[0], to = SG[0], mix = 0, burn = 0, w0 = step.win ? step.win[0] : 0.62, w1 = step.win ? step.win[1] : 0.88;
      if (job.idx === 0) { if (s.g === 'circle') { to = SG[1]; mix = Math.min(1, (s.angle || 0) / ((step.turns || 1) * TAU)); } }
      else if (s.g === 'timing') { from = SG[1]; to = SG[2]; mix = Math.max(0, Math.min(1, ((s.p || 0) - w0 + 0.12) / 0.14)); burn = Math.max(0, Math.min(1, ((s.p || 0) - w1) / 0.25)); }
      else { from = to = SG[2]; }
      var bw = r * 2.7, bh = r * 2.05, bx = x - bw / 2, by = y - bh / 2 - 10 + Math.sin(t * 2) * 2;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      if (mix < 1) { ctx.globalAlpha = 1 - mix; A.cell(ctx, 'cook_stages', from, bx, by, bw, bh, { trim: true, fit: true, anchor: 'center' }); }
      if (mix > 0) { ctx.globalAlpha = mix; A.cell(ctx, 'cook_stages', to, bx, by, bw, bh, { trim: true, fit: true, anchor: 'center' }); }
      if (burn > 0) { ctx.globalAlpha = burn * 0.55; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#5a2a0a'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 0.7, 0, 0, 7); ctx.fill(); }
      ctx.restore();
      if (s.g === 'timing') for (var sb2 = 0; sb2 < 8; sb2++) { var ph3 = (t * 1.6 + sb2 * 0.17) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * (1 - ph3)) + ')'; ctx.beginPath(); ctx.arc(x - 90 + (sb2 * 29) % 180, y - 60 - ph3 * 90, 8 + ph3 * 14, 0, 7); ctx.fill(); }
      ctx.restore(); return;
    }
    // 锅体（俯视）
    var rim = view === 'pan' || view === 'wok' ? '#2a2a2e' : view === 'fryer' ? '#2f5c58' : view === 'steamer' ? '#a8804a' : '#b8b8b0';
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + 8, y + 16, r + 16, r * 0.62 + 12, 0, 0, 7); ctx.fill();
    if (view === 'fryer') { ctx.fillStyle = rim; U.rr(ctx, x - r - 30, y - r * 0.7, (r + 30) * 2, r * 1.4, 26); ctx.fill(); ctx.fillStyle = lerpCol('#c8952a', '#5a3410', Math.min(1, this.oilAge / 4)); U.rr(ctx, x - r - 12, y - r * 0.56, (r + 12) * 2, r * 1.12, 18); ctx.fill(); if (this.oilAge >= 3 && !this.reduceMotion) { for (var sm = 0; sm < 4; sm++) { var sp2 = (t * 0.4 + sm * 0.25) % 1; ctx.fillStyle = 'rgba(70,60,55,' + (0.35 * (1 - sp2)) + ')'; ctx.beginPath(); ctx.arc(x - 80 + sm * 50 + Math.sin(t + sm) * 10, y - 60 - sp2 * 120, 18 + sp2 * 26, 0, 7); ctx.fill(); } } }
    else { var mg = ctx.createLinearGradient(x - r, y - r, x + r, y + r); mg.addColorStop(0, view === 'pan' || view === 'wok' ? '#55555c' : '#e2e2da'); mg.addColorStop(0.5, rim); mg.addColorStop(1, view === 'pan' || view === 'wok' ? '#1a1a1e' : '#7a7a72'); ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(x, y, r + 18, (r + 18) * 0.66, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = view === 'pan' || view === 'wok' ? '#3a3a40' : '#4a4a46'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.64, 0, 0, 7); ctx.fill(); if (view !== 'pan' && view !== 'wok') { ctx.fillStyle = '#6a6a62'; ctx.fillRect(x - r - 46, y - 12, 30, 24); ctx.fillRect(x + r + 16, y - 12, 30, 24); } }
    // 内容
    var key = step.key, dish = job.dish;
    var hasRice = job.idx > 0 || (s.g === 'drag' && s.placed > 0);
    if (view === 'pot' || view === 'noodle' || view === 'stew' || view === 'cup') {
      var liquid = view === 'cup' ? '#efe2c4' : view === 'stew' ? '#6a3a18' : dish === 'pumpkin' ? '#f0b04a' : dish === 'chicken' || dish === 'mutton' ? '#f0d79a' : view === 'noodle' ? '#d8e4e0' : hasRice ? lerpCol('#e4ecea', '#f7efd8', Math.min(1, (s.g === 'timing' ? s.p : job.idx >= 2 ? 1 : 0.2))) : '#cfdfe0';
      ctx.fillStyle = liquid; ctx.beginPath(); ctx.ellipse(x, y, r - 10, (r - 10) * 0.62, 0, 0, 7); ctx.fill();
      // 漩涡与米粒随搅拌转动
      var rot = s.angle || 0;
      if (view === 'cup') { ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r - 12, (r - 12) * 0.62, 0, 0, 7); ctx.clip(); for (var bi = 0; bi < 30; bi++) { var ba = bi * 2.39996 + (s.angle || 0) * 1.1, brr = Math.sqrt((bi + 1) / 30) * (r - 26); ctx.fillStyle = '#d9b46a'; ctx.beginPath(); ctx.ellipse(x + Math.cos(ba) * brr, y + Math.sin(ba) * brr * 0.62, 6, 4, ba, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; for (var bk = 0; bk < 3; bk++) { ctx.beginPath(); ctx.ellipse(x, y, (r - 30) * (0.35 + bk * 0.25), (r - 30) * (0.35 + bk * 0.25) * 0.62, (s.angle || 0) * 0.8, bk, bk + 1.8); ctx.stroke(); } ctx.restore(); }
      if (hasRice && view === 'pot') {
        ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r - 12, (r - 12) * 0.62, 0, 0, 7); ctx.clip();
        for (var i = 0; i < 46; i++) { var a = i * 2.39996 + rot * (0.6 + (i % 5) * 0.12), rr2 = Math.sqrt((i + 1) / 46) * (r - 22); ctx.fillStyle = dish === 'pidan' && i % 6 === 0 ? '#5a4030' : dish === 'tangyuan' && i % 4 === 0 ? '#fff' : '#fffaf0'; ctx.fillRect(x + Math.cos(a) * rr2 - 2, y + Math.sin(a) * rr2 * 0.62 - 1.5, i % 3 ? 4 : 6, 3); }
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; for (var k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x, y, (r - 30) * (0.35 + k * 0.25), (r - 30) * (0.35 + k * 0.25) * 0.62, rot * 0.8, k, k + 1.8); ctx.stroke(); }
        ctx.restore();
      }
      if (view === 'noodle' && job.idx > 0 && dish !== 'mutton') { ctx.strokeStyle = dish === 'mixian' ? '#ffffff' : '#f2dc9a'; ctx.lineWidth = 3; for (var n = 0; n < 9; n++) { ctx.beginPath(); ctx.moveTo(x - 80 + n * 18, y - 30 - (s.stretch || 0) * 60); ctx.bezierCurveTo(x - 60 + n * 14, y + 20, x - 20 + n * 10, y - 40, x + 10 + n * 8, y + 30); ctx.stroke(); } }
      if (dish === 'dumpling' && job.idx > 1) for (var dd = 0; dd < 5; dd++) dumplingShape(ctx, x - 70 + dd * 34, y - 10 + (dd % 2) * 26, 1);
      if (view === 'stew' && job.idx > 0) for (var e2 = 0; e2 < 4; e2++) { ctx.fillStyle = lerpCol('#f4ead8', '#8a5a2a', Math.min(1, s.p || 0)); ctx.beginPath(); ctx.ellipse(x - 60 + e2 * 40, y + (e2 % 2) * 20 - 10, 20, 15, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 70 + e2 * 40, y - 12); ctx.lineTo(x - 50 + e2 * 40, y - 2); ctx.stroke(); }
      if (key === 'skim' && !s.committed) { ctx.fillStyle = 'rgba(240,230,210,' + Math.min(0.9, s.p) + ')'; for (var f = 0; f < 7; f++) { ctx.beginPath(); ctx.arc(x - 50 + f * 17, y - 10 + Math.sin(f) * 14, 9 + s.p * 6, 0, 7); ctx.fill(); } }
      // 气泡（越接近越密）
      if (s.g === 'timing' || job.idx > 0) { var nb = Math.floor(4 + (s.p || 0.3) * 18); for (var b = 0; b < nb; b++) { var ph = (t * (1.5 + b % 3) + b * 0.37) % 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - ph)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + Math.cos(b * 2.1) * (r - 40) * 0.8 * ((b % 7) / 7), y + Math.sin(b * 1.3) * (r - 40) * 0.45, 3 + ph * 7, 0, 7); ctx.stroke(); } }
    } else if (view === 'fryer') {
      for (var ob = 0; ob < 14; ob++) { var ph2 = (t * 2 + ob * 0.21) % 1; ctx.fillStyle = 'rgba(255,240,180,' + (0.5 * (1 - ph2)) + ')'; ctx.beginPath(); ctx.arc(x - r + (ob * 23) % (r * 2), y - 40 + (ob * 37) % 90, 2 + ph2 * 4, 0, 7); ctx.fill(); }
      if (job.idx >= 1 || (s.g === 'drag' && s.placed)) {
        var col = s.g === 'timing' ? doneCol(s.p + (key === 'lift' ? 0.55 : 0)) : '#f3dfa8';
        if (dish === 'tangyou') for (var tb = 0; tb < 5; tb++) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - 80 + tb * 40, y + (tb % 2) * 20 - 10, 16, 0, 7); ctx.fill(); }
        else { var flip = key === 'lift' ? -1 : 1; youtiao(ctx, x, y - 6, 1, col, flip, t); }
      }
    } else if (view === 'pan' || view === 'wok') {
      if (job.idx > 0 || (s.g === 'drag' && s.placed)) {
        var pc = s.g === 'timing' ? doneCol(s.p + (key === 'lift' || key === 'lid' ? 0.55 : 0)) : '#f3dfa8';
        var jump = s.pop > 0 ? Math.sin((0.3 - s.pop) / 0.3 * Math.PI) * 60 : 0; if (s.pop > 0) s.pop -= 1 / 60;
        if (dish === 'egg') A.drawEgg(ctx, x, y - jump, 55);
        else if (dish === 'shengjian') for (var sb = 0; sb < Math.max(s.placed || 0, job.idx > 0 ? 3 : 0); sb++) { ctx.fillStyle = '#f6efe0'; ctx.beginPath(); ctx.arc(x - 60 + sb * 60, y, 30, 0, 7); ctx.fill(); ctx.fillStyle = pc; ctx.beginPath(); ctx.ellipse(x - 60 + sb * 60, y + 22, 26, 8, 0, 0, 7); ctx.fill(); }
        else if (view === 'wok') {
          // 蛋炒饭：一堆米饭（带阴影的小米粒）+ 金黄蛋块 + 葱花，颠锅时整体跃起
          ctx.fillStyle = lerpCol('#f4ead0', '#e8c070', Math.min(1, (s.p || 0) * 0.8)); ctx.beginPath(); ctx.ellipse(x, y - jump, 105, 50, 0, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(160,110,40,.25)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 18 - jump, 90, 22, 0, 0, 7); ctx.fill();
          for (var ri = 0; ri < 90; ri++) { var gx2 = x - 92 + (ri * 37) % 184, gy2 = y - 36 + (ri * 53) % 70 - jump * (0.7 + (ri % 3) * 0.15); if (Math.pow((gx2 - x) / 100, 2) + Math.pow((gy2 - y + jump) / 46, 2) > 1) continue; ctx.fillStyle = '#fffaf0'; ctx.fillRect(gx2, gy2, 6, 4); ctx.fillStyle = 'rgba(150,110,60,.5)'; ctx.fillRect(gx2, gy2 + 3, 6, 1); }
          for (var ek = 0; ek < 9; ek++) { ctx.fillStyle = '#f5b423'; ctx.fillRect(x - 70 + (ek * 41) % 140, y - 24 + (ek * 29) % 44 - jump, 12, 9); ctx.fillStyle = '#fbd860'; ctx.fillRect(x - 70 + (ek * 41) % 140, y - 24 + (ek * 29) % 44 - jump, 12, 3); }
          for (var gk = 0; gk < 10; gk++) { ctx.fillStyle = '#4f9a3a'; ctx.fillRect(x - 80 + (gk * 47) % 160, y - 20 + (gk * 31) % 40 - jump, 6, 6); }
        }
        else { ctx.fillStyle = pc; ctx.beginPath(); ctx.ellipse(x, y - jump, 110 * (0.6 + 0.4 * Math.min(1, (job.idx || 0.3))), 62, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,120,40,.8)'; ctx.lineWidth = 3; for (var sp = 0; sp < 6; sp++) { ctx.beginPath(); ctx.arc(x - 50 + sp * 20, y - 10 + (sp % 2) * 18 - jump, 3, 0, 7); ctx.stroke(); } }
        if (key === 'lid') { ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#c0c8cc'; ctx.beginPath(); ctx.ellipse(x, y - 30, r - 10, (r - 10) * 0.55, 0, Math.PI, 0); ctx.fill(); ctx.restore(); }
      }
      if (dish === 'scallion' && step.key === 'roll') { ctx.fillStyle = '#f3e3b8'; var stretchW = 70 + (s.stretch || 0) * 90 + (s.count || 0) * 18; ctx.beginPath(); ctx.ellipse(x, y, stretchW, 50, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 100, y - 70, 200, 16); }
    } else if (view === 'steamer') {
      ctx.fillStyle = '#d8b878'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.64, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; for (var sl = -4; sl <= 4; sl++) { ctx.beginPath(); ctx.moveTo(x + sl * 30, y - r * 0.6); ctx.lineTo(x + sl * 30, y + r * 0.6); ctx.stroke(); }
      for (var lb = 0; lb < Math.max(s.placed || 0, job.idx >= 2 ? 2 : 0); lb++) { ctx.fillStyle = '#3f7d3a'; ctx.beginPath(); ctx.ellipse(x - 50 + lb * 100, y, 46, 30, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = s.g === 'timing' ? lerpCol('#f4efe3', '#e9e0c4', s.p) : '#f4efe3'; ctx.beginPath(); ctx.ellipse(x - 50 + lb * 100, y - 4, 30, 20, 0.3, 0, 7); ctx.fill(); }
    }
    // 面坯拉伸（油条）
    if (key === 'pull') youtiao(ctx, x, y - 120, 0.6 + (s.stretch || 0) * 0.9 + (s.count ? 0.4 : 0), '#f3dfa8', 1, t);
    if (key === 'wrap' || key === 'pleat') { var cnt = s.count || 0; if (key === 'pleat') dumplingShape(ctx, x, y - 130, 1.8, cnt); else { ctx.fillStyle = '#3f7d3a'; ctx.beginPath(); ctx.ellipse(x, y - 120, 70 - cnt * 12, 44, 0.2, 0, 7); ctx.fill(); ctx.fillStyle = '#f4efe3'; ctx.beginPath(); ctx.arc(x, y - 124, 30, 0, 7); ctx.fill(); } }
    // 拖拽物 / 盛碗
    if (s.g === 'drag') this.drawDragItem(ctx, st, step, s);
    else if (job.idx > 0 && step.key !== 'scoop') {}
    // 画圈：勺子
    if (s.g === 'circle') {
      var la = s.stirring ? Math.atan2(s.sy - y, s.sx - x) : -Math.PI / 2 + Math.sin(t * 1.5) * 0.3, lr = r * 0.62;
      var lx = x + Math.cos(la) * lr, ly = y + Math.sin(la) * lr * 0.62;
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 60, ly - 150); ctx.stroke();
      ctx.fillStyle = '#a06a34'; ctx.beginPath(); ctx.ellipse(lx, ly, 22, 14, 0, 0, 7); ctx.fill();
      // 稠度表（形状＋颜色）：搅拌节奏在区间内时为暖色
      var good = s.total ? s.inBand / s.total : 1, prog = Math.min(1, s.angle / (step.turns * TAU));
      U.ring(ctx, x, y, r + 34, prog, good > 0.7 ? '#ffd45a' : good > 0.45 ? '#f2e6c8' : '#e0603a', 8);
      if (this.assist) for (var dk = 0; dk < 3; dk++) { var aa = -Math.PI / 2 + dk * TAU / 3, active = dk === s.dots % 3; ctx.fillStyle = active ? 'rgba(255,226,138,.95)' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x + Math.cos(aa) * r * 0.7, y + Math.sin(aa) * r * 0.7, active ? 30 + Math.sin(t * 6) * 4 : 22, 0, 7); ctx.fill(); }
    }
    // 时机：熟度弧（颜色＋形状），窗口段金色
    if (s.g === 'timing') {
      var w = this.windowFor(job, step), R2 = r + 34;
      ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x, y, R2, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
      var A0 = Math.PI * 0.85, span = Math.PI * 1.3;
      ctx.strokeStyle = '#ffd45a'; ctx.beginPath(); ctx.arc(x, y, R2, A0 + span * w[0] / 1.3, A0 + span * w[1] / 1.3); ctx.stroke();
      var pa = A0 + span * Math.min(1.3, s.p) / 1.3, near = s.p >= w[0] - 0.12 && s.p <= w[1];
      ctx.fillStyle = s.p > w[1] ? '#e0603a' : near ? '#fff' : '#f2e6c8'; ctx.beginPath(); ctx.arc(x + Math.cos(pa) * R2, y + Math.sin(pa) * R2, near ? 14 + Math.sin(t * 14) * 3 : 10, 0, 7); ctx.fill();
      if (near && !this.reduceMotion) { ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 12) * 0.15; ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r + 8, 0, 7); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore();
  };
  function youtiao(ctx, x, y, len, col, flip, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(len, 1); ctx.fillStyle = col;
    for (var k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.ellipse(0, k * 10 * flip, 100, 13, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,60,20,.35)'; ctx.lineWidth = 2 / len; for (var i = -80; i <= 80; i += 20) { ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i + 6, 18); ctx.stroke(); }
    ctx.restore();
  }
  function dumplingShape(ctx, x, y, s, pleats) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#f6f1e4'; ctx.beginPath(); ctx.moveTo(-16, 6); ctx.quadraticCurveTo(0, -18, 16, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d6c8a8'; ctx.lineWidth = 1.5; ctx.stroke();
    for (var i = 0; i < (pleats == null ? 3 : pleats); i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 8, -6); ctx.lineTo(-6 + i * 8, 0); ctx.stroke(); }
    ctx.restore();
  }
  K.drawDragItem = function (ctx, st, step, s) {
    var scoop = step.key === 'scoop', src = itemPos(s, step), tg = targetPos(step), t = this.t;
    // 目标：碗（盛碗）或锅口吸附圈
    if (scoop) { A.cell(ctx, 'atlas_equipment', 6, BOWL.x - 80, BOWL.y - 90, 160, 140, { trim: true, fit: true }); }
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = s.near ? '#ffe28a' : 'rgba(255,248,232,.55)'; ctx.lineWidth = s.near ? 6 : 3;
    ctx.beginPath(); if (scoop) ctx.arc(tg.x, tg.y - 20, 90, 0, 7); else ctx.ellipse(tg.x, tg.y, VC.r * 0.8, VC.r * 0.5, 0, 0, 7); ctx.stroke(); ctx.restore();
    var left = s.need - s.placed;
    if (left <= 0) return;
    var px = s.dragging ? s.dx : src.x, py = s.dragging ? s.dy : src.y;
    if (s.bounce) { var k = Math.min(1, s.bounce.t / 0.25); px = s.bounce.x + (src.x - s.bounce.x) * k; py = s.bounce.y + (src.y - s.bounce.y) * k - Math.sin(k * Math.PI) * 40; s.bounce.t += 1 / 60; if (k >= 1) s.bounce = null; }
    var lift = s.dragging ? 1.15 : 1 + Math.sin(t * 3) * 0.03;
    // 阴影
    ctx.save(); ctx.globalAlpha = s.dragging ? 0.35 : 0.2; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(px + (s.dragging ? 16 : 4), py + 44, 46 * lift, 12, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(px, py - (s.dragging ? 18 : 0)); ctx.scale(lift, lift);
    drawIngredient(ctx, step.item, st.job.dish, t);
    ctx.restore();
    if (!s.dragging && left > 1) U.text(ctx, '×' + left, src.x + 50, src.y + 40, { size: 24, bold: true, color: '#fff8e8', stroke: '#4a2a12' });
  };
  function drawIngredient(ctx, item, dish, t) {
    switch (item) {
      case 'rice': ctx.fillStyle = '#e9f0ea'; ctx.beginPath(); ctx.ellipse(0, 10, 54, 30, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#3d7d72'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#fffaf0'; for (var i = 0; i < 26; i++) ctx.fillRect(-36 + (i * 17) % 72, -2 + (i * 7) % 18, 5, 3); break;
      case 'ladle': ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(80, -90); ctx.stroke(); ctx.fillStyle = '#c0c4c0'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 26, 0, 0, 7); ctx.fill(); ctx.fillStyle = dish === 'pumpkin' ? '#f0b04a' : '#f7efd8'; ctx.beginPath(); ctx.ellipse(0, -2, 32, 18, 0, 0, 7); ctx.fill(); break;
      case 'dough': youtiao(ctx, 0, 0, 0.55, '#f3dfa8', 1, t); break;
      case 'cake': ctx.fillStyle = '#f3e3b8'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 40, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a9a3a'; ctx.lineWidth = 3; for (var c = 0; c < 6; c++) { ctx.beginPath(); ctx.arc(-40 + c * 16, -6 + (c % 2) * 12, 3, 0, 7); ctx.stroke(); } break;
      case 'egg': ctx.fillStyle = dish === 'teaegg' ? '#e8d8bc' : '#f4ead8'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 38, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8b08a'; ctx.lineWidth = 2; ctx.stroke(); break;
      case 'noodle': case 'mixian': ctx.strokeStyle = item === 'mixian' ? '#ffffff' : '#f2dc9a'; ctx.lineWidth = 4; for (var n = 0; n < 8; n++) { ctx.beginPath(); ctx.moveTo(-50, -20 + n * 5); ctx.bezierCurveTo(-10, -40 + n * 8, 10, 20 + n * 2, 50, -10 + n * 5); ctx.stroke(); } ctx.fillStyle = '#c84a3a'; ctx.fillRect(-6, -30, 12, 50); break;
      case 'bun': case 'leafbun': ctx.fillStyle = item === 'leafbun' ? '#3f7d3a' : '#f6efe0'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill(); ctx.strokeStyle = '#d6c8a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -6, 10, 0, 7); ctx.stroke(); if (item === 'leafbun') { ctx.fillStyle = '#f4efe3'; ctx.beginPath(); ctx.arc(0, -2, 20, 0, 7); ctx.fill(); } break;
      case 'ball': for (var b = 0; b < 3; b++) { ctx.fillStyle = dish === 'tangyou' ? '#f3dfa8' : '#fffdf6'; ctx.beginPath(); ctx.arc(-22 + b * 22, (b % 2) * 10, 16, 0, 7); ctx.fill(); ctx.strokeStyle = '#d6c8a8'; ctx.lineWidth = 1.5; ctx.stroke(); } break;
      case 'pumpkin': ctx.fillStyle = '#e8902a'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 38, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#b8601a'; ctx.lineWidth = 3; for (var p = -1; p <= 1; p++) { ctx.beginPath(); ctx.ellipse(p * 16, 0, 12, 36, 0, 0, 7); ctx.stroke(); } ctx.fillStyle = '#4a6a2a'; ctx.fillRect(-4, -46, 8, 12); break;
      case 'dumpling': dumplingShape(ctx, -20, 0, 2); dumplingShape(ctx, 24, 6, 2); break;
      case 'youtiao': youtiao(ctx, 0, 0, 0.5, '#e3a443', 1, t); break;
      default: ctx.fillStyle = '#ff00ff'; ctx.fillRect(-30, -30, 60, 60);
    }
  }
  function drawPourScene(ctx, self, st, step, s) {
    // 侧视：杯/碗 + 目标纹样带 + 壶/勺倾倒
    var cup = st.type === 'soy', bx = BOWL.x - 160, by = 640, bw = cup ? 150 : 230, bh = cup ? 200 : 130;
    var b = step.band || [0.75, 0.9], bonus = self.stars(st.job.dish) * 0.02 + (self.assist ? 0.04 : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(bx, by + 6, bw * 0.6, 14, 0, 0, 7); ctx.fill();
    ctx.beginPath();
    if (cup) { ctx.moveTo(bx - bw / 2, by - bh); ctx.lineTo(bx - bw * 0.4, by); ctx.lineTo(bx + bw * 0.4, by); ctx.lineTo(bx + bw / 2, by - bh); }
    else { ctx.moveTo(bx - bw / 2, by - bh); ctx.quadraticCurveTo(bx - bw / 2, by, bx, by); ctx.quadraticCurveTo(bx + bw / 2, by, bx + bw / 2, by - bh); }
    ctx.closePath(); ctx.fillStyle = '#eef3ef'; ctx.fill(); ctx.save(); ctx.clip();
    var lvl = Math.min(1.05, s.level), ly = by - bh * lvl;
    ctx.fillStyle = cup ? '#f5ecd6' : st.job.dish === 'mutton' ? '#f0e2c0' : '#e8c47a'; ctx.fillRect(bx - bw, ly, bw * 2, bh * 2);
    if (s.holding) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(bx - bw, ly, bw * 2, 4); }
    // 目标纹样带（形状＋颜色）
    var y0 = by - bh * (b[1] + bonus), y1 = by - bh * (b[0] - bonus);
    ctx.fillStyle = 'rgba(232,181,74,.28)'; ctx.fillRect(bx - bw, y0, bw * 2, y1 - y0);
    ctx.strokeStyle = '#3d7d72'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(bx - bw, y0); ctx.lineTo(bx + bw, y0); ctx.moveTo(bx - bw, y1); ctx.lineTo(bx + bw, y1); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#3d7d72'; ctx.lineWidth = 5; ctx.stroke();
    if (s.level > 1) { ctx.fillStyle = '#f5ecd6'; ctx.beginPath(); ctx.ellipse(bx + bw * 0.45, by - 10, 30, 8, 0, 0, 7); ctx.fill(); }
    // 壶 / 勺
    var tilt = s.holding ? 0.7 : 0.15, kx = bx - 60, ky = by - bh - 150;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(tilt);
    if (cup) A.cell(ctx, 'atlas_equipment', 3, -90, -110, 180, 200, { trim: true, fit: true, anchor: 'center' });
    else { ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-140, -60); ctx.stroke(); ctx.fillStyle = '#c0c4c0'; ctx.beginPath(); ctx.arc(30, 0, 50, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    if (s.holding) { ctx.strokeStyle = cup ? '#f5ecd6' : '#e8c47a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(kx + 70, ky + 30); ctx.quadraticCurveTo(bx - 10, ky + 80, bx, ly); ctx.stroke(); }
    ctx.restore();
    // 组合菜：豆浆泡油条
    if (st.job.dish === 'soyyt' && st.job.idx === 1) {}
    // 按住区域（整片面板都可按，壶身给出呼吸提示）
    if (!s.holding) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(self.t * 4) * 0.2; ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(kx, ky, 90, 0, 7); ctx.stroke(); ctx.restore(); }
  }
  K.drawGestureHint = function (ctx, st, step, s) {
    var verb = VERB[s.g], label = LABEL[step.key] || step.key;
    var txt = s.g === 'drag' ? label : s.g === 'swipe' ? label + ' ' + (s.count || 0) + '/' + s.need : s.g === 'circle' ? label : s.g === 'hold' ? '按住' + label : label;
    U.text(ctx, txt, PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 22, { size: 26, align: 'center', bold: true, color: '#fff8e8', stroke: '#4a2a12' });
    // 幽灵手：停顿 3 秒才出现（GDD §6.8）
    var idle = this.idle || 0;
    if (idle < 3) return;
    var t = this.t, hx, hy;
    if (s.g === 'circle') { var a = t * 3; hx = VC.x + Math.cos(a) * VC.r * 0.6; hy = VC.y + Math.sin(a) * VC.r * 0.4; }
    else if (s.g === 'drag') { var k = (t % 1.6) / 1.6, src = itemPos(s, step), tg = targetPos(step); hx = src.x + (tg.x - src.x) * k; hy = src.y + (tg.y - src.y) * k; }
    else if (s.g === 'swipe') { var k2 = (t % 1.2) / 1.2; if (step.dir === 'h') { hx = VC.x - 110 + 220 * k2; hy = VC.y - 60; } else { hx = VC.x; hy = VC.y + 60 - 160 * k2; } }
    else if (s.g === 'hold') { hx = BOWL.x - 220; hy = 400 + Math.sin(t * 3) * 6; }
    else { hx = VC.x + 20; hy = VC.y + 10 + Math.abs(Math.sin(t * 4)) * 14; }
    hand(ctx, hx, hy);
    if (idle > 6) U.text(ctx, verb + (s.g === 'timing' ? '（金色段）' : ''), PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 62, { size: 22, align: 'center', color: '#ffe28a', stroke: '#4a2a12' });
  };
  function hand(ctx, x, y) {
    ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x + 12, y + 30); ctx.lineTo(x + 34, y + 34); ctx.lineTo(x + 38, y + 62); ctx.lineTo(x + 6, y + 64); ctx.lineTo(x - 6, y + 34); ctx.lineTo(x - 2, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  K.hand = hand;
  // 测试/自动操作用：当前近景的关键坐标
  K.geometry = function () { return { panel: PANEL, vessel: VC, source: SRC, bowl: BOWL, tray: this.trayRect }; };
  K.describe = function () {
    var self = this;
    return {
      stations: this.stations.map(function (st) {
        var j = st.job, step = j && self.stepOf(st);
        return { id: st.id, x: Math.round(st.cx), y: st.y + 60, dishes: st.dishes, job: j ? { dish: j.dish, step: j.idx + 1, of: D.byId[j.dish].steps.length, gesture: step.g, key: step.key, bg: !!step.bg, progress: j.s.g === 'timing' ? Math.round(j.s.p * 100) / 100 : j.s.g === 'hold' ? Math.round(j.s.level * 100) / 100 : j.s.g === 'circle' ? Math.round(j.s.angle / (step.turns * TAU) * 100) / 100 : j.s.g === 'swipe' ? j.s.count / j.s.need : j.s.placed / j.s.need, window: step.g === 'timing' ? self.windowFor(j, step).map(function (v) { return Math.round(v * 100) / 100; }) : step.band || null } : null };
      }),
      closeup: this.open ? this.open.id : null,
      picker: this.picker ? this.picker.id : null,
      tray: this.tray.map(function (t) { return { dish: t.dish, grade: t.grade, q: t.q, ready: t.fly >= 1 }; })
    };
  };
  return { Kitchen: Kitchen, PANEL: PANEL, VC: VC, LABEL: LABEL };
});
