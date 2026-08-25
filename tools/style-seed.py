#!/usr/bin/env python3
"""The style seed's pixel half — a wall of a room with its ARCHITECTURE removed.

    python3 tools/style-seed.py <job.json> <out.png>

Prints one JSON object and writes the same object beside `<out.png>` as
`<out>.json`, so the fill report and the picture it describes travel together.

WHY THIS EXISTS. [row 40] Image 1 is the room's own wall, and [row 42] the room's
LEAD is painted first precisely so the other three can be painted with it in
front of the painter. The register says what it is for in as many words — "match
its paint handling, palette and light, and take nothing else from it" — and on
2026-08-25 `servants_hall/E` came back with TWO DOORWAYS and no window against an
ask that ruled a fireplace at the centre and a three-light window left of it.
The room's other walls carry doorways. The painter took the architecture.

That is the study-seed disease (row 40's second finding) in a new coat, and the
lesson is the same one: AN IMAGE REFERENCE CARRIES EVERYTHING IN IT. A sentence
telling a painter to ignore half a photograph is a sentence arguing with a
photograph, and the photograph wins. So the answer is not another sentence. It is
to hand over an image that HAS no architecture in it — the room's own materials,
palette and light on its own wall, with every opening and every carrier filled in
with that wall's own adjacent fabric.

WHAT IS FILLED, AND WHERE THE RECTANGLES COME FROM. Both authorities, unioned,
because they disagree and the disagreement is the whole risk:

  MEASURED   `door_measure.measure_openings` and `window_measure.measure_windows`
             — this project's own instruments, run on the source painting. They
             are the authority on where an opening IS, because blueprint §5 makes
             the approved image the geometric authority and rows 27 and 42 read
             the painting rather than the plan for exactly this reason.
  PROJECTED  the plan's own carriers through `row36_assemble.carrier_spans_m` —
             doors, windows AND HEARTHS. A hearth has no instrument, and a
             painted chimney breast is architecture like any other; and where a
             painting slid an opening away from where the plan drew it, the plan's
             rectangle covers the wall the opening left behind.

A FLIGHT IS NOT FILLED AND A WALL WITH ONE IN VIEW IS REFUSED. Row 41 states the
fact this rests on — "A CARRIER IS IN A WALL; A FLIGHT IS ON THE FLOOR" — and the
fill below is a wall-plane operation. `derive` refuses on it by name.

OVER-FILLING COSTS NOTHING AND UNDER-FILLING COSTS EVERYTHING. Filling plain wall
with mirrored plain wall of the same band changes nothing a painter can see;
leaving one doorway in changes what gets painted. So the union is taken without
apology and every rectangle is grown by `MARGIN_M` first, because a door's reveal
and a window's splay are not wall fabric either (`row36_assemble`'s own reason
for the same constant).

HOW IT IS FILLED — MIRRORED COLUMNS OF THE SAME BAND, never a blur and never a
patch lifted from somewhere else on the wall. The wall plane is an axis-aligned
rectangle in a frontal facing's frame (`row35_snap.region_matrix`'s `wall` is an
affine map of it), so a pixel's HEIGHT ABOVE THE FLOOR is its image row and
nothing else. Filling a masked pixel from another column of ITS OWN ROW therefore
cannot move a band: wainscot stays below the rail, field stays above it, the
cornice stays at the cornice. What moves is only where along the wall the fabric
came from, and that is the one thing a style reference is allowed to lose.

For each row, the masked columns are filled by MIRRORING the clear columns
outward from each end of the run, and the two mirrors meet in a cross-fade a
hand's width wide at the middle of the run — narrow rather than spread across the
whole run, because a fifty-fifty blend of two textures over 300 px is not a
texture, it is a smear, and it reads as a soft rectangle exactly where the
opening used to be. Where a run touches a corner it is filled from the one side
it has.

AND THE DONOR IS RELIT TO WHERE IT LANDS. The corpus was painted lit (row 37 is
the row that ends that), so a wall carries a slow left-to-right and top-to-bottom
illumination gradient; fabric mirrored 300 px sideways arrives at the wrong
brightness and the join shows as a step, which is the same rectangle by another
route. So a LOW-FREQUENCY FIELD is taken over the wall's own unmasked pixels —
a wide box blur normalised by how much of each window was valid, which
interpolates across the holes rather than reaching into them — and every donor
pixel is scaled per channel by that field's value where it is GOING over its
value where it CAME FROM. Material survives the ratio (it is high-frequency);
illumination does not (it is the field). The ratio is clipped, and the clip is
counted in the report.

THE FLOOR AND THE CEILING ARE KEPT. The mask is clipped to the wall rectangle,
so both continue through the picture exactly as painted — which is half of what
makes the seed read as the room rather than as a swatch. The one exception is
`THRESHOLD_M` of floor at the wall's foot, where a doorway throws its shadow.

WHAT MAKES THE CLAIM CHECKABLE. The two instruments are run again ON THE OUTPUT
and the seed is REFUSED unless (a) nothing they read stands anywhere the fill
touched, and (b) they do not read MORE openings of a kind than the painting did.
The first is the architecture being gone, checked where it was; the second is the
fill not inventing any. Anything they still name that clears every filled
rectangle is listed in the report as residual, rect by rect, so a reader can go
and look — `verify`'s docstring says why that is the right pair of conditions and
which wall taught it.

DETERMINISTIC, AND NO MODEL. Same source and same job gives the same bytes —
`numpy + PIL only` (`measure_lib.py`'s header), no resampling, no colour
management, a fixed PNG encoder setting, mode forced to RGB. The one rounding
rule that could drift is stated where it happens.
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
MEASURED = os.path.join(ROOT, "design", "plan-draft", "measured")
if MEASURED not in sys.path:
    sys.path.insert(0, MEASURED)

import door_measure as _dm                                       # noqa: E402
import window_measure as _wm                                     # noqa: E402
from measure_lib import load                                     # noqa: E402

#: How far outside a carrier's own rectangle the fill reaches. `row36_assemble`'s
#: `CARRIER_MARGIN_M` is 0.30 m, for a reason that holds word for word here — "A
#: door's reveal and a window's splay are not wall fabric, and they run a little
#: wider than the opening the plan rules" — and it is not enough, MEASURED on the
#: first seed this tool cut. What the window instrument reports is the LIGHT's own
#: edge; the stone surround round it eats a hand's width more, and on
#: `servants_hall/N` its right jamb stood at 945 px against a light ending at 902.
#: At 0.30 m the fill reached 949 px but the feather below was still ramping
#: there, so a third of the jamb survived as a bright stripe down the seed. The
#: margin therefore has to clear a surround AND the feather inside it: 0.45 m
#: leaves 0.35 m of full-strength fill past the light's edge, which is wider than
#: any architrave, mullion surround or chimney-breast shoulder this house draws.
MARGIN_M = 0.45

#: How wide the cross-fade at the mask's own edge is. It is INSIDE the margin by
#: construction — 0.10 against 0.45 — so the aperture and its dressing are always
#: covered at full strength and what feathers is the join between real fabric and
#: mirrored fabric of the same band, which is the only edge a viewer could
#: otherwise find.
FEATHER_M = 0.10

#: How wide the two mirrors' own cross-fade is, at the MIDDLE of a filled run.
#: A hand's width. Blending the two mirrors across the whole run — which is what
#: a linear weight does — makes most of the run a fifty-fifty average of two
#: textures, and an averaged texture is a smear: it loses its contrast and reads
#: as a soft rectangle standing exactly where the opening was. So each mirror
#: owns its own half and they meet here.
BLEND_M = 0.20

#: The radius of the illumination field's window, and it is a WALL-SIZED number
#: on purpose: it must be wide enough that no carrier's own fabric survives into
#: it (or the field would carry the thing being removed) and narrow enough to
#: follow a room's light across a wall. Half a metre at the wall plane.
LIGHT_FIELD_R_M = 1.00

#: How far the relighting ratio may go before it is clipped. A donor arriving
#: somewhere twice as bright as it left is not being relit, it is being invented,
#: and the count of clipped pixels rides in the report.
RELIGHT_CLIP = (0.6, 1.7)

#: How far BELOW the wall's floor line the fill is allowed to reach.
#:
#: The floor and the ceiling are kept — that is half of what makes a seed read as
#: a room — but a doorway's void does not stop politely at the floor line: it
#: throws a threshold shadow a hand's width into the floor in front of it, and
#: clipping the mask exactly at the line left that shadow standing as a small
#: dark notch under the wall on `servants_hall/S`, which is a doorway's last
#: visible trace. A row of the floor at a fixed image row is a fixed DEPTH line,
#: so mirroring along it is the same operation as mirroring along a wall row and
#: moves nothing in depth. 0.30 m at the wall plane's own scale is the threshold
#: and no more: it is the shadow, not the floor.
THRESHOLD_M = 0.30

#: The least clear wall a row may keep and still be filled from itself. Under it
#: there is not enough of this room's fabric left in the row to mirror, and a
#: seed invented from a sliver is not a photograph of the room.
MIN_CLEAR_FRACTION = 0.25

#: The ruled heights the plan's carriers stand at, restated here because Python
#: cannot import `tools/make-scaffold.mjs`. They are the scaffold's own
#: conventions (`CONVENTION` there) and `style-seed.mjs` passes them in on every
#: real job; these are the fallback for a job that names a kind and no band.
RULED_BAND_M = {
    "door": (0.0, 2.00),
    "hearth": (0.0, 2.20),
    "fireplace": (0.0, 2.20),
    "window": (0.90, 2.00),
    "open_edge": (0.0, None),
}


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


# ------------------------------------------------------------------ the box

def wall_box(meta, image_w, image_h):
    """The wall plane's rectangle in the frame, and its two scales.

    `row36_assemble.source_box`'s recipe, kept to the letter: every number was
    written by `promote-backdrop.mjs` off the painting it admitted, so this is
    that promotion's own reading and not a second opinion about the same pixels.
    The one thing not borrowed is the five-plane box — a frontal wall needs only
    its own rectangle, and `region_matrix`'s `wall` says that rectangle is all
    there is to it.
    """
    ppm = meta.get("px_per_m_at_wall")
    if not ppm:
        return None, "this meta carries no px_per_m_at_wall, so it has no scale"
    imh = meta.get("image_h_px") or image_h
    storey = ((meta.get("measured_room") or {}).get("storey_height_m")
              or meta.get("storey_height_m"))
    if not storey:
        return None, "this meta carries no storey height, measured or ruled"
    yf = float(meta["floor_line_y"]) * imh
    yc = yf - storey * ppm
    x0, x1 = meta.get("corner_x0_px"), meta.get("corner_x1_px")
    if x0 is None or x1 is None:
        half = (meta.get("wall_width_m") or 6.0) * ppm / 2.0
        x0, x1 = image_w / 2.0 - half, image_w / 2.0 + half
    x0 = max(0.0, float(x0))
    x1 = min(float(image_w), float(x1))
    yc = max(0.0, yc)
    yf = min(float(image_h), yf)
    if x1 - x0 < 64 or yf - yc < 64:
        return None, ("the meta puts this wall at %.0f x %.0f px in frame, which is "
                      "too little wall to be a picture of a room" % (x1 - x0, yf - yc))
    return {"x0": x0, "x1": x1, "yc": yc, "yf": yf, "ppm": float(ppm),
            "storey_m": float(storey), "width_m": (x1 - x0) / float(ppm)}, None


def px_rect_of(b, u0_m, u1_m, h0_m, h1_m):
    """A rectangle given in wall-surface metres, in frame pixels."""
    x0 = b["x0"] + u0_m * b["ppm"]
    x1 = b["x0"] + u1_m * b["ppm"]
    y1 = b["yf"] - (h0_m or 0.0) * b["ppm"]
    y0 = b["yf"] - (b["storey_m"] if h1_m is None else h1_m) * b["ppm"]
    return [x0, y0, x1, y1]


# ------------------------------------------------------------------- the mask

#: How far below the ruled sill a window's fill reaches, in metres above the
#: floor. A sill has a moulding and a board under it and neither is fabric.
WINDOW_FOOT_M = 0.60


def full_height(b, px, foot_m=0.0):
    """A rectangle's own columns, taken from the ceiling down to `foot_m`.

    EVERY CARRIER IS FILLED FULL HEIGHT, and this is a correction with a picture
    behind it. `master_bedchamber/S` came back from the first sweep with BOTH its
    windows still in the seed and a filled band sitting under them: `window_measure`
    could not walk that light's own head and sill, so it fell back — correctly, and
    it says so in its own `vertical` field — to the plan's ruled 0.90-2.00 m band,
    while the painting had drawn the windows most of a metre higher. Row 42's own
    note says why that is not a surprise: "every overlay of this corpus shows the
    paintings drawing them taller than that."

    So the VERTICAL is not trusted from either authority and only the COLUMNS are.
    A carrier's columns are filled from the ceiling line down — to the floor for a
    doorway or a hearth, to a hand below the ruled sill for a window — and the
    extra wall that takes is mirrored fabric of its own rows, which costs nothing.
    What it buys is that a window the instruments mislocated by a metre is still
    inside the rectangle that removes it.
    """
    x0, _y0, x1, _y1 = px
    return [x0, b["yc"], x1, b["yf"] - foot_m * b["ppm"]]


def collect_rects(job, b, before):
    """Every rectangle that will be filled, with where each one came from.

    THE PAINTING GOVERNS AND THE PLAN IS THE BACKSTOP, which is blueprint §5's
    authority read the way rows 22, 27 and 42 already read it. Where an instrument
    has found as many openings of a kind as the plan rules, the plan's rectangles
    are DROPPED — they would only fill plain wall, and on `servants_hall/N` the
    plan's window stands a whole metre from where the painting put it, so keeping
    both left a stepped double rectangle in the seed with nothing behind either
    step. Where the plan rules more than the instruments read, the extras are
    KEPT: a painting can hide an opening, and a hearth has no instrument at all.
    """
    #: THE PLAN'S WALL AND THE PAINTED WALL ARE NOT THE SAME LENGTH, and a
    #: carrier given in the plan's metres has to be put into the painting's.
    #: `row36_assemble.carrier_spans_m` scales the same way and for the same
    #: reason: the corners the promotion measured are where this wall actually
    #: ends, and the plan's ruled width is what the drawing says it should be.
    ruled_w = job.get("wall_width_m") or b["width_m"]
    k_u = (b["width_m"] / ruled_w) if ruled_w else 1.0
    out, dropped = [], []
    for g in before["doors"]:
        read = [float(g["x0_px"]), float(g["y0_px"]),
                float(g["x1_px"]), float(g["y1_px"])]
        out.append({
            "kind": "door", "origin": "door_measure.measure_openings",
            "why": "a way through this painting shows, read off the pixels",
            "px_read": read, "px": full_height(b, read)})
    for g in before["windows"]:
        read = [float(g["x0_px"]), float(g["y0_px"]),
                float(g["x1_px"]), float(g["y1_px"])]
        out.append({
            "kind": "window", "origin": "window_measure.measure_windows",
            "why": "a glazed opening this painting shows, read off the pixels; its "
                   "columns are the reading's and its height is the wall's, because "
                   "this instrument's vertical is the plan's ruled band whenever it "
                   "cannot walk the light's own head and sill",
            "px_read": read, "px": full_height(b, read, WINDOW_FOOT_M)})
    read = {"door": len(before["doors"]), "window": len(before["windows"])}
    carriers = job.get("carriers") or []
    ruled = {}
    for c in carriers:
        ruled[c.get("kind")] = ruled.get(c.get("kind"), 0) + 1
    for c in carriers:
        kind = c.get("kind") or "carrier"
        lo, hi = RULED_BAND_M.get(kind, (0.0, None))
        h0 = c.get("h0_m", lo)
        h1 = c.get("h1_m", hi)
        u0, u1 = c["from_m"] * k_u, c["to_m"] * k_u
        px = full_height(b, px_rect_of(b, u0, u1, h0, h1),
                         WINDOW_FOOT_M if kind == "window" else 0.0)
        rec = {"kind": kind, "id": c.get("id"),
               "origin": c.get("origin") or "the plan's projection",
               "u_m": [round(u0, 3), round(u1, 3)],
               "u_m_ruled": [c["from_m"], c["to_m"]],
               "wall_scale": round(k_u, 5),
               "h_m": [h0, h1], "px": px}
        if kind in read and read[kind] >= ruled.get(kind, 0):
            rec["dropped"] = (
                "the instrument reads %d %s(s) on this painting against the %d the "
                "plan rules, so the painting has accounted for them all; its own "
                "rectangle governs (blueprint §5; rows 22, 27, 42) and this one "
                "would fill plain wall" % (read[kind], kind, ruled.get(kind, 0)))
            dropped.append(rec)
            continue
        rec["why"] = ("the plan rules this carrier on this wall and the "
                      "instruments do not account for it — a hearth has no "
                      "instrument, and a painting can hide an opening")
        out.append(rec)
    return out, dropped


def build_mask(rects, b, shape, margin_px, threshold_px=0.0):
    """Every rectangle, grown by the margin and clipped to the wall plane."""
    h, w = shape
    m = np.zeros((h, w), dtype=bool)
    ix0, ix1 = int(np.floor(b["x0"])), int(np.ceil(b["x1"]))
    iyc = int(np.floor(b["yc"]))
    iyf = min(h, int(np.ceil(b["yf"] + threshold_px)))
    for r in rects:
        x0, y0, x1, y1 = r["px"]
        a = max(ix0, int(np.floor(min(x0, x1) - margin_px)))
        c = min(ix1, int(np.ceil(max(x0, x1) + margin_px)))
        p = max(iyc, int(np.floor(min(y0, y1) - margin_px)))
        q = min(iyf, int(np.ceil(max(y0, y1) + margin_px)))
        r["px_filled"] = [a, p, c, q]
        if c > a and q > p:
            m[p:q, a:c] = True
        else:
            r["px_filled"] = None
            r["skipped"] = "this rectangle falls outside the wall plane entirely"
    return m, (ix0, ix1, iyc, iyf)


def axis_distance(mask, band):
    """Distance, in pixels, from each masked pixel to the nearest clear one.

    The smaller of the two axis distances rather than a true Euclidean one: the
    mask is a union of upright rectangles, the feather is a tenth of a metre, and
    the difference between the two measures inside a corner is under a pixel at
    this store's scales. Said here rather than left to be discovered.
    """
    ix0, ix1, iyc, iyf = band
    d = np.full(mask.shape, np.inf)
    sub = mask[iyc:iyf, ix0:ix1]
    if not sub.any():
        return d
    big = float(max(mask.shape)) + 1.0
    # along x, both directions
    dx = np.empty(sub.shape)
    for axis in (0, 1):
        run = np.full(sub.shape, big)
        if axis == 0:                              # left to right
            acc = np.zeros(sub.shape[0])
            for j in range(sub.shape[1]):
                acc = np.where(sub[:, j], acc + 1.0, 0.0)
                run[:, j] = acc
            dx = run.copy()
        else:                                      # right to left
            acc = np.zeros(sub.shape[0])
            for j in range(sub.shape[1] - 1, -1, -1):
                acc = np.where(sub[:, j], acc + 1.0, 0.0)
                run[:, j] = acc
            dx = np.minimum(dx, run)
    dy = np.empty(sub.shape)
    for axis in (0, 1):
        run = np.full(sub.shape, big)
        if axis == 0:                              # top to bottom
            acc = np.zeros(sub.shape[1])
            for i in range(sub.shape[0]):
                acc = np.where(sub[i, :], acc + 1.0, 0.0)
                run[i, :] = acc
            dy = run.copy()
        else:                                      # bottom to top
            acc = np.zeros(sub.shape[1])
            for i in range(sub.shape[0] - 1, -1, -1):
                acc = np.where(sub[i, :], acc + 1.0, 0.0)
                run[i, :] = acc
            dy = np.minimum(dy, run)
    d[iyc:iyf, ix0:ix1] = np.where(sub, np.minimum(dx, dy), np.inf)
    return d


# ------------------------------------------------------------------- the fill

def mirror_index(clear, k):
    """The k-th clear column, with the list reflected at both ends.

    Reflection rather than clamping, because clamping repeats one column into a
    streak and reflection keeps walking real fabric. A wall with two clear
    columns and a metre of mask would be refused long before this matters, but
    the rule has to be total.
    """
    n = len(clear)
    if n == 1:
        return clear[0]
    period = 2 * (n - 1)
    k %= period
    if k < 0:
        k += period
    if k >= n:
        k = period - k
    return clear[k]


def _sat(a):
    """Summed-area table with a zero row and column, for O(1) box sums."""
    return np.pad(a, ((1, 0), (1, 0)), mode="constant").cumsum(0).cumsum(1)


def _boxsum(sat, y0, y1, x0, x1):
    return (sat[y1, x1] - sat[y0, x1] - sat[y1, x0] + sat[y0, x0])


def _box_mean(rgb, v, sats, sw, r):
    """The masked box mean at radius `r`, and how many valid pixels fed it."""
    h, w = rgb.shape[:2]
    ys = np.clip(np.arange(h)[:, None] + np.array([-r, r + 1])[None, :], 0, h)
    xs = np.clip(np.arange(w)[:, None] + np.array([-r, r + 1])[None, :], 0, w)
    y0, y1 = ys[:, 0][:, None], ys[:, 1][:, None]
    x0, x1 = xs[:, 0][None, :], xs[:, 1][None, :]
    n = _boxsum(sw, y0, y1, x0, x1)
    out = np.zeros_like(rgb, dtype=np.float64)
    for c in range(rgb.shape[2]):
        out[:, :, c] = _boxsum(sats[c], y0, y1, x0, x1) / np.maximum(n, 1e-6)
    return out, n


def light_field(rgb, valid, r):
    """The wall's slow illumination, taken over its OWN unmasked pixels only.

    A box mean of radius `r` normalised by how much of each window was valid, so
    the field interpolates across the holes instead of reaching into them — which
    is the whole point: a field that averaged the doorway's void would carry the
    doorway into every donor it relit.

    THE RADIUS DOUBLES WHERE THE WINDOW FALLS ENTIRELY INSIDE A HOLE, and this is
    not a nicety — it was a defect with a picture. A doorway 289 px across is
    wider than a 79 px radius, so the pixels at its centre saw no valid pixel at
    all; the first version answered them with the mean of everything valid in the
    FRAME, which on a wall under dark oak joists over a red brick floor is far
    darker than the wall, and the whole filled rectangle came back a flat shade
    too dark with a hard edge round it. So the field is pulled up through
    doubling radii until every pixel has been fed by something, and `valid` is the
    WALL's own unmasked pixels and not the frame's: the ceiling and the floor may
    never light a wall.
    """
    v = valid.astype(np.float64)
    sw = _sat(v)
    sats = [_sat(rgb[:, :, c].astype(np.float64) * v) for c in range(rgb.shape[2])]
    out, n = _box_mean(rgb, v, sats, sw, max(1, int(r)))
    radii = [max(1, int(r))]
    big = max(rgb.shape[:2])
    rr = max(1, int(r))
    while np.any(n <= 0.5) and rr < big:
        rr *= 2
        radii.append(rr)
        more, n2 = _box_mean(rgb, v, sats, sw, rr)
        take = (n <= 0.5) & (n2 > 0.5)
        out = np.where(take[..., None] if take.ndim == 2 else take, more, out)
        n = np.where(n <= 0.5, n2, n)
    return np.maximum(out, 1e-3), radii


def fill(rgb, mask, band, feather_px, blend_px, field_r_px, min_clear_fraction):
    """Mirror the wall's own columns of each row into that row's masked runs."""
    ix0, ix1, iyc, iyf = band
    out = rgb.astype(np.float64).copy()
    dist = axis_distance(mask, band)
    alpha = smoothstep(dist / max(feather_px, 1e-6))[..., None]
    #: THE FIELD IS THE WALL'S. `on_wall` is the wall rectangle and nothing else,
    #: so the ceiling's joists and the floor's brick can never feed a wall's
    #: illumination — which is the fastest way to make a filled patch the wrong
    #: colour, and was.
    on_wall = np.zeros(mask.shape, dtype=bool)
    on_wall[iyc:iyf, ix0:ix1] = True
    bg, field_radii = light_field(rgb, on_wall & ~mask, int(round(field_r_px)))
    lo, hi = RELIGHT_CLIP
    thin_rows, filled_rows, filled_px, clipped = [], 0, 0, 0
    span = ix1 - ix0
    for y in range(iyc, iyf):
        row = mask[y, ix0:ix1]
        if not row.any():
            continue
        clear = np.flatnonzero(~row)
        if len(clear) < max(2, int(min_clear_fraction * span)):
            thin_rows.append(int(y))
            continue
        # rank of each column among the clear ones: how many clear columns lie
        # strictly to its left. Constant across a masked run, which is what makes
        # the two mirrors below a pair of walks outward from the run's own ends.
        rank = np.cumsum(~row) - (~row).astype(int)
        j = 0
        while j < span:
            if not row[j]:
                j += 1
                continue
            a = j
            while j < span and row[j]:
                j += 1
            b = j - 1                                     # inclusive
            k = int(rank[a])                              # clear columns left of a
            n = b - a + 1
            i = np.arange(n)
            dL, dR = i + 1, n - i
            srcL = ix0 + np.array([mirror_index(clear, k - d) for d in dL])
            srcR = ix0 + np.array([mirror_index(clear, k + d - 1) for d in dR])
            x = ix0 + a + i
            # each mirror owns its half; they meet in a hand's width at the middle
            w = smoothstep(((dL - (n + 1) / 2.0) / max(blend_px, 1e-6)) + 0.5)[:, None]
            dst = bg[y, x]
            rl = np.clip(dst / bg[y, srcL], lo, hi)
            rr = np.clip(dst / bg[y, srcR], lo, hi)
            clipped += int(np.sum((rl <= lo) | (rl >= hi)) +
                           np.sum((rr <= lo) | (rr >= hi)))
            donor = (1.0 - w) * (out[y, srcL] * rl) + w * (out[y, srcR] * rr)
            al = alpha[y, x]
            out[y, x] = out[y, x] * (1.0 - al) + donor * al
            filled_px += n
            filled_rows += 1
    return np.clip(out, 0, 255), {
        "rows_filled": filled_rows, "pixels_filled": int(filled_px),
        "rows_refused_as_too_thin": thin_rows,
        "feather_px": round(feather_px, 2),
        "blend_px": round(blend_px, 2),
        "light_field_radius_px": int(round(field_r_px)),
        "light_field_radii_used_px": field_radii,
        "relight_ratio_clip": list(RELIGHT_CLIP),
        "channel_samples_clipped": int(clipped),
        "min_clear_fraction": min_clear_fraction,
    }


# ------------------------------------------------------------------ measuring

def read_both(png, b):
    doors, dnote = _dm.measure_openings(png, b["x0"], b["x1"], b["yf"],
                                        b["ppm"], b["storey_m"])
    wins, wnote = _wm.measure_windows(png, b["x0"], b["x1"], b["yf"],
                                      b["ppm"], b["storey_m"])
    return {"doors": doors, "windows": wins,
            "door_note": dnote if isinstance(dnote, str) else None,
            "window_note": wnote if isinstance(wnote, str) else None}


def verify(rects, before, after):
    """Did the fill remove the architecture, and did it invent any? (why, residual)

    TWO CONDITIONS, AND THE SECOND IS WHY THE FIRST IS NOT "READ NOTHING". The
    obvious gate — both detectors read nothing at all in the result — is wrong,
    and the store said so on the first sweep: `library/E` is a dark oak panelled
    room, its doorway comes out cleanly, and `door_measure` then names the
    NEXT-darkest maximally stable run, which is a panel bay in the shadowed
    corner. It was in the original painting too; it was simply not the darkest
    thing while the doorway was there. Refusing on it would throw away a good
    seed to satisfy a statistic about the second-darkest column on a brown wall.
    So what is required is what the row actually needs:

      GONE      no reading in the result may stand anywhere the fill touched.
                That is the opening being removed, checked where it was.
      NO MORE   the result may not read MORE openings of a kind than the source
                did. That is the fill not manufacturing one — a mirror seam read
                as a doorway would trip this and would be refused.

    Anything the detectors still name that clears every filled rectangle is
    RESIDUAL: recorded in the report, rect by rect, so a reader can go and look
    rather than take this file's word for it.
    """
    boxes = [r["px_filled"] for r in rects if r.get("px_filled")]

    def hits(g):
        for (a, p, c, q) in boxes:
            if min(g["x1_px"], c) > max(g["x0_px"], a) and \
               min(g["y1_px"], q) > max(g["y0_px"], p):
                return [a, p, c, q]
        return None

    residual, overlapping = [], []
    for kind in ("doors", "windows"):
        for g in after[kind]:
            box = hits(g)
            rec = {"kind": kind[:-1], "x0_px": g["x0_px"], "x1_px": g["x1_px"],
                   "y0_px": g["y0_px"], "y1_px": g["y1_px"],
                   "width_m": g.get("width_m")}
            if box:
                rec["overlaps_filled_rect"] = box
                overlapping.append(rec)
            else:
                rec["why_allowed"] = ("it stands clear of every rectangle the "
                                      "fill touched, so it is the detector's "
                                      "next stable run on this wall's own fabric "
                                      "and not an opening the fill left behind")
                residual.append(rec)
    if overlapping:
        g = overlapping[0]
        return ("the detectors still read %d opening(s) INSIDE what the fill "
                "touched — the first at %d..%d px, over the rectangle at "
                "%d..%d — so the architecture is not gone and the seed is not "
                "written" % (len(overlapping), g["x0_px"], g["x1_px"],
                             g["overlaps_filled_rect"][0],
                             g["overlaps_filled_rect"][2])), residual
    for kind in ("doors", "windows"):
        if len(after[kind]) > len(before[kind]):
            return ("the filled picture reads %d %s where the painting read %d — "
                    "the fill has manufactured an opening rather than removing "
                    "one, and a seed that invents architecture is the defect this "
                    "tool exists to remove"
                    % (len(after[kind]), kind, len(before[kind]))), residual
    return None, residual


def brief(gs):
    return [{"x0_px": g["x0_px"], "x1_px": g["x1_px"], "y0_px": g["y0_px"],
             "y1_px": g["y1_px"], "width_m": g.get("width_m")} for g in gs]


METHOD = (
    "every opening and carrier on the wall plane is filled with that wall's own "
    "adjacent fabric: the rectangles are the union of what door_measure and "
    "window_measure read off this painting and what the plan projects onto this "
    "wall (doors, windows, hearths and any flight in view), each grown by %.2f m "
    "because a reveal, a splay and a stone surround are not fabric; each masked "
    "run in a row is filled by mirroring that row's own clear columns outward "
    "from both ends of the run, the two mirrors meeting in a %.2f m cross-fade at "
    "the middle, so height above the floor never moves and the wainscot, the "
    "rail, the field and the cornice continue at their own heights; every donor "
    "is scaled per channel by the wall's own low-frequency illumination field "
    "(radius %.2f m, taken over unmasked pixels only) at where it lands over "
    "where it came from, so the room's light survives the move; the join is "
    "feathered over %.2f m inside the margin; the floor and the ceiling are "
    "outside the wall rectangle and are not touched, except for the %.2f m of "
    "floor at the wall's foot where a doorway throws its threshold shadow, which "
    "is mirrored along its own depth line."
    % (MARGIN_M, BLEND_M, LIGHT_FIELD_R_M, FEATHER_M, THRESHOLD_M)
)


def derive(job, out_png):
    src = job["source"]
    if not os.path.isabs(src):
        src = os.path.join(ROOT, src)
    if not os.path.exists(src):
        return None, "there is no painting at " + job["source"]
    #: A FLIGHT IS NOT ON THE WALL PLANE, so this tool cannot remove one, and a
    #: wall with a staircase in view is refused rather than half-cleaned. Row 41
    #: put it plainly for the assembler and it is the same fact here: "A CARRIER
    #: IS IN A WALL; A FLIGHT IS ON THE FLOOR." Everything below fills a masked
    #: pixel from another column of its own image row, which is depth-preserving
    #: on the wall plane and on the floor alike — but a flight is a projected
    #: SOLID with treads and a nosing at every depth, and mirroring it sideways
    #: leaves a staircase in pieces, which is architecture with a defect in it
    #: rather than no architecture. Measured on `back_stair/W`, whose seed kept a
    #: tread standing in the corner while the doorway came out cleanly.
    if job.get("flights"):
        return None, ("the plan draws %d flight(s) in this view; a stair stands on "
                      "the floor and not on the wall plane, so it cannot be filled "
                      "from the wall's own fabric and this wall cannot be a style "
                      "seed" % len(job["flights"]))
    meta = job["meta"]
    rgb = load(src)
    h, w = rgb.shape[0], rgb.shape[1]
    b, why = wall_box(meta, w, h)
    if b is None:
        return None, why
    before = read_both(src, b)
    rects, dropped = collect_rects(job, b, before)
    if not rects:
        return None, ("neither instrument reads an opening on this wall and the "
                      "plan projects no carrier onto it, so there is nothing to "
                      "remove — the painting is already its own style seed")
    margin_px = MARGIN_M * b["ppm"]
    mask, band = build_mask(rects, b, (h, w), margin_px, THRESHOLD_M * b["ppm"])
    wall_px = int((band[1] - band[0]) * (band[3] - band[2]))
    masked_px = int(mask.sum())
    if not masked_px:
        return None, "every rectangle fell outside the wall plane"
    if masked_px > 0.75 * wall_px:
        return None, ("the carriers cover %.0f %% of this wall, so there is not "
                      "enough of the room's own fabric left to fill them from"
                      % (100.0 * masked_px / wall_px))
    out, frec = fill(rgb, mask, band, FEATHER_M * b["ppm"], BLEND_M * b["ppm"],
                     LIGHT_FIELD_R_M * b["ppm"], MIN_CLEAR_FRACTION)
    if frec["rows_refused_as_too_thin"]:
        return None, ("%d rows of this wall are more than %.0f %% covered by "
                      "carriers, so they cannot be filled from the wall's own "
                      "fabric" % (len(frec["rows_refused_as_too_thin"]),
                                  100 * (1 - MIN_CLEAR_FRACTION)))
    d = os.path.dirname(os.path.abspath(out_png))
    if d:
        os.makedirs(d, exist_ok=True)
    Image.fromarray(np.clip(np.round(out), 0, 255).astype(np.uint8)).save(
        out_png, "PNG", optimize=False, compress_level=6)

    after = read_both(out_png, b)
    rec = {
        "what_this_is": ("a style seed: one promoted wall of this room with every "
                         "opening and carrier filled in with its own fabric, so "
                         "the picture carries the room's materials, palette and "
                         "light and no architecture at all"),
        "key": job.get("key"),
        "source": job["source"], "source_sha256": sha256(src),
        "source_kind": job.get("source_kind"),
        "out": os.path.relpath(os.path.abspath(out_png), ROOT)
        if os.path.abspath(out_png).startswith(ROOT + os.sep) else out_png,
        "method": METHOD,
        "box": {k: round(v, 3) for k, v in b.items()},
        "margin_m": MARGIN_M, "feather_m": FEATHER_M,
        "threshold_m": THRESHOLD_M,
        "rects": rects,
        "rects_dropped": dropped,
        "fill": frec,
        "wall_px": wall_px, "masked_px": masked_px,
        "masked_pct_of_wall": round(100.0 * masked_px / wall_px, 2),
        "verify": {
            "read_by": ["design/plan-draft/measured/door_measure.py",
                        "design/plan-draft/measured/window_measure.py"],
            "doors_before": brief(before["doors"]),
            "doors_after": brief(after["doors"]),
            "windows_before": brief(before["windows"]),
            "windows_after": brief(after["windows"]),
        },
    }
    verdict, residual = verify(rects, before, after)
    rec["verify"]["residual_readings"] = residual
    if verdict:
        os.remove(out_png)
        rec["refused"] = verdict
        return rec, verdict
    rec["sha256"] = sha256(out_png)
    rec["verified"] = (
        "every opening that was in this painting is gone from the seed: %d way(s) "
        "through and %d glazed opening(s) went in, and NOTHING the detectors read "
        "in the result stands anywhere the fill touched; the count did not rise, "
        "so nothing was manufactured either%s"
        % (len(before["doors"]), len(before["windows"]),
           "" if not residual else (" (%d run(s) the detectors still name are "
                                    "listed as residual_readings: they are the "
                                    "next-darkest or next-brightest stable run on "
                                    "plain fabric, standing clear of every filled "
                                    "rectangle, and the picture is what says so)"
                                    % len(residual))))
    with open(os.path.splitext(out_png)[0] + ".json", "w") as fh:
        json.dump(rec, fh, indent=2, sort_keys=False)
        fh.write("\n")
    return rec, None


def main(argv):
    if len(argv) != 3:
        raise SystemExit("style-seed: python3 tools/style-seed.py <job.json> <out.png>")
    with open(argv[1]) as fh:
        job = json.load(fh)
    rec, why = derive(job, argv[2])
    if why:
        print(json.dumps({"refused": why, "report": rec}, indent=2))
        return 1
    print(json.dumps(rec, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
