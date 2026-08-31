#!/usr/bin/env python3
"""THE DEEP VIEW — a facing across an open edge is DERIVED, never painted.

    python3 design/plan-draft/measured/deep_view.py --pack underground-2 \\
        --facing platform/E
    python3 design/plan-draft/measured/deep_view.py --pack underground-2 --all

WHY THIS EXISTS
---------------
A LONG ROOM is several unit cells joined by full-width `open_edge` openings.
`tools/validate-plan.mjs`'s `throughLine` is the law: a cell's facing toward
its neighbour views the first RULED line beyond — the FAR cell's wall — and
"its painting is the room continuing (the up arrow walks between two paintings
of that same wall)".

Until now the deep facing was PAINTED, on its own roll, beside the close views
of the very same masonry. Two rolls of the same wall do not agree: the panel
count differs, the dado runs at a different height, the plaster is a different
plaster. The walk between them is the one place a viewer sees both at once, so
it is the one place the disagreement is unmissable.

So the deep facing is not a painting. It is an ASSEMBLY, and every pixel of it
comes from a painting that is already promoted:

  * everything AT AND BEYOND the crossed edge is the FAR cell's own painting of
    the same wall, re-photographed from the deep standpoint;
  * everything NEARER than the crossed edge — the near cell's side walls, its
    floor, its ceiling, running back toward the viewer — is the NEAR cell's own
    promoted paintings, mapped onto the receding planes of this view.

Nothing is invented. Where a surface has no promoted source at all the frame
extends the last painted texel along that surface's own receding lines, exactly
as `mesh_warp.plane_field_and_fill` does, and the record says so in
`fallbacks` rather than leaving the viewer to find it.

THE GEOMETRY, IN ONE PARAGRAPH
------------------------------
Every camera here is the drawing's own pinhole: `FOCAL_PX` on a 1536x1024
frame, the eye at `DRAWING_EYE_M`, the horizon at `HORIZON_Y`. A point of the
room at depth `Z` and lateral offset `X` from a camera's axis lands at
`(vx + f*X/Z, vy + f*(eye - height)/Z)`. That single line is the whole of the
projection, forward for the SOURCE paintings and — through
`row35_snap.assign`, which says which of the five planes an output pixel lies
on and with what two parameters — backward for the TARGET frame. The five-plane
box is reused rather than rewritten precisely because the snap already owns the
question "which surface is this pixel"; this module only answers "and which
painting shows that surface".

THE TARGET camera is CANONICAL — `FOCAL_PX`, `HORIZON_Y`, `DRAWING_EYE_M`, the
principal point at the frame centre — because a promoted candidate must answer
to the plan's declared geometry and to nothing else. THE SOURCE cameras are
each read from that painting's OWN meta (its corners, its floor line, its
horizon), because that is the camera the painter drew to; sampling a painting
through a camera it was not drawn to is how detail drifts. Where a source
meta disagrees with the canonical camera the record carries the difference
(`sources[*].eye_m`, `k_camera` vs `k_corners`) instead of hiding it.

DETERMINISM. No randomness, no clock, no timestamp — in the pixels or in the
record. The candidate id is `sha256` over the input paintings' bytes and the
plan geometry that placed them, so the same inputs give the same id and the
loop's own measure->promote pipeline treats the frame like any other candidate.
"""

import argparse
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import pack as packlib                                          # noqa: E402
import mesh_warp as mw                                          # noqa: E402
import row35_snap as snap                                       # noqa: E402

#: The declared frame. The same numbers `row35_snap` and `mesh_warp` state.
W, H = snap.W, snap.H

#: The drawing's pinhole, from `src/groundplane.js` by way of `row23_lib` —
#: FOCAL_MM 24 on a 36 mm frame at 1536 px is 1024 px exactly.
FOCAL_PX = 1024.0
DRAWING_EYE_M = 1.183
HORIZON_Y = 0.51377

#: How far a point may fall outside a source frame before the sample stops
#: being a sample and becomes an extension. Zero: any over-reach at all is
#: recorded, because on a DERIVED frame "the picture ran out here" is the one
#: thing a reviewer must be told.
EPS = 1e-9

#: THE DERIVATION'S OWN NAME, and it is in the candidate id on purpose. The
#: inputs and the geometry are not the whole of what makes these pixels: the
#: rule that assembles them is too. Bump it when the assembly changes what it
#: draws, so that a rerun after a fix is a NEW candidate the pipeline measures
#: rather than the same id with different pixels behind it.
DERIVATION = "deep_view/1"

FACING_DIR = {"N": (0.0, 1.0), "S": (0.0, -1.0),
              "E": (1.0, 0.0), "W": (-1.0, 0.0)}


class DeepRefusal(Exception):
    """This facing cannot be derived, and why."""


# ---------------------------------------------------------------- the geometry

def right_of(fdir):
    """The camera's own right hand: forward x up, with up = +z."""
    fx, fy = fdir
    return (fy, -fx)


def facing_edge(rect, f):
    """The room's OWN wall line for a facing — what `facingGeometry` rules."""
    return {"N": rect["y1"], "S": rect["y0"],
            "E": rect["x1"], "W": rect["x0"]}[f]


def across_span(rect, f):
    """The two ends of the wall this facing views, in room coordinates."""
    if f in ("N", "S"):
        return (rect["x0"], rect["x1"])
    return (rect["y0"], rect["y1"])


def room_of(plan, rid):
    for r in plan.get("rooms", []):
        if r.get("id") == rid:
            return r
    return None



def run_span_of(plan, room, f):
    """The RUN a side wall belongs to, in world coordinates along the span axis.

    Mirrors `tools/plan-projection.mjs` `runSpanOf`: extend across full-width
    `open_edge`s on the cell's side edges while the neighbour continues the
    same wall line. Returns (lo, hi); equals the cell's own span when the wall
    is no run — which is what keeps every non-run source byte-identical.
    """
    ax = "x" if f in ("N", "S") else "y"
    nx = "y" if ax == "x" else "x"
    wall_line = facing_edge(room["rect"], f)
    lo, hi = across_span(room["rect"], f)
    d0, d1 = (room["rect"][nx + "0"], room["rect"][nx + "1"])
    for direction in (-1, 1):
        cell = room
        for _ in range(8):
            edge = cell["rect"][ax + ("0" if direction < 0 else "1")]
            found = None
            for o in plan.get("openings", []):
                r = o.get("rect")
                if (o.get("kind") != "open_edge" or o.get("floor") != cell.get("floor")
                        or not r or cell["id"] not in (o.get("joins") or [])):
                    continue
                if abs(r[ax + "0"] - edge) > 1e-6 or abs(r[ax + "1"] - edge) > 1e-6:
                    continue
                if r[nx + "0"] > d0 + 1e-6 or r[nx + "1"] < d1 - 1e-6:
                    continue
                found = o
                break
            if not found:
                break
            nid = next((j for j in found.get("joins", []) if j != cell["id"]), None)
            nxt = next((r2 for r2 in plan.get("rooms", []) if r2["id"] == nid), None)
            if not nxt or abs(facing_edge(nxt["rect"], f) - wall_line) > 1e-6:
                break
            cell = nxt
            if direction < 0:
                lo = cell["rect"][ax + "0"]
            else:
                hi = cell["rect"][ax + "1"]
    return lo, hi

def walk_open_edges(plan, room, f, max_hops=8):
    """The `throughLine` walk, returning the cells crossed and the lines.

    Same law as `tools/validate-plan.mjs`: hop while a full-width `open_edge`
    lies on this facing's own wall line, and the facing views the first RULED
    line beyond. Returns `(cells, edges)` — `cells[0]` is `room` itself,
    `cells[-1]` is the cell holding the viewed wall, and `edges[i]` is the
    coordinate of the open edge crossed between `cells[i]` and `cells[i+1]`.
    """
    cells, edges = [room], []
    cell, line = room, facing_edge(room["rect"], f)
    for _ in range(max_hops):
        lo, hi = across_span(cell["rect"], f)
        found = None
        for o in plan.get("openings", []):
            if o.get("kind") != "open_edge" or o.get("floor") != cell.get("floor"):
                continue
            rect = o.get("rect") or {}
            if cell["id"] not in (o.get("joins") or []):
                continue
            if f in ("N", "S"):
                on_line = (abs(rect.get("y0", 1e9) - line) < 1e-9
                           and abs(rect.get("y1", 1e9) - line) < 1e-9)
                spans = (rect.get("x0", 1e9) - 1e-9 <= lo
                         and hi <= rect.get("x1", -1e9) + 1e-9)
            else:
                on_line = (abs(rect.get("x0", 1e9) - line) < 1e-9
                           and abs(rect.get("x1", 1e9) - line) < 1e-9)
                spans = (rect.get("y0", 1e9) - 1e-9 <= lo
                         and hi <= rect.get("y1", -1e9) + 1e-9)
            if on_line and spans:
                found = o
                break
        if found is None:
            break
        nxt = room_of(plan, next((j for j in found["joins"] if j != cell["id"]), None))
        if nxt is None:
            break
        cells.append(nxt)
        edges.append(line)
        cell = nxt
        line = facing_edge(nxt["rect"], f)
    return cells, edges


def is_deep(plan, room, f):
    """A DEEP facing: its declared `wall_line` is not its own room's edge.

    The law is `validate-plan`'s: a facing's `wall_line` is either this
    facing's own edge or the first ruled line across its open edges. The
    second case is exactly a deep facing, and this is the whole detection.
    """
    fc = (room.get("facings") or {}).get(f)
    if not fc or fc.get("wall_line") is None:
        return False
    return abs(float(fc["wall_line"]) - facing_edge(room["rect"], f)) > 1e-9


def deep_facings(plan):
    """Every `(room_id, facing)` the plan rules as deep, in plan order."""
    out = []
    for r in plan.get("rooms", []):
        for f in ("N", "S", "E", "W"):
            if is_deep(plan, r, f):
                out.append((r["id"], f))
    return out


class Camera(object):
    """One pinhole: where it stands, where it looks, and its wall's scale.

    `fh`/`fv` are the focal in pixels along the two image axes. They are one
    number on the canonical camera and they are allowed to differ on a SOURCE,
    because a meta may declare `px_per_m_at_wall` that its own corner columns
    do not agree with — a real condition in this corpus. Keeping both is what
    lets the record report the disagreement instead of quietly splitting it.
    """

    def __init__(self, ox, oy, fdir, wall_m, fh, fv, vx, vy, eye, storey):
        self.ox, self.oy = float(ox), float(oy)
        self.fdir = (float(fdir[0]), float(fdir[1]))
        self.rdir = right_of(self.fdir)
        self.wall_m = float(wall_m)
        self.fh, self.fv = float(fh), float(fv)
        self.vx, self.vy = float(vx), float(vy)
        self.eye, self.storey = float(eye), float(storey)

    @property
    def ppm_h(self):
        return self.fh / self.wall_m

    @property
    def ppm_v(self):
        return self.fv / self.wall_m

    def ray(self, xr, yr, z):
        """A room point as `(Ux, Uy, Z)`: image = `(vx, vy) + (Ux, Uy)/Z`."""
        dx, dy = np.asarray(xr) - self.ox, np.asarray(yr) - self.oy
        lat = dx * self.rdir[0] + dy * self.rdir[1]
        dep = dx * self.fdir[0] + dy * self.fdir[1]
        return self.fh * lat, self.fv * (self.eye - np.asarray(z)), dep

    def point(self, lat, dep, z):
        """The inverse: camera-frame (lateral, depth, height) to room `(x, y, z)`."""
        xr = self.ox + self.fdir[0] * dep + self.rdir[0] * lat
        yr = self.oy + self.fdir[1] * dep + self.rdir[1] * lat
        return xr, yr, z

    def wall_lateral(self, c):
        """A wall-end's across coordinate as a lateral offset from the axis.

        The across axis is the one the camera does NOT look along: y for an
        E/W facing, x for an N/S one.
        """
        if self.fdir[1] == 0.0:
            return (c - self.oy) * self.rdir[1]
        return (c - self.ox) * self.rdir[0]

    def box(self, wall_lo, wall_hi):
        """The five-plane box `row35_snap` reads, for a wall spanning `lo..hi`."""
        xs = [self.vx + self.ppm_h * self.wall_lateral(c)
              for c in (wall_lo, wall_hi)]
        yf = self.vy + self.eye * self.ppm_v
        yc = yf - self.storey * self.ppm_v
        return snap.box(min(xs), max(xs), yc, yf, self.vx, self.vy)


def target_camera(plan, room, f):
    """The DEEP facing's own camera: canonical pinhole at the ruled standpoint."""
    fc = room["facings"][f]
    sp = fc["standpoint"]
    storey = storey_of(plan, room)
    return Camera(sp["x"], sp["y"], FACING_DIR[f], float(fc["camera_wall_m"]),
                  FOCAL_PX, FOCAL_PX, W / 2.0, HORIZON_Y * H,
                  DRAWING_EYE_M, storey)


def source_camera(plan, room, f, meta):
    """A promoted painting's camera, read from ITS OWN meta.

    The horizontal scale comes from the corner columns over the ruled wall
    width — the two numbers a painting is measured against — and the vertical
    from `px_per_m_at_wall`, which is the scale the floor line and the horizon
    were declared with. `vx` follows from the corner the wall's left end lands
    in, so the wall rectangle of this camera reproduces the meta exactly.
    """
    fc = room["facings"][f]
    sp = fc["standpoint"]
    storey = storey_of(plan, room)
    ih = float(meta.get("image_h_px", H))
    width_m = float(fc.get("wall_width_m") or abs(
        across_span(room["rect"], f)[1] - across_span(room["rect"], f)[0]))
    x0, x1 = float(meta["corner_x0_px"]), float(meta["corner_x1_px"])
    # [2026-08-30] A RUN WALL'S CORNERS SPAN THE RUN, not the cell: divide by
    # the run's metres or the horizontal scale doubles and every band misses
    # (the regenerated deep frames came back 79 % fill on run-cornered
    # sources). Equal spans reproduce the old arithmetic exactly.
    run_lo, run_hi = run_span_of(plan, room, f)
    span_m = (run_hi - run_lo) if (run_hi - run_lo) > width_m + 1e-6 else width_m
    ppm_h = (x1 - x0) / span_m
    ppm_v = float(meta["px_per_m_at_wall"])
    wall_m = float(fc["camera_wall_m"])
    vy = float(meta["horizon_y"]) * ih
    eye = (float(meta["floor_line_y"]) * ih - vy) / ppm_v
    cam = Camera(sp["x"], sp["y"], FACING_DIR[f], wall_m, ppm_h * wall_m,
                 ppm_v * wall_m, 0.0, vy, eye, storey)
    # `x0` is the LEFT column, so it belongs to whichever end of the wall has
    # the smaller lateral offset. Nothing here assumes the camera stands on
    # the room's axis; `vx` is solved for, not assumed to be the frame centre.
    cam.vx = x0 - ppm_h * min(cam.wall_lateral(run_lo), cam.wall_lateral(run_hi))
    return cam


def storey_of(plan, room):
    for fl in plan.get("floors", []):
        if fl.get("id") == room.get("floor"):
            return float(fl.get("storey_height_m", 3.4))
    return 3.4


# ------------------------------------------------------------- the sampling

def sample_extended(rgb, cam, xr, yr, z):
    """Sample `rgb` at a room point, extending the picture along its recession.

    A receding surface's image is `V + U/Z`: every point of it lies on the ray
    from the camera's convergence in the fixed direction its lateral offset and
    height name. So where a point falls outside the painted frame — or behind
    the camera entirely, which is where `Z <= 0` — the honest last sample is
    the one where that same ray leaves the frame, and that is `ray_exit`, the
    fill `mesh_warp` already extends every plane by. Returns
    `(pixels, extended)`; `extended` is the mask of samples that were not
    inside the painting.
    """
    ux, uy, dep = cam.ray(xr, yr, z)
    h, w = rgb.shape[:2]
    smax = mw.ray_exit(cam.vx, cam.vy, ux, uy, (0.0, w - 1.0, 0.0, h - 1.0))
    with np.errstate(divide="ignore", invalid="ignore"):
        s = np.where(dep > EPS, 1.0 / np.where(dep > EPS, dep, 1.0), np.inf)
    use = np.minimum(s, smax)
    use = np.where(np.isfinite(use), use, 0.0)
    px = cam.vx + use * ux
    py = cam.vy + use * uy
    extended = (s > smax + 1e-9) | (dep <= EPS)
    return mw.resample_clamped(rgb, px, py), extended


# ------------------------------------------------------------- the assembly

def surface_points(tgt, tbox, storey):
    """Every output pixel's room point, and which of the five planes it lies on.

    `row35_snap.assign` does the hard half. Its two parameters are read here as
    what they physically are: on the wall and the two side planes the vertical
    parameter is height/storey; on the floor and ceiling the horizontal one is
    a FIXED lateral offset (the plane's own image is `V + U/Z`, so the
    parameter that names a point's across position does not vary with depth).
    """
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = snap.assign(tbox, xs, ys)
    ppm = tgt.ppm_h
    lat_wall = (tbox["x0"] + (tbox["x1"] - tbox["x0"]) * p - tbox["vx"]) / ppm
    lat_left = (tbox["x0"] - tbox["vx"]) / ppm
    lat_right = (tbox["x1"] - tbox["vx"]) / ppm
    names = list(snap.REGIONS)
    lat = np.zeros_like(p)
    dep = np.zeros_like(p)
    hgt = np.zeros_like(p)
    for i, r in enumerate(names):
        m = idx == i
        if not np.any(m):
            continue
        if r == "wall":
            # On the WALL the box's two parameters are (across, up): `p` is
            # the fraction along the corner-to-corner rectangle and `q` is the
            # fraction from the floor line to the ceiling line. On the four
            # RECEDING planes they are (up-or-across, depth) instead — `q` is
            # the depth ratio there. Reading `q` as height on the wall and as
            # depth on the ring is the whole of the difference, and getting it
            # backwards on the wall smears one source row across the frame.
            lat[m], dep[m], hgt[m] = lat_wall[m], tgt.wall_m, q[m] * storey
        elif r in ("floor", "ceiling"):
            lat[m] = lat_wall[m]
            dep[m] = q[m] * tgt.wall_m
            hgt[m] = 0.0 if r == "floor" else storey
        else:
            lat[m] = lat_left if r == "left" else lat_right
            dep[m] = q[m] * tgt.wall_m
            hgt[m] = p[m] * storey
    # A point the box places on no plane is behind the camera; over a whole
    # frame with a valid box there are none, and the record counts them.
    lost = idx < 0
    if np.any(lost):
        lat[lost] = lat_wall[lost]
        dep[lost] = tgt.wall_m
        hgt[lost] = np.clip(p[lost], 0.0, 1.0) * storey
        idx = np.where(lost, names.index("wall"), idx)
    xr, yr, _ = tgt.point(lat, dep, hgt)
    return idx, q, xr, yr, hgt, int(lost.sum())


def assemble(plan, loc, f, sources, near_room=None):
    """The deep facing's frame, and the record of how it was put together.

    `sources` maps a role to `(room_id, facing, meta, rgb)`:

        far    the far cell's painting of the SAME facing — the wall this
               facing actually views, and every surface beyond the edge;
        left   the near cell's painting of the wall on this view's left;
        right  likewise on the right.

    `far` is required. Either side may be absent; its ring then falls back to
    the far frame extended along its own recession, and `fallbacks` says so.
    """
    room = room_of(plan, loc)
    if room is None:
        raise DeepRefusal("no room %r in this plan" % (loc,))
    if not is_deep(plan, room, f):
        raise DeepRefusal(
            "%s/%s is not a deep facing: its wall_line %s IS its own room's "
            "edge, so it is painted like any other wall"
            % (loc, f, (room.get("facings") or {}).get(f, {}).get("wall_line")))
    cells, edges = walk_open_edges(plan, room, f)
    if len(cells) < 2:
        raise DeepRefusal("%s/%s declares a wall_line across an open edge and "
                          "no full-width open_edge answers to it" % (loc, f))
    far_room = cells[-1]
    storey = storey_of(plan, room)
    tgt = target_camera(plan, room, f)
    lo, hi = across_span(far_room["rect"], f)
    tbox = tgt.box(lo, hi)
    refusal = snap.box_refusal(tbox)
    if refusal:
        raise DeepRefusal("%s/%s: %s" % (loc, f, refusal))

    edge_depth = abs(edges[0] - (tgt.ox if f in ("E", "W") else tgt.oy))
    t_edge = edge_depth / tgt.wall_m
    stand_back = float(plan.get("standpoint_stand_back", 0.25))
    t_near = stand_back / tgt.wall_m

    idx, q, xr, yr, hgt, lost = surface_points(tgt, tbox, storey)
    names = list(snap.REGIONS)

    #: THE BANDS. Each cell the walk crosses owns a depth range of this view,
    #: and within its own range the ring surfaces — the two side walls, the
    #: floor, the ceiling — are THAT CELL'S own promoted paintings. This is
    #: why the far cell's side walls are not taken from its E painting: a
    #: facing's frame shows only the last metre or so of its own returns (the
    #: outer few hundred columns), while the same cell's N and S paintings
    #: show those walls whole and fronto-parallel. One cell, one set of walls,
    #: whichever painting of that cell actually shows the surface.
    origin = tgt.ox if f in ("E", "W") else tgt.oy
    bands, d0 = [], 0.0
    for i, c in enumerate(cells):
        d1 = abs(edges[i] - origin) if i < len(edges) else tgt.wall_m
        bands.append((d0 / tgt.wall_m, d1 / tgt.wall_m, c))
        d0 = d1

    cams, rgbs = {}, {}
    for role, tup in sources.items():
        rid, rf, meta, rgb = tup
        cams[role] = source_camera(plan, room_of(plan, rid), rf, meta)
        rgbs[role] = np.asarray(rgb, dtype=np.float64)

    out = np.zeros((H, W, 3), dtype=np.float64)
    ext_px = {}
    used = {}
    natural = {}
    fallbacks = []

    def paint(mask, order, label):
        """Fill `mask` from the first candidate that has real paint there."""
        if not np.any(mask):
            return
        natural[label] = order[0]
        todo = mask.copy()
        for role in order:
            if role not in rgbs or not np.any(todo):
                continue
            px, extended = sample_extended(rgbs[role], cams[role],
                                           xr[todo], yr[todo], hgt[todo])
            fits = ~extended
            sel = np.zeros_like(todo)
            sel[todo] = fits
            if np.any(sel):
                out[sel] = px[fits]
                used[label] = sorted(set(used.get(label, []) + [role]))
            todo = todo & ~sel
        if np.any(todo):
            # Nothing showed this surface here. Extend the FIRST candidate
            # along its own receding lines — the recession fill, recorded.
            role = next((r for r in order if r in rgbs), None)
            if role is None:
                raise DeepRefusal("no source at all for %s" % label)
            px, _ = sample_extended(rgbs[role], cams[role],
                                    xr[todo], yr[todo], hgt[todo])
            out[todo] = px
            used[label] = sorted(set(used.get(label, []) + [role]))
            ext_px[label] = ext_px.get(label, 0) + int(todo.sum())

    # 1. The wall this facing views: the far cell's own painting of it,
    #    re-photographed from this standpoint. Nothing else can show it.
    paint(idx == names.index("wall"), ["far"], "wall")

    # 2. The ring, band by band. Which side of the view a floor or ceiling
    #    pixel lies on decides which of the cell's two side paintings is asked
    #    first; the other, and then the far facing, answer where it cannot.
    dx, dy = xr - tgt.ox, yr - tgt.oy
    lat_side = dx * tgt.rdir[0] + dy * tgt.rdir[1]
    last = len(bands) - 1
    wanted_roles = []
    for i, (t0, t1, cell) in enumerate(bands):
        band = q >= t0 - 1e-12
        if i < last:
            band = band & (q < t1 - 1e-12)
        left_role, right_role = "c%d.left" % i, "c%d.right" % i
        wanted_roles += [left_role, right_role]
        for reg, role in (("left", left_role), ("right", right_role)):
            paint((idx == names.index(reg)) & band, [role, "far"],
                  "%s.%s" % (cell["id"], reg))
        for reg in ("floor", "ceiling"):
            m = (idx == names.index(reg)) & band
            for half, nat, oth in (("left", left_role, right_role),
                                   ("right", right_role, left_role)):
                sel = m & (lat_side <= 0.0 if half == "left" else lat_side > 0.0)
                # The FAR cell's own floor and ceiling are asked of the facing
                # painting first: it looks the way this view looks, so its
                # boards and its joists need the least turning to get here.
                order = ["far", nat, oth] if i == last else [nat, oth, "far"]
                paint(sel, order, "%s.%s.%s" % (cell["id"], reg, half))

    #: TWO KINDS OF FALLBACK, and the record separates them because a reviewer
    #: reads them differently. `plane_recession` is a painting that HAS this
    #: surface and simply ran out of it — the last texel extended along the
    #: surface's own receding lines, the fill `mesh_warp` already owns.
    #: `far_frame_edge` is a surface whose OWN painting is not promoted at all,
    #: so the far frame's edge stands in for it; that is a wall waiting for a
    #: roll, not a wall that was slightly too short.
    missing = [r for r in wanted_roles if r not in rgbs]
    for label, n in sorted(ext_px.items()):
        absent = natural.get(label) not in rgbs
        entry = {"surface": label, "pixels": n, "source": used.get(label, []),
                 "fill": "far_frame_edge" if absent else "plane_recession"}
        if absent:
            entry["why"] = ("the %s source for this surface is not promoted, so "
                            "the far frame's edge stands in for it"
                            % natural.get(label))
        fallbacks.append(entry)

    far_cam = cams["far"]
    fbox = far_cam.box(*across_span(far_room["rect"], f))
    record = {
        "tool": "design/plan-draft/measured/deep_view.py",
        "facing": "%s/%s" % (loc, f),
        "kind": "derived_deep_view",
        "cells": [c["id"] for c in cells],
        "far_cell": far_room["id"],
        "crossed_edges": edges,
        "geometry": {
            "standpoint": [tgt.ox, tgt.oy],
            "wall_line": room["facings"][f]["wall_line"],
            "camera_wall_m": tgt.wall_m,
            "edge_depth_m": edge_depth,
            "t_edge": t_edge,
            "t_near": t_near,
            "standpoint_stand_back_m": stand_back,
            "storey_height_m": storey,
            "focal_px": FOCAL_PX,
            "horizon_y": HORIZON_Y,
            "eye_m": DRAWING_EYE_M,
        },
        "k_camera": far_cam.wall_m / tgt.wall_m,
        "k_corners": ((tbox["x1"] - tbox["x0"]) / (fbox["x1"] - fbox["x0"])),
        "quads": quads(tbox, t_edge, t_near),
        "sources": [
            {"role": role, "facing": "%s/%s" % (sources[role][0], sources[role][1]),
             "camera_wall_m": cams[role].wall_m,
             "eye_m": round(cams[role].eye, 4),
             "ppm_h": round(cams[role].ppm_h, 4),
             "ppm_v": round(cams[role].ppm_v, 4)}
            for role in sorted(sources)],
        "surfaces": {k: v for k, v in sorted(used.items())},
        "fallbacks": fallbacks,
        "missing_sources": missing,
        #: The whole cost of the fill in one number, because a reviewer asks
        #: "how much of this frame is paint" before anything else.
        "extended_px": int(sum(ext_px.values())),
        "extended_fraction": round(sum(ext_px.values()) / float(W * H), 5),
        "painted_fraction": round(1.0 - sum(ext_px.values()) / float(W * H), 5),
        "unassigned_px": lost,
        "seam": {"feather_px": 0, "join": "crossed_edge_rect"},
    }
    return out, record


def quads(tbox, t_edge, t_near):
    """The crossed edge's rectangle, and each ring plane's receding quad.

    A ring plane's quad runs from the NEAR plane — the standpoint's own stand
    back, which is as close as the view ever gets — out to the crossed edge,
    where the far frame takes over. These are the corners the near ring's
    homographies land on, written down so a reviewer can check them against
    the frame without rerunning anything.
    """
    def at(t, x, y):
        return [tbox["vx"] + (x - tbox["vx"]) / t, tbox["vy"] + (y - tbox["vy"]) / t]
    corners = {"tl": (tbox["x0"], tbox["yc"]), "tr": (tbox["x1"], tbox["yc"]),
               "br": (tbox["x1"], tbox["yf"]), "bl": (tbox["x0"], tbox["yf"])}
    edge = {k: at(t_edge, *v) for k, v in corners.items()}
    near = {k: at(t_near, *v) for k, v in corners.items()}
    return {
        "wall": {k: [v[0], v[1]] for k, v in corners.items()},
        "crossed_edge": edge,
        "near_plane": near,
        "left": [near["tl"], edge["tl"], edge["bl"], near["bl"]],
        "right": [near["tr"], edge["tr"], edge["br"], near["br"]],
        "floor": [near["bl"], edge["bl"], edge["br"], near["br"]],
        "ceiling": [near["tl"], edge["tl"], edge["tr"], near["tr"]],
    }


# ------------------------------------------------------------------ the store

def store_paths(root, loc, f):
    return (os.path.join(root, "backdrops", loc, "%s.png" % f),
            os.path.join(root, "backdrops", loc, "%s.meta.json" % f))


def load_source(root, loc, f):
    png, meta = store_paths(root, loc, f)
    if not (os.path.exists(png) and os.path.exists(meta)):
        return None
    with open(meta) as fh:
        m = json.load(fh)
    rgb = np.asarray(Image.open(png).convert("RGB"), dtype=np.float64)
    return m, rgb, png, meta


def side_facings(f):
    """The facing letters of the walls on this view's left and right."""
    rdir = right_of(FACING_DIR[f])
    left = next(k for k, v in FACING_DIR.items() if v == (-rdir[0], -rdir[1]))
    right = next(k for k, v in FACING_DIR.items() if v == rdir)
    return left, right


def candidate_id(inputs, geometry):
    """The candidate's name: its inputs and the geometry that placed them.

    Nothing else goes in — no clock, no host, no run — so two machines with the
    same store derive the same id, and a rerun that changes nothing writes the
    same file.
    """
    payload = json.dumps({"derivation": DERIVATION, "inputs": inputs,
                          "geometry": geometry},
                         sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:8]


def derive(pack, loc, f, root=None, out_dir=None):
    """Assemble one deep facing and write the candidate and its record."""
    root = root or ROOT
    plan = pack.plan if hasattr(pack, "plan") else pack
    room = room_of(plan, loc)
    if room is None:
        raise DeepRefusal("no room %r in this plan" % (loc,))
    if not is_deep(plan, room, f):
        raise DeepRefusal("%s/%s is not a deep facing" % (loc, f))
    cells, _ = walk_open_edges(plan, room, f)
    if len(cells) < 2:
        raise DeepRefusal("%s/%s: no full-width open_edge on its wall line" % (loc, f))
    far_id = cells[-1]["id"]
    left_f, right_f = side_facings(f)

    #: What this facing is derived FROM: the far cell's painting of the wall
    #: it views, and every crossed cell's own two side walls. A cell whose
    #: sides are not promoted is not a refusal — its band falls back and the
    #: record names it — but the far cell's own facing is, because that is the
    #: wall the facing exists to show.
    wanted = [("far", far_id, f)]
    for i, c in enumerate(cells):
        wanted.append(("c%d.left" % i, c["id"], left_f))
        wanted.append(("c%d.right" % i, c["id"], right_f))
    sources, inputs = {}, []
    for role, rid, rf in wanted:
        got = load_source(root, rid, rf)
        if got is None:
            if role == "far":
                raise DeepRefusal(
                    "%s/%s cannot be derived: the far cell's own painting "
                    "%s/%s is not promoted, and it is the wall this facing "
                    "views" % (loc, f, far_id, rf))
            continue
        m, rgb, png, meta = got
        sources[role] = (rid, rf, m, rgb)
        inputs.append({"role": role, "facing": "%s/%s" % (rid, rf),
                       "png": os.path.relpath(png, root),
                       "meta": os.path.relpath(meta, root),
                       "png_sha256": mw.sha256(png),
                       "meta_sha256": mw.sha256(meta)})

    frame, record = assemble(plan, loc, f, sources)
    cid = candidate_id(inputs, record["geometry"])
    record["inputs"] = inputs
    record["candidate_id"] = cid
    record["derivation"] = DERIVATION
    out_dir = out_dir or os.path.join(root, "backdrops", "source", "%s-%s" % (loc, f))
    png_out = os.path.join(out_dir, "row23-deep%s.png" % cid)
    json_out = os.path.join(out_dir, "row23-deep%s.deep.json" % cid)
    mw.write_png(png_out, frame)
    record["png"] = os.path.relpath(png_out, root)
    os.makedirs(os.path.dirname(json_out), exist_ok=True)
    with open(json_out, "w") as fh:
        json.dump(record, fh, indent=1, sort_keys=True)
        fh.write("\n")
    return png_out, json_out, record


# ---------------------------------------------------------------------- the CLI

def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    name = packlib.active_pack_name(argv)
    argv = packlib.strip_pack_args(argv)
    ap = argparse.ArgumentParser(
        description="Derive a deep facing's frame from the promoted paintings "
                    "of the cells it looks across.")
    ap.add_argument("--facing", help="loc/F, e.g. platform/E")
    ap.add_argument("--all", action="store_true",
                    help="every deep facing whose inputs are promoted")
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--out-dir", default=None)
    ap.add_argument("--list", action="store_true",
                    help="name the pack's deep facings and stop")
    args = ap.parse_args(argv)

    pk = packlib.load_pack(name)
    plan = pk.plan
    if args.list:
        for loc, f in deep_facings(plan):
            print("%s/%s" % (loc, f))
        return 0
    if args.all:
        todo = deep_facings(plan)
    elif args.facing:
        loc, _, f = args.facing.partition("/")
        todo = [(loc, f)]
    else:
        ap.error("name a --facing, or --all")
    rc = 0
    for loc, f in todo:
        try:
            png, js, rec = derive(plan, loc, f, root=args.root, out_dir=args.out_dir)
        except DeepRefusal as e:
            print("skip %s/%s: %s" % (loc, f, e))
            if not args.all:
                rc = 2
            continue
        ext = rec["extended_px"]
        print("%s/%s -> %s" % (loc, f, os.path.relpath(png, args.root)))
        print("   record %s" % os.path.relpath(js, args.root))
        print("   far %s  k_camera %.4f  k_corners %.4f  extended %d px (%.2f%%)"
              % (rec["far_cell"], rec["k_camera"], rec["k_corners"], ext,
                 100.0 * ext / float(W * H)))
    return rc


if __name__ == "__main__":
    sys.exit(main())
