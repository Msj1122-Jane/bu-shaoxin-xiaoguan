// 《不烧心小馆》程序化音频引擎 v2（D008）：零依赖 WebAudio 合成，无音频文件。
// 结构：一次性音效(sfx) / 灶台循环层(loop) / 环境混音(amb) / 生成式五声音乐(mus) 四条总线 → 轻压缩 → 输出。
// 规则：做饭声优先于音乐；对白时音乐与环境压到 45%；没有 AudioContext 时所有函数都是安全空操作。
// 性能：只用三块共享缓冲（白噪、粉噪、稀疏爆点）；不做逐采样 JS 处理；包络结束后停止并断开节点。
BSX.define('game/audio', function (require) {
  'use strict';

  var Au = { ctx: null, P: null, vol: { music: 0.5, sfx: 0.8 }, muted: false, mood: null, log: [] };
  var ctx = null, nyq = 22050, live = 0, paused = false, duck = false, tries = 0, E = {};
  var bus = {}, bufs = {}, rms = { w: 0.577, p: 0.3, c: 1 };
  var pools = { sfx: [], mus: [], amb: [], lp: [] }, CAP = { sfx: 14, mus: 14, amb: 9, lp: 6 };
  var lastAt = {}, mx = { s: -1, m: -1, a: -1, l: -1 };
  var scene = { place: null, rain: 0, crowd: 0, dawn: 0, music: null };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return v === true ? 1 : v === false ? 0 : (typeof v === 'number' && v === v ? v : d); }
  function has(o, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  function rr(a, b) { return a + Math.random() * (b - a); }
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function setT(p, v, tc, now) { try { p.setTargetAtTime(v, now, tc); } catch (e) { try { p.value = v; } catch (e2) {} } }
  function noop() {}

  // 估算滤波后噪声的有效值，用来把 nz()/图层里的音量写成"听感电平"而不是裸增益
  function est(kind, type, f, q) {
    var fr = 1, x;
    if (kind === 'c') return 1;
    if (kind === 'p') {
      if (type === 'lowpass') fr = Math.log(Math.max(f, 25) / 20) / 6.9;
      else if (type === 'highpass') fr = Math.log(nyq / Math.min(f, nyq * 0.9)) / 6.9;
      else if (type) { x = 0.5 / (q || 1); fr = 3.14 * Math.log(x + Math.sqrt(x * x + 1)) / 6.9; }
      return rms.p * Math.sqrt(clamp(fr, 0.03, 1));
    }
    if (type === 'lowpass') fr = f / nyq;
    else if (type === 'highpass') fr = 1 - f / nyq;
    else if (type) fr = 1.57 * f / ((q || 1) * nyq);
    return rms.w * Math.sqrt(clamp(fr, 0.003, 1));
  }
  function gl(kind, type, f, q, level) { return Math.min(level / est(kind, type, f, q), 16); }

  // ---------- 缓冲与总线 ----------
  function mkbuf(sec, fill) {
    var sr = ctx.sampleRate || 44100, n = Math.floor(sr * sec), xf = Math.floor(sr * 0.04), i, k;
    var b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), tmp = new Float32Array(n + xf);
    fill(tmp, n + xf, sr);
    for (i = 0; i < n; i++) d[i] = tmp[i];
    for (i = 0; i < xf; i++) { k = i / xf; d[i] = tmp[i] * Math.sqrt(k) + tmp[n + i] * Math.sqrt(1 - k); } // 循环接缝做等功率交叉
    return b;
  }
  function measure(b) { var d = b.getChannelData(0), s = 0, i; for (i = 0; i < d.length; i += 7) s += d[i] * d[i]; return Math.sqrt(s / Math.ceil(d.length / 7)) || 0.3; }
  function makeBuffers() {
    bufs.w = mkbuf(2, function (d, n) { for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; });
    bufs.p = mkbuf(4, function (d, n) {
      var b0 = 0, b1 = 0, b2 = 0, w, i, pk = 0;
      for (i = 0; i < n; i++) {
        w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = b0 + b1 + b2 + w * 0.1848;
        if (Math.abs(d[i]) > pk) pk = Math.abs(d[i]);
      }
      pk = 0.95 / (pk || 1); for (i = 0; i < n; i++) d[i] *= pk;
    });
    bufs.c = mkbuf(4, function (d, n, sr) { // 稀疏爆点：油星、雨点、粉笔、谷粒都从这里取
      var i = 0, j, len, a;
      while (true) {
        i += 1 + Math.floor(-Math.log(1 - Math.random() * 0.999) * sr / 90);
        if (i >= n) break;
        a = Math.pow(Math.random(), 2.5) * (Math.random() < 0.5 ? -1 : 1);
        len = 6 + Math.floor(Math.random() * Math.random() * sr * 0.004);
        for (j = 0; j < len && i + j < n; j++) d[i + j] += a * (Math.random() * 2 - 1) * Math.exp(-5 * j / len);
      }
    });
    rms.w = measure(bufs.w); rms.p = measure(bufs.p);
  }
  function bg(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
  function build(c) {
    ctx = c; nyq = (c.sampleRate || 44100) / 2;
    makeBuffers();
    var out = bg(0.85), tail = out, comp, sh, d1, d2, f1, f2, fb1, fb2, xg, rout;
    out.connect(c.destination);
    if (c.createDynamicsCompressor) {
      try {
        comp = c.createDynamicsCompressor();
        comp.threshold.value = -15; comp.knee.value = 14; comp.ratio.value = 3.2; comp.attack.value = 0.008; comp.release.value = 0.24;
        comp.connect(out); tail = comp;
      } catch (e) { tail = out; }
    }
    try { sh = c.createBiquadFilter(); sh.type = 'highshelf'; sh.frequency.value = 7200; sh.gain.value = -3.5; sh.connect(tail); tail = sh; } catch (e2) {}
    bus.master = bg(1); bus.master.connect(tail);
    bus.sfx = bg(0); bus.mus = bg(0); bus.amb = bg(0);
    bus.sfx.connect(bus.master); bus.mus.connect(bus.master); bus.amb.connect(bus.master);
    bus.one = bg(1); bus.loop = bg(1); bus.one.connect(bus.sfx); bus.loop.connect(bus.sfx);
    if (c.createDelay) { // 小店的"屋子"：两条带低通的短反馈延时，不用卷积
      try {
        bus.room = bg(1); rout = bg(0.9); d1 = c.createDelay(0.25); d2 = c.createDelay(0.25);
        d1.delayTime.value = 0.0297; d2.delayTime.value = 0.0471;
        f1 = c.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 2400;
        f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1700;
        fb1 = bg(0.36); fb2 = bg(0.3); xg = bg(0.2);
        bus.room.connect(d1); d1.connect(f1); f1.connect(fb1); fb1.connect(d1); f1.connect(rout);
        bus.room.connect(d2); d2.connect(f2); f2.connect(fb2); fb2.connect(d2); f2.connect(rout); f1.connect(xg); xg.connect(d2);
        rout.connect(bus.master);
        bus.sendS = bg(0.11); bus.one.connect(bus.sendS); bus.sendS.connect(bus.room);
        bus.sendM = bg(0.2); bus.mus.connect(bus.sendM); bus.sendM.connect(bus.room);
      } catch (e3) {}
    }
    Au.ctx = c; mx.s = mx.m = mx.a = mx.l = -1;
    mix(c.currentTime || 0, true);
  }
  function mix(now, force) {
    var sum = 0, k, s, m, a, l, d = duck ? 0.45 : 1;
    for (k in loops) sum += Math.pow(loops[k].cur, loops[k].shape);
    s = Au.muted ? 0 : Au.vol.sfx; a = s * d * 0.9;
    m = Au.muted ? 0 : Au.vol.music * d * (1 - 0.22 * Math.min(1, sum)); // 灶上热闹时音乐让一步
    l = 1 / (1 + 0.4 * Math.max(0, sum - 1));                                  // 多层同时响时整体收一点
    if (force) { bus.sfx.gain.value = s; bus.mus.gain.value = m; bus.amb.gain.value = a; bus.loop.gain.value = l; mx.s = s; mx.m = m; mx.a = a; mx.l = l; return; }
    if (Math.abs(s - mx.s) > 0.003) { setT(bus.sfx.gain, s, 0.04, now); mx.s = s; }
    if (Math.abs(m - mx.m) > 0.003) { setT(bus.mus.gain, m, 0.12, now); mx.m = m; }
    if (Math.abs(a - mx.a) > 0.003) { setT(bus.amb.gain, a, 0.12, now); mx.a = a; }
    if (Math.abs(l - mx.l) > 0.01) { setT(bus.loop.gain, l, 0.15, now); mx.l = l; }
  }

  // ---------- 声部（一次性）与合成原件 ----------
  function release(v) {
    var i;
    for (i = 0; i < v.srcs.length; i++) { try { v.srcs[i].stop(); } catch (e) {} }
    for (i = 0; i < v.nodes.length; i++) { try { v.nodes[i].disconnect(); } catch (e2) {} }
    live -= v.nodes.length; v.nodes = []; v.srcs = [];
  }
  function reap(now) {
    var k, list, i;
    for (k in pools) { list = pools[k]; for (i = list.length - 1; i >= 0; i--) if (list[i].end <= now) { release(list[i]); list.splice(i, 1); } }
  }
  function spawn(pool, dest, fn, vol, pitch, pan, wantPan) {
    var list = pools[pool], now = ctx.currentTime, t = now + 0.006, i, j, v, pn, tail;
    if (list.length >= CAP[pool]) {
      if (pool !== 'sfx') return null;
      for (j = 0, i = 1; i < list.length; i++) if (list[i].end < list[j].end) j = i; // 让最快结束的那个声部让位
      release(list[j]); list.splice(j, 1);
    }
    v = { nodes: [], srcs: [], end: t, p: pitch || 1, out: ctx.createGain(), pan: null };
    v.out.gain.value = vol; v.nodes.push(v.out); live++; tail = v.out;
    if ((pan || wantPan) && ctx.createStereoPanner) {
      try { pn = ctx.createStereoPanner(); pn.pan.value = clamp(pan || 0, -1, 1); v.nodes.push(pn); live++; v.out.connect(pn); tail = pn; v.pan = pn; } catch (e) { tail = v.out; }
    }
    tail.connect(dest); list.push(v);
    try { fn(v, t); } catch (e2) { v.end = now; }
    return v;
  }
  function env(p, t, a, peak, dur, hold, lin) {
    if (peak < 0.0002) peak = 0.0002;
    if (dur < a + hold + 0.006) dur = a + hold + 0.006;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    if (hold > 0) p.setValueAtTime(peak, t + a + hold);
    if (lin) p.linearRampToValueAtTime(0.0001, t + dur); else p.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function flt(v, type, f, q) {
    var n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = clamp(f, 20, nyq * 0.9); n.Q.value = q || 0.7;
    v.nodes.push(n); live++; return n;
  }
  function gn(v, val) { var g = ctx.createGain(); g.gain.value = val; v.nodes.push(g); live++; return g; }
  // 正弦/三角分音 + 打击包络。o: {type,a,hold,lin,to(滑到 Hz),tt,bend(比例),dest}
  function tone(v, t, f, dur, peak, o) {
    o = o || E; f *= v.p;
    if (!(f > 0) || f > nyq * 0.92) return null;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    v.nodes.push(osc, g); live += 2; v.srcs.push(osc);
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(clamp(o.to * v.p, 20, nyq * 0.9), t + (o.tt || dur));
    else if (o.bend) osc.frequency.exponentialRampToValueAtTime(f * o.bend, t + dur);
    g.gain.value = 0; env(g.gain, t, o.a || 0.004, peak, dur, o.hold || 0, o.lin);
    osc.connect(g); g.connect(o.dest || v.out);
    osc.start(t); osc.stop(t + dur + 0.02);
    if (t + dur + 0.06 > v.end) v.end = t + dur + 0.06;
    return osc;
  }
  function modal(v, t, f, R, A, D, peak, o) { for (var i = 0; i < R.length; i++) tone(v, t, f * R[i], D[i], peak * A[i], o); }
  // 过滤噪声。o: {buf:'w'|'p'|'c', type, f, q, to, tt, hp, lp, rate, a, hold, lin, dest}；peak 对 w/p 是近似有效值，对 c 是裸增益
  function nz(v, t, dur, peak, o) {
    var kind = o.buf || 'w', s = ctx.createBufferSource(), g = ctx.createGain(), last = s, f, x;
    var type = o.f ? (o.type || 'bandpass') : null, ff = o.f ? clamp(o.f * v.p, 20, nyq * 0.9) : 0;
    v.nodes.push(s, g); live += 2; v.srcs.push(s);
    s.buffer = bufs[kind]; s.loop = true;
    if (o.rate) s.playbackRate.value = o.rate;
    if (type) {
      f = flt(v, type, ff, o.q || 1);
      if (o.to) { f.frequency.setValueAtTime(ff, t); f.frequency.exponentialRampToValueAtTime(clamp(o.to * v.p, 20, nyq * 0.9), t + (o.tt || dur)); }
      last.connect(f); last = f;
    }
    if (o.hp) { x = flt(v, 'highpass', o.hp, 0.7); last.connect(x); last = x; }
    if (o.lp) { x = flt(v, 'lowpass', o.lp, 0.7); last.connect(x); last = x; }
    g.gain.value = 0; env(g.gain, t, o.a || 0.003, Math.min(peak / est(kind, type, ff, o.q || 1), 16), dur, o.hold || 0, o.lin);
    last.connect(g); g.connect(o.dest || v.out);
    s.start(t, Math.random() * ((bufs[kind] && bufs[kind].duration) || 1)); s.stop(t + dur + 0.02);
    if (t + dur + 0.06 > v.end) v.end = t + dur + 0.06;
  }
  // 一串噪声脉冲打进一组并联共振带（卷帘门铁片），共振随时间滑动
  function train(v, times, amps, blen, peak, freqs, q, slide, dur) {
    var s = ctx.createBufferSource(), gate = ctx.createGain(), og = ctx.createGain(), i, b, te, t0 = times[0], end = times[times.length - 1] + blen, f, x;
    v.nodes.push(s, gate, og); live += 3; v.srcs.push(s);
    s.buffer = bufs.w; s.loop = true; gate.gain.value = 0; og.gain.value = 1;
    gate.gain.setValueAtTime(0.0001, t0);
    for (i = 0; i < times.length; i++) {
      te = i + 1 < times.length ? Math.min(times[i] + blen, times[i + 1] - 0.006) : times[i] + blen;
      if (i > 0) gate.gain.setValueAtTime(0.0001, times[i]);
      gate.gain.linearRampToValueAtTime(Math.max(0.0002, amps[i]), times[i] + 0.003);
      gate.gain.exponentialRampToValueAtTime(0.0001, Math.max(te, times[i] + 0.012));
    }
    s.connect(gate);
    for (i = 0; i < freqs.length; i++) {
      f = clamp(freqs[i] * v.p, 40, nyq * 0.8);
      b = flt(v, 'bandpass', f, q);
      if (slide && slide !== 1) { b.frequency.setValueAtTime(f, t0); b.frequency.exponentialRampToValueAtTime(clamp(f * slide, 40, nyq * 0.85), t0 + dur); }
      x = gn(v, gl('w', 'bandpass', f, q, peak));
      gate.connect(b); b.connect(x); x.connect(og);
    }
    og.connect(v.out);
    s.start(t0, Math.random()); s.stop(end + 0.03);
    if (end + 0.08 > v.end) v.end = end + 0.08;
  }
  function wood(v, t, f, amp) { // 木头/塑料的"笃"
    tone(v, t, f, 0.05, amp, { to: f * 0.8, a: 0.0015 });
    tone(v, t, f * 2.37, 0.022, amp * 0.35, { a: 0.001 });
    nz(v, t, 0.014, amp * 0.18, { type: 'highpass', f: 2400, a: 0.001 });
  }
  function drip(v, t, amp, f) { tone(v, t, f, 0.04, amp, { to: f * 1.7, tt: 0.03, a: 0.003 }); }
  function coinHit(v, t, amp, k) {
    modal(v, t, 2500 * k, [1, 1.52, 2.31, 3.44], [1, 0.55, 0.3, 0.15], [0.2, 0.14, 0.09, 0.06], 0.065 * amp);
    nz(v, t, 0.012, 0.045 * amp, { type: 'highpass', f: 4000, a: 0.001 });
  }
  function tin(v, t, amp) { modal(v, t, 720, [1, 1.77, 2.6], [1, 0.6, 0.3], [0.09, 0.07, 0.05], amp); }
  function brass(v, t, f, amp, dec, bend) { // 门口的小铜铃
    modal(v, t, f, [1, 2.01, 2.83, 3.9, 5.2], [1, 0.5, 0.34, 0.18, 0.09], [dec, dec * 0.7, dec * 0.5, dec * 0.34, dec * 0.22], amp, bend ? { bend: bend, a: 0.002 } : { a: 0.002 });
    nz(v, t, 0.01, amp * 0.3, { type: 'highpass', f: 5000, a: 0.001 });
  }

  // 乐器：正弦/三角分音，软起音。玩具钟琴、拇指琴、低音拨弦
  var I = {
    kalimba: function (v, t, f, vel) { tone(v, t, f, 1.0, 0.3 * vel, { a: 0.004 }); tone(v, t, f * 2, 0.4, 0.07 * vel); tone(v, t, f * 5.43, 0.09, 0.045 * vel); },
    glock: function (v, t, f, vel) { tone(v, t, f, 1.3, 0.21 * vel, { a: 0.003 }); tone(v, t, f * 2.756, 0.45, 0.055 * vel); tone(v, t, f * 5.404, 0.14, 0.025 * vel); },
    marimba: function (v, t, f, vel) { tone(v, t, f, 0.5, 0.32 * vel, { a: 0.004 }); tone(v, t, f * 3.98, 0.1, 0.07 * vel); tone(v, t, f * 9.2, 0.03, 0.025 * vel); },
    pluck: function (v, t, f, vel, len) {
      var lp = flt(v, 'lowpass', Math.min(f * 6, 1500), 0.7); len = clamp(len || 0.9, 0.5, 1.8);
      lp.frequency.setValueAtTime(Math.min(f * 6, 1500), t); lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.7, 200), t + 0.4);
      lp.connect(v.out);
      tone(v, t, f, len, 0.36 * vel, { type: 'triangle', a: 0.007, dest: lp }); tone(v, t, f * 2, 0.3, 0.07 * vel, { a: 0.005, dest: lp });
    },
    low: function (v, t, f, vel, len) { len = clamp(len || 3, 2, 4.5); tone(v, t, f, len, 0.3 * vel, { a: 0.03 }); tone(v, t, f * 2, len * 0.4, 0.07 * vel, { a: 0.02 }); tone(v, t, f * 3, 0.5, 0.025 * vel, { a: 0.01 }); },
    tick: function (v, t, f, vel) { tone(v, t, f, 0.17, 0.2 * vel, { a: 0.003 }); tone(v, t, f * 3.9, 0.03, 0.04 * vel); },
    pad: function (v, t, f, vel, len) { len = clamp(len || 4, 2, 9); tone(v, t, f, len + 2.2, 0.1 * vel, { a: 0.6, hold: len - 0.6, lin: true }); tone(v, t, f * 1.004, len + 2.2, 0.06 * vel, { a: 0.8, hold: len - 0.8, lin: true }); }
  };

  // ---------- 一次性音效表 ----------
  var CUE = {};
  // 界面
  CUE.tap = function (v, t) { wood(v, t, 900 * rr(0.95, 1.06), 0.15); };
  CUE.ui_open = function (v, t) { nz(v, t, 0.17, 0.04, { f: 800, to: 2400, q: 1.2, a: 0.03 }); wood(v, t + 0.01, 520, 0.1); wood(v, t + 0.075, 700, 0.07); };
  CUE.ui_close = function (v, t) { nz(v, t, 0.14, 0.04, { f: 2200, to: 700, q: 1.2, a: 0.02 }); wood(v, t + 0.06, 430, 0.12); };
  CUE.page = function (v, t) {
    nz(v, t, 0.17, 0.06, { f: 2800, to: 1500, q: 0.8, a: 0.035 }); nz(v, t + 0.08, 0.08, 0.04, { f: 4200, q: 1, a: 0.01 });
    nz(v, t + 0.13, 0.05, 0.05, { buf: 'p', type: 'lowpass', f: 350, a: 0.004 });
  };
  CUE.chalk = function (v, t) {
    nz(v, t, 0.24, 0.5, { buf: 'c', rate: 3.2, f: 3000, to: 3600, q: 2.2, a: 0.01, hold: 0.15 });
    nz(v, t, 0.22, 0.028, { f: 4300, q: 3, a: 0.02, hold: 0.12 }); wood(v, t + 0.23, 1500, 0.05);
  };
  CUE.stamp = function (v, t) { tone(v, t, 125, 0.16, 0.32, { to: 68, a: 0.002 }); nz(v, t, 0.08, 0.11, { buf: 'p', type: 'lowpass', f: 420, a: 0.002 }); wood(v, t + 0.004, 300, 0.1); };
  CUE.coin = function (v, t) { coinHit(v, t, 1, rr(0.97, 1.04)); coinHit(v, t + 0.075, 0.35, 1.05); tin(v, t, 0.09); };
  CUE.coins = function (v, t) {
    var at = [0, 0.06, 0.13, 0.21], i;
    for (i = 0; i < 4; i++) coinHit(v, t + at[i] + rr(0, 0.015), 0.9 - i * 0.15, rr(0.9, 1.12));
    tin(v, t, 0.09); tin(v, t + 0.13, 0.05);
  };
  CUE.till = function (v, t) {
    modal(v, t, 520, [1, 1.72, 3.1, 4.6], [1, 0.7, 0.4, 0.2], [0.16, 0.13, 0.09, 0.06], 0.09); nz(v, t, 0.02, 0.07, { type: 'highpass', f: 3000, a: 0.001 });
    tone(v, t, 170, 0.08, 0.13, { to: 110 }); modal(v, t + 0.085, 560, [1, 1.72, 3.1], [1, 0.6, 0.3], [0.08, 0.06, 0.04], 0.04);
  };
  CUE.bell = function (v, t) { brass(v, t, 1320, 0.075, 0.9); brass(v, t + 0.14, 1320, 0.04, 0.8); brass(v, t + 0.31, 1320, 0.022, 0.7); };
  CUE.knock = function (v, t) {
    var i, tt;
    for (i = 0; i < 3; i++) {
      tt = t + i * 0.17;
      tone(v, tt, 180, 0.07, 0.22, { to: 120, a: 0.002 });
      modal(v, tt, 310, [1, 1.69, 2.81, 4.5], [1, 0.7, 0.5, 0.3], [0.2, 0.16, 0.12, 0.08], 0.045);
      nz(v, tt, 0.05, 0.3, { buf: 'c', rate: 2.5, f: 1800, q: 1.5, a: 0.002 });
    }
  };
  CUE.phone = function (v, t) {
    var i, tt;
    for (i = 0; i < 2; i++) {
      tt = t + i * 0.48;
      tone(v, tt, 172, 0.34, 0.065, { type: 'triangle', a: 0.02, hold: 0.26 }); tone(v, tt, 86, 0.34, 0.055, { a: 0.02, hold: 0.26 });
      nz(v, tt, 0.34, 0.32, { buf: 'c', rate: 2.2, f: 750, q: 1.5, a: 0.02, hold: 0.26 });
    }
  };
  CUE.sigh = function (v, t) { nz(v, t, 0.75, 0.045, { f: 1300, to: 650, q: 1.1, a: 0.14, tt: 0.7, lin: true }); nz(v, t, 0.6, 0.018, { f: 2600, to: 1700, q: 1.5, a: 0.1, lin: true }); };
  // 灶台
  CUE.bowl = function (v, t) { tone(v, t, 165, 0.1, 0.19, { to: 105, a: 0.002 }); wood(v, t, 330, 0.1); modal(v, t + 0.002, 1460, [1, 2.32, 3.86], [1, 0.4, 0.18], [0.14, 0.09, 0.05], 0.05); };
  CUE.spoon = function (v, t) { modal(v, t, 2780, [1, 1.61, 2.74], [1, 0.5, 0.25], [0.19, 0.11, 0.06], 0.065); nz(v, t, 0.012, 0.035, { type: 'highpass', f: 5000, a: 0.001 }); };
  CUE.ladle = function (v, t) {
    tone(v, t, 140, 0.11, 0.19, { to: 330, tt: 0.08, a: 0.012 }); tone(v, t + 0.08, 230, 0.12, 0.13, { to: 110, tt: 0.1, a: 0.01 });
    nz(v, t, 0.18, 0.065, { buf: 'p', f: 480, q: 1.4, a: 0.02 }); drip(v, t + 0.22, 0.035, 640);
  };
  CUE.stir = function (v, t) {
    nz(v, t, 0.34, 0.055, { buf: 'p', f: 520, to: 900, q: 1.3, a: 0.07, tt: 0.2 }); nz(v, t, 0.3, 0.26, { buf: 'c', rate: 1.6, f: 1100, q: 2, a: 0.05, hold: 0.12 });
    modal(v, t + 0.02, 430, [1, 2.3], [1, 0.4], [0.22, 0.12], 0.025, { a: 0.04 }); nz(v, t, 0.32, 0.035, { buf: 'p', type: 'lowpass', f: 360, a: 0.09 });
  };
  CUE.rice = function (v, t) {
    nz(v, t, 0.5, 0.5, { buf: 'c', rate: 2.6, f: 3400, q: 0.9, a: 0.05, hold: 0.22 }); nz(v, t, 0.45, 0.03, { f: 1500, q: 1, a: 0.06, hold: 0.15 });
    drip(v, t + 0.12, 0.03, rr(520, 700)); drip(v, t + 0.25, 0.03, rr(600, 860)); drip(v, t + 0.37, 0.022, rr(500, 800));
  };
  CUE.lid = function (v, t) {
    modal(v, t, 610, [1, 1.47, 2.09, 2.96, 3.9, 5.1], [1, 0.8, 0.6, 0.4, 0.25, 0.15], [0.34, 0.27, 0.2, 0.14, 0.1, 0.07], 0.06);
    nz(v, t, 0.02, 0.07, { type: 'highpass', f: 2500, a: 0.001 }); modal(v, t + 0.065, 640, [1, 1.47, 2.09], [1, 0.7, 0.4], [0.12, 0.1, 0.07], 0.028);
  };
  CUE.dough = function (v, t) {
    nz(v, t, 0.12, 0.15, { buf: 'p', type: 'lowpass', f: 750, to: 240, a: 0.002 }); tone(v, t, 118, 0.13, 0.25, { to: 72, a: 0.002 });
    nz(v, t, 0.1, 0.03, { f: 2300, q: 0.6, a: 0.008 }); nz(v, t + 0.1, 0.24, 0.025, { buf: 'p', f: 480, to: 860, q: 2, a: 0.09 });
  };
  CUE.drop_oil = function (v, t) {
    tone(v, t, 230, 0.07, 0.1, { to: 130 }); nz(v, t, 0.95, 0.085, { type: 'highpass', f: 3200, lp: 8500, a: 0.015 });
    nz(v, t, 1.15, 0.6, { buf: 'c', rate: 1.8, f: 4200, q: 0.8, a: 0.012 }); nz(v, t, 0.5, 0.04, { buf: 'p', f: 420, q: 1.2, a: 0.02 });
  };
  CUE.flip = function (v, t) {
    wood(v, t, 2100, 0.05); nz(v, t + 0.01, 0.24, 0.075, { f: 1900, to: 3600, q: 0.8, a: 0.012 });
    nz(v, t + 0.02, 0.38, 0.45, { buf: 'c', rate: 1.5, type: 'highpass', f: 3500, a: 0.02 }); tone(v, t + 0.015, 205, 0.06, 0.07, { to: 150 });
  };
  CUE.fish = function (v, t) {
    var at = [0.12, 0.22, 0.35, 0.52, 0.74], i;
    nz(v, t, 0.75, 0.045, { type: 'highpass', f: 3000, lp: 8000, a: 0.04 }); nz(v, t, 0.7, 0.36, { buf: 'c', rate: 1.1, f: 3000, q: 0.8, a: 0.04 });
    for (i = 0; i < 5; i++) drip(v, t + at[i] + rr(0, 0.02), 0.05 - i * 0.007, rr(900, 1300));
  };
  CUE.rack = function (v, t) {
    modal(v, t, 1310, [1, 1.56, 2.38, 3.29], [1, 0.7, 0.5, 0.3], [0.14, 0.11, 0.08, 0.05], 0.042); modal(v, t + 0.05, 1420, [1, 1.56, 2.38], [1, 0.6, 0.4], [0.07, 0.05, 0.04], 0.02);
    nz(v, t, 0.07, 0.4, { buf: 'c', rate: 2, f: 2500, q: 1, a: 0.003 });
  };
  CUE.crack = function (v, t) {
    wood(v, t, 1700, 0.15); nz(v, t, 0.015, 0.06, { type: 'highpass', f: 4000, a: 0.001 }); nz(v, t + 0.09, 0.08, 0.5, { buf: 'c', rate: 2.4, f: 3000, q: 1, a: 0.004 });
    tone(v, t + 0.19, 300, 0.08, 0.09, { to: 165, a: 0.006 }); nz(v, t + 0.19, 0.09, 0.03, { buf: 'p', f: 600, q: 1.2, a: 0.008 });
  };
  CUE.pan_in = function (v, t) {
    nz(v, t, 0.85, 0.075, { f: 5200, q: 0.5, a: 0.02, hold: 0.14 }); nz(v, t, 0.75, 0.42, { buf: 'c', rate: 1.2, type: 'highpass', f: 2500, a: 0.02 });
    nz(v, t, 0.08, 0.1, { buf: 'p', type: 'lowpass', f: 500, a: 0.003 });
  };
  CUE.toss = function (v, t) {
    modal(v, t, 520, [1, 2.27, 3.6], [1, 0.6, 0.3], [0.14, 0.1, 0.06], 0.035); nz(v, t, 0.42, 0.5, { buf: 'c', rate: 2.6, f: 3800, q: 0.7, a: 0.1 });
    nz(v, t, 0.3, 0.03, { buf: 'p', f: 500, to: 950, q: 1, a: 0.1 }); nz(v, t + 0.3, 0.22, 0.065, { f: 2600, q: 0.6, a: 0.005 });
  };
  CUE.water = function (v, t) {
    var i;
    nz(v, t, 0.5, 0.065, { f: 1300, to: 2400, q: 1, a: 0.04, hold: 0.14 }); nz(v, t, 0.45, 0.05, { buf: 'p', type: 'lowpass', f: 380, a: 0.05 });
    nz(v, t + 0.05, 0.5, 0.022, { type: 'highpass', f: 4500, a: 0.06 });
    for (i = 0; i < 4; i++) drip(v, t + 0.06 + i * 0.09 + rr(0, 0.03), 0.05, rr(300, 520));
  };
  CUE.noodle = function (v, t) {
    var i, tt;
    for (i = 0; i < 3; i++) { tt = t + i * 0.085 + rr(0, 0.02); tone(v, tt, rr(230, 280), 0.07, 0.085, { to: 150 }); nz(v, tt, 0.07, 0.03, { buf: 'p', f: 700, q: 1, a: 0.004 }); }
    nz(v, t, 0.32, 0.035, { f: 950, to: 1500, q: 1, a: 0.06 });
  };
  CUE.basket = function (v, t) {
    var i;
    modal(v, t, 1900, [1, 1.47], [1, 0.6], [0.05, 0.04], 0.03); nz(v, t + 0.02, 0.85, 0.06, { f: 2300, to: 1200, q: 0.7, a: 0.03, hold: 0.18 });
    nz(v, t + 0.02, 0.5, 0.03, { buf: 'p', f: 520, q: 1, a: 0.03 });
    for (i = 0; i < 5; i++) drip(v, t + 0.38 + i * 0.11 + rr(0, 0.04), 0.045 - i * 0.006, rr(700, 1100));
  };
  CUE.cup = function (v, t) { wood(v, t, 400, 0.16); tone(v, t, 225, 0.05, 0.08, { to: 180 }); nz(v, t, 0.02, 0.02, { type: 'highpass', f: 2500, a: 0.001 }); };
  CUE.spill = function (v, t) {
    nz(v, t, 0.36, 0.1, { f: 950, to: 2600, q: 0.7, a: 0.01 }); nz(v, t, 0.26, 0.085, { buf: 'p', type: 'lowpass', f: 520, a: 0.005 }); nz(v, t + 0.12, 0.2, 0.05, { f: 1600, q: 0.8, a: 0.01 });
    drip(v, t + 0.3, 0.045, 620); drip(v, t + 0.41, 0.035, 760); drip(v, t + 0.56, 0.025, 700);
  };
  CUE.steam = function (v, t) { nz(v, t, 1.0, 0.038, { f: 5200, q: 0.4, a: 0.12, hold: 0.2, lin: true }); nz(v, t, 0.8, 0.012, { f: 950, q: 0.5, a: 0.2, lin: true }); };
  CUE.burnt = function (v, t) {
    nz(v, t, 0.6, 0.065, { f: 2400, q: 1.5, a: 0.01 }); nz(v, t, 0.5, 0.4, { buf: 'c', rate: 0.9, f: 1800, q: 1, a: 0.01 });
    tone(v, t + 0.18, 95, 0.2, 0.25, { to: 58, a: 0.003 }); nz(v, t + 0.18, 0.13, 0.1, { buf: 'p', type: 'lowpass', f: 260, a: 0.003 });
  };
  CUE.trash = function (v, t) {
    nz(v, t, 0.13, 0.11, { buf: 'p', type: 'lowpass', f: 600, a: 0.003 }); modal(v, t, 180, [1, 1.83], [1, 0.5], [0.15, 0.1], 0.1);
    nz(v, t + 0.02, 0.3, 0.4, { buf: 'c', rate: 2.6, f: 4200, q: 0.8, a: 0.02 });
  };
  // 反馈
  CUE.good = function (v, t) { I.marimba(v, t, mf(69), 1); };
  CUE.perfect = function (v, t) { I.marimba(v, t, mf(69), 0.9); I.marimba(v, t + 0.115, mf(74), 1); tone(v, t + 0.115, mf(86), 0.5, 0.028, { a: 0.006 }); };
  CUE.meh = function (v, t) { wood(v, t, 230, 0.2); tone(v, t, 175, 0.09, 0.1, { to: 150 }); };
  CUE.wrong = function (v, t) { for (var i = 0; i < 2; i++) { tone(v, t + i * 0.13, 150, 0.09, 0.19, { to: 118, a: 0.003 }); wood(v, t + i * 0.13, 270, 0.1 - i * 0.02); } };
  CUE.serve = function (v, t) {
    nz(v, t, 0.3, 0.05, { buf: 'p', f: 520, to: 820, q: 1, a: 0.05, tt: 0.25 }); nz(v, t, 0.28, 0.012, { f: 2300, q: 1, a: 0.05 });
    modal(v, t + 0.27, 1400, [1, 2.32], [1, 0.4], [0.1, 0.06], 0.035); tone(v, t + 0.27, 150, 0.07, 0.1, { to: 110 });
  };
  CUE.heart = function (v, t) { tone(v, t, mf(86), 0.55, 0.055, { a: 0.012 }); tone(v, t + 0.06, mf(93), 0.5, 0.045, { a: 0.012 }); tone(v, t, mf(74), 0.4, 0.03, { a: 0.02 }); };
  CUE.leave = function (v, t) { brass(v, t, 990, 0.055, 1.3, 0.985); brass(v, t + 0.42, 990, 0.014, 0.9, 0.985); };
  CUE.soldout = function (v, t) {
    nz(v, t, 0.32, 0.55, { buf: 'c', rate: 3.6, f: 3000, to: 3900, q: 2, a: 0.008, hold: 0.2 }); nz(v, t, 0.3, 0.028, { f: 4500, q: 3, a: 0.01, hold: 0.18 }); wood(v, t + 0.31, 1500, 0.06);
  };
  CUE.unlock = function (v, t) {
    var ms = [74, 76, 81, 86], at = [0, 0.11, 0.22, 0.36], i;
    for (i = 0; i < 4; i++) I.glock(v, t + at[i], mf(ms[i]), 0.75 + i * 0.05);
    I.kalimba(v, t + 0.36, mf(74), 0.55);
  };
  CUE.memento = function (v, t) {
    nz(v, t, 0.014, 0.11, { type: 'highpass', f: 2500, a: 0.001 }); wood(v, t, 900, 0.12); wood(v, t + 0.07, 640, 0.09); nz(v, t + 0.07, 0.03, 0.035, { f: 1800, q: 1 });
    tone(v, t + 0.17, mf(93), 0.5, 0.05, { a: 0.006 }); tone(v, t + 0.23, mf(98), 0.6, 0.042, { a: 0.006 });
  };
  CUE.note = function (v, t) {
    nz(v, t, 0.1, 0.035, { f: 2100, q: 1.2, a: 0.012 }); nz(v, t, 0.1, 0.3, { buf: 'c', rate: 3, f: 2400, q: 1.5, a: 0.01 });
    nz(v, t + 0.12, 0.13, 0.038, { f: 2500, to: 1900, q: 1.2, a: 0.015 }); nz(v, t + 0.12, 0.13, 0.3, { buf: 'c', rate: 3.4, f: 2600, q: 1.5, a: 0.012 });
  };
  // 街面与店面
  function shutter(v, t, up) {
    var dur = up ? 1.3 : 1.15, n = up ? 12 : 11, i, tt = t + 0.04, times = [], amps = [], te = t + dur;
    for (i = 0; i < n && tt < te - 0.08; i++) { times.push(tt); amps.push(rr(0.6, 1)); tt += (up ? 0.135 - i * 0.005 : 0.14 - i * 0.007) * rr(0.92, 1.1); }
    nz(v, t, dur + 0.1, 0.12, { buf: 'p', type: 'lowpass', f: up ? 150 : 230, to: up ? 240 : 120, a: 0.12, hold: dur - 0.4 });   // 分量
    tone(v, t, up ? 52 : 70, dur, 0.11, { to: up ? 70 : 44, a: 0.1, hold: dur - 0.35 });
    train(v, times, amps, 0.07, 0.06, [640, 1130, 1810], 14, up ? 1.45 : 0.68, dur);                                        // 铁片
    nz(v, t, dur, 0.34, { buf: 'c', rate: up ? 1.1 : 1.3, f: up ? 1500 : 2400, to: up ? 2600 : 1300, q: 1.2, a: 0.08, hold: dur - 0.3 }); // 链条
    if (up) {
      tone(v, te, 112, 0.17, 0.28, { to: 70, a: 0.002 }); modal(v, te, 225, [1, 1.66, 2.7, 4.2], [1, 0.7, 0.4, 0.2], [0.2, 0.16, 0.1, 0.07], 0.065);
      nz(v, te, 0.05, 0.4, { buf: 'c', rate: 2.5, f: 1700, q: 1.4, a: 0.002 });
    } else {
      tone(v, te, 82, 0.28, 0.34, { to: 44, a: 0.002 }); nz(v, te, 0.2, 0.15, { buf: 'p', type: 'lowpass', f: 210, a: 0.003 });
      modal(v, te, 190, [1, 1.66, 2.7], [1, 0.6, 0.3], [0.22, 0.16, 0.1], 0.06); nz(v, te + 0.02, 0.12, 0.4, { buf: 'c', rate: 2.2, f: 1500, q: 1.4, a: 0.004 });
    }
  }
  CUE.shutter_up = function (v, t) { shutter(v, t, true); };
  CUE.shutter_down = function (v, t) { shutter(v, t, false); };
  CUE.shutter_tick = function (v, t) { var k = rr(0.92, 1.08); train(v, [t], [1], 0.07, 0.055, [660 * k, 1180 * k, 1850 * k], 14, 1, 0.08); tone(v, t, 92, 0.06, 0.07, { to: 70 }); };
  CUE.horn = function (v, t) {
    var lp = flt(v, 'lowpass', 1500, 0.7), at = [0, 0.27], len = [0.2, 0.36], i;
    lp.connect(v.out);
    for (i = 0; i < 2; i++) {
      tone(v, t + at[i], 392, len[i], 0.06, { type: 'sawtooth', a: 0.025, hold: len[i] - 0.1, dest: lp });
      tone(v, t + at[i], 494, len[i], 0.05, { type: 'sawtooth', a: 0.025, hold: len[i] - 0.1, dest: lp });
    }
  };
  CUE.bus = function (v, t) {
    var lp = flt(v, 'lowpass', 330, 0.8), d = 2.6, tp = t + 1.15, fs = [58, 87, 116.5], am = [0.16, 0.1, 0.05], i, o;
    lp.connect(v.out);
    for (i = 0; i < 3; i++) {
      o = tone(v, t, fs[i] * 1.05, d, am[i], { type: i === 0 ? 'sawtooth' : 'triangle', a: 1.0, hold: 0.25, lin: true, dest: lp });
      if (o) { o.frequency.setValueAtTime(fs[i] * 1.05 * v.p, tp - 0.25); o.frequency.exponentialRampToValueAtTime(fs[i] * 0.94 * v.p, tp + 0.35); } // 多普勒
    }
    nz(v, t, d, 0.055, { buf: 'p', f: 300, to: 650, q: 0.8, a: 1.1, tt: 1.15, hold: 0.2, lin: true }); nz(v, t, d, 0.014, { f: 1600, q: 0.6, a: 1.1, hold: 0.2, lin: true });
    nz(v, t + 2.25, 0.3, 0.02, { type: 'highpass', f: 3200, a: 0.02 });
    if (v.pan) { try { v.pan.pan.setValueAtTime(-0.65, t); v.pan.pan.linearRampToValueAtTime(0.65, t + d); } catch (e) {} }
  };
  CUE.bike = function (v, t) {
    var i, j, tt;
    for (j = 0; j < 2; j++) for (i = 0; i < 4; i++) {
      tt = t + j * 0.42 + i * 0.055;
      modal(v, tt, 2090, [1, 2.42], [1, 0.35], i === 3 ? [0.6, 0.3] : [0.25, 0.15], 0.032 * (i % 2 ? 0.7 : 1), { a: 0.002 });
    }
  };
  CUE.sparrow = function (v, t) {
    var n = Math.random() < 0.5 ? 2 : 3, i, tt = t, f, o;
    for (i = 0; i < n; i++) {
      f = rr(3500, 4500); o = tone(v, tt, f, 0.075, 0.045, { a: 0.008 });
      if (o) { o.frequency.linearRampToValueAtTime(f * 1.35 * v.p, tt + 0.025); o.frequency.linearRampToValueAtTime(f * 0.85 * v.p, tt + 0.07); }
      tt += rr(0.09, 0.16);
    }
  };
  CUE.rooster = function (v, t) { // 远处一声，可选
    var pre = gn(v, 1), b1 = flt(v, 'bandpass', 1250, 2.5), b2 = flt(v, 'bandpass', 2600, 3), g2 = gn(v, 0.5), syl = [[0, 0.14, 520, 700], [0.2, 0.14, 600, 760], [0.4, 0.2, 700, 860], [0.65, 0.75, 880, 520]], i, s;
    pre.connect(b1); pre.connect(b2); b1.connect(v.out); b2.connect(g2); g2.connect(v.out);
    for (i = 0; i < 4; i++) { s = syl[i]; tone(v, t + s[0], s[2], s[1], 0.07, { type: 'sawtooth', a: 0.03, hold: s[1] * 0.5, to: s[3], dest: pre }); }
  };
  CUE.thunder = function (v, t) {
    nz(v, t, 3.4, 0.13, { buf: 'p', type: 'lowpass', f: 95, to: 60, a: 0.3, hold: 0.5, lin: true }); nz(v, t + 0.15, 2.4, 0.08, { buf: 'p', type: 'lowpass', f: 220, to: 80, a: 0.2, tt: 1.5, lin: true });
    nz(v, t + 0.9, 2.0, 0.065, { buf: 'p', type: 'lowpass', f: 150, to: 70, a: 0.35, lin: true });
  };
  CUE['switch'] = function (v, t) { nz(v, t, 0.01, 0.09, { type: 'highpass', f: 2000, a: 0.001 }); wood(v, t, 1300, 0.12); wood(v, t + 0.035, 1000, 0.06); };
  CUE.lamp = function (v, t) {
    var at = [0, 0.12, 0.29], i;
    for (i = 0; i < 3; i++) { modal(v, t + at[i], 3100, [1, 1.52], [1, 0.5], [0.04, 0.03], 0.03); tone(v, t + at[i], 100, 0.06, 0.04, { type: 'triangle', a: 0.004, hold: 0.03 }); }
    tone(v, t + 0.42, 100, 1.0, 0.03, { type: 'triangle', a: 0.05, hold: 0.3, lin: true }); tone(v, t + 0.42, 200, 0.9, 0.012, { a: 0.05, hold: 0.25, lin: true });
    nz(v, t + 0.42, 0.7, 0.006, { f: 6200, q: 6, a: 0.05, hold: 0.2 });
  };
  CUE.power_out = function (v, t) {
    var lp = flt(v, 'lowpass', 600, 0.7); lp.connect(v.out);
    tone(v, t, 118, 1.2, 0.13, { type: 'triangle', to: 36, tt: 1.1, a: 0.01, lin: true, dest: lp }); tone(v, t, 236, 1.0, 0.045, { to: 60, tt: 0.95, a: 0.01, lin: true });
    wood(v, t, 420, 0.13); tone(v, t, 140, 0.07, 0.15, { to: 88 }); nz(v, t, 1.05, 0.035, { buf: 'p', f: 800, to: 120, q: 1, a: 0.02, tt: 1.0, lin: true });
  };
  CUE.candle = function (v, t) {
    nz(v, t, 0.11, 0.6, { buf: 'c', rate: 3.2, f: 3600, q: 1.2, a: 0.005 }); nz(v, t, 0.1, 0.035, { f: 4200, q: 1.5, a: 0.005 });
    nz(v, t + 0.09, 0.55, 0.055, { f: 1500, to: 700, q: 0.8, a: 0.04 }); nz(v, t + 0.12, 0.5, 0.2, { buf: 'c', rate: 0.8, type: 'highpass', f: 3000, a: 0.05 });
  };
  CUE.clock = function (v, t) { wood(v, t, 2300, 0.055); tone(v, t, 620, 0.03, 0.03); };
  CUE.day_end = function (v, t) {
    var ms = [78, 76, 74], i;
    for (i = 0; i < 3; i++) { I.marimba(v, t + i * 0.6, mf(ms[i]), 0.8); I.glock(v, t + i * 0.6, mf(ms[i] + 12), 0.3); }
    I.pluck(v, t + 1.2, mf(50), 0.6, 1.4);
  };
  // 环境里自己冒出来的小声音（不对外）
  function chopTick(v, t) { wood(v, t, rr(1700, 2600), 0.07); if (Math.random() < 0.4) wood(v, t + rr(0.05, 0.11), rr(1700, 2600), 0.045); }
  function rainDrop(v, t) { var f = rr(320, 620); tone(v, t, f, 0.05, 0.09, { to: f * 0.7, a: 0.0015 }); nz(v, t, 0.03, 0.04, { f: rr(1800, 3200), q: 1.5, a: 0.001 }); }
  function carPass(v, t) {
    nz(v, t, 3.2, 0.032, { buf: 'p', f: 260, to: 420, q: 0.7, a: 1.4, tt: 1.5, hold: 0.2, lin: true }); nz(v, t, 3.0, 0.007, { f: 1300, q: 0.5, a: 1.4, hold: 0.2, lin: true });
    if (v.pan) { try { var d = Math.random() < 0.5 ? -1 : 1; v.pan.pan.setValueAtTime(-0.7 * d, t); v.pan.pan.linearRampToValueAtTime(0.7 * d, t + 3.2); } catch (e) {} }
  }
  function cricket(v, t) { for (var i = 0; i < 3; i++) tone(v, t + i * 0.055, 4300, 0.04, 0.02, { a: 0.008 }); }
  function blup(v, t) { var f = rr(95, 165); tone(v, t, f, 0.12, 0.15, { to: f * 1.9, tt: 0.07, a: 0.02 }); nz(v, t + 0.06, 0.05, 0.018, { buf: 'p', f: 700, q: 1.5, a: 0.004 }); }
  function spit(v, t) { nz(v, t, rr(0.035, 0.08), 0.07, { f: rr(2600, 4400), q: 2, a: 0.002 }); if (Math.random() < 0.4) tone(v, t, rr(900, 1500), 0.02, 0.035, { a: 0.001 }); }

  var ALIAS = { knob: 'tap', bubble: 'ladle', sizzle: 'drop_oil', drop: 'bowl', pickup: 'tap', ok: 'good', rushed: 'meh', tear: 'page', open: 'ui_open', risk: 'wrong', pour: 'cup', shutter: 'shutter_up' };
  var WANT_PAN = { bus: 1 };
  // 响度校平（离线渲染实测后定）：大件收一点，细小的提一点
  var TRIM = { shutter_up: 0.63, shutter_down: 0.63, thunder: 0.5, unlock: 0.63, perfect: 0.67, day_end: 0.7, good: 0.7, burnt: 0.8, stamp: 0.8,
    bike: 2.5, sparrow: 2, rooster: 1.4, heart: 2, rack: 2, spoon: 1.6, fish: 1.6, chalk: 1.6, soldout: 1.6, leave: 1.6, bell: 1.8, steam: 1.4, clock: 1.6, lamp: 1.4,
    coin: 1.4, coins: 1.25, rice: 1.4, toss: 1.4, page: 1.25, ui_open: 1.25, note: 1.4, till: 1.25, lid: 1.4, horn: 1.6, serve: 1.25, stir: 1.25, candle: 1.25, noodle: 1.25, crack: 1.25 };

  // ---------- 连续图层（灶台循环 + 环境床） ----------
  function Layer(dest, tau, tauDown, shape, build) {
    this.dest = dest; this.tau = tau; this.tauDown = tauDown || tau; this.shape = shape || 1; this.build = build;
    this.target = 0; this.cur = 0; this.app = -1; this.x = 0; this.appx = -1; this.on = false; this.dead = false; this.idle = 0;
    this.nodes = []; this.srcs = []; this.out = null; this.tune = null;
  }
  Layer.prototype.mk = function (n) { this.nodes.push(n); live++; return n; };
  Layer.prototype.src = function (kind, rate) {
    var s = this.mk(ctx.createBufferSource()); s.buffer = bufs[kind]; s.loop = true; if (rate) s.playbackRate.value = rate;
    s.start(ctx.currentTime, Math.random() * ((bufs[kind] && bufs[kind].duration) || 1)); this.srcs.push(s); return s;
  };
  Layer.prototype.filt = function (type, f, q) { var n = this.mk(ctx.createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q || 0.7; return n; };
  Layer.prototype.g = function (v) { var g = this.mk(ctx.createGain()); g.gain.value = v; return g; };
  Layer.prototype.osc = function (type, f) { var o = this.mk(ctx.createOscillator()); o.type = type; o.frequency.value = f; o.start(ctx.currentTime); this.srcs.push(o); return o; };
  Layer.prototype.lfo = function (f, depth, param) { try { var o = this.osc('sine', f), g = this.g(depth); o.connect(g); g.connect(param); } catch (e) {} };
  // 噪声 → 滤波 → 增益 → 图层输出；level 为目标有效值
  Layer.prototype.band = function (src, kind, type, f, q, level) {
    var b = this.filt(type, f, q), g = this.g(gl(kind, type, f, q, level)); src.connect(b); b.connect(g); g.connect(this.out); return { f: b, g: g, v: g.gain.value };
  };
  Layer.prototype.open = function () {
    try { this.out = this.g(0); this.out.connect(bus[this.dest]); this.tune = null; this.build(this); this.on = true; this.app = -1; this.appx = -1; this.idle = 0; }
    catch (e) { this.close(); this.dead = true; }
  };
  Layer.prototype.close = function () {
    var i;
    for (i = 0; i < this.srcs.length; i++) { try { this.srcs[i].stop(); } catch (e) {} }
    for (i = 0; i < this.nodes.length; i++) { try { this.nodes[i].disconnect(); } catch (e2) {} }
    live -= this.nodes.length; this.nodes = []; this.srcs = []; this.out = null; this.tune = null; this.on = false;
  };
  Layer.prototype.step = function (dt, now) {
    if (!this.on) { if (this.target > 0.002 && !this.dead) this.open(); if (!this.on) { this.cur = 0; return; } }
    this.cur += (this.target - this.cur) * (1 - Math.exp(-dt / (this.target < this.cur ? this.tauDown : this.tau)));
    if (Math.abs(this.cur - this.target) < 0.002) this.cur = this.target;
    if (Math.abs(this.cur - this.app) > 0.004 || (this.cur === this.target && this.app !== this.cur)) {
      setT(this.out.gain, Math.pow(this.cur, this.shape), 0.03, now); this.app = this.cur;
      if (this.tune) this.tune(this.cur, this.x, now); this.appx = this.x;
    } else if (this.tune && Math.abs(this.x - this.appx) > 0.004) { this.tune(this.cur, this.x, now); this.appx = this.x; }
    if (this.target <= 0.002 && this.cur <= 0.002) { this.idle += dt; if (this.idle > 0.6) this.close(); } else this.idle = 0;
  };

  var loops = {
    // 豆浆入杯：杯腔共鸣随 fill 升高
    pour: new Layer('loop', 0.12, 0, 0.8, function (L) {
      var s = L.src('w'), p = L.src('p'), a = L.band(s, 'w', 'bandpass', 520, 2.2, 0.023), b = L.band(s, 'w', 'bandpass', 1220, 2.5, 0.01);
      var c = L.band(p, 'p', 'lowpass', 320, 0.7, 0.014); L.band(s, 'w', 'highpass', 4200, 0.7, 0.005);
      L.lfo(11.3, a.v * 0.35, a.g.gain); L.lfo(17.9, b.v * 0.4, b.g.gain); L.lfo(6.1, c.v * 0.45, c.g.gain);
      L.tune = function (lv, fill, now) { var f = 520 * Math.pow(3, fill); setT(a.f.frequency, f, 0.06, now); setT(b.f.frequency, f * 2.35, 0.06, now); };
    }),
    // 石磨：一圈一圈的低沉滚动 + 豆子被碾碎的砂粒
    grind: new Layer('loop', 0.12, 0, 1, function (L) {
      var p = L.src('p'), c = L.src('c', 1.3), a = L.band(p, 'p', 'lowpass', 240, 0.7, 0.032), b = L.band(p, 'p', 'bandpass', 700, 0.9, 0.013);
      var d = L.filt('bandpass', 1900, 1), g = L.g(0.18); c.connect(d); d.connect(g); g.connect(L.out);
      L.lfo(0.9, a.v * 0.45, a.g.gain); L.lfo(1.8, b.v * 0.4, b.g.gain); L.lfo(0.9, 0.1, g.gain);
    }),
    // 油锅：嘶声床 + 爆点 + 油底冒泡；level 越高爆点越密
    sizzle: new Layer('loop', 0.12, 0, 0.4, function (L) {
      var s = L.src('w'), c = L.src('c', 1.25), p = L.src('p'), hp = L.filt('highpass', 2600, 0.7), lp = L.filt('lowpass', 7800, 0.5);
      var g = L.g(0.027 / (rms.w * Math.sqrt(5200 / nyq))), bp = L.filt('bandpass', 3900, 0.7), g2 = L.g(0.42), b = L.band(p, 'p', 'bandpass', 380, 1.1, 0.013);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(L.out); c.connect(bp); bp.connect(g2); g2.connect(L.out);
      L.lfo(21, b.v * 0.55, b.g.gain);
      L.tune = function (lv, x, now) { setT(c.playbackRate, 0.85 + 0.75 * lv, 0.1, now); };
    }),
    // 铁板：更平、更干
    griddle: new Layer('loop', 0.12, 0, 0.8, function (L) {
      var s = L.src('w'), c = L.src('c', 0.7), bp = L.filt('bandpass', 4300, 0.55), hp = L.filt('highpass', 1900, 0.7), g = L.g(gl('w', 'bandpass', 4300, 0.55, 0.034));
      var b2 = L.filt('bandpass', 2600, 1), g2 = L.g(0.21);
      s.connect(bp); bp.connect(hp); hp.connect(g); g.connect(L.out); c.connect(b2); b2.connect(g2); g2.connect(L.out);
    }),
    // 滚水
    boil: new Layer('loop', 0.12, 0, 0.9, function (L) {
      var p = L.src('p'), s = L.src('w'), c = L.src('c', 0.32), a = L.band(p, 'p', 'bandpass', 250, 0.9, 0.034), b = L.band(s, 'w', 'bandpass', 1400, 0.8, 0.011);
      var lp = L.filt('lowpass', 900, 0.7), g = L.g(0.5); c.connect(lp); lp.connect(g); g.connect(L.out);
      L.lfo(5.3, a.v * 0.38, a.g.gain); L.lfo(8.9, a.v * 0.28, a.g.gain); L.lfo(13.1, b.v * 0.5, b.g.gain);
      L.tune = function (lv, x, now) { setT(c.playbackRate, 0.24 + 0.2 * lv, 0.1, now); };
    }),
    // 稠粥：几乎无声的底 + update 里稀疏的"噗"
    simmer: new Layer('loop', 0.12, 0, 1, function (L) { L.band(L.src('p'), 'p', 'lowpass', 200, 0.7, 0.012); }),
    // 老油冒烟：更硬的爆裂，叠在 sizzle 上
    smoke: new Layer('loop', 0.12, 0, 0.9, function (L) {
      var c = L.src('c', 1.9), s = L.src('w'), hp = L.filt('highpass', 2800, 0.7), bp = L.filt('bandpass', 5000, 1.1), g = L.g(0.65);
      c.connect(hp); hp.connect(bp); bp.connect(g); g.connect(L.out); L.band(s, 'w', 'bandpass', 1600, 0.5, 0.019);
    })
  };
  var beds = {
    hum: new Layer('amb', 0.7, 0, 1, function (L) { // 远处车流
      var p = L.src('p'), a = L.band(p, 'p', 'lowpass', 180, 0.7, 0.045); L.band(p, 'p', 'bandpass', 320, 0.8, 0.018); L.lfo(0.07, a.v * 0.3, a.g.gain);
    }),
    air: new Layer('amb', 0.7, 0, 1, function (L) { var a = L.band(L.src('p', 0.8), 'p', 'bandpass', 800, 0.35, 0.011); L.lfo(0.11, a.v * 0.4, a.g.gain); }),
    room: new Layer('amb', 0.7, 0, 1, function (L) { // 屋里的底噪 + 冰柜 100Hz
      var g = L.g(0.006), g2 = L.g(0.002);
      L.band(L.src('p'), 'p', 'lowpass', 300, 0.7, 0.013); L.osc('sine', 100).connect(g); g.connect(L.out); L.osc('sine', 200).connect(g2); g2.connect(L.out);
    }),
    rain: new Layer('amb', 0.6, 0, 0.8, function (L) { // 塑料雨棚：中高频噼啪 + 低频哗 + update 里的大雨点
      var c1 = L.src('c', 1.5), c2 = L.src('c', 0.8), s = L.src('w'), p = L.src('p'), b1 = L.filt('bandpass', 2700, 0.9), g1 = L.g(0.36), b2 = L.filt('bandpass', 950, 1.3), g2 = L.g(0.3);
      c1.connect(b1); b1.connect(g1); g1.connect(L.out); c2.connect(b2); b2.connect(g2); g2.connect(L.out);
      var sp = L.band(s, 'w', 'bandpass', 4600, 0.5, 0.017); L.band(p, 'p', 'lowpass', 450, 0.7, 0.028); L.lfo(0.13, sp.v * 0.25, sp.g.gain);
      L.tune = function (lv, x, now) { setT(c1.playbackRate, 0.9 + 0.8 * lv, 0.2, now); setT(c2.playbackRate, 0.5 + 0.5 * lv, 0.2, now); };
    }),
    crowd: new Layer('amb', 0.8, 0.22, 1.1, function (L) { // 人声嗡嗡：几条共振峰慢慢晃 + 音节起伏
      var p = L.src('p'), lp = L.filt('lowpass', 3200, 0.5), mid = L.g(1), F = [[260, 1.2, 0.011, 2.3, 0.19], [520, 1.6, 0.015, 3.1, 0.23], [1150, 2, 0.012, 4.3, 0.37], [1900, 2.4, 0.006, 5.2, 0.29]], i, f, b, g;
      mid.connect(lp); lp.connect(L.out);
      for (i = 0; i < F.length; i++) {
        f = F[i]; b = L.filt('bandpass', f[0], f[1]); g = L.g(gl('p', 'bandpass', f[0], f[1], f[2])); p.connect(b); b.connect(g); g.connect(mid);
        L.lfo(f[3], g.gain.value * 0.42, g.gain); L.lfo(f[3] * 0.37, g.gain.value * 0.25, g.gain); L.lfo(f[4], f[0] * 0.2, b.frequency);
      }
    })
  };
  var PLACE = {
    street: { hum: 1, air: 0.9, room: 0, birds: 0.55, bike: 1, cars: 1, crowd: 0.4, rain: 1, night: 0 },
    shop: { hum: 0.4, air: 0.25, room: 1, birds: 0.7, bike: 0.35, cars: 0.45, crowd: 1, rain: 0.85, night: 0 },
    night: { hum: 0.1, air: 0, room: 0.3, birds: 0, bike: 0, cars: 0.06, crowd: 0, rain: 0.55, night: 1 },
    title: { hum: 0.4, air: 0.4, room: 0.25, birds: 0.35, bike: 0.2, cars: 0.25, crowd: 0.4, rain: 0.8, night: 0 }
  }, NOPLACE = { hum: 0, air: 0, room: 0, birds: 0, bike: 0, cars: 0, crowd: 0.6, rain: 0.8, night: 0 };
  var tg = { birds: 0, bike: 0, cars: 0, night: 0 }, sm = { birds: 0, bike: 0, cars: 0, night: 0 };
  var ev = { bird: 3, bike: 8, car: 5, tick: 1, cricket: 2, chop: 1, drop: 0.5, blup: 0.5, spit: 0.3, alt: 0 };
  function targets() {
    var pl = has(PLACE, scene.place) ? PLACE[scene.place] : NOPLACE, d = scene.dawn, r = scene.rain;
    beds.hum.target = pl.hum * (0.6 + 0.4 * d); beds.air.target = pl.air; beds.room.target = pl.room;
    beds.rain.target = r * pl.rain; beds.crowd.target = scene.crowd * pl.crowd;
    tg.birds = (scene.place === 'shop' ? pl.birds * (1 - d) : pl.birds * (0.6 + 0.4 * d)) * (1 - 0.8 * r); // 店里：天亮了鸟声退掉；下雨鸟躲起来
    tg.bike = pl.bike * (1 - 0.7 * r); tg.cars = pl.cars * (0.5 + 0.5 * d); tg.night = pl.night;
  }
  function amb(fn, vol, pitch, pan) { spawn('amb', bus.amb, fn, vol, pitch, pan); }
  function events(dt) {
    var k = 1 - Math.exp(-dt / 0.6), key, c, r;
    for (key in tg) sm[key] += (tg[key] - sm[key]) * k;
    if (sm.birds > 0.04) { if ((ev.bird -= dt) <= 0) { ev.bird = rr(2.5, 8) / (0.3 + sm.birds); amb(CUE.sparrow, 0.3 + 0.9 * sm.birds, rr(0.9, 1.15), rr(-0.8, 0.8)); } } else ev.bird = rr(1, 4);
    if (sm.bike > 0.05) { if ((ev.bike -= dt) <= 0) { ev.bike = rr(14, 34) / (0.4 + sm.bike); amb(CUE.bike, 0.25 + 0.6 * sm.bike, rr(0.95, 1.08), rr(-0.7, 0.7)); } } else ev.bike = rr(5, 12);
    if (sm.cars > 0.04) { if ((ev.car -= dt) <= 0) { ev.car = rr(9, 22) / (0.4 + sm.cars); amb(carPass, 0.5 + 0.5 * sm.cars, rr(0.85, 1.2), 0.01); } } else ev.car = rr(3, 9);
    if (sm.night > 0.3) {
      if ((ev.tick -= dt) <= 0) { ev.tick = ev.tick < -1 ? 1 : ev.tick + 1; ev.alt = 1 - ev.alt; amb(CUE.clock, 0.9 * sm.night, ev.alt ? 1 : 0.88, 0.3); }
      if ((ev.cricket -= dt) <= 0) { ev.cricket = rr(1.4, 4.5); amb(cricket, 1.2 * sm.night, 1, -0.5); }
    }
    c = beds.crowd.cur;
    if (c > 0.05 && (ev.chop -= dt) <= 0) { ev.chop = rr(0.5, 2.2) / (0.3 + c); r = Math.random(); amb(r < 0.55 ? chopTick : r < 0.8 ? CUE.spoon : CUE.bowl, rr(0.4, 0.8) * (0.4 + 0.6 * c), rr(0.9, 1.2), rr(-0.7, 0.7)); }
    c = beds.rain.cur;
    if (c > 0.05 && (ev.drop -= dt) <= 0) { ev.drop = rr(0.15, 0.7) / (0.25 + c); amb(rainDrop, rr(0.3, 0.7) * (0.4 + 0.6 * c), 1, rr(-0.6, 0.6)); }
    c = loops.simmer.cur;
    if (c > 0.03 && (ev.blup -= dt) <= 0) { ev.blup = rr(0.25, 1.15) / (0.35 + 0.65 * c); spawn('lp', bus.loop, blup, 0.5 + 0.5 * c, 1, rr(-0.2, 0.2)); }
    c = loops.smoke.cur;
    if (c > 0.03 && (ev.spit -= dt) <= 0) { ev.spit = rr(0.08, 0.42) / (0.3 + 0.7 * c); spawn('lp', bus.loop, spit, rr(0.5, 1) * c, 1, 0); }
  }

  // ---------- 生成式音乐：五声、动机重复、一问一答 ----------
  var GONG = [0, 2, 4, 7, 9], YU = [0, 3, 5, 7, 10], ZHI = [0, 2, 5, 7, 9];
  var SPARSE = [[[0, 4], [4, 4]], [[0, 2], [2, 6]], [[0, 3], [3, 1], [4, 4]], [[2, 2], [4, 4]], [[0, 6], [6, 2]]];
  var MID = [[[0, 2], [2, 2], [4, 4]], [[0, 3], [3, 1], [4, 2], [6, 2]], [[0, 2], [2, 1], [3, 1], [4, 4]], [[0, 4], [4, 2], [6, 2]]];
  var BUSY = [[[0, 2], [2, 1], [3, 1], [4, 4]], [[0, 1], [1, 1], [2, 2], [4, 2], [6, 2]], [[0, 3], [3, 1], [4, 2], [6, 2]], [[1, 1], [2, 2], [4, 1], [5, 3]], [[0, 2], [3, 1], [4, 2], [6, 1], [7, 1]]];
  var HES = [[[0, 1], [3, 1], [4, 2], [6, 2]], [[0, 2], [3, 1], [5, 3]], [[1, 1], [3, 1], [4, 4]]];
  var UP = [[0, 1, 2, 3], [0, 2, 3, 4], [0, 3, 4, 5]], DOWN = [[5, 4, 3, 2], [3, 2, 1, 0], [5, 3, 2, 1]];
  // 主题（"开门"）：[八分音位, 时值, 音级]，D 宫；结尾 商→羽→宫 落定
  var LEIT = [[0, 2, 2], [2, 1, 3], [3, 1, 4], [4, 2, 3], [6, 2, 2], [8, 2, 4], [10, 1, 5], [11, 1, 4], [12, 2, 3], [14, 2, 2], [16, 2, 1], [18, 2, -1], [20, 8, 0]];
  var LEIT_BASS = [[0, 0], [8, -1], [16, 1], [20, 0]];
  var LEIT_BAR = [{ s: 0, l: 2, d: 2 }, { s: 2, l: 1, d: 3 }, { s: 3, l: 1, d: 4 }, { s: 4, l: 2, d: 3 }, { s: 6, l: 2, d: 2 }];
  var M = {
    dawn: { bpm: 54, root: 74, sc: GONG, lead: 'glock', lo: 0, hi: 7, cells: SPARSE, dens: 0.8, vel: 0.5, form: ['A', '-', 'R', '-', '-'], bass: 0.35, hum: 0.02, lead_in: 0.8, leit: [{ s: 0, l: 2, d: 2 }, { s: 2, l: 2, d: 3 }, { s: 4, l: 4, d: 4 }] },
    open: { bpm: 92, once: true, gen: function () { return genLeit(false); } },
    rush: { bpm: 100, root: 74, sc: GONG, lead: 'kalimba', lo: -1, hi: 7, cells: BUSY, dens: 0.9, vel: 0.6, form: ['A', 'A2', 'B', 'C'], bass: 'walk', pulse: true, bright: true, hum: 0.01, leit: LEIT_BAR },
    lull: { bpm: 76, root: 74, sc: GONG, lead: 'kalimba', lo: -2, hi: 5, cells: MID, dens: 0.8, vel: 0.5, form: ['A', '-', 'R', '-'], bass: 'bar', hum: 0.014, leit: LEIT_BAR },
    close: { bpm: 66, root: 74, sc: GONG, lead: 'kalimba', lo: -1, hi: 8, cells: MID, dens: 0.85, vel: 0.46, form: ['A', 'B', 'C', '-', '-'], bass: 'bar', dir: -1, start: [5, 6, 7], hum: 0.016 },
    night: { bpm: 44, lead_in: 1.5, gen: genNight },
    story: { bpm: 60, root: 69, sc: ZHI, lead: 'kalimba', lo: -1, hi: 5, cells: HES, dens: 1, vel: 0.4, form: ['A', '-', 'R', '-', '-'], bass: 0.25, rep: true, hum: 0.03, lead_in: 0.6 },
    tense: { bpm: 58, root: 59, sc: YU, lead: 'kalimba', lo: 0, hi: 5, cells: SPARSE, dens: 0.9, vel: 0.44, form: ['A', '-', 'A2', '-', 'B', '-', '-'], bass: 'drone', lean: true, hum: 0.012, lead_in: 0.6 },
    ending: { bpm: 60, once: true, lead_in: 0.6, gen: function () { return genLeit(true); } }
  };
  var seq = { mood: null, ev: [], i: 0, t0: 0, sd: 0.3, len: 0, done: false, sections: 0, notes: 0 }, mem = { k: 0 }, seed = 20261029, humz = 0.01;
  function mr() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function pick(a) { return a[Math.floor(mr() * a.length)]; }
  function deg(root, sc, d) { var o = Math.floor(d / 5); return root + 12 * o + sc[d - 5 * o]; }
  function near(d, set, avoid) { var ks = [0, -1, 1, -2, 2, -3, 3], i, x; for (i = 0; i < 7; i++) { x = d + ks[i]; if (x !== avoid && set.indexOf(((x % 5) + 5) % 5) >= 0) return x; } return d; }
  function N(s, inst, m, v, l, pan) { return { s: s, inst: inst, m: m, v: v * (0.9 + mr() * 0.2), l: l, o: (mr() - 0.5) * 2 * humz, pan: pan || 0 }; }
  function motif(c) {
    var cell = pick(c.cells), d = pick(c.start || [0, 2, 3, 5]), out = [], i, r, st;
    for (i = 0; i < cell.length; i++) {
      if (i > 0) {
        if (c.rep && i === 1) st = 0; // 迟疑：同一个音再试一次
        else {
          r = mr(); st = r < 0.3 ? -1 : r < 0.6 ? 1 : r < 0.72 ? -2 : r < 0.84 ? 2 : r < 0.92 ? 0 : (mr() < 0.5 ? -3 : 3);
          if (c.dir && mr() < 0.65) st = -Math.abs(st) || -1;
          if (st === 0 && (c.rep || i === 1)) st = mr() < 0.5 ? -1 : 1; // 不让动机原地踏步
        }
        if (d + st > c.hi || d + st < c.lo) st = -st; // 碰到音区边界就折回去
        d = clamp(d + st, c.lo, c.hi);
      }
      if (i > 0 && i < cell.length - 1 && mr() > c.dens) continue; // 抽稀在生成动机时定下，重复时保持一致
      out.push({ s: cell[i][0], l: cell[i][1], d: d });
    }
    return out;
  }
  function bar(tok, mot, c, sh) {
    var out = [], i, n, last;
    if (tok === 'B' && c.lean) { i = (mem.k % 2) ? 1 : 8; return [{ s: 0, l: 3, m: c.root + i, v: 0.85 }, { s: 3, l: 5, m: c.root + i - 1, v: 0.7 }]; } // 小二度叹息
    for (i = 0; i < mot.length; i++) { n = mot[i]; if (tok === 'C' && i > 0 && n.s >= 4) break; out.push({ s: n.s, l: n.l, d: n.d + (tok === 'B' ? sh : 0) }); }
    last = out[out.length - 1];
    if (tok === 'A2') last.d = near(last.d, [0, 2, 3], last.d);      // 答句：落在稳定音
    else if (tok === 'B') last.d = near(last.d, [1, 4]);             // 问句：悬在商/羽
    else if (tok === 'C') out.push({ s: 4, l: 4, d: c.dir ? Math.floor((last.d - 1) / 5) * 5 : near(last.d, [0]), fin: true }); // 收束：回宫（打烊时往下落）
    return out;
  }
  function gen(name) {
    var c = M[name], out = [], form, b, tok, ns, i, n, m, resp, sh, br, w;
    humz = c.hum || 0.01;
    if (c.gen) return c.gen(c);
    br = c.root - 24;
    if (!mem.mot) mem.mot = (c.leit && mr() < 0.5) ? c.leit.slice() : motif(c);
    else if (mr() > 0.62) mem.mot = motif(c);
    else if (mr() < 0.3 && mem.mot.length > 2) { ns = mem.mot.slice(); i = 1 + Math.floor(mr() * (ns.length - 2)); ns[i] = { s: ns[i].s, l: ns[i].l, d: ns[i].d + (mr() < 0.5 ? -1 : 1) }; mem.mot = ns; }
    resp = ['B', 'A2', 'C'][mem.k % 3]; sh = c.dir ? -(1 + (mr() < 0.4 ? 1 : 0)) : pick([-2, -1, 1, 2]);
    form = c.form.slice(); if (c.pulse && mr() < 0.35) form.push('-');
    if (!mem.wu || mr() < 0.3) { mem.wu = pick(UP); mem.wd = pick(DOWN); }
    for (b = 0; b < form.length; b++) {
      tok = form[b] === 'R' ? resp : form[b];
      if (tok !== '-') {
        ns = bar(tok, mem.mot, c, sh);
        for (i = 0; i < ns.length; i++) {
          n = ns[i]; m = n.m !== undefined ? n.m : deg(c.root, c.sc, n.d);
          out.push(N(b * 8 + n.s, c.lead, m, c.vel * (n.v || 1) * (n.s % 4 === 0 ? 1.08 : 0.94), n.l));
          if (n.fin && c.bright) out.push(N(b * 8 + n.s, 'glock', m + 12, c.vel * 0.45, n.l));
        }
        if (c.bass === 'bar') out.push(N(b * 8, 'pluck', deg(br, c.sc, tok === 'B' ? 3 : 0), 0.5, 6));
        else if (c.bass === 'drone') { if (tok === 'A') out.push(N(b * 8, 'pluck', c.root - 12, 0.55, 8)); }
        else if (typeof c.bass === 'number' && tok === 'A' && mr() < c.bass) out.push(N(b * 8, 'pluck', br, 0.45, 8));
      }
      if (c.bass === 'walk') { w = b % 2 ? mem.wd : mem.wu; for (i = 0; i < 4; i++) out.push(N(b * 8 + i * 2, 'pluck', deg(br, c.sc, w[i]), i === 0 ? 0.5 : 0.4, 2)); } // 走动的低音
      if (c.pulse) for (i = 1; i < 8; i += 2) out.push(N(b * 8 + i, 'tick', deg(c.root, c.sc, b % 2 ? 3 : 5), 0.4, 1, 0.3));                                         // 稳定的后半拍
    }
    mem.k++;
    return { len: form.length * 8, ev: out };
  }
  function genLeit(slow) {
    var out = [], i, n, m, ch = [62, 69, 78];
    for (i = 0; i < LEIT.length; i++) {
      n = LEIT[i]; m = deg(74, GONG, n[2]);
      out.push(N(n[0], 'kalimba', m, 0.6, n[1]));
      if (slow || n[0] % 8 === 0 || n[0] === 20) out.push(N(n[0], 'glock', m + 12, slow ? 0.3 : 0.36, n[1]));
    }
    for (i = 0; i < LEIT_BASS.length; i++) out.push(N(LEIT_BASS[i][0], 'pluck', deg(50, GONG, LEIT_BASS[i][1]), 0.5, 6));
    if (slow) for (i = 0; i < 3; i++) out.push(N(20, 'pad', ch[i], i === 0 ? 0.6 : 0.4, 12)); // 最后一个音托住
    return { len: slow ? 44 : 30, ev: out };
  }
  function genNight() {
    var d, out;
    if (!mem.cyc) { mem.cyc = pick([[0, 3, 2, 0], [0, 2, 3, 0], [3, 2, 1, 0]]); mem.i = 0; }
    d = mem.cyc[mem.i++ % 4]; out = [N(0, 'low', deg(59, YU, d), 0.5, 7)];
    if (mr() < 0.55) out.push(N(3 + Math.floor(mr() * 3), 'low', deg(59, YU, Math.min(d + pick([2, 3]), 4)), 0.3, 5)); // 偶尔有个回声似的答音
    return { len: 12 + 4 * Math.floor(mr() * 3), ev: out }; // 8~14 秒一句，其余是空白
  }
  function section() {
    var s = gen(seq.mood);
    s.ev.sort(function (a, b) { return (a.s - b.s) || (a.o - b.o); });
    seq.ev = s.ev; seq.len = s.len; seq.i = 0; seq.sections++;
  }
  function note(e, t) {
    seq.notes++;
    spawn('mus', bus.mus, function (v) { I[e.inst](v, t, mf(e.m), e.v, e.l * seq.sd); }, 1, 1, e.pan);
  }
  function sequencer(now) {
    var hz = now + 0.22, guard = 0, e, te, end;
    if (seq.mood !== scene.music) {
      seq.mood = scene.music; seq.done = false; seq.ev = []; seq.i = 0; seq.len = 0; mem = { k: 0 };
      if (seq.mood) { seq.sd = 30 / M[seq.mood].bpm; seq.t0 = now + (M[seq.mood].lead_in || 0.3); section(); }
    }
    if (!seq.mood || seq.done) return;
    while (guard++ < 48) {
      if (seq.i >= seq.ev.length) {
        end = seq.t0 + seq.len * seq.sd;
        if (end > hz) break;
        if (M[seq.mood].once) { seq.done = true; break; }
        seq.t0 = Math.max(end, now + 0.05); section(); continue;
      }
      e = seq.ev[seq.i]; te = seq.t0 + e.s * seq.sd + e.o;
      if (te > hz) break;
      seq.i++;
      if (te < now - 0.12) continue; // 掉帧/切后台回来：过期的音不补
      note(e, Math.max(te, now + 0.004));
    }
  }

  // ---------- 对外接口 ----------
  Au.init = function (P, settings) { Au.P = P || null; if (settings && typeof settings.seed === 'number') seed = settings.seed | 0; Au.setVolumes(settings); };
  Au.setVolumes = function (st) {
    if (st && typeof st === 'object') { Au.vol.music = clamp(num(st.music, Au.vol.music), 0, 1); Au.vol.sfx = clamp(num(st.sfx, Au.vol.sfx), 0, 1); }
    if (ctx) { try { mix(ctx.currentTime, false); } catch (e) {} }
  };
  Au.unlock = function () {
    var c = null, p;
    try {
      if (!ctx) {
        if (!Au.P || typeof Au.P.audio !== 'function' || tries > 2) return;
        try { c = Au.P.audio(); } catch (e) { c = null; }
        if (!c) return;
        tries++;
        if (!c.createGain || !c.createOscillator || !c.createBufferSource || !c.createBuffer || !c.createBiquadFilter || !c.destination) return;
        try { build(c); } catch (e2) { ctx = null; Au.ctx = null; return; }
      }
      paused = false;
      if (ctx.state === 'suspended' && ctx.resume) { p = ctx.resume(); if (p && p['catch']) p['catch'](noop); }
    } catch (e3) {}
  };
  Au.pause = function () { paused = true; if (ctx && ctx.suspend) { try { var p = ctx.suspend(); if (p && p['catch']) p['catch'](noop); } catch (e) {} } };
  Au.resume = function () { paused = false; if (ctx && ctx.resume) { try { var p = ctx.resume(); if (p && p['catch']) p['catch'](noop); } catch (e) {} } };
  Au.setDuck = function (on) { duck = !!on; if (ctx) { try { mix(ctx.currentTime, false); } catch (e) {} } };
  Au.play = function (name, opts) {
    try {
      Au.log.push(name); if (Au.log.length > 30) Au.log.shift();
      if (has(ALIAS, name)) name = ALIAS[name];
      if (!ctx || paused || Au.muted || !has(CUE, name) || ctx.state === 'closed') return;
      var now = ctx.currentTime, o = opts || E;
      if (lastAt[name] !== undefined && now >= lastAt[name] && now - lastAt[name] < 0.04) return; // 同名音效至少隔 40ms
      lastAt[name] = now;
      spawn('sfx', bus.one, CUE[name], clamp(num(o.vol, 1), 0, 2) * (TRIM[name] || 1), clamp(num(o.pitch, 1), 0.25, 4), clamp(num(o.pan, 0), -1, 1), WANT_PAN[name]);
    } catch (e) {}
  };
  Au.loop = function (name, level, x) {
    if (!has(loops, name)) return;
    loops[name].target = clamp(num(level, 0), 0, 1);
    if (x !== undefined) loops[name].x = clamp(num(x, 0), 0, 1);
  };
  Au.setScene = function (o) {
    if (!o || typeof o !== 'object') return;
    if (o.place !== undefined) scene.place = has(PLACE, o.place) ? o.place : null;
    if (o.rain !== undefined) scene.rain = clamp(num(o.rain, 0), 0, 1);
    if (o.crowd !== undefined) scene.crowd = clamp(num(o.crowd, 0), 0, 1);
    if (o.dawn !== undefined) scene.dawn = clamp(num(o.dawn, 0), 0, 1);
    if (o.music !== undefined) scene.music = has(M, o.music) ? o.music : null;
    targets();
  };
  // 旧接口兼容：setAmbience('morning'|'noon'|'rain'|'dusk'|'night'|'story', 是否下雨)
  var OLD = { morning: { place: 'shop', dawn: 0.5, music: 'lull' }, noon: { place: 'shop', dawn: 1, music: 'lull' }, rain: { place: 'shop', dawn: 0.6, music: 'lull' }, dusk: { place: 'shop', dawn: 1, music: 'close' }, night: { place: 'night', dawn: 0, music: 'night' }, story: { music: 'story' } };
  Au.setAmbience = function (mood, rain) {
    var o = has(OLD, mood) ? OLD[mood] : {};
    Au.mood = mood; Au.setScene({ place: o.place, dawn: o.dawn, music: o.music, rain: rain ? 0.8 : 0 });
  };
  Au.update = function (dt) {
    if (!ctx || paused || (ctx.state && ctx.state !== 'running')) return;
    try {
      var now = ctx.currentTime, k;
      dt = clamp(num(dt, 1 / 60), 0, 0.1);
      reap(now);
      for (k in loops) loops[k].step(dt, now);
      for (k in beds) beds[k].step(dt, now);
      mix(now, false);
      events(dt);
      sequencer(now);
    } catch (e) {}
  };
  Au.state = function () {
    var lv = {}, k, n = 0;
    for (k in loops) { lv[k] = Math.round(loops[k].cur * 1000) / 1000; if (loops[k].on) n++; }
    for (k in beds) if (beds[k].on) n++;
    return {
      running: !!ctx && !paused && (!ctx.state || ctx.state === 'running'), hasCtx: !!ctx, paused: paused, duck: duck,
      voices: pools.sfx.length, musicVoices: pools.mus.length, ambVoices: pools.amb.length + pools.lp.length, layers: n, nodes: live,
      scene: { place: scene.place, rain: scene.rain, crowd: scene.crowd, dawn: scene.dawn, music: scene.music },
      music: { mood: seq.mood, done: seq.done, sections: seq.sections, notes: seq.notes }, loops: lv,
      vol: { music: Au.vol.music, sfx: Au.vol.sfx }, last: Au.log.slice(-6)
    };
  };
  Au.cues = (function () { var a = [], k; for (k in CUE) a.push(k); return a; })();
  Au.aliases = ALIAS;
  return Au;
});
