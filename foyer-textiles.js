import * as THREE from 'three/webgpu';


function surface(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d');
}

function texture(canvas) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

// The paired warp/weft and two diagonal bands leave the small octagonal
// openings characteristic of chair cane. The tile repeats across both doors.
export function caneMaterial() {
  const ctx = surface(128);
  ctx.fillStyle = '#755338';
  ctx.fillRect(0, 0, 128, 128);
  function splint(x, y, angle, width, shade) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#805c3e';
    ctx.fillRect(-204, -width / 2 + 2, 408, width + 1);
    const g = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
    g.addColorStop(0, '#aa8058'); g.addColorStop(.30, shade);
    g.addColorStop(.58, '#e2c398'); g.addColorStop(1, '#b58d64');
    ctx.fillStyle = g;
    ctx.fillRect(-204, -width / 2, 408, width);
    ctx.restore();
  }
  for (let n = -2; n <= 2; n++) splint(64 + n * 128, 64, Math.PI / 4, 13, '#d1aa79');
  for (const x of [13, 35, 77, 99]) splint(x, 64, Math.PI / 2, 12, '#d9b789');
  for (let n = -2; n <= 2; n++) splint(64 + n * 128, 64, -Math.PI / 4, 13, '#ddbc8d');
  for (const y of [13, 35, 77, 99]) splint(64, y, 0, 12, '#d6b185');
  // Restore the over-pass on alternating crossings.
  for (const [x,y] of [[13,13],[35,35],[13,77],[35,99],[77,35],[99,13],[77,99],[99,77]]) {
    ctx.save(); ctx.beginPath(); ctx.rect(x-8,y-8,16,16); ctx.clip();
    splint(x,y,Math.PI / 2,12,'#d9b789'); ctx.restore();
  }
  const map = texture(ctx.canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(7.5, 8);
  return new THREE.MeshStandardMaterial({name:'Foyer | honey cane webbing', map,
    bumpMap:map, bumpScale:.0026, roughness:.84});
}

// One repeat of a broken 2/2 twill. The warp comes to the surface for two
// crossings, then dips under the weft. Reversing the twill produces a V.
// Colour follows the yarn that is actually uppermost. Normals come from
// the crossing heights, independently of whether that wool was dyed darker.
export function runnerMaterial(width,length) {
  const n=256,count=16,pitch=n/count;
  const height=new Float32Array(n*n);
  const colorCtx=surface(n),normalCtx=surface(n);
  const albedo=colorCtx.createImageData(n,n),normal=normalCtx.createImageData(n,n);
  const tau=Math.PI*2;
  for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
    const u=x/pitch+.07*Math.sin(tau*y/n*3);
    const v=y/pitch+.06*Math.cos(tau*x/n*2);
    const col=Math.floor(u),row=Math.floor(v),end=((col%16)+16)%16;
    const phase=end<8?end:15-end;
    const warpCenter=Math.sin(Math.PI*(u-col)),weftCenter=Math.sin(Math.PI*(v-row));
    const lift=.5+.5*Math.cos((v-phase-.5)*Math.PI/2);
    const cross=.5-.5*Math.cos((row-phase-.5)*Math.PI/2);
    const warp=warpCenter*(.42+.57*lift),weft=weftCenter*(.40+.56*cross);
    const w=THREE.MathUtils.smoothstep(warp-weft,-.09,.09);
    const fleck=Math.sin(tau*(x*17+y*5)/n)*Math.cos(tau*(x*7-y*13)/n);
    const twist=w*Math.sin(tau*(3*u+.40*v))+(1-w)*Math.sin(tau*(3*v-.40*u));
    const h=Math.max(warp,weft);
    const shade=.77+.21*h+.024*twist+.019*fleck+.018*Math.cos(tau*(col+row)/8);
    const k=y*n+x; height[k]=h+.032*twist+.017*fleck;
    albedo.data.set([(182+26*w)*shade,(153+30*w)*shade,(125+31*w)*shade,255],4*k);
  }
  const sample=(x,y)=>height[((y+n)%n)*n+(x+n)%n];
  for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
    const dx=2.8*(sample(x-1,y)-sample(x+1,y));
    const dy=2.8*(sample(x,y+1)-sample(x,y-1));
    const mag=1/Math.hypot(dx,dy,1);
    normal.data.set([128+127*dx*mag,128+127*dy*mag,128+127*mag,255],4*(y*n+x));
  }
  colorCtx.putImageData(albedo,0,0);normalCtx.putImageData(normal,0,0);
  const map=texture(colorCtx.canvas),normalMap=new THREE.CanvasTexture(normalCtx.canvas);
  for(const t of [map,normalMap]){
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(width/.126,length/.126);t.anisotropy=8;
  }
  return new THREE.MeshPhysicalMaterial({name:'Foyer | oatmeal wool broken twill',map,normalMap,
    normalScale:new THREE.Vector2(.74,.74),roughness:.96,sheen:.20,sheenRoughness:.95,
    sheenColor:new THREE.Color('#b7997e'),specularIntensity:.17});
}
