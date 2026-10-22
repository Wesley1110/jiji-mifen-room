import * as THREE from 'three/webgpu';

const smooth=THREE.MathUtils.smoothstep;

export function addGirlLimbs(girl,{skin,cream}){
 const mesh=(name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Starter pack | '+name;o.castShadow=true;o.receiveShadow=true;girl.add(o);return o;};
 const oval=(parent,name,p,s,m)=>{const o=mesh(name,new THREE.SphereGeometry(1,48,32),m);parent.add(o);o.position.fromArray(p);o.scale.fromArray(s);return o;};
 const surface=(name,ps,uv,ix,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return mesh(name,g,m);};
 const footPrototype=joinedFootGeometry();
 for(const side of [-1,1]){
  // One closed shoulder-to-fingertip surface: no cut tube joined to a ball.
  // Upper arm, elbow and wrist widths follow the reference's soft taper.
  const points=[[side*.045,.018,.080],[side*.073,.012,.081],[side*.092,-.015,.086],[side*.112,-.061,.095],[side*.144,-.137,.114],[side*.173,-.199,.135],[side*.187,-.226,.145],[side*.194,-.248,.145],[side*.194,-.258,.145]],
   widths=[.018,.030,.029,.026,.0215,.0175,.0195,.011,.0001],depths=[.028,.031,.027,.024,.020,.015,.0135,.009,.0001],
   curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),ps=[],uv=[],ix=[],rows=112,n=40;
  const sample=(values,t)=>{const q=t*(values.length-1),i=Math.min(values.length-2,Math.floor(q)),u=q-i;return i===values.length-2?Math.max(.0001,values[i]*Math.sqrt(Math.max(0,1-u*u))):THREE.MathUtils.lerp(values[i],values[i+1],smooth(u,0,1));};
  for(let j=0;j<=rows;j++){
   const t=j/rows,p=curve.getPoint(t),d=curve.getTangent(t),across=new THREE.Vector3(-d.y,d.x,0).normalize();
   for(let i=0;i<=n;i++){
    const a=i/n*Math.PI*2,v=p.clone().addScaledVector(across,Math.cos(a)*sample(widths,t));v.z+=Math.sin(a)*sample(depths,t);
    ps.push(v.x,v.y,v.z);uv.push(i/n,t);if(i<n&&j<rows){const k=j*(n+1)+i;ix.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
   }
  }
  for(const [row,point] of [[0,points[0]],[rows,points.at(-1)]]){const cap=ps.length/3;ps.push(...point);uv.push(.5,row/rows);for(let i=0;i<n;i++){const k=row*(n+1)+i;row===0?ix.push(cap,k,k+1):ix.push(cap,k+1,k);}}
  const arm=surface('continuous rounded shoulder arm and hand',ps,uv,ix,skin);
  // Smooth the duplicated UV seam to avoid a line along the arm.
  const normals=arm.geometry.attributes.normal;
  for(let j=0;j<=rows;j++){const a=j*(n+1),b=a+n,v=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,v.x,v.y,v.z);normals.setXYZ(b,v.x,v.y,v.z);}
  oval(girl,'short soft thumb',[side*.170,-.231,.151],[.010,.021,.010],skin).rotation.z=-side*.36;

  const shoe=new THREE.Group();shoe.name='Starter pack | reference ivory sandal';shoe.position.set(side*.050,-.5335,.093);shoe.rotation.y=side*.075;girl.add(shoe);
  // The sole is low and rounded. The whole foot is tucked between flat fabric
  // bands, with five short overlapping toes rather than four upright beads.
  const soleProfile=[[0,-.0065],[.84,-.0065],[.96,-.005],[1,-.002],[1,.002],[.96,.005],[.84,.0065],[0,.0065]].map(p=>new THREE.Vector2(...p));
  const sole=mesh('flat rounded sandal sole',new THREE.LatheGeometry(soleProfile,64),cream);shoe.add(sole);sole.scale.set(.039,1,.057);sole.position.set(0,-.008,.002);
  const foot=mesh('sculpted foot with five shallow joined toes',footPrototype.clone(),skin);shoe.add(foot);foot.scale.x=-side;
  const leg=mesh('continuous calf into sandal',new THREE.CylinderGeometry(.0265,.0245,.105,48,6),skin);shoe.add(leg);leg.position.set(0,.048,-.021);
  function band(name,z,width){
   const ps=[],uv=[],ix=[],segments=48;
   for(const bottom of [false,true])for(let j=0;j<=segments;j++){
    const angle=THREE.MathUtils.lerp(-Math.PI/2,Math.PI/2,j/segments),x=Math.sin(angle)*.0325,y=.007+Math.cos(angle)*.021-(bottom?.0035:0);
    for(const front of [-1,1]){ps.push(x,y-front*.006,z+front*width/2);uv.push(j/segments,front<0?0:1);}
   }
   const stride=(segments+1)*2;
   for(let j=0;j<segments;j++){
    const k=j*2;ix.push(k,k+1,k+2,k+1,k+3,k+2,k+stride,k+2+stride,k+1+stride,k+1+stride,k+2+stride,k+3+stride);
    for(const edge of [0,1]){const a=k+edge,b=a+2;ix.push(a,b,a+stride,b,b+stride,a+stride);}
   }
   const b=surface(name,ps,uv,ix,cream);shoe.add(b);b.material=cream.clone();b.material.side=THREE.DoubleSide;
  }
  band('broad flat forefoot sandal band',.021,.013);
  band('broad flat instep sandal band',-.013,.014);
 }
 footPrototype.dispose();
 return {arm:'continuous shoulder-to-hand surface with rounded upper arms and a gradual wrist taper',toes:5,sandals:'closer-spaced feet, broad flat ivory bands and short connected toes'};
}

// Smooth-union sculpt: the toe pads, forefoot and instep are a single watertight
// surface. Marching tetrahedra share their edge vertices for smooth normals.
function joinedFootGeometry(){
 const forms=[
  [0,.012,-.005,.031,.018,.037],[0,.009,.022,.031,.012,.018],
  [0,.032,-.021,.0245,.025,.024],
  [.022,.0075,.037,.0092,.0088,.0144],[.0065,.0075,.039,.0077,.00835,.01335],
  [-.0072,.0075,.036,.007,.0079,.0123],[-.0192,.0075,.031,.0062,.00745,.01125],
  [-.029,.0075,.024,.0056,.007,.0102]
 ];
 const field=(x,y,z)=>{let result=1;for(const [cx,cy,cz,rx,ry,rz] of forms){const dx=x-cx,dy=y-cy,dz=z-cz,k0=Math.hypot(dx/rx,dy/ry,dz/rz),k1=Math.hypot(dx/(rx*rx),dy/(ry*ry),dz/(rz*rz)),d=k1<1e-9?-Math.min(rx,ry,rz):k0*(k0-1)/k1,h=Math.max(.0045-Math.abs(result-d),0)/.0045;result=Math.min(result,d)-h*h*.0045*.25;}return result;};
 const nx=48,ny=40,nz=64,min=[-.043,-.013,-.052],max=[.043,.061,.059],grid=[],values=new Float32Array((nx+1)*(ny+1)*(nz+1)),id=(x,y,z)=>(z*(ny+1)+y)*(nx+1)+x;
 for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const p=[min[0]+(max[0]-min[0])*x/nx,min[1]+(max[1]-min[1])*y/ny,min[2]+(max[2]-min[2])*z/nz],i=id(x,y,z);grid[i]=p;values[i]=field(...p);}
 const positions=[],uv=[],indices=[],cache=new Map(),tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const edge=(a,b)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(cache.has(key))return cache.get(key);const t=values[a]/(values[a]-values[b]),v=grid[a].map((n,i)=>THREE.MathUtils.lerp(n,grid[b][i],t)),index=positions.length/3;positions.push(...v);uv.push((v[0]+.043)/.086,(v[2]+.052)/.111);cache.set(key,index);return index;};
 const tri=(a,b,c)=>{
  const p=new THREE.Vector3().fromArray(positions,a*3),q=new THREE.Vector3().fromArray(positions,b*3),r=new THREE.Vector3().fromArray(positions,c*3),center=p.clone().add(q).add(r).multiplyScalar(1/3),normal=q.sub(p).cross(r.sub(p)).normalize(),eps=.0001;
  const outward=field(center.x+normal.x*eps,center.y+normal.y*eps,center.z+normal.z*eps)>field(center.x-normal.x*eps,center.y-normal.y*eps,center.z-normal.z*eps);indices.push(a,outward?b:c,outward?c:b);
 };
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const cube=[id(x,y,z),id(x+1,y,z),id(x+1,y+1,z),id(x,y+1,z),id(x,y,z+1),id(x+1,y,z+1),id(x+1,y+1,z+1),id(x,y+1,z+1)];
  if(cube.every(i=>values[i]>=0)||cube.every(i=>values[i]<0))continue;
  for(const tet of tetrahedra){const inside=[],outside=[];for(const corner of tet){const i=cube[corner];(values[i]<0?inside:outside).push(i);}if(!inside.length||!outside.length)continue;
   if(inside.length===1||outside.length===1){const single=inside.length===1?inside[0]:outside[0],others=inside.length===1?outside:inside;tri(...others.map(i=>edge(single,i)));}
   else {const [a,b]=inside,[c,d]=outside,ac=edge(a,c),ad=edge(a,d),bc=edge(b,c),bd=edge(b,d);tri(ac,ad,bc);tri(ad,bd,bc);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

// Stuffed three-toed webbed feet, shaped in the frontal XY plane. The surface
// closes through a rounded front and back, so it stays plush from side views.
export function makeChickFootGeometry(){
 const outline=new THREE.CatmullRomCurve3([
  [.025,-.003,0],[.028,.011,0],[.023,.023,0],[.015,.025,0],
  [.009,.022,0],[.003,.027,0],[-.006,.026,0],[-.012,.022,0],
  [-.020,.021,0],[-.028,.014,0],[-.028,.003,0],[-.024,-.012,0],
  [-.012,-.023,0],[.004,-.026,0],[.019,-.017,0]
 ].map(p=>new THREE.Vector3(...p)),true,'catmullrom',.35);
 const g=new THREE.SphereGeometry(1,64,40),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.sqrt(Math.max(0,1-z*z)),a=(Math.atan2(y,x)/(Math.PI*2)+1)%1,q=outline.getPointAt(a);
  p.setXYZ(i,q.x*r,q.y*r,z*.017);
 }
 g.computeVertexNormals();return g;
}
