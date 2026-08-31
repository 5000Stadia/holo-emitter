/* playbook.spec.mjs — the facing playbook: which instruction sets each
 * location in each direction prompts.
 *
 * A pure-Node spec in the Playwright runner, like plan.spec, fixtures.spec and
 * validator.spec. Nothing here opens a page: a situation is a property of the
 * MAP, and the whole claim of `tools/playbook.mjs` is that it can be read off
 * the plan before a single pixel exists.
 *
 * WHAT IS PINNED, and why each case is here rather than being a count. Kabe's
 * ruling (2026-08-30) names the overlay as the mechanism — "some may overlay
 * ... but also another set of instructions is prompted if there is a door" — so
 * the cases pinned are the ones where two or three sets compose on one wall,
 * plus the two absences that must NOT tag (no `no-door`, and no situation
 * claimed on a facing whose emitter cannot compose it).
 */
import { test, expect, repoRoot } from "./helpers.mjs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { situationsOf, situationsReport, facingKeys, TAGS, tagKey, EMITTED_BY, GIST }
  from "../../tools/playbook.mjs";
import { loadPack } from "../../tools/pack.mjs";

const PACKS = ["manor", "underground-2", "hospital-3", "cyberpunk-2"];
const planOf = (name) => loadPack(name).plan;

test.describe("the facing playbook", () => {
  test("every tag it returns, in every pack, is one TAGS defines", () => {
    for (const name of PACKS) {
      const plan = planOf(name);
      for (const { key, situations } of situationsReport(plan)) {
        expect(situations.length, `${name} ${key} prompts no instructions at all`).toBeGreaterThan(0);
        for (const t of situations) {
          expect(Object.keys(TAGS), `${name} ${key} returned the undefined tag \`${t}\``)
            .toContain(tagKey(t));
        }
        /* No tag twice: an overlay is a SET of instruction blocks. */
        expect(new Set(situations).size, `${name} ${key} repeats a tag`).toBe(situations.length);
      }
    }
  });

  test("every location in every direction is answered", () => {
    for (const name of PACKS) {
      const plan = planOf(name);
      const keys = facingKeys(plan);
      expect(keys.length, `${name} has no facings`).toBeGreaterThan(0);
      for (const key of keys) expect(situationsOf(plan, key), key).toBeInstanceOf(Array);
    }
  });

  test("TAGS, EMITTED_BY and GIST describe exactly the same vocabulary", () => {
    expect(Object.keys(EMITTED_BY).sort()).toEqual(Object.keys(TAGS).sort());
    expect(Object.keys(GIST).sort()).toEqual(Object.keys(TAGS).sort());
    for (const [tag, [file, fn]] of Object.entries(EMITTED_BY)) {
      expect(file, `${tag} names no file`).toMatch(/^tools\/.+\.mjs$/);
      const src = readFileSync(join(repoRoot, file), "utf8");
      const name = fn.split(/[ (\/]/)[0];
      expect(src, `${tag} points at ${file} \`${name}\`, which is not there`).toContain(name);
    }
  });

  /* ---- the overlays, one pinned case each ---- */

  test("the manor's study/E prompts the door set", () => {
    expect(situationsOf(planOf("manor"), "study/E")).toContain("door");
  });

  test("underground-2 platform/N is a run wall whose corner stands on the left", () => {
    /* The platform's own cell spans x 7 -> 13.4 and its north wall runs on east
       to 19.8 through the full-width open edge `way01`. Facing north the right
       hand points east, so the corner the picture keeps is the WEST one, on the
       left of the frame, and the wall leaves the picture through the right
       edge with no corner and no return wall. */
    const s = situationsOf(planOf("underground-2"), "platform/N");
    expect(s).toContain("run-wall:corner-left");
    expect(s).not.toContain("run-wall:corner-right");
  });

  test("underground-2 platform/E is a deep view painted from the same wall", () => {
    const s = situationsOf(planOf("underground-2"), "platform/E");
    expect(s).toContain("deep-view");
    expect(s).toContain("same-wall-image");
  });

  test("underground-2 platform_far/W overlays the deep view with a door", () => {
    /* Kabe's own example: two instruction sets on one wall, and the door set is
       prompted only because a door is there. */
    const s = situationsOf(planOf("underground-2"), "platform_far/W");
    expect(s).toEqual(expect.arrayContaining(["deep-view", "same-wall-image", "door"]));
  });

  test("underground-2's booking_hall walls all say there is no window", () => {
    const plan = planOf("underground-2");
    for (const f of ["N", "E", "S", "W"]) {
      expect(situationsOf(plan, `booking_hall/${f}`), `booking_hall/${f}`).toContain("no-window");
    }
  });

  test("the manor's entrance_court/S is an open facing, not a wall", () => {
    const s = situationsOf(planOf("manor"), "entrance_court/S");
    expect(s).toContain("open-facing");
    expect(s).not.toContain("enclosed");
    /* [FOUND] Its `deepViewOf` match is degenerate — the close facing is open
       too and carries no `camera_wall_m`, so `sameWallImageFor` throws on it.
       The index refuses to claim an instruction set the emitter cannot compose. */
    expect(s).not.toContain("same-wall-image");
  });

  test("the manor's entrance_approach/N carries the open-side set", () => {
    expect(situationsOf(planOf("manor"), "entrance_approach/N")).toContain("open-side");
  });

  /* ---- the absences, which is where the ruling is explicit ---- */

  test("a facing with no door prompts no door processing", () => {
    for (const name of PACKS) {
      const plan = planOf(name);
      for (const { key, situations } of situationsReport(plan)) {
        expect(situations.some((t) => /^no-door/.test(t)), `${key} invented an absence tag`).toBe(false);
      }
    }
  });

  test("exactly one facing-type tag and at most one lead/follower tag per facing", () => {
    for (const name of PACKS) {
      const plan = planOf(name);
      for (const { key, situations } of situationsReport(plan)) {
        const types = situations.filter((t) => t === "enclosed" || t === "open-facing");
        expect(types.length, `${name} ${key} type tags: ${types.join(",")}`).toBe(1);
        const order = situations.filter((t) => t === "lead" || t === "follower");
        expect(order.length, `${name} ${key} order tags: ${order.join(",")}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("every room paints exactly one lead wall", () => {
    for (const name of PACKS) {
      const plan = planOf(name);
      const leads = new Map();
      for (const { key, situations } of situationsReport(plan)) {
        const loc = key.split("/")[0];
        if (situations.includes("lead")) leads.set(loc, (leads.get(loc) || 0) + 1);
      }
      for (const r of plan.rooms || []) {
        if (!Object.keys(r.facings || {}).length) continue;
        expect(leads.get(r.id), `${name} ${r.id} leads`).toBe(1);
      }
    }
  });

  test("a blank facing carries nothing else that stands on a wall", () => {
    const STANDING = ["door", "window", "fireplace", "open-side"];
    for (const name of PACKS) {
      for (const { key, situations } of situationsReport(planOf(name))) {
        if (!situations.includes("blank")) continue;
        for (const s of STANDING) {
          expect(situations, `${name} ${key} is blank and ${s}`).not.toContain(s);
        }
      }
    }
  });

  test("the report is stable — the same plan gives the same tags twice", () => {
    const plan = planOf("underground-2");
    expect(situationsReport(plan)).toEqual(situationsReport(plan));
  });

  test("an unknown room or facing refuses by name", () => {
    const plan = planOf("underground-2");
    expect(() => situationsOf(plan, "nowhere/N")).toThrow(/no room `nowhere`/);
    expect(() => situationsOf(plan, "platform/Q")).toThrow(/no facing Q/);
  });

  test("design/playbook-facings.md indexes every tag and nothing else", () => {
    const doc = readFileSync(join(repoRoot, "design", "playbook-facings.md"), "utf8");
    for (const tag of Object.keys(TAGS)) {
      expect(doc, `the playbook document does not carry \`${tag}\``).toContain(`\`${tag}\``);
    }
    /* Nothing else: every backticked tag-shaped token in the table is a real
       tag. The table's rows are the only place a tag name appears in code font
       at the start of a line. */
    const rows = doc.split("\n").filter((l) => /^\| `/.test(l));
    expect(rows.length).toBe(Object.keys(TAGS).length);
    for (const r of rows) {
      const tag = r.match(/^\| `([^`]+)`/)[1];
      expect(Object.keys(TAGS), `the document names \`${tag}\`, which TAGS does not define`).toContain(tag);
    }
  });
});
