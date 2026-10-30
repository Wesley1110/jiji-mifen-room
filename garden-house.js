import * as THREE from 'three/webgpu';
import {housePalette,craft,archShape,archSurround,contactShadow} from './house-craft.js';
import {createHomeEntrance} from './home-entrance.js';
import {createReadingRoom} from './reading-room.js';
import {createPinkCarrotGarden} from './carrot-garden.js?revision=pink-carrot-garden-1';

// Local origin is the bedroom doorway. The visitor's RIGHT is negative X.
export function createGardenHouse(_bedroomWood,{canCloseEntry=()=>true}={}){
 const root=new THREE.Group();root.name='Garden house public rooms';
 const m=housePalette(),{mesh,box,oval,tube,rod,panel,group,lathe}=craft(root,'Garden house');
 let seed=771;const random=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
 function planks(name,x0,x1,z0,z1){
  const nx=Math.round((x1-x0)/.46),nz=Math.ceil((z1-z0)/2.35),w=(x1-x0)/nx,d=(z1-z0)/nz;
  const g=new THREE.BoxGeometry(w-.006,.085,1),floor=new THREE.InstancedMesh(g,m.wood,nx*(nz+1)),dummy=new THREE.Object3D();
  floor.name='Garden house | '+name;let i=0;
  for(let x=0;x<nx;x++){let start=z0,cut=z0+d*(1-(x%3)/3);while(start<z1-.001){const end=Math.min(cut,z1),len=end-start;dummy.position.set(x0+(x+.5)*w,-.0825,(start+end)/2);dummy.scale.set(1,1,len-.008);dummy.updateMatrix();floor.setMatrixAt(i,dummy.matrix);floor.setColorAt(i,new THREE.Color().setRGB(1-(x%3)*.009,1-random()*.028,1-random()*.04));i++;start=end;cut+=d;}}floor.count=i;
  floor.receiveShadow=true;root.add(floor);return floor;
 }
 planks('satin hinoki hallway floor',-5.60,5.60,.26,9.45);
 planks('expanded reading room floor',-13.05,-5.60,3.42,8.30);
 // Walls retain the original gallery plane while the right wing becomes wider.
 box(root,'gallery plaster wall',[.16,4.7,9.10],[5.68,2.31,4.81],m.plaster);
 box(root,'right wall before reading arch',[.16,4.7,3.24],[-5.68,2.31,1.88],m.plaster);
 box(root,'right wall after reading arch',[.16,4.7,1.65],[-5.68,2.31,8.625],m.plaster);
 for(const z of [3.42,8.30])box(root,'extended reading side wall',[7.45,4.7,.16],[-9.325,2.31,z],m.plaster);
 box(root,'hallway ceiling',[11.5,.12,9.20],[0,4.72,4.85],m.plaster);
 box(root,'expanded reading ceiling',[7.50,.12,4.98],[-9.325,4.72,5.86],m.plaster);
 const opening=group('wide rounded reading arch',[-5.68,0,5.65],Math.PI/2);
 const head=archSurround(4.30,4.10,2.68,1.28,1.12,-.04,4.67);
 panel(opening,'plaster curved arch spandrel',head,[0,0,-.08],.16,m.plaster,.004);
 const surround=archSurround(4.42,4.10,2.68,1.28,1.12);
 panel(opening,'wide satin hinoki arch casing',surround,[0,0,-.11],.22,m.horizontal,.023);
 for(const z of [-.14,.14])tube(opening,'fine arch inner bead',archShape(4.18,2.68,.03,1.16).getPoints(100).map(p=>[p.x,p.y,z]),.015,m.pale);
 function panelX(x,z,length){
  box(root,'sage wainscot',[.045,.86,length],[x,.40,z],m.panel,.008);box(root,'slender chair rail',[.08,.065,length],[x,.86,z],m.trim,.018);box(root,'hinoki skirting',[.09,.13,length],[x,.03,z],m.horizontal,.018);
  for(let zz=z-length/2+.35;zz<z+length/2;zz+=.75)box(root,'quiet wainscot batten',[.02,.66,.026],[x+(x<0?.035:-.035),.40,zz],m.trim,.005);
 }
 panelX(5.57,4.81,9.1);panelX(-5.57,1.88,3.24);panelX(-5.57,8.625,1.65);
 for(const z of [3.52,8.20]){
  box(root,'reading sage panel',[7.40,.86,.045],[-9.325,.40,z],m.panel,.007);box(root,'reading chair rail',[7.40,.065,.075],[-9.325,.86,z],m.trim,.018);box(root,'reading skirting',[7.40,.13,.075],[-9.325,.03,z],m.horizontal,.018);
  for(let x=-12.9;x< -5.8;x+=.75)box(root,'reading wainscot batten',[.027,.66,.026],[x,.4,z+(z<5?.035:-.035)],m.trim,.005);
 }
 // Front wall: the wide former window is now a smaller daylight window and
 // a separate full-height arched entrance with no hidden blocking panel.
 for(const [a,b] of [[-5.68,-4.55],[-2.65,-1.80],[2.03,5.68]])box(root,'front exterior plaster pier',[b-a,4.70,.20],[(a+b)/2,2.31,9.45],m.plaster);
 const topFill=new THREE.Shape();topFill.moveTo(-.95,2.45);topFill.lineTo(-.95,4.67);topFill.lineTo(.95,4.67);topFill.lineTo(.95,2.45);topFill.absarc(0,2.45,.95,0,Math.PI,false);topFill.closePath();
 panel(root,'entrance arched wall header',topFill,[-3.60,0,9.35],.20,m.plaster,.002);
 box(root,'front window lower wall',[3.83,.83,.20],[.115,.355,9.45],m.panel);
 box(root,'front window header',[3.83,.53,.20],[.115,4.405,9.45],m.plaster);
 // Reading window wall faces the garden, across the back of the loveseat.
 for(const [a,b] of [[3.42,3.98],[7.72,8.30]])box(root,'reading window side pier',[.20,4.7,b-a],[-13.05,2.31,(a+b)/2],m.plaster);
 box(root,'reading window lower wall',[.20,.97,3.74],[-13.05,.425,5.85],m.panel);
 box(root,'reading window header',[.20,.53,3.74],[-13.05,4.405,5.85],m.plaster);
 const glass=new THREE.MeshPhysicalMaterial({name:'House | clear garden glazing',color:'#eff4dd',transparent:true,opacity:.045,roughness:.18,depthWrite:false,side:THREE.DoubleSide});
 function windowFrame(parent,width){
  for(const x of [-width/2,0,width/2])box(parent,'hinoki window upright',[.085,3.30,.17],[x,2.50,0],m.wood,.018);
  for(const y of [.88,3.25,4.12])box(parent,'hinoki window cross rail',[width+.10,.075,.18],[0,y,0],m.horizontal,.016);
  box(parent,'deep rounded window ledge',[width+.28,.11,.40],[0,.86,-.09],m.horizontal,.04);
  box(parent,'clear window glass',[width-.08,3.15,.012],[0,2.50,.02],glass,.001).castShadow=false;
  rod(parent,'antique brass curtain pole',[-width/2-.20,4.24,-.19],[width/2+.20,4.24,-.19],.024,m.brass);
  for(const x of [-width/2-.24,width/2+.24])oval(parent,'round curtain finial',[x,4.24,-.19],[.058,.058,.058],m.pale);
  for(const side of [-1,1]){
   const geom=new THREE.PlaneGeometry(.58,3.20,26,52),p=geom.attributes.position;
   for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i),gather=.60+.40*Math.abs(v/1.60),xx=side*(width/2-.17)+u*gather;const zz=-.21+Math.cos(u*60)*(.035+Math.abs(v)*.015);p.setXYZ(i,xx,2.56+v+Math.cos(u*35)*.013,zz);}geom.computeVertexNormals();mesh(parent,'soft gathered flax curtain',geom,m.linen);
   for(let i=0;i<5;i++){const ring=mesh(parent,'curtain brass ring',new THREE.TorusGeometry(.034,.006,6,16),m.brass);ring.position.set(side*(width/2-.17)+(i-2)*.105,4.22,-.19);}
   tube(parent,'linen curtain tie',[[side*(width/2-.32),2.26,-.24],[side*(width/2-.17),2.23,-.29],[side*(width/2-.02),2.26,-.24]],.017,m.cream);
  }
 }
 const frontWindow=group('front garden window',[.115,0,9.32]);windowFrame(frontWindow,3.83);
 const sideWindow=group('reading garden window',[-12.92,0,5.85],Math.PI/2);windowFrame(sideWindow,3.74);
 const entry=createHomeEntrance(m,{canClose:canCloseEntry});root.add(entry.root);
 const reading=createReadingRoom(m);root.add(reading.root);
 // Calm ceiling beams and a real linen shade replace the single bare orb.
 for(const z of [1.0,4.9,8.8])box(root,'hall ceiling timber beam',[11.25,.13,.16],[0,4.59,z],m.horizontal,.025);
 for(const x of [-12.6,-9.4,-6.15])box(root,'reading ceiling timber beam',[.14,.13,4.74],[x,4.59,5.86],m.horizontal,.025);
 const pendant=group('linen hall pendant',[0,3.68,4.7]);
 rod(pendant,'braided pendant cord',[0,.40,0],[0,.98,0],.009,m.edge);
 const lampMat=m.linen.clone();lampMat.emissive=new THREE.Color('#e2b581');lampMat.emissiveIntensity=.16;
 mesh(pendant,'wide linen pendant shade',new THREE.CylinderGeometry(.32,.52,.44,64,1,true),lampMat);
 for(const [y,r] of [[-.22,.52],[.22,.32]]){const pts=[];for(let i=0;i<80;i++){const a=i/80*Math.PI*2;pts.push([r*Math.cos(a),y,r*Math.sin(a)]);}tube(pendant,'bound linen shade edge',pts,.014,m.cream,true);}
 const hallLight=new THREE.PointLight('#ffe0b5',12,14,2);hallLight.position.set(0,3.66,4.7);root.add(hallLight);
 const frontLight=new THREE.PointLight('#eef1db',13,13,2);frontLight.position.set(-.2,3.7,8.1);root.add(frontLight);
 const sideLight=new THREE.PointLight('#fff1d8',16,12,2);sideLight.position.set(-11.2,3.65,5.8);root.add(sideLight);
 const sunlight=new THREE.SpotLight('#fff0d4',25,10,1.02,.85,2);sunlight.position.set(-11.2,4.30,7.5);sunlight.target.position.set(-10.6,0,5.6);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);sunlight.shadow.bias=-.00025;sunlight.shadow.normalBias=.02;root.add(sunlight,sunlight.target);
 // Porcelain sconces give the entry a welcoming, warm pool of light.
 for(const x of [-5.0,-2.2]){
  box(root,'porch sconce wood plate',[.19,.31,.045],[x,2.30,9.59],m.wood,.07);
  rod(root,'sconce brass neck',[x,2.30,9.61],[x,2.35,9.80],.022,m.brass);
  const mat=new THREE.MeshStandardMaterial({color:'#f4e6c9',emissive:'#efc082',emissiveIntensity:.55});oval(root,'opal porch sconce',[x,2.42,9.81],[.125,.17,.125],mat);
  const l=new THREE.PointLight('#ffdc9e',2,3.5,2);l.position.set(x,2.42,9.94);root.add(l);
 }
 // Roofs and porch are actual volumes, so the front door opens onto a house.
 const roofMat=m.material('House | muted sage roof','#92967c',.91);roofMat.side=THREE.DoubleSide;
 function roof(name,x0,x1,z0,z1,eave,ridge){
  const cx=(x0+x1)/2;
  if(name!=='entrance canopy')for(const z of [z0+.18,z1-.18]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x0+.15,eave-.15,z,x1-.15,eave-.15,z,cx,ridge-.03,z],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));g.setIndex([0,1,2]);g.computeVertexNormals();const mat=m.plaster.clone();mat.side=THREE.DoubleSide;mesh(root,name+' solid gable wall',g,mat);}
  for(const side of [0,1]){
   const x=side?x1:x0,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x,eave,z0,cx,ridge,z0,cx,ridge,z1,x,eave,z1],3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();mesh(root,name+' roof slope',g,roofMat);
   rod(root,name+' eave fascia',[x,eave,z0],[x,eave,z1],.08,m.horizontal);rod(root,name+' front gable fascia',[x,eave,z1],[cx,ridge,z1],.08,m.horizontal);
   for(let t=.15;t<1;t+=.17)rod(root,name+' quiet roof seam',[THREE.MathUtils.lerp(x,cx,t),THREE.MathUtils.lerp(eave,ridge,t)+.012,z0],[THREE.MathUtils.lerp(x,cx,t),THREE.MathUtils.lerp(eave,ridge,t)+.012,z1],.013,roofMat);
  }
  rod(root,name+' ridge cap',[cx,ridge,z0-.03],[cx,ridge,z1+.03],.07,roofMat);
 }
 roof('main house',-5.90,5.90,.10,9.72,4.82,6.55);
 roof('reading wing',-13.36,-5.4,3.18,8.55,4.82,5.70);
 roof('entrance canopy',-5.76,-1.44,9.57,12.25,3.78,4.55);
 const stone=m.material('Garden | warm limestone','#c6bda6',.95);
 box(root,'level porch stone platform',[4.13,.13,2.90],[-3.60,-.105,10.83],stone,.045);
 for(const x of [-5.35,-1.85]){
  box(root,'porch square hinoki column',[.14,3.71,.14],[x,1.83,11.96],m.wood,.025);
  box(root,'column stone plinth',[.26,.20,.26],[x,.06,11.96],stone,.025);
  tube(root,'curved porch bracket',[[x,2.90,11.96],[x+(x< -3.6?.23:-.23),3.41,11.96],[x+(x< -3.6?.50:-.50),3.69,11.96]],.055,m.horizontal);
 }
 box(root,'porch lintel beam',[3.70,.15,.17],[-3.60,3.69,11.96],m.horizontal,.025);
 const nameCanvas=document.createElement('canvas');nameCanvas.width=512;nameCanvas.height=192;const nc=nameCanvas.getContext('2d');nc.fillStyle='#dfc7a2';nc.fillRect(0,0,512,192);nc.fillStyle='#796143';nc.font='25px Georgia';nc.textAlign='center';nc.fillText('JIJI & MIFEN',256,83);nc.font='18px Georgia';nc.fillText('a little home',256,125);const nt=new THREE.CanvasTexture(nameCanvas);nt.colorSpace=THREE.SRGBColorSpace;
 box(root,'small house name plaque',[.50,.20,.035],[-2.16,1.78,9.58],m.horizontal,.03);const plaque=mesh(root,'house name lettering',new THREE.PlaneGeometry(.46,.174),new THREE.MeshStandardMaterial({map:nt,roughness:.8}));plaque.position.set(-2.16,1.78,9.602);
 // Garden path and planted borders are connected to the porch at floor level.
 const lawn=m.material('Garden | quiet grass','#a0ad7e',1);box(root,'front garden ground',[40,.10,13],[-3,-.115,15.5],lawn,.01);box(root,'side garden ground',[8,.10,11],[-17,-.115,5.3],lawn,.01);
 const pathMat=m.material('Garden | fine warm gravel','#c9c1a8',1);box(root,'walkable gravel garden path',[2.10,.032,6.6],[-3.6,-.04,15.3],pathMat,.09);
 box(root,'cross aisle between carrot beds',[11.80,.028,.82],[-3.6,-.043,15.15],pathMat,.10);
 for(let i=0;i<9;i++){const stoneTile=box(root,'rounded stepping stone',[1.25+random()*.20,.055,.57],[-3.60+(random()-.5)*.12,-.012,12.50+i*.65],stone,.13);stoneTile.rotation.y=(random()-.5)*.10;}
 const bark=m.material('Garden | soft brown branches','#8b7452',.95);
 function shrub(x,z,size){
  oval(root,'dense grounded shrub heart',[x,size*.28-.03,z],[size*.83,size*.44,size*.57],m.green);
  const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),m.green,48),dummy=new THREE.Object3D();leaves.name='Garden | layered living shrub';
  for(let i=0;i<48;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*size;dummy.position.set(x+Math.cos(a)*r,.18+Math.sqrt(Math.max(0,1-r*r/(size*size)))*size*.6+random()*.12,z+Math.sin(a)*r*.68);dummy.scale.set(.12+random()*.16,.08+random()*.12,.12+random()*.13);dummy.rotation.set(random(),a,random());dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.21+random()*.025,.22+random()*.10,.30+random()*.17));}leaves.castShadow=true;leaves.receiveShadow=true;root.add(leaves);contactShadow(root,x,z,size*1.1,size*.8,.22);
 }
 for(const [x,z,s] of [[-6.8,11.0,.72],[-.5,11.1,.72],[-10.7,12.1,.85],[4.2,12.0,.90],[-14.2,5.7,.85]])shrub(x,z,s);
 function tree(x,z,h){
  rod(root,'garden tree trunk',[x,-.05,z],[x,h*.72,z],.12,bark,.065);
  for(const side of [-1,1])rod(root,'tree branch',[x,h*.43,z],[x+side*.63,h*.79,z+.1],.06,bark,.027);
  const geo=new THREE.SphereGeometry(1,14,10),leaves=new THREE.InstancedMesh(geo,m.green,70),dummy=new THREE.Object3D();leaves.name='Garden | leafy tree crown';
  for(let i=0;i<70;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*1.05,y=random();dummy.position.set(x+Math.cos(a)*r,h*.68+y*h*.28,z+Math.sin(a)*r*.7);dummy.scale.set(.21+random()*.18,.12+random()*.14,.22+random()*.16);dummy.rotation.set(random(),a,random());dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.20+random()*.04,.26,.38+random()*.16));}leaves.castShadow=true;root.add(leaves);contactShadow(root,x,z,1.2,.9,.28);
 }
 for(const [x,z,h] of [[-10.7,15.5,3.8],[5.0,11.2,4.0],[-15.8,7.5,3.3],[-12.8,16.5,4.3],[7.8,17.2,4.1]])tree(x,z,h);
 // Layer the view beyond the garden fence; the path does not terminate in a
 // blank sky panel at eye level. Distant shapes remain outside walking bounds.
 const distantGreen=m.material('Garden | distant soft green hills','#b4c3a2',1);
 for(const [x,z,s] of [[-12,23,7],[-3.5,24.2,8],[6.5,23.4,7]])oval(root,'soft distant garden hill',[x,.15,z],[s,1.9,s*.38],distantGreen);
 for(const [x,z,h] of [[-8,21.0,3.8],[-.1,21.5,4.4],[5.5,22,3.7],[-15,21.7,4.0]])tree(x,z,h);
 for(const side of [-1,1])for(let i=0;i<8;i++){
  const x=-3.6+side*(1.42+random()*.27),z=12.9+i*.59,y=.22+random()*.19;rod(root,'garden daisy stem',[x,-.02,z],[x,y,z],.009,m.green);
  for(let k=0;k<7;k++){const a=k*Math.PI*2/7;oval(root,'garden daisy petal',[x+Math.cos(a)*.06,y,z+Math.sin(a)*.06],[.046,.014,.025],m.ceramic).rotation.y=-a;}oval(root,'garden daisy centre',[x,y+.012,z],[.028,.018,.028],m.gold);
 }
 for(let x=-18;x<10;x+=.62)box(root,'garden boundary pale picket',[.10,.83,.065],[x,.37,18.65],m.trim,.035);
 for(const y of [.18,.56])box(root,'garden boundary rail',[28,.07,.07],[-4,y,18.7],m.trim,.014);
 const skyCanvas=document.createElement('canvas');skyCanvas.width=32;skyCanvas.height=512;const sc=skyCanvas.getContext('2d'),sg=sc.createLinearGradient(0,0,0,512);sg.addColorStop(0,'#bcd6d8');sg.addColorStop(.64,'#e1e9da');sg.addColorStop(1,'#f1e4cb');sc.fillStyle=sg;sc.fillRect(0,0,32,512);const skyMap=new THREE.CanvasTexture(skyCanvas);skyMap.colorSpace=THREE.SRGBColorSpace;
 const sky=new THREE.MeshBasicMaterial({map:skyMap,side:THREE.DoubleSide});box(root,'far garden backdrop',[55,20,.10],[-2,7,27.0],sky).castShadow=false;box(root,'side garden backdrop',[.10,20,40],[-25,7,10],sky).castShadow=false;
 const sunGarden=new THREE.SpotLight('#fff3dc',48,20,1.12,.70,2);sunGarden.position.set(-7,7.4,12.4);sunGarden.target.position.set(-3.6,0,14.6);sunGarden.castShadow=true;sunGarden.shadow.mapSize.set(1024,1024);sunGarden.shadow.bias=-.00025;sunGarden.shadow.normalBias=.018;sunGarden.shadow.radius=3;root.add(sunGarden,sunGarden.target);
 const carrots=createPinkCarrotGarden(m);root.add(carrots.root);
 root.userData={revision:'pink-carrot-garden-1',hallway:true,readingWing:{x:[-13.05,-5.68],z:[3.42,8.30]},entry:true,porch:true,garden:true,carrots:carrots.root.userData,preview:false};
 root.houseController={root,entry,reading,carrots,pickTargets:[...entry.pickTargets,...reading.pickTargets],update:(time,camera)=>{entry.update(time);carrots.update(time,camera);}};
 return root;
}
