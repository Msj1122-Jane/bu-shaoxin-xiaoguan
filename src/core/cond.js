// 条件求值：事件前置、剧情变体、选项可用性共用。所有键为“且”关系。
BSX.define('core/cond', function (require) {
  var C = require('content/config');
  var KEYS = ['minDay', 'maxDay', 'day', 'weather', 'helper', 'aff', 'anyAff', 'affSum', 'burnMin', 'burnMax', 'repMin', 'repMax',
    'cashMax', 'cashMin', 'flag', 'notFlag', 'oilUsedRecycle', 'ending', 'canRenew', 'cantRenew'];
  function affSum(s) { var n = 0; for (var k in s.regulars) n += s.regulars[k].aff; return n; }
  function renewCost(s) { return C.renewal.deposit + (s.flags.renewalDelta || 0); }
  function check(s, c, ctx) {
    if (!c) return true;
    for (var k in c) {
      var v = c[k];
      switch (k) {
        case 'minDay': if (s.day < v) return false; break;
        case 'maxDay': if (s.day > v) return false; break;
        case 'day': if (s.day !== v) return false; break;
        case 'weather': if (s.today.weather !== v) return false; break;
        case 'helper': if (!!s.helper !== v) return false; break;
        case 'aff': for (var id in v) { if (!s.regulars[id] || s.regulars[id].aff < v[id]) return false; } break;
        case 'anyAff': var ok = false; for (var r in s.regulars) if (s.regulars[r].aff >= v) ok = true; if (!ok) return false; break;
        case 'affSum': if (affSum(s) < v) return false; break;
        case 'burnMin': if (s.burn < v) return false; break;
        case 'burnMax': if (s.burn > v) return false; break;
        case 'repMin': if (s.rep < v) return false; break;
        case 'repMax': if (s.rep > v) return false; break;
        case 'cashMax': if (s.cash > v) return false; break;
        case 'cashMin': if (s.cash < v) return false; break;
        case 'flag': for (var f in v) if (s.flags[f] !== v[f]) return false; break;
        case 'notFlag': if (s.flags[v]) return false; break;
        case 'oilUsedRecycle': if (!!s.stats.recycleDays !== v) return false; break;
        case 'ending': if (!ctx || ctx.ending !== v) return false; break;
        case 'canRenew': if ((s.cash >= renewCost(s)) !== v) return false; break;
        case 'cantRenew': if ((s.cash < renewCost(s)) !== v) return false; break;
        default: throw new Error('unknown condition key ' + k);
      }
    }
    return true;
  }
  return { check: check, KEYS: KEYS, affSum: affSum, renewCost: renewCost };
});
