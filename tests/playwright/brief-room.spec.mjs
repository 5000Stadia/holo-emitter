/* A room compiled from the period brief (lab/brief): the checks that must always hold. Every pin is
 * reported; nothing stands in a doorway or under a window it would block; the same plan and brief
 * always compile to the same room. Node-side: the compiler, not the picture. */
import { test, expect, repoRoot } from "./helpers.mjs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const load = (p) => JSON.parse(readFileSync(join(repoRoot, p), "utf8"));
const { compileBrief } = await import(pathToFileURL(join(repoRoot, "lab/brief/brief.js")).href);
const plan = load("lab/house/plan.json"), brief = load("lab/brief/manor-1660.json");

test.describe("the muniment room from its brief", () => {
  const out = compileBrief(plan, "muniment_room", brief);
  const all = Object.entries(out.walls).flatMap(([F, es]) => es.map(e => ({ F, ...e })));

  test("every pin is reported, and the plan's two doors are a conflict, not silently closed", () => {
    for (const p of brief.rooms.muniment_room.pins) expect(out.report.map(r => r.pin)).toContain(p.id);
    expect(out.report.find(r => r.pin === "one_way_in").status).toBe("conflict");
    expect(all.filter(e => e.kind === "door")).toHaveLength(2);
  });

  test("no fire: the plan's fireplace is gone; the shell is stone", () => {
    expect(all.some(e => e.kind === "chimneypiece")).toBe(false);
    expect(out.finish).toMatchObject({ walls: "limewash", floor: "flags", ceiling: "vault" });
  });

  test("nothing stands in an opening, and nothing overlaps", () => {
    const span = (e) => e.kind === "press" ? [e.r0, e.r1] : [e.r - (e.width ?? e.w) / 2, e.r + (e.width ?? e.w) / 2];
    const tall = (e) => e.kind === "press" ? e.height : e.kind === "chest" ? e.h : 0.79;
    for (const e of all.filter(e => ["press", "chest", "desk"].includes(e.kind))) {
      const [a, b] = span(e);
      for (const o of all.filter(o => o.F === e.F && (o.kind === "door" || (o.kind === "window" && tall(e) > o.sill))))
        expect(a < o.r1 && b > o.r0, `${e.id} in ${o.id}`).toBe(false);
      for (const o of all.filter(o => o !== e && o.F === e.F && ["press", "chest", "desk"].includes(o.kind))) {
        const [c, d] = span(o); expect(a < d - 1e-6 && b > c + 1e-6, `${e.id} overlaps ${o.id}`).toBe(false);
      }
    }
  });

  test("windows are small, high and barred; the table keeps the world's desk", () => {
    for (const w of all.filter(e => e.kind === "window")) { expect(w.r1 - w.r0).toBeLessThanOrEqual(0.7 + 1e-9); expect(w.sill).toBeGreaterThanOrEqual(1.2); expect(w.grille).toBe(true); }
    expect(all.find(e => e.kind === "desk").id).toBe("desk1");
  });

  test("the same plan and brief compile to the same room", () => {
    const again = compileBrief(plan, "muniment_room", brief);
    expect(JSON.stringify({ ...again, ms: 0 })).toBe(JSON.stringify({ ...out, ms: 0 }));
  });
});
