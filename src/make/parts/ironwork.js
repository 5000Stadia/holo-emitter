// Ironwork parts: bands round a box (split where its lid opens), hasps and padlocks, end handles,
// strap hinges and nails on a leaf, a stock lock with its ring. Frames as in joinery.js.
import { definePart } from "../catalogue.js";
import { plainBox } from "./joinery.js";
import { ring } from "./shapes.js";

const nail = (THREE, x, y, z, r = 0.008) => { const h = new THREE.ConeGeometry(r, r * 0.9, 4); h.rotateX(Math.PI / 2); h.rotateZ(Math.PI / 4); h.translate(x, y, z); return h; };

// Bands across a lidded box: up the front, over the lid and down the back as hinges; a band round the
// foot; angle irons up each corner; nails along the front. The lid's share rides on the lid's mover.
definePart("box_bands", {
  build(c, { w, d, h, at = [-0.36, 0, 0.36], skids = true, lid = "lid" }) {
    const { THREE } = c, sk = skids ? 0.05 : 0, lidH = 0.045, top = h - lidH, fz = d + 0.003;
    const box = (bw, bh, bd, x, y, z, o = {}) => c.add(plainBox(THREE, bw, bh, bd, x, y, z), "iron", { spread: 0.2, ...o });
    for (const f of at) {
      const x = f * w;
      box(0.045, top - sk, 0.006, x, sk + (top - sk) / 2, fz);                                  // up the front
      box(0.045, lidH, 0.006, x, top + lidH / 2, fz + 0.015, { mover: lid });                // the lid's edge
      box(0.045, 0.006, d + 0.035, x, h + 0.003, d / 2, { mover: lid });                       // over the lid
      box(0.045, 0.06, 0.006, x, top - 0.02, -0.004, { mover: lid });                          // the hinge strap behind
      for (let y = sk + 0.07; y < top - 0.03; y += 0.1) c.add(nail(THREE, x, y, fz + 0.006, 0.007), "iron", { spread: 0.3 });
    }
    box(w + 0.01, 0.04, 0.006, 0, sk + 0.05, fz + 0.001);
    for (const sx of [-1, 1]) for (const z of [0.02, d - 0.02]) box(0.006, top - sk - 0.01, 0.05, sx * (w / 2 + 0.003), sk + (top - sk) / 2, z);
  },
});

// Hasps hanging from the lid's front edge over staples, and a padlock through each. Unlocked, the
// padlocks hang open on their shackles (the mover "locks", hinged along the staples' line).
definePart("hasp_locks", {
  build(c, { w, d, h, at = [-0.18, 0.18], lid = "lid", locks = "locks" }) {
    const { THREE } = c, fz = d + 0.003, sy = h - 0.13;
    c.mover(locks, [0, sy, fz + 0.02]);
    for (const f of at) {
      const x = f * w;
      c.add(plainBox(THREE, 0.04, 0.14, 0.008, x, h - 0.06, fz + 0.006), "iron", { mover: lid, spread: 0.2 });   // the hasp
      c.add(plainBox(THREE, 0.016, 0.02, 0.02, x, sy, fz + 0.01), "iron", { spread: 0.2 });                     // the staple
      c.add(plainBox(THREE, 0.07, 0.07, 0.025, x, sy - 0.045, fz + 0.025), "iron", { mover: locks, spread: 0.2 }); // the padlock
      const sh = ring(THREE, 0.022, 0.005, 6, 16, Math.PI); sh.translate(x, sy - 0.01, fz + 0.025);
      c.add(sh, "iron", { mover: locks, spread: 0.2 });
      c.add(plainBox(THREE, 0.008, 0.016, 0.004, x, sy - 0.05, fz + 0.039), "dark", { mover: locks });           // the keyhole
    }
  },
});

// An iron loop handle at each end of a box
definePart("end_handles", {
  build(c, { w, d, h }) {
    const { THREE } = c;
    for (const sx of [-1, 1]) { const g = ring(THREE, 0.05, 0.007, 6, 16, Math.PI); g.rotateZ(Math.PI); g.rotateY(Math.PI / 2); g.translate(sx * (w / 2 + 0.004), h * 0.62, d / 2); c.add(g, "iron", { spread: 0.2 }); }
  },
});

// Strap hinges across a door leaf with rounded ends, nails along them and in rows between, on the
// leaf's mover; a stock lock (an oak block under an iron plate) and a ring to pull it by.
definePart("leaf_ironwork", {
  build(c, { w, h, set = -0.12, mover = "leaf", seed_name = "nails" }) {
    const { THREE } = c, iz = set + 0.004, n = Math.max(4, Math.round(w / 0.17)), bw = w / n, r = c.r(seed_name);
    const straps = [0.28, h / 2, h - 0.3];
    for (const y of straps) {
      c.add(plainBox(THREE, w - 0.05, 0.055, 0.008, (w - 0.05) / 2 + 0.01, y, iz), "iron", { mover, spread: 0.2 });
      const end = new THREE.CylinderGeometry(0.04, 0.04, 0.008, 16); end.rotateX(Math.PI / 2); end.translate(w - 0.06, y, iz); c.add(end, "iron", { mover, spread: 0.2 });
      for (let x = 0.06; x < w - 0.05; x += 0.12) c.add(nail(THREE, x, y, iz + 0.008, 0.009), "iron", { mover, spread: 0.3 });
    }
    for (let y = 0.15; y < h - 0.1; y += 0.16) for (let i = 0; i <= n; i++) {
      if (straps.some(s => Math.abs(s - y) < 0.07)) continue;
      c.add(nail(THREE, i * bw + (i === 0 ? 0.03 : i === n ? -0.03 : 0), y + (r() - 0.5) * 0.01, set + 0.004), "iron", { mover, spread: 0.3 });
    }
    const lx = w - 0.17, ly = 1.02;
    c.add(plainBox(THREE, 0.3, 0.2, 0.07, lx, ly, iz + 0.035), "wood_face", { mover, spread: 0.2 });
    c.add(plainBox(THREE, 0.2, 0.13, 0.006, lx, ly, iz + 0.073), "iron", { mover, spread: 0.15 });
    c.add(plainBox(THREE, 0.012, 0.03, 0.004, lx + 0.02, ly - 0.01, iz + 0.077), "dark", { mover });
    const kh = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10); kh.rotateX(Math.PI / 2); kh.translate(lx + 0.02, ly + 0.008, iz + 0.077); c.add(kh, "dark", { mover });
    const ring = new THREE.TorusGeometry(0.055, 0.007, 8, 24); ring.translate(lx - 0.06, ly - 0.16, iz + 0.012); c.add(ring, "iron", { mover, spread: 0.2 });
  },
});
