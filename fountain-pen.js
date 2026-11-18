import * as THREE from 'three/webgpu';

// Local Z runs from the writing tip to the end of the posted cap.
export function createFountainPen() {
  const pen = new THREE.Group();
  pen.name = 'Black lacquer fountain pen';
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: '#16181b', roughness: .23, clearcoat: 1, clearcoatRoughness: .14
  });
  const grip = new THREE.MeshStandardMaterial({color: '#202022', roughness: .37});
  const feed = new THREE.MeshStandardMaterial({color: '#131116', roughness: .70});
  const gold = new THREE.MeshStandardMaterial({color: '#dcb16d', metalness: .62, roughness: .27});
  const engraving = new THREE.MeshStandardMaterial({color: '#936b39', metalness: .31, roughness: .42});
  const tipping = new THREE.MeshStandardMaterial({color: '#d7cdbd', metalness: .68, roughness: .22});
  function mesh(name, geometry, material) {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.castShadow = part.receiveShadow = true;
    pen.add(part);
    return part;
  }
  function turned(name, profile, material) {
    const points = profile.map(([z, r]) => new THREE.Vector2(r, z));
    const part = mesh(name, new THREE.LatheGeometry(points, 48), material);
    part.rotation.x = Math.PI / 2;
  }
  function band(name, z, radius, width) {
    turned(name, [[z, radius-.0012],[z+.001, radius],[z+width-.001, radius],[z+width, radius-.0012]], gold);
  }
  function stroke(name, points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(name, new THREE.TubeGeometry(curve, 18, radius, 6, false), material);
  }
  turned('Lacquered barrel', [[-.177,.018],[-.161,.022],[-.123,.024],[.012,.025],[.121,.023],[.23,.016],[.235,0]], lacquer);
  turned('Turned grip', [[-.254,.013],[-.252,.019],[-.246,.020],[-.226,.017],[-.192,.0175],[-.172,.02],[-.164,.021]], grip);
  band('Section collar', -.171, .0215, .005);
  turned('Posted cap', [[.086,.025],[.088,.0294],[.094,.030],[.22,.030],[.278,.029],[.319,.0255],[.34,.020],[.352,.011],[.355,0]], lacquer);
  band('Broad cap band', .10, .0306, .010);
  band('Fine cap band', .114, .0305, .003);
  band('Finial ring', .306, .0276, .004);
  const clip = stroke('Arched gold pocket clip', [[.004,.026,.308],[.006,.036,.295],[.008,.039,.271],[.009,.035,.208],[.01,.031,.159],[.011,.031,.15]], .0038, gold);
  clip.scale.x = 1.25;
  const clipTip = mesh('Rounded clip shoe', new THREE.SphereGeometry(1,16,10), gold);
  clipTip.scale.set(.0063,.0038,.0085);
  clipTip.position.set(.013,.0305,.15);

  // The feed shows through the vent and the slit between two curved tines.
  const under = mesh('Ebonite ink feed',new THREE.SphereGeometry(1,24,12),feed);
  under.position.set(0,-.004,-.291);
  under.scale.set(.014,.012,.050);
  const nibGold = gold.clone();
  nibGold.side = THREE.DoubleSide;
  const outline = [[-.377,.0019],[-.366,.004],[-.348,.0095],[-.318,.018],[-.298,.0245],[-.285,.024],[-.263,.0185],[-.245,.013]];
  function widthAt(z) {
    const i = outline.findIndex(p => p[0] >= z);
    if (i <= 0) return outline[i === 0 ? 0 : outline.length-1][1];
    const [a,w] = outline[i-1], [b,v] = outline[i];
    return THREE.MathUtils.lerp(w,v,(z-a)/(b-a));
  }
  function nibHeight(z,x) {
    const t = (z+.377)/.132;
    return .001 + .014*Math.sin(t*Math.PI*.65) - .007*(x/widthAt(z))**2;
  }
  for (const side of [-1,1]) {
    const xyz=[], indices=[], rows=66, cols=8;
    for (let i=0;i<=rows;i++) {
      const z=-.377+.132*i/rows;
      const ellipse=(z+.300)/.0054;
      const vent=.0044*Math.sqrt(Math.max(0,1-ellipse*ellipse));
      const inside=Math.max(z<-.30 ? .00065 : 0,vent);
      for (let j=0;j<=cols;j++) {
        const x=side*THREE.MathUtils.lerp(inside,widthAt(z),j/cols);
        xyz.push(x,nibHeight(z,x),z);
        if (i<rows && j<cols) {
          const a=i*(cols+1)+j,b=a+1,c=a+cols+1,d=c+1;
          indices.push(...(side>0 ? [a,c,b,b,c,d] : [a,b,c,b,d,c]));
        }
      }
    }
    const nib = new THREE.BufferGeometry();
    nib.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
    nib.setIndex(indices); nib.computeVertexNormals();
    mesh('Curved gold nib tine',nib,nibGold);
    for(const inset of [.58,.77]) {
      const points=[-.337,-.323,-.306,-.295,-.285,-.273,-.264].map(z=>{
        const x=side*widthAt(z)*inset;
        return [x,nibHeight(z,x)+.0004,z];
      });
      stroke('Nib engraved border',points,.00048,engraving);
    }
    const tip=mesh('Polished tipping alloy',new THREE.SphereGeometry(.0018,12,8),tipping);
    tip.position.set(side*.0014,.0004,-.376);
  }
  return pen;
}
