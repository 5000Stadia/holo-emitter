/* [Row 27] THE PAINTED DOOR AND THE CLICK TARGET ARE ONE RECTANGLE.
 *
 * Blueprint §11: "The painted door opening must coincide with the door leaf's
 * §4 placement rectangle… If the two diverge, the picture shows a doorway in
 * one place and accepts the click in another." That was false on the shipped
 * manor until this row — the promotion PROJECTED each opening from the plan
 * onto a painting that had put its door somewhere else — and the Captain found
 * it by walking the building: "library door doesnt match up", "Multiple doors
 * dont match up".
 *
 * Three things are checked here and each is checked where the defect lives:
 * the instrument, against a rectangle a human read by hand off a control
 * frame; the corpus, which may not carry a projected door on a painted wall
 * again; and the running page, where a click in the middle of the painted door
 * has to travel.
 */
import { test, expect, repoRoot, navUrl, POINTER_VIEWPORT } from "./helpers.mjs";
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, rmSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";

const DOOR_MEASURE = join(repoRoot, "design", "plan-draft", "measured", "door_measure.py");

/** Every promoted facing whose meta carries a door, with that meta. */
function promotedDoorWalls() {
  const out = [];
  for (const loc of readdirSync(join(repoRoot, "backdrops"))) {
    const d = join(repoRoot, "backdrops", loc);
    if (loc === "source" || !statSync(d).isDirectory()) continue;
    for (const f of readdirSync(d)) {
      if (!/^[NESW]\.meta\.json$/.test(f)) continue;
      const meta = JSON.parse(readFileSync(join(d, f), "utf8"));
      if ((meta.openings || []).some((o) => o.kind === "door")) out.push([loc, f[0], meta]);
    }
  }
  return out;
}

test.describe("row 27 — the painted door governs", () => {
  test("the detector reads the control frame's door where a human read it", () => {
    /* THE CONTROL. `study/E` cand-6's door was read by hand off one-pixel
       luminance profiles during the standing-eye wave and recorded in
       `cand6/study-E.json` — `opening_x0_px` 673, `opening_x1_px` 860,
       `opening_y0_px` 310, and the wall's own floor line for its foot. Nothing
       about that reading is in the detector's inputs: it gets the frame, the
       corners, the floor line, the scale and the ruled storey, and finds the
       maximally stable dark run.

       The tolerance is 6 px, which is 3 % of that door's 187 px width and
       about a centimetre and a half of wall at its 204 px/m scale — inside
       what two people reading the same profile would disagree by, and far
       under the 76 px the plan-projected rectangle was out by on the wall the
       Captain named. */
    const REF = JSON.parse(readFileSync(join(repoRoot, "design", "plan-draft",
      "measured", "cand6", "study-E.json"), "utf8"))._measured_px;
    const dir = mkdtempSync(join(tmpdir(), "holo-door-control-"));
    try {
      /* A COPY OF THE MEASUREMENT, because the tool writes its reading back
         into the document it was given and this case must not edit the corpus
         it is measuring against. */
      const rel = join("design", "plan-draft", "measured", "cand6", "study-E.json");
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      cpSync(join(repoRoot, rel), join(dir, rel));
      execFileSync("python3", [DOOR_MEASURE, "--facing", "study/E", "--round", "cand6",
        "--candidate", "backdrops/source/study-E/cand-6.png",
        "--doc", join(dir, rel)], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      const got = JSON.parse(readFileSync(join(dir, rel), "utf8"))._measured_px.openings;
      expect(got.length, "the control frame has exactly one way through in it").toBe(1);
      const TOL = 6;
      expect(Math.abs(got[0].x0_px - REF.opening_x0_px),
        `left jamb: read ${got[0].x0_px}, the hand read ${REF.opening_x0_px}`)
        .toBeLessThanOrEqual(TOL);
      expect(Math.abs(got[0].x1_px - REF.opening_x1_px),
        `right jamb: read ${got[0].x1_px}, the hand read ${REF.opening_x1_px}`)
        .toBeLessThanOrEqual(TOL);
      expect(Math.abs(got[0].y0_px - REF.opening_y0_px),
        `head: read ${got[0].y0_px}, the hand read ${REF.opening_y0_px}`)
        .toBeLessThanOrEqual(TOL);
      expect(got[0].y1_px, "the foot is the wall's own floor line")
        .toBe(REF.opening_y1_px);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("no promoted wall carries a door the plan projected onto it", () => {
    /* THE CORPUS INVARIANT this row establishes, asserted over whatever is in
       the store rather than over a list somebody typed: a painted wall's door
       is measured off the painting or the wall is not promoted. Before row 27
       every one of these was `measured: false`. */
    const walls = promotedDoorWalls();
    expect(walls.length, "no promoted wall carries a door at all").toBeGreaterThan(0);
    for (const [loc, f, meta] of walls) {
      for (const o of meta.openings) {
        if (o.kind !== "door") continue;
        expect(o.measured,
          `${loc}/${f}'s opening ${o.id} is projected from the plan onto a painting — §11 says the painted opening IS the click target`)
          .toBe(true);
        expect(o.x >= 0 && o.x + o.w <= 1536 && o.y >= 0 && o.y + o.h <= 1024,
          `${loc}/${f}'s opening ${o.id} at ${o.x},${o.y} ${o.w}×${o.h} runs off the frame`)
          .toBe(true);
      }
    }
  });

  test.describe("on the running page", () => {
    test.use({ viewport: POINTER_VIEWPORT });

    const WORLD = JSON.parse(readFileSync(
      join(repoRoot, "fixtures", "nav-manor", "world.json"), "utf8"));
    const ORDER = ["N", "E", "S", "W"];

    /** Intents that walk the player from where they are standing to `loc`
        facing `facing`, out of the world's own exits rather than typed.

        [Row 39] `from` used to be `START` and could not be anything else,
        which forced a full page reload per wall: twenty-one promoted door
        walls, twenty-one loads of a 36 MB baked store, and this case sat a few
        seconds under its own 90 s timeout until the corpus gained one more
        wall and went over it on both engines. The walk is the same walk from
        wherever the last one left the player, so the page is booted once. */
    function intentsTo(from, loc, facing) {
      const seen = new Map([[from.location, []]]);
      const q = [from.location];
      let walk = null;
      while (q.length && walk === null) {
        const at = q.shift();
        if (at === loc) { walk = seen.get(at); break; }
        for (const ex of (WORLD.locations.find((l) => l.id === at) || {}).exits || []) {
          if (seen.has(ex.to)) continue;
          seen.set(ex.to, seen.get(at).concat([ex]));
          q.push(ex.to);
        }
      }
      if (walk === null) throw new Error(`no route to ${loc}`);
      const out = [];
      let f = from.facing;
      for (const ex of walk) {
        while (f !== ex.facing) { out.push({ type: "turn", dir: "right" }); f = ORDER[(ORDER.indexOf(f) + 1) % 4]; }
        out.push({ type: "go", exit: ex.id });
        f = ex.arrive_facing;
      }
      while (f !== facing) { out.push({ type: "turn", dir: "right" }); f = ORDER[(ORDER.indexOf(f) + 1) % 4]; }
      return out;
    }

    /** Boot the page once; `stand` then walks from wherever it left off. */
    async function boot(page) {
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      return page.evaluate(() => window.HOLO_APP.harness.viewstate);
    }

    async function stand(page, from, loc, facing) {
      return page.evaluate((list) => {
        const A = window.HOLO_APP;
        for (const it of list) A.dispatch(it);
        return { vs: A.harness.viewstate, apertures: A.apertureList() };
      }, intentsTo(from, loc, facing));
    }

    test("the page's go target is the measured rectangle, not the plan's", async ({ page }) => {
      /* ELEVEN COLD LOADS, and the default 90 s was already inside the noise:
         `stand()` reloads the page for every promoted wall so each one is
         judged from a boot rather than from wherever the last one left the
         viewer, and a cold `file://` boot of this manor is 3–5 s on its own.
         [Row 25] The composite's rewrite added about a tenth to a walk, which
         is what pushed a marginal budget over on a loaded machine; the check
         itself is unchanged and still walks to every wall. */
      test.setTimeout(240_000);
      /* THE INTEGRATION THE DOCUMENT CANNOT SEE. A meta can carry a measured
         opening and the page can still hand `go` a rectangle it derived some
         other way; this walks to the wall and asks the page itself. */
      const walls = promotedDoorWalls().filter(([loc]) =>
        WORLD.locations.some((l) => l.id === loc));
      expect(walls.length).toBeGreaterThan(0);
      let where = await boot(page);
      for (const [loc, f, meta] of walls) {
        const { vs, apertures } = await stand(page, where, loc, f);
        where = vs;
        expect(`${vs.location}/${vs.facing}`).toBe(`${loc}/${f}`);
        for (const o of meta.openings) {
          if (o.kind !== "door") continue;
          const a = apertures.find((z) => z.via === o.id || z.via === o.via);
          expect(a, `${loc}/${f}: the page draws no way through for ${o.id}`).toBeTruthy();
          for (const k of ["x", "y", "w", "h"]) {
            expect(Math.abs(a[k] - o[k]),
              `${loc}/${f} ${o.id}: the page's ${k} is ${a[k]}, the measured meta's is ${o[k]}`)
              .toBeLessThan(0.5);
          }
        }
      }
    });

    test("a real click in the middle of the painted door travels", async ({ page }) => {
      /* §11 made operational, and the Captain's sentence turned into a check:
         the point a player aims at is the middle of the door they can see, and
         that click has to be travel rather than a refusal about a wall. */
      const { vs, apertures } = await stand(page, await boot(page), "library", "E");
      expect(`${vs.location}/${vs.facing}`).toBe("library/E");
      expect(apertures.length).toBe(1);
      const a = apertures[0];
      await page.locator("#scene").click({
        position: { x: a.x + a.w / 2, y: a.y + a.h / 2 }
      });
      const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(after.location,
        "a click in the middle of the door the library paints walks through it")
        .toBe("great_hall");
    });

    test("[row 43] the go target is the traced polygon, not its bounding box", async ({ page }) => {
      /* THE RECTANGLE IS THE BOUNDING BOX OF THE APERTURE, NOT THE APERTURE.
         `aperture_trace.py` traces the frame's inside edge and the promotion
         writes it as `polygon` with `polygon_used: true`; `x/y/w/h` are then
         that loop's box, so every reader that only knows a rectangle keeps
         working — and the page's `go` target must not be one of them. On
         `buttery_pantry/S` the box comes out 49 px wider than the void
         `door_measure` read, and that width is real wall on the reveal side.

         The polygon is doctored onto the page rather than taken from the
         store, because a case that depends on which walls happen to carry a
         traced excursion goes quiet the day one is re-promoted. What is under
         test is the RULE, and the shape is chosen so the two answers cannot
         agree: a bite out of the top middle of the opening, well inside the
         bounding box and well outside the aperture. */
      const { vs } = await stand(page, await boot(page), "library", "E");
      expect(`${vs.location}/${vs.facing}`).toBe("library/E");
      const probe = await page.evaluate(() => {
        const A = window.HOLO_APP;
        const meta = A.backdrops["library/E"].meta;
        const op = meta.openings.find((o) => o.kind === "door");
        const x = op.x, y = op.y, w = op.w, h = op.h;
        /* A U: the top middle third, down to 40 % of the height, is not the
           aperture. Its bounding box is the rectangle, exactly as a promoted
           polygon's is. */
        op.polygon = [[x, y], [x + w * 0.34, y], [x + w * 0.34, y + h * 0.40],
          [x + w * 0.66, y + h * 0.40], [x + w * 0.66, y], [x + w, y],
          [x + w, y + h], [x, y + h]];
        op.polygon_used = true;
        const inside = { x: x + w * 0.5, y: y + h * 0.75 };
        const notch = { x: x + w * 0.5, y: y + h * 0.15 };
        const a = A.apertureList().find((z) => z.via === op.id || z.via === op.via);
        const at = (p) => (A.apertureAt(p) ? A.apertureAt(p).exit : null);
        return {
          inside: inside, notch: notch,
          poly: a ? a.poly : null, polys: a ? a.polys : null,
          box: a ? { x: a.x, y: a.y, w: a.w, h: a.h } : null,
          at_inside: at(inside), at_notch: at(notch)
        };
      });
      expect(probe.poly, "the aperture carries the traced loop").toBeTruthy();
      expect(probe.poly.length).toBe(8);
      expect(probe.polys, "and the hit region IS that loop").toEqual([probe.poly]);
      expect(probe.at_inside,
        "a point inside the traced aperture is a way through").toBeTruthy();
      expect(probe.at_notch,
        "a point inside the bounding box but outside the traced aperture is wall")
        .toBeNull();
      /* AND THE REAL CLICK AGREES WITH THE RESOLVER. The two have diverged
         before — row 21's plank stood in void because the leaf, the opening,
         the hit region and the keyboard control were four readings of one
         document — so the pointer is put on both points and the page is asked
         where it now stands. */
      await page.locator("#scene").click({ position: probe.notch });
      expect((await page.evaluate(() => window.HOLO_APP.harness.viewstate)).location,
        "a click on the bounding box outside the aperture does not travel")
        .toBe("library");
      await page.locator("#scene").click({ position: probe.inside });
      expect((await page.evaluate(() => window.HOLO_APP.harness.viewstate)).location,
        "a click inside the traced aperture does").toBe("great_hall");
    });
  });
});
