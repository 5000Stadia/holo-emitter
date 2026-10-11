// What a room is, as a list the eye could check (design/production/plan.md §3): every built thing by
// id and kind, every placed instance (a drawer, a book), each with its position rounded to 0.1 mm and
// its turn to 0.1 mrad. Two hashes per room: the layout hash over that list, which must agree on every
// browser and device; and the raw hash over the unrounded floats, which may differ in the last bits.
import { hashOf, fnv } from "./id.js";

export function layoutOf(THREE, root) {
  root.updateMatrixWorld(true);
  const out = [], raw = [], p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), e = new THREE.Euler(), m = new THREE.Matrix4();
  const r4 = (x) => Math.round(x * 1e4);
  const entry = (label, M) => { M.decompose(p, q, sc); e.setFromQuaternion(q); out.push(`${label} ${r4(p.x)} ${r4(p.y)} ${r4(p.z)} ${r4(e.x)} ${r4(e.y)} ${r4(e.z)}`); raw.push(p.x, p.y, p.z, q.x, q.y, q.z, q.w); };
  root.traverse(o => {
    const mk = o.userData.make;
    if (mk && mk.id && mk.kind) entry(`${mk.id} ${mk.kind}`, o.matrixWorld);
    if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); m.premultiply(o.matrixWorld); entry(`${o.userData.instance || o.name}#${i}`, m); }
  });
  out.sort();
  return { entries: out, layout: hashOf(out), raw: fnv(raw.map(x => x.toString()).join(",")).toString(36) };
}
