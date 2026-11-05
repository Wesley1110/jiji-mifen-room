import * as THREE from 'three/webgpu';
import {createPinkCarrotPlushes} from './wardrobe-plush.js?revision=bunny-wardrobe-5';
import {contactShadow} from './house-craft.js';

// Reuse the approved wardrobe sewing pattern, materials and curved fibres.
// The living-room copies have their own geometry, fitted to the actual seat.
export function createSofaCarrots(bench){
 const source=createPinkCarrotPlushes({detail:'large',pose:'loose',plump:1.38});
 const portrait=new THREE.Group();portrait.name='Reading room | original carrot embroidery template';
 source.children[0].traverse(o=>{
  if(!o.isMesh||o.userData.pile)return;
  const part=new THREE.Mesh(o.geometry.clone(),o.material);part.name=o.name;portrait.add(part);
 });
 const root=new THREE.Group();root.name='Reading room | two pink carrot cushions';bench.add(root);
 const placements=[
  {x:-.84,scale:.51,pitch:-.32,yaw:-.10,roll:.74},
  {x:.85,scale:.49,pitch:-.23,yaw:.15,roll:-.93}
 ];
 const seat=1.067,back=-.225,report=[];
 const softMax=(v,limit,width)=>{
  const d=v-limit;return d>width?v:d< -width?limit:limit+(d+width)**2/(4*width);
 };
 const warp=p=>new THREE.Vector3(p.x,softMax(p.y,seat,.045),softMax(p.z,back,.040));
 for(const [index,doll] of [...source.children].entries()){
  const spec=placements[index];root.add(doll);doll.name='Reading room | '+(index?'blush':'rose')+' resting carrot cushion';
  doll.scale.setScalar(spec.scale);doll.rotation.set(spec.pitch,spec.yaw,spec.roll);
  doll.updateMatrix();
  const body=doll.getObjectByName('Carrot plush | continuous padded carrot body');
  const bodyBox=new THREE.Box3(),bodyPoint=new THREE.Vector3(),bodyVertices=body.geometry.attributes.position;
  for(let i=0;i<bodyVertices.count;i++)bodyBox.expandByPoint(bodyPoint.fromBufferAttribute(bodyVertices,i).applyMatrix4(doll.matrix));
  doll.position.set(spec.x-(bodyBox.min.x+bodyBox.max.x)/2,seat-.055-bodyBox.min.y,back-.028-bodyBox.min.z);
  doll.updateMatrix();const matrix=doll.matrix.clone(),nm=new THREE.Matrix3().getNormalMatrix(matrix);
  const p=new THREE.Vector3(),n=new THREE.Vector3(),t=new THREE.Vector3();
  doll.traverse(o=>{
   if(!o.isMesh)return;
   const g=o.geometry.clone(),isFur=!!o.userData.pile,attr=isFur?g.attributes.pileRoot:g.attributes.position;
   const normals=g.attributes.pileNormal,flow=g.attributes.pileFlow;
   for(let i=0;i<attr.count;i++){
    p.fromBufferAttribute(attr,i).applyMatrix4(matrix);
    const dy=THREE.MathUtils.clamp((p.y-seat+.045)/.090,.07,1),dz=THREE.MathUtils.clamp((p.z-back+.040)/.080,.07,1),q=warp(p);
    attr.setXYZ(i,q.x,q.y,q.z);
    if(isFur){
     attr.setW(i,attr.getW(i)*spec.scale);
     n.set(normals.getX(i),normals.getY(i),normals.getZ(i)).applyMatrix3(nm);n.y/=dy;n.z/=dz;n.normalize();
     let length=normals.getW(i)*spec.scale;
     if(n.y<-.05)length=Math.min(length,Math.max(.00035,(q.y-seat+.002)/-n.y));
     if(n.z<-.05)length=Math.min(length,Math.max(.00035,(q.z-back+.002)/-n.z));
     normals.setXYZ(i,n.x,n.y,n.z);normals.setW(i,length);
     t.set(flow.getX(i),flow.getY(i),flow.getZ(i)).transformDirection(matrix);t.y*=dy;t.z*=dz;t.normalize();flow.setXYZ(i,t.x,t.y,t.z);
    }
   }
   if(isFur){
    g.boundingBox=new THREE.Box3().setFromBufferAttribute(attr).expandByScalar(.023);
    g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
    o.frustumCulled=true;
   }else{g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
   o.geometry.dispose();o.geometry=g;
  });
  doll.position.set(0,0,0);doll.rotation.set(0,0,0);doll.scale.setScalar(1);
  const bounds=body.geometry.boundingBox;
  report.push({name:doll.name,face:false,tiltDegrees:Math.round(Math.abs(spec.roll)*180/Math.PI),seatContact:bounds.min.y,backContact:bounds.min.z,bodyBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});
  contactShadow(bench,spec.x,.075,.35,.30,.13,seat+.001);
 }
 root.userData={revision:'carrot-lounge-1',count:2,sameWardrobePattern:true,faceless:true,fibresPerCushion:43400,resting:report};
 return {root,portrait};
}

// A shallow sewn picture, with the exact carrot silhouette and cloth leaves.
// It replaces the old leaf embroidery while retaining the original hinoki frame.
export function createCarrotPicture(frame,template){
 const art=new THREE.Group();art.name='Reading room | framed pink carrot embroidery';
 art.position.set(-.025,.070,.044);art.rotation.z=-.15;art.scale.set(.138,.138,.029);
 for(const part of template.children){part.castShadow=false;part.receiveShadow=true;art.add(part.clone());}
 frame.add(art);art.userData={sameWardrobePattern:true,subject:'faceless pink carrot with three sage cloth leaves',technique:'raised velour embroidery'};
 return art;
}
