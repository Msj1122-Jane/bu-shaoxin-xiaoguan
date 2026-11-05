// 端到端回放：浏览器内机器人用真实指针手势游玩。
// node tools/e2e.cjs --policy average --days 28 --out output/e2e/full --seed 7 [--assist] [--viewport 1280x720] [--safe] [--shots all|first]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const policy = opt('policy', 'average'), days = +opt('days', 1), out = opt('out', 'output/e2e/run'), seed = +opt('seed', 7), vp = opt('viewport', '1280x720').split('x').map(Number);
const shots = opt('shots', 'first'), assist = !!opt('assist', false), safe = !!opt('safe', false), throttle = +opt('throttle', 0);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, hasTouch: !!opt('touch', false) });
  const errors = []; page.on('pageerror', e => errors.push('pageerror ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('http ' + r.status() + ' ' + r.url()); });
  if (throttle) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
  await page.goto('http://127.0.0.1:4173/?' + (safe ? 'safe=wechat&' : '') + 'dev');
  await page.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title', null, { timeout: 20000 });
  const jump = +opt('jump', 0), mode = opt('mode', 'story'), theme = opt('theme', 'T_RAIN'), tryNew = !!opt('tryNew', false);
  await page.evaluate(([seed, policy, assist, mode, theme, tryNew, jump]) => { localStorage.clear(); const app = __bsx.app; app.settings.assistCook = assist; app.applySettings(); app.newRun(mode === 'week' ? { seed, mode: 'week', theme, goal: 'g1', unlockAll: true } : { seed }); if (jump > 1) BSX.require('dev/autoplay').fastForward(app, jump, policy); BSX.require('dev/autoplay').start(app, { policy, fast: true, tryNewDishes: tryNew }); }, [seed, policy, assist, mode, theme, tryNew, jump]);
  const seen = {}, log = [];
  let n = 0, lastKey = '', t0 = Date.now(), stuck = 0, lastT = 0;
  const shot = async (name) => { const f = path.join(out, String(n++).padStart(3, '0') + '-' + name + '.png'); await page.screenshot({ path: f }); return f; };
  for (let iter = 0; iter < 20000; iter++) {
    const st = await page.evaluate(() => { advanceTime(500); const d = JSON.parse(render_game_to_text()); return { screen: d.screen, overlay: d.overlay, day: d.run && d.run.day, phase: d.run && d.run.phase, ending: d.run && d.run.ending, item: d.detail && d.detail.item, botDone: __bsx.app.bot && __bsx.app.bot.done, t: d.t, served: d.detail && d.detail.served, closeup: d.detail && d.detail.kitchen && d.detail.kitchen.closeup }; });
    const key = st.screen + '|' + st.day + '|' + (st.item ? st.item.kind + st.item.id : '') + '|' + (st.closeup || '');
    if (key !== lastKey) {
      lastKey = key; log.push({ at: st.t, ...st });
      const first = !seen[st.screen + (st.item ? st.item.kind : '') + (st.closeup || '')];
      seen[st.screen + (st.item ? st.item.kind : '') + (st.closeup || '')] = 1;
      if (shots === 'all' || first || (st.item && st.item.kind === 'story')) await shot(st.screen + (st.item ? '-' + (st.item.id || st.item.kind) : '') + (st.closeup ? '-' + st.closeup : '') + '-d' + st.day);
    }
    if (st.screen === 'service' && st.served === 1 && !seen['svc-mid-' + st.day] && st.day <= 2) { seen['svc-mid-' + st.day] = 1; await shot('service-mid-d' + st.day); }
    if (st.t === lastT) stuck++; else stuck = 0; lastT = st.t;
    if (st.screen === 'ending' || st.screen === 'weekResult' || st.botDone) { await page.evaluate(() => advanceTime(2000)); await shot('final-' + st.screen); break; }
    if (mode !== 'week' && (st.day > days || (st.day === days && st.screen === 'ledger' && days < 28))) { await shot('stop-' + st.screen + '-d' + st.day); break; }
    if (Date.now() - t0 > 1000 * 60 * 25) { errors.push('timeout'); break; }
  }
  const final = await page.evaluate(() => ({ text: JSON.parse(render_game_to_text()), bot: __bsx.app.bot && __bsx.app.bot.stats, appErrors: __bsx.errors(), legacy: __bsx.app.legacy, cooked: __bsx.app.state.stats.cooked, history: __bsx.app.state.history.map(h => ({ day: h.day, net: h.cashClose - h.cashOpen, served: h.served, lost: h.lost, grades: h.grades, avgQ: h.avgQ })) }));
  fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify({ policy, seed, days, errors, final, log }, null, 1));
  console.log(JSON.stringify({ errors: errors.slice(0, 10), appErrors: final.appErrors.slice(0, 5), screen: final.text.screen, run: final.text.run, bot: final.bot, cooked: final.cooked, days: final.history.length, ms: Date.now() - t0 }, null, 1));
  await browser.close();
  process.exit(errors.length || final.appErrors.length ? 1 : 0);
})();
