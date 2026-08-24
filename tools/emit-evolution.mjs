#!/usr/bin/env node
/**
 * Row 34 — the evolution run's emitter.
 *
 *     node tools/emit-evolution.mjs                 # cut generation 1
 *     node tools/emit-evolution.mjs --generation 1
 *
 * `design/specs/34-plan.md` is the contract. This file cuts one generation's
 * images, composes every arm's prompt through `tools/evolution-arms.mjs`,
 * writes the packets, and writes the id map — and then stops, because
 * DISPATCH IS THE NAVIGATOR'S ACT and nothing here sends anything anywhere.
 *
 * THE ONE FENCE THAT MATTERS, AND IT IS STRUCTURAL. This tool and its runner
 * never open `design/batches/row23-scaffold/manor/manifest.json`,
 * `run-state.json` or `retries.json`. The manor production sweep is
 * symmetrically blind to this row: its arrival scan matches
 * `^row23-[0-9a-f]{8}\.png$` and its sweep walks its own manifest's rolls, so
 * `row34-` files sitting in the same source directories are invisible to it.
 * `evolution.spec.mjs` asserts both halves, structurally and behaviourally.
 *
 * THREE IMAGES PER WALL, AND ONLY TWO OF THEM CARRY THE SHIPPED-FRAME
 * GUARANTEE. `frame.png` and `scaffold.png` come out of
 * `window.HOLO.renderer.render` through `make-scaffold.mjs`'s own PAGE_RENDER,
 * which is what row 23 §7.1 hashes against the live `#scene` buffer. `edge.png`
 * is a line drawing composed from the same DECLARED numbers — plan §1.2 — and
 * the manifest says so on its face rather than letting a later reader assume a
 * provenance it does not have.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { PAGE_RENDER, GLYPH_TABLE, sourceDirFor, chairRail, assertLabelChars }
  from "./make-scaffold.mjs";
import {
  ROOT, PLAN, PROBES, ARMS, ARM_IDS, GEN1_ARMS, CONTROL_ARM, SPECTRUM, HEADLINE_PAIRING,
  AMPLIFICATION, STYLE_SEED, CANVAS_W, CANVAS_H,
  makeCtx, armPrompt, edgeMarks, frameGeometry, vanishingPoint
} from "./evolution-arms.mjs";
import { voiceFor } from "./room-voices.mjs";

const BATCH = join(ROOT, "design", "batches", "row34-evolution");
const ROLLS_PER_ARM_PER_WALL = 2;

/** The declared budget, from plan §3. The emitter refuses to exceed it. */
export const BUDGET = {
  generations_max: 3,
  rolls_per_arm_per_wall: ROLLS_PER_ARM_PER_WALL,
  arms_gen1: 7, walls: 2,
  images_per_screening_generation: 28,
  images_confirmation_generation: 12,
  total_worst_case: 68,
  total_without_confirmation: 56,
  _superseded: "the first draft of the plan declared 6 arms, 24 a generation and 60 worst case; the governing frame's v7 added 4 per generation and the totals above were re-declared before anything was emitted",
  _authority: "design/specs/34-plan.md §3"
};

/* THE OPAQUE ID, row 23 §5.1's discipline on this row's own grammar. It carries
 * neither the arm nor the wall, so a return path cannot tell a measuring hand
 * which condition it is looking at. Said plainly, as row 23 says it: this is
 * not cryptographic and it is reproducible from this file. What actually
 * carries the blinding is that the detector configuration is a function of the
 * WALL's scaffold, so it cannot vary by arm even in principle. */
export function rollId34(generation, wall, arm, roll) {
  return createHash("sha256")
    .update(`row34|${generation}|${wall}|${arm}|${roll}`)
    .digest("hex").slice(0, 8);
}

const ID_RE = /^row34-[0-9a-f]{8}\.(png|prompt\.txt)$/;

function gitCommit() {
  try {
    return execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { return null; }
}

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function writePng(dataUrl, path) {
  writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
}

/* ------------------------------------------------------------------ */
/* The edge drawing                                                    */
/* ------------------------------------------------------------------ */
/* Black ink on white, and NOTHING ELSE IN THE PICTURE — no metre grid, no
 * facing glyph, no legend, no dashed carrier boxes with words in them. The arm
 * exists to ask whether a diagram whose whole content is geometry beats one
 * that also carries a grid, a letter and a paragraph of annotation, so anything
 * that is not geometry has to be absent rather than faint. */
export const EDGE_PAGE_RENDER = function (arg) {
  const { marks } = arg;
  const cv = document.createElement("canvas");
  cv.width = 1536; cv.height = 1024;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = marks.ground;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = marks.ink;
  ctx.lineCap = "butt";
  const WEIGHT = { heavy: 5, medium: 3, light: 2 };
  for (const l of marks.lines) {
    ctx.lineWidth = WEIGHT[l.weight];
    ctx.beginPath();
    ctx.moveTo(l.x0, l.y0);
    ctx.lineTo(l.x1, l.y1);
    ctx.stroke();
  }
  for (const r of marks.rects) {
    ctx.lineWidth = WEIGHT[r.weight];
    ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  }
  return cv.toDataURL("image/png");
};

/* ------------------------------------------------------------------ */
/* One wall's images                                                   */
/* ------------------------------------------------------------------ */

/** The label marks the shipped scaffold stamps — `make-scaffold`'s own shapes,
 *  rebuilt here from the ctx so this tool never re-derives a coordinate. */
function scaffoldMarks(ctx) {
  const { voice, anchor } = voiceFor(ctx.plan, ctx.loc, ctx.facing);
  const cr = chairRail(ctx.meta, anchor);
  assertLabelChars(cr.label, `${ctx.key}'s gate anchor label`);
  const lines = [
    "SCAFFOLD LEGEND - THESE MARKS ARE INSTRUCTIONS AND ARE NEVER PAINTED",
    `RULED - ${anchor.legend_word} 0.95 M · CARRIER WIDTHS · DOOR HEAD 2.00 M`,
    "CONVENTION - CARRIER HEIGHTS ABOVE FLOOR · WINDOW SILL AND HEAD",
    `SCALE - ONE METRE OF WALL SPANS ${ctx.meta.px_per_m_at_wall.toFixed(0)} PIXELS AT THE WALL PLANE`,
    "CAMERA - THE META THIS PAGE HOLDS FOR THIS FACING"
  ];
  for (const l of lines) assertLabelChars(l, `${ctx.key}'s legend`);
  const TEXT_H = 15, LINE_H = 26;
  const box = (s, h) => s.length * (h * 0.62 + h * 0.26) - h * 0.26;
  const h = LINE_H * lines.length + 22;
  const w = Math.round((24 + Math.max(...lines.map((l) => box(l, TEXT_H)))) * 100) / 100;
  return {
    rects: ctx.rects, chair_rail: cr, voice_id: voice.id,
    legend: { x: 24, y: CANVAS_H - h - 24, w, h, lines, text_h: TEXT_H, line_h: LINE_H }
  };
}

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */

/**
 * Which arms a generation runs.
 *
 * GENERATION 1'S SET IS THE DECLARED SEVEN. EVERY LATER GENERATION'S IS THE
 * PLANNER'S, read out of the plan file `row34_fitness.py --plan-generation-N`
 * wrote — never a list in this file, because an emitter that could choose its
 * own arms is an emitter that could quietly keep a losing one alive. Each named
 * arm must exist as a composer AND its declared channel triple must equal the
 * one the plan bred, so a composer written to the wrong triple is refused here
 * rather than discovered in the table.
 */
function armsFor(generation) {
  if (generation === 1) return GEN1_ARMS;
  const p = join(BATCH, `generation-${generation}-plan.json`);
  if (!existsSync(p)) {
    throw new Error(`emit-evolution refused: generation ${generation} has no plan at ` +
      `${p.slice(ROOT.length + 1)}. Run row34_fitness.py --plan-generation-${generation} first; ` +
      "the arm set is the rule's to decide, not this tool's.");
  }
  const plan = JSON.parse(readFileSync(p, "utf8"));
  if (plan.refused) {
    throw new Error(`emit-evolution refused: the generation-${generation} plan is itself a ` +
      `refusal (branch ${plan.branch}): ${plan._why_refused || plan._why}`);
  }
  const ids = [];
  for (const a of plan.arms) {
    const arm = ARMS[a.arm];
    if (!arm) {
      throw new Error(`emit-evolution refused: the plan names \`${a.arm}\` and no composer ` +
        `implements it. Its channel triple is ${JSON.stringify(a.channels)} and it was fixed by ` +
        "the rule, not chosen; write the composer to that triple.");
    }
    for (const c of Object.keys(a.channels)) {
      if (arm.channels[c] !== a.channels[c]) {
        throw new Error(`emit-evolution refused: \`${a.arm}\`'s composer declares ` +
          `${c}=${arm.channels[c]} where the plan bred ${c}=${a.channels[c]}`);
      }
    }
    ids.push(a.arm);
  }
  return ids;
}

async function emit(generation) {
  if (generation > BUDGET.generations_max) {
    throw new Error(`emit-evolution refused: generation ${generation} is past the declared ` +
      `maximum of ${BUDGET.generations_max} (design/specs/34-plan.md §3)`);
  }
  const armIds = armsFor(generation);
  const genDir = join(BATCH, `gen${generation}`);
  mkdirSync(genDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CANVAS_W, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  const walls = [];
  const rolls = [];
  for (const probe of PROBES) {
    const key = probe.key;
    /* THE META THE PAGE HOLDS, which is what a player's build resolves. Both
     * probes are unpainted, so it is the derived meta — and the suite asserts
     * that against the manor manifest's own copy rather than assuming it. */
    const pageMeta = await page.evaluate((k) => {
      const e = window.HOLO_APP.backdrops[k];
      return e && e.meta ? e.meta : null;
    }, key);
    if (!pageMeta) throw new Error(`emit-evolution: the page holds no meta for ${key}`);
    const ctx = makeCtx(PLAN, key, pageMeta);
    const dir = join(genDir, key.replace("/", "-"));
    mkdirSync(dir, { recursive: true });

    const marks = scaffoldMarks(ctx);
    const frame = await page.evaluate(PAGE_RENDER,
      { key, meta: pageMeta, mode: "scaffold", marks: null, G: GLYPH_TABLE });
    const scaffold = await page.evaluate(PAGE_RENDER,
      { key, meta: pageMeta, mode: "scaffold", marks, G: GLYPH_TABLE });
    const edge = await page.evaluate(EDGE_PAGE_RENDER, { marks: edgeMarks(ctx) });
    writePng(frame, join(dir, "frame.png"));
    writePng(scaffold, join(dir, "scaffold.png"));
    writePng(edge, join(dir, "edge.png"));
    copyFileSync(join(ROOT, STYLE_SEED), join(dir, "style-seed-warm.png"));

    const g = frameGeometry(pageMeta);
    const vp = vanishingPoint(pageMeta);
    const sidecar = {
      _what_this_is: "One probe wall's declared geometry, written before any candidate exists. Every bracket here is the standing +/-8 % propagated through a geometry this wall declares; nothing in it is chosen, and the measurement reads its windows from this file.",
      row: 34, generation, wall: key,
      why_this_wall: probe.why,
      held_best_sigma_px: probe.held_sigma_px,
      voice: { id: ctx.voice.id, anchor: ctx.anchor.id, outdoor: !!ctx.voice.outdoor, via: ctx.via },
      meta_used: pageMeta,
      meta_origin: "the meta the page holds for this facing (derived: this wall is not promoted)",
      declared_horizon_row: Math.round(g.horizonY),
      vanishing_point: { x: Math.round(vp.x * 100) / 100, y: Math.round(vp.y * 100) / 100,
        _derivation: "the intersection of this facing's own two side-wall junction lines as renderer.js drawGrid draws them, computed rather than assumed to be the frame centre" },
      frame_geometry: g,
      stamped: ctx.rects.map((r) => ({ kind: r.kind, id: r.id, x0: r.x0, x1: r.x1,
        y0: r.y0, y1: r.y1, from_m: r.from_m, to_m: r.to_m })),
      chair_rail: ctx.chair_rail,
      brackets: ctx.brackets,
      edge_marks: edgeMarks(ctx),
      _edge_provenance: "COMPOSED FROM DECLARED GEOMETRY, NOT A SHIPPED-RENDERER CAPTURE. frame.png and scaffold.png come out of window.HOLO.renderer.render and carry row 23 §7.1's guarantee that the picture a painter is given is the picture a player sees; edge.png does not. Plan §1.2 makes re-establishing that guarantee a named condition on folding v5 into production.",
      images: {
        frame: sha256File(join(dir, "frame.png")),
        scaffold: sha256File(join(dir, "scaffold.png")),
        edge: sha256File(join(dir, "edge.png"))
      },
      plan_drawn_digest: drawnDigest(),
      renderer_sha256: sha256File(join(ROOT, "src", "renderer.js")),
      groundplane_sha256: sha256File(join(ROOT, "src", "groundplane.js")),
      git_commit: gitCommit()
    };
    writeFileSync(join(dir, "sidecar.json"), JSON.stringify(sidecar, null, 2) + "\n");

    /* ---- one packet per arm ---- */
    const srcDir = sourceDirFor(key);
    mkdirSync(join(ROOT, srcDir), { recursive: true });
    for (const armId of armIds) {
      const arm = ARMS[armId];
      const armDir = join(dir, armId);
      mkdirSync(armDir, { recursive: true });
      const text = armPrompt(armId, ctx);
      writeFileSync(join(armDir, "prompt.txt"), text);
      const ids = [];
      for (let n = 1; n <= ROLLS_PER_ARM_PER_WALL; n++) {
        const id = rollId34(generation, key, armId, n);
        const rec = {
          id, generation, wall: key, arm: armId, roll: n,
          candidate: `${srcDir}/row34-${id}.png`,
          prompt: `${srcDir}/row34-${id}.prompt.txt`
        };
        for (const f of [`row34-${id}.png`, `row34-${id}.prompt.txt`]) {
          if (!ID_RE.test(f)) throw new Error(`emit-evolution: bad return path ${f}`);
        }
        writeFileSync(join(ROOT, rec.prompt), text);
        ids.push(rec);
        rolls.push(rec);
      }
      /* The images this arm attaches, copied INTO its own packet directory, so
       * a seat holding one packet never has to know which of three pictures at
       * the wall's level it was supposed to pick up. */
      for (const img of arm.images(ctx)) {
        if (img !== "style-seed-warm.png") copyFileSync(join(dir, img), join(armDir, img));
        else copyFileSync(join(ROOT, STYLE_SEED), join(armDir, img));
      }
      writeFileSync(join(armDir, "PACKET.md"), packetMd(key, arm, ids, ctx, generation));
    }

    walls.push({
      key, packet: dir.slice(ROOT.length + 1),
      why_this_wall: probe.why,
      px_per_m_at_wall: pageMeta.px_per_m_at_wall,
      camera_wall_m: pageMeta.camera_wall_m,
      wall_width_m: pageMeta.wall_width_m,
      floor_line_y: pageMeta.floor_line_y,
      horizon_y: pageMeta.horizon_y,
      declared_horizon_row: Math.round(g.horizonY),
      corner_x0_px: pageMeta.corner_x0_px, corner_x1_px: pageMeta.corner_x1_px,
      storey_height_m: pageMeta.storey_height_m,
      implied_focal_px: pageMeta.focal_px,
      brackets: ctx.brackets,
      stamped: ctx.rects.map((r) => ({ kind: r.kind, x0: r.x0, x1: r.x1 })),
      chair_rail_y: ctx.chair_rail.y,
      voice: { id: ctx.voice.id, anchor: ctx.anchor.id, outdoor: !!ctx.voice.outdoor },
      sidecar_sha256: sha256File(join(dir, "sidecar.json"))
    });
    console.log(`  ${key.padEnd(20)} ${ctx.rects.length} carrier(s)  ` +
      `${armIds.length} arms x ${ROLLS_PER_ARM_PER_WALL} rolls`);
  }
  await browser.close();

  /* THE BUDGET IS A CEILING FOR A BRED GENERATION AND AN EXACT COUNT FOR THE
   * DECLARED ONE. Generation 1's seven arms are written into the plan, so a
   * different number there is a bug. A later generation's arm set comes out of
   * the breeding, and branch B can honestly come in UNDER when the leaders are
   * near-identical and their crossings are already in the pool — plan §6 says
   * under is fine and over is refused, and this is that sentence. */
  const ceiling = BUDGET.images_per_screening_generation;
  const over = generation === 1 ? rolls.length !== ceiling : rolls.length > ceiling;
  if (over) {
    throw new Error(`emit-evolution refused: ${rolls.length} rolls against a declared ` +
      `${ceiling} (design/specs/34-plan.md §3)`);
  }
  /* AND THE TOTAL, which is the number the row's done clause actually binds —
   * "all bounded roll counts were declared before dispatch". A per-generation
   * ceiling alone would let three generations each come in under and still
   * overspend the row; and it would refuse a generation that is over its own
   * line while under the total, which is exactly the case generation 3 is in.
   * Counted off the id maps on disk rather than from a running tally, so a
   * re-emission cannot double-count and a deleted map cannot hide a spend. */
  let spent = rolls.length;
  for (let g = 1; g < generation; g++) {
    const p = join(BATCH, g === 1 ? "assignment.json" : `assignment-gen${g}.json`);
    if (existsSync(p)) spent += JSON.parse(readFileSync(p, "utf8")).rolls.length;
  }
  if (spent > BUDGET.total_worst_case) {
    throw new Error(`emit-evolution refused: ${spent} rolls across the row against a declared ` +
      `total of ${BUDGET.total_worst_case} (design/specs/34-plan.md §3). A generation may move ` +
      "its own line; the total is what was declared before dispatch and it does not move.");
  }
  console.log(`  budget      ${spent} of ${BUDGET.total_worst_case} declared, across the row`);

  /* ---- the id map, committed before any candidate exists ---- */
  const assignPath = join(BATCH, generation === 1 ? "assignment.json" : `assignment-gen${generation}.json`);
  writeFileSync(assignPath, JSON.stringify({
    _what_this_is: "The row-34 evolution's id map: which opaque return id belongs to which arm, wall and roll. Committed BEFORE any candidate is measured and never edited afterwards - evolution.spec.mjs finds its introducing commit with `git log --diff-filter=A` and asserts that commit's blob equals the current one.",
    _why_opaque: "A return path carrying its arm would tell a measuring hand which condition it is looking at. What actually carries the blinding is that the detector configuration is a function of the WALL's declared geometry, so it cannot vary by arm even in principle; the opaque id keeps the arm out of the path as well. The id is reproducible from tools/emit-evolution.mjs and is not cryptographic, which is said here rather than implied.",
    _what_it_cannot_blind: "the generating hand, which is holding the packet and knows which arm it is running. That is inherent and is not claimed away.",
    _budget: BUDGET,
    _generation: generation,
    _arms: armIds.map((id) => ({ id, name: ARMS[id].name, channels: ARMS[id].channels,
      images: ARMS[id].images(), what: ARMS[id].what })),
    _control: CONTROL_ARM,
    _no_privileged_arm: "[HUMAN, 2026-08-24] \"Yeah but test my direction against our tests as well.\" v7 is the governing frame's own arm and it runs on terms byte-identical to every other arm: same rolls, same blind measurement, same pre-committed rules, same Holm family, no seat by name. The only standing entrant is the control, which is the yardstick and never a candidate for the crown.",
    _spectrum: SPECTRUM,
    _headline_pairing: HEADLINE_PAIRING,
    _amplification: AMPLIFICATION,
    _generated: new Date().toISOString().slice(0, 10),
    rolls
  }, null, 2) + "\n");

  const manifest = {
    _what_this_is: "The row-34 evolution run's order for one generation: two probe walls, their declared geometry and brackets, and every arm's packet. The measurement reads this file and assignment.json and nothing else.",
    _dispatch: "NOT DISPATCHED. Dispatch is the Navigator's act; this tool cuts packets and stops.",
    _sweep_independence: "This run never opens design/batches/row23-scaffold/manor/{manifest,run-state,retries}.json, never promotes, never bakes and never publishes. The manor sweep is symmetrically blind to it: its arrival scan matches ^row23-[0-9a-f]{8}\\.png$ and it walks its own manifest's rolls.",
    _probe_selection: "Both walls are from run-state.json's unfitted-horizon subset - camera PASS, horizon held - screened for corners and every bracket in frame, every stamped carrier in frame, and the fewest entries in the reading's own `_absent`. See design/specs/34-plan.md §2.",
    row: 34, generation,
    budget: BUDGET,
    walls,
    arms: armIds.map((id) => ({ id, name: ARMS[id].name, what: ARMS[id].what,
      channels: ARMS[id].channels, images: ARMS[id].images() })),
    control: CONTROL_ARM,
    rolls_per_arm_per_wall: ROLLS_PER_ARM_PER_WALL,
    total_rolls: rolls.length,
    _generated: new Date().toISOString().slice(0, 10),
    git_commit: gitCommit()
  };
  /* ONE MANIFEST PER GENERATION, named like the id map. The first draft wrote
   * `manifest.json` unconditionally, which would have replaced generation 1's
   * with generation 2's the moment a second generation was cut — and generation
   * 1's manifest is what points the measure path at generation 1's sidecars, so
   * re-measuring an earlier generation would have silently read the wrong
   * wall geometry. Caught before generation 2 was emitted, not after. */
  const manifestPath = join(BATCH, generation === 1
    ? "manifest.json" : `manifest-gen${generation}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\ngeneration ${generation}: ${rolls.length} rolls, ${armIds.length} arms, ` +
    `${walls.length} walls`);
  console.log(`  packets     ${genDir.slice(ROOT.length + 1)}`);
  console.log(`  id map      ${assignPath.slice(ROOT.length + 1)}`);
  console.log(`  manifest    ${manifestPath.slice(ROOT.length + 1)}`);
  console.log("  NOT DISPATCHED - dispatch is the Navigator's act");
}

function drawnDigest() {
  const p = join(ROOT, "design", "plan-draft", "approval.lock");
  if (!existsSync(p)) return null;
  const m = /^plan\s+([0-9a-f]{64})\s/m.exec(readFileSync(p, "utf8"));
  return m ? m[1] : null;
}

function packetMd(key, arm, ids, ctx, generation) {
  const imgs = arm.images(ctx);
  return `# Packet — ${key}, arm ${arm.id} (${arm.name})

${arm.what}

**Generate ${ids.length} images. Save each to the exact path in the table.** The measurement runs the
moment a file appears at one of those paths, so a return in the right place under the wrong name
costs a roll.

## Attach, in this order

${imgs.map((f, i) => `${i + 1}. \`${f}\` — **Image ${i + 1}**${
  f === "style-seed-warm.png"
    ? " — the style reference, Kabe's approved seed (\"Warm\", `design/approvals.log`, 2026-08-21)"
    : f === "scaffold.png" ? " — the annotated layout scaffold"
      : " — the layout as black-ink line art"}`).join("\n")}
${imgs.length === 1 ? "\n**There is no second image, and that is this arm.** The whole geometry is in the prompt.\n" : ""}
Then send the prompt text verbatim from \`prompt.txt\`.

## The rolls

| roll | save the image to |
|---|---|
${ids.map((r) => `| ${r.roll} | \`${r.candidate}\` |`).join("\n")}

**The prompt file is already on disk beside where each image goes** (\`${ids[0].prompt}\`), written
from this packet, so a return needs nothing but the PNG. Do not rewrite them.

## What this wall is

${key}, generation ${generation}. ${ctx.meta.px_per_m_at_wall.toFixed(1)} px per metre at the wall
plane; ${ctx.rects.length ? ctx.rects.map((r) => r.kind).join(" + ") : `no carrier — ${ctx.voice.blank}`}.
Voice **${ctx.voice.id}**; gate anchor **${ctx.anchor.line}**, 0.95 m.

## The fence

Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`. Nothing here asks you to judge a
result: generate, save to the named paths, and report the paths back.
`;
}

/* ONLY WHEN RUN, NEVER WHEN IMPORTED. `evolution.spec.mjs` imports `BUDGET` and
 * `rollId34` from this file to check the declared budget and the id grammar
 * against the emitter itself rather than against a copy; without this guard
 * that import would launch a browser and re-cut the generation under the
 * suite's feet. */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const gi = argv.indexOf("--generation");
  const generation = gi >= 0 ? Number(argv[gi + 1]) : 1;
  emit(generation).catch((e) => { console.error(e); process.exit(1); });
}
