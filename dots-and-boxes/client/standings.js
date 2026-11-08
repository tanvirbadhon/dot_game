// Forecast several possible continuations, favouring captures and safe lines.
// This is an estimate, never a result or a reason to end the match.
function predictWinner(game){
 const keys=[],adj=[],walls=new Uint8Array(game.cols*game.rows);
 for(let r=0;r<=game.rows;r++)for(let c=0;c<=game.cols;c++)for(const type of ['h','v']){
  if(type==='h'&&c===game.cols||type==='v'&&r===game.rows)continue;
  const key=`${type}-${r}-${c}`,boxes=type==='h'?[r>0?(r-1)*game.cols+c:-1,r<game.rows?r*game.cols+c:-1]:[c>0?r*game.cols+c-1:-1,c<game.cols?r*game.cols+c:-1];
  if(Object.hasOwn(game.edges,key)){for(const b of boxes)if(b>=0)walls[b]++;}else{keys.push(key);adj.push(boxes.filter(b=>b>=0));}
 }
 const votes=Array(game.count).fill(0),runs=12;let seed=keys.length+game.turn*97+1;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let run=0;run<runs;run++){
  const counts=walls.slice(),available=keys.map((_,i)=>i),scores=[...game.scores];let turn=game.turn;
  while(available.length){let best=-Infinity,chosen=0;
   for(let j=0;j<available.length;j++){const i=available[j];let value=random()*6;for(const b of adj[i])value+=counts[b]===3?1000:counts[b]===2?-100:counts[b]===1?-8:1;if(value>best){best=value;chosen=j;}}
   const [edge]=available.splice(chosen,1);let gain=0;for(const b of adj[edge])if(++counts[b]===4)gain++;scores[turn]+=gain;if(!gain)turn=(turn+1)%game.count;
  }
  const high=Math.max(...scores),winners=scores.map((v,i)=>v===high?i:-1).filter(i=>i>=0);if(winners.length===1)votes[winners[0]]++;
 }
 const most=Math.max(...votes),winner=votes.indexOf(most);return most>=runs*.75?winner:null;
}
function renderWinStatus(waiting,finished,outcome){
 const rows=playerStandings(s),leaders=rows.filter(row=>row.place===1),locked=leaders.filter(row=>row.secured),first=leaders[0],total=s.cols*s.rows,remaining=Math.max(0,total-s.scores.reduce((a,b)=>a+b,0)),local=room?s.me:0;
 const panel=$('#winTarget');panel.hidden=waiting;panel.dataset.mode=s.count>2?'standings':'target';panel.classList.toggle('secured',locked.length>0);panel.style.setProperty('--winner-color',locked.length?colors[first.player]:'#70f5dd');
 let label,count,details,notice;
 if(s.count>2){
  const predicted=!finished&&!locked.length?predictWinner(s):null;
  label=locked.length===1?'WIN SECURED':'WIN PREDICTION';
  count=locked.length===1?(first.player===local?'You win!':playerName(first.player)+' wins!'):finished?'Match complete':predicted===null?'Too close to call':playerName(predicted)+' is favoured';
  details=total+' total boxes · '+remaining+' left to claim.';
  notice=finished?'Final results are ready.':locked.length===1?'Nobody can catch the winner. Keep playing!':'Estimate from possible next lines. Not a guaranteed result.';
 }else{
  const target=Math.floor(total/2)+1;
  label=locked.length?'WIN SECURED':'WIN TARGET';count=locked.length>1?'Match tied':locked.length?(first.player===local?'You win!':playerName(first.player)+' wins!'):target+' boxes';
  details=total+' total boxes · '+target+' boxes guarantee a win.';
  notice=finished?'Board complete. Final results are ready.':locked.length?remaining+' boxes left. Keep playing!':'You need '+Math.max(0,target-s.scores[local])+' more to reach the target.';
 }
 if(finished&&(s.finishReason||s.status==='abandoned'))notice=outcome.subtitle;
 $('#winTargetLabel').textContent=label;$('#winTargetCount').textContent=count;$('#winTargetDetails').textContent=details;
 if($('#winTargetNotice').textContent!==notice)$('#winTargetNotice').textContent=notice;
 $('#finishedMenu').hidden=!finished||!!s.finishReason||s.status==='abandoned';
}
function renderScores(waiting,finished){
 const rows=playerStandings(s);$('#scores').replaceChildren();
 for(let i=0;i<s.count;i++){
  const rank=rows.find(row=>row.player===i),card=document.createElement('div');card.className='score'+(!waiting&&!finished&&s.turn===i?' active':'');card.style.setProperty('--color',colors[i]);
  const avatar=document.createElement('span');avatar.className='avatar'+(s.computer&&i>0?' computer-avatar':'');
  const names=document.createElement('div');names.className='score-name';names.textContent=playerName(i);names.title=playerName(i);
  const score=document.createElement('b');score.textContent=s.scores[i];card.append(avatar,names,score);
  if(!waiting&&rank.place===1&&rank.secured&&!rank.tied){
   const badge=document.createElement('span');badge.className='rank-badge'+(rank.secured?' locked':'')+(rank.place===1&&rank.secured?' rank-win':'');
   badge.textContent='WIN';
   badge.title='Win secured; you can keep playing until the board is complete';card.append(badge);
   if(rank.place===1&&rank.secured)card.classList.add('win-secured');
  }
  card.setAttribute('aria-label',`${playerName(i)}: ${s.scores[i]} boxes${rank.place===1&&rank.secured&&!rank.tied?', win secured':''}${!waiting&&!finished&&s.turn===i?', current turn':''}`);$('#scores').append(card);
 }
}
