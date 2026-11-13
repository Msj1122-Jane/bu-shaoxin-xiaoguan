// 浏览器平台适配：画布、存储、输入、音频、生命周期、保存图片。核心玩法不依赖 DOM 按钮。
BSX.define('platform/web', function () {
  function create() {
    var canvas = document.getElementById('game');
    var params = new URLSearchParams(location.search);
    var mem = {};
    var storage = {
      get: function (k) { try { return localStorage.getItem(k); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; } },
      set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { if (e && /quota/i.test(String(e.name || e))) throw e; mem[k] = v; } },
      remove: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
    };
    var inputFns = [], keyFns = [], hideFns = [], showFns = [], resizeFns = [], gestureFns = [], silentEl = null, SILENT = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
    // 模拟微信胶囊/刘海安全区：?safe=wechat
    var simSafe = params.get('safe') === 'wechat';
    // 伪横屏：触屏设备竖着拿（或开了竖屏锁定）时，把画布旋转 90° 铺满屏幕，打开就是横屏；
    // 手机真的横过来时自动还原。桌面窄窗口不旋转，仍显示“请横过手机”。?rotate=0 可关闭。
    var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || params.get('rotate') === '1';
    var rotated = false;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var vw = window.innerWidth, vh = window.innerHeight;
      rotated = touch && params.get('rotate') !== '0' && vh > vw;
      var w = rotated ? vh : vw, h = rotated ? vw : vh;
      canvas.style.position = 'fixed'; canvas.style.left = '0px'; canvas.style.top = '0px';
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.style.transformOrigin = '0 0';
      canvas.style.transform = rotated ? 'translateX(' + vw + 'px) rotate(90deg)' : 'none';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      P.dpr = dpr; P.cssW = w; P.cssH = h; P.rotated = rotated;
      resizeFns.forEach(function (f) { f(); });
    }
    // 旋转后：屏幕点 (sx, sy) 对应画布点 (sy, vw - sx)
    function pos(e) {
      if (rotated) return { x: e.clientY * P.dpr, y: (window.innerWidth - e.clientX) * P.dpr };
      var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * P.dpr, y: (e.clientY - r.top) * P.dpr };
    }
    var down = false;
    // 触摸结束 / 点击这类“真正的用户手势”里再解锁一次音频（iOS Safari 只认这些）
    ['touchend', 'click', 'keydown', 'pointerup'].forEach(function (ev) { window.addEventListener(ev, function () { gestureFns.forEach(function (f) { f(); }); }, true); });
    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} down = true; var p = pos(e); inputFns.forEach(function (f) { f('down', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointermove', function (e) { var p = pos(e); inputFns.forEach(function (f) { f(down ? 'move' : 'hover', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointerup', function (e) { down = false; var p = pos(e); inputFns.forEach(function (f) { f('up', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('pointercancel', function (e) { down = false; var p = pos(e); inputFns.forEach(function (f) { f('cancel', p.x, p.y, e.pointerId); }); });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', function (e) { keyFns.forEach(function (f) { f(e.key, e); }); if ([' ', 'Tab', 'Enter', 'Escape'].indexOf(e.key) >= 0) e.preventDefault(); });
    document.addEventListener('visibilitychange', function () { (document.hidden ? hideFns : showFns).forEach(function (f) { f(); }); });
    window.addEventListener('blur', function () { hideFns.forEach(function (f) { f(); }); });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    var actx = null;
    var P = {
      name: 'web', canvas: canvas, ctx: canvas.getContext('2d'), params: params, dpr: 1, cssW: 0, cssH: 0, devMode: params.has('dev'), webdriver: !!navigator.webdriver,
      now: function () { return performance.now(); },
      raf: function (fn) { return requestAnimationFrame(fn); },
      storage: storage,
      loadImage: function (path, cb) { var img = new Image(); img.onload = function () { cb(null, img); }; img.onerror = function () { cb(new Error('加载失败 ' + path)); }; img.src = path; },
      loadBytes: function (path, cb) { try { fetch(path).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (b) { cb(null, b); }, function (e) { cb(e); }); } catch (e) { cb(e); } },
      createCanvas: function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; },
      onGesture: function (f) { gestureFns.push(f); }, onInput: function (f) { inputFns.push(f); }, onKey: function (f) { keyFns.push(f); },
      onHide: function (f) { hideFns.push(f); }, onShow: function (f) { showFns.push(f); }, onResize: function (f) { resizeFns.push(f); },
      safeInsets: function () { return simSafe ? { l: 44 * P.dpr, t: 0, r: 34 * P.dpr, b: 21 * P.dpr } : { l: 0, t: 0, r: 0, b: 0 }; },
      capsule: function () { return simSafe ? { x: P.canvas.width - 97 * P.dpr - 7 * P.dpr, y: 8 * P.dpr, w: 87 * P.dpr, h: 32 * P.dpr } : null; },
      vibrate: function (kind) { try { if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : 12); } catch (e) {} },
      audio: function () { if (!actx) { var A = window.AudioContext || window.webkitAudioContext; if (A) actx = new A(); } return actx; },
      // iPhone 静音键会把网页音频一起静音：切到“播放”类别，并用一段无声 <audio> 把音频会话拉起来
      audioSession: function () {
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
        try {
          if (!silentEl) { silentEl = document.createElement('audio'); silentEl.setAttribute('playsinline', ''); silentEl.loop = true; silentEl.src = SILENT; silentEl.volume = 0.01; }
          var pr = silentEl.play(); if (pr && pr.catch) pr.catch(function () {});
        } catch (e) {}
        try { if (actx && actx.state !== 'running') actx.resume(); } catch (e) {}
      },
      saveImage: function (cv, name) {
        return new Promise(function (res, rej) {
          try { var a = document.createElement('a'); a.download = name; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); res(true); }
          catch (e) { rej(e); }
        });
      },
      fullscreen: function () { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {} },
      portrait: function () { return !rotated && window.innerHeight > window.innerWidth * 1.05; }
    };
    resize();
    return P;
  }
  return { create: create };
});
