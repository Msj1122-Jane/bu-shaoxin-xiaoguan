// 内容校验：node tools/validate.js。检查 docs/CONTENT_SPEC.md 约定的字段、引用和字数。有错则退出码 1。
const path = require('path'), root = path.resolve(__dirname, '..');
function validate() {
  const L = require(path.join(root, 'src/modules.list.json'));
  L.core.forEach(f => require(path.join(root, 'src', f)));
  const St = BSX.require('content/story'), D = BSX.require('content/dishes'), Cast = BSX.require('content/cast');
  const errs = [], warn = [];
  const acts = ['overpay', 'credit', 'repay', 'treat', 'coins', 'peek', 'absent', 'big'];
  const beatKeys = ['id', 'need', 'key', 'at', 'order', 'hide', 'togo', 'note', 'say', 'act', 'remark', 'leave', 'fx', 'fxGood', 'fxBad', 'after', 'group'];
  const needKeys = ['day', 'aff', 'flags', 'not', 'seen', 'unseen', 'weather', 'burn', 'rep', 'cash', 'oilAge', 'price', 'priceAvg', 'mat', 'menu', 'unlocked', 'helper', 'posted', 'fast', 'quality', 'credit', 'affSum', 'any'];
  const fxKeys = ['cash', 'rep', 'burn', 'aff', 'set', 'clear', 'unlock', 'memento', 'fact', 'flow', 'flowNext', 'deposit', 'helper', 'later', 'payDeposit', 'chipin', 'shift', 'closeNext'];
  const props = 'lease envelope powder meat phone slip mug pumpkin notebook homework candle keys curtain photo pills ledger veg oilcan cash paper'.split(' ');
  const len = s => [...String(s)].length;
  const who = id => ['z', 'n', 'best', 'a', 'b'].includes(id) || St.regs[id] || Cast.npcs[id];
  function need(n, at) { if (!n) return; for (const k in n) if (!needKeys.includes(k)) errs.push(at + ' need 未知字段 ' + k); (n.any || []).forEach(x => need(x, at)); }
  function fx(f, at) {
    if (!f) return; for (const k in f) if (!fxKeys.includes(k)) errs.push(at + ' fx 未知字段 ' + k);
    if (f.unlock) [].concat(f.unlock).forEach(u => { if (!D.byId[u]) errs.push(at + ' unlock ' + u); });
    if (f.memento && !St.mementos[f.memento]) errs.push(at + ' memento 未定义 ' + f.memento);
    if (f.fact && !St.facts[f.fact[0] + '/' + f.fact[1]]) errs.push(at + ' fact 未定义 ' + f.fact);
    if (f.aff) for (const k in f.aff) if (!St.regs[k]) errs.push(at + ' aff 未知常客 ' + k);
    if (f.later) fx(f.later.fx, at + '/later');
  }
  function beats(list, at) {
    (list || []).forEach(b => {
      if (Array.isArray(b)) { if (!who(b[0])) errs.push(at + ' 说话的人 ' + b[0]); if (len(b[1]) > 40) warn.push(at + ' 台词偏长：' + b[1]); return; }
      if (b.enter && !who(b.enter)) errs.push(at + ' enter ' + b.enter);
      if (b.prop && !props.includes(b.prop)) errs.push(at + ' prop ' + b.prop);
      if (b.fx) fx(b.fx, at);
      if (b.if) { need(b.if, at); beats(b.then, at); beats(b.else, at); }
      if (b.choice) b.choice.forEach(c => { if (len(c.label) > 9) warn.push(at + ' 选项偏长：' + c.label); need(c.need, at); fx(c.fx, at); beats(c.then, at); });
    });
  }
  for (const id of St.regIds) {
    const r = St.regs[id], ids = {};
    if (r.beats.length < 8) errs.push(id + ' 节拍不足 8 个');
    r.usual.forEach(u => { if (!D.byId[String(u).split(':')[0]]) errs.push(id + ' usual ' + u); });
    r.beats.forEach(b => {
      const at = id + '/' + b.id;
      if (ids[b.id]) errs.push(at + ' 重复 id'); ids[b.id] = 1;
      for (const k in b) if (!beatKeys.includes(k)) errs.push(at + ' 未知字段 ' + k);
      if (b.act && !acts.includes(b.act)) errs.push(at + ' act ' + b.act);
      if (b.after && !St.scenes[b.after]) errs.push(at + ' after 场景不存在 ' + b.after);
      if (b.leave && b.leave.memento && !St.mementos[b.leave.memento]) errs.push(at + ' leave.memento ' + b.leave.memento);
      if (b.act === 'absent' && !b.remark) warn.push(at + ' absent 没有 remark');
      need(b.need, at); fx(b.fx, at); fx(b.fxGood, at); fx(b.fxBad, at);
      (b.order === 'usual' || !b.order ? [] : b.order).forEach(o => { if (typeof o === 'string') { if (!D.byId[o.split(':')[0]]) errs.push(at + ' 菜 ' + o); } else if (!o.wish || !D.TAGS.includes(o.wish)) errs.push(at + ' wish ' + JSON.stringify(o)); });
      if (b.say) for (const k of ['in', 'good', 'ok', 'bad', 'slow', 'out']) if (b.say[k] && len(b.say[k]) > 16) warn.push(at + ' ' + k + ' 偏长：' + b.say[k]);
      if (b.say && b.say.chat) b.say.chat.forEach(c => { if (len(c[1]) > 22) warn.push(at + ' chat 偏长：' + c[1]); });
    });
    if (!r.epilogue.some(e => !e.need)) errs.push(id + ' epilogue 没有兜底');
  }
  for (const id in St.scenes) { const sc = St.scenes[id]; need(sc.need, id); beats(sc.beats, id); }
  ['m01_open', 'm01_close', 'm02_close', 'm07_close', 'm09_open', 'm12_open', 'm15_open', 'm18_open', 'm22_open', 'm26_close', 'm27_open', 'm28_close', 'crisis', 'rescue'].forEach(id => { if (!St.scenes[id]) errs.push('缺主线 ' + id); else if (St.scenes[id].fallback) warn.push('主线 ' + id + ' 使用了兜底脚本'); });
  St.endIds.forEach(id => { const e = St.endings[id]; if (!e || !e.text || !e.text.length || !e.title) errs.push('结局不完整 ' + id); });
  St.echoes.forEach((e, i) => need(e.need, 'echo' + i));
  D.list.forEach(d => { if (!d.set && !D.stations[d.st]) errs.push('菜 ' + d.id + ' 灶台 ' + d.st); if (d.set) d.set.forEach(p => { if (!D.byId[p]) errs.push('套餐部件 ' + p); }); });
  const am = St.ambient; ['walkins', 'wish', 'mods', 'queue', 'quotes', 'zhou'].forEach(k => { if (!am[k]) errs.push('ambient 缺 ' + k); });
  Object.keys(Cast.archetypes).forEach(a => { if (!am.walkins || !am.walkins[a]) errs.push('ambient.walkins 缺 ' + a); });
  D.TAGS.forEach(t => { if (!am.wish || !am.wish[t]) errs.push('ambient.wish 缺 ' + t); });
  return { errs, warn, counts: { dishes: D.list.length, regulars: St.regIds.length, beats: St.regIds.reduce((a, id) => a + St.regs[id].beats.length, 0), scenes: Object.keys(St.scenes).length, events: St.events.length, endings: St.endIds.length, echoes: St.echoes.length, mementos: Object.keys(St.mementos).length, facts: Object.keys(St.facts).length } };
}
module.exports = validate;
if (require.main === module) { const r = validate(); console.log('内容统计', JSON.stringify(r.counts)); r.warn.forEach(w => console.log('  提醒：' + w)); r.errs.forEach(e => console.log('  错误：' + e)); console.log(r.errs.length ? '校验失败：' + r.errs.length + ' 处错误' : '校验通过（' + r.warn.length + ' 条提醒）'); process.exit(r.errs.length ? 1 : 0); }
