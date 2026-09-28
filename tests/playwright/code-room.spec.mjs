/* The code room's world (lab/painted/muniment_room/world/): the M0 promise, a drawer that opens and a
 * key you did not know existed until it did, carried by the same harness (§8) as the painted demo.
 * Node-side: the rules, not the picture (the page's projection of them is checked by hand). */
import { test, expect, repoRoot } from "./helpers.mjs";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const harnessApi = require(join(repoRoot, "src/harness.js"));
const dir = join(repoRoot, "lab/painted/muniment_room/world");
const fixture = () => Object.fromEntries(["world", "staging", "narration", "viewstate"].map(n => [n, JSON.parse(readFileSync(join(dir, `${n}.json`), "utf8"))]));

test.describe("the code room's drawer and key", () => {
  test("the key is not in the player's world until the drawer is first opened", () => {
    const h = harnessApi.create(fixture());
    expect(h.world.knowledge.player).not.toContain("key1");
    const refused = h.dispatch({ type: "take", entity: "key1" });
    expect(refused.events).toEqual([]);
    expect(refused.narration).toBe(fixture().narration.lines["take.*.refused_unknown"]);
    const open = h.dispatch({ type: "toggle", entity: "desk1" });
    expect(open.events).toEqual([{ type: "state", entity: "desk1", to: "open" }, { type: "knowledge_add", entity: "key1" }]);
    expect(open.narration).toBe(fixture().narration.lines["toggle.desk1.open_reveal"]);
  });

  test("the key can be taken only while the drawer is open, and then it is held", () => {
    const h = harnessApi.create(fixture());
    h.dispatch({ type: "toggle", entity: "desk1" });
    h.dispatch({ type: "toggle", entity: "desk1" });                 // shut again
    expect(h.dispatch({ type: "take", entity: "key1" }).events).toEqual([]);
    h.dispatch({ type: "toggle", entity: "desk1" });
    const take = h.dispatch({ type: "take", entity: "key1" });
    expect(take.events).toContainEqual({ type: "relation_add", rel: ["held_by", "key1", "player"] });
    expect(h.world.relations).toContainEqual(["held_by", "key1", "player"]);
    expect(h.world.relations).not.toContainEqual(["in", "key1", "desk1"]);
    expect(h.dispatch({ type: "take", entity: "key1" }).events).toEqual([]);   // already held
  });

  test("a second opening reveals nothing new", () => {
    const h = harnessApi.create(fixture());
    h.dispatch({ type: "toggle", entity: "desk1" }); h.dispatch({ type: "toggle", entity: "desk1" });
    const again = h.dispatch({ type: "toggle", entity: "desk1" });
    expect(again.events).toEqual([{ type: "state", entity: "desk1", to: "open" }]);
  });

  test("every line the room can say is written", () => {
    const f = fixture();
    for (const key of harnessApi.enumerateNarrationDomain(f.world, f.staging)) expect(f.narration.lines, key).toHaveProperty([key]);
  });
});
