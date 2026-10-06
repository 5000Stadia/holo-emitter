// Shape parts: one primitive each (a turned profile, a cylinder, a box, a ring, a ball, a cone), so a
// small thing can be written as data: what shape, how big, which material role, where. A box or a
// cylinder stands on its "at" (its bottom's middle); a ring, a ball or a cone is centred on it. "ops"
// turn and move it further, in order: ["rx"|"ry"|"rz", radians] or ["t", x, y, z] or ["s", x, y, z].
import { definePart } from "../catalogue.js";
import { mirror } from "../../../lab/painted/procedural.js";

function place(g, { at = [0, 0, 0], ops = [] }) {
  g.translate(...at);
  for (const [op, ...a] of ops) {
    if (op === "rx") g.rotateX(a[0]); else if (op === "ry") g.rotateY(a[0]); else if (op === "rz") g.rotateZ(a[0]);
    else if (op === "t") g.translate(...a); else if (op === "s") mirror(g, ...a);     // a mirroring scale keeps its faces outward
  }
  return g;
}
const shape = (make) => ({ build(c, p) { const g = place(make(c.THREE, p), p); c.add(g, p.role, { mover: p.mover || null, spread: p.spread ?? 0.1 }); } });

definePart("lathe", shape((THREE, { profile, segments = 20 }) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments)));
definePart("cylinder", shape((THREE, { r, r_top = r, h, segments = 12 }) => { const g = new THREE.CylinderGeometry(r_top, r, h, segments); g.translate(0, h / 2, 0); return g; }));
definePart("box", shape((THREE, { size: [w, h, d] }) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return g; }));
definePart("torus", shape((THREE, { r, tube, radial = 6, tubular = 14, arc = Math.PI * 2 }) => new THREE.TorusGeometry(r, tube, radial, tubular, arc)));
definePart("sphere", shape((THREE, { r, w = 16, h = 10, phi = 0, phi_len = Math.PI * 2, theta = 0, theta_len = Math.PI, scale = [1, 1, 1] }) => { const g = new THREE.SphereGeometry(r, w, h, phi, phi_len, theta, theta_len); g.scale(...scale); return g; }));
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
  // the inside faces, a shade apart, so the hollow reads as one
  const g = new THREE.BoxGeometry(w - 2 * t - 0.002, 0.002, d - 2 * t - 0.002); g.translate(x, y + t + 0.001, z + (open === "front" ? t / 2 : 0)); c.add(g, inside, { mover, spread: 0.05 });
} });
