// Small, local spring contacts; the original fiber roots are never edited.
export function createFurContactState(slotCount = 4) {
  const owners = Object.fromEntries(['Jiji', 'Mifen'].map(name => [name,
    Array.from({length: slotCount}, () => ({point: [0, 0, 0], normal: [0, 0, 1], direction: [0, -1, 0], radius: .22, pressure: 0, velocity: 0, target: 0, touchedAt: -Infinity}))]));
  function press(owner, point, normal, direction, strength, time, radius = .22) {
    const slots = owners[owner];
    if (!slots || ![...point, ...normal, ...direction, strength, time, radius].every(Number.isFinite)) return false;
    let slot = slots.find(s => time - s.touchedAt < .18 && Math.hypot(...point.map((p, i) => p - s.point[i])) < .095);
    const reuse = !!slot;
    slot ??= slots.reduce((a, b) => a.touchedAt < b.touchedAt ? a : b);
    if (!reuse) { slot.pressure = 0; slot.velocity = 0; slot.point = [...point]; }
    slot.normal = [...normal]; slot.direction = [...direction];
    slot.radius = Math.max(.05, Math.min(.4, radius)); slot.target = Math.max(0, Math.min(1, strength)); slot.touchedAt = time;
    return true;
  }
  function update(dt, time) {
    dt = Math.max(0, Math.min(.1, dt));
    for (const slots of Object.values(owners)) for (const s of slots) {
      const held = time - s.touchedAt < .055, target = held ? s.target : 0, omega = held ? 22 : 5.5;
      // Exact critically damped response remains stable at low frame rates.
      const error = s.pressure - target, impulse = s.velocity + omega * error, decay = Math.exp(-omega * dt);
      s.pressure = Math.max(0, Math.min(1, target + (error + impulse * dt) * decay));
      s.velocity = (s.velocity - omega * impulse * dt) * decay;
      if (!held && s.pressure < .0001) { s.pressure = 0; s.velocity = 0; }
    }
  }
  return {owners, press, update, release() { for (const slots of Object.values(owners)) for (const s of slots) s.touchedAt = -Infinity; }};
}
