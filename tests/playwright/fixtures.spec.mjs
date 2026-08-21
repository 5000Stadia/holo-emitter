import { test, expect, repoRoot, bake } from "./helpers.mjs";
import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtureDir = join(repoRoot, "fixtures", "demo-study");

/* Extract the first fenced ```json block under a given "## N. Heading" in
 * blueprint.md, up to the next "## " heading. Throws (never returns null or
 * an empty match) on anything it cannot find or parse — a guard that goes
 * quiet when its input breaks is the failure mode this project has already
 * paid for twice (design/surface-strings.md's parser states the same rule
 * for its own fenced blocks). */
function extractBlueprintJsonBlock(md, headingPrefix) {
  const headingRe = new RegExp("^## " + headingPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "m");
  const headingMatch = headingRe.exec(md);
  if (!headingMatch) {
    throw new Error(`blueprint.md: no heading found matching /^## ${headingPrefix}/m`);
  }
  const rest = md.slice(headingMatch.index + headingMatch[0].length);
  const nextHeadingIdx = rest.search(/^## /m);
  const section = nextHeadingIdx === -1 ? rest : rest.slice(0, nextHeadingIdx);
  const fenceMatch = /```json\n([\s\S]*?)\n```/.exec(section);
  if (!fenceMatch) {
    throw new Error(`blueprint.md: no \`\`\`json fence found under "## ${headingPrefix}"`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fenceMatch[1]);
  } catch (err) {
    throw new Error(`blueprint.md: the \`\`\`json block under "## ${headingPrefix}" does not parse: ${err.message}`);
  }
  return parsed;
}

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

  test("bake refuses a boot viewstate the world cannot honour", () => {
    const scratch = mkdtempSync(join(tmpdir(), "holo-badvs-"));
    try {
      cpSync(fixtureDir, join(scratch, "fx"), { recursive: true });
      writeFileSync(
        join(scratch, "fx", "viewstate.json"),
        JSON.stringify({ location: "Study", facing: "N" }) + "\n" // capitalization typo
      );
      expect(() => bake(repoRoot, ["--fixture-dir", join(scratch, "fx")]))
        .toThrow(/refused|Command failed|status/i);
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

  /* "The document is the sole truth" has to be true of the design documents
   * too, not only of the fixture the renderer reads — a blueprint whose own
   * illustration disagrees with the shipped world is a false sentence sitting
   * next to a true one, and nothing before this test could catch it: the
   * validator only reads fixtures/, and blueprint.md's §3 JSON block is prose
   * as far as every other check is concerned. Row 13's done clause is
   * literally "blueprint section 3 examples agree with the fixture" —
   * examples, not "examples' exits": a first cut of this check compared only
   * the exit fields and a row-13 artifact critic showed it silently passed
   * `knowledge.player` gaining an entity it must not have at boot, and
   * `door1`'s default state flipping — both direct hits on named qualities
   * ("the key does not exist in the player's world"; "leave a room and
   * return exactly as you left it" starts from the boot state). The whole
   * parsed block is compared now, structurally, against the whole world. */
  test("blueprint §3's JSON block agrees with world.json, in full", () => {
    const blueprint = readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8");
    const example = extractBlueprintJsonBlock(blueprint, "3. Snapshot document");
    const world = JSON.parse(readFileSync(join(fixtureDir, "world.json"), "utf8"));
    expect(example, "blueprint §3's JSON block, structurally, equals world.json")
      .toEqual(world);
  });
});
