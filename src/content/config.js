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
    price: { mult: [0.85, 1.0, 1.25], flow: [1.30, 1.0, 0.65], rep: [0.2, 0, -0.6] },
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
    service: { maxWaiting: 3, ordersByDay: function (day) { return day <= 1 ? 4 : day <= 2 ? 6 : day <= 5 ? 8 : day <= 14 ? 10 : 12; } },
    // 诚信与黑心（D031）：捷径即时收益在 dishes.stations.cheat.save
    honesty: { cheatBurn: 0.7, cheatRep: 0.03, sickBurn: 1, sickRep: 0.5, sickBase: 0.06, sickPer: 0.03, sickBurnDiv: 350, streakFlow: 0.03, streakFlowMax: 0.15, raidFine: 20000 },
    combo: { tipPer: 50, max: 10 },
    // 对手黑心店“快好早点”：第 4 日开张抢客，第 15 日被曝光查封，客人回流三天（D033）
    rival: { open: 4, closed: 15, steal: 0.85, back: 1.3 },
    // 良心灯笼分级（参考燕云“恶名”，D034）：档位越低，检查员越勤；到底即封条停业
    lanternTiers: [
      { min: 80, name: '明亮', raid: 0 },
      { min: 60, name: '微暗', raid: 0 },
      { min: 40, name: '发红', raid: 0.2 },
      { min: 20, name: '冒烟', raid: 0.35 },
      { min: 0, name: '封条', raid: 0.5 }
    ],
    // 节令日（D036）：当天客流、偏好菜和店内装饰不同
    festivals: [
      { day: 10, id: 'laba', name: '腊八', flow: 1.15, dishes: ['congee', 'pidan', 'pumpkin'], boost: 1.6, deco: 'redpaper', line: '腊八到，一碗热粥暖一冬' },
      { day: 17, id: 'xiaonian', name: '小年', flow: 1.25, dishes: ['tangyuan', 'scallion', 'shengjian'], boost: 1.4, deco: 'lanterns', line: '小年了，街坊都出来吃早饭' },
      { day: 22, id: 'jiaozi', name: '饺子日', flow: 1.1, dishes: ['dumpling', 'tangyuan'], boost: 1.6, deco: 'lanterns', line: '街坊饺子日' }
    ],
    encounterChance: 0.55,
    // 小馆升级（D032）：买了立刻生效、店面可见
    upgrades: [
      { id: 'fire', name: '快火灶', cost: 30000, desc: '后台加热快三成，产能 +8' },
      { id: 'tray', name: '大托盘', cost: 20000, desc: '托盘能放 6 份' },
      { id: 'tables', name: '新桌椅', cost: 35000, desc: '顾客多等 25%' },
      { id: 'sign', name: '招牌匾', cost: 50000, desc: '路过的人多一成' },
      { id: 'board', name: '良心公示板', cost: 30000, desc: '良心灯笼亮时口碑每天 +0.3' },
      { id: 'pot2', name: '第二口锅', cost: 40000, desc: '最忙的器具多一口，产能 +12' },
      { id: 'helper', name: '请帮工', cost: 10000, desc: '帮你把托盘上的菜端给客人；日薪 40，产能 +24' },
      { id: 'counter', name: '加宽操作台', cost: 40000, desc: '菜单多一个位置' }
    ],
    eventChance: 0.6,
    menuSize: 4, menuSizeUpgraded: 5,
    weatherOdds: { sun: 0.5, cloud: 0.3, rain: 0.2 },
    weatherFlow: { sun: 1.0, cloud: 0.97, rain: 0.9 },
    seasonDays: { warm: 12, dumpling: 22, origin: 27 },
    legacyFlowBonus: 0.04
  };
});
