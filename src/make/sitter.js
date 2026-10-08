// A sitter's likeness, painted in code (M7): a head-and-shoulders portrait in the manner of an English painter of
// c.1660 (Lely, Mary Beale, Gerard Soest): a dark warm ground, light falling warm from the upper left, the head turned a
// little from the viewer, the flesh modelled in soft gradations rather than outlined. It is driven by a `look` (who the
// person is: sex, age, build, face, hair, beard, dress, expression), so a 22-year-old clerk and a 45-year-old attorney
// read as themselves. No image is fetched or generated; the same look and seed paint the same canvas.
//   paintSitter(look, { w = 512, h = 640, seed, ground = true }) -> HTMLCanvasElement
// with canvas.face = { x, y, r } (the face's centre and radius in canvas pixels) for whoever crops it to a small round.
// ground: false paints the figure alone on a transparent canvas, its silhouette feathered and the bust fading out below
// (for the holodeck projection, laid over the room).
//
// The look (every field optional; normaliseLook fills the gaps):
//   { sex: "male"|"female", age: years, build: "thin"|"spare"|"slight"|"average"|"stout",
//     face: { shape: "oval"|"long"|"round"|"square"|"heart", complexion: "pale"|"fair"|"ruddy"|"sallow"|"olive",
//             jaw: "soft"|"firm"|"narrow"|"heavy"|"square", eyes: "brown"|"dark brown"|"hazel"|"grey"|"blue"|"green",
//             nose: "straight"|"long"|"aquiline"|"short" },
//     hair: { colour: "black"|"dark brown"|"brown"|"mid brown"|"chestnut"|"auburn"|"fair"|"mouse"|"#rrggbb",
//             style: "own hair to shoulders"|"curled to the shoulders"|"cropped to the collar"|"close cap"|"ringlets"|"periwig",
//             grey: 0..1 },
//     beard: "none"|"moustache"|"moustache and tuft"|"stubble",
//     dress: { colour: a CLOTH name or "#rrggbb", fabric: "silk"|"satin"|"wool"|"broadcloth",
//              collar: "falling band"|"lace collar"|"lawyer's bands"|"lace tucker"|"none", jewels: ["pearl necklace", "pearl drops"] },
//     details: ["bound hand", "has not slept", ...]   (what cannot be seen head-and-shoulders, e.g. keys at the waist, is kept, not drawn),
//     expression: "composed"|"wary"|"weary"|"insolent"|"grieving",
//     pose: { turn: -0.6..0.6 (radians; + faces the viewer's right), tilt: radians } }
//
// Prior art, briefly. Procedural face generators in canvas/JS mostly go flat (DiceBear, Avataaars and the many random-
// avatar libraries: shapes in fixed slots, hard outlines) or go learned (GANs, which an offline, code-only painter cannot
// use). What makes a painted face believable is the draughtsman's tradition instead: the Loomis method (Andrew Loomis,
// "Drawing the Head and Hands", 1956: the cranium a ball with the face hung off it; brow, nose base and chin dividing
// the face in thirds; eyes on the half line, an eye's width apart; the features on a centre line that curves round the
// ball as the head turns) and the Asaro planes (the brow, cheekbone and bridge of the nose catch the light; the socket,
// the side of the nose and the underside of the jaw turn from it). And relighting a 2D shape from a height or normal
// field, as 2D game lighting does (Sprite Lamp, normal-mapped sprites): the form then shades and casts consistently from
// one light. Adopted: Loomis proportions and a turned centre line (features placed on a rotated ellipse, so the far eye
// foreshortens and the near cheek broadens); the flesh as a small height field (the ball plus Gaussian bumps and hollows
// for the planes), lit per cell with a wrapped Lambert term, shadows marched toward the light, coloured from a painter's
// flesh ramp (warm shadow, cool pearly halftone, warm light), enlarged smooth and cut by the vector outline; features,
// hair and cloth laid over as soft dabs and feathered strokes (wide faint passes under a narrow one), the way glazes
// build; age written in the planes (sockets, folds, jowl, grey strands), not caricature. Rejected: outlines, symmetric
// frontal faces, filter blurs (~20 ms each here; a shrink-and-enlarge does it for under 1), learned or fetched imagery.

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---- the vocabulary a look is written in ----
const SKIN = {   // light, mid, shadow, deep, cheek
  pale:   [[238, 218, 200], [212, 180, 158], [140, 104, 88], [64, 44, 36], [214, 128, 118]],
  fair:   [[242, 212, 184], [216, 172, 142], [138, 94, 72], [66, 42, 32], [216, 116, 100]],
  ruddy:  [[240, 204, 174], [214, 158, 124], [134, 82, 62], [64, 38, 28], [208, 96, 80]],
  sallow: [[230, 206, 172], [198, 164, 128], [122, 92, 66], [60, 44, 32], [190, 122, 98]],
  olive:  [[226, 194, 154], [190, 150, 112], [112, 80, 56], [54, 38, 26], [182, 104, 82]],
};
const HAIR = {
  black: [30, 24, 20], "dark brown": [56, 38, 26], brown: [92, 64, 42], "mid brown": [108, 78, 52], chestnut: [116, 62, 34],
  auburn: [138, 68, 38], fair: [176, 140, 94], mouse: [124, 100, 74], grey: [150, 146, 138], white: [214, 210, 200],
};
const EYES = { brown: [84, 54, 32], "dark brown": [56, 36, 22], hazel: [112, 88, 52], grey: [108, 116, 118], blue: [78, 104, 132], green: [92, 106, 74] };
const CLOTH = {
  black: [20, 18, 17], "good black": [16, 15, 15], "rusty black": [30, 27, 24], "dark grey": [52, 50, 48], brown: [72, 50, 34],
  russet: [112, 56, 32], tawny: [126, 82, 40], crimson: [120, 22, 28], scarlet: [150, 30, 26], "sad colour": [74, 64, 50],
  "deep blue": [28, 36, 64], "slate blue": [44, 52, 72], "dark green": [26, 44, 36], "dark plum": [52, 28, 44], "dark silk": [34, 36, 50],
  "old gold": [150, 112, 50], "dove grey": [120, 116, 112],
};
function colourOf(c, table, fallback) {
  if (Array.isArray(c)) return c;
  if (typeof c === "string") { if (table[c]) return table[c]; if (/^#[0-9a-f]{6}$/i.test(c)) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); }
  return fallback;
}

// the look, with every gap filled
export function normaliseLook(look = {}) {
  const L = JSON.parse(JSON.stringify(look || {}));
  L.sex = L.sex === "female" || L.sex === "f" ? "female" : "male";
  L.age = clamp(+L.age || 35, 14, 80);
  L.build = L.build || "average";
  L.face = { shape: "oval", complexion: "fair", jaw: L.sex === "female" ? "soft" : "firm", eyes: "brown", nose: "straight", ...(L.face || {}) };
  L.hair = { colour: "brown", style: L.sex === "female" ? "ringlets" : "own hair to shoulders", grey: L.age > 40 ? (L.age - 40) / 40 : 0, ...(L.hair || {}) };
  L.beard = L.beard || "none";
  L.dress = { colour: "black", fabric: "wool", collar: L.sex === "female" ? "lace tucker" : "falling band", ...(L.dress || {}) };
  L.details = L.details || [];
  L.expression = L.expression || "composed";
  L.pose = { turn: 0.3, tilt: 0, ...(L.pose || {}) };
  return L;
}

// ---- painting primitives: soft dabs and feathered strokes, the glazes everything is built from ----
function dab(g, x, y, rx, ry, c, a, rot = 0, core = 0) {
  if (a <= 0 || rx <= 0 || ry <= 0) return;
  if (rx < 4.5 && ry < 4.5) {   // too small for a gradient to show: a soft-edged spot is a plain one at lower strength
    g.fillStyle = css(c, a * (0.45 + core * 0.4)); g.beginPath(); g.ellipse(x, y, rx * 0.8, ry * 0.8, rot, 0, TAU); g.fill(); return;
  }
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, css(c, a)); if (core > 0) gr.addColorStop(core, css(c, a)); gr.addColorStop(1, css(c, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
}
function curve(g, pts, closed = false) {   // a smooth path through points (Catmull-Rom as Béziers)
  const n = pts.length; g.moveTo(pts[0][0], pts[0][1]);
  const P = (i) => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) g.closePath();
}
const FEATHER = [[2.6, 0.2], [1, 0.6]];
function feather(g, pts, c, a, wd) {      // a soft line: wide faint passes under a narrow one
  g.lineCap = "round"; g.lineJoin = "round";
  for (const [k, f] of FEATHER) { g.lineWidth = wd * k; g.strokeStyle = css(c, a * f); g.beginPath(); curve(g, pts); g.stroke(); }
}
function fillPath(g, pts, style, closed = true) { g.fillStyle = style; g.beginPath(); curve(g, pts, closed); g.fill(); }

const grounds = new Map();
function groundFor(w, h, S, ox, oy, ground) {
  const key = `${w}x${h}`; if (grounds.has(key)) return grounds.get(key);
  const c = document.createElement("canvas"); c.width = w; c.height = h; const out = c.getContext("2d"), rg = rng(1660);
  out.fillStyle = css(ground); out.fillRect(0, 0, w, h);
  out.save(); out.translate(ox, oy); out.scale(S, S);
  { const gr = out.createLinearGradient(0, 0, 512, 640); gr.addColorStop(0, css(mix(ground, [8, 6, 4], 0.5))); gr.addColorStop(1, css(mix(ground, [10, 8, 6], 0.3))); out.fillStyle = gr; out.fillRect(-20, -20, 552, 680); }
  dab(out, 330, 230, 230, 260, [110, 92, 62], 0.32);
  dab(out, 360, 180, 120, 160, [120, 100, 70], 0.12);
  for (let i = 0; i < 24; i++) { const x = rg() * 512, y = rg() * 640; dab(out, x, y, 40 + rg() * 60, 8 + rg() * 10, rg() < 0.5 ? [70, 58, 40] : [12, 10, 8], 0.06, rg() * 0.6 - 0.3 + 0.7); }
  out.restore();
  const v = out.createRadialGradient(w / 2, h * 0.44, w * 0.27, w / 2, h / 2, w * 0.82); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(6,4,2,0.6)"); out.fillStyle = v; out.fillRect(0, 0, w, h);
  grounds.set(key, c); return c;
}

// ---- the painting ----
export function paintSitter(look, { w = 512, h = 640, seed, canvas, ground: withGround = true } = {}) {
  const L = normaliseLook(look);
  const sd = (seed ?? hashStr(JSON.stringify(look || {}))) >>> 0, r = rng(sd);
  const cv = canvas || document.createElement("canvas"); cv.width = w; cv.height = h;
  const out = cv.getContext("2d");
  // the figure is painted on a layer of its own, then laid on the ground (or, with ground: false, on nothing)
  const layer = document.createElement("canvas"); layer.width = w; layer.height = h; let g = layer.getContext("2d");
  const female = L.sex === "female", age = L.age, old = smooth(30, 60, age), young = 1 - smooth(20, 34, age);
  const thin = { thin: 1, spare: 0.7, slight: 0.6, average: 0, stout: -0.8, heavy: -1 }[L.build] ?? 0;

  // the design space is 512 x 640; scale it to fit, centred
  const S = Math.min(w / 512, h / 640), ox = (w - 512 * S) / 2, oy = (h - 640 * S) / 2;
  // the ground: dark warm earth, lighter behind the face's shadowed side (counterchange); the same for every
  // sitter, so painted once per size and kept
  const ground = [35, 31, 22];
  if (withGround) out.drawImage(groundFor(w, h, S, ox, oy, ground), 0, 0);
  g.save(); g.translate(ox, oy); g.scale(S, S);

  // the head: Loomis proportions on a ball, turned by phi
  const phi = clamp(L.pose.turn, -0.6, 0.6), sphi = Math.sin(phi);
  const shape = L.face.shape;
  let H = female ? 188 : 206, W = H * (female ? 0.76 : 0.71);
  if (shape === "long") { H *= 1.05; W *= 0.9; } else if (shape === "round") { W *= 1.07; H *= 0.98; } else if (shape === "square") W *= 1.03; else if (shape === "heart") W *= 1.0;
  W *= 1 - thin * 0.04;
  const R = W / 2, cx = 256 - sphi * 18, top = 112, tilt = L.pose.tilt || 0;
  const jaw = ({ soft: 0.8, firm: 0.88, narrow: 0.8, heavy: 0.95, square: 0.93 }[L.face.jaw] ?? 0.84) - (female ? 0.08 : 0) + (shape === "square" ? 0.04 : 0) - (shape === "heart" ? 0.08 : 0) - thin * 0.02 + old * 0.03;
  const chin = ({ soft: 0.36, firm: 0.4, narrow: 0.32, heavy: 0.44, square: 0.46 }[L.face.jaw] ?? 0.36) * (female ? 0.85 : 1);
  const hollow = Math.max(0, thin) * 0.05 + old * 0.02;
  const knots = [[0, 0.02], [0.05, 0.5], [0.12, 0.76], [0.22, 0.9], [0.34, 0.97], [0.46, 0.985], [0.56, 1.0 - young * 0.0], [0.66, 0.96 - hollow + young * 0.02], [0.76, lerp(0.96, jaw, 0.5) + young * 0.03], [0.85, jaw * 0.97], [0.92, lerp(jaw, chin, 0.45)], [0.975, chin * 0.95], [1.0, 0.0]];
  if (female) knots.splice(6, 7, [0.56, 1.0], [0.66, 0.97], [0.76, 0.9], [0.85, 0.78], [0.92, 0.6], [0.97, 0.38], [1.0, 0.0]);
  const hw = (v) => { for (let i = 1; i < knots.length; i++) if (v <= knots[i][0]) { const [v0, a] = knots[i - 1], [v1, b] = knots[i]; const t = (v - v0) / (v1 - v0); return R * lerp(a, b, t * t * (3 - 2 * t)); } return 0; };
  const mid = (v) => R * sphi * (v < 0.5 ? 0.92 : v < 0.78 ? lerp(0.92, 1.0, (v - 0.5) / 0.28) : lerp(1.0, 0.82, (v - 0.78) / 0.22));
  const sh = (v) => smooth(0.45, 1, v) * 0.8 * R * sphi;
  const Y = (v) => top + v * H;
  const X = (u, v, d = 0) => { const hv = Math.min(hw(v), R); return cx + mid(v) + hv * (Math.sin(Math.asin(clamp(u, -1, 1)) + phi) - sphi) + d * sphi; };
  const fore = (u) => Math.cos(Math.asin(clamp(u, -1, 1)) + phi) / Math.cos(Math.asin(clamp(u, -1, 1)));  // foreshortening at u
  const outline = []; for (let v = 0.0; v <= 1.0001; v += 0.05) outline.push([cx - hw(v) + sh(v), Y(v)]);
  const right = []; for (let v = 1.0; v >= -0.0001; v -= 0.05) right.push([cx + hw(v) + sh(v), Y(v)]);
  const face = [...outline.slice(1), ...right.slice(1, -1)];
  const facePath = () => { g.beginPath(); curve(g, face, true); };
  cv.face = { x: ox + (cx + mid(0.6)) * S, y: oy + Y(0.55) * S, r: H * 0.62 * S };

  // skin
  const sk = SKIN[L.face.complexion] || SKIN.fair;
  let [sL, sM, sS, sD, sC] = sk;
  if (old > 0) { sM = mix(sM, [190, 156, 128], old * 0.3); sL = mix(sL, [228, 204, 176], old * 0.3); }
  if (L.details.includes("has not slept") || L.expression === "weary") { sM = mix(sM, [200, 182, 170], 0.25); sC = mix(sC, sM, 0.4); }
  const hairC0 = colourOf(L.hair.colour, HAIR, HAIR.brown), grey = clamp(L.hair.grey, 0, 1);
  const hairC = mix(hairC0, [150, 146, 138], grey * 0.55);
  const hairDark = mix(hairC, [10, 8, 6], 0.55), hairLight = mix(hairC, [236, 214, 178], 0.38 + grey * 0.2);
  const cloth = colourOf(L.dress.colour, CLOTH, CLOTH.black), silk = L.dress.fabric === "silk" || L.dress.fabric === "satin";

  // expression settings
  const ex = L.expression;
  const open = { composed: 0.9, wary: 0.96, weary: 0.74, insolent: 0.72, grieving: 0.8 }[ex] ?? 0.9;
  const browRaise = { composed: 0, wary: 0.012, weary: 0.006, insolent: 0, grieving: 0.01 }[ex] ?? 0;
  const browKnit = { composed: 0, wary: 0.6, weary: 0.5, insolent: 0, grieving: 0.8 }[ex] ?? 0;
  const smirk = ex === "insolent" ? 1 : 0, droop = ex === "weary" ? 1 : ex === "grieving" ? 0.7 : 0;
  const gaze = ({ wary: -0.12, insolent: 0.0 }[ex] ?? 0) - phi * 0.25;

  // ---- the body ----
  const nbY = Y(1) + H * (female ? 0.17 : 0.1), ncx = cx + sh(1) * 0.45;    // the base of the neck
  const shW = W * (female ? 0.98 : 1.12) * (1 - thin * 0.07);
  const body = [[ncx - shW * 1.5, 700], [ncx - shW * 1.42, nbY + H * 0.75], [ncx - shW * 1.3, nbY + H * 0.4], [ncx - shW * 1.08, nbY + H * 0.2], [ncx - shW * 0.7, nbY + H * 0.08], [ncx - W * 0.25, nbY], [ncx + W * 0.25, nbY], [ncx + shW * 0.7, nbY + H * 0.09], [ncx + shW * 1.08, nbY + H * 0.22], [ncx + shW * 1.3, nbY + H * 0.42], [ncx + shW * 1.42, nbY + H * 0.78], [ncx + shW * 1.5, 700]];
  const bodyPath = () => { g.beginPath(); curve(g, body, false); g.lineTo(ncx + shW * 2, 720); g.lineTo(ncx - shW * 2, 720); g.closePath(); };
  // hair behind the shoulders (long hair, the back of a periwig)
  const hairStyle = L.hair.style;

  const drawBody = () => {
    g.save(); bodyPath(); g.fillStyle = css(cloth); g.fill(); g.clip();
    const hi = mix(cloth, [255, 246, 230], silk ? 0.45 : 0.18), lo = mix(cloth, [0, 0, 0], 0.6);
    // the round of the shoulders and breast under the light from the upper left; the far side falls away
    dab(g, ncx - shW * 0.95, nbY + H * 0.3, shW * 0.6, H * 0.35, hi, silk ? 0.55 : 0.5);
    dab(g, ncx - shW * 0.3, nbY + H * 0.8, shW * 0.7, H * 0.5, hi, silk ? 0.3 : 0.25);
    { const gr = g.createLinearGradient(ncx + shW * 0.1, 0, ncx + shW * 1.5, 0); gr.addColorStop(0, css([0, 0, 0], 0)); gr.addColorStop(1, css([0, 0, 0], 0.6)); g.fillStyle = gr; g.fillRect(ncx, nbY - 10, shW * 2, 400); }
    // the arm's edge against the body, and broad soft folds
    for (const s2 of [-1, 1]) feather(g, [[ncx + s2 * shW * 1.05, nbY + H * 0.45], [ncx + s2 * shW * 1.0, nbY + H * 0.9], [ncx + s2 * shW * 0.98, 680]], lo, 0.5, 10);
    for (let i = 0; i < 3; i++) {
      const s2 = i === 1 ? 1 : -1, x0 = ncx + s2 * shW * (0.3 + r() * 0.5), y0 = nbY + H * (0.5 + r() * 0.3);
      const pts = [[x0, y0], [x0 + s2 * (6 + r() * 10), y0 + 60], [x0 + s2 * (10 + r() * 20), 690]];
      feather(g, pts, lo, 0.35, 12 + r() * 8);
      feather(g, pts.map(([x, y]) => [x - 12, y]), hi, (silk ? 0.5 : 0.3) * (s2 < 0 ? 1 : 0.4), silk ? 3.5 : 9);
    }
    if (silk) { dab(g, ncx - shW * 1.05, nbY + H * 0.32, shW * 0.16, H * 0.05, mix(cloth, [255, 250, 240], 0.7), 0.6, -0.7); dab(g, ncx - shW * 0.55, nbY + H * 0.95, shW * 0.06, H * 0.3, mix(cloth, [255, 250, 240], 0.6), 0.4, 0.15); }
    // what the dress says: a lawyer's gown and its facings; a doublet's buttons; a woman's sleeves and stomacher
    if (L.dress.collar === "lawyer's bands") for (const s2 of [-1, 1]) {
      const fx = ncx + s2 * W * 0.3;
      g.fillStyle = css(mix(cloth, [255, 255, 255], 0.06)); g.beginPath(); g.moveTo(fx, nbY + H * 0.05); g.lineTo(fx + s2 * W * 0.18, nbY + H * 0.1); g.lineTo(fx + s2 * W * 0.24, 700); g.lineTo(fx + s2 * W * 0.04, 700); g.closePath(); g.fill();
      feather(g, [[fx, nbY + H * 0.05], [fx + s2 * W * 0.02, 700]], lo, 0.6, 3);
      feather(g, [[fx + s2 * W * 0.2, nbY + H * 0.12], [fx + s2 * W * 0.25, 700]], s2 < 0 ? hi : lo, 0.45, 4);
    }
    if (!female && L.dress.collar !== "lawyer's bands") for (let k = 0; k < 4; k++) { const by = nbY + H * (0.55 + k * 0.17); dab(g, ncx + 1, by, 3.4, 3.4, mix(cloth, [0, 0, 0], 0.5), 0.8); dab(g, ncx, by - 1, 2.6, 2.6, mix(cloth, [255, 240, 210], 0.35), 0.7); }
    if (female) {
      // the stomacher: a long point down the breast, and full sleeves catching the light
      g.fillStyle = css(mix(cloth, [0, 0, 0], 0.15)); g.beginPath(); g.moveTo(ncx - W * 0.42, nbY + H * 0.48); g.quadraticCurveTo(ncx - W * 0.2, nbY + H * 1.2, ncx, 700); g.quadraticCurveTo(ncx + W * 0.2, nbY + H * 1.2, ncx + W * 0.42, nbY + H * 0.48); g.closePath(); g.fill();
      for (const s2 of [-1, 1]) feather(g, [[ncx + s2 * W * 0.42, nbY + H * 0.5], [ncx + s2 * W * 0.22, nbY + H * 1.1], [ncx + s2 * W * 0.05, 700]], s2 < 0 ? hi : lo, 0.5, 2.5);
      for (const s2 of [-1, 1]) { const sx2 = ncx + s2 * shW * 1.18, sy2 = nbY + H * 0.7; dab(g, sx2, sy2, shW * 0.24, H * 0.42, s2 < 0 ? hi : lo, s2 < 0 ? 0.5 : 0.4); feather(g, [[sx2 - shW * 0.18, sy2 - H * 0.3], [sx2 - shW * 0.2, sy2 + H * 0.1], [sx2 - shW * 0.12, sy2 + H * 0.5]], lo, 0.55, 5); }
    }
    g.restore();
  };

  const neckW = W * (female ? 0.36 : 0.42) * (1 - thin * 0.1);
  const nx = cx + sh(1) * 0.5;
  const tired = L.details.includes("has not slept") || ex === "weary" ? 1 : 0;
  // the nose, shared by the modelling and the features
  const nl = { straight: 1, long: 1.08, aquiline: 1.05, short: 0.93 }[L.face.nose] ?? 1;
  const vB = 0.66 + (nl - 1) * 0.12 - (smirk ? 0.008 : 0), yB = Y(vB);
  const tipX = X(0, vB) + R * (0.42 + (nl - 1)) * sphi * 0.6, nwid = R * (0.25 + (female ? -0.02 : 0.02) + old * 0.02);

  // ---- the flesh, modelled: a height field lit from the upper left ----
  // The head is Loomis's ball (an ellipsoid fitted to the face's outline, row by row), with the planes of the face
  // laid on it as soft bumps and hollows (brow, sockets, eyeballs, the nose's ridge, tip and wings, cheekbones, the
  // muzzle, lips, chin, the folds of age); the neck a cylinder behind it, and a woman's breast and shoulders a low
  // dome. Each cell is lit (wrapped Lambert), tested for the shadow its neighbours cast toward the light (the nose's
  // shadow, the brow's, the jaw's on the neck), and coloured from a painter's flesh ramp: warm deep shadow, a cool
  // pearly halftone, warm light. Computed at half size and enlarged smooth, as soft as a glaze.
  const vn = new Float32Array(64 * 64).map(() => r());
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = (xi & 63) + ((yi & 63) << 6), b = ((xi + 1) & 63) + ((yi & 63) << 6), c = (xi & 63) + (((yi + 1) & 63) << 6), d = ((xi + 1) & 63) + (((yi + 1) & 63) << 6); const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(vn[a], vn[b], sx), lerp(vn[c], vn[d], sx), sy); };
  const modelSkin = () => {
    const step = 2.4 / S;   // design px per cell (~2.4 canvas px)
    const x0 = Math.min(cx - R * 1.3, nx - (female ? shW * 1.15 : neckW)) , x1 = Math.max(cx + R * 1.3, nx + (female ? shW * 1.15 : neckW)) + Math.abs(sh(1));
    const y0 = top - 2, y1 = female ? nbY + H * 0.62 : nbY + H * 0.25;
    const gw = Math.ceil((x1 - x0) / step) + 1, gh = Math.ceil((y1 - y0) / step) + 1;
    const hz = new Float32Array(gw * gh), nz = new Float32Array(gw * gh), ha = new Float32Array(gw * gh), na = new Float32Array(gw * gh);
    // the bumps: [x, y, sx, sy, height]
    const B = [], add = (x, y, sx, sy, a) => { if (a) B.push([x, y, sx, sy, a]); };
    for (const u of [-0.7, -0.45, -0.2, 0, 0.2, 0.45, 0.7]) add(X(u, 0.44), Y(0.435), R * 0.17, H * 0.03, R * (female ? 0.05 : 0.09) * (1 - 0.35 * Math.abs(u)) * (1 + old * 0.3));
    for (const s2 of [-1, 1]) {
      const f = fore(s2 * 0.4);
      add(X(s2 * 0.4, 0.5), Y(0.497), R * 0.24 * f, H * 0.055, -R * (0.2 + old * 0.05 + thin * 0.02 + tired * 0.02));     // the socket
      add(X(s2 * 0.4, 0.5), Y(0.505), R * 0.15 * f, H * 0.03, R * 0.13);                                                  // the eyeball under its lids
      add(X(s2 * 0.42, 0.56), Y(0.556), R * 0.16 * f, H * 0.012, R * 0.03 * (old + tired));                              // bags
      add(cx + s2 * R * 0.86 + sh(0.36), Y(0.36), R * 0.18, H * 0.08, -R * 0.07);                                        // temples
      add(X(s2 * 0.56, 0.6), Y(0.6), R * 0.22, H * 0.075, R * (0.09 + Math.max(0, thin) * 0.03));                        // cheekbones
      add(X(s2 * 0.45, 0.7), Y(0.7), R * 0.22, H * 0.08, R * 0.07 * (young + (female ? 0.6 : 0) + 0.3));                // the round of the cheek
      add(X(s2 * 0.66, 0.76), Y(0.76), R * 0.15, H * 0.07, -R * (Math.max(0, thin) * 0.08 + old * 0.06));               // hollows
      add(tipX + s2 * nwid * 0.78, Y(vB - 0.012), R * 0.085, H * 0.028, R * 0.14);                                        // the nose's wings
      // the fold from the nose to the mouth: a ridge of cheek outside it, a crease along it
      const fa = [tipX + s2 * nwid * 1.15, Y(vB - 0.015)], fc = [X(s2 * 0.44, 0.79), Y(0.8 + old * 0.03)];
      const fold = 0.025 + old * 0.07 + Math.max(0, thin) * 0.02 + (smirk && s2 > 0 ? 0.04 : 0);
      for (const t of [0.15, 0.5, 0.85]) { const px = lerp(fa[0], fc[0], t), py = lerp(fa[1], fc[1], t); add(px + s2 * R * 0.09, py, R * 0.07, H * 0.04, R * fold); add(px, py, R * 0.035, H * 0.035, -R * fold * 0.35); }
      add(X(s2 * 0.6, 0.9), Y(0.9), R * 0.16, H * 0.05, R * 0.05 * old);                                                // the jowl
    }
    add(X(0, 0.455), Y(0.455), R * 0.12, H * 0.03, R * 0.04);                                                             // between the brows
    for (let k = 0; k <= 6; k++) { const t = k / 6, v = lerp(0.47, vB - 0.03, t); add(X(0, v) + R * lerp(0.05, 0.36, t) * nl * sphi * 0.6, Y(v), R * (0.07 + t * 0.02), H * 0.04, R * lerp(0.08, female ? 0.22 : 0.28, t) * nl); }   // the bridge
    if (L.face.nose === "aquiline") add(X(0, 0.55) + R * 0.12 * sphi, Y(0.55), R * 0.06, H * 0.03, R * 0.05);
    add(tipX, Y(vB - 0.025), R * 0.1, H * 0.033, R * 0.13);                                                              // the tip
    add(X(0, 0.78), Y(0.78), R * 0.4, H * 0.085, R * 0.15);                                                              // the muzzle
    add(X(0, 0.735), Y(0.735), R * 0.06, H * 0.02, -R * 0.02);                                                           // the philtrum
    add(X(0, 0.764), Y(0.763), R * 0.24, H * 0.013, R * 0.035 * (female ? 1.3 : 1));                                     // upper lip
    add(X(0, 0.797), Y(0.798), R * 0.2, H * 0.017, R * 0.055 * (female ? 1.4 : 1) * (1 - old * 0.3));                    // lower lip
    add(X(0, 0.778), Y(0.777), R * 0.28, H * 0.009, -R * 0.03);                                                           // the parting of the lips
    add(X(0, 0.845), Y(0.845), R * 0.2, H * 0.02, -R * 0.045);                                                           // under the lip
    add(X(0, 0.93), Y(0.925), R * 0.2, H * 0.045, R * 0.1);                                                              // the chin
    if (!female) add(nx - neckW * 0.05, Y(1) + H * 0.17, R * 0.07, H * 0.04, R * 0.06 * (1 - young * 0.4));             // the Adam's apple
    const Lx = -0.48, Ly = -0.6, Lz = 0.64, wrap = female ? 0.45 : 0.34;    // toward the window: left, above, in front
    const tan = Lz / Math.hypot(Lx, Ly), ux = Lx / Math.hypot(Lx, Ly), uy = Ly / Math.hypot(Lx, Ly);
    for (let j = 0; j < gh; j++) {
      const y = y0 + j * step, v = (y - top) / H;
      const act = B.filter((e) => Math.abs(y - e[1]) < 3 * e[3]), actN = act.filter((e) => e[1] >= Y(1));
      const hwv = v >= 0.005 && v <= 1.04 ? Math.max(hw(Math.min(v, 0.99)), R * 0.2) : 0, hc = cx + sh(clamp(v, 0, 1));
      const vert = Math.sqrt(Math.max(0.04, 1 - ((v - 0.47) / 0.62) ** 2));
      // the neck: its half width, and a woman's shoulders spreading from it
      let nhw = neckW * 0.5; if (female) nhw = lerp(nhw, shW * 1.05, smooth(nbY - H * 0.06, nbY + H * 0.3, y));
      const nTop = Y(0.62);
      for (let i = 0; i < gw; i++) {
        const x = x0 + i * step, k = j * gw + i;
        if (hwv > 0) {
          // (the field runs a little past the outline; the outline itself is cut by the vector path, sharp and smooth)
          const dx = (x - hc) / hwv, q0 = 1 - dx * dx, q = Math.max(q0, 0.0004);
          if (q0 > -0.14) {
            let z = R * Math.sqrt(q) * vert + R * 0.5;
            for (let b = 0; b < act.length; b++) { const e = act[b], ex2 = (x - e[0]) / e[2]; if (ex2 > 3 || ex2 < -3) continue; const ey2 = (y - e[1]) / e[3]; z += e[4] * Math.exp(-0.5 * (ex2 * ex2 + ey2 * ey2)); }
            hz[k] = z; ha[k] = 1;
          }
        }
        if (y > nTop) {
          const dx = (x - nx) / nhw;
          if (Math.abs(dx) < 1.18) {
            let z = (female && y > nbY - H * 0.06 ? R * 0.42 : nhw * 0.8) * Math.sqrt(Math.max(0.0004, 1 - dx * dx));
            if (female) { const ky = (x - nx) / (shW * 1.05), yN = nbY + H * 0.34 + H * 0.12 * (1 - ky * ky); if (y > yN + 8) z = -1; }
            if (z >= 0) {
              for (let b = 0; b < actN.length; b++) { const e = actN[b], ex2 = (x - e[0]) / e[2], ey2 = (y - e[1]) / e[3]; const d2 = ex2 * ex2 + ey2 * ey2; if (d2 < 9) z += e[4] * Math.exp(-0.5 * d2); }
              if (female) { for (const s2 of [-1, 1]) { const cxb = nx + s2 * shW * 0.38, cyb = nbY + H * 0.17 + Math.abs(x - nx) * 0.08; const d = (y - cyb) / (H * 0.022); const along = smooth(neckW * 0.3, neckW * 0.6, s2 * (x - nx)) * smooth(shW * 0.8, shW * 0.5, s2 * (x - nx)); z += R * 0.02 * along * Math.exp(-0.5 * d * d); } const dn = Math.hypot((x - nx) / (R * 0.12), (y - nbY - H * 0.1) / (H * 0.03)); z -= R * 0.04 * Math.exp(-0.5 * dn * dn); }
              nz[k] = z; na[k] = 1;
            }
          }
        }
      }
    }
    const zc = (i, j) => { const k = j * gw + i; return ha[k] > 0.01 ? hz[k] : na[k] > 0.01 ? nz[k] : 0; };
    const zAt = (fi, fj) => { fi = clamp(fi, 0, gw - 1.001); fj = clamp(fj, 0, gh - 1.001); const i = fi | 0, j = fj | 0, a = fi - i, b = fj - j; return lerp(lerp(zc(i, j), zc(i + 1, j), a), lerp(zc(i, j + 1), zc(i + 1, j + 1), a), b); };
    const ramp = [[0, sD], [0.24, mix(sS, sD, 0.35)], [0.42, mix(mix(sS, sM, 0.5), [150, 140, 136], 0.22)], [0.6, sM], [0.8, mix(sM, sL, 0.7)], [0.95, sL], [1.1, mix(sL, [255, 246, 236], 0.45)]];
    const shade = (t) => { for (let i = 1; i < ramp.length; i++) if (t <= ramp[i][0]) { const [a0, c0] = ramp[i - 1], [a1, c1] = ramp[i]; return mix(c0, c1, (t - a0) / (a1 - a0)); } return ramp[ramp.length - 1][1]; };
    // colour in the skin: flushed cheeks, nose and lips; a man's shaven jaw; a sleepless woman's eyes
    const tints = [];
    const flush = 0.18 + young * 0.06 + (female ? 0.05 : 0) + (L.face.complexion === "ruddy" ? 0.06 : 0) - tired * 0.1;
    for (const s2 of [-1, 1]) tints.push([X(s2 * 0.5, 0.67), Y(0.67), R * 0.26, H * 0.08, sC, flush]);
    tints.push([tipX, Y(vB - 0.02), R * 0.12, H * 0.03, sC, flush * 0.7]);
    tints.push([X(0, 0.785), Y(0.785), R * 0.26, H * 0.03, mix(sC, [160, 60, 60], 0.3), (female ? 0.55 : 0.32) - old * 0.12]);
    if (!female && age > 18) { const a = (L.beard === "stubble" ? 0.3 : 0.14) * (1 - young * 0.55); for (const [u, v, sx, sy] of [[0, 0.73, 0.3, 0.025], [0, 0.92, 0.45, 0.06], [-0.7, 0.84, 0.18, 0.08], [0.7, 0.84, 0.18, 0.08]]) tints.push([X(u, v), Y(v), R * sx, H * sy, [96, 100, 112], a]); }
    if (tired) for (const s2 of [-1, 1]) tints.push([X(s2 * 0.4, 0.552), Y(0.553), R * 0.13, H * 0.012, [120, 92, 100], 0.18]);
    const headImg = new ImageData(gw, gh), neckImg = new ImageData(gw, gh);
    const hx2 = Lx + 0, hy2 = Ly, hzv = Lz + 1, hn = Math.hypot(hx2, hy2, hzv);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      for (const head of [true, false]) {
      const k = j * gw + i; if ((head ? ha : na)[k] <= 0.003) continue; const neck = !head;
      const Z = head ? hz : nz, A = head ? ha : na;
      const own = (ii, jj) => { ii = clamp(ii, 0, gw - 1); jj = clamp(jj, 0, gh - 1); const kk = jj * gw + ii; return A[kk] > 0.003 ? Z[kk] : Z[k]; };
      const gx = (own(i + 1, j) - own(i - 1, j)) / (2 * step), gy = (own(i, j + 1) - own(i, j - 1)) / (2 * step);
      const nn = Math.hypot(gx, gy, 1), nx2 = -gx / nn, ny2 = -gy / nn, nz2 = 1 / nn;
      const ndl = nx2 * Lx + ny2 * Ly + nz2 * Lz;
      // the shadow cast toward this cell: march toward the light over the field
      let shadow = 0; const z0 = Z[k];
      if (head || y0 + j * step < Y(1) + H * 0.45) for (let st = 1; st <= 10; st++) { const d = st * 1.3, zt = zAt(i + ux * d, j + uy * d), over = zt - (z0 + d * step * tan); if (over > 0) shadow = Math.max(shadow, Math.min(1, over / (R * (0.05 + 0.012 * d)))); }
      let t = (ndl + wrap) / (1 + wrap); t = t * (1 - 0.68 * shadow) + 0.035 * (vnoise(i * step / 7, j * step / 7) - 0.5) + 0.02 * (vnoise(i * step / 2.5 + 40, j * step / 2.5) - 0.5);
      t = t * 0.98 + 0.06 + (neck ? -0.06 : 0);
      if (head) { const vv = (y0 + j * step - top) / H; t *= 1 - 0.35 * smooth(0.94, 1.0, vv); }
      let c = shade(t);
      const spec = Math.pow(Math.max(0, (nx2 * hx2 + ny2 * hy2 + nz2 * hzv) / hn), 26) * (1 - shadow) * 0.28;
      if (spec > 0.01) c = mix(c, [255, 248, 236], spec);
      const x = x0 + i * step, y = y0 + j * step;
      if (head) for (let q = 0; q < tints.length; q++) { const tn = tints[q], ex2 = (x - tn[0]) / tn[2]; if (ex2 > 3 || ex2 < -3) continue; const ey2 = (y - tn[1]) / tn[3], d2 = ex2 * ex2 + ey2 * ey2; if (d2 < 9) { const m2 = tn[5] * Math.exp(-0.5 * d2), tc = tn[4], kk = 0.35 * (1 - t); c = [lerp(c[0], lerp(tc[0], c[0], kk), m2), lerp(c[1], lerp(tc[1], c[1], kk), m2), lerp(c[2], lerp(tc[2], c[2], kk), m2)]; } }
      const im = head ? headImg : neckImg, o = k * 4; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255 * Math.min(1, A[k]);
    } }
    const toCanvas = (im) => { const c = document.createElement("canvas"); c.width = gw; c.height = gh; c.getContext("2d").putImageData(im, 0, 0); return c; };
    return { head: toCanvas(headImg), neck: toCanvas(neckImg), x0, y0, w: (gw - 1) * step + step, h: (gh - 1) * step + step, step };
  };
  let skin = null;
  const drawNeck = () => {
    skin = modelSkin();
    const top0 = Y(0.66), bot = nbY + H * (female ? 0.56 : 0.2);
    const neck = female
      ? [[nx - neckW * 0.5, top0], [nx - neckW * 0.52, nbY - 6], [nx - shW * 0.8, nbY + H * 0.12], [nx - shW * 1.05, nbY + H * 0.3], [nx - shW * 0.95, bot], [nx + shW * 0.95, bot], [nx + shW * 1.05, nbY + H * 0.3], [nx + shW * 0.8, nbY + H * 0.12], [nx + neckW * 0.52, nbY - 6], [nx + neckW * 0.5, top0]]
      : [[nx - neckW * 0.5, top0], [nx - neckW * 0.53, bot], [nx + neckW * 0.53, bot], [nx + neckW * 0.5, top0]];
    g.save(); g.beginPath(); curve(g, neck, true); g.clip();
    g.imageSmoothingQuality = "high"; g.drawImage(skin.neck, skin.x0 - skin.step / 2, skin.y0 - skin.step / 2, skin.w, skin.h); g.restore();
    if (!female && (old > 0.3 || thin > 0.5)) feather(g, [[nx - neckW * 0.14, Y(1.04)], [nx - neckW * 0.08, nbY - 4]], sS, 0.18 * Math.max(old, thin * 0.6), 4);   // the cord of the throat
  };

  // ---- collars and bands ----
  const linenL = [244, 240, 228], linenS = [150, 152, 150], linenD = [96, 98, 100];
  const linen = (pts, x0, x1) => {
    g.save(); g.beginPath(); curve(g, pts, true); g.fillStyle = css(mix(linenL, linenS, 0.25)); g.fill(); g.clip();
    const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, css(linenL, 0.9)); gr.addColorStop(0.5, css(linenL, 0.2)); gr.addColorStop(1, css(linenS, 0.9)); g.fillStyle = gr; g.fillRect(x0 - 50, 0, x1 - x0 + 100, 700);
    g.restore();
  };
  const drawCollar = () => {
    const c = L.dress.collar, nx = ncx;
    if (c === "falling band" || c === "lace collar") {
      const wide = c === "lace collar" ? 1.25 : 1.0, depth = c === "lace collar" ? 0.5 : 0.42;
      const cw = W * 0.62 * wide, y0 = nbY - H * 0.07, y1 = nbY + H * depth;
      const half = (s) => [[nx + s * 2, y0 + 4], [nx + s * neckW * 0.62, y0 - 2], [nx + s * cw * 0.85, y0 + H * 0.08], [nx + s * cw, y1 - H * 0.06], [nx + s * cw * 0.98, y1], [nx + s * cw * 0.5, y1 + 3], [nx + s * 3, y1 - 2]];
      for (const s of [-1, 1]) {
        const p = half(s); linen(p, nx - cw, nx + cw);
        g.save(); g.beginPath(); curve(g, p, true); g.clip();
        for (let i = 0; i < 4; i++) { const x = nx + s * cw * (0.25 + i * 0.2); feather(g, [[x, y0 + 10], [x + s * 6, y1]], linenS, 0.25, 4); }   // soft pleats
        dab(g, nx + s * neckW * 0.4, y0 + 6, neckW * 0.45, 10, linenD, 0.5);      // the shadow under the chin
        if (c === "lace collar") {   // a deep lace border, the coat dark through its holes
          const ly = y1 - H * 0.12;
          g.fillStyle = css(mix(linenL, linenS, 0.4), 0.9);
          for (let x = nx + s * 4; Math.abs(x - nx) < cw; x += s * 7) for (let y = ly; y < y1 + 4; y += 7) { const k = ((x * 0.13 + y * 0.29) % 1 + 1) % 1; dab(g, x + 3.5 * s, y + 3, 2.6, 2.6, mix(cloth, [0, 0, 0], 0.3), 0.5 + 0.35 * k); }
          feather(g, [[nx + s * 4, ly], [nx + s * cw * 0.98, ly - 2]], linenS, 0.4, 2);
        }
        g.restore();
        if (c === "lace collar") for (let x = 6; x < cw; x += 9) dab(g, nx + s * x, y1 + 1, 4.5, 4, linenL, 0.7);     // the scalloped edge
      }
      // band strings with their tassels
      for (const s of [-1, 1]) { feather(g, [[nx + s * 2, y1 - 6], [nx + s * 5, y1 + 18]], linenL, 0.6, 1.5); dab(g, nx + s * 5, y1 + 22, 3, 6, linenL, 0.8); }
    } else if (c === "lawyer's bands" || c === "bands") {
      // a plain neckband and two white tabs falling from the throat
      const y0 = nbY - H * 0.06, y1 = nbY + H * 0.4;
      linen([[nx - neckW * 0.6, y0 - 2], [nx, y0 + 6], [nx + neckW * 0.6, y0 - 2], [nx + neckW * 0.62, y0 + 10], [nx, y0 + 16], [nx - neckW * 0.62, y0 + 10]], nx - neckW, nx + neckW);
      for (const s of [-1, 1]) {
        const p = [[nx + s * 1, y0 + 8], [nx + s * W * 0.15, y0 + 10], [nx + s * W * 0.18, y1], [nx + s * W * 0.02, y1 + 2]];
        g.save(); g.beginPath(); g.moveTo(...p[0]); for (const q of p.slice(1)) g.lineTo(...q); g.closePath(); g.fillStyle = css(s < 0 ? mix(linenL, linenS, 0.15) : mix(linenL, linenS, 0.5)); g.fill(); g.clip();
        feather(g, [[nx + s * W * 0.08, y0 + 14], [nx + s * W * 0.1, y1]], linenS, 0.35, 3);
        dab(g, nx, y0 + 10, W * 0.2, 14, linenD, 0.45);
        g.restore();
      }
    } else if (c === "lace tucker") {
      // a low neckline edged with a band of linen and lace
      const yN = nbY + H * 0.34;
      const edge = []; for (let k = -1; k <= 1.0001; k += 0.1) edge.push([nx + k * shW * 1.05, yN + H * 0.12 * (1 - k * k) - H * 0.08 * (Math.abs(k) > 0.85 ? (Math.abs(k) - 0.85) * 6 : 0)]);
      g.save();
      for (let i = 0; i < edge.length; i++) { const [x, y] = edge[i]; dab(g, x, y, 11, 6, mix(linenL, linenS, x > nx ? 0.5 : 0.1), 0.85, 0, 0.5); }
      for (let i = 0; i < edge.length * 2; i++) { const t = i / (edge.length * 2 - 1), k = t * 2 - 1, x = nx + k * shW * 1.05, y = yN + H * 0.12 * (1 - k * k) + 7; dab(g, x, y, 4, 3, linenL, 0.6); }
      g.restore();
    }
  };

  // ---- the hair, as masses ----
  // an outer silhouette less the opening for the face and neck; inside it, overlapping locks (tapered ribbons
  // following the fall of the hair from the parting) and a few fine strands, all lit from the left
  const hairline = female ? 0.21 : 0.17 + old * 0.04;
  const bulk = { "own hair to shoulders": 1, "curled to the shoulders": 1.2, periwig: 1.5, "cropped to the collar": 0.55, ringlets: 0.5, "close cap": 0.9 }[hairStyle] ?? 1;
  const hairEnd = { "own hair to shoulders": 1.45, "curled to the shoulders": 1.5, periwig: 1.8, "cropped to the collar": 0.98, ringlets: 0.9, "close cap": 1.45 }[hairStyle] ?? 1.3;
  const sideOut = (v) => {   // how far the hair stands out from the face's edge at height v, in R
    if (hairStyle === "ringlets") return 0.05;
    if (hairStyle === "cropped to the collar") return 0.1 + 0.1 * smooth(0.4, 0.95, v);
    return (0.12 + 0.2 * smooth(0.3, 1.0, v) + 0.16 * smooth(1.0, 1.4, v)) * bulk;
  };
  const part = [cx + mid(0.2) + (female ? 0 : -R * 0.12 * Math.sign(phi || 1)), Y(hairline - 0.015)];
  const crownC = [cx + sphi * R * 0.08, Y(0.47)], crownRx = R * (1.02 + 0.1 * bulk), crownRy = H * 0.47 + R * 0.12 * bulk;
  const hairOuter = [];
  { const side = (sgn) => { const pts = []; for (let v = 0.5; v <= hairEnd + 0.001; v += 0.07) { const vv = Math.min(v, 1); pts.push([cx + sgn * (Math.max(hw(vv), R * 0.85) + R * sideOut(v)) + sh(vv) * 0.3 + (v > 0.9 ? (r() - 0.5) * 8 : 0), Y(v)]); } return pts; };
    const L0 = side(-1).reverse(), R0 = side(1);
    hairOuter.push(...L0);
    for (let a = Math.PI * 1.04; a <= Math.PI * 1.96; a += Math.PI / 14) hairOuter.push([crownC[0] + Math.cos(a) * crownRx, crownC[1] + Math.sin(a) * crownRy]);
    hairOuter.push(...R0);
    const yb = Y(hairEnd) + 4; hairOuter.push([cx + R * 0.3, yb + 10], [cx - R * 0.3, yb + 10]);
  }
  // the opening the face looks out of: from the parting along the hairline, down the cheeks, and the neck
  const opening = () => {
    const sideEdge = (s) => {
      const pts = [];
      if (hairStyle === "cropped to the collar") {    // a short fringe across the brow, the hair close down the cheeks
        pts.push([X(s * 0.3, 0.27), Y(0.27 + (s > 0 ? 0.01 : 0))], [X(s * 0.72, 0.3), Y(0.31)], [cx + s * hw(0.4) * 0.9 + sh(0.4), Y(0.39)]);
      } else {
        pts.push([X(s * 0.2, hairline + 0.025), Y(hairline + 0.03)], [X(s * 0.45, hairline + 0.08), Y(hairline + 0.09)], [X(s * 0.68, hairline + 0.17), Y(hairline + 0.18)], [cx + s * hw(0.42) * 0.86 + sh(0.42), Y(0.44)]);
      }
      const k = hairStyle === "ringlets" ? 1.0 : 0.95;
      pts.push([cx + s * hw(0.56) * k + sh(0.56), Y(0.56)], [cx + s * hw(0.7) * (k + 0.02) + sh(0.7), Y(0.7)], [cx + s * hw(0.84) * 1.04 + sh(0.84), Y(0.84)], [cx + s * hw(0.84) * 1.02 + sh(0.9), Y(0.97)]);
      pts.push([cx + sh(1) * 0.5 + s * neckW * 0.62, Y(1.06)], [cx + sh(1) * 0.5 + s * neckW * 0.66, 700]);
      return pts;
    };
    const Lp = sideEdge(-1), Rp = sideEdge(1);
    const topPt = hairStyle === "cropped to the collar" ? [X(0, 0.265), Y(0.262)] : part;
    return [topPt, ...Lp.slice(0, -1), Lp[Lp.length - 1], Rp[Rp.length - 1], ...Rp.slice(0, -1).reverse()];
  };
  const lock = (pts, w0, col, a) => {    // a tapered ribbon along a curve
    const n = pts.length, Lft = [], Rgt = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      let dx = q[0] - o[0], dy = q[1] - o[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const t = i / (n - 1), wd = w0 * Math.sin(Math.PI * (0.12 + 0.88 * t)) * (1 - t * 0.4) + 0.4;
      Lft.push([p[0] - dy * wd, p[1] + dx * wd]); Rgt.push([p[0] + dy * wd, p[1] - dx * wd]);
    }
    g.fillStyle = css(col, a); g.beginPath(); curve(g, [...Lft, ...Rgt.reverse()], true); g.fill();
  };
  const fallPath = (s, t, endV, wave, curly) => {   // from the parting, over the crown, down the side
    const p0 = [part[0] + s * (2 + t * R * 0.2), part[1] - t * H * 0.05];
    const p1 = [crownC[0] + s * crownRx * (0.62 + 0.33 * t), Y(0.1 + 0.1 * (1 - t))];
    const vv = Math.min(endV, 1), p2 = [cx + s * (hw(0.55) * 0.92 + R * sideOut(0.55) * (0.25 + 0.9 * t)) + sh(0.55) * 0.3, Y(0.55)];
    const p3 = [cx + s * (Math.max(hw(vv), R * 0.85) + R * sideOut(endV) * (0.1 + 0.95 * t)) + sh(vv) * 0.3, Y(endV)];
    const pts = [], k = 10, ph = r() * 6;
    for (let j = 0; j <= k; j++) {
      const q = j / k, a = (1 - q) ** 3, b = 3 * q * (1 - q) ** 2, c = 3 * q * q * (1 - q), d = q ** 3;
      let x = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], y = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
      x += Math.sin(q * (curly ? 16 : 7) + ph) * wave * smooth(0.25, 0.7, q) * (curly ? 7 : 3); pts.push([x, y]);
    }
    return pts;
  };
  const ringlet = (x, y, len, rad, lit) => {   // a hanging ringlet: a dark tube with a light crescent on each turn
    const sway = (r() - 0.5) * 8;
    feather(g, [[x, y], [x + sway * 0.4, y + len * 0.5], [x + sway, y + len]], hairDark, 0.95, rad * 0.95);
    for (let k = 0; k * rad * 1.5 < len; k++) {
      const q = (k * rad * 1.5) / len, xx = x + sway * q, yy = y + k * rad * 1.5 + rad * 0.5, rr = rad * (1 - q * 0.35);
      g.lineCap = "round"; g.strokeStyle = css(mix(hairC, hairLight, lit * 0.5), 0.35 + 0.4 * lit); g.lineWidth = rr * 0.45;
      g.beginPath(); g.ellipse(xx, yy, rr * 0.85, rr * 0.55, -0.3, Math.PI * 0.95, Math.PI * 1.75); g.stroke();
      g.strokeStyle = css(hairLight, 0.12 + 0.5 * lit); g.lineWidth = rr * 0.15; g.beginPath(); g.ellipse(xx, yy, rr * 0.8, rr * 0.5, -0.3, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
    }
  };

  const drawHairBack = () => {
    if (hairStyle === "ringlets") { const pts = []; for (let a = Math.PI * 0.9; a <= Math.PI * 2.1; a += Math.PI / 14) pts.push([crownC[0] + Math.cos(a) * crownRx, crownC[1] + Math.sin(a) * crownRy]); fillPath(g, pts, css(hairDark)); return; }
    fillPath(g, hairOuter, css(mix(hairDark, [0, 0, 0], 0.25)));
    dab(g, cx + R * 1.1, Y(1.1), R * 0.8, H * 0.5, [0, 0, 0], 0.4);
  };

  const main0 = () => g.getTransform();
  const drawHairFront = () => {
    const curly = /curl|periwig/.test(hairStyle);
    // painted unclipped on a sheet of its own, then cut to shape once (clipping every stroke costs ~20 ms)
    const xs = hairOuter.map((p) => p[0]), ys = hairOuter.map((p) => p[1]);
    const m0 = main0(), bx0 = Math.min(...xs) - 30, by0 = Math.min(...ys) - 20, bx1 = Math.max(...xs) + 30, by1 = Math.max(...ys) + 30;
    const p0 = m0.transformPoint(new DOMPoint(bx0, by0)), p1 = m0.transformPoint(new DOMPoint(bx1, by1));
    const sx0 = Math.floor(Math.min(p0.x, p1.x)) - 20, sy0 = Math.floor(Math.min(p0.y, p1.y)) - 20;
    const main = g, sheet = document.createElement("canvas"); sheet.width = Math.ceil(Math.abs(p1.x - p0.x)) + 40; sheet.height = Math.ceil(Math.abs(p1.y - p0.y)) + 40; g = sheet.getContext("2d");
    g.setTransform(new DOMMatrix([1, 0, 0, 1, -sx0, -sy0]).multiply(m0));
    g.save();
    // the mass, lit from the left
    g.fillStyle = css(hairDark); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    dab(g, cx - R * 0.55, Y(0.2), R * 1.0, H * 0.32, mix(hairC, hairLight, 0.2), 0.8);
    dab(g, cx - R * 1.05, Y(0.75), R * 0.55, H * 0.6, hairC, 0.55);
    dab(g, cx + R * 1.1, Y(0.75), R * 0.6, H * 0.7, [0, 0, 0], 0.4);
    // locks, back to front: the outer ones first, those framing the face last
    const nl = curly ? 28 : hairStyle === "ringlets" ? 18 : 26;
    for (let i = 0; i < nl; i++) {
      const s = i % 2 ? 1 : -1, t = 1 - i / nl + (r() - 0.5) * 0.2;
      const endV = hairStyle === "ringlets" ? lerp(0.36, 0.44, r()) : lerp(0.6, hairEnd, Math.pow(r(), 0.5));
      const pts = fallPath(s, clamp(t, 0, 1), endV, curly ? 1.3 : hairStyle === "ringlets" ? 0.1 : 0.6, curly);
      lock(pts.map(([x, y]) => [x + s * 3, y + 1]), R * (0.06 + r() * 0.05), mix(hairDark, [0, 0, 0], 0.4), 0.35);
      lock(pts, R * (0.08 + r() * 0.08), mix(hairDark, hairC, 0.25 + r() * 0.75), 0.55);
      if (r() < (grey * 0.7)) lock(pts.map(([x, y]) => [x + (r() - 0.5) * 3, y]), R * 0.03, [196, 192, 184], 0.35);
      const pm = pts[pts.length >> 2], lit = clamp(1 - Math.hypot(pm[0] - (cx - R * 0.6), pm[1] - Y(0.28)) / (R * 2.2), 0, 1);
      if (lit > 0.08) { g.lineCap = "round"; g.lineWidth = 1.2 + r() * 2.2; g.strokeStyle = css(hairLight, 0.75 * lit * lit); g.beginPath(); curve(g, pts.slice(1).map(([x, y]) => [x - s * 2, y])); g.stroke(); }
    }
    // fine strands over all
    for (let i = 0; i < 28; i++) {
      const s = r() < 0.5 ? -1 : 1, pts = fallPath(s, r(), hairStyle === "ringlets" ? 0.4 : lerp(0.5, hairEnd, r()), curly ? 1.2 : 0.5, curly);
      const isGrey = r() < grey; g.lineWidth = 0.6 + r() * 0.6; g.strokeStyle = css(isGrey ? [214, 210, 202] : mix(hairC, hairLight, r() * 0.6), isGrey ? 0.5 : 0.3); g.beginPath(); curve(g, pts); g.stroke();
    }
    if (curly) for (let i = 0; i < 28; i++) {   // curls gathering at the ends
      const s = r() < 0.5 ? -1 : 1, v = lerp(0.75, hairEnd - 0.02, r()), t = r(), vv = Math.min(v, 1);
      const x = cx + s * (Math.max(hw(vv), R * 0.85) + R * sideOut(v) * (0.15 + 0.85 * t)) + sh(vv) * 0.3, y = Y(v), rad = R * (0.07 + r() * 0.05);
      const lit = s < 0 ? 1 - t * 0.5 : 0.25;
      g.fillStyle = css(hairDark, 0.45); g.beginPath(); g.ellipse(x + 1, y + 2, rad * 0.95, rad * 1.1, 0, 0, TAU); g.fill();
      g.fillStyle = css(mix(hairC, hairLight, lit * 0.6), 0.3 + lit * 0.25); g.beginPath(); g.ellipse(x - rad * 0.2, y - rad * 0.25, rad * 0.65, rad * 0.55, 0, 0, TAU); g.fill();
      g.lineWidth = 1.2; g.strokeStyle = css(hairLight, 0.15 + lit * 0.35); g.beginPath(); g.ellipse(x, y, rad * 0.8, rad * 0.9, -0.3, Math.PI * 1.0, Math.PI * 1.75); g.stroke();
    }
    // the sheen on the crown, where the window falls on it
    feather(g, [[crownC[0] - crownRx * 0.85, crownC[1] - crownRy * 0.35], [crownC[0] - crownRx * 0.55, crownC[1] - crownRy * 0.8], [crownC[0] - crownRx * 0.1, crownC[1] - crownRy * 0.97]], hairLight, hairStyle === "ringlets" ? 0.4 : 0.25, 5);
    g.restore();
    g.globalCompositeOperation = "destination-in"; g.beginPath(); curve(g, hairOuter, true); g.fill();
    if (hairEnd > 1.1) { g.globalCompositeOperation = "destination-out"; const fe = g.createLinearGradient(0, Y(hairEnd - 0.1), 0, Y(hairEnd + 0.04)); fe.addColorStop(0, "rgba(0,0,0,0)"); fe.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = fe; g.fillRect(bx0, Y(hairEnd - 0.1), bx1 - bx0, by1 - Y(hairEnd - 0.1)); }
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.beginPath(); curve(g, opening(), true); g.fill();
    { const low = face.filter(([, y]) => y > Y(0.6)); g.beginPath(); g.moveTo(low[0][0], low[0][1]); for (const p of low) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); }   // the hair never over the lower face
    g = main; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sheet, sx0, sy0); g.restore();
    // a few hairs across the hairline, so the hair lies on the brow rather than being cut out of it
    if (hairStyle !== "cropped to the collar") for (let i = 0; i < 26; i++) { const s2 = i % 2 ? 1 : -1, pts = fallPath(s2, r() * 0.12, lerp(0.45, 0.62, r()), 0.3, false).map(([x, y]) => [x - s2 * R * 0.05, y]); g.lineWidth = 0.6 + r() * 0.5; g.strokeStyle = css(mix(hairC, hairLight, s2 < 0 ? 0.5 : 0.1), 0.3); g.beginPath(); curve(g, pts); g.stroke(); }
    else for (let i = 0; i < 30; i++) { const u = (r() - 0.5) * 1.5, x = X(u, 0.27), y = Y(0.272 + Math.abs(u) * 0.03); g.lineWidth = 0.7; g.strokeStyle = css(mix(hairDark, hairC, u < 0 ? 0.6 : 0.2), 0.5); g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + (r() - 0.3) * 4, y + 2 + r() * 5); g.stroke(); }
    if (hairStyle === "ringlets") {   // bunches of ringlets at either side of the face, a little fringe of curls on the brow
      for (const s of [1, -1]) for (let i = 0; i < 5; i++) {
        const t = i / 4, x = cx + sh(0.5) * 0.4 + s * (hw(0.45) * 0.97 + R * (0.06 + t * 0.34)), y = Y(0.34 + t * 0.05 + r() * 0.03);
        if (i === 0) dab(g, cx + sh(0.5) * 0.4 + s * (hw(0.45) * 0.97 + R * 0.24), Y(0.56), R * 0.3, H * 0.24, hairDark, 0.85, 0, 0.5);
        ringlet(x, y, H * (0.28 + r() * 0.14 + t * 0.05), R * (0.11 + r() * 0.02), s < 0 ? 1 - t * 0.6 : 0.2);
      }
    }
    // loose hairs across the silhouette, so it is not cut out
    g.save(); g.lineWidth = 0.7;
    for (let i = 0; i < 26; i++) { const p = hairOuter[Math.floor(r() * hairOuter.length)]; g.strokeStyle = css(mix(hairC, hairLight, p[0] < cx ? 0.5 : 0), 0.35); g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + (r() - 0.5) * 14, p[1] + 6, p[0] + (r() - 0.5) * 18, p[1] + 10 + r() * 10); g.stroke(); }
    g.restore();
    if (/cap/.test(hairStyle) || (L.cap && L.cap !== "none")) drawCap();
  };

  const drawCap = () => {   // a close black skullcap on the crown
    const cc = colourOf(L.cap && L.cap !== "none" ? L.cap : "black", CLOTH, CLOTH.black);
    const pts = []; for (let a = Math.PI * 1.02; a <= TAU - 0.02 * Math.PI; a += Math.PI / 14) pts.push([cx + Math.cos(a) * R * 1.12 + sphi * R * 0.12, Y(0.3) + Math.sin(a) * H * 0.38]);
    pts.push([cx + R * 1.0 + sphi * R * 0.12, Y(0.27)]); pts.push([cx + sphi * R * 0.12, Y(0.2)]); pts.push([cx - R * 1.0 + sphi * R * 0.12, Y(0.27)]);
    g.save(); g.beginPath(); curve(g, pts, true); g.fillStyle = css(cc); g.fill(); g.clip();
    dab(g, cx - R * 0.45, Y(0.0), R * 0.7, H * 0.2, [200, 190, 180], 0.28);
    dab(g, cx + R * 0.7, Y(0.15), R * 0.6, H * 0.25, [0, 0, 0], 0.5);
    g.restore();
  };

  // ---- the face ----
  const drawFace = () => {
    g.save(); facePath(); g.clip(); g.imageSmoothingQuality = "high"; g.drawImage(skin.head, skin.x0 - skin.step / 2, skin.y0 - skin.step / 2, skin.w, skin.h); g.restore();
    g.save(); facePath(); g.clip();
    drawFeatures();
    // the hair's shadow on the brow
    dab(g, cx + mid(0.2), Y(hairline + 0.02), R * 1.1, H * 0.06, sD, 0.35);
    g.restore();
  };

  // ---- the features: eyes, brows, nose, mouth ----
  const drawFeatures = () => {
    const vE = 0.5 - (smirk ? 0.006 : 0), yE = Y(vE);
    const eyeIris = colourOf(L.face.eyes, EYES, EYES.brown);
    const ewF = R * (0.44 + young * 0.03 + (female ? 0.02 : 0) - old * 0.02);     // a frontal eye's width
    const brow = { y: Y(0.44 - browRaise), w: female ? 0.02 : 0.036 + old * 0.004 };
    // the sockets: the shadow under the brow, round the eye; deeper with age and want of sleep
    for (const s of [-1, 1]) {
      const ex0 = X(s * 0.42, vE), shadowSide = s > 0 ? 1 : 0;
      dab(g, ex0 + s * 2, yE - H * 0.015, ewF * 0.8 * fore(s * 0.42), H * 0.05, mix(sS, [90, 70, 70], 0.3), 0.12 + old * 0.06 + tired * 0.08);
      dab(g, X(s * 0.17, vE - 0.02), yE - H * 0.01, R * 0.07, H * 0.035, sS, 0.15);  // where the socket meets the nose
      // under the eye: the lower lid's fold; bags with age; dark when the sitter has not slept
      dab(g, X(s * 0.42, vE + 0.05), Y(vE + 0.045), ewF * 0.5 * fore(s * 0.42), H * 0.022, tired ? [110, 80, 96] : sS, 0.12 + old * 0.15 + tired * 0.32);
      if (old > 0.3 || tired) feather(g, [[X(s * 0.24, vE + 0.05), Y(vE + 0.05)], [X(s * 0.45, vE + 0.075), Y(vE + 0.072)], [X(s * 0.66, vE + 0.055), Y(vE + 0.055)]], sS, 0.25 * Math.max(old, tired * 0.7), 2.2);
      // brow ridge light
    }
    // the eyes
    for (const s of [-1, 1]) {
      const ui = s * 0.17, uo = s * 0.62;
      const xi = X(ui, vE), xo = X(uo, vE), xm = (xi + xo) / 2, ew = Math.abs(xo - xi);
      const eh = ewF * 0.27 * open * (s * phi > 0 ? 1 : 0.95), yy = yE + (s * tilt) * 2;
      const dir = Math.sign(xo - xi);
      const hi = [xi, yy + eh * 0.08], ho = [xo, yy - eh * 0.04 + (droop ? eh * 0.12 : 0)];
      const up = (t) => [lerp(xi, xo, t), yy - eh * (1.0 * Math.sin(Math.PI * Math.pow(t, 0.85)))];
      const lo = (t) => [lerp(xi, xo, t), yy + eh * (0.6 * Math.sin(Math.PI * Math.pow(t, 1.1)))];
      const upper = [hi, up(0.25), up(0.5), up(0.75), ho], lower = [ho, lo(0.75), lo(0.5), lo(0.25), hi];
      // the lid's crease above, and the lid itself catching light
      const crease = [0.1, 0.4, 0.75, 1.0].map((t) => { const p = up(t); return [p[0] + dir * 2 * t, p[1] - eh * (0.75 + 0.15 * open) - (old ? eh * 0.1 * old : 0)]; });
      feather(g, crease, sS, 0.35 + old * 0.15, 1.6);
      dab(g, up(0.45)[0], yy - eh * 1.1, ew * 0.45, eh * 0.55, s < 0 ? sL : sM, 0.3);
      if (tired || droop || old > 0.5) dab(g, up(0.65)[0], yy - eh * 1.15, ew * 0.4, eh * 0.4, sS, 0.22);
      // the white, greyed and shadowed at its corners and under the lid
      g.save(); g.beginPath(); curve(g, [...upper, ...lower.slice(1, -1)], true);
      const white = mix([196, 184, 170], sS, s > 0 ? 0.5 : 0.35);
      g.fillStyle = css(white); g.fill(); g.clip();
      dab(g, xi, yy, ew * 0.25, eh * 1.2, sS, 0.6); dab(g, xo, yy, ew * 0.3, eh * 1.4, sS, 0.55);
      // the iris and pupil, looking at you
      const ir = ewF * 0.25, ix = xm + dir * 0 + gaze * ew * 0.6 + (fore(s * 0.4) < 1 ? 0 : 0), iy = yy - eh * 0.06;
      const irx = ir * Math.min(1, 0.6 + 0.4 * fore(s * 0.4));
      const ig = g.createRadialGradient(ix - irx * 0.2, iy + ir * 0.25, 0, ix, iy, ir);
      ig.addColorStop(0, css(mix(eyeIris, [230, 200, 150], 0.12))); ig.addColorStop(0.55, css(mix(eyeIris, [20, 14, 10], 0.25))); ig.addColorStop(0.88, css(mix(eyeIris, [10, 8, 6], 0.5))); ig.addColorStop(1, css([20, 14, 10]));
      g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, irx, ir, 0, 0, TAU); g.fill();
      g.fillStyle = css([12, 9, 8]); g.beginPath(); g.ellipse(ix, iy, irx * 0.42, ir * 0.42, 0, 0, TAU); g.fill();
      // the shadow the upper lid casts
      { const gr = g.createLinearGradient(0, yy - eh * 1.2, 0, yy + eh * 0.2); gr.addColorStop(0, css(sD, 0.75)); gr.addColorStop(0.55, css(sD, 0.18)); gr.addColorStop(1, css(sD, 0)); g.fillStyle = gr; g.fillRect(xi - ew, yy - eh * 2, ew * 3, eh * 2.4); }
      g.restore();
      // the catchlight, from the window on the left
      dab(g, ix - irx * 0.35, iy - ir * 0.3, ir * 0.24, ir * 0.24, [255, 250, 240], 0.9, 0, 0.45);
      // the upper lid's edge and lashes: dark, heavier at the outer corner; the lower lid a soft rim
      g.lineCap = "round"; g.lineJoin = "round";
      feather(g, upper, sD, 0.8, 1.7);
      feather(g, [up(0.55), up(0.8), ho, [ho[0] + dir * ew * 0.08, ho[1] + eh * 0.15]], [24, 16, 12], 0.7, 1.6 + (female ? 0.6 : 0));
      feather(g, lower.slice(0, 4), sS, 0.5, 1.2);
      feather(g, lower.slice(1, 4).map(([x, y]) => [x, y + 1.6]), sL, 0.25, 1.2);
      dab(g, xi + dir * 1.5, yy + eh * 0.15, 2.4, 2, [200, 120, 120], 0.6);   // the caruncle, pink at the inner corner
      // crow's feet, with age
      if (old > 0.2) for (let k = 0; k < 3; k++) feather(g, [[xo + dir * 3, yy + (k - 1) * 4], [xo + dir * (10 + k * 2), yy + (k - 1) * 7 + 1]], sS, 0.25 * old, 1.1);
    }
    // the brows: a tapered soft mass along the brow ridge, thick at the inner end, a few hairs over it; a man's heavier
    for (const s of [-1, 1]) {
      const raise = (smirk && s > 0 ? H * 0.018 : 0);
      const P = (t) => [X(s * lerp(0.14, 0.86, t), 0.43), brow.y - raise - (t < 0.15 ? browKnit * H * 0.012 * (1 - t / 0.15) : 0) - Math.sin(Math.PI * Math.min(1, t * 1.25)) * H * (female ? 0.022 : 0.014) + t * t * H * 0.012];
      const bc = mix(hairDark, sS, female ? 0.3 : 0.12), th = H * brow.w;
      const up = [], dn = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8, [x, y] = P(t), wdt = th * (female ? 0.62 - 0.4 * t : 1.0 - 0.6 * t); up.push([x, y - wdt * 0.55]); dn.push([x, y + wdt * 0.45]); }
      g.save(); g.filter = "none";
      fillPath(g, [...up, ...dn.reverse()], css(bc, female ? 0.55 : 0.62));
      feather(g, [0, 0.3, 0.6, 1].map(P), bc, 0.25, th * 0.5);
      g.restore();
      for (let i = 0; i < 26; i++) {
        const t = r(), [x, y0] = P(t), y = y0 + (r() - 0.5) * th * 0.5 * (1 - t * 0.5);
        const ang = t < 0.18 ? -1.25 : -0.3, ln = (3 + r() * 3) * (female ? 0.7 : 1);
        g.strokeStyle = css(mix(bc, hairDark, r()), 0.4); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * Math.cos(ang) * ln, y + Math.sin(ang) * ln * 0.6); g.stroke();
      }
    }
    // the nose: its form is in the modelling; here only the accents a painter adds: the bridge's light, the tip's
    // glint, the dark of the nostrils, the crease of the wings, the fold to the mouth
    { const topX = X(0, 0.48);
      feather(g, [[topX - 1, Y(0.5)], [lerp(topX, tipX, 0.5) - 1, lerp(Y(0.5), yB, 0.5)], [tipX - 2, yB - H * 0.045]], sL, 0.22, 2.5);
      dab(g, tipX - nwid * 0.18, yB - H * 0.03, nwid * 0.22, H * 0.014, [255, 244, 230], 0.35);
      for (const s of [-1, 1]) {
        const wx = tipX + s * nwid * (s * phi > 0 ? 0.95 : 0.85);
        feather(g, [[wx + s * 1, yB - H * 0.035], [wx + s * 2.5, yB - H * 0.012], [wx, yB + H * 0.004], [wx - s * nwid * 0.3, yB + H * 0.006]], sS, s > 0 ? 0.4 : 0.28, 1.6);
        dab(g, tipX + s * nwid * 0.45, yB + H * 0.002, nwid * 0.2, H * 0.008, [46, 26, 20], s > 0 ? 0.8 : 0.6);
      }
      const nlA = 0.06 + old * 0.2 + thin * 0.03 - young * 0.04 + (smirk ? 0.06 : 0);
      for (const s of [-1, 1]) {
        const a = [tipX + s * nwid * 1.1, yB - H * 0.02], b = [X(s * 0.43, 0.73), Y(0.74)], c = [X(s * 0.48, 0.82), Y(0.83 + old * 0.02)];
        if (s > 0 && smirk) b[1] -= H * 0.012;
        if (nlA > 0) feather(g, [a, b, c], sS, nlA * (s > 0 ? 1.2 : 0.85), 2);
      }
    }
    // the mouth: the upper lip turned from the light, the lower catching it, the line between, the shadow under
    { const vM = 0.775 - (smirk ? 0.006 : 0), yM = Y(vM), mw = 0.34 + (female ? 0.0 : 0.02);
      const thinLip = old * 0.3 + Math.max(0, thin) * 0.15 + (ex === "wary" ? 0.15 : 0);
      const lu = H * (female ? 0.034 : 0.026) * (1 - thinLip * 0.5), ll = H * (female ? 0.042 : 0.04) * (1 - thinLip * 0.4);
      const cl = [X(-mw, vM), yM + H * 0.004 * droop * 2 + H * 0.002], cr = [X(mw, vM), yM + H * 0.004 * droop * 2 - smirk * H * 0.016];
      const m = X(0, vM), lipC = mix(mix(sC, [150, 70, 64], 0.4), sM, female ? 0 : 0.45), lipS = mix(lipC, sD, 0.35);
      const line = [cl, [lerp(cl[0], m, 0.45), yM + 1], [m, yM + 1.5], [lerp(m, cr[0], 0.55), yM + 1 - smirk * 3], cr];
      // upper lip
      fillPath(g, [cl, [lerp(cl[0], m, 0.55), yM - lu * 0.95], [m - 2, yM - lu * 0.85], [m, yM - lu * 0.7], [m + 2, yM - lu * 0.85], [lerp(m, cr[0], 0.45), yM - lu * 0.95], cr, ...line.slice(1, -1).reverse()], css(lipS, female ? 0.55 : 0.3));
      // lower lip
      g.save(); g.beginPath(); curve(g, [cl, [lerp(cl[0], m, 0.35), yM + ll * 0.75], [m, yM + ll], [lerp(m, cr[0], 0.65), yM + ll * 0.75], cr, ...line.slice(1, -1).reverse()], true);
      g.fillStyle = css(lipC, female ? 0.5 : 0.2); g.fill(); g.restore();
      dab(g, lerp(cl[0], m, 0.7), yM + ll * 0.45, (m - cl[0]) * 0.4, ll * 0.3, sL, female ? 0.45 : 0.3);
      // the line of the mouth, darkest at its corners
      feather(g, line, [58, 30, 26], female ? 0.6 : 0.7, 1.4);
      dab(g, cl[0] + 1, cl[1], 3, 2.5, [50, 26, 22], 0.6); dab(g, cr[0] - 1, cr[1], 3, 2.5, [50, 26, 22], 0.6);
      if (smirk) feather(g, [[cr[0] + 2, cr[1] - 4], [cr[0] + 4, cr[1] + 2]], sS, 0.45, 1.6);    // the dimple of a half-smile
      if (droop || old > 0.4) for (const s of [-1, 1]) feather(g, [[s < 0 ? cl[0] - 1 : cr[0] + 1, (s < 0 ? cl : cr)[1] + 2], [X(s * (mw + 0.06), vM + 0.06), Y(vM + 0.065)]], sS, 0.2 * Math.max(old, droop * 0.8), 1.8);
      // under the lower lip, and the chin's light
      dab(g, m + R * 0.04, yM + ll + H * 0.02, R * 0.2, H * 0.016, sS, 0.18);
      // the moustache and the tuft beneath the lip
      if (!female && /moustache/.test(L.beard)) {    // a light moustache, parted under the nose, its ends turned up
        const bc = mix(hairC, hairDark, 0.35), vT = vM - 0.03;
        for (const s of [-1, 1]) {
          const P = (t) => [X(s * (0.05 + t * 0.4), vT), Y(vT) + H * (0.006 + 0.012 * Math.sin(Math.PI * t * 0.8)) - (t > 0.75 ? H * 0.03 * (t - 0.75) : 0)];
          const pts = [0, 0.25, 0.5, 0.75, 1].map(P);
          feather(g, pts, mix(bc, [0, 0, 0], 0.3), 0.5, H * 0.012);
          for (let i = 0; i < 22; i++) {
            const t = i / 21, [x0, y0] = P(t * 0.85), [x1, y1] = P(Math.min(1, t * 0.85 + 0.18));
            g.strokeStyle = css(mix(bc, hairLight, s < 0 ? r() * 0.5 : r() * 0.15), 0.4); g.lineWidth = 0.8 + (1 - t) * 0.9;
            g.beginPath(); g.moveTo(x0, y0 - H * 0.004); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + H * 0.006 * (r() - 0.3), x1, y1 + H * 0.002); g.stroke();
          }
        }
      }
      if (!female && /tuft|imperial|beard/.test(L.beard)) {
        const bc = mix(hairC, hairDark, 0.4), tx = m + 1, ty = yM + ll + H * 0.005;
        for (let i = 0; i < 26; i++) { const q = (r() - 0.5) * R * 0.11; g.strokeStyle = css(mix(bc, hairLight, q < 0 ? r() * 0.4 : 0), 0.5); g.lineWidth = 1.1; g.beginPath(); g.moveTo(tx + q, ty + r() * 3); g.quadraticCurveTo(tx + q * 0.6, ty + H * 0.03, tx + q * 0.2, ty + H * (0.045 + r() * 0.02)); g.stroke(); }
      }
    }
  };

  // ---- jewels and things in the hands ----
  const drawJewels = () => {
    if (!(L.dress.jewels || []).length) return;
    const J = L.dress.jewels.join(" ");
    if (/pearl necklace|pearls/.test(J)) {   // a string of pearls close round the base of the neck
      const nx = cx + sh(1) * 0.5, y0 = nbY + H * 0.02;
      for (let k = -9; k <= 9; k++) { const t = k / 9, x = nx + t * neckW * 0.62, y = y0 + (1 - t * t) * H * 0.06; dab(g, x + 0.6, y + 0.8, 3.6, 3.6, [30, 24, 20], 0.5); dab(g, x, y, 3.2, 3.2, mix([224, 220, 208], [120, 116, 110], t > 0 ? t * 0.8 : 0), 1, 0, 0.6); dab(g, x - 1, y - 1, 1.2, 1.2, [255, 255, 250], 0.9); }
    }
    if (/pearl drop|earring/.test(J)) for (const s of [-1, 1]) { if (s * phi > 0.25) continue; const x = cx + s * hw(0.68) * 1.02 + sh(0.68) + s * 3, y = Y(0.72); dab(g, x, y, 3.2, 4.2, mix([226, 222, 212], [120, 116, 110], s > 0 ? 0.6 : 0), 1, 0, 0.6); dab(g, x - 1, y - 1.4, 1.2, 1.2, [255, 255, 250], 0.9); }
  };
  const drawHands = () => {
    const D = L.details.join(" ");
    if (/bound hand|bandage/.test(D)) {
      // his right hand laid on his breast, its back to us, the palm and knuckles bound in a fine handkerchief with a
      // dull stain come through; the fingers free above it. Drawn in the hand's own frame: x along the fingers.
      const hx = ncx - W * 0.62, hy = 628, ang = -0.62, hb = W * 0.5, fl = W * 0.46;
      g.save(); g.translate(hx, hy); g.rotate(ang);
      // the sleeve and its cuff of lace
      g.fillStyle = css(mix(cloth, [0, 0, 0], 0.15)); g.beginPath(); g.moveTo(-hb * 1.6, -hb * 0.75); g.lineTo(-hb * 0.15, -hb * 0.6); g.lineTo(-hb * 0.1, hb * 0.65); g.lineTo(-hb * 1.6, hb * 0.8); g.closePath(); g.fill();
      dab(g, -hb * 0.8, -hb * 0.4, hb * 0.6, hb * 0.2, mix(cloth, [255, 246, 230], 0.4), 0.45);
      for (let k = -5; k <= 5; k++) dab(g, -hb * 0.12 + Math.sin(k * 1.7) * 2, k * hb * 0.12, hb * 0.13, hb * 0.08, mix(linenL, linenS, k > 0 ? 0.4 : 0.05), 0.85, 0.3);
      // fingers: tapered, a little fanned and curled; lit along their upper edge
      const fingers = [[-0.3, 0.72, -0.05], [-0.1, 0.86, -0.01], [0.1, 0.82, 0.03], [0.29, 0.66, 0.07]];
      for (const [o, len, spread] of fingers) {
        g.save(); g.translate(hb * 0.75, o * hb); g.rotate(spread);
        const L2 = fl * len, w0 = hb * 0.23, w1 = hb * 0.18;
        g.beginPath(); g.moveTo(0, -w0 / 2); g.lineTo(L2 - w1 / 2, -w1 / 2); g.arc(L2 - w1 / 2, 0, w1 / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(0, w0 / 2); g.closePath();
        g.fillStyle = css(mix(sM, sS, 0.15)); g.fill();
        g.save(); g.clip();
        const gr = g.createLinearGradient(0, -w0 / 2, 0, w0 / 2); gr.addColorStop(0, css(sL, 0.9)); gr.addColorStop(0.45, css(sM, 0.2)); gr.addColorStop(1, css(sS, 0.85)); g.fillStyle = gr; g.fillRect(0, -w0, L2, w0 * 2);
        for (const kx of [0.42, 0.75]) feather(g, [[L2 * kx, -w0 * 0.3], [L2 * kx + 1, w0 * 0.3]], sS, 0.5, 1.2);   // the joints' creases
        dab(g, L2 - w1 * 0.75, -w1 * 0.05, w1 * 0.42, w1 * 0.3, [236, 196, 186], 0.7);                              // the nail
        g.restore();
        feather(g, [[0, w0 / 2], [L2 - w1 / 2, w1 / 2]], sD, 0.35, 1.2);
        g.restore();
      }
      // the binding: a white handkerchief wound over the palm and knuckles, its folds lit from the left
      const band = [[-hb * 0.08, -hb * 0.62], [hb * 0.45, -hb * 0.66], [hb * 0.86, -hb * 0.5], [hb * 0.92, hb * 0.05], [hb * 0.84, hb * 0.55], [hb * 0.4, hb * 0.7], [-hb * 0.06, hb * 0.6]];
      g.save(); g.beginPath(); curve(g, band, true); g.fillStyle = css(mix(linenL, linenS, 0.2)); g.fill(); g.clip();
      { const gr = g.createLinearGradient(0, -hb * 0.7, 0, hb * 0.7); gr.addColorStop(0, css(linenL, 0.95)); gr.addColorStop(0.6, css(linenL, 0.2)); gr.addColorStop(1, css(linenS, 0.9)); g.fillStyle = gr; g.fillRect(-hb, -hb, hb * 2, hb * 2); }
      for (let k = 0; k < 4; k++) { const x = hb * (0.05 + k * 0.24); feather(g, [[x - hb * 0.08, -hb * 0.66], [x + hb * 0.04, 0], [x + hb * 0.12, hb * 0.7]], linenS, 0.5, 2.5); feather(g, [[x - hb * 0.02, -hb * 0.66], [x + hb * 0.1, 0], [x + hb * 0.18, hb * 0.7]], [255, 255, 250], 0.35, 1.5); }
      dab(g, hb * 0.62, -hb * 0.12, hb * 0.2, hb * 0.15, [128, 40, 34], 0.55); dab(g, hb * 0.66, -hb * 0.1, hb * 0.09, hb * 0.07, [92, 26, 22], 0.55);
      g.restore();
      // a tail of the handkerchief hanging from the wrist, lace at its edge
      fillPath(g, [[hb * 0.1, hb * 0.55], [hb * 0.3, hb * 0.62], [hb * 0.2, hb * 1.3], [-hb * 0.05, hb * 1.25]], css(mix(linenL, linenS, 0.35)));
      for (let k = 0; k < 5; k++) dab(g, -hb * 0.05 + k * hb * 0.06, hb * 1.27 + k * 0.5, hb * 0.04, hb * 0.035, linenL, 0.8);
      g.restore();
    }
  };

  // ---- paint, back to front ----
  g.save();
  if (tilt) { g.translate(ncx, nbY); g.rotate(tilt); g.translate(-ncx, -nbY); }
  if (hairStyle !== "ringlets") drawHairBack();
  g.restore();
  drawBody();
  drawNeck();
  drawCollar();
  g.save();
  if (tilt) { g.translate(ncx, nbY); g.rotate(tilt); g.translate(-ncx, -nbY); }
  if (hairStyle === "ringlets") drawHairBack();
  drawFace();
  drawHairFront();
  drawJewels();
  g.restore();
  drawHands();

  // ---- the finish: edges softened as a brush leaves them, a warm varnish, the canvas's grain ----
  g.restore();
  // (a blur by shrinking and enlarging: filter blurs cost ~20 ms here, this under 1)
  const shrink = (k) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w / k)); c.height = Math.max(1, Math.round(h / k)); const cg = c.getContext("2d"); cg.imageSmoothingQuality = "medium"; cg.drawImage(layer, 0, 0, c.width, c.height); return c; };
  g.globalAlpha = 0.45; g.drawImage(shrink(2.2), 0, 0, w, h); g.globalAlpha = 1;
  g.globalCompositeOperation = "source-atop";
  if (!withGround) {
    // nothing behind: the silhouette's own edge feathered, and the bust fading out below
    g.globalCompositeOperation = "destination-in";
    g.drawImage(shrink(6), 0, 0, w, h);
    const fade = g.createLinearGradient(0, oy + 520 * S, 0, oy + 640 * S); fade.addColorStop(0, "#000"); fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade; g.fillRect(0, 0, w, h);
  }
  g.globalCompositeOperation = "source-over";
  out.drawImage(layer, 0, 0);
  if (withGround) {   // the old varnish darkening toward the bottom corners, over the figure too
    const v = out.createLinearGradient(0, h * 0.62, 0, h); v.addColorStop(0, "rgba(6,4,2,0)"); v.addColorStop(1, "rgba(6,4,2,0.45)"); out.fillStyle = v; out.fillRect(0, h * 0.62, w, h * 0.38);
  }
  return cv;
}
