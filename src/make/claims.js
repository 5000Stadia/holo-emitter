// The claim grid (R54 step 5c; Kabe, 2026-10-06: "doors windows and chair sides off desks could claim unavailable
// the empty area that needs reservation"; design/production/geometry-method.md §5). Each floor is a grid of
// cells a hand across, in layers (floor cover, standing, wall, overhead); a cell holds the strongest claim on it:
//   FREE      nothing: a thing may stand here and a body may walk here;
//   RESERVED  space something needs to work (a door's swing, a window's light, a drawer's pull, a chair drawn
//             out from a desk, the run of a stair): nothing may be placed here, but a body walks through it;
//   BODY      something a body can't pass (furniture, a hearth's mouth and fender, a stair's flights from the floor);
//   SOLID     not floor at all: wall, the outside, a well.
// Whoever claims says who they are, so a refused place names what stood in the way. Doorways are left to the
// walker, which asks whether each door stands open (a static claim can't be both). Reads are array lookups;
// writes rasterise a rect or a polygon. Plan coordinates: x east, y north, metres.
import { framesOf, wallPoly } from "./walls.js";
export const FREE = 0, RESERVED = 1, BODY = 2, SOLID = 3;
export const LAYERS = ["floor", "stand", "wall", "over"];
const NAMES = ["free", "reserved", "body", "solid"];

export function makeClaims({ x0, y0, x1, y1, floors, cell = 0.1, initial = FREE }) {
  const n = Math.ceil((x1 - x0) / cell), m = Math.ceil((y1 - y0) / cell), who = [""];
  const grids = new Map(), exact = new Map(), doors = new Map(), doorIds = [null];
  for (const f of floors) { for (const L of LAYERS) grids.set(`${f}/${L}`, { state: new Uint8Array(n * m).fill(initial), who: new Uint16Array(n * m) });
    exact.set(f, new Uint8Array(n * m)); doors.set(f, new Uint16Array(n * m)); }
  const grid = (f, L) => { const g = grids.get(`${f}/${L}`); if (!g) throw new Error(`claims: no floor ${f} layer ${L}`); return g; };
  const I = (x) => Math.floor((x - x0) / cell), J = (y) => Math.floor((y - y0) / cell);
  const inside = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[i], [bx, by] = poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
  // every cell whose middle lies in the shape (a rect { x0, y0, x1, y1 } or a polygon [[x, y], ...])
  function each(shape, f) {
    const poly = Array.isArray(shape) ? shape : null;
    const b = poly ? { x0: Math.min(...poly.map(p => p[0])), x1: Math.max(...poly.map(p => p[0])), y0: Math.min(...poly.map(p => p[1])), y1: Math.max(...poly.map(p => p[1])) } : shape;
    const i0 = Math.max(0, Math.ceil((b.x0 - x0) / cell - 0.5)), i1 = Math.min(n - 1, Math.floor((b.x1 - x0) / cell - 0.5));
    const j0 = Math.max(0, Math.ceil((b.y0 - y0) / cell - 0.5)), j1 = Math.min(m - 1, Math.floor((b.y1 - y0) / cell - 0.5));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (!poly || inside(poly, x0 + (i + 0.5) * cell, y0 + (j + 0.5) * cell)) f(i * m + j);
  }
  // exact: the claim stops a body at its own edge, not a body's half-width off it (a well's railed side: you stand
  // at the rail)
  function claim(floor, layer, shape, state, by, { exact: ex = false } = {}) {
    const g = grid(floor, layer); let k = who.indexOf(by); if (k < 0) { k = who.length; who.push(by); }
    if (ex) { const e = exact.get(floor); each(shape, (c) => { e[c] = 1; g.who[c] = k; }); return; }
    each(shape, (c) => { if (state >= g.state[c]) { g.state[c] = state; g.who[c] = k; } });
  }
  // floor where there was none: a room's own floor, in a grid that starts solid
  function open(floor, layer, shape) { const g = grid(floor, layer); each(shape, (c) => { g.state[c] = FREE; g.who[c] = 0; }); }
  // a doorway: floor through the wall, passable while its door stands open
  function doorway(floor, shape, id) { let k = doorIds.indexOf(id); if (k < 0) { k = doorIds.length; doorIds.push(id); } const d = doors.get(floor); open(floor, "stand", shape); each(shape, (c) => { d[c] = k; }); }
  // the strongest claim in a shape, and who holds it
  function worst(floor, layer, shape) {
    const g = grid(floor, layer); let s = FREE, by = new Set();
    each(shape, (c) => { if (g.state[c] > s) { s = g.state[c]; by = new Set(); } if (g.state[c] === s && s > FREE) by.add(who[g.who[c]]); });
    return { state: s, name: NAMES[s], by: [...by] };
  }
  const at = (floor, layer, x, y) => { const i = I(x), j = J(y); if (i < 0 || j < 0 || i >= n || j >= m) return SOLID; return grid(floor, layer).state[i * m + j]; };
  const whoAt = (floor, layer, x, y) => { const i = I(x), j = J(y); if (i < 0 || j < 0 || i >= n || j >= m) return "outside"; return who[grid(floor, layer).who[i * m + j]]; };
  // where a body's middle may stand: no BODY or SOLID claim on the standing layer within its half-width
  // (worked out once a floor, then a lookup)
  const reach = new Map();
  function standable(floor, half) {
    const key = `${floor}/${half}`; if (reach.has(key)) return reach.get(key);
    const g = grid(floor, "stand").state, ok = new Uint8Array(n * m).fill(1), r = Math.ceil(half / cell - 0.5), offs = [];
    for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) if ((Math.abs(di) - 0.5) ** 2 + (Math.abs(dj) - 0.5) ** 2 <= (half / cell) ** 2 || (!di || !dj)) offs.push([di, dj]);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { if (g[i * m + j] < BODY) continue;
      for (const [di, dj] of offs) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < n && b < m) ok[a * m + b] = 0; } }
    reach.set(key, ok); return ok;
  }
  const canStand = (floor, x, y, half, isOpen = () => true) => { const i = I(x), j = J(y); if (i < 0 || j < 0 || i >= n || j >= m) return false; const c = i * m + j;
    if (exact.get(floor)[c]) return false; const d = doors.get(floor)[c]; if (d && !isOpen(doorIds[d])) return false; return !!standable(floor, half)[c]; };
  const changed = () => reach.clear();
  return { claim, open, doorway, worst, at, whoAt, canStand, changed, cell, n, m, x0, y0 };
}

// A house's claims from its plan and what was built in it (blocks: furniture and hearths, as the builder lists them):
// each room's floor open in a grid that starts solid; each doorway's strip through its wall (and a step into each
// room), passable while its door is open; each well railed at its sides (open at the foot, where you step off the
// flight); every block stops a body. The walker and the checks read this one grid.
export function houseClaims({ plan, blocks = [], half = 0.22, cell = 0.1 }) {
  const rooms = plan.rooms.filter(r => r.type !== "open"), all = plan.rooms.map(r => r.rect);
  const C = makeClaims({ x0: Math.min(...all.map(r => r.x0)) - 1, y0: Math.min(...all.map(r => r.y0)) - 1, x1: Math.max(...all.map(r => r.x1)) + 1, y1: Math.max(...all.map(r => r.y1)) + 1,
    floors: plan.floors.map(f => f.id), cell, initial: SOLID });
  for (const r of rooms) { C.open(r.floor, "stand", r.outline || r.rect); C.open(r.floor, "floor", r.outline || r.rect); }
  // a doorway's strip: through the wall and a step into each room, kept off its jambs by 8 cm, or a tenth of a little
  // door's width (Alice's door is 25 cm wide); which way it runs is the opening's axis, if it says (a door narrower
  // than its wall is thick)
  const strip = (R, axis) => { const ew = axis ? axis === "EW" : (R.x1 - R.x0) < (R.y1 - R.y0), e = Math.min(0.08, 0.1 * (ew ? R.y1 - R.y0 : R.x1 - R.x0));
    return ew ? { x0: R.x0 - 0.35, x1: R.x1 + 0.35, y0: R.y0 + e, y1: R.y1 - e } : { x0: R.x0 + e, x1: R.x1 - e, y0: R.y0 - 0.35, y1: R.y1 + 0.35 }; };
  for (const o of plan.openings) if (o.rect) C.doorway(o.floor, strip(o.rect, o.axis), o.id);
    // an outline room's doorway, on the wall it names: through the wall and a step into each side
    else if (o.on) for (const [id, h] of Object.entries(o.on)) { const room = plan.rooms.find(q => q.id === id);
      C.doorway(room.floor, wallPoly(room, framesOf(room)[h.F], h.r0 + 0.08, h.r1 - 0.08, -(o.T ?? 0.3) - 0.35, 0.35), o.id); }
  for (const w of plan.wells || []) { const H = w.hole, F = w.rect, m = half;
    C.claim(w.to, "stand", { x0: H.x0 - (F.x0 < H.x0 - 0.01 ? 0 : m), x1: H.x1 + (F.x1 > H.x1 + 0.01 ? 0 : m), y0: H.y0 - (F.y0 < H.y0 - 0.01 ? 0 : m), y1: H.y1 + (F.y1 > H.y1 + 0.01 ? 0 : m) }, SOLID, `${w.id} well`, { exact: true }); }
  for (const b of blocks) C.claim(b.floor, "stand", b.poly || b, BODY, b.kind || "block");
  return C;
}
