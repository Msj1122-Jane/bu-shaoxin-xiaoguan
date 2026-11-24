// 常客线 B：龚师傅 / 小满 / 小郑 / 老秦。格式见 docs/CONTENT_SPEC.md §5、§7。
// 自造旗标一律带前缀 gong_ / man_ / zheng_ / qin_。
BSX.define('content/arcs_b', function () {
  var FRESH = [{ flags: ['hood'] }, { oilAge: [0, 2] }];

  /* ───────────────────────── 龚师傅 ───────────────────────── */
  var gong = {
    first: '六点零五到，嗓门比喇叭大。零钱一个钢镚不差。',
    usual: ['soy', 'youtiao:老'],
    facts: {
      f_exact: '龚师傅的零钱是头天晚上数好的，一个钢镚不多。',
      f_tea: '煮茶叶蛋的茶是龚师傅带的。他说何姨就这么煮，蛋壳先敲裂。',
      f_oil: '油旧了他不骂人，只说今天光灌豆浆。',
      f_river: '他说柳河街从前是条河，他在里头摸过螃蟹。填了才通的7路。',
      f_retire: '龚师傅二十七号退休，开最后一趟头班车。他叫我莫往外摆。',
      f_route: '7路下月并线，柳河街这一站要撤。早上那拨人得走到桥头去坐。',
      f_morning: '退休头一天，他八点半才来。四点半就醒了，不晓得早晨拿来做啥。'
    },
    mementos: {
      m_notice: { name: '7路并线通知', text: '柳河街站那一行，他拿圆珠笔划了一道，又描了一遍。', kind: 'paper' },
      m_mug: { name: '搪瓷茶缸', text: '缸底一圈茶垢，把手上缠着胶布。他说先搁我这儿。', kind: 'mug' }
    },
    beats: [
      { id: 'gong1', need: { day: [2, 3] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '豆浆灌缸里！油条炸老点！',
          chat: [['a', '六点十分发车，一分不能晚。'], ['z', '来得及。您开7路的？'], ['a', '头班车。全车人等我一个。'], ['a', '炸老点，嚼起要有个响动。'], ['z', '老我会。焦了您莫怪。']],
          good: '要得！是老法子炸的。', ok: '还将就。明天再老点。', bad: '老是老，莫给我炸焦嘛。', slow: '快点哦，车不等人！', out: '钱正好，莫数了。发车！'
        },
        fx: { fact: ['gong', 'f_exact'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong2', need: { day: [4, 7] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样！给你带了包茶。',
          chat: [['a', '何姨就拿这个茶煮蛋。'], ['z', '您认得何姨？'], ['a', '吃了她十一年早饭噻。'], ['a', '蛋壳先敲裂，才进味。'], ['z', '我试试。煮咸了您莫骂。']],
          good: '火候跟上了，有点像她。', ok: '还成。比头回强。', bad: '今天炸嫩了，没得响动。', slow: '老周，还有四分钟哈！', out: '茶叶搁你灶边了。走了！'
        },
        fx: { unlock: 'teaegg', fact: ['gong', 'f_tea'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong3a', group: 'gong_oil', need: { day: [9, 12], oilAge: [3] }, key: true, at: 'early',
        order: ['soy'],
        say: {
          in: '今天光灌豆浆，不要油条。',
          chat: [['z', '油条不要了？给您炸老的。'], ['a', '炸老的最吃油，你晓得噻。'], ['a', '何姨是三天一换。'], ['z', '……我明天换。'], ['a', '我啥子都没说哈。']],
          good: '豆浆没得毛病。', ok: '嗯。灌满就行。', bad: '咋个豆浆都不烫了？', slow: '算了算了，路上喝。', out: '换了油，我再要油条。'
        },
        fx: { fact: ['gong', 'f_oil'], set: ['gong_sawold'] }, fxBad: { aff: { gong: -1 } } },

      { id: 'gong3b', group: 'gong_oil', need: { day: [9, 12] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子！你晓得的。',
          chat: [['a', '看到你倒油了，清亮。'], ['a', '从前这条河也照得见人。'], ['z', '河？这街上哪来的河？'], ['a', '就你脚底下。我摸过螃蟹。'], ['a', '后来填了，才通的7路。']],
          good: '脆！一路上都是香的。', ok: '要得，将就。', bad: '咋个，今天手生了？', slow: '各位乘客，司机还没吃。', out: '走了！明天六点零五。'
        },
        fx: { fact: ['gong', 'f_river'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong4a', group: 'gong_slip', need: { day: [13, 15], priceAvg: [1.5] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '涨了？等我重数一遍。',
          chat: [['a', '你涨得，退休金涨不得。'], ['z', '退休？您要退了？'], ['a', '二十七号，最后一趟。'], ['a', '车队都没几个晓得。'], ['a', '你莫往外摆哈。']],
          good: '贵两毛，这根值。', ok: '行嘛。贵是贵了点。', bad: '贵了，还没给我炸老！', slow: '剩十几趟了，莫给我误。', out: '数好了，还是正好。'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong4b', group: 'gong_slip', need: { day: [13, 15] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子！问你个事。',
          chat: [['a', '二十七号你开不开门？'], ['z', '开。咋个了？'], ['a', '没啥子。我最后一趟。'], ['z', '……您要退了？'], ['a', '到站了噻。你莫声张。']],
          good: '安逸。还能吃十几回。', ok: '要得。', bad: '今天不脆，扣你一分。', slow: '车不等人，我也不等。', out: '六点零九。走了！'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong5', need: { day: [16, 17] }, key: true, act: 'absent', order: [],
        remark: { who: 'zhao', line: '咦，头班车今天不是老龚开。' } },

      { id: 'gong6', need: { day: [19, 23] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样。那天我签字去了。',
          chat: [['a', '7路下个月并线。'], ['a', '柳河街这一站，不停了。'], ['z', '那早上这拨人咋个办？'], ['a', '走到桥头去坐，多走八分钟。'], ['a', '收了车我再来找你。']],
          good: '站撤得脱，这口撤不脱。', ok: '嗯。吃嘛。', bad: '心头有事，吃不出味。', slow: '走了，拿到车上吃。', out: '站牌上也贴起了。'
        },
        leave: { memento: 'm_notice', line: '他把并线通知落在柜台上了。' },
        fx: { set: ['gong_route'], fact: ['gong', 'f_route'] },
        after: 'sc_gong_route' },

      { id: 'gong7', need: { day: [27, 27] }, key: true, at: 'early',
        order: 'usual', hide: true, act: 'treat',
        note: '二十七号早点开门。最后一趟，莫迟到 —龚',
        say: {
          in: '最后一趟。老样子！',
          chat: [['a', '后头那个学生娃算我的。'], ['a', '坐了我三年车，没迟到过。'], ['a', '老赵爷孙俩，你多看到点。'], ['z', '晓得。今天这根我请。'], ['a', '莫来这套。两份钱，正好。']],
          good: '要得。这个味我记到了。', ok: '行。够了。', bad: '最后一回，还是没炸老。', slow: '今天……喊车等我一回。', out: '六点十分。7路，发车！'
        },
        fxGood: { aff: { gong: 1 } } },

      { id: 'gong8', need: { day: [28, 28] }, key: true, at: 'late',
        order: [{ wish: '汤水' }, 'youtiao:老'],
        say: {
          in: '八点半了。整口带汤的。',
          chat: [['a', '四点半就醒了，改不脱。'], ['a', '走到车场，才想起不用去。'], ['z', '坐嘛。今天不赶车。'], ['a', '不赶车，我还不会点菜了。'], ['a', '茶缸先搁你这儿哈。']],
          good: '原来早饭可以坐到吃。', ok: '慢慢吃，是这个味。', bad: '不赶车，嘴还刁起来了。', slow: '不急不急。我今天不赶。', out: '明天……还是这个点哈。'
        },
        leave: { memento: 'm_mug', line: '茶缸留在架子上，他没带走。' },
        fx: { fact: ['gong', 'f_morning'], set: ['gong_mug'] }, fxGood: { aff: { gong: 1 } } }
    ],
    barks: {
      in: ['老样子！六点零五，没晚。', '豆浆灌缸里，灌满！', '油条炸老，零钱正好。', '各位乘客，司机先吃。'],
      inRain: ['落雨天，车要慢慢开。', '雨刮器又该换了。', '这种雨，从前河要涨水。'],
      inOilOld: ['今天油条少来一根。', '锅头颜色深了哈。', '何姨是三天一换。'],
      inPriceUp: ['涨了？等我重数。', '多两毛，零钱要另备。', '贵了嘛，就要炸老点。'],
      inPriceDown: ['便宜了？莫亏到自己。', '零钱还多出两毛。', '薄利可以，油要换哈。'],
      inBusy: ['人多，我掐到表的。', '队都排到站牌了！', '先紧到赶车的做。'],
      good: ['脆！嚼起有响动。', '要得，老得正好。', '这一口顶一上午。', '巴适，没得毛病。'],
      ok: ['还将就。', '要得嘛。', '凑合，没误点。'],
      bad: ['老是老，莫焦嘛。', '今天炸嫩了，没响动。', '豆浆不烫，扣一分。'],
      slow: ['车不等人哦！', '还有三分钟发车。', '算了，拿到路上吃。'],
      out: ['走了，发车！', '六点零九，正点。', '明天见，莫睡过头。', '下一站，车场。']
    },
    epilogue: [
      { need: { flags: ['gong_mug', 'gong_bridge'], not: ['left'] },
        text: '7路并了线。桥头多了张折叠桌，卖的是小馆的粥。龚师傅坐在边上指哪个口子人多，茶缸搁在桌角。' },
      { need: { flags: ['gong_mug'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '茶缸还在架子上。龚师傅每天八点半来，坐着喝完一碗粥，再走到桥头，看别个开他的7路。' },
      { need: { flags: ['gong_mug', 'left'] },
        text: '茶缸跟着铺盖一起搬走了。龚师傅说，新铺子开在哪儿，他就坐哪路车去，反正现在有的是早晨。' },
      { need: { flags: ['gong_retire'] },
        text: '7路并了线，柳河街的站牌拆了。有人看见龚师傅清早还在老地方站着，看一眼表，站一会儿就走。' },
      { text: '7路头班车换了司机，六点十分照样过站。再没有人跳下来，喊一声“豆浆灌缸里”。' }
    ],
    scenes: {
      sc_gong_route: { id: 'sc_gong_route', title: '并线通知', when: 'close', light: 'dusk', beats: [
        { enter: 'gong', slot: 1 },
        ['n', '傍晚他又来了，没穿制服。离了方向盘，他手不晓得往哪儿搁。'],
        ['gong', '“各位乘客，柳河街到了”——这句话，下个月就不报了。'],
        ['gong', '通知落你这儿了。莫还我，我车上还有一摞。'],
        { prop: 'paper', label: '并线通知' },
        ['z', '我看了。划了道杠的那一行，是我门口这个站。'],
        ['gong', '我划的。划完又想，划它有啥子用。'],
        ['gong', '说正事。下月起，早上那拨人不从你门口过了。'],
        ['z', '……少好多？您给个数。'],
        ['gong', '我车上每天四十来个，一半在这站下。二十个，你算嘛。'],
        ['z', '二十碗粥，二十根油条。……我不敢往下算。'],
        ['gong', '莫慌。何姨那年修路，门口挖了三个月，也这么熬过来的。'],
        ['z', '她咋个熬的？'],
        ['gong', '把粥端到桥头去卖。就这么笨，笨了三个月。'],
        { choice: [
          { label: '贴在门口', hint: '明天客流少一点', fx: { rep: +2, flowNext: 0.92, set: ['gong_told'] },
            then: [['z', '贴门口。街坊早晚要晓得，不如从我这儿晓得。'], ['gong', '要得。老实人的办法。明天少几个人，你莫怨我。']] },
          { label: '去桥头试卖', hint: '多备二十碗料', fx: { cash: -20, set: ['gong_bridge'], later: { days: 2, fx: { cash: +36, rep: +1 }, note: '桥头试卖的二十碗粥卖完了。龚师傅指的那个口子，人是多。' } },
            then: [['z', '明早我端一锅粥去桥头，先试二十碗。'], ['gong', '我指给你哪个口子人多。那一站我闭到眼睛都报得出。']] },
          { label: '先不声张', hint: '照常做生意', fx: { set: ['gong_quiet'], later: { days: 3, fx: { rep: -1 }, note: '有人在门口说：站要撤了，老周早就晓得，就是不讲。' } },
            then: [['z', '先不说。月底……月底再看。'], ['gong', '随你。反正站牌上贴起的，认得字的都看得到。']] }
        ] },
        { fx: { aff: { gong: 1 } } },
        ['gong', '走了。明早六点零五，油条还是炸老点。'],
        { exit: 'gong' }
      ] }
    }
  };

  /* ───────────────────────── 小满 ───────────────────────── */
  var man = {
    first: '隔壁改衣的。站我门口数人，嘴里念念有词，一样不买。',
    usual: ['scallion', 'congee:温'],
    facts: {
      f_count: '小满站我门口数客人，数到十一个，扭头就回去了。',
      f_window: '我五点四十起油锅，她五点半就把后窗关死。',
      f_cough: '隔壁后窗糊了层报纸。豆豆说，他同桌糖糖又请假了。',
      f_tangtang: '白粥是给糖糖带的，要晾温。糖糖和豆豆是同桌。',
      f_smoke: '我的油烟顺着后窗灌进小满店里。糖糖气管不好。'
    },
    mementos: {
      m_drawing: { name: '糖糖的画', text: '蜡笔画的小馆，门口站个胖子。烟囱上没画烟。', kind: 'drawing' },
      m_curtain: { name: '蓝布门帘', text: '小满缝的。右下角留了一块空，等店名。', kind: 'cloth' }
    },
    beats: [
      { id: 'man1', need: { day: [3, 3] }, key: true, at: 0.5, act: 'peek', order: [],
        say: {
          in: '不买，我就看一哈。',
          chat: [['a', '九个，十个……十一个。'], ['z', '您数啥子？买东西里边请。'], ['a', '数人。量衣服量惯了，手痒。'], ['z', '那……量出来合不合身？'], ['a', '合身。就是领口紧了点。']],
          out: '回了，店里没人守。'
        },
        fx: { fact: ['man', 'f_count'] } },

      { id: 'man2', need: { day: [4, 6] }, key: true, at: 'early', act: 'peek', order: [],
        say: {
          in: '老周，你几点起油锅？',
          chat: [['z', '五点四十。吵到您了？'], ['a', '不吵。问个尺寸，好下剪子。'], ['z', '起锅的钟点也算尺寸？'], ['a', '算。那我五点半关后窗。'], ['z', '关窗？天又不冷。']],
          out: '十四锅了。我回了。'
        },
        fx: { fact: ['man', 'f_window'] } },

      { id: 'man3a', group: 'man_air', need: { day: [7, 11], oilAge: [3], not: ['hood'] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'zhao', line: '豆豆说，他那同桌又没来，咳嗽。' },
        fx: { fact: ['man', 'f_cough'], set: ['man_shut'] } },

      { id: 'man3b', group: 'man_air', need: { day: [7, 11] }, key: true, at: 'rush',
        order: ['scallion:嫩'],
        say: {
          in: '葱油饼一张，要嫩的。',
          chat: [['z', '今天咋个舍得进来了？'], ['a', '路过。后窗今天没关。'], ['z', '后窗？'], ['a', '没啥子。闻起是香的。'], ['a', '头一回，闻起是香的。']],
          good: '嗯，针脚匀。手艺不坏。', ok: '还行，差半寸火候。', bad: '煎过了，边上发苦。', slow: '店里没人守，快点嘛。', out: '钱放这儿了，不找。'
        },
        fx: { set: ['man_buys'] }, fxGood: { aff: { man: 1 } } },

      { id: 'man4', need: { day: [12, 22], oilAge: [3], not: ['hood'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '我不买。收了摊找你。',
          chat: [['z', '有事？现在说嘛。'], ['a', '当到客人，不好开口。'], ['z', '是不是我哪里得罪……'], ['a', '收了摊说。你手上饼要糊了。']],
          out: '我在隔壁等你。'
        },
        after: 'sc_man_knock' },

      { id: 'man5', need: { day: [12, 20], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '葱油饼，再打包碗粥。',
          chat: [['a', '粥晾一哈，娃儿喝。'], ['z', '糖糖？豆豆那个同桌？'], ['a', '你倒记得清。她最馋糖油果子。'], ['z', '那个我不会，没炸过。'], ['a', '明天我来教。比锁边简单。']],
          good: '温的，刚好端回去。', ok: '要得，凑合。', bad: '太烫了，她喝不得。', slow: '娃儿等到上学的！', out: '碗我下午拿来还。'
        },
        fx: { unlock: 'tangyou', fact: ['man', 'f_tangtang'], set: ['man_buys', 'man_congee'] },
        fxGood: { aff: { man: 1 } } },

      { id: 'man6', need: { day: [15, 23], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        note: '留碗粥晾起，糖糖要喝 —小满',
        say: {
          in: '老样子，打包。',
          chat: [['a', '糖糖跟豆豆是同桌。'], ['a', '画了张画，非要给你。'], ['z', '给我？画的啥子？'], ['a', '你这店。她问我咋不关窗了。'], ['a', '……粥晾好没？我赶时间。']],
          good: '她昨晚睡了个整觉。', ok: '行，温度够了。', bad: '烫的！你忘了？', slow: '她等到上学呢。', out: '画搁柜台上了，莫弄脏。'
        },
        leave: { memento: 'm_drawing', line: '零钱盒边上压着一张蜡笔画。' },
        fxGood: { aff: { man: 1 } } },

      { id: 'man7', need: { day: [18, 25], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        say: {
          in: '老样子。今天带了东西。',
          chat: [['a', '从前你一起锅，她就咳。'], ['z', '……是我的油烟？'], ['a', '现在不咳了。不说这个。'], ['a', '叶儿粑，我妈的方子，你尝。'], ['z', '我收了。明天学起来卖。']],
          good: '糖糖说粥有米油了。', ok: '要得。', bad: '今天粥稀了点。', slow: '我店里熨斗还烫着。', out: '你那门框，我量过了。'
        },
        fx: { unlock: 'yeerba', fact: ['man', 'f_smoke'], set: ['man_yeerba'] },
        fxGood: { aff: { man: 1 } } },

      { id: 'man8a', group: 'man_end', need: { day: [27, 28], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '一张饼，一碗粥晾温。',
          chat: [['a', '你那门帘，油都吃透了。'], ['a', '我裁了块新的，蓝布。'], ['z', '多少钱？我给。'], ['a', '提钱我就拿回去拆了。'], ['z', '……那我不提了。']],
          good: '吃了一个月，没吃腻。', ok: '行嘛。', bad: '月底了，手莫松。', slow: '不急，今天不赶活。', out: '收了摊莫走，等我。'
        },
        after: 'sc_man_curtain' },

      { id: 'man8b', group: 'man_end', need: { day: [27, 28] }, key: true, at: 'late',
        act: 'peek', order: [],
        say: {
          in: '听说你月底到期？',
          chat: [['z', '到期。续不续还没想好。'], ['a', '你要留下嘛，我有个条件。'], ['z', '您说。'], ['a', '油勤换。勤换，窗我就开。'], ['a', '糖糖……想喝你的粥。']],
          out: '我回了，针还插起的。'
        },
        fx: { set: ['man_closed'] } }
    ],
    barks: {
      in: ['葱油饼，打包。', '一张饼，一碗温粥。', '老样子，糖糖等到的。', '饼要软，莫煎硬了。'],
      inRain: ['落雨，窗本来就关起的。', '雨天活少，来坐一哈。', '伞搁门口了，滴水。'],
      inOilOld: ['今天我把窗关了。', '这油，该换了噻。', '味道飘过来了哈。'],
      inPriceUp: ['涨了？布也在涨。', '行嘛，都不容易。', '贵了，饼莫做小了。'],
      inPriceDown: ['便宜了？莫做亏了。', '你这是让利还是甩卖？', '省的钱给糖糖买本子。'],
      inBusy: ['今天二十几个了，我数的。', '人多，我等一哈。', '先紧到上班的。'],
      good: ['手艺不坏。', '糖糖喝得完。', '饼是软的，针脚匀。', '粥有米油了。'],
      ok: ['还行。', '还成，差半寸。', '将就。'],
      bad: ['饼煎苦了。', '粥太烫，她喝不得。', '今天不如昨天。'],
      slow: ['店里没人守。', '熨斗还烫起的！', '娃儿要迟到了。'],
      out: ['回了。', '碗下午还你。', '有活要赶。', '走了，针还插起的。']
    },
    epilogue: [
      { need: { flags: ['man_curtain'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '门帘右下角绣上了店名，蓝布白线。小满的后窗一直开着，糖糖趴在窗台上写作业，闻得见粥香。' },
      { need: { flags: ['man_curtain', 'left'] },
        text: '门帘卷起来，跟铺盖一起搬走了，右下角还空着。小满说，新店开在哪儿，她去量门框。' },
      { need: { flags: ['man_sealed'] },
        text: '小满的后窗封死了，店里白天也开着灯。糖糖不咳了。她没再来买过东西，也没再说什么。' },
      { need: { flags: ['man_congee'] },
        text: '小满还是每天来打包一碗白粥，要晾温的。糖糖长高了，碗自己端得稳了。' },
      { text: '隔壁的缝纫机每天响到天黑。早上五点半，那扇后窗照旧先关上。' }
    ],
    scenes: {
      sc_man_knock: { id: 'sc_man_knock', title: '后窗', when: 'close', light: 'dusk', beats: [
        { sfx: 'knock' },
        { enter: 'man', slot: 1 },
        ['n', '卷帘门刚拉一半，有人敲。小满手里攥着块湿毛巾，没进来。'],
        ['man', '老周，我量人量惯了，说话也直，你莫见怪。'],
        ['man', '你的油烟，顺着后窗往我店里灌。一早上没断过。'],
        ['z', '我当……我当您是嫌我抢生意。'],
        ['man', '抢啥子？我卖的是裤脚，你卖的是油条。'],
        ['man', '糖糖气管不好。你一起锅，她咳得跟拉风箱一样。'],
        ['z', '她咳……咳多久了？'],
        ['man', '我门口数的不是你客人，是你一早上炸了几锅。'],
        ['man', '油新那两天，她能睡个整觉。油一老，半夜就咳醒。'],
        ['z', '您该早点来说的。'],
        ['man', '你才开张，招牌还是白的。我张不开这个嘴。'],
        { fx: { fact: ['man', 'f_smoke'], set: ['man_knocked'] } },
        { choice: [
          { label: '明天就换油', hint: '订一桶新油', fx: { cash: -45, aff: { man: 1 }, set: ['man_promise'] },
            then: [['z', '明天就换。往后三天一换，抽屉里有张条子管着我。'], ['man', '好。那我先开条缝试试，看她咳不咳。']] },
          { label: '帮她封后窗', hint: '花三十，今晚干', fx: { cash: -30, set: ['man_sealed'] },
            then: [['z', '后窗我给您打胶封死，今晚就弄。'], ['man', '封了，店里就没得亮了。……封嘛。灯我多开一盏。']] },
          { label: '罩子再等等', hint: '眼下不花钱', fx: { aff: { man: -1 }, set: ['man_wait'] },
            then: [['z', '排烟罩要好几百。等我缓过这个月，行不？'], ['man', '行。那我接着关窗。毛巾我多打湿两条。']] }
        ] },
        { exit: 'man' }
      ] },

      sc_man_curtain: { id: 'sc_man_curtain', title: '门帘', when: 'close', light: 'dusk', beats: [
        { enter: 'man', slot: 1 },
        { enter: 'tangtang', slot: 2 },
        ['n', '小满抱着一卷蓝布进来，布边还挂着线头。糖糖跟在她后头。'],
        { prop: 'curtain', label: '蓝布门帘' },
        ['man', '旧那块油都吃透了，搓都搓不出本色。我换了。'],
        ['man', '你这门框我量了三回，左边比右边矮半公分。'],
        ['z', '何姨那时候就是歪的。我还当是我眼睛不好。'],
        ['tangtang', '周爷爷，右下角是空的！'],
        ['man', '留到绣店名的。你想好了，跟我说一声。'],
        ['z', '还没想好。想好了，头一个跟您说。'],
        { if: { flags: ['man_promise'] }, then: [['man', '你说换油，就真换了。我后窗开了半个月，记到的。']], else: [] },
        { if: { flags: ['hood'] }, then: [['man', '装了罩子那天起，我后窗就没关过。']], else: [] },
        ['z', '我嘴笨，不晓得咋个谢您。'],
        ['man', '莫谢。踩个凳子，挂上。'],
        { do: 'hold', label: '按住，把门帘挂上' },
        { fx: { memento: 'm_curtain', set: ['man_curtain'], aff: { man: 1 } } },
        ['tangtang', '妈妈，挂歪啦！'],
        ['man', '门框歪，帘子是正的。……明天我拿颗钉子来。'],
        { exit: 'tangtang' },
        { exit: 'man' }
      ] }
    }
  };

  /* ───────────────────────── 小郑 ───────────────────────── */
  var zheng = {
    first: '豆浆加煎蛋。本子摊在柜台上，问题比钱先掏出来。',
    usual: ['soy', 'egg'],
    facts: {
      f_cost: '小郑问我一根油条成本多少。我答不上来。',
      f_oilnote: '他问这锅油第几天了。我说了，他记在本子上。',
      f_photo: '他拍我的油锅，说油清得照得见人。',
      f_ge: '小郑请老葛吃过一碗面，问了他一下午。',
      f_video: '第十八天那条视频是小郑发的。他照实拍，照实写。',
      f_thesis: '他的毕业论文叫《一家早餐店的诚实成本》。写的是我。'
    },
    mementos: {
      m_page: { name: '落下的一页纸', text: '油条：面三毛一，油一毛八。人工那栏打了个问号。', kind: 'note' },
      m_photo: { name: '清晨的油锅', text: '小郑拍的。背面写着：数据都是真的，谢谢周叔。', kind: 'photo' }
    },
    beats: [
      { id: 'zheng1', need: { day: [5, 6] }, key: true, at: 0.6,
        order: ['soy', 'egg'],
        say: {
          in: '周叔早！豆浆，加个煎蛋。',
          chat: [['a', '周叔，我能问个冒昧的问题吗？'], ['z', '问嘛。莫问我岁数就行。'], ['a', '一根油条，成本多少钱？'], ['z', '……这个，没算过。'], ['a', '面、油、气、您的工。我帮您算？']],
          good: '蛋边是脆的，记一笔。', ok: '还行，七十分吧。', bad: '蛋煎老了，也记一笔。', slow: '周叔，我八点有课……', out: '明天还来，打扰了！'
        },
        fx: { fact: ['zheng', 'f_cost'] }, fxGood: { aff: { zheng: 1 } } },

      { id: 'zheng2a', group: 'zheng_fryer', need: { day: [8, 12], oilAge: [3] }, key: true, at: 0.6,
        order: ['soy'],
        say: {
          in: '今天只要豆浆，谢谢。',
          chat: [['z', '蛋不要了？今天鸡蛋新鲜。'], ['a', '周叔，这锅油第几天了？'], ['z', '……第三天吧。'], ['a', '好的。我记一下，不介意吧？'], ['a', '能拍张锅吗？就拍锅。']],
          good: '豆浆没问题，满分。', ok: '嗯，正常发挥。', bad: '豆浆也有点糊味。', slow: '不急，正好写两行。', out: '照片我不乱发，放心。'
        },
        fx: { fact: ['zheng', 'f_oilnote'], set: ['zheng_sawold'] } },

      { id: 'zheng2b', group: 'zheng_fryer', need: { day: [8, 12] }, key: true, at: 0.6,
        order: 'usual', hide: true,
        say: {
          in: '老样子！能拍张油锅吗？',
          chat: [['z', '油锅有啥子好拍的。'], ['a', '清的，能照见人。很出片。'], ['a', '冒昧问一下，您几天一换？'], ['z', '三天。何姨留的规矩。'], ['a', '这句太好了，我原话记下来。']],
          good: '脆边，跟上回一样稳。', ok: '可以，及格线以上。', bad: '今天蛋煎散了哎。', slow: '周叔，八点有课！', out: '照片回头洗给您！'
        },
        fx: { fact: ['zheng', 'f_photo'], set: ['zheng_sawfresh'] }, fxGood: { aff: { zheng: 1 } } },

      { id: 'zheng3', need: { day: [13, 17] }, key: true, at: 0.6,
        order: ['soy', 'egg', { wish: '顶饱' }],
        say: {
          in: '老样子，再来个顶饱的。',
          chat: [['a', '昨天请葛叔吃了碗面。'], ['z', '你认得老葛？'], ['a', '聊了一下午，他特别专业。'], ['a', '就是让我千万别写他名字。'], ['z', '写？你写啥子？']],
          good: '现做的，人工得算进去。', ok: '嗯，很稳定。', bad: '今天凉了半截。', slow: '我等，正好数数人。', out: '下午还要访谈，先走！'
        },
        leave: { memento: 'm_page', line: '他坐过的凳子上落了一页纸，是张成本表。' },
        fx: { fact: ['zheng', 'f_ge'] } },

      { id: 'zheng4', need: { day: [18, 18] }, key: true, act: 'absent', order: [],
        remark: { who: 'walkin', line: '拍视频那个，是不是个学生？' } },

      { id: 'zheng5', need: { day: [19, 19] }, key: true, act: 'absent', order: [],
        remark: { who: 'ge', line: '恕我多嘴，视频是小郑发的。' },
        fx: { fact: ['zheng', 'f_video'], set: ['zheng_known'] } },

      { id: 'zheng6a', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_good'] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '周叔……视频是我发的。',
          chat: [['z', '老葛说了。'], ['a', '我应该先问您的，对不起。'], ['z', '吃了再说。蛋还要脆边？'], ['a', '……要。'], ['a', '您真的不生气啊？']],
          good: '还是那个味，我没写错。', ok: '嗯，跟视频里一样。', bad: '今天不如视频里。', slow: '我等，多久都等。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_good' },

      { id: 'zheng6b', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_bad'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '周叔，视频……是我发的。',
          chat: [['z', '……嗯。晓得了。'], ['a', '我只是照实拍的，没剪。'], ['a', '没想到会有这么多人骂。'], ['z', '收了摊再说。你先站边上。']],
          out: '我在门口等您。'
        },
        after: 'sc_zheng_bad' },

      { id: 'zheng6c', group: 'zheng_viral', need: { day: [20, 23] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子。视频是我发的。',
          chat: [['z', '老葛说了，说没几个人看。'], ['a', '一千二百播放，不算少了。'], ['a', '评论区有人问粥多少钱。'], ['z', '那你告诉他嘛。'], ['a', '说了。还说了油三天一换。']],
          good: '脆边。我得补一条更新。', ok: '嗯，数据稳定。', bad: '今天这个，我也照记。', slow: '不急，我理理本子。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_plain' },

      { id: 'zheng7', need: { day: [25, 28] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子！论文交了！',
          chat: [['a', '附录全是您这一个月。'], ['a', '换了几回油，倒了几碗粥。'], ['z', '老师咋个说？'], ['a', '说数太碎。我说碎才是真的。'], ['a', '给您洗了张照片，别嫌丑。']],
          good: '这口我写进致谢了。', ok: '嗯，跟数据对得上。', bad: '今天这笔，我也照记。', slow: '不急，今天没课了。', out: '毕业了我还来吃！'
        },
        leave: { memento: 'm_photo', line: '零钱盒底下压着一张照片，背面有字。' },
        fx: { fact: ['zheng', 'f_thesis'], set: ['zheng_thesis'] }, fxGood: { aff: { zheng: 1 } } }
    ],
    barks: {
      in: ['周叔早！豆浆加煎蛋。', '老样子，蛋要脆边。', '周叔，今天油第几天？', '老样子，我坐角上写。'],
      inRain: ['下雨，客流会少两成吧？', '本子差点淋湿了。', '雨天的成本怎么算啊？'],
      inOilOld: ['今天不要煎的，谢谢。', '这锅颜色，我记一下。', '周叔，油该换了吧？'],
      inPriceUp: ['涨了五毛？我记一笔。', '涨价前后我都数人。', '学生党，有点肉疼。'],
      inPriceDown: ['降了？毛利还够吗？', '便宜归便宜，别省油。', '这价我得重新算。'],
      inBusy: ['排了十一个，我数的。', '人多，我先写两行。', '翻台率挺高啊。'],
      good: ['脆边，记一笔。', '跟昨天一样稳。', '这个蛋值这个价。', '豆浆是现磨的吧？'],
      ok: ['还行。', '及格。', '嗯，正常。'],
      bad: ['蛋老了。', '豆浆有糊味。', '这个我也得记。'],
      slow: ['八点有课……', '周叔，我要迟到了。', '等了六分钟，我掐的。'],
      out: ['明天还来！', '走了，上课去。', '周叔回见！', '打扰了，谢谢周叔。']
    },
    epilogue: [
      { need: { flags: ['zheng_redo'] },
        text: '小郑在同一个号上发了第二条：凌晨五点半，一锅旧油倒进桶里。论文里，这一天单独占了一页。' },
      { need: { flags: ['zheng_deleted'] },
        text: '视频删了，论文里那一章没删。小郑毕业那天来喝了碗豆浆，把本子留在柜台上，没说话。' },
      { need: { flags: ['zheng_thesis', 'viral_good'] },
        text: '答辩过了。附录第一页是那张油锅的照片，表格最后一栏写着“倒掉的油”。评语只有一句：数据可信。' },
      { need: { flags: ['zheng_thesis'] },
        text: '《一家早餐店的诚实成本》装订好了，他送来一本。致谢里写：感谢周叔，让我每天都有东西可记。' },
      { text: '那个带笔记本的学生毕了业。有人说在别的街上见过他，还是先点豆浆，再问成本。' }
    ],
    scenes: {
      sc_zheng_good: { id: 'sc_zheng_good', title: '是我发的', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他把手机扣在柜台上，屏幕朝下，像怕它自己亮起来。'],
        { prop: 'phone' },
        ['zheng', '周叔，我得跟您坦白一件事。我在写毕业论文。'],
        ['zheng', '题目叫《一家早餐店的诚实成本》。写的是您。'],
        ['z', '我？我有啥子好写的。诚实还要本钱？'],
        ['zheng', '要的。您换一回油，少挣四十。这是我算的。'],
        ['zheng', '我把这笔账拍出来了，一句好话都没加。'],
        ['z', '门口排队那些，都是看了那个来的？'],
        ['zheng', '对。昨天有个阿姨从城北过来的。'],
        ['z', '城北……那要转两趟车。'],
        ['zheng', '可我应该先问您的。这个我没做到。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '接着拍', hint: '往后都在镜头里', fx: { rep: +2, aff: { zheng: 1 }, set: ['zheng_open'] },
            then: [['z', '拍嘛。哪天油旧了，你也照拍，莫给我留面子。'], ['zheng', '那当然。周叔，这句我也能记吗？']] },
          { label: '到此为止', hint: '明天人少些', fx: { flowNext: 0.9, set: ['zheng_stop'] },
            then: [['z', '够了。我是卖早饭的，不是演戏的。'], ['zheng', '明白。论文里我不写店名，就写“某早餐店”。']] }
        ] },
        { prop: 'phone', off: true },
        { exit: 'zheng' }
      ] },

      sc_zheng_bad: { id: 'sc_zheng_bad', title: '照实拍的', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '卷帘门拉下一半，他还站在外头，弯着腰往里看。'],
        ['zheng', '周叔，对不起。真的对不起。'],
        ['zheng', '我拍的是第三天的油。没剪，也没配那些字。'],
        ['z', '我晓得。你没编。'],
        ['zheng', '我在写论文，《一家早餐店的诚实成本》。'],
        ['zheng', '我以为我写的是您省下的钱。'],
        ['zheng', '结果写成了客人替您付的那一部分。'],
        ['z', '底下那些评论，我戴起老花镜，一条一条看了。'],
        ['z', '胃药我兜里也揣着。在厂里吃了二十年回锅油。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '让他拍换油', hint: '明早倒掉这锅', fx: { cash: -45, burn: -6, aff: { zheng: 1 }, set: ['zheng_redo'] },
            then: [['z', '明早五点半来。拍我倒油，一滴都不留。'], ['zheng', '好。我发在同一个号上，前面那条不删。']] },
          { label: '请他删掉', hint: '视频下架', fx: { rep: -1, aff: { zheng: -1 }, set: ['zheng_deleted'] },
            then: [['z', '删了吧。我就一个月的短租，经不起。'], ['zheng', '我删。可是论文里……那一章我得留着。']] },
          { label: '不怪他', hint: '什么也不做', fx: { set: ['zheng_stays'] },
            then: [['z', '你没写错。回去吧，天黑了。'], ['zheng', '周叔，我明天还来吃。照样付钱。']] }
        ] },
        { exit: 'zheng' }
      ] },

      sc_zheng_plain: { id: 'sc_zheng_plain', title: '差一栏', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他把本子摊开，推到零钱盒边上。一页一页，记的全是我的油锅。'],
        { prop: 'notebook' },
        ['zheng', '周叔，坦白一下：我在写论文，写的就是您这店。'],
        ['zheng', '叫《一家早餐店的诚实成本》。名字有点大，我知道。'],
        ['z', '没几个人看的东西，也算论文？'],
        ['zheng', '视频没人看不要紧，账是真的就行。'],
        ['zheng', '葛叔帮我对过一遍数，他说一分不差。'],
        ['z', '老葛？他还会这个？'],
        ['zheng', '他以前是会计啊。您不知道？'],
        ['zheng', '现在就差一栏：您每天倒掉多少。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '把账给他看', hint: '进货价都在上面', fx: { aff: { zheng: 1 }, set: ['zheng_ledger'] },
            then: [['z', '账在抽屉里，第二格。莫弄乱了。'], ['zheng', '我抄完就还，一个字都不改。']] },
          { label: '只许问不许抄', hint: '账本不出抽屉', fx: { set: ['zheng_ask'] },
            then: [['z', '你问，我说。本子不出抽屉。'], ['zheng', '行。那我天天来问，您可别嫌我烦。']] }
        ] },
        { prop: 'notebook', off: true },
        { exit: 'zheng' }
      ] }
    }
  };

  /* ───────────────────────── 老秦 ───────────────────────── */
  var qin = {
    first: '三轮车停门口，裤脚带泥。每天最后一个来。',
    usual: ['noodle'],
    facts: {
      f_last: '老秦收了摊才来，吃的是我当天最后一碗。',
      f_hu: '批发商老胡的货车，天天堵在老秦的三轮前头。',
      f_kept: '涨价那几天我还要他的菜。他说：“我记到的。”',
      f_cart: '我买冻品那几天，他车上的菜剩了大半。',
      f_heyi: '老秦认得何姨。他落下的借条背面写着：不用还了。',
      f_cost: '他给我的价一直不够本。何姨帮过他，他在还。'
    },
    mementos: {
      m_pumpkin: { name: '老南瓜', text: '老秦自家地里的，放了一冬，皮上起了层白霜。', kind: 'food' },
      m_iou: { name: '一张旧借条', text: '“秦某借何某八百元。”背面一行：不用还了。', kind: 'paper' }
    },
    beats: [
      { id: 'qin1', need: { day: [6, 7] }, key: true, at: 'last',
        order: ['congee', 'scallion'],
        say: {
          in: '还有粥没得？再来张饼。',
          chat: [['z', '这个点才吃早饭？'], ['a', '收了摊才算完。'], ['a', '车上剩几个皮蛋，给你。'], ['z', '这咋个好意思……'], ['a', '何姨拿它熬粥。你也熬。']],
          good: '热的。要得。', ok: '垫一口，够了。', bad: '锅底的，我不挑。', slow: '不急，我收摊了。', out: '皮蛋搁灶台上了。'
        },
        fx: { unlock: 'pidan', fact: ['qin', 'f_last'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin2', need: { day: [8, 9] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '听说有面了？整一碗。',
          chat: [['a', '老胡的货车又堵我前头。'], ['z', '批发那个老胡？'], ['a', '他一车，顶我一个月。'], ['z', '那您咋个……'], ['a', '不说了。面要宽汤。']],
          good: '宽汤，热乎。往后就它。', ok: '要得。', bad: '面坨了。收摊的命。', slow: '不急，我收摊了。', out: '走了。明早四点起。'
        },
        fx: { fact: ['qin', 'f_hu'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin3a', group: 'qin_supply', need: { day: [10, 13], mat: [1] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '菜搁后门了。涨了几毛，对不住 —秦',
        say: {
          in: '老样子。秤我没压。',
          chat: [['a', '涨价的事，对不住。'], ['z', '菜都涨了，该涨就涨。'], ['a', '老胡那边便宜三成。'], ['z', '他的葱，叶子是黄的。'], ['a', '……你还要我的。我记到的。']],
          good: '嗯。今天面筋道。', ok: '行。', bad: '今天汤咸了。', slow: '不急。你先收拾。', out: '明早有嫩豆苗。'
        },
        fx: { set: ['qin_kept'], fact: ['qin', 'f_kept'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin3b', group: 'qin_supply', need: { day: [10, 13], mat: [0, 0] }, key: true, at: 'last',
        order: ['congee'],
        say: {
          in: '今天……来碗粥就行。',
          chat: [['z', '不吃面了？'], ['a', '粥就行。'], ['z', '车上还剩恁多菜？'], ['a', '天阴，今天走得慢。']],
          good: '热的。够了。', ok: '嗯。', bad: '……没事。', slow: '不急。我也没处去。', out: '走了。菜我推回去。'
        },
        fx: { fact: ['qin', 'f_cart'], set: ['qin_frozen'] } },

      { id: 'qin4a', group: 'qin_mid', need: { day: [14, 16], mat: [1], flags: ['qin_kept'] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '南瓜搁门口了，老的，甜 —秦',
        say: {
          in: '老样子。南瓜看到没？',
          chat: [['a', '自家地里的，放了一冬。'], ['z', '这个我得给钱。称一哈。'], ['a', '不卖。没上秤。'], ['a', '熬粥。何姨那时候也熬。']],
          good: '这面，吃得踏实。', ok: '行。', bad: '今天面软了。', slow: '你忙你的。', out: '南瓜莫削皮，蒸了剥。'
        },
        fx: { unlock: 'pumpkin', memento: 'm_pumpkin', set: ['qin_pumpkin'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin4b', group: 'qin_mid', need: { day: [14, 16], mat: [0, 0] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'gong', line: '咦，老秦那三轮今早没见到。' },
        fx: { set: ['qin_missed'] } },

      { id: 'qin5', need: { day: [17, 20] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '一碗面。啥子都不加。',
          chat: [['a', '今天剩了半车。'], ['z', '老胡又压价了？'], ['a', '他卖的比我进的还贱。'], ['z', '那他图啥子？'], ['a', '吃完。吃完我有话说。']],
          good: '热汤下去，好受点。', ok: '嗯。', bad: '……吃不出味。', slow: '不急。菜也不急了。', out: '你先收。我去推车。'
        },
        after: 'sc_qin_veg' },

      { id: 'qin6', need: { day: [21, 25] }, key: true, at: 'last',
        order: 'usual', hide: true,
        say: {
          in: '老样子。下午要落雨。',
          chat: [['a', '何姨来过信没得？'], ['z', '没有。您跟她熟？'], ['a', '认得。'], ['z', '咋个认得的？'], ['a', '……她那锅粥，救过急。']],
          good: '跟她那时候一个路子。', ok: '行。', bad: '她不这么下面。', slow: '不急。', out: '走了。车链子要修。'
        },
        leave: { memento: 'm_iou', line: '他坐的凳子底下落了张旧借条，折了四折。' },
        fx: { fact: ['qin', 'f_heyi'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin7a', group: 'qin_end', need: { day: [27, 28], mat: [1] }, key: true, at: 'last',
        order: ['noodle', 'egg'],
        say: {
          in: '一碗面。今天加个蛋。',
          chat: [['a', '借条你捡到了？'], ['z', '压在零钱盒底下。还您？'], ['a', '留你那儿。'], ['a', '老胡说收了摊来找我。'], ['z', '找您做啥子？']],
          good: '加了蛋，像过节。', ok: '行。', bad: '月底了，都累。', slow: '不急。等个人。', out: '我不走。等老胡。'
        },
        after: 'sc_qin_cost' },

      { id: 'qin7b', group: 'qin_end', need: { day: [27, 28], mat: [0, 0] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '面不吃了。说句话就走。',
          chat: [['a', '三轮我卖了。'], ['z', '卖了？那您明天……'], ['a', '收了摊莫急到关门。']],
          out: '我在门口抽根烟。'
        },
        after: 'sc_qin_home' }
    ],
    barks: {
      in: ['老样子。一碗面。', '收摊了，来碗宽汤面。', '还有面没得？', '最后一个，又是我。'],
      inRain: ['落雨，菜不好卖。', '雨衣搁门口了，滴水。', '淋了一早上，整口热的。'],
      inOilOld: ['面就行，炸的不要。', '油该换了。何姨三天一换。', '今天不加煎蛋。'],
      inPriceUp: ['涨了？菜也涨，没法子。', '该涨。你也要活。', '贵点行，料莫减。'],
      inPriceDown: ['这价，你够本没得？', '便宜了。莫学我。', '薄利？我懂。难。'],
      inBusy: ['这个点还有人？好事。', '我等等，先紧到别人。', '不急，我收摊了。'],
      good: ['宽汤，热乎。', '这碗踏实。', '嗯，一早上值了。', '面筋道。'],
      ok: ['行。', '垫一口。', '嗯。'],
      bad: ['面坨了。', '汤咸了。', '收摊的命，不挑。'],
      slow: ['不急。', '你先收拾。', '我坐一哈。'],
      out: ['走了。明早四点起。', '碗搁这儿了。', '回了，车还要推。', '明天要晴。']
    },
    epilogue: [
      { need: { flags: ['qin_paid'] },
        text: '差价补上了。三轮车每天清晨停在门口，菜带着露水。老秦把那张借条要了回去，贴在自己的秤盒里。' },
      { need: { flags: ['qin_stay'] },
        text: '三轮车赎回来了。老秦没回乡下，天不亮照旧来送菜，只是再也不肯少算一分钱。' },
      { need: { flags: ['qin_home'] },
        text: '老秦回了乡下。年底有人捎来一袋红薯，袋口拴着张纸条：自家地里的，不要钱。' },
      { need: { flags: ['qin_pumpkin'] },
        text: '三轮车还是每天清晨停在门口。南瓜粥成了秋天的招牌，菜单上那一行写的是“老秦的南瓜”。' },
      { text: '清晨的柳河街只剩老胡的货车。有人问起那辆三轮，卖菜的都说：早不来了。' }
    ],
    scenes: {
      sc_qin_veg: { id: 'sc_qin_veg', title: '半筐菜', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        ['n', '三轮车斜在门口，筐里的菜叶打了蔫。他没坐，站着。'],
        { prop: 'veg', label: '半筐菜' },
        ['qin', '卖不脱的。你拿去。'],
        ['z', '这一筐得有二十斤。我称一哈，给钱。'],
        ['qin', '莫称。明天就烂了，烂在哪儿都是烂。'],
        { if: { mat: [1] },
          then: [['qin', '你天天要我的，我才撑到今天。']],
          else: [['qin', '你现在用老胡的，我晓得。不怪你。'], ['z', '……老胡的便宜。我这个月，紧。']] },
        ['qin', '老胡跟我说，这条街往后归他送。'],
        ['z', '你咋个回他的？'],
        ['qin', '我说，我的菜是早上四点割的，露水还在上头。'],
        ['qin', '他笑。他车上那些，是前天割的。'],
        { choice: [
          { label: '照价给钱', hint: '花四十', need: { cash: [40] }, fx: { cash: -40, aff: { qin: 1 }, set: ['qin_veg_paid'] },
            then: [['z', '菜是菜，钱是钱。拿着，莫推。'], ['qin', '……那我明早多带一把葱。']] },
          { label: '收下，熬成粥', hint: '明天粥料省了', fx: { cash: +15, set: ['qin_veg_taken'] },
            then: [['z', '要得。明天粥里都是你的菜。'], ['qin', '嗯。莫糟蹋就行。']] },
          { label: '不能白要', hint: '菜他推回去', fx: { aff: { qin: -1 }, set: ['qin_veg_refused'] },
            then: [['z', '白拿你的，我夜里睡不着。推回去吧。'], ['qin', '推回去，也是喂鸡。']] }
        ] },
        { exit: 'qin' }
      ] },

      sc_qin_cost: { id: 'sc_qin_cost', title: '够本吗', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        { enter: 'hu', slot: 2 },
        ['n', '老胡的货车没熄火，就停在三轮后头，突突地抖。'],
        ['hu', '老秦，老哥，你给老周那个价，够本不？'],
        ['qin', '我的事。'],
        ['hu', '一斤亏两毛，亏了一个月。兄弟，图啥子嘛？'],
        ['hu', '老周，我那儿便宜的管够。票嘛，下回补。'],
        { exit: 'hu' },
        ['z', '……他说的是真的？'],
        ['qin', '秤是我的，我晓得。'],
        ['qin', '那年我女人住院，何姨赊了我半年早饭。'],
        ['qin', '还借我八百。后来她说，不用还了。'],
        ['qin', '这铺子哪个接，我就按那个价送。'],
        ['z', '我不是何姨。她那本粥谱，我都还没看全。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '补上差价', hint: '花一百二', need: { cash: [120] }, fx: { cash: -120, aff: { qin: 2 }, set: ['qin_paid'] },
            then: [['z', '这一个月的差价，你拿着。往后按市价。'], ['qin', '……要得。按市价，菜我挑好的给你。']] },
          { label: '往后按市价', hint: '进货贵一点', fx: { aff: { qin: 1 }, set: ['qin_fair'] },
            then: [['z', '从明天起按市价。亏本的菜，我吃不下去。'], ['qin', '你跟她一个脾气。']] },
          { label: '先这样吧', hint: '价钱照旧', fx: { set: ['qin_owed'] },
            then: [['z', '我这月也紧。先记着，行不？'], ['qin', '记啥子。本来就没打算要。']] }
        ] },
        { exit: 'qin' }
      ] },

      sc_qin_home: { id: 'sc_qin_home', title: '最后一筐', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        ['n', '门口没有三轮车。他是走着来的，裤脚上还是泥。'],
        ['qin', '下月不出摊了。回乡下。'],
        ['z', '是因为我换了老胡的货？'],
        ['qin', '不光你一家。整条街都换了。'],
        ['qin', '给你的价，我一直没敢涨够。'],
        ['z', '为啥子？您自己都不够本。'],
        ['qin', '何姨帮过我。这铺子，我当是她的。'],
        { prop: 'veg', label: '最后一筐菜' },
        ['qin', '最后一筐。地里的，没打药。'],
        ['z', '三轮呢？'],
        ['qin', '卖了，八十。骑了十一年。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '只要你的菜', hint: '花八十赎车', need: { cash: [80] }, fx: { cash: -80, aff: { qin: 2 }, set: ['qin_stay'] },
            then: [['z', '车我帮你赎回来。往后我只要你的菜。'], ['qin', '……我回去跟屋头商量。']] },
          { label: '买下这筐', hint: '花三十', need: { cash: [30] }, fx: { cash: -30, aff: { qin: 1 }, set: ['qin_home'] },
            then: [['z', '这筐我买，按你该卖的价。'], ['qin', '要得。头一回，按足价。']] },
          { label: '请他吃碗面', hint: '一碗面的料', fx: { cash: -4, set: ['qin_home'] },
            then: [['z', '坐。面我请，吃了再走。'], ['qin', '宽汤。跟头一回一样。']] }
        ] },
        { exit: 'qin' }
      ] }
    }
  };

  return { gong: gong, man: man, zheng: zheng, qin: qin };
});
