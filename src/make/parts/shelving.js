// Shelving, and the habit of a shelf: what a keeper puts on it. The structure parts leave their
// shelves in c.shared.shelves; shelf_habit dresses them from the context that reaches the shelves (an
// owner's traits, a room's purpose, blended: src/make/influence.js). Rules, the same every time from
// the birth address:
//   - books stay together in one run, tucked to the left; few books go on the shelf nearest the eye;
//   - a run that stops short of the shelf's end is held: by something heavy that stays put, or by
//     books laid flat;
//   - the rest of the shelf, and the shelves with no books, hold the keeper's other things: daily ones
//     at hand height, fragile ones at hand, heavy ones low; nothing above 1.3 m in a working house;
//   - a great house sets its curiosities on top of the case; a library is filled by size, folios low.
// The things are built from their own kinds as children, so each works (a lid lifts, a candle lights).
import { definePart, kindOf, kinds, sizeOf } from "../catalogue.js";
import { build } from "../build.js";
import { seedOf, at } from "../id.js";
import { plainBox } from "./joinery.js";
import { fillRow, booksMesh, bookContext, bookSpec, bookMatrix, titleIndex, titleOf, titleNamed } from "./books.js";

const shelfWood = (c) => { const tone = c.context.wood_tone || [1, 1, 1], m = c.mat("wood").clone(); m.color = new c.THREE.Color(...tone); m.userData.cls = "shelf"; return m; };

// boards on iron brackets, fixed to the wall: no case, no top
definePart("shelf_boards", {
  build(c, { W, D, ys, t = 0.022 }) {
    const { THREE } = c, wood = shelfWood(c);
    for (const y of ys) {
      c.add(plainBox(THREE, W, t, D, 0, y - t / 2, D / 2), wood, { spread: 0.18 });
      for (const sx of [-1, 1]) c.add(plainBox(THREE, 0.02, 0.12, 0.02, sx * (W / 2 - 0.1), y - t - 0.06, 0.03), wood, { spread: 0.18 });
    }
    c.shared.shelves = ys.map((y, k) => ({ k, y, clear: (k + 1 < ys.length ? ys[k + 1] - t : y + 0.32) - y, x0: -W / 2 + 0.005, x1: W / 2 - 0.005 }));
    c.shared.unit = { W, H: ys[ys.length - 1] + 0.35, D, wall: true };
    c.footprint({ w: W, d: D, h: ys[ys.length - 1] });
  },
});

// an open case: sides, a back, a top, shelves
definePart("shelf_case", {
  build(c, { W, H, D, ys, t = 0.022, side = 0.03 }) {
    const { THREE } = c, wood = shelfWood(c), box = (w, h, d, x, y, z) => c.add(plainBox(THREE, w, h, d, x, y, z), wood, { spread: 0.18 });
    for (const sx of [-1, 1]) box(side, H, D, sx * (W / 2 - side / 2), H / 2, D / 2);
    box(W, H, 0.012, 0, H / 2, 0.006); box(W, 0.03, D + 0.02, 0, H - 0.015, (D + 0.02) / 2);
    for (const y of ys) box(W - 2 * side, t, D - 0.01, 0, y - t / 2, (D - 0.01) / 2);
    c.shared.shelves = ys.map((y, k) => ({ k, y, clear: (k + 1 < ys.length ? ys[k + 1] - t : H - 0.03) - y, x0: -W / 2 + side + 0.005, x1: W / 2 - side - 0.005 }));
    c.shared.unit = { W, H, D, wall: false };
    c.footprint({ w: W, d: D, h: H });
  },
});

const HAND = 1.3;
const pick = (r, weights) => { const e = Object.entries(weights), s = e.reduce((a, [, w]) => a + w, 0); let x = r() * s; for (const [k, w] of e) if ((x -= w) <= 0) return k; return e[e.length - 1][0]; };
const classFor = (clear) => clear >= 0.42 ? "folio" : clear >= 0.32 ? "quarto" : clear >= 0.28 ? "small_quarto" : clear >= 0.23 ? "octavo" : "duodecimo";
// a kept thing named by its kind, or by its family ("porcelain": any kind of porcelain, chosen by seed)
const kindFor = (name, seed) => { if (kindOf(name)) return name; const fam = kinds().filter(k => k.kind.startsWith(`${name}/`)).map(k => k.kind).sort(); return fam.length ? fam[seed % fam.length] : null; };
const has = (kind, trait) => (kindOf(kind).traits || []).includes(trait);

definePart("shelf_habit", {
  build(c) {
    const { THREE, K } = c, C = c.context, shelves = c.shared.shelves, U = c.shared.unit, r = c.r("habit"), D = U.D;
    if (!shelves) throw new Error(`${c.address}: shelf_habit needs shelves from a structure part before it`);
    const layout = Object.fromEntries([...shelves.map(sh => [sh.k, []]), ["top", []]]);
    const placements = [], faults = [], free = [];
    // a great library's unit is one section: one or two subjects, chosen from the keeper's
    let topics = C.topics || {};
    if (C.section) { const keys = [], w = { ...topics }; for (let q = 0; q < C.section && Object.keys(w).length; q++) { const k = pick(r, w); keys.push(k); delete w[k]; } topics = Object.fromEntries(keys.map(k => [k, C.topics[k]])); }
    const ctx = { ...bookContext(C.means || "gentry"), topics, more: C.topics, used: new Set() };   // more: the rest, when a section runs dry; used: each work once
    const byReach = [...shelves].sort((a, b) => Math.abs(a.y + a.clear / 2 - HAND) - Math.abs(b.y + b.clear / 2 - HAND));
    // what they keep, drawn without replacement: the profile says how many of each, and no more appear
    const [t0, t1] = C.things || [0, 0], nThings = Math.round(t0 + r() * (t1 - t0));
    const pool = { ...(C.keeps || {}) }, things = [];
    for (let i = 0; i < nThings && Object.values(pool).some(n => n >= 1); i++) {
      const name = pick(r, Object.fromEntries(Object.entries(pool).filter(([, n]) => n >= 1))); pool[name]--;
      const address = at(c.address, `thing:${i}`), kind = kindFor(name, seedOf(address));
      if (kind) things.push({ kind, address, size: sizeOf(kindOf(kind), seedOf(address)) });
    }
    const record = (k, list) => { const e = new THREE.Euler(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      for (const p of list) { p.matrix.decompose(v, q, sc); e.setFromQuaternion(q); const flatB = Math.abs(e.z) > 1.2, lean = !flatB && Math.abs(e.z) > 0.03;
        const half = flatB ? p.spec.h / 2 : p.spec.w / 2 + (lean ? p.spec.h * Math.sin(Math.abs(e.z)) / 2 : 0);
        layout[k].push({ x0: v.x - half, x1: v.x + half, what: `${flatB ? "book lying flat" : lean ? "book leaning" : "book"} (${p.spec.size}, ${p.spec.binding}${p.spec.title >= 0 ? ", " + titleOf(p.spec) : ", untitled"})` }); } };
    // the books the story names for this case (heroes), born at their own address, standing first in
    // the row of their size; the rest of that row repacks after them, as on a real shelf
    const heroes = (C.heroes || []).filter(h => h.book && h.in === c.address).map((h, i) => ({ size: h.book.size, spec: bookSpec(h.book.size, seedOf(at(c.address, `hero:${h.name || i}`)), ctx, { title: titleNamed(h.book.title), binding: h.book.binding || "gilt" }) }));
    if (C.books === "fill") {
      // a library: every shelf full of the size it was built for, folios at the bottom
      for (const sh of shelves) {
        const size = classFor(sh.clear), first = heroes.filter(h => h.size === size).map(h => h.spec);
        const res = fillRow(THREE, { size, seed: seedOf(at(c.address, `shelf:${sh.k}`)), x0: sh.x0, x1: sh.x1, y: sh.y, zFront: D - 0.02, depthMax: D - 0.04, clear: sh.clear, ctx, sorted: true, first });
        record(sh.k, res.placements); placements.push(...res.placements); faults.push(...res.faults);
      }
    } else if (C.books) {
      // a household's few books, chosen first, then placed by weight: the Bible, a large quarto, lies
      // flat at hand; the small books stand beside it held by something that stays put, or lie on it
      const n = +pick(r, C.books), sh = byReach[0], books = [];
      const bible = (C.topics || {}).divinity && r() < 0.85;
      for (let i = 0; i < n; i++) {
        const seed = seedOf(at(c.address, `book:${i}`));
        const s = i === 0 && bible ? bookSpec("quarto", seed, ctx, { title: titleIndex("divinity", 0), binding: "plain" }) : bookSpec(r() < 0.5 ? "octavo" : "duodecimo", seed, ctx);
        s.h = Math.min(s.h, sh.clear - 0.012); s.d = Math.min(s.d, D - 0.04); books.push(s);
      }
      const anchor = things.find(t => has(t.kind, "stays_put"));
      let x = sh.x0, hy = sh.y;
      const z = D - 0.02, flatHere = [], standing = [];
      for (const s of books) (s === books[0] && bible) || s.binding === "paper" || !anchor ? flatHere.push(s) : standing.push(s);
      flatHere.sort((a, b) => b.h * b.d - a.h * a.d);
      const heapW = flatHere.length ? flatHere[0].h : 0, here = [];
      for (const s of flatHere) { if (hy + s.w > sh.y + sh.clear) break; here.push({ spec: s, matrix: bookMatrix(THREE, s, x + heapW / 2, hy, z - s.d / 2, 0, true) }); hy += s.w; }
      record(sh.k, here); placements.push(...here);
      x += heapW + (heapW ? 0.006 : 0);
      const st = [];
      for (const s of standing.sort((a, b) => b.h - a.h)) { st.push({ spec: s, matrix: bookMatrix(THREE, s, x + s.w / 2, sh.y, z - s.d / 2) }); x += s.w + 0.001; }
      record(sh.k, st); placements.push(...st);
      free.push({ sh, x: x + 0.004, hold: standing.length > 0 });
      for (const o of byReach) if (o !== sh) free.push({ sh: o, x: o.x0 });
    } else for (const o of byReach) free.push({ sh: o, x: o.x0 });
    // the things: built from their kinds, standing where they fit, never overlapping
    const place = (f, t) => {
      const [w, h, d] = t.size;
      if (h > f.sh.clear - 0.01 || f.x + w > f.sh.x1) return false;
      const b = build(THREE, K, c.look, t.kind, t.address, {}, c.context);
      b.node.position.set(f.x + w / 2, f.sh.y, D - 0.03 - d / 2 - 0.01); b.node.rotation.y = (c.r(`turn:${t.address}`)() - 0.5) * 0.8;
      c.child(b);
      layout[f.sh.k].push({ x0: f.x, x1: f.x + w, what: kindOf(t.kind).noun.replace(/^the /, "") });
      f.x += w + (C.care === "kept" ? 0.08 : 0.025 + c.r(`gap:${t.address}`)() * 0.06);
      return true;
    };
    if (C.display === "top") { free.length = 0; free.push({ sh: { k: "top", y: U.H, clear: 1, x0: -U.W / 2 + 0.06, x1: U.W / 2 - 0.06 }, x: -U.W / 2 + 0.08 }); }
    const left = [...things];
    // a heavy thing that stays put first, against any run of books that needs holding
    for (const f of free.filter(f => f.hold)) { const i = left.findIndex(t => has(t.kind, "stays_put")); if (i >= 0 && place({ ...f, x: f.x - 0.002 }, left[i])) { f.x += left[i].size[0] + 0.03; left.splice(i, 1); } }
    const reachable = free.filter(f => C.display === "top" || f.sh.y <= HAND);
    const atHand = [...reachable].sort((a, b) => Math.abs(a.sh.y - 1.05) - Math.abs(b.sh.y - 1.05));
    const daily = (t) => (C.daily || []).includes(t.kind);
    const rank = (t) => daily(t) ? 0 : has(t.kind, "fragile") ? 1 : has(t.kind, "heavy") ? 3 : 2;
    left.sort((a, b) => rank(a) - rank(b));
    const withBooks = reachable.filter(f => f.x > f.sh.x0 + 0.01), others = reachable.filter(f => !withBooks.includes(f));
    for (const t of left) for (const f of (C.display === "top" ? atHand : has(t.kind, "heavy") && !daily(t) ? [...others.sort((a, b) => a.sh.y - b.sh.y), ...withBooks] : [...withBooks, ...others])) if (place(f, t)) break;
    if (placements.length) c.extra(booksMesh(THREE, K, placements));
    // the shelf written out as a person would describe it: what stands where, left to right, with gaps
    c.info.layout = [...(U.wall ? [] : [{ k: "top", y: U.H, clear: 1, x0: -U.W / 2 + 0.06, x1: U.W / 2 - 0.06, top: true }]), ...[...shelves].sort((a, b) => b.y - a.y)].map(sh => {
      const items = layout[sh.k].sort((a, b) => a.x0 - b.x0); let x = sh.x0; const parts = [];
      for (const it of items) { if (it.x0 - x > 0.02) parts.push(`[gap ${Math.round((it.x0 - x) * 100)} cm]`); parts.push(it.what); x = Math.max(x, it.x1); }
      if (sh.x1 - x > 0.02) parts.push(`[empty ${Math.round((sh.x1 - x) * 100)} cm]`);
      return `${sh.top ? "top of the case" : U.wall ? "wall board" : "shelf"} at ${sh.y.toFixed(2)} m (${sh.top ? "" : `clear ${Math.round(sh.clear * 100)} cm, `}${Math.round((sh.x1 - sh.x0) * 100)} cm wide): ${parts.length ? parts.join(", ") : "empty"}`; }).join("\n");
    Object.assign(c.info, { keeper: (C.from || []).join(" + "), subjects: Object.keys(topics), books: placements.length, things: things.length, faults });
  },
});
