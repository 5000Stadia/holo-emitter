/* [B-ROUTING] THE LOOP'S STANDING EXITS, and the watchdog that says it is alive.
 *
 * The sweep measured, promoted and retried. The two exits the Captain ruled —
 * the SNAP (row 35's correction) and the TOLERANCE (row 32's declared camera) —
 * were one-shot tools run by hand between passes, so a pass could measure a
 * dozen fresh returns, find every one of them a camera PASS, and leave all
 * twelve holding for want of a command nobody was in the room to type.
 *
 * What is checked here is the ROUTING and not the instruments: the snap has its
 * own spec (`snap.spec.mjs`), the promotion has `validator.spec.mjs` and
 * `doors.spec.mjs`, and re-checking those through this door would be a second
 * copy of somebody else's claim. So the seams the routing owns are stubbed and
 * the four doors are driven over a synthetic manifest — one wall out of each —
 * because what can break here is a wall taking the wrong exit, an exit being
 * taken twice, or a wall reported promoted that is not.
 *
 *   the exit table    one wall by each door, and the record each one carries
 *   once per candidate the routing does not re-snap a frame it has already
 *                     routed, and DOES route the next roll of the same wall
 *   the door repair   a clean snap the door clause refuses goes to the void
 *                     painter, and its absence is a NAMED refusal
 *   the validation    per wall it is `--only`; the fixture is checked once a
 *                     sweep
 *   the liveness      the baton reads a PASS THAT COMPLETED, not a session
 *                     that exists — a loop wedged forever inside one pass is
 *                     the stall this replaces
 */
import { test, expect, repoRoot } from "./helpers.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ------------------------------------------------------------------ the exits */

/* The driver runs the REAL `sweep` and the REAL `route_exit` over a synthetic
   manifest, with exactly three seams stubbed and each for a stated reason: the
   snap (minutes of numpy per wall, and its own spec proves what it does), the
   promotion (node, the store, the bake — `validator.spec.mjs`'s), and the
   instrument (a reading is a canned dict here so the families under test are
   the families measured). Everything between them is the code under test. */
const DRIVER = `
import json, os, sys, tempfile

TMP = tempfile.mkdtemp(prefix="exits-")
os.environ["HOLO_TIMINGS"] = os.path.join(TMP, "timings.jsonl")
sys.path.insert(0, os.path.join("design", "plan-draft", "measured"))
import row23_run as R
import row35_snap

R.OUT = os.path.join(TMP, "readings")
os.makedirs(R.OUT, exist_ok=True)
# The bake AND the derivation, which are now the same door: _bake_if_promoted
# regenerates every artifact the pass invalidated before it validates and bakes.
# Stubbed together because both are somebody else's spec (fixtures.spec for the
# bake, derived.py --check --deep for the derivation) and both would put a real
# store's minute into every case here. Star-args rather than a fixed arity: a
# stub pinned to a signature is a test that goes red when a CALLER gains an
# argument, which says nothing about the routing this file is about.
R._bake_if_promoted = lambda *a, **k: None
RULING = '2026-08-24 | suspect-painting tolerance | "close enough" | (synthetic)'
R.tolerance_ruling = lambda: RULING
R.DOOR_SOURCE_DIR = os.path.join(TMP, "source-doors")
R.facing_of = lambda key: {"type": "enclosed"}
R.arrivals_for = lambda key, e: list(e["rolls"])

lib = R.row23_lib
lib.reference_from_entry = lambda e: {"focal_px": 819.6, "eye_m": 1.183}
lib.side_from_entry = lambda key, e, fac: {"meta_used": {"facing_type": "enclosed"}}
lib.cfg_from_sidecar = lambda side: {"synthetic": True}


def reading(family):
    d = {"verdict": "PASS", "delta_focal_pct": 1.5, "delta_eye_pct": 0.4,
         "px_per_m_at_wall": 115.7,
         "_measured_px": {"wall_floor_line_y_px": 673,
                          "dado_rail_above_floor_px": 110},
         "_promotion": {}}
    if family:
        d["_promotion"] = {"hold_family": family, "ramp": {"y": 615.8},
                           "eye_height_m": 0.485}
    return d


READINGS = {
    "alpha/N": reading(None),                  # promotes on its own numbers
    "beta/N": reading("suspect-painting"),     # the snap corrects it
    "gamma/N": reading("suspect-painting"),    # the snap cannot; the ruling can
    "delta/N": reading("unfitted-horizon"),    # neither: grid
    "epsilon/N": reading("suspect-painting"),  # snapped clean, door clause refuses
}
BY_CANDIDATE = {"%s.png" % k.replace("/", "-"): k for k in READINGS}
lib.measure_candidate = lambda path, side, cfg, ref, picks: dict(
    READINGS[BY_CANDIDATE[os.path.basename(path)]])

CALLS = {"snap": [], "promote_document": [], "do_promote": []}
SNAP_CLEAN = {"beta/N", "epsilon/N", "zeta/N"}
DOOR_REFUSED = {"epsilon/N", "zeta/N"}


def fake_snap_to_round(key, candidate, reading=None, round_dir="row35snap",
                       acceptance=False, **kw):
    CALLS["snap"].append((key, candidate))
    if key not in SNAP_CLEAN:
        return None, ("the measured convergence's snap is over budget "
                      "[row35:snap.stretch_budget]")
    loc, fac = key.split("/")
    return dict(facing=key, source_candidate=candidate, round=round_dir, record={},
                candidate="design/batches/row35-snap/%s-%s/after.png" % (loc, fac),
                out_png=os.path.join(TMP, "%s-%s-after.png" % (loc, fac)),
                doc_out=os.path.join(TMP, "%s-%s.json" % (loc, fac)),
                acceptance={"verdict": "PASS", "hold_family": None,
                            "delta_focal_pct": 1.2, "delta_eye_pct": 0.3}), None


def fake_promote_document(key, cand_rel, round_dir):
    CALLS["promote_document"].append((key, cand_rel, round_dir))
    if key in DOOR_REFUSED:
        # THE REAL REFUSAL'S SHAPE, and its length is the point: the ledger
        # token is LAST, past the 200 characters a caller might think a
        # sentence is worth keeping. great_hall/N was routed to grid instead of
        # to the repair by exactly that truncation.
        return False, ("promote refused: %s: the plan rules 1 way(s) through "
                       "this wall and the painting shows 0 — a doorway the "
                       "world walks through with no hole in the picture is not "
                       "promotable, because a player would click on paint "
                       "[row27:door.unmeasured_exit]" % key)
    return True, None


def fake_do_promote(key, cand_rel, e, side, ref, rdg, tolerance=False):
    CALLS["do_promote"].append((key, cand_rel, tolerance))
    if tolerance:
        return (key == "gamma/N"), (None if key == "gamma/N"
                                    else "the promotion instrument refused it")
    return (key == "alpha/N"), (None if key == "alpha/N" else "no px_per_m_at_wall")


row35_snap.snap_to_round = fake_snap_to_round
R.promote_document = fake_promote_document
R.do_promote = fake_do_promote

MANIFEST = {"entries": [
    {"key": k, "horizon_y": 0.51377, "floor_line_y": 0.657,
     "px_per_m_at_wall": 115.7,
     # beta keeps its cap so the snap is shown firing on a RETRYING wall too:
     # the snap spends no roll, so it is not gated on a wall having run out.
     "retry_cap": (3 if k == "beta/N" else 1),
     "rolls": [{"id": "id-%s" % k.replace("/", "-"),
                "candidate": "backdrops/source/%s.png" % k.replace("/", "-")}]}
    for k in READINGS]}

state = {"walls": {}}
promoted, failed, parked, waiting = R.sweep(MANIFEST, state)
first = {k: dict(v) for k, v in state["walls"].items()}
snaps_after_first = len(CALLS["snap"])

# A SECOND PASS over the same state and the same candidates. The stubbed
# promotion writes no art, so every promoted wall meets the RE-DECIDE guard —
# the harshest re-entry the loop has — and the exits still must not fire twice.
promoted2, failed2, parked2, waiting2 = R.sweep(MANIFEST, state)
snaps_after_second = len(CALLS["snap"])

# A NEW CANDIDATE IS A NEW ROUTING: the same wall, a roll that did not exist.
delta = state["walls"]["delta/N"]
delta["status"] = "held"
snaps_before_third = len(CALLS["snap"])
BY_CANDIDATE["delta-N-second-roll.png"] = "delta/N"
R.route_exit("delta/N", MANIFEST["entries"][3], delta,
             "backdrops/source/delta-N-second-roll.png", READINGS["delta/N"],
             {"meta_used": {}}, {}, "unfitted-horizon")
snaps_third = len(CALLS["snap"]) - snaps_before_third

# THE VOIDED EXIT, with the repair standing in for B-ASSEMBLY's painter — the
# call site is what is under test here, not the painting.
R._exit_void_repair = lambda key, st, res, why: (
    True, "the plan's apertures were painted in as voids and the doors re-read")
zeta = {"attempts": 1, "status": "held", "hold_family": "suspect-painting",
        "correction": "draw the returns to the eye line"}
READINGS["zeta/N"] = reading("suspect-painting")
BY_CANDIDATE["zeta-N.png"] = "zeta/N"
zeta_exit, zeta_why = R.route_exit(
    "zeta/N", MANIFEST["entries"][0], zeta, "backdrops/source/zeta-N.png",
    READINGS["zeta/N"], {"meta_used": {}}, {}, "suspect-painting")

steps = {}
for line in open(os.environ["HOLO_TIMINGS"]):
    try:
        s = json.loads(line)["step"]
    except Exception:
        continue
    steps[s] = steps.get(s, 0) + 1

print("===EXITS===")
print(json.dumps({
    "exits": {k: v.get("exit") for k, v in first.items()},
    "reasons": {k: v.get("exit_reason") for k, v in first.items()},
    "status": {k: v.get("status") for k, v in first.items()},
    "walls": first,
    "promoted_first": [p[0] for p in promoted],
    "promoted_second": [p[0] for p in promoted2],
    "snaps_after_first": snaps_after_first,
    "snaps_after_second": snaps_after_second,
    "snaps_third": snaps_third,
    "promote_document_calls": CALLS["promote_document"],
    "tolerance_calls": [c for c in CALLS["do_promote"] if c[2]],
    "zeta": {"exit": zeta_exit, "why": zeta_why, "state": zeta},
    "timing_steps": steps,
}))
`;

let REPORT = null;
function report() {
  if (REPORT) return REPORT;
  const out = execFileSync("python3", ["-c", DRIVER],
    { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
  const i = out.indexOf("===EXITS===");
  expect(i, `the driver printed no report:\n${out}`).toBeGreaterThan(-1);
  REPORT = JSON.parse(out.slice(i + "===EXITS===".length));
  return REPORT;
}

test.describe("the sweep takes the ruled exits itself", () => {
  test("one wall leaves by each door, and its record says which", () => {
    const r = report();
    expect(r.exits).toEqual({
      "alpha/N": "measured",
      "beta/N": "snapped",
      "gamma/N": "tolerated",
      "delta/N": "grid",
      "epsilon/N": "grid",
    });
    /* Three of them are in the store and two are not, and the ledger says the
       same thing the store does. */
    expect(r.status["alpha/N"]).toBe("promoted");
    expect(r.status["beta/N"]).toBe("promoted");
    expect(r.status["gamma/N"]).toBe("promoted");
    expect(r.status["delta/N"]).toBe("held");
    expect(r.status["epsilon/N"]).toBe("held");
    expect(r.promoted_first.sort()).toEqual(["alpha/N", "beta/N", "gamma/N"]);
  });

  test("a snapped wall promotes through the snap round, on measured numbers", () => {
    const r = report();
    const beta = r.walls["beta/N"];
    /* It went through the row-35 round and nothing else did the promoting. */
    expect(r.promote_document_calls.some(
      ([k, , round]) => k === "beta/N" && round === "row35snap")).toBe(true);
    /* Nothing was waived: the correction it was carrying is ANSWERED, not
       waived, and no tolerance flag is anywhere on it. */
    expect(typeof beta.answered_correction).toBe("string");
    expect(beta.waived_correction).toBeUndefined();
    expect(beta.suspect_perspective).toBeUndefined();
    expect(beta.camera_source).toBeUndefined();
    /* And it is no longer holding for anything, while the record still says
       what it was holding for. */
    expect(beta.hold_family).toBeUndefined();
    expect(beta.snapped_from_family).toBe("suspect-painting");
    /* The snap is not gated on a wall having run out of rolls: beta was
       RETRYING (its cap is unspent) and the snap still corrected it, because a
       snap spends no roll. */
    expect(r.snaps_after_first).toBeGreaterThan(0);
  });

  test("a tolerated wall carries the flag, the declared camera and the ruling", () => {
    const r = report();
    const g = r.walls["gamma/N"];
    expect(g.suspect_perspective).toBe(true);
    expect(g.camera_source).toBe("declared");
    expect(String(g.tolerance_ruling)).toContain("suspect-painting tolerance");
    /* THE REPAINT NEVER HAPPENED. A tolerated wall's correction is waived and
       never answered, and it keeps the family it was held under so
       --recheck-doors can re-decide it under the same ruling. */
    expect(typeof g.waived_correction).toBe("string");
    expect(g.answered_correction).toBeUndefined();
    expect(g.hold_family).toBe("suspect-painting");
    /* And the ruling was spent SECOND: the snap was tried on this wall first. */
    expect(String(g.exit_reason)).toContain("the snap first");
  });

  test("the tolerance is not spent on a wall that still has rolls coming", () => {
    const r = report();
    /* beta is the retrying wall and the ruling was never asked about it. */
    expect(r.tolerance_calls.some(([k]) => k === "beta/N")).toBe(false);
  });

  test("a wall neither exit can carry stays grid, and says what both said", () => {
    const r = report();
    const why = r.reasons["delta/N"];
    expect(why).toContain("snap:");
    expect(why).toContain("tolerance:");
    expect(why).toContain("row35:snap.stretch_budget");
    /* The hold the sweep recorded stands: grid is not a promotion. */
    expect(r.walls["delta/N"].hold_family).toBe("unfitted-horizon");
    expect(typeof r.walls["delta/N"].correction).toBe("string");
  });

  test("an exit is tried once per candidate, and again when the roll changes", () => {
    const r = report();
    expect(r.snaps_after_second).toBe(r.snaps_after_first);
    /* And the second pass claims no promotion for a wall it did not promote:
       only the wall that actually re-promoted is in the list. */
    expect(r.promoted_second).toEqual(["alpha/N"]);
    /* A roll that did not exist before is a routing that has not happened. */
    expect(r.snaps_third).toBe(1);
  });

  test("a clean snap the door clause refuses routes to the void repair", () => {
    const r = report();
    /* The routing REACHED the repair — the door clause is what sent it — and
       row 36's painter refused this synthetic wall for a reason of its own
       (no declared geometry for a facing no scaffold ever measured), which is
       the shape of every honest refusal on this arm. */
    const why = r.reasons["epsilon/N"];
    expect(why).toContain("row27:door.unmeasured_exit");
    expect(why).toContain("the door-void repair refused this frame");
    /* And when the repair answers, the wall ships under its own exit name. */
    expect(r.zeta.exit).toBe("snapped+voided");
    expect(r.zeta.state.status).toBe("promoted");
    expect(r.zeta.state.suspect_perspective).toBeUndefined();
  });

  test("the door refusal is routed on the ledger token, not on the prose", () => {
    const src = readFileSync(join(repoRoot, "design", "plan-draft", "measured",
      "row23_run.py"), "utf8");
    expect(src).toContain("row27:door.unmeasured_exit");
    const out = execFileSync("python3", ["-c",
      "import sys; sys.path.insert(0,'design/plan-draft/measured'); "
      + "import row23_run as R; "
      + "print(R._is_door_refusal('x [row27:door.unmeasured_exit]'), "
      + "R._is_door_refusal('the plan rules 1 way through this wall'), "
      + "R._is_door_refusal(None))"],
      { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    expect(out.trim()).toBe("True False False");
  });

  test("a refusal reaches the router whole, token and all", () => {
    /* THE ROUTER MUST NOT READ ITS OWN SCISSORS. `promote-backdrop.mjs` puts
       its ledger token LAST, so a promotion refusal shortened on the way back
       loses the very clause the routing decides on — which is not
       hypothetical: `great_hall/N` snapped clean, was refused for want of a
       painted way through, and went to grid because the token had been sliced
       off the end of the sentence before anyone looked for it. */
    const out = execFileSync("python3", ["-c", `
import os, sys
os.environ["HOLO_TIMINGS"] = "off"
sys.path.insert(0, os.path.join("design", "plan-draft", "measured"))
import row23_run as R
REAL = ("promote refused: great_hall/N: the plan rules 1 way(s) through this "
        "wall and the painting shows 0 - a doorway the world walks through "
        "with no hole in the picture is not promotable, because a player would "
        "click on paint [row27:door.unmeasured_exit]")
class Refused:
    returncode, stdout, stderr = 1, REAL, ""
R.subprocess.run = lambda a, **kw: Refused()
ok, why = R.promote_document("great_hall/N", "backdrops/source-snapped/x.png", "row35snap")
print(ok, R._is_door_refusal(why))
`], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    expect(out.trim()).toBe("False True");
  });

  test("every exit step leaves a timing line", () => {
    const r = report();
    for (const step of ["exit.snap", "exit.tolerance", "exit.voidrepair", "exit.route"]) {
      expect(r.timing_steps[step],
        `${step} left no record — an exit that costs time and leaves none is `
        + "invisible to the ledger that is supposed to price it").toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------- the validation */

test.describe("the validator runs once per sweep, and once per wall by name", () => {
  /* Both calls are made with `subprocess.run` replaced by a recorder: what is
     under test is WHICH validation each site asks for, not what the validator
     then says. */
  const argv = (() => {
    const out = execFileSync("python3", ["-c", `
import json, sys, os
os.environ["HOLO_TIMINGS"] = "off"
sys.path.insert(0, os.path.join("design", "plan-draft", "measured"))
import row23_run as R
calls = []
class Done:
    returncode, stdout, stderr = 0, "", ""
R.subprocess.run = lambda a, **kw: (calls.append(list(a)), Done())[1]
R._validate_promoted("great_hall/N")
per_wall = list(calls)
calls.clear()
R._bake_if_promoted(3)
print(json.dumps({"per_wall": per_wall, "per_sweep": calls}))
`], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    return JSON.parse(out);
  })();

  const validations = (list) => list.filter((a) => a.some((x) => String(x).includes("validate-fixtures")));

  test("a promotion validates its own wall's meta and nothing else", () => {
    const v = validations(argv.per_wall);
    expect(v.length).toBe(1);
    expect(v[0]).toContain("--only");
    expect(v[0][v[0].indexOf("--only") + 1]).toBe("great_hall/N");
  });

  test("the fixture is validated whole exactly once a sweep, before the bake", () => {
    const v = validations(argv.per_sweep);
    expect(v.length, "the fixture-wide validation is once a sweep").toBe(1);
    expect(v[0].includes("--only"),
      "the once-a-sweep check is the whole fixture, not one wall").toBe(false);
    /* Before the encode: a store the law refuses should cost a validator run
       rather than a bake of every world. */
    const iValidate = argv.per_sweep.findIndex((a) => a.some((x) => String(x).includes("validate-fixtures")));
    const iBake = argv.per_sweep.findIndex((a) => a.some((x) => String(x).includes("bake-")));
    expect(iValidate).toBeLessThan(iBake);
  });

  test("--only checks the meta clause and refuses a facing no world names", () => {
    const ok = execFileSync("node", [join(repoRoot, "tools", "validate-fixtures.mjs"),
      "--fixture-dir", join(repoRoot, "fixtures", "nav-manor"), "--only", "great_hall/N"],
      { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    expect(ok).toContain("valid");
    let refused = "";
    try {
      execFileSync("node", [join(repoRoot, "tools", "validate-fixtures.mjs"),
        "--fixture-dir", join(repoRoot, "fixtures", "nav-manor"), "--only", "nowhere/N"],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      refused = String(e.stderr || e.stdout || "");
    }
    expect(refused, "a facing no world names must be a finding, never a quiet pass")
      .toContain("names no such facing");
  });
});

/* ---------------------------------------------------------------- the liveness */

/** A repository the watchdog can be run in, with `tmux` stubbed to a log. */
function batonRepo(passAgeSeconds) {
  const dir = mkdtempSync(join(tmpdir(), "baton-"));
  execFileSync("git", ["init", "-q", dir], { stdio: "pipe" });
  mkdirSync(join(dir, "design", "plan-draft", "measured"), { recursive: true });
  mkdirSync(join(dir, "design", "batches", "row23-scaffold", "manor"), { recursive: true });
  mkdirSync(join(dir, "backdrops", "source", "x-N"), { recursive: true });
  mkdirSync(join(dir, "tools"), { recursive: true });
  mkdirSync(join(dir, "bin"), { recursive: true });
  /* One candidate on disk with no reading: the LOOP holds the baton, which is
     the holder whose liveness this is about. */
  writeFileSync(join(dir, "backdrops", "source", "x-N", "a.png"), "not a png");
  writeFileSync(join(dir, "design", "batches", "row23-scaffold", "manor", "manifest.json"),
    JSON.stringify({ entries: [{ key: "x/N", rolls: [{ id: "deadbeef", candidate: "backdrops/source/x-N/a.png" }] }] }));
  /* AND THE WALL IS ONE THE SWEEP HAS REGISTERED. `baton-watch.sh` counts a
     candidate as owed to the loop only for a wall the run state knows and has
     not finished with — the guard that stopped M0's fenced `study`/`hall`
     facings holding "loop owed 2" for a day. This fixture wrote `walls: {}`,
     which predates that guard: the watchdog correctly answered "nothing owed
     anywhere" and all three cases below were red about the baton being none.
     A run state with no walls in it is not a repository the loop has ever run
     in, and the liveness these cases are about is a claim about one that has. */
  writeFileSync(join(dir, "design", "batches", "row23-scaffold", "manor", "run-state.json"),
    JSON.stringify({ walls: { "x/N": { status: "retry", attempts: 1 } } }));
  const now = Date.now() / 1000;
  const ledger = passAgeSeconds === null ? "" : JSON.stringify({
    ts_start: now - passAgeSeconds - 30, ts_end: now - passAgeSeconds,
    step: "sweep.pass", key: null, detail: { promoted: 0 },
  }) + "\n";
  writeFileSync(join(dir, "design", "plan-draft", "measured", "timings.jsonl"), ledger);
  copyFileSync(join(repoRoot, "tools", "baton-watch.sh"), join(dir, "tools", "baton-watch.sh"));
  const log = join(dir, "tmux.log");
  writeFileSync(join(dir, "bin", "tmux"), `#!/bin/sh\necho "$@" >> ${log}\nexit 0\n`);
  chmodSync(join(dir, "bin", "tmux"), 0o755);
  execFileSync("bash", ["tools/baton-watch.sh"], {
    cwd: dir, encoding: "utf8", stdio: "pipe",
    env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` },
  });
  return {
    status: JSON.parse(readFileSync(join(dir, "design", "batches", "row23-scaffold",
      "manor", "baton.json"), "utf8")),
    tmux: existsSync(log) ? readFileSync(log, "utf8") : "",
  };
}

test.describe("the baton reads a pass that completed, not a session that exists", () => {
  test("a loop that finished a pass a minute ago is active, and is not nudged", () => {
    const r = batonRepo(60);
    expect(r.status.baton).toBe("loop");
    expect(r.status.active).toBe("yes");
    expect(r.status.nudged).toBe("no");
    expect(r.status.loop_pass_age_s).toBeGreaterThanOrEqual(60);
    expect(r.tmux.trim(), "an active loop must not be touched").toBe("");
  });

  test("a loop whose last pass completed two hours ago reads stalled", () => {
    /* THE SESSION IS UP THE WHOLE TIME. The stub answers every tmux call
       successfully, so `has-session` would have said yes — which is exactly the
       false healthy this replaces: after the host restart a pass had not
       finished in two hours while `manor-loop` sat there holding the baton. */
    const r = batonRepo(7200);
    expect(r.status.active).toBe("no");
    expect(r.status.nudged).toBe("yes");
    expect(r.status.detail).toContain("no pass has completed");
    /* The wedged session is killed before the restart: a second manor-loop
       beside the first is not a restart. */
    expect(r.tmux).toContain("kill-session");
    expect(r.tmux).toContain("new-session");
    expect(r.tmux.indexOf("kill-session")).toBeLessThan(r.tmux.indexOf("new-session"));
  });

  test("a ledger with no completed pass at all reads stalled, not healthy", () => {
    const r = batonRepo(null);
    expect(r.status.active).toBe("no");
    expect(r.status.loop_pass_age_s).toBe(-1);
    expect(r.status.detail).toContain("no sweep pass has ever completed");
  });
});
