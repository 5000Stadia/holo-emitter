// Shape parts: one primitive each (a turned profile, a cylinder, a box, a ring, a ball, a cone), so a
// small thing can be written as data: what shape, how big, which material role, where. A box or a
// cylinder stands on its "at" (its bottom's middle); a ring, a ball or a cone is centred on it. "ops"
// turn and move it further, in order: ["rx"|"ry"|"rz", radians] or ["t", x, y, z] or ["s", x, y, z].
import { definePart } from "../catalogue.js";
import { mirror } from "../../../lab/painted/procedural.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Every shape is a closed solid with its faces outward, whatever the recipe wrote (src/make/mesh-rules.js;
// Kabe, 2026-10-06: "preventative principles"): a turned profile is closed to its axis at both ends and
// turned so its faces look out; a part-ring is capped at its cut ends; a dome is closed by a disc.
export function soundProfile(profile) {
  const p = profile.map(([r, y]) => [r, y]);
  if (p[0][0] > 1e-6) p.unshift([0, p[0][1]]);
  if (p[p.length - 1][0] > 1e-6) p.push([0, p[p.length - 1][1]]);
  // traced the wrong way round (down the outside, up the inside) its faces would look in: reverse it
  let a = 0; for (let i = 0; i < p.length; i++) { const [r0, y0] = p[i], [r1, y1] = p[(i + 1) % p.length]; a += r0 * y1 - r1 * y0; }
  return a < 0 ? p.reverse() : p;
}
// a fan of triangles over a closed ring of points about its centre, facing along n
function capFan(THREE, centre, ring, n) {
  const pos = [];
  for (let i = 0; i < ring.length; i++) { let a = ring[i], b = ring[(i + 1) % ring.length];
    const e1 = a.clone().sub(centre), e2 = b.clone().sub(centre); if (e1.clone().cross(e2).dot(n) < 0) [a, b] = [b, a];
    pos.push(centre.x, centre.y, centre.z, a.x, a.y, a.z, b.x, b.y, b.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: pos.length / 3 }, () => [n.x, n.y, n.z]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
  return g;
}
const withCaps = (g, caps) => caps.length ? mergeGeometries([g.index ? g.toNonIndexed() : g, ...caps], false) : g;

function place(g, { at = [0, 0, 0], ops = [] }) {
  g.translate(...at);
  for (const [op, ...a] of ops) {
    if (op === "rx") g.rotateX(a[0]); else if (op === "ry") g.rotateY(a[0]); else if (op === "rz") g.rotateZ(a[0]);
    else if (op === "t") g.translate(...a); else if (op === "s") mirror(g, ...a);     // a mirroring scale keeps its faces outward
  }
  return g;
}
const shape = (make) => ({ build(c, p) { const g = place(make(c.THREE, p), p); c.add(g, p.role, { mover: p.mover || null, spread: p.spread ?? 0.1 }); } });

// a turned solid, closed and facing out, from a profile [[r, y], …] or Vector2s
export const turned = (THREE, profile, segments = 20) => new THREE.LatheGeometry(soundProfile(profile.map(p => Array.isArray(p) ? p : [p.x, p.y])).map(([r, y]) => new THREE.Vector2(r, y)), segments);
definePart("lathe", shape((THREE, { profile, segments = 20 }) => turned(THREE, profile, segments)));
definePart("cylinder", shape((THREE, { r, r_top = r, h, segments = 12 }) => { const g = new THREE.CylinderGeometry(r_top, r, h, segments); g.translate(0, h / 2, 0); return g; }));
definePart("box", shape((THREE, { size: [w, h, d] }) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return g; }));
// a ring, or a part of one capped at its cut ends
export function ring(THREE, r, tube, radial = 6, tubular = 14, arc = Math.PI * 2) {
  const g = new THREE.TorusGeometry(r, tube, radial, tubular, arc);
  if (arc >= Math.PI * 2 - 1e-6) return g;
  // the cut ends of a part-ring, capped: the tube's circle at each end, facing out along the ring
  const end = (u, out) => { const ring = []; for (let k = 0; k < radial; k++) { const v = k / radial * Math.PI * 2;
      ring.push(new THREE.Vector3((r + tube * Math.cos(v)) * Math.cos(u), (r + tube * Math.cos(v)) * Math.sin(u), tube * Math.sin(v))); }
    const t = new THREE.Vector3(-Math.sin(u), Math.cos(u), 0).multiplyScalar(out);
    return capFan(THREE, new THREE.Vector3(r * Math.cos(u), r * Math.sin(u), 0), ring, t); };
  return withCaps(g, [end(0, -1), end(arc, 1)]);
}
definePart("torus", shape((THREE, { r, tube, radial = 6, tubular = 14, arc = Math.PI * 2 }) => ring(THREE, r, tube, radial, tubular, arc)));
definePart("sphere", shape((THREE, { r, w = 16, h = 10, phi = 0, phi_len = Math.PI * 2, theta = 0, theta_len = Math.PI, scale = [1, 1, 1] }) => {
  let g = new THREE.SphereGeometry(r, w, h, phi, phi_len, theta, theta_len);
  // a dome (cut across, all the way round) closed by a disc at its cut
  if (theta === 0 && theta_len < Math.PI - 1e-6 && phi_len >= Math.PI * 2 - 1e-6) {
    const y = r * Math.cos(theta_len), rr = r * Math.sin(theta_len), ring = [];
    for (let k = 0; k < w; k++) { const a = k / w * Math.PI * 2; ring.push(new THREE.Vector3(-rr * Math.cos(a), y, rr * Math.sin(a))); }
    g = withCaps(g, [capFan(THREE, new THREE.Vector3(0, y, 0), ring, new THREE.Vector3(0, -1, 0))]);
  }
  g.scale(...scale); return g; }));
definePart("cone", shape((THREE, { r, h, segments = 8 }) => new THREE.ConeGeometry(r, h, segments)));

// a mover declared in data, for the shapes after it to ride: a lid on its hinge, a globe on its axis
definePart("mover", { build(c, { name, pivot = [0, 0, 0] }) { c.mover(name, pivot); } });

// a mover that turns steadily while an affordance stands moved (a spit while the jack runs): an
// animation, so it costs nothing while the thing is out of sight
definePart("spinner", { build(c, { mover, axis = [1, 0, 0], rate = 1.2, when }) {
  const v = new c.THREE.Vector3(...axis).normalize(); let last = null;
  c.animate((t, isMoved, level, movers) => { const g = movers.get(mover); if (!g) return; if (isMoved(when) && last != null) g.rotateOnAxis(v, (t - last) * rate); last = t; });
} });

// a hollow case, standing on its "at" like a box, open on one side ("top" or "front", +z): four or five
// boards of thickness t and a floor, its inside in the inside role. A lid or a door that opens shows an
// inside, not a solid (Kabe, 2026-10-06, of a powdering tub: "not hollow inside").
definePart("carcass", { build(c, { size: [w, h, d], at = [0, 0, 0], open = "top", t = 0.02, role = "wood", inside = "wood_inside", mover = null }) {
  const { THREE } = c, [x, y, z] = at, add = (bw, bh, bd, bx, by, bz, r) => { const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(x + bx, y + by, z + bz); c.add(g, r, { mover, spread: 0.1 }); };
  add(w, t, d, 0, t / 2, 0, role);                                                          // the floor
  add(t, h, d, -w / 2 + t / 2, h / 2, 0, role); add(t, h, d, w / 2 - t / 2, h / 2, 0, role);   // the ends
  add(w - 2 * t, h, t, 0, h / 2, -d / 2 + t / 2, role);                                       // the back
  if (open === "top") add(w - 2 * t, h, t, 0, h / 2, d / 2 - t / 2, role); else add(w, t, d, 0, h - t / 2, 0, role);   // the front, or the top
  // its hollow, for parts after it to meet or fill (a shelf, the bedding, the brine)
  const fz = open === "front" ? 0 : t;
  c.name("inside", [x - w / 2 + t, y + t + 0.002, z - d / 2 + t], [x + w / 2 - t, y + (open === "top" ? h : h - t), z + d / 2 - fz]);
  // the inside faces, a shade apart, so the hollow reads as one
  const g = new THREE.BoxGeometry(w - 2 * t - 0.002, 0.002, d - 2 * t - 0.002); g.translate(x, y + t + 0.001, z + (open === "front" ? t / 2 : 0)); c.add(g, inside, { mover, spread: 0.05 });
} });

// A cloth laid over a table's top, hanging to drop below it on every side, one piece with its pattern laid
// once across it (Kabe, 2026-10-06: the carpet as five stretched boxes "looks lame and cheap"). The top lies
// flat, the sides fall straight a hand off the table's edge, and at each corner the cloth gathers into a
// fold; it is a thin closed sheet (two faces and a hem). w, d: the top it covers; at: the middle of that top's
// surface; drop: how far it hangs; off: how far out from the edge it falls; design: "turkey" (drawn here, a
// Turkey table carpet of the 1600s: border and guards, a madder field of star medallions)
definePart("drape", { build(c, { w, d, at = [0, 0, 0], drop = 0.3, off = 0.025, thick = 0.004, design = "turkey", segs = 0.04 }) {
  const { THREE } = c, a = w / 2 + off, b = d / 2 + off, SW = 2 * (a + drop), SD = 2 * (b + drop);
  const nu = Math.max(8, Math.ceil(SW / segs)), nv = Math.max(8, Math.ceil(SD / segs));
  // a point of the flat cloth (s across, t along its depth, from its middle) to where it hangs
  const hang = (s, t, lift) => { const ds = Math.max(0, Math.abs(s) - a), dt = Math.max(0, Math.abs(t) - b), ss = Math.sign(s) || 1, st = Math.sign(t) || 1;
    if (!ds && !dt) return [s, lift, t];
    if (!dt) return [ss * (a + lift), -ds, t];
    if (!ds) return [s, -dt, st * (b + lift)];
    // the corner: the cloth falls the longer way, gathered into a fold that stands out a little along the diagonal
    // (its two halves, one from each side, stand a little apart across the fold and meet only along its line: computed
    // alike they lay one on the other and flickered, 2026-10-06)
    const r = Math.hypot(ds, dt), bulge = 0.35 * Math.min(ds, dt) + lift, pleat = 0.12 * Math.min(ds, dt) * Math.cos(2 * Math.atan2(dt, ds)) * 0.707;
    return [ss * (a + bulge * 0.7 + pleat), -r, st * (b + bulge * 0.7 - pleat)]; };
  const pos = [], uv = [], face = (lift, flip) => { for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([u, v]) => ({ u: u / nu, v: v / nv, p: hang(-SW / 2 + u / nu * SW, -SD / 2 + v / nv * SD, lift) }));
      for (const [x, y, z] of flip ? [[0, 2, 1], [0, 3, 2]] : [[0, 1, 2], [0, 2, 3]]) for (const k of [x, y, z]) { pos.push(q[k].p[0], q[k].p[1], q[k].p[2]); uv.push(q[k].u, 1 - q[k].v); } } };
  face(thick, true); face(0, false);
  // the hem: round the cloth's edge, joining its two faces
  const edge = []; for (let i = 0; i < nu; i++) edge.push([i / nu, 0]); for (let j = 0; j < nv; j++) edge.push([1, j / nv]); for (let i = nu; i > 0; i--) edge.push([i / nu, 1]); for (let j = nv; j > 0; j--) edge.push([0, j / nv]);
  for (let k = 0; k < edge.length; k++) { const [u0, v0] = edge[k], [u1, v1] = edge[(k + 1) % edge.length], P = (u, v, l) => hang(-SW / 2 + u * SW, -SD / 2 + v * SD, l);
    const A = P(u0, v0, 0), B = P(u1, v1, 0), C = P(u1, v1, thick), D = P(u0, v0, thick);
    for (const p of [A, C, B, A, D, C]) { pos.push(...p); uv.push(u0, 1 - v0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); g.translate(at[0], at[1], at[2]);
  c.add(g, clothOf(THREE, design, SW, SD), { spread: 0 });
} });

// a Turkey table carpet drawn for a cloth of SW × SD metres: a dark border with a gold running line between
// guards, a madder field set with rows of star medallions and small rosettes between (Holbein / Lotto Ushak
// carpets laid on tables in English inventories, 1600s); made once per size
const CLOTHS = new Map();
function clothOf(THREE, design, SW, SD) {
  const key = `${design}:${SW.toFixed(2)}:${SD.toFixed(2)}`; if (CLOTHS.has(key)) return CLOTHS.get(key);
  const px = 360, cv = document.createElement("canvas"); cv.width = Math.min(2048, Math.round(SW * px)); cv.height = Math.min(1024, Math.round(SD * px));
  const g = cv.getContext("2d"), W = cv.width, H = cv.height, m = W / SW, B = 0.11 * m;
  const star = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 16; k++) { const an = k / 16 * Math.PI * 2, rr = k % 2 ? r * 0.55 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); };
  const lozenge = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - rx, y); g.lineTo(x, y - ry); g.lineTo(x + rx, y); g.lineTo(x, y + ry); g.closePath(); g.fill(); };
  // the field
  g.fillStyle = "#7c2320"; g.fillRect(0, 0, W, H);
  const fx0 = B, fy0 = B, fx1 = W - B, fy1 = H - B, step = 0.36 * m;
  for (let y = fy0 + step / 2, row = 0; y < fy1; y += step, row++) for (let x = fx0 + step / 2 + (row % 2) * step / 2; x < fx1 - step / 4; x += step) {
    star(x, y, step * 0.3, "#1f2a52"); star(x, y, step * 0.2, "#c99a3c"); star(x, y, step * 0.09, "#7c2320"); lozenge(x, y, step * 0.04, step * 0.04, "#e8d8b0"); }
  for (let y = fy0 + step, row = 0; y < fy1 - step / 3; y += step, row++) for (let x = fx0 + step + (row % 2) * step / 2; x < fx1 - step / 3; x += step) lozenge(x - step / 2, y - step / 2, step * 0.07, step * 0.07, "#d8b060");
  // the border and its guards
  g.fillStyle = "#1a1f36"; g.fillRect(0, 0, W, B); g.fillRect(0, H - B, W, B); g.fillRect(0, 0, B, H); g.fillRect(W - B, 0, B, H);
  g.strokeStyle = "#c99a3c"; g.lineWidth = Math.max(2, 0.008 * m); g.strokeRect(B * 0.18, B * 0.18, W - B * 0.36, H - B * 0.36); g.strokeRect(B * 0.92, B * 0.92, W - B * 1.84, H - B * 1.84);
  g.strokeStyle = "#e8d8b0"; g.lineWidth = Math.max(1, 0.004 * m); g.strokeRect(B, B, W - 2 * B, H - 2 * B);
  for (const [x0, y0, x1, y1] of [[B, B / 2, W - B, B / 2], [B, H - B / 2, W - B, H - B / 2], [B / 2, B, B / 2, H - B], [W - B / 2, B, W - B / 2, H - B]]) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (0.12 * m)));
    for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; lozenge(x, y, B * 0.22, B * 0.22, "#a8302a"); lozenge(x, y, B * 0.1, B * 0.1, "#c99a3c"); } }
  // the knotted pile: a faint weave
  g.globalAlpha = 0.1; g.fillStyle = "#000"; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); mat.userData.cls = "carpet";
  CLOTHS.set(key, mat); return mat;
}
