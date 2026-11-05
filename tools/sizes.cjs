// 多尺寸与安全区截图：node tools/sizes.cjs → output/e2e/sizes/
const { chromium } = require('playwright');
const fs = require('fs');
const SIZES = [['1280x720', 1280, 720, ''], ['phone-844x390-safe', 844, 390, 'safe=wechat'], ['phone-780x360-safe', 780, 360, 'safe=wechat'], ['tablet-1024x768', 1024, 768, '']];
(async () => {
  fs.mkdirSync('output/e2e/sizes', { recursive: true });
  const b = await chromium.launch(); const res = [];
  for (const [name, w, h, q] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:4173/?' + q); await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title');
    await p.evaluate(() => { localStorage.clear(); __bsx.newRun({ seed: 3 }); BSX.require('dev/autoplay').fastForward(__bsx.app, 4); advanceTime(800); });
    await p.screenshot({ path: `output/e2e/sizes/${name}-prep.png` });
    await p.evaluate(() => { __bsx.tapId('prep_open'); advanceTime(3000); for (let i = 0; i < 8 && JSON.parse(render_game_to_text()).screen !== 'service'; i++) { const d = JSON.parse(render_game_to_text()).detail; if (d && d.director && d.director.choice) __bsx.tapId('choice_' + d.director.choice[0].id); else __bsx.tap(640, 400); advanceTime(1500); } advanceTime(6000); });
    await p.screenshot({ path: `output/e2e/sizes/${name}-service.png` });
    // 触控：通过真实 touch 点击暂停按钮，检查命中
    const hit = await p.evaluate(() => { const h = __bsx.hits().find(x => x.id === 'hud_pause'); const app = __bsx.app, v = app.view; return { x: (h.x * v.s + v.ox) / app.P.dpr, y: (h.y * v.s + v.oy) / app.P.dpr, capsule: app.capsule, rightInset: app.rightInset }; });
    await p.touchscreen.tap(hit.x, hit.y); await p.evaluate(() => advanceTime(300));
    const ov = await p.evaluate(() => JSON.parse(render_game_to_text()).overlay);
    await p.screenshot({ path: `output/e2e/sizes/${name}-pause.png` });
    res.push({ name, pauseTapOpens: ov, pauseAt: [Math.round(hit.x), Math.round(hit.y)], capsule: hit.capsule && [Math.round(hit.capsule.x), Math.round(hit.capsule.y)], errors: errs });
    await p.close();
  }
  console.log(JSON.stringify(res, null, 1)); fs.writeFileSync('output/e2e/sizes/sizes.json', JSON.stringify(res, null, 1));
  await b.close();
})();
