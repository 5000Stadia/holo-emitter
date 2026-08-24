/* Row 29 — the room's material voice, and the ration on painted arms.
 *
 * Two of the Captain's walk findings are baked in here, and this file is what
 * keeps them baked. [HUMAN, 2026-08-24, verbatim]:
 *
 *   "is every room in this house parlor walls?"  — the production prompt carried
 *   the study's own paragraph into every interior, because `manorPrompt` keyed
 *   its materials on `room.archetype` and the plan has archetypes that table did
 *   not carry. So kitchen, buttery, servants' hall and both stairs took the
 *   `chamber` default: oak panelling and a chair-rail in a scullery.
 *
 *   "exterior garden has interior wall outside" — the privy garden was asked for
 *   a wainscot chair-rail, and the SCAFFOLD stamped one across it, because the
 *   anchor's label was a constant.
 *
 *   "this same window everywhere? With the ensignias on it?" — every wall
 *   repainted the style seed's one heraldic window.
 *
 * `design/production-law.md` clause 6 is the bar: the next map, with none of
 * that conversation in context, gets this for free. The cases below are the
 * mechanism that makes that true — they are asserted on EMITTED PROMPT TEXT,
 * not on the table's own claims about itself, because a table that says
 * "kitchen: no panelling" and an emitter that writes it anyway are exactly the
 * failure this row exists to correct.
 */
import { test, expect } from "@playwright/test";
import { repoRoot } from "./helpers.mjs";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  VOICES, ANCHORS, ROOM_VOICE, ANCHOR_M, voiceFor, resolveAll,
  lightsFor, transomFor, surroundFor, windowLines,
  carryableOutdoors, REDACTED_CORRECTION,
  MATERIALS, MATERIAL_BINDING, SLOT_DEMAND_PPM, SWATCH_W_PX,
  materialKeysOf, materialOf, assertMaterialsComplete, emitMaterials,
  scaleContract, swatchCount
} from "../../tools/room-voices.mjs";
import { manorPrompt, scaffoldRects, chairRail, assertLabelChars } from "../../tools/make-scaffold.mjs";
import { deriveMeta } from "../../tools/plan-projection.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const LINT = join(repoRoot, "design", "plan-draft", "measured", "prompt_lint.py");

/** Every facing's prompt, derived exactly as the manor emitter derives it. */
function everyPrompt() {
  const out = new Map();
  for (const room of PLAN.rooms) {
    for (const f of Object.keys(room.facings || {})) {
      const meta = deriveMeta(PLAN, room.id, f);
      const { rects } = scaffoldRects(PLAN, room.id, f, meta);
      out.set(`${room.id}/${f}`, manorPrompt(PLAN, `${room.id}/${f}`, meta, rects));
    }
  }
  return out;
}

test.describe("row 29 — per-room material voices", () => {
  /* ------------------------------------------------------------------ */
  test("every room in the plan resolves to a voice, and none of them falls back", () => {
    const rows = resolveAll(PLAN);
    expect(rows.length, "no facings resolved — this case has gone blind").toBe(88);
    for (const r of rows) {
      expect(VOICES[r.voice], `${r.key} resolved to voice \`${r.voice}\`, which is not defined`).toBeTruthy();
      /* A FALLBACK IS A FINDING, not a pass. The archetype and type fallbacks
         exist so a FUTURE plan still resolves; this plan must be covered
         explicitly, because a fallback is precisely how the study's paragraph
         reached the kitchen. */
      expect(r.via,
        `${r.key} reached its voice by ${r.via} — every room of THIS plan is named in ROOM_VOICE, ` +
        `and a fallback here means a room type nobody wrote a voice for`)
        .toMatch(/^(room id|facing type `open`)/);
    }
    /* Every room id in the plan is in the table, and the table names no room
       the plan does not hold — a stale entry is a voice nothing can reach. */
    const ids = new Set(PLAN.rooms.map((r) => r.id));
    for (const id of Object.keys(ROOM_VOICE)) {
      expect(ids.has(id), `ROOM_VOICE names \`${id}\`, which the plan does not hold`).toBe(true);
    }
    for (const id of ids) {
      expect(ROOM_VOICE[id], `the plan holds \`${id}\` and the voice table does not name it`).toBeTruthy();
    }
  });

  test("every voice names its anchor, and every anchor names its ruler and can be stamped", () => {
    for (const [id, v] of Object.entries(VOICES)) {
      expect(v.why, `voice \`${id}\` carries no period justification`).toBeTruthy();
      expect(v.walls, `voice \`${id}\` names no wall fabric`).toBeTruthy();
      expect(v.floor, `voice \`${id}\` names nothing underfoot`).toBeTruthy();
      const a = ANCHORS[v.anchor];
      expect(a, `voice \`${id}\` names anchor \`${v.anchor}\`, which is not defined`).toBeTruthy();
      expect(a.line, `anchor \`${v.anchor}\` has no \`Gate anchor:\` phrase`).toBeTruthy();
      expect(a.sentence, `anchor \`${v.anchor}\` has no sentence for the prompt`).toBeTruthy();
      expect(a.why, `anchor \`${v.anchor}\` says nothing about why that feature is the ruler`).toBeTruthy();
      /* The stamped label and the legend word go through the stroked glyph
         table — a label it cannot stroke would silently fall back to a font. */
      assertLabelChars(a.label, `anchor ${v.anchor}'s stamped label`);
      assertLabelChars(a.legend_word, `anchor ${v.anchor}'s legend word`);
      expect(a.label, `anchor \`${v.anchor}\`'s stamp does not carry its ruled height`)
        .toContain("0.95 M");
    }
    /* An outdoor voice measured above a FLOOR, or an indoor one above the
       GROUND, would declare a datum its own picture does not contain. */
    for (const [id, v] of Object.entries(VOICES)) {
      expect(ANCHORS[v.anchor].datum,
        `voice \`${id}\` is ${v.outdoor ? "outdoor" : "indoor"} and its anchor is measured above the ` +
        `${ANCHORS[v.anchor].datum}`)
        .toBe(v.outdoor ? "ground" : "floor");
    }
  });

  /* ------------------------------------------------------------------ */
  /* THE HANDSHAKE WITH THE INSTRUMENT. `row23_lib.py` reads one horizontal out
     of the scaffold's `rail_band` and converts it with `rail_above / 0.95`. The
     voices therefore may rename the anchor's FEATURE and may not move its
     height. If that divisor ever moves, this goes red and the voice table is
     revisited rather than silently measuring the wrong length. */
  test("every voice's anchor is at the height the measurement instrument divides by", () => {
    expect(ANCHOR_M).toBe(0.95);
    const lib = readFileSync(join(repoRoot, "design", "plan-draft", "measured", "row23_lib.py"), "utf8");
    expect(lib,
      "row23_lib.py no longer converts the measured anchor at 0.95 m — every room voice declares its " +
      "anchor at that height on the strength of this line, so the voice table has to be revisited")
      .toMatch(/rail_above\s*\/\s*0\.95/);
    for (const meta of [deriveMeta(PLAN, "kitchen", "N"), deriveMeta(PLAN, "privy_garden", "N")]) {
      const plain = chairRail(meta);
      for (const a of Object.values(ANCHORS)) {
        expect(chairRail(meta, a).y,
          `anchor \`${a.id}\` stamps its line at a different height from the chair-rail's — the ` +
          `instrument measures one band and cannot tell them apart`)
          .toBe(plain.y);
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /* THE FINDING, ASSERTED ON EMITTED TEXT. */
  test("a service room's prompt names no panelling and no chair-rail", () => {
    const prompts = everyPrompt();
    for (const key of ["kitchen/N", "kitchen/E", "kitchen/S", "kitchen/W",
      "buttery_pantry/N", "servants_hall/N", "servants_hall/E",
      "back_stair/N", "back_stair_head/E"]) {
      const t = prompts.get(key);
      expect(t, `${key} emitted no prompt`).toBeTruthy();
      expect(t, `${key} still asks for panelling — "is every room in this house parlor walls?"`)
        .not.toMatch(/panell?ing|panell?ed/i);
      expect(t, `${key} still asks for a chair-rail, which that room never had`)
        .not.toMatch(/chair[- ]?rail/i);
      expect(t, `${key} still asks for wainscot`).not.toMatch(/wainscot/i);
    }
    /* And the control: the rooms that DO have it still get it, so the fix is a
       voice table and not a blanket deletion. */
    for (const key of ["study/N", "great_hall/S", "library/W", "master_bedchamber/E"]) {
      expect(prompts.get(key), `${key} lost its wainscot — the panelled rooms are panelled`)
        .toMatch(/wainscot/i);
    }
  });

  test("an outdoor facing's prompt carries no interior fabric at all", () => {
    const prompts = everyPrompt();
    for (const [key, t] of prompts) {
      const [loc, f] = key.split("/");
      const { voice } = voiceFor(PLAN, loc, f);
      if (!voice.outdoor) continue;
      expect(t, `${key} does not declare itself an exterior scene`)
        .toMatch(/^use case:[^\n]*\bexterior\b/im);
      /* Kabe's veto, verbatim: "exterior garden has interior wall outside". */
      expect(t, `${key} still names interior fabric — the veto that demoted privy_garden/N`)
        .not.toMatch(/panell?ing|panell?ed|wainscot|chair[- ]?rail|\bdado\b|floorboards?|plaster ceiling|ceiling joists?|\bhearth\b|\bfireplace\b/i);
      expect(t, `${key} measures its anchor above a floor it does not have`)
        .toMatch(/^gate anchor:[^\n]*above the ground/im);
    }
    /* The four facings the plan types `open` have no wall at all and must not
       be handed a garden wall's brickwork either. */
    for (const key of ["entrance_court/S", "entrance_approach/E", "entrance_approach/S", "entrance_approach/W"]) {
      const [loc, f] = key.split("/");
      expect(voiceFor(PLAN, loc, f).voice.id,
        `${key} is typed \`open\` — no wall stands there — and it took a walled voice`)
        .toBe("outdoors_open");
    }
  });

  /* ------------------------------------------------------------------ */
  test("painted arms are rationed to the great hall and the parlour", () => {
    const armed = [];
    for (const [key, t] of everyPrompt()) {
      if (/^armorial glass:/im.test(t)) armed.push(key.split("/")[0]);
    }
    const rooms = [...new Set(armed)].sort();
    expect(rooms,
      "armorial glass has escaped its ration — period practice sets painted arms in the great hall's " +
      "window and at most one shield in the principal parlour, and unrationed it is the repetition " +
      "Kabe saw: \"this same window everywhere? With the ensignias on it?\"")
      .toEqual(["dining_parlour", "great_hall"]);
    /* Every other wall that has glass says so explicitly, because a silent
       omission is what let the style seed's heraldry through. */
    for (const [key, t] of everyPrompt()) {
      if (/^armorial glass:/im.test(t)) continue;
      if (/carries no window/i.test(t)) continue;
      expect(t, `${key} has windows, no armorial ration, and does not forbid heraldic glass`)
        .toMatch(/no armorial shield/i);
    }
  });

  test("window language is derived from the plan's own openings, not repeated", () => {
    /* The module: 1.00 m -> two lights, 1.50 m -> three, 2.50 m -> five. */
    expect(lightsFor(1.00)).toBe(2);
    expect(lightsFor(1.20)).toBe(2);
    expect(lightsFor(1.40)).toBe(3);
    expect(lightsFor(1.50)).toBe(3);
    expect(lightsFor(2.50)).toBe(5);
    /* A transom across a 1.10 m tall opening is not a period detail. Only a
       window big enough to need the member gets one, and in this plan that is
       the 2.50 m stair window alone. */
    expect(transomFor(1.50), "a hall window 1.10 m tall was given a transom").toBe(false);
    expect(transomFor(2.50)).toBe(true);
    expect(surroundFor("state")).not.toBe(surroundFor("service"));

    const prompts = everyPrompt();
    /* The bay count in the words is the bay count in the plan, wall by wall. */
    for (const [key, t] of prompts) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const n = scaffoldRects(PLAN, loc, f, meta).rects.filter((r) => r.kind === "window").length;
      if (n === 0) {
        expect(t, `${key} has no window in the plan and its prompt does not say so`)
          .toMatch(/carries no window/i);
      } else {
        const word = ["no", "one", "two", "three", "four", "five", "six"][n];
        expect(t, `${key} draws ${n} window(s) in the plan and its prompt says otherwise`)
          .toMatch(new RegExp(`carries ${word} window opening`, "i"));
      }
    }
    /* AND THE REPETITION IS GONE. `great_hall/S` used to restate "The leaded
       window opening is exactly 1.50 m wide" once per bay. */
    const gh = prompts.get("great_hall/S");
    expect((gh.match(/window opening is exactly/gi) || []).length,
      "the per-carrier window sentence is back, restating one window per bay").toBe(0);
    /* Two walls with the same bay count in different rooms do not read the
       same: the dressing follows the room's rank. */
    const state = prompts.get("long_gallery/W"), service = prompts.get("kitchen/E");
    expect(state).toMatch(/label mould/i);
    expect(service).toMatch(/plain chamfered/i);
  });

  /* ------------------------------------------------------------------ */
  /* THE LINT IS THE GATE, so it is run against the real thing rather than
     trusted. Every facing the plan holds, through the emitter, through
     `prompt_lint.py`. */
  test("every prompt the emitter derives for this plan passes the prompt lint", () => {
    const dir = mkdtempSync(join(tmpdir(), "row29-prompts-"));
    try {
      const files = [];
      for (const [key, t] of everyPrompt()) {
        const p = join(dir, `${key.replace("/", "-")}.prompt.txt`);
        writeFileSync(p, t);
        files.push(p);
      }
      let out = "";
      try {
        out = execFileSync("python3", [LINT, ...files], { encoding: "utf8", cwd: repoRoot });
      } catch (e) {
        out = String(e.stdout || "") + String(e.stderr || "");
        throw new Error(`prompt_lint refused an emitted prompt:\n${out}`);
      }
      expect(out).toMatch(/\n0 of \d+ prompt\(s\) refused\./);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  /* THE LINT'S OWN NEW CLAUSES GO RED WHEN THEY SHOULD. A gate that cannot
     fail is not a gate, and two of the three clauses below guard a finding
     nothing else in the suite can see. */
  test("the row-29 lint clauses refuse the very prompts that earned them", () => {
    const dir = mkdtempSync(join(tmpdir(), "row29-neg-"));
    const run = (name, text) => {
      const p = join(dir, name);
      writeFileSync(p, text);
      try {
        execFileSync("python3", [LINT, p], { encoding: "utf8", cwd: repoRoot });
        return "";
      } catch (e) { return String(e.stdout || "") + String(e.stderr || ""); }
    };
    try {
      const good = manorPrompt(PLAN, "privy_garden/N",
        deriveMeta(PLAN, "privy_garden", "N"),
        scaffoldRects(PLAN, "privy_garden", "N", deriveMeta(PLAN, "privy_garden", "N")).rects);
      expect(run("clean.prompt.txt", good)).toBe("");
      /* (4) the veto: an exterior prompt that names interior fabric */
      expect(run("outdoor.prompt.txt",
        good + "Materials: dark oak wall panelling with a chair-rail.\n"))
        .toMatch(/row29:prompt\.interior_fabric_outdoors/);
      /* (5) the parlour-walls finding: a non-panelled anchor with panelling */
      const kitchen = manorPrompt(PLAN, "kitchen/N",
        deriveMeta(PLAN, "kitchen", "N"),
        scaffoldRects(PLAN, "kitchen", "N", deriveMeta(PLAN, "kitchen", "N")).rects);
      expect(run("kitchen-clean.prompt.txt", kitchen)).toBe("");
      expect(run("kitchen.prompt.txt", kitchen + "  With dark oak wall panelling throughout.\n"))
        .toMatch(/row29:prompt\.voice_incoherent/);
      /* (6) the ration */
      expect(run("arms.prompt.txt", kitchen + "Armorial glass: set the family arms in the window.\n"))
        .toMatch(/row29:prompt\.heraldry_unrationed/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  /* ------------------------------------------------------------------ */
  test("a room with no voice is refused, never defaulted", () => {
    const bogus = { rooms: [{ id: "nowhere", type: "mystery", archetype: "mystery",
      facings: { N: { type: "enclosed" } } }] };
    expect(() => voiceFor(bogus, "nowhere", "N")).toThrow(/resolves to no voice/);
    expect(() => voiceFor(PLAN, "not_a_room", "N")).toThrow(/no room/);
    expect(() => voiceFor(PLAN, "kitchen", "Q")).toThrow(/no facing/);
    /* And a wall of an unknown room in a FUTURE plan still resolves, by
       archetype, and says that is what happened. */
    const future = { rooms: [{ id: "brewhouse", type: "enclosed", archetype: "service",
      facings: { N: { type: "enclosed" } } }] };
    const got = voiceFor(future, "brewhouse", "N");
    expect(got.voice.id).toBe("service");
    expect(got.via).toMatch(/^archetype/);
  });

  /* ------------------------------------------------------------------ */
  /* THE RE-ASK, AND THE ONE SENTENCE THAT CANNOT BE QUOTED.
     `privy_garden/N`'s correction is Kabe's veto, and to say what went wrong it
     names "interior oak panelling and a chair-rail" — on the one wall those
     words were vetoed from. Carried verbatim it put them back in front of the
     generator, and the lint refused the packet the first time it was emitted. */
  test("a correction is carried verbatim unless the words are the defect", () => {
    const state = JSON.parse(readFileSync(join(repoRoot, "design", "batches",
      "row23-scaffold", "manor", "run-state.json"), "utf8"));
    const build = (key) => {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      return manorPrompt(PLAN, key, meta, rects, state.walls[key].correction);
    };
    /* A measured scale correction is forward-facing and goes through whole. */
    const gh = state.walls["great_hall/E"].correction;
    expect(carryableOutdoors(gh)).toBe(true);
    expect(build("great_hall/E"), "a measured correction was not carried verbatim").toContain(gh);
    /* The veto is not, and the prompt must not contain it. */
    const veto = state.walls["privy_garden/N"].correction;
    expect(veto, "the veto no longer names interior fabric — this case has gone blind")
      .toMatch(/panelling|chair-rail/i);
    expect(carryableOutdoors(veto)).toBe(false);
    const pg = build("privy_garden/N");
    expect(pg, "the veto's own words were carried into the wall they were vetoed from")
      .not.toMatch(/panell?ing|chair[- ]?rail|wainscot/i);
    expect(pg, "the re-ask does not say it is one").toMatch(/^Correction on a previous attempt/m);
    expect(pg).toContain(REDACTED_CORRECTION);
  });

  test("every retry packet on disk carries its room's voice and passes the lint", () => {
    const p = join(repoRoot, "design", "batches", "row23-scaffold", "manor", "retries.json");
    if (!existsSync(p)) {
      test.info().annotations.push({ type: "pending",
        description: "no retries have been emitted yet — this case arms itself when they are" });
      return;
    }
    const r = JSON.parse(readFileSync(p, "utf8"));
    expect(r.entries.length, "retries.json holds no packets").toBeGreaterThan(0);
    const files = [];
    for (const e of r.entries) {
      const [loc, f] = e.key.split("/");
      expect(e.voice.id, `${e.key}'s packet was cut at a voice its room does not resolve to`)
        .toBe(voiceFor(PLAN, loc, f).voice.id);
      const prompt = join(repoRoot, e.packet, "prompt.txt");
      expect(existsSync(prompt), `${e.packet} has no prompt.txt`).toBe(true);
      /* THE VERBATIM REASON IS ALWAYS IN THE PACKET, even where the prompt may
         not quote it — a reader needs it and no generator reads it. */
      expect(readFileSync(join(repoRoot, e.packet, "PACKET.md"), "utf8"),
        `${e.packet}'s PACKET.md does not carry the correction that caused the re-ask`)
        .toContain(e.correction);
      files.push(prompt);
      /* And beside every candidate, which is where the measurement looks. */
      for (const roll of e.rolls) {
        expect(existsSync(join(repoRoot, roll.prompt)),
          `${roll.prompt} is missing — a return would land with no prompt beside it`).toBe(true);
        files.push(join(repoRoot, roll.prompt));
      }
    }
    let out = "";
    try {
      out = execFileSync("python3", [LINT, ...files], { encoding: "utf8", cwd: repoRoot });
    } catch (e) {
      throw new Error(`prompt_lint refused an emitted retry packet:\n${String(e.stdout || "")}`);
    }
    expect(out).toMatch(/\n0 of \d+ prompt\(s\) refused\./);
  });

  test("windowLines says nothing at all when the plan draws no window", () => {
    const L = windowLines(VOICES.service, [], "kitchen", "wall");
    expect(L.length).toBe(1);
    expect(L[0]).toMatch(/carries no window/);
  });
});

/* Row 36 — the texture library's types.
 *
 * The voices say what a surface is made of; MATERIALS says how big it is. These
 * cases guard the three things that can go wrong with that seam, and every one
 * of them is a defect this row actually shipped in a draft before a critic
 * found it:
 *
 *   the census walked a typed triple — walls/ceiling/floor — and MISSED 15 of
 *   the 47 material strings on the map it was already governing: a `blank` on
 *   every voice, the manor's own exterior elevation, and three ranks of
 *   bedchamber hangings. A completeness test that enumerates a hardcoded list
 *   is not a completeness test, which is the row-11 lesson said again.
 *
 *   the material id was going to be derived from the prose by a slug — and
 *   `cross_passage.walls` is a strict PREFIX of `long_gallery.walls`, so any
 *   truncating slug merges them silently AND "solves" the passage's swatch by
 *   handing it the gallery's cornice.
 *
 *   the scale contract is what makes a tile material rather than a picture of
 *   some material, so a swatch whose ppm cannot be derived must be refused
 *   rather than admitted at a guess.
 */
test.describe("row 36 — material types for the texture library", () => {
  test("every material-bearing key on every voice resolves, and the keys are found by walking the object", () => {
    expect(() => assertMaterialsComplete(VOICES)).not.toThrow();
    const stats = assertMaterialsComplete(VOICES);
    expect(stats.reached, "every declared material is reached by some voice").toBe(stats.materials);

    /* THE KEYS ARE DERIVED, NOT LISTED. Walking the objects must find strictly
       more than the three-slot census did, and the difference is exactly the
       15 strings that census could not see. */
    let all = 0, triple = 0;
    for (const v of Object.values(VOICES)) {
      all += materialKeysOf(v).length;
      for (const k of ["walls", "ceiling", "floor"]) if (typeof v[k] === "string") triple++;
    }
    expect(all, "walking the voice objects finds more keys than a typed triple").toBeGreaterThan(triple);
    expect(materialKeysOf(VOICES.outdoors_walled)).toContain("walls_with_openings");
    expect(materialKeysOf(VOICES.bedchamber)).toContain("hangings.best");
    for (const v of Object.values(VOICES)) expect(materialKeysOf(v)).toContain("blank");
  });

  test("a voice that grows a material key nobody bound is REFUSED, not defaulted", () => {
    /* The whole point: the next map invents a surface, and the library notices.
       A fallback here is how the study's paragraph reached the scullery. */
    const grown = { ...VOICES, invented: { ...VOICES.service, id: "invented" } };
    expect(() => assertMaterialsComplete(grown))
      .toThrow(/no material binding for voice/i);

    expect(() => materialOf("service", "wainscot_frieze"))
      .toThrow(/names no material|cannot be assembled/i);
  });

  test("material ids are authored, and the prefix that would have merged two materials does not", () => {
    /* Verified, not asserted: the gallery's string really is the passage's plus
       a cornice clause, so a truncating slug is not a hypothetical hazard. */
    const cp = VOICES.cross_passage.walls, lg = VOICES.long_gallery.walls;
    expect(lg.startsWith(cp), "the gallery's wall string extends the passage's").toBe(true);
    expect(lg).not.toBe(cp);

    const a = materialOf("cross_passage", "walls").id;
    const b = materialOf("long_gallery", "walls").id;
    expect(a, "two different fabrics keep two different ids").not.toBe(b);

    /* And they do not share a lane by accident either: the passage has no
       promoted facing to harvest from, so it is the one wall swatch. */
    expect(materialOf("cross_passage", "walls").lane).toBe("swatch");
    expect(materialOf("long_gallery", "walls").lane).toBe("harvest");
  });

  test("`blank` names the same material as `walls` — 47 strings are 33 materials", () => {
    for (const [vid, v] of Object.entries(VOICES)) {
      if (typeof v.blank !== "string") continue;
      expect(materialOf(vid, "blank").id,
        `${vid}: an unbroken wall is the same fabric with nothing on it`)
        .toBe(materialOf(vid, "walls").id);
    }
    const stats = assertMaterialsComplete(VOICES);
    expect(stats.base, "33 base materials cover the whole manor").toBe(33);
  });

  test("the lane split is the measurement's, not a preference: walls harvest, floors and ceilings are asked", () => {
    for (const m of Object.values(MATERIALS)) {
      if (m.slot === "floor" || m.slot === "ceiling") {
        expect(m.lane, `${m.slot} cannot be harvested — 0 of 51 facings clear its demand`).toBe("swatch");
      }
    }
    const walls = Object.entries(MATERIALS).filter(([, m]) => m.slot === "walls");
    expect(walls.filter(([, m]) => m.lane === "harvest").length).toBeGreaterThan(0);
    const swatches = Object.values(MATERIALS).filter((m) => m.lane === "swatch").length;
    expect(swatches, "the plan's arithmetic: 21 swatch asks for the whole building").toBe(21);
  });

  test("every material carries a derivable scale, and the ask's own arithmetic clears its slot's demand", () => {
    for (const [id, m] of Object.entries(MATERIALS)) {
      const sc = scaleContract(m.slot, m.tiling);
      expect(sc.ppm, `${id} carries a ppm`).toBeGreaterThan(0);
      expect(sc.ppm, `${id} clears its slot's declared demand`)
        .toBeGreaterThanOrEqual(SLOT_DEMAND_PPM[m.slot]);
      if (sc.kind === "periodic") {
        /* the count is the LARGEST that still clears — one more would not */
        const span = (sc.count + 1) * sc.pitch_m;
        expect(SWATCH_W_PX / span,
          `${id}: ${sc.count} is the widest swatch that still clears the demand`)
          .toBeLessThan(SLOT_DEMAND_PPM[m.slot]);
        expect(sc.span_m).toBeCloseTo(sc.count * sc.pitch_m, 6);
      } else {
        expect(["stochastic", "featureless"]).toContain(sc.kind);
      }
    }
  });

  test("a pitch too coarse to fit one module at the demand is refused rather than rounded to zero", () => {
    expect(() => swatchCount("floor", 12.0)).toThrow(/not one whole module fits/i);
  });

  test("a floor's grain is a fact about the ROOM, never about the facing", () => {
    /* If a floor's grain were named in surface coordinates it would be a
       property of which way you are standing — turn ninety degrees and the
       boards swing, which is the exact disease this row exists to cure. */
    for (const [id, m] of Object.entries(MATERIALS)) {
      if (m.slot === "floor" || m.slot === "ceiling") {
        expect(m.tiling.grain_frame, `${id} is anchored in plan space`).toBe("plan");
        if (m.tiling.grain_axis) {
          expect(["room_long", "room_short"]).toContain(m.tiling.grain_axis);
        }
      } else {
        expect(m.tiling.grain_frame, `${id} is anchored on its own wall`).toBe("surface");
        if (m.tiling.grain_axis) expect(["u", "v"]).toContain(m.tiling.grain_axis);
      }
    }
    expect(materialOf("long_gallery", "floor").tiling.grain_axis,
      "the gallery's boards run its length, whichever way you face").toBe("room_long");
  });

  test("the committed materials.json is what the emitter produces right now", () => {
    /* Row 20's scar, in its cheapest form: a committed artifact that has
       drifted from the generator that claims to produce it is a file nobody
       can regenerate, and the Python assembler reads THIS file. */
    const out = join(repoRoot, "backdrops", "textures", "materials.json");
    expect(existsSync(out), "the emitted material table is committed").toBe(true);
    const onDisk = readFileSync(out, "utf8");
    const fresh = JSON.stringify(emitMaterials(VOICES), null, 2) + "\n";
    expect(onDisk, "run `node tools/room-voices.mjs --emit-materials`").toBe(fresh);
  });
});
