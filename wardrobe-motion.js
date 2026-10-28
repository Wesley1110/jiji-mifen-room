// Kept independent of the renderer so reversing a partly open door can be
// verified without a GPU. Both leaves rotate outward about their real hinges.
export function createWardrobeMotion(duration=1050){
 const state={open:false,moving:false,amount:0,leftAngle:0,rightAngle:0};
 let from=0,target=0,start=0;
 function update(time){
  if(!Number.isFinite(time))return state;
  const t=Math.max(0,Math.min(1,(time-start)/duration)),s=t*t*(3-2*t);
  state.amount=from+(target-from)*s;
  state.leftAngle=-state.amount*Math.PI*108/180;
  state.rightAngle=state.amount*Math.PI*108/180;
  state.moving=t<1&&Math.abs(target-state.amount)>1e-7;
  return state;
 }
 function setOpen(open,time){
  if(!Number.isFinite(time)||state.open===Boolean(open))return false;
  update(time);from=state.amount;target=open?1:0;start=time;state.open=Boolean(open);state.moving=true;return true;
 }
 return {state,setOpen,update,toggle:time=>setOpen(!state.open,time)};
}
