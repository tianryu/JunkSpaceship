import fs from 'node:fs';
import path from 'node:path';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
// Minimal standard ZIP32 writer: local entries, central directory and EOCD.
// Runtime filenames are UTF-8 and the archive root contains index.html.
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('dist').sort();
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
const crc32=b=>{let n=0xffffffff;for(const x of b)n=crcTable[(n^x)&255]^(n>>>8);return (n^0xffffffff)>>>0};
const parts=[],central=[],entries=[];let offset=0,unpackedBytes=0;
for(const file of files){
 const name=file.replaceAll('\\','/').replace(/^dist\//,''),nameBytes=Buffer.from(name),raw=fs.readFileSync(file),data=deflateRawSync(raw,{level:9}),crc=crc32(raw);
 const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(0x21,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(nameBytes.length,26);
 parts.push(h,nameBytes,data);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(0x21,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(nameBytes.length,28);c.writeUInt32LE(offset,42);central.push(c,nameBytes);
 offset+=h.length+nameBytes.length+data.length;unpackedBytes+=raw.length;entries.push({path:name,bytes:raw.length});
}
const centralBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(centralBytes.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...parts,centralBytes,end]);
if(!entries.some(e=>e.path==='index.html')||zip.length>=20000000||unpackedBytes>=20000000)throw Error('Invalid release structure or package budget exceeded.');
fs.mkdirSync('release',{recursive:true});const archive='release/scrapship-h5-0.1.0.zip';fs.writeFileSync(archive,zip);
const report={archive,zipBytes:zip.length,unpackedBytes,sha256:createHash('sha256').update(zip).digest('hex'),entries};fs.writeFileSync('docs/validation/zip-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
