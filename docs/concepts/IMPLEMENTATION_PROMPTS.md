# 清屏改版与实施素材提示词

以下均由内置 imagegen 生成。旧 v2 图保留作历史记录，01 与 02 的当前基准改为 v3，原因是用户明确要求将超载改为看广告清屏。03 与 04 继续使用 v2。图像均为概念参考，实机截图单独记录。

## 共用透明精灵图集

```text
Use case: precise-object-edit / production game sprite extraction. Reference image is the approved actual UI concept for Scrapship. Produce a transparent PNG sprite atlas, 1536x1152, exactly FOUR columns and THREE rows of equal square cells. Fully transparent background (real alpha), NO checkerboard baked in, no labels, no grid lines, no text, no shadows outside object. This is NOT a UI screenshot.
Keep the exact reference object's thick navy outline, rust scratches, metal bevels, amber/cyan lighting, flat 2D illustrated sprite look. Each object centered inside its cell, generous empty alpha gutter 15% of each cell. No object crosses a cell. Same pixel density and art detail throughout.
Row1 left to right: 1 rusty rectangular metal plate with bolt holes copied from reference, 2 diagonal gray screw copied from reference, 3 hexagonal metal nut copied from reference, 4 rusty orange machine crate copied from reference.
Row2: 1 cyan battery with lightning symbol from reference, 2 amber U-shaped magnet from reference WITHOUT aura ring, 3 yellow rounded hovering drone with black cyan-eye visor and two rotors from reference WITHOUT jet flames, 4 a small cyan glowing energy core orb inside metal casing.
Row3: FOUR versions of the SAME small amber rocket anchored identically, same size/pose, front view, use reference round cyan window capsule. Col1 skeletal unfinished rocket frame with thin metal ribs, col2 rocket with amber main cabin installed and two gray feet, col3 same plus two small side engines, col4 completed same rocket plus antenna and cyan energy glow. No scaffolding, no docking platform, no background around rockets. Entire body fits each square.
Avoid adding any other objects, avoid photorealistic 3D, avoid any baked background. Pixel dimensions and evenly aligned grid are critical for runtime Canvas cropping.
```

## 空白工业界面背景

```text
Use case: precise-object-edit. Turn the reference game screenshot into a reusable EMPTY game UI background skin, same 941x1672 portrait resolution and exact geometry.
REMOVE ALL text, letters, numbers, icons, symbols, buttons' inner content, price chips, coins, status bars and progress fills. REMOVE all scrap items, batteries, drones, magnet, sparks and all light trails from the arena. REMOVE the rocket entirely but KEEP the empty scaffolding and striped docking platform and industrial wall. REMOVE settings icon, logo, top plus button and all bottom navigation icons. REMOVE the cyan overdrive button from arena.
KEEP precisely the original background wall, arena floor, industrial plate texture, frame borders, blank wallet panel, blank header panel, empty rocket assembly bay, empty arena, blank upgrade header panel, four blank upgrade card outlines, and four blank bottom navigation slot outlines. All text areas must be completely empty. Remove selected amber border from first nav slot, make all four neutral blue.
Keep the original subtle highlights and navy textures. Fill removed objects with seamless continuation of the underlying dark arena metal floor. This is STATIC ART for a working game; all gameplay items, text and buttons will be drawn independently in code. No baked interactive information or gameplay objects may remain. No extra effects or scenery. No new layout.
```

## 01 前期回收 v3

```text
Edit the attached approved portrait gameplay concept for 废品飞船. Make exactly one UI wording change: the cyan outlined action button at the bottom right of the junk arena currently reads 超载. Replace that label with 清屏, keeping its lightning icon and small 广告 badge. Preserve ALL other pixels and composition as closely as possible: 941x1672 framing, dark industrial background, orange magnet/drone/rocket, objects, Chinese title, wallet, upgrade cards, bottom navigation. No new labels or prose. No middle-dot separator character anywhere. This is the updated final concept reference for a one-shot rewarded-ad screen-clearing ability.
```

## 02 清屏就绪 v3

```text
Update the attached approved late-game portrait gameplay concept of 废品飞船 for a revised ONE-SHOT screen-clearing rewarded-ad ability. Preserve the original layout, all upper header/wallet/ship UI, 04 残骸场 and 导航 78%, four yellow drones, warm yellow magnet, scattered metal salvage, dark industrial background, four upgrade cards, bottom navigation. Remove the three temporary overdrive badges at the top of the arena: remove 01:28, ×2, +50% entirely and restore matching empty arena background underneath. Tone down electrical effects to two thin ordinary cyan collection trails and a few tiny cyan/amber specks. The bottom-right cyan outlined action button must show the lightning icon and the Chinese label 清屏, with a small distinct 广告 badge above its corner. There are NO timers and NO temporary damage/radius buffs. The arena remains populated with its existing scrap, because this concept is the ready-to-use clear-screen action state BEFORE watching an ad. 941x1672 portrait aspect, no phone frame, no added explanations, no U+00B7 middle-dot separators.
```
