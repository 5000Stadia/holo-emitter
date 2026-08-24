/* CRITIC PROBE — temporary, deleted after the pass. */
import { test, expect, navUrl, POINTER_VIEWPORT, standAt } from "./helpers.mjs";
const OUT = "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/";

const FL = [
  ["back_stair", "E"], ["back_stair", "S"], ["back_stair", "W"],
  ["great_stair_hall", "N"], ["great_stair_hall", "S"], ["great_stair_hall", "W"],
  ["back_stair_head", "W"], ["back_stair_head", "E"], ["back_stair_head", "S"],
  ["stair_landing", "S"], ["stair_landing", "N"], ["stair_landing", "W"]
];

test("critic: largest single colour inside the flight BODY", async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize(POINTER_VIEWPORT);
  await page.goto(navUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  for (const [loc, f] of FL) {
    await standAt(page, loc, f);
    const m = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const cv = document.getElementById("scene");
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      const fl = (A.metaFor(A.harness.viewstate).stairs || [])[0];
      const inside = (poly, x, y) => {
        let c = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      const rings = fl.hit_polys || [];
      const colours = {};
      let n = 0;
      for (let y = 0; y < cv.height; y += 2) {
        for (let x = 0; x < cv.width; x += 2) {
          let hit = false;
          for (const r of rings) if (r.length >= 3 && inside(r, x, y)) { hit = true; break; }
          if (!hit) continue;
          const i = (y * cv.width + x) * 4;
          const k = d[i] + "," + d[i + 1] + "," + d[i + 2];
          colours[k] = (colours[k] || 0) + 1; n++;
        }
      }
      const top = Object.entries(colours).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return { bodyPx: n * 4, distinct: Object.keys(colours).length,
        top: top.map(([k, v]) => [k, +(100 * v / n).toFixed(1)]),
        framePctTop: +(100 * top[0][1] * 4 / (cv.width * cv.height)).toFixed(1) };
    });
    console.log(`BODYCOLOUR ${loc}/${f} bodyPx=${m.bodyPx} distinct=${m.distinct} topOfBody=${JSON.stringify(m.top)} topOfFrame=${m.framePctTop}%`);
  }
});
