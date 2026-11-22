// Coordinate the hinged floor with the drawer's existing slide. Closing the
// outer drawer queues a slide only after the panel has landed on its ledge.
function hinge(openMs,closeMs) {
  const state={open:false,amount:0,moving:false};
  let from=0,start=0,duration=0;
  function aim(open, now) {
    if (state.open===open) return false;
    state.open=open;
    from=state.amount;
    start=now;
    duration=(open ? openMs : closeMs)*Math.abs(Number(open)-from);
    state.moving=duration>0;
    return true;
  }
  function update(now) {
    if (state.moving) {
      const t=Math.max(0,Math.min(1,(now-start)/duration));
      state.amount=from+(Number(state.open)-from)*t*t*(3-2*t);
      if(t===1) { state.amount=Number(state.open); state.moving=false; }
    }
  }
  return {state,aim,update};
}

export function interlockDrawer(slide) {
  const panel=hinge(760,620), cover=hinge(820,640);
  const lid=panel.state, book=cover.state;
  let queuedClose=false, requestedLid=false;
  function update(now) {
    cover.update(now);
    if(!book.open && !book.moving) panel.aim(requestedLid,now);
    panel.update(now);
    if(queuedClose && !lid.moving && !lid.open && !book.moving) {
      queuedClose=false;
      slide.setOpen(false,now);
    }
    slide.update(now);
  }
  function canLift() {
    return !queuedClose && slide.state.open && !slide.state.moving &&
      Math.abs(slide.state.extension-slide.state.travel)<.00001;
  }
  function toggleLid(now=performance.now()) {
    update(now);
    if(!canLift()) return false;
    requestedLid=!requestedLid;
    if(!requestedLid) cover.aim(false,now);
    update(now);
    return true;
  }
  function canRead() { return canLift() && requestedLid && lid.amount===1; }
  function toggleBook(now=performance.now()) {
    update(now);
    return canRead() && cover.aim(!book.open,now);
  }
  function wantsDrawerOpen() { return slide.state.open && !queuedClose; }
  function setOpen(open,now=performance.now()) {
    update(now);
    if(open===wantsDrawerOpen()) return false;
    if(!open && (lid.open || lid.moving)) {
      requestedLid=false;
      cover.aim(false,now);
      queuedClose=true;
      update(now);
      return true;
    }
    queuedClose=false;
    slide.setOpen(open,now);
    return true;
  }
  return {lid,book,canLift,canRead,toggleBook,toggleLid,setOpen,update,wantsDrawerOpen,
    toggle:now=>setOpen(!wantsDrawerOpen(),now)};
}
