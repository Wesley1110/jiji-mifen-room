import * as THREE from 'three/webgpu';

// Four actual slippers: each has a padded sole, exposed heel bed, a hollow toe
// hood with a lined opening, small embroidered features and a fine fabric nap.
export function createBedsideSlippers(nap){
 const group=new THREE.Group();group.name='Bedside character slippers';
 const cloth=(name,color)=>new THREE.MeshPhysicalMaterial({name,color,roughness:.98,metalness:0,sheen:0,specularIntensity:.1,normalMap:nap,normalScale:new THREE.Vector2(.48,.48)});
 const cream=cloth('Slippers | warm cream sole','#d1b795'),yellow=cloth('Slippers | Jiji butter yellow','#e1b957'),pink=cloth('Slippers | Mifen dusty pink','#c78791');
 const yellowLining=cloth('Slippers | honey lining','#b78a47'),pinkLining=cloth('Slippers | rose lining','#a56b77');
 const trim=cloth('Slippers | cream binding','#e1cba6'),orange=cloth('Slippers | golden beak','#d78b28'),innerEar=cloth('Slippers | blush ear inset','#e1a9ac');
 const eye=new THREE.MeshStandardMaterial({color:'#49382e',roughness:.58}),glint=new THREE.MeshBasicMaterial({color:'#fff5df'}),nose=cloth('Slippers | rose nose','#a86670');
 const sphere=new THREE.SphereGeometry(1,32,20);
 function mesh(parent,name,g,m){const o=new THREE.Mesh(g,m);o.name='Slippers | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function oval(parent,name,pos,scale,mat){const o=mesh(parent,name,sphere,mat);o.position.fromArray(pos);o.scale.fromArray(scale);return o;}
 function tube(parent,name,points,r,mat,closed=false){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,closed,'centripetal'),Math.max(32,points.length*2),r,8,closed),mat);}
 let seed=49031;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const hoodPoint=(theta,phi,inner=false)=>new THREE.Vector3((inner?.239:.277)*Math.cos(phi)*Math.sin(theta),.165+(inner?.223:.258)*Math.cos(phi)*Math.cos(theta),-.10+(inner?.400:.435)*Math.sin(phi));
 function makeHood(parent,mat,lining){
  const nx=40,ny=36;
  for(const inner of [false,true]){
   const p=[],uv=[],ix=[];
   for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const theta=-Math.PI/2+i/nx*Math.PI,phi=-Math.PI/2+.015+j/ny*(Math.PI/2+.505);
    p.push(...hoodPoint(theta,phi,inner).toArray());uv.push(i/nx,j/ny);
   }
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;inner?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
   mesh(parent,inner?'soft inner toe lining':'rounded plush toe hood',g,inner?lining:mat);
  }
  const rim=[];for(let i=0;i<=56;i++)rim.push(hoodPoint(-Math.PI/2+i/56*Math.PI,.52).add(new THREE.Vector3(0,0,.003)));
  tube(parent,'soft opening cuff',rim,.025,trim);
  // Fine tapered strands, not raised dots. Root positions follow the hood.
  const positions=[];
  for(let i=0;i<1500;i++){
   const theta=(random()-.5)*Math.PI,phi=-1.30+random()*1.79,p=hoodPoint(theta,phi),n=new THREE.Vector3(p.x/.277**2,(p.y-.165)/.258**2,(p.z+.10)/.435**2).normalize();
   const tangent=new THREE.Vector3().crossVectors(n,new THREE.Vector3(0,0,1)).normalize(),bitangent=new THREE.Vector3().crossVectors(n,tangent);
   const length=p.z<-.13&&Math.abs(p.x)<.19?.006:.011+random()*.008;
   const tip=p.clone().addScaledVector(n,length).addScaledVector(tangent,length*.18);
   for(const direction of [tangent,bitangent])positions.push(...p.clone().addScaledVector(direction,-.00065).toArray(),...p.clone().addScaledVector(direction,.00065).toArray(),...tip.toArray());
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();
  const fiber=new THREE.MeshStandardMaterial({color:mat.color.clone().multiplyScalar(1.04),roughness:1,side:THREE.DoubleSide});
  const fuzz=mesh(parent,'fine short fabric nap',g,fiber);fuzz.castShadow=false;fuzz.receiveShadow=false;
 }
 function shoe(parent,kind,x,z,angle){
  const g=new THREE.Group();g.name='Slippers | '+kind+' '+(x<0?'left':'right');g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);
  const bunny=kind==='Mifen',mat=bunny?pink:yellow,lining=bunny?pinkLining:yellowLining;
  oval(g,'padded outsole',[0,.065,0],[.304,.065,.606],cream);
  oval(g,'fabric footbed',[0,.139,.015],[.277,.040,.568],mat);
  oval(g,'recessed heel lining',[0,.175,.315],[.229,.018,.223],lining);
  const edge=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;edge.push(new THREE.Vector3(Math.sin(a)*.291,.095,Math.cos(a)*.581));}
  tube(g,'sole stitched binding',edge,.012,trim,true);
  makeHood(g,mat,lining);
  for(const x of [-.105,.105]){
   oval(g,'embroidered eye',[x,.412,-.23],[.024,.013,.027],eye);
   oval(g,'tiny eye glint',[x-.005,.423,-.237],[.006,.004,.006],glint);
  }
  if(bunny){
   for(const side of [-1,1]){
    const ear=oval(g,'floppy bunny ear',[side*.238,.326,-.11],[.068,.058,.231],mat);ear.rotation.y=side*-.18;
    const inset=oval(g,'pink ear centre',[side*.238,.379,-.11],[.034,.012,.157],innerEar);inset.rotation.y=side*-.18;
   }
   oval(g,'tiny bunny nose',[0,.401,-.338],[.032,.018,.026],nose);
   tube(g,'embroidered bunny mouth',[new THREE.Vector3(0,.393,-.36),new THREE.Vector3(0,.374,-.391),new THREE.Vector3(-.022,.369,-.399)],.0045,eye);
   tube(g,'embroidered bunny smile',[new THREE.Vector3(0,.374,-.391),new THREE.Vector3(.022,.369,-.399)],.0045,eye);
  }else{
   oval(g,'little chick beak',[0,.399,-.345],[.078,.037,.054],orange);
   for(const side of [-1,1]){const wing=oval(g,'tiny chick wing',[side*.256,.252,-.15],[.044,.066,.14],mat);wing.rotation.y=side*.22;}
  }
  g.userData={character:kind,pairColor:bunny?'dusty pink':'butter yellow',heelOpening:true};
 }
 const specs=[{kind:'Jiji',position:[-3.67,-.036,1.02],angle:Math.PI/2-.10},{kind:'Mifen',position:[-3.64,-.036,2.67],angle:Math.PI/2+.08}];
 for(const spec of specs){
  const pair=new THREE.Group();pair.name='Slippers | '+spec.kind+' pair';pair.position.fromArray(spec.position);pair.rotation.y=spec.angle;group.add(pair);
  shoe(pair,spec.kind,-.365,-.035,-.035);shoe(pair,spec.kind,.365,.035,.045);
 }
 let meshCount=0;group.traverse(o=>{if(o.isMesh)meshCount++;});
 group.userData={revision:'slippers-1',pairCount:2,shoeCount:4,meshCount,placement:'floor left of bed',colors:{Jiji:'butter yellow',Mifen:'dusty pink'}};
 return group;
}
