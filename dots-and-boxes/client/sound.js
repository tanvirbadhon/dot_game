// One audio mixer for computer moves and synchronized online moves.
let audioContext=null,audioMaster=null,audioReady=null,audioSources=new Set(),soundSnapshot=null;
let soundEnabled=true,soundVolume=.65,lastSoundVolume=.65;
try{const savedSound=JSON.parse(readGameStorage(localStorage,'dots-sound'));if(savedSound){soundEnabled=savedSound.enabled!==false;if(Number.isFinite(savedSound.volume))soundVolume=Math.max(0,Math.min(1,savedSound.volume));if(soundVolume>0)lastSoundVolume=soundVolume;}}catch{}
function updateSoundControls(){for(const id of ['sound','soundMenu']){const button=$('#'+id);if(!button)continue;button.textContent=soundEnabled&&soundVolume>0?'♪ Sound on':'♪ Sound off';button.setAttribute('aria-pressed',String(soundEnabled&&soundVolume>0));button.dataset.state=soundEnabled&&soundVolume>0?'ON':'OFF';button.title=soundEnabled?'Mute game sounds':'Enable game sounds';}$('#volume').value=Math.round(soundVolume*100);$('#volumeValue').textContent=Math.round(soundVolume*100)+'%';$('#volume').style.setProperty('--volume-fill',Math.round(soundVolume*100)+'%');}
function saveSoundSettings(){try{writeGameStorage(localStorage,'dots-sound',JSON.stringify({enabled:soundEnabled,volume:soundVolume}));}catch{}}
function stopSounds(){for(const source of audioSources){try{source.stop();}catch{}}audioSources.clear();}
function setMixerVolume(){if(!audioContext||!audioMaster)return;audioMaster.gain.cancelScheduledValues(audioContext.currentTime);audioMaster.gain.setTargetAtTime(soundEnabled?soundVolume:0,audioContext.currentTime,.015);}
function unlockAudio(fromGesture=false){
 if(!soundEnabled||soundVolume<=0)return Promise.resolve(false);
 try{
 // Safari can retain an interrupted mixer after a call or screen lock.
 if(audioContext&&(audioContext.state==='closed'||fromGesture&&audioContext.state==='interrupted')){stopSounds();try{audioContext.close()?.catch(()=>{});}catch{}audioContext=null;audioMaster=null;audioReady=null;}
 if(!audioContext){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return Promise.resolve(false);if(typeof navigator!=='undefined'&&navigator.audioSession){try{navigator.audioSession.type='playback';}catch{}}audioContext=new Context({latencyHint:'interactive'});audioMaster=audioContext.createGain();audioMaster.gain.value=soundVolume;const limiter=audioContext.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=14;limiter.ratio.value=6;audioMaster.connect(limiter);limiter.connect(audioContext.destination);}
 if(audioContext.state==='running')return Promise.resolve(true);
 // Resume and start a silent buffer synchronously inside the tap, before awaits.
 if(fromGesture||!audioReady){const mixer=audioContext;const resumed=mixer.resume();if(fromGesture){const silent=mixer.createBufferSource();silent.buffer=mixer.createBuffer(1,1,mixer.sampleRate);silent.connect(mixer.destination);silent.onended=()=>silent.disconnect();silent.start(0);}
 let timeout;const attempt=Promise.race([Promise.resolve(resumed).then(()=>mixer.state==='running'),new Promise(resolve=>{timeout=setTimeout(()=>resolve(false),1200);})]).catch(()=>false).finally(()=>{clearTimeout(timeout);if(audioReady===attempt)audioReady=null;});audioReady=attempt;}
 return audioReady;
 }catch{return Promise.resolve(false);}
}
function trackSound(source){audioSources.add(source);source.onended=()=>{audioSources.delete(source);source.disconnect();};}
function tone(frequency,start,duration=.16,volume=.16,type='sine'){
 const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(audioMaster);trackSound(osc);osc.onended=()=>{audioSources.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.02);
}
function woodenTap(start){
 const duration=.075,buffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*duration),audioContext.sampleRate),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(audioContext.sampleRate*.014));
 const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.65;gain.gain.value=.45;source.connect(filter);filter.connect(gain);gain.connect(audioMaster);trackSound(source);source.onended=()=>{audioSources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(start);tone(380,start,.075,.19,'triangle');
}
async function playSound(kind='line'){
 if(!soundEnabled||soundVolume<=0||document.hidden)return;
 const ready=await unlockAudio();if(!ready||!soundEnabled||soundVolume<=0||document.hidden)return;
 const now=audioContext.currentTime+.012;
 if(kind==='line'){woodenTap(now);return;}
 if(kind==='box'){woodenTap(now);tone(659.25,now+.04,.23,.2);tone(880,now+.13,.3,.17);return;}
 if(kind==='start'){tone(523.25,now,.16,.14);tone(783.99,now+.1,.25,.16);return;}
 if(kind==='turn'){tone(783.99,now+.1,.14,.075);return;}
 const notes=kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='loss'?[392,329.63,261.63]:[523.25,659.25,523.25];
 notes.forEach((frequency,i)=>tone(frequency,now+i*.12,i===notes.length-1?.5:.22,.17));
}
function soundState(game){return {room:room||'computer',round:game.round,status:game.status,lines:Object.keys(game.edges).length,boxes:Object.keys(game.boxes).length,resultWinners:game.resultWinners,scores:[...game.scores],turn:game.turn,me:room?game.me:0};}
function soundEvent(before,after){
 if(!before||before.room!==after.room)return null;
 if(after.round!==before.round||after.lines<before.lines)return after.status==='playing'?'start':null;
 if(after.status==='finished'&&before.status!=='finished'){if(after.resultWinners)return after.resultWinners.includes(after.me)?'win':'loss';const high=Math.max(...after.scores),winners=after.scores.filter(v=>v===high).length;return winners>1?'tie':after.scores[after.me]===high?'win':'loss';}
 if(before.status==='waiting'&&after.status==='playing')return 'start';
 if(after.boxes>before.boxes)return 'box';
 if(after.lines>before.lines)return 'line';
 return null;
}
function syncGameSound(){const next=soundState(s),event=soundEvent(soundSnapshot,next);soundSnapshot=next;if(event)playSound(event);}
async function toggleSound(){soundEnabled=!(soundEnabled&&soundVolume>0);if(soundEnabled&&soundVolume===0)soundVolume=lastSoundVolume;setMixerVolume();if(!soundEnabled)stopSounds();updateSoundControls();saveSoundSettings();if(soundEnabled){const ready=await unlockAudio(true);if(ready)await playSound('start');else notify('Your browser could not start audio. Try enabling sound again.');}}
$('#sound').onclick=toggleSound;$('#soundMenu').onclick=toggleSound;
$('#volume').oninput=e=>{soundVolume=+e.target.value/100;if(soundVolume>0){lastSoundVolume=soundVolume;soundEnabled=true;}else{soundEnabled=false;stopSounds();}setMixerVolume();updateSoundControls();saveSoundSettings();unlockAudio();};
$('#volume').onchange=()=>playSound('line');
// Unlock in the actual user gesture, before an asynchronous room request.
for(const event of ['pointerdown','pointerup','touchend','click'])document.addEventListener(event,()=>{unlockAudio(true);},{capture:true,passive:true});
document.addEventListener('keydown',()=>{unlockAudio(true);},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSounds();else if(audioContext&&soundEnabled)unlockAudio();});
updateSoundControls();

