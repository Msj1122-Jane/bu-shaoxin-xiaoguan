// WeChat entry. Requires developer-tool and real-device verification.
const Gameplay = require('./src/gameplay.js');
const start = require('./src/app.js');
const canvas = wx.createCanvas();
const info = wx.getSystemInfoSync();
canvas.width = Math.round(info.windowWidth * info.pixelRatio);
canvas.height = Math.round(info.windowHeight * info.pixelRatio);

const platform = {
  now: () => Date.now(),
  frame: (fn) => requestAnimationFrame(fn),
  image: (path, done) => { const image = wx.createImage(); image.onload = done; image.src = path; return image; },
  surface: (width, height) => { const out = wx.createCanvas(); out.width = width; out.height = height; return out; },
  feedback: (kind) => { if (['perfect', 'wrong'].includes(kind)) wx.vibrateShort({ type: 'light' }); },
  pause: (fn) => wx.onHide(fn),
  input: (fn) => {
    const position = (type, event) => {
      const touch = event.changedTouches[0] || event.touches[0];
      if (touch) fn(type, touch.clientX / info.windowWidth * 960, touch.clientY / info.windowHeight * 540);
    };
    wx.onTouchStart((event) => position('down', event));
    wx.onTouchMove((event) => position('move', event));
    wx.onTouchEnd((event) => position('up', event));
    wx.onTouchCancel((event) => position('cancel', event));
  },
};

start(canvas, platform, Gameplay);
