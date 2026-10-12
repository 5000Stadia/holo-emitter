// People's bodies as they move (M8, R60; the person interface, Photonic's design/interface.md): the claim grid
// (src/make/claims.js) is written once, as the house is built, and never released, so a body that walks holds its
// place in a layer of its own, the BODY layer of the moving: one circle a body, by floor, in metre buckets. Everyone
// who walks reads it, the player too, so nobody walks through anybody. Plan coordinates: x east, y north, metres.
//   withBodies(claims) -> claims plus { hold(id, floor, x, y, half), release(id), bodyAt(floor, x, y, half, except) -> id | null,
//                                       canStand(floor, x, y, half, isOpen, except): the grid's answer and no body in the way, bodies() }
export function withBodies(claims) {
  // (a bucket's key a number: a floor's index, then the metre cell, offset to stay positive)
  const held = new Map(), buckets = new Map(), floors = new Map(), fl = (f) => { let k = floors.get(f); if (k == null) floors.set(f, k = floors.size); return k; };
  const key = (f, i, j) => (fl(f) * 4096 + i + 2048) * 4096 + j + 2048;
  const unbucket = (id, b) => { const k = key(b.floor, Math.floor(b.x), Math.floor(b.y)), s = buckets.get(k); if (s) { s.delete(id); if (!s.size) buckets.delete(k); } };
  function hold(id, floor, x, y, half) {
    const b = held.get(id); if (b) unbucket(id, b);
    const nb = { floor, x, y, half }; held.set(id, nb);
    const k = key(floor, Math.floor(x), Math.floor(y)); let s = buckets.get(k); if (!s) buckets.set(k, s = new Set()); s.add(id);
  }
  function release(id) { const b = held.get(id); if (b) { unbucket(id, b); held.delete(id); } }
  // the first body (not except) a circle of half at (x, y) would overlap; bodies are under a metre across, so the
  // circle's own bucket and its eight neighbours hold every one that could
  function bodyAt(floor, x, y, half, except = null) {
    const i0 = Math.floor(x), j0 = Math.floor(y);
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const s = buckets.get(key(floor, i, j)); if (!s) continue;
      for (const id of s) { if (id === except) continue; const b = held.get(id); if (Math.hypot(b.x - x, b.y - y) < b.half + half) return id; } }
    return null;
  }
  const canStand = (floor, x, y, half, isOpen, except = null) => claims.canStand(floor, x, y, half, isOpen) && bodyAt(floor, x, y, half, except) == null;
  return { ...claims, hold, release, bodyAt, canStand, bodies: () => held };
}
