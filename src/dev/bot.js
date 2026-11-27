// 自动试玩：机器人用和玩家一样的指针事件（按下/移动/抬起）操作——点灶台、按住接豆浆、点气泡接话、选纸条、按住拉卷帘门。
// 用于端到端回放与截图检查；不直接改状态（晨备里的档位除外：那里用界面上的同一组函数）。
BSX.define('dev/bot', function (require) {
  var Run = require('core/run');
  var Sim = require('core/sim');
  var Cast = require('content/cast');
  var U = require('ui/ui');
  function Bot(app, o) {
    this.app = app; this.o = o || {}; this.cool = 0.5; this.hold = null; this.stopped = false; this.log = [];
    this.pol = Sim.policies[this.o.policy || 'average'] || Sim.policies.average;
    var sk = this.o.skill || 'good';
    this.sk = { react: sk === 'great' ? 0.16 : sk === 'good' ? 0.24 : 0.42, aim: sk === 'sloppy' ? 0.9 : 0.35, pourErr: sk === 'sloppy' ? -0.2 : 0, remember: sk !== 'sloppy', chat: sk !== 'sloppy', returnExtra: this.pol.skill.returnExtra !== false };
  }
  var B = Bot.prototype;
  B.inject = function (type, x, y) { var v = this.app.view; this.app.input(type, x * v.s + v.ox, y * v.s + v.oy, 77); };
  B.tap = function (x, y) { this.inject('down', x, y); this.inject('up', x, y); };
  B.tapId = function (id) { var h = U.hits.filter(function (z) { return z.id === id; })[0]; if (!h || h.disabled) return false; this.tap(h.x + h.w / 2, h.y + h.h / 2); return true; };
  B.holdAt = function (x, y, dur) { this.inject('down', x, y); this.hold = { x: x, y: y, t: dur }; };
  B.tick = function (dt) {
    var app = this.app, scr = app.overlay || app.screen, self = this;
    if (this.stopped || !scr || app.fadeDir) return;
    if (this.hold) { this.hold.t -= dt; if (this.hold.t <= 0) { this.inject('up', this.hold.x, this.hold.y); this.hold = null; this.cool = this.sk.react; } return; }
    this.cool -= dt; if (this.cool > 0) return;
    var s = app.state;
    switch (scr.name) {
      case 'title': app.newRun({ seed: this.o.seed || 7 }); this.cool = 0.5; break;
      case 'scene': {
        var d = scr.dir, c = d && d.cur; if (!c) { this.cool = 0.2; break; }
        if (c.type === 'say') { this.tap(640, 320); this.cool = this.o.fast ? 0.06 : 0.5; }
        else if (c.type === 'choice') { var ok = c.opts.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return x.o.ok; }), pick = this.pol.choose(d.scene.id, ok.map(function (x) { return x.o.c; }), s), ch = ok[Math.max(0, Math.min(ok.length - 1, pick))]; if (this.tapId('choice' + ch.i)) this.log.push(d.scene.id + ' → ' + ch.o.c.label); this.cool = 0.4; }
        else if (c.type === 'do') { if (c.kind === 'hold') this.holdAt(640, 588, 1.15); else this.tap(640, 588); this.cool = 0.3; }
        else this.cool = 0.1;
        break;
      }
      case 'prep': {
        if (scr.closed) { this.tapId('prep_closed'); this.cool = 0.5; break; }
        if (!scr.botDone) { Sim.prep(s, this.pol); for (var g = 0; g < 12 && Run.planCost(s).total > Math.max(0, s.cash) + 8000; g++) s.plan.menu.forEach(function (id) { Run.setStock(s, id, Math.max(1, Math.floor((s.plan.stock[id] || 0) * 0.7))); }); scr.botDone = true; this.cool = this.o.fast ? 0.1 : 0.8; break; }
        var h = U.hits.filter(function (z) { return z.id === 'open'; })[0]; if (h && !h.disabled) this.holdAt(h.x + h.w / 2, h.y + h.h / 2, 1.2); this.cool = 0.4; break;
      }
      case 'shift': {
        if (scr.phase === 'closing') { if (scr.pt > 1.3) { this.tap(640, 620); this.cool = 0.5; } break; }
        if (scr.phase !== 'open') break;
        var svc = scr.svc, a = svc.nextAction({ aim: this.sk.aim, pourErr: this.sk.pourErr, remember: this.sk.remember, chat: this.sk.chat && svc.queue.length < 2, returnExtra: this.sk.returnExtra });
        if (!a) { this.cool = 0.08; break; }
        if (a.kind === 'hold') this.holdAt(a.x, a.y, a.dur); else { this.tap(a.x, a.y); this.cool = this.sk.react * (0.8 + Math.random() * 0.5); }
        break;
      }
      case 'town': {
        var m = scr.mode, Tn = require('content/town'), T = require('core/town'), st = scr.st, self2 = this;
        this.cool = this.o.fast ? 0.45 : 0.7;
        if (m === 'note') { this.tapId('note_ok'); break; }
        if (m === 'result') { if (scr.mt > 0.5) this.tapId('res_ok'); break; }
        if (m === 'depot') { if (!this.tapId('acc_0')) this.tapId('dp_skip'); this.log.push('d' + s.day + ' 接包餐'); break; }
        if (m === 'market') {
          var li = scr.seen.map(function (x) { return x.some(Boolean); }).indexOf(false);
          if (scr.looks > 0 && li >= 0) { this.tapId('look_' + li + '_' + (li === scr.lots[li].blank ? 1 : 0)); break; }
          var todo = scr.lots.map(function (l, i) { var g = Tn.goods[l.item], seenBad = scr.seen[i].some(function (v, j) { return v && g.bad.indexOf(T.clue(l, j)) >= 0; }), seenGood = scr.seen[i].some(function (v, j) { return v && g.good.indexOf(T.clue(l, j)) >= 0; }); return (seenGood || (l.seller === 'qin' && !seenBad)) && !scr.take[i] && l.price < s.cash - 30000 ? i : -1; }).filter(function (i) { return i >= 0; });
          if (todo.length) { this.tapId('take_' + todo[0]); break; }
          this.tapId('pay'); this.log.push('d' + s.day + ' 验货收 ' + scr.take.filter(Boolean).length + ' 样'); break;
        }
        if (m !== 'map' || scr.anim) break;
        if (this.lastClock !== st.clock || this.lastAt !== st.at) { this.lastClock = st.clock; this.lastAt = st.at; this.stuck = 0; }
        if (this.o.town === 'home') { this.tapId('end'); break; }
        var acts = T.actionsAt(s, st.at), pick = function (f) { return acts.filter(function (x) { return !x.why && f(x); })[0]; };
        var a = pick(function (x) { return x.kind === 'scene'; });
        if (a) { this.tapId('act_' + a.id); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' ' + T.place(st.at).name + ' 看戏' + a.label); break; }
        // 去下一个有戏的地方
        var tgt = null, best = 1e9;
        Tn.places.forEach(function (p) { if (p.id === st.at || T.whyNot(s, p.id)) return; var mm = T.travelMins(st.at, p.id), ev = T.eventsAt(s, p.id, st.clock + mm).length; if (ev && mm < best) { best = mm; tgt = p.id; } });
        // 有人晚点会来带着戏：等
        if (!tgt && T.comingAt(s, st.at).some(function (c) { var v = T.nextVisit(s, c.id); return v && Tn.sceneAt[c.id] === st.at; }) && pick(function (x) { return x.kind === 'wait'; })) { this.tapId('act_wait'); break; }
        if (!tgt) {
          var biz = s.day % 3 === 0 ? ['whole', 'depot'] : ['depot', 'whole'];
          for (var i = 0; i < biz.length && !tgt; i++) { if (biz[i] === st.at) continue; var mk = T.markers(s, biz[i]); if (mk.biz && !T.whyNot(s, biz[i])) tgt = biz[i]; }
          var here = pick(function (x) { return x.kind === 'market' || x.kind === 'depot'; });
          if (here && (st.at === 'whole' || st.at === 'depot')) { this.tapId('act_' + here.id); break; }
        }
        var talk = pick(function (x) { return x.kind === 'talk'; });
        if (!tgt && talk) { this.tapId('act_' + talk.id); break; }
        this.stuck = (this.stuck || 0) + 1; if (this.stuck > 40) { this.stuck = 0; this.tapId('end'); break; }
        if (tgt) { if (scr.sel !== tgt) this.tapId('pl_' + tgt); else { this.tapId('go'); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' 去' + T.place(tgt).name); } break; }
        this.tapId('end'); this.log.push('d' + s.day + ' ' + T.clockText(st.clock) + ' 回店'); break;
      }
      case 'night': {
        if (!scr.botDone) { scr.botDone = true; (this.pol.buy || []).forEach(function (id) { var u = Cast.upgrades.filter(function (x) { return x.id === id; })[0]; if (Run.canBuy(s, id) && s.cash - 40000 > u.cost) Run.buy(s, id); }); this.cool = this.o.fast ? 0.1 : 1.2; break; }
        this.tapId('sleep'); this.cool = 0.5; break;
      }
      case 'ending': if (this.o.endTaps) { this.tap(640, 400); this.cool = 0.6; } else this.stopped = true; break;
      default: this.cool = 0.3;
    }
  };
  function start(app, o) {
    var bot = new Bot(app, o), orig = app.step;
    if (app._bot) app._bot.stopped = true;
    app._bot = bot;
    if (!app._botWrapped) { app._botWrapped = true; app.step = function (dt) { orig.call(app, dt); if (app._bot) app._bot.tick(dt); }; }
    return bot;
  }
  // 无界面快进到第 day 天清晨（开发用）
  function jump(app, day, policy) {
    var s = app.state || Run.create({ seed: 7 }); app.state = s;
    Sim.month(s, Sim.policies[policy || 'average'], day);
    app.save(); app.route(false);
  }
  return { start: start, jump: jump, Bot: Bot };
});
