// 在模拟的微信运行时中启动 dist/wechat，检查：加载、触摸坐标映射（含胶囊让位）、存储、切后台/前台、首日可玩。
// node tools/wx_check.cjs [--w 844 --h 390 --dpr 2 --notch]
const { chromium } = require('playwright');
const fs = require('fs');
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : (a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : true); };
const W = +opt('w', 844), H = +opt('h', 390), DPR = +opt('dpr', 2), notch = !!opt('notch', false), out = opt('out', 'output/wx');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await p.goto(`http://127.0.0.1:4173/tools/wx_sim/index.html?w=${W}&h=${H}&dpr=${DPR}${notch ? '&notch=1' : ''}`);
  await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title', null, { timeout: 20000 });
  const res = {};
  // 通过 wx 触摸回调点击“开门营业”（逻辑坐标 → CSS 像素）
  const touchTap = async (id) => p.evaluate((id) => {
    const app = GameGlobal.__app, h = __bsx.hits().find(x => x.id === id); if (!h) return false;
    const v = app.view, cx = (h.x * v.s + v.ox) / app.P.dpr, cy = (h.y * v.s + v.oy) / app.P.dpr;
    const t = [{ identifier: 1, clientX: cx, clientY: cy }];
    __wxTouch.start({ touches: t, changedTouches: t }); advanceTime(50); __wxTouch.end({ touches: [], changedTouches: t }); advanceTime(300);
    return { cx, cy };
  }, id);
  res.capsule = await p.evaluate(() => ({ capsule: GameGlobal.__app.capsule, rightInset: GameGlobal.__app.rightInset }));
  res.tapStart = await touchTap('title_start');
  res.afterStart = await p.evaluate(() => JSON.parse(render_game_to_text()).screen);
  await p.screenshot({ path: out + '/wx-01-story.png' });
  // 切后台 / 前台：暂停并恢复
  res.hide = await p.evaluate(() => { __wxLife.hide.forEach(f => f()); advanceTime(100); const d = JSON.parse(render_game_to_text()); __wxLife.show.forEach(f => f()); return { paused: d.paused, overlay: d.overlay }; });
  await p.evaluate(() => { if (GameGlobal.__app.overlay) __bsx.tapId('pause_resume'); advanceTime(200); });
  // 机器人玩完第 1 日
  await p.evaluate(() => { BSX.require('dev/autoplay').start(GameGlobal.__app, { policy: 'average', fast: true, stopAt: app => app.state && app.state.phase === 'ledger' }); });
  for (let i = 0; i < 400; i++) { const s = await p.evaluate(() => { advanceTime(500); return JSON.parse(render_game_to_text()).screen; }); if (s === 'ledger') break; }
  await p.evaluate(() => advanceTime(1500));
  await p.screenshot({ path: out + '/wx-02-ledger.png' });
  res.ledger = await p.evaluate(() => { const d = JSON.parse(render_game_to_text()); return { screen: d.screen, day: d.run.day, net: d.detail && d.detail.net }; });
  // 营业画面的暂停按钮不被胶囊遮挡
  res.pauseVsCapsule = await p.evaluate(() => { const app = GameGlobal.__app; return { capsuleX: app.capsule && app.capsule.x, rightInset: app.rightInset }; });
  res.vibrate = await p.evaluate(() => window.__wxVibrate || 0);
  // 存储：刷新后继续
  res.stored = await p.evaluate(() => !!wx.getStorageSync('bsx.run.v3'));
  await p.reload(); await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title', null, { timeout: 20000 });
  res.continue = await p.evaluate(() => JSON.parse(render_game_to_text()).detail);
  await touchTap('title_continue'); res.afterContinue = await p.evaluate(() => { const d = JSON.parse(render_game_to_text()); return { screen: d.screen, day: d.run && d.run.day, phase: d.run && d.run.phase }; });
  await p.screenshot({ path: out + '/wx-03-continue.png' });
  res.errors = errors;
  console.log(JSON.stringify(res, null, 1));
  fs.writeFileSync(out + '/wx_check.json', JSON.stringify(res, null, 1));
  await b.close(); process.exit(errors.length ? 1 : 0);
})();
