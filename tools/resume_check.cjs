// 刷新恢复：设置保留；晨备/营业中/事件后/晚账后刷新均可继续；主档损坏读备档
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const load = async () => { await p.goto('http://127.0.0.1:4173/'); await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title'); };
  const cont = async () => p.evaluate(() => { __bsx.tapId('title_continue'); advanceTime(500); const d = JSON.parse(render_game_to_text()); return d.screen + ' d' + d.run.day + ' ' + d.run.phase; });
  await load(); const r = {};
  await p.evaluate(() => { localStorage.clear(); const a = __bsx.app; a.settings.reduceMotion = true; a.settings.textScale = 1.15; a.settings.assistCook = true; a.applySettings(); __bsx.newRun({ seed: 21 }); BSX.require('dev/autoplay').fastForward(a, 5); });
  await load(); r.settings = await p.evaluate(() => [__bsx.app.settings.reduceMotion, __bsx.app.settings.textScale, __bsx.app.settings.assistCook]);
  r.prep = await cont();
  await p.evaluate(() => { __bsx.tapId('prep_open'); advanceTime(800); }); 
  r.phaseAfterOpen = await p.evaluate(() => JSON.parse(render_game_to_text()).run.phase);
  await p.evaluate(() => { BSX.require('dev/autoplay').start(__bsx.app, { fast: true, stopAt: a => a.screen.name === 'service' && a.screen.results.length >= 1 }); for (let i = 0; i < 300 && !(__bsx.app.bot.done); i++) advanceTime(200); });
  r.midService = await p.evaluate(() => ({ served: __bsx.app.screen.results.length, cash: __bsx.app.state.cash }));
  await load(); r.afterMidRefresh = await cont(); r.servedAfter = await p.evaluate(() => __bsx.app.screen.results ? __bsx.app.screen.results.length : null);
  await p.evaluate(() => { BSX.require('dev/autoplay').start(__bsx.app, { fast: true, stopAt: a => a.screen.name === 'ledger' }); for (let i = 0; i < 600 && !__bsx.app.bot.done; i++) advanceTime(200); });
  r.ledgerCash = await p.evaluate(() => __bsx.app.state.cash);
  await load(); r.afterLedgerRefresh = await cont(); r.cashSame = await p.evaluate(c => __bsx.app.state.cash === c, r.ledgerCash);
  // 主档损坏
  await p.evaluate(() => { const v = localStorage.getItem('bsx.run.v3'); localStorage.setItem('bsx.run.v3', v.slice(0, 50) + 'XX'); });
  await load(); r.corruptNotice = await p.evaluate(() => JSON.parse(render_game_to_text()).detail.notice); r.afterCorrupt = await cont();
  r.errors = errs; console.log(JSON.stringify(r, null, 1)); await b.close();
})();
