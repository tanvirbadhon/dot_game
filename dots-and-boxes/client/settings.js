function refreshSettings(){const guest=!!room&&s?.me!==0,ended=s?.status==='abandoned'||s?.finishReason==='opponent-left';$('#restartGame').disabled=guest||ended||s?.status==='waiting';$('#restartHint').textContent=guest?'Only the room host can restart the game.':ended?'This room has ended. Leave to start a new game.':s?.status==='waiting'?'Start the game once everyone has joined.':'Start this board again with the same players.';}
$('#settingsButton').onclick=()=>{refreshSettings();clearTimeout(computerTimer);$('#settingsDialog').showModal();};
$('#closeSettings').onclick=()=>$('#settingsDialog').close();
$('#settingsDialog').onclick=e=>{if(e.target===$('#settingsDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
$('#settingsDialog').onclose=()=>{if(!$('#game').hidden&&!$('#leaveConfirm').open)scheduleComputer();};
$('#restartGame').onclick=async()=>{if(room){await action('restart');$('#settingsDialog').close();}else{$('#settingsDialog').close();$('#rematch').click();}};
function requestLeave(){if($('#game').hidden)return;if(['finished','abandoned'].includes(s?.status)){return exitMatch();}clearTimeout(computerTimer);$('#leaveWarning').textContent=room?'Leaving will end the match for the other players. This game will not be saved.':'Leaving deletes this saved match. Refreshing the page keeps it for up to 30 minutes.';$('#leaveConfirm').showModal();}
$('#leaveGame').onclick=requestLeave;
$('#stayGame').onclick=()=>$('#leaveConfirm').close();
$('#leaveConfirm').onclose=()=>{if(!$('#game').hidden&&!$('#settingsDialog').open)scheduleComputer();};
async function exitMatch(){if(busy)return;const wasOnline=!!room;if(!wasOnline)clearComputerSave();$('#confirmLeave').disabled=true;try{if(wasOnline){busy=true;await request('leave',{code:room});}$('#leaveConfirm').close();$('#settingsDialog').close();if($('#resultDialog').open)$('#resultDialog').close();returnToMenu();setMode(wasOnline);notify(wasOnline?'You left the room.':'You left the game.');}catch(e){notify(e.message);}finally{busy=false;$('#confirmLeave').disabled=false;}}
$('#confirmLeave').onclick=exitMatch;
$('.brand').onclick=e=>{if(!$('#game').hidden){e.preventDefault();requestLeave();}};
try{sessionStorage.removeItem('dots-room');}catch{}
$('#qualityToggle').onclick=()=>{const reduced=document.body.classList.toggle('low-motion');$('#qualityToggle').textContent=reduced?'Without animation':'With animation';$('#qualityToggle').setAttribute('aria-pressed',String(!reduced));try{writeGameStorage(localStorage,'dots-animations',String(!reduced));}catch{}};
try{if(readGameStorage(localStorage,'dots-animations')==='false'){$('#qualityToggle').click();}}catch{}

$('#shadowToggle').onclick=()=>{const flat=document.body.classList.toggle('no-shadows');$('#shadowToggle').textContent=flat?'Without shadow':'With shadow';$('#shadowToggle').setAttribute('aria-pressed',String(!flat));try{writeGameStorage(localStorage,'dots-shadows',String(!flat));}catch{}};
try{if(readGameStorage(localStorage,'dots-shadows')==='false')$('#shadowToggle').click();}catch{}

/* Refresh preserves the online seat; explicit Leave game is the only leave request. */

