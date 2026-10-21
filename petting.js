import * as THREE from 'three/webgpu';
import {createBearPaw} from './bear-paw.js';
import {PAT_DURATION, sampleDoublePat} from './paw-motion.js';

const REACH = 2.4;
const visible = object => { for (let p = object; p; p = p.parent) if (!p.visible) return false; return true; };
function sourceName(object) { for (let p = object; p; p = p.parent) if (p.userData.sourceName) return p.userData.sourceName; return ''; }

export function createPetting({scene, root, plush, camera, canvas, getMode, setMode, onInteract}) {
  const $ = id => document.getElementById(id);
  const hand = createBearPaw(); scene.add(hand.root,hand.arm);
  const ray = new THREE.Raycaster(), surfaceRay = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const normalMatrix = new THREE.Matrix3(), basis = new THREE.Matrix4();
  const aim = new THREE.Vector2(innerWidth / 2, innerHeight / 2), up = new THREE.Vector3(0, 1, 0);
  const idle = new THREE.Vector3(), desired = new THREE.Vector3(), idleQ = new THREE.Quaternion(), desiredQ = new THREE.Quaternion();
  const roll = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1, 2.85, -.22));
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
  let enabled = false, animation = null, ownedPointer = null, lastHover = -Infinity;
  const pending = []; let patCount = 0, sequenceCount = 0, completedSequences = 0;
  let lastHit = null, contacts = 0, lastOwner = null, contactNow = false;
  function restPosition(out) { return out.set(Math.min(.48,camera.aspect*.35),camera.aspect<.8?-.12:-.27,-1.1).applyQuaternion(camera.quaternion).add(camera.position); }

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
    if (animation) return (lastOwner === 'Jiji' ? '雞雞' : '米粉') + '，輕拍兩下';
    if (hit && !hit.reachable) return '再靠近一點，才摸得到喔';
    if (hit) return '點一下，輕拍' + (hit.owner === 'Jiji' ? '雞雞' : '米粉') + '兩下';
    return '點玩偶一次，熊掌輕拍兩下 · 右鍵拖曳轉向';
  }
  function setEnabled(value) {
    enabled = !!value; animation = null; pending.length = 0; contactNow = false; plush.userData.touch.release();
    document.body.dataset.hand = enabled ? 'on' : 'off';
    if (enabled && getMode() !== 'fly') setMode('fly');
    $('handToggle').setAttribute('aria-pressed', String(enabled)); $('handToggle').classList.toggle('selected', enabled);
    $('handToggle').textContent = enabled ? '收起熊掌' : '伸出熊掌';
    $('petControls').hidden = !enabled; $('petHint').hidden = !enabled; $('petReticle').hidden = !enabled;
    hand.root.visible = enabled && getMode() === 'fly';hand.arm.visible=hand.root.visible;
    if (enabled) { restPosition(idle); hand.root.position.copy(idle); hand.root.quaternion.copy(camera.quaternion).multiply(roll); }
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
    if (animation) { pending.push(hit); onInteract(); return true; }
    tangent.copy(up).addScaledVector(hit.normal, -up.dot(hit.normal));
    if (tangent.lengthSq() < .01) tangent.set(1, 0, 0).addScaledVector(hit.normal, -hit.normal.x);
    tangent.normalize();
    animation = {hit, start: performance.now(), tangent: tangent.clone(), beats: new Set()};
    sequenceCount++;
    lastOwner = hit.owner; onInteract(); return true;
  }
  function stop() { animation = null; pending.length = 0; contactNow = false; ownedPointer = null; plush.userData.touch.release(); }
  function update(time, dt) {
    contactNow = false;
    if (!enabled || getMode() !== 'fly') { hand.root.visible = false; hand.arm.visible=false; plush.userData.touch.update(dt, time / 1000); return; }
    hand.root.visible = true;
    restPosition(idle);
    idleQ.copy(camera.quaternion).multiply(roll); desired.copy(idle); desiredQ.copy(idleQ);
    if (animation) {
      const a = animation, seconds = (time - a.start) / 1000;
      if (seconds > PAT_DURATION) { completedSequences++; animation = null; const next = pending.shift(); if (next) start(next); }
      else if (camera.position.distanceTo(a.hit.point) > REACH + .12) { animation = null; pending.length = 0; }
      else {
        const probe = a.hit.point.clone();
        surfaceRay.set(probe.clone().addScaledVector(a.hit.normal, .3), a.hit.normal.clone().negate()); surfaceRay.far = .7;
        const surface = surfaceRay.intersectObject(a.hit.object, false)[0];
        if (!surface) animation = null;
        else {
          normalMatrix.getNormalMatrix(surface.object.matrixWorld);
          normal.copy(surface.normal || surface.face.normal).applyMatrix3(normalMatrix).normalize();
          if (normal.dot(a.hit.normal) < 0) normal.negate();
          const {pressure, beat, touching, envelope, lift} = sampleDoublePat(seconds);
          desired.copy(surface.point).addScaledVector(normal, .103 + lift - .018 * pressure);
          right.set(1, 0, 0).applyQuaternion(camera.quaternion).addScaledVector(normal, -right.dot(normal)).normalize();
          vertical.crossVectors(normal, right).normalize(); basis.makeBasis(right, vertical, normal); desiredQ.setFromRotationMatrix(basis);
          desired.lerpVectors(idle, desired, envelope); desiredQ.slerp(idleQ, 1 - envelope);
          // No contact is applied until the visible palm actually arrives at the surface.
          const palmArrived = hand.root.position.distanceTo(desired) < .075;
          if (touching && palmArrived) {
            const direction = a.tangent.clone().negate();
            plush.userData.touch.press(a.hit.owner, surface.point.toArray(), normal.toArray(), direction.toArray(), .98 * pressure, time / 1000, .24);
            contactNow = true; contacts++;
            if (!a.beats.has(beat)) { a.beats.add(beat); patCount++; }
          }
        }
      }
    }
    const following = 1 - Math.exp(-30 * dt); hand.root.position.lerp(desired, following); hand.root.quaternion.slerp(desiredQ, following);
    hand.root.updateMatrixWorld(true);
    const wrist=new THREE.Vector3(0,-.235,.006).applyMatrix4(hand.root.matrixWorld);
    const elbow=new THREE.Vector3(Math.min(.5,camera.aspect*.43),-.8,-.35).applyQuaternion(camera.quaternion).add(camera.position);
    const armDirection=wrist.clone().sub(elbow);hand.arm.visible=true;hand.arm.position.copy(wrist).add(elbow).multiplyScalar(.5);hand.arm.scale.set(1,armDirection.length(),1);hand.arm.quaternion.setFromUnitVectors(up,armDirection.normalize());
    plush.userData.touch.update(dt, time / 1000);
    if (time - lastHover > 90) {
      lastHover = time; lastHit = aimedHit();
      $('petHint').textContent = message(lastHit); $('petReticle').classList.toggle('can-pet', !!lastHit?.reachable);
      const locked = document.pointerLockElement === canvas;
      $('petReticle').style.left = (locked ? innerWidth / 2 : aim.x) + 'px'; $('petReticle').style.top = (locked ? innerHeight / 2 : aim.y) + 'px';
    }
  }
  $('handToggle').disabled = false; $('handToggle').onclick = () => { setEnabled(!enabled); canvas.focus({preventScroll: true}); };
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
  return {update, setEnabled, near, pick, hand: hand.root, arm:hand.arm,
    get enabled() { return enabled; },
    get status() { return {enabled, action: 'pat', pawStyle: 'teddy', patsPerClick: 2, patCount, sequenceCount, completedSequences, queued: pending.length, animating: !!animation, contact: contactNow, lastOwner, contactCount: contacts, reach: REACH, field: plush.userData.touch.status}; }};
}
