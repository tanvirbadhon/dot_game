import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {bundleClientScript} from './client-bundle.mjs';
const script=bundleClientScript(),backend='https://paper-dots-badhon.lizasuraiya44.chatgpt.site';
const inline=path=>{const html=fs.readFileSync(new URL(path,import.meta.url),'utf8');const match=html.match(/<script>([\s\S]*?)<\/script>/);assert(match,'Inline game script exists');new vm.Script(match[1]);return match[1];};
assert.equal(inline('../index.html'),script.replace("$('#onlineTab').onclick=()=>setMode(true);","$('#onlineTab').onclick=()=>{window.location.href='"+backend+"/';};"),'Standalone export contains the complete shared client');
assert.equal(inline('../firebase-public/index.html'),script.replaceAll("fetch('/api/","fetch('"+backend+"/api/"),'Firebase export contains the complete shared client');
const worker=(await import('./dist/server/index.js')).default;
assert.equal(await (await worker.fetch(new Request('https://test.local/game.js'),{})).text(),script,'Worker serves the same complete client');
for(const name of ['saveComputerMatch','refreshSavedGame','readGameStorage','writeGameStorage','drawBoard','renderWinStatus','renderScores','updateTurnClock'])assert(script.includes('function '+name+'('),name+' included');
console.log('Passed: Firebase, standalone and Worker share the complete, syntax-valid client, including save/storage and board modules.');
