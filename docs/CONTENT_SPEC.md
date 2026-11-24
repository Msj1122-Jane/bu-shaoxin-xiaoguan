# 《不烧心小馆》重制版 · 内容规格与叙事圣经（V2）

本文件是内容作者（人或 AI）与引擎之间的合同。引擎只认这里写明的字段；写了别的字段会被校验器报错。

## 0. 这个游戏现在是什么

玩家就是老周，**整个早晨都站在柜台后面**。一屏实时早市（约 3 分钟一天）：粥锅、油锅、煎锅、面锅、豆浆桶就地操作，客人拿着票据站在柜台前，门外还排着队。每一位客人都是真钱。故事不靠弹窗——**故事是客人带进店里的**：他们点什么、少点什么、多给钱、赊账、说"老样子"、落下东西、今天没来。

一天的结构：
1. **晨备**（卷帘门还没拉）：定菜单、备多少份、油换不换、料买谁的、价钱、要不要把进货单贴门口。
2. **开门前**（可选一场，`when:'open'`）：推销员、检查员、供货商这类"要你当场拿主意"的人。
3. **早市**：实时营业。这里**绝不弹选择**，只有气泡短句、票据变化、动作。
4. **收摊**（可选一到两场，`when:'close'`）：真正的对话、冲突和选择放在这里。人物站在柜台前说话，不是站在文本框旁边。
5. **晚账**：账本、街坊的话、添置、明天。

## 1. 文风铁律

- 早市气泡 **≤ 14 个汉字**，一句一事。收摊对白每句 **≤ 26 字**，一场 **≤ 14 句**。旁白 `n` 每场最多 2 句，每句 ≤ 24 字。
- 口语、具体、有物件。写"袖口磨亮了""硬币是数好的""头盔没摘"，不写"他看起来很疲惫"。
- 不说教，不总结，不替玩家下判断。老周嘴笨心软好面子，不讲道理，只说"嗯""行""我明天换油"。
- 人物不主动交代身世。问题先通过行为露出来（少点一份、改口、迟到、替别人付钱、没来），隔几天才有人说破，而且常常是别人说破。
- 便宜、冻品、散装油不等于违法有毒；"烧心"不是医学诊断。不出现真实品牌、真实地名。
- 称呼统一：年轻人叫"周叔"，同辈和长辈叫"老周"，豆豆叫"周爷爷"。地点：柳河街（临河老街），7 路公交头班车 6:10 过站。
- 人物之间有牵连（见 §6），请互相提到对方。

## 2. 可用的 id

**菜**（`dish`）：`soy` 现磨豆浆 · `congee` 白粥 · `youtiao` 油条 · `scallion` 葱油饼 · `egg` 煎蛋 · `teaegg` 茶叶蛋 · `pidan` 皮蛋瘦肉粥 · `noodle` 小面 · `friedrice` 蛋炒饭 · `shengjian` 生煎包 · `soyyt` 豆浆泡油条 · `mutton` 羊肉汤 · `chicken` 鸡汤面 · `mixian` 米线 · `tangyou` 糖油果子 · `pumpkin` 南瓜粥 · `poachnoodle` 荷包蛋面 · `yeerba` 叶儿粑 · `tangyuan` 醪糟汤圆 · `dumpling` 饺子

默认解锁日：第1日 soy/congee/youtiao；3 scallion/egg；8 teaegg；7 pidan；8 noodle；9 friedrice；10 shengjian/soyyt；12 mutton（看主线选择）；13 chicken；14 mixian；15 tangyou；16 poachnoodle；18 pumpkin；20 yeerba/tangyuan；22 dumpling。常客的节拍可以用 `fx.unlock` **提前**送出某道菜（teaegg→龚师傅，soyyt→豆豆，tangyou/yeerba→小满，pumpkin/pidan→老秦，poachnoodle→阿力）。

**口味标签**（`wish`，客人说不清要什么时用）：`汤水` `顶饱` `清淡` `油香` `甜` `肉` `快`

**做法要求**（写在菜 id 后，冒号分隔）：`youtiao:嫩` `youtiao:老`（也可用于 scallion/egg/shengjian/tangyou）· `congee:温`（"晾一下再装"，可用于一切汤水类）

**常客**：`zhao` 赵爷爷（带孙子豆豆）· `song` 小宋 · `ge` 老葛 · `ali` 阿力 · `gong` 龚师傅 · `man` 小满 · `zheng` 小郑 · `qin` 老秦

**配角**（可 `enter`）：`landlord` 房东汪姐 · `hu` 批发商老胡 · `powder` 推销员 · `inspector` 检查员小陈 · `vlogger` 探店博主 · `recycler` 收废油的 · `guifen` 帮工桂芬 · `heyi` 前店主何姨 · `peer` 早餐车老板 · `doudou` 豆豆（单独出现时）· `tangtang` 糖糖（小满的女儿）· `aunty` 团购刘姐 · `tv` 电视台记者 · `neighbor` 街坊 · `kid` 学生娃

## 3. 条件 `need`（所有字段可省，写了的要同时满足）

```js
{ day:[min,max],            // 含两端，max 可省
  aff:{zhao:3},             // 某常客好感下限（0–10）
  flags:['a'], not:['b'],   // 旗标全有 / 全无
  seen:['beatOrSceneId'], unseen:['id'],
  weather:'rain',           // 'sun' | 'cloud' | 'rain'
  burn:[min,max], rep:[min,max], cash:[min,max],   // cash 单位：元
  oilAge:[min,max],         // 这锅油用了几天，0=今天新换
  price:[min,max],          // 今天价位 0 薄利 / 1 公道 / 2 提价
  priceAvg:[min,max],       // 近五天平均价位
  mat:[min,max],            // 今天用料 0 批发冻品 / 1 老秦的鲜货 / 2 有票可溯源
  menu:['dishId'],          // 今天菜单上都有
  helper:true, posted:true, // 请了帮工 / 今天贴了进货单
  fast:true,                // 昨天平均等候短
  quality:[min,max],        // 昨天出品平均分 0–1
  credit:[min,max],         // 老葛欠的账（元）
  any:[need, need] }        // 任一满足
```

**引擎自动设置、内容可读的旗标**：`slip_ever`（贴过进货单）· `hood`（装了排烟罩）· `awning` · `helper` · `returned_extra` / `kept_extra`（赵爷爷多给钱时还了 / 收了）· `rent_late`（有一周房租没交齐）· `viral_good` / `viral_bad` / `viral_plain`（第 18 日视频的口径，由引擎按当时的油、用料、烧心判定）· `crisis_rectify` / `crisis_refund` / `crisis_hold` · `renewed` / `chipin` / `left`（第 26 日续租结果）· `powder_used` / `powder_hidden` · `cheap_mutton`。
内容自己发明的旗标请加前缀：常客线用 `<id>_`，主线与事件用 `s_` / `e_`。

## 4. 效果 `fx`

```js
{ cash:-30, rep:+2, burn:+8, aff:{song:+1},
  set:['flag'], clear:['flag'],
  unlock:'dishId', memento:'m_id', fact:['zhao','f_id'],
  flow:1.15,                 // 当天客流倍率
  flowNext:0.9,              // 次日客流倍率
  deposit:-200,              // 续租押金增减（元）
  helper:true,               // 请 / 辞帮工
  later:{days:2, fx:{rep:+2}, note:'晚账里出现的一句话'} }
```

## 5. 常客线 `arcs`

文件 `src/content/arcs_a.js`（zhao/song/ge/ali）与 `src/content/arcs_b.js`（gong/man/zheng/qin），格式：

```js
BSX.define('content/arcs_a', function () {
  return {
    zhao: {
      usual: ['congee', 'youtiao', 'youtiao:嫩'],      // "老样子"
      facts: { f_teeth: '豆豆在换牙，油条要炸嫩一点。' },   // 小本子上会一条条记下来
      mementos: { m_homework: { name: '豆豆的作业本', text: '封面写着"三年二班"。', kind: 'paper' } },
      beats: [ /* 见下，按顺序 */ ],
      barks: {            // 没有节拍的普通日子，按情况随机一句（每类 3–5 句）
        in: ['老样子。'], inRain: [], inOilOld: [], inPriceUp: [], inPriceDown: [], inBusy: [],
        good: [], ok: [], bad: [], slow: [], out: []
      },
      epilogue: [ { need:{...}, text:'结局里关于他的一段，≤ 60 字' }, { text:'兜底' } ]   // 自上而下取第一条满足的
    }
  };
});
```

`kind`（纪念物画法）：`photo` `paper` `note` `cloth` `mug` `food` `drawing` `book` `tool`。

### 节拍 beat

每位常客每天最多走一个节拍。引擎每天清晨按顺序找**第一个没走过、条件满足**的节拍；找不到就是普通来客（或不来）。`group` 相同的节拍只走一个（用来写互斥分支）。过了 `need.day` 的上限就永久错过。

```js
{ id: 'zhao3', need: { day:[4,9], aff:{zhao:2} },
  key: true,                    // 条件满足当天必来（否则按出勤概率）
  at: 'early',                  // 'open' 第一个 | 'early' | 'rush' | 'late' | 'last' 最后一个；或 0–1 小数
  order: ['congee', 'youtiao:嫩'],   // 或 'usual'；或含 {wish:'汤水'}；空数组=不点东西
  hide: true,                   // 票据只写"老样子"，考玩家记性
  togo: true,                   // 打包
  note: '明早给豆豆留两根嫩的 —赵',  // 当天晨备时贴在备料板上的条子（预订、叮嘱）
  say: {
    in: '老样子。',               // 走到柜台
    chat: [['a','今天月考。'], ['z','考完来加个蛋。'], ['a','他说要考双百。']],  // 玩家点"…"才展开；a=该常客 z=老周 b=同行的人
    good: '这碗有米油。', ok: '行。', bad: '有点糊了。', slow: '孩子要迟到了。', out: '走了。'
  },
  act: 'overpay',               // 见下表
  remark: { who: 'gong', line: '老赵今天没来？' },   // act:'absent' 时由谁说一句（who 可写 'walkin'）
  leave: { memento: 'm_homework', line: '柜台上落了个作业本。' },   // 落下东西，收摊时被发现并上墙
  fx: {...}, fxGood: {...}, fxBad: {...},       // 来过即生效 / 吃好了 / 没吃好或等走了
  after: 'sc_zhao_homework' }   // 当晚收摊加演一场（场景写在同一文件的 scenes 里，见 §7）
```

`act` 取值：
- `'overpay'` 多给了一份的钱。多出的硬币会在柜台上亮几秒，玩家点它＝还回去（`returned_extra`，好感＋），不点＝收下（`kept_extra`）。
- `'credit'` 吃完不付："记账上。"钱不进盒子，记在赊账页。
- `'repay'` 把欠的账连同今天的一起付清。
- `'treat'` 多付一份："后面那位算我的。"下一位散客免单并受宠若惊。
- `'coins'` 一把数好的硬币，慢慢数给你。
- `'peek'` 不点东西，站一会儿看看就走（`order` 留空）。
- `'absent'` 今天不来，由 `remark` 里的人提一句。
- `'big'` 大单（配合 `note` 提前一天或当天晨备告知）。

写法要求：每位常客 **8–10 个节拍**，从第 1–4 日的初次露面排到第 27/28 日；至少 2 个用 `hide`，至少 1 个 `absent`，至少 1 个 `leave`，至少 1 个带 `after` 收摊戏，至少 2 组按玩家经营方式分叉的 `group`（例如油旧/油新、提价/薄利、快/慢、贴没贴进货单）。初次露面那拍不要 `hide`，要让玩家看清他点什么。

## 6. 人物圣经（必须遵守的骨架，台词细节请发挥）

**老周** 48 岁，原食品厂后勤，下岗后拿补偿金盘下柳河街十平米早餐铺，短租 28 天。胃不好，兜里揣着胃药——在厂里食堂吃了二十年回锅油。店外招牌是空的，他还没想好写什么。

**何姨** 前店主，六十多，搬去女儿家带外孙。留下一口老煎锅、一本手写的粥谱、抽屉里一张条子："油三天一换，别省。"龚师傅和老秦都认得她。

**赵爷爷和豆豆**（zhao）：每天 6:40，白粥一碗、油条两根（一根要嫩，豆豆换牙），布钱包里数硬币。**藏着的事**：爷爷记性在变差——会付两次钱、重复同一句话、有一天走到门口忘了要买什么；豆豆小声替他圆："爷爷，给过了。"**转折**：某天豆豆一个人来，攥着钱包："爷爷今天不认得路了。老样子。"——玩家记得的"老样子"成了替爷爷记着的东西。**与经营的关系**：多给的钱还不还；出品糊了豆豆直说；提价后爷爷把两根油条改成一根。**结局痕迹**：豆豆的作文《我家楼下的早餐店》。

**小宋**（song）：消化科夜班护士，6:00 开门第一个，眼睛半闭，只要白粥，不要油的。鼻子灵，闻得出油哈了。**藏着的事**：在想要不要辞职。**转折**：她一直把你的粥推荐给出院病人当"出院第一顿"——油好时她带来科室的大单（`big`）；油旧时她先说"油有点哈"，再就不来了，后来有病人家属找上门。阿力送餐的吴奶奶就住在她的病区。**结局痕迹**：护士站小黑板上写着小馆的电话；她没辞。

**老葛**（ge）：旧西装袖口磨亮，先问价再点，点最顶饱最便宜的，坐得最久，手机上是招聘页面。**藏着的事**：上个月就没班上了，瞒着家里，每天照常"上班"。**转折**：他原来是会计——第 15 日检查要台账，他提出替你把账理清，换一个月早饭记账（`credit`）；答应了，晚账从"粗账"变"细账"。提价后他少点一份、只要一杯豆浆、最后改去公交站的早餐车。**结局痕迹**：第一个月工资请你吃早饭——"在你店里请你。"或者一本记得整整齐齐、最后一页写着"两清"的账。

**阿力**（ali）：外卖骑手，头盔不摘，站着吃，要快的，雨天来得多。**藏着的事**：他每天自掏腰包给六楼独居的吴奶奶带一份早饭，备注"粥晾一下再装，牙不好"。**转折**：某天他点了两份又说"一份不要了"——吴奶奶住院了；或雨天摔了一跤，雨衣撕了，第一次坐下来。你出餐慢，他是真的被扣钱。**结局痕迹**：每天坐下吃十分钟——"这十分钟算我的。"

**龚师傅**（gong）：7 路头班车司机，6:05 准到，搪瓷茶缸，油条要炸老的，零钱正好。爱讲这条街从前是条河。**藏着的事**：月底退休，而且 7 路要并线，柳河街这一站要撤——早上的人流会变。**转折**：第 27 日最后一班，他把车绕到店门口，一车人下来买早饭（突然的高峰）；第 28 日他头一次 8:30 才来，不知道早晨该干什么。**结局痕迹**：茶缸留在架子上。

**小满**（man）：隔壁"小满改衣"的裁缝。头几天不买东西，站在门口看，数你的客人。**藏着的事**：不是嫌你抢生意——你的油烟顺着后窗飘进她店里，她女儿糖糖气管不好。**转折**：油旧时她关窗、不来、终于来敲门；装了排烟罩或坚持换油，她开始买葱油饼、每天打包一碗白粥给糖糖，后来给你缝了新门帘。押金凑不齐时是她挨家去说。糖糖和豆豆同班。**结局痕迹**：绣了店名的门帘。

**小郑**（zheng）：大四学生，豆浆加煎蛋，带笔记本，问怪问题（"周叔，一根油条成本多少？"），爱拍照。**藏着的事**：在写毕业论文《一家早餐店的诚实成本》。**转折**：第 18 日那条火了的短视频是他发的——他只是把看到的照实发了，所以视频口径就是你这半个月怎么做生意。发完他不敢来（`absent`），过两天才来认。他还采访过老葛。**结局痕迹**：论文附录——结局页的统计数字以他的论文表格呈现。

**老秦**（qin）：菜贩，三轮车，天不亮送货，收了摊（最后一个客人）来吃碗面。**藏着的事**：批发商老胡在挤他；他一直按亏本价给你送，因为何姨当年帮过他。**转折**：你连着买冻品，他不说话，只是车上的菜越来越少；原料涨价那几天（9–14 日）你还用他的货，他送来老南瓜。某天收摊他把卖不掉的菜留下："你拿去。"**结局痕迹**：每天清晨停在门口的三轮车；或者他回了乡下。

**房东汪姐**：五十多，腰上一串钥匙，说话快，不坏。**桂芬**：来应聘的帮工，四十多，家里有个卧床的婆婆。**老胡**：批发商，"票嘛下回补"。

## 7. 场景 scenes（收摊戏、开门戏、主线、事件共用）

```js
{ id:'sc_zhao_homework', title:'作业本', when:'close',     // 'open' | 'close'
  light:'dusk',                                           // 可省：'dawn' 'day' 'dusk' 'night' 'candle' 'rain'
  beats: [
    { enter:'zhao', slot:1 },            // slot 0–3，柜台从左到右
    ['zhao', '作业本落这儿了，豆豆急哭了。'],   // [谁, 话]；'z' 是老周；'n' 是旁白
    ['z', '给。压在零钱盒底下，没脏。'],
    { prop:'homework', label:'作业本' },   // 柜台上出现一件东西；{prop:'x', off:true} 收走
    { do:'hold', label:'按住，把门帘挂上' },  // 小动作：'tap' 或 'hold'
    { if:{ flags:['kept_extra'] }, then:[ ['zhao','上回我是不是多给了？'] ], else:[] },
    { choice:[
        { label:'收下', hint:'便宜三成', fx:{ cash:+60, burn:+10, set:['cheap_mutton'] }, then:[ ['hu','爽快。'] ] },
        { label:'要票', need:{ cash:[80] }, fx:{ cash:-40 }, then:[ ['hu','行，下回带来。'] ] } ] },
    { fx:{ aff:{zhao:+1}, memento:'m_homework' } },
    { exit:'zhao' },
    { sfx:'bell' }, { wait:0.6 }, { light:'night' }, { bus:true }, { shutter:'down' }
  ] }
```

`prop` 可用：`lease` 租约 · `envelope` 信封 · `powder` 增香粉 · `meat` 羊肉 · `phone` 手机 · `slip` 进货单 · `mug` 茶缸 · `pumpkin` 南瓜 · `notebook` 笔记本 · `homework` 作业本 · `candle` 蜡烛 · `keys` 钥匙 · `curtain` 门帘 · `photo` 照片 · `pills` 胃药 · `ledger` 账本 · `veg` 一筐菜 · `oilcan` 油桶 · `cash` 一沓钱 · `paper` 一张纸（配 `label`）。
`sfx` 可用：`bell` `coin` `page` `shutter` `horn` `rain` `sizzle` `pour` `stamp` `knock` `phone` `sigh`.

选择的写法：2–3 个选项，每个都要有代价也要有现实的理由；`label ≤ 8 字`，`hint ≤ 10 字` 只写看得见的后果（钱、今天客流），不剧透长期后果。

### 事件 events

```js
{ id:'e_powder', title:'增香粉', when:'open', need:{ day:[4,9] }, weight:1, once:true, cool:5,
  beats:[ ... ] }
```
没有主线戏的日子，引擎从条件满足的事件里按权重抽**最多一场**（开门或收摊）。

常客线的收摊戏写在该常客对象的 `scenes: { sc_id: {...} }` 里。

主线与事件额外可用——`need.affSum:[min,max]`（八位常客好感之和）；`fx.payDeposit:true`（付清续租押金）、`fx.chipin:true`（街坊凑齐差额，现金清零）、`fx.shift:0.6`（当天营业时长倍率）、`fx.closeNext:true`（次日停业一天）。

### 主线场景（`src/content/scenes.js` 的 `main`，id、日子、时段固定）

| id | 日 | 时段 | 内容 |
|---|---|---|---|
| `m01_open` | 1 | open | 五点半。按住拉起卷帘门。赵爷爷问"你这店叫什么"——"还没想好。" |
| `m01_close` | 1 | close | 抽屉里何姨留的条子和粥谱（纪念物 `m_heyi_note`）。 |
| `m02_close` | 2 | close | 灶台底下翻出何姨的老煎锅 → `fx.unlock` scallion、egg。 |
| `m07_close` | 7 | close | 房东汪姐：短租 28 日到期；续租押金 1200，第 26 日给话；每七天交一次房租。按口碑/现金有 3 种说法。 |
| `m09_open` | 9 | open | 原料涨价。老胡的冻品便宜、老秦的菜也得涨。选择：换老胡 / 自己扛 / 涨价。旗标 `s_costup` 由引擎读（9–16 日进货价 ×1.15）。 |
| `m12_open` | 12 | open（雨） | 老胡的便宜羊肉，"票嘛下回补"。选择：收下（`cheap_mutton`）/ 只要有票的 / 不做羊肉。前两项 `unlock:'mutton'`。 |
| `m15_open` | 15 | open | 检查员小陈例行检查，要台账、看油。按烧心、油龄、是否贴过进货单分 3 种结果（通过加口碑 / 口头提醒 / 罚款）。老葛线会在这天接上。 |
| `m18_open` | 18 | open | 手机震了一早上：那条视频。按 `viral_good` / `viral_bad` / `viral_plain` 三种开场（排队 / 围观质疑 / 不咸不淡）。选择：拉开后厨帘子 / 贴出进货单 / 照常做。 |
| `m22_open` | 22 | open | 整条街停电，只有你的煤气灶还亮。`light:'candle'`。街坊端着馅来——饺子日，`unlock:'dumpling'`。按好感谁来了说一句。 |
| `m26_close` | 26 | close | 汪姐："签不签，给句话。"选择：续租（`payDeposit`，`renewed`）/ 街坊凑（`need:{affSum:[30]}`，`chipin`）/ 不签了（`left`）。 |
| `m27_open` | 27 | open | 龚师傅最后一班。好感够：车绕到门口，一车人下来（`fx.flow:1.5`，`{bus:true}`，`sfx:'horn'`）；不够：车照常开过去，按了一声喇叭。 |
| `m28_close` | 28 | close | 最后一晚。引擎会事先设好旗标 `end_HONEST` / `end_CANTEEN` / `end_PRIVATE` / `end_REOPEN` / `end_PILLS` / `end_FAREWELL` / `end_TRANSFER` / `end_SOMEONE` 之一，请各写一小段；最后 `{do:'hold', label:'按住，拉下卷帘门'}`、`{shutter:'down'}`。 |
| `crisis` | 任意 | close | 烧心到顶的那一晚：有人吃坏了找上门（小宋陪着来）。选择：停业整改（`crisis_rectify`）/ 逐个退赔（`crisis_refund`）/ 硬撑（`crisis_hold`）。数值由引擎按旗标结算。 |
| `rescue` | 任意 | open | 连续两天现金为负：汪姐来了。选择：卖设备（`s_sold`）/ 向小满借（`need:{aff:{man:3}}`，`s_borrow`）/ 再撑一天（`s_refuse`）。 |

## 8. 结局与环境语料

`src/content/endings.js`：

```js
BSX.define('content/endings', function () {
  return {
    list: [ { id:'E_HONEST', title:'贵是贵点，吃了不烧心', sign:'不烧心小馆',   // sign：第 28 日写在空招牌上的字，≤ 6 字；转让结局留空字符串
              mood:'一句话', text:['段落 ≤ 70 字', '…', '…'], letter:{ from:'best', text:'≤ 50 字' }, last:'落幕一句 ≤ 16 字' }, ... 共 8 个 ],
    echoes: [ { need:{ flags:['cheap_mutton'] }, text:'那锅羊肉汤卖得很好。你没再提过票的事。' }, ... ]   // 20–28 条，结局页取满足条件的前 4 条，回收玩家做过的事
  };
});
```
八个结局 id：`E_HONEST` 贵是贵点，吃了不烧心 · `E_CANTEEN` 街坊食堂 · `E_PRIVATE` 只做熟客的私房小馆 · `E_REOPEN` 整改之后，重新开张 · `E_PILLS` 胃药和账单 · `E_FAREWELL` 搬走那天，常客来送行 · `E_TRANSFER` 转让 · `E_SOMEONE` 月底那天，还是有人来了。`letter.from` 可写常客 id 或 `'best'`（好感最高者）。

`src/content/ambient.js`：

```js
BSX.define('content/ambient', function () {
  return {
    walkins: {   // 散客六类：student 学生 · office 上班族 · worker 干活的 · elder 老人 · parent 带娃的 · rider 骑手
      student: { in:[...6句], good:[...4], ok:[...3], bad:[...4], slow:[...4], soldout:[...3], treat:[...2] }, ... },
    wish: { '汤水':['有带汤的吗？', ...3–4句], '顶饱':[], '清淡':[], '油香':[], '甜':[], '肉':[], '快':[] },
    mods: { '嫩':['炸嫩一点。', ...], '老':[], '温':[] },
    queue: [ { need:{ weather:'rain' }, lines:[['这雨。','伞都撑不住。'], ...] }, ... ],   // 门口排队的人互相说的两句，18–24 组，覆盖：雨、油旧(oilAge≥3)、提价、薄利、队长、视频火了/翻车、停电、月底、贴了进货单、兜底
    quotes: [ { need:{...}, from:'街坊' , text:'晚账上"街坊的话"，≤ 22 字' }, ... ],            // 30 条左右，回应昨天的出品、等候、价钱、油、剩菜、进货单
    zhou: [ { need:{ burn:[60] }, text:'老周把台面擦了三遍。' }, ... ],                         // 晚账页脚老周的一个动作或一句心里话，24 条左右，按现金/烧心/口碑/日子分
    pills: ['柜台角上多了一板胃药。', '胃药换成了一整盒。', '抽屉里有三盒胃药，一盒空了。'],         // 烧心 30 / 60 / 85 时柜台上的物件说明
    soldout: ['没了？那算了。', ...4] }
});
```

## 9. 交付自查

- 文件能被 `node -e "globalThis.BSX={define:(n,f)=>console.log(n,Object.keys(f()))};require('./src/content/xxx.js')"` 加载。
- 所有 `dish` / 常客 / 配角 / `prop` / `sfx` id 都在本文件里；所有 `after` 指向的场景都存在；`memento`、`fact` 在本人的 `mementos` / `facts` 里有定义。
- 没有一句超过字数；没有人第一次露面就交代身世。
