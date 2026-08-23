# Row 33 — the plan

## The shape

A ledger, two writers, one analyzer, one monitor. Nothing in it calls a model, nothing in it
loops, and nothing in it can take a pipeline step down: the stopwatch is apparatus and apparatus
that breaks the thing it measures has argued itself out of a life (production law clause 5).

**The ledger** is `design/plan-draft/measured/timings.jsonl` — one JSON object per line:

    {"ts_start": <epoch float>, "ts_end": <epoch float>, "step": "<name>", "key": <string|null>, "detail": {...}}

`backfilled: true` rides any record derived from evidence rather than measured live.

Append-only, one `write()` per record under `O_APPEND`, the serialized line held under
`PIPE_BUF` (4096 bytes) so the kernel's atomicity guarantee is the concurrency mechanism and no
lock is needed. Detail is truncated to fit rather than allowed to tear a line.

**Marker records.** Backfill can know *when* a step landed and not *how long* it took (a git
commit timestamp is the only evidence a bake left). Those are written with `ts_end == ts_start`
and a `detail.derivation` sentence. The analyzer classes any record with `ts_end <= ts_start` as
a marker: counted, named, excluded from p50/p95, and still counted as activity for gap
continuity. Live writers clamp `ts_end` to `ts_start + 1 µs` so a real step can never be mistaken
for a marker.

## The pieces

1. `design/plan-draft/measured/timings.py` — the python writer. `record(...)` and a `step(...)`
   context manager. Ledger path from `HOLO_TIMINGS` when set, else the repo default.
2. `tools/timings.mjs` — the node writer, same record shape, same env override, sync and async
   `step()`.
3. Instrumentation, timing lines only:
   - `tools/make-scaffold.mjs` — `emit.facing` and `emit.packet` per wall in `emitManor` /
     `emitRetries`, `emit.run` around the whole order.
   - `design/plan-draft/measured/row23_run.py` — `measure.candidate` per candidate,
     `promote.wall` per promotion, `bake.sweep` per bake call, `sweep.pass` per sweep.
     **This file is shared with the concurrent corner/horizon builder**: every edit here is a
     timing line and nothing else, each marked `# [row33]`, and `row23_lib.py` is not touched.
   - `tools/promote-backdrop.mjs` — `promote.backdrop`.
   - `tools/bake-backdrops.mjs` — `bake.backdrops`.
   - `tools/bake-fixtures.mjs` — `bake.fixtures`.
   - `tools/publish-site.sh` — `publish.site` around the whole run and `publish.verify` around
     the poll that waits for the CDN.
   - `design/plan-draft/measured/prompt_lint.py` — `lint.prompts`.
4. `design/plan-draft/measured/timings_report.py` — the analyzer. Per-step count / p50 / p95 /
   total / throughput; idle gaps; regression flags; top contributor named with its number. Prints
   the table and writes `design/plan-draft/measured/timings-report.md`.
5. `--backfill` — mines the evidence Test 1 already left, marks every record `backfilled: true`,
   is idempotent (a record already in the ledger is not written twice), and takes `--tree` because
   a fresh worktree checkout flattens every mtime to the checkout second. The tool detects that
   flattening and says so rather than reporting a run that took four seconds.
6. `--monitor` — runs the analyzer, prints one line, exits non-zero on any regression flag. A
   scheduler's to call on a cadence; it does not schedule itself.

## Generation time

Not instrumented — the generating seat is external and writes only the candidate file. It is
DERIVED in the backfill: prompt-file mtime → candidate-file mtime, per roll, which is exactly what
the record already proves works (`backdrops/source/<loc>-<F>/row23-<id>.prompt.txt` is written by
the emitter and `row23-<id>.png` by the seat).

## Idle gaps, computed and not guessed

A gap is a span between the end of one record's activity and the start of the next, longer than
the threshold. It is IDLE only if work was pending across it. Pending is computed from ledger
continuity against `run-state.json`: a wall is pending from its first `emit.*`/`generate.*` record
until its terminal record (a successful `promote.wall`, or a park), and any wall whose recorded
status is not terminal is pending to the end of the ledger.

## Regression

Per step: the RECENT window is the last N events; the BASELINE is the events before it, out of the
ledger's own trailing history. A flag needs a baseline of at least `--min-baseline` events and a
recent p50 above baseline p50 by `--regress-factor`. Both numbers are printed with the flag —
a flag that does not carry its arithmetic is an assertion.

## Edges

- **Must not touch**: `row23_lib.py` (another builder holds it), any detector, any gate threshold,
  any prompt text, any promoted artifact. No gate is weakened for speed; the clocks sit *beside*
  the pass rates (row 33's own clause).
- **Feels the change**: every instrumented script gains an import and a wrapper. A writer failure
  is swallowed with one line to stderr, because a stopwatch may not stop the pipeline.
- **Ledger hygiene**: `timings.jsonl` is committed — it is the record. Tests never write to it;
  they point `HOLO_TIMINGS` at a temp file.

## Tests — `tests/playwright/timings.spec.mjs`

- Concurrency: several python and node processes append simultaneously to one temp ledger; every
  line parses, the count is exact, no line is torn.
- The analyzer on a synthetic ledger carrying a planted idle gap and a planted regression: both
  are found, both named with their numbers. **Each arm has its negative control** — the same
  ledger with the defect removed must report neither, so an arm that cannot fail is visible as
  one.
- Backfill on the real tree: non-zero counts on more than one step.
- Live wiring: running an instrumented step against a temp ledger produces its record.
