# Row 13 — passage maintains orientation

## Plan (revised after plan-critic pass 1)

1. **Fixture.** In `fixtures/demo-study/world.json`, flip both exits' `arrive_facing` to continue
   the direction of travel: `door_study_hall` (study, facing E) arrives facing **E** (was W);
   `door_hall_study` (hall, facing W) arrives facing **W** (was E). Rebake with
   `node tools/bake-fixtures.mjs`.

2. **Narration.** `go.door_study_hall.arrive` (`fixtures/demo-study/narration.json`) said "come
   about to face the doorway you came by," which is now false. Rewritten to describe continuing
   motion. Mirrored byte-for-byte into `design/surface-strings.md`, identified by its **string
   key** `go.door_study_hall.arrive` (not by row-54 position — rows 8–10 will add entries above
   it). `go.door_hall_study.arrive` makes no facing claim and is left as authored; prose symmetry
   between the two lines is a taste call for row 5's Kabe pass (§12.6), not a correctness question
   this row can settle unilaterally.

3. **Blueprint.** §3's JSON block itself is edited to the new values (not merely footnoted below
   it): the block is Kabe's original illustration, and the [AI] note beneath it already recorded a
   [HUMAN, 2026-08-20] ruling superseding those exact values — this row applies that ruling to the
   block directly rather than leaving a reader to reconcile a stale example against a correcting
   footnote. §12.1's acceptance script is amended in place to name the two turn-back steps this row
   adds, with a new [AI, row 13] note explaining why each is checked against a **pre-passage**
   reference rather than a same-run re-render (see 5, below).

4. **Walkthrough (`tests/playwright/walkthrough.spec.mjs`).** Every `viewstate` assertion taken
   right after a `go` swaps its facing letter (W→E arriving in the hall, E→W arriving in the
   study). Treatment per test, stated explicitly (plan-critic F6):
   - Main pinned script, `the doorway is a real target`: facing-letter swap only.
   - `walk in, look back, walk out`: the no-op `ArrowRight`/`ArrowLeft` pair is replaced by two
     `ArrowRight` presses, which both end the double-click window (any intent does) *and* turn the
     player to face the door — needed because the new arrival facing shows no doorway to click a
     second time.
   - `a second passage after the double-click window is honoured`: same two-turn look-back
     inserted before its second `clickDoorway`, for the same reason.
   - The double-click echo test: facing-letter swap only. It gets **no** look-back inserted — the
     point of that test after this row is that the second click of a real double-click now lands
     on bare wall by construction (see 6).

5. **Persistence and arrival, made non-tautological (plan-critic F3, F4).** Two defects in the
   first draft: (a) the door-persistence hash was compared against a same-run render of the *live*
   post-arrival world — a harness that silently reset `door1` on `go` would still agree with itself
   under that comparison; (b) nothing checked the arrival frame itself, only the `viewstate` string.
   Fixed by capturing references **before** each passage: `studyDoorOpenHash` is the live scene hash
   of study/E (door open) taken immediately before the first `go` — the strongest available check,
   since the return-side look-back is compared against the literal frame stood in before leaving,
   in the same room and facing. `hallPreTravelWorld` is a frozen clone of the world taken at the
   same moment, rendered independently (a literal `{location:"hall",facing:"W"}` viewstate, never
   read off the live harness) once the look-back reaches hall/W — this is what the outbound leg
   compares against, since the player has never stood in the hall before to capture a live "before."
   Both look-backs additionally render a `door1: "closed"` variant from the same pre-passage
   snapshot to prove the open and closed pictures are visibly distinct. Separately, the frame
   immediately after each arrival (before any look-back) is checked against an independent solo
   render at a literal viewstate matching the claimed arrival facing, so `viewstate` and the actual
   pixels cannot silently diverge.

6. **The double-click echo test's premise changes, not just its numbers (plan-critic F9, F10).**
   Before this row, `arrive_facing` put the doorway a player just used directly under the pixel
   they'd clicked, which is what made a real double-click's second click land on it too — guarded
   by a 400 ms window in `index.html` (`lastGo`/`echo` in the click resolver). Read from the shipped
   code: the guard fires **only** when the second click, within the window, *also resolves to
   `r.kind === "doorway"`* (`index.html` around the `resolve`/`dispatch` wiring); every other click
   kind clears the window but is never suppressed by it, so chevrons, entity clicks and keyboard
   turns are unaffected regardless of the window — the residue below is scoped to that one branch,
   not to input generally. With arrival now facing the direction of travel, the second click's
   coordinates fall on bare wall in the room just entered, so the coincidence cannot arise on M0's
   two single-exit rooms. The test keeps asserting the outcome (one click, one passage); its
   comment, the matching comment in `index.html`, and the paragraph in `design/architecture.md`
   describing the veil/echo mechanism are rewritten to say so, rather than continue to claim a
   mechanism that no longer holds for this fixture. A new "Known limits" bullet in
   `design/architecture.md` names the residue: the echo-guard branch is unexercised by any
   committed test, since no M0 fixture can construct the coincidence it guards against. Building a
   doctored second fixture solely to re-exercise that branch was considered and declined as outside
   this row's stated scope ("Fixture arrive_facings … rebake; walkthrough assertions updated") —
   flagged for the Navigator to decide whether it's worth a row of its own, not decided here.

7. **Narration-line assertions decoupled from prose wording (plan-critic F7).** The double-click
   test counted arrival lines by matching a guessed substring (`/step through|pass back/`) against
   whichever text happened to be authored. Replaced with a lookup against the fixture's own two
   `go.*.arrive` lines (`window.HOLO_FIXTURE.narration.lines[...]`), so a future rewording of either
   line cannot silently widen or break the assertion.

8. **What is not touched.** `src/harness.js`'s `nextFacing`/`RING` logic, `groundplane.js`, the
   renderer, and the door's own staged placement (`staging.json`) are unrelated to which facing an
   exit's arrival names. The echo-guard's actual logic in `index.html` is untouched (comment only).
   No new schema field for blueprint §3's "unless the world's own fiction demands a turn" exception
   is added (plan-critic F11) — M0's two single-exit rooms never need one, and inventing an
   enforcement mechanism for an exception no fixture exercises is scope beyond two fixture values;
   the blueprint note now says so explicitly rather than implying the exception is already
   checkable. `harness-refusals.spec.mjs`, `knowledge.spec.mjs`, `voice.spec.mjs`,
   `mechanisms.spec.mjs`, `heights.spec.mjs` and the validator drive `go` through the API directly
   and assert `location` or explicit test-supplied viewstates, never a hardcoded arrival facing —
   confirmed by search, none need edits. No hash literal is pinned anywhere in this suite (search
   confirms `walkthrough.spec.mjs` has none; the replay test compares two live runs to each other,
   never to a golden), so plan-critic F5's regenerated-goldens risk does not apply here; there is no
   `zz-tmp-hashes.spec.mjs` or similar in the tree to account for.

9. **Open forks, surfaced rather than decided (plan-critic F12, F13, F14, F18).** (a) Whether row
   13 falls under the per-row human visual gate that "resumes at row 4" is genuinely ambiguous — it
   ships no new art and its own done text names no gate, more like row 11 than row 5/9/12 — and is
   not decided here; it is named for whoever holds Navigator authority over this run. (b) Every
   passage now arrives on one of §12.6's four deliberately-bare facings (study/W, hall/E), so the
   moment right after any door crossing shows nothing composited and no door in frame; this is a
   look consequence worth a line in row 5's §12.6 batch, not a defect of this row. (c) Reversing a
   passage now costs two turns with no turn-around affordance; accepted as the direct consequence
   of the ruling, named rather than silently absorbed. (d) Row 12's future overhead plan is the
   first artifact that will actually place the hall east of the study in any geometric sense — today
   "direction of travel" is prose, not checked topology — so row 12 inherits confirming the plan's
   room positions agree with every exit's facing and `arrive_facing`.

## Edges

- Touches: `fixtures/demo-study/world.json`, `fixtures/demo-study/narration.json` (+ rebaked
  `fixture.js`), `design/surface-strings.md` (the `go.door_study_hall.arrive` row only),
  `design/blueprint.md` (§3's JSON block and note, §12.1's script), `tests/playwright/
  walkthrough.spec.mjs`, `index.html` (comment only, no logic change), `design/architecture.md`
  (the veil/echo paragraph, and a new Known-limits bullet).
- Does not touch: `src/*.js`, `staging.json`, any other test file, any narration line besides the
  one that became false, the double-click guard's actual logic (kept as shipped defense, only its
  documentation is corrected), any new schema/validator machinery for the orientation exception.
- Closing commit (state-only, per *How we work*): row 13 deleted from `design/intention.md`'s spec
  list, this file deleted, no code changes in that commit (code lands in the work commit examined
  by the artifact critic).
