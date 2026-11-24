// 数值配置（重制版 V2）。金额单位：分。设计意图见 docs/DESIGN.md。
// 核心变化：收入 = 亲手卖出去的每一份；不再有"抽象客流 × 均价"。
BSX.define('content/config', function () {
  return {
    contentVersion: '2.0.0',
    days: 28,
    startCash: 70000,            // 700 元：盘店之后剩下的
    startRep: 50,
    rentWeekly: 24000,           // 每七天交一次房租
    deposit: 120000,             // 第 26 日的续租押金
    utilities: 800,             // 每天水电煤
    helperWage: 3000,
    // 晨备三项
    priceMul: [0.85, 1.0, 1.25],
    priceFlow: [1.18, 1.0, 0.84],
    priceItems: [0.15, 0, -0.18],        // 每单件数的偏移
    matCost: [0.8, 1.0, 1.28],
    matQ: [-0.06, 0, 0.07],
    matName: ['批发冻品', '老秦的鲜货', '有票的好料'],
    priceName: ['薄利', '公道', '提价'],
    oil: { fresh: 2000, filter: 400, bulk: 1000, bulkAge: 1, bulkRate: 1.5 },
    // 油龄 a（天）对做饭的影响：熟得更快、最佳窗口更窄、出品扣分、冒烟
    oilSpeed: function (a) { return 1 + Math.min(0.45, 0.07 * a); },
    oilWindow: function (a) { return Math.max(0.55, 1 - 0.09 * a); },
    oilQ: function (a) { return a <= 2 ? 0 : -Math.min(0.2, 0.05 * (a - 2)); },
    oilBurn: function (a, bulk) { return Math.max(0, a - 2) * 0.22 + (bulk ? 0.15 : 0); }, // 每卖出一份油炸/油煎
    burnDecay: 1.2,              // 新油或无油的日子每天回落
    hoodBurn: 0.6,               // 排烟罩：烧心累积打六折
    // 客流
    baseFlow: function (day) { return 5.5 + Math.min(day, 21) * 0.72; },
    repFlow: function (rep) { return 0.6 + rep / 100 * 0.8; },
    weatherOdds: { sun: 0.5, cloud: 0.3, rain: 0.2 },
    weatherFlow: { sun: 1.0, cloud: 0.97, rain: 0.84 },
    fixedWeather: { 1: 'sun', 2: 'sun', 3: 'cloud', 4: 'rain', 12: 'rain', 18: 'sun', 22: 'cloud', 27: 'sun', 28: 'sun' },
    shiftLen: function (day) { return day <= 1 ? 92 : day === 2 ? 118 : day === 3 ? 136 : day <= 7 ? 150 : day <= 14 ? 162 : 174; },
    slots: function (day) { return day >= 6 ? 4 : 3; },
    patience: { walk: [30, 40], regular: 46, queue: [34, 46], tutorial: 30 },
    menuMax: function (s) { return 4 + (s.day >= 8 ? 1 : 0) + (s.upg.board ? 1 : 0); },
    burners: function (s) { return 3 + (s.upg.burner ? 1 : 0); },
    shelf: function (s) { return 4 + (s.upg.shelf ? 2 : 0); },
    potCap: function (s) { return s.upg.bigpot ? 14 : 8; },
    fryerSlots: function (s) { return s.upg.fryer ? 6 : 4; },
    // 满意度与口碑
    delight: 0.86, fine: 0.62,
    repDelta: { delight: 0.05, fine: 0.012, meh: -0.07, walk: -0.22, balk: -0.09, soldout: -0.04 },
    repDayCap: 2.4,
    tip: { delight: 50 },        // 5 毛
    aff: { delight: 0.2, fine: 0.09, meh: -0.2, walk: -0.5, chat: 0.12, remember: 0.1, ask: -0.1, returned: 0.4, beat: 0.4 },
    // 熟练：按灶台累计出品数升级，窗口变宽，另有一个窍门
    skill: [12, 40, 90],
    skillWindow: 0.035,
    costUp: { from: 9, to: 16, mul: 1.15 },
    crisis: { rectify: { cash: -40000, burnTo: 35, rep: 6 }, refund: { cash: -26000, rep: -8, burn: -55, laterRep: 5 }, hold: { rep: -3 } },
    rescue: { sell: 30000, borrow: 25000, repay: 30000 },
    viralFlow: { good: 1.6, plain: 1.25, bad: 1.15 }
  };
});
