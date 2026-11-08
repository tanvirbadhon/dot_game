import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {api} from './worker/api.mjs';
import {newGame,move} from './worker/engine.mjs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_rooms.sql','utf8'));
const env={DB:{prepare:sql=>({bind:(...params)=>({first:async()=>sqlite.prepare(sql).get(...params),run:async()=>({meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}})})})}};
async function call(path,body,secret){const res=await api(new Request('https://test.local/api/'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(secret?{Authorization:'Bearer '+secret}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);return {status:res.status,...await res.json()};}
for(const count of [2,3,4]){
const host=await call('create',{count,cols:5,name:'Host'});assert.equal(host.status,200);const code=host.code,players=[host];
assert(!JSON.stringify(host.state).includes('hash'));
assert.equal((await call('state?code='+code)).status,403);
assert.equal((await call('start',{code},host.token)).status,400);
const joins=await Promise.all(Array.from({length:count-1},(_,i)=>call('join',{code,name:'Guest '+i})));
// Conflicting lobby changes must retry instead of overwriting another seat.
for(const j of joins){if(j.status===409)players.push(await call('join',{code,name:'Retry guest'}));else players.push(j);}
assert.equal(players.length,count);assert(players.every(p=>p.status===200));
assert.equal((await call('join',{code,name:'Extra'})).status,400);
assert.equal((await call('start',{code},players[1].token)).status,400);
let started=await call('start',{code},host.token);assert.equal(started.state.players.length,count);
assert.equal((await call('move',{code,key:'h-0-0',round:1},players[1].token)).status,400);
assert.equal((await call('move',{code,key:'v-99-0',round:1},host.token)).status,400);
let state=started.state;
for(let r=0;r<=state.rows;r++)for(let c=0;c<state.cols;c++){const d=await call('move',{code,key:`h-${r}-${c}`,round:1},players[state.turn].token);assert.equal(d.status,200);state=d.state;}
for(let r=0;r<state.rows;r++)for(let c=0;c<=state.cols;c++){const d=await call('move',{code,key:`v-${r}-${c}`,round:1},players[state.turn].token);assert.equal(d.status,200);state=d.state;}
assert.equal(state.status,'finished');assert.equal(state.scores.reduce((a,b)=>a+b,0),20);
const reset=await call('rematch',{code},host.token);assert.equal(reset.state.round,2);assert.equal(Object.keys(reset.state.edges).length,0);
assert.equal((await call('move',{code,key:'h-0-0',round:1},host.token)).status,400);
const resumed=await call('state?code='+code,null,players[1].token);assert.equal(resumed.state.me,1);
assert.equal((await call('restart',{code},players[1].token)).status,400);
const restarted=await call('restart',{code},host.token);assert.equal(restarted.state.round,3);assert.equal(restarted.state.status,'playing');assert.equal(Object.keys(restarted.state.edges).length,0);
const left=await call('leave',{code},players[1].token);assert.equal(left.left,true);assert.equal(left.state.finishReason,'opponent-left');assert.equal(left.state.forfeited,1);assert.equal(left.state.resultWinners.length,count-1);assert(!left.state.resultWinners.includes(1));assert.equal(left.state.status,'finished');
assert.equal((await call('state?code='+code,null,host.token)).state.status,'finished');
assert.equal((await call('move',{code,key:'h-0-0',round:3},host.token)).status,400);
assert.equal((await call('restart',{code},host.token)).status,400);
assert.equal((await call('rematch',{code},host.token)).status,400);
const hostExit=await call('leave',{code},host.token);assert.equal(hostExit.state.forfeited,1);assert.equal(hostExit.state.finishReason,'opponent-left');assert.equal(hostExit.state.resultWinners.length,count-1);
console.log(count+' players: room creation, joins, capacity, permissions, turns, full round, rematch, rejoin passed.');
}
const g=newGame(2,4);g.status='playing';move(g,'h-0-0',0);move(g,'v-0-0',1);move(g,'h-1-0',0);assert.equal(move(g,'v-0-1',1),1);assert.equal(g.turn,1);assert.equal(g.scores[1],1);assert.throws(()=>move(g,'v-0-1',1));
console.log('Extra turns and duplicate line rejection passed.');


assert.equal((await call('create',{count:2,cols:3,name:''})).status,400);assert.equal((await call('create',{count:2,cols:3,name:'dhon'})).status,400);const nameHost=await call('create',{count:2,cols:3,name:'Name Test'});assert.equal((await call('join',{code:nameHost.code,name:'fuck'})).status,400);assert.equal((await call('join',{code:nameHost.code,name:''})).status,400);console.log('Server required-name and profanity rejection passed.');
