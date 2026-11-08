let shownResultRound=null;
function resultSummary(game,localPlayer=0){
 const left=game.finishReason==='opponent-left'||game.status==='abandoned';
 const forfeited=Number.isInteger(game.forfeited)?game.forfeited:left?game.players.findIndex(p=>p.name===game.leftBy):-1;
 const high=Math.max(...game.scores),winners=forfeited>=0?game.scores.map((_,i)=>i).filter(i=>i!==forfeited):game.resultWinners||game.scores.map((score,i)=>score===high?i:-1).filter(i=>i>=0);
 const tie=!left&&game.finishReason!=='timeout'&&forfeited<0&&!game.resultWinners&&winners.length>1,winner=winners[0],won=winners.includes(localPlayer);
 const standings=playerStandings(game),position=standings.find(row=>row.player===localPlayer),place=position.place,label=position.label+(position.tied?' (tie)':'');
 const title=tie?(won?'DRAW':'YOU LOSE'):won?'YOU WIN!':'YOU LOSE';
 const subtitle=left?(won?'Opponent left the match. You win!':'You left the match.'):game.finishReason==='timeout'?(won?'Opponent ran out of time.':'Time ran out. Make a move before the countdown ends.'):tie&&won?'Same highest score. The match is a draw.':won?'1st place! You finished with '+game.scores[localPlayer]+' boxes.':'You finished '+label+' of '+game.scores.length+' players. Ready for a comeback?';
 return {winner,winners,tie,won,left,title,subtitle,standings,place};
}
function refreshResult(){
 if(!['finished','abandoned'].includes(s.status)){if($('#resultDialog').open)$('#resultDialog').close();shownResultRound=null;return;}
 const id=`${room||'local'}-${s.round}`;if(shownResultRound===id)return;shownResultRound=id;
 const local=room?s.me:0,outcome=resultSummary(s,local);$('#resultTitle').textContent=outcome.title;$('#resultSubtitle').textContent=outcome.subtitle;
 $('#resultDialog').dataset.reason=outcome.left?'opponent-left':s.finishReason||'score';
 $('#resultDialog').dataset.outcome=outcome.tie&&outcome.won?'tie':outcome.won?'win':'loss';$('#resultDialog').dataset.place=outcome.place;
 $('.result-eyebrow').textContent=outcome.left?'MATCH ENDED':s.finishReason==='timeout'?'TIME UP':'FINAL STANDINGS';
 const localRank=outcome.standings.find(row=>row.player===local);$('#resultPlacement').textContent=outcome.tie&&outcome.won?'DRAW':localRank.label+(localRank.tied?' (tie)':'');
 const badge=$('#resultAvatar');badge.className='avatar result-avatar'+(s.computer&&s.players[local]?.computer?' computer-avatar':'');badge.style.setProperty('--winner-color',colors[local]);badge.setAttribute('aria-label',playerName(local)+' — '+localRank.label+' place');
 $('#resultScores').replaceChildren();$('#resultScores').setAttribute('role','list');$('#resultScores').setAttribute('aria-label','Final player standings');
 for(const rank of outcome.standings){
  const i=rank.player,item=document.createElement('div');item.className='result-score'+(outcome.winners.includes(i)?' winner':'')+(i===local?' your-result':'');item.dataset.place=rank.place;item.style.setProperty('--color',colors[i]);item.setAttribute('role','listitem');
  const place=document.createElement('span');place.className='result-rank';place.textContent=rank.label;
  const icon=document.createElement('span');icon.className='avatar'+(s.players[i]?.computer?' computer-avatar':'');icon.style.background=colors[i];
  const details=document.createElement('div');details.className='result-player';const name=document.createElement('b');name.textContent=playerName(i);const note=document.createElement('small');note.textContent=(i===local?'YOU · ':'')+(i===s.forfeited?(outcome.left?'LEFT MATCH':'TIMED OUT'):rank.place===1?(outcome.tie?'DRAW':'WINNER'):rank.tied?rank.label.toUpperCase()+' PLACE (TIE)':rank.place===2?'RUNNER-UP':rank.label.toUpperCase()+' PLACE');details.append(name,note);
  const points=document.createElement('div');points.className='result-points';const score=document.createElement('strong');score.textContent=s.scores[i];const unit=document.createElement('small');unit.textContent='boxes';points.append(score,unit);
  item.append(place,icon,details,points);item.setAttribute('aria-label',rank.label+(rank.tied?' (tie)':'')+': '+playerName(i)+', '+s.scores[i]+' boxes');$('#resultScores').append(item);
 }
 $('#resultAgain').hidden=outcome.left;$('#resultAgain').disabled=!!room&&s.me!==0;$('#resultWait').textContent=outcome.left?'Return to the main menu to start a new match.':room&&s.me!==0?'Waiting for the host to start the next round.':'';
 if($('#settingsDialog').open)$('#settingsDialog').close();$('#resultDialog').showModal();
}
$('#resultAgain').onclick=()=>{if(busy)return;if(room)action('rematch');else{$('#resultDialog').close();$('#rematch').click();}};
$('#resultMenu').onclick=requestLeave;
$('#finishedMenu').onclick=requestLeave;
$('#resultSettings').onclick=()=>{refreshSettings();$('#settingsDialog').showModal();};
$('#resultDialog').oncancel=e=>e.preventDefault();
function updatePlayerPreview(){const count=+$('#count').value;$('#playerPreview').replaceChildren();for(let i=0;i<count;i++){const icon=document.createElement('span');icon.className='avatar'+(i>0?' computer-avatar':'');icon.style.background=colors[i];icon.title=online?`Player ${i+1}`:i===0?'You':'Computer '+i;icon.setAttribute('aria-label',icon.title);if(online)icon.classList.remove('computer-avatar');$('#playerPreview').append(icon);}}
for(const id of ['count','difficulty','size','theme']){
 const select=$('#'+id),wrap=document.createElement('div');select.setAttribute('aria-label',({count:'Choose Players',difficulty:'Computer Difficulty',size:'Board Size',theme:'Theme'}[id]));wrap.className='option-stepper';select.before(wrap);wrap.append(select);
 for(const direction of [-1,1]){const button=document.createElement('button');button.type='button';button.className='step-arrow '+(direction<0?'previous':'next');button.textContent=direction<0?'◀':'▶';button.setAttribute('aria-label',(direction<0?'Previous ':'Next ')+({count:'player count',difficulty:'difficulty',size:'board size',theme:'theme'}[id]));button.onclick=()=>{select.selectedIndex=(select.selectedIndex+direction+select.options.length)%select.options.length;select.dispatchEvent(new Event('change',{bubbles:true}));};wrap.append(button);}
 select.addEventListener('change',updatePlayerPreview);
}
$('#count').closest('label').after($('#playerPreview'));updatePlayerPreview();
// Consistent touch-friendly option menus; native selects retain the shared values.
let closeOptionMenu=()=>{};
for(const id of ['count','difficulty','size','theme']){
 const select=$('#'+id),wrap=select.parentElement,trigger=document.createElement('button'),list=document.createElement('div');
 select.hidden=true;trigger.type='button';trigger.className='option-trigger';trigger.id=id+'Trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',select.getAttribute('aria-label'));list.id=id+'Options';list.className='option-menu';list.setAttribute('role','listbox');list.setAttribute('aria-label',select.getAttribute('aria-label'));list.hidden=true;trigger.setAttribute('aria-controls',list.id);wrap.append(trigger,list);
 const items=Array.from(select.options,(option,index)=>{const item=document.createElement('button');item.type='button';item.className='option-item';item.setAttribute('role','option');item.textContent=option.text;item.onclick=e=>{e.preventDefault();select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));close();trigger.focus();};list.append(item);return item;});
 function sync(){trigger.textContent=select.selectedOptions[0].text;items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===select.selectedIndex)));}
 function close(){list.hidden=true;trigger.setAttribute('aria-expanded','false');wrap.classList.remove('menu-open');}
 function open(){closeOptionMenu();list.hidden=false;trigger.setAttribute('aria-expanded','true');wrap.classList.add('menu-open');closeOptionMenu=close;items[select.selectedIndex].focus();}
 trigger.onclick=e=>{e.preventDefault();list.hidden?open():close();};wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus();e.preventDefault();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&!e.target.classList.contains('step-arrow')){e.preventDefault();if(list.hidden){open();return;}const current=items.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(current+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();}});select.addEventListener('change',sync);document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});sync();
}
