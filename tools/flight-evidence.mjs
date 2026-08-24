/* flight-evidence.mjs — DOES THIS CANDIDATE HAVE A STAIRCASE IN IT?
 *
 * The one question `tools/promote-backdrop.mjs` cannot answer from the plan,
 * and the question that stands between a promoted meta and the flight it now
 * carries.
 *
 * WHY IT EXISTS. Row 32 refused to promote a facing whose room draws a flight
 * the meta does not carry: the renderer draws a flight out of `meta.stairs`
 * and a promoted meta had none, so promoting a stair room deleted its
 * staircase. Row 38's flight language then taught the emitter to ASK for the
 * flight and the re-asks came back with staircases in them — and nothing
 * ATTACHED one, so the refusal stood over paintings that had exactly what it
 * was written to protect. Doors got the attaching act at row 27, measured off
 * the painting by `door_measure.py`. A flight cannot be got the same way, and
 * the reason is measured rather than assumed — see below.
 *
 * SO THE GEOMETRY IS THE PLAN'S AND THE PERMISSION IS THE ASK'S.
 * `stairsForFacing` projects the flight at the promoted meta's own camera and
 * that is what the meta carries; this file answers only whether this candidate
 * is one a flight may be attached to at all, and records what its pixels say.
 *
 * WHAT THIS FILE SUPPLIES, in the order the promotion uses it: `askTextFor`
 * resolves the ask a candidate was painted from (following a snapped frame
 * back to the roll it was rectified from); `flightMask` and `maskCentroid`
 * rasterise a projected flight so the promotion can ask whether its own
 * reading of the wall and the drawing's put the staircase in the same place
 * (`row39:stair.projection_disagrees` — the clause the first attachment
 * earned, and the promotion's own comment carries its reasoning);
 * `paintedFlightReading` takes the pixel statistic that is recorded and never
 * gated on, for the reason the calibration below sets out at length.
 *
 * ------------------------------------------------------------------------
 * WHY THE GATE IS THE ASK AND NOT THE PIXELS — measured, on a labelled corpus
 * ------------------------------------------------------------------------
 * The intended instrument was a structure statistic over the projected flight
 * region against the frame beside it. It was built (it is still here, below,
 * and still runs on every promotion) and calibrated on the corpus this project
 * happens to own: SIX manor walls painted TWICE, once from the ask that never
 * named a staircase and once from row 38's re-ask that did. Same wall, same
 * room voice, same projection; the staircase is the only difference.
 *
 * The labels are what the paintings actually show, read by eye, and the first
 * finding is that they are not the labels the corpus's provenance implies:
 * `back_stair/W` and `stair_landing/W` painted a staircase from an ask that
 * never mentioned one, so the pre-row-38 rolls are 4 absences and 2 presences,
 * not 6 absences.
 *
 * Against those labels, four statistics over the projection — mean Sobel
 * magnitude in the flight's body against a 28 px ring, the same over the
 * treads alone, the Bhattacharyya distance between the body's and the ring's
 * luminance histograms, and the edge response ON the projected nose lines
 * against the same lines displaced 16-24 px along their own normal — all
 * interleave the two classes completely. The absences score 1.427, 1.431,
 * 0.979 and 0.727 on the body ratio; the presences score 0.614 to 2.885 and
 * straddle every one of those. `design/architecture.md`, "The flight evidence",
 * carries the whole table.
 *
 * That is not a threshold waiting to be tuned, and this project's own
 * discipline says so in as many words (row 23's separation report, row 34's
 * "no crown from noise"): a floor fitted between four negatives and eight
 * positives that overlap is fitted to the corpus, not to staircases. The
 * physical reason is legible in the frames themselves — a painted staircase
 * obeys the SCAFFOLD BOX and not the tread positions, so its noses sit tens of
 * pixels from the projection's, which is why the one statistic that would have
 * been decisive (an edge where a nose is predicted) reads the same on a
 * painting with a stair as on one without.
 *
 * THE ASK, by contrast, separates the corpus exactly and cannot be fooled by
 * lighting, exposure or a painter's licence, because it is a fact about what
 * this project sent. It is the same rule row 29(a) applies to the same class
 * of question from the same direction — `promote-backdrop.mjs`'s
 * `vista.indoor_ask` refuses an outdoor wall promoted from an indoor ask, and
 * its comment states the principle: "the ask is checked, not the picture,
 * [because] a prompt that names interior fabric cannot have produced an
 * outdoor frame." A prompt that never named a staircase cannot be shown to
 * have produced one, and the wall's own re-ask is the candidate for it.
 *
 * WHAT IT COSTS, stated rather than discovered: two of this corpus's six
 * pre-row-38 rolls DID paint a flight unasked and this clause would send them
 * back. Both already have a row-38 re-ask on disk, so the live cost is nil —
 * and on any map emitted after the flight language the clause is a no-op by
 * construction, which is the honest statement of what it is for.
 *
 * WHAT THE PIXEL READING IS STILL FOR. It is computed on every flight
 * attachment and written onto the meta under `measured_room.flight_evidence`,
 * beside the carrier disagreements row 21 records there for exactly this
 * reason: two artifacts can disagree and the disagreement must never be
 * invisible. It is not a gate and this file does not let it become one — it
 * carries no threshold at all.
 */
import { readFileSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";

/* Rec.709 luma — `design/plan-draft/measured/measure_lib.py`'s LUMA, which is
 * every other "luminance" in this project. */
const LR = 0.2126, LG = 0.7152, LB = 0.0722;

/* THE RING'S BREADTH, in frame pixels: wide enough to be a different piece of
 * room than the flight (a tread's going is 20-60 px deep across this corpus)
 * and narrow enough to stay in the same light. */
export const RING_PX = 28;

/* A body of fewer pixels than this gives the reading nothing to average, and a
 * ratio over a handful of pixels is a coin toss dressed as a number. Reported
 * as "too small to read" rather than as a value. */
export const MIN_BODY_PX = 600;

/**
 * An 8-bit non-interlaced PNG, decoded to luma. The project carries no PNG
 * library (`make-scaffold.mjs` says so, and writes its own through the page's
 * encoder); this is the smallest decoder that reads what the asset seat
 * actually produces — colour types 0, 2, 4 and 6 at depth 8 — and refuses
 * everything else by name rather than returning wrong pixels.
 */
export function readLuma(path) {
  const buf = readFileSync(path);
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`${path} is not a PNG`);
  }
  let w = 0, h = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  let p = 8;
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; colour = data[9]; interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    p += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || ![0, 2, 4, 6].includes(colour)) {
    throw new Error(`${path} is a depth-${depth} colour-${colour}${interlace ? " interlaced" : ""} PNG, and this reader handles 8-bit non-interlaced greyscale or truecolour only`);
  }
  const ch = colour === 0 ? 1 : colour === 2 ? 3 : colour === 4 ? 2 : 4;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const luma = new Float32Array(w * h);
  /* Unfiltered in place, one scanline at a time against the line above —
   * PNG's five filter types, none of them optional. */
  const cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[q++];
    for (let i = 0; i < stride; i++) {
      const x = raw[q + i];
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v;
      if (ft === 0) v = x;
      else if (ft === 1) v = x + a;
      else if (ft === 2) v = x + b;
      else if (ft === 3) v = x + ((a + b) >> 1);
      else if (ft === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else throw new Error(`${path}: filter type ${ft} at row ${y} is not a PNG filter`);
      cur[i] = v & 0xff;
    }
    q += stride;
    for (let x = 0; x < w; x++) {
      const o = x * ch;
      luma[y * w + x] = ch <= 2 ? cur[o] : LR * cur[o] + LG * cur[o + 1] + LB * cur[o + 2];
    }
    prev.set(cur);
  }
  return { w, h, luma };
}

/** 3x3 Sobel magnitude of a luma plane. Border row and column zeroed, as
 *  `measure_lib.sobel` does, so nothing reads a gradient off the frame edge. */
export function sobelMag({ w, h, luma }) {
  const g = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = luma[i - w - 1], t = luma[i - w], tr = luma[i - w + 1];
      const l = luma[i - 1], r = luma[i + 1];
      const bl = luma[i + w - 1], b = luma[i + w], br = luma[i + w + 1];
      const gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      g[i] = Math.hypot(gx, gy);
    }
  }
  return g;
}

/** Even-odd fill of one polygon into a mask, scanline by scanline. */
function fillPoly(mask, w, h, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return;
  let ymin = Infinity, ymax = -Infinity;
  for (const pt of ring) { if (pt[1] < ymin) ymin = pt[1]; if (pt[1] > ymax) ymax = pt[1]; }
  const y0 = Math.max(0, Math.ceil(ymin)), y1 = Math.min(h - 1, Math.floor(ymax));
  const xs = [];
  for (let y = y0; y <= y1; y++) {
    xs.length = 0;
    const cy = y + 0.5;
    for (let i = 0, n = ring.length; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      if ((a[1] > cy) === (b[1] > cy)) continue;
      xs.push(a[0] + (cy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k] - 0.5));
      const xb = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = xa; x <= xb; x++) mask[y * w + x] = 1;
    }
  }
}

/**
 * A separable max-filter dilation by `r` — the ring is this minus the body.
 *
 * Run over the body's own bounding box grown by `r`, and not over the frame:
 * the naive form is 2·(2r+1) reads per pixel over 1536×1024, which is 180
 * million and showed up on the row-33 clock as a promotion going from 0.05 s
 * to nearly two. A flight occupies a corner of most frames, and outside the
 * grown box there is nothing for a max filter to find.
 */
function dilate(mask, w, h, r, box) {
  const x0 = Math.max(0, box.x0 - r), x1 = Math.min(w - 1, box.x1 + r);
  const y0 = Math.max(0, box.y0 - r), y1 = Math.min(h - 1, box.y1 + r);
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let v = 0;
      for (let d = -r; d <= r && !v; d++) {
        const xx = x + d;
        if (xx >= 0 && xx < w && mask[y * w + xx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  }
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let v = 0;
      for (let d = -r; d <= r && !v; d++) {
        const yy = y + d;
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1;
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

/**
 * THE FLIGHT'S OWN DRAWN BODY, as a mask — the treads and the two stringers.
 *
 * Not `poly`: that is the convex hull the page hit-tests a click against, and
 * on a flight climbing away from the eye it is largely the bare floor beside
 * the run, so a reading over it would be reading floorboards. The body is what
 * the picture was asked to draw.
 */
export function flightMask(flights, w, h) {
  const mask = new Uint8Array(w * h);
  let quads = 0;
  for (const s of flights) {
    for (const q of s.treads_poly || []) { fillPoly(mask, w, h, q); quads++; }
    for (const m of s.mass_poly || []) fillPoly(mask, w, h, m);
  }
  return { mask, quads };
}

/**
 * WHAT THE PIXELS SAY, recorded and never gated on. Mean Sobel magnitude over
 * the flight's drawn body against the same statistic over a `RING_PX` ring of
 * frame just outside it — the reading the header's calibration shows does not
 * separate a painted staircase from an empty room on this corpus, kept so that
 * the number is on the record beside the geometry it accompanies.
 *
 * Returns `{ read, ratio, body_px, ring_px, body_edge, ring_edge, why }`;
 * `read` is false where there was nothing to read, with `why` saying what.
 */
export function paintedFlightReading(pngPath, flights) {
  let img;
  try { img = readLuma(pngPath); }
  catch (e) { return { read: false, why: String(e.message || e) }; }
  const { w, h } = img;
  const { mask, quads } = flightMask(flights, w, h);
  if (!quads) {
    return { read: false, why: "the projection puts no tread of this flight in the frame — what this view holds of it is the opening in the floor it drops through" };
  }
  let bodyN = 0;
  const box = { x0: w, x1: -1, y0: h, y1: -1 };
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    bodyN++;
    const x = i % w, y = (i - x) / w;
    if (x < box.x0) box.x0 = x;
    if (x > box.x1) box.x1 = x;
    if (y < box.y0) box.y0 = y;
    if (y > box.y1) box.y1 = y;
  }
  if (bodyN < MIN_BODY_PX) {
    return { read: false, body_px: bodyN, why: `the flight's drawn body is ${bodyN} px of frame, under the ${MIN_BODY_PX} px this reading needs to be a reading` };
  }
  const ring = dilate(mask, w, h, RING_PX, box);
  const g = sobelMag(img);
  let bodySum = 0, ringSum = 0, ringN = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) bodySum += g[i];
    else if (ring[i]) { ringSum += g[i]; ringN++; }
  }
  if (ringN < MIN_BODY_PX) {
    return { read: false, body_px: bodyN, ring_px: ringN, why: `the flight fills its own corner of the frame and leaves only ${ringN} px of room beside it to compare against` };
  }
  const bodyMean = bodySum / bodyN, ringMean = ringSum / ringN;
  return {
    read: true,
    ratio: round(ringMean > 0 ? bodyMean / ringMean : null, 4),
    body_px: bodyN, ring_px: ringN,
    body_edge: round(bodyMean, 3), ring_edge: round(ringMean, 3),
    why: null
  };
}

function round(v, n) {
  if (v == null || !isFinite(v)) return null;
  const f = Math.pow(10, n);
  return Math.round(v * f) / f;
}

/**
 * WHERE A DRAWN BODY STANDS ON THE FRAME, as one point — the centroid of the
 * pixels of a mask, which is *the place a player aims at*.
 *
 * Off the RASTER and never off the polygon vertices, and the difference is not
 * pedantry: a flight climbing out of the picture has most of its vertices
 * beyond the frame, where two projections of one staircase diverge without
 * bound at depth, and a vertex centroid is dominated by the tail nobody can
 * click. The mask is already clipped to the frame, so this is the middle of
 * what is actually shown.
 */
export function maskCentroid(mask, w) {
  let n = 0, sx = 0, sy = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % w;
    sx += x; sy += (i - x) / w; n++;
  }
  return n ? { x: sx / n, y: sy / n, n } : null;
}

/**
 * THE ASK THIS CANDIDATE WAS PAINTED FROM, resolved.
 *
 * Every candidate is written with its own prompt beside it — that is what
 * `vista.indoor_ask` already reads. A SNAPPED candidate is the exception and
 * has to be, because `row35_snap.py` rectifies a roll into
 * `backdrops/source-snapped/<loc>-<F>/snapped.png` and nothing is asked for
 * there: the ask is the ORIGINAL roll's, and the snapped reading names that
 * roll in its own `_snap` block. So the origin is followed rather than
 * guessed, and a reading that names no origin returns null instead of a
 * silently empty ask.
 */
export function askTextFor(root, candidate, measurement, join) {
  const rel = candidate.replace(/^\.\//, "").replace(/\.png$/i, ".prompt.txt");
  if (existsSync(join(root, rel))) {
    return { text: readFileSync(join(root, rel), "utf8"), path: rel, via: "beside the candidate" };
  }
  const snap = measurement && measurement._snap;
  const said = snap && String(snap._what_this_is || "");
  const m = said && said.match(/(backdrops\/source\/[^\s,]+\.png)/);
  if (m) {
    const origin = m[1].replace(/\.png$/i, ".prompt.txt");
    if (existsSync(join(root, origin))) {
      return { text: readFileSync(join(root, origin), "utf8"), path: origin,
        via: `the roll this snapped frame was rectified from (${m[1]})` };
    }
  }
  return { text: null, path: rel, via: null };
}
