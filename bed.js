import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPlushBedding} from './bedding.js?revision=bedding-2';

// An independent furniture layer. Original v11 toy meshes and fur are retained;
// bedding.js raises them together to match the thicker mattress.
function canvasTexture(draw,size=1024){
 const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function woodGrain(){
 return canvasTexture((c,s)=>{
  c.fillStyle='#dbba89';c.fillRect(0,0,s,s);
  const g=c.createLinearGradient(0,0,0,s);g.addColorStop(0,'#f5ddb51c');g.addColorStop(.46,'#9c743e0b');g.addColorStop(1,'#fff0c91a');c.fillStyle=g;c.fillRect(0,0,s,s);
  // Long, quiet grain with irregular spacing, instead of dark stripes or knots.
  for(let i=0;i<290;i++){
   const y=(i/290)**1.08*s,a=1.5+2*Math.sin(i*2.7);
   c.beginPath();
   for(let x=0;x<=s;x+=8){const yy=y+Math.sin(x*.006+i*.31)*a+Math.sin(x*.014+i)*.7;x?c.lineTo(x,yy):c.moveTo(x,yy);}
   c.strokeStyle=i%5===0?'#97704624':'#9b795411';c.lineWidth=i%5===0?1.2:.65;c.stroke();
  }
  for(let i=0;i<80;i++){
   const y=i*12.8+6;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(300,y+3,660,y-4,s,y);c.strokeStyle='#fff0d21c';c.lineWidth=.8;c.stroke();
  }
 });
}
export function upgradeFairytaleBed(root,nap){
 const group=new THREE.Group();group.name='Storybook hinoki bed';
 group.userData.revision='storybook-bed-2';
 const grain=woodGrain();
 const wood=new THREE.MeshPhysicalMaterial({name:'Hinoki | warm pale timber',map:grain,roughness:.69,metalness:0,specularIntensity:.23});
 const lightWood=wood.clone();lightWood.name='Hinoki | pale raised panel';lightWood.color.set('#fff7eb');
 const endWood=wood.clone();endWood.name='Hinoki | carved edges';endWood.color.set('#cda977');
 const inlay=new THREE.MeshStandardMaterial({name:'Hinoki | maple moon inlay',color:'#b98b52',roughness:.78});
 let replaced=0;
 root.traverse(o=>{const n=o.userData.sourceName||'';if(o.isMesh&&n.startsWith('Bed |')&&!n.includes('cotton mattress')){o.visible=false;replaced++;}});
 const bedding=createPlushBedding(root);group.add(bedding);replaced+=bedding.userData.replacedMeshes;
 function mesh(name,geometry,material){
  const o=new THREE.Mesh(geometry,material);o.name='Fairytale bed | '+name;o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
 }
 function box(name,size,p,mat=wood,r=.07){const o=mesh(name,new RoundedBoxGeometry(...size,4,r),mat);o.position.fromArray(p);return o;}
 function tube(name,points,r,mat=wood,closed=false){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
  return mesh(name,new THREE.TubeGeometry(curve,Math.max(24,points.length*2),r,8,closed),mat);
 }
 function panel(name,shape,z,depth,material,bevel=.045){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,curveSegments:32});
  // Normalized face UVs give broad, horizontal boards rather than tiled noise.
  g.computeBoundingBox();const b=g.boundingBox,p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-b.min.x)/(b.max.x-b.min.x),(p.getY(i)-b.min.y)/(b.max.y-b.min.y));
  const o=mesh(name,g,material);o.position.z=z;return o;
 }
 function star(name,x,y,z,size,mat=inlay){
  const s=new THREE.Shape();
  for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?size*.43:size;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();
  const o=panel(name,s,z,.012,mat,.012);o.position.x=x;o.position.y=y;return o;
 }
 function crescent(name,x,y,z,scale=1){
  const s=new THREE.Shape();s.moveTo(.13,.34);s.bezierCurveTo(-.29,.39,-.46,-.13,-.10,-.34);s.bezierCurveTo(.14,-.48,.43,-.23,.40,.02);s.bezierCurveTo(.05,-.19,-.19,.13,.13,.34);s.closePath();
  const o=panel(name,s,z,.014,inlay,.012);o.position.x=x;o.position.y=y;o.scale.setScalar(scale);return o;
 }
 const cloud=new THREE.Shape();cloud.moveTo(-2.65,.48);cloud.lineTo(2.65,.48);cloud.lineTo(2.65,3.82);
 cloud.bezierCurveTo(2.65,4.22,2.43,4.43,2.13,4.43);cloud.bezierCurveTo(1.92,4.43,1.83,4.31,1.67,4.33);
 cloud.bezierCurveTo(1.64,4.86,1.18,5.18,.81,4.98);cloud.bezierCurveTo(.49,5.70,-.49,5.70,-.81,4.98);
 cloud.bezierCurveTo(-1.18,5.18,-1.64,4.86,-1.67,4.33);cloud.bezierCurveTo(-1.83,4.31,-1.92,4.43,-2.13,4.43);
 cloud.bezierCurveTo(-2.43,4.43,-2.65,4.22,-2.65,3.82);cloud.closePath();
 panel('sculpted cloud headboard',cloud,-2.66,.26,wood,.075);
 const inset=panel('raised cloud panel',cloud,-2.31,.035,lightWood,.04);inset.scale.set(.915,.91,1);inset.position.y=.23;
 const contour=cloud.getPoints(140).map(p=>[p.x*.915,p.y*.91+.23,-2.22]);tube('fine carved panel border',contour,.018,endWood,true);
 crescent('sleepy crescent inlay',-.12,4.98,-2.20,.75);star('small morning star',.61,4.96,-2.195,.105);star('small evening star',-.63,4.92,-2.195,.07);

 // Broad, hand-turned posts with bun feet and rounded acorn finials.
 function post(x,z,height){
  const pts=[[.16,.025],[.22,.06],[.23,.14],[.21,.24],[.15,.32],[.13,.43],[.16,.50],[.16,height-.30],[.20,height-.23],[.20,height-.16],[.15,height-.12],[.145,height]].map(([r,y])=>new THREE.Vector2(r,y));
  const o=mesh('turned timber post',new THREE.LatheGeometry(pts,32),wood);o.position.set(x,0,z);
  for(const y of [.46,height-.23]){const ring=mesh('rounded post collar',new THREE.TorusGeometry(.165,.025,8,32),endWood);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);}
  const cap=mesh('acorn finial',new THREE.SphereGeometry(.205,32,20),lightWood);cap.scale.y=1.15;cap.position.set(x,height+.11,z);
  const tip=mesh('finial tip',new THREE.SphereGeometry(.052,20,12),endWood);tip.scale.y=1.1;tip.position.set(x,height+.345,z);
 }
 for(const x of [-2.77,2.77]){post(x,-2.48,4.10);post(x,3.70,1.24);}
 box('rounded mattress platform',[5.50,.27,6.05],[0,.61,.55],wood,.105);
 for(const x of [-2.72,2.72]){
  box('deep side rail',[.21,.40,6.05],[x,.64,.57],wood,.09);
  box('side rail maple welt',[.225,.045,5.98],[x,.79,.57],endWood,.017);
  // A shallow dipped apron makes the lower bed lighter and less boxy.
  const apron=new THREE.Shape();apron.moveTo(-2.85,.66);apron.lineTo(2.85,.66);apron.lineTo(2.85,.24);apron.bezierCurveTo(1.25,.45,-1.25,.45,-2.85,.24);apron.closePath();
  const o=panel('curved side apron',apron,0,.12,wood,.035);o.rotation.y=Math.PI/2;o.position.set(x-.06,0,.55);
 }
 const foot=new THREE.Shape();foot.moveTo(-2.56,.27);foot.bezierCurveTo(-1.2,.43,1.2,.43,2.56,.27);foot.lineTo(2.56,1.15);
 foot.bezierCurveTo(1.9,1.15,1.75,.86,0,.86);foot.bezierCurveTo(-1.75,.86,-1.9,1.15,-2.56,1.15);foot.closePath();
 panel('dipped storybook footboard',foot,3.67,.18,wood,.065);
 const footInner=panel('footboard raised panel',foot,3.865,.018,lightWood,.022);footInner.scale.set(.91,.69,1);footInner.position.y=.22;
 star('footboard centre star',0,.68,3.925,.115);
 // Subtle carved sprigs give the footboard a storybook woodworking detail.
 for(const side of [-1,1]){
  const branch=[];for(let i=0;i<=16;i++){const t=i/16;branch.push([side*(.43+t*.71),.64+.11*Math.sin(t*Math.PI),3.925]);}tube('maple sprig stem',branch,.009,inlay);
  for(let i=0;i<4;i++)for(const dir of [-1,1]){
   const t=(i+.35)/4,x=side*(.43+t*.71),y=.64+.11*Math.sin(t*Math.PI);
   const leaf=mesh('carved maple leaf',new THREE.SphereGeometry(1,16,8),inlay);leaf.scale.set(.075,.027,.008);leaf.rotation.z=side*dir*.62;leaf.position.set(x+side*.03,y+dir*.035,3.927);
  }
 }
 group.userData.replacedMeshes=replaced;group.userData.bedding=bedding.userData;group.userData.meshCount=0;group.traverse(o=>{if(o.isMesh)group.userData.meshCount++;});
 return group;
}
