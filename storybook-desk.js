import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Furniture is an independent, movable asset. All cutouts and upholstery have
// actual depth; the reference illustration is not used as a billboard.
export const DESK_PLACEMENT = {position: [-9.20, 0, 5.6], rotation: Math.PI / 2};
export const FURNITURE_PLAN = {
  desk: {center: [-9.20, 5.6], facing: '+X', built: true},
  dresser: {bounds: [-9.8, -6.3, 8.50, 9.75], built: false},
  nightstand: {bounds: [-4.75, -3.10, -2.50, -1.10], side: 'left', built: false},
  existingNightstand: {bounds: [2.91, 4.13, -1.64, -.66], side: 'right', preserve: true, built: true}
};

function texture(draw, size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function heartPath(cx, cy, size, Path = THREE.Shape) {
  const s = new Path(), w = size, h = size * 1.05;
  s.moveTo(cx, cy - h * .48);
  s.bezierCurveTo(cx - w * .12, cy - h * .30, cx - w * .55, cy + h * .01, cx - w * .48, cy + h * .27);
  s.bezierCurveTo(cx - w * .41, cy + h * .55, cx - w * .12, cy + h * .57, cx, cy + h * .32);
  s.bezierCurveTo(cx + w * .12, cy + h * .57, cx + w * .41, cy + h * .55, cx + w * .48, cy + h * .27);
  s.bezierCurveTo(cx + w * .55, cy + h * .01, cx + w * .12, cy - h * .30, cx, cy - h * .48); s.closePath(); return s;
}
function drawHeart(c, x, y, r, color) {
  c.fillStyle = color; c.beginPath(); c.moveTo(x, y + r);
  c.bezierCurveTo(x-r*1.6,y-r*.1,x-r*.7,y-r*1.4,x,y-r*.5);
  c.bezierCurveTo(x+r*.7,y-r*1.4,x+r*1.6,y-r*.1,x,y+r); c.fill();
}
function drawFlower(c, x, y, r, petals = '#f4b6ae') {
  c.fillStyle = petals;
  for (let i=0;i<5;i++) { const a=i*Math.PI*2/5; c.beginPath();c.ellipse(x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,r*.46,r*.46,0,0,Math.PI*2);c.fill(); }
  c.fillStyle='#e8bd70';c.beginPath();c.arc(x,y,r*.26,0,Math.PI*2);c.fill();
}
function woodTexture() {
  return texture((c,s)=>{
    c.fillStyle='#d5a268';c.fillRect(0,0,s,s);
    for(let i=0;i<380;i++) {
      const y=i*s/380, wobble=1.3+1.4*Math.sin(i*1.67); c.beginPath();
      for(let x=0;x<=s;x+=8){const yy=y+Math.sin(x*.004+i*.19)*wobble+Math.sin(x*.013+i)*.8;x?c.lineTo(x,yy):c.moveTo(x,yy);}
      c.strokeStyle=i%7===0?'#8a5e3226':i%3===0?'#fff5d930':'#9162350d';c.lineWidth=i%7===0?1.6:.8;c.stroke();
    }
    for(let i=0;i<12;i++) {c.fillStyle=i%2?'#fff5db04':'#9e703506';c.fillRect(0,i*87,s,34);}
  });
}
function ginghamTexture() {
  return texture((c,s)=>{
    c.fillStyle='#f4dfcf';c.fillRect(0,0,s,s);
    c.fillStyle='#d987827d';const a=s/8;
    for(let i=0;i<8;i+=2){c.fillRect(i*a,0,a,s);c.fillRect(0,i*a,s,a);}
    for(let i=0;i<s;i+=4){c.fillStyle=i%8?'#fff5ed19':'#c1847f10';c.fillRect(i,0,1,s);c.fillRect(0,i,s,1);}
  });
}
function paperTexture() {
  return texture((c,s)=>{
    c.fillStyle='#f1e0c2';c.fillRect(0,0,s,s);c.strokeStyle='#bdae969e';c.lineWidth=3;
    for(let y=155;y<900;y+=83){c.beginPath();c.moveTo(90,y);c.lineTo(930,y);c.stroke();}
    drawHeart(c,160,855,28,'#e6a499');drawFlower(c,800,210,40);c.strokeStyle='#8fa17a';c.lineWidth=6;
    c.beginPath();c.moveTo(800,240);c.bezierCurveTo(810,280,800,300,785,325);c.stroke();
    c.fillStyle='#9cac85';c.beginPath();c.ellipse(785,283,27,12,.6,0,Math.PI*2);c.fill();
  });
}

export function createStorybookDesk() {
  const group=new THREE.Group();group.name='Heartwood writing desk and cushioned chair';
  const timber=woodTexture(),verticalGrain=timber.clone();verticalGrain.center.set(.5,.5);verticalGrain.rotation=Math.PI/2;
  const wood=new THREE.MeshPhysicalMaterial({name:'Desk | warm satin hinoki',map:timber,roughness:.63,specularIntensity:.27,clearcoat:.07,clearcoatRoughness:.7});
  const upright=wood.clone();upright.map=verticalGrain;upright.name='Desk | upright hinoki grain';
  const edge=wood.clone();edge.color.set('#d1af85');edge.name='Desk | end grain and carved edging';
  const pale=wood.clone();pale.color.set('#fff5df');pale.name='Desk | pale timber panels';
  const check=ginghamTexture();
  const cotton=new THREE.MeshPhysicalMaterial({name:'Chair | woven rose gingham',map:check,roughness:.92,specularIntensity:.12});
  const pink=new THREE.MeshStandardMaterial({name:'Desk | rose cotton trim',color:'#d99590',roughness:.88});
  const lightPink=new THREE.MeshStandardMaterial({name:'Desk | blush cotton',color:'#edb5a9',roughness:.82});
  const cream=new THREE.MeshPhysicalMaterial({name:'Desk | warm cream ceramic',color:'#f5e6cd',roughness:.42,specularIntensity:.24});
  const paper=new THREE.MeshStandardMaterial({name:'Desk | thick warm ivory pages',color:'#f8ebd1',roughness:.95});
  const sage=new THREE.MeshStandardMaterial({name:'Desk | muted sage leaves',color:'#87965c',roughness:.82});
  const darkSage=new THREE.MeshStandardMaterial({name:'Desk | sage flower stems',color:'#75864b',roughness:.9});
  const gold=new THREE.MeshStandardMaterial({name:'Desk | daisy centres',color:'#eab751',roughness:.68});
  const petals=new THREE.MeshPhysicalMaterial({name:'Desk | ivory daisy petals',color:'#fff3d9',roughness:.76,specularIntensity:.18});
  const materials={wood,upright,edge,pale,cotton,pink,cream};
  const mesh=(parent,name,geometry,material)=>{const m=new THREE.Mesh(geometry,material);m.name='Writing corner | '+name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const box=(parent,name,size,p,mat=wood,r=.035)=>{const m=mesh(parent,name,new RoundedBoxGeometry(...size,5,r),mat);m.position.fromArray(p);return m;};
  const oval=(parent,name,p,size,mat=wood)=>{const m=mesh(parent,name,new THREE.SphereGeometry(1,24,16),mat);m.position.fromArray(p);m.scale.fromArray(size);return m;};
  const tube=(parent,name,points,r,mat=wood,closed=false)=>mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(24,points.length*3),r,8,closed),mat);
  const rod=(parent,name,a,b,r,mat=wood,sides=16)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start),m=mesh(parent,name,new THREE.CylinderGeometry(r,r,d.length(),sides),mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;};
  function panel(parent,name,shape,p,depth,mat=wood,bevel=.025) {
    const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,curveSegments:40});
    g.computeBoundingBox();const b=g.boundingBox,uv=g.attributes.uv,v=g.attributes.position;
    for(let i=0;i<v.count;i++)uv.setXY(i,(v.getX(i)-b.min.x)/(b.max.x-b.min.x),(v.getY(i)-b.min.y)/(b.max.y-b.min.y));
    const m=mesh(parent,name,g,mat);m.position.fromArray(p);return m;
  }
  function outline(parent,name,shape,z,r,mat=wood) {return tube(parent,name,shape.getPoints(100).map(v=>[v.x,v.y,z]),r,mat,true);}
  function bow(parent,name,p,scale=1,mat=cotton) {
    const g=new THREE.Group();g.name=name;g.position.fromArray(p);g.scale.setScalar(scale);parent.add(g);
    for(const side of [-1,1]) {
      const s=new THREE.Shape();s.moveTo(side*.022,0);s.bezierCurveTo(side*.12,.06,side*.29,.22,side*.35,.15);s.bezierCurveTo(side*.39,.08,side*.39,-.10,side*.32,-.11);s.bezierCurveTo(side*.20,-.09,side*.10,-.03,side*.022,-.018);s.closePath();
      panel(g,'soft folded ribbon loop',s,[0,0,0],.055,mat,.018);
      const tail=new THREE.Shape();tail.moveTo(side*.025,-.02);tail.bezierCurveTo(side*.06,-.18,side*.16,-.27,side*.18,-.47);tail.lineTo(side*.10,-.41);tail.lineTo(side*.036,-.49);tail.bezierCurveTo(side*.01,-.28,-side*.012,-.16,-side*.025,-.04);tail.closePath();
      const ribbon=panel(g,'swallowtail ribbon',tail,[0,0,-.025],.014,mat,.008);ribbon.rotation.y=side*.08;
      tube(g,'ribbon gathered fold',[[side*.055,.004,.085],[side*.16,.043,.08],[side*.27,.07,.075]],.005,pink);
    }
    oval(g,'rounded ribbon knot',[0,0,.050],[.065,.073,.068],mat);return g;
  }
  function blossom(parent,p,r,mat=petals) {
    const g=new THREE.Group();g.name='Writing corner | daisy flower';g.position.fromArray(p);parent.add(g);
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2,m=oval(g,'soft daisy petal',[Math.sin(a)*r*.62,Math.cos(a)*r*.62,0],[r*.27,r*.49,r*.15],mat);m.rotation.z=-a;}
    oval(g,'golden daisy centre',[0,0,r*.16],[r*.34,r*.34,r*.24],gold);return g;
  }

  const desk=new THREE.Group();desk.name='Scalloped heart writing desk';group.add(desk);
  box(desk,'thick softly rounded desktop',[3.55,.19,1.64],[0,2.26,0],wood,.08);
  box(desk,'desktop lower moulding',[3.37,.06,1.47],[0,2.145,0],pale,.025);
  for(const x of [-1.48,1.48])for(const z of [-.58,.58]) {
    box(desk,'rounded solid timber leg',[.235,2.12,.235],[x,1.065,z],upright,.055);
    box(desk,'gentle leg foot',[.244,.19,.244],[x,.112,z],upright,.045);
  }
  for(const x of [-1.48,1.48]) {
    box(desk,'side apron',[.17,.46,1.13],[x,1.94,0],wood,.035);
    box(desk,'low side stretcher',[.16,.17,1.16],[x,.35,0],wood,.035);
  }
  box(desk,'low rear stretcher',[2.96,.17,.16],[0,.35,-.58],wood,.035);
  box(desk,'drawer housing',[2.92,.46,1.17],[0,1.94,-.04],wood,.04);
  box(desk,'drawer recessed shadow',[2.35,.42,.025],[0,1.93,.562],edge,.05);
  box(desk,'single rounded drawer front',[2.25,.37,.09],[0,1.94,.60],pale,.055);
  rod(desk,'drawer knob stem',[0,1.94,.66],[0,1.94,.74],.043,wood);
  oval(desk,'round wooden drawer pull',[0,1.94,.764],[.092,.092,.067],wood);
  const cloud=new THREE.Shape();cloud.moveTo(-1.61,2.34);cloud.lineTo(1.61,2.34);cloud.lineTo(1.61,2.79);
  cloud.bezierCurveTo(1.61,3.02,1.42,3.06,1.22,2.96);cloud.bezierCurveTo(1.06,3.16,.82,3.13,.68,3.05);
  cloud.bezierCurveTo(.42,3.58,-.42,3.58,-.68,3.05);cloud.bezierCurveTo(-.82,3.13,-1.06,3.16,-1.22,2.96);
  cloud.bezierCurveTo(-1.42,3.06,-1.61,3.02,-1.61,2.79);cloud.closePath();
  const deskHeart=heartPath(0,3.045,.32,THREE.Path);cloud.holes.push(deskHeart);
  panel(desk,'scalloped backboard with real heart opening',cloud,[0,0,-.754],.105,wood,.035);
  outline(desk,'backboard carved edging',cloud,-.609,.012,pale);
  outline(desk,'heart opening soft rim',deskHeart,-.610,.009,edge);

  const chair=new THREE.Group();chair.name='Round-eared heart chair';chair.position.set(.26,0,1.67);chair.rotation.y=-.22;group.add(chair);
  for(const x of [-.44,.44])for(const z of [-.40,.40]) {
    const a=new THREE.Vector3(x*1.18,.08,z*1.19),b=new THREE.Vector3(x,1.29,z),d=b.clone().sub(a);
    const leg=box(chair,'splayed rounded chair leg',[.17,d.length()+.13,.17],a.clone().add(b).multiplyScalar(.5).toArray(),upright,.045);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  }
  box(chair,'solid seat frame',[1.16,.16,1.07],[0,1.275,0],wood,.085);
  const cushionGeometry=new THREE.SphereGeometry(1,64,40),pos=cushionGeometry.attributes.position,uv=cushionGeometry.attributes.uv;
  const rounded=v=>Math.sign(v)*Math.abs(v)**.42;
  for(let i=0;i<pos.count;i++){
    const x=rounded(pos.getX(i))*.60,z=rounded(pos.getZ(i))*.56,y=pos.getY(i)*.15;
    pos.setXYZ(i,x,y,z);uv.setXY(i,x/1.20+.5,z/1.12+.5);
  }
  cushionGeometry.computeVertexNormals();const cushion=mesh(chair,'plump gingham cushion',cushionGeometry,cotton);cushion.position.y=1.49;
  function seatPerimeter(t){const a=t*Math.PI*2;return [Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.38*.594,Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.38*.551];}
  const seam=[],bottom=[],positions=[],uvs=[],indices=[],segments=240;
  for(let i=0;i<=segments;i++){
    const t=i/segments,[x,z]=seatPerimeter(t),ruffle=(1-Math.cos(t*Math.PI*2*22))*.028;
    seam.push([x,1.47,z]);bottom.push([x*1.035,1.29-ruffle,z*1.035]);
    positions.push(x,1.43,z,x*1.035,1.29-ruffle,z*1.035);uvs.push(t*4,0,t*4,.5);
    if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const frillGeometry=new THREE.BufferGeometry();frillGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));frillGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));frillGeometry.setIndex(indices);frillGeometry.computeVertexNormals();
  const frillMaterial=cotton.clone();frillMaterial.side=THREE.DoubleSide;mesh(chair,'scalloped cushion skirt',frillGeometry,frillMaterial);
  tube(chair,'cushion piped seam',seam,.012,lightPink);tube(chair,'pink scalloped skirt hem',bottom,.012,pink);
  const back=new THREE.Shape();back.moveTo(-.48,1.40);back.bezierCurveTo(-.56,1.82,-.70,2.15,-.62,2.54);
  back.bezierCurveTo(-.60,2.86,-.49,3.04,-.31,3.02);back.bezierCurveTo(-.13,3.00,-.12,2.74,-.10,2.65);
  back.quadraticCurveTo(0,2.70,.10,2.65);back.bezierCurveTo(.12,2.74,.13,3.00,.31,3.02);
  back.bezierCurveTo(.49,3.04,.60,2.86,.62,2.54);back.bezierCurveTo(.70,2.15,.56,1.82,.48,1.40);back.closePath();
  const chairHeart=heartPath(0,2.15,.34,THREE.Path);back.holes.push(chairHeart);
  panel(chair,'round-eared backrest with heart cutout',back,[0,0,.43],.11,upright,.036);
  outline(chair,'soft chair back edging',back,.578,.010,pale);outline(chair,'chair heart inner rim',chairHeart,.578,.009,edge);
  for(const x of [-.53,.53]){const b=bow(chair,'Gingham cushion tie',[x,1.47,.58],.64);b.rotation.z=x<0?-.10:.10;}

  // Three closed books with page blocks, a proper spine and cloth covers.
  const coverColors=['#a5b296','#f0ddba','#e8b2ab'];
  for(let i=0;i<3;i++) {
    const b=new THREE.Group();b.name='Writing corner | cloth-bound book';b.position.set(-.91,2.39+i*.122,-.33);b.rotation.y=[-.06,.035,-.035][i];desk.add(b);
    const cover=new THREE.MeshStandardMaterial({name:'Desk | pastel cloth book '+i,color:coverColors[i],roughness:.86});
    box(b,'book ivory page block',[.64,.079,.43],[0,.042,0],paper,.012);
    for(const y of [0,.091])box(b,'rounded cloth book cover',[.70,.024,.47],[0,y,0],cover,.011);
    box(b,'rounded book spine',[.045,.10,.47],[-.331,.045,0],cover,.018);
    for(const y of [.020,.038,.056,.074])tube(b,'fine page edge',[[.325,y,-.18],[.325,y,.18]],.0014,cream);
    const motif=blossom(b,[0,.106,.015],.045,petals);motif.rotation.x=-Math.PI/2;
    if(i===2){const h=panel(b,'tiny heart on book cover',heartPath(0,0,.115),[.15,.107,0],.001,lightPink,.002);h.rotation.x=-Math.PI/2;}
  }

  // A hollow pencil pot, rather than a filled cylinder with pencils sitting on it.
  const pot=new THREE.Group();pot.name='Writing corner | ceramic pencil cup';pot.position.set(-1.38,2.365,-.18);desk.add(pot);
  const cupPoints=[[0,0],[.15,0],[.169,.04],[.17,.37],[.155,.385],[.143,.37],[.143,.045],[0,.045]].map(p=>new THREE.Vector2(...p));
  mesh(pot,'hollow ceramic pencil cup',new THREE.LatheGeometry(cupPoints,48),cream);
  const scallop=[];for(let i=0;i<=144;i++){const a=i/144*Math.PI*2;scallop.push([.161*Math.cos(a),.375+.011*Math.cos(a*12),.161*Math.sin(a)]);}tube(pot,'scalloped cup lip',scallop,.012,cream);
  bow(pot,'Small blush cup bow',[0,.20,.17],.27,lightPink);
  for(const [x,y] of [[-.1,.10],[.10,.13],[-.11,.29],[.09,.31]])oval(pot,'small pink cup dot',[x,y,Math.sqrt(.17**2-x*x)+.002],[.008,.008,.003],lightPink);
  for(let i=0;i<4;i++){
    const p=new THREE.Group();p.name='Writing corner | pencil or heart pen';p.position.set(-.09+i*.052,.12,(i%2)*.07-.04);p.rotation.z=[.22,-.09,-.22,-.13][i];pot.add(p);
    const paint=new THREE.MeshStandardMaterial({color:['#ebc96d','#f3d9b6','#e7a5a1','#bdc3a0'][i],roughness:.65});
    rod(p,'pastel pencil barrel',[0,0,0],[0,.57,0],.024,paint,i===1?6:16);
    if(i===1){const tip=mesh(p,'sharpened pencil wood',new THREE.ConeGeometry(.025,.10,6),wood);tip.position.y=.62;const lead=mesh(p,'graphite point',new THREE.ConeGeometry(.008,.032,6),edge);lead.position.y=.671;}
    else if(i===2){const h=panel(p,'heart pen topper',heartPath(0,.60,.09),[0,0,-.012],.02,lightPink,.007);h.rotation.y=-.18;}
    else {rod(p,'pencil ferrule',[0,.55,0],[0,.59,0],.027,gold);oval(p,'rounded pink eraser',[0,.618,0],[.027,.039,.027],lightPink);}
  }

  // Open notebook: bowed pages, a shallow central gutter and separate cover.
  const notebook=new THREE.Group();notebook.name='Writing corner | open floral notebook';notebook.position.set(-.04,2.38,.35);notebook.rotation.y=.10;desk.add(notebook);
  const ruled=new THREE.MeshStandardMaterial({name:'Desk | ruled floral stationery',map:paperTexture(),roughness:.94,side:THREE.DoubleSide});
  function pageSurface(side,layer,material){
    const positions=[],uvs=[],indices=[],nx=32,nz=24;
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/nz*2-1,x=side*(.012+u*.52),z=v*.30,y=.012+.047*Math.sin(u*Math.PI)+.016*u+.012*v*v*u+layer;
      positions.push(x,y,z);uvs.push(side<0?1-u:u,(v+1)*.5);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;side>0?indices.push(a,c,b,b,c,d):indices.push(a,b,c,b,d,c);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return mesh(notebook,'curved notebook pages',g,material);
  }
  for(const side of [-1,1]) {
    const cover=pageSurface(side,-.025,lightPink);cover.scale.set(1.045,1,1.055);
    pageSurface(side,-.012,paper);pageSurface(side,0,ruled);
    tube(notebook,'notebook rounded cover edge',[[side*.548,.022,-.316],[side*.555,.028,0],[side*.548,.022,.316]],.006,pink);
  }
  tube(notebook,'notebook bound centre',[[0,.016,-.31],[0,.006,0],[0,.016,.31]],.008,lightPink);
  tube(notebook,'rose bookmark ribbon',[[.05,.01,.20],[.05,.005,.33],[.03,-.012,.38]],.009,pink);

  const bouquet=new THREE.Group();bouquet.name='Writing corner | daisy jar with ribbon';bouquet.position.set(1.07,2.365,-.39);desk.add(bouquet);
  const glass=new THREE.MeshPhysicalMaterial({name:'Desk | clear honey glass',color:'#f8ffef',transparent:true,opacity:.18,roughness:.17,metalness:0,specularIntensity:.5,depthWrite:false});
  const jar=[[0,0],[.12,0],[.16,.035],[.17,.17],[.15,.28],[.09,.34],[.09,.42],[.075,.43],[.075,.35],[.13,.28],[.15,.17],[.14,.045],[0,.025]].map(p=>new THREE.Vector2(...p));
  mesh(bouquet,'hollow clear flower jar',new THREE.LatheGeometry(jar,48),glass);
  const glassRim=cream.clone();glassRim.transparent=true;glassRim.opacity=.48;glassRim.depthWrite=false;
  const lip=mesh(bouquet,'glass jar rim',new THREE.TorusGeometry(.083,.009,8,40),glassRim);lip.rotation.x=Math.PI/2;lip.position.y=.422;
  bow(bouquet,'Flower jar pink ribbon',[0,.33,.108],.30,lightPink);
  const flowers=[[-.13,.94,-.015,.135],[.23,.77,.01,.105],[.05,.64,.12,.095],[-.23,.62,.05,.073],[.17,.51,.10,.067]];
  flowers.forEach(([x,y,z,r],i)=>{
    tube(bouquet,'curving daisy stem',[[.025*Math.sin(i),.04,0],[x*.28,.38,z*.4],[x*.65,y*.78,z*.7],[x,y,z]],.006,darkSage);
    const flower=blossom(bouquet,[x,y,z],r);flower.rotation.set(-.12+i*.07,(i-2)*.12,0);
    for(const side of [-1,1]){const leaf=oval(bouquet,'soft pointed daisy leaf',[x*.48+side*.055,.40+(i%3)*.055,z*.5],[.038,.105,.013],sage);leaf.rotation.z=-side*.83;}
  });
  const gift=new THREE.Group();gift.name='Writing corner | gingham stationery tin';gift.position.set(1.16,2.365,.35);gift.rotation.y=-.07;desk.add(gift);
  box(gift,'gingham stationery box',[.48,.175,.37],[0,.09,0],cotton,.035);
  box(gift,'rounded stationery box lid',[.50,.055,.39],[0,.202,0],cotton,.025);
  const lidHeart=panel(gift,'little heart on stationery lid',heartPath(0,0,.12),[0,.234,0],.003,lightPink,.004);lidHeart.rotation.x=-Math.PI/2;

  group.position.fromArray(DESK_PLACEMENT.position);group.rotation.y=DESK_PLACEMENT.rotation;
  let meshCount=0,triangles=0;group.traverse(o=>{if(o.isMesh){meshCount++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  group.userData={revision:'storybook-desk-1',meshCount,triangles,placement:DESK_PLACEMENT,heartOpenings:2,cushion:'volumetric rose gingham',scope:'desk and chair only',plan:FURNITURE_PLAN};
  return group;
}
