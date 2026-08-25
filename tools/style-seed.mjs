/**
 * THE STYLE SEED — Image 1, derived, carrying FABRIC and never ARCHITECTURE.
 *
 *     node tools/style-seed.mjs --wall servants_hall/N
 *     node tools/style-seed.mjs --check
 *     node tools/style-seed.mjs --refresh
 *
 * [row 40, Kabe's ruling] Image 1 is never a wall from another room; it is this
 * room's own agreeing wall or nothing. [row 42] The room's LEAD is painted first
 * so the other three can be painted with it in front of the painter. Both rows
 * are about WHICH picture. This file is about WHAT IS IN IT.
 *
 * THE FINDING THIS ROW IS BUILT ON, 2026-08-25. `servants_hall/E` was asked for a
 * stone fireplace at the centre of the wall and one three-light window left of
 * it. The return came back with TWO DOORWAYS and no window and no hearth — and
 * the room's other walls carry doorways. The register had already said, in as
 * many words, that Image 1 "is the reference for this room's materials, its paint
 * medium, its palette and its light, and for nothing else: how many openings this
 * wall carries, where they stand and every dimension of them come from Image 2
 * and the words below." The painter took the architecture anyway.
 *
 * That is row 40's own finding — the study seed that put fielded wainscot in an
 * outdoor garden and armorial glass in seven plain-glass windows — wearing a new
 * coat. The lesson is the one Kabe stated then ("I think it biases it too much")
 * and it generalises past the room boundary: AN IMAGE REFERENCE CARRIES
 * EVERYTHING IN IT. A sentence that tells a painter to take half a photograph is
 * a sentence arguing with a photograph, and over 88 packets the photograph wins
 * often enough to be the thing that decides what gets painted.
 *
 * SO THE ANSWER IS NOT A BETTER SENTENCE. It is an Image 1 that HAS no
 * architecture in it: the room's own wall, its openings and carriers filled in
 * with that wall's own adjacent fabric, its floor and its ceiling untouched.
 * `tools/style-seed.py` does the pixels and states its method; this file decides
 * which wall, gathers what the plan says stands on it, and keeps the derived
 * seeds in `backdrops/style-seeds/` with a report beside each one.
 *
 * WHAT MAKES A SEED TRUSTWORTHY, and it is not this file's word for it:
 * `door_measure` and `window_measure` — the project's own instruments, the ones
 * the promotion refuses on — are run again on the filled picture, and the seed is
 * only written where nothing they read stands anywhere the fill touched AND they
 * read no more openings than the painting had. (`style-seed.py`'s `verify` says
 * why that is the right pair of conditions and which wall taught it.) A wall
 * whose architecture cannot be removed to their satisfaction produces no seed,
 * the packet gets no Image 1, and the medium goes in words — which is row 40's
 * own safe answer and was already the common case.
 *
 * THE DERIVED SEED IS A DERIVED ARTIFACT and is registered as one
 * (`design/plan-draft/measured/derived.py`, `style_seeds`): it goes stale when the
 * wall it was cut from is re-promoted or superseded, and when this file or the
 * python tool beside it changes.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { facingCarriers, flightsForFacing } from "./plan-projection.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "..");
const TOOL = join(ROOT, "tools", "style-seed.py");
const READINGS = join(ROOT, "design", "plan-draft", "measured", "manor");
export const SEED_DIR = "backdrops/style-seeds";
const CANVAS_W = 1536;

/* §11's ruled door opening height and the scaffold's own vertical conventions.
 * They are `make-scaffold.mjs`'s and are imported through it rather than
 * retyped, so a carrier's band in the seed is the band the scaffold drew and
 * the ask named. */
export const BANDS = {
  door: [0, 2.00],
  fireplace: [0, 1.60],
  window: [0.90, 2.00]
};

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** Where a wall's derived seed and its fill report live. */
export function seedPaths(key) {
  const [loc, f] = key.split("/");
  return { png: `${SEED_DIR}/${loc}-${f}.png`, report: `${SEED_DIR}/${loc}-${f}.json` };
}

/** What the seed was derived FROM, digested — this file, the python beside it,
 *  and the painting. A change to any of the three stales the seed, which is the
 *  same rule `derived.py` applies to every other generated artifact: a change to
 *  the instrument stales its output exactly as a change to the store does. */
export function toolDigest(root = ROOT) {
  return createHash("sha256")
    .update(readFileSync(join(root, "tools", "style-seed.py")))
    .update(readFileSync(join(root, "tools", "style-seed.mjs")))
    .digest("hex");
}

/* ------------------------------------------------------------------ */
/* The meta of the wall being cut FROM                                 */
/* ------------------------------------------------------------------ */
/* A promoted wall carries its own §5 meta beside it. A row-42 lead does not —
 * it is a candidate the sweep has not admitted — but its READING is on disk
 * under the roll id, and `metaFromReading` is the same recipe
 * `promote-backdrop.mjs` writes the promoted meta with. So a candidate lead can
 * be cut from too, and where neither exists the seed is refused rather than
 * guessed at: a seed cut with the wrong corners fills the wrong rectangle, and
 * a style image with an opening left in it is the whole defect this file exists
 * to remove. */
function metaFor(plan, key, rel, root, metaFromReading) {
  const [loc, f] = key.split("/");
  const promoted = join(root, "backdrops", loc, `${f}.meta.json`);
  if (rel === `backdrops/${loc}/${f}.png` && existsSync(promoted)) {
    return { meta: JSON.parse(readFileSync(promoted, "utf8")), via: promoted.slice(root.length + 1) };
  }
  const id = (rel.match(/row\d+-([0-9a-f]{8})\.png$/) || [])[1];
  const reading = id ? join(READINGS, `${id}.json`) : null;
  if (reading && existsSync(reading) && metaFromReading) {
    const r = JSON.parse(readFileSync(reading, "utf8"));
    try {
      return { meta: metaFromReading(r, plan, loc, f), via: reading.slice(root.length + 1) };
    } catch (e) {
      return { meta: null, why: `its reading cannot be turned into a meta: ${e.message}` };
    }
  }
  if (existsSync(promoted)) {
    /* The candidate is a different roll of a wall that IS promoted. Its own
     * reading is what says where its corners are, and borrowing the promoted
     * wall's would put the rectangles on the wrong pixels. */
    return { meta: null, why: `no reading is on disk for ${rel}, and the promoted wall's meta describes a different roll` };
  }
  return { meta: null, why: `neither a promoted meta nor a reading exists for ${key}` };
}

/* ------------------------------------------------------------------ */
/* The job                                                             */
/* ------------------------------------------------------------------ */

/** Everything the plan says stands on this wall, in the plan's own metres. */
export function carriersFor(plan, key, meta) {
  const [loc, f] = key.split("/");
  const out = [];
  for (const c of facingCarriers(plan, loc, f)) {
    const band = BANDS[c.kind];
    if (!band) continue;                    // an open edge is not a carrier to fill
    out.push({
      kind: c.kind, id: c.id, from_m: c.from_m, to_m: c.to_m,
      h0_m: band[0], h1_m: band[1],
      origin: "tools/plan-projection.mjs facingCarriers, at the scaffold's own band"
    });
  }
  const flights = meta
    ? flightsForFacing(plan, loc, f, meta, CANVAS_W).map((s) => ({
      id: s.id, x: s.x, y: s.y, w: s.w, h: s.h,
      origin: "tools/plan-projection.mjs flightsForFacing"
    }))
    : [];
  return { carriers: out, flights };
}

/**
 * Derive (or reuse) the style seed for one wall.
 *
 * Returns `{ ok, png, report, record, why }`. `ok: false` is a normal answer and
 * carries the reason in `why`; the caller's job then is to attach no Image 1.
 */
export function deriveStyleSeed(plan, key, opts = {}) {
  const root = opts.root || ROOT;
  const [loc, f] = key.split("/");
  const rel = opts.rel || `backdrops/${loc}/${f}.png`;
  const src = join(root, rel);
  const paths = seedPaths(key);
  const outPng = join(root, paths.png);
  const outRep = join(root, paths.report);
  if (!existsSync(src)) return { ok: false, why: `there is no painting at ${rel}` };
  const srcSha = sha(src);
  const tool = toolDigest(root);

  /* REUSE ONLY WHERE THE REPORT PROVES IT. Same painting, same tool, same wall —
   * anything else and the seed is re-cut, because a style image that is one
   * promotion behind its own wall is a picture of a room that no longer exists. */
  if (!opts.force && existsSync(outPng) && existsSync(outRep)) {
    try {
      const rec = JSON.parse(readFileSync(outRep, "utf8"));
      if (rec.source === rel && rec.source_sha256 === srcSha &&
          rec.tool_sha256 === tool && rec.sha256 === sha(outPng)) {
        return { ok: true, png: paths.png, report: paths.report, record: rec, reused: true };
      }
    } catch { /* an unreadable report is a report to replace */ }
  }

  const refuse = (w) => ({ ok: false, why: w, retired: retireSeed(root, paths, rel) });

  const { meta, via, why } = metaFor(plan, key, rel, root, opts.metaFromReading);
  if (!meta) return refuse(why);
  const room = (plan.rooms || []).find((r) => r.id === loc);
  const fc = room ? (room.facings || {})[f] : null;
  if (!fc) return refuse(`the plan has no facing ${key}`);
  if (fc.type === "open" || (room && room.type === "open")) {
    return refuse(`${key} is an OPEN facing — there is no wall there to fill an opening into, and an outdoor picture is not a room's fabric`);
  }
  const { carriers, flights } = carriersFor(plan, key, meta);

  const job = {
    key, source: rel, source_kind: opts.source_kind || "promoted",
    meta_from: via, meta, wall_width_m: fc.wall_width_m,
    carriers, flights
  };
  /* THE JOB FILE LIVES OUTSIDE THE STORE, and that is not tidiness. It began as
   * a dotfile inside `backdrops/style-seeds/`; `staleSeeds` reads every `.json`
   * in there, and a suite running two cases at once caught one mid-write and
   * called the whole store stale — a freshness check failing on a file that was
   * never an artifact. Nothing but seeds and their reports may live in the
   * store. */
  mkdirSync(join(root, SEED_DIR), { recursive: true });
  const tmp = join(mkdtempSync(join(tmpdir(), "holo-style-seed-")), `${loc}-${f}.job.json`);
  writeFileSync(tmp, JSON.stringify(job));
  let text, failed = null;
  try {
    text = execFileSync("python3", [TOOL, tmp, outPng], { encoding: "utf8" });
  } catch (e) {
    text = (e.stdout || "").toString();
    failed = e;
  } finally {
    rmSync(dirname(tmp), { recursive: true, force: true });
  }
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* the refusal is below */ }
  if (!parsed || parsed.refused || failed) {
    return { ...refuse((parsed && parsed.refused) ||
      `style-seed.py failed for ${key}: ${(failed && failed.message) || "no JSON came back"}`),
    record: parsed && parsed.report };
  }
  /* The tool wrote the report; this file adds the one fact only it knows — what
   * the tool ITSELF was when the seed was cut. */
  parsed.tool_sha256 = tool;
  parsed.meta_from = via;
  writeFileSync(outRep, JSON.stringify(parsed, null, 2) + "\n");
  return { ok: true, png: paths.png, report: paths.report, record: parsed };
}

/* ------------------------------------------------------------------ */
/* Freshness, for `derived.py` and for a human                          */
/* ------------------------------------------------------------------ */

/** A seed that can no longer be derived may not stand in the store.
 *
 *  It is the same rule as the freshness check one step on: a stale seed is a
 *  picture of a room that no longer exists, and a seed whose wall the tool now
 *  REFUSES is a picture the tool would not make. `stair_landing/N` is the case —
 *  it had a seed until the flight rule landed, and leaving it would have left the
 *  store permanently stale, since every regen would refuse and the file would
 *  never move. Only a seed cut from the very source we just failed on is removed,
 *  so a candidate lead's refusal cannot take a promoted wall's seed with it. */
function retireSeed(root, paths, rel) {
  const rep = join(root, paths.report);
  if (!existsSync(rep)) return null;
  try {
    const rec = JSON.parse(readFileSync(rep, "utf8"));
    if (rec.source !== rel) return null;
  } catch { /* an unreadable report is one to retire */ }
  rmSync(rep, { force: true });
  rmSync(join(root, paths.png), { force: true });
  return paths.png;
}

/** Every seed on disk that no longer answers to what it was cut from. */
export function staleSeeds(root = ROOT) {
  const dir = join(root, SEED_DIR);
  if (!existsSync(dir)) return [];
  const tool = toolDigest(root);
  const bad = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    const p = join(dir, name);
    const key = name.replace(/\.json$/, "").replace("-", "/");
    let rec;
    try { rec = JSON.parse(readFileSync(p, "utf8")); }
    catch { bad.push([`${SEED_DIR}/${name}`, "its report cannot be read"]); continue; }
    const png = join(root, rec.out || `${SEED_DIR}/${name.replace(/\.json$/, ".png")}`);
    if (!existsSync(png)) { bad.push([rec.out, "the seed it describes is not on disk"]); continue; }
    const src = join(root, rec.source || "");
    if (!rec.source || !existsSync(src)) {
      bad.push([rec.out, `the wall it was cut from (${rec.source}) is gone — a re-promotion moves it`]);
      continue;
    }
    if (sha(src) !== rec.source_sha256) {
      bad.push([rec.out, `${rec.source} has been repainted under it (${String(rec.source_sha256).slice(0, 12)} -> ${sha(src).slice(0, 12)})`]);
      continue;
    }
    if (rec.tool_sha256 !== tool) {
      bad.push([rec.out, "the tool that cut it has changed, so it is no longer what that tool produces"]);
      continue;
    }
    if (sha(png) !== rec.sha256) {
      bad.push([rec.out, "the seed has been edited since it was derived"]);
      continue;
    }
    void key;
  }
  return bad;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

/* NO TOP-LEVEL AWAIT HERE, and the reason is a deadlock this file hit on its
 * first run. `make-scaffold.mjs` imports this module statically; this module's
 * CLI needs `metaFromReading` back out of it, which is a cycle. Awaited at the
 * top level the cycle never settles — node reports "unsettled top-level await"
 * and the process exits having printed nothing — because make-scaffold cannot
 * finish evaluating until this module's body does. Deferred into a `.then`, this
 * module's body completes first, make-scaffold's static import of it resolves,
 * and the dynamic import lands. */
function cli(metaFromReading) {
  const argv = process.argv.slice(2);
  const argOf = (flag, d = null) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));

  if (argv.includes("--check")) {
    const bad = staleSeeds();
    for (const [p, w] of bad) console.log(`STALE ${p} — ${w}`);
    console.log(bad.length ? `${bad.length} stale` : "every derived style seed is fresh");
    process.exit(bad.length ? 1 : 0);
  }
  const walls = argv.reduce((a, x, i) => (x === "--wall" ? a.concat(argv[i + 1]) : a), []);
  if (argv.includes("--refresh")) {
    const dir = join(ROOT, SEED_DIR);
    if (existsSync(dir)) {
      for (const n of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
        const rec = JSON.parse(readFileSync(join(dir, n), "utf8"));
        if (rec.key && !walls.includes(rec.key)) walls.push(rec.key);
      }
    }
  }
  if (!walls.length) {
    console.error("style-seed: name a wall with --wall <loc>/<F>, or --refresh, or --check");
    process.exit(1);
  }
  let bad = 0;
  for (const key of walls) {
    const src = argOf("--from") || undefined;
    const r = deriveStyleSeed(plan, key, { rel: src, metaFromReading, force: argv.includes("--force") });
    if (r.ok) {
      console.log(`${key} -> ${r.png}${r.reused ? " (already fresh)" : ""}` +
        (r.record ? ` — ${r.record.rects.length} rect(s), ${r.record.masked_pct_of_wall} % of the wall filled; ${r.record.verified}` : ""));
    } else {
      bad += 1;
      console.log(`${key} — NO SEED: ${r.why}` +
        (r.retired ? ` (retired ${r.retired}, which this tool would no longer make)` : ""));
    }
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  import("./make-scaffold.mjs")
    .then((m) => cli(m.metaFromReading))
    .catch((e) => { console.error(`style-seed: ${e.message}`); process.exit(1); });
}
