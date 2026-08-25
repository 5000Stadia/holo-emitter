#!/usr/bin/env python3
"""Row 41 — the proof batch: the kitchen re-assembled as fitted bays.

    python3 design/plan-draft/measured/row41_batch.py --room kitchen
    python3 design/plan-draft/measured/row41_batch.py --room master_bedchamber

THE ONE PICTURE THAT SETTLES IT is still the SEAM, for the reason row 36's own
batch gives: two facings of a room meet at a corner, and the strip down the
right edge of one and the strip down the left edge of the next are the SAME
PHYSICAL WALL seen from two standpoints. Row 41 adds the second thing to look
for in that strip, which is the thing the Captain said was missing: a COMPLETED
BAY on each side of the join, with a stile in the angle, rather than a panel cut
off by it.

`seam-*-row36.png` is the same corner as row 36 built it, so the pair is a
before and an after rather than an assertion.

WHAT THIS BATCH IS NOT. It is not a `§12.6` capture: these are the assembler's
own frames, not the scene canvas as the page draws it, because the floors and
ceilings are still row 36's V1 placeholder art. The walls are not — they are cut
from this room's own promoted paintings — and the README says which is which on
its own face.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row36_assemble as A                                       # noqa: E402
import row36_light as LIGHT                                      # noqa: E402
import row41_bays as B                                           # noqa: E402

#: Row 36's own strip width, unchanged, so the two batches' seams are the same
#: crop of the same corner and can be put beside each other honestly.
STRIP_FRAC = 0.16


def commit():
    try:
        return subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()[:12]
    except Exception:
        return "unknown"


def load_img(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.uint8)


def strip_pair(right_of, left_of, out, label_gap=8):
    a, b = load_img(right_of), load_img(left_of)
    w = int(round(a.shape[1] * STRIP_FRAC))
    gap = np.full((a.shape[0], label_gap, 3), 32, dtype=np.uint8)
    Image.fromarray(np.concatenate([a[:, -w:], gap, b[:, :w]], axis=1)).save(out)


def layout_table(rw):
    """The layout per wall, which is the README's whole subject."""
    lines = ["| wall | W (m) | module m | bays n | bay width (m) | stile (m) | "
             "openings, and how far each snapped |",
             "|---|---|---|---|---|---|---|"]
    for f in "NESW":
        w = rw.walls.get(f)
        if not w:
            continue
        lay = w["layout"]
        if lay["framed"]:
            ops = "; ".join(
                "%s bays %d-%d, %+.3f / %+.3f m (%.3f m total)"
                % (o["kind"], o["bays"][0], o["bays"][1], o["snap_left_m"],
                   o["snap_right_m"], o["snap_total_m"])
                for o in lay["openings"]) or "none"
            for o in lay.get("openings_refused", []):
                ops += ("; **%s at %.2f-%.2f m REFUSED** — %s"
                        % (o["kind"], o["asked_u_m"][0], o["asked_u_m"][1],
                           o["why"]))
            lines.append("| %s | %.3f | %.2f | %d | %.4f | %.3f | %s |"
                         % (f, lay["width_m"], lay["module_m"], lay["bays"],
                            lay["bay_width_m"], lay["stile_m"], ops))
        else:
            lines.append("| %s | %.3f | — (unframed) | — | — | %.3f (%s) | "
                         "row-36 sampler, edged at both corners |"
                         % (f, lay["width_m"], lay["edge_w_m"],
                            lay["edge"]["kind"]))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--room", required=True)
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    room = args.room
    out = args.out or os.path.join(ROOT, "design", "batches", "row41-bays", room)
    os.makedirs(out, exist_ok=True)

    plan = A.read_json(A.PLAN)
    facings = A.read_json(A.FACINGS)["facings"]
    doc = A.read_json(A.MATERIALS)

    rw = B.build_room(room, plan, facings, doc, verbose=True)
    order = [f for f in "NESW" if f in rw.walls]

    frames, refused = [], []
    for f in order:
        key = "%s/%s" % (room, f)
        alb = os.path.join(out, "%s-albedo.png" % f)
        rec, why = A.assemble_facing(key, plan, facings, doc, alb, room_walls=rw)
        if rec is None:
            refused.append({"facing": key, "why": why})
            print("  refused %s: %s" % (key, why))
            continue
        lit = os.path.join(out, "%s-lit.png" % f)
        LIGHT.run(key, os.path.relpath(alb, ROOT), lit)
        frames.append({"facing": key,
                       "albedo": os.path.relpath(alb, ROOT),
                       "lit": os.path.relpath(lit, ROOT),
                       "materials": rec["materials"],
                       "placeholder_art": rec["placeholder_art"]})

    seams, before = [], []
    have = [f for f in order if os.path.exists(os.path.join(out, "%s-lit.png" % f))]
    for which in ("albedo", "lit"):
        for i, f in enumerate(have):
            g = have[(i + 1) % len(have)]
            a = os.path.join(out, "%s-%s.png" % (f, which))
            b = os.path.join(out, "%s-%s.png" % (g, which))
            if not (os.path.exists(a) and os.path.exists(b)):
                continue
            dst = os.path.join(out, "seam-%s-%s-%s.png" % (f, g, which))
            strip_pair(a, b, dst)
            seams.append({"turn": "%s -> %s" % (f, g), "which": which,
                          "file": os.path.relpath(dst, ROOT)})
    # the same corners as row 36 built them, where that batch is in the tree
    r36 = os.path.join(ROOT, "backdrops", "source-assembled")
    for i, f in enumerate(have):
        g = have[(i + 1) % len(have)]
        a = os.path.join(r36, "%s-%s" % (room, f), "lit.png")
        b = os.path.join(r36, "%s-%s" % (room, g), "lit.png")
        if os.path.exists(a) and os.path.exists(b):
            dst = os.path.join(out, "seam-%s-%s-row36.png" % (f, g))
            strip_pair(a, b, dst)
            before.append({"turn": "%s -> %s" % (f, g),
                           "file": os.path.relpath(dst, ROOT)})

    corners = B.corner_rows(rw)
    cross = subprocess.run(
        ["python3", os.path.join(HERE, "row36_crossfacing.py"), "--room", room],
        cwd=ROOT, capture_output=True, text=True).stdout

    ev = rw.record.get("frame_evidence")
    prov = rw.record.get("pieces") or {}
    with open(os.path.join(out, "README.md"), "w") as fh:
        fh.write(
            "# Row 41 — %s, laid out as fitted bays\n\n"
            "**Rendered from commit `%s`.** The capture script is committed "
            "beside these frames (`design/plan-draft/measured/row41_batch.py`) "
            "and the layout itself is `row41_bays.py` — an artifact nobody can "
            "regenerate is not derived, it is just a file.\n\n"
            "## What to look at first\n\n"
            "The `seam-*.png` pairs, and in each one the **corner**: there is a "
            "whole stile in the angle and a completed bay on each side of it. "
            "`seam-*-row36.png` is the same corner as row 36 built it — a panel "
            "cut by the corner and a mirror fold in the middle of the wall.\n\n"
            "## The layout, per wall\n\n"
            "Deterministic from the wall's own width and the material's bay "
            "module: `n = max(1, floor(W/m + 0.5))`, bay width `W/n` **exactly**, "
            "a stile in every boundary including both corners. An opening takes "
            "whole bays; the snap column is how far each edge of it moved to get "
            "there, and the hole is then cut between the STILES so a corner bay's "
            "opening does not take the corner stile with it.\n\n%s\n\n"
            "## Where the pieces came from\n\n"
            "%s\n\n"
            "- **frame**: `%s`%s\n"
            "- **material of record**: `%s`%s\n\n"
            "## The corner check\n\n"
            "`row36_crossfacing.py --room %s --bays` runs this as a gate. For "
            "every corner, the bay boundary nearest that corner on each of the "
            "two walls must lie AT it, within one stile width.\n\n```\n%s```\n\n"
            "## The honest labels\n\n"
            "- **The WALLS are real**, cut from this room's own promoted "
            "paintings and de-lit by row 36's own `delight`. **The floors and "
            "ceilings are still V1 placeholder art** — their swatches have not "
            "returned — so nothing here is promotable and the frames carry "
            "`_promotable: false`.\n"
            "- These are the **assembler's own frames**, not the scene canvas as "
            "the page draws it.\n"
            "- `*-albedo.png` is the neutral piece as the library stores it. "
            "`*-lit.png` is the same frame under row 36's **minimal bake-time "
            "lighting stub**, which row 37 replaces. **Judge the architecture on "
            "the lit frames and the material on the albedo ones.**\n\n"
            "## The turn, as arithmetic (unchanged from row 36)\n\n```\n%s```\n"
            % (room, commit(), layout_table(rw),
               prov.get("how", "—"),
               rw.record["frame_provenance"],
               ("" if rw.record["frame_provenance"] != "measured" else
                " — the material record declares none, so the frame was proved "
                "off the painting itself: %s (`%s`)"
                % ((ev or {}).get("why", ""), (ev or {}).get("facing", ""))),
               rw.record["material"],
               ((", field `%s`" % rw.record["field_material"]
                 if rw.record.get("field_material") else "")
                + ("" if rw.record["frame_provenance"] != "measured" else
                   " — **and that name is wrong, which row 41 records rather "
                   "than fixes.** The material this room is bound to declares "
                   "no joinery; its own promoted paintings measurably carry a "
                   "chair rail and periodic panel joints. The binding lives in "
                   "`tools/room-voices.mjs` and belongs to the voice table and "
                   "to row 40's room-consistency work, not here; row 41 lays the "
                   "wall out as what its pixels are and says so.")),
               room,
               "\n".join(
                   "%-8s %-5s  this %s gap %.6f m   next %s gap %.6f m   "
                   "bar %.3f m   %s"
                   % (c["corner"], c["hand"], c["this_wall"],
                      c["boundary_gap_this_m"], c["next_wall"],
                      c["boundary_gap_next_m"], c["bar_one_stile_m"],
                      "PASS" if c["pass"] else "FAIL") for c in corners) + "\n",
               cross))

    doc_out = dict(rw.record, commit=commit(), frames=frames, seams=seams,
                   seams_row36=before, corners=corners, refused=refused)
    with open(os.path.join(out, "batch.json"), "w") as fh:
        json.dump(doc_out, fh, indent=2, default=float)
        fh.write("\n")
    print("batch -> %s" % os.path.relpath(out, ROOT))
    print("  %d frames, %d seams, %d row-36 seams, corners %s"
          % (len(frames), len(seams), len(before),
             "all PASS" if all(c["pass"] for c in corners) else "FAIL"))
    return 0 if all(c["pass"] for c in corners) and not refused else 1


if __name__ == "__main__":
    sys.exit(main())
