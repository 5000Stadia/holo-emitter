# The two-room proof — KOWLOON-7, audited step by step

Live: https://5000stadia.github.io/holo-emitter/?world=cyberpunk-2 (noodle counter ⇄ back office).
Pack: `packs/cyberpunk-2/` (4 data files, ~300 lines). Painter: 8 images, one per wall, ~30 min wall-clock, sequential.
Rule for every step, from the Captain: did it succeed, and is it the cleanest, most efficient way — fewest turns, tokens and lines, no sacrifice.

| step | success | cleanest? | what it cost | what it exposed (fixed at source unless noted) |
|---|---|---|---|---|
| 0 parameterise (location = pack) | yes — manor 88/88 byte-identical; probe pack refused without a ruler | yes, and it was the one real engineering item | 2 capped builders, 129k + 139k tokens | 957 manor hits in code; 619 load-bearing; 4 remain listed in STATUS.md |
| 1 author the pack | yes — plan valid, 8 asks lint-clean, none of the manor's words, ink sheet correct | **not yet** — ~25 Navigator turns, most of them finding the last four places the engine assumed the manor | 0 model calls | validator's room-type list (now the pack's); fixture world hand-written (now `derive-world.mjs` from the plan); the page's two hard-coded world script tags (now loads the queried world); a fixture not knowing its pack (`pack.ref`). Residual: standpoints are typed then checked against a rule the engine knows — they should be derived |
| 2 cut the packets | yes — 8 packets, one roll each, two leads, six followers waiting | yes once three small leaks were moved to the pack (use-case line, the no-lettering sentence, the glazing sentence) | seconds | the emitter crashed on a location with no store yet |
| 3 paint | yes — 8/8 on brief: materials, ruler, door, window, tag, dead tube | yes — one model call per wall is the floor | 8 images, ~30 min | one leak seen in the pictures: 1660 diamond quarries in the back office's window (glazing sentence was engine text; moved to the pack) |
| 4 correct, don't re-ask | **yes — 8/8 promoted through the warp, 0 re-asks** (camera: 4 passed, 2 scale +8.8%, 2 scale +12%; 4 of the passes were refused by the horizon instrument and carried anyway) | yes — this is the step the whole audit was for | ~15 s/wall | three engine faults on the first run: the post-promotion validator pointed at the manor fixture; the snap read the manor manifest; the window-count gate refused two walls that plainly paint their window (now recorded, never gated, per audit step 7); a snap refusal ended the whole sweep (now one row) |
| 5 promote, bake, load | yes — fixture valid, 71 paintings baked, published | yes | ~40 s | `--emit-manor`'s name is the last theme word in a flag |
| 6 the Captain's look | pending | — | — | — |

## Numbers against the audit's forecast
- Forecast: ~12 images, ~30 min painter, <100k agent tokens for the build. Actual: **8 images** (1.0 per wall, the audit's manor rate was 4.3), ~30 min painter, and well over 100k Navigator tokens — spent on the engine faults above, not on the rooms. The second pack should cost what the forecast says; this one paid for the first.
- Deterministic compute per wall: measure ~4 s, warp ~15 s, promote <1 s.

## What is still not clean (honest list)
1. Standpoints in the plan are authored then validated; derive them.
2. The window read misses windows on bright walls (three times now); it is recorded, not gated, which is right for the page — the leaf sprite is simply not placed there.
3. The loop is still `--watch` polling machinery sized for the manor; a pack build should be one command (`build packs/<name>`) that runs emit → dispatch → measure → warp → promote → bake → publish and exits.
4. Two flags still say "manor" (`--emit-manor`, the seat's standing order paths); the watchdog counts only the manor's batches.
5. The painter is sequential; four painters would make a room ~5 minutes.

## After the Captain's look (2026-08-29)
- Two windows carried 1660 diamond quarries: the glazing sentence was engine text until mid-run. Pack fixed; both walls demoted (old paintings in `backdrops/source-demoted/`) and re-asked under the pack's wired safety glass.
- Exposed: there is no route to re-ask a PROMOTED wall for a look reason — the emitter refuses ("promoted since the state was written") and the supersede route only accepts consistency rolls. Add a plain `--reask <wall> --because "<sentence>"` that demotes, re-asks and lets the sweep supersede.
- back_office/S: the warp's reveal fill mirrored a band straight in from the frame edge (a zigzag of the foam grid). Ruling: extend each surface along its own receding lines toward the edge/corner it meets — B-FILL.
