// The book: a kind of its own, the first recipe of the catalogue (R48). A period book is a size class and
// a seed; everything else (its height and thickness, its binding, its spine, its tone) follows from them,
// the same every time. A bookcase does not make books: it asks for them by size class and seed and
// packs them. Thousands of books are drawn as ONE shape repeated (an instanced mesh), each copy with its
// own size, place, spine cell and tone, so a library costs about what one bookcase costs.
// Any single book can also be built alone (buildBook), as the object a player picks up.
import { rng, hash } from "../painted/procedural.js";

// English formats c. 1660, heights and thicknesses in metres (a folio stands about 0.36–0.42 m)
export const SIZE_CLASSES = {
  folio: { h: [0.36, 0.42], w: [0.05, 0.09] },
  quarto: { h: [0.27, 0.31], w: [0.04, 0.07] },
  small_quarto: { h: [0.22, 0.26], w: [0.03, 0.055] },
  octavo: { h: [0.19, 0.22], w: [0.025, 0.045] },
  small_octavo: { h: [0.16, 0.19], w: [0.022, 0.04] },
  duodecimo: { h: [0.13, 0.16], w: [0.018, 0.034] },
};
const CELLS = 256;               // spine designs per look; a seed picks one, and its own tone besides

// a book's whole description from its size class and seed: the recipe's output, before any geometry
export function bookSpec(size, seed) {
  const c = SIZE_CLASSES[size], r = rng((seed * 2654435761) >>> 0);
  const h = c.h[0] + r() * (c.h[1] - c.h[0]), w = c.w[0] + r() * (c.w[1] - c.w[0]);
  return { kind: "book", size, seed, h, w, d: h * 0.72, cell: Math.floor(r() * CELLS), tone: 0.86 + r() * 0.24 };
}

// what a pocket or a bag can take: decided from size, never listed object by object
export const takeable = (dims) => { const [a, b, c] = [...dims].sort((p, q) => q - p); return a <= 0.5 && b <= 0.35 && c <= 0.2 && a * b * c <= 0.02; };

// ---- the look's spines: one atlas of CELLS designs, made once per look and shared by every book
function spineAtlas(THREE, seed) {
  const cw = 48, ch = 384, cols = 32, rows = Math.ceil((CELLS + 1) / cols);
  const c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext("2d"), r = rng(seed);
  const leather = () => { const t = r(); if (t < 0.08) return [214, 200, 170]; if (t < 0.14) return [118, 42, 32]; const k = 0.45 + r() * 0.55; return [118 * k + 30, 74 * k + 18, 42 * k + 10]; };
  const gilt = (a) => `rgba(${196 + r() * 30},${158 + r() * 24},${70 + r() * 20},${a})`;
  const cell = (k) => { const x = (k % cols) * cw, y = Math.floor(k / cols) * ch; return [x / c.width, 1 - (y + ch) / c.height, (x + cw) / c.width, 1 - y / c.height]; };
  for (let k = 0; k < CELLS; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch, L = leather(), vellum = L[0] > 200;
    g.fillStyle = `rgb(${L[0]},${L[1]},${L[2]})`; g.fillRect(x, y, cw, ch);
    for (let q = 0; q < 160; q++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,240,220"},${0.03 + r() * 0.05})`; g.fillRect(x + r() * cw, y + r() * ch, 1 + r() * 3, 1 + r() * 6); }
    const rub = g.createLinearGradient(0, y, 0, y + ch); rub.addColorStop(0, "rgba(240,220,190,0.22)"); rub.addColorStop(0.06, "rgba(0,0,0,0)"); rub.addColorStop(0.94, "rgba(0,0,0,0)"); rub.addColorStop(1, "rgba(240,220,190,0.22)");
    g.fillStyle = rub; g.fillRect(x, y, cw, ch);
    const bands = 5, top = 0.06, bot = 0.94, step = (bot - top) / (bands + 1);
    if (!vellum) for (let b = 1; b <= bands; b++) {
      const by = y + ch * (top + step * b);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, by - 3, cw, 6);
      g.fillStyle = gilt(0.85); g.fillRect(x + 3, by - 6, cw - 6, 1.4); g.fillRect(x + 3, by + 5, cw - 6, 1.4);
    }
    const lp = y + ch * (top + step) + 8, lh = ch * step - 16;
    if (!vellum) {
      g.fillStyle = r() < 0.6 ? "rgb(120,30,24)" : "rgb(26,20,16)"; g.fillRect(x + 4, lp, cw - 8, lh);
      g.fillStyle = gilt(0.9); for (let l = 0; l < 2; l++) for (let q = 0; q < 4 + r() * 3; q++) g.fillRect(x + 8 + q * 5 + r() * 2, lp + lh * (0.32 + l * 0.32), 3, 3 + r() * 2);
      for (let p = 2; p <= bands; p++) { const py = y + ch * (top + step * p + step / 2); g.fillStyle = gilt(0.7); g.beginPath(); g.arc(x + cw / 2, py, 3.5, 0, 7); g.fill(); g.fillRect(x + cw / 2 - 7, py - 0.6, 14, 1.2); g.fillRect(x + cw / 2 - 0.6, py - 7, 1.2, 14); }
    } else { g.fillStyle = "rgba(60,40,20,0.75)"; g.font = "italic 12px Georgia, serif"; g.save(); g.translate(x + cw / 2 + 4, y + ch * 0.6); g.rotate(-Math.PI / 2); g.fillText("Placita", 0, 0); g.restore(); }
  }
  // the page block: cream, its leaves as faint lines
  const px = (CELLS % cols) * cw, py = Math.floor(CELLS / cols) * ch;
  g.fillStyle = "rgb(222,210,182)"; g.fillRect(px, py, cw, ch);
  for (let q = 0; q < ch; q += 2) { g.fillStyle = `rgba(120,100,70,${0.05 + r() * 0.08})`; g.fillRect(px, py + q, cw, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { texture: t, cell, pages: cell(CELLS) };
}

// one unit book (1 × 1 × 1, centred), its faces marked: spine +z, page block top and bottom, leather elsewhere
function unitBook(THREE) {
  const g = new THREE.BoxGeometry(1, 1, 1), uv = g.attributes.uv, n = uv.count, page = new Float32Array(n), side = new Float32Array(n);
  for (let f = 0; f < 6; f++) for (let i = f * 4; i < f * 4 + 4; i++) { page[i] = f === 2 || f === 3 ? 1 : 0; side[i] = f === 4 || f === 2 || f === 3 ? 0 : 1; }
  g.setAttribute("aPage", new THREE.BufferAttribute(page, 1)); g.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  return g;
}

// the look's books: atlas, material and unit shape, made once and kept on the kit
export function bookLook(THREE, K, seed = 1667) {
  if (K.books) return K.books;
  const A = spineAtlas(THREE, seed);
  // each copy reads its spine cell from an attribute; the page block and the boards come from the same atlas
  const material = (instanced) => {
    const m = new THREE.MeshStandardMaterial({ map: A.texture, roughness: 0.7 }); m.userData.cls = "books";
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uPages = { value: new THREE.Vector4(...A.pages) };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\nattribute float aPage; attribute float aSide; uniform vec4 uPages; ${instanced ? "attribute vec4 aCell;" : "uniform vec4 uCell;"}`)
        .replace("#include <uv_vertex>", `#include <uv_vertex>
          { vec4 c = ${instanced ? "aCell" : "uCell"}; vec2 q = aSide > 0.5 ? vec2(0.1, uv.y) : uv;
            vMapUv = aPage > 0.5 ? mix(uPages.xy, uPages.zw, uv) : mix(c.xy, c.zw, q); }`);
      m.userData.shader = sh;
    };
    m.customProgramCacheKey = () => "book" + (instanced ? "I" : "S");
    return m;
  };
  return (K.books = { atlas: A, unit: unitBook(THREE), instanced: material(true), material });
}

// where a book stands: a matrix from its spec, its place on the shelf (x centre, y shelf, z centre) and a lean
export function bookMatrix(THREE, s, x, y, z, lean = 0) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -lean);
  // a leaning book pivots on its foot by the books; its centre moves with the turn
  const px = x - s.w / 2, py = y + (lean ? s.w * Math.sin(lean) : 0);
  const c = new THREE.Vector3(s.w / 2, s.h / 2, 0).applyQuaternion(q);
  return m.compose(new THREE.Vector3(px + c.x, py + c.y, z), q, new THREE.Vector3(s.w, s.h, s.d));
}

// many books as one instanced mesh: placements = [{ spec, matrix }]
export function booksMesh(THREE, K, placements) {
  const L = bookLook(THREE, K), n = placements.length;
  const g = L.unit.clone(), cells = new Float32Array(n * 4);
  placements.forEach((p, i) => cells.set(L.atlas.cell(p.spec.cell), i * 4));
  g.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 4));
  const mesh = new THREE.InstancedMesh(g, L.instanced, n);
  const col = new THREE.Color();
  placements.forEach((p, i) => { mesh.setMatrixAt(i, p.matrix); mesh.setColorAt(i, col.setScalar(p.spec.tone)); });
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { instance: "books", material: "books", slots: placements.map(p => p.spec) };
  return mesh;
}

// one book on its own: what a player picks up, or one that matters to the story
export function buildBook(THREE, K, spec, id = null) {
  const L = bookLook(THREE, K), m = L.material(false);
  const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.uCell = { value: new THREE.Vector4(...L.atlas.cell(spec.cell)) }; };
  m.customProgramCacheKey = () => "bookS";
  m.color.setScalar(spec.tone);
  const mesh = new THREE.Mesh(L.unit, m); mesh.scale.set(spec.w, spec.h, spec.d); mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { entity: id, kind: "book", spec, takeable: takeable([spec.w, spec.h, spec.d]) };
  return mesh;
}

// fill one shelf row: books of a size class from a seed, tallest first (Pepys's order), the last leaning
// into whatever gap is left; returns placements and any fault found
export function fillRow(THREE, { size, seed, x0, x1, y, zFront, depthMax, clear }) {
  const r = rng(seed), out = [], faults = [];
  const gapEnd = 0.02 + r() * 0.07, specs = [];
  let x = x0;
  for (let i = 0; ; i++) { const s = bookSpec(size, hash(seed, i, 7) * 1e9 | 0); if (x + s.w > x1 - gapEnd) break; s.h = Math.min(s.h, clear - 0.012); s.d = Math.min(s.d, depthMax); specs.push(s); x += s.w + 0.001; }
  specs.sort((a, b) => b.h - a.h);
  x = x0;
  specs.forEach((s, i) => {
    let lean = 0;
    if (i === specs.length - 1) {
      const room = x1 - (x + s.w), reach = (a) => s.w * Math.cos(a) + s.h * Math.sin(a);
      let lo = 0, hi = 0.4; for (let q = 0; q < 30; q++) { const m = (lo + hi) / 2; if (reach(m) < s.w + room - 0.004) lo = m; else hi = m; }
      if (lo > 0.05) lean = lo;
    }
    const z = zFront - s.d / 2, M = bookMatrix(THREE, s, x + s.w / 2, y, z, lean);
    // fit: every corner of the book inside its slot
    for (const cx of [-0.5, 0.5]) for (const cy of [-0.5, 0.5]) { const p = new THREE.Vector3(cx, cy, 0).applyMatrix4(M);
      if (p.y > y + clear + 1e-4) faults.push(`book ${s.seed} into the shelf above`); if (p.y < y - 1e-4) faults.push(`book ${s.seed} sunk in its shelf`);
      if (p.x < x0 - 1e-4 || p.x > x1 + 1e-4) faults.push(`book ${s.seed} through the end`); }
    out.push({ spec: s, matrix: M }); x += s.w + 0.001;
  });
  return { placements: out, faults };
}
