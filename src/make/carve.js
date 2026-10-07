// The house carved from one solid (R54 step 5a; consultation c7dd918, accepted by Kabe 2026-10-06, "All
// good"; design/production/geometry-method.md §5). The building starts as one block and every room, doorway,
// window, well and fire's mouth is cut out of it, so a wrong number leaves too much wall, never a hole: a
// lining that stops short shows stone behind it, not the hillside (UnrealEd's subtractive levels: nothing to
// leak into). The linings (panelling, plaster, reveals, chimneypieces) are built in front of it as before.
//
// Everything is a prism: an outline in plan (integer millimetres, so the same house on every device) over
// a span of heights. The house is cut into height bands at every height where something starts or stops; in
// each band the solid is the footprint less the voids, by 2D booleans (Clipper2, integer arithmetic).
//   footprint: every room present in the band (or the storey under or over it) grown by the outer wall's
//     thickness, mitred, within the plan's outline (and any room beyond it, the porch, with its own walls); the
//     open forecourt is not house;
//   voids: each room's outline grown by SETBACK (the carve's faces stand behind the deepest part of any lining,
//     a fielded panel 18 mm and the panelling's core 30 mm behind the face, so they never fight or hide them),
//     from a centimetre under its floor to a centimetre over its ceiling; less its chimney breasts (masonry,
//     shrunk by SETBACK) and, under a room that stands over part of a room rising through floors (a stair's
//     landing over its hall), that room's floor; then each doorway, window and open side through the wall that
//     hosts it, grown by SETBACK all round so its reveal's lining stands inside the cut; each fire's mouth into
//     its breast; each stair's well through the floor it pierces.
// carve({ plan, specs, levelOf, gap }) -> { bands: [{ z0, z1, paths }], ms } (z in mm; paths: Clipper2 rings,
// outer rings anticlockwise, holes clockwise, x east and y north in mm); carveMesh(THREE, carved) -> geometry
// in the manor's frame (x east, y up, z south).
import * as C from "../vendor/clipper2.min.mjs";
import { wallToRoom } from "./furnish.js";

export const SETBACK = 0.04;     // m: behind every lining's deepest part
const EXT = 0.75, SKIN = 0.01;   // the outer wall's thickness (src/make/plans/hybrid-e.js DIMS.ext); floors and ceilings stand this far off the cut
const mm = (m) => Math.round(m * 1000);
const box = (x0, y0, x1, y1) => { const [a, b, c, d] = [mm(Math.min(x0, x1)), mm(Math.min(y0, y1)), mm(Math.max(x0, x1)), mm(Math.max(y0, y1))]; return [{ x: a, y: b }, { x: c, y: b }, { x: c, y: d }, { x: a, y: d }]; };
const grow = (paths, m) => paths.length ? C.inflatePaths(paths, mm(m), C.JoinType.Miter, C.EndType.Polygon, 4) : [];
const outlineOf = (room) => room.outline ? [room.outline.map(([x, y]) => ({ x: mm(x), y: mm(y) }))] : [box(room.rect.x0, room.rect.y0, room.rect.x1, room.rect.y1)];

// a rect in a wall's frame (r along it, d into the room; d < 0 is into the wall and beyond) to a plan box
function onWallBox(room, F, r0, r1, d0, d1) {
  const { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0;
  const [a, b] = [wallToRoom(F, W, D, r0, d0), wallToRoom(F, W, D, r1, d1)];
  return box(x0 + a[0], y0 + a[1], x0 + b[0], y0 + b[1]);
}

export function carve({ plan, specs, levelOf, gap = 0.35 }) {
  const t0 = performance.now(), S = SETBACK;
  // every prism: { paths, z0, z1 (mm), role }; role: room | breast | floor | cut | foot
  const prisms = [], add = (role, paths, z0, z1) => { if (z1 > z0 && paths.length) prisms.push({ role, paths, z0: mm(z0), z1: mm(z1) }); };
  const list = [...specs.values()];
  for (const { room, Y, H, spec } of list) {
    const out = outlineOf(room);
    add("room", grow(out, S), Y - SKIN, Y + H + SKIN);
    add("foot", grow(out, EXT), Y - gap, Y + H + gap);
    for (const [F, es] of Object.entries(spec.walls)) for (const e of es) {
      const T = (e.T || 0.3) + 0.1;             // through the wall that hosts it, and a little past
      if (e.kind === "door" || e.kind === "open") add("cut", [onWallBox(room, F, e.r0 - S, e.r1 + S, -T, S)], Y - SKIN, Y + (e.kind === "open" ? H + SKIN : e.top + S));
      if (e.kind === "window") add("cut", [onWallBox(room, F, e.r0 - S, e.r1 + S, -T, S)], Y + e.sill - S, Y + e.top + S);
      if (e.kind === "chimneypiece") {
        const B = e.breast || 0, fb = e.firebox;
        // (from just behind the room's face, so it never reaches into the room behind the wall)
        if (B > 2 * S) add("breast", [onWallBox(room, F, e.r0 + S, e.r1 - S, -2 * S, B - S)], Y - SKIN, Y + H + SKIN);
        // the fire's mouth, into the breast and, if the breast is shallower than the fire, into the wall behind
        add("cut", [onWallBox(room, F, fb.r0 - S, fb.r1 + S, B - fb.depth - S, B + S)], Y - SKIN, Y + fb.apex + S);
      }
    }
  }
  // a room standing over part of a room that rises through its floor keeps its floor there (a stair's landing)
  for (const lo of list.filter(q => (q.room.rises || 1) > 1)) for (const hi of list.filter(q => q.room.floor !== lo.room.floor && q.Y > lo.Y && q.Y < lo.Y + lo.H)) {
    const over = C.intersect(outlineOf(lo.room), outlineOf(hi.room), C.FillRule.NonZero);
    if (over.length) add("floor", grow(over, -S), hi.Y - gap + SKIN, hi.Y - SKIN);
  }
  // each stair's well through the floor it pierces
  for (const w of plan.wells || []) { const Y = levelOf(w.to); add("cut", [box(w.hole.x0 - S, w.hole.y0 - S, w.hole.x1 + S, w.hole.y1 + S)], Y - gap - SKIN, Y + SKIN); }

  // the house's outside is the plan's outline where it gives one (its walls need not all be one thickness: a wing's
  // face onto the court is half the outer wall); a room standing outside it (the porch) brings its own walls
  let clip = null;
  if (plan.outline) { const ring = plan.outline.map(([x, y]) => ({ x: mm(x), y: mm(y) }));
    const beyond = list.filter(q => { const o = outlineOf(q.room); return C.areaPaths(C.difference(o, [ring], C.FillRule.NonZero)) > 1; }).map(q => outlineOf(q.room)).flat();
    clip = C.union([ring, ...grow(beyond, EXT)], C.FillRule.NonZero); }
  // the bands: every height where a prism starts or stops
  const zs = [...new Set(prisms.flatMap(p => [p.z0, p.z1]))].sort((a, b) => a - b), bands = [];
  for (let i = 0; i + 1 < zs.length; i++) {
    const z0 = zs[i], z1 = zs[i + 1], on = (role) => prisms.filter(p => p.role === role && p.z0 < z1 && p.z1 > z0).flatMap(p => p.paths);
    const foot = on("foot"); if (!foot.length) continue;
    let voids = C.union(on("room"), C.FillRule.NonZero);
    const keep = [...on("breast"), ...on("floor")];
    if (keep.length) voids = C.difference(voids, keep, C.FillRule.NonZero);
    const cuts = on("cut"); if (cuts.length) voids = C.union(voids, cuts, C.FillRule.NonZero);
    const outside = clip ? C.intersect(C.union(foot, C.FillRule.NonZero), clip, C.FillRule.NonZero) : C.union(foot, C.FillRule.NonZero);
    const paths = C.difference(outside, voids, C.FillRule.NonZero);
    const key = JSON.stringify(paths);
    // a band the same as the one under it only makes that one taller
    const last = bands[bands.length - 1];
    if (last && last.z1 === z0 && last.key === key) last.z1 = z1; else bands.push({ z0, z1, paths, key });
  }
  for (const b of bands) delete b.key;
  return { bands, ms: Math.round((performance.now() - t0) * 10) / 10 };
}

// The carved solid as one mesh: each band's sides, and between bands only where the solid changes (the
// sill under a window, the head over a door), so no face stands hidden inside it. Where the solid is meant to be
// seen it is finished by the way it faces: its sides (the house's outside, a well's edge) group 0, what looks
// down (under a stair's landing) group 1, what looks up group 2; texture coordinates in metres (halved), so a
// finish tiles at its true size whatever the face.
export function carveMesh(THREE, { bands }) {
  const out = [[], [], []], uvs = [[], [], []];
  const P = (x, z, y) => [x / 1000, z / 1000, -y / 1000];   // plan (x, y north) at height z -> the manor's frame
  const cap = (paths, z, up) => { if (!paths.length) return; const { solution } = C.triangulate(paths, false), k = up > 0 ? 2 : 1;
    // anticlockwise in plan looks up (the manor's frame turns plan y into -z, which keeps up as up)
    for (const t of solution || []) { if (t.length !== 3) continue; const [a, b, c] = t, n = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      for (const v of (n > 0) === (up > 0) ? [a, b, c] : [a, c, b]) { out[k].push(...P(v.x, z, v.y)); uvs[k].push(v.x / 2000, v.y / 2000); } } };
  for (let i = 0; i < bands.length; i++) {
    const { z0, z1, paths } = bands[i];
    // sides: interior on the left of every edge (outer rings anticlockwise, holes clockwise), so out is to its right
    for (const ring of paths) { let s = 0;
      for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length], len = Math.hypot(b.x - a.x, b.y - a.y);
        const A0 = P(a.x, z0, a.y), B0 = P(b.x, z0, b.y), A1 = P(a.x, z1, a.y), B1 = P(b.x, z1, b.y);
        const [u0, u1, v0, v1] = [s / 2000, (s + len) / 2000, z0 / 2000, z1 / 2000]; s += len;
        out[0].push(...A0, ...B0, ...A1, ...B0, ...B1, ...A1); uvs[0].push(u0, v0, u1, v0, u0, v1, u1, v0, u1, v1, u0, v1);
      } }
    const under = i > 0 && bands[i - 1].z1 === z0 ? bands[i - 1].paths : [];
    const over = i + 1 < bands.length && bands[i + 1].z0 === z1 ? bands[i + 1].paths : [];
    cap(under.length ? C.difference(paths, under, C.FillRule.NonZero) : paths, z0, -1);
    cap(over.length ? C.difference(paths, over, C.FillRule.NonZero) : paths, z1, +1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs.flat(), 2));
  let at = 0; out.forEach((o, k) => { g.addGroup(at, o.length / 3, k); at += o.length / 3; });
  g.computeVertexNormals();
  return g;
}

// is a plan point (x east, y north, z up; metres) inside the carved solid?
export function solidAt({ bands }, x, y, z) {
  const Z = Math.round(z * 1000), b = bands.find(q => q.z0 <= Z && q.z1 > Z); if (!b) return false;
  const p = { x: Math.round(x * 1000), y: Math.round(y * 1000) }; let w = 0;
  for (const ring of b.paths) if (C.pointInPolygon(p, ring) === C.PointInPolygonResult.IsInside) w += C.isPositive(ring) ? 1 : -1;
  return w > 0;
}
