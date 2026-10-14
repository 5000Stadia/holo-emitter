// Kinds of today: a code keypad by a door, and the door it bolts (R79's keypad; Kabe, 2026-10-13: "a keypad having the
// right code in it and then pressing enter unlocking another door"; "the only way to exit the room is a keypad with a four
// digit number"). The keypad holds its code (`code`, a setting the place gives) and says which knowledge it asks for
// (`knows`: the code's name, which a person or a note gives the player); in play any digits may be tried (guessing is legal,
// and a wrong code only buzzes), while the proof never counts a guess: the door is reached only once its code is known
// (src/make/links.js gateOf, src/make/case.js). The keypad gives a bolt (out:bolt), the door's lock takes one (in:bolt): the
// place links them (a link of type keypad), and the lock can't be worked by hand.
const keyGrid = [0, 1, 2, 3].flatMap(r => [0, 1, 2].map(c => ({ part: "box", role: "iron", size: [0.018, 0.014, 0.006], at: [`=${(c - 1) * 0.024}`, `=at_y+0.004-${r * 0.021}`, 0.017], meets: { to: "plate", face: "front" } })));
export default [
  { kind: "keypad/four-digit", v: 1, noun: "the keypad", fixed: true, traits: ["wall"],
    why: "a door keypad of today: a brushed steel plate on the wall by the door, twelve keys under a small display; the door it works opens when its four-digit code is keyed in. at_y the plate's middle, a hand's height by a door; code the digits, knows the name of the knowledge that is its code",
    size: [0.09, 0.13, 0.03], settings: { at_y: 1.35, code: "0000", knows: "door_code" },
    parts: [
      { id: "plate", part: "box", role: "pewter", size: [0.09, 0.13, 0.014], at: [0, "=at_y-0.065", 0.007], hangs: "wall" },
      { id: "display", part: "box", role: "japan", size: [0.066, 0.02, 0.004], at: [0, "=at_y+0.035", 0.016], meets: { to: "plate", face: "front" } },
      ...keyGrid],
    affordances: { entry: { motion: "state", states: ["locked", "open"], code: "$code", knows: "$knows", port: "out:bolt", hit: "body",
      verbs: ["key in the code"], wrong: "the keypad buzzes: that isn't the code", release: { "$code_forgotten": true }, held: "its bolt is drawn" } } },
  {
    kind: "door/panelled-bolted", v: 1, noun: "the door", fixed: true,
    why: "a panelled door whose lock is a bolt worked from a keypad by it: no key, no handle's lock; it opens once its keypad has been given its code",
    settings: { w: 1.0, h: 2.2, set: -0.1 },
    parts: [{ part: "panelled_leaf" }],
    affordances: {
      lock: { motion: "state", states: ["locked", "unlocked"], initial: "locked", port: "in:bolt", requires: { "@worked_by_its_keypad": true }, release: { "@worked_by_its_keypad": true },
        refused: "it is bolted; its keypad works it", held: "its keypad works it" },
      leaf: { mover: "leaf", motion: "hinge", axis: [0, 1, 0], angle: -1.5, speed: 3, verbs: ["open the door", "close the door"], requires: { lock: "unlocked" }, refused: "it is bolted; its keypad works it" } },
  },
];
