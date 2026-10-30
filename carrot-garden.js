import * as THREE from 'three/webgpu';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPinkCarrotPlushes} from './wardrobe-plush.js?revision=bunny-wardrobe-5';
import {craft,contactShadow,roundLoop} from './house-craft.js';
import {CARROT_BEDS,CARROT_SOIL_HEIGHT,gardenPlantings} from './carrot-garden-layout.js';

// The garden uses the approved wardrobe pattern, colours, seams and actual
// short-pile fibres. Only the planting transforms change; the indoor toys do not.
export function createPinkCarrotGarden(m){
 const root=new THREE.Group();root.name='Mifen | pink plush carrot garden';
 const {mesh,box,oval,tube,rod,group,lathe}=craft(root,'Carrot garden');
 let seed=82012;const random=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
 const wood=m.horizontal.clone();wood.name='Garden | oiled hinoki raised beds';wood.color.multiplyScalar(.88);wood.roughness=.78;
 const endWood=m.wood.clone();endWood.color.multiplyScalar(.88);endWood.roughness=.78;
 const peg=m.material('Garden | recessed wooden pegs','#957047',.87);
 const soilCanvas=document.createElement('canvas');soilCanvas.width=soilCanvas.height=512;
 const sctx=soilCanvas.getContext('2d'),data=sctx.createImageData(512,512);
 for(let i=0;i<data.data.length;i+=4){const n=random();data.data.set([80+n*28,58+n*24,41+n*21,255],i);}
 sctx.putImageData(data,0,0);
 for(let i=0;i<15000;i++){const x=random()*512,y=random()*512,r=.4+random()*1.7;sctx.fillStyle=random()>.55?'#92725455':'#392e2540';sctx.beginPath();sctx.ellipse(x,y,r*1.8,r,random()*3.14,0,Math.PI*2);sctx.fill();}
 const soilMap=new THREE.CanvasTexture(soilCanvas);soilMap.wrapS=soilMap.wrapT=THREE.RepeatWrapping;soilMap.repeat.set(3,1.6);soilMap.colorSpace=THREE.SRGBColorSpace;soilMap.anisotropy=8;
 const soil=new THREE.MeshStandardMaterial({name:'Garden | fine cocoa soil',color:'#b69c81',map:soilMap,roughness:1,bumpMap:soilMap,bumpScale:.012});
 const crumb=m.material('Garden | rounded earth crumbs','#67513c',1);
 const soilY=CARROT_SOIL_HEIGHT;
 for(const [index,b] of CARROT_BEDS.entries()){
  const plot=group('hinoki planting bed '+(index+1),[b.x,0,b.z]);
  // Two horizontal boards with an actual joint, rounded cap and end-grain posts.
  for(const y of [.065,.205]){
   for(const z of [-b.depth/2,b.depth/2])box(plot,'long garden board',[b.width,.135,.10],[0,y,z],wood,.016);
   for(const x of [-b.width/2,b.width/2])box(plot,'end garden board',[.10,.135,b.depth],[x,y,0],wood,.016);
  }
  for(const z of [-b.depth/2,b.depth/2])box(plot,'rounded hinoki top rail',[b.width+.14,.055,.16],[0,.30,z],wood,.025);
  for(const x of [-b.width/2,b.width/2])box(plot,'rounded end cap',[.16,.055,b.depth+.14],[x,.30,0],wood,.025);
  for(const x of [-b.width/2,b.width/2])for(const z of [-b.depth/2,b.depth/2]){
   box(plot,'rounded corner post',[.16,.39,.16],[x,.135,z],endWood,.035);
   for(const y of [.06,.205])oval(plot,'flush joinery peg',[x,y,z+Math.sign(z)*.086],[.019,.019,.004],peg);
  }
  box(plot,'soil held below the timber rim',[b.width-.13,.20,b.depth-.13],[0,soilY-.10,0],soil,.035);
  // Sparse tiny soil grains complement the texture; no coarse bumps on toys.
  const grains=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),crumb,240),dummy=new THREE.Object3D();grains.name='Carrot garden | fine earth grains';
  for(let i=0;i<240;i++){const r=.009+random()*.016;dummy.position.set((random()-.5)*(b.width-.23),soilY+r*.2,(random()-.5)*(b.depth-.23));dummy.scale.set(r,r*.45,r*.75);dummy.rotation.set(random()*3,random()*6,0);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);grains.setColorAt(i,new THREE.Color().setHSL(.08,.21,.23+random()*.10));}grains.receiveShadow=true;plot.add(grains);
  contactShadow(root,b.x,b.z,b.width*.55,b.depth*.63,.30,-.041);
 }

 const source=createPinkCarrotPlushes({detail:'small',pose:'loose',plump:1.48});
 // Merge matching sewn parts once, then share their geometry for every plant.
 // Keep fibre geometry separate because it carries GPU instancing attributes.
 const templates=source.children.map(doll=>{
  const template=new THREE.Group(),materials=new Map();doll.updateMatrixWorld(true);
  const inverse=doll.matrixWorld.clone().invert();
  doll.traverse(o=>{
   if(!o.isMesh)return;
   if(o.userData.pile){const copy=o.clone();copy.frustumCulled=true;template.add(copy);return;}
   const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));
   const item=materials.get(o.material)||{mat:o.material,geometries:[]};item.geometries.push(g);materials.set(o.material,item);
  });
  for(const {mat,geometries} of materials.values()){
   const g=mergeGeometries(geometries,false);for(const piece of geometries)piece.dispose();
   const o=mesh(template,'original wardrobe sewn carrot',g,mat);o.userData.sameWardrobePattern=true;
  }
  return template;
 });
 const plants=[],plantings=gardenPlantings();
 for(const p of plantings){
  const plant=templates[p.index%2].clone(true);plant.name='Carrot garden | planted pink carrot '+(p.index+1);plant.position.set(p.x,p.y,p.z);plant.rotation.set(p.leanX,p.yaw,p.leanZ);plant.scale.setScalar(p.scale);root.add(plant);
  const fibres=[];plant.traverse(o=>{if(o.userData.pile)fibres.push(o);});
  plants.push({root:plant,fibres,world:new THREE.Vector3()});
  // A soft dark contact at the buried tip makes the soil meet the body.
  contactShadow(root,p.x,p.z,.28,.25,.58,soilY+.004);
 }

 // A small engraved sign faces visitors approaching from the porch.
 const sign=group('Mifen garden marker',[-5.70,0,12.12],Math.PI-.13);
 for(const x of [-.57,.57])box(sign,'garden sign post',[.075,1.13,.075],[x,.50,0],endWood,.02);
 box(sign,'rounded timber garden sign',[1.57,.50,.09],[0,.87,0],wood,.075);
 const label=document.createElement('canvas');label.width=1024;label.height=320;const c=label.getContext('2d');
 c.fillStyle='#ead8b4';c.fillRect(0,0,1024,320);c.strokeStyle='#c2a178';c.lineWidth=3;c.strokeRect(24,24,976,272);c.fillStyle='#826449';c.textAlign='center';c.font='600 67px "Microsoft JhengHei", sans-serif';c.fillText('米粉的粉紅蘿蔔園',512,145);c.font='25px Georgia';c.fillStyle='#9a7c61';c.fillText('M I F E N ’ S   L I T T L E   G A R D E N',512,217);
 const labelMap=new THREE.CanvasTexture(label);labelMap.colorSpace=THREE.SRGBColorSpace;labelMap.anisotropy=8;
 const signMat=new THREE.MeshStandardMaterial({map:labelMap,roughness:.9});
 for(const side of [-1,1]){const lettering=mesh(sign,'engraved garden label',new THREE.PlaneGeometry(1.45,.43),signMat);lettering.position.set(0,.87,side*.048);if(side<0)lettering.rotation.y=Math.PI;}

 // A low woven harvest trug sits beside the plot, clear of both walking aisles.
 const basket=group('woven harvest trug',[2.87,-.045,13.30],-.23);
 const wicker=m.material('Garden | honey willow wicker','#bc9561',.87),wickerLight=m.material('Garden | light willow strands','#d1ad78',.89);
 box(basket,'wicker basket bottom',[1.08,.055,.65],[0,.07,0],wicker,.18);
 for(let j=0;j<8;j++){
  const y=.10+j*.039,w=1.08+j*.013,d=.64+j*.010;
  tube(basket,'woven willow horizontal strand',roundLoop(w,d,.18,y),.017,j%2?wicker:wickerLight,true);
 }
 const rim=roundLoop(1.19,.73,.20,.395);tube(basket,'rolled wicker basket lip',rim,.030,wickerLight,true);
 for(let i=0;i<36;i++){
  const a=i/36*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
  tube(basket,'upright willow weave',[[x*.48,.07,z*.26],[x*.54,.24,z*.31],[x*.58,.39,z*.35]],.012,wickerLight);
 }
 for(const x of [-.55,.55])tube(basket,'basket loop handle',[[x,.28,-.14],[x*1.13,.53,-.12],[x*1.13,.54,.12],[x,.28,.14]],.026,wickerLight);
 // Harvested copies lie across the basket, preserving the same faceless toy.
 for(let i=0;i<3;i++){
  const copy=templates[i%2].clone(true);copy.name='Carrot garden | harvested plush carrot';copy.scale.setScalar(.35);copy.rotation.set(.06*(i-1),.10*(i-1),Math.PI/2+.08*(i-1));copy.position.set(.31,.28+i*.087,(i-1)*.15);basket.add(copy);
  const fibres=[];copy.traverse(o=>{if(o.userData.pile)fibres.push(o);});plants.push({root:copy,fibres,world:new THREE.Vector3()});
 }
 contactShadow(root,2.87,13.30,.73,.50,.32,-.043);

 // An enamel watering can completes the gardening corner without blocking it.
 const can=group('cream enamel watering can',[2.70,-.045,12.16],-.35);
 lathe(can,'rounded enamel can',[[.01,.025],[.22,.025],[.27,.08],[.27,.32],[.22,.43],[.17,.45],[.16,.43],[.19,.39],[.23,.30],[.23,.08],[.01,.065]],[0,0,0],m.ceramic);
 tube(can,'curved can handle',[[-.22,.13,0],[-.43,.19,0],[-.43,.47,0],[-.20,.47,0]],.026,m.sage);
 rod(can,'long enamel watering spout',[.19,.12,0],[.56,.47,0],.055,m.ceramic,.040);
 const rose=mesh(can,'brass watering rose',new THREE.CylinderGeometry(.095,.065,.045,24),m.brass);rose.position.set(.58,.49,0);rose.rotation.z=-.80;
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval(can,'pink flower on enamel',[Math.cos(a)*.052,.235+Math.sin(a)*.052,.263],[.036,.036,.006],m.pink);}oval(can,'flower ochre centre',[0,.235,.270],[.020,.020,.005],m.gold);

 // Real fur is visible in the garden; distant fibres are skipped indoors.
 let lastLOD=0;const update=(time,camera)=>{
  if(!camera||time-lastLOD<180)return;lastLOD=time;
  for(const plant of plants){plant.root.getWorldPosition(plant.world);const near=plant.world.distanceToSquared(camera.position)<196;for(const fibre of plant.fibres)fibre.visible=near;}
 };
 root.userData={revision:'pink-carrot-garden-1',sameWardrobePattern:true,faceless:true,beds:4,planted:24,harvested:3,fur:'original curved short-pile fibres',clearCentralPath:2.10};
 return {root,update};
}
