// 人物：老周（4×4 动作图集）、常客（全身立绘）、路人与配角（程序化像素小人，占位，见 H16）。
// 动作：待机呼吸、走入走出、点头、开心、担心、擦汗、端碗、搅拌——缺帧处用位移/缓动/挤压补足。
BSX.define('game/actors', function (require) {
  var A = require('game/assets');
  var R = require('content/regulars');
  var ZF = { idle: 0, idle2: 1, wipe: 2, greet: 3, walk: 4, walk2: 5, carry: 6, hand: 7, scoop: 8, stir: 9, cut: 10, add: 11, happy: 12, worried: 13, tired: 14, nod: 15 };
  var NPC = {
    landlord: { name: '房东', body: '#7a7f86', pants: '#3f4146', hair: '#bfbfbf', skin: '#e8c39e', acc: 'glasses' },
    supplier: { name: '供应商', body: '#3f6a8a', pants: '#2d3440', hair: '#2a1e18', skin: '#d9ad84', acc: 'cap' },
    inspector: { name: '检查员', body: '#2f4f7a', pants: '#26303d', hair: '#1f1712', skin: '#e3bb92', acc: 'clipboard' },
    influencer: { name: '探店博主', body: '#e07a5f', pants: '#3b3b58', hair: '#4a2a1a', skin: '#f0caa4', acc: 'phone' },
    peer: { name: '同行老板', body: '#a8423a', pants: '#3a2f2a', hair: '#1a1410', skin: '#d9ad84', acc: 'apron' },
    recycler: { name: '回收商', body: '#5c6b3c', pants: '#3e3a2c', hair: '#2a2018', skin: '#c99a70', acc: 'cap' },
    helper: { name: '帮工', body: '#8a6aa0', pants: '#3e3348', hair: '#2a1a14', skin: '#e3bb92', acc: 'scarf' },
    camera: { name: '摄像', body: '#4a4a4a', pants: '#2a2a2a', hair: '#1a1a1a', skin: '#e3bb92', acc: 'camera' },
    students: { name: '学生们', body: '#3c6fb0', pants: '#2b3a55', hair: '#1a1410', skin: '#f0caa4', acc: 'flag', small: true },
    neighbor: { name: '街坊', body: '#6e8a6a', pants: '#3a3a3a', hair: '#3a2a20', skin: '#e3bb92', acc: null }
  };
  var cache = {};
  function npcCanvas(id, seed) {
    var key = id + (seed || '');
    if (cache[key]) return cache[key];
    var n = NPC[id] || NPC.neighbor;
    var c = A.P.createCanvas(32, 64), g = c.getContext('2d');
    var body = n.body, hair = n.hair;
    if (seed != null) { var pal = ['#6e8a6a', '#8c5b4a', '#5b6e8c', '#a07a3a', '#6a5a7a', '#7a3a3a', '#3f7a7a', '#9a8a6a']; body = pal[seed % pal.length]; hair = ['#2a1e18', '#5a3a20', '#bdb6aa', '#1a1410'][(seed >> 3) % 4]; }
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    var sm = n.small ? 6 : 0;
    // 腿
    px(11, 44 + sm / 2, 4, 17 - sm / 2, n.pants); px(17, 44 + sm / 2, 4, 17 - sm / 2, n.pants);
    px(10, 60, 6, 3, '#2a1e16'); px(16, 60, 6, 3, '#2a1e16');
    // 身体
    px(8, 24 + sm, 16, 21 - sm / 2, body); px(8, 24 + sm, 16, 3, shade(body, 20));
    px(6, 26 + sm, 3, 14, body); px(23, 26 + sm, 3, 14, body); px(6, 40 + sm, 3, 3, n.skin); px(23, 40 + sm, 3, 3, n.skin);
    px(9, 43, 14, 2, shade(body, -40));
    // 头
    px(10, 9 + sm, 12, 14, n.skin); px(10, 7 + sm, 12, 5, hair); px(9, 9 + sm, 2, 6, hair); px(21, 9 + sm, 2, 6, hair);
    px(13, 15 + sm, 2, 2, '#2a1a10'); px(18, 15 + sm, 2, 2, '#2a1a10'); px(14, 19 + sm, 4, 1, '#a0604a');
    px(10, 22 + sm, 12, 2, shade(n.skin, -25));
    if (n.acc === 'glasses') { px(12, 14 + sm, 4, 3, 'rgba(255,255,255,.6)'); px(17, 14 + sm, 4, 3, 'rgba(255,255,255,.6)'); px(16, 15 + sm, 1, 1, '#333'); }
    if (n.acc === 'cap') { px(9, 6 + sm, 14, 4, shade(body, -30)); px(19, 9 + sm, 6, 2, shade(body, -30)); }
    if (n.acc === 'clipboard') { px(22, 30, 7, 9, '#d8c8a0'); px(23, 31, 5, 1, '#555'); px(23, 33, 5, 1, '#555'); }
    if (n.acc === 'phone') { px(23, 30, 4, 7, '#222'); px(24, 31, 2, 4, '#7fd0ff'); }
    if (n.acc === 'apron') { px(10, 30, 12, 14, '#f2ead8'); }
    if (n.acc === 'scarf') { px(9, 6, 14, 5, '#c84a4a'); }
    if (n.acc === 'camera') { px(20, 26, 10, 7, '#222'); px(28, 28, 3, 3, '#555'); }
    if (n.acc === 'flag') { px(25, 10, 1, 30, '#666'); px(26, 10, 6, 4, '#e04a3a'); }
    cache[key] = c; return c;
  }
  function shade(hex, d) { if (hex[0] !== '#') return hex; var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function drawNpc(ctx, id, cx, foot, h, o) {
    o = o || {};
    var c = npcCanvas(id, o.seed);
    var s = h / 64, w = 32 * s;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    var bob = o.bob || 0;
    if (o.flip) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }
    ctx.drawImage(c, cx - w / 2, foot - h + bob, w, h - bob);
    if (id === 'students') { ctx.drawImage(c, cx - w / 2 - w * 0.7, foot - h * 0.9 + bob, w * 0.9, h * 0.9 - bob); ctx.drawImage(c, cx + w * 0.2, foot - h * 0.85, w * 0.85, h * 0.85); }
    ctx.restore();
  }
  function shadow(ctx, cx, foot, w) { ctx.save(); ctx.fillStyle = 'rgba(40,24,10,.25)'; ctx.beginPath(); ctx.ellipse(cx, foot, w, w * 0.22, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // 统一绘制：who 可以是 zhou / 常客 id / npc id
  function draw(ctx, who, cx, foot, h, o) {
    o = o || {};
    var breathe = o.still ? 0 : Math.sin((o.t || 0) * 2.2 + (o.ph || 0)) * 0.012;
    if (!o.noShadow) shadow(ctx, cx, foot, h * 0.18);
    if (who === 'zhou') {
      var f = ZF[o.pose || 'idle']; if (f == null) f = 0;
      if ((o.pose || 'idle') === 'idle' && Math.floor((o.t || 0) * 1.2) % 4 === 3) f = 1;
      if (o.pose === 'walk') f = Math.floor((o.t || 0) * 6) % 2 ? 4 : 5;
      ctx.save(); ctx.translate(cx, foot); ctx.scale(1 - breathe * 0.5, 1 + breathe); ctx.translate(-cx, -foot);
      A.cell(ctx, 'atlas_zhou', f, cx - h * 0.5, foot - h, h, h, { trim: true, fit: true, flip: o.flip });
      ctx.restore(); return;
    }
    var r = R.byId[who];
    if (r) { A.sprite(ctx, r.sprite, cx, foot, h, { alpha: o.alpha, flip: o.flip, squash: o.squash != null ? o.squash : -breathe }); return; }
    drawNpc(ctx, who, cx, foot, h * 0.9, { alpha: o.alpha, flip: o.flip, seed: o.seed, bob: o.walk ? Math.abs(Math.sin((o.t || 0) * 9)) * 3 : 0 });
  }
  function nameOf(who) { if (who === 'zhou') return '老周'; if (R.byId[who]) return R.byId[who].name; return (NPC[who] || { name: '街坊' }).name; }
  function portrait(ctx, who, x, y, s, face) {
    if (who === 'zhou') { A.cell(ctx, 'zhou_portraits', face || 0, x, y, s, s, { trim: true, fit: true, anchor: 'center' }); return; }
    var r = R.byId[who];
    if (r) { A.cell(ctx, 'atlas_regulars', r.portrait, x, y, s, s, { trim: true, fit: true, anchor: 'center' }); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip(); drawNpc(ctx, who, x + s / 2, y + s * 2.1, s * 2.2, {}); ctx.restore();
  }
  return { draw: draw, drawNpc: drawNpc, nameOf: nameOf, portrait: portrait, NPC: NPC, ZF: ZF, shadow: shadow };
});
