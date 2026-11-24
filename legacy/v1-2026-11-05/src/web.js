const canvas = document.querySelector('canvas');
const LOGICAL_W = 960;
const LOGICAL_H = 540;

function size() {
  const scale = Math.min(innerWidth / LOGICAL_W, innerHeight / LOGICAL_H);
  canvas.style.width = `${LOGICAL_W * scale}px`;
  canvas.style.height = `${LOGICAL_H * scale}px`;
  canvas.width = Math.round(LOGICAL_W * scale * devicePixelRatio);
  canvas.height = Math.round(LOGICAL_H * scale * devicePixelRatio);
}

let audioContext = null;
function feedback(kind) {
  if (navigator.vibrate && ['perfect', 'wrong'].includes(kind)) navigator.vibrate(kind === 'perfect' ? 18 : 10);
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const map = { wrong: 150, open: 260, rushed: 220, home: 360, perfect: 520 };
    osc.frequency.value = map[kind] || 300;
    osc.type = kind === 'wrong' ? 'square' : 'sine';
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.13);
  } catch (_) {}
}

size();
const platform = {
  now: () => performance.now(),
  frame: (fn) => requestAnimationFrame(fn),
  image: (path, done) => { const image = new Image(); image.onload = done; image.src = path; return image; },
  surface: (width, height) => { const out = document.createElement('canvas'); out.width = width; out.height = height; return out; },
  feedback,
  pause: (fn) => document.addEventListener('visibilitychange', () => { if (document.hidden) fn(); }),
  input: (fn) => {
    for (const [event, type] of [['pointerdown', 'down'], ['pointermove', 'move'], ['pointerup', 'up'], ['pointercancel', 'cancel']]) {
      canvas.addEventListener(event, (e) => {
        e.preventDefault();
        if (type === 'down') canvas.setPointerCapture(e.pointerId);
        const rect = canvas.getBoundingClientRect();
        fn(type, (e.clientX - rect.left) * LOGICAL_W / rect.width, (e.clientY - rect.top) * LOGICAL_H / rect.height);
      });
    }
  },
};

const app = BSX_START(canvas, platform, BSX_GAMEPLAY);
window.__bsx = { snapshot: app.snapshot, ui: app.ui, reset: app.reset };
window.render_game_to_text = app.text;
window.advanceTime = app.advance;
addEventListener('resize', () => { size(); app.redraw(); });
addEventListener('keydown', async (event) => {
  if (event.key.toLowerCase() !== 'f') return;
  if (!document.fullscreenElement) await canvas.requestFullscreen?.();
  else await document.exitFullscreen?.();
});
document.addEventListener('fullscreenchange', () => { size(); app.redraw(); });
