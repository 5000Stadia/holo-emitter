// The period brief, compiled (R45). A room is the plan's room (lab/house/plan-compile.js) with the
// brief's pins applied: each pin changes what it may, and every pin is reported as honoured, adjusted
// (the brief overrode a fitting the plan put there) or in conflict (the plan governs it, so the build
// keeps the plan and says what would have to change). Pure: plan + brief in, schematic + report out;
// no three.js, so Node can check it (tools/brief-check.mjs).
import { compileRoom } from "../house/plan-compile.js";

const r2 = (x) => Math.round(x * 1000) / 1000;

// what stands on the floor along a wall, in plan metres: a box per item, so items on different walls
// can see each other at the corners
function wallFrame(room, F) {
  const { x0, x1, y0, y1 } = room.rect;
  // r along the wall from its left corner as you face it; out = into the room
  if (F === "N") return { L: x1 - x0, at: (r, o) => [x0 + r, y1 - o] };
  if (F === "S") return { L: x1 - x0, at: (r, o) => [x1 - r, y0 + o] };
  if (F === "E") return { L: y1 - y0, at: (r, o) => [x1 - o, y1 - r] };
  return { L: y1 - y0, at: (r, o) => [x0 + o, y0 + r] };
}
const boxOf = (fr, a, b, depth) => {
  const p = [fr.at(a, 0), fr.at(b, 0), fr.at(a, depth), fr.at(b, depth)];
  return { x0: Math.min(...p.map(q => q[0])), x1: Math.max(...p.map(q => q[0])), y0: Math.min(...p.map(q => q[1])), y1: Math.max(...p.map(q => q[1])) };
};
const overlaps = (A, B, gap = 0) => A.x0 < B.x1 + gap && A.x1 > B.x0 - gap && A.y0 < B.y1 + gap && A.y1 > B.y0 - gap;

// the free stretches of a wall for something `depth` deep and `tall` high, given what is already down
function spans(fr, F, elems, taken, depth, tall, clear = 0.12) {
  const cuts = [];
  for (const e of elems) {
    if (e.kind === "door" || e.kind === "open") cuts.push([e.r0 - clear, e.r1 + clear]);
    if (e.kind === "window" && tall > e.sill - 0.02) cuts.push([e.r0 - 0.04, e.r1 + 0.04]);
  }
  // whatever another item already occupies along this wall's strip
  const N = 200;
  for (let i = 0; i < N; i++) {
    const a = fr.L * i / N, b = fr.L * (i + 1) / N;
    if (taken.some(t => overlaps(boxOf(fr, a, b, depth), t.box, 0.02))) cuts.push([a, b]);
  }
  cuts.sort((p, q) => p[0] - q[0]);
  const out = []; let x = 0.02;
  for (const [a, b] of cuts) { if (a > x) out.push([x, a]); x = Math.max(x, b); }
  if (x < fr.L - 0.02) out.push([x, fr.L - 0.02]);
  return out.filter(([a, b]) => b - a > 0.05);
}

// every floor item's box in plan metres, and the strip in front of it that its use needs clear
// (drawers pulled, the chest's lid, a chair at the table)
export function footprints(out) {
  const room = { rect: out.room.rect }, res = [];
  const front = { press: 0.4, chest: 0.3, desk: 0.5 };
  for (const [F, es] of Object.entries(out.walls)) {
    const fr = wallFrame(room, F);
    for (const e of es) {
      if (!(e.kind in front)) continue;
      const [a, b] = e.kind === "press" ? [e.r0, e.r1] : [e.r - (e.width ?? e.w) / 2, e.r + (e.width ?? e.w) / 2];
      const d = e.kind === "press" ? e.depth + 0.05 : e.kind === "chest" ? e.d : e.depth;
      const box = boxOf(fr, a, b, d), all = boxOf(fr, a + 0.02, b - 0.02, d + front[e.kind]);
      res.push({ id: e.id, F, box, use: all });
    }
  }
  return res;
}
export { overlaps };

export function compileBrief(plan, roomId, brief) {
  let labels = null;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const room = plan.rooms.find(r => r.id === roomId);
  if (!room) throw new Error(`no room ${roomId} in the plan`);
  const B = brief.rooms[roomId];
  const base = compileRoom(plan, room);
  const walls = Object.fromEntries(Object.entries(base.walls).map(([F, es]) => [F, es.map(e => ({ ...e }))]));
  const pin = Object.fromEntries((B?.pins || []).map(p => [p.id, p]));
  const report = [], say = (id, status, text) => report.push({ pin: id, status, text, rule: pin[id]?.rule, source: pin[id]?.source });
  const W = room.rect.x1 - room.rect.x0, D = room.rect.y1 - room.rect.y0, H = base.H;
  const finish = { walls: base.style === "limewashed" ? "limewash" : "panelled", floor: base.floor, ceiling: "flat" };
  const taken = [];          // floor items placed so far: { id, box }

  // no fire: a fireplace in the plan is a fitting the brief may take out
  if (pin.no_fire) {
    const gone = [];
    for (const F of Object.keys(walls)) walls[F] = walls[F].filter(e => e.kind !== "chimneypiece" || (gone.push(`${e.id} on ${F}`), false));
    if (gone.length) say("no_fire", "adjusted", `The plan puts a fireplace here (${gone.join(", ")}). Taken out: fire is what this room guards against. The plan should drop it.`);
    else say("no_fire", "honoured", "No fireplace in the plan.");
  }

  // the shell: what it is made of, and the vault's line
  if (pin.incombustible) {
    const p = pin.incombustible;
    Object.assign(finish, { walls: p.walls, floor: p.floor, ceiling: p.ceiling });
    if (p.ceiling === "vault") {
      // span the shorter way, so the vault springs off the two long walls
      const axis = W >= D ? "EW" : "NS", spring = Math.min(p.vault?.spring ?? 2.1, H - 0.4);
      finish.vault = { axis, spring: r2(spring), crown: r2(H), springWalls: axis === "EW" ? ["N", "S"] : ["E", "W"] };
      const clash = [];
      for (const F of finish.vault.springWalls) for (const e of walls[F]) if ((e.kind === "door" || e.kind === "window") && (e.top ?? 0) > spring - 0.05) clash.push(e);
      // a window on a springing wall comes down under the springing (the small_barred pin sets its head)
      const doorClash = clash.filter(e => e.kind === "door");
      if (doorClash.length) say("incombustible", "conflict", `A stone vault springing at ${spring} m, but ${doorClash.map(e => e.id).join(", ")} rises above it on a springing wall; the build keeps the door and the vault would need a lunette there.`);
      else say("incombustible", "honoured", `Limewashed stone walls, a flagged floor, a stone vault spanning ${axis === "EW" ? "north to south" : "east to west"} from ${spring} m to ${r2(H)} m at the crown.`);
    }
  }

  // doors: one way in, oak and iron
  const doors = Object.entries(walls).flatMap(([F, es]) => es.filter(e => e.kind === "door").map(e => ({ F, e })));
  if (pin.one_way_in) {
    const max = pin.one_way_in.doors_max ?? 1;
    if (doors.length <= max) say("one_way_in", "honoured", "One door.");
    else {
      const pref = pin.one_way_in.prefer_from, keep = doors.find(d => d.e.joins?.includes(pref)) || doors[0];
      const close = doors.filter(d => d !== keep).map(d => `${d.e.id} to ${d.e.joins?.find(j => j !== roomId)} (${d.F})`);
      say("one_way_in", "conflict", `The plan gives ${doors.length} doors, making this a room you pass through. The plan governs who can walk where, so all are built. To honour the brief, close ${close.join(", ")} in the plan; the room is then reached only from the ${pref}.`);
    }
  }
  if (pin.iron_door) {
    for (const d of doors) Object.assign(d.e, { style: "iron", lining: true, passage: false });
    say("iron_door", "honoured", `${doors.length} door${doors.length === 1 ? "" : "s"} of oak boards bound in iron, each with a stock lock, in plain stone reveals.`);
  }

  // windows: small, high, barred, shuttered, inside the plan's own openings
  if (pin.small_barred) {
    const p = pin.small_barred.window, changed = [];
    for (const [F, es] of Object.entries(walls)) for (const e of es) if (e.kind === "window") {
      const c = (e.r0 + e.r1) / 2, w = Math.min(e.r1 - e.r0, p.w_max);
      changed.push(`${e.id} ${r2(e.r1 - e.r0)}×${r2(e.top - e.sill)} m → ${r2(w)}×${r2(p.top - p.sill)} m`);
      Object.assign(e, { r0: r2(c - w / 2), r1: r2(c + w / 2), sill: p.sill, top: Math.min(p.top, (finish.vault?.spring ?? H) - 0.08), splay: 0.16, grille: !!p.grille, shutters: !!p.shutters, lights: [1, 1] });
    }
    say("small_barred", changed.length ? "adjusted" : "conflict", changed.length ? `The plan's windows made small, high and barred, on their own centres: ${changed.join("; ")}. Iron grid and inside shutters on each.` : "No window in the plan: the room would be dark.");
  }

  // the table under the light: on the wall with the most window, in the window nearest the wall's middle
  const frames = Object.fromEntries(["N", "E", "S", "W"].map(F => [F, wallFrame(room, F)]));
  if (pin.table) {
    const width = 1.1, depth = 0.6;
    const byLight = Object.entries(walls).map(([F, es]) => [F, es.filter(e => e.kind === "window")]).sort((a, b) => b[1].length - a[1].length);
    const [F, wins] = byLight[0];
    const mid = frames[F].L / 2, ws = [...wins].sort((a, b) => Math.abs((a.r0 + a.r1) / 2 - mid) - Math.abs((b.r0 + b.r1) / 2 - mid));
    const r = ws.length ? (ws[0].r0 + ws[0].r1) / 2 : mid;
    walls[F].push({ kind: "desk", id: pin.table.keep, r: r2(r), width, depth });
    taken.push({ id: pin.table.keep, box: boxOf(frames[F], r - width / 2, r + width / 2, depth) });
    say("table", "honoured", `The table with the drawer (${pin.table.keep}) on the ${F} wall, ${ws.length ? "in the window" : "with no window to stand under"}.`);
  }

  // the chest: low, so it may stand under a window; nearest the light that is free
  if (pin.chest) {
    const c = pin.chest.chest; let placed = null;
    const order = Object.entries(walls).sort((a, b) => b[1].filter(e => e.kind === "window").length - a[1].filter(e => e.kind === "window").length).map(([F]) => F);
    for (const F of order) {
      const sp = spans(frames[F], F, walls[F], taken, c.d, c.h).filter(([a, b]) => b - a >= c.w + 0.1);
      if (sp.length) {
        const wins = walls[F].filter(e => e.kind === "window");
        const best = sp.map(([a, b]) => { const want = wins.length ? (wins[wins.length - 1].r0 + wins[wins.length - 1].r1) / 2 : (a + b) / 2; return [a, b, Math.min(b - c.w / 2 - 0.05, Math.max(a + c.w / 2 + 0.05, want))]; })[0];
        placed = { F, r: best[2] }; break;
      }
    }
    if (placed) {
      walls[placed.F].push({ kind: "chest", id: "chest1", r: r2(placed.r), ...c });
      taken.push({ id: "chest1", box: boxOf(frames[placed.F], placed.r - c.w / 2, placed.r + c.w / 2, c.d) });
      say("chest", "honoured", `An iron-bound chest under ${c.locks} locks on the ${placed.F} wall${brief.holdings?.in_chest ? `, holding ${brief.holdings.in_chest.join(", ")}` : ""}.`);
    } else say("chest", "conflict", "No free wall long enough for the chest.");
  }

  // presses on every wall stretch left, deepest wall first, so the corners meet
  if (pin.presses) {
    const p = pin.presses.press, cols = p.drawer[0], made = [];
    const order = ["N", "S", "E", "W"].sort((a, b) => walls[a].filter(e => e.kind !== "chimneypiece").length - walls[b].filter(e => e.kind !== "chimneypiece").length);
    const rows = Math.floor((p.height - 0.22 - 0.1 - p.pigeonholes * 0.24) / p.drawer[1]);
    // where a press could stand: every free span, the corners kept clear. Presses keep out of the
    // corners: one running into a corner would sit behind its neighbour's end, its last drawers
    // blocked; the corner is left as a square of open floor
    const room4 = [];
    for (const F of order) {
      const cc = p.depth + 0.06, L = frames[F].L;
      for (let [a, b] of spans(frames[F], F, walls[F], taken, p.depth, p.height)) {
        a = Math.max(a, cc); b = Math.min(b, L - cc);
        const n = Math.floor((b - a - 0.08) / cols);
        if (n >= 3) room4.push({ F, a, b, n });          // narrower than three columns is a cupboard, not a press
      }
    }
    // what they hold decides how many are built and how wide: each press only as wide as its share
    const lay = brief.holdings ? layEvidences(evidences(brief.holdings), room4.map(s => s.n), rows, brief.holdings.spare) : { cols: room4.map(s => s.n), labels: [], say: "" };
    let label = 0;
    labels = [];
    room4.forEach((sp, i) => {
      const n = lay.cols[i]; if (!n) return;
      const w = n * cols + 0.08, r0 = sp.a + (sp.b - sp.a - w) / 2, id = `press_${sp.F}${made.length + 1}`;
      walls[sp.F].push({ kind: "press", id, letter: String.fromCharCode(65 + made.length), r0: r2(r0), r1: r2(r0 + w), height: p.height, depth: p.depth, cols: n, rows, pigeonholes: p.pigeonholes, label0: label,
        full: Array.from({ length: n }, (_, c) => (lay.labels[i] || []).some((_, k) => k % n === c && lay.labels[i][k])) });
      taken.push({ id, box: boxOf(frames[sp.F], r0, r0 + w, p.depth) });
      labels.push(...(lay.labels[i] || new Array(n * rows).fill("")));
      label += n * rows;
      made.push(`${sp.F} ${r2(w)} m (${n}×${rows} drawers)`);
    });
    say("presses", made.length ? "honoured" : "conflict", made.length ? `${made.length} press${made.length > 1 ? "es" : ""}, ${label} drawers: ${made.join("; ")}.${lay.say ? ` ${lay.say}` : ""}` : "No wall left free for a press.");
  }

  return {
    room: { id: roomId, name: room.name, W: r2(W), D: r2(D), H: r2(H), rect: room.rect, floor: room.floor },
    walls, finish, report, labels, onTable: brief.holdings?.on_table || null,
    function: B?.function || null,
    ms: r2((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0),
  };
}

// The evidences, from whose they are (holdings): the family's general evidences first, then the
// capital manor, then each manor in the order it came to the family. Each is a block of drawers: a
// place with one drawer is labelled by its name; with more, by kind of evidence under its name
// (feoffments, leases, rentals and surveys, shared by weight), the overflow of a kind numbered.
// A label is "place\nkind", drawn as two lines.
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];
export function evidences(H) {
  const blocks = [{ name: H.family, labels: H.general.flatMap(([k, n]) => Array.from({ length: n }, (_, q) => n > 1 ? `${k}\n${ROMAN[q]}` : k)) }];
  for (const [place, w] of H.manors) {
    const n = Math.max(1, Math.round(w * H.per_weight));
    if (n === 1) { blocks.push({ name: place, labels: [place] }); continue; }
    if (n === 2) { blocks.push({ name: place, labels: [`${place}\n${H.kinds[0][0]}`, `${place}\nLeases & Rentals`] }); continue; }
    // each kind one drawer, the rest by share, largest remainder first
    const want = H.kinds.map(([, f]) => f * (n - H.kinds.length)), got = want.map(Math.floor);
    for (const i of want.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).map(x => x[1]).slice(0, n - H.kinds.length - got.reduce((a, b) => a + b, 0))) got[i]++;
    blocks.push({ name: place, labels: H.kinds.flatMap(([k], i) => Array.from({ length: got[i] + 1 }, (_, q) => got[i] ? `${place}\n${k} ${ROMAN[q]}` : `${place}\n${k}`)) });
  }
  return blocks;
}

// Lay the blocks into presses down the columns, top to bottom, left to right: a block that fits in a
// column but not in what is left of this one starts the next; a block longer than a column starts a
// fresh one; none is carried from one press to the next. The leftover foot of a column stays blank,
// a spare. The last press is cut to what it holds plus the spare share; presses not needed are not
// built. caps: the most columns each span takes. Returns columns and labels (row-major) per span.
export function layEvidences(blocks, caps, rows, spare) {
  const per = caps.map(() => []);
  let p = 0, col = 0, row = 0;
  const fresh = () => { if (row) { col++; row = 0; } };
  for (const b of blocks) {
    const len = b.labels.length;
    if (len > rows || row + len > rows) fresh();
    while (p < caps.length && col + Math.ceil(len / rows) > caps[p]) { p++; col = 0; row = 0; }
    if (p >= caps.length) return { cols: caps, labels: [], say: `The presses are too few for ${b.name}.` };
    for (const t of b.labels) { per[p].push({ col, row, t }); if (++row === rows) { row = 0; col++; } }
  }
  const used = per.map((cells, i) => cells.length ? Math.max(...cells.map(c => c.col)) + 1 : 0);
  const filled = per.reduce((a, c) => a + c.length, 0);
  // the spare share, as whole columns at the end of the last press used
  const last = used.findLastIndex(u => u > 0), need = Math.ceil(filled / (1 - spare));
  let total = used.reduce((a, u) => a + u * rows, 0);
  while (total < need && used[last] < caps[last]) { used[last]++; total += rows; }
  used[last] = Math.max(3, used[last]);
  const labels = per.map((cells, i) => { if (!used[i]) return null; const L = new Array(used[i] * rows).fill(""); for (const c of cells) L[c.row * used[i] + c.col] = c.t; return L; });
  const firsts = per.map(cells => cells.length ? cells[0].t.split("\n")[0] : null);
  return { cols: used, labels, say: `Labelled for ${blocks[0].name}, ${filled} drawers by place and kind of evidence${used.filter(Boolean).length ? `, ${used.map((u, i) => u ? `press ${String.fromCharCode(65 + used.slice(0, i).filter(Boolean).length)} from ${firsts[i]}` : null).filter(Boolean).join("; ")}` : ""}; ${used.reduce((a, u) => a + u * rows, 0) - filled} spare drawers blank at the foot of the columns and the end.` };
}
