// Looks (design/production/plan.md §2): what each material role is, for one period and place. A
// kind names roles (wood, wood_face, iron, parchment…); the look decides what they are, so the same
// kinds build an English evidence house in 1660 or, with another look, somewhere else.
import { drawerInside } from "../../lab/painted/procedural.js";

// an English house c. 1660, from the kit's oak and the strongroom's iron, stone and paper
export function lookC1660(THREE, K, S) {
  const m = (cls, o) => { const x = new THREE.MeshStandardMaterial(o); x.userData.cls = cls; return x; };
  K.look1660 = K.look1660 || {
    name: "england-1660",
    roles: {
      wood: K.M.oak, wood_face: K.M.oakH, wood_inside: drawerInside(THREE, K), door_wood: S.doorOak,
      iron: S.iron, dark: S.dark, parchment: S.parch, tape: S.tape,
      metal: m("brass", { color: 0xb08a4a, metalness: 0.7, roughness: 0.35 }),
      wax: m("tallow", { color: 0xe6dcc2, roughness: 0.55 }),
      seal_wax: m("seal_wax", { color: 0x8a2a1e, roughness: 0.5 }),
    },
  };
  return K.look1660;
}
