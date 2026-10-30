import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createGardenHouse as createHallway} from './garden-house.js?revision=pink-carrot-garden-1';

function hinokiGrain(){
 const c=document.createElement('canvas');c.width=c.height=768;const x=c.getContext('2d');x.fillStyle='#d9b98a';x.fillRect(0,0,768,768);
 for(let i=0;i<240;i++){
  x.beginPath();for(let y=0;y<=768;y+=8){const px=i*3.2+Math.sin(y*.009+i*.71)*(1.2+Math.sin(i)*.8)+Math.sin(y*.024+i)*.5;y?x.lineTo(px,y):x.moveTo(px,y);}
  x.lineWidth=i%6===0?1.1:.65;x.strokeStyle=i%6===0?'#946d3b26':'#fff1cf28';x.stroke();
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function arch(w,spring,bottom=0){
 const r=w/2,s=new THREE.Shape();s.moveTo(-r,bottom);s.lineTo(r,bottom);s.lineTo(r,spring);s.absarc(0,spring,r,0,Math.PI,false);s.lineTo(-r,bottom);s.closePath();return s;
}
export function createFairytaleDoor(root,{canClose=()=>true,canCloseEntry=()=>true}={}){
 const group=new THREE.Group();group.name='Fairytale hinoki doorway';group.position.set(-3.55,0,10.08);
 const grain=hinokiGrain(),wood=new THREE.MeshPhysicalMaterial({name:'Door | pale hinoki',map:grain,roughness:.70,specularIntensity:.21});
 const light=wood.clone();light.color.set('#fff3dc');const edge=wood.clone();edge.color.set('#bd955f');
 const inlay=new THREE.MeshStandardMaterial({color:'#b48a55',roughness:.8}),brass=new THREE.MeshPhysicalMaterial({color:'#b8935c',metalness:.50,roughness:.42});
 const porcelain=new THREE.MeshPhysicalMaterial({color:'#efe1ba',roughness:.35,specularIntensity:.25});
 let wallMat,replaced=0;root.traverse(o=>{const n=o.userData.sourceName||'';if(n.startsWith('Door |')&&o.isMesh){o.visible=false;replaced++;}if(n.startsWith('Wall 03'))wallMat=o.material;});
 const pickTargets=[],knobs=[];
 function mesh(parent,name,g,m){const o=new THREE.Mesh(g,m);o.name='Fairytale door | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(parent,name,size,p,m=wood,r=.035){const o=mesh(parent,name,new RoundedBoxGeometry(...size,4,r),m);o.position.fromArray(p);return o;}
 function panel(parent,name,shape,z,depth,m,bevel=.018){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:48,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});g.computeBoundingBox();
  const b=g.boundingBox,p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-b.min.x)/(b.max.x-b.min.x),(p.getY(i)-b.min.y)/(b.max.y-b.min.y));
  const o=mesh(parent,name,g,m);o.position.z=z;return o;
 }
 function line(parent,name,points,r,m=wood){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(32,points.length*3),r,8,false),m);}
 // Fill only the two top corners of the existing rectangular opening.
 // The original wall aperture and room dimensions remain untouched.
 const corner=new THREE.Shape();corner.moveTo(-.88,2.50);corner.lineTo(-.88,3.42);corner.lineTo(0,3.42);corner.lineTo(0,3.38);corner.absarc(0,2.50,.88,Math.PI/2,Math.PI,false);corner.closePath();
 for(const sign of [-1,1]){const o=panel(group,'plaster arch spandrel',corner,.1001,.24,wallMat,0);o.scale.x=sign;o.castShadow=false;}
 const frame=new THREE.Shape();frame.moveTo(-1.08,-.038);frame.lineTo(-1.08,2.50);frame.absarc(0,2.50,1.08,Math.PI,0,true);frame.lineTo(1.08,-.038);frame.lineTo(.885,-.038);frame.lineTo(.885,2.50);frame.absarc(0,2.50,.885,0,Math.PI,false);frame.lineTo(-.885,-.038);frame.closePath();
 panel(group,'rounded arched hinoki surround',frame,-.045,.31,wood,.028);
 panel(group,'hall-side arched surround',frame,.30,.10,wood,.025);
 for(const side of [-1,1])box(group,'rounded jamb foot',[.26,.29,.35],[side*.99,.107,.09],light,.06);
 const border=[new THREE.Vector3(.947,.12,-.090),new THREE.Vector3(.947,2.50,-.090)];
 for(let i=1;i<=80;i++){const a=i/80*Math.PI;border.push(new THREE.Vector3(.947*Math.cos(a),2.50+.947*Math.sin(a),-.090));}
 border.push(new THREE.Vector3(-.947,.12,-.090));line(group,'fine maple arch moulding',border,.021,edge);
 const pivot=new THREE.Group();pivot.name='Fairytale door | left hinge pivot';pivot.position.set(-.84,.015,0);group.add(pivot);
 const leafShape=arch(1.68,2.48,.01);const leaf=panel(pivot,'solid arched door leaf',leafShape,.06,.16,wood,.018);leaf.position.x=.84;
 const raised=arch(1.36,2.46,.23);const front=panel(pivot,'raised arched timber panel',raised,.033,.008,light,.020);front.position.x=.84;
 const back=panel(pivot,'rear raised timber panel',raised,.24,.008,light,.020);back.position.x=.84;
 // Quiet plank joints and a small lower carved panel, not a painted flat door.
 for(const x of [.47,.84,1.21]){
  const top=2.46+Math.sqrt(.68**2-(x-.84)**2)-.045;
  line(pivot,'delicate vertical plank joint',[new THREE.Vector3(x,.27,.005),new THREE.Vector3(x,top,.005)],.0045,edge);
 }
 box(pivot,'rounded lower carved panel',[1.12,.64,.042],[.84,.73,-.016],wood,.095);
 const moon=new THREE.Shape();moon.moveTo(.10,.27);moon.bezierCurveTo(-.22,.31,-.35,-.10,-.07,-.27);moon.bezierCurveTo(.13,-.35,.34,-.16,.31,.02);moon.bezierCurveTo(.02,-.13,-.12,.10,.10,.27);moon.closePath();
 const crescent=panel(pivot,'crescent moon inlay',moon,-.045,.016,inlay,.009);crescent.position.set(.78,2.63,-.045);
 function star(parent,name,x,y,z,r){
  const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,d=i%2?r*.46:r;i?s.lineTo(Math.cos(a)*d,Math.sin(a)*d):s.moveTo(Math.cos(a)*d,Math.sin(a)*d);}s.closePath();
  const o=panel(parent,name,s,z,.012,inlay,.006);o.position.x=x;o.position.y=y;return o;
 }
 star(pivot,'small star inlay',1.19,2.72,-.043,.072);star(pivot,'tiny star inlay',.48,2.82,-.043,.044);
 for(const side of [-1,1]){
  line(pivot,'carved lower sprig',[new THREE.Vector3(.84,.62,-.048),new THREE.Vector3(.84+side*.25,.70,-.048),new THREE.Vector3(.84+side*.40,.83,-.048)],.007,inlay);
  for(let j=0;j<3;j++){const o=mesh(pivot,'little carved leaf',new THREE.SphereGeometry(1,16,10),inlay);o.position.set(.84+side*(.14+j*.085),.70+j*.036,-.051);o.scale.set(.055,.020,.007);o.rotation.z=side*.65;}
 }
 for(const y of [.45,1.55,2.43]){
  const h=mesh(group,'rounded brass hinge',new THREE.CylinderGeometry(.035,.035,.18,24),brass);h.position.set(-.84,y,0);
  box(group,'hinge mounting tab',[.16,.10,.03],[-.91,y,.012],brass,.012);
 }
 for(const side of [-1,1]){
  const handle=new THREE.Group();handle.name='Fairytale door | '+(side<0?'inside':'outside')+' handle';handle.position.set(1.40,1.46,side<0?-.025:.285);pivot.add(handle);
  const flower=new THREE.Shape();for(let i=0;i<=100;i++){const a=i/100*Math.PI*2,r=.130+.010*Math.cos(a*6);i?flower.lineTo(Math.cos(a)*r,Math.sin(a)*r):flower.moveTo(Math.cos(a)*r,Math.sin(a)*r);}flower.closePath();
  panel(handle,'flower brass escutcheon',flower,0,.018,brass,.006);
  const stem=mesh(handle,'short handle stem',new THREE.CylinderGeometry(.037,.037,.115,20),brass);stem.rotation.x=Math.PI/2;stem.position.z=side*.067;
  const knob=mesh(handle,'cream acorn doorknob',new THREE.SphereGeometry(1,32,24),porcelain);knob.scale.set(.100,.104,.093);knob.position.z=side*.135;knobs.push(knob);
  const button=mesh(handle,'maple knob centre',new THREE.SphereGeometry(.029,20,16),inlay);button.scale.z=.24;button.position.set(0,0,side*.223);
  const proxy=mesh(handle,'generous handle click target',new THREE.SphereGeometry(.205,16,12),new THREE.MeshBasicMaterial({visible:false}));proxy.position.z=side*.135;proxy.userData.doorPick=true;proxy.castShadow=false;pickTargets.push(proxy);
 }
 const entry=createHallway(wood,{canCloseEntry});group.add(entry);
 let target=0,start=0,from=0,angle=0;
 const maximum=Math.PI*.49,duration=1050;
 function toggle(time=performance.now()){if(target>0&&!canClose())return false;from=angle;target=target?0:maximum;start=time;group.userData.open=target>0;group.userData.moving=Math.abs(angle-target)>.0001;return true;}
 function update(time,viewer){
  const t=THREE.MathUtils.clamp((time-start)/duration,0,1),ease=t*t*(3-2*t);angle=THREE.MathUtils.lerp(from,target,ease);pivot.rotation.y=angle;
  group.userData.angle=angle;group.userData.moving=t<1&&Math.abs(angle-target)>.0001;entry.visible=angle>.015||(viewer&&viewer.z>10.08);
 }
 let meshCount=0;group.traverse(o=>{if(o.isMesh&&!o.userData.doorPick)meshCount++;});
 group.userData={revision:'hinoki-door-3',meshCount,replacedMeshes:replaced,open:false,angle:0,moving:false,maximumAngle:maximum,hinge:'left',swing:'inward',hallway:entry.userData};
 update(0);
 return {group,pivot,pickTargets,knobs,toggle,update,house:entry.houseController};
}

export function bindDoorInteraction({door,scene,camera,canvas,onInteract}){
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),tip=document.getElementById('doorHint');let down=null,hover=false,last=0;
 const isVisible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function hit(event){
  if(!isVisible(door.group))return false;
  const rect=canvas.getBoundingClientRect();
  pointer.set(document.pointerLockElement===canvas?0:(event.clientX-rect.left)/rect.width*2-1,document.pointerLockElement===canvas?0:-(event.clientY-rect.top)/rect.height*2+1);
  scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
  const target=ray.intersectObjects(door.pickTargets,false)[0];if(!target)return false;
  const blockers=[];scene.traverse(o=>{if(o.isMesh&&isVisible(o)&&!o.userData.doorPick&&!o.userData.sceneControlPick&&!o.userData.fiberCount&&!o.userData.isHand)blockers.push(o);});
  const obstruction=ray.intersectObjects(blockers,false)[0];
  // The forgiving hit sphere extends around the visible knob; accept the
  // escutcheon and leaf immediately behind it, but never a wall in front.
  return !obstruction||obstruction.distance>=target.distance-.01;
 }
 function show(value,event){
  hover=value;canvas.dataset.doorHover=value?'true':'';canvas.style.cursor=value||canvas.dataset.drawerHover==='true'?'pointer':'';
  for(const k of door.knobs){k.material.emissive.set(value?'#7b592b':'#000000');k.material.emissiveIntensity=value?.15:0;}
  tip.hidden=!value;if(value){tip.textContent=door.group.userData.open?'點門把關門':'點門把開門';tip.style.left=Math.min(innerWidth-130,event.clientX+16)+'px';tip.style.top=Math.min(innerHeight-60,event.clientY+18)+'px';}
 }
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY,id:e.pointerId,hit:hit(e),time:performance.now()};});
 canvas.addEventListener('pointermove',e=>{
  if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)down.hit=false;
  if(e.buttons||performance.now()-last<60)return;last=performance.now();show(hit(e),e);
 });
 canvas.addEventListener('pointerup',e=>{
  if(down&&e.pointerId===down.id&&down.hit&&performance.now()-down.time<700&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&hit(e)){
   const changed=door.toggle();onInteract();show(false,e);
   if(!changed){show(true,e);tip.textContent='先退離門片，再關門';setTimeout(()=>show(false,{}),1800);}
  }
  down=null;
 });
 canvas.addEventListener('pointercancel',()=>{down=null;show(false,{});});canvas.addEventListener('pointerleave',()=>{show(false,{});});
 canvas.addEventListener('wheel',()=>show(false,{}),{passive:true});
 document.addEventListener('pointerdown',()=>show(false,{}));
 addEventListener('keydown',()=>show(false,{}));
 addEventListener('blur',()=>{down=null;show(false,{});});
 return {hitTest:hit,get hovered(){return hover;}};
}
