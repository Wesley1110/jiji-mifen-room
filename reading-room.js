import * as THREE from 'three/webgpu';
import {craft,roundedShape,archShape,roundLoop,pillowGeometry,contactShadow} from './house-craft.js';

export function createReadingRoom(m){
 const root=new THREE.Group();root.name='Garden reading living room';
 const {mesh,box,oval,tube,rod,panel,lathe,group}=craft(root,'Reading room');
 const bench=group('Hinoki cushioned loveseat',[-11.98,0,5.8],Math.PI/2);
 // A proper timber frame, rounded rails and turned legs support the cushions.
 for(const x of [-1.42,1.42])for(const z of [-.47,.49]){
  lathe(bench,'turned hinoki leg',[[.095,0],[.12,.04],[.105,.10],[.075,.20],[.10,.35],[.11,.57]],[x,0,z],m.wood);
  box(bench,'foot felt pad',[.15,.025,.15],[x,-.012,z],m.edge,.02);
 }
 box(bench,'solid seat apron',[3.10,.24,1.20],[0,.58,0],m.horizontal,.07);
 box(bench,'rounded seat deck',[3.28,.13,1.32],[0,.73,0],m.horizontal,.065);
 for(const x of [-1.48,1.48]){
  box(bench,'back upright',[.15,1.27,.15],[x,1.15,-.49],m.wood,.045);
  oval(bench,'rounded post cap',[x,1.82,-.49],[.105,.11,.105],m.pale);
  rod(bench,'front arm support',[x,.72,.43],[x,1.32,.43],.066,m.wood);
  tube(bench,'curved solid wood arm',[[x,1.54,-.49],[x,1.48,-.14],[x,1.34,.45],[x,1.29,.57]],.092,m.horizontal);
 }
 for(let x=-1.2;x<=1.2;x+=.30)box(bench,'rounded back spindle',[.085,.58,.09],[x,1.18,-.52],m.wood,.04);
 tube(bench,'gently bowed top rail',[[-1.45,1.65,-.52],[-.8,1.77,-.55],[0,1.80,-.56],[.8,1.77,-.55],[1.45,1.65,-.52]],.10,m.horizontal);
 for(const x of [-.74,.74]){
  const seat=mesh(bench,'deep plump linen seat',pillowGeometry(1.43,.31,1.19),m.cream);seat.position.set(x,.925,.015);
  const seam=tube(bench,'seat welt seam',roundLoop(1.36,1.12,.20,.91),.011,m.linen,true);seam.position.x=x;
  const back=mesh(bench,'soft lumbar back cushion',pillowGeometry(1.39,.70,.32),m.cream);back.position.set(x,1.34,-.40);back.rotation.x=-.13;
 }
 for(const [x,y,z,color,rz] of [[-1.02,1.35,.04,m.sage,-.15],[1.0,1.34,.04,m.rose,.13]]){
  const g=group('loose feather pillow',[x,y,z],0,bench);g.rotation.z=rz;g.rotation.x=-.19;
  mesh(g,'soft square woven pillow',pillowGeometry(.64,.64,.24),color);
  const pts=roundedShape(.58,.58,.11).getPoints(64).map(v=>[v.x,v.y,.078]);tube(g,'pillow corded edge',pts,.008,m.linen,true);
  // Tiny embroidery reads as stitching, without covering the cotton in print.
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5;oval(g,'embroidered daisy petal',[Math.cos(a)*.055,Math.sin(a)*.055,.123],[.04,.022,.003],m.linen).rotation.z=a;}
  oval(g,'embroidered centre',[0,0,.126],[.022,.022,.003],m.gold);
 }
 // A continuous draped blanket: over the back cushion, across the seat, then
 // gravity pulls the edge down the front. Folds share one cloth surface.
 const cloth=new THREE.PlaneGeometry(.84,1.98,28,60),cp=cloth.attributes.position;
 const profileCurve=new THREE.CatmullRomCurve3([[0,1.72,-.46],[0,1.60,-.19],[0,1.22,-.13],[0,1.105,.05],[0,1.105,.43],[0,1.02,.64],[0,.78,.72],[0,.28,.76]].map(p=>new THREE.Vector3(...p)),false,'centripetal');
 for(let i=0;i<cp.count;i++){
  const u=cp.getX(i),t=THREE.MathUtils.clamp((cp.getY(i)+.99)/1.98,0,1),p=profileCurve.getPoint(t),fold=Math.sin(u*29+t*3)*.019+Math.sin(u*53-t*3)*.006;
  cp.setXYZ(i,u+.15,p.y+fold,p.z+Math.sin(u*20)*.013);
 }
 cloth.computeVertexNormals();const throwMat=m.rose.clone();throwMat.side=THREE.DoubleSide;mesh(bench,'naturally draped rose throw',cloth,throwMat);
 for(let i=0;i<23;i++){const x=-.27+i*.037;tube(bench,'throw knotted fringe',[[x,.31,.75],[x+.007,.25,.76],[x+.012,.19+Math.sin(i)*.015,.775]],.004,m.rose);}
 contactShadow(root,-11.98,5.8,1.10,1.9,.38,.060);

 // Thick wool rug, with a rounded bound perimeter and sparse stitched sprigs.
 const rug=group('Scalloped wool rug',[-10.65,.005,5.8]);
 const shape=new THREE.Shape();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,k=1+.010*Math.cos(a*24);const x=Math.cos(a)*2.13*k,y=Math.sin(a)*1.95*k;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
 const pad=panel(rug,'dense wool rug body',shape,[0,.015,0],.035,m.rug,.018);pad.rotation.x=Math.PI/2;
 const binding=[];for(let i=0;i<150;i++){const a=i/150*Math.PI*2;binding.push([2.09*Math.cos(a),.035,1.91*Math.sin(a)]);}tube(rug,'woven bound perimeter',binding,.022,m.cream,true);
 for(const a of [-.5,.7,2.4,3.7]){
  const cx=Math.cos(a)*1.84,cz=Math.sin(a)*1.67;
  for(let j=0;j<5;j++){const p=j*Math.PI*2/5;oval(rug,'embroidered flower stitch',[cx+Math.cos(p)*.055,.052,cz+Math.sin(p)*.055],[.045,.004,.025],m.pink).rotation.y=-p;}
  oval(rug,'embroidered flower centre',[cx,.056,cz],[.021,.004,.021],m.gold);
 }

 const table=group('Oval hinoki tea table',[-9.65,0,5.8],Math.PI/2);
 for(const x of [-.64,.64])for(const z of [-.34,.34])rod(table,'splayed taper leg',[x*1.08,.02,z*1.08],[x,.55,z],.055,m.wood,.08);
 box(table,'under-top stretcher',[1.32,.15,.69],[0,.47,0],m.horizontal,.065);
 const topShape=new THREE.Shape();topShape.absellipse(0,0,.97,.62,0,Math.PI*2,false);
 const edge=panel(table,'rounded oval tabletop',topShape,[0,.65,0],.10,m.horizontal,.035);edge.rotation.x=Math.PI/2;
 const inner=new THREE.Shape();inner.absellipse(0,0,.90,.55,0,Math.PI*2,false);const face=panel(table,'subtle inset top field',inner,[0,.686,0],.006,m.horizontal,.008);face.rotation.x=Math.PI/2;
 contactShadow(root,-9.65,5.8,.94,1.25,.42,.061);
 // Tiny ceramic service, with hollow cup rims, tea and individual handles.
 function cup(parent,x,z){
  lathe(parent,'hand thrown tea cup',[[.035,0],[.085,.015],[.098,.11],[.094,.15],[.080,.15],[.078,.12],[.066,.032],[.035,.025]],[x,.708,z],m.ceramic);
  lathe(parent,'ceramic saucer',[[0,0],[.10,0],[.14,.012],[.145,.022],[.11,.024],[0,.012]],[x,.688,z],m.ceramic);
  const tea=new THREE.MeshStandardMaterial({color:'#805335',roughness:.26});const liquid=mesh(parent,'warm tea',new THREE.CircleGeometry(.078,32),tea);liquid.rotation.x=-Math.PI/2;liquid.position.set(x,.828,z);
  const pts=[];for(let i=0;i<=24;i++){const a=-Math.PI/2+i*Math.PI/24;pts.push([x+.087+Math.cos(a)*.065,.785+Math.sin(a)*.055,z]);}tube(parent,'ceramic cup handle',pts,.013,m.ceramic);
 }
 cup(table,-.48,.10);cup(table,.41,-.20);
 const book=group('open linen bound book',[.15,.70,.16],-.24,table);
 box(book,'book cover',[.55,.026,.39],[0,0,0],m.sage,.012);
 for(const sign of [-1,1]){
  const geo=new THREE.PlaneGeometry(.255,.365,16,12),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const u=(p.getX(i)+.1275)/.255;p.setXYZ(i,sign*(.012+u*.255),.025+Math.sin(u*Math.PI)*.028,p.getY(i));}geo.computeVertexNormals();
  const paper=m.paper.clone();paper.side=THREE.DoubleSide;mesh(book,'curving open page',geo,paper);
  for(let line=0;line<9;line++)tube(book,'subtle printed text line',[[sign*.045,.052,-.12+line*.027],[sign*.12,.054,-.12+line*.027],[sign*.222,.039,-.12+line*.027]],.0013,m.edge);
 }
 box(book,'rose ribbon bookmark',[.022,.004,.46],[.018,.032,.035],m.rose,.001);

 const shelf=group('Low arched library cabinet',[-8.18,0,3.77]);
 for(const x of [-1.03,1.03])box(shelf,'rounded cabinet foot',[.16,.23,.43],[x,.10,0],m.wood,.06);
 box(shelf,'recessed cabinet back',[2.16,1.29,.06],[0,.83,-.24],m.inner,.02);
 for(const x of [-1.07,1.07])box(shelf,'upright library stile',[.13,1.33,.51],[x,.85,0],m.wood,.035);
 for(const y of [.25,.85,1.49])box(shelf,'solid hinoki shelf',[2.15,.075,.50],[0,y,0],m.horizontal,.024);
 box(shelf,'rounded cabinet crown',[2.35,.12,.59],[0,1.58,0],m.horizontal,.055);
 box(shelf,'middle partition',[.075,1.23,.46],[0,.87,0],m.wood,.018);
 const colors=['#b0b69a','#dab5a0','#c8b39b','#b7bdac','#d4b3ad','#e5d2b0'];
 function closedBook(parent,x,y,z,height,width,angle,color,title){
  const g=group('cloth bound '+title,[x,y,z],0,parent);g.rotation.z=angle;
  const cover=m.material('Book | '+title,color,.88);box(g,'page block',[width-.025,height-.04,.29],[0,height/2,0],m.paper,.004);
  for(const dx of [-width/2,width/2])box(g,'cloth cover board',[.013,height,.325],[dx,height/2,0],cover,.004);
  box(g,'rounded cloth spine',[width+.008,height,.025],[0,height/2,.154],cover,.009);
  for(const yy of [.10,height-.09])box(g,'fine spine foil band',[width*.72,.009,.004],[0,yy,.169],m.brass,.001);
 }
 for(let i=0;i<6;i++)closedBook(shelf,-.91+i*.144,.892,0,.42+(i%3)*.045,.11,i===5?-.12:0,colors[i],'garden volume');
 for(let i=0;i<4;i++)closedBook(shelf,.20+i*.18,.292,0,.41+(i%2)*.065,.13,i===0?.13:0,colors[(i+2)%6],'stories');
 // Real interwoven basket strips, restrained density, plus a folded liner.
 const basket=group('woven linen basket',[-.52,.30,.02],0,shelf);
 box(basket,'basket core',[.78,.40,.36],[0,.20,0],m.edge,.06);
 for(let y=.05;y<.41;y+=.046){const pts=roundLoop(.79,.37,.07,y);tube(basket,'horizontal wicker weave',pts,.014,m.horizontal,true);}
 for(let x=-.33;x<.36;x+=.075)tube(basket,'upright wicker strap',[[x,.04,.186],[x+.008,.19,.198],[x,.40,.186]],.012,m.pale);
 box(basket,'folded cotton basket rim',[.82,.065,.39],[0,.41,0],m.cream,.025);
 tube(basket,'leather loop handle',[[-.10,.30,.206],[-.09,.20,.235],[.09,.20,.235],[.10,.30,.206]],.014,m.edge);
 const frame=group('small botanical picture',[.49,.91,.19],0,shelf);
 box(frame,'framed linen art',[.63,.48,.045],[0,.24,0],m.horizontal,.026);box(frame,'linen mat',[.54,.39,.009],[0,.24,.029],m.linen,.01);
 tube(frame,'embroidered botanical stem',[[0,.08,.037],[.012,.22,.037],[-.025,.38,.037]],.006,m.green);
 for(const [x,y,r] of [[-.05,.17,-.7],[.06,.24,.6],[-.05,.30,-.7]]){const leaf=oval(frame,'botanical fabric leaf',[x,y,.04],[.055,.024,.004],m.sage);leaf.rotation.z=r;}
 contactShadow(root,-8.18,3.77,1.35,.58,.32);

 const vase=group('daisy bud vase',[-8.88,1.65,3.77]);
 lathe(vase,'glazed porcelain bud vase',[[.07,0],[.14,.04],[.15,.19],[.075,.28],[.067,.37],[.053,.37],[.055,.29]],[0,0,0],m.ceramic);
 for(const [x,y,z] of [[-.11,.68,0],[.10,.76,.04],[.05,.56,-.06]]){
  tube(vase,'daisy stem',[[0,.28,0],[x*.3,y*.65,z],[x,y,z]],.009,m.green);
  const flower=group('daisy',[x,y,z],0,vase);flower.rotation.x=-.10;
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const petal=oval(flower,'ivory daisy petal',[Math.cos(a)*.09,Math.sin(a)*.09,0],[.065,.028,.014],m.ceramic);petal.rotation.z=a;}
  oval(flower,'golden pollen',[0,0,.017],[.045,.045,.024],m.gold);
 }

 const lamp=group('Linen reading floor lamp',[-12.02,0,7.82]);
 lathe(lamp,'turned wooden lamp base',[[0,0],[.32,.01],[.34,.055],[.29,.12],[.12,.17],[.07,.23]],[0,0,0],m.horizontal);
 rod(lamp,'slender brushed brass stem',[0,.19,0],[0,2.23,0],.027,m.brass);
 const shadeMat=m.linen.clone();shadeMat.name='Reading lamp | lit woven flax';shadeMat.emissive=new THREE.Color('#e9b677');shadeMat.emissiveIntensity=.23;
 const shadeGeo=new THREE.CylinderGeometry(.28,.49,.62,80,12,true),sp=shadeGeo.attributes.position;
 for(let i=0;i<sp.count;i++){const a=Math.atan2(sp.getZ(i),sp.getX(i)),y=sp.getY(i),pleat=1+.025*Math.cos(a*36);sp.setXYZ(i,sp.getX(i)*pleat,y+(y<-.28?Math.cos(a*12)*.017:0),sp.getZ(i)*pleat);}shadeGeo.computeVertexNormals();
 const shade=mesh(lamp,'pleated woven lampshade',shadeGeo,shadeMat);shade.position.y=2.25;
 for(const [y,r] of [[1.94,.49],[2.56,.28]]){const pts=[];for(let i=0;i<100;i++){const a=i/100*Math.PI*2;pts.push([Math.cos(a)*r,y+Math.cos(a*12)*(y<2?.017:0),Math.sin(a)*r]);}tube(lamp,'fabric shade binding',pts,.012,m.cream,true);}
 const bulbMat=new THREE.MeshStandardMaterial({color:'#fff0d4',emissive:'#ffce89',emissiveIntensity:1.2});oval(lamp,'frosted bulb',[0,2.14,0],[.095,.13,.095],bulbMat);
 const light=new THREE.PointLight('#ffdcac',5.0,5.5,2);light.position.set(0,2.14,0);lamp.add(light);
 tube(lamp,'brass pull chain',[[.19,2.12,0],[.19,1.78,0],[.19,1.60,0]],.006,m.brass);
 const pull=oval(lamp,'wooden pull toggle',[.19,1.56,0],[.034,.065,.034],m.pale);
 const proxy=mesh(lamp,'lamp switch target',new THREE.SphereGeometry(.18,16,12),new THREE.MeshBasicMaterial({visible:false}));proxy.position.copy(pull.position);proxy.userData.sceneControlPick=true;proxy.userData.houseAction='lamp';proxy.castShadow=false;
 let lit=true;const toggleLamp=()=>{lit=!lit;light.intensity=lit?5:0;shadeMat.emissiveIntensity=lit?.23:0;bulbMat.emissiveIntensity=lit?1.2:0;};
 root.userData={revision:'reading-room-1',style:'hinoki and woven linen',bench:true,teaTable:true,bookcase:true};
 return {root,pickTargets:[proxy],toggleLamp,get lampOn(){return lit;}};
}
