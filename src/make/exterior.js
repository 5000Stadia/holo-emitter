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
    s.z0 = (home.length ? Math.max(...home.map(R => R.top)) : roof) - 0.6; s.z1 = Math.max(roof + 1.2, ridge + 1.4); }
  return { roofs, pyramids, stacks, roofZ };
}
const inside = (R, r) => r.x0 >= R.x0 - 0.01 && r.x1 <= R.x1 + 0.01 && r.y0 >= R.y0 - 0.01 && r.y1 <= R.y1 + 0.01;

// ---- built: geometry from the shell, a draw per material (slate, stone, glass)
export function buildShell(THREE, shell, { slate, stone, glass, mullion = stone, windows = [], mergeGeometries }) {
  const G = new THREE.Group(); G.name = "exterior";
  const slates = [], stones = [], panes = [], bars = [];
  const V = (x, y, z) => new THREE.Vector3(x, z, -y);
  // a quad as two triangles with uvs in metres (u along, v up the slope)
  const quad = (out, a, b, c, d, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap(p => [p.x, p.y, p.z]), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv ? [uv[0], uv[1], uv[2], uv[0], uv[2], uv[3]].flat() : [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)); g.computeVertexNormals(); out.push(g); };
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
      const a2 = P(e, ta, eaveZ - 0.14), b2 = P(e, tb, eaveZ - 0.14), w0 = P(sm - sg * (R.span / 2), ta, R.top), w1 = P(sm - sg * (R.span / 2), tb, R.top);
      if ((sg > 0) === X) { quad(stones, a2, b2, b, a); quad(stones, w0, w1, b2, a2); } else { quad(stones, b2, a2, a, b); quad(stones, w1, w0, a2, b2); }
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
  for (const s of shell.stacks) { const along = s.along === "x", n = s.flues, sw = 0.46, gp = 0.1, run = n * sw + (n - 1) * gp, c = s.c, shaftH = 1.1;
    const baseTop = s.z1 - shaftH, mid = along ? (s.y0 + s.y1) / 2 : (s.x0 + s.x1) / 2;
    if (along) box(stones, c - run / 2 - 0.12, c + run / 2 + 0.12, mid - 0.4, mid + 0.4, s.z0, baseTop); else box(stones, mid - 0.4, mid + 0.4, c - run / 2 - 0.12, c + run / 2 + 0.12, s.z0, baseTop);
    for (let i = 0; i < n; i++) { const a = c - run / 2 + i * (sw + gp);
      // (each shaft let 5 cm into the base and 4 cm into its cap: its foot and head on their faces shared those faces' planes)
      if (along) { box(stones, a, a + sw, mid - sw / 2, mid + sw / 2, baseTop - 0.05, s.z1 + 0.04); box(stones, a - 0.05, a + sw + 0.05, mid - sw / 2 - 0.05, mid + sw / 2 + 0.05, s.z1, s.z1 + 0.12); }
      else { box(stones, mid - sw / 2, mid + sw / 2, a, a + sw, baseTop - 0.05, s.z1 + 0.04); box(stones, mid - sw / 2 - 0.05, mid + sw / 2 + 0.05, a - 0.05, a + sw + 0.05, s.z1, s.z1 + 0.12); } } }
  // the windows from outside: glass a little in from the wall's face, facing out (so it never shows from within), a
  // stone mullion and transom across it
  for (const w of windows) { const out = w.c.clone().sub(w.into).normalize(), at = w.c.clone().addScaledVector(out, 0.035);
    const g = new THREE.PlaneGeometry(w.w + 0.16, w.h + 0.06), m = new THREE.Matrix4().lookAt(new THREE.Vector3(), out, new THREE.Vector3(0, 1, 0)); m.setPosition(at);
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI)); g.applyMatrix4(m); panes.push(g.toNonIndexed());
    // (the transom a centimetre shallower than the mullion: crossing on one plane, their faces flickered)
    for (const bx of [new THREE.BoxGeometry(0.1, w.h + 0.06, 0.12), new THREE.BoxGeometry(w.w + 0.16, 0.09, 0.11)]) { const p = at.clone().addScaledVector(out, 0.03);
      bx.translate(0, bx === undefined ? 0 : (bx.parameters.height < 0.1 ? (w.h + 0.06) * 0.12 : 0), 0); const mm = new THREE.Matrix4().lookAt(new THREE.Vector3(), out, new THREE.Vector3(0, 1, 0)); mm.setPosition(p); bx.applyMatrix4(mm); bars.push(bx.toNonIndexed()); } }
  const add = (list, mat, cast = true) => { if (!list.length) return; const g = mergeGeometries(list.map(q => { q.deleteAttribute?.("normal"); if (!q.attributes.uv) q.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); return q; }), false); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = true; G.add(m); return m; };
  add(slates, slate); add(stones, stone); add(bars, mullion); add(panes, glass, false);
  return G;
}
