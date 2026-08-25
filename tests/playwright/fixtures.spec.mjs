import { test, expect, repoRoot, bake, stageTree, removeTree } from "./helpers.mjs";
import { readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { askTextFor } from "../../tools/flight-evidence.mjs";

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
  /* EVERY BAKED WORLD, ENUMERATED FROM THE TREE. [Row 21, round 3 — G4] This
     baked `fixtures/demo-study` by name, so the world the BARE URL boots was
     the one world whose bake nothing checked: a critic hand-edited
     `wall_width_m` from 8 to 6 on `hall/N` in `fixtures/nav-manor/fixture.js`
     and the suite stayed green, where the same edit to the demo fixture fires
     fifty assertions. A fixture directory is one that carries a `world.json`;
     adding a third world adds it here by existing. */
  const bakedWorlds = () => readdirSync(join(repoRoot, "fixtures"))
    .filter((d) => existsSync(join(repoRoot, "fixtures", d, "world.json")))
    .sort();

  /* [Row 21, round 5] TWO BAKE REFUSALS THAT HAD NO SUBJECT. Both were
   * deletable whole with the suite green — `if (false && metaFindings.length)`
   * and the `source/` skip removed — and both guard the same sentence: the
   * page is baked from what the gate admitted, and from nothing else. */
  test("the bake refuses a meta it cannot read, and never bakes a candidate", () => {
    const dir = stageTree();
    try {
      /* A promoted meta that is not readable is the tier-1 resolution's own
         finding, and the bake is where it has to stop: falling back to the
         derived meta would check the fixture against a wall the renderer will
         not draw and report success. */
      const meta = join(dir, "backdrops", "study", "N.meta.json");
      const good = readFileSync(meta);
      writeFileSync(meta, "{ this is not json");
      let out = "";
      try {
        bake(dir, ["--fixture-dir", join(dir, "fixtures", "nav-manor")]);
        out = "the bake wrote a fixture over an unreadable meta";
      } catch (e) {
        out = String(e.stdout || "") + String(e.stderr || "");
      }
      expect(out, "an unreadable promoted meta stops the bake, in its own words")
        .toMatch(/bake refused/);
      expect(out, "and names the file it could not read rather than falling back to a wall the renderer will not draw")
        .toMatch(/backdrops\/study\/N\.meta\.json: unreadable/);
      writeFileSync(meta, good);

      /* AND THE CANDIDATE LANE IS NOT A BACKDROP LANE. A file shaped exactly
         like a promoted painting, sitting under `backdrops/source/`, must not
         reach the page: a candidate is not a backdrop until the gate admits
         it, and the promotion is where the gate is. */
      const seat = join(dir, "backdrops", "source");
      mkdirSync(seat, { recursive: true });
      cpSync(join(repoRoot, "backdrops", "study", "N.png"), join(seat, "N.png"));
      execFileSync("node", [join(dir, "tools", "bake-backdrops.mjs")],
        { cwd: dir, encoding: "utf8", stdio: "pipe" });
      const baked = readFileSync(join(dir, "backdrops", "baked.js"), "utf8");
      expect(baked, "the bake took a candidate out of the asset seat's lane")
        .not.toMatch(/"source\//);
      expect(baked, "and it still holds the one wall the gate admitted")
        .toMatch(/"study\/N"/);
    } finally {
      removeTree(dir);
    }
  });

  test("bake staleness: every committed fixture.js byte-equals a fresh bake of its own .json truth", () => {
    const worlds = bakedWorlds();
    expect(worlds.length, "the page carries more than one world; both are baked")
      .toBeGreaterThanOrEqual(2);
    for (const w of worlds) {
      const dir = join(repoRoot, "fixtures", w);
      const scratch = mkdtempSync(join(tmpdir(), "holo-bake-"));
      try {
        const out = join(scratch, "fixture.js");
        bake(repoRoot, ["--fixture-dir", dir, "--out", out]);
        expect(readFileSync(out).equals(readFileSync(join(dir, "fixture.js"))),
          `stale bake for ${w} — run: node tools/bake-fixtures.mjs --fixture-dir fixtures/${w}`)
          .toBe(true);
      } finally {
        rmSync(scratch, { recursive: true, force: true });
      }
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
      /* A LOCATION IS A DIRECTORY, asked of the filesystem rather than guessed
         from the name. This filtered by name — "not `source`, not `*.js`" — and
         `14b7a84` put `backdrops/AGENTS.md` beside the locations, whereupon the
         whole case died in `readdirSync` with ENOTDIR before it compared a
         single meta. A staleness test that cannot run is a staleness test that
         cannot fail, and the failure named a path rather than a stale file. */
      const promoted = readdirSync(join(repoRoot, "backdrops"))
        .filter((loc) => loc !== "source" &&
          statSync(join(repoRoot, "backdrops", loc)).isDirectory())
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
        /* [row 29(a)] AND THE ASK IT WAS PAINTED FROM, which is a second file
           the promotion reads. An OPEN facing is promoted only from a prompt
           that can be shown not to have named interior fabric — the backward
           half of the Captain's "exterior garden has interior wall outside",
           since the art on disk predates the outdoor voice — so on a vista the
           prompt beside the candidate is part of what the tool is re-run
           against, exactly as the measurement and the round already are. */
        const ask = candidate.replace(/\.png$/i, ".prompt.txt");
        if (existsSync(join(repoRoot, ask))) cpSync(join(repoRoot, ask), join(dir, ask));
        /* [row 39] AND THE ASK THE FLIGHT ATTACHMENT FOLLOWS, which is not
         * always that sibling. A SNAPPED candidate is rectified into
         * `backdrops/source-snapped/<loc>-<F>/snapped.png` and nothing was
         * ever asked for there: the ask is the ORIGINAL roll's, named by the
         * reading's own `_snap` block, and `askTextFor` is the one place that
         * rule lives. Staging only the sibling made `back_stair/W` — a wall
         * the plan draws a flight in — refuse re-promotion with
         * `row39:stair.ask_unreadable` inside a tree that simply had not been
         * handed the file, which says nothing about staleness. The resolution
         * is imported rather than re-derived so this staging cannot drift from
         * what the tool reads. */
        const measuredFile = join(repoRoot, "design", "plan-draft", "measured",
          ...(meta.measured_round ? [meta.measured_round] : []), `${loc}-${facing}.json`);
        if (existsSync(measuredFile)) {
          const followed = askTextFor(repoRoot, candidate,
            JSON.parse(readFileSync(measuredFile, "utf8")), join);
          if (followed.text !== null && followed.path !== ask) {
            mkdirSync(join(dir, followed.path, ".."), { recursive: true });
            cpSync(join(repoRoot, followed.path), join(dir, followed.path));
          }
        }
        /* AND THE ROUND IT WAS MEASURED IN, which the meta carries: rounds
           have their own directories, so re-running the tool without naming
           one reads the cand-2 corpus — a different painting's numbers — and
           the refusal that catches it is `_source_sha256`, which would make
           this case red for the wrong reason. */
        /* AND THE CAMERA IT WAS ADMITTED AGAINST, for the same reason and off
           the same meta: a manor wall is painted to order at the ruled 1024 px
           lens and a study wall was measured against the approved 819.6, so
           re-running the tool without naming which would refuse the manor half
           of the corpus at the wrong centre — a red case that says nothing
           about staleness. */
        /* [Row 32] AND WHERE ITS HORIZON CAME FROM, which is the third thing
           the re-run has to be told and the newest. A wall promoted under the
           Captain's tolerance ruling carries `camera_source: "declared"`; the
           tool refuses to touch its measurement without the flag — the
           measurement names a hold family, and promoting one through the
           ordinary door would ship the reading the instrument refused — so
           re-running it unflagged would make this case red for the wrong
           reason, exactly as an unstated round or reference would. The
           tolerance is knowing: the spec reads the source back off the meta
           rather than assuming every promotion took one path. */
        execFileSync("node", [join(dir, "tools", "promote-backdrop.mjs"),
          "--facing", `${loc}/${facing}`, "--candidate", candidate,
          ...(meta.measured_round ? ["--round", meta.measured_round] : []),
          ...(meta.camera_reference ? ["--reference", meta.camera_reference] : []),
          ...(meta.camera_source ? ["--camera-source", meta.camera_source] : [])],
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

  /* [ROW 32 — the Captain's suspect-painting tolerance ruling, 2026-08-24]
   * WHERE `suspect_perspective` LANDS, AND THAT IT LANDS THERE.
   *
   * The ruling's last clause is about row 4: "row 4 stages shallow on flagged
   * walls and the flip test judges them". So the flag has to reach whatever
   * surface staging reads, and the answer is that it already does — a promoted
   * meta is resolved by `metaForFacing` and written into `fixtures/<w>/
   * fixture.js`'s `metas` map VERBATIM, and that map is the one every placement
   * is projected through (`projectPlacement(meta, …)`) and the one the page
   * renders with. There is no second surface and nothing to add: a flag on the
   * meta is a flag in front of the code that stages.
   *
   * What could quietly break it is the bake growing a whitelist. It has none
   * today — `JSON.stringify(metas)` — and this is the check that says so, run
   * where it matters: a promoted meta doctored into a declared one, baked, and
   * the flag looked for in the artifact staging reads. */
  test("a declared meta's suspect flag reaches the baked meta map staging is projected through", () => {
    const dir = stageTree();
    try {
      const metaPath = join(dir, "backdrops", "study", "N.meta.json");
      const meta = JSON.parse(readFileSync(metaPath, "utf8"));
      meta.camera_source = "declared";
      meta.suspect_perspective = true;
      meta.tolerance_ruling = "design/approvals.log 2026-08-24, suspect-painting " +
        "tolerance [HUMAN]: \"I think its pretty close and we can accept a " +
        "tolerance for drift here\"";
      meta.declared_fields = ["horizon_y"];
      writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
      /* The bake runs the fixture validator over exactly these metas, so a
         green bake is also the gate admitting the shape end to end. */
      bake(dir, ["--fixture-dir", join(dir, "fixtures", "demo-study")]);
      const baked = readFileSync(join(dir, "fixtures", "demo-study", "fixture.js"), "utf8");
      /* `metas` is the last member of the baked object and its JSON is printed
         at zero indent, so it runs from `metas: {` to the `}` in column 0. */
      const metas = JSON.parse(/\n {2}metas: (\{[\s\S]*\n\})\n\};?\n?$/.exec(baked)[1]);
      expect(metas["study/N"].suspect_perspective,
        "the flag did not survive the bake — the surface staging reads does not know this wall is suspect")
        .toBe(true);
      expect(metas["study/N"].camera_source).toBe("declared");
      expect(metas["study/N"].declared_fields).toEqual(["horizon_y"]);
      /* And an unflagged wall in the same map carries none of it, so the flag
         means something when it is there. */
      expect(metas["hall/S"].suspect_perspective).toBeUndefined();
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

  /* [ROW 42] AND THE BAKED SPRITES ARE THE INGESTED ONES. The same hole in the
   * same shape, one layer over: `library/baked.js` is what the page draws and
   * `library/<id>/sprite.png` is what the replicator certified, and nothing but
   * this compares them. It is worth more here than at the backdrops, because a
   * sprite bake is EDITABLE prose-adjacent JSON — a record's `anchors` or
   * `dims_m` could be moved inside the bake and every gate in the ingest report
   * would go on describing the file the record no longer matches. */
  test("library bake staleness: the committed baked.js byte-equals a fresh bake of the promoted records", () => {
    const scratch = mkdtempSync(join(tmpdir(), "holo-lib-"));
    try {
      const out = join(scratch, "baked.js");
      execFileSync("node", [join(repoRoot, "tools", "bake-library.mjs"), "--out", out],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      expect(readFileSync(out).equals(readFileSync(join(repoRoot, "library", "baked.js"))),
        "stale library bake — run: node tools/bake-library.mjs")
        .toBe(true);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  /* And the record the PAGE resolves is the record on disk. `src/placeholders.js`
   * merges one thing into a promoted record — the residual `open` state image —
   * and this is what stops that merge quietly becoming two things. */
  test("a promoted record differs from the ingested one in exactly its declared residuals", () => {
    const promoted = JSON.parse(
      readFileSync(join(repoRoot, "library", "promoted.json"), "utf8")).promoted;
    const records = createRequire(import.meta.url)(
      join(repoRoot, "src", "placeholders.js")).records;
    expect(promoted.length, "there are promoted records to check").toBeGreaterThan(0);
    for (const id of promoted) {
      const disk = JSON.parse(
        readFileSync(join(repoRoot, "library", id, "record.json"), "utf8"));
      const page = records[id];
      expect(page, `${id} is staged by a shipped world and resolves`).toBeTruthy();
      expect(page.placeholder, `${id} is not placeholder art any more`).toBeUndefined();
      const residual = ((page.provenance || {}).residual_placeholder || {}).images || [];
      /* Rebuild the ingested record from the resolved one by removing exactly
         what the resolution says it added. What is left must be byte-identical
         to the file the replicator wrote. */
      const back = JSON.parse(JSON.stringify(page));
      if (residual.includes("states_images.open")) {
        delete back.states_images;
        back.archetype = disk.archetype;
      }
      delete back.provenance.residual_placeholder;
      delete back.provenance.painter_ask;
      expect(JSON.parse(JSON.stringify(back)),
        `${id}: the page's record is the ingested one plus ${JSON.stringify(residual)} ` +
        `and nothing else`).toEqual(disk);
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
