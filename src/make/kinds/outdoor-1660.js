// Kinds for the outside of a gentry seat c.1660 (R46; design/outdoor/research-1660.md §A, Beauchief Hall, 1671: the
// forecourt's "ashlar piers with pyramid-on-balls finials" and "a pair of wrought-iron gates with an overthrow").
// Frame: standing on y = 0, the front facing +z.
export default [
  // a gate pier: an ashlar shaft on a plinth, a moulded cap, a pyramid, a ball (sizes chosen: piers of the period's
  // forecourts stand about 0.8 m square and 3 m to the cap)
  { kind: "pier/ashlar-ball", v: 1, noun: "the gate pier", fixed: true,
    why: "research-1660 §A (Beauchief Hall's forecourt): ashlar piers with pyramid-on-balls finials; 0.8 m square, 3.0 m to the cap (chosen)",
    size: ["$W", "=H+1.05", "$W"], settings: { W: 0.8, H: 3.0 },
    // by relations: the plinth on the ground, the shaft on it, the cap on the shaft, the pyramid on the cap, the ball on it
    parts: [
      { id: "plinth", part: "box", role: "ashlar", size: ["=W+0.12", 0.3, "=W+0.12"], at: [0, 0, 0], on: "floor" },
      { id: "shaft", part: "box", role: "ashlar", size: ["$W", "=H-0.42", "$W"], at: [0, 0, 0], on: "plinth" },
      { id: "cap", part: "box", role: "ashlar", size: ["=W+0.16", 0.12, "=W+0.16"], at: [0, 0, 0], on: "shaft" },
      { id: "pyramid", part: "cone", role: "ashlar", r: "=W*0.48", h: 0.5, segments: 4, ops: [["ry", 0.7853981634]], at: [0, 0, 0], on: "cap" },
      { id: "ball", part: "sphere", role: "ashlar", r: 0.2, at: [0, 0, 0], on: "pyramid", sink: 0.06 }] },
  // a pair of wrought-iron gates hung between piers, opening into the forecourt (each leaf its own; the overthrow over
  // them, on the piers' caps); the gateway W between the piers' faces; each leaf stands on the ground and turns on its
  // pier's hooks
  { kind: "gate/iron-pair", v: 1, noun: "the gates", fixed: true,
    why: "research-1660 §A (Beauchief Hall): 'a pair of wrought-iron gates with an overthrow'; each leaf half the gateway, 2.6 m high (chosen)",
    size: ["$W", "=H+0.9", 0.1], settings: { W: 3.4, H: 2.6 },
    parts: [
      { part: "iron_gate_leaf", w: "=W/2-0.01", h: "$H", x0: "=-W/2", mover: "left", frame: "its own code builds the leaf from its hinge stile at the gateway's left side, swinging on the mover 'left'" },
      { part: "iron_gate_leaf", w: "=W/2-0.01", h: "$H", mirror: true, x0: "=W/2", mover: "right", frame: "its own code builds the leaf mirrored, from its hinge stile at the gateway's right side, on 'right'" },
      { part: "iron_overthrow", w: "$W", rise: 0.7, y0: "=H+0.25", z: -0.012, loose: "it stands on the piers' caps, each pier a thing of its own", frame: "its own code builds the arch over the gateway, springing from the piers' caps, set 12 mm back of the leaves' face" }],
    affordances: {
      left: { mover: "left", motion: "hinge", axis: [0, 1, 0], angle: 1.45, speed: 2, verbs: ["open the gate", "close the gate"] },
      right: { mover: "right", motion: "hinge", axis: [0, 1, 0], angle: -1.45, speed: 2, verbs: ["open the gate", "close the gate"] } } },
];
