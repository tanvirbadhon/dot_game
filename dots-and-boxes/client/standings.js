function renderWinStatus(waiting,finished,outcome){
 const panel=$('#winTarget');panel.hidden=waiting||s.count>2;$('#finishedMenu').hidden=!finished||!!s.finishReason||s.status==='abandoned';if(s.count>2)return;
 const rows=playerStandings(s),leaders=rows.filter(row=>row.place===1),locked=leaders.filter(row=>row.secured),first=leaders[0],total=s.cols*s.rows,remaining=Math.max(0,total-s.scores.reduce((a,b)=>a+b,0)),local=room?s.me:0;
 panel.dataset.mode='target';panel.classList.toggle('secured',locked.length>0);panel.style.setProperty('--winner-color',locked.length?colors[first.player]:'#70f5dd');
 let label,count,details,notice;
  const target=Math.floor(total/2)+1;
  label=locked.length?'WIN SECURED':'WIN TARGET';count=locked.length>1?'Match tied':locked.length?(first.player===local?'You win!':playerName(first.player)+' wins!'):target+' boxes';
  details=total+' total boxes · '+target+' boxes guarantee a win.';
  notice=finished?'Board complete. Final results are ready.':locked.length?remaining+' boxes left. Keep playing!':'You need '+Math.max(0,target-s.scores[local])+' more to reach the target.';
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
