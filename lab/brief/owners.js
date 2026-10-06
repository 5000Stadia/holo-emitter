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
import { fillRow, booksMesh, bookContext, bookSpec, bookMatrix, titleIndex, titleOf } from "./book.js";
import { trinketSize, trinketParts, mergeParts } from "./trinkets.js";

// Reviewed 2026-10-05 (a fresh reviewer, the shelves written out): book counts follow means and reading
// (a poor widow usually owns one or two: a Bible, a psalter); only things that stay put hold a run of
// books (a jug or tankard in use gets lifted); a smith's tools stay in the smithy, not the house shelf;
// a great library's unit is one section by subject, folios at the bottom; curiosities stand on top of
// the case; a lantern clock hangs on the wall, never a shelf.
export const OWNERS = {
  // a poor widow: two boards on brackets on the wall; one of each thing she owns
  widow: { said: "a poor widow", means: "poor", topics: { divinity: 4, popular: 2 }, books: { 0: 1, 1: 3, 2: 3, 3: 2, 4: 1 }, care: "tidy",
    keeps: { candlestick: 1, jug: 1, bowl: 1, letters: 1, bottle: 1, box: 1 }, things: [3, 6], daily: ["candlestick", "bowl", "jug"], anchors: ["box"], wood: [1.3, 1.2, 1.05],
    unit: { type: "wall", W: 0.9, ys: [0.95, 1.25] } },
  // a smith's house shelf: domestic things, pewter as a matched pair at most; his stock stays in the smithy
  smith: { said: "the blacksmith", means: "middling", topics: { popular: 3, divinity: 1.5, estate: 1 }, books: { 0: 1, 1: 2, 2: 3, 3: 2, 4: 1 }, care: "rough",
    keeps: { tankard: 2, candlestick: 1, jug: 1, bottle: 1, box: 1, bowl: 2 }, things: [6, 8], daily: ["tankard", "candlestick", "bowl"], anchors: ["box"], wood: [0.75, 0.72, 0.7],
    unit: { type: "open", W: 0.9, H: 1.3, ys: [0.62, 0.96] } },
  // a great library's press: one section by subject, folios at the bottom, curiosities on top
  gentleman: { said: "Sir Fancy-Pants", means: "great", topics: { classics: 3, history: 3, natural: 2, law: 1, divinity: 1 }, books: "fill", section: 2, care: "kept", display: "top",
    keeps: { porcelain: 2, globe: 1, shell: 1 }, things: [2, 3], daily: [], anchors: [], wood: [1, 1, 1],
    unit: { type: "open", W: 1.1, H: 1.95, ys: [0.08, 0.53, 0.88, 1.18, 1.44, 1.7] } },
};
// what's heavy goes low; what breaks goes at hand height; nothing above 1.3 m in a working house
const HEAVY = ["box", "jug", "nails"], FRAGILE = ["bottle", "porcelain", "bowl"];
const pick = (r, weights) => { const e = Object.entries(weights), s = e.reduce((a, [, w]) => a + w, 0); let x = r() * s; for (const [k, w] of e) if ((x -= w) <= 0) return k; return e[e.length - 1][0]; };
const classFor = (clear) => clear >= 0.42 ? "folio" : clear >= 0.32 ? "quarto" : clear >= 0.28 ? "small_quarto" : clear >= 0.23 ? "octavo" : "duodecimo";

// an open set of shelves, kept by an owner: W wide, H high
export function buildOwnedShelves(THREE, K, ownerKey, { W = 1.1, H = 1.95, D = 0.3, seed = 1660 } = {}) {   // W, H, D: overridden by the owner's unit
  const O = OWNERS[ownerKey], r = rng(hash(seed, ownerKey.length, 3) * 1e9 | 0), parts = new Map();
  const wood = K.M.oak.clone(); wood.color = new THREE.Color(...O.wood); wood.userData.cls = "shelf";
  const add = (g, mat) => { if (mat.vertexColors) K.board(g, 0.18); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(g.index ? g.toNonIndexed() : g); };
  const box = (w, h, d, x, y, z) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); add(g, wood); };
  const U = O.unit, t = 0.022, ys = U.ys;
  W = U.W; H = U.H || ys[ys.length - 1] + 0.35; D = U.type === "wall" ? 0.24 : D;
  let side = 0.03;
  if (U.type === "wall") {
    // boards on iron brackets, fixed to the wall: no case, no top
    side = 0;
    for (const y of ys) { box(W, t, D, 0, y - t / 2, D / 2); for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(0.02, 0.12, 0.02); g.translate(sx * (W / 2 - 0.1), y - t - 0.06, 0.03); add(g, wood); } }
  } else {
    for (const sx of [-1, 1]) box(side, H, D, sx * (W / 2 - side / 2), H / 2, D / 2);
    box(W, H, 0.012, 0, H / 2, 0.006); box(W, 0.03, D + 0.02, 0, H - 0.015, (D + 0.02) / 2);
    for (const y of ys) box(W - 2 * side, t, D - 0.01, 0, y - t / 2, (D - 0.01) / 2);
  }
  const shelves = ys.map((y, k) => ({ k, y, clear: (k + 1 < ys.length ? ys[k + 1] - t : (U.type === "wall" ? y + 0.32 : H - 0.03)) - y, x0: -W / 2 + side + 0.005, x1: W / 2 - side - 0.005 }));
  // a great library's unit is one section: one or two subjects, chosen from the owner's
  let topics = O.topics;
  if (O.section) { const keys = []; const w = { ...O.topics }; for (let q = 0; q < O.section; q++) { const k = pick(r, w); keys.push(k); delete w[k]; } topics = Object.fromEntries(keys.map(k => [k, O.topics[k]])); }
  const ctx = { ...bookContext(O.means), topics, more: O.topics, used: new Set() };   // more: the rest of the owner's subjects, when a section runs dry   // used: each work once in this unit
  const sorted = O.care !== "rough";
  const byReach = [...shelves].sort((a, b) => Math.abs(a.y + a.clear / 2 - 1.3) - Math.abs(b.y + b.clear / 2 - 1.3));
  const placements = [], faults = [], free = [], layout = Object.fromEntries([...shelves.map(sh => [sh.k, []]), ["top", []]]);
  const e = new THREE.Euler(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const nThings = Math.round(O.things[0] + r() * (O.things[1] - O.things[0]));
  // drawn without replacement: the profile says how many of each they own, and no more appear
  const pool = { ...O.keeps }, things = [];
  for (let i = 0; i < nThings && Object.values(pool).some(c => c > 0); i++) { const k = pick(r, Object.fromEntries(Object.entries(pool).filter(([, c]) => c > 0))); pool[k]--; things.push({ kind: k, seed: hash(seed, i, 41) * 1e9 | 0 }); }
  const record = (k, list) => { for (const p of list) { p.matrix.decompose(v, q, sc); e.setFromQuaternion(q); const flatB = Math.abs(e.z) > 1.2, lean = !flatB && Math.abs(e.z) > 0.03;
    const half = flatB ? p.spec.h / 2 : p.spec.w / 2 + (lean ? p.spec.h * Math.sin(Math.abs(e.z)) / 2 : 0);
    layout[k].push({ x0: v.x - half, x1: v.x + half, y: v.y, what: `${flatB ? "book lying flat" : lean ? "book leaning" : "book"} (${p.spec.size}, ${p.spec.binding}${p.spec.title >= 0 ? ", " + titleOf(p.spec) : ", untitled"})` }); } };
  if (O.books === "fill") {
    // a library: every shelf full of the size it was built for, folios at the bottom
    for (const sh of shelves) {
      const res = fillRow(THREE, { size: classFor(sh.clear), seed: hash(seed, sh.k, 17) * 1e9 | 0, x0: sh.x0, x1: sh.x1, y: sh.y, zFront: D - 0.02, depthMax: D - 0.04, clear: sh.clear, ctx, sorted: true });
      record(sh.k, res.placements); placements.push(...res.placements); faults.push(...res.faults);
    }
  } else {
    // a household's few books, chosen first, then placed by weight: the Bible, a large quarto, lies flat
    // at hand; the small books stand beside it held by something that stays put, or lie on top of it
    const n = +pick(r, O.books), sh = byReach[0], books = [];
    const bible = O.topics.divinity && r() < 0.85;
    for (let i = 0; i < n; i++) {
      const s = i === 0 && bible ? bookSpec("quarto", hash(seed, i, 23) * 1e9 | 0, ctx, { title: titleIndex("divinity", 0), binding: "plain" })
        : bookSpec(r() < 0.5 ? "octavo" : "duodecimo", hash(seed, i, 23) * 1e9 | 0, ctx);
      s.h = Math.min(s.h, sh.clear - 0.012); s.d = Math.min(s.d, D - 0.04); books.push(s);
    }
    const anchor = things.find(t => O.anchors.includes(t.kind));
    let x = sh.x0, hy = sh.y, z = D - 0.02;
    const flatHere = [], standing = [];
    for (const s of books) (s === books[0] && bible) || s.binding === "paper" || !anchor ? flatHere.push(s) : standing.push(s);
    flatHere.sort((a, b) => b.h * b.d - a.h * a.d);
    const heapW = flatHere.length ? flatHere[0].h : 0;
    for (const s of flatHere) { if (hy + s.w > sh.y + sh.clear) break; placements.push({ spec: s, matrix: bookMatrix(THREE, s, x + heapW / 2, hy, z - s.d / 2, 0, true) }); hy += s.w; }
    record(sh.k, placements);
    x += heapW + (heapW ? 0.006 : 0);
    const st = [];
    for (const s of standing.sort((a, b) => b.h - a.h)) { st.push({ spec: s, matrix: bookMatrix(THREE, s, x + s.w / 2, sh.y, z - s.d / 2) }); x += s.w + 0.001; }
    record(sh.k, st); placements.push(...st);
    free.push({ sh, x: x + 0.004, hold: standing.length > 0 });
    for (const o of byReach) if (o !== sh) free.push({ sh: o, x: o.x0 });
  }
  // place the things: a heavy one first against any run that needs holding, then the rest, daily things
  // on the shelves at hand height, others above and below; each stands where it fits, never overlapping
  const out = [];
  const place = (f, t) => {
    const [w, h, d] = trinketSize(t.kind, t.seed);
    if (h > f.sh.clear - 0.01 || f.x + w > f.sh.x1) return false;
    const turn = (rng(t.seed)() - 0.5) * 0.8;
    out.push(...trinketParts(THREE, K, t.kind, t.seed, f.x + w / 2, f.sh.y, D - 0.03 - d / 2 - 0.01, turn));
    layout[f.sh.k].push({ x0: f.x, x1: f.x + w, what: t.kind });
    f.x += w + (O.care === "kept" ? 0.08 : 0.025 + rng(t.seed + 1)() * 0.06);
    return true;
  };
  // a great house sets its curiosities on top of the case
  if (O.display === "top") { free.length = 0; free.push({ sh: { k: "top", y: H, clear: 1, x0: -W / 2 + 0.06, x1: W / 2 - 0.06 }, x: -W / 2 + 0.08 }); }
  const left = [...things];
  for (const f of free.filter(f => f.hold)) { const i = left.findIndex(t => O.anchors.includes(t.kind)); if (i >= 0 && place({ ...f, x: f.x - 0.002 }, left[i]) ) { f.x += trinketSize(left[i].kind, left[i].seed)[0] + 0.03; left.splice(i, 1); } }
  const reachable = free.filter(f => O.display === "top" || f.sh.y <= 1.3);
  const atHand = [...reachable].sort((a, b) => Math.abs(a.sh.y - 1.05) - Math.abs(b.sh.y - 1.05)), low = [...reachable].sort((a, b) => a.sh.y - b.sh.y);
  const rank = (t) => O.daily.includes(t.kind) ? 0 : FRAGILE.includes(t.kind) ? 1 : HEAVY.includes(t.kind) ? 3 : 2;
  left.sort((a, b) => rank(a) - rank(b));
  const withBooks = reachable.filter(f => f.x > f.sh.x0 + 0.01), others = reachable.filter(f => !withBooks.includes(f));
  for (const t of left) for (const f of (O.display === "top" ? atHand : HEAVY.includes(t.kind) && !O.daily.includes(t.kind) ? [...others.sort((a, b) => a.sh.y - b.sh.y), ...withBooks] : [...withBooks, ...others])) if (place(f, t)) break;
  const grp = new THREE.Group();
  const shelfMesh = mergeParts(THREE, [...parts].flatMap(([mat, gs]) => gs.map(g => ({ g, mat }))), "shelves");
  grp.add(shelfMesh, mergeParts(THREE, out, "things"));
  if (placements.length) grp.add(booksMesh(THREE, K, placements));
  // the shelf written out as a person would describe it: what stands where, left to right, with the gaps
  const text = [...(O.unit.type === "wall" ? [] : [{ k: "top", y: H, clear: 1, x0: -W / 2 + 0.06, x1: W / 2 - 0.06, top: true }]), ...[...shelves].sort((a, b) => b.y - a.y)].map(sh => {
    const items = layout[sh.k].sort((a, b) => a.x0 - b.x0); let x = sh.x0; const parts = [];
    for (const it of items) { if (it.x0 - x > 0.02) parts.push(`[gap ${Math.round((it.x0 - x) * 100)} cm]`); parts.push(it.what); x = Math.max(x, it.x1); }
    if (sh.x1 - x > 0.02) parts.push(`[empty ${Math.round((sh.x1 - x) * 100)} cm]`);
    return `${sh.top ? "top of the case" : O.unit.type === "wall" ? "wall board" : "shelf"} at ${sh.y.toFixed(2)} m (${sh.top ? "" : `clear ${Math.round(sh.clear * 100)} cm, `}${Math.round((sh.x1 - sh.x0) * 100)} cm wide): ${parts.length ? parts.join(", ") : "empty"}`; }).join("\n");
  grp.userData = { kind: "owned_shelves", owner: O.said, subjects: Object.keys(topics), books: placements.length, things: nThings, faults, size: [W, H, D], layout: text };
  return grp;
}
