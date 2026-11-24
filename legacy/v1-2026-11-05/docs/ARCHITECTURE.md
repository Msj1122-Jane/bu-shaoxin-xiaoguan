# 《不烧心小馆》架构文档

状态：M1 起生效。所有模块按本文接口实现；接口变更必须先改本文再改代码，并在 `docs/DECISIONS.md` 记录。

## 1. 运行形态

- 单一 Canvas 2D，逻辑画布 **1280×720**（16:9 横屏）。屏幕适配：等比缩放 + 居中留边；`view.safe` 给出安全区内矩形（微信胶囊区、刘海）。
- 零第三方运行时依赖。浏览器与微信小游戏共用 `src/` 全部代码，只有 `src/platform/web.js` 与 `src/platform/wechat.js` 不同。
- 固定步长逻辑（`STEP = 1000/60` ms，累积器），渲染与逻辑解耦；`advanceTime(ms)` 直接驱动累积器，确定性推进。
- 所有随机来自 `core/rng`（mulberry32，可序列化状态）。同一种子 + 同一动作序列 → 同一结果（浏览器 = 微信 = Node 测试）。
- 金额以 **整数分** 存储；界面显示元（整数或一位小数）。

## 2. 模块系统

`src/modules.js` 提供极简注册表，两端通用：

```js
BSX.define('core/economy', function (require) { const RNG = require('core/rng'); ...; return api; });
const Eco = BSX.require('core/economy');
```

- 浏览器：`index.html` 按 `src/modules.list.json` 顺序加载 `<script>`，最后 `boot/web`。
- 微信：`game.js` 按同一清单 `require()` 每个文件，再 `BSX.require('app')`。
- Node 测试：`tests/helpers/load.js` 按清单 `require()`。
- `tools/gen_entries.js` 从清单生成 `index.html` 的 script 段与 `game.js` 的 require 段。**新增文件必须加进清单。**
- 全局唯一命名空间 `BSX`；禁止其他全局变量。

## 3. 目录与所有权

```
src/
  modules.js                 注册表                                  [主 Agent]
  modules.list.json          文件加载顺序
  content/                   纯数据，禁止放逻辑                        [内容 Agent]
    config.js                数值常量（GDD §7）
    dishes.js                20 道菜 + 工序配方
    regulars.js              8 位常客 + 3 节点
    events.js                30 事件
    endings.js               8 结局文案
    story.js                 六幕锚点 + 7 段 S 级演出脚本
    cutscenes.js             16 段 A 级常客演出 + 事件 B 级舞台预设
    themes.js                常营业 6 套主题 + 传承物
    strings.js               UI 文案、顾客原话库
  core/                      纯逻辑，不碰 canvas / wx / DOM           [经营数值 Agent]
    rng.js  economy.js  regulars.js  events.js  endings.js
    run.js（单日/单月状态机）  story.js（锚点与变体选择）  mode.js（常营业/继承）
    save.js（schema、迁移、主备、校验）  validate.js（内容校验器）
  game/                      表现层状态机                              
    sprites.js               图集查表绘制                               [主 Agent]
    scene.js                 分层场景、光照、天气、环境动效、镜头          [主 Agent]
    customers.js             顾客实体与反馈                              [主 Agent]
    cooking/                 烹饪系统                                   [烹饪 Agent]
      gestures.js            五类手势识别器（纯函数 + 小状态）
      stations.js            器具状态机（锅/油锅/壶/平底锅/蒸笼/面案）
      table.js               操作台：订单→工序→托盘→交付；品质；熟练度
      render.js              器具/食物/托盘/手势反馈绘制
    cutscene.js              数据驱动演出导演                             [主 Agent]
    audio.js                 程序化音效/环境层（WebAudio 抽象）             [主 Agent]
  ui/                        界面                                      [主 Agent]
    widgets.js  text.js  screens/*.js（loading,title,prep,service,ledger,codex,settings,ending,share,history）
  app.js                     总控：资源、屏栈、主循环、开发命令、测试接口     [主 Agent]
  platform/web.js  platform/wechat.js
  boot/web.js
assets/runtime/              build_assets.py 产物 + manifest.json
tests/                       node:test
tools/                       build_assets.py  gen_entries.js  validate_content.js  sim.js  e2e/*.cjs  build_wechat.js
docs/
```

并行写代码时：一个文件只有一个所有者；跨所有权的需求通过本文接口沟通，由主 Agent 合并。

## 4. 核心状态（`core/run`）

```ts
RunState {
  schemaVersion: 2, contentVersion: string, seed: number, rng: number,   // rng = 当前 PRNG 状态
  day: 1..28, phase: 'prep'|'service'|'event'|'ledger'|'ended',
  cash: int分, rep: 0..100 (float), burn: 0..100, capacity: int,
  oil: 0|1|2, material: 0|1|2, price: 0|1|2, menu: dishId[] (4–5),
  helper: { hired: bool, since: day|null }, upgrades: string[],
  oilStreak: int,                      // 连续循环用油天数
  proficiency: { [dishId]: { count:int, star:0..5 } },
  regulars: { [id]: { aff:0..7, visits:int, lastVisit:day|null, nodesDone:number[], paused:bool } },
  weather: 'sun'|'cloud'|'rain' (当日), weatherPlan: string[28],
  events: { seen: id[], cooldown:{[id]:day}, pending: DelayedEffect[], today: id|null, chain: {[id]:any} },
  flags: { [key]: any },               // 剧情与事件标记（如 landlordNotice, crisisChoice, additiveUsed）
  crisis: { count:int, active:'none'|'hold'|'remedied'|'refunded' , day:int|null },
  debt: { borrowed:int, dueRepay:int } | null, negativeDays:int, rescueUsed:bool,
  history: DayRecord[],                // 每日账本摘要（见 §6）
  keyChoices: { day, eventId|cutsceneId, choiceId, label }[],
  serviceResult: ServiceResult|null,   // 当日营业结果（由 cooking 产出）
  ledger: Ledger|null, ending: EndingId|null,
  stats: { tierDays:{oil:[3],material:[3],price:[3]}, goodDays:int, bestStreak:int, noWaitDays:int }
}
```

动作（`Run.reduce(state, action) → newState`，纯函数，不可变）：

| action | 阶段 | 说明 |
| --- | --- | --- |
| `{type:'setTier', key:'oil'|'material'|'price', value}` | prep | |
| `{type:'toggleDish', id}` | prep | 菜单 4–5 道，受解锁限制 |
| `{type:'reuseYesterday'}` | prep | 第 7 日起 |
| `{type:'open'}` | prep→service | 生成当日顾客计划 `Run.planService(state)` |
| `{type:'serviceDone', result: ServiceResult}` | service→event/ledger | 结算（`core/economy.settle`）并抽取事件 |
| `{type:'choose', choiceId}` | event | 事件/演出选择 |
| `{type:'continue'}` | event→ledger | 无选项事件 |
| `{type:'crisis', choice:'remedy'|'refund'|'hold'}` | ledger 前 | 烧心 100 |
| `{type:'rescue', choice:'sell'|'borrow'|'refuse'}` | ledger 前 | 房东通牒 |
| `{type:'next'}` | ledger→prep/ended | 提交账本、推进日期、结算延迟效果、判定结局 |

`Run.available(state)` 返回当前可执行动作列表（供 UI 与 `render_game_to_text`）。

`ServiceResult`（由 `game/cooking/table` 产出）：
```ts
{ orders: { customerId, regularId|null, dishes: dishId[], quality: 0..1, grade:'signature'|'home'|'rushed', waitedMs, served:boolean }[],
  avgQuality: 0..1, signatureCount, rushedCount, abandoned: int, proficiencyGain: {[dishId]: int} }
```

## 5. 内容 schema（`content/*.js`）

所有 id 为稳定 ASCII 字符串。文本字段为简体中文。`core/validate` 在启动与构建时校验。

### 5.1 dishes.js
```ts
Dish { id, name, basePrice: int元, baseCost: int元, oilUse: 0|1|2|3, tags: ('fried'|'soup'|'steam'|'staple'|'drink'|'side')[],
  unlock: { type:'start' } | { type:'day', day } | { type:'affinity', regular, level } | { type:'flag', flag },
  fit: { material: [n0,n1,n2] /*0.6–1.05*/, oil: [n0,n1,n2] },      // 档位适配，乘入品质
  popularity: number /*需求权重*/, icon: { atlas:'atlas_food', col, row } | { atlas:'food_icons_6', col, row },
  recipe: Recipe }
Recipe { station: StationId, steps: Step[], targetMs: int }
Step = { kind:'circle', turns, tolerance }          // 画圈/搅拌
     | { kind:'drag', from:'ingredient'|'dough'|'bowl', to:'pot'|'fryer'|'tray'|'board' }
     | { kind:'hold', targetFill: 0..1, band: 0..1 }      // 按住倾倒/控火
     | { kind:'swipe', dir:'horizontal'|'vertical'|'any', count, stretch?:bool }
     | { kind:'timing', window: [0..1,0..1], cycleMs, cue:'color'|'bubble'|'steam'|'float' }
StationId = 'congee'|'fryer'|'soymilk'|'wok'|'steamer'|'noodle'|'griddle'|'board'
```
每道菜 2–4 步；同类工序可复用，但 `targetMs`、节奏与成品图不同。

### 5.2 regulars.js
```ts
Regular { id, name, title, portrait:{atlas:'atlas_regulars',col,row}, sprite:{id:'spr_xiaosong'...},
  identity: string(识别点), catchphrase, patienceMs,
  visit: { base: 0..1, oil?: [3], material?: [3], price?: [3], rain?: number, burnMax?: number, minDay?: number },
  prefers: dishId[], dislikes: dishId[],
  nodes: [{ level:3|5|7, cutscene: cutsceneId, unlock?: { dish?: dishId, flag?: string } }],
  lines: { greet: string[], wait: string[], happy: string[], meh: string[], leave: string[] } }
```

### 5.3 events.js
```ts
Event { id:'E01'..'E30', name, beat:'tense'|'daily'|'soft', stage:'preOpen'|'postService',
  fixedDay?: int, weight: number, once: bool, cooldown: int,
  requires?: Cond[], excludes?: Cond[], chainFrom?: { event, choice },
  stage_preset: string(舞台预设 id, 见 cutscenes.js), situation: string(≤60字),
  choices: Choice[] /*0–3；0 表示纯叙事*/ }
Choice { id, label(≤12字), motive?: string, effects: Effect[], delayed?: { afterDays, effects: Effect[], note }, next?: eventId, flag?: string }
Effect = { cash:int元 } | { rep:number } | { burn:number } | { aff: { regular, delta } } | { capacity:number, days } |
         { flow: number, days } | { cost: number, days } | { flag: string, value } | { helper: true } | { unlockDish: id }
Cond = { flag, eq? } | { oilStreakMin } | { burnMin|burnMax } | { repMin|repMax } | { cashMax|cashMin } | { helper: bool } | { dayMin|dayMax } | { tierDays: {key, tier, min} } | { weather }
```
调度规则见 GDD §9.1，实现于 `core/events`。

### 5.4 endings.js
`Ending { id, name, order, test: string(可读条件说明), title, body(≤120字), cardLine, mood }`。判定逻辑在 `core/endings`（GDD §10.1 顺序）。

### 5.5 story.js / cutscenes.js（演出脚本）
```ts
Cutscene { id, grade:'S'|'A'|'B', title, skippable:true, est: ms,
  variants: [{ when?: Cond[], steps: StepS[] }],   // 第一个 when 匹配者生效；最后一个无 when 为默认
}
StepS = { t:'camera', to:'wide'|'counter'|'door'|'kitchen'|'table', ms, ease? }
      | { t:'light', preset:'dawn'|'noon'|'dusk'|'night', ms } | { t:'weather', to, ms }
      | { t:'enter', actor, at:'door'|'counter'|'table1'|'table2'|'kitchen'|'street', pose?, ms }
      | { t:'exit', actor, ms } | { t:'pose', actor, pose } | { t:'move', actor, to, ms }
      | { t:'prop', id, at, show:bool } | { t:'fx', kind:'steam'|'rain'|'lantern'|'coins'|'hearts', at }
      | { t:'say', actor|'zhou'|'narr', text(≤40字), portrait?: string }
      | { t:'wait', ms } | { t:'choice', id, options:[{id,label,effects?,flag?}] }
      | { t:'action', kind:'pull_shutter'|'tear_price_tag'|'cook'|'turn_off_fire'|'lock_door'|'refund'|'hand_bowl', dish?: id }
      | { t:'flag', key, value } | { t:'music', layer }
```
`actor` 为 `'zhou'` 或常客 id 或 `'landlord'|'supplier'|'inspector'|'blogger'|'helper'|'kid'|'crowd'`。

### 5.6 themes.js（常营业）
`Theme { id, name, days:7, rules: { weather?: string[7], flowMul?, costMul?, patienceMul?, menuLock?: dishId[], regularsBoost?: id[] }, goals: [{id, text, test}] /*三选一*/, reward: { type:'frame'|'sticker'|'note'|'heirloom', id } }`
`Heirloom { id, name, from: regularId|'zhou', effect: Effect-like 小幅开局修正, text }`。

## 6. 账本（`Ledger`）
```ts
{ day, opening, revenue, lines:[{dishId, qty, unitPrice, unitCost}], oilCost, materialCost, fixedCost, wage, eventCash,
  closing, served, demand, abandoned, repDelta, repReasons:string[], burnHint: 0|1|2|3|4 (分层，不给数值), quote: string|null,
  regularsSeen: id[], proficiencyUps: dishId[] }
```

## 7. 屏栈与输入

`app` 维护 `screens[]`，只有栈顶接收输入；每屏实现 `enter(ctx) / exit() / update(dt) / draw(g) / input(type,x,y,id) / text()`。
按钮与热区统一走 `ui/widgets`：`Button{ id, x,y,w,h, label?, icon?, state:'default'|'pressed'|'selected'|'disabled'|'loading'|'error', onTap }`，热区最小 **64×64 逻辑像素**（≈48dp）。

## 8. 资源加载

`assets/runtime/manifest.json` 为唯一真源。`app.assets.load(groupName)`：`boot`（UI、老周、器具、食物、室内主场景）首屏必载；`scenes`（雨/夜/店外）、`regulars`、`vfx`、`ending` 按需加载。微信版通过 `game.json` 分包：主包只含代码与 `boot` 组。缺图时 `sprites.draw` 画带 id 的占位框并记录到 `app.diagnostics.missing`。

## 9. 存档（`core/save`）

- key：`bsx.run.v2`（主）、`bsx.run.v2.bak`（备）、`bsx.meta.v1`（店史/图鉴/设置，独立于单月）。
- 写入：序列化 → 附 `crc32` → 先写备份再写主档。读取：主档校验失败回退备档并标记 `recoveredFromBackup`。
- 迁移：`save.migrate(obj)` 按 `schemaVersion` 升级；无法迁移则保留原档为 `.legacy` 并提示。
- 恢复点：`open` 后、`choose` 后、`next` 后、`crisis/rescue` 后；营业中不落盘，中断重进回到当日晨备（GDD §14.1 允许）。

## 10. 测试接口

```js
window.render_game_to_text()   // JSON：coordinateSystem, screen, day, phase, weather, cash, rep, burnTier, menu, tiers,
                               // customers[], orders[], stations{}, tray[], cutscene{id,step,canSkip}, choices[], buttons[{id,x,y,w,h,state}],
                               // save{slot,day,phase}, availableActions[]
window.advanceTime(ms)         // 确定性推进（逻辑 + 动画），不依赖真实时间
window.__bsx.dev               // 开发命令：seed(n) gotoDay(d) trigger(eventId) set({cash,rep,burn}) finish(endingId) reset() dump()
```

## 11. 微信适配要点

`platform/wechat.js`：`wx.createCanvas()`、`wx.getWindowInfo()`（回退 `getSystemInfoSync`）、`wx.getMenuButtonBoundingClientRect()` 得胶囊安全区、`wx.onTouch*`、`wx.setStorageSync/getStorageSync`、`wx.onShow/onHide`、`wx.createWebAudioContext()`（不可用则静音+震动）、`wx.canvasToTempFilePath → wx.saveImageToPhotosAlbum`（授权被拒 → 引导设置）。渲染层不出现任何 `wx.`/`document` 调用。

## 12. 构建

- `node tools/gen_entries.js`：生成 `index.html` 脚本段、`game.js` require 段、`tests/helpers/load.js`。
- `node tools/validate_content.js`：schema + 引用 + 可达性（调用 `core/validate` 与 `tools/sim.js`）。
- `node tools/build_wechat.js`：输出 `dist/wechat/`（代码 + 分包资源 + `game.json`/`project.config.json`），打印各包体积，主包 >4MB 则失败。
- `node tools/e2e/*.cjs`：Playwright 回放与截图至 `output/e2e/`。
