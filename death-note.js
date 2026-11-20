import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const WIDTH = .444;
const LENGTH = .618;
const BOARD = .005;
const PAPER = .032;

// A flexible wrapper with a pressed joint and rubbed, round fore-edge corners.
// UVs are based on the finished surface, so the title bends with the cover.
function coverGeometry() {
  const geometry = new THREE.BoxGeometry(WIDTH, BOARD, LENGTH, 56, 1, 48);
  const {position, normal, uv} = geometry.attributes;
  const corner = .014;
  for (let i=0; i<position.count; i++) {
    let x=position.getX(i), z=position.getZ(i);
    const cx=THREE.MathUtils.clamp(x, -WIDTH/2+corner, WIDTH/2-corner);
    const cz=THREE.MathUtils.clamp(z, -LENGTH/2+corner, LENGTH/2-corner);
    const radius=Math.hypot(x-cx,z-cz);
    if (radius>corner) {
      x=cx+(x-cx)*corner/radius;
      z=cz+(z-cz)*corner/radius;
    }
    const u=x/WIDTH+.5, v=.5-z/LENGTH;
    const groove=-.0025*Math.exp(-(((u-.058)/.016)**2));
    const curl=.0022*(u**6)*(1-v)**4;
    position.setXYZ(i,x,position.getY(i)+groove+curl,z);
    if (normal.getY(i)>.9) uv.setXY(i,u,v);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function pageEdgeTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=256; canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e3d9c7'; ctx.fillRect(0,0,256,160);
  for (let y=1; y<160; y+=3) {
    ctx.fillStyle=y%13<3?'#b7aa98':'#f2eadb';
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.quadraticCurveTo(108,y+.8*Math.sin(y*.71),256,y+.45);
    ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=.8; ctx.stroke();
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=8;
  return map;
}

export function createDeathNote() {
  const book=new THREE.Group();
  book.name='Death Note | black notebook';
  const binding=new THREE.TextureLoader().load(new URL('./assets/death-note-binding.webp',import.meta.url).href);
  binding.colorSpace=THREE.SRGBColorSpace;
  binding.anisotropy=8;
  const front=new THREE.MeshPhysicalMaterial({
    name:'Death Note | rubbed charcoal cover and silver-white ink', map:binding,
    roughness:.79, specularIntensity:.20, sheen:.12, sheenRoughness:.88,
    sheenColor:'#6a6867', bumpMap:binding, bumpScale:.00014
  });
  const black=new THREE.MeshStandardMaterial({color:'#201f22',roughness:.82});
  const paper=new THREE.MeshStandardMaterial({color:'#e9dfcc',roughness:.98});
  const deckle=new THREE.MeshStandardMaterial({map:pageEdgeTexture(),roughness:.98});
  function add(name,geometry,material,x,y,z) {
    const part=new THREE.Mesh(geometry,material);
    part.name='Death Note | '+name;
    part.position.set(x,y,z);
    part.castShadow=part.receiveShadow=true;
    book.add(part);
  }
  add('back cover',new RoundedBoxGeometry(WIDTH,BOARD,LENGTH,3,.002),black,0,BOARD/2,0);
  add('ivory leaves',new RoundedBoxGeometry(WIDTH-.014,PAPER,LENGTH-.014,4,.004),
    [deckle,deckle,paper,paper,deckle,deckle],.002,BOARD+PAPER/2,0);
  add('silk black cover',coverGeometry(),[black,black,front,black,black,black],
    0,BOARD+PAPER+BOARD/2,0);
  add('rounded bound spine',new RoundedBoxGeometry(.021,2*BOARD+PAPER,LENGTH-.001,4,.009),
    black,-WIDTH/2+.007,BOARD+PAPER/2,0);
  return book;
}
