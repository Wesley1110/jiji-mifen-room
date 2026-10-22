import * as THREE from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {makeFiberNap,softenFabric,loadFineFur} from './fur.js?revision=plush-touch-1';
import {upgradeFairytaleBed} from './bed.js?revision=storybook-bed-2';
import {placeBedOccupants} from './bedding.js?revision=bedding-2';
import {initMenu} from './menu.js?revision=room-details-1';
import {createBedsideSlippers} from './house-slippers.js?revision=room-details-4';
import {createFairytaleDoor,bindDoorInteraction} from './door.js?revision=nightstand-v5';
import {createNavigation} from './navigation.js?revision=room-details-4';
import {createPetting} from './petting.js?revision=plump-paw-4';
import {createStorybookDesk} from './storybook-desk.js?revision=nightstand-preview-1';
import {createStorybookNightstand} from './storybook-nightstand.js?revision=nightstand-v5';
import {bindDrawerInteraction} from './nightstand-drawer.js?revision=nightstand-v5';

const $=id=>document.getElementById(id), viewport=$('room');
const menu=initMenu();
const camera=new THREE.PerspectiveCamera(innerWidth<innerHeight?82:54,innerWidth/innerHeight,.05,200);
const scene=new THREE.Scene();scene.background=new THREE.Color('#efe2d1');
let renderer,orbit,plush,door,drawer,petting,mode='orbit',floating=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const navigation=createNavigation(()=>door?.group.userData.angle||0);
let lastInteraction=0,transition=null,drag=null,lastTime=0,frames=0,fpsTime=0,ready=false;
let wheelTravel=0;
const keys=new Set(), offset=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0),temp=new THREE.Vector3();
const walls=[];const poses={
 home:{pos:[-2.6,7.5,9.65],target:[-2.6,1.22,.9]},
 friends:{pos:[-2.4,5.0,4.2],target:[-.15,3.3,-.7]},
 blanket:{pos:[-.4,4.18,4.8],target:[-.1,2.18,1.75]},
 rug:{pos:[-7.3,5.6,3.9],target:[-6.5,.05,1.5]},
 slippers:{pos:[-5.65,2.35,3.9],target:[-3.7,.20,1.75]},
 desk:{pos:[-5.15,4.35,9.55],target:[-8.65,1.82,5.62]},
 nightstand:{pos:[-6.55,3.65,1.15],target:[-3.925,1.55,-1.8]},
 drawer:{pos:[-4.02,2.55,-.18],target:[-3.925,1.28,-.81]},
 door:{pos:[-2.5,2.35,5.7],target:[-3.55,1.65,10.2]},
 window:{pos:[.3,4.1,5.6],target:[5.5,3.4,.6]},
 plan:{pos:[-2.6,19.5,3.51],target:[-2.6,0,3.5]}
};
const setPressed=(id,val)=>{$(id).classList.toggle('selected',val);$(id).setAttribute('aria-pressed',String(val));};
function interact(){lastInteraction=performance.now();}
function clearFloat(){camera.position.sub(offset);offset.set(0,0,0);}
function goTo(name,instant=false){
 if(!orbit)return;clearFloat();setMode('orbit');let p=name==='home'&&innerWidth<innerHeight?{pos:[-2.6,10,16.8],target:[-2.6,1.22,1.5]}:poses[name];
 // Consume residual drag momentum without moving the start pose of a preset.
 // Otherwise a quick view selected immediately after dragging keeps drifting.
 const damping=orbit.enableDamping,priorPosition=camera.position.clone(),priorTarget=orbit.target.clone();
 orbit.enableDamping=false;orbit.update();camera.position.copy(priorPosition);orbit.target.copy(priorTarget);orbit.update();orbit.enableDamping=damping;
 if(name==='drawer')drawer?.setOpen(true);
 if(name==='desk'&&innerWidth<innerHeight)p={target:p.target,pos:p.pos.map((v,i)=>p.target[i]+(v-p.target[i])*1.22)};
 document.querySelectorAll('[data-view]').forEach(b=>{const sel=b.dataset.view===name;b.classList.toggle('active',sel);b.setAttribute('aria-pressed',String(sel));});
 if(instant){camera.position.fromArray(p.pos);orbit.target.fromArray(p.target);orbit.update();camera.updateMatrixWorld(true);}
 else transition={start:performance.now(),p0:camera.position.clone(),t0:orbit.target.clone(),p1:new THREE.Vector3(...p.pos),t1:new THREE.Vector3(...p.target)};
 interact();
}
function setMode(next){
 if(next==='orbit')petting?.setEnabled(false);
 clearFloat();keys.clear();drag=null;wheelTravel=0;mode=next;
 if(document.pointerLockElement)document.exitPointerLock();
 if(orbit){orbit.enabled=next==='orbit';if(next==='orbit'){const dir=new THREE.Vector3();camera.getWorldDirection(dir);orbit.target.copy(camera.position).addScaledVector(dir,4);}}
 setPressed('orbit',next==='orbit');setPressed('fly',next==='fly');$('lock').hidden=next!=='fly';
 $('touchFly').hidden=next!=='fly'||!matchMedia('(pointer:coarse)').matches;
 updateHint();
 if(next==='fly'){transition=null;navigation.constrain(camera.position);}
 interact();
}
function updateHint(){
 $('hint').textContent=mode==='fly'?'WASD 移動 · Shift 加速 · 滾輪前後 · Q／E 升降 · F 伸出／收起熊掌':'拖曳環繞 · 滾輪拉近／拉遠 · WASD 直接移動 · Shift 加速 · F 伸出熊掌';
}
function focusScene(){renderer?.domElement.focus({preventScroll:true});}
function lookDelta(dx,dy){const e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');e.y-=dx*.003;e.x=THREE.MathUtils.clamp(e.x-dy*.003,-1.48,1.48);e.z=0;camera.quaternion.setFromEuler(e);}
async function init(){
 renderer=new THREE.WebGPURenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 viewport.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','可拖曳與飛行探索的 3D 房間');
 await renderer.init();
 const actualGPU=renderer.backend.isWebGPUBackend===true;
 $('backend').textContent=actualGPU?'WebGPU':'WebGL 2 相容模式';
 scene.add(new THREE.HemisphereLight(0xfff8f6,0xcdb8aa,1.7));scene.add(new THREE.AmbientLight(0xfff0ec,.25));
 const sun=new THREE.DirectionalLight(0xfff3e8,2.3);sun.position.set(-3,10,5);sun.target.position.set(-2,0,1);sun.castShadow=true;
 Object.assign(sun.shadow.camera,{left:-12,right:10,top:10,bottom:-12,near:.1,far:30});sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=3;sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight(0xe5efff,1.1);fill.position.set(5,6,-1);scene.add(fill);
 const lamp=new THREE.PointLight(0xffd998,8,4,2);lamp.position.set(3.35,2.5,-.8);scene.add(lamp);
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.08;orbit.minDistance=.65;orbit.maxDistance=24;orbit.minPolarAngle=.01;orbit.maxPolarAngle=Math.PI*.49;orbit.target.set(-2.6,1.22,.9);orbit.addEventListener('start',()=>{transition=null;interact()});orbit.addEventListener('end',interact);
 goTo('home',true);
 $('loadText').textContent='搬進角色、床與熊熊地毯';
 const loader=new GLTFLoader();const draco=new DRACOLoader();draco.setDecoderPath('./vendor/addons/libs/draco/gltf/');loader.setDRACOLoader(draco);
 const gltf=await loader.loadAsync('./assets/room.glb',e=>{if(e.total)$('progress').style.width=`${10+e.loaded/e.total*73}%`;});
 const cloth=makeFiberNap(),fabricCache=new Map();let meshCount=0;
 gltf.scene.traverse(o=>{if(!o.isMesh)return;meshCount++;const name=o.userData.sourceName||o.name;
  o.castShadow=!/glass|Sky|sky backdrop|stitch|glint/i.test(name);o.receiveShadow=true;
  if(name.startsWith('Wall 0')){walls.push({mesh:o,name});o.castShadow=false;}
  if(!o.geometry.attributes.uv){
   const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,uv=new Float32Array(p.count*2);
   for(let i=0;i<p.count;i++){const ax=Math.abs(n?.getX(i)||0),ay=Math.abs(n?.getY(i)||0),az=Math.abs(n?.getZ(i)||1);uv[i*2]=ax>az?p.getZ(i):p.getX(i);uv[i*2+1]=ay>ax&&ay>az?p.getZ(i):p.getY(i);}
   o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  const mats=Array.isArray(o.material)?o.material:[o.material];
  o.material=mats.map(mat=>{
   if(/plush|fleece|cotton|pile|biscuit|muzzle|linen|gingham|binding|ivory/i.test(mat.name)&&!(/ceramic|inner stile|crossbar|upright/i.test(name))){if(!fabricCache.has(mat))fabricCache.set(mat,softenFabric(mat,cloth));mat=fabricCache.get(mat);}
   if(/glazing/i.test(mat.name)){mat.transparent=true;mat.opacity=.12;mat.transmission=0;mat.depthWrite=false;}
   return mat;
  });if(o.material.length===1)o.material=o.material[0];
 });scene.add(gltf.scene);
 const bed=upgradeFairytaleBed(gltf.scene,cloth);scene.add(bed);meshCount+=bed.userData.meshCount-bed.userData.replacedMeshes;
 $('loadText').textContent='梳理柔軟的細短絨毛';plush=await loadFineFur(gltf.scene);scene.add(plush);const fiberCount=plush.userData.fiberCount;$('progress').style.width='100%';
 placeBedOccupants(gltf.scene,plush);
 const slippers=createBedsideSlippers(cloth);scene.add(slippers);meshCount+=slippers.userData.meshCount;
 door=createFairytaleDoor(gltf.scene,{canClose:()=>navigation.canClose(camera.position)});scene.add(door.group);meshCount+=door.group.userData.meshCount-door.group.userData.replacedMeshes;
 const desk=createStorybookDesk();scene.add(desk);meshCount+=desk.userData.meshCount;
 const nightstand=await createStorybookNightstand();scene.add(nightstand);meshCount+=nightstand.userData.meshCount;
 drawer=nightstand.drawerController;
 const doorInteraction=bindDoorInteraction({door,scene,camera,canvas:renderer.domElement,onInteract:interact});
 const drawerInteraction=bindDrawerInteraction({drawer,scene,camera,canvas:renderer.domElement,onInteract:interact});
 petting=createPetting({scene,root:gltf.scene,plush,camera,canvas:renderer.domElement,getMode:()=>mode,setMode,onInteract:interact,isSceneControl:e=>doorInteraction.hitTest(e)||drawerInteraction.hitTest(e)});
 setPressed('float',floating);await renderer.compileAsync(scene,camera);
 ready=true;fpsTime=performance.now();renderer.setAnimationLoop(animate);$('loading').hidden=true;
 window.__room={camera,orbit,renderer,scene,goTo,setMode,keys,door,drawer,navigation,petting,desk,nightstand,get status(){return {ready,revision:'nightstand-v5',furRevision:'plush-touch-1',petting:petting.status,bed:bed.userData,desk:desk.userData,nightstand:nightstand.userData,slippers:slippers.userData,door:door.group.userData,navigation:{area:navigation.region(camera.position),hallwayAccess:true},menu:menu.state,backend:actualGPU?'WebGPU':'WebGL2',mode,meshCount,fiberCount,floating,position:camera.position.toArray(),wheelTravel,renderInfo:renderer.info.render};}};
 const requestedView=new URLSearchParams(location.search).get('view');if(Object.hasOwn(poses,requestedView))goTo(requestedView,true);
 window.dispatchEvent(new Event('room-ready'));
}
function animate(time){
 const dt=Math.min((time-lastTime)/1000,.045)||.016;lastTime=time;clearFloat();
 if(transition){const t=THREE.MathUtils.clamp((time-transition.start)/1400,0,1),s=t*t*(3-2*t);camera.position.lerpVectors(transition.p0,transition.p1,s);orbit.target.lerpVectors(transition.t0,transition.t1,s);if(t===1)transition=null;}
 if(mode==='orbit')orbit.update();
 else {
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);const right=new THREE.Vector3().crossVectors(forward,worldUp).normalize();temp.set(0,0,0);
  if(keys.has('KeyW'))temp.add(forward);if(keys.has('KeyS'))temp.sub(forward);if(keys.has('KeyD'))temp.add(right);if(keys.has('KeyA'))temp.sub(right);if(keys.has('KeyE')||keys.has('Space'))temp.y+=1;if(keys.has('KeyQ'))temp.y-=1;
  if(temp.lengthSq()){interact();navigation.move(camera.position,temp.normalize().multiplyScalar(dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?5.0:2.0)));}
  if(Math.abs(wheelTravel)>.0001){
   const step=wheelTravel*(1-Math.exp(-18*dt));navigation.move(camera.position,forward.multiplyScalar(step));wheelTravel-=step;
  }else wheelTravel=0;
 }
 if(floating&&!transition&&mode==='orbit'&&time-lastInteraction>3500){offset.set(Math.sin(time*.00026)*.075,Math.sin(time*.00045)*.055,Math.cos(time*.00030)*.055);camera.position.add(offset);camera.lookAt(orbit.target);}
 // Keep the doorway and room walls when looking back from inside the hall.
 // Cutaway walls remain available for external overview/orbit cameras.
 const interiorView=mode==='fly'||navigation.inHallway(camera.position);
 for(const w of walls){w.mesh.visible=interiorView||!(w.name.startsWith('Wall 01')&&camera.position.z< -3.2 || w.name.startsWith('Wall 02')&&camera.position.x< -10.65 || w.name.startsWith('Wall 03')&&camera.position.z>10.15 || w.name.startsWith('Wall 04')&&camera.position.x>5.45);}
 if(door){door.group.visible=interiorView||camera.position.z<=10.15;door.update(time,camera.position);}
 drawer?.update(time);petting?.update(time,dt);plush?.userData.updateLOD(camera);renderer.render(scene,camera);frames++;if(time-fpsTime>1000){$('fps').textContent=`${Math.round(frames*1000/(time-fpsTime))} fps`;frames=0;fpsTime=time;}
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{goTo(b.dataset.view);focusScene();});
$('orbit').onclick=()=>{setMode('orbit');focusScene();};$('fly').onclick=()=>{setMode('fly');focusScene();};$('reset').onclick=()=>{goTo('home');focusScene();};
$('float').onclick=()=>{floating=!floating;setPressed('float',floating);updateHint();focusScene();};
$('helpToggle').onclick=()=>{$('help').hidden=!$('help').hidden;$('helpToggle').setAttribute('aria-expanded',String(!$('help').hidden));};
$('lock').onclick=async()=>{if(document.pointerLockElement){document.exitPointerLock();return;}try{await renderer.domElement.requestPointerLock();}catch{$('hint').textContent='目前無法鎖定；按住滑鼠拖曳仍可轉向。';}};
document.addEventListener('pointerlockchange',()=>{$('lock').textContent=document.pointerLockElement?'解除鎖定':'鎖定視線';keys.clear();drag=null;});
viewport.addEventListener('pointerdown',e=>{interact();focusScene();if(mode==='fly'){drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}});
viewport.addEventListener('pointermove',e=>{if(mode!=='fly')return;if(document.pointerLockElement===renderer.domElement)lookDelta(e.movementX,e.movementY);else if(drag){lookDelta(e.clientX-drag.x,e.clientY-drag.y);drag={x:e.clientX,y:e.clientY};}interact();});
viewport.addEventListener('pointerup',()=>drag=null);viewport.addEventListener('pointercancel',()=>drag=null);viewport.addEventListener('contextmenu',e=>e.preventDefault());
// OrbitControls keeps its own wheel behavior; flight dollies along the view
// direction, including pitch, without changing mode or the lens field of view.
viewport.addEventListener('wheel',e=>{
 if(!ready||mode!=='fly'||e.ctrlKey||e.metaKey)return;
 e.preventDefault();interact();focusScene();
 const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 wheelTravel=THREE.MathUtils.clamp(wheelTravel-THREE.MathUtils.clamp(pixels,-500,500)*.003,-2,2);
},{passive:false});
const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE']);
addEventListener('keydown',e=>{
 if(!ready||e.target.closest('input,textarea,select,[contenteditable="true"]')||e.ctrlKey||e.metaKey||e.altKey)return;
 // Physical key codes also work with a Chinese keyboard/input method selected.
 // First movement key enters flight from any preset or orbit view.
 if(movementKeys.has(e.code)){
  e.preventDefault();if(mode!=='fly')setMode('fly');keys.add(e.code);
  if(e.shiftKey)keys.add('ShiftLeft');focusScene();
 }else if(mode==='fly'&&['Space','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
 if(e.code==='Escape'){if(document.pointerLockElement)document.exitPointerLock();keys.clear();drag=null;}
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();drag=null;wheelTravel=0;});document.addEventListener('visibilitychange',()=>{keys.clear();wheelTravel=0;});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();if(mode!=='fly')setMode('fly');b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?82:54;camera.updateProjectionMatrix();renderer?.setSize(innerWidth,innerHeight);if(mode==='orbit')goTo(document.querySelector('[data-view].active')?.dataset.view||'home',true);});
init().catch(e=>{console.error(e);$('loading').hidden=true;$('error').hidden=false;$('errorText').textContent='請使用已開啟硬體加速的 Chrome 或 Edge，再重新載入。'+e.message;$('backend').textContent='載入失敗';});
