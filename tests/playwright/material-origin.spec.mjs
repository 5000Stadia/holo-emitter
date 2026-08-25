/* Row 40 — THE ORIGIN of the rooms that were painted as two rooms.
 *
 * [HUMAN, 2026-08-24, verbatim] "Make sure we're not just fixing it. We need to
 * hunt down the cause, determine its origin and bake in the consistent
 * solution."
 *
 * `room_consistency.py` measured five rooms whose facings do not look like one
 * room. It measures PIXELS. This file is about the ASKS behind those pixels,
 * because that is where the cause turned out to be, and the cause is exact:
 *
 *   `4efd69d` 2026-08-23 03:54  the manor run emits 85 packets. The composer
 *                              then keyed materials on `room.archetype` and
 *                              fell through to the panelled-parlour default,
 *                              so a bedchamber, a garden parlour, a kitchen and
 *                              the servants' hall were every one of them asked
 *                              for "dark hand-finished oak wall panelling, aged
 *                              parchment-toned plaster ceiling, wide worn oak
 *                              floorboards".
 *   `e0f02b6` 2026-08-23 11:03  row 29 lands the voice table — and re-emits
 *                              THIRTEEN walls under it. `--emit-manor` skips a
 *                              facing that is promoted or already has
 *                              candidates on disk, so the correction could not
 *                              reach any of the rest.
 *   `d223961` 2026-08-23 14:16  the sweep re-asks 27 held walls, and those
 *                              carry the voice.
 *
 * From 11:03 on, WHETHER A FACING SPOKE ITS ROOM'S VOICE WAS DECIDED BY WHETHER
 * IT HAPPENED TO NEED A RE-ASK — a camera property deciding a room property.
 * Four walls of one room, rolled independently, landed on both sides of that
 * line, and the room stopped being one room. All five of the rooms the pixel
 * measure flagged split exactly along it, facing for facing.
 *
 * So the structural cause is not the old table. A table gets corrected. It is
 * that a correction to the table CANNOT REACH THE STORE — idempotence-by-
 * existence means the emitter never re-asks a wall it already has — and nothing
 * anywhere was watching for a promoted painting made from an ask this composer
 * would no longer write. Five things are checked here, and each is one half of
 * that:
 *
 *   1. one room, one material ask, over all 88 facings the plan holds, with the
 *      single outdoor exemption declared by name rather than discovered;
 *   2. a carrier-less facing is not told a second fabric — the `voice.blank`
 *      hole, which is the same disease one level down;
 *   3. the style seed every packet attaches is one file, byte for byte;
 *   4. the ask audit is strictly stronger than the pixel measure on the pixel
 *      measure's own corpus, including the miss row 40 logged OPEN;
 *   5. the repair route can be driven from the asks, seeding only from a facing
 *      whose ASK was the ruling — which is a stronger rule than seeding from
 *      the pixel majority, and `guest_chamber` is the case that proves it.
 *
 * The promotion clause that keeps the disease out of the store from here on
 * lives in the clause ledger (`guards.spec.mjs`, `material.voice_stale` and
 * `material.ask_unreadable`), where every promotion refusal in this project is
 * required to have a case that goes red on it alone.
 */
import { test, expect } from "@playwright/test";
import { repoRoot, expectDerived } from "./helpers.mjs";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { VOICES, voiceFor, hangingsFor } from "../../tools/room-voices.mjs";
import {
  manorPrompt, scaffoldRects, materialParts, materialLines, rulingSentences,
  normMaterial, materialProvenance, provenanceAsConsistencyReport, styleImageFor,
  isVouched, classifyAsk, materialNamedIn
} from "../../tools/make-scaffold.mjs";
import { SAID_BEFORE, declaredMaterialPhrases, MATERIALS, canonicalMaterial }
  from "../../tools/room-voices.mjs";
import { attachLine, attachLineAll } from "../../tools/edge-seed.mjs";
import { OPEN_SIDE_FABRIC, g4ManorPrompt } from "../../tools/make-scaffold.mjs";
import { deriveMeta } from "../../tools/plan-projection.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const CONSISTENCY = join(repoRoot, "design", "plan-draft", "measured", "room_consistency.json");
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** Every facing's ask, derived exactly as the manor emitter derives it. */
function everyFacing() {
  const out = [];
  for (const room of PLAN.rooms) {
    for (const f of Object.keys(room.facings || {})) {
      const meta = deriveMeta(PLAN, room.id, f);
      const { rects } = scaffoldRects(PLAN, room.id, f, meta);
      const { voice } = voiceFor(PLAN, room.id, f);
      const ctx = {
        voice, loc: room.id, out: !!voice.outdoor,
        openSide: rects.some((r) => r.kind === "open_edge"),
        built: rects.some((r) => r.kind !== "open_edge")
      };
      out.push({
        key: `${room.id}/${f}`, room: room.id, facing: f, voice, ctx,
        carriers: rects.map((r) => r.kind),
        text: manorPrompt(PLAN, `${room.id}/${f}`, meta, rects)
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 1. ONE ROOM, ONE MATERIAL ASK                                       */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the origin: one room is asked for one set of materials", () => {
  /* THE ONE LICENSED DIFFERENCE, DECLARED HERE AND NOWHERE ELSE. An outdoor
     location's sides are not all the same thing: `entrance_court`'s mouth has
     no wall on it at all and its other three sides are the manor's own brick
     elevation, so asking all four for one fabric would be asking for a wall
     across the mouth — which is the parapet the painter obediently built when
     the emitter did exactly that. The exemption is by NAME so that a room
     quietly acquiring a second fabric cannot hide inside it. */
  const OUTDOOR_SPLIT = new Set(["entrance_court", "entrance_approach", "privy_garden"]);

  test("all 88 facings resolve, and each room's material sentences are identical across them", () => {
    const rows = everyFacing();
    expect(rows.length, "the sweep has gone blind — no facing resolved").toBe(88);

    const byRoom = new Map();
    for (const r of rows) byRoom.set(r.room, (byRoom.get(r.room) || []).concat(r));
    expect(byRoom.size, "every room of the plan is swept").toBeGreaterThan(0);

    for (const [room, facings] of byRoom) {
      /* THE VOICE FIRST: `voiceFor` must answer the same for all four facings
         of a room, because everything below is downstream of it. An outdoor
         location is the exception and it is the SAME exception — a side with
         no wall resolves to `outdoors_open` and a walled one to
         `outdoors_walled`. */
      const voices = new Set(facings.map((f) => f.voice.id));
      if (!OUTDOOR_SPLIT.has(room)) {
        expect([...voices], `${room}: voiceFor answers differently for different facings ` +
          `of one room, so the room is two rooms before a prompt is even composed`)
          .toEqual([facings[0].voice.id]);
      }

      /* THEN THE SENTENCES. Compared through `materialParts`, which is the one
         place a manor ask's materials are composed — so this is asking the
         emitter itself rather than parsing its output back. */
      const parts = facings.map((f) => ({ f, p: materialParts(f.ctx) }));
      for (const k of ["walls", "overhead", "underfoot", "hangings"]) {
        const vals = new Map();
        for (const { f, p } of parts) {
          vals.set(String(p[k]), (vals.get(String(p[k])) || []).concat(f.facing));
        }
        if (vals.size === 1) continue;
        expect(OUTDOOR_SPLIT.has(room),
          `${room}: its facings are asked for ${vals.size} different ${k} — ` +
          [...vals].map(([v, fs]) => `${fs.join("")} = ${JSON.stringify(v)}`).join("; ") +
          `. A room commissioned from two sets of materials is painted as two rooms ` +
          `and reads as two rooms when you turn; that is row 40's whole finding, and ` +
          `only an outdoor location with an open side is licensed to differ`).toBe(true);
      }

      /* AND THE SENTENCES ARE ACTUALLY IN THE PROMPT. A composer that computed
         the right parts and emitted something else would pass everything above
         and still ask for the wrong room. */
      for (const { f, p } of parts) {
        for (const [k, v] of Object.entries(p)) {
          if (!v) continue;
          /* [row 43] THE ONE FABRIC THAT IS SAID AS A CARRIER AND NOT AS A
             FABRIC. An open side is the ABSENCE of a wall, and the clean
             register states it once, in the carrier clause, with the ruled
             width the emitter derived — "there is no wall here at all. It is
             open across its full 20.40 m width". Saying it a second time as a
             materials sentence is half of what Kabe was reading when he called
             the production prompt a mess, so the ask is checked for the FACT
             rather than for the phrase. */
          if (v === OPEN_SIDE_FABRIC) {
            expect(f.text, `${f.key}: its ask never says the open side has no wall on it`)
              .toMatch(/there is no wall here at all\. It is open across its full \d+\.\d\d m width/);
            continue;
          }
          expect(f.text.includes(v),
            `${f.key}: its ask does not carry the ${k} the plan rules for the room ` +
            `(${JSON.stringify(v)})`).toBe(true);
        }
      }
    }
  });

  test("the invariance case can go red — a room split across two voices is caught", () => {
    /* THE RED ARM, and it is the exact shape the store is in: one facing of a
       room answering to a different voice from the others. Built here rather
       than asserted, because a check that has never been seen to fail is a
       check nobody has read. */
    const bedchamber = materialParts({
      voice: VOICES.bedchamber, loc: "guest_chamber", out: false,
      openSide: false, built: true
    });
    const parlour = materialParts({
      voice: VOICES.parlour_wainscot, loc: "guest_chamber", out: false,
      openSide: false, built: true
    });
    /* This IS the guest chamber: S got the first and N/E/W got the second. */
    expect(bedchamber.walls).not.toBe(parlour.walls);
    expect(bedchamber.overhead).not.toBe(parlour.overhead);
    expect(bedchamber.underfoot).not.toBe(parlour.underfoot);
    expect(bedchamber.hangings, "a bedchamber's ask names the rank of its hangings").toBeTruthy();
    expect(parlour.hangings, "a parlour's does not").toBeNull();
  });

  test("a carrier-less facing is told no second fabric", () => {
    /* THE `voice.blank` HOLE, which is the same disease one level down and was
       still live at HEAD. `hall_state` and `great_chamber` bound `walls` to
       "dark oak wall panelling in fielded bays ... lime-plastered wall head"
       and `blank` to "unbroken oak wainscot under a carved frieze", and only a
       facing carrying NO carrier ever saw the second one — so a blank wall of
       the great hall or the solar was told panelling in one sentence and
       wainscot in another while its neighbours were told only panelling. Row
       36's MATERIAL_BINDING already binds the two to ONE texture id, so the
       words were the only thing dissenting.

       The blank clause now points at the shared `Materials/textures` sentence
       instead of composing a fabric of its own, and this is what keeps it
       pointing: a blank facing's ask may contain no fabric vocabulary its
       room's own material sentences do not. */
    const FABRIC = /\b(panell?ing|panelled|wainscot|limewash(?:ed)?|plaster(?:ed)?|brickwork|ashlar|flagstone|floorboards?|joists?|boarded|dado|frieze|hangings|tapestry|worsted|serge)\b/gi;
    const blanks = everyFacing().filter((f) => f.carriers.length === 0);
    expect(blanks.length, "no facing of the plan is carrier-less — this case is blind")
      .toBeGreaterThan(0);
    for (const f of blanks) {
      const parts = materialParts(f.ctx);
      const allowed = new Set(
        normMaterial(Object.values(parts).filter(Boolean).join(" ")).match(FABRIC) || []);
      /* The blankness sentence itself, and only it: everything else in the ask
         is the carrier language, the anchor and the style, which the rest of
         the suite owns. */
      const line = f.text.split("\n")
        .filter((l) => /carries no opening and no built feature at all/.test(l))
        .join(" ");
      expect(line, `${f.key} carries no carrier and its ask never says so`).toBeTruthy();
      for (const word of new Set(normMaterial(line).match(FABRIC) || [])) {
        expect(allowed.has(word),
          `${f.key}: the blankness sentence names "${word}", which this room's own material ` +
          `sentences do not. A carrier-less facing must not be given a second fabric — that is ` +
          `a per-FACING property deciding a per-ROOM one, which is exactly row 40's disease`)
          .toBe(true);
      }
    }
  });

  test("every voice's blank restatement names the fabric its walls name", () => {
    /* AND THE TABLE IS CHECKED TOO, not only the emitter, because `blank` is
       still read by `emit-evolution.mjs` and still bound beside `walls` in row
       36's MATERIAL_BINDING. A voice whose two strings name different fabrics
       is a trap standing ready for the next reader of the table. */
    const NOUN = /\b(panell?ing|panelled|wainscot|limewash(?:ed)?|plaster(?:ed)?|brick|brickwork|ashlar|flagstone|floorboards?|joists?|boarded|dado|frieze|hangings|tapestry|worsted|serge)\b/gi;
    /* `brick` and `brickwork` are the same material said two ways, and so are
       `plaster` and `plastered`; the comparison is on the stem. */
    const stem = (w) => w.toLowerCase()
      .replace(/^panell?ing$|^panelled$/, "panel")
      .replace(/^brickwork$/, "brick")
      .replace(/^limewashed$/, "limewash")
      .replace(/^plastered$/, "plaster")
      .replace(/^floorboard$/, "floorboards");
    for (const [id, v] of Object.entries(VOICES)) {
      if (typeof v.blank !== "string") continue;
      const inWalls = new Set([...(v.walls.match(NOUN) || [])].map(stem));
      for (const w of new Set([...(v.blank.match(NOUN) || [])].map(stem))) {
        expect(inWalls.has(w),
          `voice \`${id}\`: its \`blank\` restatement names "${w}" and its \`walls\` fabric does ` +
          `not. The two describe ONE surface — row 36 binds them to one texture id — so a word ` +
          `in one and not the other is two fabrics for one room waiting to be asked for`)
          .toBe(true);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* 2. THE STYLE SEED IS ONE FILE                                       */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the origin: what else could have differed per facing", () => {
  test("every packet on disk attached the same style seed, byte for byte", () => {
    /* RULED OUT BY MEASUREMENT, not by reading the emitter. Image 1 is the one
       reference every ask shares, and a packet that attached a different file
       — or the same file re-encoded — would give one facing of a room a
       different palette to match with no sentence anywhere saying so. */
    const canonical = join(repoRoot, "design", "references", "style-seed-warm.png");
    expect(existsSync(canonical), "the style seed this project rules is not on disk").toBe(true);
    const want = sha(canonical);
    const found = [];
    const walk = (dir) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (e === "style-seed-warm.png") found.push(p);
      }
    };
    const batches = join(repoRoot, "design", "batches");
    if (existsSync(batches)) walk(batches);
    expect(found.length, "no packet on disk carries a style seed — this case is blind")
      .toBeGreaterThan(0);
    const wrong = found.filter((p) => sha(p) !== want)
      .map((p) => p.slice(repoRoot.length + 1));
    expect(wrong,
      "these packets attached something other than design/references/style-seed-warm.png as " +
      "Image 1, so the facings they painted were matched against a different reference")
      .toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 3. THE ASK AUDIT, AGAINST THE PIXEL MEASURE                         */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the origin: the ask audit reads what the pixels only imply", () => {
  test("it names every room the pixel measure calls mismatched, and one more", () => {
    /* [production law clause 6] TWO INSTRUMENTS, ONE STORE, AND ONLY ONE OF
       THEM IS LIVE HERE. `materialProvenance` is computed against the store as
       it stands; `room_consistency.json` is COMMITTED, because the pixel measure
       resamples 57 paintings and costs seventeen seconds. Comparing a live
       reading with a committed one is exactly the seam this case kept falling
       into: the loop promoted, superseded and re-snapped walls, the committed
       measure went on describing the store before all that, and the disagreement
       read as a finding about the two instruments. The freshness of the
       committed half is asked first and by machine. */
    expectDerived("room_consistency");
    expect(existsSync(CONSISTENCY),
      "room_consistency.json has never been written — run the measure").toBe(true);
    const pixels = JSON.parse(readFileSync(CONSISTENCY, "utf8"));
    const asks = materialProvenance(PLAN);
    const split = new Set(asks.split_rooms);

    const mismatched = (pixels.rooms || [])
      .filter((r) => String(r.verdict || "").startsWith("mismatched")).map((r) => r.room);
    expect(mismatched.length, "the pixel measure flagged nothing — this case is blind")
      .toBeGreaterThan(0);
    /* THE TWO ROOMS THE ASK REPAIR CLOSED AND THE PIXELS DID NOT FOLLOW —
     * named one at a time, and held rather than skipped.
     *
     * The claim above was made of the store as it stood before any repair, and
     * it was true of it: five rooms mismatched in pixels, five rooms split in
     * the asks, facing for facing. It is NOT an invariant of the system, and it
     * cannot be, because the repair route this file's own section 4 drives is
     * what breaks it: `--emit-consistency --from-ask` re-asks a room naming its
     * ruling materials, the returns are promoted, and the room leaves the
     * audit's set that same moment — while its pixels move only as far as the
     * painter took them. `master_bedchamber` (4.474 -> 4.144, ceiling band) and
     * `garden_room` (6.208 -> 3.904) both went through it, both improved, and
     * neither crossed the 3.75 cut. Their asks now agree; their paintings still
     * do not. That is the residue an ask cannot reach — one instruction, two
     * materially different surfaces back — and on master_bedchamber's worst
     * pair it is carried by CONTRAST (dT 1.638) and not by colour (dChroma
     * 0.088): the same plaster in the same brown, painted with far more grain
     * on one facing than the other.
     *
     * Logged OPEN under production law clause 2 in
     * `design/plan-draft/measured/misses.jsonl` (round row40), with what would
     * close it: row 36's assembled rooms, where a room's facings are
     * composited from one material library and one lighting solve instead of
     * rolled independently. A re-ask cannot close it — it would ask for the
     * materials the room has already asked for.
     *
     * WHAT MAKES THIS A LEDGER AND NOT AN EXEMPTION: the loop below does not
     * skip these rooms, it PINS them. A named room must still be mismatched in
     * the pixels AND still be current in the asks. The day either moves — the
     * assembly lands and the pixels agree, or someone edits the voice table and
     * the asks go stale again — this case goes red and the line has to be
     * deleted or the room handed back to the assertion above. */
    const ASK_CLOSED_PIXELS_OPEN = new Set(["master_bedchamber", "garden_room"]);

    for (const room of mismatched) {
      if (ASK_CLOSED_PIXELS_OPEN.has(room)) continue;          // pinned below
      expect(split.has(room),
        `${room} does not read as one room in the pixels, and the asks behind those pixels ` +
        `look like one ask. Either the disease has a second cause this audit cannot see, or ` +
        `the audit has gone blind — both are findings`).toBe(true);
    }
    for (const room of ASK_CLOSED_PIXELS_OPEN) {
      expect(mismatched,
        `${room} is carried as a room whose ask repair closed and whose pixels did not follow, ` +
        `and the pixel measure no longer calls it mismatched. The miss has closed: delete its ` +
        `line here and its OPEN entry in misses.jsonl, in the same commit`)
        .toContain(room);
      const rec = asks.rooms.find((r) => r.room === room);
      expect(rec && rec.verdict,
        `${room} is carried here as a room the ask audit has nothing left to say about, and the ` +
        `audit now calls it "${rec && rec.verdict}". Its mismatch is back inside this case's ` +
        `reach — take it out of the list rather than letting the pin hide it`)
        .toBe("current");
    }

    /* STRICTLY STRONGER, AND MEASURED RATHER THAN NAMED.
     *
     * This stood as `split.has("stair_landing")`: that room scored 2.12, well
     * under the 3.75 cut, because its two ceilings differed almost purely in
     * BRIGHTNESS — the one axis the pixel sweep proved must not vote — while in
     * the asks there was nothing subtle about it at all (N asked for "a plain
     * lime-plastered ceiling", E for a "boarded ceiling"). One room, named, as
     * the whole evidence that reading the INSTRUCTION beats reading the pixels.
     *
     * Then the repair route this file's own section 4 drives did its work:
     * `--emit-consistency --from-ask` re-asked `stair_landing/E` naming the
     * room's ruling materials, the supersede route promoted the return, and the
     * audit has called that room `current` ever since. The assertion went red
     * for the repair succeeding — a guard firing on success, the same shape as
     * the flight grant's — and every wall of the manor finishing would have
     * taken it down whatever happened.
     *
     * So the claim is asserted as the claim, over whatever the store holds: the
     * audit must name at least one room the pixel measure calls consistent. That
     * is what "strictly stronger" MEANS, it cannot be satisfied by a room the
     * pixels already found, and it survives the corpus being repaired. */
    const pixelVerdict = new Map((pixels.rooms || []).map((r) => [r.room, String(r.verdict || "")]));
    const seenOnlyInTheAsks = [...split]
      .filter((r) => pixelVerdict.has(r) && !pixelVerdict.get(r).startsWith("mismatched"));
    expect(seenOnlyInTheAsks.length,
      "every room the ask audit calls split is one the pixel measure had already flagged, so " +
      "reading the instruction has bought nothing over reading the paint. The audit is either " +
      "blind or redundant, and both are findings").toBeGreaterThan(0);

    /* AND THE ONE THE LEDGER NAMES, held either way. `stair_landing` is the miss
       `misses.jsonl` logs OPEN against the pixel instrument. It may leave the
       audit's list for exactly one reason — every one of its promoted facings
       was actually asked for the room's ruling materials — and never by the
       audit quietly losing sight of it (an `unprovable` facing, a room that
       dropped out of the report). The disjunction is stronger than the
       assertion it replaces: on the closed branch it demands a per-facing
       verdict for the whole room. */
    if (split.has("stair_landing")) {
      expect(pixelVerdict.get("stair_landing") || "",
        "stair_landing is the miss the pixel measure cannot see, and it now sees it — the " +
        "instrument miss has closed and its OPEN entry in misses.jsonl should say so")
        .not.toMatch(/^mismatched/);
    } else {
      const sl = asks.rooms.find((r) => r.room === "stair_landing");
      expect(sl, "stair_landing has left the ask audit's report altogether, which is the audit " +
        "going blind rather than the room being repaired").toBeTruthy();
      expect(sl.verdict, "stair_landing is no longer split and the audit does not call it current " +
        "either, so nothing here says the ask repair is what closed it").toBe("current");
      for (const f of sl.facings) {
        expect(f.verdict,
          `stair_landing/${f.facing} is promoted and the audit cannot say its ask was this ` +
          `room's ruling — the room left the split list without every wall being repaired`)
          .toBe("current");
      }
    }

    /* AND IT DOES NOT CRY WOLF. The row-40 README labelled six rooms as
       plainly ONE room by eye, before any weight was chosen. Not one of them
       may come back as split, or the audit is buying its recall with
       precision and the repair route pays a model call per false flag. */
    for (const room of ["kitchen", "buttery_pantry", "solar", "muniment_room",
      "long_gallery", "dining_parlour"]) {
      expect(split.has(room),
        `${room} was labelled by eye as plainly ONE room, and the ask audit calls its facings ` +
        `differently commissioned. A false flag here costs a re-ask roll`).toBe(false);
    }
  });

  test("it reports rather than skips a promoted painting whose ask cannot be recovered", () => {
    /* PRODUCTION LAW LEAVES NO GATE THAT CANNOT FAIL. A painting in the store
       whose ask is not on disk is not a pass: nobody can show it was asked for
       this room. It gets its own verdict and its own line, and it is NOT
       counted as a second ask — calling it a split would send a re-ask to a
       wall that may be perfectly correct. */
    const asks = materialProvenance(PLAN);
    for (const r of asks.rooms) {
      for (const f of r.facings) {
        expect(["current", "stale", "unrecoverable"]).toContain(f.verdict);
        if (f.verdict !== "unrecoverable") continue;
        expect(f.why, `${r.room}/${f.facing} must say why its ask could not be read`).toBeTruthy();
        expect(r.unprovable, `${r.room} must carry ${f.facing} as unprovable`)
          .toContain(f.facing);
      }
      /* A room's verdict and its own lists must agree — a report that can
         disagree with itself is not a report. */
      expect(r.verdict === "split-ask").toBe(r.distinct_asks > 1);
      if (r.verdict === "current") {
        expect(r.stale).toEqual([]);
        expect(r.unprovable).toEqual([]);
      }
    }
  });

  test("the audit reads today's composer, so a voice change makes the store stale by itself", () => {
    /* THE WHOLE POINT, stated as a case. The manor's asks are frozen on disk;
       the ruling is recomputed from `room-voices.mjs` every time this runs. So
       the instant anyone corrects the voice table — which is precisely what
       row 29 did, with nothing watching — every wall painted under the old one
       becomes visibly stale here, with no pixels, no browser and no model.
       That is the observer that did not exist on 2026-08-23 at 11:03. */
    const asks = materialProvenance(PLAN);
    const stale = asks.rooms.flatMap((r) =>
      r.facings.filter((f) => f.verdict === "stale").map((f) => ({ room: r.room, f })));
    expect(stale.length, "nothing in the store is stale — this case is blind")
      .toBeGreaterThan(0);
    for (const { room, f } of stale) {
      /* THE VERDICT IS RE-DERIVED HERE rather than read back off the report,
         so a report that simply asserted "stale" for everything would fail
         this. The ask is opened again and the missing sentence looked for in
         it, through the same normaliser the audit uses. */
      expect(f.missing.length, `${room}/${f.facing} is called stale with nothing missing`)
        .toBeGreaterThan(0);
      const text = readFileSync(join(repoRoot, f.ask_path), "utf8");
      const flat = normMaterial(text);
      for (const k of f.missing) {
        expect(flat.includes(normMaterial(f.ruling[k])),
          `${room}/${f.facing}'s ask is said to be missing the ruled ${k} ` +
          `(${JSON.stringify(f.ruling[k])}) and it is in fact there`).toBe(false);
      }
      for (const k of Object.keys(f.ruling)) {
        if (f.missing.includes(k) || !f.ruling[k]) continue;
        expect(flat.includes(normMaterial(f.ruling[k])),
          `${room}/${f.facing}'s ask is said to carry the ruled ${k} and it does not`).toBe(true);
      }
    }
    /* And the ruling a bedchamber is measured against names the RANK of its
       hangings, resolved per room id — `hangingsFor` — because naming only
       `voice.walls` would leave the master bedchamber's ruling silent about
       the very band it fails on. */
    const master = rulingSentences({
      voice: VOICES.bedchamber, loc: "master_bedchamber", out: false,
      openSide: false, built: true
    });
    expect(master.hangings).toBe(hangingsFor("master_bedchamber"));
    expect(master.hangings).not.toBe(hangingsFor("closet_chamber"));
  });
});

/* ------------------------------------------------------------------ */
/* 4. THE REPAIR ROUTE, DRIVEN FROM THE ASKS                           */
/* ------------------------------------------------------------------ */

test.describe("row 40 — the origin: the repair route the audit can drive", () => {
  test("outliers are the facings whose ask was not the ruling, and seeds come only from those whose was", () => {
    /* THE STRONGER FORM OF ROW 40'S OWN SEEDING RULE. The pixel route may cut
       an edge seed only from a facing inside the room's agreeing MAJORITY.
       `guest_chamber` is the case that separates the two rules: three of its
       four facings agree with each other in pixels and all three were asked
       for the wrong fabric, so the pixel majority is the half that is WRONG
       while the ask majority is the single facing that is right. Seeding an
       outlier off another outlier is how a wrong material spreads round a room
       instead of being replaced. */
    const asks = materialProvenance(PLAN);
    const rep = provenanceAsConsistencyReport(asks);
    expect(rep.rooms.length, "nothing to repair — this case is blind").toBeGreaterThan(0);

    const byRoom = new Map(asks.rooms.map((r) => [r.room, r]));
    for (const r of rep.rooms) {
      const src = byRoom.get(r.room);
      expect(r.outliers.length, `${r.room} is in the repair list with nothing to re-ask`)
        .toBeGreaterThan(0);
      for (const f of r.outliers) {
        const rec = src.facings.find((x) => x.facing === f);
        expect(rec.class,
          `${r.room}/${f} is being re-asked by default though its ask named this room's own ` +
          `ruling materials — a roll spent to change wording changes nothing on the wall`)
          .not.toBe("current");
        expect(rec.class,
          `${r.room}/${f} is being re-asked by DEFAULT and it is only \`refined\` — the words ` +
          `moved and the material did not, so this needs --refined-too`).not.toBe("refined");
      }
      for (const f of r.majority) {
        const rec = src.facings.find((x) => x.facing === f);
        expect(isVouched(rec.class),
          `${r.room}/${f} may be cut for an edge seed and its own ask was not this room's ` +
          `ruling material (class ${rec.class}) — seeding an outlier off another outlier ` +
          `spreads the wrong material round the room`).toBe(true);
      }
      expect(r.no_majority).toBe(r.majority.length === 0);
      expect(r.measured, `${r.room}'s re-ask must state what was measured, in its own words`)
        .toMatch(/in the ASKS rather than in the pixels/);
    }

    /* AND THE ROOM WITH NO MAJORITY STANDS ON THE RULING ALONE. */
    const gc = rep.rooms.find((r) => r.room === "guest_chamber");
    expect(gc, "guest_chamber is not in the repair list").toBeTruthy();
    expect(gc.majority, "guest_chamber's one correctly-asked facing is S — the pixel majority " +
      "is the OTHER three, which is why a vote could not have been the authority")
      .toEqual(["S"]);
    expect(gc.outliers.sort()).toEqual(["E", "N", "W"]);
  });

  /* THE AUDIT'S OWN REPORT IS WHAT THE AUDIT WRITES TODAY.
   *
   * `material_provenance.json` is committed, and until this case existed the
   * only thing standing over it was an accident: it sits in the cand-2 round's
   * home, `design/plan-draft/measured/`, and `plan.spec.mjs`'s corpus re-run
   * demanded `measure.py` reproduce every `.json` in that directory. It cannot
   * — `measure.py` reads pixels and this report reads asks — so the accident
   * was a red case that said nothing about staleness, and naming the file out
   * of that comparison would have left the report guarded by nothing at all.
   *
   * This is the project's own staleness shape put where it belongs: run the
   * generator and byte-compare. Its subject is the same one the whole file has
   * — the instant anyone corrects `room-voices.mjs`, or a promotion moves a
   * wall in the store, this report is a description of a manor that no longer
   * exists, and a stale observer is worse than none because it reads like an
   * all-clear. */
  test("the committed audit report byte-equals a fresh run of --audit-materials", () => {
    /* [production law clause 6] AND NOBODY HAS TO RE-RUN IT BY HAND ANY MORE.
       The paragraph above is exactly right about what makes this report stale
       and was silent about whose job it is to notice: the sweep's. It now
       regenerates this report after any pass that moved the store
       (`derived.py`), so the byte-compare below is a claim about the AUDIT and
       the freshness question is asked first, in the one place that answers it
       for every derived artifact at once. */
    expectDerived("material_provenance");
    const rp = join(repoRoot, "design", "plan-draft", "measured", "material_provenance.json");
    expect(existsSync(rp), "the audit has never been written — run --audit-materials").toBe(true);
    /* Composed exactly as `--audit-materials` composes it, so this compares the
       report against the audit and never against a second formatter. */
    const fresh = JSON.stringify(materialProvenance(PLAN), null, 2) + "\n";
    expect(readFileSync(rp, "utf8"),
      "design/plan-draft/measured/material_provenance.json is not what the audit writes today — " +
      "the voice table moved, or the store moved, and nobody re-ran " +
      "`node tools/make-scaffold.mjs --audit-materials`")
      .toBe(fresh);
  });

  test("the legacy ledger names candidates that exist and walls the audit calls stale", () => {
    /* THE LEDGER IS HONEST OR IT IS A LOOPHOLE. Every entry must name a wall
       the audit actually calls not-current and a candidate that is on disk —
       an entry for a wall that is fine is a door standing open, and an entry
       naming bytes nobody has is an admission nobody can check. */
    /* AND THE LEDGER SHRINKS BY MACHINE. Its own header says the list can only
       shrink and that an entry is deleted in the same commit that re-asks its
       wall — which was a human's promise until the sweep started re-sealing it
       after every pass that moved the store. `stair_landing/E` was the case:
       the supersede route repainted it from a roll that names the room's ruling
       materials, the audit called it current the same minute, and the ledger
       went on admitting it. That is the door standing open below, opened by the
       repair rather than by anyone's edit. */
    expectDerived("material_legacy");
    const lp = join(repoRoot, "design", "plan-draft", "measured", "material_legacy.json");
    if (!existsSync(lp)) return;                       // not sealed in this tree
    const ledger = JSON.parse(readFileSync(lp, "utf8"));
    const asks = materialProvenance(PLAN);
    const notCurrent = new Set(asks.rooms.flatMap((r) =>
      r.facings.filter((f) => f.verdict !== "current").map((f) => `${r.room}/${f.facing}`)));
    expect(Object.keys(ledger.admitted || {}).length, "an empty ledger admits nothing")
      .toBe(ledger.open);
    for (const [key, e] of Object.entries(ledger.admitted || {})) {
      expect(notCurrent.has(key),
        `the ledger admits ${key}, which the audit says was asked for its room's own ` +
        `materials. An admission for a wall that is fine is a door standing open`).toBe(true);
      expect(e.candidate, `${key}'s admission names no candidate, so it admits any bytes at all`)
        .toBeTruthy();
      /* AND THE FACING IT NAMES IS ACTUALLY PROMOTED. An admission for a wall
         with nothing in the store is a door held open onto an empty room, and
         it would survive every other check here. */
      const [loc, f] = key.split("/");
      expect(existsSync(join(repoRoot, "backdrops", loc, `${f}.meta.json`)),
        `the ledger admits ${key}, which has no promoted painting at all`).toBe(true);
      expect(e.closes_when, `${key}'s admission does not say what would close it`)
        .toContain("--emit-consistency --from-ask");
    }
  });
});

/* ------------------------------------------------------------------ */
/* 5. THE COMPOSER HAS ONE HOME FOR A MATERIAL SENTENCE                */
/* ------------------------------------------------------------------ */

test("row 40 — every material phrase a manor ask states comes from materialParts(), once", () => {
  /* THE FORWARD HALF OF THE CURE, checked on the emitted text. `manorPrompt`
     used to compose these inline in two branches; the audit and the promotion
     clause both ask `materialParts` what a room's ask should say, so a second
     composition site anywhere would let the emitter and its own gate describe
     two different rooms and agree with each other about it.

     [row 43] THE PHRASE IS WHAT IS CHECKED, NOT `materialLines`' LINE. The
     clean register states the same ruled phrases in its own item 1 ("Its walls
     are …", "Overhead: …. Underfoot: …") rather than under a
     `Materials/textures:` heading; `materialLines` composes the incumbent's
     heading and is checked against the incumbent below, where it lives.

     AND EXACTLY ONCE, WHICH IS THE STRONGER HALF AND IS NEW. [HUMAN,
     2026-08-24] "That prompt seems like a mess too…." — the ask he was reading
     stated its room's materials THREE times, in the correction, under
     `Materials/textures:` and again inside the carrier sentences. One
     occurrence of each ruled phrase, on all 88, is that complaint as a
     mechanical clause. */
  const count = (h, n) => h.split(n).length - 1;
  for (const f of everyFacing()) {
    const parts = materialParts(f.ctx);
    for (const [k, v] of Object.entries(parts)) {
      if (!v) continue;
      if (v === OPEN_SIDE_FABRIC) continue;      // said as a carrier — see above
      const n = count(f.text, v);
      expect(n, `${f.key}: its ask states the ${k} the plan rules for the room ${n} time(s), ` +
        `not once (${JSON.stringify(v)})`).toBe(1);
    }
  }
});

test("row 40 — the control arm still emits the material line materialLines composes", () => {
  /* `materialLines` is the INCUMBENT's material paragraph, and since row 43 the
     incumbent is the declared control arm rather than production. It is checked
     here, against the composer that actually writes it, so the arm the next
     batch measures the clean register against cannot quietly stop naming its
     rooms' materials. */
  for (const f of everyFacing()) {
    const [loc, fc] = f.key.split("/");
    const meta = deriveMeta(PLAN, loc, fc);
    const { rects } = scaffoldRects(PLAN, loc, fc, meta);
    const text = g4ManorPrompt(PLAN, f.key, meta, rects);
    for (const line of materialLines(f.ctx)) {
      expect(text.includes(line),
        `${f.key}: the control arm does not emit the material line materialLines composes ` +
        `(${JSON.stringify(line)})`).toBe(true);
    }
    const n = text.split("\n").filter((l) => /^Materials\/textures:/.test(l.trim())).length;
    expect(n, `${f.key}: the control arm states its materials exactly once`).toBe(1);
  }
});

/* ------------------------------------------------------------------ */
/* 6. IMAGE 1 IS THIS ROOM'S OWN WALL, OR THERE IS NO IMAGE 1          */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim] "So why do we give it the reference image of
 * the study? I think it biases it too much. I mean I know why that window with
 * the botched insignias is every window generated for example."
 *
 * He is right, and the store carries the proof twice. `privy_garden/N`'s roll
 * `row23-1b134204` was asked, in full, for "weathered ashlar and brick, open
 * sky above, packed earth and stone paving underfoot" — no wood named anywhere
 * — and came back with dark oak FIELDED WAINSCOT round an outdoor garden under
 * open sky. Image 1 is the only place in that packet where fielded oak
 * panelling exists. And of the 19 promoted facings the plan gives a window and
 * whose voice rules PLAIN glass, seven carry saturated daylight-bright coloured
 * glass nothing asked for, while `great_hall` — the ONE room this project's
 * heraldry ration allows arms in quantity — scores lower than nine of them.
 *
 * So the ruling: Image 1 is never a wall from another room. Where the room has
 * an agreeing painted wall whose own ask was this room's ruling, that is Image
 * 1; where it has none, the packet carries no style picture at all and the
 * medium goes in words. These cases are what keeps that true. */
test.describe("row 40 — Image 1 is a wall of this room or there is none", () => {
  test("no facing is ever given a wall from another room, or its own", () => {
    let withImage = 0, without = 0;
    for (const r of everyFacing()) {
      const st = styleImageFor(PLAN, r.key);
      if (!st) { without += 1; continue; }
      withImage += 1;
      expect(st.room,
        `${r.key} is given ${st.rel} as Image 1, which is a wall of another room. That is the ` +
        `whole of what Kabe vetoed: a painting of the study standing as the reference for every ` +
        `room in the house`).toBe(r.room);
      expect(st.facing,
        `${r.key} is given ITSELF as Image 1 — the wall being repainted cannot be its own reference`)
        .not.toBe(r.facing);
      expect(existsSync(join(repoRoot, st.rel)),
        `${r.key}'s Image 1 names ${st.rel}, which is not in the tree`).toBe(true);
    }
    expect(withImage + without, "the sweep has gone blind").toBe(88);
    expect(withImage, "no facing resolves an Image 1 at all — this case cannot fail")
      .toBeGreaterThan(0);
    expect(without, "every facing resolves one — the no-picture branch is never exercised")
      .toBeGreaterThan(0);
  });

  test("the wall it picks is one the room agrees on AND one whose own ask was the ruling", () => {
    /* BOTH CONDITIONS, and `guest_chamber` is why the second is not redundant.
       Its pixel majority is N/E/W and all three were commissioned from the
       panelled-parlour default; the one facing asked for the bedchamber voice
       is S, the OUTLIER. A rule that trusted the pixel vote alone would hand
       the next roll a photograph of the wrong room and call it evidence. */
    const pixels = JSON.parse(readFileSync(CONSISTENCY, "utf8"));
    const asks = materialProvenance(PLAN);
    for (const r of everyFacing()) {
      const st = styleImageFor(PLAN, r.key);
      if (!st) continue;
      const room = (pixels.rooms || []).find((x) => x.room === r.room);
      expect(room, `${r.key} got an Image 1 from a room the measure never read`).toBeTruthy();
      const mismatched = String(room.verdict || "").startsWith("mismatched");
      const agreeing = mismatched ? (room.majority || []) : (room.facings || []);
      expect(agreeing,
        `${r.key}'s Image 1 is ${st.facing}, which this room does not agree on`)
        .toContain(st.facing);
      const pr = (asks.rooms || []).find((x) => x.room === r.room);
      const rec = pr.facings.find((x) => x.facing === st.facing);
      /* VOUCHED, WHICH IS THE MATERIAL AND NOT THE WORDING. This read
         `verdict === "current"` — the verbatim sentence test — and that is
         precisely the gap the class exists to close: the day the servants' hall
         floor gained its bond, three walls painted in exactly that floor stopped
         being able to stand as pictures of their own room. The condition is and
         always was "we know this wall was commissioned in this room's fabric",
         and `refined` is a wall we know that about. What must never pass is a
         wall commissioned in a DIFFERENT fabric, which is what the second half
         of this case's own list holds. */
      expect(isVouched(rec.class),
        `${r.key}'s Image 1 is ${st.facing}, whose own ask was not this room's ruling ` +
        `material (class ${rec.class}) — a photograph of a wall we know was wrongly ` +
        `commissioned is worse than no photograph`).toBe(true);
    }
    /* AND THE ROOM THAT MUST GET NOTHING, WHICH IS THE ONE THE SECOND
       CONDITION IS FOR. Every facing of `guest_chamber` stands on words alone:
       the room's agreeing walls are E and N, and both were commissioned from
       the panelled-parlour default, so there is no wall in it fit to be a
       photograph of it — including S, the one facing that WAS asked for the
       bedchamber voice, because S has nobody to be seeded from either. A rule
       that trusted the pixel vote alone would hand all four a picture of the
       wrong room.

       `master_bedchamber` used to be listed here beside it, on the ground that
       it split two against two with no majority at all. That was the store
       before the repair. Its four facings have since been re-asked under
       `--emit-consistency --from-ask` and re-promoted, the ask audit calls all
       four `current`, and the re-measure clusters the room E/S/W against N —
       so N is now an outlier with three agreeing walls of its own room to be
       seeded from, and it gets one. That is the ruling working rather than
       being violated, and the room is held by the loop above instead: whatever
       Image 1 it resolves must be a wall this room agrees on AND one whose own
       ask was the ruling. (Its pixels are still over the cut with its ask
       closed — that miss is logged OPEN in misses.jsonl and pinned by the
       audit-versus-pixels case above; it is not this case's subject.) */
    for (const key of ["guest_chamber/N", "guest_chamber/E",
      "guest_chamber/S", "guest_chamber/W"]) {
      expect(styleImageFor(PLAN, key),
        `${key} was given a style picture, and there is no wall of its room fit to be one`)
        .toBeNull();
    }
  });

  test("the prompt and the attach line agree about what Image 1 is", () => {
    /* A PACKET WHOSE PROSE AND WHOSE FILE LIST DISAGREE sends a seat looking
       for a picture that is not in the directory, and a seat that goes looking
       will find one. */
    for (const r of everyFacing()) {
      const st = styleImageFor(PLAN, r.key);
      const meta = deriveMeta(PLAN, r.room, r.facing);
      const { rects } = scaffoldRects(PLAN, r.room, r.facing, meta);
      const text = manorPrompt(PLAN, r.key, meta, rects, null, null, { style: st });
      const line = attachLine(null, st);
      if (st) {
        /* [row 43] THE CLEAN REGISTER NAMES IT IN ONE CLAUSE, and says what to
           take from it and what not to.

           [2026-08-25] THE CLAUSE THIS CHECKED NO LONGER EXISTS, and the change
           that retired it is the right one — this assertion was simply left
           behind by it. `frame-language.mjs` used to say "Image 1 is the north
           wall of this same room, already painted: match its paint handling,
           palette and light, and take nothing else from it", a clause that
           names a photograph of a wall and then asks for half of it.
           `servants_hall/E`'s ask ruled a fireplace and one window and the
           return came back with TWO DOORWAYS — the clause obeyed in its first
           half and ignored in its second. Image 1 is no longer that wall: it is
           a picture DERIVED from it with every opening filled in
           (`style-seed.mjs`, `attachStyle`), and the clause now describes what
           is actually in the packet. What this case is about is unchanged and
           is what is checked: the ask names what Image 1 shows, and it fences
           what may be taken from it. */
        expect(text, `${r.key}: its ask does not say what Image 1 shows`)
          .toContain("Image 1 shows this room's materials, palette and light on another of its walls");
        expect(text, `${r.key}: the ask does not say the openings were taken out of Image 1`)
          .toContain("with its openings removed");
        expect(text, `${r.key}: the ask does not fence what Image 1 is for`)
          .toContain("take no architecture from it");
        expect(line).toContain(st.file);
        expect(line).toContain("this room's own wall");
      } else {
        /* [row 43] AND WHERE THERE IS NONE, THE ASK DOES NOT MENTION ONE AT
           ALL. The incumbent spent four lines saying there was no Image 1 and
           why; the clean register simply never refers to a picture the packet
           does not hold, and carries the medium in words instead — with the one
           clause that tells the layout diagram apart from the picture, which is
           the sentence Kabe's cold-ask test earned (a flat modern render in the
           DIAGRAM's dark grey). What must never happen is the ask pointing at
           an Image 1 that is not in the packet, and that is what is checked.

           [row 43(a)] THE CLAUSE MOVED WITH THE SHEET. It used to warn off "the
           layout diagram's flat dark colours", which was the honest description
           of a sheet that HAD them — and naming them is itself a way of putting
           them in front of the painter. Production cuts the diagram as ink on
           paper now (`make-scaffold.mjs`'s `ink-on-paper-v2`), so the clause
           says there is nothing in it to copy. What is checked is unchanged:
           SOMETHING in the medium paragraph tells the diagram apart from the
           picture. */
        /* THE FAILURE THIS GUARDS IS NAMED RATHER THAN PATTERN-MATCHED. Where
           there is no style image the layout diagram IS Image 1 and the ask
           says so, correctly — what must never appear is a reference to a
           PAINTING of a wall the packet does not hold. */
        expect(text, `${r.key}: the ask points at a painted wall as Image 1, and its packet holds none`)
          .not.toMatch(/Image 1 is the (north|east|south|west) (wall|side)|of this same room, already painted|Image 1 shows this room|as Image 1|Image 1's paint|in Image 1/);
        expect(text, `${r.key}: no picture carries the medium and the words do not either`)
          .toMatch(/^Style\/medium: a high-realism oil painting/m);
        expect(text, `${r.key}: nothing tells the layout diagram apart from the picture`)
          .toContain("The layout diagram is a black-and-white line drawing on paper and holds " +
            "no colour of its own");
        expect(line).toContain("NO Image 1 in this packet");
        expect(line).not.toContain("style-seed-warm.png");
        expect(attachLineAll([], st)).toContain("NO Image 1 in this packet");
      }
      /* AND NO MANOR ASK EVER NAMES THE SEED FILE AGAIN. */
      expect(text).not.toContain("style-seed-warm");
    }
  });

  test("a packet with no Image 1 still carries the medium, at a picture's resolution", () => {
    /* THE HALF THAT WOULD BE EASY TO LOSE. Removing the reference is only safe
       if the words that replace it actually describe the paint — otherwise the
       cure for bias is a house rendered flat. */
    const key = "guest_chamber/N";
    const meta = deriveMeta(PLAN, "guest_chamber", "N");
    const { rects } = scaffoldRects(PLAN, "guest_chamber", "N", meta);
    const text = manorPrompt(PLAN, key, meta, rects, null, null, { style: null });
    const style = text.split("Style/medium:")[1].split("\nConstraints:")[0];
    /* [row 43] THE MEDIUM IS NAMED AS A TRADITION, which is the half a word
       list missed. [Kabe, 2026-08-24] his own working seed was "Sherlock Holmes
       era office, high realism oil painting" — an era named as a way of
       painting — and his cold-ask test with only the layout diagram attached
       came back a flat modern render in the DIAGRAM's dark grey, every period
       word lost to the one image in the packet. So the paragraph must name the
       paint, the tradition, the handling, the light, and refuse the render. */
    for (const must of ["oil painting", "seventeenth-century", "brush", "falloff",
      "not a modern render"]) {
      expect(style.toLowerCase(),
        `the medium paragraph never says "${must}", and it is the only description of the paint ` +
        `a packet with no reference picture has`).toContain(must);
    }
    /* [row 43(a)] AND THE DIAGRAM IS STILL TOLD APART FROM THE PICTURE — by
       saying it has no colour of its own, now that it has none. The sheet is
       ink on paper (`ink-on-paper-v2`); the clause it replaces named the old
       sheet's "flat dark colours", which is a way of putting them in front of
       the painter. */
    expect(style, "nothing tells the layout diagram's colours apart from the picture's")
      .toContain("holds no colour of its own");
    expect(style).not.toContain("Image 1");
  });

  test("a plain-glass room is told what IS in every quarry, not only what is not", () => {
    /* THE SEED USED TO SUPPLY THE GLASS, and it supplied shields with it. With
       no picture the words are the only description there is, so they state the
       quarry positively before they refuse the arms — and the sentence that
       argues with Image 1 is spoken only where an Image 1 exists to argue
       with. */
    let plain = 0, armorial = 0;
    for (const r of everyFacing()) {
      if (!r.carriers.includes("window")) continue;
      const st = styleImageFor(PLAN, r.key);
      const meta = deriveMeta(PLAN, r.room, r.facing);
      const { rects } = scaffoldRects(PLAN, r.room, r.facing, meta);
      const text = manorPrompt(PLAN, r.key, meta, rects, null, null, { style: st });
      if (r.voice.glass === "plain") {
        plain += 1;
        /* [row 43] THE POSITIVE SENTENCE, in the clean register's own words:
           what IS in every quarry first, and only then the refusal. */
        expect(text, `${r.key}: its glass is never described positively`)
          .toContain("plain diamond quarrels of faintly greenish crown glass in lead cames");
        expect(text, `${r.key} is ruled plain glass and its ask does not refuse arms`)
          .toContain("no armorial shield, crest, badge or monogram");
        expect(text, `${r.key} is ruled plain glass and its ask does not refuse coloured glass`)
          .toContain("no coloured glass, no painted or stained glass");
      } else {
        armorial += 1;
        /* AND THE RATIONED ROOMS SAY WHERE THE ARMS GO AND WHERE THEY DO NOT,
           at column zero, because `prompt_lint.py`'s ration clause reads
           `^armorial glass:` and a gate that cannot see the line cannot hold
           it. */
        expect(text, `${r.key} is entitled to arms and its ask never rations them`)
          .toMatch(/^Armorial glass: /m);
        expect(text, `${r.key}'s ration does not say where the plain quarrels stay`)
          .toContain("plain diamond quarrels");
      }
      if (!st) {
        expect(text, `${r.key} has no Image 1 and its window sentence still argues with one`)
          .not.toContain("not the window in Image 1");
      }
    }
    expect(plain, "no plain-glass window wall in the sweep — this case is blind")
      .toBeGreaterThan(0);
    expect(armorial, "no rationed-glass wall in the sweep — the control is missing")
      .toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 7. VOUCHING FOLLOWS THE MATERIAL, NOT THE WORDING                   */
/* ------------------------------------------------------------------ */
/* THE MISS THIS SECTION CLOSES, dated 2026-08-25. The Navigator refined ONE
 * voice string — the servants' hall floor gained its bond, "…in straight
 * courses… no square pavers", after Kabe saw one wall lay its bricks as squares
 * beside two laid in courses — and the audit, which compared SENTENCES, called
 * every wall of the room asked before the ruling. All three were sealed legacy,
 * so the room held no wall it could vouch for, so `styleImageFor` attached no
 * Image 1 to any of its re-asks — including for walls painted that same day in
 * exactly the floor the voice rules. A refinement of wording was being spent as
 * a change of material, and the words meant to make the floor MORE consistent
 * left the room less able to be consistent.
 *
 * The cure is not a looser comparison: a looser comparison is how the cross
 * passage's "plain oak wainscot below limewashed plaster" would come to vouch
 * for the long gallery, which says those words and then adds a cornice. It is
 * to compare the material ID, and to require the move in wording to be DECLARED
 * (`room-voices.mjs`'s `SAID_BEFORE`) rather than inferred. Both halves are
 * checked here, and the second is the one with teeth. */

test.describe("vouching follows the material, not the wording", () => {
  const CLASSES = ["current", "refined", "split-ask", "stale-material"];

  test("every promoted facing carries one of the four classes, and vouched means current or refined", () => {
    const asks = materialProvenance(PLAN);
    let vouched = 0, refined = 0, wrong = 0;
    for (const r of asks.rooms) {
      for (const f of r.facings) {
        expect(CLASSES, `${r.room}/${f.facing} is classed "${f.class}"`).toContain(f.class);
        expect(isVouched(f.class)).toBe(f.class === "current" || f.class === "refined");
        if (isVouched(f.class)) vouched += 1;
        if (f.class === "refined") refined += 1;
        if (!isVouched(f.class)) wrong += 1;
      }
      /* THE ROOM'S OWN VERDICT AND ITS FACINGS' CLASSES ARE ONE STATEMENT. A
         report that can disagree with itself is not a report. */
      expect(r.refined).toEqual(r.facings.filter((f) => f.class === "refined").map((f) => f.facing));
      if (r.verdict === "refined") {
        expect(r.refined.length, `${r.room} is called refined and no facing of it is`)
          .toBeGreaterThan(0);
        expect(r.facings.every((f) => isVouched(f.class)),
          `${r.room} is called refined and carries a facing in another material`).toBe(true);
      }
    }
    expect(asks.vouched_facings).toBe(vouched);
    expect(refined, "no facing in the store is `refined` — this whole section is blind")
      .toBeGreaterThan(0);
    expect(wrong, "every facing is vouched, so the unvouched arm is never exercised")
      .toBeGreaterThan(0);
  });

  test("a refined facing's ask resolves, part by part, to the materials the voice rules now", () => {
    /* RE-DERIVED RATHER THAN READ BACK. The ask is opened again and each part
       the verbatim test called missing is resolved through the phrase registry,
       so a report that simply wrote "refined" everywhere would fail this. */
    const asks = materialProvenance(PLAN);
    const refined = asks.rooms.flatMap((r) =>
      r.facings.filter((f) => f.class === "refined").map((f) => ({ room: r.room, f })));
    expect(refined.length, "nothing in the store is refined — this case is blind").toBeGreaterThan(0);
    for (const { room, f } of refined) {
      expect(f.missing.length,
        `${room}/${f.facing} is called refined and states its ruling verbatim — that is "current"`)
        .toBeGreaterThan(0);
      const text = readFileSync(join(repoRoot, f.ask_path), "utf8");
      for (const k of f.missing) {
        const ruled = materialNamedIn(f.ruling[k], k);
        const asked = materialNamedIn(text, k);
        expect(ruled,
          `${room}/${f.facing} is refined on ${k} and the RULING phrase names no declared ` +
          `material at all, so there was nothing to be refined from`).toBeTruthy();
        expect(asked,
          `${room}/${f.facing} is refined on ${k} and its own ask names no declared material — ` +
          `an unreadable ask is not evidence that it named this one`).toBe(ruled);
      }
      /* AND THE PARTS IT DOES STATE VERBATIM ARE STILL STATED VERBATIM: a class
         that quietly relaxed the whole comparison would pass everything above. */
      const flat = normMaterial(text);
      for (const k of Object.keys(f.ruling)) {
        if (f.missing.includes(k) || !f.ruling[k]) continue;
        expect(flat.includes(normMaterial(f.ruling[k])),
          `${room}/${f.facing} is called refined only on ${f.missing.join("/")} and it does not ` +
          `carry the ruled ${k} either`).toBe(true);
      }
    }
  });

  test("the red arm: the same words about a different fabric are NOT a refinement", () => {
    /* THE PREFIX TRAP, NAMED, because it is the rule a lazier cure would have
       adopted: "the old wording is a prefix of the new one, so it is the same
       material". `cross_passage.walls` is a strict PREFIX of
       `long_gallery.walls` and they are two fabrics — a gallery wall carries a
       moulded cornice at its head. This is the store's own case: the gallery's
       N, E and S were asked in the passage's words. */
    const gallery = rulingSentences({
      voice: VOICES.long_gallery, loc: "long_gallery", out: false, openSide: false, built: true
    });
    expect(VOICES.long_gallery.walls.startsWith(VOICES.cross_passage.walls),
      "the prefix this case is about is gone from the voice table, so it no longer traps anything")
      .toBe(true);
    const asked = `Materials/textures: ${VOICES.cross_passage.walls}. ` +
      `Overhead: ${gallery.overhead}. Underfoot: ${gallery.underfoot}.`;
    const cls = classifyAsk(asked, gallery, ["walls"], "red-arm");
    expect(cls.class,
      "an ask carrying the CROSS PASSAGE's wall fabric was read as a refinement of the " +
      "GALLERY's. A rule that reads prose instead of ids vouches a wall painted in the wrong " +
      "material, which is exactly what Image 1 must never be").toBe("wrong");
    expect(cls.ask_materials.walls).not.toBe(cls.ruling_materials.walls);

    /* AND THE GREEN ARM BESIDE IT, so the case cannot pass by refusing
       everything: the same ruling, asked in a wording `SAID_BEFORE` declares. */
    const hall = rulingSentences({
      voice: VOICES.servants_hall, loc: "servants_hall", out: false, openSide: false, built: true
    });
    const retired = SAID_BEFORE["floor/red-brick-on-edge"][0].said;
    const ok = classifyAsk(
      `Materials/textures: ${hall.walls}. Overhead: ${hall.overhead}. Underfoot: ${retired}.`,
      hall, ["underfoot"], "green-arm");
    expect(ok.class, "a wall asked for this floor in the wording the voice used that day is not " +
      "vouched, and it is the same floor").toBe("refined");
    expect(ok.ask_materials.underfoot).toBe("floor/red-brick-on-edge");
  });

  test("a retired wording is declared, checked, and may not be another material's live phrase", () => {
    /* THE DECLARATION IS THE WHOLE MECHANISM, so it is the thing that must not
       be able to lie. An entry naming an unknown material, a material no voice
       reaches, or a phrase some other material says TODAY would vouch a wall
       painted in that other fabric — the one outcome this rule exists to
       prevent. Built here rather than asserted. */
    expect(() => declaredMaterialPhrases()).not.toThrow();
    const live = declaredMaterialPhrases().filter((p) => p.current);
    expect(live.length, "no current wording resolves — the registry is empty").toBeGreaterThan(0);
    for (const [id, entries] of Object.entries(SAID_BEFORE)) {
      expect(MATERIALS[id], `SAID_BEFORE names \`${id}\`, which is not a material`).toBeTruthy();
      expect(canonicalMaterial(id), `\`${id}\` is an alias and its target is what is stored`)
        .toBeTruthy();
      for (const e of entries) {
        for (const k of ["said", "retired", "commit", "why"]) {
          expect(e[k], `SAID_BEFORE[${id}] has an entry with no \`${k}\` — a refinement with no ` +
            `commit and no reason is a merge nobody reviewed`).toBeTruthy();
        }
        expect(live.map((p) => p.phrase),
          `SAID_BEFORE retires "${e.said}", which some voice still says today`)
          .not.toContain(e.said);
      }
    }
    /* THE RED ARM: the table refuses a wording that is another material's live
       phrase, rather than quietly merging the two. */
    const stolen = VOICES.cross_passage.walls;
    SAID_BEFORE["floor/red-brick-on-edge"].push({
      said: stolen, retired: "never", commit: "none", why: "a merge nobody reviewed"
    });
    try {
      expect(() => declaredMaterialPhrases(),
        "SAID_BEFORE accepted another material's CURRENT wording as a retired one, which would " +
        "vouch every wall painted in that other fabric").toThrow(/CURRENT wording/);
    } finally {
      SAID_BEFORE["floor/red-brick-on-edge"].pop();
    }
  });

  test("the store's own case: the servants' hall can show a painter its own walls again", () => {
    /* THE GAP, AS THE STORE HOLDS IT. `servants_hall` N, S and W were asked for
       "a floor of worn red brick laid on edge"; the voice now says that floor
       and its bond. One material, two wordings, and before this rule the room
       had exactly one wall it could vouch for (E, re-asked under the new words)
       — which is not enough, because a wall may not be its own Image 1. */
    const asks = materialProvenance(PLAN);
    const hall = asks.rooms.find((r) => r.room === "servants_hall");
    expect(hall, "the servants' hall has left the audit altogether").toBeTruthy();
    expect(hall.verdict).toBe("refined");
    expect(hall.refined.slice().sort()).toEqual(["N", "S", "W"]);
    expect(hall.facings.find((f) => f.facing === "E").class).toBe("current");
    for (const f of hall.facings) {
      expect(isVouched(f.class), `servants_hall/${f.facing} is not vouched`).toBe(true);
      expect(f.ruling_materials.underfoot).toBe("floor/red-brick-on-edge");
      expect(f.ask_materials.underfoot,
        `servants_hall/${f.facing} was not asked for the room's own floor`)
        .toBe("floor/red-brick-on-edge");
    }
    /* AND THE CONSEQUENCE, WHICH IS THE POINT: every facing of it now resolves
       an Image 1, and it is a wall of this room and never the wall itself. */
    for (const f of ["N", "E", "S", "W"]) {
      const st = styleImageFor(PLAN, `servants_hall/${f}`);
      expect(st, `servants_hall/${f} still gets no Image 1, so the room still cannot seed itself`)
        .toBeTruthy();
      expect(st.room).toBe("servants_hall");
      expect(st.facing).not.toBe(f);
      expect(existsSync(join(repoRoot, st.rel))).toBe(true);
      expect(st.why, `servants_hall/${f}'s Image 1 does not say on what authority it was picked`)
        .toBeTruthy();
    }
  });

  test("the default re-ask set is the wrong-material walls; --refined-too is what forces the words", () => {
    const asks = materialProvenance(PLAN);
    const dflt = provenanceAsConsistencyReport(asks);
    const forced = provenanceAsConsistencyReport(asks, { refinedToo: true });
    const byRoom = new Map(asks.rooms.map((r) => [r.room, r]));

    /* BY DEFAULT: nothing merely refined is re-asked, anywhere. A roll spent to
       change wording on a wall already painted in the right material buys a
       wait and changes nothing on the wall. */
    for (const r of dflt.rooms) {
      for (const f of r.outliers) {
        const rec = byRoom.get(r.room).facings.find((x) => x.facing === f);
        expect(rec.class, `${r.room}/${f} is re-asked by default and it is only refined`)
          .not.toBe("refined");
      }
    }
    const hallDefault = dflt.rooms.find((r) => r.room === "servants_hall");
    expect(hallDefault,
      "the servants' hall is in the DEFAULT repair list, so three walls painted in this room's " +
      "own floor are being repainted to change their wording").toBeFalsy();

    /* WITH THE FLAG: it is there, its outliers are exactly its refined walls,
       and its correction says the fabric is not in dispute — a painter told its
       materials were wrong would repaint a floor that is already right. */
    const hallForced = forced.rooms.find((r) => r.room === "servants_hall");
    expect(hallForced, "--refined-too re-asks nothing in a room whose only fault is its wording")
      .toBeTruthy();
    expect(hallForced.outliers.slice().sort()).toEqual(["N", "S", "W"]);
    expect(hallForced.majority, "the wall the room may be seeded from is the one standing still")
      .toEqual(["E"]);
    expect(hallForced.no_majority).toBe(false);
    expect(hallForced.measured).toMatch(/in the ASKS rather than in the pixels/);
    expect(hallForced.measured,
      "the correction tells the painter its materials were wrong, and they were not")
      .toContain("The fabric is not in dispute");

    /* AND THE FLAG ONLY EVER ADDS. Every wall the default re-asks is still
       re-asked with it. */
    const set = (rep) => new Set(rep.rooms.flatMap((r) => r.outliers.map((f) => `${r.room}/${f}`)));
    const a = set(dflt), b = set(forced);
    for (const k of a) expect(b, `--refined-too dropped ${k} from the re-ask set`).toContain(k);
    expect(b.size, "--refined-too added nothing at all").toBeGreaterThan(a.size);
  });

  test("the legacy ledger says which of its admissions are vouched and which are not", () => {
    /* THE LEDGER'S REASON USED TO SAY ONE THING ABOUT TWO. "It predates the
       voice the room now speaks" was written about a wall painted in another
       fabric AND about a wall painted in this one before the words were
       tightened — and only the second may stand as a picture of its room. A
       reader of the file could not tell which they were holding. */
    expectDerived("material_legacy");
    const lp = join(repoRoot, "design", "plan-draft", "measured", "material_legacy.json");
    if (!existsSync(lp)) return;
    const ledger = JSON.parse(readFileSync(lp, "utf8"));
    const asks = materialProvenance(PLAN);
    const cls = new Map(asks.rooms.flatMap((r) =>
      r.facings.map((f) => [`${r.room}/${f.facing}`, f.class])));
    let vouched = 0;
    for (const [key, e] of Object.entries(ledger.admitted || {})) {
      expect(e.class, `${key}'s admission does not say what class it was admitted as`).toBeTruthy();
      expect(e.class).toBe(cls.get(key));
      expect(e.vouched).toBe(isVouched(e.class));
      if (e.vouched) {
        vouched += 1;
        expect(e.why, `${key} is admitted as vouched and its reason does not say the material held`)
          .toContain("WORDING that has since been refined");
        expect(e.closes_when, `${key} is refined and its closing command would not re-ask it`)
          .toContain("--refined-too");
      }
    }
    expect(vouched, "no admission in the ledger is vouched — this case is blind").toBeGreaterThan(0);
  });
});
