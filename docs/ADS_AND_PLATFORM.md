# 广告与 TapTap 平台接入

## 平台事实与来源

截至 2026 年 10 月 28 日，官方 MCP 安装说明适用于 H5 小游戏；广告指南要求开发者完成认证及财务信息，并在游戏后台申请广告变现。小游戏正式发布还需要完成平台相应资料与前置流程。

- [MCP 安装指南](https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/mcp-setup/)
- [广告开通指南](https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/ad-integration-guide/)
- [激励视频教程](https://developer.taptap.cn/minigameapidoc/dev/tutorial/open-capabilities/ad/rewarded-video-ad/)
- [创建激励视频 API](https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/)
- [广告对象 API](https://developer.taptap.cn/minigameapidoc/dev/api/ad/RewardedVideoAd/)
- [广告审核规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/minigame-ad-policy/)
- [小游戏审核规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/review-standards/)
- [行为规范](https://developer.taptap.cn/minigameapidoc/tap-operation/operation-standards/behavior-standards/)
- [开发与发布指引](https://developer.taptap.cn/minigameapidoc/quick-start/document-guide/)

教程把广告实例描述为单例；参数 API 另外提供可选 multiton。首版采用默认单例，不启用多例，所有奖励场景共用一个协调器。接入时以实际 H5 运行环境与当前 API 为准。

[官方形态说明](https://developer.taptap.cn/agents/)明确区分H5与Tap小游戏。本文中的广告事件和事务是适配层规格；实施时须通过当前H5 MCP文档核对具体SDK注入方式与可用API，不能直接把无DOM的game.js运行环境要求套到网页H5。包体文档口径差异记录在UI_AND_PACKAGE中。

## 六类广告奖励

| placement | 位置 | 播放前条件 | 完成奖励 | 消费／唯一约束 |
| --- | --- | --- | --- | --- |
| cash_supply | 资金加号、补给页、升级缺钱入口 | 完成教学与首启时间要求 | 已显示的 90 秒参考产能资金 | 一次展示一笔事务；可重复 |
| clear_screen | 工作区清屏、补给页 | 当前至少有1件废品 | 回收播放前冻结的全部在场废品及其正常收益 | 每件唯一ID；不影响后来生成的废品 |
| precision_salvage | 仓库机匣卡 | 有机匣、未处于普通必得状态 | 1 核心，100% | 消耗选定机匣一次 |
| targeted_research | 研发选中插件 | 有机会、目标未满级 | 所选插件提升 1 级，100% | 消耗 1 次研发机会 |
| offline_double | 离线结算页 | 有未结算离线收入 | 基础收入加等额额外收入 | 每笔离线奖励最多一次 |
| settlement_bonus | 章节／订单结算页 | 当前结算未领取追加奖励 | 配置表中的确定资金 | 章节或订单唯一 ID |

资金补给与清屏是常驻入口；仓库和研发在资源满足时随时可操作。不得承诺任何时间都有广告素材。暂无广告时保留正常游玩路径和已获得资源。

## 展示文案

资金：`完整观看广告，获得 18,000 资金`。升级缺钱入口显示实际差额和补给额度，不足补齐时不写“立即升级”。

清屏：按钮 `清屏`，旁边始终显示 `广告`。确认页显示当前废品数量和冻结价值，明确完整观看后回收本屏对象；取消或失败不清屏。

精密拆解：`35.00% → 100.00% 获得 1 枚能源核心`；同时保留普通方式与其真实失败结果。

定向研发：先选具体插件，按钮 `必得电弧` 等实际目标名，另附独立 `广告` 徽标；候选概率展示在卡片中，不把“随机某个插件”写成“必得你想要的插件”。

每种入口都显式标明广告。保底、普通领取和关闭按钮不得藏在低对比度角落。概率和保底说明与实际配置同源，避免文字与逻辑不一致。

## 首次启动与频率

完成首次教学任务并且首次启动满 60 秒后才开放首次广告展示。考虑官方首次启动规范，取两个条件中更晚者。首版不接强制插屏和 Banner。

取消聊天早期提出的“三分钟统一冷却”和“每半小时四次”自设规则。一次只允许一条激励广告，下一次须经新的玩家点击；不自动连续播放。平台无填充、限流或连接失败时采用退避，不用紧密循环请求素材。

## 广告生命周期

采用 `tap.createRewardedVideoAd({ adUnitId })`，在适配层注册一次 onLoad、onError、onClose。打开页面不重复叠加监听器。show() 的 Promise 成功仅表示显示成功，不代表完成观看。

状态：unavailable → loading → ready → showing → settling → ready/loading。failed 可以回到正常游戏，不允许永久锁在 showing。退到后台与广告生命周期需要区分，防止把观看广告误当离线收入。

只有 onClose 回调明确带 `isEnded === true` 才进入发奖事务；undefined、false、加载成功、显示成功、普通 onShow、人工关闭面板都不能发广告奖励。官方教程指出关闭后会重新拉取下一份素材；不要再叠无限重试循环。

## 发奖事务

播放前创建冻结记录：

```text
rewardId / placement / promisedReward / targetId / resourceReservation
createdAt / status / sourceChapter / saveVersion
```

1. 校验条件，冻结奖励和目标，持久化 pending 记录。
2. 锁住本次资源与广告按钮，暂停有效游戏时间、音效和工作区逻辑。
3. 调用真实广告接口；显示失败则解除预留，不消耗机匣或机会。
4. 收到明确完整观看回调，检查 rewardId 是否已结算。
5. 在一个新的完整存档快照中同时完成：消耗资源、添加奖励、记录 settled rewardId、清除预留。
6. 快照保存成功后才显示获得动画；重复回调只读取已结算结果，不重复加钱。
7. 取消时清除 pending，恢复游戏。加载失败可以重新手动尝试，但不能自动展示一条迟到的广告。

本地存档不能提供服务器级广告回执验证。进程在回调与落盘之间被强制终止时仍有极小的未决窗口；重启不能仅凭 pending 自动补发。重启保守取消未确认奖励，保留尚未消费的资源，并不结算同一未决广告期间的离线产出；不声称 exactly-once 网络事务。单个快照写入加幂等 ID 可处理常见的双击、重复回调和正常刷新。

## 真机与模拟隔离

本地开发可以有显式 `DEV_AD_SIMULATION`，必须显示“测试广告，不产生收益”，且正式构建编译时禁用。开发模拟仅用于完整、取消、无填充、异常四种测试。浏览器里模拟按钮成功不等于 TapTap 广告接入完成。

真实接入需由当前应用的最新 check_ads_status 自动取得有效广告位，并确认开通状态，在 TapTap 真机环境至少验证一次完整观看、主动取消和错误恢复；保留时间、构建号与结果记录，避免在文档中记录凭证或用户收款信息。

## 平台准备步骤

1. 检查官方 AI_SETUP_GUIDE.md 内容与当前安装命令，确定 MCP 配置位置与运行依赖；按现有用户授权安装，不执行未审读外部脚本。
2. 启动 MCP 后由用户扫码授权。凭证只存在合适的本地配置中，不写入仓库。
3. 读取已有应用，确认本游戏目标应用；准备 H5 构建、图标、截图与简介。
4. 开发者在平台完成认证、必要资料、广告变现申请与收款资料。上述状态不能由游戏代码代替。
5. 通过当前官方MCP自动取得有效广告位并配置适配层，不索取手工ID，也不复用历史或其他应用ID。
6. 真机调试与自测；完成平台所需备案／审核准备。八小时预算不包含这些外部等待。
7. 游戏与广告最终发布状态以平台结果为准；提交和上线分别记录。

## 验证记录

按 placement 记录本地测试事件：offer_shown、clicked、load_failed、shown、closed_incomplete、completed、reward_granted。开发测试记录不收集账号个人信息。生产统计优先使用平台现有能力；自建远程埋点与数据后台不包含在八小时预算中。

分析分母应明确：入口点击率、加载成功率、完整观看率、奖励兑现率。不能把奖励按钮点击数当作已播放次数或实际收入。

## 本轮实际接入状态

MCP已安装并成功列出工具；已经读取当前广告工作流。用户选择先完成本地版本，稍后授权。当前尚未选中应用，生产构建使用明确不可用服务；通用回调适配器和六类奖励事务已实现，但没有声称真实广告已播放。24项浏览器模拟结果见 validation/ad-ui-matrix.json。
