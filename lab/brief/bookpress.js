// A bookpress of the 1660s, after Samuel Pepys's presses made by the joiner Thomas Simpson in 1666, the
// first English glazed bookcases: oak; a low, deeper base with glazed doors for folios; above it paired
// glazed doors of 21 small panes (3 × 7) between heavy glazing bars; carved acanthus on the base moulding
// and the cornice. Books stand spine out, ordered by size so their heads make a level line (Pepys raised
// small ones on wooden blocks). The books themselves are the book recipe's (book.js): this case only packs them.
// Frame: back against a wall at z = 0, front toward +z, centred on x = 0, standing on y = 0.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { metric, run, rng, hash } from "../painted/procedural.js";
import { fillRow, booksMesh } from "./book.js";

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

export function buildBookpress(THREE, K, { W = 1.2, H = 2.28, seed = 1666 } = {}) {
  const { M } = K, r = rng(seed), parts = new Map();
  const add = (g, mat, spread = 0.16) => { if (mat.vertexColors && !g.attributes.color) K.board(g, spread); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g.index ? g.toNonIndexed() : g); };
  const box = (w, h, d, x, y, z, mat = M.oak, spread = 0.16) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); add(g, mat, spread); };
  const glass = new THREE.MeshStandardMaterial({ color: 0xe4ece6, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.07, depthWrite: false }); glass.userData.cls = "glass";
  const iron = new THREE.MeshStandardMaterial({ color: 0x8a7650, metalness: 0.6, roughness: 0.4 }); iron.userData.cls = "brass";
  const dark = new THREE.MeshStandardMaterial({ color: 0x0f0a07, roughness: 1 }); dark.userData.cls = "dark";

  // proportions: plinth, a deeper folio base, a projecting waist moulding, the upper case, the cornice
  const plinth = 0.11, baseH = 0.56, Db = 0.5, Du = 0.36, side = 0.045, cornH = 0.17, waist = plinth + baseH;
  const upperTop = H - cornH, t = 0.022;                   // t: door stile and rail thickness
  // carcass: ends, back, bottoms, tops
  for (const sx of [-1, 1]) { box(side, waist, Db, sx * (W / 2 - side / 2), waist / 2, Db / 2); box(side, upperTop - waist, Du, sx * (W / 2 - side / 2), (waist + upperTop) / 2, Du / 2); }
  box(W, H, 0.018, 0, H / 2, 0.009, M.oakH, 0.08);
  box(W - 2 * side, 0.025, Db, 0, plinth + 0.0125, Db / 2);
  box(W - 2 * side, 0.025, Du, 0, upperTop - 0.0125, Du / 2);
  // the plinth, and a carved base moulding on it; the waist moulding over the folio base
  box(W + 0.03, plinth, Db + 0.015, 0, plinth / 2, (Db + 0.015) / 2, M.oakH, 0.1);
  const moulding = (y, D, w, prof, m = M.oakH) => { const g = run(THREE, -w / 2, w / 2, y, prof.map(([a, b]) => [a, b + D])); add(g, m, 0.06); };
  moulding(plinth, Db, W + 0.03, [[0, 0], [0, 0.012], [0.015, 0.008], [0.03, 0.0], [0.03, -0.02]]);
  box(W + 0.04, 0.06, Db + 0.03, 0, waist + 0.03, (Db + 0.03) / 2, M.oakH, 0.08);
  moulding(waist + 0.06, Du, W + 0.02, [[0, 0.17], [0, 0.18], [0.012, 0.16], [0.03, 0.14], [0.05, 0.0]]);
  // the cornice: a frieze carved with acanthus, then the crown mouldings
  { const fy = upperTop, fh = 0.075, len = W + 0.02, nx = Math.round(len * 420), ny = Math.round(fh * 420);
    const cg = new THREE.PlaneGeometry(len, fh, nx, ny), pa = cg.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const X = pa.getX(i) + len / 2, Y = pa.getY(i) / fh + 0.5;
      pa.setZ(i, acanthus((X % 0.048) / 0.048, Y) * 0.011);
    }
    cg.computeVertexNormals(); cg.translate(0, fy + fh / 2, Du + 0.012); add(cg, M.oakH, 0.06);
    box(W + 0.02, fh, 0.012, 0, fy + fh / 2, Du + 0.006, M.oakH, 0.06);
    moulding(fy + fh, Du, W + 0.08, [[0, 0], [0, 0.02], [0.02, 0.04], [0.045, 0.07], [0.07, 0.085], [0.095, 0.09], [0.095, 0]]);
  }
  // the base's carved band, the same leaf smaller, on the plinth's top member
  { const len = W + 0.03, fh = 0.04, nx = Math.round(len * 420), ny = Math.round(fh * 420);
    const cg = new THREE.PlaneGeometry(len, fh, nx, ny), pa = cg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const X = pa.getX(i) + len / 2, Y = pa.getY(i) / fh + 0.5; pa.setZ(i, acanthus((X % 0.032) / 0.032, Y) * 0.006); }
    cg.computeVertexNormals(); cg.translate(0, plinth - fh / 2 - 0.01, Db + 0.016); add(cg, M.oakH, 0.06); }

  // shelves: the folio base one bay; the upper case five, sized to the books they carry, largest low
  const heads = [0.43, 0.33, 0.28, 0.24, 0.21, 0.19];               // clear height per row, folio first
  const rowsY = [plinth + 0.025]; let y = waist + 0.06 + 0.012;
  rowsY.push(y); for (let k = 2; k < heads.length; k++) { y += heads[k - 1] + 0.02; rowsY.push(y); }
  for (let k = 1; k < rowsY.length; k++) box(W - 2 * side, 0.02, Du - 0.03, 0, rowsY[k] - 0.01, (Du - 0.03) / 2, M.oak, 0.12);
  // the books: asked for from the book recipe by size class and seed, packed row by row, drawn as one
  // instanced mesh; a fault in any row (a book through a shelf or an end) is reported, not hidden
  const ROWS = ["folio", "quarto", "small_quarto", "octavo", "small_octavo", "duodecimo"];
  const inner = W - 2 * side - 0.01, faults = [], placements = [];
  ROWS.forEach((size, k) => {
    const res = fillRow(THREE, { size, seed: hash(seed, k, 11) * 1e9 | 0, x0: -inner / 2, x1: inner / 2, y: rowsY[k], zFront: (k === 0 ? Db : Du) - 0.035,
      depthMax: (k === 0 ? Db : Du) - 0.06, clear: k === 0 ? waist - 0.003 - rowsY[0] : (k + 1 < rowsY.length ? rowsY[k + 1] - 0.02 : upperTop - 0.025) - rowsY[k] });
    placements.push(...res.placements); faults.push(...res.faults);
  });
  const booksM = booksMesh(THREE, K, placements);
  const books = placements.length;

  // the doors: paired leaves on the upper case, 3 × 7 panes each between heavy bars; the folio base's
  // glazed doors below, 3 × 2. Stiles and rails in oak, glass a breath behind the bars.
  const door = (x0d, x1d, y0d, y1d, cols, rows, z) => {
    const st = 0.05, bar = 0.022;
    box(st, y1d - y0d, t, x0d + st / 2, (y0d + y1d) / 2, z, M.oakH, 0.2); box(st, y1d - y0d, t, x1d - st / 2, (y0d + y1d) / 2, z, M.oakH, 0.2);
    box(x1d - x0d - 2 * st, st, t, (x0d + x1d) / 2, y1d - st / 2, z, M.oakH, 0.2); box(x1d - x0d - 2 * st, st * 1.3, t, (x0d + x1d) / 2, y0d + st * 0.65, z, M.oakH, 0.2);
    const gx0 = x0d + st, gx1 = x1d - st, gy0 = y0d + st * 1.3, gy1 = y1d - st;
    for (let i = 1; i < cols; i++) box(bar, gy1 - gy0, t * 0.9, gx0 + (gx1 - gx0) * i / cols, (gy0 + gy1) / 2, z, M.oakH, 0.1);
    for (let j = 1; j < rows; j++) box(gx1 - gx0, bar, t * 0.9, (gx0 + gx1) / 2, gy0 + (gy1 - gy0) * j / rows, z, M.oakH, 0.1);
    const gp = new THREE.PlaneGeometry(gx1 - gx0, gy1 - gy0); gp.translate((gx0 + gx1) / 2, (gy0 + gy1) / 2, z - 0.004); add(gp, glass);
  };
  const ux0 = -W / 2 + side, ux1 = W / 2 - side, um = 0, uy0 = waist + 0.06, uy1 = upperTop - 0.003;
  door(ux0, um - 0.002, uy0, uy1, 3, 7, Du + 0.011); door(um + 0.002, ux1, uy0, uy1, 3, 7, Du + 0.011);
  door(ux0, um - 0.002, plinth + 0.003, waist - 0.003, 3, 2, Db + 0.011); door(um + 0.002, ux1, plinth + 0.003, waist - 0.003, 3, 2, Db + 0.011);
  // brass: an escutcheon on the meeting stile of each pair, and small knobs
  for (const [yy, zz] of [[(uy0 + uy1) / 2, Du + 0.023], [(plinth + waist) / 2, Db + 0.023]]) {
    const e = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 12); e.rotateX(Math.PI / 2); e.translate(0.025, yy, zz); add(e, iron);
    const kh = new THREE.BoxGeometry(0.004, 0.012, 0.002); kh.translate(0.025, yy - 0.001, zz + 0.002); add(kh, dark);
    for (const sx of [-1, 1]) { const k2 = new THREE.SphereGeometry(0.009, 10, 8); k2.translate(sx * 0.03, yy - 0.05, zz + 0.006); add(k2, iron); }
  }

  // merge per material
  const grp = new THREE.Group();
  for (const [mat, gs] of parts) {
    const keep = gs.map(g => { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      if (!g.attributes.normal) g.computeVertexNormals(); return g; });
    const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = mat !== glass; m.receiveShadow = true; m.userData = { instance: `bookpress/${mat.userData.cls}`, material: mat.userData.cls };
    if (mat === glass) m.renderOrder = 2;
    grp.add(m);
  }
  grp.add(booksM);
  grp.userData = { kind: "bookpress", books, faults, size: [W + 0.08, H, Db + 0.03] };
  return grp;
}


// A library wall: open oak shelving in bays, every shelf filled from the same book recipe. The test of
// the recipe: a wall of a thousand books should cost about what one bookcase costs.
export function buildLibraryWall(THREE, K, { W = 4.2, H = 2.5, bays = 4, D = 0.32, seed = 1668 } = {}) {
  const { M } = K, parts = new Map();
  const add = (g, mat, spread = 0.16) => { if (mat.vertexColors && !g.attributes.color) K.board(g, spread); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g.index ? g.toNonIndexed() : g); };
  const box = (w, h, d, x, y, z, mat = M.oak, spread = 0.16) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); add(g, mat, spread); };
  const up = 0.05, bw = (W - (bays + 1) * up) / bays, plinth = 0.1, cornice = 0.12;
  const rows = ["folio", "quarto", "quarto", "small_quarto", "octavo", "octavo", "small_octavo", "duodecimo"];
  const clear = { folio: 0.44, quarto: 0.33, small_quarto: 0.28, octavo: 0.24, small_octavo: 0.21, duodecimo: 0.18 };
  const top = H - cornice;
  for (let i = 0; i <= bays; i++) box(up, H - 0.02, D, -W / 2 + up / 2 + i * (bw + up), (H - 0.02) / 2, D / 2);
  box(W, H, 0.018, 0, H / 2, 0.009, M.oakH, 0.08);
  box(W + 0.02, plinth, D + 0.01, 0, plinth / 2, (D + 0.01) / 2, M.oakH, 0.1);
  box(W + 0.06, 0.05, D + 0.05, 0, top + 0.025, (D + 0.05) / 2, M.oakH, 0.08);
  box(W + 0.1, 0.07, D + 0.08, 0, H - 0.035, (D + 0.08) / 2, M.oakH, 0.08);
  // shelves: as many rows of the size sequence as fit, largest low
  const ys = [plinth]; let used = [];
  for (const sz of rows) { const y = ys[ys.length - 1]; if (y + clear[sz] + 0.022 > top) break; used.push(sz); ys.push(y + clear[sz] + 0.022); }
  const faults = [], placements = [];
  for (let k = 1; k < ys.length; k++) box(W - 0.02, 0.022, D - 0.02, 0, ys[k] - 0.011, (D - 0.02) / 2, M.oak, 0.12);
  for (let b = 0; b < bays; b++) {
    const x0 = -W / 2 + up + b * (bw + up) + 0.005, x1 = x0 + bw - 0.01;
    used.forEach((size, k) => {
      const res = fillRow(THREE, { size, seed: hash(seed + b, k, 13) * 1e9 | 0, x0, x1, y: ys[k], zFront: D - 0.03, depthMax: D - 0.05, clear: ys[k + 1] - 0.022 - ys[k] });
      placements.push(...res.placements); faults.push(...res.faults);
    });
  }
  const grp = new THREE.Group();
  for (const [mat, gs] of parts) {
    const keep = gs.map(g => { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
    const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = m.receiveShadow = true; grp.add(m);
  }
  grp.add(booksMesh(THREE, K, placements));
  grp.userData = { kind: "library_wall", books: placements.length, faults, size: [W + 0.1, H, D + 0.08] };
  return grp;
}
