// 主线场景（14 场）＋ 事件（15 场）。格式见 docs/CONTENT_SPEC.md §7。
// 每句 ≤ 26 字；旁白 n 每条路径 ≤ 2 句、每句 ≤ 24 字；主线每条路径 ≤ 14 句，事件 ≤ 12 句。
// 'z' 老周 · 'n' 旁白 · 'best' 好感最高的常客（引擎解析）。
BSX.define('content/scenes', function () {
  var main = {};

  // ───────────────────────── 第 1–7 日：先把门开着 ─────────────────────────

  main.m01_open = { id: 'm01_open', title: '开门', day: 1, when: 'open', light: 'dawn', beats: [
    ['n', '五点半。柳河街还没亮透。'],
    { do: 'hold', label: '按住，拉起卷帘门' },
    { shutter: 'up' }, { sfx: 'shutter' },
    ['z', '十平米。'],
    ['n', '门头的招牌是块白板，一个字没有。'],
    { enter: 'zhao', slot: 1 },
    ['zhao', '开张啦？这扇门有阵子没响了。'],
    ['z', '嗯。头一天。'],
    ['zhao', '你这店叫什么？招牌上没字。'],
    ['z', '还没想好。'],
    ['zhao', '不急。先把粥熬上。'],
    ['zhao', '六点四十，我带孙子来。'],
    { exit: 'zhao' },
    { sfx: 'bell' }
  ] };

  main.m01_close = { id: 'm01_close', title: '抽屉里的条子', day: 1, when: 'close', light: 'dusk', beats: [
    ['n', '收了摊。零钱盒比想的轻。'],
    { do: 'tap', label: '拉开柜台下的抽屉' },
    { sfx: 'page' },
    { prop: 'paper', label: '何姨的条子' },
    ['n', '一张条子，压着一本手写的粥谱。'],
    ['z', '“油三天一换，别省。”'],
    ['z', '……何姨的字。'],
    { prop: 'notebook', label: '粥谱' },
    ['z', '米一水十二。冬天一比十。'],
    ['z', '先泡米。小火。顺一个方向搅。'],
    { fx: { memento: 'm_heyi_note' } },
    { fx: { memento: 'm_recipe' } },
    { do: 'tap', label: '把条子贴在灶台边' },
    { prop: 'paper', off: true },
    ['z', '贴这吧。抬头就看得见。'],
    { light: 'night' }
  ] };

  main.m02_close = { id: 'm02_close', title: '老煎锅', day: 2, when: 'close', light: 'dusk', beats: [
    ['n', '灶台底下，有个包着旧报纸的铁家伙。'],
    { do: 'hold', label: '按住，把它拖出来' },
    { sfx: 'knock' },
    ['z', '一口煎锅。锅底黑得发亮。'],
    { enter: 'qin', slot: 2 },
    ['qin', '这锅还在啊。'],
    ['qin', '何姨拿它烙葱油饼。煎蛋不粘。'],
    ['z', '我……没烙过饼。'],
    ['qin', '粥谱后头几页有。她都写了。'],
    ['qin', '头一回先拿油养养。别用洗洁精。'],
    ['z', '嗯。'],
    { sfx: 'sizzle' },
    { fx: { unlock: 'scallion' } },
    { fx: { unlock: 'egg' } },
    ['qin', '明早的葱，我多放一把。'],
    { exit: 'qin' }
  ] };

  main.m07_close = { id: 'm07_close', title: '七天一交', day: 7, when: 'close', light: 'dusk', beats: [
    { enter: 'landlord', slot: 2 },
    { prop: 'keys', label: '一串钥匙' },
    ['landlord', '老周，一个礼拜了。房租该交了。'],
    ['landlord', '往后也是七天一交，别让我催。'],
    { prop: 'lease', label: '短租合同' },
    ['landlord', '短租二十八号到头。要续，押金一千二。'],
    ['landlord', '二十六号晚上我来。你给句话。'],
    { if: { rep: [60] },
      then: [
        ['landlord', '你门口这几天排队，我在楼上都看见了。'],
        ['landlord', '这门脸有人来问。我先没应。']
      ],
      else: [
        { if: { cash: [-100000, 150] },
          then: [
            ['landlord', '零钱盒我不看也知道。撑不住早说。'],
            ['landlord', '别到月底让我为难。']
          ],
          else: [
            ['landlord', '生意嘛，不好不坏。你自己掂量。']
          ] }
      ] },
    ['z', '行。'],
    { exit: 'landlord' },
    { prop: 'keys', off: true },
    { do: 'tap', label: '把合同压在账本底下' },
    { prop: 'lease', off: true }, { sfx: 'page' },
    { fx: { memento: 'm_lease' } },
    ['z', '还有二十一天。'],
    { light: 'night' }
  ] };

  // ───────────────────────── 第 8–14 日：认识这条街 ─────────────────────────

  main.m09_open = { id: 'm09_open', title: '都涨了', day: 9, when: 'open', light: 'dawn', beats: [
    { enter: 'qin', slot: 1 },
    { prop: 'veg', label: '老秦的菜' },
    ['qin', '老周，跟你说个事。米面油都涨了。'],
    ['qin', '我这菜……也得跟着加一成。'],
    { enter: 'hu', slot: 3 },
    ['hu', '加一成？老周，我的冻品不涨，还降。'],
    ['hu', '整箱送到门口，比他便宜三成。'],
    ['n', '老秦没接话，把菜筐往里挪了挪。'],
    { fx: { set: ['s_costup'] } },
    { choice: [
      { label: '换老胡的货', hint: '进货省 50 元',
        fx: { cash: 50, burn: 4, aff: { qin: -2 }, set: ['s_hu_supply'] },
        then: [
          ['hu', '爽快。明早五点，箱子放你门口。'],
          { prop: 'veg', off: true },
          ['n', '老秦把菜筐搬回了三轮车。']
        ] },
      { label: '自己扛着', hint: '进货贵到月中',
        fx: { aff: { qin: 1 }, set: ['s_absorb'] },
        then: [
          ['z', '照旧送。价钱按你说的。'],
          ['qin', '……行。葱我多给一把。'],
          ['hu', '行，你有良心。良心几个钱一斤？']
        ] },
      { label: '跟着涨价', hint: '多进账，客人少',
        fx: { cash: 30, rep: -2, flow: 0.9, aff: { ge: -1 }, set: ['s_raised'] },
        then: [
          ['z', '货照旧。我把价牌改一改。'],
          ['qin', '改吧。都难。'],
          { do: 'tap', label: '把价牌上的数字擦掉' }
        ] }
    ] },
    { exit: 'hu' }, { exit: 'qin' }
  ] };

  main.m12_open = { id: 'm12_open', title: '下回补', day: 12, when: 'open', light: 'rain', beats: [
    { sfx: 'rain' },
    { enter: 'hu', slot: 2 },
    { prop: 'meat', label: '羊肉' },
    ['hu', '这雨一下，就是喝羊肉汤的天。'],
    ['hu', '半扇羊，便宜你三成。今天就能上锅。'],
    ['z', '票呢？'],
    ['hu', '票嘛，下回补。肉你自己看，红的。'],
    { if: { aff: { qin: 3 } },
      then: [
        { enter: 'qin', slot: 0 },
        ['qin', '我认得一家，带检疫章的。贵。']
      ],
      else: [
        ['n', '雨水顺着箱子角往下滴。']
      ] },
    { choice: [
      { label: '收下', hint: '便宜三成',
        fx: { cash: 60, burn: 10, set: ['cheap_mutton'], unlock: 'mutton' },
        then: [
          ['hu', '爽快。'],
          ['n', '箱子拖进后厨，地上一道水印。']
        ] },
      { label: '只要有票的', hint: '多花 40 元',
        fx: { cash: -40, rep: 1, aff: { qin: 1 }, set: ['s_mutton_paper'], unlock: 'mutton' },
        then: [
          ['z', '我要带章的。贵就贵。'],
          ['hu', '行行行，讲究人。箱子我搬走。']
        ] },
      { label: '不做羊肉', hint: '菜单不添新菜',
        fx: { set: ['s_no_mutton'] },
        then: [
          ['z', '羊肉我先不做。'],
          ['hu', '随你。公交站那辆车可要了两箱。']
        ] }
    ] },
    { prop: 'meat', off: true },
    { exit: 'hu' },
    { if: { aff: { qin: 3 } }, then: [{ exit: 'qin' }], else: [] }
  ] };

  // ───────────────────────── 第 15–21 日：选择开始有代价 ─────────────────────────

  main.m15_open = { id: 'm15_open', title: '台账', day: 15, when: 'open', light: 'dawn', beats: [
    { enter: 'inspector', slot: 2 },
    ['inspector', '例行检查。台账、进货单、油，都看一下。'],
    { prop: 'ledger', label: '台账' }, { sfx: 'page' },
    { if: { flags: ['ge_books'] },
      then: [
        ['inspector', '这账谁理的？一笔一笔都对得上。'],
        ['z', '一个老主顾。干过会计。']
      ],
      else: [
        ['inspector', '记得太粗。哪天进的货都没写。'],
        ['z', '……我回头补。'],
        ['inspector', '月底我再来。到时候账要理清。']
      ] },
    { prop: 'oilcan', label: '油桶' },
    { if: { any: [{ burn: [50] }, { oilAge: [4] }] },
      then: [
        ['inspector', '这油几天了？都发黑了。'],
        ['inspector', '开整改单。罚款一百，三天内换油。'],
        { sfx: 'stamp' },
        { fx: { cash: -100, rep: -2, set: ['s_insp_fine'] } },
        ['z', '……我今天就换。']
      ],
      else: [
        { if: { burn: [0, 25], oilAge: [0, 1], flags: ['slip_ever'] },
          then: [
            ['inspector', '油是新的。门口贴的是进货单？'],
            ['inspector', '这条街就你一家贴。合格。'],
            { sfx: 'stamp' },
            { fx: { rep: 3, set: ['s_insp_pass'] } },
            ['z', '嗯。']
          ],
          else: [
            ['inspector', '油还行。再用就该换了。'],
            ['inspector', '这回口头提醒。进货单留好。'],
            { fx: { set: ['s_insp_warn'] } },
            ['z', '行。']
          ] }
      ] },
    { prop: 'oilcan', off: true }, { prop: 'ledger', off: true },
    { exit: 'inspector' }
  ] };

  main.m18_open = { id: 'm18_open', title: '那条视频', day: 18, when: 'open', light: 'dawn', beats: [
    { prop: 'phone', label: '手机' }, { sfx: 'phone' },
    ['n', '手机在柜台上震了一早上。'],
    { enter: 'neighbor', slot: 1 },
    { if: { flags: ['viral_good'] },
      then: [
        ['neighbor', '就是这家。视频里那锅粥。'],
        ['neighbor', '说油三天一换，条子就贴在灶台边。'],
        ['z', '慢点，都有。']
      ],
      else: [
        { if: { flags: ['viral_bad'] },
          then: [
            ['neighbor', '视频里那桶油，是你家的吧？'],
            ['neighbor', '我不买。我就看看。'],
            ['z', '……谁拍的？'],
            ['neighbor', '不知道。号是新的。']
          ],
          else: [
            ['neighbor', '刷到你家了。说是“还行，实在”。'],
            ['z', '谁发的？'],
            ['neighbor', '不知道。号是新的，没几个粉丝。']
          ] }
      ] },
    { choice: [
      { label: '拉开后厨帘子', hint: '后厨随便看',
        fx: { set: ['s_curtain_open'] },
        then: [
          { do: 'hold', label: '按住，拉开帘子' },
          { if: { oilAge: [3] },
            then: [
              ['neighbor', '这油……比视频里的还深。'],
              ['n', '门口有人举起了手机。'],
              { fx: { rep: -4, burn: 5, flow: 0.75 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '咦，今天的油是清的。'],
                  ['neighbor', '那视频里拍的是哪天？'],
                  { fx: { rep: 2, flow: 0.95 } }
                ],
                else: [
                  ['neighbor', '锅、油、米袋，都在明处。'],
                  ['neighbor', '给我来两份。'],
                  { fx: { rep: 3, flow: 1.05 } }
                ] }
            ] }
        ] },
      { label: '贴出进货单', hint: '今天的单子贴门口',
        fx: { set: ['s_slip_day18'] },
        then: [
          { prop: 'slip', label: '进货单' },
          { if: { mat: [0, 0] },
            then: [
              ['neighbor', '冻品，批发的。倒是没瞒着。'],
              { fx: { rep: 1, flow: 0.95 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '今天的是好。前几天的单子呢？'],
                  ['z', '……前几天的没留。'],
                  { fx: { rep: 1, flow: 0.9 } }
                ],
                else: [
                  ['neighbor', '哪家的菜、几点到的，都写着。'],
                  { fx: { rep: 2, flow: 1.1 } }
                ] }
            ] }
        ] },
      { label: '照常做', hint: '不解释，开火',
        fx: {},
        then: [
          { if: { flags: ['viral_good'] },
            then: [
              ['z', '排好队。粥要一锅一锅熬。'],
              ['n', '队排到了隔壁改衣店门口。'],
              { fx: { flow: 1.15 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['z', '开火。'],
                  ['n', '围着的人看了一会儿，散了一半。'],
                  { fx: { rep: -2, flow: 0.8 } }
                ],
                else: [
                  ['z', '开火。'],
                  { fx: { flow: 1.0 } }
                ] }
            ] }
        ] }
    ] },
    { fx: { memento: 'm_video' } },
    { prop: 'phone', off: true },
    { exit: 'neighbor' }
  ] };

  // ───────────────────────── 第 22–28 日：店成了街的一部分 ─────────────────────────

  main.m22_open = { id: 'm22_open', title: '只有这口灶亮着', day: 22, when: 'open', light: 'candle', beats: [
    ['n', '整条街黑着。只有这口煤气灶是亮的。'],
    { prop: 'candle', label: '蜡烛' },
    { if: { aff: { man: 4 } },
      then: [
        { enter: 'man', slot: 0 },
        ['man', '老周，借个火。电饭锅用不了。'],
        ['man', '韭菜鸡蛋的馅。糖糖剁的，剁得粗。']
      ],
      else: [
        { enter: 'neighbor', slot: 0 },
        ['neighbor', '老周，借个火。电饭锅用不了。'],
        ['neighbor', '馅我拌好了，白菜猪肉。']
      ] },
    { if: { aff: { zhao: 3 } }, then: [
      { enter: 'zhao', slot: 1 },
      ['zhao', '豆豆要学包。面我在家和好了。']
    ], else: [] },
    { if: { aff: { ge: 4 } }, then: [
      { enter: 'ge', slot: 2 },
      ['ge', '我擀皮。以前单位里就我擀得圆。']
    ], else: [] },
    { if: { aff: { qin: 3 } }, then: [
      { enter: 'qin', slot: 3 },
      ['qin', '车上还有两棵白菜。不够我再拉。']
    ], else: [] },
    ['z', '案板不够大。卸块门板下来。'],
    { do: 'tap', label: '捏三个褶' },
    { fx: { unlock: 'dumpling', memento: 'm_candle' } },
    { choice: [
      { label: '只收皮钱', hint: '一份少赚一半',
        fx: { cash: -30, rep: 2, flow: 1.2, set: ['s_dumpling_half'] },
        then: [
          ['z', '馅是你们的。我只收皮钱、火钱。']
        ] },
      { label: '今天不收钱', hint: '白忙一个早晨',
        fx: { cash: -80, rep: 3, flow: 1.35, aff: { man: 1, zhao: 1, ge: 1 }, set: ['s_dumpling_free'] },
        then: [
          ['z', '今天这锅不卖。谁来谁吃。'],
          ['n', '烛光里，队排到了桥头。']
        ] },
      { label: '照牌价卖', hint: '一分不少收',
        fx: { cash: 40, rep: -1, set: ['s_dumpling_full'] },
        then: [
          ['z', '饺子照牌价。馅钱我回头算给你们。'],
          ['n', '没人说话。有人把馅盆往回挪了挪。']
        ] }
    ] },
    { sfx: 'sizzle' },
    { if: { aff: { man: 4 } }, then: [{ exit: 'man' }], else: [{ exit: 'neighbor' }] },
    { if: { aff: { zhao: 3 } }, then: [{ exit: 'zhao' }], else: [] },
    { if: { aff: { ge: 4 } }, then: [{ exit: 'ge' }], else: [] },
    { if: { aff: { qin: 3 } }, then: [{ exit: 'qin' }], else: [] }
  ] };

  main.m26_close = { id: 'm26_close', title: '给句话', day: 26, when: 'close', light: 'night', beats: [
    { enter: 'landlord', slot: 2 },
    { prop: 'lease', label: '续租合同' },
    ['landlord', '合同带来了。押金的数你知道。'],
    { if: { flags: ['rent_late'] },
      then: [
        ['landlord', '上回房租你拖了。我没往外说。'],
        ['landlord', '这回押金得一次给齐。']
      ],
      else: [
        { if: { rep: [65] },
          then: [
            ['landlord', '这条街早上有人气，是从你这起的。'],
            ['landlord', '别人出的价高。我没应。']
          ],
          else: [
            ['landlord', '说实话，别人出的价比你高。'],
            ['landlord', '先来后到。我先问你。']
          ] }
      ] },
    ['landlord', '签不签，给句话。'],
    ['n', '老周抬头，看了一眼门头那块白板。'],
    { choice: [
      { label: '签，续租', hint: '付清押金', need: { cash: [1200] },
        fx: { payDeposit: true, set: ['renewed'] },
        then: [
          { prop: 'cash', label: '押金' },
          { sfx: 'stamp' },
          ['landlord', '行。钥匙你留着。'],
          ['z', '嗯。']
        ] },
      { label: '请街坊凑', hint: '差的街坊垫上', need: { affSum: [30] },
        fx: { chipin: true, set: ['chipin'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '一家一家凑的。名字都记在里头。'],
          ['landlord', '……行吧。我点点。'],
          ['z', '我都还。'],
          { exit: 'man' }
        ] },
      { label: '不签了', hint: '月底交钥匙',
        fx: { set: ['left'] },
        then: [
          ['z', '不签了。做到二十八号。'],
          ['landlord', '想好了？……那行。'],
          ['landlord', '钥匙月底给我。灶台不用你拆。']
        ] }
    ] },
    { prop: 'lease', off: true },
    { exit: 'landlord' }
  ] };

  main.m27_open = { id: 'm27_open', title: '最后一班', day: 27, when: 'open', light: 'dawn', beats: [
    ['n', '六点零五。7 路的车灯从桥那头过来。'],
    { if: { aff: { gong: 5 } },
      then: [
        { bus: true }, { sfx: 'horn' },
        ['n', '车没进站，拐了个弯，停在店门口。'],
        { enter: 'gong', slot: 1 },
        { prop: 'mug', label: '搪瓷茶缸' },
        ['gong', '最后一班。我跟调度说了，绕一脚。'],
        ['gong', '一车人都没吃早饭。老周，接客。'],
        ['z', '……一车？'],
        ['gong', '一车。我的照旧，油条炸老的。'],
        { fx: { flow: 1.5, set: ['s_bus_stop'], memento: 'm_ticket' } },
        { exit: 'gong' }
      ],
      else: [
        { sfx: 'horn' },
        ['n', '车照常进站，照常开走。喇叭响了一声。'],
        { enter: 'neighbor', slot: 2 },
        ['neighbor', '听说老龚今天最后一班。'],
        ['z', '嗯。听说了。'],
        { fx: { set: ['s_bus_pass'] } },
        { exit: 'neighbor' }
      ] }
  ] };

  main.m28_close = { id: 'm28_close', title: '第二十八天', day: 28, when: 'close', light: 'dusk', beats: [
    ['z', '第二十八天。'],
    { if: { flags: ['end_HONEST'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '招牌还空着。今天总该写了。'],
      ['z', '写什么？'],
      ['best', '街上背地里早那么叫了。不烧心。'],
      { do: 'tap', label: '提笔，往白板上写' },
      ['z', '……字丑。'],
      { exit: 'best' }
    ], else: [] },
    { if: { flags: ['end_CANTEEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天几点开？我来帮你摆凳子。'],
      ['z', '五点半。'],
      ['best', '招牌我们商量过了。你别嫌土。'],
      ['n', '白板上是粉笔字，好几个人的笔迹。'],
      ['z', '……行。就这个。'],
      { exit: 'best' }
    ], else: [] },
    { if: { flags: ['end_PRIVATE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '下周三，老位子，给我留着。'],
      { prop: 'notebook', label: '小本子' },
      ['z', '记了。'],
      ['n', '本子上的名字，他都叫得出来。'],
      ['z', '招牌写小点。认得的人认得就行。'],
      { exit: 'best' }
    ], else: [] },
    { if: { flags: ['end_REOPEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '漆味还没散。'],
      ['z', '昨晚刷的。'],
      ['best', '字没干透，你就敢挂。'],
      ['z', '挂上去。我自己天天看得见。'],
      { exit: 'best' }
    ], else: [] },
    { if: { flags: ['end_PILLS'] }, then: [
      { prop: 'pills', label: '胃药' },
      ['n', '收银台上，胃药压着一沓账单。'],
      ['z', '招牌……就写周记早点吧。'],
      ['z', '别的字，写不上去。'],
      ['n', '头班车进站，没人下车往这边走。']
    ], else: [] },
    { if: { flags: ['end_FAREWELL'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '听说你不签了。大家凑了个主意。'],
      ['n', '白板摘了下来，背面朝上摆在柜台上。'],
      ['best', '正面留给下一家。背面我们签了。'],
      ['z', '……这个我得带走。'],
      { exit: 'best' }
    ], else: [] },
    { if: { flags: ['end_TRANSFER'] }, then: [
      { enter: 'landlord', slot: 2 },
      { prop: 'keys', label: '钥匙' },
      ['landlord', '接手的人明天来看灶台。'],
      ['z', '锅是何姨的。跟他说，别用洗洁精。'],
      ['landlord', '招牌一个字没写，倒省得铲了。'],
      ['z', '嗯。'],
      { exit: 'landlord' }
    ], else: [] },
    { if: { flags: ['end_SOMEONE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天还开吧？'],
      ['z', '开。'],
      ['best', '那招牌呢？空了一个月了。'],
      ['z', '先写两个字。小馆。前头的再想想。'],
      { exit: 'best' }
    ], else: [] },
    { light: 'night' },
    { do: 'hold', label: '按住，拉下卷帘门' },
    { shutter: 'down' }, { sfx: 'shutter' }
  ] };

  // ───────────────────────── 任意日 ─────────────────────────

  main.crisis = { id: 'crisis', title: '找上门', when: 'close', light: 'night', beats: [
    { sfx: 'knock' },
    { enter: 'neighbor', slot: 1 },
    { enter: 'song', slot: 2 },
    ['neighbor', '我爸昨天在你这吃的。夜里吐了两回。'],
    ['song', '挂的我们科急诊。我陪他们来的。'],
    { prop: 'paper', label: '病历' },
    ['song', '周叔，这礼拜第三个了。'],
    ['song', '是不是你这的事，我说不准。'],
    ['song', '可人家都问到我这了。'],
    ['neighbor', '我不是来闹的。你给个说法。'],
    { choice: [
      { label: '停业整改', hint: '花 400 元，停一天',
        fx: { set: ['crisis_rectify'] },
        then: [
          ['z', '明天不开门。油、锅、料，全换。'],
          { prop: 'paper', label: '停业整改' },
          ['song', '条子我帮你写。贴门上。']
        ] },
      { label: '逐个退赔', hint: '退赔 260 元',
        fx: { set: ['crisis_refund'] },
        then: [
          { prop: 'cash', label: '零钱盒里的钱' },
          ['z', '药费我出。这礼拜吃过的，都退。'],
          ['neighbor', '……行。我等你电话。']
        ] },
      { label: '硬撑', hint: '明天照常开门',
        fx: { set: ['crisis_hold'] },
        then: [
          ['z', '我的粥我自己天天喝。没事。'],
          ['song', '周叔。'],
          ['n', '她没再说下去，扶着人走了。']
        ] }
    ] },
    { exit: 'neighbor' }, { exit: 'song' }
  ] };

  main.rescue = { id: 'rescue', title: '零钱盒', when: 'open', light: 'dawn', beats: [
    { enter: 'landlord', slot: 2 },
    ['landlord', '老周，零钱盒给我看一眼。'],
    ['n', '盒子里是几个硬币，和一张进货欠条。'],
    ['landlord', '两天了。明天的货你拿什么进？'],
    ['landlord', '我不是催租。我怕你明天开不了门。'],
    { choice: [
      { label: '卖一件设备', hint: '到手 300 元',
        fx: { set: ['s_sold'] },
        then: [
          ['landlord', '收旧货的我认识。下午来拉。'],
          ['z', '嗯。能卖的，先卖一件。']
        ] },
      { label: '向小满借', hint: '到手 250 元，要还', need: { aff: { man: 3 } },
        fx: { set: ['s_borrow'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '钱在里头。别打条子，我记性好。'],
          ['z', '我还。'],
          { exit: 'man' }
        ] },
      { label: '再撑一天', hint: '今天少备点货',
        fx: { flow: 0.85, set: ['s_refuse'] },
        then: [
          ['z', '再撑一天。今天少备点。'],
          ['landlord', '行。明天我还来。']
        ] }
    ] },
    { exit: 'landlord' }
  ] };

  // ───────────────────────── 事件 ─────────────────────────

  var powderLater = { days: 3, fx: { set: ['e_powder_due'] }, note: '这两天总有人问：粥是不是换了做法。' };

  var events = [

    { id: 'e_powder', title: '增香粉', when: 'open', need: { day: [4, 9] }, weight: 1.3, once: true, cool: 5, beats: [
      { enter: 'powder', slot: 2 },
      { prop: 'powder', label: '增香粉' },
      ['powder', '老板，撒一勺，香得半条街都闻得到。'],
      ['z', '袋子上怎么没字？'],
      ['powder', '厂里直接出的，省了包装钱。'],
      ['powder', '公交站那辆早餐车，用了一礼拜了。'],
      { choice: [
        { label: '推回去', hint: '香不过早餐车',
          fx: { flowNext: 0.95 },
          then: [
            ['z', '不要。拿走。'],
            ['powder', '行。等你门口没人了，再找我。']
          ] },
        { label: '试一次', hint: '10 元一包，更香',
          fx: { cash: -10, burn: 8, flow: 1.15, set: ['powder_used'], later: powderLater },
          then: [
            ['powder', '一勺就够。多了发苦。'],
            ['n', '老周把小包塞进了围裙兜。']
          ] },
        { label: '用了别声张', hint: '30 元一袋，客更多',
          fx: { cash: -30, burn: 18, flow: 1.25, set: ['powder_used', 'powder_hidden'], later: powderLater },
          then: [
            ['powder', '懂行。谁问，都说是新米。'],
            ['z', '……嗯。']
          ] }
      ] },
      { prop: 'powder', off: true },
      { exit: 'powder' }
    ] },

    { id: 'e_powder_after', title: '香得不对', when: 'close', need: { flags: ['powder_used', 'e_powder_due'] }, weight: 3, once: true, cool: 3, beats: [
      { enter: 'kid', slot: 1 },
      ['kid', '老板，你家粥是不是换配方了？'],
      ['kid', '我同桌说，喝完一上午口干。'],
      { exit: 'kid' },
      { enter: 'song', slot: 2 },
      ['song', '周叔，我也想问。这几天的粥香得不对。'],
      ['song', '米香不是这个香法。'],
      { choice: [
        { label: '认了', hint: '剩的半袋扔掉',
          fx: { burn: -10, rep: -1, aff: { song: 1 }, clear: ['powder_hidden'], set: ['e_powder_admit'] },
          then: [
            { prop: 'powder', label: '增香粉' },
            ['z', '加了东西。就这袋。我扔了。'],
            { prop: 'powder', off: true },
            ['song', '嗯。我就当没闻见过。']
          ] },
        { label: '说是新米', hint: '这事就过去了',
          fx: { burn: 6, aff: { song: -2 }, set: ['powder_hidden', 'e_powder_deny'] },
          then: [
            ['z', '换了新米。东北的。'],
            ['song', '……哦。'],
            ['n', '她把粥钱放下，没等找零。']
          ] }
      ] },
      { exit: 'song' }
    ] },

    { id: 'e_recycler', title: '没挂牌的三轮', when: 'close', need: { day: [5], oilAge: [2] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'recycler', slot: 2 },
      { prop: 'oilcan', label: '废油' },
      ['recycler', '老板，废油有吧？我出四十一桶。'],
      ['z', '回收站的车才给十块。'],
      ['recycler', '所以找我嘛。现钱。'],
      ['z', '拉哪去？'],
      ['recycler', '这你就别问了。'],
      ['n', '门口停着一辆没挂牌的三轮。'],
      { choice: [
        { label: '等回收站的车', hint: '到手 10 元，有收据',
          fx: { cash: 10, burn: -2, set: ['e_oil_legal'] },
          then: [
            ['z', '不卖。我等回收站的车。'],
            ['recycler', '十块钱的命。']
          ] },
        { label: '卖给他', hint: '到手 40 元',
          fx: { cash: 40, burn: 8, set: ['e_oil_sold'] },
          then: [
            { sfx: 'coin' },
            ['recycler', '爽快。下回还找你。'],
            ['n', '桶搬上了三轮，盖子没拧紧。']
          ] }
      ] },
      { prop: 'oilcan', off: true },
      { exit: 'recycler' }
    ] },

    { id: 'e_helper', title: '招人吗', when: 'close', need: { day: [6], not: ['helper'] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['guifen', '老板，招人吗？'],
      ['guifen', '我包子包得快。洗碗、收钱也行。'],
      ['z', '工钱我给不了多少。'],
      ['guifen', '一天三十五。五点到，收了摊就走。'],
      ['guifen', '下午我得回去，家里离不了人。'],
      { choice: [
        { label: '明早来吧', hint: '每天工钱 35 元',
          fx: { helper: true, set: ['e_guifen_hired'] },
          then: [
            ['z', '明早五点。围裙我这有。'],
            ['guifen', '哎。我自己带了。']
          ] },
        { label: '再等等', hint: '还是一个人忙',
          fx: { set: ['e_guifen_wait'] },
          then: [
            ['z', '再等等。眼下我一个人转得开。'],
            { prop: 'paper', label: '电话号码' },
            ['guifen', '那我留个电话。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },

    { id: 'e_helper_take', title: '保温桶', when: 'close', need: { helper: true, day: [10] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['n', '桂芬的布袋鼓着，露出半个保温桶盖。'],
      ['z', '桂芬。'],
      ['guifen', '……是剩的粥。锅底那点。'],
      ['guifen', '我想着反正要倒。'],
      { choice: [
        { label: '先问问', hint: '每天少卖一碗粥',
          fx: { cash: -10, rep: 1, set: ['e_guifen_trust'] },
          then: [
            ['z', '带给谁的？'],
            ['guifen', '我婆婆。躺两年了，只咽得下稀的。'],
            ['z', '往后别等锅底。头一锅先给她盛。']
          ] },
        { label: '扣一天工钱', hint: '省下 35 元',
          fx: { cash: 35, rep: -1, set: ['e_guifen_docked'],
            later: { days: 3, fx: { rep: -1 }, note: '后来才听说，那粥是带给她卧床的婆婆的。' } },
          then: [
            ['z', '规矩是规矩。今天工钱不算。'],
            ['guifen', '……哎。'],
            ['n', '她把保温桶里的粥倒回了锅里。']
          ] },
        { label: '让她别来了', hint: '明天起一个人',
          fx: { helper: false, rep: -1, set: ['e_guifen_fired'],
            later: { days: 2, fx: { rep: -1 }, note: '小满说，桂芬家里有个卧床的婆婆。' } },
          then: [
            ['z', '明天不用来了。工钱结到今天。'],
            ['guifen', '行。围裙我洗了再还。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },

    { id: 'e_peer', title: '豆浆一块', when: 'open', need: { day: [10] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'peer', slot: 2 },
      { prop: 'paper', label: '传单' },
      ['peer', '周老板，打个招呼。我车停公交站。'],
      ['peer', '豆浆一块，油条买一送一。卖一礼拜。'],
      ['z', '一块？豆子钱都不够。'],
      ['peer', '先把人拢过来嘛。混口饭，别见怪。'],
      ['n', '老葛站在街对面，看看传单，又看看这边。'],
      { choice: [
        { label: '跟着降价', hint: '今天少赚 40 元',
          fx: { cash: -40, flow: 1.15, set: ['e_peer_follow'] },
          then: [
            ['z', '豆浆今天也一块。'],
            ['peer', '嚯。那就看谁撑得久。']
          ] },
        { label: '加量不加价', hint: '多搭料 25 元',
          fx: { cash: -25, rep: 2, aff: { ge: 1 }, set: ['e_peer_more'] },
          then: [
            ['z', '价不动。粥盛满，油条炸大一号。'],
            ['peer', '行，各做各的。']
          ] },
        { label: '不跟', hint: '今天客人少一成半',
          fx: { flow: 0.85, set: ['e_peer_hold'] },
          then: [
            ['z', '我不跟。'],
            ['peer', '那老主顾走了，可别怪我。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'peer' }
    ] },

    { id: 'e_vlogger', title: '免单换视频', when: 'open', need: { day: [9], rep: [55] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'vlogger', slot: 2 },
      { prop: 'phone', label: '手机支架' },
      ['vlogger', '老板，我粉丝两万。这条街先拍你家。'],
      ['vlogger', '一套免单，我出条视频，带定位。'],
      ['z', '吃了好就说好。不好呢？'],
      ['vlogger', '免了单，自然是好嘛。'],
      { choice: [
        { label: '免单', hint: '送出一套 30 元',
          fx: { cash: -30, flow: 1.15, set: ['e_vlog_free'],
            later: { days: 2, fx: { rep: 2, burn: 2 }, note: '那条探店视频里，粥冒着热气。夸得有点过。' } },
          then: [
            ['z', '行。坐。'],
            ['vlogger', '老板上道。来，笑一个。']
          ] },
        { label: '照价收钱', hint: '他不一定发',
          fx: { rep: 1, set: ['e_vlog_paid'] },
          then: [
            ['z', '该多少是多少。拍随你拍。'],
            ['vlogger', '……行吧。来碗粥。'],
            ['n', '他付了钱，吃完点点头，没举手机。']
          ] },
        { label: '请他走', hint: '少一次露脸',
          fx: { rep: -1, aff: { zheng: 1 }, set: ['e_vlog_refuse'] },
          then: [
            ['z', '不拍。后头有人等着买。'],
            ['vlogger', '这条街又不止你一家。'],
            ['n', '小郑在队尾，往本子上记了一行。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'vlogger' }
    ] },

    { id: 'e_aunty', title: '三十份', when: 'open', need: { day: [7] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'aunty', slot: 2 },
      { prop: 'paper', label: '接龙名单' },
      ['aunty', '老周，我们小区群里接龙，要三十份。'],
      ['aunty', '粥加油条。明早七点前送到门卫室。'],
      ['aunty', '量大，你给打个七折。'],
      ['z', '七点前……正是我门口人最多的时候。'],
      ['aunty', '所以才找你商量嘛。'],
      { choice: [
        { label: '三十份全接', hint: '明天进账 90 元',
          fx: { flowNext: 0.8, set: ['e_group_all'],
            later: { days: 1, fx: { cash: 90, rep: -1 }, note: '三十份七点前送到了。门口有人等不及，走了。' } },
          then: [
            ['z', '接。我四点起来熬。'],
            ['aunty', '爽快。货到了我转你。']
          ] },
        { label: '接十五份', hint: '明天进账 45 元',
          fx: { flowNext: 0.92, set: ['e_group_half'],
            later: { days: 1, fx: { cash: 45 }, note: '十五份送到了。刘姐说，下回还是要三十。' } },
          then: [
            ['z', '十五份。再多，门口的人要等。'],
            ['aunty', '行吧。剩下的我找公交站那辆车。']
          ] },
        { label: '不接', hint: '散客照常',
          fx: { aff: { gong: 1 }, set: ['e_group_no'] },
          then: [
            ['z', '接不了。六点零五有人赶头班车。'],
            ['aunty', '一个司机顶我三十份？行，你有原则。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'aunty' }
    ] },

    { id: 'e_tv', title: '老街的早晨', when: 'open', need: { day: [11] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'tv', slot: 2 },
      ['tv', '师傅，我们台拍“老街的早晨”。'],
      ['tv', '等下客人来了，能不能笑得开心点？'],
      ['tv', '您再端碗粥，说句“几十年老味道”。'],
      ['z', '我开了才十来天。'],
      ['tv', '观众看不出来的。'],
      { choice: [
        { label: '照常做', hint: '拍到什么算什么',
          fx: { rep: 2, set: ['e_tv_plain'] },
          then: [
            ['z', '你们拍你们的。词我不会说。'],
            ['n', '后来播出的镜头里，赵爷爷在低头数硬币。']
          ] },
        { label: '摆拍一回', hint: '今天客流多一成',
          fx: { flow: 1.12, rep: 1, burn: 3, set: ['e_tv_staged'] },
          then: [
            ['z', '几、几十年老味道。'],
            ['tv', '好！再来一条，笑自然点。']
          ] },
        { label: '不拍', hint: '机器转去别家',
          fx: { flow: 0.95, set: ['e_tv_no'] },
          then: [
            ['z', '不拍了。机器挡着人排队。'],
            ['tv', '行。那我们去公交站那辆车。']
          ] }
      ] },
      { exit: 'tv' }
    ] },

    { id: 'e_water', title: '水黄了', when: 'open', need: { day: [12] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'gong', slot: 1 },
      { prop: 'mug', label: '茶缸' },
      ['gong', '老周，你这水不对。'],
      ['gong', '我缸子里接的，茶没泡，先黄了。'],
      { sfx: 'pour' },
      ['n', '水龙头拧开，流出来的水带着锈色。'],
      ['gong', '准是桥头又挖管子。说下午才修。'],
      ['z', '粥还没下米。'],
      { choice: [
        { label: '买桶装水', hint: '花 40 元',
          fx: { cash: -40, rep: 1, set: ['e_water_buy'] },
          then: [
            ['z', '我去街口扛几桶。'],
            ['gong', '头班车不等人。茶我回来再泡。']
          ] },
        { label: '不做汤水', hint: '只卖干的，客人少',
          fx: { flow: 0.75, rep: 1, set: ['e_water_stop'] },
          then: [
            { prop: 'paper', label: '今日无粥' },
            ['z', '粥和豆浆今天不做。写张条子。'],
            ['gong', '那我干啃油条。行。']
          ] },
        { label: '烧开了照用', hint: '不花钱，照常卖',
          fx: { burn: 10, set: ['e_water_used'] },
          then: [
            ['z', '烧开了一样的。'],
            ['gong', '……我今天喝自己带的。']
          ] }
      ] },
      { prop: 'mug', off: true },
      { exit: 'gong' }
    ] },

    { id: 'e_leftover', title: '剩下的', when: 'close', need: { day: [3, 8] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'qin', slot: 2 },
      ['n', '锅里剩两碗粥。筐里四根油条，凉了。'],
      ['qin', '剩了？'],
      ['z', '头几天，备多了。'],
      ['qin', '何姨那会儿，剩的都留给巷口老两口。'],
      ['qin', '收废品的。天天这个点路过。'],
      ['z', '我晚饭还没着落。'],
      { choice: [
        { label: '留给老两口', hint: '晚饭另买，8 元',
          fx: { cash: -8, set: ['e_leftover_give'],
            later: { days: 2, fx: { rep: 1 }, note: '巷口老两口把你门前的纸箱捆走了，没要钱。' } },
          then: [
            { do: 'tap', label: '装袋，挂在门把上' },
            ['qin', '他们不进门。挂外头就行。']
          ] },
        { label: '自己当晚饭', hint: '省一顿饭钱',
          fx: { set: ['e_leftover_self'] },
          then: [
            ['z', '我自己吃。省一顿。'],
            ['n', '凉油条泡粥。吃完他摸了摸兜里的药。']
          ] }
      ] },
      { exit: 'qin' }
    ] },

    { id: 'e_gas', title: '检修通知', when: 'open', need: { day: [6] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'landlord', slot: 2 },
      { prop: 'paper', label: '检修通知' },
      ['landlord', '老周，门上的通知你没看？'],
      ['landlord', '燃气检修，七点到八点半。灶不能开。'],
      ['z', '那正是我卖得最好的时候。'],
      ['landlord', '跟我说没用。人家带着表来的。'],
      { choice: [
        { label: '等修完再开', hint: '只卖半个早晨',
          fx: { shift: 0.6, rep: 1, set: ['e_gas_wait'] },
          then: [
            ['z', '八点半再开火。'],
            ['landlord', '行。我让他们先弄你这段。']
          ] },
        { label: '赶在七点前卖', hint: '早开早收',
          fx: { shift: 0.75, flow: 1.1, set: ['e_gas_early'] },
          then: [
            ['z', '我现在就开。卖到七点。'],
            ['landlord', '那你手脚快点。']
          ] },
        { label: '照常开火', hint: '整个早晨照卖',
          fx: { burn: 8, set: ['e_gas_risk'],
            later: { days: 1, fx: { rep: -2 }, note: '有人看见，检修那阵你家灶还开着。' } },
          then: [
            ['z', '我把火关小点。'],
            ['landlord', '……我可什么都没听见。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'landlord' }
    ] },

    { id: 'e_rain_takeout', title: '十一单', when: 'open', light: 'rain', need: { weather: 'rain', day: [3] }, weight: 1.5, once: false, cool: 6, beats: [
      { sfx: 'rain' },
      { enter: 'ali', slot: 2 },
      { prop: 'phone', label: '外卖单' },
      ['ali', '周叔，下雨了，单子爆了。'],
      ['ali', '光你这一家，我手上挂了十一单。'],
      ['n', '门口，几个老人正在收伞。'],
      ['ali', '全接，我来回跑。就是堂食得等。'],
      { choice: [
        { label: '全接', hint: '今天客流多三成',
          fx: { flow: 1.3, rep: -1, aff: { ali: 1 } },
          then: [
            ['z', '接。你慢点骑。'],
            ['ali', '慢了扣钱。走了！']
          ] },
        { label: '接一半', hint: '今天客流多一成',
          fx: { flow: 1.12 },
          then: [
            ['z', '接六单。别的你推了。'],
            ['ali', '行。六单也够我跑的。']
          ] },
        { label: '只做堂食', hint: '外卖今天不接',
          fx: { flow: 0.92, rep: 1, aff: { zhao: 1, ali: -1 } },
          then: [
            ['z', '今天不接。门口都是老人。'],
            ['ali', '……行吧。那我去别家等单。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'ali' }
    ] },

    { id: 'e_move', title: '最后一碗', when: 'close', need: { day: [14] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 2 },
      ['neighbor', '老周，来碗白粥。最后一碗了。'],
      ['z', '王阿姨，这是要出门？'],
      ['neighbor', '搬去儿子那。车在桥头等着。'],
      ['neighbor', '这个门脸的早饭，我吃了十一年。'],
      ['neighbor', '何姨的粥，后来是你的。差得不多。'],
      { sfx: 'pour' },
      { choice: [
        { label: '这碗不收钱', hint: '白送一碗粥',
          fx: { cash: -3, rep: 2, set: ['e_move_free'] },
          then: [
            ['z', '这碗算我的。'],
            ['neighbor', '那不行……唉，行。我记着。']
          ] },
        { label: '照常收钱', hint: '照牌价收',
          fx: { cash: 3, set: ['e_move_paid'] },
          then: [
            { sfx: 'coin' },
            ['neighbor', '给。规矩是规矩。'],
            ['n', '零钱是数好的，一个钢镚不差。']
          ] },
        { label: '抄一页粥谱', hint: '何姨的方子给她',
          fx: { rep: 1, set: ['e_move_recipe'] },
          then: [
            { prop: 'paper', label: '粥谱一页' },
            ['z', '何姨的方子。抄了一页，你带上。'],
            ['neighbor', '那边的米不一样。我试试。']
          ] }
      ] },
      { exit: 'neighbor' }
    ] },

    { id: 'e_complaint', title: '评论三百条', when: 'open', need: { day: [13], burn: [35] }, weight: 1.4, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 1 },
      { prop: 'phone', label: '投诉视频' },
      ['neighbor', '老周，你看看这个。昨晚发的。'],
      ['neighbor', '说在柳河街吃了早饭，烧心一上午。'],
      ['neighbor', '没点名。可评论里有人认出你家门头。'],
      ['z', '……'],
      ['neighbor', '三百多条评论了。你说句话不？'],
      { choice: [
        { label: '公开回应', hint: '今天客人少一成',
          fx: { burn: -12, rep: -2, flow: 0.9, aff: { zheng: 1 }, set: ['e_complaint_public'] },
          then: [
            ['z', '我回。哪天的油、哪家的料，照实写。'],
            ['neighbor', '照实写？那可不好看。']
          ] },
        { label: '私下退钱', hint: '退赔 30 元',
          fx: { cash: -30, burn: -6, set: ['e_complaint_refund'] },
          then: [
            ['z', '帮我问问是谁。钱我退，药我买。'],
            ['neighbor', '行。他删不删，我可不敢保。']
          ] },
        { label: '不理', hint: '今天照常开门',
          fx: { rep: -3, burn: 4, flow: 0.88, set: ['e_complaint_ignore'] },
          then: [
            ['z', '没点名。我回了，反倒是认了。'],
            ['n', '视频底下的评论，到中午过了五百。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'neighbor' }
    ] }
  ];

  return { main: main, events: events };
});
