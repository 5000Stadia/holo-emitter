# hospital-3 — step log (2026-08-30)

Rule for this log: every step, its wall-clock, its outcome, and — for anything that failed or hung — the cause and the fix that makes it not happen again. [Kabe, 2026-08-30] "check that as it deploys there are no hang ups or failed steps. If there are, do a bit of a report on them and collaborate how to execute cleanly on each step."

| # | step | time | outcome | hang-up / cause | fix (now in the tree) |
|---|---|---|---|---|---|
| 0 | author packs/hospital-3 (plan, pack, voices, world) from the cyberpunk template; standpoints by the validator's own law (K=0.25; threshold rule where a wall would not fit the lens) | ~1 Navigator turn | plan valid first try | — | — |
| 1 | derive-world --pack hospital-3 | <1 s | 3 locations, 4 exits, 12 lines | — | — |
| 2 | validate-plan --pack hospital-3 | <1 s | **validated the manor's plan** against the hospital's archetypes (22 findings) | `--pack` chose the voices, the default fixture dir stayed demo-study | validate-plan and validate-fixtures: `--pack` names the fixture dir |
| 2b | validate-fixtures --pack hospital-3 | <1 s | 1 finding: two doors into the treatment room shared one refusal line | derive-world's template named only the destination | the line names the door's own side too |
| 3 | make-scaffold --emit-manor --pack hospital-3 | 31 s → error | **30 s silent timeout**: the page never booted because fixtures/hospital-3/fixture.js was not baked | bake-fixtures had no `--pack` and the emitter waited on the page with no check | bake-fixtures takes `--pack`; the emitter refuses by name before launching a browser |
| 3b | bake-fixtures --pack hospital-3 | <1 s (after two Navigator slips: an unimported `resolve`, then a doubled absolute path) | fixture.js 15 kB | pack paths are already absolute | — |
| 3c | emit, first read of a prompt | 2 s | 12/12 packets; **leak**: the window sentence asked a 1995 hospital for "a plain chamfered stone surround… two stone mullions… a casement hung on iron hinges", head 2.00 m against the pack's 2.10 | window words lived in room-voices.mjs / frame-language.mjs; the scaffold's sill/head were literals in make-scaffold | `conventions.window` in every pack's world.json (surround by rank, mullion, transom, opening light); sill/head read from the pack; the register reads them through ctx |
| 3d | re-emit | 2 s | 12/12, prompt reads: steel frame, transom bars, top-hung vent, head 2.10 | — | — |
