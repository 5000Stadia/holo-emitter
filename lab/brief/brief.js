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

export function compileBrief(plan, roomId, brief) {
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

  // the table under the light: on the wall with the most window, between the windows when it fits
  const frames = Object.fromEntries(["N", "E", "S", "W"].map(F => [F, wallFrame(room, F)]));
  if (pin.table) {
    const width = 1.1, depth = 0.6;
    const byLight = Object.entries(walls).map(([F, es]) => [F, es.filter(e => e.kind === "window")]).sort((a, b) => b[1].length - a[1].length);
    const [F, wins] = byLight[0];
    let r = null;
    const ws = [...wins].sort((a, b) => a.r0 - b.r0);
    for (let i = 0; i + 1 < ws.length && r === null; i++) if (ws[i + 1].r0 - ws[i].r1 >= width + 0.1) r = (ws[i].r1 + ws[i + 1].r0) / 2;
    if (r === null && ws.length) r = (ws[0].r0 + ws[0].r1) / 2;
    if (r === null) r = frames[F].L / 2;
    walls[F].push({ kind: "desk", id: pin.table.keep, r: r2(r), width, depth });
    taken.push({ id: pin.table.keep, box: boxOf(frames[F], r - width / 2, r + width / 2, depth) });
    say("table", "honoured", `The table with the drawer (${pin.table.keep}) on the ${F} wall, ${ws.length > 1 ? "between the two windows" : ws.length ? "under the window" : "with no window to stand under"}.`);
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
      for (const [a, b] of spans(frames[F], F, walls[F], taken, p.depth, p.height)) {
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
    say("presses", made.length ? "honoured" : "conflict", made.length ? `${made.length} presses, ${label} labelled drawers by manor: ${made.join("; ")}.` : "No wall left free for a press.");
  }

  return {
    room: { id: roomId, name: room.name, W: r2(W), D: r2(D), H: r2(H), rect: room.rect, floor: room.floor },
    walls, finish, report,
    function: B?.function || null,
    ms: r2((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0),
  };
}
