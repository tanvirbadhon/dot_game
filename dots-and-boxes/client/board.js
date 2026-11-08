let selectedDot=null,previousEdges=new Set(),previousBoxes=new Set(),boardRound='',dragging=false;
function canMove(){return s?.status==='playing'&&(!room||s.me===s.turn)&&(!s.computer||s.turn===0)&&!busy;}
function connectingLine(a,b){if(!a||!b||Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)return null;return a[0]===b[0]?`h-${a[0]}-${Math.min(a[1],b[1])}`:`v-${Math.min(a[0],b[0])}-${a[1]}`;}
function submitLine(key){if(!canMove()||Object.hasOwn(s.edges,key))return;const from=selectedDot?[...selectedDot]:null;selectedDot=null;clearSelection();if(room)action('move',{key,from,round:s.round});else applyLocalMove(key,from);}
function resetDragVisual(){for(const dot of $('#board').querySelectorAll('.dot')){dot.style.removeProperty('--drag-x');dot.style.removeProperty('--drag-y');}$('#board').querySelector('.drag-preview')?.remove();$('#board').querySelector('.drag-origin')?.remove();}
function clearSelection(){resetDragVisual();for(const dot of $('#board').querySelectorAll('.dot'))dot.classList.remove('selected','neighbor');}
function highlightSelection(){clearSelection();if(!selectedDot)return;for(const dot of $('#board').querySelectorAll('.dot')){const point=[+dot.dataset.row,+dot.dataset.col],key=connectingLine(selectedDot,point);dot.classList.toggle('selected',point[0]===selectedDot[0]&&point[1]===selectedDot[1]);dot.classList.toggle('neighbor',!!key&&!Object.hasOwn(s.edges,key));}}
function chooseDot(point){if(!canMove())return;const key=connectingLine(selectedDot,point);if(key&&!Object.hasOwn(s.edges,key)){submitLine(key);return;}selectedDot=point;highlightSelection();}
function drawBoard(){
 const board=$('#board'),round=`${room||'local'}-${s.round}-${s.cols}-${s.count}`;
 const initial=boardRound!==round||Object.keys(s.edges).length<previousEdges.size;
 if(initial){previousEdges=new Set();previousBoxes=new Set();}boardRound=round;selectedDot=null;dragging=false;
 board.replaceChildren();board.dataset.density=s.cols>=8?'dense':'standard';board.style.aspectRatio=s.cols+'/'+s.rows;board.style.setProperty('--turn-color',colors[s.turn]);board.style.setProperty('--edge-hit-width',`${Math.min(10,63/s.cols)}%`);board.style.setProperty('--edge-hit-height',`${Math.min(12,63/s.rows)}%`);board.style.setProperty('--dot-size',`${26/s.cols}%`);board.style.setProperty('--rail-size',`${23/s.cols}cqw`);
 const x=c=>5+c*90/s.cols,y=r=>5+r*90/s.rows,lastMove=Object.keys(s.edges).at(-1);
 for(const [k,owner]of Object.entries(s.boxes)){const [r,c]=k.split('-').map(Number),box=document.createElement('div');box.className='box'+(!initial&&!previousBoxes.has(k)?' captured':'');box.style.cssText=`left:${x(c)}%;top:${y(r)}%;width:${90/s.cols}%;height:${90/s.rows}%;--color:${colors[owner]}`;box.setAttribute('aria-label',`Box owned by ${playerName(owner)}`);board.append(box);}
 for(let r=0;r<=s.rows;r++)for(let c=0;c<=s.cols;c++){
 for(const t of ['h','v']){if(t==='h'&&c===s.cols||t==='v'&&r===s.rows)continue;const key=`${t}-${r}-${c}`,taken=Object.hasOwn(s.edges,key),line=document.createElement('button'),fresh=taken&&!initial&&!previousEdges.has(key);line.className=`edge ${t}${taken?' taken':''}${fresh?' newly-drawn':''}${key===lastMove?' last-move':''}`;if(key===s.lastStroke?.key&&s.lastStroke.reverse)line.classList.add('reverse-stroke');line.style.cssText=`left:${x(c)}%;top:${y(r)}%;${t==='h'?'width':'height'}:${90/(t==='h'?s.cols:s.rows)}%;--line-color:${taken?colors[s.edges[key]]:colors[s.turn]}`;line.setAttribute('aria-label',`${t==='h'?'Horizontal':'Vertical'} line row ${r+1}, column ${c+1}${taken?', claimed':''}`);line.onanimationend=e=>{if(e.animationName.startsWith('knob-'))line.classList.remove('newly-drawn');};if(key===lastMove)line.title='Most recent move';line.disabled=true;line.tabIndex=-1;line.setAttribute('aria-hidden','true');board.append(line);}
 const dot=document.createElement('button');dot.type='button';dot.className='dot';dot.dataset.row=r;dot.dataset.col=c;dot.style.cssText=`left:${x(c)}%;top:${y(r)}%`;dot.setAttribute('aria-label',`Dot row ${r+1}, column ${c+1}`);dot.disabled=s.status!=='playing'||!!room&&s.me!==s.turn||!!s.computer&&s.turn!==0;
 const incident=[`h-${r}-${c-1}`,`h-${r}-${c}`,`v-${r-1}-${c}`,`v-${r}-${c}`];if(!incident.some(k=>Object.hasOwn(s.edges,k)))dot.classList.add('open-dot');
 dot.onpointerdown=e=>{if(!canMove())return;e.preventDefault();chooseDot([r,c]);if(!selectedDot)return;dragging=true;dot.setPointerCapture(e.pointerId);};
 dot.onpointermove=e=>{if(!dragging||!selectedDot)return;const rect=board.getBoundingClientRect(),sx=rect.width*x(selectedDot[1])/100,sy=rect.height*y(selectedDot[0])/100,rawX=e.clientX-rect.left-sx,rawY=e.clientY-rect.top-sy;if(Math.hypot(rawX,rawY)<5){resetDragVisual();return;}const horizontal=Math.abs(rawX)>=Math.abs(rawY),target=[selectedDot[0]+(horizontal?0:Math.sign(rawY)),selectedDot[1]+(horizontal?Math.sign(rawX):0)],key=connectingLine(selectedDot,target);if(target[0]<0||target[0]>s.rows||target[1]<0||target[1]>s.cols||!key||Object.hasOwn(s.edges,key)){resetDragVisual();return;}const max=horizontal?rect.width*.9/s.cols:rect.height*.9/s.rows,dx=horizontal?Math.sign(rawX)*Math.min(Math.abs(rawX),max):0,dy=horizontal?0:Math.sign(rawY)*Math.min(Math.abs(rawY),max);dot.style.setProperty('--drag-x',dx+'px');dot.style.setProperty('--drag-y',dy+'px');let origin=board.querySelector('.drag-origin');if(!origin){origin=document.createElement('span');origin.className='dot drag-origin';origin.style.cssText=`left:${x(selectedDot[1])}%;top:${y(selectedDot[0])}%`;board.append(origin);}let preview=board.querySelector('.drag-preview');if(!preview){preview=document.createElement('span');preview.className='drag-preview';board.append(preview);}preview.style.cssText=`left:${sx}px;top:${sy}px;width:${Math.hypot(dx,dy)}px;transform:rotate(${Math.atan2(dy,dx)}rad)`;};
 dot.onpointerup=e=>{if(!dragging||!selectedDot)return;dragging=false;resetDragVisual();const rect=board.getBoundingClientRect(),px=(e.clientX-rect.left)/rect.width*100,py=(e.clientY-rect.top)/rect.height*100,c2=Math.round((px-5)*s.cols/90),r2=Math.round((py-5)*s.rows/90);if(Math.abs(px-x(c2))>31.5/s.cols||Math.abs(py-y(r2))>31.5/s.rows)return;const key=connectingLine(selectedDot,[r2,c2]);if(r2>=0&&r2<=s.rows&&c2>=0&&c2<=s.cols&&key&&!Object.hasOwn(s.edges,key))submitLine(key);};
 dot.onpointercancel=()=>{dragging=false;resetDragVisual();};dot.onclick=e=>{if(e.detail===0)chooseDot([r,c]);};board.append(dot);
 }
 previousEdges=new Set(Object.keys(s.edges));previousBoxes=new Set(Object.keys(s.boxes));
}
// Mouse, finger and pen input use non-overlapping nearest-dot cells.
function boardPointerInput(event){return ['mouse','touch','pen'].includes(event.pointerType);}
function nearestBoardDot(clientX,clientY,rect,cols,rows){
 if(!rect.width||!rect.height||clientX<rect.left||clientY<rect.top||clientX>rect.left+rect.width||clientY>rect.top+rect.height)return null;
 const col=Math.max(0,Math.min(cols,Math.round(((clientX-rect.left)/rect.width-.05)*cols/.9)));
 const row=Math.max(0,Math.min(rows,Math.round(((clientY-rect.top)/rect.height-.05)*rows/.9)));
 return [row,col];
}
let activeBoardPointer=null,boardPointerOrigin=null;
const pointerBoard=$('#board');
function stopBoardPointerEvent(event){event.preventDefault();event.stopImmediatePropagation();}
pointerBoard.addEventListener('pointerdown',event=>{
 if(!boardPointerInput(event))return;
 stopBoardPointerEvent(event);if(event.button!==undefined&&event.button!==0)return;if(activeBoardPointer!==null||!canMove())return;
 const point=nearestBoardDot(event.clientX,event.clientY,pointerBoard.getBoundingClientRect(),s.cols,s.rows);if(!point)return;
 chooseDot(point);if(!selectedDot)return;
 activeBoardPointer=event.pointerId;boardPointerOrigin=[...selectedDot];dragging=true;
 pointerBoard.setPointerCapture(event.pointerId);
},{capture:true,passive:false});
pointerBoard.addEventListener('pointermove',event=>{
 if(!boardPointerInput(event)||activeBoardPointer===null)return;
 stopBoardPointerEvent(event);if(event.pointerId!==activeBoardPointer||!selectedDot||!canMove())return;
 const dot=pointerBoard.querySelector('.dot[data-row="'+boardPointerOrigin[0]+'"][data-col="'+boardPointerOrigin[1]+'"]');
 if(dot?.onpointermove)dot.onpointermove(event);
},{capture:true,passive:false});
pointerBoard.addEventListener('pointerup',event=>{
 if(!boardPointerInput(event)||activeBoardPointer===null)return;
 stopBoardPointerEvent(event);if(event.pointerId!==activeBoardPointer)return;
 activeBoardPointer=null;boardPointerOrigin=null;dragging=false;resetDragVisual();
 if(pointerBoard.hasPointerCapture(event.pointerId))pointerBoard.releasePointerCapture(event.pointerId);
 if(!selectedDot||!canMove())return;
 const point=nearestBoardDot(event.clientX,event.clientY,pointerBoard.getBoundingClientRect(),s.cols,s.rows);
 const key=connectingLine(selectedDot,point);if(key&&!Object.hasOwn(s.edges,key))submitLine(key);
},{capture:true,passive:false});
function cancelBoardPointer(event){if(event.pointerId!==activeBoardPointer)return;activeBoardPointer=null;boardPointerOrigin=null;dragging=false;resetDragVisual();}
pointerBoard.addEventListener('pointercancel',cancelBoardPointer,{capture:true});
pointerBoard.addEventListener('lostpointercapture',cancelBoardPointer);
