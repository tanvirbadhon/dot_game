const savedGameCard=document.createElement('div');savedGameCard.className='saved-game-card';savedGameCard.hidden=true;
savedGameCard.innerHTML='<div><strong>Pick up where you left off</strong><p id="savedGameDetails"></p></div><button id="resumeComputer" type="button">Continue saved game <span aria-hidden="true">→</span></button><small>Saved on this device. Expires after 30 minutes without a move.</small>';
$('.mode').after(savedGameCard);
function clearComputerSave(){for(const storage of seatStores()){try{storage.removeItem('dots-computer-save');}catch{}}savedGameCard.hidden=true;}
function saveComputerMatch(){
 if(room||!s?.computer)return;if(s.status!=='playing'){clearComputerSave();return;}
 const value=JSON.stringify({game:s,theme:$('#theme').value,until:Date.now()+GAME_DATA_TTL});
 for(const storage of seatStores()){try{writeGameStorage(storage,'dots-computer-save',value);}catch{}}
}
function readComputerSave(){
 for(const storage of seatStores()){try{
  const value=readGameStorage(storage,'dots-computer-save');if(!value)continue;
  const saved=JSON.parse(value),game=saved.game;
  if(saved.until<=Date.now()||!game?.computer||game.status!=='playing'||![2,3,4].includes(game.count)||![3,5,8,11].includes(game.cols)||!['easy','hard','expert'].includes(game.difficulty))throw Error('Invalid save');
  // Replay the saved edges through the real rules rather than trusting scores.
  const restored=newGame(game.count,game.cols);restored.computer=true;restored.status='playing';restored.difficulty=game.difficulty;
  restored.players=Array.from({length:game.count},(_,i)=>({name:i===0?'You':game.count===2?'Computer':`Computer ${i}`,computer:i>0}));
  for(const [key,owner]of Object.entries(game.edges))move(restored,key,owner);
  if(restored.status!=='playing')throw Error('Finished save');
  restored.round=Number.isInteger(game.round)&&game.round>0?game.round:1;
  return {game:restored,theme:['wood','classic','dark','sunset'].includes(saved.theme)?saved.theme:'wood'};
 }catch{try{storage.removeItem('dots-computer-save');}catch{}}}return null;
}
function refreshSavedGame(){
 const saved=readComputerSave();savedGameCard.hidden=online||!saved;
 if(saved)$('#savedGameDetails').textContent=`${saved.game.cols} × ${saved.game.rows} · ${saved.game.difficulty[0].toUpperCase()+saved.game.difficulty.slice(1)} · ${Object.keys(saved.game.boxes).length} boxes claimed`;
}
$('#resumeComputer').onclick=()=>{
 const saved=readComputerSave();if(!saved){clearComputerSave();notify('This saved game has expired. Start a new match.');return;}
 setMode(false);room=null;secret=null;
 for(const [id,value]of Object.entries({count:saved.game.count,size:saved.game.cols,difficulty:saved.game.difficulty,theme:saved.theme})){$('#'+id).value=value;$('#'+id).dispatchEvent(new Event('change',{bubbles:true}));}
 s=saved.game;showGame();
};
refreshSavedGame();setInterval(refreshSavedGame,15000);
window.addEventListener('pageshow',refreshSavedGame);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSavedGame();});
