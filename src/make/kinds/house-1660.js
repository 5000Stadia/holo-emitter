// Kinds for the rooms of an English house, c. 1660: data only. Interior doors first; the anchor
// furniture of each room type follows (design/house/r47-plan.md §5).
export default [
  {
    kind: "door/panelled", v: 1, noun: "the door", fixed: true,
    why: "an oak door of raised panels between the rooms of a gentry house, on hinges, with a knob and a lock",
    settings: { w: 1.0, h: 2.2, set: -0.1, lock: "unlocked", key: "key/house" },
    parts: [{ part: "panelled_leaf" }],
    affordances: {
      lock: { motion: "state", states: ["locked", "unlocked"], initial: "$lock", auto: true, requires: { "@holding": "$key" }, refused: "it is locked, and you haven't its key", done: "the key turns in the lock" },
      leaf: { mover: "leaf", motion: "hinge", axis: [0, 1, 0], angle: -1.5, speed: 3, verbs: ["open the door", "close the door"], requires: { lock: "unlocked" }, refused: "it is locked, and you haven't its key" } },
  },
];
