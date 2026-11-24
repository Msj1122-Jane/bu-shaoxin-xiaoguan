// 无界面模拟：用一个"手速 + 手艺"的简化模型打完早市，用来调数值、验证八个结局可达、做回归测试。
// 真实游戏的早市在 game/service；这里只保证同一份到店表、同一套结算公式。
BSX.define('core/sim', function (require) {
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var R = require('core/rng');
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // 剧情：只执行效果与选择。choose(sceneId, options, s) → 选项下标
  function scene(s, id, choose) {
    var sc = Story.scenes[id]; if (!sc) return;
    var lines = [];
    (function walk(beats) {
      (beats || []).forEach(function (b) {
        if (Array.isArray(b)) { lines.push(b); return; }
        if (b.fx) Cond.apply(s, b.fx);
        if (b.if) walk(Cond.check(s, b.if) ? b.then : b.else);
        if (b.choice) {
          var ok = b.choice.map(function (c, i) { return { c: c, i: i, ok: Cond.check(s, c.need) }; }).filter(function (o) { return o.ok; });
          if (!ok.length) ok = [{ c: b.choice[b.choice.length - 1], i: b.choice.length - 1 }];
          var pick = choose ? choose(id, ok.map(function (o) { return o.c; }), s) : 0, o = ok[clamp(pick || 0, 0, ok.length - 1)];
          lines.push(['choice', o.c.label]); Cond.apply(s, o.c.fx); walk(o.c.then);
        }
      });
    })(sc.beats);
    Run.sceneDone(s, id, lines);
  }
  function priceOf(s, lines) {
    var sum = 0, sets = {};
    lines.forEach(function (l) { if (!l.got) return; if (l.set) sets[l.set] = (sets[l.set] || 0) + 1; sum += Run.price(s, l.gave); });
    for (var k in sets) { var n = Math.floor(sets[k] / D.byId[k].set.length); if (n > 0) { var parts = 0; D.byId[k].set.forEach(function (p) { parts += Run.price(s, p); }); sum -= n * (parts - Run.price(s, k)); } }
    return sum;
  }
  // prof: { rate 每秒能出几份, q 平均出品分, qVar 波动, chat 接话概率, remember 记得老样子的概率, returnExtra 还不还多给的钱 }
  function service(s, plan, prof) {
    var h = { rng: (plan.seed ^ 0x51ed) >>> 0 }, res = { revenue: 0, tips: 0, served: 0, walked: 0, balked: 0, soldout: 0, delighted: 0, fine: 0, meh: 0, qSum: 0, qN: 0, waitSum: 0, waitN: 0, sold: {}, cooked: {}, want: {}, wasted: 0, burnAdd: 0, regs: {}, log: [], quotes: [], creditSum: 0 };
    var stock = {}, k; s.plan.menu.forEach(function (id) { stock[id] = s.plan.stock[id] || 0; });
    var queue = [], counter = [], ai = 0, t = 0, dt = 0.25, work = 0, arr = plan.arrivals, treat = false;
    var rate = prof.rate * (s.helper ? 1.18 : 1) * (1 + 0.04 * (Run.skillLv(s, 'fryer') + Run.skillLv(s, 'pot')));
    function pickDish(l) { if (l.d) return s.plan.menu.indexOf(l.d) >= 0 && stock[l.d] > 0 ? l.d : null; var c = s.plan.menu.filter(function (id) { return D.byId[id].tags.indexOf(l.wish) >= 0 && stock[id] > 0; }); return c[0] || null; }
    function open(c) { return c.lines.filter(function (l) { return !l.got && !l.dead; }); }
    function finish(c, timedOut) {
      var got = c.lines.filter(function (l) { return l.got; }), dead = c.lines.filter(function (l) { return l.dead; }).length, r = c.kind === 'reg' ? res.regs[c.id] : null;
      counter.splice(counter.indexOf(c), 1);
      if (c.peek) { r.outcome = 'peek'; r.chat = R.rand(h) < prof.chat; return; }
      if (!got.length) { if (timedOut) { res.walked++; if (r) r.outcome = 'walk'; res.waitSum += 1; res.waitN++; } else { res.soldout++; if (r) r.outcome = 'soldout'; } return; }
      var qa = 0; got.forEach(function (l) { qa += l.q; res.sold[l.gave] = (res.sold[l.gave] || 0) + 1; }); qa /= got.length;
      var wf = clamp(c.wait / c.pmax, 0, 1), remembered = c.hide && c.kind === 'reg' && !c.asked && !timedOut && !dead;
      var sat = Run.satisfaction(qa, wf, remembered ? 0.04 : 0) - dead * 0.07 - (timedOut ? 0.22 : 0) - (c.lines.length - got.length - dead) * 0.1 + (c.treated ? 0.1 : 0), g = Run.grade(sat);
      res.served++; res.waitSum += wf; res.waitN++;
      if (g === 'delight') res.delighted++; else if (g === 'fine') res.fine++; else res.meh++;
      var pay = priceOf(s, c.lines), tip = 0;
      if (c.treated) pay = 0;
      if (g === 'delight' && !c.treated && R.rand(h) < c.tip * 0.6) tip = C.tip.delight;
      if (r) { r.outcome = g; r.remembered = remembered; r.asked = c.asked; r.chat = !!c.chat && R.rand(h) < prof.chat; }
      if (c.act === 'credit') { r.credit = pay; res.creditSum += pay; pay = 0; tip = 0; }
      else if (c.act === 'repay') { pay += s.credit[c.id] || 0; r.repaid = true; }
      else if (c.act === 'treat') { pay *= 2; treat = true; }
      else if (c.act === 'overpay' && pay > 0) { if (prof.returnExtra) r.extra = 'returned'; else { r.extra = 'kept'; pay += Math.min(pay, 400); } }
      res.revenue += pay; res.tips += tip;
    }
    while (t < plan.len + 240) {
      t += dt;
      while (ai < arr.length && (arr[ai].t <= t || (t > plan.len + 2 && !counter.length && !queue.length))) { var a = arr[ai++], reg = a.kind === 'reg' ? Story.regs[a.id] : null, beat = reg && a.beat ? reg.beatById[a.beat] : null; queue.push({ kind: a.kind, id: a.id, hide: a.hide, tip: a.tip || 0.5, patience: a.patience, pmax: a.patience, wait: 0, qp: 40 + (s.day <= 2 ? 40 : 0), lines: a.order.map(function (o) { return { d: o.d || null, wish: o.wish || null, mod: o.mod, set: o.set, got: false, dead: false }; }), act: beat ? beat.act : null, peek: beat && beat.act === 'peek', chat: beat && beat.say && beat.say.chat, beat: beat, st: 0 }); }
      while (counter.length < plan.slots && queue.length) {
        var c = queue.shift(); counter.push(c);
        if (c.kind === 'reg') res.regs[c.id] = { outcome: null, beat: c.beat ? c.beat.id : null };
        c.lines.forEach(function (l) { if (l.d) res.want[l.d] = (res.want[l.d] || 0) + 1; if (!pickDish(l)) l.dead = true; });
        if (treat && c.kind === 'walk') { treat = false; c.treated = true; }
        if (c.hide && c.kind === 'reg' && !s.reg[c.id].usual && R.rand(h) > prof.remember) c.asked = true;
        if (!c.peek && !open(c).length && c.kind === 'reg') { var alt = Story.regs[c.id].likes.filter(function (tg) { return pickDish({ wish: tg }); })[0]; if (alt) { c.lines.push({ d: null, wish: alt, got: false, dead: false }); c.hide = false; } }
        if (!c.peek && !open(c).length) finish(c, false);
      }
      for (k = queue.length - 1; k >= 0; k--) { queue[k].qp -= dt; if (queue[k].qp <= 0) { var q = queue.splice(k, 1)[0]; res.balked++; if (q.kind === 'reg') res.regs[q.id] = { outcome: 'walk', beat: null }; } }
      work += rate * dt;
      var guard = 0;
      while (work >= 1 && guard++ < 6) {
        var cands = counter.filter(function (c) { return !c.peek && open(c).some(function (l) { return pickDish(l); }); }).sort(function (a, b) { return a.patience / a.pmax - b.patience / b.pmax; });
        if (!cands.length) { work = Math.min(work, 1.5); break; }
        var cc = cands[0], l = open(cc).filter(function (x) { return pickDish(x); })[0], dish = pickDish(l), d = D.byId[dish];
        stock[dish]--; res.cooked[dish] = (res.cooked[dish] || 0) + 1;
        var qv = clamp(prof.q + (R.rand(h) - 0.5) * (prof.qVar || 0.2) + C.matQ[s.plan.mat] + (s.today.pantryQ || 0) + (d.oil ? C.oilQ(s.oil.age) : 0) - (l.mod ? (1 - prof.q) * 0.5 : 0), 0.2, 1);
        if (d.cook && R.rand(h) < (1 - prof.q) * 0.25) { res.wasted++; work -= d.cook ? 1.15 : 0.8; continue; }
        l.got = true; l.q = qv; l.gave = dish; res.qSum += qv; res.qN++;
        if (d.oil) res.burnAdd += C.oilBurn(s.oil.age, s.oil.bulk);
        work -= d.cook ? 1.15 : 0.8;
        if (!open(cc).length) finish(cc, false);
      }
      counter.slice().forEach(function (c) {
        c.st += dt; c.patience -= dt; c.wait += dt;
        if (c.peek) { if (c.st > 5) finish(c, false); return; }
        open(c).forEach(function (l) { if (!pickDish(l)) l.dead = true; });
        if (!open(c).length) finish(c, false); else if (c.patience <= 0) finish(c, true);
      });
      if (t >= plan.len && ai >= arr.length && !queue.length && !counter.length) break;
    }
    var left = {}, n = 0; for (k in stock) if (stock[k] > 0) { left[k] = stock[k]; n += stock[k]; }
    res.leftovers = left; res.leftover = n;
    return res;
  }
  // 默认晨备：照昨天要的量备，按策略定油/料/价/菜单
  function prep(s, pol) {
    var p = s.plan, f = Run.features(s);
    if (f.mat && pol.mat != null) Run.setMat(s, Math.min(pol.mat, f.mat2 ? 2 : 1));
    if (f.price && pol.price != null) p.price = pol.price;
    if (f.post) p.post = !!pol.post;
    if (f.menu) {
      var want = pol.menu ? pol.menu(s) : null;
      if (!want) { want = Run.menuChoices(s).slice().sort(function (a, b) { return (b.price - b.cost) * b.pop - (a.price - a.cost) * a.pop; }).map(function (d) { return d.id; }); ['congee', 'youtiao', 'soy'].forEach(function (id) { want.splice(want.indexOf(id), 1); want.unshift(id); }); }
      p.menu.slice().forEach(function (id) { if (want.indexOf(id) < 0 || want.indexOf(id) >= C.menuMax(s)) Run.setMenu(s, id, false); });
      want.forEach(function (id) { if (p.menu.indexOf(id) < 0) Run.setMenu(s, id, true); });
    }
    p.menu.forEach(function (id) { Run.setStock(s, id, Math.round(Run.suggest(s, id) * (pol.stockMul || 1))); });
    if (f.oil && Run.usesOil(s)) p.oil = pol.oil ? pol.oil(s) : (s.oil.age >= 2 ? 'new' : 'keep');
  }
  function day(s, pol) {
    var t = s.today;
    if (t.closed) { Run.closedDay(s); }
    else {
      if (t.open && !t.openDone) { scene(s, t.open, pol.choose); t.openDone = true; }
      if (s.day > 1) prep(s, pol);
      Run.openShop(s);
      var plan = Run.buildService(s), res = service(s, plan, pol.skill);
      Run.finishService(s, res);
      (t.found || []).forEach(function (f) { Cond.apply(s, { memento: f.memento }); });
      (t.closeList || []).forEach(function (id) { scene(s, id, pol.choose); });
      if (pol.town && require('core/town').ok(s)) require('core/town').auto(s, pol.town(s));
      Run.toNight(s);
    }
    if (pol.buy) pol.buy.forEach(function (id) { if (Run.canBuy(s, id) && (pol.reckless || s.cash - 40000 > (Cast.upgrades.filter(function (u) { return u.id === id; })[0].cost))) Run.buy(s, id); });
    Run.nextDay(s);
    return s;
  }
  function month(s, pol, untilDay) { var guard = 0; while (s.phase !== 'ended' && guard++ < 40 && (!untilDay || s.day < untilDay)) day(s, pol); return s; }
  // 选择策略：按优先顺序给一串正则，谁先匹配到某个选项就选它
  function byLabel() { var res = [].slice.call(arguments); return function (id, opts) { for (var k = 0; k < res.length; k++) for (var i = 0; i < opts.length; i++) if (res[k].test(opts[i].label)) return i; return 0; }; }
  var SK = { ok: { rate: 0.34, q: 0.8, qVar: 0.24, chat: 0.5, remember: 0.6, returnExtra: true }, good: { rate: 0.44, q: 0.92, qVar: 0.14, chat: 0.85, remember: 0.9, returnExtra: true }, sloppy: { rate: 0.4, q: 0.62, qVar: 0.3, chat: 0.1, remember: 0.2, returnExtra: false }, slow: { rate: 0.24, q: 0.78, qVar: 0.24, chat: 0.4, remember: 0.5, returnExtra: true } };
  var RENEW = [/续租/, /凑/];
  function pol(o, pats) { o.choose = byLabel.apply(null, pats); return o; }
  // 几条有代表性的经营路线（模拟、测试、自动试玩共用）
  var policies = {
    average: pol({ skill: SK.ok, price: 1, mat: 1, buy: ['shelf', 'burner'] }, RENEW.concat([/照常|照价|只要有票|自己扛|等修完|接十五|再等等|正规|回收站|自己当/])),
    honest: pol({ skill: SK.good, price: 2, mat: 2, post: true, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['hood', 'shelf', 'burner'] }, RENEW.concat([/拒绝|只要有票|贴出|认了|公开|整改|先问|回收站|照价|不拍|买桶装|自己扛|等修完|明早来|留给/])),
    canteen: pol({ skill: SK.good, price: 0, mat: 1, stockMul: 1.15, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['bigpot', 'awning', 'shelf', 'burner'] }, RENEW.concat([/自己扛|加量|不收钱|留给|全接|明早来|先问|只收皮|只要有票|拒绝|回收站/])),
    private_: pol({ skill: SK.good, price: 2, mat: 2, oil: function (s) { return s.oil.age >= 2 ? 'new' : 'keep'; }, buy: ['shelf', 'burner', 'hood'] }, RENEW.concat([/只要有票|拒绝|涨价|照价|不接|不拍|回收站|照牌价/])),
    cheapskate: pol({ skill: SK.sloppy, price: 0, mat: 0, oil: function (s) { return s.oil.age >= 6 ? 'bulk' : 'keep'; }, buy: ['fryer'] }, RENEW.concat([/收下|别声张|卖给|换老胡|新米|不理|退赔|照常|烧开/])),
    pills: pol({ skill: { rate: 0.46, q: 0.9, qVar: 0.14, chat: 0.1, remember: 0.3, returnExtra: false }, price: 1, mat: 0, oil: function (s) { return s.oil.age >= 7 ? 'bulk' : 'keep'; }, buy: ['fryer'] }, RENEW.concat([/收下|别声张|卖给|换老胡|新米|不理|硬撑|照常|烧开/])),
    reopen: pol({ skill: SK.ok, price: 1, mat: 0, oil: function (s) { return s.crisis && s.crisis !== 'pending' ? (s.oil.age >= 2 ? 'new' : 'keep') : 'keep'; }, buy: [] }, RENEW.concat([/收下|别声张|卖给|换老胡|整改|认了|公开/])),
    leave: pol({ skill: SK.good, price: 1, mat: 1, buy: ['shelf'] }, [/不签/]),
    broke: pol({ skill: SK.slow, price: 2, mat: 2, stockMul: 2.2, oil: function () { return 'new'; }, buy: ['burner', 'hood', 'shelf', 'bigpot', 'awning', 'fryer', 'board'], reckless: true }, [/不签|免单|自己扛|不收钱|买桶装|再撑/])
  };
  return { scene: scene, service: service, prep: prep, day: day, month: month, policies: policies, SK: SK, byLabel: byLabel };
});
