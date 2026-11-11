// 剧情演出脚本：7 段 S 级主线（GDD §3.5、D012）＋ 24 个常客节点（16 段 A 级＋8 段短节点）。
// 指令：cam[x,y,zoom] t | enter who x | exit who | say who text face | prop name x y | hide name | light | weather
//       act {kind:tap|hold|swipe,label,x,y} | choice[{id,label,effect,result,when}] | wait | shutter up/down | sfx | if{cond,then,else}
// 人物 x 为逻辑画布横坐标（1280×720）。who: zhou | 常客 id | npc id（landlord supplier ... 见 game/actors）
BSX.define('content/story', function () {
  var S = {};
  // ── 序幕 第1日 开门（pre）
  S.S01 = { id: 'S01', tier: 'S', day: 1, phase: 'pre', title: '开门', stage: { time: 'dawn', weather: 'sun', view: 'ext' }, beats: [
    { card: 0 }, { light: 'dawn' }, { cam: [640, 360, 1.15], t: 0 },
    { say: 'zhou', text: '五点半。', face: 0 },
    { act: { kind: 'hold', label: '按住，拉起卷帘门', x: 640, y: 420, prop: 'shutter' } },
    { shutter: 'up' }, { sfx: 'shutter' }, { light: 'morning' }, { cam: [640, 360, 1.0], t: 1600 },
    { say: 'zhou', text: '十年没开的门，比我想的轻。', face: 0 },
    { enter: 'zhao', x: 900 },
    { say: 'zhao', text: '……周记开门了？' },
    { say: 'zhou', text: '赵叔。我回来了。', face: 1 },
    { say: 'zhao', text: '一碗粥，两根油条。' },
    { say: 'zhao', text: '跟你爸那会儿一样。' },
    { exit: 'zhao' },
    { narr: '墙上挂着父亲的旧照片。照片后面，夹着一本账本。' },
    { prop: 'ledger', x: 640, y: 470 },
    { act: { kind: 'tap', label: '取下账本', x: 640, y: 470, prop: 'ledger' } },
    { narr: '账本缺了好多页。剩下的第一页，记着开店那天的进货。' },
    { page: 1 },
    { memory: 'mem_01', lines: ['那年夏天，油锅比我还高。', '父亲炸油条，我蹲在门槛上，一根一根地数。'] },
    { hide: 'ledger' },
    { say: 'zhou', text: '后面那些页，去哪了。', face: 2 }
  ] };
  // ── 第一章 第2日 第一锅油（pre）：老金上门
  S.S02 = { id: 'S02', tier: 'S', day: 2, phase: 'pre', title: '第一锅油', stage: { time: 'morning', weather: 'auto', view: 'room' }, beats: [
    { card: 1 }, { cam: [640, 380, 1.0], t: 0 },
    { enter: 'jin', x: 980 }, { cam: [820, 380, 1.2], t: 900 },
    { say: 'jin', text: '哟，周记真开了！', face: 1 },
    { say: 'jin', text: '我老金，给这条街送了二十年油。', face: 1 },
    { prop: 'oilcan', x: 760, y: 560 },
    { say: 'jin', text: '桶装，半价，不开票。', face: 0 },
    { say: 'jin', text: '你爸那会儿，也是我送的。', face: 1 },
    { say: 'zhou', text: '……我爸？', face: 2 },
    { say: 'jin', text: '老交情了嘛。', face: 1 },
    { choice: [
      { id: 'refuse', label: '先不用，我有进货的地方', effect: { rep: 0.5, flag: { refusedJin: true } }, result: '老金笑了笑，把桶拎回了三轮车上。' },
      { id: 'take', label: '收下这桶半价油', effect: { cash: 3000, burn: 6, flag: { jinOil: true } }, result: '油桶搬进了后厨，桶上一个字也没有。' }
    ] },
    { exit: 'jin' }, { hide: 'oilcan' }, { cam: [640, 360, 1.0], t: 700 }
  ] };
  // ── 第一章 第3日 凌晨早市（pre，副本）：老秦带老周去挑货
  S.S03 = { id: 'S03', tier: 'B', day: 3, phase: 'pre', title: '凌晨早市', stage: { time: 'dawn', weather: 'auto', view: 'ext' }, beats: [
    { bg: 'scene_market' }, { light: 'dawn' }, { cam: [640, 360, 1.0], t: 0 },
    { enter: 'qin', x: 900 },
    { say: 'qin', text: '四点的早市，好货不等人。', face: 1 },
    { say: 'qin', text: '叶子要挺，蛋壳要干，油要清。', face: 0 },
    { say: 'qin', text: '标着半价的，你自己掂量。', face: 2 },
    { say: 'zhou', text: '我爸以前也这么挑？', face: 0 },
    { say: 'qin', text: '他眼睛毒着呢。去吧。', face: 1 },
    { dungeon: 'market' },
    { exit: 'qin' }, { bg: null }
  ] };
  // ── 第二章 第10日 庙会早高峰（pre）：游客多，熟客挤不进来
  S.S10 = { id: 'S10', tier: 'B', day: 10, phase: 'pre', title: '庙会早高峰', stage: { time: 'morning', weather: 'sun', view: 'ext' }, beats: [
    { bg: 'scene_fair' }, { cam: [640, 360, 1.0], t: 0 },
    { narr: '老街庙会，天没亮，巷子里就挂满了红灯笼。' },
    { enter: 'man', x: 900 },
    { say: 'man', text: '今天人多，至少翻三倍。', face: 1 },
    { say: 'man', text: '对面在门口摆了长桌，一块钱一碗。', face: 2 },
    { say: 'zhou', text: '赵叔他们，今天怕是挤不进来。', face: 2 },
    { choice: [
      { id: 'regulars', label: '照常开，先顾好熟客', effect: { flow: 1.15, aff: { zhao: 0.5, gong: 0.5 } }, result: '老周在靠窗那张桌上，压了张“留座”的条子。' },
      { id: 'tourists', label: '门口加两张桌，多接游客', effect: { flow: 1.4, cap: 2, rep: -0.5 }, result: '两张折叠桌支了起来，队排到了槐树底下。' }
    ] },
    { exit: 'man' }, { bg: null }
  ] };
  // ── 对手黑心店（B 级主线插曲，D033）：第4日开张抢客
  S.S04 = { id: 'S04', tier: 'B', day: 8, phase: 'pre', title: '街对面开了新店', stage: { time: 'morning', weather: 'auto', view: 'ext' }, beats: [
    { card: 2 }, { cam: [640, 360, 1.0], t: 0 }, { prop: 'flyer', x: 760, y: 600 },
    { narr: '一早，街对面挂起了大红招牌：快好早点。' },
    { enter: 'peer', x: 980 },
    { say: 'peer', text: '豆浆一块，油条买一送一！' },
    { say: 'peer', text: '老周，生意各凭本事啊。' },
    { crowd: 4 },
    { say: 'zhou', text: '一块钱的豆浆……得兑多少水。', face: 3 },
    { narr: '门口排队的人，有几个拐去了对面。' },
    { choice: [
      { id: 'quality', label: '做好自己的就行', effect: { rep: 1 }, result: '老周把今天的米多泡了半小时。' },
      { id: 'compete', label: '我也降价，把人抢回来', effect: { flow: 1.1, rep: -1, burn: 3, flag: { priceWar: true } }, result: '价牌改小了，豆浆也跟着淡了。' }
    ] },
    { crowd: 0 }, { exit: 'peer' }, { hide: 'flyer' },
    { enter: 'jin', x: 1100 },
    { narr: '老金的三轮车停在对面后门，一桶一桶地往里搬。' },
    { exit: 'jin' }
  ] };
  // ── 对手被曝光查封：第15日，客人回流；黑心的你也会被顺路查到
  S.S15 = { id: 'S15', tier: 'B', day: 15, phase: 'pre', title: '对面被查封了', stage: { time: 'morning', weather: 'auto', view: 'ext' }, beats: [
    { card: 3 }, { cam: [640, 360, 1.0], t: 0 }, { prop: 'phoneglow', x: 640, y: 330 },
    { narr: '一早，街坊群里传开了：快好早点后厨用回收油、兑水豆浆，被查封了。' },
    { say: 'zhou', text: '检查的人，下一家就是我这儿。', face: 2 },
    { dungeon: 'check' },
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
    { cam: [640, 360, 1.0], t: 1000 },
    { narr: '收拾蒸笼的时候，夹层里掉出一张折起来的纸。' },
    { page: 2 },
    { memory: 'mem_02', lines: ['那页账上写着：学费，还差八百。', '那天晚上，父亲的台灯亮到很晚。'] },
    { say: 'zhou', text: '……我的学费。', face: 4 }
  ] };
  // ── 第二幕 第12日 便宜的代价（pre，暖冬菜上新）
  S.S12 = { id: 'S12', tier: 'S', day: 12, phase: 'pre', title: '便宜的代价', stage: { time: 'morning', weather: 'rain', view: 'room' }, beats: [
    { weather: 'rain' }, { light: 'rain' }, { cam: [640, 360, 1.0], t: 0 },
    { enter: 'jin', x: 1040 }, { prop: 'crate', x: 940, y: 470 },
    { say: 'jin', text: '暖冬菜上新，羊肉我给你便宜三成。', face: 1 },
    { say: 'jin', text: '票据嘛，下回补。', face: 0 },
    { if: { flag: { jinOil: true } }, then: [{ say: 'jin', text: '上回那桶油，不也用得好好的？', face: 1 }], else: [{ say: 'jin', text: '你爸当年，可没你这么多讲究。', face: 2 }] },
    { if: { burnMin: 40 }, then: [{ cam: [260, 470, 1.5], t: 1400 }, { say: 'zhou', text: '……又是“下回补”。', face: 3 }],
      else: [{ if: { aff: { qin: 3 } }, then: [{ enter: 'qin', x: 140 }, { say: 'qin', text: '我那有带单子的，贵点。' }], else: [{ say: 'zhou', text: '雨真大。', face: 0 }] }] },
    { act: { kind: 'swipe', label: '撕下旧价牌', x: 640, y: 300, prop: 'pricetag' } }, { sfx: 'tear' },
    { choice: [
      { id: 'cheap', label: '收下便宜羊肉', effect: { burn: 10, cash: 6000, flag: { cheapMutton: true } }, result: '箱子搬进了后厨，雨水在地上画出一道印子。' },
      { id: 'paper', label: '只收有票据的', effect: { cash: -4000, rep: 1, aff: { qin: 1 } }, result: '贵是贵点，羊肉上贴着标签。' },
      { id: 'skip', label: '这个冬天先不卖羊肉', effect: { flag: { noMutton: true } }, result: '供应商把箱子搬回了车上。' }
    ] },
    { hide: 'crate' }, { exit: 'jin' }, { exit: 'qin' },
    { narr: '老金走后，老周把后厨那只旧油壶翻了过来。壶底粘着一页纸。' },
    { page: 3 },
    { memory: 'mem_03', lines: ['那页只有一行字：', '油，暂用老金的，开学后换回。'] },
    { say: 'zhou', text: '我爸……也收过他的油。', face: 3 }
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
    { crowd: 0 }, { exit: 'best' }, { hide: 'phoneglow' },
    { enter: 'peer', x: 1000 },
    { say: 'peer', text: '老周……我能进来坐会儿吗。', face: 4 },
    { say: 'peer', text: '我舅说油没问题，我就信了。', face: 4 },
    { say: 'peer', text: '你爸当年，是怎么扛过来的？', face: 2 },
    { say: 'zhou', text: '我也在找。', face: 2 },
    { exit: 'peer' },
    { narr: '那天晚上，老周端起父亲的旧茶杯。杯底压着一页纸。' },
    { page: 6 },
    { memory: 'mem_06', lines: ['父亲把卷帘门拉下来，贴了一张纸。', '对面有人指指点点。他没回头。'] }
  ] };
  // ── 第四幕 第22日 街坊饺子日（pre，含 E20）
  S.S22 = { id: 'S22', tier: 'S', day: 22, phase: 'pre', title: '这条街的晚饭', stage: { time: 'noon', weather: 'auto', view: 'room' }, event: 'E20', beats: [
    { card: 4 }, { cam: [640, 380, 1.0], t: 0 }, { prop: 'dough', x: 640, y: 470 },
    { if: { aff: { man: 4 } }, then: [{ enter: 'man', x: 420 }, { say: 'man', text: '我把馅剁好了，韭菜鸡蛋。' }] },
    { if: { aff: { zhao: 3 } }, then: [{ enter: 'zhao', x: 880 }, { say: 'zhao', text: '孙子说要学包饺子。' }] },
    { if: { aff: { ge: 4 } }, then: [{ enter: 'ge', x: 1060 }, { say: 'ge', text: '我擀皮，以前单位就我擀得圆。' }],
      else: [{ say: 'zhou', text: '人少些，也一样包。', face: 0 }] },
    { act: { kind: 'tap', label: '捏三个褶', x: 640, y: 470, prop: 'dough', count: 3 } }, { sfx: 'perfect' },
    { say: 'zhou', text: '这一锅，算我请的。', face: 1 },
    { eventChoice: 'E20' },
    { exit: 'man' }, { exit: 'zhao' }, { exit: 'ge' }, { hide: 'dough' }
  ] };
  // ── 第四章 第24日 对质（post）：老金摊牌
  S.S24 = { id: 'S24', tier: 'S', day: 24, phase: 'post', title: '对质', stage: { time: 'night', weather: 'auto', view: 'room' }, beats: [
    { bg: 'scene_face' }, { light: 'night' }, { cam: [640, 380, 1.0], t: 0 },
    { enter: 'jin', x: 980 },
    { say: 'jin', text: '老周，明人不说暗话。', face: 0 },
    { say: 'jin', text: '这铺子，我外甥想要。价钱好商量。', face: 1 },
    { say: 'zhou', text: '快好那边的油，也是你送的。', face: 2 },
    { say: 'jin', text: '我又没逼谁买。', face: 3 },
    { say: 'jin', text: '再说了，你爸当年的事，街坊可都还记着。', face: 2 },
    { if: { pagesMin: 3 }, then: [{ narr: '账本就在柜台底下。找回来的那几页，老周都看过了。' }], else: [{ narr: '账本还缺着好些页。老周说不清当年的事。' }] },
    { choice: [
      { id: 'silent', label: '不接话，送客', effect: {}, result: '老金走到门口，回头看了一眼，什么也没说。' },
      { id: 'deal', label: '收下他的钱，旧事不提', effect: { cash: 3000, burn: 8, flag: { jinDeal: true } }, result: '信封压在了账本上面。' },
      { id: 'confront', label: '把账本拿出来，一条条对', when: { pagesMin: 2 }, effect: {}, result: '老周把账本从柜台底下拿了出来。', then: [{ dungeon: 'face' }] }
    ] },
    { exit: 'jin' }, { cam: [640, 360, 1.0], t: 800 }
  ] };
  // ── 终幕 第26日 月底抉择（post）
  S.S26 = { id: 'S26', tier: 'S', day: 26, phase: 'post', title: '月底抉择', stage: { time: 'night', weather: 'auto', view: 'room' }, beats: [
    { light: 'night' }, { cam: [640, 380, 1.0], t: 0 },
    { if: { flag: { truth: true } }, then: [{ memory: 'mem_07', lines: ['账本最后一页是空的。', '父亲的笔，在上面停了很久。'] }, { say: 'zhou', text: '这一页，我来写。', face: 0 }] },
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
    { card: 5 }, { light: 'dusk' }, { cam: [640, 360, 1.1], t: 0 },
    { say: 'zhou', text: '第二十八天。', face: 0 },
    { visitors: 3 },
    { if: { ending: 'E_TRUTH' }, then: [{ narr: '赵爷爷把一张旧照片，摆在靠窗的位子上。' }, { say: 'zhao', text: '两碗豆浆。一碗给你王婶。' }, { say: 'zhou', text: '……好。', face: 1 }, { narr: '账本的最后一页，老周写了一行字。' }] },
    { if: { flag: { exposed: true } }, then: [{ narr: '对街快好早点的卷帘门，再也没拉起来过。' }] },
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
  R.R_zhao_5 = node('R_zhao_5', 'zhao', 'A', [{ say: 'zhao', text: '靠窗这个位子，你王婶以前天天坐。' }, { say: 'zhao', text: '她爱喝稀的，你爸总多给她舀一勺。' }, { memory: 'mem_04', lines: ['那时候店里坐得满满当当。', '王婶靠着窗，赵叔在对面笑。'] }, { narr: '赵爷爷走后，老周擦桌子，桌板底下夹着一页账。' }, { page: 4 }, { say: 'zhou', text: '“王婶，粥钱免。”', face: 2 }]);
  R.R_zhao_7 = node('R_zhao_7', 'zhao', 'A', [{ bg: 'scene_zhao_home' }, { say: 'zhao', text: '你进来坐。' }, { say: 'zhao', text: '有样东西，你爸托我收着。' }, { prop: 'paper', x: 760, y: 470 }, { say: 'zhao', text: '他说你要是回来开店，就给你。' }, { page: 5 }, { memory: 'mem_05', lines: ['医院走廊里，父亲坐了一整夜。', '饭盒里的粥，他一口没动。'] }, { say: 'zhao', text: '那年住院的，是你王婶。' }, { say: 'zhao', text: '你爸一分不少赔了，第二天就关了门。' }, { say: 'zhou', text: '赵叔……', face: 4 }, { say: 'zhao', text: '我就想看看，你会怎么开这个店。' }, { photo: 'zhao' }, { hide: 'paper' }, { bg: null }]);
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
  // 父亲旧账本的七页（剧情里一页页找回；第 7 页空白，真结局时老周写上）
  var PAGES = [
    { n: 1, where: '父亲照片背后', text: ['开张。', '面粉两袋，黄豆一袋，', '油一桶，粮油店，有票。'] },
    { n: 2, where: '蒸笼夹层', text: ['学费，还差八百。'] },
    { n: 3, where: '旧油壶底', text: ['油，暂用老金的。', '开学后换回。'] },
    { n: 4, where: '靠窗的桌板下', text: ['王婶，粥钱免。'] },
    { n: 5, where: '赵爷爷收着', text: ['赔王家医药费，', '一千四。', '收据在老赵那。'] },
    { n: 6, where: '旧茶杯底下', text: ['停业。', '门上贴：对不住街坊。'] },
    { n: 7, where: '账本最后', text: [], last: ['油，从今天起，', '只进有票的。', '—— 周记，第二代'] }
  ];
  return { main: S, nodes: R, all: all, storyDays: storyDays, pages: PAGES, acts: [[1, 3], [4, 7], [8, 12], [13, 18], [19, 22], [23, 28]] };
});
