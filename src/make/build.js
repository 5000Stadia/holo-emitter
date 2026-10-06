// Building a thing from its kind (design/production/plan.md §2–3): build(kind, address) is a pure
// function of the kind's data, the parts' code, the look and the birth address. The body is merged
// per material; each mover (a lid, a door's leaf, a drawer) is its own group about its pivot, so
// the things that work can move; a bank is many movers drawn as instances (a press's drawers).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { idOf, seedOf, streamOf } from "./id.js";
import { kindOf, partOf, settle } from "./catalogue.js";

// a look says what each material role is for one period and place: { roles: { wood: material, … } }
export function material(look, role) {
  const m = look.roles[role];
  if (!m) throw new Error(`the look ${look.name} has no material for the role ${role}`);
  return m;
}

export function build(THREE, K, look, kindName, address, over = {}) {
  const kind = kindOf(kindName);
  if (!kind) throw new Error(`no kind called ${kindName}`);
  const seed = seedOf(address), id = idOf(address), s = settle(kind, seed, over);
  const body = new Map(), movers = new Map(), banks = new Map(), extras = [], animate = [], slots = new Map();
  const into = (map, g, mat) => { if (!map.has(mat)) map.set(mat, []); map.get(mat).push(g); };
  let footprint = null;
  const c = {
    THREE, K, look, s, id, address, seed,
    r: (name) => streamOf(seed, name),                         // a part's own named stream of choices
    mat: (role) => material(look, role),
    // add geometry, in the thing's own frame, to the body or to a mover; spread is how far each
    // member's tone and grain may differ (wood is cut board by board)
    add(g, role, { mover = null, spread = 0.14 } = {}) {
      const mat = material(look, role);
      if (mat.vertexColors && !g.attributes.color) K.board(g, spread);
      if (mover) { if (!movers.has(mover)) throw new Error(`${kindName}: no mover ${mover} declared before its geometry`); into(movers.get(mover).parts, g, mat); }
      else into(body, g, mat);
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
    // a place where something can be put: a point in the thing's frame, riding a mover if it has one
    slot(name, at, mover = null) { slots.set(name, { at, mover }); },
  };
  for (const p of kind.parts) {
    // a part reads the thing's settings, overridden by its own entry ("$name" reads a setting)
    const params = { ...s, ...Object.fromEntries(Object.entries(p).filter(([k]) => k !== "part").map(([k, v]) => [k, typeof v === "string" && v[0] === "$" ? s[v.slice(1)] : v])) };
    partOf(p.part).build(c, params);
  }
  const node = new THREE.Group();
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
  return { id, address, kind, settings: s, node, movers: moverNodes, banks, footprint, animate, slots: slotsOut };
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
    const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = m.receiveShadow = true;
    m.userData = { instance: `${id}/${what}/${mat.userData.cls || "part"}`, material: mat.userData.cls || "other", owner: id };
    out.push(m);
  }
  return out;
}
