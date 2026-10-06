// Building a thing from its kind (design/production/plan.md §2–3): build(kind, address) is a pure
// function of the kind's data, the parts' code, the look and the birth address. The body is merged
// per material; each mover (a lid, a door's leaf, a drawer) is its own group about its pivot, so
// the things that work can move; a bank is many movers drawn as instances (a press's drawers).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { idOf, seedOf, streamOf } from "./id.js";
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
    add(g, role, { mover = null, spread = 0.14, sheet = false } = {}) {
      const mat = typeof role === "string" ? material(look, role) : role;     // a role, or a material the part made itself
      if (mat.vertexColors && !g.attributes.color) K.board(g, spread);
      if (mover) { if (!movers.has(mover)) throw new Error(`${kindName}: no mover ${mover} declared before its geometry`); into(movers.get(mover).parts, g, mat); }
      else into(body, g, mat);
      if (AUDIT && DEPTH === 1) AUDIT.push({ index: PART, mover, sheet, g: g.clone() });
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
  for (const [i, p] of kind.parts.entries()) {
    PART = i;
    // a part reads the thing's settings, overridden by its own entry ("$name" a setting, "=expr" arithmetic)
    const params = { ...s, ...value(Object.fromEntries(Object.entries(p).filter(([k]) => k !== "part")), s) };
    partOf(p.part).build(c, params);
  }
  node.userData.make = { id, kind: kind.kind, address };
  for (const m of meshesOf(THREE, body, id, "body")) node.add(m);
  const moverNodes = new Map();
  for (const [name, mv] of movers) {
    const g = new THREE.Group(); g.position.set(...mv.pivot);
    for (const [mat, gs] of mv.parts) for (const geo of gs) geo.translate(-mv.pivot[0], -mv.pivot[1], -mv.pivot[2]);
    for (const m of meshesOf(THREE, mv.parts, id, name)) { m.userData.make = { thing: id, mover: name }; g.add(m); }
    g.userData.home = { position: g.position.clone(), quaternion: g.quaternion.clone() };
    node.add(g); moverNodes.set(name, g);
  }
  for (const [name, b] of banks) for (const m of b.meshes) { m.userData.make = { thing: id, bank: name }; node.add(m); }
  for (const [o, mv] of extras) { if (mv) { const g = moverNodes.get(mv); o.position.sub(g.position); g.add(o); } else node.add(o); }
  // slots as points in their mover's frame, so whatever is put there moves with it
  const slotsOut = new Map([...slots].map(([n, { at, mover }]) => [n, { node: mover ? moverNodes.get(mover) : node, at: mover ? at.map((v, i) => v - movers.get(mover).pivot[i]) : at }]));
  return { id, address, kind, settings: s, node, movers: moverNodes, banks, footprint, animate, slots: slotsOut, children, info: c.info };
}

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
