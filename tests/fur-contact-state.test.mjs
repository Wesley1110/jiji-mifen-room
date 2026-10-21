import assert from 'node:assert/strict';
import {createFurContactState} from '../fur-contact-state.js';

const checks = [];
for (const hz of [20, 30, 60, 120]) {
  const field = createFurContactState(), dt = 1 / hz;
  for (let t = 0; t < .6; t += dt) {
    field.press('Jiji', [0, 1, 0], [0, 0, 1], [0, -1, 0], .86, t);
    field.update(dt, t);
  }
  assert.ok(field.owners.Jiji.some(s => s.pressure > .7), `${hz} Hz press`);
  assert.ok(field.owners.Mifen.every(s => s.pressure === 0), 'other toy must not deform');
  field.release();
  for (let t = .6; t < 3.6; t += dt) field.update(dt, t);
  assert.ok(field.owners.Jiji.every(s => s.pressure < .001 && Number.isFinite(s.velocity)), `${hz} Hz recovery`);
  checks.push(`press/recover/isolate at ${hz} Hz`);
}

const trail = createFurContactState();
for (let i = 0; i < 100; i++) {
  const t = i / 60;
  trail.press('Mifen', [i * .01, 0, 0], [0, 0, 1], [1, 0, 0], .8, t);
  trail.update(1 / 60, t);
}
assert.ok(new Set(trail.owners.Mifen.map(s => s.point[0])).size > 1);
assert.ok(trail.owners.Mifen.some(s => s.point[0] > .8), 'contact follows a long stroke');
assert.equal(trail.press('Jiji', [NaN, 0, 0], [0, 0, 1], [1, 0, 0], 1, 2), false);
checks.push('spatial trail follows hand; invalid input rejected');
console.log(JSON.stringify({passed: checks.length, checks}, null, 2));
