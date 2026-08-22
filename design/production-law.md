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
