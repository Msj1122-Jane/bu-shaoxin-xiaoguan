// 浏览器启动：加载资源清单 → 创建 App。清单加载失败时给出明确错误与重试。
(function () {
  function boot() {
    var P = BSX.require('platform/web').create();
    var App = BSX.require('app').App;
    fetch('assets/runtime/manifest.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (m) { window.__app = new App(P, m); })
      .catch(function (e) {
        var ctx = P.ctx; ctx.fillStyle = '#2a1e14'; ctx.fillRect(0, 0, P.canvas.width, P.canvas.height);
        ctx.fillStyle = '#fff3d6'; ctx.font = (24 * P.dpr) + 'px sans-serif'; ctx.fillText('资源清单加载失败：' + e.message + '（点击重试）', 40 * P.dpr, 80 * P.dpr);
        P.canvas.addEventListener('pointerdown', function () { location.reload(); }, { once: true });
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
