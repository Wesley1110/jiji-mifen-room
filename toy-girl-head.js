import * as THREE from 'three/webgpu';

// Sculpted, closed volumes: cheek colour is blended into the head surface,
// and the swept fringe has a rounded cross-section rather than a flat ribbon.
export function addGirlHead(girl,{skin,hair,eye,white,lip}){
 const head=new THREE.Group();head.name='Starter pack | sculpted girl head and flowing hair';girl.add(head);
 const mesh=(name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Starter pack | '+name;o.castShadow=true;o.receiveShadow=true;head.add(o);return o;};
 const oval=(name,p,s,m)=>{const o=mesh(name,new THREE.SphereGeometry(1,48,32),m);o.position.fromArray(p);o.scale.fromArray(s);return o;};
 function surface(name,positions,uvs,indices,m,ringSize){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  if(ringSize){const n=g.attributes.normal;for(let a=0;a<n.count;a+=ringSize){const b=a+ringSize-1,v=new THREE.Vector3().fromBufferAttribute(n,a).add(new THREE.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}}
  return mesh(name,g,m);
 }
 // Reference landmarks are measured in the supplied 1122 x 1402 image.
 // A 950 px/unit scale puts the eye line at y=650, chin at y=738 and
 // crown near y=480. Keep face and hair on this same coordinate system.
 const centerY=.177,rx=.106,ry=.112,rz=.088,centerZ=.100;
 const cheekWidth=y=>1+.070*Math.exp(-(((y+.30)/.38)**2));
 const lowerJaw=y=>y<0?-Math.pow(-y,.87):y;
 const faceZ=(x,y)=>{const yn=(y-centerY)/ry,q=yn<0?-Math.pow(-yn,1/.87):yn;return centerZ+rz*Math.sqrt(Math.max(.001,1-(x/(rx*cheekWidth(q)))**2-q*q));};
 const faceGeo=new THREE.SphereGeometry(1,96,64),p=faceGeo.attributes.position,colors=[],rosy=new THREE.Color('#e68f85'),base=skin.color.clone();
 for(let i=0;i<p.count;i++){
  const yn=p.getY(i),x=p.getX(i)*rx*cheekWidth(yn),y=centerY+lowerJaw(yn)*ry,z=centerZ+p.getZ(i)*rz;
  p.setXYZ(i,x,y,z);
  const tint=.72*Math.exp(-(((Math.abs(x)-.077)/.028)**2)-((y-.133)/.024)**2)*THREE.MathUtils.smoothstep(z,.080,.145);
  const c=base.clone().lerp(rosy,tint);colors.push(c.r,c.g,c.b);
 }
 faceGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));faceGeo.computeVertexNormals();
 const faceMat=skin.clone();faceMat.name='Toy | satin vinyl with softly blended rosy cheeks';faceMat.color.set('#ffffff');faceMat.vertexColors=true;
 mesh('soft round cheeks and gently tapered chin',faceGeo,faceMat);
 const earInner=skin.clone();earInner.name='Toy | warm inner ear';earInner.color.set('#e2a58e');
 for(const side of [-1,1]){
  oval('small partly tucked ear',[side*.111,.141,.092],[.018,.028,.019],skin);
  oval('soft inner ear fold',[side*.121,.142,.104],[.0065,.015,.004],earInner);
 }

 // A continuous loft joins the crown to the long, slightly flared back hair.
 const profile=[new THREE.Vector3(.004,.337,.012),new THREE.Vector3(.082,.305,.031),new THREE.Vector3(.133,.245,.040),new THREE.Vector3(.143,.170,.039),new THREE.Vector3(.153,.083,.039),new THREE.Vector3(.180,-.007,.034),new THREE.Vector3(.188,-.049,.032),new THREE.Vector3(.150,-.087,.026),new THREE.Vector3(.004,-.111,.003)];
 const contour=new THREE.CatmullRomCurve3(profile),hp=[],hu=[],hi=[],rows=88,around=96;
 for(let j=0;j<=rows;j++)for(let i=0;i<=around;i++){
  const t=j/rows,v=contour.getPoint(t),a=i/around*Math.PI*2,wave=1+.026*Math.cos(a*7+t*1.3)*Math.sin(t*Math.PI);
  hp.push(Math.cos(a)*v.x*wave,v.y,.043+Math.sin(a)*v.z*(1+.025*Math.cos(a*7+t)));
  hu.push(i/around,t);if(j<rows&&i<around){const k=j*(around+1)+i;hi.push(k,k+1,k+around+1,k+1,k+around+2,k+around+1);}
 }
 surface('continuous long hair with soft turned ends',hp,hu,hi,hair,around+1);

 // The crown follows the head and stops along a curved forehead / temple line.
 oval('closed scalp beneath swept hair',[0,.199,.058],[.142,.138,.072],hair);
 const cp=[],cu=[],ci=[],n=112,levels=56;
 for(let j=0;j<=levels;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,f=Math.sin(a),limit=f>=0?THREE.MathUtils.lerp(1.83,.86,f):THREE.MathUtils.lerp(1.83,2.34,-f),theta=j/levels*limit;
  cp.push(.143*Math.sin(theta)*Math.cos(a),.190+.147*Math.cos(theta),.071+(f>=0?.132:.057)*Math.sin(theta)*f);
  cu.push(i/n,j/levels);if(j<levels&&i<n){const k=j*(n+1)+i;ci.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
 }
 surface('rounded side-parted crown',cp,cu,ci,hair,n+1);

 function lock(name,points,widths,depths){
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),ps=[],uv=[],ix=[],rings=64,sides=32;
  const sample=(list,t)=>{const q=t*(list.length-1),i=Math.min(list.length-2,Math.floor(q));return THREE.MathUtils.lerp(list[i],list[i+1],THREE.MathUtils.smoothstep(q-i,0,1));};
  for(let j=0;j<=rings;j++){
   const t=j/rings,v=c.getPoint(t),d=c.getTangent(t),across=new THREE.Vector3(-d.y,d.x,0).normalize(),width=sample(widths,t),depth=sample(depths,t);
   for(let i=0;i<=sides;i++){
    const a=i/sides*Math.PI*2,fold=1+.016*Math.cos(a*5+t*2)*Math.sin(t*Math.PI),p=v.clone().addScaledVector(across,Math.cos(a)*width);p.z+=Math.sin(a)*depth*fold;
    ps.push(p.x,p.y,p.z);uv.push(i/sides,t);if(j<rings&&i<sides){const k=j*(sides+1)+i;ix.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
   }
  }
  return surface(name,ps,uv,ix,hair,sides+1);
 }
 // A smooth crown-conforming sweep keeps one flowing silhouette. Subdivision
 // adds interior vertices so the fringe curves in depth instead of triangulating
 // into large flat facets; its closed back and thin rounded edge supply thickness.
 function sweptFringe(name,shape){
  const base=new THREE.ShapeGeometry(shape,20),v=base.attributes.position,xy=Array.from({length:v.count},(_,i)=>[v.getX(i),v.getY(i)]);let faces=Array.from(base.index.array);
  for(let pass=0;pass<3;pass++){
   const cache=new Map(),out=[];
   const mid=(a,b)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(cache.has(key))return cache.get(key);const i=xy.length;xy.push([(xy[a][0]+xy[b][0])/2,(xy[a][1]+xy[b][1])/2]);cache.set(key,i);return i;};
   for(let k=0;k<faces.length;k+=3){const [a,b,c]=faces.slice(k,k+3),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);out.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}faces=out;
  }
  const outline=shape.getPoints(64),edgeDistance=(x,y)=>{
   let best=Infinity;for(let i=1;i<outline.length;i++){const a=outline[i-1],b=outline[i],dx=b.x-a.x,dy=b.y-a.y,t=THREE.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));}return best;
  };
  const crownZ=(x,y)=>.071+.132*Math.sqrt(Math.max(.012,1-(x/.146)**2-((y-.190)/.149)**2));
  const zAt=(x,y)=>{const edge=Math.min(crownZ(x,y)+.0018,faceZ(x,y)+.002);return edge+(crownZ(x,y)+.026-edge)*(1-Math.exp(-edgeDistance(x,y)/.013));};
  const backZ=(x,y)=>Math.min(crownZ(x,y)-.010,faceZ(x,y)-.012);
  const ps=[],uv=[],ix=[];for(const front of [true,false])for(const [x,y] of xy){ps.push(x,y,front?zAt(x,y):backZ(x,y));uv.push(x*3+.5,y*3);}
  const count=xy.length;for(let k=0;k<faces.length;k+=3){const [a,b,c]=faces.slice(k,k+3);ix.push(a,b,c,c+count,b+count,a+count);}
  for(let i=1;i<outline.length;i++){
   const a=outline[i-1],b=outline[i],k=ps.length/3;ps.push(a.x,a.y,zAt(a.x,a.y),b.x,b.y,zAt(b.x,b.y),a.x,a.y,backZ(a.x,a.y),b.x,b.y,backZ(b.x,b.y));uv.push(0,0,1,0,0,1,1,1);ix.push(k,k+2,k+1,k+1,k+2,k+3);
  }
  base.dispose();return surface(name,ps,uv,ix,hair);
 }
 const point=(x,y)=>[(x-425)/950,(800-y)/950];
 const traced=(start,curves)=>{const s=new THREE.Shape();s.moveTo(...point(...start));for(const c of curves)s.bezierCurveTo(...point(c[0],c[1]),...point(c[2],c[3]),...point(c[4],c[5]));s.closePath();return s;};
 const left=traced([468,501],[
  [438,467,354,473,320,517],[297,546,294,598,315,636],
  [318,649,322,660,326,669],[325,647,321,636,329,626],
  [351,620,377,609,400,589],[398,597,391,603,383,607],
  [424,606,451,581,464,550],[472,531,473,512,468,501]
 ]);
 sweptFringe('rounded continuous side swept fringe',left);
 const right=traced([468,501],[
  [505,497,544,534,552,584],[559,614,546,644,523,667],
  [527,643,522,625,512,610],[490,590,474,566,465,545],
  [475,526,474,511,468,501]
 ]);
 sweptFringe('soft right side part and temple',right);
 for(const side of [-1,1]){
  lock('outer flowing hair lock',[[side*.132,.204,.055],[side*.151,.080,.062],[side*.179,-.026,.059],[side*.151,-.086,.050]],[.014,.024,.023,.001],[.010,.019,.018,.001]);
  lock('inner softly turned hair lock',[[side*.127,.132,.075],[side*.140,.029,.083],[side*.154,-.043,.078],[side*.133,-.091,.063]],[.010,.019,.017,.001],[.008,.014,.013,.001]);
 }

 // Position every detail on the curved face, avoiding floating decals or a
 // planar smile slicing into the cheeks when viewed from the side.
 function line(name,points,r,m){const ps=points.map(([x,y])=>new THREE.Vector3(x,y,faceZ(x,y)+.0014));return mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),32,r,8,false),m);}
 for(const side of [-1,1]){
  const x=side*.0515,y=.158,z=faceZ(x,y)+.0018;
  const e=oval('warm brown oval eye',[x,y,z],[.0137,.0178,.0085],eye);e.rotation.y=side*.13;
  oval('single soft eye catchlight',[x-.0031,y+.0058,z+.0080],[.0020,.0027,.0008],white);
  line('fine gently arched eyebrow',[[side*.065,.204],[side*.049,.209],[side*.033,.206]],.00145,hair);
 }
 oval('soft tiny button nose',[0,.132,faceZ(0,.132)+.0032],[.0105,.0085,.0080],skin);
 line('gentle upturned smile',[[-.026,.105],[-.013,.0995],[0,.098],[.013,.0995],[.026,.105]],.00135,lip);
 head.userData={revision:'reference-girl-3',face:'reference eye line and chin, rounded lower cheeks and small tucked ears',hair:'reference-traced side fringe, rounded crown and shoulder-length turned locks',referenceLandmarks:{imageSize:[1122,1402],origin:[425,800],pixelsPerUnit:950,eyes:[[376,650],[474,650]],chin:[425,738],part:[468,501]}};
 return head;
}
