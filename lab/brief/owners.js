// An owner, and the shelf they would keep. The profile is what the ONE AI call writes when a place is
// assembled from a description ("a poor widow", "the smith", "Sir Fancy-Pants"): a few lines in the
// catalogue's own terms (their means, what they read, what else they keep, how they keep it). Everything
// after it is rules, the same every time from the seed:
//   - books stay together in one run, tucked to the left; few books go on the shelf nearest the eye;
//   - a run that stops short of the shelf's end is held: by something heavy the owner keeps, or by books
//     laid flat;
//   - the rest of the shelf, and the shelves with no books, hold the owner's other things, the ones in
//     daily use at hand height, the rest above and below.
import { metric, rng, hash } from "../painted/procedural.js";
import { fillRow, booksMesh, bookContext, SIZE_CLASSES } from "./book.js";
import { trinketSize, trinketParts, mergeParts } from "./trinkets.js";

export const OWNERS = {
  widow: { said: "a poor widow", means: "poor", topics: { divinity: 4, popular: 2 }, books: [3, 8], care: "tidy",
    keeps: { candlestick: 2, jug: 1, bowl: 1, letters: 1, bottle: 1, box: 1 }, things: [4, 7], daily: ["candlestick", "bowl", "jug"], heavy: ["jug", "box"], wood: [1.3, 1.2, 1.05] },
  smith: { said: "the blacksmith", means: "middling", topics: { popular: 3, divinity: 1.5, estate: 1 }, books: [5, 12], care: "rough",
    keeps: { horseshoe: 3, nails: 2, tankard: 2, candlestick: 1, jug: 1, bottle: 2, box: 1 }, things: [8, 13], daily: ["tankard", "candlestick", "nails"], heavy: ["nails", "jug", "tankard", "box"], wood: [0.75, 0.72, 0.7] },
  gentleman: { said: "Sir Fancy-Pants", means: "great", topics: { classics: 3, history: 3, natural: 2, law: 1, divinity: 1 }, books: [400, 400], care: "kept", display: 1,
    keeps: { porcelain: 3, globe: 1, clock: 1, shell: 1, candlestick: 1 }, things: [3, 5], daily: ["candlestick"], heavy: [], wood: [1, 1, 1] },
};
const pick = (r, weights) => { const e = Object.entries(weights), s = e.reduce((a, [, w]) => a + w, 0); let x = r() * s; for (const [k, w] of e) if ((x -= w) <= 0) return k; return e[e.length - 1][0]; };

// an open set of shelves, kept by an owner: W wide, H high
export function buildOwnedShelves(THREE, K, ownerKey, { W = 1.1, H = 1.95, D = 0.3, seed = 1660 } = {}) {
  const O = OWNERS[ownerKey], r = rng(hash(seed, ownerKey.length, 3) * 1e9 | 0), parts = new Map();
  const wood = K.M.oak.clone(); wood.color = new THREE.Color(...O.wood); wood.userData.cls = "shelf";
  const add = (g, mat) => { if (mat.vertexColors) K.board(g, 0.18); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g.index ? g.toNonIndexed() : g); };
  const box = (w, h, d, x, y, z) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); add(g, wood); };
  const side = 0.03, ys = [0.08, 0.46, 0.8, 1.12, 1.42, 1.7], t = 0.022;
  for (const sx of [-1, 1]) box(side, H, D, sx * (W / 2 - side / 2), H / 2, D / 2);
  box(W, H, 0.012, 0, H / 2, 0.006); box(W, 0.03, D + 0.02, 0, H - 0.015, (D + 0.02) / 2);
  for (const y of ys) box(W - 2 * side, t, D - 0.01, 0, y - t / 2, (D - 0.01) / 2);
  const shelves = ys.map((y, k) => ({ k, y, clear: (k + 1 < ys.length ? ys[k + 1] - t : H - 0.03) - y, x0: -W / 2 + side + 0.005, x1: W / 2 - side - 0.005 }));
  const ctx = { ...bookContext(O.means), topics: O.topics };
  const sorted = O.care !== "rough";
  // how many books, and which shelves they go on: nearest the eye first
  let books = Math.round(O.books[0] + r() * (O.books[1] - O.books[0]));
  const byReach = [...shelves].sort((a, b) => Math.abs(a.y + a.clear / 2 - 1.3) - Math.abs(b.y + b.clear / 2 - 1.3));
  const placements = [], faults = [], free = [];
  // the owner's other things, drawn from what they keep
  const nThings = Math.round(O.things[0] + r() * (O.things[1] - O.things[0]));
  const things = Array.from({ length: nThings }, (_, i) => ({ kind: pick(r, O.keeps), seed: hash(seed, i, 41) * 1e9 | 0 }));
  // a great house shows its curiosities: its top shelf is kept for display, not books
  const shown = new Set(O.display ? [...shelves].sort((a, b) => b.y - a.y).slice(0, O.display).map(s => s.k) : []);
  for (const sh of byReach) {
    if (books <= 0 || shown.has(sh.k)) { free.push({ sh, x: sh.x0 }); continue; }
    const size = sh.clear > 0.37 ? "quarto" : sh.clear > 0.3 ? "small_quarto" : "octavo";
    const needHold = O.care !== "kept" && things.some(t => O.heavy.includes(t.kind));
    const res = fillRow(THREE, { size, seed: hash(seed, sh.k, 17) * 1e9 | 0, x0: sh.x0, x1: sh.x1, y: sh.y, zFront: D - 0.02, depthMax: D - 0.04, clear: sh.clear, ctx,
      count: books, tuck: O.care !== "kept", holder: needHold, sorted });
    placements.push(...res.placements); faults.push(...res.faults); books -= res.placements.length;
    free.push({ sh, x: res.end + 0.004, hold: needHold && res.end < sh.x1 - 0.05 });
  }
  // place the things: a heavy one first against any run that needs holding, then the rest, daily things
  // on the shelves at hand height, others above and below; each stands where it fits, never overlapping
  const out = [];
  const place = (f, t) => {
    const [w, h, d] = trinketSize(t.kind, t.seed);
    if (h > f.sh.clear - 0.01 || f.x + w > f.sh.x1) return false;
    const turn = (rng(t.seed)() - 0.5) * 0.8;
    out.push(...trinketParts(THREE, K, t.kind, t.seed, f.x + w / 2, f.sh.y, D - 0.03 - d / 2 - 0.01, turn));
    f.x += w + (O.care === "kept" ? 0.08 : 0.025 + rng(t.seed + 1)() * 0.06);
    return true;
  };
  const left = [...things];
  for (const f of free.filter(f => f.hold)) { const i = left.findIndex(t => O.heavy.includes(t.kind)); if (i >= 0 && place({ ...f, x: f.x - 0.002 }, left[i]) ) { f.x += trinketSize(left[i].kind, left[i].seed)[0] + 0.03; left.splice(i, 1); } }
  const order = [...free].sort((a, b) => Math.abs(a.sh.y - 1.1) - Math.abs(b.sh.y - 1.1));
  left.sort((a, b) => (O.daily.includes(b.kind) ? 1 : 0) - (O.daily.includes(a.kind) ? 1 : 0));
  for (const t of left) for (const f of order) if (place(f, t)) break;
  const grp = new THREE.Group();
  const shelfMesh = mergeParts(THREE, [...parts].flatMap(([mat, gs]) => gs.map(g => ({ g, mat }))), "shelves");
  grp.add(shelfMesh, mergeParts(THREE, out, "things"));
  if (placements.length) grp.add(booksMesh(THREE, K, placements));
  grp.userData = { kind: "owned_shelves", owner: O.said, books: placements.length, things: nThings, faults, size: [W, H, D] };
  return grp;
}
