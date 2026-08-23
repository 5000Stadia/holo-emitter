# Row 26 — The gate of the manor: a walked way-through must be in frame

Row 26 of `design/intention.md`. The target and done clauses live there; this spec carries what
was measured, where the law lives, and the constraints a builder must not walk past.

## 1. The defect, measured on the shipped build (2026-08-22, live site driven headless)

- The manor is fully deployed and correct: live files byte-identical to local (`index.html`,
  `src/renderer.js`, `src/placeholders.js`, `backdrops/baked.js`, `fixtures/nav-manor/fixture.js`
  all hash-equal), 22 locations served, zero console errors, all 55 exits machine-walk via
  `dispatch({type:'go'})`.
- The player's only route beyond the boot pair (study → hall) is `hall/N`'s `op15` → buttery.
  Its aperture: `x 1482, y 137, w 476, h 953` on a 1536-wide canvas — **54 px on-frame (96 %
  off), 8 % clickable** by uniform sampling; every other exit in the manor measured 100 %.
  The on-frame sliver routes to `go` (all sampled on-screen points hit no entity), so the
  fixture validator's off-frame clause passes it — by 54 px.
- The passage renders in grid mode (near-black product placeholder). Nothing marks the sliver.
  The Captain's experience, verbatim: "Still just 2 rooms" / "No change - go try it out".

## 2. Where the law lives

- `tools/validate-plan.mjs` — `ruleStandpoint` (always the room-centre on the cross axis),
  `standpointFor` (the row-20 conditional: drawn rule vs threshold, obstruction-aware),
  `wallFitsFrame`, `measuredDistance`. ONE function decides; the projection imports it
  (`tools/plan-projection.mjs` line ~42) — keep it one function.
- `tools/plan-projection.mjs` — `deriveMeta` (per-facing §5 meta from the plan),
  `waysThrough` (the walkable/offscreen split; its `off` test is
  `hole.x + hole.w <= 0 || hole.x >= canvasW` — the 54 px hole passes as walkable), and the
  header note at ~line 918 that names op14's exemption and prints it as a plan warning.
- `[row21:exit.opening_offscreen]` in the fixture validator refuses a `go` target nobody can
  reach — currently only the FULLY-off case.
- The plan: `fixtures/demo-study/plan.json` (op15 = door x0 36.5 x1 37.5 on the hall's north
  wall y 12.2; the hall/cross passage is 8.00 m on its long axis). `design/plan-draft/` is the
  DERIVED render of that document; `approval.lock` anchors the approved sheets.

## 3. What is ruled, and what this row may not do

- The wide-view camera licence is **dead** — superseded at row 20 by Kabe's own approval of
  preview `02b` (`design/plan-draft/projection.md` §5). Do not resurrect it.
- §4b item 9's multi-standpoint rooms stay reserved: "M0's small rooms stay single-standpoint;
  the great hall and long gallery are multi-standpoint's first honest use." The cross passage
  is a small room. The fix here is WHERE the single standpoint stands, not how many there are.
- The lens is one lens (focal 1024 px), the eye is the standing eye (1.183 m), the camera is
  level. None of these move.
- `[row21:exit.opening_offscreen]` may not be widened to admit the corpus — tightened only.
  ("Softening it to admit this corpus is the move this project has refused five times.")
- The slide changes drawn standpoints → the schematic re-renders → **Kabe's redline glance**,
  logged AWAITING KABE in `design/approvals.log`. Do not treat the sheet re-render as
  mechanical: `approval.lock` re-anchors citing this row and his pending glance.

## 4. The shape of (a), stated so the plan critic has something to bite

The lateral-slide clause is the third branch of the same conditional family the threshold
branch established (pictures ruled it: a facing stands back when its wall does not fit).
Proposed statement: *after* the rule/threshold choice fixes the standpoint's DISTANCE, if any
way-through the WORLD walks on this facing is not fully in frame with a usable margin from
that point, the standpoint slides along the wall axis (cross-axis coordinate only) by the
least amount that brings every walked way-through fully in frame; the slide is clamped so the
standpoint stays inside the room's standable area (obstructions honoured, same clearance);
if no slide satisfies all walked ways-through, the facing keeps the centred standpoint and
the exit fails the tightened off-frame clause honestly — a finding, never a silent hole.
Derived, deterministic, no per-room hand data. `standpoints.tsv` and the sheets re-render
from it.

Open question the builder must answer with a number, not a feeling: what is "a usable
margin"? Row 2 closed with "forgiveness for any small target" — find that tolerance and
derive from it; the done clause wants a stated minimum on-frame aperture width asserted by
a clause a critic failed to defeat.

## 5. Verification where the defect lives

The row's proof is the shipped page driven as a player: boot the fixture, walk
study → hall by real dispatch, face N, and click a drawn pixel of the buttery doorway —
the click must travel. Sweep all exits the same way (the session transcript's method:
`apertureList()` after real dispatch, uniform-sample `hitAtPoint` over each aperture,
count on-frame + clickable). The sweep numbers go in the row's close. Screenshots of
`hall/N` before/after go in a batch for Kabe with the re-rendered sheet.

## 6. Family history this row walks past at its peril

Guards-that-cannot-fail: six bites. (b)'s tightened clause must be proven by an adversarial
critic constructing a mostly-off-frame door and watching the clause refuse it — an author's
delete-and-confirm-red is insufficient. The completeness ledger (row 18's family) reads emit
sites; if the new clause emits a new token, it joins the ledger with one token per arm.
