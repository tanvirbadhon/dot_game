const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const {playerStandings}=require('./worker/engine.mjs');const source=fs.readFileSync('client/results.js','utf8').split('function refreshResult(){')[0],context={playerStandings};vm.createContext(context);vm.runInContext(source,context);
const game=scores=>({cols:5,rows:4,scores,players:scores.map((_,i)=>({name:i===0?'You':i===1?'Computer':'Player '+(i+1)}))});
assert.equal(context.resultSummary(game([8,4])).title,'YOU WIN!');assert.equal(context.resultSummary(game([3,9])).title,'YOU LOSE');assert.equal(context.resultSummary(game([6,6])).tie,true);assert.equal(context.resultSummary(game([3,5,7,5]),2).won,true);assert.equal(context.resultSummary(game([3,5,7,5]),0).won,false);assert.equal(context.resultSummary(game([6,6,3,5]),0).winners.length,2);console.log('Passed: win, loss, tie, four-player scores, and online player perspective.');

assert.equal(context.resultSummary({...game([0,0]),finishReason:'timeout',forfeited:1},0).title,'YOU WIN!');assert.equal(context.resultSummary({...game([0,0]),finishReason:'timeout',forfeited:1},1).title,'YOU LOSE');

for(const count of [2,3,4]){const match={...game(Array(count).fill(0)),finishReason:'opponent-left',forfeited:1};const winner=context.resultSummary(match,0);assert.equal(winner.title,'YOU WIN!');assert.equal(winner.tie,false);assert.equal(winner.subtitle,'Opponent left the match. You win!');assert.equal(winner.winners.length,count-1);assert.equal(context.resultSummary(match,1).title,'YOU LOSE');}
assert.equal(context.resultSummary({...game([0,0]),status:'abandoned',leftBy:'Computer'},0).title,'YOU WIN!');
console.log('Passed: opponent-left victories for 2–4 players, no false tie, and legacy rooms.');
