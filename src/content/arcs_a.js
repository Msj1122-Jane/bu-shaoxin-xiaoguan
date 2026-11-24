// 常客线 A：赵爷爷和豆豆 / 小宋 / 老葛 / 阿力。格式见 docs/CONTENT_SPEC.md §5、§7。
// 约定：故事靠点单和动作带进来；chat 是玩家点"…"才展开的小话（a=常客 b=同行的人 z=老周）。
// 备注：zhao_alone 这一拍只有豆豆一个人来（台词全是豆豆的口吻，chat 里用 b）。
BSX.define('content/arcs_a', function () {
  return {

    /* ───────────── 赵爷爷和豆豆 ───────────── */
    zhao: {
      first: '军绿马甲，布钱包，带着换牙的孙子。',
      usual: ['congee', 'youtiao', 'youtiao:嫩'],
      facts: {
        f_usual: '白粥一碗，油条两根。一根炸嫩，豆豆在换牙。',
        f_twice: '爷爷有时把钱给两回。豆豆会小声拦。',
        f_class: '豆豆读三年二班，和隔壁糖糖同班。',
        f_price: '提价那天，两根油条改成了一根。嫩的，给豆豆。',
        f_repeat: '同一句话，爷爷一早上说了三遍。',
        f_door: '爷爷一个人走到柜台前，忘了要买什么。',
        f_road: '有一天爷爷不认得路了。老样子，豆豆替他记着。',
        f_card: '爷爷钱包里有张卡片：正面是家，背面是老样子。'
      },
      mementos: {
        m_homework: { name: '作业本里的一页', text: '造句："每天——爷爷每天带我吃早饭。"铅笔写的，没交。', kind: 'paper' },
        m_essay: { name: '作文《我家楼下的早餐店》', text: '第一句："它还没有名字。"老师批了个优。', kind: 'paper' }
      },
      beats: [
        { id: 'zhao_first', need: { day: [1, 2] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩'], act: 'coins',
          say: {
            in: '白粥一碗，油条要两根哈。',
            chat: [['a', '一根炸嫩点哈，娃儿在换牙。'], ['b', '我掉了两颗了！门牙！'], ['z', '那嫩的我单炸，不跟老的一锅。'], ['a', '钱是数好的，你点一哈。'], ['b', '爷爷在屋头数了两遍。']],
            good: '豆豆，慢慢嚼，莫噎到。', ok: '要得，能吃。', bad: '嫩那根炸硬了嘛。', slow: '娃儿七点二十要到校。', out: '明天还是这个点哈。'
          },
          fx: { fact: ['zhao', 'f_usual'] }, fxGood: { aff: { zhao: 1 } } },

        { id: 'zhao_over', need: { day: [4, 6] }, key: true, at: 'early',
          order: 'usual', hide: true, act: 'overpay',
          say: {
            in: '老周，老样子。',
            chat: [['a', '钱我给过没得？咋个记不到了。'], ['z', '粥先端好，钱不急。'], ['a', '那再给一道，多了你退我嘛。'], ['b', '爷爷……'], ['b', '周爷爷，他给过了的。']],
            good: '这粥熬出米油了。', ok: '要得。', bad: '豆豆说，有点糊。', slow: '我不急，是豆豆急。', out: '豆豆，钱给了没得？'
          },
          fx: { fact: ['zhao', 'f_twice'] } },

        { id: 'zhao_hw', need: { day: [7, 9] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩'],
          say: {
            in: '老样子。豆豆，坐到写。',
            chat: [['b', '周爷爷，"每天"咋个造句？'], ['z', '我每天五点起来熬粥。'], ['b', '那是你的嘛，我要写我的。'], ['a', '屋头不写，跑来这儿写。'], ['b', '在屋头你老问我吃没吃。']],
            good: '写完了？那快吃。', ok: '要得。', bad: '豆豆说油条咬不动。', slow: '哦豁，要打预备铃了。', out: '书包！书包背起。'
          },
          leave: { memento: 'm_homework', line: '凳子上落了本作业本，封面写着三年二班。' },
          fx: { fact: ['zhao', 'f_class'] },
          after: 'sc_zhao_homework' },

        { id: 'zhao_price_up', group: 'zhao_price', need: { day: [10, 14], price: [2] }, key: true, at: 'early',
          order: ['congee', 'youtiao:嫩'],
          say: {
            in: '粥一碗。油条……就一根。',
            chat: [['b', '爷爷，你不吃油条了啊？'], ['a', '爷爷早上不饿。'], ['b', '昨天你也说不饿。'], ['a', '嫩的那根，给他。'], ['z', '那我给他挑根大的。']],
            good: '豆豆，吃干净，莫剩。', ok: '要得。', bad: '就这一根，还炸老了。', slow: '不急，慢慢来。', out: '走嘛，豆豆。'
          },
          fx: { set: ['zhao_one'], fact: ['zhao', 'f_price'] } },

        { id: 'zhao_price_ok', group: 'zhao_price', need: { day: [10, 14], price: [0, 1] }, key: true, at: 'early',
          order: ['congee', 'youtiao', 'youtiao:嫩', 'egg:嫩'],
          say: {
            in: '老样子。给豆豆加个蛋。',
            chat: [['a', '他今天月考哦。'], ['b', '我要考双百！'], ['z', '那蛋给你煎嫩点，好咬。'], ['a', '豆豆，今天是月考吧？'], ['b', '……爷爷，你刚说过了。']],
            good: '吃了蛋，考一百。', ok: '要得。', bad: '蛋煎老了，他嚼不动。', slow: '考试迟到不得行哦。', out: '老周，他今天月考哦。'
          },
          fx: { fact: ['zhao', 'f_repeat'] }, fxGood: { aff: { zhao: 1 } } },

        { id: 'zhao_door', need: { day: [15, 17] }, key: true, at: 'early',
          order: [], act: 'peek',
          say: {
            in: '我来买……买啥子来着。',
            chat: [['z', '老样子？'], ['a', '对头，老样子。'], ['a', '……老样子是哪几样嘛？'], ['z', '一碗粥，两根油条，一根嫩的。'], ['a', '钱包没揣。我回去拿哈。']],
            out: '我回去拿钱包，马上来。'
          },
          fx: { fact: ['zhao', 'f_door'] } },

        { id: 'zhao_absent', need: { day: [18, 19] }, key: true, act: 'absent',
          remark: { who: 'gong', line: '老赵今天没下楼？六点四十，他从来不误点的。' } },

        { id: 'zhao_alone', need: { day: [20, 23] }, key: true, at: 'early',
          order: 'usual', hide: true, togo: true, act: 'coins',
          say: {
            in: '爷爷今天不认得路了。老样子。',
            chat: [['b', '钱我数好了，数了三遍。'], ['z', '你一个人来的？爷爷呢？'], ['b', '在楼下坐着。糖糖妈妈送我到街口。'], ['b', '周爷爷，你记得的吧？'], ['z', '记得。你站这儿等我。']],
            good: '对的！跟爷爷买的一样。', ok: '谢谢周爷爷。', bad: '不对……爷爷那根不是这样。', slow: '爷爷一个人在楼下坐着。', out: '我认得路。我走了哈。'
          },
          fx: { fact: ['zhao', 'f_road'] },
          fxGood: { aff: { zhao: 2 }, set: ['zhao_remembered'] }, fxBad: { aff: { zhao: -1 } },
          after: 'sc_zhao_road' },

        { id: 'zhao_last_r', group: 'zhao_last', need: { day: [27, 28], flags: ['returned_extra'] }, key: true, at: 'early',
          order: 'usual', hide: true,
          say: {
            in: '老样子。',
            chat: [['b', '周爷爷，我作文得了优！'], ['a', '他写的就是你这儿。'], ['a', '你这店不多收钱，我记得到。'], ['a', '就是店名，老是记不住。'], ['z', '还没起呢。您帮我想一个？']],
            good: '还是这个味道。', ok: '要得。', bad: '豆豆说，今天的糊了。', slow: '不急，我们等嘛。', out: '明天还是这个点哈。'
          },
          leave: { memento: 'm_essay', line: '粥碗底下压着一张作文纸。' },
          fx: { aff: { zhao: 1 } } },

        { id: 'zhao_last_k', group: 'zhao_last', need: { day: [27, 28] }, key: true, at: 'early',
          order: 'usual', hide: true, act: 'coins',
          say: {
            in: '老样子。',
            chat: [['b', '钱我来数。'], ['b', '一、二、三……我数两遍。'], ['a', '这娃儿，现在管我的钱包了。'], ['z', '管得好。比我管账强。'], ['b', '周爷爷，我作文得了优。']],
            good: '还是这个味道。', ok: '要得。', bad: '豆豆说，今天的糊了。', slow: '不急，我们等嘛。', out: '钱给了没得？哦，给了。'
          },
          leave: { memento: 'm_essay', line: '粥碗底下压着一张作文纸。' } }
      ],
      barks: {
        in: ['老周，老样子。', '老样子，一根炸嫩点。', '豆豆，叫周爷爷。', '还是这个点，老样子哈。'],
        inRain: ['落雨，豆豆非要去踩水。', '伞在滴水，我放门口哈。', '落雨天，粥要烫的。'],
        inOilOld: ['今天油条颜色深了点。', '豆豆说油条有点苦。', '老周，这油该换了吧？'],
        inPriceUp: ['涨了？……那就一根嘛。', '牌子上的数改了哦。', '我再数一哈。钱不够了。'],
        inPriceDown: ['便宜了？莫亏到自己。', '那给豆豆加个蛋。', '价低了，量莫少哈。'],
        inBusy: ['人多，我们靠边等。', '豆豆，莫挤到人家。', '不急，先紧上班的。'],
        good: ['豆豆吃得香。', '这粥有米油，巴适。', '嫩那根，刚刚好。', '豆豆，碗都舔干净了。'],
        ok: ['要得。', '能吃。', '还将就。'],
        bad: ['豆豆说，糊了。', '嫩那根炸硬了。', '粥稀了点哦。', '他咬不动，我掰给他。'],
        slow: ['娃儿要迟到了。', '豆豆，再等一哈。', '七点二十要到校的。'],
        out: ['明天还是这个点。', '豆豆，跟周爷爷说再见。', '钱给了吧？……给了。', '这条街从前是河，小龚晓得。']
      },
      epilogue: [
        { need: { flags: ['returned_extra', 'zhao_keep'] }, text: '每天六点四十，柜台上晾着一份老样子。豆豆牵着爷爷来取。爷爷每回都问店叫什么，每回都记得你不多收钱。' },
        { need: { flags: ['kept_extra', 'zhao_remembered'] }, text: '豆豆还是把硬币数两遍才推过来。可那份老样子，他已经不用开口了。' },
        { need: { flags: ['kept_extra'] }, text: '后来都是豆豆管钱包，硬币数两遍。多给的那一回，谁也没再提。' },
        { need: { flags: ['zhao_remembered'] }, text: '那天豆豆一个人来，你没问就装对了。作文里写的就是那个早上。爷爷有时认得路，有时不认得。' },
        { text: '赵爷爷还来，有时认得你，有时不认得。豆豆认得。老样子，他替爷爷记着。' }
      ],
      scenes: {
        sc_zhao_homework: { id: 'sc_zhao_homework', title: '作业本', when: 'close', light: 'dusk',
          beats: [
            { enter: 'zhao', slot: 1 },
            ['n', '卷帘门拉到一半，底下露出一双布鞋。是赵爷爷，没带豆豆。'],
            ['z', '赵爷爷？这个点了，粥都卖完了。'],
            ['zhao', '我来拿个东西。'],
            ['zhao', '……拿啥子来着。你看我这脑壳。'],
            { prop: 'homework', label: '作业本' },
            ['z', '是不是这个？凳子上捡的，我收起了。'],
            ['zhao', '对对对！豆豆在屋头急得哭。'],
            ['zhao', '说明天要交，不交老师要喊家长。'],
            { if: { flags: ['kept_extra'] }, then: [
              ['zhao', '前两天，我是不是多给了你钱？'],
              ['z', '那天人多，盒子我……没细数。'],
              ['zhao', '记不清了。算了，不说了，不说了。']
            ], else: [] },
            { if: { flags: ['returned_extra'] }, then: [
              ['zhao', '豆豆说，你上回追出来把钱还了。'],
              ['z', '多的放盒子里，我夜里睡不着。']
            ], else: [] },
            ['z', '您等一下。带根油条回去给他。'],
            { do: 'tap', label: '把油条掰进豆浆' },
            ['z', '泡软了吃，换牙的也咬得动。我小时候我妈这么弄。'],
            ['zhao', '这个吃法好。明天他准要点这个。'],
            { fx: { unlock: 'soyyt', aff: { zhao: 1 } } },
            { prop: 'homework', off: true },
            ['n', '他把作业本揣进马甲，拍了两下。走到门口，又拍了一下。'],
            { exit: 'zhao' }
          ] },

        sc_zhao_road: { id: 'sc_zhao_road', title: '老样子', when: 'close', light: 'dusk',
          beats: [
            { enter: 'doudou', slot: 1 }, { enter: 'zhao', slot: 2 },
            ['n', '傍晚，豆豆牵着爷爷的袖子进来。那截袖口，磨得发白。'],
            ['doudou', '周爷爷，爷爷下午又认得了。'],
            ['zhao', '老周。你这店叫啥子来着？'],
            ['z', '还没想好。招牌还空着。'],
            ['zhao', '哦。头一天你也是这么说的。'],
            ['doudou', '……头一天你倒是记得。'],
            { prop: 'paper', label: '一张卡片' },
            ['doudou', '我写了张卡片，塞在他钱包里。'],
            ['doudou', '正面写的家，背面写的老样子。'],
            ['z', '老样子……你咋个写的？'],
            ['doudou', '白粥一碗，油条两根。"嫩"字我不会写，画了颗牙。'],
            { if: { flags: ['zhao_remembered'] },
              then: [['doudou', '早上你都没问我，就装对了。']],
              else: [['doudou', '早上那份……嫩的那根不对。']] },
            ['zhao', '我要是哪天又走岔了……'],
            { choice: [
              { label: '每天留一份', hint: '每天搭一份备料', fx: { cash: -4, set: ['zhao_keep'], aff: { zhao: 2 } },
                then: [['z', '六点四十，粥我盛好晾着，等你们来拿。'], ['doudou', '那我认得路，我来拿！'], ['zhao', '豆豆认得，豆豆认得。']] },
              { label: '来了现做', hint: '不占备料', fx: { set: ['zhao_wait'], aff: { zhao: 1 } },
                then: [['z', '来了就现做，热的。不来我不问。'], ['zhao', '要得。不给你添麻烦。']] }
            ] },
            { fx: { fact: ['zhao', 'f_card'] } },
            { prop: 'paper', off: true },
            ['n', '豆豆走在前头，爷爷攥着他的书包带子。我把灯多开了一会儿。'],
            { exit: 'zhao' }, { exit: 'doudou' }
          ] }
      }
    },

    /* ───────────── 小宋 ───────────── */
    song: {
      first: '开门第一个。外套底下是护士服。',
      usual: ['congee:温'],
      facts: {
        f_plain: '六点整，第一个。只要白粥，不要油的。',
        f_warm: '粥要晾一下再装。烫的她咽不下去。',
        f_nose: '鼻子灵。油用到第几天，她进门就闻得出来。',
        f_ward: '她让出院的病人第一顿来喝你的粥。没跟你提过。',
        f_resign: '她兜里揣着一封申请，写了半个月，没交。',
        f_wu: '十二床是六楼的吴奶奶。阿力天天送粥的那位。',
        f_board: '护士站的小黑板上，写着小馆的电话。'
      },
      mementos: {
        m_letter: { name: '没封口的信封', text: '她拿回去了。凳子上留了个圆印子，是粥碗压的。', kind: 'paper' },
        m_band: { name: '一条住院腕带', text: '出院那天剪下来的。他说留这儿，算个凭证。', kind: 'paper' }
      },
      beats: [
        { id: 'song_first', need: { day: [1, 2] }, key: true, at: 'open',
          order: ['congee'],
          say: {
            in: '白粥，一碗。不加任何东西。',
            chat: [['z', '油条刚出锅，来一根？'], ['a', '不了。胃今天不接诊。'], ['z', '那粥给你盛稠点。'], ['a', '稠稀都行。我站着喝，坐下就睡了。']],
            good: '嗯。是米熬出来的。', ok: '可以。', bad: '锅底糊了，有苦味。', slow: '我站着都能睡着。', out: '明天还这个点。'
          },
          fx: { fact: ['song', 'f_plain'] }, fxGood: { aff: { song: 1 } } },

        { id: 'song_warm', need: { day: [3, 5] }, key: true, at: 'open',
          order: ['congee:温'],
          say: {
            in: '白粥。晾两分钟再装。',
            chat: [['a', '烫的咽不下去，喉咙下班了。'], ['z', '刚下夜班？眼睛都是红的。'], ['a', '嗯。十四张床，一宿没坐。'], ['a', '你这儿几点收摊？'], ['z', '九点。卖完就收。']],
            good: '这个温度，刚好。', ok: '可以。', bad: '还是烫。算了。', slow: '再等我就睡过去了。', out: '九点就收。真好。'
          },
          fx: { fact: ['song', 'f_warm'] } },

        { id: 'song_oil_old', group: 'song_oil', need: { day: [6, 11], oilAge: [3] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。……你这油几天了？',
            chat: [['z', '粥里又没放油。'], ['a', '屋里有。我鼻子比化验单准。'], ['a', '油有点哈了。'], ['z', '……才第三天。还能用。'], ['a', '胃不好的，闻着就反酸。建议换。']],
            good: '粥是好的。油不是。', ok: '可以。', bad: '粥都串上油味了。', slow: '我门口等。里头呛。', out: '油该换了。我走了。'
          },
          fx: { set: ['song_oilwarn'], fact: ['song', 'f_nose'], aff: { song: -1 } } },

        { id: 'song_oil_new', group: 'song_oil', need: { day: [6, 11], oilAge: [0, 1] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。今天油是新的。',
            chat: [['z', '你咋晓得？我天不亮才换的。'], ['a', '闻的。病房里练出来的。'], ['a', '这屋里，病人待得住。'], ['z', '啥子病人？'], ['a', '没什么。粥晾好了吗？']],
            good: '嗯。就是这个。', ok: '可以。', bad: '今天粥不如油。', slow: '没事。这屋里不呛。', out: '走了。回去补觉。'
          },
          fx: { set: ['song_oilgood'], fact: ['song', 'f_nose'], aff: { song: 1 } } },

        { id: 'song_gone', group: 'song_ward', need: { day: [13, 17], oilAge: [3], flags: ['song_oilwarn'] }, key: true, act: 'absent',
          remark: { who: 'gong', line: '咦，今天我成头一个了？那个小护士呢？' },
          fx: { set: ['song_gone'], aff: { song: -1 } },
          after: 'sc_song_family' },

        { id: 'song_big', group: 'song_ward', need: { day: [13, 17], oilAge: [0, 2] }, key: true, at: 'open',
          act: 'big', togo: true,
          note: '今早六碗白粥，晾温，六点来取。—消化科 宋',
          order: ['congee:温', 'congee:温', 'congee:温', 'congee:温', 'congee:温', 'congee:温'],
          say: {
            in: '条子看见了吧？六碗。',
            chat: [['z', '六碗，你一个人喝得完？'], ['a', '科里的。今天出院六个。'], ['a', '盖子别扣死，会闷出水。'], ['z', '你们科还管饭？'], ['a', '不管。是我多嘴。……只管这一顿。']],
            good: '六碗都是温的。可以。', ok: '行，我拎走了。', bad: '这几碗我不敢给病人。', slow: '七点交班，我得走了。', out: '钱在这儿，你点点。'
          },
          fx: { set: ['song_big'], rep: 1 },
          fxGood: { aff: { song: 2 }, later: { days: 2, fx: { rep: 2 }, note: '有人说，是消化科的护士让来的。' } },
          fxBad: { aff: { song: -1 } },
          after: 'sc_song_firstmeal' },

        { id: 'song_letter', need: { day: [18, 20], not: ['song_gone'] }, key: true, at: 'open',
          order: 'usual', hide: true,
          say: {
            in: '老样子。我坐一下。',
            chat: [['z', '今天舍得坐了？'], ['a', '腿不是我的了。打了报告请假。'], ['a', '周叔，熬粥要考证吗？'], ['z', '不用。要考我也考不过。'], ['a', '……真好。']],
            good: '……嗯？哦。喝完了。', ok: '可以。', bad: '今天粥不对。我也不对。', slow: '不急。我眯一会儿。', out: '几点了？我得走了。'
          },
          leave: { memento: 'm_letter', line: '凳子上落了个信封，没封口。' },
          after: 'sc_song_letter' },

        { id: 'song_off', need: { day: [21, 23], not: ['song_gone'], seen: ['song_letter'] }, key: true, act: 'absent',
          remark: { who: 'ali', line: '周叔，宋护士今天下不来，科里在抢救。' } },

        { id: 'song_wu', need: { day: [23, 25], not: ['song_gone'] }, at: 'open', togo: true,
          order: ['congee:温', 'congee:温'],
          say: {
            in: '两碗，晾温，带走。',
            chat: [['a', '一碗给十二床。'], ['a', '老太太只认你家的粥。'], ['z', '哪个老太太？'], ['a', '住六楼的。有个骑手天天给她送。'], ['a', '前天抢回来的就是她。']],
            good: '她能喝半碗了。', ok: '可以。', bad: '这碗我自己喝。不给她。', slow: '查房前我得赶回去。', out: '走了。十二床等着。'
          },
          fx: { fact: ['song', 'f_wu'] }, fxGood: { aff: { song: 1 } } },

        { id: 'song_last', need: { day: [26, 28], oilAge: [0, 1] }, key: true, at: 'open',
          order: ['congee:温', 'youtiao:嫩'],
          say: {
            in: '白粥晾温。再来根油条。',
            chat: [['z', '你不是不要油的？'], ['a', '今天的油，准予食用。'], ['a', '我下个月还上夜班。'], ['z', '那六点的粥，我给你留着。'], ['a', '护士站黑板上，我写了你电话。']],
            good: '头一回吃你的油条。', ok: '可以。', bad: '油条还是算了。', slow: '今天不赶。我调休。', out: '明天还是第一个。'
          },
          fx: { set: ['song_stay'], fact: ['song', 'f_board'] }, fxGood: { aff: { song: 2 } } }
      ],
      barks: {
        in: ['白粥。别的我闻都不想闻。', '老样子。', '白粥，晾温。谢谢。', '老样子。不要油的。'],
        inRain: ['伞又忘在科里了。', '下雨，急诊又要爆。', '粥。我淋了一路。'],
        inOilOld: ['你这油，第几天了？', '油有点哈。', '今天我在门口喝。', '这味，病人闻不得。'],
        inPriceUp: ['涨了？粥也涨？', '可以。夜班费没涨。', '涨就涨，别减米。'],
        inPriceDown: ['便宜了。米没少吧？', '降价了？油还换吗？', '别亏本。我还要来的。'],
        inBusy: ['今天比急诊人还多。', '我排着。站得住。', '第一个也要排？可以。'],
        good: ['嗯。是米熬的。', '温的，正好。', '活过来了。', '这碗能给病人喝。'],
        ok: ['可以。', '还行。', '能喝。'],
        bad: ['烫。咽不下去。', '有糊味。', '粥串了油味。', '今天不如昨天。'],
        slow: ['我站着能睡着。', '再等要交班了。', '快点，眼皮要闭了。'],
        out: ['走了。回去睡觉。', '明天还这个点。', '九点收摊。真好。', '周叔，记得换油。']
      },
      epilogue: [
        { need: { flags: ['song_big'], not: ['song_gone'] }, text: '消化科护士站的小黑板上，值班表旁边多了一行小馆的电话。出院第一顿：白粥，晾温。小宋没辞。' },
        { need: { flags: ['song_gone', 'song_denied'] }, text: '小宋没再从柳河街走。有出院的病人问粥店，她说：换一家吧。黑板上那行电话，是她自己擦的。' },
        { need: { flags: ['song_gone', 'song_stay'] }, text: '黑板上那行电话她擦过一回。月底她闻了闻你的油，又用粉笔描了回去。她没辞。' },
        { need: { flags: ['song_gone'] }, text: '小宋后来不大来了。听阿力说她没辞，还在十二床那一层，只是下了夜班不再往这边走。' },
        { text: '小宋没辞。下了夜班还是第一个到，白粥，晾温，站着喝完。那封信，她说找不着了。' }
      ],
      scenes: {
        sc_song_firstmeal: { id: 'sc_song_firstmeal', title: '出院第一顿', when: 'close', light: 'dusk',
          beats: [
            { enter: 'neighbor', slot: 1 },
            ['n', '收摊的时候进来个人，手腕上还套着住院腕带。'],
            ['neighbor', '老板，还有粥没得？宋护士让来的。'],
            ['z', '收摊了。……锅底还有一碗，您不嫌的话。'],
            { sfx: 'pour' },
            ['neighbor', '她说出院头一顿，得喝你家的。'],
            ['neighbor', '说了小半个月了，一科室都晓得。'],
            ['z', '她没跟我提过。每天就站着喝一碗，喝完就走。'],
            ['neighbor', '她还说，哪天油不对了就莫来。'],
            ['z', '……那我得天天闻着点。'],
            ['neighbor', '多少钱？'],
            ['z', '锅底的，不算钱。'],
            ['neighbor', '那这个留给你。算个凭证。'],
            { fx: { fact: ['song', 'f_ward'], memento: 'm_band', rep: 1 } },
            ['n', '腕带上印着名字和床号。我没细看，挂在了墙上的钉子上。'],
            { exit: 'neighbor' }
          ] },

        sc_song_family: { id: 'sc_song_family', title: '找上门', when: 'close', light: 'dusk',
          beats: [
            { enter: 'neighbor', slot: 1 },
            ['n', '一个中年人站在门口，没进来。手里捏着张出院单。'],
            ['neighbor', '你就是宋护士说的那家粥店？'],
            ['z', '是我。您……进来坐？'],
            ['neighbor', '不坐了。我爸出院头一顿，她让来你这儿。'],
            ['neighbor', '喝完回去烧心，折腾了一宿。'],
            ['neighbor', '粥是白的。可你这屋里的油味……'],
            ['neighbor', '她在科里替你赔了不是。'],
            { fx: { fact: ['song', 'f_ward'] } },
            { choice: [
              { label: '退钱赔不是', hint: '退三十元', fx: { cash: -30, rep: 1, set: ['song_apology'] },
                then: [['z', '对不住。钱您拿着，给老人家买点好的。'], ['neighbor', '钱是小事。莫砸了她的话。']] },
              { label: '当面把油倒了', hint: '这锅油作废', fx: { cash: -20, burn: -6, aff: { song: 1 }, set: ['song_dumped'] },
                then: [{ sfx: 'pour' }, ['z', '这锅我当您面倒了。明天是新的。'], ['neighbor', '……我会跟她说。']] },
              { label: '粥里没有油', hint: '不花钱', fx: { rep: -2, aff: { song: -2 }, set: ['song_denied'] },
                then: [['z', '他喝的是白粥。粥里一滴油都没有。'], ['neighbor', '要得。我原话带给她。']] }
            ] },
            { exit: 'neighbor' }
          ] },

        sc_song_letter: { id: 'sc_song_letter', title: '信封', when: 'close', light: 'dusk',
          beats: [
            { enter: 'song', slot: 1 },
            ['n', '天擦黑，小宋回来了。外套底下还是那身护士服。'],
            ['song', '周叔，我早上是不是落了个信封？'],
            { prop: 'envelope', label: '没封口的信封' },
            ['z', '压在零钱盒底下。没动。'],
            ['song', '……没封口。你没看？'],
            ['z', '就看见两个字，"申请"。不是故意的。'],
            ['song', '写了半个月，改了四遍。主任名字都写错过一回。'],
            ['song', '周叔，你这儿真不招人？'],
            { choice: [
              { label: '招，你来', hint: '她不一定来', fx: { set: ['song_offer'], aff: { song: 1 } },
                then: [['z', '招。早上五点到。'], ['song', '五点。比夜班还早。'], ['song', '……我再想想。信先不交。']] },
              { label: '我只租了一个月', hint: '说实话，丢面子', fx: { set: ['song_truth'], aff: { song: 2 } },
                then: [['z', '我这店只租了二十八天。'], ['song', '二十八天，你还天天五点起？'], ['z', '……锅都买了。'], ['song', '行。那我也再上一个月。']] },
              { label: '先喝碗粥', hint: '搭一碗粥', fx: { cash: -3, set: ['song_bowl'], aff: { song: 1 } },
                then: [{ sfx: 'pour' }, ['z', '先喝粥。晾过了。'], ['song', '你就会这一句。'], ['song', '……比我们主任会说。']] }
            ] },
            { fx: { fact: ['song', 'f_resign'] } },
            { prop: 'envelope', off: true },
            { exit: 'song' }
          ] }
      }
    },

    /* ───────────── 老葛 ───────────── */
    ge: {
      first: '旧西装，袖口磨亮了。先问价。',
      usual: ['congee', 'youtiao'],
      facts: {
        f_ask: '先问价，再点。点最顶饱最便宜的。',
        f_less: '提价以后，他少点了一样。',
        f_phone: '手机充着电，亮着的是招聘页面。',
        f_acct: '落下的那张纸上写着：成本会计，十九年。',
        f_sit: '一杯豆浆，坐到八点半。说是去公司。',
        f_home: '上个月起就没班上了。家里不知道。',
        f_books: '他替你理账，早饭记账上。七点到，自己带笔。',
        f_cart: '他改去公交站台的早餐车了。那边便宜五毛。',
        f_interview: '他去面试了。小郑说，西装是熨过的。',
        f_wife: '钱是他爱人给的。头一个礼拜她就知道了。'
      },
      mementos: {
        m_resume: { name: '一份简历', text: '"成本会计，十九年。期望薪资：面议。"照片上的西装是新的。', kind: 'paper' },
        m_ledger: { name: '老葛理的账', text: '横平竖直，一笔不差。最后一页只有两个字：两清。', kind: 'book' }
      },
      beats: [
        { id: 'ge_first', need: { day: [1, 3] }, key: true, at: 'rush',
          order: ['congee', 'youtiao'],
          say: {
            in: '劳驾，粥多少钱一碗？',
            chat: [['z', '牌子上有。您看看。'], ['a', '看见了。问一声，心里踏实。'], ['a', '麻烦您，一碗粥，一根油条。'], ['a', '按理说……这儿能坐多久？'], ['z', '随便坐。我这儿不赶人。']],
            good: '实在。粥是稠的。', ok: '还说得过去。', bad: '按这个价，粥稀了。', slow: '不赶。我八点半的班。', out: '到点了，上班去。'
          },
          fx: { fact: ['ge', 'f_ask'] }, fxGood: { aff: { ge: 1 } } },

        { id: 'ge_up', group: 'ge_price', need: { day: [6, 11], any: [{ price: [2] }, { priceAvg: [1.4] }] }, key: true, at: 'rush',
          order: ['congee'],
          say: {
            in: '涨了？……那就一碗粥。',
            chat: [['z', '油条不要了？'], ['a', '油条吃多了犯困。下午要对账。'], ['a', '劳驾，借个插座。手机没电了。'], ['z', '插座在冰柜后头，线短。'], ['a', '不碍事。我凑过去坐。']],
            good: '粥还是稠的。', ok: '还说得过去。', bad: '涨了价，粥倒稀了。', slow: '我不赶。', out: '到点了，上班去。'
          },
          fx: { set: ['ge_less'], fact: ['ge', 'f_less'] } },

        { id: 'ge_fair', group: 'ge_price', need: { day: [6, 11], price: [0, 1], priceAvg: [0, 1.3] }, key: true, at: 'rush',
          order: 'usual', hide: true,
          say: {
            in: '老样子。价没动吧？',
            chat: [['a', '没动就好。整条街都在涨，平均两成。'], ['z', '您中午吃啥？'], ['a', '带了饭。她装的。'], ['a', '劳驾，借个插座。手机没电了。'], ['z', '冰柜后头。线短，您凑合。']],
            good: '实在。', ok: '还说得过去。', bad: '今天这根油条是凉的。', slow: '我不赶。', out: '到点了，上班去。'
          },
          fx: { fact: ['ge', 'f_phone'] }, fxGood: { aff: { ge: 1 } } },

        { id: 'ge_resume', need: { day: [12, 14] }, key: true, at: 'rush',
          order: [{ wish: '顶饱' }],
          say: {
            in: '劳驾，今天哪样最顶饱？',
            chat: [['a', '喂？……是我，是我。'], ['a', '……好的好的，我等通知。'], ['z', '公司的事？'], ['a', '推销的。现在推销的也客气。'], ['a', '麻烦您，再给杯白开水。']],
            good: '这个能顶到中午。', ok: '还说得过去。', bad: '这个不太顶饱。', slow: '我不赶。今天不赶。', out: '……到点了。走了。'
          },
          leave: { memento: 'm_resume', line: '桌上落了张纸，是份简历。' },
          fx: { fact: ['ge', 'f_acct'] } },

        { id: 'ge_soy', group: 'ge_mid', need: { day: [15, 17], any: [{ price: [2] }, { priceAvg: [1.4] }] }, key: true, at: 'rush',
          order: ['soy'],
          say: {
            in: '劳驾，就一杯豆浆。',
            chat: [['z', '不吃点干的？'], ['a', '家里吃过了。吃得很饱。'], ['a', '……光喝豆浆，能坐吧？'], ['z', '坐。凳子又不收钱。'], ['a', '站台新来个早餐车，便宜五毛。']],
            good: '豆浆是现磨的。', ok: '还说得过去。', bad: '豆浆兑了水吧。', slow: '我不赶。', out: '到点了。'
          },
          fx: { set: ['ge_soyonly'], fact: ['ge', 'f_sit'], aff: { ge: -1 } } },

        { id: 'ge_offer', group: 'ge_mid', need: { day: [15, 17], price: [0, 1], priceAvg: [0, 1.3] }, key: true, at: 'rush',
          order: 'usual',
          say: {
            in: '老样子。听说来查账了？',
            chat: [['z', '要台账。我只有本粗账。'], ['a', '方便的话，拿来我看一眼。'], ['a', '进货跟流水记在一页？这不行。'], ['z', '厂里管油，我只记桶数。'], ['a', '收摊别急着走。我等你。']],
            good: '实在。', ok: '还说得过去。', bad: '今天这粥对不住这价。', slow: '我不赶。我看账。', out: '我不走。收摊再说。'
          },
          after: 'sc_ge_books' },

        { id: 'ge_credit', need: { day: [17, 21], flags: ['ge_books'] }, key: true, at: 'rush',
          order: 'usual', hide: true, act: 'credit',
          note: '葱的票找不着了，今天补一张。—葛',
          say: {
            in: '老样子。记账上。',
            chat: [['a', '你把豆子钱记成了收入。'], ['a', '我改过来了，红笔，你看得清。'], ['a', '那个学生问我，成本怎么摊。'], ['a', '我说，良心不入账。'], ['z', '那它记在哪一栏？']],
            good: '实在。这顿记原价。', ok: '还过得去。照记。', bad: '糊了也记原价。规矩。', slow: '我不赶。账还没对完。', out: '今天这笔，我记上了。'
          },
          fx: { aff: { ge: 1 } } },

        { id: 'ge_cart', need: { day: [18, 23], not: ['ge_books'], any: [{ flags: ['ge_soyonly'] }, { flags: ['ge_refused'] }, { flags: ['ge_charity'] }] },
          key: true, act: 'absent',
          remark: { who: 'gong', line: '老葛啊？在站台早餐车那儿站着吃呢。' },
          fx: { set: ['ge_cart'], fact: ['ge', 'f_cart'] } },

        { id: 'ge_interview', need: { day: [22, 25], flags: ['ge_books'] }, key: true, act: 'absent',
          remark: { who: 'zheng', line: '周叔，葛叔今天面试去了！西装是熨过的。' },
          fx: { set: ['ge_interview'], fact: ['ge', 'f_interview'] } },

        { id: 'ge_last', need: { day: [26, 28], flags: ['ge_books'] }, key: true, at: 'rush',
          order: 'usual', act: 'repay',
          say: {
            in: '老样子。今天起，付现钱。',
            chat: [['z', '找着了？'], ['a', '下月一号报到。管成本。'], ['a', '小公司。袖口不用那么亮了。'], ['z', '恭喜。……我嘴笨，就这一句。'], ['a', '账我今天结清。劳驾，点一点。']],
            good: '实在。一直都实在。', ok: '还说得过去。', bad: '最后一笔，给我糊了。', slow: '我不赶。还没到一号。', out: '收摊我再来。有本账。'
          },
          fx: { set: ['ge_repaid'] },
          after: 'sc_ge_clear' }
      ],
      barks: {
        in: ['劳驾，粥今天什么价？', '老样子。价没动吧？', '麻烦您，哪样最顶饱？', '还是靠墙那个座。'],
        inRain: ['下雨，我多坐一会儿。', '皮鞋进水了。不碍事。', '雨天，公司……不急。'],
        inOilOld: ['油条颜色不太对。', '这油，折旧折过头了。', '油钱省了，药钱补。'],
        inPriceUp: ['涨了？那少要一样。', '涨五毛，一月十五块。', '那……就一杯豆浆吧。', '我算算。……算了。'],
        inPriceDown: ['降了？别做亏本账。', '那劳驾，加根油条。', '薄利，就得靠量。'],
        inBusy: ['人多，我让个座？', '我往角上挪挪。', '生意好，账更要清。'],
        good: ['实在。', '这顿值这个价。', '稠。能顶到中午。', '按理说，这价你亏了。'],
        ok: ['还说得过去。', '还行。', '对得起这个价。'],
        bad: ['这价，不该是这个味。', '粥稀了。', '凉的。我不说第二回。', '糊了。糊了也是成本。'],
        slow: ['我不赶。', '不急，八点半的班。', '慢点没事，别出错。'],
        out: ['到点了，上班去。', '座给您腾出来了。', '明天还这个价吧？', '走了。去公司。']
      },
      epilogue: [
        { need: { flags: ['ge_books', 'ge_repaid'] }, text: '老葛下月一号报到。头一个月工资下来，他来请你吃早饭——在你店里请你，自己掏钱，自己记账。' },
        { need: { flags: ['ge_books'] }, text: '账记得横平竖直，欠的早饭一笔没漏。老葛还在找活，七点到，带着自己的笔。' },
        { need: { flags: ['ge_charity'] }, text: '那句"饭照吃"之后，老葛没再进门。听小郑说他找着活了，在城那头，早饭在公交站解决。' },
        { need: { flags: ['ge_cart'] }, text: '老葛在站台的早餐车前站着吃，便宜五毛。西装还是那件。八点半，他照旧"去公司"。' },
        { text: '老葛还是先问价，再点最顶饱的，八点半起身说去公司。你没问是哪家。' }
      ],
      scenes: {
        sc_ge_books: { id: 'sc_ge_books', title: '粗账', when: 'close', light: 'dusk',
          beats: [
            { enter: 'ge', slot: 1 },
            { prop: 'ledger', label: '老周的账本' },
            ['n', '收摊了。老葛还坐着，面前摊着我那本账，像在批作业。'],
            ['ge', '老周，进货和流水记在一页上，是查不清的。'],
            ['z', '你懂这个？'],
            ['ge', '成本会计。干了十九年。'],
            ['ge', '按理说，不该在早点铺子里跟人讲这个。'],
            { if: { seen: ['ge_resume'] }, then: [['z', '那张纸我捡着了。没往外说。']], else: [] },
            ['z', '你那写字楼……是不是不用去了？'],
            ['ge', '……上个月起。家里还不知道。'],
            ['ge', '我每天照样打领带出门。领带是她买的。'],
            ['ge', '这样。账我替你理清，早饭在你这儿记一个月账。'],
            ['ge', '找着活了，一笔一笔还你。利息就免了吧。'],
            { fx: { fact: ['ge', 'f_home'] } },
            { choice: [
              { label: '行，记账上', hint: '一个月早饭先欠着', fx: { set: ['ge_books'], aff: { ge: 2 }, fact: ['ge', 'f_books'] },
                then: [{ sfx: 'page' }, ['z', '行。记账上。我那字丑，您多担待。'], ['ge', '明天七点到。我自己带笔。']] },
              { label: '账不用，饭照吃', hint: '白送一个月早饭', fx: { set: ['ge_charity'], aff: { ge: -1 } },
                then: [['z', '账不用理。饭你照吃。'], ['ge', '老周，我不是来讨饭的。'], ['ge', '……这话，当我没说过。']] },
              { label: '小本生意不赊', hint: '现钱现货', fx: { set: ['ge_refused'] },
                then: [['z', '我这小本生意，赊不起。'], ['ge', '应该的，应该的。是我唐突了。']] }
            ] },
            { prop: 'ledger', off: true },
            { exit: 'ge' }
          ] },

        sc_ge_clear: { id: 'sc_ge_clear', title: '两清', when: 'close', light: 'dusk',
          beats: [
            { enter: 'ge', slot: 1 },
            { prop: 'ledger', label: '理好的账' },
            ['n', '老葛把账本推过来，两只手推的，像递一份报表。'],
            ['ge', '账在这儿。从头一天起，一笔不差。'],
            ['z', '欠的那些，早上你都结了。'],
            ['ge', '所以最后一页写的是"两清"。'],
            ['z', '两个字占一整页，你也舍得。'],
            ['ge', '钱是她给的。她早就知道了。'],
            ['z', '知道多久了？'],
            ['ge', '头一个礼拜。饭盒她照样装，一句没问。'],
            ['ge', '头一个月工资下来，我请你吃早饭。'],
            ['z', '上哪儿请？'],
            ['ge', '就这儿。在你店里请你。我付钱，我记账。'],
            { fx: { aff: { ge: 1 }, memento: 'm_ledger', fact: ['ge', 'f_wife'], set: ['ge_clear'] } },
            { exit: 'ge' }
          ] }
      }
    },

    /* ───────────── 阿力 ───────────── */
    ali: {
      first: '头盔没摘，站着吃，电瓶车没熄火。',
      usual: ['soy', 'youtiao', 'congee:温'],
      facts: {
        f_fast: '要快的。头盔不摘，站着吃。',
        f_two: '每天多带一碗白粥，要晾过的。他说是客人备注。',
        f_dock: '出餐慢了，他是真的被扣钱。一回八块。',
        f_sit: '下雨那天他摔了，雨衣撕了。头一回坐下来。',
        f_wu: '那碗粥送六楼吴奶奶。平台上没有这一单。',
        f_hosp: '吴奶奶夜里被救护车接走了。粥不要了。',
        f_ten: '每天坐十分钟。"这十分钟算我的。"'
      },
      mementos: {
        m_slip: { name: '一张手写的条子', text: '"六楼吴 白粥一碗 晾一下再装 牙不好 敲门轻点"。没有单号。', kind: 'note' },
        m_stool: { name: '靠门的那张凳子', text: '凳腿上缠了圈胶布，写着"力"。每天十分钟。', kind: 'tool' }
      },
      beats: [
        { id: 'ali_first', need: { day: [1, 3] }, key: true, at: 'rush',
          order: ['soy', 'youtiao'],
          say: {
            in: '豆浆油条！要快的！',
            chat: [['z', '坐着吃嘛，凳子空着。'], ['a', '不坐不坐，车没熄火。'], ['a', '手上还挂三单，还剩——四分钟。'], ['z', '那油条我给你套个袋子。']],
            good: '行，够快。', ok: '走了走了。', bad: '油条是凉的啊。', slow: '哎这单要超时了！', out: '走了！'
          },
          fx: { fact: ['ali', 'f_fast'] }, fxGood: { aff: { ali: 1 } } },

        { id: 'ali_two', need: { day: [4, 7] }, key: true, at: 'rush', togo: true,
          order: ['soy', 'youtiao', 'congee:温'],
          say: {
            in: '豆浆油条。加碗粥带走。',
            chat: [['a', '周叔，粥晾一下再装啊。'], ['z', '凉了不好喝。'], ['a', '客人备注的，牙不好。'], ['a', '六楼没电梯，爬上去正好温。'], ['z', '哪个客人这么讲究？']],
            good: '温的，行。', ok: '走了。', bad: '太烫了，没法送。', slow: '粥那单要超了！', out: '明天还要一碗啊。'
          },
          fx: { fact: ['ali', 'f_two'] } },

        { id: 'ali_fast', group: 'ali_speed', need: { day: [8, 11], fast: true }, key: true, at: 'rush', togo: true,
          order: 'usual', hide: true,
          say: {
            in: '老样子。周叔你这儿快！',
            chat: [['a', '快两分钟，就能多跑一单。'], ['a', '一单四块，四块够一碗粥。'], ['z', '粥还是晾？'], ['a', '晾。天天都晾。'], ['z', '那位牙不好的，天天点？']],
            good: '行，够快。', ok: '走了。', bad: '今天咋回事啊。', slow: '昨天不这样啊！', out: '走了，明天还来。'
          },
          fx: { set: ['ali_fast'], aff: { ali: 1 } } },

        { id: 'ali_slow', group: 'ali_speed', need: { day: [8, 11] }, key: true, at: 'rush', togo: true,
          order: ['soy', 'congee:温'],
          say: {
            in: '昨天等久了，超时了。',
            chat: [['a', '扣了八块。八块！'], ['a', '油条不要了，省时间。'], ['z', '……对不住。今天先出你的。'], ['a', '粥照旧，晾一下。别的不要。']],
            good: '今天可以。', ok: '走了。', bad: '又慢又烫。', slow: '又要扣钱了啊。', out: '再慢我真不来了。'
          },
          fx: { set: ['ali_slow'], fact: ['ali', 'f_dock'] } },

        { id: 'ali_fall', need: { day: [12, 16], weather: 'rain' }, key: true, at: 'late',
          order: [{ wish: '汤水' }, 'congee:温'],
          say: {
            in: '……有热的带汤的吗？',
            chat: [['z', '雨衣咋个撕了？'], ['a', '桥头滑了一下。没事没事。'], ['a', '粥洒了。得重买一碗。'], ['z', '坐下。头盔摘了，滴我一地。'], ['a', '……就坐五分钟。五分钟。']],
            good: '……暖过来了。', ok: '行。', bad: '凉的。跟外头一样。', slow: '没事。今天不赶了。', out: '六楼还等着。走了。'
          },
          leave: { memento: 'm_slip', line: '凳子底下有张湿了的条子。' },
          fx: { fact: ['ali', 'f_sit'] }, fxGood: { aff: { ali: 1 } },
          after: 'sc_ali_sit' },

        { id: 'ali_cancel', need: { day: [17, 19] }, key: true, at: 'rush',
          order: ['soy', 'youtiao'],
          say: {
            in: '老样子。……粥不要了。',
            chat: [['z', '今天没那一碗？'], ['a', '敲了，没人开门。'], ['a', '对门说，夜里救护车来过。'], ['z', '哪个医院？'], ['a', '……我先跑单。跑完再说。']],
            good: '嗯。', ok: '走了。', bad: '……算了。', slow: '今天不催你。', out: '走了。'
          },
          fx: { set: ['ali_wuhosp'], fact: ['ali', 'f_hosp'] } },

        { id: 'ali_absent', need: { day: [19, 21], seen: ['ali_cancel'] }, key: true, act: 'absent',
          remark: { who: 'song', line: '戴头盔那个骑手，昨晚在我们科陪床。坐着睡的。' } },

        { id: 'ali_hosp_fast', group: 'ali_hosp', need: { day: [21, 25], fast: true }, key: true, at: 'early', togo: true,
          order: 'usual', hide: true,
          say: {
            in: '老样子。粥送医院。',
            chat: [['a', '她说医院的粥没米味。'], ['a', '宋护士说，你家的能喝。'], ['z', '喝口豆浆再走。'], ['a', '……坐两分钟。就两分钟。'], ['a', '探视七点半才开门。']],
            good: '温的。她能喝。', ok: '走了。', bad: '这碗不能给她。', slow: '探视要赶不上了！', out: '走了，十二床。'
          },
          fx: { set: ['ali_sits'], aff: { ali: 1 } } },

        { id: 'ali_hosp_slow', group: 'ali_hosp', need: { day: [21, 25] }, key: true, at: 'early', togo: true,
          order: ['congee:温'],
          say: {
            in: '就一碗粥，晾温。快。',
            chat: [['z', '你自己不吃？'], ['a', '来不及。'], ['a', '探视就半个钟头。'], ['a', '你这儿排一回，就赶不上了。']],
            good: '行。', ok: '走了。', bad: '烫的。路上我拿手扇。', slow: '赶不上了。……算了。', out: '走了。'
          },
          fx: { set: ['ali_rush'] } },

        { id: 'ali_last', need: { day: [26, 28], fast: true }, key: true, at: 'rush',
          order: 'usual', hide: true,
          say: {
            in: '老样子。',
            chat: [['z', '粥又要了？'], ['a', '昨天出的院。又回六楼了。'], ['a', '我坐十分钟再送。'], ['z', '不怕超时？系统不是在读秒？'], ['a', '这十分钟算我的。']],
            good: '坐着吃，是不一样。', ok: '行。', bad: '坐下才吃出来，凉的。', slow: '不催。我坐着等。', out: '到点了。六楼。'
          },
          fx: { set: ['ali_ten'], fact: ['ali', 'f_ten'], memento: 'm_stool' }, fxGood: { aff: { ali: 2 } } }
      ],
      barks: {
        in: ['周叔，老样子，快的！', '豆浆油条，走着吃。', '啥最快来啥。', '老样子。别太烫啊。'],
        inRain: ['雨天单多，快快快。', '雨衣不脱了，滴水莫怪。', '来碗热的，手僵了。', '路滑，粥盖紧点。'],
        inOilOld: ['油条有股味啊。', '今天不要油条了。', '这油，客人要投诉的。'],
        inPriceUp: ['涨了？一单才四块。', '那油条不要了。', '行吧，快就行。'],
        inPriceDown: ['便宜了？那加个蛋。', '周叔，降价别降速啊。', '行，多来一根。'],
        inBusy: ['排这么长？要超时了。', '周叔，能先出我的吗？', '我站门口，好了喊我。'],
        good: ['行，够快。', '够劲。', '温的，正好。', '这速度，五星好评。'],
        ok: ['走了。', '行。', '还成。'],
        bad: ['凉的。', '粥太烫，没法送。', '下回别这样啊。', '油条软了。'],
        slow: ['超时了超时了！', '又要扣钱了。', '周叔，还剩三十秒！', '我手上还有三单！'],
        out: ['走了！', '明天还来。', '六楼还等着。', '车没熄火，走了。']
      },
      epilogue: [
        { need: { flags: ['ali_ten', 'ali_share'] }, text: '阿力每天坐下吃十分钟，头盔搁在凳子上。吴奶奶那碗粥，账上记的是"一人一半"。' },
        { need: { flags: ['ali_ten'] }, text: '阿力每天坐下吃十分钟。"这十分钟算我的。"吃完拎着晾温的粥，上六楼。' },
        { need: { flags: ['ali_rush'] }, text: '阿力还是站着吃，眼睛盯着倒计时。吴奶奶的粥他改在别处买了，那家出得快。' },
        { text: '阿力还来，雨天来得多。头盔不摘，车不熄火，一碗晾温的粥挂在车把上。' }
      ],
      scenes: {
        sc_ali_sit: { id: 'sc_ali_sit', title: '没有单号', when: 'close', light: 'rain',
          beats: [
            { sfx: 'rain' },
            { enter: 'ali', slot: 1 },
            ['n', '雨没停。阿力又折回来了，头盔还在往下滴水。'],
            ['ali', '周叔，我掉了张条子没有？就一张，巴掌大。'],
            { prop: 'paper', label: '湿了的条子' },
            ['z', '凳子底下捡的。不是平台的票。'],
            ['z', '没单号。字是手写的，墨都泡开了。'],
            ['ali', '……头一个月，是她儿子在平台上点的。'],
            ['ali', '后来不点了。她还开着门等。'],
            ['ali', '我一敲门，她就说"小伙子来了"。也不问钱。'],
            ['z', '那这钱谁出？'],
            ['ali', '一碗粥嘛。我多跑一单就有了。'],
            { do: 'hold', label: '按住，卧一个荷包蛋' },
            { sfx: 'sizzle' },
            ['z', '坐下吃。面是刚下的。'],
            ['ali', '我没点啊。'],
            ['z', '没单号的，我这儿也有。'],
            { fx: { unlock: 'poachnoodle', fact: ['ali', 'f_wu'], aff: { ali: 1 } } },
            { choice: [
              { label: '粥钱以后算我的', hint: '每天少收一碗粥钱', fx: { set: ['ali_share'], aff: { ali: 1 } },
                then: [['ali', '不行不行。……一人一半。']] },
              { label: '钱照收，先出你的', hint: '别的客人多等一会', fx: { set: ['ali_first'], aff: { ali: 1 } },
                then: [['ali', '行。这个比免单实在。']] }
            ] },
            { prop: 'paper', off: true },
            { exit: 'ali' }
          ] }
      }
    }
  };
});
