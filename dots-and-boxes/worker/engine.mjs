export function boardRows(cols){return ({3:2,4:3,5:4,6:5,8:6,11:9})[cols];}
export function newGame(count=2,cols=5){return {count,cols,rows:boardRows(cols),players:[],edges:{},boxes:{},scores:Array(count).fill(0),turn:0,status:'waiting',round:1};}
export function winProgress(game){
 const total=game.cols*game.rows,target=Math.floor(total/2)+1,remaining=Math.max(0,total-game.scores.reduce((sum,score)=>sum+score,0));
 const winner=game.scores.findIndex((score,player)=>score>Math.max(...game.scores.filter((_,i)=>i!==player))+remaining);
 return {total,target,remaining,winner};
}
export function ordinalPlace(place){return place+({1:'st',2:'nd',3:'rd'}[place]||'th');}
export function playerStandings(game){
 const remaining=Math.max(0,game.cols*game.rows-game.scores.reduce((a,b)=>a+b,0));
 const forfeited=Number.isInteger(game.forfeited)?game.forfeited:game.status==='abandoned'?game.players.findIndex(p=>p.name===game.leftBy):-1;
 return game.scores.map((score,player)=>{
  const place=forfeited>=0?(player===forfeited?game.scores.length:1):1+game.scores.filter(other=>other>score).length;
  const tied=forfeited>=0?player!==forfeited&&game.scores.length>2:game.scores.filter(other=>other===score).length>1;
  const secured=forfeited>=0||remaining===0||game.scores.every((other,i)=>i===player||Math.abs(score-other)>remaining);
  return {player,score,place,tied,secured,label:ordinalPlace(place)};
 }).sort((a,b)=>a.place-b.place||b.score-a.score||a.player-b.player);
}
export function move(s,key,player,from){
 if(s.status!=='playing')throw Error('The game has not started.');
 if(player!==s.turn)throw Error('Wait for your turn.');
 const m=/^([hv])-(\d+)-(\d+)$/.exec(key||'');if(!m)throw Error('Invalid line.');
 const [,t,rs,cs]=m,r=+rs,c=+cs;
 if(r<0||c<0||r>(t==='h'?s.rows:s.rows-1)||c>(t==='h'?s.cols-1:s.cols))throw Error('Invalid line.');
 if(Object.hasOwn(s.edges,key))throw Error('That line is already taken.');
 const end=[r+(t==='v'?1:0),c+(t==='h'?1:0)];const reverse=Array.isArray(from)&&from.length===2&&from[0]===end[0]&&from[1]===end[1];s.lastStroke={key,reverse};s.edges[key]=player;let won=0;
 for(const [a,b]of(t==='h'?[[r-1,c],[r,c]]:[[r,c-1],[r,c]])){
 if(a<0||a>=s.rows||b<0||b>=s.cols)continue;
 if([`h-${a}-${b}`,`h-${a+1}-${b}`,`v-${a}-${b}`,`v-${a}-${b+1}`].every(k=>Object.hasOwn(s.edges,k))){s.boxes[`${a}-${b}`]=player;s.scores[player]++;won++;}}
 if(!won)s.turn=(s.turn+1)%s.count;
 if(Object.keys(s.boxes).length===s.cols*s.rows)s.status='finished';
 return won;
}
export function validatePlayerName(value){
 const name=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
 if(!name)return {error:'Please enter your name.'};
 if([...name].length>20)return {error:'Use a name with 20 characters or fewer.'};
 if(!/^[\p{L}\p{M}\p{N} .'-]+$/u.test(name)||!/[\p{L}\p{N}]/u.test(name))return {error:'Use letters, numbers, spaces, dots, apostrophes or hyphens.'};
 const mapped=name.toLowerCase().replace(/[0134578]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b'}[c]));
 const words=mapped.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean),compact=words.join('');
 const blocked=['fuck','fack','fuk','fuker','fucker','fucking','motherfucker','shit','bullshit','bitch','bastard','asshole','dick','cock','pussy','cunt','dhon','dhan','dhun','dhoin','sona','shona','choda','chuda','chudi','chudiya','chutia','chutiya','chodna','chodachudi','chodon','sala','shala','shalar','sali','shali','bal','baal','baler','boka','bokachoda','bokachuda','madarchod','madarchoda','maderchod','magi','magir','khanki','khankir','khankimagir','kutta','kutti','harami','haramjada','haramzada','gandu','gando','bhoda','voda','bhosda','bhosdike','lund','laura','lawra','চোদা','চুদি','চুদি্যা','ধোন','সোনা','শালা','শালি','বাল','মাগি','খানকি','হারামি','হারামজাদা','বোকাচোদা'];
 const squash=v=>v.replace(/(.)\1+/gu,'$1');const denied=new Set(blocked.flatMap(w=>[w,squash(w)]));
 if([...words,compact].some(w=>denied.has(w)||denied.has(squash(w))))return {error:'Please choose a respectful player name.'};
 return {name};
}
