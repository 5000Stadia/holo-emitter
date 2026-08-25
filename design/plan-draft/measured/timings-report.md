# The pipeline's stopwatch — timings report

GENERATED FILE — the one truth is `design/plan-draft/measured/timings.jsonl`.
Re-run: `python3 design/plan-draft/measured/timings_report.py`.

26646 record(s) over 59.18 h, 2026-08-22 08:03:59 to 2026-08-24 19:14:51. 515 backfilled, 26131 measured live, 44 marker(s).

## Per step

| step | n | p50 | p95 | min | max | total | per min | first | last |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|
| `generate.roll` *(2 marker)* | 232 | 41.9 min | 1.83 h | 6.5 min | 1.83 h | 175.99 h | 0.4 | 08-23 01:51 | 08-23 11:23 |
| `measure.candidate` *(10 marker)* | 16796 | 4.20 s | 6.87 s | 1 ms | 2.2 min | 20.19 h | 7.2 | 08-23 04:14 | 08-24 18:53 |
| `sweep.pass` | 177 | 7.9 min | 12.7 min | 17.18 s | 41.1 min | 19.46 h | 0.1 | 08-23 14:28 | 08-24 19:14 |
| `dev.round` | 19 | 23.8 min | 56.5 min | 9.4 min | 2.74 h | 10.74 h | 0.1 | 08-23 11:56 | 08-23 14:41 |
| `seat.dead_air` | 1 | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 0.0 | 08-23 12:35 | 08-23 15:55 |
| `bake.backdrops` *(8 marker)* | 130 | 21.23 s | 51.65 s | 9.44 s | 3.3 min | 54.1 min | 0.0 | 08-22 08:03 | 08-24 19:14 |
| `bake.sweep` | 116 | 21.51 s | 52.59 s | 9.87 s | 1.6 min | 48.9 min | 0.1 | 08-23 16:22 | 08-24 19:14 |
| `snap.wall` | 86 | 12.66 s | 25.94 s | 8.12 s | 47.43 s | 22.0 min | 0.1 | 08-24 06:04 | 08-24 18:18 |
| `promote.wall` *(2 marker)* | 5901 | 4 ms | 401 ms | 1 ms | 67.85 s | 21.1 min | 2.6 | 08-23 05:15 | 08-24 19:14 |
| `publish.site` *(1 marker)* | 10 | 21.89 s | 44.92 s | 18.38 s | 44.92 s | 4.0 min | 0.0 | 08-23 03:41 | 08-24 19:14 |
| `exit.route` | 13 | 9.70 s | 13.26 s | 3.36 s | 13.55 s | 2.1 min | 4.5 | 08-24 19:04 | 08-24 19:07 |
| `exit.snap` | 13 | 8.85 s | 13.02 s | 3.08 s | 13.15 s | 2.0 min | 4.6 | 08-24 19:04 | 08-24 19:07 |
| `publish.verify` | 9 | 10.32 s | 10.57 s | 10.24 s | 10.57 s | 1.6 min | 0.0 | 08-23 14:28 | 08-24 19:14 |
| `promote.backdrop` | 2100 | 14 ms | 59 ms | 2 ms | 2.43 s | 58.70 s | 1.1 | 08-23 12:26 | 08-24 19:14 |
| `bake.fixtures` | 214 | 127 ms | 594 ms | 59 ms | 1.70 s | 43.59 s | 0.1 | 08-23 16:22 | 08-24 19:14 |
| `emit.run` | 9 | 2.20 s | 8.15 s | 1.86 s | 8.15 s | 29.97 s | 0.0 | 08-24 07:31 | 08-24 18:46 |
| `emit.facing` | 119 | 17 ms | 657 ms | 16 ms | 832 ms | 12.28 s | 0.1 | 08-23 03:55 | 08-24 18:46 |
| `exit.tolerance` | 12 | 274 ms | 400 ms | 220 ms | 719 ms | 3.87 s | 6.9 | 08-24 19:05 | 08-24 19:07 |
| `exit.voidrepair` | 1 | 2.65 s | 2.65 s | 2.65 s | 2.65 s | 2.65 s | 22.7 | 08-24 19:04 | 08-24 19:04 |
| `lint.prompts` | 4 | 549 ms | 1.16 s | 3 ms | 1.16 s | 1.73 s | 0.0 | 08-24 09:49 | 08-24 12:00 |
| `emit.packet` | 119 | 17 ms | 18 ms | 1 ms | 32 ms | 1.62 s | 0.1 | 08-23 03:55 | 08-24 18:46 |
| `validate.sweep` | 7 | 154 ms | 233 ms | 125 ms | 233 ms | 1.12 s | 1.0 | 08-24 19:07 | 08-24 19:14 |
| `park.wall` *(21 marker)* | 555 | 0 ms | 0 ms | 0 ms | 0 ms | 1 ms | 0.4 | 08-23 19:53 | 08-24 19:14 |
| `baton.stalled` | 3 | 0 ms | 0 ms | 0 ms | 0 ms | 0 ms | 0.0 | 08-23 20:55 | 08-24 18:39 |

## The top contributor

**`generate.roll` — 175.99 h of 232.34 h of measured wall-clock (75.7%), over 232 event(s), p50 41.9 min.**

## Idle gaps

A gap longer than 5.0 min. IDLE means work was pending across it; QUIET means nothing was owed and the pipeline was right to be still.

Pending is computed against `design/batches/row23-scaffold/manor/run-state.json`.

| verdict | from | to | length | walls pending | last step | next step |
|---|---|---|--:|--:|---|---|
| **quiet** | 08-22 15:10 | 08-23 01:51 | 10.68 h | 0 | `bake.backdrops` | `generate.roll` |
| **quiet** | 08-22 09:19 | 08-22 15:10 | 5.85 h | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 05:34 | 08-23 10:12 | 4.64 h | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-24 13:20 | 08-24 17:39 | 4.31 h | 30 | `park.wall` | `sweep.pass` |
| **IDLE** | 08-24 09:56 | 08-24 11:48 | 1.86 h | 33 | `measure.candidate` | `sweep.pass` |
| **quiet** | 08-22 08:03 | 08-22 09:19 | 75.3 min | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 10:12 | 08-23 10:58 | 45.9 min | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 11:40 | 08-23 11:56 | 16.0 min | 70 | `bake.backdrops` | `dev.round` |
| **IDLE** | 08-23 03:41 | 08-23 03:55 | 14.0 min | 2 | `publish.site` | `generate.roll` |
| **IDLE** | 08-24 06:41 | 08-24 06:50 | 8.6 min | 45 | `promote.backdrop` | `promote.wall` |
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

- **REGRESSION `emit.facing`** — recent p50 288 ms against a baseline p50 of 17 ms over 109 event(s): **16.94x**. p95 786 ms against 354 ms.
- **REGRESSION `measure.candidate`** — recent p50 9.80 s against a baseline p50 of 4.20 s over 16776 event(s): **2.34x**. p95 23.46 s against 6.83 s.

- steady `bake.backdrops` — recent p50 23.26 s against 21.23 s (1.10x).
- steady `bake.fixtures` — recent p50 119 ms against 127 ms (0.94x).
- steady `bake.sweep` — recent p50 24.17 s against 20.05 s (1.21x).
- steady `dev.round` — recent p50 15.1 min against 43.2 min (0.35x).
- steady `emit.packet` — recent p50 3 ms against 17 ms (0.18x).
- steady `generate.roll` — recent p50 16.8 min against 45.0 min (0.37x).
- steady `park.wall` — recent p50 0 ms against 0 ms (1.00x).
- steady `promote.backdrop` — recent p50 13 ms against 14 ms (0.93x).
- steady `promote.wall` — recent p50 3 ms against 4 ms (0.69x).
- steady `snap.wall` — recent p50 16.69 s against 12.52 s (1.33x).
- steady `sweep.pass` — recent p50 27.11 s against 8.9 min (0.05x).

Not yet checkable (a step needs 15 event(s) before it has a baseline to regress against): `baton.stalled` (3), `emit.run` (9), `exit.route` (13), `exit.snap` (13), `exit.tolerance` (12), `exit.voidrepair` (1), `lint.prompts` (4), `publish.site` (9), `publish.verify` (9), `seat.dead_air` (1), `validate.sweep` (7).

## What the backfill cannot know

Every backfilled record above is derived from a file's mtime or a commit, and each carries its `detail.derivation`. Four limits are structural, and the live ledger is what removes all four — a step that writes its own record leaves evidence an overwrite cannot destroy.

1. **A re-read overwrites its own clock, and it was caught doing it.** A reading document has one mtime. Row 27's recheck rewrote every door-bearing wall's, and while row 33 was being built a concurrent instrument re-ran 132 of the 214 manor readings to byte-identical files — same numbers, mtimes hours later. So a re-read candidate's `generate.roll` -> `measure.candidate` wait is measured to the RE-READ and is longer than the run's own handoff was. `--until` bounds the mining to one run, which is the mitigation; the live ledger is the cure, because it appends and an append cannot be overwritten.
2. **A promotion's duration is a lower bound.** The meta is the last file it writes; the bake that follows left no per-wall evidence.
3. **Bakes and publishes are markers.** A commit knows when, never how long.
4. **The publish history is one commit deep by construction.** `tools/publish-site.sh` force-pushes an orphan branch, so each publish erases the last one's record. That is why it now writes to this ledger before it pushes.

## The question this is here to ask

[HUMAN, 2026-08-24] "how can this be faster while maintaining quality" — and quality is the constraint, not the casualty: no gate is weakened for speed, and these clocks sit BESIDE the pass rates in `misses.jsonl` per production law clause 5. The numbers above answer the first half; the second half is the gates' own, and neither is allowed to move the other.

- 2026-08-24 19:20 tick — exits landed (L-ROUTING). First routed pass: 13 walls × `exit.route` p50 9.7 s (snap 8.85 s of it) = 2.1 min one-time per candidate (`exit_attempt` blocks re-routing until the candidate changes), so the sweep's steady-state cost is unchanged and the pass promoted 3 walls (entrance_court/E tolerated, great_hall/N snapped+voided, entrance_court/S measured clean on its corrected ask). Flags: `emit.facing` 16.9× is 17 ms → 832 ms (browser launch amortised over ONE re-ask wall; under the 1 s floor, ignore), `bake.fixtures` 1.66× is 127 ms → 1.7 s (nav-manor fixture now carries row-25 hit rings; absolute cost fine), `measure.candidate` 2.34× is the exits' re-measure counted under the same step — the real number is the 9.7 s above. Faster while keeping quality: the exits' snap is a 1536×1024 five-homography warp in numpy at ~9 s; a 2× downsampled geometry solve with a full-res final warp would halve it (one-time, so not worth a builder yet). The 1.86 h idle gap 09:56–11:48 is the host restart.
