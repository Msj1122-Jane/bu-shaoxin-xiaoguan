// 快速截图：node tools/shot.cjs out.png [url-suffix] [jsAfterLoad] [advanceMs]
const { chromium } = require('playwright');
(async () => {
  const [out, suffix = '', js = '', adv = '1500'] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:4173/' + suffix); await p.waitForFunction(() => window.render_game_to_text, null, { timeout: 8000 });
  await p.waitForFunction(() => JSON.parse(render_game_to_text()).screen !== 'loading', null, { timeout: 15000 }).catch(() => {});
  if (js) await p.evaluate(js);
  await p.evaluate(ms => advanceTime(+ms), adv);
  await p.screenshot({ path: out });
  console.log(await p.evaluate(() => render_game_to_text()));
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
