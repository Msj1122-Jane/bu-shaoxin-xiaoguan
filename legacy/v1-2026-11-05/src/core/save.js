// 存档：主档＋备档、版本迁移、损坏恢复（GDD §14）。单月档与店史档分开，单月重开不会误删店史。
// storage 由平台层注入：{ get(key)→string|null, set(key, str), remove(key) }
BSX.define('core/save', function (require) {
  var Run = require('core/run');
  var KEYS = { run: 'bsx.run.v3', runBak: 'bsx.run.v3.bak', legacy: 'bsx.legacy.v1', legacyBak: 'bsx.legacy.v1.bak', settings: 'bsx.settings.v1', old: ['bsx-seven-day-v1', 'bsx-seven-day-v1-backup', 'bsx.run.v2'] };
  function checksum(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function wrap(obj) { var body = JSON.stringify(obj); return JSON.stringify({ c: checksum(body), b: body, at: Date.now() }); }
  function unwrap(str) {
    if (!str) return { ok: false, reason: 'empty' };
    try { var w = JSON.parse(str); if (!w || typeof w.b !== 'string') return { ok: false, reason: 'format' }; if (checksum(w.b) !== w.c) return { ok: false, reason: 'checksum' }; return { ok: true, data: JSON.parse(w.b), at: w.at }; }
    catch (e) { return { ok: false, reason: 'parse' }; }
  }
  function validRun(s) {
    return !!s && s.schema === Run.SCHEMA && Number.isInteger(s.day) && s.day >= 1 && s.day <= s.days &&
      ['dawn', 'prep', 'open', 'service', 'dusk', 'ledger', 'ended'].indexOf(s.phase) >= 0 &&
      ['cash', 'rep', 'burn', 'rng'].every(function (k) { return typeof s[k] === 'number' && isFinite(s[k]); }) &&
      Array.isArray(s.menu) && s.menu.length > 0 && Array.isArray(s.pending) && s.today && Array.isArray(s.history);
  }
  function migrate(s) {
    // v2 → v3：仅文档设计过，没有发布数据；若遇到则补字段
    if (s && s.schema === 2) { s.schema = 3; s.executed = s.executed || []; s.photos = s.photos || []; }
    return s;
  }
  function Store(storage) { this.st = storage; this.notice = null; }
  Store.prototype.saveRun = function (s) {
    // 营业中不落盘（D015）：中途退出回到当日晨备。存的是进入营业前的快照。
    var str = wrap(s);
    var prev = this.st.get(KEYS.run);
    try { if (prev) this.st.set(KEYS.runBak, prev); this.st.set(KEYS.run, str); return true; }
    catch (e) { this.notice = '存档写入失败：设备空间可能不足'; return false; }
  };
  Store.prototype.loadRun = function () {
    var a = unwrap(this.st.get(KEYS.run));
    if (a.ok) { var s = migrate(a.data); if (validRun(s)) return { state: s, from: 'main' }; }
    var b = unwrap(this.st.get(KEYS.runBak));
    if (b.ok) { var s2 = migrate(b.data); if (validRun(s2)) { this.notice = '主存档损坏，已从备份恢复（' + a.reason + '）'; return { state: s2, from: 'backup' }; } }
    var hadOld = KEYS.old.some(function (k) { return !!this.st.get(k); }, this);
    if (hadOld) this.notice = '检测到旧版本试玩存档，规则已大改，无法沿用。旧档已保留，不会删除。';
    else if (this.st.get(KEYS.run)) this.notice = '存档损坏且没有可用备份，请开始新的一局。';
    return null;
  };
  Store.prototype.hasRun = function () { var r = this.loadRun(); return !!(r && r.state.phase !== 'ended'); };
  Store.prototype.clearRun = function () { this.st.remove(KEYS.run); this.st.remove(KEYS.runBak); };
  Store.prototype.saveLegacy = function (l) { var prev = this.st.get(KEYS.legacy); try { if (prev) this.st.set(KEYS.legacyBak, prev); this.st.set(KEYS.legacy, wrap(l)); return true; } catch (e) { this.notice = '店史写入失败'; return false; } };
  Store.prototype.loadLegacy = function () {
    var a = unwrap(this.st.get(KEYS.legacy)); if (a.ok) return a.data;
    var b = unwrap(this.st.get(KEYS.legacyBak)); if (b.ok) { this.notice = '店史主档损坏，已从备份恢复'; return b.data; }
    return null;
  };
  Store.prototype.saveSettings = function (o) { try { this.st.set(KEYS.settings, JSON.stringify(o)); } catch (e) {} };
  Store.prototype.loadSettings = function () { try { return JSON.parse(this.st.get(KEYS.settings) || 'null'); } catch (e) { return null; } };
  function memoryStorage() { var m = {}; return { get: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; }, set: function (k, v) { m[k] = String(v); }, remove: function (k) { delete m[k]; }, _m: m }; }
  return { Store: Store, KEYS: KEYS, wrap: wrap, unwrap: unwrap, validRun: validRun, memoryStorage: memoryStorage };
});
