// A recipe in play (the main demo; src/make/recipe.js lays its place out from its facts): its things built where the
// plan stands them, made to work (works.js), their links compiled to works' rules (links.js), their lights pooled with
// the room's, the people the facts name stood in their places, and the place's proof run: every link's ends the right
// sort, every control somewhere you can get to (checkLinks with reach.js), so a recipe that can't be finished is said
// at load. No AI.
// playRecipe({ THREE, plan, manor, works, build, kindOf, K, look, poolOwn, say, know }) -> { thingOf, person, proof, links, talk(id) }
// What a person knows that is theirs to tell (a keypad's code, in their own frame) they tell when talked to: until
// construct writes the line and Photonic speaks it, a plain line says the digits (a stand-in, said as one), and the code is
// then known to you (know(name)): the keypad's "use the code you know" appears.
import { linkRules, portOf } from "./links.js";
import { proveRecipe } from "./recipe.js";

export function playRecipe({ THREE, plan, manor, works, build, kindOf, K, look, poolOwn, say = () => {}, know = () => {} }) {
  const R = plan.recipe, room = plan.rooms.find(r => r.id === plan.entrance), Y = manor.levelOf(room.floor), H = manor.heightOf(room), grp = manor.rooms.get(room.id)?.grp;
  grp?.updateMatrixWorld(true);
  const at = (x, y, h) => grp ? grp.worldToLocal(new THREE.Vector3(x, h, -y)) : new THREE.Vector3(x, h, -y), box = new THREE.Box3();
  const thingOf = new Map();
  for (const t of R.things) {
    // (a light's start, out or lit, on the affordance that lights it)
    const lit = Object.entries(kindOf(t.kind)?.affordances || {}).find(([, a]) => a.lights)?.[0];
    const b = build(THREE, K, look, t.kind, `recipe:${plan.entrance}/${t.id.replace(/[^a-z0-9_]/gi, "_")}`, { ...(t.over || {}), ...(t.start && lit ? { start: { [lit]: t.start } } : {}) });
    b.node.updateMatrixWorld(true); box.setFromObject(b.node);
    // hanging: its top at the ceiling; on a wall: its back on the wall, its front facing into the room
    const h = t.hangs ? Y + H - (box.max.y - b.node.position.y) : Y;
    b.node.position.copy(at(t.at[0], t.at[1], h)); b.node.rotation.y = { S: 0, N: Math.PI, E: -Math.PI / 2, W: Math.PI / 2 }[t.face || "S"];
    b.node.userData.room = room.id; b.story = t.id; b.node.userData.story = t.id; grp?.add(b.node);
    works.add(b); thingOf.set(t.id, b);
    b.node.updateMatrixWorld(true); const ls = []; b.node.traverse(o => { if (o.isPointLight) ls.push(o); }); for (const l of ls) poolOwn(l, room.id);
  }
  // a door the house hung in its doorway (its opening's): the recipe's, for its links
  for (const l of R.links) if (l.opening && !thingOf.has(l.to)) { const d = manor.things.find(b => b.node.userData.opening === l.opening); if (d) { d.story = l.to; thingOf.set(l.to, d); } }
  // the links, by the affordance at each end that carries the link's signal (a switch's out:power, a light's in:power)
  const portAff = (b, dir) => Object.entries(b.kind.affordances || {}).find(([, a]) => portOf(a)?.dir === dir)?.[0];
  const links = R.links.map(l => { const f = thingOf.get(l.from), t = thingOf.get(l.to); return { type: l.type, from: { thing: f.address, aff: portAff(f, "out") }, to: { thing: t.address, aff: portAff(t, "in") } }; });
  works.rules(linkRules(links, (a) => [...thingOf.values()].find(b => b.address === a)));
  // the people: until Photonic's people come in, a stand-in body the room's light reveals (a projection would glow in the
  // dark and give the story away): on all fours if the facts say so, facing along the room
  let person = null;
  const told = new Set();
  for (const p of R.people) { person = standIn(THREE, p.posture); person.position.copy(at(p.at[0], p.at[1], Y)); person.rotation.y = { E: -Math.PI / 2, W: Math.PI / 2, N: Math.PI, S: 0 }[p.facing || "E"];
    person.name = `recipe-person:${p.id}`; person.userData = { room: room.id, person: p.id, posture: p.posture, tells: p.tells.map(t => t.knows) }; grp?.add(person);
    // what you aim at to talk to them: a box round the body, never drawn
    const hb = new THREE.Box3().setFromObject(person), hit = new THREE.Mesh(new THREE.BoxGeometry(...hb.getSize(new THREE.Vector3()).toArray()), new THREE.MeshBasicMaterial({ visible: false }));
    person.updateMatrixWorld(true); hit.position.copy(person.worldToLocal(hb.getCenter(new THREE.Vector3()))); hit.userData.presence = p.id; person.add(hit); person.userData.hit = hit; }
  // talked to: what they know that is theirs to tell, said (the digits, one by one, and a bark: a stand-in line), and known
  const talk = (id) => { const p = R.people.find(q => q.id === id); if (!p) return false;
    if (!p.tells.length) { say("They look up at you, and wag."); return true; }
    for (const t of p.tells) { say(`"${t.code.split("").join(", ")}," they say, and then they bark.`); know(t.knows); told.add(t.knows); }
    return true; };
  // the proof, from the plan alone (src/make/recipe.js proveRecipe): every link sound, every place reached by what the place
  // gives (a keypad's door only for a code someone you can reach tells)
  const proof = proveRecipe(plan, kindOf);
  return { thingOf, person, proof, links, talk, told };
}

// a stand-in body (not Photonic's: their people are theirs to bring in): a plain figure in work clothes, lit by the room,
// on all fours (a person who thinks they're a dog) or standing. Its parts are rounded boxes and capsules in one colour each.
function standIn(THREE, posture) {
  const g = new THREE.Group(), cloth = new THREE.MeshStandardMaterial({ color: 0x5b6470, roughness: 0.9 }), skin = new THREE.MeshStandardMaterial({ color: 0xc8a48a, roughness: 0.7 }), cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m);
  const add = (m, x, y, z, rx = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  if (posture === "all_fours") {
    add(cap(0.16, 0.5, cloth), 0, 0.55, 0, Math.PI / 2);                    // the back, level, shoulders forward (+z)
    add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skin), 0, 0.68, 0.48);   // the head, up, looking ahead
    for (const [x, z] of [[-0.14, 0.32], [0.14, 0.32]]) add(cap(0.05, 0.42, cloth), x, 0.28, z);   // arms straight down to the hands
    for (const [x, z] of [[-0.13, -0.3], [0.13, -0.3]]) { add(cap(0.065, 0.26, cloth), x, 0.38, z - 0.05, -0.5); add(cap(0.06, 0.32, cloth), x, 0.08, z - 0.16, Math.PI / 2); }   // thighs, and shins on the floor
  } else { add(cap(0.17, 0.55, cloth), 0, 1.15, 0); add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skin), 0, 1.62, 0); for (const x of [-0.1, 0.1]) add(cap(0.07, 0.75, cloth), x, 0.45, 0); }
  return g;
}
