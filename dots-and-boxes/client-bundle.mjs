import fs from 'node:fs';
const read=name=>fs.readFileSync(name,'utf8');
export function bundleClientScript(){
 const ai=()=>read('worker/ai.mjs').replace(/^import .*;\r?\n/,'').replaceAll('export ','');
 const computer=()=>read('client/computer.js').replace('/* SOUND */',()=>read('client/sound.js')).replace('/* AI */',ai);
 const parts={STORAGE:()=>read('client/storage.js'),ENGINE:()=>read('worker/engine.mjs').replaceAll('export ',''),BOARD:()=>read('client/board.js'),STANDINGS:()=>read('client/standings.js'),COMPUTER:computer,SAVED_GAME:()=>read('client/saved-game.js'),SETTINGS:()=>read('client/settings.js'),RESULTS:()=>read('client/results.js')};
 let script=read('client/game.js');
 for(const [name,source]of Object.entries(parts))script=script.replace('/* '+name+' */',source);
 if(/\/\* (?:STORAGE|ENGINE|BOARD|STANDINGS|COMPUTER|SAVED_GAME|SETTINGS|RESULTS|SOUND|AI) \*\//.test(script))throw Error('Client bundle has unresolved source markers.');
 return script;
}
