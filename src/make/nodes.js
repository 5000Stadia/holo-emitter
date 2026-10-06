// The WebGPU path for materials (design/perf/plan.md, the move to WebGPURenderer). The builders make
// classic three.js materials and mark the few that carry their own shader code (wood's patina and
// soot, the drawer labels' atlas cells, the books' spines and titles) in userData. nodeify(scene)
// turns every material into its node twin, the marked ones rewritten in TSL, once, before the first
// frame; the same build code then serves WebGL (classic) and WebGPU (nodes). Needs three's WebGPU
// build (r186+): import THREE from "three/webgpu" and TSL from "three/tsl".
import * as THREE from "three/webgpu";
import { Fn, vec2, vec3, vec4, float, attribute, uniform, texture, uv, mix, fract, floor, dot, exp, smoothstep, clamp, select, positionWorld, mat3,
  diffuseColor, materialRoughness, If } from "three/tsl";

// value noise in world space, as the GLSL did: hh3 a hash, vn3 a trilinear blend of it
const hh3 = Fn(([p0]) => { const p = fract(p0.mul(0.3183099).add(0.1)).mul(17.0).toVar(); return fract(p.x.mul(p.y).mul(p.z).mul(p.x.add(p.y).add(p.z))); });
const vn3 = Fn(([x]) => {
  const i = floor(x).toVar(), f = fract(x).toVar(); f.assign(f.mul(f).mul(float(3).sub(f.mul(2))));
  const h = (o) => hh3(i.add(vec3(...o)));
  return mix(mix(mix(h([0, 0, 0]), h([1, 0, 0]), f.x), mix(h([0, 1, 0]), h([1, 1, 0]), f.x), f.y),
             mix(mix(h([0, 0, 1]), h([1, 0, 1]), f.x), mix(h([0, 1, 1]), h([1, 1, 1]), f.x), f.y), f.z);
});

// wood and stone that have lived: each stretch its own age, scuffed low, smoked under the ceiling and
// over a fire (procedural.js grime(), the same numbers)
class AgedMaterial extends THREE.MeshStandardNodeMaterial {
  constructor(params, { soot, walls }) {
    super(params);
    this.soot = uniform(new THREE.Vector4(...(soot ? soot.slice(0, 4) : [0, 0, 1, 1]))); this.sootK = uniform(soot ? soot[4] : 0); this.walls = uniform(walls ? 1 : 0);
    this.roughnessNode = clamp(materialRoughness.mul(vn3(positionWorld.mul(2.3).add(7.0)).mul(0.4).add(0.8)), 0.2, 1.0);     // wax worn unevenly
  }
  setupDiffuseColor(builder) {
    super.setupDiffuseColor(builder);
    const p = positionWorld, prot = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);
    const pat = float(0.9).add(vn3(prot.mul(p).mul(1.6)).mul(0.13)).add(vn3(prot.mul(p).mul(5.3).add(3.0)).mul(0.05));
    const g = float(1).sub(this.walls.mul(float(1).sub(smoothstep(0.0, 0.55, p.y)).mul(0.16).add(smoothstep(2.3, 3.1, p.y).mul(0.12)))).toVar();
    const sd = p.xy.sub(this.soot.xy).div(this.soot.zw);
    g.mulAssign(float(1).sub(this.sootK.mul(exp(dot(sd, sd).negate()))));
    diffuseColor.rgb.mulAssign(pat.mul(g));
  }
}

// a drawer label: its own cell of the press's atlas, from a per-instance rectangle
function atlasCell(mat) {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: mat.roughness });
  const r = attribute("aRect", "vec4");
  m.colorNode = texture(mat.map, mix(r.xy, r.zw, uv()));
  return m;
}

// a book: the spine from its cell of the spine atlas, the page edges from the pages cell, and the
// title, set into the spine's label area, from the titles atlas (books.js bookLook, the same rules)
function book(mat) {
  const N = mat.userData.node, m = new THREE.MeshStandardNodeMaterial({ roughness: mat.roughness });
  const per = (name, v) => N.instanced ? attribute(name, "vec4") : uniform(new THREE.Vector4(...v));
  const cell = per("aCell", N.cell), title = per("aTitle", N.title), label = per("aLabel", N.label);
  const ps = attribute("aPS", "vec2"), page = ps.x, side = ps.y, pages = uniform(new THREE.Vector4(...N.pages));
  m.colorNode = Fn(() => {
    const q = select(side.greaterThan(0.5), vec2(0.1, uv().y), uv());
    const st = select(page.greaterThan(0.5), mix(pages.xy, pages.zw, uv()), mix(cell.xy, cell.zw, q));
    const c = texture(mat.map, st).toVar();
    const spine = page.lessThan(0.5).and(side.lessThan(0.5)).and(title.z.greaterThan(title.x));
    If(spine, () => {
      const L = uv().sub(label.xy).div(label.zw.sub(label.xy));
      If(L.x.greaterThanEqual(0).and(L.x.lessThanEqual(1)).and(L.y.greaterThanEqual(0)).and(L.y.lessThanEqual(1)), () => {
        const t = texture(N.titles, mix(title.xy, title.zw, L));
        c.rgb.assign(mix(c.rgb, t.rgb, t.a));
      });
    });
    return c;
  })();
  return m;
}

// the classic material's own settings, carried to its node twin
const KEYS = ["color", "map", "normalMap", "normalScale", "roughness", "roughnessMap", "metalness", "metalnessMap", "emissive", "emissiveMap", "emissiveIntensity",
  "aoMap", "aoMapIntensity", "bumpMap", "bumpScale", "vertexColors", "transparent", "opacity", "alphaTest", "side", "depthWrite", "flatShading", "fog", "envMap", "envMapIntensity"];
const carry = (m) => Object.fromEntries(KEYS.filter(k => m[k] !== undefined).map(k => [k, m[k]]));
function twin(mat) {
  const u = mat.userData || {};
  let m;
  if (u.node === "atlas-cell") m = atlasCell(mat);
  else if (u.node && u.node.kind === "book") m = book(mat);
  else if (u.grime) m = new AgedMaterial(carry(mat), u.grime);
  else if (mat.isMeshStandardMaterial) m = new THREE.MeshStandardNodeMaterial(carry(mat));
  else if (mat.isMeshLambertMaterial) m = new THREE.MeshLambertNodeMaterial(carry(mat));
  else if (mat.isMeshBasicMaterial) m = new THREE.MeshBasicNodeMaterial(carry(mat));
  else return mat;                                               // anything else three converts itself
  m.name = mat.name; m.userData = { ...u, from: mat.uuid };
  return m;
}

// every material in the scene, once: shared materials stay shared
export function nodeify(root) {
  const done = new Map();
  root.traverse(o => {
    if (!o.material) return;
    const one = (mat) => { if (mat.isNodeMaterial) return mat; if (!done.has(mat)) done.set(mat, twin(mat)); return done.get(mat); };
    o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
  });
  return done.size;
}
