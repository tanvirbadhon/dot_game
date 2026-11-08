// Include ordinary source files while preserving the separate local Sites checkout.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const split=text=>text.split('\0').filter(Boolean);
const candidates=split(git(['-C','dots-and-boxes','ls-files','--cached','--others','--exclude-standard','-z']));
const allowed=path=>!path.split('/').includes('..')&&!/(^|\/)\.env(?:\.|$)|\.(pem|key|p12|pfx)$|service-account/i.test(path)&&(path==='.openai/hosting.json'||path==='README.md'||/^[^/]+\.(mjs|cjs)$/.test(path)||/^(client|worker|drizzle)\//.test(path));
const files=[...new Set(candidates.filter(allowed).map(path=>'dots-and-boxes/'+path))].filter(path=>fs.existsSync(new URL(path,import.meta.url))).sort();
if(!files.length)throw Error('No game source found; refusing to change the index.');
if(git(['ls-files','--stage','--','dots-and-boxes']).startsWith('160000 '))git(['rm','--cached','--','dots-and-boxes']);
const wanted=new Set(files);
for(const path of split(git(['ls-files','-z','--','dots-and-boxes/'])))if(!wanted.has(path))git(['update-index','--force-remove','--',path]);
for(const path of files){
 const hash=git(['hash-object','-w','--path='+path,'--',path]).trim();
 git(['update-index','--add','--cacheinfo','100644',hash,path]);
}
console.log(`Staged ${files.length} ordinary game source files; local Sites Git metadata preserved.`);
