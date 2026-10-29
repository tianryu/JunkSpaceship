// Normalize a generated 3 by 2 atlas to equal square cells without repainting it.
// Run with SHARP_MODULE pointing to the installed sharp package when not local.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const source='docs/concepts/ships-atlas-v1.png';
const cells=[];
for(let index=0;index<6;index++) {
  const top=index<3?0:438, height=index<3?438:586;
  const input=await sharp(source).extract({left:index%3*512,top,width:512,height}).toBuffer();
  const normalized=await sharp(input).trim().resize(224,224,{fit:'contain',background:'#00000000'}).extend({top:16,bottom:16,left:16,right:16,background:'#00000000'}).toBuffer();
  cells.push({input:normalized,left:index%3*256,top:Math.floor(index/3)*256});
}
await sharp({create:{width:768,height:512,channels:4,background:'#00000000'}}).composite(cells).webp({quality:85,alphaQuality:100,effort:6}).toFile('public/art/ships.webp');
console.log(await sharp('public/art/ships.webp').metadata());
