import { test, expect, appUrl, navUrl, gridExpectations } from "./helpers.mjs";

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

  /* [Row 21, round 4] AND THE WORLD THE LINK ACTUALLY SERVES. Every case in
   * this file opens `appUrl()`, which since row 21 means `?world=demo-study` —
   * so the painted, empty world the BARE URL boots had no §12.2 coverage at
   * all, on a row whose done clause asks for §12.2 green on the painted metas.
   * It was satisfied through the furnished world, where `study/N` is also
   * painted; that is true and it is not the same claim. Two cold loads, all
   * eight facings, and the same purity assertion the demo world answers to. */
  test("§12.2 first clause on the painted world the bare URL boots", async ({ page, context }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const facings = async (p) => await p.evaluate(async () => {
      const out = {};
      for (const location of ["study", "hall"]) {
        for (const facing of ["N", "E", "S", "W"]) {
          const h1 = await window.__T.hashCanvas(window.__T.renderDirect({ location, facing }));
          const h2 = await window.__T.hashCanvas(window.__T.renderDirect({ location, facing }));
          out[location + "/" + facing] = [h1, h2];
        }
      }
      out.boot = [await window.__T.hashScene(), null];
      return out;
    });
    const first = await facings(page);
    for (const [key, [h1, h2]] of Object.entries(first)) {
      if (h2 !== null) expect(h1, `${key} renders hash-stable in the painted world`).toBe(h2);
    }
    expect(first.boot[0], "the booted canvas is a direct render of the same inputs")
      .toBe(first["study/N"][0]);
    const page2 = await context.newPage();
    await page2.goto(navUrl());
    await page2.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const second = await facings(page2);
    await page2.close();
    for (const key of Object.keys(first)) {
      expect(second[key][0], `${key} is a different picture on a second cold load`)
        .toBe(first[key][0]);
    }
    /* And the painting is genuinely in it: the one admitted wall must not hash
       equal to the grid its own room draws on every other facing. */
    expect(first["study/N"][0], "study/N is painted and study/W is not")
      .not.toBe(first["study/W"][0]);
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
    /* study/S, because the standing-eye wave promoted study/N, study/E AND
       study/W, and this clause is about the facing that has no asset. It moved
       here from study/W, which moved here from study/N at row 21 for the same
       reason each time: until a painting existed the clause could not
       discriminate — every facing rendered the grid, so "renders the grid" was
       true of a renderer that had never heard of a backdrop. The facing that
       does have one is asserted beside it, below. study/S is the study's
       window wall, unadmitted by the cand-6 gate (its chair-rail is not drawn
       and no scale could be issued), with both corners in frame, which is the
       structure this reads under `backdrop_only`. */
    const exp = gridExpectations("study", "S");
    const res = await page.evaluate(async (exp) => {
      const opt = { backdrop_only: true };
      const c1 = window.__T.renderDirect({ location: "study", facing: "S" }, null, opt);
      const c2 = window.__T.renderDirect({ location: "study", facing: "S" }, null, opt);
      return {
        h1: await window.__T.hashCanvas(c1),
        h2: await window.__T.hashCanvas(c2),
        structure: window.__T.gridStructure(c1, exp)
      };
    }, exp);
    expect(res.h1, "grid renders deterministically").toBe(res.h2);
    expect(res.structure.failures, "grid is structurally the grid, not a non-blank smear").toEqual([]);
  });

  /* [Row 21] THE OTHER HALF OF THE SAME CLAUSE, and it did not exist until a
     painting did: a facing that HAS a backdrop asset must render the painting,
     not the grid. Read as pixels rather than as a promise — the painted frame
     carries none of the grid's structure (no eye line across the full width,
     no corner verticals where the grid would stand them) and it is not the
     grid's own picture. A renderer that ignored `entry.image` would pass every
     clause this project had before this row. */
  test("§12.8 painted clause: a facing WITH a backdrop asset renders the painting, not the grid", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations("study", "N");
    const res = await page.evaluate(async (exp) => {
      const opt = { backdrop_only: true };
      const painted = window.__T.renderDirect({ location: "study", facing: "N" }, null, opt);
      const meta = window.HOLO_APP.metaFor({ location: "study", facing: "N" });
      const grid = document.createElement("canvas");
      grid.width = painted.width; grid.height = painted.height;
      /* The same facing drawn with its image withheld: the grid it WOULD have
         drawn. Same meta, same document, one difference. */
      window.HOLO.renderer.render(grid, window.HOLO_APP.harness.world,
        window.HOLO_APP.harness.staging, window.HOLO_APP.library,
        { "study/N": { meta: meta } }, { location: "study", facing: "N" }, opt);
      const px = (c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const a = px(painted), b = px(grid);
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (Math.abs(a[i] - b[i]) > 8 || Math.abs(a[i + 1] - b[i + 1]) > 8) diff++;
      }
      return {
        diff,
        total: a.length / 4,
        paintedIsPainted: window.HOLO_APP.metaFor({ location: "study", facing: "N" }).measured === true,
        structure: window.__T.gridStructure(painted, exp)
      };
    }, exp);
    expect(res.paintedIsPainted, "study/N resolves to the MEASURED backdrop meta").toBe(true);
    expect(res.diff / res.total,
      "the painted frame is a different picture from the grid the same facing would draw")
      .toBeGreaterThan(0.5);
    expect(res.structure.failures.length,
      "and it is not the grid's own structure: no eye line, no corner verticals where the grid stands them")
      .toBeGreaterThan(0);
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
