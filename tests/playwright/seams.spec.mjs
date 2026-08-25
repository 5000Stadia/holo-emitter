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
  EDGE_FRACTION, SIDES, neighbourAt, neighbourEdge, adjacencyTable, roleSentence,
  seedPlan, openOrder, cutEdgeSeed, seedFileName, wallLineEnd, isOpenLocation
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
  test("manorPrompt names Image 3 when and only when it is given a seed", () => {
    const key = "entrance_approach/N";
    const [loc, f] = key.split("/");
    const meta = deriveMeta(PLAN, loc, f);
    const { rects } = scaffoldRects(PLAN, loc, f, meta);
    const bare = manorPrompt(PLAN, key, meta, rects);
    expect(bare).not.toContain("Image 3");
    for (const side of SIDES) {
      const seeded = manorPrompt(PLAN, key, meta, rects, null,
        { ...seedPlan(PLAN, key), side, role_sentence: roleSentence(side) });
      expect(seeded).toContain(roleSentence(side));
      /* In the Input images paragraph, on one physical line, after Image 2's —
       * the composer's own idiom, and what the line-counting t1/t2 control
       * depends on. */
      const lines = seeded.split("\n");
      const at = lines.findIndex((l) => l.includes("Image 3 is a reference"));
      expect(at, "Image 3 must be introduced with the other images").toBeGreaterThan(
        lines.findIndex((l) => /^Input images:/.test(l)));
      expect(at).toBeLessThan(lines.findIndex((l) => /^Primary request:/.test(l)));
      expect(lines[at].trim()).toBe(roleSentence(side));
      /* And nothing else moved. */
      expect(lines.filter((l, i) => i !== at).join("\n")).toBe(bare);
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
         `attachSeeds` walks `SIDES`, hands the nth cut strip `image_index =
         3 + n`, and `roleSentence(side, index)` writes that number into the
         sentence — so the index a strip must be called by is its position in
         this filtered list and nothing else. */
      const sides = SIDES.filter((s) => existsSync(join(p, seedFileName(s))));
      const text = readFileSync(join(p, "prompt.txt"), "utf8");
      const md = readFileSync(join(p, "PACKET.md"), "utf8");
      if (!sides.length) {
        expect(text, `${p} names Image 3 with no strip beside it`).not.toContain("Image 3");
        expect(md).not.toContain("**Image 3**");
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
        const n = 3 + i;
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
      expect(text, `${p} names an Image ${3 + sides.length} it carries no strip for`)
        .not.toContain(`Image ${3 + sides.length} is a reference`);
      expect(md, `${p}'s attach list names an Image ${3 + sides.length} that is not in it`)
        .not.toContain(`**Image ${3 + sides.length}**`);
    }
    expect(seeded, "no packet carries a seed — the pilot is not on disk").toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 4. THE ORDERING, AND ITS SCOPE                                      */
/* ------------------------------------------------------------------ */

test.describe("row 38 — ordering is an open location's, and nobody else's", () => {
  test("seedPlan never makes an indoor facing depend on anything", () => {
    for (const room of PLAN.rooms) {
      for (const f of Object.keys(room.facings || {})) {
        const s = seedPlan(PLAN, `${room.id}/${f}`);
        if (isOpenLocation(PLAN, room.id)) {
          expect(s.policy).toBe("required");
        } else {
          expect(s.policy).toBe("opportunistic");
          expect(s.depends_on, `${room.id}/${f} is indoors and may not be ordered`).toBeNull();
        }
        /* A facing that has a seed never waits: it has what it needs. */
        if (s.neighbour) expect(s.depends_on).toBeNull();
      }
    }
  });

  test("an open location's order is the ring from the first completed direction", () => {
    const order = openOrder(PLAN, "entrance_approach");
    expect(order.map((o) => o.facing)).toEqual(["E", "S", "W", "N"]);
    expect(order[0].origin).toBe(true);
    expect(order[0].depends_on).toBeNull();
    for (let i = 1; i < order.length; i++) {
      expect(order[i].depends_on).toBe(`entrance_approach/${order[i - 1].facing}`);
      expect(neighbourAt(order[i].facing, "left")).toBe(order[i - 1].facing);
    }
    /* With nothing painted, the origin is the first facing in compass order and
     * the chain still closes — this is what a location painted from scratch
     * does, and it is the case the pilot's room can no longer show. */
    const cold = openOrder(PLAN, "entrance_approach", () => false);
    expect(cold.map((o) => o.facing)).toEqual(["N", "E", "S", "W"]);
    expect(cold[0].depends_on).toBeNull();
    expect(cold.slice(1).every((o) => o.depends_on)).toBe(true);
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
      if (!open) expect(e.depends_on, `${e.key} is indoors`).toBeNull();
      if (e.depends_on) {
        expect(e.edge_seed, `${e.key} waits AND carries a seed`).toBeNull();
        expect(neighbourAt(e.key.split("/")[1], "left"))
          .toBe(e.depends_on.split("/")[1]);
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
    /* The manifest's own ordering block, written whole per open location. */
    if (manifest.open_location_order) {
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
