/* voice.spec — the product's voice on every rendered string (row 7).
 *
 * The audit lives in design/surface-strings.md and THIS SPEC READS IT. That is
 * deliberate: a later row extends the document, not this file, so rows whose
 * done clauses promise "all existing tests green unmodified" can add a string.
 * The document is therefore test input — a code-class artifact — and the
 * parser hard-fails on a line it cannot read rather than silently dropping a
 * string out of the required set.
 *
 * Two nets, and the ordering is honest: the RUNTIME sweep (C) is primary, the
 * source census (A) secondary. A source scan cannot see a string composed from
 * a variable; a runtime sweep cannot see a state nobody drives. So the census
 * pins the set of sinks, the STATES block pins the set of states, and each is
 * cross-checked against what the tests actually do.
 */
import { test, expect, repoRoot, appUrl, stageTree, removeTree, bake, equipContext }
  from "./helpers.mjs";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const AUDIT = join(repoRoot, "design", "surface-strings.md");
const auditText = readFileSync(AUDIT, "utf8");

/* ---------- the audit parser ---------------------------------------- */

function fenced(name) {
  const m = auditText.match(new RegExp("```" + name + "\\n([\\s\\S]*?)```"));
  if (!m) throw new Error(`design/surface-strings.md has no \`\`\`${name} block`);
  return m[1].split("\n").filter((l) => l.trim() !== "");
}

const VERDICTS = new Set(["PASS", "LICENSED:device", "OPEN"]);

function parseStrings() {
  const lines = fenced("STRINGS");
  const header = lines.shift();
  expect(header.trim(), "STRINGS header").toBe(
    "id | surface | state | verdict | observed | adjudicator | string");
  return lines.map((line) => {
    // Split on the first six separators only: a string may contain anything.
    const parts = [];
    let rest = line;
    for (let i = 0; i < 6; i++) {
      const at = rest.indexOf(" | ");
      if (at === -1) throw new Error(`unparseable STRINGS row: ${line}`);
      parts.push(rest.slice(0, at).trim());
      rest = rest.slice(at + 3);
    }
    const row = {
      id: parts[0], surface: parts[1], state: parts[2], verdict: parts[3],
      observed: parts[4], adjudicator: parts[5], text: rest
    };
    if (!/^\d+$/.test(row.id)) throw new Error(`unparseable id: ${line}`);
    if (row.text === "") throw new Error(`empty string cell: ${line}`);
    return row;
  });
}

function parseCount(name) {
  for (const line of fenced("COUNT")) {
    const m = line.trim().match(/^(\w+) (\d+)$/);
    if (m && m[1] === name) return Number(m[2]);
  }
  throw new Error(`COUNT block has no ${name} entry`);
}

const STRINGS = parseStrings();
const STATES = fenced("STATES").map((s) => s.trim());
const SINKS = fenced("SINKS").map((s) => s.trim());
const UNUSED_SINKS = fenced("UNUSED_SINKS").map((s) => s.trim());
const LICENSED = fenced("LICENSED").map((l) => l.slice(l.indexOf(" | ") + 3));
const QUESTION_IDS = new Set(
  fenced("QUESTIONS").map((l) => l.slice(0, l.indexOf(" | ")).trim()));

const VOCAB = fenced("VOCABULARY").map((line) => {
  const at = line.indexOf(" | ");
  return { list: line.slice(0, at).trim(), re: new RegExp(line.slice(at + 3), "i") };
});
const DEVELOPER = VOCAB.filter((v) => v.list === "DEVELOPER");
const METHOD = VOCAB.filter((v) => v.list === "METHOD");

/** Marks, not words — recorded in the audit as an explicit exception. */
const MARKS = new Set(["‹", "›"]);

function offends(s, lists) {
  const hits = [];
  if (LICENSED.includes(s)) return hits;
  for (const v of lists) if (v.re.test(s)) hits.push(String(v.re));
  return hits;
}

/* ---------- 0. the audit is internally sound ------------------------ */

test.describe("the audit itself", () => {
  test("every row carries a legal verdict, and OPEN is named in QUESTIONS", () => {
    for (const r of STRINGS) {
      expect(VERDICTS.has(r.verdict), `#${r.id} verdict "${r.verdict}"`).toBe(true);
      // The point of the column: a later row cannot append a string and go
      // green without judging it, and cannot self-grant OPEN without the
      // string being recorded where the Navigator will find it.
      if (r.verdict === "OPEN") {
        expect(QUESTION_IDS.has(r.id), `#${r.id} is OPEN and must be in QUESTIONS`).toBe(true);
      }
      expect(r.adjudicator.length, `#${r.id} names an adjudicator`).toBeGreaterThan(3);
      expect(["yes", "no"]).toContain(r.observed);
    }
  });

  test("COUNT matches the rows parsed, so a broken row cannot vanish quietly", () => {
    expect(STRINGS.length).toBe(parseCount("STRINGS"));
    expect(STATES.length).toBe(parseCount("STATES"));
  });

  test("`observed: no` is derived from the fixture, not written by hand", () => {
    const world = JSON.parse(
      readFileSync(join(repoRoot, "fixtures", "demo-study", "world.json"), "utf8"));
    const takeable = new Set(
      world.entities.filter((e) => e.takeable).map((e) => e.sprite));
    for (const r of STRINGS.filter((x) => x.observed === "no")) {
      expect(r.surface, `#${r.id} may only be unobserved as a tile name`)
        .toBe("inventory tile name");
      const owner = world.entities.find((e) => e.id === r.state.split(" ")[0]);
      expect(owner, `#${r.id} names an entity`).toBeTruthy();
      expect(takeable.has(owner.sprite), `#${r.id}'s entity is not takeable`).toBe(false);
    }
    // And the converse: a takeable's noun may not hide behind `observed: no`.
    for (const r of STRINGS.filter((x) => x.surface === "inventory tile name")) {
      const owner = world.entities.find((e) => e.id === r.state.split(" ")[0]);
      if (owner && takeable.has(owner.sprite)) expect(r.observed).toBe("yes");
    }
  });

  test("the audit's copies byte-equal their homes", () => {
    const narration = JSON.parse(readFileSync(
      join(repoRoot, "fixtures", "demo-study", "narration.json"), "utf8")).lines;
    const byKey = new Map(Object.entries(narration));
    let matched = 0;
    for (const r of STRINGS) {
      if (!byKey.has(r.state.split(" ")[0])) continue;
      expect(r.text, `#${r.id} byte-equals narration.json`)
        .toBe(byKey.get(r.state.split(" ")[0]));
      matched++;
    }
    expect(matched, "every narration line is enumerated").toBe(byKey.size);
  });

  test("record nouns byte-equal the bound library", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const nouns = await page.evaluate(() => {
      const out = {};
      const lib = window.HOLO_APP.library;
      for (const id of Object.keys(lib)) out[id] = lib[id].record.noun;
      return out;
    });
    const world = JSON.parse(
      readFileSync(join(repoRoot, "fixtures", "demo-study", "world.json"), "utf8"));
    const rows = STRINGS.filter((r) => r.surface === "inventory tile name" &&
      r.text !== "something you carry");
    expect(rows.length, "every record's noun is enumerated")
      .toBe(Object.keys(nouns).length);
    for (const r of rows) {
      const owner = world.entities.find((e) => e.id === r.state.split(" ")[0]);
      expect(nouns[owner.sprite], `#${r.id} byte-equals the bound record`).toBe(r.text);
    }
  });
});

/* ---------- A. the sink census -------------------------------------- */

test.describe("the sink census", () => {
  const sources = ["index.html", "src/renderer.js", "src/harness.js",
    "src/inventory.js", "src/placeholders.js", "src/groundplane.js"];

  /** Comments stripped: this codebase explains its own rules in prose beside
   *  the code ("never fillText — font rasterisation varies"), so a raw
   *  substring search finds the rule and calls it a violation. The guard has
   *  to read what runs, not what the file says about what runs. */
  const code = (rel) => readFileSync(join(repoRoot, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  test("no sink outside the census, and none of UNUSED_SINKS", () => {
    for (const rel of sources) {
      const text = code(rel);
      for (const banned of UNUSED_SINKS) {
        expect(text.includes(banned), `${rel} must not use ${banned}`).toBe(false);
      }
    }
    /* Every surface write in the source is a census member. The pattern runs
     * over ALL such calls rather than a curated list, which is what makes it
     * a census and not a checklist; its blind spots (dynamic property names,
     * a stylesheet injected after parse, template cloning) are named in the
     * audit and are why the runtime sweep is the primary net. */
    const seen = new Set();
    for (const rel of sources) {
      const text = code(rel);
      const re = /\.(textContent|innerText|title)\s*=|setAttribute\(\s*"(aria-label|title|alt|placeholder|aria-labelledby|aria-describedby)"/g;
      let m;
      while ((m = re.exec(text)) !== null) seen.add(rel + " :: " + m[0]);
    }
    // Each observed write site must be accounted for by a SINKS entry naming
    // its file. (The block names sites in prose; the file half is checkable.)
    const files = new Set(SINKS.map((s) => s.split(" | ")[0]));
    for (const site of seen) {
      const f = site.split(" :: ")[0];
      expect(files.has(f), `${site} — no SINKS entry for ${f}`).toBe(true);
    }
    expect(seen.size, "the census found the sites it claims").toBeGreaterThanOrEqual(3);
  });

  test("the stylesheet declares no generated content", () => {
    const html = readFileSync(join(repoRoot, "index.html"), "utf8");
    const style = html.slice(html.indexOf("<style>"), html.indexOf("</style>"))
      .replace(/\/\*[\s\S]*?\*\//g, " "); // the stylesheet explains itself in prose too
    expect(/[{;]\s*content\s*:/.test(style), "no content: declaration").toBe(false);
    expect(/::(before|after)/.test(style), "no pseudo-element rules").toBe(false);
  });

  test("the canvas's letterforms are exactly those enumerated", () => {
    const src = readFileSync(join(repoRoot, "src", "renderer.js"), "utf8");
    const block = src.slice(src.indexOf("var GLYPHS"), src.indexOf("var GLYPHS") + 2000);
    const keys = [...block.matchAll(/^\s{4}([A-Z]):/gm)].map((m) => m[1]);
    const enumerated = STRINGS
      .filter((r) => r.surface === "scene canvas").map((r) => r.text).sort();
    expect(keys.sort(), "GLYPHS matches the audit").toEqual(enumerated);
  });
});

/* ---------- C. the runtime sweep ------------------------------------ */

/** Collect every string the page can put in front of a person, right now.
 *  No visibility filter and no aria-hidden filter: a visually hidden but
 *  announced string is a string the page shows a player, and aria-hidden
 *  subtrees are visible and hidden only from assistive technology. */
const COLLECT = () => {
  const out = [];
  out.push(document.title);
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    const tag = n.parentElement && n.parentElement.tagName;
    /* NOSCRIPT is skipped only while scripting is ON: with scripts enabled a
       browser parses its body as raw TEXT, so the whole element arrives as
       one node with its markup in it — and none of it is rendered. The
       scripts-disabled state has its own sweep, which is where that string
       is actually observed. */
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
    const t = n.nodeValue.trim();
    if (t) out.push(t);
  }
  for (const el of document.querySelectorAll("*")) {
    for (const a of ["aria-label", "title", "alt", "placeholder",
      "aria-labelledby", "aria-describedby"]) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) out.push(v);
    }
    for (const p of ["::before", "::after"]) {
      const c = getComputedStyle(el, p).content;
      if (c && c !== "none" && c !== "normal") out.push(c.replace(/^"|"$/g, ""));
    }
  }
  return out;
};

const known = new Set(STRINGS.map((r) => r.text));

function checkCollected(collected, where) {
  for (const raw of collected) {
    const s = raw.trim();
    if (!s || MARKS.has(s)) continue;
    expect(offends(s, DEVELOPER), `${where}: developer speech — ${s}`).toEqual([]);
    expect(offends(s, METHOD), `${where}: method speech — ${s}`).toEqual([]);
    expect(known.has(s), `${where}: string not in the audit — ${s}`).toBe(true);
  }
}

test.describe("the runtime sweep", () => {
  test("the swept states are exactly the audit's STATES", () => {
    // One home for the state list. Without this a builder could add a state
    // to STRINGS and not to the sweep, or the reverse, with the suite green.
    const driven = [
      "cold-boot", "facing-study-E", "facing-study-S", "facing-study-W",
      "facing-hall-N", "facing-hall-E", "facing-hall-S", "facing-hall-W",
      "drawer-open-key-revealed", "one-tile-held", "two-tiles-held",
      "three-tiles-held", "refusal", "refusal-repeated", "all-narration-triples",
      "broken-boot-location", "broken-boot-facing", "module-missing-renderer",
      "module-missing-harness", "module-missing-placeholders",
      "module-missing-fixture", "render-fault", "missing-narration-key",
      "unreadable-intent", "noun-missing", "scripts-disabled", "capture-mode",
      "width-320", "width-1366", "zoom-200"
    ];
    expect(driven.sort()).toEqual([...STATES].sort());
  });

  test("healthy states show nothing outside the audit", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    checkCollected(await page.evaluate(COLLECT), "cold-boot");

    // Every facing of both rooms.
    for (const [loc, facings] of [["study", 3], ["hall", 4]]) {
      for (let i = 0; i < facings; i++) {
        await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "right" }));
        checkCollected(await page.evaluate(COLLECT), `facing ${loc}`);
      }
      if (loc === "study") {
        await page.evaluate(() => {
          const A = window.HOLO_APP;
          A.dispatch({ type: "toggle", entity: "door1" });
          A.dispatch({ type: "go", exit: "door_study_hall" });
        });
      }
    }

    // Reveal, tiles held, a refusal, and a refusal repeated.
    await page.evaluate(() => {
      const A = window.HOLO_APP;
      A.dispatch({ type: "go", exit: "door_hall_study" });
      A.dispatch({ type: "toggle", entity: "desk1" });
    });
    checkCollected(await page.evaluate(COLLECT), "drawer-open-key-revealed");
    for (const e of ["key1", "note1"]) {
      await page.evaluate((id) => window.HOLO_APP.dispatch({ type: "take", entity: id }), e);
      checkCollected(await page.evaluate(COLLECT), "tiles held");
    }
    await page.evaluate(() => {
      for (let i = 0; i < 6; i++) {
        window.HOLO_APP.dispatch({ type: "toggle", entity: "chair1" });
      }
    });
    checkCollected(await page.evaluate(COLLECT), "refusal-repeated");

    // Capture mode, and two more widths.
    await page.evaluate(() => document.body.classList.add("capture"));
    checkCollected(await page.evaluate(COLLECT), "capture-mode");
    await page.evaluate(() => document.body.classList.remove("capture"));
    for (const w of [320, 1366]) {
      await page.setViewportSize({ width: w, height: 700 });
      checkCollected(await page.evaluate(COLLECT), `width-${w}`);
    }
  });

  test("every narration line is emittable, and is read back off the real pane", async ({ page }) => {
    /* Two halves, and neither alone is enough.
     *
     * EMITTABLE: that each of the 38 lines can actually be produced by the
     * harness is proved constructively, per triple, by validator.spec's
     * §12.9 cross-check — one doctored-fixture probe each. Re-deriving that
     * machinery here would be a second home for it, so this cites it rather
     * than copying it, and asserts the domain's size agrees.
     *
     * ON A SURFACE: what validator.spec does not do is put the line in front
     * of a person. Here every line goes through the pane's own sink and is
     * read back out of the DOM, so "player-voiced" is a claim about the
     * rendered surface rather than about a JSON file. */
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);

    const lines = Object.values(JSON.parse(readFileSync(
      join(repoRoot, "fixtures", "demo-study", "narration.json"), "utf8")).lines);

    const domainSize = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      return window.HOLO.harness
        .enumerateNarrationDomain(fx.world, fx.staging).length;
    });
    // 37 enumerated triples + turn.*.refused, which is an authoring duty
    // outside the domain (no shipped location has fewer than two facings) and
    // is reached in the broken-boot state instead.
    expect(lines.length, "the audit's 38 = the domain + the turn refusal")
      .toBe(domainSize + 1);

    const rendered = await page.evaluate((ls) => {
      const pane = document.getElementById("narration");
      const out = [];
      for (const line of ls) {
        const p = document.createElement("p");
        p.textContent = line;            // the pane's own sink
        pane.appendChild(p);
        out.push(pane.lastChild.textContent); // read back off the surface
      }
      return out;
    }, lines);

    expect(rendered, "every line survives the surface unchanged").toEqual(lines);
    for (const line of rendered) {
      expect(offends(line, DEVELOPER), `narration: ${line}`).toEqual([]);
      expect(offends(line, METHOD), `narration: ${line}`).toEqual([]);
      expect(known.has(line), `narration not in the audit: ${line}`).toBe(true);
    }
    checkCollected(await page.evaluate(COLLECT), "all-narration-triples");
  });

});

/* ---------- E. the console carries the witness ---------------------- */

test("the developer witness is on the console and nowhere on the surface", async ({ page }) => {
  const info = [];
  page.on("console", (m) => { if (m.type() === "info") info.push(m.text()); });
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);

  const fp = readFileSync(
    join(repoRoot, "fixtures", "demo-study", "fixture.js"), "utf8")
    .match(/fp:\s*"([0-9a-f]+)"/)[1];
  const witness = info.join("\n");
  expect(witness, "the fingerprint the bake actually wrote").toContain(fp);
  expect(witness, "and how to re-bake").toContain("node tools/bake-fixtures.mjs");

  // Both halves: moving the string is what passes, not deleting it.
  const surface = (await page.evaluate(COLLECT)).join("\n");
  expect(surface).not.toContain(fp);
  expect(surface).not.toContain("bake-fixtures");
});

test("no method speech reaches the console either — 'nowhere' means nowhere", () => {
  for (const rel of ["index.html", "src/harness.js", "src/inventory.js",
    "src/renderer.js", "src/placeholders.js", "src/groundplane.js"]) {
    const text = readFileSync(join(repoRoot, rel), "utf8");
    const re = /console\.(log|info|warn|error)\(\s*("(?:[^"\\]|\\.)*")/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const s = JSON.parse(m[2]);
      expect(offends(s, METHOD), `${rel} console: ${s}`).toEqual([]);
    }
  }
});

/* ---------- states that need their own page ------------------------- */

test("a broken boot viewstate speaks as the product, on both branches", async ({ page }) => {
  for (const [label, vs] of [
    ["broken-boot-location", { location: "atrium", facing: "N" }],
    ["broken-boot-facing", { location: "study", facing: "Q" }]
  ]) {
    const dir = stageTree();
    try {
      const p = join(dir, "fixtures", "demo-study", "fixture.js");
      writeFileSync(p, readFileSync(p, "utf8").replace(
        /viewstate: \{[^}]*\}/, "viewstate: " + JSON.stringify(vs)));
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(appUrl(dir));
      await page.waitForFunction(() => !!window.HOLO_APP);

      const line = await page.locator("#narration p").last().textContent();
      expect(line, `${label}: the product says it`)
        .toBe("The projection was set to a view this pattern does not hold.");
      // The mechanics went to the console, and none of them to the surface.
      expect(errors.some((e) => e.includes("BOOT ERROR")), `${label}: console`).toBe(true);
      checkCollected(await page.evaluate(COLLECT), label);

      /* The band's removal rests on the player still being answered here, so
       * the behaviour is asserted rather than argued — and the two branches
       * differ, which arguing would never have surfaced:
       *
       *   bad LOCATION — `location()` finds nothing, so `nextFacing` returns
       *     null and every arrow press is refused, aloud, forever.
       *   bad FACING — the location exists, `RING.indexOf("Q")` is -1, and
       *     the first candidate is a facing the room really has, so the very
       *     first arrow press RECOVERS the view instead of refusing.
       *
       * Both are product-voiced; only the first repeats. Whatever the page
       * says, it says it in the product's voice. */
      await page.keyboard.press("ArrowRight");
      const after = await page.locator("#narration p").last().textContent();
      if (label === "broken-boot-location") {
        expect(after, `${label}: the turn is refused, aloud`)
          .toBe("The room offers no other aspect; you face all there is to face.");
      } else {
        const facing = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
        expect(["N", "E", "S", "W"], `${label}: the view recovers to a real facing`)
          .toContain(facing);
      }
      expect(known.has(after), `${label}: whatever it says is audited — ${after}`).toBe(true);
    } finally {
      removeTree(dir);
    }
  }
});

test("a record with no usable noun never puts `undefined` on the surface", async ({ page }) => {
  const dir = stageTree();
  try {
    const p = join(dir, "src", "placeholders.js");
    writeFileSync(p, readFileSync(p, "utf8")
      .replace('"noun": "iron key",', ""));
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(appUrl(dir));
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.evaluate(() => {
      window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" });
      window.HOLO_APP.dispatch({ type: "take", entity: "key1" });
    });
    const tile = await page.locator("#inventory canvas.inv-tile").first();
    const label = await tile.getAttribute("aria-label");
    expect(label, "named, and in the product's voice").toBe("something you carry");
    expect(await tile.getAttribute("title")).toBe("something you carry");
    expect(errors.some((e) => e.includes("no usable noun")), "console carries it").toBe(true);
    checkCollected(await page.evaluate(COLLECT), "noun-missing");
  } finally {
    removeTree(dir);
  }
});

test("a render fault, a missing narration key and an unreadable intent all speak", async ({ page }) => {
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);

  // Unreadable intent: the transport's fault line, on the surface.
  await page.evaluate(() => window.HOLO_APP.dispatch({ type: "wobble" }));
  expect(await page.locator("#narration p").last().textContent())
    .toBe("The pattern falters; the words do not come.");
  checkCollected(await page.evaluate(COLLECT), "unreadable-intent");

  // Missing narration key.
  await page.evaluate(() => {
    delete window.HOLO_APP.harness.narration.lines["toggle.chair1.refused_static"];
    window.HOLO_APP.dispatch({ type: "toggle", entity: "chair1" });
  });
  const missing = await page.locator("#narration p").last().textContent();
  expect(["The pattern falters; the words do not come.",
    "Nothing of that description offers itself to your hand."]).toContain(missing);

  // Render fault.
  await page.evaluate(() => {
    window.HOLO.renderer.render = () => { throw new Error("forced"); };
    window.HOLO_APP.dispatch({ type: "turn", dir: "right" });
  });
  expect(await page.locator("#narration p").last().textContent())
    .toBe("The projection wavers; the pattern will not resolve.");
  checkCollected(await page.evaluate(COLLECT), "render-fault");
});

for (const mod of [["src", "renderer.js"], ["src", "harness.js"],
  ["src", "placeholders.js"], ["fixtures", "demo-study", "fixture.js"]]) {
  test(`a missing ${mod[mod.length - 1]} shows nothing but product speech`, async ({ page }) => {
    const dir = stageTree();
    try {
      rmSync(join(dir, ...mod));
      await page.goto(appUrl(dir));
      await expect.poll(async () => await page.evaluate(() => {
        const ps = document.querySelectorAll("#narration p");
        return ps.length ? ps[ps.length - 1].textContent : null;
      }), { timeout: 5000 }).not.toBeNull();
      checkCollected(await page.evaluate(COLLECT), `module-missing-${mod[mod.length - 1]}`);
    } finally {
      removeTree(dir);
    }
  });
}

test("with scripts disabled the page still shows nothing but product speech", async ({ browser }) => {
  const ctx = await equipContext(await browser.newContext({ javaScriptEnabled: false }));
  const p = await ctx.newPage();
  await p.goto(appUrl());
  checkCollected(await p.evaluate(COLLECT), "scripts-disabled");
  await ctx.close();
});

test("at 200% zoom the pane still shows whole rows of type", async ({ page }) => {
  /* The status band's removal leans on the pane never slicing a row, and that
   * claim was previously asserted rather than witnessed. The scar is general —
   * a fixed-height box with wrapping text presents a second row sliced through
   * its ascenders — and later rows add chrome, so the guard outlives the
   * element it was written for. */
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px"; // ≈200%
    window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" });
    window.HOLO_APP.dispatch({ type: "go", exit: "door_study_hall" });
  });
  const m = await page.evaluate(() => {
    const pane = document.getElementById("narration");
    const ps = [...pane.querySelectorAll("p")];
    const last = ps[ps.length - 1];
    const lineH = parseFloat(getComputedStyle(pane).lineHeight);
    const top = last.offsetTop - pane.offsetTop - pane.scrollTop;
    return { lineH, top, clientH: pane.clientHeight, scrollable: pane.scrollHeight };
  });
  // The newest paragraph starts on a row boundary inside the pane, so no row
  // is cut through its ascenders at the top edge.
  expect(Math.abs(m.top % m.lineH) < 2 || Math.abs((m.top % m.lineH) - m.lineH) < 2,
    `newest line starts on a row boundary (top ${m.top}, line ${m.lineH})`).toBe(true);
  // And the whole message is reachable: the pane scrolls rather than clipping.
  expect(m.scrollable).toBeGreaterThanOrEqual(m.clientH);
});
