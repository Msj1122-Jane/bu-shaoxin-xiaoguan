// 七日常营业：目标判定（GDD §10.4、§10.6）
BSX.define('core/week', function () {
  function summary(s) {
    var h = s.history;
    var profit = s.cash - s.stats.startCash;
    var lost = h.reduce(function (n, d) { return n + d.lost; }, 0);
    var sig = s.stats.signature;
    var congee = h.reduce(function (n, d) { return n + d.sales.filter(function (x) { return ['congee', 'pidan', 'pumpkin'].indexOf(x.id) >= 0; }).reduce(function (m, x) { return m + x.qty; }, 0); }, 0);
    var zhaoDays = h.filter(function (d) { return d.visitors.indexOf('zhao') >= 0; }).length;
    var regulars = {}; h.forEach(function (d) { d.visitors.forEach(function (v) { regulars[v] = 1; }); });
    return { profit: profit, lost: lost, signature: sig, repDelta: s.rep - s.stats.startRep, burnDelta: s.burn - s.stats.burnStart, congee: congee, zhaoDays: zhaoDays,
      regulars: Object.keys(regulars).length, aliVisits: h.filter(function (d) { return d.visitors.indexOf('ali') >= 0; }).length };
  }
  function check(id, m) {
    var x = /^profit(\d+)$/.exec(id); if (x) return m.profit >= +x[1];
    x = /^signature(\d+)$/.exec(id); if (x) return m.signature >= +x[1];
    x = /^congee(\d+)$/.exec(id); if (x) return m.congee >= +x[1];
    x = /^regulars(\d+)$/.exec(id); if (x) return m.regulars >= +x[1];
    switch (id) {
      case 'noLost': return m.lost === 0;
      case 'rep0': return m.repDelta >= 0;
      case 'rep5': return m.repDelta >= 5;
      case 'burn0': return m.burnDelta <= 0;
      case 'aliVisits3': return m.aliVisits >= 3;
      case 'zhaoDaily': return m.zhaoDays >= 5;
      default: return false;
    }
  }
  var CHECKS = ['noLost', 'rep0', 'rep5', 'burn0', 'aliVisits3', 'zhaoDaily', 'profitN', 'signatureN', 'congeeN', 'regularsN'];
  return { summary: summary, check: check, CHECKS: CHECKS };
});
