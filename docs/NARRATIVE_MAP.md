# 叙事地图（NARRATIVE_MAP）

> 由 `node tools/gen_docs.js` 从 `src/content/` 生成，勿手改。文案为 AI 初稿，待 T2 审校（HUMAN_TASKS H03/H04）。

## 六幕与 7 段 S 级主线演出

| 幕 | 日 | S 演出 | 相位 | 玩家动作 | 分支/变体 |
| --- | --- | --- | --- | --- | --- |
| 序幕·开门 | 1–3 | S01 开门（第1日） | 开店前 | 按住，拉起卷帘门 | — |
| 第一幕·留下的人 | 4–7 | S07 续租通知（第7日） | 营业后 | 把通知压在账本下 | —；条件片段：repMin、cashMax |
| 第二幕·便宜的代价 | 8–12 | S12 便宜的代价（第12日） | 开店前 | 撕下旧价牌 | 收下便宜羊肉 / 只收有票据的 / 这个冬天先不卖羊肉；条件片段：burnMin、aff |
| 第三幕·一句话传开 | 13–18 | S18 一句话传开（第18日） | 开店前 | — | 把后厨帘子掀开 / 贴出进货单 / 不解释，接着做；条件片段：repMin+burnMax、burnMin、repMax、anyAff |
| 第四幕·这条街的晚饭 | 19–22 | S22 这条街的晚饭（第22日） | 开店前 | 捏三个褶 | 多备些 / 照常备 / 饺子半价；条件片段：aff、aff、aff |
| 终幕·月底 | 23–28 | S26 月底抉择（第26日） | 营业后 | — | 签下续租 / 请街坊帮衬押金 / 不签了，月底收摊；条件片段：burnMin、repMin |
| 终幕·月底 | 23–28 | S28 月底（第28日） | 营业后 | 按住，拉下卷帘门 | —；条件片段：ending、ending、ending、ending、ending、ending、ending、ending |

## 八位常客与 24 个故事节点（好感 3 / 5 / 7）

| 常客 | 识别点 | 到访偏好 | 节点 3 | 节点 5 | 节点 7 | 解锁 |
| --- | --- | --- | --- | --- | --- | --- |
| 赵爷爷和孙子 | 军绿马甲·作业本 | 全档位 | 作业本（B） | 考试后加餐（A） | 成绩单（A） | 豆浆泡油条 |
| 护士小宋 | 披外套·夜班 | 新油 | 夜班病房（B） | 夸粥（A） | 发朋友圈（A） | — |
| 西装老葛 | 磨亮袖口的旧西装 | 亲民价 | 失业（B） | 暂别（A） | 签合同（A） | — |
| 骑手阿力 | 头盔·站着吃 | 雨天 | 晾粥备注（B） | 首次堂食（A） | 多等十分钟（A） | 荷包蛋面 |
| 公交司机龚师傅 | 茶杯·老花镜 | 清晨 | 街道旧事（B） | 退休日期（A） | 绕路告别（A） | 茶叶蛋 |
| 裁缝小满 | 针包围裙 | 鲜货 | 抢客误会（B） | 教熬粥（A） | 两店互助（A） | 糖油果子、叶儿粑 |
| 学生小郑 | 笔记本 | 新油、烧心≥60暂停 | 记配方（B） | 夹照片（A） | 毕业论文（A） | — |
| 菜贩老秦 | 三轮车·菜筐 | 可追溯 | 以菜换面（B） | 留鲜货（A） | 送南瓜（A） | 南瓜粥 |

A 级 16 段 = 每人节点 5、7；节点 3 为短演出（B 级舞台）。节点按好感阈值在营业后触发，每日至多 2 段。

## 30 张事件

| ID | 名称 | 类型 | 阶段 | 出现条件 | 选项 → 后果 |
| --- | --- | --- | --- | --- | --- |
| E01 | 网红探店 | 紧张 | 开店前 | minDay:9 repMin:52 · 一次性 | 免单换曝光：cash=-3000 flow=1.15 delayed=[{after:2,rep:2,burn:3,note:视频火了，有人专程来}]<br>正常接待：rep=1<br>婉拒暗示：rep=-1 aff={zheng:1} |
| E02 | 原料涨价 | 紧张 | 开店前 | minDay:8 maxDay:14 · 一次性 | 换个货源：cash=0 burn=4 aff={qin:-1} flag={cheapSupplier:true}<br>跟着调价：rep=-1.5 flag={raisedPrice:true}<br>自己扛着：cash=-8000 aff={qin:1} |
| E03 | 同行价格战 | 紧张 | 开店前 | minDay:10 · 一次性 | 跟价：flow=1.1 cash=-6000 rep=0.5<br>加量不加价：cash=-4000 rep=1.5 aff={ge:1}<br>坚持品质：flow=0.85 rep=0.5 aff={song:1} |
| E04 | 例行检查 | 紧张 | 开店前 | minDay:6 · 冷却9日 | 如实拿出台账：audit=true<br>说账本在家：burn=6 rep=-1 delayed=[{after:2,audit:true,note:检查员又来了}] |
| E05 | 来源不明增香粉 | 紧张 | 开店前 | minDay:2 maxDay:9 · 一次性 | 谢绝：rep=0.5<br>先试一次：burn=8 flow=1.1 flag={additiveTried:true} chain={id:E23,after:3}<br>用上，不说：burn=22 flow=1.18 flag={additiveHidden:true} chain={id:E23,after:3} |
| E06 | 废油回收商 | 紧张 | 营业后 | minDay:5 oilUsedRecycle:true · 一次性 | 交正规回收：cash=1000 burn=-3<br>卖高价：cash=4000 burn=12<br>自己先放着：burn=4 rep=-0.5 |
| E07 | 帮工拿料回家 | 紧张 | 营业后 | helper:true minDay:5 · 一次性 | 先问问情况：aff={man:1} flag={helperTrust:true} cap=0<br>扣一天工钱：cash=3000 rep=-0.5<br>请她走：helperLeave=true rep=-1 |
| E08 | 短视频投诉 | 紧张 | 开店前 | minDay:13 burnMin:35 · 一次性 | 公开回应并公示：burn=-15 rep=-2 cash=-3000 aff={zheng:1}<br>核查后退款：burn=-8 cash=-2000 rep=0<br>沉默：rep=-4 burn=5 flow=0.85 |
| E09 | 房东涨租 | 紧张 | 营业后 | minDay:15 maxDay:24 · 一次性 | 谈一谈：flag={rentTalk:true} renewalDelta=-20000 rep=0<br>接受：renewalDelta=20000 aff={}<br>考虑搬走：flag={thinkMove:true} |
| E10 | 燃气检修 | 紧张 | 开店前 | minDay:6 · 一次性 | 停业半天：flow=0.5 rep=0.5<br>改卖冷食：flow=0.75 cash=-1000<br>照常开火：burn=10 flow=1 delayed=[{after:1,rep:-2,note:有人看见你检修时开火}] |
| E11 | 大雨外卖暴涨 | 日常 | 开店前 | weather:rain · 冷却6日 | 全接：flow=1.25 rep=-1 aff={ali:1}<br>接一半，留出堂食：flow=1.1 rep=0.5<br>只做堂食：flow=0.95 rep=1 aff={zhao:1} |
| E12 | 隔壁店歇业 | 日常 | 营业后 | minDay:8 · 一次性 | 帮忙收尾：aff={man:1} rep=1 cash=-1000<br>接手她的客人：delayed=[{after:1,flow:1.12,note:隔壁的熟客来了}]<br>保持距离： |
| E13 | 临时停电 | 日常 | 开店前 | minDay:4 · 一次性 | 提前打烊：flow=0.6<br>做有限菜单：flow=0.85 rep=0.5 |
| E14 | 新供应商送样 | 日常 | 开店前 | minDay:5 · 一次性 | 小批试用：cash=2000 burn=9<br>索证后再谈：flag={askedPapers:true} delayed=[{after:3,cash:1500,note:供应商补齐了票据，给了个优惠}]<br>拒绝： |
| E15 | 社区团购 | 日常 | 开店前 | minDay:7 · 一次性 | 接下：cash=12000 cap=-20 rep=-0.5<br>接一半：cash=6000 cap=-10<br>守住散客：rep=0.5 aff={gong:1} |
| E16 | 电视台拍街景 | 日常 | 开店前 | minDay:11 · 一次性 | 正常营业：rep=1.5<br>临时摆拍：flow=1.1 burn=3 rep=0.5<br>不参与： |
| E17 | 学生春游路过 | 日常 | 开店前 | minDay:9 · 一次性 | 接大单：cash=9000 cap=-12 aff={zheng:1}<br>只做豆浆油条：cash=4500 cap=-6<br>婉拒：rep=-0.5 |
| E18 | 自来水异常 | 日常 | 开店前 | minDay:12 · 一次性 | 公示停做汤品：flow=0.8 rep=1 burn=-2<br>买桶装水：cash=-4000 rep=0.5<br>照常做：burn=12 |
| E19 | 老主顾搬家 | 日常 | 营业后 | minDay:14 · 一次性 | 这碗不收钱：cash=-900 rep=1.5<br>照常收钱：rep=0 |
| E20 | 街坊饺子日 | 日常 | 开店前 | 第22日主线内 | 多备些：cash=-5000 flow=1.25 rep=1<br>照常备：flow=1.1<br>饺子半价：flow=1.35 cash=-3000 rep=2 aff={man:1,ge:1} |
| E21 | 爷孙早餐 | 松拍 | 营业后 | minDay:3 aff:zhao:1 · 一次性 | 再添一勺豆浆：aff={zhao:1} |
| E22 | 深夜来应聘 | 松拍 | 营业后 | minDay:4 helper:false · 一次性 | 招她（日薪30）：hireHelper=true<br>再等等： |
| E23 | 试用之后 | 松拍 | 营业后 | E05 试用/隐瞒后 3 日 | 说实话，扔掉那袋粉：burn=-12 rep=-1 aff={song:1}<br>说是新换的米：burn=8 aff={song:-2} |
| E24 | 护士夜班 | 松拍 | 营业后 | minDay:5 aff:song:2 · 一次性 | 重新开火：aff={song:1} cash=-300<br>给她剩下的豆浆：aff={song:0.5} |
| E25 | 骑手的雨天 | 松拍 | 营业后 | weather:rain aff:ali:1 · 一次性 | 让他坐下歇五分钟：aff={ali:1}<br>给他装杯热豆浆带走：aff={ali:0.5} cash=-400 |
| E26 | 学生问配方 | 松拍 | 营业后 | minDay:6 aff:zheng:1 burnMax:59 · 一次性 | 一五一十讲：aff={zheng:1} burn=-2<br>“祖传的，不能说”： |
| E27 | 菜贩的南瓜 | 松拍 | 营业后 | minDay:6 aff:qin:1 · 一次性 | 收下，回他一碗面：aff={qin:1}<br>坚持付钱：cash=-800 aff={qin:0.5} |
| E28 | 龚师傅的茶 | 松拍 | 营业后 | minDay:8 aff:gong:2 · 一次性 | 陪他喝一杯：aff={gong:1}<br>先忙去了： |
| E29 | 小满的糖 | 松拍 | 营业后 | minDay:6 aff:man:1 · 一次性 | 收下，教她熬糖：aff={man:1}<br>客气地推辞：aff={man:0.5} |
| E30 | 月底初心 | 松拍 | 营业后 | 固定第27日 | 合上账本：recall=true |

## 8 个结局（判定顺序见 GDD §10.1，实现见 core/run.determineEnding）

| ID | 结局 | 条件 | 回放路线（tools/sim.js） |
| --- | --- | --- | --- |
| E_HONEST | 贵是贵点，吃了不烧心 | 存活·口碑≥80·烧心≤30·透明好料日≥60% | honest |
| E_PRIVATE | 只做熟客的私房小馆 | 存活·口碑≥65·完成常客节点≥5人·劝退价日≥45% | private |
| E_CANTEEN | 街坊食堂 | 存活·口碑≥65·小满好感≥5·亲民价日≥45% | canteen |
| E_REOPEN | 整改之后，重新开张 | 经历危机·整改或退款·烧心<70·口碑≥55 | reopen |
| E_PILLS | 胃药和账单堆在收银台 | 烧心满后硬撑并活到月底 | pills |
| E_FAREWELL | 搬走那天，常客来送行 | 提前结束经营·口碑≥60 | farewell |
| E_TRANSFER | 转让 | 提前结束经营·口碑<60 | transfer |
| E_SOMEONE | 月底那天，还是有人来了 | 其他存活状态 | average |

## 七日常营业主题

- **连雨周**：七天都下雨，骑手单多，堂食少。 目标三选一：零退单 / 让阿力坐下一次 / 净赚 600
- **学生考试周**：学生赶早，必须快。 目标三选一：不让学生迟到 / 招牌出餐 10 份 / 口碑 +5
- **鲜货涨价周**：鲜货和可追溯食材成本上涨四成。 目标三选一：用有限鲜货守住口碑 / 净赚 400 / 烧心不增加
- **寒潮周**：天冷，热粥热汤卖得好。 目标三选一：卖出 120 碗粥 / 给赵爷爷留七天座 / 净赚 800
- **老街庙会周**：游客多，熟客反而挤不进来。 目标三选一：净赚 1000 / 常客七天都来过 / 零退单
- **设备检修周**：油锅检修三天，只能做不用油的菜。 目标三选一：口碑不降 / 净赚 300 / 招牌出餐 8 份

## 传承物

- 老秦的菜筐：前 3 日鲜货成本降低两成
- 小郑的配方本：开局解锁蛋炒饭
- 龚师傅的旧茶杯：清晨客流稳定 +4%
- 小满补过的围裙：每道菜起始熟练度 +1 次
