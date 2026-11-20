// Coordinate the hinged floor with the drawer's existing slide. Closing the
// outer drawer queues a slide only after the panel has landed on its ledge.
export function interlockDrawer(slide) {
  const lid={open:false,amount:0,moving:false};
  let from=0, start=0, duration=0, queuedClose=false;

  function aimLid(open, now) {
    if (lid.open===open) return false;
    lid.open=open;
    from=lid.amount;
    start=now;
    duration=(open ? 760 : 620)*Math.abs(Number(open)-from);
    lid.moving=duration>0;
    return true;
  }
  function update(now) {
    if (lid.moving) {
      const t=Math.max(0,Math.min(1,(now-start)/duration));
      lid.amount=from+(Number(lid.open)-from)*t*t*(3-2*t);
      if(t===1) { lid.amount=Number(lid.open); lid.moving=false; }
    }
    if(queuedClose && !lid.moving && !lid.open) {
      queuedClose=false;
      slide.setOpen(false,start+duration);
    }
    slide.update(now);
  }
  function canLift() {
    return !queuedClose && slide.state.open && !slide.state.moving &&
      Math.abs(slide.state.extension-slide.state.travel)<.00001;
  }
  function toggleLid(now=performance.now()) {
    update(now);
    return canLift() && aimLid(!lid.open,now);
  }
  function wantsDrawerOpen() { return slide.state.open && !queuedClose; }
  function setOpen(open,now=performance.now()) {
    update(now);
    if(open===wantsDrawerOpen()) return false;
    if(!open && (lid.open || lid.moving)) {
      aimLid(false,now);
      queuedClose=true;
      return true;
    }
    queuedClose=false;
    slide.setOpen(open,now);
    return true;
  }
  return {lid,canLift,toggleLid,setOpen,update,wantsDrawerOpen,
    toggle:now=>setOpen(!wantsDrawerOpen(),now)};
}
