/* AI */
let computerTimer=null;
/* SOUND */
function scheduleComputer(){clearTimeout(computerTimer);if(room||!s?.computer||s.status!=='playing'||s.turn===0||$('#leaveConfirm').open||$('#settingsDialog').open||$('#game').hidden)return;const current=s;computerTimer=setTimeout(()=>{if(s!==current||room||$('#game').hidden||s.status!=='playing'||s.turn===0)return;const key=chooseComputerMove(s,s.difficulty);if(key)applyLocalMove(key);},650);}
function applyLocalMove(key,from){const won=move(s,key,s.turn,from);render();if(won&&s.turn===0)notify('Box closed. Take another turn!');}
function setTheme(value){const palettes={wood:['#ff3264','#32a5cc','#43b65b','#e5b825'],classic:['#2b86a8','#be2345','#338b47','#c29b00'],dark:['#ffbd00','#04c8e5','#ef4de5','#a5e000'],sunset:['#963382','#ff3c87','#ff7900','#ffd329']};colors.splice(0,4,...(palettes[value]||palettes.wood));colors.forEach((color,i)=>document.body.style.setProperty('--p'+i,color));document.body.dataset.theme=value;updatePlayerPreview();if(s&&!$('#game').hidden){renderKey='';render();}try{writeGameStorage(localStorage,'dots-theme',value);}catch{}}
$('#theme').onchange=e=>setTheme(e.target.value);
try{const theme=readGameStorage(localStorage,'dots-theme');if(['wood','classic','dark','sunset','slate','paper'].includes(theme)){const selected=theme==='slate'?'dark':theme==='paper'?'classic':theme;$('#theme').value=selected;setTheme(selected);}}catch{}

if(!document.body.dataset.theme)setTheme('wood');
