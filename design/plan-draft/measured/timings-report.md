# The pipeline's stopwatch — timings report

GENERATED FILE — the one truth is `design/plan-draft/measured/timings.jsonl`.
Re-run: `python3 design/plan-draft/measured/timings_report.py`.

37875 record(s) over 65.16 h, 2026-08-22 08:03:59 to 2026-08-25 01:13:36. 515 backfilled, 37360 measured live, 90 marker(s).

## Per step

| step | n | p50 | p95 | min | max | total | per min | first | last |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|
| `generate.roll` *(2 marker)* | 232 | 41.9 min | 1.83 h | 6.5 min | 1.83 h | 175.99 h | 0.4 | 08-23 01:51 | 08-23 11:23 |
| `sweep.pass` | 476 | 27.93 s | 11.3 min | 17.18 s | 41.1 min | 21.60 h | 0.2 | 08-23 14:28 | 08-25 01:13 |
| `measure.candidate` *(10 marker)* | 16834 | 4.20 s | 6.91 s | 1 ms | 2.2 min | 20.25 h | 6.6 | 08-23 04:14 | 08-24 22:27 |
| `dev.round` | 19 | 23.8 min | 56.5 min | 9.4 min | 2.74 h | 10.74 h | 0.1 | 08-23 11:56 | 08-23 14:41 |
| `seat.dead_air` | 1 | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 0.0 | 08-23 12:35 | 08-23 15:55 |
| `bake.backdrops` *(8 marker)* | 432 | 19.61 s | 43.58 s | 9.44 s | 3.3 min | 2.70 h | 0.1 | 08-22 08:03 | 08-25 01:13 |
| `bake.sweep` | 418 | 20.05 s | 43.79 s | 9.87 s | 1.6 min | 2.66 h | 0.2 | 08-23 16:22 | 08-25 01:13 |
| `promote.wall` *(2 marker)* | 11675 | 4 ms | 409 ms | 1 ms | 67.85 s | 33.0 min | 4.4 | 08-23 05:15 | 08-25 01:13 |
| `snap.wall` | 87 | 12.66 s | 25.94 s | 8.12 s | 47.43 s | 22.1 min | 0.1 | 08-24 06:04 | 08-24 21:46 |
| `supersede.wall` | 50 | 11.63 s | 31.60 s | 0 ms | 40.88 s | 11.4 min | 0.5 | 08-24 20:49 | 08-24 22:27 |
| `publish.site` *(1 marker)* | 17 | 22.73 s | 44.92 s | 18.38 s | 49.36 s | 7.1 min | 0.0 | 08-23 03:41 | 08-24 23:11 |
| `exit.snap` | 46 | 7.92 s | 13.02 s | 3.08 s | 14.40 s | 6.2 min | 0.2 | 08-24 19:04 | 08-24 22:27 |
| `publish.verify` | 16 | 10.31 s | 10.50 s | 10.13 s | 10.57 s | 2.7 min | 0.0 | 08-23 14:28 | 08-24 23:11 |
| `bake.fixtures` | 834 | 131 ms | 551 ms | 56 ms | 1.70 s | 2.5 min | 0.4 | 08-23 16:22 | 08-25 01:13 |
| `exit.route` | 13 | 9.70 s | 13.26 s | 3.36 s | 13.55 s | 2.1 min | 4.5 | 08-24 19:04 | 08-24 19:07 |
| `promote.backdrop` | 4534 | 15 ms | 44 ms | 2 ms | 2.43 s | 1.8 min | 2.1 | 08-23 12:26 | 08-25 01:13 |
| `emit.run` | 12 | 4.58 s | 8.15 s | 1.86 s | 18.06 s | 60.97 s | 0.0 | 08-24 07:31 | 08-24 21:41 |
| `validate.sweep` | 312 | 128 ms | 278 ms | 111 ms | 531 ms | 50.32 s | 0.9 | 08-24 19:07 | 08-25 01:13 |
| `emit.facing` | 190 | 101 ms | 666 ms | 16 ms | 1.62 s | 30.98 s | 0.1 | 08-23 03:55 | 08-24 21:41 |
| `emit.packet` | 190 | 16 ms | 56 ms | 0 ms | 529 ms | 5.22 s | 0.1 | 08-23 03:55 | 08-24 21:41 |
| `exit.voidrepair` | 2 | 1.53 s | 2.65 s | 1.53 s | 2.65 s | 4.17 s | 0.0 | 08-24 19:04 | 08-24 21:11 |
| `exit.tolerance` | 12 | 274 ms | 400 ms | 220 ms | 719 ms | 3.87 s | 6.9 | 08-24 19:05 | 08-24 19:07 |
| `lint.prompts` | 7 | 206 ms | 1.16 s | 3 ms | 1.16 s | 2.40 s | 0.0 | 08-24 09:49 | 08-25 00:44 |
| `park.wall` *(67 marker)* | 1461 | 0 ms | 0 ms | 0 ms | 0 ms | 1 ms | 0.8 | 08-23 19:53 | 08-25 01:13 |
| `baton.stalled` | 5 | 0 ms | 0 ms | 0 ms | 0 ms | 0 ms | 0.0 | 08-23 20:55 | 08-24 21:41 |

## The top contributor

**`generate.roll` — 175.99 h of 238.79 h of measured wall-clock (73.7%), over 232 event(s), p50 41.9 min.**

## Idle gaps

A gap longer than 5.0 min. IDLE means work was pending across it; QUIET means nothing was owed and the pipeline was right to be still.

Pending is computed against `design/batches/row23-scaffold/manor/run-state.json`.

| verdict | from | to | length | walls pending | last step | next step |
|---|---|---|--:|--:|---|---|
| **quiet** | 08-22 15:10 | 08-23 01:51 | 10.68 h | 0 | `bake.backdrops` | `generate.roll` |
| **quiet** | 08-22 09:19 | 08-22 15:10 | 5.85 h | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 05:34 | 08-23 10:12 | 4.64 h | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-24 13:20 | 08-24 17:39 | 4.31 h | 41 | `park.wall` | `sweep.pass` |
| **IDLE** | 08-24 09:56 | 08-24 11:48 | 1.86 h | 44 | `measure.candidate` | `sweep.pass` |
| **quiet** | 08-22 08:03 | 08-22 09:19 | 75.3 min | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 10:12 | 08-23 10:58 | 45.9 min | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 11:40 | 08-23 11:56 | 16.0 min | 70 | `bake.backdrops` | `dev.round` |
| **IDLE** | 08-23 03:41 | 08-23 03:55 | 14.0 min | 2 | `publish.site` | `generate.roll` |
| **IDLE** | 08-24 06:41 | 08-24 06:50 | 8.6 min | 56 | `promote.backdrop` | `promote.wall` |
| **IDLE** | 08-23 11:32 | 08-23 11:40 | 7.8 min | 70 | `measure.candidate` | `bake.backdrops` |
| **IDLE** | 08-23 05:28 | 08-23 05:34 | 5.9 min | 79 | `promote.wall` | `bake.backdrops` |
| **IDLE** | 08-23 11:26 | 08-23 11:32 | 5.8 min | 70 | `measure.candidate` | `measure.candidate` |

**12.54 h of dead air with work pending** across 10 gap(s).

## Queue latency — the idle a gap scan cannot see

A gap scan asks whether ANYTHING was running. This asks whether THIS PIECE OF WORK was. While a finished candidate sits unmeasured the next candidate is being generated, so the activity timeline never breaks and the wall waits anyway. This is where the run's hours actually went, and unlike a step's own duration it is free to delete: nothing has to be made faster for a handoff to stop waiting.

| handoff | joined on | n | p50 | p95 | worst | what waited |
|---|---|--:|--:|--:|--:|---|
| `generate.roll` -> `measure.candidate` | roll id | 173 | 9.58 h | 10.36 h | 10.45 h | a candidate on disk, waiting for the sweep to read it |
| `emit.packet` -> `generate.roll` | facing | 81 | 41.9 min | 70.9 min | 73.2 min | a packet dispatched, waiting for the seat to paint it |

Longest waits at `generate.roll` -> `measure.candidate`: great_hall/N 10.45 h; great_hall/N 10.45 h; great_hall/W 10.42 h; great_hall/S 10.42 h; great_hall/S 10.42 h.

Longest waits at `emit.packet` -> `generate.roll`: closet_chamber/W 73.2 min; closet_chamber/S 72.4 min; closet_chamber/E 72.4 min; closet_chamber/N 70.9 min; guest_chamber/W 70.9 min.

## Regression against the ledger's own trailing baseline

Recent window: last 10 event(s) of a step. Baseline: everything before it, at least 5 event(s). Flag at recent p50 >= 1.50x baseline p50.

- **REGRESSION `emit.facing`** — recent p50 211 ms against a baseline p50 of 96 ms over 180 event(s): **2.20x**. p95 1.62 s against 629 ms.
- **REGRESSION `promote.backdrop`** — recent p50 26 ms against a baseline p50 of 15 ms over 4524 event(s): **1.73x**. p95 45 ms against 44 ms.

- steady `bake.backdrops` — recent p50 23.72 s against 19.16 s (1.24x).
- steady `bake.fixtures` — recent p50 182 ms against 131 ms (1.39x).
- steady `bake.sweep` — recent p50 24.30 s against 19.76 s (1.23x).
- steady `dev.round` — recent p50 15.1 min against 43.2 min (0.35x).
- steady `emit.packet` — recent p50 1 ms against 16 ms (0.06x).
- steady `exit.snap` — recent p50 9.42 s against 7.48 s (1.26x).
- steady `generate.roll` — recent p50 16.8 min against 45.0 min (0.37x).
- steady `measure.candidate` — recent p50 4.72 s against 4.20 s (1.13x).
- steady `park.wall` — recent p50 0 ms against 0 ms (1.00x).
- steady `promote.wall` — recent p50 4 ms against 4 ms (1.00x).
- steady `publish.site` — recent p50 22.82 s against 19.93 s (1.15x).
- steady `publish.verify` — recent p50 10.26 s against 10.32 s (0.99x).
- steady `snap.wall` — recent p50 16.35 s against 12.52 s (1.31x).
- steady `supersede.wall` — recent p50 15.17 s against 10.28 s (1.48x).
- steady `sweep.pass` — recent p50 28.05 s against 27.84 s (1.01x).
- steady `validate.sweep` — recent p50 157 ms against 127 ms (1.24x).

Not yet checkable (a step needs 15 event(s) before it has a baseline to regress against): `baton.stalled` (5), `emit.run` (12), `exit.route` (13), `exit.tolerance` (12), `exit.voidrepair` (2), `lint.prompts` (7), `seat.dead_air` (1).

## What the backfill cannot know

Every backfilled record above is derived from a file's mtime or a commit, and each carries its `detail.derivation`. Four limits are structural, and the live ledger is what removes all four — a step that writes its own record leaves evidence an overwrite cannot destroy.

1. **A re-read overwrites its own clock, and it was caught doing it.** A reading document has one mtime. Row 27's recheck rewrote every door-bearing wall's, and while row 33 was being built a concurrent instrument re-ran 132 of the 214 manor readings to byte-identical files — same numbers, mtimes hours later. So a re-read candidate's `generate.roll` -> `measure.candidate` wait is measured to the RE-READ and is longer than the run's own handoff was. `--until` bounds the mining to one run, which is the mitigation; the live ledger is the cure, because it appends and an append cannot be overwritten.
2. **A promotion's duration is a lower bound.** The meta is the last file it writes; the bake that follows left no per-wall evidence.
3. **Bakes and publishes are markers.** A commit knows when, never how long.
4. **The publish history is one commit deep by construction.** `tools/publish-site.sh` force-pushes an orphan branch, so each publish erases the last one's record. That is why it now writes to this ledger before it pushes.

## The question this is here to ask

[HUMAN, 2026-08-24] "how can this be faster while maintaining quality" — and quality is the constraint, not the casualty: no gate is weakened for speed, and these clocks sit BESIDE the pass rates in `misses.jsonl` per production law clause 5. The numbers above answer the first half; the second half is the gates' own, and neither is allowed to move the other.
- 2026-08-25 tick — services up, loop passing; flags sub-second (`promote.backdrop` p50 15 ms). Two real cuts: (1) the watchdog's "2 candidates unread" was study/N + study/W — M0 walls the sweep is fenced from and never registers — a false positive standing since yesterday; the count now skips walls absent from run-state. (2) MEASURE-ERR lines carried no location; they now name file:line in function in the log and the ledger, so the next one is actionable in one read.
