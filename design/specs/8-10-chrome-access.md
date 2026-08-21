# Rows 8 and 10 — fullscreen, and keyboard/assistive access + reduced motion

Both are chrome rows touching `index.html` and its tests, built in one batch because they land in
the same files and the same commit shape (extend `design/surface-strings.md`, extend the test
suite, leave the scene canvas and its hashes untouched).

## Shared ground

Neither row touches `src/renderer.js`, `src/harness.js`, `src/groundplane.js`,
`src/placeholders.js`, or any fixture. Everything lives in `index.html` (markup, CSS, the
bootstrap `<script>`) plus new/extended Playwright specs and `design/surface-strings.md`. The
scene canvas's internal size (1536×1024), its draw algorithm, and every existing hash assertion
are untouched by construction — nothing in either row's design writes to `#scene`'s 2D context or
changes `window.HOLO.renderer`'s inputs.

Both rows extend the voice audit in the same commit as the code, per the maintenance rule in
`design/surface-strings.md`.

## Row 8 — fullscreen

**Control.** One visible, mouse/touch/keyboard-clickable `<button id="fullscreen-toggle"
class="chrome">` positioned in the top-right corner of `#stage` (absolute, small bordered box,
styled like the chevrons — no glyph, no `content:` CSS, name carried entirely by `aria-label` so
no new "mark" enters the audit). It is real chrome: unlike row 10's entity controls, mouse clicks
land on it directly (no `pointer-events: none`), and it hides under `body.capture` like every
other chrome element already does via the existing `.chrome` rule.

**Mechanism.** Feature-detect `document.documentElement.requestFullscreen` (and the
`webkit`-prefixed variant, for older desktop Safari — iOS Safari has neither for arbitrary
elements, which is the case the intention names as the licensed-fallback trigger). On click:
- If a real API exists, call it (with a `.catch()` — a rejected promise, e.g. from a policy
  denial, falls through to the same fallback branch as "no API").
- If it does not exist, or the promise rejects, toggle a `maximized` class on `<html>` instead —
  the in-page fallback. Its CSS makes `html`/`body` consume the full viewport and disables scroll
  bounce (`position: fixed; inset: 0`); it does **not** attempt to hide browser chrome (that is
  not achievable from CSS/JS), and does not change the stage's existing contain-fit/letterbox
  math at all — the letterboxed presentation already *is* the fallback, per the row's own text.
  Neither branch changes `#stage`'s width/aspect-ratio calc; both simply give the calc more
  viewport height to work with when the browser grants it.
- A `fullscreenchange` listener (both spellings) re-syncs the button's label/state whenever the
  browser enters/exits fullscreen by any means (button, Esc key, browser UI) — real fullscreen is
  the source of truth when the API exists; the fallback branch has no external event, so the class
  toggle is the state.

**Control name, and the fork it closes.** `design/surface-strings.md`'s `QUESTIONS` has an open
line: *"is `fullscreen` the shortest true name of what the button does, or is it a property of the
visitor's window... two competent builders will otherwise ship different chrome."* This plan
resolves it, citing two existing precedents rather than inventing a new rule: (1) the chevrons are
already named by plain function ("turn left"/"turn right"), not by narrative dress, establishing
that control names in this product are functional, not fictional; (2) "speech about the visitor's
own device is not developer speech" is already the licensed ground for the no-JS message, and a
fullscreen toggle is exactly that class of speech — about the visitor's own window, not this
project's construction. So: plain functional labels, `PASS` (not `LICENSED:device` — nothing here
is naming a system *condition*, e.g. no "Loading…"-shaped sentence; it is naming what the button
*does*, same as the chevrons). Two strings, state-dependent: **"fill the screen"** /
**"leave the full screen"**. The `QUESTIONS` line is deleted in the same commit (resolved, not
left stale) with a one-line note of the resolution and citation left where the line was, matching
how prior rows have closed forks in place rather than silently dropping them.

**Tests** (new: `tests/playwright/fullscreen.spec.mjs`). Deterministic, not dependent on a sandboxed
CI runner actually granting OS-level fullscreen (the artifact critic's appended instruction — "try
fullscreen... yourself" — is the real-world check for that; the automated suite verifies the code
is correct, not that a headless runner's fullscreen permission happens to be granted):
- Button exists, initial `aria-label` is "fill the screen", initial `aria-expanded` absent (this
  control is a toggle-state button but not a disclosure; no `aria-expanded` needed — its own label
  already changes, unlike desk/door in row 10 where the label is deliberately state-invariant).
- Click with `requestFullscreen` present (spied/wrapped, not required to actually succeed under
  CI): the spy is called on the button element.
- Click with `requestFullscreen` (and the webkit variant) deleted via `addInitScript` before
  `goto`: `<html>` gains `maximized`; label flips to "leave the full screen"; second click removes
  it and flips back.
- A rejected `requestFullscreen()` promise (stubbed to reject) falls through to the same class
  toggle.
- `fullscreenchange` (dispatched synthetically with `document.fullscreenElement` stubbed via
  `Object.defineProperty`) re-syncs the label without a click — this is also the vehicle that
  makes "leave the full screen" genuinely reachable for the voice audit, registered as a new
  `STATE:fullscreen-active` in `design/surface-strings.md` and driven in
  `tests/playwright/voice.spec.mjs` by one small new test block (additive; the existing sweep test
  is not touched).
- Canvas dims stay 1536×1024 and the scene hash is unchanged across both branches, at a 16:9
  desktop viewport and a phone ratio (390×844), portrait and landscape — reusing `shell.spec.mjs`'s
  contain-fit arithmetic pattern (not editing that file — a new assertion in the new spec) to
  confirm the stage box still contain-fits/letterboxes correctly with the fallback class applied.
- `body.capture` still hides the button (extends the existing invariant, asserted fresh here since
  `shell.spec.mjs`'s own capture test enumerates a fixed id list it isn't safe to touch — a
  duplicate-but-independent assertion in the new file, not an edit to the existing one).

## Row 10 — keyboard/assistive access + reduced motion

**The gap, exactly.** Only the chevrons are focusable today. The scene canvas has no `tabindex`,
role, or way to reach the drawer, the door, or any takeable without a pointer. Every intent a
pointer can emit (`toggle`, `take`, `go`) has to become reachable by keyboard alone.

**Architecture: a parallel, invisible, focusable control per drawn entity + per open doorway.**
The canvas itself cannot host sub-focusable regions, so this is a DOM overlay of real `<button>`
elements, built and rebuilt from `currentLayout` exactly when it changes (i.e., at the end of
`paint()`, which already only runs on a non-empty envelope — the same moment the layout itself is
recomputed). This mirrors how the hover halo already reads `currentLayout`/`entryRect` — no new
data source, just a new consumer of the one that exists.

- **Container.** `<div id="entity-controls">` appended to `#stage`, right after the chevrons.
  Rebuilt (cleared and repopulated) on every `paint()`, in `currentLayout` order (baseline
  ascending — the same order the renderer already draws in), so tab order tracks draw order.
- **Per-entity button.** For every id in `currentLayout`: a `<button>` styled
  `position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none` — invisible,
  keyboard-only, and (this is the load-bearing property) `pointer-events:none` means a mouse click
  passes straight through to the canvas beneath it; the existing `resolve()`/`hitTest()` pointer
  path is completely untouched by this row. Keyboard activation of a focused button fires its
  `click` handler regardless of `pointer-events` (that CSS property only gates hit-testing, not a
  synthetic keyboard-triggered click) — this is the mechanism that makes the split safe.
  - `aria-label`: `(entity.takeable ? "take the " : "the ") + record.noun` — **state-invariant by
    design**. A toggleable entity's open/closed *action* differs by state, but its *name* does
    not; state is instead carried on `aria-expanded` (see below), which is the correct ARIA
    pattern for a disclosure control and — practically — keeps the voice audit to one string per
    entity instead of one per entity per state.
  - `aria-expanded`: set to `"true"`/`"false"` only when `entity.states` is truthy (desk1, door1);
    omitted for static entities (chair1, stick1, shelf1) and for takeables. Boolean ARIA tokens are
    already excluded from `voice.spec.mjs`'s runtime sweep (its collector drops pure
    `true`/`false` values), so this needs no audit entry.
  - `onclick`: dispatches exactly what the pointer path would dispatch for that entity —
    `{type:"take", entity:id}` if takeable, else `{type:"toggle", entity:id}`. Same function the
    scene's own click handler already calls; no new dispatch logic, just a second caller.
  - On `focus`: draw this entity's outline on `#overlay` via the existing `stamp`-based halo
    routine (the same one hover already uses) — the visible witness the batch needs. On `blur`:
    the overlay repaints (see below) to whatever the mouse's current hover state is, or clears.
- **Doorway "go" control.** Only present when the on-facing exit's leaf is open (this precisely
  mirrors `resolve()`'s own doorway branch — the leaf covers its own opening when shut, so there is
  no separate `go` target then either, and the pointer resolves a shut leaf's click to `toggle`). A
  fixed, tiny lookup by exit id (M0 has exactly two): `"walk to the hall"` /
  `"walk to the study"` — the same pattern narration.json already uses (exit-id-keyed strings), not
  a general noun-derivation machine, since M0's exit set is fixed and enumerable. Activating it
  dispatches `{type:"go", exit:id}`. On focus, draws the aperture's own rectangle outline
  (`outlineRect`, already used for doorway hover) instead of an entity silhouette.
- **Overlay composition.** Today `showHover(p)`/`clearHover()` unconditionally clear-and-redraw the
  overlay from mouse state alone. This is refactored into one `paintOverlay()` that clears once,
  then draws the focused control's outline (if any) and then the mouse-hover outline (if any) —
  order doesn't matter when they coincide, and when they don't both remain simultaneously visible,
  which is correct (a sighted keyboard user tabbing while a mouse still rests somewhere should see
  both, not have one silently overwrite the other). Every existing call site of `showHover`/
  `clearHover` (mousemove, mouseleave, pointerup, and `paint()`'s post-render hover restore) routes
  through `paintOverlay()` instead; behaviour for mouse-only sessions is identical to today (there
  is never a focused control in a pointer-only session), so this refactor changes no existing
  test's outcome. This is the one place existing code is *restructured* rather than purely added
  to, and it is small (a rename plus one extra draw call, no logic removed).
- **Withdrawal on fault.** `fault()` already withdraws chevrons, cursor, and the overlay together
  ("every affordance withdrawn as one, not left half-true"). It gains one more line: clear
  `#entity-controls`' children (and blur `document.activeElement` if it was inside that container),
  so a faulted page does not leave a keyboard user tabbing into buttons that dispatch into a world
  the page has already disowned.

**`prefers-reduced-motion` — pure CSS, no JS.** One rule:
```css
@media (prefers-reduced-motion: reduce) { #veil { transition: none; } }
```
The veil's black-in phase is already instant (the `.instant` class); this rule makes the fade-*out*
(removing `.on`) instant too, under the media query only — a normal browser session is completely
unaffected (Playwright's default emulated media is "no preference"), so every existing veil-timing
test in `walkthrough.spec.mjs` is untouched. No JS timer logic changes; the 140 ms hold before the
class removal stays (a brief hold before an instant cut is still a cut, not a fade).

**Strings entering the audit.** Ten new `STRINGS` rows: the eight entity names above, plus the two
go-controls. All `verdict: PASS`, `observed: yes`, `adjudicator: row8-10-artifact-critic` (matching
the convention every prior row's fresh strings use — the critic this run spawns is the examination
of record). Honesty check on `observed: yes`: seven of the eight entity names (desk1, chair1,
note1 — visible at cold-boot's study/N; door1 — visible turning to study/E; shelf1, stick1, coin1
— visible turning to hall/N) are collected for free by `voice.spec.mjs`'s *existing, unmodified*
runtime sweep, since it already turns through every facing and `COLLECT()` reads every `aria-*`
attribute generically — no sweep code changes needed for those seven. The eighth (`key1`, "take the
iron key") and both go-controls are **not** reachable by that existing sweep as shipped
(`design/intention.md` row 14, not in this run's scope, already records that the sweep's own
facing-cycling never lands on a facing where `toggle door1`/`go` actually succeed, so the drawer
never truly opens there) — this plan does not touch row 14's territory or its loop. Instead, row
10's own required keyboard-walkthrough test (below) is what genuinely opens the desk while facing
study/N and opens/crosses the door while facing study/E, so it is the true, honest witness for
those three strings — `observed: yes` is correct because *some* test in the suite really produces
them, which is what the column means; it does not require `voice.spec.mjs`'s particular sweep to
be the one that does it.

**SINKS additions:** two new rows, both `index.html`, both `composed`: `setAttribute aria-label`
and `setAttribute aria-expanded` (the site-identity the census computes is the same whether the
code uses `.setAttribute(...)` or the `.ariaLabel =`/`.ariaExpanded =` IDL form, so either style is
fine; plan uses `setAttribute` for clarity next to the existing `inventory.js` precedent).

**Tests** (new: `tests/playwright/keyboard.spec.mjs`; `walkthrough.spec.mjs` is not edited — it is
the delicately-pinned §12.1 script and this plan does not risk it):
1. **Keyboard-only journey**, no `page.mouse.*` call anywhere in the test: `Tab`-navigate and
   `Enter`/`Space`-activate through the same beats §12.1's pointer script covers — chair refusal,
   open desk (reveal), take key, take note, close desk, turn (`ArrowRight`/`ArrowLeft`, already
   keyboard) to face the door, open door, walk through via the go-control, look back, turn back,
   reach the hall's shelf/candlestick/coin, take the coin, return to the study via the door's
   go-control. Assertions are **behavioural parity** (world state, narration lines, inventory
   contents) against the same outcomes §12.1 pins — not a hash-sequence replay, since row 10 does
   not require hash identity with the mouse path, only that the same intents become reachable.
2. **Accessible names**, read directly off `aria-label` for the full control set at study/N,
   study/E (both door states), and hall/N, checked against the exact strings above.
3. **`aria-expanded` toggles** on desk1 and door1's controls across open/close.
4. **Focus order**: the tab sequence at a given facing matches `currentLayout`'s baseline order
   (chevrons first, then entities in draw order, then any go-control last).
5. **Reduced motion**: `page.emulateMedia({ reducedMotion: "reduce" })`, dispatch a `go`, assert
   `getComputedStyle('#veil').transitionDuration === "0s"`; a second page without the emulation
   asserts `"0.38s"` — deterministic, no timing-based flake.
6. **Fault withdrawal**: force a render fault (same technique `shell.spec.mjs`/`voice.spec.mjs`
   already use) and assert `#entity-controls` is empty and nothing in it is focusable.
7. **Mouse path unaffected**: one smoke test clicking through the canvas exactly as before (reusing
   `clickPoint`/`clickCanvasPoint`-style helpers, not importing `walkthrough.spec.mjs` itself)
   confirming a mouse session never sees a focus outline and the entity-control buttons never
   intercept a click — guards the `pointer-events:none` invariant going forward.

## `design/architecture.md`

Updated in the same commit: the "Known limits" bullets that become false are removed/superseded —
"nothing in the spec list owns keyboard or assistive access... rows 8 and 9 are fullscreen and the
intro; neither covers either" and "no keyboard or assistive path to entities... row 10 owns this"
are replaced with a short description of what actually shipped (the DOM-overlay-of-invisible-
buttons mechanism, the state-invariant-name + `aria-expanded` decision, and the `paintOverlay()`
refactor), in the same style as how row 13's closed bullets were annotated in place. The stale
"on a phone the stage is top-aligned... row 8 owns the presentation" bullet is checked against the
shipped CSS (the stage is already vertically centred, per the `justify-content:center` rule already
in `index.html` and its own architecture note) and corrected/removed if it is pre-existing
staleness rather than something this row's work leaves open — verified during the build, not
asserted here in advance.

## Explicitly out of scope

No change to `src/renderer.js`, any fixture, `world.json`/`staging.json`/`narration.json`, row 9
(the speaker layer), row 11/12 (geometry), row 14 (the sweep's facing-cycling bug), `backdrops/`,
`library-src/`, or any AgentPost mailbox. No hash in any existing test changes. `walkthrough.spec.mjs`
is read for pattern only, never edited.
