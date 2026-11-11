// 8 结局（GDD §10）＋ 6 套七日常营业主题 ＋ 传承物（GDD §10.4–10.6）
BSX.define('content/endings', function () {
  var endings = [
    { id: 'E_HONEST', order: 6, name: '贵是贵点，吃了不烧心', mood: '小店成了街坊放心的选择，利润不是最高，但稳。', cond: '存活·口碑≥80·烧心≤30·透明好料日≥60%' },
    { id: 'E_PRIVATE', order: 4, name: '只做熟客的私房小馆', mood: '客人少了，熟客会提前打招呼。老周按自己的节奏做。', cond: '存活·口碑≥65·完成常客节点≥5人·劝退价日≥45%' },
    { id: 'E_CANTEEN', order: 5, name: '街坊食堂', mood: '店里总是坐满，利润很薄，街坊会搭把手。', cond: '存活·口碑≥65·小满好感≥5·亲民价日≥45%' },
    { id: 'E_REOPEN', order: 3, name: '整改之后，重新开张', mood: '承认了错，也把信任一点点捡了回来。', cond: '经历危机·整改或退款·烧心<70·口碑≥55' },
    { id: 'E_PILLS', order: 2, name: '胃药和账单堆在收银台', mood: '钱或许还在，店和人都已经没了余地。', cond: '烧心满后硬撑并活到月底' },
    { id: 'E_FAREWELL', order: 1, name: '搬走那天，常客来送行', mood: '生意没撑住，人情留下了。', cond: '提前结束经营·口碑≥60' },
    { id: 'E_TRANSFER', order: 1, name: '转让', mood: '店铺转了手，账本停在那一天。', cond: '提前结束经营·口碑<60' },
    { id: 'E_TRUTH', order: 8, name: '最后一页', mood: '父亲没写完的那页账，老周替他写上了。', cond: '对质时连父亲的错一起认·收齐 6 页账本·烧心≤40·口碑≥55' },
    { id: 'E_SOMEONE', order: 7, name: '月底那天，还是有人来了', mood: '普通而不完美的一个月。', cond: '其他存活状态', tiers: ['门口冷清，但还有人推门。', '熟悉的几张脸，照常来吃早饭。', '门口排着队，老周笑着招呼。'] }
  ];
  var byId = {};
  endings.forEach(function (e) { byId[e.id] = e; });
  var themes = [
    { id: 'T_RAIN', name: '连雨周', desc: '七天都下雨，骑手单多，堂食少。', mods: { weather: 'rain', flow: 0.95, regular: { ali: 2 } },
      goals: [{ id: 'g1', label: '零退单', check: 'noLost' }, { id: 'g2', label: '让阿力坐下一次', check: 'aliVisits3' }, { id: 'g3', label: '净赚 600', check: 'profit60000' }] },
    { id: 'T_EXAM', name: '学生考试周', desc: '学生赶早，必须快。', mods: { flow: 1.1, patience: 0.8, regular: { zheng: 2 } },
      goals: [{ id: 'g1', label: '不让学生迟到', check: 'noLost' }, { id: 'g2', label: '招牌出餐 10 份', check: 'signature10' }, { id: 'g3', label: '口碑 +5', check: 'rep5' }] },
    { id: 'T_FRESHUP', name: '鲜货涨价周', desc: '鲜货和可追溯食材成本上涨四成。', mods: { materialCost: [1, 1.4, 1.4] },
      goals: [{ id: 'g1', label: '用有限鲜货守住口碑', check: 'rep0' }, { id: 'g2', label: '净赚 400', check: 'profit40000' }, { id: 'g3', label: '烧心不增加', check: 'burn0' }] },
    { id: 'T_COLD', name: '寒潮周', desc: '天冷，热粥热汤卖得好。', mods: { weather: 'cloud', dishBoost: ['congee', 'pidan', 'pumpkin', 'mutton', 'noodle'] },
      goals: [{ id: 'g1', label: '卖出 120 碗粥', check: 'congee120' }, { id: 'g2', label: '给赵爷爷留七天座', check: 'zhaoDaily' }, { id: 'g3', label: '净赚 800', check: 'profit80000' }] },
    { id: 'T_FAIR', name: '老街庙会周', desc: '游客多，熟客反而挤不进来。', mods: { flow: 1.3, regular: {}, capacity: 6 },
      goals: [{ id: 'g1', label: '净赚 1000', check: 'profit100000' }, { id: 'g2', label: '常客七天都来过', check: 'regulars5' }, { id: 'g3', label: '零退单', check: 'noLost' }] },
    { id: 'T_GAS', name: '设备检修周', desc: '油锅检修三天，只能做不用油的菜。', mods: { noOilDays: 3 },
      goals: [{ id: 'g1', label: '口碑不降', check: 'rep0' }, { id: 'g2', label: '净赚 300', check: 'profit30000' }, { id: 'g3', label: '招牌出餐 8 份', check: 'signature8' }] }
  ];
  var heirlooms = [
    { id: 'H_BASKET', name: '老秦的菜筐', desc: '前 3 日鲜货成本降低两成', from: 'qin' },
    { id: 'H_NOTEBOOK', name: '小郑的配方本', desc: '开局解锁蛋炒饭', from: 'zheng' },
    { id: 'H_TEACUP', name: '龚师傅的旧茶杯', desc: '清晨客流稳定 +4%', from: 'gong' },
    { id: 'H_APRON', name: '小满补过的围裙', desc: '每道菜起始熟练度 +1 次', from: 'man' }
  ];
  return { list: endings, byId: byId, themes: themes, heirlooms: heirlooms };
});
