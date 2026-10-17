// The books' spines (books.js): 256 designs in four bindings, gilt, plain calf, vellum and paper wrappers, and the page
// block's cell, drawn on one canvas once per look. Moved here from books.js unchanged in what it draws (R81, 2026-10-17:
// on the main thread it was the first bookpress's ~170 ms of the ~300 a room step took), so the kit's texture workers draw
// it (lab/painted/texjobs.js) and keep it in IndexedDB: a second visit draws nothing. Pure: imports only texgen's rng.
//   GEN.spines: args [seed] -> the atlas, CW x CH; spineCell(k) -> cell k's [u0, v0, u1, v1]
import { rng } from "../../../lab/painted/texgen.js";

export const DEPS = [new URL("../../../lab/painted/texgen.js", import.meta.url).href];
export const CELLS = 256;
const cw = 48, ch = 384, cols = 32, rows = Math.ceil((CELLS + 1) / cols), CW = cols * cw, CH = rows * ch;
export const spineCell = (k) => { const x = (k % cols) * cw, y = Math.floor(k / cols) * ch; return [x / CW, 1 - (y + ch) / CH, (x + cw) / CW, 1 - y / CH]; };
// (a worker has no DOM: an OffscreenCanvas there, a plain canvas where there is none)
const canvas = (w, h) => typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });

function paintSpines([seed]) {
  const c = canvas(CW, CH);
  const g = c.getContext("2d"), r = rng(seed);
  const gilt = (a) => `rgba(${196 + r() * 30},${158 + r() * 24},${70 + r() * 20},${a})`;
  const wear = (x, y, n) => { for (let q = 0; q < n; q++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,240,220"},${0.03 + r() * 0.05})`; g.fillRect(x + r() * cw, y + r() * ch, 1 + r() * 3, 1 + r() * 6); } };
  const bandsAt = (y) => { const top = 0.06, step = 0.88 / 6; return [1, 2, 3, 4, 5].map(b => y + ch * (top + step * b)); };
  for (let k = 0; k < CELLS; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
    const kind = k < 128 ? "gilt" : k < 192 ? "plain" : k < 224 ? "vellum" : "paper";
    let base;
    if (kind === "gilt") { const t = r(); base = t < 0.1 ? [118, 42, 32] : t < 0.16 ? [40, 52, 40] : (() => { const s = 0.45 + r() * 0.55; return [118 * s + 30, 74 * s + 18, 42 * s + 10]; })(); }
    if (kind === "plain") { const s = 0.35 + r() * 0.45; base = [104 * s + 34, 72 * s + 24, 46 * s + 16]; }
    if (kind === "vellum") { const s = 0.9 + r() * 0.1; base = [214 * s, 200 * s, 168 * s]; }
    if (kind === "paper") { const t = r(); base = t < 0.4 ? [118, 124, 128] : t < 0.7 ? [150, 128, 96] : [104, 92, 80]; }
    g.fillStyle = `rgb(${base.map(v => v | 0).join(",")})`; g.fillRect(x, y, cw, ch);
    wear(x, y, kind === "paper" ? 260 : 160);
    const rub = g.createLinearGradient(0, y, 0, y + ch); rub.addColorStop(0, "rgba(240,220,190,0.22)"); rub.addColorStop(0.06, "rgba(0,0,0,0)"); rub.addColorStop(0.94, "rgba(0,0,0,0)"); rub.addColorStop(1, "rgba(240,220,190,0.22)");
    g.fillStyle = rub; g.fillRect(x, y, cw, ch);
    if (kind === "gilt" || kind === "plain") for (const by of bandsAt(y)) {
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, by - 3, cw, 6);
      g.fillStyle = kind === "gilt" ? gilt(0.85) : "rgba(0,0,0,0.3)"; g.fillRect(x + 3, by - 6, cw - 6, 1.4); g.fillRect(x + 3, by + 5, cw - 6, 1.4);
    }
    if (kind === "gilt") {
      const top = 0.06, step = 0.88 / 6, lp = y + ch * (top + step) + 8, lh = ch * step - 16;
      g.fillStyle = r() < 0.6 ? "rgb(120,30,24)" : "rgb(26,20,16)"; g.fillRect(x + 4, lp, cw - 8, lh);
      for (let p = 2; p <= 5; p++) { const py = y + ch * (top + step * p + step / 2); g.fillStyle = gilt(0.7); g.beginPath(); g.arc(x + cw / 2, py, 3.5, 0, 7); g.fill(); g.fillRect(x + cw / 2 - 7, py - 0.6, 14, 1.2); g.fillRect(x + cw / 2 - 0.6, py - 7, 1.2, 14); }
    }
    if (kind === "vellum") { g.strokeStyle = "rgba(120,100,70,0.25)"; g.lineWidth = 1; for (const f of [0.2, 0.8]) { g.beginPath(); g.moveTo(x, y + ch * f); g.lineTo(x + cw, y + ch * f); g.stroke(); } }
    if (kind === "paper" && r() < 0.4) { for (let q = 0; q < 30; q++) { g.fillStyle = `rgba(${r() * 80 | 0},${r() * 60 | 0},${r() * 90 | 0},0.12)`; g.beginPath(); g.arc(x + r() * cw, y + r() * ch, 2 + r() * 6, 0, 7); g.fill(); } }   // marbled
  }
  const px = (CELLS % cols) * cw, py = Math.floor(CELLS / cols) * ch;
  g.fillStyle = "rgb(222,210,182)"; g.fillRect(px, py, cw, ch);
  for (let q = 0; q < ch; q += 2) { g.fillStyle = `rgba(120,100,70,${0.05 + r() * 0.08})`; g.fillRect(px, py + q, cw, 1); }
  return { map: g.getImageData(0, 0, CW, CH).data };
}

// a phone keeps the atlas at half size, 768 x 1728 (7 MB on the GPU, not 27; the cells are in 0..1, so nothing else changes):
// halved once, where the kit's other textures are held to 512 a side
export const GEN = { spines: { whole: true, cost: 0.06, normal: null, phoneCap: CH / 2, size: () => [CW, CH], paint: paintSpines } };
export const LIB = { url: import.meta.url, GEN };
