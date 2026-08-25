#!/usr/bin/env python3
"""Row 36 — ASSEMBLY FROM ESTABLISHED PIECES. The snap's five planes, backward.

    python3 design/plan-draft/measured/row36_assemble.py --harvest-all
    python3 design/plan-draft/measured/row36_assemble.py --harvest wall/dark-oak-panelling

[HUMAN, 2026-08-24, verbatim] "I believe once we establish a few of these floor,
ceiling and wall textures we can assemble them intelligently and fast."

WHAT THIS IS, IN ONE SENTENCE. `row35_snap.py` maps a target image through the
five planes back to a source image; harvest stops at the middle of that journey
— surface metres to surface parameters to source pixels — and keeps what it
finds as a tile. Same `region_matrix`, same five `REGIONS`, same file. There is
no second copy of the plane math anywhere in this row.

WHY WALLS AND NOT FLOORS. `design/specs/36-plan.md` §1.2 measured every promoted
facing's own box and asked, per region, what resolution the painting supplies
along each of that surface's two axes. A facing WALL's map is a similarity — row
35 preserves the painted proportions precisely so it is — and the measurement
agrees: anisotropy exactly 1.000 on all 51 facings. Floors and ceilings are
grazing surfaces: 2.0x and 1.8x anisotropic at the median, and NOT ONE of the 51
supplies the resolution a declared view demands of them. So walls are harvested
here and floors and ceilings are asked for flat, which is the swatch lane.

THE SCALE CONTRACT (§1.4a), and the half of it that lives in this file. A
harvested tile's ppm is CHOSEN, not measured: the sampling lattice is laid out
in surface metres, so the number is an input. What is measured is whether the
source can carry it — `supply_across` and `supply_along` against the lattice —
and a source that cannot is refused rather than interpolated up to the ask.

WHY A WALL IS THREE TILES AND NOT ONE. The instrument reads scale off the
voice's anchor at exactly 0.95 m. A wall tiled from one patch at an arbitrary
vertical phase would either lose that anchor or repeat it at the wrong heights,
so the fabric is harvested as bands whose vertical position is fixed in metres —
dado, the anchor strip itself, and the field above it — and only the horizontal
direction tiles. That makes measurability a property of the assembly, the way
blueprint §11's wainscot ruling made it a property of the wall specification.

NEUTRALITY, AND WHAT DIVISION CANNOT DO. Row 37 rules that pieces carry material
and not illumination, and the promoted corpus was painted lit. Two mechanisms,
in this order:

  the RULE     a window whose centre lies within the firelight radius of a lit
               hearth is refused outright, never merely ranked down. Ranking
               still admits a firelit wall when nothing better exists, and
               nothing better existing is exactly when a bad tile does the most
               damage.
  the DIVISION per-channel, because dividing by a scalar luminance field leaves
               a warm cast exactly where it was. Its cost is stated rather than
               hidden: per-channel division also flattens real low-frequency
               material colour, so a wall whose oak genuinely darkens along its
               length comes back more uniform than it is. That is why the rule
               is primary and the division is residual cleanup.
"""
import argparse
import hashlib
import json
import os
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row35_snap as S                                           # noqa: E402
from measure_lib import load                                     # noqa: E402

W, H = S.W, S.H
PLAN = os.path.join(ROOT, "fixtures", "demo-study", "plan.json")
TEXDIR = os.path.join(ROOT, "backdrops", "textures")
MATERIALS = os.path.join(TEXDIR, "materials.json")
FACINGS = os.path.join(TEXDIR, "facings.json")

#: The anchor every voice puts at this height, and the instrument's own divisor.
#: `row23_lib` converts one measured horizontal by `rail_above / 0.95`; that
#: number is the instrument's and this file may not move it.
ANCHOR_M = 0.95

#: How tall the anchor's own strip is. A craft number and it says so: wide
#: enough to carry a rail's moulding and its undercut shadow, narrow enough that
#: the bands either side of it are most of the wall.
ANCHOR_BAND_M = 0.14

#: How far from a carrier's edge a harvest window must stay. A door's reveal and
#: a window's splay are not wall fabric, and they run a little wider than the
#: opening the plan rules.
CARRIER_MARGIN_M = 0.30

#: THE FIRELIGHT RULE'S RADIUS. Derived rather than chosen: it is the distance
#: at which a hearth's own falloff drops to the ambient it sits in, which is the
#: same number `row36_light.py` relights with, so moving it moves both.
FIRELIGHT_R_M = 2.6

#: THE SMALLEST WINDOW WORTH HARVESTING, and it was 0.55 m until the demo batch
#: showed what that buys. `wall/plain-limewash-to-floor` harvested a 0.60 m
#: window off `servants_hall/E`; mirror-tiled across the kitchen's 8 m wall that
#: is thirteen repeats, and it does not read as limewashed plaster -- it reads
#: as PANELLING, because a repeat at that pitch is a feature whether or not
#: anyone painted one. Repetition was named as this row's likeliest loss and
#: this is it, arriving exactly where it was expected.
#:
#: 2.00 m is a craft number with its evidence: the swatch lane asks for 3.5 m of
#: material for the same slot, and a harvest under two metres cannot come within
#: sight of that on any wall the manor actually has. A material that cannot
#: offer this much clear wall converts to a swatch, which is the same conversion
#: path the supply shortfall uses.
MIN_WINDOW_M = 2.00

#: The lattice is laid out at the slot's declared demand times this. 1.0 exactly
#: — a harvest stores what the view asks for and no more, because storing above
#: the demand is inventing detail the painting never had.
LATTICE_OVER_DEMAND = 1.0

#: A source must supply at least this fraction of the lattice on BOTH axes.
#: `36-plan.md` §1.8: the corpus's worst wall demand-to-supply ratio is 1.41x and
#: the median 1.06x, so 1/1.5 admits the corpus and refuses a genuine shortfall.
MIN_SUPPLY_RATIO = 1.0 / 1.5


# ------------------------------------------------------------------ the store

def read_json(p):
    with open(p) as fh:
        return json.load(fh)


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def promoted_facings(facings):
    out = []
    for key in facings:
        loc, f = key.split("/")
        png = os.path.join(ROOT, "backdrops", loc, f + ".png")
        meta = os.path.join(ROOT, "backdrops", loc, f + ".meta.json")
        if os.path.exists(png) and os.path.exists(meta):
            out.append(key)
    return sorted(out)


def source_box(meta):
    """The box the PROMOTED meta already states. Nothing is re-detected.

    Every number here was written by `promote-backdrop.mjs` off the painting it
    admitted, so the box is that promotion's own reading and not a second
    opinion about the same pixels.
    """
    ppm = meta.get("px_per_m_at_wall")
    imh = meta.get("image_h_px")
    if not (ppm and imh):
        return None, "no scale"
    storey = (meta.get("measured_room") or {}).get("storey_height_m") or meta.get("storey_height_m")
    if not storey:
        return None, "no storey height"
    yf = meta["floor_line_y"] * imh
    vy = meta["horizon_y"] * imh
    yc = yf - storey * ppm
    x0, x1 = meta.get("corner_x0_px"), meta.get("corner_x1_px")
    if x0 is None or x1 is None:
        # An unbounded wall overruns the frame; its corners are where the
        # painted width puts them, which is what the meta's own wall_width says.
        half = (meta.get("wall_width_m") or 6.0) * ppm / 2.0
        x0, x1 = W / 2.0 - half, W / 2.0 + half
    b = S.box(x0, x1, yc, yf, W / 2.0, vy)
    bad = S.box_refusal(b)
    if bad:
        return None, bad
    return b, None


# ------------------------------------------------------- carriers, in metres

def facing_geometry(plan, loc, facing):
    room = next((r for r in plan["rooms"] if r["id"] == loc), None)
    if room is None:
        return None
    fac = (room.get("facings") or {}).get(facing)
    if not fac:
        return None
    return room, fac


def carrier_spans_m(plan, loc, facing, width_m):
    """Where every plan carrier sits ALONG this wall, in metres from its left.

    Taken from the plan rather than from the meta's measured openings, because a
    meta records the doorway it could read and the plan records every window and
    hearth as well — and a harvest window that crosses a painted window is a
    tile with a window in it.
    """
    got = facing_geometry(plan, loc, facing)
    if not got:
        return [], []
    room, fac = got
    rect, wl = room["rect"], fac.get("wall_line")
    if wl is None:
        return [], []
    horiz = facing in ("N", "S")
    lo = rect["x0"] if horiz else rect["y0"]
    hi = rect["x1"] if horiz else rect["y1"]
    # The wall runs left-to-right in the picture; which plan direction that is
    # depends on which way the camera looks. N looks +y, so left is -x; S looks
    # -y, so left is +x; E looks +x, left is +y; W looks -x, left is -y.
    flip = facing in ("S", "W")
    spans, hearths = [], []
    src = ([("door", o["rect"], o.get("joins"), None) for o in plan["openings"]] +
           [("window", w["rect"], None, None) for w in plan["windows"]] +
           [("hearth", fp["rect"], None, fp.get("room")) for fp in plan["fireplaces"]])
    for kind, cr, joins, rm in src:
        near = (min(abs(cr["y0"] - wl), abs(cr["y1"] - wl)) if horiz
                else min(abs(cr["x0"] - wl), abs(cr["x1"] - wl)))
        if near > 0.35:
            continue
        if kind == "hearth" and rm and rm != loc:
            continue
        if kind == "door" and joins and loc not in joins:
            continue
        a = cr["x0"] if horiz else cr["y0"]
        b = cr["x1"] if horiz else cr["y1"]
        if b <= lo or a >= hi:
            continue
        # into wall-local metres, measured from the picture's left corner
        if flip:
            u0, u1 = hi - min(b, hi), hi - max(a, lo)
        else:
            u0, u1 = max(a, lo) - lo, min(b, hi) - lo
        u0, u1 = sorted((u0, u1))
        # the plan's wall may be wider than the painting's; scale into it
        span = hi - lo
        if span > 0 and abs(span - width_m) > 1e-6:
            u0, u1 = u0 * width_m / span, u1 * width_m / span
        spans.append((kind, max(0.0, u0), min(width_m, u1)))
        if kind == "hearth":
            hearths.append(0.5 * (u0 + u1))
    return spans, hearths


def free_windows(width_m, spans, hearths, margin=CARRIER_MARGIN_M):
    """The stretches of wall with no carrier on them and no firelight.

    Returns (windows, refusals) so a refusal is reported rather than a gap
    silently not existing.
    """
    blocked = []
    for kind, a, b in spans:
        blocked.append((max(0.0, a - margin), min(width_m, b + margin)))
    for c in hearths:
        blocked.append((c - FIRELIGHT_R_M, c + FIRELIGHT_R_M))
    blocked.sort()
    merged = []
    for a, b in blocked:
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    out, cur = [], 0.0
    for a, b in merged:
        if a - cur >= MIN_WINDOW_M:
            out.append((cur, a))
        cur = max(cur, b)
    if width_m - cur >= MIN_WINDOW_M:
        out.append((cur, width_m))
    return out


# ----------------------------------------------------------------- the bands

def bands_for(storey_m):
    """dado / anchor / field, in metres above the floor.

    Vertical position is fixed in metres and only the horizontal tiles, which is
    what puts the anchor at exactly 0.95 m on every wall assembled from this
    fabric — the property the instrument measures scale off.
    """
    half = ANCHOR_BAND_M / 2.0
    return [
        ("dado", 0.0, max(0.0, ANCHOR_M - half)),
        ("anchor", ANCHOR_M - half, ANCHOR_M + half),
        ("field", ANCHOR_M + half, storey_m),
    ]


# ------------------------------------------------------------- the resolution

def local_supply(b, ppm, width_m, storey_m, u_m, v_m, d=0.001):
    """px per surface metre at one point on the wall plane, along each axis."""
    p, q = u_m / width_m, v_m / storey_m
    x0, y0 = S.image(b, "wall", np.array([p]), np.array([q]))
    xa, ya = S.image(b, "wall", np.array([p + d / width_m]), np.array([q]))
    xb, yb = S.image(b, "wall", np.array([p]), np.array([q + d / storey_m]))
    return (float(np.hypot(xa - x0, ya - y0)[0] / d),
            float(np.hypot(xb - x0, yb - y0)[0] / d))


# --------------------------------------------------------------- neutrality

#: THE DE-LIGHTING FIELD'S SCALE, IN METRES OF WALL, and it is the number that
#: decides whether this operation removes light or removes joinery.
#:
#: Fitted as a fraction of the PATCH, it is a fraction of whatever the patch
#: happens to be -- and the anchor band is 0.14 m tall, so a quarter of its
#: short side is 35 mm. A "low-frequency field" at 35 mm follows the chair-rail
#: itself, and dividing by it erases the rail: the band whose whole purpose is
#: to carry the anchor the instrument measures scale from would come back
#: without one. Measured on the first run before this was fixed: the anchor band
#: reported 793 % "removed", which was not light leaving, it was the moulding.
#:
#: Fixed in metres it is a fact about walls instead. Light across a room varies
#: over metres; joinery varies over centimetres. 0.80 m sits between them -- a
#: craft number, and the two failure modes either side of it are named above and
#: below: much smaller eats mouldings, much larger stops following the light.
DELIGHT_SIGMA_M = 0.80


def lowfreq(rgb, sigma_px):
    """A low-frequency field, per channel, by box-blur iteration.

    Three passes of a moving average approximate a gaussian closely enough for a
    field this smooth, and it costs no scipy.
    """
    a = rgb.astype(np.float64)
    r = max(2, int(round(sigma_px)))
    r = min(r, max(2, min(a.shape[0], a.shape[1]) // 2 - 1))
    for _ in range(3):
        a = _boxblur(a, r)
    return a


def _boxblur(a, r):
    pad = np.pad(a, ((r, r), (r, r), (0, 0)), mode="edge")
    c = np.cumsum(np.cumsum(pad, axis=0), axis=1)
    c = np.pad(c, ((1, 0), (1, 0), (0, 0)), mode="constant")
    h, w = a.shape[:2]
    y0, y1 = 0, 2 * r + 1
    out = np.empty_like(a)
    for i in range(h):
        out[i] = (c[i + y1, 2 * r + 1:, :] - c[i, 2 * r + 1:, :]
                  - c[i + y1, :w, :] + c[i, :w, :])[:w] / ((2 * r + 1) ** 2)
    return out


def neutrality(rgb, sigma_px):
    """How much light is baked into this patch, and how coloured it is.

    `field_range_pct` is the low-frequency luminance swing as a percentage of
    its own mean — how much brighter one end is than the other. `chroma_drift`
    is the same swing in the channel RATIOS, which is the half a scalar division
    cannot remove and which F5 is about.
    """
    f = lowfreq(rgb, sigma_px)
    lum = f.mean(axis=2)
    m = float(lum.mean())
    rng = float(lum.max() - lum.min())
    denom = np.maximum(lum, 1e-6)[..., None]
    ratios = f / denom
    drift = float(np.max(ratios.reshape(-1, 3).max(axis=0)
                         - ratios.reshape(-1, 3).min(axis=0)))
    return {"field_range_pct": round(100.0 * rng / m, 3) if m else None,
            "chroma_drift": round(drift, 5),
            "mean_luma": round(m, 2)}


def delight(rgb, sigma_px):
    """Per-channel division by the fitted field. Returns (albedo, how much).

    PER CHANNEL, and that is the whole point of F5: dividing by a scalar
    luminance leaves a warm cast exactly where it was, because a cast is a fact
    about the ratios between channels and a scalar cannot touch it.

    RUN ONCE OVER THE WHOLE WALL, never per band. A band is a horizontal slice
    of one lit surface, and the lighting that crosses it is a fact about the
    wall it was cut from -- fitting a field inside a 0.14 m strip finds the
    strip's own contents instead. The caller harvests the full storey, de-lights
    it here, and slices the bands out of the result.
    """
    f = lowfreq(rgb, sigma_px)
    target = f.reshape(-1, 3).mean(axis=0)
    out = np.clip(rgb.astype(np.float64) * (target / np.maximum(f, 1e-6)), 0, 255)
    before = neutrality(rgb, sigma_px)
    after = neutrality(out, sigma_px)
    removed = (before["field_range_pct"] or 0) - (after["field_range_pct"] or 0)
    return out, {"before": before, "after": after,
                 "flattened_pct": round(removed, 3)}


# ------------------------------------------------------------------ harvest

def sample_wall(rgb, b, width_m, storey_m, u0, u1, v0, v1, ppm_tile):
    """A rectified tile of the wall plane, laid out in surface metres."""
    nu = max(2, int(round((u1 - u0) * ppm_tile)))
    nv = max(2, int(round((v1 - v0) * ppm_tile)))
    us = u0 + (np.arange(nu) + 0.5) / ppm_tile
    vs = v0 + (np.arange(nv) + 0.5) / ppm_tile
    U, V = np.meshgrid(us, vs)
    # v is metres ABOVE the floor and the tile is written top row first
    V = V[::-1]
    x, y = S.image(b, "wall", U / width_m, V / storey_m)
    px, _over = S.sample(rgb, x, y)
    return px


def harvest_material(mid, mat, cands, plan, facings, tile_ppm, verbose=True):
    """One material, from the best source its promoted facings offer."""
    rows = []
    for key in cands:
        loc, f = key.split("/")
        meta = read_json(os.path.join(ROOT, "backdrops", loc, f + ".meta.json"))
        b, why = source_box(meta)
        if b is None:
            rows.append({"facing": key, "refused": "no box: %s" % why})
            continue
        ppm = meta["px_per_m_at_wall"]
        storey = ((meta.get("measured_room") or {}).get("storey_height_m")
                  or meta.get("storey_height_m"))
        width_m = (b["x1"] - b["x0"]) / ppm
        spans, hearths = carrier_spans_m(plan, loc, f, width_m)
        wins = free_windows(width_m, spans, hearths)
        if not wins:
            rows.append({"facing": key, "carriers": [s[0] for s in spans],
                         "refused": "no stretch of this wall is clear of a "
                                    "carrier and its firelight"})
            continue
        u0, u1 = max(wins, key=lambda w: w[1] - w[0])
        sa, sl = local_supply(b, ppm, width_m, storey,
                              0.5 * (u0 + u1), ANCHOR_M)
        rgb = load(os.path.join(ROOT, "backdrops", loc, f + ".png"))
        probe_ppm = min(tile_ppm, 160.0)
        probe = sample_wall(rgb, b, width_m, storey, u0, u1,
                            0.0, min(storey, 2.4), probe_ppm)
        n = neutrality(probe, DELIGHT_SIGMA_M * probe_ppm)
        rows.append({"facing": key, "window_u_m": [round(u0, 3), round(u1, 3)],
                     "window_m": round(u1 - u0, 3),
                     "carriers": [s[0] for s in spans],
                     "supply_across": round(sa, 1), "supply_along": round(sl, 1),
                     "supply_ratio": round(tile_ppm / min(sa, sl), 3),
                     "repeats_on_widest_consumer": None,
                     "neutrality": n,
                     "png": "backdrops/%s/%s.png" % (loc, f),
                     "meta": "backdrops/%s/%s.meta.json" % (loc, f),
                     "storey_m": storey, "ppm": ppm, "width_m": round(width_m, 3),
                     "box": b})
    usable = [r for r in rows if "refused" not in r
              and r["supply_ratio"] <= 1.0 / MIN_SUPPLY_RATIO]
    for r in rows:
        if "refused" not in r and r not in usable:
            r["refused"] = ("the source supplies %.0f/%.0f px/m against a %.0f "
                            "px/m lattice — %.2fx short"
                            % (r["supply_across"], r["supply_along"], tile_ppm,
                               r["supply_ratio"]))
    if not usable:
        return None, rows
    usable.sort(key=lambda r: (r["neutrality"]["field_range_pct"] or 1e9,
                               -r["window_m"]))
    return usable[0], rows


def write_tile(path, arr):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    Image.fromarray(np.clip(np.round(arr), 0, 255).astype(np.uint8)).save(path)


def do_harvest(only=None, out_dir=TEXDIR, verbose=True):
    plan = read_json(PLAN)
    doc = read_json(MATERIALS)
    facings = read_json(FACINGS)["facings"]
    prom = promoted_facings(facings)

    by_material = {}
    for key in prom:
        r = facings[key]
        for mid in (r.get("walls"), r.get("field")):
            if mid:
                by_material.setdefault(mid, []).append(key)

    # THE LATTICE IS SIZED TO THIS MATERIAL'S OWN CONSUMERS. The wall map is a
    # similarity, so a facing's wall demand is exactly its own declared scale.
    # Sizing every material to the BUILDING's maximum refuses a harvest for the
    # sake of a wall the material never appears on -- which it did, on the first
    # run: 476 px/m asked of a corpus that supplies 161 at the median.
    demand_of = {}
    for key, r in facings.items():
        d = r.get("declared_ppm")
        if not d:
            continue
        for mid in (r.get("walls"), r.get("field")):
            if mid:
                demand_of[mid] = max(demand_of.get(mid, 0.0), float(d))

    wanted = [(mid, m) for mid, m in doc["materials"].items()
              if m["lane"] == "harvest" and (only is None or mid == only)]
    report, t0 = [], time.time()
    for mid, mat in sorted(wanted):
        cands = by_material.get(mid, [])
        # A VISTA IS NOT AN ASSEMBLY CUSTOMER (36-plan.md §1.10), so a fabric
        # that appears only on `open` facings has nothing to be harvested FOR.
        # Refusing it as a supply failure would be a false negative: the supply
        # is fine, there is simply no consumer.
        consumers = [k for k, r in facings.items()
                     if r.get("facing_type") != "open"
                     and mid in (r.get("walls"), r.get("field"))]
        if not consumers:
            report.append({"material": mid, "out_of_scope": True,
                           "refused": "no ENCLOSED facing uses it -- it appears "
                                      "only on open vistas, which assembly "
                                      "excludes"})
            continue
        demand = demand_of.get(mid) or doc["slot_demand_ppm"][mat["slot"]]
        tile_ppm = demand * LATTICE_OVER_DEMAND
        if not cands:
            report.append({"material": mid, "refused": "no promoted facing shows it"})
            continue
        best, rows = harvest_material(mid, mat, cands, plan, facings, tile_ppm)
        if best is None:
            short = [r.get("refused", "") for r in rows]
            report.append({
                "material": mid, "candidates": rows, "converts_to_swatch": True,
                "demand_ppm": round(demand, 2),
                "refused": "no promoted facing supplies the lattice this "
                           "material's own consumers demand (%.0f px/m): %s"
                           % (demand, "; ".join(short[:2]))})
            continue
        b = best["box"]
        rgb = load(os.path.join(ROOT, best["png"]))
        u0, u1 = best["window_u_m"]
        # ONE PATCH, ONE FIELD, THEN THE BANDS. See `delight`.
        storey_m = best["storey_m"]
        whole = sample_wall(rgb, b, best["width_m"], storey_m,
                            u0, u1, 0.0, storey_m, tile_ppm)
        albedo, light = delight(whole, DELIGHT_SIGMA_M * tile_ppm)
        rows_total = albedo.shape[0]
        tiles = []
        for band, v0, v1 in bands_for(storey_m):
            if v1 - v0 < 0.02:
                continue
            # the tile was written top row first, so v maps from the bottom up
            r0 = int(round((storey_m - v1) / storey_m * rows_total))
            r1 = int(round((storey_m - v0) / storey_m * rows_total))
            r0, r1 = max(0, min(r0, rows_total - 1)), max(1, min(r1, rows_total))
            cut = albedo[r0:r1]
            rel = os.path.join("wall", mid.split("/", 1)[1], "%s.png" % band)
            write_tile(os.path.join(out_dir, rel), cut)
            tiles.append({"band": band, "v_m": [round(v0, 4), round(v1, 4)],
                          "file": os.path.join("backdrops", "textures", rel),
                          "size_px": [cut.shape[1], cut.shape[0]],
                          "rows": [r0, r1]})
        rec = {
            "id": mid, "slot": mat["slot"], "lane": "harvest",
            "ppm": tile_ppm, "ppm_provenance": {
                "lane": "harvest",
                "demand_from": "the largest declared wall scale among the "
                               "facings that use this material",
                "demand_ppm": round(demand, 2),
                "how": "CHOSEN: the lattice is laid out in surface metres, so "
                       "the tile's ppm is an input to the sampling and not a "
                       "reading off it. What is measured is whether the source "
                       "can carry it.",
                "source_facing": best["facing"],
                "source_ppm_at_wall": best["ppm"],
                "supply_across": best["supply_across"],
                "supply_along": best["supply_along"],
                "supply_ratio": best["supply_ratio"]},
            "source_facing": best["facing"],
            "source_png": best["png"], "source_sha256": sha256(os.path.join(ROOT, best["png"])),
            "source_meta_sha256": sha256(os.path.join(ROOT, best["meta"])),
            "window_u_m": best["window_u_m"],
            "carriers_avoided": best["carriers"],
            "why_this_source": (
                "the flattest carrier-free stretch any promoted facing of this "
                "material offers: low-frequency luminance swing %.2f%% of its "
                "own mean over %.2f m of clear wall, against %d candidate "
                "facing(s)"
                % (best["neutrality"]["field_range_pct"], best["window_m"],
                   len(cands))),
            "tiling": mat["tiling"],
            "scale_contract": mat["scale_contract"],
            "bands": tiles,
            "delighting": dict(light, sigma_m=DELIGHT_SIGMA_M,
                               _note="fitted once over the whole storey and "
                                     "divided per channel; the bands are cut "
                                     "out of the result"),
            "candidates_considered": [
                {k: r.get(k) for k in ("facing", "refused", "window_m", "neutrality",
                                       "supply_ratio")} for r in rows],
        }
        with open(os.path.join(out_dir, "wall", mid.split("/", 1)[1], "tile.json"), "w") as fh:
            json.dump(rec, fh, indent=2, default=float)
            fh.write("\n")
        report.append(rec)
        if verbose:
            print("%-38s <- %-22s %5.2f m clear, field %5.2f%%, supply %.2fx"
                  % (mid, best["facing"], best["window_m"],
                     best["neutrality"]["field_range_pct"], best["supply_ratio"]))
    good = [r for r in report if "refused" not in r]
    bad = [r for r in report if "refused" in r]

    # THE NEUTRALITY BAR IS DERIVED FROM WHAT THE CORPUS ACTUALLY YIELDS, per
    # `36-plan.md` §1.7: as neutral as the best quarter of what we already have.
    # It is RECORDED AND FLAGGED HERE, NOT ENFORCED, and that is a deliberate
    # stop. The bar was authored before this distribution existed; applied as a
    # refusal it rejects three quarters of the library in one pass and converts
    # them to model calls, which trades neutrality against generation cost --
    # a cost decision, and cost decisions are the Captain's. The numbers are
    # printed so the ruling has something to be made on.
    resid = sorted((r["delighting"]["after"]["field_range_pct"] or 0.0) for r in good)
    bar = None
    if len(resid) >= 4:
        k = max(0, int(round(0.25 * (len(resid) - 1))))
        bar = resid[k]
    for r in good:
        v = r["delighting"]["after"]["field_range_pct"] or 0.0
        r["neutrality_verdict"] = {
            "residual_field_pct": v, "bar_best_quartile": bar,
            "above_bar": (bar is not None and v > bar),
            "enforced": False,
            "_note": "flagged, not refused: see the note in do_harvest"}
    return {"harvested": good, "refused": bad,
            "converted_to_swatch": [r["material"] for r in bad
                                    if r.get("converts_to_swatch")],
            "out_of_scope": [r["material"] for r in bad if r.get("out_of_scope")],
            "neutrality": {
                "bar_best_quartile": bar,
                "residuals": {"min": resid[0] if resid else None,
                              "median": resid[len(resid) // 2] if resid else None,
                              "max": resid[-1] if resid else None},
                "above_bar": sum(1 for r in good if r["neutrality_verdict"]["above_bar"]),
                "of": len(good)},
            "seconds": round(time.time() - t0, 1)}


# ==================================================================== assembly
#
# THE FIVE PLANES, PAINTED RATHER THAN SAMPLED FROM A PAINTING.
#
# `assign` puts every output pixel on exactly one of the five planes and hands
# back that plane's own two parameters. Turning those into SURFACE METRES is the
# whole of the assembler, and where the metres are measured FROM is the whole of
# the row:
#
#   floor, ceiling   plan (x, y), anchored to the STOREY SLAB. Not to the room:
#                    two rooms on one floor sharing a material share their grain
#                    and their joint phase, so boards run through a doorway
#                    instead of stopping at it.
#   walls            metres along the room's perimeter from its (x0, y0) corner,
#                    walked in one fixed rotational sense. A wall's fabric phase
#                    is then a continuous function of perimeter distance, so
#                    panelling meets correctly at every internal corner.
#
# NOTHING IS INDEXED IN FRAME COORDINATES. That is the cure, stated as a rule a
# reader can check: turn ninety degrees and the same physical patch resolves to
# the same tile coordinate, because the coordinate was never about the frame.

#: Which plan axis each facing looks along, and which way its picture-left runs.
#: North is +y (`plan.north`), so looking N the left hand is -x.
FACING_DIR = {"N": (0.0, 1.0), "S": (0.0, -1.0), "E": (1.0, 0.0), "W": (-1.0, 0.0)}


def wall_line_axis(facing):
    """(along, normal) unit vectors in plan metres for a facing's wall plane."""
    fx, fy = FACING_DIR[facing]
    # picture-left to picture-right is the +90 degree rotation of the view dir
    return (-fy, fx), (fx, fy)


def perimeter_origin_m(room, facing, width_m):
    """Where this wall's u=0 sits, as a distance walked round the room.

    ONE FIXED SENSE, and it is stated rather than emergent: the walk starts at
    the room rect's (x0, y0) corner and goes N, E, S, W. Every wall's phase is
    then a continuous function of how far round the room you have come, so two
    walls meeting at an internal corner meet in phase by construction instead of
    by luck.
    """
    r = room["rect"]
    w = r["x1"] - r["x0"]
    h = r["y1"] - r["y0"]
    order = {"N": 0.0, "E": w, "S": w + h, "W": w + h + w}
    return order[facing]


def surface_metres(idx, p, q, decl, room, facing):
    """Per-pixel surface coordinates, in the frame each surface belongs to.

    Returns (a, b, frame) per region where `frame` says how to read them:
      wall     (perimeter metres, height above floor)
      floor    (plan x, plan y)
      ceiling  (plan x, plan y)
      return   (perimeter metres, height above floor) -- a return IS a wall
    """
    width_m = decl["width_m"]
    storey = decl["storey_m"]
    camera = decl["camera_m"]
    a = np.zeros(p.shape)
    b = np.zeros(p.shape)
    along, normal = wall_line_axis(facing)
    fac = room["facings"][facing]
    sp = fac["standpoint"]
    wl = fac["wall_line"]
    horiz = facing in ("N", "S")
    # the wall plane's own left corner, in plan metres
    rect = room["rect"]
    if horiz:
        lo, hi = rect["x0"], rect["x1"]
    else:
        lo, hi = rect["y0"], rect["y1"]
    # picture-left corner in the plan's own axis
    left = lo if facing in ("N", "E") else hi

    out = {}
    for name in ("wall", "floor", "ceiling", "left", "right"):
        i = S.REGIONS.index(name)
        m = idx == i
        if not np.any(m):
            out[name] = None
            continue
        if name == "wall":
            u = p[m] * width_m
            h = q[m] * storey
            out[name] = ("wall", u + perimeter_origin_m(room, facing, width_m), h, m)
        elif name in ("floor", "ceiling"):
            u = p[m] * width_m                       # across the wall
            d = (1.0 - q[m]) * camera                # metres out from the wall
            # into plan coordinates
            sgn = 1.0 if facing in ("N", "E") else -1.0
            if horiz:
                x = left + sgn * u
                y = wl - normal[1] * d
            else:
                y = left + sgn * u
                x = wl - normal[0] * d
            out[name] = ("plan", x, y, m)
        else:
            d = (1.0 - q[m]) * camera                # metres out from the wall
            h = p[m] * storey
            # a return is the neighbouring wall; its own u runs from ITS corner
            side = ("W" if facing in ("N",) else "E" if facing in ("S",)
                    else "N" if facing in ("E",) else "S")
            if name == "right":
                side = {"N": "E", "S": "W", "E": "S", "W": "N"}[facing]
            nb = room["facings"].get(side)
            if nb is None:
                out[name] = None
                continue
            nb_w = nb["wall_width_m"]
            # distance along the neighbour wall, measured from ITS picture-left
            # corner: the shared corner is at one end and depth runs from it
            u_nb = (nb_w - d) if side in ("N", "E") else d
            out[name] = ("wall", u_nb + perimeter_origin_m(room, side, nb_w), h, m,
                         side)
    return out


# ------------------------------------------------------------- tile sampling

def load_tile(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def tile_lookup(tile, ppm, a_m, b_m, mirror="both"):
    """Sample a tile at surface metres, tiling by reflection or repeat.

    Mirroring is what stops a repeat reading as wallpaper, and reflecting is
    chosen over repeating because a reflected joint still lands on a joint while
    a repeated one lands on a seam.
    """
    h, w = tile.shape[:2]
    x = a_m * ppm
    y = b_m * ppm
    if mirror in ("both", "across"):
        x = _reflect(x, w)
    else:
        x = np.mod(x, w)
    if mirror == "both":
        y = _reflect(y, h)
    else:
        y = np.mod(y, h)
    x0 = np.clip(np.floor(x).astype(np.int32), 0, w - 1)
    y0 = np.clip(np.floor(y).astype(np.int32), 0, h - 1)
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    return ((tile[y0, x0] * (1 - fx) + tile[y0, x1] * fx) * (1 - fy) +
            (tile[y1, x0] * (1 - fx) + tile[y1, x1] * fx) * fy)


def _reflect(v, n):
    """Mirror-tile a coordinate into [0, n): a triangle wave of period 2n."""
    if n <= 1:
        return np.zeros_like(v)
    t = np.mod(v, 2 * n)
    return np.where(t < n, t, 2 * n - 1e-6 - t)


# =============================================================== the door void
#
# THE ASSEMBLER PAINTS THE WAY THROUGH, because a plain wall has none and row
# 27's promotion clause refuses a wall whose plan rules a doorway and whose
# painting shows nothing. It is arithmetic, not generation: the plan already
# says where the opening is and how tall it is, and the wall region's own map
# says where that lands in the frame.
#
# AND THE SAME ARITHMETIC REPAIRS A PAINTED WALL. Five snapped walls re-measure
# geometrically clean and are still refused on the door clause after repeated
# re-asks under the unlit-void rule -- the generator will not reliably paint a
# measurable dark void. Nothing about that is a fact this row can prompt its way
# around, and nothing about the void needs a model: it is a rectangle the plan
# already rules. `--paint-doors` composites it onto an existing candidate, so
# the detector reads by construction what the painter kept failing to draw.
#
# WHAT `door_measure` ACTUALLY NEEDS, since the void is built to be read:
#   * a column-median luminance over the door's body rows that sits clearly
#     below its neighbours -- the statistic is a MEDIAN, so a few bright pixels
#     inside the opening do not lift it, but a textured fill would;
#   * survival across at least MIN_STABILITY successive luminance cuts, which is
#     what makes the run "maximally stable" rather than a threshold artefact;
#   * so the void must be UNIFORM and it must clear the wall around it by more
#     than the sweep's own step. Hence the contract below.

#: THE CONTRAST FLOOR. `door_measure._stable_dark_runs` sweeps luminance cuts
#: and needs at least MIN_STABILITY of them to survive; a void within 3 luma of
#: its wall cannot produce three distinct surviving cuts however dark the frame
#: is overall. This is the fifth item of the lighting stub's output contract and
#: it is the same number here, because it is the same detector being fed.
VOID_MIN_SEPARATION = 3.0

#: How dark the void is drawn, as a fraction of the wall's own median. An unlit
#: opening is not black -- a black rectangle reads as a hole punched in a
#: picture -- but it must be far enough down that the sweep has room. 0.18 puts
#: it well below any painted shadow in this corpus while still carrying a little
#: of the room's own tone.
VOID_LUMA_FRACTION = 0.18

#: The feather, in metres of wall, over which the void's edge softens. A reveal
#: has a thickness and an opening has a jamb; a one-pixel step reads as paste.
#: Kept small enough that `_stable_dark_runs` still finds a hard edge to fix on.
VOID_FEATHER_M = 0.02

#: How near a read-back door must sit to a ruled one to count as the same
#: doorway. Half a leaf: near enough that no two of the plan's own openings can
#: both claim one reading, wide enough that the detector's own edge slop -- 15
#: to 24 px on the walls repaired here -- never splits a match.
DOOR_MATCH_M = 0.50

#: THE LINTEL, AND WHY A VOID WITHOUT ONE IS UNREADABLE.
#:
#: `door_measure._head` finds the head by walking UP the void's own columns
#: while they stay under the darkness cut, then takes the strongest horizontal
#: step near where that stops. On a wall whose upper reaches are themselves dark
#: -- which `great_hall/N` is -- the walk never stops at the opening: it runs
#: past the storey, `head_m` exceeds it, and the candidate is thrown away AFTER
#: being found. Measured: 2 stable runs found, 2 rejected on the head test, 0
#: doors reported, on a frame whose void was painted 17.5 luma clear of its wall.
#:
#: So the void is bounded above by a lintel, which is also just true: every
#: doorway of this date has a head over it, and the detector's own docstring
#: says the void "ends where the frame's soffit begins". Painting the opening
#: without one was drawing half a doorway.
LINTEL_M = 0.14

#: How much brighter than the wall's median the lintel reads. It only has to
#: clear the darkness cut convincingly -- a soffit catches light from the room
#: it faces, so a little brighter than the wall is honest as well as legible.
LINTEL_GAIN = 1.15


def door_rects_m(plan, loc, facing, width_m):
    """Every way-through on this wall, as (u0, u1) metres from picture-left."""
    spans, _ = carrier_spans_m(plan, loc, facing, width_m)
    return [(a, b) for kind, a, b in spans if kind == "door"]


def paint_voids(rgb, b, width_m, storey_m, doors, head_m=2.00,
                feather_m=VOID_FEATHER_M):
    """Composite unlit openings onto a frame. Returns (out, record).

    The rectangle is defined on the WALL PLANE in metres and mapped through the
    wall region's own matrix, so it lands exactly where the plan rules and
    exactly where the aperture's click target is computed -- the two are the
    same rectangle, which is the whole of row 27's question answered by
    construction rather than by tolerance.
    """
    out = rgb.astype(np.float64).copy()
    L = out.mean(axis=2)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    wall = idx == S.REGIONS.index("wall")
    if not np.any(wall):
        return rgb, {"painted": [], "refused": "this box places no wall in frame"}
    wall_median = float(np.median(L[wall]))
    target = wall_median * VOID_LUMA_FRACTION
    if wall_median - target < VOID_MIN_SEPARATION:
        target = wall_median - VOID_MIN_SEPARATION
    if target < 0:
        return rgb, {"painted": [], "refused":
                     "the wall's own median is %.1f luma, so no void can sit "
                     "%.0f luma below it and stay in range"
                     % (wall_median, VOID_MIN_SEPARATION)}

    u = p * width_m
    h = q * storey_m
    painted = []
    lintel_luma = min(255.0, wall_median * LINTEL_GAIN)
    for (u0, u1) in doors:
        if u1 - u0 <= 0:
            continue
        # THE LINTEL FIRST, so the void is drawn over its lower edge and the
        # step between them is the void's own boundary rather than a seam
        # between two things painted in the wrong order.
        lin = (wall & (u >= u0 - feather_m) & (u <= u1 + feather_m)
               & (h >= head_m) & (h <= head_m + LINTEL_M))
        if np.any(lin):
            out[lin] = lintel_luma
        # a smooth-step mask in SURFACE metres, so the feather is a physical
        # width and not a pixel count that changes with the camera
        du = np.minimum(u - u0, u1 - u) / max(feather_m, 1e-6)
        dh = (head_m - h) / max(feather_m, 1e-6)
        t = np.clip(np.minimum(np.minimum(du, dh), h / max(feather_m, 1e-6)), 0.0, 1.0)
        m = wall & (t > 0)
        if not np.any(m):
            continue
        a = (t * t * (3 - 2 * t))[m][..., None]        # smoothstep
        tint = np.array([1.0, 1.0, 1.02])              # a shade cool, not black
        out[m] = out[m] * (1 - a) + (target * tint) * a
        painted.append({"u0_m": round(float(u0), 3), "u1_m": round(float(u1), 3),
                        "width_m": round(float(u1 - u0), 3),
                        "head_m": head_m, "pixels": int(m.sum()),
                        "lintel_px": int(lin.sum()) if np.any(lin) else 0})
    rec = {"painted": painted, "wall_median_luma": round(wall_median, 2),
           "void_luma": round(target, 2),
           "separation_luma": round(wall_median - target, 2),
           "min_separation_required": VOID_MIN_SEPARATION,
           "feather_m": feather_m,
           "lintel": {"m": LINTEL_M, "luma": round(lintel_luma, 2),
                      "why": "door_measure._head walks up the void's columns "
                             "until they stop being dark; without a lintel it "
                             "walks past the storey and the candidate is "
                             "rejected after being found"}}
    return np.clip(out, 0, 255), rec


def repair_doors(key, candidate, out_png, plan, facings):
    """`--paint-doors`: composite the plan's voids onto an existing candidate."""
    r = facings.get(key)
    if not r or not r.get("declared"):
        return None, "no declared geometry for " + key
    d = r["declared"]
    imh = d["image_h_px"] or H
    ppm = d["ppm"]
    # An OPEN facing's declared meta carries no storey -- there is no building
    # wall there -- so the plan's own ruled storey stands in, exactly as
    # `door_measure.ruled_storey` does for the same reason.
    storey = d["storey_height_m"]
    if not storey:
        import door_measure as _dm
        storey = _dm.ruled_storey(plan, key.split("/")[0])
    if not storey:
        return None, "no storey height, ruled or declared, for " + key
    yf = d["floor_line_y"] * imh
    vy = d["horizon_y"] * imh
    yc = yf - storey * ppm
    x0, x1 = d["corner_x0_px"], d["corner_x1_px"]
    if x0 is None or x1 is None:
        half = (d["wall_width_m"] or 6.0) * ppm / 2.0
        x0, x1 = W / 2.0 - half, W / 2.0 + half
    b = S.box(x0, x1, yc, yf, W / 2.0, vy)
    bad = S.box_refusal(b)
    if bad:
        return None, "the declared box is not a box: " + bad
    width_m = (x1 - x0) / ppm
    loc, f = key.split("/")
    doors = door_rects_m(plan, loc, f, width_m)
    if not doors:
        return None, "the plan rules no way through this wall"
    src = os.path.join(ROOT, candidate)
    if not os.path.exists(src):
        return None, "no candidate at " + candidate
    rgb = load(src)

    # ONLY PAINT WHAT THE DETECTOR CANNOT ALREADY READ. A repair that redraws a
    # doorway the painting already shows is not a repair, it is a second
    # doorway: on `long_gallery/W` -- which reads both its ways through
    # correctly -- painting all of them regardless took the count from 2 to 4
    # and would have swapped one refusal for another. The tool is minimal-touch
    # by construction, and a wall it has nothing to add to is left alone.
    import door_measure as _dm
    before, _note = _dm.measure_openings(src, x0, x1, yf, ppm, storey)
    already = []
    for g in before:
        already.append(0.5 * ((g["x0_px"] + g["x1_px"]) / 2.0 - x0) / ppm * 2.0)
    missing, matched = [], []
    for (u0, u1) in doors:
        c = 0.5 * (u0 + u1)
        hit = next((a for a in already if abs(a - c) <= DOOR_MATCH_M), None)
        if hit is None:
            missing.append((u0, u1))
        else:
            matched.append({"u0_m": round(u0, 3), "u1_m": round(u1, 3),
                            "already_read_at_m": round(hit, 3)})
    if not missing:
        return None, ("the detector already reads all %d way(s) through this "
                      "wall -- there is nothing for the void painter to add"
                      % len(doors))

    # AND A VOID IS NOT PAINTED INTO DARKNESS THE PAINTING ALREADY CARRIES.
    #
    # The match above is by CENTRE, which is the right question for "is this
    # doorway already drawn" and the wrong one for "is it safe to draw". A dark
    # run can miss the ruled centre by more than DOOR_MATCH_M and still OVERLAP
    # the rectangle about to be painted, and then the two are one run to a
    # detector that reads maximally stable dark runs: `privy_garden/W`'s snapped
    # frame carries a 1.55 m run at 2.00-3.55 m against a door the plan rules at
    # 1.55-2.55 m, and painting the void merged them into a single 1.99 m
    # reading whose right edge lands 67 px past the aperture. Nothing downstream
    # was fooled -- row 27's `door.painted_width` refuses 1.99x at the promotion
    # -- but the repair had written a PNG claiming a doorway it had not made
    # readable, and a tool that reports success on a frame it has broken is the
    # silent half of this row's own contract.
    #
    # Adding darkness cannot separate darkness, so there is no repair here to
    # make: the wall stays held and says why.
    clashes = []
    for (u0, u1) in missing:
        wx0, wx1 = x0 + u0 * ppm, x0 + u1 * ppm
        for g in before:
            lo, hi = max(wx0, g["x0_px"]), min(wx1, g["x1_px"])
            if hi > lo:
                clashes.append("the void ruled at %.2f-%.2f m (%.0f-%.0f px) "
                               "shares %.0f px with a dark run the painting "
                               "already carries at %.0f-%.0f px"
                               % (u0, u1, wx0, wx1, hi - lo,
                                  g["x0_px"], g["x1_px"]))
    if clashes:
        return None, ("this candidate is already dark where the void goes, so "
                      "painting it makes one run and not a doorway: %s -- "
                      "adding darkness cannot separate darkness, and the wall "
                      "is repainted rather than repaired"
                      % "; ".join(clashes))

    out, rec = paint_voids(rgb, b, width_m, storey, missing)
    if rec.get("refused"):
        return None, rec["refused"]
    write_tile(out_png, out)
    # THE RECORD NAMES THE FILE, NOT THE MACHINE. `out` held whatever absolute
    # path the caller passed, so the committed record for each repaired wall
    # carried the checkout it happened to be generated in -- and every run from
    # a different worktree rewrote four committed JSON files whose pixels had
    # not moved at all. Under the repository it is written repo-relative; a
    # scratch directory outside it keeps its own name, since nothing there is
    # committed.
    where = out_png
    try:
        rel = os.path.relpath(os.path.abspath(out_png), ROOT)
        if not rel.startswith(os.pardir):
            where = rel
    except ValueError:
        pass
    rec.update(facing=key, candidate=candidate, out=where,
               declared_box=b, width_m=round(width_m, 3),
               doors_ruled=len(doors), doors_read_before=len(before),
               left_alone=matched, painted_because_missing=len(missing))
    return rec, None


# ============================================================ placeholder art
#
# V1 IS CORRECT GEOMETRY ON PLACEHOLDER ART (playbook §5.3), and this is the
# placeholder art. The floor and ceiling swatches are dispatched and have not
# come back; without them the assembler could not be exercised at all, and a
# geometry engine nobody has run is a geometry engine nobody has checked.
#
# These are DRAWN FROM THE MATERIAL'S OWN TILING SPEC -- the same `pitch_m` and
# `grain_axis` the real swatch is asked for -- so every claim about grain
# direction, joint phase, tiling and cross-facing agreement is exercised
# truthfully. What they are not is a picture of a material. They are marked
# `placeholder: true` in their own record, they live under a directory that says
# so, and `assemble_facing` stamps the flag onto every frame that used one.
#
# THE ONE THING THEY MUST NOT DO is get promoted. A placeholder that reached the
# store would be a lie in the shape of a texture, so the flag travels with the
# frame and the promotion path refuses on it.

def placeholder_tile(mat, ppm, span_m=None):
    """A deterministic tile drawn from the material's own tiling spec."""
    t = mat["tiling"]
    span = span_m or (mat.get("scale_contract") or {}).get("span_m") or 3.0
    n = max(64, int(round(span * ppm)))
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float64) / ppm      # metres
    base = {"walls": 150.0, "ceiling": 120.0, "floor": 105.0}[mat["slot"]]
    L = np.full((n, n), base)
    seed = int(hashlib.sha256(mat["id"].encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    L += rng.normal(0.0, 3.0, L.shape)                        # a little tooth
    kind = t.get("scale_kind")
    if kind == "periodic":
        pitch = t.get("pitch_m") or 0.25
        # the joint runs ACROSS the grain, which is what pitch measures
        a = xs if t.get("grain_axis") in ("v", "room_short") else ys
        phase = np.abs(np.mod(a / pitch, 1.0) - 0.5)
        L -= 26.0 * (phase > 0.46)                            # the joint itself
        L += 6.0 * np.cos(2 * np.pi * a / pitch)              # board-to-board tone
    elif kind == "stochastic":
        c = t.get("characteristic_m") or 0.05
        f = max(1.0, 1.0 / max(c, 1e-3))
        L += 9.0 * np.sin(2 * np.pi * xs * f / 7.0) * np.cos(2 * np.pi * ys * f / 5.0)
    tint = {"walls": (1.00, 0.94, 0.82), "ceiling": (1.00, 0.99, 0.95),
            "floor": (1.00, 0.90, 0.76)}[mat["slot"]]
    return np.clip(np.stack([L * tint[0], L * tint[1], L * tint[2]], axis=-1), 0, 255)


def ensure_placeholders(doc, out_dir=TEXDIR, verbose=True):
    """One placeholder per material with no real tile on disk yet."""
    made = []
    for mid, mat in doc["materials"].items():
        slot = mat["slot"]
        d = os.path.join(out_dir, slot.replace("walls", "wall"),
                         mid.split("/", 1)[1])
        real = os.path.join(d, "tile.json")
        if os.path.exists(real):
            continue
        ppm = (mat.get("scale_contract") or {}).get("ppm") or 300.0
        px = placeholder_tile(mat, ppm)
        os.makedirs(d, exist_ok=True)
        write_tile(os.path.join(d, "placeholder.png"), px)
        with open(os.path.join(d, "tile.json"), "w") as fh:
            json.dump({"id": mid, "slot": slot, "lane": "placeholder",
                       "placeholder": True,
                       "_what_this_is":
                           "V1 placeholder art drawn from this material's own "
                           "tiling spec so the geometry can be exercised before "
                           "its swatch returns. NOT PROMOTABLE.",
                       "ppm": ppm, "ppm_provenance": {"lane": "placeholder"},
                       "tiling": mat["tiling"],
                       "scale_contract": mat.get("scale_contract"),
                       "bands": [{"band": "all", "v_m": None,
                                  "file": os.path.relpath(
                                      os.path.join(d, "placeholder.png"), ROOT),
                                  "size_px": [px.shape[1], px.shape[0]]}]},
                      fh, indent=2, default=float)
            fh.write("\n")
        made.append(mid)
    if verbose and made:
        print("placeholders drawn for %d material(s) whose swatch has not "
              "returned" % len(made))
    return made


# ================================================================== assemble

def tile_dir(mid):
    slot = mid.split("/", 1)[0]
    return os.path.join(TEXDIR, "wall" if slot == "wall" else slot,
                        mid.split("/", 1)[1])


def load_material(mid):
    p = os.path.join(tile_dir(mid), "tile.json")
    if not os.path.exists(p):
        return None
    rec = read_json(p)
    rec["_bands"] = {}
    for b in rec["bands"]:
        f = os.path.join(ROOT, b["file"])
        if os.path.exists(f):
            rec["_bands"][b["band"]] = (load_tile(f), b.get("v_m"))
    return rec if rec["_bands"] else None


def wall_pixels(rec, a_m, h_m):
    """Sample a banded wall fabric at (perimeter metres, height above floor)."""
    ppm = rec["ppm"]
    mirror = rec["tiling"].get("mirror", "across")
    out = np.zeros(a_m.shape + (3,))
    if "all" in rec["_bands"]:
        tile, _ = rec["_bands"]["all"]
        return tile_lookup(tile, ppm, a_m, h_m, mirror)
    for band, (tile, v) in rec["_bands"].items():
        if not v:
            continue
        lo, hi = v
        m = (h_m >= lo) & (h_m < hi if band != "field" else True)
        if not np.any(m):
            continue
        # vertical position is FIXED IN METRES: the band is sampled from its own
        # bottom, never tiled up the wall, which is what keeps the anchor at
        # exactly 0.95 m on every wall assembled from this fabric
        out[m] = tile_lookup(tile, ppm, a_m[m], (h_m[m] - lo), mirror)
    return out


def plan_pixels(rec, x_m, y_m, room, grain_axis):
    """Sample a floor or ceiling at PLAN metres, anchored to the storey slab.

    The slab and not the room: two rooms on one floor sharing a material share
    their grain and their joint phase, so boards run through a doorway instead
    of stopping at it. The plan's own coordinates already are the slab's, so
    the anchoring is achieved by NOT introducing a room-local origin here.
    """
    ppm = rec["ppm"]
    mirror = rec["tiling"].get("mirror", "both")
    a, b = (x_m, y_m)
    if grain_axis == "room_short":
        a, b = (y_m, x_m)
    return tile_lookup(rec["_bands"].get("all", list(rec["_bands"].values())[0])[0],
                       ppm, a, b, mirror)


def assemble_facing(key, plan, facings, doc, out_png, paint_doors=True):
    """One facing, composed from the library at the geometry the plan rules."""
    r = facings.get(key)
    if not r:
        return None, "no facing " + key
    if r.get("facing_type") == "open":
        return None, ("%s is an open facing: it has no wall plane, no ceiling "
                      "and no side walls, so there are no five planes to "
                      "assemble. A vista is the far-line ruler's" % key)
    d = r.get("declared")
    if not d:
        return None, "no declared geometry for " + key
    loc, f = key.split("/")
    room = next((x for x in plan["rooms"] if x["id"] == loc), None)
    ppm, imh = d["ppm"], d["image_h_px"] or H
    storey = d["storey_height_m"]
    yf = d["floor_line_y"] * imh
    vy = d["horizon_y"] * imh
    yc = yf - storey * ppm
    x0, x1 = d["corner_x0_px"], d["corner_x1_px"]
    if x0 is None or x1 is None:
        half = (d["wall_width_m"] or 6.0) * ppm / 2.0
        x0, x1 = W / 2.0 - half, W / 2.0 + half
    b = S.box(x0, x1, yc, yf, W / 2.0, vy)
    bad = S.box_refusal(b)
    if bad:
        return None, "the declared box is not a box: " + bad
    decl = {"width_m": (x1 - x0) / ppm, "storey_m": storey,
            "camera_m": d["camera_wall_m"]}
    if not decl["camera_m"]:
        return None, key + " names no camera distance"

    mats = {}
    for slot, mid in (("walls", r["walls"]), ("ceiling", r["ceiling"]),
                      ("floor", r["floor"]), ("field", r.get("field"))):
        if not mid:
            continue
        m = load_material(mid)
        if m is None:
            return None, "no tile on disk for %s (%s)" % (mid, slot)
        mats[slot] = m

    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    if int((idx < 0).sum()):
        return None, "%d output pixels lie on none of the five planes" % int((idx < 0).sum())
    surf = surface_metres(idx, p, q, decl, room, f)

    out = np.zeros((H, W, 3))
    used = []
    for name in ("wall", "floor", "ceiling", "left", "right"):
        got = surf.get(name)
        if not got:
            continue
        frame, a_m, b_m, m = got[0], got[1], got[2], got[3]
        if frame == "wall":
            rec = mats["walls"]
            out[m] = wall_pixels(rec, a_m, b_m)
            if "field" in mats:
                hi = mats["field"]
                fm = b_m >= ANCHOR_M + ANCHOR_BAND_M / 2.0
                if np.any(fm):
                    sub = np.zeros(a_m.shape + (3,))
                    sub[fm] = wall_pixels(hi, a_m[fm], b_m[fm] - ANCHOR_M)
                    o = out[m]
                    o[fm] = sub[fm]
                    out[m] = o
            used.append((name, rec["id"]))
        else:
            slot = "floor" if name == "floor" else "ceiling"
            rec = mats[slot]
            out[m] = plan_pixels(rec, a_m, b_m, room,
                                 rec["tiling"].get("grain_axis"))
            used.append((name, rec["id"]))

    doors_rec = None
    if paint_doors:
        doors = door_rects_m(plan, loc, f, decl["width_m"])
        if doors:
            out, doors_rec = paint_voids(out, b, decl["width_m"], storey, doors)

    placeholder = any(m.get("placeholder") for m in mats.values())
    write_tile(out_png, out)
    return {
        "facing": key, "out": out_png, "box": b,
        "declared": d, "width_m": round(decl["width_m"], 3),
        "materials": {k: v["id"] for k, v in mats.items()},
        "lanes": {k: v.get("lane") for k, v in mats.items()},
        "placeholder_art": placeholder,
        "regions": {n: int((idx == i).sum()) for i, n in enumerate(S.REGIONS)},
        "doors": doors_rec,
        "_promotable": not placeholder,
    }, None


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--harvest", default="", help="one material id")
    ap.add_argument("--harvest-all", action="store_true")
    ap.add_argument("--out", default=TEXDIR)
    ap.add_argument("--paint-doors", default="",
                    help="<loc>/<F>: composite the plan's ways through onto a "
                         "candidate that the door detector cannot read")
    ap.add_argument("--candidate", default="")
    ap.add_argument("--out-png", default="")
    ap.add_argument("--assemble", default="", help="<loc>/<F>")
    ap.add_argument("--placeholders", action="store_true",
                    help="draw V1 placeholder tiles for materials whose swatch "
                         "has not returned")
    ap.add_argument("--json", default="")
    args = ap.parse_args()
    if args.placeholders:
        made = ensure_placeholders(read_json(MATERIALS))
        print("placeholders: %d" % len(made))
        return 0
    if args.assemble:
        plan = read_json(PLAN)
        facings = read_json(FACINGS)["facings"]
        doc = read_json(MATERIALS)
        out = args.out_png or os.path.join(
            ROOT, "backdrops", "source-assembled",
            args.assemble.replace("/", "-"), "albedo.png")
        rec, why = assemble_facing(args.assemble, plan, facings, doc, out)
        if rec is None:
            print("refused: %s" % why)
            return 1
        print("%s assembled -> %s" % (args.assemble, os.path.relpath(out, ROOT)))
        print("  materials: %s" % ", ".join(
            "%s=%s" % (k, v) for k, v in rec["materials"].items()))
        print("  regions:   %s" % rec["regions"])
        if rec["placeholder_art"]:
            print("  V1: PLACEHOLDER ART -- not promotable")
        if rec.get("doors"):
            print("  doors:     %d void(s), %.1f luma clear"
                  % (len(rec["doors"]["painted"]), rec["doors"]["separation_luma"]))
        if args.json:
            with open(args.json, "w") as fh:
                json.dump(rec, fh, indent=2, default=float)
                fh.write("\n")
        return 0
    if args.paint_doors:
        plan = read_json(PLAN)
        facings = read_json(FACINGS)["facings"]
        out = args.out_png or os.path.join(
            ROOT, "backdrops", "source-doors",
            args.paint_doors.replace("/", "-"), "repaired.png")
        rec, why = repair_doors(args.paint_doors, args.candidate, out, plan, facings)
        if rec is None:
            print("refused: %s" % why)
            return 1
        print("%s: %d void(s) painted, wall median %.1f -> void %.1f "
              "(%.1f luma clear, needs %.0f)"
              % (args.paint_doors, len(rec["painted"]), rec["wall_median_luma"],
                 rec["void_luma"], rec["separation_luma"],
                 rec["min_separation_required"]))
        print("  -> %s" % os.path.relpath(out, ROOT))
        if args.json:
            with open(args.json, "w") as fh:
                json.dump(rec, fh, indent=2, default=float)
                fh.write("\n")
        return 0
    if not (args.harvest or args.harvest_all):
        ap.error("nothing to do: pass --harvest-all, --harvest <id>, "
                 "--assemble <loc>/<F>, --placeholders or "
                 "--paint-doors <loc>/<F>")
    r = do_harvest(args.harvest or None, out_dir=args.out)
    print("\nharvested %d, refused %d, %.1fs"
          % (len(r["harvested"]), len(r["refused"]), r["seconds"]))
    for x in r["refused"]:
        print("  %-9s %-36s %s"
              % ("SWATCH" if x.get("converts_to_swatch") else "OUT-OF-SCOPE",
                 x["material"], x["refused"][:96]))
    n = r["neutrality"]
    if n["bar_best_quartile"] is not None:
        print("neutrality residual after de-lighting: min %.1f%%  median %.1f%%  "
              "max %.1f%%" % (n["residuals"]["min"], n["residuals"]["median"],
                              n["residuals"]["max"]))
        print("best-quartile bar %.1f%% -- %d of %d sit above it, FLAGGED not "
              "refused (the ruling is the Captain's)"
              % (n["bar_best_quartile"], n["above_bar"], n["of"]))
    conv = os.path.join(TEXDIR, "harvest-conversions.json")
    os.makedirs(TEXDIR, exist_ok=True)
    with open(conv, "w") as fh:
        json.dump({
            "_what_this_is":
                "Materials the harvest could not serve, and why. The swatch "
                "emitter reads this and asks for them flat instead -- which is "
                "the conversion path `36-plan.md` §8 costs, so the arithmetic "
                "moves with the evidence rather than assuming zero.",
            "converted_to_swatch": [
                {"material": x["material"], "reason": x["refused"],
                 "demand_ppm": x.get("demand_ppm")}
                for x in r["refused"] if x.get("converts_to_swatch")],
            "out_of_scope": [
                {"material": x["material"], "reason": x["refused"]}
                for x in r["refused"] if x.get("out_of_scope")]
        }, fh, indent=2, default=float)
        fh.write("\n")
    print("conversions -> %s" % os.path.relpath(conv, ROOT))
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(r, fh, indent=2, default=float)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
