/* §12.1's licensed harness-level refusal unit tests: refusals the UI cannot
 * emit, exercised through the harness API directly, each with the same
 * asserts — envelope with zero events, a refusal narration line (the exact
 * authored line), scene hash unchanged, paint count unchanged, and the world
 * document deep-equal before/after. Cases needing a doctored world state use
 * a fresh in-page harness with a subscriber counter (no paint = counter 0).
 */
import { test, expect, appUrl, repoRoot } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const narration = JSON.parse(readFileSync(
  join(repoRoot, "fixtures", "demo-study", "narration.json"), "utf8")).lines;

/* Dispatch one intent on the LIVE app harness and return the discipline
 * snapshot. */
async function dispatchLive(page, intent) {
  return await page.evaluate(async (intent) => {
    const h = window.HOLO_APP.harness;
    const before = {
      hash: await window.__T.hashScene(),
      paints: window.HOLO_APP.paints,
      world: JSON.stringify(h.world),
      envelopes: h.envelopes.length
    };
    const env = window.HOLO_APP.dispatch(intent);
    return {
      before,
      after: {
        hash: await window.__T.hashScene(),
        paints: window.HOLO_APP.paints,
        world: JSON.stringify(h.world),
        envelopes: h.envelopes.length
      },
      env: { events: env.events, narration: env.narration ?? null },
      pane: (() => {
        const ps = document.querySelectorAll("#narration p");
        return ps.length ? ps[ps.length - 1].textContent : null;
      })()
    };
  }, intent);
}

function expectRefusal(res, line) {
  expect(res.env.events).toEqual([]);
  expect(res.env.narration).toBe(line);
  expect(res.pane, "refusal line reaches the pane").toBe(res.env.narration);
  expect(res.after.hash, "scene hash unchanged").toBe(res.before.hash);
  expect(res.after.paints, "no paint").toBe(res.before.paints);
  expect(res.after.world, "world unchanged").toBe(res.before.world);
  expect(res.after.envelopes).toBe(res.before.envelopes + 1);
}

/* Dispatch one intent on a FRESH harness over a doctored fixture; assert the
 * subscriber is never invoked and the world is untouched. */
async function dispatchDoctored(page, doctor, intent) {
  return await page.evaluate(({ doctorSrc, intent }) => {
    const fx = window.HOLO_FIXTURE;
    const fixture = window.__T.clone({
      world: fx.world, staging: fx.staging, narration: fx.narration,
      viewstate: fx.viewstate
    });
    (new Function("fixture", doctorSrc))(fixture);
    const h = window.HOLO.harness.create(fixture);
    let paints = 0;
    h.subscribe(() => { paints += 1; });
    const before = JSON.stringify(h.world);
    const env = h.dispatch(intent);
    return {
      env: { events: env.events, narration: env.narration ?? null },
      paints,
      worldUnchanged: JSON.stringify(h.world) === before
    };
  }, { doctorSrc: doctor, intent });
}

function expectDoctoredRefusal(res, line) {
  expect(res.env.events).toEqual([]);
  expect(res.env.narration).toBe(line);
  expect(res.paints, "no paint").toBe(0);
  expect(res.worldUnchanged, "world unchanged").toBe(true);
}

test.describe("harness-level refusals (§8: the picture never changes when the world doesn't)", () => {
  test("live-app refusals: unknown take (key1), unreachable go, static toggle, fixed take, unknown ids", async ({ page }) => {
    await page.goto(appUrl());

    // take key1 while unknown — undrawn, unclickable; the wildcard line
    // (shared with nonexistent targets — no existence leak).
    expectRefusal(await dispatchLive(page, { type: "take", entity: "key1" }),
      narration["take.*.refused_unknown"]);

    // go through the study exit from study/N (wrong facing).
    expectRefusal(await dispatchLive(page, { type: "go", exit: "door_study_hall" }),
      narration["go.door_study_hall.refused_unreachable"]);

    // toggle a stateless entity.
    expectRefusal(await dispatchLive(page, { type: "toggle", entity: "chair1" }),
      narration["toggle.chair1.refused_static"]);

    // take a fixed entity.
    expectRefusal(await dispatchLive(page, { type: "take", entity: "desk1" }),
      narration["take.desk1.refused_fixed"]);

    // bogus ids resolve through the per-intent wildcards.
    expectRefusal(await dispatchLive(page, { type: "toggle", entity: "ghost" }),
      narration["toggle.*.refused_unknown"]);
    expectRefusal(await dispatchLive(page, { type: "go", exit: "door_to_nowhere" }),
      narration["go.*.refused_unknown"]);

    // toggle a stateful entity from the wrong facing.
    expectRefusal(await dispatchLive(page, { type: "toggle", entity: "door1" }),
      narration["toggle.door1.refused_unreachable"]);

    // take a takeable from the wrong room entirely.
    expectRefusal(await dispatchLive(page, { type: "take", entity: "coin1" }),
      narration["take.coin1.refused_unreachable"]);
  });

  test("go through a closed door refuses with the closed line", async ({ page }) => {
    await page.goto(appUrl());
    const res = await dispatchDoctored(page,
      'fixture.viewstate = { location: "study", facing: "E" };',
      { type: "go", exit: "door_study_hall" });
    expectDoctoredRefusal(res, narration["go.door_study_hall.refused_closed"]);
  });

  test("take a known key through a closed drawer refuses as contained", async ({ page }) => {
    await page.goto(appUrl());
    const res = await dispatchDoctored(page,
      'fixture.world.knowledge.player.push("key1");',
      { type: "take", entity: "key1" });
    expectDoctoredRefusal(res, narration["take.key1.refused_contained"]);
  });

  test("take an already-held item refuses as held", async ({ page }) => {
    await page.goto(appUrl());
    const res = await dispatchDoctored(page,
      'fixture.world.relations = fixture.world.relations.filter(r => r[1] !== "note1");' +
      'fixture.world.relations.push(["held_by", "note1", "player"]);',
      { type: "take", entity: "note1" });
    expectDoctoredRefusal(res, narration["take.note1.refused_held"]);
  });

  test("a refused turn narrates the turn wildcard; a valid turn stays silent", async ({ page }) => {
    await page.goto(appUrl());
    const res = await dispatchDoctored(page,
      'fixture.world.locations.push({ id: "cell", facings: ["N"], exits: [] });' +
      'fixture.viewstate = { location: "cell", facing: "N" };',
      { type: "turn", dir: "right" });
    expectDoctoredRefusal(res, narration["turn.*.refused"]);

    const valid = await page.evaluate(() => {
      const env = window.HOLO_APP.harness.dispatch({ type: "turn", dir: "right" });
      return { events: env.events.length, hasNarration: "narration" in env };
    });
    expect(valid.events).toBe(1);
    expect(valid.hasNarration, "valid turn is silent").toBe(false);
  });
});
