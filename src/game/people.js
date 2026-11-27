// 人物绘制：八位常客用全身立绘；配角和散客用程序生成的 Q 版像素小人（与立绘同样的大头比例、深色描边）。
// 动作靠位移、挤压和表情符号补足：呼吸、走入、点头、着急、开心。
BSX.define('game/people', function (require) {
  var A = require('game/assets');
  var Cast = require('content/cast');
  var Fx = require('game/fx');
  var SKIN = ['#f6d3ab', '#eebf92', '#dba97a'];
  var HAIRS = ['#2a1e18', '#3d2a1e', '#5a3a22', '#1a1410', '#6b4a32'];
  var cache = {}, W = 44, H = 60, S = 2;
  function shade(hex, d) { var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function build(spec) {
    var c = A.P.createCanvas(W * S, H * S), g = c.getContext('2d');
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x * S), Math.round(y * S), Math.round(w * S), Math.round(h * S)); }
    var skin = SKIN[spec.skin || 0], skinD = shade(skin, -28), body = spec.body, bodyD = shade(body, -34), bodyL = shade(body, 22), pants = spec.pants, hair = spec.hairCol || '#2a1e18', hairL = shade(hair.charAt(0) === '#' ? hair : '#2a1e18', 26);
    var ox = 2; // 画布左右留边给配件
    // 背后的头发
    if (spec.hair === 'pony') { px(ox + 29, 12, 4, 13, hair); px(ox + 30, 24, 3, 3, hair); }
    if (spec.hair === 'bun') { px(ox + 16, 1.5, 8, 5, hair); px(ox + 17, 1, 6, 1, hairL); }
    if (spec.hair === 'straw') { px(ox + 3, 9, 34, 3, '#d9b266'); }
    // 腿和鞋
    px(ox + 13.5, 45, 5, 9, pants); px(ox + 21.5, 45, 5, 9, pants); px(ox + 13.5, 45, 5, 1.5, shade(pants, -20));
    px(ox + 12.5, 53.5, 6.5, 3, '#2a1e16'); px(ox + 21, 53.5, 6.5, 3, '#2a1e16');
    // 手臂
    px(ox + 8, 29, 3.5, 13, body); px(ox + 28.5, 29, 3.5, 13, body); px(ox + 8, 29, 1, 13, bodyD); px(ox + 31, 29, 1, 13, bodyD);
    px(ox + 8, 41.5, 3.5, 3, skin); px(ox + 28.5, 41.5, 3.5, 3, skin);
    // 身体
    px(ox + 11, 27.5, 18, 18, body); px(ox + 11, 27.5, 18, 2, bodyL); px(ox + 11, 43.5, 18, 2, bodyD); px(ox + 11, 27.5, 1, 18, bodyD); px(ox + 28, 27.5, 1, 18, bodyD);
    // 脖子与头
    px(ox + 17, 25.5, 6, 3, skinD);
    px(ox + 9.5, 7, 21, 19, skin); px(ox + 8.5, 9, 23, 15, skin); px(ox + 10.5, 6, 19, 1.5, skin); px(ox + 10.5, 25.5, 19, 1, skinD);
    px(ox + 7.5, 15, 1.5, 4.5, skin); px(ox + 31, 15, 1.5, 4.5, skin);
    // 头发
    var hs = spec.hair;
    if (hs === 'short' || hs === 'pony' || hs === 'bun' || hs === 'gray') { px(ox + 8.5, 4, 23, 7.5, hair); px(ox + 10, 3, 20, 1.5, hair); px(ox + 8, 9, 2.5, 7, hair); px(ox + 29.5, 9, 2.5, 7, hair); px(ox + 12, 4.5, 9, 1.5, hairL); px(ox + 11, 11, 4, 1.5, hair); px(ox + 22, 11, 5, 1.5, hair); }
    if (hs === 'bob') { px(ox + 8.5, 4, 23, 7.5, hair); px(ox + 10, 3, 20, 1.5, hair); px(ox + 7.5, 9, 3, 15, hair); px(ox + 29.5, 9, 3, 15, hair); px(ox + 12, 4.5, 9, 1.5, hairL); px(ox + 11, 11, 18, 1.5, hair); }
    if (hs === 'bald') { px(ox + 8, 11, 2.5, 6, hair); px(ox + 29.5, 11, 2.5, 6, hair); px(ox + 13, 7.5, 5, 1, 'rgba(255,255,255,.35)'); }
    if (hs === 'cap') { var cc = shade(body.charAt(0) === '#' ? body : '#445566', -30); px(ox + 8.5, 3.5, 23, 7.5, cc); px(ox + 10, 2.5, 20, 1.5, cc); px(ox + 26, 10, 10, 2.5, cc); px(ox + 9, 9.5, 22, 1.5, shade('#888888', -60)); px(ox + 8, 11, 2.5, 5, hair); px(ox + 29.5, 11, 2, 5, hair); }
    if (hs === 'helmet') { px(ox + 7, 2.5, 26, 10.5, body); px(ox + 9, 1.5, 22, 1.5, body); px(ox + 18, 1.5, 4, 11.5, '#f4f0e6'); px(ox + 7, 12, 26, 1.5, bodyD); px(ox + 6.5, 13, 3, 8, '#2a2a30'); px(ox + 30.5, 13, 3, 8, '#2a2a30'); px(ox + 9, 3.5, 6, 1.5, bodyL); }
    if (hs === 'straw') { px(ox + 9, 2.5, 22, 7, '#e3c178'); px(ox + 11, 1.5, 18, 1.5, '#e3c178'); px(ox + 9, 7.5, 22, 1.5, '#7a5a2a'); px(ox + 3, 9, 34, 2.5, '#e3c178'); px(ox + 3, 11, 34, 1, '#b8924a'); }
    // 脸
    px(ox + 13.5, 15.5, 2.5, 3.5, '#2a1a12'); px(ox + 24, 15.5, 2.5, 3.5, '#2a1a12'); px(ox + 13.5, 15.5, 1, 1, '#ffffff'); px(ox + 24, 15.5, 1, 1, '#ffffff');
    px(ox + 11, 20, 3, 1.5, 'rgba(232,120,110,.45)'); px(ox + 26, 20, 3, 1.5, 'rgba(232,120,110,.45)');
    px(ox + 18, 22, 4, 1, '#9a5a44');
    if (spec.old) { px(ox + 12.5, 13.5, 4, 1, hair); px(ox + 23.5, 13.5, 4, 1, hair); px(ox + 16.5, 23.5, 7, 1, hairL); }
    // 配件
    var acc = spec.acc;
    if (acc === 'tie') { px(ox + 15, 27.5, 10, 2.5, '#f4f0e6'); px(ox + 18.5, 28.5, 3, 9, '#2f6f66'); px(ox + 18, 37, 4, 1.5, '#2f6f66'); }
    if (acc === 'apron') { px(ox + 13, 31, 14, 14.5, '#f2ead8'); px(ox + 13, 31, 14, 1, '#d8ccb0'); px(ox + 17, 27.5, 1.5, 4, '#f2ead8'); px(ox + 21.5, 27.5, 1.5, 4, '#f2ead8'); }
    if (acc === 'glasses') { px(ox + 12, 14.5, 6, 1, '#3a3a40'); px(ox + 12, 19, 6, 1, '#3a3a40'); px(ox + 12, 14.5, 1, 5, '#3a3a40'); px(ox + 17, 14.5, 1, 5, '#3a3a40'); px(ox + 22.5, 14.5, 6, 1, '#3a3a40'); px(ox + 22.5, 19, 6, 1, '#3a3a40'); px(ox + 22.5, 14.5, 1, 5, '#3a3a40'); px(ox + 27.5, 14.5, 1, 5, '#3a3a40'); px(ox + 18, 16, 4.5, 1, '#3a3a40'); }
    if (acc === 'pack') { px(ox + 12.5, 27.5, 2.5, 14, '#2f4f7a'); px(ox + 25, 27.5, 2.5, 14, '#2f4f7a'); px(ox + 6, 30, 3, 12, '#3a5f8a'); px(ox + 31, 30, 3, 12, '#3a5f8a'); }
    if (acc === 'scarf') { px(ox + 12, 26.5, 16, 2.5, '#d8432f'); px(ox + 18, 28.5, 4, 5, '#d8432f'); px(ox + 19, 33, 2, 2, '#b8321f'); }
    if (acc === 'keys') { px(ox + 26, 40, 1.5, 4, '#8a7a50'); px(ox + 25, 43.5, 4, 3.5, '#e8b54a'); px(ox + 26, 44.5, 2, 1.5, '#b8862a'); }
    if (acc === 'clip') { px(ox + 28, 32, 9, 12, '#d8c8a0'); px(ox + 28, 32, 9, 1, '#8a7a5a'); px(ox + 31, 31, 3, 2, '#666'); px(ox + 29.5, 35, 6, 1, '#777'); px(ox + 29.5, 37.5, 6, 1, '#777'); px(ox + 29.5, 40, 4, 1, '#777'); }
    if (acc === 'phone') { px(ox + 29.5, 33, 5, 9, '#222226'); px(ox + 30.5, 34, 3, 6, '#7fd0ff'); }
    if (acc === 'cam') { px(ox + 26, 30, 11, 8, '#26262a'); px(ox + 34, 31.5, 4, 5, '#55555c'); px(ox + 28, 28.5, 4, 2, '#26262a'); px(ox + 35, 33, 2, 2, '#9fd0ff'); }
    if (acc === 'basket') { px(ox + 28.5, 38, 9, 7, '#b8823a'); px(ox + 28.5, 38, 9, 1.5, '#8a5a22'); px(ox + 30, 36, 6, 2.5, '#4f8a4b'); px(ox + 31, 40.5, 1, 4, '#8a5a22'); px(ox + 34, 40.5, 1, 4, '#8a5a22'); }
    if (acc === 'cane') { px(ox + 33.5, 31, 1.5, 25, '#7a5230'); px(ox + 31.5, 30, 3.5, 1.5, '#7a5230'); }
    if (acc === 'vest') { px(ox + 12, 28.5, 16, 15, '#e8862a'); px(ox + 12, 34, 16, 1.5, '#f4f0c8'); px(ox + 12, 39, 16, 1.5, '#f4f0c8'); px(ox + 19, 28.5, 2, 15, shade(body, -10)); }
    // 描边：取剪影向四周偏移
    var sil = A.P.createCanvas(c.width, c.height), sg = sil.getContext('2d');
    sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#3a2416'; sg.fillRect(0, 0, c.width, c.height);
    var out = A.P.createCanvas(c.width + 4, c.height + 4), og = out.getContext('2d');
    [[0, 2], [4, 2], [2, 0], [2, 4], [1, 1], [3, 1], [1, 3], [3, 3]].forEach(function (o) { og.drawImage(sil, o[0], o[1]); });
    og.drawImage(c, 2, 2);
    return out;
  }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }
  function walkSpec(arch, seed) {
    var A0 = Cast.archetypes[arch] || Cast.archetypes.office, L = A0.looks, h = hash(seed);
    function pk(arr, sh) { return arr[(h >>> sh) % arr.length]; }
    var hair = pk(L.hair, 3);
    return { body: pk(L.body, 0), pants: pk(L.pants, 6), hair: hair, hairCol: arch === 'elder' ? pk(['#c8c2b8', '#a8a29a', '#e0dcd4'], 9) : pk(HAIRS, 9), acc: pk(L.acc, 12), skin: (h >>> 15) % 3, old: arch === 'elder' };
  }
  function canvasFor(who, look) {
    var key = look ? 'w' + look.arch + look.seed : who;
    if (cache[key]) return cache[key];
    var spec = look ? walkSpec(look.arch, look.seed) : (Cast.npcs[who] || Cast.npcs.neighbor);
    return (cache[key] = build(spec));
  }
  var P = {};
  // who：常客 id / 配角 id / 'walk'（配 opts.look = {arch, seed}）。(x, footY) 为脚底中心，h 为显示身高。
  P.draw = function (ctx, who, x, footY, h, o) {
    o = o || {};
    var reg = Cast.regulars[who];
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    var sq = o.squash || 0, bob = o.bob || 0;
    if (reg) { A.sprite(ctx, reg.sprite, x, footY + bob, h, { flip: o.flip, squash: sq }); ctx.restore(); return; }
    // 有 Lovart 立绘的配角：用立绘（孩子矮一些）
    var np = !o.look && Cast.npcs[who];
    if (np && np.sprite && A.img(np.sprite)) { A.sprite(ctx, np.sprite, x, footY + bob, h * (np.kid ? 0.66 : np.h || 0.94), { flip: o.flip, squash: sq }); ctx.restore(); return; }
    var c = canvasFor(who, o.look), kid = !o.look && Cast.npcs[who] && Cast.npcs[who].kid, hh = kid ? h * 0.7 : h * 0.84, s = hh / c.height, w = c.width * s;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, footY + bob); ctx.scale((o.flip ? -1 : 1) * (1 + sq), 1 - sq);
    ctx.drawImage(c, -w / 2, -hh, w, hh);
    ctx.restore();
  };
  P.FOOT = 552;
  P.height = function (who) { var r = Cast.regulars[who]; return Math.round((r ? r.h : 250) * 1.14); };
  // 头像：圆角方框里的上半身
  P.portrait = function (ctx, who, x, y, size, o) {
    o = o || {};
    ctx.save();
    A.P && 0;
    ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
    var reg = Cast.regulars[who];
    if (reg) { var hh = size * (who === 'zhao' ? 1.75 : who === 'qin' ? 2.0 : 2.15); A.sprite(ctx, reg.sprite, x + size / 2 + (who === 'zhao' ? size * 0.2 : who === 'qin' ? -size * 0.52 : 0), y + hh + size * 0.04, hh, {}); }
    else if (!o.look && Cast.npcs[who] && Cast.npcs[who].sprite && A.img(Cast.npcs[who].sprite)) { var np = Cast.npcs[who], k = np.kid ? 1.55 : 2.0; A.sprite(ctx, np.sprite, x + size / 2, y + size * k * 0.98, size * k, {}); }
    else P.draw(ctx, who, x + size / 2, y + size * 2.25, size * 2.3, { look: o.look });
    ctx.restore();
  };
  // 头顶表情：heart 开心 / sweat 着急 / anger 不满 / dots 有话说 / q 疑问 / note 哼歌 / zzz 困
  P.emote = function (ctx, kind, x, y, t) {
    var k = Math.min(1, t * 5), pop = Fx.ease.back(k), bobY = Math.sin(t * 4) * 2;
    ctx.save(); ctx.translate(x, y + bobY); ctx.scale(pop, pop);
    if (kind === 'heart') { ctx.fillStyle = '#e06060'; Fx.heart(ctx, 0, 0, 11); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-7, -6, 3, 3); }
    else if (kind === 'sweat') { ctx.fillStyle = '#7fc4e8'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(9, 2, 0, 8); ctx.quadraticCurveTo(-9, 2, 0, -12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-3, 0, 2, 3); }
    else if (kind === 'anger') { ctx.strokeStyle = '#c8442f'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, -3); ctx.quadraticCurveTo(-3, -3, -3, -9); ctx.moveTo(9, -3); ctx.quadraticCurveTo(3, -3, 3, -9); ctx.moveTo(-9, 3); ctx.quadraticCurveTo(-3, 3, -3, 9); ctx.moveTo(9, 3); ctx.quadraticCurveTo(3, 3, 3, 9); ctx.stroke(); }
    else if (kind === 'q') { ctx.fillStyle = '#fff8e8'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7d5a35'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1); }
    else if (kind === 'note') { ctx.fillStyle = '#2f6f66'; ctx.fillRect(4, -12, 3, 14); ctx.beginPath(); ctx.ellipse(0, 3, 6, 4.5, -0.4, 0, 7); ctx.fill(); ctx.fillRect(4, -12, 8, 3); }
    else if (kind === 'zzz') { ctx.fillStyle = '#8fa8c8'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('z', -8, 4); ctx.font = 'bold 12px sans-serif'; ctx.fillText('z', 2, -4); }
    else { ctx.fillStyle = '#fff8e8'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 19, 13, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7d5a35'; for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 8, Math.sin(t * 6 + i) * 2, 2.6, 0, 7); ctx.fill(); } }
    ctx.restore();
  };
  P.walkName = function (arch) { return (Cast.archetypes[arch] || {}).name || '客人'; };
  return P;
});
