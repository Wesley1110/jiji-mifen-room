import * as THREE from 'three/webgpu';
import {attribute,cameraPosition,materialColor,mix,modelWorldMatrix,modelWorldMatrixInverse,positionGeometry,transformNormalToView,uv,vec4} from 'three/tsl';

// Stuffed animal slippers: round heads, padded collars and recessed foot pockets.
export function createBedsideSlippers(nap){
 const group=new THREE.Group();group.name='Bedside character slippers';
 const fabric=(name,color)=>new THREE.MeshPhysicalMaterial({name,color,roughness:.96,metalness:0,sheen:0,specularIntensity:.08,normalMap:nap,normalScale:new THREE.Vector2(.34,.34)});
 const cream=fabric('Slippers | cream felt sole','#d7c6a5'),jiji=fabric('Slippers | pale custard plush','#edcf87'),mifen=fabric('Slippers | peach milk plush','#e1aeb0');
 const pinkInside=fabric('Slippers | warm blush lining','#c18f98'),yellowInside=fabric('Slippers | warm honey lining','#cbb27d');
 const beak=fabric('Slippers | apricot beak','#e7a340'),blush=fabric('Slippers | tiny peach cheeks','#e8aca0'),pinkNose=fabric('Slippers | soft rose nose','#bd7f87');
 const eyes=new THREE.MeshPhysicalMaterial({color:'#241b16',roughness:.28,metalness:0,specularIntensity:.35}),thread=new THREE.MeshStandardMaterial({color:'#725347',roughness:1});
 const glint=new THREE.MeshBasicMaterial({color:'#fff9e8'}),sphere=new THREE.SphereGeometry(1,40,28);
 function add(parent,name,g,m){const o=new THREE.Mesh(g,m);o.name='Slippers | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function oval(parent,name,p,s,m){const o=add(parent,name,sphere,m);o.position.fromArray(p);o.scale.fromArray(s);return o;}
 function curve(parent,name,p,r,m,closed=false){return add(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p,closed,'centripetal'),Math.max(48,p.length*2),r,10,closed),m);}
 let seed=1086;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function headFuzz(parent,center,scale,color,count=14000){
  const g=new THREE.InstancedBufferGeometry(),p=[],uvs=[],normals=[],ix=[];
  for(let i=0;i<=4;i++){
   p.push(-1,i/4,0,1,i/4,0);uvs.push(0,i/4,1,i/4);normals.push(0,1,0,0,1,0);
   if(i<4){const k=i*2;ix.push(k,k+1,k+2,k+2,k+1,k+3);}
  }
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(ix);
  const roots=[],directions=[],tangents=[];
  for(let i=0;i<count;i++){
   const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y),n=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));
   const normal=new THREE.Vector3(n.x/scale[0],n.y/scale[1],n.z/scale[2]).normalize(),axis=new THREE.Vector3(Math.abs(normal.y)>.95?1:0,Math.abs(normal.y)>.95?0:1,0);
   const root=new THREE.Vector3(n.x*scale[0]+center[0],n.y*scale[1]+center[1],n.z*scale[2]+center[2]).addScaledVector(normal,-.001);
   const tangent=new THREE.Vector3().crossVectors(normal,axis).normalize();
   roots.push(...root.toArray(),.00065+rand()*.0003);directions.push(...normal.toArray(),.010+rand()*.006);tangents.push(...tangent.toArray(),rand()*Math.PI*2);
  }
  g.setAttribute('slipperRoot',new THREE.InstancedBufferAttribute(new Float32Array(roots),4));g.setAttribute('slipperNormal',new THREE.InstancedBufferAttribute(new Float32Array(directions),4));g.setAttribute('slipperTangent',new THREE.InstancedBufferAttribute(new Float32Array(tangents),4));g.instanceCount=count;
  const mat=new THREE.MeshPhysicalNodeMaterial({color,roughness:1,sheen:0,specularIntensity:0,side:THREE.DoubleSide});
  const a=attribute('slipperRoot','vec4'),n=attribute('slipperNormal','vec4'),v=attribute('slipperTangent','vec4'),t=positionGeometry.y;
  const bend=t.mul(t).mul(.38).add(t.mul(6).add(v.w).sin().mul(t).mul(.13));
  const centerNode=a.xyz.add(n.xyz.mul(n.w).mul(t)).add(v.xyz.mul(n.w).mul(bend));
  const localCamera=modelWorldMatrixInverse.mul(vec4(cameraPosition,1)).xyz;
  const cross=n.xyz.cross(localCamera.sub(centerNode)),side=cross.dot(cross).greaterThan(.000001).select(cross,v.xyz).normalize();
  mat.positionNode=centerNode.add(side.mul(a.w).mul(positionGeometry.x).mul(mix(1,.04,t)));
  mat.normalNode=transformNormalToView(n.xyz).normalize();
  mat.colorNode=materialColor.rgb.mul(mix(.86,1,uv().y.clamp(0,1)));
  mat.receivedShadowPositionNode=modelWorldMatrix.mul(vec4(a.xyz.add(n.xyz.mul(n.w).mul(.5)),1)).xyz;
  g.boundingBox=new THREE.Box3(new THREE.Vector3(...center).sub(new THREE.Vector3(...scale)).addScalar(-.025),new THREE.Vector3(...center).add(new THREE.Vector3(...scale)).addScalar(.025));g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
  const o=add(parent,'fine continuous plush nap',g,mat);o.castShadow=false;o.userData.fiberCount=count;
 }
 function shoe(pair,kind,x,z,angle){
  const bunny=kind==='Mifen',mat=bunny?mifen:jiji,inside=bunny?pinkInside:yellowInside;
  const g=new THREE.Group();g.name='Slippers | '+kind+' '+(x<0?'left':'right');g.position.set(x,0,z);g.rotation.y=angle;pair.add(g);
  oval(g,'rounded felt outsole',[0,.055,0],[.343,.055,.549],cream);
  oval(g,'soft lower slipper body',[0,.121,.01],[.332,.070,.530],mat);
  const ring=[],upper=[],upperUv=[],upperIx=[],segments=64,rings=12;
  // A single padded upper slopes from the foot opening to the sole. The rear
  // collar is part of the slipper, rather than a detached ring behind a head.
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
   const t=j/rings,a=i/segments*Math.PI*2;
   upper.push(THREE.MathUtils.lerp(.181,.330,t)*Math.sin(a),.265*(1-t)+.14*t+.075*Math.sin(Math.PI*t),.270*(1-t)+THREE.MathUtils.lerp(.170,.520,t)*Math.cos(a));upperUv.push(i/segments,t);
   if(j<rings&&i<segments){const k=j*(segments+1)+i;upperIx.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
  }
  const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(upper,3));shell.setAttribute('uv',new THREE.Float32BufferAttribute(upperUv,2));shell.setIndex(upperIx);shell.computeVertexNormals();add(g,'integrated cushioned shoe upper',shell,mat);
  for(let i=0;i<96;i++){const a=i/96*Math.PI*2;ring.push(new THREE.Vector3(.181*Math.sin(a),.265,.270+.170*Math.cos(a)));}
  curve(g,'soft bound foot opening',ring,.023,mat,true);
  const pos=[0,.150,.270],uv=[.5,.5],ix=[];
  for(let j=1;j<=rings;j++)for(let i=0;i<segments;i++){
   const t=j/rings,a=i/segments*Math.PI*2;pos.push(.181*t*Math.sin(a),.150+.115*t*t,.270+.170*t*Math.cos(a));uv.push(.5+.5*t*Math.sin(a),.5+.5*t*Math.cos(a));
  }
  for(let i=0;i<segments;i++)ix.push(0,1+i,1+(i+1)%segments);
  for(let j=1;j<rings;j++)for(let i=0;i<segments;i++){const a=1+(j-1)*segments+i,b=1+(j-1)*segments+(i+1)%segments,c=a+segments,d=b+segments;ix.push(a,c,b,b,c,d);}
  const liner=new THREE.BufferGeometry();liner.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));liner.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));liner.setIndex(ix);liner.computeVertexNormals();add(g,'recessed fabric foot pocket',liner,inside);
  const c=[0,bunny?.303:.309,-.200],s=bunny?[.325,.249,.310]:[.331,.259,.320];
  oval(g,'round stuffed '+kind+' head',c,s,mat);headFuzz(g,c,s,mat.color);
  const face=new THREE.Group();face.name='Slippers | soft toy face';face.position.set(0,c[1]+.070,c[2]-.254);face.rotation.x=.30;g.add(face);
  for(const side of [-1,1]){
   oval(face,'small glossy button eye',[side*.111,.031,-.044],[.033,.038,.020],eyes);
   oval(face,'eye catchlight',[side*.111-.009,.044,-.061],[.009,.010,.004],glint);
   oval(face,'subtle rosy cheek',[side*.173,-.030,.020],[.033,.014,.007],blush);
  }
  if(bunny){
   for(const side of [-1,1]){
    const ear=new THREE.Group();ear.position.set(side*.292,.314,-.158);ear.rotation.z=side*.23;ear.rotation.x=-.14;g.add(ear);
    oval(ear,'soft drooping bunny ear',[0,0,0],[.078,.197,.095],mat);headFuzz(ear,[0,0,0],[.078,.197,.095],mat.color,2200);
    oval(ear,'delicate inner bunny ear',[0,0,-.089],[.032,.124,.012],pinkInside);
   }
   oval(face,'tiny pink bunny nose',[0,-.025,-.055],[.027,.020,.015],pinkNose);
   curve(face,'little bunny mouth',[new THREE.Vector3(0,-.042,-.057),new THREE.Vector3(0,-.063,-.059),new THREE.Vector3(-.016,-.074,-.059)],.003,thread);
   curve(face,'bunny smile',[new THREE.Vector3(0,-.063,-.059),new THREE.Vector3(.016,-.074,-.059)],.003,thread);
  }else{
   oval(face,'round apricot bill',[0,-.035,-.056],[.071,.039,.036],beak);
   for(const side of [-1,1]){const wing=oval(g,'tiny tucked chick wing',[side*.306,.250,-.110],[.049,.083,.126],mat);wing.rotation.z=side*-.2;}
  }
  g.userData={character:kind,pairColor:bunny?'peach pink':'pale custard',heelOpening:true};
 }
 for(const spec of [{kind:'Jiji',p:[-3.72,-.036,.96],a:Math.PI/2-.10},{kind:'Mifen',p:[-3.70,-.036,2.64],a:Math.PI/2+.08}]){
  const pair=new THREE.Group();pair.name='Slippers | '+spec.kind+' pair';pair.position.fromArray(spec.p);pair.rotation.y=spec.a;group.add(pair);
  shoe(pair,spec.kind,-.405,-.012,-.025);shoe(pair,spec.kind,.405,.012,.025);
 }
 let meshCount=0;group.traverse(o=>{if(o.isMesh)meshCount++;});
 group.userData={revision:'slippers-2',pairCount:2,shoeCount:4,meshCount,placement:'floor left of bed',colors:{Jiji:'pale custard',Mifen:'peach pink'},design:'round plush toes, integrated padded uppers, recessed foot pockets',fiberCount:64800};
 return group;
}
