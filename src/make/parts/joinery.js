// Joinery parts (code; the kinds that use them are data): a joined table's frame, a drawer that
// slides, a boarded box whose lid hinges, a door leaf of boards, shutters folding on a splay.
// Every part works in its thing's frame: back at z = 0 against a wall, front toward +z, x = 0 at
// the middle, the floor at y = 0 (a door or shutter: the wall's face at z = 0, into the wall -z).
import { definePart } from "../catalogue.js";
import { metric, metricAny, loft, rect } from "../../../lab/painted/procedural.js";

// a box with its arrises rolled by a few millimetres, as hands and years leave joinery
export function rolledBox(THREE, w, h, d, x, y, z) {
  const r = Math.min(0.004, w / 4, h / 4, d / 4), s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const b = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: 2, curveSegments: 3 });
  b.translate(0, 0, -(d - 2 * r) / 2); metricAny(b); b.translate(x, y, z);
  return b;
}
export const plainBox = (THREE, w, h, d, x, y, z) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); return g; };

// A drawer in an opening: front (a raised field, a turned knob), sides, back, a paler bottom; a dark
// cavity behind so the opening never shows through. Slides out along +z on the mover.
export function drawer(c, { w, h, d, x = 0, y, fz, mover, knob = true, field = true }) {
  const { THREE } = c, t = 0.014, box = (bw, bh, bd, bx, by, bz, role, mv = mover) => c.add(rolledBox(THREE, bw, bh, bd, bx, by, bz), role, { mover: mv });
  box(w - 0.006, h - 0.006, 0.028, x, y + h / 2, fz + 0.005, "wood_face");
  if (field) c.add((() => { const f = loft(THREE, rect(x - w / 2 + 0.03, x + w / 2 - 0.03, y + 0.018, y + h - 0.018), [[0, 0], [0.004, 0.003], [0.012, 0.005], [0.014, 0.005]], true, true); f.translate(0, 0, fz + 0.019); return f; })(), "wood_face", { mover, spread: 0.05 });
  if (knob) { const k = new THREE.LatheGeometry([[0, 0], [0.012, 0], [0.012, 0.004], [0.006, 0.01], [0.009, 0.018], [0.013, 0.026], [0.01, 0.032], [0, 0.034]].map(([r, yy]) => new THREE.Vector2(r, yy)), 16);
    k.rotateX(Math.PI / 2); k.translate(x, y + h / 2, fz + 0.024); c.add(k, "wood", { mover, spread: 0.05 }); }
  for (const sx of [-1, 1]) box(t, h - 0.02, d, x + sx * (w / 2 - 0.02), y + h / 2 - 0.005, fz - d / 2, "wood");
  box(w - 0.04, h - 0.02, t, x, y + h / 2 - 0.005, fz - d + t / 2, "wood");
  box(w - 0.04, 0.008, d, x, y + 0.008, fz - d / 2, "wood_inside");
  c.add(plainBox(THREE, w, h, 0.01, x, y + h / 2, fz - d - 0.012), "dark");
}

// A joined table, c. 1660: four turned baluster legs squared where the rails and stretchers join,
// stretchers low on all four sides, moulded aprons, a top overhanging; the front apron framed round
// a drawer, if it has one.
definePart("joined_table", {
  build(c, { W, D, H, drawer: hasDrawer = true, drawer_w = 0.62, drawer_h = 0.085 }) {
    const { THREE } = c, T = 0.032, AP = 0.12, LEG = 0.058, legH = H - T;
    const box = (w, h, d, x, y, z, role = "wood") => c.add(rolledBox(THREE, w, h, d, x, y, z), role);
    const prof = [[0, 0.1], [0.022, 0.1], [0.025, 0.12], [0.02, 0.15], [0.026, 0.2], [0.03, 0.26], [0.028, 0.31], [0.021, 0.36], [0.017, 0.4], [0.02, 0.43], [0.026, 0.46], [0.022, 0.49], [0.025, legH - AP - 0.02], [0.02, legH - AP], [0, legH - AP]].map(([r, y]) => new THREE.Vector2(r, y));
    for (const sx of [-1, 1]) for (const sz of [0, 1]) {
      const x = sx * (W / 2 - 0.05), z = sz ? D - 0.05 : 0.05;
      const l = new THREE.LatheGeometry(prof, 20); l.translate(x, 0, z); c.add(l, "wood", { spread: 0.1 });
      box(LEG, AP, LEG, x, legH - AP / 2, z); box(LEG, 0.1, LEG, x, 0.05, z);
    }
    box(W - 0.1, 0.035, 0.035, 0, 0.07, 0.05); box(W - 0.1, 0.035, 0.035, 0, 0.07, D - 0.05);
    for (const sx of [-1, 1]) box(0.035, 0.035, D - 0.1, sx * (W / 2 - 0.05), 0.07, D / 2);
    box(W - 0.1, AP, 0.022, 0, legH - AP / 2, 0.05);
    for (const sx of [-1, 1]) box(0.022, AP, D - 0.1, sx * (W / 2 - 0.05), legH - AP / 2, D / 2);
    const fz = D - 0.05;
    if (hasDrawer) {
      const dw = drawer_w, dh = drawer_h, y0 = legH - AP / 2 - dh / 2, side = (W - 0.1 - dw) / 2;
      for (const sx of [-1, 1]) box(side, AP, 0.022, sx * (dw / 2 + side / 2), legH - AP / 2, fz);
      box(dw, legH - (y0 + dh), 0.022, 0, (y0 + dh + legH) / 2, fz);
      box(dw, y0 - (legH - AP), 0.022, 0, (legH - AP + y0) / 2, fz);
      c.mover("drawer");
      drawer(c, { w: dw, h: dh, d: D - 0.12, y: y0, fz, mover: "drawer" });
      c.slot("drawer", [0, y0 + 0.016, fz - (D - 0.12) / 2], "drawer");
    } else box(W - 0.1, AP, 0.022, 0, legH - AP / 2, fz);
    c.add(plainBox(THREE, W + 0.06, T, D + 0.04, 0, legH + T / 2, D / 2 + 0.01), "wood_face", { spread: 0.1 });
    c.slot("top", [0, H, D / 2]);
    c.footprint({ w: W + 0.06, d: D + 0.04, h: H, top: H });
  },
});

// A boarded box with a lid hinged at the back: skids, wide planks on the front, a hollow inside of
// paler wood, a lid with a moulded edge that turns up on the mover "lid".
definePart("boarded_box", {
  build(c, { w, d, h, skids = true, planks = 3, lid = "lid" }) {
    const { THREE } = c, t = 0.03, sk = skids ? 0.05 : 0, lidH = 0.045, bodyH = h - sk - lidH;
    const box = (bw, bh, bd, x, y, z, role = "wood", o = {}) => c.add(plainBox(THREE, bw, bh, bd, x, y, z), role, o);
    if (skids) for (const sx of [-1, 1]) box(0.08, sk, d, sx * (w / 2 - 0.1), sk / 2, d / 2, "wood_face");
    // the walls: planked front, plain back and ends, a floor; inside, paler and unwaxed
    for (let k = 0; k < planks; k++) box(w, bodyH / planks - 0.004, t, 0, sk + bodyH / planks * (k + 0.5), d - t / 2, "wood_face", { spread: 0.3 });
    box(w, bodyH, t, 0, sk + bodyH / 2, t / 2, "wood", { spread: 0.2 });
    for (const sx of [-1, 1]) box(t, bodyH, d - 2 * t, sx * (w / 2 - t / 2), sk + bodyH / 2, d / 2, "wood", { spread: 0.2 });
    box(w - 2 * t, t, d - 2 * t, 0, sk + t / 2, d / 2, "wood_inside");
    for (const sx of [-1, 1]) box(0.004, bodyH - t, d - 2 * t - 0.004, sx * (w / 2 - t - 0.002), sk + t + (bodyH - t) / 2, d / 2, "wood_inside");
    box(w - 2 * t - 0.008, bodyH - t, 0.004, 0, sk + t + (bodyH - t) / 2, t + 0.002, "wood_inside");
    box(w - 2 * t - 0.008, bodyH - t, 0.004, 0, sk + t + (bodyH - t) / 2, d - t - 0.002, "wood_inside");
    // the lid, hinged along the back edge of the top
    c.mover(lid, [0, sk + bodyH, 0]);
    box(w + 0.03, lidH, d + 0.03, 0, sk + bodyH + lidH / 2, d / 2, "wood_face", { mover: lid, spread: 0.2 });
    box(w - 0.02, 0.004, d - 0.02, 0, sk + bodyH - 0.002, d / 2, "wood_inside", { mover: lid });
    c.footprint({ w: w + 0.03, d: d + 0.03, h, inside: { x0: -w / 2 + t, x1: w / 2 - t, y0: sk + t, y1: sk + bodyH, z0: t, z1: d - t } });
  },
});

// A door leaf of vertical boards, set back in its reveal; it hinges on its left edge (as you face it
// from the room) and swings into the room on the mover "leaf". The thing's frame: x from 0 to the
// opening's width along the wall, the wall's face at z = 0, the leaf's face at z = set.
definePart("boarded_leaf", {
  build(c, { w, h, set = -0.12, thick = 0.055, mover = "leaf" }) {
    const { THREE } = c, n = Math.max(4, Math.round(w / 0.17)), bw = w / n;
    c.mover(mover, [0, 0, set]);
    for (let i = 0; i < n; i++) c.add(plainBox(THREE, bw - 0.004, h - 0.01, thick - (i % 2) * 0.004, bw * (i + 0.5), (h - 0.01) / 2, set - thick / 2), "door_wood", { mover, spread: 0.3 });
    c.footprint({ w, h, d: 0 });
  },
});

// Inside shutters on a splayed window: a leaf each side, hinged on its glass-side edge. Built closed,
// lying across the light; open, each has turned back into the room to lie flat on its splay (the
// kind's open_left / open_right angles, worked out by the place from the splay). Movers "left", "right".
// x0, x1: the light's inner edges; y0, y1: its sill and head; G: the glass plane (z < 0).
definePart("splay_shutters", {
  build(c, { x0, x1, y0, y1, G, clear = 0.08 }) {
    // hinged room-side of the window's iron (clear: from the glass past the bars), the leaf's
    // thickness toward the glass, so folded open it lies off the splay, not into it
    const { THREE } = c, lw = (x1 - x0) / 2, lh = y1 - y0 - 0.02, z = G + clear;
    for (const side of ["left", "right"]) {
      const a = side === "left" ? x0 : x1, dir = side === "left" ? 1 : -1;
      c.mover(side, [a, 0, z]);
      const g = plainBox(THREE, lw - 0.004, lh, 0.022, a + dir * lw / 2, y0 + 0.01 + lh / 2, z - 0.011);
      c.add(g, "wood", { mover: side, spread: 0.25 });
    }
    c.footprint({ w: x1 - x0, h: y1 - y0, d: 0 });
  },
});
// the angle that folds a shutter leaf from across the light back onto its splay: the splay runs from
// the light's edge (a, G) to the wall's face (b, 0)
export const shutterOpen = (side, a, b, G) => side === "left" ? Math.atan2(G, b - a) : Math.atan2(-G, a - b);

// A panelled door leaf for the rooms of a house: a frame of stiles and rails round raised panels (two
// tall over one short), a turned knob; hinged on its left edge, swinging into the room on "leaf".
definePart("panelled_leaf", {
  build(c, { w, h, set = -0.1, thick = 0.045, mover = "leaf" }) {
    const { THREE } = c, z = set - thick / 2, st = Math.min(0.11, w * 0.14);
    c.mover(mover, [0, 0, set]);
    const box = (bw, bh, bd, x, y, zz, role = "wood_face") => c.add(plainBox(THREE, bw, bh, bd, x, y, zz), role, { mover, spread: 0.18 });
    box(st, h - 0.01, thick, st / 2, (h - 0.01) / 2, z); box(st, h - 0.01, thick, w - st / 2, (h - 0.01) / 2, z);
    // the rails: a deep bottom rail down to the floor, a lock rail, a top rail up to the head; the leaf is
    // closed from edge to edge (an earlier leaf left a slot under its bottom rail you could see through)
    for (const [y0, y1] of [[0, 0.2], [h * 0.36 - 0.06, h * 0.36 + 0.06], [h - 0.17, h - 0.01]]) box(w - 2 * st, y1 - y0, thick, w / 2, (y0 + y1) / 2, z);
    // the panels, raised a little on both faces
    for (const [y0, y1] of [[0.2, h * 0.36 - 0.06], [h * 0.36 + 0.06, h - 0.17]]) for (const side of [1, -1]) {
      const p = loft(THREE, rect(st + 0.02, w - st - 0.02, y0, y1), [[0, 0], [0.006, 0.004], [0.022, 0.008], [0.03, 0.008]], true, true);
      if (side < 0) { p.scale(1, 1, -1); p.translate(0, 0, 2 * set - thick); } else p.translate(0, 0, set - thick / 2 + 0.002);
      c.add(p, "wood_face", { mover, spread: 0.08 });
    }
    box(w - 2 * st, h - 0.2, thick * 0.5, w / 2, h / 2, z, "wood");     // the panels' ground
    const knob = new THREE.SphereGeometry(0.026, 12, 9); knob.translate(w - 0.08, 1.0, set + 0.03); c.add(knob, "metal", { mover });
    c.footprint({ w, h, d: 0 });
  },
});
