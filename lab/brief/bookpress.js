// A bookpress of the 1660s, after Samuel Pepys's presses made by the joiner Thomas Simpson in 1666, the
// first English glazed bookcases: oak; a low, deeper base with glazed doors for folios; above it paired
// glazed doors of 21 small panes (3 × 7) between heavy glazing bars; carved acanthus on the base moulding
// and the cornice. Books stand spine out, ordered by size so their heads make a level line (Pepys raised
// small ones on wooden blocks); calf bindings with raised bands, gilt panels and a lettering-piece.
// Frame: back against a wall at z = 0, front toward +z, centred on x = 0, standing on y = 0.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { metric, run, rng } from "../painted/procedural.js";

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

// ---- the spines: one atlas, a cell per binding
function spineAtlas(THREE, n, seed) {
  const cw = 48, ch = 384, cols = 32, rows = Math.ceil((n + 2) / cols);
  const c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext("2d"), r = rng(seed);
  // calf in its range: tan, brown, dark brown; now and then vellum or a red morocco
  const leather = () => { const t = r(); if (t < 0.08) return [214, 200, 170]; if (t < 0.14) return [118, 42, 32]; const k = 0.45 + r() * 0.55; return [118 * k + 30, 74 * k + 18, 42 * k + 10]; };
  const gilt = (a) => `rgba(${196 + r() * 30},${158 + r() * 24},${70 + r() * 20},${a})`;
  const cells = [];
  for (let k = 0; k < n; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch, L = leather(), vellum = L[0] > 200;
    g.fillStyle = `rgb(${L[0]},${L[1]},${L[2]})`; g.fillRect(x, y, cw, ch);
    // wear: rubbed at the head and tail, darker in the grain
    for (let q = 0; q < 160; q++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,240,220"},${0.03 + r() * 0.05})`; g.fillRect(x + r() * cw, y + r() * ch, 1 + r() * 3, 1 + r() * 6); }
    const rub = g.createLinearGradient(0, y, 0, y + ch); rub.addColorStop(0, "rgba(240,220,190,0.22)"); rub.addColorStop(0.06, "rgba(0,0,0,0)"); rub.addColorStop(0.94, "rgba(0,0,0,0)"); rub.addColorStop(1, "rgba(240,220,190,0.22)");
    g.fillStyle = rub; g.fillRect(x, y, cw, ch);
    // five raised bands make six panels; gilt fillets either side of each band, a fleuron in each panel
    const bands = 5, top = 0.06, bot = 0.94, step = (bot - top) / (bands + 1);
    if (!vellum) for (let b = 1; b <= bands; b++) {
      const by = y + ch * (top + step * b);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, by - 3, cw, 6);
      g.fillStyle = gilt(0.85); g.fillRect(x + 3, by - 6, cw - 6, 1.4); g.fillRect(x + 3, by + 5, cw - 6, 1.4);
    }
    // the lettering-piece in the second panel: red or black morocco, its title as gilt marks
    const lp = y + ch * (top + step * 1) + 8, lh = ch * step - 16;
    if (!vellum) {
      g.fillStyle = r() < 0.6 ? "rgb(120,30,24)" : "rgb(26,20,16)"; g.fillRect(x + 4, lp, cw - 8, lh);
      g.fillStyle = gilt(0.9); for (let l = 0; l < 2; l++) for (let q = 0; q < 4 + r() * 3; q++) g.fillRect(x + 8 + q * 5 + r() * 2, lp + lh * (0.32 + l * 0.32), 3, 3 + r() * 2);
      for (let p = 2; p <= bands; p++) { const py = y + ch * (top + step * p + step / 2); g.fillStyle = gilt(0.7); g.beginPath(); g.arc(x + cw / 2, py, 3.5, 0, 7); g.fill(); g.fillRect(x + cw / 2 - 7, py - 0.6, 14, 1.2); g.fillRect(x + cw / 2 - 0.6, py - 7, 1.2, 14); }
    } else { g.fillStyle = "rgba(60,40,20,0.75)"; g.font = "italic 12px Georgia, serif"; g.save(); g.translate(x + cw / 2 + 4, y + ch * 0.6); g.rotate(-Math.PI / 2); g.fillText("Placita", 0, 0); g.restore(); }
    cells.push([x / c.width, 1 - (y + ch) / c.height, (x + cw) / c.width, 1 - y / c.height]);
  }
  // two plain cells: the page block (cream, faint lines) and the boards' leather
  const px = (n % cols) * cw, py = Math.floor(n / cols) * ch;
  g.fillStyle = "rgb(222,210,182)"; g.fillRect(px, py, cw, ch);
  for (let q = 0; q < ch; q += 2) { g.fillStyle = `rgba(120,100,70,${0.05 + r() * 0.08})`; g.fillRect(px, py + q, cw, 1); }
  cells.push([px / c.width, 1 - (py + ch) / c.height, (px + cw) / c.width, 1 - py / c.height]);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, vertexColors: true }); m.userData.cls = "books";
  return { m, cells, pages: cells[n] };
}

// a book: a box whose spine (+z) shows its cell, whose top and bottom show the page block, whose sides
// take the edge of its own leather
function book(THREE, w, h, d, cell, pages) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const set = (face, [u0, v0, u1, v1], side = false) => { for (let i = face * 4; i < face * 4 + 4; i++) { const a = uv.getX(i), b = uv.getY(i); uv.setXY(i, side ? u0 + (u1 - u0) * 0.1 : u0 + (u1 - u0) * a, v0 + (v1 - v0) * b); } };
  set(4, cell);                 // +z, the spine
  set(0, cell, true); set(1, cell, true); set(5, cell, true);   // the boards and the fore-edge's far side take the leather
  set(2, pages); set(3, pages);  // head and tail: the page block
  return g;
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
  // the books
  const sizes = [[0.36, 0.42, 0.05, 0.09], [0.27, 0.31, 0.04, 0.07], [0.22, 0.26, 0.03, 0.055], [0.19, 0.22, 0.025, 0.045], [0.16, 0.19, 0.022, 0.04], [0.13, 0.16, 0.018, 0.034]];  // hmin, hmax, wmin, wmax
  const estimate = Math.round((W - 2 * side) / 0.04 * heads.length * 1.1) + 10;
  const A = spineAtlas(THREE, estimate, seed + 1);
  let cell = 0, books = 0;
  const inner = W - 2 * side - 0.01, x0 = -inner / 2;
  const faults = [];
  for (let k = 0; k < heads.length; k++) {
    const [hmin, hmax, wmin, wmax] = sizes[k], depthOf = (h) => Math.min(k === 0 ? Db - 0.06 : Du - 0.05, h * 0.72);
    const row = [], gapEnd = 0.02 + r() * 0.07;
    let x = x0;
    // Pepys's order: tallest to the left, falling gently, so the heads run nearly level
    const want = []; while (true) { const w = wmin + r() * (wmax - wmin); if (x + w > x0 + inner - gapEnd) break; want.push(w); x += w + 0.001; }
    const hs = want.map(() => hmin + r() * (hmax - hmin)).sort((a, b) => b - a);
    x = x0;
    want.forEach((w, i) => { row.push({ x: x + w / 2, w, h: Math.min(hs[i], heads[k] - 0.012) }); x += w + 0.001; });
    // the last book leans into the gap at the end of the row: it pivots on its foot by the books, its
    // other foot stays on the shelf, and its head comes to rest against the case's end
    const last = row[row.length - 1], room = x0 + inner - (last.x + last.w / 2);
    const reach = (a) => last.w * Math.cos(a) + last.h * Math.sin(a);       // width it takes when leaning by a
    let lo = 0, hi = 0.4; for (let q = 0; q < 30; q++) { const m = (lo + hi) / 2; if (reach(m) < last.w + room - 0.004) lo = m; else hi = m; }
    const lean = lo;
    for (const b of row) {
      const d = depthOf(b.h), z = (k === 0 ? Db : Du) - 0.035 - d / 2;
      const g = book(THREE, b.w, b.h, d, A.cells[cell++ % (A.cells.length - 1)], A.pages);
      if (b === last && lean > 0.05) { g.translate(b.w / 2, b.h / 2, 0); g.rotateZ(-lean); g.translate(b.x - b.w / 2, rowsY[k] + b.w * Math.sin(lean), z); }
      else g.translate(b.x, rowsY[k] + b.h / 2, z);
      { const n = g.attributes.position.count, c = new Float32Array(n * 3), k = 0.86 + r() * 0.24; c.fill(k); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); }   // its own tone; its atlas UVs untouched
      g.computeBoundingBox(); const bb = g.boundingBox, ceil = k === 0 ? waist - 0.003 : k + 1 < rowsY.length ? rowsY[k + 1] - 0.02 : upperTop - 0.025;
      if (bb.max.y > ceil + 1e-4) faults.push(`row ${k} book ${books} ${(bb.max.y - ceil).toFixed(3)} m into the shelf above`);
      if (bb.min.x < -W / 2 + side - 1e-4 || bb.max.x > W / 2 - side + 1e-4) faults.push(`row ${k} book ${books} through the case's end`);
      if (bb.min.y < rowsY[k] - 1e-4) faults.push(`row ${k} book ${books} sunk in its shelf`);
      add(g, A.m); books++;
    }
  }

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
  grp.userData = { kind: "bookpress", books, faults, size: [W + 0.08, H, Db + 0.03] };
  return grp;
}

