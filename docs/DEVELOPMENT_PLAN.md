# 八小时分阶段开发计划

开发预算共 480 分钟，从开始实施代码计时。当前文档与概念图准备不计入这 480 分钟。账号认证、扫码等待、平台审核和广告开通等待单独记录，不伪装成编码进度。

## 阶段与完成门槛

| 阶段 | 时间 | 工作 | 可审查交付 | 进入下一阶段的条件 |
| --- | --- | --- | --- | --- |
| P0 环境与视觉基准 | 00:00–00:45，45 分钟 | Vite + TypeScript H5 工程；核对 H5 SDK 与 MCP；基础竖屏框架；拆分首屏所需素材，固定字体与 tokens | 可打开的界面骨架、素材映射、环境记录 | 360×640 首屏区域对齐；无关键资产缺失；MCP 认证若等待则独立记录 |
| P1 回收闭环 | 00:45–02:15，90 分钟 | 输入、废品生成、伤害、资金、六升级、无人机、电池连锁、脉冲 | 能连续游玩和升级的第一章 | 同一废品不重复结算；触控正常；无人机可自动推进 |
| P2 主线与结局 | 02:15–03:15，60 分钟 | 五章配置、贡献、飞船五层、装配、发射、结算、订单 | 从开局到发射的完整流程，调试可加速 | 五章衔接无卡点；广告资金不能直接过章 |
| P3 概率与搭配 | 03:15–04:15，60 分钟 | 机匣、35%概率与保底；六插件、三槽、随机／定向研发 | 仓库与研发两张真实可操作界面 | 资源守恒；满级退出候选；三槽规则正确 |
| P4 广告奖励 | 04:15–05:30，75 分钟 | 统一广告协调器；六奖励入口；冻结承诺、幂等发奖、暂停恢复 | 模拟四状态测试结果与通用回调适配器；真实宿主绑定等待授权 | 完整观看才发奖；取消不扣道具；失败不阻塞；正式包无模拟发奖 |
| P5 存档与体验 | 05:30–06:15，45 分钟 | 版本化存档、离线、引导、声音、动效、设置 | 可正常关闭重进的完整版本 | 资金／章节／研发／保底保留；离线不能重复领 |
| P6 验证与交付 | 06:15–08:00，105 分钟 | 共享逻辑模拟、连续试玩、真机广告、性能、四状态视觉比对、打包与截图 | dist、验证报告、已知问题、素材与发布说明 | 功能清单通过；四图视觉分数逐屏至少90；真实平台项有证据或明确待办 |

## P0 具体步骤

1. 检查现有文件与工具，安装项目依赖，锁定版本；不引入重型游戏引擎。
2. 读取当前 TapTap H5 平台 API 和官方 MCP 安装说明，配置平台边界。用户名、令牌、扫码登录状态不写入 Git。
3. 建立 portrait 容器，先实现标题、资金栏、飞船区、回收区、升级区和底部四导航。
4. 使用同一份 design/tokens.json。中文字体本地加载，确认分发许可证，记录字体文件版本。
   用户要求少文字和少素材，先落实UI_AND_PACKAGE预算，字体做字符子集，所有图标尽量共用。
5. 依据概念图制作透明废品、磁铁、无人机、五阶段飞船与空背景素材；有独立素材后才能进行高相似度动态实现。不能用整张截图作伪交互背景。
6. 初屏截图与 01 号概念图进行区域对照；布局问题在写更多面板前修正。

## 建议目录

```text
src/
  main.ts
  game/       state, loop, combat, spawn, economy, progression
  content/    chapters, upgrades, plugins, orders
  platform/   taptap, rewarded-ad, storage, lifecycle
  ui/         hud, upgrades, research, warehouse, supply, settlement
  render/     scene, sprites, rocket, particles
  audio/      effects
  dev/        visual-fixtures, ad-simulator, economy-runner
assets/
  art/        background, ship layers, sprite atlas
  fonts/      verified font and license
tests/        pure state transitions and reward transactions
docs/
  concepts/   fixed reference images
  validation/ test results and screenshot comparisons
dist/         release build, generated later
```

## 实现职责分离

- 游戏 state 与规则不依赖 DOM 或 TapTap，便于模拟和快速测试。
- 渲染只读取 state；金币动画、音效与粒子不能负责经济结算。
- UI 发出明确命令，如 buyUpgrade、equipPlugin、openCrate；不能直接修改钱包。
- 平台适配层提供 requestRewarded、save/load、visibility 与可用性。真实广告与测试模拟不能混淆。
- 奖励服务处理所有六场景的资源预留、回调与幂等记录，不在六个按钮内复制六套逻辑。
- 章节、价格、概率和界面奖励说明来自同一配置源。

## 最小存档模型

```text
version, updatedAt, lastActiveAt, firstStartedAt
wallet, cores, upgradeLevels, droneCount
chapterIndex, chapterContribution, installedShipParts
pluginLevels, equippedPluginIds[3], researchCredits
crateRecords[id, sourceChapter], ordinaryMissStreak
clearScreenFrozenObjectIds, freePulseRemainingMs
offlineSettlement, settlementClaims
pendingReward, settledRewardIds
orderIndex, orderProgress, permanentOrderBonus
tutorialFlags, settings, lifetimeStats
```

随机对象位置和粒子不必存档；恢复时按章节重新生成。资源与进度必须存档。recent settled IDs 与长期唯一领取记录分别保存，不能清理掉仍可能重放的奖励标识。

## 时间不足的处理顺序

优先削减额外镜头摇晃、复杂音高变化、第二套皮肤、非必要装饰、生产统计看板。保留文案、按钮可读性和素材轮廓。不得为了赶工删除广告失败恢复、保底真实性、存档或主线结局。

若平台配置在等待，继续独立的本地实现与测试。结束时分别给出“可玩版本完成”“真实广告验证状态”“正式上线状态”；没有通过的项目不勾选。

## 交付物

- 可运行 H5 工程与构建说明。
- 平台可上传的构建包，以及平台实际要求的截图与图标。
- 玩法、视觉、广告规则与项目代码一致的文档。
- 无广告与广告路线的数值报告。
- 四种状态的实机截图、概念图对比、逐项评分。
- 发布文件大小清单、首屏依赖大小、zip及解压运行资源大小，文案禁用字符检查结果。
- 真机广告完整／取消／错误恢复记录。

八小时为目标工程预算，实际是否同时满足画面与平台验收以结果为准。发现无法在预算内满足的必要工作时记录具体差距，不降低视觉标准后再宣称达到90%。
