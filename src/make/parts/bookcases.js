// A bookpress of the 1660s, after Samuel Pepys's presses made by the joiner Thomas Simpson in 1666, the
// first English glazed bookcases: oak; a low, deeper base with glazed doors for folios; above it paired
// glazed doors of 21 small panes (3 × 7) between heavy glazing bars; carved acanthus on the base moulding
// and the cornice. Books stand spine out, ordered by size so their heads make a level line (Pepys raised
// small ones on wooden blocks). The books are the book recipe's (books.js), from the context that reaches
// the case (its keeper's means and subjects): this case only packs them. Its four glazed doors open.
// Frame: back against a wall at z = 0, front toward +z, centred on x = 0, standing on y = 0.
import { run } from "../../../lab/painted/procedural.js";
import { definePart } from "../catalogue.js";
import { seedOf, at } from "../id.js";
import { plainBox } from "./joinery.js";
import { fillRow, booksMesh, bookContext } from "./books.js";

// ---- carving: a running band of acanthus. u across one leaf's repeat (0..1), Y up the band (0..1);
// returns relief 0..1. Each leaf a rounded tongue with a sunk midrib and lobed edges, its tip turning over;
// a narrow dart between leaves.
function acanthus(u, Y) {
  const cu = Math.abs(u - 0.5) * 2;
  const halfW = Y < 0.5 ? 0.82 * Math.pow(Math.sin(Math.PI * (Y * 0.9 + 0.05)), 0.5) : 0.82 * Math.pow(Math.sin(Math.PI * 0.5), 0.5) * Math.max(0, (1 - Y) / 0.5) ** 0.8;   // swelling, then drawn to a point
  const lobes = 0.07 * Math.cos(Y * Math.PI * 7);                               // the leaf's edge, scalloped
  let h = 0;
  if (cu < halfW + lobes) {
    const q = cu / Math.max(0.05, halfW + lobes);
    h = Math.sqrt(Math.max(0, 1 - q * q)) * (0.55 + 0.45 * Y);                   // fuller toward the tip
    h -= 0.35 * Math.exp(-((cu / 0.07) ** 2)) * (Y < 0.85 ? 1 : 0);              // the midrib, sunk
    h -= 0.18 * Math.max(0, Math.cos(Y * Math.PI * 7)) * q;                      // veins running to each lobe
    if (Y > 0.8) h += (Y - 0.8) * 2.2 * (1 - q);                                  // the tip turning over
  }
  if (cu > 0.9 && Y < 0.65) h = Math.max(h, (1 - (1 - cu) / 0.1) * (0.65 - Y) * 0.9);   // the dart
  return Math.max(0, h);
}

// the books a case holds, from the context that reaches it
const booksFor = (c, means = "great") => ({ ...bookContext(c.context.means || means), ...(c.context.topics ? { topics: c.context.topics } : {}), used: new Set() });

definePart("glazed_bookpress", {
  build(c, { W = 1.2, H = 2.28 }) {
    const { THREE, K } = c;
    const box = (w, h, d, x, y, z, role = "wood", o = {}) => c.add(plainBox(THREE, w, h, d, x, y, z), role, { spread: 0.16, ...o });
    // proportions: plinth, a deeper folio base, a projecting waist moulding, the upper case, the cornice
    const plinth = 0.11, baseH = 0.56, Db = 0.5, Du = 0.36, side = 0.045, cornH = 0.17, waist = plinth + baseH;
    const upperTop = H - cornH, t = 0.022;                   // t: door stile and rail thickness
    // carcass: ends, back, bottoms, tops
    for (const sx of [-1, 1]) { box(side, waist, Db, sx * (W / 2 - side / 2), waist / 2, Db / 2); box(side, upperTop - waist, Du, sx * (W / 2 - side / 2), (waist + upperTop) / 2, Du / 2); }
    box(W, H, 0.018, 0, H / 2, 0.009, "wood_face", { spread: 0.08 });
    box(W - 2 * side, 0.025, Db, 0, plinth + 0.0125, Db / 2);
    box(W - 2 * side, 0.025, Du, 0, upperTop - 0.0125, Du / 2);
    // the plinth, and a carved base moulding on it; the waist moulding over the folio base
    box(W + 0.03, plinth, Db + 0.015, 0, plinth / 2, (Db + 0.015) / 2, "wood_face", { spread: 0.1 });
    const moulding = (y, D, w, prof) => c.add(run(THREE, -w / 2, w / 2, y, prof.map(([a, b]) => [a, b + D])), "wood_face", { spread: 0.06 });
    moulding(plinth, Db, W + 0.03, [[0, 0], [0, 0.012], [0.015, 0.008], [0.03, 0.0], [0.03, -0.02]]);
    box(W + 0.04, 0.06, Db + 0.03, 0, waist + 0.03, (Db + 0.03) / 2, "wood_face", { spread: 0.08 });
    moulding(waist + 0.06, Du, W + 0.02, [[0, 0.17], [0, 0.18], [0.012, 0.16], [0.03, 0.14], [0.05, 0.0]]);
    // carved bands of acanthus: the cornice's frieze, and the same leaf smaller on the plinth
    const carve = (len, fh, rep, depth, y, z) => {
      const cg = new THREE.PlaneGeometry(len, fh, Math.round(len * 420), Math.round(fh * 420)), pa = cg.attributes.position;
      for (let i = 0; i < pa.count; i++) { const X = pa.getX(i) + len / 2, Y = pa.getY(i) / fh + 0.5; pa.setZ(i, acanthus((X % rep) / rep, Y) * depth); }
      cg.computeVertexNormals(); cg.translate(0, y, z); c.add(cg, "wood_face", { spread: 0.06, sheet: true });
    };
    { const fy = upperTop, fh = 0.075;
      carve(W + 0.02, fh, 0.048, 0.011, fy + fh / 2, Du + 0.012);
      box(W + 0.02, fh, 0.012, 0, fy + fh / 2, Du + 0.006, "wood_face", { spread: 0.06 });
      moulding(fy + fh, Du, W + 0.08, [[0, 0], [0, 0.02], [0.02, 0.04], [0.045, 0.07], [0.07, 0.085], [0.095, 0.09], [0.095, 0]]); }
    carve(W + 0.03, 0.04, 0.032, 0.006, plinth - 0.03, Db + 0.016);
    // shelves: the folio base one bay; the upper case five, sized to the books they carry, largest low
    const heads = [0.43, 0.33, 0.28, 0.24, 0.21, 0.19];               // clear height per row, folio first
    const rowsY = [plinth + 0.025]; let y = waist + 0.06 + 0.012;
    rowsY.push(y); for (let k = 2; k < heads.length; k++) { y += heads[k - 1] + 0.02; rowsY.push(y); }
    for (let k = 1; k < rowsY.length; k++) box(W - 2 * side, 0.02, Du - 0.03, 0, rowsY[k] - 0.01, (Du - 0.03) / 2, "wood", { spread: 0.12 });
    // the books, row by row from the book recipe, one instanced mesh; a fault in any row is reported
    const ROWS = ["folio", "quarto", "small_quarto", "octavo", "small_octavo", "duodecimo"];
    const inner = W - 2 * side - 0.01, faults = [], placements = [], ctx = booksFor(c);
    ROWS.forEach((size, k) => {
      const res = fillRow(THREE, { size, seed: seedOf(at(c.address, `row:${k}`)), x0: -inner / 2, x1: inner / 2, y: rowsY[k], zFront: (k === 0 ? Db : Du) - 0.035,
        depthMax: (k === 0 ? Db : Du) - 0.06, ctx, clear: k === 0 ? waist - 0.003 - rowsY[0] : (k + 1 < rowsY.length ? rowsY[k + 1] - 0.02 : upperTop - 0.025) - rowsY[k] });
      placements.push(...res.placements); faults.push(...res.faults);
    });
    c.extra(booksMesh(THREE, K, placements));
    // the doors: paired leaves on the upper case, 3 × 7 panes each between heavy bars; the folio base's
    // below, 3 × 2. Each hangs on its outer stile and swings open into the room.
    const door = (name, x0d, x1d, y0d, y1d, cols, rows, z, hingeLeft) => {
      const st = 0.05, bar = 0.022, o = { mover: name };
      c.mover(name, [hingeLeft ? x0d : x1d, 0, z]);
      box(st, y1d - y0d, t, x0d + st / 2, (y0d + y1d) / 2, z, "wood_face", { ...o, spread: 0.2 }); box(st, y1d - y0d, t, x1d - st / 2, (y0d + y1d) / 2, z, "wood_face", { ...o, spread: 0.2 });
      box(x1d - x0d - 2 * st, st, t, (x0d + x1d) / 2, y1d - st / 2, z, "wood_face", { ...o, spread: 0.2 }); box(x1d - x0d - 2 * st, st * 1.3, t, (x0d + x1d) / 2, y0d + st * 0.65, z, "wood_face", { ...o, spread: 0.2 });
      const gx0 = x0d + st, gx1 = x1d - st, gy0 = y0d + st * 1.3, gy1 = y1d - st;
      for (let i = 1; i < cols; i++) box(bar, gy1 - gy0, t * 0.9, gx0 + (gx1 - gx0) * i / cols, (gy0 + gy1) / 2, z, "wood_face", { ...o, spread: 0.1 });
      for (let j = 1; j < rows; j++) box(gx1 - gx0, bar, t * 0.9, (gx0 + gx1) / 2, gy0 + (gy1 - gy0) * j / rows, z, "wood_face", { ...o, spread: 0.1 });
      const gp = new THREE.PlaneGeometry(gx1 - gx0, gy1 - gy0); gp.translate((gx0 + gx1) / 2, (gy0 + gy1) / 2, z - 0.004); c.add(gp, "glazing", { ...o, sheet: true });
      // a small brass knob near the meeting stile
      const k2 = new THREE.SphereGeometry(0.009, 10, 8); k2.translate(hingeLeft ? x1d - 0.03 : x0d + 0.03, (y0d + y1d) / 2 - 0.05, z + 0.017); c.add(k2, "metal", o);
    };
    const ux0 = -W / 2 + side, ux1 = W / 2 - side, uy0 = waist + 0.06, uy1 = upperTop - 0.003;
    door("upper_left", ux0, -0.002, uy0, uy1, 3, 7, Du + 0.011, true); door("upper_right", 0.002, ux1, uy0, uy1, 3, 7, Du + 0.011, false);
    door("lower_left", ux0, -0.002, plinth + 0.003, waist - 0.003, 3, 2, Db + 0.011, true); door("lower_right", 0.002, ux1, plinth + 0.003, waist - 0.003, 3, 2, Db + 0.011, false);
    // a brass escutcheon on the right leaf of each pair, over the lock
    for (const [yy, zz, mv] of [[(uy0 + uy1) / 2, Du + 0.023, "upper_right"], [(plinth + waist) / 2, Db + 0.023, "lower_right"]]) {
      const e = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 12); e.rotateX(Math.PI / 2); e.translate(0.025, yy, zz); c.add(e, "metal", { mover: mv });
      c.add(plainBox(THREE, 0.004, 0.012, 0.002, 0.025, yy - 0.001, zz + 0.002), "dark", { mover: mv });
    }
    Object.assign(c.info, { books: placements.length, faults });
    c.footprint({ w: W + 0.08, h: H, d: Db + 0.03 });
  },
});

// A library wall: open oak shelving in bays, every shelf filled from the same book recipe. The test of
// the recipe: a wall of a thousand books should cost about what one bookcase costs.
definePart("library_bays", {
  build(c, { W = 4.2, H = 2.5, bays = 4, D = 0.32 }) {
    const { THREE, K } = c;
    const box = (w, h, d, x, y, z, role = "wood", spread = 0.16) => c.add(plainBox(THREE, w, h, d, x, y, z), role, { spread });
    const up = 0.05, bw = (W - (bays + 1) * up) / bays, plinth = 0.1, cornice = 0.12;
    const rows = ["folio", "quarto", "quarto", "small_quarto", "octavo", "octavo", "small_octavo", "duodecimo"];
    const clear = { folio: 0.44, quarto: 0.33, small_quarto: 0.28, octavo: 0.24, small_octavo: 0.21, duodecimo: 0.18 };
    const top = H - cornice;
    for (let i = 0; i <= bays; i++) box(up, H - 0.02, D, -W / 2 + up / 2 + i * (bw + up), (H - 0.02) / 2, D / 2);
    box(W, H, 0.018, 0, H / 2, 0.009, "wood_face", 0.08);
    box(W + 0.02, plinth, D + 0.01, 0, plinth / 2, (D + 0.01) / 2, "wood_face", 0.1);
    box(W + 0.06, 0.05, D + 0.05, 0, top + 0.025, (D + 0.05) / 2, "wood_face", 0.08);
    box(W + 0.1, 0.07, D + 0.08, 0, H - 0.035, (D + 0.08) / 2, "wood_face", 0.08);
    // shelves: as many rows of the size sequence as fit, largest low
    const ys = [plinth], used = [];
    for (const sz of rows) { const y = ys[ys.length - 1]; if (y + clear[sz] + 0.022 > top) break; used.push(sz); ys.push(y + clear[sz] + 0.022); }
    const faults = [], placements = [], ctx = booksFor(c, "gentry");
    for (let k = 1; k < ys.length; k++) box(W - 0.02, 0.022, D - 0.02, 0, ys[k] - 0.011, (D - 0.02) / 2, "wood", 0.12);
    for (let b = 0; b < bays; b++) {
      const x0 = -W / 2 + up + b * (bw + up) + 0.005, x1 = x0 + bw - 0.01;
      used.forEach((size, k) => {
        const res = fillRow(THREE, { size, seed: seedOf(at(c.address, `bay:${b}/row:${k}`)), x0, x1, y: ys[k], zFront: D - 0.03, depthMax: D - 0.05, ctx, clear: ys[k + 1] - 0.022 - ys[k] });
        placements.push(...res.placements); faults.push(...res.faults);
      });
    }
    c.extra(booksMesh(THREE, K, placements));
    Object.assign(c.info, { means: ctx.means, books: placements.length, faults });
    c.footprint({ w: W + 0.1, h: H, d: D + 0.08 });
  },
});
