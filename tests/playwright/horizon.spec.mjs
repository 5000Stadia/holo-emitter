/* Row 32 — the horizon instrument, and what it refuses.
 *
 * The production run held 58 of 85 manor walls and 32 of those holds said "no
 * corners": the ceiling-ramp horizon needs two ceiling-line corners and
 * `find_corners_cand2` was built on the study's plaster ceilings. This file
 * guards the four mechanisms that replaced that failure, and it guards them
 * where they can actually go wrong:
 *
 *   1. THE CORNER RULE STILL READS THE CASE IT WAS EXTENDED FROM. If a new
 *      rule that reads boarded ceilings has moved the plaster controls, it has
 *      broken the thing it was extending, and the whole holdout is void.
 *   2. THE THREE ADMISSIBILITY TESTS EACH REFUSE THEIR OWN CONSTRUCTION.
 *      Deleting any one of them admits a horizon the picture never fixed, and
 *      the degenerate case is not hypothetical: seven manor frames fit two
 *      flat "ramps" that cross one row below the ceiling with a residual of
 *      exactly zero.
 *   3. THE HORIZON BRACKET IS THE STANDING BAND PROPAGATED, not a number
 *      anyone picked — the same construction the floor, rail and ceiling
 *      brackets already carry, applied to the one row that never had one.
 *   4. THE CORRECTION REACHES THE GENERATOR. Production law clause 6: a fix
 *      lands in the emitter or it is still an open miss. A correction that
 *      names interior fabric is redacted on outdoor walls, so a sentence that
 *      cannot survive `carryableOutdoors` is a fix that does not travel.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { repoRoot } from "./helpers.mjs";
import { manorPrompt, scaffoldRects } from "../../tools/make-scaffold.mjs";
import { deriveMeta } from "../../tools/plan-projection.mjs";
import { carryableOutdoors } from "../../tools/room-voices.mjs";
import { MEASURED_BAND } from "../../tools/validate-fixtures.mjs";

const MEASURED = join(repoRoot, "design", "plan-draft", "measured");
const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));

function python(args) {
  try {
    return execFileSync("python3", args, { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    throw new Error(`python3 ${args.join(" ")} failed:\n${e.stdout || ""}${e.stderr || ""}`);
  }
}

/** Run a snippet against the measured/ modules and return its stdout. */
function inMeasured(src) {
  return python(["-c", `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)})\n${src}`]);
}

test.describe("row 32 — the horizon instrument", () => {
  test.describe.configure({ timeout: 180_000 });

  /* ------------------------------------------------------------------ 1 */
  /* The study controls are the only corners in the corpus that are not another
   * detector's opinion: committed, and confirmed by the two walls' own
   * symmetry. The row-32 rule predicts them without being told them. The bound
   * is the measured worst case with nothing to spare beyond a pixel of slack —
   * a rule that drifts past it is a different rule and has to say so. */
  test("the row-32 corner rule still reads the plaster controls it was extended from", () => {
    const out = python([join(MEASURED, "row32_holdout.py"), "--controls"]);
    const m = out.match(/worst control error:\s*(\d+)\s*px/);
    expect(m, `the holdout printed no control error:\n${out}`).toBeTruthy();
    expect(Number(m[1]),
      `the row-32 corner rule has moved the committed study corners:\n${out}`)
      .toBeLessThanOrEqual(24);
    /* And it is genuinely reading all four, not printing a header. */
    for (const fac of ["study/N", "study/E", "study/S", "study/W"]) {
      expect(out, `${fac} is missing from the control table`).toContain(fac);
    }
  });

  /* ------------------------------------------------------------------ 2 */
  /* Each guard, handed the construction it exists to refuse. These are the
   * delete-green cases: remove any one clause from `_admissible` and the line
   * below turns from a refusal into an admission. */
  test("each admissibility test refuses its own construction", () => {
    const out = inMeasured(`
import row23_lib as R
CEIL, FLOOR, BRACKET = 120, 700, 15.0
good = dict(x=768.0, y=520.0, sigma_y_px=1.0)
cases = [
    ("good", good),
    ("blurred", dict(good, sigma_y_px=BRACKET + 0.01)),
    ("off-frame", dict(good, x=-40.0)),
    ("off-frame-right", dict(good, x=1600.0)),
    ("above the ceiling", dict(good, y=float(CEIL) - 1)),
    ("below the floor", dict(good, y=float(FLOOR) + 1)),
    ("degenerate flat pair", dict(x=9000.0, y=float(CEIL) + 1, sigma_y_px=0.0)),
    ("no ramp", None),
]
for name, r in cases:
    ok, why = R._admissible(r, CEIL, FLOOR, BRACKET)
    print("%s|%s" % (name, "ADMIT" if ok else "REFUSE"))
`);
    const got = Object.fromEntries(out.trim().split("\n").map((l) => l.split("|")));
    expect(got["good"], "a clean fit inside every bound must be admitted").toBe("ADMIT");
    for (const bad of ["blurred", "off-frame", "off-frame-right", "above the ceiling",
      "below the floor", "degenerate flat pair", "no ramp"]) {
      expect(got[bad], `_admissible admitted the ${bad} case`).toBe("REFUSE");
    }
  });

  /* An admitted horizon whose eye leaves EYE_RANGE by MORE than the reading's
   * own error bar is the painting disagreeing with its ruler; by LESS is a
   * reading that has not decided. Both are holds, and they are different
   * holds — which is the whole separation row 32 asks for. Neither widens a
   * band: `EYE_RANGE` is measure.py's and is read, never copied. */
  test("the suspect family is separated by the error bar and not by a wider band", () => {
    const out = inMeasured(`
import measure, row23_lib as R
print("EYE|%s|%s" % measure.EYE_RANGE)
src = open(${JSON.stringify(join(MEASURED, "row23_lib.py"))}).read()
print("COPY|%s" % ("EYE_RANGE = (" in src or "EYE_RANGE=(" in src))
`);
    const lines = Object.fromEntries(out.trim().split("\n").map((l) => {
      const p = l.split("|"); return [p[0], p.slice(1)];
    }));
    expect(lines["EYE"], "EYE_RANGE moved").toEqual(["0.8", "2.2"]);
    expect(lines["COPY"][0],
      "row23_lib has taken a second copy of EYE_RANGE, which is how a band moves quietly")
      .toBe("False");
  });

  /* ------------------------------------------------------------------ 3 */
  /* The horizon bracket, recomputed here from the band and the wall's own
   * declared geometry alone. If `cfg_from_sidecar` ever types a number instead
   * of propagating one, these disagree. */
  test("the horizon bracket is the standing band propagated, not a number someone picked", () => {
    const out = inMeasured(`
import json, os, row23_lib
MAN = json.load(open(${JSON.stringify(join(repoRoot, "design", "batches", "row23-scaffold", "manor", "manifest.json"))}))
for e in MAN["entries"]:
    if e.get("skipped") or e["key"] not in ("great_hall/N", "library/E", "solar/W"):
        continue
    side = {"facing": e["key"], "brackets": e["brackets"], "stamped": e["stamped"],
            "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                          "camera_wall_m": e.get("camera_wall_m"), "image_h_px": 1024,
                          "floor_line_y": e["floor_line_y"], "horizon_y": e["horizon_y"],
                          "corner_x0_px": e.get("corner_x0_px"),
                          "corner_x1_px": e.get("corner_x1_px")}}
    cfg = row23_lib.cfg_from_sidecar(side)
    print("%s|%.6f|%.6f|%.6f|%.6f" % (e["key"], cfg["horizon_bracket_px"],
                                      e["brackets"]["band"], e["floor_line_y"], e["horizon_y"]))
`);
    const rows = out.trim().split("\n").map((l) => l.split("|"));
    expect(rows.length, "no manifest entry was read").toBeGreaterThan(0);
    for (const [key, bracket, band, floorY, horizonY] of rows) {
      expect(Number(band), `${key}: the round brought its own band`).toBe(MEASURED_BAND);
      const sep = (Number(floorY) - Number(horizonY)) * 1024;
      expect(Number(bracket),
        `${key}: the horizon bracket is not the band propagated through the declared separation`)
        .toBeCloseTo(MEASURED_BAND * sep, 4);
    }
  });

  /* ------------------------------------------------------------------ 4 */
  /* Clause 6, as a check rather than as a promise: the eye-line row reaches
   * the generator on EVERY wall, not only on a re-ask, and it is the row this
   * wall's own meta declares. */
  test("every manor prompt states the row the returns must converge on", () => {
    for (const key of ["great_hall/N", "privy_garden/N", "kitchen/S"]) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const text = manorPrompt(PLAN, key, meta, rects);
      const row = Math.round(meta.horizon_y * meta.image_h_px);
      expect(text, `${key}'s prompt never says where the returns converge`)
        .toContain(`meet each other at row ${row}`);
    }
  });

  /* A correction that cannot be carried onto a garden wall is a fix that does
   * not travel — `manorPrompt` redacts it and the roll is spent on "follow the
   * words below". Both row-32 sentences are checked against the same clause
   * the emitter applies. */
  test("both row-32 corrections survive an outdoor wall whole", () => {
    const out = inMeasured(`
import row23_run as R
reading = {"_promotion": {"ramp": {"y": 615.8}, "eye_height_m": 0.485}}
entry = {"horizon_y": 0.51376953125}
for fam in ("suspect-painting", "unfitted-horizon", "something-else"):
    s = R._correction_for(fam, "why", reading, entry)
    print("%s@@%s" % (fam, s))
`);
    const said = {};
    for (const line of out.trim().split("\n")) {
      const i = line.indexOf("@@");
      if (i > 0) said[line.slice(0, i)] = line.slice(i + 2);
    }
    expect(said["something-else"],
      "a refusal row 32 does not answer must not manufacture a correction").toBe("None");
    for (const fam of ["suspect-painting", "unfitted-horizon"]) {
      const s = said[fam];
      expect(s, `${fam} produced no correction`).toBeTruthy();
      expect(carryableOutdoors(s),
        `${fam}'s correction names interior fabric, so an outdoor wall gets it redacted: ${s}`)
        .toBe(true);
      expect(s, `${fam}'s correction never names the row to converge on`).toContain("row 526");
    }
  });
});
