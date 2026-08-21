import { test, expect, appUrl, gridExpectations } from "./helpers.mjs";

test.describe("determinism and purity", () => {
  test("direct render, both rooms: all eight viewstates hash-stable; page path adds nothing", async ({ page }, testInfo) => {
    await page.goto(appUrl());
    const results = await page.evaluate(async () => {
      const out = {};
      for (const location of ["study", "hall"]) {
        for (const facing of ["N", "E", "S", "W"]) {
          const h1 = await window.__T.hashCanvas(window.__T.renderDirect({ location, facing }));
          const h2 = await window.__T.hashCanvas(window.__T.renderDirect({ location, facing }));
          out[location + "/" + facing] = { h1, h2 };
        }
      }
      return out;
    });
    for (const [key, { h1, h2 }] of Object.entries(results)) {
      expect(h1, `${key} renders hash-stable`).toBe(h2);
    }

    // The booted study/N canvas equals a direct render of the same inputs.
    const booted = await page.evaluate(() => window.__T.hashScene());
    expect(results["study/N"].h1).toBe(booted);

    // Same-facing cross-room equality is recorded, not asserted either way
    // (the glyph carries facing, not location; licensed by the done clause).
    for (const f of ["N", "E", "S", "W"]) {
      const equal = results["study/" + f].h1 === results["hall/" + f].h1;
      const line = `recorded: study/${f} vs hall/${f}: ${equal ? "hash-equal" : "distinct"}`;
      testInfo.annotations.push({ type: "recorded", description: line });
      console.log(line); // annotations never reach the list reporter's output
    }
  });

  test("§12.2 first clause: identical fixture + viewstate on two cold loads → identical scene hash", async ({ page, context }) => {
    await page.goto(appUrl());
    const h1 = await page.evaluate(() => window.__T.hashScene());
    const page2 = await context.newPage();
    await page2.goto(appUrl());
    const h2 = await page2.evaluate(() => window.__T.hashScene());
    await page2.close();
    expect(h2).toBe(h1);
  });

  test("§12.2 first clause, extended (row 2): swap and mid-part states hash equal across two fresh loads", async ({ page, context }) => {
    // Fresh loads also witness placeholder build-order determinism, on the
    // states clause 2's settled walkthrough path never covers: an open-door
    // swap render and a part_t = 0.5 mid-state render.
    const capture = async (p) => await p.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const openDoor = window.__T.clone(fx.world);
      openDoor.entities.find((e) => e.id === "door1").state = "open";
      return {
        boot: await window.__T.hashScene(),
        openDoorE: await window.__T.hashCanvas(window.__T.renderW(
          openDoor, fx.staging, { location: "study", facing: "E" }, {})),
        midPart: await window.__T.hashCanvas(window.__T.renderW(
          fx.world, fx.staging, { location: "study", facing: "N" },
          { part_t: { desk1: 0.5 } }))
      };
    });
    await page.goto(appUrl());
    const a = await capture(page);
    const page2 = await context.newPage();
    await page2.goto(appUrl());
    const b = await capture(page2);
    await page2.close();
    expect(b).toEqual(a);
  });

  test("§12.8 grid clause: a facing with no backdrop asset renders the grid deterministically and structurally", async ({ page }) => {
    await page.goto(appUrl());
    /* study/N carries the desk and the chair, so the grid's own structure is
       read under `backdrop_only` — the layer §7 puts the doorway in, and the
       one row 11's corners belong to. */
    const exp = gridExpectations("study", "N");
    const res = await page.evaluate(async (exp) => {
      const opt = { backdrop_only: true };
      const c1 = window.__T.renderDirect({ location: "study", facing: "N" }, null, opt);
      const c2 = window.__T.renderDirect({ location: "study", facing: "N" }, null, opt);
      return {
        h1: await window.__T.hashCanvas(c1),
        h2: await window.__T.hashCanvas(c2),
        structure: window.__T.gridStructure(c1, exp)
      };
    }, exp);
    expect(res.h1, "grid renders deterministically").toBe(res.h2);
    expect(res.structure.failures, "grid is structurally the grid, not a non-blank smear").toEqual([]);
  });

  test("purity: same inputs into two canvases hash equal; inputs are not mutated", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const args = [fx.world, fx.staging, window.__T.lib(), {}, { location: "hall", facing: "S" }, {}];
      const snapBefore = JSON.stringify(args);
      const mk = () => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        return c;
      };
      const h1 = await window.__T.hashCanvas(
        window.HOLO.renderer.render(mk(), ...args));
      const h2 = await window.__T.hashCanvas(
        window.HOLO.renderer.render(mk(), ...args));
      return { h1, h2, unmutated: JSON.stringify(args) === snapBefore };
    });
    expect(res.h1).toBe(res.h2);
    expect(res.unmutated, "render does not mutate its inputs").toBe(true);
  });
});
