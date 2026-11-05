# 微信小游戏导入指南（WECHAT_GUIDE）

## 已完成（不依赖账号）

- 同一份 `src/` 规则与内容，入口 `game.js` 按 `src/modules.list.json` 逐个 `require`，平台差异只在 `src/platform/wechat.js`：`wx.createCanvas`、触摸（`onTouchStart/Move/End/Cancel`，按 `pixelRatio` 换算）、`getStorageSync/setStorageSync` 主备存档、`createImage`、`createWebAudioContext`、`vibrateShort`、`onHide/onShow` 与音频中断（切后台自动暂停、音频挂起与恢复）、`getMenuButtonBoundingClientRect` 胶囊让位、`safeArea` 安全区、`toTempFilePath + saveImageToPhotosAlbum` 保存分享卡、旧基础库缺 `ellipse` 时自动补齐。
- `node tools/build_wechat.js` 产出 `dist/wechat/`：59 个文件、约 2.6MB（主包上限 4MB），图片为 256 色调色板版本；静态扫描无 DOM/浏览器专用 API。
- `node tools/wx_check.cjs`：在模拟 `wx` 运行时（浏览器内）从 `dist/wechat/game.js` 启动，验证触摸坐标映射、胶囊让位、切后台暂停、首日完整可玩、存储与刷新后继续。证据 `output/wx/`。
- 已知差异：`soft-light` 混合与 `ctx.filter` 在部分基础库不生效，只影响清晨暖光强度与图鉴剪影灰度，有兜底。

## 需要你在微信开发者工具里做的步骤（H02）

1. 安装最新稳定版微信开发者工具，登录。
2. 运行 `node tools/build_wechat.js`（仓库里已带一份构建好的 `dist/wechat/`）。
3. 工具 → 导入项目 → 目录选 `bu-shaoxin-game/dist/wechat`，AppID 填你的小游戏 AppID（或先用“测试号”）。若用游客 AppID 只能在模拟器运行。
4. 在模拟器选 iPhone 12/13 横屏与一台安卓机型，检查：标题 → 开门营业 → 序章按住开门 → 首日三份订单 → 晚账 → 第 2 日晨备。控制台不应有红色报错。
5. 点“预览”扫码真机：重点看触点是否与画面对齐、右上角胶囊是否挡住暂停/跳过按钮、切到后台再回来是否暂停并能继续、锁屏/来电后声音是否恢复、刷新（重进）后能否“继续”。
6. 把截图/录屏与机型写入 HUMAN_TASKS H02、H13。
7. 上传与提审需要主体、类目、隐私指引与 AI 生成内容说明（H11、H12）——本项目不会代你操作。

## 版本要求与包体

- 基础库建议 ≥2.10（WebAudio、`getMenuButtonBoundingClientRect`）。未实测更低版本。
- 若后续正式美术使包体超过 4MB：把 `late` 组（雨天/夜景/黄昏背景、结局海报）放入分包，`game/assets.js` 的 `loadGroup('late')` 前调用 `wx.loadSubpackage`。
