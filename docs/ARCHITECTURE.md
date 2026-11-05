# 架构（ARCHITECTURE）

状态：1.0 发布候选实现。接口变更先改本文，再改代码，并在 `DECISIONS.md` 记录。

## 1. 运行形态

- 单一 Canvas 2D，逻辑画布 **1280×720**。`app.layout()` 把逻辑画布等比放进设备安全区（`platform.safeInsets()`），四周用暗木色留边，不拉伸人物；微信胶囊区换算到逻辑坐标后，右上角按钮整体左移 `app.rightInset`。竖屏时覆盖“请横过手机”。
- 零第三方运行时依赖。浏览器 / 微信 / Node 测试共用 `src/` 全部代码，差异只在 `src/platform/web.js`、`src/platform/wechat.js` 与入口。
- 逻辑固定步长 1/60 秒（累积器，单帧最多补 6 步），渲染与规则解耦；`advanceTime(ms)` 直接驱动逻辑步进，确定性。
- 随机数：`core/rng`（mulberry32，状态是一个 uint32，写入存档）。营业订单由 `hash(seed, day)` 确定，读档后同一天订单一致。
- 金额整数分；界面显示元。

## 2. 模块系统

`src/modules.js` 提供 `BSX.define(name, factory)` / `BSX.require(name)`。加载顺序唯一来源 `src/modules.list.json`（core / game / web / wechat 四段），`node tools/gen_entries.js` 生成 `index.html` 的 script 段、`game.js` 的 require 段与 `assets/runtime/manifest.js`（微信不能 require JSON）。**新增源文件只改清单，然后跑 gen_entries。**

## 3. 目录与职责

```
src/
  content/   纯数据：config（数值）dishes（20 菜＋工序）regulars（8 人＋节点）events（30 张）story（7 S＋24 节点脚本）endings（8 结局＋6 主题＋传承物）
  core/      纯逻辑，不碰画布：rng cond（条件求值）run（状态机 reducer、结算、事件抽取、结局判定、订单计划）save（主备档、校验和、迁移）legacy（店史）week（常营业目标）validate（内容校验）
  game/      表现：assets（清单加载、图集、占位、程序化补图）audio（WebAudio 合成）scene（分层场景、光照天气、粒子、镜头）actors（人物绘制）cooking（器具状态机＋五类手势＋近景）cutscene（演出导演）
  ui/        ui（即时模式控件与热区）hud screens s_basic（加载/标题/暂停/设置/回看/新月份/常营业选择）s_prep s_service s_story s_ledger s_ending（结局/分享卡/周结算）s_codex（图鉴/店史）
  platform/  web wechat
  dev/       autoplay（无界面快进＋界面级机器人）
  boot/web.js  app.js
tests/       node:test（core.test.js）
tools/       serve gen_entries gen_docs validate_content sim e2e shot build_wechat build_assets.py
```

## 4. 数据流

```
玩家指针 → platform → app.input（设备像素→逻辑坐标）→ 捕获者（拖拽/画圈/按住期间）或 ui 热区 → 屏幕
屏幕 → app.dispatch(action) → core/run.reduce(state, action) → 新 state（非法动作返回原对象，幂等）→ save（主备档）→ app.route() 按 phase 切屏
营业中：cooking.Kitchen 维护器具状态（不写存档）→ 收摊时 serviceDone{orders[{grade,quality,items,regular}]} → core 结算
```

一日相位：`dawn`（晨间主线/房东通牒）→ `prep`（晨备，第 1 日自动跳过）→ `open`（开店前事件）→ `service` → `dusk`（危机夜、营业后事件、常客节点、营业后主线）→ `ledger` → 下一日 / `ended`。`pending` 队列逐项 `resolve`。

## 5. 存档

- 键：`bsx.run.v3`（+`.bak`）单月档；`bsx.legacy.v1`（+`.bak`）店史档；`bsx.settings.v1`。单月重开只清单月档。
- 每次 dispatch 成功即写（包装 `{c: checksum, b: body}`），先把旧主档复制为备档。主档校验失败读备档并提示；旧版七日档（`bsx-seven-day-v1`）保留不覆盖并提示。
- 营业中不落盘（D015）：刷新回到当日营业开始，订单确定性重建。恢复点：晨备确认、事件选择、晚账提交。

## 6. 测试接口

- `window.render_game_to_text()`：屏幕、相位、日期、资源、场景（视角/时段/天气/镜头）、可交互对象（逻辑坐标中心与尺寸）、屏幕细节（订单、顾客、器具工序与进度/窗口、托盘、演出节点、选择项）、存档状态、错误计数。
- `window.advanceTime(ms)`：确定性推进。
- `window.__bsx`：`inject/tap/tapId/hits/newRun/setSeed/jumpDay/trigger/set/toEnding/errors`；`BSX.require('dev/autoplay').start(app,{policy})` 启动界面级机器人。
- `?dev` 显示帧率/相位/烧心调试行；`?safe=wechat` 模拟胶囊与刘海安全区。

## 7. 性能

粒子上限（做饭 120、雨 140、落叶 8、行人 3），`lowFx` 降级（雨×0.35、无落叶、行人 1）；帧率连续 3 秒 <40 自动降级。判定基于固定逻辑步长，掉帧不改变手势结果。资源分 boot / chars / late 三组，首屏只等 boot+chars。
