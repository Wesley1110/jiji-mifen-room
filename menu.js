export function initMenu(){
 const dock=document.getElementById('roomDock'),size=document.getElementById('menuSize'),hide=document.getElementById('menuHide'),restore=document.getElementById('menuRestore');
 const key='jiji-room-menu-state';let state='full';
 function setState(next,save=true){
  state=['full','compact','hidden'].includes(next)?next:'full';
  document.body.dataset.menuState=state;dock.hidden=state==='hidden';restore.hidden=state!=='hidden';
  size.textContent=state==='compact'?'↗ 展開':'↙ 縮小';
  size.setAttribute('aria-expanded',String(state==='full'));
  restore.setAttribute('aria-expanded',String(state!=='hidden'));
  if(state==='hidden'){document.getElementById('help').hidden=true;document.getElementById('helpToggle').setAttribute('aria-expanded','false');}
  if(save){try{localStorage.setItem(key,state);}catch{/* Storage can be disabled. */}}
 }
 size.onclick=()=>setState(state==='compact'?'full':'compact');
 hide.onclick=()=>{setState('hidden');restore.focus({preventScroll:true});};
 restore.onclick=()=>{setState('full');size.focus({preventScroll:true});};
 addEventListener('keydown',e=>{
  if(e.code!=='KeyM'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  e.preventDefault();setState(state==='hidden'?'full':'hidden');
  if(state==='hidden')document.querySelector('#room canvas')?.focus({preventScroll:true});else size.focus({preventScroll:true});
 });
 try{setState(localStorage.getItem(key)||'full',false);}catch{setState('full',false);}
 return {get state(){return state;}};
}
