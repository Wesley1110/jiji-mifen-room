import * as THREE from 'three/webgpu';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPinkCarrotPlushes} from './wardrobe-plush.js?revision=bunny-wardrobe-5';
import {drawerPuff} from './wardrobe-storage-motion.js?revision=bunny-wardrobe-5';

// Use the approved faceless, sewn carrot and its deformed cloth leaves at
// three scales. Small copies keep actual short fibres, not noisy sphere bumps.
function templates(detail){
 const source=createPinkCarrotPlushes({detail,pose:'loose',plump:detail==='mini'?1.65:1.48});
 return [...source.children].map((doll,k)=>{
  const g=new THREE.Group();g.add(doll);g.rotation.z=(k?1:-1)*Math.PI/2;
  g.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(doll.getObjectByName('Carrot plush | continuous padded carrot body')),center=box.getCenter(new THREE.Vector3());
  const origin=new THREE.Group();origin.add(g);g.position.set(-center.x,-box.min.y,-center.z);origin.updateMatrixWorld(true);return origin;
 });
}
function carrot(parent,models,{x,y,z,scale,yaw=0,roll=0,pitch=0,index=0}){
 const item=new THREE.Group();item.name='Wardrobe | faceless miniature carrot';
 const copy=models[index%2].clone(true);
 copy.traverse(o=>{if(o.isMesh)o.geometry=o.geometry.clone();});
 item.add(copy);item.scale.setScalar(scale);item.rotation.set(pitch,yaw,roll);parent.add(item);item.position.set(x,y,z);
 return item;
}

// Settle each continuous padded body onto the actual X/Z support surface.
// Rasterized triangle envelopes avoid floating rows and intersecting lumps.
// Leaves are light cloth: they do not hold another carrot off the pile.
function settleOnPile(item,support,{cell=.022,left=-1.20,right=1.20,back=-.435,front=.465}={}){
 const body=item.getObjectByName('Carrot plush | continuous padded carrot body');
 item.updateWorldMatrix(true,true);
 const parentInverse=item.parent.matrixWorld.clone().invert();
 const getMatrix=()=>parentInverse.clone().multiply(body.matrixWorld);
 const points=()=>{const a=body.geometry.attributes.position,m=getMatrix(),p=[];for(let i=0;i<a.count;i++)p.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(m));return p;};
 let vertices=points(),bounds=new THREE.Box3().setFromPoints(vertices);
 item.position.x+=bounds.min.x<left?left-bounds.min.x:bounds.max.x>right?right-bounds.max.x:0;
 item.position.z+=bounds.min.z<back?back-bounds.min.z:bounds.max.z>front?front-bounds.max.z:0;
 item.updateWorldMatrix(true,true);vertices=points();bounds.setFromPoints(vertices);
 const columns=new Map(),ix=body.geometry.index;
 const triCount=(ix?ix.count:vertices.length)/3;
 for(let j=0;j<triCount;j++){
  const [a,b,c]=[0,1,2].map(k=>vertices[ix?ix.getX(j*3+k):j*3+k]);
  const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-9)continue;
  for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cell);x<=Math.ceil(Math.max(a.x,b.x,c.x)/cell);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/cell);z<=Math.ceil(Math.max(a.z,b.z,c.z)/cell);z++){
   const px=(x+.5)*cell,pz=(z+.5)*cell,u=((b.z-c.z)*(px-c.x)+(c.x-b.x)*(pz-c.z))/den,v=((c.z-a.z)*(px-c.x)+(a.x-c.x)*(pz-c.z))/den,w=1-u-v;
   if(u<-.00001||v<-.00001||w<-.00001)continue;
   const y=u*a.y+v*b.y+w*c.y,key=x+','+z,old=columns.get(key);
   if(old){old.min=Math.min(old.min,y);old.max=Math.max(old.max,y);}else columns.set(key,{min:y,max:y});
  }
 }
 let lift=-bounds.min.y;
 for(const [key,c] of columns)lift=Math.max(lift,(support.get(key)||0)-c.min-.009);
 item.position.y+=lift;
 for(const [key,c] of columns)support.set(key,Math.max(support.get(key)||0,c.max+lift));
 // Light felt leaves bend against the liner and sides instead of acting as
 // rigid props or piercing the wood. Their short-pile roots follow the fold.
 item.updateWorldMatrix(true,true);
 item.traverse(o=>{
  if(!o.isMesh)return;
  const matrix=parentInverse.clone().multiply(o.matrixWorld),inverse=matrix.clone().invert(),geo=o.geometry;
  const attr=geo.isInstancedBufferGeometry?geo.attributes.pileRoot:geo.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<attr.count;i++){
   v.fromBufferAttribute(attr,i).applyMatrix4(matrix);
   v.set(Math.max(left,Math.min(right,v.x)),Math.max(.002,v.y),Math.max(back,Math.min(front,v.z)));
   if(geo.isInstancedBufferGeometry){
    const d=geo.attributes.pileNormal,n=new THREE.Vector3(d.getX(i),d.getY(i),d.getZ(i)).applyMatrix3(new THREE.Matrix3().getNormalMatrix(matrix)).normalize(),scale=new THREE.Vector3().setFromMatrixScale(matrix).x;
    let length=d.getW(i)*scale;
    for(const [dist,dir] of [[v.y-.001,-n.y],[v.x-left,-n.x],[right-v.x,n.x],[v.z-back,-n.z],[front-v.z,n.z]])if(dir>.06)length=Math.min(length,Math.max(.0004,dist/dir));
    d.setW(i,length/scale);
   }
   v.applyMatrix4(inverse);
   attr.setXYZ(i,v.x,v.y,v.z);
  }
  if(geo.isInstancedBufferGeometry){geo.boundingBox=new THREE.Box3().setFromBufferAttribute(attr).expandByScalar(.031);geo.boundingSphere=geo.boundingBox.getBoundingSphere(new THREE.Sphere());}
  else{geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();}
 });
 item.userData.restingBodyBounds={min:[bounds.min.x,bounds.min.y+lift,bounds.min.z],max:[bounds.max.x,bounds.max.y+lift,bounds.max.z]};
 return item.userData.restingBodyBounds;
}

// Press the overfilled upper pair against the inside of the cabinet. A smooth
// cap flattens the top contact patch; the floor stays planted. Apply the same
// deformation and its normal transform to fabric, stitching and fur roots.
function fitShelfCompartment(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),report=[];
 const softMax=(v,limit,w)=>{const d=v-limit;return d>w?v:d< -w?limit:limit+(d+w)**2/(4*w);};
 const softMin=(v,limit,w)=>-softMax(-v,-limit,w);
 root.children.forEach((item,k)=>{
  const lower=k<2?.003:.416,upper=k<2?.481:.891;
  const body=item.getObjectByName('Carrot plush | continuous padded carrot body');
  const bodyBox=new THREE.Box3().setFromObject(body),mid=(bodyBox.min.y+bodyBox.max.y)/2;
  const shift=(lower+upper)/2-mid,warp=y=>softMin(softMax(y+shift,lower,.034),upper,.034);
  const derivative=y=>Math.max(.035,(warp(y+.0001)-warp(y-.0001))/.0002);
  item.traverse(o=>{
   if(!o.isMesh)return;
   const g=o.geometry,m=inverse.clone().multiply(o.matrixWorld),inv=m.clone().invert(),nm=new THREE.Matrix3().getNormalMatrix(m),backNM=nm.clone().invert();
   const attr=g.isInstancedBufferGeometry?g.attributes.pileRoot:g.attributes.position,p=new THREE.Vector3(),n=new THREE.Vector3(),t=new THREE.Vector3();
   const localScale=new THREE.Vector3().setFromMatrixScale(m).x;
   for(let i=0;i<attr.count;i++){
    p.fromBufferAttribute(attr,i).applyMatrix4(m);const dy=derivative(p.y);p.y=warp(p.y);
    if(g.isInstancedBufferGeometry){
     const d=g.attributes.pileNormal,f=g.attributes.pileFlow;
     n.set(d.getX(i),d.getY(i),d.getZ(i)).applyMatrix3(nm);n.y/=dy;n.normalize();
     let length=d.getW(i);
     if(n.y>.05)length=Math.min(length,Math.max(.0004,(upper+.004-p.y)/n.y)/localScale);
     if(n.y<-.05)length=Math.min(length,Math.max(.0004,(p.y-lower+.004)/-n.y)/localScale);
     n.applyMatrix3(backNM).normalize();d.setXYZ(i,n.x,n.y,n.z);d.setW(i,length);
     t.set(f.getX(i),f.getY(i),f.getZ(i)).transformDirection(m);t.y*=dy;t.transformDirection(inv);f.setXYZ(i,t.x,t.y,t.z);
    }
    p.applyMatrix4(inv);attr.setXYZ(i,p.x,p.y,p.z);
   }
   if(g.isInstancedBufferGeometry){g.boundingBox=new THREE.Box3().setFromBufferAttribute(attr);let longest=0;for(let i=0;i<g.instanceCount;i++)longest=Math.max(longest,g.attributes.pileNormal.getW(i));g.boundingBox.expandByScalar(longest*1.5);g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());}
   else{g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
  });
  const packedBox=new THREE.Box3(),bodyPosition=body.geometry.attributes.position,point=new THREE.Vector3();
  for(let i=0;i<bodyPosition.count;i++)packedBox.expandByPoint(point.fromBufferAttribute(bodyPosition,i).applyMatrix4(body.matrixWorld));
  report.push({layer:k<2?'bottom':'top',floor:3.125+lower,top:3.125+upper,bodyMinY:3.125+packedBox.min.y,bodyMaxY:3.125+packedBox.max.y,uncompressedHeight:bodyBox.max.y-bodyBox.min.y});
 });
 return {packedHeight:.891,ceiling:4.020,contactLayers:report,method:'four overstuffed cushions compressed into broad floor, inter-cushion and ceiling contact patches'};
}
// Merge the fur roots as well as the solid meshes in each independent moving
// layer. Forty-two plushes still need only a few fur draws per layer.
function batchCollection(scope){
 scope.updateMatrixWorld(true);const inverse=scope.matrixWorld.clone().invert(),solid=new Map(),fur=new Map();
 scope.traverse(o=>{if(!o.isMesh)return;const buckets=o.geometry.isInstancedBufferGeometry?fur:solid;const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
 for(const list of solid.values()){
  const geoms=list.map(o=>{let g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}return g;});
  const g=mergeGeometries(geoms,false);geoms.forEach(o=>o.dispose());
  if(!g)continue;
  const joined=new THREE.Mesh(g,list[0].material);joined.name='Wardrobe | joined miniature cloth';joined.castShadow=joined.receiveShadow=true;scope.add(joined);
  for(const o of list){o.removeFromParent();o.geometry.dispose();}
 }
 const p=new THREE.Vector3(),n=new THREE.Vector3(),t=new THREE.Vector3();
 for(const list of fur.values()){
  const count=list.reduce((sum,o)=>sum+o.geometry.instanceCount,0),roots=new Float32Array(count*4),normals=new Float32Array(count*4),flows=new Float32Array(count*4);let offset=0,maxLength=0;
  const bounds=new THREE.Box3();
  for(const o of list){
   const matrix=inverse.clone().multiply(o.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),scale=new THREE.Vector3().setFromMatrixScale(matrix).x;
   const a=o.geometry.attributes.pileRoot,d=o.geometry.attributes.pileNormal,f=o.geometry.attributes.pileFlow;
   for(let i=0;i<o.geometry.instanceCount;i++,offset++){
    p.set(a.getX(i),a.getY(i),a.getZ(i)).applyMatrix4(matrix);n.set(d.getX(i),d.getY(i),d.getZ(i)).applyMatrix3(normalMatrix).normalize();t.set(f.getX(i),f.getY(i),f.getZ(i)).transformDirection(matrix);
    roots.set([p.x,p.y,p.z,a.getW(i)*scale],offset*4);normals.set([n.x,n.y,n.z,d.getW(i)*scale],offset*4);flows.set([t.x,t.y,t.z,f.getW(i)],offset*4);bounds.expandByPoint(p);maxLength=Math.max(maxLength,d.getW(i)*scale);
   }
  }
  const geo=list[0].geometry.clone();geo.setAttribute('pileRoot',new THREE.InstancedBufferAttribute(roots,4));geo.setAttribute('pileNormal',new THREE.InstancedBufferAttribute(normals,4));geo.setAttribute('pileFlow',new THREE.InstancedBufferAttribute(flows,4));geo.instanceCount=count;geo.boundingBox=bounds.expandByScalar(maxLength*1.6);geo.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
  const joined=new THREE.Mesh(geo,list[0].material);joined.name='Wardrobe | joined miniature velvet fibres';joined.frustumCulled=false;joined.receiveShadow=true;joined.userData.fiberCount=count;scope.add(joined);
  for(const o of list){o.removeFromParent();o.geometry.dispose();}
 }
}

export function createCarrotShelf(){
 const root=new THREE.Group();root.name='Wardrobe | four plump carrots packed under the ceiling';const models=templates('small'),support=new Map(),resting=[];
 const placements=[
  {x:-.61,y:0,z:.04,scale:.55,yaw:-.04,index:0},
  {x:.61,y:0,z:.06,scale:.55,yaw:.04,index:1},
  {x:-.57,y:0,z:.04,scale:.57,yaw:.025,roll:.015,index:1},
  {x:.59,y:0,z:.04,scale:.57,yaw:-.025,roll:-.015,index:0}
 ];
 for(const spec of placements)resting.push(settleOnPile(carrot(root,models,spec),support));
 const fit=fitShelfCompartment(root);
 batchCollection(root);root.position.set(0,3.125,-.025);
 root.userData={count:4,size:'large tightly packed shelf cushions',face:false,plump:1.48,fit,layout:'two bottom cushions supporting two ceiling-compressed cushions',restingBodyBounds:resting};return root;
}

export function createDrawerCarrotHeap(){
 const root=new THREE.Group();root.name='Wardrobe | overflowing miniature carrot drawer';const models=templates('mini'),layers=[],support=new Map(),resting=[];
 let seed=46713;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let layer=0;layer<3;layer++){
  const g=new THREE.Group();g.name='Wardrobe | tucked carrot layer '+layer;root.add(g);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
   const item=carrot(g,models,{x:-.87+col*.58+(random()-.5)*.07,y:0,z:-.31+row*.31+(random()-.5)*.022,scale:.215+random()*.018,yaw:(random()-.5)*.30,roll:(random()-.5)*.10,pitch:(random()-.5)*.06,index:(layer+row+col)%2});
   resting.push(settleOnPile(item,support,{left:-1.165,right:1.165}));
  }
  batchCollection(g);layers.push({group:g,layer,overflow:false});
 }
 // Six loose carrots perched above the dense layers. They tuck below the
 // rail when shut and lean over the lip only once the drawer clears it.
 for(let i=0;i<6;i++){
  const g=new THREE.Group();g.name='Wardrobe | loose overflowing carrot '+i;root.add(g);
  const spec={x:-.94+i*.378,y:0,z:.28+(i%2)*.05,scale:.21+(i%3)*.010,yaw:i%2?-.36:.45,roll:i%2?.1:-.1,index:i%2};
  const bodyBounds=settleOnPile(carrot(g,models,spec),support,{left:-1.165,right:1.165});resting.push(bodyBounds);batchCollection(g);
  layers.push({group:g,bodyBounds,layer:i,overflow:true});
 }
 const bounds=new THREE.Box3().setFromObject(root),height=bounds.max.y,compressedHeight=.390,compressedScale=Math.min(1,compressedHeight/height),openScale=Math.min(1,.96/height);
 root.position.y=.507;
 function update(amount){
  const p=drawerPuff(amount,bounds.min.z);
  root.scale.y=compressedScale+(openScale-compressedScale)*p;
  for(const item of layers){
   const g=item.group;
   if(item.overflow){
    const overRim=[0,2,5].includes(item.layer);
    g.position.z=overRim?p*.40:0;
    g.position.y=overRim?p*(.425/openScale-item.bodyBounds.min[1]):0;
    g.rotation.x=overRim?p*(item.layer%2?-.045:.035):0;
   }
  }
 }
 update(0);root.userData={count:42,size:'plump miniature',face:false,plump:1.65,bodyFibresPerCarrot:9000,layers:3,overRim:3,compressedScale,openScale,restingBodyBounds:resting,behaviour:'surface-supported pile softly expands after clearing the rail; tucks in before closing'};
 return {root,update};
}
