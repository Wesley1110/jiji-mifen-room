import * as THREE from 'three/webgpu';
import {attribute, transformNormalToView} from 'three/tsl';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

// Short fibers follow the continuous mitten surface, without bead-like bumps.
function addFuzz(parent, geometry, count, length, skip = () => false) {
  const p = geometry.attributes.position, n = geometry.attributes.normal;
  const vertexCount = Math.min(p.count, geometry.drawRange.count);
  const triangles = [], cumulative = []; let total = 0, seed = 1537;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < vertexCount; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const area = b.sub(a).cross(c.sub(a)).length() / 2;
    if (area > 1e-12) { total += area; triangles.push(i); cumulative.push(total); }
  }
  const positions = [], normals = [], colors = [], base = new THREE.Color('#b68d68');
  const root = new THREE.Vector3(), normal = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3();
  for (let strand = 0; strand < count; strand++) {
    const area = random() * total; let lo = 0, hi = cumulative.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cumulative[mid] < area) lo = mid + 1; else hi = mid; }
    const i = triangles[lo], s = Math.sqrt(random()), t = random(), weights = [1 - s, s * (1 - t), s * t];
    root.set(0, 0, 0); normal.set(0, 0, 0);
    for (let k = 0; k < 3; k++) { root.addScaledVector(a.fromBufferAttribute(p, i + k), weights[k]); normal.addScaledVector(a.fromBufferAttribute(n, i + k), weights[k]); }
    if (skip(root)) continue;
    normal.normalize(); u.set(Math.abs(normal.y) < .9 ? 0 : 1, Math.abs(normal.y) < .9 ? 1 : 0, 0).cross(normal).normalize(); v.crossVectors(normal, u);
    const h = length * (.65 + random() * .7), width = .0005, lean = (random() - .5) * h * .6;
    const shade = .97 + random() * .06;
    for (const side of [u, v]) for (let segment = 0; segment < 2; segment++) {
      const point = (level, edge) => root.clone().addScaledVector(normal, h * level).addScaledVector(u, lean * level * level).addScaledVector(side, width * edge * (1 - .9 * level));
      const t0 = segment / 2, t1 = (segment + 1) / 2;
      for (const [level, edge] of [[t0,-1],[t0,1],[t1,1],[t0,-1],[t1,1],[t1,-1]]) {
        positions.push(...point(level, edge).toArray()); normals.push(...normal.toArray());
        colors.push(base.r * shade, base.g * shade, base.b * shade);
      }
    }
  }
  const furGeometry = new THREE.BufferGeometry();
  furGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  furGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  furGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  // Light both ribbon faces with the coat normal, avoiding dark/bright speckles.
  const furMaterial = new THREE.MeshStandardNodeMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
  furMaterial.normalNode = transformNormalToView(attribute('normal','vec3')).normalize();
  const fur = new THREE.Mesh(furGeometry,furMaterial);
  fur.name = 'short teddy fibers'; fur.userData.isHand = true; parent.add(fur);
}

export function createBearPaw() {
  const root = new THREE.Group(); root.name = 'Optional teddy bear paw';
  const coat = new THREE.MeshStandardMaterial({color: '#b48a64', roughness: 1});
  const pads = new THREE.MeshStandardMaterial({color: '#d4a08b', roughness: 1});
  const toes = [[-.132,.157,.064],[-.048,.207,.068],[.048,.207,.068],[.132,.157,.064]];
  const parts = [[0,-.015,0,.173,.18,.097],[0,-.192,.006,.112,.096,.078],...toes.map(([x,y,r])=>[x,y,0,r,r,.082])];
  const size = 72, extent = .36, surface = new MarchingCubes(size, coat, false, false, 18000);
  const blend = (a,b) => {const h=Math.max(.03-Math.abs(a-b),0)/.03;return Math.min(a,b)-h*h*.03*.25;};
  surface.isolation = 0;
  for (let z=0;z<size;z++) for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const px=(x/size*2-1)*extent, py=(y/size*2-1)*extent, pz=(z/size*2-1)*extent;
    let d=1;
    for (const [cx,cy,cz,rx,ry,rz] of parts) d=blend(d,(Math.hypot((px-cx)/rx,(py-cy)/ry,(pz-cz)/rz)-1)*Math.min(rx,ry,rz));
    surface.field[x+y*size+z*size*size]=-d;
  }
  surface.update(); surface.geometry.scale(extent, extent, extent);
  // Use an ordinary Mesh: MarchingCubes.count is not an instance count.
  const mitten = new THREE.Mesh(surface.geometry, coat); mitten.name='round four-toed teddy paw'; mitten.userData.isHand=true; root.add(mitten);
  addFuzz(root, surface.geometry, 16000, .005, p => p.z < -.035 && (
    (p.x/.115)**2+((p.y+.015)/.095)**2 < 1 || toes.some(([x,y]) => ((p.x-x)/.043)**2+((p.y-y)/.044)**2<1)
  ));
  // The soft heart and four toe beans are on the palm side, facing the toy on contact.
  const heart = new THREE.Shape(); heart.moveTo(0,-.075);
  heart.bezierCurveTo(-.035,-.05,-.105,-.012,-.1,.035);
  heart.bezierCurveTo(-.095,.085,-.03,.092,0,.05);
  heart.bezierCurveTo(.03,.092,.095,.085,.1,.035);
  heart.bezierCurveTo(.105,-.012,.035,-.05,0,-.075);
  const heartGeometry = new THREE.ExtrudeGeometry(heart,{depth:.009,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:24});
  const pad = new THREE.Mesh(heartGeometry,pads); pad.name='soft heart paw pad'; pad.rotation.y=Math.PI;pad.position.set(0,-.015,-.092);pad.userData.isHand=true;root.add(pad);
  const sphere = new THREE.SphereGeometry(1,24,16);
  for (const [x,y] of toes) {
    const bean=new THREE.Mesh(sphere,pads);bean.position.set(x,y,-.076);bean.scale.set(.035,.037,.014);bean.rotation.z=-x*2;bean.name='round toe bean';bean.userData.isHand=true;root.add(bean);
  }
  const armGeometry=new THREE.CylinderGeometry(.098,.15,1,28,6).toNonIndexed();
  const arm=new THREE.Mesh(armGeometry,coat);arm.name='soft teddy forearm';arm.userData.isHand=true;arm.visible=false;
  addFuzz(arm,armGeometry,12000,.004);
  root.visible=false;root.scale.setScalar(.78);
  return {root,arm};
}
