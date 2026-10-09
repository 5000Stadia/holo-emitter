"""The fps lab's side-by-sides: shots of lab/fps/shots/*.png set next to each other (optionally a crop of each, scaled up),
labelled, as one JPEG for the ledger; and how far each differs from the first, in numbers: the mean absolute difference
over the picture (0-255 levels) and the share of pixels off by more than 3 levels or by more than 12.
Writes lab/fps/shots/<name>.jpg and adds the numbers to lab/fps/shots/compare.json.
Usage: python3 tools/fps-compare.py <name> "<label>=<shot>[,<label>=<shot>...]" [crop x,y,w,h] [scale]
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont

D = Path(__file__).resolve().parent.parent / "lab" / "fps" / "shots"
name, items = sys.argv[1], [s.split("=", 1) for s in sys.argv[2].split(",")]
crop = tuple(int(v) for v in sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] != "-" else None
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
imgs = [Image.open(D / f"{shot}.png").convert("RGB") for _, shot in items]
stats = []
for (label, shot), im in zip(items, imgs):
    d = ImageChops.difference(imgs[0], im).convert("L")
    h = d.histogram(); n = sum(h)
    stats.append({"label": label, "shot": shot, "mean_abs": round(sum(i * c for i, c in enumerate(h)) / n, 2),
                  "over3": round(sum(h[4:]) / n, 4), "over12": round(sum(h[13:]) / n, 4)})
tiles = []
for im in imgs:
    if crop: im = im.crop((crop[0], crop[1], crop[0] + crop[2], crop[1] + crop[3]))
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.NEAREST)
    tiles.append(im)
gap, band = 8, 30
W = sum(t.width for t in tiles) + gap * (len(tiles) - 1); H = max(t.height for t in tiles) + band
out = Image.new("RGB", (W, H), (20, 18, 15)); dr = ImageDraw.Draw(out)
try: font = ImageFont.truetype("DejaVuSans.ttf", 18)
except OSError: font = ImageFont.load_default()
x = 0
for (label, _), t in zip(items, tiles):
    out.paste(t, (x, band)); dr.text((x + 6, 5), label, fill=(236, 228, 210), font=font); x += t.width + gap
if out.width > 2400: out = out.resize((2400, round(out.height * 2400 / out.width)), Image.LANCZOS)
out.save(D / f"{name}.jpg", quality=86)
cf = D / "compare.json"; allc = json.loads(cf.read_text()) if cf.exists() else {}
allc[name] = {"crop": crop, "scale": scale, "vs_first": stats}; cf.write_text(json.dumps(allc, indent=1))
print(name, json.dumps(stats))
