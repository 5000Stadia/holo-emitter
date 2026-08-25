#!/usr/bin/env python3
"""Row 40 — the legacy consistency audit: does one room's ceiling, wall and
floor read as ONE room across its facings?

    python3 design/plan-draft/measured/room_consistency.py
    python3 design/plan-draft/measured/room_consistency.py --room kitchen -v

WHY THIS FILE EXISTS. [HUMAN, 2026-08-24, verbatim]: "Still getting rooms with
wall/ceiling mismatches" — "Mismatches as in different from other walls". And
earlier, same complaint from the other side: "I have one room as you turn
ceiling floor and wall change."

Rows 36 (assembly from typed pieces, indexed in room-world coordinates) and 38
(edge-seeded fresh asks) cure this BY CONSTRUCTION for every wall painted from
here on: one painting of each surface cannot disagree with itself. But the 57
already-promoted paintings in `backdrops/<room>/<F>.png` were each rolled
independently, and NOTHING has ever measured them against each other. Kabe is
walking those. This file is the missing instrument.

WHAT IT DOES. No model calls, no network, pure arithmetic over promoted pixels
and each facing's own `.meta.json`. For every room with >= 2 promoted facings it
cuts four horizontal BANDS out of each facing using that facing's own declared
geometry — the ceiling, the upper wall, the lower wall, the floor — and asks
whether the facings agree about each band's material:

    brightness  the band's log-luminance relative to that facing's OWN
                reference. Not "is this ceiling bright" but "is this ceiling
                bright for this room" — the relation that survives exposure.
    colour      distance in (log R/G, log B/G), the surface's colour with the
                light divided out; exposure cancels in a channel ratio.
    histogram   a coarse 4x4x4 histogram of relative tile appearance, half-L1
                in [0, 1]; what the medians cannot say, which is spread (a
                plain plastered ceiling and a joisted one share a median).
    texture     median tile gradient of LOG luminance at one common px/m —
                relative contrast — compared as |log2 ratio|; this is what
                separates plaster from boards from beams

Those four are combined into one band distance D (weights in WEIGHTS, argued
below). A room's score for a band is the WORST PAIRWISE D among its facings;
the room's verdict is its worst band. The outlier facing is the one furthest
from the room's own component-wise MEDIAN profile — the median, not the mean,
so that one bad facing cannot drag the reference toward itself.

THE BANDS, AND WHY THESE. In a frontal one-point interior the facing wall is the
rect (corner_x0_px..corner_x1_px) x (ceiling line..floor line). Directly ABOVE
that rect the pixels are ceiling and directly BELOW they are floor, for every
column inside the rect — the returns only enter outside those columns, because
ceiling and floor widen as they come toward the viewer. So a column window
strictly inside the corners, split at the two lines, gives ceiling / wall /
floor with no perspective bookkeeping at all. The wall is split again at 45% /
55% of its height because the two halves are different evidence: the UPPER wall
is the room's wall fabric almost everywhere (above furniture, above the
wainscot), while the LOWER wall carries the dado, the hearth and whatever is
standing against it. Reporting them apart means the verdict can say WHICH.

SCALE, AND CARRIERS. Texture energy is a per-pixel measure and the facings are
not at one scale - `px_per_m_at_wall` runs from 43 to 338 across the promoted
store, so the same plaster measures coarser in a close-up facing than in a wide
one. Every band is therefore resampled to TARGET_PPM px/m and then cut into
TILE_M-metre tiles, and the ceiling and floor bands are taken from the middle
of their own visible wedge (see `band_rows`). Every
descriptor is the MEDIAN over those tiles, never the mean, because a band is
not pure material: a window, a doorway, a hearth sits inside it, and those are
CARRIERS the plan placed, not evidence about the room's fabric. One bright
window must not be allowed to decide that a wall changed.

NO GATE THAT CANNOT FAIL. A facing whose meta lacks the fields the bands need
(`floor_line_y`, `storey_height_m`, `px_per_m_at_wall`, the two corners) is NOT
skipped: it lands in `unmeasurable` with the field names, and its room is
reported `incomplete` rather than quietly passing. Same for a band that falls
outside the frame — a room whose ceiling line sits above y=0 has no ceiling to
compare and says so.

WHAT THIS IS NOT. It does not know what a ceiling SHOULD look like. It only
knows whether a room's facings agree with each other. Four facings that agree on
the wrong material score perfectly — that is row 36's and the Captain's eye's
job, not this instrument's.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import measure_lib as M                                          # noqa: E402

# Overridable so the test can point the whole instrument at a synthetic store
# it built itself. A measure that can only ever be run on the real corpus is a
# measure nobody can show going red.
BACKDROPS = os.environ.get("HOLO_BACKDROPS") or os.path.join(ROOT, "backdrops")
OUT_JSON = os.path.join(HERE, "room_consistency.json")
OUT_MD = os.path.join(ROOT, "design", "batches", "row40-consistency", "README.md")

FACINGS = ("N", "E", "S", "W")

# --- the band cut -----------------------------------------------------------
TARGET_PPM = 150.0      # every band resampled to this before energy is taken
X_INSET = 0.15          # fraction of the facing-wall width dropped each side
LINE_PAD = 8            # px kept clear of the ceiling/floor line itself
CEIL_FRAC = (0.20, 0.80)    # the ceiling band, as a fraction of its own wedge
FLOOR_FRAC = (0.08, 0.55)   # the floor band, likewise, clear of the smear
WALL_SPLIT = (0.45, 0.55)   # upper wall ends at 45%, lower wall starts at 55%
MIN_ROWS = 24
MIN_COLS = 64

BANDS = ("ceiling", "wall_upper", "wall_lower", "floor")

# --- the composite ----------------------------------------------------------
# THE WEIGHTS, AND HOW THEY WERE FIXED. Not chosen: SWEPT, against twelve rooms
# labelled by looking at their facings side by side with the Read tool (six
# plainly one room, six plainly not), scoring every configuration by how many
# of the 36 mismatch-vs-match pairs it ordered correctly. The sweep covered the
# column inset, the tile size, the four terms' divisors, and whether to compare
# the bands directly or compare the CONTRASTS between adjacent bands. Its
# verdict, and the whole of this instrument's calibration:
#
#   * BRIGHTNESS CARRIES NO WEIGHT AT ALL. Every configuration that weighted it
#     scored worse than the same configuration with it at zero. This is row 37
#     measured rather than asserted: how bright a wall is says how much light
#     fell on it, and a wall beside a window is not a different wall. Weighted
#     in, it put the long gallery, the kitchen and the solar - three rooms that
#     plainly ARE one room each - above the master bedchamber and the garden
#     room, which plainly are not.
#   * COLOUR AND CONTRAST DECIDE. Log channel ratios at 0.14 per step, relative
#     contrast at 0.4 per doubling. That pair alone orders 34 of the 36 pairs.
#   * THE COMPARISON IS BAND TO BAND, not contrast to contrast. Comparing each
#     facing's ceiling-to-wall step against the others' was the more elegant
#     idea and it scored lower; the direct comparison is kept because it won.
#
# dLum and dH are still MEASURED and still REPORTED beside every pair - a room
# lit two ways and a band with the wrong spread are both real complaints, and a
# reader is owed the numbers - they simply do not vote.
WEIGHTS = {"dLum": 0.0, "dChroma": 1.0 / 0.14,
           "dH": 0.0, "dT": 1.0 / 0.4}

# THE CUT, read off the ranking the weights produce: the five rooms above it are
# the five this seat confirmed mismatched by eye, and the room immediately below
# it is the highest-scoring room confirmed consistent. See
# design/batches/row40-consistency/README.md for the full printed distribution,
# and `misses.jsonl` for the one room the instrument ranks below the cut that a
# human calls mismatched (stair_landing).
CUT = 3.75

REQUIRED = ("floor_line_y", "storey_height_m", "px_per_m_at_wall",
            "corner_x0_px", "corner_x1_px")

# What was actually looked at, and what was seen. This is the calibration
# evidence, and it goes into the report so a reader is never asked to take the
# threshold on trust.
CALIBRATION = [
    "## What was looked at, and what was seen",
    "",
    "The cut is not a round number picked for looking sensible. Twelve rooms "
    "were opened as contact sheets — every promoted facing of the room side by "
    "side — and labelled by eye before any weight was chosen. Then every "
    "configuration of the instrument (column inset, tile size, the four terms' "
    "divisors, band-to-band against contrast-to-contrast) was scored by how "
    "many of the 36 mismatch-vs-match pairs it ordered correctly.",
    "",
    "**The six rooms that are plainly not one room:**",
    "",
    "- **garden_room** — N and E are limewashed plaster over a wainscot with a "
    "stone flag floor. W is oak panelling from cornice to skirting over a wood "
    "board floor. It is two different rooms sharing a name.",
    "- **servants_hall** — N and E are full-height dark oak panelling under a "
    "plastered ceiling. S and W are pale limewash with a plain rail, under "
    "exposed dark joists, over brick. The panelled pair is a parlour; the "
    "limewashed pair is the servants' hall the voice actually rules.",
    "- **master_bedchamber** — the room Kabe named. N and S hang verdure "
    "tapestry above the wainscot; E and W are panelled top to bottom. Two "
    "against two, which is why it is reported as having no majority.",
    "- **guest_chamber** — S has a deep red hanging above the wainscot; N, E "
    "and W are panelled. Note that S is the one obeying the bedchamber voice "
    "and the other three are not, so the majority here is WRONG — which is "
    "exactly why the repair's ruling comes from the plan and not from a vote.",
    "- **closet_chamber** — N is plaster above the wainscot, E and W are "
    "panelled.",
    "- **stair_landing** — N's ceiling is pale plaster, E's is dark boarded "
    "oak. The walls and floor agree well.",
    "",
    "**The six that plainly are one room:** study (oak panelling, oak boards, "
    "parchment plaster, on both facings); kitchen (E/S/W all oak panelling "
    "over oak boards under plaster); buttery_pantry (four oak-panelled "
    "facings, N simply darker); solar (four facings of panelling over stone "
    "flags — the exposure varies a lot and the material does not); "
    "muniment_room (four panelled facings); long_gallery (oak wainscot below "
    "limewash under dark beams, on all three).",
    "",
    "**What the pictures decided.** The first cut of this instrument compared "
    "mean CIE-Lab and ranked long_gallery, solar and kitchen ABOVE "
    "master_bedchamber and garden_room. It was reading the exposure. Lab's L* "
    "goes as the cube root of luminance, so a change of exposure scales it and "
    "no subtraction undoes that; the second cut moved to log-luminance and log "
    "channel ratios, where exposure is an additive offset that the facing's "
    "own reference removes exactly. The third finding was the decisive one and "
    "it came out of the sweep rather than out of an argument: **brightness "
    "should carry no weight at all.** Every configuration that weighted it "
    "scored worse than the same configuration with it at zero. That is row "
    "37's law arrived at from the other end — a wall beside a window is not a "
    "different wall.",
    "",
    "**The known miss, logged rather than hidden** (production law clause 2): "
    "stair_landing scores 2.12 and sits well below the cut, though a human "
    "plainly sees its two ceilings differ. Its two facings differ mostly in "
    "how dark the ceiling is, which is the one axis this instrument was "
    "calibrated to ignore, and its declared ceiling line sits far enough from "
    "the painted one that the two bands are not sampling the same surface. "
    "Recorded in `design/plan-draft/measured/misses.jsonl`. Raising the "
    "brightness weight enough to catch it costs three false positives, which "
    "is a worse trade for a repair route that spends a model call per flag.",
]


# ------------------------------------------------------------------ colour ---

_M_SRGB_XYZ = np.array([[0.4124564, 0.3575761, 0.1804375],
                        [0.2126729, 0.7151522, 0.0721750],
                        [0.0193339, 0.1191920, 0.9503041]])
_WHITE_D65 = np.array([0.95047, 1.00000, 1.08883])


def srgb_to_lab(rgb):
    """(..., 3) uint8-scaled sRGB -> (..., 3) CIE-Lab, D65, 2 degree observer."""
    c = np.asarray(rgb, dtype=np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = lin @ _M_SRGB_XYZ.T / _WHITE_D65
    eps, kappa = 216.0 / 24389.0, 24389.0 / 27.0
    f = np.where(xyz > eps, np.cbrt(xyz), (kappa * xyz + 16.0) / 116.0)
    fx, fy, fz = f[..., 0], f[..., 1], f[..., 2]
    return np.stack([116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz)],
                    axis=-1)


HIST_BINS = 4
# The three descriptor axes, and the range each histogram spans. They are the
# axes of ILLUMINATION-INVARIANT appearance, argued at `tile_features`.
HIST_EDGES = ((-1.2, 1.2), (-0.5, 0.5), (-0.9, 0.9))
TILE_M = 0.30          # tile edge in METRES, so every facing tiles the same world
MIN_TILES = 8
CARRIER_MARGIN_M = 0.25    # widen every declared carrier by this each side
FLARE = 0.004              # linear-light floor added before any channel ratio

_LIN = None


def _linearise(a):
    """sRGB 0..255 -> linear light 0..1."""
    c = np.asarray(a, dtype=np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def tile_features(rgb):
    """Per-pixel (logY, log R/G, log B/G) — appearance with the light divided out.

    WHY LOGARITHMS, AND WHY RATIOS. Every promoted frame was rolled with its own
    exposure and its own `key_tint`; row 37 rules that light is a layer over the
    wall and not the wall. A change of exposure is a MULTIPLICATIVE factor on
    linear light, so in the log it is an ADDITIVE offset — and an additive
    offset is exactly what subtracting the facing's own reference removes,
    completely and not approximately. The two colour axes are ratios between
    channels, so the factor cancels before the reference is even reached: they
    are what the surface IS, independent of how much light fell on it.

    A first cut of this instrument compared mean CIE-Lab instead, and it was
    wrong in a way that is worth recording. Lab's L* goes as the cube root of
    luminance, so an exposure change SCALES L* rather than shifting it, and no
    subtraction can undo that. The consequence was measured, not guessed: the
    long gallery, the solar and the kitchen — three rooms whose facings are
    plainly one room each — outranked the master bedchamber and the garden
    room, which plainly are not. The metric was reading the lamp, not the wall.
    """
    lin = _linearise(rgb)
    y = np.clip(lin @ M.LUMA, FLARE, None)
    # FLARE regularises the two ratios. Without it a channel ratio in a
    # near-black pixel is arithmetic noise amplified without limit: the study's
    # cornice measured log(B/G) = -2.9 on one facing and -1.8 on the other,
    # which is a factor of three in blue and is not a thing anyone can see,
    # because at those levels B is one or two 8-bit codes. FLARE is the veiling
    # glare any real lens adds and any painter paints; adding it makes the
    # ratio degrade gracefully toward neutral instead of diverging.
    r, g, b = (lin[..., 0] + FLARE, lin[..., 1] + FLARE, lin[..., 2] + FLARE)
    return np.stack([np.log(y), np.log(r / g), np.log(b / g)], axis=-1)


def _srgb_of(tl, ref):
    """The band's median appearance, put back into sRGB purely so a human
    reading the report can see what colour is being talked about. Rendered at
    the facing's own reference brightness, so two facings' swatches can be laid
    side by side without the exposure shouting over them."""
    med = np.median(tl, axis=0)
    y = np.exp(ref)
    g = y / (M.LUMA[0] * np.exp(med[1]) + M.LUMA[1] + M.LUMA[2] * np.exp(med[2]))
    lin = np.clip(np.array([g * np.exp(med[1]), g, g * np.exp(med[2])]), 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92,
                    1.055 * lin ** (1 / 2.4) - 0.055)


def carrier_columns(meta, w, ppm):
    """The columns this facing's own meta says are CARRIER, not fabric.

    A window, a doorway or a hearth is placed by the plan; it is not evidence
    about what the room's walls are made of, and a wall with two big windows in
    it must still be comparable with the same wall seen from the other side
    with none. The plan's own px span is used (the painted span where the
    promotion measured one), widened by CARRIER_MARGIN_M each side to take the
    reveal, the surround and the light spilling off them.

    Returns a boolean array of length w, True where the column is carrier.
    """
    bad = np.zeros(w, dtype=bool)
    cs = (meta.get("measured_room") or {}).get("carriers") or []
    m = CARRIER_MARGIN_M * float(ppm)
    for c in cs:
        span = c.get("painted_px") or c.get("plan_px")
        if not span or len(span) != 2 or span[0] is None or span[1] is None:
            continue
        a = int(round(max(0.0, min(span) - m)))
        b = int(round(min(float(w), max(span) + m)))
        if b > a:
            bad[a:b] = True
    return bad


def tiles(rgb, ppm, bad_cols=None):
    """Cut a band into world-sized tiles and describe each one.

    WHY TILES AND NOT PIXELS. A band is not pure material: a window, a doorway,
    a hearth or a hanging sits inside it, and those are CARRIERS placed by the
    plan, not evidence about the room's fabric. Averaging over the whole band
    lets one bright window decide that a wall changed. Tiling and then taking
    the MEDIAN across tiles makes the descriptor the material the majority of
    the band is made of, which is the thing Kabe is calling mismatched. The
    columns a carrier is declared on are dropped outright first.

    Tiles are TILE_M metres square in the WORLD, not px square in the frame, so
    a facing at 43 px/m and one at 338 px/m tile the same amount of wall. The
    band is resampled to TARGET_PPM first, which is also what makes gradient
    energy comparable at all.

    Returns (tile_features (n,3), tile_energy (n,)). The energy is the mean
    gradient of LOG luminance, which is relative contrast — a measure of the
    material's structure that, like the colour axes, does not move when the
    exposure does.
    """
    s = TARGET_PPM / float(ppm)
    h, w = rgb.shape[0], rgb.shape[1]
    nh, nw = max(4, int(round(h * s))), max(4, int(round(w * s)))
    if bad_cols is None:
        bad_cols = np.zeros(w, dtype=bool)
    if (nh, nw) != (h, w):
        im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
        rgb = np.asarray(im.resize((nw, nh), Image.BILINEAR)).astype(np.float64)
        src = np.clip((np.arange(nw) / s).astype(np.int64), 0, w - 1)
        bad_cols = bad_cols[src]
    feat = tile_features(rgb)
    gx, gy = M.sobel(feat[..., 0])
    mag = np.hypot(gx, gy)
    t = max(8, int(round(TILE_M * TARGET_PPM)))
    H, W = rgb.shape[0], rgb.shape[1]
    ny, nx = H // t, W // t
    if ny < 1 or nx < 1:
        return np.zeros((0, 3)), np.zeros((0,))
    fs, energies = [], []
    for iy in range(ny):
        for ix in range(nx):
            if bad_cols[ix * t:(ix + 1) * t].any():
                continue                     # a carrier stands in this tile
            sl = (slice(iy * t, (iy + 1) * t), slice(ix * t, (ix + 1) * t))
            fs.append(feat[sl].reshape(-1, 3).mean(axis=0))
            e = mag[sl][1:-1, 1:-1]          # drop the 1-px Sobel border
            energies.append(float(e.mean()) if e.size else 0.0)
    if not fs:
        return np.zeros((0, 3)), np.zeros((0,))
    return np.array(fs), np.array(energies)


def tile_hist(rel):
    """Coarse 4x4x4 histogram of the band's tiles in relative appearance.

    Relative, because absolute level is mostly a statement about how brightly
    the painter lit that frame. What the histogram adds over the medians is
    SPREAD: a plain plastered ceiling and one crossed by dark joists can share
    a median and not a shape.
    """
    idx = np.zeros(rel.shape[0], dtype=np.int64)
    for k, (lo, hi) in enumerate(HIST_EDGES):
        b = np.floor((rel[:, k] - lo) / (hi - lo) * HIST_BINS)
        idx = idx * HIST_BINS + np.clip(b, 0, HIST_BINS - 1).astype(np.int64)
    h = np.bincount(idx, minlength=HIST_BINS ** 3).astype(np.float64)
    return h / max(h.sum(), 1.0)


# ------------------------------------------------------------------- bands ---

def band_rows(meta, h):
    """The four bands' row spans for one facing, plus why any is missing.

    Returns (spans, notes) where spans maps band -> (y0, y1) half-open and notes
    is a list of human-readable reasons a band is absent.
    """
    y_floor = meta["floor_line_y"] * (meta.get("image_h_px") or h)
    y_ceil = y_floor - meta["storey_height_m"] * meta["px_per_m_at_wall"]
    spans, notes = {}, []

    def keep(name, y0, y1):
        y0, y1 = int(round(max(0.0, y0))), int(round(min(float(h), y1)))
        if y1 - y0 < MIN_ROWS:
            notes.append("%s band is %d rows (needs %d): ceiling line y=%.1f, "
                         "floor line y=%.1f, frame is %d rows"
                         % (name, max(0, y1 - y0), MIN_ROWS, y_ceil, y_floor, h))
            return
        spans[name] = (y0, y1)

    # The ceiling and the floor are taken as FRACTIONS of their own visible
    # wedge rather than as a fixed strip beside the line. The declared line and
    # the painted line are not the same line - the whole project exists partly
    # because of that scatter - and a strip pinned to the declared one lands on
    # the cornice instead of the plaster whenever the painter put the ceiling a
    # little higher. The middle of the wedge is the plaster on every facing.
    keep("ceiling", CEIL_FRAC[0] * max(y_ceil, 0.0),
         CEIL_FRAC[1] * max(y_ceil, 0.0))
    wh = y_floor - y_ceil
    keep("wall_upper", y_ceil + LINE_PAD, y_ceil + WALL_SPLIT[0] * wh)
    keep("wall_lower", y_ceil + WALL_SPLIT[1] * wh, y_floor - LINE_PAD)
    vis = max(h - y_floor, 0.0)
    keep("floor", y_floor + FLOOR_FRAC[0] * vis, y_floor + FLOOR_FRAC[1] * vis)
    return spans, notes, y_ceil, y_floor


def read_facing(room, f):
    """Measure one promoted facing, or say exactly why it cannot be measured."""
    png = os.path.join(BACKDROPS, room, "%s.png" % f)
    mj = os.path.join(BACKDROPS, room, "%s.meta.json" % f)
    if not (os.path.exists(png) and os.path.exists(mj)):
        return None, {"room": room, "facing": f, "missing": ["png/meta"],
                      "reason": "no promoted painting or no meta beside it"}
    with open(mj) as fh:
        meta = json.load(fh)
    missing = [k for k in REQUIRED if meta.get(k) is None]
    if missing:
        return None, {"room": room, "facing": f, "missing": missing,
                      "facing_type": meta.get("facing_type"),
                      "reason": "meta declares no %s, so the ceiling/floor lines "
                                "and the facing-wall columns cannot be placed"
                                % ", ".join(missing)}
    rgb = M.load(png)
    h, w = rgb.shape[0], rgb.shape[1]
    x0, x1 = float(meta["corner_x0_px"]), float(meta["corner_x1_px"])
    ins = X_INSET * (x1 - x0)
    xa, xb = int(round(max(0.0, x0 + ins))), int(round(min(float(w), x1 - ins)))
    if xb - xa < MIN_COLS:
        return None, {"room": room, "facing": f, "missing": [],
                      "reason": "facing wall is %d px wide after inset (needs %d)"
                                % (max(0, xb - xa), MIN_COLS)}
    spans, notes, y_ceil, y_floor = band_rows(meta, h)
    ppm = float(meta["px_per_m_at_wall"])
    out = {"facing": f, "ppm": ppm, "ceiling_line_y": round(y_ceil, 1),
           "floor_line_y_px": round(y_floor, 1), "cols": [xa, xb],
           "facing_type": meta.get("facing_type"), "notes": notes, "bands": {}}
    bad = carrier_columns(meta, w, ppm)[xa:xb]
    out["carrier_cols_dropped"] = int(bad.sum())
    raw = {}
    for name, (y0, y1) in spans.items():
        tl, te = tiles(rgb[y0:y1, xa:xb], ppm, bad)
        if tl.shape[0] < MIN_TILES:
            out["notes"].append(
                "%s band gave %d tiles of %.2f m (needs %d) - too little "
                "material to describe" % (name, tl.shape[0], TILE_M, MIN_TILES))
            continue
        raw[name] = (tl, te, y0, y1)
    if not raw:
        return None, {"room": room, "facing": f, "missing": [],
                      "facing_type": meta.get("facing_type"),
                      "reason": "no band survived the frame: " +
                                "; ".join(out["notes"])}
    # THE FACING'S OWN LIGHT. Every frame was rolled with its own exposure and
    # its own key_tint, and row 37 rules that light is a layer, not a wall. So
    # each band is described RELATIVE to this facing's own reference - the
    # median tile over all of its bands - and it is those relatives that are
    # compared across facings. A stone floor lit by a window and the same stone
    # floor in shadow must not read as two different floors; that mistake is
    # what a first cut of this instrument made, and it put garden_room/N (a
    # sunlit flagstone floor) further from garden_room/E (the SAME flagstone
    # floor, shaded) than from garden_room/W (oak boards). Absolute Lab is
    # still recorded and still reported - a room lit two ways is a real
    # complaint - it is just not allowed to be the whole verdict.
    # THE FACING'S OWN LIGHT. Only the BRIGHTNESS axis needs a reference — the
    # two colour axes are channel ratios and the exposure has already cancelled
    # in them. The reference is the median log-luminance over every tile of
    # every band of this facing, so "how bright is this ceiling" becomes "how
    # bright is this ceiling compared with the rest of what this frame shows",
    # which is a question about the room and not about the lamp.
    ref = float(np.median(np.concatenate([v[0][:, 0] for v in raw.values()])))
    out["reference_log_luma"] = round(ref, 4)
    for name, (tl, te, y0, y1) in raw.items():
        rel = tl.copy()
        rel[:, 0] -= ref
        med = np.median(rel, axis=0)
        out["bands"][name] = {
            "rows": [y0, y1], "tiles": int(tl.shape[0]),
            "lum": round(float(med[0]), 4),
            "chroma": [round(float(med[1]), 4), round(float(med[2]), 4)],
            "hist": tile_hist(rel).tolist(),
            "tex": round(float(np.median(te)), 5),
            "srgb": [int(round(v)) for v in
                     np.clip(255.0 * _srgb_of(tl, ref), 0, 255)]}
    return out, None


# --------------------------------------------------------------- distances ---

def band_distance(a, b):
    """How far apart two facings put one band.

    D is the Euclidean length of the weighted difference of the band's
    appearance vector - (relative brightness, log R/G, log B/G, log2 relative
    contrast) - under WEIGHTS, whose calibration is argued at WEIGHTS. dLum and
    dH ride along as reported diagnostics at zero weight.

    dLum     the band's log-luminance relative to its own facing's reference.
             Reported, not counted: it is the light, not the wall.
    dChroma  distance in (log R/G, log B/G), the surface's own colour with the
             light divided out. Exposure cancels in a channel ratio, so oak and
             limewash are far apart here and the same oak lit two ways is not.
    dHist    half-L1 between the two bands' coarse 4x4x4 histograms of relative
             tile appearance - spread, which a median cannot say. Reported.
    dTex     |log2| of the ratio of median tile log-luma gradient at
             TARGET_PPM: relative contrast, the plaster / boards / joists axis.
    """
    dL = float(abs(a["lum"] - b["lum"]))
    dC = float(np.linalg.norm(np.array(a["chroma"]) - np.array(b["chroma"])))
    dH = float(0.5 * np.abs(np.array(a["hist"]) - np.array(b["hist"])).sum())
    dT = float(abs(np.log2(max(a["tex"], 1e-6) / max(b["tex"], 1e-6))))
    D = float(np.hypot(WEIGHTS["dChroma"] * dC, WEIGHTS["dT"] * dT))
    if WEIGHTS["dLum"] or WEIGHTS["dH"]:
        D = float(np.linalg.norm([WEIGHTS["dChroma"] * dC, WEIGHTS["dT"] * dT,
                                  WEIGHTS["dLum"] * dL, WEIGHTS["dH"] * dH]))
    return {"dLum": round(dL, 4), "dChroma": round(dC, 4),
            "dH": round(dH, 4), "dT": round(dT, 3), "D": round(D, 3)}


def agree(keys, pairwise, ranked, mismatched):
    """Who agrees with whom on the worst band, and therefore who is the odd one.

    WHY NOT SIMPLY "FURTHEST FROM THE MEDIAN". Because a room can split two and
    two, and then the median is a place no facing stands and the furthest
    facing is a coin toss. master_bedchamber is exactly that room and it is the
    one Kabe named: [HUMAN, 2026-08-24, verbatim] "There's still not a forced
    consistency with the wall types such as in the master bed chamber." Its N
    and S hang tapestry above the wainscot and its E and W are panelled top to
    bottom; all four deviations from the median came out within 0.4 of each
    other, which is the arithmetic saying, correctly, that it has no minority.

    So the facings are clustered instead: two facings are joined when they
    agree within the cut, and the clusters are grown transitively. A strict
    largest cluster is the room's MAJORITY and everything outside it is an
    outlier. A tie for largest means the room has NO majority, every facing is
    returned as an outlier, and `no_majority` says so — because there is no
    consensus in the room to preserve and the ruling has to come from outside
    the pixels entirely, from the room's voice.

    Returns (clusters, majority, outliers, no_majority).
    """
    parent = {k: k for k in keys}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for pr in pairwise:
        if pr["D"] <= CUT:
            ra, rb = find(pr["a"]), find(pr["b"])
            if ra != rb:
                parent[ra] = rb
    groups = {}
    for k in keys:
        groups.setdefault(find(k), []).append(k)
    clusters = sorted((sorted(v) for v in groups.values()),
                      key=lambda g: (-len(g), g))
    if not mismatched:
        return clusters, sorted(keys), [], False
    if len(clusters) < 2:
        # one cluster but the room still failed: the disagreement chained round
        # the room rather than isolating anyone. Fall back to the median.
        return clusters, [k for k in keys if k != ranked[0]], [ranked[0]], False
    biggest = len(clusters[0])
    if len(clusters) > 1 and len(clusters[1]) == biggest:
        return clusters, [], sorted(keys), True
    majority = clusters[0]
    return clusters, majority, sorted(k for k in keys if k not in majority), False


def median_profile(entries):
    """The room's own middle facing, component by component.

    Median rather than mean, so that one badly-rolled facing cannot pull the
    reference toward itself and thereby exonerate itself.
    """
    hist = np.median(np.array([e["hist"] for e in entries]), axis=0)
    hist = hist / max(hist.sum(), 1e-9)
    return {"lum": round(float(np.median([e["lum"] for e in entries])), 4),
            "chroma": [round(float(v), 4) for v in
                       np.median(np.array([e["chroma"] for e in entries]), axis=0)],
            "hist": hist.tolist(),
            "tex": round(float(np.median([e["tex"] for e in entries])), 5)}


def audit_room(room, facings, unmeasurable):
    measured, notes = {}, []
    for f in FACINGS:
        got, bad = read_facing(room, f)
        if bad is not None:
            if bad["missing"] != ["png/meta"]:
                unmeasurable.append(bad)
                notes.append("%s/%s unmeasurable: %s" % (room, f, bad["reason"]))
            continue
        measured[f] = got
        for n in got["notes"]:
            notes.append("%s/%s: %s" % (room, f, n))
    # THE WALL TYPE, ASKED OF ONE FACING AT A TIME. [HUMAN, 2026-08-24,
    # verbatim]: "There's still not a forced consistency with the wall types
    # such as in the master bed chamber." A room's wall TYPE is not only a
    # colour: it is whether the wall is one fabric from cornice to floor
    # (panelling, limewash) or two - a dado below the 0.95 m anchor with a
    # different fabric above it (wainscot under hangings). That is a fact about
    # ONE facing, needing no comparison at all: the distance between that
    # facing's own upper and lower wall bands. master_bedchamber E and W are
    # panelled top to bottom while N and S hang tapestry above the wainscot,
    # and this single number says so per facing.
    #
    # It is reported and NOT folded into the verdict, because which of the two
    # is correct is not a pixel question: `tools/room-voices.mjs` binds the
    # room's voice to a wall material, and a voice whose binding carries
    # `hangings.*` variants declares a two-part wall while every other voice
    # declares one. The emitter reads that binding and this number together;
    # the instrument stays pixels-only.
    for f, m in measured.items():
        u, lo = m["bands"].get("wall_upper"), m["bands"].get("wall_lower")
        m["wall_split"] = round(band_distance(u, lo)["D"], 3) if u and lo else None
    r = {"room": room, "facings": sorted(measured), "notes": notes, "bands": {},
         "wall_split": {f: measured[f]["wall_split"] for f in sorted(measured)},
         "reference_log_luma": {f: measured[f].get("reference_log_luma")
                                for f in sorted(measured)}}
    if len(measured) < 2:
        r["verdict"] = "insufficient"
        r["score"] = None
        r["worst_band"] = None
        r["outliers"] = []
        r["why"] = ("%d promoted facing(s) with usable geometry — nothing to "
                    "compare against" % len(measured))
        return r
    worst_band, worst_score = None, -1.0
    for band in BANDS:
        have = {f: m["bands"][band] for f, m in measured.items()
                if band in m["bands"]}
        if len(have) < 2:
            r["bands"][band] = {"facings": sorted(have), "spread": None,
                                "why": "fewer than two facings show this band"}
            continue
        keys = sorted(have)
        pw = []
        for i in range(len(keys)):
            for j in range(i + 1, len(keys)):
                d = band_distance(have[keys[i]], have[keys[j]])
                d.update(a=keys[i], b=keys[j])
                pw.append(d)
        med = median_profile([have[k] for k in keys])
        dev = {k: band_distance(have[k], med) for k in keys}
        spread = max(p["D"] for p in pw)
        r["bands"][band] = {
            "facings": keys, "spread": round(spread, 3), "pairwise": pw,
            "deviation": dev,
            "median": {"lum": med["lum"], "chroma": med["chroma"],
                       "tex": med["tex"]},
            "tex": {k: have[k]["tex"] for k in keys},
            "lum": {k: have[k]["lum"] for k in keys},
            "chroma": {k: have[k]["chroma"] for k in keys},
            "srgb": {k: have[k]["srgb"] for k in keys}}
        if spread > worst_score:
            worst_band, worst_score = band, spread
    r["worst_band"] = worst_band
    r["score"] = round(worst_score, 3) if worst_band else None
    if worst_band is None:
        r["verdict"] = "insufficient"
        r["outliers"] = []
        r["why"] = "no band is visible in two or more facings"
        return r
    dev = r["bands"][worst_band]["deviation"]
    ranked = sorted(dev, key=lambda k: -dev[k]["D"])
    r["outlier_deviation"] = {k: dev[k]["D"] for k in ranked}
    r["clusters"], r["majority"], r["outliers"], r["no_majority"] = agree(
        r["bands"][worst_band]["facings"],
        r["bands"][worst_band]["pairwise"], ranked, worst_score > CUT)
    sp = [v for v in r["wall_split"].values() if v is not None]
    r["wall_split_spread"] = round(max(sp) - min(sp), 3) if len(sp) > 1 else None
    mism = worst_score > CUT
    r["verdict"] = "mismatched" if mism else "consistent"
    if notes and mism:
        r["verdict"] = "mismatched"
    elif notes and not mism:
        r["verdict"] = "consistent-incomplete"
    p = max(r["bands"][worst_band]["pairwise"], key=lambda q: q["D"])
    r["why"] = ("%s disagrees most: worst pair %s/%s at D=%.2f (colour %.3f, "
                "contrast x%.2f; brightness x%.2f and spread %.3f reported, "
                "not counted). %s"
                % (worst_band, p["a"], p["b"], worst_score, p["dChroma"],
                   2.0 ** p["dT"], np.exp(p["dLum"]), p["dH"],
                   ("The room has NO majority - it splits %s - so every facing "
                    "is returned and the ruling must come from the room's "
                    "voice." % " vs ".join("".join(c) for c in r["clusters"]))
                   if r["no_majority"] else
                   ("%s agree; %s %s outside them."
                    % ("".join(r["majority"]), "".join(r["outliers"]),
                       "stands" if len(r["outliers"]) == 1 else "stand"))
                   if r["outliers"] else "no facing stands outside the rest."))
    return r


# ------------------------------------------------------------------ report ---

def rooms_on_disk():
    out = []
    for name in sorted(os.listdir(BACKDROPS)):
        d = os.path.join(BACKDROPS, name)
        if not os.path.isdir(d):
            continue
        if any(os.path.exists(os.path.join(d, "%s.png" % f)) for f in FACINGS):
            out.append(name)
    return out


def distribution(rooms):
    """Every band spread in the store, sorted — the calibration evidence."""
    vals = []
    for r in rooms:
        for band, b in r["bands"].items():
            if b.get("spread") is not None:
                vals.append((round(b["spread"], 3), r["room"], band))
    vals.sort(reverse=True)
    return vals


RETRIES = os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor",
                       "retries.json")


def consistency_packets():
    """The packets `--emit-consistency` has cut, read back off disk.

    Read rather than predicted: the report says which facings are outside their
    room, the emitter decides what to do about it, and this section shows what
    it actually did.
    """
    if not os.path.exists(RETRIES):
        return []
    with open(RETRIES) as fh:
        doc = json.load(fh)
    return [e for e in doc.get("entries", []) if e.get("consistency")]


def markdown(report):
    rooms = [r for r in report["rooms"] if r["score"] is not None]
    rooms.sort(key=lambda r: -r["score"])
    L = []
    L.append("# Row 40 — legacy room-consistency audit")
    L.append("")
    L.append("[HUMAN, 2026-08-24, verbatim]: \"Still getting rooms with "
             "wall/ceiling mismatches\" — \"Mismatches as in different from "
             "other walls\".")
    L.append("")
    L.append("Rows 36 and 38 cure this by construction for walls painted from "
             "here on. The %d already-promoted paintings were rolled "
             "independently and had never been measured against each other. "
             "This is that measurement — deterministic, no model in the loop: "
             "`design/plan-draft/measured/room_consistency.py`, report in "
             "`design/plan-draft/measured/room_consistency.json`."
             % report["promoted_facings"])
    L.append("")
    L.append("Each facing's own meta places its ceiling and floor lines; the "
             "columns strictly inside the two declared corners are ceiling "
             "above the one and floor below the other, so four bands - "
             "ceiling, upper wall, lower wall, floor - cut out with no "
             "perspective bookkeeping. Each band is resampled to %g px/m, cut "
             "into %.2f m tiles of WORLD, and described by the MEDIAN tile, so "
             "a window or a doorway cannot decide that a wall changed; the "
             "columns a carrier is declared on are dropped outright first."
             % (report["target_ppm"], report["tile_m"]))
    L.append("")
    L.append("Per band, two facings are compared on **colour** - distance in "
             "(log R/G, log B/G), where the exposure has already cancelled - "
             "and **contrast** - the ratio of median tile log-luma gradient. "
             "D is the length of that weighted pair (colour at %.2f per step, "
             "contrast at %.1f per doubling), so D ~ 1 is one plainly "
             "noticeable step. **Brightness and histogram spread are measured "
             "and printed but carry no weight**, which is not a preference: "
             "the sweep below found every configuration that weighted "
             "brightness scored worse than the same one with it at zero. A "
             "room scores its WORST pairwise D over its worst band. "
             "**Cut: D > %g.**"
             % (1.0 / report["weights"]["dChroma"],
                1.0 / report["weights"]["dT"], report["cut"]))
    L.append("")
    L.append("The outlier is chosen by CLUSTERING the room's facings on that "
             "band - two facings join when they agree within the cut - and not "
             "by distance from the room's median, because a room can split two "
             "against two and then the median is a place no facing stands. A "
             "room with no majority has every facing returned and is marked "
             "**all**.")
    L.append("")
    L.append("## Rooms, worst first")
    L.append("")
    L.append("| # | room | facings | worst band | D | worst pair | brightness "
             "x | colour | spread | contrast x | outlier | verdict |")
    L.append("|---|------|---------|-----------|---|-----------|------------|"
             "--------|--------|------------|---------|---------|")
    for i, r in enumerate(rooms, 1):
        b = r["bands"][r["worst_band"]]
        p = max(b["pairwise"], key=lambda p: p["D"])
        L.append("| %d | %s | %s | %s | **%.2f** | %s-%s | x%.2f | %.3f | %.3f "
                 "| x%.2f | %s | %s |"
                 % (i, r["room"], "".join(r["facings"]), r["worst_band"],
                    r["score"], p["a"], p["b"], np.exp(p["dLum"]),
                    p["dChroma"], p["dH"], 2.0 ** p["dT"],
                    (("**all** (" + "/".join("".join(c) for c in r["clusters"])
                      + ")") if r["no_majority"]
                     else "".join(r["outliers"])) if r["outliers"] else "—",
                    r["verdict"]))
    L.append("")
    ins = [r for r in report["rooms"] if r["score"] is None]
    if ins:
        L.append("## Not comparable")
        L.append("")
        L.append("| room | why |")
        L.append("|------|-----|")
        for r in ins:
            L.append("| %s | %s |" % (r["room"], r["why"]))
        L.append("")
    if report["unmeasurable"]:
        L.append("## Facings the instrument could not read")
        L.append("")
        L.append("Reported, never skipped — production law leaves no gate that "
                 "cannot fail.")
        L.append("")
        L.append("| facing | facing_type | missing | why |")
        L.append("|--------|-------------|---------|-----|")
        for u in report["unmeasurable"]:
            L.append("| %s/%s | %s | %s | %s |"
                     % (u["room"], u["facing"], u.get("facing_type") or "—",
                        ", ".join(u["missing"]) or "—", u["reason"]))
        L.append("")
    L.append("## The distribution the cut was read off")
    L.append("")
    L.append("Every (room, band) spread in the store, worst first:")
    L.append("")
    L.append("```")
    for v, room, band in report["distribution"]:
        L.append("%6.2f  %-20s %s" % (v, room, band))
    L.append("```")
    L.append("")
    L.append("## The repair route")
    L.append("")
    L.append("Folded into the generation method, per production-law clause 6. "
             "`node tools/make-scaffold.mjs --emit-consistency` reads this "
             "report and cuts ONE re-ask packet per outlier facing into "
             "`design/batches/row23-scaffold/manor/retries.json`, in the shape "
             "the seat and the sweep already read. Nothing here dispatches and "
             "nothing here touches `run-state.json`.")
    L.append("")
    L.append("Two things make the re-ask FORCED rather than nudged. First, the "
             "correction names the room's RULING materials - walls, ceiling "
             "and floor, plus the rank of a bedchamber's hangings - resolved "
             "from `tools/room-voices.mjs` through the plan's own room id, and "
             "instructs the painter to use those and nothing else. The ruling "
             "does not come from the other walls, because the other walls are "
             "what is in dispute: guest_chamber's majority is itself the half "
             "that disobeys the bedchamber voice. Second, an edge seed may "
             "only be cut from a facing this report puts inside the room's "
             "AGREEING majority - seeding an outlier off another outlier is "
             "how a wrong material spreads round a room instead of being "
             "replaced - and a room with no majority carries no strip at all "
             "and stands on the ruling alone.")
    L.append("")
    rows = report.get("packets") or []
    if rows:
        L.append("| wall | packet | band | D | seeded from | ruling wall material |")
        L.append("|------|--------|------|---|-------------|----------------------|")
        for e in rows:
            seeds = e.get("edge_seeds") or []
            L.append("| `%s` | `%s` | %s | %.2f | %s | %s |"
                     % (e["key"], e["packet"].split("/")[-2] + "/" +
                        e["packet"].split("/")[-1],
                        e["consistency"]["band"], e["consistency"]["D"],
                        ", ".join(s["neighbour"] for s in seeds) or
                        "_none - no majority to trust_",
                        e["consistency"]["ruling"]["walls"][:70] + "..."))
        L.append("")
    for line in report.get("calibration_note", []):
        L.append(line)
    L.append("")
    return "\n".join(L) + "\n"


def kept_tail(path):
    """Everything a HUMAN wrote under this report, returned unchanged.

    `design/batches/row40-consistency/README.md` is this measurement's rendering
    for Kabe, and row 40's ORIGIN account — the two material tables, the five
    rooms facing by facing, what was checked and ruled out — was written under
    it by hand. This function is the only reason a re-measure does not delete
    that account: the tool wrote the file with mode "w" and nothing warned.

    The boundary is a bare horizontal rule. `markdown()` above emits none — it
    writes headings, tables and paragraphs and never a `---` line — so the first
    one in the file is the seam where the generated report stops and the hand
    begins, and everything from it on is carried through untouched. Write below
    a `---` and the measure will keep it; write above one and the next run owns
    that text, which is the same contract every generated artifact here has.
    """
    if not os.path.exists(path):
        return ""
    with open(path) as fh:
        lines = fh.read().split("\n")
    for i, line in enumerate(lines):
        if line.strip() == "---":
            return "\n" + "\n".join(lines[i:])
    return ""


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--room", default="", help="audit one room and print detail")
    ap.add_argument("--json", default=OUT_JSON)
    ap.add_argument("--md", default=OUT_MD)
    ap.add_argument("--no-write", action="store_true")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    names = [args.room] if args.room else rooms_on_disk()
    unmeasurable = []
    rooms = [audit_room(n, FACINGS, unmeasurable) for n in names]
    n_prom = sum(1 for n in rooms_on_disk() for f in FACINGS
                 if os.path.exists(os.path.join(BACKDROPS, n, "%s.png" % f)))
    report = {
        "instrument": "design/plan-draft/measured/room_consistency.py",
        "promoted_facings": n_prom,
        "target_ppm": TARGET_PPM, "tile_m": TILE_M, "weights": WEIGHTS,
        "cut": CUT,
        "bands": list(BANDS),
        "rooms": rooms, "unmeasurable": unmeasurable,
        "distribution": distribution(rooms),
        "packets": consistency_packets(),
        "calibration_note": CALIBRATION}

    ranked = sorted([r for r in rooms if r["score"] is not None],
                    key=lambda r: -r["score"])
    print("room                 facings  worst band   D      verdict")
    for r in ranked:
        print("%-20s %-8s %-12s %6.2f  %s"
              % (r["room"], "".join(r["facings"]), r["worst_band"], r["score"],
                 r["verdict"]))
    for r in rooms:
        if r["score"] is None:
            print("%-20s %-8s %-12s %6s  %s  (%s)"
                  % (r["room"], "".join(r["facings"]), "-", "-", r["verdict"],
                     r["why"]))
    print()
    print("distribution of every (room, band) spread, worst first:")
    for v, room, band in report["distribution"]:
        print("  %6.2f  %-20s %s" % (v, room, band))
    if unmeasurable:
        print()
        print("unmeasurable facings (reported, not skipped):")
        for u in unmeasurable:
            print("  %s/%s  missing %s — %s"
                  % (u["room"], u["facing"], ",".join(u["missing"]) or "-",
                     u["reason"]))
    if args.verbose or args.room:
        print()
        for r in rooms:
            print("== %s ==" % r["room"])
            for band in BANDS:
                b = r["bands"].get(band)
                if not b or b.get("spread") is None:
                    print("   %-11s %s" % (band, (b or {}).get("why", "absent")))
                    continue
                print("   %-11s spread %.2f" % (band, b["spread"]))
                for p in sorted(b["pairwise"], key=lambda p: -p["D"]):
                    print("       %s-%s  D %5.2f  bright x%.2f  colour %.3f  "
                          "spread %.3f  contrast x%.2f"
                          % (p["a"], p["b"], p["D"], np.exp(p["dLum"]),
                             p["dChroma"], p["dH"], 2.0 ** p["dT"]))
            print("   wall type (upper-vs-lower split, per facing): %s"
                  % ", ".join("%s %s" % (f, v)
                              for f, v in r.get("wall_split", {}).items()))
            print("   verdict:", r["verdict"], "-", r.get("why", ""))
            for n in r["notes"]:
                print("   note:", n)

    if not args.no_write and not args.room:
        with open(args.json, "w") as fh:
            json.dump(report, fh, indent=2)
            fh.write("\n")
        os.makedirs(os.path.dirname(args.md), exist_ok=True)
        # Read the hand-written tail BEFORE opening for write: mode "w"
        # truncates on open, and reading it inside the `with` reads the empty
        # file it just made. That is not hypothetical - it deleted the ORIGIN
        # account once, in this very change, before the order was fixed.
        tail = kept_tail(args.md)
        with open(args.md, "w") as fh:
            fh.write(markdown(report) + tail)
        print()
        print("wrote", os.path.relpath(args.json, ROOT))
        print("wrote", os.path.relpath(args.md, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
