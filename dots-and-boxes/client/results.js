let shownResultRound=null;
function resultSummary(game,localPlayer=0){
 const left=game.finishReason==='opponent-left'||game.status==='abandoned';
 const forfeited=Number.isInteger(game.forfeited)?game.forfeited:left?game.players.findIndex(p=>p.name===game.leftBy):-1;
 const high=Math.max(...game.scores),winners=forfeited>=0?game.scores.map((_,i)=>i).filter(i=>i!==forfeited):game.resultWinners||game.scores.map((score,i)=>score===high?i:-1).filter(i=>i>=0);
 const tie=!left&&game.finishReason!=='timeout'&&forfeited<0&&!game.resultWinners&&winners.length>1,winner=winners[0],won=winners.includes(localPlayer);
 return {winner,winners,tie,won,left,title:tie?'IT’S A TIE!':won?'YOU WIN!':'YOU LOSE',subtitle:left?(won?'Opponent left the match. You win!':'You left the match.'):game.finishReason==='timeout'?(won?'Opponent ran out of time.': 'Time ran out. Make a move before the countdown ends.'):tie?'Evenly matched. One more round?':won?'Good game! Nicely played.':'Good game! Ready for a comeback?'};
}
function refreshResult(){
 if(!['finished','abandoned'].includes(s.status)){if($('#resultDialog').open)$('#resultDialog').close();shownResultRound=null;return;}
 const id=`${room||'local'}-${s.round}`;if(shownResultRound===id)return;shownResultRound=id;
 const outcome=resultSummary(s,room?s.me:0);$('#resultTitle').textContent=outcome.title;$('#resultSubtitle').textContent=outcome.subtitle;
 $('#resultDialog').dataset.reason=outcome.left?'opponent-left':s.finishReason||'score';
 $('#resultDialog').dataset.outcome=outcome.tie?'tie':outcome.won?'win':'loss';
 const badge=$('#resultAvatar');badge.className='avatar result-avatar'+(s.computer&&s.players[outcome.winner]?.computer?' computer-avatar':'');badge.style.setProperty('--winner-color',outcome.tie?'#04bfc8':colors[outcome.winner]);badge.setAttribute('aria-label',outcome.title);
 $('#resultScores').replaceChildren();for(let i=0;i<s.count;i++){const item=document.createElement('div');item.className='result-score'+(outcome.winners.includes(i)?' winner':'');item.style.setProperty('--color',colors[i]);const icon=document.createElement('span');icon.className='avatar'+(s.players[i]?.computer?' computer-avatar':'');icon.style.background=colors[i];const score=document.createElement('strong');score.textContent=s.scores[i];const name=document.createElement('small');name.textContent=playerName(i);item.append(icon,score,name);$('#resultScores').append(item);}
 $('#resultAgain').hidden=outcome.left;$('#resultAgain').disabled=!!room&&s.me!==0;$('#resultWait').textContent=outcome.left?'Return to the main menu to start a new match.':room&&s.me!==0?'Waiting for the host to start the next round.':'';
 if($('#settingsDialog').open)$('#settingsDialog').close();$('#resultDialog').showModal();
}
$('#resultAgain').onclick=()=>{if(busy)return;if(room)action('rematch');else{$('#resultDialog').close();$('#rematch').click();}};
$('#resultMenu').onclick=requestLeave;
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
