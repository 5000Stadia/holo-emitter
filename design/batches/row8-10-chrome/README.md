# Row 8/10 batch — fullscreen and keyboard focus

**Unapproved.** This is material submitted for Kabe's eye, not approved reference: it does **not**
belong in `design/references/`, which the playbook reserves for approved work. **Delete this
directory when his verdict lands**; anything he approves graduates to `design/references/` with its
V-stage, by the hand that receives the verdict.

Three captures, Chromium, `file://`, no throttling.

| File | State |
|---|---|
| `01-fullscreen-desktop.png` | 1920×1080, fullscreen entered (real OS API where the sandbox grants a gesture-driven request, the in-page fallback otherwise) — the icon has flipped to its "leave" mark |
| `02-fullscreen-phone-portrait.png` | 390×844, the Fullscreen API deliberately withheld (the iOS-Safari shape row 8 names) — the in-page maximize fallback, with a narration line dispatched first so the capture shows the product's voice surviving the mode change, overlaid at the foot of the picture rather than removed |
| `03-keyboard-focus-ring.png` | 1536×1200, Tab-navigated (no mouse) to the desk's control — the gold silhouette halo on `#overlay`, the same mechanism hover already used, now driven by keyboard focus |

**Why 02 exists in this specific shape.** The first artifact critic pass on this row found that the
fullscreen mode's original design (`display:none` on the narration pane and inventory strip) went
fully silent the moment a player opened the desk in that mode — the reveal line landed in a
zero-height pane, the `aria-live` region left the accessibility tree, and every subsequent `take`
removed an object from the scene with nothing on screen or announced to say where it went. `02` is
the fix: narration and inventory become a fixed overlay at the picture's own foot instead of being
hidden, so the voice is never silenced by picking the presentation mode meant to show the picture
better. It is also the ratio (phone portrait) where the reserve dropping to zero cannot make the
picture itself any larger — the stage is already width-bound there — so `02` is also the honest
case: something real still changes (the chrome's position, not the canvas's size), and the button's
label is never claiming a state it did not reach.

**What to look at:**

1. **01 vs 02, the icon.** Both show the "leave the full screen" mark (contracted corners), not the
   "fill the screen" mark (expanded corners) — the visible glyph moves with the same state the
   `aria-label` does, which an artifact critic found it did not, the first time.
2. **02, the narration text.** "The chair is joined oak through and through; nothing in it opens or
   shuts." is legible over the picture, at the bottom — read it against the fix note above.
3. **03, the halo.** Traces the desk's own drawn silhouette, the same shape hover already produces
   for a mouse — a sighted keyboard user gets the identical visual affordance a mouse user always
   had, at whichever control currently holds focus.

**Known residue, not shown here and not fixed in this row** (filed in the run's report and in
`design/architecture.md`): a `#scene` element screenshot taken while a control is focused is not
byte-identical to one taken with nothing focused, because `#overlay` (the halo's own canvas) has
never carried `class="chrome"` and so does not hide under `body.capture` — harmless while only a
mouse could paint into it, newly relevant now that a keyboard can too. Anyone automating a batch or
flip-pair capture should blur focus before shooting until that is closed.
