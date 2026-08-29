# The method, audited step by step

**For: Kabe. Date: 2026-08-28. Read time: ~15 minutes.**

You asked whether we actually understand the problems, well enough that a *new* location — twenty cyberpunk rooms — could be built and loaded almost live, with the model called only where a model is unavoidable, and every other step deterministic and near-fail-proof.

Thirteen seats audited one step each against the repo's own ledgers. Seventy-nine specific changes were proposed. Two independent skeptics attacked each one with the code in front of them. **Zero of the seventy-nine survived both.** That result is the most useful thing in this document and I have not softened it. It does not mean the pipeline is fine. It means our *diagnoses* were mostly right and our *prescriptions* were mostly wrong in the same three ways every time: they understated the cost (a "one-line fix" touched twenty files), they cited a number that turned out to be an artifact of how we measured, or they proposed a fix the repo had already built and we had not noticed.

**The bottom line, in four sentences.**

1. The pipeline is not a function. There is no `build <location>` command. A second location cannot be started today without editing constants in dozens of files, and an unknown room does not error — it silently becomes a c.1660 oak-panelled parlour.
2. The image model is 54% of the wall-clock and ~99.8% of the money, and everything we spent engineering effort on is the other 0.2%.
3. The demo was expensive because our *development* method treats every finding as a project. One reworded sentence became a 1.1-million-token builder. That is the Mount Rushmore scalpel, and it is a process problem, not a code problem.
4. The honest floor for "almost live" is about **five to ten minutes per room** on today's painter, and roughly **an hour for twenty rooms with four painters running**. Not seconds. The image model is the floor and no amount of our code changes it.

---

## Glossary (the jargon, once)

| Term | What it means |
|---|---|
| **plan** | `plan.json` — the building as rectangles, openings, windows, stairs. The document everything else derives from. |
| **facing** | One wall as seen from one standpoint. 22 rooms × 4 compass directions = 88 facings. |
| **packet / ask** | The order handed to the painter: a prompt, a line drawing, reference images, a save path. |
| **painter / the seat** | An LLM agent in a terminal session that generates the images. We have no image API key, so this agent *is* the image call. |
| **candidate / roll** | One returned image. Several per wall. |
| **the gate** | Code that measures the returned picture and decides whether it may enter the store. |
| **promote** | Move an admitted picture into `backdrops/<room>/<facing>.png` plus a metadata file the page reads. |
| **snap** | Row 35's deterministic warp: re-project a returned picture onto the camera we declared. Fixes geometry, cannot fix content. |
| **bake** | Re-encode the whole store into one JavaScript file the page loads. |
| **row** | A numbered work item in `intention.md`. **Builder** = an agent given a row. **critic** = an agent paid to attack a builder's work. **Navigator** = the seat that allocates rows and merges. |

---

# Part 1 — The method, step by step

Pipeline order. Each step: what it must guarantee, the verdict, the numbers, the fix in plain English, and what a cyberpunk pack trips.

## Summary table

| # | Step | Verdict | The one-line reason |
|---|---|---|---|
| 1 | The plan (geometry) | **KEEP, parameterise** | The only genuinely deterministic, genuinely load-bearing step. It is not the problem. |
| 2 | Materials / voices | **CHANGE** | 1,555 lines of 1660s English prose keyed to manor room names, with a silent fallback that hands any unknown room oak panelling. |
| 3 | The emitter (cut the packet) | **CHANGE** | Good composition; it fails by *omission* and by being unreachable once a wall is painted. |
| 4 | The painter | **KEEP the call, DELETE the agent around it** | An LLM running a for-loop. 70% first-roll camera accuracy is the ceiling; three experiments proved prompts can't move it. |
| 5 | Measurement (the camera gate) | **CHANGE: sensor, not judge** | Every camera failure is within 18% of target and deterministically correctable. We re-asked instead. |
| 6 | The exits (rescue lanes) | **MERGE / mostly DELETE** | ~6,000 lines, 25 minutes of machine time, three walls rescued. |
| 7 | Content reads (doors/windows/stairs) | **CHANGE / MERGE** | Door reading earns its place. Window reading governs one wall of sixty-one and its only two refusals were both wrong. |
| 8 | Store & promotion | **KEEP the rule, CHANGE the plumbing** | The promotion rule is right. Committing the store to git created a whole subsystem to police its own exhaust. |
| 9 | The page | **KEEP the logic, CHANGE the delivery** | The renderer is correct. It ships behind a 39 MB blocking script. |
| 10 | Room coherence | **CHANGE: build it, don't detect it** | 45 model calls repaired two rooms and none of the three you named. |
| 11 | The loop & ops | **CHANGE: terminate** | Half the loop's life is re-baking a store that changed 96 times in 5,400 passes. |
| 12 | The development method | **SPLIT** | The unit of work is a "row"; the unit of the product is a clause. That mismatch is the bill. |

---

## 1. The plan — a location authored as geometry

**Must guarantee:** every facing a player can stand on is paintable and measurable *before* a token is spent — standpoint, wall width, distance, carriers and camera all derived from a handful of authored rectangles, so the ask, the drawing, the gate, the click targets and the navigation graph read one number and cannot disagree.

**Verdict: KEEP.** This is the best machinery in the repo. All 88 facings derive from room rectangles plus two scalars; the whole plan validates in 132 ms; zero standpoints are hand-frozen. Nothing here needs deleting.

**Failure modes with numbers.** The validator emits **22 warnings and 0 blocking findings** on the shipped plan, and two of those warnings — `hall/N` and `hall/S`, an 8 m wall seen from 2.15 m — were dispatched anyway and held after 2 attempts each. That is **4 wasted image calls out of 283**. We proposed promoting all warnings to refusals; both skeptics killed it, correctly: 9 of the 14 facing-level warnings name walls that **promoted successfully**, and 16 of the 21 held walls carry no warning at all. The warnings *anti-predict* failure. The validator's own comment says it: *"A validator that refused them would refuse the plan Kabe signed."*

The real residue here is small and honest: two eye heights coexist in the project (1.183 m measured off one manor painting, versus 1.83 m in the contract), and `world.json` re-states the plan's topology by hand — 56 exits, 28 door ids each used exactly twice. Both are ruled and defensible today; neither costs image calls.

**Near-100%:** it already is. The step's problem is not correctness, it is that the location is a **path constant**, not an argument.

**Cyberpunk trips:** rooms must be axis-aligned rectangles with exactly four compass facings — no L-shaped atrium, no diagonal wall, no hexagonal shaft, not as a warning but as an impossibility. One ceiling height per floor (no double-height atrium, no crawl deck). Room types are `chamber/hall/corridor/service/stair/open` and wall kinds are `exterior/partition/garden` — "garden" is a first-class wall kind. The approval lock is pinned to the specific drawings you signed on 2026-08-21 and will print `UNAPPROVED REVISION` for any new location by construction.

## 2. Materials / voices — what to paint

**Must guarantee:** all four walls of one room are commissioned from one set of surfaces, so turning 360° shows one room.

**Verdict: CHANGE.** This is where your two loudest complaints live ("is every room in this house parlor walls?", "I have one room as you turn ceiling floor and wall change").

**Numbers.** 84 of 88 facings resolve their materials via the **literal manor room name**. A synthetic cyberpunk plan run through the same function returns: `server_vault` → *dark hand-finished oak wall panelling*; `noodle_bar` → *oak fielded bays with a carved frieze*; `rooftop_pad` → *weathered red brick in English bond*. **No error is raised.** The materials table also landed **seven hours after** all 85 packets were already emitted, and the emitter skips any facing that already has an image on disk — so 42 of 86 committed prompts still say "dark hand-finished oak wall panelling", including the kitchen, the buttery and the servants' hall. Repair bill: **48 of 123 retry packets (39%)**.

**Near-100% in plain English:** the era, the medium sentence, the room voices, the ruler and the refusal word-lists should be a *file that ships with the location*, not literals in the code. Then a wrong material is impossible before an image exists, and an unknown room fails loudly instead of quietly becoming a manor.

The skeptics correctly killed the version of this that said "make voiceFor throw": the suite *already* asserts no facing falls back, and the silent fallback is what lets a new location run end-to-end for a first look. The correct change is smaller: **the table becomes pack data; the code keeps its fallback but the pack must declare its own vocabulary or the pack is refused, not the room.**

**Cyberpunk trips:** every anchor (the horizontal feature the camera is measured against) is a 0.95 m piece of English joinery — chair rail, dado capping, hanging rail, string course, coping. Window sill 0.90 m, head 2.00 m, justified in a comment by "an English mullioned window of this date". A heraldry ration policing which rooms may show coats of arms. A word list (`panelling|wainscot|dado|hearth…`) that is the *only* guard preventing an interior fabric being asked for an outdoor wall — it would catch nothing in a cyberpunk pack.

## 3. The emitter — how a packet is cut

**Must guarantee:** one facing becomes a self-contained deterministic order a painter can execute without judgment.

**Verdict: CHANGE.** The composition is genuinely good: use-case line, the ruler and its metres, the correction from the last attempt, the materials, the carriers with dimensions, the composition in words, an ink-on-paper line drawing rendered at the facing's real geometry, and reference images with stated roles.

**How it actually fails: by omission, and by being unreachable.** Four closed ledger entries, each the same shape — the gate measured something the ask never mentioned:
- open facings got no far-distance number → 16 candidates unreadable, 4 walls burned their whole retry budget on a crash in *our* arithmetic;
- the plan's staircases reached the renderer, the validator and the refusal clause but never the prompt → 6 walls were painted from an ask that never mentioned a staircase, obeyed it, and were refused for obeying;
- two doors printed one identical sentence twice → 2 walls came back with fewer holes.

That is roughly **28 wall-asks, ~10% of the run**, spent on defects in our own order. The ledger's own verdict on the painter: *"nothing is left for the painter to have disobeyed."*

**Near-100%:** run the pre-flight lint at the moment the packet is written (today it exists and no emitter path calls it — 211 of 211 packets were dispatched unlinted, though the test suite does check them afterwards); and make the packet a machine-readable contract executed by a forty-line client instead of English prose read by an agent.

**Cyberpunk trips:** the code throws unless the anchor is exactly 0.95 m. Every prompt says "circa-1660 English manor" and asks for "a high-realism oil painting in the manner of a seventeenth-century Dutch or English interior… cool ambient daylight". Carriers are door, window, fireplace and (bolted on late) stair — a hatch, a vent, a holo-panel or a blast door has no kind, no sentence and no detector.

## 4. The painter — the one unavoidable model call

**Must guarantee:** one packet becomes one 1536×1024 painting of that wall.

**Verdict: KEEP the image call. DELETE the agent wrapped around it.** The standing order in `backdrops/AGENTS.md` is ten lines telling an LLM to loop over a worklist and call image generation. That is an LLM doing a `for` loop. It costs us a watchdog, a nudge timer, and total blindness — **all 232 generation records are reconstructed from file timestamps** because the seat is external and leaves the file as its only clock.

**The ceiling is real and we have paid to prove it.** First-roll camera accuracy is **70%** (14/20 on the incumbent prompt register). Three controlled prompt experiments — 24 rolls, 68 rolls, 18 rolls, ~110 in total — produced **no measurable separation at all** (best p = 0.243 against a required 0.017–0.033; one report states outright "at this n, no result could clear the discipline"). A diffusion-family model has no mechanism to honour "one metre spans 171 pixels". **Better sentences are not the lever, and we should stop paying for that experiment.**

**What the model *can* do, evidenced:** take a reference image and reproduce its fabric. Row 38's seam pilot: a seeded seam scored 11.74 against 18.55 unseeded, **−37%**. And the counterpart finding, learned three separate times: *an image reference carries everything in it*. The garden wall asked in words for "weathered ashlar and open sky" came back as dark oak wainscot, because the reference picture had wainscot in it. A sentence asking the model to take half a photograph loses to the photograph.

**Near-100%:** not reachable through the painter. Reachable by making failure cheap: snap every return onto the declared camera and gate on what's left; and run more than one painter.

**Note the correction:** the audits reported a 41.9-minute queue per packet and a 9.58-hour wait before measurement. **Both are artifacts.** The 232 rolls were generated inside a 9.5-hour window and their timestamp-derived durations overlap 178-deep — meaning the real throughput was about **2.5 minutes per returned image on one seat**, matching your own observation of ~3 min/return. The huge queue figures measure our polling, not the model.

## 5. Measurement — the camera instrument

**Must guarantee:** recover, from the painting alone, pixels-per-metre and the horizon, so sprites composite at the right size and depth.

**Verdict: CHANGE — demote from judge to sensor.**

**Numbers.** 409 readings: 286 pass, 118 fail. **Every single failing reading is within 18.2% of target**, median 12.25%, with errors symmetric in both directions — scatter, not a bias. Not one catastrophic wall. Yet the code stamps `generation_miss` on all 118: the ledger names the painter guilty by construction, when a homography would fix every one of them on a plane.

The instrument has also been caught in both directions on unchanged pixels: changing only the corner rule and the error bar took 58 holds down to 18, and a blind re-run found **3 of 19 previously promoted walls did not reproduce** — the old instrument reporting a horizon it had never actually fitted.

**Process cost:** the same 336 candidates were re-measured **16,841 times** — a median of 42 re-reads each, 20.26 hours of compute for about 24 minutes of distinct work. That was fixed three days ago by caching, after a pass failed to finish in two hours.

**Near-100%:** the measurement feeds the warp; the warp corrects; only what the warp *refuses* buys a new image. This is your own single-return doctrine from 2026-08-24, taken literally. Honest caveat the skeptics supplied: on the current corpus the snap ran on 32 walls and only **5 came back clean**. So the snap is necessary and not sufficient — it must be fed a *warpable* frame, which is an emitter and standpoint question, not a rescue question.

**Cyberpunk trips:** scale is read off a painted horizontal at 0.95 m. A corridor with no wall trim gives the instrument nothing to read, and the pre-flight lint refuses any prompt whose ruler is not one of ten manor features. This is the deepest coupling in the whole pipeline. The model also assumes an enclosed one-point interior with two receding side walls and a flat ceiling — a plaza, an atrium, or a corridor seen down its length has none.

## 6. The exits — the rescue lanes

**Must guarantee:** a wall whose camera passed but whose promotion was refused gets one deterministic, no-model chance before it ships as blank grid.

**Verdict: MERGE the useful part; delete the rest.**

**Numbers that settle it.** The routing has fired **13 times ever**: 1 snapped-and-repaired, 1 tolerated, **11 fell through to grid**. And all 11 died on *content*, not geometry — four because the ask never named a staircase, four on an opening 1.5–1.8× the ruled width, two because no way through was painted. **Not one died of anything the rescue lanes exist to fix.** Approximately 6,000 lines of code and about **25 minutes of total machine time** bought three walls.

**Near-100%:** the fix is upstream, in the ask. Keep the door-void repair — it is the one place deterministic code replaces a model call, and it is 2 for 2.

**Cyberpunk trips:** the warp assumes a one-point rectangular box with the vanishing point inside the wall rectangle — an atrium, mezzanine, sloped ceiling or curved wall has no box and the lane is simply closed. The reveal budget is justified in the file by the manor's *plain limewashed ceilings* and says outright that "on anything patterned [it] would be a streak" — a neon-panelled or ducted ceiling is exactly that case. The tolerance lane's authority is a text search for a dated sentence you wrote about the manor.

## 7. Content reads — doors, windows, stairs

**Must guarantee:** every clickable rectangle sits on the pixels the painter actually drew that feature at.

**Verdict: CHANGE, with a MERGE inside it.** Door reading earned its place: 23 of 27 measured door rectangles agree with the painting within 6%, and it fixed a defect you saw. **Window reading is theatre by the numbers**: it governs **one** promoted wall out of sixty-one, 756 lines plus tests plus two builders, and **both refusals it has ever issued were false** — a brightness threshold misreading a limewash wall as having no window.

Four of 27 door rectangles are wrong and shipped anyway (one is two-thirds of the doorway the painter drew — a door leaf standing inside a wider hole), and the renderer, in its own words, "has no way to tell a good measurement from a bad one".

**Process:** 105,246 of 105,311 promotion decisions in the ledger are refusals, and one wall was re-refused with the same sentence about the same unchanged image **5,415 times**.

**Near-100%:** merge the two detectors into one (they are the same arithmetic with the inequality flipped), demote them from gates to verifiers, and on a miss fall back to the plan's rectangle with a flag rather than burning a fresh image.

**Cyberpunk trips:** a door is detected as *a dark hole you see through* — a neon-lit portal or a backlit hatch is invisible by construction (we already demoted a manor wall for having a lit room behind its doorway). A window is detected by **leaded lattice periodicity plus an absolute brightness lift** — frameless glass, an LED curtain wall or a strip viewport scores zero. Sizes are clamped to 2.00 m door heads and 0.90–2.00 m window bands.

## 8. Store and promotion

**Must guarantee:** exactly one admitted painting per facing, carrying numbers no human typed.

**Verdict: KEEP the rule, CHANGE the plumbing.** "Admitted is decided by code, and the metadata is derived not typed" is right and should carry to every future location.

**Numbers.** `.git` is **2.5 GB**. One generated file — the baked page bundle, 39.4 MB — accounts for roughly 628 MB across 24 committed versions of itself. Because generated files are committed and a loop rewrites them, we built a 1,318-line freshness checker, a state file for it, a publish pre-flight, ~67 test cases, and spawned a builder whose entire job is compressing a log that exceeded GitHub's warning threshold. **We are paying a builder to compress our own exhaust.**

**Near-100%:** the store and every generated artifact live outside git, addressed by content hash, with a small tracked manifest. Freshness stops being a question. (The skeptics rightly note this is a build's worth of wiring, not a flag, and that two real guards would have to be re-homed — but the direction survives.)

## 9. The page

**Must guarantee:** a wall's picture and numbers become a place you can stand in and click, with no network calls.

**Verdict: KEEP the logic, CHANGE the delivery.** The geometry is sound; 100% of the 56 exits are clickable; 27 of 88 facings ship with no painting at all and are fully walkable. That last fact matters: **playability does not depend on the painting.**

**Numbers.** First paint waits for a **39.4 MB blocking script** and 61 JPEG decodes for a player standing on one wall. 28% of the shipped metadata is provenance the renderer never reads. Eight of 52 doorways show a smear instead of a room (three of them show a single flat colour). And there are **919 browser tests, 31,842 lines — a 4.7:1 test-to-code ratio — over a world containing two objects.**

**Cyberpunk trips:** the grid fallback drawn on every unpainted facing hard-codes a 1.183 m eye, a 2.8 m storey and a candlelit-oak palette measured off one manor painting. Aperture kinds are door/threshold/stair/window only. The procedural placeholder art is ten 1640–1700 English objects — a joined oak desk, a brass candlestick, an iron key.

## 10. Room coherence

**Must guarantee:** turning 360° in one room shows one room.

**Verdict: CHANGE — produce coherence, don't detect it.**

**Numbers.** The repair loop cut 48 packets, spent 45 fresh images, and **two rooms crossed the threshold**. Of the three rooms you named by eye: master bedchamber 4.474 → 4.144 after four repaints (threshold 3.75); guest chamber unchanged at 8.960 after five; garden room 6.208 → 3.904. Three repaints made rooms **worse** (one went 8.96 → 12.15). And 86% of the repair refusals came from the *camera* gate, not the coherence judgement — a coherence repair inherits the 70% camera pass rate multiplicatively.

The decisive measurement: master bedchamber's east and north ceilings, painted from **one identical instruction**, matched almost exactly in colour and differed 3.1× in contrast. **Words cannot pin texture.** That is why the fabric has to arrive as a picture of that room's own wall — which is exactly what rows 38 and 42 already built.

**Cyberpunk trips:** the measure needs a flat ceiling, a floor below the wall and two visible corners — all four outdoor manor rooms are already unmeasurable, and a cyberpunk pack of streets, plazas and rooftops is mostly outdoors. Brightness is deliberately given zero weight ("a wall beside a window is not a different wall") — in a neon pack the light *is* the material and that law inverts.

## 11. The loop and ops

**Must guarantee:** every frame that lands is measured, decided and baked exactly once, with nobody typing a command.

**Verdict: CHANGE — make it terminate.**

**Numbers.** 5,429 sweep passes totalling **53.2 hours**, of which **26.8 hours is baking**. The bake guard is defeated by two deliberately fenced walls that are counted as "promoted" every pass, so the entire store is re-encoded every 45 seconds forever. In the last 24 hours the loop ran 1,276 passes, wrote 47,216 ledger records, and produced **zero promotions** — the manor is finished and the daemon has no terminal state and cannot tell.

**Near-100%:** a location build is a finite job — emit, paint, measure, correct, promote, bake once, exit. Content-addressed caching makes a re-run cost only what changed and a crash resume for free. The watchdog shrinks to "is a worker alive and is the queue draining".

**Cyberpunk trips:** the standing paint order is ~900 characters of manor prose inside a shell script; the unpublished-work counter globs `backdrops/*/[NESW].png`; the readings glob a directory literally named `manor`; the tolerance lane only exists if a specific sentence appears in the approvals log.

## 12. The development method itself

**Must guarantee:** a correction survives the agent who made it — the fix lands in the emitter or the gate so the *next* location gets it free.

**Verdict: SPLIT.** That guarantee is necessary. The rows/critics/worktrees loop around it is *engine development*, and a location build must never enter it. See Part 3.

---

# Part 2 — The distilled chain

The shortest honest path from a location pack to a playable site. One model call per wall. Everything else deterministic.

```
pack/  =  plan.json   (rectangles, openings, windows, stairs)
        + voices.json (materials per room, in that world's language)
        + world.json  (era sentence, medium sentence, the ruler:
                       a named continuous horizontal and its height)

1  validate    refuse a pack whose facing has no standpoint or no ruler   ~0.1 s / room
2  project     carriers, wall width, pixels-per-metre, standpoint          0.17 s / facing
3  scaffold    the ink-on-paper line drawing, deterministic raster         included above
4  compose     the prompt, from voices + ruler + carriers                  0.03 s / packet
5  PAINT       >>> the one model call <<<                                  ~2.5 min / wall
6  correct     measure the ruler, then warp onto the declared camera        4.3 s + 15 s
7  promote     write the picture and its derived numbers                    0.12 s
8  emit        one image file + one line in a manifest                      ~0.3 s
```

**Where the model sits:** step 5 only. Steps 1–4 and 6–8 contain no model call today and need none.

**What is parallel.** The dependency graph is two deep. Inside a room, one wall is painted first (the one carrying the most doors and windows), then the other three are painted using a picture derived from it — that is what stops the four walls disagreeing. Across rooms, everything is parallel.

```
room 1:  [lead] ──► [w2] [w3] [w4]
room 2:  [lead] ──► [w2] [w3] [w4]      all rooms run at once
...
```

**Honest wall-clock.** Measured: 232 images were delivered in a 9.5-hour window on one painter — **~2.5 minutes per returned image**. Today we realise **4.29 images per wall** (369 candidates over 89 wall directories); if the warp absorbs the geometry misses that should fall to roughly 1.5–2.

| Scenario | Images/wall | One painter | Four painters |
|---|---|---|---|
| **One room (4 walls), today's retry rate** | 4.3 | ~43 min | ~15 min (2 waves) |
| **One room, warp absorbs camera misses** | ~1.5 | ~15 min | **~5–6 min** |
| **20 cyberpunk rooms (80 walls), today's rate** | 4.3 | ~14 h | **~3.6 h** |
| **20 rooms, warp absorbs camera misses** | ~1.5 | ~5 h | **~1.2 h** |

Deterministic compute for 80 walls is about **six minutes total**. Everything else is the model.

**So "almost live" means five to ten minutes per room, and about an hour for a twenty-room block with four painters.** Not seconds. If you want seconds, the only lever is more painters in parallel, and that needs either an image API key or several painter sessions — which is a decision for you, not for us.

Two caveats stated plainly: the actual observed figure today is **7.2 hours per room** end-to-end, and essentially all of that gap is our polling loop and one-at-a-time dispatch, not the model. And this chain assumes the ruler problem is solved for the new setting — see Part 4, step 1.

---

# Part 3 — The process verdict

## Why the demo cost what it did

| Where the effort went | Measured |
|---|---|
| Image generation | 232 rolls, ~2.5 min each — **99.8% of the money, 54% of the clock** |
| Our deterministic code, useful | ~6 min of necessary work per 80 walls |
| Our deterministic code, actually burned | **133 hours** — re-measuring, re-refusing, re-baking |
| The loop | 5,429 passes, 26.8 h of them re-baking an unchanged store |
| The ledger | 221,235 records / 74 MB, ~950 telemetry rows **per image made** |
| Design prose | 553,652 added lines in `design/` vs **5,656** in `src/` |
| Tests | 739 test declarations × 2 browsers over a 4,900-line client |
| Rows | 32 open, next id 44 — **12 of 43 closed**; rows 4, 5 and 6 (the demo's own asset production, acceptance and Done) are still open at row 43 |
| Miss ledger | 76 entries, **59 open, 12 closed (16%)** — so the law's own licence for "lengthy checking at first" has never expired |
| Main-line commits since 08-24 | 62, of which **36 are pure bookkeeping** (tick notes and registry edits) |

**The mechanism, stated once.** Every finding became a row. Every row became a builder given the entire design corpus (`architecture.md` alone is 89,000 words). Every builder ran 200–600 turns with the full two-browser suite *inside* its loop. Every merge bought a critic pair costing several million tokens each. Four representative re-fixes: a reworded materials sentence cost **1.16M tokens over 234 turns and 8 full suite runs**; a brightness threshold cost **1.32M**, was killed by a usage limit, and needed a takeover builder; a line-drawing fix cost **2.19M over 479 turns**; a stale-file fix cost **5.12M over 585 turns and 26 suite runs**, of which only ~141k tokens were actual tool results — the rest was re-reading the design corpus every turn.

**Cost ≈ turns × corpus.** The corpus is 942 KB. That is the whole bill.

## The development rules that replace it

**Rule 1 — Two tracks, with a wall between them.**
- *Pack track* (building a location): no rows, no builders, no critics, no spec documents. One command chain. The only judges are the deterministic instruments that already exist. Nothing here is allowed to spawn a row.
- *Engine track* (changing the pipeline): rows and critics stay, under budgets.

**Rule 2 — What a finding may spawn.** A finding spawns a **clause**, not a row: one named refusal or one number, landed in the emitter or the gate, with a before/after measurement. A finding may only become a row if the same clause has failed twice. Today the unit of work is a row and the unit of the product is a clause; that mismatch is the cost.

**Rule 3 — When a builder is allowed.** Only when a fix cannot be expressed as a clause. A builder gets a hard ceiling: **≤40 assistant turns, ≤150k fresh tokens**, a ≤10 KB slice of the architecture document rather than the whole thing, and the targeted tests in its loop with the full two-browser suite run **once, at merge**. A builder that hits the ceiling reports and stops. (Caveat the skeptics found: mandatory onboarding reading alone is ~57k tokens, so the real ceiling has to be set against a *reduced* onboarding set, or the ceiling just multiplies re-boarding. Split the corpus first, then set the ceiling.)

**Rule 4 — Every written decision rule becomes a script with an exit code,** or it is deleted. Today the rule "revert the prompt register if it underperforms after 20 returns across 5 rooms" is a sentence in a report. A rule only a reader can execute is not a rule. (Honest note: that particular rule has *not* been violated — 8 returns in one room is below its own threshold. The point stands generally.)

**Rule 5 — What gets deleted from the corpus.** The row list stops growing while the demo's own rows 4/5/6 are open. `architecture.md` splits per component. Spec documents written to be deleted stop being written for pack work. Prompt A/B machinery retires: ~110 rolls across three trials produced no separation, and by our own law apparatus that moves neither accuracy nor speed must argue for its life.

**Rule 6 — Stop measuring ourselves so hard.** 950 telemetry rows per image is not measurement, it is noise. Record state transitions, not polls.

---

# Part 4 — The two-room proof

Two cyberpunk rooms, end to end, deliberately small. **No new instruments.** Every step below reuses machinery that exists; what changes is that the location becomes an argument instead of a constant.

### Step 0 — Parameterise (engine work, done once)
Replace the hard-coded manor paths and constants with a pack argument: the plan path, the batch directory, the room-voice table, the era and medium sentences, the ruler and its height, and the refusal word lists. **Prove:** the manor still builds byte-identically from `build packs/manor`. **Accept:** the full suite green and the committed store unchanged. **Cost:** this is the one genuine engineering item — bound it to two builders at the Rule 3 ceiling, ~300–600k tokens, one day.

### Step 1 — Author the pack (no model call needed)
`plan.json`: 2 rooms, 8 facings, the openings between them, one window each. `voices.json`: 2 room voices in cyberpunk language. `world.json`: the era sentence, the medium sentence, and **the ruler** — the single hardest item. The manor's ruler is a chair rail at 0.95 m. A cyberpunk room needs an equivalent: a named continuous horizontal at a stated height that the painter will reliably draw and the instrument can find. Candidates already whitelisted: a door head at 2.00 m; a floor-to-wall junction. **Prove:** the validator accepts the pack and the drawing renders. **Accept:** 0 findings; a human look at the derived sheet. **Cost:** ~2 hours of authoring, 0 tokens.

### Step 2 — Cut 8 packets
**Prove:** the pre-flight lint passes all 8 *at the moment they are written*, and no prompt contains the word "manor", "oak", "wainscot" or "seventeenth-century". **Accept:** 8 packets, 0 lint refusals. **Cost:** seconds, 0 tokens.

### Step 3 — Paint, lead-first
2 lead walls, then 6 followers seeded from their room's lead. **Prove:** the model draws the declared ruler, and a follower reproduces its lead's fabric. **Accept:** the instrument finds the ruler on ≥6 of 8; the room-coherence measure scores both rooms under threshold on the wall bands. **Cost:** ~12 images at today's retry rate (8 first asks + ~4 retries), **~30 minutes on one painter, ~12 minutes on four.**

### Step 4 — Correct, don't re-ask
Warp every return onto its declared camera. **Prove:** the camera failures are absorbed rather than re-asked. **Accept:** ≥6 of 8 walls promote without a second ask; every re-ask carries a named refusal clause. **Cost:** ~15 s/wall, 0 tokens.

### Step 5 — Promote, bake, load
**Prove:** the page is walkable, every exit clickable, no facing shows a smear. **Accept:** both rooms walkable; all exits resolve; first paint under 4 s. **Cost:** ~30 s, 0 tokens.

### Step 6 — Your look
The flip test. **Accept:** you can turn 360° in each room and see one room; nothing reads as a sticker. **This is the only human gate and it is the one that matters.**

### Totals

| | Expected |
|---|---|
| Model calls | **~12 images** (plus 0–1 text calls if a model drafts the plan) |
| Painter wall-clock | **~30 min** on one painter; **~12 min** on four |
| Deterministic compute | **< 2 minutes** |
| Agent tokens, steps 1–6 | **< 100k** — this is a command chain, not a project |
| Agent tokens, step 0 (one-off) | **300–600k**, bounded |
| Elapsed, start to your look | **half a day**, dominated by step 0 |

**What this proves, and what it does not.** It proves the pipeline is a function, that a new setting can be authored as data, and that we have an honest per-room clock. It does *not* prove twenty rooms scale linearly — outdoor and multi-height spaces are where the camera instrument is blind, and two enclosed rooms will not surface that. **If two rooms pass, the next test is two outdoor rooms, not twenty of anything.**

---

# Part 5 — What was refuted, and why

Seventy-nine proposals, two skeptics each, zero survivors. The most important rejections, so you can see what we tried and why it failed:

1. **"Block the plan's 22 warnings."** Refuted: 9 of the 14 facing-level warnings sit on walls that promoted successfully, and 16 of 21 held walls carry no warning. The warnings anti-predict failure. Recoverable waste was 4 image calls, not 26.
2. **"Generate the navigation graph from the plan."** Refuted: the same plan already backs two different worlds (a 22-room walkable manor and a 2-room demo where drawn doors are deliberately not walkable). A generator can emit one, not both.
3. **"Give the loop an image API key."** Refuted: you ruled this out yourself on 2026-08-19 — *"NO API key. Stand up a Codex instance as the standing asset hand instead."* The parallelism goal must be met with several painter sessions, not a key, unless you reverse that.
4. **"Composite every door and window instead of painting them."** Refuted: row 42 is your own later ruling that walls are painted whole and the painting decides where apertures are — and you rejected the assembled version by eye ("dogwater… runs off the corner and doesnt complete").
5. **"Snap every return unconditionally."** Refuted on evidence: of 32 walls warped, only 5 came back clean, and 22 more were refused before any warp. The warp is necessary, not sufficient.
6. **"Freeze the prompt register; the new one is losing 3/8 to 70%."** Refuted: all 8 of those returns are on one hard room, and matched wall-for-wall the two registers tie. The written revert rule requires 20 returns across 5 rooms and has not been reached.
7. **"Cache promotion refusals by image hash."** Refuted: a refusal is not a pure function of the image — it also reads the plan, the materials table and an amnesty ledger. Caching it would freeze good walls out permanently.
8. **"Delete the registry and the two-hour tick."** Refuted: the tick's own proposals *did* land (the stale-seat window really was cut from 900 s to 300 s), and you commissioned the registry verbatim — *"Internal IDs, so I can reference them to you when there's an issue."*
9. **Several headline numbers were themselves artifacts.** The 41.9-minute packet queue and the 9.58-hour measurement wait are reconstructions from file timestamps that were later overwritten; the loop's "105 hours of re-work" double-counts nested timers. Real painter throughput is ~2.5 min per image. **We were partly auditing our own instrument.**

**What survived every attack** — and is therefore what to act on:

- The location is a path constant, not an argument. A cyberpunk room silently becomes an oak-panelled parlour.
- Prompt engineering is exhausted; ~110 rolls of A/B separated nothing.
- The camera measure should feed a correction, not a refusal — your own single-return doctrine.
- The loop never terminates and half its life is re-baking an unchanged store.
- The store lives in git and we built a subsystem to police its own exhaust.
- Our development method spends millions of tokens per one-line fix, and 73% of recent main-line commits are bookkeeping.
