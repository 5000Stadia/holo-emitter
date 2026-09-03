#!/usr/bin/env python3
"""Recompute every measured geometry descriptor in the spec from one table of dimensions.

The chair's dimensions live here and nowhere else. Every profile, sweep path, station ladder,
transform and socket in object-sculpt-spec.json is derived from this table, so a proportion
correction found in review is applied by editing DIMS and re-running, never by hand-editing
coordinates in fifteen places.

    python3 tools/regeom.py                 # rewrite the spec from DIMS
    python3 tools/regeom.py --show          # print the derived bounding box and leave the spec alone
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / "object-sculpt-spec.json"

# ---------------------------------------------------------------- dimensions (metres)
DIMS = dict(
    # seat frame (apron)
    apron_hx=0.235, apron_hz=0.205, apron_corner_r=0.032,
    apron_bottom_y=0.348, apron_top_y=0.427, lip_r=0.014, bottom_roll_r=0.006,
    # wool pad
    pad_inset=0.047,            # pad plan half-extent = apron half-extent - this
    pad_corner_r=0.030, pad_bottom_y=0.400, pad_top_y=0.445, pad_roll_r=0.014,
    # back shell
    shell_half_w=0.230, shell_edge_r=0.009, shell_sagitta=0.030,
    shell_bottom_y=0.530, shell_top_y=0.880, shell_roll_r=0.009, shell_recline_deg=12.0,
    stile_top_z=-0.196,
    # undercarriage
    leg_x=0.208, leg_front_z=0.178, leg_rear_z=-0.178,
    rear_foot_z=-0.256, rear_knee_dz=0.004,
    leg_top_y=0.430, foot_y=0.026,
    leg_r_top=0.0270, leg_r_apron=0.0250, leg_r_foot=0.0110,
    stile_top_y=0.548, stile_r_top=0.0205, leg_r_seat=0.0258,
    # ferrule
    ferrule_h=0.026, ferrule_r=0.0112,
)

D = lambda v: round(v, 5)


def rounded_rect(hx, hz, r, per_corner=3):
    pts = []
    corners = [(+1, +1), (-1, +1), (-1, -1), (+1, -1)]
    for i, (sx, sz) in enumerate(corners):
        cx, cz = sx * (hx - r), sz * (hz - r)
        a0 = math.atan2(sz, sx) - math.pi / 4
        for k in range(per_corner):
            a = a0 + (math.pi / 2) * (k / (per_corner - 1))
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
        nx, nz = corners[(i + 1) % 4]
        mx, mz = (sx + nx) / 2, (sz + nz) / 2
        pts.append((mx * hx if mx else 0.0, mz * hz if mz else 0.0))
    return [(D(x), D(z)) for x, z in pts]


def rr_shape(hx, hz, r):
    return [[x, D(-z)] for x, z in rounded_rect(hx, hz, r)]


def under_extrude(hx, hz, r, world_y, host_y):
    """Path points expressed in an extrude host's local frame (host carries rotation.x = -90)."""
    return [[x, D(-z), D(world_y - host_y)] for x, z in rounded_rect(hx, hz, r)]


def build(d):
    arc_half = d["shell_half_w"] - d["shell_edge_r"]
    sag = d["shell_sagitta"]
    R = (arc_half ** 2 + sag ** 2) / (2 * sag)
    thick = 2 * d["shell_edge_r"]
    recline = math.radians(d["shell_recline_deg"])
    length = (d["shell_top_y"] - d["shell_roll_r"] - d["shell_bottom_y"]) / math.cos(recline)

    def yfront(x):
        return math.sqrt(max(0.0, R * R - x * x)) - (R - sag)

    n = 13
    xs = [-arc_half + 2 * arc_half * i / (n - 1) for i in range(n)]
    front = [(x, yfront(x)) for x in xs]
    back = [(x, yfront(x) + thick) for x in xs]

    def cap(x_end, sign):
        cy = yfront(x_end) + d["shell_edge_r"]
        t = math.atan2(-x_end, math.sqrt(max(1e-9, R * R - x_end * x_end)))
        out = []
        for k in range(1, 5):
            a = -math.pi / 2 + math.pi * k / 5
            ux, uy = math.cos(a), math.sin(a)
            rx = ux * math.cos(t) - uy * math.sin(t)
            ry = ux * math.sin(t) + uy * math.cos(t)
            out.append((x_end + sign * d["shell_edge_r"] * rx, cy + sign * d["shell_edge_r"] * ry))
        return out

    shell_profile = [[D(a), D(b)] for a, b in
                     front + cap(arc_half, 1) + list(reversed(back)) + cap(-arc_half, -1)]
    roll_xs = [-arc_half + 2 * arc_half * i / 5 for i in range(6)]
    shell_roll = [[D(x), D(yfront(x) + d["shell_edge_r"]), D(length)] for x in roll_xs]

    a = -math.pi / 2 - recline
    wy = yfront(0.0) * math.cos(a)
    wz = yfront(0.0) * math.sin(a)
    shell_pos = [0.0, D(d["shell_bottom_y"] - wy), D(d["stile_top_z"] - sag - wz)]

    pad_hx = d["apron_hx"] - d["pad_inset"]
    pad_hz = d["apron_hz"] - d["pad_inset"]

    front_stations = [
        ([0.0, 0.000, 0.0], d["leg_r_top"]),
        ([0.0, D(d["apron_bottom_y"] - d["leg_top_y"]), 0.0], d["leg_r_apron"]),
        ([0.0, -0.190, 0.0], 0.0198),
        ([0.0, -0.300, 0.0], 0.0150),
        ([0.0, D(d["foot_y"] - d["leg_top_y"]), 0.0], d["leg_r_foot"]),
    ]
    dz_foot = d["rear_foot_z"] - d["leg_rear_z"]
    rear_stations = [
        ([0.0, D(d["stile_top_y"] - d["leg_top_y"]), D(d["stile_top_z"] - d["leg_rear_z"])], d["stile_r_top"]),
        ([0.0, 0.070, D((d["stile_top_z"] - d["leg_rear_z"]) * 0.72)], 0.0228),
        ([0.0, 0.000, 0.0], d["leg_r_seat"]),
        ([0.0, -0.100, D(d["rear_knee_dz"])], 0.0225),
        ([0.0, -0.200, D(dz_foot * 0.30)], 0.0186),
        ([0.0, -0.310, D(dz_foot * 0.66)], 0.0145),
        ([0.0, D(d["foot_y"] - d["leg_top_y"]), D(dz_foot)], d["leg_r_foot"]),
    ]

    def stations(raw):
        return [{"position": [D(p[0]), D(p[1]), D(p[2])], "rx": r, "rz": r, "twist": 0.0}
                for p, r in raw]

    return dict(
        shell_profile=shell_profile, shell_length=D(length), shell_pos=shell_pos,
        shell_roll=shell_roll, shell_R=D(R),
        apron_shape=rr_shape(d["apron_hx"], d["apron_hz"], d["apron_corner_r"]),
        apron_depth=D(d["apron_top_y"] - d["apron_bottom_y"]),
        lip_path=under_extrude(d["apron_hx"] - d["lip_r"], d["apron_hz"] - d["lip_r"],
                               d["apron_corner_r"] - d["lip_r"] * 0.2,
                               d["apron_top_y"], d["apron_bottom_y"]),
        bot_path=under_extrude(d["apron_hx"] - d["bottom_roll_r"], d["apron_hz"] - d["bottom_roll_r"],
                               d["apron_corner_r"] - d["bottom_roll_r"] * 0.2,
                               d["apron_bottom_y"] + d["bottom_roll_r"], d["apron_bottom_y"]),
        pad_shape=rr_shape(pad_hx, pad_hz, d["pad_corner_r"]),
        pad_depth=D(d["pad_top_y"] - d["pad_bottom_y"]),
        pad_path=under_extrude(pad_hx, pad_hz, d["pad_corner_r"],
                               d["pad_top_y"] - d["pad_roll_r"], d["pad_bottom_y"]),
        front_stations=stations(front_stations), rear_stations=stations(rear_stations),
        pad_hx=D(pad_hx), pad_hz=D(pad_hz),
    )


def apply(d, g, spec):
    by = {c["id"]: c for c in spec["componentTree"]}

    b = by["back-shell"]
    b["geometryDescriptor"]["profile2D"] = {"points": g["shell_profile"], "depth": g["shell_length"]}
    b["geometryDescriptor"]["measurements"].update(
        {"chord": D(2 * d["shell_half_w"]), "sagitta": d["shell_sagitta"], "arcRadius": g["shell_R"],
         "thickness": D(2 * d["shell_edge_r"]), "bottomY": d["shell_bottom_y"],
         "topY": d["shell_top_y"], "reclineDegrees": d["shell_recline_deg"]})
    b["transform"]["position"] = g["shell_pos"]
    b["transform"]["rotation"] = [D(math.radians(-90.0 - d["shell_recline_deg"])), 0.0, 0.0]

    r = by["back-shell-roll"]
    r["geometryDescriptor"]["tubePath"]["points"] = g["shell_roll"]
    r["geometryDescriptor"]["tubePath"]["radius"] = d["shell_roll_r"]
    mid = g["shell_roll"][len(g["shell_roll"]) // 2]
    r["attachment"]["localStart"] = r["attachment"]["localEnd"] = mid
    by["back-shell"]["actionProfile"]["sockets"][0]["localPosition"] = mid
    by["back-shell"]["actionProfile"]["sockets"][1]["localPosition"] = [D(d["shell_half_w"] - d["shell_edge_r"]), 0.0, 0.0]
    by["back-shell"]["actionProfile"]["sockets"][2]["localPosition"] = [D(-(d["shell_half_w"] - d["shell_edge_r"])), 0.0, 0.0]

    ap = by["seat-apron"]
    ap["geometryDescriptor"]["profile2D"] = {"points": g["apron_shape"], "depth": g["apron_depth"]}
    ap["geometryDescriptor"]["measurements"].update(
        {"planWidth": D(2 * d["apron_hx"]), "planDepth": D(2 * d["apron_hz"]),
         "cornerRadius": d["apron_corner_r"], "bottomY": d["apron_bottom_y"], "topY": d["apron_top_y"]})
    ap["transform"]["position"] = [0.0, d["apron_bottom_y"], 0.0]

    by["apron-lipping-roll"]["geometryDescriptor"]["tubePath"]["points"] = g["lip_path"]
    by["apron-lipping-roll"]["geometryDescriptor"]["tubePath"]["radius"] = d["lip_r"]
    by["apron-lipping-roll"]["attachment"]["localStart"] = g["lip_path"][0]
    by["apron-lipping-roll"]["attachment"]["localEnd"] = g["lip_path"][0]
    by["apron-bottom-roll"]["geometryDescriptor"]["tubePath"]["points"] = g["bot_path"]
    by["apron-bottom-roll"]["geometryDescriptor"]["tubePath"]["radius"] = d["bottom_roll_r"]
    by["apron-bottom-roll"]["attachment"]["localStart"] = g["bot_path"][0]
    by["apron-bottom-roll"]["attachment"]["localEnd"] = g["bot_path"][0]

    pd = by["seat-pad"]
    pd["geometryDescriptor"]["profile2D"] = {"points": g["pad_shape"], "depth": g["pad_depth"]}
    pd["geometryDescriptor"]["measurements"].update(
        {"planWidth": D(2 * g["pad_hx"]), "planDepth": D(2 * g["pad_hz"]),
         "cornerRadius": d["pad_corner_r"], "topY": d["pad_top_y"]})
    pd["transform"]["position"] = [0.0, d["pad_bottom_y"], 0.0]
    by["seat-pad-roll"]["geometryDescriptor"]["tubePath"]["points"] = g["pad_path"]
    by["seat-pad-roll"]["geometryDescriptor"]["tubePath"]["radius"] = d["pad_roll_r"]
    by["seat-pad-roll"]["attachment"]["localStart"] = g["pad_path"][0]
    by["seat-pad-roll"]["attachment"]["localEnd"] = g["pad_path"][0]
    by["seat-pad"]["actionProfile"]["sockets"][0]["localPosition"] = g["pad_path"][0]

    for cid, sx, z, st in (
        ("leg-front-l", +1, d["leg_front_z"], g["front_stations"]),
        ("leg-front-r", -1, d["leg_front_z"], g["front_stations"]),
        ("leg-rear-l", +1, d["leg_rear_z"], g["rear_stations"]),
        ("leg-rear-r", -1, d["leg_rear_z"], g["rear_stations"]),
    ):
        c = by[cid]
        c["geometryDescriptor"]["taperedSweep"]["stations"] = st
        c["geometryDescriptor"]["measurements"] = {
            "topRadius": st[0]["rx"], "footRadius": d["leg_r_foot"],
            "runLength": D(d["leg_top_y"] - d["foot_y"])}
        c["transform"]["position"] = [D(sx * d["leg_x"]), d["leg_top_y"], D(z)]
        c["attachment"]["localEnd"] = st[-1]["position"]
        c["actionProfile"]["sockets"][0]["localPosition"] = st[-1]["position"]

    apron_sockets = by["seat-apron"]["actionProfile"]["sockets"]
    for s, (sx, sz) in zip(apron_sockets[:4],
                           ((+1, d["leg_front_z"]), (-1, d["leg_front_z"]),
                            (+1, d["leg_rear_z"]), (-1, d["leg_rear_z"]))):
        s["localPosition"] = [D(sx * d["leg_x"]), D(-sz), D(d["leg_top_y"] - d["apron_bottom_y"])]
    apron_sockets[4]["localPosition"] = [d["apron_hx"], 0.0, g["apron_depth"]]

    dz_foot = D(d["rear_foot_z"] - d["leg_rear_z"])
    for cid, leg, dz in (("ferrule-front-l", "leg-front-l", 0.0),
                         ("ferrule-front-r", "leg-front-r", 0.0),
                         ("ferrule-rear-l", "leg-rear-l", dz_foot),
                         ("ferrule-rear-r", "leg-rear-r", dz_foot)):
        by[cid]["transform"]["position"] = [0.0, D(-d["leg_top_y"]), dz]
        by[cid]["attachment"]["localStart"] = [0.0, d["ferrule_h"], 0.0]

    lm = {l["id"]: l for l in spec["silhouette"]["landmarks"]}
    lm["shell-top"]["position"] = [0.0, d["shell_top_y"],
                                   D(g["shell_pos"][2] - (d["shell_top_y"] - d["shell_bottom_y"]) * math.tan(math.radians(d["shell_recline_deg"])) - d["shell_sagitta"])]
    lm["shell-bottom-centre"]["position"] = [0.0, d["shell_bottom_y"], D(g["shell_pos"][2] - d["shell_sagitta"])]
    lm["pad-crown"]["position"] = [0.0, d["pad_top_y"], 0.0]
    lm["apron-bottom"]["position"] = [0.0, d["apron_bottom_y"], 0.0]
    lm["front-foot-l"]["position"] = [d["leg_x"], 0.0, d["leg_front_z"]]
    lm["rear-foot-l"]["position"] = [d["leg_x"], 0.0, d["rear_foot_z"]]
    spec["silhouette"]["boundingShape"] = (
        f"upright rectangular prism {D(2*d['apron_hx'])} m wide x "
        f"{D(d['apron_hz'] - lm['shell-top']['position'][2] + d['shell_roll_r'])} m deep x "
        f"{d['shell_top_y']} m tall, split horizontally into a solid seat mass at "
        f"{d['apron_bottom_y']}-{d['pad_top_y']} m, an open reveal band at "
        f"{d['pad_top_y']}-{d['shell_bottom_y']} m, and a reclined shell above it")
    spec["dimensionTable"] = {"units": "metres", "source": "tools/regeom.py DIMS", **{k: D(v) for k, v in d.items()}}
    return spec


if __name__ == "__main__":
    g = build(DIMS)
    if "--show" in sys.argv:
        print(json.dumps({k: v for k, v in g.items() if not isinstance(v, list)}, indent=2))
        raise SystemExit(0)
    spec = json.loads(SPEC.read_text())
    SPEC.write_text(json.dumps(apply(DIMS, g, spec), indent=2, ensure_ascii=False))
    print("regeom: spec rewritten from DIMS")
