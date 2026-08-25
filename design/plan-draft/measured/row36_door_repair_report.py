"""The walls the door clause refuses: paint the void, read it back.

Run: python3 design/plan-draft/measured/row36_door_repair_report.py
     python3 .../row36_door_repair_report.py --out-dir <dir>

Per wall: what the plan rules, what the detector found BEFORE, what it finds
AFTER the void is composited, and whether the rect lands at the aperture.

WHERE THE REPAIRED FRAMES GO. By default beside the row's other evidence, in
`design/batches/row36-assembly/door-repair/`, because a human running this
wants the pictures where the batch keeps them. `--out-dir` moves them, and
`assembly.spec` passes a scratch directory: the suite ran this on every `npm
test` and rewrote six committed files each time, so a green run left the tree
dirty and the next `git checkout` failed.
"""
import json, os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "design", "plan-draft", "measured"))
os.chdir(ROOT)
import door_measure as dm

WALLS = ["great_hall/N", "great_hall/W", "library/S", "long_gallery/W", "privy_garden/W"]
fac = json.load(open("backdrops/textures/facings.json"))["facings"]
plan = json.load(open("fixtures/demo-study/plan.json"))
sweep = {r["facing"]: r for r in json.load(open("design/batches/row35-snap/sweep.json"))["rows"]}

OUT = os.path.join(ROOT, "design", "batches", "row36-assembly", "door-repair")
if "--out-dir" in sys.argv:
    OUT = os.path.abspath(sys.argv[sys.argv.index("--out-dir") + 1])
os.makedirs(OUT, exist_ok=True)

def read_doors(png, d, loc):
    imh = d["image_h_px"] or 1024
    storey = d["storey_height_m"] or dm.ruled_storey(plan, loc)
    return dm.measure_openings(png, d["corner_x0_px"], d["corner_x1_px"],
                               d["floor_line_y"] * imh, d["ppm"], storey)

rows = []
for key in WALLS:
    d = fac[key]["declared"]
    snapped = "backdrops/source-snapped/%s/snapped.png" % key.replace("/", "-")
    src = snapped if os.path.exists(snapped) else (sweep.get(key) or {}).get("candidate")
    if not src or not os.path.exists(src):
        rows.append((key, "NO CANDIDATE", "-", "-", "-", "-"))
        continue
    before, note_b = read_doors(src, d, key.split("/")[0])
    out = os.path.join(OUT, key.replace("/", "-") + ".png")
    p = subprocess.run(["python3", "design/plan-draft/measured/row36_assemble.py",
                        "--paint-doors", key, "--candidate", src, "--out-png", out,
                        "--json", out + ".json"],
                       capture_output=True, text=True, env=dict(os.environ, HOLO_TIMINGS="off"))
    if p.returncode != 0:
        rows.append((key, os.path.basename(src), len(before), "REFUSED",
                     p.stdout.strip().splitlines()[-1] if p.stdout else p.stderr[-90:], "-"))
        continue
    rec = json.load(open(out + ".json"))
    after, note_a = read_doors(out, d, key.split("/")[0])
    ruled = rec["doors_ruled"]
    # does the read-back rect land at the aperture the plan rules?
    ppm = d["ppm"]
    x0d = d["corner_x0_px"]
    hits = []
    for want in rec["painted"]:
        wx0 = x0d + want["u0_m"] * ppm
        wx1 = x0d + want["u1_m"] * ppm
        best = None
        for a in after:
            err = max(abs(a["x0_px"] - wx0), abs(a["x1_px"] - wx1))
            if best is None or err < best[0]:
                best = (err, a)
        hits.append(round(best[0], 1) if best else None)
    rows.append((key, os.path.basename(src), len(before), ruled, len(after), hits,
                 rec["separation_luma"]))

print("%-18s %-26s %6s %6s %6s %-16s %s" %
      ("wall", "candidate", "before", "ruled", "after", "edge err px", "sep luma"))
for r in rows:
    if len(r) == 6:
        print("%-18s %-26s %6s %6s %6s %s" % r)
    else:
        print("%-18s %-26s %6s %6s %6s %-16s %.1f" %
              (r[0], r[1][:26], r[2], r[3], r[4], str(r[5]), r[6]))
