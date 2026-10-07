import { placeStair } from "./stairs.js";
import { makeClaims, BODY } from "../claims.js";
// A plan type (design/house/r47-plan.md §2): the Sudbury-style hybrid E-plan of a c.1660 Midlands
// gentry seat, as an envelope, a section and an access graph, filled from a program
// (src/make/programs/). Code, because it is geometry shared by every room; the program is data.
//   envelope: a main range between two wings that project forward to the south, a central porch, a
//     forecourt between the wings; a symmetrical front whose window bays are set by the front;
//   section: per-floor storey heights; the great hall rises two storeys (nothing stands above it),
//     the great stair three (it reaches the gallery), the back stair three; the kitchen has a chamber
//     over it (Ashmore: "Cooks Chamber"; chambers over the kitchen), so the service end's first floor
//     is one run, reached by the back stair, since the hall's void parts it from the great stair;
//   access: porch → screens passage → great hall → great stair; the passage's service wall with doors
//     to buttery, kitchen passage and pantry; the parlours, study and great stair in the high (east)
//     wing, the state apartment over them, the muniment room off the closet by one door; service in the
//     low (west) wing; the long gallery the length of the main range in the garret.
// Output: the plan schema lab/house reads (holo-emitter-plan/0.1) with three additions: floors carry
// their own storey_height_m, a room may rise through floors (rises), and every room has its type.
// Proportions are provisional until design/house/plan-dimensions-research.md gives sourced ones; each
// is named in DIMS so the research replaces numbers, not code.
export const DIMS = {
  // sourced (design/house/plan-dimensions-research.md): Kirby's hall 48 x 24.6 ft (14.6 x 7.5 m) and
  // passage 8.9 ft (2.7 m), its great parlour 31 x 23.6 ft (9.4 x 7.2 m); Haddon's hall 43 x 28 ft
  // and gallery 110 x 17 ft; Coleshill 124 x 62 ft overall. Chosen (no source found): storey heights,
  // wall thicknesses, the porch, the service bay, the stair hall, the window rhythm.
  ext: 0.75, part: 0.3,
  floors: { ground: 3.6, first: 4.0, garret: 2.8 }, gap: 0.35,
  range_depth: 9.0,                     // inside 7.5 m: Kirby's hall breadth
  wing_width: 8.7, wing_projection: 13.0, // inside 7.2 m: Kirby's great parlour breadth
  porch: [4.0, 3.0],
  hall: 14.0, passage: 2.7, service_bay: 4.6, stair_hall: 5.4, kitchen: 10.0,
  window: 1.4, bay: 3.2,
};

export function planHybridE(program, { seed = 1660, dims = DIMS, hearths = {} } = {}) {
  const D = { ...DIMS, ...dims }, E = D.ext, P = D.part;
  const plan = { schema: "holo-emitter-plan/0.1", generated: { type: "hybrid-e", program: program.program, seed }, units: "m", north: "+y",
    floors: [], rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], objects: [] };
  let level = 0;
  for (const [id, h] of Object.entries(D.floors)) { plan.floors.push({ id, level: level++, storey_height_m: h }); }
  // ---- the envelope, west to east: west wing | main range | east wing, symmetrical about the porch.
  // East of the passage: the hall and the great stair hall; west of it, balancing them: the service
  // bay (buttery, kitchen passage, pantry), the kitchen, the larder taking what is left
  const WW = D.wing_width, WP = D.wing_projection, RD = D.range_depth;
  const half = D.passage / 2 + P + D.hall + P + D.stair_hall;
  const L = 2 * (WW + half), cx = L / 2, x0R = WW, x1R = L - WW;
  const room = (id, type, floor, x0, x1, y0, y1, extra = {}) => { const r = { id, floor, name: nameOf(type), type: "enclosed", room_type: type, archetype: arche(type), rect: { x0: r3(x0), x1: r3(x1), y0: r3(y0), y1: r3(y1) }, ...extra }; plan.rooms.push(r); return r; };
  const yR0 = E, yR1 = RD - E, yW0 = -WP + E, yW1 = RD - E;
  // ---- ground floor
  const gp = cx - D.passage / 2;
  const passage = room("screens_passage", "screens_passage", "ground", gp, gp + D.passage, yR0, yR1);
  const hall = room("great_hall", "great_hall", "ground", gp + D.passage + P, gp + D.passage + P + D.hall, yR0, yR1, { rises: 2 });
  const stairHall = room("great_stair", "great_stair", "ground", hall.rect.x1 + P, x1R - E / 2, yR0, yR1, { rises: 3 });
  const sb1 = gp - P, sb0 = sb1 - D.service_bay, third = (yR1 - yR0 - 2 * P) / 3;
  const buttery = room("buttery", "buttery", "ground", sb0, sb1, yR0, yR0 + third);
  const kpass = room("kitchen_passage", "screens_passage", "ground", sb0, sb1, yR0 + third + P, yR0 + 2 * third + P, { name: "KITCHEN PASSAGE" });
  const pantry = room("pantry", "pantry", "ground", sb0, sb1, yR0 + 2 * third + 2 * P, yR1);
  const kitchen = room("kitchen", "kitchen", "ground", sb0 - P - D.kitchen, sb0 - P, yR0, yR1);
  const larder = room("larder", "larder", "ground", x0R + E / 2, kitchen.rect.x0 - P, yR0, yR1);
  // the low (west) wing, north to south: back stair, servants' hall, bakehouse
  const wx0 = E, wx1 = WW - E / 2;
  const backStair = room("back_stair", "back_stair", "ground", wx0, wx1, yW1 - 3.0, yW1, { rises: 3 });
  const shall = room("servants_hall", "servants_hall", "ground", wx0, wx1, backStair.rect.y0 - P - 7.0, backStair.rect.y0 - P);
  const bake = room("bakehouse", "bakehouse", "ground", wx0, wx1, yW0, shall.rect.y0 - P);
  // the high (east) wing, north to south: great parlour, little parlour, study
  const ex0 = L - WW + E / 2, ex1 = L - E;
  const parlour = room("great_parlour", "great_parlour", "ground", ex0, ex1, RD - 6.4, yW1);
  const little = room("little_parlour", "little_parlour", "ground", ex0, ex1, parlour.rect.y0 - P - 5.0, parlour.rect.y0 - P);
  const study = room("study", "study", "ground", ex0, ex1, yW0, little.rect.y0 - P);
  // the porch and the forecourt
  const porch = room("porch", "porch", "ground", cx - D.porch[0] / 2 + E, cx + D.porch[0] / 2 - E, -D.porch[1] + E, 0, { porch: true });
  const court = { id: "forecourt", floor: "ground", name: "FORECOURT", type: "open", archetype: "open", room_type: "court", rect: { x0: r3(WW), x1: r3(L - WW), y0: r3(-WP), y1: r3(-D.porch[1]) } };
  plan.rooms.push(court);
  // ---- first floor: the state apartment over the parlour wing; chambers over the service end
  const f = "first";
  const greatCh = room("great_chamber", "great_chamber", f, ex0, ex1, parlour.rect.y0, yW1);
  const withdraw = room("withdrawing_chamber", "withdrawing_chamber", f, ex0, ex1, little.rect.y0, little.rect.y1);
  const studyBay = study.rect, bed0 = studyBay.y0 + (studyBay.y1 - studyBay.y0) * 0.45;
  const best = room("best_bedchamber", "best_bedchamber", f, ex0, ex1, bed0, studyBay.y1);
  const closetE = room("closet_best", "closet", f, ex0, ex0 + (ex1 - ex0) * 0.45 - P / 2, yW0, bed0 - P);
  const muniment = room("muniment_room", "muniment_room", f, ex0 + (ex1 - ex0) * 0.45 + P / 2, ex1, yW0, bed0 - P);
  const landing = room("stair_landing", "great_stair", f, stairHall.rect.x0, stairHall.rect.x1, yR0, yR1, { landing: true });
  const bedW = room("bedchamber_west", "bedchamber", f, sb0, sb1, yR0, yR0 + 2 * third + P);
  const closetW = room("closet_west", "closet", f, sb0, sb1, yR0 + 2 * third + 2 * P, yR1);
  const passOver = room("bedchamber_passage", "bedchamber", f, gp, gp + D.passage, yR0, yR1, { name: "LITTLE CHAMBER" });
  const cooks = room("cooks_chamber", "servants_chamber", f, kitchen.rect.x0, kitchen.rect.x1, yR0, yR1, { name: "COOK'S CHAMBER" });
  const overLarder = room("steward_chamber", "bedchamber", f, larder.rect.x0, larder.rect.x1, yR0, yR1, { name: "STEWARD'S CHAMBER" });
  const nursery = room("nursery", "nursery", f, wx0, wx1, shall.rect.y0, shall.rect.y1);
  const bedSW = room("bedchamber_south", "bedchamber", f, wx0, wx1, yW0, bake.rect.y1);
  // ---- garret: the long gallery the length of the range; servants' chambers in the wings
  const g = "garret";
  const gallery = room("long_gallery", "long_gallery", g, larder.rect.x0, hall.rect.x1, yR0, yR1);
  const servW = room("servants_chamber_west", "servants_chamber", g, wx0, wx1, yW0, backStair.rect.y0 - P);
  const servE = room("servants_chamber_east", "servants_chamber", g, ex0, ex1, yW0, yW1);
  // ---- doors: the access graph; a door sits on the wall the two rooms share
  let n = 0;
  // a door in the middle of the wall two rooms share, or at its low or high end ("lo" | "hi": a stair
  // hall's doors stand at the stair's foot, where you arrive and go on)
  const door = (a, b, w = 1.1, end = null) => { const o = shared(a, b, P); if (!o) throw new Error(`plan: ${a.id} and ${b.id} share no wall`);
    const c = end === "lo" ? o.s0 + w / 2 + 0.3 : end === "hi" ? o.s1 - w / 2 - 0.3 : o.at, rect = o.axis === "x" ? { x0: r3(o.line - o.t / 2), x1: r3(o.line + o.t / 2), y0: r3(c - w / 2), y1: r3(c + w / 2) } : { x0: r3(c - w / 2), x1: r3(c + w / 2), y0: r3(o.line - o.t / 2), y1: r3(o.line + o.t / 2) };
    plan.openings.push({ id: `d${++n}`, kind: "door", floor: a.floor, axis: o.axis === "x" ? "EW" : "NS", rect, joins: [a.id, b.id] }); };
  door(court, porch, 1.4); door(porch, passage, 1.4);
  door(passage, hall, 1.3); door(passage, buttery); door(passage, kpass); door(passage, pantry); door(kpass, kitchen); door(kitchen, larder);
  door(larder, backStair); door(backStair, shall, 1.1, "hi"); door(shall, bake); door(court, bake, 1.2);
  door(hall, stairHall, 1.6, "lo"); door(stairHall, parlour, 1.3, "lo"); door(parlour, little); door(little, study);
  door(landing, greatCh, 1.3, "lo"); door(greatCh, withdraw); door(withdraw, best); door(best, closetE, 0.9); door(closetE, muniment, 0.9);
  door(passOver, bedW); door(bedW, closetW, 0.9); door(closetW, cooks, 0.9); door(cooks, overLarder);
  door(nursery, bedSW);
  // the back stair's upper landings: a door into the first-floor nursery wing and the garret chambers;
  // the great stair's top landing, to the gallery. Every door is hung before a stair is placed.
  const bsFirst = room("back_stair_first", "back_stair", f, backStair.rect.x0, backStair.rect.x1, backStair.rect.y0, backStair.rect.y1, { landing: true });
  const bsGarret = room("back_stair_garret", "back_stair", g, backStair.rect.x0, backStair.rect.x1, backStair.rect.y0, backStair.rect.y1, { landing: true });
  door(bsFirst, nursery, 1.1, "hi"); door(bsFirst, overLarder); door(bsGarret, servW, 1.1, "hi"); door(bsGarret, gallery, 1.1);
  const galLanding = room("gallery_landing", "great_stair", g, stairHall.rect.x0, stairHall.rect.x1, yR0, yR1, { landing: true });
  door(galLanding, gallery, 1.3, "lo"); door(galLanding, servE, 1.1, "lo");
  // ---- stairs (src/make/plans/stairs.js): a dog-leg to each storey with its half-landing, stacked on one
  // footprint, set where every door on every floor it touches opens onto floor; the great stair broad and
  // shallow round an open well, the back stair steep and narrow round a newel
  plan.wells = [];
  const rise = (a, b) => { const fa = plan.floors.find(q => q.id === a), i = plan.floors.indexOf(fa); return fa.storey_height_m + D.gap; };
  for (const [name, well, kind, prefer] of [["great_stair", stairHall, "great", ["y:lo:hi", "y:lo:lo"]], ["back_stair", backStair, "back", ["x:lo:lo", "x:lo:hi"]]]) {
    const got = placeStair(plan, name, well.rect, [["ground", "first", rise("ground")], ["first", "garret", rise("first")]], kind, prefer);
    if (!got) throw new Error(`plan: no place in ${name} for its stair that keeps every door clear`);
    plan.stairs.push(...got.stairs); plan.wells.push(...got.wells);
  }
  // stairs carry you between the rooms that share their well on each floor
  for (const s of plan.stairs) s.joins = plan.rooms.filter(q => (q.floor === s.from || q.floor === s.to) && overlaps(q.rect, s.rect) && q.type !== "open").map(q => q.id);
  // ---- hearths, before windows (the chimney decides, the windows keep clear of it): every room whose
  // type keeps a fire (hearths: room type -> "chimneypiece" | "kitchen"), on a wall with no door where the
  // fire would stand, a hand clear of each; side walls first
  for (const r of plan.rooms.filter(q => q.type !== "open" && !q.landing && hearths[q.room_type] && hearths[q.room_type] !== "none")) {
    const { x0, x1, y0, y1 } = r.rect, big = hearths[r.room_type] === "kitchen" || r.room_type === "great_hall", w = big ? 3.0 : 2.0;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const blocked = (F, a, b) => plan.openings.filter(o => o.floor === r.floor).some(o => { const R = o.rect, pad = 0.8;   // a door swings clear of the breast
      if (F === "W") return Math.abs(R.x1 - x0) < 0.8 && R.y1 > a - pad && R.y0 < b + pad; if (F === "E") return Math.abs(R.x0 - x1) < 0.8 && R.y1 > a - pad && R.y0 < b + pad;
      if (F === "S") return Math.abs(R.y1 - y0) < 0.8 && R.x1 > a - pad && R.x0 < b + pad; return Math.abs(R.y0 - y1) < 0.8 && R.x1 > a - pad && R.x0 < b + pad; });
    const tries = [["W", { x0, x1: x0 + 0.5, y0: cy - w / 2, y1: cy + w / 2 }, cy - w / 2, cy + w / 2, y1 - y0], ["E", { x0: x1 - 0.5, x1, y0: cy - w / 2, y1: cy + w / 2 }, cy - w / 2, cy + w / 2, y1 - y0],
      ["N", { x0: cx - w / 2, x1: cx + w / 2, y0: y1 - 0.5, y1 }, cx - w / 2, cx + w / 2, x1 - x0], ["S", { x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + 0.5 }, cx - w / 2, cx + w / 2, x1 - x0]];
    const pick = tries.find(([F, , a, b, len]) => len > w + 0.8 && !blocked(F, a, b));
    if (pick) plan.fireplaces.push({ floor: r.floor, room: r.id, kind: hearths[r.room_type], rect: Object.fromEntries(Object.entries(pick[1]).map(([k, v]) => [k, r3(v)])) });
  }
  // ---- windows: every outside wall by its own rhythm, one to each bay, centred on the wall's span;
  // the garret is lit from its gable ends and the front and back
  // a window's rect spans the wall's own thickness, from the outer face (line) inward
  const winRect = (w, c, half) => w.F === "S" ? { x0: c - half, x1: c + half, y0: w.line, y1: w.line + E } : w.F === "N" ? { x0: c - half, x1: c + half, y0: w.line - E, y1: w.line }
    : w.F === "W" ? { x0: w.line, x1: w.line + E, y0: c - half, y1: c + half } : { x0: w.line - E, x1: w.line, y0: c - half, y1: c + half };
  // what stands in front of a wall claims its floor (src/make/claims.js): a stair's flights and landings, so no
  // window is set behind one (Kabe, 2026-10-06: "Stairs in center front of window"); a window behind a stair moves
  // along its wall to the nearest stretch with nothing in front of it, or is left out
  const claims = makeClaims({ x0: -1, y0: -WP - D.porch[1] - 1, x1: L + 1, y1: RD + 1, floors: Object.keys(D.floors) });
  for (const st of plan.stairs) claims.claim(st.from, "stand", st.rect, BODY, `${st.stair} ${st.kind}`);
  const lightOf = (w, R) => w.F === "S" ? { x0: R.x0, x1: R.x1, y0: R.y1, y1: R.y1 + 0.6 } : w.F === "N" ? { x0: R.x0, x1: R.x1, y0: R.y0 - 0.6, y1: R.y0 }
    : w.F === "W" ? { x0: R.x1, x1: R.x1 + 0.6, y0: R.y0, y1: R.y1 } : { x0: R.x0 - 0.6, x1: R.x0, y0: R.y0, y1: R.y1 };
  for (const fl of Object.keys(D.floors)) for (const r of plan.rooms.filter(q => q.floor === fl && q.type !== "open" && !q.landing)) for (const w of outsideWalls(r, { L, RD, WW, WP, E })) {
    const len = w.b - w.a, k = Math.max(1, Math.floor(len / D.bay)), set = [];
    for (let i = 0; i < k; i++) { const c0 = w.a + len * (i + 0.5) / k, half = Math.min(D.window, len / k - 0.6) / 2; if (half < 0.3) continue;
      const clearAt = (c) => c - half > w.a + 0.3 && c + half < w.b - 0.3 && !set.some(q => Math.abs(q - c) < 2 * half + 0.6) && claims.worst(fl, "stand", lightOf(w, winRect(w, c, half))).state < BODY;
      let c = c0; for (let s = 0.2; !clearAt(c) && s <= len / 2; s += 0.2) c = clearAt(c0 - s) ? c0 - s : c0 + s; if (!clearAt(c)) continue;
      set.push(c);
      const R = winRect(w, c, half);
      if (plan.fireplaces.some(h => h.room === r.id && (w.F === "S" || w.F === "N" ? Math.abs((h.rect.y0 + h.rect.y1) / 2 - w.line) < 1.5 && h.rect.x0 < R.x1 + CHIMNEY_CLEAR && h.rect.x1 > R.x0 - CHIMNEY_CLEAR
        : Math.abs((h.rect.x0 + h.rect.x1) / 2 - w.line) < 1.5 && h.rect.y0 < R.y1 + CHIMNEY_CLEAR && h.rect.y1 > R.y0 - CHIMNEY_CLEAR))) continue;     // the chimney stands here
      if (plan.openings.some(o => o.floor === fl && o.rect && overlaps({ x0: o.rect.x0 - OPENING_CLEAR, x1: o.rect.x1 + OPENING_CLEAR, y0: o.rect.y0 - OPENING_CLEAR, y1: o.rect.y1 + OPENING_CLEAR }, R))) continue;   // a doorway is here
      plan.windows.push({ floor: fl, rect: { x0: r3(R.x0), x1: r3(R.x1), y0: r3(R.y0), y1: r3(R.y1) } }); }
  }
  plan.entrance = "forecourt";
  plan.outline = [[0, -WP], [WW, -WP], [WW, 0], [L - WW, 0], [L - WW, -WP], [L, -WP], [L, RD], [0, RD]];
  return plan;
}

// ---- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
// a window keeps this far from a chimney's footprint: the surround's overhang (0.19), the window's inner
// splay (up to 0.35 on a thick wall) and a hand between, so the breast's side never stands across the glass
const CHIMNEY_CLEAR = 0.75;
// and this far from a doorway in the same wall (a porch's door is not a window's place)
const OPENING_CLEAR = 0.3;
const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const NAMES = { screens_passage: "SCREENS PASSAGE", great_hall: "GREAT HALL", great_stair: "GREAT STAIR", buttery: "BUTTERY", pantry: "PANTRY", kitchen: "KITCHEN", back_stair: "BACK STAIR",
  larder: "LARDER", servants_hall: "SERVANTS' HALL", great_parlour: "GREAT PARLOUR", little_parlour: "LITTLE PARLOUR", study: "STUDY", porch: "PORCH", great_chamber: "GREAT CHAMBER",
  withdrawing_chamber: "WITHDRAWING CHAMBER", best_bedchamber: "BEST BEDCHAMBER", closet: "CLOSET", muniment_room: "MUNIMENT ROOM", bedchamber: "BEDCHAMBER", nursery: "NURSERY",
  long_gallery: "LONG GALLERY", servants_chamber: "SERVANTS' CHAMBER", bakehouse: "BAKEHOUSE" };
const nameOf = (t) => NAMES[t] || t.toUpperCase();
// the archetype lab/house's builder already knows, until it reads room types (R47 §3)
const arche = (t) => ({ great_hall: "hall", kitchen: "service", bakehouse: "service", buttery: "service", pantry: "service", larder: "service", servants_hall: "service", screens_passage: "service", back_stair: "stair", great_stair: "stair", porch: "service" }[t] || "chamber");
// the wall two rooms share: its line, its axis (x: a wall running north-south, at x = line), its thickness, and a point along it
function shared(a, b, P) {
  const A = a.rect, B = b.rect, eps = 0.05, t = (g) => Math.max(P, g);
  for (const [axis, lo, hi, gap, s0, s1] of [["x", A.x1, B.x0, B.x0 - A.x1, Math.max(A.y0, B.y0), Math.min(A.y1, B.y1)], ["x", B.x1, A.x0, A.x0 - B.x1, Math.max(A.y0, B.y0), Math.min(A.y1, B.y1)],
    ["y", A.y1, B.y0, B.y0 - A.y1, Math.max(A.x0, B.x0), Math.min(A.x1, B.x1)], ["y", B.y1, A.y0, A.y0 - B.y1, Math.max(A.x0, B.x0), Math.min(A.x1, B.x1)]])
    if (gap > -eps && gap < 1.0 && s1 - s0 > 1.2) return { axis, line: (lo + hi) / 2, t: t(gap), at: (s0 + s1) / 2, s0, s1 };
  return null;
}
// a room's walls on the outside of the house, each as its line and its span
function outsideWalls(r, { L, RD, WW, WP, E }) {
  const R = r.rect, out = [], near = (a, b) => Math.abs(a - b) < E + 0.05;
  if (near(R.y1, RD)) out.push({ F: "N", line: RD, a: R.x0, b: R.x1 });
  if (near(R.x0, 0)) out.push({ F: "W", line: 0, a: R.y0, b: R.y1 });
  if (near(R.x1, L)) out.push({ F: "E", line: L, a: R.y0, b: R.y1 });
  const southLine = (R.x1 <= WW + 0.01 || R.x0 >= L - WW - 0.01) ? -WP : 0;
  if (near(R.y0, southLine)) out.push({ F: "S", line: southLine, a: R.x0, b: R.x1 });
  return out;
}
