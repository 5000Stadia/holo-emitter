// The forecourt's enclosure (R46; design/outdoor/research-1660.md §A, Beauchief Hall, 1671: "the lower front wall
// has iron railing", ashlar piers with pyramid-on-balls finials, "a pair of wrought-iron gates with an overthrow"):
// across the open side of a plan's court, a low wall with railings, broken at the drive by a gateway between two
// piers hung with gates that work. What stops a body is arithmetic on the same shapes (blocked), the gates by
// their state. Built from the plan and the site; the gates are things that work (works.add).
//   buildForecourt({ THREE, K, look, build, plan, site, works }) -> { group, things, blocked(x, y, half) }
const WALL = { h: 0.9, t: 0.6, cope: 0.12 }, RAIL = { h: 1.15, gap: 0.13 }, GATE_W = 3.4, PIER = 0.8;

export function buildForecourt({ THREE, K, look, build, plan, site, works, materials }) {
  const court = plan.rooms.find(r => r.type === "open" && r.room_type === "court"); if (!court) return null;
  const group = new THREE.Group(); group.name = "forecourt";
  // the open side: the court's edge with no wall of the house along it (the E-plan's south)
  const R = court.rect, yF = R.y0, cx = site.drive ? (site.drive.x0 + site.drive.x1) / 2 : (R.x0 + R.x1) / 2;
  const yc = yF - WALL.t / 2, gate0 = cx - GATE_W / 2 - PIER, gate1 = cx + GATE_W / 2 + PIER;
  const runs = [[R.x0, gate0], [gate1, R.x1]].filter(([a, b]) => b - a > 0.3);
  const V = (x, y, z) => new THREE.Vector3(x, z, -y), z0 = (x) => site.z(x, yc);
  // the low wall and its coping, in runs; then the railings on it (one draw of bars for them all)
  const stones = [], bars = [];
  for (const [a, b] of runs) { const n = Math.max(1, Math.round((b - a) / 2));
    for (let i = 0; i < n; i++) { const xa = a + (b - a) * i / n, xb = a + (b - a) * (i + 1) / n, zb = Math.min(z0(xa), z0(xb)) - 0.15, zt = Math.max(z0(xa), z0(xb)) + WALL.h;
      const w = new THREE.BoxGeometry(xb - xa, zt - zb, WALL.t); w.translate((xa + xb) / 2, (zb + zt) / 2, -yc); stones.push(w.toNonIndexed());
      const c = new THREE.BoxGeometry(xb - xa + 0.002, WALL.cope, WALL.t + 0.08); c.translate((xa + xb) / 2, zt + WALL.cope / 2, -yc); stones.push(c.toNonIndexed()); }
    const top = Math.max(z0(a), z0(b)) + WALL.h + WALL.cope;
    for (let x = a + 0.12; x < b - 0.08; x += RAIL.gap) { const g = new THREE.CylinderGeometry(0.012, 0.012, RAIL.h, 6); g.translate(x, top + RAIL.h / 2, -yc); bars.push(g.toNonIndexed());
      const sp = new THREE.ConeGeometry(0.024, 0.09, 4); sp.translate(x, top + RAIL.h + 0.04, -yc); bars.push(sp.toNonIndexed()); }
    for (const y of [top + 0.12, top + RAIL.h - 0.1]) { const r = new THREE.BoxGeometry(b - a - 0.1, 0.035, 0.03); r.translate((a + b) / 2, y, -yc); bars.push(r.toNonIndexed()); } }
  const merge = (list, mat, cast) => { if (!list.length) return; const g = materials.merge(list.map(q => { for (const k of Object.keys(q.attributes)) if (!["position", "normal", "uv"].includes(k)) q.deleteAttribute(k); return q; }), false);
    const m = new THREE.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = true; group.add(m); };
  merge(stones, materials.stone, true); merge(bars, materials.iron, false);
  // the gateway: a pier either side, the gates between, opening into the court
  const things = [];
  for (const [i, x] of [[0, cx - GATE_W / 2 - PIER / 2], [1, cx + GATE_W / 2 + PIER / 2]].map(([i, x]) => [i, x])) {
    const p = build(THREE, K, look, "pier/ashlar-ball", `manor/forecourt/pier:${i}`, {}); p.node.position.set(x, site.z(x, yc) - 0.02, -yc); group.add(p.node); things.push(p); }
  const gates = build(THREE, K, look, "gate/iron-pair", "manor/forecourt/gates", { W: GATE_W }); gates.node.position.set(cx, site.z(cx, yc), -yc); group.add(gates.node);
  works?.add(gates); things.push(gates);
  // what stops a body: the walls (with railings, to their full height), the piers, and each leaf: across the gateway
  // shut, along its hinge side into the court open
  const rects = [...runs.map(([a, b]) => ({ x0: a, x1: b, y0: yF - WALL.t, y1: yF })), { x0: gate0, x1: cx - GATE_W / 2, y0: yF - WALL.t - 0.06, y1: yF + 0.06 }, { x0: cx + GATE_W / 2, x1: gate1, y0: yF - WALL.t - 0.06, y1: yF + 0.06 }];
  const leaf = (side) => { const st = works ? works.stateOf(gates, side) : "closed", hinge = side === "left" ? cx - GATE_W / 2 : cx + GATE_W / 2;
    return st === "open" ? { x0: hinge - 0.08, x1: hinge + 0.08, y0: yc - 0.05, y1: yc + GATE_W / 2 + 0.05 } : side === "left" ? { x0: cx - GATE_W / 2, x1: cx, y0: yc - 0.06, y1: yc + 0.06 } : { x0: cx, x1: cx + GATE_W / 2, y0: yc - 0.06, y1: yc + 0.06 }; };
  const blocked = (x, y, half) => { const hit = (r) => x > r.x0 - half && x < r.x1 + half && y > r.y0 - half && y < r.y1 + half;
    return rects.some(hit) || hit(leaf("left")) || hit(leaf("right")); };
  return { group, things, gates, blocked, line: { yF, cx, gate0, gate1 } };
}
