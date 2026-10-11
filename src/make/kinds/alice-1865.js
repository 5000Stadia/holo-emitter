// Kinds for the things of the hall of doors in Alice's Adventures in Wonderland (1865), from lab/alice/hall.json: data
// only, over the shape parts, the carcass, and the story parts (src/make/parts/story.js). Every kind keeps to the
// words the text gives it (its quote is in the scene document); the sizes the text leaves open are chosen here and
// said so in each `why`. Frame: standing on y = 0. Things that stand on, or in, another are centred on their own
// middle (x = z = 0), so a slot puts them where it points; a thing on a wall has its back at z = 0.
const P = Math.PI;
// a turned glass leg to height h, three of them round the table at angles 90, 210, 330 degrees from +x
const LEGS = [[0, 1], [-0.866, -0.5], [0.866, -0.5]];
export default [
  // "a little three-legged table, all made of solid glass": the top out of reach of a ten-inch (0.254 m) girl, as the
  // text needs ("she could not possibly reach"; "too slippery" to climb); 0.7 m is a child's table, the 1.2 m Alice's
  // reach. A round top 0.6 m across ("little"); three turned legs; all one glass, so the key shows through it.
  { kind: "table/glass-three-legged", v: 1, noun: "the glass table", fixed: true, place: { anchor: "floor", prefer: [{ centre: true, weight: 1 }] },
    why: "Alice, ch. 1: 'a little three-legged table, all made of solid glass'; 0.7 m high so a ten-inch Alice cannot reach its top, 0.6 m across (the text gives neither)",
    size: ["=R*2", "$H", "=R*2"], settings: { R: 0.3, H: 0.7 },
    // by relations: the legs on the floor, 0.2 m out from the middle, the top on them (its tenons 4 mm into it)
    parts: [
      ...LEGS.map(([x, z], i) => ({ id: `leg${i}`, part: "lathe", role: "glass_clear", segments: 16, on: "floor",
        profile: [[0, 0], [0.02, 0], [0.023, 0.06], [0.016, "=H*0.4"], [0.019, "=H*0.85"], [0.025, "=H-0.026"], [0, "=H-0.026"]], at: [`=R*0.68*(${x})`, 0, `=R+R*0.68*(${z})`] })),
      { id: "top", part: "lathe", role: "glass_clear", segments: 32, profile: [[0, 0], ["=R-0.008", 0], ["$R", 0.008], ["$R", 0.022], ["=R-0.008", 0.03], [0, 0.03]], at: [0, 0, "$R"], on: "leg0", sink: 0.004 },
      { part: "slot", name: "top", at: [0, "$H", "$R"], frame: "a point on the top's middle where the key, and later the bottle, stand" },
      { part: "slot", name: "under", at: [0, 0, "$R"], frame: "a point on the floor under the top's middle, where the glass box lies" }] },
  // "a tiny golden key": 5 cm (the text says only 'tiny'); a ring bow, a round shank, a bit; gold (the look's gilt)
  { kind: "key/golden", v: 1, noun: "the golden key", why: "Alice, ch. 1: 'a tiny golden key'; about 5 cm (the text says only 'tiny'), a ring bow, a round shank, a single bit, in gilt; a lock that asks for key/golden takes it",
    size: [0.05, 0.0045, 0.022], settings: {}, traits: [],
    // by relations: the shank let 2.5 mm into the bow's far rim, the bit on the shank's end
    parts: [
      { id: "bow", part: "torus", role: "gilt", r: 0.0085, tube: 0.0022, radial: 8, tubular: 20, ops: [["rx", P / 2], ["t", -0.015, 0.0022, 0]] },
      { id: "shank", part: "cylinder", role: "gilt", r: 0.0022, h: 0.024, segments: 8, ops: [["rz", -P / 2], ["t", -0.003, 0.0022, 0]], meets: { to: "bow", face: "right" }, sink: 0.0025 },
      { part: "box", role: "gilt", size: [0.0065, 0.0044, 0.009], at: [0.02, 0, 0.0045], meets: { to: "shank", face: "right" } }] },
  // "a low curtain": 0.6 m of cloth in two halves on a rod 0.84 m long, dropping 0.55 m (the text says only 'low'); each half
  // draws aside along the rod, the door behind it shown. Red wool, the look's hangings (the text gives no colour).
  { kind: "curtain/low", v: 1, noun: "the curtain", fixed: true, traits: ["wall"], place: { anchor: "hung" },
    why: "Alice, ch. 1: 'a low curtain she had not noticed before' hiding 'a little door about fifteen inches high'; 0.6 m wide and 0.55 m of drop from a rod (the text says only 'low'), in two halves that draw aside",
    size: ["=W*1.4+0.014", "=drop+0.03", 0.04], settings: { W: 0.6, drop: 0.55 },
    // by relations: the brackets on the wall, the rod between them (4 mm into each), each half hung under the rod
    parts: [
      { id: "bracketL", part: "box", role: "metal", size: [0.014, 0.03, 0.04], at: ["=-W*0.7", "=drop-0.009", 0], hangs: "wall" },
      { id: "bracketR", part: "box", role: "metal", size: [0.014, 0.03, 0.04], at: ["=W*0.7", "=drop-0.009", 0], hangs: "wall" },
      { id: "rod", part: "cylinder", role: "metal", r: 0.006, h: 1, segments: 10, ops: [["rz", -P / 2], ["t", 0, "=drop+0.006", 0.02]], spans: { from: "bracketL", to: "bracketR", axis: "x" }, sink: 0.004 },
      { part: "mover", name: "left", pivot: [0, 0, 0] }, { part: "mover", name: "right", pivot: [0, 0, 0] },
      { id: "halfL", part: "box", role: "hangings", mover: "left", size: ["=W/2-0.001", "$drop", 0.012], at: ["=-W/4-0.0005", 0, 0.02], under: "rod", sink: 0.002 },
      { id: "halfR", part: "box", role: "hangings", mover: "right", size: ["=W/2-0.001", "$drop", 0.012], at: ["=W/4+0.0005", 0, 0.02], under: "rod", sink: 0.002 }],
    affordances: {
      left: { mover: "left", motion: "slide", axis: [-1, 0, 0], travel: "=W*0.18", speed: 3, verbs: ["draw the curtain aside", "draw the curtain back"] },
      right: { mover: "right", motion: "slide", axis: [1, 0, 0], travel: "=W*0.18", speed: 3, verbs: ["draw the curtain aside", "draw the curtain back"] } } },
  // "a little bottle ... round the neck of the bottle was a paper label, with the words 'DRINK ME' beautifully
  // printed on it in large letters": green glass (the look's glass), 18 cm, half filled; drinking drains it
  { kind: "bottle/drink-me", v: 1, noun: "the little bottle", why: "Alice, ch. 1: 'a little bottle ... a paper label, with the words DRINK ME beautifully printed on it in large letters'; green glass 18 cm tall (the text gives neither), the label hung round its neck on a string; drinking it drains it",
    size: [0.08, 0.18, 0.08], settings: {}, traits: ["fragile"],
    // by relations: the draught in the bottle's hollow on its 5 mm floor, the label's string round the neck
    parts: [
      { id: "body", part: "lathe", role: "glass", segments: 20, profile: [[0, 0], [0.033, 0], [0.038, 0.008], [0.04, 0.06], [0.034, 0.105], [0.013, 0.145], [0.011, 0.17], [0.0135, 0.176], [0.0135, 0.18], [0.0105, 0.18], [0.0085, 0.17], [0.01, 0.145], [0.031, 0.105], [0.037, 0.06], [0.035, 0.008], [0.03, 0.004], [0, 0.004]] },
      { part: "mover", name: "draught", pivot: [0, 0.004, 0] },
      { part: "lathe", role: "slipware", mover: "draught", segments: 20, profile: [[0, 0], [0.0295, 0], [0.0345, 0.004], [0.0365, 0.056], [0.0305, 0.1], [0, 0.1]], in: "body", sink: -0.004, seen: false, within: "the draught in the bottle's hollow: it shows through the glass, which the check counts as solid" },
      { part: "lettering", style: "tag", text: "DRINK ME", at: [0, 0.166, 0], neck: 0.0125, w: 0.05, h: 0.02, frame: "the label's string is tied round the neck at 16.6 cm" }],
    affordances: { drink: { motion: "switch", states: ["full", "drunk"], hit: "body", starts: "drain", sets: { bottle_drunk: true }, release: { "$bottle_refills": true }, held: "it is empty", verbs: ["drink from the bottle", "the bottle is empty"] } },
    processes: { drain: { initial: 1, phases: [{ to: 0, rate: 0.35 }], drives: [{ mover: "draught", scale: [0, 1, 0] }] } } },
  // "a little glass box that was lying under the table": 15 cm by 11 cm, 7 cm deep, thin glass, a lid hinged at the back
  // (the text says only 'little'); its slot "inside" holds the cake
  { kind: "box/glass", v: 1, noun: "the glass box", fixed: true, why: "Alice, ch. 1: 'a little glass box that was lying under the table'; 15 by 11 cm and 7 cm deep (the text says only 'little'), a lid hinged at its back with a brass knob; the cake is in it",
    size: ["$W", "=H+0.016", "$D"], settings: { W: 0.15, D: 0.11, H: 0.07 },
    // by relations: the lid on the box's rim, hinged at its back, the knob on the lid
    parts: [
      { id: "case", part: "carcass", size: ["$W", "$H", "$D"], at: [0, 0, 0], open: "top", t: 0.005, role: "glass_clear", inside: "glass_clear" },
      { part: "mover", name: "lid", pivot: { at: "case", x: "mid", y: "top", z: "back" } },
      { id: "lid", part: "box", role: "glass_clear", mover: "lid", size: ["=W+0.004", 0.006, "=D+0.004"], at: [0, 0, 0], on: "case" },
      { part: "sphere", role: "metal", mover: "lid", r: 0.006, w: 12, h: 8, at: [0, 0, "=D/2-0.014"], on: "lid", sink: 0.002 },
      { part: "slot", name: "inside", at: [0, 0.007, 0], frame: "a point on the box's floor, where the cake lies" }],
    affordances: { lid: { mover: "lid", motion: "hinge", axis: [1, 0, 0], angle: -1.9, verbs: ["open the glass box", "close the glass box"] } } },
  // "a very small cake, on which the words 'EAT ME' were beautifully marked in currants": 11 cm across and 3.5 cm high
  // (the text says only 'very small'); the words in currants on its flat top, "EAT" over "ME". Eating a little bit
  // changes nothing (bite); eating it, all of it, makes her grow (eat; the cake dwindles away)
  { kind: "cake/eat-me", v: 1, noun: "the cake", why: "Alice, ch. 1: 'a very small cake, on which the words EAT ME were beautifully marked in currants'; 11 cm across (the text says only 'very small'); eat takes it all, bite a little (the story's page sets which)",
    size: [0.11, 0.037, 0.11], settings: {}, traits: ["daily"],
    // by relations: the currants set 0.8 mm into the cake's flat top
    parts: [
      { part: "mover", name: "cake", pivot: [0, 0, 0] },
      { id: "body", part: "lathe", role: "bread", mover: "cake", segments: 24, profile: [[0, 0], [0.052, 0], [0.0555, 0.01], [0.054, 0.026], [0.048, 0.033], [0.04, 0.035], [0, 0.035]] },
      { part: "lettering", style: "currants", text: "EAT ME", mover: "cake", pitch: 0.0032, at: [0, 0, 0], on: "body", sink: 0.0003 }],
    affordances: {
      eat: { motion: "switch", states: ["whole", "gone"], hit: "body", starts: "eaten", sets: { cake_eaten: true }, release: { "$cake_uneaten": true }, held: "it is eaten", verbs: ["eat the cake", "the cake is eaten"] },
      bite: { motion: "state", states: ["whole", "bitten"], sets: { cake_bitten: true }, release: { "$cake_unbitten": true }, held: "it is bitten", verbs: ["take a little bite of the cake", "the cake is bitten"] } },
    processes: { eaten: { initial: 1, phases: [{ to: 0, rate: 0.5 }], drives: [{ mover: "cake", scale: [1, 1, 1] }] } } },
  // "a row of lamps hanging from the roof": a brass oil lamp on a plain rod (a pendant stem, not a chain) from a ceiling rose:
  // a pear-shaped fount, a burner, a glass chimney round the flame, a bell over its top. Its lowest point is y = 0; the roof
  // is at y = its height (drop + 0.34 m); its frame and rest are for the one who hangs it, from above.
  { kind: "lamp/hanging", v: 1, noun: "the lamp", fixed: true, rests: "held", held: "hung from the roof by its rod",
    why: "Alice, ch. 1: 'a row of lamps hanging from the roof'; a brass oil lamp 15 cm across on a rod (chosen: the text gives neither), lit from the start; its lowest point at y = 0 and the roof at y = drop + 0.34 m",
    size: [0.15, "=drop+0.34", 0.15], settings: { drop: 0.6, glow: 0.6 },
    // by relations: the burner on the fount, the chimney on it, the bell on the chimney, the rod on the bell, the rose on the rod; the flame in the chimney
    parts: [
      { id: "fount", part: "lathe", role: "metal", segments: 20, profile: [[0, 0], [0.02, 0], [0.05, 0.01], [0.075, 0.04], [0.07, 0.07], [0.045, 0.092], [0.02, 0.105], [0, 0.105]] },
      { id: "collar", part: "cylinder", role: "metal", r: 0.016, h: 0.026, segments: 12, on: "fount", sink: 0.004, within: "the burner screwed 4 mm into the fount's neck" },
      { id: "chimney", part: "lathe", role: "glass_clear", segments: 20, profile: [[0, 0], [0.018, 0], [0.03, 0.02], [0.032, 0.06], [0.026, 0.11], [0.02, 0.14], [0.02, 0.17], [0.018, 0.17], [0.018, 0.14], [0.024, 0.11], [0.03, 0.06], [0.028, 0.02], [0.016, 0.002], [0, 0.002]], on: "collar" },
      { id: "bell", part: "lathe", role: "metal", segments: 20, profile: [[0, 0], [0.026, 0], [0.028, 0.004], [0.018, 0.022], [0.008, 0.034], [0.008, 0.04], [0, 0.04]], on: "chimney", sink: 0.004 },
      { id: "rod", part: "cylinder", role: "metal", r: 0.005, h: "$drop", segments: 8, on: "bell", sink: 0.004 },
      { part: "cylinder", role: "iron", r: 0.05, h: 0.014, segments: 16, on: "rod", sink: 0.004 },
      { part: "flame", at: [0, 0.15, 0], r: 0.007, light: "$glow", frame: "the flame stands in the chimney, 2 cm above its floor" }],
    affordances: { light: { motion: "switch", lights: "flame", initial: "lit", hit: "body", verbs: ["put out the lamp", "light the lamp"] } } },
];
