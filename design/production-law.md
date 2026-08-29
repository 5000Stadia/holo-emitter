# Production law — the miss ledger

[HUMAN, 2026-08-22, verbatim]: "Initially we can do lengthy checking for accuracy but when that
accuracy isn't met we need to log why, make sure that's algorithmically baked in and go back to
trying to line up a fast build system."

The rule, as the map-maker and sprite-processing systems must implement it:

1. **Lengthy checking is licensed at first.** Deep measurement, multi-round gates, human-grade
   scrutiny — all fine while the system is young.
2. **Every accuracy miss is logged with its why** — machine-readable (`misses.jsonl` beside the
   gates): artifact, gate, measured numbers, diagnosed cause.
3. **A miss is only CLOSED when its cause is baked in algorithmically** — a prompt-template
   change, a gate clause, a solver constraint — cited by commit. Knowledge that lives only in a
   transcript is an open miss.
4. **Then return to speed.** The fast-build target is re-approached as the ledger closes; the
   system's acceptance metric is FIRST-ROLL PASS RATE rising over time, and checking is thinned
   only where the ledger shows the class of miss extinct.

Already-earned entries this law retroactively claims (each already baked in): camera scatter →
pixel-per-metre targets in every wall prompt; feature-poor walls unmeasurable → ruled-size
anchors (0.90 m window bays); studio shadows breaking gate (h) → flat-ground/no-shadow contract
lines; proportion drift → dimensions-as-ratios stated in prompts; slide-geometry dead ends →
two-state pairs for shallow-drawer furniture.

5. **An improvement must clock as one** [HUMAN, 2026-08-22, verbatim]: "be wary of improvements
   actual improvement by clocking its improved accuracy, or speed, if the improvement doesn't
   improve either it should be considered if it is an ACTUAL improvement." Every baked-in change
   carries its before/after numbers — first-roll pass rate, gate-failure rate, or wall-clock —
   measured, not asserted. A change that moves neither accuracy nor speed is presumed NOT an
   improvement: it is apparatus, and apparatus must argue for its life or be removed. The ledger
   records the clock beside the fix.

## 6. Solutions fold into the generation method [HUMAN, 2026-08-24]

Kabe, verbatim, after the first walk of the painted manor: "Your solutions need to fold into
the generation method for future builds." This is clause 2 said from the product side, and it
is the acceptance test for every fix the walk produced: a correction lands in the EMITTER (the
prompt derived from the plan's own room types, windows and facings), in a GATE (a clause the
validator or the promotion loop applies to every wall forever), or in the INSTRUMENT (the
measurement that decides) — never in a hand-retouched artifact, never in a per-run prompt
paragraph a future build would have to remember. The question asked of any fix at review:
"does the NEXT map, with none of this conversation in context, get this for free?" If not,
the miss is still open.


## Clauses 7–12 — adopted 2026-08-28 from the method audit (design/audit/method-audit-2026-08-28.md), on Kabe's rulings

7. **Deterministic by default.** A model call is licensed only where interpretation cannot be computed. In the build chain that is image generation, and nothing else. Any new model call must name the interpretive question it answers.
8. **The theme never bleeds into the code.** The location is a PACK: `plan.json`, `voices.json` (materials in that world's language), `world.json` (era and medium sentences, the ruler and its height, refusal word lists). No room name, material, era, anchor height or vocabulary lives in `tools/`, `src/` or `design/plan-draft/measured/`. An unknown room refuses the pack; it never silently becomes another world.
9. **Two tracks with a wall between them.** Pack track: building a location is one command chain (`build packs/<name>`), judged only by the deterministic instruments; nothing on it spawns a row, a builder or a critic. Engine track: changing the pipeline; rows and critics stay, under clause 10.
10. **Caps.** A builder runs ≤40 assistant turns and ≤150k fresh tokens, reads a ≤10 KB slice of the corpus named in its brief, runs targeted tests in its loop and the full suite once at merge, and STOPS at the ceiling with a report. A finding spawns a clause (one named refusal or number with a before/after measurement), not a row; a row only when the same clause has failed twice.
11. **A rule only a reader can execute is not a rule.** Every written decision rule becomes a script with an exit code, or is deleted.
12. **Measure transitions, not polls.** The ledger records state changes; a loop that re-bakes an unchanged store is a defect.
