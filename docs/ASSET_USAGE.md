# 运行时资源（ASSET_USAGE）

> 由 `node tools/gen_docs.js` 从 `assets/runtime/manifest.json` 生成。所有运行时图片经统一清单按组加载（boot 首屏 / chars 人物 / late 延迟）。缺图时显示洋红棋盘占位并记入 `__bsx.errors()`。中文全部由程序渲染。

| 资源 ID | 运行时路径 | 尺寸 | 图集 | 加载组 | 来源 | 用途 | 许可状态 | 占位 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bg_room_main | assets/runtime/bg/bg_room_main.jpg | 1280×720 | — | boot | Lovart 2K scene_main | 营业主场景（清晨/正午） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_room_rain | assets/runtime/bg/bg_room_rain.jpg | 1280×720 | — | late | Lovart scene_rain | 营业雨天 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_room_night | assets/runtime/bg/bg_room_night.jpg | 1280×720 | — | late | Lovart scene_night | 营业夜晚/剧情夜 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_ext_morning | assets/runtime/bg/bg_ext_morning.jpg | 1280×720 | — | boot | 原始视觉方案 c01 | 标题/序章/店外晨景 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_ext_rain | assets/runtime/bg/bg_ext_rain.jpg | 1280×720 | — | late | 原始视觉方案 c08 | 店外雨景 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_ext_dusk | assets/runtime/bg/bg_ext_dusk.jpg | 1280×720 | — | late | 原始视觉方案 c09 | 店外黄昏/终幕 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_kitchen_closeup | assets/runtime/bg/bg_kitchen_closeup.jpg | 768×768 | — | late | 原始视觉方案 c07 | 加载页/做菜近景底纹 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| bg_ending_poster | assets/runtime/bg/bg_ending_poster.jpg | 544×960 | — | late | 原始视觉方案 c05 | 竖屏分享卡底图 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_zhou | assets/runtime/atlas/atlas_zhou.png | 1024×1024 | 4×4 | boot | Lovart zhou_actions 4x4 | 老周 4x4 动作 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_regulars | assets/runtime/atlas/atlas_regulars.png | 1024×768 | 4×2 | boot | Lovart regulars_portraits 4x2 | 常客半身 4x2（对话头像/图鉴） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_food | assets/runtime/atlas/atlas_food.png | 1280×1040 | 5×4 | boot | Lovart food_atlas 5x4 | 食物 5x4（订单/成品） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_equipment | assets/runtime/atlas/atlas_equipment.png | 768×768 | 3×3 | boot | Lovart equipment_atlas 3x3 | 器具 3x3 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_vfx | assets/runtime/atlas/atlas_vfx.png | 1024×1024 | 4×4 | boot | Lovart vfx_atlas 4x4 | 特效 4x4 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| atlas_ui | assets/runtime/atlas/atlas_ui.png | 1024×1024 | 4×4 | boot | Lovart ui_atlas 4x4 | UI 4x4 底板与图标 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_xiaosong | assets/runtime/sprites/spr_xiaosong.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c13_xiaosong_nurse_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_laoge | assets/runtime/sprites/spr_laoge.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c14_laoge_suit_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_ali | assets/runtime/sprites/spr_ali.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c15_ali_rider_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_gong | assets/runtime/sprites/spr_gong.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c16_gongshifu_driver_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_xiaoman | assets/runtime/sprites/spr_xiaoman.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c17_xiaoman_seamstress_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_xiaozheng | assets/runtime/sprites/spr_xiaozheng.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c18_xiaozheng_student_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_laoqin | assets/runtime/sprites/spr_laoqin.png | 512×512 | — | chars | 原始视觉方案 角色/orig_c19_laoqin_vendor_sprite.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_grandpa | assets/runtime/sprites/spr_grandpa.png | 512×512 | — | chars | 原始视觉方案 角色/orig_grandpa_grandson.png | 常客全身立绘 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| spr_zhou_legacy | assets/runtime/sprites/spr_zhou_legacy.png | 512×512 | 5×4 | late | 原始视觉方案 角色/orig_zhou_sprite_sheet.png | 未使用（保留） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 未使用 |
| icons_resource | assets/runtime/sprites/icons_resource.png | 512×512 | 3×3 | late | 原始视觉方案 UI/orig_resource_icons_3x3.png | 资源图标（晨备预计） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| zhou_portraits | assets/runtime/sprites/zhou_portraits.png | 1280×256 | 5×1 | boot | 原始视觉方案 c12 五表情 | 老周五态头像 | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 否 |
| food_icons_6 | assets/runtime/sprites/food_icons_6.png | 1086×362 | 6×1 | late | 原始视觉方案 c22 | 未使用（保留） | 待核对（H12/H14）：Lovart/原始视觉方案生成，项目内测使用 | 未使用 |

合计 26 个文件，7.18 MB；首屏组 boot 4.80 MB。

## 程序化绘制（开发占位，已登记 HUMAN_TASKS H16）

- 路人与配角（房东、供应商、检查员、博主、同行、回收商、帮工、摄像、学生、街坊）：`game/actors.js` 32×64 像素小人放大。
- 菜品补图：煎蛋、蛋炒饭、糖油果子、叶儿粑（`game/assets.js` proc）；骨汤鸡汤面/米线/羊肉汤/荷包蛋面用图集格位叠色或叠加。
- 道具：租约、笔记本、手机、菜筐、面案、增香粉、价牌、茶杯、公交车、南瓜、蜡烛等（`game/cutscene.js` drawProp）。
- 平底锅、炒锅、蒸笼、卤锅的操作台小图与近景锅面（`game/cooking.js`）。
- 卷帘门、雨丝、落叶、行人剪影、灯笼光晕、积水反光（`game/scene.js`）。
- 全部音效与环境音为 WebAudio 程序合成（`game/audio.js`，D008，H05）。

## 资产包中未进入运行时的目录

`01_原始视觉方案/ 02_Lovart/ 03_ImageGen/ 04_旧原型参考/ 05_PPT拆图归档/ 08_Lovart生成预览_待换高清/ 09_Claude占位图/` 仅作参考，不打包。`11_Lovart_2K原图/` 已由 `tools/build_assets.py` 处理为 `assets/runtime/atlas/`。
