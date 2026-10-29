# 概念图生成提示词

日期：2026年10月28日。使用内置 image_gen 工具，非CLI。当前交付以v2少文字版为准；参考图和概念原图不进入游戏发布包。

四图关系：先生成主界面原稿，再根据用户要求编辑为v2；其余三个最终画面均以v2主界面为唯一视觉参考。每次调用单独生成一张图。

## 最初视觉参考

原稿保存在drafts，仅用于复现来源，不是开发验收基准。

```text
Use case: ui-mockup
Asset type: production-constrained actual gameplay screen concept for a Chinese portrait mobile H5 incremental game, NOT promotional key art.
Create ONE full-bleed portrait screen, 1080 x 1920 pixels, exactly 9:16, no phone bezel, no surrounding canvas, no logo watermarks. Game title 废品飞船 (Scrapship).
Art direction: beautifully polished but BUILDABLE 2D flat vector-like indie game, orthographic front/top-ish scrapyard with simple outlined reusable sprites, no realistic 3D, no isometric world, no texture painting, no complex lighting. Cozy industrial midnight workshop. Flat midnight navy #0B1421 background, panels #142436 and #1C3246, thin steel-blue #35516A borders, amber #FFC45C interactive money accents, cyan #55DDE0 technology accents, warm off-white #EEF4F5 text, muted #9EB0C0 secondary text. Rounded corners, consistent 2px dark sprite outlines, small restrained inner highlights, hard graphic shapes. No tiny illegible decorative text. Chinese labels must match exactly.
Screen coordinates expressed as percentages of height: 0-6% title bar, 6-12% currency/status bar, 12-29% rocket assembly bay, 29-68% interactive salvage field, 68-91% upgrade panel, 91-100% navigation and safe bottom margin. 4.4% side margins; shared consistent grid.
Top title bar: small orange hexagonal bolt mark, bold Chinese title "废品飞船", small muted "SCRAPSHIP" below, settings cog at right.
Status: coin icon and "2,480", cyan tiny "自动 +12 / 秒", plus button at right of funds.
Rocket bay: left small label "01 / 巷口废品堆", simple progress bar and "飞船骨架  62%". Center-right a small partly assembled charming junk rocket, yellow-orange capsule frame, gray scrap metal feet, round cyan window outline, scaffold lines representing missing pieces, sitting on a low amber-striped docking platform. Crisp simple sprite 140x120 logical, not giant illustration. A few dim workshop grid lines.
Salvage field: rectangular dark blue recessed arena with four subtle corner brackets, tiny label "拖动磁铁，回收废品". About 22 individually readable objects with space between them: screws, hex nuts, three small rusted machine boxes, 2 teal batteries, flat metal plates. Bottom-left an amber U-shaped magnet inside a translucent cyan ring, 2 thin cyan curved pickup trails, small orange and cyan spark particles, "+8" and "+12" floating text. ONE small friendly yellow oval drone with dark visor and two tiny propellers near right. Physical objects look like reusable simple 2D game sprites, not painted scenery. Bottom-right inside arena a neat outlined cyan ability button with lightning icon, label "磁暴", small explicit "广告" badge; no huge ad banner. No characters or hands.
Upgrade panel: dark rounded section with header "回收设备", "购买 ×1" at right, exactly FOUR cards in 2 columns x 2 rows. Each card has a small simple line icon, Chinese title and level, a compact stat line and amber purchase price chip.
Card1 "磁力 Lv.3" / "拆解伤害 +25%" / "180"
Card2 "磁场 Lv.1" / "作用范围 +12%" / "260"
Card3 "无人机 1/6" / "增加自动回收" / "480"
Card4 "回收效率 Lv.2" / "出售价值 +15%" / "320"
Bottom nav exactly 4 evenly spaced icons with labels: "升级" highlighted amber, "研发", "仓库", "补给". This is an actual functional mobile game layout, finger-friendly with generous spacing and clear hierarchy.
Mood: satisfying, charming, tactile sci-fi scrapyard, cohesive original UI. Every important panel boundary precisely aligned. Keep artwork modest enough that an 8-hour HTML Canvas game can match it using sprite assets and vector drawing.
```

## 01 前期回收v2

输入：drafts/01-early-game-v1.png。

```text
Use case: ui-mockup. Edit the reference gameplay concept of 废品飞船 to satisfy the user's new strict production requirements: much LESS TEXT, no middle-dot separator character U+00B7 anywhere, and FEW REUSABLE ART ASSETS for a game below 20MB.
Keep original portrait resolution 941x1672, panel geometry, game title, midnight navy / amber / cyan palette, magnet, rocket, drone and distinctive industrial style. This is the revised definitive gameplay concept, not a marketing image.
Simplify background art: replace detailed cranes, scattered scenery and complex skyline with one quiet dark industrial wall, subtle panel lines and a few simple silhouettes. Keep rocket and floor clear. Reuse only five object sprite families across arena: plate, screw, nut, machine crate, cyan battery. About 22 objects total. Only one drone. Do not introduce new art.
UI text reduction:
Top: only the bolt icon, "废品飞船", settings cog. Remove SCRAPSHIP subtitle.
Currency: coin icon "2,480", small "+12/s", plus button. Remove word 自动.
Ship bay: small "01 废品堆", progress bar with "骨架 62%". Remove chevron and decorative plaques. Same original partially assembled rocket.
Arena: remove the instructional sentence entirely. Only objects, collection trails, "+8" "+12". The magnet is lower-left. Compact lower-right cyan button has lightning icon and "超载", with a separate tiny clear "广告" badge.
Upgrade area: remove large section heading 回收设备, retain compact "升级" label and small "×1". Four 2x2 cards with consistent large icon, ONLY short name+level and price. Do NOT show descriptive sentences:
"磁力 3" price "180"
"范围 1" price "260"
"无人机 1/6" price "480"
"收益 2" price "320"
Make level secondary, icon and price dominant. Show a small help info icon by section heading so detailed rules can be inspected later.
Bottom same four icon tabs "升级" "研发" "仓库" "补给". Avoid all middle dots, bullet separators, English subtitles, redundant instructions, tiny paragraphs and full sentence card descriptions. Use whitespace for separation. Preserve premium readable consistent visual identity but make this much simpler and easier to implement with a small sprite atlas and CSS.
```

## 02 磁暴作业v2

输入：01-early-game-v2.png。

```text
Use case: ui-mockup. Edit target is the attached APPROVED minimal-text v2 gameplay screen for 废品飞船. Create one matching late-game overdrive screenshot at same 941x1672 portrait framing. Preserve EXACT layout, panel corners, title, sparse background, typography, card size, navigation and original sprites. NO middle-dot separator U+00B7 anywhere. No additional paragraphs or explanatory text. No phone frame.
Change currency to "8.42M", small rate "+24.8K/s". Chapter short label "04 残骸场", progress "导航 78%". Same yellow rocket now has two attached side engines and small antenna, same shared body, same size and spot.
In the arena, reuse ONLY same five sprite types, approximately 28 objects, FOUR identical yellow drones. Keep original lower-left magnet with stronger cyan ring. Add three thin cyan lightning chains and small "+2.4K" floaters. Do not add new junk art or scenery.
Small three separate cyan badges at arena top: lightning "01:28", damage icon "×2", radius icon "+50%". No separators between badges. Lower-right ability tile shows lightning and timer "01:28", small label "超载", no ad badge while currently active. Effects bright but not blocking objects.
Same upgrade grid with ONLY short names, level and price:
"磁力 18" / "186K"
"范围 4" / "240K"
"无人机 4/6" / "320K"
"收益 16" / "198K"
Keep the tiny section info icon and ×1. Navigation 升级 / 研发 / 仓库 / 补给 with 升级 selected. This must look like the same real 2D game in a more powerful state, restrained practical reusable sprite art, no cinematic effects.
```

## 03 插件研发v2

输入：01-early-game-v2.png。

```text
Use case: ui-mockup. Edit target is the attached approved minimal-text v2 gameplay screen 废品飞船. Create ONE research drawer screen at same 941x1672 portrait framing. Preserve entire top header, wallet and rocket bay EXACTLY, including sparse background and typography. Remove arena contents and upgrades under an opaque dark navy research drawer from the original arena top down to original nav top. Keep exact original outside frame and nav. NO middle-dot separator U+00B7 anywhere, minimal text, no device bezel.
Drawer header: "研发", small lab-token icon "×2", info icon, close X.
Top row three small installed slots with ICONS and only "Lv.2", "Lv.1", "+" beneath/in them. No long installed names.
Middle exactly SIX compact cards in 2 columns by 3 rows, with bold line icon and short name. Label selected card cyan and tick:
"电弧" "2 → 3" "16.67%"
"强磁" "1 → 2" "16.67%"
"机群" "1 → 2" "16.67%"
"切割" "0 → 1" "16.67%"
"共振" "0 → 1" "16.67%"
"分拣" "1 → 2" "16.67%"
Selected card is 电弧. Single compact summary below: cyan arc icon "+1 目标". Do not duplicate name or a sentence.
Two equally usable buttons at bottom of drawer:
left subdued steel blue "随机" with small "16.67%"
right amber "必得电弧" with a clear separate tiny "广告" badge and small "100.00%".
A single small necessary condition below the right button: "完整观看后获得".
Bottom original four tabs 升级 / 研发 / 仓库 / 补给, 研发 highlighted cyan. Consistent original icons, no multiple decoration illustrations, legible probability and reward, plenty of whitespace. Buildable UI in the same visual system.
```

## 04 精密拆解v2

输入：01-early-game-v2.png。

```text
Use case: ui-mockup. Edit target is the attached approved minimal-text v2 gameplay screen 废品飞船. Create ONE warehouse precision salvage drawer at same 941x1672 portrait framing. Preserve exact top header, wallet and rocket bay including sparse background. Replace original arena and upgrade area with one opaque midnight navy drawer inside the same borders, leaving nav in place. NO middle-dot separator U+00B7 anywhere. Very little text, no paragraphs, no phone frame.
Drawer header "拆解", small matching machine crate icon "×3", info icon and close X.
Center one enlarged reused orange machine crate from the reference, same sprite design, cyan energy core peeking through a window; no new detailed illustration. Three small progress marks below, short text "保底 1/3".
Below it two parallel option cards with equally visible buttons and enough room:
LEFT:
"普通"
large cyan core icon with "35.00%"
short "核心 ×1"
muted coin icon "65.00%  +800"
button "拆解"
RIGHT:
"精密"
large cyan core icon with "100.00%"
short "核心 ×1"
amber button "必得核心"
separate explicit badge "广告" attached to button, not disguised.
Below both cards one short rule line: "完整观看后领取，未完成不消耗".
No extra title sentences or probability paragraphs. Bottom nav same four tabs 升级 / 研发 / 仓库 / 补给, 仓库 selected amber. Original panel style, sparse color accents, precise alignment, legible percentages, sufficient tap area, restrained buildable 2D assets.
```
