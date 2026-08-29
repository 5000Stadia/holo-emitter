# The pipeline's stopwatch — timings report

GENERATED FILE — the one truth is `design/plan-draft/measured/timings.jsonl`.
Re-run: `python3 design/plan-draft/measured/timings_report.py`.

221055 record(s) over 158.62 h, 2026-08-22 08:03:59 to 2026-08-28 22:41:17. 515 backfilled, 220540 measured live, 778 marker(s).

## Per step

| step | n | p50 | p95 | min | max | total | per min | first | last |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|
| `generate.roll` *(2 marker)* | 232 | 41.9 min | 1.83 h | 6.5 min | 1.83 h | 175.99 h | 0.4 | 08-23 01:51 | 08-23 11:23 |
| `sweep.pass` | 5424 | 22.58 s | 31.41 s | 8.54 s | 41.1 min | 53.19 h | 0.7 | 08-23 14:28 | 08-28 22:41 |
| `bake.sweep` | 5365 | 17.20 s | 23.70 s | 9.87 s | 1.6 min | 26.75 h | 0.7 | 08-23 16:22 | 08-28 22:41 |
| `bake.backdrops` *(8 marker)* | 5385 | 16.72 s | 23.03 s | 9.44 s | 3.3 min | 26.14 h | 0.6 | 08-22 08:03 | 08-28 22:41 |
| `measure.candidate` *(10 marker)* | 16841 | 4.20 s | 6.91 s | 1 ms | 2.2 min | 20.26 h | 5.4 | 08-23 04:14 | 08-25 08:32 |
| `dev.round` | 19 | 23.8 min | 56.5 min | 9.4 min | 2.74 h | 10.74 h | 0.1 | 08-23 11:56 | 08-23 14:41 |
| `promote.wall` *(2 marker)* | 105729 | 3 ms | 277 ms | 1 ms | 67.85 s | 3.60 h | 12.8 | 08-23 05:15 | 08-28 22:40 |
| `seat.dead_air` | 1 | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 3.33 h | 0.0 | 08-23 12:35 | 08-23 15:55 |
| `derive.sweep` | 4814 | 1.54 s | 1.63 s | 1.31 s | 36.07 s | 2.10 h | 0.9 | 08-25 03:58 | 08-28 22:40 |
| `snap.wall` | 87 | 12.66 s | 25.94 s | 8.12 s | 47.43 s | 22.1 min | 0.1 | 08-24 06:04 | 08-24 21:46 |
| `bake.fixtures` | 10760 | 133 ms | 166 ms | 56 ms | 1.70 s | 21.3 min | 1.4 | 08-23 16:22 | 08-28 22:41 |
| `publish.site` *(1 marker)* | 25 | 22.82 s | 62.16 s | 18.38 s | 5.2 min | 15.6 min | 0.0 | 08-23 03:41 | 08-28 17:19 |
| `supersede.wall` | 59 | 14.55 s | 29.58 s | 0 ms | 40.88 s | 13.9 min | 0.1 | 08-24 20:49 | 08-25 08:32 |
| `validate.sweep` | 5259 | 144 ms | 158 ms | 111 ms | 633 ms | 12.9 min | 0.9 | 08-24 19:07 | 08-28 22:40 |
| `promote.backdrop` | 44137 | 16 ms | 21 ms | 2 ms | 2.43 s | 12.9 min | 5.6 | 08-23 12:26 | 08-28 22:40 |
| `publish.verify` | 24 | 10.30 s | 50.86 s | 10.13 s | 5.1 min | 9.7 min | 0.0 | 08-23 14:28 | 08-28 17:19 |
| `exit.snap` | 54 | 7.81 s | 12.21 s | 3.08 s | 14.40 s | 7.1 min | 0.1 | 08-24 19:04 | 08-25 08:32 |
| `derive.regen` | 54 | 285 ms | 32.60 s | 15 ms | 36.06 s | 7.1 min | 0.1 | 08-25 01:48 | 08-25 08:34 |
| `exit.route` | 13 | 9.70 s | 13.26 s | 3.36 s | 13.55 s | 2.1 min | 4.5 | 08-24 19:04 | 08-24 19:07 |
| `emit.run` | 18 | 3.41 s | 8.82 s | 1.86 s | 18.06 s | 1.5 min | 0.0 | 08-24 07:31 | 08-25 08:29 |
| `emit.facing` | 201 | 109 ms | 666 ms | 16 ms | 1.62 s | 34.91 s | 0.1 | 08-23 03:55 | 08-25 08:29 |
| `lint.prompts` | 18 | 206 ms | 1.76 s | 3 ms | 4.82 s | 10.91 s | 0.0 | 08-24 09:49 | 08-28 22:27 |
| `emit.packet` | 201 | 14 ms | 36 ms | 0 ms | 529 ms | 5.28 s | 0.1 | 08-23 03:55 | 08-25 08:29 |
| `exit.voidrepair` | 2 | 1.53 s | 2.65 s | 1.53 s | 2.65 s | 4.17 s | 0.0 | 08-24 19:04 | 08-24 21:11 |
| `exit.tolerance` | 12 | 274 ms | 400 ms | 220 ms | 719 ms | 3.87 s | 6.9 | 08-24 19:05 | 08-24 19:07 |
| `park.wall` *(755 marker)* | 16311 | 0 ms | 0 ms | 0 ms | 0 ms | 16 ms | 2.2 | 08-23 19:53 | 08-28 22:40 |
| `baton.stalled` | 10 | 0 ms | 0 ms | 0 ms | 0 ms | 0 ms | 0.0 | 08-23 20:55 | 08-25 08:29 |

## The camera gate, per register

[row 43] The clean register (`g5-noappendix`) was ruled production on a screen that separated nothing at one roll a wall, so the ruling keeps being measured: each register's last 20 production returns, against the register it replaced. A reading is joined to its register through its roll id in the packet record — the emitter's own declaration at emit time — and a packet record with no `register` key is `g4`, because every ask cut before 2026-08-25 composed through it. `camera` is `verdict == PASS`, the same quantity `row34_fitness.py` scores an arm's camera column on.

| register | camera pass | of | rate | most recent return |
|---|--:|--:|--:|---|
| `g4` | 14 | 20 | 70% | 2026-08-24 22:27 |
| `g5-noappendix` | 3 | 8 | 38% | 2026-08-25 08:32 |

## The top contributor

**`generate.roll` — 175.99 h of 324.22 h of measured wall-clock (54.3%), over 232 event(s), p50 41.9 min.**

## Idle gaps

A gap longer than 5.0 min. IDLE means work was pending across it; QUIET means nothing was owed and the pipeline was right to be still.

Pending is computed against `design/batches/row23-scaffold/manor/run-state.json`.

| verdict | from | to | length | walls pending | last step | next step |
|---|---|---|--:|--:|---|---|
| **quiet** | 08-22 15:10 | 08-23 01:51 | 10.68 h | 0 | `bake.backdrops` | `generate.roll` |
| **quiet** | 08-22 09:19 | 08-22 15:10 | 5.85 h | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 05:34 | 08-23 10:12 | 4.64 h | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-24 13:20 | 08-24 17:39 | 4.31 h | 42 | `park.wall` | `sweep.pass` |
| **IDLE** | 08-24 09:56 | 08-24 11:48 | 1.86 h | 45 | `measure.candidate` | `sweep.pass` |
| **quiet** | 08-22 08:03 | 08-22 09:19 | 75.3 min | 0 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 10:12 | 08-23 10:58 | 45.9 min | 79 | `bake.backdrops` | `bake.backdrops` |
| **IDLE** | 08-23 11:40 | 08-23 11:56 | 16.0 min | 70 | `bake.backdrops` | `dev.round` |
| **IDLE** | 08-23 03:41 | 08-23 03:55 | 14.0 min | 2 | `publish.site` | `generate.roll` |
| **IDLE** | 08-24 06:41 | 08-24 06:50 | 8.6 min | 57 | `promote.backdrop` | `promote.wall` |
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

- **REGRESSION `emit.facing`** — recent p50 269 ms against a baseline p50 of 104 ms over 191 event(s): **2.59x**. p95 614 ms against 666 ms.
- **REGRESSION `emit.run`** — recent p50 4.57 s against a baseline p50 of 2.60 s over 8 event(s): **1.76x**. p95 18.06 s against 8.15 s.

- steady `bake.backdrops` — recent p50 17.29 s against 16.72 s (1.03x).
- steady `bake.fixtures` — recent p50 80 ms against 133 ms (0.60x).
- steady `bake.sweep` — recent p50 17.76 s against 17.20 s (1.03x).
- steady `derive.regen` — recent p50 251 ms against 4.96 s (0.05x).
- steady `derive.sweep` — recent p50 1.59 s against 1.54 s (1.03x).
- steady `dev.round` — recent p50 15.1 min against 43.2 min (0.35x).
- steady `emit.packet` — recent p50 2 ms against 16 ms (0.13x).
- steady `exit.snap` — recent p50 5.11 s against 8.14 s (0.63x).
- steady `generate.roll` — recent p50 16.8 min against 45.0 min (0.37x).
- steady `lint.prompts` — recent p50 69 ms against 453 ms (0.15x).
- steady `measure.candidate` — recent p50 4.77 s against 4.20 s (1.14x).
- steady `park.wall` — recent p50 0 ms against 0 ms (1.00x).
- steady `promote.backdrop` — recent p50 17 ms against 16 ms (1.06x).
- steady `promote.wall` — recent p50 3 ms against 3 ms (1.05x).
- steady `publish.site` — recent p50 21.22 s against 22.73 s (0.93x).
- steady `publish.verify` — recent p50 10.28 s against 10.30 s (1.00x).
- steady `snap.wall` — recent p50 16.35 s against 12.52 s (1.31x).
- steady `supersede.wall` — recent p50 13.27 s against 14.55 s (0.91x).
- steady `sweep.pass` — recent p50 23.29 s against 22.58 s (1.03x).
- steady `validate.sweep` — recent p50 146 ms against 144 ms (1.01x).

Not yet checkable (a step needs 15 event(s) before it has a baseline to regress against): `baton.stalled` (10), `exit.route` (13), `exit.tolerance` (12), `exit.voidrepair` (2), `seat.dead_air` (1).

## What the backfill cannot know

Every backfilled record above is derived from a file's mtime or a commit, and each carries its `detail.derivation`. Four limits are structural, and the live ledger is what removes all four — a step that writes its own record leaves evidence an overwrite cannot destroy.

1. **A re-read overwrites its own clock, and it was caught doing it.** A reading document has one mtime. Row 27's recheck rewrote every door-bearing wall's, and while row 33 was being built a concurrent instrument re-ran 132 of the 214 manor readings to byte-identical files — same numbers, mtimes hours later. So a re-read candidate's `generate.roll` -> `measure.candidate` wait is measured to the RE-READ and is longer than the run's own handoff was. `--until` bounds the mining to one run, which is the mitigation; the live ledger is the cure, because it appends and an append cannot be overwritten.
2. **A promotion's duration is a lower bound.** The meta is the last file it writes; the bake that follows left no per-wall evidence.
3. **Bakes and publishes are markers.** A commit knows when, never how long.
4. **The publish history is one commit deep by construction.** `tools/publish-site.sh` force-pushes an orphan branch, so each publish erases the last one's record. That is why it now writes to this ledger before it pushes.

## The question this is here to ask

[HUMAN, 2026-08-24] "how can this be faster while maintaining quality" — and quality is the constraint, not the casualty: no gate is weakened for speed, and these clocks sit BESIDE the pass rates in `misses.jsonl` per production law clause 5. The numbers above answer the first half; the second half is the gates' own, and neither is allowed to move the other.
- 2026-08-28 — the 2-hour Navigator sampling tick is RETIRED (clause 12: measure transitions, not polls). Three duplicate ticks had been firing every two hours, each an LLM turn, for four days; the last ~20 were all "nominal". Stalls are the watchdog's (baton-watch, a script with an exit code); regressions are `timings_report.py --monitor`, run by hand or by the publish preflight. Last reading: services up, nothing owed, g5 3/8 vs g4 70%.
