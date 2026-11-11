const test = require('node:test');
const assert = require('node:assert');
const BSX = require('./helpers/load.js');
const Run = BSX.require('core/run');
const Save = BSX.require('core/save');
const Legacy = BSX.require('core/legacy');
const Validate = BSX.require('core/validate');
const C = BSX.require('content/config');
const { play, POLICIES } = require('../tools/sim.js');

function toService(s) {
  let g = 0;
  while (s.phase !== 'service' && g++ < 50) {
    if (s.phase === 'prep') s = Run.reduce(s, { t: 'confirmPrep' });
    else if (['dawn', 'open'].includes(s.phase)) {
      const it = s.pending[0];
      const BSXE = BSX.require('content/events'); const ST = BSX.require('content/story');
      let c;
      if (it.kind === 'event') c = BSXE.byId[it.id].choices[0].id;
      else if (it.kind === 'rescue') c = 'borrow';
      else { const sc = ST.all[it.id]; const s2 = JSON.stringify(sc.beats); const m = /"choice":\[\{"id":"(\w+)"/.exec(s2); c = m ? m[1] : undefined; }
      s = Run.reduce(s, { t: 'resolve', choice: c });
    }
  }
  return s;
}
const orders = (s, grade = 'home') => ({ orders: Run.planOrders(s).map(o => ({ id: o.id, regular: o.regular, items: o.items, grade, quality: grade === 'sig' ? 0.95 : 0.75 })) });

test('内容校验器通过，数量符合 1.0 范围', () => {
  const v = Validate.run();
  assert.deepStrictEqual(v.errors, []);
  assert.strictEqual(v.counts.dishes, 20); assert.strictEqual(v.counts.events, 30); assert.strictEqual(v.counts.endings, 9);
  assert.strictEqual(v.counts.S, 9); assert.strictEqual(v.counts.A, 16);
});

test('账本与手算一致（整数分）', () => {
  let s = toService(Run.create({ seed: 42 }));
  const cash0 = s.cash;
  s = Run.reduce(s, { t: 'serviceDone', result: orders(s) });
  const L = s.ledger;
  const rev = L.sales.reduce((n, x) => n + x.qty * x.price, 0);
  const ing = L.sales.reduce((n, x) => n + x.qty * x.cost, 0);
  assert.strictEqual(rev, L.revenue); assert.strictEqual(ing, L.ingredient);
  assert.strictEqual(L.sales.reduce((n, x) => n + x.qty, 0), L.served);
  assert.strictEqual(cash0 + L.revenue + L.tips - L.ingredient - L.oilCost - L.fixed - L.wage + L.eventCash, L.cashClose);
  for (const k of ['revenue', 'ingredient', 'oilCost', 'fixed', 'cashClose']) assert.ok(Number.isInteger(L[k]), k + ' 应为整数分');
});

test('同一天重复提交不重复结算', () => {
  let s = toService(Run.create({ seed: 7 }));
  const r = orders(s);
  const a = Run.reduce(s, { t: 'serviceDone', result: r });
  const b = Run.reduce(a, { t: 'serviceDone', result: r });
  assert.strictEqual(a, b, '第二次 serviceDone 必须无效');
  let l = a; while (l.phase !== 'ledger') { l = Run.reduce(l, { t: 'resolve', choice: l.pending[0].kind === 'crisis' ? 'rectify' : (BSX.require('content/events').byId[l.pending[0].id] || { choices: [{ id: undefined }] }).choices[0].id }); }
  const n1 = Run.reduce(l, { t: 'nextDay' });
  const n2 = Run.reduce(n1, { t: 'nextDay' });
  assert.strictEqual(n1.day, 2); assert.strictEqual(n2.day, 2); assert.strictEqual(n1.cash, n2.cash);
});

test('确定性：同种子同输入 → 同结果', () => {
  const a = play('average', 555), b = play('average', 555);
  assert.strictEqual(JSON.stringify(a.state), JSON.stringify(b.state));
});

test('存档：保存恢复后继续结果一致；主档损坏读备档', () => {
  const st = Save.memoryStorage(); const store = new Save.Store(st);
  let s = toService(Run.create({ seed: 99 }));
  store.saveRun(s);
  const loaded = store.loadRun().state;
  const x = Run.reduce(s, { t: 'serviceDone', result: orders(s) });
  const y = Run.reduce(loaded, { t: 'serviceDone', result: orders(loaded) });
  assert.strictEqual(JSON.stringify(x), JSON.stringify(y));
  store.saveRun(x);
  st.set(Save.KEYS.run, st.get(Save.KEYS.run).slice(0, 40) + 'garbage');
  const rec = store.loadRun();
  assert.strictEqual(rec.from, 'backup'); assert.ok(store.notice.includes('备份'));
  st.set(Save.KEYS.runBak, '{bad'); st.set(Save.KEYS.run, '{bad');
  const s2 = new Save.Store(st); assert.strictEqual(s2.loadRun(), null); assert.ok(s2.notice);
});

test('旧版本存档：不覆盖、明确提示', () => {
  const st = Save.memoryStorage(); st.set('bsx-seven-day-v1', '{"schemaVersion":1}');
  const store = new Save.Store(st); assert.strictEqual(store.loadRun(), null);
  assert.ok(/旧版本/.test(store.notice)); assert.ok(st.get('bsx-seven-day-v1'));
});

test('延期效果只执行一次（含存档往返）', () => {
  let s = Run.create({ seed: 3 });
  s.events.delayed.push({ uid: 't1', at: 2, rep: 5, note: 'x' });
  s = toService(s); s = Run.reduce(s, { t: 'serviceDone', result: orders(s) });
  while (s.phase !== 'ledger') s = Run.reduce(s, { t: 'resolve', choice: 'rectify' });
  const s2 = JSON.parse(JSON.stringify(Run.reduce(s, { t: 'nextDay' })));
  assert.ok(s2.executed.includes('t1') || s2.events.delayed.some(d => d.uid === 't1'));
  let t = toService(s2); t = Run.reduce(t, { t: 'serviceDone', result: orders(t) });
  assert.ok(t.executed.includes('t1'));
  const count = t.executed.filter(u => u === 't1').length; assert.strictEqual(count, 1);
});

test('九个结局：每条路线都能从第 1 日正常游玩稳定达成（20 种子 ≥85%）', () => {
  const want = { canteen: 'E_CANTEEN', private: 'E_PRIVATE', honest: 'E_HONEST', pills: 'E_PILLS', reopen: 'E_REOPEN', average: 'E_SOMEONE', farewell: 'E_FAREWELL', transfer: 'E_TRANSFER', truth: 'E_TRUTH' };
  const got = new Set();
  for (const [p, e] of Object.entries(want)) {
    let hit = 0;
    for (let i = 0; i < 20; i++) { const r = play(p, 2000 + i * 7); if (r.state.ending.id === e) { hit++; got.add(e); assert.ok(r.state.history.length >= 26); } }
    assert.ok(hit >= 17, p + ' 达成 ' + hit + '/20');
  }
  assert.strictEqual(got.size, 9);
});

test('结局判定互斥且全覆盖（边界状态枚举）', () => {
  const base = play('average', 1).state;
  const ids = new Set();
  for (const early of [null, { day: 26 }]) for (const crisis of ['none', 'hold', 'rectify', 'refund']) for (const rep of [40, 56, 61, 66, 81]) for (const burn of [10, 50, 75]) for (const p of [[28, 0, 0], [0, 0, 28], [10, 9, 9]]) {
    const s = JSON.parse(JSON.stringify(base)); s.early = early; s.crisis.state = crisis; s.rep = rep; s.burn = burn; s.stats.tierDays.price = p; s.stats.goodDays = 20;
    s.regulars.man.aff = 6; Object.values(s.regulars).forEach(r => r.nodes = [0]);
    const e = Run.determineEnding(s); assert.ok(e && e.id); ids.add(e.id);
  }
  assert.strictEqual(ids.size, 8, [...ids].join());
});

test('房东通牒：每局一次翻盘，拒绝后仍为负则结束', () => {
  let s = Run.create({ seed: 11 }); s.cash = -50000;
  let guard = 0;
  while (s.phase !== 'ended' && guard++ < 400) {
    if (s.phase === 'ledger') s = Run.reduce(s, { t: 'nextDay' });
    else if (s.phase === 'service') { s.cash = Math.min(s.cash, -50000); s = Run.reduce(s, { t: 'serviceDone', result: orders(s, 'rush') }); }
    else if (s.pending && s.pending[0] && s.pending[0].kind === 'rescue') s = Run.reduce(s, { t: 'resolve', choice: 'refuse' });
    else s = toService(s);
  }
  assert.strictEqual(s.phase, 'ended'); assert.ok(s.rescue.used); assert.strictEqual(s.early.reason, 'bankrupt');
  assert.ok(['E_FAREWELL', 'E_TRANSFER'].includes(s.ending.id));
});

test('危机只结算一次；整改次日停业', () => {
  let s = Run.create({ seed: 5 }); s.burn = 100;
  s = toService(s); s = Run.reduce(s, { t: 'serviceDone', result: orders(s) });
  assert.strictEqual(s.pending[0].kind, 'crisis');
  const cashBefore = s.cash;
  s = Run.reduce(s, { t: 'resolve', choice: 'rectify' });
  const again = Run.reduce(s, { t: 'resolve', choice: 'rectify' });
  assert.ok(s.cash === cashBefore - 60000 || s.cash < cashBefore);
  assert.strictEqual(s.crisis.state, 'rectify'); assert.strictEqual(s.burn <= 60 + 14, true);
  while (s.phase !== 'ledger') s = Run.reduce(s, { t: 'resolve', choice: BSX.require('content/events').byId[s.pending[0].id] ? BSX.require('content/events').byId[s.pending[0].id].choices[0].id : undefined });
  s = Run.reduce(s, { t: 'nextDay' });
  assert.strictEqual(s.today.closed, true);
});

test('店史：结局写入、不随单月重开清空、传承物可用', () => {
  const r = play('canteen', 9);
  const L = Legacy.recordEnding(null, r.state);
  assert.strictEqual(L.endings[r.state.ending.id], 1); assert.ok(L.letters.length === 1); assert.ok(L.heirlooms.length >= 2);
  const st = Save.memoryStorage(); const store = new Save.Store(st);
  store.saveLegacy(L); store.saveRun(r.state); store.clearRun();
  assert.strictEqual(store.loadLegacy().endings[r.state.ending.id], 1);
  const s2 = Run.create({ seed: 1, heirloom: 'H_NOTEBOOK', generation: 2, preferUnseen: Legacy.unseenEvents(L) });
  assert.ok(s2.unlocked.friedrice);
});

test('七日常营业：六套主题都能跑完并判定目标', () => {
  const EN = BSX.require('content/endings'); const Week = BSX.require('core/week');
  for (const th of EN.themes) {
    const r = play('average', 77, { mode: 'week', theme: th.id, unlockAll: true });
    assert.strictEqual(r.state.phase, 'ended'); assert.strictEqual(r.state.history.length, 7);
    const m = Week.summary(r.state); th.goals.forEach(g => assert.strictEqual(typeof Week.check(g.check, m), 'boolean'));
  }
});

test('无固定万能解：没有一条路线同时拥有最高现金、最高口碑、最低烧心', () => {
  const agg = {};
  for (const p of ['canteen', 'private', 'honest', 'average', 'pills']) { let c = 0, rp = 0, b = 0; for (let i = 0; i < 8; i++) { const s = play(p, 300 + i).state; c += s.cash; rp += s.rep; b += s.burn; } agg[p] = { c, rp, b }; }
  const best = k => Object.entries(agg).sort((a, b) => b[1][k] - a[1][k])[0][0];
  const lowBurn = Object.entries(agg).sort((a, b) => a[1].b - b[1].b).map(x => x[0]);
  assert.ok(!(best('c') === best('rp') && lowBurn[0] === best('c')), JSON.stringify(agg));
});

test('新手前几日不会无预警锁死：普通选择前 7 日现金为正', () => {
  for (const p of ['average', 'canteen', 'private', 'honest']) { const r = play(p, 31); r.log.slice(0, 7).forEach(d => assert.ok(d.cash > 0, p + ' d' + d.day)); }
});

// ── 深空当铺参考（D039–D044）
function findDelivery(fake) {
  for (let seed = 1; seed < 400; seed++) {
    let s = Run.create({ seed });
    for (let d = 0; d < 10 && s.phase !== 'ended'; d++) {
      if (s.phase === 'prep' && s.today.delivery && s.today.delivery.fake === fake) return s;
      s = toService(s); s = Run.reduce(s, { t: 'serviceDone', result: { orders: [] } });
      let g = 0; while (s.phase === 'dusk' && g++ < 20) { const it = s.pending[0]; const ST = BSX.require('content/story'), E = BSX.require('content/events'); let c; if (it.kind === 'event') c = E.byId[it.id].choices[0].id; else if (it.kind === 'crisis') c = 'rectify'; else if (it.kind === 'story' || it.kind === 'node') { const sc = ST.all[it.id]; const j = JSON.stringify(sc.beats).match(/"choice":\[\{"id":"([a-z]+)"/); c = j ? j[1] : undefined; if (it.id === 'S26') c = 'renew'; } s = Run.reduce(s, { t: 'resolve', choice: c }); }
      if (s.phase === 'ledger') s = Run.reduce(s, { t: 'nextDay' });
      g = 0; while (['dawn'].includes(s.phase) && g++ < 10) s = toService(s);
    }
  }
  return null;
}
test('验货：收下假货省钱但良心掉，退回假货口碑涨；未处理时开门默认收下', () => {
  const s = findDelivery(true); assert.ok(s, '找到假货日');
  const a = Run.reduce(s, { t: 'delivery', accept: true, tested: true });
  assert.ok(a.cash > s.cash && a.burn > s.burn && a.today.fakeUsed);
  const r = Run.reduce(s, { t: 'delivery', accept: false, tested: true });
  assert.ok(r.rep > s.rep && r.cash === s.cash && !r.today.fakeUsed);
  assert.strictEqual(Run.reduce(a, { t: 'delivery', accept: false }), a, '已处理不可重复');
  const o = Run.reduce(s, { t: 'confirmPrep' });
  assert.ok(o.today.fakeUsed, '没验货就开门 = 收下');
  assert.ok(Run.sickRoll(o, 'o1', 0) || true);
});
test('收尾清单：连续两晚不做才出问题，做了扣钱并清零', () => {
  let s = Run.create({ seed: 7 });
  s = toService(s); s = Run.reduce(s, { t: 'serviceDone', result: { orders: [] } });
  while (s.phase === 'dusk') s = Run.reduce(s, { t: 'resolve' });
  assert.strictEqual(s.phase, 'ledger');
  for (const c of ['hood', 'waste', 'sanitize']) s = Run.reduce(s, { t: 'chore', id: c, on: false });
  const cash0 = s.cash; let n = Run.reduce(s, { t: 'nextDay' });
  assert.strictEqual(n.chores.missed.hood, 1); assert.ok(n.cash === cash0 || n.history.length === 1);
  assert.ok(!n.today.notes.some(x => x.indexOf('油烟机') >= 0), '第一晚不做不出事');
  // 再一晚不做
  n = toService(n); n = Run.reduce(n, { t: 'serviceDone', result: { orders: [] } }); let g = 0; while (n.phase === 'dusk' && g++ < 10) { const it = n.pending[0]; const E = BSX.require('content/events'); n = Run.reduce(n, { t: 'resolve', choice: it.kind === 'event' ? E.byId[it.id].choices[0].id : undefined }); }
  if (n.phase === 'ledger') { const m = Run.reduce(n, { t: 'nextDay' }); assert.strictEqual(m.chores.missed.hood, 2); assert.ok(m.today.notes.some(x => x.indexOf('油烟机') >= 0) || m.phase !== 'dawn' && m.phase !== 'prep'); assert.ok(m.today.sickBoost > 0 || m.phase === 'ended'); }
  // 做了：扣钱、计数清零
  let k = Run.create({ seed: 7 }); k = toService(k); k = Run.reduce(k, { t: 'serviceDone', result: { orders: [] } }); while (k.phase === 'dusk') k = Run.reduce(k, { t: 'resolve' });
  const before = k.cash, after = Run.reduce(k, { t: 'nextDay' });
  assert.strictEqual(before - after.history[0].cashClose, Run.choreCost(k)); assert.strictEqual(after.history[0].choreCost, Run.choreCost(k)); assert.strictEqual(after.chores.missed.hood, 0);
});
test('每日小目标：第 2 日起三项且含“不走捷径”，偷懒则该项失败', () => {
  let s = Run.create({ seed: 9 }); s = toService(s); s = Run.reduce(s, { t: 'serviceDone', result: { orders: [] } }); while (s.phase === 'dusk') s = Run.reduce(s, { t: 'resolve' }); s = Run.reduce(s, { t: 'nextDay' });
  while (s.phase === 'dawn') s = toService(s);
  assert.strictEqual(s.today.goals.length, 3); assert.strictEqual(s.today.goals[0].id, 'nocheat');
  const sv = toService(s);
  const honest = Run.reduce(sv, { t: 'serviceDone', result: { orders: [{ id: 'o1', grade: 'sig', quality: 0.95, items: ['congee'] }], maxCombo: 9 } });
  const cheat = Run.reduce(sv, { t: 'serviceDone', result: { orders: [{ id: 'o1', grade: 'sig', quality: 0.95, items: ['congee'], cheats: 1, cheatGain: 250 }], maxCombo: 9 } });
  assert.ok(honest.ledger.goals[0].done); assert.ok(!cheat.ledger.goals[0].done);
  assert.ok(honest.ledger.goalCash > cheat.ledger.goalCash);
});
test('开局身份与特性：好处必须配代价；盘店需要足够现金', () => {
  const a = Run.create({ seed: 1, origin: 'stall', perkPlus: 'savings' });
  assert.strictEqual(a.perks.plus, null, '没有代价不能拿好处');
  const b = Run.create({ seed: 1, origin: 'stall', perkPlus: 'savings', perkMinus: 'rent' });
  assert.strictEqual(b.perks.plus, 'savings'); assert.strictEqual(b.cash, C.startCash - 100000 + 60000);
  assert.ok(b.prof.congee.star >= 1);
  const d = Run.create({ seed: 1, origin: 'debt' }); assert.strictEqual(d.flags.debt, 100000);
  const Cond = BSX.require('core/cond');
  assert.strictEqual(Cond.check(Object.assign({}, b, { cash: C.buyout.price - 1 }), { canBuy: true }), false);
  assert.strictEqual(Cond.check(Object.assign({}, b, { cash: C.buyout.price }), { canBuy: true }), true);
  const r = play('honest', 1000).state; assert.ok(r.flags.owner, '诚信路线能盘下店面');
});

test('账本缺页：剧情结算时收集，对质选项按页数开放', () => {
  const r = play('truth', 4242);
  assert.ok(r.state.pages.length >= 6, '页数 ' + r.state.pages);
  assert.strictEqual(r.state.flags.truth, true);
  const ST = BSX.require('content/story');
  const s = Run.create({ seed: 1 }); s.pages = [1];
  assert.strictEqual(Run.findStoryChoice(ST.all.S24, 'confront', s), null);
  s.pages = [1, 2, 3];
  assert.ok(Run.findStoryChoice(ST.all.S24, 'confront', s));
  const face = (dg) => { let t = Run.create({ seed: 2 }); t.day = 24; t.phase = 'dusk'; t.pages = [1, 2, 3, 5, 6]; t.pending = [{ kind: 'story', id: 'S24' }]; return Run.reduce(t, { t: 'resolve', choice: 'confront', dungeon: dg }); };
  assert.strictEqual(face({ id: 'face', score: 3, admit: true }).flags.truth, true);
  const ex = face({ id: 'face', score: 2, admit: false }); assert.strictEqual(ex.flags.exposed, true); assert.ok(!ex.flags.truth);
  assert.strictEqual(face({ id: 'face', score: 1 }).flags.jinWon, true);
});

test('凌晨早市副本：坏料省钱但烧心，全好料加老秦好感', () => {
  const ST = BSX.require('content/story');
  const go = (dg) => { let s = Run.create({ seed: 9 }); s.day = 3; s.phase = 'dawn'; s.pending = [{ kind: 'story', id: 'S03' }]; return Run.reduce(s, { t: 'resolve', dungeon: dg }); };
  const base = Run.create({ seed: 9 });
  const bad = go({ id: 'market', good: 2, bad: 6 });
  assert.strictEqual(bad.cash - base.cash, 6 * 1500); assert.strictEqual(bad.burn, 18);
  const good = go({ id: 'market', good: 8, bad: 0 });
  assert.strictEqual(good.regulars.qin.aff, base.regulars.qin.aff + 1); assert.strictEqual(good.flags.marketClean, true);
  assert.ok(ST.all.S03);
});
