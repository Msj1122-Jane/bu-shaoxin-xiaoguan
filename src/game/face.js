// 副本·对质：老金三句话，老周用找回的账页一句句顶回去。第三句没有证据能“驳倒”——只能承认父亲的错。
BSX.define('game/face', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Au = require('game/audio');
  var ROUNDS = [
    { claim: '我给你爸送的，都是正经好油。', ok: [3], hit: '“油，暂用老金的，开学后换回。”好油，用得着“换回”？', miss: '这破纸能说明啥？' },
    { claim: '王家住院，那是老太太自己身子弱。', ok: [5], hit: '“赔王家医药费，一千四。”没出事，谁赔这个钱？', miss: '老黄历了，谁还记得。' },
    { claim: '你爸要是清白，干嘛连夜关店？他心虚。', ok: ['admit', 6], hit: '我爸是贪了便宜。他认了，赔了，关了门。你呢？', miss: '你看，你自己也说不清。' }
  ];
  var PAGE_LINE = { 1: '开张那天的进货', 2: '学费，还差八百', 3: '油，暂用老金的', 4: '王婶，粥钱免', 5: '赔王家医药费', 6: '停业，对不住街坊' };
  function Face(opts) {
    this.o = opts || {}; this.t = 0; this.r = 0; this.tries = 0; this.score = 0; this.admit = false; this.state = 'claim'; this.st = 0; this.msg = null; this.done = false; this.over = false; this.result = null;
    var pages = (this.o.pages || []).filter(function (n) { return n <= 6; });
    this.cards = pages.map(function (n) { return { id: n, label: '账页 ' + n, line: PAGE_LINE[n] }; });
  }
  var P = Face.prototype;
  P.cardsNow = function () { var c = this.cards.slice(); if (this.r === 2) c.push({ id: 'admit', label: '承认', line: '我爸也有错' }); return c; };
  P.update = function (dt) {
    this.t += dt; this.st += dt;
    if (this.over) { this.overT += dt; return; }
    if (this.state === 'react' && this.st > 2.6) this.nextRound();
  };
  P.nextRound = function () {
    if (this.msg && this.msg.ok === false && this.tries < 2 && !this.msg.final) { this.state = 'claim'; this.st = 0; this.msg = null; return; }
    this.r++; this.tries = 0; this.msg = null; this.state = 'claim'; this.st = 0;
    if (this.r >= ROUNDS.length) this.finish();
  };
  P.pick = function (card) {
    if (this.state !== 'claim' || this.st < 0.6 || this.over) return;
    var R = ROUNDS[this.r], ok = R.ok.indexOf(card.id) >= 0;
    this.tries++;
    if (ok) { this.score++; if (card.id === 'admit' || card.id === 6) this.admit = true; Au.play('perfect'); }
    else Au.play('drop');
    this.msg = { ok: ok, text: ok ? R.hit : R.miss, final: ok || this.tries >= 2 };
    this.state = 'react'; this.st = 0;
  };
  P.finish = function () { this.over = true; this.overT = 0; this.result = { id: 'face', score: this.score, admit: this.admit }; Au.play('stamp'); };
  P.pointer = function () { return true; };
  P.draw = function (ctx) {
    var self = this, bg = A.img('scene_face');
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (bg) ctx.drawImage(bg, 0, 0, 1280, 720); else { ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, 1280, 720); }
    ctx.fillStyle = 'rgba(10,6,3,.45)'; ctx.fillRect(0, 0, 1280, 720);
    // 双方立绘
    var jf = this.msg ? (this.msg.ok ? (this.r === 2 ? 'worried' : 'sad') : 'happy') : this.r === 0 ? 'happy' : this.r === 1 ? 'calm' : 'angry';
    var jin = A.img('pt_c03_' + jf) || A.img('pt_c03_calm'), zh = A.img(this.msg && this.msg.ok ? 'pt_c01_angry' : 'pt_c01_worried');
    if (zh) ctx.drawImage(zh, 40, 720 - 470, zh.width * 470 / zh.height, 470);
    if (jin) { var jw = jin.width * 470 / jin.height; ctx.save(); ctx.translate(1240, 0); ctx.scale(-1, 1); ctx.drawImage(jin, 0, 720 - 470 + (this.msg && this.msg.ok ? Math.sin(this.st * 30) * 2 * Math.max(0, 1 - this.st) : 0), jw, 470); ctx.restore(); }
    ctx.restore();
    // 进度
    U.pixelText(ctx, '对质  ' + Math.min(3, this.r + 1) + ' / 3', 40, 44, { size: 26, px: 2, color: '#fff3d6', outline: '#1e120a' });
    for (var i = 0; i < 3; i++) { ctx.fillStyle = i < this.r ? '#f2b440' : i === this.r ? '#fff3d6' : 'rgba(255,255,255,.25)'; ctx.fillRect(220 + i * 34, 32, 24, 14); }
    if (!this.over) {
      var R = ROUNDS[this.r];
      // 老金的话
      U.panel(ctx, 340, 90, 760, 96, 'dark');
      U.pixelText(ctx, '老金：“' + R.claim + '”', 720, 140, { size: 26, px: 2, align: 'center', color: '#ffd9a0', outline: '#1e120a' });
      if (this.msg) {
        U.panel(ctx, 240, 210, 800, 90, this.msg.ok ? 'cream' : 'dark');
        U.pixelText(ctx, (this.msg.ok ? '老周：' : '老金：') + this.msg.text, 640, 256, { size: 22, px: 2, align: 'center', color: this.msg.ok ? '#3b2412' : '#ffb08a', outline: this.msg.ok ? null : '#1e120a' });
        if (!this.msg.ok && !this.msg.final) U.pixelText(ctx, '再想想，还有一次机会。', 640, 320, { size: 20, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a' });
      } else U.pixelText(ctx, '拿哪一页顶回去？', 640, 250, { size: 24, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: Math.min(1, this.st * 2) });
      // 证据卡
      var cards = this.cardsNow(), n = cards.length, cw = 150, gap = 14, x0 = 640 - (n * cw + (n - 1) * gap) / 2;
      cards.forEach(function (c, i) {
        var x = x0 + i * (cw + gap), y = 520, admit = c.id === 'admit';
        var hit = U.hit('face_' + c.id, x, y, cw, 150, { label: c.label, minSize: 0, onTap: function () { self.pick(c); } });
        var lift = U.hover === 'face_' + c.id ? -8 : 0;
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 5, y + 7, cw, 150);
        ctx.fillStyle = admit ? '#a8432f' : '#f2e6c8'; ctx.fillRect(x, y + lift, cw, 150);
        ctx.strokeStyle = admit ? '#ffd9a0' : '#8a6a3a'; ctx.lineWidth = 3; ctx.strokeRect(x, y + lift, cw, 150);
        var pg = !admit && A.img('ledger_page_' + c.id);
        if (pg) { ctx.save(); ctx.globalAlpha = 0.35; ctx.drawImage(pg, x + 8, y + 8 + lift, cw - 16, 134); ctx.restore(); }
        U.pixelText(ctx, c.label, x + cw / 2, y + 34 + lift, { size: 22, px: 2, align: 'center', color: admit ? '#fff3d6' : '#5a3418' });
        U.pixelText(ctx, c.line, x + cw / 2, y + 96 + lift, { size: 16, px: 2, align: 'center', color: admit ? '#ffe8c8' : '#3b2412' });
      });
      if (!cards.length) U.pixelText(ctx, '手里一页账都没有……', 640, 590, { size: 24, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a' });
    } else {
      var r = this.result, k = Math.min(1, this.overT * 2);
      ctx.save(); ctx.globalAlpha = k * 0.85; ctx.fillStyle = '#140c06'; ctx.fillRect(240, 200, 800, 280); ctx.restore();
      var title = r.score === 3 ? '老金没再说话' : r.score >= 2 ? '老金摔门走了' : '老金笑着走了';
      U.pixelText(ctx, title, 640, 268, { size: 44, px: 4, align: 'center', color: '#ffe08a', outline: '#3b2412', alpha: k });
      U.pixelText(ctx, '说中 ' + r.score + ' / 3' + (r.admit ? ' · 认了父亲的错' : ''), 640, 336, { size: 28, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: k });
      U.pixelText(ctx, r.score >= 2 ? '对街的事，街坊们很快都知道了。' : '证据不够，老金的话先传开了。', 640, 388, { size: 22, px: 2, align: 'center', color: '#e8c89a', outline: '#1e120a', alpha: k });
      if (this.overT > 0.6) U.pixelText(ctx, '点一下继续', 640, 446, { size: 22, px: 2, align: 'center', color: '#fff3d6', outline: '#1e120a', alpha: 0.6 + Math.sin(this.overT * 4) * 0.3 });
      U.hit('face_done', 0, 0, 1280, 720, { label: '继续', minSize: 0, onTap: function () { if (self.overT > 0.6) self.done = true; } });
    }
    if (this.state === 'react' && !this.over) U.hit('face_next', 0, 0, 1280, 500, { label: '继续', minSize: 0, onTap: function () { if (self.st > 0.5) self.nextRound(); } });
  };
  P.describe = function () {
    return { face: true, r: this.r, state: this.state, over: this.over, result: this.result, cards: this.cardsNow().map(function (c) { return c.id; }), ok: this.over ? null : ROUNDS[this.r].ok };
  };
  return { Face: Face, ROUNDS: ROUNDS };
});
