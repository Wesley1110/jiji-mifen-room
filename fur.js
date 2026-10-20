import * as THREE from 'three/webgpu';
import {attribute, cameraPosition, materialColor, mix, positionGeometry, transformNormalToView, uv} from 'three/tsl';
import {loadFiberData} from './fiber-data.js';

// A continuous, low-contrast fiber nap. No raised beads or isolated bright blobs.
export function makeFiberNap(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#808080';ctx.fillRect(0,0,512,512);
 let seed=719;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.lineCap='round';
 for(let i=0;i<24000;i++){
  const x=rand()*512,y=rand()*512,a=rand()*Math.PI*2,len=3+rand()*9;
  const dx=Math.cos(a)*len,dy=Math.sin(a)*len,bend=(rand()-.5)*4;
  const gray=Math.round(110+rand()*36);ctx.strokeStyle=`rgb(${gray},${gray},${gray})`;ctx.lineWidth=.5+rand()*.6;
  // Tile all strokes that cross an edge, so repetition has no visible seams.
  for(const ox of [-512,0,512])for(const oy of [-512,0,512]){
   if(x+ox< -14||x+ox>526||y+oy< -14||y+oy>526)continue;
   ctx.beginPath();ctx.moveTo(x+ox,y+oy);ctx.quadraticCurveTo(x+ox+dx*.5+bend,y+oy+dy*.5-bend,x+ox+dx,y+oy+dy);ctx.stroke();
  }
 }
 const pixels=ctx.getImageData(0,0,512,512).data;
 const normals=new Uint8Array(512*512*4);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const h=(dx,dy)=>pixels[(((y+dy+512)%512)*512+(x+dx+512)%512)*4]/255;
  const nx=(h(-1,0)-h(1,0))*2.4,ny=(h(0,-1)-h(0,1))*2.4,len=Math.hypot(nx,ny,1),i=(y*512+x)*4;
  normals[i]=Math.round((nx/len*.5+.5)*255);normals[i+1]=Math.round((ny/len*.5+.5)*255);normals[i+2]=Math.round((1/len*.5+.5)*255);normals[i+3]=255;
 }
 const texture=new THREE.DataTexture(normals,512,512,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
 texture.repeat.set(2.5,2.5);texture.anisotropy=8;texture.needsUpdate=true;return texture;
}

export function softenFabric(material,nap){
 // glTF may supply a Standard material; explicitly add the cloth sheen layer.
 const mat=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(mat,material);
 mat.name=material.name;mat.bumpMap=null;mat.normalMap=nap;mat.normalScale.set(1.2,1.2);
 mat.roughness=.97;mat.metalness=0;mat.sheen=.65;mat.sheenColor=mat.color.clone().lerp(new THREE.Color('white'),.3);
 mat.sheenRoughness=1;mat.specularIntensity=.18;mat.clearcoat=0;
 return mat;
}

export async function loadFineFur(root){
 const [meta,buffer]=await loadFiberData();
 const raw=new Float32Array(buffer);
 if(raw.length!==meta.fiberCount*meta.strideFloats)throw Error('Incomplete fiber data');
 const sources=new Map();root.traverse(o=>{if(o.userData.sourceName)sources.set(o.userData.sourceName,o);});
 root.updateWorldMatrix(true,true);
 const features=[];
 for(const [name,object] of sources){
  if(/^(Jiji|Mifen|Bear blanket|Teddy rug) \|/i.test(name)&&/eye|nose|mouth/i.test(name)&&!/glint/i.test(name)){
   object.traverse(part=>{
    if(!part.isMesh)return;
    part.geometry.computeBoundingBox();
    const box=part.geometry.boundingBox,center=box.getCenter(new THREE.Vector3());
    const radii=box.getSize(new THREE.Vector3()).multiplyScalar(.5);
    const scale=part.getWorldScale(new THREE.Vector3());
    // Follow the actual, flattened feature instead of its oversized enclosing
    // sphere. A narrow seam allowance keeps the eye edge readable.
    radii.add(new THREE.Vector3(.005/scale.x,.005/scale.y,.005/scale.z));
    features.push({owner:name.split(' |')[0],center,radii,inverse:part.matrixWorld.clone().invert(),bounds:new THREE.Box3().setFromObject(part).expandByScalar(.09)});
   });
  }
 }
 const group=new THREE.Group();group.name='Plush pile';group.userData.fiberCount=0;group.userData.sourceFiberCount=meta.fiberCount;
 const meshes=[];
 let seed=19331;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const rootPoint=new THREE.Vector3(),normal=new THREE.Vector3(),tangent=new THREE.Vector3(),bitangent=new THREE.Vector3(),helper=new THREE.Vector3();
 const probe=new THREE.Vector3();
 for(const item of meta.groups){
  const source=sources.get(item.sourceName);if(!source)throw Error(`Missing fur surface: ${item.sourceName}`);
  const velour=/beak|orange foot/i.test(item.sourceName),rug=item.sourceName.startsWith('Teddy rug'),blanket=item.sourceName.startsWith('Bear blanket');
  const applique=/muzzle|inset ear|cream inner ear/i.test(item.sourceName);
  const nearbyFeatures=features.filter(f=>f.owner===item.sourceName.split(' |')[0]);
  const copies=velour?2:rug?2:blanket?3:4,count=item.count*copies;
  const geometry=new THREE.InstancedBufferGeometry(),positions=[],uvs=[],normals=[],indices=[];
  // Five stations describe a curved, tapered shaft instead of a flat surface fleck.
  for(let j=0;j<=4;j++){
   positions.push(-1,j/4,0,1,j/4,0);uvs.push(0,j/4,1,j/4);normals.push(0,1,0,0,1,0);
   if(j<4){let k=j*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setIndex(indices);
  const roots=new Float32Array(count*4),directions=new Float32Array(count*4),tangents=new Float32Array(count*4);
  for(let i=0;i<count;i++){
   const k=(item.offset+i%item.count)*13;
   rootPoint.fromArray(raw,k);normal.fromArray(raw,k+3).sub(rootPoint).normalize();
   helper.set(Math.abs(normal.y)>.9?1:0,Math.abs(normal.y)>.9?0:1,0);
   tangent.crossVectors(normal,helper).normalize();bitangent.crossVectors(normal,tangent).normalize();
   // Nearby fibers lean in similar directions, with small individual curls.
   const flow=Math.sin(rootPoint.x*31+rootPoint.y*19+rootPoint.z*27)*2.2+Math.cos(rootPoint.z*24-rootPoint.y*21)*1.5;
   const angle=flow+(rand()-.5)*1.5;
   tangent.multiplyScalar(Math.cos(angle)).addScaledVector(bitangent,Math.sin(angle));
   bitangent.crossVectors(normal,tangent).normalize();
   const spread=velour?.0015:rug?.004:.003;
   rootPoint.addScaledVector(tangent,(rand()-.5)*spread).addScaledVector(bitangent,(rand()-.5)*spread).addScaledVector(normal,-.0025);
   let length=velour?.009+rand()*.006:applique?.012+rand()*.012:rug?.032+rand()*.017:blanket?.042+rand()*.023:.042+rand()*.023;
   const phase=rand()*Math.PI*2;
   // Clip only strands whose curved shaft would enter a feature. Surrounding
   // fibers retain their full length, so there is no shaved circular eye halo.
   for(const f of nearbyFeatures){
    if(!f.bounds.containsPoint(rootPoint))continue;
    for(let j=0;j<=8;j++){
     const t=j/8;
     probe.copy(rootPoint).addScaledVector(normal,length*t)
      .addScaledVector(tangent,length*(.42*t*t+Math.sin(t*Math.PI*2+phase)*.15*t))
      .addScaledVector(bitangent,length*Math.sin(t*Math.PI*1.5+phase)*.13*t)
      .applyMatrix4(f.inverse).sub(f.center).divide(f.radii);
     if(probe.lengthSq()<1){length=Math.min(length,Math.max(.005,length*(t-.13)));break;}
    }
   }
   roots.set([rootPoint.x,rootPoint.y,rootPoint.z,raw[k+12]*(velour?1.25:1.8)],i*4);
   directions.set([normal.x,normal.y,normal.z,length],i*4);
   tangents.set([tangent.x,tangent.y,tangent.z,phase],i*4);
  }
  geometry.setAttribute('fiberRoot',new THREE.InstancedBufferAttribute(roots,4));
  geometry.setAttribute('fiberDirection',new THREE.InstancedBufferAttribute(directions,4));
  geometry.setAttribute('fiberTangent',new THREE.InstancedBufferAttribute(tangents,4));geometry.instanceCount=count;
  let surface=source;if(!surface.isMesh)surface=source.children.find(o=>o.isMesh);
  const base=Array.isArray(surface.material)?surface.material[0]:surface.material;
  // Gentle root shading supplies depth without pepper-like dark flecks.
  // These are individual diffuse strands. The coat's shape supplies its soft
  // rim light; a cloth sheen BRDF on hairline ribbons creates grazing artifacts.
  const mat=new THREE.MeshPhysicalNodeMaterial({color:base.color.clone(),roughness:1,metalness:0,sheen:0,specularIntensity:0,side:THREE.DoubleSide});
  const a=attribute('fiberRoot','vec4'),n=attribute('fiberDirection','vec4'),v=attribute('fiberTangent','vec4');
  const t=positionGeometry.y,b=n.xyz.cross(v.xyz),phase=v.w;
  const curl=t.mul(Math.PI*2).add(phase).sin().mul(.15).mul(t);
  const lean=t.mul(t).mul(.42).add(curl);
  const crossCurl=t.mul(Math.PI*1.5).add(phase).sin().mul(.13).mul(t);
  const center=a.xyz.add(n.xyz.mul(n.w).mul(t)).add(v.xyz.mul(n.w).mul(lean)).add(b.mul(n.w).mul(crossCurl));
  const cross=n.xyz.cross(cameraPosition.sub(center));
  // A head-on view can make the cross product zero. Use the groom tangent at
  // that pole rather than normalize zero and produce invalid black fragments.
  const side=cross.dot(cross).greaterThan(.000001).select(cross,v.xyz).normalize();
  mat.positionNode=center.add(side.mul(a.w).mul(positionGeometry.x).mul(mix(1,.06,t)));
  const shadeNormal=n.xyz.add(v.xyz.mul(phase.add(uv().y.mul(5)).sin()).mul(.18)).add(b.mul(.07));
  mat.normalNode=transformNormalToView(shadeNormal.normalize()).normalize();
  // MSAA can extrapolate UVs slightly outside a hairline triangle; clamp before
  // fractional powers so edge samples cannot become NaN (black pepper pixels).
  mat.colorNode=materialColor.rgb.mul(mix(.72,1.02,uv().y.clamp(0,1).pow(.55))).mul(phase.mul(2.13).sin().mul(.03).add(.97));
  // Sample the shadow at a stable point along each strand; tiny differences
  // along its width should not turn one strand into a chain of dark dots.
  mat.receivedShadowPositionNode=a.xyz.add(n.xyz.mul(n.w).mul(.55));
  const mesh=new THREE.Mesh(geometry,mat);mesh.name=`Plush fibers | ${item.sourceName}`;mesh.userData.fiberCount=count;
  mesh.castShadow=false;mesh.receiveShadow=true;
  source.updateWorldMatrix(true,false);const bounds=new THREE.Box3().setFromObject(source).expandByScalar(.11);
  geometry.boundingBox=bounds;geometry.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
  group.userData.fiberCount+=count;meshes.push(mesh);group.add(mesh);
 }
 group.userData.updateLOD=camera=>{
  for(const mesh of meshes){
   const distance=camera.position.distanceTo(mesh.geometry.boundingSphere.center)-mesh.geometry.boundingSphere.radius;
   const fraction=distance<3.2?1:distance<6?.65:distance<11?.35:.18;
   mesh.geometry.instanceCount=Math.ceil(mesh.userData.fiberCount*fraction);
  }
 };
 return group;
}
