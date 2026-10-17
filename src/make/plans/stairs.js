// Stairs as they were built (Kabe, 2026-10-06: "this floorplan shouldn't include stairs in front of a
// door"; "the stairs turn without a platform"): a dog-leg to each storey, a flight up to a half-landing and
// a flight back, the storeys stacked on one footprint so you arrive beside the next flight's foot; a great
// stair has an open well between its flights (Coleshill, Sudbury), a back stair closes it on a newel.
// The footprint goes where no door on any floor it touches opens onto a flight, a landing or the hole in
// a floor: every doorway opens onto floor you can stand on.
//
// What it writes into the plan:
//   plan.stairs: one entry per flight and landing: { id, kind: "flight" | "landing", well, from, to,
//     rect, up (the way a flight rises), z0, z1 (how far up the storey it starts and ends, 0..1),
//     treads, joins }
//   plan.wells: one per storey: { id, stair, from, to, hole (cut from the floor above), rect (the
//     footprint with the floor you arrive on), rail (the hole's edges a balustrade guards) }

// a storey's dog-leg: run axis "x" | "y"; foot at the low or high end of the run; flight A on the low or
// high side across; the footprint's corner at (u0, v0) in run/across coordinates
function dogLeg({ id, stair, from, to, rise }, { axis, footHi, aHi, u0, v0 }, S) {
  const n = Math.max(2, Math.round(rise / S.riser)), perFlight = Math.ceil(n / 2), run = perFlight * S.going;
  const W = S.width, G = S.gap, L = S.landing, A = S.arrive;
  const len = A + run + L, across = 2 * W + G;
  // in run coordinates u from the foot end: arrival floor [0, A], flights [A, A + run], landing [A + run, len]
  const toRect = (ua, ub, va, vb) => { const U = footHi ? [u0 + len - ub, u0 + len - ua] : [u0 + ua, u0 + ub], V = [v0 + va, v0 + vb];
    return axis === "x" ? { x0: U[0], x1: U[1], y0: V[0], y1: V[1] } : { x0: V[0], x1: V[1], y0: U[0], y1: U[1] }; };
  const away = axis === "x" ? (footHi ? "W" : "E") : (footHi ? "S" : "N"), back = { E: "W", W: "E", N: "S", S: "N" }[away];
  const vA = aHi ? [W + G, across] : [0, W], vB = aHi ? [0, W] : [W + G, across];
  const els = [
    { kind: "flight", rect: toRect(A, A + run, ...vA), up: away, z0: 0, z1: 0.5, treads: perFlight },
    { kind: "landing", rect: toRect(A + run, len, 0, across), z0: 0.5, z1: 0.5 },
    { kind: "flight", rect: toRect(A, A + run, ...vB), up: back, z0: 0.5, z1: 1, treads: n - perFlight },
  ].map((e, i) => ({ id: `${id}_${["a", "landing", "b"][i]}`, well: id, stair, from, to, ...e, rect: r3rect(e.rect), joins: [] }));
  const hole = r3rect(toRect(A, len, 0, across)), rect = r3rect(toRect(0, len, 0, across));
  // the hole's edges that need a balustrade on the floor above: the long side open to the room, and the
  // landing's end if it stands off the wall; the foot end is where you arrive and go on
  return { els, hole, rect, len, across };
}
const r3 = (x) => Math.round(x * 1000) / 1000;
const r3rect = (r) => ({ x0: r3(r.x0), x1: r3(r.x1), y0: r3(r.y0), y1: r3(r.y1) });
const overlaps = (a, b) => a.x0 < b.x1 - 1e-6 && a.x1 > b.x0 + 1e-6 && a.y0 < b.y1 - 1e-6 && a.y1 > b.y0 + 1e-6;
const inside = (r, R) => r.x0 >= R.x0 - 1e-6 && r.x1 <= R.x1 + 1e-6 && r.y0 >= R.y0 - 1e-6 && r.y1 <= R.y1 + 1e-6;

// the stair kinds, from the period (riser and going in metres)
export const STAIR_KINDS = {
  great: { width: 1.4, gap: 0.5, riser: 0.165, going: 0.28, landing: 1.45, arrive: 2.2, margin: 0.05 },   // shallow, broad, an open well (Coleshill 1650s)
  back: { width: 0.9, gap: 0, riser: 0.205, going: 0.235, landing: 0.95, arrive: 1.25, margin: 0.05 },    // steep, narrow, round a newel
};

// place a stair of kind in the well room R through storeys [[from, to, rise], ...]; doors: the plan's
// openings; returns the plan entries, or null if no footprint keeps every door clear
export function placeStair(plan, stair, R, storeys, kind, prefer = []) {
  const S = STAIR_KINDS[kind], floors = [...new Set(storeys.flatMap(([a, b]) => [a, b]))];
  const grow = (r, m) => ({ x0: r.x0 - m, x1: r.x1 + m, y0: r.y0 - m, y1: r.y1 + m });
  const approaches = (fl) => plan.openings.filter(o => o.floor === fl && o.rect && overlaps(grow(R, 0.5), o.rect)).map(o => o.axis === "EW"
    ? { x0: o.rect.x0 - 1.2, x1: o.rect.x1 + 1.2, y0: o.rect.y0 - 0.25, y1: o.rect.y1 + 0.25 }
    : { x0: o.rect.x0 - 0.25, x1: o.rect.x1 + 0.25, y0: o.rect.y0 - 1.2, y1: o.rect.y1 + 1.2 });
  const cands = [];
  for (const axis of ["y", "x"]) for (const footHi of [false, true]) for (const aHi of [false, true]) for (const vEnd of [false, true]) for (const uEnd of [false, true]) {
    const legs = storeys.map(([from, to, rise]) => ({ from, to, rise }));
    const probe = dogLeg({ id: "p", stair, ...legs[0] }, { axis, footHi, aHi, u0: 0, v0: 0 }, S);
    const lenMax = Math.max(...legs.map(l => dogLeg({ id: "p", stair, ...l }, { axis, footHi, aHi, u0: 0, v0: 0 }, S).len));
    const Ulo = axis === "x" ? R.x0 : R.y0, Uhi = axis === "x" ? R.x1 : R.y1, Vlo = axis === "x" ? R.y0 : R.x0, Vhi = axis === "x" ? R.y1 : R.x1, m = S.margin;
    if (lenMax > Uhi - Ulo - 2 * m || probe.across > Vhi - Vlo - 2 * m) continue;
    // the foot ends line up storey on storey: each storey's footprint starts at the same foot line
    const v0 = vEnd ? Vhi - m - probe.across : Vlo + m;
    const parts = legs.map((l, k) => { const len = dogLeg({ id: "p", stair, ...l }, { axis, footHi, aHi, u0: 0, v0: 0 }, S).len;
      const u0 = footHi ? (uEnd ? Uhi - m - len : Ulo + m + lenMax - len) : (uEnd ? Uhi - m - lenMax : Ulo + m);
      return dogLeg({ id: `${stair}_${l.from}`, stair, ...l }, { axis, footHi, aHi, u0, v0 }, S); });
    if (!parts.every(p => inside(p.rect, R))) continue;
    // on every floor: what is not floor (this storey's flights and landing, the hole from the storey below)
    const ok = floors.every(fl => { const solid = [...parts.filter((p, k) => storeys[k][0] === fl).map(p => p.hole), ...parts.filter((p, k) => storeys[k][1] === fl).map(p => p.hole)];
      return !approaches(fl).some(a => solid.some(s => overlaps(a, s))); });
    if (!ok) continue;
    const key = `${axis}:${footHi ? "hi" : "lo"}:${aHi ? "hi" : "lo"}`;
    cands.push({ parts, rank: prefer.indexOf(key) < 0 ? 99 : prefer.indexOf(key), axis });
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.rank - b.rank);
  const best = cands[0].parts;
  return { stairs: best.flatMap(p => p.els), wells: best.map((p, k) => ({ id: `${stair}_${storeys[k][0]}`, stair, from: storeys[k][0], to: storeys[k][1], hole: p.hole, rect: p.rect })) };
}

// a stair element's surface height at (x, y), as a fraction of its storey (0..1), or null off it
export function surfaceZ(e, x, y, smooth = false) {
  const R = e.rect; if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) return null;
  if (e.kind === "landing") return e.z0;
  const t = e.up === "N" ? (y - R.y0) / (R.y1 - R.y0) : e.up === "S" ? (R.y1 - y) / (R.y1 - R.y0) : e.up === "E" ? (x - R.x0) / (R.x1 - R.x0) : (R.x1 - x) / (R.x1 - R.x0);
  if (smooth) return e.z0 + (e.z1 - e.z0) * Math.max(0, Math.min(1, t));    // the pitch line, for a walker's eye
  // stepped, as treads are: the height of the tread you stand on
  const n = e.treads, k = Math.min(n, Math.floor(Math.max(0, Math.min(1, t)) * n) + 1);
  return e.z0 + (e.z1 - e.z0) * k / n;
}
