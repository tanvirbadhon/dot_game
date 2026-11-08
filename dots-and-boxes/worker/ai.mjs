export function legalMoves(g){const keys=[];for(let r=0;r<=g.rows;r++)for(let c=0;c<=g.cols;c++){if(c<g.cols&&!Object.hasOwn(g.edges,`h-${r}-${c}`))keys.push(`h-${r}-${c}`);if(r<g.rows&&!Object.hasOwn(g.edges,`v-${r}-${c}`))keys.push(`v-${r}-${c}`);}return keys;}
export function chooseComputerMove(g,level='hard',random=Math.random){
 const legal=legalMoves(g);if(!legal.length||g.status!=='playing')return null;
 if(level==='easy')return legal[Math.min(legal.length-1,Math.floor(random()*legal.length))];
 const expert=level==='expert',keys=[],index=new Map(),adj=[],walls=new Uint8Array(g.cols*g.rows),used=[],bits=[];
 for(let r=0;r<=g.rows;r++)for(let c=0;c<=g.cols;c++)for(const t of ['h','v']){if(t==='h'&&c===g.cols||t==='v'&&r===g.rows)continue;const key=`${t}-${r}-${c}`;index.set(key,keys.length);keys.push(key);adj.push([]);used.push(Object.hasOwn(g.edges,key));bits.push(1n<<BigInt(keys.length-1));}
 for(let r=0;r<g.rows;r++)for(let c=0;c<g.cols;c++){const box=r*g.cols+c;for(const key of [`h-${r}-${c}`,`h-${r+1}-${c}`,`v-${r}-${c}`,`v-${r}-${c+1}`]){const i=index.get(key);adj[i].push(box);if(used[i])walls[box]++;}}
 let mask=used.reduce((m,t,i)=>t?m|bits[i]:m,0n),turn=g.turn,remaining=legal.length,nodes=0,aborted=false;
 const root=g.turn,scores=[...g.scores],limit=expert?75000:10000,deadline=Date.now()+(expert?150:55),cache=new Map();
 function rank(i){let value=0;for(const box of adj[i])value+=walls[box]===3?1000:walls[box]===2?-130:walls[box]===1?-9:2;return value;}
 function candidates(depth){const choices=[];for(let i=0;i<keys.length;i++)if(!used[i])choices.push({i,value:rank(i)});choices.sort((a,b)=>b.value-a.value);return remaining<=(expert?14:9)?choices:choices.slice(0,depth===1?(expert?17:12):(expert?12:7));}
 function apply(i){const player=turn;let gain=0;used[i]=true;mask|=bits[i];remaining--;for(const box of adj[i])if(++walls[box]===4)gain++;scores[player]+=gain;if(!gain)turn=(turn+1)%g.count;return {player,gain};}
 function undo(i,record){for(const box of adj[i])walls[box]--;scores[record.player]-=record.gain;turn=record.player;used[i]=false;mask&=~bits[i];remaining++;}
 function evaluate(){const rival=Math.max(...scores.filter((_,i)=>i!==root));let value=(scores[root]-rival)*1000;if(remaining){let pending=0;for(const count of walls)if(count===3)pending++;value+=(turn===root?1:-1)*pending*650;}return value;}
 function search(depth,alpha,beta){
  if(++nodes>limit||(nodes%128===0&&Date.now()>deadline)){aborted=true;return evaluate();}
  if(!depth||!remaining)return evaluate();
  const hash=mask+':'+turn+':'+scores.join(',')+':'+depth;if(cache.has(hash))return cache.get(hash);
  const initialAlpha=alpha,initialBeta=beta,maximize=turn===root;let best=maximize?-Infinity:Infinity,cut=false;
  for(const {i}of candidates(depth)){const record=apply(i),value=search(depth-1,alpha,beta);undo(i,record);if(aborted)return value;best=maximize?Math.max(best,value):Math.min(best,value);if(maximize)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(beta<=alpha){cut=true;break;}}
  if(!cut&&best>initialAlpha&&best<initialBeta)cache.set(hash,best);return best;
 }
 const ordered=candidates(1);let choice=ordered[0].i;
 // Replace a decision only after a complete search depth; no timeout bias.
 const target=remaining<=(expert?14:9)?remaining:(expert?7:4);
 for(let depth=1;depth<=target;depth++){
  let best=-Infinity,selected=choice;const roots=[...ordered].sort((a,b)=>(b.i===choice)-(a.i===choice)||b.value-a.value);
  for(const {i}of roots){const record=apply(i),value=search(depth-1,-Infinity,Infinity);undo(i,record);if(aborted)break;if(value>best){best=value;selected=i;}}
  if(aborted)break;choice=selected;
 }
 return keys[choice];
}
