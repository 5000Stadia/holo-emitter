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
  ROOT, PLAN, PROBES, ARMS, ARM_IDS, GEN1_ARMS, CONTROL_ARM, SPECTRUM, REGISTER, HEADLINE_PAIRING,
  AMPLIFICATION, STYLE_SEED, CANVAS_W, CANVAS_H,
  makeCtx, armPrompt, edgeMarks, frameGeometry, vanishingPoint,
  REGISTER_TRIAL, CLEAN_REGISTER, styleImageFor
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
export function rollIdFor(tag, generation, wall, arm, roll) {
  return createHash("sha256")
    .update(`${tag}|${generation}|${wall}|${arm}|${roll}`)
    .digest("hex").slice(0, 8);
}

/** Row 34's own ids, unchanged and still reproducible from this file — the
 *  suite recomputes every committed id through this exact call. */
export function rollId34(generation, wall, arm, roll) {
  return rollIdFor("row34", generation, wall, arm, roll);
}

const idRe = (tag) => new RegExp(`^${tag}-[0-9a-f]{8}\\.(png|prompt\\.txt)$`);

function gitCommit() {
  try {
    return execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { return null; }
}

/** What an arm attaches, said without a wall in hand. An arm whose attach list
 *  is a function of the WALL — the ruled style-image policy — declares it in
 *  words; every other arm's list is the same on every wall and is asked for. */
/** A trial with no generations still declares a budget, and it is declared in
 *  the shape the SCORER already reads — `row34_fitness.py`'s report prints
 *  `_budget.rolls_per_arm_per_wall` off the id map, and a trial that omitted it
 *  would take the scorer down on a KeyError after the images were spent. One
 *  shape, one reader, and the number itself comes from the declaration in
 *  `tools/evolution-arms.mjs` rather than from anything this file chooses. */
function declaredBudget(trial) {
  return {
    rolls_per_arm_per_wall: trial.rolls,
    walls: trial.walls.length,
    arms: trial.armsFor(1).length,
    declared_rolls: trial.exact_rolls,
    _authority: "tools/evolution-arms.mjs REGISTER_TRIAL, declared before anything was emitted",
    _one_generation: "This trial has no breeding and no second generation: it is a screen with a pre-committed wall set, and over and under are the same defect."
  };
}

function armImages(arm) {
  return arm.declared_images || arm.images();
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

/* ------------------------------------------------------------------ */
/* What a trial IS                                                     */
/* ------------------------------------------------------------------ */
/* ONE EMITTER, TWO TRIALS, AND THE SECOND ONE PROVED THE FIRST WAS A TRIAL.
 * Everything below `emit` was written for row 34 and every one of its parts is
 * general: cut this generation's images, compose every arm's prompt, write the
 * packets, write the id map before any candidate exists, and stop. What was
 * row-34-specific was the batch directory, the wall set, the roll count, the id
 * prefix, the budget and the reading lens — six values, now a descriptor.
 *
 * ROW 34's OWN PATH IS BYTE-FOR-BYTE WHAT IT WAS. Its ids come through
 * `rollId34`, which is still `sha256("row34|…")`; its budget clauses are still
 * its own; its committed artifacts are guaranteed by git and by
 * `evolution.spec.mjs`'s blob-immutability case either way. A second copy of
 * this emitter would have been the alternative, and a second copy is how the
 * detector configuration ends up varying by arm. */
const ROW34_TRIAL = {
  tag: "row34",
  row: 34,
  batch: BATCH,
  walls: PROBES,
  rolls: ROLLS_PER_ARM_PER_WALL,
  armsFor,
  control: CONTROL_ARM,
  genDir: (g) => `gen${g}`,
  assignName: (g) => (g === 1 ? "assignment.json" : `assignment-gen${g}.json`),
  manifestName: (g) => (g === 1 ? "manifest.json" : `manifest-gen${g}.json`),
  budget: BUDGET,
  lens: () => ({
    _spectrum: SPECTRUM, _register: REGISTER, _headline_pairing: HEADLINE_PAIRING,
    _amplification: AMPLIFICATION,
    _no_privileged_arm: "[HUMAN, 2026-08-24] \"Yeah but test my direction against our tests as well.\" v7 is the governing frame's own arm and it runs on terms byte-identical to every other arm: same rolls, same blind measurement, same pre-committed rules, same Holm family, no seat by name. The only standing entrant is the control, which is the yardstick and never a candidate for the crown."
  }),
  manifest_what: "The row-34 evolution run's order for one generation: two probe walls, their declared geometry and brackets, and every arm's packet. The measurement reads this file and assignment.json and nothing else.",
  probe_selection: "Both walls are from run-state.json's unfitted-horizon subset - camera PASS, horizon held - screened for corners and every bracket in frame, every stamped carrier in frame, and the fewest entries in the reading's own `_absent`. See design/specs/34-plan.md §2."
};

/* THE REGISTER TRIAL — Kabe's clean register against the register row 34 folded
 * into production. Six walls, three arms, one roll each: a SCREEN, and its own
 * `min_detectable_effect` is computed into the manifest before dispatch so the
 * run's weakness is a number rather than a discovery. The wall set, the arms
 * and the reading order are all declared in `tools/evolution-arms.mjs` and read
 * from there — an emitter that could choose its own arms is an emitter that
 * could quietly keep a losing one alive (row 34 §6, and it governs here). */
const REGISTER_TRIAL_SPEC = {
  tag: REGISTER_TRIAL.tag,
  row: null,
  batch: join(ROOT, REGISTER_TRIAL.batch),
  walls: REGISTER_TRIAL.walls,
  rolls: REGISTER_TRIAL.rolls_per_arm_per_wall,
  armsFor: () => REGISTER_TRIAL.arms,
  control: REGISTER_TRIAL.control,
  genDir: () => "gen1",
  assignName: () => "assignment.json",
  manifestName: () => "manifest.json",
  budget: null,
  exact_rolls: REGISTER_TRIAL.walls.length * REGISTER_TRIAL.arms.length *
    REGISTER_TRIAL.rolls_per_arm_per_wall,
  lens: () => ({
    _reading: CLEAN_REGISTER,
    _no_privileged_arm: REGISTER_TRIAL._no_privileged_arm,
    _the_confound: REGISTER_TRIAL._the_confound,
    _min_detectable_effect: minDetectableEffect(
      REGISTER_TRIAL.walls.length * REGISTER_TRIAL.rolls_per_arm_per_wall,
      REGISTER_TRIAL.walls.length * REGISTER_TRIAL.rolls_per_arm_per_wall,
      REGISTER_TRIAL.arms.length - 1, 0.10, 2)
  }),
  manifest_what: REGISTER_TRIAL._what_this_is,
  probe_selection: "Six walls, declared in tools/evolution-arms.mjs as REGISTER_WALLS with the fact that picked each: row 34's two probes unchanged so this trial can be read beside the generation-3 table, plus an interior wall with a fireplace and a doorway, the most carried wall in the house, a flight wall and the outdoor open facing - the four shapes the register changes that the two probes cannot exercise."
};

/**
 * The smallest arm-versus-control result that could clear the discipline, at
 * this n and this many comparisons.
 *
 * `row34_fitness.py`'s own function, in JavaScript, and it is here rather than
 * shelled out for one reason: it goes into the MANIFEST, which is written
 * before anything is dispatched, and the scorer that owns the python version
 * runs after. The two are checked against each other in the suite rather than
 * trusted to agree.
 */
export function minDetectableEffect(nA, nC, comparisons, alpha, marginMin) {
  const logFact = [0];
  for (let i = 1; i <= nA + nC + 1; i++) logFact.push(logFact[i - 1] + Math.log(i));
  const C = (n, k) => (k < 0 || k > n) ? 0 : Math.round(Math.exp(logFact[n] - logFact[k] - logFact[n - k]));
  const fisher = (a, c) => {
    const total = a + c, n = nA + nC;
    if (!n || !total || total === n) return 1;
    let num = 0;
    for (let x = a; x <= Math.min(nA, total); x++) {
      if (total - x >= 0 && total - x <= nC) num += C(nA, x) * C(nC, total - x);
    }
    return num / C(n, total);
  };
  const thresh = comparisons ? alpha / comparisons : alpha;
  let best = null;
  for (let c = 0; c <= nC; c++) {
    for (let a = 0; a <= nA; a++) {
      if (a - c < marginMin) continue;
      const pv = fisher(a, c);
      if (pv > thresh) continue;
      const key = [a - c, a];
      if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) {
        best = { key, out: { arm_admissible: a, arm_n: nA, control_admissible: c, control_n: nC,
          margin: a - c, fisher_p: Math.round(pv * 1e6) / 1e6,
          holm_tightest_threshold: Math.round(thresh * 1e6) / 1e6 } };
      }
    }
  }
  return best ? best.out : null;
}

async function emit(generation, trial = ROW34_TRIAL) {
  if (trial.budget && generation > trial.budget.generations_max) {
    throw new Error(`emit-evolution refused: generation ${generation} is past the declared ` +
      `maximum of ${trial.budget.generations_max} (design/specs/34-plan.md §3)`);
  }
  const ID_RE = idRe(trial.tag);
  const armIds = trial.armsFor(generation);
  const genDir = join(trial.batch, trial.genDir(generation));
  mkdirSync(genDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CANVAS_W, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  const walls = [];
  const rolls = [];
  for (const probe of trial.walls) {
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
      row: trial.row, trial: trial.tag, generation, wall: key,
      why_this_wall: probe.why,
      held_best_sigma_px: probe.held_sigma_px === undefined ? null : probe.held_sigma_px,
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

    /* ---- the style image the ruling allows, if any ---- */
    /* [HUMAN, 2026-08-24] "So why do we give it the reference image of the
     * study? I think it biases it too much." Image 1 is never a wall from
     * another room: an arm that asks for a style reference gets this room's own
     * agreeing majority wall or nothing at all. It is cut into the wall's own
     * directory under the name the arm asks for, so the copy below stays one
     * rule for every image an arm names. */
    const style = styleImageFor(ctx.loc, ctx.facing);
    if (style) copyFileSync(join(ROOT, style.file), join(dir, style.name));

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
      for (let n = 1; n <= trial.rolls; n++) {
        const id = rollIdFor(trial.tag, generation, key, armId, n);
        const rec = {
          id, generation, wall: key, arm: armId, roll: n,
          candidate: `${srcDir}/${trial.tag}-${id}.png`,
          prompt: `${srcDir}/${trial.tag}-${id}.prompt.txt`
        };
        for (const f of [`${trial.tag}-${id}.png`, `${trial.tag}-${id}.prompt.txt`]) {
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
      writeFileSync(join(armDir, "PACKET.md"),
        packetMd(key, arm, ids, ctx, generation, style));
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
      style_image: style
        ? { key: style.key, file: style.file, name: style.name, why: style.why }
        : { key: null, why: "[HUMAN, 2026-08-24] Image 1 is never a wall from another room, and room_consistency.json names no agreeing majority wall this room could lend - so the arms that follow the ruling attach no style image here and the medium is in their words" },
      sidecar_sha256: sha256File(join(dir, "sidecar.json"))
    });
    console.log(`  ${key.padEnd(20)} ${ctx.rects.length} carrier(s)  ` +
      `${armIds.length} arms x ${trial.rolls} roll(s)  ` +
      `style ${style ? style.key : "none"}`);
  }
  await browser.close();

  /* THE BUDGET IS A CEILING FOR A BRED GENERATION AND AN EXACT COUNT FOR THE
   * DECLARED ONE. Generation 1's seven arms are written into the plan, so a
   * different number there is a bug. A later generation's arm set comes out of
   * the breeding, and branch B can honestly come in UNDER when the leaders are
   * near-identical and their crossings are already in the pool — plan §6 says
   * under is fine and over is refused, and this is that sentence. */
  if (!trial.budget) {
    /* A TRIAL WITH NO GENERATIONS DECLARES ONE NUMBER AND MEETS IT EXACTLY.
     * There is nothing to breed and nothing to carry forward, so over and under
     * are the same defect: the count was declared before dispatch and this is
     * where it is held to. */
    if (rolls.length !== trial.exact_rolls) {
      throw new Error(`emit-evolution refused: ${rolls.length} rolls against a declared ` +
        `${trial.exact_rolls} for the ${trial.tag} trial`);
    }
  } else {
  const ceiling = trial.budget.images_per_screening_generation;
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
    const p = join(trial.batch, trial.assignName(g));
    if (existsSync(p)) spent += JSON.parse(readFileSync(p, "utf8")).rolls.length;
  }
  if (spent > trial.budget.total_worst_case) {
    throw new Error(`emit-evolution refused: ${spent} rolls across the row against a declared ` +
      `total of ${trial.budget.total_worst_case} (design/specs/34-plan.md §3). A generation may ` +
      "move its own line; the total is what was declared before dispatch and it does not move.");
  }
  console.log(`  budget      ${spent} of ${trial.budget.total_worst_case} declared, across the row`);
  }

  /* ---- the id map, committed before any candidate exists ---- */
  const assignPath = join(trial.batch, trial.assignName(generation));
  writeFileSync(assignPath, JSON.stringify({
    _what_this_is: "The row-34 evolution's id map: which opaque return id belongs to which arm, wall and roll. Committed BEFORE any candidate is measured and never edited afterwards - evolution.spec.mjs finds its introducing commit with `git log --diff-filter=A` and asserts that commit's blob equals the current one.",
    _why_opaque: "A return path carrying its arm would tell a measuring hand which condition it is looking at. What actually carries the blinding is that the detector configuration is a function of the WALL's declared geometry, so it cannot vary by arm even in principle; the opaque id keeps the arm out of the path as well. The id is reproducible from tools/emit-evolution.mjs and is not cryptographic, which is said here rather than implied.",
    _what_it_cannot_blind: "the generating hand, which is holding the packet and knows which arm it is running. That is inherent and is not claimed away.",
    _budget: trial.budget || declaredBudget(trial),
    _generation: generation,
    _arms: armIds.map((id) => ({ id, name: ARMS[id].name, channels: ARMS[id].channels,
      images: armImages(ARMS[id]), what: ARMS[id].what })),
    _control: trial.control,
    ...trial.lens(armIds),
    _generated: new Date().toISOString().slice(0, 10),
    rolls
  }, null, 2) + "\n");

  const manifest = {
    _what_this_is: trial.manifest_what,
    _dispatch: "NOT DISPATCHED. Dispatch is the Navigator's act; this tool cuts packets and stops.",
    _sweep_independence: "This run never opens design/batches/row23-scaffold/manor/{manifest,run-state,retries}.json, never promotes, never bakes and never publishes. The manor sweep is symmetrically blind to it: its arrival scan matches ^row23-[0-9a-f]{8}\\.png$ and it walks its own manifest's rolls.",
    _probe_selection: trial.probe_selection,
    row: trial.row, trial: trial.tag, generation,
    budget: trial.budget || declaredBudget(trial),
    ...trial.lens(armIds),
    walls,
    arms: armIds.map((id) => ({ id, name: ARMS[id].name, what: ARMS[id].what,
      channels: ARMS[id].channels, images: armImages(ARMS[id]) })),
    control: trial.control,
    rolls_per_arm_per_wall: trial.rolls,
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
  const manifestPath = join(trial.batch, trial.manifestName(generation));
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

function packetMd(key, arm, ids, ctx, generation, style) {
  const imgs = arm.images(ctx);
  return `# Packet — ${key}, arm ${arm.id} (${arm.name})

${arm.what}

**Generate ${ids.length} image${ids.length > 1 ? "s" : ""}. Save ${ids.length > 1 ? "each" : "it"} to the exact path in the table.** The measurement runs the
moment a file appears at one of those paths, so a return in the right place under the wrong name
costs a roll.

## Attach, in this order

${imgs.map((f, i) => `${i + 1}. \`${f}\` — **Image ${i + 1}**${
  f === "style-seed-warm.png"
    ? " — the style reference, Kabe's approved seed (\"Warm\", `design/approvals.log`, 2026-08-21)"
    : f === "scaffold.png" ? " — the annotated layout scaffold"
      : (style && f === style.name)
        ? ` — **${style.key}**, this room's own already-painted wall: ${style.why}`
        : " — the layout as black-ink line art"}`).join("\n")}
${imgs.length === 1 ? `\n**There is no style image, and that is not an omission.** [HUMAN, 2026-08-24] "So why do we give it the reference image of the study? I think it biases it too much." Image 1 is never a wall from another room, this room has no agreeing majority wall to lend, and the medium is in the prompt's own words. Attach the one image above as **Image 1**.\n` : ""}
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
  const trial = argv.includes("--register-trial") ? REGISTER_TRIAL_SPEC : ROW34_TRIAL;
  emit(generation, trial).catch((e) => { console.error(e); process.exit(1); });
}
