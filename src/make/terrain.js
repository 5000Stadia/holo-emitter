// The ground outside (R46; design/production/plan.md §5: "terrain is a height function of world position, shared by
// the walker and the picture"; WORLDSPRING.md:11: evaluated in world coordinates, so tiles agree by construction).
// A site: the house on a levelled pad (its footprint and its open courts at the ground floor's level), blending into
// the hills around over a band; the hills from deterministic noise (src/make/noise.js), every height leaving as
// whole millimetres. What lies on the ground (gravel on the forecourt and the drive, grass elsewhere) is a weight by
// world position too. Pure: no three.js.
//   site = makeSite(plan, { seed }) -> { z(x, y) metres, gravel(x, y) 0..1, inHouse(x, y), footprint, pads }
import { fbm, mm } from "./noise.js";

const EXT = 0.75;
const smooth = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
// distance from a point to a rect (0 inside)
const dRect = (R, x, y) => Math.hypot(Math.max(R.x0 - x, 0, x - R.x1), Math.max(R.y0 - y, 0, y - R.y1));
export const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[i], [bx, by] = poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };

export function makeSite(plan, { seed = 1660, blend = 34, relief = 26 } = {}) {
  const built = plan.rooms.filter(r => r.type !== "open"), open = plan.rooms.filter(r => r.type === "open" && r.room_type !== "unestablished");
  // the house's footprint: its outline, and any room standing outside it (the porch) with its own walls
  const outline = plan.outline || null;
  const extra = built.filter(r => !outline || !inPoly(outline, (r.rect.x0 + r.rect.x1) / 2, (r.rect.y0 + r.rect.y1) / 2)).map(r => ({ x0: r.rect.x0 - EXT, x1: r.rect.x1 + EXT, y0: r.rect.y0 - EXT, y1: r.rect.y1 + EXT }));
  const box = outline ? { x0: Math.min(...outline.map(p => p[0])), x1: Math.max(...outline.map(p => p[0])), y0: Math.min(...outline.map(p => p[1])), y1: Math.max(...outline.map(p => p[1])) } : null;
  const inHouse = (x, y) => (outline ? inPoly(outline, x, y) : built.some(r => dRect({ x0: r.rect.x0 - EXT, x1: r.rect.x1 + EXT, y0: r.rect.y0 - EXT, y1: r.rect.y1 + EXT }, x, y) === 0)) || extra.some(R => dRect(R, x, y) === 0);
  // the pads: the house's bounds and its open courts, levelled at the ground floor (z = 0)
  const pads = [...(box ? [box] : built.map(r => r.rect)), ...extra, ...open.map(r => r.rect)];
  const padD = (x, y) => Math.min(...pads.map(R => dRect(R, x, y)));
  // the drive: from the forecourt's front, straight out to the south (the lane beyond is R46's next step); gravel
  const court = open.find(r => r.room_type === "court");
  const drive = court ? { x0: (court.rect.x0 + court.rect.x1) / 2 - 2.5, x1: (court.rect.x0 + court.rect.x1) / 2 + 2.5, y0: court.rect.y0 - 80, y1: court.rect.y0 } : null;
  // the hills: broad swells and smaller folds, falling away from the house's terrace a little (a seat stands
  // on its rise); an amplitude of `relief` metres
  // (the land at the house is the ground floor's level: the hills are set so their own height there is nought, and
  // the terrace is cut and filled only where the land differs)
  const raw = (x, y) => relief * fbm(x, y, { cell: 420, octaves: 3, seed }) + 0.22 * relief * fbm(x, y, { cell: 90, octaves: 3, seed: seed + 7 });
  const hx = box ? (box.x0 + box.x1) / 2 : 0, hy = box ? (box.y0 + box.y1) / 2 : 0, at0 = raw(hx, hy);
  const natural = (x, y) => raw(x, y) - at0;
  // the drive follows the land along its length and is level across it (its height is the land's on its middle line)
  function zRaw(x, y) {
    const d = padD(x, y), w = smooth(0, blend, d); let n = natural(x, y);
    if (drive) { const dd = dRect(drive, x, y); if (dd < 7) { const mid = (drive.x0 + drive.x1) / 2, yy = Math.min(drive.y1, Math.max(drive.y0, y)), on = natural(mid, yy) * smooth(0, blend, padD(mid, yy)) / Math.max(1e-6, w);
      n += (on - n) * (1 - smooth(1.5, 7, dd)); } }
    return n * w;
  }
  // under the house the ground goes down out of the way (its floors stand at nought: a ground there would fight them),
  // within the walls' thickness, where the stone hides it
  const DOWN = 0.45, into = (x, y) => { let d = Infinity;
    if (outline && inPoly(outline, x, y)) for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) { const [ax, ay] = outline[j], [bx, by] = outline[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); }
    else for (const R of extra) if (dRect(R, x, y) === 0) d = Math.min(Infinity, Math.min(x - R.x0, R.x1 - x, y - R.y0, R.y1 - y)); else continue;
    return d === Infinity ? 0 : d; };
  const z = (x, y) => { const d = into(x, y); return mm(d > 0 ? zRaw(x, y) - DOWN * smooth(0.05, 0.6, d) : zRaw(x, y)) / 1000; };
  const gravel = (x, y) => { let g = 0; for (const r of open) if (r.room_type === "court") g = Math.max(g, 1 - smooth(-0.2, 0.4, dRect(r.rect, x, y)));
    if (drive) g = Math.max(g, 1 - smooth(-0.3, 0.5, dRect(drive, x, y))); return g; };
  return { z, gravel, inHouse, padD, pads, drive, box, outline, extra };
}

// the heights of a tile (a grid of n+1 by n+1 posts, spacing s, from (x0, y0)), and its gravel weights: pure, for a
// worker as well as the page
export function tileHeights(site, x0, y0, n, s) {
  const H = new Float32Array((n + 1) * (n + 1)), G = new Float32Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + i * s, y = y0 + j * s, k = j * (n + 1) + i; H[k] = site.z(x, y); G[k] = site.gravel(x, y); }
  return { H, G };
}

// walking outside: on the ground, a step at most from where you were, never up a slope steeper than a body climbs,
// never into the house but by a doorway, nor into what stands on the ground (claims: a grid of what stops a body,
// world cells, filled by what is built outdoors). groundAt(x, y, h) -> h' | null
export function makeOutdoorWalk(site, { plan, step = 0.45, maxSlope = 0.7, half = 0.22, blocked = () => false } = {}) {
  // a house's doorways to the open: where the footprint may be crossed (each opening joining an open room)
  const ways = (plan.openings || []).filter(o => o.rect && o.joins.some(j => plan.rooms.find(r => r.id === j)?.type === "open")).map(o => o.rect);
  const nearHouse = (x, y) => { if (site.inHouse(x, y)) return true; for (const [dx, dy] of [[half, 0], [-half, 0], [0, half], [0, -half], [half * 0.7, half * 0.7], [-half * 0.7, half * 0.7], [half * 0.7, -half * 0.7], [-half * 0.7, -half * 0.7]]) if (site.inHouse(x + dx, y + dy)) return true; return false; };
  const atWay = (x, y) => ways.some(R => x > R.x0 - 0.05 && x < R.x1 + 0.05 && y > R.y0 - 0.5 && y < R.y1 + 0.5 || y > R.y0 - 0.05 && y < R.y1 + 0.05 && x > R.x0 - 0.5 && x < R.x1 + 0.5);
  function groundAt(x, y, h) {
    if (nearHouse(x, y) && !atWay(x, y)) return null;
    if (blocked(x, y, half)) return null;
    const z = site.z(x, y); if (Math.abs(z - h) > step) return null;
    const e = 0.25, gx = (site.z(x + e, y) - site.z(x - e, y)) / (2 * e), gy = (site.z(x, y + e) - site.z(x, y - e)) / (2 * e);
    if (Math.hypot(gx, gy) > maxSlope) return null;                     // about 35°: steeper than a body walks up
    return z;
  }
  return { groundAt, ways };
}
