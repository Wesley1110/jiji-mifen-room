import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeHinokiMaterials,makeWovenMaterial} from './wardrobe-materials.js';

export function housePalette(){
 const timber=makeHinokiMaterials();
 const material=(name,color,roughness=.8)=>new THREE.MeshPhysicalMaterial({name,color,roughness,specularIntensity:.24});
 const cream=makeWovenMaterial('Reading room | warm oatmeal linen','#c7b494');
 const rose=makeWovenMaterial('Reading room | dusty rose woven cotton','#c99186');
 const sage=makeWovenMaterial('Reading room | sage woven cotton','#879274');
 const linen=makeWovenMaterial('Reading room | natural flax curtains','#eee0c9');linen.side=THREE.DoubleSide;
 const plaster=material('House | warm lime plaster','#e7dac6',.96);
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);
 let seed=88;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
 for(let i=0;i<data.data.length;i+=4){const n=122+rand()*15;data.data.set([n,n,n,255],i);}ctx.putImageData(data,0,0);
 const bump=new THREE.CanvasTexture(c);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(4,4);plaster.bumpMap=bump;plaster.bumpScale=.006;
 const rug=makeWovenMaterial('Reading room | dense wool loop rug','#b9a582');rug.normalScale.set(.55,.55);rug.sheen=.9;
 return {...timber,cream,rose,sage,linen,plaster,rug,material,
  panel:material('House | chalk sage panelling','#bbc1a7',.85),trim:material('House | ivory painted moulding','#e4d9bf',.78),
  brass:new THREE.MeshPhysicalMaterial({name:'House | brushed antique brass',color:'#b69050',metalness:.65,roughness:.37}),
  ceramic:material('House | warm cream glazed ceramic','#ebdcc0',.28),paper:material('House | warm book pages','#e8dfca',.96),
  green:material('House | living sage leaves','#697d4b',.87),darkGreen:material('House | leaf veins','#536a3c',.9),
  pink:material('House | blush embroidery','#d6a194',.9),gold:material('House | ochre flower centres','#d8ad59',.8)};
}

export function craft(root,prefix='House'){
 function mesh(parent,name,geometry,material){const o=new THREE.Mesh(geometry,material);o.name=prefix+' | '+name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(parent,name,size,pos,mat,r=.025){const o=mesh(parent,name,new RoundedBoxGeometry(...size,4,Math.min(r,...size.map(v=>v*.49))),mat);o.position.fromArray(pos);return o;}
 function oval(parent,name,pos,scale,mat){const o=mesh(parent,name,new THREE.SphereGeometry(1,32,24),mat);o.position.fromArray(pos);o.scale.fromArray(scale);return o;}
 function tube(parent,name,points,r,mat,closed=false){let p=points.map(v=>new THREE.Vector3(...v));if(closed&&p[0].distanceToSquared(p[p.length-1])<1e-12)p=p.slice(0,-1);return mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p,closed),Math.max(24,p.length*3),r,8,closed),mat);}
 function rod(parent,name,a,b,r,mat,r2=r){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),o=mesh(parent,name,new THREE.CylinderGeometry(r2,r,d.length(),20),mat);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 function panel(parent,name,shape,pos,depth,mat,bevel=.018){
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:48,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4});
  g.computeBoundingBox();const b=g.boundingBox,p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-b.min.x)/Math.max(.01,b.max.x-b.min.x),(p.getY(i)-b.min.y)/Math.max(.01,b.max.y-b.min.y));
  const o=mesh(parent,name,g,mat);o.position.fromArray(pos);return o;
 }
 function lathe(parent,name,points,pos,mat){const o=mesh(parent,name,new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),48),mat);o.position.fromArray(pos);return o;}
 function group(name,pos=[0,0,0],rotation=0,parent=root){const g=new THREE.Group();g.name=prefix+' | '+name;g.position.fromArray(pos);g.rotation.y=rotation;parent.add(g);return g;}
 return {mesh,box,oval,tube,rod,panel,lathe,group};
}

export function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
export function archShape(w,spring,bottom=0,rise=w/2){const s=new THREE.Shape(),r=w/2;s.moveTo(-r,bottom);s.lineTo(r,bottom);s.lineTo(r,spring);s.bezierCurveTo(r,spring+rise*.5523,r*.5523,spring+rise,0,spring+rise);s.bezierCurveTo(-r*.5523,spring+rise,-r,spring+rise*.5523,-r,spring);s.closePath();return s;}
// Door surrounds are a single open-bottom contour. A hole crossing the outer
// polygon at floor level is invalid and can triangulate across the opening.
export function archSurround(outerWidth,innerWidth,spring,outerRise,innerRise,bottom=-.04,flatTop=null){
 const s=new THREE.Shape(),r=outerWidth/2,q=innerWidth/2,k=.55228475;s.moveTo(-r,bottom);
 if(flatTop!==null){s.lineTo(-r,flatTop);s.lineTo(r,flatTop);s.lineTo(r,bottom);}else{s.lineTo(-r,spring);s.bezierCurveTo(-r,spring+outerRise*k,-r*k,spring+outerRise,0,spring+outerRise);s.bezierCurveTo(r*k,spring+outerRise,r,spring+outerRise*k,r,spring);s.lineTo(r,bottom);}
 s.lineTo(q,bottom);s.lineTo(q,spring);s.bezierCurveTo(q,spring+innerRise*k,q*k,spring+innerRise,0,spring+innerRise);s.bezierCurveTo(-q*k,spring+innerRise,-q,spring+innerRise*k,-q,spring);s.lineTo(-q,bottom);s.closePath();return s;
}
export function roundLoop(w,d,r,y){const shape=roundedShape(w,d,r);return shape.getPoints(64).map(p=>[p.x,y,p.y]);}

let shadowTexture;
export function contactShadow(parent,x,z,rx,rz,opacity=.2,height=-.025){
 if(!shadowTexture){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,8,64,64,64);g.addColorStop(0,'rgba(61,43,26,.62)');g.addColorStop(.55,'rgba(61,43,26,.22)');g.addColorStop(1,'rgba(61,43,26,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);shadowTexture=new THREE.CanvasTexture(c);}
 const mat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity,depthWrite:false,toneMapped:false});
 const o=new THREE.Mesh(new THREE.PlaneGeometry(rx*2,rz*2),mat);o.name='House | soft contact shadow';o.rotation.x=-Math.PI/2;o.position.set(x,height,z);parent.add(o);return o;
}

export function pillowGeometry(w,h,d){
 const g=new THREE.SphereGeometry(1,48,32),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),s=(n,k)=>Math.sign(n)*Math.pow(Math.abs(n),k);p.setXYZ(i,s(x,.43)*w/2,s(y,.72)*h/2*(1-.05*Math.cos(x*4)*Math.cos(z*3)),s(z,.43)*d/2);}
 g.computeVertexNormals();return g;
}
