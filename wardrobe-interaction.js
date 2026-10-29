import * as THREE from 'three/webgpu';
import {createWardrobeMotion} from './wardrobe-motion.js';
import {createWardrobeDrawerMotion} from './wardrobe-storage-motion.js?revision=bunny-wardrobe-5';

export function createWardrobeController(root,pivots,pickTargets,{drawer,miniCarrots}={}){
 const motion=createWardrobeMotion(),slide=createWardrobeDrawerMotion();
 return {root,pickTargets,state:motion.state,drawerState:slide.state,
  setOpen:(open,time=performance.now())=>motion.setOpen(open,time),
  toggle:(time=performance.now())=>motion.toggle(time),
  setDrawerOpen:(open,time=performance.now())=>slide.setOpen(open,time),
  toggleDrawer:(time=performance.now())=>slide.toggle(time),
  update(time){const s=motion.update(time);pivots[0].rotation.y=s.leftAngle;pivots[1].rotation.y=s.rightAngle;const d=slide.update(time);if(drawer)drawer.position.z=d.extension;miniCarrots?.update(d.amount);}
 };
}

export function bindWardrobeInteraction({wardrobe,scene,camera,canvas,onInteract=()=>{}}){
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),tip=document.getElementById('wardrobeHint');let down=null,last=0;
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function hit(event){
  if(!visible(wardrobe.root))return false;
  const rect=canvas.getBoundingClientRect(),locked=document.pointerLockElement===canvas;
  pointer.set(locked?0:(event.clientX-rect.left)/rect.width*2-1,locked?0:-(event.clientY-rect.top)/rect.height*2+1);
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
  const target=ray.intersectObjects(wardrobe.pickTargets,false)[0];if(!target)return false;
  const blockers=[];scene.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.sceneControlPick&&!o.userData.doorPick&&!o.userData.fiberCount&&!o.userData.isHand&&o.material?.visible!==false)blockers.push(o);});
  const obstruction=ray.intersectObjects(blockers,false)[0];return !obstruction||obstruction.distance>=target.distance-.012?target.object.userData.wardrobeAction||'doors':false;
 }
 function show(value,event={}){
  canvas.dataset.wardrobeHover=value?'true':'';
  canvas.style.cursor=value||canvas.dataset.doorHover==='true'||canvas.dataset.drawerHover==='true'?'pointer':'';
  if(!tip)return;tip.hidden=!value;
  if(value){tip.textContent=value==='drawer'?(wardrobe.drawerState.open?'點花朵把手收回蘿蔔抽屜':'點花朵把手拉開蘿蔔抽屜'):(wardrobe.state.open?'點花朵把手關上衣櫃':'點花朵把手打開衣櫃');tip.style.left=Math.max(8,Math.min(innerWidth-210,(event.clientX||innerWidth/2)+16))+'px';tip.style.top=Math.max(8,Math.min(innerHeight-60,(event.clientY||innerHeight/2)+18))+'px';}
 }
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),hit:hit(e)};});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)down.hit=false;if(e.buttons||performance.now()-last<60)return;last=performance.now();show(hit(e),e);});
 canvas.addEventListener('pointerup',e=>{if(down&&e.pointerId===down.id&&down.hit&&performance.now()-down.time<700&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&hit(e)===down.hit){if(down.hit==='drawer')wardrobe.toggleDrawer();else wardrobe.toggle();onInteract();show(false);}down=null;});
 const clear=()=>{down=null;show(false);};
 canvas.addEventListener('pointercancel',clear);canvas.addEventListener('pointerleave',()=>show(false));canvas.addEventListener('wheel',()=>show(false),{passive:true});
 document.addEventListener('pointerdown',()=>show(false));addEventListener('keydown',()=>show(false));addEventListener('blur',clear);
 return {hitTest:hit};
}
