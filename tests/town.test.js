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
test('7 路总站：接了包餐，明早单独备一批料（进货小票上一行），开门前交货、钱当场结；不动晨备的份数', () => {
  const s = toAfternoon(9), of = T.offers(s);
  assert.ok(of.length >= 1, '第 9 天至少有一份包餐');
  const o = of[0]; T.accept(s, o); T.done(s, 'depot'); Run.nextDay(s);
  assert.ok(s.today.notes.some(n => n.kind === 'order' && n.text.includes(o.who)));
  Sim.prep(s, Sim.policies.honest);
  const stock0 = JSON.stringify(s.plan.stock), c0 = s.cash, cost = Run.planCost(s);
  assert.strictEqual(cost.pre, o.n * Run.unitCost(s, o.dish)); assert.strictEqual(cost.total, cost.goods + cost.oil - cost.pantry + cost.pre);
  Run.openShop(s);
  assert.strictEqual(JSON.stringify(s.plan.stock), stock0, '晨备的份数没被动');
  assert.strictEqual(s.today.pre.got, o.n); assert.strictEqual(s.cash, c0 - cost.total + o.n * o.unit);
  assert.ok(o.n * o.unit > cost.pre, '包餐有赚头');
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

// ───────── V4 自由地图
test('自由地图：13:00 从店里出发；走路按远近花时间；19:30 之后哪也去不了', () => {
  const s = toAfternoon(10), st = T.ensure(s);
  assert.strictEqual(st.clock, T.START); assert.strictEqual(st.at, 'shop');
  const near = T.travelMins('shop', 'tailor'), far = T.travelMins('shop', 'whole');
  assert.ok(near > 0 && near < far, '隔壁比批发市场近');
  assert.strictEqual(T.travel(s, 'whole'), ''); assert.strictEqual(st.at, 'whole'); assert.strictEqual(st.clock, T.START + far);
  T.spend(s, 9999); assert.strictEqual(st.clock, T.END); assert.ok(T.whyNot(s, 'shop').length > 0);
});
test('自由地图：营业时间和解锁——夜市 18 点后才开，何姨家要线索', () => {
  const s = toAfternoon(10); T.ensure(s);
  assert.match(T.whyNot(s, 'wharf'), /18/);
  assert.ok(T.whyNot(s, 'heyi').length > 0);
  s.flags.heyi_lead = s.day; assert.strictEqual(T.whyNot(s, 'heyi'), '');
  assert.strictEqual(T.travelMins('shop', 'heyi'), 90);
});
test('自由地图：常客按作息出现；串门戏要人在场才演；晚点会来的人能等', () => {
  const s = toAfternoon(14); T.ensure(s);
  s.today.weather = 'sun';
  assert.strictEqual(T.where(s, 'zhao', 14 * 60), null);
  assert.strictEqual(T.where(s, 'zhao', 15 * 60 + 10), 'park');
  s.today.weather = 'rain'; assert.strictEqual(T.where(s, 'zhao', 15 * 60 + 10), 'lane'); s.today.weather = 'sun';
  const v = T.nextVisit(s, 'zhao');
  if (v) {
    assert.strictEqual(T.eventsAt(s, 'park', 14 * 60).length, 0, '人还没来，不演');
    assert.strictEqual(T.eventsAt(s, 'park', 15 * 60 + 10).length, 1, '人来了就能演');
    T.travel(s, 'park'); assert.ok(T.comingAt(s, 'park').some(c => c.id === 'zhao'));
    assert.ok(T.actionsAt(s, 'park').some(a => a.kind === 'wait'));
  }
});
test('自由地图：聊几句每人每天一次，好感 +0.15', () => {
  const s = toAfternoon(14); T.ensure(s); s.today.weather = 'sun';
  T.spend(s, 120); const at = T.where(s, 'man', T.ensure(s).clock); assert.strictEqual(at, 'tailor');
  const a0 = s.reg.man.aff; assert.ok(T.doTalk(s, 'man')); assert.ok(Math.abs(s.reg.man.aff - Math.min(10, a0 + 0.15)) < 1e-9);
  assert.strictEqual(T.doTalk(s, 'man'), null);
});
test('自由地图：第二回串门戏过期没看，第二天早上有人提一句；回店后不能再出门', () => {
  const ms = Tn.miss.v_zhao_2, s = toAfternoon(ms.until);
  s.reg.zhao.aff = 6; s.reg.zhao.met = s.reg.zhao.met || 1; delete s.seen.v_zhao_2;
  T.done(s); Run.nextDay(s);
  assert.strictEqual(s.day, ms.until + 1);
  assert.ok(s.today.notes.some(n => n.kind === 'missed' && n.text.includes(ms.line)), '过期第二天早上有人提');
  s.seen.v_zhao_1 = s.seen.v_zhao_1 || 1; assert.strictEqual(T.nextVisit(s, 'zhao'), null, '过期的戏不再出现');
  s.seen.v_zhao_2 = 1; const s3 = toAfternoon(ms.until); s3.reg.zhao.aff = 6; s3.seen.v_zhao_2 = s3.day; T.done(s3); Run.nextDay(s3);
  assert.ok(!s3.today.notes.some(n => n.kind === 'missed' && n.text.includes(ms.line)), '看过的不提');
  const s2 = toAfternoon(8); T.done(s2); assert.strictEqual(s2.phase, 'night'); Run.toTown(s2); assert.strictEqual(s2.phase, 'night');
});
