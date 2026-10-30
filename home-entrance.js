import * as THREE from 'three/webgpu';
import {craft,archShape,archSurround,roundedShape,contactShadow} from './house-craft.js';
import {ENTRY} from './house-layout.js';

export function createHomeEntrance(m,{canClose=()=>true}={}){
 const root=new THREE.Group();root.name='Home entrance';root.position.set(-3.6,0,9.45);
 const {mesh,box,oval,tube,panel,rod,group,lathe}=craft(root,'Home entrance');
 const surround=archSurround(2.24,1.9,2.45,1.12,.95);
 panel(root,'deep arched hinoki door surround',surround,[0,0,-.16],.32,m.horizontal,.022);
 for(const z of [-.19,.19])tube(root,'fine rounded arch moulding',archShape(2.10,2.45,.06,1.05).getPoints(100).map(p=>[p.x,p.y,z]),.019,m.pale);
 for(const x of [-1.03,1.03])box(root,'jamb plinth',[.27,.27,.42],[x,.09,0],m.horizontal,.04);
 box(root,'level limestone threshold',[1.88,.065,.42],[0,-.012,0],m.trim,.02);
 const pivot=group('inward opening door leaf',[-.90,.01,0]);
 const leaf=archShape(1.8,2.45,.02,.90),windowShape=archShape(1.08,2.40,1.76,.54);
 leaf.holes.push(new THREE.Path(windowShape.getPoints(80)));
 panel(pivot,'solid timber door with real glazed aperture',leaf,[.9,0,-.065],.13,m.wood,.018);
 const glassMat=new THREE.MeshPhysicalMaterial({name:'Entrance | softly tinted glazing',color:'#dce7d0',transparent:true,opacity:.18,roughness:.32,depthWrite:false,side:THREE.DoubleSide});
 panel(pivot,'garden-facing door glass',windowShape,[.9,0,-.008],.016,glassMat,.001).castShadow=false;
 for(const side of [-1,1]){
  const z=side*.092;
  tube(pivot,'rounded window bead',windowShape.getPoints(90).map(p=>[p.x+.9,p.y,z]),.039,m.horizontal,true);
  rod(pivot,'slender window mullion',[.90,1.79,z],[.90,2.92,z],.019,m.pale);
  rod(pivot,'window crossbar',[.38,2.22,z],[1.42,2.22,z],.019,m.pale);
  box(pivot,'raised lower carved panel',[1.40,1.20,.025],[.9,.84,z],m.pale,.13);
  box(pivot,'recessed lower field',[1.25,1.05,.016],[.9,.84,z+side*.018],m.wood,.11);
  for(const sign of [-1,1]){
   tube(pivot,'carved botanical stem',[[.9,.51,z+side*.032],[.9+sign*.20,.67,z+side*.032],[.9+sign*.36,.89,z+side*.032]],.006,m.edge);
   for(let j=0;j<3;j++){const o=oval(pivot,'carved hinoki leaf',[.9+sign*(.12+j*.08),.65+j*.08,z+side*.034],[.051,.020,.006],m.edge);o.rotation.z=sign*.7;}
  }
 }
 const pickTargets=[];
 for(const side of [-1,1]){
  const handle=group('brass handle',[1.53,1.37,side*.108],0,pivot);
  const plate=panel(handle,'oval aged brass backplate',roundedShape(.13,.29,.06),[0,0,-.015],.03,m.brass,.008);
  rod(handle,'knob neck',[0,0,0],[0,0,side*.08],.027,m.brass);
  oval(handle,'cream porcelain knob',[0,0,side*.10],[.078,.079,.067],m.ceramic);
  oval(handle,'brass knob cap',[0,0,side*.164],[.025,.025,.008],m.brass);
  const proxy=mesh(handle,'forgiving handle click target',new THREE.SphereGeometry(.18,16,12),new THREE.MeshBasicMaterial({visible:false}));proxy.position.z=side*.1;proxy.userData.sceneControlPick=true;proxy.userData.houseAction='entry';proxy.castShadow=false;pickTargets.push(proxy);
 }
 for(const y of [.48,1.64,2.50]){rod(root,'brass hinge',[-.90,y-.08,0],[-.90,y+.08,0],.036,m.brass);}
 const mat=m.rug.clone();mat.color.set('#b4ad8e');
 box(root,'woven indoor entry mat',[1.36,.025,.86],[0,-.018,-.80],mat,.10);
 box(root,'woven porch doormat',[1.40,.035,.88],[0,-.012,.80],m.rug,.10);
 // Compact entry bench lives beside the doorway, clear of the door sweep.
 const bench=group('entry shoe bench',[-1.62,0,-1.0],Math.PI/2);
 for(const x of [-.40,.40])for(const z of [-.19,.19])box(bench,'shoe bench leg',[.08,.50,.08],[x,.24,z],m.wood,.025);
 box(bench,'shoe shelf',[.86,.055,.44],[0,.17,0],m.horizontal,.025);
 box(bench,'shoe bench seat',[1.03,.10,.55],[0,.53,0],m.horizontal,.045);
 box(bench,'linen seat pad',[.94,.10,.49],[0,.63,0],m.sage,.045);
 for(const x of [-.22,.22]){oval(bench,'plain guest slipper sole',[x,.215,.02],[.12,.025,.18],m.cream);const toe=oval(bench,'guest slipper toe',[x,.264,.09],[.12,.065,.115],m.cream);}
 box(bench,'wall mounted peg rail',[1.10,.18,.07],[0,2.10,-.28],m.horizontal,.06);
 for(const x of [-.35,0,.35]){rod(bench,'brass coat peg',[x,2.10,-.22],[x,2.10,-.11],.018,m.brass);oval(bench,'round peg tip',[x,2.12,-.10],[.035,.035,.035],m.pale);}
 contactShadow(root,-1.62,-1.0,.48,.76,.25);
 let from=0,target=0,start=0,angle=0;
 function toggle(time=performance.now()){
  if(target>0&&!canClose())return false;
  from=angle;target=target?0:ENTRY.maximum;start=time;root.userData.open=target>0;return true;
 }
 function update(time){const t=THREE.MathUtils.clamp((time-start)/1000,0,1);angle=THREE.MathUtils.lerp(from,target,t*t*(3-2*t));pivot.rotation.y=angle;root.userData.angle=angle;}
 root.userData={revision:'home-entrance-1',open:false,angle:0};
 return {root,pivot,pickTargets,toggle,update,get angle(){return angle;}};
}

export function bindHouseInteraction({house,scene,camera,canvas,onInteract=()=>{}}){
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),tip=document.getElementById('houseHint');let down=null,last=0;
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function hit(event){
  const rect=canvas.getBoundingClientRect(),locked=document.pointerLockElement===canvas;pointer.set(locked?0:(event.clientX-rect.left)/rect.width*2-1,locked?0:-(event.clientY-rect.top)/rect.height*2+1);
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
  const targets=house.pickTargets.filter(visible),target=ray.intersectObjects(targets,false)[0];if(!target)return false;
  const objects=[];scene.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.sceneControlPick&&!o.userData.doorPick&&!o.userData.fiberCount&&!o.userData.isHand&&o.material?.visible!==false)objects.push(o);});
  const obstruction=ray.intersectObjects(objects,false)[0];return !obstruction||obstruction.distance>=target.distance-.015?target.object.userData.houseAction:false;
 }
 function show(value,e={}){canvas.dataset.houseHover=value?'true':'';canvas.style.cursor=value||canvas.dataset.doorHover==='true'||canvas.dataset.drawerHover==='true'||canvas.dataset.wardrobeHover==='true'?'pointer':'';if(!tip)return;tip.hidden=!value;if(value){tip.textContent=value==='entry'?(house.entry.root.userData.open?'點門把關上大門':'點門把打開大門'):(house.reading.lampOn?'點拉繩關閉閱讀燈':'點拉繩打開閱讀燈');tip.style.left=Math.max(8,Math.min(innerWidth-210,(e.clientX||innerWidth/2)+16))+'px';tip.style.top=Math.max(8,Math.min(innerHeight-60,(e.clientY||innerHeight/2)+18))+'px';}}
 canvas.addEventListener('pointerdown',e=>{if(e.button===0)down={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),hit:hit(e)};});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)down.hit=false;if(e.buttons||performance.now()-last<70)return;last=performance.now();show(hit(e),e);});
 canvas.addEventListener('pointerup',e=>{if(down&&down.id===e.pointerId&&down.hit&&performance.now()-down.time<700&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&hit(e)===down.hit){let ok=true;if(down.hit==='entry')ok=house.entry.toggle();else house.reading.toggleLamp();onInteract();show(false);if(!ok){show('entry',e);tip.textContent='先退離門片，再關門';setTimeout(()=>show(false),1600);}}down=null;});
 const clear=()=>{down=null;show(false);};canvas.addEventListener('pointercancel',clear);canvas.addEventListener('pointerleave',()=>show(false));canvas.addEventListener('wheel',()=>show(false),{passive:true});document.addEventListener('pointerdown',()=>show(false));addEventListener('keydown',()=>show(false));addEventListener('blur',clear);
 return {hitTest:hit};
}
