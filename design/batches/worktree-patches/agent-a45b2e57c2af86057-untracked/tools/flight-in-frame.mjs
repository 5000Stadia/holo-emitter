/* flight-in-frame.mjs — does this painting hold the staircase the plan draws?
 *
 * WHY THIS EXISTS, and why it is not in `design/plan-draft/measured/`.
 *
 * A promoted meta now CARRIES its flights (`tools/promote-backdrop.mjs`), so
 * the picture and the record can disagree in a way that was impossible while
 * the record said nothing: the meta says a staircase stands here, the renderer
 * strokes it and hands a click through its outline, and the paint under it is
 * bare plaster. Row 27 answered the same question for a doorway by MEASURING
 * the painted void and letting it govern its own rectangle. A flight cannot be
 * answered that way — a staircase has no stable dark run to find, and the
 * geometry it would have to be squared against is the building's, not the
 * painter's — so what is asked here is the weaker, honest question: does the
 * region the flight is projected into contain anything that could be a
 * staircase, or does the painting's own structure say it is bare surface?
 *
 * IT IS NOT PART OF THE MEASUREMENT, and that is a deliberate departure from
 * `door_measure.py`'s rule that "the reading goes in the measurement, not in
 * the promotion". The rule protects two things and this breaks neither. It
 * protects the META from carrying a number nobody measured — nothing computed
 * here reaches the meta, not one field; the reading is a refusal test and its
 * output is a yes or a no. And it protects the promotion's RE-RUNNABILITY —
 * `fixtures.spec`'s staleness case re-derives every promoted meta by running
 * the tool again and byte-comparing, and this is a pure function of the
 * candidate's bytes, whose sha256 the measurement already pins, so a re-run
 * answers identically or the image changed. What could NOT be done is put it
 * in the measurement: the region it asks about is the region THIS PROMOTION'S
 * OWN geometry projects, and a reading taken before the promotion exists
 * cannot name it. A door's void is found without the plan; a flight's region
 * is nothing but the plan.
 *
 * THE STATISTIC, and why it is a rank rather than a threshold.
 *
 * A painted flight is a stack of parallel lines: its edge energy concentrates
 * ACROSS the tread noses and starves the direction ALONG them. So the ratio
 *
 *     E(across the noses) / E(along the noses)
 *
 * taken over the flight's own projected body should stand near the top of the
 * same ratio taken at every other pair of axes. On bare board or plaster the
 * grain has its own direction, which has nothing to do with where the plan
 * puts this staircase, so the flight's axes are an ordinary member of that set.
 * What is reported is therefore the RANK — the fraction of orientations whose
 * ratio is at least the flight's own — and under "this region holds no flight"
 * that rank is uniform on (0,1]. It is a p-value by construction: there is no
 * magnitude anywhere in it, so nothing has to be calibrated against a corpus
 * of paintings that will keep changing.
 *
 * WHAT IT MEASURES ON THE CORPUS IT WAS BUILT AGAINST — ten manor walls whose
 * plan draws a flight, each labelled by eye off the projection drawn over the
 * frame (`design/architecture.md`, "The flight a painting has or has not"):
 *
 *   frames that DO paint a flight in the region   0.061 0.094 0.111 0.150 0.411
 *   frames that do NOT                            0.439 0.489 0.711
 *
 * The cut is the median, `RANK_LEVEL`, and it is the median because that is the
 * one boundary the null itself names — not because it is where this corpus
 * splits, which is 0.43 and would be eight points of tuning. Read honestly:
 * the arm refuses the frame whose flight lands on bare plaster over bare floor
 * (`back_stair/E`, 0.711) and lets two further bare frames through (0.489,
 * 0.439), whose projected bodies are narrow strips of floorboard whose grain
 * happens to run across the noses. It is one-sided on purpose — a false refusal
 * costs a re-ask of art that was right, and this corpus says the separation is
 * not clean enough to spend that.
 *
 * A BODY TOO SMALL TO READ IS NOT EVIDENCE OF ABSENCE. Two of the manor's
 * facings look across a stairwell whose every tread is below the frame: what
 * they show of the flight is the hole it drops through, and their projected
 * bodies are 29,766 px, under 2 % of the frame. The reading WITHHOLDS below
 * `MIN_READABLE_BODY_PX` rather than answering from noise, and the promotion
 * attaches — the same shape as a WITHHELD measurement everywhere else in this
 * project, which is a refusal to speak and not a verdict.
 */
import { inflateSync } from "node:zlib";

/** Orientations swept over the half-circle. One degree apart. */
export const ORIENTATIONS = 180;

/** The rank at or under which the picture is taken to hold the flight.
 *  The median of the null, stated above. */
export const RANK_LEVEL = 0.5;

/** Below this much projected body on the frame the reading withholds. The
 *  two manor facings that are present as nothing but their stairwell measure
 *  29,766 px; the smallest body this arm has ever answered about is 43,224. */
export const MIN_READABLE_BODY_PX = 40000;

/** How many body pixels the orientation sweep is taken over. A fixed stride,
 *  so the sample is the same sample every time this is run. */
export const MAX_SAMPLES = 60000;

/* ------------------------------------------------------------------ */
/* The picture                                                         */
/* ------------------------------------------------------------------ */
/**
 * An 8-bit non-interlaced PNG, as one luminance plane.
 *
 * Written here rather than taken from a package because this repository has no
 * runtime dependencies and one decode of one colour type is smaller than the
 * argument for adding one. Every frame this pipeline produces is 8-bit
 * truecolour at 1536 × 1024; anything else is refused by name rather than
 * decoded wrongly.
 */
export function readLumaPng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error("not a PNG");
  }
  let pos = 8;
  let w = 0, h = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; colour = data[9]; interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || ![0, 2, 4, 6].includes(colour)) {
    throw new Error(`PNG is bit depth ${depth}, colour type ${colour}, interlace ${interlace} — this reader handles 8-bit non-interlaced grey or truecolour only`);
  }
  const ch = colour === 0 ? 1 : colour === 2 ? 3 : colour === 4 ? 2 : 4;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const L = new Float64Array(w * h);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    for (let i = 0; i < stride; i++) cur[i] = raw[p + i];
    p += stride;
    /* PNG's five filters, undone in place — the one part of a decoder that
     * cannot be skipped and the one part that is entirely mechanical. */
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = cur[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      } else if (filter !== 0) {
        throw new Error(`PNG row ${y} carries filter ${filter}`);
      }
      cur[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const o = x * ch;
      L[y * w + x] = ch <= 2 ? cur[o]
        : 0.2126 * cur[o] + 0.7152 * cur[o + 1] + 0.0722 * cur[o + 2];
    }
    prev.set(cur);
  }
  return { w, h, L };
}

/* ------------------------------------------------------------------ */
/* The flight's own body, rasterised                                   */
/* ------------------------------------------------------------------ */
/** The pixels the flight would cover: its going/riser quads and its two
 *  stringers, unioned. NOT `poly`, which is the convex hull of the flight and
 *  the floor it stands on — that hull covers the bare wall behind a rising
 *  flight and the bare floor in front of a descending one, which is most of it
 *  on this corpus, and every statistic taken over it was diluted to nothing. */
function bodyMask(flight, w, h) {
  const rings = [...(flight.treads_poly || []), ...(flight.mass_poly || [])]
    .filter((r) => Array.isArray(r) && r.length >= 3);
  const mask = new Uint8Array(w * h);
  let n = 0;
  for (const ring of rings) {
    let y0 = Infinity, y1 = -Infinity;
    for (const p of ring) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    y0 = Math.max(0, Math.ceil(y0)); y1 = Math.min(h - 1, Math.floor(y1));
    for (let y = y0; y <= y1; y++) {
      /* Even-odd scanline crossings at the pixel's own centre row. */
      const xs = [];
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j], b = ring[i];
        const ay = a[1], by = b[1];
        if ((ay > y + 0.5) === (by > y + 0.5)) continue;
        xs.push(a[0] + (y + 0.5 - ay) * (b[0] - a[0]) / (by - ay));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.ceil(xs[k] - 0.5));
        const xb = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
        for (let x = xa; x <= xb; x++) {
          const o = y * w + x;
          if (!mask[o]) { mask[o] = 1; n++; }
        }
      }
    }
  }
  return { mask, n };
}

/** The mean unit direction of the projected tread noses, sign-free: a nose is
 *  a segment with no head and no tail, so the two orientations are one. */
function noseDirection(noses) {
  let vx = 0, vy = 0;
  for (const [a, b] of noses || []) {
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const n = Math.hypot(dx, dy);
    if (!(n > 1e-9)) continue;
    dx /= n; dy /= n;
    if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }
    vx += dx; vy += dy;
  }
  const n = Math.hypot(vx, vy);
  return n > 1e-9 ? [vx / n, vy / n] : null;
}

/* ------------------------------------------------------------------ */
/* The reading                                                         */
/* ------------------------------------------------------------------ */
/**
 * `{ body_px, readable, rank, own_ratio, best_ratio, reads_as_flight }` for one
 * projected flight against one painting. `reads_as_flight` is `null` where the
 * reading withheld — a body too small or a flight with no noses in the frame —
 * and that is not a "no".
 */
export function flightReading(picture, flight) {
  const { w, h, L } = picture;
  const dir = noseDirection(flight.noses);
  const { mask, n } = bodyMask(flight, w, h);
  const out = { body_px: n, readable: false, rank: null, own_ratio: null,
    best_ratio: null, reads_as_flight: null };
  if (!dir) { out.why = "the projection puts no tread nose in this view"; return out; }
  if (n < MIN_READABLE_BODY_PX) {
    out.why = `${n} px of flight body on the frame, under the ${MIN_READABLE_BODY_PX} px this reading answers above`;
    return out;
  }
  /* A FIXED STRIDE, so the sample is the same sample on every run. */
  const stride = Math.max(1, Math.ceil(n / MAX_SAMPLES));
  const gx = [], gy = [];
  let seen = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (!mask[y * w + x]) continue;
      if (seen++ % stride) continue;
      gx.push((L[y * w + x + 1] - L[y * w + x - 1]) / 2);
      gy.push((L[(y + 1) * w + x] - L[(y - 1) * w + x]) / 2);
    }
  }
  if (gx.length < 64) {
    out.why = "too few of the flight's own pixels are inside the frame's interior to read";
    return out;
  }
  const E = new Float64Array(ORIENTATIONS);
  for (let k = 0; k < ORIENTATIONS; k++) {
    const t = k * Math.PI / ORIENTATIONS;
    const c = Math.cos(t), s = Math.sin(t);
    let sum = 0;
    for (let i = 0; i < gx.length; i++) sum += Math.abs(gx[i] * c + gy[i] * s);
    E[k] = sum / gx.length;
  }
  const ratio = new Float64Array(ORIENTATIONS);
  for (let k = 0; k < ORIENTATIONS; k++) {
    ratio[k] = E[k] / Math.max(E[(k + ORIENTATIONS / 2) % ORIENTATIONS], 1e-9);
  }
  /* The direction ACROSS the noses — the one the treads stack along. */
  const across = Math.atan2(dir[0], -dir[1]);
  const idx = ((Math.round(((across % Math.PI) + Math.PI) % Math.PI /
    (Math.PI / ORIENTATIONS))) % ORIENTATIONS + ORIENTATIONS) % ORIENTATIONS;
  const own = ratio[idx];
  let atLeast = 0, best = 0;
  for (let k = 0; k < ORIENTATIONS; k++) {
    if (ratio[k] >= own) atLeast++;
    if (ratio[k] > best) best = ratio[k];
  }
  out.readable = true;
  out.samples = gx.length;
  out.own_ratio = round(own, 4);
  out.best_ratio = round(best, 4);
  out.rank = round(atLeast / ORIENTATIONS, 4);
  out.reads_as_flight = out.rank <= RANK_LEVEL;
  return out;
}

function round(v, n) {
  const f = Math.pow(10, n);
  return Math.round(v * f) / f;
}
