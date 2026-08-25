#!/usr/bin/env python3
"""Row 36 — the MINIMAL LIGHTING STUB. Bake-time, and row 37 replaces it.

    python3 design/plan-draft/measured/row36_light.py --facing kitchen/N

[HUMAN, 2026-08-24, row 37, verbatim] "all panels meed to have no light source
and there should be a light lighting shader over the top regarding light
sources."

WHY ROW 36 HAS A LIGHTING STUB AT ALL. Assembly produces NEUTRAL albedo, and the
standing instrument cannot measure a neutral frame: `pick_floor` finds the floor
line by taking a luminance MINIMUM at the wall's foot, which on a flat frame is
noise. So an assembled wall could be perfectly built and unmeasurable, and no
amount of care in the assembler fixes that. The stub is the smallest thing that
makes an assembly READABLE, and what promotes is its output. Row 37 replaces it
with the runtime pass and inherits the contract below unchanged.

NEVER `src/`. This is a bake-time tool exactly like the snap. Nothing here runs
in the page, and the row's fence survives.

THE OUTPUT CONTRACT — five items, and every one is set by what the promotion
path already needs rather than by taste:

  1. CONTACT DARKENING at every plane junction, because `pick_floor` reads a
     luminance minimum at the wall's foot. This is also intention quality #2,
     so the fix and the quality are the same act.
  2. A RESOLVABLE STEP at the wall/ceiling junction, so `pick_ceiling` and
     `ceiling_ramp_vp` have an edge to fit.
  3. A DOMINANT DIRECTION, so `key_dir` means something rather than being an
     artefact of a flat field.
  4. A STABLE `key_tint` over the tint patch.
  5. A CONTRAST FLOOR of at least 3 luma between a door void and the wall's
     median, because `door_measure`'s stability sweep needs three surviving
     cuts. A wall rendered at luma <= 2 kills every door on it AND THE REFUSAL
     MESSAGE NAMES NOTHING ABOUT DARKNESS, so the failure reads as a geometry
     problem. This is the one item that is a floor rather than a feature, and it
     is why the stub has a minimum brightness at all.

WHAT IT IS NOT. It is not row 37: no light graph, no spill through apertures, no
state, no flicker, no per-source colour temperature worth the name. It is an
ambient plus a per-source radial falloff, deterministic and seeded, and it says
so rather than pretending.
"""
import argparse
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row35_snap as S                                           # noqa: E402
import row36_assemble as A                                       # noqa: E402
from measure_lib import load                                     # noqa: E402

W, H = S.W, S.H

#: The ambient floor, as a multiplier on albedo. Item 5's contrast floor is what
#: sets it: a wall must stay bright enough that a void can sit 3 luma under it
#: and still be in range, and on this corpus's albedo that is comfortably met at
#: 0.55 while still reading as an interior rather than a showroom.
AMBIENT = 0.55

#: How much a source adds at its own position, and how fast it falls away. The
#: radius is `row36_assemble.FIRELIGHT_R_M`, one number for the rule that
#: excludes a firelit harvest and the falloff that puts the light back -- so
#: moving it moves both, which is the point of naming it once.
SOURCE_GAIN = {"hearth": 0.85, "window": 0.70, "opening": 0.25}
SOURCE_TINT = {"hearth": (1.14, 0.94, 0.72),      # firelight, warm
               "window": (0.92, 0.97, 1.12),      # daylight, cool
               "opening": (1.00, 1.00, 1.00)}

#: Contact darkening: how deep, and over how many metres it fades. A contact
#: shadow is a fact about a junction, so it is measured in metres of surface and
#: not in pixels -- the same discipline the void's feather follows.
CONTACT_DEPTH = 0.42
CONTACT_M = 0.35

#: The ceiling junction's own step (contract item 2), as a multiplier and a
#: depth in metres below the junction.
CEILING_STEP = 0.80
CEILING_STEP_M = 0.12

#: The dominant direction (item 3). A WORLD direction, and it has to be.
#:
#: This was `(1 - x/W)` -- a ramp across the FRAME -- and the demo batch's first
#: corner strip convicted it immediately: the right edge of one facing came out
#: dark and the left edge of the next came out bright, so the same physical wall
#: changed brightness when the camera turned. That is precisely the disease this
#: row exists to cure ("I have one room as you turn ceiling floor and wall
#: change"), reintroduced by the lighting rather than by the geometry.
#:
#: So the key is a compass direction in PLAN metres, exactly like every surface
#: coordinate the assembler uses, and a wall lit from the west is lit from the
#: west whichever way you are facing when you look at it.
KEY_RAMP = 0.18
KEY_DIR_PLAN = (-0.80, 0.60)      # from the west and a little north


def sources_for(plan, loc):
    """Every light source in this ROOM, at its PLAN position.

    IN PLAN METRES, NOT WALL-LOCAL ONES, and for the same reason the key is a
    compass direction. A hearth addressed as "3.0 m along this wall" is a
    different point depending on which wall you are looking at, so a room lit
    that way relights itself every time the camera turns -- the turn disease
    surviving in the falloff after it had been chased out of the ramp. A hearth
    is at a place in the building; the light it throws is a fact about that
    place and about nothing else.

    This is also the shape row 37 needs: its emitters are ENTITIES with plan
    positions and document state, and a source list keyed on plan coordinates
    is the same list with `lit: true` still to be added.
    """
    room = next((r for r in plan["rooms"] if r["id"] == loc), None)
    if room is None:
        return []
    rect = room["rect"]
    out = []
    src = ([("hearth", fp["rect"], fp.get("room")) for fp in plan["fireplaces"]] +
           [("window", w["rect"], None) for w in plan["windows"]] +
           [("opening", o["rect"], None) for o in plan["openings"]])
    for kind, cr, owner in src:
        if kind == "hearth" and owner and owner != loc:
            continue
        cx = 0.5 * (cr["x0"] + cr["x1"])
        cy = 0.5 * (cr["y0"] + cr["y1"])
        # in this room, or on one of its walls
        if not (rect["x0"] - 0.4 <= cx <= rect["x1"] + 0.4
                and rect["y0"] - 0.4 <= cy <= rect["y1"] + 0.4):
            continue
        out.append({"kind": kind, "x_m": round(cx, 3), "y_m": round(cy, 3),
                    "z_m": 1.1 if kind != "hearth" else 0.8})
    return out


def plan_positions(idx, p, q, decl, room, facing):
    """Every pixel's PLAN position, so the key can be a compass direction.

    Reuses the assembler's own surface mapping rather than repeating it: floors
    and ceilings already come back in plan metres, and a wall's perimeter metre
    converts to a plan point through the room's own rect.
    """
    surf = A.surface_metres(idx, p, q, decl, room, facing)
    X = np.zeros(idx.shape)
    Y = np.zeros(idx.shape)
    rect = room["rect"]
    for name in ("wall", "floor", "ceiling", "left", "right"):
        got = surf.get(name)
        if not got:
            continue
        frame, a_m, b_m, m = got[0], got[1], got[2], got[3]
        if frame == "plan":
            X[m], Y[m] = a_m, b_m
        else:
            # perimeter metres back to a plan point: walk N, E, S, W from
            # (x0, y0), the same walk `perimeter_origin_m` lays out
            w = rect["x1"] - rect["x0"]
            h = rect["y1"] - rect["y0"]
            u = np.mod(a_m, 2 * (w + h))
            x = np.where(u < w, rect["x0"] + u,
                np.where(u < w + h, rect["x1"],
                np.where(u < 2 * w + h, rect["x1"] - (u - w - h), rect["x0"])))
            y = np.where(u < w, rect["y1"],
                np.where(u < w + h, rect["y1"] - (u - w),
                np.where(u < 2 * w + h, rect["y0"], rect["y0"] + (u - 2 * w - h))))
            X[m], Y[m] = x, y
    return X, Y


def light_facing(albedo, b, width_m, storey_m, camera_m, sources, seed=36,
                 plan_xy=None, room_rect=None):
    """The field, and the lit frame. Pure in its inputs; seeded."""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    field = np.full((H, W), AMBIENT)

    u = np.zeros((H, W))
    h = np.zeros((H, W))
    dist = np.zeros((H, W))
    for name in ("wall", "floor", "ceiling", "left", "right"):
        i = S.REGIONS.index(name)
        m = idx == i
        if not np.any(m):
            continue
        if name == "wall":
            u[m], h[m], dist[m] = p[m] * width_m, q[m] * storey_m, camera_m
        elif name in ("floor", "ceiling"):
            u[m] = p[m] * width_m
            h[m] = 0.0 if name == "floor" else storey_m
            dist[m] = camera_m - (1.0 - q[m]) * camera_m
        else:
            u[m] = 0.0 if name == "left" else width_m
            h[m], dist[m] = p[m] * storey_m, camera_m - (1.0 - q[m]) * camera_m

    # ---- item 3: a dominant direction, IN THE WORLD
    if plan_xy is not None and room_rect is not None:
        X, Y = plan_xy
        span = max(1e-6, max(room_rect["x1"] - room_rect["x0"],
                             room_rect["y1"] - room_rect["y0"]))
        cx = 0.5 * (room_rect["x0"] + room_rect["x1"])
        cy = 0.5 * (room_rect["y0"] + room_rect["y1"])
        t = (KEY_DIR_PLAN[0] * (X - cx) + KEY_DIR_PLAN[1] * (Y - cy)) / span
        field += KEY_RAMP * np.clip(0.5 + t, 0.0, 1.0)
    else:
        field += 0.5 * KEY_RAMP

    # ---- the sources, at their PLAN positions
    tint = np.ones((H, W, 3))
    X, Y = plan_xy if plan_xy is not None else (np.zeros((H, W)), np.zeros((H, W)))
    for s in sources:
        d = np.sqrt((X - s["x_m"]) ** 2 + (Y - s["y_m"]) ** 2
                    + (h - s.get("z_m", 1.1)) ** 2)
        f = np.exp(-(d / A.FIRELIGHT_R_M) ** 2)
        g = SOURCE_GAIN.get(s["kind"], 0.3)
        field += g * f
        t = SOURCE_TINT.get(s["kind"], (1.0, 1.0, 1.0))
        for c in range(3):
            tint[..., c] += (t[c] - 1.0) * f * g

    # ---- item 1: contact darkening at every junction the box defines
    wall = idx == S.REGIONS.index("wall")
    floor = idx == S.REGIONS.index("floor")
    ceil = idx == S.REGIONS.index("ceiling")
    lft = idx == S.REGIONS.index("left")
    rgt = idx == S.REGIONS.index("right")
    contact = np.zeros((H, W))
    # the wall's foot, from both sides of the junction
    contact = np.maximum(contact, np.where(wall, np.exp(-(h / CONTACT_M) ** 2), 0.0))
    near = np.where(floor, np.exp(-((camera_m - dist) / CONTACT_M) ** 2), 0.0)
    contact = np.maximum(contact, near)
    # the two vertical corners
    for m, edge in ((wall, u), (wall, width_m - u)):
        contact = np.maximum(contact, np.where(m, 0.7 * np.exp(-(edge / CONTACT_M) ** 2), 0.0))
    for m in (lft, rgt):
        contact = np.maximum(contact, np.where(m, 0.7 * np.exp(-((camera_m - dist) / CONTACT_M) ** 2), 0.0))
    field *= (1.0 - CONTACT_DEPTH * contact)

    # ---- item 2: a resolvable step at the wall/ceiling junction
    step = np.where(wall, np.exp(-(((storey_m - h) / CEILING_STEP_M) ** 2)), 0.0)
    step = np.maximum(step, np.where(ceil, np.exp(-((camera_m - dist) / CEILING_STEP_M) ** 2), 0.0))
    field *= (1.0 - (1.0 - CEILING_STEP) * step)

    lit = np.clip(albedo * field[..., None] * tint, 0, 255)
    return lit, {"ambient": AMBIENT, "sources": sources,
                 "field_min": round(float(field.min()), 4),
                 "field_max": round(float(field.max()), 4),
                 "seed": seed}


def run(key, albedo_png, out_png):
    plan = json.load(open(A.PLAN))
    facings = json.load(open(A.FACINGS))["facings"]
    r = facings[key]
    d = r["declared"]
    loc, f = key.split("/")
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
    width_m = (x1 - x0) / ppm
    src = sources_for(plan, loc)
    albedo = load(os.path.join(ROOT, albedo_png))
    room = next(x for x in plan["rooms"] if x["id"] == loc)
    decl = {"width_m": width_m, "storey_m": storey, "camera_m": d["camera_wall_m"]}
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    plan_xy = plan_positions(idx, p, q, decl, room, f)
    lit, rec = light_facing(albedo, b, width_m, storey, d["camera_wall_m"], src,
                            plan_xy=plan_xy, room_rect=room["rect"])
    A.write_tile(out_png, lit)
    rec.update(facing=key, albedo=albedo_png, out=out_png)
    return rec


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--facing", required=True)
    ap.add_argument("--albedo", default="")
    ap.add_argument("--out", default="")
    ap.add_argument("--json", default="")
    args = ap.parse_args()
    alb = args.albedo or os.path.join(
        "backdrops", "source-assembled", args.facing.replace("/", "-"), "albedo.png")
    out = args.out or os.path.join(
        ROOT, "backdrops", "source-assembled", args.facing.replace("/", "-"), "lit.png")
    rec = run(args.facing, alb, out)
    print("%s lit -> %s" % (args.facing, os.path.relpath(out, ROOT)))
    print("  sources: %s" % (", ".join(
        "%s@(%.1f,%.1f)" % (s["kind"], s["x_m"], s["y_m"])
        for s in rec["sources"]) or "none"))
    print("  field %.3f..%.3f" % (rec["field_min"], rec["field_max"]))
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(rec, fh, indent=2, default=float)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
