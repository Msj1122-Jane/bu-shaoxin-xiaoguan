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
        var m = scr.mode, Tn = require('content/town'), self2 = this;
        if (m === 'map') {
          var want = this.o.town === 'home' ? 'home' : ['visit', 'depot', 'bridge', 'market'][s.day % 4], pl = scr.list.filter(function (p) { return p.id === want; })[0];
          if (!pl || pl.why) want = 'home';
          if (scr.sel !== want) this.tapId('pl_' + want); else { this.tapId('go'); this.log.push('d' + s.day + ' 下午 → ' + want); }
          this.cool = this.o.fast ? 0.15 : 0.5; break;
        }
        if (m === 'market') {
          var li = scr.seen.map(function (x) { return x.some(Boolean); }).indexOf(false);
          if (scr.looks > 0 && li >= 0) { this.tapId('look_' + li + '_' + (li === scr.lots[li].blank ? 1 : 0)); this.cool = 0.3; break; }
          var todo = scr.lots.map(function (l, i) { var g = Tn.goods[l.item], seenBad = scr.seen[i].some(function (v, j) { return v && g.bad.indexOf(require('core/town').clue(l, j)) >= 0; }), seenGood = scr.seen[i].some(function (v, j) { return v && g.good.indexOf(require('core/town').clue(l, j)) >= 0; }); return (seenGood || (l.seller === 'qin' && !seenBad)) && !scr.take[i] && l.price < s.cash - 30000 ? i : -1; }).filter(function (i) { return i >= 0; });
          if (todo.length) { this.tapId('take_' + todo[0]); this.cool = 0.3; break; }
          this.tapId('pay'); this.log.push('d' + s.day + ' 验货收 ' + scr.take.filter(Boolean).length + ' 样'); this.cool = 0.5; break;
        }
        if (m === 'depot') { this.tapId('acc_0'); this.cool = 0.5; break; }
        if (m === 'visit') { this.tapId('vis_' + scr.vis[0].id); this.cool = 0.6; break; }
        if (m === 'result' && scr.mt > 0.6) { this.tapId('town_done'); this.cool = 0.5; break; }
        this.cool = 0.2; break;
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
