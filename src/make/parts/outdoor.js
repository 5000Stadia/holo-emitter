// Parts for what stands outside a house c.1660 (R46; design/outdoor/research-1660.md §A, on Beauchief Hall's forecourt:
// "a pair of wrought-iron gates with an overthrow", ashlar piers). Frames as in joinery.js: standing on y = 0, the
// thing's front facing +z.
import { definePart } from "../catalogue.js";
import { plainBox } from "./joinery.js";
import { ring } from "./shapes.js";

// one leaf of a wrought-iron gate, hung on its hinge stile at x = x0 and reaching w along +x (or along -x, mirrored): a
// frame of flat bar, round uprights at a hand's spacing with spear heads above the top rail, dog bars between the
// lower uprights, a scroll in each upper corner; it swings on `mover` about its hinge stile
definePart("iron_gate_leaf", {
  build(c, { w, h, mirror = false, mover = "leaf", x0 = 0, z = 0 }) {
    const { THREE } = c, sg = mirror ? -1 : 1, X = (x) => x0 + sg * x, bar = 0.022, flat = 0.05;
    c.mover(mover, [x0, 0, z]);
    const add = (g) => c.add(g, "iron", { mover, spread: 0.15 });
    const box = (bw, bh, bd, x, y) => add(plainBox(THREE, bw, bh, bd, X(x), y, z));
    box(flat, h, flat, flat / 2, h / 2); box(flat, h * 0.9, flat * 0.8, w - flat / 2, h * 0.45);            // hinge stile, meeting stile
    for (const y of [0.08, h * 0.45, h * 0.86]) box(w - flat, flat * 0.7, flat * 0.6, w / 2, y);           // bottom, middle, top rails
    const n = Math.max(2, Math.round((w - flat) / 0.12));
    for (let i = 1; i < n; i++) { const x = flat / 2 + (w - flat) * i / n;
      const up = new THREE.CylinderGeometry(bar / 2, bar / 2, h * 0.86 + 0.14, 6); up.translate(X(x), (h * 0.86 + 0.14) / 2, z); add(up);
      const spear = new THREE.ConeGeometry(0.03, 0.11, 4); spear.rotateY(Math.PI / 4); spear.translate(X(x), h * 0.86 + 0.14 + 0.05, z); add(spear);
      if (i < n) { const dog = new THREE.CylinderGeometry(bar / 2.4, bar / 2.4, h * 0.3, 6); dog.translate(X(x - (w - flat) / n / 2), 0.08 + h * 0.15, z); add(dog); } }
    for (const [cx, sx] of [[flat + 0.16, 1], [w - flat - 0.16, -1]]) { const s = ring(THREE, 0.14, 0.011, 6, 18, Math.PI * 1.5); s.rotateZ(sx > 0 ? Math.PI : -Math.PI / 2); s.translate(X(cx), h * 0.86 - 0.16, z); add(s); }
    c.footprint({ w, h, d: 0.06 });
  },
});

// the overthrow: an arch of flat bar over a gateway between its piers, scrolled at its feet, a finial at its crown;
// it stands on the piers' caps (span w between their inner faces, rising `rise` over the springing at y = 0)
definePart("iron_overthrow", {
  build(c, { w, rise = 0.7, y0 = 0, z = 0 }) {
    const { THREE } = c, pts = [], n = 18;
    for (let i = 0; i <= n; i++) { const t = i / n, x = -w / 2 + w * t, y = rise * 4 * t * (1 - t); pts.push(new THREE.Vector3(x, y0 + y + 0.04, z)); }
    // the arch: round bar from point to point, each piece a closed rod, a little into the next
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1], L = a.distanceTo(b) + 0.012, rod = new THREE.CylinderGeometry(0.018, 0.018, L, 6);
      rod.rotateZ(-Math.atan2(b.x - a.x, b.y - a.y)); rod.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0); c.add(rod, "iron", { spread: 0.15 }); }
    const base = plainBox(THREE, w + 0.04, 0.05, 0.05, 0, y0 + 0.025, z); c.add(base, "iron", { spread: 0.15 });
    for (const sx of [-1, 1]) { const s = ring(THREE, 0.16, 0.012, 6, 18, Math.PI * 1.5); s.rotateZ(sx > 0 ? -Math.PI / 2 : Math.PI); s.translate(sx * w * 0.28, y0 + 0.2, z); c.add(s, "iron", { spread: 0.15 }); }
    const crown = new THREE.SphereGeometry(0.05, 8, 6); crown.translate(0, y0 + rise + 0.08, z); c.add(crown, "metal", { spread: 0.1 });
    c.footprint({ w, h: rise + 0.12, d: 0.05 });
  },
});
