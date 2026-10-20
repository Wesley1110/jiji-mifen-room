import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BED_LIFT=.50;
export const BEAR_LIFT=.68;

function wovenTexture(){
 const size=512,pixels=new Uint8Array(size*size*4);
 const height=(x,y)=>Math.sin(x*Math.PI/4)*(.65+.35*Math.cos(y*Math.PI/4))*.16+Math.sin(y*Math.PI/4)*.13;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(height(x-1,y)-height(x+1,y))*.6,dy=(height(x,y-1)-height(x,y+1))*.6,n=Math.hypot(dx,dy,1),k=(y*size+x)*4;
  pixels[k]=(dx/n*.5+.5)*255;pixels[k+1]=(dy/n*.5+.5)*255;pixels[k+2]=(1/n*.5+.5)*255;pixels[k+3]=255;
 }
 const t=new THREE.DataTexture(pixels,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,8);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;
}

// Make the bedding as closed, volumetric meshes. In particular, the duvet is
// not a painted sheet: the top, underside and rounded edge are all geometry.
export function createPlushBedding(root){
 const group=new THREE.Group();group.name='Lofted bedding';
 let replaced=0;
 root.traverse(o=>{const n=o.userData.sourceName||'';if(o.isMesh&&(n==='Bed | cotton mattress'||n.startsWith('Pillow |')||n.startsWith('Quilt |'))){o.visible=false;replaced++;}});
 const weave=wovenTexture();
 // Grazing-angle cloth sheen can produce dark edge fragments in the WebGPU
 // physical BRDF. Fine woven normals and broad diffuse light supply the texture.
 const cloth=(name,color)=>new THREE.MeshPhysicalMaterial({name,color,normalMap:weave,normalScale:new THREE.Vector2(.55,.55),roughness:.94,metalness:0,sheen:0,specularIntensity:.12});
 const ticking=cloth('Mattress | woven milk tea ticking','#b39473');
 const oatmeal=cloth('Bedding | warm oat cotton','#c3a07b');
 const pillowRose=cloth('Pillow | muted terracotta rose','#b87f73');
 const duvetRose=cloth('Duvet | brushed dusty rose','#b9867c');
 const underside=cloth('Duvet | warm linen reverse','#c9a581');
 const welt=cloth('Bedding | soft caramel piping','#98735b');
 const thread=cloth('Bedding | warm thread','#d2b697');
 const edgeFabric=material=>{const edge=material.clone();edge.name=material.name+' | edge';edge.normalMap=null;return edge;};
 function mesh(name,g,m,parent=group){const o=new THREE.Mesh(g,m);o.name='Bedding | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function tube(name,points,r,mat,parent=group,closed=false){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');return mesh(name,new THREE.TubeGeometry(c,Math.max(48,points.length*2),r,8,closed),mat,parent);}
 function roundedPerimeter(w,d,r,y,z0){
  const pts=[];
  for(const [cx,cz,a] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]]){
   for(let j=0;j<20;j++){const t=a+j/20*Math.PI/2;pts.push([cx+Math.cos(t)*r,y,cz+Math.sin(t)*r+z0]);}
  }
  return pts;
 }
 const core=mesh('deep upholstered mattress',new RoundedBoxGeometry(5.18,.78,5.88,6,.19),ticking);core.position.set(0,1.12,.55);
 const topper=mesh('soft separate pillow top',new RoundedBoxGeometry(5.22,.24,5.91,6,.115),oatmeal);topper.position.set(0,1.54,.55);
 tube('mattress upper welt',roundedPerimeter(5.18,5.88,.20,1.43,.55),.018,welt,group,true);
 tube('mattress lower welt',roundedPerimeter(5.18,5.88,.20,.84,.55),.015,welt,group,true);
 tube('pillow top rolled seam',roundedPerimeter(5.22,5.91,.16,1.55,.55),.020,thread,group,true);
 // A few restrained side-panel quilting seams make the upholstered sidewall
 // legible even when the duvet hangs over part of the mattress.
 for(const x of [-2.591,2.591])for(let i=0;i<9;i++){
  const z=-2.05+i*.65,pts=[];
  for(let j=0;j<=20;j++){const t=j/20;pts.push([x+(x<0?-.002:.002),.89+t*.49,z+.035*Math.sin(t*Math.PI*2)]);}
  tube('mattress side stitching',pts,.0045,thread);
 }

 function pillow(name,center,w,h,d,mat,tilt){
  const parent=new THREE.Group();parent.name='Bedding | '+name;parent.position.fromArray(center);parent.rotation.set(-.18,center[0]<0?.10:-.10,tilt);group.add(parent);
  const nx=64,ny=56,positions=[],uvs=[],indices=[];
  function point(u,v,side){
   const x=w*.5*u*(1-.075*v**8),y=h*.5*v*(1-.075*u**8);
   const fill=Math.max(0,(1-u*u)*(1-v*v))**.45;
   const wrinkles=(Math.sin(v*43+Math.sin(v*11))*Math.exp(-(((1-Math.abs(u))/.16)**2))+Math.sin(u*47+Math.sin(u*13))*Math.exp(-(((1-Math.abs(v))/.16)**2)))*.014;
   const dent=.055*Math.exp(-(((u-.12)/.40)**2)-((v+.08)/.42)**2);
   return [x,y,side*(.028+d*.5*fill+wrinkles*fill-(side>0?dent:0))];
  }
  for(const side of [1,-1])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const u=i/nx*2-1,v=j/ny*2-1;positions.push(...point(u,v,side));uvs.push(i/nx,j/ny);
  }
  const count=(nx+1)*(ny+1);
  for(let side=0;side<2;side++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   const a=side*count+j*(nx+1)+i,b=a+1,c=a+nx+1,e=c+1;
   side?indices.push(a,c,b,b,c,e):indices.push(a,b,c,b,e,c);
  }
  const border=[];
  for(let i=0;i<=nx;i++)border.push(i);
  for(let j=1;j<=ny;j++)border.push(j*(nx+1)+nx);
  for(let i=nx-1;i>=0;i--)border.push(ny*(nx+1)+i);
  for(let j=ny-1;j>0;j--)border.push(j*(nx+1));
  for(let i=0;i<border.length;i++){const a=border[i],b=border[(i+1)%border.length];indices.push(a,a+count,b,b,a+count,b+count);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);
  g.addGroup(0,nx*ny*12,0);g.addGroup(nx*ny*12,indices.length-nx*ny*12,1);g.computeVertexNormals();mesh(name+' down-filled body',g,[mat,edgeFabric(mat)],parent);
  const edge=border.map(k=>[positions[k*3],positions[k*3+1],0]);tube(name+' soft pinched edge',edge,.018,welt,parent,true);
  const seam=edge.map(([x,y])=>[x*.955,y*.955,.15]);tube(name+' inset stitch',seam,.004,thread,parent,true);
 }
 pillow('oat pillow',[-1.30,2.75,-1.82],2.40,2.05,1.04,oatmeal,-.10);
 pillow('rose pillow',[1.25,2.73,-1.86],2.40,2.00,1.04,pillowRose,.10);

 const nu=144,nv=120;
 function drape(u,v){
  const s=(u-.5)*6.0,t=v*4.0,ax=Math.abs(s),sx=Math.max(0,ax-2.38),ez=Math.max(0,t-2.72);
  // Follow the rounded mattress shoulder before hanging vertically. Dropping
  // immediately at the top edge would make the mattress seams pierce the quilt.
  const sideAngle=Math.min(sx/.48,1)*Math.PI/2,endAngle=Math.min(ez/.50,1)*Math.PI/2;
  const x=ax<=2.38?s:Math.sign(s)*(2.38+.35*Math.sin(sideAngle)+.020*Math.max(0,(sx-.48)/.14));
  const z=t<=2.72?.55+t:3.27+.36*Math.sin(endAngle)+.020*Math.max(0,(ez-.50)/.78);
  const fold=.022*Math.sin(s*4.2+t*1.6)+.014*Math.sin(s*8.3-t*1.5);
  const base=1.725-.35*(1-Math.cos(sideAngle))-.36*(1-Math.cos(endAngle))-.10*Math.max(0,(sx-.48)/.14)-.14*Math.max(0,(ez-.50)/.78)+fold;
  const seam=Math.sin(Math.PI*(v*5+.12*Math.cos(u*Math.PI*4)));
  const loft=.15+.13*Math.pow(seam*seam,.55);
  const edge=Math.sin(Math.PI*u)**.28*Math.sin(Math.PI*v)**.28;
  // Lower the rear seam gently beneath the turned-back fold.
  const depth=(.13+(loft-.13)*edge)*(.80+.20*THREE.MathUtils.smoothstep(v,0,.12));
  return {x,z,base,depth};
 }
 function clothPoint(surface,u,v,top){
  const p=surface(u,v),e=.0001;
  const ua=surface(Math.max(0,u-e),v),ub=surface(Math.min(1,u+e),v),va=surface(u,Math.max(0,v-e)),vb=surface(u,Math.min(1,v+e));
  const du=new THREE.Vector3(ub.x-ua.x,ub.base-ua.base,ub.z-ua.z),dv=new THREE.Vector3(vb.x-va.x,vb.base-va.base,vb.z-va.z);
  // Offset perpendicular to the cloth, including its hanging sides. A simple
  // Y-only offset would put both faces in the same plane at a vertical hem.
  const n=dv.cross(du).normalize(),offset=(top?.5:-.5)*p.depth;
  return [p.x+n.x*offset,p.base+p.depth*.5+n.y*offset,p.z+n.z*offset];
 }
 function closedCloth(name,nx,ny,surface,matTop,matBottom){
  const pos=[],uv=[],ind=[],count=(nx+1)*(ny+1);
  for(const top of [true,false])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const u=i/nx,v=j/ny;pos.push(...clothPoint(surface,u,v,top));uv.push(u,v);
  }
  for(let side=0;side<2;side++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   const a=side*count+j*(nx+1)+i,b=a+1,c=a+nx+1,e=c+1;
   side?ind.push(a,b,c,b,e,c):ind.push(a,c,b,b,c,e);
  }
  const faceIndices=nx*ny*6,border=[];
  for(let i=0;i<=nx;i++)border.push(i);for(let j=1;j<=ny;j++)border.push(j*(nx+1)+nx);
  for(let i=nx-1;i>=0;i--)border.push(ny*(nx+1)+i);for(let j=ny-1;j>0;j--)border.push(j*(nx+1));
  for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length];ind.push(a,b,a+count,b,b+count,a+count);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);
  // Closing quads share the face UVs. Use unperturbed fabric normals on that
  // narrow rim: its collapsed UV derivatives would otherwise cause black edges.
  g.addGroup(0,faceIndices,0);g.addGroup(faceIndices,faceIndices,1);g.addGroup(faceIndices*2,ind.length-faceIndices*2,2);g.computeVertexNormals();
  const o=mesh(name,g,[matTop,matBottom,edgeFabric(matBottom)]);
  const edge=border.map(k=>[0,1,2].map(axis=>(pos[k*3+axis]+pos[(k+count)*3+axis])*.5));
  tube(name+' thick rolled binding',edge,.022,matBottom,group,true);return o;
 }
 const duvet=closedCloth('lofted rose duvet',nu,nv,drape,duvetRose,underside);
 // Sewn channels follow the actual deformed top surface rather than a flat map.
 for(let row=1;row<5;row++){
  const points=[];for(let i=0;i<=160;i++){
   const u=i/160,v=(row-.12*Math.cos(u*Math.PI*4))/5,p=clothPoint(drape,u,v,true);p[1]+=.004;points.push(p);
  }
  tube('duvet stitched channel',points,.0037,welt);
 }
 function cuff(u,v){
  const p=drape(u,0),x=p.x,z=.48+.43*v;
  return {x,z,base:p.base+.10+.14*Math.sin(Math.PI*v),depth:.105};
 }
 closedCloth('plump turned-back oat fold',128,28,cuff,underside,oatmeal);
 group.userData={revision:'bedding-2',replacedMeshes:replaced,mattress:{coreThickness:.78,topperThickness:.24,top:1.66},duvet:{minimumThickness:.104,maximumThickness:.28},characterLift:BED_LIFT,bearLift:BEAR_LIFT};
 return group;
}

// Translate the assembled toys and their matching fur together after grooming.
// Shape, pose, colors and all native fiber records remain unchanged.
export function placeBedOccupants(root,fur){
 const lift=name=>name.startsWith('Bear blanket |')?BEAR_LIFT:/^(Jiji|Mifen) \|/.test(name)?BED_LIFT:0;
 const shifted=[];
 root.traverse(o=>{
  const amount=lift(o.userData.sourceName||'');if(!amount)return;
  let parent=o.parent;while(parent&&parent!==root){if(lift(parent.userData.sourceName||''))return;parent=parent.parent;}
  o.position.y+=amount;shifted.push(o.name);
 });
 for(const mesh of fur.children){
  const amount=lift(mesh.name.replace('Plush fibers | ',''));if(!amount)continue;
  // Hair shaders use world-space roots for their camera-facing ribbons and
  // shadow lookup. Move those roots, not just the Object3D transform.
  const roots=mesh.geometry.attributes.fiberRoot;
  for(let i=0;i<roots.count;i++)roots.setY(i,roots.getY(i)+amount);
  roots.needsUpdate=true;mesh.geometry.boundingBox.min.y+=amount;mesh.geometry.boundingBox.max.y+=amount;mesh.geometry.boundingSphere.center.y+=amount;
 }
 root.updateMatrixWorld(true);fur.updateMatrixWorld(true);return shifted.length;
}
