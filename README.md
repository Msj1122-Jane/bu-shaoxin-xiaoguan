# 不烧心小馆 1.0 发布候选

当代江南社区早餐铺 · 轻量经营决策＋触控烹饪＋生活叙事。正式平台微信小游戏，浏览器横屏版用于开发与内测。

## 现在能玩到什么

标题 → 卷帘门序章（按住拉起卷帘门）→ 第 1 日直接给赵爷爷做白粥和油条 → 第 2 日起晨备（油壶 / 食材篮 / 价牌 + 选四道菜）→ 营业做饭（五类手势、后台加热并行、托盘拖给顾客）→ 剧情与事件（同一间店里的动态演出、选择）→ 晚账（先结论后明细）→ 28 日后结局 → 分享卡 / 继承店史重开 / 七日常营业。

内容：20 道菜、5 类手势、8 位常客各 3 个故事节点、30 张事件、7 段主线演出、16 段常客演出、8 个结局、6 套常营业主题、4 件传承物。

## 启动浏览器试玩

```bash
cd bu-shaoxin-game
node tools/serve.js          # 打开 http://127.0.0.1:4173
```

macOS 也可以双击 `双击启动试玩.command`。无需安装依赖。

- `?dev`：左下角显示帧率、相位、隐藏烧心值。
- `?safe=wechat`：模拟微信胶囊与刘海安全区。
- 键盘：Tab 切换焦点，回车确认，P/Esc 暂停，F 全屏。

## 测试与工具

| 命令 | 作用 |
| --- | --- |
| `npm test`（`node --test tests/*.test.js`） | 15 项规则/存档/结局/平衡测试 |
| `node tools/validate_content.js` | 内容与资源引用校验（构建前） |
| `node tools/sim.js` | 9 条经营路线 × 20 种子模拟，输出结局分布与均值 |
| `node tools/e2e.cjs --days 28 --policy average --out output/e2e/x` | 浏览器内机器人用真实手势完整回放并截图（需要 `npm i playwright` 或已安装的 Playwright） |
| `node tools/e2e.cjs --mode week --theme T_COLD --tryNew --days 7` | 常营业回放，轮换新菜 |
| `node tools/build_wechat.js` | 生成 `dist/wechat/` 并做静态兼容检查（报告写入 `docs/WECHAT_BUILD_REPORT.json`） |
| `node tools/wx_check.cjs` | 在模拟微信运行时里启动 `dist/wechat` 验证入口、触摸、存储、生命周期 |
| `python3 tools/quantize_assets.py` | 生成微信包用的 256 色调色板图（原图不改） |
| `node tools/gen_entries.js` / `node tools/gen_docs.js` | 由模块清单生成入口；由内容生成叙事地图与资源表 |

## 微信小游戏

见 `docs/WECHAT_GUIDE.md`。`dist/wechat/` 可直接用微信开发者工具“导入项目”；需要你的 AppID 才能真机预览（HUMAN_TASKS H02）。本仓库没有声称已经在微信工具或真机上通过。

## 目录

`src/content` 数值与内容配置 · `src/core` 规则（无画面）· `src/game` 场景/做饭/演出/音频 · `src/ui` 界面 · `src/platform` 浏览器/微信适配 · `tests` · `tools` · `docs` · `legacy/` 旧原型（保留，不再使用）。

## 文档

`docs/GAME_BIBLE.md` 不可改变的核心 · `docs/ARCHITECTURE.md` · `docs/COOKING_SYSTEM.md` · `docs/NARRATIVE_MAP.md` · `docs/BALANCE.md` · `docs/ASSET_USAGE.md` · `docs/DECISIONS.md` · `docs/TEST_PLAN.md` · `docs/WECHAT_GUIDE.md` · `docs/FINAL_REPORT.md` · `HUMAN_TASKS.md` · `progress.md`
