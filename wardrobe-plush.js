import * as THREE from 'three/webgpu';
import {attribute,cameraPosition,materialColor,mix,modelWorldMatrixInverse,positionGeometry,transformNormalToView,uv,vec4} from 'three/tsl';
import {makeFiberNap} from './fur.js?revision=plush-touch-1';
import {settleCarrotPlushes,CARROT_BODY_HEIGHT,carrotRadius} from './wardrobe-plush-physics.js?revision=carrot-rest-3';

export function createPinkCarrotPlushes({detail='large',pose='resting',plump=1}={}){
 const root=new THREE.Group();root.name='Wardrobe | two resting pink carrot cushions';
 const physics=pose==='resting'?settleCarrotPlushes():null;
 let seed=109294;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const nap=makeFiberNap();nap.repeat.set(2.6,2.6);
 // Fine looped threads remain legible looking straight at the fabric, where
 // silhouette fibres alone would disappear against a uniformly lit surface.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ededed';ctx.fillRect(0,0,512,512);ctx.lineCap='round';
 for(let i=0;i<23000;i++){
  const x=rand()*512,y=rand()*512,a=rand()*Math.PI*2,l=2+rand()*5,gray=Math.round(170+rand()*85);
  ctx.strokeStyle=`rgb(${gray},${gray},${gray})`;ctx.lineWidth=.65+rand()*.65;
  for(const dx of [-512,0,512])for(const dy of [-512,0,512]){
   if(x+dx< -8||x+dx>520||y+dy< -8||y+dy>520)continue;
   ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.quadraticCurveTo(x+dx+Math.cos(a+.8)*l,y+dy+Math.sin(a+.8)*l,x+dx+Math.cos(a)*l*1.5,y+dy+Math.sin(a)*l*1.5);ctx.stroke();
  }
 }
 const weave=new THREE.CanvasTexture(canvas);weave.colorSpace=THREE.SRGBColorSpace;weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(2.6,2.6);weave.anisotropy=8;
 const mat=(name,color,extra={})=>new THREE.MeshPhysicalMaterial({name:'Carrot plush | '+name,color,map:weave,roughness:.99,specularIntensity:.10,normalMap:nap,normalScale:new THREE.Vector2(.75,.75),sheen:.45,sheenColor:new THREE.Color(color).lerp(new THREE.Color('#fff3e5'),.32),sheenRoughness:1,...extra});
 const colors=['#e8a9b5','#edbec5'];
 const sage=mat('soft sage felt leaves','#9cae81'),sageLight=mat('pale sage leaf tips','#b6bf91'),leafSeam=mat('sage embroidery','#8d9b73');
 const mesh=(parent,name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Carrot plush | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const oval=(parent,name,p,size,m)=>{const o=mesh(parent,name,new THREE.SphereGeometry(1,32,24),m);o.position.fromArray(p);o.scale.fromArray(size);return o;};
 const tube=(parent,name,points,r,m)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,6,false),m);
 const dolls=[];
 for(let k=0;k<2;k++){
  const doll=new THREE.Group();doll.name='Wardrobe | '+(k?'blush':'rose')+' pink carrot doll';root.add(doll);
  const pink=mat('dense '+(k?'blush':'rose')+' velour',colors[k]),stitch=mat('tone-on-tone stitched carrot grooves',k?'#d6a4ad':'#d293a3');
  const bodyH=CARROT_BODY_HEIGHT,cols=detail==='large'?72:40,rows=detail==='large'?64:36,p=[],uvs=[],ix=[];
  const radius=t=>carrotRadius(.025+t*bodyH)*plump,depth=pose==='loose'?.97:.79;
  function surface(t,a){const r=radius(t);return new THREE.Vector3(.025*(1-t)**2+Math.cos(a)*r,.025+t*bodyH,Math.sin(a)*r*depth);}
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const t=j/rows,v=surface(t,i/cols*Math.PI*2);p.push(v.x,v.y,v.z);uvs.push(i/cols,t);
   if(j<rows&&i<cols){const a=j*(cols+1)+i;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(ix);geo.computeVertexNormals();
  const body=mesh(doll,'continuous padded carrot body',geo,pink),parts=[{o:body,count:detail==='large'?38000:detail==='small'?18000:9000}];
  function front(x,y,lift=.008){const t=THREE.MathUtils.clamp((y-.025)/bodyH,.001,.999),r=radius(t),cx=.025*(1-t)**2;return [x,y,Math.sqrt(Math.max(0,r*r-(x-cx)**2))*depth+lift];}
  for(const [x,y,w] of [[-.09,1.61,.16],[.12,.79,.15],[-.045,.47,.12]])tube(doll,'short curved carrot embroidery',[front(x-w/2,y,.008),front(x,y-.012,.010),front(x+w/2,y,.008)],.0052,stitch);
  // Each leaf is a padded volume with a rounded tip and embroidered midrib.
  const leaves=[];
  for(const [j,a,height,width] of [[0,.60,.52,.14],[1,-.06,.63,.135],[2,-.63,.49,.14]]){
   const lg=new THREE.Group();lg.position.set((j-1)*.038,1.80,-.015+(j===1?-.015:0));lg.rotation.z=a;lg.rotation.y=(j-1)*.25;doll.add(lg);
   const l=oval(lg,'padded rounded sage leaf',[0,height*.46,0],[width,height*.55,.052],j===1?sageLight:sage);leaves.push({o:l,count:detail==='large'?1800:detail==='small'?600:220});
   tube(lg,'stitched leaf midrib',[[0,.025,.035],[-.018,height*.45,.054],[0,height*.89,.031]],.0036,leafSeam);
  }
  const ribbon=mat('cream blush leaf tie','#f5dcd1');
  for(const side of [-1,1]){const o=oval(doll,'soft little ribbon loop',[side*.097,1.827,.10],[.105,.056,.034],ribbon);o.rotation.z=side*.33;}
  oval(doll,'rounded ribbon knot',[0,1.826,.125],[.037,.043,.026],ribbon);
  // Deform every sewn part with the settled centreline before distributing
  // fibres. This keeps embroidery, cloth leaves and fur on the same surface.
  doll.updateWorldMatrix(true,true);const inverse=doll.matrixWorld.clone().invert(),pieces=[];
  doll.traverse(o=>{if(o.isMesh)pieces.push({o,matrix:inverse.clone().multiply(o.matrixWorld)});});
  for(const {o,matrix} of pieces){
   const g=o.geometry.clone().applyMatrix4(matrix),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const q=physics?physics.deform(k,p.getX(i),p.getY(i),p.getZ(i)):[p.getX(i),.025+(p.getY(i)-.025)*(detail==='mini'?.85:1),p.getZ(i)];p.setXYZ(i,...q);}
   g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();o.geometry.dispose();o.geometry=g;
   o.removeFromParent();doll.add(o);o.position.set(0,0,0);o.quaternion.identity();o.scale.setScalar(1);
  }
  addPile(doll,parts,pink.color,detail==='large'?.015:detail==='small'?.027:.043,detail==='large'?.011:detail==='small'?.016:.026);
  addPile(doll,leaves,sage.color,.004,.002);
  dolls.push({color:colors[k],bodyHeight:bodyH,plump,fibres:doll.userData.fibres,face:false,arms:false,tiltDegrees:physics?.report.tiltDegrees[k]||0});
 }
 root.userData={dollCount:2,kind:'faceless pink carrot cushions',dolls,physics:physics?.report||{method:'loose plump sewn template for fitted storage'}};return root;

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
    const length=mask(point,minLength+rand()*variation);point.addScaledVector(normal,.003);
    const widthScale=detail==='large'?1:detail==='small'?1.7:3.2;
    roots.push(point.x,point.y,point.z,(.00105+rand()*.00055)*widthScale);directions.push(normal.x,normal.y,normal.z,length);tangents.push(tangent.x,tangent.y,tangent.z,rand()*Math.PI*2);
   }
  }
  const g=new THREE.InstancedBufferGeometry(),p=[],n=[],u=[],ix=[];
  const segments=detail==='large'?4:3;
  for(let j=0;j<=segments;j++){p.push(-1,j/segments,0,1,j/segments,0);n.push(0,1,0,0,1,0);u.push(0,j/segments,1,j/segments);if(j<segments){const k=j*2;ix.push(k,k+1,k+2,k+2,k+1,k+3);}}
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);
  g.setAttribute('pileRoot',new THREE.InstancedBufferAttribute(new Float32Array(roots),4));g.setAttribute('pileNormal',new THREE.InstancedBufferAttribute(new Float32Array(directions),4));g.setAttribute('pileFlow',new THREE.InstancedBufferAttribute(new Float32Array(tangents),4));g.instanceCount=roots.length/4;
  g.boundingBox=new THREE.Box3();for(let i=0;i<roots.length;i+=4)g.boundingBox.expandByPoint(point.set(roots[i],roots[i+1],roots[i+2]));g.boundingBox.expandByScalar((minLength+variation)*1.5);g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
  const m=new THREE.MeshPhysicalNodeMaterial({name:'Carrot plush | fine curved velour fibres',color:color.clone(),roughness:1,specularIntensity:0,sheen:0,side:THREE.DoubleSide});
  const a=attribute('pileRoot','vec4'),d=attribute('pileNormal','vec4'),f=attribute('pileFlow','vec4'),t=positionGeometry.y,b=d.xyz.cross(f.xyz);
  const lean=t.mul(t).mul(.44).add(t.mul(5.3).add(f.w).sin().mul(.18).mul(t));
  const center=a.xyz.add(d.xyz.mul(d.w).mul(t)).add(f.xyz.mul(d.w).mul(lean)).add(b.mul(d.w).mul(t.mul(4).add(f.w).sin()).mul(t).mul(.16));
  const localCamera=modelWorldMatrixInverse.mul(vec4(cameraPosition,1)).xyz,cross=d.xyz.cross(localCamera.sub(center)),side=cross.dot(cross).greaterThan(.000001).select(cross,f.xyz).normalize();
  m.positionNode=center.add(side.mul(a.w).mul(positionGeometry.x).mul(mix(1,.06,t)));
  m.normalNode=transformNormalToView(d.xyz.add(f.xyz.mul(f.w.sin().mul(.6))).add(b.mul(f.w.cos().mul(.3))).normalize()).normalize();
  m.colorNode=materialColor.rgb.mul(mix(.83,1.02,uv().y.clamp(0,1).pow(.6))).mul(f.w.sin().mul(.08).add(.94));
  const o=mesh(parent,'dense curled short-pile fleece',g,m);o.castShadow=false;o.receiveShadow=true;o.userData.pile=true;o.userData.fiberCount=g.instanceCount;o.userData.fibres=g.instanceCount;o.frustumCulled=false;parent.userData.fibres=(parent.userData.fibres||0)+g.instanceCount;
 }

}
