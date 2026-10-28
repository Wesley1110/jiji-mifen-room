import * as THREE from 'three/webgpu';

// Quiet, irregular earlywood/latewood with long cathedral grain. The colour,
// pore normal and satin roughness all describe the same timber surface.
export function makeHinokiMaterials(){
 const w=768,h=1536,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(w,h),relief=new Float32Array(w*h);
 const roughCanvas=document.createElement('canvas');roughCanvas.width=w;roughCanvas.height=h;
 const rc=roughCanvas.getContext('2d'),rp=rc.createImageData(w,h);
 const hash=(x,y)=>{let n=Math.imul(x+71,374761393)^Math.imul(y+91,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 function noise(x,y){const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h;
  const drift=.028*Math.sin(v*5.3+.5)+.016*Math.sin(v*10.2+u*2.8);
  const radial=Math.sqrt((u-.47-drift)**2+((v-1.18)*.25)**2);
  const wave=radial*64+noise(u*5,v*2)*1.0;
  const late=Math.pow(.5+.5*Math.sin(wave*6.283),17);
  const soft=Math.sin(wave*3.1416)*.5+.5;
  const fibre=noise(u*340+drift*180,v*65)-.5;
  const large=noise(u*6,v*3)-.5;
  const streak=noise(u*70+drift*95,v*7)-.5;
  const shade=1+large*.08+soft*.022-late*.060+streak*.035+fibre*.020+(hash(x,y)-.5)*.012;
  const i=(y*w+x)*4;
  pixels.data[i]=210*shade;pixels.data[i+1]=159*shade;pixels.data[i+2]=103*shade;pixels.data[i+3]=255;
  relief[y*w+x]=late*-.24+fibre*.20+streak*.05;
  const r=212-late*9+fibre*14;rp.data[i]=rp.data[i+1]=rp.data[i+2]=r;rp.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);rc.putImageData(rp,0,0);
 const normalCanvas=document.createElement('canvas');normalCanvas.width=w;normalCanvas.height=h;
 const nc=normalCanvas.getContext('2d'),np=nc.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,dx=relief[y*w+(x+1)%w]-relief[y*w+(x+w-1)%w],dy=relief[((y+1)%h)*w+x]-relief[((y+h-1)%h)*w+x];
  np.data[i]=128-dx*75;np.data[i+1]=128-dy*75;np.data[i+2]=255;np.data[i+3]=255;
 }
 nc.putImageData(np,0,0);
 const map=new THREE.CanvasTexture(canvas),normal=new THREE.CanvasTexture(normalCanvas),rough=new THREE.CanvasTexture(roughCanvas);
 map.colorSpace=THREE.SRGBColorSpace;
 for(const t of [map,normal,rough]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}
 const wood=new THREE.MeshPhysicalMaterial({name:'Wardrobe | oiled honey hinoki',map,normalMap:normal,normalScale:new THREE.Vector2(.26,.26),roughnessMap:rough,roughness:.74,specularIntensity:.32,clearcoat:.10,clearcoatRoughness:.62});
 const horizontal=wood.clone();horizontal.name='Wardrobe | cross-grain hinoki rails';
 for(const key of ['map','normalMap','roughnessMap']){horizontal[key]=wood[key].clone();horizontal[key].center.set(.5,.5);horizontal[key].rotation=Math.PI/2;}
 const edge=wood.clone();edge.name='Wardrobe | recessed carved timber';edge.color.set('#d3b99b');edge.roughness=.88;
 const pale=wood.clone();pale.name='Wardrobe | gently burnished edges';pale.color.set('#fff3df');pale.clearcoat=.14;
 const inner=wood.clone();inner.name='Wardrobe | pale interior hinoki';inner.color.set('#ffe4bc');inner.roughness=.9;inner.clearcoat=0;
 return {wood,horizontal,edge,pale,inner};
}

export function makeWovenMaterial(name,color){
 const n=256,canvas=document.createElement('canvas');canvas.width=canvas.height=n;
 const c=canvas.getContext('2d'),p=c.createImageData(n,n),r=c.createImageData(n,n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,warp=Math.sin(x*Math.PI/2),weft=Math.sin(y*Math.PI/2),over=(Math.floor(x/2)+Math.floor(y/2))%2;
  const dx=warp*(over?.28:.16),dy=weft*(over?.16:.28);
  p.data[i]=128+dx*65;p.data[i+1]=128+dy*65;p.data[i+2]=253;p.data[i+3]=255;
  const v=232+(warp+weft)*3;r.data[i]=r.data[i+1]=r.data[i+2]=v;r.data[i+3]=255;
 }
 c.putImageData(p,0,0);const normal=new THREE.CanvasTexture(canvas);normal.wrapS=normal.wrapT=THREE.RepeatWrapping;normal.repeat.set(3,3);normal.anisotropy=8;
 const roughCanvas=document.createElement('canvas');roughCanvas.width=roughCanvas.height=n;roughCanvas.getContext('2d').putImageData(r,0,0);const rough=new THREE.CanvasTexture(roughCanvas);rough.wrapS=rough.wrapT=THREE.RepeatWrapping;rough.repeat.set(3,3);
 return new THREE.MeshPhysicalMaterial({name,color,normalMap:normal,normalScale:new THREE.Vector2(.32,.32),roughnessMap:rough,roughness:1,specularIntensity:.18,sheen:.7,sheenColor:new THREE.Color(color).lerp(new THREE.Color('#fff1df'),.35),sheenRoughness:.92});
}
