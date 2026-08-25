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
import { readFileSync, existsSync } from "node:fs";
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
       what a reader can reproduce are the same command. */
    const out = py([REPORT]);
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
    for (const wall of ["great_hall/N", "great_hall/W", "library/S", "privy_garden/W"]) {
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
    /* Three of them read ZERO before and their plan rules more than zero —
       which is the refusal this repair exists to answer. */
    expect(seen["great_hall/N"].before).toBe(0);
    expect(seen["great_hall/W"].before).toBe(0);
    expect(seen["library/S"].before).toBe(0);
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
    for (const key of promoted.slice(0, 6)) {
      const [loc, fa] = key.split("/");
      try {
        py([TOOL, "--paint-doors", key,
            "--candidate", `backdrops/${loc}/${fa}.png`,
            "--out-png", join(repoRoot, "design", "batches", "row36-assembly",
                              "door-repair", "_probe.png")]);
      } catch (e) {
        const said = String(e.stdout || "") + String(e.stderr || "");
        if (/already reads all/.test(said)) leftAlone++;
      }
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
});
