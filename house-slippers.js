import * as THREE from 'three/webgpu';

// Conventional closed-toe, open-heel house slippers. The vamp has an inner
// surface and a real opening above the padded footbed.
export function createBedsideSlippers(nap){
 const group=new THREE.Group();group.name='Bedside house slippers';
 const cloth=(name,color)=>new THREE.MeshPhysicalMaterial({name,color,roughness:.98,sheen:.18,sheenRoughness:1,specularIntensity:.08,normalMap:nap,normalScale:new THREE.Vector2(.45,.45)});
 const oat=cloth('Slippers | oatmeal fabric','#bda77f'),rose=cloth('Slippers | dusty rose fabric','#b98587');
 const oatLining=cloth('Slippers | oat padded lining','#ddcbaa'),roseLining=cloth('Slippers | rose padded lining','#d9b3ad');
 const soleMat=new THREE.MeshStandardMaterial({name:'Slippers | warm felt soles',color:'#c6b696',roughness:1});
 const piping=cloth('Slippers | ivory binding','#e2d3b8');
 const ribbon=cloth('Slippers | small rose pink ribbon','#ce819a');
 function mesh(parent,name,g,m){const o=new THREE.Mesh(g,m);o.name='Slippers | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function tube(parent,name,points,r,mat,closed=false){return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,closed,'centripetal'),96,r,8,closed),mat);}
 function surface(parent,name,positions,uvs,indices,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return mesh(parent,name,g,mat);}
 function perimeter(a,r=1){return new THREE.Vector3((.294-.027*Math.cos(a))*Math.sin(a)*r,0,.605*Math.cos(a)*r);}
 function shoe(pair,index,mat,lining){
  const g=new THREE.Group();g.name=`Slippers | ${pair.userData.color} ${index?'right':'left'}`;g.position.set(index?.365:-.365,0,index?.015:-.015);g.rotation.y=index?.025:-.025;g.userData={isSlipper:true,pairColor:pair.userData.color,style:'closed toe, open heel'};pair.add(g);
  const n=80,pos=[],uv=[],ix=[],profile=[[0,.91],[.012,.985],[.064,1],[.086,.96]];
  profile.forEach(([y,r],j)=>{for(let i=0;i<=n;i++){const p=perimeter(i/n*Math.PI*2,r);pos.push(p.x,y,p.z);uv.push(i/n,j/3);if(j<3&&i<n){const k=j*(n+1)+i;ix.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}}});
  surface(g,'rounded low felt sole',pos,uv,ix,soleMat);
  const bedP=[0,.137,0],bedUv=[.5,.5],bedIx=[],rings=16;
  for(let j=1;j<=rings;j++)for(let i=0;i<n;i++){const r=j/rings,a=i/n*Math.PI*2,p=perimeter(a,r*.95);bedP.push(p.x,.137-.050*r*r,p.z);bedUv.push(.5+.5*r*Math.sin(a),.5+.5*r*Math.cos(a));}
  for(let i=0;i<n;i++)bedIx.push(0,1+i,1+(i+1)%n);
  for(let j=1;j<rings;j++)for(let i=0;i<n;i++){const a=1+(j-1)*n+i,b=1+(j-1)*n+(i+1)%n;bedIx.push(a,a+n,b,b,a+n,b+n);}
  surface(g,'exposed cushioned heel footbed',bedP,bedUv,bedIx,lining);
  const vp=[],vu=[],vi=[],rows=32,cols=48;
  function vamp(u,a,inner=false){
   const breadth=.307*(u<.5?Math.sqrt(Math.max(0,1-(1-u*2)**2)):1-.08*(u-.5)*2);
   const height=.205*Math.sin(Math.PI/2*Math.min(u/.42,1));
   return new THREE.Vector3(Math.max(0,breadth-(inner?.020:0))*Math.cos(a),.103+Math.max(0,height-(inner?.023:0))*Math.sin(a),-.560+.725*u);
  }
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const p=vamp(j/rows,i/cols*Math.PI,side===1);vp.push(...p.toArray());vu.push(i/cols,j/rows);
   if(j<rows&&i<cols){const k=side*(rows+1)*(cols+1)+j*(cols+1)+i,c=k+cols+1;side?vi.push(k,c,k+1,k+1,c,c+1):vi.push(k,k+1,c,k+1,c+1,c);}
  }
  const offset=(rows+1)*(cols+1);
  for(let i=0;i<cols;i++){const a=rows*(cols+1)+i,b=a+offset;vi.push(a,a+1,b,a+1,b+1,b);}
  const upper=surface(g,'soft closed toe vamp with inner lining',vp,vu,vi,mat);upper.material.side=THREE.DoubleSide;
  const opening=[];for(let i=0;i<=64;i++)opening.push(vamp(1,i/64*Math.PI).add(new THREE.Vector3(0,.003,.002)));
  tube(g,'thin soft opening binding',opening,.013,piping);
  const seam=[];for(let i=0;i<96;i++){const p=perimeter(i/96*Math.PI*2,.970);p.y=.080;seam.push(p);}
  tube(g,'subtle sole seam',seam,.0045,piping,true);
  if(pair.userData.color==='dusty rose'){
   const bow=new THREE.Group();bow.name='Slippers | small pink bow';bow.position.set(0,.314,.035);bow.scale.setScalar(.8);bow.userData.isBow=true;g.add(bow);
   // Shallow, pinched ribbon lobes keep the decoration small and fabric-like.
   for(const side of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(side*.009,0);
    shape.bezierCurveTo(side*.045,.025,side*.111,.064,side*.119,.031);
    shape.bezierCurveTo(side*.133,-.010,side*.102,-.052,side*.073,-.036);
    shape.bezierCurveTo(side*.036,-.018,side*.020,-.005,side*.009,0);
    const loop=mesh(bow,'bow ribbon loop',new THREE.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:16}),ribbon);loop.rotation.x=-Math.PI/2;loop.rotation.z=side*-.10;
    const tail=new THREE.Shape();tail.moveTo(side*.008,-.006);tail.lineTo(side*.062,-.087);tail.lineTo(side*.034,-.078);tail.lineTo(side*.023,-.103);tail.lineTo(0,-.016);tail.closePath();
    const end=mesh(bow,'short ribbon tail',new THREE.ExtrudeGeometry(tail,{depth:.004,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2}),ribbon);end.rotation.x=Math.PI/2;end.position.y=-.001;
   }
   const knot=mesh(bow,'tiny ribbon knot',new THREE.SphereGeometry(1,24,16),ribbon);knot.scale.set(.026,.022,.030);knot.position.y=.010;
  }
 }
 for(const spec of [{color:'oatmeal',p:[-3.47,-.036,.96],a:Math.PI/2-.10,mat:oat,lining:oatLining},{color:'dusty rose',p:[-3.45,-.036,2.64],a:Math.PI/2+.08,mat:rose,lining:roseLining}]){
  const pair=new THREE.Group();pair.name=`Slippers | ${spec.color} pair`;pair.userData={color:spec.color};pair.position.fromArray(spec.p);pair.rotation.y=spec.a;group.add(pair);shoe(pair,0,spec.mat,spec.lining);shoe(pair,1,spec.mat,spec.lining);
 }
 let meshCount=0;group.traverse(o=>{if(o.isMesh)meshCount++;});
 group.userData={revision:'slippers-4',pairCount:2,shoeCount:4,meshCount,colors:['oatmeal','dusty rose'],style:'plain padded house slippers',characterFeatures:false,bowCount:2,bowColor:'rose pink',placement:'floor left of bed',fiberCount:0};
 return group;
}
