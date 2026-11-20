import {MathUtils} from 'three/webgpu';

// Travel along the drawer's vertical axis keeps the sewn shape and the pile together.
const TRAVEL = .0095;
const PRESS_MS = 170;
const MIN_CONTACT_MS = 210;
const RELEASE_MS = 320;

export function createCarrotCatchPress(carrot) {
  const restY=carrot.position.y;
  let start=null, releaseAt=0, from=0, applied=0, peakPending=false;

  function amountAt(now) {
    if(start===null) return 0;
    if(now>=releaseAt) return 1-MathUtils.smoothstep(now,releaseAt,releaseAt+RELEASE_MS);
    return from+(1-from)*MathUtils.smoothstep(now,start,start+PRESS_MS);
  }
  function setPressed(down,now=performance.now()) {
    if(down && releaseAt!==Infinity) {
      from=amountAt(now);
      start=now;
      releaseAt=Infinity;
      peakPending=false;
    } else if(!down && releaseAt===Infinity) {
      releaseAt=Math.max(now,start+MIN_CONTACT_MS);
    }
  }
  function tap(now) {
    setPressed(true,now);
    setPressed(false,now);
    peakPending=applied<.95;
  }
  function update(now) {
    // A quick click can finish before the next rendered frame.
    if(peakPending && now>=start+PRESS_MS) {
      if(now<releaseAt+RELEASE_MS) releaseAt=Math.max(releaseAt,now+55);
      peakPending=false;
    }
    applied=amountAt(now);
    carrot.position.y=restY-TRAVEL*applied;
    if(now>=releaseAt+RELEASE_MS) start=null;
  }
  return {setPressed,tap,update};
}
