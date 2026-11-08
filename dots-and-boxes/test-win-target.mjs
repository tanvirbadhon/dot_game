import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {newGame,move,winProgress} from './worker/engine.mjs';import {legalMoves} from './worker/ai.mjs';
for(const [cols,rows,target]of [[3,2,4],[5,4,11],[8,6,25],[11,9,50],[10,10,51]]){const g={cols,rows,scores:[0,0]};assert.equal(winProgress(g).target,target);g.scores=[target-1,0];assert.equal(winProgress(g).winner,-1);g.scores=[target,0];assert.equal(winProgress(g).winner,0);}
assert.equal(winProgress({cols:10,rows:10,scores:[50,50]}).winner,-1,'half the boxes can still tie');
assert.equal(winProgress({cols:11,rows:9,scores:[34,33,32]}).winner,0,'three-player winner can secure fewer than half');
assert.equal(winProgress({cols:5,rows:4,scores:[8,5,4,1]}).winner,0,'unclaimed boxes cannot change a secured four-player winner');
assert.equal(winProgress({cols:5,rows:4,scores:[7,5,4,1]}).winner,-1,'opponents can still catch the leader');
let continued=false;
for(let seed=1;seed<=100&&!continued;seed++){const g=newGame(2,3);g.status='playing';let random=seed;while(g.status==='playing'){const legal=legalMoves(g);random=(random*1664525+1013904223)>>>0;move(g,legal[random%legal.length],g.turn);if(winProgress(g).winner>=0&&g.status==='playing'){const count=Object.keys(g.edges).length;move(g,legalMoves(g)[0],g.turn);assert.equal(Object.keys(g.edges).length,count+1);continued=true;break;}}}
assert(continued,'a secured majority must leave the board playable');
const dialog={open:false,showModal(){throw Error('A secured lead must not open a popup during play');},close(){this.open=false;}},context={s:{status:'playing'},$:()=>dialog,shownResultRound:null};vm.createContext(context);const source=fs.readFileSync('client/results.js','utf8');vm.runInContext(source.slice(source.indexOf('function refreshResult(){'),source.indexOf("$('#resultAgain').onclick")),context);context.refreshResult();
console.log('Passed: all win targets, 100→51, 99→50, ties, 3–4 player secured leads, continued moves after winning, and no popup before the board is complete.');
