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
//
// Second pass (graded C+ as "smooth clay busts"), toward an oil painting. The brush: a last layer of strokes over
// the whole figure, each carrying the colour under its centre a little broken (lighter, darker, warmer, cooler) and
// running across the tone's gradient, so along the form, cut short where the tone ahead changes (Litwinowicz 1997,
// "Processing images and video for an impressionist effect"; Hertzmann 1998, "Painterly rendering with curved brush
// strokes of multiple sizes": broad strokes, then small ones only where there is detail); written straight into the
// pixels, bristled, the eyes and mouth kept small and light. Adopted from them: colour from the source under the
// stroke, orientation normal to the gradient, edge clipping, coarse-then-fine. Rejected: curved multi-segment strokes
// and per-layer error maps (too slow here for what they add at 512 px). The face: an expression table (lids, gaze,
// brows, the set of the mouth) so wary, composed, insolent and weary read; eyes with a lash band, a lid crease
// that hides as the lid grows heavy, the lid's shadow on the ball, a moist lower rim, a catchlight from the window;
// a mouth with a bowed upper lip in shadow, a lit lower lip lost at its lower edge, the philtrum, the corners. Hair
// as locks lit only on the crests that turn to the window, waved for curls, pointed for a fringe, stray hairs off
// the silhouette; ringlets as coils (the front half of each turn a lit arc). Cloth as folds (a valley and, toward
// the light, a ridge): broad and soft for broadcloth and wool, narrow and bright with a cool glow for silk, hanging
// from the shoulder's point, drawn across the breast toward the arm. About 34-43 ms for a 512 x 640 figure and
// 14-18 ms for the 256 x 320 face on this machine under load (the first pass: 32-40 and 11-15); the manor's 8 at case
// load about 220 ms against 200 (best runs). The brush is skipped below 0.6 scale, where it would be finer than a
// pixel of what is seen.

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
  brushwork(out, w, h, { S, seed: 1660, amount: 1.3 });
  grounds.set(key, c); return c;
}

// one stroke into float RGBA pixels: a tapered, bristled band from -lb to la along (ux, uy), half width hw
function rasterStroke(d, W, H, cx0, cy0, ux, uy, la, lb, hw, alpha, cr, cg, cb, bristle) {
  const lm = la > lb ? la : lb, ex = Math.abs(ux) * lm + Math.abs(uy) * hw + 1, ey = Math.abs(uy) * lm + Math.abs(ux) * hw + 1;
  const ya = Math.max(0, Math.floor(cy0 - ey)), yb = Math.min(H - 1, Math.ceil(cy0 + ey)), ila = 1 / la, ilb = 1 / lb, ihw = 1 / hw;
  for (let y = ya; y <= yb; y++) {
    const dy = y - cy0; let lo = -ex, hi = ex;
    if (uy > 1e-4 || uy < -1e-4) { const a1 = (dy * ux - hw) / uy, a2 = (dy * ux + hw) / uy; if (a1 < a2) { if (a1 > lo) lo = a1; if (a2 < hi) hi = a2; } else { if (a2 > lo) lo = a2; if (a1 < hi) hi = a1; } }
    else if (dy >= hw || dy <= -hw) continue;
    if (ux > 1e-4 || ux < -1e-4) { const b1 = (-lb - dy * uy) / ux, b2 = (la - dy * uy) / ux; if (b1 < b2) { if (b1 > lo) lo = b1; if (b2 < hi) hi = b2; } else { if (b2 > lo) lo = b2; if (b1 < hi) hi = b1; } }
    else if (dy * uy <= -lb || dy * uy >= la) continue;
    let x = Math.ceil(cx0 + lo); const xe = Math.min(W - 1, Math.floor(cx0 + hi)); if (x < 0) x = 0;
    let dx = x - cx0, al = dx * ux + dy * uy, ac = dy * ux - dx * uy, q = (y * W + x) * 4;
    for (; x <= xe; x++, al += ux, ac -= uy, q += 4) {
      const tc = ac * ihw; if (tc <= -1 || tc >= 1) continue;
      const t = al >= 0 ? al * ila : -al * ilb; if (t >= 1) continue;
      const t2 = t * t, c2 = tc * tc;
      let A = alpha * (1 - t2 * t2) * (1 - c2 * c2) * bristle[((tc + 1) * 3.499) | 0];
      if (al < 0) A *= 1 - 0.5 * t;                          // the stroke thins where the brush leaves it
      const da = d[q + 3] * (1 / 255);
      if (da >= 0.999) { d[q] += (cr - d[q]) * A; d[q + 1] += (cg - d[q + 1]) * A; d[q + 2] += (cb - d[q + 2]) * A; }
      else { const oa = A + da * (1 - A); if (oa <= 0) continue; const k = da * (1 - A), io = 1 / oa; d[q] = (cr * A + d[q] * k) * io; d[q + 1] = (cg * A + d[q + 1] * k) * io; d[q + 2] = (cb * A + d[q + 2] * k) * io; d[q + 3] = oa * 255; }
    }
  }
}

// ---- the brush: strokes laid over the finished underpainting, as a painter's last passes are ----
// After Litwinowicz (1997) and Hertzmann (1998): each stroke takes its colour from the picture under its centre,
// a little broken (lighter or darker, warmer or cooler, as a loaded brush lays it), and runs along the form, across
// the gradient of the picture's tone (so on a cheek it follows the curve of the cheek, on cloth the fold); where the
// tone changes sharply ahead the stroke is cut short, so it does not drag a lid into the eye. Two passes: broad
// strokes, then small ones where there is detail. Drawn straight into the pixels (a canvas stroke apiece would cost
// ten times as much): about 4-8 ms for a 512 x 640 painting. `keep`: ellipses [x, y, rx, ry] (canvas px) where the
// brush goes small and light (the eyes, the mouth); `hatch`: the brush's own slant where the picture is flat.
function brushwork(ctx, W, H, { S = 1, seed = 1, keep = [], amount = 1, hatch = 1.05, edge = null } = {}) {
  const r = rng(seed ^ 0x9e3779b9), im = ctx.getImageData(0, 0, W, H), d = im.data, src = d.slice();
  // the tone field at quarter size, smoothed: its gradient gives each stroke its way
  const k = 4, fw = Math.ceil(W / k), fh = Math.ceil(H / k), lum = new Float32Array(fw * fh), tmp = new Float32Array(fw * fh);
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const o = (Math.min(H - 1, j * k + 2) * W + Math.min(W - 1, i * k + 2)) * 4, a = src[o + 3] / 255; lum[j * fw + i] = (src[o] * 0.3 + src[o + 1] * 0.55 + src[o + 2] * 0.15) * a + 20 * (1 - a); }
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const a = lum[j * fw + Math.max(0, i - 1)], b = lum[j * fw + i], c = lum[j * fw + Math.min(fw - 1, i + 1)]; tmp[j * fw + i] = (a + 2 * b + c) / 4; }
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const a = tmp[Math.max(0, j - 1) * fw + i], b = tmp[j * fw + i], c = tmp[Math.min(fh - 1, j + 1) * fw + i]; lum[j * fw + i] = (a + 2 * b + c) / 4; }
  }
  const nk = keep.length, kf = new Float32Array(nk * 4); keep.forEach((e, i) => kf.set(e, i * 4));
  const bristle = new Float32Array(7), sc = Math.max(0.75, S), sw = Math.max(0.5, S);
  for (let pass = 0; pass < 2; pass++) {
    const detail = pass === 1, step = (detail ? 6.5 : 10) * sc, l0 = (detail ? 5 : 12) * sw, l1 = (detail ? 10 : 24) * sw, w0 = (detail ? 1.6 : 3.6) * sw, w1 = (detail ? 2.8 : 6) * sw, a0 = (detail ? 0.45 : 0.5) * amount;
    const yEnd = edge ? lerp(edge.y0, edge.y1, 0.6) : H;   // (no strokes where the bust has faded out)
    for (let y0 = step / 2; y0 < yEnd; y0 += step) for (let x0 = step / 2; x0 < W; x0 += step) {
      const ra = r(), rb = r(), cx0 = clamp(x0 + (ra - 0.5) * step, 0, W - 1), cy0 = clamp(y0 + (rb - 0.5) * step, 0, H - 1);
      const o = ((cy0 | 0) * W + (cx0 | 0)) * 4; if (src[o + 3] < 140 || src[o] + src[o + 1] + src[o + 2] < 36) continue;   // (nothing to see in the deepest darks)
      const fi = clamp((cx0 / k) | 0, 1, fw - 2), fj = clamp((cy0 / k) | 0, 1, fh - 2), gx = lum[fj * fw + fi + 1] - lum[fj * fw + fi - 1], gy = lum[(fj + 1) * fw + fi] - lum[(fj - 1) * fw + fi], mag = Math.sqrt(gx * gx + gy * gy);
      let kp = 0; for (let e = 0; e < nk * 4; e += 4) { const qx = (cx0 - kf[e]) / kf[e + 2], qy = (cy0 - kf[e + 1]) / kf[e + 3], q = qx * qx + qy * qy; if (q < 1 && 1 - q * q > kp) kp = 1 - q * q; }
      if (detail && mag < 7 && kp === 0) continue;             // small strokes only where there is something to say
      // the way: across the gradient where there is one; else the painter's habitual slant, wandering a little
      const ang = (mag > 3 ? Math.atan2(gy, gx) + Math.PI / 2 : hatch + Math.sin(cx0 * 0.013 + cy0 * 0.007) * 0.5) + (r() - 0.5) * (mag > 3 ? 0.35 : 0.6);
      const len = lerp(l0, l1, r()) * (1 - 0.65 * kp) / (1 + mag * 0.012), alpha = a0 * (1 - 0.55 * kp), ux = Math.cos(ang), uy = Math.sin(ang);
      const c0 = src[o], c1 = src[o + 1], c2 = src[o + 2];
      // cut short where the tone ahead (or behind) differs too much from what the brush carries
      let la = len / 2, lb = len / 2;
      for (let sgn = 1; sgn >= -1; sgn -= 2) for (let st = 0.25; st <= 1.001; st += 0.25) {
        const x = clamp((cx0 + ux * sgn * len * 0.5 * st) | 0, 0, W - 1), y = clamp((cy0 + uy * sgn * len * 0.5 * st) | 0, 0, H - 1), q = (y * W + x) * 4;
        if (Math.abs(src[q] - c0) + Math.abs(src[q + 1] - c1) + Math.abs(src[q + 2] - c2) + (255 - src[q + 3]) * 0.5 > 70) { if (sgn > 0) la = len * 0.5 * (st - 0.2); else lb = len * 0.5 * (st - 0.2); break; }
      }
      if (la + lb < 1.5) continue;
      // broken colour: the load a little lighter or darker, warmer or cooler
      const lumC = (c0 + c1 + c2) / 765, v = 1 + (r() - 0.5) * 0.22 * amount, wc = (r() - 0.5) * 2 * (7 + 64 * lumC * (1 - lumC)) * amount;
      for (let bb = 0; bb < 7; bb++) bristle[bb] = 0.35 + 0.65 * r();
      rasterStroke(d, W, H, cx0, cy0, ux, uy, la, lb, lerp(w0, w1, r()) / 2, alpha, clamp(c0 * v + wc, 0, 255), clamp(c1 * v + wc * 0.25, 0, 255), clamp(c2 * v - wc * 0.7, 0, 255), bristle);
    }
  }
  if (edge) {
    // the silhouette softened (alpha times its own blur, at quarter size) and the bust fading out between edge.y0 and y1
    const ea = new Float32Array(fw * fh);
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) ea[j * fw + i] = d[(Math.min(H - 1, j * k + 2) * W + Math.min(W - 1, i * k + 2)) * 4 + 3] / 255;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) tmp[j * fw + i] = (ea[j * fw + Math.max(0, i - 1)] + ea[j * fw + i] + ea[j * fw + Math.min(fw - 1, i + 1)]) / 3;
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) ea[j * fw + i] = (tmp[Math.max(0, j - 1) * fw + i] + tmp[j * fw + i] + tmp[Math.min(fh - 1, j + 1) * fw + i]) / 3;
    }
    for (let y = 0; y < H; y++) {
      const fy = clamp((y - 2) / k, 0, fh - 1.001), j = fy | 0, by = fy - j, fade = 1 - smooth(edge.y0, edge.y1, y), row = y * W * 4;
      for (let x = 0; x < W; x++) {
        const q = row + x * 4; if (d[q + 3] === 0) continue;
        const fx = clamp((x - 2) / k, 0, fw - 1.001), i = fx | 0, bx = fx - i, o = j * fw + i;
        const m = (ea[o] * (1 - bx) + ea[o + 1] * bx) * (1 - by) + (ea[o + fw] * (1 - bx) + ea[o + fw + 1] * bx) * by;
        d[q + 3] *= Math.min(1, m * 1.15) * fade;
      }
    }
  }
  ctx.putImageData(im, 0, 0);
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
  let H = female ? 188 : 206, W = H * (female ? 0.72 : 0.67);
  if (shape === "long") { H *= 1.05; W *= 0.9; } else if (shape === "round") { W *= 1.07; H *= 0.98; } else if (shape === "square") W *= 1.03; else if (shape === "heart") W *= 1.0;
  W *= 1 - thin * 0.04;
  const R = W / 2, cx = 256 - sphi * 18, top = 112, tilt = L.pose.tilt || 0;
  const jaw = ({ soft: 0.78, firm: 0.85, narrow: 0.77, heavy: 0.93, square: 0.9 }[L.face.jaw] ?? 0.84) - (female ? 0.08 : 0) + (shape === "square" ? 0.04 : 0) - (shape === "heart" ? 0.08 : 0) - thin * 0.02 + old * 0.03;
  const chin = ({ soft: 0.36, firm: 0.4, narrow: 0.32, heavy: 0.44, square: 0.46 }[L.face.jaw] ?? 0.36) * (female ? 0.85 : 1);
  const hollow = Math.max(0, thin) * 0.05 + old * 0.02;
  const knots = [[0, 0.02], [0.05, 0.5], [0.12, 0.76], [0.22, 0.9], [0.34, 0.97], [0.46, 0.985], [0.56, 1.0 - young * 0.0], [0.66, 0.96 - hollow + young * 0.02], [0.76, lerp(0.96, jaw, 0.5) + young * 0.03], [0.85, jaw * 0.94], [0.92, lerp(jaw, chin, 0.5)], [0.975, chin * 0.95], [1.0, 0.0]];
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
  const smirk = ex === "insolent" ? 1 : 0;
  // what the face does, in the painter's terms: lid (the upper lids lowered), lidR (one more than the other), lower
  // (the lower lids raised), wide, gx/gy (the gaze, as a share of the eye), browIn (the inner ends of the brows up,
  // the worried look), browL/browR (a brow raised), knit (drawn together), outerDrop (the outer ends sinking, tired),
  // press (lips pressed thin), down (the corners down), smirk (one corner up), pout (the lower lip pushed out)
  const E = { lid: 0.15, lidR: 0, lower: 0, wide: 0, gx: 0, gy: 0, browIn: 0, browL: 0, browR: 0, knit: 0, outerDrop: 0, press: 0.2, down: 0.1, smirk: 0, pout: 0,
    ...({ wary: { lid: 0, wide: 1, gx: -0.3, gy: -0.05, browIn: 0.7, knit: 0.6, press: 0.6, down: 0.2, lower: 0.15 },
      composed: { lid: 0.2, press: 0.3, down: 0.15, browL: 0.1 },
      insolent: { lid: 0.45, lidR: 0.08, lower: 0.25, gx: 0.05, gy: 0.12, browR: 0.9, browL: -0.2, press: 0, down: -0.1, smirk: 1, pout: 0.5 },
      weary: { lid: 0.42, lower: -0.1, gy: 0.18, gx: 0.12, browIn: 0.55, outerDrop: 1, press: 0.1, down: 0.55, pout: 0.2 },
      grieving: { lid: 0.3, gy: 0.25, browIn: 1, knit: 0.5, outerDrop: 0.6, down: 0.8 } }[ex] || {}) };

  // ---- the body ----
  const nbY = Y(1) + H * (female ? 0.17 : 0.08), ncx = cx + sh(1) * 0.45;    // the base of the neck
  const shW = W * (female ? 1.02 : 1.2) * (1 - thin * 0.07);
  const body = [[ncx - shW * 1.5, 700], [ncx - shW * 1.42, nbY + H * 0.75], [ncx - shW * 1.3, nbY + H * 0.4], [ncx - shW * 1.08, nbY + H * 0.2], [ncx - shW * 0.7, nbY + H * 0.08], [ncx - W * 0.25, nbY], [ncx + W * 0.25, nbY], [ncx + shW * 0.7, nbY + H * 0.09], [ncx + shW * 1.08, nbY + H * 0.22], [ncx + shW * 1.3, nbY + H * 0.42], [ncx + shW * 1.42, nbY + H * 0.78], [ncx + shW * 1.5, 700]];
  const bodyPath = () => { g.beginPath(); curve(g, body, false); g.lineTo(ncx + shW * 2, 720); g.lineTo(ncx - shW * 2, 720); g.closePath(); };
  // hair behind the shoulders (long hair, the back of a periwig)
  const hairStyle = L.hair.style;

  const drawBody = () => {
    g.save(); bodyPath(); g.fillStyle = css(cloth); g.fill(); g.clip();
    // the cloth's own way with light: broadcloth and wool soak it up and show the form in broad soft lights, folds as
    // gentle valleys; silk throws it back in narrow bright ridges along every fold, with a cooler glow round them
    const hi = mix(cloth, [255, 246, 230], silk ? 0.5 : 0.2), lo = mix(cloth, [0, 0, 0], 0.62), glow = mix(cloth, [214, 222, 236], silk ? 0.32 : 0.12);
    const fab = silk ? { ridge: 0.4, rw: 3.5, glow: 0.3, gw: 20, trough: 0.4, tw: 22 } : { ridge: 0.12, rw: 12, glow: 0.12, gw: 24, trough: 0.38, tw: 24 };
    // a fold: a valley in shadow and, on the side toward the window, the ridge that catches the light
    const fold = (pts0, depth = 1, lit = 1) => {
      // drapery never runs quite straight: each stretch bows a little, one way or the other
      const pts = [pts0[0]]; for (let i = 1; i < pts0.length; i++) { const [ax, ay] = pts0[i - 1], [bx, by] = pts0[i], dl = Math.hypot(bx - ax, by - ay) || 1, o = (r() - 0.5) * dl * 0.14; pts.push([(ax + bx) / 2 - (by - ay) / dl * o, (ay + by) / 2 + (bx - ax) / dl * o], pts0[i]); }
      feather(g, pts, lo, fab.trough * depth, fab.tw * (0.7 + 0.3 * depth));
      const rp = pts.map(([x, y]) => [x - fab.tw * 0.55, y - 2]);
      if (lit > 0.05) { feather(g, rp, glow, fab.glow * depth * lit, fab.gw); feather(g, rp, hi, fab.ridge * depth * lit, fab.rw); }
    };
    // the round of the shoulders and breast under the light from the upper left; the far side falls away
    dab(g, ncx - shW * 0.95, nbY + H * 0.28, shW * 0.62, H * 0.32, hi, silk ? 0.5 : 0.42);
    dab(g, ncx - shW * 0.3, nbY + H * 0.8, shW * 0.7, H * 0.5, hi, silk ? 0.22 : 0.18);
    dab(g, ncx + shW * 0.95, nbY + H * 0.3, shW * 0.45, H * 0.22, hi, silk ? 0.25 : 0.12);
    { const gr = g.createLinearGradient(ncx + shW * 0.1, 0, ncx + shW * 1.5, 0); gr.addColorStop(0, css([0, 0, 0], 0)); gr.addColorStop(1, css([0, 0, 0], 0.55)); g.fillStyle = gr; g.fillRect(ncx, nbY - 10, shW * 2, 400); }
    for (const s2 of [-1, 1]) {
      const lit = s2 < 0 ? 1 : 0.35;
      // where the arm meets the body: a deep crease from the armpit down
      const ax = ncx + s2 * shW * 0.98, ay = nbY + H * 0.55;
      feather(g, [[ax, ay], [ax - s2 * shW * 0.03, nbY + H * 0.95], [ax - s2 * shW * 0.05, 690]], lo, 0.55, 9);
      // the sleeve hangs from the shoulder: folds running down from the shoulder's point, gathering toward the armpit
      for (let k = 0; k < 3; k++) {
        const t = k / 2, sx = ncx + s2 * shW * (1.02 + 0.14 * t), sy = nbY + H * (0.3 + 0.12 * t), ex2 = ncx + s2 * shW * (1.06 + 0.2 * t + r() * 0.06), ey2 = nbY + H * (0.85 + 0.25 * t + r() * 0.15);
        fold([[sx, sy], [lerp(sx, ex2, 0.5) - s2 * 4 * (1 - t), lerp(sy, ey2, 0.5)], [ex2, ey2]], 0.55 + 0.25 * r(), lit);
      }
      // across the breast, the cloth drawn toward the arm: long shallow folds from under the collar, out and down
      for (let k = 0; k < 2; k++) {
        const x0 = ncx + s2 * shW * (0.35 + k * 0.25 + r() * 0.08), y0 = nbY + H * (0.45 + r() * 0.12);
        fold([[x0, y0], [x0 + s2 * shW * 0.12, y0 + H * 0.45], [x0 + s2 * shW * (0.14 + r() * 0.08), 690]], 0.5 + 0.3 * r(), lit * 0.8);
      }
    }
    // what the dress says: a lawyer's gown and its facings; a doublet's buttons; a woman's sleeves and stomacher
    if (L.dress.collar === "lawyer's bands") for (const s2 of [-1, 1]) {
      const fx = ncx + s2 * W * 0.3;
      g.fillStyle = css(mix(cloth, [255, 255, 255], 0.06)); g.beginPath(); g.moveTo(fx, nbY + H * 0.05); g.lineTo(fx + s2 * W * 0.18, nbY + H * 0.1); g.lineTo(fx + s2 * W * 0.24, 700); g.lineTo(fx + s2 * W * 0.04, 700); g.closePath(); g.fill();
      feather(g, [[fx, nbY + H * 0.05], [fx + s2 * W * 0.02, 700]], lo, 0.6, 3);
      feather(g, [[fx + s2 * W * 0.2, nbY + H * 0.12], [fx + s2 * W * 0.25, 700]], s2 < 0 ? hi : lo, 0.45, 4);
      // the gown's long folds, hanging straight from the shoulders
      for (let k = 0; k < 2; k++) { const x0 = fx + s2 * W * (0.42 + k * 0.28); fold([[x0, nbY + H * 0.4], [x0 + s2 * 3, nbY + H * 0.9], [x0 + s2 * 8, 690]], 0.7, s2 < 0 ? 1 : 0.3); }
    }
    if (!female && L.dress.collar !== "lawyer's bands") for (let k = 0; k < 4; k++) {
      const by = nbY + H * (0.62 + k * 0.17);
      fold([[ncx - 4, by - H * 0.08], [ncx - 6, by]], 0.25, 0.6);    // the pull of each button
      dab(g, ncx + 1, by + 1, 3.6, 3.6, mix(cloth, [0, 0, 0], 0.6), 0.85); dab(g, ncx, by, 3, 3, mix(cloth, [255, 240, 210], silk ? 0.25 : 0.12), 0.9); dab(g, ncx - 1, by - 1, 1.1, 1.1, mix(cloth, [255, 246, 230], silk ? 0.7 : 0.35), 0.9);
    }
    if (female) {
      // the bodice and its stomacher, a long point down the breast, stiff with boning: lights running down it
      g.fillStyle = css(mix(cloth, [0, 0, 0], 0.12)); g.beginPath(); g.moveTo(ncx - W * 0.45, nbY + H * 0.46); g.quadraticCurveTo(ncx - W * 0.22, nbY + H * 1.2, ncx, 700); g.quadraticCurveTo(ncx + W * 0.22, nbY + H * 1.2, ncx + W * 0.45, nbY + H * 0.46); g.closePath(); g.fill();
      for (const s2 of [-1, 1]) feather(g, [[ncx + s2 * W * 0.44, nbY + H * 0.48], [ncx + s2 * W * 0.22, nbY + H * 1.1], [ncx + s2 * W * 0.05, 700]], s2 < 0 ? hi : lo, 0.5, 2.5);
      feather(g, [[ncx - W * 0.22, nbY + H * 0.5], [ncx - W * 0.12, nbY + H * 1.0], [ncx - W * 0.04, 690]], glow, 0.35, 10);
      feather(g, [[ncx - W * 0.2, nbY + H * 0.52], [ncx - W * 0.11, nbY + H * 1.0], [ncx - W * 0.04, 690]], hi, 0.6, 2.2);
      // the full sleeves, puffed and caught up: each a round of satin, its folds curving round the arm, the lights
      // sharp along their ridges, brightest on the near shoulder
      for (const s2 of [-1, 1]) {
        const px = ncx + s2 * shW * 1.12, py = nbY + H * 0.62, rx = shW * 0.36, ry = H * 0.5, lit = s2 < 0 ? 1 : 0.3;
        dab(g, px, py, rx * 1.1, ry * 1.05, mix(cloth, [0, 0, 0], 0.3), 0.6);
        dab(g, px - s2 * rx * 0.1 - rx * 0.2, py - ry * 0.2, rx * 0.8, ry * 0.7, glow, 0.45 * lit + 0.1);
        for (let k = 0; k < 5; k++) {
          const a0 = -1.2 + k * 0.55 + (r() - 0.5) * 0.2, x0 = px + Math.cos(a0) * rx * 0.2 * s2, y0 = py - ry * 0.85;
          const pts = [[x0, y0], [px + s2 * Math.sin(a0) * rx * 0.85, py - ry * 0.1 + Math.cos(a0) * 6], [px + s2 * Math.sin(a0) * rx * 0.6, py + ry * 0.8]];
          fold(pts, 0.7 + 0.3 * r(), lit * (0.5 + 0.5 * Math.max(0, -Math.sin(a0) * s2 + 0.4)));
        }
      }
    }
    g.restore();
  };

  const neckW = W * (female ? 0.42 : 0.5) * (1 - thin * 0.08);
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
    const step = 3 / S;   // design px per cell (~3 canvas px)
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
    for (let k = 0; k <= 6; k++) { const t = k / 6, v = lerp(0.47, vB - 0.03, t); add(X(0, v) + R * lerp(0.05, 0.36, t) * nl * sphi * 0.6, Y(v), R * (0.07 + t * 0.02), H * 0.04, R * lerp(0.07, female ? 0.18 : 0.22, t) * nl); }   // the bridge
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
    const Lx = -0.42, Ly = -0.46, Lz = 0.78, wrap = female ? 0.28 : 0.34;    // toward the window: left, above, in front
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
      if (head || y0 + j * step < Y(1) + H * 0.45) for (let st = 1; st <= 7; st++) { const d = st * 1.85, zt = zAt(i + ux * d, j + uy * d), over = zt - (z0 + d * step * tan); if (over > 0) shadow = Math.max(shadow, Math.min(1, over / (R * (0.08 + 0.025 * d)))); }
      let t = (ndl + wrap) / (1 + wrap); t = t * (1 - 0.34 * shadow) + 0.035 * (vnoise(i * step / 7, j * step / 7) - 0.5) + 0.02 * (vnoise(i * step / 2.5 + 40, j * step / 2.5) - 0.5);
      t = t * 0.93 + 0.03 + (neck ? -0.05 : 0);
      if (head) { const vv = (y0 + j * step - top) / H; t *= 1 - 0.18 * smooth(0.95, 1.0, vv); }
      let c = shade(t);
      const spec = Math.pow(Math.max(0, (nx2 * hx2 + ny2 * hy2 + nz2 * hzv) / hn), 26) * (1 - shadow) * 0.28;
      if (spec > 0.01) c = mix(c, [255, 248, 236], spec);
      const x = x0 + i * step, y = y0 + j * step;
      if (head) for (let q = 0; q < tints.length; q++) { const tn = tints[q], ex2 = (x - tn[0]) / tn[2]; if (ex2 > 3 || ex2 < -3) continue; const ey2 = (y - tn[1]) / tn[3], d2 = ex2 * ex2 + ey2 * ey2; if (d2 < 9) { const m2 = tn[5] * Math.exp(-0.5 * d2), tc = tn[4], kk = 0.35 * (1 - t); c = [lerp(c[0], lerp(tc[0], c[0], kk), m2), lerp(c[1], lerp(tc[1], c[1], kk), m2), lerp(c[2], lerp(tc[2], c[2], kk), m2)]; } }
      const im = head ? headImg : neckImg, o = k * 4; im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255 * Math.min(1, A[k]);
    } }
    // a light blur over the cells (3 x 3, among cells that are flesh), so the turn of the form at the jaw does not step
    const soften = (im) => { const D = im.data, C = D.slice(); for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) { const o = (j * gw + i) * 4; if (!C[o + 3]) continue; let r0 = 0, g0 = 0, b0 = 0, n = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const q = o + (dj * gw + di) * 4; if (C[q + 3]) { const wq = di || dj ? 1 : 2; r0 += C[q] * wq; g0 += C[q + 1] * wq; b0 += C[q + 2] * wq; n += wq; } } D[o] = r0 / n; D[o + 1] = g0 / n; D[o + 2] = b0 / n; } };
    soften(headImg); soften(neckImg);
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
    g.imageSmoothingQuality = "low"; g.drawImage(skin.neck, skin.x0 - skin.step / 2, skin.y0 - skin.step / 2, skin.w, skin.h);
    // the jaw's shadow across the throat, soft, deepest under the chin and on the side away from the window
    { const y0 = Y(0.9), y1 = Y(1) + H * (female ? 0.22 : 0.3), gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, css(mix(sS, sD, 0.2), 0.5)); gr.addColorStop(0.6, css(sS, 0.36)); gr.addColorStop(1, css(sS, female ? 0 : 0.2)); g.fillStyle = gr; g.fillRect(nx - neckW * 2, y0, neckW * 4, y1 - y0);
      if (female) {   // the breast turning from the light, the hollow at the base of the throat, the collarbones
        const gc = g.createLinearGradient(nx - shW * 0.3, 0, nx + shW * 1.1, 0); gc.addColorStop(0, css(sS, 0)); gc.addColorStop(1, css(mix(sS, sD, 0.3), 0.5)); g.fillStyle = gc; g.fillRect(nx - shW * 0.3, nbY - H * 0.05, shW * 1.6, H * 0.7);
        dab(g, nx + 2, nbY + H * 0.06, neckW * 0.28, H * 0.035, sS, 0.35);
        for (const s2 of [-1, 1]) { feather(g, [[nx + s2 * neckW * 0.45, nbY + H * 0.08], [nx + s2 * shW * 0.45, nbY + H * 0.11], [nx + s2 * shW * 0.8, nbY + H * 0.1]], sS, s2 < 0 ? 0.14 : 0.22, 5); feather(g, [[nx + s2 * neckW * 0.45, nbY + H * 0.06], [nx + s2 * shW * 0.45, nbY + H * 0.09], [nx + s2 * shW * 0.8, nbY + H * 0.08]], sL, s2 < 0 ? 0.3 : 0.1, 3); }
        dab(g, nx - shW * 0.35, nbY + H * 0.3, shW * 0.3, H * 0.1, sL, 0.3);
      }
      const gx = g.createLinearGradient(nx - neckW * 0.5, 0, nx + neckW * 0.6, 0); gx.addColorStop(0, css(sS, 0)); gx.addColorStop(1, css(mix(sS, sD, 0.4), 0.45)); g.fillStyle = gx; g.fillRect(nx - neckW * 0.6, Y(0.7), neckW * 2, nbY - Y(0.7)); }
    g.restore();
  };

  // ---- collars and bands ----
  const linenL = [238, 232, 218], linenS = [150, 150, 148], linenD = [96, 94, 94];
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
      // the band stands a little off the coat: its shadow under the lower edge, deeper on the side away from the light
      for (const s of [-1, 1]) fillPath(g, half(s).map(([x, y]) => [x + 3 + s * 1, y + 4]), css(mix(cloth, [0, 0, 0], 0.5), 0.55));
      for (const s of [-1, 1]) {
        const p = half(s); linen(p, nx - cw, nx + cw);
        g.save(); g.beginPath(); curve(g, p, true); g.clip();
        // soft folds where the starched linen bends over the collarbone, falling from the neck
        for (let i = 0; i < 3; i++) { const x = nx + s * cw * (0.3 + i * 0.25 + r() * 0.06), bend = s * (4 + r() * 6); feather(g, [[x - s * 4, y0 + 8], [x + bend * 0.5, lerp(y0, y1, 0.5)], [x + bend, y1]], linenS, 0.3, 5); feather(g, [[x - s * 4 - 5, y0 + 10], [x + bend * 0.5 - 5, lerp(y0, y1, 0.5)], [x + bend - 5, y1]], [255, 252, 244], s < 0 ? 0.3 : 0.12, 3); }
        dab(g, nx + s * neckW * 0.3, y0 + 4, neckW * 0.62, H * 0.075, mix(linenD, sS, 0.3), 0.55);      // the shadow under the chin
        dab(g, nx + s * cw * 0.85, lerp(y0, y1, 0.6), cw * 0.25, H * 0.2, linenD, s > 0 ? 0.35 : 0.1);     // turning over the shoulder
        if (c === "lace collar") {   // a deep border of needle lace: a scalloped band of flowers, the coat dark through its ground
          const ly = y1 - H * 0.13;
          for (let x = nx + s * 5, n = 0; Math.abs(x - nx) < cw; x += s * 9, n++) for (let y = ly + 3, m = 0; y < y1 + 4; y += 8, m++) {
            if ((n + m) % 2) { dab(g, x, y, 3.6, 3.2, mix(linenL, linenS, x > nx ? 0.45 : 0.1), 0.85, 0, 0.4); dab(g, x, y, 1.2, 1.2, mix(cloth, [0, 0, 0], 0.4), 0.6); }
            else dab(g, x, y, 2.4, 2.2, mix(cloth, [0, 0, 0], 0.35), 0.55);
          }
          feather(g, [[nx + s * 4, ly], [nx + s * cw * 0.98, ly - 2]], linenS, 0.45, 2.2);
        }
        g.restore();
        if (c === "lace collar") for (let x = 6; x < cw; x += 10) { dab(g, nx + s * x, y1 + 2, 5.5, 4.5, mix(linenL, linenS, s > 0 ? 0.4 : 0.05), 0.8, 0, 0.3); dab(g, nx + s * x, y1 + 2.5, 1.6, 1.4, mix(cloth, [0, 0, 0], 0.3), 0.5); }     // the scalloped edge
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
    const yb = Y(hairEnd) + 4 + (hairEnd > 1.1 ? H * 0.14 : 0); hairOuter.push([cx + R * 0.3, yb + 10], [cx - R * 0.3, yb + 10]);
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
  const fallPath = (s, t, endV, wave, curly, hook = 0) => {   // from the parting, over the crown, down the side
    const p0 = [part[0] + s * (2 + t * R * 0.2), part[1] - t * H * 0.05];
    const p1 = [crownC[0] + s * crownRx * (0.62 + 0.33 * t), Y(0.1 + 0.1 * (1 - t))];
    const vv = Math.min(endV, 1), p2 = [cx + s * (hw(0.55) * 0.92 + R * sideOut(0.55) * (0.25 + 0.9 * t)) + sh(0.55) * 0.3, Y(0.55)];
    const p3 = [cx + s * (Math.max(hw(vv), R * 0.85) + R * sideOut(endV) * (0.1 + 0.95 * t)) + sh(vv) * 0.3, Y(endV)];
    const pts = [], k = 16, ph = r() * 6, fq = curly ? 13 + r() * 4 : 5;
    for (let j = 0; j <= k; j++) {
      const q = j / k, a = (1 - q) ** 3, b = 3 * q * (1 - q) ** 2, c = 3 * q * q * (1 - q), d = q ** 3;
      let x = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], y = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
      x += Math.sin(q * fq + ph) * wave * smooth(0.35, 0.8, q) * (curly ? 7 : 3); pts.push([x, y]);
    }
    if (hook) {   // the end turned up in a loose curl
      let [ex0, ey0] = pts[k], ang = Math.atan2(ey0 - pts[k - 1][1], ex0 - pts[k - 1][0]); const rad = R * (0.06 + 0.04 * r());
      for (let m = 0; m < 5; m++) { ang += hook * 0.62; ex0 += Math.cos(ang) * rad * 0.62; ey0 += Math.sin(ang) * rad * 0.62; pts.push([ex0, ey0]); }
    }
    pts.ph = ph; pts.fq = fq; return pts;
  };
  // a lock's light: along its length on straight hair; on waved hair only on the crests that turn toward the window
  const lockLight = (pts, s, lit, curly, w0) => {
    if (lit <= 0.06) return;
    // (two strengths, a path apiece: a stroke per segment cost ~3 ms a painting)
    g.lineCap = "round"; const n = pts.length, P = [new Path2D(), new Path2D()];
    for (let i = 1; i < n - 1; i++) {
      const q = i / 16, crest = curly ? Math.sin(q * pts.fq + pts.ph + 1.3) : 0.6 + 0.4 * Math.sin(q * 9 + pts.ph);
      if (crest < 0.15) continue;
      const a = pts[i], b = pts[i + 1], p = P[crest > 0.6 ? 1 : 0]; p.moveTo(a[0] - s * 1.5, a[1]); p.lineTo(b[0] - s * 1.5, b[1]);
    }
    for (const k of [0, 1]) { g.lineWidth = w0 * (0.6 + 0.4 * k); g.strokeStyle = css(hairLight, Math.min(1, 0.8 * lit * lit * (0.4 + 0.55 * k))); g.stroke(P[k]); }
  };
  // a hanging ringlet: a dark core, and on it each turn of the curl as a band across the tube, lit where it comes
  // round toward the window, the glints of the turns lining up down the lit side; tapering to a flicked tip
  const ringlet = (x, y, len, rad, lit, sway) => {
    const n = Math.max(3, Math.round(len / (rad * 1.25))), ph = r() * 6, pitch = len / n;
    const ax = (q) => [x + sway * q * q + Math.sin(q * 2.5 + ph) * rad * 0.3, y + q * len];
    feather(g, [ax(0), ax(0.35), ax(0.7), ax(1)], mix(hairDark, [0, 0, 0], 0.35), 1, rad * 1.15);
    const band = mix(hairDark, hairC, 0.45 + 0.4 * lit), glint = mix(hairC, hairLight, 0.5 + 0.5 * lit);
    g.lineCap = "round";
    // (the turns go in four paths, two of bands and two of glints, a little different: a stroke apiece cost ~4 ms)
    const BP = [new Path2D(), new Path2D()], GP = [new Path2D(), new Path2D()];
    for (let k = 0; k < n; k++) {
      // each turn the front half of a coil: a sagging arc across the tube, its left end (toward the window) lit
      const q = (k + 0.5) / n, [px, py] = ax(q), rr = rad * (1 - 0.4 * q), j = r() < 0.5 ? 0 : 1, sag = pitch * (0.42 + 0.12 * r()), tl = -0.22;
      const P = (u) => { const a = Math.PI * u, ex = -Math.cos(a) * rr, ey = Math.sin(a) * sag - pitch * 0.15; return [px + ex * Math.cos(tl) - ey * Math.sin(tl), py + ex * Math.sin(tl) + ey * Math.cos(tl)]; };
      const bp = BP[j]; bp.moveTo(...P(0.02)); for (const u of [0.25, 0.5, 0.75, 0.98]) bp.lineTo(...P(u));
      const gp = GP[r() < 0.6 ? 1 : 0]; gp.moveTo(...P(0.1)); gp.lineTo(...P(0.24)); gp.lineTo(...P(0.36));
    }
    for (const j of [0, 1]) { g.lineWidth = pitch * (0.42 + 0.08 * j); g.strokeStyle = css(mix(band, j ? hairC : hairDark, 0.12), 0.95); g.stroke(BP[j]); }
    for (const j of [0, 1]) { g.lineWidth = pitch * 0.17; g.strokeStyle = css(glint, (0.3 + 0.55 * lit) * (0.55 + 0.45 * j)); g.stroke(GP[j]); }
    const [tx, ty] = ax(1); feather(g, [[tx - rad * 0.3, ty - pitch * 0.2], [tx + rad * 0.2, ty + pitch * 0.5], [tx + rad * 0.6, ty + pitch * 0.4]], band, 0.7, rad * 0.25);
  };

  const drawHairBack = () => {
    if (hairStyle === "ringlets") { const pts = []; for (let a = Math.PI * 0.9; a <= Math.PI * 2.1; a += Math.PI / 14) pts.push([crownC[0] + Math.cos(a) * crownRx, crownC[1] + Math.sin(a) * crownRy]); fillPath(g, pts, css(hairDark)); return; }
    fillPath(g, hairOuter, css(mix(hairDark, [0, 0, 0], 0.25)));
    dab(g, cx + R * 1.1, Y(1.1), R * 0.8, H * 0.5, [0, 0, 0], 0.4);
  };

  const main0 = () => g.getTransform();
  const drawHairFront = () => {
    const curly = /curl|periwig/.test(hairStyle), ring = hairStyle === "ringlets";
    // painted unclipped on a sheet of its own, then cut to shape once (clipping every stroke costs ~20 ms)
    const xs = hairOuter.map((p) => p[0]), ys = hairOuter.map((p) => p[1]);
    const m0 = main0(), bx0 = Math.min(...xs) - 30, by0 = Math.min(...ys) - 20, bx1 = Math.max(...xs) + 30, by1 = Math.max(...ys) + 30;
    const p0 = m0.transformPoint(new DOMPoint(bx0, by0)), p1 = m0.transformPoint(new DOMPoint(bx1, by1));
    const sx0 = Math.floor(Math.min(p0.x, p1.x)) - 20, sy0 = Math.floor(Math.min(p0.y, p1.y)) - 20;
    const main = g, sheet = document.createElement("canvas"); sheet.width = Math.ceil(Math.abs(p1.x - p0.x)) + 40; sheet.height = Math.ceil(Math.abs(p1.y - p0.y)) + 40; g = sheet.getContext("2d");
    g.setTransform(new DOMMatrix([1, 0, 0, 1, -sx0, -sy0]).multiply(m0));
    g.save();
    // the mass, lit from the left; on long hair it thins out below, so the ends are the locks' own tips
    g.fillStyle = css(hairDark); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    dab(g, cx - R * 0.55, Y(0.2), R * 1.0, H * 0.32, mix(hairC, hairLight, 0.2), 0.8);
    dab(g, cx - R * 1.05, Y(0.75), R * 0.55, H * 0.6, hairC, 0.55);
    dab(g, cx + R * 1.1, Y(0.75), R * 0.6, H * 0.7, [0, 0, 0], 0.4);
    if (hairEnd > 1.1) { g.globalCompositeOperation = "destination-out"; const fe = g.createLinearGradient(0, Y(hairEnd - 0.22), 0, Y(hairEnd - 0.04)); fe.addColorStop(0, "rgba(0,0,0,0)"); fe.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = fe; g.fillRect(bx0, Y(hairEnd - 0.22), bx1 - bx0, by1 - Y(hairEnd - 0.22)); g.globalCompositeOperation = "source-over"; }
    // locks, back to front: the outer ones first, those framing the face last
    const nl = curly ? 30 : ring ? 18 : 28;
    for (let i = 0; i < nl; i++) {
      const s = i % 2 ? 1 : -1, t = 1 - i / nl + (r() - 0.5) * 0.2;
      const endV = ring ? lerp(0.36, 0.44, r()) : lerp(0.62, hairEnd + 0.04, Math.pow(r(), 0.45));
      const pts = fallPath(s, clamp(t, 0, 1), endV, curly ? 1.2 : ring ? 0.1 : 0.6, curly, curly && endV > 1 && r() < 0.7 ? -s : 0);
      const w0 = R * (0.07 + r() * 0.07);
      lock(pts.map(([x, y]) => [x + s * 3, y + 1.5]), w0 * 0.85, mix(hairDark, [0, 0, 0], 0.45), 0.4);
      lock(pts, w0, mix(hairDark, hairC, 0.3 + r() * 0.7), 0.7);
      if (r() < (grey * 0.7)) lock(pts.map(([x, y]) => [x + (r() - 0.5) * 3, y]), R * 0.03, [196, 192, 184], 0.35);
      const pm = pts[pts.length >> 2], lit = clamp(1.05 - Math.hypot(pm[0] - (cx - R * 0.6), pm[1] - Y(0.28)) / (R * 2.4), 0, 1);
      lockLight(pts, s, lit, curly, 1.3 + r() * 2.2);
    }
    // fine strands over all
    { const FS = [new Path2D(), new Path2D(), new Path2D()];    // grey, light, mid: a path apiece
      for (let i = 0; i < 30; i++) { const s = r() < 0.5 ? -1 : 1, pts = fallPath(s, r(), ring ? 0.4 : lerp(0.5, hairEnd, r()), curly ? 1.1 : 0.5, curly); curve(FS[r() < grey ? 0 : r() < 0.5 ? 1 : 2], pts); }
      g.lineWidth = 0.85; [[[214, 210, 202], 0.5], [mix(hairC, hairLight, 0.6), 0.32], [mix(hairC, hairLight, 0.2), 0.32]].forEach(([c, a], k) => { g.strokeStyle = css(c, a); g.stroke(FS[k]); }); }
    // the sheen on the crown, where the window falls on it
    feather(g, [[crownC[0] - crownRx * 0.85, crownC[1] - crownRy * 0.35], [crownC[0] - crownRx * 0.55, crownC[1] - crownRy * 0.8], [crownC[0] - crownRx * 0.1, crownC[1] - crownRy * 0.97]], hairLight, ring ? 0.4 : 0.25, 5);
    g.restore();
    g.globalCompositeOperation = "destination-in"; g.beginPath(); curve(g, hairOuter, true); g.fill();
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.beginPath(); curve(g, opening(), true); g.fill();
    { const low = face.filter(([, y]) => y > Y(0.6)); g.beginPath(); g.moveTo(low[0][0], low[0][1]); for (const p of low) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); }   // the hair never over the lower face
    g = main; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sheet, sx0, sy0); g.restore();
    // the hair's shadow along the face's edge on the side away from the light, so face and hair meet softly
    g.save(); facePath(); g.clip();
    { const pts = []; for (let v = hairline + 0.04; v <= 0.95; v += 0.08) pts.push([cx + hw(v) * 0.98 + sh(v), Y(v)]); feather(g, pts, mix(hairDark, sD, 0.5), ring ? 0.35 : 0.3, R * 0.07); }
    { const pts = []; for (let v = hairline + 0.08; v <= 0.9; v += 0.08) pts.push([cx - hw(v) * 0.99 + sh(v), Y(v)]); feather(g, pts, mix(hairDark, sS, 0.5), 0.16, R * 0.05); }
    g.restore();
    // a few hairs across the hairline, so the hair lies on the brow rather than being cut out of it
    if (hairStyle !== "cropped to the collar") { const HP = [new Path2D(), new Path2D()]; for (let i = 0; i < 26; i++) { const s2 = i % 2 ? 1 : -1; curve(HP[i % 2], fallPath(s2, r() * 0.12, lerp(0.45, 0.62, r()), 0.3, false).map(([x, y]) => [x - s2 * R * 0.05, y])); } g.lineWidth = 0.8; for (const k of [0, 1]) { g.strokeStyle = css(mix(hairC, hairLight, k ? 0.1 : 0.5), 0.3); g.stroke(HP[k]); } }
    else for (let i = 0; i < 13; i++) {   // the fringe: locks combed forward over the brow, ending in points
      const u = -0.78 + i * 0.13 + (r() - 0.5) * 0.05, s2 = u < 0 ? -1 : 1, v1 = 0.285 + r() * 0.03 + Math.abs(u) * 0.03;
      const pts = [[X(u * 0.8, 0.12), Y(0.12)], [X(u * 0.95, 0.2), Y(0.2)], [X(u + s2 * 0.03, 0.25), Y(0.25)], [X(u + s2 * 0.06 + (r() - 0.5) * 0.04, v1), Y(v1)]];
      const lit = clamp(0.8 - (u + 0.6) * 0.6, 0.1, 1);
      lock(pts.map(([x, y]) => [x + 1.5, y + 2]), R * 0.07, mix(hairDark, sD, 0.3), 0.35);
      lock(pts, R * (0.075 + r() * 0.03), mix(hairDark, hairC, 0.45 + 0.5 * lit), 0.9);
      g.lineCap = "round"; g.lineWidth = 1.2 + r(); g.strokeStyle = css(hairLight, 0.55 * lit); g.beginPath(); curve(g, pts.slice(0, 3).map(([x, y]) => [x - 1.5, y])); g.stroke();
    }
    if (ring) {   // bunches of ringlets at either side of the face, from the temples down to the neck
      for (const s of [1, -1]) {
        const edge = (v) => cx + sh(Math.min(v, 1)) * 0.4 + s * hw(Math.min(v, 0.62)) * 0.97;
        dab(g, edge(0.5) + s * R * 0.24, Y(0.55), R * 0.36, H * 0.24, mix(hairDark, [0, 0, 0], 0.3), 0.9, 0, 0.55);
        const lit = (t) => s < 0 ? 1 - t * 0.5 : 0.22 + 0.1 * (1 - t);
        // the upper curls, short and close, then the long ones hanging in front of them; the innermost last
        for (let i = 4; i >= 0; i--) { const t = i / 4; ringlet(edge(0.4) + s * R * (0.02 + t * 0.4), Y(0.36 + t * 0.06 + r() * 0.03), H * (0.16 + r() * 0.06), R * (0.1 + r() * 0.02), lit(t), (r() - 0.5) * 6 + s * 4); }
        for (let i = 4; i >= 0; i--) { const t = i / 4; ringlet(edge(0.5) + s * R * (-0.02 + t * 0.36), Y(0.5 + r() * 0.06), H * (0.34 + r() * 0.16 - t * 0.05), R * (0.105 + r() * 0.025), lit(t) * 0.9, (r() - 0.5) * 10 + s * 6 * t); }
      }
    }
    // loose hairs off the silhouette, catching the light on the window side, so it is not cut out
    g.save(); g.lineCap = "round";
    const FP = [new Path2D(), new Path2D()];
    for (let i = 0; i < 22; i++) {
      // a stray hair leaves the mass going the way the hair falls (along the silhouette, down and out), bowing away
      const k = 1 + Math.floor(r() * (hairOuter.length - 4)), p = hairOuter[k], q = hairOuter[k + 1], side = p[0] < cx ? -1 : 1;
      if (p[1] > Y(Math.min(hairEnd, 1.2)) - 6) continue;
      let tx = q[0] - p[0], ty = q[1] - p[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; if (ty < 0) { tx = -tx; ty = -ty; }
      const nx2 = side * Math.abs(ty), ny2 = -side * tx * side * 0.3, len = 9 + r() * 16, bow = 3 + r() * 6;
      const fp = FP[side < 0 ? 0 : 1]; fp.moveTo(p[0] - nx2 * 3, p[1]); fp.quadraticCurveTo(p[0] + tx * len * 0.5 + nx2 * bow, p[1] + ty * len * 0.5 + ny2 * bow, p[0] + tx * len + nx2 * bow * 0.6, p[1] + ty * len);
    }
    g.lineWidth = 0.6; for (const k of [0, 1]) { g.strokeStyle = css(mix(hairC, hairLight, k ? 0.15 : 0.75), k ? 0.22 : 0.5); g.stroke(FP[k]); }
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
    g.save(); facePath(); g.clip(); g.imageSmoothingQuality = "low"; g.drawImage(skin.head, skin.x0 - skin.step / 2, skin.y0 - skin.step / 2, skin.w, skin.h); g.restore();
    g.save(); facePath(); g.clip();
    // the underside of the jaw turning away into the throat's shadow, so face and neck meet without a seam
    { const gr = g.createLinearGradient(0, Y(0.9), 0, Y(1)); gr.addColorStop(0, css(sS, 0)); gr.addColorStop(1, css(mix(sS, sM, 0.4), 0.45)); g.fillStyle = gr; g.fillRect(cx - R * 1.5, Y(0.9), R * 3, H * 0.1); }
    drawFeatures();
    // the hair's shadow on the brow
    dab(g, cx + mid(0.2), Y(hairline + 0.02), R * 1.1, H * 0.06, sD, 0.35);
    g.restore();
  };

  // ---- the features: eyes, brows, nose, mouth ----
  const drawFeatures = () => {
    const vE = 0.5 - (smirk ? 0.006 : 0), yE = Y(vE);
    const eyeIris = colourOf(L.face.eyes, EYES, EYES.brown);
    const ewF = R * (0.46 + young * 0.03 + (female ? 0.03 : 0) - old * 0.02);     // a frontal eye's width
    const lidDark = mix(sD, [40, 22, 16], 0.5), lash = mix(hairDark, [16, 10, 8], 0.5);
    const asym = [(r() - 0.5) * 0.08, (r() - 0.5) * 0.08];                      // no face is the same on both sides
    // the sockets: a warm shadow under the brow, round the eye, the far one deeper; with age and want of sleep, more
    for (const s of [-1, 1]) {
      const ex0 = X(s * 0.4, vE), far = s * Math.sign(phi || 1) > 0 ? 0 : 1, lit = s < 0 ? 1 : 0;
      dab(g, ex0 + s * 2, yE - H * 0.02, ewF * 0.85 * fore(s * 0.4), H * 0.055, mix(sS, [120, 72, 60], 0.35), 0.14 + far * 0.08 + old * 0.06 + tired * 0.08 + (1 - lit) * 0.06);
      dab(g, X(s * 0.17, vE - 0.015), yE - H * 0.008, R * 0.075, H * 0.04, mix(sS, [110, 70, 64], 0.3), 0.18);   // where the socket meets the nose
      dab(g, X(s * 0.42, vE + 0.055), Y(vE + 0.05), ewF * 0.52 * fore(s * 0.42), H * 0.024, tired ? [118, 82, 98] : sS, 0.1 + old * 0.12 + tired * 0.3);
      if (old > 0.3 || tired) feather(g, [[X(s * 0.22, vE + 0.05), Y(vE + 0.048)], [X(s * 0.45, vE + 0.074), Y(vE + 0.071)], [X(s * 0.66, vE + 0.052), Y(vE + 0.052)]], sS, 0.22 * Math.max(old, tired * 0.7), 2.4);
      // the brow bone catching the window above the near eye
      if (lit) dab(g, X(s * 0.45, 0.455), Y(0.455), ewF * 0.5, H * 0.018, sL, 0.3);
    }
    // the eyes
    for (const s of [-1, 1]) {
      const si = s < 0 ? 0 : 1, ui = s * 0.15, uo = s * 0.6;
      const xi = X(ui, vE), xo = X(uo, vE), xm = (xi + xo) / 2, ew = Math.abs(xo - xi), dir = Math.sign(xo - xi);
      const eh = ewF * 0.215 * (1 + asym[si]) * (1 + E.wide * 0.12), yy = yE + s * tilt * 2;
      const lidDrop = clamp(E.lid + asym[si] * 0.5 + (s > 0 ? E.lidR : 0), 0, 0.7), loRaise = E.lower;
      const hi = [xi, yy + eh * 0.12], ho = [xo, yy - eh * 0.06 + E.outerDrop * eh * 0.25];
      const upA = eh * (1 - lidDrop * 0.55), loA = eh * (0.62 - loRaise * 0.3);
      const up = (t) => [lerp(hi[0], ho[0], t), lerp(hi[1], ho[1], t) - upA * Math.sin(Math.PI * Math.pow(t, 0.78))];
      const lo = (t) => [lerp(hi[0], ho[0], t), lerp(hi[1], ho[1], t) + loA * Math.sin(Math.PI * Math.pow(t, 1.15))];
      const T5 = [0, 0.2, 0.4, 0.6, 0.8, 1], upper = T5.map(up), lower = T5.map(lo).reverse();
      // the upper lid: a band of skin over the ball, lit on the near eye; its fold above, hidden as the lid grows heavy
      const crH = eh * (0.9 + 0.5 * (1 - lidDrop)) + old * eh * 0.12;
      const crease = [0.05, 0.35, 0.7, 1.0].map((t) => { const p = up(t); return [p[0] + dir * 3 * t, p[1] - crH * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.1)))]; });
      dab(g, up(0.42)[0], yy - eh * 1.05, ew * 0.42, eh * 0.5, s < 0 ? sL : sM, s < 0 ? 0.35 : 0.2);
      feather(g, crease, mix(sS, [90, 52, 44], 0.3), 0.32 + old * 0.12 + lidDrop * 0.25, 1.8 + lidDrop * 1.5);
      if (lidDrop > 0.25) dab(g, up(0.6)[0], yy - eh * 0.75, ew * 0.42, eh * 0.35, sS, 0.25 * lidDrop);   // the heavy lid's own shadow
      // the white: never white, greyed and warmed, darker in the corners and under the lid
      g.save(); g.beginPath(); curve(g, [...upper, ...lower.slice(1, -1)], true);
      g.fillStyle = css(mix([206, 192, 178], sS, s < 0 ? 0.35 : 0.55)); g.fill(); g.clip();
      dab(g, xi, yy, ew * 0.24, eh * 1.2, mix(sS, [170, 110, 100], 0.3), 0.55); dab(g, xo, yy, ew * 0.32, eh * 1.4, sS, 0.6);
      // the iris and pupil: the iris lit through the cornea on the side away from the window, its rim dark
      const ir = ewF * 0.215 * (female ? 1.04 : 1), irx = ir * Math.min(1, 0.55 + 0.45 * fore(s * 0.38));
      const ix = xm - dir * ew * 0.03 + E.gx * ew * 0.42 - phi * ew * 0.18, iy = yy - eh * 0.08 + E.gy * eh * 0.5;
      const ig = g.createRadialGradient(ix + irx * 0.3, iy + ir * 0.35, 0, ix, iy, ir);
      ig.addColorStop(0, css(mix(eyeIris, [236, 210, 160], 0.3))); ig.addColorStop(0.5, css(eyeIris)); ig.addColorStop(0.85, css(mix(eyeIris, [10, 8, 6], 0.45))); ig.addColorStop(1, css(mix(eyeIris, [10, 8, 6], 0.75)));
      g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, irx, ir, 0, 0, TAU); g.fill();
      g.fillStyle = css([10, 7, 6]); g.beginPath(); g.ellipse(ix + irx * 0.04, iy + ir * 0.02, irx * 0.4, ir * 0.4, 0, 0, TAU); g.fill();
      // the shadow the upper lid and lashes cast on the ball
      { const gr = g.createLinearGradient(0, yy - upA - eh * 0.2, 0, yy + eh * 0.15); gr.addColorStop(0, css(lidDark, 0.85)); gr.addColorStop(0.5, css(lidDark, 0.32)); gr.addColorStop(1, css(lidDark, 0)); g.fillStyle = gr; g.fillRect(xi - ew, yy - eh * 2, ew * 3, eh * 2.4); }
      g.restore();
      // the upper lid's edge: a dark band of lashes, heaviest toward the outer corner, flicking past it
      { const top = [], bot = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8, p = up(t), th = eh * (0.1 + 0.2 * Math.pow(t, 1.3)) * (female ? 1.2 : 1); top.push([p[0], p[1] - th * 0.7]); bot.push([p[0], p[1] + th * 0.3]); }
        top.push([ho[0] + dir * ew * 0.1, ho[1] + eh * 0.05]);
        fillPath(g, [...top, ...bot.reverse()], css(lash, 0.82));
        feather(g, upper.slice(1), lash, 0.3, eh * 0.18); }
      // the lower lid: a moist rim catching the light just inside, the lid's soft edge below it, a few lashes outside
      feather(g, [lo(0.12), lo(0.4), lo(0.7), lo(0.92)].map(([x, y]) => [x, y + 0.6]), mix(sL, [236, 176, 168], 0.3), s < 0 ? 0.55 : 0.35, 1.3);
      feather(g, [lo(0.2), lo(0.5), lo(0.8), lo(1)].map(([x, y]) => [x, y + 2.6]), mix(sS, [100, 60, 54], 0.3), 0.32, 1.4);
      feather(g, [lo(0.65), lo(0.85), lo(1)].map(([x, y]) => [x, y + 1.4]), lash, 0.28, 1.2);
      dab(g, xi + dir * 1.6, yy + eh * 0.1, 2.4, 2.0, [206, 124, 120], 0.7);    // the caruncle, pink at the inner corner
      dab(g, xi + dir * 0.6, yy + eh * 0.02, 1.0, 1.0, [255, 246, 240], 0.6);
      // the catchlights: the window, small and bright, the same on both eyes
      const cxl = ix - irx * 0.32, cyl = iy - ir * 0.3;
      if (cyl > yy - upA * 0.8) { dab(g, cxl, cyl, ir * 0.17, ir * 0.17, [255, 252, 244], 0.95, 0, 0.55); dab(g, ix + irx * 0.35, iy + ir * 0.45, ir * 0.12, ir * 0.08, mix(eyeIris, [255, 240, 210], 0.6), 0.5); }
      else dab(g, cxl, yy - upA * 0.55, ir * 0.13, ir * 0.1, [255, 250, 240], 0.7);
      if (old > 0.2) for (let k = 0; k < 3; k++) feather(g, [[xo + dir * 3, yy + (k - 1) * 4], [xo + dir * (10 + k * 2), yy + (k - 1) * 7 + 1]], sS, 0.22 * old, 1.1);
    }
    // the brows: soft masses along the brow ridge, thick at the inner end; hairs combed up at the head, along at the tail
    for (const s of [-1, 1]) {
      const raise = (s > 0 ? E.browR : E.browL) * H * 0.02, inner = E.browIn * H * 0.014, knit = E.knit;
      const P = (t) => [X(s * lerp(0.12 - knit * 0.025, 0.84, t), 0.43), Y(0.438) - raise - inner * (1 - smooth(0, 0.45, t)) - Math.sin(Math.PI * Math.min(1, t * 1.15)) * H * (female ? 0.024 : 0.016) * (1 + (s > 0 ? E.browR : E.browL) * 0.6) + t * t * H * (0.014 + E.outerDrop * 0.01)];
      const bc = mix(hairDark, sS, female ? 0.4 : 0.15), th = H * (female ? 0.026 : 0.034 + old * 0.004);
      for (let k = 0; k <= 10; k++) { const t = k / 10, [x, y] = P(t), wdt = th * (female ? 0.75 - 0.5 * t : 1.0 - 0.6 * t); const [x2, y2] = P(Math.min(1, t + 0.1)); dab(g, x, y, Math.max(2, Math.abs(x2 - x) * 0.9 + 2), wdt * 0.6, bc, (female ? 0.42 : 0.5) * (s < 0 ? 1 : 0.9), Math.atan2(y2 - y, x2 - x), 0.3); }
      const BH = [new Path2D(), new Path2D()];
      for (let i = 0; i < 30; i++) {
        const t = Math.pow(r(), 0.8), [x, y0] = P(t), y = y0 + (r() - 0.5) * th * 0.55 * (1 - t * 0.5);
        const [x2, y2] = P(Math.min(1, t + 0.05)), along = Math.atan2(y2 - y0, x2 - x), ang = t < 0.2 ? along - s * 1.0 : along - s * 0.15, ln = (3 + r() * 3.5) * (female ? 0.7 : 1);
        const bp = BH[i % 2]; bp.moveTo(x, y); bp.lineTo(x + Math.cos(ang) * ln, y + Math.sin(ang) * ln);
      }
      g.lineWidth = 0.8; for (const k of [0, 1]) { g.strokeStyle = css(mix(bc, s < 0 ? hairLight : hairDark, k * 0.4), 0.42); g.stroke(BH[k]); }
      dab(g, X(s * 0.45, 0.405), Y(0.41) - raise, ewF * 0.5, H * 0.015, s < 0 ? sL : sM, 0.2);    // the skin over the brow, lit
    }
    if (E.knit > 0.3) for (const s of [-1, 1]) feather(g, [[X(s * 0.05, 0.45), Y(0.43)], [X(s * 0.07, 0.47), Y(0.465)]], sS, 0.2 * E.knit, 1.6);   // the lines of a frown
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
    // the mouth: the upper lip turned from the light, the lower catching it, the line between darkest at its corners;
    // the philtrum's two ridges above, the soft shadow beneath; the corners set by the expression
    { const vM = 0.78 - (smirk ? 0.006 : 0), yM = Y(vM), mw = (female ? 0.27 : 0.28) * (1 - E.press * 0.08);
      const thinLip = old * 0.3 + Math.max(0, thin) * 0.15 + E.press * 0.3;
      const lu = H * (female ? 0.03 : 0.022) * (1 - thinLip * 0.5), ll = H * (female ? 0.036 : 0.032) * (1 - thinLip * 0.35) * (1 + E.pout * 0.3);
      const cl = [X(-mw, vM), yM + H * 0.006 * E.down + H * 0.002], cr = [X(mw, vM), yM + H * 0.006 * E.down - E.smirk * H * 0.014];
      const m = X(0, vM), mL = lerp(cl[0], m, 0.5), mR = lerp(m, cr[0], 0.5);
      const lipC = mix(mix(sC, [168, 74, 70], 0.45), sM, female ? 0.1 : 0.5), lipS = mix(lipC, sD, 0.4), lipL = mix(lipC, sL, 0.45);
      const line = [cl, [lerp(cl[0], m, 0.3), yM - 0.6 + E.down * 1.4], [lerp(cl[0], m, 0.72), yM + 0.6], [m, yM + 1.9 - E.press], [lerp(m, cr[0], 0.28), yM + 0.6], [lerp(m, cr[0], 0.7), yM - 0.6 + E.down * 1.4 - E.smirk * 3.5], cr];
      // the philtrum, from under the nose to the bow of the lip: the near ridge lit, the groove soft
      feather(g, [[tipX - nwid * 0.2, yB + H * 0.012], [m - R * 0.075, yM - lu * 1.05]], sL, 0.22, 2.2);
      feather(g, [[tipX + nwid * 0.18, yB + H * 0.014], [m + R * 0.06, yM - lu * 1.05]], sS, 0.16, 2.4);
      dab(g, m + 1, lerp(yB, yM - lu, 0.55), R * 0.035, H * 0.018, sS, 0.12);
      // the upper lip, in shadow; the light catching its upper border on the near side
      const bow = [cl, [lerp(cl[0], m, 0.55), yM - lu * 0.85], [m - R * 0.07, yM - lu * 1.05], [m, yM - lu * 0.72], [m + R * 0.07, yM - lu * 1.05], [lerp(m, cr[0], 0.45), yM - lu * 0.85], cr];
      fillPath(g, [...bow, ...line.slice(1, -1).reverse()], css(lipS, female ? 0.66 : 0.5));
      feather(g, bow.slice(1, 4).map(([x, y]) => [x, y - 1.6]), sL, female ? 0.35 : 0.25, 1.4);
      // the lower lip, fuller and lit, its lower edge lost in the shadow beneath
      g.save(); g.beginPath(); curve(g, [cl, [lerp(cl[0], m, 0.3), yM + ll * 0.45], [lerp(cl[0], m, 0.62), yM + ll * 0.92], [m, yM + ll], [lerp(m, cr[0], 0.38), yM + ll * 0.92], [lerp(m, cr[0], 0.7), yM + ll * 0.45], cr, ...line.slice(1, -1).reverse()], true);
      g.fillStyle = css(lipC, female ? 0.55 : 0.28); g.fill(); g.restore();
      dab(g, lerp(cl[0], m, 0.68), yM + ll * 0.42, (m - cl[0]) * 0.36, ll * 0.24, lipL, female ? 0.6 : 0.4, 0, 0.2);
      dab(g, lerp(cl[0], m, 0.62), yM + ll * 0.36, (m - cl[0]) * 0.12, ll * 0.1, [255, 240, 232], female ? 0.4 : 0.22);
      dab(g, m + R * 0.04, yM + ll + H * 0.016, R * 0.2, H * 0.015, mix(sS, [110, 64, 54], 0.3), 0.3);   // under the lower lip
      // the line of the mouth: soft, darkest at the corners and where the lips part at the middle
      feather(g, line, [70, 36, 30], female ? 0.5 : 0.55, 1.3);
      feather(g, line.slice(1, 4), [48, 24, 20], 0.35, 1.0);
      for (const [c, s2] of [[cl, -1], [cr, 1]]) {
        dab(g, c[0] - s2 * 1.5, c[1], 3.2, 2.4, [54, 28, 22], 0.6);
        dab(g, c[0] + s2 * 3, c[1] + 2.5, 3.5, 2.6, s2 < 0 ? sL : sM, 0.28);                // the round of the muscle outside the corner
      }
      if (E.smirk) { feather(g, [[cr[0] + 2, cr[1] - 5], [cr[0] + 5, cr[1] + 1], [cr[0] + 3, cr[1] + 5]], sS, 0.4, 1.6); dab(g, cr[0] - R * 0.05, cr[1] - H * 0.035, R * 0.12, H * 0.025, sL, 0.22); }
      if (E.down > 0.2 || old > 0.4) for (const s of [-1, 1]) feather(g, [[s < 0 ? cl[0] - 1 : cr[0] + 1, (s < 0 ? cl : cr)[1] + 2], [X(s * (mw + 0.05), vM + 0.06), Y(vM + 0.07)]], sS, 0.2 * Math.max(old, E.down * 0.8), 1.8);
      // the moustache and the tuft beneath the lip
      if (!female && /moustache/.test(L.beard)) {    // a light moustache, parted under the nose, its ends turned up
        const bc = mix(hairC, hairDark, 0.35), vT = vM - 0.03;
        for (const s of [-1, 1]) {
          const P = (t) => [X(s * (0.05 + t * 0.36), vT), Y(vT) + H * (0.008 + 0.012 * Math.sin(Math.PI * t * 0.8)) - (t > 0.75 ? H * 0.035 * (t - 0.75) : 0)];
          const pts = [0, 0.25, 0.5, 0.75, 1].map(P);
          feather(g, pts, mix(bc, [0, 0, 0], 0.25), 0.45, H * 0.011);
          const MP = [new Path2D(), new Path2D()];
          for (let i = 0; i < 22; i++) {
            const t = i / 21, [x0, y0] = P(t * 0.85), [x1, y1] = P(Math.min(1, t * 0.85 + 0.18)), mp = MP[t < 0.5 ? 0 : 1];
            mp.moveTo(x0, y0 - H * 0.004); mp.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + H * 0.006 * (r() - 0.3), x1, y1 + H * 0.002);
          }
          for (const k of [0, 1]) { g.strokeStyle = css(mix(bc, hairLight, s < 0 ? 0.35 - k * 0.15 : 0.1), 0.4); g.lineWidth = 1.3 - k * 0.5; g.stroke(MP[k]); }
        }
      }
      if (!female && /tuft|imperial|beard/.test(L.beard)) {
        const bc = mix(hairC, hairDark, 0.4), tx = m + 1, ty = yM + ll + H * 0.004;
        dab(g, tx, ty + H * 0.02, R * 0.06, H * 0.025, mix(bc, [0, 0, 0], 0.2), 0.35);
        const TP = [new Path2D(), new Path2D()]; for (let i = 0; i < 26; i++) { const q = (r() - 0.5) * R * 0.1, tp = TP[q < 0 ? 0 : 1]; tp.moveTo(tx + q, ty + r() * 3); tp.quadraticCurveTo(tx + q * 0.6, ty + H * 0.025, tx + q * 0.2, ty + H * (0.04 + r() * 0.015)); }
        g.lineWidth = 1; for (const k of [0, 1]) { g.strokeStyle = css(mix(bc, hairLight, k ? 0 : 0.25), 0.45); g.stroke(TP[k]); }
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
  const shrink = (k) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w / k)); c.height = Math.max(1, Math.round(h / k)); const cg = c.getContext("2d"); cg.imageSmoothingQuality = "low"; cg.drawImage(layer, 0, 0, c.width, c.height); return c; };
  // the brush over all of it, small and light over the eyes and mouth; with nothing behind, the silhouette's own edge
  // feathered and the bust fading out below, in the same pass over the pixels. A small painting (the face for the
  // talk panel's round, seen at 48 px) is only softened: brushwork there is finer than a pixel of what is seen.
  if (S < 0.6) { g.globalAlpha = 0.35; g.drawImage(shrink(2.2), 0, 0, w, h); g.globalAlpha = 1; }
  else { const tc = (x, y) => { const a = tilt, dx = x - ncx, dy = y - nbY; return [ox + (ncx + dx * Math.cos(a) - dy * Math.sin(a)) * S, oy + (nbY + dx * Math.sin(a) + dy * Math.cos(a)) * S]; };
    const keep = [...[-1, 1].map((s) => [...tc(X(s * 0.4, 0.5), Y(0.5)), R * 0.3 * S, H * 0.05 * S]), [...tc(X(0, 0.78), Y(0.78)), R * 0.42 * S, H * 0.045 * S]];
    brushwork(g, w, h, { S, seed: sd, keep, edge: withGround ? null : { y0: oy + 520 * S, y1: oy + 640 * S } }); }
  if (!withGround && S < 0.6) {
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
