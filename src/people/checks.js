// Checks on people as they stand (M8, R60; brief design/people/photonic-brief.md §4): cheap arithmetic over every person a
// population holds, run by the harness and the suite, never in play, on whatever population is behind the interface:
//   inside   standing where the house refuses a body their width (a wall, a well, furniture, a shut doorway);
//   floats   feet above the floor the walker finds there (sinks: below it), by over 2 cm;
//   door     standing in a doorway they don't fit (wider than it, or taller than its head);
//   overlap  two bodies (or a body and you) in one place.
// checkPeople({ people, walkOf(half) -> walker, claims (src/people/bodies.js), doors: Map(id -> { w, top }) })
//   -> { people: n, findings: [{ id, rule, ... }] }
export function checkPeople({ people, walkOf, claims, doors }) {
  const out = [], all = people.all();
  for (const q of all) {
    const { pos, floor } = q.where(), b = q.bounds(), x = pos[0], y = -pos[2], h = pos[1], g = walkOf(b.half).groundAt(x, y, h);
    if (g == null) out.push({ id: q.id, rule: "inside", at: [+x.toFixed(2), +y.toFixed(2), +h.toFixed(2)], by: claims.whoAt(floor, "stand", x, y) });
    else if (Math.abs(g - h) > 0.02) out.push({ id: q.id, rule: g < h ? "floats" : "sinks", by: +(h - g).toFixed(3) });
    const d = claims.doorAt(floor, x, y), D = d && doors.get(d);
    if (D && (2 * b.half > D.w || b.height > D.top)) out.push({ id: q.id, rule: "door", door: d, w: D.w, top: D.top, half: b.half, height: b.height });
    const o = claims.bodyAt(floor, x, y, b.half - 0.01, q.id); if (o && (o === "player" || q.id < o)) out.push({ id: q.id, rule: "overlap", with: o });
  }
  return { people: all.length, findings: out };
}
