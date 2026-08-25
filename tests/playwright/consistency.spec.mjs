/* Row 40 — the legacy consistency audit, and the forced re-ask it cuts.
 *
 * [HUMAN, 2026-08-24, verbatim] "Still getting rooms with wall/ceiling
 * mismatches" — "Mismatches as in different from other walls" — and, on the
 * same walk: "There's still not a forced consistency with the wall types such
 * as in the master bed chamber."
 *
 * Rows 36 and 38 cure this by construction for every wall painted from here
 * on. The 57 already-promoted paintings were rolled independently and had
 * never been measured against each other. Four claims are made by this build
 * and each is checked against something other than its own account of itself:
 *
 *   1. the MEASURE can go red and can stay green — proved on a synthetic store
 *      it builds itself, including the case that would break it (a facing lit
 *      dimmer is not a different room);
 *   2. the RULING the re-ask carries is the room's own voice out of the plan,
 *      recomputed here from `room-voices.mjs` rather than read back out of the
 *      packet that quoted it;
 *   3. a consistency packet SEEDS only from a facing the measure puts inside
 *      the room's agreeing majority, and a room with no majority gets no strip
 *      at all;
 *   4. every packet on disk is internally consistent — its correction stands
 *      verbatim in its PACKET.md, its rolls' prompts exist, its scaffold's
 *      sha256 is the sha256 of the file.
 */
import { test, expect } from "@playwright/test";
import { repoRoot } from "./helpers.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { voiceFor, hangingsFor } from "../../tools/room-voices.mjs";
import { roomRuling, consistencySentence } from "../../tools/make-scaffold.mjs";
import { neighbourAt, neighbourEdge, seedPlansAll } from "../../tools/edge-seed.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const MANOR = join(repoRoot, "design", "batches", "row23-scaffold", "manor");
const REPORT = join(repoRoot, "design", "plan-draft", "measured", "room_consistency.json");
const TEST_PY = join(repoRoot, "design", "plan-draft", "measured", "test_room_consistency.py");
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/* ------------------------------------------------------------------ */
/* 1. THE INSTRUMENT CAN GO RED                                        */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the measure", () => {
  test.setTimeout(180_000);

  test("goes red on a swapped ceiling, green on the same room dimmed", () => {
    /* The whole of `test_room_consistency.py`: it builds a synthetic store in
     * a temp directory, paints one room from one material set and another with
     * a ceiling swapped, and asserts which way each must come out. Shelled out
     * rather than reimplemented, because a second implementation of the same
     * synthetic corpus is a second thing that can drift. */
    try {
      execFileSync("python3", [TEST_PY], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      throw new Error(`the row-40 measure's own test failed:\n${e.stdout || ""}${e.stderr || ""}`);
    }
  });

  test("the report names a verdict, a band and a cut for every room it read", () => {
    expect(existsSync(REPORT),
      "room_consistency.json has never been written — run the measure").toBe(true);
    const r = JSON.parse(readFileSync(REPORT, "utf8"));
    expect(r.cut).toBeGreaterThan(0);
    expect(r.rooms.length).toBeGreaterThan(0);
    for (const room of r.rooms) {
      expect(["consistent", "consistent-incomplete", "mismatched", "insufficient"])
        .toContain(room.verdict);
      if (room.verdict === "insufficient") {
        expect(room.why, `${room.room} must say why it could not be compared`).toBeTruthy();
        continue;
      }
      expect(room.worst_band, `${room.room}`).toBeTruthy();
      expect(room.score).toBeGreaterThanOrEqual(0);
      /* The verdict and the cut must agree — a gate that can disagree with its
       * own threshold is not a gate. */
      expect(room.verdict.startsWith("mismatched")).toBe(room.score > r.cut);
      expect(room.outliers.length > 0).toBe(room.score > r.cut);
    }
    /* Nothing skipped in silence: every unreadable facing says which meta
     * field it lacks, or why no band survived its frame. */
    for (const u of r.unmeasurable) {
      expect(u.reason, `${u.room}/${u.facing}`).toBeTruthy();
      expect(u.room && u.facing).toBeTruthy();
    }
  });
});

/* ------------------------------------------------------------------ */
/* 2. THE RULING IS THE PLAN'S, NOT THE OTHER WALLS'                   */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the forced ruling", () => {
  test("names the room's own voice materials, recomputed from the plan", () => {
    for (const key of ["master_bedchamber/E", "kitchen/S", "servants_hall/N"]) {
      const [loc, f] = key.split("/");
      const ruling = roomRuling(PLAN, loc, f);
      const { voice } = voiceFor(PLAN, loc, f);
      expect(ruling.walls).toContain(voice.walls);
      expect(ruling.ceiling).toBe(voice.ceiling);
      expect(ruling.floor).toBe(voice.floor);
      /* A bedchamber's wall is two fabrics and the ruling must say which
       * hangings — this is the master bedchamber's whole complaint. */
      if (voice.hangings) {
        expect(ruling.hangings).toBe(hangingsFor(loc));
        expect(ruling.walls).toContain(hangingsFor(loc));
      } else {
        expect(ruling.hangings).toBeNull();
      }
    }
  });

  test("the master bedchamber's ruling names tapestry, and it is one line", () => {
    const ruling = roomRuling(PLAN, "master_bedchamber", "E");
    const room = PLAN.rooms.find((r) => r.id === "master_bedchamber");
    const s = consistencySentence(ruling, room, "ceiling", "Measured: nothing here.");
    expect(s).toContain("woven tapestry");
    expect(s).toContain(ruling.ceiling);
    expect(s).toContain(ruling.floor);
    /* `manorPrompt` pushes the correction as ONE line; a newline in it would
     * silently split the prompt's own paragraph. */
    expect(s.includes("\n")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 3. SEEDS COME ONLY FROM WALLS THE ROOM AGREES WITH                  */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the packets on disk", () => {
  const retries = existsSync(join(MANOR, "retries.json"))
    ? JSON.parse(readFileSync(join(MANOR, "retries.json"), "utf8")).entries || []
    : [];
  const rows = retries.filter((e) => e.consistency);

  test("a consistency packet exists at all", ({}, testInfo) => {
    if (!rows.length) {
      testInfo.annotations.push({ type: "pending",
        description: "no consistency packet has been emitted — this case is blind" });
    }
    expect(rows.length).toBeGreaterThan(0);
  });

  test("every strip was cut from a facing inside the room's majority", () => {
    for (const e of rows) {
      const [loc] = e.key.split("/");
      const majority = new Set((e.consistency.majority || []).map((g) => `${loc}/${g}`));
      if (e.consistency.no_majority) {
        expect(e.edge_seeds, `${e.key} has no majority, so it may carry no strip`)
          .toEqual([]);
        expect(e.edge_seed).toBeNull();
        continue;
      }
      for (const s of e.edge_seeds || []) {
        expect(majority.has(s.neighbour),
          `${e.key} was seeded from ${s.neighbour}, which is not one of the ` +
          `walls this room agrees on (${[...majority].join(", ")})`).toBe(true);
        expect(s.neighbour_edge).toBe(neighbourEdge(e.key.split("/")[1], s.side));
        expect(s.neighbour.split("/")[1]).toBe(neighbourAt(e.key.split("/")[1], s.side));
      }
      /* And it took every agreeing neighbour it could have taken — the row's
       * own claim is BOTH sides where both are available. */
      const could = seedPlansAll(PLAN, e.key, { allow: (nk) => majority.has(nk) })
        .filter((p) => p.allowed).length;
      expect((e.edge_seeds || []).length,
        `${e.key} could have carried ${could} strip(s)`).toBe(could);
    }
  });

  test("each packet quotes its own correction and its own scaffold", () => {
    for (const e of rows) {
      const dir = join(repoRoot, e.packet);
      expect(existsSync(join(dir, "PACKET.md")), e.packet).toBe(true);
      expect(readFileSync(join(dir, "PACKET.md"), "utf8"),
        `${e.key}'s packet must quote its correction verbatim`)
        .toContain(e.correction);
      expect(readFileSync(join(dir, "prompt.txt"), "utf8")).toContain(e.correction);
      expect(sha(join(dir, "scaffold.png"))).toBe(e.scaffold_sha256);
      for (const r of e.rolls) {
        expect(existsSync(join(repoRoot, r.prompt)), r.prompt).toBe(true);
      }
      /* The ruling in the entry is the ruling in the sentence. */
      expect(e.correction).toContain(e.consistency.ruling.walls);
    }
  });

  test("a consistency entry never displaces a retry's entry", () => {
    const seen = new Set();
    for (const e of retries) {
      const k = `${e.key}#${e.attempt}`;
      expect(seen.has(k), `${k} appears twice in retries.json`).toBe(false);
      seen.add(k);
    }
  });
});
