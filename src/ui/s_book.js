// 小本子：街坊（认识了谁、记住了什么）、菜谱（做过多少、摸出的窍门）、留下的（墙上和架子上的东西）、回看（说过的话）。
// 记录的是玩家和这间店一起留下的生活痕迹，不是成就列表。
BSX.define('ui/s_book', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var K = require('ui/kit');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Run = require('core/run');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var INK = '#3b2a1a', MUTE = '#8d7a60', TABS = ['街坊', '菜谱', '留下的', '回看'];

  function Book(app, p) {
    this.app = app; this.name = 'book'; this.t = 0; this.tab = p.tab || 0; this.legacy = !!p.legacy || !app.state; this.s = this.legacy ? null : app.state;
    this.sel = 0; this.dish = 0; this.page = -1;
    if (this.s) { var met = Cast.regIds.filter(function (id) { return app.state.reg[id].met; }); if (met.length) this.sel = Cast.regIds.indexOf(met[met.length - 1]); }
  }
  var P = Book.prototype;
  P.update = function (dt) { this.t += dt; };
  P.key = function (k) { if (k === 'ArrowRight') this.tab = (this.tab + 1) % 4; if (k === 'ArrowLeft') this.tab = (this.tab + 3) % 4; };
  P.draw = function (ctx) {
    var app = this.app, self = this, k = Fx.ease.out3(Math.min(1, this.t * 5));
    K.dim(ctx, 0.6 * k); U.hit('book_bg', 0, 0, 1280, 720, { label: '遮罩', minSize: 0 });
    var x = 110, y = 60 + (1 - k) * 30, w = 1060, h = 610;
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(20,12,6,.45)'; U.rr(ctx, x - 4, y + 10, w + 16, h + 4, 10); ctx.fill();
    ctx.fillStyle = '#8a5a2c'; U.rr(ctx, x - 10, y - 8, w + 20, h + 16, 12); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w, h, 6); ctx.fill();
    TABS.forEach(function (name, i) { K.tag(ctx, 'tab' + i, x + 24 + i * 138, y - 34, 128, 46, name, { kind: self.tab === i ? 'paper' : 'wood', size: 20, onTap: function () { self.tab = i; self.page = -1; Au.play('page'); } }); });
    K.iconBtn(ctx, 'book_close', x + w - 60, y - 34, 46, 'close', function () { app.closeOverlay(); }, { label: '合上' });
    ctx.fillStyle = '#fbf5e4'; ctx.fillRect(x + 4, y + 2, w - 8, 14);
    [this.drawPeople, this.drawDishes, this.drawKept, this.drawLog][this.tab].call(this, ctx, x + 30, y + 30, w - 60, h - 56);
    ctx.restore();
  };
  // ── 街坊
  P.drawPeople = function (ctx, x, y, w, h) {
    var s = this.s, L = this.app.legacy, self = this;
    Cast.regIds.forEach(function (id, i) {
      var met = s ? s.reg[id].met : Object.keys(L.facts || {}).some(function (kf) { return kf.indexOf(id + '/') === 0; }) || L.runs > 0;
      var cx = x + (i % 2) * 112, cy = y + Math.floor(i / 2) * 132, sel = self.sel === i;
      var st = U.hit('reg' + i, cx, cy, 100, 120, { label: Story.regs[id].name, onTap: function () { self.sel = i; Au.play('page'); } });
      ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : '#f2e8d0'; U.rr(ctx, cx, cy, 100, 120, 8); ctx.fill(); ctx.strokeStyle = sel ? '#8a6a1a' : '#c8b48a'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
      if (met) { People.portrait(ctx, id, cx + 10, cy + 8, 80); U.text(ctx, Story.regs[id].name, cx + 50, cy + 110, { size: 16, bold: true, align: 'center', color: INK }); }
      else { U.text(ctx, '？', cx + 50, cy + 66, { size: 44, bold: true, align: 'center', color: '#c8b48a' }); U.text(ctx, '还没来过', cx + 50, cy + 110, { size: 14, align: 'center', color: MUTE }); }
    });
    var id = Cast.regIds[this.sel], r = Story.regs[id], rs = s ? s.reg[id] : null, px = x + 250, pw = w - 250;
    ctx.strokeStyle = 'rgba(120,90,50,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 16, y); ctx.lineTo(px - 16, y + h); ctx.stroke();
    var met = rs ? rs.met : this.app.legacy.runs > 0;
    if (!met) { U.text(ctx, '这一页还空着。', px, y + 60, { size: 24, color: MUTE }); return; }
    U.text(ctx, r.full, px, y + 36, { size: 30, bold: true, color: INK });
    if (rs) U.text(ctx, '第 ' + rs.met + ' 天头一回来 · 来过 ' + rs.visits + ' 趟', px + pw, y + 34, { size: 16, align: 'right', color: MUTE });
    U.text(ctx, r.firstNote, px, y + 70, { size: 19, color: INK, maxW: pw });
    var yy = y + 104;
    if (rs) {
      U.text(ctx, '熟不熟', px, yy + 18, { size: 17, color: MUTE });
      for (var i = 0; i < 10; i++) { ctx.fillStyle = i < Math.floor(rs.aff + 0.001) ? '#e06060' : i < rs.aff ? '#f0b0a8' : 'rgba(120,90,50,.18)'; Fx.heart(ctx, px + 86 + i * 26, yy + 12, 8); }
      yy += 40;
      U.text(ctx, '老样子', px, yy + 22, { size: 17, color: MUTE });
      if (rs.usual) { var items = Run.expand(r.usual); items.forEach(function (it, j) { A.food(ctx, it.d, px + 78 + j * 54, yy - 6, 46, {}); if (it.mod) { ctx.fillStyle = it.mod === '嫩' ? '#f0c860' : it.mod === '老' ? '#b86a2a' : '#7fb0c8'; ctx.beginPath(); ctx.arc(px + 78 + j * 54 + 40, yy + 30, 11, 0, 7); ctx.fill(); U.text(ctx, it.mod, px + 78 + j * 54 + 40, yy + 35, { size: 14, bold: true, align: 'center', color: it.mod === '嫩' ? INK : '#fff8e8' }); } }); }
      else U.text(ctx, rs.visits >= 2 ? '他说"老样子"的时候，你得自己记得。' : '还不知道。', px + 78, yy + 22, { size: 17, color: INK });
      yy += 56;
    }
    U.text(ctx, '记下的事', px, yy + 18, { size: 17, color: MUTE }); yy += 30;
    var keys = Object.keys(r.factText), L2 = this.app.legacy.facts || {}, shown = 0;
    keys.forEach(function (fk) {
      var known = rs ? rs.facts.indexOf(fk) >= 0 : !!L2[id + '/' + fk]; if (!known || yy > y + h - 30) return; shown++;
      var ls = U.wrap(ctx, '· ' + r.factText[fk], pw - 10, 18); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, px, yy + 18 + j * 25, { size: 18, color: INK }); }); yy += ls.length > 1 ? 54 : 30;
    });
    if (!shown) U.text(ctx, '还没什么可写的。多打几回照面再说。', px, yy + 18, { size: 18, color: MUTE });
    var remain = keys.length - shown; if (remain > 0 && shown) U.text(ctx, '（这一页后面还空着 ' + remain + ' 行）', px, Math.min(yy + 22, y + h - 8), { size: 14, color: MUTE });
  };
  // ── 菜谱
  P.drawDishes = function (ctx, x, y, w, h) {
    var s = this.s, self = this, L = this.app.legacy;
    D.list.forEach(function (d, i) {
      var cx = x + (i % 5) * 96, cy = y + Math.floor(i / 5) * 104, known = s ? !!s.unlocked[d.id] : L.runs > 0, sel = self.dish === i;
      var st = U.hit('dish' + i, cx, cy, 88, 96, { label: known ? d.name : '没学会的菜', onTap: function () { self.dish = i; Au.play('page'); } });
      ctx.fillStyle = sel ? '#f6e2a0' : st.hover ? '#f4ecd4' : '#f2e8d0'; U.rr(ctx, cx, cy, 88, 96, 8); ctx.fill(); ctx.strokeStyle = sel ? '#8a6a1a' : '#c8b48a'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
      if (known) { A.food(ctx, d.id, cx + 14, cy + 4, 60, {}); U.text(ctx, d.name, cx + 44, cy + 86, { size: 14, bold: true, align: 'center', color: INK, maxW: 82 }); }
      else U.text(ctx, '？', cx + 44, cy + 62, { size: 38, bold: true, align: 'center', color: '#c8b48a' });
    });
    var d = D.list[this.dish], known = s ? !!s.unlocked[d.id] : L.runs > 0, px = x + 500, pw = w - 500;
    ctx.strokeStyle = 'rgba(120,90,50,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 16, y); ctx.lineTo(px - 16, y + h); ctx.stroke();
    if (!known) { U.text(ctx, '还没学会。', px, y + 50, { size: 26, bold: true, color: MUTE }); U.text(ctx, d.day <= 28 ? '日子到了，或者有人教。' : '', px, y + 86, { size: 18, color: MUTE }); return; }
    A.food(ctx, d.id, px, y, 110, {});
    U.text(ctx, d.name, px + 124, y + 44, { size: 30, bold: true, color: INK });
    U.text(ctx, d.set ? '搭着卖' : D.stations[d.st].name, px + 124, y + 76, { size: 18, color: MUTE });
    var yy = y + 126;
    if (s) { U.text(ctx, '今天卖 ' + K.yuan(Run.price(s, d.id)) + (d.set ? '' : ' · 一份本钱 ' + K.yuan(Run.unitCost(s, d.id))), px, yy, { size: 19, color: INK }); yy += 34; U.text(ctx, '做过 ' + (s.stats.cooked[d.id] || 0) + ' 份 · 卖出 ' + (s.stats.sold[d.id] || 0) + ' 份', px, yy, { size: 19, color: INK }); yy += 40; }
    d.tags.forEach(function (tg, i) { ctx.fillStyle = '#e8dcc0'; U.rr(ctx, px + i * 74, yy - 22, 66, 30, 15); ctx.fill(); U.text(ctx, tg, px + i * 74 + 33, yy - 1, { size: 16, align: 'center', color: INK }); });
    yy += 34;
    if (d.cook) { U.text(ctx, '火候：下锅约 ' + Math.round(d.cook.t * 0.78) + ' 秒到正好' + (d.cook.flips ? '，中途' + (d.cook.verb || '翻面') + ' ' + d.cook.flips + ' 回。' : '。'), px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; if (d.pref) { U.text(ctx, '有人要嫩的（早点出锅），有人要老的（多等一口气）。', px, yy, { size: 17, color: MUTE, maxW: pw }); yy += 30; } }
    else if (d.st === 'pot') { U.text(ctx, '一锅一锅熬。记得搅，糊了底整锅都带苦味。', px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; }
    else if (d.st === 'soy') { U.text(ctx, '按住接，到刻线松手。满过头就溢。', px, yy, { size: 18, color: INK, maxW: pw }); yy += 30; }
    if (d.temp) { U.text(ctx, '有人会说"晾一下再装"——先放出餐台上搁一会儿。', px, yy, { size: 17, color: MUTE, maxW: pw }); yy += 30; }
    if (s && !d.set) {
      var st = D.stations[d.st], lv = Run.skillLv(s, d.st), n = s.stats.st[d.st] || 0, next = C.skill[lv];
      yy += 12; U.text(ctx, st.name + ' · 手熟 ' + ['生手', '顺手', '老手', '闭着眼'][lv], px, yy, { size: 20, bold: true, color: INK }); yy += 14;
      ctx.fillStyle = 'rgba(60,40,20,.15)'; U.rr(ctx, px, yy, 300, 10, 5); ctx.fill(); ctx.fillStyle = '#2f6f66'; U.rr(ctx, px, yy, 300 * (next ? Math.min(1, n / next) : 1), 10, 5); ctx.fill(); yy += 34;
      U.text(ctx, lv >= 2 ? '窍门「' + st.skill[0] + '」：' + st.skill[1] + '。' : '再做 ' + Math.max(0, C.skill[1] - n) + ' 份，会摸出一个窍门。', px, yy, { size: 17, color: lv >= 2 ? INK : MUTE, maxW: pw });
    }
  };
  // ── 留下的
  P.drawKept = function (ctx, x, y, w, h) {
    var s = this.s, L = this.app.legacy, list = s ? s.mementos : Object.keys(L.mementos || {}).map(function (id) { return { id: id }; });
    if (!list.length) { U.text(ctx, '墙上还空着。', x + w / 2, y + 120, { size: 26, align: 'center', color: MUTE }); U.text(ctx, '有人会落下东西，有人会送来东西。', x + w / 2, y + 160, { size: 18, align: 'center', color: MUTE }); return; }
    list.slice(0, 18).forEach(function (m, i) {
      var def = Story.memento(m.id), cx = x + (i % 3) * (w / 3), cy = y + Math.floor(i / 3) * 92;
      ctx.fillStyle = '#f2e8d0'; U.rr(ctx, cx, cy, w / 3 - 12, 82, 8); ctx.fill(); ctx.strokeStyle = '#c8b48a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx + 40, cy + (def.kind === 'photo' || def.kind === 'note' || def.kind === 'paper' || def.kind === 'drawing' ? 42 : 62)); ctx.scale(1.35, 1.35); Shop.drawMemento(ctx, def.kind, 0, 0, i + 3); ctx.restore();
      U.text(ctx, def.name, cx + 82, cy + 30, { size: 19, bold: true, color: INK, maxW: w / 3 - 100 });
      var ls = U.wrap(ctx, def.text || '', w / 3 - 104, 14); ls.slice(0, 2).forEach(function (l, j) { U.text(ctx, l, cx + 82, cy + 52 + j * 19, { size: 14, color: MUTE }); });
      if (m.day) U.text(ctx, '第' + m.day + '天', cx + w / 3 - 22, cy + 22, { size: 12, align: 'right', color: MUTE });
    });
    if (L.signs && L.signs.length && !s) U.text(ctx, '招牌上写过的字：' + L.signs.map(function (g) { return g.sign || '（空着）'; }).join(' · '), x, y + h - 6, { size: 16, color: MUTE, maxW: w });
  };
  // ── 回看
  P.drawLog = function (ctx, x, y, w, h) {
    var s = this.s, self = this;
    if (!s || !s.log.length) { U.text(ctx, s ? '还没说过什么。' : '回看只记这个月的话。', x + w / 2, y + 120, { size: 24, align: 'center', color: MUTE }); return; }
    var rows = [];
    s.log.forEach(function (e) { rows.push({ head: '第 ' + e.day + ' 天 · ' + e.title }); e.lines.forEach(function (l) { rows.push({ who: l[0], text: l[1] }); }); });
    var per = 15, pages = Math.ceil(rows.length / per); if (this.page < 0 || this.page >= pages) this.page = pages - 1;
    rows.slice(this.page * per, this.page * per + per).forEach(function (r, i) {
      var yy = y + 26 + i * 33;
      if (r.head) { ctx.fillStyle = '#e8dcc0'; U.rr(ctx, x, yy - 22, w, 30, 6); ctx.fill(); U.text(ctx, r.head, x + 12, yy, { size: 18, bold: true, color: INK }); return; }
      if (r.who === 'n') U.text(ctx, r.text, x + 20, yy, { size: 18, color: MUTE, maxW: w - 30 });
      else if (r.who === 'choice') U.text(ctx, '▸ 你选了：' + r.text, x + 20, yy, { size: 18, bold: true, color: K.col.red, maxW: w - 30 });
      else { var nm = Story.who(r.who); U.text(ctx, nm, x + 110, yy, { size: 17, bold: true, align: 'right', color: r.who === 'z' ? K.col.teal : '#7d5a35' }); U.text(ctx, r.text, x + 126, yy, { size: 18, color: INK, maxW: w - 140 }); }
    });
    K.tag(ctx, 'log_prev', x + w - 300, y + h - 30, 90, 40, '上一页', { kind: 'paper', size: 16, disabled: this.page <= 0, onTap: function () { self.page--; Au.play('page'); } });
    U.text(ctx, (this.page + 1) + ' / ' + pages, x + w - 150, y + h - 4, { size: 16, align: 'center', color: MUTE });
    K.tag(ctx, 'log_next', x + w - 90, y + h - 30, 90, 40, '下一页', { kind: 'paper', size: 16, disabled: this.page >= pages - 1, onTap: function () { self.page++; Au.play('page'); } });
  };
  P.describe = function () { return { tab: TABS[this.tab], legacy: this.legacy }; };
  return { Book: Book };
});
