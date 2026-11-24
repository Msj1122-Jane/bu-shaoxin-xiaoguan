// 早市：一屏实时营业。客人拿着票据站在柜台前，门外排着队；玩家在台面上同时照看几口灶，决定先顾谁。
// 这里绝不弹选择——故事跟着动作走：气泡短句、票据上的"老样子"、多给的硬币、落下的东西。
// 交互：点 = 顺手（翻面／出锅并递给最急的那位）；拖 = 指定给谁或先放到出餐台；按住 = 接豆浆、磨豆。
BSX.define('game/service', function (require) {
  var A = require('game/assets');
  var U = require('ui/ui');
  var Fx = require('game/fx');
  var Au = require('game/audio');
  var C = require('content/config');
  var D = require('content/dishes');
  var Cast = require('content/cast');
  var Story = require('content/story');
  var Run = require('core/run');
  var Cond = require('core/cond');
  var Shop = require('game/shop');
  var People = require('game/people');
  var Stn = require('game/stations');
  var TICKET_Y = 92, SHELF = { x: 1076, y: 472, w: 196, h: 242 }, TIN = { x: 1010, y: 34 };
  var FOOT = People.FOOT;
  function pick(a) { return a && a.length ? a[Math.floor(Math.random() * a.length)] : null; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function Service(app, s, plan) {
    var self = this;
    this.app = app; this.s = s; this.plan = plan; this.t = 0; this.len = plan.len; this.ai = 0; this.state = 'open';
    this.nSlots = plan.slots; this.slotX = plan.slots === 3 ? [410, 640, 870] : [300, 520, 740, 960];
    this.cust = []; this.queue = []; this.bubbles = []; this.extras = []; this.uid = 1;
    this.shelf = []; this.shelfN = C.shelf(s);
    this.stock = {}; s.plan.menu.forEach(function (id) { self.stock[id] = s.plan.stock[id] || 0; });
    this.start = {}; for (var k in this.stock) this.start[k] = this.stock[k];
    this.sets = Run.setsOn(s);
    this.env = { s: s, stock: this.stock, t: 0, lv: {}, oilAge: s.oil.age, bulk: s.oil.bulk, svc: {
      say: function (x, y, text, size, color) { Fx.float(x, y, text, { size: size || 18, color: color || '#fff8e8' }); },
      cooked: function (d) { self.res.cooked[d] = (self.res.cooked[d] || 0) + 1; },
      wasted: function (d) { self.res.wasted++; },
      produce: function (item, x, y) { self.place(item, x, y); },
      smart: function (g) { self.smart(g); },
      canTake: function (d) { return !!self.target(d) || self.shelf.length < self.shelfN; },
      wants: function (d) { return self.wants(d); }
    } };
    D.order.forEach(function (st) { self.env.lv[st] = Run.skillLv(s, st); });
    this.stations = Stn.layout(s.plan.menu, { x: 10, y: 468, w: SHELF.x - 22, h: 248 }, this.env);
    this.res = { revenue: 0, tips: 0, served: 0, walked: 0, balked: 0, soldout: 0, delighted: 0, fine: 0, meh: 0, qSum: 0, qN: 0, waitSum: 0, waitN: 0, sold: {}, cooked: {}, want: {}, wasted: 0, burnAdd: 0, regs: {}, log: [], quotes: [], creditSum: 0 };
    this.remarks = plan.remarks.slice(); this.chatterT = 9; this.checkT = 0; this.helperT = 3; this.treat = false; this.drag = null; this.zb = null;
    this.h = Cond.read(s);
    this.cash0 = s.cash;
  }
  var P = Service.prototype;

  // ───────── 订单
  function lines(order) { return order.map(function (o) { return { d: o.d || null, wish: o.wish || null, mod: o.mod || null, set: o.set || null, got: false, pend: false, dead: false, q: 0, gave: null }; }); }
  P.mkCust = function (a) {
    var reg = a.kind === 'reg' ? Story.regs[a.id] : null, beat = reg && a.beat ? reg.beatById[a.beat] : null;
    return { uid: this.uid++, kind: a.kind, id: a.id || null, arch: a.arch || null, seed: a.seed, reg: reg, beat: beat, lines: lines(a.order), hide: !!a.hide, patience: a.patience, pmax: a.patience, tip: a.tip || 0.5,
      state: 'queue', st: 0, slot: -1, x: 96, wait: 0, qp: C.patience.queue[0] + Math.random() * (C.patience.queue[1] - C.patience.queue[0]) + (this.s.upg.awning ? 10 : 0) + (this.s.day <= 2 ? 40 : 0),
      emote: null, et: 0, shake: 0, hop: 0, chat: beat && beat.say && beat.say.chat ? { lines: beat.say.chat, i: -1, t: 0, on: false, done: false } : null, asked: false, peek: beat && beat.act === 'peek', act: beat ? beat.act : null, togo: beat && beat.togo, warned: false };
  };
  P.avail = function (dish) {
    var n = this.stock[dish] || 0;
    this.stations.forEach(function (st) { n += st.count(dish); });
    this.shelf.forEach(function (it) { if (it.dish === dish) n++; });
    Fx.flies.forEach(function (f) { if (f.item && f.item.dish === dish) n++; });
    if (this.drag && this.drag.item && this.drag.item.dish === dish) n++;
    return n;
  };
  P.wishOk = function (tag) { var self = this; return this.s.plan.menu.some(function (id) { return D.byId[id].tags.indexOf(tag) >= 0 && self.avail(id) > 0; }); };
  P.wants = function (dish) { var n = 0; this.cust.forEach(function (c) { if (c.state === 'wait') c.lines.forEach(function (l) { if (!l.got && !l.dead && !l.pend && l.d === dish) n++; }); }); return n; };
  // 卖完的东西从票据上划掉
  P.prune = function (c, first) {
    var self = this, dropped = 0;
    c.lines.forEach(function (l) {
      if (l.got || l.dead || l.pend) return;
      if (first && l.d) self.res.want[l.d] = (self.res.want[l.d] || 0) + 1;
      var ok = l.d ? (self.s.plan.menu.indexOf(l.d) >= 0 && self.avail(l.d) > 0) : self.wishOk(l.wish);
      if (!ok) { l.dead = true; dropped++; }
    });
    if (dropped) { Au.play('soldout'); if (!c.warned) { c.warned = true; this.say(c, pick((Story.ambient.soldout) || ['没了？那算了。'])); } }
    return dropped;
  };
  P.openLines = function (c) { return c.lines.filter(function (l) { return !l.got && !l.dead; }); };

  // ───────── 气泡与台词
  P.say = function (c, text, life, style) {
    if (!text) return;
    this.bubbles = this.bubbles.filter(function (b) { return b.owner !== c.uid || b.style !== (style || 'a'); });
    this.bubbles.push({ owner: c.uid, c: c, text: text, t: 0, life: life || (1.9 + text.length * 0.07), style: style || 'a' });
    if (c.kind === 'reg' && style !== 'q') this.res.log.push([style === 'z' ? 'z' : style === 'b' ? (c.id === 'zhao' ? 'doudou' : c.id) : c.id, text]);
  };
  P.lineOf = function (c, key) {
    var am = Story.ambient, h = this.h;
    if (c.beat && c.beat.say && c.beat.say[key]) return c.beat.say[key];
    if (c.reg) {
      var b = c.reg.barks || {}, pool = b[key];
      if (key === 'in') { pool = (this.s.oil.age >= 3 && Run.usesOil(this.s) && b.inOilOld && b.inOilOld.length) ? b.inOilOld : (h.weather === 'rain' && b.inRain && b.inRain.length) ? b.inRain : (h.price === 2 && b.inPriceUp && b.inPriceUp.length) ? b.inPriceUp : (h.price === 0 && b.inPriceDown && b.inPriceDown.length) ? b.inPriceDown : (this.queue.length >= 3 && b.inBusy && b.inBusy.length) ? b.inBusy : b.in; }
      return pick(pool);
    }
    var w = (am.walkins || {})[c.arch] || {};
    if (key === 'in') {
      var wl = c.lines.filter(function (l) { return l.wish; })[0], ml = c.lines.filter(function (l) { return l.mod; })[0];
      if (wl && am.wish) return pick(am.wish[wl.wish]);
      if (ml && am.mods) return pick(am.mods[ml.mod]);
      return Math.random() < 0.5 ? pick(w.in) : null;
    }
    var odds = { good: 0.55, ok: 0.2, bad: 0.85, slow: 0.75, out: 0, treat: 1 }[key];
    return Math.random() < (odds == null ? 0.3 : odds) ? pick(w[key]) : null;
  };

  // ───────── 时间推进
  P.update = function (dt) {
    var self = this, i, c;
    this.t += dt; this.env.t = this.t;
    var arr = this.plan.arrivals;
    while (this.ai < arr.length && (arr[this.ai].t <= this.t || (this.t > this.len + 2 && !this.cust.length && !this.queue.length))) { this.queue.push(this.mkCust(arr[this.ai++])); }
    // 入座
    for (i = 0; i < this.nSlots && this.queue.length; i++) {
      if (this.cust.some(function (x) { return x.slot === i; })) continue;
      c = this.queue.shift(); c.slot = i; c.state = 'in'; c.st = 0; c.x = 96; this.cust.push(c); Au.play('bell', { vol: 0.5, pitch: 0.94 + Math.random() * 0.12 });
    }
    // 门外
    for (i = this.queue.length - 1; i >= 0; i--) { c = this.queue[i]; c.qp -= dt; if (c.qp <= 0) { this.queue.splice(i, 1); this.res.balked++; if (c.kind === 'reg') this.res.regs[c.id] = { outcome: 'walk', beat: null }; Fx.float(110, 300, '等不及，走了', { size: 16, color: '#ffd9c8' }); Au.play('leave', { vol: 0.5 }); } }
    for (i = this.cust.length - 1; i >= 0; i--) this.stepCust(this.cust[i], dt, i);
    this.stations.forEach(function (st) { st.update(dt); });
    // 多给的硬币
    for (i = this.extras.length - 1; i >= 0; i--) { var e = this.extras[i]; e.t -= dt; if (e.t <= 0) { this.extras.splice(i, 1); this.res.revenue += e.amount; this.res.regs[e.id].extra = 'kept'; this.coins(e.x, e.y, e.amount); } }
    for (i = this.bubbles.length - 1; i >= 0; i--) { this.bubbles[i].t += dt; if (this.bubbles[i].t >= this.bubbles[i].life) this.bubbles.splice(i, 1); }
    if (this.zb) { this.zb.t += dt; if (this.zb.t >= this.zb.life) this.zb = null; }
    // 没来的人，被别人提一句
    if (this.remarks.length && this.t >= this.remarks[0].t) {
      var rm = this.remarks[0], spk = this.cust.filter(function (x) { return x.state === 'wait' && (rm.who === 'walkin' ? x.kind === 'walk' : x.id === rm.who); })[0] || (this.t > rm.t + 25 ? this.cust.filter(function (x) { return x.state === 'wait'; })[0] : null);
      if (spk) { this.remarks.shift(); this.say(spk, rm.line, 3.2); this.res.log.push([spk.id || 'neighbor', rm.line]); }
      else if (this.t > this.len) this.remarks.shift();
    }
    // 排队的人闲聊
    this.chatterT -= dt;
    if (this.chatterT <= 0) { this.chatterT = 13 + Math.random() * 9; if (this.queue.length >= 2 && Story.ambient.queue) { var pool = Story.ambient.queue.filter(function (q) { return Cond.check(self.s, q.need, self.h); }), q = pick(pool.slice(0, 5)); if (q && q.lines && q.lines.length) { var pr = pick(q.lines); this.doorTalk = { a: pr[0], b: pr[1], t: 0 }; } } }
    if (this.doorTalk) { this.doorTalk.t += dt; if (this.doorTalk.t > 5) this.doorTalk = null; }
    this.checkT -= dt;
    if (this.checkT <= 0) { this.checkT = 1; this.cust.forEach(function (x) { if (x.state === 'wait' && !x.peek) { if (self.prune(x, false) && !self.openLines(x).length) self.complete(x, false); } }); }
    if (this.s.helper) this.helper(dt);
    Au.setScene({ crowd: clamp((this.cust.length + this.queue.length) / 7, 0, 1) });
    if (this.state === 'open' && this.t >= this.len && this.ai >= arr.length && !this.queue.length && !this.cust.length && !Fx.flies.length) { this.state = 'done'; Stn.silence(); }
  };
  P.stepCust = function (c, dt, idx) {
    var tx = this.slotX[c.slot], self2 = this;
    c.st += dt; if (c.et > 0) c.et -= dt; if (c.shake > 0) c.shake -= dt; if (c.hop > 0) c.hop -= dt * 3;
    if (c.state === 'in') {
      var k = Math.min(1, c.st / 0.85); c.x = 96 + (tx - 96) * Fx.ease.out3(k);
      if (k >= 1) {
        c.state = 'wait'; c.st = 0; c.x = tx;
        if (c.kind === 'reg' && !this.res.regs[c.id]) this.res.regs[c.id] = { outcome: null, beat: c.beat ? c.beat.id : null };
        this.prune(c, true);
        if (this.treat && c.kind === 'walk') { this.treat = false; c.treated = true; }
        // 常客要的东西没了：先看看有没有别的合口味的，实在没有才走
        if (!c.peek && !this.openLines(c).length && c.reg) { var alt = c.reg.likes.filter(function (tg) { return self2.wishOk(tg); })[0]; if (alt) { c.lines.push({ d: null, wish: alt, mod: null, set: null, got: false, pend: false, dead: false, q: 0, gave: null }); c.hide = false; this.say(c, '那来点别的吧。'); c.warned = true; } }
        if (!c.peek && !this.openLines(c).length) { c.soldout = true; this.res.soldout++; if (c.kind === 'reg') this.res.regs[c.id].outcome = 'soldout'; this.leave(c, 'out'); return; }
        var ln = c.treated ? this.lineOf(c, 'treat') : this.lineOf(c, 'in'); if (ln && !c.warned) this.say(c, ln);
        if (c.hide && !(c.reg && this.s.reg[c.id].usual)) c.hidden = true;
      }
    } else if (c.state === 'wait') {
      var chatting = c.chat && c.chat.on;
      if (chatting) this.stepChat(c, dt);
      else { c.patience -= dt; c.wait += dt; }
      if (c.peek) { if (c.st > 5.5 && !chatting) { c.outcome = 'peek'; this.res.regs[c.id].outcome = 'peek'; this.res.regs[c.id].chat = !!(c.chat && c.chat.done); this.leave(c, 'out'); } return; }
      var f = c.patience / c.pmax;
      if (f < 0.34 && !c.slowSaid) { c.slowSaid = true; c.emote = 'sweat'; c.et = 2.4; var s2 = this.lineOf(c, 'slow'); if (s2) this.say(c, s2); }
      if (c.patience <= 0) { if (c.lines.some(function (l) { return l.got; })) this.complete(c, true); else this.walk(c); }
    } else if (c.state === 'pay') { if (c.st > 1.25) this.leave(c, null); }
    else if (c.state === 'out') { var k2 = Math.min(1, c.st / 0.9); c.x = tx + (60 - tx) * Fx.ease.inOut(k2); if (k2 >= 1) this.cust.splice(this.cust.indexOf(c), 1); }
  };
  P.stepChat = function (c, dt) {
    var ch = c.chat; ch.t -= dt;
    if (ch.t > 0) return;
    ch.i++;
    if (ch.i >= ch.lines.length) { ch.on = false; ch.done = true; if (this.res.regs[c.id]) this.res.regs[c.id].chat = true; c.emote = 'note'; c.et = 1.6; return; }
    var l = ch.lines[ch.i], who = l[0], text = l[1];
    ch.t = 1.5 + text.length * 0.085;
    if (who === 'z') { this.zb = { text: text, t: 0, life: ch.t, x: c.x }; this.res.log.push(['z', text]); }
    else this.say(c, text, ch.t, who === 'b' ? 'b' : 'a');
  };
  P.leave = function (c, key) { if (key) { var l = this.lineOf(c, key); if (l) this.say(c, l); } c.state = 'out'; c.st = 0; };
  P.walk = function (c) {
    this.res.walked++; if (c.kind === 'reg') this.res.regs[c.id].outcome = 'walk';
    c.emote = 'anger'; c.et = 2; Au.play('leave'); var l = this.lineOf(c, 'bad') || this.lineOf(c, 'slow'); if (l) this.say(c, l);
    this.res.waitSum += 1; this.res.waitN++;
    c.state = 'out'; c.st = 0;
  };

  // ───────── 出品 → 客人 / 出餐台
  P.matchLine = function (c, item) {
    var best = null, bq = -1, self = this, tags = D.byId[item.dish].tags;
    c.lines.forEach(function (l) { if (l.got || l.dead || l.pend) return; if (l.d === item.dish) { var q = Stn.quality(item, l.mod, self.env) + 1; if (q > bq) { bq = q; best = l; } } else if (l.wish && tags.indexOf(l.wish) >= 0 && bq < 0.5) { bq = 0.5; best = l; } });
    return best;
  };
  P.target = function (dish) {
    var tags = D.byId[dish].tags, exact = null, wish = null;
    this.cust.forEach(function (c) {
      if (c.state !== 'wait') return;
      c.lines.forEach(function (l) { if (l.got || l.dead || l.pend) return; var f = c.patience / c.pmax; if (l.d === dish) { if (!exact || f < exact.f) exact = { c: c, f: f }; } else if (l.wish && tags.indexOf(l.wish) >= 0) { if (!wish || f < wish.f) wish = { c: c, f: f }; } });
    });
    return exact ? exact.c : wish ? wish.c : null;
  };
  P.smart = function (g) {
    var c = this.target(g.dish), item;
    if (c) { item = g.make(); if (item) this.send(item, g.x, g.y, c); return true; }
    if (this.shelf.length < this.shelfN) { item = g.make(); if (item) this.toShelf(item, g.x, g.y); return true; }
    Fx.float(g.x, g.y - 40, '台面满了', { size: 17 }); Au.play('wrong', { vol: 0.5 }); return false;
  };
  P.place = function (item, x, y) { var c = this.target(item.dish); if (c) this.send(item, x, y, c); else this.toShelf(item, x, y); };
  P.icon = function (item) { return function (ctx, x, y, k) { var s = 56 + Math.sin(k * Math.PI) * 10; A.food(ctx, item.dish, x - s / 2, y - s / 2, s, {}); }; };
  P.send = function (item, x, y, c) {
    var l = this.matchLine(c, item), self = this;
    if (!l) { this.toShelf(item, x, y); return; }
    l.pend = true;
    Fx.fly({ item: item, x0: x, y0: y, x1: c.x, y1: 330, dur: 0.3, arc: 60, draw: this.icon(item), done: function () { l.pend = false; if (c.state === 'wait') self.deliver(item, c, l); else self.toShelf(item, c.x, 330); } });
  };
  P.shelfPos = function (i) { var col = i % 2, row = Math.floor(i / 2); return { x: SHELF.x + 52 + col * 94, y: SHELF.y + 70 + row * 62 }; };
  P.toShelf = function (item, x, y) {
    var self = this, i = this.shelf.length; this.shelf.push(item); item.flying = true; var p = this.shelfPos(i);
    Fx.fly({ x0: x, y0: y, x1: p.x, y1: p.y, dur: 0.28, arc: 40, draw: this.icon(item), done: function () { item.flying = false; Au.play('bowl', { vol: 0.6 }); } });
  };
  P.deliver = function (item, c, l) {
    var q = Stn.quality(item, l.mod, this.env), d = D.byId[item.dish];
    l.got = true; l.q = q; l.gave = item.dish; c.hop = 1;
    this.res.qSum += q; this.res.qN++;
    if (d.oil) this.res.burnAdd += C.oilBurn(this.env.oilAge, this.env.bulk);
    Fx.float(c.x, 322, Stn.word(q), { size: 20, color: q >= 0.92 ? '#fff3b8' : q >= 0.6 ? '#fff8e8' : '#ffc9b0' });
    Au.play(q >= 0.92 ? 'perfect' : q >= 0.6 ? 'serve' : 'meh', { vol: 0.8 });
    if (q >= 0.92) Fx.burst(c.x, 330, 'glint', 4, 16);
    if (!this.openLines(c).length) this.complete(c, false);
  };
  P.priceOf = function (c) {
    var s = this.s, sum = 0, sets = {};
    c.lines.forEach(function (l) { if (!l.got) return; if (l.set) { sets[l.set] = (sets[l.set] || 0) + 1; } sum += Run.price(s, l.gave); });
    for (var k in sets) { var n = Math.floor(sets[k] / D.byId[k].set.length); if (n > 0) { var parts = 0; D.byId[k].set.forEach(function (p) { parts += Run.price(s, p); }); sum -= n * (parts - Run.price(s, k)); } }
    return sum;
  };
  P.complete = function (c, timedOut) {
    var got = c.lines.filter(function (l) { return l.got; }), dead = c.lines.filter(function (l) { return l.dead; }).length, self = this, res = this.res, s = this.s;
    if (!got.length) { this.res.soldout++; if (c.kind === 'reg') res.regs[c.id].outcome = 'soldout'; this.leave(c, 'bad'); return; }
    var qa = 0; got.forEach(function (l) { qa += l.q; res.sold[l.gave] = (res.sold[l.gave] || 0) + 1; }); qa /= got.length;
    var wf = clamp(c.wait / c.pmax, 0, 1), bonus = 0;
    c.lines.forEach(function (l) { if (l.wish && l.got && c.reg && D.byId[l.gave].tags.some(function (tg) { return c.reg.likes.indexOf(tg) >= 0; })) bonus += 0.03; });
    var remembered = c.hide && !c.asked && !timedOut && !dead && c.kind === 'reg';
    if (remembered) bonus += 0.04;
    var sat = Run.satisfaction(qa, wf, bonus) - dead * 0.07 - (timedOut ? 0.22 : 0) - (c.lines.length - got.length - dead) * 0.1 + (c.treated ? 0.1 : 0), g = Run.grade(sat);
    res.served++; res.waitSum += wf; res.waitN++;
    if (g === 'delight') res.delighted++; else if (g === 'fine') res.fine++; else res.meh++;
    var pay = this.priceOf(c), tip = 0, txt = null;
    if (c.treated) { pay = 0; txt = '有人请了'; }
    if (g === 'delight' && !c.treated && Math.random() < c.tip * 0.6) tip = C.tip.delight * (Math.random() < 0.25 ? 2 : 1);
    var r = c.kind === 'reg' ? res.regs[c.id] : null;
    if (r) { r.outcome = g; r.remembered = remembered; r.asked = c.asked; r.chat = !!(c.chat && c.chat.done); }
    if (c.act === 'credit') { r.credit = pay; res.creditSum += pay; txt = '记账 ' + U.yuan(pay); pay = 0; tip = 0; Au.play('note'); }
    else if (c.act === 'repay') { var owed = s.credit[c.id] || 0; pay += owed; r.repaid = true; if (owed) txt = '连欠的一起 +' + U.yuan(pay); }
    else if (c.act === 'treat') { pay *= 2; this.treat = true; txt = '多付一份 +' + U.yuan(pay); }
    res.revenue += pay; res.tips += tip;
    if (pay + tip > 0) { this.coins(c.x, 400, pay + tip, c.act === 'coins'); Fx.float(c.x, 276, txt || ('+' + U.yuan(pay) + (tip ? ' 小费' : '')), { size: 21, color: '#ffe28a' }); }
    else if (txt) Fx.float(c.x, 276, txt, { size: 20, color: '#ffe28a' });
    if (c.act === 'overpay' && pay > 0) { this.extras.push({ x: c.x + 96, y: 470, amount: Math.min(pay, 400), t: 7, id: c.id, c: c }); r.extra = null; }
    if (remembered) { Fx.float(c.x, 236, '你还记得', { size: 18, color: '#c8f0d8' }); Au.play('heart'); }
    c.emote = g === 'delight' ? 'heart' : g === 'meh' ? 'anger' : null; c.et = 1.6;
    if (g === 'delight') Fx.burst(c.x, 300, 'heart', 2, 14);
    var line = this.lineOf(c, g === 'delight' ? 'good' : g === 'fine' ? 'ok' : 'bad'); if (line) this.say(c, line);
    if (c.kind === 'walk' && line && (g !== 'fine') && res.quotes.length < 4) res.quotes.push({ from: People.walkName(c.arch), text: line, g: g });
    c.state = 'pay'; c.st = 0; c.outcome = g; c.hidden = false;
  };
  P.coins = function (x, y, amount, slow) {
    var n = clamp(Math.round(amount / 300) + 1, 1, slow ? 9 : 6);
    for (var i = 0; i < n; i++) (function (i) { Fx.fly({ x0: x + (Math.random() - 0.5) * 30, y0: y, x1: TIN.x, y1: TIN.y, dur: 0.45 + i * (slow ? 0.16 : 0.06), arc: 70 + i * 8, draw: function (ctx, cx, cy) { ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#8a5a14'; ctx.fillRect(cx - 2, cy - 2, 4, 4); }, done: function () { Au.play('coin', { vol: 0.6, pitch: 0.9 + i * 0.06 }); } }); })(i);
    this.tinPop = 1;
  };
  // 帮工桂芬：接豆浆、拿小炉上的东西、添米、磨豆
  P.helper = function (dt) {
    this.helperT -= dt; if (this.helperT > 0) return; this.helperT = 3.6;
    var self = this, done = false;
    this.stations.forEach(function (st) {
      if (done) return;
      if (st.type === 'soy') { if (st.cups > 0 && self.target('soy') && !st.pouring) { st.cups--; self.stock.soy--; self.env.svc.cooked('soy'); self.place({ dish: 'soy', q0: 0.86, out: self.t, st: 'soy' }, st.cupPos().x, st.cupPos().y); done = true; } else if (st.cups <= 1 && st.reserve() > 0 && !st.grinding) { st.cups += Math.min(st.cap - st.cups, st.reserve()); done = true; } }
      else if (st.type === 'side') { st.dishes.forEach(function (d, i) { if (!done && self.stock[d] > 0 && self.target(d)) { self.stock[d]--; self.env.svc.cooked(d); self.place({ dish: d, q0: 0.92, out: self.t, st: 'side' }, st.pos(i).x, st.pos(i).y); done = true; } }); }
      else if (st.type === 'pot') { if (st.stick > 0.6) { st.stir(); done = true; } else if (st.servings <= 1 && st.reserve() > 0 && st.cookT <= 0) { st.refill(); done = true; } }
    });
    if (done) this.helperHop = 1;
  };

  // ───────── 指针
  P.pointer = function (type, x, y) {
    if (type !== 'down' || this.state !== 'open') return null;
    var self = this, i, c;
    // 多给的硬币：点一下还回去
    for (i = 0; i < this.extras.length; i++) { var e = this.extras[i]; if (Math.hypot(x - e.x, y - e.y) < 34) { this.extras.splice(i, 1); this.res.regs[e.id].extra = 'returned'; Au.play('coin'); Fx.float(e.x, e.y - 30, '多给的，还他', { size: 18, color: '#c8f0d8' }); if (e.c && e.c.state !== 'out') { e.c.emote = 'heart'; e.c.et = 1.5; } return null; } }
    // 客人：接话 / 问一句
    for (i = 0; i < this.cust.length; i++) {
      c = this.cust[i]; if (c.state !== 'wait') continue;
      if (c.chat && !c.chat.on && !c.chat.done && Math.hypot(x - (c.x + 74), y - 292) < 36) { c.chat.on = true; c.chat.t = 0; Au.play('tap'); return null; }
      if (c.hidden && Math.abs(x - c.x) < 70 && y > TICKET_Y && y < TICKET_Y + 130) { c.hidden = false; c.asked = true; Au.play('page'); this.say(c, c.id === 'zhao' ? '老样子嘛——' : '忘啦？', 1.6); return null; }
    }
    // 出餐台
    for (i = 0; i < this.shelf.length; i++) { var p = this.shelfPos(i), it = this.shelf[i]; if (!it.flying && Math.abs(x - p.x) < 44 && Math.abs(y - p.y) < 30) { var g = { dish: it.dish, x: p.x, y: p.y, make: function () { var k = self.shelf.indexOf(it); if (k < 0) return null; self.shelf.splice(k, 1); return it; } }; return this.begin({ grab: g, tap: function () { var t = self.target(it.dish); if (t) { var m = g.make(); if (m) self.send(m, p.x, p.y, t); } else { Fx.float(p.x, p.y - 30, '现在没人要', { size: 16 }); } } }, x, y); } }
    for (i = 0; i < this.stations.length; i++) { var st = this.stations[i], r = st.r; if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 6) { var act = st.press(x, y); if (act) return this.begin(act, x, y); } }
    return null;
  };
  P.begin = function (act, x0, y0) {
    var self = this;
    if (act.hold) return function (type) { if (type === 'up' || type === 'cancel') act.hold.end(); };
    if (!act.grab) { act.tap(); return null; }
    var g = act.grab, moved = false;
    return function (type, x, y) {
      if (type === 'move') {
        if (!moved && Math.hypot(x - x0, y - y0) > 18) { var item = g.make(); if (!item) { moved = true; self.drag = null; return; } moved = true; self.drag = { item: item, x: x, y: y, g: g }; Au.play('pickup'); }
        if (self.drag) { self.drag.x = x; self.drag.y = y; }
      } else if (type === 'up' || type === 'cancel') {
        if (self.drag) { var d = self.drag; self.drag = null; self.drop(d.item, x, y); }
        else if (!moved && type === 'up') { if (act.tap) act.tap(); else self.smart(g); }
      }
    };
  };
  P.drop = function (item, x, y) {
    var self = this;
    if (y < 470) {
      var c = this.cust.filter(function (k) { return k.state === 'wait' && Math.abs(x - k.x) < 105; }).sort(function (a, b) { return Math.abs(x - a.x) - Math.abs(x - b.x); })[0];
      if (c) { var l = this.matchLine(c, item); if (l) { this.deliver(item, c, l); return; } c.shake = 0.4; Au.play('wrong'); Fx.float(c.x, 322, '不是这位的', { size: 17 }); }
    }
    if (x > SHELF.x + SHELF.w - 46 && y < SHELF.y + 40 && y > SHELF.y - 10) { Au.play('trash'); this.res.wasted++; Fx.burst(x, y, 'dust', 6, 8); return; }
    if (x >= SHELF.x - 10 && y >= SHELF.y - 10) { this.shelf.push(item); Au.play('bowl', { vol: 0.6 }); return; }
    this.place(item, x, y);
  };

  // ───────── 下一步该做什么（新手指引和自动试玩共用）
  P.nextAction = function (o) {
    o = o || {};
    var self = this, env = this.env, acts = [], needs = [], i;
    this.cust.slice().sort(function (a, b) { return a.patience / a.pmax - b.patience / b.pmax; }).forEach(function (c) { if (c.state !== 'wait' || c.peek) return; c.lines.forEach(function (l) { if (!l.got && !l.dead && !l.pend) needs.push({ c: c, l: l }); }); });
    function stationOf(type) { return self.stations.filter(function (s) { return s.type === type; })[0]; }
    function needMod(dish) { var n = needs.filter(function (k) { return k.l.d === dish; })[0]; return n ? n.l.mod : null; }
    var supply = {};
    this.shelf.forEach(function (it) { supply[it.dish] = (supply[it.dish] || 0) + 1; });
    Fx.flies.forEach(function (f) { if (f.item) supply[f.item.dish] = (supply[f.item.dish] || 0) + 1; });
    // 1 照看：糊的、该翻的、该出锅的、要搅的、要添的
    this.stations.forEach(function (st) {
      var pts = st.points();
      if (st.slots) st.slots.forEach(function (it, j) {
        if (!it) return; var p = pts['slot' + j];
        if (it.burnt) { acts.push({ pri: 5, kind: 'tap', x: p[0], y: p[1], label: '糊了，清掉' }); return; }
        supply[it.dish] = (supply[it.dish] || 0) + 1;
        var w = Stn.windowOf(it, env), due = (it.flips + 1) / (it.need + 1) * w[0] * 0.92, verb = D.byId[it.dish].cook.verb || '翻面';
        if (it.flips < it.need) { if (it.d >= due) acts.push({ pri: 8, kind: 'tap', x: p[0], y: p[1], label: '点一下' + verb }); return; }
        var mod = needMod(it.dish), aim = mod === '嫩' ? w[0] - 0.12 : mod === '老' ? w[1] + 0.08 : w[0] + (w[1] - w[0]) * (o.aim == null ? 0.35 : o.aim);
        if (it.d >= aim) acts.push({ pri: 9, kind: 'tap', x: p[0], y: p[1], label: '正好，点一下出锅' });
      });
      if (st.type === 'pot') {
        if (st.stick > (o.stir || 0.62)) acts.push({ pri: 6, kind: 'tap', x: pts.stir[0], y: pts.stir[1], label: '搅一搅，别糊底' });
        if (st.servings <= 1 && st.reserve() > 0 && st.cookT <= 0) acts.push({ pri: 7, kind: 'tap', x: pts.refill[0], y: pts.refill[1], label: '锅快空了，添米' });
      }
      if (st.type === 'soy' && st.cups <= 0 && st.reserve() > 0 && !st.grinding) acts.push({ pri: 7, kind: 'hold', x: pts.mill[0], y: pts.mill[1], dur: 2.3, label: '按住磨豆' });
    });
    // 2 出餐台上有现成的
    for (i = 0; i < this.shelf.length; i++) { var it = this.shelf[i]; if (!it.flying && this.target(it.dish)) { var sp = this.shelfPos(i); acts.push({ pri: 8.5, kind: 'tap', x: sp.x, y: sp.y, label: '台上有现成的，递过去' }); break; } }
    // 3 还缺什么就做什么
    var planned = {};
    needs.forEach(function (n) {
      var dish = n.l.d;
      if (!dish) { var cands = self.s.plan.menu.filter(function (id) { return D.byId[id].tags.indexOf(n.l.wish) >= 0 && self.avail(id) > 0; }); cands.sort(function (a, b) { return (D.byId[a].cook ? 1 : 0) - (D.byId[b].cook ? 1 : 0); }); dish = cands[0]; if (!dish) return; }
      if ((supply[dish] || 0) > (planned[dish] || 0)) { planned[dish] = (planned[dish] || 0) + 1; return; }
      planned[dish] = (planned[dish] || 0) + 1;
      var d = D.byId[dish], st = stationOf(d.st); if (!st) return; var pts = st.points(), pri = 4 - n.c.patience / n.c.pmax;
      if (n.c.hidden && !o.remember) { acts.push({ pri: 3, kind: 'tap', x: n.c.x, y: TICKET_Y + 60, label: '不记得就点票据问一句' }); return; }
      if (d.st === 'pot') { if (st.servings >= 1 && (self.stock[dish] || 0) > 0) { var pp = d.top ? pts['top_' + dish] : pts.take; acts.push({ pri: pri, kind: 'tap', x: pp[0], y: pp[1], label: d.top ? '点小碗，盛一碗' + d.name : '点粥锅，盛一碗' }); } }
      else if (d.st === 'soy') { if (st.cups > 0 && !st.pouring) { var band = st.describe().band; acts.push({ pri: pri, kind: 'hold', x: pts.pour[0], y: pts.pour[1], dur: ((band[0] + band[1]) / 2 + (o.pourErr || 0)) / 0.95, label: '按住接豆浆，到刻线松手' }); } }
      else if (d.st === 'side') { if ((self.stock[dish] || 0) > 0) acts.push({ pri: pri, kind: 'tap', x: pts['src_' + dish][0], y: pts['src_' + dish][1], label: '顺手拿一个' }); }
      else if (st.free() >= 0 && (self.stock[dish] || 0) > 0) acts.push({ pri: pri, kind: 'tap', x: pts['src_' + dish][0], y: pts['src_' + dish][1], label: d.st === 'fryer' ? '点面板，下锅' : d.st === 'boil' ? '点一下，下锅煮' : '点一下，上锅' });
    });
    // 4 有话想说的常客（不忙的时候）
    if (o.chat) this.cust.forEach(function (c) { if (c.state === 'wait' && c.chat && !c.chat.on && !c.chat.done) acts.push({ pri: 2.5, kind: 'tap', x: c.x + 74, y: 292, label: '他有话说，点"…"接一句' }); });
    if (o.extra !== false) this.extras.forEach(function (e) { if (o.returnExtra !== false) acts.push({ pri: 9.5, kind: 'tap', x: e.x, y: e.y, label: '他多给了，点硬币还回去' }); });
    acts.sort(function (a, b) { return b.pri - a.pri; });
    return acts[0] || null;
  };

  // ───────── 结果
  P.result = function () {
    var res = this.res, left = {}, n = 0, k;
    for (k in this.stock) { if (this.stock[k] > 0) { left[k] = this.stock[k]; n += this.stock[k]; } }
    this.shelf.forEach(function (it) { left[it.dish] = (left[it.dish] || 0) + 1; n++; });
    res.leftovers = left; res.leftover = n;
    return res;
  };
  P.describe = function () {
    return { t: +this.t.toFixed(1), len: this.len, state: this.state, queue: this.queue.length, shelf: this.shelf.map(function (i) { return i.dish; }), stock: this.stock,
      customers: this.cust.map(function (c) { return { who: c.id || c.arch, slot: c.slot, x: Math.round(c.x), state: c.state, patience: +(c.patience / c.pmax).toFixed(2), hidden: !!c.hidden, chat: c.chat ? (c.chat.done ? 'done' : c.chat.on ? 'on' : 'offer') : null, lines: c.lines.map(function (l) { return (l.d || '?' + l.wish) + (l.mod ? ':' + l.mod : '') + (l.got ? '✓' : l.dead ? '✗' : ''); }) }; }),
      stations: this.stations.map(function (s) { var d = s.describe(); d.points = s.points(); return d; }), revenue: this.res.revenue, served: this.res.served, walked: this.res.walked, balked: this.res.balked, extras: this.extras.length };
  };

  // ───────── 绘制
  function wrapBubble(ctx, text, max) { return U.wrap(ctx, text, max, 19, 'bold'); }
  P.drawBubble = function (ctx, b) {
    var c = b.c, k = Math.min(1, b.t * 7), fade = b.t > b.life - 0.25 ? (b.life - b.t) / 0.25 : 1, kid = b.style === 'b';
    var ls = wrapBubble(ctx, b.text, 220), w = 0; ctx.save(); ctx.font = U.font(19, 'bold'); ls.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); }); ctx.restore();
    var bw = w + 28, bh = 16 + ls.length * 25, x = clamp(c.x - bw / 2 + (kid ? -150 : 24), 150, 1270 - bw), y = (kid ? 448 : 428) - bh;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x + bw / 2, y + bh); ctx.scale(0.6 + 0.4 * Fx.ease.back(k), 0.6 + 0.4 * Fx.ease.back(k)); ctx.translate(-(x + bw / 2), -(y + bh));
    ctx.fillStyle = 'rgba(40,22,8,.25)'; U.rr(ctx, x + 2, y + 4, bw, bh, 13); ctx.fill();
    ctx.fillStyle = kid ? '#fff3c8' : '#fffaf0'; ctx.strokeStyle = '#7d5a35'; ctx.lineWidth = 2.5; U.rr(ctx, x, y, bw, bh, 13); ctx.fill(); ctx.stroke();
    var tx = clamp(c.x + (kid ? -60 : 0), x + 18, x + bw - 18);
    ctx.beginPath(); ctx.moveTo(tx - 8, y + 1); ctx.lineTo(tx, y - 12); ctx.lineTo(tx + 8, y + 1); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx - 8, y); ctx.lineTo(tx, y - 12); ctx.lineTo(tx + 8, y); ctx.stroke();
    ls.forEach(function (l, i) { U.text(ctx, l, x + bw / 2, y + 30 + i * 25, { size: 19, bold: true, align: 'center', color: '#3b2a1a' }); });
    ctx.restore();
  };
  P.drawTicket = function (ctx, c) {
    var groups = [], self = this;
    c.lines.forEach(function (l) { var key = (l.d || '?' + l.wish) + '|' + (l.mod || '') + '|' + (l.set || ''); var g = groups.filter(function (x) { return x.key === key && x.got === l.got && x.dead === l.dead; })[0]; if (g) g.n++; else groups.push({ key: key, l: l, n: 1, got: l.got, dead: l.dead }); });
    var rows = c.hidden ? 1 : groups.length, rh = rows > 3 ? 34 : rows > 2 ? 40 : 44, w = 136, h = 34 + (c.hidden ? 62 : rows * rh) + 8, x = c.x - w / 2, y = TICKET_Y, f = clamp(c.patience / c.pmax, 0, 1);
    var sway = Math.sin(this.t * 1.6 + c.uid) * 0.02 + (f < 0.3 && c.state === 'wait' ? Math.sin(this.t * 22) * 0.015 : 0) + (c.shake > 0 ? Math.sin(c.shake * 40) * 0.06 : 0);
    ctx.save(); ctx.translate(c.x, y - 6); ctx.rotate(sway); ctx.translate(-c.x, -(y - 6));
    ctx.fillStyle = 'rgba(40,22,8,.22)'; U.rr(ctx, x + 3, y + 4, w, h, 6); ctx.fill();
    ctx.fillStyle = '#fbf5e4'; U.rr(ctx, x, y, w, h, 6); ctx.fill(); ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; ctx.stroke();
    // 头：是谁
    var reg = c.reg, name = reg ? reg.name : People.walkName(c.arch);
    ctx.fillStyle = reg ? '#2f6f66' : '#b89a6a'; U.rr(ctx, x + 2, y + 2, w - 4, 24, 4); ctx.fill();
    U.text(ctx, name, x + 10, y + 20, { size: 16, bold: true, color: '#fff8e8' });
    if (c.togo) U.text(ctx, '打包', x + w - 10, y + 20, { size: 14, bold: true, align: 'right', color: '#ffe28a' });
    else if (c.treated) U.text(ctx, '有人请', x + w - 10, y + 20, { size: 14, bold: true, align: 'right', color: '#ffe28a' });
    // 耐心
    ctx.fillStyle = 'rgba(60,40,20,.18)'; ctx.fillRect(x + 8, y + 29, w - 16, 4);
    ctx.fillStyle = f > 0.5 ? '#5a9a56' : f > 0.25 ? '#e0a030' : '#c8442f'; ctx.fillRect(x + 8, y + 29, (w - 16) * f, 4);
    if (c.hidden) {
      U.text(ctx, '老样子', c.x, y + 66, { size: 26, bold: true, align: 'center', color: '#3b2a1a' });
      U.text(ctx, '不记得？点这里问', c.x, y + 88, { size: 13, align: 'center', color: '#8d7a60' });
    } else groups.forEach(function (g, i) {
      var ry = y + 38 + i * rh, l = g.l, is = rh - 4;
      ctx.save(); if (g.got || g.dead) ctx.globalAlpha = 0.38;
      if (c.hide && !g.got) ctx.globalAlpha *= 0.8;
      if (l.d) A.food(ctx, l.d, x + 6, ry, is, {});
      else { ctx.fillStyle = '#e8d8b0'; U.rr(ctx, x + 8, ry + 3, is - 4, is - 8, 8); ctx.fill(); U.text(ctx, '?', x + 6 + is / 2, ry + is / 2 + 7, { size: 22, bold: true, align: 'center', color: '#8a6a3a' }); }
      var tx = x + 10 + is;
      if (l.wish) U.text(ctx, '要' + l.wish, tx, ry + is / 2 + 6, { size: 17, bold: true, color: '#3b2a1a' });
      else { if (g.n > 1) { U.text(ctx, '×' + g.n, tx, ry + is / 2 + 7, { size: 21, bold: true, color: '#3b2a1a' }); tx += 32; } if (l.mod) { ctx.fillStyle = l.mod === '嫩' ? '#f0c860' : l.mod === '老' ? '#b86a2a' : '#7fb0c8'; ctx.beginPath(); ctx.arc(tx + 14, ry + is / 2, 14, 0, 7); ctx.fill(); U.text(ctx, l.mod, tx + 14, ry + is / 2 + 6, { size: 17, bold: true, align: 'center', color: l.mod === '嫩' ? '#3b2a1a' : '#fff8e8' }); } }
      ctx.restore();
      if (g.got) { ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + w - 34, ry + is / 2); ctx.lineTo(x + w - 26, ry + is / 2 + 8); ctx.lineTo(x + w - 12, ry + is / 2 - 10); ctx.stroke(); }
      if (g.dead) { ctx.strokeStyle = '#8d7a60'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 8, ry + is / 2); ctx.lineTo(x + w - 8, ry + is / 2); ctx.stroke(); U.text(ctx, '没了', x + w - 10, ry + is / 2 + 5, { size: 14, align: 'right', color: '#8d7a60' }); }
    });
    if (c.act === 'credit' && c.state === 'pay') { ctx.save(); ctx.translate(c.x + 20, y + h - 26); ctx.rotate(-0.2); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 3; ctx.strokeRect(-30, -15, 60, 30); U.text(ctx, '记账', 0, 7, { size: 19, bold: true, align: 'center', color: '#b8432f' }); ctx.restore(); }
    // 夹子
    ctx.fillStyle = '#c99a5a'; U.rr(ctx, c.x - 8, y - 12, 16, 20, 3); ctx.fill(); ctx.strokeStyle = '#7a5226'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  };
  P.drawBack = function (ctx) {
    var s = this.s, self = this, i;
    Shop.drawBack(ctx, s, { post: s.plan.post, curtain: !!s.flags.man_curtain });
    // 门外排队
    if (this.queue.length) {
      ctx.save(); ctx.beginPath(); ctx.rect(40, 150, 96, 330); ctx.clip();
      for (i = Math.min(2, this.queue.length - 1); i >= 0; i--) { var q = this.queue[i], bob = Math.sin(this.t * 2 + i * 1.7) * 2; People.draw(ctx, q.id || 'walk', 70 + i * 24, 482, 168, { look: q.kind === 'walk' ? { arch: q.arch, seed: q.seed } : null, bob: bob, alpha: 0.92 }); }
      ctx.restore();
      Stn.badge(ctx, 90, 136, '门外 ' + this.queue.length, this.queue.length >= 4);
    }
    // 柜台前的客人
    this.cust.slice().sort(function (a, b) { return a.slot - b.slot; }).forEach(function (c) {
      var moving = c.state === 'in' || c.state === 'out', bob = moving ? Math.abs(Math.sin(c.st * 11)) * -7 : Math.sin(self.t * 1.9 + c.uid) * 1.6 - Math.max(0, c.hop) * 9;
      var sx = c.shake > 0 ? Math.sin(c.shake * 46) * 5 : 0, h = People.height(c.id);
      People.draw(ctx, c.id || 'walk', c.x + sx, FOOT, h, { look: c.kind === 'walk' ? { arch: c.arch, seed: c.seed } : null, bob: bob, flip: c.state === 'out', squash: c.hop > 0 ? -0.03 * c.hop : 0 });
    });
    if (s.helper) { this.helperHop = Math.max(0, (this.helperHop || 0) - 0.05); People.draw(ctx, 'guifen', 1178, FOOT + 6, 262, { bob: -this.helperHop * 8 + Math.sin(this.t * 1.7) * 1.5, flip: true }); }
  };
  P.drawShelf = function (ctx) {
    var x = SHELF.x, y = SHELF.y, w = SHELF.w, rows = Math.ceil(this.shelfN / 2), h = 46 + rows * 62, i;
    ctx.fillStyle = 'rgba(40,20,8,.28)'; U.rr(ctx, x, y + 6, w, h, 12); ctx.fill();
    ctx.fillStyle = '#d9a868'; U.rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#c4904e'; U.rr(ctx, x + 8, y + 36, w - 16, h - 44, 8); ctx.fill();
    U.text(ctx, '出餐台', x + 14, y + 26, { size: 17, bold: true, color: '#5a3418' });
    // 泔水桶：拖过来倒掉
    ctx.fillStyle = '#6f7a80'; U.rr(ctx, x + w - 40, y + 6, 28, 26, 5); ctx.fill(); ctx.strokeStyle = '#3c4448'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#3c4448'; ctx.fillRect(x + w - 42, y + 5, 32, 4);
    for (i = 0; i < this.shelfN; i++) { var p = this.shelfPos(i); ctx.fillStyle = 'rgba(90,52,20,.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 16, 36, 9, 0, 0, 7); ctx.fill(); }
    for (i = 0; i < this.shelf.length; i++) {
      var it = this.shelf[i]; if (it.flying) continue; var sp = this.shelfPos(i), d = D.byId[it.dish], age = this.t - it.out, hold = d.hold * (this.s.upg.shelf ? 1.6 : 1), cold = age > hold;
      A.food(ctx, it.dish, sp.x - 30, sp.y - 34, 60, { alpha: cold ? 0.72 : 1 });
      if (cold) U.text(ctx, '凉了', sp.x + 22, sp.y + 22, { size: 13, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(60,40,20,.9)' });
      else if (d.temp && age < hold * 0.6 && Math.sin(this.t * 3 + i) > 0.2) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(sp.x + Math.sin(this.t * 2 + i) * 5, sp.y - 34 - ((this.t * 14 + i * 7) % 14), 4, 0, 7); ctx.fill(); }
    }
  };
  P.draw = function (ctx) {
    var self = this, s = this.s, i;
    this.drawBack(ctx);
    Shop.drawCounter(ctx);
    // 胃药：烧心的物证
    var pill = s.burn >= 85 ? 3 : s.burn >= 60 ? 2 : s.burn >= 30 ? 1 : 0;
    for (i = 0; i < pill; i++) { var px = 1010 + i * 20, py = 452; ctx.fillStyle = '#f4f0e6'; U.rr(ctx, px, py - 8 - i * 3, 30, 14, 3); ctx.fill(); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#4a8ab8'; ctx.fillRect(px + 3, py - 5 - i * 3, 24, 4); }
    this.stations.forEach(function (st) { st.draw(ctx); });
    this.drawShelf(ctx);
    Fx.drawParts(ctx);
    Shop.drawLight(ctx);
    // 票据挂在一根绳上
    ctx.strokeStyle = 'rgba(90,60,30,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(190, TICKET_Y - 14); ctx.quadraticCurveTo(640, TICKET_Y - 4, 1000, TICKET_Y - 14); ctx.stroke();
    this.cust.forEach(function (c) { if (c.state === 'wait' || c.state === 'pay') { if (!c.peek) self.drawTicket(ctx, c); if (c.chat && !c.chat.on && !c.chat.done && c.state === 'wait') People.emote(ctx, 'dots', c.x + 74, 292, c.st); if (c.emote && c.et > 0) People.emote(ctx, c.emote, c.x - 70, 288, 1.8 - c.et + 0.2); } });
    if (this.doorTalk) { var dk = this.doorTalk, t1 = dk.t < 2.6 ? dk.a : dk.b, yy = dk.t < 2.6 ? 210 : 250, wv = Math.min(1, (dk.t % 2.6) * 6); if (t1) { ctx.save(); ctx.globalAlpha = Math.min(wv, dk.t > 4.6 ? (5 - dk.t) / 0.4 : 1) * 0.94; ctx.font = U.font(15, 'bold'); var tw = ctx.measureText(t1).width + 20; ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#a88a5a'; ctx.lineWidth = 2; U.rr(ctx, 140, yy, tw, 28, 10); ctx.fill(); ctx.stroke(); U.text(ctx, t1, 150, yy + 20, { size: 15, bold: true, color: '#5a4630' }); ctx.restore(); } }
    this.bubbles.forEach(function (b) { if (b.c.state !== 'out' || b.t < 1) self.drawBubble(ctx, b); });
    if (this.zb) { var z = this.zb, zk = Math.min(1, z.t * 7); ctx.save(); ctx.font = U.font(19, 'bold'); var zw = ctx.measureText(z.text).width + 30, zx = clamp(z.x - zw / 2 + 110, 20, 1260 - zw), zy = 462; ctx.globalAlpha = z.t > z.life - 0.25 ? (z.life - z.t) / 0.25 : zk; ctx.fillStyle = '#2f6f66'; ctx.strokeStyle = '#1f4d47'; ctx.lineWidth = 2.5; U.rr(ctx, zx, zy, zw, 40, 13); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(zx + zw / 2 - 8, zy + 39); ctx.lineTo(zx + zw / 2, zy + 52); ctx.lineTo(zx + zw / 2 + 8, zy + 39); ctx.fill(); U.text(ctx, z.text, zx + zw / 2, zy + 27, { size: 19, bold: true, align: 'center', color: '#fff8e8' }); ctx.restore(); }
    // 多给的硬币
    this.extras.forEach(function (e) { var k = 1 + Math.sin(self.t * 9) * 0.12; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(k, k); Shop.glow(ctx, 0, 0, 30, '255,226,138', 0.55); ctx.fillStyle = '#e8b54a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#8a5a14'; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); U.text(ctx, '多给了 · 点它还回去', e.x, e.y + 34, { size: 16, bold: true, align: 'center', color: '#fff8e8', stroke: 'rgba(70,40,14,.9)' }); });
    Fx.drawFlies(ctx);
    Shop.grade(ctx);
    if (this.drag) { var dg = this.drag; ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(dg.x, dg.y + 30, 26, 8, 0, 0, 7); ctx.fill(); ctx.restore(); A.food(ctx, dg.item.dish, dg.x - 36, dg.y - 44, 72, {}); }
    Fx.drawFloats(ctx);
  };
  return { Service: Service, TIN: TIN, SHELF: SHELF, FOOT: FOOT, TICKET_Y: TICKET_Y };
});
