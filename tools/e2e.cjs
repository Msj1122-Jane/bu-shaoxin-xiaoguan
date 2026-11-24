// 端到端回放：机器人用真实指针事件从"开店"玩到结局。
// node tools/e2e.cjs [--policy average] [--skill good] [--seed 7] [--days 28] [--out output/e2e/xxx] [--shots key|all|none]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const policy = arg('policy', 'average'), skill = arg('skill', 'good'), seed = +arg('seed', 7), days = +arg('days', 28), out = arg('out', 'output/e2e/' + policy), shots = arg('shots', 'key');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:4173/?dev'); await p.waitForFunction(() => window.render_game_to_text, null, { timeout: 8000 });
  await p.waitForFunction(() => JSON.parse(render_game_to_text()).screen !== 'loading', null, { timeout: 15000 });
  await p.evaluate(([policy, skill, seed]) => { localStorage.clear(); __bsx.newRun({ seed }); window.__bot = __bsx.bot({ policy, skill, fast: true, seed }); }, [policy, skill, seed]);
  const log = []; let last = '', n = 0, t0 = Date.now(); const seen = {};
  for (let i = 0; i < 60000; i++) {
    const st = await p.evaluate(() => { advanceTime(400); const d = JSON.parse(render_game_to_text()); const a = __bsx.app; return { screen: d.screen, day: d.run && d.run.day, phase: d.run && d.run.phase, cash: d.run && d.run.cash, rep: d.run && d.run.rep, burn: d.run && d.run.burn, ending: d.run && d.run.ending, errors: d.errors, sp: a.screen && a.screen.phase, scene: d.detail && d.detail.director && d.detail.director.scene, t: d.detail && d.detail.t }; });
    const key = st.screen + '/' + st.day + '/' + (st.scene || st.sp || '');
    if (key !== last) {
      last = key;
      const tag = st.screen + (st.scene ? '-' + st.scene : '') + (st.sp ? '-' + st.sp : '');
      const want = shots === 'all' || (shots === 'key' && (!seen[tag] || (st.screen === 'shift' && st.sp === 'open' && [1, 3, 8, 12, 18, 22, 27, 28].includes(st.day)) || (st.screen === 'night' && [1, 7, 14, 21, 26, 28].includes(st.day)) || (st.screen === 'prep' && [2, 3, 5, 8, 15].includes(st.day))));
      seen[tag] = 1;
      if (want && shots !== 'none') { if (st.screen === 'shift' && st.sp === 'open') await p.evaluate(() => advanceTime(45000)); else await p.evaluate(() => advanceTime(700)); await p.screenshot({ path: path.join(out, String(++n).padStart(3, '0') + '-d' + st.day + '-' + tag + '.png') }); }
      if (st.screen === 'night') { const d = await p.evaluate(() => JSON.parse(render_game_to_text()).detail); log.push({ day: st.day, cash: st.cash, rep: st.rep, burn: st.burn, net: d.net, rev: d.rev, served: d.served, stamp: d.stamp }); console.log('day', st.day, 'rev', d.rev, 'net', d.net, 'served', d.served, 'cash', st.cash, 'rep', st.rep, 'burn', st.burn, d.stamp); }
    }
    if (st.errors > 0) { console.log('GAME ERROR at', key); break; }
    if (st.screen === 'ending' || (st.day > days)) break;
  }
  const fin = await p.evaluate(() => { const d = JSON.parse(render_game_to_text()); return { run: d.run, detail: d.detail, errors: __bsx.errors(), bot: window.__bot.log, stats: __bsx.app.state.stats, regs: __bsx.app.state.reg, mementos: __bsx.app.state.mementos.map(m => m.id) }; });
  await p.evaluate(() => advanceTime(4000)); await p.screenshot({ path: path.join(out, 'final.png') });
  fs.writeFileSync(path.join(out, 'log.json'), JSON.stringify({ policy, skill, seed, days: log, final: fin, pageErrors: errs }, null, 1));
  console.log('FINAL', JSON.stringify({ day: fin.run.day, ending: fin.run.ending, cash: fin.run.cash, rep: fin.run.rep, burn: fin.run.burn, aff: fin.run.aff, detail: fin.detail && { stage: fin.detail.stage, title: fin.detail.title, sign: fin.detail.sign } }));
  console.log('choices:', fin.bot.join(' | '));
  console.log('ERRORS', JSON.stringify(errs.concat(fin.errors)).slice(0, 2500), 'wall', Math.round((Date.now() - t0) / 1000) + 's');
  await b.close();
})();
