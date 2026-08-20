import { test, expect, repoRoot, bake } from "./helpers.mjs";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtureDir = join(repoRoot, "fixtures", "demo-study");

test.describe("fixtures", () => {
  test("bake staleness: the committed fixture.js byte-equals a fresh bake of the .json truth", () => {
    const scratch = mkdtempSync(join(tmpdir(), "holo-bake-"));
    try {
      const out = join(scratch, "fixture.js");
      bake(repoRoot, ["--fixture-dir", fixtureDir, "--out", out]);
      const fresh = readFileSync(out);
      const committed = readFileSync(join(fixtureDir, "fixture.js"));
      expect(
        fresh.equals(committed),
        "stale bake — run: node tools/bake-fixtures.mjs"
      ).toBe(true);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  test("fixture shape: schema ids present, viewstate holds exactly location and facing", () => {
    const world = JSON.parse(readFileSync(join(fixtureDir, "world.json"), "utf8"));
    const staging = JSON.parse(readFileSync(join(fixtureDir, "staging.json"), "utf8"));
    const narration = JSON.parse(readFileSync(join(fixtureDir, "narration.json"), "utf8"));
    const viewstate = JSON.parse(readFileSync(join(fixtureDir, "viewstate.json"), "utf8"));

    expect(world.schema).toBe("holo-emitter/0.1");
    expect(staging.schema).toBe("holo-emitter-staging/0.1");
    expect(narration.schema).toBe("holo-emitter-narration/0.1");
    // Boot viewstate is neither truth nor staging: exactly these two keys.
    expect(Object.keys(viewstate).sort()).toEqual(["facing", "location"]);
    expect(typeof viewstate.location).toBe("string");
    expect(typeof viewstate.facing).toBe("string");
    // (The full coordinate/fact split check is row 2's validator.)
  });
});
