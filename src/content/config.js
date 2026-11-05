// 数值配置（GDD V1.1 §5、§6、§7）。金额单位：分。设计意图见 docs/BALANCE.md。
BSX.define('content/config', function () {
  return {
    contentVersion: '1.0.0',
    days: 28,
    startCash: 300000,          // 3000 元
    startRep: 50,
    baseCapacity: 70,           // 份/日（D030 上调）
    baseFlow: 54,               // 基础客流（D030 上调）
    fixedCost: 10000,           // 房租 60 + 水电杂费 40
    helper: { capacity: 24, wage: 4000 },
    starCapacity: { per: 6, add: 2, max: 10 },  // 每累计 6 星 +2 份，上限 +10
    // 三项晨备决策：0/1/2 档
    price: { mult: [0.85, 1.0, 1.25], flow: [1.30, 1.0, 0.7], rep: [0.2, 0, -0.4] },
    material: { cost: [0.8, 1.0, 1.26], rep: [-0.05, 0, 0.15] },
    oil: { daily: [800, 3000, 5000], rep: [0, 0, 0.1] }, // 当日用油成本（含油炸菜时全额，否则三成）
    burnOil: { streak2: 3, streak3: 5, step: 1, cap: 10, newOilRelief: 3 },
    flowRandom: [0.90, 1.10],
    repFlow: { base: 0.45, div: 80 },
    regularFlowCap: 0.20,
    lostPer: 12, lostRep: 0.3,
    quality: { signature: 0.88, home: 0.60 },  // 招牌 / 家常 / 匆忙
    qualityRep: { signature: 0.6, home: 0.1, rushed: -0.6 },
    qualityEff: { signature: 0.05, rushed: -0.05 },
    tipSignature: 100,          // 招牌小费 1 元/份
    burnFeedback: [30, 60, 80, 100],
    crisis: { rep: -15, cash: -30000 },
    crisisChoices: {
      rectify: { cash: -60000, burnTo: 60, rep: 8, closeNext: true },
      refund: { cash: -40000, rep: -20, burn: -60, delayedRep: 6, delayDays: 3 },
      hold: {}
    },
    rescue: { borrow: 30000, repay: 36000, sell: 50000 },
    renewal: { day: 26, deposit: 120000 },     // 续租押金 1200 元：月底抉择时可承担才可续租
    profThresholds: [3, 8, 15, 24, 35],
    starWindowBonus: 0.035,     // 每星判定窗口扩大
    patience: { normal: [24, 34], regular: 42, leaveGrace: 4, tutorialBonus: 20 },
    service: { maxWaiting: 3, ordersByDay: function (day) { return day <= 1 ? 3 : day <= 3 ? 4 : day <= 10 ? 5 : 6; } },
    eventChance: 0.6,
    menuSize: 4, menuSizeUpgraded: 5,
    weatherOdds: { sun: 0.5, cloud: 0.3, rain: 0.2 },
    weatherFlow: { sun: 1.0, cloud: 0.97, rain: 0.9 },
    seasonDays: { warm: 12, dumpling: 22, origin: 27 },
    legacyFlowBonus: 0.04
  };
});
