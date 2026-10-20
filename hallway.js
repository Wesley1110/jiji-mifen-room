import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// A broad daylight landing with a side passage and a garden-facing window.
// Coordinates are relative to the bedroom doorway, looking out along +Z.
export function createHallway(wood){
 const group=new THREE.Group();group.name='Daylight hallway';
 const plaster=new THREE.MeshStandardMaterial({color:'#e6d8bc',roughness:1});
 const panelMat=new THREE.MeshStandardMaterial({color:'#c2c6aa',roughness:.94});
 const trim=new THREE.MeshStandardMaterial({color:'#e3d1aa',roughness:.8});
 const linen=new THREE.MeshPhysicalMaterial({color:'#d3b9a0',roughness:1,sheen:.2,sheenRoughness:1});
 const green=new THREE.MeshStandardMaterial({color:'#789267',roughness:1});
 const sky=new THREE.MeshBasicMaterial({color:'#c9dfdc',side:THREE.DoubleSide});
 const lawn=new THREE.MeshStandardMaterial({color:'#a6b58a',roughness:1});
 function mesh(name,g,m,parent=group){const o=new THREE.Mesh(g,m);o.name='Hallway | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(name,size,p,m=wood,r=.02){const o=mesh(name,new RoundedBoxGeometry(...size,3,r),m);o.position.fromArray(p);return o;}
 function line(name,points,r,m){return mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,8,false),m);}
 // The floor continues to a distant garden window, with a cross passage on
 // the left. No close wall faces the bedroom doorway.
 box('continuous timber floor',[11.2,.12,9.10],[0,-.098,4.81],wood);
 box('left cross-passage floor',[7.0,.12,3.0],[-9.1,-.098,5.0],wood);
 const seams=new THREE.LineBasicMaterial({color:'#bda67b',transparent:true,opacity:.4});
 const p=[];
 for(let x=-5.5;x<=5.5;x+=.48)p.push(x,-.035,.30,x,-.035,9.30);
 for(let x=-5.5,k=0;x<5.5;x+=.48,k++)for(let z=.65+(k%3)*.79;z<9.30;z+=2.65)p.push(x,-.034,z,x+.48,-.034,z);
 const seamGeo=new THREE.BufferGeometry();seamGeo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));group.add(new THREE.LineSegments(seamGeo,seams));
 box('right warm plaster wall',[.16,4.7,9.10],[5.68,2.31,4.81],plaster);
 box('left wall before open passage',[.16,4.7,3.2],[-5.68,2.31,1.90],plaster);
 box('left wall after open passage',[.16,4.7,2.85],[-5.68,2.31,7.925],plaster);
 box('left passage lintel',[.16,.95,3.0],[-5.68,4.185,5.0],plaster);
 for(const z of [3.42,6.58])box('cross passage side',[7.0,4.7,.16],[-9.1,2.31,z],plaster);
 box('warm ceiling',[11.5,.12,9.10],[0,4.72,4.81],plaster);
 box('side passage ceiling',[7.0,.12,3.2],[-9.1,4.72,5.0],plaster);
 // Complete the previously distant passage for viewing at walking distance.
 box('side passage window sill',[.18,.60,3.16],[-12.67,.26,5.0],panelMat);
 box('side passage window header',[.18,.43,3.16],[-12.67,4.445,5.0],plaster);
 for(const z of [3.49,5.0,6.51])box('side window upright',[.16,3.70,.07],[-12.57,2.40,z],trim,.012);
 for(const y of [.56,1.65,4.24])box('side window crossbar',[.16,.07,3.1],[-12.57,y,5.0],trim,.012);
 const sideSky=box('side garden sky',[.10,15,16],[-17.2,5.0,5.0],sky);sideSky.castShadow=false;sideSky.receiveShadow=false;
 box('side garden lawn',[5.0,.10,7.0],[-15.2,-.12,5.0],lawn);
 for(const x of [-5.57,5.57]){
  const sections=x<0?[[1.9,3.2],[7.925,2.85]]:[[4.81,9.1]];
  for(const [z,length] of sections){
   box('sage lower wall panel',[.05,.86,length],[x,.40,z],panelMat);
   box('slender wall rail',[.08,.055,length],[x,.86,z],trim,.012);
   box('wood skirting',[.09,.12,length],[x,.025,z],trim,.015);
  }
 }
 for(const z of [3.52,6.48]){
  box('side passage sage panel',[7.0,.86,.045],[-9.1,.40,z],panelMat);
  box('side passage handrail',[7.0,.055,.075],[-9.1,.86,z],trim,.012);
  box('side passage skirting',[7.0,.12,.075],[-9.1,.025,z],trim,.012);
 }
 // The far wall is mostly glazing, opening the view to an actual garden scene.
 box('window wall left pier',[.52,4.7,.18],[-5.42,2.31,9.45],plaster);
 box('window wall right pier',[3.65,4.7,.18],[3.855,2.31,9.45],plaster);
 box('window wall sill',[7.2,.62,.18],[-1.57,.27,9.45],panelMat);
 box('window wall header',[7.2,.40,.18],[-1.57,4.46,9.45],plaster);
 for(const x of [-5.17,-2.77,-.37,2.03])box('garden window upright',[.075,3.68,.20],[x,2.40,9.34],trim,.014);
 for(const y of [.56,1.69,4.24])box('garden window crossbar',[7.27,.075,.21],[-1.57,y,9.33],trim,.014);
 box('deep window ledge',[7.45,.11,.44],[-1.57,.56,9.22],wood,.025);
 const glass=new THREE.MeshPhysicalMaterial({color:'#edf7e9',transparent:true,opacity:.065,roughness:.12,depthWrite:false});
 box('clear garden glazing',[7.12,3.60,.014],[-1.57,2.40,9.44],glass,.001).castShadow=false;
 box('side garden glazing',[.014,3.60,2.98],[-12.64,2.40,5.0],glass,.001).castShadow=false;
 // Curtains sit at the edges so they do not hide the view beyond the doorway.
 for(const x of [-4.95,1.79]){
  for(let i=0;i<6;i++){const o=mesh('linen curtain fold',new THREE.CylinderGeometry(.075,.095,3.45,12),linen);o.position.set(x+(i-2.5)*.10,2.43,9.08);o.scale.z=.45;}
 }
 const runnerMat=new THREE.MeshPhysicalMaterial({color:'#c8ac88',roughness:1,sheen:.15,sheenRoughness:1});
 box('long woven runner',[1.52,.025,6.4],[-.45,-.019,4.48],runnerMat,.012);
 for(const x of [-1.12,.22])box('runner subtle woven border',[.025,.004,6.14],[x,-.004,4.48],trim,.001);
 const skyPanel=box('garden sky',[40,18,.10],[-1.5,5.3,19],sky);skyPanel.castShadow=false;skyPanel.receiveShadow=false;
 box('garden ground',[40,.10,12],[-1.5,-.12,15.4],lawn);
 const hillMat=new THREE.MeshStandardMaterial({color:'#b6cba0',roughness:1});
 for(const [x,z,s] of [[-10,17,5],[-1,17.7,4.6],[8,17.2,5.5]]){
  const h=mesh('soft distant garden hill',new THREE.SphereGeometry(1,32,16),hillMat);h.position.set(x,-.38,z);h.scale.set(s,1.45,s*.45);
 }
 const bark=new THREE.MeshStandardMaterial({color:'#a28b65',roughness:1});
 for(const [x,z,h] of [[-4.7,12.8,3.4],[2.8,13.2,3.9],[-8,15.5,3.3],[7,16,4.3],[-14.5,5.2,3.3]]){
  const trunk=mesh('garden tree trunk',new THREE.CylinderGeometry(.08,.14,h*.75,12),bark);trunk.position.set(x,h*.36,z);
  for(const [dx,dy,dz,s] of [[0,.79,0,1.05],[-.52,.66,.1,.75],[.5,.7,-.1,.78],[.05,1.01,0,.65]]){
   const leaf=mesh('garden tree canopy',new THREE.SphereGeometry(1,24,18),green);leaf.position.set(x+dx,h*dy,z+dz);leaf.scale.set(s,s*.84,s*.85);
  }
 }
 // A small pot by the garden window gives a familiar domestic scale.
 const potMat=new THREE.MeshStandardMaterial({color:'#bd9579',roughness:.88});
 const pot=mesh('window plant pot',new THREE.CylinderGeometry(.25,.18,.38,32),potMat);pot.position.set(-3.20,.80,8.99);
 for(let i=0;i<9;i++){
  const a=i*2.4,end=new THREE.Vector3(-3.20+Math.sin(a)*.34,1.18+(i%3)*.18,8.99+Math.cos(a)*.23);
  line('plant stem',[new THREE.Vector3(-3.20,.96,8.99),end],.012,green);
  const leaf=mesh('plant leaf',new THREE.SphereGeometry(1,16,12),green);leaf.position.copy(end);leaf.scale.set(.12,.21,.045);leaf.rotation.z=Math.sin(a)*.65;leaf.rotation.y=a;
 }
 const daylight=new THREE.PointLight('#e6f0d7',10,16,2);daylight.position.set(-1.2,3.7,8.2);group.add(daylight);
 const ceilingLight=new THREE.PointLight('#ffdfb8',5,12,2);ceilingLight.position.set(0,3.9,3.7);group.add(ceilingLight);
 const sideLight=new THREE.PointLight('#eaf0d9',5,10,2);sideLight.position.set(-11.6,3.5,5.0);group.add(sideLight);
 const pendantMat=new THREE.MeshStandardMaterial({color:'#fff0d3',emissive:'#f3c482',emissiveIntensity:.35,roughness:.8});
 const pendant=mesh('linen pendant',new THREE.SphereGeometry(1,32,20),pendantMat);pendant.position.set(0,4.0,4.6);pendant.scale.set(.36,.21,.36);
 line('pendant cord',[new THREE.Vector3(0,4.65,4.6),new THREE.Vector3(0,4.18,4.6)],.013,bark);
 group.userData={revision:'daylight-hallway-2',depth:9.1,width:11.2,sidePassage:true,gardenWindow:true,walkable:true};
 return group;
}
