# 不烧心小馆

<p align="center"><img src="docs/promo/kv_poster.jpg" width="420" alt="不烧心小馆 主视觉"></p>

> 便宜和良心之间，你选哪个，代价由谁来付。

老周回到槐树巷，重开父亲关了十年的早点铺「周记」。对街新开的快好早点一块钱一碗，油贩老金又找上门来——十年前，父亲收过他的油。
一个月，一间早餐铺，一条街的人。你每天下锅的那份料，决定这条街会怎么记住周记。

![烟火早点·烹饪经营](docs/promo/promo_cooking.jpg)

**烟火早点，烹饪经营。** 豆浆、油条、葱油饼、生煎……二十道早点，画圈、拖拽、按住、滑动、卡火候。每道菜下锅前，好料和便宜料并排摆着：拿便宜的省几块钱，后果当场就来。

![十年旧账·悬疑追查](docs/promo/promo_ledger.jpg)

**十年旧账，一页页找回来。** 父亲的旧账本缺了七页，藏在照片背后、蒸笼夹层、旧油壶底……每找回一页，就看见一段当年。真相不在别人嘴里，要你自己拼。

![良心与便宜·对街抉择](docs/promo/promo_choice.jpg)

**良心与便宜，对街抉择。** 凌晨早市挑货、庙会早高峰、对面被查封那天的后厨自查、和老金当面对质——每一章一个副本，每个选择都改写后面的剧情。

![槐树巷群像·九大结局](docs/promo/promo_endings.jpg)

**槐树巷群像，九个结局。** 赵爷爷、小满、小郑、阿力、老秦……每个常客都有自己的故事。九个结局讲的是同一件事；只有一个结局，会写上父亲没写完的那一页。

## 现在能玩到什么

- 序章 + 四章 + 终章（28 日），章节标题卡、角色立绘对白、回忆插画
- 四个特别关卡：凌晨早市（第 3 日）、庙会早高峰（第 10 日）、后厨自查（第 15 日）、对质（第 24 日）
- 父亲的旧账本：7 页可收集，首页「旧账本」里随时翻看
- 20 道菜、5 类手势、8 位常客各 3 个故事节点、30 张事件、9 个结局、6 套常营业主题

美术：Lovart 生成（团队提示词与挑选），配乐与音效为程序合成。

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
| `npm test`（`node --test tests/*.test.js`） | 21 项规则/存档/结局/副本/平衡测试 |
| `node tools/validate_content.js` | 内容与资源引用校验（构建前） |
| `node tools/sim.js` | 11 条经营路线 × 20 种子模拟，输出结局分布与均值 |
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
