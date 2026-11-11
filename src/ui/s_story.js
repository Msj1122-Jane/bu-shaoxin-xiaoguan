// 剧情/事件界面：依次处理当前相位的待办（主线 S、常客节点 A/B、事件 B、危机夜、房东通牒），全部在同一间店的动态舞台上演出。
BSX.define('ui/s_story', function (require) {
  var U = require('ui/ui');
  var Sc = require('game/scene');
  var Au = require('game/audio');
  var Run = require('core/run');
  var Cut = require('game/cutscene');
  var E = require('content/events');
  var ST = require('content/story');
  var C = require('content/config');
  var Hud = require('ui/hud');

  var LIGHT = { day: 'morning', morning: 'morning', dusk: 'dusk', night: 'night', rain: 'morning', dark: 'night' };
  function eventScript(ev, phase) {
    var st = ev.stage, beats = [{ cam: [640, 360, 1], t: 0 }];
    var x = [900, 1060, 760];
    (st.who || []).forEach(function (w, i) { beats.push({ enter: w, x: x[i] }); });
    if (st.prop) beats.push({ prop: st.prop, x: 760, y: 560 });
    beats.push({ cam: [820, 400, 1.2], t: 700 });
    beats.push({ narr: ev.text });
    beats.push({ choice: ev.choices.map(function (c) { return { id: c.id, label: c.label, result: c.result, effect: c.effect }; }) });
    (st.who || []).forEach(function (w) { beats.push({ exit: w }); });
    beats.push({ cam: [640, 360, 1], t: 600 });
    return { id: ev.id, tier: 'B', title: ev.name, stage: { view: 'room', time: phase === 'pre' ? (LIGHT[st.light] || 'morning') : (st.light === 'night' || st.light === 'dark' ? 'night' : 'dusk'), weather: st.light === 'rain' ? 'rain' : 'auto' }, beats: beats };
  }
  function crisisScript(s) {
    var cc = C.crisisChoices;
    return { id: 'CRISIS', tier: 'S', title: '危机夜', stage: { view: 'room', time: 'night', weather: 'auto' }, beats: [
      { cam: [240, 470, 1.5], t: 1200 }, { say: 'zhou', text: '胃……一阵一阵地疼。', face: 4 },
      { narr: '第二天一早，退货和投诉一起来了。口碑掉了一截，先赔了三百。' },
      { say: 'zhou', text: '不能再这样下去了。', face: 3 },
      { choice: [
        { id: 'rectify', label: '停业整改一天（−600）', result: '老周把旧油全倒了，台账一页页重抄。' },
        { id: 'refund', label: '挨家退款（−400）', result: '他拎着零钱，一户一户敲门道歉。' },
        { id: 'hold', label: '硬撑着照常开', result: '老周吞了片胃药，把卷帘门拉了上去。' }
      ] }, { cam: [640, 360, 1], t: 800 }] };
  }
  function rescueScript() {
    return { id: 'RESCUE', tier: 'B', title: '房东通牒', stage: { view: 'room', time: 'morning', weather: 'auto' }, beats: [
      { enter: 'landlord', x: 980 }, { prop: 'lease', x: 760, y: 560 }, { cam: [820, 400, 1.2], t: 700 },
      { say: 'landlord', text: '账上连着两天是负的。' }, { say: 'landlord', text: '再这样，月底前就得收铺。' },
      { choice: [
        { id: 'sell', label: '卖掉一件设备（+500）', result: '旧冰柜被拉走了，后厨空了一块。' },
        { id: 'borrow', label: '街坊短借 300，月底还 360', result: '小满把信封塞给老周：“月底再说。”' },
        { id: 'refuse', label: '不借，再撑一天', result: '房东摇摇头走了。' }
      ] }, { exit: 'landlord' }, { hide: 'lease' }] };
  }

  function Story(app) {
    this.name = 'story'; this.app = app; this.t = 0; this.pausable = true; this.dir = null; this.itemKey = null;
    this.load();
  }
  var P = Story.prototype;
  P.load = function () {
    var app = this.app, s = app.state;
    if (!s || ['dawn', 'open', 'dusk'].indexOf(s.phase) < 0 || !s.pending.length) return app.route();
    var it = s.pending[0], script;
    if (it.kind === 'story' || it.kind === 'node') script = ST.all[it.id];
    else if (it.kind === 'event') script = eventScript(E.byId[it.id], s.phase === 'dusk' ? 'post' : 'pre');
    else if (it.kind === 'crisis') script = crisisScript(s);
    else if (it.kind === 'rescue') script = rescueScript();
    this.item = it; this.script = script;
    var time = s.phase === 'dusk' ? (s.today.weather === 'rain' ? 'night' : 'dusk') : 'morning';
    var ending = it.id === 'S28' || it.id === 'X_LEAVE' ? Run.prospectiveEnding(s) : null;
    var self = this;
    var Au0 = BSX.require('game/audio'); if (it.kind === 'crisis' || it.kind === 'rescue' || (it.kind === 'event' && E.byId[it.id] && E.byId[it.id].type === 'tense')) { Au0.lockTrack = true; Au0.music('bgm_tense'); } else Au0.lockTrack = false;
    this.dir = new Cut.Director(script, { state: s, time: time, weather: s.today.weather, ending: ending, auto: app.settings.autoPlay, log: app.storyLog, onLog: function () { app.openOverlay(BSX.require('ui/s_basic').Log, {}); } });
    var seenKey = it.kind + ':' + (it.id || '');
    var L = app.legacy;
    var seen = app.seenCs[seenKey] || (it.id && (L.seenStory.indexOf(it.id) >= 0 || L.seenEvents.indexOf(it.id) >= 0 || L.nodes.indexOf(it.id) >= 0));
    if (app.settings.skipSeen && seen) this.dir.skip();
    app.seenCs[seenKey] = true;
  };
  P.update = function (dt) {
    this.t += dt;
    if (!this.dir) return;
    this.dir.update(dt);
    if (this.dir.done && !this.resolving) {
      this.resolving = true;
      var app = this.app, r = this.dir.result;
      var ok = app.dispatch({ t: 'resolve', choice: r.choice || undefined, unlocks: r.unlocks });
      if (!ok) { app.reportError(new Error('剧情结算失败 ' + JSON.stringify(this.item) + ' choice=' + r.choice)); }
      var s = app.state;
      if (['dawn', 'open', 'dusk'].indexOf(s.phase) >= 0 && s.pending.length) { this.resolving = false; this.load(); }
      else app.route();
    }
  };
  P.pointer = function (type, x, y) { if (this.dir) this.dir.pointer(type, x, y); };
  P.pointerFirst = function (type, x, y, hit) {
    if (this.dir && this.dir.act && (!hit || hit.id === 'cs_act')) { this.dir.pointer(type, x, y); var d = this.dir; return function (t2, x2, y2) { d.pointer(t2, x2, y2); }; }
    return false;
  };
  P.draw = function (ctx) {
    var bgi = this.dir && this.dir.bg && BSX.require('game/assets').img(this.dir.bg);
    ctx.save(); Sc.applyCam(ctx);
    if (bgi) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bgi, 0, 0, 1280, 720); } else Sc.drawBack(ctx);
    if (this.dir) this.dir.drawWorld(ctx); ctx.restore();
    if (!bgi) Sc.drawFront(ctx);
    // 电影黑边（减少动效时不推入）
    var bar = this.app.settings.reduceMotion ? 0 : 36; ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, 1280, bar); ctx.fillRect(0, 720 - bar, 1280, bar);
    if (this.dir) this.dir.drawUI(ctx);
    var s = this.app.state, it = this.item;
    if (it && this.script && this.script.title) U.text(ctx, (it.kind === 'story' ? '· ' : '') + this.script.title, 32, 64, { size: 24, bold: true, color: '#fff3d6', stroke: '#3b2412' });
    if (s) U.text(ctx, s.mode === 'week' ? '常营业' : '第' + s.day + '日', 32, 96, { size: 18, color: '#fff3d6', stroke: '#3b2412' });
  };
  P.describe = function () { return { item: this.item, title: this.script && this.script.title, director: this.dir ? this.dir.describe() : null }; };
  return { Story: Story, eventScript: eventScript };
});
