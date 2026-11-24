// 店史（GDD §10.4）：跨局保留的图鉴、照片、来信、结局印章、传承物、个人纪录、常营业纪录。
BSX.define('core/legacy', function (require) {
  var R = require('content/regulars');
  var EN = require('content/endings');
  var E = require('content/events');
  function create() {
    return { v: 1, runs: 0, endings: {}, seenEvents: [], seenStory: [], nodes: [], photos: [], letters: [], cooked: {}, unlocked: [],
      heirlooms: ['H_APRON'], records: { bestCash: null, bestRep: null, bestStreak: 0, noWaitMonth: false }, weeks: {}, lastEnding: null, history: [] };
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function letterFor(ending, s) {
    var best = bestRegular(s);
    var r = best ? R.byId[best] : null;
    var lines = {
      E_HONEST: '老周：门口那张进货单我每天都看。—— ' + (r ? r.name : '一位街坊'),
      E_PRIVATE: '周叔，下周三还留那张靠锅的桌子吗？—— ' + (r ? r.name : '熟客'),
      E_CANTEEN: '饺子日那天的照片洗出来了，贴你墙上。—— 小满',
      E_REOPEN: '重新开张那天，我排了第一个。—— ' + (r ? r.name : '街坊'),
      E_PILLS: '周叔，你自己也要好好吃饭。—— 小宋',
      E_FAREWELL: '新地方开了，记得告诉我们地址。—— ' + (r ? r.name : '街坊们'),
      E_TRANSFER: '路过时看见换了招牌，还是想起那碗粥。—— 一位老顾客',
      E_SOMEONE: '明天还开吧？我六点来。—— ' + (r ? r.name : '街坊')
    };
    return lines[ending];
  }
  function bestRegular(s) {
    var best = null, v = -1;
    R.list.forEach(function (r) { var st = s.regulars[r.id]; var score = st.aff * 10 + st.visits; if (score > v && st.visits > 0) { v = score; best = r.id; } });
    return best;
  }
  function recordEnding(L, s) {
    L = JSON.parse(JSON.stringify(L || create()));
    var id = s.ending.id;
    L.runs++; L.endings[id] = (L.endings[id] || 0) + 1; L.lastEnding = id;
    L.seenEvents = uniq(L.seenEvents.concat(s.events.seen));
    L.seenStory = uniq(L.seenStory.concat(s.storySeen));
    L.nodes = uniq(L.nodes.concat(s.nodesDone));
    L.photos = uniq(L.photos.concat(s.photos));
    L.letters.push({ ending: id, text: letterFor(id, s), gen: s.generation });
    for (var k in s.stats.cooked) L.cooked[k] = (L.cooked[k] || 0) + s.stats.cooked[k];
    L.unlocked = uniq(L.unlocked.concat(Object.keys(s.unlocked)));
    // 传承物：对应常客好感 ≥5 时解锁
    EN.heirlooms.forEach(function (h) { if (h.from && s.regulars[h.from] && s.regulars[h.from].aff >= 5 && L.heirlooms.indexOf(h.id) < 0) L.heirlooms.push(h.id); });
    if (L.heirlooms.indexOf('H_BASKET') < 0 && L.runs >= 1) L.heirlooms.push('H_BASKET');
    var r = L.records;
    r.bestCash = r.bestCash == null ? s.cash : Math.max(r.bestCash, s.cash);
    r.bestRep = r.bestRep == null ? s.rep : Math.max(r.bestRep, s.rep);
    r.bestStreak = Math.max(r.bestStreak, s.stats.bestStreak);
    if (s.stats.lostTotal === 0) r.noWaitMonth = true;
    L.history.push({ gen: s.generation, ending: id, cash: s.cash, rep: s.rep, best: bestRegular(s), days: s.history.length });
    return L;
  }
  function recordWeek(L, s, goalDone, summary) {
    L = JSON.parse(JSON.stringify(L || create()));
    var w = L.weeks[s.theme] || { plays: 0, done: 0, best: null };
    w.plays++; if (goalDone) w.done++;
    if (!w.best || summary.profit > w.best.profit) w.best = summary;
    L.weeks[s.theme] = w;
    L.seenEvents = uniq(L.seenEvents.concat(s.events.seen));
    for (var k in s.stats.cooked) L.cooked[k] = (L.cooked[k] || 0) + s.stats.cooked[k];
    return L;
  }
  function unseenEvents(L) { return E.list.map(function (e) { return e.id; }).filter(function (id) { return !L || L.seenEvents.indexOf(id) < 0; }); }
  return { create: create, recordEnding: recordEnding, recordWeek: recordWeek, bestRegular: bestRegular, unseenEvents: unseenEvents, letterFor: letterFor };
});
