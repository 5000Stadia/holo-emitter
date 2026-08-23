/* The pipeline's stopwatch — the node half of the writer. [Row 33]
 *
 * The record shape, the atomicity argument, the marker rule and the
 * `HOLO_TIMINGS` override all have one home and it is
 * `design/plan-draft/measured/timings.py`'s header. This file is the same
 * writer for the half of the pipeline that runs in node; it writes the same
 * lines to the same ledger, and the two are used together in one run (the sweep
 * is python and calls the bakes, which are node).
 *
 * The one thing worth repeating here, because it is a node-specific hazard:
 * `writeFileSync(path, line, {flag: "a"})` opens with O_APPEND and issues ONE
 * write for a string this small, which is what makes concurrent writers safe.
 * Do not replace it with a stream, an `appendFile` chain or two calls — a
 * second write is a second chance to interleave.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/** The ledger's one home, shared with the python writer by path, not by copy. */
export const DEFAULT_LEDGER =
  join(root, "design", "plan-draft", "measured", "timings.jsonl");

/** A single write() is atomic under O_APPEND up to PIPE_BUF bytes. */
export const PIPE_BUF = 4096;

export function ledgerPath() {
  const env = process.env.HOLO_TIMINGS;
  if (env === undefined || env === "") return DEFAULT_LEDGER;
  if (env === "off") return null;
  return env;
}

/* NO REPLACER ARRAY. `JSON.stringify(o, keys)` filters EVERY object in the
 * tree, including `detail`, so the obvious way to get stable key order would
 * quietly delete the notes. The record is built in a fixed insertion order
 * instead, which stringify preserves. */
function lineFor(rec) {
  let line = JSON.stringify(rec) + "\n";
  if (Buffer.byteLength(line, "utf8") <= PIPE_BUF) return line;
  const small = { ...rec, detail: { _truncated:
    `detail dropped: the record did not fit in one atomic write (${Buffer.byteLength(line, "utf8")} bytes)` } };
  line = JSON.stringify(small) + "\n";
  if (Buffer.byteLength(line, "utf8") <= PIPE_BUF) return line;
  const tiny = { ...small, key: null,
    detail: { _truncated: "detail and key dropped to fit one atomic write" } };
  return JSON.stringify(tiny) + "\n";
}

/** Append one step event. Never throws. */
export function record(step, tsStart, tsEnd, key = null, detail = null,
                       { backfilled = false, path = null } = {}) {
  const p = path !== null ? path : ledgerPath();
  if (p === null) return null;
  let end = tsEnd;
  if (!backfilled && end <= tsStart) end = tsStart + 1e-6;   // a live step is never a marker
  const rec = {
    ts_start: Math.round(tsStart * 1e6) / 1e6,
    ts_end: Math.round(end * 1e6) / 1e6,
    step: String(step), key: key ?? null, detail: detail || {}
  };
  if (backfilled) rec.backfilled = true;
  try {
    const d = dirname(p);
    if (d) mkdirSync(d, { recursive: true });
    writeFileSync(p, lineFor(rec), { flag: "a" });
  } catch (e) {
    process.stderr.write(
      `timings: could not write ${p} (${e && e.message}) — the step ran, the clock did not\n`);
  }
  return rec;
}

/* Wall-clock epoch seconds at sub-millisecond resolution: `Date.now()` is
 * whole milliseconds, and a bake that takes 0.4 ms would round to a marker. */
const now = () => (performance.timeOrigin + performance.now()) / 1000;

/** Time a synchronous block. The block's own return value comes back. */
export function step(name, key, fn, detail = {}) {
  const t0 = now();
  const d = { ...detail };
  try {
    return fn(d);
  } catch (e) {
    d.error = String((e && e.message) || e);
    throw e;
  } finally {
    record(name, t0, now(), key, d);
  }
}

/** Time an async block. Same contract. */
export async function stepAsync(name, key, fn, detail = {}) {
  const t0 = now();
  const d = { ...detail };
  try {
    return await fn(d);
  } catch (e) {
    d.error = String((e && e.message) || e);
    throw e;
  } finally {
    record(name, t0, now(), key, d);
  }
}
