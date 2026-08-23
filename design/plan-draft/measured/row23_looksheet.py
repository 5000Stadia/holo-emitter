#!/usr/bin/env python3
"""Row 23 — the look surface.

    python3 design/plan-draft/measured/row23_looksheet.py

WHY A PICTURE EXISTS AT ALL IN A ROW MADE OF NUMBERS. Every column in
`row23_report.py` is geometry, and geometry cannot see the thing this row is
most at risk of producing: a room that obeys its scaffold and reads as a
diagram. `design/specs/23-plan.md` §9 (CP-23B) puts that question where it
belongs — in front of Kabe — and this is what it puts there.

ONE SHEET, NOT A GALLERY. Twenty-four frames at 1536x1024 is forty megabytes and
a scrolling directory; a contact sheet is one image, opens in one click, and
puts every cell of the matrix beside the reference it is answering to. The
full-size frames stay where they are and the sheet names their paths, so
anything worth looking at closely can be opened directly.

WHAT THE LABELS SAY AND WHAT THEY DELIBERATELY DO NOT. Each tile carries its
wall, its technique, its camera verdict and its carrier lean — the measured
facts. None of them carries a judgement, and the sheet declares no winner,
because §5.5 deletes the crown clause and the recommendation is a labelled human
judgement made on this sheet plus the table.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
READINGS = os.path.join(HERE, "row23")
OUT = os.path.join(ROOT, "design", "batches", "row23-scaffold", "look-sheet.png")

COLS = 5
TW, TH = 384, 256                      # a quarter of the frame, exactly
PAD, LABEL = 10, 34


def main():
    from PIL import Image, ImageDraw, ImageFont
    if not os.path.isdir(READINGS):
        print("row23: nothing measured yet")
        return 1
    amap = {}
    for name in ("assignment.json", "assignment-2.json"):
        p = os.path.join(READINGS, name)
        if os.path.exists(p):
            a = json.load(open(p))
            for r in a.get("rolls", []) + a.get("lens", []):
                amap[r["id"]] = r

    tiles = []
    # The references first: what every cell is answering to, and the two are
    # NOT the same kind of ground truth — study/N's is Kabe-ruled, study/E's is
    # an admitted candidate. The sheet says so rather than letting them read as
    # equals.
    tiles.append(("backdrops/source/study-N/cand-5-reference.png",
                  "REFERENCE study/N", "the Kabe-ruled camera", ""))
    tiles.append(("backdrops/source/study-E/cand-6.png",
                  "REFERENCE study/E", "ADMITTED, not ruled", ""))
    for f in sorted(os.listdir(READINGS)):
        if not f.endswith(".json") or f.startswith("assignment"):
            continue
        d = json.load(open(os.path.join(READINGS, f)))
        cell = amap.get(d["id"], {})
        car = (d.get("carriers") or [{}])[0] or {}
        h = car.get("hypothesis") or {}
        lean = h.get("leans")
        tiles.append((d["candidate"],
                      "%s %s%s" % (cell.get("wall", "?"), cell.get("technique", "?"),
                                   ("/" + cell["variant"]) if cell.get("variant") else ""),
                      "%s   lean %s" % (d.get("verdict", "?"), lean or "-"),
                      d["id"]))

    rows = (len(tiles) + COLS - 1) // COLS
    W = COLS * (TW + PAD) + PAD
    H = rows * (TH + LABEL + PAD) + PAD + 64
    sheet = Image.new("RGB", (W, H), (16, 18, 22))
    dr = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default(size=15)
        big = ImageFont.load_default(size=22)
    except TypeError:
        font = big = ImageFont.load_default()

    dr.text((PAD, 16), "ROW 23 - THE TECHNIQUE MATRIX, EVERY RETURNED FRAME",
            fill=(235, 240, 248), font=big)
    dr.text((PAD, 42),
            "No winner is marked. The labels are measured facts; the judgement is not made here.",
            fill=(160, 180, 200), font=font)

    for i, (rel, title, sub, rid) in enumerate(tiles):
        cx = PAD + (i % COLS) * (TW + PAD)
        cy = 64 + PAD + (i // COLS) * (TH + LABEL + PAD)
        p = os.path.join(ROOT, rel)
        if os.path.exists(p):
            im = Image.open(p).convert("RGB").resize((TW, TH), Image.LANCZOS)
            sheet.paste(im, (cx, cy))
        else:
            dr.rectangle([cx, cy, cx + TW, cy + TH], outline=(70, 80, 95))
            dr.text((cx + 12, cy + TH // 2), "not on disk", fill=(140, 150, 165), font=font)
        col = (235, 240, 248) if title.startswith("REFERENCE") else (200, 214, 228)
        dr.text((cx + 2, cy + TH + 4), title, fill=col, font=font)
        dr.text((cx + 2, cy + TH + 19), sub + ("   " + rid if rid else ""),
                fill=(150, 168, 188), font=font)

    sheet.save(OUT)
    print("look sheet: %s  (%d tiles)" % (os.path.relpath(OUT, ROOT), len(tiles)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
