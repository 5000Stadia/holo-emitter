// Where a room's walls are (R54 step 5e; consultation cf4d451: "one exact edge identity drives void, lining,
// placement, claims and collision, with no cardinal fallback"). A room drawn as a rectangle has four walls, N, E, S
// and W, as it always had; a room drawn as an outline (any polygon, Kabe 2026-10-06: "allow cool architectures like
// a large octagon room") has one wall per edge, e0, e1, ... Each wall is a frame: a, the corner it is measured from
// (the left one as you face it from inside), dir along it, n into the room, L its length; a point on it is r along
// and d into the room (d < 0 is into the wall and beyond). In the room's own plan frame: u east from its bounding
// box's west side, v north from its south side, metres. Pure: no three.js.

// an outline's corners anticlockwise (interior on the left of each edge)
export function ccw(poly) { let A = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) A += (poly[j][0] - poly[i][0]) * (poly[j][1] + poly[i][1]); return A > 0 ? poly : [...poly].reverse(); }

export function wallsOf(room) {
  const { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0;
  if (!room.outline) return [
    { F: "N", a: [0, D], dir: [1, 0], n: [0, -1], L: W }, { F: "E", a: [W, D], dir: [0, -1], n: [-1, 0], L: D },
    { F: "S", a: [W, 0], dir: [-1, 0], n: [0, 1], L: W }, { F: "W", a: [0, 0], dir: [0, 1], n: [1, 0], L: D }];
  const P = ccw(room.outline).map(([x, y]) => [x - x0, y - y0]);
  return P.map((p, i) => { const a = P[(i + 1) % P.length], b = p, L = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    return { F: `e${i}`, a, dir, n: [dir[1], -dir[0]], L }; });
}
export const framesOf = (room) => Object.fromEntries(wallsOf(room).map(w => [w.F, w]));
// a point on a wall (r along, d into the room) in the room's frame
export const onWallAt = (w, r, d) => [w.a[0] + w.dir[0] * r + w.n[0] * d, w.a[1] + w.dir[1] * r + w.n[1] * d];
// a stretch of wall (r0..r1) and a depth (d0..d1) as a polygon in plan (x east, y north)
export function wallPoly(room, w, r0, r1, d0, d1) {
  const { x0, y0 } = room.rect;
  return [[r0, d0], [r1, d0], [r1, d1], [r0, d1]].map(([r, d]) => { const [u, v] = onWallAt(w, r, d); return [x0 + u, y0 + v]; });
}
// the room's floor as a polygon in its own frame
export const floorOf = (room) => room.outline ? ccw(room.outline).map(([x, y]) => [x - room.rect.x0, y - room.rect.y0])
  : [[0, 0], [room.rect.x1 - room.rect.x0, 0], [room.rect.x1 - room.rect.x0, room.rect.y1 - room.rect.y0], [0, room.rect.y1 - room.rect.y0]];
// a regular polygon's corners (Kabe: "a large octagon room"): centre, radius to its corners, sides, turned so one
// side faces each way it can; exact, in millimetres, anticlockwise
export function regular([cx, cy], R, sides, turn = Math.PI / sides) {
  return Array.from({ length: sides }, (_, i) => { const t = turn + i * 2 * Math.PI / sides; return [Math.round((cx + R * Math.cos(t)) * 1000) / 1000, Math.round((cy + R * Math.sin(t)) * 1000) / 1000]; });
}

// the older form, for a rectangle's walls by name (N, E, S, W), or any wall by its frame: (r, d) to the room's frame
export const wallToRoom = (F, W, D, r, d) => typeof F === "object" ? onWallAt(F, r, d) : F === "N" ? [r, D - d] : F === "S" ? [W - r, d] : F === "E" ? [W - d, D - r] : [d, r];
