// The land's fields (R46, the hillside package; design/outdoor/research-1660.md §A): irregular closes bounded by
// dry-stone walls (limestone country) and hawthorn quickset hedges, beside open fields still in ridge and furrow.
// Laid out in world coordinates from a lattice of jittered corners: a close is the four-sided field between four
// corners; a boundary is the edge between two neighbouring corners, owned by that one lattice edge, so a tile built
// in any order makes the same wall once (consultation ca629b3, point 3 of the second view: "assign every lot,
// hedge, tree … to exactly one globally keyed cell"). What each boundary is, and what each field is, is chosen by a
// hash weighted by the package; nothing averages a wall with a hedge. Pure.
//   makeFields(site, pkg) -> { cell, nodeAt(i, j), edgesIn(box), fieldAt(x, y), furrowZ(x, y) }
import { hashN, unit } from "./noise.js";

export const HILLSIDE_1660 = {
  id: "midlands-hillside-1660",
  cell: 64, jitter: 0.32,                       // closes about 64 m across (chosen; research: small irregular closes)
  bounds: { wall: 0.46, hedge: 0.4, open: 0.14 }, // what bounds a close (chosen; limestone country: walls more than hedges)
  furrows: 0.35,                                // the share of fields still in ridge and furrow (research: beside the closes)
  ridge: { width: 7.5, height: 0.42 },          // research: strips 4.6-20 m wide, up to about 0.6 m high
  clear: 46,                                    // no field boundary this near the house's terrace or its drive
  seed: 1660,
};

export function makeFields(site, pkg = HILLSIDE_1660) {
  const C = pkg.cell, S = pkg.seed, J = pkg.jitter;
  const nodeAt = (i, j) => [i * C + (unit(hashN(i, j, S, 1)) - 0.5) * 2 * J * C, j * C + (unit(hashN(i, j, S, 2)) - 0.5) * 2 * J * C];
  const pick = (h, w) => { let u = unit(h), k; for (k of Object.keys(w)) { if (u < w[k]) return k; u -= w[k]; } return k; };
  const near = (x, y) => site.padD(x, y) < pkg.clear || (site.drive && Math.abs(x - (site.drive.x0 + site.drive.x1) / 2) < 8 && y < site.drive.y1 + 4 && y > site.drive.y0 - 4);
  // an edge's kind: its own hash; an edge across the house's ground is none
  function edge(i, j, dir) { const a = nodeAt(i, j), b = dir === 0 ? nodeAt(i + 1, j) : nodeAt(i, j + 1), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const kind = near(m[0], m[1]) || near(a[0], a[1]) || near(b[0], b[1]) ? "none" : pick(hashN(i, j, dir, S, 3), pkg.bounds);
    // a gateway in a boundary, a third of the way along (a field gate in a wall or hedge), where the hash says
    const gate = kind !== "none" && kind !== "open" && unit(hashN(i, j, dir, S, 4)) < 0.5 ? 0.25 + 0.5 * unit(hashN(i, j, dir, S, 5)) : null;
    return { key: `${i},${j},${dir}`, a, b, kind, gate }; }
  // every boundary that touches a box (plan coordinates): the lattice edges around it, each once
  function edgesIn({ x0, y0, x1, y1 }) { const out = [], i0 = Math.floor(x0 / C) - 1, i1 = Math.floor(x1 / C) + 1, j0 = Math.floor(y0 / C) - 1, j1 = Math.floor(y1 / C) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const dir of [0, 1]) { const e = edge(i, j, dir); if (e.kind === "none" || e.kind === "open") continue;
      if (Math.max(e.a[0], e.b[0]) < x0 || Math.min(e.a[0], e.b[0]) > x1 || Math.max(e.a[1], e.b[1]) < y0 || Math.min(e.a[1], e.b[1]) > y1) continue; out.push(e); }
    return out; }
  // the close a point lies in: the quad of four jittered corners round it (the cell it falls in, or a neighbour)
  const inQuad = (q, x, y) => { let c = false; for (let a = 0, b = 3; a < 4; b = a++) { const [ax, ay] = q[a], [bx, by] = q[b]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
  function fieldAt(x, y) { const i0 = Math.floor(x / C), j0 = Math.floor(y / C);
    for (const [di, dj] of [[0, 0], [-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1], [1, 1], [-1, 1], [1, -1]]) { const i = i0 + di, j = j0 + dj, q = [nodeAt(i, j), nodeAt(i + 1, j), nodeAt(i + 1, j + 1), nodeAt(i, j + 1)];
      if (inQuad(q, x, y)) { const furrows = unit(hashN(i, j, S, 6)) < pkg.furrows, along = unit(hashN(i, j, S, 7)) < 0.5 ? 0 : 1; return { i, j, q, use: furrows ? "furrows" : "pasture", along }; } }
    return null; }
  // ridge and furrow: strips along the field's long way, a smooth hump each (a parabola, + - * only), dying out at the
  // headland, a strip's width from the field's edge
  function furrowZ(x, y) { if (site.padD(x, y) < pkg.clear) return 0; const f = fieldAt(x, y); if (!f || f.use !== "furrows") return 0;
    const u = (f.along ? x : y) / pkg.ridge.width, t = u - Math.floor(u), hump = 4 * t * (1 - t);
    let edgeD = Infinity; for (let a = 0, b = 3; a < 4; b = a++) { const [ax, ay] = f.q[b], [bx, by] = f.q[a], dx = bx - ax, dy = by - ay, k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); edgeD = Math.min(edgeD, Math.hypot(x - ax - k * dx, y - ay - k * dy)); }
    const fade = Math.min(1, Math.max(0, (edgeD - 3) / pkg.ridge.width)); return (hump - 0.5) * pkg.ridge.height * fade; }
  return { pkg, cell: C, nodeAt, edge, edgesIn, fieldAt, furrowZ };
}
