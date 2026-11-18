import * as THREE from 'three/webgpu';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

function inkTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createCampbellHardcover() {
  const book = new THREE.Group();
  book.name = 'Financial Decisions and Markets | John Y. Campbell';
  const width = .55, depth = width * 959 / 674, thickness = .146, board = .012;
  const cloth = new THREE.MeshStandardMaterial({color: '#bb2f32', roughness: .78});
  const stock = new THREE.MeshStandardMaterial({color: '#f4e8cc', roughness: .95});
  const pageGrain = inkTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f2e5cb';
    ctx.fillRect(0, 0, w, h);
    for (let y = 2; y < h; y += 3) {
      ctx.fillStyle = y % 5 === 0 ? '#cdbda2' : '#e0d1b9';
      ctx.fillRect(0, y, w, 1);
    }
  });
  const edges = new THREE.MeshStandardMaterial({map: pageGrain, roughness: .96});
  function add(name, geo, mat, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    book.add(mesh);
    return mesh;
  }
  for (const y of [board / 2, thickness - board / 2]) {
    add('Cloth-covered board', new RoundedBoxGeometry(width, board, depth, 3, .004), cloth, 0, y, 0);
  }
  add('Cream page edges', new RoundedBoxGeometry(width - .028, thickness - 2 * board, depth - .021, 3, .003),
    [edges, edges, stock, stock, edges, edges], .003, thickness / 2, 0);
  add('Rounded red spine', new RoundedBoxGeometry(.031, thickness, depth, 4, .014),
    cloth, -width / 2 + .009, thickness / 2, 0);
  const cover = new THREE.TextureLoader().load(new URL('./assets/campbell-financial-decisions-cover.png', import.meta.url).href);
  cover.colorSpace = THREE.SRGBColorSpace;
  cover.anisotropy = 8;
  const print = new THREE.MeshStandardMaterial({map: cover, roughness: .76});
  const face = add('Original Campbell cover', new THREE.PlaneGeometry(width - .008, depth - .008),
    print, 0, thickness + .0006, 0);
  face.rotation.x = -Math.PI / 2;
  const lettering = inkTexture(960, 152, (ctx, w, h) => {
    ctx.fillStyle = '#bf3032'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#211c1c'; ctx.textAlign = 'center';
    ctx.font = 'bold 46px Georgia'; ctx.fillText('FINANCIAL DECISIONS AND MARKETS', w / 2, 70, w - 48);
    ctx.fillStyle = '#fff2df'; ctx.font = '28px Georgia'; ctx.fillText('John Y. Campbell', w / 2, 118);
  });
  const spine = add('Printed spine lettering', new THREE.PlaneGeometry(depth - .016, thickness - .03),
    new THREE.MeshStandardMaterial({map: lettering, roughness: .81}), -width / 2 - .007, thickness / 2, 0);
  spine.rotation.y = -Math.PI / 2;
  return book;
}
