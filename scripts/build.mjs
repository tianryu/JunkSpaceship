import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
const root=await fs.realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const target=path.join(root,'dist');
try {
 const entry=await fs.lstat(target);
 if(entry.isSymbolicLink()||!entry.isDirectory()||await fs.realpath(target)!==target||path.dirname(target)!==root)throw Error('Refusing to clean an unexpected output path.');
 console.log('Verified generated output directory:',target);
 await fs.rm(target,{recursive:true,force:false});
}catch(error){if(error.code!=='ENOENT')throw error}
await build({root,build:{outDir:target,emptyOutDir:true}});
