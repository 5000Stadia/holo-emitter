#!/usr/bin/env python3
"""Row 41 — A WALL IS ARCHITECTURE. Fitted bays, never a tiled crop.

    python3 design/plan-draft/measured/row41_bays.py --room kitchen
    python3 design/plan-draft/measured/row41_bays.py --room kitchen --json out.json

[HUMAN, 2026-08-24, verbatim, on the kitchen row 36 assembled]
"that assembled version is dogwater. First for your example the paneling needs
to frame in the wall properly. It looks like a chopped up repeating wallpaper
thats glitched out. It runs off the corner and doesnt complete"

WHAT WENT WRONG, MEASURED RATHER THAN GUESSED. Row 36 harvests three horizontal
BANDS off a source wall, anchors them at the floor, and mirror-tiles them
sideways across whatever width the consumer happens to have. Three consequences,
every one of them visible in `design/batches/row36-assembly/demo-kitchen/E-lit.png`
and every one a consequence of tiling rather than of a bad crop:

  * THE PITCH IS THE SOURCE'S. `wall/plain-limewash-to-floor` was harvested off
    `buttery_pantry/S` and its panelling repeats at 0.831 m; the kitchen's east
    wall is 8.650 m, so 10.41 bays fit across it and the last one is cut. That
    is "it runs off the corner and doesnt complete", exactly.
  * THE MIRROR FOLD LANDS MID-PANEL. `tile_lookup` reflects to hide the repeat,
    so the fold puts two half-stiles back to back with a smeared boss where the
    chair rail meets itself — the blob in the middle of that frame.
  * THE HEAD OF THE WALL IS CLIPPED. The source's storey measured 3.274 m and
    the kitchen's is 2.800 m, so the band carrying the CORNICE is cut 0.474 m
    short of it and the panelling dies into the ceiling with nothing at its
    head.

THE RULING (`design/approvals.log`, row 41): tiled texture crops are REJECTED as
wall construction. A wall is laid out. So:

  1. THE LAYOUT IS ARITHMETIC, from the wall's own width and the material's bay
     module. `n = round(W/m)`, bay width `W/n` exactly, and a stile lands in
     EVERY bay boundary INCLUDING both corners. Nothing here is detected, fitted
     or sampled; it is the same three lines on every wall in the building.
  2. THE FRAME COMPLETES. Plinth at the floor, chair rail at the ruled 0.95 m
     (blueprint §11), cornice at the CEILING — the target's ceiling, not the
     source's — and a stile down each corner.
  3. A TEXTURE ONLY EVER FILLS A FIELD INSIDE THAT FRAME, one field at a time,
     fitted to that field's own rectangle. No texture crosses a stile, a rail or
     a corner, so there is nothing left that can be cut by one.
  4. OPENINGS CONSUME WHOLE BAYS. A door or a window snaps to the bay grid it
     best fits and is framed by its own architrave; the snap distance is
     recorded rather than hidden.
  5. AN UNFRAMED MATERIAL (limewash, plaster, brick) keeps row 36's sampler and
     GAINS AN EDGE at each corner — a return stile on plaster, a quoin on
     masonry — so that nothing runs off a corner even where there are no bays.

AND THE PROJECTION IS ROW 36'S, UNCHANGED. The composed wall is a pure function
of (perimeter metres round the room, height above the floor) — the same two
numbers row 36 indexes its fabric by — so `surface_metres` maps into it without
knowing anything has changed, returns still resolve to their neighbour's own
wall, and corners still meet by arithmetic. What is new is that the arithmetic
now has a completed bay on each side of every corner to meet WITH.

NO MODEL CALLS. Deterministic from the plan, the promoted metas and the pixels
already in the store.
"""
import argparse
import json
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row35_snap as S                                           # noqa: E402
import row36_assemble as A                                       # noqa: E402
from measure_lib import load                                     # noqa: E402

PLAN = A.PLAN
MATERIALS = A.MATERIALS
FACINGS = A.FACINGS

#: The ruled chair-rail height, and this file may not move it either: it is
#: `row36_assemble.ANCHOR_M`, which is blueprint §11's ruling and the divisor
#: the whole instrument reads scale through.
ANCHOR_M = A.ANCHOR_M

#: THE FALLBACK FRAME, for a wall whose PAINTING carries joinery that its
#: material record does not declare. Its numbers are the panelled defaults in
#: `MATERIALS` and the comment there is where they come from.
DEFAULT_FRAME = {
    "kind": "full_height", "module_m": 0.80, "stile_m": 0.11,
    "plinth_m": 0.17, "chair_rail_m": 0.95, "chair_rail_h_m": 0.14,
    "cornice_m": 0.24, "architrave_m": 0.13, "bevel_m": 0.035,
}

# --------------------------------------------------------------- the relief
#
# WHY A WALL HAS A RELIEF MAP AT ALL. Joinery is SHAPE, and the one thing a
# harvested crop cannot supply is shape in a place the painter did not put it:
# there is no stile in the source at 3.245 m along the kitchen's east wall
# because the source is a different wall of a different width. So the members
# are drawn from the layout — each one's proudness in metres, below — and the
# harvested pixels supply the material that is drawn WITH.
#
# These are depths of real joinery, in metres, and they are small on purpose:
# what they have to produce is an edge a viewer reads as an edge, not a relief
# carving. A wainscot stile stands about three quarters of an inch proud of its
# panel and its mouldings are worked on its own face.
PANEL_H = 0.000                 #: the panel face, the datum everything else is over
STILE_H = 0.019                 #: stile and muntin faces: 3/4"
RAIL_H = 0.030                  #: the chair rail, 1 3/16": it stands off the framing
PLINTH_H = 0.024                #: the plinth, prouder again — it takes the knocks
CORNICE_H = 0.044               #: the cornice, 1 3/4": the boldest member on the wall
ARCH_H = 0.026                  #: a door or window architrave
APERTURE_D = -0.075             #: the reveal, recessed: an opening goes back

#: THE GLAZING GROUND, and it is a NEUTRAL and not a light. Row 37 rules that a
#: piece carries material and illumination is a layer over it, so a window's
#: albedo is what glass is — a flat mid grey with nothing painted behind it —
#: and it is the lighting pass, which already knows where the plan's windows
#: are, that makes one bright. A door or a hearth takes a fraction of the wall's
#: own median instead, because an unlit opening is dark but is not a hole
#: punched in a picture; the same reasoning `row36_assemble.VOID_LUMA_FRACTION`
#: records, and the door void is repainted over this by `paint_voids` anyway.
GLAZING_LUMA = 132.0

#: THE KEY THE RELIEF IS SHADED BY, and it is NOT illumination. Row 37 rules
#: that pieces carry material and not light, and this obeys that: it is a fixed
#: unit vector in the wall's OWN surface (up and to the left), so it turns with
#: the wall and cannot make one wall of a room brighter than another the way a
#: world-space key would. What it renders is the fact that a moulding has an
#: arris — the same fact a photograph of unlit joinery still shows.
RELIEF_KEY = (-0.7071, -0.7071)     # (du, dv), v measured upward
RELIEF_GAIN = 2.10
RELIEF_CLAMP = (0.45, 1.80)

#: How far the relief is smoothed before its gradient is taken, in metres. A
#: step of one pixel has an infinite slope and shades as a white line; 8 mm is
#: the arris an eye actually sees on planed oak.
RELIEF_SMOOTH_M = 0.008

#: CONTACT DARKENING IN THE REBATES: how deep, and over how many metres. A
#: recessed panel is darker at its edges because less of the room reaches in.
#: Same discipline as the lighting stub's contact shadow — metres of surface,
#: never pixels.
AO_DEPTH = 0.45
AO_M = 0.055

# ------------------------------------------------------------- the harvest
#
# WHAT IS HARVESTED AND WHAT IS DRAWN, stated once so the batch does not have
# to guess. FOUR PIECES come out of the room's own promoted painting, each cut
# at a RULED height rather than at a detected one, because every one of these
# heights is already a ruled number:
#
#   wood      the clear face of the panelling, for every member's material
#   plinth    the skirting, v in [0, plinth_m]
#   rail      the chair rail, v in [0.95 - h/2, 0.95 + h/2]  -- the ruled anchor
#   cornice   the wall head, v in [storey - cornice_m, storey] of the SOURCE
#
# and the SHAPE of every member is drawn from the layout. That split is the
# whole method: the painter is the authority on what oak looks like and the plan
# is the authority on where a stile goes, and neither is asked the other's
# question.

#: The wood patch is cut from between the chair rail and the cornice, clear of
#: both: these two margins in metres.
WOOD_V0 = 1.18
WOOD_MARGIN_TOP = 0.10

#: A GROOVE, for the purpose of finding a clear face to cut the wood from: a
#: column this many standard deviations darker than the 0.25 m of wall either
#: side of it. Grooves are a small minority of columns on any panelled wall, so
#: the widest run BETWEEN them is a panel's own face — which is all this has to
#: find. It never has to find the pitch, and that is deliberate: pitch detection
#: by autocorrelation was tried first and returned 0.478 m to 1.399 m across
#: this corpus's own wall tiles, on peaks of 0.05 to 0.34. The module is ruled
#: in `MATERIALS` precisely so that nothing has to measure it.
GROOVE_Z = 1.1
GROOVE_BG_M = 0.25
GROOVE_DILATE_M = 0.02

#: The narrowest clear run worth calling a panel face. Under this the harvest
#: says so and takes the whole window, grooves and all.
MIN_WOOD_M = 0.22

#: FOR THE EVIDENCE TEST — is this room's painting FRAMED? Two things have to be
#: there, and both are ruled features rather than tastes: a horizontal member at
#: the ruled 0.95 m, and vertical grooves that repeat somewhere in the bay range.
RAIL_SEARCH_M = 0.12
RAIL_MIN_Z = 1.8
FRAMED_MIN_GROOVE_CLUSTERS = 3
FRAMED_PITCH_RANGE_M = (0.45, 1.40)


# ====================================================================== layout

def bay_layout(width_m, frame, openings=()):
    """The wall, as members and fields, in metres from its picture-left corner.

    `openings` is [(kind, u0, u1)] in the same metres — the plan's own carriers.

    THE THREE LINES THE ROW IS ABOUT:

        n  = max(1, round(W / m))       how many bays this wall has
        bw = W / n                      and they are all exactly this wide
        u_i = i * bw                    so u_0 = 0 and u_n = W, EXACTLY

    A boundary at 0 and a boundary at W is what puts a stile in each corner, and
    it is true by construction rather than by tolerance: it is what `i * bw` is
    at `i = 0` and `i = n`. The corner stiles sit INSIDE the wall (`[0, s]` and
    `[W-s, W]`) rather than straddling it, because that is the joinery: each
    wall's corner stile is a whole member butted to its neighbour's, and the two
    of them make the internal angle. Straddling would draw one member as two
    halves and put the arris in the wrong place on both walls.
    """
    m = float(frame["module_m"])
    s = float(frame["stile_m"])
    # HALF UP, not `round()`. Python rounds a tie to the EVEN integer, so a
    # 2.00 m wall on a 0.80 m module would take 2 bays and a 2.80 m wall 3 --
    # the count would depend on the parity of the quotient, which is not a fact
    # about any wall. `floor(x + 0.5)` is the same everywhere and always.
    n = max(1, int(math.floor(width_m / m + 0.5)))
    bw = width_m / n
    bounds = [i * bw for i in range(n + 1)]

    stiles = []
    for i, u in enumerate(bounds):
        if i == 0:
            a, b = 0.0, min(s, width_m)
        elif i == n:
            a, b = max(0.0, width_m - s), width_m
        else:
            a, b = u - s / 2.0, u + s / 2.0
        stiles.append({"i": i, "at_m": u, "u0": a, "u1": b,
                       "corner": i in (0, n)})

    bays = [{"i": i, "u0": bounds[i], "u1": bounds[i + 1],
             "field_u0": stiles[i]["u1"], "field_u1": stiles[i + 1]["u0"],
             "opening": None} for i in range(n)]

    # ---- openings take WHOLE bays, and the snap distance is stated
    #
    # TWO THINGS THE PLAN HANDS US THAT A LAYOUT HAS TO SURVIVE, both found on
    # this manor rather than imagined: the same window listed twice (identical
    # rects), and a hearth whose rect OVERLAPS a window's — `kitchen/S` rules a
    # hearth at 2.50-5.50 m and a window at 4.00-5.50 m on the same wall. Bays
    # are exclusive, so duplicates are dropped and the wider opening takes the
    # contested bays; the loser is RECORDED as refused rather than silently
    # dropped, because a carrier that vanished without a line is how a plan
    # defect becomes an assembler defect.
    seen, uniq = set(), []
    for kind, a, b in openings:
        a, b = max(0.0, min(a, b)), min(width_m, max(a, b))
        if b - a <= 1e-6:
            continue
        k = (kind, round(a, 4), round(b, 4))
        if k in seen:
            continue
        seen.add(k)
        uniq.append((kind, a, b))
    # AND THE CONTEST IS SETTLED BY WHAT AN OPENING IS FOR, not by which is
    # wider. A DOOR first: it is a way through the player walks, and refusing
    # one hides a route -- `kitchen/W` rules a door at 4.25-5.25 m across a
    # window at 3.75-5.25 m, and by width alone the door lost and the wall came
    # back solid. A HEARTH next: a chimney breast is masonry and nothing can be
    # inside it. A WINDOW yields, because a window drawn in a chimney is the
    # member of that pair that was already wrong.
    RANK = {"door": 0, "hearth": 1, "window": 2}
    uniq.sort(key=lambda t: (RANK.get(t[0], 3), -(t[2] - t[1])))

    snapped, refused, taken = [], [], set()
    for kind, a, b in uniq:
        # BEST FIT IS LEAST TOTAL MOVEMENT, and the tie is broken OUTWARD. A
        # 1.00 m door on a 0.80 m bay grid is equidistant from one bay and from
        # two — 0.60 m of snap either way — and the two are not equally good: a
        # doorway narrower than its own leaf is a defect a player walks into,
        # and a doorway 0.20 m wider than ruled is a wider doorway. So the left
        # edge takes the earlier boundary on a tie and the right edge the later,
        # which is the same as saying an opening never shrinks to fit the grid.
        i = min(range(n), key=lambda k: (round(abs(bounds[k] - a), 9), k))
        j = min(range(i + 1, n + 1), key=lambda k: (round(abs(bounds[k] - b), 9), -k))
        if any(k in taken for k in range(i, j)):
            refused.append({"kind": kind, "asked_u_m": [round(a, 4), round(b, 4)],
                            "why": "its bays are already taken -- a door "
                                   "outranks a hearth outranks a window, and "
                                   "within a kind the wider opening wins"})
            continue
        taken.update(range(i, j))
        rec = {"kind": kind, "asked_u_m": [round(a, 4), round(b, 4)],
               "bays": [i, j - 1], "bay_count": j - i,
               "snapped_u_m": [round(bounds[i], 4), round(bounds[j], 4)],
               # AND THE HOLE IS CUT BETWEEN THE STILES, not between the bay
               # boundaries. An opening takes whole BAYS; the bay's own field
               # starts inside its stile, and where the bay is a corner bay that
               # stile IS the corner. Cutting to the boundary took the corner
               # stile out with it -- `kitchen/E`'s window snaps to the last bay
               # and came out flush against the angle, which is the picture the
               # ruling threw out even though the LAYOUT still reported a
               # boundary there. The jambs of a doorway are its stiles.
               "clear_u_m": [round(stiles[i]["u1"], 4),
                             round(stiles[j]["u0"], 4)],
               "snap_left_m": round(bounds[i] - a, 4),
               "snap_right_m": round(bounds[j] - b, 4),
               "snap_total_m": round(abs(bounds[i] - a) + abs(bounds[j] - b), 4)}
        for k in range(i, j):
            bays[k]["opening"] = kind
        snapped.append(rec)

    snapped.sort(key=lambda r: r["bays"][0])
    # NOT ROUNDED. "the bays divide the width exactly" is the row's own claim
    # and a record that rounds it is a record that cannot be checked against it.
    return {"width_m": width_m, "module_m": m, "bays": n,
            "bay_width_m": bw, "stile_m": s,
            "boundaries_m": list(bounds),
            "stiles": stiles, "bay_rects": bays, "openings": snapped,
            "openings_refused": refused, "frame": frame, "framed": True}


def edge_layout(width_m, edge):
    """An UNFRAMED wall's answer to the corner: an edge and nothing else.

    THE RULE, stated where it is implemented. A material with no frame keeps row
    36's sampler across the body of the wall — limewash has no bays and inventing
    some would be worse than tiling — and gains ONE member at each corner: a
    return stile where the wall is plaster, a quoin where it is masonry. What
    that buys is the half of the ruling that is about the corner rather than
    about the bay: the fabric now STOPS at a member instead of being cut by the
    corner, so nothing runs off.
    """
    w = float(edge["width_m"])
    w = min(w, max(0.0, width_m / 2.0 - 1e-6))
    return {"width_m": width_m, "framed": False, "edge": edge,
            "edge_w_m": w,
            "boundaries_m": [0.0, width_m],
            "stiles": [{"i": 0, "at_m": 0.0, "u0": 0.0, "u1": w, "corner": True},
                       {"i": 1, "at_m": width_m, "u0": width_m - w,
                        "u1": width_m, "corner": True}],
            "bays": 1, "bay_width_m": width_m,
            "stile_m": w, "bay_rects": [], "openings": [],
            "openings_refused": []}


def bands_of(frame, storey_m):
    """The wall's horizontal members and the field bands between them, in metres.

    Returns (members, fields). A member is drawn; a field is filled. The CORNICE
    IS MEASURED DOWN FROM THE CEILING and the plinth up from the floor, which is
    the fix for the third defect in this file's header: a wall's head belongs to
    the wall's own storey and not to whatever storey the source painting had.
    """
    h = float(frame["chair_rail_h_m"])
    rail_lo = float(frame["chair_rail_m"]) - h / 2.0
    rail_hi = rail_lo + h
    plinth = float(frame["plinth_m"])
    corn = float(frame["cornice_m"])
    corn_lo = storey_m - corn
    members = [("plinth", 0.0, plinth, PLINTH_H),
               ("chair_rail", rail_lo, rail_hi, RAIL_H),
               ("cornice", corn_lo, storey_m, CORNICE_H)]
    # KIND IS WHERE THE BAYS STOP. "full_height" is panelling carried to the
    # cornice, so both bands are bays. "dado" is WAINSCOT: bays below the chair
    # rail only, and above it ONE field the width of the wall — the hangings, or
    # the plaster — framed by the rail, the cornice and the two corner stiles.
    # A tapestry is one cloth and is not a grid of little panels; laying bays
    # over it would be the tiling defect again with the tiles renamed.
    if frame.get("kind") == "dado":
        return members, [("dado", plinth, rail_lo)], ("upper", rail_hi, corn_lo)
    fields = [("dado", plinth, rail_lo), ("upper", rail_hi, corn_lo)]
    fields = [f for f in fields if f[2] - f[1] > 0.05]
    return members, fields, None


# ================================================================== the harvest

def _boxblur1(a, r):
    if r < 1:
        return a.astype(np.float64)
    k = np.ones(2 * r + 1) / (2 * r + 1)
    return np.convolve(np.pad(a, r, mode="edge"), k, mode="valid")


def groove_mask(rgb, ppm, both_ways=False):
    """Which columns of a rectified wall patch are a joint rather than a face.

    `both_ways` also masks columns much BRIGHTER than their background, and the
    first render of this batch is why it exists: a moulding has two sides and
    the lit one is a highlight, so masking only the dark half of an arris leaves
    the bright half in the "clear" run — and one bright column carried into a
    fitted panel is a chrome stripe down the middle of it, which is what the
    kitchen's ninth bay came out as. The evidence test wants only the dark half
    (a groove is what it counts); the harvest wants both.
    """
    prof = rgb.mean(axis=(0, 2))
    bg = _boxblur1(prof, max(1, int(round(GROOVE_BG_M * ppm / 2))))
    d = bg - prof
    sd = float(d.std()) or 1.0
    m = (np.abs(d) > GROOVE_Z * sd) if both_ways else (d > GROOVE_Z * sd)
    r = max(1, int(round(GROOVE_DILATE_M * ppm)))
    out = m.copy()
    for k in range(1, r + 1):
        out[k:] |= m[:-k]
        out[:-k] |= m[k:]
    return out


#: A COLUMN THAT IS A VOID RATHER THAN A WALL, as a fraction of the patch's own
#: upper-quartile column. `free_windows` finds a carrier-free stretch from the
#: PLAN, and on `master_bedchamber/N` the plan rules its doorway at 3.53-4.57 m
#: while the PAINTING put one at 5.07-6.64 m — the aperture/ruler divergence row
#: 27 is about — so the "clear" window landed straight on a painted doorway and
#: the wainscot came back as a black rectangle. The groove test cannot catch it:
#: a two-metre void has no local contrast, it just IS dark. So darkness is
#: tested absolutely as well as locally, and the harvest walks away from a hole.
VOID_COLUMN_FRACTION = 0.35

#: AND THE OTHER KIND OF APERTURE, which the first fix missed: a leaded WINDOW
#: is not dark, it is the brightest thing on the wall. Trimming only the dark
#: end moved `master_bedchamber`'s harvest off its painted doorway and straight
#: onto its painted windows, and the tapestry came back with two leaded lights
#: woven into it and mirrored across the room. An opening is a column far from
#: the wall's own median in EITHER direction.
BRIGHT_COLUMN_FACTOR = 2.0

#: And the same guard at the end: a piece this dark is not oak, it is a shadow,
#: and a wall built out of it is black. Below this the source is refused and the
#: next one is tried.
MIN_PIECE_LUMA = 7.0


#: AND THE MASK IS SMOOTHED FIRST, over this many metres. An opening is at
#: least a third of a metre wide and a groove is twenty millimetres, so blurring
#: the column profile at 0.15 m leaves an aperture standing and flattens every
#: joint into the wall it belongs to. Without it the joints of a dark panelled
#: wall dip under the void threshold, the "clear" run fragments to a few
#: centimetres, and the kitchen's own frame test stops finding grooves to count
#: — which it did, and the kitchen came back tiled.
APERTURE_SMOOTH_M = 0.15


def aperture_mask(rgb, ppm):
    """Which columns of a rectified patch are an OPENING rather than a wall."""
    med = np.median(rgb.mean(axis=2), axis=0)
    med = _boxblur1(med, max(1, int(round(APERTURE_SMOOTH_M * ppm / 2))))
    ref = float(np.median(med)) or 1.0
    return (med < VOID_COLUMN_FRACTION * ref) | (med > BRIGHT_COLUMN_FACTOR * ref)


def widest_clear_run(mask):
    """(start, stop) of the longest False run in `mask`; (0, len) if all True."""
    best = (0, 0)
    i = 0
    n = len(mask)
    while i < n:
        if mask[i]:
            i += 1
            continue
        j = i
        while j < n and not mask[j]:
            j += 1
        if j - i > best[1] - best[0]:
            best = (i, j)
        i = j
    return best if best[1] > best[0] else (0, n)


def _cut_rows(albedo, storey_src, ppm, v0, v1):
    """Rows of a rectified patch for a metre band, top row = the ceiling."""
    rows = albedo.shape[0]
    r0 = int(round((storey_src - v1) / storey_src * rows))
    r1 = int(round((storey_src - v0) / storey_src * rows))
    r0 = max(0, min(r0, rows - 1))
    r1 = max(r0 + 1, min(r1, rows))
    return albedo[r0:r1]


def rectify(key, plan, ppm):
    """One promoted facing, de-lit and laid out in surface metres.

    Nothing is re-detected: `source_box` reads the box the promotion already
    wrote, `free_windows` reads the plan's own carriers, and `delight` is row
    36's de-lighting unchanged. This function's whole job is to hand back the
    wall as metres so that the cuts below can be made at RULED heights.
    """
    loc, f = key.split("/")
    mp = os.path.join(ROOT, "backdrops", loc, f + ".meta.json")
    pp = os.path.join(ROOT, "backdrops", loc, f + ".png")
    if not (os.path.exists(mp) and os.path.exists(pp)):
        return None, "%s is not promoted" % key
    meta = A.read_json(mp)
    b, why = A.source_box(meta)
    if b is None:
        return None, "%s has no box: %s" % (key, why)
    ppm_src = meta["px_per_m_at_wall"]
    storey = ((meta.get("measured_room") or {}).get("storey_height_m")
              or meta.get("storey_height_m"))
    width_m = (b["x1"] - b["x0"]) / ppm_src
    spans, hearths = A.carrier_spans_m(plan, loc, f, width_m)
    wins = A.free_windows(width_m, spans, hearths)
    if not wins:
        return None, "%s has no carrier-free stretch" % key
    u0, u1 = max(wins, key=lambda w: w[1] - w[0])
    rgb = load(pp)
    whole = A.sample_wall(rgb, b, width_m, storey, u0, u1, 0.0, storey, ppm)
    albedo, light = A.delight(whole, A.DELIGHT_SIGMA_M * ppm)
    # THE PATCH IS RETURNED WHOLE. The trim to what is actually wall belongs to
    # `harvest_pieces` and not here, because `frame_evidence` has to look at the
    # WHOLE wall to count grooves: trimming first once left it with 0.4 m of
    # panelling to find four bay joints in, it found none, and the kitchen fell
    # back to the tiled sampler the row exists to replace.
    return {"key": key, "albedo": albedo, "storey_src_m": storey,
            "window_u_m": [round(u0, 3), round(u1, 3)],
            "window_m": round(u1 - u0, 3),
            "carriers_avoided": sorted({s[0] for s in spans}),
            "png": "backdrops/%s/%s.png" % (loc, f),
            "source_ppm_at_wall": ppm_src, "width_m": round(width_m, 3),
            "delighting": light, "ppm": ppm}, None


def frame_evidence(rect, ppm, frame):
    """Does this painting actually carry joinery? Two ruled features, measured.

    (a) A HORIZONTAL MEMBER AT THE RULED 0.95 m. Blueprint §11 rules the chair
        rail onto every panelled wall in the manor, so its presence is a fact
        about the wall and not a taste: take the row-luminance profile, and ask
        whether any row within RAIL_SEARCH_M of 0.95 m stands RAIL_MIN_Z away
        from the field rows either side of it.
    (b) VERTICAL GROOVES THAT REPEAT. Cluster the groove columns and ask whether
        there are at least three of them and whether their mean spacing lands
        anywhere in the bay range. NOT the pitch — the module is ruled and this
        only has to know that joints exist and are periodic.

    Limewash passes neither. Panelling passes both. That is the whole test, and
    it is why row 41 does not have to trust a material's NAME.
    """
    a = rect["albedo"]
    storey = rect["storey_src_m"]
    L = a.mean(axis=2)
    rows = L.shape[0]

    def rows_for(v0, v1):
        r0 = int(round((storey - v1) / storey * rows))
        r1 = int(round((storey - v0) / storey * rows))
        return max(0, min(r0, rows - 1)), max(1, min(r1, rows))

    r0, r1 = rows_for(ANCHOR_M - RAIL_SEARCH_M, ANCHOR_M + RAIL_SEARCH_M)
    f0, f1 = rows_for(ANCHOR_M + 0.30, min(storey - 0.30, ANCHOR_M + 1.30))
    band = L[r0:r1].mean(axis=1)
    field = L[f0:f1].mean(axis=1)
    if len(band) < 2 or len(field) < 4:
        return {"framed": False, "why": "the patch is too short to look in"}
    mu, sd = float(field.mean()), float(field.std()) or 1.0
    rail_z = float(np.max(np.abs(band - mu)) / sd)

    g = groove_mask(a[f0:f1], ppm)
    clusters, i, n = [], 0, len(g)
    while i < n:
        if not g[i]:
            i += 1
            continue
        j = i
        while j < n and g[j]:
            j += 1
        clusters.append(0.5 * (i + j) / ppm)
        i = j
    spacing = (float(np.mean(np.diff(clusters))) if len(clusters) >= 2
               else None)
    periodic = (len(clusters) >= FRAMED_MIN_GROOVE_CLUSTERS and spacing is not None
                and FRAMED_PITCH_RANGE_M[0] <= spacing <= FRAMED_PITCH_RANGE_M[1])
    ok = rail_z >= RAIL_MIN_Z and periodic
    return {"framed": bool(ok), "rail_z": round(rail_z, 2),
            "rail_min_z": RAIL_MIN_Z, "groove_clusters": len(clusters),
            "groove_spacing_m": round(spacing, 3) if spacing else None,
            "pitch_range_m": list(FRAMED_PITCH_RANGE_M),
            "why": ("a chair rail at the ruled %.2f m (%.1f sd) and %d grooves "
                    "at %.3f m mean spacing" % (ANCHOR_M, rail_z, len(clusters),
                                                spacing or 0.0)) if ok else
                   ("no joinery: rail %.1f sd (needs %.1f), %d groove cluster(s)"
                    % (rail_z, RAIL_MIN_Z, len(clusters)))}


def harvest_pieces(rect, frame, ppm):
    """The four ruled cuts. See `WHAT IS HARVESTED AND WHAT IS DRAWN` above."""
    a = rect["albedo"]
    storey = rect["storey_src_m"]
    h = float(frame["chair_rail_h_m"])
    dado = frame.get("kind") == "dado"
    # WHERE THE WOOD IS CUT FROM DEPENDS ON THE KIND, and it has to: on a
    # WAINSCOTED wall the oak is BELOW the chair rail and what is above it is
    # the hangings. Cutting the wood from above the rail on `master_bedchamber`
    # is how the first render came back with tapestry fitted into every panel of
    # the wainscot — the material was harvested from the wrong half of the wall.
    if dado:
        v0, v_top = float(frame["plinth_m"]) + 0.05, ANCHOR_M - h / 2.0 - 0.05
    else:
        v0 = WOOD_V0
        v_top = min(storey - float(frame["cornice_m"]) - WOOD_MARGIN_TOP, 2.60)
    # FIRST, TRIM TO WHAT IS ACTUALLY WALL. `free_windows` asked the PLAN where
    # the carriers are; this asks the PIXELS, and on `master_bedchamber/N` the
    # two disagree by 1.5 m (row 27's aperture/ruler divergence), so the
    # plan-clear window arrives with a painted doorway down the middle of it and
    # every piece cut from it carries a black rectangle.
    mid = _cut_rows(a, storey, ppm, 0.30, min(storey - 0.30, 2.40))
    ap = aperture_mask(mid, ppm)
    k0, k1 = widest_clear_run(ap)
    if (k1 - k0) / ppm >= 0.50 and (k1 - k0) < a.shape[1]:
        a = a[:, k0:k1]
    else:
        k0 = 0
    wood_rows = _cut_rows(a, storey, ppm, v0, max(v0 + 0.20, v_top))
    g = groove_mask(wood_rows, ppm, both_ways=True)
    c0, c1 = widest_clear_run(g)
    # AND THE SAME TEST TURNED ON ITS SIDE. A panel has a top and a bottom edge
    # as well as two sides, and a wood patch that keeps one arrives with a
    # horizontal moulding through the middle of every field it fills — which is
    # what the kitchen's first render put through half its bays. So the clear
    # run is found in both directions and the patch is the intersection.
    gr = groove_mask(np.swapaxes(wood_rows, 0, 1), ppm, both_ways=True)
    r0, r1 = widest_clear_run(gr)
    if (r1 - r0) / ppm >= MIN_WOOD_M:
        wood_rows = wood_rows[r0:r1]
    clear_m = (c1 - c0) / ppm
    if clear_m < MIN_WOOD_M:
        c0, c1 = 0, wood_rows.shape[1]
        clear = False
    else:
        clear = True
    # ALL FOUR PIECES COME OUT OF THE SAME COLUMNS, and that is not tidiness: a
    # stile runs the FULL HEIGHT of a panelled wall, so a column with no joint
    # in it between the rail and the cornice has none in the dado either. Cut
    # the rails anywhere else and they arrive carrying the panel edges of
    # whichever bay they happened to cross.
    def cut(v0, v1):
        return _cut_rows(a, storey, ppm, v0, v1)[:, c0:c1]

    # THE HANGINGS, for a dado frame: the whole width of the window above the
    # rail, uncropped, because a cloth has no joints to steer clear of and the
    # widest piece is the one that repeats least inside its own field.
    upper = _cut_rows(a, storey, ppm, ANCHOR_M + h / 2.0 + 0.04,
                      max(ANCHOR_M + 0.30,
                          storey - float(frame["cornice_m"]) - 0.04))
    luma = float(np.median(wood_rows[:, c0:c1].mean(axis=2)))
    if luma < MIN_PIECE_LUMA:
        return None, ("%s: the clearest wainscot this facing offers is %.1f "
                      "luma, which is a shadow and not a material"
                      % (rect["key"], luma))
    return {
        "wood": wood_rows[:, c0:c1],
        "plinth": cut(0.0, float(frame["plinth_m"])),
        "rail": cut(ANCHOR_M - h / 2.0, ANCHOR_M + h / 2.0),
        "cornice": cut(storey - float(frame["cornice_m"]), storey),
        "upper_field": upper,
        "provenance": {
            "source_facing": rect["key"], "source_png": rect["png"],
            "source_storey_m": round(storey, 3),
            "window_u_m": rect["window_u_m"],
            "carriers_avoided": rect["carriers_avoided"],
            "clear_of_apertures_u_m": [
                round(rect["window_u_m"][0] + k0 / ppm, 3),
                round(rect["window_u_m"][0] + (k0 + a.shape[1]) / ppm, 3)],
            "wood_u_m": [round(rect["window_u_m"][0] + (k0 + c0) / ppm, 3),
                         round(rect["window_u_m"][0] + (k0 + c1) / ppm, 3)],
            "wood_v_m": [round(v0, 3), round(max(v0 + 0.20, v_top), 3)],
            "wood_from": "the wainscot, below the chair rail" if dado
                         else "the panelling, between the rail and the cornice",
            "wood_clear_of_grooves": clear,
            "wood_m": round(clear_m if clear else rect["window_m"], 3),
            "cuts": {
                "plinth_v_m": [0.0, round(float(frame["plinth_m"]), 3)],
                "rail_v_m": [round(ANCHOR_M - h / 2.0, 3),
                             round(ANCHOR_M + h / 2.0, 3)],
                "cornice_v_m": [round(storey - float(frame["cornice_m"]), 3),
                                round(storey, 3)]},
            "how": ("HARVESTED: the wood face and the three horizontal members "
                    "(plinth, chair rail, cornice), each cut at a RULED height "
                    "off this room's own promoted painting, de-lit by row 36's "
                    "own `delight`. DRAWN: every member's SHAPE and position, "
                    "from the bay layout — there is no stile in any painting at "
                    "the metre a fitted layout puts one."),
            "wood_median_luma": round(luma, 1),
        }}, None


def synthetic_pieces(frame, ppm, base=(126.0, 96.0, 62.0)):
    """The fallback when a room has no promoted painting to cut from.

    SYNTHESISED, and the record says so. Flat-shaded members in the material's
    own colours: no grain, no history, and the relief below is the only thing
    that makes them read. Used rather than refused because a wall with a drawn
    frame is still a wall, and a wall with a tiled crop is what the ruling threw
    out.
    """
    n = max(8, int(round(0.6 * ppm)))
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float64) / ppm
    L = 1.0 + 0.035 * np.sin(2 * np.pi * ys / 0.09) + 0.02 * np.cos(2 * np.pi * xs / 0.31)
    wood = np.stack([L * base[0], L * base[1], L * base[2]], axis=-1)
    return {"wood": wood, "plinth": wood, "rail": wood, "cornice": wood,
            "provenance": {"source_facing": None, "how":
                           "SYNTHESISED: flat-shaded members in the material's "
                           "own colours; no promoted painting of this material "
                           "was available to cut from."}}


# ================================================================ the drawing

#: THE FIELDED PANEL, in metres from its own edge inward. The material's own
#: `feature` string is "fielded panel bay" and this is what that means: the
#: panel is not a flat recess, it is a raised centre with a bevel run off it
#: onto a flat margin, and a quirk — a square shadow groove — where the margin
#: meets the framing. Drawn as a plain recess (which is what the first render
#: did) it reads as a rectangle scratched on a plank; drawn with its section it
#: reads as joinery, and the difference is 40 mm of geometry.
QUIRK_M = 0.008                 #: the shadow groove against the stile
MARGIN_M = 0.030                #: the flat margin outside the bevel
QUIRK_H = -0.007                #: how deep the quirk cuts below the panel plane
MARGIN_H = -0.002
FIELD_H = 0.011                 #: the raised centre, still shy of the stile face


def _panel_relief(d, bevel):
    """Relief inside a fielded panel, `d` metres in from its nearest edge."""
    ramp = np.clip((d - MARGIN_M) / max(bevel, 1e-6), 0.0, 1.0)
    out = np.where(d < QUIRK_M, QUIRK_H,
                   MARGIN_H + (FIELD_H - MARGIN_H) * ramp)
    return out


def _profile(name, t):
    """The SECTION of a horizontal member, as relief across its own height.

    `t` runs 0 at the member's foot to 1 at its head, and the number returned
    multiplies that member's proudness. A member drawn as one flat step has no
    section at all: the first render of the kitchen put the chair rail in at the
    right height and it read as a pencil line, because a flat band 3 mm prouder
    than the frame around it has nothing for the light to catch. These are the
    real sections, said in the fewest terms that produce their arrises:

      plinth      a flat face with the top chamfered off, which is what a
                  skirting is: the chamfer is the only worked edge on it.
      chair_rail  UNDERCUT, TORUS, FILLET, bottom to top — the shadow line under
                  the rail is the whole reason a chair rail reads across a room,
                  so the profile goes BELOW the frame plane at its foot rather
                  than merely less proud than it.
      cornice     three steps and the boldest projection at the head, because a
                  cornice is a corbelled thing and its steps are what say so.
      architrave  a bead against the opening and a flat outside it.
    """
    t = np.clip(t, 0.0, 1.0)
    if name == "plinth":
        return np.where(t < 0.82, 1.0, np.clip(1.0 - 4.2 * (t - 0.82), 0.25, 1.0))
    if name == "chair_rail":
        u = np.clip((t - 0.10) / 0.62, 0.0, 1.0)
        bead = np.sin(np.pi * u) ** 0.7
        return np.where(t < 0.10, -0.55,
                        np.where(t > 0.86, 0.50, 0.32 + 0.68 * bead))
    if name == "cornice":
        return np.where(t < 0.14, -0.45,
                        np.where(t < 0.42, 0.40,
                                 np.where(t < 0.70, 0.70, 1.0)))
    if name == "architrave":
        return np.where(t < 0.20, 0.45, np.where(t < 0.34, 1.0, 0.72))
    return np.ones_like(t)


def _fit(arr, w_px, h_px):
    """Resample a piece to fill a rectangle exactly. Fitted, never tiled."""
    w_px, h_px = max(1, int(w_px)), max(1, int(h_px))
    im = Image.fromarray(np.clip(np.round(arr), 0, 255).astype(np.uint8))
    return np.asarray(im.resize((w_px, h_px), Image.BICUBIC), dtype=np.float64)


def _run(arr, w_px, h_px):
    """A long member: fitted across its width, mirror-repeated along its run.

    A rail IS a continuous run of one moulding, so repeating its section along
    the wall is what the joinery does; the fitting is across the section, where
    the profile lives and a stretch would be a lie.
    """
    w_px, h_px = max(1, int(w_px)), max(1, int(h_px))
    src = _fit(arr, max(1, arr.shape[1]), h_px)
    n = src.shape[1]
    x = np.arange(w_px)
    t = np.mod(x, 2 * n)
    x = np.where(t < n, t, 2 * n - 1 - t)
    return src[:, x]


def _sub(arr, seed, frac=0.82):
    """A deterministic sub-crop, so no two fields are the same piece of oak."""
    h, w = arr.shape[:2]
    hh, ww = max(2, int(h * frac)), max(2, int(w * frac))
    y = (seed * 7919) % max(1, h - hh + 1)
    x = (seed * 104729) % max(1, w - ww + 1)
    return arr[y:y + hh, x:x + ww]


def _blit(dst, src, x0, y0):
    h, w = src.shape[:2]
    y1, x1 = min(dst.shape[0], y0 + h), min(dst.shape[1], x0 + w)
    y0, x0 = max(0, y0), max(0, x0)
    if y1 <= y0 or x1 <= x0:
        return
    dst[y0:y1, x0:x1] = src[:y1 - y0, :x1 - x0]


def _boxblur2(a, r):
    if r < 1:
        return a
    k = np.ones(2 * r + 1) / (2 * r + 1)
    out = np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode="edge"), k,
                                                    mode="valid"), 1, a)
    return np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode="edge"), k,
                                                     mode="valid"), 0, out)


def compose_wall(layout, pieces, storey_m, ppm, sampler=None):
    """One whole wall, in surface metres. Rows run ceiling-down, columns u-right.

    THE ORDER IS THE JOINERY'S OWN. Carcase, then the fields fitted one at a
    time into their own rectangles, then the stiles over them, then the rails
    over the stiles, then the openings and their architraves last, because that
    is the order a joiner assembles a wall and it is also the order in which
    each member should be the thing you see where two meet.
    """
    W_px = max(2, int(round(layout["width_m"] * ppm)))
    H_px = max(2, int(round(storey_m * ppm)))
    out = np.zeros((H_px, W_px, 3))
    relief = np.zeros((H_px, W_px))

    def rect_px(u0, u1, v0, v1):
        x0 = int(round(u0 * ppm))
        x1 = int(round(u1 * ppm))
        y0 = int(round((storey_m - v1) * ppm))
        y1 = int(round((storey_m - v0) * ppm))
        return (max(0, min(x0, W_px)), max(0, min(x1, W_px)),
                max(0, min(y0, H_px)), max(0, min(y1, H_px)))

    if not layout["framed"]:
        # ---- UNFRAMED: row 36's sampler for the body, an edge at each corner
        us = (np.arange(W_px) + 0.5) / ppm
        vs = storey_m - (np.arange(H_px) + 0.5) / ppm
        U, V = np.meshgrid(us, vs)
        out[:] = sampler(U, V)
        base = float(np.median(out))
        e = layout["edge_w_m"]
        kind = layout["edge"]["kind"]
        for u0, u1 in ((0.0, e), (layout["width_m"] - e, layout["width_m"])):
            x0, x1, y0, y1 = rect_px(u0, u1, 0.0, storey_m)
            if x1 <= x0:
                continue
            if kind == "quoin":
                # alternating blocks up the angle: a masonry corner is coursed
                c = float(layout["edge"].get("course_m") or 0.15)
                k = 0
                v = 0.0
                while v < storey_m:
                    v1 = min(storey_m, v + c)
                    w = (u1 - u0) if k % 2 == 0 else (u1 - u0) * 0.55
                    a, b = (u0, u0 + w) if u0 < 1e-6 else (u1 - w, u1)
                    bx0, bx1, by0, by1 = rect_px(a, b, v, v1)
                    if bx1 > bx0 and by1 > by0:
                        relief[by0:by1, bx0:bx1] = STILE_H
                        out[by0:by1, bx0:bx1] = np.clip(
                            out[by0:by1, bx0:bx1] * (1.0 + 0.06 * (k % 2)), 0, 255)
                    v, k = v1, k + 1
            else:
                relief[y0:y1, x0:x1] = STILE_H
                out[y0:y1, x0:x1] = np.clip(
                    _run(_sub(pieces["wood"], 3), x1 - x0, y1 - y0)
                    if pieces.get("wood") is not None else base, 0, 255)
        return _shade(out, relief, ppm)

    frame = layout["frame"]
    members, fields, upper = bands_of(frame, storey_m)

    # ---- 1. the carcase: nothing must be able to show through as black
    out[:] = _fit(pieces["wood"], W_px, H_px)
    relief[:] = STILE_H

    # ---- 1b. THE ONE FIELD OF A WAINSCOTED WALL: the hangings, corner to
    # corner between the rail and the cornice, mirror-tiled INSIDE their own
    # frame. That is the ruling's own permission — a texture may fill a field —
    # and the field here is the whole upper wall because a hanging is one cloth.
    bevel = float(frame["bevel_m"])
    if upper is not None:
        _band, v0, v1 = upper
        u0 = layout["stiles"][0]["u1"]
        u1 = layout["stiles"][-1]["u0"]
        x0, x1, y0, y1 = rect_px(u0, u1, v0, v1)
        if x1 - x0 > 2 and y1 - y0 > 2:
            cloth = pieces.get("upper_field")
            if cloth is None or cloth.size == 0:
                cloth = pieces["wood"]
            src = _fit(cloth, max(2, cloth.shape[1]), y1 - y0)
            n = src.shape[1]
            xi = np.arange(x1 - x0)
            t = np.mod(xi, 2 * n)
            _blit(out, src[:, np.where(t < n, t, 2 * n - 1 - t)], x0, y0)
            ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float64)
            du = np.minimum(xs / ppm - u0, u1 - xs / ppm)
            dv = np.minimum((storey_m - ys / ppm) - v0, v1 - (storey_m - ys / ppm))
            relief[y0:y1, x0:x1] = _panel_relief(np.minimum(du, dv), bevel)

    # ---- 2. the FIELDS, one at a time, each fitted to its own rectangle
    for band, v0, v1 in fields:
        for bay in layout["bay_rects"]:
            if bay["opening"]:
                continue
            u0, u1 = bay["field_u0"], bay["field_u1"]
            if u1 - u0 < 0.02:
                continue
            x0, x1, y0, y1 = rect_px(u0, u1, v0, v1)
            if x1 - x0 < 2 or y1 - y0 < 2:
                continue
            seed = bay["i"] * 3 + (1 if band == "upper" else 2)
            _blit(out, _fit(_sub(pieces["wood"], seed), x1 - x0, y1 - y0), x0, y0)
            # the panel is recessed and chamfered into the frame plane
            ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float64)
            du = np.minimum(xs / ppm - u0, u1 - xs / ppm)
            dv = np.minimum((storey_m - ys / ppm) - v0, v1 - (storey_m - ys / ppm))
            relief[y0:y1, x0:x1] = _panel_relief(np.minimum(du, dv), bevel)

    # ---- 3. the STILES, over the fields, ONE IN EACH CORNER.
    #
    # A corner stile runs the FULL height whatever the kind is, and that is the
    # half of the ruling that is about the corner: even where the wall above the
    # rail is one cloth, the cloth has to STOP at a member rather than be cut by
    # the angle. An intermediate stile on a wainscoted wall stops at the rail,
    # because there are no bays above it to divide.
    head = members[2][1] if members else storey_m
    rail_top = members[1][2] if members else storey_m
    for st in layout["stiles"]:
        top = head if st["corner"] or upper is None else rail_top
        x0, x1, y0, y1 = rect_px(st["u0"], st["u1"], 0.0, top)
        if x1 - x0 < 1 or y1 - y0 < 1:
            continue
        _blit(out, _run(_sub(pieces["wood"], 11 + st["i"]), x1 - x0, y1 - y0), x0, y0)
        relief[y0:y1, x0:x1] = STILE_H

    # ---- 4. the RAILS, full width, harvested strips at their ruled heights
    for name, v0, v1, level in members:
        x0, x1, y0, y1 = rect_px(0.0, layout["width_m"], v0, v1)
        if x1 - x0 < 1 or y1 - y0 < 1:
            continue
        _blit(out, _run(pieces[name if name != "chair_rail" else "rail"],
                        x1 - x0, y1 - y0), x0, y0)
        t = (np.arange(y1 - y0)[::-1] + 0.5) / max(1, y1 - y0)
        relief[y0:y1, x0:x1] = (level * _profile(name, t))[:, None]

    # ---- 5. the OPENINGS, whole bays, each in its own architrave
    #
    # EVERY ARCHITRAVE BEFORE ANY APERTURE, and the master bedchamber's north
    # wall is why: its hearth and its door take adjacent bays, and drawing each
    # opening complete in turn let the second one's architrave paint over the
    # first one's void — one black mass 2.6 m wide where the plan rules a
    # chimney and a doorway with framing between them. Members are a layer and
    # voids are a layer; they are not interleaved.
    arch = float(frame["architrave_m"])
    head_m = min(2.05, storey_m - float(frame["cornice_m"]) - 0.05)
    for op in layout["openings"]:
        a, b = op["clear_u_m"]
        # a hearth's opening is a fireplace, not a doorway: it stops well under
        # the door head. Its chimneypiece is a row-37 sprite and is not drawn.
        v1 = {"window": min(head_m, 2.00), "hearth": min(head_m, 1.75)}.get(
            op["kind"], head_m)
        v0 = 0.0 if op["kind"] in ("door", "hearth") else 0.95
        op["drawn_v_m"] = [round(v0, 3), round(v1, 3)]
        ax0, ax1, ay0, ay1 = rect_px(max(0.0, a - arch), min(layout["width_m"], b + arch),
                                     v0, min(storey_m, v1 + arch))
        if ax1 - ax0 > 1 and ay1 - ay0 > 1:
            _blit(out, _run(_sub(pieces["wood"], 31 + op["bays"][0]),
                            ax1 - ax0, ay1 - ay0), ax0, ay0)
            ys, xs = np.mgrid[ay0:ay1, ax0:ax1].astype(np.float64)
            d = np.minimum.reduce([xs / ppm - (a - arch), (b + arch) - xs / ppm,
                                   (storey_m - ys / ppm) - v0,
                                   (v1 + arch) - (storey_m - ys / ppm)])
            relief[ay0:ay1, ax0:ax1] = ARCH_H * _profile(
                "architrave", np.clip(d / max(arch, 1e-6), 0.0, 1.0))
    med = float(np.median(out))
    for op in layout["openings"]:
        a, b = op["clear_u_m"]
        v0, v1 = op["drawn_v_m"]
        x0, x1, y0, y1 = rect_px(a, b, v0, v1)
        if x1 - x0 <= 1 or y1 - y0 <= 1:
            continue
        if op["kind"] == "hearth":
            # A HEARTH IS NOT A HOLE. Row 37, verbatim: "windows and fireplaces
            # should be sprites"; carriers leave the backdrop for the library.
            # So the layout gives the chimney breast its bays and its surround
            # and stops there — drawn as a void it is a 2.4 m black rectangle in
            # the middle of the wall, which is a worse lie than an empty breast.
            _blit(out, _fit(_sub(pieces["wood"], 47 + op["bays"][0]),
                            x1 - x0, y1 - y0), x0, y0)
            ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float64)
            du = np.minimum(xs / ppm - a, b - xs / ppm)
            dv = np.minimum((storey_m - ys / ppm) - v0, v1 - (storey_m - ys / ppm))
            relief[y0:y1, x0:x1] = _panel_relief(np.minimum(du, dv), bevel)
            op["drawn"] = ("a framed recess; the chimneypiece itself is a "
                           "row-37 sprite and is not painted into the backdrop")
            continue
        fill = (GLAZING_LUMA if op["kind"] == "window"
                else np.clip(med * 0.35, 0, 255))
        out[y0:y1, x0:x1] = fill
        relief[y0:y1, x0:x1] = APERTURE_D
        op["drawn"] = ("neutral glazing ground" if op["kind"] == "window"
                       else "an unlit void; `paint_voids` repaints it")

    return _shade(out, relief, ppm)


def _shade(rgb, relief, ppm):
    """Turn the relief map into arrises and rebate shadow. Material, not light.

    See `RELIEF_KEY`: the key is a fixed direction in the WALL's own surface, so
    it turns with the wall and cannot make two walls of one room disagree — the
    trap `row36_light.KEY_DIR_PLAN` records falling into and climbing out of.
    """
    r = _boxblur2(relief, max(1, int(round(RELIEF_SMOOTH_M * ppm))))
    gv, gu = np.gradient(r)
    gu *= ppm
    gv *= -ppm                       # rows run downward; v runs upward
    lit = 1.0 + RELIEF_GAIN * (gu * RELIEF_KEY[0] + gv * RELIEF_KEY[1])
    ao = _boxblur2(relief, max(1, int(round(AO_M * ppm))))
    depth = np.clip((ao - relief) / max(STILE_H, 1e-6), 0.0, 1.0)
    shade = np.clip(lit, *RELIEF_CLAMP) * (1.0 - AO_DEPTH * depth)
    return np.clip(rgb * shade[..., None], 0.0, 255.0)


# ============================================================== the whole room

def room_perimeter(room):
    r = room["rect"]
    return (r["x1"] - r["x0"]), (r["y1"] - r["y0"])


def wall_widths(room):
    """Each facing's own width, in the ONE sense `perimeter_origin_m` walks.

    Taken from the room rect rather than from a facing's declared box, because
    the perimeter has to close: N + E + S + W must be the rect's own circuit or
    a return lands on the wrong wall. The two agree exactly on every room this
    row assembles, and where they would not the rect is the plan and wins.
    """
    w, h = room_perimeter(room)
    return {"N": w, "E": h, "S": w, "W": h}


class RoomWalls(object):
    """Four composed walls, addressed by perimeter metres — the row-36 index.

    `sample(u, v)` is the ONLY thing the assembler calls, and it takes exactly
    the two numbers `surface_metres` already produces for a wall or a return. So
    a return is not a special case here at all: it asks for its neighbour's
    perimeter metres and gets its neighbour's own composed wall, corner stile
    included, which is what makes a completed bay sit on each side of a corner
    by arithmetic rather than by a matching pass.
    """

    def __init__(self, room, ppm, storey_m, walls):
        self.room = room
        self.ppm = ppm
        self.storey_m = storey_m
        self.walls = walls                      # facing -> {img, layout, origin, width}
        w, h = room_perimeter(room)
        self.perimeter_m = 2.0 * (w + h)

    def sample(self, u_m, v_m):
        u = np.mod(np.asarray(u_m, dtype=np.float64), self.perimeter_m)
        v = np.asarray(v_m, dtype=np.float64)
        out = np.zeros(u.shape + (3,))
        for f, wl in self.walls.items():
            o, wd = wl["origin"], wl["width_m"]
            m = (u >= o - 1e-9) & (u < o + wd - 1e-9)
            if not np.any(m):
                continue
            img = wl["img"]
            H_px, W_px = img.shape[:2]
            x = np.clip((u[m] - o) * self.ppm, 0, W_px - 1 - 1e-6)
            y = np.clip((self.storey_m - v[m]) * self.ppm, 0, H_px - 1 - 1e-6)
            x0 = x.astype(np.int32)
            y0 = y.astype(np.int32)
            x1 = np.minimum(x0 + 1, W_px - 1)
            y1 = np.minimum(y0 + 1, H_px - 1)
            fx = (x - x0)[..., None]
            fy = (y - y0)[..., None]
            out[m] = ((img[y0, x0] * (1 - fx) + img[y0, x1] * fx) * (1 - fy) +
                      (img[y1, x0] * (1 - fx) + img[y1, x1] * fx) * fy)
        return out

    def layouts(self):
        return {f: w["layout"] for f, w in self.walls.items()}

    def doors_m(self, facing):
        """The SNAPPED door rects for one facing, so the void agrees with the frame."""
        lay = self.walls[facing]["layout"]
        return [tuple(op["clear_u_m"]) for op in lay.get("openings", [])
                if op["kind"] == "door"]


def frame_for(mid, doc):
    mat = (doc.get("materials") or {}).get(mid) or {}
    return mat.get("frame"), mat.get("edge")


def build_room(room_id, plan=None, facings=None, doc=None, verbose=False):
    """Everything row 41 does to one room, in the order it has to happen."""
    plan = plan or A.read_json(PLAN)
    facings = facings or A.read_json(FACINGS)["facings"]
    doc = doc or A.read_json(MATERIALS)
    room = next((r for r in plan["rooms"] if r["id"] == room_id), None)
    if room is None:
        raise SystemExit("no room " + room_id)

    keys = ["%s/%s" % (room_id, f) for f in "NESW"
            if "%s/%s" % (room_id, f) in facings]
    keys = [k for k in keys if facings[k].get("facing_type") != "open"]
    if not keys:
        raise SystemExit("%s has no enclosed facing" % room_id)

    ppm = max(float(facings[k]["declared_ppm"]) for k in keys)
    storeys = {float(facings[k]["declared"]["storey_height_m"]) for k in keys}
    storey_m = max(storeys)

    mid = facings[keys[0]]["walls"]
    frame, edge = frame_for(mid, doc)
    field_mid = facings[keys[0]].get("field")

    # ---- the harvest source: this room's own promoted walls, widest window first
    rects, why_not = [], []
    for k in keys:
        r, why = rectify(k, plan, ppm)
        (rects if r else why_not).append(r or {"key": k, "why": why})
    rects.sort(key=lambda r: -r["window_m"])

    # ---- is this wall framed? the material says so, or the painting proves it
    evidence = None
    provenance_frame = "declared"
    if not frame:
        for r in rects:
            ev = frame_evidence(r, ppm, DEFAULT_FRAME)
            if evidence is None or ev["framed"]:
                evidence = dict(ev, facing=r["key"])
            if ev["framed"]:
                frame = dict(DEFAULT_FRAME)
                provenance_frame = "measured"
                break

    # ---- the pieces, from the FIRST source that actually yields material.
    # Not the first source, full stop: `master_bedchamber/N`'s widest
    # plan-clear window lands on a painted doorway the plan does not know
    # about, and a wall built out of that is black.
    pieces, piece_refusals = None, []
    for r in rects:
        pieces, why = harvest_pieces(r, frame or DEFAULT_FRAME, ppm)
        if pieces is not None:
            break
        piece_refusals.append(why)
    if pieces is None:
        pieces = synthetic_pieces(frame or DEFAULT_FRAME, ppm)
        pieces["provenance"]["refused"] = piece_refusals

    sampler = None
    if not frame:
        rec = A.load_material(mid)
        fld = A.load_material(field_mid) if field_mid else None

        def sampler(U, V, rec=rec, fld=fld):
            base = A.wall_pixels(rec, U, V)
            if fld is not None:
                m = V >= ANCHOR_M + A.ANCHOR_BAND_M / 2.0
                if np.any(m):
                    base[m] = A.wall_pixels(fld, U[m], V[m] - ANCHOR_M)
            return base

    widths = wall_widths(room)
    walls = {}
    for k in keys:
        f = k.split("/")[1]
        wd = widths[f]
        spans, _h = A.carrier_spans_m(plan, room_id, f, wd)
        if frame:
            lay = bay_layout(wd, frame, spans)
        else:
            lay = edge_layout(wd, edge or {"kind": "return_stile", "width_m": 0.11})
        img = compose_wall(lay, pieces, storey_m, ppm, sampler=sampler)
        walls[f] = {"img": img, "layout": lay, "width_m": wd,
                    "origin": A.perimeter_origin_m(room, f, wd),
                    "material": mid, "field": field_mid}
        if verbose:
            print("  %s/%s  W %.3f m  m %.2f  n %d  bay %.4f m  %s"
                  % (room_id, f, wd,
                     lay.get("module_m") or 0.0, lay["bays"], lay["bay_width_m"],
                     ", ".join("%s snap %+.3f/%+.3f" % (o["kind"], o["snap_left_m"],
                                                        o["snap_right_m"])
                               for o in lay["openings"]) or "no openings"))

    rw = RoomWalls(room, ppm, storey_m, walls)
    rw.record = {
        "room": room_id, "ppm": round(ppm, 3), "storey_m": storey_m,
        "material": mid, "field_material": field_mid,
        "framed": bool(frame), "frame": frame, "edge": edge,
        "frame_provenance": provenance_frame if frame else "unframed",
        "frame_evidence": evidence,
        "pieces": (pieces or {}).get("provenance"),
        "harvest_refused": [w for w in why_not] + [{"why": w} for w in piece_refusals],
        "walls": {f: {k: v for k, v in w["layout"].items()
                      if k not in ("frame",)} for f, w in walls.items()},
    }
    return rw


# ============================================================== the corner check

def corner_rows(rw):
    """For every corner: does a bay boundary land ON it, on BOTH sides?

    THE ACCEPTANCE, WHERE THE DEFECT LIVES. Row 41's own clause: "a corner strip
    must show a completed bay on each side; no bay is cut by a corner". Both
    halves of that reduce to one number per side — how far the NEAREST bay
    boundary on that wall sits from the corner — and the bar is one stile width,
    because a boundary inside the stile IS the corner as far as the joinery goes.

    WHAT WOULD GO RED. Revert any wall to a tiled crop and this fails on that
    wall's every corner at once, because a tiled fabric has no boundaries to
    report: the layout comes back unframed and edgeless and the check has
    nothing within a stile of the corner to find. That is the point of asserting
    on the LAYOUT rather than on the composed pixels — the pixels of a tiled
    wall look like panelling too, which is exactly how row 36 shipped.
    """
    side_of = {"N": ("W", "E"), "S": ("E", "W"), "E": ("N", "S"), "W": ("S", "N")}
    rows = []
    for f, wl in sorted(rw.walls.items()):
        lay = wl["layout"]
        for hand, nb in zip(("left", "right"), side_of[f]):
            if nb not in rw.walls:
                continue
            nlay = rw.walls[nb]["layout"]
            # this wall's own corner: u = 0 at picture-left, u = W at right
            mine_at = 0.0 if hand == "left" else lay["width_m"]
            theirs_at = (nlay["width_m"] if hand == "left" else 0.0)
            # A WALL WITH NO BOUNDARIES IS THE FAILURE, not an exception:
            # row 36's tiled construction has none at all, and the gate has to
            # report that as a corner that cannot be met rather than crash.
            d_mine = min([abs(b - mine_at) for b in lay["boundaries_m"]]
                         or [float("inf")])
            d_theirs = min([abs(b - theirs_at) for b in nlay["boundaries_m"]]
                           or [float("inf")])
            bar = max(lay["stile_m"], nlay["stile_m"])
            covered = _stile_covers(lay, mine_at) and _stile_covers(nlay, theirs_at)
            rows.append({
                "corner": "%s|%s" % (f, nb), "hand": hand,
                "this_wall": f, "next_wall": nb,
                "boundary_gap_this_m": d_mine,
                "boundary_gap_next_m": d_theirs,
                "bar_one_stile_m": round(bar, 6),
                "stile_covers_corner": bool(covered),
                "bays_this": lay["bays"], "bays_next": nlay["bays"],
                "pass": bool(d_mine <= bar + 1e-9 and d_theirs <= bar + 1e-9
                             and covered)})
    return rows


def _stile_covers(layout, u):
    for st in layout.get("stiles", []):
        if st["u0"] - 1e-9 <= u <= st["u1"] + 1e-9:
            return True
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--room", required=True)
    ap.add_argument("--json", default="")
    args = ap.parse_args()
    rw = build_room(args.room, verbose=True)
    rows = corner_rows(rw)
    print("  corners:")
    for r in rows:
        print("    %-6s %-5s  this %s gap %.6f m   next %s gap %.6f m   "
              "bar %.3f m   %s"
              % (r["corner"], r["hand"], r["this_wall"], r["boundary_gap_this_m"],
                 r["next_wall"], r["boundary_gap_next_m"], r["bar_one_stile_m"],
                 "PASS" if r["pass"] else "FAIL"))
    bad = [r for r in rows if not r["pass"]]
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(dict(rw.record, corners=rows), fh, indent=2, default=float)
            fh.write("\n")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
