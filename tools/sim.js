// 数值模拟 / 结局回放：用“正常游玩策略”从第 1 日打到结局（不改存档）。
// node tools/sim.js            → 打印各路线结果
// require('./tools/sim').play(policyName, seed) → { state, log }
const BSX = require('../tests/helpers/load.js');
const Run = BSX.require('core/run');
const ST = BSX.require('content/story');
const E = BSX.require('content/events');

// skill：代表性订单的品质分布 [招牌, 家常, 匆忙]
const POLICIES = {
  canteen: { tiers: { oil: 1, material: 1, price: 0 }, skill: [0.6, 0.35, 0.05], prefer: { E07: 'ask', E12: 'help', E29: 'take', E20: 'free', E03: 'more', E05: 'refuse', E14: 'refuse', S12: 'paper', S18: 'cook', S26: 'renew', E22: 'hire' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  private: { tiers: { oil: 2, material: 2, price: 2 }, skill: [0.75, 0.25, 0], prefer: { E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'open', S26: 'renew', E03: 'hold', E22: 'hire' }, menu: ['pidan', 'shengjian', 'noodle', 'soy'] },
  honest: { tiers: { oil: 2, material: 2, price: 1 }, skill: [0.8, 0.2, 0], prefer: { E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'post', S26: 'renew', E08: 'public', E16: 'normal', E04: 'show', E01: 'normal', E22: 'hire', E11: 'some' }, menu: ['pidan', 'shengjian', 'congee', 'soy'] },
  pills: { tiers: { oil: 0, material: 0, price: 1 }, skill: [0.4, 0.5, 0.1], prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S12: 'cheap', S18: 'cook', S26: 'renew', CRISIS: 'hold', E23: 'deny', E18: 'go', E10: 'risk', E04: 'delay', E08: 'silent' }, menu: ['youtiao', 'scallion', 'congee', 'soy'] },
  reopen: { tiers: { oil: 0, material: 0, price: 1 }, skill: [0.6, 0.35, 0.05], prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S12: 'cheap', S18: 'cook', S26: 'renew', CRISIS: 'rectify', E23: 'deny', E18: 'go', E04: 'delay' }, after: { CRISIS: { oil: 2, material: 1, price: 1 } }, menu: ['youtiao', 'scallion', 'congee', 'soy'] },
  average: { tiers: { oil: 1, material: 1, price: 1 }, skill: [0.5, 0.45, 0.05], prefer: { S26: 'renew' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  farewell: { tiers: { oil: 1, material: 1, price: 1 }, skill: [0.6, 0.4, 0], prefer: { S26: 'leave', E22: 'no' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  transfer: { tiers: { oil: 1, material: 2, price: 2 }, skill: [0.2, 0.5, 0.3], prefer: { S26: 'leave', E15: 'take', E01: 'refuse', E08: 'silent', E03: 'hold' }, menu: ['chicken', 'pidan', 'noodle', 'scallion'] },
  bankrupt: { tiers: { oil: 2, material: 2, price: 0 }, skill: [0.1, 0.4, 0.5], prefer: { RESCUE: 'refuse', E12: 'help', E03: 'follow', E22: 'hire' }, menu: ['chicken', 'mutton', 'noodle', 'pidan'] }
};

function choose(state, item, pol) {
  const want = pol.prefer[item.kind === 'crisis' ? 'CRISIS' : item.kind === 'rescue' ? 'RESCUE' : item.id];
  if (item.kind === 'crisis') return want || 'rectify';
  if (item.kind === 'rescue') return want || 'borrow';
  if (item.kind === 'event') { const ev = E.byId[item.id]; return (want && ev.choices.some(c => c.id === want)) ? want : ev.choices[0].id; }
  if (item.kind === 'story' || item.kind === 'node') {
    const sc = ST.all[item.id];
    if (want && Run.findStoryChoice(sc, want, state)) return want;
    let first = null;
    (function walk(b) { b.forEach(x => { if (first) return; if (x.choice) { const c = x.choice.find(c => Run.findStoryChoice(sc, c.id, state)); if (c) first = c.id; } if (x.eventChoice) first = E.byId[x.eventChoice].choices[0].id; if (x.then) walk(x.then); if (x.else) walk(x.else); }); })(sc.beats);
    return first || undefined;
  }
}

function serviceResult(state, pol, holder) {
  const orders = Run.planOrders(state);
  return { orders: orders.map(o => {
    const x = (holder.v = (holder.v * 1103515245 + 12345) % 2147483648) / 2147483648;
    const [a, b] = pol.skill;
    const grade = x < a ? 'sig' : x < a + b ? 'home' : 'rush';
    return { id: o.id, regular: o.regular, items: o.items, grade, quality: grade === 'sig' ? 0.93 : grade === 'home' ? 0.75 : 0.5 };
  }) };
}

function play(name, seed, opts) {
  const pol = POLICIES[name];
  let s = Run.create(Object.assign({ seed }, opts || {}));
  const holder = { v: seed % 2147483647 || 7 };
  const log = [];
  let tiers = Object.assign({}, pol.tiers), guard = 0;
  while (s.phase !== 'ended' && guard++ < 2000) {
    if (['dawn', 'open', 'dusk'].includes(s.phase)) {
      const item = s.pending[0];
      const c = choose(s, item, pol);
      const n = Run.reduce(s, { t: 'resolve', choice: c });
      if (n === s) throw new Error('stuck resolving ' + JSON.stringify(item) + ' choice=' + c + ' day ' + s.day);
      if (item.kind === 'crisis' && pol.after && pol.after.CRISIS) tiers = Object.assign({}, pol.after.CRISIS);
      s = n;
    } else if (s.phase === 'prep') {
      for (const k of ['oil', 'material', 'price']) s = Run.reduce(s, { t: 'tier', key: k, v: tiers[k] });
      const want = pol.menu.concat(['congee', 'youtiao', 'soy', 'scallion', 'egg', 'noodle']);
      for (const id of s.menu.slice()) if (!want.slice(0, 4).includes(id)) s = Run.reduce(s, { t: 'dish', id });
      for (const id of want) if (s.menu.length < Run.menuSize(s)) s = Run.reduce(s, { t: 'dish', id });
      s = Run.reduce(s, { t: 'confirmPrep' });
    } else if (s.phase === 'service') {
      s = Run.reduce(s, { t: 'serviceDone', result: serviceResult(s, pol, holder) });
    } else if (s.phase === 'ledger') {
      log.push({ day: s.day, cash: s.cash / 100, rep: s.rep, burn: s.burn, net: (s.ledger.cashClose - s.ledger.cashOpen) / 100, served: s.ledger.served, flow: s.ledger.flow });
      s = Run.reduce(s, { t: 'nextDay' });
    }
  }
  return { state: s, log };
}

module.exports = { play, POLICIES };

if (require.main === module) {
  const rows = [];
  for (const name of Object.keys(POLICIES)) {
    const ends = {};
    let cash = 0, rep = 0, burn = 0;
    const N = 20;
    for (let i = 0; i < N; i++) {
      const r = play(name, 1000 + i * 17);
      ends[r.state.ending.id] = (ends[r.state.ending.id] || 0) + 1;
      cash += r.state.cash / 100; rep += r.state.rep; burn += r.state.burn;
    }
    rows.push({ name, ends: JSON.stringify(ends), cash: Math.round(cash / N), rep: Math.round(rep / N), burn: Math.round(burn / N) });
  }
  console.table(rows);
}
