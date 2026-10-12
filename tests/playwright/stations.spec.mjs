// Stations (Kabe, 2026-10-12: "make teleport locations that it can induce"): a tester is set down at what it is to try,
// not steered there by words. Every station of the case's house sets you down: on floor your body can stand on, in the
// room it names, a person's or a thing's at least most of its distance off and facing it.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("every station of the case sets you down where you can stand, facing what it names", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "where a station sets you is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 390, height: 664 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0&stations`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(() => {
    const list = window.__stations(), bad = [], c = window.__camera, groups = {};
    for (const s of list) { groups[s.group] = (groups[s.group] || 0) + 1;
      const to = window.__go(s.id); if (!to) { bad.push(`${s.id}: no stand`); continue; }
      // a person or a thing: within reach of it (codex, b585fead: a thing in a room not built yet had set you down in another)
      if (s.group === "People" || s.group === "Things") { let at = null; const id = s.id.split(":")[1];
        if (s.group === "People") window.__scene.traverse(o => { if (o.userData?.presence === id) { at = new window.__THREE.Vector3(); o.getWorldPosition(at); } });
        let box = null; if (s.group === "Things") { const b = window.__manor.things.find(q => q.story === id); if (b) { b.node.updateWorldMatrix(true, true); box = new window.__THREE.Box3().setFromObject(b.node); at = box.getCenter(new window.__THREE.Vector3()); } }
        // near enough to reach, and (codex, bd64e68c: pressed into a bed's hangings) clear of it, so it is seen whole
        const d = at && Math.hypot(at.x - to.x, -at.z - to.y), gap = box ? Math.hypot(Math.max(box.min.x - to.x, 0, to.x - box.max.x), Math.max(box.min.z + to.y, 0, -to.y - box.max.z)) : d;
        if (!(d < 4)) bad.push(`${s.id}: ${d == null ? "not found" : `${d.toFixed(1)} m off`}`);
        else if (!(gap > 0.6)) bad.push(`${s.id}: ${gap.toFixed(2)} m from it`); } }
    return { n: list.length, groups, bad, select: !!document.getElementById("stations") };
  });
  expect(r.select, "?stations shows the Go to list").toBe(true);
  expect(r.groups.People, "a station for each of the case's people").toBe(4);
  expect(r.groups.Things, "a station for each of the case's things").toBeGreaterThanOrEqual(20);
  expect(r.groups.Rooms, "a station for every room").toBeGreaterThanOrEqual(30);
  expect(r.bad, "every station sets you down").toEqual([]);
  // no one else between you and a person (codex, bd64e68c: late in the case Daniel stood between the hall's door and Dame Anne):
  // Daniel set down in the hall a metre before her, on the door's line, and her station still faces her with nobody between
  const sight = await page.evaluate(() => { const P = (id) => { let g = null; window.__scene.traverse(o => { if (o.userData?.presence === id) g = o; }); return g; };
    const anne = P("anne"), dan = P("daniel"), a = new window.__THREE.Vector3(); anne.getWorldPosition(a);
    const o = window.__plan.openings.find(o => o.rect && o.joins.includes("great_hall")), dx = (o.rect.x0 + o.rect.x1) / 2 - a.x, dy = (o.rect.y0 + o.rect.y1) / 2 + a.z, L = Math.hypot(dx, dy);
    const host = dan.parent; let root = dan; while (root.parent && root.parent !== window.__scene) root = root.parent;
    root.position.set(a.x + dx / L * 1.0, a.y, a.z - dy / L * 1.0); root.updateMatrixWorld(true);
    const to = window.__go("person:anne"), dw = new window.__THREE.Vector3(); dan.getWorldPosition(dw);
    const sx = a.x - to.x, sy = -a.z - to.y, L2 = sx * sx + sy * sy, u = Math.max(0, Math.min(1, ((dw.x - to.x) * sx + (-dw.z - to.y) * sy) / L2));
    return { to: !!to, miss: Math.hypot(to.x + sx * u - dw.x, to.y + sy * u + dw.z) }; });
  expect(sight.to, "Dame Anne's station with Daniel before her").toBe(true);
  expect(sight.miss, "and Daniel is not between you and her").toBeGreaterThan(0.6);
  // ?go= at walkable: Daniel's, in his closet, at least a metre off
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0&go=person:daniel`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD }); await page.waitForTimeout(500);
  const d = await page.evaluate(() => { const c = window.__camera; let at = null; window.__scene.traverse(o => { if (o.userData?.presence === "daniel") { at = new window.__THREE.Vector3(); o.getWorldPosition(at); } });
    return { where: document.querySelector("#where .n")?.textContent, off: Math.hypot(at.x - c.position.x, at.z - c.position.z) }; });
  expect(d.where, "?go=person:daniel sets you in his room").toMatch(/CLOSET/i);
  expect(d.off, "and stands you off him").toBeGreaterThan(1);
  expect(errs).toEqual([]);
  await page.close();
});
