from pathlib import Path
import sys
sys.path.insert(0, str(Path('.tools/python').resolve()))
from fontTools import subset

source = Path('.tools/fonts/ChillRoundF.ttf')
text = ''.join(chr(i) for i in range(32, 127))
for path in Path('src').rglob('*'):
    if path.suffix in ['.ts', '.css']:
        text += path.read_text(encoding='utf-8')
text += '→×∞秒分时伤害资源已到账必得完整观看广告年月日分钟网络连接失败成功取消保持继续'
options = subset.Options()
options.flavor = 'woff2'
options.desubroutinize = True
font = subset.load_font(str(source), options)
chinese = {ord(c) for c in text if '\u4e00' <= c <= '\u9fff'}
cmap = font.getBestCmap()
missing = chinese - cmap.keys()
blank = {c for c in chinese & cmap.keys() if font['glyf'][cmap[c]].numberOfContours == 0}
assert not missing and not blank, f'Missing or blank Chinese glyphs: {sorted(missing | blank)}'
# The source reserves its family names. Rename the modified game subset.
names = {1: 'Scrap Round', 2: 'Regular', 3: 'ScrapRound-GameSubset-3',
         4: 'Scrap Round Regular', 6: 'ScrapRound-Regular',
         16: 'Scrap Round', 17: 'Regular'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
subset.save_font(font, 'public/fonts/scrap-round.woff2', options)
print('Subset font:', Path('public/fonts/scrap-round.woff2').stat().st_size, 'bytes')
