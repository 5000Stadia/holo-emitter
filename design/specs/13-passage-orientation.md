# Row 13 — passage maintains orientation

## Plan (revised after plan-critic pass 1 and artifact-critic pass 1)

1. **Fixture.** `fixtures/demo-study/world.json`'s two exits' `arrive_facing` continue the
   direction of travel: `door_study_hall` (study, facing E) arrives **E**; `door_hall_study` (hall,
   facing W) arrives **W**. Rebaked.

2. **Narration.** `go.door_study_hall.arrive` no longer claims the player "comes about to face the
   doorway" — rewritten to describe continuing motion, mirrored byte-for-byte into
   `design/surface-strings.md`'s `go.door_study_hall.arrive` row (identified by string key, not
   position). `go.door_hall_study.arrive` makes no facing claim and is left as authored.

3. **Blueprint.** §3's JSON block is edited to the values above (not merely footnoted); §12.1's
   acceptance script names the two turn-back steps and why each checks a pre-passage reference.
   **Artifact-critic F2**: this agreement was previously enforced by nothing — a builder could edit
   either file out of step and the whole suite stayed green. `tests/playwright/fixtures.spec.mjs`
   now parses §3's fenced JSON block (hard-failing if the heading or fence cannot be found — the
   same discipline `surface-strings.md`'s own parser states) and asserts its exits' `from`/`facing`
   /`to`/`arrive_facing`/`via` equal `world.json`'s, by id. Verified to actually catch the critic's
   own repro (mutating the block to `"S"`/`"N"` turns it red) before being reverted.

4. **The [HUMAN] ruling itself, enforced (artifact-critic F3).** The critic built a fixture whose
   exits arrived 90° off the direction of travel in both directions and the validator said `valid`
   — `tools/validate-fixtures.mjs` checked only that `arrive_facing` names *a* facing of the target,
   never that it continues travel. Added: `arrive_facing === facing` is now a hard validator finding
   (blueprint §3's rule, enforced unconditionally, since no exit anywhere in this schema declares
   the "unless the world's own fiction demands a turn" exception blueprint's own text names — the
   comment at the check says explicitly that this is the exception's future insertion point, not a
   rewrite, when one is ever authored). Two new red cases in `validator.spec.mjs`, one per exit
   direction (a swap bug that fixed one direction and not the other would otherwise pass).

5. **The double-click echo guard: deleted, not documented as residue (artifact-critic F4).** Pass 1
   kept the guard (`lastGo`, `DOUBLE_CLICK_MS`, both call sites in `index.html`) as "shipped
   defense, unexercised by any test." The critic showed this is worse than it sounds: deleting
   *either* the swallow or its clearing independently leaves the full suite green, and the two
   tests named for the mechanism ("travelling twice on purpose is not the same as travelling twice
   by accident") don't discriminate it either — one passes only because two keypresses plus a click
   happen to exceed 400ms of wall-clock on the test machine, the other via an explicit
   `waitForTimeout` that never touches the window. A doctored fixture that actually exercises the
   branch was attempted and abandoned: `tools/validate-fixtures.mjs`'s named-overlap-pair check
   (`OVERLAP_PAIRS = [["chair1","desk1"],["stick1","shelf1"]]`) is hardcoded to those four M0
   entity ids, so any fully independent fixture must also carry dummy versions of them staged and
   overlapping just to validate — disproportionate scaffolding for testing an input-timing guard,
   and itself a code smell (a validator finding masking the wrong thing). Combined with point 4
   above closing the only route ("a future world's geometry") the guard was being kept open for,
   the code, the constant and both call sites are deleted from `index.html`. The two tests that
   existed only to describe the guard are rewritten to test what remains genuinely true — repeated
   real passages, back-to-back, with no timing window between them, all succeed and every input
   produces an envelope — under an honest describe-block name ("crossing a door more than once in a
   row"), one test extended to a third consecutive passage rather than kept as a near-duplicate
   `waitForTimeout` case. `design/architecture.md`'s veil/echo paragraph and Known-limits list are
   rewritten to describe a removal, with the reasoning, not a kept-but-untested mechanism.

6. **Arrival and persistence, made non-tautological (plan-critic F3/F4, still true after pass 2).**
   Both look-backs compare against references captured **before** the passage — a live-captured
   frame of the departure room for the return trip, a frozen world snapshot rendered independently
   for the outbound one — never a same-run re-render of the live post-arrival world, which a
   silent state reset during `go` would still agree with. Each arrival frame (before any look-back)
   is independently checked against a literal-viewstate solo render, so `viewstate` and the actual
   pixels cannot silently diverge.

7. **Narration-line assertions decoupled from prose wording (plan-critic F7).** The double-click
   test counts arrival lines against the fixture's own two `go.*.arrive` strings
   (`window.HOLO_FIXTURE.narration.lines[...]`), not a guessed substring.

8. **Findings carried forward rather than fixed here, each with why:**
   - **F1 (observation, artifact-critic):** measured on the shipped grid, an arrival's *only*
     visible change from its own departure frame is the door leaving the frame (1.5% of pixels,
     study/E→hall/E and hall/W→study/W alike) — actively misleading, not merely uninformative, at
     V1. Named with numbers in `design/architecture.md`'s Known limits for row 5's §12.6 batch;
     not this row's to fix (no scene-canvas change is licensed here, and real backdrops at row 4
     make the frames wholly different pictures regardless).
   - **F8 (artifact-critic):** the row's fork over whether it needs a human visual gate (per
     intention.md's "resumes at row 4" exemption boundary) lived only in this spec file, which is
     deleted at close and reaches no surviving register. Moved into `design/architecture.md`'s
     Known limits, named as undecided rather than silently resolved either way.
   - **F9 (artifact-critic, pre-existing, not row 13's):** `voice.spec.mjs`'s runtime sweep never
     actually leaves the study (its facing-cycling loop ends on a facing neither door is staged on,
     so every `go`/`toggle` it dispatches downstream is refused) and every `STATE:` label past that
     point is fiction the test cannot see is fiction, because the sweep only checks that collected
     strings are legal, never that the claimed state is the real one. Independent of `arrive_facing`
     (the broken sequence never depended on it) — allocated as row 14 rather than folded into this
     row's close.
   - **F5, F6, F7, F10, F11, F12 (artifact-critic, observations):** the intermediate look-back
     facing is asserted now in the persistence blocks above (closes F5, which found it previously
     unasserted and — worse — indistinguishable by hash between the two rooms at that facing);
     F6 (a keypress under the veil can skip the promised arrival facing entirely), F7 (dead space
     answers nothing after arrival, compounding F1), F10 (narration taste note on the replacement
     arrival line), F11 (the adjudicator name on surface-strings row 54 was forward-dated at commit
     time — licensed by that file's own stated convention) and F12 (WebKit unwitnessed) are named
     here and left for row 5's batch / row 6's close, not acted on inside this row.

## Edges

- Touches (final): `fixtures/demo-study/{world,narration,fixture}.{json,js}`,
  `design/surface-strings.md` (one row), `design/blueprint.md` (§3's block, §12.1's script),
  `design/architecture.md` (veil/echo paragraph rewritten as a removal; Known-limits list gains,
  loses and gains bullets), `design/intention.md` (row 13's own text stands; row 14 allocated),
  `tools/validate-fixtures.mjs` (one new hard check), `index.html` (the echo guard deleted, not
  merely re-commented), `tests/playwright/{walkthrough,knowledge,fixtures,validator}.spec.mjs`.
- Does not touch: `src/harness.js`'s `nextFacing`/`RING`, `groundplane.js`, the renderer, the
  door's own staged placement (`staging.json`), any narration line besides the one that became
  false, any new schema field for the orientation exception (declined, with reason, at point 4).
- Closing commit (state-only, per *How we work*): row 13 deleted from `design/intention.md`'s spec
  list, this file deleted, no code changes in that commit.
