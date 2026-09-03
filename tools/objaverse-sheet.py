#!/usr/bin/env python3
"""Every catalogued version of a noun in Objaverse (LVIS-annotated subset), as a
contact sheet of the objects' own thumbnails — to see how a noun varies before
any download. Timed per stage (Kabe: track request to implementation).

  venv/bin/python3 tools/objaverse-sheet.py --nouns telephone lamp camera --per 36 --out lab/gallery/
"""
import argparse
import io
import json
import os
import random
import time
import urllib.request

import objaverse
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nouns", nargs="+", required=True)
    ap.add_argument("--per", type=int, default=36)
    ap.add_argument("--out", default=os.path.join(ROOT, "lab", "gallery"))
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    random.seed(a.seed)
    t = {"start": time.time()}
    lvis = objaverse.load_lvis_annotations()
    t["index"] = time.time()
    report = {}
    for noun in a.nouns:
        t0 = time.time()
        uids = lvis.get(noun, [])
        pick = uids if len(uids) <= a.per else random.sample(uids, a.per)
        ann = objaverse.load_annotations(pick)
        t1 = time.time()
        tiles = []
        for uid in pick:
            m = ann.get(uid, {})
            url = None
            imgs = (m.get("thumbnails") or {}).get("images") or []
            if imgs:
                imgs = sorted(imgs, key=lambda i: abs((i.get("width") or 0) - 256))
                url = imgs[0].get("url")
            try:
                im = Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=20).read())).convert("RGB") if url else None
            except Exception:
                im = None
            if im is None:
                im = Image.new("RGB", (256, 256), (50, 45, 40))
            im = im.resize((256, 256))
            d = ImageDraw.Draw(im); d.rectangle([0, 220, 256, 256], fill=(20, 17, 14))
            lic = (m.get("license") or "?").replace("by-", "BY-").upper()[:12]
            d.text((5, 224), (m.get("name") or uid)[:34], fill=(236, 228, 210))
            d.text((5, 240), f"{lic}  {uid[:8]}", fill=(168, 158, 136))
            tiles.append(im)
        cols = 6; rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 256, rows * 256 + 40), (20, 17, 14))
        ImageDraw.Draw(sheet).text((8, 12), f"{noun}: {len(pick)} of {len(uids)} catalogued in Objaverse-LVIS  ·  thumbnails are the uploaders' own renders", fill=(201, 169, 97))
        for i, im in enumerate(tiles):
            sheet.paste(im, ((i % cols) * 256, 40 + (i // cols) * 256))
        out = os.path.join(a.out, f"{noun}.png"); sheet.save(out)
        t2 = time.time()
        report[noun] = {"catalogued": len(uids), "shown": len(pick), "s_annotations": round(t1 - t0, 1), "s_thumbnails": round(t2 - t1, 1), "sheet": os.path.relpath(out, ROOT),
                        "uids": pick, "licenses": sorted(set((ann.get(u, {}).get("license") or "?") for u in pick))}
        print(noun, report[noun]["catalogued"], "catalogued", f"{t2 - t0:.0f}s", flush=True)
    report["_timing"] = {"s_index": round(t["index"] - t["start"], 1), "s_total": round(time.time() - t["start"], 1)}
    json.dump(report, open(os.path.join(a.out, "report.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
