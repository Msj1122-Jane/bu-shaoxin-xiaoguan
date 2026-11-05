// 图鉴与店史：8 位常客（座位与故事印章）、20 道菜（熟练度）、事件、结局印章、照片、来信、个人纪录。
BSX.define('ui/s_codex', function (require) {
  var U = require('ui/ui');
  var A = require('game/assets');
  var Act = require('game/actors');
  var D = require('content/dishes');
  var R = require('content/regulars');
  var E = require('content/events');
  var EN = require('content/endings');
  var TABS = [['regulars', '常客'], ['dishes', '菜谱'], ['events', '事件'], ['history', '店史']];
  function Codex(app, p) { this.name = 'codex'; this.app = app; this.from = p.from; this.tab = 'regulars'; this.sel = null; this.pausable = false; }
  var P = Codex.prototype;
  P.draw = function (ctx) {
    var app = this.app, self = this, s = app.state, L = app.legacy;
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(0, 0, 1280, 720);
    U.panel(ctx, 30, 24, 1220, 672, 'paper');
    TABS.forEach(function (t, i) { U.button(ctx, 'tab_' + t[0], 60 + i * 170, 40, 156, 56, t[1], { kind: self.tab === t[0] ? 'primary' : 'paper', size: 24, onTap: function () { self.tab = t[0]; self.sel = null; } }); });
    U.button(ctx, 'codex_back', 1080, 40, 150, 56, '返回', { kind: 'wood', onTap: function () { if (self.from === 'pause' || self.from === 'run') app.route(); else if (self.from === 'ending') app.route(); else app.go(BSX.require('ui/s_basic').Title); } });
    this['draw_' + this.tab](ctx, s, L);
  };
  P.draw_regulars = function (ctx, s, L) {
    var self = this;
    R.list.forEach(function (r, i) {
      var x = 70 + (i % 4) * 290, y = 116 + Math.floor(i / 4) * 290;
      var st = s ? s.regulars[r.id] : null, met = (st && st.visits > 0) || L.nodes.some(function (n) { return n.indexOf('R_' + r.id) === 0; });
      U.hit('reg_' + r.id, x, y, 270, 270, { label: r.name, onTap: function () { self.sel = r.id; } });
      ctx.save(); ctx.fillStyle = self.sel === r.id ? '#f2d9a0' : '#fff8e8'; U.rr(ctx, x, y, 270, 270, 12); ctx.fill(); ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      if (met) { A.cell(ctx, 'atlas_regulars', r.portrait, x + 10, y + 8, 150, 170, { trim: true, fit: true }); }
      else { ctx.save(); ctx.globalAlpha = 0.25; ctx.filter = 'brightness(0)'; A.cell(ctx, 'atlas_regulars', r.portrait, x + 10, y + 8, 150, 170, { trim: true, fit: true }); ctx.restore(); }
      U.text(ctx, met ? r.full : '？？？', x + 16, y + 206, { size: 22, bold: true, maxW: 240 });
      U.text(ctx, met ? r.tag : '还没来过', x + 16, y + 234, { size: 16, color: '#7d5a35', maxW: 240 });
      // 座位：门口→普通桌→近锅位
      var aff = st ? st.aff : 0;
      U.text(ctx, aff >= 5 ? '近锅位' : aff >= 3 ? '普通桌' : '门口位', x + 250, y + 36, { size: 18, align: 'right', color: '#2f6f66', bold: true });
      r.nodes.forEach(function (n, j) {
        var done = (st && st.nodes.indexOf(j) >= 0) || L.nodes.indexOf(n.cs) >= 0;
        ctx.save(); ctx.translate(x + 200, y + 76 + j * 46); ctx.strokeStyle = done ? '#d0503a' : 'rgba(122,90,53,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.stroke();
        U.text(ctx, done ? '印' : n.aff, 0, 7, { size: 18, bold: true, align: 'center', color: done ? '#d0503a' : '#b8a888' }); ctx.restore();
        if (done) U.text(ctx, n.title, x + 226, y + 84 + j * 46, { size: 14, color: '#7d5a35', maxW: 40 });
      });
      if (L.photos.indexOf(r.id) >= 0 || (s && s.photos.indexOf(r.id) >= 0)) { ctx.save(); ctx.translate(x + 40, y + 160); ctx.rotate(-0.1); ctx.fillStyle = '#fff'; ctx.fillRect(-24, -20, 48, 40); ctx.fillStyle = '#c8a878'; ctx.fillRect(-20, -16, 40, 26); ctx.restore(); }
    });
  };
  P.draw_dishes = function (ctx, s, L) {
    D.list.forEach(function (d, i) {
      var x = 70 + (i % 5) * 230, y = 116 + Math.floor(i / 5) * 140;
      var known = (s && (s.unlocked[d.id] || s.prof[d.id].n > 0 || d.unlock.type === 'start')) || L.unlocked.indexOf(d.id) >= 0 || L.cooked[d.id];
      ctx.save(); ctx.fillStyle = '#fff8e8'; U.rr(ctx, x, y, 214, 128, 10); ctx.fill(); ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      A.food(ctx, d.id, x + 6, y + 10, 92, { alpha: known ? 1 : 0.18 });
      U.text(ctx, known ? d.name : '？？？', x + 104, y + 40, { size: 20, bold: true, maxW: 104 });
      var star = s ? s.prof[d.id].star : 0;
      for (var k = 0; k < 5; k++) { ctx.fillStyle = k < star ? '#e8b54a' : 'rgba(122,90,53,.2)'; ctx.beginPath(); ctx.arc(x + 112 + k * 18, y + 66, 6, 0, 7); ctx.fill(); }
      var u = d.unlock, hint = u.type === 'start' ? '起始' : u.type === 'day' ? '第' + u.day + '日' : u.type === 'aff' ? R.byId[u.who].name + '的故事' : u.type === 'material' ? '鲜货以上' : '第' + u.day + '日·可追溯';
      U.text(ctx, hint, x + 104, y + 100, { size: 15, color: '#7d5a35', maxW: 104 });
      U.text(ctx, '做过 ' + ((s ? s.prof[d.id].n : 0) + (L.cooked[d.id] || 0)), x + 104, y + 120, { size: 14, color: '#8d7a60' });
    });
  };
  P.draw_events = function (ctx, s, L) {
    var seen = L.seenEvents.concat(s ? s.events.seen : []);
    E.list.forEach(function (e, i) {
      var x = 70 + (i % 6) * 190, y = 116 + Math.floor(i / 6) * 108, ok = seen.indexOf(e.id) >= 0;
      ctx.save(); ctx.fillStyle = ok ? ({ tense: '#f6d8c8', daily: '#f3ead2', relax: '#dcebdc' })[e.type] : 'rgba(255,248,232,.5)'; U.rr(ctx, x, y, 176, 96, 10); ctx.fill(); ctx.restore();
      U.text(ctx, e.id, x + 12, y + 30, { size: 16, color: '#8d7a60' });
      U.text(ctx, ok ? e.name : '未见', x + 12, y + 66, { size: 20, bold: ok, maxW: 156, color: ok ? '#3b2a1a' : '#b8a888' });
    });
    U.text(ctx, '已见 ' + E.list.filter(function (e) { return seen.indexOf(e.id) >= 0; }).length + ' / 30 · 新的一月会优先出现未见事件', 70, 676, { size: 18, color: '#7d5a35' });
  };
  P.draw_history = function (ctx, s, L) {
    U.text(ctx, '结局印章', 70, 140, { size: 24, bold: true });
    EN.list.forEach(function (e, i) {
      var x = 70 + (i % 4) * 280, y = 160 + Math.floor(i / 4) * 92, got = L.endings[e.id];
      ctx.save(); ctx.fillStyle = got ? '#fff8e8' : 'rgba(255,248,232,.4)'; U.rr(ctx, x, y, 264, 80, 10); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(x + 36, y + 40); ctx.strokeStyle = got ? '#d0503a' : 'rgba(122,90,53,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.stroke(); ctx.restore();
      U.text(ctx, got ? e.name : '？？？', x + 70, y + 36, { size: 18, bold: true, maxW: 184 });
      U.text(ctx, got ? '× ' + got : '', x + 70, y + 64, { size: 16, color: '#7d5a35' });
    });
    var r = L.records;
    U.text(ctx, '个人纪录', 70, 380, { size: 24, bold: true });
    [['经营过的月份', L.runs], ['月底最高现金', r.bestCash == null ? '—' : Math.round(r.bestCash / 100) + ' 元'], ['最高口碑', r.bestRep == null ? '—' : Math.round(r.bestRep)], ['最长连续招牌日', r.bestStreak], ['本月没让常客空等', r.noWaitMonth ? '做到过' : '还没有']].forEach(function (x, i) { U.text(ctx, x[0], 70, 420 + i * 36, { size: 20, color: '#7d5a35' }); U.text(ctx, String(x[1]), 330, 420 + i * 36, { size: 20, bold: true }); });
    U.text(ctx, '来信', 640, 380, { size: 24, bold: true });
    L.letters.slice(-5).reverse().forEach(function (l, i) { U.text(ctx, l.text, 640, 420 + i * 40, { size: 18, maxW: 580 }); });
    if (!L.letters.length) U.text(ctx, '走完第一个月后，会有人写信来。', 640, 420, { size: 18, color: '#8d7a60' });
    U.text(ctx, '照片 ' + L.photos.length + ' 张 · 传承物 ' + L.heirlooms.length + ' 件', 640, 640, { size: 18, color: '#7d5a35' });
  };
  P.describe = function () { return { tab: this.tab, sel: this.sel }; };
  return { Codex: Codex };
});
