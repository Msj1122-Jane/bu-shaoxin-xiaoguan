// 主线场景（14 场）＋ 事件（15 场）。格式见 docs/CONTENT_SPEC.md §7，腔调见 docs/VOICE.md。
// 每句 ≤ 40 字；旁白 n 是老周的第一人称内心话，每条路径 ≤ 4 句；主线每条路径 ≤ 18 句，事件 ≤ 14 句。
// 'z' 老周 · 'n' 旁白 · 'best' 好感最高的常客（引擎解析）。
BSX.define('content/scenes', function () {
  var main = {};

  // ───────────────────────── 第 1–7 日：先把门开着 ─────────────────────────

  main.m01_open = { id: 'm01_open', title: '开门', day: 1, when: 'open', light: 'dawn', beats: [
    ['n', '五点半。柳河街黑着，就我这扇门底下漏一条光。'],
    { do: 'hold', label: '按住，拉起卷帘门' },
    { shutter: 'up' }, { sfx: 'shutter' },
    ['z', '十平米。转个身，胳膊肘就碰到灶。'],
    ['n', '补偿金盘下来的。兜里剩七百，够我错一个月。'],
    ['n', '招牌是块白板。笔我买了，没敢往上落。'],
    { enter: 'zhao', slot: 1 },
    ['zhao', '哟，这扇门又响了！我还当它要一直关起。'],
    ['z', '头一天，手生。您老多担待。'],
    ['zhao', '门头咋个是白的？开店嘛，总要有个名字。'],
    ['z', '没想好。怕起大了，撑不起。'],
    ['zhao', '那不急。粥先熬起，名字是吃出来的。'],
    ['zhao', '看你拿勺那个手，不像厨子。以前做啥子的？'],
    ['z', '厂里管食堂后勤。管了二十年油盐米面，没掌过勺。'],
    ['zhao', '管食堂的出来卖早饭……要得，要得。'],
    ['zhao', '六点四十，我带孙子来。他嘴刁，你莫怪。'],
    ['z', '六点四十。头一锅粥给您留着。'],
    { exit: 'zhao' },
    { sfx: 'bell' }
  ] };

  main.m01_close = { id: 'm01_close', title: '抽屉里的条子', day: 1, when: 'close', light: 'dusk', beats: [
    ['n', '头一天收摊。零钱盒端起来，比我想的轻。'],
    { do: 'tap', label: '拉开柜台下的抽屉' },
    { sfx: 'page' },
    { prop: 'paper', label: '何姨的条子' },
    ['n', '抽屉里一张条子，压着一本手写的粥谱。'],
    ['z', '“油三天一换，别省。省下来的都要还。”'],
    ['z', '……前头那位何姨留的。字写得凶。'],
    { prop: 'notebook', label: '粥谱' },
    ['z', '“米一水十二，冬天一比十。先泡米，小火。”'],
    ['z', '“顺一个方向搅，莫偷懒。”……连这个都写了。'],
    ['n', '厂里那锅油用到第几天，哪个本子上都不写。我晓得。'],
    { fx: { memento: 'm_heyi_note' } },
    { fx: { memento: 'm_recipe' } },
    { do: 'tap', label: '把条子贴在灶台边' },
    { prop: 'paper', off: true },
    ['z', '贴这儿。炸油条一抬头就看得见。'],
    ['n', '胃又顶了一下。药在兜里，我没去摸。'],
    { light: 'night' }
  ] };

  main.m02_close = { id: 'm02_close', title: '老煎锅', day: 2, when: 'close', light: 'dusk', beats: [
    ['n', '灶台底下有个铁家伙，旧报纸包了好几层。'],
    { do: 'hold', label: '按住，把它拖出来' },
    { sfx: 'knock' },
    ['z', '一口煎锅。沉得很，锅底黑得发亮。'],
    { enter: 'qin', slot: 2 },
    ['qin', '哦，这口锅还在。'],
    ['qin', '何姨拿它烙葱油饼。煎蛋也不粘。'],
    ['z', '我没烙过饼。在厂里，我只管签字领面粉。'],
    ['qin', '粥谱后头几页有。她啥子都写了的。'],
    ['qin', '头一回先拿油养一哈。莫用洗洁精，伤锅。'],
    ['z', '养锅要多少油？我怕手重了。'],
    ['qin', '一勺。抹匀，小火烤干。跟养地一样，急不得。'],
    { sfx: 'sizzle' },
    { fx: { unlock: 'scallion' } },
    { fx: { unlock: 'egg' } },
    ['n', '油抹上去，锅“吱”了一声。它比我熟这间铺子。'],
    ['qin', '明早的葱，我多放一把。莫给钱。'],
    ['z', '那不行。该多少是多少。'],
    ['qin', '……那你烙出来，给我留一张。'],
    { exit: 'qin' }
  ] };

  main.m07_close = { id: 'm07_close', title: '七天一交', day: 7, when: 'close', light: 'dusk', beats: [
    { enter: 'landlord', slot: 2 },
    { prop: 'keys', label: '一串钥匙' },
    ['landlord', '老周，今天第七天。我是路过，不是来催你。'],
    ['landlord', '……好嘛，是来催你。二百四，七天一交。'],
    ['z', '晓得。盒子里的钱，我数过两遍了。'],
    ['landlord', '数两遍它也不得多一张。晚上账上扣。'],
    { prop: 'lease', label: '短租合同' },
    ['landlord', '说正事。短租二十八号到头，要续，押金一千二。'],
    ['landlord', '二十六号晚上我来，你给句话。我也有房贷嘛。'],
    { if: { rep: [60] },
      then: [
        ['landlord', '你门口这几天排队，我在楼上打望到了的。'],
        ['landlord', '有人来问这个门脸，出价不低。我先没应。']
      ],
      else: [
        { if: { cash: [-100000, 150] },
          then: [
            ['landlord', '零钱盒我不看也晓得。撑不住就早点说。'],
            ['landlord', '莫拖到月底，两个人都恼火。']
          ],
          else: [
            ['landlord', '生意嘛，不咸不淡。你自己掂量。']
          ] }
      ] },
    ['landlord', '我就搞不懂，你一个吃公家饭的，咋个想起卖早饭？'],
    ['z', '……锅还没刷。汪姐，合同我收到了。'],
    { exit: 'landlord' },
    { prop: 'keys', off: true },
    { do: 'tap', label: '把合同压在账本底下' },
    { prop: 'lease', off: true }, { sfx: 'page' },
    { fx: { memento: 'm_lease' } },
    ['n', '厂里食堂的饭，我吃了二十年。胃是那时候吃坏的。'],
    ['n', '油是我签字领的。哪一锅早该倒了，我比谁都清楚。'],
    ['z', '还有二十一天。'],
    { light: 'night' }
  ] };

  // ───────────────────────── 第 8–14 日：认识这条街 ─────────────────────────

  main.m09_open = { id: 'm09_open', title: '都涨了', day: 9, when: 'open', light: 'dawn', beats: [
    { enter: 'qin', slot: 1 },
    { prop: 'veg', label: '老秦的菜' },
    ['qin', '老周，跟你说个事。米面油，这两天都涨了。'],
    ['qin', '我这菜……也得加一成。我不好开这个口。'],
    ['z', '一成是多少？你报个数，我好算。'],
    { enter: 'hu', slot: 3 },
    ['hu', '加一成？哎哟老哥，莫算了，听兄弟一句。'],
    ['hu', '我的冻品不涨，还降。整箱送到门口，便宜三成。'],
    ['z', '冻了多久的？'],
    ['hu', '冻起的东西哪个问日子嘛。煮透了一个味。'],
    ['n', '老秦没接话，把菜筐往里挪了挪。我看见了。'],
    { fx: { set: ['s_costup'] } },
    { choice: [
      { label: '换老胡的货', hint: '进货省 50 元',
        fx: { cash: 50, burn: 4, aff: { qin: -2 }, set: ['s_hu_supply'] },
        then: [
          ['hu', '爽快！明早五点，箱子码到你门口。'],
          { prop: 'veg', off: true },
          ['n', '老秦把菜筐搬回了三轮车。我没好意思去搭手。']
        ] },
      { label: '自己扛着', hint: '进货贵到月中',
        fx: { aff: { qin: 1 }, set: ['s_absorb'] },
        then: [
          ['z', '照旧送。价钱按你说的，一成就一成。'],
          ['qin', '……要得。葱我多放一把。'],
          ['hu', '老哥有良心。良心几个钱一斤嘛？'],
          ['z', '不晓得。我也想晓得。']
        ] },
      { label: '跟着涨价', hint: '多进账，客人少',
        fx: { cash: 30, rep: -2, flow: 0.9, aff: { ge: -1 }, set: ['s_raised'] },
        then: [
          ['z', '货照旧。价牌我改一下，各涨五毛。'],
          ['qin', '改嘛。都恼火。'],
          { do: 'tap', label: '把价牌上的数字擦掉' },
          ['n', '粉笔灰落在手背上。五毛，老葛是要皱眉头的。']
        ] }
    ] },
    { exit: 'hu' }, { exit: 'qin' }
  ] };

  main.m12_open = { id: 'm12_open', title: '下回补', day: 12, when: 'open', light: 'rain', beats: [
    { sfx: 'rain' },
    { enter: 'hu', slot: 2 },
    { prop: 'meat', label: '羊肉' },
    ['hu', '老哥！这雨一下，就是喝羊肉汤的天。'],
    ['hu', '半扇羊，便宜你三成。今天就能上锅，一碗卖十六。'],
    ['z', '票呢？检疫的章盖在哪儿？'],
    ['hu', '票嘛，下回补。肉你自己看噻，红的。'],
    ['n', '“下回补”。这三个字，我在厂里听了二十年。'],
    ['n', '补没补过，签字的人最清楚。签字的是我。'],
    { if: { aff: { qin: 3 } },
      then: [
        { enter: 'qin', slot: 0 },
        ['qin', '我认得一家，带检疫章的。贵，贵一截。'],
        ['hu', '老秦，你卖你的葱嘛。']
      ],
      else: [
        ['n', '雨水顺着箱子角往下滴，滴在我鞋面上。']
      ] },
    { choice: [
      { label: '收下', hint: '便宜三成',
        fx: { cash: 60, burn: 10, set: ['cheap_mutton'], unlock: 'mutton' },
        then: [
          ['hu', '爽快！兄弟就晓得你是明白人。'],
          ['z', '……票记得补。'],
          ['hu', '补，补。下回嘛。'],
          ['n', '箱子拖进后厨，地上一道水印。我拿拖把抹了。']
        ] },
      { label: '只要有票的', hint: '多花 40 元',
        fx: { cash: -40, rep: 1, aff: { qin: 1 }, set: ['s_mutton_paper'], unlock: 'mutton' },
        then: [
          ['z', '我要带章的。贵就贵，四十我认。'],
          ['hu', '行行行，讲究人。箱子我搬走，莫后悔哈。'],
          ['z', '后悔了我自己吃药。']
        ] },
      { label: '不做羊肉', hint: '菜单不添新菜',
        fx: { set: ['s_no_mutton'] },
        then: [
          ['z', '羊肉我先不做。粥我都还没熬明白。'],
          ['hu', '随你。公交站那辆车，一口气要了两箱。']
        ] }
    ] },
    { prop: 'meat', off: true },
    { exit: 'hu' },
    { if: { aff: { qin: 3 } }, then: [{ exit: 'qin' }], else: [] }
  ] };

  // ───────────────────────── 第 15–21 日：选择开始有代价 ─────────────────────────

  main.m15_open = { id: 'm15_open', title: '台账', day: 15, when: 'open', light: 'dawn', beats: [
    { enter: 'inspector', slot: 2 },
    ['inspector', '周师傅是吧？例行检查。台账、进货单、油，都看一下。'],
    ['z', '都在这儿。……您坐，我给您擦个凳子。'],
    ['inspector', '不坐，站着看。您忙您的。'],
    { prop: 'ledger', label: '台账' }, { sfx: 'page' },
    ['n', '以前是我陪着人查食堂。账怎么做得好看，我会。'],
    ['n', '这本没做过。我想看看，真账过不过得了。'],
    { if: { flags: ['ge_books'] },
      then: [
        ['inspector', '这账谁理的？一笔一笔都对得上。'],
        ['z', '一个老主顾，干过会计。拿早饭抵的工钱。']
      ],
      else: [
        ['inspector', '记得太粗。哪天进的货、进了多少，都没写。'],
        ['z', '以前我的账有人替我抄。……我回头补。'],
        ['inspector', '月底我再来。到时候要一笔一笔对得上。']
      ] },
    { prop: 'oilcan', label: '油桶' },
    { if: { any: [{ burn: [50] }, { oilAge: [4] }] },
      then: [
        ['inspector', '这油几天了？都发黑了。'],
        ['z', '有几天了。……这回能不能算口头提醒？'],
        ['inspector', '不能。整改单，罚款一百，三天内换油。'],
        { sfx: 'stamp' },
        { fx: { cash: -100, rep: -2, set: ['s_insp_fine'] } },
        ['n', '一百块。在厂里那些年，这张单子落不到我头上。'],
        ['z', '我今天就换。']
      ],
      else: [
        { if: { burn: [0, 25], oilAge: [0, 1], flags: ['slip_ever'] },
          then: [
            ['inspector', '油是新的。门口贴的那张，是进货单？'],
            ['z', '是。贴给街坊看的，字丑。'],
            ['inspector', '这条街就您一家贴。合格。'],
            { sfx: 'stamp' },
            { fx: { rep: 3, set: ['s_insp_pass'] } },
            ['z', '……章盖重点。这张我想留着。']
          ],
          else: [
            ['inspector', '油还行。再用一天就该换了。'],
            ['inspector', '这回口头提醒，不开单。进货单留好。'],
            { fx: { set: ['s_insp_warn'] } },
            ['z', '要得。明天换，条子上写着的。']
          ] }
      ] },
    { prop: 'oilcan', off: true }, { prop: 'ledger', off: true },
    { exit: 'inspector' }
  ] };

  main.m18_open = { id: 'm18_open', title: '那条视频', day: 18, when: 'open', light: 'dawn', beats: [
    { prop: 'phone', label: '手机' }, { sfx: 'phone' },
    ['n', '手机在柜台上震了一早上。我还当是催话费的。'],
    { enter: 'neighbor', slot: 1 },
    { if: { flags: ['viral_good'] },
      then: [
        ['neighbor', '就是这家！视频里那锅粥，就是这口锅。'],
        ['neighbor', '说油三天一换，条子就贴在灶台边。真贴了？'],
        ['z', '贴了的。……慢点慢点，都有，莫挤。']
      ],
      else: [
        { if: { flags: ['viral_bad'] },
          then: [
            ['neighbor', '老周，视频里那桶油，是你家的吧？'],
            ['neighbor', '我不买哈。我就来看一眼。'],
            ['z', '……哪个拍的？'],
            ['neighbor', '不晓得。号是新的。拍得倒是清楚。']
          ],
          else: [
            ['neighbor', '刷到你家了。底下说“还行，实在”。'],
            ['z', '哪个发的？这条街我都认不得几个人。'],
            ['neighbor', '不晓得。号是新的，没几个粉丝。']
          ] }
      ] },
    ['n', '这半个月我怎么做的，它就怎么拍的。一刀没剪。'],
    ['n', '照实卖，到底有没有人买账。今天怕是要见分晓。'],
    { choice: [
      { label: '拉开后厨帘子', hint: '后厨随便看',
        fx: { set: ['s_curtain_open'] },
        then: [
          { do: 'hold', label: '按住，拉开帘子' },
          { if: { oilAge: [3] },
            then: [
              ['neighbor', '这油……比视频里的还深。'],
              ['z', '……是该换了。我认。'],
              ['n', '门口有人把手机举起来了。我没去挡。'],
              { fx: { rep: -4, burn: 5, flow: 0.75 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '咦，今天这油是清的嘛。'],
                  ['neighbor', '那视频拍的是哪天的？'],
                  ['z', '前几天的。那天的油，是我舍不得倒。'],
                  { fx: { rep: 2, flow: 0.95 } }
                ],
                else: [
                  ['neighbor', '锅、油、米袋子，都在明处。'],
                  ['neighbor', '要得。给我来两份，一份打包。'],
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
              ['neighbor', '冻品，批发的。……倒是没藏着。'],
              ['z', '冻的就写冻的。'],
              { fx: { rep: 1, flow: 0.95 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['neighbor', '今天的是好。前几天的单子呢？'],
                  ['z', '……前几天的没留。'],
                  ['neighbor', '那就不好说了噻。'],
                  { fx: { rep: 1, flow: 0.9 } }
                ],
                else: [
                  ['neighbor', '哪家的菜、几点到的，都写着。'],
                  ['neighbor', '老秦的葱嘛。他那辆三轮我认得。'],
                  { fx: { rep: 2, flow: 1.1 } }
                ] }
            ] }
        ] },
      { label: '照常做', hint: '不解释，开火',
        fx: {},
        then: [
          { if: { flags: ['viral_good'] },
            then: [
              ['z', '排好队哈。粥要一锅一锅熬，快不起来。'],
              ['n', '队排到了隔壁改衣店门口。小满探头看了一眼。'],
              { fx: { flow: 1.15 } }
            ],
            else: [
              { if: { flags: ['viral_bad'] },
                then: [
                  ['z', '看嘛。我开火了。'],
                  ['n', '围着的人看了一阵，散了一半。'],
                  { fx: { rep: -2, flow: 0.8 } }
                ],
                else: [
                  ['z', '要得。……我开火了。'],
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
    ['n', '整条街黑着。只有我这口煤气灶，还有一圈蓝火。'],
    { prop: 'candle', label: '蜡烛' },
    { if: { aff: { man: 4 } },
      then: [
        { enter: 'man', slot: 0 },
        ['man', '老周，借个火。我那电饭锅成摆设了。'],
        ['man', '韭菜鸡蛋馅，糖糖剁的。粗得跟她缝的针脚一样。']
      ],
      else: [
        { enter: 'neighbor', slot: 0 },
        ['neighbor', '老周，借个火嘛。电饭锅用不成了。'],
        ['neighbor', '馅我拌好了的，白菜猪肉。就差一口锅。']
      ] },
    { if: { aff: { zhao: 3 } }, then: [
      { enter: 'zhao', slot: 1 },
      ['zhao', '豆豆要学包饺子。面我在屋头和好了，和好了的。']
    ], else: [] },
    { if: { aff: { ge: 4 } }, then: [
      { enter: 'ge', slot: 2 },
      ['ge', '劳驾，擀面杖借我。以前单位包饺子，数我擀得圆。']
    ], else: [] },
    { if: { aff: { qin: 3 } }, then: [
      { enter: 'qin', slot: 3 },
      ['qin', '车上还有两棵白菜。不够我再去拉。']
    ], else: [] },
    ['z', '案板不够大。……等一下，我卸块门板下来。'],
    { do: 'tap', label: '捏三个褶' },
    { fx: { unlock: 'dumpling', memento: 'm_candle' } },
    ['n', '在食堂二十年，我没跟谁围着一口锅包过东西。'],
    { choice: [
      { label: '只收皮钱', hint: '一份少赚一半',
        fx: { cash: -30, rep: 2, flow: 1.2, set: ['s_dumpling_half'] },
        then: [
          ['z', '馅是你们的。我只收皮钱、火钱。'],
          ['n', '有人往零钱盒里多放了一块。我没看清是谁。']
        ] },
      { label: '今天不收钱', hint: '白忙一个早晨',
        fx: { cash: -80, rep: 3, flow: 1.35, aff: { man: 1, zhao: 1, ge: 1 }, set: ['s_dumpling_free'] },
        then: [
          ['z', '今天这锅不卖。哪个来了哪个吃。'],
          ['n', '烛光底下，队排到了桥头。没有一个人催。']
        ] },
      { label: '照牌价卖', hint: '一分不少收',
        fx: { cash: 40, rep: -1, set: ['s_dumpling_full'] },
        then: [
          ['z', '饺子照牌价。馅钱我回头算给你们。'],
          ['n', '没人开腔。有人把馅盆往回挪了挪。']
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
    ['landlord', '合同带来了。一千二，这个数你背都背得到。'],
    ['z', '背得到。这二十六天，我天天在算它。'],
    { if: { flags: ['rent_late'] },
      then: [
        ['landlord', '上回房租你拖了的。我没往外头说。'],
        ['landlord', '这回押金要一次给齐。我也有房贷嘛。']
      ],
      else: [
        { if: { rep: [65] },
          then: [
            ['landlord', '这条街早上有人气，是从你这口锅起的头。'],
            ['landlord', '别个出的价比你高。我没应，莫问我为啥子。']
          ],
          else: [
            ['landlord', '说老实话，别个出的价比你高。'],
            ['landlord', '先来后到。我先问你。']
          ] }
      ] },
    ['landlord', '签不签，给句话。钥匙我都捏出汗了。'],
    ['n', '我抬头看门头那块白板。二十六天了，还是一个字没有。'],
    ['n', '这二十六天怎么卖的，够不够活，账本上一笔一笔都在。'],
    { choice: [
      { label: '签，续租', hint: '付清押金', need: { cash: [1200] },
        fx: { payDeposit: true, set: ['renewed'] },
        then: [
          { prop: 'cash', label: '押金' },
          { sfx: 'stamp' },
          ['z', '一千二。都是三块两块收起来的，您莫嫌零碎。'],
          ['landlord', '零碎的钱才扎实。……要得，钥匙你留着。'],
          ['landlord', '招牌该写了哈。白了一个月，像啥子话。'],
          ['z', '写。等我想好头两个字。']
        ] },
      { label: '请街坊凑', hint: '差的街坊垫上', need: { affSum: [30] },
        fx: { chipin: true, set: ['chipin'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '一家一家凑的。谁出了多少，名字都记在里头。'],
          ['man', '莫推。针脚都缝死了，拆不回去。'],
          ['landlord', '……要得嘛。我点一下。'],
          ['z', '我都还。一家一家还。'],
          ['man', '晓得你要还。所以才敢凑噻。'],
          { exit: 'man' }
        ] },
      { label: '不签了', hint: '月底交钥匙',
        fx: { set: ['left'] },
        then: [
          ['z', '不签了。我做到二十八号。'],
          ['landlord', '想好了？……那要得。'],
          ['landlord', '钥匙月底给我。灶台不用你拆。'],
          ['z', '灶台我擦干净了再走。']
        ] }
    ] },
    { prop: 'lease', off: true },
    { exit: 'landlord' }
  ] };

  main.m27_open = { id: 'm27_open', title: '最后一班', day: 27, when: 'open', light: 'dawn', beats: [
    ['n', '六点零五。7 路的车灯从桥那头过来，一分不差。'],
    { if: { aff: { gong: 5 } },
      then: [
        { bus: true }, { sfx: 'horn' },
        ['n', '车没进站。它拐了个弯，停在我门口。'],
        { enter: 'gong', slot: 1 },
        { prop: 'mug', label: '搪瓷茶缸' },
        ['gong', '各位乘客，柳河街早餐铺到了！下车吃饭！'],
        ['gong', '最后一班。我跟调度说了的，绕一脚。'],
        ['z', '……一车人？我粥才熬了两锅。'],
        ['gong', '那就再熬嘛！我开了一辈子车，头一回晚点。'],
        ['gong', '我的照旧。油条炸老点，嚼起来要有响动。'],
        ['z', '要得。……龚师傅，今天这根我请。'],
        ['gong', '不得行。零钱我数好了的，一分不差。'],
        { fx: { flow: 1.5, set: ['s_bus_stop'], memento: 'm_ticket' } },
        { exit: 'gong' }
      ],
      else: [
        { sfx: 'horn' },
        ['n', '车照常进站，照常开走。喇叭多响了一声。'],
        { enter: 'neighbor', slot: 2 },
        ['neighbor', '听说老龚今天最后一班。'],
        ['z', '听说了。……他的油条，我多炸老了一根。'],
        ['neighbor', '那他没下来拿？'],
        ['z', '没有。车不等人。'],
        { fx: { set: ['s_bus_pass'] } },
        { exit: 'neighbor' }
      ] }
  ] };

  main.m28_close = { id: 'm28_close', title: '第二十八天', day: 28, when: 'close', light: 'dusk', beats: [
    ['z', '第二十八天。锅刷了，灶还是温的。'],
    { if: { flags: ['end_HONEST'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '招牌还空着。都最后一天了，今天总该写了。'],
      ['z', '写啥子嘛。想了一个月，一个字没想出来。'],
      ['best', '不用你想。街上背地里早就有叫法了。'],
      ['best', '“去不烧心那家”。问路的都这么问。'],
      ['z', '……这也算名字？'],
      ['best', '算。吃出来的。'],
      { do: 'tap', label: '提笔，往白板上写' },
      ['n', '五个字。写到“心”字手抖了，那一点落得重。'],
      ['z', '……字丑。'],
      ['best', '丑才认得出是你写的。'],
      { exit: 'best' },
      ['n', '兜里那板胃药，还是月初那一板。我没掏出来。']
    ], else: [] },
    { if: { flags: ['end_CANTEEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天几点开？我来帮你摆凳子。'],
      ['z', '五点半。……凳子就四张，有啥子好摆的。'],
      ['best', '又凑了六张。各家搬来的，高矮不齐。'],
      ['best', '招牌我们也商量好了。你别嫌土。'],
      ['n', '白板上是粉笔字：柳河街坊食堂。好几个人的笔迹。'],
      ['z', '“堂”字少了一横。'],
      ['best', '小孩子写的。要不要擦了重来？'],
      ['z', '不擦。就这个。'],
      { exit: 'best' },
      ['n', '我搬张凳子踩上去，拿粉笔把那一横添上了。']
    ], else: [] },
    { if: { flags: ['end_PRIVATE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '下周三，老位子，给我留着。'],
      { prop: 'notebook', label: '小本子' },
      ['z', '记了。周三，靠墙那张。你的粥要稠点。'],
      ['best', '连稠的你都记？'],
      ['z', '记了的。你回回把碗底刮得响。'],
      ['best', '……招牌呢？总不能把这一本名字都写上去。'],
      ['z', '写小点。认得的人认得到就行了。'],
      ['n', '本子上二十几个名字。谁胃不好、谁赶车，都记了。'],
      { exit: 'best' },
      ['n', '我翻到明天那页。六个名字，我泡了六个人的米。']
    ], else: [] },
    { if: { flags: ['end_REOPEN'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '漆味还没散。你昨晚刷的？'],
      ['z', '刷了两遍。头一遍盖不住灶台后头那片油印子。'],
      ['best', '招牌的字都没干透，你就敢挂。'],
      ['z', '挂。挂上去了，我自己天天抬头看得见。'],
      ['best', '看得见又怎样？'],
      ['z', '看到了，手就不敢省那桶油。'],
      { exit: 'best' },
      ['n', '出事那天的日子，我添在了何姨那张条子底下。']
    ], else: [] },
    { if: { flags: ['end_PILLS'] }, then: [
      { prop: 'pills', label: '胃药' },
      ['n', '收银台上，一盒胃药压着一沓账单。我没翻。'],
      ['z', '招牌……就写“周记早点”嘛。'],
      ['z', '别的字，我写不上去。'],
      ['n', '厂里那锅油我吃了二十年。这个月，我自己又熬了一锅。'],
      ['n', '头班车进站。没有人下车往这边走。'],
      ['n', '我抠出两颗药，没倒水，干咽了。']
    ], else: [] },
    { if: { flags: ['end_FAREWELL'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '听说你不签了。大家凑了个主意。'],
      ['n', '白板摘下来了，背面朝上，摆在柜台上。'],
      ['best', '正面留给下一家。背面，我们签了名。'],
      ['z', '……这个油手印是哪个的？'],
      ['best', '不知道。都说不是自己按的。'],
      ['z', '这块板子我要带走。'],
      ['best', '本来就是给你的。下一家用不着背面。'],
      ['z', '我去哪儿开，还没定。定了……我来说一声。'],
      { exit: 'best' },
      ['n', '我解下围裙，把白板包了两层，夹在胳膊底下。']
    ], else: [] },
    { if: { flags: ['end_TRANSFER'] }, then: [
      { enter: 'landlord', slot: 2 },
      { prop: 'keys', label: '钥匙' },
      ['landlord', '接手的人明天来看灶台。卖卤菜的。'],
      ['z', '那口煎锅是何姨的。跟他说，莫用洗洁精。'],
      ['landlord', '你人都要走了，还操心一口锅。'],
      ['z', '条子我留在灶台边了。他看不看，随他。'],
      ['landlord', '招牌一个字没写，倒省得人家铲。'],
      ['landlord', '……老周，你这一个月，到底图个啥子？'],
      ['z', '想算一笔账。没算赢。'],
      { exit: 'landlord' },
      ['n', '钥匙交出去了。手揣回兜里，摸到的是那板药。']
    ], else: [] },
    { if: { flags: ['end_SOMEONE'] }, then: [
      { enter: 'best', slot: 1 },
      ['best', '明天还开吧？'],
      ['z', '开。……你还来？'],
      ['best', '你开，我就来。'],
      ['best', '那招牌呢？空了一个月了。'],
      ['z', '先写两个字，“小馆”。前头空着。'],
      ['best', '空多久？'],
      ['z', '不晓得。明天的油是新的，这个我晓得。'],
      { exit: 'best' },
      ['n', '我写了“小馆”。前头留了三个字的地方。']
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
    ['neighbor', '我爸昨天在你这儿吃的早饭。夜里吐了两回。'],
    ['song', '挂的我们科急诊。我下了夜班，陪他们过来的。'],
    { prop: 'paper', label: '病历' },
    ['z', '……吃的哪样？昨天卖的，我自己也吃了。'],
    ['song', '周叔，这礼拜第三例了。主诉都一样，烧心、反酸。'],
    ['song', '是不是你这儿的事，我下不了结论。'],
    ['song', '可出院第一顿来你这儿喝粥，是我跟病人说的。'],
    ['neighbor', '我不是来闹的。老周，你给个说法。'],
    ['n', '胃里那股酸水顶上来了。这个滋味我熟，吃了二十年。'],
    { choice: [
      { label: '停业整改', hint: '花 400 元，停一天',
        fx: { set: ['crisis_rectify'] },
        then: [
          ['z', '明天不开门。油、锅、料，全部换。'],
          { prop: 'paper', label: '停业整改' },
          ['song', '条子我帮你写。你那字，病人看不懂。'],
          ['song', '就写“停业一天，换油”。别的不用解释。']
        ] },
      { label: '逐个退赔', hint: '退赔 260 元',
        fx: { set: ['crisis_refund'] },
        then: [
          { prop: 'cash', label: '零钱盒里的钱' },
          ['z', '药费我出。这礼拜吃过的，来一个我退一个。'],
          ['neighbor', '……要得。我等你电话。'],
          ['song', '周叔，退钱归退钱。油呢？'],
          ['z', '……换。']
        ] },
      { label: '硬撑', hint: '明天照常开门',
        fx: { set: ['crisis_hold'] },
        then: [
          ['z', '我的粥我自己天天喝。我都没事。'],
          ['song', '周叔。你兜里那板药，我看见过的。'],
          ['n', '她没再说下去，扶着人走了。门没带上。']
        ] }
    ] },
    { exit: 'neighbor' }, { exit: 'song' }
  ] };

  main.rescue = { id: 'rescue', title: '零钱盒', when: 'open', light: 'dawn', beats: [
    { enter: 'landlord', slot: 2 },
    ['landlord', '老周，零钱盒拿来我看一眼。莫藏。'],
    ['n', '盒子里几个钢镚，一张进货的欠条。我自己都不想看。'],
    ['landlord', '两天了。明天的货，你拿啥子去进？'],
    ['z', '……米还有半袋。油条可以少炸点。'],
    ['landlord', '我不是来催租的。我是怕你明天这扇门拉不起来。'],
    { choice: [
      { label: '卖一件设备', hint: '到手 300 元',
        fx: { set: ['s_sold'] },
        then: [
          ['landlord', '收旧货的我认得。喊他下午来拉，不杀你价。'],
          ['z', '要得。能卖的先卖一件。煎锅不卖。']
        ] },
      { label: '向小满借', hint: '到手 250 元，要还', need: { aff: { man: 3 } },
        fx: { set: ['s_borrow'] },
        then: [
          { enter: 'man', slot: 1 },
          { prop: 'envelope', label: '信封' },
          ['man', '钱在里头。莫打条子，我记性比尺子准。'],
          ['z', '我还。下个礼拜就开始还。'],
          ['man', '还不上就拿葱油饼抵。糖糖爱吃。'],
          { exit: 'man' }
        ] },
      { label: '再撑一天', hint: '今天少备点货',
        fx: { flow: 0.85, set: ['s_refuse'] },
        then: [
          ['z', '再撑一天。今天少备点，卖完就收。'],
          ['landlord', '犟。……要得，明天我还来。']
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
      ['powder', '老板，撒一勺，香得半条街都闻得到！'],
      ['z', '袋子上怎么一个字都没有？'],
      ['powder', '厂里直接出的嘛，省下的包装钱都让给你了。'],
      ['powder', '公交站那辆早餐车，用了一个礼拜，队排好长。'],
      ['z', '里头是啥子？我以前管进货，没字的东西不签收。'],
      ['powder', '哎呀老板，现在你自己当家，哪个要你签字嘛。'],
      { choice: [
        { label: '推回去', hint: '香不过早餐车',
          fx: { flowNext: 0.95 },
          then: [
            ['z', '不要。你拿走。'],
            ['powder', '要得。等你门口没人了，再找我。']
          ] },
        { label: '试一次', hint: '10 元一包，更香',
          fx: { cash: -10, burn: 8, flow: 1.15, set: ['powder_used'], later: powderLater },
          then: [
            ['powder', '一勺就够。多了发苦。'],
            ['n', '我把小包塞进围裙兜。手在兜里捏了半天。']
          ] },
        { label: '用了别声张', hint: '30 元一袋，客更多',
          fx: { cash: -30, burn: 18, flow: 1.25, set: ['powder_used', 'powder_hidden'], later: powderLater },
          then: [
            ['powder', '懂行！哪个问起，都说是换了新米。'],
            ['z', '……嗯。'],
            ['n', '这一声“嗯”，跟我在厂里签字那阵一个声气。']
          ] }
      ] },
      { prop: 'powder', off: true },
      { exit: 'powder' }
    ] },

    { id: 'e_powder_after', title: '香得不对', when: 'close', need: { flags: ['powder_used', 'e_powder_due'] }, weight: 3, once: true, cool: 3, beats: [
      { enter: 'kid', slot: 1 },
      ['kid', '老板，你家粥是不是换配方了？'],
      ['kid', '我同桌说喝完一上午口干，上课一直要水喝。'],
      ['z', '……你同桌喝了几碗？'],
      ['kid', '就一碗。他平时都不喝水的。'],
      { exit: 'kid' },
      { enter: 'song', slot: 2 },
      ['song', '周叔，我也想问。这几天的粥，香得不对。'],
      ['song', '米香是往下沉的。这个香往鼻子里冲。'],
      { choice: [
        { label: '认了', hint: '剩的半袋扔掉',
          fx: { burn: -10, rep: -1, aff: { song: 1 }, clear: ['powder_hidden'], set: ['e_powder_admit'] },
          then: [
            { prop: 'powder', label: '增香粉' },
            ['z', '加了东西。就这袋，没字的。我扔了。'],
            { prop: 'powder', off: true },
            ['song', '嗯。这回不记病历。我就当没闻见过。']
          ] },
        { label: '说是新米', hint: '这事就过去了',
          fx: { burn: 6, aff: { song: -2 }, set: ['powder_hidden', 'e_powder_deny'] },
          then: [
            ['z', '换了新米。东北的，香些。'],
            ['song', '……哦。东北的。'],
            ['n', '她把粥钱放下就走了，没等我找零。']
          ] }
      ] },
      { exit: 'song' }
    ] },

    { id: 'e_recycler', title: '没挂牌的三轮', when: 'close', need: { day: [5], oilAge: [2] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'recycler', slot: 2 },
      { prop: 'oilcan', label: '废油' },
      ['recycler', '老板，废油有噻？我出四十一桶。'],
      ['z', '回收站的车才给十块。你怎么给得起四十？'],
      ['recycler', '所以找我嘛。现钱，不开票，不啰嗦。'],
      ['z', '拉到哪儿去？'],
      ['recycler', '这个你就莫问了。问了你也睡不着。'],
      ['n', '门口停了辆没挂牌的三轮。桶上的字都磨没了。'],
      ['n', '厂里的废油，每个月也有人来拉。我从来没问过。'],
      { choice: [
        { label: '等回收站的车', hint: '到手 10 元，有收据',
          fx: { cash: 10, burn: -2, set: ['e_oil_legal'] },
          then: [
            ['z', '不卖。我等回收站的车，人家给收据。'],
            ['recycler', '十块钱的命。']
          ] },
        { label: '卖给他', hint: '到手 40 元',
          fx: { cash: 40, burn: 8, set: ['e_oil_sold'] },
          then: [
            { sfx: 'coin' },
            ['recycler', '爽快。下回还找你。'],
            ['n', '桶搬上了三轮，盖子没拧紧。我看见了，没开腔。']
          ] }
      ] },
      { prop: 'oilcan', off: true },
      { exit: 'recycler' }
    ] },

    { id: 'e_helper', title: '招人吗', when: 'close', need: { day: [6], not: ['helper'] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['guifen', '老板，招人不？我在门口看了你三天了。'],
      ['guifen', '你一个人又炸又盛又收钱，油条都炸老了两根。'],
      ['z', '……炸老的那两根，是给龚师傅的。'],
      ['guifen', '哦。那我包子包得快，洗碗收钱都得行，不偷嘴。'],
      ['z', '工钱我给不了多少。'],
      ['guifen', '一天三十五。五点到，收了摊就走。'],
      ['guifen', '下午不得行。屋头离不得人。'],
      { choice: [
        { label: '明早来吧', hint: '每天工钱 35 元',
          fx: { helper: true, set: ['e_guifen_hired'] },
          then: [
            ['z', '明早五点。围裙我这儿有，就是大了点。'],
            ['guifen', '哎！我自己带了的。你看，都系上了。']
          ] },
        { label: '再等等', hint: '还是一个人忙',
          fx: { set: ['e_guifen_wait'] },
          then: [
            ['z', '再等等。眼下我一个人还转得开。'],
            { prop: 'paper', label: '电话号码' },
            ['guifen', '那我留个电话。转不开了就打，我走路十分钟。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },

    { id: 'e_helper_take', title: '保温桶', when: 'close', need: { helper: true, day: [10] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'guifen', slot: 2 },
      ['n', '桂芬的布袋鼓着，露出半个保温桶盖。'],
      ['z', '桂芬。'],
      ['guifen', '……是剩的粥。锅底那点，都起锅巴了。'],
      ['guifen', '我想着反正要倒。老板，我不是那种人，真的。'],
      { choice: [
        { label: '先问问', hint: '每天少卖一碗粥',
          fx: { cash: -10, rep: 1, set: ['e_guifen_trust'] },
          then: [
            ['z', '带给哪个的？'],
            ['guifen', '我婆婆。躺了两年了，只咽得下稀的。'],
            ['z', '往后莫等锅底。头一锅熬好，先给她盛。'],
            ['guifen', '那……那从我工钱里扣。'],
            ['z', '不扣。一碗粥，七毛钱的米。']
          ] },
        { label: '扣一天工钱', hint: '省下 35 元',
          fx: { cash: 35, rep: -1, set: ['e_guifen_docked'],
            later: { days: 3, fx: { rep: -1 }, note: '后来才听说，那粥是带给她卧床的婆婆的。' } },
          then: [
            ['z', '规矩是规矩。今天的工钱不算。'],
            ['guifen', '……哎。'],
            ['n', '她把保温桶里的粥倒回了锅里。一滴没洒。']
          ] },
        { label: '让她别来了', hint: '明天起一个人',
          fx: { helper: false, rep: -1, set: ['e_guifen_fired'],
            later: { days: 2, fx: { rep: -1 }, note: '小满说，桂芬家里有个卧床的婆婆。' } },
          then: [
            ['z', '明天不用来了。工钱结到今天。'],
            ['guifen', '要得。围裙我洗了再还你。'],
            ['n', '话那么密的一个人，走的时候一句都没多说。']
          ] }
      ] },
      { exit: 'guifen' }
    ] },

    { id: 'e_peer', title: '豆浆一块', when: 'open', need: { day: [10] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'peer', slot: 2 },
      { prop: 'paper', label: '传单' },
      ['peer', '周老板，来打个招呼。我的车停公交站那头。'],
      ['peer', '豆浆一块，油条买一送一。先卖一个礼拜。'],
      ['z', '一块？我算过，一杯光豆子就是八毛的本。'],
      ['peer', '先把人拢过来嘛。亏的后头再找补。'],
      ['z', '从哪儿找补？'],
      ['peer', '嘿，这个就各有各的办法了。混口饭，莫见怪。'],
      ['n', '老葛站在街对面，看看传单，又看看我这边。'],
      { choice: [
        { label: '跟着降价', hint: '今天少赚 40 元',
          fx: { cash: -40, flow: 1.15, set: ['e_peer_follow'] },
          then: [
            ['z', '豆浆今天我也卖一块。'],
            ['peer', '嚯。那就看哪个撑得久嘛。']
          ] },
        { label: '加量不加价', hint: '多搭料 25 元',
          fx: { cash: -25, rep: 2, aff: { ge: 1 }, set: ['e_peer_more'] },
          then: [
            ['z', '价不动。粥盛满，油条炸大一号。'],
            ['peer', '要得，各做各的。']
          ] },
        { label: '不跟', hint: '今天客人少一成半',
          fx: { flow: 0.85, set: ['e_peer_hold'] },
          then: [
            ['z', '我不跟。一块钱的豆浆，我磨不出来。'],
            ['peer', '那老主顾走了，莫怪我哈。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'peer' }
    ] },

    { id: 'e_vlogger', title: '免单换视频', when: 'open', need: { day: [9], rep: [55] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'vlogger', slot: 2 },
      { prop: 'phone', label: '手机支架' },
      ['vlogger', '老板！我粉丝两万，这条街我先拍你家。'],
      ['vlogger', '一套免单，我出一条视频，带定位，稳赚。'],
      ['z', '吃了好，你就说好。那要是不好呢？'],
      ['vlogger', '哎呀，都免单了，自然就是好嘛。'],
      ['z', '那我这三十块，买的是你一句话？'],
      ['vlogger', '老板，你这么说就没意思了。这叫合作。'],
      { choice: [
        { label: '免单', hint: '送出一套 30 元',
          fx: { cash: -30, flow: 1.15, set: ['e_vlog_free'],
            later: { days: 2, fx: { rep: 2, burn: 2 }, note: '那条探店视频里，粥冒着热气。夸得有点过。' } },
          then: [
            ['z', '……要得。坐嘛。'],
            ['vlogger', '老板上道！来，看镜头，笑一个。'],
            ['n', '我笑了。脸上的肉不大听使唤。']
          ] },
        { label: '照价收钱', hint: '他不一定发',
          fx: { rep: 1, set: ['e_vlog_paid'] },
          then: [
            ['z', '该多少是多少。拍，随你拍。'],
            ['vlogger', '……行吧。来碗粥。'],
            ['n', '他付了钱，吃完点了点头。手机一直没举起来。']
          ] },
        { label: '请他走', hint: '少一次露脸',
          fx: { rep: -1, aff: { zheng: 1 }, set: ['e_vlog_refuse'] },
          then: [
            ['z', '不拍。后头还有人等着买。'],
            ['vlogger', '这条街又不止你一家。'],
            ['n', '小郑排在队尾，往本子上记了一行。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'vlogger' }
    ] },

    { id: 'e_aunty', title: '三十份', when: 'open', need: { day: [7] }, weight: 1, once: true, cool: 5, beats: [
      { enter: 'aunty', slot: 2 },
      { prop: 'paper', label: '接龙名单' },
      ['aunty', '老周！我们小区群里接龙，要三十份。'],
      ['aunty', '粥加油条。明早七点前，送到门卫室。'],
      ['aunty', '量大嘛，你打个七折。我都跟群里说好了。'],
      ['z', '你都说好了，才来问我？'],
      ['aunty', '哎呀，先说好了才有人接龙噻。'],
      ['z', '七点前……正是我门口人最多的时候。'],
      ['aunty', '所以才来跟你商量嘛。'],
      { choice: [
        { label: '三十份全接', hint: '明天进账 90 元',
          fx: { flowNext: 0.8, set: ['e_group_all'],
            later: { days: 1, fx: { cash: 90, rep: -1 }, note: '三十份七点前送到了。门口有人等不及，走了。' } },
          then: [
            ['z', '接。我四点起来熬。'],
            ['aunty', '爽快！货到了我转你，一分不少。']
          ] },
        { label: '接十五份', hint: '明天进账 45 元',
          fx: { flowNext: 0.92, set: ['e_group_half'],
            later: { days: 1, fx: { cash: 45 }, note: '十五份送到了。刘姐说，下回还是要三十。' } },
          then: [
            ['z', '十五份。再多，门口的人要干等。'],
            ['aunty', '要得嘛。剩下的我找公交站那辆车。']
          ] },
        { label: '不接', hint: '散客照常',
          fx: { aff: { gong: 1 }, set: ['e_group_no'] },
          then: [
            ['z', '接不了。六点零五，有人要赶头班车。'],
            ['aunty', '一个司机顶我三十份？要得，你有原则。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'aunty' }
    ] },

    { id: 'e_tv', title: '老街的早晨', when: 'open', need: { day: [11] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'tv', slot: 2 },
      ['tv', '师傅您好，我们台在拍“老街的早晨”。'],
      ['tv', '等下客人来了，您能不能笑得开心一点？'],
      ['z', '我平时就这个脸。'],
      ['tv', '您再端一碗粥，对着镜头说句“几十年老味道”。'],
      ['z', '我开了才十来天。几十年的是前头那位何姨。'],
      ['tv', '没关系，观众看不出来的。'],
      { choice: [
        { label: '照常做', hint: '拍到什么算什么',
          fx: { rep: 2, set: ['e_tv_plain'] },
          then: [
            ['z', '你们拍你们的。那句词我说不出口。'],
            ['n', '后来播出来，镜头里是赵爷爷在低头数硬币。']
          ] },
        { label: '摆拍一回', hint: '今天客流多一成',
          fx: { flow: 1.12, rep: 1, burn: 3, set: ['e_tv_staged'] },
          then: [
            ['z', '几、几十年老味道。'],
            ['tv', '好！再来一条，笑自然一点。'],
            ['z', '……几十年老味道。'],
            ['n', '第二遍顺多了。顺得我自己心头一紧。']
          ] },
        { label: '不拍', hint: '机器转去别家',
          fx: { flow: 0.95, set: ['e_tv_no'] },
          then: [
            ['z', '不拍了。机器挡着人排队了。'],
            ['tv', '行。那我们去公交站那辆车。']
          ] }
      ] },
      { exit: 'tv' }
    ] },

    { id: 'e_water', title: '水黄了', when: 'open', need: { day: [12] }, weight: 0.8, once: true, cool: 5, beats: [
      { enter: 'gong', slot: 1 },
      { prop: 'mug', label: '茶缸' },
      ['gong', '老周！你这个水不对头。'],
      ['gong', '我缸子里接的，茶叶还没放，水先黄了。'],
      { sfx: 'pour' },
      ['n', '我拧开龙头。流出来的水带锈色，一股铁腥气。'],
      ['gong', '准是桥头又在挖管子。年年挖，说下午才修得好。'],
      ['z', '我粥还没下米。一锅要十二碗水。'],
      ['gong', '那你快点拿主意。我那趟头班车，不等人的。'],
      { choice: [
        { label: '买桶装水', hint: '花 40 元',
          fx: { cash: -40, rep: 1, set: ['e_water_buy'] },
          then: [
            ['z', '我去街口扛几桶。四十就四十。'],
            ['gong', '要得！茶我收了班回来再泡。']
          ] },
        { label: '不做汤水', hint: '只卖干的，客人少',
          fx: { flow: 0.75, rep: 1, set: ['e_water_stop'] },
          then: [
            { prop: 'paper', label: '今日无粥' },
            ['z', '粥和豆浆今天不做。我写张条子贴上。'],
            ['gong', '那我干啃油条。要得，炸老点就不噎。']
          ] },
        { label: '烧开了照用', hint: '不花钱，照常卖',
          fx: { burn: 10, set: ['e_water_used'] },
          then: [
            ['z', '烧开了一样的。厂里也是这么……烧开了就行。'],
            ['gong', '……我今天喝自己带的。']
          ] }
      ] },
      { prop: 'mug', off: true },
      { exit: 'gong' }
    ] },

    { id: 'e_leftover', title: '剩下的', when: 'close', need: { day: [3, 8] }, weight: 1.2, once: true, cool: 5, beats: [
      { enter: 'qin', slot: 2 },
      ['n', '锅里剩了两碗粥。筐里四根油条，凉了。'],
      ['qin', '剩了？'],
      ['z', '头几天，备多了。心里没个数。'],
      ['qin', '何姨那阵，剩的都留给巷口那老两口。'],
      ['qin', '收废品的。天天这个点从门口过。'],
      ['z', '我晚饭还没着落。……这个也是饭。'],
      { choice: [
        { label: '留给老两口', hint: '晚饭另买，8 元',
          fx: { cash: -8, set: ['e_leftover_give'],
            later: { days: 2, fx: { rep: 1 }, note: '巷口老两口把门前的纸箱捆走了，没要钱。' } },
          then: [
            { do: 'tap', label: '装袋，挂在门把上' },
            ['qin', '他们不进门的。挂外头就要得。'],
            ['z', '粥我多套了个袋子，怕洒。']
          ] },
        { label: '自己当晚饭', hint: '省一顿饭钱',
          fx: { set: ['e_leftover_self'] },
          then: [
            ['z', '我自己吃。省一顿。'],
            ['n', '凉油条泡粥。吃完，我摸了摸兜里那板药。']
          ] }
      ] },
      { exit: 'qin' }
    ] },

    { id: 'e_gas', title: '检修通知', when: 'open', need: { day: [6] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'landlord', slot: 2 },
      { prop: 'paper', label: '检修通知' },
      ['landlord', '老周，门上贴的通知你没看？'],
      ['landlord', '燃气检修，七点到八点半。灶不准开。'],
      ['z', '七点到八点半？那是我卖得最好的时候。'],
      ['landlord', '跟我说没用。人家是带着表来的。'],
      ['z', '一个半钟头，少说四十碗粥。'],
      ['landlord', '跟我算账？算账我比你凶。咋个弄，快说。'],
      { choice: [
        { label: '等修完再开', hint: '只卖半个早晨',
          fx: { shift: 0.6, rep: 1, set: ['e_gas_wait'] },
          then: [
            ['z', '八点半再开火。'],
            ['landlord', '要得。我喊他们先弄你这一段。']
          ] },
        { label: '赶在七点前卖', hint: '早开早收',
          fx: { shift: 0.75, flow: 1.1, set: ['e_gas_early'] },
          then: [
            ['z', '我现在就开。卖到七点收。'],
            ['landlord', '那你手脚快点。']
          ] },
        { label: '照常开火', hint: '整个早晨照卖',
          fx: { burn: 8, set: ['e_gas_risk'],
            later: { days: 1, fx: { rep: -2 }, note: '有人看见，检修那阵这口灶还开着。' } },
          then: [
            ['z', '我把火关小点。'],
            ['landlord', '……我啥子都没听到哈。我没来过。']
          ] }
      ] },
      { prop: 'paper', off: true },
      { exit: 'landlord' }
    ] },

    { id: 'e_rain_takeout', title: '十一单', when: 'open', light: 'rain', need: { weather: 'rain', day: [3] }, weight: 1.5, once: false, cool: 6, beats: [
      { sfx: 'rain' },
      { enter: 'ali', slot: 2 },
      { prop: 'phone', label: '外卖单' },
      ['ali', '周叔周叔，下雨了，单子爆了！'],
      ['ali', '光你这一家，我手上挂了十一单。十一单！'],
      ['n', '门口几个老人正在收伞，伞尖的水滴了一地。'],
      ['ali', '全接的话我来回跑。就是堂食的要等。'],
      ['z', '你雨衣怎么只穿了半边？'],
      ['ali', '哥……叔，莫管雨衣了，系统在读秒！'],
      { choice: [
        { label: '全接', hint: '今天客流多三成',
          fx: { flow: 1.3, rep: -1, aff: { ali: 1 } },
          then: [
            ['z', '接。路滑，你骑慢点。'],
            ['ali', '慢了要扣钱的！走了走了！']
          ] },
        { label: '接一半', hint: '今天客流多一成',
          fx: { flow: 1.12 },
          then: [
            ['z', '接六单。别的你推了。'],
            ['ali', '要得。六单也够我跑湿一身了。']
          ] },
        { label: '只做堂食', hint: '外卖今天不接',
          fx: { flow: 0.92, rep: 1, aff: { zhao: 1, ali: -1 } },
          then: [
            ['z', '今天不接。门口站的都是老人。'],
            ['ali', '……好嘛。那我去别家等单了。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'ali' }
    ] },

    { id: 'e_move', title: '最后一碗', when: 'close', need: { day: [14] }, weight: 0.9, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 2 },
      ['neighbor', '老周，来碗白粥。最后一碗了。'],
      ['z', '王阿姨，提这么大个包，要出远门？'],
      ['neighbor', '搬去儿子那儿。车在桥头等着，催了两道了。'],
      ['neighbor', '这个门脸的早饭，我吃了十一年。'],
      ['neighbor', '先是何姨的粥，后头是你的。差得不多。'],
      ['z', '差在哪儿？您说，我好改。'],
      ['neighbor', '她的稠一点点。……算了，我也吃不着了。'],
      { sfx: 'pour' },
      { choice: [
        { label: '这碗不收钱', hint: '白送一碗粥',
          fx: { cash: -3, rep: 2, set: ['e_move_free'] },
          then: [
            ['z', '这碗算我的。'],
            ['neighbor', '那咋个要得……唉，要得。我记着。']
          ] },
        { label: '照常收钱', hint: '照牌价收',
          fx: { cash: 3, set: ['e_move_paid'] },
          then: [
            { sfx: 'coin' },
            ['neighbor', '拿着。规矩是规矩。'],
            ['n', '零钱是她数好了的，一个钢镚都不差。']
          ] },
        { label: '抄一页粥谱', hint: '何姨的方子给她',
          fx: { rep: 1, set: ['e_move_recipe'] },
          then: [
            { prop: 'paper', label: '粥谱一页' },
            ['z', '何姨的方子，我抄了一页。您带上。'],
            ['neighbor', '那边的米不一样。……我试一哈。']
          ] }
      ] },
      { exit: 'neighbor' }
    ] },

    { id: 'e_complaint', title: '评论三百条', when: 'open', need: { day: [13], burn: [35] }, weight: 1.4, once: true, cool: 5, beats: [
      { enter: 'neighbor', slot: 1 },
      { prop: 'phone', label: '投诉视频' },
      ['neighbor', '老周，你看一下这个。昨晚上发的。'],
      ['neighbor', '说在柳河街吃了早饭，烧心烧了一上午。'],
      ['neighbor', '没点名。可评论里有人认出你家门头了。'],
      ['z', '……门头是白的，怎么认得出来？'],
      ['neighbor', '就是白的才好认噻。整条街就你一家没字。'],
      ['neighbor', '三百多条了。你说句话不嘛？'],
      { choice: [
        { label: '公开回应', hint: '今天客人少一成',
          fx: { burn: -12, rep: -2, flow: 0.9, aff: { zheng: 1 }, set: ['e_complaint_public'] },
          then: [
            ['z', '我回。哪天的油、哪家的料，照实写。'],
            ['neighbor', '照实写？那写出来可不好看哦。'],
            ['z', '不好看就不好看。你帮我打字，我说。']
          ] },
        { label: '私下退钱', hint: '退赔 30 元',
          fx: { cash: -30, burn: -6, set: ['e_complaint_refund'] },
          then: [
            ['z', '帮我问一下是哪个。钱我退，药我买。'],
            ['neighbor', '要得。他删不删，我可不敢保。']
          ] },
        { label: '不理', hint: '今天照常开门',
          fx: { rep: -3, burn: 4, flow: 0.88, set: ['e_complaint_ignore'] },
          then: [
            ['z', '没点名。我一回，反倒是认了。'],
            ['n', '到中午，视频底下的评论过了五百。我没再点开。']
          ] }
      ] },
      { prop: 'phone', off: true },
      { exit: 'neighbor' }
    ] }
  ];

  return { main: main, events: events };
});
