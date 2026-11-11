// 剧情新美术截图检查：node tools/story_shots.cjs → output/e2e/story/
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'output/e2e/story/';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const st = () => p.evaluate(() => JSON.parse(render_game_to_text()));
  const shot = async n => { await p.screenshot({ path: OUT + n + '.png' }); };
  const adv = ms => p.evaluate(m => advanceTime(m), ms);
  await p.goto('http://127.0.0.1:4173/?intro'); await p.waitForFunction(() => window.render_game_to_text, null, { timeout: 8000 });
  await adv(200); await shot('00_loading');
  await p.waitForFunction(() => JSON.parse(render_game_to_text()).screen !== 'loading' || JSON.parse(render_game_to_text()).detail.state === 'done', null, { timeout: 20000 });
  await p.goto('http://127.0.0.1:4173/'); await p.waitForFunction(() => window.render_game_to_text && JSON.parse(render_game_to_text()).screen === 'title', null, { timeout: 20000 });
  await p.evaluate(() => new Promise(r => { const A = BSX.require('game/assets'); (function w() { if (A.groupState.story === 'done') r(); else setTimeout(w, 100); })(); }));
  await adv(600); await shot('01_title');
  await p.evaluate(() => __bsx.tapId('title_ledger')); await adv(300); await shot('02_ledger_empty');
  await p.evaluate(() => __bsx.tapId('ledger_close'));
  await p.evaluate(() => { localStorage.clear(); __bsx.newRun({ seed: 7 }); }); await adv(1200);
  // 第 1 日：章节卡 → 对白 → 账本 → 回忆
  const seen = {};
  for (let i = 0; i < 80; i++) {
    const s = await st(); const d = s.detail && s.detail.director; if (!d) break;
    const key = (d.overlay || '') + (d.line ? 'line' : '') + (d.act ? 'act' : '') + (d.choice ? 'choice' : '');
    const tag = s.detail.item && s.detail.item.id;
    if (d.overlay && !seen[tag + d.overlay]) { seen[tag + d.overlay] = 1; await adv(1500); await shot('10_' + tag + '_' + d.overlay); }
    if (d.line && d.line.who !== 'zhou' && !seen[tag + d.line.who]) { seen[tag + d.line.who] = 1; await adv(900); await shot('11_' + tag + '_say_' + d.line.who); }
    if (d.line && d.line.who === 'zhou' && !seen[tag + 'zhou']) { seen[tag + 'zhou'] = 1; await adv(900); await shot('11_' + tag + '_say_zhou'); }
    if (d.act) { await p.evaluate(a => { const h = __bsx.hits().find(x => x.id === 'cs_act'); __bsx.tapId('cs_act'); }, d.act); await p.evaluate(() => { const d = JSON.parse(render_game_to_text()).detail.director; if (d && d.act && d.act.kind === 'hold') { __bsx.holdAt && __bsx.holdAt(d.act.x, d.act.y, 1300); } }); }
    if (d.choice) { await p.evaluate(c => __bsx.tapId('choice_' + c), d.choice[0].id); }
    await p.evaluate(() => { __bsx.tap(640, 400); }); await adv(400);
    if (s.screen !== 'story') break;
  }
  console.log('after day1', JSON.stringify((await st()).screen));
  // 直接构造状态看 S24 对质 + 老金立绘
  await p.evaluate(() => { const app = __bsx.app; const s = JSON.parse(JSON.stringify(app.state)); s.day = 24; s.phase = 'dusk'; s.pages = [1, 2, 3, 4]; s.pending = [{ kind: 'story', id: 'S24' }]; app.state = s; app.go(BSX.require('ui/s_story').Story); });
  for (let i = 0; i < 40; i++) {
    const s = await st(); const d = s.detail && s.detail.director; if (!d || s.screen !== 'story') break;
    if (d.line && !seen['S24' + d.line.who]) { seen['S24' + d.line.who] = 1; await adv(900); await shot('20_S24_' + d.line.who); }
    if (d.choice) { await adv(300); await shot('21_S24_choice'); break; }
    await p.evaluate(() => __bsx.tap(640, 400)); await adv(300);
  }
  // R_zhao_7（赵爷爷家）
  await p.evaluate(() => { const app = __bsx.app; const s = JSON.parse(JSON.stringify(app.state)); s.phase = 'dusk'; s.pending = [{ kind: 'node', id: 'R_zhao_7', who: 'zhao', idx: 2 }]; app.state = s; app.go(BSX.require('ui/s_story').Story); });
  for (let i = 0; i < 40; i++) {
    const s = await st(); const d = s.detail && s.detail.director; if (!d || s.screen !== 'story') break;
    if (d.overlay && !seen['Z' + d.overlay]) { seen['Z' + d.overlay] = 1; await adv(1600); await shot('30_zhao7_' + d.overlay); }
    if (d.line && d.bg && !seen.Zbg) { seen.Zbg = 1; await adv(900); await shot('31_zhao7_home'); }
    await p.evaluate(() => __bsx.tap(640, 400)); await adv(300);
  }
  // 结局页
  await p.evaluate(() => { const app = __bsx.app; const s = JSON.parse(JSON.stringify(app.state)); s.phase = 'ended'; s.ending = { id: 'E_TRUTH' }; app.state = s; app.go(BSX.require('ui/s_ending').Ending); });
  await adv(1200); await shot('40_end_art'); await adv(3500); await shot('41_end_text');
  await p.evaluate(() => { __bsx.app.legacy.pages = [1, 2, 3, 5]; __bsx.app.openOverlay(BSX.require('ui/s_basic').Ledger, {}); }); await adv(300); await shot('42_ledger_some');
  console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
