import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createDresserCompanions} from './dresser-companions.js?revision=companions-3';
import {woodTexture,ginghamTexture,heartPath,drawFlower} from './storybook-desk.js?revision=nightstand-preview-1';

// Freestanding furniture, modelled in local coordinates with its front at +Z.
// The right wall has its window at Z=-1.23..2.43; this cabinet is beyond it.
export const DRESSER_PLACEMENT={position:[4.37,0,5.62],rotation:-Math.PI/2};

export function createStorybookDresser(){
 const root=new THREE.Group();root.name='Window wall | floral hinoki chest';
 let seed=261026;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const material=(name,color,roughness=.8,extra={})=>new THREE.MeshPhysicalMaterial({name:'Dresser | '+name,color,roughness,specularIntensity:.24,...extra});
 const timber=woodTexture(),vertical=timber.clone();vertical.center.set(.5,.5);vertical.rotation=Math.PI/2;
 const wood=material('waxed honey hinoki','#fff5df',.62,{map:timber,clearcoat:.045,clearcoatRoughness:.8});
 const upright=wood.clone();upright.map=vertical;upright.name='Dresser | continuous vertical grain';
 const carved=wood.clone();carved.color.set('#dfc297');
 const dark=material('recessed joinery','#98704a',.95);
 const rose=material('rose cotton ribbon','#db9a9a',.92,{sheen:.45,sheenColor:new THREE.Color('#f7d6ce')});
 const blush=material('blush embroidery','#edb7aa',.9);
 const cream=material('warm ivory ceramic','#f8ebd3',.39,{clearcoat:.1,clearcoatRoughness:.5});
 const lace=material('ivory cotton lace','#f8ead5',.99,{sheen:.45});
 const honey=material('warm daisy pollen','#e9af42',.8);
 const gold=material('satin brass trinkets','#d2a25a',.42,{metalness:.55});
 const green=material('sage leaves','#849854',.87,{side:THREE.DoubleSide});
 const stem=material('olive stems','#6f8149',.92);
 const vein=material('pale leaf veins','#adb76c',.94);
 const petals=material('ivory daisy petals','#fff4da',.82);
 const eye=material('polished brown bead eyes','#241b14',.22,{clearcoat:.3});
 const white=material('eye glint','#fff9e8',.4);
 const check=ginghamTexture();check.wrapS=check.wrapT=THREE.RepeatWrapping;check.repeat.set(1.5,1);
 const cotton=material('woven pink gingham','#fff6ec',.98,{map:check,sheen:.55,sheenColor:new THREE.Color('#fff0df')});
 const tinyNormal=document.createElement('canvas');tinyNormal.width=tinyNormal.height=256;
 const nc=tinyNormal.getContext('2d'),nd=nc.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;nd.data[i]=128+Math.sin(x*Math.PI*.5)*17+(random()-.5)*8;nd.data[i+1]=128+Math.sin(y*Math.PI*.5)*17+(random()-.5)*8;nd.data[i+2]=253;nd.data[i+3]=255;}
 nc.putImageData(nd,0,0);const normal=new THREE.CanvasTexture(tinyNormal);normal.wrapS=normal.wrapT=THREE.RepeatWrapping;normal.repeat.set(5,5);normal.anisotropy=8;
 for(const m of [cotton,rose,blush,lace]){m.normalMap=normal;m.normalScale.setScalar(m===cotton?.24:.15);}
 const group=(parent,name,p=[0,0,0])=>{const g=new THREE.Group();g.name='Dresser | '+name;g.position.fromArray(p);parent.add(g);return g;};
 const mesh=(parent,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Dresser | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(parent,name,s,p,m=wood,r=.03)=>{const o=mesh(parent,name,new RoundedBoxGeometry(...s,4,r),m);o.position.fromArray(p);return o;};
 const oval=(parent,name,p,s,m)=>{const o=mesh(parent,name,new THREE.SphereGeometry(1,28,20),m);o.position.fromArray(p);o.scale.fromArray(s);return o;};
 const tube=(parent,name,ps,r,m,closed=false)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps.map(p=>new THREE.Vector3(...p)),closed),Math.max(16,ps.length*3),r,6,closed),m);
 const rod=(parent,name,a,b,r,m)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),o=mesh(parent,name,new THREE.CylinderGeometry(r,r,v.length(),12),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;};
 const lathe=(parent,name,profile,p,m)=>{const o=mesh(parent,name,new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),48),m);o.position.fromArray(p);return o;};
 function panel(parent,name,s,p,depth,m,bevel=.008){
  const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:28});g.computeBoundingBox();const b=g.boundingBox,v=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<v.count;i++)uv.setXY(i,(v.getX(i)-b.min.x)/(b.max.x-b.min.x),(v.getY(i)-b.min.y)/(b.max.y-b.min.y));
  const o=mesh(parent,name,g,m);o.position.fromArray(p);return o;
 }
 function flower(parent,p,r,mat=blush,count=5){
  const g=group(parent,'embossed flower',p);
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,o=oval(g,'rounded petal',[Math.sin(a)*r*.57,Math.cos(a)*r*.57,0],[r*(count>5?.23:.38),r*.47,r*.14],mat);o.rotation.z=-a;}
  oval(g,'flower centre',[0,0,r*.17],[r*.26,r*.26,r*.18],honey);return g;
 }
 function bow(parent,p,scale,mat=rose){
  const g=group(parent,'gathered ribbon bow',p);g.scale.setScalar(scale);
  for(const side of [-1,1]){
   const s=new THREE.Shape();s.moveTo(side*.025,0);s.bezierCurveTo(side*.12,.09,side*.30,.18,side*.35,.11);s.bezierCurveTo(side*.41,-.09,side*.29,-.14,side*.19,-.08);s.lineTo(side*.025,-.025);s.closePath();panel(g,'padded ribbon loop',s,[0,0,0],.043,mat,.012);
   tube(g,'soft gathered ribbon fold',[[side*.065,0,.061],[side*.16,.035,.072],[side*.28,.067,.055]],.006,blush);
   const t=new THREE.Shape();t.moveTo(side*.025,-.025);t.bezierCurveTo(side*.07,-.12,side*.15,-.24,side*.14,-.36);t.lineTo(side*.08,-.30);t.lineTo(side*.015,-.36);t.bezierCurveTo(side*.015,-.22,-side*.015,-.12,-side*.015,-.04);t.closePath();panel(g,'v-cut ribbon tail',t,[0,0,-.015],.013,mat,.005);
  }
  oval(g,'ribbon knot',[0,0,.047],[.057,.064,.047],mat);return g;
 }
 // A solid cabinet with four distinct drawer fronts, fine shadow gaps, rounded
 // stiles and a scalloped low apron. Front grain follows each horizontal board.
 const carcass=group(root,'cabinet carcass');
 for(const x of [-1.52,1.52]){
  box(carcass,'solid side panel',[.18,2.10,1.27],[x,1.25,-.01],upright,.045);
  box(carcass,'inset side field',[.02,1.60,1.01],[x+Math.sign(x)*.097,1.29,-.01],upright,.02);
  for(const z of [-.53,.53])box(carcass,'rounded solid corner foot',[.22,.40,.23],[x,.22,z],upright,.055);
 }
 box(carcass,'rear panel',[2.92,2.06,.07],[0,1.30,-.61],wood,.018);
 box(carcass,'drawer recess',[2.93,1.91,.07],[0,1.36,.56],dark,.018);
 for(const y of [.48,1.10,1.72,2.27])box(carcass,'drawer opening rail',[2.99,.05,.09],[0,y,.605],wood,.014);
 box(carcass,'top centre drawer stile',[.035,.53,.08],[0,2.00,.61],wood,.006);
 const drawerFaces=[];
 for(const [x,y,w,h,knobs] of [[-.747,1.995,1.445,.50,[0]],[.747,1.995,1.445,.50,[0]],[0,1.407,2.94,.564,[-.78,.78]],[0,.785,2.94,.564,[-.78,.78]]]){
  const d=group(root,'separate drawer front',[x,y,0]);drawerFaces.push(d);
  box(d,'drawer rounded moulding',[w,h,.092],[0,0,.636],carved,.038);
  box(d,'raised hinoki drawer panel',[w-.048,h-.046,.036],[0,0,.687],wood,.033);
  for(const k of knobs){rod(d,'flower pull wooden neck',[k,0,.706],[k,0,.749],.035,wood);oval(d,'flower pull round base',[k,0,.77],[.101,.101,.046],wood);flower(d,[k,0,.816],.060);}
 }
 const apron=new THREE.Shape();apron.moveTo(-1.48,.50);apron.lineTo(1.48,.50);apron.lineTo(1.48,.20);apron.bezierCurveTo(1.35,.32,1.24,.36,1.11,.29);apron.bezierCurveTo(.98,.21,.89,.22,.78,.28);apron.bezierCurveTo(.61,.34,.40,.15,0,.16);apron.bezierCurveTo(-.40,.15,-.61,.34,-.78,.28);apron.bezierCurveTo(-.89,.22,-.98,.21,-1.11,.29);apron.bezierCurveTo(-1.24,.36,-1.35,.32,-1.48,.20);apron.closePath();panel(carcass,'carved scalloped apron',apron,[0,0,.54],.105,wood,.025);
 panel(carcass,'recessed heart in apron',heartPath(0,0,.125),[0,.328,.674],.003,carved,.004);
 box(carcass,'tabletop lower lip',[3.27,.06,1.39],[0,2.305,0],carved,.023);
 box(carcass,'thick rounded hinoki top',[3.48,.17,1.51],[0,2.412,0],wood,.07);

 // Continuous cotton runner: rounded rectangular perimeter, scalloped border,
 // actual open crochet loops and small stitched flowers. No flat decal lace.
 const linen=group(root,'gingham runner and crochet',[0,2.511,0]);
 const perimeter=(t,rx,rz)=>{const a=t*Math.PI*2;return [Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.22*rx,Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.22*rz];};
 const pts=[0,0,0],uvs=[.5,.5],idx=[],rim=[],outer=[],n=384;
 for(let i=0;i<=n;i++){const t=i/n,[x,z]=perimeter(t,1.57,.62),flute=.024*(1-Math.cos(t*Math.PI*2*44)),y=-.001-.002*Math.sin(t*Math.PI*12)**2;pts.push(x,y,z);uvs.push(x/3.14+.5,z/1.24+.5);if(i<n)idx.push(0,i+2,i+1);rim.push([x,y+.003,z]);outer.push([x*(1+flute/1.57),y-.005,z*(1+flute/.62)]);}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));cg.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));cg.setIndex(idx);cg.computeVertexNormals();mesh(linen,'woven pink tablecloth',cg,cotton);tube(linen,'rose hem piping',rim,.009,blush);tube(linen,'scalloped crochet outer edge',outer,.010,lace);
 // Crochet eyelets along each edge; tiny stitches are batched below.
 const stitches=[];
 for(let i=0;i<132;i++){
  const t=i/132,[x,z]=perimeter(t,1.575,.626),[ax,az]=perimeter(t-.001,1.575,.626),[bx,bz]=perimeter(t+.001,1.575,.626),tangent=new THREE.Vector3(bx-ax,0,bz-az).normalize(),out=new THREE.Vector3(tangent.z,0,-tangent.x).normalize(),center=new THREE.Vector3(x,-.008,z),loop=[];
  for(let k=0;k<=12;k++){const a=k/12*Math.PI*2,v=center.clone().addScaledVector(tangent,Math.cos(a)*.014).addScaledVector(out,.015+Math.sin(a)*.018);loop.push([v.x,v.y,v.z]);}
  const o=tube(linen,'open crocheted lace eyelet',loop,.0027,lace);o.castShadow=false;stitches.push(o);
 }
 for(const x of [-1.35,-.99,-.63,-.27,.09,.45,.81,1.17]){const f=flower(linen,[x,.004,.555],.028);f.rotation.x=-Math.PI/2;}
 for(const x of [-1.48,1.48])for(const z of [-.35,0,.35]){const f=flower(linen,[x,.004,z],.027);f.rotation.x=-Math.PI/2;}

 // Cream daisy pitcher: open neck, curved handle, sculpted petals and veined leaves.
 const vase=group(root,'daisy pitcher',[-1.17,2.52,-.10]);
 lathe(vase,'glazed pitcher body',[[0,0],[.14,0],[.205,.04],[.228,.20],[.21,.36],[.153,.47],[.162,.51],[.147,.525],[.129,.51],[.123,.475],[.18,.34],[.19,.17],[.12,.035],[0,.035]],[0,0,0],cream);
 tube(vase,'rounded pitcher handle',[[-.17,.40,0],[-.29,.44,0],[-.34,.32,0],[-.29,.17,0],[-.20,.12,0]],.027,cream);
 flower(vase,[0,.225,.221],.066);
 function leaf(parent,p,size,rot){
  const g=group(parent,'cupped leaf',p);g.rotation.set(...rot);g.scale.setScalar(size);
  const s=new THREE.Shape();s.moveTo(0,-.35);s.bezierCurveTo(-.56,-.05,-.34,.35,0,.62);s.bezierCurveTo(.34,.35,.56,-.05,0,-.35);s.closePath();const geom=new THREE.ShapeGeometry(s,14),v=geom.attributes.position;
  for(let i=0;i<v.count;i++)v.setZ(i,.09*(1-(v.getX(i)/.4)**2)+.06*v.getY(i));geom.computeVertexNormals();mesh(g,'soft sage leaf surface',geom,green);tube(g,'leaf midrib',[[0,-.34,.02],[0,.12,.1],[0,.55,.055]],.011,vein);
  for(const side of [-1,1])for(const y of [-.05,.18])tube(g,'delicate leaf vein',[[0,y,.103],[side*.18,y+.05,.085],[side*.27,y+.12,.05]],.005,vein);return g;
 }
 const daisies=[[-.23,.98,-.02,.16],[.0,1.16,-.08,.155],[.23,1.03,.01,.15],[-.33,.78,.04,.135],[-.10,.81,.15,.14],[.14,.87,.20,.15],[.31,.74,.02,.12],[.02,1.00,.22,.12]];
 daisies.forEach(([x,y,z,r],i)=>{tube(vase,'arching daisy stem',[[0,.38,0],[x*.6,y*.73,z*.65],[x,y,z]],.008,stem);const f=flower(vase,[x,y,z],r,petals,9);f.rotation.set(-.12+i%3*.1,(i%3-1)*.24,(i%2-.5)*.23);leaf(vase,[x*.65,y*.72,z*.6],.23,[-.15,(i%3-1)*.7,(i%2?1:-1)*.70]);});
 for(const [p,r] of [[[-.30,.60,.05],-.85],[[.30,.60,.04],.8],[[.12,.60,.20],.5]])leaf(vase,p,.28,[.05,.2,r]);

 // Framed tulip artwork is painted on textured paper, inset behind real timber.
 const picture=group(root,'standing tulip frame',[-.51,2.52,-.34]);picture.rotation.y=-.06;picture.rotation.x=-.065;
 box(picture,'wooden picture backing',[.65,.87,.047],[0,.44,0],upright,.024);
 const art=document.createElement('canvas');art.width=512;art.height=640;const ac=art.getContext('2d');ac.fillStyle='#faeed8';ac.fillRect(0,0,512,640);ac.fillStyle='#efc9b744';for(let i=0;i<9;i+=2){ac.fillRect(i*64,0,64,640);ac.fillRect(0,i*80,512,80);}ac.fillStyle='#fff3dc';ac.fillRect(55,57,402,526);ac.strokeStyle='#82905b';ac.lineWidth=11;ac.beginPath();ac.moveTo(256,465);ac.bezierCurveTo(250,380,270,303,256,260);ac.stroke();ac.fillStyle='#8a9d60';for(const [x,y,a] of [[217,377,-.6],[293,405,.6]]){ac.beginPath();ac.ellipse(x,y,53,24,a,0,Math.PI*2);ac.fill();}ac.fillStyle='#e9a896';ac.beginPath();ac.moveTo(256,300);ac.bezierCurveTo(190,295,165,228,184,184);ac.quadraticCurveTo(220,170,238,213);ac.quadraticCurveTo(253,141,275,197);ac.quadraticCurveTo(315,157,330,198);ac.bezierCurveTo(348,253,307,297,256,300);ac.fill();
 const artTex=new THREE.CanvasTexture(art);artTex.colorSpace=THREE.SRGBColorSpace;artTex.anisotropy=8;const print=mesh(picture,'tulip print on cotton paper',new THREE.PlaneGeometry(.526,.733),material('tulip print','#ffffff',.95,{map:artTex}));print.position.set(0,.44,.027);
 for(const x of [-.303,.303])box(picture,'picture side moulding',[.055,.855,.055],[x,.44,.037],wood,.011);
 for(const y of [.035,.845])box(picture,'picture cross moulding',[.65,.058,.055],[0,y,.037],wood,.011);
 const easel=box(picture,'folding rear easel',[.20,.51,.025],[0,.25,-.19],wood,.01);easel.rotation.x=-.45;
 bow(picture,[.24,.81,.09],.30);

 // Small chicken ceramic figure, deliberately round-headed with a little beak.
 const chick=group(root,'Jiji cream ceramic figure',[-.72,2.535,.34]);chick.rotation.y=.12;
 oval(chick,'Jiji soft egg silhouette',[0,.23,0],[.205,.235,.145],cream);
 for(const side of [-1,1]){
  oval(chick,'Jiji tiny wing',[side*.185,.12,.013],[.059,.087,.077],cream).rotation.z=side*.24;
  oval(chick,'Jiji smooth padded foot',[side*.104,.048,.123],[.068,.050,.052],honey).rotation.z=-side*.15;
  oval(chick,'Jiji bead eye',[side*.077,.275,.131],[.018,.023,.011],eye);oval(chick,'Jiji catchlight',[side*.077-.005,.283,.141],[.005,.006,.003],white);
 }
 oval(chick,'Jiji short round beak',[0,.227,.154],[.049,.030,.033],honey);

 // Two fabric-covered keepsake boxes with separate fitted lids.
 const boxes=group(root,'stacked keepsake boxes',[.29,2.529,-.18]);
 const floralCanvas=document.createElement('canvas');floralCanvas.width=floralCanvas.height=512;const fc=floralCanvas.getContext('2d');fc.fillStyle='#f4e5c8';fc.fillRect(0,0,512,512);for(let y=60;y<512;y+=143)for(let x=70;x<512;x+=155)drawFlower(fc,x+(y%2)*15,y,19,'#e6b0a0');const floralTex=new THREE.CanvasTexture(floralCanvas);floralTex.colorSpace=THREE.SRGBColorSpace;floralTex.anisotropy=8;
 const floral=material('floral paper keepsake box','#ffffff',.94,{map:floralTex});
 box(boxes,'lower floral storage box',[.72,.30,.49],[0,.15,0],floral,.022);box(boxes,'lower box fitted lid',[.742,.045,.513],[0,.315,0],cream,.014);
 const upper=group(boxes,'slightly turned gingham gift box',[.024,.356,-.01]);upper.rotation.y=-.055;
 box(upper,'gingham box base',[.66,.18,.44],[0,.09,0],cotton,.032);box(upper,'gingham box fitted lid',[.685,.050,.465],[0,.199,0],cotton,.027);panel(upper,'small heart clasp',heartPath(0,0,.075),[0,.105,.231],.013,blush,.005);

 // Amber diffuser, real reed sticks, small label and gathered pink bow.
 const diffuser=group(root,'amber reed diffuser',[.83,2.52,-.25]);
 const amber=material('soft amber glass','#d4b478',.26,{clearcoat:.6,clearcoatRoughness:.24,transparent:true,opacity:.82,depthWrite:false});
 box(diffuser,'rounded diffuser bottle',[.235,.39,.20],[0,.198,0],amber,.028);lathe(diffuser,'glass bottle neck',[[.062,0],[.067,.02],[.061,.10],[.047,.11],[.045,.02]],[0,.38,0],gold);
 box(diffuser,'ivory perfume label',[.132,.169,.004],[0,.205,.104],cream,.008);flower(diffuser,[0,.214,.109],.036);
 const reed=material('natural rattan reeds','#c8a66c',.87);
 for(const [x,y,z] of [[-.14,.97,-.02],[-.045,1.02,.018],[.083,.97,-.03],[.15,.94,.03],[.06,1.02,.013]])rod(diffuser,'rattan fragrance stick',[x*.15,.41,z*.2],[x,y,z],.008,reed);
 bow(diffuser,[0,.397,.116],.34);

 // Flower-shaped trinket bowl is a shallow basin, not a solid flower slab.
 const tray=group(root,'petal jewellery dish',[.57,2.53,.40]);tray.rotation.y=.14;
 const tp=[],tu=[],ti=[],lip=[],ns=100,nr=12;
 for(let j=0;j<=nr;j++)for(let i=0;i<=ns;i++){
  const t=j/nr,a=i/ns*Math.PI*2,r=(.205+.022*Math.cos(a*5))*t,y=.012+.056*t**5;tp.push(r*Math.cos(a),y,r*Math.sin(a)*.75);tu.push(.5+r*Math.cos(a)*2,.5+r*Math.sin(a)*2);
  if(j===nr)lip.push([r*Math.cos(a),y,r*Math.sin(a)*.75]);if(j<nr&&i<ns){const k=j*(ns+1)+i;ti.push(k,k+ns+2,k+1,k,k+ns+1,k+ns+2);}
 }
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(tu,2));tg.setIndex(ti);tg.computeVertexNormals();const dishMat=cream.clone();dishMat.side=THREE.DoubleSide;mesh(tray,'porcelain petal basin',tg,dishMat);tube(tray,'rolled flower rim',lip,.013,cream);
 flower(tray,[-.066,.028,.023],.053).rotation.x=-Math.PI/2;
 for(const x of [.055,.100]){const o=mesh(tray,'small gold ring',new THREE.TorusGeometry(.037,.006,10,32),gold);o.position.set(x,.025,-.017);o.rotation.x=-Math.PI/2;}

 const companions=createDresserCompanions({wood});root.add(companions);

 // Preserve logical subassemblies for later animation, batch only static small
 // details inside each one. This keeps the room inexpensive to render.
 function batch(g){
  for(const c of [...g.children])if(c.isGroup)batch(c);
  const buckets=new Map();
  for(const c of g.children)if(c.isMesh&&!c.userData.pile&&!Array.isArray(c.material)&&!c.material.transparent){const key=c.material.uuid+':'+c.castShadow+':'+c.receiveShadow;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(c);}
  for(const list of buckets.values())if(list.length>=4){
   const geometries=list.map(o=>{o.updateMatrix();const geom=o.geometry.clone().applyMatrix4(o.matrix);return geom.index?geom.toNonIndexed():geom;});
   const merged=mergeGeometries(geometries);if(!merged)continue;const o=mesh(g,'batched '+list[0].material.name,merged,list[0].material);o.castShadow=list[0].castShadow;o.receiveShadow=list[0].receiveShadow;
   for(const item of list){g.remove(item);item.geometry.dispose();}geometries.forEach(geom=>geom.dispose());
  }
 }
 batch(root);root.position.fromArray(DRESSER_PLACEMENT.position);root.rotation.y=DRESSER_PLACEMENT.rotation;root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root);let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.geometry.isInstancedBufferGeometry?o.geometry.instanceCount:1);}});
 root.userData={revision:'window-dresser-3',companions:companions.userData,placement:DRESSER_PLACEMENT,meshCount:meshes,triangles,drawers:4,flowerKnobs:6,carrotCharm:true,windowUnobstructed:true,worldBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},reference:'可愛粉彩花朵衣櫃擺飾.png',details:['hinoki grain','scalloped apron','gingham cotton runner','open crochet lace','daisy pitcher','tulip frame','Jiji ceramic figure','two keepsake boxes','reed diffuser','porcelain trinket dish','Mifen fine plush','carrot fabric charm'],preview:false};
 return root;
}
