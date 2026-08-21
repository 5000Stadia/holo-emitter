# Rows 8 and 10 — fullscreen, and keyboard/assistive access + reduced motion

Both are chrome rows touching `index.html` and its tests, built in one batch per this run's own
dispatch, which closes both in the single state-only closing commit the run specifies — row 8 does
not get an independent close/push; that is the shape this run was handed, not a builder's choice.

Revised after a plan-critic pass (31 findings, 23 blocking). This version's design decisions are
the fixes; each subsection below states which finding it closes.

## Shared ground

Neither row touches `src/renderer.js`, `src/harness.js`, `src/groundplane.js`,
`src/placeholders.js`, or any fixture. Nothing writes to `#scene`'s 2D context or changes
`window.HOLO.renderer`'s inputs — verified at the end by capturing the scene-hash sequence at the
parent commit and again after (row 7's own method for this exact promise; `design/architecture.md`
already names the lack of a committed guard for it), not merely asserted.

**Row 8's own done clause says "all existing tests stay green unmodified."** Read literally: zero
existing test files are edited. This plan honors that literally — `tests/playwright/voice.spec.mjs`,
`walkthrough.spec.mjs` and `shell.spec.mjs` are read for pattern only and never touched. (F13)
Row 10's clause has no "unmodified" qualifier, but this plan holds the same discipline for both,
since touching `voice.spec.mjs`'s self-referential STATES-derivation (it scans only its own file
for what it drove) is a real hazard for no real gain — see "Observing the new strings" below.

**Withdrawal selector generalized.** Today `.chevron` is both a style class and the literal
selector three separate withdrawal paths query (the `<noscript>` injected style, the boot handler,
`fault()`) — a hand-kept list of one class a second live control silently escapes (finding F14).
Both new static controls (the fullscreen button; see row 8) carry a second class, `affordance`,
alongside their own styling class; the chevrons gain it too. All three withdrawal sites are changed
from `.chevron` to `.affordance`. Row 10's entity-controls need no such handling — they are created
entirely by the bootstrap script itself and simply do not exist if that script never runs, so there
is nothing to withdraw on those paths; `fault()` additionally clears `#entity-controls`'s children
and blurs focus out of it when a render fault happens *after* boot.

## Row 8 — fullscreen

**The fallback must be real, not a relabelled no-op (closes F1, F2).** The plan-critic's central
finding: the original design toggled a `position:fixed;inset:0` class that changed nothing
observable on iOS Safari (the case row 8 names), while flipping the button's label to "leave the
full screen" — a reachable, false surface string, and it also broke the sliver-viewport scroll
contract `walkthrough.spec.mjs` already pins (900×140 has to remain reachable by scroll).

Fix: **the fallback drops the bottom chrome reserve, in both branches.** A single boolean state —
`fsActive`, true when either `document.fullscreenElement` is truthy (webkit-prefixed too) or the
manual fallback flag is set — drives one class, `html.fs-active`. Under it:
- `#narration` and `#inventory` are hidden (`display:none`), same mechanism `body.capture .chrome`
  already uses.
- `#stage`'s width calc reserve drops from `7.6rem` to `0` (a second CSS rule scoped to
  `html.fs-active #stage`, not a rewrite of the existing rule).
- No `position:fixed`/`inset:0` anywhere — this closes F2 outright, since nothing about the
  degenerate-sliver scroll contract changes; the fix that caused it is deleted, not patched.

This makes "fullscreen" mean the same thing on every engine: a distraction-free, maximized scene
view. It is real (the stage's rendered CSS box genuinely grows — testable via `boundingBox()`),
it is true (the label only changes when the DOM genuinely changed), and it works identically
whether the OS grants real fullscreen or not, which is what "the letterboxed presentation IS the
licensed fallback" already licenses. One function, `syncFullscreenUI()`, computes `fsActive` and
applies the class + label together, called from the click handler, from `fullscreenchange` (both
spellings), and once at boot — closing F10 (one state model, not two that can disagree).

**The control (closes F7, F14, F15).** A visible `<button id="fullscreen-toggle" class="affordance
chrome">`, top-right of `#stage`, `pointer-events` normal (this is real mouse/touch chrome, not a
row-10 keyboard-only helper). It carries a small inline `<svg aria-hidden="true">` — two open
corner-brackets, plain vector paths, no `<text>`, no `content:` CSS — so a sighted player sees a
real icon rather than a blank box; the SVG contributes no string (no text node, `aria-hidden`
belt-and-suspenders, and `<svg>` is already named in `surface-strings.md` as a technique rows 8–10
may use). DOM order: chevron-left, chevron-right, fullscreen-toggle — stated here so the tab order
is a specification, not an accident (closes F15's chevron/fullscreen-order half; row 10 states the
rest).

**Click handler.** Feature-detect `requestFullscreen`/`webkitRequestFullscreen` on
`document.documentElement`. If present: call it (real, unstubbed, on a genuine `page.click()` —
see Tests) with a `.catch()` that falls through to the manual-flag branch on rejection. If absent:
flip the manual flag directly. Either way, `syncFullscreenUI()` runs after.

**Labels, and the naming fork (closes F4, partially).** Two strings: **"fill the screen"** /
**"leave the full screen"**. `design/surface-strings.md`'s `QUESTIONS` line on control-name
world-vs-machine naming is **not deleted** — only the Navigator can close a line filed there for
Kabe. This plan appends a proposed resolution to it, argued from precedent already ratified in
this document (the chevrons are already plain functional names, not fiction; "speech about the
visitor's own device is not developer speech" already licenses naming a fact about the visitor's
own window) — and ships `PASS`, not a new `LICENSED` class member (the closed class is untouched;
this cites an existing precedent, it does not add to it). The two strings deliberately avoid the
literal word "fullscreen" so the practical question is sidestepped even before Kabe rules on the
formal one.

**Tests** (new file: `tests/playwright/fullscreen.spec.mjs`, `shell.spec.mjs` untouched):
- Button exists; initial label "fill the screen"; `.affordance` class present.
- **A real attempt, on a genuine click** (closes F16): `page.click('#fullscreen-toggle')`, then
  check `document.fullscreenElement`. If the engine granted it, assert the box/label changed and
  exit fullscreen via the button again. If it did not (sandboxed CI denying a gesture-based grant
  is a real, environment-level possibility, not a code defect), the test does not hard-fail on that
  alone — it asserts `requestFullscreen` was genuinely *called* (spied, not stubbed-away) and that
  `fsActive`/the label still reflect *something* consistent, and records which branch it took.
  This is deliberately not mocked into meaninglessness — a real gesture-driven call happens.
- **Deterministic no-API branch**: `requestFullscreen`/`webkitRequestFullscreen` deleted via
  `addInitScript` before `goto`. Click: `html.fs-active` appears, chrome hides, `#stage`'s box
  grows (measured), label flips. Second click reverses all four.
- **Rejection branch**: `requestFullscreen` stubbed to return a rejected promise. Same assertions
  as the no-API branch.
- **`fullscreenchange` sync**: `document.fullscreenElement` stubbed via `Object.defineProperty`,
  event dispatched without any click — label/class follow, proving Esc-driven exits resync.
- Canvas stays 1536×1024 and its hash is unchanged across every branch above, at a 16:9 desktop
  viewport and 390×844 (portrait and landscape).
- **A derived capture check** (closes F30, an observation, cheaply): `document.querySelectorAll
  ('.chrome')` under `body.capture` are all `display:none` — reads the DOM's own class membership
  rather than a second hand-kept id list, strictly stronger than duplicating `shell.spec.mjs`'s own
  fixed list, and does not edit that file.
- Own-string vocabulary/audit-membership check (see "Observing the new strings" below).

**Engine-conditional claims (closes F28).** Every claim about iOS Safari specifically (the
fallback's real effect, whether `requestFullscreen` is truly absent there) is recorded as
unverified on this machine, appended to `design/surface-strings.md`'s existing
*Engine-conditional claims* section — this repo cannot launch WebKit at all. The artifact critic's
appended instruction ("try fullscreen... yourself on both engines and a 390×844 viewport") is the
real-world check this plan cannot run.

**CSS hygiene picked up while this block is open (closes half of F29):** a `vh` line before the
`svh` line in `#stage`'s width calc — a one-line, zero-cost, non-hash-moving addition that closes
`design/architecture.md`'s named "no `vh` fallback beneath `svh`" limit for engines that don't
support `svh` at all. The bottom-chrome alignment question in the same `QUESTIONS` entry is
explicitly **declined** here, not silently buried again: its own tradeoff (a full line of prose
lost at phone landscape) is a taste call, not a presentation-mechanics fix, and this row does not
fold it in. The `QUESTIONS` entry is edited to record that it was re-examined and re-declined at
row 8, not left to look unread.

## Row 10 — keyboard/assistive access + reduced motion

**Architecture, unchanged from the original plan in shape:** a DOM overlay of invisible, focusable
`<button>` elements, one per entity in `currentLayout` plus one per open-facing doorway, rebuilt
inside `paint()` (the same moment `currentLayout` itself is recomputed). Mouse behavior is
completely unaffected — every such button is `pointer-events:none`, so a mouse click passes through
to the canvas beneath and the existing `resolve()`/`hitTest()` path is untouched by construction.
Keyboard/AT activation of a focused button fires its `click` handler regardless of `pointer-events`
(that property only gates hit-testing, not synthetic activation of a focused element — this is the
same mechanism visually-hidden "skip to content" links rely on across the web).

**Names: state-invariant text, no `aria-expanded` (closes F6).** The original plan put open/closed
state on `aria-expanded` and argued the runtime sweep's collector drops boolean tokens, so it needs
no audit entry — backwards as an argument, because a screen reader still speaks "expanded"/
"collapsed" over a plank door and an oak drawer: machine register laid over the fiction's own
objects, exactly the class of thing the audit exists to catch, just outside where the collector
happens to look. Fix: **the state lives in the name itself**, authored and audited like every other
string:
- `desk1`: **"open the joined oak writing desk"** (closed) / **"close the joined oak writing desk"**
  (open).
- `door1`: **"open the plank door"** / **"close the plank door"**.
- Static entities (no `states`): the plain noun — **"the joined wainscot chair"**,
  **"the brass candlestick"**, **"the back-panelled oak bookcase"** — activating one dispatches
  `toggle` exactly as a pointer click would, which is refused and narrated; the control names the
  object, matching how a player who does not yet know what will happen names it too.
- Takeables: **"take the iron key"**, **"take the vellum notebook"**, **"take the silver coin"**.
- The go-control: derived from the leaf's own `record.noun`, not a per-exit-id lookup table
  (closes F3 and, as a side effect, F12's ambiguity in favor of naming what is visible rather than
  a destination the player has not yet reached, which is the reading closer to
  knowledge-honesty in spirit even though locations are not themselves knowledge-filtered) —
  **"walk through the plank door"**. Present only when the on-facing exit's leaf is open (mirrors
  `resolve()`'s own doorway branch exactly: a shut leaf has no separate opening-target, and neither
  does this). Since M0's one door entity is shared by both exits, this is a single string, not two.
- **Degenerate case (closes F25):** if a bound entity's record is missing or its `noun` is absent/
  non-string, the label falls back to **"something here"**, with a `console.error` naming the
  entity id — the exact pattern `src/inventory.js` already uses for its own missing-noun and
  no-record branches, applied to this new composed site. One new `SINKS` row:
  `index.html | setAttribute aria-label | composed`, and this fallback branch is enumerated under
  its "Degenerate values, disposed per composed site" prose the same way `inventory.js`'s is.

**The canvas gets an accessible name (closes F23).** `design/architecture.md` already assigns this
to row 10 by name. `<canvas id="scene" role="img" aria-label="what you see">` — literal HTML,
parallel in form to the two existing "what X" region names (`#narration` = "what the room says",
`#inventory` = "what you are carrying"), so it reads as one voice rather than a bolted-on label.
This is a sixth literal `aria-label`, and `surface-strings.md`'s prose naming "the five `aria-label`
attributes" is corrected to six in the same commit. `<canvas>` fallback *content* (extra child
nodes for browsers with no 2D canvas at all) stays undecided exactly as already recorded — a
narrower, now-explicit residue, not silently dropped.

**Focus survives a repaint (closes F17).** The original plan cleared and rebuilt `#entity-controls`
on every `paint()` with no memory, so the focused control vanished under the user on every single
action — turn, open, take, all of them — dropping focus to `<body>` and forcing a full re-Tab after
every intent. Fix: before clearing, if `document.activeElement` is inside `#entity-controls`, its
`data-target-id` is captured; after rebuilding, a button carrying that same id (if any still exists
— e.g. it was a static entity, or a toggle whose state changed but whose id persists) is
`.focus()`ed. A control whose *referent is gone* (a taken item) legitimately loses focus — that is
correct, not a bug, since there is nothing left to point at.

**Rough positioning, not purely `{0,0}` (mitigates F19).** `pointer-events:none` plus keyboard/AT
activation is the standard, correct pattern for this — activation of a focused element fires
regardless of the CSS property, and does not depend on hit-testing at a screen coordinate the way a
raw synthetic touch would. But leaving every button stacked at one undefined point is needless
residual risk for a platform this repo cannot even launch to check (WebKit). Each button is
positioned (in percentage units, so it scales with the stage's own CSS box) at the centre of its
entity's `entryRect()` — cheap, since that geometry is already computed for the hover halo — even
though the button stays visually `opacity:0`. Belt, not just suspenders.

**Reduced motion is a true instant cut, not a shortened fade (closes F9, F18).** The original design
kept the veil's 140 ms full-black hold and only removed the *fade-out* transition, which is a flash-
cut, not the "instant cut" the row's own text asks for, and it created a timing window where the
reduced-motion assertion and the normal-mode assertion could both read `0s` depending on when the
test happened to sample. Fix: `dispatch()`'s go-veil block checks
`matchMedia('(prefers-reduced-motion: reduce)').matches` once, synchronously, before touching the
veil's classes at all. Under reduced motion, the veil sequence is skipped entirely — no `.instant`,
no `.on`, no 140 ms hold, no CSS transition — the repaint simply happens, exactly as a `turn` or
`toggle` already does without any veil. The existing `@media (prefers-reduced-motion: reduce)
{ #veil { transition: none } }` CSS rule is kept as defense in depth (harmless since the JS path
never adds `.on` there at all), not as the sole mechanism.

**Observing the new strings, honestly (closes F5, F21).** The plan-critic's sharpest finding: the
original plan claimed seven of eight entity strings were "collected for free" by
`voice.spec.mjs`'s existing sweep while citing, in the very next sentence, `design/intention.md`
row 14's own description that the sweep never actually leaves the study — a self-contradiction.
Traced properly: the existing sweep's facing loop (`study` N→E→S→W, ending at W, *then*
`toggle door1`/`go` — both refused there since door1 is staged on E) only ever visits study/N
(desk1, chair1, note1) and study/E (door1) with the world in its untouched initial state. Nothing
about the hall, nothing about the door open, nothing about the drawer open, is ever reached by that
sweep as shipped. This plan does not touch that loop or row 14's territory at all. Instead:
- The four strings the existing sweep genuinely does reach ("open the joined oak writing desk",
  "the joined wainscot chair", "take the vellum notebook", "open the plank door") get
  `observed: yes` honestly, for free, with zero test-file edits.
- Everything else (both close-state labels, the three hall statics, "take the iron key", the
  go-control, the fallback string, the canvas name, and both fullscreen strings) is observed by
  this row's *own* new tests, which read `design/surface-strings.md`'s fenced blocks directly
  (the same parsing `voice.spec.mjs` does, reimplemented standalone so as to touch nothing in that
  file) and assert every `aria-label`/`role="img"` name the new keyboard journey actually produces
  is (a) developer/method-vocabulary-clean and (b) a member of `STRINGS`. `observed: yes` on these
  rows is true because this row's own suite, not `voice.spec.mjs`'s, is the witness — and it
  genuinely visits study/N with the drawer open, study/E with the door open, and hall/N, which the
  existing sweep never does.
- No new entries are added to `surface-strings.md`'s `STATES` block, and `voice.spec.mjs` is not
  touched — `STATES` is specifically the vehicle for that file's own self-referential sweep
  machinery (it scans only its own source for what it drove), and misusing it for a different
  file's coverage would be exactly the "claims the builder made, unverified" pattern the audit's
  own "What this apparatus does NOT hold" section warns the next critic to hunt for.

**Tests** (new file: `tests/playwright/keyboard.spec.mjs`; `walkthrough.spec.mjs` untouched):
1. **Keyboard-only journey**, zero `page.mouse.*` calls anywhere in the file: Tab/Enter through the
   same beats §12.1's pointer script covers — chair refusal, open desk (reveal), take key, take
   note, close desk, turn (`ArrowRight`/`ArrowLeft`, already keyboard) to face the door, open door,
   walk through via the go-control, look back, turn back, reach the hall, take the coin, return via
   the door's go-control. Assertions are behavioural parity (world state, narration, inventory) —
   not a hash-sequence replay, which row 10 does not require.
2. **Accessible names**, read directly off `aria-label`/`role="img"` for the full control set at
   study/N, study/E (both door states), and hall/N — checked against the exact strings above.
3. **Focus order**: the tab sequence at a facing matches `currentLayout`'s own order (chevrons,
   fullscreen button, then entities in draw/baseline order, then any go-control last) — the
   ambiguity row 8/10 jointly left open (F15) is closed here by assertion.
4. **Focus survives a repaint**: focus a control, activate it, assert focus lands back on "the same
   id" when that id still exists (desk1 after opening) and is not left dangling when it does not
   (key1 after taking it — focus should not point at a `<button>` no longer in the DOM).
5. **Reduced motion**: `page.emulateMedia({ reducedMotion: "reduce" })`, dispatch a `go`, assert
   `#veil` never gains the `on` class at any point during the dispatch; a second, unemulated page
   asserts it does, synchronously, immediately after `dispatch()` returns (before the 140 ms timer
   fires) — deterministic, no timing race, since the reduced-motion path never touches the class at
   all rather than racing a transition duration.
6. **Fault withdrawal**: force a render fault (the technique `shell.spec.mjs`/`voice.spec.mjs`
   already use, reimplemented locally) and assert `#entity-controls` is empty and
   `document.activeElement` is not inside it.
7. **Mouse path unaffected**: one smoke test clicking through the canvas exactly as the pointer
   model already works, confirming a mouse session never sees a focus outline and the new buttons
   never intercept a click — a standing guard on the `pointer-events:none` invariant.
8. **Degenerate noun fallback**: corrupt a bound record's `noun` (mirroring
   `voice.spec.mjs`'s own existing "a record with no usable noun" test, but against this new sink),
   assert the control falls back to "something here" and the console carries the fault.
9. Own-string vocabulary/audit-membership check, as described above.

**`design/surface-strings.md` table corrections (closes F24, part of F26, F28).** The
`forced-colors, user stylesheet` row's `Owner: row 10` disposition is filled in rather than left
hanging: canvas-painted affordances (the focus halo, like the pre-existing hover halo) are pixels,
not styled DOM, so forced-colors mode neither helps nor breaks them — true before this row and
unchanged by it; the accessible names themselves (plain DOM text) are read by assistive tech
independent of any forced-colors restyling and are unaffected. Recorded as `Out — reason`, not left
open. `COUNT` (`STRINGS` and `STATES`) and the "five `aria-label` attributes"/three-literal-surfaces
prose are updated for the actual final numbers once the strings are written (closes F26).

## Known, accepted residue (not fixed by this plan, and why)

- **F19's deeper form** — genuine VoiceOver-on-iOS activation behaviour — is unverifiable on this
  machine (WebKit will not launch here, already an accepted project-wide limit) and is mitigated,
  not eliminated, by rough positioning; recorded as residue for whoever next has a real device.
- **F20 — the coin's focus halo is as hard to see as its hover halo already is** (≈6 logical px at
  phone scale). This is not new to row 10: the identical apparent-size problem already applies to
  the existing mouse/hover affordance and is already owned by row 4's asset-scale probe in
  `design/architecture.md`. Row 10 inherits, not introduces, this; it is not re-solved here.
- **Human visual gate (F22).** `design/playbook.md` calls for chrome-look pre-approval before it is
  locked and for the human's screenshot approval as part of "done" for any row that changes what a
  player sees. This run is dispatched to build both rows autonomously, deliver the batch as delivery
  rather than a gate, and not wait on anyone — consistent with this method's own "checkpoints
  inform, gates hold" law (a checkpoint is "how does this look," never "may I continue"). Nothing
  is pushed by this run, so the playbook's separate proactive-push-note obligation does not yet
  apply. What remains genuinely owed — Kabe's chrome-look sign-off on the fullscreen control's
  visual design and the row's screenshot approval — is named plainly in this run's final report as
  outstanding, not silently assumed satisfied.

## Explicitly out of scope

`src/renderer.js`, any fixture, `world.json`/`staging.json`/`narration.json`, row 9, rows 11/12, row
14's sweep-loop defect, `backdrops/`, `library-src/`, any AgentPost mailbox, and every existing test
file (`walkthrough.spec.mjs`, `voice.spec.mjs`, `shell.spec.mjs`) — read for pattern, never edited.
