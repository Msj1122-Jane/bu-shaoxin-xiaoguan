// 程序化音频（D008）：WebAudio 合成音效＋环境层＋轻木琴生成式音乐。正式音源替换见 HUMAN_TASKS H05。
// 规则：做饭声优先于音乐；同时反馈音 ≤2 层；对白时环境声降低；切后台暂停。
BSX.define('game/audio', function () {
  var Au = { ctx: null, master: null, sfxBus: null, musBus: null, ambBus: null, vol: { music: 0.5, sfx: 0.8 }, active: 0, muted: false, mood: null, rain: false, rainNode: null, noiseBuf: null, nextNote: 0, log: [], loopPour: null, duck: 1 };
  Au.init = function (P, settings) { Au.P = P; Au.setVolumes(settings); };
  Au.setVolumes = function (st) { if (st) { Au.vol.music = st.music; Au.vol.sfx = st.sfx; } if (Au.musBus) { Au.musBus.gain.value = Au.vol.music * 0.9 * Au.duck; Au.sfxBus.gain.value = Au.vol.sfx; Au.ambBus.gain.value = Au.vol.music * 0.5 * Au.duck; } };
  Au.unlock = function () {
    if (Au.P && Au.P.audioSession && !Au.sessionOk) { Au.P.audioSession(); if (Au.ctx && Au.ctx.state === 'running') Au.sessionOk = true; }
    if (Au.ctx) { if (Au.ctx.state !== 'running' && Au.ctx.resume) try { Au.ctx.resume(); } catch (e) {} return; }
    var c = Au.P.audio(); if (!c) return;
    Au.ctx = c; Au.master = c.createGain(); Au.master.connect(c.destination);
    Au.sfxBus = c.createGain(); Au.musBus = c.createGain(); Au.ambBus = c.createGain();
    Au.sfxBus.connect(Au.master); Au.musBus.connect(Au.master); Au.ambBus.connect(Au.master);
    var len = c.sampleRate * 1.5, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Au.noiseBuf = b; Au.setVolumes(); Au.applyAmbience(); Au.startMusic();
  };
  Au.pause = function () { if (Au.ctx && Au.ctx.suspend) try { Au.ctx.suspend(); } catch (e) {} };
  Au.resume = function () { if (Au.ctx && Au.ctx.resume) try { Au.ctx.resume(); } catch (e) {} };
  Au.setDuck = function (on) { Au.duck = on ? 0.45 : 1; Au.setVolumes(); };
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, type, a, peak, dec, bus, when, detune) {
    var c = Au.ctx, t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (detune) o.frequency.exponentialRampToValueAtTime(freq * detune, t + a + dec);
    env(g, t, a, peak, dec); o.connect(g); g.connect(bus || Au.sfxBus); o.start(t); o.stop(t + a + dec + 0.05);
  }
  function noise(dur, peak, ftype, freq, q, bus, when, sweepTo) {
    var c = Au.ctx, t = c.currentTime + (when || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = Au.noiseBuf; f.type = ftype; f.frequency.setValueAtTime(freq, t); if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); f.Q.value = q || 1;
    env(g, t, 0.01, peak, dur); s.connect(f); f.connect(g); g.connect(bus || Au.sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }
  var LIB = {
    tap: function () { tone(880, 'triangle', 0.003, 0.18, 0.06); },
    knob: function () { noise(0.04, 0.35, 'bandpass', 2400, 3); tone(1400, 'square', 0.002, 0.05, 0.03); },
    stir: function () { noise(0.18, 0.12, 'lowpass', 900, 1); },
    bubble: function () { tone(300 + Math.random() * 200, 'sine', 0.005, 0.15, 0.08, null, 0, 1.8); },
    sizzle: function () { noise(0.5, 0.18, 'highpass', 3000, 0.7); },
    flip: function () { noise(0.08, 0.3, 'bandpass', 900, 2); tone(220, 'sine', 0.004, 0.2, 0.1); },
    drop: function () { tone(180, 'sine', 0.003, 0.3, 0.12, null, 0, 0.6); noise(0.06, 0.15, 'lowpass', 700); },
    pickup: function () { tone(520, 'triangle', 0.003, 0.15, 0.05, null, 0, 1.3); },
    bowl: function () { tone(1320, 'sine', 0.002, 0.18, 0.35); tone(1980, 'sine', 0.002, 0.07, 0.25); },
    perfect: function () { tone(1046, 'triangle', 0.004, 0.22, 0.25); tone(1568, 'triangle', 0.004, 0.16, 0.3, null, 0.08); },
    ok: function () { tone(784, 'triangle', 0.004, 0.16, 0.18); },
    rushed: function () { tone(392, 'triangle', 0.004, 0.14, 0.2, null, 0, 0.9); },
    wrong: function () { tone(150, 'square', 0.004, 0.08, 0.15); tone(140, 'square', 0.004, 0.06, 0.15, null, 0.12); },
    coin: function () { tone(1760, 'square', 0.002, 0.06, 0.08); tone(2349, 'square', 0.002, 0.05, 0.12, null, 0.06); },
    bell: function () { [1568, 1976, 2637].forEach(function (f, i) { tone(f, 'sine', 0.003, 0.08, 0.9, null, i * 0.07); }); },
    page: function () { noise(0.15, 0.2, 'bandpass', 3000, 0.8, null, 0, 1500); },
    shutter: function () { noise(1.2, 0.25, 'bandpass', 500, 2, null, 0, 2400); for (var i = 0; i < 8; i++) noise(0.03, 0.15, 'bandpass', 1800, 4, null, i * 0.13); },
    tear: function () { noise(0.3, 0.3, 'highpass', 2500, 1, null, 0, 6000); },
    horn: function () { tone(370, 'sawtooth', 0.02, 0.08, 0.5); tone(466, 'sawtooth', 0.02, 0.06, 0.5); },
    steam: function () { noise(0.6, 0.06, 'highpass', 5000, 0.5); },
    pour: function () { noise(0.3, 0.12, 'bandpass', 1200, 0.8); },
    stamp: function () { tone(120, 'sine', 0.003, 0.4, 0.15); noise(0.05, 0.2, 'lowpass', 500); },
    open: function () { tone(523, 'triangle', 0.01, 0.12, 0.2); tone(659, 'triangle', 0.01, 0.12, 0.2, null, 0.1); tone(784, 'triangle', 0.01, 0.12, 0.35, null, 0.2); },
    risk: function () { tone(220, 'triangle', 0.01, 0.12, 0.3); tone(207, 'triangle', 0.01, 0.1, 0.4, null, 0.15); }
  };
  Au.play = function (name) {
    Au.log.push(name); if (Au.log.length > 30) Au.log.shift();
    if (!Au.ctx || Au.muted || !LIB[name]) return;
    if (Au.active >= 2 && ['tap', 'stir', 'bubble', 'pour'].indexOf(name) >= 0) return;
    Au.active++; setTimeout(function () { Au.active--; }, 120);
    try { LIB[name](); } catch (e) {}
  };
  // 配乐：Lovart 制作的 10 首（用户 11-13，BGM01–BGM10），循环播放，换场景时交叉淡入；解码后的音频很占内存，只缓存最近 2 首
  var TRACK_OF = { morning: 'bgm_dawn', noon: 'bgm_dawn', dawn: 'bgm_dawn', story: 'bgm_dawn', dusk: 'bgm_night', night: 'bgm_night', rain: 'bgm_night' };
  Au.bufs = {}; Au.loading = {};
  Au.music = function (name) { Au.want = name; Au.startMusic(); };
  // 临时换曲（回忆、老金登场、对质），结束后回到原来那首
  Au.stack = [];
  Au.pushMusic = function (name) { Au.stack.push(Au.want); Au.music(name); };
  Au.popMusic = function () { if (Au.stack.length) Au.music(Au.stack.pop()); };
  Au.popAllMusic = function () { if (Au.stack.length) { var n = Au.stack[0]; Au.stack = []; Au.music(n); } };
  Au.startMusic = function () {
    var name = Au.want; if (!Au.ctx || !name || (Au.cur && Au.cur.name === name)) return;
    if (!Au.bufs[name]) {
      if (Au.loading[name] || !Au.P || !Au.P.loadBytes) return; Au.loading[name] = true;
      Au.P.loadBytes('assets/runtime/audio/' + name + '.mp3', function (err, data) {
        if (err || !data) return;
        var done = function (buf) { Au.bufs[name] = buf; Au.startMusic(); };
        try { var pr = Au.ctx.decodeAudioData(data, done, function () {}); if (pr && pr.then) pr.then(done, function () {}); } catch (e) {}
      });
      return;
    }
    var c = Au.ctx, now = c.currentTime;
    if (Au.cur) { var old = Au.cur; old.g.gain.setTargetAtTime(0, now, 0.4); clearTimeout(old.timer); setTimeout(function () { try { old.s.stop(); } catch (e) {} }, 2000); }
    Au.cur = playLoop(name, 0.4);
    Au.recent = (Au.recent || []).filter(function (n) { return n !== name; }); Au.recent.unshift(name);
    Au.recent.slice(2).forEach(function (n) { delete Au.bufs[n]; Au.loading[n] = false; }); Au.recent = Au.recent.slice(0, 2);
  };
  // 曲尾都是 5 秒左右的淡出：在淡出开始前 2.5 秒起下一遍，两遍交叉淡入淡出，听不出“歌放完了”
  function loopEnd(buf) {
    if (buf.__end) return buf.__end;
    var d = buf.getChannelData(0), sr = buf.sampleRate, w = Math.floor(sr / 4), n = Math.floor(d.length / w), rms = [];
    for (var i = 0; i < n; i++) { var acc = 0; for (var j = i * w; j < (i + 1) * w; j += 8) acc += d[j] * d[j]; rms.push(Math.sqrt(acc / (w / 8))); }
    var sorted = rms.slice().sort(function (a, b) { return a - b; }), med = sorted[Math.floor(sorted.length / 2)] || 0, k = n - 1;
    while (k > n * 0.6 && rms[k] < med * 0.5) k--;
    buf.__end = Math.max(10, (k + 1) * w / sr); return buf.__end;
  }
  function playLoop(name, fadeIn) {
    var c = Au.ctx, buf = Au.bufs[name], now = c.currentTime, XF = 2.5;
    var s = c.createBufferSource(), g = c.createGain(); s.buffer = buf;
    g.gain.value = 0; g.gain.setTargetAtTime(1, now, fadeIn); s.connect(g); g.connect(Au.musBus); s.start();
    var cur = { name: name, s: s, g: g }, end = loopEnd(buf);
    cur.timer = setTimeout(function () {
      if (Au.cur !== cur || !Au.bufs[name]) return;
      var t = c.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(0, t + XF);
      setTimeout(function () { try { cur.s.stop(); } catch (e) {} }, (XF + 0.5) * 1000);
      Au.cur = playLoop(name, XF / 3);
    }, Math.max(1, end - XF) * 1000);
    return cur;
  }
  Au.loopEnd = loopEnd;
  Au.setAmbience = function (mood, rain) { Au.mood = mood; Au.rain = !!rain; Au.applyAmbience(); if (TRACK_OF[mood] && !Au.lockTrack) Au.music(TRACK_OF[mood]); };
  Au.applyAmbience = function () {
    if (!Au.ctx) return;
    var c = Au.ctx;
    if (Au.rain && !Au.rainNode) {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = Au.noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = 0.22;
      s.connect(f); f.connect(g); g.connect(Au.ambBus); s.start(); Au.rainNode = { s: s, g: g };
    } else if (!Au.rain && Au.rainNode) { try { Au.rainNode.s.stop(); } catch (e) {} Au.rainNode = null; }
  };
  var SCALES = { morning: [523, 587, 659, 784, 880, 1046], noon: [523, 587, 659, 784, 880], rain: [440, 494, 523, 659, 740], dusk: [392, 440, 523, 587, 659], night: [349, 392, 440, 523, 587], story: [440, 523, 587, 659, 784] };
  // 由主循环每帧调用，dt 秒
  Au.update = function (dt) {
    if (!Au.ctx || !Au.mood || Au.ctx.state !== 'running' || Au.cur) return;
    Au.nextNote -= dt;
    if (Au.nextNote <= 0) {
      var sc = SCALES[Au.mood] || SCALES.morning;
      Au.nextNote = 0.42 + Math.random() * 0.5;
      if (Math.random() < 0.62) { var f = sc[Math.floor(Math.random() * sc.length)]; tone(f, 'triangle', 0.004, 0.09, 0.6, Au.musBus); if (Math.random() < 0.25) tone(f / 2, 'sine', 0.01, 0.06, 0.9, Au.musBus); }
    }
  };
  return Au;
});
