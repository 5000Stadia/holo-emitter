// Shape parts: one primitive each (a turned profile, a cylinder, a box, a ring, a ball, a cone), so a
// small thing can be written as data: what shape, how big, which material role, where. A box or a
// cylinder stands on its "at" (its bottom's middle); a ring, a ball or a cone is centred on it. "ops"
// turn and move it further, in order: ["rx"|"ry"|"rz", radians] or ["t", x, y, z] or ["s", x, y, z].
import { definePart } from "../catalogue.js";

function place(g, { at = [0, 0, 0], ops = [] }) {
  g.translate(...at);
  for (const [op, ...a] of ops) {
    if (op === "rx") g.rotateX(a[0]); else if (op === "ry") g.rotateY(a[0]); else if (op === "rz") g.rotateZ(a[0]);
    else if (op === "t") g.translate(...a); else if (op === "s") g.scale(...a);
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
