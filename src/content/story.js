// 剧情演出脚本：7 段 S 级主线（GDD §3.5、D012）＋ 24 个常客节点（16 段 A 级＋8 段短节点）。
// 指令：cam[x,y,zoom] t | enter who x | exit who | say who text face | prop name x y | hide name | light | weather
//       act {kind:tap|hold|swipe,label,x,y} | choice[{id,label,effect,result,when}] | wait | shutter up/down | sfx | if{cond,then,else}
// 人物 x 为逻辑画布横坐标（1280×720）。who: zhou | 常客 id | npc id（landlord supplier ... 见 game/actors）
BSX.define('content/story', function () {
  var S = {};
  // ── 序幕 第1日 开门（pre）
  S.S01 = { id: 'S01', tier: 'S', day: 1, phase: 'pre', title: '开门', stage: { time: 'dawn', weather: 'sun', view: 'ext' }, beats: [
    { light: 'dawn' }, { cam: [640, 360, 1.15], t: 0 },
    { say: 'zhou', text: '五点半。', face: 0 },
    { act: { kind: 'hold', label: '按住，拉起卷帘门', x: 640, y: 420, prop: 'shutter' } },
    { shutter: 'up' }, { sfx: 'shutter' }, { light: 'morning' }, { cam: [640, 360, 1.0], t: 1600 },
    { say: 'zhou', text: '十平米，也是自己的店。', face: 1 },
    { enter: 'zhao', x: 900 },
    { say: 'zhao', text: '小周，开张啦？' },
    { say: 'zhao', text: '一碗粥，两根油条，孩子要上学。' },
    { say: 'zhou', text: '马上好！', face: 1 },
    { exit: 'zhao' }
  ] };
  // ── 对手黑心店（B 级主线插曲，D033）：第4日开张抢客
  S.S04 = { id: 'S04', tier: 'B', day: 4, phase: 'pre', title: '街对面开了新店', stage: { time: 'morning', weather: 'auto', view: 'ext' }, beats: [
    { cam: [640, 360, 1.0], t: 0 }, { prop: 'flyer', x: 760, y: 600 },
    { narr: '一早，街对面挂起了大红招牌：快好早点。' },
    { enter: 'peer', x: 980 },
    { say: 'peer', text: '豆浆一块，油条买一送一！' },
    { say: 'peer', text: '老周，生意各凭本事啊。' },
    { crowd: 4 },
    { say: 'zhou', text: '一块钱的豆浆……得兑多少水。', face: 3 },
    { narr: '门口排队的人，有几个拐去了对面。' },
    { choice: [
      { id: 'compete', label: '我也降价，把人抢回来', effect: { flow: 1.1, rep: -1, burn: 3, flag: { priceWar: true } }, result: '价牌改小了，豆浆也跟着淡了。' },
      { id: 'quality', label: '做好自己的就行', effect: { rep: 1 }, result: '老周把今天的米多泡了半小时。' }
    ] },
    { crowd: 0 }, { exit: 'peer' }, { hide: 'flyer' }
  ] };
  // ── 对手被曝光查封：第15日，客人回流；黑心的你也会被顺路查到
  S.S15 = { id: 'S15', tier: 'B', day: 15, phase: 'pre', title: '对面被查封了', stage: { time: 'morning', weather: 'auto', view: 'ext' }, beats: [
    { cam: [640, 360, 1.0], t: 0 }, { prop: 'phoneglow', x: 640, y: 330 },
    { narr: '早间新闻推送：快好早点后厨使用回收油、兑水豆浆，已被查封。' },
    { crowd: 5 }, { enter: 'inspector', x: 1000 },
    { say: 'inspector', text: '对面封了。你这儿也顺便看看。' },
    { if: { burnMin: 50 },
      then: [{ say: 'inspector', text: '这桶油……跟对面一个样！' }, { say: 'zhou', text: '我、我就用了几回……', face: 3 }, { narr: '围观的街坊小声议论着，有人掏出了手机。' }],
      else: [{ say: 'inspector', text: '干净。开店就该是这个样子。' }, { say: 'neighbor', text: '以后就在你这儿吃了！' }, { say: 'zhou', text: '欢迎，欢迎！', face: 1 }] },
    { choice: [{ id: 'cooperate', label: '配合检查', effect: { audit: true }, result: '检查员合上本子，走向了下一家。' }] },
    { narr: '对面的熟客，一个接一个推开了小馆的门。' },
    { crowd: 0 }, { exit: 'inspector' }, { hide: 'phoneglow' }
  ] };
  // ── 第一幕 第7日 续租通知（post）
  S.S07 = { id: 'S07', tier: 'S', day: 7, phase: 'post', title: '续租通知', stage: { time: 'dusk', weather: 'auto', view: 'room' }, beats: [
    { light: 'dusk' }, { cam: [640, 380, 1.0], t: 0 },
    { enter: 'landlord', x: 980 }, { cam: [820, 360, 1.25], t: 1400 },
    { say: 'landlord', text: '老周，短租月底到期。' },
    { prop: 'lease', x: 760, y: 470 },
    { say: 'landlord', text: '新合同押金一千二，租金也要涨。' },
    { if: { repMin: 60 }, then: [{ say: 'landlord', text: '你这门口天天排队，我也看见了。' }],
      else: [{ if: { cashMax: 280000 }, then: [{ say: 'landlord', text: '账要是撑不住，早点说。' }], else: [{ say: 'landlord', text: '你自己掂量掂量。' }] }] },
    { exit: 'landlord' }, { cam: [760, 470, 1.6], t: 1200 },
    { act: { kind: 'tap', label: '把通知压在账本下', x: 760, y: 470, prop: 'lease' } },
    { hide: 'lease' }, { sfx: 'page' },
    { say: 'zhou', text: '还有二十一天。', face: 2 },
    { cam: [640, 360, 1.0], t: 1000 }
  ] };
  // ── 第二幕 第12日 便宜的代价（pre，暖冬菜上新）
  S.S12 = { id: 'S12', tier: 'S', day: 12, phase: 'pre', title: '便宜的代价', stage: { time: 'morning', weather: 'rain', view: 'room' }, beats: [
    { weather: 'rain' }, { light: 'rain' }, { cam: [640, 360, 1.0], t: 0 },
    { enter: 'supplier', x: 1040 }, { prop: 'crate', x: 940, y: 470 },
    { say: 'supplier', text: '暖冬菜上新，羊肉我给你便宜三成。' },
    { say: 'supplier', text: '票据嘛，下回补。' },
    { if: { burnMin: 40 }, then: [{ cam: [260, 470, 1.5], t: 1400 }, { say: 'zhou', text: '……又是“下回补”。', face: 3 }],
      else: [{ if: { aff: { qin: 3 } }, then: [{ enter: 'qin', x: 140 }, { say: 'qin', text: '我那有带单子的，贵点。' }], else: [{ say: 'zhou', text: '雨真大。', face: 0 }] }] },
    { act: { kind: 'swipe', label: '撕下旧价牌', x: 640, y: 300, prop: 'pricetag' } }, { sfx: 'tear' },
    { choice: [
      { id: 'cheap', label: '收下便宜羊肉', effect: { burn: 10, cash: 6000, flag: { cheapMutton: true } }, result: '箱子搬进了后厨，雨水在地上画出一道印子。' },
      { id: 'paper', label: '只收有票据的', effect: { cash: -4000, rep: 1, aff: { qin: 1 } }, result: '贵是贵点，羊肉上贴着标签。' },
      { id: 'skip', label: '这个冬天先不卖羊肉', effect: { flag: { noMutton: true } }, result: '供应商把箱子搬回了车上。' }
    ] },
    { hide: 'crate' }, { exit: 'supplier' }, { exit: 'qin' }
  ] };
  // ── 第三幕 第18日 一句话传开（pre）
  S.S18 = { id: 'S18', tier: 'S', day: 18, phase: 'pre', title: '一句话传开', stage: { time: 'morning', weather: 'auto', view: 'ext' }, beats: [
    { cam: [640, 360, 1.0], t: 0 }, { prop: 'phoneglow', x: 640, y: 330 },
    { say: 'zhou', text: '手机响了一早上。', face: 3 },
    { if: { repMin: 65, burnMax: 40 },
      then: [{ crowd: 6 }, { say: 'neighbor', text: '就是这家，粥特别稠！' }, { say: 'zhou', text: '慢点，都有。', face: 1 }],
      else: [{ if: { burnMin: 50 },
        then: [{ crowd: 4 }, { say: 'neighbor', text: '听说他家油用了好几天？' }, { say: 'zhou', text: '……', face: 3 }],
        else: [{ if: { repMax: 50 }, then: [{ crowd: 0 }, { say: 'zhou', text: '视频火了，门口还是没人。', face: 4 }],
          else: [{ crowd: 3 }, { say: 'neighbor', text: '这家还行吧，挺实在的。' }] }] }] },
    { if: { anyAff: 5 }, then: [{ enter: 'best', x: 980 }, { say: 'best', text: '我在这吃了快一个月了，我作证。' }] },
    { choice: [
      { id: 'open', label: '把后厨帘子掀开', effect: { rep: 2, burn: -5 }, result: '锅、油、米袋，全摆在明处。' },
      { id: 'post', label: '贴出进货单', effect: { rep: 1, burn: -8, cash: -1000 }, result: '一张张单据贴满了门边。' },
      { id: 'cook', label: '不解释，接着做', effect: { rep: 0.5 }, result: '老周只管把粥熬好。' }
    ] },
    { crowd: 0 }, { exit: 'best' }, { hide: 'phoneglow' }
  ] };
  // ── 第四幕 第22日 街坊饺子日（pre，含 E20）
  S.S22 = { id: 'S22', tier: 'S', day: 22, phase: 'pre', title: '这条街的晚饭', stage: { time: 'noon', weather: 'auto', view: 'room' }, event: 'E20', beats: [
    { cam: [640, 380, 1.0], t: 0 }, { prop: 'dough', x: 640, y: 470 },
    { if: { aff: { man: 4 } }, then: [{ enter: 'man', x: 420 }, { say: 'man', text: '我把馅剁好了，韭菜鸡蛋。' }] },
    { if: { aff: { zhao: 3 } }, then: [{ enter: 'zhao', x: 880 }, { say: 'zhao', text: '孙子说要学包饺子。' }] },
    { if: { aff: { ge: 4 } }, then: [{ enter: 'ge', x: 1060 }, { say: 'ge', text: '我擀皮，以前单位就我擀得圆。' }],
      else: [{ say: 'zhou', text: '人少些，也一样包。', face: 0 }] },
    { act: { kind: 'tap', label: '捏三个褶', x: 640, y: 470, prop: 'dough', count: 3 } }, { sfx: 'perfect' },
    { say: 'zhou', text: '这一锅，算我请的。', face: 1 },
    { eventChoice: 'E20' },
    { exit: 'man' }, { exit: 'zhao' }, { exit: 'ge' }, { hide: 'dough' }
  ] };
  // ── 终幕 第26日 月底抉择（post）
  S.S26 = { id: 'S26', tier: 'S', day: 26, phase: 'post', title: '月底抉择', stage: { time: 'night', weather: 'auto', view: 'room' }, beats: [
    { light: 'night' }, { cam: [640, 380, 1.0], t: 0 },
    { enter: 'landlord', x: 980 }, { prop: 'lease', x: 760, y: 470 },
    { say: 'landlord', text: '合同我带来了。签不签，给句话。' },
    { cam: [700, 430, 1.35], t: 1200 },
    { if: { burnMin: 70 }, then: [{ say: 'zhou', text: '这个月……我心里不踏实。', face: 3 }],
      else: [{ if: { repMin: 70 }, then: [{ say: 'zhou', text: '街坊都等着我开门呢。', face: 1 }], else: [{ say: 'zhou', text: '钱是紧了点。', face: 2 }] }] },
    { choice: [
      { id: 'buy', label: '直接盘下铺面（4000 元）', when: { canBuy: true }, effect: { buyout: true }, result: '房东愣了一下，把房产证推了过来：“行，这铺子归你了。”' },
      { id: 'renew', label: '签下续租', when: { canRenew: true }, effect: { renew: true }, result: '老周按下了红手印。' },
      { id: 'neighbors', label: '请街坊帮衬押金', when: { cantRenew: true, affSum: 14 }, effect: { renew: true, borrowNeighbors: true }, result: '小满、老秦凑了钱，压在账本下。' },
      { id: 'leave', label: '不签了，月底收摊', effect: { leave: true }, result: '老周把合同推了回去。' }
    ] },
    { exit: 'landlord' }, { hide: 'lease' }
  ] };
  // ── 终幕 第28日 月底（post，结局前；读取结局）
  S.S28 = { id: 'S28', tier: 'S', day: 28, phase: 'post', title: '月底', stage: { time: 'dusk', weather: 'sun', view: 'ext' }, beats: [
    { light: 'dusk' }, { cam: [640, 360, 1.1], t: 0 },
    { say: 'zhou', text: '第二十八天。', face: 0 },
    { visitors: 3 },
    { if: { ending: 'E_HONEST' }, then: [{ narr: '门口的公示板上，进货单一张压一张，贴得满满当当。' }, { say: 'qin', text: '贵一点没关系，吃得放心。' }, { say: 'best', text: '我把你家推给全楼了。' }, { say: 'zhou', text: '明天的油，还是新的。', face: 1 }] },
    { if: { ending: 'E_PRIVATE' }, then: [{ narr: '小本子上，熟客的口味记了满满三页。' }, { say: 'best', text: '下周三还给我留个位子。' }, { say: 'zhou', text: '老位子，少放葱。', face: 1 }] },
    { if: { ending: 'E_CANTEEN' }, then: [{ crowd: 6 }, { narr: '天还没亮透，门口已经排起了队。' }, { say: 'man', text: '明天我早点来帮你。' }, { say: 'zhao', text: '孙子说，就爱吃这一口。' }, { say: 'zhou', text: '街坊的早饭，管饱。', face: 1 }] },
    { if: { ending: 'E_REOPEN' }, then: [{ narr: '整改通知书旁边，新贴了一张“重新开张”的红纸。' }, { say: 'best', text: '重新开张那天，我第一个来。' }, { say: 'zhou', text: '这回，一滴旧油都不留。', face: 2 }] },
    { if: { ending: 'E_PILLS' }, then: [{ crowd: 0 }, { narr: '对面没人排队，这边也没有。灯笼的光是浑的。' }, { say: 'zhou', text: '省下的那点钱……', face: 4 }, { narr: '收银台上，胃药和账单压在一起。' }, { say: 'zhou', text: '胃药……放哪了。', face: 4 }] },
    { if: { ending: 'E_SOMEONE' }, then: [{ say: 'best', text: '明天还开吧？' }, { say: 'zhou', text: '开。五点半，锅先热上。', face: 1 }] },
    { act: { kind: 'hold', label: '按住，拉下卷帘门', x: 640, y: 420, prop: 'shutter' } }, { shutter: 'down' }, { sfx: 'shutter' },
    { cam: [640, 360, 1.0], t: 1200 }
  ] };

  // ── 常客节点：3 号节点为短节点（B 级舞台），5、7 号为 A 级演出
  function node(id, who, tier, beats) { return { id: id, tier: tier, who: who, phase: 'post', stage: { view: 'room', time: 'auto' }, beats: [{ enter: who, x: 900 }, { cam: [860, 380, 1.3], t: 900 }].concat(beats, [{ exit: who }, { cam: [640, 360, 1.0], t: 800 }]) }; }
  var R = {};
  R.R_zhao_3 = node('R_zhao_3', 'zhao', 'B', [{ prop: 'notebook', x: 860, y: 470 }, { say: 'zhao', text: '作业本落这儿了，孙子急哭了。' }, { say: 'zhou', text: '油条泡豆浆，吃了不哭。', face: 1 }, { hide: 'notebook' }, { unlockDish: 'soyyt' }]);
  R.R_zhao_5 = node('R_zhao_5', 'zhao', 'A', [{ say: 'zhao', text: '孙子期中考了第三！' }, { say: 'zhao', text: '今天想吃点好的。' }, { act: { kind: 'tap', label: '多卧一个蛋', x: 860, y: 470 } }, { sfx: 'perfect' }, { say: 'zhao', text: '你这碗，比蛋糕强。' }]);
  R.R_zhao_7 = node('R_zhao_7', 'zhao', 'A', [{ prop: 'report', x: 860, y: 470 }, { say: 'zhao', text: '成绩单，他非要给你看。' }, { say: 'zhou', text: '语文九十八……', face: 1 }, { say: 'zhao', text: '他说长大要开早餐店。' }, { photo: 'zhao' }, { hide: 'report' }]);
  R.R_song_3 = node('R_song_3', 'song', 'B', [{ say: 'song', text: '昨晚病房里收了三个急诊。' }, { say: 'song', text: '就想着这口热粥。' }, { say: 'zhou', text: '给你盛稠的。', face: 0 }]);
  R.R_song_5 = node('R_song_5', 'song', 'A', [{ say: 'song', text: '周叔，你的粥有米油。' }, { if: { burnMin: 50 }, then: [{ say: 'song', text: '就是……最近油有点哈。' }, { say: 'zhou', text: '我、我明天换油。', face: 3 }], else: [{ say: 'song', text: '跟我妈熬的一样。' }, { say: 'zhou', text: '小火，多搅。', face: 1 }] }]);
  R.R_song_7 = node('R_song_7', 'song', 'A', [{ prop: 'phone', x: 860, y: 430 }, { say: 'song', text: '我发了条朋友圈，科室都要来。' }, { act: { kind: 'tap', label: '对着手机比个手势', x: 860, y: 430 } }, { say: 'song', text: '拍好啦！' }, { photo: 'song' }, { hide: 'phone' }]);
  R.R_ge_3 = node('R_ge_3', 'ge', 'B', [{ say: 'ge', text: '我……其实上个月就没班上了。' }, { say: 'ge', text: '西装是去面试穿的。' }, { say: 'zhou', text: '先吃饱，再面试。', face: 0 }]);
  R.R_ge_5 = node('R_ge_5', 'ge', 'A', [{ say: 'ge', text: '我要去外地试试，可能一阵子不来。' }, { choice: [{ id: 'pack', label: '给他装两根油条', effect: { aff: { ge: 0.5 } }, result: '他把纸袋揣进了公文包。' }, { id: 'wave', label: '送他到门口', effect: {}, result: '他回头摆了摆手。' }] }]);
  R.R_ge_7 = node('R_ge_7', 'ge', 'A', [{ prop: 'contract', x: 860, y: 470 }, { say: 'ge', text: '签了！回本地的公司。' }, { say: 'ge', text: '第一个月工资，先请你吃一顿。' }, { say: 'zhou', text: '在我店里请我？', face: 1 }, { photo: 'ge' }, { hide: 'contract' }]);
  R.R_ali_3 = node('R_ali_3', 'ali', 'B', [{ say: 'ali', text: '有单备注：粥晾一下再装。' }, { say: 'ali', text: '是个老太太，牙不好。' }, { say: 'zhou', text: '那我少放点碱。', face: 0 }]);
  R.R_ali_5 = node('R_ali_5', 'ali', 'A', [{ say: 'ali', text: '今天不跑了，坐着吃一回。' }, { act: { kind: 'tap', label: '给他煎个荷包蛋', x: 860, y: 470 } }, { sfx: 'sizzle' }, { say: 'ali', text: '原来坐着吃，这么香。' }, { unlockDish: 'poachnoodle' }]);
  R.R_ali_7 = node('R_ali_7', 'ali', 'A', [{ weather: 'rain' }, { say: 'ali', text: '平台说超时扣钱。' }, { say: 'ali', text: '可你那碗面，我愿意多等十分钟。' }, { say: 'zhou', text: '下回我先给你做。', face: 1 }, { photo: 'ali' }]);
  R.R_gong_3 = node('R_gong_3', 'gong', 'B', [{ prop: 'teacup', x: 860, y: 470 }, { say: 'gong', text: '这儿以前是条河，我小时候摸过鱼。' }, { say: 'zhou', text: '难怪地下潮。', face: 0 }, { hide: 'teacup' }]);
  R.R_gong_5 = node('R_gong_5', 'gong', 'A', [{ say: 'gong', text: '月底退休，最后一班车。' }, { say: 'gong', text: '我卤的茶叶蛋，方子给你。' }, { unlockDish: 'teaegg' }, { say: 'zhou', text: '我一定卤够八个钟头。', face: 1 }]);
  R.R_gong_7 = node('R_gong_7', 'gong', 'A', [{ view: 'ext' }, { prop: 'bus', x: 400, y: 420 }, { say: 'gong', text: '最后一班，我绕到你门口。' }, { act: { kind: 'tap', label: '挥手', x: 400, y: 380 } }, { sfx: 'horn' }, { photo: 'gong' }, { hide: 'bus' }]);
  R.R_man_3 = node('R_man_3', 'man', 'B', [{ say: 'man', text: '我还以为你抢我客人。' }, { say: 'man', text: '原来是她们来你这吃早饭。' }, { say: 'zhou', text: '吃完去你那改裤脚。', face: 1 }, { unlockDish: 'tangyou' }]);
  R.R_man_5 = node('R_man_5', 'man', 'A', [{ say: 'man', text: '我女儿生病，只肯喝白粥。' }, { say: 'man', text: '你教教我？' }, { act: { kind: 'swipe', label: '示范画圈搅粥', x: 860, y: 470 } }, { say: 'man', text: '原来要顺着一个方向。' }]);
  R.R_man_7 = node('R_man_7', 'man', 'A', [{ say: 'man', text: '以后你忙，我来帮你看店。' }, { say: 'man', text: '你没空，我把你衣服也补了。' }, { photo: 'man' }, { unlockDish: 'yeerba' }]);
  R.R_zheng_3 = node('R_zheng_3', 'zheng', 'B', [{ prop: 'notebook', x: 860, y: 470 }, { say: 'zheng', text: '米和水，是一比十二吗？' }, { say: 'zhou', text: '冬天一比十。', face: 1 }, { hide: 'notebook' }]);
  R.R_zheng_5 = node('R_zheng_5', 'zheng', 'A', [{ say: 'zheng', text: '我在本子里夹了张照片。' }, { say: 'zheng', text: '是开门那天拍的。' }, { photo: 'zheng' }, { say: 'zhou', text: '我那天头发这么乱？', face: 2 }]);
  R.R_zheng_7 = node('R_zheng_7', 'zheng', 'A', [{ prop: 'paper', x: 860, y: 470 }, { say: 'zheng', text: '毕业论文：一家早餐店的诚实成本。' }, { if: { burnMax: 30 }, then: [{ say: 'zheng', text: '你是我的案例。' }], else: [{ say: 'zheng', text: '有几页，我还没想好怎么写。' }] }, { hide: 'paper' }]);
  R.R_qin_3 = node('R_qin_3', 'qin', 'B', [{ say: 'qin', text: '今天的葱，换你一碗面。' }, { say: 'zhou', text: '成交。', face: 1 }]);
  R.R_qin_5 = node('R_qin_5', 'qin', 'A', [{ prop: 'crate', x: 860, y: 470 }, { say: 'qin', text: '最好的一筐，我给你留着。' }, { say: 'qin', text: '老南瓜，熬粥甜。' }, { unlockDish: 'pumpkin' }, { hide: 'crate' }]);
  R.R_qin_7 = node('R_qin_7', 'qin', 'A', [{ prop: 'pumpkin', x: 860, y: 470 }, { say: 'qin', text: '自家地里的，送你。' }, { act: { kind: 'hold', label: '抱起南瓜', x: 860, y: 470 } }, { say: 'zhou', text: '好沉！', face: 1 }, { photo: 'qin' }, { hide: 'pumpkin' }]);
  var all = {};
  // 提前收摊（S26 选“不签了”后紧接着播放，读取结局：送行 / 转让）
  all.X_LEAVE = { id: 'X_LEAVE', tier: 'B', title: '收摊那天', stage: { time: 'dusk', weather: 'auto', view: 'ext' }, beats: [
    { light: 'dusk' }, { cam: [640, 360, 1.05], t: 0 },
    { prop: 'box', x: 470, y: 540 },
    { say: 'zhou', text: '锅碗都捆好了。', face: 2 },
    { visitors: 3 },
    { if: { ending: 'E_FAREWELL' }, then: [{ narr: '三轮车上捆着锅碗，门口却站满了人。' }, { say: 'zhao', text: '老周，路上慢点。' }, { say: 'song', text: '这是给你的饭盒，别空着肚子赶路。' }, { say: 'best', text: '你在哪儿开，我们就去哪儿吃。' }, { say: 'zhou', text: '……都回去吧，天冷。', face: 3 }] },
    { if: { ending: 'E_TRANSFER' }, then: [{ crowd: 0 }, { narr: '玻璃门上贴着“旺铺转让”，没人停下来看。' }, { say: 'zhou', text: '当初要是多换几次油……', face: 4 }, { say: 'zhou', text: '钥匙，交给下一个人吧。', face: 4 }] },
    { if: { ending: 'E_PILLS' }, then: [{ crowd: 0 }, { narr: '没有人来送。收银台抽屉里，胃药和欠条压在一起。' }, { say: 'zhou', text: '省下的那点钱，到底省到哪去了……', face: 4 }] },
    { act: { kind: 'hold', label: '按住，最后一次拉下卷帘门', x: 640, y: 420, prop: 'shutter' } }, { shutter: 'down' }, { sfx: 'shutter' },
    { cam: [640, 360, 1.0], t: 1200 }
  ] };
  Object.keys(S).forEach(function (k) { all[k] = S[k]; });
  Object.keys(R).forEach(function (k) { all[k] = R[k]; });
  var storyDays = {};
  Object.keys(S).forEach(function (k) { storyDays[S[k].day] = k; });
  return { main: S, nodes: R, all: all, storyDays: storyDays, acts: [[1, 3], [4, 7], [8, 12], [13, 18], [19, 22], [23, 28]] };
});
