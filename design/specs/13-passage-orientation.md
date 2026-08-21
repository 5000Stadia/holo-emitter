# Row 13 — passage maintains orientation

## Plan (after plan-critic pass 1, artifact-critic pass 1, artifact-critic pass 2)

1. **Fixture, narration, blueprint** — unchanged since pass 1. `arrive_facing` continues travel
   both ways; the arrival narration line describes continuing motion (rewritten again at pass 2 to
   fix a doubled preposition an artifact critic flagged as reading like a draft — "You step through
   into the hall. The air is wider here, and cooler."); blueprint §3's JSON block reads verbatim as
   `world.json` does.

2. **Blueprint/fixture agreement, closed for real this time (pass-2 artifact-critic F5).** Pass 1's
   check compared only exit fields; the pass-2 critic showed `knowledge.player` and `door1`'s
   default state could both drift in the blueprint's block — direct hits on named qualities — with
   the whole suite green. `tests/playwright/fixtures.spec.mjs` now asserts the **entire** parsed §3
   block structurally equals `world.json` (`toEqual`, not a field allowlist). Verified to catch both
   of the critic's exact repros before being reverted.

3. **`arrive_facing` driving the harness, given a test that cannot be defeated by the validator
   rule above (pass-2 artifact-critic F1).** Point 4 below (the validator hard-enforcing
   `arrive_facing === facing`) has a consequence nobody had until the second critic: on any fixture
   this project can now ship, the two fields are always equal, so `viewstate.facing =
   exit.arrive_facing` and `viewstate.facing = exit.facing` are indistinguishable — deleting the
   former leaves the whole suite green, and row 13's own mechanism had zero coverage. Fixed the only
   way that remains possible: `tests/playwright/harness-refusals.spec.mjs` gains a harness-level
   test, built directly against the harness API on a doctored world (bypassing the file-based
   validator by construction, the same "licensed exception" pattern every other harness-level test
   in that file already uses), with `arrive_facing` deliberately set to a value the validator would
   refuse. Verified red when the assignment is deleted or swapped for `exit.facing`.

4. **The [HUMAN] ruling itself, enforced (pass-1 artifact-critic F3, unchanged at pass 2).**
   `tools/validate-fixtures.mjs` requires `arrive_facing === facing` as a hard finding, with a
   comment marking where a future schema exception would attach. Two red cases in
   `validator.spec.mjs`, one per direction.

5. **The double-click echo guard: restored, not deleted (pass-2 artifact-critic F2, reversing pass
   1's point 5).** Pass 1 deleted the guard on the claim that "no fixture this project can ship
   reintroduces the coincidence" it protects against. The pass-2 critic proved that claim false in
   one double-click: the guard was never scoped to "the SAME doorway reappearing" — it swallows the
   second click of a double-click whenever that click resolves to *any* doorway within the window —
   and a corridor whose next room's own door sits on the facing you arrive with (exactly what
   "continues the direction of travel" produces one hop later) puts a *different* doorway under
   that second click. Continuing-direction-of-travel makes this coincidence *more* likely in a
   corridor, not less. Since rows 11 and 12 build toward corridor-typed facings, this is a real,
   near-term risk, not a hypothetical. The guard (`lastGo`, `DOUBLE_CLICK_MS`, both call sites) is
   restored in `index.html` with the reasoning corrected in its own comment and in
   `design/architecture.md`; the two "crossing a door more than once in a row" tests from pass 1
   stand (they test something true regardless of the guard). A new test, "the double-click guard
   against a corridor's aligned doorway," proves the guard against a doctored third room chained off
   the shipped hall (reusing demo-study's own fixture as a base via `stageTree()`, sidestepping
   `validate-fixtures.mjs`'s hardcoded M0 overlap-pair check that made pass 1's attempt at this
   impractical) — driven with a real double-click, verified red when the guard is deleted. Building
   this test surfaced and fixed a bug in the test itself: the doctored `door1` was never actually
   opened before the double-click, so the first click silently toggled it open instead of walking
   through, making the test pass "successfully" for the wrong reason on the first attempt — caught
   only by deliberately deleting the guard and watching the test still pass.

6. **Arrival and persistence, non-tautological (plan-critic F3/F4, stands through both critic
   passes).** Both look-backs compare against references captured **before** the passage; each
   arrival frame is independently checked against a literal-viewstate solo render.

7. **Narration-line assertions decoupled from prose wording (plan-critic F7, stands).**

8. **The human visual gate (pass-2 artifact-critic F3) — not resolved by this row, surfaced
   instead.** `design/playbook.md` (read in full only at this pass — a gap in what this row was
   handed, named for whoever hands off the next one) states plainly, under AgentBridge: "any row
   that changes what the player sees carries in its done 'the human has approved consumption-camera
   screenshots' … the human's yes closes it." `design/architecture.md`'s own measurement (F1 below)
   is exactly such a change. Pass 1 treated the row as exempt "by analogy to row 11"; the pass-2
   critic correctly called that an agent resolving a human-scoped question by analogy, which the
   method does not license. Resolved by **not resolving it**: a consumption-camera screenshot batch
   is captured and published (both directions, full sequence: departure with the door open, the
   arrival frame, the look-back turn, the door confirmed open) rather than the row's own closing
   commit removing it from the spec list. The row's work is done and green; its *close* — leaving
   the spec list — waits on the yes the playbook reserves for the human.

9. **Findings carried forward, not fixed here, each with why:**
   - **F1 (both critic passes):** measured precisely at pass 2 — study/E→hall/E changes 23,946 of
     1,572,864 px (1.52%), hall/W→study/W changes 23,587 (1.50%), and hall/E is 99.91% identical to
     plain hall/S — every changed pixel in both cases is the door leaving frame. This is what makes
     point 8's gate non-rhetorical: the row does change what the player sees, measurably. Named in
     `design/architecture.md` for row 5's §12.6 batch, not fixed here (no scene-canvas change is
     licensed by this row, and row 4's real backdrops resolve it structurally).
   - **F4/F7 (pass-2 artifact-critic):** the arrival narration line the pass-1 critic adjudicated
     PASS read like a draft on closer reading (a doubled preposition, a stranded clause) — fixed at
     point 1 above, re-adjudicated under a `-pass2` adjudicator name in `surface-strings.md` rather
     than silently keeping the original critic's name on text that critic didn't actually see.
   - **F6 (pass-2 artifact-critic, declined with reason):** a concurrent Navigator session's commit
     (`1d05819`, landed mid-row, message: "amendment queued behind row 13") rules the tab title
     should read "Holo Emitter Static Demo"; the shipped page still says "holo-emitter." Real, but
     explicitly sequenced as separate work by the process that ruled it — its own commit message
     says *behind* row 13, not *in* it — and touching `index.html`'s title plus
     `design/surface-strings.md`'s audited title row for an unrelated reason would blur this row's
     own diff with that one. Left alone; flagged here and in the closing report so it is not lost.
   - **F8/F9/F10, F11–F12 from pass 1:** unchanged — a keypress under the veil can skip the promised
     arrival facing; dead space answers nothing after arrival; a double-click on a *closed* door
     opens and shuts it net zero (pre-existing, outside this row); the turn-back frame that proves
     persistence looks nearly identical to the departure frame to a *player*, not only to a hash
     (verified true, not tautological); WebKit remains unwitnessed. All named in
     `design/architecture.md`'s Known limits, none fixed here.
   - **Row 14 allocated** (pass-1 artifact-critic F9, unchanged at pass 2): `voice.spec.mjs`'s
     runtime sweep never actually leaves the study and its `STATE:` labels are asserted by comment,
     not checked against the world — pre-existing, independent of `arrive_facing`, its own row.

## Edges

- Touches (final): `fixtures/demo-study/{world,narration,fixture}.{json,js}`,
  `design/surface-strings.md` (one row), `design/blueprint.md` (§3's block, §12.1's script),
  `design/architecture.md` (veil/echo paragraph, Known-limits list), `design/intention.md` (row 13
  stands; row 14 allocated), `tools/validate-fixtures.mjs` (one hard check),
  `index.html` (the echo guard, restored with corrected reasoning — comment and logic both),
  `tests/playwright/{walkthrough,knowledge,fixtures,validator,harness-refusals}.spec.mjs`.
- Does not touch: `src/harness.js`'s `nextFacing`/`RING`, `groundplane.js`, the renderer, the
  door's own staged placement (`staging.json`), any narration line besides the one that became
  false, any new schema field for the orientation exception, the tab-title ruling (F6, declined).
- **Close:** per *How we work*, a state-only closing commit removes row 13 from
  `design/intention.md`'s spec list and deletes this file — but per point 8, that commit does not
  land as part of this row's own work; it waits on the human visual gate. Until then the row stays
  in the spec list, built and green, with the review batch published for that gate.
