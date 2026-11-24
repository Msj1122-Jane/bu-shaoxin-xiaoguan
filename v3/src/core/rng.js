// 可序列化的确定性随机数（mulberry32）。状态是一个 uint32，存进存档。
BSX.define('core/rng', function () {
  function next(state) {
    var t = (state + 0x6D2B79F5) >>> 0;
    var r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return { state: t, value: ((r ^ (r >>> 14)) >>> 0) / 4294967296 };
  }
  // 在对象 holder.rng 上推进
  function rand(holder) { var n = next(holder.rng >>> 0); holder.rng = n.state; return n.value; }
  function range(holder, a, b) { return a + (b - a) * rand(holder); }
  function pick(holder, arr) { return arr[Math.floor(rand(holder) * arr.length) % arr.length]; }
  function weighted(holder, items, wf) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += Math.max(0, wf(items[i]));
    if (total <= 0) return null;
    var x = rand(holder) * total;
    for (i = 0; i < items.length; i++) { x -= Math.max(0, wf(items[i])); if (x <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function hashSeed(n) { var h = (n >>> 0) ^ 0x9E3779B9; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35); return (h ^ (h >>> 16)) >>> 0; }
  return { next: next, rand: rand, range: range, pick: pick, weighted: weighted, hashSeed: hashSeed };
});
