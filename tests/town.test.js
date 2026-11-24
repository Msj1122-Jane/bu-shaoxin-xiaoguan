// 下午外出的规则测试：node --test tests/*.test.js
const test = require('node:test'), assert = require('node:assert');
const BSX = require('./helpers/load.js');
const Run = BSX.require('core/run'), Sim = BSX.require('core/sim'), T = BSX.require('core/town'), Tn = BSX.require('content/town'), St = BSX.require('content/story'), Save = BSX.require('core/save');
// 用某条路线打到第 day 天收摊，停在下午
function toAfternoon(day, policy, seed) {
  const pol = Sim.policies[policy || 'honest'], s = Run.create({ seed: seed || 7 });
  Sim.month(s, pol, day);
  const t = s.today; if (t.open) { Sim.scene(s, t.open, pol.choose); t.openDone = true; }
  Sim.prep(s, pol); Run.openShop(s); Run.finishService(s, Sim.service(s, Run.buildService(s), pol.skill));
  (t.closeList || []).forEach(id => Sim.scene(s, id, pol.choose));
  Run.toTown(s); return s;
}

test('下午：第 1–2 天和第 28 天不出门；第 3–27 天进入 town 阶段，存档认得', () => {
  const s3 = toAfternoon(3); assert.strictEqual(s3.phase, 'town');
  const st = Save.memoryStorage(), store = new Save.Store(st); store.saveRun(s3); assert.strictEqual(store.loadRun().state.phase, 'town');
  const s = Run.create({ seed: 2 }); Run.toTown(s); assert.strictEqual(s.phase, 'night');
});
test('批发市场：同一天三份货是确定的；好货明天抵进货、坏货加烧心', () => {
  const s = toAfternoon(10), a = T.lots(s), b = T.lots(s);
  assert.deepStrictEqual(a, b); assert.strictEqual(a.length, 3);
  a.forEach(l => { assert.ok(l.price > 0 && l.price < l.v); assert.ok(Tn.goods[l.item]); [0, 1, 2].forEach(j => assert.ok(T.clue(l, j).length > 0)); });
  const c0 = s.cash, p = T.buy(s, a, [true, true, true]);
  assert.strictEqual(s.cash, c0 - p.spent); assert.strictEqual(p.credit, a.reduce((x, l) => x + l.v, 0));
  T.done(s, 'market'); Run.nextDay(s);
  const cost = Run.planCost(s); assert.strictEqual(cost.pantry, Math.min(p.credit, cost.goods)); assert.strictEqual(cost.total, cost.goods + cost.oil - cost.pantry);
  const b0 = s.burn; Run.openShop(s); assert.strictEqual(s.pantry, null);
  assert.ok(Math.abs(s.burn - Math.min(100, b0 + p.burn)) < 1e-9); assert.strictEqual(s.today.pantryQ, p.q);
});
test('7 路总站：接了包餐，明早自动多备，开门交货、钱当场结；交不齐扣口碑', () => {
  const s = toAfternoon(9), of = T.offers(s);
  assert.ok(of.length >= 1, '第 9 天至少有一份包餐');
  const o = of[0]; T.accept(s, o); T.done(s, 'depot'); Run.nextDay(s);
  assert.ok(s.plan.menu.includes(o.dish)); assert.ok(s.today.notes.some(n => n.kind === 'order' && n.text.includes(o.who)));
  const c0 = s.cash, cost = Run.planCost(s); Run.openShop(s);
  assert.strictEqual(s.today.pre.got, o.n); assert.strictEqual(s.cash, c0 - cost.total + o.n * o.unit);
  // 交不齐
  const s2 = toAfternoon(9), o2 = T.offers(s2)[0]; T.accept(s2, o2); T.done(s2, 'depot'); Run.nextDay(s2);
  Run.setStock(s2, o2.dish, 2); const r0 = s2.rep; Run.openShop(s2);
  assert.strictEqual(s2.today.pre.got, 2); assert.ok(s2.rep < r0);
});
test('桥头：听到的天气就是明天的天气', () => {
  for (const day of [5, 8, 11, 16, 20]) { const s = toAfternoon(day), f = T.bridge(s); T.done(s, 'bridge'); Run.nextDay(s); assert.strictEqual(s.today.weather, f.w, '第 ' + (day + 1) + ' 天'); }
});
test('串门：十六场都存在、说话的人都认得；好感不够去不了，看过的不再出现', () => {
  const ids = Object.keys(Tn.scenes); assert.strictEqual(ids.length, 16);
  ids.forEach(id => assert.ok(St.scenes[id], id));
  const s = toAfternoon(14), vs = T.visitable(s);
  vs.forEach(v => assert.ok(s.reg[v.id].aff >= 2));
  if (vs.length) { const v = vs[0]; Sim.scene(s, v.scene.id); assert.notStrictEqual((T.nextVisit(s, v.id) || {}).id, v.scene.id); }
});
test('回店练手：最常用的灶熟练度 +8', () => {
  const s = toAfternoon(6), before = JSON.parse(JSON.stringify(s.stats.st)), r = T.practice(s);
  assert.strictEqual(s.stats.st[r.st], (before[r.st] || 0) + 8);
});
