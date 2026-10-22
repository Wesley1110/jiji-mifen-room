import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addGirlHead} from './toy-girl-head.js?revision=nightstand-preview-4';

// The card is upright in XY, with independently modelled toys facing +Z.
// The cabinet lays the complete assembly face-up in its moving drawer.
export function createStarterToyPack(){
 const pack=new THREE.Group();pack.name='Chin | Jiji and Mifen starter toy pack';
 let seed=7619;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mesh=(parent,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Starter pack | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const group=(parent,name,p=[0,0,0])=>{const o=new THREE.Group();o.name='Starter pack | '+name;o.position.fromArray(p);parent.add(o);return o;};
 const oval=(parent,name,p,s,m)=>{const o=mesh(parent,name,new THREE.SphereGeometry(1,32,24),m);o.position.fromArray(p);o.scale.fromArray(s);return o;};
 const box=(parent,name,p,s,m,r=.008)=>{const o=mesh(parent,name,new RoundedBoxGeometry(...s,3,r),m);o.position.fromArray(p);return o;};
 const tube=(parent,name,ps,r,m,segments=36)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps.map(p=>new THREE.Vector3(...p))),segments,r,7,false),m);
 const mat=(name,color,roughness=.75,extra={})=>new THREE.MeshPhysicalMaterial({name:'Toy | '+name,color,roughness,specularIntensity:.25,...extra});
 const skin=mat('soft satin vinyl','#efb69b',.61),hair=mat('soft charcoal moulded hair','#121413',.43,{specularIntensity:.35,clearcoat:.035,clearcoatRoughness:.6});
 const eye=mat('warm dark brown eyes','#24170f',.32,{specularIntensity:.30}),white=mat('eye catchlight','#fff9ed',.48),lip=mat('warm smile','#ac6348',.88);
 const blue=mat('powder blue woven dress','#73aec4',.9,{sheen:.45,sheenColor:new THREE.Color('#b5d4e0'),sheenRoughness:.9});
 const blueHem=mat('sewn blue hem','#71a5bb',.94),cream=mat('ivory canvas purse and sandals','#efe3cb',.83,{sheen:.25});
 const blush=mat('rose felt nose and bow','#df9b9f',.92,{sheen:.4}),gold=mat('honey felt beak and feet','#ecae50',.94);
 const furPink=mat('Mifen fine blush plush','#eab6b0',.98,{sheen:.55,sheenColor:new THREE.Color('#ffded6'),sheenRoughness:.85});
 const furCream=mat('Jiji cream plush','#eddeb6',.98,{sheen:.55,sheenColor:new THREE.Color('#fff4d5'),sheenRoughness:.85});
 const paper=mat('warm textured card edges','#dccba8',.96);

 // Fine woven / felt normals stay shallow. Actual short fibres supply the outline.
 function textileNormal(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),d=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,n=(random()-.5)*10;d.data[i]=128+Math.sin(x*Math.PI/2)*15+n;d.data[i+1]=128+Math.sin(y*Math.PI/2)*15+n;d.data[i+2]=252;d.data[i+3]=255;}ctx.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);t.anisotropy=8;return t;
 }
 const weave=textileNormal();for(const m of [blue,blueHem,cream]){m.normalMap=weave;m.normalScale.set(.24,.24);}
 function microFinish(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),d=x.createImageData(256,256);
  for(let i=0;i<d.data.length;i+=4){d.data[i]=128+(random()-.5)*18;d.data[i+1]=128+(random()-.5)*18;d.data[i+2]=254;d.data[i+3]=255;}x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=8;return t;
 }
 const micro=microFinish();for(const m of [skin,hair,furPink,furCream,blush,gold]){m.normalMap=micro;m.normalScale.setScalar(m===skin?.07:m===hair?.08:.30);}

 function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();return s;}
 function extrude(parent,name,shape,z,depth,m,bevel=.002){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:28});const o=mesh(parent,name,g,m);o.position.z=z;return o;}
 const cardShape=roundedShape(1,1.28,.055);
 const slot=new THREE.Path();slot.moveTo(-.095,.562);slot.lineTo(.095,.562);slot.quadraticCurveTo(.12,.562,.12,.582);slot.quadraticCurveTo(.12,.60,.10,.60);slot.lineTo(.044,.60);slot.bezierCurveTo(.027,.60,.025,.628,0,.628);slot.bezierCurveTo(-.025,.628,-.027,.60,-.044,.60);slot.lineTo(-.10,.60);slot.quadraticCurveTo(-.12,.60,-.12,.582);slot.quadraticCurveTo(-.12,.562,-.095,.562);cardShape.holes.push(slot);
 extrude(pack,'thick rounded cardboard with die-cut hanging slot',cardShape,-.009,.012,paper,.003);
 const art=document.createElement('canvas');art.width=1600;art.height=2048;const ctx=art.getContext('2d');
 ctx.fillStyle='#cfb78a';ctx.fillRect(0,0,1600,2048);
 for(let i=0;i<95000;i++){ctx.fillStyle=random()>.5?'#fff3d718':'#806c4b0c';ctx.fillRect(random()*1600,random()*2048,1+random()*2,1+random()*2);}
 const px=x=>(x+.5)*1600,py=y=>(.64-y)*1600;
 const rect=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(px(x),py(y),w*1600,h*1600,r*1600);};
 rect(-.425,.493,.85,.18,.035);ctx.fillStyle='#f8d631';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#29261c';ctx.stroke();
 rect(-.403,.473,.806,.139,.021);ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle='#171811';ctx.font='900 165px "Arial Black", Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('STARTER PACK!',px(0),py(.401),1235);
 ctx.beginPath();ctx.arc(px(-.408),py(.542),.048*1600,0,Math.PI*2);ctx.fillStyle='#fffdf0';ctx.fill();ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#161713';ctx.font='bold 68px Arial';ctx.fillText('3+',px(-.408),py(.539));
 ctx.beginPath();ctx.arc(px(.366),py(.529),.088*1600,0,Math.PI*2);ctx.fillStyle='#5ba7bd';ctx.fill();ctx.strokeStyle='#f0f5dd';ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.arc(px(.366),py(.529),.081*1600,0,Math.PI*2);ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fffbed';ctx.font='bold 38px Arial';ctx.fillText('STARTER',px(.366),py(.548));ctx.fillText('PACK',px(.366),py(.517));
 ctx.fillStyle='#302c24';ctx.textAlign='right';ctx.font='48px Arial';ctx.fillText('Chin',px(.445),py(.279));
 const printed=new THREE.CanvasTexture(art);printed.colorSpace=THREE.SRGBColorSpace;printed.anisotropy=8;
 const cg=new THREE.ShapeGeometry(cardShape,32),cp=cg.attributes.position,uv=cg.attributes.uv;for(let i=0;i<cp.count;i++)uv.setXY(i,cp.getX(i)+.5,(cp.getY(i)+.64)/1.28);
 const face=mesh(pack,'printed starter pack card',cg,mat('uncoated printed paper','#ffffff',.98,{map:printed}));face.position.z=.007;

 // Close-up sculpt follows the supplied girl's round cheeks and flowing hair.
 const girl=group(pack,'Chin blue dress collectible',[-.178,-.028,.022]);girl.scale.setScalar(.92);
 const sculpt=addGirlHead(girl,{skin,hair,eye,white,lip});
 oval(girl,'short neck',[0,.052,.083],[.028,.047,.028],skin);
 oval(girl,'rounded upper chest',[0,.020,.081],[.077,.043,.040],skin);
 box(girl,'soft bodice',[0,-.027,.080],[.144,.12,.095],blue,.027);
 for(const side of [-1,1]){
  oval(girl,'round shoulder',[side*.074,.016,.079],[.032,.040,.033],skin);
  tube(girl,'blue shoulder strap',[[side*.061,-.020,.131],[side*.063,.047,.100],[side*.067,.043,.058],[side*.069,-.012,.043]],.006,blueHem,28);
  // Tapered curved arms avoid the long rigid sticks of the earlier hand design.
  const c=new THREE.CatmullRomCurve3([[side*.083,.016,.079],[side*.116,-.067,.096],[side*.145,-.155,.122],[side*.163,-.216,.14]].map(p=>new THREE.Vector3(...p)));
  const g=new THREE.TubeGeometry(c,36,1,12,false),v=g.attributes.position;
  for(let j=0;j<=36;j++){const t=j/36,center=c.getPointAt(t),r=.023*(1-t)+.014*t;for(let k=0;k<=12;k++){const i=j*13+k;v.setXYZ(i,center.x+(v.getX(i)-center.x)*r,center.y+(v.getY(i)-center.y)*r,center.z+(v.getZ(i)-center.z)*r);}}g.computeVertexNormals();mesh(girl,'gently curved vinyl arm',g,skin);
  const hand=oval(girl,'soft mitten hand',[side*.167,-.234,.141],[.018,.030,.013],skin);hand.rotation.z=-side*.2;
  oval(girl,'small rounded thumb',[side*.146,-.230,.153],[.009,.018,.008],skin).rotation.z=-side*.36;
 }
 function dressTier(name,top,bottom,rt,rb,phase){
  const p=[],uv=[],ix=[],hem=[];const n=112,levels=14;
  for(let j=0;j<=levels;j++)for(let i=0;i<=n;i++){
   const t=j/levels,a=i/n*Math.PI*2,r=THREE.MathUtils.lerp(rt,rb,t),fold=1+(.065*Math.cos(a*15+phase)+.018*Math.sin(a*7-phase))*(1-t*.25),x=Math.cos(a)*r*fold,z=.081+Math.sin(a)*r*.43*fold,y=THREE.MathUtils.lerp(top,bottom,t)+.0023*Math.cos(a*15+phase)*t**5;
   p.push(x,y,z);uv.push(i/n*3,t);if(j===levels)hem.push([x,y,z]);if(j<levels&&i<n){const k=j*(n+1)+i;ix.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
  }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const m=blue.clone();m.side=THREE.DoubleSide;mesh(girl,name,g,m);tube(girl,name+' turned sewn hem',hem,.0012,blueHem,144);
 }
 dressTier('gathered upper skirt',-.077,-.218,.072,.126,.4);dressTier('middle skirt flounce',-.209,-.345,.119,.159,1.2);dressTier('full lower skirt flounce',-.335,-.474,.152,.194,2.1);
 tube(girl,'thin dress waistband',[[-.073,-.077,.09],[-.057,-.076,.120],[0,-.076,.128],[.057,-.076,.120],[.073,-.077,.09]],.0025,blueHem);
 for(const side of [-1,1]){
  oval(girl,'small lower leg',[side*.064,-.490,.083],[.027,.044,.027],skin);
  oval(girl,'ivory sandal sole',[side*.064,-.550,.11],[.039,.015,.062],cream);
  oval(girl,'foot in sandal',[side*.064,-.532,.116],[.030,.022,.046],skin);
  for(let j=0;j<4;j++)oval(girl,'tiny rounded toes',[side*.064+(j-1.5)*.012,-.533,.151],[.007,.011,.010],skin);
  for(const z of [.097,.130])tube(girl,'soft sandal strap',[[side*.064-.029,-.538,z],[side*.064-.020,-.512,z],[side*.064,-.509,z],[side*.064+.020,-.513,z],[side*.064+.030,-.538,z]],.0065,cream,24);
 }
 // Cream crossbody canvas bag: a broad ribbon strap, gusset and rounded flap.
 const strapCurve=new THREE.CatmullRomCurve3([[-.070,.052,.124],[-.055,-.023,.147],[0,-.122,.160],[.070,-.201,.177]].map(p=>new THREE.Vector3(...p)));
 const sp=[],su=[],si=[];for(let i=0;i<=50;i++){const v=strapCurve.getPoint(i/50),t=strapCurve.getTangent(i/50),q=new THREE.Vector3(-t.y,t.x,0).normalize().multiplyScalar(.008);sp.push(v.x-q.x,v.y-q.y,v.z,v.x+q.x,v.y+q.y,v.z);su.push(0,i/50,1,i/50);if(i<50){const k=i*2;si.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute(su,2));sg.setIndex(si);sg.computeVertexNormals();const strapMat=cream.clone();strapMat.side=THREE.DoubleSide;mesh(girl,'wide ivory crossbody strap',sg,strapMat);
 const bag=group(girl,'little crossbody purse',[.094,-.227,.159]);bag.rotation.z=.10;
 box(bag,'rounded canvas bag',[0,0,0],[.114,.092,.041],cream,.022);
 box(bag,'overlapping rounded bag flap',[0,.020,.024],[.109,.060,.012],cream,.021);
 oval(bag,'ivory bag press stud',[.010,.002,.035],[.008,.008,.003],cream);
 tube(bag,'purse edge seam',[[-.050,.022,.025],[-.048,-.030,.025],[0,-.040,.025],[.046,-.030,.025],[.050,.020,.025]],.001,blueHem,42);

 // Fine merged fibres follow ellipsoid normals. No isolated oversized fur bumps.
 const fluff=[];
 function fuzzy(parent,name,p,s,m,count){
  const o=oval(parent,name,p,s,m);fluff.push({o,count:count*3,m});return o;
 }
 function plushEyes(parent,cx,y,z,spacing,r){for(const side of [-1,1]){oval(parent,'plush shiny bead eye',[cx+side*spacing,y,z],[r,r*1.15,r*.62],eye);oval(parent,'plush eye catchlight',[cx+side*spacing-r*.26,y+r*.36,z+r*.56],[r*.27,r*.30,r*.13],white);}}
 const bunny=group(pack,'Mifen pink bow rabbit',[.307,.030,.027]);bunny.scale.setScalar(.88);
 fuzzy(bunny,'Mifen pear body',[0,.031,.048],[.068,.080,.046],furPink,530);
 fuzzy(bunny,'Mifen round soft head',[0,.139,.057],[.085,.081,.055],furPink,720);
 for(const s of [-1,1]){
  fuzzy(bunny,'Mifen floppy ear',[s*.080,.116,.051],[.024,.080,.026],furPink,240).rotation.z=s*.32;
  fuzzy(bunny,'Mifen relaxed outward arm',[s*.073,.031,.066],[.020,.036,.022],furPink,95).rotation.z=s*.42;
  fuzzy(bunny,'Mifen rounded foot',[s*.039,-.038,.073],[.027,.023,.028],furPink,120);
  oval(bunny,'pink velvet bow loop',[s*.026,.222,.064],[.030,.023,.017],blush).rotation.z=-s*.22;
 }
 oval(bunny,'gathered bow knot',[0,.222,.077],[.011,.014,.012],blush);
 plushEyes(bunny,0,.143,.107,.033,.008);
 oval(bunny,'tiny pink rabbit nose',[0,.124,.113],[.009,.006,.006],blush);
 tube(bunny,'rabbit embroidered mouth',[[0,.120,.112],[0,.108,.113],[-.008,.103,.111]],.0014,lip,14);tube(bunny,'rabbit second smile',[[0,.108,.113],[.008,.103,.111]],.0014,lip,10);
 const chick=group(pack,'Jiji cream chick',[.307,-.451,.027]);chick.scale.setScalar(.90);
 fuzzy(chick,'Jiji round tummy',[0,-.025,.050],[.070,.068,.050],furCream,600);
 fuzzy(chick,'Jiji round head',[0,.055,.056],[.090,.085,.060],furCream,950);
 for(const s of [-1,1]){
  fuzzy(chick,'Jiji little wing',[s*.069,-.032,.055],[.022,.042,.026],furCream,155).rotation.z=s*.3;
  fuzzy(chick,'Jiji golden foot',[s*.040,-.078,.085],[.028,.025,.030],gold,120);
 }
 plushEyes(chick,0,.057,.112,.038,.0075);
 oval(chick,'Jiji upper orange beak',[0,.035,.120],[.021,.012,.014],gold);oval(chick,'Jiji lower beak',[0,.028,.117],[.016,.008,.010],gold);

 // Gentle sculpted colour variation preserves the small forms in the room's
 // broad fill light. It is baked into vertex colours, so the GLB keeps the look
 // without additional lights, render passes, or a custom WebGPU-only shader.
 const tonalMaterials=new Map(),softKey=new THREE.Vector3(-.48,.58,.66).normalize();
 pack.updateMatrixWorld(true);
 for(const model of [girl,bunny,chick])model.traverse(o=>{
  if(!o.isMesh||o.material===eye||o.material===white||o.material===lip)return;
  const g=o.geometry,normal=g.attributes.normal,existing=g.attributes.color,colors=[],nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld),n=new THREE.Vector3();
  for(let i=0;i<normal.count;i++){
   n.fromBufferAttribute(normal,i).applyMatrix3(nm).normalize();const shade=.65+.35*Math.max(0,n.dot(softKey));
   colors.push((existing?.getX(i)??1)*shade,(existing?.getY(i)??1)*shade,(existing?.getZ(i)??1)*shade);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  if(!tonalMaterials.has(o.material)){const m=o.material.clone();m.vertexColors=true;tonalMaterials.set(o.material,m);}o.material=tonalMaterials.get(o.material);
 });

 // Soft grounding on the cardboard, behind the actual 3D figures. These broad
 // low-opacity shadows do not replace the moving scene's real shadow maps.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
 const sx=shadowCanvas.getContext('2d'),gradient=sx.createRadialGradient(64,64,4,64,64,64);
 gradient.addColorStop(0,'rgba(72,49,25,.30)');gradient.addColorStop(.55,'rgba(72,49,25,.18)');gradient.addColorStop(1,'rgba(72,49,25,0)');sx.fillStyle=gradient;sx.fillRect(0,0,128,128);
 const shadowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,toneMapped:false});
 for(const [x,y,w,h] of [[-.178,-.125,.41,.88],[.307,.115,.26,.30],[.307,-.466,.25,.25]]){
  const shadow=mesh(pack,'soft contact shade behind toy',new THREE.PlaneGeometry(w,h),shadowMat);shadow.position.set(x+.008,y-.012,.0085);shadow.castShadow=false;shadow.receiveShadow=false;
 }
 // Bake all wisps per plush material into three inexpensive meshes.
 pack.updateMatrixWorld(true);
 const fibreBuckets=new Map();
 for(const {o,count,m} of fluff){
  if(!fibreBuckets.has(m))fibreBuckets.set(m,[]);const bucket=fibreBuckets.get(m),normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<count;i++){
   const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y),unit=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));
   const center=unit.clone().applyMatrix4(o.matrixWorld),normal=unit.clone().applyMatrix3(normalMatrix).normalize();
   const tangent=new THREE.Vector3().crossVectors(normal,Math.abs(normal.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize(),side=new THREE.Vector3().crossVectors(normal,tangent);
   const len=.0016+random()*.0018,width=.00038+random()*.00022,bend=(random()-.5)*.0013;
   const base=center.clone().addScaledVector(normal,-.00035),mid=center.clone().addScaledVector(normal,len*.62).addScaledVector(tangent,bend),tip=center.clone().addScaledVector(normal,len).addScaledVector(tangent,bend*1.5);
   const p=[base.clone().addScaledVector(side,-width),base.clone().addScaledVector(side,width),mid.clone().addScaledVector(side,-width*.65),mid.clone().addScaledVector(side,width*.65),tip];
   const shadeNormal=new THREE.Vector3(normal.x,normal.y,Math.abs(normal.z)).normalize();
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.flatMap(v=>v.toArray()),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.6,1,.6,.5,1],2));g.setIndex([0,1,2,1,3,2,2,3,4,2,1,0,2,3,1,4,3,2]);g.setAttribute('normal',new THREE.Float32BufferAttribute(Array.from({length:5},()=>shadeNormal.toArray()).flat(),3));bucket.push(g);
  }
 }
 for(const [m,gs] of fibreBuckets){const fm=m.clone();fm.name=m.name+' softly shaded fine short fibres';fm.side=THREE.FrontSide;fm.normalMap=null;const f=mesh(pack,'fine short plush fibres',mergeGeometries(gs),fm);f.castShadow=false;f.receiveShadow=false;gs.forEach(g=>g.dispose());}

 // A miniature laptop is fully three-dimensional, including individual keys.
 const laptop=group(pack,'tiny silver laptop',[.307,-.186,.022]);
 const metal=mat('brushed silver laptop','#a9aaa4',.53,{metalness:.42}),screen=mat('dark laptop screen','#242c2d',.42),keys=mat('charcoal keyboard','#575b58',.8);
 box(laptop,'rounded laptop base',[0,-.023,.055],[.225,.110,.020],metal,.009);
 box(laptop,'keyboard recess',[0,-.002,.067],[.198,.056,.004],keys,.004);
 const keyGeometries=[];for(let row=0;row<4;row++)for(let col=0;col<10;col++){const g=new RoundedBoxGeometry(.015,.009,.002,2,.0014);g.translate((col-4.5)*.019,.018-row*.012,.071);keyGeometries.push(g);}mesh(laptop,'forty individually moulded keyboard keys',mergeGeometries(keyGeometries),metal);keyGeometries.forEach(g=>g.dispose());
 box(laptop,'trackpad outline',[0,-.055,.067],[.064,.026,.002],keys,.004);box(laptop,'silver touchpad',[0,-.055,.0685],[.060,.023,.001],metal,.003);
 const lid=group(laptop,'hinged display',[0,.029,.055]);lid.rotation.x=.60;
 box(lid,'thin screen surround',[0,.054,0],[.223,.111,.013],metal,.008);box(lid,'black screen panel',[0,.055,.007],[.199,.086,.002],screen,.003);
 oval(lid,'tiny webcam',[0,.105,.0078],[.0017,.0017,.0008],keys);
 tube(laptop,'laptop hinge',[[-.092,.029,.055],[.092,.029,.055]],.006,metal,8);

 // Thin clear PET covers: low absorption, rounded sidewall and double formed rim.
 // Avoid screen-space refraction, which obscures these tiny toys on WebGL phones.
 const clear=mat('clear moulded PET','#fff8e5',.15,{transparent:true,opacity:.028,depthWrite:false,side:THREE.DoubleSide,specularIntensity:.3});
 const rim=mat('clear raised blister rim','#f9efd8',.28,{transparent:true,opacity:.38,depthWrite:false});
 const glint=mat('soft plastic edge highlight','#fffdf0',.4,{transparent:true,opacity:.64,depthWrite:false});
 function perimeter(w,h,r){const shape=roundedShape(w,h,r);return shape.getPoints(22);}
 function blister(name,x,y,w,h,z){
  const g=group(pack,name,[x,y,.012]),outer=perimeter(w,h,.046),p=[],uv=[],ix=[],rimLine=[];
  const rings=[{s:1,z:0},{s:.985,z:.012},{s:.955,z:z-.022},{s:.90,z}];
  const n=outer.length;
  for(let j=0;j<rings.length;j++)for(let i=0;i<n;i++){const v=outer[i],l=rings[j];p.push(v.x*l.s,v.y*l.s,l.z);uv.push(i/(n-1),j/3);if(j<3&&i<n-1){const a=j*n+i;ix.push(a,a+1,a+n,a+1,a+n+1,a+n);}if(j===0)rimLine.push([v.x,v.y,.003]);}
  const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(p,3));shell.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));shell.setIndex(ix);shell.computeVertexNormals();const side=mesh(g,'clear thermoformed blister sidewall',shell,clear);side.castShadow=false;side.receiveShadow=false;side.renderOrder=5;
  const lidGeo=new THREE.ShapeGeometry(roundedShape(w*.90,h*.90,.043),28),lid=mesh(g,'thin transparent blister face',lidGeo,clear);lid.position.z=z;lid.renderOrder=6;lid.castShadow=false;lid.receiveShadow=false;
  const rimMesh=tube(g,'double raised packaging rim',rimLine,.0025,rim,128);rimMesh.castShadow=false;rimMesh.receiveShadow=false;
  const second=rimLine.map(([a,b,c])=>[a*.969,b*.980,c+.011]);const r2=tube(g,'inner rounded blister edge',second,.0015,glint,128);r2.castShadow=false;r2.receiveShadow=false;
  const gleam=tube(g,'delicate curved PET highlight',[[-w*.435,-h*.32,z-.004],[-w*.45,0,z],[-w*.435,h*.30,z],[-w*.36,h*.44,z]],.0012,glint,40);gleam.castShadow=false;gleam.receiveShadow=false;
 }
 blister('girl shaped clear compartment',-.18,-.143,.57,.929,.228);
 blister('Mifen clear compartment',.309,.119,.303,.310,.161);
 blister('laptop clear compartment',.309,-.186,.303,.245,.160);
 blister('Jiji clear compartment',.309,-.457,.303,.273,.167);
 pack.userData={revision:'starter-pack-2',reference:'米粉雞雞玩具模型.png',girl:sculpt.userData,mifenArms:'outward-down from shoulders, separate from hanging ears',contents:['Chin in a tiered blue dress with ivory crossbody purse','Mifen pink bow rabbit','miniature silver laptop','Jiji cream chick'],construction:'separate 3D toys, short plush fibres, printed die-cut card and four clear PET compartments',size:[1,1.28,.25],fibres:fluff.reduce((n,f)=>n+f.count,0)};
 return pack;
}
