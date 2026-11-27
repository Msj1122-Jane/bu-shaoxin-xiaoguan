// 人物表：八位常客的基础资料（外观、出勤习惯）、配角、散客六类、添置清单。
// 台词和故事在 content/arcs_a、arcs_b、scenes、ambient。
BSX.define('content/cast', function () {
  // attend(s, R)：没有故事节拍的普通日子来不来的概率。s = 局状态，h = 辅助读数。
  var regulars = {
    zhao: { name: '赵爷爷', full: '赵爷爷和豆豆', sprite: 'spr_grandpa', portrait: 7, h: 268, at: 'early', likes: ['清淡', '汤水'], first: 1,
      attend: function (h) { return 0.74 + h.aff * 0.02 - (h.price === 2 ? 0.14 : 0); } },
    song: { name: '小宋', full: '护士小宋', sprite: 'spr_xiaosong', portrait: 0, h: 262, at: 'open', likes: ['清淡', '汤水'], first: 2,
      attend: function (h) { return 0.66 + h.aff * 0.03 - Math.max(0, h.oilAge - 2) * 0.2 - (h.burn > 60 ? 0.3 : 0); } },
    ge: { name: '老葛', full: '西装老葛', sprite: 'spr_laoge', portrait: 1, h: 272, at: 'rush', likes: ['顶饱'], first: 3,
      attend: function (h) { return [0.82, 0.66, 0.26][h.price] + h.aff * 0.02; } },
    ali: { name: '阿力', full: '骑手阿力', sprite: 'spr_ali', portrait: 2, h: 262, at: 'rush', likes: ['快', '顶饱'], first: 4,
      attend: function (h) { return (h.weather === 'rain' ? 0.9 : 0.52) + h.aff * 0.03 - (h.fast === false ? 0.15 : 0); } },
    gong: { name: '龚师傅', full: '7 路龚师傅', sprite: 'spr_gong', portrait: 3, h: 276, at: 'open', likes: ['油香'], first: 2,
      attend: function (h) { return 0.8 + h.aff * 0.02; } },
    man: { name: '小满', full: '裁缝小满', sprite: 'spr_xiaoman', portrait: 4, h: 262, at: 'late', likes: ['清淡', '甜'], first: 3,
      attend: function (h) { return 0.5 + h.aff * 0.04 - (h.oilAge >= 3 && !h.hood ? 0.4 : 0); } },
    zheng: { name: '小郑', full: '学生小郑', sprite: 'spr_xiaozheng', portrait: 5, h: 258, at: 'rush', likes: ['油香', '快'], first: 5,
      attend: function (h) { return 0.6 + h.aff * 0.03 - (h.burn >= 60 ? 0.5 : 0); } },
    qin: { name: '老秦', full: '菜贩老秦', sprite: 'spr_laoqin', portrait: 6, h: 250, at: 'last', likes: ['汤水', '顶饱'], first: 6,
      attend: function (h) { return [0.3, 0.72, 0.8][h.mat] + h.aff * 0.03; } }
  };
  var regIds = ['zhao', 'song', 'ge', 'ali', 'gong', 'man', 'zheng', 'qin'];
  // 配角与散客的像素小人参数（game/people 按此生成）
  // hair: short | bun | bob | cap | gray | pony | bald | helmet | straw ；acc: tie | apron | glasses | pack | scarf | keys | clip | phone | cam | basket | cane | vest
  var npcs = {
    landlord: { name: '汪姐', sprite: 'spr_landlord', body: '#8a5a6e', pants: '#3b3440', hair: 'bob', hairCol: '#4a3028', acc: 'keys', skin: 0 },
    hu: { name: '老胡', sprite: 'spr_hu', body: '#3f6a8a', pants: '#2d3440', hair: 'cap', hairCol: '#27323c', acc: 'vest', skin: 1 },
    powder: { name: '推销员', body: '#c9b037', pants: '#3a3a44', hair: 'short', hairCol: '#1f1712', acc: 'tie', skin: 0 },
    inspector: { name: '小陈', sprite: 'spr_inspector', body: '#2f4f7a', pants: '#26303d', hair: 'short', hairCol: '#1f1712', acc: 'clip', skin: 0 },
    vlogger: { name: '探店博主', body: '#e07a5f', pants: '#3b3b58', hair: 'pony', hairCol: '#5a3020', acc: 'phone', skin: 0 },
    recycler: { name: '收油的', body: '#5c6b3c', pants: '#3e3a2c', hair: 'cap', hairCol: '#3a3a2a', acc: null, skin: 2 },
    guifen: { name: '桂芬', body: '#8a6aa0', pants: '#3e3348', hair: 'bun', hairCol: '#2a1a14', acc: 'apron', skin: 1 },
    heyi: { name: '何姨', sprite: 'spr_heyi', body: '#a05a4a', pants: '#4a3a34', hair: 'gray', hairCol: '#c8c2b8', acc: 'apron', skin: 1 },
    peer: { name: '早餐车老板', sprite: 'spr_peer', body: '#a8423a', pants: '#3a2f2a', hair: 'short', hairCol: '#1a1410', acc: 'apron', skin: 2 },
    doudou: { name: '豆豆', sprite: 'spr_doudou', body: '#f0ede4', pants: '#2f4a7a', hair: 'short', hairCol: '#3a2418', acc: 'scarf', skin: 0, kid: true },
    tangtang: { name: '糖糖', sprite: 'spr_tangtang', body: '#f2c6cf', pants: '#6a4a7a', hair: 'pony', hairCol: '#3a2418', acc: null, skin: 0, kid: true },
    aunty: { name: '刘姐', body: '#c86a8a', pants: '#3a3440', hair: 'bob', hairCol: '#3a2018', acc: 'phone', skin: 0 },
    tv: { name: '记者', body: '#4a5a6a', pants: '#2a2a30', hair: 'bob', hairCol: '#2a1a14', acc: 'cam', skin: 0 },
    wu: { name: '吴奶奶', sprite: 'spr_wu', body: '#8a6a7a', pants: '#4a3a34', hair: 'gray', hairCol: '#d8d2c8', acc: 'cane', skin: 1, h: 0.86 },
    wang: { name: '王阿姨', sprite: 'spr_wang', body: '#a05a5a', pants: '#3a3030', hair: 'bun', hairCol: '#a8a29a', acc: null, skin: 1 },
    neighbor: { name: '街坊', body: '#6e8a6a', pants: '#3a3a3a', hair: 'gray', hairCol: '#b8b0a4', acc: null, skin: 1 },
    kid: { name: '学生娃', body: '#f0ede4', pants: '#2f4a7a', hair: 'short', hairCol: '#2a1810', acc: 'pack', skin: 0, kid: true }
  };
  // 散客六类：w = 平日权重；rain = 雨天权重倍率；likes = 偏好标签；items = 每单件数分布 [1,2,3]；tip = 给小费倾向；sens = 对价钱敏感
  var archetypes = {
    student: { name: '学生', w: 1.1, rain: 0.8, likes: ['快', '甜', '油香'], items: [0.5, 0.42, 0.08], tip: 0.2, sens: 1.3, patience: 0.9,
      looks: { body: ['#f0ede4', '#dfe8f2', '#3c6fb0'], pants: ['#2f4a7a', '#33384a'], hair: ['short', 'pony', 'bob'], acc: ['pack', 'pack', 'glasses'] } },
    office: { name: '上班族', w: 1.2, rain: 0.9, likes: ['快', '清淡'], items: [0.38, 0.5, 0.12], tip: 0.7, sens: 0.8, patience: 0.85,
      looks: { body: ['#56627a', '#7a6a58', '#d8d2c4', '#4a6a66'], pants: ['#2c2f3a', '#3a3430'], hair: ['short', 'bob', 'bun'], acc: ['tie', 'glasses', null] } },
    worker: { name: '干活的', w: 1.0, rain: 0.7, likes: ['顶饱', '肉', '油香'], items: [0.2, 0.5, 0.3], tip: 0.3, sens: 1.1, patience: 1.0,
      looks: { body: ['#c9762f', '#5c6b3c', '#4a5a7a', '#8a4a3a'], pants: ['#3e3a2c', '#2d3440'], hair: ['short', 'cap', 'bald'], acc: ['vest', null, 'scarf'] } },
    elder: { name: '老人', w: 0.9, rain: 0.6, likes: ['清淡', '汤水'], items: [0.45, 0.45, 0.1], tip: 0.2, sens: 1.2, patience: 1.25,
      looks: { body: ['#7a8a6a', '#8a6a5a', '#6a6a7a', '#a08a6a'], pants: ['#3a3a3a', '#4a3a34'], hair: ['gray', 'gray', 'bald'], acc: ['cane', 'basket', null] } },
    parent: { name: '带娃的', w: 0.8, rain: 0.7, likes: ['清淡', '甜', '汤水'], items: [0.15, 0.5, 0.35], tip: 0.5, sens: 1.0, patience: 0.95,
      looks: { body: ['#c86a8a', '#6a8aa0', '#d8a05a', '#7a9a7a'], pants: ['#3a3440', '#2f3a4a'], hair: ['bun', 'bob', 'pony', 'short'], acc: ['basket', null, 'glasses'] } },
    rider: { name: '骑手', w: 0.5, rain: 2.6, likes: ['快', '顶饱'], items: [0.55, 0.4, 0.05], tip: 0.2, sens: 1.0, patience: 0.7,
      looks: { body: ['#e0b020', '#2f8a7a', '#3a6ad0'], pants: ['#2a2a30'], hair: ['helmet'], acc: [null] } }
  };
  // 添置：晚账页的旧货单。cost 单位：分。
  var upgrades = [
    { id: 'shelf', name: '保温出餐台', cost: 11000, day: 3, text: '台面多两格，放着的东西凉得慢。' },
    { id: 'bigpot', name: '大号粥锅', cost: 9000, day: 4, text: '一锅多熬六碗，少添几回米。' },
    { id: 'fryer', name: '油锅加两格', cost: 10000, day: 5, text: '一次能炸六根。' },
    { id: 'burner', name: '添一口灶', cost: 24000, day: 8, text: '粥、油、煎、面，四口灶都能开。' },
    { id: 'hood', name: '排烟罩', cost: 18000, day: 6, text: '油烟往上走，不往隔壁飘。' },
    { id: 'awning', name: '门口雨棚', cost: 11000, day: 4, text: '下雨天排队的人不那么急着走。' },
    { id: 'board', name: '加长菜单牌', cost: 8000, day: 10, text: '菜单上多写一道菜。' }
  ];
  var heirlooms = [
    { id: 'H_APRON', name: '洗得发白的围裙', text: '上个月的手还记得。每口灶起步多一级熟练。' },
    { id: 'H_NOTE', name: '何姨的粥谱', text: '第一天就能做皮蛋瘦肉粥。' },
    { id: 'H_MUG', name: '龚师傅的茶缸', text: '头班车的人认得它。每天多两位早客。' },
    { id: 'H_CURTAIN', name: '小满缝的门帘', text: '街坊愿意多等一会儿。' },
    { id: 'H_TIN', name: '零钱盒', text: '开局多一百块。' }
  ];
  return { regulars: regulars, regIds: regIds, npcs: npcs, archetypes: archetypes, upgrades: upgrades, heirlooms: heirlooms };
});
