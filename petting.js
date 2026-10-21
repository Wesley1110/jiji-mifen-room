import * as THREE from 'three/webgpu';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

const REACH = 2.4;
const smooth = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const visible = object => { for (let p = object; p; p = p.parent) if (!p.visible) return false; return true; };
function sourceName(object) { for (let p = object; p; p = p.parent) if (p.userData.sourceName) return p.userData.sourceName; return ''; }

function createHand() {
  const root = new THREE.Group(); root.name = 'Optional first-person hand';
  const skin = new THREE.MeshStandardMaterial({color: '#efbc9d', roughness: .88});
  const cuff = new THREE.MeshStandardMaterial({color: '#c5b7a2', roughness: 1});
  const sleeve = new THREE.MeshStandardMaterial({color: '#e6d7bd', roughness: 1});
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  function oval(name, position, scale, material) {
    const mesh = new THREE.Mesh(sphere, material); mesh.name = name;
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.userData.isHand = true;
    mesh.castShadow = false; mesh.receiveShadow = false; root.add(mesh); return mesh;
  }
  // Blend the palm, wrist and fingers into one continuous soft surface.
  const parts = [
    [0,0,0,.132,.143,.059,0], [0,-.17,.01,.078,.11,.047,0],
    [-.096,.16,-.012,.036,.091,.037,0], [-.032,.182,-.012,.037,.119,.038,0],
    [.032,.178,-.012,.037,.111,.038,0], [.096,.15,-.012,.036,.084,.037,0],
    [-.145,-.01,-.008,.043,.099,.043,-.58]
  ];
  const resolution = 72, extent = .36, surface = new MarchingCubes(resolution, skin, false, false, 18000);
  surface.isolation = 0;
  const blend = (a,b) => {const h=Math.max(.023-Math.abs(a-b),0)/.023;return Math.min(a,b)-h*h*.023*.25;};
  for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
    const px=(x/resolution*2-1)*extent,py=(y/resolution*2-1)*extent,pz=(z/resolution*2-1)*extent;
    let distance=1;
    for(const [cx,cy,cz,rx,ry,rz,angle] of parts){
      const dx=px-cx,dy=py-cy,c=Math.cos(angle),s=Math.sin(angle);
      const d=(Math.hypot((c*dx+s*dy)/rx,(-s*dx+c*dy)/ry,(pz-cz)/rz)-1)*Math.min(rx,ry,rz);
      distance=blend(distance,d);
    }
    surface.field[x+y*resolution+z*resolution*resolution]=-distance;
  }
  surface.update();
  // MarchingCubes.count is a vertex count; WebGPU Mesh.count means instances.
  // Render its completed geometry with an ordinary Mesh (one instance).
  const skinMesh=new THREE.Mesh(surface.geometry,skin);skinMesh.scale.setScalar(extent);skinMesh.name='smooth cartoon hand';skinMesh.userData.isHand=true;skinMesh.frustumCulled=false;root.add(skinMesh);
  const fingers=[];
  oval('knitted cuff', [0, -.25, .018], [.111, .067, .072], cuff);
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.079,.117,1,24),sleeve);arm.name='first-person sleeve';arm.userData.isHand=true;arm.visible=false;
  root.visible = false;root.scale.setScalar(.82);
  return {root, fingers, arm};
}

export function createPetting({scene, root, plush, camera, canvas, getMode, setMode, onInteract}) {
  const $ = id => document.getElementById(id);
  const hand = createHand(); scene.add(hand.root,hand.arm);
  const ray = new THREE.Raycaster(), surfaceRay = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const normalMatrix = new THREE.Matrix3(), basis = new THREE.Matrix4();
  const aim = new THREE.Vector2(innerWidth / 2, innerHeight / 2), up = new THREE.Vector3(0, 1, 0);
  const idle = new THREE.Vector3(), desired = new THREE.Vector3(), idleQ = new THREE.Quaternion(), desiredQ = new THREE.Quaternion();
  const roll = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1, -.2, -.22));
  const right = new THREE.Vector3(), vertical = new THREE.Vector3(), normal = new THREE.Vector3(), tangent = new THREE.Vector3();
  const blockerMeshes = [], heads = {};
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!o.isMesh || o.userData.fiberCount || o.userData.isHand || o.userData.doorPick) return;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    if (materials.every(m => !m.visible || m.transparent && m.opacity < .3)) return;
    blockerMeshes.push(o);
  });
  root.traverse(o => { const name = o.userData.sourceName || ''; if (/^(Jiji|Mifen) \|.*head/i.test(name)) heads[name.split(' |')[0]] = o; });
  let enabled = false, action = 'stroke', animation = null, ownedPointer = null, lastHover = -Infinity;
  let lastHit = null, contacts = 0, lastOwner = null, contactNow = false;
  const stats = {maxReach: REACH, contactCount: 0};
  function restPosition(out) { return out.set(Math.min(.42,camera.aspect*.35),-.38,-.95).applyQuaternion(camera.quaternion).add(camera.position); }

  function pick(x, y) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld(true); scene.updateMatrixWorld(true); ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(blockerMeshes.filter(visible), false)[0];
    if (!hit) return null;
    const name = sourceName(hit.object), owner = name.split(' |')[0];
    if (!['Jiji', 'Mifen'].includes(owner) || /eye|glint|nose|mouth|beak|orange foot/i.test(name)) return null;
    normalMatrix.getNormalMatrix(hit.object.matrixWorld);
    const n = (hit.normal || hit.face.normal).clone().applyMatrix3(normalMatrix).normalize();
    if (n.dot(ray.ray.direction) > 0) n.negate();
    return {...hit, owner, normal: n, reachable: hit.distance <= REACH};
  }
  function aimedHit() {
    const locked = document.pointerLockElement === canvas;
    return pick(locked ? innerWidth / 2 : aim.x, locked ? innerHeight / 2 : aim.y);
  }
  function message(hit) {
    if (animation) return (lastOwner === 'Jiji' ? '雞雞' : '米粉') + (action === 'pat' ? '，輕輕拍拍' : '，慢慢摸摸');
    if (hit && !hit.reachable) return '再靠近一點，才摸得到喔';
    if (hit) return '點一下' + (action === 'pat' ? '輕拍' : '摸摸') + (hit.owner === 'Jiji' ? '雞雞' : '米粉');
    return '點頭頂、臉頰或身體摸摸 · 右鍵拖曳轉向';
  }
  function setEnabled(value) {
    enabled = !!value; animation = null; contactNow = false; plush.userData.touch.release();
    document.body.dataset.hand = enabled ? 'on' : 'off';
    if (enabled && getMode() !== 'fly') setMode('fly');
    $('handToggle').setAttribute('aria-pressed', String(enabled)); $('handToggle').classList.toggle('selected', enabled);
    $('handToggle').textContent = enabled ? '收起手' : '伸出手';
    $('petControls').hidden = !enabled; $('petHint').hidden = !enabled; $('petReticle').hidden = !enabled;
    hand.root.visible = enabled && getMode() === 'fly';hand.arm.visible=hand.root.visible;
    if (enabled) { restPosition(idle); hand.root.position.copy(idle); hand.root.quaternion.copy(camera.quaternion).multiply(roll); }
    onInteract();
  }
  function choose(next) {
    action = next; animation = null; contactNow = false;
    document.querySelectorAll('[data-pet-action]').forEach(b => { const selected = b.dataset.petAction === action; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    onInteract();
  }
  function near(owner) {
    const head = heads[owner]; if (!head) return;
    setEnabled(true); setMode('fly'); scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(head), center = box.getCenter(new THREE.Vector3());
    camera.position.set(center.x, center.y + .25, box.max.z + 1.95);
    camera.lookAt(center.x, center.y + .18, center.z); camera.updateMatrixWorld(true);
    restPosition(hand.root.position);
    hand.root.quaternion.copy(camera.quaternion).multiply(roll);
    aim.set(innerWidth / 2, innerHeight / 2); lastHover = -Infinity; onInteract(); canvas.focus({preventScroll: true});
  }
  function start(hit) {
    if (!enabled || getMode() !== 'fly' || !hit?.reachable) return false;
    tangent.copy(up).addScaledVector(hit.normal, -up.dot(hit.normal));
    if (tangent.lengthSq() < .01) tangent.set(1, 0, 0).addScaledVector(hit.normal, -hit.normal.x);
    tangent.normalize();
    animation = {hit, start: performance.now(), action, tangent: tangent.clone(), contactFrames: 0};
    lastOwner = hit.owner; onInteract(); return true;
  }
  function stop() { animation = null; contactNow = false; ownedPointer = null; plush.userData.touch.release(); }
  function update(time, dt) {
    contactNow = false;
    if (!enabled || getMode() !== 'fly') { hand.root.visible = false; hand.arm.visible=false; plush.userData.touch.update(dt, time / 1000); return; }
    hand.root.visible = true;
    restPosition(idle);
    idleQ.copy(camera.quaternion).multiply(roll); desired.copy(idle); desiredQ.copy(idleQ);
    if (animation) {
      const a = animation, seconds = (time - a.start) / 1000, duration = a.action === 'pat' ? 1.05 : 1.55;
      if (seconds > duration || camera.position.distanceTo(a.hit.point) > REACH + .12) animation = null;
      else {
        // A short stroke follows the curved mesh; its first and last phases reach/retract.
        const travel = a.action === 'stroke' ? -.29 * smooth((seconds - .27) / .85) : 0;
        const probe = a.hit.point.clone().addScaledVector(a.tangent, travel);
        surfaceRay.set(probe.clone().addScaledVector(a.hit.normal, .3), a.hit.normal.clone().negate()); surfaceRay.far = .7;
        const surface = surfaceRay.intersectObject(a.hit.object, false)[0];
        if (!surface) animation = null;
        else {
          normalMatrix.getNormalMatrix(surface.object.matrixWorld);
          normal.copy(surface.normal || surface.face.normal).applyMatrix3(normalMatrix).normalize();
          if (normal.dot(a.hit.normal) < 0) normal.negate();
          const envelope = smooth(seconds / .27) * (1 - smooth((seconds - duration + .3) / .3));
          const pat = a.action === 'pat' ? Math.pow(Math.max(0, Math.sin((seconds - .28) / .42 * Math.PI)), 2) : 1;
          const touching = seconds >= .28 && seconds <= duration - .3 && (a.action !== 'pat' || pat > .55);
          const lift = a.action === 'pat' ? .13 * (1 - pat) : 0;
          desired.copy(surface.point).addScaledVector(normal, .086 + lift - .023 * pat);
          right.set(1, 0, 0).applyQuaternion(camera.quaternion).addScaledVector(normal, -right.dot(normal)).normalize();
          vertical.crossVectors(normal, right).normalize(); basis.makeBasis(right, vertical, normal); desiredQ.setFromRotationMatrix(basis);
          desired.lerpVectors(idle, desired, envelope); desiredQ.slerpQuaternions(idleQ, desiredQ, envelope);
          // No contact is applied until the visible palm actually arrives at the surface.
          const palmArrived = hand.root.position.distanceTo(desired) < .075;
          if (touching && palmArrived) {
            const direction = a.tangent.clone().negate();
            plush.userData.touch.press(a.hit.owner, surface.point.toArray(), normal.toArray(), direction.toArray(), a.action === 'pat' ? .98 * pat : .86, time / 1000, a.action === 'pat' ? .23 : .24);
            contactNow = true; a.contactFrames++; contacts++; stats.contactCount = contacts;
          }
        }
      }
    }
    const following = 1 - Math.exp(-30 * dt); hand.root.position.lerp(desired, following); hand.root.quaternion.slerp(desiredQ, following);
    hand.root.updateMatrixWorld(true);
    const wrist=new THREE.Vector3(0,-.27,.02).applyMatrix4(hand.root.matrixWorld);
    const elbow=new THREE.Vector3(Math.min(.5,camera.aspect*.43),-.8,-.35).applyQuaternion(camera.quaternion).add(camera.position);
    const armDirection=wrist.clone().sub(elbow);hand.arm.visible=true;hand.arm.position.copy(wrist).add(elbow).multiplyScalar(.5);hand.arm.scale.set(1,armDirection.length(),1);hand.arm.quaternion.setFromUnitVectors(up,armDirection.normalize());
    hand.fingers.forEach((finger, i) => finger.rotation.x = (contactNow ? -.12 : .06) * (1 + i * .1));
    plush.userData.touch.update(dt, time / 1000);
    if (time - lastHover > 90) {
      lastHover = time; lastHit = aimedHit();
      $('petHint').textContent = message(lastHit); $('petReticle').classList.toggle('can-pet', !!lastHit?.reachable);
      const locked = document.pointerLockElement === canvas;
      $('petReticle').style.left = (locked ? innerWidth / 2 : aim.x) + 'px'; $('petReticle').style.top = (locked ? innerHeight / 2 : aim.y) + 'px';
    }
  }
  $('handToggle').disabled = false; $('handToggle').onclick = () => { setEnabled(!enabled); canvas.focus({preventScroll: true}); };
  document.querySelectorAll('[data-pet-action]').forEach(b => b.onclick = () => { choose(b.dataset.petAction); canvas.focus({preventScroll: true}); });
  document.querySelectorAll('[data-pet-near]').forEach(b => b.onclick = () => near(b.dataset.petNear));
  canvas.addEventListener('pointerdown', event => {
    if (!enabled || getMode() !== 'fly' || event.button !== 0) return;
    aim.set(event.clientX, event.clientY); const hit = aimedHit();
    if (!start(hit)) return;
    ownedPointer = event.pointerId; canvas.setPointerCapture(event.pointerId); canvas.focus({preventScroll: true});
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') aim.set(event.clientX, event.clientY);
    if (ownedPointer === event.pointerId) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  canvas.addEventListener('pointerup', event => {
    if (ownedPointer !== event.pointerId) return;
    ownedPointer = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  canvas.addEventListener('pointercancel', stop);
  addEventListener('blur', stop); document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  addEventListener('keydown', e => {
    if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    e.preventDefault(); setEnabled(!enabled); canvas.focus({preventScroll: true});
  });
  setEnabled(false);
  return {update, setEnabled, near, choose, pick, hand: hand.root, arm:hand.arm,
    get enabled() { return enabled; },
    get status() { return {enabled, action, animating: !!animation, contact: contactNow, lastOwner, contactCount: contacts, reach: REACH, field: plush.userData.touch.status}; }};
}
