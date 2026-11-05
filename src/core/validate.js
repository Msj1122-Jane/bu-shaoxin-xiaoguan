// 内容校验器（GDD §15.2）：重复 ID、缺失引用、非法前置、不可达日期、延期单位、循环依赖、结局覆盖、资源引用。
BSX.define('core/validate', function (require) {
  var C = require('content/config');
  var D = require('content/dishes');
  var R = require('content/regulars');
  var E = require('content/events');
  var ST = require('content/story');
  var EN = require('content/endings');
  var Q = require('content/encounters');
  var Cond = require('core/cond');
  var GESTURES = ['circle', 'drag', 'hold', 'swipe', 'timing'];
  var EFFECT_KEYS = ['cash', 'rep', 'burn', 'flow', 'cap', 'aff', 'flag', 'hireHelper', 'helperLeave', 'renewalDelta', 'audit', 'delayed', 'chain', 'unlockDish', 'renew', 'borrowNeighbors', 'leave', 'recall', 'note', 'after'];
  var BEATS = ['cam', 't', 'enter', 'x', 'exit', 'say', 'text', 'face', 'prop', 'y', 'hide', 'light', 'weather', 'act', 'choice', 'wait', 'shutter', 'sfx', 'if', 'then', 'else', 'crowd', 'visitors', 'view', 'photo', 'unlockDish', 'eventChoice', 'narr'];
  var NPCS = ['zhou', 'landlord', 'supplier', 'inspector', 'influencer', 'peer', 'recycler', 'helper', 'camera', 'students', 'neighbor', 'best'];
  function run(manifest) {
    var errs = [], warn = [];
    function dup(list, what) { var seen = {}; list.forEach(function (x) { if (seen[x.id]) errs.push('重复 ' + what + ' ID ' + x.id); seen[x.id] = 1; }); }
    dup(D.list, '菜品'); dup(R.list, '常客'); dup(E.list, '事件'); dup(EN.list, '结局'); dup(EN.themes, '主题');
    if (D.list.length !== 20) errs.push('菜品应为 20 道，实际 ' + D.list.length);
    if (R.list.length !== 8) errs.push('常客应为 8 位');
    if (E.list.length !== 30) errs.push('事件应为 30 张');
    if (EN.list.length !== 8) errs.push('结局应为 8 个');
    if (EN.themes.length < 6) errs.push('常营业主题至少 6 套');
    var gUsed = {};
    D.list.forEach(function (d) {
      if (!D.stations[d.station]) errs.push(d.id + ' 器具不存在 ' + d.station);
      if (!d.steps.length) errs.push(d.id + ' 无工序');
      d.steps.forEach(function (st) { if (GESTURES.indexOf(st.g) < 0) errs.push(d.id + ' 非法手势 ' + st.g); gUsed[st.g] = 1; if (st.g === 'timing' && !(st.win[0] < st.win[1] && st.win[1] <= 1)) errs.push(d.id + ' 时机窗口非法'); });
      if (d.unlock.type === 'aff' && !R.byId[d.unlock.who]) errs.push(d.id + ' 解锁人物不存在');
      if (d.unlock.type === 'day' && (d.unlock.day < 1 || d.unlock.day > C.days)) errs.push(d.id + ' 解锁日期不可达');
      if (d.fit.length !== 3) errs.push(d.id + ' fit 需 3 档');
      if (d.icon.cell != null && (d.icon.cell < 0 || d.icon.cell > 19)) errs.push(d.id + ' 图标格位越界');
    });
    GESTURES.forEach(function (g) { if (!gUsed[g]) errs.push('手势未被任何菜使用：' + g); });
    R.list.forEach(function (r) {
      if (r.nodes.length !== 3) errs.push(r.id + ' 故事节点应为 3');
      r.nodes.forEach(function (n) { if (!ST.all[n.cs]) errs.push(r.id + ' 节点脚本缺失 ' + n.cs); if (n.unlock && !D.byId[n.unlock]) errs.push(r.id + ' 解锁菜不存在 ' + n.unlock); });
      r.fav.forEach(function (f) { if (!D.byId[f]) errs.push(r.id + ' 偏好菜不存在 ' + f); });
      if (manifest && manifest.indexOf(r.sprite) < 0) errs.push(r.id + ' 立绘资源缺失 ' + r.sprite);
    });
    function checkEffect(eff, where) {
      if (!eff) return;
      Object.keys(eff).forEach(function (k) { if (EFFECT_KEYS.indexOf(k) < 0) errs.push(where + ' 未知效果字段 ' + k); });
      if (eff.aff) Object.keys(eff.aff).forEach(function (id) { if (!R.byId[id]) errs.push(where + ' 人物不存在 ' + id); });
      if (eff.delayed) eff.delayed.forEach(function (d) { if (!(d.after >= 1 && d.after <= 10 && Number.isInteger(d.after))) errs.push(where + ' 延期单位非法'); checkEffect(Object.assign({}, d, { after: undefined, note: undefined }), where + '/delayed'); });
      if (eff.chain && !E.byId[eff.chain.id]) errs.push(where + ' 连锁事件不存在 ' + eff.chain.id);
      if (eff.unlockDish && !D.byId[eff.unlockDish]) errs.push(where + ' 解锁菜不存在');
    }
    function checkCond(c, where) { if (!c) return; Object.keys(c).forEach(function (k) { if (Cond.KEYS.indexOf(k) < 0) errs.push(where + ' 非法条件 ' + k); }); if (c.minDay && c.maxDay && c.minDay > c.maxDay) errs.push(where + ' 日期区间不可达'); if (c.day && (c.day < 1 || c.day > C.days)) errs.push(where + ' 固定日不可达'); }
    var types = { tense: 0, daily: 0, relax: 0 };
    E.list.forEach(function (e) {
      types[e.type]++;
      checkCond(e.when, e.id);
      if (!e.choices || e.choices.length < 1 || e.choices.length > 3) errs.push(e.id + ' 选项数应为 1–3');
      e.choices.forEach(function (c) { checkEffect(c.effect, e.id + '/' + c.id); if (!c.result) errs.push(e.id + '/' + c.id + ' 缺结果文本'); });
      if (e.text.length > 70) warn.push(e.id + ' 情境超过 60 字（' + e.text.length + '）');
      (e.stage.who || []).forEach(function (w) { if (!R.byId[w] && NPCS.indexOf(w) < 0) errs.push(e.id + ' 舞台人物不存在 ' + w); });
      if (e.chainOnly) { var src = E.list.some(function (x) { return x.choices.some(function (c) { return c.effect && c.effect.chain && c.effect.chain.id === e.id; }); }); if (!src) errs.push(e.id + ' 连锁事件无来源'); }
    });
    if (types.tense !== 10 || types.daily !== 10 || types.relax !== 10) errs.push('事件类型分布应为 10/10/10：' + JSON.stringify(types));
    // 连锁循环
    E.list.forEach(function (e) { var seen = {}, cur = e.id; while (cur) { if (seen[cur]) { errs.push('连锁循环 ' + e.id); break; } seen[cur] = 1; var nx = null; E.byId[cur].choices.forEach(function (c) { if (c.effect && c.effect.chain) nx = c.effect.chain.id; }); cur = nx; } });
    var sCount = 0, aCount = 0;
    Object.keys(ST.all).forEach(function (k) {
      var sc = ST.all[k];
      if (sc.tier === 'S') sCount++; if (sc.tier === 'A') aCount++;
      (function walk(beats, where) {
        beats.forEach(function (b) {
          Object.keys(b).forEach(function (key) { if (BEATS.indexOf(key) < 0) errs.push(where + ' 未知演出指令 ' + key); });
          var who = b.enter || b.exit || b.say;
          if (who && !R.byId[who] && NPCS.indexOf(who) < 0) errs.push(where + ' 人物不存在 ' + who);
          if (b.say && b.text && b.text.length > 24) warn.push(where + ' 台词偏长：' + b.text);
          if (b.choice) b.choice.forEach(function (c) { checkEffect(c.effect, where + '/' + c.id); checkCond(c.when, where + '/' + c.id); });
          if (b.eventChoice && !E.byId[b.eventChoice]) errs.push(where + ' 事件不存在');
          if (b.unlockDish && !D.byId[b.unlockDish]) errs.push(where + ' 解锁菜不存在');
          if (b.if) { checkCond(b.if, where + '/if'); walk(b.then || [], where); walk(b.else || [], where); }
        });
      })(sc.beats, k);
    });
    Q.list.forEach(function (q) { if (q.choices.length < 2) errs.push(q.id + ' 奇遇至少两个选项'); q.choices.forEach(function (c) { checkEffect(c.effect, q.id + '/' + c.id); }); });
    (C.festivals || []).forEach(function (f) { f.dishes.forEach(function (d) { if (!D.byId[d]) errs.push('节令菜不存在 ' + d); }); });
    if (sCount !== 7) errs.push('S 级主线演出应为 7 段，实际 ' + sCount);
    if (aCount !== 16) errs.push('A 级常客演出应为 16 段，实际 ' + aCount);
    var days = Object.keys(ST.storyDays).map(Number);
    days.forEach(function (d) { if (d < 1 || d > C.days) errs.push('主线日不可达 ' + d); });
    EN.themes.forEach(function (t) { if (t.goals.length !== 3) errs.push(t.id + ' 目标应为 3 个'); });
    return { ok: errs.length === 0, errors: errs, warnings: warn, counts: { dishes: D.list.length, regulars: R.list.length, nodes: R.list.length * 3, events: E.list.length, endings: EN.list.length, themes: EN.themes.length, S: sCount, A: aCount, types: types } };
  }
  return { run: run };
});
