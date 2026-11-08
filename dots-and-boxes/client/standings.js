function renderWinStatus(waiting,finished,outcome){
 const rows=playerStandings(s),leaders=rows.filter(row=>row.place===1),locked=leaders.filter(row=>row.secured),first=leaders[0],total=s.cols*s.rows,remaining=Math.max(0,total-s.scores.reduce((a,b)=>a+b,0)),local=room?s.me:0;
 const panel=$('#winTarget');panel.hidden=waiting;panel.dataset.mode=s.count>2?'standings':'target';panel.classList.toggle('secured',locked.length>0);panel.style.setProperty('--winner-color',locked.length?colors[first.player]:'#70f5dd');
 let label,count,details,notice;
 if(s.count>2){
  label=finished?'FINAL STANDINGS':'LIVE STANDINGS';
  count=locked.length>1?'Joint 1st place':locked.length?(first.player===local?'You secured 1st!':playerName(first.player)+' secured 1st!'):leaders.length>1?'Joint lead':playerName(first.player)+' leads';
  details=total+' total boxes · '+remaining+' left to claim.';
  notice=finished?'See every player’s position in the results.':locked.length?'1st place is secured. Keep playing for the remaining places.':'Positions can change while boxes remain.';
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
  if(!waiting){
   const badge=document.createElement('span');badge.className='rank-badge'+(rank.secured?' locked':'')+(rank.place===1&&rank.secured?' rank-win':'');
   badge.textContent=rank.tied?'Joint '+rank.label:rank.label+(rank.secured?(rank.place===1?' · WIN':' · LOCKED'):'');
   badge.title=rank.secured?'Guaranteed '+(rank.tied?'joint ':'')+rank.label+' place':'Current '+(rank.tied?'joint ':'')+rank.label+' place; positions can change';card.append(badge);
   if(rank.place===1&&rank.secured)card.classList.add('win-secured');
  }
  card.setAttribute('aria-label',`${playerName(i)}: ${s.scores[i]} boxes, ${rank.tied?'joint ':''}${rank.label}${rank.secured?', secured':''}${!waiting&&!finished&&s.turn===i?', current turn':''}`);$('#scores').append(card);
 }
}
