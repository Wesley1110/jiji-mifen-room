// A real sliding drawer with continuous reversal. The soft contents expand
// only after clearing the cabinet rail, and compress again before re-entry.
export const WARDROBE_DRAWER_TRAVEL=1.22;
export const smoothStep=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
export function drawerPuff(amount,minZ){
 const clearance=(.705-minZ)/WARDROBE_DRAWER_TRAVEL;
 return smoothStep((amount-clearance)/Math.max(.02,1-clearance));
}
export function createWardrobeDrawerMotion(duration=1200){
 const state={open:false,moving:false,amount:0,extension:0,travel:WARDROBE_DRAWER_TRAVEL};
 let from=0,target=0,start=0;
 function update(time){
  if(!Number.isFinite(time))return state;
  const t=Math.max(0,Math.min(1,(time-start)/duration));
  state.amount=from+(target-from)*smoothStep(t);
  state.extension=state.amount*state.travel;
  state.moving=t<1&&Math.abs(target-state.amount)>1e-7;
  return state;
 }
 function setOpen(open,time){
  if(!Number.isFinite(time)||state.open===Boolean(open))return false;
  update(time);from=state.amount;target=open?1:0;start=time;state.open=Boolean(open);state.moving=true;return true;
 }
 return {state,update,setOpen,toggle:time=>setOpen(!state.open,time)};
}
