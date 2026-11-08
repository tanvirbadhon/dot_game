import assert from 'node:assert/strict';import {playerStandings} from './worker/engine.mjs';
const match=(scores,total=20)=>({cols:total,rows:1,scores,status:'playing',players:scores.map((_,i)=>({name:'Player '+i}))});
let rows=playerStandings(match([1,4,9]));assert.equal(rows[0].player,2);assert.equal(rows[0].place,1);assert.equal(rows[0].secured,false,'9–4–1 with six left is not guaranteed: second place can reach ten');
rows=playerStandings(match([1,4,10]));assert.equal(rows[0].secured,true,'ten secures first without needing eleven');
rows=playerStandings(match([1,2,0,3],6));assert.deepEqual(rows.map(x=>x.player),[3,1,0,2]);assert.deepEqual(rows.map(x=>x.label),['1st','2nd','3rd','4th']);
rows=playerStandings(match([2,2,1,1],6));assert.deepEqual(rows.map(x=>x.place),[1,1,3,3]);assert(rows.every(x=>x.tied&&x.secured));
function allocations(total,count){if(count===1)return [[total]];const out=[];for(let n=0;n<=total;n++)for(const tail of allocations(total-n,count-1))out.push([n,...tail]);return out;}
for(const count of [2,3,4])for(let used=0;used<=6;used++)for(const scores of allocations(used,count)){
 const remaining=6-used,g=match(scores,6);
 for(const row of playerStandings(g).filter(row=>row.secured&&remaining>0))for(const extra of allocations(remaining,count)){
  const final=playerStandings(match(scores.map((score,i)=>score+extra[i]),6)).find(x=>x.player===row.player);
  assert.equal(final.place,row.place,'secured positions cannot change');assert.equal(final.tied,false,'secured places cannot become ties');
 }
}
const forfeited=match([0,3,2,1],6);forfeited.status='finished';forfeited.forfeited=1;rows=playerStandings(forfeited);assert.equal(rows.at(-1).player,1);assert.equal(rows.at(-1).place,4);assert(rows.slice(0,3).every(row=>row.place===1));
console.log('Passed: 2–4 player positions, shared ranks, premature-win prevention, early secured places, exhaustive remaining-box allocations, and forfeit order.');
