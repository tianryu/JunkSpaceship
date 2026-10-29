import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const errors=[];
const files=walk('dist').map(file=>({file:file.replaceAll('\\','/').replace(/^dist\//,''),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
const unpackedBytes=files.reduce((a,f)=>a+f.bytes,0);
// Background music is created with preload=none only after the first gesture.
const deferredAudioBytes=files.filter(f=>f.file.startsWith('audio/')).reduce((a,f)=>a+f.bytes,0);
const firstScreenUpperBoundBytes=unpackedBytes-deferredAudioBytes;
if(firstScreenUpperBoundBytes>3000000)errors.push('First-screen target of 3 MB exceeded.');
if(unpackedBytes>=20000000)errors.push('Unpacked release exceeds the strict 20,000,000 byte limit.');
if(unpackedBytes>10000000)errors.push('Runtime target of 10 MB exceeded.');
if(files.some(f=>/docs|concepts|node_modules|\.map$|\.env|\.ttf$|\.test\./.test(f.file)))errors.push('Non-runtime file in release.');
const code=files.filter(f=>/\.(js|css|html)$/.test(f.file)).map(f=>fs.readFileSync(path.join('dist',f.file),'utf8')).join('\n');
for(const needle of ['测试广告','data-test-result','data-diagnostics','fixture=','开发测试模式'])if(code.includes(needle))errors.push('Development-only feature in release: '+needle);
if(/url\(["']?\/(?!\/)/.test(code))errors.push('Root-absolute public CSS asset URL may fail under a nested H5 path.');
const textPaths=['src','docs','design'].flatMap(walk).filter(f=>/\.(ts|js|css|md|json|html)$/.test(f));
for(const file of textPaths){if(fs.readFileSync(file,'utf8').includes(String.fromCodePoint(0xb7)))errors.push('Forbidden separator found: '+file)}
const report={buildVersion:JSON.parse(fs.readFileSync('package.json','utf8')).version,generatedAt:new Date().toISOString(),unpackedBytes,firstScreenUpperBoundBytes,deferredAudioBytes,runtimeTargetBytes:10000000,hardLimitExclusiveBytes:20000000,productionMockDisabled:!errors.some(x=>x.includes('Development-only')),files:files.sort((a,b)=>b.bytes-a.bytes),errors,passed:errors.length===0};
fs.mkdirSync('docs/validation',{recursive:true});fs.writeFileSync('docs/validation/package-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
