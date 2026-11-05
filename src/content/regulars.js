// 八位常客（GDD §8）。visit：到访权重（加权偏好，不永久锁死）；fav：常点菜（按优先级）。
// nodes：好感 3 / 5 / 7 的故事节点，演出脚本在 content/cutscenes。
BSX.define('content/regulars', function () {
  var list = [
    { id: 'zhao', name: '赵爷爷', full: '赵爷爷和孙子', sprite: 'spr_grandpa', portrait: 7, tag: '军绿马甲·作业本',
      visit: { base: 0.62, price: [1, 1, 0.8], material: [0.85, 1.05, 1.15], oil: [1, 1, 1], rain: 0.9 },
      fav: ['congee', 'youtiao', 'soyyt', 'soy', 'pumpkin', 'tangyuan'], patience: 46,
      lines: { order: '老样子', happy: '孙子吃得香', meh: '有点硬了', wait: '不急不急' },
      nodes: [{ aff: 3, cs: 'R_zhao_3', title: '作业本', unlock: 'soyyt' }, { aff: 5, cs: 'R_zhao_5', title: '考试后加餐' }, { aff: 7, cs: 'R_zhao_7', title: '成绩单' }] },
    { id: 'song', name: '小宋', full: '护士小宋', sprite: 'spr_xiaosong', portrait: 0, tag: '披外套·夜班',
      visit: { base: 0.5, price: [1, 1, 0.9], material: [0.9, 1, 1.1], oil: [0.55, 1, 1.35], rain: 1 },
      fav: ['congee', 'pidan', 'soy', 'egg', 'pumpkin'], patience: 36,
      lines: { order: '一碗热的', happy: '活过来了', meh: '油有点重', wait: '我下夜班' },
      nodes: [{ aff: 3, cs: 'R_song_3', title: '夜班病房' }, { aff: 5, cs: 'R_song_5', title: '夸粥' }, { aff: 7, cs: 'R_song_7', title: '发朋友圈', rep: 3 }] },
    { id: 'ge', name: '老葛', full: '西装老葛', sprite: 'spr_laoge', portrait: 1, tag: '磨亮袖口的旧西装',
      visit: { base: 0.5, price: [1.6, 0.9, 0.35], material: [1, 1, 0.9], oil: [1, 1, 1], rain: 0.9 },
      fav: ['congee', 'youtiao', 'noodle', 'soy', 'friedrice'], patience: 40,
      lines: { order: '还是这个价吧', happy: '实在', meh: '凑合', wait: '我不赶' },
      nodes: [{ aff: 3, cs: 'R_ge_3', title: '失业' }, { aff: 5, cs: 'R_ge_5', title: '暂别' }, { aff: 7, cs: 'R_ge_7', title: '签合同' }] },
    { id: 'ali', name: '阿力', full: '骑手阿力', sprite: 'spr_ali', portrait: 2, tag: '头盔·站着吃',
      visit: { base: 0.4, price: [1.1, 1, 0.8], material: [1, 1, 1], oil: [1, 1, 1], rain: 1.9 },
      fav: ['youtiao', 'soy', 'friedrice', 'poachnoodle', 'noodle'], patience: 30,
      lines: { order: '快的就行', happy: '够劲', meh: '下次快点', wait: '超时了…' },
      nodes: [{ aff: 3, cs: 'R_ali_3', title: '晾粥备注' }, { aff: 5, cs: 'R_ali_5', title: '首次堂食', unlock: 'poachnoodle' }, { aff: 7, cs: 'R_ali_7', title: '多等十分钟' }] },
    { id: 'gong', name: '龚师傅', full: '公交司机龚师傅', sprite: 'spr_gong', portrait: 3, tag: '茶杯·老花镜',
      visit: { base: 0.58, price: [1, 1.1, 0.9], material: [1, 1, 1], oil: [1, 1, 1], rain: 1, morning: true },
      fav: ['soy', 'youtiao', 'teaegg', 'congee', 'scallion'], patience: 44,
      lines: { order: '头班车前', happy: '踏实', meh: '嗯', wait: '车不等人' },
      nodes: [{ aff: 3, cs: 'R_gong_3', title: '街道旧事' }, { aff: 5, cs: 'R_gong_5', title: '退休日期', unlock: 'teaegg' }, { aff: 7, cs: 'R_gong_7', title: '绕路告别' }] },
    { id: 'man', name: '小满', full: '裁缝小满', sprite: 'spr_xiaoman', portrait: 4, tag: '针包围裙',
      visit: { base: 0.45, price: [1.2, 1, 0.8], material: [0.7, 1.35, 1.1], oil: [1, 1, 1], rain: 0.9 },
      fav: ['scallion', 'congee', 'tangyou', 'yeerba', 'soy'], patience: 38,
      lines: { order: '给隔壁也带一份', happy: '手艺不错', meh: '差点意思', wait: '店里没人看' },
      nodes: [{ aff: 3, cs: 'R_man_3', title: '抢客误会', unlock: 'tangyou' }, { aff: 5, cs: 'R_man_5', title: '教熬粥' }, { aff: 7, cs: 'R_man_7', title: '两店互助', unlock: 'yeerba' }] },
    { id: 'zheng', name: '小郑', full: '学生小郑', sprite: 'spr_xiaozheng', portrait: 5, tag: '笔记本',
      visit: { base: 0.42, price: [1.1, 1, 0.85], material: [0.9, 1, 1.2], oil: [0.6, 1, 1.3], rain: 1, burnPause: 60 },
      fav: ['soy', 'egg', 'scallion', 'shengjian', 'mixian'], patience: 34,
      lines: { order: '记一下做法', happy: '原来如此', meh: '火候差了点', wait: '要上课了' },
      nodes: [{ aff: 3, cs: 'R_zheng_3', title: '记配方' }, { aff: 5, cs: 'R_zheng_5', title: '夹照片' }, { aff: 7, cs: 'R_zheng_7', title: '毕业论文' }] },
    { id: 'qin', name: '老秦', full: '菜贩老秦', sprite: 'spr_laoqin', portrait: 6, tag: '三轮车·菜筐',
      visit: { base: 0.42, price: [1, 1, 1.05], material: [0.6, 1, 1.8], oil: [1, 1, 1], rain: 0.8 },
      fav: ['noodle', 'congee', 'pumpkin', 'chicken', 'mutton'], patience: 40,
      lines: { order: '收摊来碗热的', happy: '这菜没白送', meh: '菜不新鲜', wait: '车还在外头' },
      nodes: [{ aff: 3, cs: 'R_qin_3', title: '以菜换面' }, { aff: 5, cs: 'R_qin_5', title: '留鲜货', unlock: 'pumpkin' }, { aff: 7, cs: 'R_qin_7', title: '送南瓜' }] }
  ];
  var byId = {};
  list.forEach(function (r) { byId[r.id] = r; });
  return { list: list, byId: byId };
});
