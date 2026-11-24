// 数值模拟：node tools/sim.js [seeds=8] [policy]。逐条经营路线打满 28 天，打印结局分布与关键读数。
const path = require('path'), root = path.resolve(__dirname, '..');
const L = require(path.join(root, 'src/modules.list.json'));
L.core.forEach(f => require(path.join(root, 'src', f)));
const Run = BSX.require('core/run'), Sim = BSX.require('core/sim'), Story = BSX.require('content/story');
const seeds = +process.argv[2] || 8, only = process.argv[3];
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('policy', 11), pad('endings', 34), 'cash  rep burn serve/d walk/d aff  beats scenes cashD7/14/21/26');
for (const name of Object.keys(Sim.policies)) {
  if (only && only !== name) continue;
  const ends = {}; let cash = 0, rep = 0, burn = 0, served = 0, walked = 0, aff = 0, beats = 0, scenes = 0, days = 0; const cd = [0, 0, 0, 0];
  for (let i = 0; i < seeds; i++) {
    const s = Run.create({ seed: 1000 + i * 37 });
    Sim.month(s, Sim.policies[name]);
    ends[s.ending] = (ends[s.ending] || 0) + 1;
    cash += s.cash / 100; rep += s.rep; burn += s.burn; served += s.stats.served; walked += s.stats.walked + s.stats.balked; days += s.hist.length;
    aff += Object.values(s.reg).reduce((a, r) => a + r.aff, 0); beats += Object.values(s.reg).reduce((a, r) => a + r.beats.length, 0); scenes += Object.keys(s.seen).filter(k => Story.scenes[k]).length;
    [7, 14, 21, 26].forEach((d, j) => { const h = s.hist[d - 1]; cd[j] += h ? h.cash / 100 : 0; });
  }
  const n = seeds;
  console.log(pad(name, 11), pad(Object.entries(ends).map(([k, v]) => k.slice(2) + ':' + v).join(' '), 34), pad(Math.round(cash / n), 5), pad(Math.round(rep / n), 3), pad(Math.round(burn / n), 4), pad((served / days).toFixed(1), 7), pad((walked / days).toFixed(1), 6), pad((aff / n).toFixed(0), 4), pad((beats / n).toFixed(0), 5), pad((scenes / n).toFixed(0), 6), cd.map(v => Math.round(v / n)).join('/'));
}
