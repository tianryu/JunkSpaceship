# 本地运行与发布准备

## 运行

使用 Node.js 24 或兼容当前 Vite 的 Node.js 版本。

```powershell
npm ci
npm run dev
```

开发服务器默认监听本机 127.0.0.1:5173，被占用时 Vite 自动使用下一端口。本次开发实际端口为 5174。浏览器打开命令显示的地址即可游玩。

```powershell
npm test
npm run simulate
npm run build
npm run audit
npm run package
npm run preview -- --port 4173
```

dist 是本地H5静态构建目录，尚需完成TapTap宿主接入和平台上传校验，index.html 位于根目录。所有运行素材都在本包内，资源地址支持挂在子目录。预览使用 HTTP，不直接双击 index.html。当前为本地存档，清除浏览器网站数据会丢失航程。

## 开发验收入口

只在开发构建有效，正式构建编译时移除。

| 参数 | 用途 |
| --- | --- |
| fixture=early | 第一章、一台无人机 |
| fixture=clear_screen | 第四章、四台无人机、清屏入口 |
| fixture=research | 研发抽屉与固定插件 |
| fixture=salvage | 三机匣与一次普通失败 |
| fixture=ending | 第五章部件完成，验证发射和后续订单 |
| fixture=offline | 待领取的离线收入 |
| fixture=settlement | 待领取的章节追加奖励 |
| test=1 | 显式模拟广告的完成、取消、无填充、错误；不产生真实广告收入 |
| capture=1 | 在第一秒后冻结逻辑和表现，用于同状态截图 |

fixture 使用独立内存存档，不覆盖正常游玩存档。正式包不识别这些调试参数，也不包含模拟广告发奖入口。

## 素材与字体

public/art 仅有一张空白工业底图和一张透明精灵图集。全部数字、文案、按钮、进度和场内对象实时绘制，背景没有烘焙游戏截图。音效由 Web Audio 合成，无音频包。动效只使用位移、角度、描边、线段和透明度。

public/fonts/scrap-round.woff2 是寒蝉全圆体3.0的实际文案字符子集（内部名称 Scrap Round），随包保留 OFL 许可证。已提交字体可直接参与构建，无需开发者下载完整字体。

scripts/subset-font.py 是维护工具，源字体来自 Google Fonts 官方仓库，工作文件位于忽略的 .tools/fonts；需要改动汉字时重新生成子集。字体工具及完整字体不进发布包。

## TapTap MCP

已安装全局 MCP 配置 taptap-minigame，固定 npm 包版本 @taptap/instant-games-open-mcp@1.24.14，工作区指向本项目。已启动服务器并成功读取工具列表、当前应用状态和广告接入工作流。

用户明确选择先完成本地版本，稍后扫码授权。因此尚未选中真实应用，尚未查询该应用的广告开通状态，也没有配置真实广告位。当前正式构建的广告服务返回不可用，不会模拟奖励。

下一次平台接入按官方 MCP 顺序执行：

1. 获取新的扫码授权链接，用户在 TapTap App 完成授权后结束设备授权流程。
2. 列出应用，由用户选择本游戏目标应用。
3. get_current_app_info 后调用 check_ads_status。
4. 仅当状态为已生效且自动返回有效广告位时调用 get_ad_integration_guide。广告位只使用这次官方查询结果，不手工索取或复用示例 ID。
5. 接入宿主提供的 tap 接口，真实测试完整观看、取消、加载和播放错误。
6. 使用 dist 执行 prepare_h5_upload，核对实际 H5 包体和资料要求后上传。当前没有执行上传或发布。

账号、开发者认证、收款资料和平台审核属于外部步骤，不以本地模拟测试代替。

本轮试玩地址：http://127.0.0.1:5174/?test=1 ，标明开发测试模式，可验证模拟广告奖励；不会产生广告收入。正式构建预览：http://127.0.0.1:4174/ 。端口被占用时以终端实际输出为准。
