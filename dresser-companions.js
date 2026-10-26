import * as THREE from 'three/webgpu';
import {attribute,cameraPosition,materialColor,mix,modelWorldMatrixInverse,positionGeometry,transformNormalToView,uv,vec4} from 'three/tsl';
import {makeFiberNap} from './fur.js?revision=plush-touch-1';

// Sculpted toy-scale companions for the floral chest. The original reference
// has a squat torso, a rounded triangular face and broad sagittal ear planes.
export function createDresserCompanions({wood}){
 const root=new THREE.Group();root.name='Dresser | reference-shaped plush companions v3';
 let seed=260110;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const mat=(name,color,extra={})=>new THREE.MeshPhysicalMaterial({name:'Dresser toy | '+name,color,roughness:.97,specularIntensity:.13,...extra});
 const nap=makeFiberNap();nap.repeat.set(1.6,1.6);
 const pink=mat('peach pink fleece','#efbfb1',{normalMap:nap,normalScale:new THREE.Vector2(.65,.65),sheen:.7,sheenColor:new THREE.Color('#fbdaca'),sheenRoughness:1});
 const apricot=mat('soft apricot velour','#ed9b58',{normalMap:nap,normalScale:new THREE.Vector2(.45,.45),sheen:.55,sheenColor:new THREE.Color('#ffd9af')});
 const sage=mat('sage felt leaves','#93ab65',{normalMap:nap,normalScale:new THREE.Vector2(.4,.4),sheen:.45});
 const rose=mat('dusty pink ribbon','#e6a4a8',{normalMap:nap,normalScale:new THREE.Vector2(.3,.3),sheen:.5});
 const roseFold=mat('ribbon gathered seam','#cc9295');
 const noseMat=mat('pink felt nose','#d78e89',{sheen:.3});
 const cocoa=mat('fine cocoa embroidery','#845947');
 const seam=mat('apricot running stitches','#cc905e');
 const eyes=mat('small glass bead eyes','#241b16',{roughness:.23,specularIntensity:.45,clearcoat:.32});
 const glint=mat('soft eye catchlight','#fff7e8',{roughness:.5});
 const mesh=(p,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Dresser toy | '+name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 const group=(p,name,xyz)=>{const g=new THREE.Group();g.name='Dresser toy | '+name;g.position.fromArray(xyz);p.add(g);return g;};
 const oval=(p,name,xyz,rad,m,shape)=>{
  const geo=new THREE.SphereGeometry(1,64,48),v=geo.attributes.position;
  for(let i=0;i<v.count;i++){let x=v.getX(i),y=v.getY(i),z=v.getZ(i);if(shape)[x,y,z]=shape(x,y,z);v.setXYZ(i,x*rad[0],y*rad[1],z*rad[2]);}geo.computeVertexNormals();
  const o=mesh(p,name,geo,m);o.position.fromArray(xyz);return o;
 };
 const tube=(p,name,points,r,m)=>mesh(p,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),Math.max(20,points.length*6),r,7,false),m);
 const panel=(p,name,s,xyz,depth,m,bevel=.004)=>{const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,curveSegments:28,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4}),o=mesh(p,name,g,m);o.position.fromArray(xyz);return o;};
 const bunny=group(root,'Mifen seated plush',[1.255,2.525,-.04]);bunny.rotation.y=-.045;
 const parts=[];
 const soft=(name,p,r,count,shape)=>{const o=oval(bunny,name,p,r,pink,shape);parts.push({o,count});return o;};
 soft('short wide softly stuffed seated body',[0,.151,-.006],[.188,.140,.150],18000,(x,y,z)=>[x*(1-.11*y),y,z*(1-.06*y)]);
 // A narrower rounded crown opens into wide lower cheeks and a gently flattened
 // chin. Geometry changes the outline itself, not just the camera or head scale.
 const headCenter=[0,.450,.035],headRadius=[.225,.218,.162];
 const headShape=(x,y,z)=>[x*(1-.32*y),Math.sign(y)*Math.abs(y)**(y<0?.55:1),z*(1+.025*(1-y*y))];
 soft('rounded onigiri head with broad lower cheeks',headCenter,headRadius,33000,headShape);
 const faceAt=(x,y,lift=0)=>{
  const ny=THREE.MathUtils.clamp((y-headCenter[1])/headRadius[1],-.999,.999),sy=ny<0?-(Math.abs(ny)**(1/.55)):ny,sx=x/(headRadius[0]*(1-.32*sy));
  return [x,y,headCenter[2]+headRadius[2]*Math.sqrt(Math.max(0,1-sx*sx-sy*sy))*(1+.025*(1-sy*sy))+lift];
 };
 const eyeY=.410,noseY=.374;
 // Front-view thickness is X; the broad padded surface lies in the YZ plane.
 // This deliberately reverses v2's broad frontal / thin side-view orientation.
 for(const side of [-1,1]){
  const curve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(side*.102,.627,-.010),new THREE.Vector3(side*.184,.555,.002),
   new THREE.Vector3(side*.244,.424,.018),new THREE.Vector3(side*.262,.288,.027),new THREE.Vector3(side*.254,.215,.035)
  ]),p=[],n=[],u=[],ix=[],rows=64,cols=32;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const t=j/rows,a=i/cols*Math.PI*2,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),wide=new THREE.Vector3(0,0,1).cross(tangent).normalize(),deep=new THREE.Vector3().crossVectors(tangent,wide).normalize();
   const taper=Math.sin(Math.PI*(.13+.87*t))**.50,w=(.026+.009*Math.sin(t*Math.PI))*taper,d=(.083+.024*Math.sin(t*Math.PI))*taper;
   const v=c.clone().addScaledVector(wide,Math.cos(a)*w).addScaledVector(deep,Math.sin(a)*d);p.push(v.x,v.y,v.z);u.push(i/cols,t);
   if(j<rows&&i<cols){const k=j*(cols+1)+i;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();
  // Correct winding against the centreline so both left and right have an
  // outward surface, independent of curve orientation.
  const pos=g.attributes.position,nor=g.attributes.normal;let dot=0;
  for(let j=1;j<rows;j++){const k=j*(cols+1),c=curve.getPoint(j/rows);dot+=new THREE.Vector3(pos.getX(k)-c.x,pos.getY(k)-c.y,pos.getZ(k)-c.z).dot(new THREE.Vector3(nor.getX(k),nor.getY(k),nor.getZ(k)));}
  if(dot<0){for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();}
  const ear=mesh(bunny,side<0?'left softly folded drooping ear':'right softly folded drooping ear',g,pink);parts.push({o:ear,count:14000});
  soft('small paw nestled against the chest',[side*.104,.211,.144],[.061,.059,.054],4200).rotation.z=-side*.36;
  soft('short rounded seated foot',[side*.108,.060,.116],[.078,.060,.081],5000).rotation.z=-side*.09;
 }
 // Low-set, almost level eyes leave the characteristic large quiet forehead.
 for(const side of [-1,1]){
  const ep=faceAt(side*.102,eyeY,.006),e=oval(bunny,'low-set shiny eye',ep,[.019,.021,.014],eyes);e.rotation.y=side*.20;
  oval(bunny,'small upper eye catchlight',[ep[0]-.005,ep[1]+.007,ep[2]+.013],[.0045,.005,.0028],glint);
 }
 const nose=new THREE.Shape();nose.moveTo(-.018,.007);nose.quadraticCurveTo(-.023,.012,-.011,.014);nose.quadraticCurveTo(0,.019,.014,.012);nose.quadraticCurveTo(.024,.008,.014,-.001);nose.lineTo(.003,-.012);nose.quadraticCurveTo(0,-.016,-.004,-.011);nose.closePath();panel(bunny,'tiny inverted triangular felt nose',nose,faceAt(0,noseY,.003),.005,noseMat,.003);
 tube(bunny,'delicate embroidered Y mouth left',[faceAt(0,.361,.005),faceAt(0,.344,.005),faceAt(-.017,.333,.005)],.0020,cocoa);
 tube(bunny,'delicate embroidered Y mouth right',[faceAt(0,.344,.005),faceAt(.017,.333,.005)],.0020,cocoa);
 const mask=(p,length)=>{
  if(p.z<.13)return length;
  for(const x of [-.102,.102])if(((p.x-x)/.024)**2+((p.y-eyeY)/.027)**2<1.04)return .002;
  if((p.x/.026)**2+((p.y-noseY)/.021)**2<1.1)return .002;
  if(Math.abs(p.x)<.023&&p.y>.330&&p.y<.362)return .003;
  return length;
 };
 addPile(bunny,parts,pink.color,.010,.007,mask);

 // The shorter carrot hangs just under the side rail, not halfway down the
 // cabinet. Its soft leaf fans and rounded bottom replace the long pointed cone.
 const hanging=group(root,'raised carrot charm',[-1.697,0,.02]);hanging.rotation.y=-Math.PI/2;
 for(const x of [-.25,.25]){oval(hanging,'rail rosette',[x,1.94,0],[.062,.062,.024],wood);tube(hanging,'rail mount',[[x,1.94,0],[x,1.94,.105]],.025,wood);}
 tube(hanging,'rounded hanging rail',[[-.25,1.94,.105],[.25,1.94,.105]],.027,wood);
 tube(hanging,'short pink woven hanging loop',[[-.073,1.719,.154],[-.070,1.912,.116],[-.047,1.976,.106],[-.018,1.92,.126],[-.018,1.72,.16]],.008,rose);
 const carrot=group(hanging,'short plump carrot',[-.043,1.315,.175]);carrot.rotation.z=-.085;
 const surface=(t,a)=>{const r=.145*Math.sin(Math.PI*t)**.52*(.68+.32*t);return new THREE.Vector3(.015*(1-t)**2+Math.cos(a)*r,.02+t*.345,.009*Math.sin(t*Math.PI)+Math.sin(a)*r*.76);};
 const p=[],uvs=[],ix=[],rows=48,cols=64;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,v=surface(t,i/cols*Math.PI*2);p.push(v.x,v.y,v.z);uvs.push(i/cols,t);if(j<rows&&i<cols){const k=j*(cols+1)+i;ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(p,3));cg.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));cg.setIndex(ix);cg.computeVertexNormals();const body=mesh(carrot,'rounded apricot stuffed carrot',cg,apricot);
 const front=(x,y,z=.003)=>{const t=THREE.MathUtils.clamp((y-.02)/.345,.001,.999),r=.145*Math.sin(Math.PI*t)**.52*(.68+.32*t),cx=.015*(1-t)**2;return [x,y,.009*Math.sin(Math.PI*t)+Math.sqrt(Math.max(0,r*r-(x-cx)**2))*.76+z];};
 const leafParts=[];
 for(const [x,a,s] of [[-.008,.61,.90],[0,-.06,1],[.010,-.65,.90]]){
  const leaf=new THREE.Shape();leaf.moveTo(-.014,0);leaf.bezierCurveTo(-.036,.036,-.046,.12,-.012,.167);leaf.quadraticCurveTo(.005,.184,.023,.154);leaf.bezierCurveTo(.057,.104,.035,.034,.014,0);leaf.closePath();
  const o=panel(carrot,'little fan-shaped padded felt leaf',leaf,[x,.341,-.007],.023,sage,.008);o.rotation.z=a;o.scale.setScalar(s);leafParts.push({o,count:2000});
 }
 // Tiny padded bow with restrained folds and short tails.
 for(const side of [-1,1]){
  const s=new THREE.Shape();s.moveTo(side*.008,0);s.bezierCurveTo(side*.032,.023,side*.078,.046,side*.087,.026);s.bezierCurveTo(side*.103,-.008,side*.082,-.029,side*.059,-.024);s.lineTo(side*.008,-.009);s.closePath();panel(carrot,'small rounded bow loop',s,[0,.352,.065],.016,rose,.007);
  const tail=new THREE.Shape();tail.moveTo(side*.007,-.005);tail.quadraticCurveTo(side*.036,-.031,side*.038,-.065);tail.lineTo(side*.021,-.055);tail.lineTo(side*.009,-.066);tail.quadraticCurveTo(-side*.004,-.026,-side*.006,-.008);tail.closePath();panel(carrot,'short soft bow tail',tail,[0,.348,.058],.009,rose,.003);
  tube(carrot,'subtle bow gathering',[[side*.012,.350,.088],[side*.039,.361,.090],[side*.068,.370,.082]],.0016,roseFold);
 }
 oval(carrot,'little gathered bow knot',[0,.350,.086],[.019,.022,.018],rose);
 for(const side of [-1,1]){
  oval(carrot,'tiny carrot bead eye',front(side*.041,.243,.006),[.008,.010,.0045],cocoa);
  oval(carrot,'soft rose stitched cheek',front(side*.073,.218,.003),[.015,.0065,.002],rose);
 }
 tube(carrot,'small embroidered smile',[front(-.012,.218),front(0,.211),front(.012,.218)],.0018,cocoa);
 for(const [x,y,w] of [[-.039,.302,.033],[.040,.149,.033],[-.012,.095,.025]])tube(carrot,'short tone-on-tone carrot stitch',[front(x-w/2,y),front(x,y-.003),front(x+w/2,y)],.0017,seam);
 addPile(carrot,[{o:body,count:13000}],apricot.color,.0045,.003,(v,l)=>v.z>.07&&v.y>.20&&v.y<.26&&Math.abs(v.x)<.09?.0015:l);
 addPile(carrot,leafParts,sage.color,.0025,.001);
 root.userData={revision:'companions-3',mifen:{head:'rounded triangular onigiri, narrower crown and wide lower cheeks',bodySize:[.376,.280,.300],previousBodySize:[.306,.362,.242],ears:'narrow frontal thickness and broad side-view YZ surface',earMidSection:{frontalThickness:.070,sideBreadth:.214,sideToFrontRatio:.214/.070},paws:'tucked hands and low rounded feet',fibres:bunny.userData.fibres},carrot:{bottom:1.33,previousBottom:1.01,bodyHeight:.345,previousBodyHeight:.533,shortLoop:true,fibres:carrot.userData.fibres}};
 return root;

 function addPile(parent,parts,color,minLength,variation,mask=(v,l)=>l){
  // Area-weighted roots follow the actual sculpted surface, including ear tips.
  parent.updateWorldMatrix(true,true);const inverse=parent.matrixWorld.clone().invert(),roots=[],directions=[],tangents=[];
  const pa=new THREE.Vector3(),pb=new THREE.Vector3(),pc=new THREE.Vector3(),na=new THREE.Vector3(),nb=new THREE.Vector3(),nc=new THREE.Vector3(),point=new THREE.Vector3(),normal=new THREE.Vector3(),tangent=new THREE.Vector3(),bitangent=new THREE.Vector3();
  for(const {o,count} of parts){
   const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,ix=g.index,tri=(ix?ix.count:p.count)/3,areas=new Float64Array(tri),matrix=inverse.clone().multiply(o.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(matrix);let total=0;
   for(let i=0;i<tri;i++){const a=ix?ix.getX(i*3):i*3,b=ix?ix.getX(i*3+1):i*3+1,c=ix?ix.getX(i*3+2):i*3+2;pa.fromBufferAttribute(p,a).applyMatrix4(matrix);pb.fromBufferAttribute(p,b).applyMatrix4(matrix);pc.fromBufferAttribute(p,c).applyMatrix4(matrix);total+=pb.sub(pa).cross(pc.sub(pa)).length()*.5;areas[i]=total;}
   for(let i=0;i<count;i++){
    const target=rand()*total;let low=0,high=tri-1;while(low<high){const mid=(low+high)>>1;if(areas[mid]<target)low=mid+1;else high=mid;}
    const a=ix?ix.getX(low*3):low*3,b=ix?ix.getX(low*3+1):low*3+1,c=ix?ix.getX(low*3+2):low*3+2,s=Math.sqrt(rand()),u=1-s,v=s*(1-rand()),w=1-u-v;
    pa.fromBufferAttribute(p,a);pb.fromBufferAttribute(p,b);pc.fromBufferAttribute(p,c);point.copy(pa).multiplyScalar(u).addScaledVector(pb,v).addScaledVector(pc,w).applyMatrix4(matrix);
    na.fromBufferAttribute(n,a);nb.fromBufferAttribute(n,b);nc.fromBufferAttribute(n,c);normal.copy(na).multiplyScalar(u).addScaledVector(nb,v).addScaledVector(nc,w).applyMatrix3(nm).normalize();
    tangent.crossVectors(normal,Math.abs(normal.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize();bitangent.crossVectors(normal,tangent).normalize();
    const flow=Math.sin(point.x*80+point.y*70)*2.1+Math.cos(point.z*70-point.y*35)+(rand()-.5)*.9;
    tangent.multiplyScalar(Math.cos(flow)).addScaledVector(bitangent,Math.sin(flow)).normalize();
    const length=mask(point,minLength+rand()*variation);point.addScaledVector(normal,-.0008);
    roots.push(point.x,point.y,point.z,.00050+rand()*.00032);directions.push(normal.x,normal.y,normal.z,length);tangents.push(tangent.x,tangent.y,tangent.z,rand()*Math.PI*2);
   }
  }
  const g=new THREE.InstancedBufferGeometry(),p=[],n=[],u=[],ix=[];
  for(let j=0;j<=4;j++){p.push(-1,j/4,0,1,j/4,0);n.push(0,1,0,0,1,0);u.push(0,j/4,1,j/4);if(j<4){const k=j*2;ix.push(k,k+1,k+2,k+2,k+1,k+3);}}
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);
  g.setAttribute('pileRoot',new THREE.InstancedBufferAttribute(new Float32Array(roots),4));g.setAttribute('pileNormal',new THREE.InstancedBufferAttribute(new Float32Array(directions),4));g.setAttribute('pileFlow',new THREE.InstancedBufferAttribute(new Float32Array(tangents),4));g.instanceCount=roots.length/4;
  g.boundingBox=new THREE.Box3();for(let i=0;i<roots.length;i+=4)g.boundingBox.expandByPoint(point.set(roots[i],roots[i+1],roots[i+2]));g.boundingBox.expandByScalar((minLength+variation)*1.5);g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
  const m=new THREE.MeshPhysicalNodeMaterial({name:'Dresser toy | curved diffuse plush fibres',color:color.clone(),roughness:1,specularIntensity:0,sheen:0,side:THREE.DoubleSide});
  const a=attribute('pileRoot','vec4'),d=attribute('pileNormal','vec4'),f=attribute('pileFlow','vec4'),t=positionGeometry.y,b=d.xyz.cross(f.xyz);
  const lean=t.mul(t).mul(.44).add(t.mul(5.3).add(f.w).sin().mul(.18).mul(t));
  const center=a.xyz.add(d.xyz.mul(d.w).mul(t)).add(f.xyz.mul(d.w).mul(lean)).add(b.mul(d.w).mul(t.mul(4).add(f.w).sin()).mul(t).mul(.16));
  const localCamera=modelWorldMatrixInverse.mul(vec4(cameraPosition,1)).xyz,cross=d.xyz.cross(localCamera.sub(center)),side=cross.dot(cross).greaterThan(.000001).select(cross,f.xyz).normalize();
  m.positionNode=center.add(side.mul(a.w).mul(positionGeometry.x).mul(mix(1,.06,t)));
  m.normalNode=transformNormalToView(d.xyz.add(f.xyz.mul(.07)).normalize()).normalize();
  m.colorNode=materialColor.rgb.mul(mix(.86,1.01,uv().y.clamp(0,1).pow(.6))).mul(f.w.sin().mul(.025).add(.985));
  const o=mesh(parent,'dense curled short-pile fleece',g,m);o.castShadow=false;o.receiveShadow=false;o.userData.pile=true;o.userData.fibres=g.instanceCount;o.frustumCulled=false;parent.userData.fibres=(parent.userData.fibres||0)+g.instanceCount;
 }
}
