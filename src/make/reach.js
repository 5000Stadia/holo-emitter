// Every room reachable by the world's own actions (Kabe, 2026-10-06, on the review's P2): from the
// entrance, walk every doorway and stair you can; a door that is locked opens once its key has been
// reached somewhere; a doorway lower than you are tall, or narrower than you are wide, does not let
// you through. Keys found open more doors, so it runs until nothing new opens. What is left is a room
// nobody can reach; a key that lies only behind its own door is a softlock. Pure: plain data in.
//   plan: rooms, openings (joins, rect, floor), stairs (joins)
//   doors: { [openingId]: { locked: bool, key: name, height: m } }   (a door thing's state and settings)
//   keys:  [{ name, room }]                                           (where each key lies)
//   player: { height, width }                                         (Alice is not always 1.6 m)
export function reachability(plan, { doors = {}, keys = [], player = { height: 1.6, width: 0.45 }, start } = {}) {
  const entrance = start || plan.entrance || plan.rooms[0].id;
  const reached = new Set([entrance]), held = new Set(), why = {};
  const fits = (o) => { const d = doors[o.id], w = Math.max(o.rect.x1 - o.rect.x0, o.rect.y1 - o.rect.y0);
    return (d?.height ?? 2.2) >= player.height && w >= player.width; };
  const opens = (o) => { const d = doors[o.id]; return !d || !d.locked || held.has(d.key); };
  let grew = true;
  while (grew) {
    grew = false;
    for (const k of keys) if (reached.has(k.room) && !held.has(k.name)) { held.add(k.name); grew = true; }
    for (const o of plan.openings) {
      const [a, b] = o.joins, inA = reached.has(a), inB = reached.has(b);
      if (inA === inB) continue;
      const to = inA ? b : a;
      if (!fits(o)) { why[to] ??= `the way in (${o.id}) is lower or narrower than you`; continue; }
      if (!opens(o)) { why[to] ??= `the door ${o.id} is locked and its key (${doors[o.id].key}) is not to be had`; continue; }
      reached.add(to); delete why[to]; grew = true;
    }
    for (const s of plan.stairs) if (s.joins.some(j => reached.has(j))) for (const j of s.joins) if (!reached.has(j)) { reached.add(j); grew = true; }
  }
  const unreachable = plan.rooms.filter(r => !reached.has(r.id)).map(r => ({ room: r.id, why: why[r.id] || "no doorway or stair leads to it" }));
  // a softlock: a key whose only lie is a room its own door keeps you out of
  const softlocks = keys.filter(k => !reached.has(k.room)).map(k => ({ key: k.name, lies_in: k.room, opens: Object.entries(doors).filter(([, d]) => d.key === k.name).map(([id]) => id) }))
    .filter(s => s.opens.length);
  return { entrance, reached: [...reached], held: [...held], unreachable, softlocks, ok: !unreachable.length && !softlocks.length };
}
