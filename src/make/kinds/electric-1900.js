// Electric light, c. 1900: a switch on the wall by the door, and the light it works hanging from the ceiling across the room
// (R79's first link; Kabe, 2026-10-13: "imagine more modern era Ware there is a light switch that is in a different part of
// the room that the light it turns on"). The light can't be worked by hand: only its switch works it, through a link the
// place states (src/make/links.js); the switch says it controls, so a switch the place links to nothing is a fault.
const P = Math.PI;
export default [
  { kind: "switch/tumbler", v: 1, noun: "the switch", fixed: true, traits: ["wall"], controls: "switch",
    why: "a tumbler switch, c. 1900: a round porcelain block on the wall with a brass cover, a small brass dolly through its face that you flick up or down; at_y the block's middle, about the height of a hand by a door",
    size: [0.07, 0.07, 0.04], settings: { at_y: 1.2 },
    // by relations: the block on the wall, the cover on the block, the dolly on the cover, turning about its root
    parts: [
      { id: "block", part: "cylinder", role: "porcelain", r: 0.035, h: 0.018, segments: 24, ops: [["rx", P / 2], ["t", 0, "=at_y", 0.009]], hangs: "wall" },
      { id: "cover", part: "cylinder", role: "metal", r: 0.026, h: 0.016, segments: 24, ops: [["rx", P / 2], ["t", 0, "=at_y", 0.026]], hangs: "block" },
      { part: "mover", name: "dolly", pivot: { at: "cover", x: "mid", y: "mid", z: "front" } },
      { part: "box", role: "metal", mover: "dolly", size: [0.008, 0.008, 0.02], at: [0, "=at_y-0.004", 0.034], meets: { to: "cover", face: "front" }, sink: 0.002 }],
    affordances: { switch: { mover: "dolly", motion: "switch", axis: [1, 0, 0], angle: 0.6, states: ["off", "on"], hit: "body", verbs: ["switch on the light", "switch off the light"] } } },
  { kind: "lamp/pendant-bulb", v: 1, noun: "the light", fixed: true, rests: "held", held: "hung from the ceiling on its flex",
    why: "an electric pendant, c. 1900: a ceiling rose, a twisted flex, a brass lampholder and a clear pear bulb, worked from the switch by the door. Its lowest point is y = 0, the ceiling at its top; drop is the flex's length",
    size: [0.08, "=drop+0.17", 0.08], settings: { drop: 0.6, glow: 3 },
    // by relations: the bulb at the bottom, the holder on the bulb, the flex on the holder, the rose on the flex
    parts: [
      { id: "glass", part: "bulb", at: [0, 0.0375, 0], r: 0.03, light: "$glow", frame: "the bulb's centre, its glass 3.75 cm round it downward" },
      { id: "holder", part: "cylinder", role: "metal", r: 0.014, h: 0.04, segments: 16, on: "glass" },
      { id: "flex", part: "cylinder", role: "dark", r: 0.003, h: "$drop", segments: 6, on: "holder" },
      { part: "cylinder", role: "porcelain", r: 0.04, h: 0.025, segments: 20, on: "flex", sink: 0.002, within: "the ceiling rose the flex hangs from" }],
    affordances: { light: { motion: "switch", lights: "bulb", initial: "out", requires: { "@worked_by_its_switch": true }, release: { "@worked_by_its_switch": true }, refused: "it's worked from its switch", held: "it's worked from its switch" } } },
];
