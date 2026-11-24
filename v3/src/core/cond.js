// 条件 need 与效果 fx 的解释器（格式见 docs/CONTENT_SPEC.md §3、§4）。
BSX.define('core/cond', function (require) {
  var C = require('content/config');
  var Cast = require('content/cast');
  function inR(v, r) { if (v == null || typeof v !== 'number' || isNaN(v)) return false; if (!Array.isArray(r)) r = [r]; return v >= r[0] && (r[1] == null || v <= r[1]); }
  // 当前读数
  function read(s) {
    var hist = s.hist, y = hist[hist.length - 1], last = hist.slice(-5), pa = s.plan.price, i, sum = 0;
    if (last.length) { for (i = 0; i < last.length; i++) sum += last[i].price; pa = sum / last.length; }
    var affSum = 0, credit = 0, k;
    for (k in s.reg) affSum += s.reg[k].aff;
    for (k in s.credit) credit += s.credit[k];
    return { day: s.day, weather: s.today ? s.today.weather : 'sun', burn: s.burn, rep: s.rep, cash: s.cash / 100, oilAge: s.oil.age, price: s.plan.price, priceAvg: pa,
      mat: s.plan.mat, helper: !!s.helper, posted: !!s.plan.post, fast: y ? y.wait < 0.46 : null, quality: y ? y.q : null, credit: credit / 100, affSum: affSum, hood: !!s.upg.hood };
  }
  function check(s, need, h) {
    if (!need) return true;
    h = h || read(s);
    var k, i;
    if (need.day && !inR(h.day, need.day)) return false;
    if (need.aff) for (k in need.aff) if (!s.reg[k] || s.reg[k].aff < need.aff[k]) return false;
    if (need.flags) for (i = 0; i < need.flags.length; i++) if (!s.flags[need.flags[i]]) return false;
    if (need.not) for (i = 0; i < need.not.length; i++) if (s.flags[need.not[i]]) return false;
    if (need.seen) for (i = 0; i < need.seen.length; i++) if (!s.seen[need.seen[i]]) return false;
    if (need.unseen) for (i = 0; i < need.unseen.length; i++) if (s.seen[need.unseen[i]]) return false;
    if (need.weather && h.weather !== need.weather) return false;
    var ranges = ['burn', 'rep', 'cash', 'oilAge', 'price', 'priceAvg', 'mat', 'quality', 'credit', 'affSum'];
    for (i = 0; i < ranges.length; i++) if (need[ranges[i]] != null && !inR(h[ranges[i]], need[ranges[i]])) return false;
    if (need.menu) for (i = 0; i < need.menu.length; i++) if (s.plan.menu.indexOf(need.menu[i]) < 0) return false;
    if (need.unlocked) for (i = 0; i < need.unlocked.length; i++) if (!s.unlocked[need.unlocked[i]]) return false;
    if (need.helper != null && !!need.helper !== h.helper) return false;
    if (need.posted != null && !!need.posted !== h.posted) return false;
    if (need.fast != null && (h.fast == null || !!need.fast !== h.fast)) return false;
    if (need.any) { var ok = false; for (i = 0; i < need.any.length; i++) if (check(s, need.any[i], h)) { ok = true; break; } if (!ok) return false; }
    return true;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function news(s, type, id) { if (s.today) { s.today.news = s.today.news || []; s.today.news.push({ type: type, id: id }); } }
  // 某些旗标一旦立起，按配置结算（危机、救急）
  function onFlag(s, f) {
    var c;
    if (f === 'crisis_rectify') { c = C.crisis.rectify; s.cash += c.cash; s.burn = Math.min(s.burn, c.burnTo); s.rep = clamp(s.rep + c.rep, 0, 100); s.closeNext = true; s.crisis = 'rectify'; }
    else if (f === 'crisis_refund') { c = C.crisis.refund; s.cash += c.cash; s.rep = clamp(s.rep + c.rep, 0, 100); s.burn = clamp(s.burn + c.burn, 0, 100); s.later.push({ day: s.day + 3, fx: { rep: c.laterRep }, note: '退过钱的那几位，又有人推门进来了。' }); s.crisis = 'refund'; }
    else if (f === 'crisis_hold') { s.rep = clamp(s.rep + C.crisis.hold.rep, 0, 100); s.crisis = 'hold'; }
    else if (f === 's_sold') { s.cash += C.rescue.sell; s.rescueUsed = true; if (s.helper) s.helper = false; else { var ids = ['burner', 'hood', 'shelf', 'fryer', 'bigpot', 'awning', 'board']; for (var i = 0; i < ids.length; i++) if (s.upg[ids[i]]) { delete s.upg[ids[i]]; break; } } }
    else if (f === 's_borrow') { s.cash += C.rescue.borrow; s.rescueUsed = true; s.owe = C.rescue.repay; }
    else if (f === 's_refuse') { s.rescueUsed = true; }
    else if (f === 's_costup') { s.costUp = true; }
  }
  function apply(s, fx, affScale) {
    if (!fx) return;
    var k, i; affScale = affScale || 1;
    if (fx.cash) s.cash += Math.round(fx.cash * 100);
    if (fx.rep) s.rep = clamp(s.rep + fx.rep, 0, 100);
    if (fx.burn) s.burn = clamp(s.burn + fx.burn, 0, 100);
    if (fx.aff) for (k in fx.aff) if (s.reg[k]) s.reg[k].aff = clamp(s.reg[k].aff + fx.aff[k] * (fx.aff[k] > 0 ? affScale : 1), 0, 10);
    if (fx.set) for (i = 0; i < fx.set.length; i++) { if (!s.flags[fx.set[i]]) { s.flags[fx.set[i]] = s.day; onFlag(s, fx.set[i]); } }
    if (fx.clear) for (i = 0; i < fx.clear.length; i++) delete s.flags[fx.clear[i]];
    if (fx.unlock) [].concat(fx.unlock).forEach(function (d) { if (!s.unlocked[d]) { s.unlocked[d] = s.day; news(s, 'dish', d); } });
    if (fx.memento && !s.mementos.some(function (m) { return m.id === fx.memento; })) { s.mementos.push({ id: fx.memento, day: s.day }); news(s, 'memento', fx.memento); }
    if (fx.fact && s.reg[fx.fact[0]] && s.reg[fx.fact[0]].facts.indexOf(fx.fact[1]) < 0) { s.reg[fx.fact[0]].facts.push(fx.fact[1]); news(s, 'fact', fx.fact[0] + '/' + fx.fact[1]); }
    if (fx.flow && s.today) s.today.flow *= fx.flow;
    if (fx.flowNext) s.nextFlow = (s.nextFlow || 1) * fx.flowNext;
    if (fx.shift && s.today) s.today.shift *= fx.shift;
    if (fx.deposit) s.deposit = Math.max(0, s.deposit + Math.round(fx.deposit * 100));
    if (fx.helper != null) { s.helper = !!fx.helper; if (s.helper) s.flags.helper = s.day; else delete s.flags.helper; }
    if (fx.closeNext) s.closeNext = true;
    if (fx.payDeposit) { s.cash -= s.deposit; s.depositPaid = true; }
    if (fx.chipin) { s.chipAmount = Math.max(0, s.deposit - Math.max(0, s.cash)); s.cash = Math.max(0, s.cash - s.deposit); if (s.cash < 0) s.cash = 0; s.depositPaid = true; }
    if (fx.later) s.later.push({ day: s.day + (fx.later.days || 1), fx: fx.later.fx, note: fx.later.note });
  }
  return { check: check, apply: apply, read: read, inR: inR, clamp: clamp };
});
