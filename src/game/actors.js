// 人物：老周（4×4 动作图集）、常客（全身立绘）、路人与配角（程序化 Q 版像素小人，见 H16）。
// 动作：待机呼吸、走入走出、点头、开心、担心、擦汗、端碗、搅拌——缺帧处用位移/缓动/挤压补足。
BSX.define('game/actors', function (require) {
  var A = require('game/assets');
  var R = require('content/regulars');
  var ZF = { idle: 0, idle2: 1, wipe: 2, greet: 3, walk: 4, walk2: 5, carry: 6, hand: 7, scoop: 8, stir: 9, cut: 10, add: 11, happy: 12, worried: 13, tired: 14, nod: 15 };
  var NPC = {
    landlord: { hairStyle: 3, name: '房东', body: '#7a7f86', pants: '#3f4146', hair: '#bfbfbf', skin: '#e8c39e', acc: 'glasses' },
    supplier: { name: '供应商', body: '#3f6a8a', pants: '#2d3440', hair: '#2a1e18', skin: '#d9ad84', acc: 'cap' },
    inspector: { name: '检查员', body: '#2f4f7a', pants: '#26303d', hair: '#1f1712', skin: '#e3bb92', acc: 'clipboard' },
    influencer: { hairStyle: 1, name: '探店博主', body: '#e07a5f', pants: '#3b3b58', hair: '#4a2a1a', skin: '#f0caa4', acc: 'phone' },
    peer: { name: '快好老板', body: '#a8423a', pants: '#3a2f2a', hair: '#1a1410', skin: '#d9ad84', acc: 'apron' },
    recycler: { name: '回收商', body: '#5c6b3c', pants: '#3e3a2c', hair: '#2a2018', skin: '#c99a70', acc: 'cap' },
    helper: { hairStyle: 2, name: '帮工', body: '#8a6aa0', pants: '#3e3348', hair: '#2a1a14', skin: '#e3bb92', acc: 'scarf' },
    camera: { name: '摄像', body: '#4a4a4a', pants: '#2a2a2a', hair: '#1a1a1a', skin: '#e3bb92', acc: 'camera' },
    students: { hairStyle: 0, name: '学生们', body: '#3c6fb0', pants: '#2b3a55', hair: '#1a1410', skin: '#f0caa4', acc: 'flag', small: true },
    jin: { name: '老金', body: '#4a5a3a', pants: '#2e2a24', hair: '#2a1e18', skin: '#d9ad84', acc: null },
    father: { name: '周师傅', body: '#3a4a6a', pants: '#2e3440', hair: '#cfc8bc', skin: '#e3bb92', acc: 'apron', hairStyle: 3 },
    neighbor: { hairStyle: 2, name: '街坊', body: '#6e8a6a', pants: '#3a3a3a', hair: '#3a2a20', skin: '#e3bb92', acc: null }
  };
  var QV = { jin: 'q_c03', father: 'q_c02', peer: 'q_c04' };
  var cache = {};
  // 配角/路人：40×72 Q 版像素小人（大头、描边、明暗、发型与配饰），比例对齐常客立绘。
  var CW = 40, CH = 72;
  function npcCanvas(id, seed) {
    var key = id + (seed || '');
    if (cache[key]) return cache[key];
    var n = NPC[id] || NPC.neighbor;
    var c = A.P.createCanvas(CW, CH), g = c.getContext('2d');
    var body = n.body, hair = n.hair, style = n.hairStyle || 0, pants = n.pants;
    if (seed != null) {
      var pal = ['#6e8a6a', '#8c5b4a', '#5b6e8c', '#a07a3a', '#6a5a7a', '#7a3a3a', '#3f7a7a', '#9a8a6a'];
      body = pal[seed % pal.length]; hair = ['#2a1e18', '#5a3a20', '#bdb6aa', '#1a1410'][(seed >> 3) % 4]; style = (seed >> 5) % 4;
      pants = ['#3a3a44', '#4a3c30', '#2e3a4e'][(seed >> 2) % 3];
    }
    var skin = n.skin, skinD = shade(skin, -28), bodyD = shade(body, -34), bodyL = shade(body, 26), hairL = shade(hair, 30);
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    // 腿与鞋
    px(13, 50, 6, 16, pants); px(21, 50, 6, 16, pants); px(17, 50, 2, 16, shade(pants, -22)); px(25, 50, 2, 16, shade(pants, -22));
    px(12, 65, 8, 4, '#2a1e16'); px(20, 65, 8, 4, '#2a1e16'); px(12, 65, 8, 1, '#4a3a2c'); px(20, 65, 8, 1, '#4a3a2c');
    // 手臂
    px(7, 31, 5, 15, body); px(28, 31, 5, 15, bodyD); px(7, 31, 2, 15, bodyL);
    px(7, 45, 5, 4, skin); px(28, 45, 5, 4, skinD);
    // 身体
    px(11, 28, 18, 23, body); px(24, 28, 5, 23, bodyD); px(11, 28, 3, 23, bodyL);
    px(15, 28, 10, 3, shade(body, 45)); px(18, 31, 4, 1, shade(body, 45));
    px(11, 48, 18, 3, shade(pants, -10));
    // 脖子与头
    px(17, 25, 6, 4, skinD);
    px(10, 6, 20, 20, skin); px(11, 5, 18, 1, skin); px(11, 26, 18, 1, skinD); px(26, 8, 4, 18, skinD);
    px(8, 14, 2, 5, skin); px(30, 14, 2, 5, skinD);
    // 眼睛、腮红、嘴
    px(14, 15, 3, 4, '#2a1a10'); px(23, 15, 3, 4, '#2a1a10'); px(14, 15, 1, 1, '#fff'); px(23, 15, 1, 1, '#fff');
    px(13, 13, 4, 1, shade(hair, -10)); px(23, 13, 4, 1, shade(hair, -10));
    px(12, 20, 3, 2, 'rgba(230,110,90,.45)'); px(25, 20, 3, 2, 'rgba(230,110,90,.45)');
    px(18, 22, 4, 1, '#9a5040');
    // 发型：0 短发 1 中分 2 盘发 3 花白寸头
    if (style === 3) { hair = '#cfc8bc'; hairL = '#e8e2d8'; }
    px(9, 3, 22, 7, hair); px(11, 2, 18, 1, hair); px(12, 3, 10, 2, hairL);
    px(8, 6, 3, 10, hair); px(29, 6, 3, 10, hair);
    if (style === 0) { px(10, 9, 6, 3, hair); px(20, 9, 5, 2, hair); }
    if (style === 1) { px(10, 9, 9, 3, hair); px(21, 9, 9, 3, hair); px(19, 4, 2, 6, shade(hair, -20)); px(8, 16, 3, 9, hair); px(29, 16, 3, 9, hair); }
    if (style === 2) { px(15, 0, 10, 4, hair); px(16, 0, 6, 2, hairL); px(10, 9, 20, 2, hair); }
    if (style === 3) { px(10, 9, 20, 1, hair); }
    // 配饰
    if (n.acc === 'glasses') { g.strokeStyle = '#333'; g.lineWidth = 1; g.strokeRect(13.5, 14.5, 5, 4); g.strokeRect(21.5, 14.5, 5, 4); px(18, 16, 4, 1, '#333'); px(14, 15, 1, 1, 'rgba(255,255,255,.8)'); }
    if (n.acc === 'cap') { var cc = shade(body, -30); px(8, 2, 24, 7, cc); px(9, 1, 22, 2, cc); px(10, 2, 8, 2, shade(cc, 30)); px(22, 8, 11, 3, shade(cc, -15)); }
    if (n.acc === 'clipboard') { px(29, 34, 9, 12, '#d8c8a0'); px(31, 33, 5, 2, '#888'); px(30, 37, 7, 1, '#555'); px(30, 40, 7, 1, '#555'); px(30, 43, 5, 1, '#555'); px(14, 34, 4, 3, '#e8c060'); }
    if (n.acc === 'phone') { px(30, 30, 6, 10, '#222'); px(31, 31, 4, 7, '#7fd0ff'); px(28, 40, 5, 4, skin); }
    if (n.acc === 'apron') { px(13, 32, 14, 18, '#f2ead8'); px(13, 32, 14, 1, '#d8ccb4'); px(17, 39, 6, 4, '#e2d6bc'); }
    if (n.acc === 'scarf') { px(10, 26, 20, 4, '#c84a4a'); px(22, 30, 4, 7, '#c84a4a'); px(10, 26, 20, 1, '#e06a6a'); }
    if (n.acc === 'camera') { px(26, 29, 12, 9, '#222'); px(34, 31, 4, 4, '#555'); px(35, 32, 2, 2, '#9ad'); px(27, 30, 3, 2, '#e04a3a'); }
    if (n.acc === 'flag') { px(34, 4, 1, 42, '#666'); px(35, 4, 5, 5, '#e04a3a'); px(15, 30, 10, 2, '#e04a3a'); }
    // 1 像素深色描边（与常客立绘一致）
    try {
      var im = g.getImageData(0, 0, CW, CH), d = im.data, out = g.createImageData(CW, CH), o2 = out.data;
      for (var y = 0; y < CH; y++) for (var x = 0; x < CW; x++) {
        var i = (y * CW + x) * 4; if (d[i + 3] > 40) continue;
        var near = (x > 0 && d[i - 1] > 40) || (x < CW - 1 && d[i + 7] > 40) || (y > 0 && d[i - CW * 4 + 3] > 40) || (y < CH - 1 && d[i + CW * 4 + 3] > 40);
        if (near) { o2[i] = 46; o2[i + 1] = 30; o2[i + 2] = 20; o2[i + 3] = 255; }
      }
      var oc = A.P.createCanvas(CW, CH), og = oc.getContext('2d'); og.putImageData(out, 0, 0); g.drawImage(oc, 0, 0);
    } catch (e) {}
    cache[key] = c; return c;
  }
  function shade(hex, d) { if (hex[0] !== '#') return hex; var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function drawNpc(ctx, id, cx, foot, h, o) {
    o = o || {};
    var c = npcCanvas(id, o.seed);
    var s = h / CH, w = CW * s;
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
    // 剧情新角色：老金 / 周师傅 / 快好老板 用 Lovart Q 版全身
    var q = QV[who];
    if (q && A.img(q)) { ctx.save(); ctx.imageSmoothingEnabled = false; A.sprite(ctx, q, cx, foot + (o.walk ? -Math.abs(Math.sin((o.t || 0) * 9)) * 4 : 0), h * 0.92, { alpha: o.alpha, flip: o.flip, squash: o.squash != null ? o.squash : -breathe }); ctx.restore(); return; }
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
