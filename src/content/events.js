// 30 张事件（GDD §9）。type: tense 紧张 / daily 日常 / relax 松拍。phase: pre 开店前（影响当日客流）/ post 营业后。
// when：出现条件；once：一次性；cd：冷却天数；w：权重。
// effect 字段：cash(分) rep burn aff{id:n} flow(当日客流倍率) cap(当日产能) flag{} helper delayed[{after,...}] chain{id,after}
// stage：演出舞台（人物、道具、灯光），由 game/cutscene 的 B 级模板播放。
BSX.define('content/events', function () {
  var list = [
    { id: 'E01', name: '网红探店', type: 'tense', phase: 'pre', once: true, w: 1, when: { minDay: 9, repMin: 52 },
      stage: { who: ['influencer'], prop: 'phone', light: 'day' },
      text: '一位博主举着手机进门：“老板，免单我就给你发条视频。”',
      choices: [
        { id: 'free', label: '免单换曝光', effect: { cash: -3000, flow: 1.15, delayed: [{ after: 2, rep: 2, burn: 3, note: '视频火了，有人专程来' }] }, result: '视频发了出去，镜头里的粥冒着热气。' },
        { id: 'normal', label: '正常接待', effect: { rep: 1 }, result: '他付了钱，吃完点了点头，没拍。' },
        { id: 'refuse', label: '婉拒暗示', effect: { rep: -1, aff: { zheng: 1 } }, result: '他走了。小郑在角落里悄悄竖了个拇指。' }
      ] },
    { id: 'E02', name: '原料涨价', type: 'tense', phase: 'pre', once: true, w: 1.2, when: { minDay: 8, maxDay: 14 },
      stage: { who: ['qin'], prop: 'crate', light: 'day' },
      text: '老秦卸下菜筐：“米面都涨了，这个月得加一成。”',
      choices: [
        { id: 'switch', label: '换个货源', effect: { cash: 0, burn: 4, aff: { qin: -1 }, flag: { cheapSupplier: true } }, result: '新货源便宜，袋子上的字有点模糊。' },
        { id: 'raise', label: '跟着调价', effect: { rep: -1.5, flag: { raisedPrice: true } }, result: '价牌改了。老葛看了一眼，没说话。' },
        { id: 'absorb', label: '自己扛着', effect: { cash: -8000, aff: { qin: 1 } }, result: '老秦多塞了一把葱：“你这人实在。”' }
      ] },
    { id: 'E03', name: '同行价格战', type: 'tense', phase: 'pre', once: true, w: 1, when: { minDay: 10 },
      stage: { who: ['peer'], prop: 'flyer', light: 'day' },
      text: '街口新开的早点铺贴出传单：豆浆一元，油条买一送一。',
      choices: [
        { id: 'follow', label: '跟价', effect: { flow: 1.1, cash: -6000, rep: 0.5 }, result: '门口人没少，钱匣却轻了。' },
        { id: 'more', label: '加量不加价', effect: { cash: -4000, rep: 1.5, aff: { ge: 1 } }, result: '碗边满了，老葛吃得一滴不剩。' },
        { id: 'hold', label: '坚持品质', effect: { flow: 0.85, rep: 0.5, aff: { song: 1 } }, result: '今天冷清些。熟客还是来了。' }
      ] },
    { id: 'E04', name: '例行检查', type: 'tense', phase: 'pre', once: false, cd: 9, w: 0.9, when: { minDay: 6 },
      stage: { who: ['inspector'], prop: 'clipboard', light: 'day' },
      text: '市场监管所例行检查，要看进货台账和用油记录。',
      choices: [
        { id: 'show', label: '如实拿出台账', effect: { audit: true }, result: '检查员翻得很仔细。' },
        { id: 'delay', label: '说账本在家', effect: { burn: 6, rep: -1, delayed: [{ after: 2, audit: true, note: '检查员又来了' }] }, result: '对方记下了日期：“后天再来。”' }
      ] },
    { id: 'E05', name: '来源不明增香粉', type: 'tense', phase: 'pre', once: true, w: 1.3, when: { minDay: 2, maxDay: 9 },
      stage: { who: ['supplier'], prop: 'powder', light: 'day' },
      text: '供应商塞来一袋没有标签的增香粉：“撒一点，香得整条街都闻得到。”',
      choices: [
        { id: 'refuse', label: '谢绝', effect: { rep: 0.5 }, result: '老周把袋子推了回去。' },
        { id: 'try', label: '先试一次', effect: { burn: 8, flow: 1.1, flag: { additiveTried: true }, chain: { id: 'E23', after: 3 } }, result: '粥确实更香了。老周没跟人说。' },
        { id: 'hide', label: '用上，不说', effect: { burn: 22, flow: 1.18, flag: { additiveHidden: true }, chain: { id: 'E23', after: 3 } }, result: '那天的粥卖得特别快。' }
      ] },
    { id: 'E06', name: '废油回收商', type: 'tense', phase: 'post', once: true, w: 1, when: { minDay: 5, oilUsedRecycle: true },
      stage: { who: ['recycler'], prop: 'barrel', light: 'dusk' },
      text: '收废油的人出价比正规回收高一倍，只是不肯说油拉去哪。',
      choices: [
        { id: 'legal', label: '交正规回收', effect: { cash: 1000, burn: -3 }, result: '收据夹进了台账。' },
        { id: 'sell', label: '卖高价', effect: { cash: 4000, burn: 12 }, result: '桶被搬上了没牌照的三轮。' },
        { id: 'self', label: '自己先放着', effect: { burn: 4, rep: -0.5 }, result: '后门多了几只油桶。' }
      ] },
    { id: 'E07', name: '帮工拿料回家', type: 'tense', phase: 'post', once: true, w: 1.2, when: { helper: true, minDay: 5 },
      stage: { who: ['helper'], prop: 'bag', light: 'dusk' },
      text: '收摊时，帮工的布袋里鼓着两斤面粉。她低着头没说话。',
      choices: [
        { id: 'ask', label: '先问问情况', effect: { aff: { man: 1 }, flag: { helperTrust: true }, cap: 0 }, result: '她家里老人住院了。老周没再追究。' },
        { id: 'deduct', label: '扣一天工钱', effect: { cash: 3000, rep: -0.5 }, result: '她点头收下了少的那份。' },
        { id: 'fire', label: '请她走', effect: { helperLeave: true, rep: -1 }, result: '明天起又是老周一个人。' }
      ] },
    { id: 'E08', name: '短视频投诉', type: 'tense', phase: 'pre', once: true, w: 1.4, when: { minDay: 13, burnMin: 35 },
      stage: { who: ['neighbor'], prop: 'phone', light: 'day' },
      text: '有人发视频说吃完胃不舒服，评论里有人认出了小馆的门头。',
      choices: [
        { id: 'public', label: '公开回应并公示', effect: { burn: -15, rep: -2, cash: -3000, aff: { zheng: 1 } }, result: '老周把进货单拍照贴在了门口。' },
        { id: 'refund', label: '核查后退款', effect: { burn: -8, cash: -2000, rep: 0 }, result: '对方收下了退款，删了视频。' },
        { id: 'silent', label: '沉默', effect: { rep: -4, burn: 5, flow: 0.85 }, result: '视频下面的评论越来越多。' }
      ] },
    { id: 'E09', name: '房东涨租', type: 'tense', phase: 'post', once: true, w: 1.1, when: { minDay: 15, maxDay: 24 },
      stage: { who: ['landlord'], prop: 'lease', light: 'dusk' },
      text: '房东把计算器推过来：“隔壁问过价了，下个月每天多二十。”',
      choices: [
        { id: 'talk', label: '谈一谈', effect: { flag: { rentTalk: true }, renewalDelta: -20000, rep: 0 }, result: '房东松了口：押金可以分两次。' },
        { id: 'accept', label: '接受', effect: { renewalDelta: 20000, aff: {} }, result: '老周在新数字下签了名。' },
        { id: 'move', label: '考虑搬走', effect: { flag: { thinkMove: true } }, result: '老周开始留意街口的招租启事。' }
      ] },
    { id: 'E10', name: '燃气检修', type: 'tense', phase: 'pre', once: true, w: 0.9, when: { minDay: 6 },
      stage: { who: ['inspector'], prop: 'wrench', light: 'day' },
      text: '燃气公司贴了通知：上午检修，灶具最好别开。',
      choices: [
        { id: 'close', label: '停业半天', effect: { flow: 0.5, rep: 0.5 }, result: '门口挂了“下午见”。' },
        { id: 'cold', label: '改卖冷食', effect: { flow: 0.75, cash: -1000 }, result: '凉拌菜和豆浆撑过了一上午。' },
        { id: 'risk', label: '照常开火', effect: { burn: 10, flow: 1, delayed: [{ after: 1, rep: -2, note: '有人看见你检修时开火' }] }, result: '火苗窜起来那一下，老周心里一紧。' }
      ] },
    { id: 'E11', name: '大雨外卖暴涨', type: 'daily', phase: 'pre', once: false, cd: 6, w: 1.6, when: { weather: 'rain' },
      stage: { who: ['ali'], prop: 'helmet', light: 'rain' },
      text: '雨下大了，外卖单一张接一张地响，堂食的老人还在门口收伞。',
      choices: [
        { id: 'all', label: '全接', effect: { flow: 1.25, rep: -1, aff: { ali: 1 } }, result: '阿力来回跑了七趟。堂食等得有点久。' },
        { id: 'some', label: '接一半，留出堂食', effect: { flow: 1.1, rep: 0.5 }, result: '堂食和外卖都没耽误太久。' },
        { id: 'dine', label: '只做堂食', effect: { flow: 0.95, rep: 1, aff: { zhao: 1 } }, result: '雨声里，店里格外安静。' }
      ] },
    { id: 'E12', name: '隔壁店歇业', type: 'daily', phase: 'post', once: true, w: 1, when: { minDay: 8 },
      stage: { who: ['man'], prop: 'box', light: 'dusk' },
      text: '隔壁粉店拉下了卷帘门。老板娘抱着一箱碗站在门口。',
      choices: [
        { id: 'help', label: '帮忙收尾', effect: { aff: { man: 1 }, rep: 1, cash: -1000 }, result: '两人把碗码进了纸箱。' },
        { id: 'take', label: '接手她的客人', effect: { delayed: [{ after: 1, flow: 1.12, note: '隔壁的熟客来了' }] }, result: '老周在门口多挂了一块牌子。' },
        { id: 'distance', label: '保持距离', effect: {}, result: '她走的时候，没回头。' }
      ] },
    { id: 'E13', name: '临时停电', type: 'daily', phase: 'pre', once: true, w: 0.9, when: { minDay: 4 },
      stage: { who: [], prop: 'candle', light: 'dark' },
      text: '整条街停电了。燃气还在，豆浆机却转不动。',
      choices: [
        { id: 'close', label: '提前打烊', effect: { flow: 0.6 }, result: '老周点了根蜡烛，算了一遍账。' },
        { id: 'limited', label: '做有限菜单', effect: { flow: 0.85, rep: 0.5 }, result: '烛光里卖粥，街坊说像小时候。' }
      ] },
    { id: 'E14', name: '新供应商送样', type: 'daily', phase: 'pre', once: true, w: 1, when: { minDay: 5 },
      stage: { who: ['supplier'], prop: 'crate', light: 'day' },
      text: '新供应商拎来一箱样品肉，价格低三成，没带检疫票据。',
      choices: [
        { id: 'trial', label: '小批试用', effect: { cash: 2000, burn: 9 }, result: '肉看着没问题。票据说下次补。' },
        { id: 'papers', label: '索证后再谈', effect: { flag: { askedPapers: true }, delayed: [{ after: 3, cash: 1500, note: '供应商补齐了票据，给了个优惠' }] }, result: '对方愣了一下：“行，我回去拿。”' },
        { id: 'refuse', label: '拒绝', effect: {}, result: '箱子被抱走了。' }
      ] },
    { id: 'E15', name: '社区团购', type: 'daily', phase: 'pre', once: true, w: 1, when: { minDay: 7 },
      stage: { who: ['neighbor'], prop: 'list', light: 'day' },
      text: '小区团长要订八十份早餐，每份压价三成，明早七点前送到。',
      choices: [
        { id: 'take', label: '接下', effect: { cash: 12000, cap: -20, rep: -0.5 }, result: '散客排到门外，有人走了。' },
        { id: 'half', label: '接一半', effect: { cash: 6000, cap: -10 }, result: '团长不太满意，还是付了款。' },
        { id: 'no', label: '守住散客', effect: { rep: 0.5, aff: { gong: 1 } }, result: '龚师傅按时吃上了早饭。' }
      ] },
    { id: 'E16', name: '电视台拍街景', type: 'daily', phase: 'pre', once: true, w: 0.8, when: { minDay: 11 },
      stage: { who: ['camera'], prop: 'camera', light: 'day' },
      text: '电视台在拍老街，问能不能让顾客“表情再开心一点”。',
      choices: [
        { id: 'normal', label: '正常营业', effect: { rep: 1.5 }, result: '镜头拍下了真实的早晨。' },
        { id: 'stage', label: '临时摆拍', effect: { flow: 1.1, burn: 3, rep: 0.5 }, result: '老周端着空碗，笑得有点僵。' },
        { id: 'no', label: '不参与', effect: {}, result: '摄像机转去了街对面。' }
      ] },
    { id: 'E17', name: '学生春游路过', type: 'daily', phase: 'pre', once: true, w: 0.9, when: { minDay: 9 },
      stage: { who: ['students'], prop: 'flag', light: 'day' },
      text: '一队学生举着小旗停在门口，老师问能不能三十份打包。',
      choices: [
        { id: 'big', label: '接大单', effect: { cash: 9000, cap: -12, aff: { zheng: 1 } }, result: '孩子们排队拿走了饭盒。' },
        { id: 'part', label: '只做豆浆油条', effect: { cash: 4500, cap: -6 }, result: '每人一杯豆浆，热乎乎的。' },
        { id: 'no', label: '婉拒', effect: { rep: -0.5 }, result: '老师带着队伍走向了街口。' }
      ] },
    { id: 'E18', name: '自来水异常', type: 'daily', phase: 'pre', once: true, w: 0.8, when: { minDay: 12 },
      stage: { who: [], prop: 'tap', light: 'day' },
      text: '水龙头流出的水有点发黄，物业说下午才能修好。',
      choices: [
        { id: 'stop', label: '公示停做汤品', effect: { flow: 0.8, rep: 1, burn: -2 }, result: '门口贴了手写告示。' },
        { id: 'buy', label: '买桶装水', effect: { cash: -4000, rep: 0.5 }, result: '十几桶水码在了后厨。' },
        { id: 'go', label: '照常做', effect: { burn: 12 }, result: '粥的颜色深了一点。' }
      ] },
    { id: 'E19', name: '老主顾搬家', type: 'daily', phase: 'post', once: true, w: 0.9, when: { minDay: 14 },
      stage: { who: ['neighbor'], prop: 'suitcase', light: 'dusk' },
      text: '吃了五年早饭的王阿姨要搬去儿子那边，最后点了碗面。',
      choices: [
        { id: 'free', label: '这碗不收钱', effect: { cash: -900, rep: 1.5 }, result: '她把碗端得很稳，吃得很慢。' },
        { id: 'pay', label: '照常收钱', effect: { rep: 0 }, result: '她把零钱放在桌上：“规矩是规矩。”' }
      ] },
    { id: 'E20', name: '街坊饺子日', type: 'daily', phase: 'pre', once: true, w: 0, when: { day: 22 }, story: true,
      stage: { who: ['man', 'zhao'], prop: 'dough', light: 'day' },
      text: '饺子日到了。街坊们带着馅料来，问老周备多少皮。',
      choices: [
        { id: 'many', label: '多备些', effect: { cash: -5000, flow: 1.25, rep: 1 }, result: '店里一下坐满了。' },
        { id: 'normal', label: '照常备', effect: { flow: 1.1 }, result: '刚好卖完。' },
        { id: 'free', label: '饺子半价', effect: { flow: 1.35, cash: -3000, rep: 2, aff: { man: 1, ge: 1 } }, result: '整条街都来吃饺子了。' }
      ] },
    { id: 'E21', name: '爷孙早餐', type: 'relax', phase: 'post', once: true, w: 1.2, when: { minDay: 3, aff: { zhao: 1 } },
      stage: { who: ['zhao'], prop: 'notebook', light: 'day' },
      text: '孙子趴在桌上写作业，赵爷爷把油条掰成小段泡进豆浆。',
      choices: [{ id: 'ok', label: '再添一勺豆浆', effect: { aff: { zhao: 1 } }, result: '孙子抬头说：“谢谢周爷爷。”' }] },
    { id: 'E22', name: '深夜来应聘', type: 'relax', phase: 'post', once: true, w: 1.2, when: { minDay: 4, helper: false },
      stage: { who: ['helper'], prop: 'bag', light: 'night' },
      text: '打烊后，一个中年女人站在门口：“老板，招人吗？我包子包得快。”',
      choices: [
        { id: 'hire', label: '招她（日薪30）', effect: { hireHelper: true }, result: '明天起，她早上五点来。' },
        { id: 'no', label: '再等等', effect: {}, result: '她留了个电话号码。' }
      ] },
    { id: 'E23', name: '试用之后', type: 'relax', phase: 'post', once: true, w: 0, chainOnly: true, when: {},
      stage: { who: ['song'], prop: 'powder', light: 'night' },
      text: '小宋皱着眉放下勺子：“周叔，这几天的粥……味道有点不一样。”',
      choices: [
        { id: 'admit', label: '说实话，扔掉那袋粉', effect: { burn: -12, rep: -1, aff: { song: 1 } }, result: '小宋松了口气：“我就知道你会说。”' },
        { id: 'deny', label: '说是新换的米', effect: { burn: 8, aff: { song: -2 } }, result: '小宋没再问。她之后来得少了。' }
      ] },
    { id: 'E24', name: '护士夜班', type: 'relax', phase: 'post', once: true, w: 1, when: { minDay: 5, aff: { song: 2 } },
      stage: { who: ['song'], prop: 'coat', light: 'night' },
      text: '小宋下夜班来时店已打烊，她敲了敲卷帘门。',
      choices: [
        { id: 'open', label: '重新开火', effect: { aff: { song: 1 }, cash: -300 }, result: '一碗热粥，她捧着暖手。' },
        { id: 'pack', label: '给她剩下的豆浆', effect: { aff: { song: 0.5 } }, result: '她说凉的也好喝。' }
      ] },
    { id: 'E25', name: '骑手的雨天', type: 'relax', phase: 'post', once: true, w: 1.2, when: { weather: 'rain', aff: { ali: 1 } },
      stage: { who: ['ali'], prop: 'helmet', light: 'rain' },
      text: '阿力浑身湿透，站在门边吃完了油条，手机又响了。',
      choices: [
        { id: 'sit', label: '让他坐下歇五分钟', effect: { aff: { ali: 1 } }, result: '他第一次摘下了头盔。' },
        { id: 'go', label: '给他装杯热豆浆带走', effect: { aff: { ali: 0.5 }, cash: -400 }, result: '他骑进雨里，杯子挂在车把上。' }
      ] },
    { id: 'E26', name: '学生问配方', type: 'relax', phase: 'post', once: true, w: 1, when: { minDay: 6, aff: { zheng: 1 }, burnMax: 59 },
      stage: { who: ['zheng'], prop: 'notebook', light: 'day' },
      text: '小郑翻开笔记本：“周叔，白粥为什么要先泡米？能写进我的作业吗？”',
      choices: [
        { id: 'teach', label: '一五一十讲', effect: { aff: { zheng: 1 }, burn: -2 }, result: '他记了满满两页。' },
        { id: 'secret', label: '“祖传的，不能说”', effect: {}, result: '他笑着合上本子：“那我自己猜。”' }
      ] },
    { id: 'E27', name: '菜贩的南瓜', type: 'relax', phase: 'post', once: true, w: 1, when: { minDay: 6, aff: { qin: 1 } },
      stage: { who: ['qin'], prop: 'pumpkin', light: 'dusk' },
      text: '老秦卸下一个大南瓜：“卖剩的，品相不好，你拿去熬粥。”',
      choices: [
        { id: 'take', label: '收下，回他一碗面', effect: { aff: { qin: 1 } }, result: '老秦坐下吃面，三轮车在门口晒太阳。' },
        { id: 'pay', label: '坚持付钱', effect: { cash: -800, aff: { qin: 0.5 } }, result: '他推了两次，最后收了。' }
      ] },
    { id: 'E28', name: '龚师傅的茶', type: 'relax', phase: 'post', once: true, w: 1, when: { minDay: 8, aff: { gong: 2 } },
      stage: { who: ['gong'], prop: 'teacup', light: 'morning' },
      text: '龚师傅把搪瓷茶杯放在柜台：“开了二十年头班车，下个月退了。”',
      choices: [
        { id: 'listen', label: '陪他喝一杯', effect: { aff: { gong: 1 } }, result: '他讲起这条街以前有条河。' },
        { id: 'busy', label: '先忙去了', effect: {}, result: '茶杯在柜台上放凉了。' }
      ] },
    { id: 'E29', name: '小满的糖', type: 'relax', phase: 'post', once: true, w: 1, when: { minDay: 6, aff: { man: 1 } },
      stage: { who: ['man'], prop: 'sugar', light: 'day' },
      text: '小满端来一罐红糖：“上次误会你抢我客人，赔个礼。”',
      choices: [
        { id: 'take', label: '收下，教她熬糖', effect: { aff: { man: 1 } }, result: '两人在后厨熬糖，满屋甜味。' },
        { id: 'polite', label: '客气地推辞', effect: { aff: { man: 0.5 } }, result: '罐子还是留在了窗台上。' }
      ] },
    { id: 'E30', name: '月底初心', type: 'relax', phase: 'post', once: true, w: 0, when: { day: 27 }, fixed: true,
      stage: { who: [], prop: 'ledger', light: 'night' },
      text: '打烊后，老周翻开这个月的账本，第一页写着开门那天的日期。',
      choices: [{ id: 'ok', label: '合上账本', effect: { recall: true }, result: '明天，就是月底了。' }] }
  ];
  var byId = {};
  list.forEach(function (e) { byId[e.id] = e; });
  return { list: list, byId: byId };
});
