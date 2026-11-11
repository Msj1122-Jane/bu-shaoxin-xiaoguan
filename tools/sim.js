// 数值模拟 / 结局回放：用“正常游玩策略”从第 1 日打到结局（不改存档）。
// node tools/sim.js            → 打印各路线结果
// require('./tools/sim').play(policyName, seed) → { state, log }
const BSX = require('../tests/helpers/load.js');
const Run = BSX.require('core/run');
const ST = BSX.require('content/story');
const E = BSX.require('content/events');

// skill：代表性订单的品质分布 [招牌, 家常, 匆忙]
const POLICIES = {
  canteen: { tiers: { oil: 1, material: 1, price: 0 }, skill: [0.6, 0.35, 0.05], buy: ['helper', 'pot2'], prefer: { E07: 'ask', E12: 'help', E29: 'take', E20: 'free', E03: 'more', E05: 'refuse', E14: 'refuse', S12: 'paper', S18: 'cook', S26: 'renew', E22: 'hire' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  private: { tiers: { oil: 2, material: 2, price: 2 }, skill: [0.75, 0.25, 0], buy: ['tables', 'counter'], prefer: { E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'open', S26: 'renew', E03: 'hold', E22: 'hire' }, menu: ['pidan', 'shengjian', 'noodle', 'soy'] },
  truth: { tiers: { oil: 2, material: 2, price: 1 }, skill: [0.8, 0.2, 0], buy: ['board', 'tables', 'sign'], prefer: { S02: 'refuse', S24: 'truth', E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'post', S26: 'buy', E08: 'public', E16: 'normal', E04: 'show', E01: 'normal', E22: 'hire', E11: 'some' }, menu: ['congee', 'youtiao', 'soy', 'pidan'] },
  honest: { tiers: { oil: 2, material: 2, price: 1 }, skill: [0.8, 0.2, 0], buy: ['board', 'tables', 'sign'], prefer: { E05: 'refuse', E14: 'papers', S12: 'paper', S18: 'post', S26: 'buy', E08: 'public', E16: 'normal', E04: 'show', E01: 'normal', E22: 'hire', E11: 'some' }, menu: ['pidan', 'shengjian', 'congee', 'soy'] },
  pills: { tiers: { oil: 0, material: 0, price: 1 }, skill: [0.4, 0.5, 0.1], cheat: 0.7, buy: ['fire', 'tray'], prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S02: 'take', S24: 'deal', S12: 'cheap', S18: 'cook', S26: 'renew', CRISIS: 'hold', E23: 'deny', E18: 'go', E10: 'risk', E04: 'delay', E08: 'silent' }, menu: ['youtiao', 'scallion', 'congee', 'soy'] },
  reopen: { tiers: { oil: 0, material: 0, price: 1 }, skill: [0.6, 0.35, 0.05], cheat: 0.5, buy: ['fire'], prefer: { E05: 'hide', E14: 'trial', E06: 'sell', S02: 'take', S12: 'cheap', S18: 'cook', S26: 'renew', CRISIS: 'rectify', E23: 'deny', E18: 'go', E04: 'delay' }, after: { CRISIS: { oil: 2, material: 1, price: 1 } }, menu: ['youtiao', 'scallion', 'congee', 'soy'] },
  average: { tiers: { oil: 1, material: 1, price: 1 }, skill: [0.5, 0.45, 0.05], buy: ['fire'], prefer: { S26: 'renew' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  farewell: { tiers: { oil: 1, material: 1, price: 1 }, skill: [0.6, 0.4, 0], prefer: { S26: 'leave', E22: 'no' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
  transfer: { greedy: true, tiers: { oil: 1, material: 2, price: 2 }, skill: [0.2, 0.5, 0.3], prefer: { S26: 'leave', E15: 'take', E01: 'refuse', E08: 'silent', E03: 'hold' }, menu: ['chicken', 'pidan', 'noodle', 'scallion'] },
  sneaky: { tiers: { oil: 1, material: 1, price: 1 }, skill: [0.5, 0.45, 0.05], cheat: 0.5, prefer: { S26: 'renew', CRISIS: 'hold', E05: 'hide' }, menu: ['congee', 'youtiao', 'soy', 'scallion'] },
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

const D = BSX.require('content/dishes'), C = BSX.require('content/config');
function serviceResult(state, pol, holder) {
  const orders = Run.planOrders(state);
  let combo = 0, comboTips = 0, maxCombo = 0;
  const res = orders.map(o => {
    const x = (holder.v = (holder.v * 1103515245 + 12345) % 2147483648) / 2147483648;
    const [a, b] = pol.skill;
    const grade = x < a ? 'sig' : x < a + b ? 'home' : 'rush';
    const reformed = pol.after && ['rectify', 'refund'].includes(state.crisis.state);
    const cheats = pol.cheat && !reformed ? o.items.filter((_, i) => ((holder.v >> (i + 3)) & 7) / 8 < pol.cheat).length : 0;
    const cheatGain = cheats ? o.items.slice(0, cheats).reduce((n, id) => n + D.stations[D.byId[id].station].cheat.save, 0) : 0;
    const sick = Run.sickRoll(state, o.id, cheats);
    const refund = sick ? o.items.reduce((n, id) => n + Math.round(D.byId[id].price * C.price.mult[state.price]) * 100, 0) : 0;
    if (grade !== 'rush' && !sick) { combo++; maxCombo = Math.max(maxCombo, combo); if (combo >= 2) comboTips += Math.min(combo, C.combo.max) * C.combo.tipPer; } else combo = 0;
    return { id: o.id, regular: o.regular, items: o.items, grade, quality: grade === 'sig' ? 0.93 : grade === 'home' ? 0.75 : 0.5, cheats, cheatGain, sick, refund };
  });
  const encounters = [];
  if (state.today.encounter) { const q = BSX.require('content/encounters').byId[state.today.encounter]; const greedy = (pol.cheat || pol.greedy) && !(pol.after && ['rectify', 'refund'].includes(state.crisis.state)); const pick = greedy ? q.choices.slice().sort((x, y) => (y.effect.cash || 0) - (x.effect.cash || 0))[0] : q.choices.slice().sort((x, y) => (x.effect.burn || 0) - (y.effect.burn || 0) || (y.effect.rep || 0) - (x.effect.rep || 0))[0]; encounters.push({ id: q.id, choice: pick.id }); }
  return { orders: res, comboTips, maxCombo, encounters };
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
      const dg = item.id === 'S03' ? (pol.cheat || pol.greedy ? { id: 'market', good: 2, bad: 6 } : { id: 'market', good: 7, bad: 0 }) : item.id === 'S15' ? { id: 'check', found: pol.cheat || pol.greedy ? 3 : 7 } : undefined;
      const n = Run.reduce(s, { t: 'resolve', choice: c, dungeon: dg });
      if (n === s) throw new Error('stuck resolving ' + JSON.stringify(item) + ' choice=' + c + ' day ' + s.day);
      if (item.kind === 'crisis' && pol.after && pol.after.CRISIS) tiers = Object.assign({}, pol.after.CRISIS);
      s = n;
    } else if (s.phase === 'prep') {
      for (const u of (pol.buy || [])) s = Run.reduce(s, { t: 'buy', id: u });
      for (const k of ['oil', 'material', 'price']) s = Run.reduce(s, { t: 'tier', key: k, v: tiers[k] });
      const want = pol.menu.concat(['congee', 'youtiao', 'soy', 'scallion', 'egg', 'noodle']);
      for (const id of s.menu.slice()) if (!want.slice(0, 4).includes(id)) s = Run.reduce(s, { t: 'dish', id });
      for (const id of want) if (s.menu.length < Run.menuSize(s)) s = Run.reduce(s, { t: 'dish', id });
      const dv = s.today.delivery, reformed = pol.after && ['rectify', 'refund'].includes(s.crisis.state), sly = (pol.cheat || pol.greedy) && !reformed;
      if (dv && dv.state === 'pending') s = Run.reduce(s, { t: 'delivery', accept: sly ? true : !dv.fake, tested: !sly });
      s = Run.reduce(s, { t: 'confirmPrep' });
    } else if (s.phase === 'service') {
      s = Run.reduce(s, { t: 'serviceDone', result: serviceResult(s, pol, holder) });
    } else if (s.phase === 'ledger') {
      { const reformed = pol.after && ['rectify', 'refund'].includes(s.crisis.state), lazy = pol.cheat && !reformed; for (const c of ['hood', 'waste', 'sanitize']) s = Run.reduce(s, { t: 'chore', id: c, on: !lazy }); }
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
