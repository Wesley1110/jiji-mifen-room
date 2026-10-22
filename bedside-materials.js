import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvasTexture=(draw,w,h)=>{
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
};

export async function createAssetPricingBook(){
 const group=new THREE.Group();group.name='Floral bedside | Asset Pricing hardcover';
 const width=.44,depth=width*834/589,height=.165,board=.014;
 // Use the supplied cover bytes directly; preserve its original lettering and art.
 const cover=await new THREE.TextureLoader().loadAsync(new URL('./assets/asset-pricing-cover.png',import.meta.url).href);
 cover.colorSpace=THREE.SRGBColorSpace;cover.anisotropy=8;
 const jacket=new THREE.MeshPhysicalMaterial({name:'Asset Pricing | ochre hardcover',color:'#f5e7a8',roughness:.76,specularIntensity:.17});
 const printed=new THREE.MeshPhysicalMaterial({name:'Asset Pricing | supplied front cover',map:cover,roughness:.79,specularIntensity:.16});
 const paper=new THREE.MeshStandardMaterial({name:'Asset Pricing | thick ivory text block',color:'#e9dfc8',roughness:.98});
 const edges=canvasTexture((c,w,h)=>{
  c.fillStyle='#e8dfc9';c.fillRect(0,0,w,h);
  for(let y=1;y<h;y+=3){c.fillStyle=y%9===1?'#b8ad963e':'#fff7e787';c.fillRect(0,y,w,y%9===1?.6:.9);}
  const grad=c.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#9d87652a');grad.addColorStop(.09,'#fffaf000');grad.addColorStop(.95,'#fffaf000');grad.addColorStop(1,'#9d876522');c.fillStyle=grad;c.fillRect(0,0,w,h);
 },1024,256);
 const pageEdges=new THREE.MeshStandardMaterial({name:'Asset Pricing | fine individual page edges',map:edges,roughness:.99});
 const add=(name,geometry,material,p)=>{const m=new THREE.Mesh(geometry,material);m.name='Floral bedside | '+name;m.position.fromArray(p);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
 add('heavy textbook page block',new RoundedBoxGeometry(width-.025,height-.020,depth-.025,4,.005),[pageEdges,pageEdges,paper,paper,pageEdges,pageEdges],[.004,height/2,0]);
 for(const y of [0,height])add('thick hardback cover board',new RoundedBoxGeometry(width,board,depth,4,.005),jacket,[0,y,0]);
 const face=add('Asset Pricing original cover artwork',new THREE.PlaneGeometry(width-.012,depth-.012),printed,[0,height+board/2+.0004,0]);face.rotation.x=-Math.PI/2;
 // Raised spine and recessed hinges distinguish a bound volume from a box.
 const spineMat=jacket.clone();spineMat.color.set('#eee0a4');
 add('rounded heavy book spine',new RoundedBoxGeometry(.025,height+.013,depth-.002,4,.011),spineMat,[-width/2+.004,height/2,0]);
 const spineTexture=canvasTexture((c,w,h)=>{
  c.fillStyle='#f6e8a6';c.fillRect(0,0,w,h);c.fillStyle='#7f3375';c.textAlign='center';c.font='bold 83px Georgia';c.fillText('ASSET PRICING',w/2,99);
  c.fillStyle='#ad2f28';c.fillRect(0,124,w,36);c.fillStyle='#fdf4d7';c.font='24px Georgia';c.fillText('REVISED EDITION',w/2,151);
  c.fillStyle='#9b332b';c.font='bold 38px Georgia';c.fillText('JOHN H. COCHRANE',w/2,220);
 },1024,256);
 const spineInk=new THREE.MeshPhysicalMaterial({name:'Asset Pricing | matching lettered spine',map:spineTexture,roughness:.82,specularIntensity:.12});
 const spineFace=add('readable Asset Pricing spine',new THREE.PlaneGeometry(depth-.024,height-.018),spineInk,[-width/2-.009,height/2,0]);spineFace.rotation.y=-Math.PI/2;
 const hinge=new THREE.MeshStandardMaterial({color:'#ad945b',roughness:.92});
 for(const y of [.012,height-.012])add('subtle binding hinge',new THREE.CylinderGeometry(.0012,.0012,depth-.018,6),hinge,[-width/2+.022,y,0]).rotation.x=Math.PI/2;
 group.userData={title:'Asset Pricing',author:'John H. Cochrane',edition:'Revised Edition',source:'User-supplied front cover',size:[width,height+board,depth]};
 return group;
}

export function createShadeFabric(){
 const size=1024,count=size*size,albedo=new Uint8Array(count*4),normals=new Uint8Array(count*4),roughness=new Uint8Array(count*4),heights=new Float32Array(count);
 let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const weaveX=x/8,weaveY=y/8,over=(Math.floor(weaveX)+Math.floor(weaveY))%2;
  const warp=(Math.cos(weaveX*Math.PI*2)+1)*.5,weft=(Math.cos(weaveY*Math.PI*2)+1)*.5;
  const h=over?warp*.68+weft*.14:weft*.68+warp*.14;
  heights[y*size+x]=h;
  const stripeX=(Math.floor(x/128)%2),stripeY=(Math.floor(y/128)%2),dye=(stripeX+stripeY)*.23;
  const threadShade=.935+h*.055+(random()-.5)*.022+.008*Math.sin(x*.73)+.006*Math.sin(y*.81);
  const cream=[245,226,201],rose=[206,147,145],i=(y*size+x)*4;
  for(let k=0;k<3;k++)albedo[i+k]=(cream[k]*(1-dye)+rose[k]*dye)*threadShade;
  albedo[i+3]=255;
  const r=Math.round(239-h*16);roughness[i]=roughness[i+1]=roughness[i+2]=r;roughness[i+3]=255;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size])*.65,dy=(heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x])*.65;
  const n=new THREE.Vector3(-dx,dy,1).normalize(),i=(y*size+x)*4;
  normals[i]=(n.x*.5+.5)*255;normals[i+1]=(n.y*.5+.5)*255;normals[i+2]=(n.z*.5+.5)*255;normals[i+3]=255;
 }
 // Canvas-backed maps also support GLTFExporter's metallic/roughness packing.
 const make=(data,color=false)=>{const c=document.createElement('canvas');c.width=c.height=size;c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.buffer),size,size),0,0);const t=new THREE.CanvasTexture(c);t.flipY=false;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;return t;};
 return new THREE.MeshPhysicalMaterial({name:'Bedside | woven cotton shade with fine yarn relief',map:make(albedo,true),normalMap:make(normals),normalScale:new THREE.Vector2(.48,.48),roughnessMap:make(roughness),roughness:1,specularIntensity:.14,sheen:.78,sheenColor:'#f7e6cf',sheenRoughness:.88,side:THREE.DoubleSide,emissive:'#f8d6a0',emissiveIntensity:.085});
}
