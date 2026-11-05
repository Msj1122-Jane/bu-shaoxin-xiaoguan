// 极简模块注册表：浏览器 <script>、微信 require、Node 测试三端共用。
(function (g) {
  var BSX = g.BSX || (g.BSX = {});
  if (BSX.define) return;
  var defs = {}, cache = {}, loading = {};
  BSX.define = function (name, factory) { defs[name] = factory; };
  BSX.require = function (name) {
    if (Object.prototype.hasOwnProperty.call(cache, name)) return cache[name];
    if (!defs[name]) throw new Error('BSX module not found: ' + name);
    if (loading[name]) throw new Error('BSX circular require: ' + name);
    loading[name] = true;
    var out = defs[name](BSX.require);
    loading[name] = false;
    cache[name] = out;
    return out;
  };
  BSX.has = function (name) { return !!defs[name]; };
  BSX.names = function () { return Object.keys(defs); };
})(typeof GameGlobal !== 'undefined' ? GameGlobal : (typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)));
