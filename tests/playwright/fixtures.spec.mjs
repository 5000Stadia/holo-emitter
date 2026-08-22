import { test, expect, repoRoot, bake, stageTree, removeTree } from "./helpers.mjs";
import { readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

  /* [ROW 21, round 2] THE PROMOTED META IS WHAT THE PROMOTION TOOL WRITES.
   *
   * An artifact critic set `storey_height_m` to 4.9, `calibration_px` to 999,
   * `focal_px` to 1500 and `nearest_floor_m` to 9.9 in
   * `backdrops/study/N.meta.json`, one at a time, and the whole suite stayed
   * green each time: the file the page renders with was guarded on two of its
   * fifteen fields and the tool that writes it was guarded on none. This is
   * the fixture bake's own staleness shape applied to the meta — run the
   * generator into a scratch tree and byte-compare — and it holds every field
   * at once, because the tool derives all of them from the measurement and the
   * plan. A hand-edited meta cannot ship between suite runs. */
  test("promotion staleness: the committed meta byte-equals a fresh run of promote-backdrop", () => {
    const dir = stageTree();
    try {
      /* The tool reads the measurement beside the gates; a staged tree carries
         no `design/`, so that one directory comes with it. */
      mkdirSync(join(dir, "design", "plan-draft"), { recursive: true });
      cpSync(join(repoRoot, "design", "plan-draft", "measured"),
        join(dir, "design", "plan-draft", "measured"), { recursive: true });
      const promoted = readdirSync(join(repoRoot, "backdrops"))
        .filter((loc) => loc !== "source" && !loc.endsWith(".js"))
        .flatMap((loc) => readdirSync(join(repoRoot, "backdrops", loc))
          .filter((f) => /^[NESW]\.meta\.json$/.test(f))
          .map((f) => [loc, f[0]]));
      expect(promoted.length, "no painting is promoted at all").toBeGreaterThan(0);
      for (const [loc, facing] of promoted) {
        const meta = JSON.parse(readFileSync(
          join(repoRoot, "backdrops", loc, `${facing}.meta.json`), "utf8"));
        const candidate = String(meta.camera_id).replace(/^measured:/, "");
        expect(existsSync(join(repoRoot, candidate)),
          `${loc}/${facing}'s meta names a candidate that is not in the tree: ${candidate}`)
          .toBe(true);
        /* The one candidate this meta names. `stageTree` leaves
           `backdrops/source/` behind on purpose — it is 20 MB of the asset
           seat's lane — so the source of THIS promotion comes over by itself. */
        mkdirSync(join(dir, candidate, ".."), { recursive: true });
        cpSync(join(repoRoot, candidate), join(dir, candidate));
        execFileSync("node", [join(dir, "tools", "promote-backdrop.mjs"),
          "--facing", `${loc}/${facing}`, "--candidate", candidate],
          { cwd: dir, encoding: "utf8", stdio: "pipe" });
        expect(readFileSync(join(dir, "backdrops", loc, `${facing}.meta.json`), "utf8"),
          `backdrops/${loc}/${facing}.meta.json is not what promote-backdrop.mjs writes — a field was edited by hand, or the measurement moved and the promotion was not re-run`)
          .toBe(readFileSync(join(repoRoot, "backdrops", loc, `${facing}.meta.json`), "utf8"));
        expect(readFileSync(join(dir, "backdrops", loc, `${facing}.png`))
          .equals(readFileSync(join(repoRoot, "backdrops", loc, `${facing}.png`))),
          `backdrops/${loc}/${facing}.png is not a byte copy of the candidate it names`)
          .toBe(true);
      }
    } finally {
      removeTree(dir);
    }
  });

  /* [ROW 21, round 2] AND THE BAKED PAINTINGS ARE THE PROMOTED ONES.
   * `bake-backdrops.mjs`'s own header claimed a staleness test that did not
   * exist: a critic replaced the image inside `backdrops/baked.js` with a
   * flipped painting, left the PNG alone, and only the batch's frame
   * comparison noticed — an incidental guard that a re-captured batch would
   * have silenced. This is the one that cannot be talked out of. */
  test("backdrop bake staleness: the committed baked.js byte-equals a fresh bake of the promoted PNGs", () => {
    const scratch = mkdtempSync(join(tmpdir(), "holo-bd-"));
    try {
      const out = join(scratch, "baked.js");
      execFileSync("node", [join(repoRoot, "tools", "bake-backdrops.mjs"), "--out", out],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      expect(readFileSync(out).equals(readFileSync(join(repoRoot, "backdrops", "baked.js"))),
        "stale backdrop bake — run: node tools/bake-backdrops.mjs")
        .toBe(true);
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
