const GAME_DATA_TTL=30*60*1000;
function readGameStorage(storage,key){
 try{const raw=storage.getItem(key);if(raw==null)return null;const entry=JSON.parse(raw);
  if(entry&&typeof entry.value==='string'&&Number.isFinite(entry.expiresAt)&&entry.expiresAt>Date.now()&&entry.expiresAt<=Date.now()+GAME_DATA_TTL)return entry.value;
  // Previously issued online seats already carry a bounded expiration.
  if(key==='dots-online-seat'&&entry?.until>Date.now()&&entry.until<=Date.now()+GAME_DATA_TTL)return raw;
  storage.removeItem(key);
 }catch{try{storage.removeItem(key);}catch{}}return null;
}
function writeGameStorage(storage,key,value){storage.setItem(key,JSON.stringify({value:String(value),expiresAt:Date.now()+GAME_DATA_TTL}));}
function cleanupGameStorage(){
 for(const kind of ['localStorage','sessionStorage']){try{const storage=window[kind];for(const key of Object.keys(storage))if(key.startsWith('dots-'))readGameStorage(storage,key);}catch{}}
}
cleanupGameStorage();setInterval(cleanupGameStorage,15000);
window.addEventListener('pageshow',cleanupGameStorage);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)cleanupGameStorage();});
