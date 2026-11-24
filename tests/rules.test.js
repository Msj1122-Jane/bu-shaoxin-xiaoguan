// 规则层回归测试：node --test tests/*.test.js
const test = require('node:test'), assert = require('node:assert');
const BSX = require('./helpers/load.js');
const Run = BSX.require('core/run'), Sim = BSX.require('core/sim'), Save = BSX.require('core/save'), C = BSX.require('content/config'), D = BSX.require('content/dishes'), St = BSX.require('content/story'), Cond = BSX.require('core/cond');
const validate = require('../tools/validate.js');
const month = (policy, seed) => Sim.month(Run.create({ seed }), Sim.policies[policy]);

test('内容规模与校验：20 菜、8 常客、主线齐全、8 结局，校验器零错误', () => {
  const r = validate();
  assert.deepStrictEqual(r.errs, []);
  assert.strictEqual(r.counts.dishes, 20); assert.strictEqual(r.counts.regulars, 8); assert.strictEqual(r.counts.endings, 8);
  assert.ok(r.counts.beats >= 64, '每位常客至少 8 个节拍'); assert.ok(r.counts.events >= 14); assert.ok(r.counts.echoes >= 20);
});
test('第一天：赵爷爷必到，开门戏是 m01_open，菜单三样', () => {
  const s = Run.create({ seed: 3 });
  assert.strictEqual(s.today.open, 'm01_open'); assert.ok(s.today.visitors.includes('zhao')); assert.deepStrictEqual(s.plan.menu, ['congee', 'youtiao', 'soy']);
  const plan = Run.buildService(s); assert.ok(plan.arrivals.length >= 5 && plan.arrivals.length <= 9);
});
test('账本：开门扣进货钱；收摊入账 = 卖出 + 小费 − 水电；整数分', () => {
  const s = Run.create({ seed: 5 }), c0 = s.cash, cost = Run.planCost(s);
  Run.openShop(s); assert.strictEqual(s.cash, c0 - cost.total);
  const res = { revenue: 4550, tips: 100, served: 8, walked: 0, balked: 0, soldout: 0, delighted: 6, fine: 2, meh: 0, qSum: 7, qN: 8, waitSum: 1, waitN: 8, sold: { congee: 6 }, cooked: { congee: 6 }, want: {}, wasted: 0, burnAdd: 0, regs: {}, log: [], quotes: [], leftover: 0, leftovers: {} };
  const c1 = s.cash, rec = Run.finishService(s, res);
  assert.strictEqual(s.cash, c1 + 4550 + 100 - C.utilities); assert.strictEqual(rec.net, 4550 + 100 - cost.total - C.utilities); assert.ok(Number.isInteger(s.cash));
});
test('房租：第 7 天晚上扣一次，第 28 天不扣', () => {
  const s = Run.create({ seed: 9 }); Sim.month(s, Sim.policies.average, 7);
  assert.strictEqual(s.day, 7); Sim.day(s, Sim.policies.average);
  assert.strictEqual(s.hist[6].rent, C.rentWeekly);
  const e = month('average', 9); assert.strictEqual(e.hist[27].rent, 0);
});
test('油：接着用每天老一天，换新归零，老油才积烧心', () => {
  const s = Run.create({ seed: 2 }); Sim.month(s, Sim.policies.average, 2);
  s.plan.oil = 'keep'; Run.openShop(s); assert.strictEqual(s.oil.age, 1);
  const t = Run.create({ seed: 2 }); Sim.month(t, Sim.policies.average, 2); t.oil.age = 4; t.plan.oil = 'new'; Run.openShop(t); assert.strictEqual(t.oil.age, 0);
  assert.strictEqual(C.oilBurn(1, false), 0); assert.ok(C.oilBurn(4, false) > 0);
});
test('菜单受灶眼和菜单牌限制', () => {
  const s = Run.create({ seed: 4 }); Sim.month(s, Sim.policies.average, 9);
  s.plan.menu = ['congee', 'youtiao', 'soy']; delete s.upg.burner;
  assert.ok(Run.setMenu(s, 'scallion', true)); assert.strictEqual(Run.hotCount(s.plan.menu), 3);
  assert.strictEqual(Run.setMenu(s, 'noodle', true), false, '第四口灶要先添置'); assert.ok(Run.whyNot(s, 'noodle'));
  s.upg.burner = 1; assert.ok(Run.setMenu(s, 'noodle', true));
});
test('确定性：同种子同打法，结果逐分相同', () => {
  const a = month('average', 77), b = month('average', 77);
  assert.strictEqual(a.cash, b.cash); assert.strictEqual(a.ending, b.ending); assert.strictEqual(JSON.stringify(a.hist), JSON.stringify(b.hist));
});
test('八个结局都能打出来', () => {
  const want = { average: 'E_SOMEONE', honest: 'E_HONEST', canteen: 'E_CANTEEN', private_: 'E_PRIVATE', pills: 'E_PILLS', reopen: 'E_REOPEN', leave: 'E_FAREWELL', cheapskate: 'E_TRANSFER' };
  for (const p in want) { const got = [1000, 1037, 1074, 1111].map(seed => month(p, seed).ending); assert.ok(got.includes(want[p]), p + ' → ' + got.join(',')); }
});
test('常客线：同组节拍只走一个；一个月能走到大部分节拍', () => {
  const s = month('honest', 31); let total = 0;
  St.regIds.forEach(id => { const groups = {}; s.reg[id].beats.forEach(b => { const g = St.regs[id].beatById[b].group; if (g) { assert.ok(!groups[g], id + ' 组 ' + g + ' 走了两次'); groups[g] = 1; } }); total += s.reg[id].beats.length; });
  assert.ok(total >= 45, '走到的节拍 ' + total);
});
test('危机只发生一次；整改次日停业', () => {
  const s = Run.create({ seed: 8 }); let crises = 0, closed = 0;
  while (s.phase !== 'ended') { if (s.today.closed) closed++; Sim.day(s, Sim.policies.reopen); }
  crises = Object.keys(s.seen).filter(k => k === 'crisis').length;
  assert.ok(crises <= 1); if (s.flags.crisis_rectify) assert.strictEqual(closed, 1);
});
test('存档：主备档、损坏回退、旧档提示', () => {
  const mem = Save.memoryStorage(), st = new Save.Store(mem), s = Run.create({ seed: 6 });
  assert.ok(st.saveRun(s)); Sim.day(s, Sim.policies.average); assert.ok(st.saveRun(s));
  assert.strictEqual(st.loadRun().state.day, 2);
  mem.set(Save.KEYS.run, '{bad'); const r = st.loadRun(); assert.strictEqual(r.from, 'backup'); assert.strictEqual(r.state.day, 1);
  const old = Save.memoryStorage(); old.set('bsx.run.v3', 'x'); const st2 = new Save.Store(old); assert.strictEqual(st2.loadRun(), null); assert.ok(/旧/.test(st2.notice));
});
test('条件与效果解释器', () => {
  const s = Run.create({ seed: 1 });
  assert.ok(Cond.check(s, { day: [1, 3], weather: 'sun', not: ['x'] })); assert.ok(!Cond.check(s, { day: [2] })); assert.ok(Cond.check(s, { any: [{ day: [5] }, { rep: [40] }] }));
  Cond.apply(s, { cash: -30, rep: 2, set: ['f1'], unlock: 'scallion', aff: { zhao: 1 } });
  assert.strictEqual(s.cash, C.startCash - 3000); assert.ok(s.flags.f1); assert.ok(s.unlocked.scallion); assert.strictEqual(s.reg.zhao.aff, 1);
});
test('店史：结局、传家物、招牌', () => {
  const s = month('honest', 12), L = Run.record(Run.newLegacy(), s);
  assert.strictEqual(L.runs, 1); assert.strictEqual(L.endings[s.ending], 1); assert.ok(L.heirlooms.includes('H_APRON')); assert.strictEqual(L.lastSign, St.endings[s.ending].sign);
});
test('数值护栏：普通打法头一周不破产，第 26 天手头在押金线上下', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) { const s = Run.create({ seed }); Sim.month(s, Sim.policies.average, 27); s.hist.slice(0, 7).forEach(h => assert.ok(h.cash > 0, '第 ' + h.day + ' 天现金 ' + h.cash)); const d26 = s.hist[25].cash; /* 收摊时记下的数，付押金之前 */ assert.ok(d26 > 80000 && d26 < 220000, '第 26 天 ' + d26); }
});
