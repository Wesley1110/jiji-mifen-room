import * as THREE from 'three/webgpu';
import {craft,roundedShape} from './house-craft.js';
import {carrotRadius,CARROT_BODY_HEIGHT} from './wardrobe-plush-physics.js?revision=carrot-rest-3';
import {runnerMaterial} from './foyer-textiles.js?revision=foyer-sewn-2';

const W=1.94,L=5.82,R=.17,TOP=.038;

// All the exposed yarn is batched in a single mesh. Each stitch has its
// own cross-section, thread colour, and two ends tucked into the backing.
function yarnBatch() {
  const pos=[],rgb=[],indices=[];
  function vertex(p,color,shade=1) {
    pos.push(p.x,p.y,p.z);rgb.push(color.r*shade,color.g*shade,color.b*shade);
  }
  function thread(path,radius,color,vertical=1,sides=6) {
    const start=pos.length/3,previous=new THREE.Vector3(),next=new THREE.Vector3();
    const tangent=new THREE.Vector3(),across=new THREE.Vector3(),up=new THREE.Vector3();
    const p=new THREE.Vector3();
    for(let i=0;i<path.length;i++) {
      previous.copy(path[Math.max(0,i-1)]); next.copy(path[Math.min(path.length-1,i+1)]);
      tangent.subVectors(next,previous).normalize();across.set(tangent.z,0,-tangent.x).normalize();
      up.crossVectors(tangent,across);
      for(let j=0;j<sides;j++) {
        const angle=j*2*Math.PI/sides;
        p.copy(path[i]).addScaledVector(across,Math.cos(angle)*radius).addScaledVector(up,Math.sin(angle)*radius*vertical);
        vertex(p,color,.88+.12*Math.max(0,Math.sin(angle)));
        if(i>0) {
          const a=start+(i-1)*sides+j,b=start+(i-1)*sides+(j+1)%sides;
          indices.push(a,b,a+sides,b,b+sides,a+sides);
        }
      }
    }
  }
  function backing(point,color) {
    const start=pos.length/3,rows=32,cols=12;
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++){
      const u=i/cols*2-1;
      vertex(point(u,j/rows),color,.77+.18*(1-Math.abs(u)));
      if(i<cols&&j<rows){const k=start+j*(cols+1)+i; indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
    }
  }
  function geometry(){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));
    g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
  return {thread,backing,geometry};
}

// Evaluate the rounded rectangle by distance so stitch spacing stays the
// same on the straights and through the corners. Positive normal is outward.
function hemTrack(inset) {
  const x=W/2-inset,z=L/2-inset,r=R-inset;
  const w=2*(x-r),h=2*(z-r),q=r*Math.PI/2,length=2*(w+h)+4*q;
  const spans=[w,q,h,q,w,q,h,q];
  function at(t) {
    let d=((t%1+1)%1)*length;
    let i=0;while(i<7&&d>spans[i])d-=spans[i++];
    if(i===0)return [x-r-d,z,0,1];
    if(i===2)return [-x,z-r-d,-1,0];
    if(i===4)return [-x+r+d,-z,0,-1];
    if(i===6)return [x,-z+r+d,1,0];
    const quadrant=(i-1)/2,angle=Math.PI/2+quadrant*Math.PI/2+d/r;
    const nx=Math.cos(angle),nz=Math.sin(angle);
    return [(quadrant===0||quadrant===1?-1:1)*(x-r)+r*nx,
      (quadrant===0||quadrant===3?1:-1)*(z-r)+r*nz,nx,nz];
  }
  return {at,length};
}

function bindEdges(batch) {
  const edge=hemTrack(.016),turns=Math.round(edge.length/.043),steps=turns*5;
  const strands=['#b89f7d','#d2bb98','#c7ad89'];
  for(let ply=0;ply<3;ply++){
    const points=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,[x,z,nx,nz]=edge.at(t),a=t*turns*Math.PI*2+ply*Math.PI*2/3;
      points.push(new THREE.Vector3(x+nx*.011*Math.cos(a),.029+.011*Math.sin(a),z+nz*.011*Math.cos(a)));
    }
    batch.thread(points,.010,new THREE.Color(strands[ply]),.92,5);
  }
  for(const [inset,hex] of [[.049,'#b87f82'],[.067,'#839072']]){
    const track=hemTrack(inset),n=Math.round(track.length/.043),color=new THREE.Color(hex);
    for(let i=0;i<n;i++){
      const path=[];
      for(let k=0;k<=3;k++){
        const t=k/3,[x,z]=track.at((i+.05+t*.81)/n);
        path.push(new THREE.Vector3(x,TOP-.002+.005*Math.sin(t*Math.PI),z));
      }
      batch.thread(path,.0036,color,.76,5);
    }
  }
}

function stitchCarrot(batch,centerZ,angle) {
  const rose=['#ce8e9a','#da9fab','#d495a1','#db9da6'].map(c=>new THREE.Color(c));
  const sage=['#82916f','#93a17d','#8d9a77','#a2ad88'].map(c=>new THREE.Color(c));
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const place=(x,y,z)=>new THREE.Vector3(x*cos+z*sin,TOP+y,centerZ+z*cos-x*sin);
  const dome=(u,t)=>Math.sqrt(Math.max(0,1-u*u))*Math.sin(Math.PI*t)**.65;
  function fill(point,palette,rows,radius) {
    batch.backing(point,palette[0]);
    for(let j=1;j<rows;j++) {
      const path=[],t=j/rows;
      for(let k=0;k<=12;k++){
        const u=k/6-1;
        const row=t+(.025*u+.014*(1-u*u))*Math.sin(Math.PI*t);
        path.push(point(u,row));
      }
      batch.thread(path,radius,palette[(j*7+Math.floor(j/7))%palette.length],.69,5);
    }
  }
  for(const [tilt,length,width] of [[-.72,.126,.028],[.65,.122,.027],[-.07,.153,.032]]){
    const leaf=(u,t)=>{
      const across=u*width*Math.sin(Math.PI*t)**.61,along=-length*t;
      return place(across*Math.cos(tilt)-along*Math.sin(tilt),
        .006+.017*dome(u,t),-.133+across*Math.sin(tilt)+along*Math.cos(tilt));
    };
    fill(leaf,sage,25,.0025);
    const midrib=[];
    for(let j=2;j<22;j++){const p=leaf(-.095*Math.sin(j/24*Math.PI),j/24);p.y+=.003;midrib.push(p);}
    batch.thread(midrib,.0018,sage[0],.75,5);
  }
  const body=(u,t)=>{
    const half=carrotRadius(.025+t*CARROT_BODY_HEIGHT)*1.52*.192;
    return place(u*half+.010*(1-t)**2,.007+.038*dome(u,t),.18-.336*t);
  };
  fill(body,rose,58,.0033);
  for(const [t,mid,span] of [[.73,-.27,.50],[.50,.23,.43],[.27,-.16,.35]]){
    const path=[];
    for(let j=0;j<=9;j++){
      const s=j/9,p=body(mid+(s-.5)*span,t-.014*Math.sin(s*Math.PI));
      p.y+=.0034;path.push(p);
    }
    batch.thread(path,.0042,new THREE.Color('#ad6e7e'),.65);
  }
}

export function makeRunner(parent,m) {
  const {group,panel,mesh}=craft(parent,'Foyer');
  const runner=group('garden hall runner',[-.28,-.038,4.64]);
  const bound=panel(runner,'wool backing',roundedShape(W-.013,L-.013,R-.006),
    [0,.002,0],.030,m.cream,.004);
  bound.rotation.x=-Math.PI/2;
  const field=new THREE.ShapeGeometry(roundedShape(W-.031,L-.031,R-.016),32);
  const uv=field.attributes.uv,p=field.attributes.position;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/W+.5,p.getY(i)/L+.5);
  const face=mesh(runner,'woven herringbone field',field,runnerMaterial(W,L));
  face.rotation.x=-Math.PI/2;face.position.y=TOP;face.castShadow=false;
  const yarn=yarnBatch();bindEdges(yarn);
  stitchCarrot(yarn,2.48,-.43);stitchCarrot(yarn,-2.48,Math.PI-.43);
  const threadMat=new THREE.MeshPhysicalMaterial({name:'Foyer | dyed wool and embroidery floss',
    vertexColors:true,roughness:.91,sheen:.17,sheenRoughness:.87,specularIntensity:.20});
  mesh(runner,'plied selvage, hand stitches and raised carrot embroidery',yarn.geometry(),threadMat);
  return runner;
}
