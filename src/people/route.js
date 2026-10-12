// A way from here to there for a body that walks (M8, R60): A* over the walker's own rules (src/make/walk.js
// groundAt: floors, treads and landings within a step, a body's width off walls and furniture, through doorways only
// while open), on a grid of 0.2 m, carrying the height so stairs are climbed as the player climbs them, then pulled
// straight wherever the walker allows. Bodies (src/people/bodies.js) are not routed round: they move, so a walker
// waits or steps aside for them as it goes. Plan coordinates: x east, y north, h the height of the feet.
//   route(walk, [x, y, h], [x, y, h], { cell = 0.2, limit = 40000 }) -> [[x, y, h], ...] | null
//   seek(walk, from, to, opts) -> { step(nodes) -> undefined while searching, then the path or null }: the same search in
//   slices, so a frame's budget holds however far the way (a way that isn't there costs its whole limit)
export function route(walk, from, to, opts = {}) { const s = seek(walk, from, to, opts); let r; while ((r = s.step(1e9)) === undefined); return r; }
export function seek(walk, from, to, { cell = 0.2, limit = 40000 } = {}) {
  const [fx, fy, fh] = from, [tx, ty, th] = to;
  const h0 = walk.groundAt(fx, fy, fh); if (h0 == null) return { step: () => null };
  const tf = walk.floorOf(th), near = (x, y, h) => Math.hypot(x - tx, y - ty) < cell * 0.75 && walk.floorOf(h) === tf;
  // a node: a cell and the height a body stands at there (half-metre bands keep a stair's foot apart from its head)
  const ox = fx, oy = fy, idOf = (i, j, h) => `${i},${j},${Math.round(h * 2)}`;
  const open = [], nodes = new Map(), H = (x, y, h) => Math.hypot(x - tx, y - ty) + Math.abs(h - th);
  const push = (n) => { open.push(n); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p].f <= open[k].f) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k;
    if (l < open.length && open[l].f < open[m].f) m = l; if (r < open.length && open[r].f < open[m].f) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
  const start = { i: 0, j: 0, x: fx, y: fy, h: h0, g: 0, f: H(fx, fy, h0), prev: null, id: idOf(0, 0, h0) }; nodes.set(start.id, start); push(start);
  let seen = 0, done = false, out;
  function finish(end) { done = true; if (!end) return out = null;
    const pts = []; for (let n = end; n; n = n.prev) pts.unshift([n.x, n.y, n.h]);
    if (walk.groundAt(tx, ty, end.h) != null) pts.push([tx, ty, walk.groundAt(tx, ty, end.h)]);
    return out = pull(walk, pts); }
  function step(budget) {
    if (done) return out;
    for (let k = 0; k < budget; k++) {
      if (!open.length || seen++ >= limit) return finish(null);
      const n = pop(); if (n.done) continue; n.done = true;
      if (near(n.x, n.y, n.h)) return finish(n);
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue;
        const i = n.i + di, j = n.j + dj, x = ox + i * cell, y = oy + j * cell, h = walk.groundAt(x, y, n.h); if (h == null) continue;
        // (a diagonal only where both its sides can be stood on: no cutting a jamb's corner)
        if (di && dj && (walk.groundAt(ox + n.i * cell + di * cell, oy + n.j * cell, n.h) == null || walk.groundAt(ox + n.i * cell, oy + n.j * cell + dj * cell, n.h) == null)) continue;
        const id = idOf(i, j, h), g = n.g + Math.hypot(di * cell, dj * cell, h - n.h), was = nodes.get(id);
        if (was && (was.done || was.g <= g)) continue;
        const m = { i, j, x, y, h, g, f: g + H(x, y, h), prev: n, id }; nodes.set(id, m); push(m);
      }
    }
    return undefined;
  }
  return { step };
}
// a straight walk from a to b under the walker's rules, in 5 cm steps (as the page's __walk does): where it ends up
function straight(walk, a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05); let h = a[2];
  for (let k = 1; k <= n; k++) { const g = walk.groundAt(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, h); if (g == null) return false; h = g; }
  return Math.abs(h - b[2]) < 0.05; }
// the path pulled straight: from each point, on as far as a straight walk keeps reaching (forward, so a long route
// costs a walk a point, not a walk a pair)
function pull(walk, pts) { const out = [pts[0]]; let a = 0;
  while (a < pts.length - 1) { let b = a + 1; while (b + 1 < pts.length && straight(walk, pts[a], pts[b + 1])) b++; out.push(pts[b]); a = b; }
  return out; }
// Which floor reaches which (for choosing where to send someone at all): the floor at height h, over a box, flood-filled
// once on a grid of cell under the walker's rules; each region a number. A door shut since cuts nothing here until
// it is asked again: the regions are of the moment they were made.
//   regions(walk, { x0, y0, x1, y1 }, h, { cell = 0.4 }) -> { of(x, y) -> region | 0, cells(region) -> [[x, y, h], ...] }
export function regions(walk, box, h, { cell = 0.4 } = {}) {
  const n = Math.ceil((box.x1 - box.x0) / cell), m = Math.ceil((box.y1 - box.y0) / cell), lab = new Int32Array(n * m), hs = new Float32Array(n * m), by = [null];
  const X = (i) => box.x0 + (i + 0.5) * cell, Y = (j) => box.y0 + (j + 0.5) * cell;
  for (let s = 0; s < n * m; s++) { if (lab[s]) continue; const i0 = Math.floor(s / m), j0 = s % m, g0 = walk.groundAt(X(i0), Y(j0), h); if (g0 == null || Math.abs(g0 - h) > 0.5) { lab[s] = -1; continue; }
    const r = by.length, list = []; by.push(list); lab[s] = r; hs[s] = g0; const q = [s];
    while (q.length) { const c = q.pop(), i = Math.floor(c / m), j = c % m; list.push([X(i), Y(j), hs[c]]);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= n || b >= m) continue; const k = a * m + b; if (lab[k] > 0) continue;
        // (reached from here in a straight 5 cm walk, so a doorway half a cell wide still joins)
        let hh = hs[c], ok = true; for (let t = 1; t <= 8 && ok; t++) { const g = walk.groundAt(X(i) + di * cell * t / 8, Y(j) + dj * cell * t / 8, hh); if (g == null) ok = false; else hh = g; }
        if (!ok || Math.abs(hh - h) > 0.5) continue; lab[k] = r; hs[k] = hh; q.push(k); } } }
  return { of: (x, y) => { const i = Math.floor((x - box.x0) / cell), j = Math.floor((y - box.y0) / cell); return i < 0 || j < 0 || i >= n || j >= m ? 0 : Math.max(0, lab[i * m + j]); },
           cells: (r) => by[r] || [] };
}
