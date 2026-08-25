/* [Row 36] ASSEMBLY FROM ESTABLISHED PIECES — the door void the assembler paints.
 *
 * A plain assembled wall has no way through it, and row 27's promotion clause
 * refuses a wall whose plan rules a doorway and whose painting shows none. The
 * assembler paints the void itself, from plan geometry, and the same arithmetic
 * repairs a PAINTED wall the door detector cannot read — five of which the
 * production loop is holding after repeated re-asks under the unlit-void rule.
 *
 * These cases check the claim where it could break, not where it is convenient:
 *
 *   the contract  the void must clear its wall by more than the detector's own
 *                 sweep step, or `door_measure` cannot produce three surviving
 *                 cuts however dark the frame looks to a human
 *   the lintel    a void with no head above it is FOUND and then THROWN AWAY —
 *                 `_head` walks up the void's columns while they stay dark, and
 *                 on a dark upper wall it walks past the storey. This is the
 *                 defect the build actually hit, so it gets a case.
 *   minimal touch a wall whose doorways the detector already reads is left
 *                 alone; a repair that redraws them is a second doorway
 *   the aperture  the rect the detector reads back is the rect the plan ruled,
 *                 which is row 27's question answered by construction
 */
import { test, expect, repoRoot } from "./helpers.mjs";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const TOOL = join(repoRoot, "design", "plan-draft", "measured", "row36_assemble.py");
const REPORT = join(repoRoot, "design", "plan-draft", "measured", "row36_door_repair_report.py");
const FACINGS = join(repoRoot, "backdrops", "textures", "facings.json");

function py(args, opts = {}) {
  return execFileSync("python3", args, {
    cwd: repoRoot, encoding: "utf8", stdio: "pipe",
    env: { ...process.env, HOLO_TIMINGS: "off" }, ...opts
  });
}

test.describe("row 36 — the door void", () => {
  test("the tool and the facing table it reads are both present", () => {
    expect(existsSync(TOOL)).toBe(true);
    expect(existsSync(FACINGS)).toBe(true);
    const f = JSON.parse(readFileSync(FACINGS, "utf8")).facings;
    expect(Object.keys(f).length, "every facing of the plan").toBe(88);
    /* the declared box is what an assembled facing is built at — a facing
       missing it cannot be assembled at all, so it is not optional */
    const enclosed = Object.entries(f).filter(([, r]) => r.facing_type !== "open");
    for (const [k, r] of enclosed) {
      expect(r.declared, `${k} carries its declared geometry`).toBeTruthy();
      expect(r.declared.ppm, `${k} declares a scale`).toBeGreaterThan(0);
    }
  });

  test("a repaired wall reads back the ways through its plan rules", () => {
    /* The five walls the loop is holding on the door clause. This runs the
       committed report rather than re-deriving it, so what the test asserts and
       what a reader can reproduce are the same command.
       INTO A SCRATCH DIRECTORY. The report writes a repaired frame per wall,
       and its default is the row's own batch folder — six committed files
       rewritten on every `npm test`, so a green suite left the tree dirty and
       the next checkout failed. The batch keeps the evidence; the suite keeps
       its own copy and throws it away. */
    const scratch = mkdtempSync(join(tmpdir(), "holo-door-repair-"));
    let out;
    try {
      out = py([REPORT, "--out-dir", scratch]);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    const lines = out.trim().split("\n").slice(1);
    expect(lines.length).toBeGreaterThanOrEqual(5);
    const seen = {};
    for (const line of lines) {
      const m = line.match(/^(\S+)\s+(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+\[(.*?)\]\s+([\d.]+)/);
      if (!m) continue;
      const [, wall, , before, ruled, after, errs, sep] = m;
      seen[wall] = { before: +before, ruled: +ruled, after: +after,
                     errs: errs.split(",").map(Number), sep: +sep };
    }
    for (const wall of ["great_hall/N", "great_hall/W", "library/S"]) {
      const r = seen[wall];
      expect(r, `${wall} is in the report`).toBeTruthy();
      expect(r.after, `${wall}: every ruled way through is read back`)
        .toBeGreaterThanOrEqual(r.ruled);
      expect(r.sep, `${wall}: the void clears its wall by the contract`)
        .toBeGreaterThanOrEqual(3);
      for (const e of r.errs) {
        expect(e, `${wall}: the read-back rect lands at the ruled aperture`)
          .toBeLessThan(30);
      }
    }
    /* All three read ZERO before and their plan rules more than zero — which is
       the refusal this repair exists to answer. */
    expect(seen["great_hall/N"].before).toBe(0);
    expect(seen["great_hall/W"].before).toBe(0);
    expect(seen["library/S"].before).toBe(0);
    /* AND THE FRAME THE REPAIR CANNOT ANSWER SAYS SO. `privy_garden/W` was in
       the list above until snap pass 2's rectified frame landed: that frame
       carries its own 1.55 m dark run at 2.00–3.55 m, overlapping the door the
       plan rules at 1.55–2.55 m but centred too far off it to count as already
       drawn. Painting the void merged the two into one 1.99 m reading whose
       right edge sat 67 px past the aperture — a repaired PNG claiming a
       doorway it had not made readable. Adding darkness cannot separate
       darkness, so the tool refuses by name and the wall stays held; row 27's
       `door.painted_width` would have caught the merged reading at the
       promotion, but a tool reporting success on a frame it has broken is the
       silent half of this row's contract. Pinned as the refusal it is, so a
       repair that ever does answer this frame shows up here rather than
       passing quietly. */
    expect(out, "privy_garden/W is refused, and the reason is the clash itself")
      .toMatch(/privy_garden\/W[^\n]*REFUSED[^\n]*already dark where the void goes/);
  });

  test("a wall whose doorways are already readable is left alone", () => {
    /* Minimal touch. The refusal is the pass here: nothing to add is not a
       failure, and a tool that painted anyway would trade one refusal for
       another by inventing doors. */
    const f = JSON.parse(readFileSync(FACINGS, "utf8")).facings;
    const promoted = Object.keys(f).filter((k) => {
      const [loc, fa] = k.split("/");
      return existsSync(join(repoRoot, "backdrops", loc, `${fa}.png`))
        && (f[k].carriers || []).includes("door");
    });
    expect(promoted.length, "the store holds promoted door-bearing walls").toBeGreaterThan(0);

    let leftAlone = 0;
    /* The probe frame is a by-product of asking the question, not evidence:
       it went into the row's committed batch folder and every `npm test` left
       it modified in the tree. It belongs in a scratch directory that dies
       with the case. */
    const scratch = mkdtempSync(join(tmpdir(), "holo-door-probe-"));
    try {
      for (const key of promoted.slice(0, 6)) {
        const [loc, fa] = key.split("/");
        try {
          py([TOOL, "--paint-doors", key,
              "--candidate", `backdrops/${loc}/${fa}.png`,
              "--out-png", join(scratch, "_probe.png")]);
        } catch (e) {
          const said = String(e.stdout || "") + String(e.stderr || "");
          if (/already reads all/.test(said)) leftAlone++;
        }
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    expect(leftAlone,
      "at least one promoted wall already shows its doorway and is not repainted")
      .toBeGreaterThan(0);
  });

  test("the void painter refuses a wall it cannot separate from", () => {
    /* The contract's own failure case: a wall too dark for a void to sit the
       required distance below it. Constructed rather than hoped for. */
    const script = `
import sys, os, numpy as np
sys.path.insert(0, ${JSON.stringify(join(repoRoot, "design", "plan-draft", "measured"))})
os.chdir(${JSON.stringify(repoRoot)})
import row36_assemble as A, row35_snap as S
b = S.box(200, 1300, 200, 900, 768, 620)
black = np.zeros((S.H, S.W, 3))
out, rec = A.paint_voids(black, b, 6.0, 2.8, [(1.0, 2.0)])
print("REFUSED" if rec.get("refused") else "ADMITTED", rec.get("refused", ""))
`;
    const said = py(["-c", script]);
    expect(said, "a wall with no room beneath it for a void is refused, with its number")
      .toMatch(/REFUSED/);
    expect(said).toMatch(/luma/);
  });

  /* ---- the turn, which is the row's own claim ---------------------- */
  test("four facings of one room put every surface in the same place", () => {
    const out = py([join(repoRoot, "design", "plan-draft", "measured",
                         "row36_crossfacing.py"), "--room", "kitchen"]);
    /* floors and ceilings are anchored to the storey SLAB, so all four
       facings' samples must lie inside the room's own rect -- exactly, not
       nearly. A frame-anchored texture fails this on the first turn. */
    const outside = [...out.matchAll(/outside the room by ([\d.]+) m/g)]
      .map((m) => Number(m[1]));
    expect(outside.length, "floor and ceiling both reported").toBeGreaterThanOrEqual(2);
    for (const v of outside) expect(v).toBe(0);

    /* and every side return must land on its neighbour's own perimeter range:
       a return IS that wall, seen from ninety degrees away */
    const pairs = [...out.matchAll(/overlap ([\d.]+) m/g)].map((m) => Number(m[1]));
    expect(pairs.length, "all eight return/wall pairs").toBe(8);
    for (const v of pairs) expect(v, "the return overlaps the wall it is").toBeGreaterThan(0);
  });

  test("the lighting stub's key is a compass direction, not a frame ramp", () => {
    /* THE BUG THIS CATCHES ACTUALLY SHIPPED IN A DRAFT. The key was
       `(1 - x/W)` -- brightest at the left of every FRAME -- so the right edge
       of one facing met the left edge of the next dark-against-bright, and the
       same physical wall changed brightness when the camera turned. That is the
       row's own disease reintroduced by the lighting after the geometry had
       been cured of it. The source falloff had the same defect a layer down,
       addressing hearths in wall-local metres.

       So: the same PLAN point, sampled from two different facings, must get the
       same light. */
    const script = `
import json, os, sys
import numpy as np
sys.path.insert(0, ${JSON.stringify(join(repoRoot, "design", "plan-draft", "measured"))})
os.chdir(${JSON.stringify(repoRoot)})
import row35_snap as S, row36_assemble as A, row36_light as Lg
plan = json.load(open(A.PLAN)); fac = json.load(open(A.FACINGS))["facings"]
room = next(r for r in plan["rooms"] if r["id"] == "kitchen")
rect = room["rect"]
span = max(rect["x1"]-rect["x0"], rect["y1"]-rect["y0"])
cx, cy = 0.5*(rect["x0"]+rect["x1"]), 0.5*(rect["y0"]+rect["y1"])
F = {}
for f in "NESW":
    d = fac["kitchen/"+f]["declared"]
    ppm, imh, storey = d["ppm"], d["image_h_px"], d["storey_height_m"]
    yf = d["floor_line_y"]*imh; vy = d["horizon_y"]*imh; yc = yf - storey*ppm
    b = S.box(d["corner_x0_px"], d["corner_x1_px"], yc, yf, S.W/2.0, vy)
    width_m = (d["corner_x1_px"]-d["corner_x0_px"])/ppm
    decl = {"width_m": width_m, "storey_m": storey, "camera_m": d["camera_wall_m"]}
    ys, xs = np.mgrid[0:S.H:6, 0:S.W:6].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    X, Y = Lg.plan_positions(idx, p, q, decl, room, f)
    t = (Lg.KEY_DIR_PLAN[0]*(X-cx) + Lg.KEY_DIR_PLAN[1]*(Y-cy))/span
    key = Lg.AMBIENT + Lg.KEY_RAMP*np.clip(0.5+t, 0.0, 1.0)
    fl = idx == S.REGIONS.index("floor")
    F[f] = (X[fl], Y[fl], key[fl])
worst = 0.0
for a, b_ in (("N","E"),("E","S"),("S","W"),("W","N")):
    xa, ya, va = F[a]; xb, yb, vb = F[b_]
    if not len(xa) or not len(xb): continue
    sel = np.random.default_rng(36).choice(len(xa), size=min(300,len(xa)), replace=False)
    for i in sel:
        dd = (xb-xa[i])**2 + (yb-ya[i])**2
        j = int(np.argmin(dd))
        if dd[j] > 0.02**2: continue
        worst = max(worst, abs(va[i]-vb[j]))
print("WORST %.8f" % worst)
# and the sources are addressed in plan metres, not wall-local ones
srcs = Lg.sources_for(plan, "kitchen")
print("SRCKEYS " + ",".join(sorted(srcs[0].keys())) if srcs else "SRCKEYS none")
`;
    const said = py(["-c", script]);
    const worst = Number((said.match(/WORST ([\d.]+)/) || [])[1]);
    expect(Number.isFinite(worst), "the check ran").toBe(true);
    expect(worst, "the same plan point gets the same key from any facing")
      .toBeLessThan(0.01);
    expect(said, "a source is at a place in the building, not along a wall")
      .toMatch(/SRCKEYS.*x_m/);
    expect(said).not.toMatch(/SRCKEYS[^\n]*u_m/);
  });
});
