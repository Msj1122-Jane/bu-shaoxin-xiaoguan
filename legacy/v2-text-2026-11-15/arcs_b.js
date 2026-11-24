// 常客线 B：龚师傅 / 小满 / 小郑 / 老秦。格式见 docs/CONTENT_SPEC.md §5、§7。
// 自造旗标一律带前缀 gong_ / man_ / zheng_ / qin_。
BSX.define('content/arcs_b', function () {
  var FRESH = [{ flags: ['hood'] }, { oilAge: [0, 2] }];

  /* ───────────────────────── 龚师傅 ───────────────────────── */
  var gong = {
    first: '搪瓷茶缸，零钱正好，六点零五。',
    usual: ['soy', 'youtiao:老'],
    facts: {
      f_exact: '龚师傅的零钱总是数好的，一个钢镚不多。',
      f_tea: '煮茶叶蛋的茶叶是龚师傅带的。何姨那时候就这么煮。',
      f_oil: '油旧了他不说，只是不要油条了。',
      f_river: '柳河街从前是条河，填了才通的7路。',
      f_retire: '龚师傅二十七号退休，开最后一趟头班车。',
      f_route: '7路下月并线，柳河街这一站要撤。',
      f_morning: '退休头一天他八点半才来，不知道早晨该干什么。'
    },
    mementos: {
      m_notice: { name: '7路并线通知', text: '柳河街站那一行，被圆珠笔划了一道。', kind: 'paper' },
      m_mug: { name: '搪瓷茶缸', text: '缸底一圈茶垢，把手上缠着胶布。', kind: 'mug' }
    },
    beats: [
      { id: 'gong1', need: { day: [2, 3] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '豆浆灌缸里。油条炸老。',
          chat: [['a', '六点十分发车。'], ['z', '来得及。'], ['a', '要老，要脆。别焦。']],
          good: '嗯。是这个老法。', ok: '行。', bad: '老不是焦。', slow: '车不等人。', out: '钱正好。走了。'
        },
        fx: { fact: ['gong', 'f_exact'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong2', need: { day: [4, 7] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样。给你带了包茶。',
          chat: [['a', '何姨拿它煮茶叶蛋。'], ['z', '您认得何姨？'], ['a', '吃了她十一年早饭。'], ['a', '蛋壳敲裂了再煮。']],
          good: '火候跟上了。', ok: '还成。', bad: '今天炸嫩了。', slow: '还有四分钟。', out: '茶叶搁你灶边了。'
        },
        fx: { unlock: 'teaegg', fact: ['gong', 'f_tea'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong3a', group: 'gong_oil', need: { day: [9, 12], oilAge: [3] }, key: true, at: 'early',
        order: ['soy'],
        say: {
          in: '今天光灌豆浆。',
          chat: [['z', '油条不要了？'], ['a', '炸老的最吃油。'], ['a', '何姨三天一换。'], ['z', '……明天换。']],
          good: '豆浆没毛病。', ok: '嗯。', bad: '豆浆也不烫了。', slow: '算了，路上喝。', out: '换了油我再要。'
        },
        fx: { fact: ['gong', 'f_oil'], set: ['gong_sawold'] }, fxBad: { aff: { gong: -1 } } },

      { id: 'gong3b', group: 'gong_oil', need: { day: [9, 12] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子。',
          chat: [['a', '看见你倒油了。'], ['a', '清的，锅底照得见人。'], ['a', '从前这条河也照得见人。'], ['z', '后来呢？'], ['a', '后来填了，通了7路。']],
          good: '脆。一路都是香的。', ok: '行。', bad: '今天手生了？', slow: '车不等人。', out: '走了。明天见。'
        },
        fx: { fact: ['gong', 'f_river'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong4a', group: 'gong_slip', need: { day: [13, 15], priceAvg: [1.5] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'], act: 'coins',
        say: {
          in: '涨了？我重数一遍。',
          chat: [['a', '退休金可不涨。'], ['z', '您要退了？'], ['a', '二十七号。最后一趟。'], ['a', '没跟人说。你也别说。']],
          good: '贵两毛，值。', ok: '行吧。', bad: '贵了，还炸不老。', slow: '剩十几趟了，别误。', out: '这回也正好。'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong4b', group: 'gong_slip', need: { day: [13, 15] }, key: true, at: 'early',
        order: 'usual', hide: true,
        say: {
          in: '老样子。',
          chat: [['a', '二十七号你开门不？'], ['z', '开。怎么了？'], ['a', '没什么。最后一趟。'], ['z', '……要退了？'], ['a', '到点了。别声张。']],
          good: '嗯。还能吃十几回。', ok: '行。', bad: '今天不脆。', slow: '车不等人，我也不等。', out: '六点零九。走了。'
        },
        fx: { set: ['gong_retire'], fact: ['gong', 'f_retire'] }, fxGood: { aff: { gong: 1 } } },

      { id: 'gong5', need: { day: [16, 17] }, key: true, act: 'absent', order: [],
        remark: { who: 'zhao', line: '老龚今天没开头班车。' } },

      { id: 'gong6', need: { day: [19, 23] }, key: true, at: 'early',
        order: ['soy', 'youtiao:老'],
        say: {
          in: '老两样。那天去签字了。',
          chat: [['a', '7路下月并线。'], ['a', '柳河街这站，不停了。'], ['z', '那早上这些人？'], ['a', '走到桥头去坐。'], ['a', '收了车我再来一趟。']],
          good: '站撤了，这口撤不了。', ok: '行。', bad: '心里有事，吃不出。', slow: '走了，车上吃。', out: '站牌上也贴了。'
        },
        leave: { memento: 'm_notice', line: '柜台上落了张并线通知。' },
        fx: { set: ['gong_route'], fact: ['gong', 'f_route'] },
        after: 'sc_gong_route' },

      { id: 'gong7', need: { day: [27, 27] }, key: true, at: 'early',
        order: 'usual', hide: true, act: 'treat',
        note: '二十七号早点开门。最后一趟 —龚',
        say: {
          in: '最后一趟。老样子。',
          chat: [['a', '后面那学生算我的。'], ['a', '坐了我三年车。'], ['a', '老赵爷孙俩，你多照看。'], ['z', '……嗯。'], ['a', '今天不用找零。']],
          good: '嗯。记住这个味了。', ok: '行。够了。', bad: '最后一回，也没炸老。', slow: '今天……让车等一回。', out: '六点十分。发车。'
        },
        fxGood: { aff: { gong: 1 } } },

      { id: 'gong8', need: { day: [28, 28] }, key: true, at: 'late',
        order: [{ wish: '汤水' }, 'youtiao:老'],
        say: {
          in: '八点半了。来口带汤的。',
          chat: [['a', '四点半就醒了。'], ['a', '走到车场才想起来。'], ['z', '坐。今天不赶。'], ['a', '不赶了，倒不会点了。'], ['a', '茶缸先放你这儿。']],
          good: '原来早饭能坐着吃。', ok: '慢慢吃，是这个味。', bad: '不赶车，也挑不出啥。', slow: '不急。我今天不急。', out: '明天……还这个点。'
        },
        leave: { memento: 'm_mug', line: '茶缸留在架子上，没带走。' },
        fx: { fact: ['gong', 'f_morning'], set: ['gong_mug'] }, fxGood: { aff: { gong: 1 } } }
    ],
    barks: {
      in: ['老样子。', '豆浆灌缸里。', '油条炸老，零钱正好。', '六点零五，没晚吧。'],
      inRain: ['雨天，车得慢着开。', '雨刷又该换了。', '这雨，从前河要涨的。'],
      inOilOld: ['今天油条少炸一根。', '锅里颜色深了。', '何姨三天一换。'],
      inPriceUp: ['涨了？我重数。', '多两毛，零钱得另备。', '贵了，炸老点才值。'],
      inPriceDown: ['便宜了？别亏着。', '零钱多出两毛。', '薄利，油也得换。'],
      inBusy: ['人多，我掐着表呢。', '都排到站牌了。', '先给赶车的做。'],
      good: ['脆。', '嗯，老得正好。', '这一口，顶一上午。', '没毛病。'],
      ok: ['行。', '还成。', '凑合。'],
      bad: ['老不是焦。', '今天炸嫩了。', '豆浆不烫。'],
      slow: ['车不等人。', '还有三分钟。', '算了，路上吃。'],
      out: ['走了。', '六点零九。', '明天见。', '发车了。']
    },
    epilogue: [
      { need: { flags: ['gong_mug', 'gong_bridge'], not: ['left'] },
        text: '7路并了线。桥头多了张折叠桌，老周卖粥，龚师傅坐在边上指人多的口，茶缸搁在桌角。' },
      { need: { flags: ['gong_mug'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '茶缸还在架子上。龚师傅每天八点半来，坐着喝完一碗粥，再走到桥头，看别人开他的7路。' },
      { need: { flags: ['gong_mug', 'left'] },
        text: '茶缸你带走了。龚师傅说，新铺子开在哪儿他就坐哪路车去，反正现在有的是早晨。' },
      { need: { flags: ['gong_retire'] },
        text: '7路并了线，柳河街的站牌拆了。有人看见龚师傅清早还在老地方站着，站一会儿就走。' },
      { text: '7路头班车换了司机，六点十分照样过站，再没有人下来灌一缸豆浆。' }
    ],
    scenes: {
      sc_gong_route: { id: 'sc_gong_route', title: '并线通知', when: 'close', light: 'dusk', beats: [
        { enter: 'gong', slot: 1 },
        ['n', '傍晚，龚师傅没穿制服。'],
        ['gong', '通知落你这儿了。留着吧。'],
        { prop: 'paper', label: '并线通知' },
        ['gong', '下月起，早上那拨人不从这儿过了。'],
        ['z', '……少多少？'],
        ['gong', '我车上每天四十来个，一半在这站下。'],
        ['gong', '何姨那年修路，也是这么熬过来的。'],
        ['z', '她怎么熬的？'],
        ['gong', '把粥端到桥头去卖。就这么笨。'],
        { choice: [
          { label: '贴在门口', hint: '明天客流少一点', fx: { rep: +2, flowNext: 0.92, set: ['gong_told'] },
            then: [['z', '贴门口吧。街坊早晚要知道。'], ['gong', '嗯。老实人的办法。']] },
          { label: '去桥头试卖', hint: '多备二十碗料', fx: { cash: -20, set: ['gong_bridge'], later: { days: 2, fx: { cash: +36, rep: +1 }, note: '桥头试卖的二十碗粥，卖完了。' } },
            then: [['z', '明早我端一锅粥去桥头试试。'], ['gong', '我指给你，哪个口人多。']] },
          { label: '先不声张', hint: '照常做生意', fx: { set: ['gong_quiet'], later: { days: 3, fx: { rep: -1 }, note: '有人说：站要撤了，老周早知道。' } },
            then: [['z', '先不说。月底再看。'], ['gong', '随你。站牌上反正贴着。']] }
        ] },
        { fx: { aff: { gong: 1 } } },
        { exit: 'gong' }
      ] }
    }
  };

  /* ───────────────────────── 小满 ───────────────────────── */
  var man = {
    first: '隔壁改衣的。站门口数人，没买。',
    usual: ['scallion', 'congee:温'],
    facts: {
      f_count: '小满站在门口数客人，数到十一个就回去了。',
      f_window: '你五点四十起油锅，她五点半关后窗。',
      f_cough: '隔壁后窗糊了报纸。豆豆说糖糖又请假了。',
      f_tangtang: '白粥是给糖糖带的，要晾温。糖糖和豆豆是同桌。',
      f_smoke: '油烟顺着后窗飘进小满店里。糖糖气管不好。'
    },
    mementos: {
      m_drawing: { name: '糖糖的画', text: '蜡笔画的小馆。烟囱上没画烟。', kind: 'drawing' },
      m_curtain: { name: '蓝布门帘', text: '小满缝的。右下角留了块空，等店名。', kind: 'cloth' }
    },
    beats: [
      { id: 'man1', need: { day: [3, 3] }, key: true, at: 0.5, act: 'peek', order: [],
        say: {
          in: '不买。我看看。',
          chat: [['a', '九、十、十一。'], ['z', '您数什么呢？'], ['a', '数人。生意不错。']],
          out: '回了，店里没人。'
        },
        fx: { fact: ['man', 'f_count'] } },

      { id: 'man2', need: { day: [4, 6] }, key: true, at: 'early', act: 'peek', order: [],
        say: {
          in: '你几点起油锅？',
          chat: [['z', '五点四十。吵着您了？'], ['a', '不吵。'], ['a', '那我五点半关后窗。'], ['z', '关窗？'], ['a', '没事。你忙。']],
          out: '今天炸了十四锅。'
        },
        fx: { fact: ['man', 'f_window'] } },

      { id: 'man3a', group: 'man_air', need: { day: [7, 11], oilAge: [3], not: ['hood'] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'zhao', line: '豆豆说糖糖又请假了。' },
        fx: { fact: ['man', 'f_cough'], set: ['man_shut'] } },

      { id: 'man3b', group: 'man_air', need: { day: [7, 11] }, key: true, at: 'rush',
        order: ['scallion:嫩'],
        say: {
          in: '葱油饼，要一张嫩的。',
          chat: [['a', '今天后窗没关。'], ['z', '啊？'], ['a', '没什么。闻着是香的。'], ['a', '头一回闻着是香的。']],
          good: '嗯。手艺不坏。', ok: '还行。', bad: '煎过了，发苦。', slow: '店里没人看，快点。', out: '钱放这儿了。'
        },
        fx: { set: ['man_buys'] }, fxGood: { aff: { man: 1 } } },

      { id: 'man4', need: { day: [12, 22], oilAge: [3], not: ['hood'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '我不买。收摊找你。',
          chat: [['z', '有事？'], ['a', '收了摊说。'], ['a', '当着客人，不好开口。']],
          out: '我在隔壁等。'
        },
        after: 'sc_man_knock' },

      { id: 'man5', need: { day: [12, 20], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '葱油饼。再打包一碗粥。',
          chat: [['a', '粥晾一下，孩子喝。'], ['z', '糖糖？'], ['a', '她最馋糖油果子。'], ['a', '你不会？明天我教你。']],
          good: '温的，正好端回去。', ok: '行。', bad: '太烫，她喝不了。', slow: '孩子等着上学。', out: '碗我下午还。'
        },
        fx: { unlock: 'tangyou', fact: ['man', 'f_tangtang'], set: ['man_buys', 'man_congee'] },
        fxGood: { aff: { man: 1 } } },

      { id: 'man6', need: { day: [15, 23], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        note: '留一碗粥晾着，给糖糖 —小满',
        say: {
          in: '老样子，打包。',
          chat: [['a', '糖糖跟豆豆是同桌。'], ['a', '她画了张画，非要给你。'], ['a', '还问我今天怎么不关窗。'], ['z', '关窗？'], ['a', '……粥晾好了没？']],
          good: '她昨晚睡了个整觉。', ok: '行，够温。', bad: '烫。你忘了？', slow: '她等着上学呢。', out: '画搁柜台上了。'
        },
        leave: { memento: 'm_drawing', line: '柜台上压着一张蜡笔画。' },
        fxGood: { aff: { man: 1 } } },

      { id: 'man7', need: { day: [18, 25], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: 'usual', hide: true, togo: true,
        say: {
          in: '老样子。',
          chat: [['a', '从前你一起锅，她就咳。'], ['z', '……是油烟？'], ['a', '现在不了。不说了。'], ['a', '带了叶儿粑，你尝。'], ['a', '馅是我妈的方子。']],
          good: '糖糖说粥有米油了。', ok: '行。', bad: '今天粥稀了。', slow: '我店里还烫着熨斗。', out: '你那门框，我量了。'
        },
        fx: { unlock: 'yeerba', fact: ['man', 'f_smoke'], set: ['man_yeerba'] },
        fxGood: { aff: { man: 1 } } },

      { id: 'man8a', group: 'man_end', need: { day: [27, 28], flags: ['man_congee'], any: FRESH }, key: true, at: 'rush',
        order: ['scallion', 'congee:温'], togo: true,
        say: {
          in: '饼一张，粥一碗，晾温。',
          chat: [['a', '你那门帘油透了。'], ['a', '我缝了块新的。'], ['z', '多少钱？'], ['a', '提钱我就拿回去。']],
          good: '吃了一个月，没腻。', ok: '行。', bad: '月底了，手别松。', slow: '不急，今天不赶活。', out: '收摊别走，等我。'
        },
        after: 'sc_man_curtain' },

      { id: 'man8b', group: 'man_end', need: { day: [27, 28] }, key: true, at: 'late',
        act: 'peek', order: [],
        say: {
          in: '听说你月底到期。',
          chat: [['z', '嗯。还没定。'], ['a', '你要是留下，'], ['a', '油勤换，窗我就开。'], ['a', '糖糖想喝你的粥。']],
          out: '我回了。针还插着呢。'
        },
        fx: { set: ['man_closed'] } }
    ],
    barks: {
      in: ['葱油饼，打包。', '一张饼，一碗温粥。', '老样子。糖糖等着。', '饼要软的。'],
      inRain: ['下雨，窗本来就关着。', '雨天活少，我来坐坐。', '伞搁门口了。'],
      inOilOld: ['今天我关窗了。', '这油，该换了吧。', '味儿飘过来了。'],
      inPriceUp: ['涨了？布也涨了。', '行吧，都不容易。', '贵了，饼别小。'],
      inPriceDown: ['便宜了？别做亏了。', '你这是让利还是甩卖？', '省下的给糖糖买本子。'],
      inBusy: ['今天二十几个了。', '人多，我等等。', '先紧着上班的。'],
      good: ['手艺不坏。', '糖糖能喝完。', '嗯，饼是软的。', '粥有米油。'],
      ok: ['行。', '还成。', '差点意思。'],
      bad: ['饼煎苦了。', '粥太烫，她喝不了。', '今天不如昨天。'],
      slow: ['店里没人看。', '熨斗还烫着呢。', '孩子要迟到了。'],
      out: ['回了。', '碗我下午还。', '有活要赶。', '走了，针还插着。']
    },
    epilogue: [
      { need: { flags: ['man_curtain'], any: [{ flags: ['renewed'] }, { flags: ['chipin'] }] },
        text: '门帘右下角绣上了店名，蓝布白线。小满的后窗一直开着，糖糖趴在窗台上写作业，闻得见粥香。' },
      { need: { flags: ['man_curtain', 'left'] },
        text: '门帘你卷起来带走了，右下角还空着。小满说，新店开在哪儿，她去量门框。' },
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
        ['n', '她手里攥着一块湿毛巾。'],
        ['man', '老周，我直说了。'],
        ['man', '你的油烟，顺着后窗进我店里。'],
        ['man', '糖糖气管不好，一呛就咳半宿。'],
        ['z', '……我当你是嫌我抢生意。'],
        ['man', '我数的不是人，是你炸了多少锅。'],
        ['man', '油新那两天，她能睡个整觉。'],
        ['z', '你怎么不早说。'],
        ['man', '你刚开张。我张不开嘴。'],
        { fx: { fact: ['man', 'f_smoke'], set: ['man_knocked'] } },
        { choice: [
          { label: '明天就换油', hint: '订一桶新油', fx: { cash: -45, aff: { man: 1 }, set: ['man_promise'] },
            then: [['z', '明天换。往后三天一换。'], ['man', '行。那我开窗试试。']] },
          { label: '帮她封后窗', hint: '花三十，今晚干', fx: { cash: -30, set: ['man_sealed'] },
            then: [['z', '后窗我给你打胶封上。'], ['man', '封了店里就没亮了。……封吧。']] },
          { label: '罩子再等等', hint: '眼下不花钱', fx: { aff: { man: -1 }, set: ['man_wait'] },
            then: [['z', '排烟罩要钱。等我缓过这个月。'], ['man', '嗯。那我接着关窗。']] }
        ] },
        { exit: 'man' }
      ] },

      sc_man_curtain: { id: 'sc_man_curtain', title: '门帘', when: 'close', light: 'dusk', beats: [
        { enter: 'man', slot: 1 },
        { enter: 'tangtang', slot: 2 },
        ['n', '她抱着一卷蓝布，针脚还带着线头。'],
        { prop: 'curtain', label: '蓝布门帘' },
        ['man', '旧的那块，油都浸透了。'],
        ['man', '量了三回。你这门框是歪的。'],
        ['z', '何姨那时候就歪。'],
        ['tangtang', '周爷爷，右下角是空的！'],
        ['man', '留着绣店名。想好了告诉我。'],
        { if: { flags: ['man_promise'] }, then: [['man', '你说换油，就真换了。我记着。']], else: [] },
        { if: { flags: ['hood'] }, then: [['man', '装了罩子那天起，我没再关过窗。']], else: [] },
        ['z', '……我不会说话。'],
        ['man', '不用说。挂上。'],
        { do: 'hold', label: '按住，把门帘挂上' },
        { fx: { memento: 'm_curtain', set: ['man_curtain'], aff: { man: 1 } } },
        ['tangtang', '挂歪啦！'],
        ['man', '门框歪，帘子是正的。'],
        { exit: 'tangtang' },
        { exit: 'man' }
      ] }
    }
  };

  /* ───────────────────────── 小郑 ───────────────────────── */
  var zheng = {
    first: '豆浆加煎蛋。本子摊在柜台上。',
    usual: ['soy', 'egg'],
    facts: {
      f_cost: '小郑问过：一根油条成本多少。你答不上来。',
      f_oilnote: '他问这锅油第几天了，记在了本子上。',
      f_photo: '他拍油锅，说油清得照得见人。',
      f_ge: '小郑请老葛吃过一碗面，问了他一下午。',
      f_video: '第十八天那条视频是小郑发的。他照实拍，照实写。',
      f_thesis: '他的毕业论文叫《一家早餐店的诚实成本》。'
    },
    mementos: {
      m_page: { name: '落下的一页纸', text: '油条：面三毛一，油一毛八。人工那栏打了个问号。', kind: 'note' },
      m_photo: { name: '清晨的油锅', text: '小郑拍的。背面写着：数据都是真的，谢谢周叔。', kind: 'photo' }
    },
    beats: [
      { id: 'zheng1', need: { day: [5, 6] }, key: true, at: 0.6,
        order: ['soy', 'egg'],
        say: {
          in: '豆浆，加个煎蛋。',
          chat: [['a', '周叔，一根油条成本多少？'], ['z', '……没算过。'], ['a', '面、油、煤气、您的工。'], ['a', '我替您算算？']],
          good: '蛋边是脆的。记一笔。', ok: '还行。', bad: '蛋煎老了。也记一笔。', slow: '八点有课。', out: '明天还来。'
        },
        fx: { fact: ['zheng', 'f_cost'] }, fxGood: { aff: { zheng: 1 } } },

      { id: 'zheng2a', group: 'zheng_fryer', need: { day: [8, 12], oilAge: [3] }, key: true, at: 0.6,
        order: ['soy'],
        say: {
          in: '今天只要豆浆。',
          chat: [['z', '蛋不要了？'], ['a', '周叔，这锅油第几天了？'], ['z', '……第三天吧。'], ['a', '我记一下。能拍张照吗？']],
          good: '豆浆是好的。', ok: '嗯。', bad: '豆浆也有点糊味。', slow: '不急，正好写两行。', out: '照片我不乱发。'
        },
        fx: { fact: ['zheng', 'f_oilnote'], set: ['zheng_sawold'] } },

      { id: 'zheng2b', group: 'zheng_fryer', need: { day: [8, 12] }, key: true, at: 0.6,
        order: 'usual', hide: true,
        say: {
          in: '老样子。能拍张油锅吗？',
          chat: [['z', '油有啥好拍。'], ['a', '清的，照得见人。'], ['a', '您几天一换？'], ['z', '三天。何姨留的规矩。'], ['a', '这句我记下了。']],
          good: '脆边。跟上回一样。', ok: '行。', bad: '今天蛋煎散了。', slow: '八点有课，周叔。', out: '照片回头洗给您。'
        },
        fx: { fact: ['zheng', 'f_photo'], set: ['zheng_sawfresh'] }, fxGood: { aff: { zheng: 1 } } },

      { id: 'zheng3', need: { day: [13, 17] }, key: true, at: 0.6,
        order: ['soy', 'egg', { wish: '顶饱' }],
        say: {
          in: '老样子。再加个顶饱的。',
          chat: [['a', '昨天请葛叔吃了碗面。'], ['z', '你认得老葛？'], ['a', '问了他一下午。'], ['a', '他让我别写名字。'], ['z', '写？写什么？']],
          good: '现做的，得算工钱。', ok: '行。', bad: '今天凉了半截。', slow: '我等。正好数数人。', out: '走了，下午还得问人。'
        },
        leave: { memento: 'm_page', line: '凳子上落了一页纸，是成本表。' },
        fx: { fact: ['zheng', 'f_ge'] } },

      { id: 'zheng4', need: { day: [18, 18] }, key: true, act: 'absent', order: [],
        remark: { who: 'walkin', line: '发视频的是不是个学生？' } },

      { id: 'zheng5', need: { day: [19, 19] }, key: true, act: 'absent', order: [],
        remark: { who: 'ge', line: '小郑两天没来。是他发的。' },
        fx: { fact: ['zheng', 'f_video'], set: ['zheng_known'] } },

      { id: 'zheng6a', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_good'] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '周叔。视频是我发的。',
          chat: [['z', '老葛说了。'], ['a', '我没先问您。'], ['z', '吃了再说。蛋要脆边？'], ['a', '……要。']],
          good: '还是那个味。我没写错。', ok: '嗯。', bad: '今天不如视频里。', slow: '我等。多久都等。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_good' },

      { id: 'zheng6b', group: 'zheng_viral', need: { day: [20, 23], flags: ['viral_bad'] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '周叔。视频是我发的。',
          chat: [['z', '……嗯。'], ['a', '我只是照实拍的。'], ['a', '没想到会这样。'], ['z', '收摊再说。']],
          out: '我在门口等。'
        },
        after: 'sc_zheng_bad' },

      { id: 'zheng6c', group: 'zheng_viral', need: { day: [20, 23] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子。视频是我发的。',
          chat: [['z', '老葛说了。没几个人看。'], ['a', '一千二百个。'], ['a', '有人问粥多少钱一碗。'], ['z', '吃你的蛋。']],
          good: '脆边。我得补一句。', ok: '嗯。', bad: '今天这个，我也照记。', slow: '不急。我理理本子。', out: '收摊我再来一趟。'
        },
        after: 'sc_zheng_plain' },

      { id: 'zheng7', need: { day: [25, 28] }, key: true, at: 'late',
        order: 'usual', hide: true,
        say: {
          in: '老样子。论文交了。',
          chat: [['a', '附录是您这一个月。'], ['a', '油换了几回，倒了几碗。'], ['z', '老师怎么说？'], ['a', '说数太碎。我说碎才真。'], ['a', '洗了张照片给您。']],
          good: '这口我写进致谢了。', ok: '嗯。跟数对得上。', bad: '今天这笔，我也照记。', slow: '不急。今天没课了。', out: '毕了业我还来。'
        },
        leave: { memento: 'm_photo', line: '零钱盒下压着一张照片。' },
        fx: { fact: ['zheng', 'f_thesis'], set: ['zheng_thesis'] }, fxGood: { aff: { zheng: 1 } } }
    ],
    barks: {
      in: ['豆浆，加个煎蛋。', '老样子。蛋要脆边。', '周叔，今天油第几天？', '老样子。我坐角上写。'],
      inRain: ['下雨，客流少两成吧？', '本子差点淋了。', '雨天的成本怎么算？'],
      inOilOld: ['今天不要煎的。', '这锅颜色，我记一下。', '周叔，油该换了吧。'],
      inPriceUp: ['涨了五毛？我记一笔。', '涨价前后，我都数人。', '学生党，肉疼。'],
      inPriceDown: ['降了？毛利还够吗？', '便宜归便宜，别省油。', '这价我得重算。'],
      inBusy: ['排了十一个。我数的。', '人多，我先写两行。', '翻台挺快。'],
      good: ['脆边。记一笔。', '跟昨天一样稳。', '这蛋值这个价。', '豆浆是现磨的。'],
      ok: ['还行。', '及格。', '嗯。'],
      bad: ['蛋老了。', '豆浆有糊味。', '这个我也得记。'],
      slow: ['八点有课。', '周叔，要迟到了。', '等了六分钟，我掐的。'],
      out: ['明天还来。', '走了，上课。', '本子我带走了。', '周叔回见。']
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
        ['n', '他把手机扣在柜台上，屏幕朝下。'],
        { prop: 'phone' },
        ['zheng', '周叔，我在写毕业论文。'],
        ['zheng', '题目叫《一家早餐店的诚实成本》。'],
        ['z', '诚实还有成本？'],
        ['zheng', '有。您换一回油，少挣四十。'],
        ['zheng', '我把这笔账拍出来了，没加一句好话。'],
        ['z', '门口排队的，都是看了那个来的？'],
        ['zheng', '是。可我该先问您的。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '接着拍', hint: '往后都在镜头里', fx: { rep: +2, aff: { zheng: 1 }, set: ['zheng_open'] },
            then: [['z', '拍吧。油哪天旧了，你也照拍。'], ['zheng', '那是自然。']] },
          { label: '到此为止', hint: '明天人少些', fx: { flowNext: 0.9, set: ['zheng_stop'] },
            then: [['z', '够了。我是卖早饭的，不是演的。'], ['zheng', '好。论文里我不写店名。']] }
        ] },
        { prop: 'phone', off: true },
        { exit: 'zheng' }
      ] },

      sc_zheng_bad: { id: 'sc_zheng_bad', title: '照实拍的', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他一直站到卷帘门拉下一半。'],
        ['zheng', '周叔，对不起。'],
        ['zheng', '我拍的是第三天的油。我没编。'],
        ['z', '没编。'],
        ['zheng', '我在写论文，《一家早餐店的诚实成本》。'],
        ['zheng', '我以为写的是您省下的钱。'],
        ['zheng', '结果写成了客人替您付的那部分。'],
        ['z', '……胃药我兜里也有。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '让他拍换油', hint: '明早倒掉这锅', fx: { cash: -45, burn: -6, aff: { zheng: 1 }, set: ['zheng_redo'] },
            then: [['z', '明早五点半来。拍我倒油。'], ['zheng', '我发。发在同一个号上。']] },
          { label: '请他删掉', hint: '视频下架', fx: { rep: -1, aff: { zheng: -1 }, set: ['zheng_deleted'] },
            then: [['z', '删了吧。我只有一个月的短租。'], ['zheng', '我删。可论文里得留着。']] },
          { label: '不怪他', hint: '什么也不做', fx: { set: ['zheng_stays'] },
            then: [['z', '你没写错。回去吧。'], ['zheng', '周叔，我明天还来吃。']] }
        ] },
        { exit: 'zheng' }
      ] },

      sc_zheng_plain: { id: 'sc_zheng_plain', title: '差一栏', when: 'close', light: 'dusk', beats: [
        { enter: 'zheng', slot: 1 },
        ['n', '他把本子摊开，推到零钱盒边上。'],
        { prop: 'notebook' },
        ['zheng', '周叔，我在写论文。写您这店。'],
        ['zheng', '《一家早餐店的诚实成本》。'],
        ['z', '没几个人看的东西，也算论文？'],
        ['zheng', '视频没人看不要紧。账是真的就行。'],
        ['zheng', '葛叔帮我对过一遍数，一分不差。'],
        ['zheng', '还差一栏：您每天倒掉多少。'],
        { fx: { fact: ['zheng', 'f_thesis'] } },
        { choice: [
          { label: '把账给他看', hint: '进货价都在上面', fx: { aff: { zheng: 1 }, set: ['zheng_ledger'] },
            then: [['z', '账在抽屉里。别弄乱。'], ['zheng', '我抄完就还，一个字不改。']] },
          { label: '只许问不许抄', hint: '账本不出抽屉', fx: { set: ['zheng_ask'] },
            then: [['z', '你问，我说。本子不给。'], ['zheng', '行。那我天天来问。']] }
        ] },
        { prop: 'notebook', off: true },
        { exit: 'zheng' }
      ] }
    }
  };

  /* ───────────────────────── 老秦 ───────────────────────── */
  var qin = {
    first: '三轮车停门口，最后一个来。',
    usual: ['noodle'],
    facts: {
      f_last: '老秦收了摊才来，吃的是当天最后一碗。',
      f_hu: '批发商老胡的货车，天天堵在老秦的三轮前头。',
      f_kept: '涨价那几天你还要他的菜。他说“我记着”。',
      f_cart: '你买冻品那几天，他车上的菜剩了大半。',
      f_heyi: '老秦认得何姨。借条背面写着：不用还了。',
      f_cost: '他给你的价一直不够本。何姨帮过他，他在还。'
    },
    mementos: {
      m_pumpkin: { name: '老南瓜', text: '老秦自家地里的，放了一冬，皮上挂着霜。', kind: 'food' },
      m_iou: { name: '一张旧借条', text: '“秦某借何某八百元。”背面一行：不用还了。', kind: 'paper' }
    },
    beats: [
      { id: 'qin1', need: { day: [6, 7] }, key: true, at: 'last',
        order: ['congee', 'scallion'],
        say: {
          in: '还有粥没？再来张饼。',
          chat: [['z', '这个点才吃？'], ['a', '收了摊才算完。'], ['a', '车上剩几个皮蛋，给你。'], ['a', '何姨拿它熬粥。']],
          good: '热的。行了。', ok: '行。垫一口。', bad: '锅底的，我不挑。', slow: '不急，我收摊了。', out: '皮蛋搁灶台上了。'
        },
        fx: { unlock: 'pidan', fact: ['qin', 'f_last'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin2', need: { day: [8, 9] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '听说有面了？来一碗。',
          chat: [['a', '老胡的货车又堵我前头。'], ['z', '批发的那个老胡？'], ['a', '他一车顶我一个月。'], ['a', '不说了。面要宽汤。']],
          good: '宽汤，热乎。以后就它了。', ok: '行。', bad: '面坨了。收摊的命。', slow: '不急，我收摊了。', out: '走了。明早四点起。'
        },
        fx: { fact: ['qin', 'f_hu'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin3a', group: 'qin_supply', need: { day: [10, 13], mat: [1] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '菜搁后门了。涨的几毛，对不住 —秦',
        say: {
          in: '老样子。',
          chat: [['a', '涨价的事，对不住。'], ['z', '该涨就涨。'], ['a', '老胡那边便宜三成。'], ['a', '你还要我的，我记着。']],
          good: '嗯。今天的面筋道。', ok: '行。', bad: '今天汤咸了。', slow: '不急。你先收拾。', out: '明早有嫩豆苗。'
        },
        fx: { set: ['qin_kept'], fact: ['qin', 'f_kept'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin3b', group: 'qin_supply', need: { day: [10, 13], mat: [0, 0] }, key: true, at: 'last',
        order: ['congee'],
        say: {
          in: '今天……来碗粥就行。',
          chat: [['z', '不吃面了？'], ['a', '粥就行。'], ['z', '车上还剩那么多菜？'], ['a', '今天走得慢。']],
          good: '热的。够了。', ok: '嗯。', bad: '……没事。', slow: '不急。我也没处去。', out: '走了。'
        },
        fx: { fact: ['qin', 'f_cart'], set: ['qin_frozen'] } },

      { id: 'qin4a', group: 'qin_mid', need: { day: [14, 16], mat: [1], flags: ['qin_kept'] }, key: true, at: 'last',
        order: 'usual', hide: true,
        note: '南瓜搁门口了，老的，甜 —秦',
        say: {
          in: '老样子。南瓜看见没？',
          chat: [['a', '自家地里的，放了一冬。'], ['a', '不卖。给你的。'], ['z', '这怎么行。'], ['a', '熬粥。何姨那时候也熬。']],
          good: '这面，吃得踏实。', ok: '行。', bad: '今天面软了。', slow: '你忙你的。', out: '南瓜别削皮，蒸了剥。'
        },
        fx: { unlock: 'pumpkin', memento: 'm_pumpkin', set: ['qin_pumpkin'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin4b', group: 'qin_mid', need: { day: [14, 16], mat: [0, 0] }, key: true,
        act: 'absent', order: [],
        remark: { who: 'gong', line: '老秦的三轮今早没出摊。' },
        fx: { set: ['qin_missed'] } },

      { id: 'qin5', need: { day: [17, 20] }, key: true, at: 'last',
        order: ['noodle'],
        say: {
          in: '一碗面。什么都不加。',
          chat: [['a', '今天剩了半车。'], ['z', '老胡又压价了？'], ['a', '他卖的比我进的还贱。'], ['a', '吃完我有话说。']],
          good: '热汤下去，好受点。', ok: '嗯。', bad: '……吃不出味。', slow: '不急。菜也不急了。', out: '你先收。我去推车。'
        },
        after: 'sc_qin_veg' },

      { id: 'qin6', need: { day: [21, 25] }, key: true, at: 'last',
        order: 'usual', hide: true,
        say: {
          in: '老样子。',
          chat: [['a', '何姨来过信没有？'], ['z', '没有。您跟她熟？'], ['a', '认得。'], ['a', '她那锅粥，救过急。']],
          good: '跟她那时候一个路子。', ok: '行。', bad: '她可不这么下面。', slow: '不急。', out: '走了。车还得修。'
        },
        leave: { memento: 'm_iou', line: '凳子上落了张旧借条。' },
        fx: { fact: ['qin', 'f_heyi'] }, fxGood: { aff: { qin: 1 } } },

      { id: 'qin7a', group: 'qin_end', need: { day: [27, 28], mat: [1] }, key: true, at: 'last',
        order: ['noodle', 'egg'],
        say: {
          in: '一碗面。今天加个蛋。',
          chat: [['a', '借条你捡着了？'], ['z', '压在零钱盒底下。'], ['a', '留你那儿吧。'], ['a', '老胡说收摊来找我。']],
          good: '加了蛋，像过节。', ok: '行。', bad: '月底了，都累。', slow: '不急。等个人。', out: '我不走。等老胡。'
        },
        after: 'sc_qin_cost' },

      { id: 'qin7b', group: 'qin_end', need: { day: [27, 28], mat: [0, 0] }, key: true, at: 'last',
        act: 'peek', order: [],
        say: {
          in: '面不吃了。说句话就走。',
          chat: [['a', '三轮我卖了。'], ['z', '卖了？'], ['a', '收摊你别急着关门。']],
          out: '我在门口抽根烟。'
        },
        after: 'sc_qin_home' }
    ],
    barks: {
      in: ['老样子。一碗面。', '收摊了。来碗面，宽汤。', '还有面没？', '最后一个，又是我。'],
      inRain: ['雨天菜不好卖。', '雨衣搁门口了，滴水。', '淋了一早上，来口热的。'],
      inOilOld: ['面就行，不要炸的。', '油该换了。何姨三天一换。', '今天不加煎蛋。'],
      inPriceUp: ['涨了？菜也涨，没法子。', '该涨。你也得活。', '贵点行，料别减。'],
      inPriceDown: ['这价，你够本吗？', '便宜了。别跟我学。', '薄利？我懂。难。'],
      inBusy: ['这个点还有人？好事。', '我等等。先紧着别人。', '不急，我收摊了。'],
      good: ['宽汤，热乎。', '这碗踏实。', '嗯。一早上值了。', '面筋道。'],
      ok: ['行。', '垫一口。', '嗯。'],
      bad: ['面坨了。', '汤咸了。', '收摊的命，不挑。'],
      slow: ['不急。', '你先收拾。', '我坐会儿。'],
      out: ['走了。明早四点起。', '碗搁这儿了。', '回了，车还得推。', '明天见。']
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
        ['n', '三轮车斜在门口，筐里的菜叶打了蔫。'],
        { prop: 'veg', label: '半筐菜' },
        ['qin', '卖不掉的。你拿去。'],
        ['z', '这得有二十斤。我给钱。'],
        ['qin', '明天就烂了。烂了也是烂。'],
        { if: { mat: [1] },
          then: [['qin', '你天天要我的，我才撑到今天。']],
          else: [['qin', '你现在用老胡的，我知道。不怪你。'], ['z', '……']] },
        ['qin', '老胡跟我说，这条街往后归他送。'],
        ['z', '你怎么回的？'],
        ['qin', '我说，我的菜是早上四点割的。'],
        { choice: [
          { label: '照价给钱', hint: '花四十', need: { cash: [40] }, fx: { cash: -40, aff: { qin: 1 }, set: ['qin_veg_paid'] },
            then: [['z', '菜是菜，钱是钱。拿着。'], ['qin', '……那我明早多带一把葱。']] },
          { label: '收下，熬成粥', hint: '明天粥料省了', fx: { cash: +15, set: ['qin_veg_taken'] },
            then: [['z', '行。明天粥里都是你的菜。'], ['qin', '嗯。别糟蹋就行。']] },
          { label: '不能白要', hint: '菜他推回去', fx: { aff: { qin: -1 }, set: ['qin_veg_refused'] },
            then: [['z', '白拿我睡不着。你推回去。'], ['qin', '推回去也是喂鸡。']] }
        ] },
        { exit: 'qin' }
      ] },

      sc_qin_cost: { id: 'sc_qin_cost', title: '够本吗', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        { enter: 'hu', slot: 2 },
        ['n', '老胡的货车没熄火，就停在三轮后头。'],
        ['hu', '老秦，你给老周那个价，够本吗？'],
        ['qin', '我的事。'],
        ['hu', '一斤亏两毛，亏了一个月。图什么？'],
        { exit: 'hu' },
        ['z', '……他说的是真的？'],
        ['qin', '那年我女人住院，何姨赊了我半年早饭。'],
        ['qin', '还借我八百。后来说不用还了。'],
        ['qin', '这铺子谁接，我就按那个价送。'],
        ['z', '我不是何姨。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '补上差价', hint: '花一百二', need: { cash: [120] }, fx: { cash: -120, aff: { qin: 2 }, set: ['qin_paid'] },
            then: [['z', '这一个月的差价。往后按市价。'], ['qin', '……行。按市价，菜我挑好的。']] },
          { label: '往后按市价', hint: '进货贵一点', fx: { aff: { qin: 1 }, set: ['qin_fair'] },
            then: [['z', '从明天起按市价。亏本的我不要。'], ['qin', '你跟她一个脾气。']] },
          { label: '先这样吧', hint: '价钱照旧', fx: { set: ['qin_owed'] },
            then: [['z', '我这月也紧。先记着，行不？'], ['qin', '记啥。本来就没打算要。']] }
        ] },
        { exit: 'qin' }
      ] },

      sc_qin_home: { id: 'sc_qin_home', title: '最后一筐', when: 'close', light: 'dusk', beats: [
        { enter: 'qin', slot: 1 },
        ['n', '门口没有三轮车。他是走着来的。'],
        ['qin', '下月不出摊了。回乡下。'],
        ['z', '是因为我换了老胡的货？'],
        ['qin', '不是你一家。整条街都换了。'],
        ['qin', '给你的价，我一直没敢涨够。'],
        ['z', '为什么？'],
        ['qin', '何姨帮过我。这铺子，我当是她的。'],
        { prop: 'veg', label: '最后一筐菜' },
        ['qin', '最后一筐。地里的，没打药。'],
        { fx: { fact: ['qin', 'f_cost'] } },
        { choice: [
          { label: '只要你的菜', hint: '花八十赎车', need: { cash: [80] }, fx: { cash: -80, aff: { qin: 2 }, set: ['qin_stay'] },
            then: [['z', '车我帮你赎。往后只要你的菜。'], ['qin', '……我回去跟家里商量。']] },
          { label: '买下这筐', hint: '花三十', need: { cash: [30] }, fx: { cash: -30, aff: { qin: 1 }, set: ['qin_home'] },
            then: [['z', '这筐我买。按你该卖的价。'], ['qin', '行。头一回按足价。']] },
          { label: '请他吃碗面', hint: '一碗面的料', fx: { cash: -4, set: ['qin_home'] },
            then: [['z', '坐。面我请。吃了再走。'], ['qin', '宽汤。跟头一回一样。']] }
        ] },
        { exit: 'qin' }
      ] }
    }
  };

  return { gong: gong, man: man, zheng: zheng, qin: qin };
});
