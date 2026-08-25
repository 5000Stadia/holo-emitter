/* Row 38 — edge seeding, and the seam it exists to close.
 *
 * [HUMAN, 2026-08-24, verbatim] "if we are on a nice country hillside outside,
 * the edges of one may not stylistically be enforced on the edges of the
 * direction when you turn 90° … the side of the completed picture which is
 * adjacent to the wall about to be developed should have that sides 10% of the
 * picture cropped and sent as an additional reference picture, with a
 * description that this is a reference image of what should be sitting on the
 * left/right edge"
 *
 * Five claims are made by the build and every one of them is checked here
 * against something other than its own account of itself:
 *
 *   1. the adjacency table is RIGHT — recomputed from the plan's own geometry,
 *      not read back out of the module that produced it;
 *   2. the crop is deterministic and cuts the columns it says it cuts;
 *   3. the role sentence stands in a prompt exactly when a strip rides with it;
 *   4. the ordering exception is recorded for open locations and for nothing
 *      else;
 *   5. the seam metric can go red — it finds a planted discontinuity and passes
 *      a planted continuity, so a green reading from it means something.
 */
import { test, expect } from "@playwright/test";
import { repoRoot } from "./helpers.mjs";
import { readFileSync, existsSync, mkdtempSync, rmSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  EDGE_FRACTION, SIDES, neighbourAt, neighbourEdge, adjacencyTable, roleSentence, seedImageIndex,
  seedPlan, openOrder, cutEdgeSeed, seedFileName, wallLineEnd, isOpenLocation,
  roomOrder, leadFacing, entryDoorFacing, opposite, packetNote
} from "../../tools/edge-seed.mjs";
import { RIGHT, NORMAL, FACINGS } from "../../tools/validate-plan.mjs";
import { manorPrompt, scaffoldRects } from "../../tools/make-scaffold.mjs";
import { deriveMeta } from "../../tools/plan-projection.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const MANOR = join(repoRoot, "design", "batches", "row23-scaffold", "manor");
const SEAM = join(repoRoot, "design", "plan-draft", "measured", "seam_measure.py");
const CROP = join(repoRoot, "tools", "crop-edge-seed.py");

function py(args, opts = {}) {
  try {
    return execFileSync("python3", args, { cwd: repoRoot, encoding: "utf8", stdio: "pipe", ...opts });
  } catch (e) {
    throw new Error(`python3 ${args.join(" ")} failed:\n${e.stdout || ""}${e.stderr || ""}`);
  }
}
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/* ------------------------------------------------------------------ */
/* 1. THE ADJACENCY TABLE                                              */
/* ------------------------------------------------------------------ */

test.describe("row 38 — which neighbour, and which side", () => {
  test("the table is what the compass ring makes it, recomputed independently", () => {
    /* The independent recompute: a facing's frame spans a wedge of yaw centred
     * on `NORMAL`, and its right edge looks toward `RIGHT`. So the facing whose
     * NORMAL is our RIGHT is the one our right edge runs into. Written out here
     * as vectors rather than as a table, so the two derivations share nothing
     * but the convention they both read. */
    const vec = (f) => (NORMAL[f][0] === "x" ? [NORMAL[f][1], 0] : [0, NORMAL[f][1]]);
    const expected = {};
    for (const f of FACINGS) {
      expected[f] = {
        right: FACINGS.find((g) => vec(g)[0] === RIGHT[f][0] && vec(g)[1] === RIGHT[f][1]),
        left: FACINGS.find((g) => vec(g)[0] === -RIGHT[f][0] && vec(g)[1] === -RIGHT[f][1])
      };
    }
    /* And the answer, spelled out, so a silent change to BOTH derivations still
     * has to get past a reader: turning right walks N -> E -> S -> W. */
    expect(expected).toEqual({
      N: { right: "E", left: "W" },
      E: { right: "S", left: "N" },
      S: { right: "W", left: "E" },
      W: { right: "N", left: "S" }
    });
    for (const row of adjacencyTable()) {
      expect(row.right.neighbour, `${row.facing}'s right neighbour`).toBe(expected[row.facing].right);
      expect(row.left.neighbour, `${row.facing}'s left neighbour`).toBe(expected[row.facing].left);
      /* The neighbour's OWN side that is cut: our right edge meets its left. */
      expect(row.right.neighbour_edge).toBe("left");
      expect(row.left.neighbour_edge).toBe("right");
    }
  });

  test("the ring is a ring: every neighbour names us back, on the opposite side", () => {
    for (const f of FACINGS) {
      for (const s of SIDES) {
        const g = neighbourAt(f, s);
        const back = neighbourEdge(f, s);
        expect(neighbourAt(g, back), `${f}'s ${s} neighbour ${g} names ${f} back`).toBe(f);
        expect(back).not.toBe(s);
      }
    }
  });

  test("the drawing agrees: F's right-hand end and its neighbour's left-hand end are one corner", () => {
    /* THE REAL-PAIR CHECK, on the plan rather than on the story. `viewSpan` and
     * `RIGHT` are how `plan-projection.mjs` measures every carrier across a
     * view, so the world point at the right-hand end of F's wall line and the
     * one at the left-hand end of its right neighbour's are the same corner of
     * the room — unless one of them is an OPEN facing, whose `wall_line` is a
     * far line tens of metres out rather than the room boundary. */
    const same = [], differ = [];
    for (const room of PLAN.rooms) {
      for (const f of FACINGS) {
        const g = neighbourAt(f, "right");
        if (!room.facings[f] || !room.facings[g]) continue;
        const a = wallLineEnd(room, f, "right");
        const b = wallLineEnd(room, g, "left");
        const key = `${room.id}/${f}->${g}`;
        (Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 ? same : differ).push(key);
      }
    }
    expect(same.length + differ.length, "every room contributes four pairs").toBe(88);
    expect(same.length).toBe(86);
    expect(differ.sort()).toEqual(
      ["entrance_court/E->S", "entrance_court/S->W"]);
    /* Both exceptions have an OPEN facing in them, and that is the whole
     * explanation: an open facing's wall line is its far line. */
    for (const k of differ) {
      const room = k.split("/")[0], pair = k.split("/")[1].split("->");
      const r = PLAN.rooms.find((x) => x.id === room);
      expect(r.facings[pair[0]].type === "open" || r.facings[pair[1]].type === "open",
        `${k} differs, so one of its facings must be open`).toBe(true);
    }
  });

  test("the JavaScript and the Python agree about the ten per cent and about the ring", () => {
    const out = py(["-c",
      "import sys; sys.path.insert(0, 'design/plan-draft/measured'); " +
      "import seam_measure as s, json; print(json.dumps({'f': s.FRACTION, 'next': s.NEXT}))"]);
    const got = JSON.parse(out.trim());
    expect(got.f, "seam_measure.FRACTION vs edge-seed.EDGE_FRACTION").toBe(EDGE_FRACTION);
    for (const f of FACINGS) expect(got.next[f]).toBe(neighbourAt(f, "right"));
  });
});

/* ------------------------------------------------------------------ */
/* 2. THE CROP                                                         */
/* ------------------------------------------------------------------ */

test.describe("row 38 — the crop", () => {
  let dir;
  test.beforeAll(() => { dir = mkdtempSync(join(tmpdir(), "holo-seed-")); });
  test.afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test("cutting twice gives the same bytes, and the strip is 10 % of the frame at full height", () => {
    const src = join(repoRoot, "backdrops", "entrance_approach", "W.png");
    const a = cutEdgeSeed({ source: src, cut: "right", out: join(dir, "a.png") });
    const b = cutEdgeSeed({ source: src, cut: "right", out: join(dir, "b.png") });
    expect(a.sha256, "two cuts of one painting are one strip").toBe(b.sha256);
    expect(sha(join(dir, "a.png"))).toBe(a.sha256);
    expect(a.width_px).toBe(154);                 // round(1536 x 0.10)
    expect(a.height_px).toBe(1024);
    expect(a.columns).toEqual([1382, 1536]);
  });

  test("the columns are the ones it names — checked against a source whose columns are known", () => {
    /* A synthetic frame whose every column is its own index, so a crop can be
     * proved rather than eyeballed: column x carries the value x mod 256. */
    py(["-c",
      "import numpy as np; from PIL import Image; " +
      "a = np.zeros((64, 1000, 3), 'uint8'); a[:, :, 0] = np.arange(1000)[None, :] % 256; " +
      `Image.fromarray(a).save(${JSON.stringify(join(dir, "ramp.png"))})`]);
    for (const [side, first, last] of [["left", 0, 99], ["right", 900, 999]]) {
      const cut = cutEdgeSeed({ source: join(dir, "ramp.png"), cut: side, out: join(dir, `${side}.png`) });
      expect(cut.width_px).toBe(100);
      const read = py(["-c",
        "import numpy as np; from PIL import Image; " +
        `a = np.asarray(Image.open(${JSON.stringify(join(dir, `${side}.png`))}).convert('RGB')); ` +
        "print(int(a[0, 0, 0]), int(a[0, -1, 0]), a.shape[1], a.shape[0])"]).trim().split(" ");
      expect(read.map(Number)).toEqual([first % 256, last % 256, 100, 64]);
    }
  });

  test("it refuses a side it does not have and a fraction that is not one", () => {
    const src = join(repoRoot, "backdrops", "entrance_approach", "W.png");
    expect(() => py([CROP, src, join(dir, "x.png"), "top"])).toThrow(/left.*right/s);
    expect(() => py([CROP, src, join(dir, "x.png"), "left", "3"])).toThrow(/fraction/s);
  });
});

/* ------------------------------------------------------------------ */
/* 3. THE ROLE SENTENCE                                                */
/* ------------------------------------------------------------------ */

test.describe("row 38 — the sentence rides with the strip and never without it", () => {
  test("manorPrompt names the strip when and only when it is given one", () => {
    const key = "entrance_approach/N";
    const [loc, f] = key.split("/");
    const meta = deriveMeta(PLAN, loc, f);
    const { rects } = scaffoldRects(PLAN, loc, f, meta);
    /* [row 43] THE INDEX IS DERIVED FROM THE ATTACH LIST, NEVER TYPED. Row 38
       wrote "Image 3" because every packet then carried a style seed as Image 1
       and the scaffold as Image 2; row 40's ruling took the style seed away
       from most packets, so the scaffold is Image 1 and the first strip is
       Image 2. `scaffoldImageIndex(style)` is the one home for the arithmetic
       and both readers use it — the register and `PACKET.md`'s attach list. A
       prompt naming an Image 3 the packet does not hold is a reference the seat
       has to go and invent, which is how a study wall reached a garden once. */
    for (const style of [null, { file: "style-reference.png", room: loc, facing: "S",
      facing_word: "south" }]) {
      const n = seedImageIndex(style);
      expect(n).toBe(style ? 3 : 2);
      const bare = manorPrompt(PLAN, key, meta, rects, null, null, { style });
      expect(bare, "a bare ask names a strip it was never given")
        .not.toMatch(/Image \d+ is a reference of exactly/);
      for (const side of SIDES) {
        const seeded = manorPrompt(PLAN, key, meta, rects, null,
          { ...seedPlan(PLAN, key), side }, { style });
        expect(seeded).toContain(roleSentence(side, n));
        /* On one physical line, with the other images, in the picture paragraph
           — the composer's own idiom, and what the line-counting t1/t2 control
           depends on. */
        const lines = seeded.split("\n");
        const at = lines.findIndex((l) => /Image \d+ is a reference of exactly/.test(l));
        expect(at, "the strip must be introduced with the other images").toBeGreaterThan(
          lines.findIndex((l) => /^Composition\/framing:/.test(l)));
        expect(at).toBeLessThan(lines.findIndex((l) => /^Style\/medium:/.test(l)));
        expect(lines[at].trim()).toBe(roleSentence(side, n));
        /* And nothing else moved. */
        expect(lines.filter((l, i) => i !== at).join("\n")).toBe(bare);
      }
    }
  });

  test("every emitted packet's prompt names Image 3 exactly when a strip is beside it", () => {
    const packets = [];
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (!e.isDirectory()) continue;
        if (existsSync(join(p, "prompt.txt"))) packets.push(p);
        walk(p);
      }
    };
    walk(MANOR);
    expect(packets.length, "the manor holds no packets — this case has gone blind")
      .toBeGreaterThan(50);
    let seeded = 0;
    for (const p of packets) {
      /* IN `SIDES` ORDER, WHICH IS THE ORDER THE EMITTER NUMBERS THEM IN.
         `attachSeeds` walks `SIDES` and hands the nth cut strip
         `seedImageIndex(style, n)`, and `roleSentence(side, index)` writes that
         number into the sentence — so the index a strip must be called by is
         its position in this filtered list and nothing else.

*/
      const text = readFileSync(join(p, "prompt.txt"), "utf8");
      const md = readFileSync(join(p, "PACKET.md"), "utf8");
      const sides = SIDES.filter((s) => existsSync(join(p, seedFileName(s))));
      /* AND THE BASE IS READ OFF THE PACKET'S OWN ATTACH LIST, not assumed.
         The strips are numbered from one above the layout image, and which
         index THAT has is the packet's own declaration — Image 2 behind a style
         picture, Image 1 where row 40's ruling leaves none. Reading it here is
         what makes this case true of the packets emitted before the ruling and
         of the ones emitted after it, and it is the agreement itself that is
         worth checking: a prompt and an attach list that disagree send a seat
         looking for a file that is not in the directory. */
      const declared = md.match(/`scaffold\.png` as \*\*Image (\d+)\*\*/);
      expect(declared, `${p}'s attach list never names the layout image`).toBeTruthy();
      const base = Number(declared[1]) + 1;
      if (!sides.length) {
        expect(text, `${p} names a strip with none beside it`)
          .not.toMatch(/Image \d+ is a reference of exactly/);
        for (const sd of SIDES) {
          expect(md, `${p}'s attach list names a strip the packet does not carry`)
            .not.toContain(seedFileName(sd));
        }
        continue;
      }
      /* A SECOND STRIP IS A SECOND IMAGE, NOT A FORBIDDEN ONE. This case used
         to refuse `sides.length > 1` outright — "the image list is three long"
         — and that was true of row 38's one-neighbour seeding. The row-40
         repair route seeds an outlier from EVERY agreeing wall the room has:
         `attachSeeds`, `packetNoteAll` and `attachLineAll` number Image 3
         upward, and `servants_hall/E`'s re-ask rides with both its left and
         right neighbours. What row 38 actually rules is that a strip is never
         handed over unexplained and a sentence never stands without its strip,
         which is one claim per strip and holds at any count — so the count is
         no longer the subject and every strip is checked at its own index. */
      seeded += 1;
      sides.forEach((side, i) => {
        const n = base + i;
        expect(text, `${p} carries a ${side} strip and does not name it as Image ${n}`)
          .toContain(roleSentence(side, n));
        expect(md, `${p}'s attach list must name the ${side} strip as Image ${n}`)
          .toContain(`**Image ${n}**`);
        expect(md).toContain(seedFileName(side));
      });
      /* AND NOT ONE INDEX FURTHER. A sentence for an image the packet does not
         carry sends the painter looking for a file that is not in the
         directory — the same failure as an unexplained strip, from the other
         side. */
      expect(text, `${p} names an Image ${base + sides.length} it carries no strip for`)
        .not.toContain(`Image ${base + sides.length} is a reference`);
      expect(md, `${p}'s attach list names an Image ${base + sides.length} that is not in it`)
        .not.toContain(`**Image ${base + sides.length}**`);
    }
    expect(seeded, "no packet carries a seed — the pilot is not on disk").toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 4. THE ORDERING, AND ITS SCOPE                                      */
/* ------------------------------------------------------------------ */

/* WHAT ROW 42 CHANGED HERE, AND THE SENTENCE THAT DIED WITH IT. This block used
 * to be headed "ordering is an open location's, and nobody else's" and its first
 * case asserted that no indoor facing may ever carry a `depends_on`. Row 42
 * revokes exactly that: [HUMAN] "Can we paint the whole scene on wall 1 for a
 * room, use it to influence wall 2-4" — every location now paints a LEAD wall
 * first and the other three follow it. What survives unchanged, and is asserted
 * below, is the RING: outdoors each facing continues the one at its left edge
 * because an open turn has no corner to hide a seam in; indoors all three
 * continue the lead. */
test.describe("row 38/42 — the ring is an open location's, the lead is everyone's", () => {
  test("the policy still splits open from indoor, and the lead never waits", () => {
    for (const room of PLAN.rooms) {
      for (const f of Object.keys(room.facings || {})) {
        const s = seedPlan(PLAN, `${room.id}/${f}`);
        expect(s.policy).toBe(isOpenLocation(PLAN, room.id) ? "required" : "opportunistic");
        /* A room's first wall continues nothing, so it can never be waiting. */
        if (s.is_lead) expect(s.depends_on, `${room.id}/${f} LEADS its room`).toBeNull();
        /* And whatever it waits for, it is the wall it continues and nothing
         * else — the dependency is the order narrowed to "and it does not
         * exist yet", never a second opinion about which wall comes first. */
        if (s.depends_on) expect(s.depends_on).toBe(s.continues);
      }
    }
  });

  test("every room has exactly one lead and it is the most-carried wall", () => {
    for (const room of PLAN.rooms) {
      const order = roomOrder(PLAN, room.id, () => false);
      const leads = order.filter((o) => o.lead);
      expect(leads.length, `${room.id} does not have exactly one lead`).toBe(1);
      expect(leads[0].position).toBe(0);
      const most = Math.max(...order.map((o) => o.carriers));
      expect(leads[0].carriers,
        `${room.id} leads with ${leads[0].facing} (${leads[0].carriers} carriers) while a ` +
        `wall of it carries ${most} — the lead is the wall that SHOWS the room`).toBe(most);
      for (const o of order) expect(o.lead_key).toBe(leads[0].key);
    }
  });

  test("a tie breaks to the wall the room's entry door faces", () => {
    /* `hall` carries one thing on each of its four walls, so the count decides
       nothing and the tie-break is the whole answer: its entry is the lowest-
       ordered door the plan joins to it, and the wall that door FACES is the
       one a person walking in is looking at. */
    const entry = entryDoorFacing(PLAN, "hall");
    expect(entry, "the cross passage has no door at all").toBeTruthy();
    expect(leadFacing(PLAN, "hall")).toBe(opposite(entry));
    /* ...and where the count DOES decide, the tie-break is not consulted: the
       long gallery's W wall carries six and its E five. */
    expect(leadFacing(PLAN, "long_gallery")).toBe("W");
  });

  test("indoors the other three continue the lead; outdoors they continue the ring", () => {
    const indoor = roomOrder(PLAN, "long_gallery", () => false);
    expect(indoor[0].continues).toBeNull();
    for (const o of indoor.slice(1)) {
      expect(o.continues, `${o.key} indoors must continue its room's lead`)
        .toBe(indoor[0].key);
    }
    const open = roomOrder(PLAN, "entrance_approach", () => false);
    expect(open[0].continues).toBeNull();
    for (let i = 1; i < open.length; i++) {
      expect(open[i].continues).toBe(`entrance_approach/${open[i - 1].facing}`);
      expect(neighbourAt(open[i].facing, "left")).toBe(open[i - 1].facing);
    }
  });

  test("the seat is told to wait, in the packet AND in its standing order", () => {
    /* THE THING ROW 42 ACTUALLY DEPENDS ON. Three quarters of the manor now
       carries a `depends_on`, so an order that says "paint every roll whose
       candidate is missing" would paint the whole house out of sequence and the
       row would buy nothing. Both halves are asserted because they are written
       in two languages and neither can see the other.

       VERIFIED AND STATED: before this row the standing order said NOTHING
       about waiting and `baton-watch.sh` counted a blocked roll as owed, so the
       baton would have sat on the seat and nudged it to paint out of order. */
    const packet = packetNote(null, {
      location: "kitchen", location_type: "indoor", depends_on: "kitchen/S" });
    expect(packet, "a waiting packet does not say so").toContain("WAITS for `kitchen/S`");
    expect(packet).toContain("Do not paint it");

    /* ...and a packet that carries a strip AND waits says both, which row 38
       could never produce and row 42 can: a facing can hold a strip from one
       painted neighbour and still be waiting for its room's lead. */
    const both = packetNote(
      { side: "left", fraction: 0.1, source: "backdrops/kitchen/W.png",
        neighbour_edge: "right", width_px: 153, sha256: "a".repeat(64),
        source_sha256: "b".repeat(64), role_sentence: "…", policy: "opportunistic",
        why: "…", location: "kitchen", location_type: "indoor",
        depends_on: "kitchen/S" }, null);
    expect(both).toContain("WAITS for `kitchen/S`");
    expect(both).toContain("Image 3 is this wall's edge seed");

    const order = readFileSync(join(repoRoot, "tools", "baton-watch.sh"), "utf8");
    const line = order.split("\n").find((l) => l.startsWith("ORDER="));
    expect(line, "baton-watch.sh no longer carries a standing order").toBeTruthy();
    expect(line, "the standing paint order does not tell the seat to skip a waiting packet")
      .toContain("depends_on");
    /* And the watchdog must not COUNT a waiting roll as owed, or the baton sits
       on the seat forever and nudges it to do the one thing it must not. */
    expect(order).toContain('if e.get("depends_on"): continue');
  });

  test("an open location's ring starts at its lead and closes", () => {
    const cold = openOrder(PLAN, "entrance_approach", () => false);
    expect(cold[0].facing).toBe(leadFacing(PLAN, "entrance_approach"));
    expect(cold[0].origin).toBe(true);
    expect(cold[0].depends_on).toBeNull();
    expect(cold.map((o) => o.facing).sort())
      .toEqual(Object.keys(PLAN.rooms.find((r) => r.id === "entrance_approach").facings).sort());
    expect(cold.slice(1).every((o) => o.depends_on)).toBe(true);
    /* And the dependency is a fact about NOW: hand it a resolver that says
       every wall already has a picture and nothing waits for anything. */
    const warm = openOrder(PLAN, "entrance_approach", () => true);
    expect(warm.every((o) => o.depends_on === null)).toBe(true);
    expect(warm.slice(1).every((o) => o.continues)).toBe(true);
  });

  test("the emitted records carry the dependency, and only where the row licenses one", () => {
    const retries = JSON.parse(readFileSync(join(MANOR, "retries.json"), "utf8"));
    const manifest = JSON.parse(readFileSync(join(MANOR, "manifest.json"), "utf8"));
    const rows = retries.entries.filter((e) => "depends_on" in e);
    expect(rows.length, "no re-ask has been emitted since row 38 — this case is blind")
      .toBeGreaterThan(0);
    for (const e of rows) {
      const open = isOpenLocation(PLAN, e.key.split("/")[0]);
      expect(e.seed_policy).toBe(open ? "required" : "opportunistic");
      /* [row 42] An indoor entry MAY now carry a dependency — what it may not
       * do is carry one that is not its room's own order. `continues` is
       * written beside it on every entry cut from row 42 on; an older entry
       * has neither field and is read by the ring rule it was written under. */
      if (e.depends_on) {
        if (e.continues !== undefined) {
          expect(e.depends_on, `${e.key} waits for something it does not continue`)
            .toBe(e.continues);
        } else {
          expect(neighbourAt(e.key.split("/")[1], "left"))
            .toBe(e.depends_on.split("/")[1]);
        }
      }
      if (e.edge_seed) {
        expect(e.edge_seed.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(existsSync(join(repoRoot, e.edge_seed.file))).toBe(true);
        expect(sha(join(repoRoot, e.edge_seed.file)), `${e.key}'s recorded strip`)
          .toBe(e.edge_seed.sha256);
        expect(sha(join(repoRoot, e.edge_seed.source)), `${e.key}'s recorded source painting`)
          .toBe(e.edge_seed.source_sha256);
        expect(e.edge_seed.neighbour_edge)
          .toBe(neighbourEdge(e.key.split("/")[1], e.edge_seed.side));
      }
    }
    /* The manifest's own ordering block. [row 42] `room_order` is written whole
     * for EVERY location and carries the lead and why it leads; the older
     * `open_location_order` is read where a manifest predates the row. */
    if (manifest.room_order) {
      for (const [room, block] of Object.entries(manifest.room_order)) {
        expect(block.lead, `${room} has no lead`).toBeTruthy();
        expect(block.lead_why, `${room}'s lead is unexplained`).toBeTruthy();
        expect(block.order[0].key).toBe(block.lead);
        expect(block.order[0].depends_on).toBeNull();
        expect(block.type).toBe(isOpenLocation(PLAN, room) ? "open" : "indoor");
      }
    } else if (manifest.open_location_order) {
      for (const [room, chain] of Object.entries(manifest.open_location_order)) {
        expect(isOpenLocation(PLAN, room)).toBe(true);
        expect(chain[0].depends_on).toBeNull();
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* 5. THE INSTRUMENT CAN GO RED                                        */
/* ------------------------------------------------------------------ */

test.describe("row 38 — the seam metric", () => {
  let dir;
  test.beforeAll(() => { dir = mkdtempSync(join(tmpdir(), "holo-seam-")); });
  test.afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const measure = (left, right) =>
    JSON.parse(py([SEAM, "--left", left, "--right", right, "--json"]).trim());

  test("a planted continuity passes and a planted discontinuity is found", () => {
    /* One deterministic field, split down the middle: the two halves ARE
     * continuous, because they were one picture a moment ago. Then the same
     * field with the right half tonally broken — the exact defect a turn
     * exposes, planted at a known size. */
    py(["-c",
      "import numpy as np; from PIL import Image; " +
      "rng = np.random.default_rng(38); " +
      "g = np.linspace(0,1,1024)[:,None] * np.linspace(0,1,1536)[None,:]; " +
      "v = 60 + 120*g + rng.normal(0,3,(1024,1536)); " +
      "a = np.stack([v, v*0.9, v*0.8], 2).clip(0,255); " +
      "b = a.copy(); b[:,768:,:] = (b[:,768:,:]*0.55 + 40).clip(0,255); " +
      `Image.fromarray(a[:,:768].astype('uint8')).save(${JSON.stringify(join(dir, "cl.png"))}); ` +
      `Image.fromarray(a[:,768:].astype('uint8')).save(${JSON.stringify(join(dir, "cr.png"))}); ` +
      `Image.fromarray(b[:,768:].astype('uint8')).save(${JSON.stringify(join(dir, "br.png"))})`]);
    const cont = measure(join(dir, "cl.png"), join(dir, "cr.png"));
    const broke = measure(join(dir, "cl.png"), join(dir, "br.png"));
    expect(cont.continuous, `planted continuity read ${cont.discontinuity}`).toBe(true);
    expect(cont.discontinuity).toBeLessThan(1.5);
    expect(broke.continuous, `planted break read ${broke.discontinuity}`).toBe(false);
    expect(broke.discontinuity).toBeGreaterThan(cont.discontinuity * 2);
    expect(broke.tone_gap).toBeGreaterThan(cont.tone_gap);
  });

  test("and on real paintings: one wall split in two is continuous, two rooms are not", () => {
    py(["-c",
      "import numpy as np; from PIL import Image; " +
      `a = np.asarray(Image.open(${JSON.stringify(join(repoRoot, "backdrops", "study", "N.png"))}).convert('RGB')); ` +
      `Image.fromarray(a[:,:768]).save(${JSON.stringify(join(dir, "sl.png"))}); ` +
      `Image.fromarray(a[:,768:]).save(${JSON.stringify(join(dir, "sr.png"))})`]);
    const split = measure(join(dir, "sl.png"), join(dir, "sr.png"));
    expect(split.continuous, `study/N split read ${split.discontinuity}`).toBe(true);
    const strangers = JSON.parse(py([SEAM, "--left",
      join(repoRoot, "backdrops", "library", "N.png"), "--right",
      join(repoRoot, "backdrops", "servants_hall", "S.png"), "--json"]).trim());
    expect(strangers.continuous,
      `two unrelated rooms read ${strangers.discontinuity}`).toBe(false);
    expect(strangers.discontinuity).toBeGreaterThan(split.discontinuity * 3);
  });

  test("it refuses a pair that does not abut, and frames of different heights", () => {
    expect(() => py([SEAM, "--pair", "entrance_approach/E", "entrance_approach/W"]))
      .toThrow(/does not abut/s);
    py(["-c",
      "import numpy as np; from PIL import Image; " +
      `Image.fromarray(np.zeros((512,512,3),'uint8')).save(${JSON.stringify(join(dir, "short.png"))})`]);
    expect(() => py([SEAM, "--left", join(dir, "short.png"),
      "--right", join(repoRoot, "backdrops", "study", "N.png")])).toThrow(/rows high/s);
  });

  test("the corpus baseline runs, and every adjacent promoted pair is in it", () => {
    const out = JSON.parse(py([SEAM, "--corpus", "--json"]).trim());
    const painted = (k) => existsSync(join(repoRoot, "backdrops", ...k.split("/")) + ".png") &&
      existsSync(join(repoRoot, "backdrops", ...k.split("/")) + ".meta.json");
    const want = [];
    for (const room of PLAN.rooms) {
      for (const f of FACINGS) {
        const g = neighbourAt(f, "right");
        if (!room.facings[f] || !room.facings[g]) continue;
        if (painted(`${room.id}/${f}`) && painted(`${room.id}/${g}`)) {
          want.push(`${room.id}/${f}|${room.id}/${g}`);
        }
      }
    }
    expect(out.pairs.map((p) => `${p.left}|${p.right}`).sort()).toEqual(want.sort());
    for (const p of out.pairs) {
      expect(p.outdoor).toBe(isOpenLocation(PLAN, p.room));
      expect(p.strip_px).toBe(154);
    }
  });
});
