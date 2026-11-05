// 结局后流程：结局页 → 分享卡 → 继承重开（选传承物）→ 常营业选主题开门 → 店史
const { chromium } = require('playwright');
const fs = require('fs'); const out = 'output/e2e/after-ending'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://127.0.0.1:4173/'); await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title');
  const S = async (n) => { await p.evaluate(() => advanceTime(1600)); await p.screenshot({ path: `${out}/${n}.png` }); return p.evaluate(() => JSON.parse(render_game_to_text())); };
  const r = {};
  await p.evaluate(() => { localStorage.clear(); __bsx.newRun({ seed: 9 }); __bsx.toEnding('honest'); });
  let d = await S('01-ending'); r.ending = d.detail;
  await p.evaluate(() => __bsx.tapId('end_share')); d = await S('02-share'); r.share = d.detail;
  const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await p.evaluate(() => __bsx.tapId('share_save')); const file = await dl; r.download = file ? file.suggestedFilename() : null;
  if (file) await file.saveAs(`${out}/share-card.png`);
  await p.evaluate(() => { advanceTime(500); __bsx.tapId('share_close'); advanceTime(300); __bsx.tapId('end_newmonth'); });
  d = await S('03-newmonth'); r.newMonth = d.detail;
  await p.evaluate(() => { const h = __bsx.hits().find(x => x.id.startsWith('heir_') && !x.disabled); if (h) __bsx.tapId(h.id); advanceTime(200); __bsx.tapId('nm_go'); });
  d = await S('04-newrun'); r.newRun = { screen: d.screen, day: d.run.day, gen: __gen = await p.evaluate(() => [__bsx.app.state.generation, __bsx.app.state.heirloom, __bsx.app.state.prefer.length]) };
  await p.evaluate(() => { __bsx.app.go(BSX.require('ui/s_basic').Title); advanceTime(300); __bsx.tapId('title_week'); });
  d = await S('05-weekpick'); r.weekPick = d.detail;
  await p.evaluate(() => { __bsx.tapId('wk_T_RAIN'); advanceTime(100); __bsx.tapId('goal_g2'); advanceTime(100); __bsx.tapId('wk_go'); });
  d = await S('06-week'); r.week = { screen: d.screen, mode: d.run.mode, weather: d.run && d.scene.weather };
  await p.evaluate(() => { __bsx.app.go(BSX.require('ui/s_codex').Codex, { from: 'title' }); advanceTime(200); __bsx.tapId('tab_history'); });
  d = await S('07-history'); r.legacy = await p.evaluate(() => ({ runs: __bsx.app.legacy.runs, endings: __bsx.app.legacy.endings, letters: __bsx.app.legacy.letters.length, heirlooms: __bsx.app.legacy.heirlooms }));
  r.errors = errs; console.log(JSON.stringify(r, null, 1)); await b.close();
})();
