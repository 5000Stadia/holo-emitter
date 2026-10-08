// Kinds for a household's things, c. 1660: data only, over the shape parts (src/make/parts/shapes.js)
// and the shelving and book parts. Each knows its size (to be packed among others before it is built)
// and its traits (heavy things go low; fragile ones at hand; things that stay put can hold a run of
// books). Everything that obviously works, works: lids lift, a globe turns, a candle lights.
const P = Math.PI;
export default [
  { kind: "candle/stub", v: 1, noun: "the candle", why: "a candlestick with the stub of a tallow candle in it, kept on the shelf for the evening",
    size: [0.1, "=0.175+length", 0.1], settings: { length: [0.02, 0.09], radius: 0.01 }, traits: ["daily"],
    parts: [{ part: "candlestick" }],
    affordances: { light: { hit: "body", motion: "switch", lights: "flame", starts: "burn", verbs: ["light the candle", "put out the candle"] } },
    take: { requires: { light: "out" }, refused: "not while it burns" },
    processes: { burn: { initial: 1, phases: [{ to: 0.1, rate: 0.0003 }], drives: [{ mover: "candle", scale: [0, 1, 0] }, { mover: "flame", axis: [0, 1, 0], travel: "$length" }] } } },
  // the lights a room type names (src/make/rooms/england-1660.js `light`), each a thing that gives it: a lantern at the
  // stairhead, a sconce by a passage's door, a rushlight in the back stair. Each is lit from the start and can be put
  // out and lit again; its flame burns steady in the still air indoors (no animation, and its pooled light kept from the
  // hearths' flicker, so a lit one never asks for a frame of its own) and its light is only ever where its flame is
  { kind: "lantern/stair", v: 1, noun: "the lantern", fixed: true, rests: "held", held: "hung from the ceiling on its chain",
    why: "a hanging lantern for a stairhead, c. 1660: a square iron frame on a base plate, leaves of scraped horn (glass was dearer, and a stair's lantern is a working light), a pyramid roof with a ring, hung on an iron chain from a plate in the ceiling; a tallow candle in a socket inside, lit. Its lowest point is y = 0, the ceiling at its top; drop is the chain's length",
    size: [0.212, "=drop+0.49", 0.212], settings: { drop: 0.6, glow: 2.2 },
    // by relations: the corner posts on the base, the horn leaves on the base between them, the top on the posts, the roof on
    // the top, the finial on the roof, the ring on the finial, the chain hanging in the ring (its lowest link through it,
    // resting on it), the ceiling plate on the chain; the candle's socket on the base, the candle in it
    parts: [
      { id: "base", part: "box", role: "iron", size: [0.2, 0.016, 0.2] },
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => ({ id: `post${i}`, part: "box", role: "iron", size: [0.012, 0.3, 0.012], at: [sx * 0.092, 0, sz * 0.092], on: "base" })),
      ...[1, -1].flatMap(s => [{ part: "box", role: "horn", size: [0.172, 0.296, 0.003], at: [0, 0, s * 0.0915], on: "base" }, { part: "box", role: "horn", size: [0.003, 0.296, 0.172], at: [s * 0.0915, 0, 0], on: "base" }]),
      { id: "top", part: "box", role: "iron", size: [0.2, 0.012, 0.2], on: "post0" },
      { id: "roof", part: "cone", role: "iron", r: 0.15, h: 0.09, segments: 4, ops: [["ry", P / 4]], on: "top" },
      { id: "finial", part: "cylinder", role: "iron", r: 0.01, h: 0.025, segments: 10, on: "roof", sink: 0.005 },
      { id: "ring", part: "torus", role: "iron", r: 0.018, tube: 0.004, radial: 6, tubular: 16, on: "finial", sink: 0.004 },
      { id: "chain", part: "chain", length: "$drop", r: 0.011, tube: 0.0025, stretch: 1.4, on: "ring", sink: 0.0153 },
      { part: "cylinder", role: "iron", r: 0.04, h: 0.01, segments: 16, on: "chain", sink: 0.004, within: "the chain's top link stapled into the ceiling plate" },
      // (inside the horn, which the check counts as solid: they show through it, dimly, as the candle's light does)
      { id: "socket", part: "lathe", role: "iron", segments: 14, profile: [[0, 0], [0.016, 0], [0.016, 0.03], [0.0125, 0.03], [0.0125, 0.006], [0, 0.006]], on: "base", seen: false },
      { part: "cylinder", role: "wax", r: 0.012, h: 0.12, segments: 12, on: "socket", sink: 0.024, seen: false },
      { part: "flame", at: [0, 0.156, 0], r: 0.006, light: "$glow", still: true, halo: [0.07, 0.3], frame: "the flame on the candle's wick, 1.4 cm over its top (0.142 m: the base 0.016, the socket's floor 0.006 up it, the candle 0.12); the horn glowing from within" }],
    affordances: { light: { motion: "switch", lights: "flame", initial: "lit", hit: "body", verbs: ["light the lantern", "put out the lantern"] } } },
  { kind: "sconce/candle", v: 1, noun: "the sconce", fixed: true, traits: ["wall"],
    why: "a wall sconce of latten (brass), c. 1660: a back plate with a boss that throws the light back into the room, an arm, a drip pan and a socket, a tallow candle in it, lit; fixed beside a passage's door, at_y the plate's middle",
    size: [0.1, 0.3, 0.16], settings: { at_y: 1.5, glow: 1.2 },
    // by relations: the plate on the wall, the boss and the arm on the plate, the pan on the arm's end, the socket on the pan,
    // the candle in the socket
    parts: [
      { id: "plate", part: "box", role: "metal", size: [0.1, 0.26, 0.004], at: [0, "=at_y-0.13", 0], hangs: "wall" },
      { part: "cylinder", role: "metal", r: 0.03, h: 0.005, segments: 20, ops: [["rx", P / 2], ["t", 0, "=at_y+0.07", 0]], hangs: "plate" },
      { id: "arm", part: "box", role: "metal", size: [0.02, 0.014, 0.06], at: [0, "=at_y-0.113", 0], hangs: "plate" },
      { id: "pan", part: "cylinder", role: "metal", r: 0.05, h: 0.01, segments: 20, at: [0, "=at_y-0.11", 0], meets: { to: "arm", face: "front" }, sink: 0.008 },
      { id: "socket", part: "lathe", role: "metal", segments: 16, profile: [[0, 0], [0.014, 0], [0.014, 0.035], [0.0115, 0.035], [0.0115, 0.006], [0, 0.006]], at: [0, 0, 0.106], on: "pan" },
      { part: "cylinder", role: "wax", r: 0.011, h: 0.16, segments: 14, at: [0, 0, 0.106], on: "socket", sink: 0.029 },
      { part: "flame", at: [0, "=at_y+0.079", 0.106], r: 0.006, light: "$glow", still: true, frame: "the flame on the wick, 1.3 cm over the candle's top (at_y + 0.066: the pan's top at_y - 0.1, the socket's floor 0.006 up it, the candle 0.16), over the pan's middle (0.106 m out from the wall)" }],
    affordances: { light: { motion: "switch", lights: "flame", initial: "lit", hit: "body", verbs: ["light the candle", "put out the candle"] } } },
  { kind: "rushlight/nip", v: 1, noun: "the rushlight", fixed: true,
    why: "a rushlight holder: an iron nip on a stem set in a turned wooden block, its jaw closed by a weighted lever, gripping a peeled rush dipped in fat at a slant, lit at its upper end: the servants' and the back stair's light, about a third of a candle's (Gilbert White, Selborne, 1775, describes the making)",
    size: [0.24, 0.4, 0.1], settings: { glow: 0.6 },
    // by relations: the stem in the block, the jaw on the stem, the lever off the jaw's side, its knob on its end; the rush
    // set through the jaw by its own turn
    parts: [
      { id: "block", part: "lathe", role: "treen", profile: [[0, 0], [0.05, 0], [0.05, 0.022], [0.04, 0.034], [0.026, 0.042], [0, 0.042]] },
      { id: "stem", part: "cylinder", role: "iron", r: 0.005, h: 0.2, segments: 8, on: "block", sink: 0.012 },
      { id: "jaw", part: "box", role: "iron", size: [0.03, 0.014, 0.012], on: "stem", sink: 0.004 },
      { id: "lever", part: "cylinder", role: "iron", r: 0.0035, h: 0.07, segments: 6, ops: [["rz", -P / 2 - 0.5], ["t", 0, 0.233, 0]], meets: { to: "jaw", face: "right" }, sink: 0.004 },
      { part: "sphere", role: "iron", r: 0.008, w: 10, h: 8, meets: { to: "lever", face: "right" }, sink: 0.003, align: { y: 0 } },
      { part: "cylinder", role: "wax", r: 0.0028, h: 0.32, segments: 6, ops: [["t", 0, -0.096, 0], ["rz", -0.8], ["t", 0, 0.233, 0]], frame: "a third of the rush below the jaw's middle (0.233 m: the block 0.042, the stem 0.2 let 0.012 in, the jaw 0.014 let 0.004 on), slanted 0.8 rad up and away", within: "gripped between the nip's jaws, through them" },
      { part: "flame", at: [0.163, 0.396, 0], r: 0.005, light: "$glow", still: true, frame: "the flame on the rush's upper end (0.224 m up its slant from the jaw: x 0.161, y 0.389)" }],
    affordances: { light: { motion: "switch", lights: "flame", initial: "lit", hit: "body", verbs: ["light the rushlight", "put out the rushlight"] } } },
  { kind: "key/iron", v: 1, noun: "the key", why: "a wrought-iron key, about 11 cm: a looped bow, a round shank, a warded bit",
    size: [0.11, 0.02, 0.04], settings: {}, traits: [],
    // by relations: the shank let 4 mm into the bow's far rim, the bit on the shank's end
    parts: [
      { id: "bow", part: "torus", role: "iron", r: 0.016, tube: 0.004, radial: 6, tubular: 18, ops: [["rx", P / 2], ["t", -0.04, 0.004, 0]] },
      { id: "shank", part: "cylinder", role: "iron", r: 0.004, h: 0.061, segments: 8, ops: [["rz", -P / 2], ["t", -0.024, 0.004, 0]], meets: { to: "bow", face: "right" }, sink: 0.004 },
      { part: "box", role: "iron", size: [0.014, 0.008, 0.02], at: [0.044, 0, 0.01], meets: { to: "shank", face: "right" } }] },
  { kind: "jug/earthen", v: 1, noun: "the jug", why: "a jug for ale or water: salt-glazed stoneware, red earthenware or yellow slipware",
    size: [0.16, 0.22, 0.14], settings: { body: { one_of: ["stoneware", "earthenware", "slipware"] } }, traits: ["heavy"],
    // by relations: the handle let 6 mm into the belly's widest side
    parts: [
      { id: "body", part: "lathe", role: "$body", profile: [[0, 0], [0.045, 0], [0.06, 0.03], [0.068, 0.08], [0.06, 0.13], [0.04, 0.17], [0.036, 0.2], [0.04, 0.21], [0, 0.21]] },
      { part: "torus", role: "$body", r: 0.035, tube: 0.008, radial: 6, tubular: 14, arc: P, ops: [["rz", -P / 2], ["t", 0.062, 0.13, 0]], meets: { to: "body", face: "right" }, sink: 0.006 }] },
  { kind: "tankard/pewter-lidded", v: 1, noun: "the tankard", why: "a pewter tankard with a hinged lid and a thumbpiece",
    size: [0.14, 0.15, 0.1], settings: {}, traits: ["daily"],
    parts: [
      { id: "body", part: "lathe", role: "pewter", profile: [[0, 0.012], [0.038, 0.012], [0.04, 0.138], [0.046, 0.14], [0.042, 0.13], [0.044, 0.02], [0.05, 0.01], [0.048, 0], [0, 0]] },
      // (the brine on the vessel's 1.2 cm floor; the thumbpiece let into the lid; the handle let 7 mm into the side)
      { part: "cylinder", role: "brine", r: 0.038, r_top: 0.0393, h: 0.088, segments: 16, at: [0, 0.012, 0], in: "body", sink: -0.012 },
      { part: "mover", name: "lid", pivot: [0.046, 0.14, 0] },
      { id: "cap", part: "lathe", role: "pewter", mover: "lid", profile: [[0, 0.14], [0.048, 0.14], [0.04, 0.152], [0, 0.156]], on: "body" },
      { part: "box", role: "pewter", mover: "lid", size: [0.02, 0.014, 0.012], at: [0.05, 0.144, 0], on: "cap", sink: 0.012 },
      { part: "torus", role: "pewter", r: 0.035, tube: 0.007, radial: 6, tubular: 12, arc: P, ops: [["rz", -P / 2], ["t", 0.043, 0.075, 0]], meets: { to: "body", face: "right" }, sink: 0.007 }],
    affordances: { lid: { mover: "lid", motion: "hinge", axis: [0, 0, 1], angle: -1.2, verbs: ["lift the lid", "close the lid"] } } },
  { kind: "bottle/onion", v: 1, noun: "the bottle", why: "an onion bottle of green glass, or a stoneware bellarmine",
    size: [0.1, 0.24, 0.1], settings: { body: { one_of: ["glass", "glass", "glass", "stoneware", "stoneware"] } }, traits: ["fragile"],
    parts: [{ part: "lathe", role: "$body", profile: [[0, 0], [0.05, 0.004], [0.058, 0.05], [0.05, 0.1], [0.02, 0.14], [0.014, 0.2], [0.018, 0.21], [0, 0.21]] }] },
  { kind: "bottle/phial", v: 1, noun: "the phial", why: "an apothecary's phial of green glass, stoppered with a cork, a paper label pasted round it: physic, as the apothecary sent it (the case's opiate, a third gone); 12 cm, so it lies in a cabinet's small drawer, where an onion bottle (21 cm) would stand through the drawer over it",
    size: [0.045, 0.125, 0.045], settings: {}, traits: ["fragile"],
    // by relations: the draught on the phial's inside floor, two thirds full; the cork pushed into its neck; the label round its body
    parts: [
      { id: "body", part: "lathe", role: "glass", segments: 20, profile: [[0, 0], [0.019, 0], [0.022, 0.005], [0.022, 0.07], [0.017, 0.088], [0.0085, 0.098], [0.0085, 0.112], [0.0105, 0.114], [0.0105, 0.118], [0.0065, 0.118], [0.0065, 0.098], [0.015, 0.088], [0.0195, 0.07], [0.0195, 0.007], [0.016, 0.004], [0, 0.004]] },
      { part: "lathe", role: "brine", segments: 20, profile: [[0, 0], [0.0185, 0], [0.0185, 0.044], [0, 0.044]], in: "body", sink: -0.004, seen: false, within: "the draught in the phial's hollow: it shows through the glass, which the check counts as solid" },
      { part: "cylinder", role: "treen", r: 0.0068, r_top: 0.0078, h: 0.02, segments: 12, on: "body", sink: 0.014, within: "the cork pushed into the neck" },
      { part: "cylinder", role: "paper", r: 0.0224, h: 0.03, segments: 20, at: [0, 0.028, 0], in: "body", sink: -0.028, within: "a paper label pasted round its body" }] },
  { kind: "bowl/turned", v: 1, noun: "the bowl", why: "a turned wooden bowl, or a pewter one",
    size: [0.18, 0.07, 0.18], settings: { body: { one_of: ["treen", "pewter"] } }, traits: ["daily", "fragile"],
    parts: [{ part: "lathe", role: "$body", profile: [[0, 0], [0.04, 0], [0.07, 0.02], [0.088, 0.06], [0.084, 0.062], [0.066, 0.024], [0, 0.012]] }] },
  { kind: "box/oak-lidded", v: 1, noun: "the box", why: "a small oak box with a lid: deeds, letters, a Bible's keeping",
    size: ["$w", 0.1, 0.14], settings: { w: [0.2, 0.3] }, traits: ["heavy", "stays_put"],
    parts: [
      { id: "case", part: "carcass", size: ["$w", 0.08, 0.14], open: "top", t: 0.012, role: "wood_face", on: "floor" },
      { part: "box", role: "paper", size: ["=w-0.06", 0.02, 0.09], at: [0, 0, 0], in: "case.inside" },
      { part: "mover", name: "lid", pivot: { at: "case", x: "mid", y: "top", z: "back" } },
      { part: "box", role: "wood_face", mover: "lid", size: ["=w+0.01", 0.018, 0.15], at: [0, 0, 0], on: "case" },
      { part: "slot", name: "inside", at: [0, 0.034, 0], area: ["=w-0.07", 0.08], frame: "a point on the papers in the box's middle, where what is kept in it lies: the case's floor 0.014 m up, the papers 0.02 over it" }],
    affordances: { lid: { mover: "lid", motion: "hinge", axis: [1, 0, 0], angle: -1.9, verbs: ["open the box", "close the box"] } } },
  { kind: "horseshoe/iron", v: 1, noun: "the horseshoe", why: "an iron horseshoe",
    size: [0.13, 0.022, 0.13], settings: {}, traits: [],
    parts: [{ part: "torus", role: "iron", r: 0.055, tube: 0.011, radial: 6, tubular: 16, arc: P * 1.3, ops: [["rz", -P * 0.15], ["rx", -P / 2], ["t", 0, 0.0105, 0]] }] },
  { kind: "pot/of-nails", v: 1, noun: "the pot of nails", why: "an earthen pot of nails",
    size: [0.1, 0.1, 0.1], settings: {}, traits: ["heavy"],
    parts: [
      { id: "pot", part: "lathe", role: "earthenware", profile: [[0, 0], [0.045, 0], [0.045, 0.09], [0.04, 0.09], [0.04, 0.01], [0, 0.01]] },
      // the nails' surface, 1.5 cm below the rim
      { part: "cylinder", role: "iron", r: 0.04, h: 0.01, segments: 14, at: [0, 0.075, 0], on: "pot", sink: 0.015 }] },
  { kind: "globe/terrestrial", v: 1, noun: "the globe", why: "a terrestrial globe in its brass meridian, on a turned stand: a great house's curiosity",
    size: [0.24, 0.34, 0.24], settings: {}, traits: ["fragile"],
    parts: [
      { id: "stand", part: "lathe", role: "treen", profile: [[0, 0], [0.09, 0], [0.08, 0.02], [0.02, 0.04], [0.016, 0.11], [0, 0.11]], on: "floor" },
      { part: "mover", name: "globe", pivot: { at: "ball", x: "mid", y: "mid", z: "mid" } },
      { id: "ball", part: "sphere", role: "globe", mover: "globe", r: 0.1, w: 24, h: 16, at: [0, 0, 0], on: "stand" },
      // the meridian ring about the ball's centre: centred over it, its foot 14.7 cm below the ball's crown
      { part: "torus", role: "metal", r: 0.106, tube: 0.006, radial: 6, tubular: 32, ops: [["rx", P / 2 - 0.4], ["t", 0, 0.21, 0]], on: "ball", sink: 0.147, align: { x: 0.5, z: 0.5 } }],
    affordances: { spin: { mover: "globe", motion: "hinge", axis: [0, 1, 0], angle: 6.2832, speed: 2, states: ["still", "turned"], verbs: ["turn the globe", "turn the globe"] } } },
  { kind: "clock/lantern", v: 1, noun: "the clock", why: "a brass lantern clock; it hangs on the wall, never a shelf",
    size: [0.16, 0.38, 0.15], settings: {}, traits: ["wall"],
    parts: [
      { id: "case", part: "box", role: "metal", size: [0.15, 0.24, 0.14], at: [0, 0.04, 0.07], hangs: "wall" },
      { part: "cylinder", role: "porcelain", r: 0.06, h: 0.004, segments: 24, ops: [["rx", P / 2], ["t", 0, 0.17, 0.1395]], hangs: "case" },
      { id: "dome", part: "sphere", role: "metal", r: 0.06, w: 16, h: 8, theta_len: P / 2, at: [0, 0.28, 0.07], on: "case" },
      { part: "cone", role: "metal", r: 0.012, h: 0.05, at: [0, 0.363, 0.07], on: "dome", sink: 0.002 }] },
  { kind: "porcelain/jar", v: 1, noun: "the china jar", why: "a blue-and-white Chinese jar: a rich house's curiosity",
    size: [0.16, 0.18, 0.16], settings: {}, traits: ["fragile"],
    parts: [
      { id: "jar", part: "lathe", role: "porcelain", segments: 24, profile: [[0, 0], [0.05, 0], [0.075, 0.06], [0.07, 0.13], [0.04, 0.16], [0.04, 0.17], [0, 0.17]] },
      { part: "torus", role: "porcelain_blue", r: 0.072, tube: 0.004, radial: 4, tubular: 24, ops: [["rx", P / 2], ["t", 0, 0.09, 0]], on: "jar", sink: 0.084, align: { x: 0.5, z: 0.5 }, within: "a painted band, proud of the glaze by a hair" }] },
  { kind: "porcelain/bowl", v: 1, noun: "the china bowl", why: "a blue-and-white Chinese bowl: a rich house's curiosity",
    size: [0.16, 0.08, 0.16], settings: {}, traits: ["fragile"],
    parts: [
      { id: "bowl", part: "lathe", role: "porcelain", segments: 24, profile: [[0, 0], [0.035, 0], [0.065, 0.03], [0.08, 0.075], [0.076, 0.077], [0.06, 0.035], [0, 0.012]] },
      { part: "torus", role: "porcelain_blue", r: 0.079, tube: 0.004, radial: 4, tubular: 24, ops: [["rx", P / 2], ["t", 0, 0.07, 0]], on: "bowl", sink: 0.011, align: { x: 0.5, z: 0.5 }, within: "a painted band, proud of the glaze by a hair" }] },
  { kind: "shell/curiosity", v: 1, noun: "the shell", why: "a great shell from the Indies: a curiosity",
    size: [0.16, 0.08, 0.1], settings: {}, traits: [],
    parts: [{ part: "sphere", role: "shell", r: 0.06, w: 16, h: 10, scale: [1.3, 0.6, 0.8], at: [0, 0.035, 0] }] },
  { kind: "letters/bundle", v: 1, noun: "the letters", why: "a bundle of letters tied with tape: a widow's keepsake, or a man's papers; read where they lie, or carried off and read (the page shows what they say)",
    size: [0.12, 0.04, 0.09], settings: {}, traits: [],
    parts: [
      { id: "bundle", part: "box", role: "paper", size: [0.11, 0.035, 0.08] },
      { part: "box", role: "tape", size: [0.012, 0.037, 0.082], on: "floor", within: "the tape tied round the bundle" }],
    affordances: { read: { hit: "body", motion: "state", states: ["unread", "read"], verbs: ["read the letters"], release: { "$forgotten": true }, held: "they are read" } } },
  // a death in the house: the dead are laid out at home, and a sudden death waits there for the coroner's jury
  { kind: "body/laid-out", v: 1, noun: "the body", fixed: true, place: { anchor: "in", of: "bed/standing-curtained", slot: "bed", turn: 0 },
    why: "a man laid out on his own bed until the coroner's jury has had its view of him (design/case/period-1660-death.md §1: the view of the body, within about two days, often in the house where he died): a sheet drawn up over his face, his head on a pillow; a shrouded form only, nothing of the man shown; it lies square in the bed, the head to the bolster end",
    size: ["$Wd", 0.3, "=L+over"], settings: { L: 1.7, Wd: 0.8, over: 0.05 }, traits: [],
    parts: [{ part: "shroud" }] },
  { kind: "body/abed", v: 1, noun: "Sir Gervase, asleep", fixed: true, place: { anchor: "in", of: "bed/standing-curtained", slot: "bed", turn: 0 },
    why: "a man asleep in his own bed (Sir Gervase on his opiate, design/case/case-1660.json lord_asleep: 'sleeps heavily, grey-faced, his bound foot on a cushion'): his head in a linen nightcap on the pillow and bolster, his face turned a little; his nightshirt over his shoulders; a green wool coverlet drawn up to his breast with the sheet turned down over it, one arm out over it in his nightshirt's sleeve; the coverlet thrown back from his gouty foot, bound in linen on a cushion. Lies square in the bed, the head to the bolster end, as the laid-out body does. Still: no breathing, since the page draws a frame only when something changes, and a rise and fall would draw every frame while he is in sight",
    size: ["$Wd", 0.35, "$L"], settings: { L: 1.75, Wd: 1.5, turn: 0.45 }, traits: [],
    parts: [{ part: "sleeper" }] },
  // shelving and bookcases: the structure, then the habit that dresses it from whoever keeps it
  { kind: "shelves/wall-boards", v: 1, noun: "the shelves", fixed: true, why: "boards on iron brackets fixed to a wall: a poor house's shelves",
    settings: { W: 0.9, D: 0.24, ys: { is: [0.95, 1.25] } }, rests: "wall", parts: [{ part: "shelf_boards" }, { part: "shelf_habit", frame: "the habit places the books and things it keeps in the kind's frame, shelf by shelf, from the shelves the part before it reports" }] },
  { kind: "shelves/open-case", v: 1, noun: "the shelves", fixed: true, why: "an open case of shelves: a working house's, or a library's section",
    settings: { W: 1.1, H: 1.95, D: 0.3, ys: { is: [0.08, 0.53, 0.88, 1.18, 1.44, 1.7] } }, parts: [{ part: "shelf_case" }, { part: "shelf_habit", frame: "the habit places the books and things it keeps in the kind's frame, shelf by shelf, from the shelves the part before it reports" }] },
  { kind: "press/glazed-pepys", v: 1, noun: "the bookpress", fixed: true,
    why: "a glazed bookpress after Samuel Pepys's, made by Thomas Simpson in 1666: the first English glazed bookcases; a deeper folio base, 3 × 7 panes in each upper door, carved acanthus",
    settings: { W: 1.2, H: 2.28 }, parts: [{ part: "glazed_bookpress" }],
    affordances: {
      upper_left: { mover: "upper_left", motion: "hinge", axis: [0, 1, 0], angle: -1.9, speed: 4, verbs: ["open the glazed door", "close the glazed door"] },
      upper_right: { mover: "upper_right", motion: "hinge", axis: [0, 1, 0], angle: 1.9, speed: 4, verbs: ["open the glazed door", "close the glazed door"] },
      lower_left: { mover: "lower_left", motion: "hinge", axis: [0, 1, 0], angle: -1.9, speed: 4, verbs: ["open the glazed door", "close the glazed door"] },
      lower_right: { mover: "lower_right", motion: "hinge", axis: [0, 1, 0], angle: 1.9, speed: 4, verbs: ["open the glazed door", "close the glazed door"] } } },
  { kind: "shelves/library-bays", v: 1, noun: "the shelves", fixed: true, why: "a library wall of open oak bays, every shelf full, largest books low",
    settings: { W: 4.2, H: 2.5, bays: 4, D: 0.32 }, parts: [{ part: "library_bays" }] },
];
