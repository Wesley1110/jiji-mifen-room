import * as THREE from 'three/webgpu';
import {craft,contactShadow} from './house-craft.js';

const TAU=Math.PI*2;
function strawTexture(color){
 const c=document.createElement('canvas');c.width=128;c.height=512;const ctx=c.getContext('2d');
 ctx.fillStyle='#fff0d9';ctx.fillRect(0,0,128,512);ctx.fillStyle=color;
 for(let y=-128;y<640;y+=96){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y+72);ctx.lineTo(128,y+103);ctx.lineTo(0,y+31);ctx.closePath();ctx.fill();}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;return map;
}

function pulpTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),pixels=ctx.createImageData(256,256);let seed=839;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
 for(let i=0;i<pixels.data.length;i+=4){const n=(rand()-.5)*9;pixels.data.set([231+n,139+n*.6,50+n*.3,255],i);}ctx.putImageData(pixels,0,0);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;return map;
}

export function createCarrotJuiceService(table,m){
 const root=new THREE.Group();root.name='Reading room | two carrot juices';table.add(root);
 const {mesh,lathe,tube,oval,group}=craft(root,'Carrot juice');
 const glass=new THREE.MeshPhysicalMaterial({name:'Juice glass | clear thick borosilicate',color:'#ffffff',roughness:.065,transmission:1,ior:1.46,thickness:.010,attenuationColor:new THREE.Color('#f2fff5'),attenuationDistance:3.0,specularIntensity:1});
 const rimGlass=new THREE.MeshPhysicalMaterial({name:'Juice glass | polished rounded lip',color:'#f0fff9',metalness:.07,roughness:.13,transparent:true,opacity:.35,depthWrite:false});
 const juice=new THREE.MeshPhysicalMaterial({name:'Carrot juice | freshly pressed orange pulp',map:pulpTexture(),roughness:.38,metalness:0,specularIntensity:.36,clearcoat:.18,clearcoatRoughness:.22});
 const meniscus=new THREE.MeshPhysicalMaterial({name:'Carrot juice | glossy curved meniscus',color:'#efae60',roughness:.23,specularIntensity:.5});
 const bubbles=new THREE.MeshPhysicalMaterial({name:'Carrot juice | tiny surface bubbles',color:'#f9c77e',roughness:.48,transparent:true,opacity:.56,depthWrite:false});
 const coaster=m.rose.clone();coaster.name='Carrot juice | woven blush coaster';
 const seam=m.linen.clone();seam.name='Carrot juice | coaster edge stitching';
 const reflections=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.19,depthWrite:false,toneMapped:false});
 const condensation=new THREE.MeshPhysicalMaterial({name:'Juice glass | delicate condensation',color:'#ffffff',roughness:.10,transparent:true,opacity:.30,depthWrite:false,specularIntensity:.8});
 const specs=[{x:-.48,z:.10,yaw:-.17,stripe:'#ce968d',fill:.291},{x:.43,z:-.32,yaw:.29,stripe:'#9bad89',fill:.272}];
 for(const [k,spec] of specs.entries()){
  const cup=group('glass '+(k+1),[spec.x,.700,spec.z],spec.yaw);
  const coasterMesh=mesh(cup,'round stitched linen coaster',new THREE.CylinderGeometry(.170,.169,.012,64),coaster);coasterMesh.position.y=.002;
  for(const r of [.158,.151]){const pts=[];for(let i=0;i<80;i++){const a=i/80*TAU;pts.push([r*Math.cos(a),.009,r*Math.sin(a)]);}tube(cup,'coaster sewn border',pts,.0015,seam,true);}
  const origin=.012;
  // A closed cross-section gives the cup an inner wall, heavy base and open mouth.
  const profile=[[0,0],[.089,0],[.107,.006],[.114,.018],[.115,.033],[.141,.365],[.142,.383],[.140,.391],[.134,.391],[.132,.384],[.132,.369],[.104,.045],[.098,.034],[0,.034]];
  const shell=lathe(cup,'hollow clear glass with solid base',profile,[0,origin,0],glass);shell.castShadow=false;shell.userData.glassWall=.009;shell.renderOrder=3;
  for(const [y,r,thickness] of [[.388,.137,.004],[.019,.108,.0045],[.040,.103,.0025]]){
   const rim=mesh(cup,'glass polished edge',new THREE.TorusGeometry(r,thickness,8,80),rimGlass);rim.rotation.x=Math.PI/2;rim.position.y=origin+y;rim.castShadow=false;rim.renderOrder=4;
  }
  const liquidRadius=.104+(spec.fill-.045)/.324*.028-.0018;
  const liquid=lathe(cup,'orange carrot juice volume',[[0,.036],[.098,.036],[.103,.047],[liquidRadius,spec.fill-.008],[liquidRadius-.001,spec.fill],[liquidRadius-.008,spec.fill-.003],[0,spec.fill-.003]],[0,origin,0],juice);liquid.userData.fill=spec.fill;
  const liquidRim=mesh(cup,'liquid meniscus',new THREE.TorusGeometry(liquidRadius-.003,.0018,6,72),meniscus);liquidRim.rotation.x=Math.PI/2;liquidRim.position.y=origin+spec.fill-.001;liquidRim.castShadow=false;
  for(let i=0;i<18;i++){
   const a=.6+i*.31,r=liquidRadius*(.76+.14*Math.sin(i*7.1)),size=.0015+(i%4)*.00065;
   const bubble=oval(cup,'subtle juice surface bubble',[Math.cos(a)*r,origin+spec.fill-.0015,Math.sin(a)*r],[size,size*.22,size],bubbles);bubble.castShadow=false;
  }
  // Two narrow curved highlights read as window reflections on the clear wall.
  for(const [a,width,height] of [[-.40,.045,.255],[2.36,.018,.21]]){
   const geometry=new THREE.CylinderGeometry(.139,.121,height,12,12,true,a,width),p=geometry.attributes.position;
   for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+origin+.218);
   const highlight=mesh(cup,'soft window reflection',geometry,reflections);highlight.castShadow=false;highlight.renderOrder=5;
  }
  for(let i=0;i<25;i++){
   const a=i*2.399+(k?.7:0),y=.10+(i%8)*.034,r=.115+(y-.033)/.350*.026+.001,size=.0023+(i%3)*.0011;
   const drop=oval(cup,'small cool-glass droplet',[Math.sin(a)*r,origin+y,Math.cos(a)*r],[size,size*1.24,size*.42],condensation);drop.rotation.y=a;drop.castShadow=false;drop.renderOrder=5;
  }
  const straw=group('striped hollow paper straw',[.036,origin+.045,-.026],0,cup);straw.rotation.set(k?-.13:.08,0,k?.15:-.19);
  const height=.515,outer=.010,inner=.0071,strawMat=new THREE.MeshPhysicalMaterial({name:'Carrot juice | '+(k?'sage':'rose')+' paper straw',map:strawTexture(spec.stripe),roughness:.84,specularIntensity:.12});
  const outside=mesh(straw,'paper straw outer wall',new THREE.CylinderGeometry(outer,outer,height,28,1,true),strawMat);outside.position.y=height/2;
  const interior=new THREE.MeshStandardMaterial({color:'#a88e70',roughness:.92,side:THREE.BackSide});
  const inside=mesh(straw,'paper straw inner wall',new THREE.CylinderGeometry(inner,inner,height,28,1,true),interior);inside.position.y=height/2;
  const paper=new THREE.MeshStandardMaterial({color:'#fff0d6',roughness:.9});
  for(const y of [0,height]){const cut=mesh(straw,'visible paper tube thickness',new THREE.RingGeometry(inner,outer,28),paper);cut.rotation.x=y?-Math.PI/2:Math.PI/2;cut.position.y=y;}
  contactShadow(cup,0,0,.133,.133,.14,.010);
  cup.userData={glass:true,juice:'carrot',straw:'hollow striped paper',fillHeight:spec.fill,openRim:true};
 }
 root.userData={revision:'carrot-lounge-1',glasses:2,drink:'carrot juice',transparentGlass:true,hollowStraws:2,linenCoasters:true};return root;
}
