// 微信小游戏平台适配。与 platform/web 同接口。需在微信开发者工具与真机验证（见 docs/WECHAT_GUIDE.md）。
BSX.define('platform/wechat', function () {
  function create() {
    var info = wx.getSystemInfoSync();
    var canvas = wx.createCanvas();
    var dpr = Math.min(info.pixelRatio || 2, 2);
    canvas.width = Math.round(info.windowWidth * dpr); canvas.height = Math.round(info.windowHeight * dpr);
    var inputFns = [], hideFns = [], showFns = [];
    function each(type, e) { var list = e.changedTouches || []; for (var i = 0; i < list.length; i++) { var t = list[i]; inputFns.forEach(function (f) { f(type, t.clientX * dpr, t.clientY * dpr, t.identifier); }); } }
    wx.onTouchStart(function (e) { each('down', e); });
    wx.onTouchMove(function (e) { each('move', e); });
    wx.onTouchEnd(function (e) { each('up', e); });
    wx.onTouchCancel(function (e) { each('cancel', e); });
    wx.onHide(function () { hideFns.forEach(function (f) { f(); }); });
    wx.onShow(function () { showFns.forEach(function (f) { f(); }); });
    if (wx.onAudioInterruptionBegin) wx.onAudioInterruptionBegin(function () { hideFns.forEach(function (f) { f(); }); });
    if (wx.onAudioInterruptionEnd) wx.onAudioInterruptionEnd(function () { showFns.forEach(function (f) { f(); }); });
    var actx = null;
    // 兼容：旧基础库 Canvas 若无 ellipse，用 arc+缩放补齐
    var proto = Object.getPrototypeOf(canvas.getContext('2d'));
    if (proto && !proto.ellipse) proto.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) { this.save(); this.translate(x, y); this.rotate(rot); this.scale(rx, ry); this.arc(0, 0, 1, a0, a1, ccw); this.restore(); };
    var safe = info.safeArea || { left: 0, top: 0, right: info.windowWidth, bottom: info.windowHeight };
    var P = {
      name: 'wechat', canvas: canvas, ctx: canvas.getContext('2d'), params: { get: function () { return null; }, has: function () { return false; } }, dpr: dpr, cssW: info.windowWidth, cssH: info.windowHeight, devMode: false,
      now: function () { return Date.now(); },
      raf: function (fn) { return requestAnimationFrame(fn); },
      storage: {
        get: function (k) { try { var v = wx.getStorageSync(k); return v === '' ? null : v; } catch (e) { return null; } },
        set: function (k, v) { wx.setStorageSync(k, v); },
        remove: function (k) { try { wx.removeStorageSync(k); } catch (e) {} }
      },
      loadImage: function (path, cb) { var img = wx.createImage(); img.onload = function () { cb(null, img); }; img.onerror = function () { cb(new Error('加载失败 ' + path)); }; img.src = path; },
      createCanvas: function (w, h) { var c = wx.createCanvas(); c.width = w; c.height = h; return c; },
      onInput: function (f) { inputFns.push(f); }, onKey: function () {},
      onHide: function (f) { hideFns.push(f); }, onShow: function (f) { showFns.push(f); }, onResize: function () {},
      safeInsets: function () { return { l: safe.left * dpr, t: safe.top * dpr, r: (info.windowWidth - safe.right) * dpr, b: (info.windowHeight - safe.bottom) * dpr }; },
      capsule: function () { try { var m = wx.getMenuButtonBoundingClientRect(); return { x: m.left * dpr, y: m.top * dpr, w: m.width * dpr, h: m.height * dpr }; } catch (e) { return null; } },
      vibrate: function (kind) { try { wx.vibrateShort({ type: kind === 'heavy' ? 'medium' : 'light' }); } catch (e) {} },
      audio: function () { if (!actx && wx.createWebAudioContext) actx = wx.createWebAudioContext(); return actx; },
      saveImage: function (cv) {
        return new Promise(function (res, rej) {
          cv.toTempFilePath({ fileType: 'png', success: function (r) { wx.saveImageToPhotosAlbum({ filePath: r.tempFilePath, success: function () { res(true); }, fail: rej }); }, fail: rej });
        });
      },
      fullscreen: function () {},
      portrait: function () { return info.windowHeight > info.windowWidth; }
    };
    return P;
  }
  return { create: create };
});
