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

  /* THE HOLDOUT'S GROUND TRUTH IS PINNED TO A COMMIT, and it has to be: the
     sweep rewrites every reading under `manor/` each pass, so an "old" column
     read off disk becomes a copy of the new one the first time the new
     instrument runs. It was caught doing exactly that — three newly promoted
     walls reported 0/0 and pulled the corner median from 23 px to 10, which is
     a holdout that has turned into a self-comparison. */
  test("the holdout's old answer is read from a commit, not from the working tree", () => {
    const src = readFileSync(join(MEASURED, "row32_holdout.py"), "utf8");
    const m = src.match(/^BEFORE_ROW32\s*=\s*"([0-9a-f]{7,40})"/m);
    expect(m, "row32_holdout.py pins no commit for its ground truth").toBeTruthy();
    const subject = execFileSync("git", ["-C", repoRoot, "log", "-1", "--format=%s", m[1]],
      { encoding: "utf8" }).trim();
    expect(subject, `${m[1]} is not the commit that allocated row 32`)
      .toMatch(/Row 32 allocated/);
    /* And set B genuinely goes through git rather than through the directory
       the sweep writes into. */
    expect(src, "the holdout reads the manor readings off disk, which the sweep overwrites")
      .not.toMatch(/listdir\(os\.path\.join\(HERE, "manor"\)\)/);
    expect(src, "the holdout never reads its ground truth out of git")
      .toMatch(/"git", "-C", ROOT, "show"/);
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
      /* [row 34] THE ROW IS CHECKED, NOT THE SENTENCE. Row 32 earned this clause
       * with the words "the left and right returns run back to meet each other
       * at row N"; row 34's fold replaced that whole section with the register
       * three generations recommended, which states the same row as "Carried on,
       * all four of those meet at column X, row N" — and on an OPEN facing, which
       * has no returns to converge, as "Lines running away from you converge at
       * column X, row N". The clause is that the eye-line row reaches the
       * generator on every wall; the phrasing was never the clause. */
      expect(text, `${key}'s prompt never says where the returns converge`)
        .toMatch(new RegExp(`(meet|converge)[^.]*\\brow ${row}\\b`));
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

/* Row 29(a) — the OTHER horizon instrument, the one an outdoor frame has.
 *
 * Four facings of the manor are typed `open`: `entrance_court/S` and
 * `entrance_approach/E|S|W`. They have no wall plane, no ceiling and no side
 * walls, so the row-20 ramp above has nothing to be fitted to, and until this
 * row they could not be measured at all — `measure_candidate` multiplied its
 * scale by `camera_wall_m`, which an open facing does not carry, and all
 * sixteen of their candidates died in the sweep's per-candidate guard as
 * MEASURE-ERR. Read as sixteen unpaintable frames, that spent four walls'
 * entire retry caps on a `TypeError` in our own arithmetic.
 *
 * What replaced it is the ruler the emitter already DECLARED for these walls —
 * `room-voices.mjs`'s `outdoors_open`: "What closes it and gives the gate its
 * ruler is the low coursed-stone boundary wall that fences a forecourt of this
 * date, its coping at the ruled height." Two lines the scaffold brackets: the
 * far-line ground row and the coping 0.95 m above it. On the pinhole those fix
 * the LENS and leave the eye and the horizon in one equation with two unknowns,
 * so an open frame's horizon is the camera's own declared eye line and the
 * picture's answer to it is the ground row, gated at the standing ±8 %.
 *
 * These four cases guard that where it can go wrong: the anchor resolves for
 * every facing the plan holds, a facing with neither anchor withholds rather
 * than crashes, an open frame is read by the far-line ruler and not by the
 * ramp, and the record it produces can be said on a garden wall.
 */
test.describe("row 29(a) — the far-line ruler, an open facing's instrument", () => {
  test.describe.configure({ timeout: 180_000 });

  const OPEN = ["entrance_court/S", "entrance_approach/E",
    "entrance_approach/S", "entrance_approach/W"];

  /* ------------------------------------------------------------------ 1 */
  /* The typed anchor, over the whole shipped plan. `camera_wall_m` and
     `camera_far_m` are two field names for one meaning and the name is the
     mechanism (row 11); what this asserts is that the resolver reads BOTH and
     that no facing the manor holds reaches the instrument without one. A
     regression here is either a silent default coming back or a facing losing
     its distance, and the second is what the four open walls actually did. */
  test("every facing the plan holds resolves a depth anchor, under the name its type gives it", () => {
    const out = inMeasured(`
import row23_run, row23_lib
plan = row23_run.json.load(open(row23_run.PLAN))
for room in plan["rooms"]:
    for f in room.get("facings", {}):
        key = "%s/%s" % (room["id"], f)
        fac = row23_run.facing_of(key)
        d, field = row23_lib.camera_distance(
            {"camera_wall_m": fac.get("camera_wall_m"),
             "camera_far_m": fac.get("camera_far_m")})
        print("%s|%s|%s|%s" % (key, fac.get("type"), d, field))
`);
    const rows = out.trim().split("\n").map((l) => l.split("|"));
    expect(rows.length, "no facing was read at all").toBe(88);
    const opens = [];
    for (const [key, type, dist, field] of rows) {
      expect(Number(dist),
        `${key} (${type}) reaches the instrument with no distance for its scale to be quoted at`)
        .toBeGreaterThan(0);
      expect(field, `${key} is typed ${type} and its anchor came from ${field}`)
        .toBe(type === "open" ? "camera_far_m" : "camera_wall_m");
      if (type === "open") opens.push(key);
    }
    expect(opens.sort(), "the plan's open facings are not the four this row is about")
      .toEqual([...OPEN].sort());
  });

  /* ------------------------------------------------------------------ 2 */
  /* A facing naming NEITHER anchor is the case the crash was: it must come
     back as this round's own `measurement_withheld`, in a sentence naming both
     fields, off a real frame — so what is exercised is the whole path from
     `cfg_from_sidecar` through `measure_candidate`, not the helper alone. */
  test("a facing with no depth anchor withholds and says so, where it used to raise TypeError", () => {
    const out = inMeasured(`
import json, row23_lib, row23_run
from measure import (pick_floor, module_in_bands, pick_ceiling,
                     find_corners_recession, ceiling_ramp_vp, horizon_votes,
                     light, EYE_RANGE)
picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
             pick_ceiling=pick_ceiling,
             find_corners_recession=find_corners_recession,
             ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
             light=light, EYE_RANGE=EYE_RANGE)
MAN = json.load(open(${JSON.stringify(join(repoRoot, "design", "batches", "row23-scaffold", "manor", "manifest.json"))}))
e = [x for x in MAN["entries"] if x["key"] == "entrance_approach/E"][0]
cand = ${JSON.stringify(join(repoRoot, "backdrops", "source"))} + "/entrance_approach-E/row23-e0de241b.png"
def side(wall, far):
    return {"facing": e["key"], "brackets": e["brackets"], "stamped": e["stamped"],
            "candidate": "x",
            "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                          "camera_wall_m": wall, "camera_far_m": far,
                          "image_h_px": 1024, "floor_line_y": e["floor_line_y"],
                          "horizon_y": e["horizon_y"], "wall_width_m": e["wall_width_m"],
                          "corner_x0_px": None, "corner_x1_px": None,
                          "facing_type": "open"}}
ref = dict(focal_px=e["implied_focal_px"], eye_m=1.183,
           horizon_y_px=1024 * 0.51377, band=0.08)
for name, wall, far in (("neither", None, None), ("far", None, 24.0)):
    s = side(wall, far)
    d = row23_lib.measure_candidate(cand, s, row23_lib.cfg_from_sidecar(s), ref, picks)
    print("%s|%s|%s|%s" % (name, d.get("verdict"), d.get("kind"),
                           (d.get("blocked_on") or "").replace("\\n", " ")))
`);
    const rows = Object.fromEntries(out.trim().split("\n").map((l) => {
      const p = l.split("|"); return [p[0], p.slice(1)];
    }));
    expect(rows["neither"][0], "a facing with no depth anchor was not withheld").toBe("WITHHELD");
    expect(rows["neither"][1]).toBe("measurement_withheld");
    expect(rows["neither"][2], "the withheld sentence names neither field")
      .toMatch(/camera_wall_m/);
    expect(rows["neither"][2]).toMatch(/camera_far_m/);
    expect(rows["far"][0], "the same frame with a FAR anchor must measure")
      .not.toBe("WITHHELD");
  });

  /* ------------------------------------------------------------------ 3 */
  /* The instrument itself, on the four walls' own promoted frames. Three
     things at once, and each of them is a way the vista path could quietly
     become the walled one: the ramp instrument is not run, the ruler's own
     arithmetic is the scale the gate admitted, and none of the three fields a
     vista must not claim is claimed. */
  test("an open facing is read by the far-line ruler, and the ceiling ramp is not run on it", () => {
    const out = inMeasured(`
import json, os, row23_lib, row23_run
from measure import (pick_floor, module_in_bands, pick_ceiling,
                     find_corners_recession, ceiling_ramp_vp, horizon_votes,
                     light, EYE_RANGE)
picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
             pick_ceiling=pick_ceiling,
             find_corners_recession=find_corners_recession,
             ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
             light=light, EYE_RANGE=EYE_RANGE)
ROOT = ${JSON.stringify(repoRoot)}
MAN = json.load(open(os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor", "manifest.json")))
for loc, f in (("entrance_approach", "E"), ("entrance_approach", "S"),
               ("entrance_approach", "W")):
    key = "%s/%s" % (loc, f)
    meta = json.load(open(os.path.join(ROOT, "backdrops", loc, f + ".meta.json")))
    cand = meta["camera_id"].replace("measured:", "")
    e = [x for x in MAN["entries"] if x["key"] == key][0]
    fac = row23_run.facing_of(key)
    s = {"facing": key, "brackets": e["brackets"], "stamped": e["stamped"],
         "candidate": cand,
         "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                       "camera_wall_m": fac.get("camera_wall_m"),
                       "camera_far_m": fac.get("camera_far_m"),
                       "image_h_px": 1024, "floor_line_y": e["floor_line_y"],
                       "horizon_y": e["horizon_y"], "wall_width_m": e["wall_width_m"],
                       "corner_x0_px": None, "corner_x1_px": None,
                       "facing_type": fac.get("type")}}
    ref = dict(focal_px=e["implied_focal_px"], eye_m=1.183,
               horizon_y_px=1024 * 0.51377, band=0.08)
    d = row23_lib.measure_candidate(os.path.join(ROOT, cand), s,
                                    row23_lib.cfg_from_sidecar(s), ref, picks)
    p = d["_promotion"]
    fr = p["far_line_ruler"]
    doc, refusals = row23_lib.promotion_doc(d, s, ref, "manor", "0" * 64)
    print(json.dumps({
        "key": key, "verdict": d["verdict"],
        "instrument": p["horizon_instrument"],
        "ramp": p["ramp"], "ceiling_candidates": len(p["ceiling_candidates"]),
        "corners": [p["corner_x0_px"], p["corner_x1_px"]],
        "storey": p["storey_height_m"], "width": p["implied_wall_width_m"],
        "coping_px": fr["coping_above_ground_px"], "ppm": fr["px_per_m_at_far_line"],
        "ruled_m": fr["ruled_coping_m"], "horizon_px": fr["y"],
        "refusals": refusals,
        "doc_horizon_y": doc["horizon_y"], "doc_ramp": doc["_horizon_votes"]["ceiling_ramp_intersection"],
        "calibration_ref": doc["calibration_ref"],
        "which_horizon": doc["_which_horizon"],
        "ruler_policy": doc["_ruler_policy"]["rule"],
        "meta_ppm": meta["px_per_m_at_wall"], "meta_horizon_y": meta["horizon_y"]}))
`);
    const rows = out.trim().split("\n").map((l) => JSON.parse(l));
    expect(rows.length, "no open facing was read").toBe(3);
    for (const r of rows) {
      expect(r.verdict, `${r.key} did not even measure`).toBe("PASS");
      expect(r.instrument, `${r.key} was not read by the far-line ruler`)
        .toBe("far-line-ruler");
      expect(r.ramp, `${r.key} produced a ceiling ramp, on a frame with no ceiling`)
        .toBe(null);
      expect(r.ceiling_candidates,
        `${r.key} ran pick_ceiling on an open frame — the ramp path is not skipped, it is short-circuited`)
        .toBe(0);
      expect(r.corners, `${r.key} claims corners, which the law refuses an open facing`)
        .toEqual([null, null]);
      expect(r.storey, `${r.key} claims a storey height, and an open space has nothing overhead`)
        .toBe(null);
      expect(r.width, `${r.key} claims a wall width read off corners it does not have`).toBe(null);
      expect(r.refusals, `${r.key}'s promotion doc refused`).toEqual([]);
      /* The ruler IS the arithmetic, not a number recorded beside it. */
      expect(r.coping_px / r.ruled_m, `${r.key}: the ruler's own two numbers do not give its scale`)
        .toBeCloseTo(r.ppm, 3);
      expect(r.ppm, `${r.key}: the promoted meta's scale is not the one the ruler read`)
        .toBeCloseTo(r.meta_ppm, 3);
      /* The horizon is the DECLARED eye line, and the meta carries that row. */
      expect(r.doc_ramp, `${r.key}'s record carries a ramp for a promotion to read`).toBe(null);
      expect(r.doc_horizon_y * 1024, `${r.key}: the record's horizon is not the declared eye line`)
        .toBeCloseTo(r.horizon_px, 3);
      expect(r.meta_horizon_y, `${r.key}: the promoted meta's horizon moved off the record's`)
        .toBeCloseTo(r.doc_horizon_y, 5);
      /* And the record can be said on a garden wall. Finding (a) is "exterior
         garden has interior wall outside"; a §5 record that calls an outdoor
         ruler a wainscot chair-rail writes that finding into the ledger. */
      for (const [what, text] of Object.entries({
        calibration_ref: r.calibration_ref,
        which_horizon: r.which_horizon,
        ruler_policy: r.ruler_policy
      })) {
        expect(carryableOutdoors(text),
          `${r.key}'s ${what} names interior fabric: ${text}`).toBe(true);
      }
      /* ...and it still parses for §5's calibration audit, which pulls the
         ruled metres out of that same sentence. */
      expect(r.calibration_ref, `${r.key}'s calibration_ref names no size in metres`)
        .toMatch(/taken at 0\.95 m/);
    }
  });

  /* ------------------------------------------------------------------ 4 */
  /* Clause 6 again, on the vista's own correction. A wall refused by the
     far-line ruler is refused for its GROUND ROW, and the sentence that goes
     back to the generator must say so in words an outdoor prompt can carry —
     the row-32 sentences cannot, because they speak of returns meeting a
     surface overhead and an open frame has neither. */
  test("a vista's correction speaks of its ground row, and survives an outdoor wall whole", () => {
    const out = inMeasured(`
import row23_run as R
reading = {"_promotion": {"horizon_instrument": "far-line-ruler",
                          "far_line_ruler": {"ground_row_px": 603.0,
                                             "px_per_m_at_far_line": 67.4},
                          "eye_height_m": 2.9}}
entry = {"horizon_y": 0.51376953125, "floor_line_y": 0.5630611979166666}
for fam in ("suspect-painting", "unfitted-horizon", "something-else"):
    print("%s@@%s" % (fam, R._correction_for(fam, "why", reading, entry)))
`);
    const said = {};
    for (const line of out.trim().split("\n")) {
      const i = line.indexOf("@@");
      if (i > 0) said[line.slice(0, i)] = line.slice(i + 2);
    }
    expect(said["something-else"],
      "a refusal this row does not answer must not manufacture a correction").toBe("None");
    for (const fam of ["suspect-painting", "unfitted-horizon"]) {
      const s = said[fam];
      expect(s, `${fam} produced no vista correction`).toBeTruthy();
      expect(carryableOutdoors(s),
        `${fam}'s vista correction names interior fabric, so an outdoor wall gets it redacted: ${s}`)
        .toBe(true);
      expect(s, `${fam}'s vista correction speaks of returns an open frame has none of`)
        .not.toContain("returns");
      expect(s, `${fam}'s vista correction never names the row the ground must land on`)
        .toContain("row 577");
    }
  });
});
