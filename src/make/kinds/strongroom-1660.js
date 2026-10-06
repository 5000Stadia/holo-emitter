// Kinds for an evidence house, c. 1660: data only. Each is a composition of parts (src/make/parts/)
// with its settings, what works on it and how, and why it is so. The place fills in what it decides
// (a press's width and its labels, a door's opening, a window's splay) as settings when it builds.
export default [
  {
    kind: "table/joined-with-drawer", v: 1, noun: "the table", fixed: true,
    why: "a joined oak table, four turned legs, one drawer in the front apron: the table under the light for reading a deed out of its drawer",
    settings: { W: 1.1, D: 0.56, H: 0.76, drawer_travel: 0.308 },
    parts: [{ part: "joined_table" }],
    affordances: { drawer: { mover: "drawer", motion: "slide", axis: [0, 0, 1], travel: "$drawer_travel", verbs: ["open the drawer", "close the drawer"] } },
  },
  {
    kind: "chest/iron-bound", v: 1, noun: "the chest", fixed: true,
    why: "the greatest deeds, under two locks: an oak chest, iron bands over the lid and down the front, hasps and padlocks, handles at the ends (Steane 2010: chests 'often had more than one lock')",
    settings: { w: 1.2, d: 0.56, h: 0.62 },
    parts: [{ part: "boarded_box" }, { part: "box_bands" }, { part: "hasp_locks" }, { part: "end_handles" }, { part: "evidence_bundles" }],
    affordances: {
      locks: { mover: "locks", motion: "hinge", axis: [1, 0, 0], angle: -1.0, states: ["locked", "unlocked"], verbs: ["unlock the padlocks", "lock the padlocks"],
        requires: { "@holding": "key" }, refused: "you have no key that fits" },
      lid: { mover: "lid", motion: "hinge", axis: [1, 0, 0], angle: -1.65, speed: 4, verbs: ["open the chest", "close the chest"],
        requires: { locks: "unlocked" }, refused: "the padlocks hold it shut" },
    },
  },
  {
    kind: "press/evidence", v: 1, noun: "the press", fixed: true,
    why: "a press of labelled drawers with pigeonholes over: deeds kept by place, found by label (Windsor aerary 1422–3, 63 drawers 'labelled with the names of manors'; Hardwick 'presses with drawers and pigeon holes')",
    settings: { width: 2.0, height: 2.0, depth: 0.42, cols: 7, rows: 8, pigeonholes: 2, drawer_h: 0.14, hole_h: 0.24 },
    parts: [{ part: "press_carcass" }, { part: "drawer_bank", mover: "drawers" }, { part: "pigeonhole_fill" }],
    affordances: { drawers: { mover: "drawers", motion: "slide", verbs: ["open the drawer", "close the drawer"] } },
  },
  {
    kind: "door/boarded-iron-bound", v: 1, noun: "the door", fixed: true,
    why: "oak boards bound in iron, a stock lock, set back in a plain stone reveal (Steane 2010, New College: doors 'sheathed in iron')",
    settings: { w: 1.0, h: 2.2, set: -0.12, lock: "unlocked", key: "key/iron" },
    parts: [{ part: "boarded_leaf" }, { part: "leaf_ironwork" }],
    affordances: {
      lock: { motion: "state", states: ["locked", "unlocked"], initial: "$lock", auto: true, requires: { "@holding": "$key" }, refused: "it is locked, and you haven't its key", done: "the key turns in the lock" },
      leaf: { mover: "leaf", motion: "hinge", axis: [0, 1, 0], angle: -1.5, speed: 3, verbs: ["open the door", "close the door"], requires: { lock: "unlocked" }, refused: "it is locked, and you haven't its key" } },
  },
  {
    kind: "shutters/splay-pair", v: 1, noun: "the shutters", fixed: true,
    why: "inside shutters on a small barred window, folded back on the splays by day (Steane 2010: 'Iron bars formed a grid over the shuttered windows')",
    settings: { x0: 0, x1: 0.4, y0: 1.26, y1: 1.96, G: -0.48, open_left: -2.6, open_right: 2.6 },
    parts: [{ part: "splay_shutters" }],
    affordances: {
      left: { mover: "left", motion: "hinge", axis: [0, 1, 0], angle: "$open_left", initial: "open", verbs: ["open the shutter", "close the shutter"] },
      right: { mover: "right", motion: "hinge", axis: [0, 1, 0], angle: "$open_right", initial: "open", verbs: ["open the shutter", "close the shutter"] },
    },
  },
  {
    kind: "candle/in-candlestick", v: 1, noun: "the candle",
    why: "a tallow candle in a brass or pewter candlestick: light to read by when the shutters are closed; it burns down while lit, about four hours to the socket",
    settings: { length: [0.12, 0.22], radius: 0.011 },
    parts: [{ part: "candlestick" }],
    affordances: { light: { hit: "body", motion: "switch", lights: "flame", starts: "burn", verbs: ["light the candle", "put out the candle"] } },
    processes: { burn: { initial: 1, phases: [{ to: 0.04, rate: 0.0000667 }], drives: [{ mover: "candle", scale: [0, 1, 0] }, { mover: "flame", axis: [0, 1, 0], travel: "$length" }] } },
  },
];
