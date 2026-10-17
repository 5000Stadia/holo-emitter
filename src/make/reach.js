// Every room reachable by the world's own actions (Kabe, 2026-10-06, on the review's P2): from the
// entrance, walk every doorway and stair you can; a door that is locked opens once its key has been
// reached somewhere; a doorway lower than you are tall, or narrower than you are wide, does not let
// you through. Keys found open more doors, so it runs until nothing new opens. What is left is a room
// nobody can reach; a key that lies only behind its own door is a softlock. Pure: plain data in.
//   plan: rooms, openings (joins, rect, floor), stairs (joins)
//   doors: { [openingId]: { locked: bool, key: name, height: m } }   (a door thing's state and settings)
//   keys:  [{ name, room }]                                           (where each key lies)
//   player: { height, width }                                         (Alice is not always 1.6 m)
//   parts: { [roomId]: { groups, links, pointParts } }   (src/make/passage.js: a room a barricade splits
//          in two is two places until what clears it is held; a room not listed is one place)
//   keys:  [{ name, room, part? }]; start: a room id, startPart: its part (default 0)
export function reachability(plan, { doors = {}, keys = [], player = { height: 1.6, width: 0.45 }, start, startPart = 0, parts = {} } = {}) {
  const entrance = start || plan.entrance || plan.rooms[0].id;
  const node = (room, exitId) => { const P = parts[room]; if (!P || exitId == null) return `${room}#0`; const g = P.groups.findIndex(gr => gr.includes(exitId)); return `${room}#${Math.max(0, g)}`; };
  const roomOf = (n) => n.slice(0, n.lastIndexOf("#"));
  const reached = new Set([`${entrance}#${startPart}`]), held = new Set(), why = {};
  const fits = (o) => { const d = doors[o.id], w = Math.max(o.rect.x1 - o.rect.x0, o.rect.y1 - o.rect.y0);
    return (d?.height ?? 2.2) >= player.height && w >= player.width; };
  const opens = (o) => { const d = doors[o.id]; return !d || !d.locked || held.has(d.key); };
  const keyNode = (k) => `${k.room}#${k.part ?? parts[k.room]?.pointParts?.[k.name] ?? 0}`;
  let grew = true;
  while (grew) {
    grew = false;
    for (const k of keys) if (reached.has(keyNode(k)) && !held.has(k.name)) { held.add(k.name); grew = true; }
    for (const o of plan.openings) {
      const [a, b] = o.joins, na = node(a, o.id), nb = node(b, o.id), inA = reached.has(na), inB = reached.has(nb);
      if (inA === inB) continue;
      const to = inA ? nb : na;
      if (!fits(o)) { why[roomOf(to)] ??= `the way in (${o.id}) is lower or narrower than you`; continue; }
      if (!opens(o)) { why[roomOf(to)] ??= `the door ${o.id} is locked and its key (${doors[o.id].key}) is not to be had`; continue; }
      reached.add(to); grew = true;
    }
    for (const s of plan.stairs) { const ns = s.joins.map(j => node(j, s.well)); if (ns.some(n => reached.has(n))) for (const n of ns) if (!reached.has(n)) { reached.add(n); grew = true; } }
    // within a room: a barricade's two sides join once what clears it is held
    for (const [room, P] of Object.entries(parts)) for (const l of P.links || []) {
      const A = `${room}#${l.a}`, B = `${room}#${l.b}`, need = l.gate?.["@holding"];
      if (reached.has(A) === reached.has(B)) continue;
      if (need && !held.has(need)) { why[room] ??= `${l.by} stands in the way, and nothing to clear it (${need}) is to be had`; continue; }
      reached.add(reached.has(A) ? B : A); grew = true;
    }
  }
  const roomsReached = new Set([...reached].map(roomOf));
  const unreachable = plan.rooms.filter(r => !roomsReached.has(r.id)).map(r => ({ room: r.id, why: why[r.id] || "no doorway or stair leads to it" }));
  // parts of a room never reached: the far side of a barricade nothing clears
  const cutOff = Object.entries(parts).flatMap(([room, P]) => P.groups.map((g, k) => ({ room, part: k, exits: g })).filter(p => roomsReached.has(room) && !reached.has(`${p.room}#${p.part}`)))
    .map(p => ({ ...p, why: why[p.room] || "no way to it" }));
  // a softlock: a key whose only lie is a place its own lock keeps you out of
  const opensWhat = (name) => [...Object.entries(doors).filter(([, d]) => d.key === name).map(([id]) => id), ...Object.values(parts).flatMap(P => (P.links || []).filter(l => l.gate?.["@holding"] === name).map(l => l.by))];
  const softlocks = keys.filter(k => !reached.has(keyNode(k))).map(k => ({ key: k.name, lies_in: k.room, opens: opensWhat(k.name) })).filter(s => s.opens.length);
  return { entrance, reached: [...roomsReached], held: [...held], unreachable, cutOff, softlocks, ok: !unreachable.length && !softlocks.length && !cutOff.length };
}
