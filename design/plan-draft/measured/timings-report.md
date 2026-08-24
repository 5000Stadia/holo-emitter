# The pipeline's stopwatch — timings report

GENERATED FILE — the one truth is `design/plan-draft/measured/timings.jsonl`.
Re-run: `python3 design/plan-draft/measured/timings_report.py`.

515 record(s) over 27.61 h, 2026-08-22 08:03:59 to 2026-08-23 11:40:45. 515 backfilled, 0 measured live, 23 marker(s).

Backfill mined `/home/k/Projects/holo-emitter`: 649 event(s), 515 written, 2 already in the ledger.
Bounded at **2026-08-23 11:40:45** — 132 event(s) whose evidence was written after the cutoff are excluded, because a tree under active work rewrites mtimes and one run's ledger holds one run's evidence.
2 candidate(s) whose prompt file is newer than the image (re-emitted packets); only their arrival is recorded.

## Per step

| step | n | p50 | p95 | min | max | total | per min | first | last |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|
| `generate.roll` *(2 marker)* | 232 | 41.9 min | 1.83 h | 6.5 min | 1.83 h | 175.99 h | 0.4 | 08-23 01:51 | 08-23 11:23 |
| `measure.candidate` *(10 marker)* | 80 | 3.58 s | 37.88 s | 1 ms | 1.7 min | 8.6 min | 0.2 | 08-23 04:14 | 08-23 11:32 |
| `promote.wall` *(2 marker)* | 22 | 173 ms | 65.97 s | 1 ms | 67.85 s | 5.9 min | 0.1 | 08-23 05:15 | 08-23 11:08 |
| `emit.packet` | 86 | 17 ms | 18 ms | 16 ms | 32 ms | 1.50 s | 3439.4 | 08-23 03:55 | 08-23 03:55 |
| `emit.facing` | 86 | 17 ms | 18 ms | 16 ms | 31 ms | 1.50 s | 3439.9 | 08-23 03:55 | 08-23 03:55 |
| `bake.backdrops` *(8 marker)* | 8 | -- | -- | -- | -- | -- | 0.0 | 08-22 08:03 | 08-23 11:40 |
| `publish.site` *(1 marker)* | 1 | -- | -- | -- | -- | -- | -- | 08-23 03:41 | 08-23 03:41 |

## The top contributor

**`generate.roll` — 175.99 h of 176.23 h of measured wall-clock (99.9%), over 232 event(s), p50 41.9 min.**

## Idle gaps

A gap longer than 5.0 min. IDLE means work was pending across it; QUIET means nothing was owed and the pipeline was right to be still.

Pending is computed against `design/batches/row23-scaffold/manor/run-state.json`.

| verdict | from | to | length | walls pending | last step | next step |
|---|---|---|--:|--:|---|---|
| **quiet** | 08-22 15:10 | 08-23 01:51 | 10.68 h | 0 | `bake.backdrops` | `generate.roll` |
| **quiet** | 08-22 09:19 | 08-22 15:10 | 5.85 h | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 05:34 | 08-23 10:12 | 4.64 h | 79 | `bake.backdrops` | `bake.backdrops` |
| **quiet** | 08-22 08:03 | 08-22 09:19 | 75.3 min | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 10:12 | 08-23 10:58 | 45.9 min | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 03:41 | 08-23 03:55 | 14.0 min | 2 | `publish.site` | `generate.roll` |
| **IDLE** | 08-23 11:32 | 08-23 11:40 | 7.8 min | 67 | `measure.candidate` | `bake.backdrops` |
| **IDLE** | 08-23 05:28 | 08-23 05:34 | 5.9 min | 79 | `promote.wall` | `bake.backdrops` |
| **IDLE** | 08-23 11:26 | 08-23 11:32 | 5.8 min | 68 | `measure.candidate` | `measure.candidate` |

**5.96 h of dead air with work pending** across 6 gap(s).

## Queue latency — the idle a gap scan cannot see

A gap scan asks whether ANYTHING was running. This asks whether THIS PIECE OF WORK was. While a finished candidate sits unmeasured the next candidate is being generated, so the activity timeline never breaks and the wall waits anyway. This is where the run's hours actually went, and unlike a step's own duration it is free to delete: nothing has to be made faster for a handoff to stop waiting.

| handoff | joined on | n | p50 | p95 | worst | what waited |
|---|---|--:|--:|--:|--:|---|
| `generate.roll` -> `measure.candidate` | roll id | 51 | 37.3 min | 7.36 h | 7.41 h | a candidate on disk, waiting for the sweep to read it |
| `emit.packet` -> `generate.roll` | facing | 81 | 41.9 min | 70.9 min | 73.2 min | a packet dispatched, waiting for the seat to paint it |

Longest waits at `generate.roll` -> `measure.candidate`: great_hall/E 7.41 h; great_hall/E 7.41 h; study/S 7.36 h; study/S 7.35 h; privy_garden/N 6.52 h.

Longest waits at `emit.packet` -> `generate.roll`: closet_chamber/W 73.2 min; closet_chamber/S 72.4 min; closet_chamber/E 72.4 min; closet_chamber/N 70.9 min; guest_chamber/W 70.9 min.

## Regression against the ledger's own trailing baseline

Recent window: last 10 event(s) of a step. Baseline: everything before it, at least 5 event(s). Flag at recent p50 >= 1.50x baseline p50.

None flagged.

- steady `emit.facing` — recent p50 17 ms against 17 ms (1.00x).
- steady `emit.packet` — recent p50 17 ms against 17 ms (1.00x).
- steady `generate.roll` — recent p50 16.8 min against 45.0 min (0.37x).
- steady `measure.candidate` — recent p50 3.30 s against 3.84 s (0.86x).
- steady `promote.wall` — recent p50 2 ms against 19.18 s (0.00x).

## What the backfill cannot know

Every backfilled record above is derived from a file's mtime or a commit, and each carries its `detail.derivation`. Four limits are structural, and the live ledger is what removes all four — a step that writes its own record leaves evidence an overwrite cannot destroy.

1. **A re-read overwrites its own clock, and it was caught doing it.** A reading document has one mtime. Row 27's recheck rewrote every door-bearing wall's, and while row 33 was being built a concurrent instrument re-ran 132 of the 214 manor readings to byte-identical files — same numbers, mtimes hours later. So a re-read candidate's `generate.roll` -> `measure.candidate` wait is measured to the RE-READ and is longer than the run's own handoff was. `--until` bounds the mining to one run, which is the mitigation; the live ledger is the cure, because it appends and an append cannot be overwritten.
2. **A promotion's duration is a lower bound.** The meta is the last file it writes; the bake that follows left no per-wall evidence.
3. **Bakes and publishes are markers.** A commit knows when, never how long.
4. **The publish history is one commit deep by construction.** `tools/publish-site.sh` force-pushes an orphan branch, so each publish erases the last one's record. That is why it now writes to this ledger before it pushes.

## The question this is here to ask

[HUMAN, 2026-08-24] "how can this be faster while maintaining quality" — and quality is the constraint, not the casualty: no gate is weakened for speed, and these clocks sit BESIDE the pass rates in `misses.jsonl` per production law clause 5. The numbers above answer the first half; the second half is the gates' own, and neither is allowed to move the other.

## Row-30 audit trail — speed answers with numbers (standing, Kabe's tick question)

- 2026-08-24 tick: `generate.roll` is 99.9% of wall-clock at p50 41.9 min BECAUSE the seat
  paints serially through a 170-image order. Lever 1: parallel generation (second seat
  instance or intra-seat parallel calls) divides p50 directly; no gate touched. Lever 2:
  always-on sweeping (tmux watch loop) deletes the 37-min p50 pickup latency; in force
  since 2026-08-24, the ledger will show it. No regression this tick; 58 holds await the
  row-32 instrument, not sweep time.
- 2026-08-24 tick 2: nominal; loop alive, third coat measuring on arrival with the new
  eye-line corrections visible in retry text. One analyzer sharpening worth building:
  the all-time queue p50 (generate->measure 9.58h) is dominated by the pre-loop backfill
  era and masks live health - report trailing-window (6h) queue latencies beside all-time
  so a live regression cannot hide under history, and history cannot alarm a healthy present.
- 2026-08-24 tick 4: the baton metric, scoped to living walls, immediately surfaced 16
  genuinely unmeasured candidates - all four open facings (the row-29 float x None family),
  crash-skipped forever with no reading written. A watchdog false positive was hiding a
  real permanent stall. Builder dispatched for the open-facing vista path (measurement +
  promotion). Lesson for row 30: a monitoring metric that is known-noisy gets fixed, not
  tolerated - noise is where real stalls hide.
- 2026-08-24 tick: the sweep loop held a STALE in-memory retry map (retries.json is read at
  module load; the loop predated the retry-5 emission) - 19 production-test returns sat
  unreadable while the baton showed loop-active. Restarted; refinement for the loop: reload
  when retries.json's mtime moves, so a long-lived watcher cannot go stale against its own
  worklist. Same family as the second-coat invisibility - a worklist handoff seam.
