// The house's outside (R46, consultation ca629b3 point 1: "the manor has no outside … from the forecourt and the
// hill the house is what they look at"): roofs over the ranges the plan type declares, coped gables where a range
// ends in one, chimney stacks where the fires' flues rise, and the windows' glass and stone mullions seen from
// outside, so a room not drawn never shows as a hole. All from the plan, as data first (shellOf: pure, ready for a
// worker), then built (buildShell). Plan coordinates x east, y north, z up; three's are (x, z, -y).
//   plan.ranges: [{ id, x0, x1, y0, y1, axis: "x" | "y" (the ridge's run), ends: { lo, hi: "gable" | "abut" } }]
//     (a range's eaves stand on its walls' top; every ridge at one height, so roofs meet in clean valleys)
//   a room drawn as an outline (the banqueting house's octagon) takes a pyramid roof over it
import { storeys } from "./house-spec.js";

export const PITCH = 50 * Math.PI / 180;      // chosen: stone-slate roofs of the period stand at 45-55°
const EAVE = 0.3, VERGE = 0.12, COPE = 0.16;  // eaves' overhang; a verge's; how far a gable's coping stands proud

export function shellOf(plan, { gap = 0.35, ext = 0.75 } = {}) {
  const { levelOf, heightOf } = storeys(plan, gap), built = plan.rooms.filter(r => r.type !== "open");
  // a range's wall top: the highest ceiling of the rooms within it, and the floor's gap over it (the carve's top)
  const topOver = (R) => Math.max(...built.filter(r => r.rect.x0 < R.x1 && r.rect.x1 > R.x0 && r.rect.y0 < R.y1 && r.rect.y1 > R.y0).map(r => levelOf(r.floor) + heightOf(r)), 0) + gap;
  const ranges = (plan.ranges || []).map(R => ({ ...R, top: topOver(R), span: R.axis === "x" ? R.y1 - R.y0 : R.x1 - R.x0 }));
  // one ridge height for all the ranges that meet: the widest span at the pitch; each range pitched to reach it
  const groups = new Map(); for (const R of ranges) { const k = R.top.toFixed(2); groups.set(k, Math.max(groups.get(k) || 0, R.span / 2 * Math.tan(PITCH))); }
  const roofs = ranges.map(R => { const rise = groups.get(R.top.toFixed(2)); return { ...R, rise, pitch: Math.atan(rise / (R.span / 2)) }; });
  // where a roof dies into another range: against a wall higher than its ridge (the porch against the house), 0.3 m
  // into that wall, where the stone hides its end; else on to the other roof's ridge line, so the slopes meet in a
  // valley and its end stands inside the other roof (stopped at the other's wall, its end stood out bare)
  for (const R of roofs) { const X = R.axis === "x", sm = X ? (R.y0 + R.y1) / 2 : (R.x0 + R.x1) / 2;
    for (const [end, t, sg] of [["lo", X ? R.x0 : R.y0, -1], ["hi", X ? R.x1 : R.y1, 1]]) { let to = t;
      if ((R.ends?.[end] || "abut") === "abut") { const px = X ? t + sg * 0.05 : sm, py = X ? sm : t + sg * 0.05, O = roofs.find(q => q !== R && px > q.x0 && px < q.x1 && py > q.y0 && py < q.y1);
        if (O && O.top >= R.top + R.rise - 0.01) to = t + sg * 0.3; else if (O) to = O.axis === "x" ? (O.y0 + O.y1) / 2 : (O.x0 + O.x1) / 2; }
      R[end === "lo" ? "tLo" : "tHi"] = to; } }
  // the outline rooms (an octagon): a pyramid to their middle, at the pitch
  const pyramids = built.filter(r => r.outline && !roofs.some(R => inside(R, r.rect))).map(r => { const cx = r.outline.reduce((s, p) => s + p[0], 0) / r.outline.length, cy = r.outline.reduce((s, p) => s + p[1], 0) / r.outline.length;
    const ap = Math.min(...r.outline.map(([x, y]) => Math.hypot(x - cx, y - cy))); return { id: r.id, poly: r.outline, c: [cx, cy], top: levelOf(r.floor) + heightOf(r) + gap, rise: (ap + ext) * Math.tan(PITCH) }; });
  // the roof's height over a plan point (for the stacks), the highest roof there
  const roofZ = (x, y) => { let z = -Infinity;
    for (const R of roofs) { if (x < R.x0 - EAVE || x > R.x1 + EAVE || y < R.y0 - EAVE || y > R.y1 + EAVE) continue;
      const d = R.axis === "x" ? Math.abs(y - (R.y0 + R.y1) / 2) : Math.abs(x - (R.x0 + R.x1) / 2); z = Math.max(z, R.top + R.rise - d * Math.tan(R.pitch)); }
    for (const P of pyramids) { const d = Math.hypot(x - P.c[0], y - P.c[1]); z = Math.max(z, P.top + P.rise - d * Math.tan(PITCH)); }
    return z; };
  // the stacks: each fire's flue rises in the wall behind it; the fires one above another share a stack, a shaft each
  const stacks = [];
  for (const f of plan.fireplaces || []) { const r = built.find(q => q.id === f.room); if (!r || r.outline || !f.rect) continue;
    const R = f.rect, along = (R.x1 - R.x0) > (R.y1 - R.y0) ? "x" : "y", w = Math.min(1.6, (along === "x" ? R.x1 - R.x0 : R.y1 - R.y0) + 0.3);
    // the wall it backs onto: the room's side the fireplace rect touches
    const rr = r.rect, side = along === "x" ? (Math.abs(R.y1 - rr.y1) < Math.abs(R.y0 - rr.y0) ? "N" : "S") : (Math.abs(R.x1 - rr.x1) < Math.abs(R.x0 - rr.x0) ? "E" : "W");
    const T = 0.9, c = along === "x" ? (R.x0 + R.x1) / 2 : (R.y0 + R.y1) / 2;
    const at = side === "N" ? { x0: c - w / 2, x1: c + w / 2, y0: rr.y1, y1: rr.y1 + T } : side === "S" ? { x0: c - w / 2, x1: c + w / 2, y0: rr.y0 - T, y1: rr.y0 }
      : side === "E" ? { x0: rr.x1, x1: rr.x1 + T, y0: c - w / 2, y1: c + w / 2 } : { x0: rr.x0 - T, x1: rr.x0, y0: c - w / 2, y1: c + w / 2 };
    const same = stacks.find(s => s.along === along && Math.abs(s.c - c) < 0.9 && s.x0 < at.x1 && s.x1 > at.x0 && s.y0 < at.y1 && s.y1 > at.y0);
    if (same) { same.flues++; continue; }
    stacks.push({ ...at, along, c, flues: 1 }); }
  for (const s of stacks) { const zs = [[s.x0, s.y0], [s.x1, s.y0], [s.x0, s.y1], [s.x1, s.y1]].map(([x, y]) => roofZ(x, y)).filter(Number.isFinite);
    // it shows only above the roof: from just under the eaves of the range it stands in
    const cx = (s.x0 + s.x1) / 2, cy = (s.y0 + s.y1) / 2, home = roofs.filter(R => cx > R.x0 - 1 && cx < R.x1 + 1 && cy > R.y0 - 1 && cy < R.y1 + 1);
    // a stack carries its smoke clear of the ridge (a stack low on the slope smokes back down it), and the period built
    // them tall, a display as much as a flue: to 1.4 m over
    // the ridge of the range it stands in, and never less than 1.2 m over the roof where it rises
    const roof = zs.length ? Math.max(...zs) : topOver(s), ridge = home.length ? Math.max(...home.map(R => R.top + R.rise)) : roof;
    // never down into a room: where the base stands over one (a flue in a 0.3 m wall between two rooms, its base 0.8 m
    // deep), it starts 2 cm over that room's ceiling (the long gallery's stack had hung 0.22 m below the garret
    // landing's ceiling and 0.55 m into it, a stone box in the air, 2026-10-08)
    const B = baseOf(s), over = built.filter(r => r.rect.x0 < B.x1 - 0.01 && r.rect.x1 > B.x0 + 0.01 && r.rect.y0 < B.y1 - 0.01 && r.rect.y1 > B.y0 + 0.01).map(r => levelOf(r.floor) + heightOf(r) + 0.02);
    s.z0 = Math.max((home.length ? Math.max(...home.map(R => R.top)) : roof) - 0.6, ...over); s.z1 = Math.max(roof + 1.2, ridge + 1.4); }
  // the footprint the plinth runs round: the plan's outline, and each room standing outside it (the porch) with its walls
  // a polygon pushed out by d along each edge's outward normal, its corners mitred
  const grow = (o, d) => { const sg = o.reduce((a, p, i) => { const q = o[(i + 1) % o.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0) > 0 ? 1 : -1, n = o.length;
    const line = (i) => { const [ax, ay] = o[i], [bx, by] = o[(i + 1) % n], L = Math.hypot(bx - ax, by - ay), nx = (by - ay) / L * sg, ny = -(bx - ax) / L * sg; return [ax + nx * d, ay + ny * d, bx - ax, by - ay]; };
    return o.map((_, i) => { const [px, py, dx, dy] = line((i + n - 1) % n), [qx, qy, ex, ey] = line(i), den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) return [qx, qy]; const t = ((qx - px) * ey - (qy - py) * ex) / den; return [px + dx * t, py + dy * t]; }); };
  const inOutline = (x, y) => { const o = plan.outline; if (!o) return false; let c = false; for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const [ax, ay] = o[i], [bx, by] = o[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
  const footprints = [...(plan.outline ? [plan.outline] : []), ...built.filter(r => !r.outline && !inOutline((r.rect.x0 + r.rect.x1) / 2, (r.rect.y0 + r.rect.y1) / 2))
    .map(r => [[r.rect.x0 - ext, r.rect.y0 - ext], [r.rect.x1 + ext, r.rect.y0 - ext], [r.rect.x1 + ext, r.rect.y1 + ext], [r.rect.x0 - ext, r.rect.y1 + ext]]),
    // (a room's own outline is its inside: pushed out by its walls, as a rectangle's is; the banqueting octagon's plinth
    // had run inside its walls, hidden, the octagon bare of one, and the lobby's had stood in its corners: rule 7)
    ...built.filter(r => r.outline).map(r => grow(r.outline, ext))];
  return { roofs, pyramids, stacks, roofZ, footprints };
}
const inside = (R, r) => r.x0 >= R.x0 - 0.01 && r.x1 <= R.x1 + 0.01 && r.y0 >= R.y0 - 0.01 && r.y1 <= R.y1 + 0.01;
// a stack's base in plan: across its flues' shafts (0.46 m each, 0.1 m apart) and 0.12 m beyond, 0.8 m deep on its wall's line
const SHAFT = 0.46, SHAFT_GAP = 0.1;
const runOf = (s) => s.flues * SHAFT + (s.flues - 1) * SHAFT_GAP;
function baseOf(s) { const along = s.along === "x", mid = along ? (s.y0 + s.y1) / 2 : (s.x0 + s.x1) / 2, a = s.c - runOf(s) / 2 - 0.12, b = s.c + runOf(s) / 2 + 0.12;
  return along ? { x0: a, x1: b, y0: mid - 0.4, y1: mid + 0.4 } : { x0: mid - 0.4, x1: mid + 0.4, y0: a, y1: b }; }

// ---- built: geometry from the shell, a draw per material (slate, stone, glass)
export function buildShell(THREE, shell, { slate, stone, glass, mullion = stone, windows = [], mergeGeometries }) {
  const G = new THREE.Group(); G.name = "exterior";
  const slates = [], stones = [], panes = [], bars = [];
  const V = (x, y, z) => new THREE.Vector3(x, z, -y);
  // a quad as two triangles with uvs in metres (u along, v up the slope)
  const quad = (out, a, b, c, d, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap(p => [p.x, p.y, p.z]), 3));
    // (a face given no uv takes the stone's own scale in world space, as the gable's triangles do: a 0-1 square per face
    // stretched the ashlar across eaves, soffits and the plinth's top)
    const w = (p) => [p.x + p.z, p.y];
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv ? [uv[0], uv[1], uv[2], uv[0], uv[2], uv[3]].flat() : [a, b, c, a, c, d].flatMap(w), 2)); g.computeVertexNormals(); out.push(g); };
  const tri = (out, a, b, c) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c].flatMap(p => [p.x, p.y, p.z]), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([a.x + a.z, a.y, b.x + b.z, b.y, c.x + c.z, c.y], 2)); g.computeVertexNormals(); out.push(g); };
  const box = (out, x0, x1, y0, y1, z0, z1) => { const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0); g.translate((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2); out.push(g.toNonIndexed()); };
  for (const R of shell.roofs) {
    // in the range's own frame: s across (from the eave on one side), t along the ridge; rotated into plan
    const X = R.axis === "x", s0 = X ? R.y0 : R.x0, s1 = X ? R.y1 : R.x1, sm = (s0 + s1) / 2, ta = (R.tLo ?? (X ? R.x0 : R.y0)) - (R.ends?.lo === "gable" ? VERGE : 0), tb = (R.tHi ?? (X ? R.x1 : R.y1)) + (R.ends?.hi === "gable" ? VERGE : 0);
    const P = (s, t, z) => X ? V(t, s, z) : V(s, t, z), tanp = Math.tan(R.pitch), eaveZ = R.top - EAVE * tanp, ridge = R.top + R.rise, slope = (R.span / 2 + EAVE) / Math.cos(R.pitch);
    // the two slopes, their slates' courses running along the ridge; a thickness under them (fascia and soffit)
    for (const [e, sg] of [[s0 - EAVE, 1], [s1 + EAVE, -1]]) {
      const a = P(e, ta, eaveZ), b = P(e, tb, eaveZ), c = P(sm, tb, ridge), d = P(sm, ta, ridge), L = tb - ta;
      if ((sg > 0) === X) quad(slates, a, b, c, d, [[0, 0], [L, 0], [L, slope], [0, slope]]); else quad(slates, b, a, d, c, [[L, 0], [0, 0], [0, slope], [L, slope]]);
      // the eave's fascia and soffit, only where no other range stands (a range running on to the ridge of the one it
      // dies into had carried them 3.5 m into the wings' garrets, a stone board 15 cm under their ceilings: rule 7)
      const sw = sm - sg * (R.span / 2), smid = (e + sw) / 2, cuts = [ta, tb];
      for (const O of shell.roofs) if (O !== R) { const [lo, hi] = X ? [O.x0, O.x1] : [O.y0, O.y1], [slo, shi] = X ? [O.y0, O.y1] : [O.x0, O.x1];
        if (smid > slo && smid < shi) for (const c of [lo, hi]) if (c > ta && c < tb) cuts.push(c); }
      cuts.sort((p, q) => p - q);
      for (let k = 0; k + 1 < cuts.length; k++) { const t0 = cuts[k], t1 = cuts[k + 1], tm = (t0 + t1) / 2; if (t1 - t0 < 0.005) continue;
        if (shell.roofs.some(O => O !== R && (X ? tm > O.x0 && tm < O.x1 && smid > O.y0 && smid < O.y1 : smid > O.x0 && smid < O.x1 && tm > O.y0 && tm < O.y1))) continue;
        const a1 = P(e, t0, eaveZ), b1 = P(e, t1, eaveZ), a2 = P(e, t0, eaveZ - 0.14), b2 = P(e, t1, eaveZ - 0.14), w0 = P(sw, t0, R.top), w1 = P(sw, t1, R.top);
        if ((sg > 0) === X) { quad(stones, a2, b2, b1, a1); quad(stones, w0, w1, b2, a2); } else { quad(stones, b2, a2, a1, b1); quad(stones, w1, w0, a2, b2); } }
    }
    // the ends: a coped gable of stone, standing a little above the slates, with a ball finial; or (where the
    // range dies into another) a closed end, hidden in the other roof
    for (const [end, t, sg] of [["lo", ta, -1], ["hi", tb, 1]]) {
      const kind = R.ends?.[end] || "abut", tw = t - sg * (kind === "gable" ? VERGE : 0);
      if (kind === "gable") { const lw = P(s0, tw, R.top), rw = P(s1, tw, R.top), ap = P(sm, tw, ridge + COPE * 0.6);
        // the gable's face and its back (the wall's thickness, 0.75, behind it), and the coping along both rakes
        if (sg > 0 === X) tri(stones, lw, rw, ap); else tri(stones, rw, lw, ap);
        const tb2 = tw - sg * 0.75, lb = P(s0, tb2, R.top), rb = P(s1, tb2, R.top), apb = P(sm, tb2, ridge + COPE * 0.6);
        if (sg > 0 === X) tri(stones, rb, lb, apb); else tri(stones, lb, rb, apb);
        // the coping: one slab along each rake, from the kneeler at the eave to the apex (pieces of it, overlapping on
        // one plane, flickered)
        for (const [sx, sgn] of [[s0, 1], [s1, -1]]) { const sA = sx, sB = sx + sgn * (R.span / 2), zA = R.top + COPE, zB = R.top + R.rise + COPE;
          // (the two rakes' slabs a little different in width, so where they cross at the apex their faces never share a plane)
          const g = new THREE.BoxGeometry(sgn > 0 ? 0.48 : 0.468, 0.12, Math.hypot(R.span / 2, R.rise) + 0.1), m = new THREE.Matrix4();
          const mid = P((sA + sB) / 2, tw - sg * 0.3, (zA + zB) / 2), dir = P(sB, tw - sg * 0.3, zB).sub(P(sA, tw - sg * 0.3, zA)).normalize();
          m.lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0)); m.setPosition(mid); g.applyMatrix4(m); stones.push(g.toNonIndexed()); }
        { const s = new THREE.SphereGeometry(0.2, 10, 8), q = P(sm, tw - sg * 0.3, ridge + COPE + 0.42); s.translate(q.x, q.y, q.z); stones.push(s.toNonIndexed());
          const pd = new THREE.BoxGeometry(0.34, 0.2, 0.34); pd.translate(q.x, q.y - 0.27, q.z); stones.push(pd.toNonIndexed()); } }
      else { const lw = P(s0 - EAVE, tw, eaveZ), rw = P(s1 + EAVE, tw, eaveZ), ap = P(sm, tw, ridge); if (sg > 0 === X) tri(stones, lw, rw, ap); else tri(stones, rw, lw, ap); }
    }
  }
  for (const Py of shell.pyramids) { const n = Py.poly.length, apex = V(Py.c[0], Py.c[1], Py.top + Py.rise);
    for (let i = 0; i < n; i++) { const [ax, ay] = Py.poly[i], [bx, by] = Py.poly[(i + 1) % n], grow = (x, y) => { const dx = x - Py.c[0], dy = y - Py.c[1], d = Math.hypot(dx, dy), k = (d + 0.75 + EAVE) / d; return [Py.c[0] + dx * k, Py.c[1] + dy * k]; };
      const [gax, gay] = grow(ax, ay), [gbx, gby] = grow(bx, by), z = Py.top - EAVE * Math.tan(PITCH); tri(slates, V(gbx, gby, z), V(gax, gay, z), apex); }
    const s = new THREE.SphereGeometry(0.22, 10, 8); s.translate(apex.x, apex.y + 0.3, apex.z); stones.push(s.toNonIndexed()); }
  // the stacks: a base through the roof, then a shaft for each flue, each with its cap
  for (const s of shell.stacks) { const along = s.along === "x", n = s.flues, sw = SHAFT, gp = SHAFT_GAP, run = runOf(s), c = s.c, shaftH = 1.1;
    const baseTop = s.z1 - shaftH, mid = along ? (s.y0 + s.y1) / 2 : (s.x0 + s.x1) / 2, B = baseOf(s);
    box(stones, B.x0, B.x1, B.y0, B.y1, s.z0, baseTop);
    for (let i = 0; i < n; i++) { const a = c - run / 2 + i * (sw + gp);
      // (each shaft let 5 cm into the base and 4 cm into its cap: its foot and head on their faces shared those faces' planes)
      if (along) { box(stones, a, a + sw, mid - sw / 2, mid + sw / 2, baseTop - 0.05, s.z1 + 0.04); box(stones, a - 0.05, a + sw + 0.05, mid - sw / 2 - 0.05, mid + sw / 2 + 0.05, s.z1, s.z1 + 0.12); }
      else { box(stones, mid - sw / 2, mid + sw / 2, a, a + sw, baseTop - 0.05, s.z1 + 0.04); box(stones, mid - sw / 2 - 0.05, mid + sw / 2 + 0.05, a - 0.05, a + sw + 0.05, s.z1, s.z1 + 0.12); } } }
  // the windows from outside: glass a little in from the wall's face, facing out (so it never shows from within), a
  // stone mullion and transom across it; the pane half a centimetre in from the face and 2 cm into the jambs, head and sill
  // all round (2.5 cm in and 2 cm short, the room's lit plaster reveal had shown round every window as a white rim once
  // rooms were drawn from outside, R67)
  for (const w of windows) { const out = w.c.clone().sub(w.into).normalize(), at = w.c.clone().addScaledVector(out, 0.035), atPane = w.c.clone().addScaledVector(out, 0.055);
    const g = new THREE.PlaneGeometry(w.w + 0.24, w.h + 0.14), m = new THREE.Matrix4().lookAt(new THREE.Vector3(), out, new THREE.Vector3(0, 1, 0)); m.setPosition(atPane);
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI)); g.applyMatrix4(m); panes.push(g.toNonIndexed());
    // (the transom a centimetre shallower than the mullion: crossing on one plane, their faces flickered)
    for (const bx of [new THREE.BoxGeometry(0.1, w.h + 0.06, 0.12), new THREE.BoxGeometry(w.w + 0.16, 0.09, 0.11)]) { const p = at.clone().addScaledVector(out, 0.03);
      bx.translate(0, bx === undefined ? 0 : (bx.parameters.height < 0.1 ? (w.h + 0.06) * 0.12 : 0), 0); const mm = new THREE.Matrix4().lookAt(new THREE.Vector3(), out, new THREE.Vector3(0, 1, 0)); mm.setPosition(p); bx.applyMatrix4(mm); bars.push(bx.toNonIndexed()); }
    // a stone frame round the opening's edge, 5 cm into it and a centimetre onto the wall, a little shallower than the mullion
    // (once rooms were drawn from outside, the room's lit reveal showed round the glass as a white rim, R67; a hairline
    // stays close up at a slant, where the carve leaves no jamb between the face and the room's lining: a frame 35 cm deep
    // closed it but stood in the room's own reveal, seen from inside)
    { const fx = w.w / 2 + 0.08, fy = w.h / 2 + 0.03, p = at.clone().addScaledVector(out, 0.03), mm = new THREE.Matrix4().lookAt(new THREE.Vector3(), out, new THREE.Vector3(0, 1, 0)); mm.setPosition(p);
      for (const [sx, sy, wd, ht] of [[fx, 0, 0.06, w.h + 0.2], [-fx, 0, 0.06, w.h + 0.2], [0, fy, w.w + 0.22, 0.06], [0, -fy, w.w + 0.22, 0.06]]) {
        const bx = new THREE.BoxGeometry(wd, ht, 0.1); bx.translate(sx, sy, 0); bx.applyMatrix4(mm); bars.push(bx.toNonIndexed()); } } }
  const add = (list, mat, cast = true) => { if (!list.length) return; const g = mergeGeometries(list.map(q => { q.deleteAttribute?.("normal"); if (!q.attributes.uv) q.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; }), false); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = true; G.add(m); return m; };
  // the plinth: a base course round the footprint, 4 cm proud of the wall, from well below ground to 0.4 m, its top
  // weathered back to the wall (the ground under the house goes down out of the floors' way, and where its coarser tiles
  // spread that dip past the wall's foot, daylight showed under the wall: 2026-10-07, "cutting an open hole")
  // It runs round the footprints together, as one outline: where one footprint's edge lies inside another (the house's
  // front behind the porch, the porch's back inside the house's wall) it is no outside face, and its course had stood
  // across the front door's foot inside the porch and along the screens passage's skirting ("outer blocks stuck inside",
  // Kabe, R59). Each edge keeps the stretches whose middle lies outside every other footprint.
  const feet = shell.footprints || [];
  const within = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[i], [bx, by] = poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
  const cross = (ax, ay, bx, by, cx, cy, dx, dy) => { const den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (Math.abs(den) < 1e-12) return null;
    const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den; return t > 1e-6 && t < 1 - 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 ? t : null; };
  for (const [pi, poly] of feet.entries()) { const ccw = poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0) > 0, n = poly.length, others = feet.filter((_, k) => k !== pi);
    for (let i = 0; i < n; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % n], L = Math.hypot(bx - ax, by - ay); if (L < 0.01) continue;
      const ox = (by - ay) / L * (ccw ? 1 : -1), oy = -(bx - ax) / L * (ccw ? 1 : -1), o = 0.04;   // outward normal
      const ts = [0, 1]; for (const q of others) for (let k = 0; k < q.length; k++) { const t = cross(ax, ay, bx, by, ...q[k], ...q[(k + 1) % q.length]); if (t != null) ts.push(t); }
      ts.sort((p, q) => p - q);
      for (let k = 0; k + 1 < ts.length; k++) { const t0 = ts[k], t1 = ts[k + 1]; if ((t1 - t0) * L < 0.01) continue;
        const mx = ax + (bx - ax) * (t0 + t1) / 2 + ox * 0.01, my = ay + (by - ay) * (t0 + t1) / 2 + oy * 0.01; if (others.some(q => within(q, mx, my))) continue;
        // the corners run on by the plinth's own projection (only at the edge's own ends: a stretch cut by another
        // footprint stops at its wall)
        const ea = t0 === 0 ? 0.04 : 0, eb = t1 === 1 ? 0.04 : 0, ux = (bx - ax) / L, uy = (by - ay) / L;
        const a0 = [ax + (bx - ax) * t0, ay + (by - ay) * t0], b0 = [ax + (bx - ax) * t1, ay + (by - ay) * t1], l = (t1 - t0) * L;
        const A = [a0[0] - ux * ea + ox * o, a0[1] - uy * ea + oy * o], B = [b0[0] + ux * eb + ox * o, b0[1] + uy * eb + oy * o];
        quad(stones, V(A[0], A[1], -1.6), V(B[0], B[1], -1.6), V(B[0], B[1], 0.36), V(A[0], A[1], 0.36), [[0, -1.6], [l, -1.6], [l, 0.36], [0, 0.36]]);
        quad(stones, V(A[0], A[1], 0.36), V(B[0], B[1], 0.36), V(b0[0] + ux * eb, b0[1] + uy * eb, 0.42), V(a0[0] - ux * ea, a0[1] - uy * ea, 0.42)); } } }
  add(slates, slate); add(stones, stone); add(bars, mullion); add(panes, glass, false);
  return G;
}
