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
      say("chest", "honoured", `An iron-bound chest under ${c.locks} locks on the ${placed.F} wall.`);
    } else say("chest", "conflict", "No free wall long enough for the chest.");
  }

  // presses on every wall stretch left, deepest wall first, so the corners meet
  if (pin.presses) {
    const p = pin.presses.press, cols = p.drawer[0], made = [];
    let label = 0;
    const order = ["N", "S", "E", "W"].sort((a, b) => walls[a].filter(e => e.kind !== "chimneypiece").length - walls[b].filter(e => e.kind !== "chimneypiece").length);
    for (const F of order) {
      // presses keep out of the corners: one running into a corner would sit behind its neighbour's end,
      // its last drawers blocked; the corner is left as a square of open floor
      const cc = p.depth + 0.06, L = frames[F].L;
      for (let [a, b] of spans(frames[F], F, walls[F], taken, p.depth, p.height)) {
        a = Math.max(a, cc); b = Math.min(b, L - cc);
        const n = Math.floor((b - a - 0.08) / cols);
        if (n < 3) continue;          // a press narrower than three columns is a cupboard, not a press
        const w = n * cols + 0.08, r0 = a + (b - a - w) / 2;
        const rows = Math.floor((p.height - 0.22 - 0.1 - p.pigeonholes * 0.24) / p.drawer[1]);
        walls[F].push({ kind: "press", id: `press_${F}${made.length + 1}`, r0: r2(r0), r1: r2(r0 + w), height: p.height, depth: p.depth, cols: n, rows, pigeonholes: p.pigeonholes, label0: label });
        taken.push({ id: `press_${F}${made.length + 1}`, box: boxOf(frames[F], r0, r0 + w, p.depth) });
        label += n * rows;
        made.push(`${F} ${r2(w)} m (${n}×${rows} drawers)`);
      }
    }
    const presses = order.flatMap(F => walls[F].filter(e => e.kind === "press"));
    const L = brief.holdings ? labelDrawers(presses, brief.holdings) : null;
    if (L) { labels = L.labels; presses.forEach((e, i) => { e.letter = L.letters[i]; }); }
    say("presses", made.length ? "honoured" : "conflict", made.length ? `${made.length} presses, ${label} drawers: ${made.join("; ")}.${L ? ` ${L.say}` : ""}` : "No wall left free for a press.");
  }

  return {
    room: { id: roomId, name: room.name, W: r2(W), D: r2(D), H: r2(H), rect: room.rect, floor: room.floor },
    walls, finish, report, labels,
    function: B?.function || null,
    ms: r2((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0),
  };
}

// The drawers' labels, from whose evidences they are (holdings): the family's own papers first, then
// each manor an unbroken run, sorted, numbered from 1 across the rows from the top left; drawers in
// proportion to each manor's weight, places too small for a drawer of their own sharing one; no run
// carried from one press to the next; the rest left blank for what is bought next. Labels come out
// in reading order per press (label0 + row from the top * cols + column); a blank is "".
export function labelDrawers(presses, H) {
  const caps = presses.map(e => e.cols * e.rows), total = caps.reduce((a, b) => a + b, 0);
  const named = (list, scale) => {
    const runs = [], small = [];
    for (const [name, w] of list) { const n = Math.round(w * scale); if (n >= 1) runs.push([name, n]); else small.push(name); }
    for (let i = 0; i < small.length; i += 2) runs.push([small.slice(i, i + 2).join(" & "), 1]);
    return runs.sort((a, b) => a[0].localeCompare(b[0]));
  };
  // the largest scale whose runs pack in order, press by press, leaving the spare share blank
  for (let scale = total / H.manors.reduce((a, m) => a + m[1], 0); scale > 0.05; scale *= 0.97) {
    const runs = [...H.general.map(([n, c]) => [n, c]), ...named(H.manors, scale)];
    const per = presses.map(() => []); let p = 0, used = 0;
    for (const run of runs) {
      while (p < presses.length && per[p].reduce((a, r) => a + r[1], 0) + run[1] > caps[p]) p++;
      if (p >= presses.length) break;
      per[p].push(run); used += run[1];
    }
    if (p >= presses.length || used > total * (1 - H.spare)) continue;
    const labels = new Array(total).fill("");
    presses.forEach((e, i) => { let k = e.label0; for (const [name, n] of per[i]) for (let q = 1; q <= n; q++) labels[k++] = n > 1 ? `${name} ${q}` : name; });
    const letters = presses.map((_, i) => String.fromCharCode(65 + i));
    return { labels, letters, say: `Labelled for ${H.family}: ${per.map((r, i) => `press ${letters[i]} ${r[0][0]} to ${r[r.length - 1][0]}`).join("; ")}; ${total - used} drawers left blank.` };
  }
  return null;
}
