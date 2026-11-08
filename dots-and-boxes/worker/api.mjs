import {newGame,move,validatePlayerName} from './engine.mjs';
const json=(v,status=200)=>Response.json({...v,serverNow:Date.now()},{status,headers:{'Cache-Control':'no-store'}});
const hash=async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const ROOM_TTL=30*60*1000;
let lastRoomCleanup=0;
async function cleanupRooms(env,now){if(now-lastRoomCleanup<60000)return;lastRoomCleanup=now;await env.DB.prepare('UPDATE rooms SET expires=? WHERE expires>?').bind(now+ROOM_TTL,now+ROOM_TTL).run();await env.DB.prepare('DELETE FROM rooms WHERE expires<=?').bind(now).run();lastRoomCleanup=now;}
const token=()=>crypto.randomUUID()+crypto.randomUUID();
function view(s,me){return {...s,me,players:s.players.map(({name})=>({name}))};}
export async function api(req,env,ctx){
 try{
 const u=new URL(req.url);if(req.method!=='GET'&&req.method!=='POST')return json({error:'Method not allowed'},405);
 if(req.method==='POST'&&req.headers.get('origin')&&req.headers.get('origin')!==u.origin&&!['https://dotgame.web.app','https://dotgame.firebaseapp.com'].includes(req.headers.get('origin')))return json({error:'Invalid origin'},403);
 if(+(req.headers.get('content-length')||0)>2048)return json({error:'Request too large'},413);
 // Wake the database while a player fills the online setup, without touching rooms.
 if(u.pathname==='/api/ready'&&req.method==='GET'){await env.DB.prepare('SELECT 1 AS ready').bind().first();return json({ready:true});}
 const b=req.method==='POST'?await req.json():{};
 const now=Date.now();if(ctx?.waitUntil)ctx.waitUntil(cleanupRooms(env,now).catch(e=>{lastRoomCleanup=0;console.error('Room cleanup:',e.message);}));else await cleanupRooms(env,now);
 let name;const checkedName=()=>{const result=validatePlayerName(b.name);if(result.error)throw Error(result.error);return result.name;};
 if(u.pathname==='/api/create'&&req.method==='POST'){
 const count=Number(b.count),cols=Number(b.cols);if(![2,3,4].includes(count)||![3,4,5,6,8,11].includes(cols))throw Error('Choose 2, 3, or 4 players and a board size.');
 name=checkedName();const secret=token(),s=newGame(count,cols);s.players.push({name,hash:await hash(secret)});
 for(let i=0;i<5;i++){const bytes=crypto.getRandomValues(new Uint8Array(6));const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(bytes,x=>chars[x%chars.length]).join('');
 try{await env.DB.prepare('INSERT INTO rooms (code,state,version,expires) VALUES (?,?,0,?)').bind(code,JSON.stringify(s),now+ROOM_TTL).run();return json({code,token:secret,state:view(s,0)});}catch(e){if(!String(e).includes('UNIQUE'))throw e;}}
 throw Error('Please try creating a room again.');}
 const code=String(b.code||u.searchParams.get('code')||'').toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Enter a valid six-character room code.');
 const row=await env.DB.prepare('SELECT state,version,expires FROM rooms WHERE code=?').bind(code).first();if(!row||row.expires<=now){if(row)await env.DB.prepare('DELETE FROM rooms WHERE code=? AND expires<=?').bind(code,now).run();if(u.pathname==='/api/leave'&&req.method==='POST')return json({left:true});return json({error:'Room expired after 30 minutes of inactivity. Create a new room.'},404);}
 let s=JSON.parse(row.state),secret=req.headers.get('authorization')?.replace(/^Bearer /,''),me=-1;
 if(secret){const h=await hash(secret);me=s.players.findIndex(p=>p.hash===h);}
 if(me>=0&&s.status==='playing'){
 if(!s.turnDeadline){s.turnDeadline=now+60000;const init=await env.DB.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),code,row.version).run();if(!init.meta.changes)return json({error:'The room just changed. Please try again.'},409);row.version++;}
 if(now>=s.turnDeadline){s.status='finished';s.finishReason='timeout';s.forfeited=s.turn;s.resultWinners=s.players.map((_,i)=>i).filter(i=>i!==s.turn);const ended=await env.DB.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),code,row.version).run();if(!ended.meta.changes)return json({error:'The room just changed. Please try again.'},409);row.version++;if(u.pathname==='/api/move')return json({code,state:view(s,me)});}
 }
 if(u.pathname==='/api/state'&&req.method==='GET'){if(me<0)return json({error:'Rejoin this room to play.'},403);return json({code,state:view(s,me)});}
 let issued;
 if(u.pathname==='/api/join'&&req.method==='POST'){
 if(me<0){name=checkedName();if(s.status!=='waiting')throw Error('This game has already started.');if(s.players.length>=s.count)throw Error('This room is full.');issued=token();s.players.push({name,hash:await hash(issued)});me=s.players.length-1;}
 }else{
 if(me<0)return json({error:'Join the room first.'},403);
 if(u.pathname==='/api/start'&&req.method==='POST'){if(me!==0)throw Error('Only the host can start.');if(s.status!=='waiting')throw Error('The game has already started.');if(s.players.length!==s.count)throw Error('Wait for all players to join.');s.status='playing';s.turnDeadline=now+60000;}
 else if(u.pathname==='/api/move'&&req.method==='POST'){if(b.round!==s.round)throw Error('The board has changed. Try again.');move(s,b.key,me,b.from);s.turnDeadline=now+60000;}
 else if(u.pathname==='/api/restart'&&req.method==='POST'){if(me!==0)throw Error('Only the host can restart.');if(s.finishReason==='opponent-left'||!['playing','finished'].includes(s.status))throw Error('This game cannot be restarted.');const old=s;s=newGame(old.count,old.cols);s.players=old.players;s.status='playing';s.turnDeadline=now+60000;s.round=old.round+1;}
 else if(u.pathname==='/api/leave'&&req.method==='POST'){if(s.status==='waiting'){s.players.splice(me,1);}else if(s.status==='playing'){s.status='finished';s.finishReason='opponent-left';s.leftBy=s.players[me].name;s.forfeited=me;s.resultWinners=s.players.map((_,i)=>i).filter(i=>i!==me);}}
 else if(u.pathname==='/api/rematch'&&req.method==='POST'){if(me!==0)throw Error('Only the host can restart.');if(s.status!=='finished')throw Error('Finish this round first.');if(s.finishReason==='opponent-left')throw Error('A player left. Create a new room to play again.');const old=s;s=newGame(old.count,old.cols);s.players=old.players;s.status='playing';s.turnDeadline=now+60000;s.round=old.round+1;}
 else return json({error:'Not found'},404);
 }
 const updated=await env.DB.prepare('UPDATE rooms SET state=?,expires=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(s),now+ROOM_TTL,code,row.version).run();
 if(!updated.meta.changes)return json({error:'The room just changed. Please try again.'},409);
 return json({code,...(u.pathname==='/api/leave'?{left:true}:{}),...(issued?{token:issued}:{}),state:view(s,me)});
 }catch(e){console.error('Room request:',e.message);return json({error:String(e.message).includes('D1')?'Room service is temporarily unavailable. Please retry.':e.message||'Please try again.'},400);}
}
