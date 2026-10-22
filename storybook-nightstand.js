import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {woodTexture,ginghamTexture,heartPath,drawFlower} from './storybook-desk.js?revision=nightstand-preview-1';
import {createAssetPricingBook,createShadeFabric} from './bedside-materials.js?revision=nightstand-preview-2';
import {createStarterToyPack} from './starter-toy-pack.js?revision=nightstand-preview-3';
import {createDrawerController} from './nightstand-drawer.js?revision=nightstand-preview-3';

export const NIGHTSTAND_PLACEMENT={position:[-3.925,0,-1.80],rotation:0};

export async function createStorybookNightstand(){
 const root=new THREE.Group();root.name='Left floral hinoki bedside cabinet';
 const timber=woodTexture(),grain=timber.clone();grain.center.set(.5,.5);grain.rotation=Math.PI/2;
 const wood=new THREE.MeshPhysicalMaterial({name:'Bedside | satin hinoki',map:timber,roughness:.63,specularIntensity:.27,clearcoat:.06,clearcoatRoughness:.7});
 const upright=wood.clone();upright.map=grain;
 const edge=wood.clone();edge.color.set('#c9a577');
 const pale=wood.clone();pale.color.set('#fff4dc');
 const pink=new THREE.MeshStandardMaterial({name:'Bedside | dusty rose cotton',color:'#dc9a92',roughness:.88});
 const blush=new THREE.MeshStandardMaterial({name:'Bedside | blush embroidery',color:'#edb8aa',roughness:.9});
 const ivory=new THREE.MeshPhysicalMaterial({name:'Bedside | warm porcelain',color:'#f7e8cd',roughness:.42,specularIntensity:.24});
 const thread=new THREE.MeshStandardMaterial({name:'Bedside | ivory cotton lace',color:'#fff1da',roughness:.94});
 const gold=new THREE.MeshStandardMaterial({name:'Bedside | honey gold',color:'#d7a450',roughness:.46,metalness:.32});
 const check=ginghamTexture(),cotton=new THREE.MeshPhysicalMaterial({name:'Bedside | woven blush gingham',map:check,roughness:.94,specularIntensity:.12});
 const paper=new THREE.MeshStandardMaterial({name:'Bedside | ivory book paper',color:'#eee0c5',roughness:.95});
 const leafMat=new THREE.MeshStandardMaterial({name:'Bedside | soft sage foliage',color:'#819653',roughness:.85,side:THREE.DoubleSide});
 const veinMat=new THREE.MeshStandardMaterial({color:'#adba75',roughness:.9});
 const stemMat=new THREE.MeshStandardMaterial({color:'#6f8046',roughness:.95});
 const shadow=new THREE.MeshStandardMaterial({color:'#96734c',roughness:1});
 const mesh=(parent,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Floral bedside | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(parent,name,size,p,m=wood,r=.025)=>{const o=mesh(parent,name,new RoundedBoxGeometry(...size,4,r),m);o.position.fromArray(p);return o;};
 const oval=(parent,name,p,size,m)=>{const o=mesh(parent,name,new THREE.SphereGeometry(1,24,16),m);o.position.fromArray(p);o.scale.fromArray(size);return o;};
 const tube=(parent,name,points,r,m,closed=false,sides=6)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(20,points.length*2),r,sides,closed),m);
 function panel(parent,name,shape,p,depth,m,bevel=.008){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:24});g.computeBoundingBox();
  const b=g.boundingBox,v=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<v.count;i++)uv.setXY(i,(v.getX(i)-b.min.x)/(b.max.x-b.min.x),(v.getY(i)-b.min.y)/(b.max.y-b.min.y));
  const o=mesh(parent,name,g,m);o.position.fromArray(p);return o;
 }
 function lathe(parent,name,profile,p,m){const o=mesh(parent,name,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),m);o.position.fromArray(p);return o;}
 function flower(parent,p,r,petal=blush,centre=gold){
  const g=new THREE.Group();g.name='Floral bedside | five-petal flower';g.position.fromArray(p);parent.add(g);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const o=oval(g,'stitched flower petal',[Math.sin(a)*r*.56,Math.cos(a)*r*.56,0],[r*.38,r*.46,r*.13],petal);o.rotation.z=-a;}
  oval(g,'flower heart',[0,0,r*.12],[r*.23,r*.23,r*.16],centre);return g;
 }
 function bow(parent,p,scale,ribbonMat=blush,foldMat=pink){
  const g=new THREE.Group();g.name='Floral bedside | soft pink ribbon bow';g.position.fromArray(p);g.scale.setScalar(scale);parent.add(g);
  for(const side of [-1,1]){
   const s=new THREE.Shape();s.moveTo(side*.025,0);s.bezierCurveTo(side*.13,.09,side*.32,.18,side*.35,.10);s.bezierCurveTo(side*.40,-.10,side*.30,-.15,side*.20,-.09);s.lineTo(side*.025,-.025);s.closePath();panel(g,'folded ribbon loop',s,[0,0,0],.045,ribbonMat,.012);
   tube(g,'ribbon seam',[[side*.07,.0,.06],[side*.19,.06,.065],[side*.29,.07,.05]],.006,foldMat);
   const tail=new THREE.Shape();tail.moveTo(side*.03,-.03);tail.bezierCurveTo(side*.08,-.14,side*.13,-.26,side*.13,-.38);tail.lineTo(side*.07,-.33);tail.lineTo(side*.01,-.39);tail.bezierCurveTo(side*.01,-.23,-side*.02,-.12,-side*.02,-.04);tail.closePath();panel(g,'v-cut ribbon tail',tail,[0,0,-.015],.012,ribbonMat,.005);
  }
  oval(g,'gathered ribbon knot',[0,0,.045],[.055,.065,.053],foldMat);return g;
 }
 const roundPerimeter=(t,rx,rz,power=.25)=>{const a=t*Math.PI*2;return [Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**power*rx,Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**power*rz];};
 function cloth(parent,name,p,rx,rz,mat){
  const n=240,positions=[0,-.01,0],uvs=[.5,.5],indices=[],hem=[],scallops=[];
  for(let i=0;i<=n;i++){
   const t=i/n,[x,z]=roundPerimeter(t,rx,rz,.22),flute=.014*(1-Math.cos(t*Math.PI*2*28));
   const y=-.01;positions.push(x,y,z);uvs.push(x/(rx*2)+.5,z/(rz*2)+.5);if(i<n)indices.push(0,i+2,i+1);
   hem.push([x,y-.006,z]);scallops.push([x*(1+flute/rx),y-.017,z*(1+flute/rz)]);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const group=new THREE.Group();group.position.fromArray(p);parent.add(group);mesh(group,name,g,mat);tube(group,'fine cloth piped edge',hem,.008,blush);tube(group,'scalloped ivory lace',scallops,.014,thread);
  return group;
 }

 // Solid side panels continue into soft feet; the cubby is genuinely open.
 for(const x of [-.69,.69]){
  box(root,'solid cabinet side panel',[.15,1.44,1.12],[x,.84,0],upright,.045);
  for(const z of [-.47,.47])box(root,'rounded panel foot',[.16,.25,.18],[x,.137,z],upright,.045);
  box(root,'inset side panel detail',[.016,.90,.81],[x+(x<0?-.08:.08),.86,0],pale,.012);
 }
 box(root,'recessed warm wooden back',[1.26,1.24,.08],[0,.93,-.52],wood,.02);
 box(root,'low open shelf',[1.44,.11,1.14],[0,.265,0],wood,.033);
 // A hollow housing and a complete moving tray, rather than a solid box.
 box(root,'stationary drawer support shelf',[1.39,.055,1.10],[0,1.128,0],wood,.012);
 for(const x of [-.647,.647])box(root,'narrow drawer opening stile',[.035,.40,.04],[x,1.345,.552],shadow,.007);
 const drawer=new THREE.Group();drawer.name='Floral bedside | sliding drawer assembly';root.add(drawer);
 box(drawer,'solid drawer bottom',[1.19,.039,1.032],[0,1.183,.018],pale,.009);
 for(const x of [-.575,.575])box(drawer,'dovetailed drawer side',[.046,.280,1.024],[x,1.324,.018],upright,.009);
 box(drawer,'drawer rear wall',[1.12,.280,.042],[0,1.324,-.473],wood,.008);
 const liner=new THREE.MeshPhysicalMaterial({name:'Drawer | soft blush felt lining',color:'#ead3bf',roughness:1,sheen:.45,sheenColor:new THREE.Color('#ffead8')});
 box(drawer,'soft fitted felt bottom',[1.09,.009,.959],[0,1.208,.031],liner,.014);
 const rail=new THREE.MeshStandardMaterial({name:'Drawer | satin champagne runners',color:'#b4a68b',metalness:.45,roughness:.62});
 for(const x of [-.611,.611]){
  box(root,'fixed concealed drawer runner',[.016,.040,.94],[x,1.244,-.015],rail,.005);
  box(drawer,'telescoping inner drawer runner',[.012,.026,.98],[x,1.244,-.005],rail,.004);
  for(const z of [-.28,.28]){const screw=oval(drawer,'small flush runner screw',[x,1.244,z],[.002,.008,.008],rail);screw.castShadow=false;}
 }
 box(drawer,'rounded drawer front',[1.33,.379,.073],[0,1.345,.584],pale,.037);
 box(drawer,'drawer raised border',[1.26,.314,.016],[0,1.345,.626],edge,.032);
 box(drawer,'drawer inset face',[1.23,.287,.025],[0,1.345,.64],wood,.028);
 lathe(drawer,'flower knob stem',[[.025,0],[.025,.055]],[0,1.345,.667],wood).rotation.x=Math.PI/2;
 const drawerKnob=oval(drawer,'wooden flower drawer pull',[0,1.345,.705],[.078,.078,.045],wood.clone());
 flower(drawer,[0,1.345,.749],.049,blush,ivory);
 const pick=oval(drawer,'flower handle click target',[0,1.345,.750],[.112,.112,.112],new THREE.MeshBasicMaterial({visible:false}));pick.userData.sceneControlPick=true;pick.castShadow=false;pick.receiveShadow=false;
 const toyPack=createStarterToyPack();toyPack.position.set(0,1.225,.031);toyPack.rotation.x=-Math.PI/2;toyPack.scale.setScalar(.72);drawer.add(toyPack);
 root.drawerController=createDrawerController(drawer,[pick],drawerKnob);
 const apron=new THREE.Shape();apron.moveTo(-.66,.34);apron.lineTo(.66,.34);apron.lineTo(.66,.18);apron.bezierCurveTo(.53,.10,.46,.28,.31,.22);apron.bezierCurveTo(.14,.14,.10,.21,0,.19);apron.bezierCurveTo(-.10,.21,-.14,.14,-.31,.22);apron.bezierCurveTo(-.46,.28,-.53,.10,-.66,.18);apron.closePath();panel(root,'gentle scalloped shelf apron',apron,[0,0,.52],.065,wood,.018);
 box(root,'thick round edged tabletop',[1.62,.14,1.32],[0,1.66,0],wood,.064);
 box(root,'tabletop underside moulding',[1.51,.045,1.23],[0,1.571,0],pale,.018);
 const runner=cloth(root,'pink gingham table runner',[0,1.758,0],.715,.545,cotton);
 for(const x of [-.57,-.29,0,.29,.57]){const f=flower(runner,[x,-.006,.505],.026,blush,thread);f.rotation.x=-Math.PI/2;}

 // Real woven strips wrap an open basket, with a soft fabric liner.
 const basket=new THREE.Group();basket.name='Floral bedside | woven storage basket';basket.position.set(-.22,.323,.06);root.add(basket);
 const wicker=new THREE.MeshStandardMaterial({name:'Bedside | honey willow weave',color:'#c89c61',roughness:.91});
 const wickerLight=wicker.clone();wickerLight.color.set('#dfb97e');
 for(const x of [-.365,.365])box(basket,'basket inner side',[.022,.36,.65],[x,.23,0],cotton,.008);
 for(const z of [-.332,.332])box(basket,'basket inner front or back',[.70,.36,.022],[0,.23,z],cotton,.008);
 box(basket,'basket bottom',[.76,.07,.70],[0,.04,0],wicker,.06);
 const segments=144,rows=8;
 for(let row=0;row<rows;row++){
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<=segments;i++){
   const t=i/segments,[x,z]=roundPerimeter(t,.382,.348,.34),bump=.006*Math.cos(t*Math.PI*2*32+row*Math.PI),scale=1+bump/.38;
   positions.push(x*scale,.065+row*.044,z*scale,x*scale,.101+row*.044,z*scale);uvs.push(t*6,0,t*6,1);
   if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();mesh(basket,'interlaced horizontal willow strip',g,row%2?wicker:wickerLight);
 }
 for(let i=0;i<32;i++){
  const t=i/32,[x,z]=roundPerimeter(t,.383,.349,.34),pts=[];
  for(let j=0;j<=32;j++){const y=.06+j/32*.36,s=1+.014*Math.cos(j/32*Math.PI*2*8+i*Math.PI);pts.push([x*s,y,z*s]);}
  tube(basket,'woven vertical willow rib',pts,.009,wickerLight);
 }
 const lining=cotton.clone();lining.side=THREE.DoubleSide;
 const rim=[];for(let i=0;i<=144;i++){const [x,z]=roundPerimeter(i/144,.39,.356,.3);rim.push([x,.445,z]);}tube(basket,'padded gingham basket rim',rim,.028,cotton);
 box(basket,'gingham basket bottom lining',[.70,.025,.63],[0,.084,0],cotton,.04);
 const bib=box(basket,'folded gingham front lining',[.76,.13,.026],[0,.394,.359],lining,.018);
 const lace=[];for(let i=0;i<=80;i++)lace.push([-.37+i/80*.74,.332-.009*(1-Math.cos(i/80*Math.PI*2*12)),.38]);tube(basket,'basket scalloped lace hem',lace,.011,thread);
 for(const x of [-.27,-.09,.09,.27])flower(basket,[x,.37,.381],.021,blush,ivory);

 function book(parent,p,size,color,standing=false){
  const g=new THREE.Group();g.name='Floral bedside | floral cloth book';g.position.fromArray(p);parent.add(g);
  const m=new THREE.MeshStandardMaterial({color,roughness:.88}),[w,h,d]=size;
  if(standing){
   box(g,'upright ivory page block',[h-.018,w-.028,d-.028],[0,0,-.006],paper,.008);
   for(const x of [-h/2,h/2])box(g,'upright cloth book cover',[.018,w+.012,d+.012],[x,0,0],m,.008);
   box(g,'upright rounded book spine',[h+.014,w+.012,.028],[0,0,d/2],m,.012);
   flower(g,[0,-w*.19,d/2+.017],h*.22,blush,ivory);
   panel(g,'small heart on upright book',heartPath(0,0,h*.32),[0,w*.22,d/2+.018],.002,blush,.002);
   return g;
  }
  box(g,'fine ivory page block',[w-.035,h-.02,d-.035],[.007,0,0],paper,.009);
  for(const y of [-h/2,h/2])box(g,'rounded cloth cover',[w+.012,.018,d+.012],[0,y,0],m,.008);
  box(g,'soft cloth book spine',[.024,h+.014,d+.012],[-w/2,0,0],m,.009);
  for(const y of [-h*.22,0,h*.22])tube(g,'fine book page lines',[[w/2-.008,y,-d*.39],[w/2-.008,y,d*.39]],.0012,ivory);
  const f=flower(g,[0,h/2+.014,0],Math.min(w,d)*.13,blush,ivory);f.rotation.x=-Math.PI/2;
  return g;
 }
 book(root,[.35,.643,.15],[.60,.13,.61],'#d99f98',true);
 book(root,[.51,.625,.12],[.56,.11,.58],'#e7d4ad',true);
 const topBook1=book(root,[.335,1.816,.385],[.50,.09,.38],'#dda49c');topBook1.name='Floral bedside | pink tabletop book';topBook1.rotation.y=.19;
 const textbook=await createAssetPricingBook();textbook.position.set(.370,1.886,.380);textbook.rotation.y=-.045;root.add(textbook);

 // Fabric bell shade, open underneath, with rolled scallops and a heart pull.
 const lamp=new THREE.Group();lamp.name='Floral bedside | scalloped gingham bedside lamp';lamp.position.set(-.39,1.745,-.17);root.add(lamp);
 lathe(lamp,'turned hinoki lamp base',[[0,0],[.18,0],[.205,.022],[.207,.06],[.18,.105],[.09,.12],[0,.12]],[0,0,0],wood);
 lathe(lamp,'rounded wooden lamp stem',[[.046,.09],[.048,.14],[.041,.58],[.052,.62]],[0,0,0],upright);
 const lampCloth=createShadeFabric();
 const ribbonCloth=lampCloth.clone();ribbonCloth.name='Bedside | woven blush cotton binding';ribbonCloth.map=null;ribbonCloth.normalMap=null;ribbonCloth.color.set('#e7b6ac');ribbonCloth.emissiveIntensity=0;
 const ribbonFold=ribbonCloth.clone();ribbonFold.color.set('#d9a49c');
 const shadePos=[],shadeUV=[],shadeIndices=[],bottom=[],top=[],n=192,levels=32;
 const shadeRadius=(a,t)=>.348*(1-t)+.205*t+.015*Math.sin(t*Math.PI)+.0027*Math.cos(a*24+.10*Math.sin(t*Math.PI))*(.2+.8*Math.sin(t*Math.PI));
 for(let j=0;j<=levels;j++)for(let i=0;i<=n;i++){
  const t=j/levels,a=i/n*Math.PI*2,scallop=.024*(1-Math.cos(a*12)),r=shadeRadius(a,t);
  const y=.56+t*.49-scallop*(1-t)**6;
  shadePos.push(r*Math.cos(a),y,r*Math.sin(a));shadeUV.push(i/n*2,t);
  if(j===0)bottom.push([r*Math.cos(a),y,r*Math.sin(a)]);if(j===levels)top.push([r*Math.cos(a),y+.008*Math.sin(a*12),r*Math.sin(a)]);
  if(j<levels&&i<n){const k=j*(n+1)+i;shadeIndices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}
 }
 const shadeGeo=new THREE.BufferGeometry();shadeGeo.setAttribute('position',new THREE.Float32BufferAttribute(shadePos,3));shadeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(shadeUV,2));shadeGeo.setIndex(shadeIndices);shadeGeo.computeVertexNormals();mesh(lamp,'open bell shaped gingham shade',shadeGeo,lampCloth);
 for(const binding of [tube(lamp,'scalloped rose shade binding',bottom,.014,ribbonCloth),tube(lamp,'ruffled top shade rim',top,.011,ribbonCloth)]){binding.castShadow=false;binding.receiveShadow=false;}
 const liningShade=lampCloth.clone();liningShade.name='Bedside | separate warm cotton shade lining';liningShade.map=null;liningShade.color.set('#fff0d7');liningShade.side=THREE.BackSide;liningShade.emissiveIntensity=.12;const inner=mesh(lamp,'warm ivory shade lining',shadeGeo,liningShade);inner.scale.set(.984,1,.984);
 // Running stitches follow both bindings, kept in one mesh for inexpensive rendering.
 const stitches=[];
 for(const t of [.035,.975])for(let i=0;i<144;i++){
  const points=[-.0027,.0027].map(delta=>{const a=i/144*Math.PI*2+delta/(t>.5?.21:.34),r=shadeRadius(a,t)+.0019;return new THREE.Vector3(r*Math.cos(a),.56+t*.49-.024*(1-Math.cos(a*12))*(1-t)**6,r*Math.sin(a));});
  const d=points[1].clone().sub(points[0]),g=new THREE.CylinderGeometry(.0008,.0008,d.length(),5,1);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const c=points[0].clone().add(points[1]).multiplyScalar(.5);g.translate(c.x,c.y,c.z);stitches.push(g);
 }
 const sewn=mesh(lamp,'fine running stitches on fabric binding',mergeGeometries(stitches),thread);sewn.castShadow=false;stitches.forEach(g=>g.dispose());
 const bulbMat=new THREE.MeshStandardMaterial({color:'#fff4d4',emissive:'#ffe6ae',emissiveIntensity:.7,roughness:.8});oval(lamp,'warm lamp bulb',[0,.65,0],[.065,.085,.065],bulbMat);
 const lampBow=bow(lamp,[.055,.98,.235],.37,ribbonCloth,ribbonFold);lampBow.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 tube(lamp,'heart pull cord',[[.21,.58,.08],[.21,.40,.08],[.21,.32,.08]],.004,thread);
 panel(lamp,'little blush heart pull',heartPath(0,0,.09),[.21,.29,.068],.024,blush,.006);
 const glow=new THREE.PointLight('#ffdfb0',.42,1.9,2);glow.name='Floral bedside | gentle lamp glow';glow.position.set(0,.54,0);lamp.add(glow);

 // A tiny round ceramic chicken, deliberately sized as a tabletop ornament.
 const chick=new THREE.Group();chick.name='Floral bedside | small chicken keepsake';chick.position.set(-.075,1.744,.135);root.add(chick);
 const chickMat=new THREE.MeshPhysicalMaterial({color:'#fff0bf',roughness:.63,specularIntensity:.20});
 const beak=new THREE.MeshStandardMaterial({color:'#e5ac50',roughness:.68});
 const eye=new THREE.MeshPhysicalMaterial({color:'#30251c',roughness:.2,specularIntensity:.5});
 oval(chick,'little chick rounded body',[0,.105,0],[.115,.115,.086],chickMat);oval(chick,'little chick round head',[0,.218,-.004],[.127,.127,.092],chickMat);
 for(const x of [-1,1]){oval(chick,'tiny folded wing',[x*.105,.09,.012],[.034,.054,.031],chickMat);oval(chick,'tiny golden foot',[x*.063,.023,.065],[.035,.024,.044],beak);oval(chick,'small black bead eye',[x*.045,.226,.079],[.010,.012,.006],eye);oval(chick,'delicate cheek blush',[x*.070,.196,.069],[.016,.007,.003],blush);}
 oval(chick,'round honey beak',[0,.202,.089],[.028,.017,.018],beak);

 // Ivy has curved heart leaves and separate fine veins rather than flat discs.
 const plant=new THREE.Group();plant.name='Floral bedside | heart leaf plant';plant.position.set(.405,1.747,-.31);root.add(plant);
 lathe(plant,'round cream flower pot',[[0,0],[.118,0],[.15,.035],[.16,.24],[.169,.26],[.166,.278],[.148,.278],[.143,.24],[.13,.05],[0,.05]],[0,0,0],ivory);
 const soil=new THREE.MeshStandardMaterial({color:'#7d6748',roughness:1});oval(plant,'recessed pot soil',[0,.249,0],[.143,.009,.143],soil);flower(plant,[0,.125,.157],.045,blush,gold);
 function leaf(p,scale,rotation){
  const leaf=new THREE.Group();leaf.position.fromArray(p);leaf.rotation.set(...rotation);leaf.scale.setScalar(scale);plant.add(leaf);
  const s=heartPath(0,0,1),g=new THREE.ShapeGeometry(s,16),v=g.attributes.position;
  for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i);v.setZ(i,.08*(1-(x/.52)**2)+.12*y*y);}
  g.computeVertexNormals();mesh(leaf,'cupped heart shaped ivy leaf',g,leafMat);
  tube(leaf,'pale leaf midrib',[[0,-.48,.08],[0,-.1,.08],[0,.30,.09]],.009,veinMat);
  for(const side of [-1,1])for(const y of [-.15,.05])tube(leaf,'fine leaf vein',[[0,y,.085],[side*.18,y+.08,.083],[side*.33,y+.17,.075]],.004,veinMat);
 }
 const stems=[[-.15,.56,.03,.25],[.05,.64,-.06,.25],[.22,.49,.0,.24],[-.23,.41,.12,.22],[.10,.40,.19,.23],[.29,.29,.15,.20],[.33,.10,.17,.17],[.32,-.08,.20,.15],[-.07,.48,.23,.21],[.03,.30,.27,.19]];
 stems.forEach(([x,y,z,s],i)=>{tube(plant,'gently arching ivy stem',[[0,.20,0],[x*.4,Math.max(.32,y+.10),z*.4],[x,y+s*.20,z]],.006,stemMat);leaf([x,y,z],s,[-.12+(i%3)*.25,(i%3-1)*.5,(i%2?1:-1)*.32]);});

 // Shallow five-petal porcelain tray with an actual basin and a raised rim.
 const tray=new THREE.Group();tray.name='Floral bedside | flower trinket dish';tray.position.set(-.18,1.751,.43);tray.rotation.y=.16;root.add(tray);
 const trayP=[],trayUV=[],trayI=[],rings=10,ns=80,lip=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=ns;i++){
  const t=j/rings,a=i/ns*Math.PI*2,r=(.119+.016*Math.cos(a*5))*t,y=.012+.04*t**5;
  trayP.push(r*Math.cos(a),y,r*Math.sin(a)*.82);trayUV.push(.5+r*Math.cos(a)*3,.5+r*Math.sin(a)*3);
  if(j===rings)lip.push([r*Math.cos(a),y,r*Math.sin(a)*.82]);
  if(j<rings&&i<ns){const k=j*(ns+1)+i;trayI.push(k,k+ns+2,k+1,k,k+ns+1,k+ns+2);}
 }
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(trayP,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(trayUV,2));tg.setIndex(trayI);tg.computeVertexNormals();const trayMat=ivory.clone();trayMat.side=THREE.DoubleSide;mesh(tray,'petal shaped shallow basin',tg,trayMat);tube(tray,'rounded porcelain petal rim',lip,.009,ivory);
 const jewel=flower(tray,[-.035,.023,.014],.035,blush,gold);jewel.rotation.x=-Math.PI/2;
 for(const x of [.033,.063]){const ring=mesh(tray,'little golden ring',new THREE.TorusGeometry(.022,.004,8,28),gold);ring.position.set(x,.022,-.012);ring.rotation.x=-Math.PI/2;}

 root.position.fromArray(NIGHTSTAND_PLACEMENT.position);root.rotation.y=NIGHTSTAND_PLACEMENT.rotation;
 let meshCount=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 root.userData={revision:'left-nightstand-preview-3',placement:NIGHTSTAND_PLACEMENT,meshCount,triangles,side:'left',rightOriginalPreserved:true,scope:'new left bedside cabinet only',drawer:root.drawerController.state,toyPack:toyPack.userData,bookShift:[-.025,0,.135],lamp:'woven cotton, sewn bindings and warm fixed glow',topBook:textbook.userData};
 return root;
}
