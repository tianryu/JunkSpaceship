# 字体与音乐来源

核对日期：2026年10月29日。下载内容随本地包分发，游戏运行无需访问素材网站。

| 素材 | 来源与作者 | 授权 | 游戏文件 |
| --- | --- | --- | --- |
| 寒蝉全圆体 3.0 | [ChillType 官方仓库](https://github.com/Warren2060/ChillRound)，ChillRoundF v3.0.ttf | [SIL OFL 1.1 原文](https://github.com/Warren2060/ChillRound/blob/main/LICENSE) | public/fonts/scrap-round.woff2 |
| Outer Space Loop | [wipics 发布页](https://opengameart.org/content/outer-space-loop)，2020年6月3日 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | public/audio/outer-space.mp3 |

OFL 允许字体随软件嵌入和分发，不能单独出售字体。原字体保留字体名称，因此游戏的 WOFF2 字符子集重新命名为 Scrap Round，保持 OFL 授权，并附带原始版权与许可全文 public/fonts/OFL.txt、来源与修改说明 NOTICE.txt。子集通过 scripts/subset-font.py 生成，校验全部代码中的汉字既有映射又有非空轮廓；未采用旧 ChillRoundM 文件，其中部分汉字有映射但轮廓为空。

音乐发布页明确标注 CC0 及 Public Domain，允许复制、修改、分发和商业使用。本地用已有 FFmpeg 转为 44.1kHz、双声道、80kbps MP3，时长约69.90秒，699,603字节。public/audio/LICENSE.txt 记录作者、原始文件地址、下载日期和许可链接。设置中的“素材鸣谢”同时列出来源。署名不表示作者认可本游戏。

背景音乐首次用户操作后才加载和播放，循环、音量18%，不占首屏下载；用户可以独立控制音乐和音效，偏好随存档保存。旧版关闭音效的存档默认同时关闭新增音乐。页面隐藏或广告开始时暂停，返回后按用户偏好恢复。浏览器拒绝播放或音频加载失败不阻塞游戏。

文字和音乐是2026年10月29日用户要求的视觉与听觉更新。现有两张游戏图集继续复用，没有新增序列帧或视频。
