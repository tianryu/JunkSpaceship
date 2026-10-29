# 飞船阶段外观

2026年10月29日按用户要求丰富大阶段皮肤。六种外观共享 public/art/ships.webp，一张768×512透明图集，115,894字节。采用内置 imagegen 生成，未调用视频模型或制作序列帧。

| 进度 | 船型 | 主要区别 |
| --- | --- | --- |
| 第一章 | 回收艇 | 锈黄拼装舱，外露框架，双脚支架 |
| 第二章 | 货运艇 | 青白装甲，宽体双侧货舱，方形舷窗 |
| 第三章 | 采矿舰 | 橙色重甲，双钻探臂，厚重方形舰体 |
| 第四章 | 探索舰 | 蓝白三角机翼，远航雷达，细长推进器 |
| 第五章 | 星环舰 | 紫银尖头舰体，青色能源环，四组小型引擎 |
| 完成第五部件 | 曙光号 | 金白旗舰，菱形舷窗，四组重型引擎 |

每章建设以灰色轮廓为底，彩色覆盖范围随贡献从35%逐渐到100%。使用CSS裁切，没有额外帧图、循环特效或定时闪烁。安装部件后解锁下一种外观，完成弹窗展示新船型。最终发射复用曙光号图集区域和已有程序位移动画；减少特效模式关闭飞行位移。

顶部仅新增一个短船名。点击船体打开图鉴：已解锁原色、未解锁灰色、当前外观金色描边。船型由章节及已完成部件推导，无独立付费或广告解锁，不新增影响经济的存档字段。重新加载与长期订单维持正确外观。

## 验收标准和结果

- 六种轮廓、配色、外挂部件可区分，不只是换色：通过，见图鉴实机截图。
- 安装骨架后自动进入货运艇，完成核心后解锁曙光号：浏览器通过，见 validation/ship-ui-check.json。
- 最终发射使用图集第6格：通过，浏览器检查位置100% 100%。
- 五章依次解锁，完成、发射、存档归一化后保持最终外观：通过 tests/ships.test.ts。
- 一个新图集，保持透明，不遮挡进度、安装和导航操作：通过。
- 原始生成图仅在docs/concepts保存，运行包仅包含115.9KB WebP；总包仍低于项目预算。

原四屏参考保持其他界面的布局约束，本次用户明确要求变更的船型区域改用新图集作为补充参考，不以旧单一飞船造型限制新要求。

## 生成与复现

原图：[ships-atlas-v1.png](concepts/ships-atlas-v1.png)。运行图集：[ships.webp](../public/art/ships.webp)。生成模式：内置 imagegen，透明背景，参考原 public/art/sprites.png 的材质与画风。后处理脚本 scripts/prepare-ships.mjs 只裁出六格、统一透明边距、缩放和压缩，不重绘素材。

最终提示词：

```text
Use case: stylized-concept. Asset type: one production game sprite atlas, six spaceship skins, transparent RGBA background. Input image is STYLE REFERENCE ONLY: keep its polished chunky toy industrial 3D, silver beveled rivets, outlined warm metal, cyan glass, light from upper left. Create a NEW atlas 1536x1024, exact uniform 3 columns x 2 rows with six 512x512 square cells, centered ships at cell centers (256,256),(768,256),(1280,256),(256,768),(768,768),(1280,768). Each complete ship fits inside its own 420x420 bounding box with generous transparent margin and no inter-cell overlap. Front-facing with a slight top-down view, vertical nose up, full landing gear visible, consistent camera. No ground, no shadow plane, no labels, no lettering, no frame/grid. Six distinctly different silhouettes, not mere recolors: row1col1 a small rusty ochre salvage pod with one round cyan porthole, exposed roll cage, two short landing feet; row1col2 a compact teal-white wide cargo shuttle with two bulky rectangular side cargo containers and square blue cockpit; row1col3 a broad burnt-orange heavy mining ship with two mechanical drill arms pointing diagonally down, rugged square body, yellow hazard plates; row2col1 a slim cobalt blue and white explorer with swept triangular wings, round radar dish antenna, twin slim boosters; row2col2 an elegant purple-silver starship with tall pointed nose, a large circular cyan energy ring behind the body and four small engine pods; row2col3 the final completed flagship: a larger gold-white rocket with a bright cyan diamond-shaped central canopy, four massive symmetrical engine nacelles, crown-like upper fins, confident complete silhouette. All six share the original reference's readable chunky shapes but must be unmistakably different at 100px tall. No flames, no trails, no particles. Do not draw the other reference objects. True alpha transparency, no checkerboard pattern.
```
