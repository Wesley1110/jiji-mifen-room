import * as THREE from 'three/webgpu';

export function createDrawerController(moving,pickTargets,knob,{travel=.95,contents='Chin starter toy pack',handleLabel='花朵握把'}={}){
 const duration=820,state={open:false,moving:false,extension:0,travel,contents};
 let from=0,target=0,start=0;
 function setOpen(open,time=performance.now()){
  if(state.open===open)return false;
  from=moving.position.z;target=open?travel:0;start=time;state.open=open;state.moving=true;
  return true;
 }
 function update(time){const t=THREE.MathUtils.clamp((time-start)/duration,0,1),s=t*t*(3-2*t);moving.position.z=THREE.MathUtils.lerp(from,target,s);state.extension=moving.position.z;state.moving=t<1&&Math.abs(target-moving.position.z)>.00001;}
 return {moving,pickTargets,knob,state,handleLabel,setOpen,toggle:(time)=>setOpen(!state.open,time),update};
}

export function bindDrawerInteraction({drawer,drawers=[drawer],scene,camera,canvas,onInteract}){
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),tip=document.getElementById('drawerHint');let down=null,last=0;
 const owners=new Map(drawers.flatMap(item=>item.pickTargets.map(mesh=>[mesh,item])));
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function hit(event){
  const rect=canvas.getBoundingClientRect(),locked=document.pointerLockElement===canvas;
  pointer.set(locked?0:(event.clientX-rect.left)/rect.width*2-1,locked?0:-(event.clientY-rect.top)/rect.height*2+1);
  scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
  const target=ray.intersectObjects([...owners.keys()].filter(visible),false)[0];if(!target)return null;
  const blockers=[];scene.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.sceneControlPick&&!o.userData.doorPick&&!o.userData.fiberCount&&!o.userData.isHand&&o.material?.visible!==false)blockers.push(o);});
  const obstruction=ray.intersectObjects(blockers,false)[0];
  if(obstruction && obstruction.distance<target.distance-.008)return null;
  return owners.get(target.object);
 }
 function show(value,event={}){
  canvas.dataset.drawerHover=value?'true':'';canvas.style.cursor=value||canvas.dataset.doorHover==='true'?'pointer':'';
  for(const item of drawers){
   if(item.highlightOnHover===false)continue;
   const material=item.knob.material;
   material.emissive.set(item===value?'#715435':'#000000');
   material.emissiveIntensity=item===value ? .15 : 0;
  }
  tip.hidden=!value;if(value){tip.textContent=value.hint??('點'+(value.handleLabel||'花朵握把')+(value.state.open?'關上抽屜':'打開抽屜'));tip.style.left=Math.max(8,Math.min(innerWidth-190,event.clientX+16))+'px';tip.style.top=Math.max(8,Math.min(innerHeight-60,event.clientY+18))+'px';}
 }
 function releasePress(now=performance.now()){
  down?.hit?.setPressed?.(false,now);
  down=null;
 }
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  releasePress();
  if(e.isPrimary===false)return;
  const owner=hit(e), now=performance.now();
  down={id:e.pointerId,x:e.clientX,y:e.clientY,time:now,hit:owner};
  owner?.setPressed?.(true,now);
 });
 canvas.addEventListener('pointermove',e=>{
  if(down&&down.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)releasePress();
  if(e.buttons||performance.now()-last<60)return;
  last=performance.now();show(hit(e),e);
 });
 canvas.addEventListener('pointerup',e=>{
  if(!down||e.pointerId!==down.id)return;
  const owner=down.hit;
  if(owner&&(owner.setPressed||performance.now()-down.time<700)&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&hit(e)===owner){
   owner.toggle();onInteract();show(false);
  }
  releasePress();
 });
 const clear=()=>{releasePress();show(false);};
 canvas.addEventListener('pointercancel',clear);canvas.addEventListener('pointerleave',clear);canvas.addEventListener('wheel',()=>show(false),{passive:true});
 document.addEventListener('pointerdown',()=>show(false));addEventListener('keydown',()=>show(false));addEventListener('blur',clear);
 return {hitTest:e=>Boolean(hit(e))};
}
