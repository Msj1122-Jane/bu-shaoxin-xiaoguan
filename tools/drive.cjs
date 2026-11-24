// 驱动脚本：node tools/drive.cjs '<json steps>' [url-suffix]
// step: { js?: 页面里执行的代码, adv?: 推进毫秒, shot?: 截图文件名, log?: true 打印状态, w?, h? }
const { chromium } = require('playwright');
(async () => {
  const steps = JSON.parse(process.argv[2]); const suffix = process.argv[3] || '?dev';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:4173/' + suffix); await p.waitForFunction(() => window.render_game_to_text, null, { timeout: 8000 });
  await p.waitForFunction(() => JSON.parse(render_game_to_text()).screen !== 'loading', null, { timeout: 15000 }).catch(() => {});
  for (const s of steps) {
    if (s.w) await p.setViewportSize({ width: s.w, height: s.h });
    if (s.js) { const r = await p.evaluate(s.js).catch(e => 'EVAL ERR ' + e); if (r !== undefined && s.print) console.log('=>', typeof r === 'string' ? r : JSON.stringify(r)); }
    if (s.adv) await p.evaluate(ms => advanceTime(+ms), s.adv);
    if (s.shot) await p.screenshot({ path: s.shot });
    if (s.log) console.log(await p.evaluate(() => { const d = JSON.parse(render_game_to_text()); return JSON.stringify({ screen: d.screen, overlay: d.overlay, run: d.run && { day: d.run.day, phase: d.run.phase, cash: d.run.cash, rep: d.run.rep, burn: d.run.burn }, detail: d.detail, errors: d.errors }); }));
  }
  const e2 = await p.evaluate(() => __bsx.errors());
  console.log('ERRORS', JSON.stringify(errs.concat(e2)).slice(0, 3000));
  await b.close();
})();
