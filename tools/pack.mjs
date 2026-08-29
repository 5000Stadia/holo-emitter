/* pack.mjs — the location, as data. The engine's one door onto a world.
 *
 * WHY THIS FILE EXISTS. `design/production-law.md` clause 8, adopted 2026-08-28
 * from the method audit on Kabe's ruling: "the theme never bleeds into the
 * code". Before this file the manor lived IN the engine — the chair-rail's
 * 0.95 m in `make-scaffold.mjs`, the room voices in `room-voices.mjs`, the era
 * and medium sentences in `frame-language.mjs`, the refusal word lists in
 * `prompt_lint.py`, and `fixtures/demo-study/plan.json` typed as a default in
 * nine places. `packs/INVENTORY.md` counts them: 957 grep hits, 619 of them in
 * code. A second location could not be built without editing all of it.
 *
 * So a location is a PACK — a directory of four files under `packs/<name>/`:
 *
 *   pack.json    names the pack and its three files
 *   plan.json    the rooms, facings and openings (what the plan always was)
 *   voices.json  the voice table, the anchors, MATERIALS, SAID_BEFORE — the
 *                world's materials in the world's own language
 *   world.json   the era sentence, the medium sentence, THE RULER (its kind and
 *                its height), the window sill/head conventions, the refusal
 *                word lists, and the batch / fixture / store directories
 *
 * WHAT THIS FILE REFUSES, and why each refusal is here rather than downstream:
 *
 *   1. A PACK WITH NO RULER. Every instrument in `design/plan-draft/measured/`
 *      converts pixels to metres by dividing a measured horizontal by the
 *      ruler's height. A pack that declares no ruler is not a location that
 *      measures badly — it is a location that cannot be measured at all, and
 *      the honest moment to say so is before an image is asked for. Row 44's
 *      acceptance names this refusal explicitly.
 *   2. A ROOM WITH NO VOICE, BY NAME. The manor's own first walk is the reason
 *      (`room-voices.mjs`'s header): a scullery fell through a table's default
 *      and was painted like a parlour. A default voice is how one world's
 *      materials reach another world's room, so an unresolvable room refuses
 *      the pack and the refusal says which room.
 *   3. A VOICE NAMING AN ANCHOR THE PACK DOES NOT DEFINE. Same class: the
 *      scaffold would stamp a ruler the gate is not measuring.
 *
 * WHICH PACK IS ACTIVE. `--pack <name>` on the command line, else `HOLO_PACK`
 * in the environment, else `manor` — the default is deliberate and temporary:
 * every caller in the tree used to mean the manor implicitly, and keeping that
 * meaning is what let step 0 prove itself byte-identically before it moved
 * anything else.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PACKS_DIR = join(ROOT, "packs");

/** The default, for as long as every caller means the manor when it says
 *  nothing. Not a fallback for an unknown name — an unknown name refuses. */
export const DEFAULT_PACK = "manor";

/**
 * Which pack this process is running. `--pack <name>` / `--pack=<name>` wins,
 * then `HOLO_PACK`, then the default.
 */
export function activePackName(argv = process.argv, env = process.env) {
  const i = argv.indexOf("--pack");
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const eq = argv.find((a) => typeof a === "string" && a.startsWith("--pack="));
  if (eq) return eq.slice("--pack=".length);
  if (env && env.HOLO_PACK) return env.HOLO_PACK;
  /* A FIXTURE KNOWS ITS PACK. `derive-world.mjs` writes `<fixture>/pack.ref`;
   * a tool given `--fixture-dir` (the bake, the plan validator, the suite's
   * staleness cases, none of which are told a pack) is working on that pack. */
  const f = argv.indexOf("--fixture-dir");
  if (f >= 0 && argv[f + 1]) {
    try {
      const ref = readFileSync(join(argv[f + 1], "pack.ref"), "utf8").trim();
      if (ref) return ref;
    } catch (ignored) { /* no pack.ref: the default stands */ }
  }
  return DEFAULT_PACK;
}

const CACHE = new Map();

function refuse(name, msg) {
  throw new Error(`pack \`${name}\`: ${msg}`);
}

function readJson(name, path, what) {
  if (!existsSync(path)) refuse(name, `${what} is missing — \`${path}\` does not exist`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    refuse(name, `${what} at \`${path}\` is not readable JSON: ${e.message}`);
  }
}

/** A path in a pack's own files, resolved against the repo root. */
function underRoot(p) {
  if (isAbsolute(p)) return p;
  /* A STAGED COPY OF THE TOOLS (the suite copies index.html/src/fixtures/tools/
   * packs into a scratch tree and runs them with cwd = the repo) has no design/
   * or backdrops/ of its own: a pack path that does not exist under this file's
   * root but does under the working directory is the working directory's. */
  const here = resolve(ROOT, p);
  if (existsSync(here)) return here;
  const cwd = resolve(process.cwd(), p);
  return existsSync(cwd) ? cwd : here;
}

/**
 * Load a pack, validated. Returns
 *
 *   { name, dir, files, plan, voices, world, paths, ruler, anchorFor(voiceId) }
 *
 * and throws with the pack and the offending room/voice named on any of the
 * three refusals in the header. Cached per name: the pack is data on disk and
 * a run reads it once.
 */
export function loadPack(name = activePackName()) {
  if (CACHE.has(name)) return CACHE.get(name);
  const dir = join(PACKS_DIR, name);
  if (!existsSync(dir)) {
    const have = existsSync(PACKS_DIR)
      ? readdirSync(PACKS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory()).map((d) => d.name).sort()
      : [];
    refuse(name, `there is no such pack. \`packs/\` holds: ${have.join(", ") || "(none)"}`);
  }
  const manifest = readJson(name, join(dir, "pack.json"), "pack.json");
  const files = manifest.files || {};
  for (const k of ["plan", "voices", "world"]) {
    if (!files[k]) refuse(name, `pack.json names no \`${k}\` file — a pack is plan.json, voices.json and world.json, and all three are required`);
  }
  const plan = readJson(name, join(dir, files.plan), "plan.json");
  const voices = readJson(name, join(dir, files.voices), "voices.json");
  const world = readJson(name, join(dir, files.world), "world.json");

  /* ── Refusal 1: the ruler ─────────────────────────────────────────── */
  const ruler = world.ruler;
  if (!ruler || typeof ruler !== "object") {
    refuse(name, "world.json declares no `ruler`. Every instrument converts pixels to metres by " +
      "dividing a measured horizontal by the ruler's height, so a pack with no ruler is not a " +
      "location that measures badly — it is one that cannot be measured at all. Declare " +
      "`ruler: { kind, height_m }` naming a continuous horizontal the painter will draw and the " +
      "instrument can find.");
  }
  if (!ruler.kind) refuse(name, "world.json's `ruler` names no `kind` — the anchor id it points at in voices.json");
  if (typeof ruler.height_m !== "number" || !(ruler.height_m > 0)) {
    refuse(name, `world.json's ruler declares height_m \`${ruler.height_m}\`, which is not a positive number of metres`);
  }
  const ANCHORS = voices.ANCHORS || {};
  if (!ANCHORS[ruler.kind]) {
    refuse(name, `world.json rules the anchor \`${ruler.kind}\` and voices.json does not define it — ` +
      `it holds: ${Object.keys(ANCHORS).join(", ") || "(no anchors at all)"}`);
  }

  /* ── Refusal 3: a voice naming an anchor that does not exist ───────── */
  const VOICES = voices.VOICES || {};
  if (!Object.keys(VOICES).length) refuse(name, "voices.json defines no voices at all");
  for (const [id, v] of Object.entries(VOICES)) {
    if (!v.anchor) refuse(name, `voice \`${id}\` names no anchor`);
    if (!ANCHORS[v.anchor]) {
      refuse(name, `voice \`${id}\` names anchor \`${v.anchor}\`, which voices.json does not define`);
    }
  }

  /* ── Refusal 2: a room with no voice, BY NAME ─────────────────────── */
  const ROOM_VOICE = voices.ROOM_VOICE || {};
  const ARCH = voices.ARCHETYPE_FALLBACK || {};
  const TYPE = voices.TYPE_FALLBACK || {};
  const OPEN_VOICE = voices.OPEN_FACING_VOICE;
  for (const room of plan.rooms || []) {
    const facings = Object.keys(room.facings || {});
    /* A room every one of whose facings is `open` resolves through the open
     * voice; anything else must resolve as a room. */
    const needsRoomVoice = facings.some((f) => (room.facings[f] || {}).type !== "open");
    if (!needsRoomVoice) {
      if (!OPEN_VOICE || !VOICES[OPEN_VOICE]) {
        refuse(name, `room \`${room.id}\` is open on every facing and voices.json names no ` +
          `\`OPEN_FACING_VOICE\` for a wall line with nothing built at it`);
      }
      continue;
    }
    const id = ROOM_VOICE[room.id] || ARCH[room.archetype] || TYPE[room.type];
    if (!id) {
      refuse(name, `room \`${room.id}\` resolves to no voice — its id is not in ROOM_VOICE, its ` +
        `archetype \`${room.archetype}\` is not in ARCHETYPE_FALLBACK and its type \`${room.type}\` ` +
        `is not in TYPE_FALLBACK. Give it a voice in this pack's own language with its ` +
        `justification; a room never silently becomes another world's room.`);
    }
    if (!VOICES[id]) {
      refuse(name, `room \`${room.id}\` resolves to voice \`${id}\`, which voices.json does not define`);
    }
  }

  const p = world.paths || {};
  const paths = {
    plan: join(dir, files.plan),
    batch_dir: p.batch_dir ? underRoot(p.batch_dir) : null,
    fixture_dir: p.fixture_dir ? underRoot(p.fixture_dir) : null,
    store_dir: p.store_dir ? underRoot(p.store_dir) : null,
    readings_dir: p.readings_dir ? underRoot(p.readings_dir) : null,
    world_query: p.world_query || null
  };

  const pack = { name, dir, files, plan, voices, world, paths, ruler };
  CACHE.set(name, pack);
  return pack;
}

/** The active pack, loaded once. The common case in every tool. */
export function activePack() {
  return loadPack(activePackName());
}

/** Drop the cache. Only tests that load several packs in one process need this. */
export function _resetPackCache() {
  CACHE.clear();
}
