// Building a thing from its kind (design/production/plan.md §2–3): build(kind, address) is a pure
// function of the kind's data, the parts' code, the look and the birth address. The body is merged
// per material; each mover (a lid, a door's leaf, a drawer) is its own group about its pivot, so
// the things that work can move; a bank is many movers drawn as instances (a press's drawers).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { idOf, seedOf, streamOf } from "./id.js";
import { settleFaces } from "./coplanar.js";
import { kindOf, partOf, settle, value, missingParts } from "./catalogue.js";

// a look says what each material role is for one period and place: { roles: { wood: material, … } }
export function material(look, role) {
  const m = look.roles[role];
  if (!m) throw new Error(`the look ${look.name} has no material for the role ${role}`);
  return m;
}

// at authoring, a build can keep each recipe entry's geometry apart (src/make/audit.js): auditing(f)
// runs f with every c.add recorded as { index (the recipe entry), mover, g (a copy, in the thing's frame) }
// (only the thing itself: what it holds, built inside it, is not)
let AUDIT = null, PART = -1, DEPTH = 0;
export function auditing(f) { const rec = []; AUDIT = rec; try { return { out: f(), rec }; } finally { AUDIT = null; } }

export function build(...a) { const part = PART; DEPTH++; try { return buildThing(...a); } finally { DEPTH--; PART = part; } }

function buildThing(THREE, K, look, kindName, address, over = {}, context = {}) {
  const kind = kindOf(kindName);
  if (!kind) throw new Error(`no kind called ${kindName}`);
  const seed = seedOf(address), id = idOf(address), s = settle(kind, seed, over);
  const body = new Map(), movers = new Map(), banks = new Map(), extras = [], animate = [], slots = new Map(), children = [];
  const node = new THREE.Group();
  const into = (map, g, mat) => { if (!map.has(mat)) map.set(mat, []); map.get(mat).push(g); };
  let footprint = null;
  const c = {
    THREE, K, look, s, id, address, seed, context,
    shared: {}, info: {},                                       // what one part leaves for the next; what the thing reports
    r: (name) => streamOf(seed, name),                         // a part's own named stream of choices
    mat: (role) => material(look, role),
    // add geometry, in the thing's own frame, to the body or to a mover; spread is how far each
    // member's tone and grain may differ (wood is cut board by board)
    add(g, role, { mover = null, spread = 0.14, sheet = false, seen = true } = {}) {
      const mat = typeof role === "string" ? material(look, role) : role;     // a role, or a material the part made itself
      if (mat.vertexColors && !g.attributes.color) K.board(g, spread);
      if (mover) { if (!movers.has(mover)) throw new Error(`${kindName}: no mover ${mover} declared before its geometry`); into(movers.get(mover).parts, g, mat); }
      else into(body, g, mat);
      if (AUDIT && DEPTH === 1) AUDIT.push({ index: PART, mover, sheet, seen, g: g.clone() });
      K.parts++;
    },
    // a mover turns or slides about its pivot, in the thing's frame
    mover(name, pivot = [0, 0, 0]) { movers.set(name, { name, pivot, parts: new Map() }); },
    // many movers drawn as instances: the part owns its meshes and says how to set one
    bank(name, b) { banks.set(name, b); },
    // anything else the part makes whole (a light, a pane that is not merged), on the body or a mover
    extra(o, mover = null) { extras.push([o, mover]); },
    // an animation that runs each frame from the clock, the affordances' states and the processes'
    // levels (a flame that flickers while lit): f(seconds, isMoved(aff), levelOf(process))
    animate(f) { animate.push(f); },
    footprint(f) { footprint = f; },
    // a thing this one holds, built from its own kind (a jug on a shelf): it moves with this one, and
    // works in its own right
    child(b) { children.push(b); node.add(b.node); },
    // a place where something can be put: a point in the thing's frame, riding a mover if it has one
    slot(name, at, mover = null) { slots.set(name, { at, mover }); },
    // a box the part names for the parts after it to meet (a carcass's hollow: "inside"), as id.name
    name(n, lo, hi) { c._named.push([n, { lo: [...lo], hi: [...hi] }]); },
    _named: [],
  };
  // a part not written yet: the thing stands as holodeck grid at its true size, takeable if small
  const missing = missingParts(kind);
  if (missing.length) {
    const [w, h, d] = value(kind.size, s), g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, holodeck(THREE)); m.userData = { instance: `${id}/placeholder`, material: "grid", owner: id };
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x8fe3c4 }));
    node.add(m, edges);
    node.userData.make = { id, kind: kind.kind, address, placeholder: missing };
    return { id, address, kind, settings: s, node, movers: new Map(), banks: new Map(), footprint: { w, h, d }, animate: [], slots: new Map(), children: [], info: { placeholder: missing }, placeholder: missing };
  }
  // each entry's geometry is gathered, placed by the relation it states (if any), then added; its box is
  // kept under its id for the entries after it (design/production/geometry-method.md §1)
  const placed = new Map(), add = c.add;
  for (const [i, p] of kind.parts.entries()) {
    PART = i;
    // a part reads the thing's settings, overridden by its own entry ("$name" a setting, "=expr" arithmetic)
    const params = { ...s, ...value(Object.fromEntries(Object.entries(p).filter(([k]) => k !== "part")), s) };
    const got = []; c.add = (g, role, o) => got.push([g, role, o]); c._named = [];
    try { partOf(p.part).build(c, params); } finally { c.add = add; }
    if (got.length) {
      const move = relate(THREE, params, got.map(x => x[0]), placed, `${kindName} #${i}`);
      if (move) for (const [g] of got) g.applyMatrix4(move);
      placed.set(`#${i}`, boxOf(got.map(x => x[0]))); if (params.id) placed.set(params.id, placed.get(`#${i}`));
      // the boxes it named, moved as it was
      for (const [n, b] of c._named) { const v = (q) => move ? new THREE.Vector3(...q).applyMatrix4(move).toArray() : q, a = v(b.lo), z = v(b.hi);
        placed.set(`${params.id || "#" + i}.${n}`, { lo: [0, 1, 2].map(k => Math.min(a[k], z[k])), hi: [0, 1, 2].map(k => Math.max(a[k], z[k])) }); }
    }
    for (const [g, role, o] of got) add(g, role, o);
  }
  // a mover's pivot may name an edge of a placed part: { at: id, x: "left"|"mid"|"right", y: …, z: … }
  for (const mv of movers.values()) if (mv.pivot && !Array.isArray(mv.pivot)) mv.pivot = pivotOf(mv.pivot, placed, kindName);
  node.userData.make = { id, kind: kind.kind, address };
  // faces two parts lay on one plane, facing the same way, would flicker as you move: in each rigid node (the body,
  // each mover) the smaller of each such pair is lifted a hair (src/make/coplanar.js settleFaces)
  const sideOf = (mat) => mat.side === THREE.BackSide ? -1 : mat.side === THREE.DoubleSide ? 0 : 1;
  // all at rest, in the thing's own frame, together: a shut lid's sides lie flush with its box's
  { const maps = [body, ...[...movers.values()].map(mv => mv.parts)], all = maps.flatMap(m => [...m.values()]), flat = all.flat(), sides = maps.flatMap(m => [...m].flatMap(([mat, gs]) => gs.map(() => sideOf(mat))));
    const ts = performance.now(); c.info.settled = flat.length > 1 ? settleFaces(flat, 0.001, sides) : 0; c.info.settle_ms = performance.now() - ts; let k = 0; for (const gs of all) for (let j = 0; j < gs.length; j++) gs[j] = flat[k++]; }
  for (const m of meshesOf(THREE, body, id, "body")) node.add(m);
  const moverNodes = new Map();
  for (const [name, mv] of movers) {
    const g = new THREE.Group(); g.position.set(...mv.pivot);
    for (const [mat, gs] of mv.parts) for (const geo of gs) geo.translate(-mv.pivot[0], -mv.pivot[1], -mv.pivot[2]);
    for (const m of meshesOf(THREE, mv.parts, id, name)) { m.userData.make = { thing: id, mover: name }; g.add(m); }
    g.userData.home = { position: g.position.clone(), quaternion: g.quaternion.clone() };
    node.add(g); moverNodes.set(name, g);
  }
  // a bank's meshes are one instance's pieces (a drawer's front, its bottom, its label): settled together too
  for (const b of banks.values()) { const ms = b.meshes.filter(m => m.isMesh && !m.material?.transparent), gs = ms.map(m => m.geometry);
    if (gs.length > 1) { c.info.settled += settleFaces(gs, 0.001, ms.map(m => sideOf(m.material))); ms.forEach((m, k) => { m.geometry = gs[k]; }); } }
  for (const [name, b] of banks) for (const m of b.meshes) { m.userData.make = { thing: id, bank: name }; node.add(m); }
  for (const [o, mv] of extras) { if (mv) { const g = moverNodes.get(mv); o.position.sub(g.position); g.add(o); } else node.add(o); }
  // slots as points in their mover's frame, so whatever is put there moves with it
  const slotsOut = new Map([...slots].map(([n, { at, mover }]) => [n, { node: mover ? moverNodes.get(mover) : node, at: mover ? at.map((v, i) => v - movers.get(mover).pivot[i]) : at }]));
  return { id, address, kind, settings: s, node, movers: moverNodes, banks, footprint, animate, slots: slotsOut, children, info: c.info };
}

// ---- relations (design/production/geometry-method.md §1): a part says how it meets one already placed, and
// is moved there in closed form, never solved. Kabe, 2026-10-06: "preventative principles"; after
// ShapeAssembly's attach and Infinigen's snap_against, one placing relation a part so order can't stretch it.
//   on: id | "floor"               its underside on the top of id (or the floor, y = 0)
//   hangs: id | "wall"             its back on the front of id (or the wall, z = 0)
//   under: id                      its top against the underside of id
//   in: id.inside                  standing on the floor of a hollow (the meat in a tub, the pan in a stool)
//   meets: { to, face }            the general form: face "top" | "bottom" | "front" | "back" | "left" | "right"
//   sink: m                        let into what it meets by so much (a tenon, a leg into its top); default 0
//   spans: { from, to, axis }      stretched along axis to fill the gap between two placed parts (+ sink each end)
//   fit: { to, axes: "xz" }        sized and placed to fill another's box on those axes (+ sink each side): a
//                                  shelf from side to side of a carcass's inside ("carcass.inside")
//   align: { x|y|z: f }            its centre at fraction f of the other's box on that axis (default: as written)
const FACE = { top: [1, 1], bottom: [1, -1], front: [2, 1], back: [2, -1], right: [0, 1], left: [0, -1], floor: [1, 1] };
function boxOf(geos) { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const g of geos) { const a = g.attributes.position; for (let i = 0; i < a.count; i++) for (let k = 0; k < 3; k++) { const v = a.array[i * 3 + k]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; } }
  return { lo, hi }; }
const GROUND = { floor: { lo: [-Infinity, -Infinity, -Infinity], hi: [Infinity, 0, Infinity] }, wall: { lo: [-Infinity, -Infinity, -Infinity], hi: [Infinity, Infinity, 0] } };
function relate(THREE, p, geos, placed, where) {
  const rel = p.on != null ? { to: p.on, face: "top" } : p.hangs != null ? { to: p.hangs, face: "front" } : p.under != null ? { to: p.under, face: "bottom" } : p.in != null ? { to: p.in, face: "floor" } : p.meets || null;
  if (!rel && !p.spans && !p.fit) return null;
  const get = (id) => { const b = placed.get(id) || GROUND[id]; if (!b) throw new Error(`${where}: no part ${id} placed before it`); return b; };
  const B = boxOf(geos), m = new THREE.Matrix4(), sink = p.sink || 0, t = [0, 0, 0], sc = [1, 1, 1], piv = [0, 0, 0];
  if (p.spans) { const ax = "xyz".indexOf(p.spans.axis), A = get(p.spans.from), Z = get(p.spans.to), [a, z] = A.hi[ax] <= Z.lo[ax] + 1e-9 ? [A, Z] : [Z, A];
    const lo = a.hi[ax] - sink, hi = z.lo[ax] + sink; sc[ax] = (hi - lo) / (B.hi[ax] - B.lo[ax]); piv[ax] = B.lo[ax]; t[ax] = lo - B.lo[ax]; }
  if (p.fit) { const F = get(p.fit.to); for (const k of p.fit.axes) { const ax = "xyz".indexOf(k), lo = F.lo[ax] - sink, hi = F.hi[ax] + sink;
    sc[ax] = (hi - lo) / (B.hi[ax] - B.lo[ax]); piv[ax] = B.lo[ax]; t[ax] = lo - B.lo[ax]; } }
  if (rel) { const [ax, dir] = FACE[rel.face], P = get(rel.to);
    t[ax] = rel.face === "floor" ? P.lo[ax] - sink - B.lo[ax] : dir > 0 ? P.hi[ax] - sink - B.lo[ax] : P.lo[ax] + sink - B.hi[ax];
    if (p.align) for (const [k, f] of Object.entries(p.align)) { const q = "xyz".indexOf(k); if (q === ax || !isFinite(P.lo[q])) continue; t[q] = P.lo[q] + f * (P.hi[q] - P.lo[q]) - (B.lo[q] + B.hi[q]) / 2; } }
  else if (p.fit && p.align) { const F = get(p.fit.to); for (const [k, f] of Object.entries(p.align)) { const q = "xyz".indexOf(k); if (p.fit.axes.includes(k)) continue; t[q] = F.lo[q] + f * (F.hi[q] - F.lo[q]) - (B.lo[q] + B.hi[q]) / 2; } }
  // scale about the part's own start on the spanned axis, then move
  m.makeTranslation(-piv[0], -piv[1], -piv[2]).premultiply(new THREE.Matrix4().makeScale(...sc)).premultiply(new THREE.Matrix4().makeTranslation(piv[0] + t[0], piv[1] + t[1], piv[2] + t[2]));
  return m;
}
function pivotOf(pv, placed, kindName) { const b = placed.get(pv.at); if (!b) throw new Error(`${kindName}: a pivot at ${pv.at}, which isn't placed`);
  return [0, 1, 2].map(k => { const w = pv["xyz"[k]] ?? "mid"; return w === "mid" ? (b.lo[k] + b.hi[k]) / 2 : ["left", "bottom", "back"].includes(w) ? b.lo[k] : b.hi[k]; }); }

// geometry gathered by material, merged into one mesh each
function meshesOf(THREE, map, id, what) {
  const out = [];
  for (const [mat, gs] of map) {
    const keep = gs.map(g => {
      if (g.index) g = g.toNonIndexed();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      return g;
    });
    const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = !mat.transparent; m.receiveShadow = true;
    if (mat.transparent) m.renderOrder = 2;                     // glass draws after what is behind it
    m.userData = { instance: `${id}/${what}/${mat.userData.cls || "part"}`, material: mat.userData.cls || "other", owner: id };
    out.push(m);
  }
  return out;
}

// unestablished matter, in-fiction and literal: a faint ruled grid, glowing a little
let GRID = null;
function holodeck(THREE) {
  if (GRID) return GRID;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = "#06100d"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#7fd6b6"; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  GRID = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.75 }); GRID.userData.cls = "grid";
  return GRID;
}
