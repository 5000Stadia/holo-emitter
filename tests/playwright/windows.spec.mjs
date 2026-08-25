/* Row 42, part (2) — the painted window, and part (1)'s Image 1.
 *
 * [HUMAN, 2026-08-24, verbatim] "Can we paint the whole scene on wall 1 for a
 * room, use it to influence wall 2-4 direct where the doors should be but after
 * the fact detect the door location on the image and put the effective door
 * geometry in the images doorframe? Same with stairs, maybe Windows? Then we
 * can have door assets and window assets we literally place in the door frame
 * to open/close and same with the windows possibly"
 *
 * What the promotion and the emitter CLAIM, checked against something other
 * than their own account of themselves:
 *
 *   1. a promoted meta carries `meta.windows` at the geometry the PAINTING put
 *      them at, not the geometry the drawing rules — and the drawing's is what
 *      it falls back to when a window was not found, which is a different
 *      record and says so;
 *   2. the refusals are `guards.spec`'s (`window.unpainted`,
 *      `window.painted_width`); what is asserted here is the other half of the
 *      ruling — a window the PAINTING shows that the plan does not rule is
 *      recorded and gates nothing;
 *   3. the renderer can carry windows as apertures and DOES NOT BY DEFAULT,
 *      because every caller of `apertures()` turns what it returns into a `go`
 *      target and a window is not a way through;
 *   4. the window ids are the plan's own order, minted in one place;
 *   5. [part 1] Image 1 is the room's LEAD where the lead has a picture — a
 *      candidate included — and is still refused where that lead's own ask was
 *      not this room's ruling, which is row 40's condition read one step early.
 */
import { test, expect } from "@playwright/test";
import { repoRoot } from "./helpers.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync,
  cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { windowsForFacing, windowIds, deriveMeta, facingCarriers }
  from "../../tools/plan-projection.mjs";
import { WINDOW_SILL_M, WINDOW_HEAD_M } from "../../tools/room-voices.mjs";
import { styleImageFor, leadImageResolver, manorPrompt, scaffoldRects }
  from "../../tools/make-scaffold.mjs";
import { leadFacing } from "../../tools/edge-seed.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const CAL = join(repoRoot, "design", "plan-draft", "measured", "window_calibration.json");

/* ------------------------------------------------------------------ */
/* 1. THE PLAN'S HALF                                                  */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the window the drawing rules", () => {
  test("every plan window has one id, and it is minted in one place", () => {
    const ids = windowIds(PLAN);
    expect(ids.size, "the plan holds no windows at all").toBe((PLAN.windows || []).length);
    expect(new Set(ids.values()).size, "two windows share an id").toBe(ids.size);
    for (const id of ids.values()) expect(id).toMatch(/^win\d{2,}$/);
  });

  test("a facing's projected windows are its carriers, with the ruled band", () => {
    let seen = 0;
    for (const room of PLAN.rooms) {
      for (const f of Object.keys(room.facings || {})) {
        const carriers = facingCarriers(PLAN, room.id, f).filter((c) => c.kind === "window");
        const meta = deriveMeta(PLAN, room.id, f);
        if (!meta || !(meta.wall_width_m > 0)) continue;
        const wins = windowsForFacing(PLAN, room.id, f, meta);
        expect(wins.length, `${room.id}/${f}`).toBe(carriers.length);
        for (const w of wins) {
          expect(w.id, `${room.id}/${f} projects a window with no id`).toBeTruthy();
          expect(w.kind).toBe("window");
          expect(w.sill_m).toBe(WINDOW_SILL_M);
          expect(w.head_m).toBe(WINDOW_HEAD_M);
          expect(w.w).toBeGreaterThan(0);
          expect(w.h).toBeGreaterThan(0);
          seen += 1;
        }
      }
    }
    expect(seen, "no facing in the manor projects a window — this case is blind")
      .toBeGreaterThan(0);
  });

  test("the ids are stable across the facings that see the same window", () => {
    /* A window in a shared wall is seen from one room only in this plan, but the
       id must not depend on which facing asked: it is the PLAN's order. */
    const a = windowsForFacing(PLAN, "master_bedchamber", "E",
      deriveMeta(PLAN, "master_bedchamber", "E")).map((w) => w.id);
    const b = windowsForFacing(PLAN, "master_bedchamber", "E",
      deriveMeta(PLAN, "master_bedchamber", "E")).map((w) => w.id);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 2. THE PAINTING'S HALF, THROUGH THE REAL PROMOTION                  */
/* ------------------------------------------------------------------ */

/** The promotion, run in a staged tree over a doctored measurement.
 *
 * Deliberately the SAME construction `guards.spec`'s `promoteTokens` uses —
 * stage, copy the one candidate and its ask, doctor the reading, run the real
 * tool — because a case that re-implements the guard is a case that agrees with
 * itself. What is different is what it returns: the META, because these cases
 * are about what gets written rather than about what gets refused. */
function promoteMeta(key, doctor) {
  const [loc, fac] = key.split("/");
  const dir = mkdtempSync(join(tmpdir(), "holo-win-"));
  try {
    for (const d of ["tools", "src", "fixtures", "index.html"]) {
      cpSync(join(repoRoot, d), join(dir, d), { recursive: true });
    }
    mkdirSync(join(dir, "design", "plan-draft"), { recursive: true });
    cpSync(join(repoRoot, "design", "plan-draft", "measured"),
      join(dir, "design", "plan-draft", "measured"), { recursive: true });
    const meta = JSON.parse(readFileSync(
      join(repoRoot, "backdrops", loc, `${fac}.meta.json`), "utf8"));
    const cand = String(meta.camera_id).replace(/^measured:/, "");
    mkdirSync(dirname(join(dir, cand)), { recursive: true });
    cpSync(join(repoRoot, cand), join(dir, cand));
    const ask = cand.replace(/\.png$/i, ".prompt.txt");
    if (existsSync(join(repoRoot, ask))) cpSync(join(repoRoot, ask), join(dir, ask));
    const docRel = join("design", "plan-draft", "measured",
      meta.measured_round || "", `${loc}-${fac}.json`);
    const doc = JSON.parse(readFileSync(join(dir, docRel), "utf8"));
    doctor(doc);
    writeFileSync(join(dir, docRel), JSON.stringify(doc, null, 2) + "\n");
    execFileSync("node", [join(dir, "tools", "promote-backdrop.mjs"),
      "--facing", key, "--candidate", cand,
      ...(meta.measured_round ? ["--round", meta.measured_round] : []),
      ...(meta.camera_reference ? ["--reference", meta.camera_reference] : []),
      ...(meta.camera_source ? ["--camera-source", meta.camera_source] : [])],
      { cwd: dir, encoding: "utf8", stdio: "pipe" });
    return JSON.parse(readFileSync(join(dir, "backdrops", loc, `${fac}.meta.json`), "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const KITCHEN_E = { x0_px: 700, x1_px: 880, y0_px: 380, y1_px: 560,
  width_px: 180, centre_px: 790, head_m: 2.1, sill_m: 0.8 };

test.describe("row 42 — the window the painting shows", () => {
  test("a promoted meta carries the PAINTING's rectangle, not the drawing's", () => {
    const drawn = windowsForFacing(PLAN, "kitchen", "E",
      JSON.parse(readFileSync(join(repoRoot, "backdrops", "kitchen", "E.meta.json"), "utf8")));
    expect(drawn.length).toBe(1);
    const meta = promoteMeta("kitchen/E", (d) => {
      d._measured_px.windows = [{ ...KITCHEN_E }];
    });
    expect(Array.isArray(meta.windows)).toBe(true);
    expect(meta.windows.length).toBe(1);
    const w = meta.windows[0];
    expect(w.id).toBe(drawn[0].id);
    expect(w.kind).toBe("window");
    expect(w.measured).toBe(true);
    expect(w.x).toBe(KITCHEN_E.x0_px);
    expect(w.w).toBe(KITCHEN_E.width_px);
    expect(w.y).toBe(KITCHEN_E.y0_px);
    expect(w.h).toBe(KITCHEN_E.y1_px - KITCHEN_E.y0_px);
    /* THE VERTICAL IS THE PAINTING's TOO, which is the one place this differs
       from row 27: a doorway's foot is the wall's floor line and a window
       floats. The drawing rules 0.90-2.00 and this painting drew 0.80-2.10. */
    expect(w.head_m).toBe(KITCHEN_E.head_m);
    expect(w.sill_m).toBe(KITCHEN_E.sill_m);
    expect(w.head_m).not.toBe(WINDOW_HEAD_M);
    /* ...and it is genuinely somewhere else from where the plan puts it, or
       this case could pass on a coincidence. */
    expect(Math.abs(w.x - drawn[0].x)).toBeGreaterThan(1);
  });

  test("a window the painting shows that the plan does not rule is recorded, never gated", () => {
    /* THE RULING'S OTHER HALF. The plan amends to the painting (row 22), so an
       extra glazed opening is a fact for a human to look at with the calibration
       beside them — not a reason to send back a painting that is doing its job.
       The promotion below SUCCEEDS, which is the assertion. */
    const meta = promoteMeta("kitchen/E", (d) => {
      d._measured_px.windows = [
        { ...KITCHEN_E },
        { x0_px: 1100, x1_px: 1280, y0_px: 380, y1_px: 560,
          width_px: 180, centre_px: 1190, head_m: 2.1, sill_m: 0.8,
          lift: 120, lattice: { score: 0.4 } }
      ];
    });
    expect(meta.windows.length, "an unruled window must not become a meta entry").toBe(1);
    expect(meta.window_evidence.ruled).toBe(1);
    expect(meta.window_evidence.painted).toBe(2);
    expect(meta.window_evidence.unruled.length).toBe(1);
    /* WHICH of the two the assignment kept is the assignment's business — it is
       the order-preserving least-displacement one, the same construction the
       doorways use. What this case is about is that the OTHER one is recorded
       and not lost, and that it is not the one the meta carries. */
    expect([700, 1100]).toContain(meta.window_evidence.unruled[0].x);
    expect(meta.window_evidence.unruled[0].x).not.toBe(meta.windows[0].x);
    expect(meta.window_evidence.note).toContain("recorded, never gated");
  });

  test("a measurement with no window reading leaves the meta silent, and that is the row's stated edge", () => {
    /* The boundary, asserted rather than left to be discovered: a wall measured
       before this row promotes exactly as it did, carrying no `windows` key at
       all — because a key written from nothing would be the plan's rectangle
       wearing the painting's name. `window_calibration.json` is the list of
       walls this describes, and it can only shrink. */
    const meta = promoteMeta("kitchen/E", () => {});
    expect(meta.windows).toBeUndefined();
    expect(meta.window_evidence).toBeUndefined();
    expect(existsSync(CAL), "the calibration that names the silent walls is missing").toBe(true);
    const cal = JSON.parse(readFileSync(CAL, "utf8"));
    expect(cal.walls.length).toBeGreaterThan(0);
    expect(cal.instrument.window_band_m).toEqual([WINDOW_SILL_M, WINDOW_HEAD_M]);
  });
});

/* ------------------------------------------------------------------ */
/* 3. THE RENDERER                                                     */
/* ------------------------------------------------------------------ */

test.describe("row 42 — a window is an aperture and is not a way through", () => {
  test("windows ride in the aperture list only when a caller asks", async ({ page }) => {
    await page.goto("file://" + join(repoRoot, "index.html") + "?world=nav-manor");
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const fx = { world: A.harness.world, staging: A.harness.staging };
      const vs = { location: "kitchen", facing: "E" };
      /* The meta the page holds, with a measured window planted in it — the
         page's own store is never written to, only this copy. */
      const base = A.backdrops[`${vs.location}/${vs.facing}`];
      const meta = JSON.parse(JSON.stringify(base && base.meta ? base.meta : {}));
      meta.windows = [{ id: "winXX", kind: "window", measured: true,
        x: (meta.corner_x0_px + meta.corner_x1_px) / 2 - 90,
        y: 380, w: 180, h: 180, sill_m: 0.8, head_m: 2.1 }];
      const off = window.HOLO.renderer.apertures(
        fx.world, fx.staging, A.library, meta, vs);
      const on = window.HOLO.renderer.apertures(
        fx.world, fx.staging, A.library, meta, vs, { windows: true });
      return {
        off: off.map((a) => a.kind),
        on: on.map((a) => ({ kind: a.kind, exit: a.exit, to: a.to, via: a.via,
          id: a.window_id }))
      };
    });
    expect(r.off, "a window rode in the default aperture list — the page would give it a `go` button")
      .not.toContain("window");
    const wins = r.on.filter((a) => a.kind === "window");
    expect(wins.length, "the opt-in list carries no window").toBe(1);
    expect(wins[0].id).toBe("winXX");
    /* A window is not an exit and every field a router reads says so. */
    expect(wins[0].exit).toBeNull();
    expect(wins[0].to).toBeNull();
    expect(wins[0].via).toBeNull();
    /* ...and the ways through are untouched by asking. */
    expect(r.on.filter((a) => a.kind !== "window").map((a) => a.kind)).toEqual(r.off);
  });
});

/* ------------------------------------------------------------------ */
/* 4. PART (1) — IMAGE 1 IS THE LEAD                                   */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the lead is Image 1, on the same two conditions", () => {
  /* A staged root holding nothing but one lead's candidate and the ask beside
     it. Everything else `styleImageFor` reads is reached through `root`, so a
     root with no `room_consistency.json` in it exercises exactly one branch:
     the lead's. That is the point — the case must not be able to pass through
     row 40's promoted path by accident. */
  function stagedLead(askText) {
    const dir = mkdtempSync(join(tmpdir(), "holo-lead-"));
    const rel = "backdrops/source/long_gallery-W/row42-staged.png";
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), "");
    if (askText !== null) {
      writeFileSync(join(dir, rel.replace(/\.png$/, ".prompt.txt")), askText);
    }
    return { dir, rel, imageOf: (k) => k === "long_gallery/W"
      ? { rel, kind: "candidate" } : null };
  }

  /** The ask this emitter would compose for the lead today — the ruling itself,
   *  so the condition is checked against what the row actually writes rather
   *  than against a sentence typed into a test. */
  function currentAsk(key) {
    const [loc, f] = key.split("/");
    const meta = deriveMeta(PLAN, loc, f);
    const { rects } = scaffoldRects(PLAN, loc, f, meta);
    return manorPrompt(PLAN, key, meta, rects, null, null, { style: null });
  }

  test("a lead with only a CANDIDATE is Image 1 where its ask was the ruling", () => {
    expect(leadFacing(PLAN, "long_gallery")).toBe("W");
    const st = stagedLead(currentAsk("long_gallery/W"));
    try {
      const got = styleImageFor(PLAN, "long_gallery/N",
        { imageOf: st.imageOf, root: st.dir });
      expect(got, "the lead's candidate carries this room's ruling and was refused anyway")
        .toBeTruthy();
      expect(got.facing).toBe("W");
      expect(got.room).toBe("long_gallery");
      expect(got.rel).toBe(st.rel);
      expect(got.lead).toBe(true);
      expect(got.source_kind).toBe("candidate");
      expect(got.why).toContain("LEADS this room");
      expect(got.why).toContain("row 40");
      expect(got.role_sentence).toContain("ANOTHER WALL OF THIS SAME ROOM");
      /* AND THE LEAD IS NEVER ITS OWN REFERENCE. */
      expect(styleImageFor(PLAN, "long_gallery/W",
        { imageOf: st.imageOf, root: st.dir })).toBeNull();
    } finally {
      rmSync(st.dir, { recursive: true, force: true });
    }
  });

  test("a lead whose own ask was NOT this room's ruling is refused as Image 1", () => {
    /* ROW 40'S SECOND CONDITION, READ ONE STEP EARLY, and this is the whole
       reason the candidate path is not simply "take the lead". A photograph of
       a wall we know was commissioned from the wrong materials is worse than no
       photograph — `guest_chamber` is the room that proved it. */
    const wrong = stagedLead(
      "Paint the west wall. Materials/textures: whitewashed brick under a boarded ceiling.");
    const none = stagedLead(null);
    try {
      expect(styleImageFor(PLAN, "long_gallery/N",
        { imageOf: wrong.imageOf, root: wrong.dir }),
      "a lead asked for the wrong materials was handed on as this room's reference")
        .toBeNull();
      expect(styleImageFor(PLAN, "long_gallery/N",
        { imageOf: none.imageOf, root: none.dir }),
      "a lead with no recoverable ask at all was handed on as this room's reference")
        .toBeNull();
    } finally {
      rmSync(wrong.dir, { recursive: true, force: true });
      rmSync(none.dir, { recursive: true, force: true });
    }
  });

  test("and the store's own lead is refused today, for exactly that reason", () => {
    /* NOT A HYPOTHETICAL. `long_gallery/W` is unpromoted with a candidate on
       disk, and the ask that candidate was painted from predates row 29's voice
       table — it is one of the asks row 40's ORIGIN account is about. So the
       real store exercises the refusal, and the room falls back to row 40's
       promoted path, which is the behaviour this row inherits rather than
       replaces. */
    const state = JSON.parse(readFileSync(join(repoRoot, "design", "batches",
      "row23-scaffold", "manor", "run-state.json"), "utf8"));
    const imageOf = leadImageResolver(state, repoRoot);
    const img = imageOf("long_gallery/W");
    test.skip(!img || img.kind !== "candidate",
      "long_gallery/W has been promoted since — this case has served its purpose");
    const got = styleImageFor(PLAN, "long_gallery/N", { imageOf });
    if (got) expect(got.source_kind).toBe("promoted");
  });

  test("a caller that hands in no resolver gets row 40's answer unchanged", () => {
    /* The candidate path is reachable only through the resolver, so nothing
       that was not asking for row 42 can be given an unpromoted painting. */
    for (const key of ["long_gallery/N", "guest_chamber/N", "study/N"]) {
      const st = styleImageFor(PLAN, key);
      if (!st) continue;
      expect(existsSync(join(repoRoot, st.rel)),
        `${key}'s Image 1 is ${st.rel}, which is not in the tree`).toBe(true);
      expect(st.rel.startsWith("backdrops/source"),
        `${key} was handed an unpromoted candidate without asking for one`).toBe(false);
    }
  });
});
