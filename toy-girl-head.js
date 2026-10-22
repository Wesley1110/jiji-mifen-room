import * as THREE from 'three/webgpu';

// Sculpted, closed volumes: cheek colour is blended into the head surface,
// and the swept fringe has a rounded cross-section rather than a flat ribbon.
export function addGirlHead(girl,{skin,hair,eye,white,lip}){
 const head=new THREE.Group();head.name='Starter pack | sculpted girl head and flowing hair';head.position.y=.020;girl.add(head);
 const mesh=(name,g,m)=>{const o=new THREE.Mesh(g,m);o.name='Starter pack | '+name;o.castShadow=true;o.receiveShadow=true;head.add(o);return o;};
 const oval=(name,p,s,m)=>{const o=mesh(name,new THREE.SphereGeometry(1,48,32),m);o.position.fromArray(p);o.scale.fromArray(s);return o;};
 function surface(name,positions,uvs,indices,m,ringSize){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  if(ringSize){const n=g.attributes.normal;for(let a=0;a<n.count;a+=ringSize){const b=a+ringSize-1,v=new THREE.Vector3().fromBufferAttribute(n,a).add(new THREE.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}}
  return mesh(name,g,m);
 }
 const centerY=.181,rx=.120,ry=.119,rz=.088,centerZ=.100;
 const cheekWidth=y=>1+.045*Math.exp(-(((y+.23)/.38)**2))-.065*THREE.MathUtils.smoothstep(-y,.48,.98);
 const faceZ=(x,y)=>{const yn=(y-centerY)/ry;return centerZ+rz*Math.sqrt(Math.max(.001,1-(x/(rx*cheekWidth(yn)))**2-yn*yn));};
 const faceGeo=new THREE.SphereGeometry(1,96,64),p=faceGeo.attributes.position,colors=[],rosy=new THREE.Color('#e68f85'),base=skin.color.clone();
 for(let i=0;i<p.count;i++){
  const yn=p.getY(i),x=p.getX(i)*rx*cheekWidth(yn),y=centerY+yn*ry,z=centerZ+p.getZ(i)*rz;
  p.setXYZ(i,x,y,z);
  const tint=.72*Math.exp(-(((Math.abs(x)-.077)/.028)**2)-((y-.133)/.024)**2)*THREE.MathUtils.smoothstep(z,.080,.145);
  const c=base.clone().lerp(rosy,tint);colors.push(c.r,c.g,c.b);
 }
 faceGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));faceGeo.computeVertexNormals();
 const faceMat=skin.clone();faceMat.name='Toy | satin vinyl with softly blended rosy cheeks';faceMat.color.set('#ffffff');faceMat.vertexColors=true;
 mesh('soft round cheeks and gently tapered chin',faceGeo,faceMat);
 const earInner=skin.clone();earInner.name='Toy | warm inner ear';earInner.color.set('#e2a58e');
 for(const side of [-1,1]){
  oval('small partly tucked ear',[side*.118,.145,.092],[.017,.027,.019],skin);
  oval('soft inner ear fold',[side*.125,.145,.104],[.0065,.014,.004],earInner);
 }

 // A continuous loft joins the crown to the long, slightly flared back hair.
 const profile=[new THREE.Vector3(.004,.310,.012),new THREE.Vector3(.077,.282,.029),new THREE.Vector3(.116,.234,.037),new THREE.Vector3(.133,.164,.036),new THREE.Vector3(.145,.071,.034),new THREE.Vector3(.163,-.023,.032),new THREE.Vector3(.158,-.094,.030),new THREE.Vector3(.119,-.137,.022),new THREE.Vector3(.004,-.153,.003)];
 const contour=new THREE.CatmullRomCurve3(profile),hp=[],hu=[],hi=[],rows=88,around=96;
 for(let j=0;j<=rows;j++)for(let i=0;i<=around;i++){
  const t=j/rows,v=contour.getPoint(t),a=i/around*Math.PI*2,wave=1+.026*Math.cos(a*7+t*1.3)*Math.sin(t*Math.PI);
  hp.push(Math.cos(a)*v.x*wave,v.y,.043+Math.sin(a)*v.z*(1+.025*Math.cos(a*7+t)));
  hu.push(i/around,t);if(j<rows&&i<around){const k=j*(around+1)+i;hi.push(k,k+1,k+around+1,k+1,k+around+2,k+around+1);}
 }
 surface('continuous long hair with soft turned ends',hp,hu,hi,hair,around+1);

 // The crown follows the head and stops along a curved forehead / temple line.
 const cp=[],cu=[],ci=[],n=112,levels=56;
 for(let j=0;j<=levels;j++)for(let i=0;i<=n;i++){
  const a=i/n*Math.PI*2,f=Math.sin(a),limit=f>=0?THREE.MathUtils.lerp(1.83,.94,f):THREE.MathUtils.lerp(1.83,2.34,-f),theta=j/levels*limit;
  cp.push(.130*Math.sin(theta)*Math.cos(a),.184+.132*Math.cos(theta),.074+(f>=0?.119:.052)*Math.sin(theta)*f);
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
  const base=new THREE.ShapeGeometry(shape,48),v=base.attributes.position,xy=Array.from({length:v.count},(_,i)=>[v.getX(i),v.getY(i)]);let faces=Array.from(base.index.array);
  for(let pass=0;pass<3;pass++){
   const cache=new Map(),out=[];
   const mid=(a,b)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(cache.has(key))return cache.get(key);const i=xy.length;xy.push([(xy[a][0]+xy[b][0])/2,(xy[a][1]+xy[b][1])/2]);cache.set(key,i);return i;};
   for(let k=0;k<faces.length;k+=3){const [a,b,c]=faces.slice(k,k+3),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);out.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}faces=out;
  }
  const outline=shape.getPoints(64),edgeDistance=(x,y)=>{
   let best=Infinity;for(let i=1;i<outline.length;i++){const a=outline[i-1],b=outline[i],dx=b.x-a.x,dy=b.y-a.y,t=THREE.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));}return best;
  };
  const crownZ=(x,y)=>.074+.119*Math.sqrt(Math.max(.018,1-(x/.133)**2-((y-.184)/.136)**2));
  const zAt=(x,y)=>crownZ(x,y)+.004+.018*(1-Math.exp(-edgeDistance(x,y)/.015));
  const ps=[],uv=[],ix=[];for(const front of [true,false])for(const [x,y] of xy){ps.push(x,y,front?zAt(x,y):crownZ(x,y)-.003);uv.push(x*3+.5,y*3);}
  const count=xy.length;for(let k=0;k<faces.length;k+=3){const [a,b,c]=faces.slice(k,k+3);ix.push(a,b,c,c+count,b+count,a+count);}
  for(let i=1;i<outline.length;i++){
   const a=outline[i-1],b=outline[i],k=ps.length/3;ps.push(a.x,a.y,zAt(a.x,a.y),b.x,b.y,zAt(b.x,b.y),a.x,a.y,crownZ(a.x,a.y)-.003,b.x,b.y,crownZ(b.x,b.y)-.003);uv.push(0,0,1,0,0,1,1,1);ix.push(k,k+2,k+1,k+1,k+2,k+3);
  }
  base.dispose();return surface(name,ps,uv,ix,hair);
 }
 const left=new THREE.Shape();left.moveTo(.036,.300);
 left.bezierCurveTo(-.007,.329,-.073,.322,-.104,.278);
 left.bezierCurveTo(-.124,.248,-.130,.205,-.115,.154);
 left.bezierCurveTo(-.117,.183,-.114,.202,-.105,.213);
 left.bezierCurveTo(-.083,.214,-.061,.221,-.043,.240);
 left.bezierCurveTo(-.046,.224,-.058,.214,-.068,.206);
 left.bezierCurveTo(-.029,.200,.012,.243,.027,.282);
 left.bezierCurveTo(.034,.294,.036,.299,.036,.300);left.closePath();
 sweptFringe('rounded continuous side swept fringe',left);
 const right=new THREE.Shape();right.moveTo(.036,.300);
 right.bezierCurveTo(.083,.304,.119,.268,.128,.220);
 right.bezierCurveTo(.134,.193,.129,.164,.118,.143);
 right.bezierCurveTo(.119,.181,.104,.197,.091,.212);
 right.bezierCurveTo(.068,.238,.050,.267,.036,.300);right.closePath();
 sweptFringe('soft right side part and temple',right);
 for(const side of [-1,1])lock('rounded flowing side lock',[[side*.119,.197,.060],[side*.133,.093,.064],[side*.148,-.032,.062],[side*.108,-.129,.050]],[.012,.027,.025,.001],[.009,.020,.019,.001]);

 // Position every detail on the curved face, avoiding floating decals or a
 // planar smile slicing into the cheeks when viewed from the side.
 function line(name,points,r,m){const ps=points.map(([x,y])=>new THREE.Vector3(x,y,faceZ(x,y)+.0014));return mesh(name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),32,r,8,false),m);}
 for(const side of [-1,1]){
  const x=side*.049,y=.160,z=faceZ(x,y)+.0018;
  const e=oval('warm brown oval eye',[x,y,z],[.0132,.0178,.0085],eye);e.rotation.y=side*.13;
  oval('single soft eye catchlight',[x-.0031,y+.0058,z+.0080],[.0020,.0027,.0008],white);
  line('fine gently arched eyebrow',[[side*.065,.204],[side*.049,.209],[side*.033,.206]],.00145,hair);
 }
 oval('soft tiny button nose',[0,.132,faceZ(0,.132)+.0032],[.0093,.0085,.0080],skin);
 line('gentle upturned smile',[[-.026,.105],[-.013,.0995],[0,.098],[.013,.0995],[.026,.105]],.00135,lip);
 head.userData={revision:'rounded-girl-2',face:'round cheeks, small tucked ears, blended blush, lower oval eyes and a curved smile',hair:'continuous long volume, rounded crown and two curved solid side-parted sweeps'};
 return head;
}
