import * as THREE from 'three/webgpu';
import {attribute, cameraPosition, materialColor, mix, modelWorldMatrixInverse, normalGeometry, positionGeometry, transformNormalToView, uniform, uv, vec3, vec4, mx_noise_float} from 'three/tsl';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

function sampler(geometry) {
  const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,n=g.attributes.normal;
  const end=Math.min(p.count,g.drawRange.count),triangles=[],areas=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let total=0,seed=5731;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<end;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const area=b.sub(a).cross(c.sub(a)).length()*.5;if(area>1e-12){total+=area;triangles.push(i);areas.push(total);}}
  return {random,sample(point,normal){
    const target=random()*total;let low=0,high=areas.length-1;
    while(low<high){const mid=(low+high)>>1;if(areas[mid]<target)low=mid+1;else high=mid;}
    const i=triangles[low],s=Math.sqrt(random()),t=random(),w=[1-s,s*(1-t),s*t];point.set(0,0,0);normal.set(0,0,0);
    for(let k=0;k<3;k++){point.addScaledVector(a.fromBufferAttribute(p,i+k),w[k]);normal.addScaledVector(a.fromBufferAttribute(n,i+k),w[k]);}normal.normalize();
  }};
}

function fabric(color) {
  const mat=new THREE.MeshPhysicalNodeMaterial({color,roughness:1,metalness:0,specularIntensity:.08});
  const grain=mx_noise_float(positionGeometry.mul(240));
  mat.colorNode=materialColor.rgb.mul(grain.mul(.035).add(.97));
  mat.normalNode=transformNormalToView(normalGeometry.add(vec3(
    mx_noise_float(positionGeometry.mul(320)),mx_noise_float(positionGeometry.mul(320).add(19)),mx_noise_float(positionGeometry.mul(320).add(47))
  ).mul(.15)).normalize()).normalize();
  return mat;
}

// Dense bent fibers form overlapping loops, with soft variation shared by each tuft.
// The arm's compensation keeps pile height fixed while the forearm reaches forward.
function pile(parent,geometry,{count,length,width,color,skip=()=>false,stretch=uniform(1),velour=false,tuft=false}) {
  const sample=sampler(geometry),point=new THREE.Vector3(),normal=new THREE.Vector3(),tangent=new THREE.Vector3(),cross=new THREE.Vector3();
  const roots=[],directions=[],tangents=[];
  for(let i=0;i<count;i++){
    sample.sample(point,normal);if(skip(point))continue;
    tangent.set(Math.abs(normal.y)>.9?1:0,Math.abs(normal.y)>.9?0:1,0).cross(normal).normalize();cross.crossVectors(normal,tangent);
    const flow=Math.sin(point.x*90+point.z*73)+Math.cos(point.y*105-point.z*60);
    const angle=flow*2.1+(sample.random()-.5)*.65;
    tangent.multiplyScalar(Math.cos(angle)).addScaledVector(cross,Math.sin(angle));
    const tuft=.83+.17*Math.sin(point.x*142+Math.sin(point.y*83)*2+point.z*110);
    roots.push(point.x,point.y,point.z,width*(.7+sample.random()*.6));
    directions.push(normal.x,normal.y,normal.z,length*tuft*(.75+sample.random()*.5));
    tangents.push(tangent.x,tangent.y,tangent.z,flow+(sample.random()-.5)*.9);
  }
  const stations=velour?4:8,positions=[],uvs=[],normals=[],indices=[];
  if(tuft){
    for(let j=0;j<=stations;j++)for(let k=0;k<6;k++){
      const angle=k/6*Math.PI*2;positions.push(Math.cos(angle),j/stations,Math.sin(angle));uvs.push(k/6,j/stations);normals.push(0,1,0);
      if(j<stations){const a=j*6+k,b=j*6+(k+1)%6;indices.push(a,b,a+6,a+6,b,b+6);}
    }
  }else for(let j=0;j<=stations;j++){const t=j/stations;positions.push(-1,t,0,1,t,0);uvs.push(0,t,1,t);normals.push(0,1,0,0,1,0);if(j<stations){const k=j*2;indices.push(k,k+1,k+2,k+2,k+1,k+3);}}
  const g=new THREE.InstancedBufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);
  g.setAttribute('pileRoot',new THREE.InstancedBufferAttribute(new Float32Array(roots),4));g.setAttribute('pileDirection',new THREE.InstancedBufferAttribute(new Float32Array(directions),4));g.setAttribute('pileTangent',new THREE.InstancedBufferAttribute(new Float32Array(tangents),4));g.instanceCount=roots.length/4;
  const a=attribute('pileRoot','vec4'),n=attribute('pileDirection','vec4'),v=attribute('pileTangent','vec4');
  const t=positionGeometry.y,b=n.xyz.cross(v.xyz),phase=v.w;
  const height=t.mul(Math.PI*.85).sin().mul(.72).add(t.mul(.2));
  const bend=t.mul(Math.PI*1.65).add(phase).sin().sub(phase.sin()).mul(.38).mul(t);
  const curl=t.mul(Math.PI*1.65).add(phase).cos().sub(phase.cos()).mul(.26).mul(t);
  const displacement=n.xyz.mul(n.w).mul(height).add(v.xyz.mul(n.w).mul(bend)).add(b.mul(n.w).mul(curl));
  const compensate=vec3(1,stretch.reciprocal(),1);
  const center=a.xyz.add(displacement.mul(compensate));
  const localCamera=modelWorldMatrixInverse.mul(vec4(cameraPosition,1)).xyz;
  const ribbon=n.xyz.cross(localCamera.sub(center));
  const side=ribbon.dot(ribbon).greaterThan(.000001).select(ribbon,v.xyz).normalize();
  const material=new THREE.MeshPhysicalNodeMaterial({color,roughness:1,metalness:0,specularIntensity:0,side:THREE.DoubleSide});
  const section=tuft?v.xyz.mul(positionGeometry.x).add(b.mul(positionGeometry.z)):side.mul(positionGeometry.x);
  material.positionNode=center.add(section.mul(a.w).mul(mix(1,.08,t)).mul(compensate));
  const groomNormal=tuft?n.xyz.add(section.mul(.45)):n.xyz.add(v.xyz.mul(t.mul(Math.PI*2).add(phase).sin()).mul(.22)).add(b.mul(.08));
  material.normalNode=transformNormalToView(groomNormal.normalize()).normalize();
  material.colorNode=materialColor.rgb.mul(mix(.84,1.04,uv().y.clamp(0,1))).mul(phase.mul(2.3).sin().mul(.025).add(.975));
  const mesh=new THREE.Mesh(g,material);mesh.name=velour?'coffee fabric nap':'dense cream curly pile';mesh.frustumCulled=false;mesh.userData.isHand=true;mesh.userData.pileCount=g.instanceCount;parent.add(mesh);
  return mesh;
}

export function createBearPaw() {
  const root=new THREE.Group();root.name='Cream teddy glove from reference';
  const cream='#efb77b',coffee='#9f7460',coat=fabric(cream),padMaterial=fabric(coffee);
  // Three plump fingers and a curved side thumb form a stuffed mitten, not a flat paw print.
  const toes=[[.137,.133,.078],[.045,.224,.095],[-.089,.19,.087]];
  const parts=[
    [0,-.025,0,.184,.195,.125,0],
    [0,-.235,.007,.159,.095,.132,0],
    [-.163,-.001,-.062,.095,.135,.092,.40],
    ...toes.map(([x,y,r])=>[x,y,0,r,r,.108,0])
  ];
  const size=80,extent=.42,surface=new MarchingCubes(size,coat,false,false,22000);
  const blend=(a,b)=>{const h=Math.max(.032-Math.abs(a-b),0)/.032;return Math.min(a,b)-h*h*.032*.25;};surface.isolation=0;
  for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=(x/size*2-1)*extent,py=(y/size*2-1)*extent,pz=(z/size*2-1)*extent;let d=1;
    for(const [cx,cy,cz,rx,ry,rz,angle] of parts){const dx=px-cx,dy=py-cy,c=Math.cos(angle),s=Math.sin(angle);d=blend(d,(Math.hypot((c*dx+s*dy)/rx,(-s*dx+c*dy)/ry,(pz-cz)/rz)-1)*Math.min(rx,ry,rz));}
    surface.field[x+y*size+z*size*size]=-d;
  }
  surface.update();surface.geometry.scale(extent,extent,extent);
  const mitten=new THREE.Mesh(surface.geometry,coat);mitten.name='stuffed paw with side thumb';mitten.userData.isHand=true;root.add(mitten);
  const pads=[
    {x:.016,y:-.048,z:-.132,rx:.111,ry:.124,rz:.024,center:true},
    ...toes.map(([x,y,r])=>({x,y:y-.008,z:-.111,rx:r*.50,ry:r*.57,rz:.018}))
  ];
  const skip=p=>p.z<-.065&&pads.some(q=>((p.x-q.x)/(q.rx*.96))**2+((p.y-q.y)/(q.ry*.96))**2<1);
  pile(root,surface.geometry,{count:76000,length:.026,width:.0009,color:cream,skip});
  pile(root,surface.geometry,{count:6500,length:.028,width:.0018,color:cream,skip,tuft:true});
  for(const q of pads){
    const g=new THREE.SphereGeometry(1,40,28),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const notch=q.center ? .11*Math.exp(-((x/.36)**2))*Math.max(y,0) : 0;
      p.setXYZ(i,q.x+x*q.rx*(1+.06*y),q.y+(y-notch)*q.ry,q.z+z*q.rz);
    }
    g.computeVertexNormals();
    const pad=new THREE.Mesh(g,padMaterial);pad.name=q.center?'rounded coffee fabric palm pad':'inset coffee toe pad';pad.userData.isHand=true;root.add(pad);
    pile(root,g,{count:q.center?12000:3500,length:.0032,width:.00030,color:coffee,velour:true});
  }
  // Rounded, thick forearm overlaps the stuffed wrist and shares the same curly pile.
  const profile=[new THREE.Vector2(0,-.5),new THREE.Vector2(.22,-.495),new THREE.Vector2(.263,-.46),new THREE.Vector2(.278,-.36),new THREE.Vector2(.271,-.16),new THREE.Vector2(.244,.06),new THREE.Vector2(.204,.27),new THREE.Vector2(.166,.43),new THREE.Vector2(.142,.5),new THREE.Vector2(0,.5)];
  const armGeometry=new THREE.LatheGeometry(profile,48),arm=new THREE.Mesh(armGeometry,coat);arm.name='thick cream teddy forearm';arm.userData.isHand=true;arm.visible=false;
  const stretch=uniform(1);pile(arm,armGeometry,{count:135000,length:.029,width:.00095,color:cream,stretch});
  pile(arm,armGeometry,{count:14000,length:.03,width:.0017,color:cream,stretch,tuft:true});
  arm.userData.setLength=value=>{stretch.value=Math.max(.1,value);};
  root.userData.design={reference:'cream curly teddy glove',fingers:3,sideThumb:true,padShape:'rounded bean',pile:'dense curls',forearm:'plump tapered stuffing'};
  root.visible=false;root.scale.setScalar(.78);return {root,arm};
}
