# Row 25 — the staircase a player can use, and the mouth that means what it draws

The row is in `design/intention.md`'s spec list and `design/architecture.md`'s *Where rows 15 and
19 stop* carries its measurements; nothing of the target or the done clause is copied here. What
follows is how it is built and where the edges are. **Revision 3** is the built row: it answers the plan critic's F1–F52 and carries
the Navigator's three rulings of the second round. Revision 2's shape survived in (a) and (b) and
was overturned in (c)/(d), where the critic's F2 — the drawn extent and the clickable extent are
one decision — turned out to cut the other way from the one revision 2 took.

## What the current build measures, before any fix

Everything below is measured on today's `main` (6f578b1), on the shipped nav world, through the
page's own `resolve()` at 1536×1200 and again at 390×844 — not read off the row's text, because
the world has 56 exits and painted walls now and the row's numbers were taken on a grid world.

**The flights.** Share of the flight's own drawn body at which a real point resolves to travel.
Two definitions, because the row's own number needs both to be readable: BODY is what the renderer
FILLS (`mass_poly` ∪ `treads_poly`); BODY+FOOT adds `floor_poly`, the footprint ring it strokes,
which on a descending flight is the mouth of the well you step into.

| facing | direction | body px | body travels | body+foot px | body+foot travels |
|---|---|---|---|---|---|
| `back_stair/E` | up | 514,856 | 100 % | 514,896 | 100 % |
| `great_stair_hall/N` | up | 209,600 | 100 % | 209,600 | 100 % |
| `back_stair_head/W` | **down** | 29,240 | **71.3 %** | 71,676 | **88.3 %** |
| `stair_landing/S` | **down** | 42,864 | **0 %** | 62,560 | **31.5 %** |

The hand-off's 42,688 px / 0 % and 28,568 px / 71.8 % are the BODY column; the artifact critics'
31.76 % on the current build is the BODY+FOOT column. The px counts differ from the hand-off's by
0.4–2.4 % because the standing-eye wave moved every camera under them; the SHARES are unchanged,
which is what says the defect is the same one and not a new one (F32).

The row names two causes and the measurement finds a third, which is the one that decides the
shape of the fix: on a DESCENDING flight `poly` is not the treads' hull at all. It is
`floor_poly` — the fallback taken whenever fewer than six nose points survive or none is on the
frame — and a descending flight's body is drawn BELOW its footprint ring, so the hit region and
the drawn body are disjoint sets on `stair_landing/S`. The clamped rect is not what loses the
click there; the polygon is.

**The ways through.** Share of each way-through's on-frame rect that the destination's own frame
covers, the rest being `drawImage` edge extension:

| facing | exit | rect | on-frame px | destination covers |
|---|---|---|---|---|
| `entrance_court/S` | `way_…_entrance_approach` | 3095 × 706 | 1,083,749 | **37.7 %** |
| `entrance_approach/N` | `way_…_entrance_court` | 1069 × 588 | 628,359 | **16.1 %** |
| `buttery_pantry/S` | `door_…_hall` | 166 × 500 | 83,000 | **0 %** |
| `great_hall/N` | `door_…_privy_garden` | 185 × 232 | 42,841 | **0 %** |
| `kitchen/N` | `door_…_hall` | 158 × 315 | 49,790 | **0 %** |
| `hall/S` | `door_…_kitchen` | 476 × 887 | 422,469 | **5.9 %** |
| `hall/N` | `door_…_buttery_pantry` | 476 × 887 | 422,469 | **9.6 %** |

50 doors, median coverage 100 %. So the row's "22–38 % destination" is right about the two mouths
and understates the corpus: five DOORS are at or under 10 %, three of them at zero, where the whole
opening is one edge pixel stretched across it. `hall/N`'s doorway is the picture of the fault — a
476 × 953 opening reading as horizontal bands of smeared brown, which is what the Captain is
looking at on the live site.

## The plan

### (a) The hit region is the body the picture draws — and it IS the body, not a shape around it

1. `stairsForFacing` (`tools/plan-projection.mjs`) carries `hit_polys`: the RINGS THE RENDERER
   DRAWS — `mass_poly`, `treads_poly` and `floor_poly` — as the flight's region, and `poly` (the
   single hull) goes. A point is on the flight when it is inside one of them. **Over-claim is then
   zero by construction rather than by corpus** (F13): a convex hull equals that union only while
   the body is convex, and round four rebuilt the mass in runs of adjacent treads precisely
   because clipping can split it, so a hull would bridge the gap between two runs and claim the
   floor between them the day a flight is cut in two.
2. The DECLARED extent — `x/y/w/h` and `raw_w`/`raw_h` — **stays** the noses and the footprint,
   which is a strictly narrower point set than the rings (the foot of every riser lives in the
   quads alone). Revision 2 re-derived it from the body and the Navigator reversed that: those
   numbers are emitter inputs through `flightsForFacing`, and moving them moves every flight
   sentence and every scaffold box under round-locked corpora and in-flight re-asks. So the
   divergence is deliberate, is named at both sites, and costs a click nothing — the region is a
   list of rings and is tested as one, so no click consults the rectangle (F11, answered the other
   way by ruling).
3. `index.html`'s `apertureHolds`: where an aperture carries `hit_polys`, THEY decide and the
   clamped rect is not consulted — it is the intersection of the body with the frame and cannot
   bound a body it has already been cut from. `nearAperture` stops skipping such apertures; the
   ring is measured from the nearest ring's own edges (point-to-segment), never from a rectangle,
   and it is still last and still smallest-wins. The hover halo is drawn from the same rings as a
   SILHOUETTE — stamped and smeared one ring outward, the way an entity's halo is — so the
   highlight traces the true outer boundary of exactly what the resolver claims (F8, F44).
4. **The degenerate case is stated** (F12): a flight whose rings are all empty is not emitted at
   all (the existing `!floorQuad.length && !steps.length` and zero-area guards), and a flight
   emitted with a region carrying no on-frame area is what `[row26:exit.opening_unusable]` refuses
   — now over the same body. `validate-fixtures`' `[row15:meta.stairs_list]` arm moves from `poly`
   to `hit_polys` so a flight with no region is still a finding rather than a silent hole, and
   gains two clauses (b) needs: every drawn face names which face it is, and which way it turns.
5. **Which flights** (F14, F51): ALL TWELVE that draw one. Revision 2 narrowed the clause to the
   four the exit is stated on and the Navigator refused the narrowing — the row's text governs
   unamended. Row 15's rule stands unreversed: the world still says where you may walk, the exit
   still belongs to its own facing, and what changes is that the aperture says WHICH facing that is
   (`turn_to`) and the page turns you there before it walks you. The four facings whose standpoint
   stands inside a flight draw none and answer none, which is honest and is `manor.spec`'s census.
6. **Region versus ink** (F15): a flight's region is geometry, not alpha, and it says so — a flight
   is drawn from `meta.stairs` by the grid rather than stamped from a sprite, so there is no alpha
   channel to bound. The rings ARE the fill instructions; testing them is testing the ink.
7. Checked where the defect lives, at BOTH viewports (F25): `tests/playwright/stair.spec.mjs`
   walks to each of the twelve facings that draw a flight, samples every drawn body pixel at 2 px
   through the page's own `resolve()` and asserts 100 % travel, that the region claims under 1 %
   the picture draws no stair in, and that nothing answers "climb" from farther outside the drawn
   body than §7's ring (4 CSS px, converted per viewport). Then REAL `page.mouse.click`s at the
   four extreme drawn pixels of three descending flights, one of them a side-on facing where the
   click has to turn first. Runtime declared (F29): ~12 s per facing per viewport in Chromium,
   about four minutes for the file in both engines.

### (b) The flight's faces separate under the room's own key

8. The projection says what each drawn face IS and which way it points: `treads_face` (`going` |
   `riser` | `ramp`) and a view-space outward normal per tread quad and per mass ring
   (`x` right, `y` into the frame, `z` up), derived from the plan's run and across axes. The mass
   rings are emitted FAR-TO-NEAR so the near stringer paints over the far one. Nothing about light
   is decided in the projection.
9. `renderer.js` shades each face with the FACING'S OWN KEY (F16) — `meta.key_dir` and
   `meta.key_tint`, not a constant — as `mix(STAIR_BASE → key_tint, GAIN × max(0, n·L))`, where L
   is the key direction read off `key_dir` (`UL`, `L-ABOVE`, `C-ABOVE`, `L-BELOW` are the tokens
   this corpus holds). `STAIR_BASE` stays the flight's own tone and becomes the UNLIT end of the
   range, so no face is ever darker than the value round four measured against the wall behind it
   (F21).
10. **The flight takes the room's own frame-wide falloff too** (F17). The grid's key falloff is
    painted before the flights, so a flat-filled flight sits unlit in a room with a gradient. The
    falloff loop becomes one function and is run a second time CLIPPED TO THE FLIGHT'S RINGS —
    the same stepped `key_tint` cells on the same integer tiling, so it is the same light and not
    a second one, and no canvas gradient object appears anywhere (F22).
11. **And the flight darkens the ground it stands on** (F18): the footprint ring is stroked, before
    the body, with three stepped black strokes of falling width and rising alpha — a pool at the
    contact line, in the same flat-fill idiom as the falloff. Intention quality 2 is "every
    grounded object darkens the ground under it", and a lit solid standing on an untouched floor
    is the sticker the flip test names.
12. **Bars, pinned here before the pixels exist** (F19), each measured INSIDE the flight's own
    drawn pixels on the facings that carry a body (F20), and every one of them a comparison the
    build cannot satisfy by re-tuning a constant:
    - the going's mean luminance exceeds the riser's by ≥ 12 levels a channel, and the riser's
      exceeds the away-turned stringer's by ≥ 12, on `great_stair_hall/N` and `back_stair/E`;
    - the stringer turned TOWARD the key is lighter than the one turned away, on
      `great_stair_hall/W` (the flight seen across its run), which is the same ordering the two
      returns already obey;
    - the largest single colour inside the flight's own body covers under 60 % of it, against
      100 % today;
    - the flight's body still stands ≥ 60 (summed r+g+b) off the frame behind it on every stair
      facing — round four's own measurement, kept as a floor (F21);
    - the floor within one contact-pool width of the footprint is darker than the floor a pool
      width outside it by ≥ 20 levels summed, which is §12.8's own magnitude bar (F18).
13. Both engines, and the hash claim stated (F22): the flight's drawing stays flat rect fills,
    polygon fills and strokes; no gradient object, so the cross-engine expectations are unchanged
    in kind.

### (c) + (d) One decision: the picture draws what the region claims

The critic's F2 is the reason these are one item, and revision 3 takes it the other way round from
revision 2. Round four's rectangle claims a mouth's whole opening; the composite fills that opening
with stretched pixels; and the two halves cannot be fixed apart — shrinking the region alone leaves
the picture inviting a click it refuses, which is this row's own headline defect moved to the front
door. Revision 2 shrank the region. **Revision 3 fixes the picture instead**, and then the region
needs no shrinking at all, because everything it claims is drawn from the document.

14. **The extension claims COLOUR, not detail.** The eight `drawImage` edge and corner blits become
    eight flat fills, each the mean of the destination frame's own outer 16 px band on that side
    (corners: the mean of its own corner block). The destination's real frame is drawn exactly as
    before. What the composite asserts outside it is one fact — the room beyond continues in this
    colour — and nothing about its structure, where it used to assert a room made of horizontal
    bands nobody drew.
    - **Where the destination's frame does not reach the opening at all** (F35: `buttery_pantry/S`,
      `great_hall/N`, `kitchen/N`, all at 0 % coverage) there is no edge to continue and the
      continuation argument fails honestly. Those openings take the mean of the destination's WHOLE
      frame: a room of this colour is there, and this picture cannot say more. Stated as the weaker
      claim it is rather than folded into the same sentence as the others.
    - **Deletion is refused with its reason** (F3/F9): the uncovered part of an opening would then
      be void, which is the defect row 21's through-view was built to end, and three of these doors
      are at zero coverage — it would put a black hole in the wall of three rooms.
    - **The price is measured, not asserted** (F34). The seam between the destination's own frame
      and the fill beside it, in summed rgb over the openings that have one: **median 19, worst 125
      (`hall/N`), 51 on the court's mouth**, against the 60 summed that §12.8 treats as the
      threshold of visible. `ways.spec` pins the worst at 140 so it cannot drift.
    - **The look trade is named and is Kabe's** (the Navigator's ratification, and F39's): on a
      DOORWAY the flat fill is plainly better — `hall/N` stops reading as corduroy. On the
      entrance court's 3095 × 706 mouth, where the fill dwarfs the real frame, the flat bands show
      their edges and my own judgement is that they read no better than the smear did. Both frames
      are in `design/batches/row25-stair/` as `08-entrance_court-S-mouth`, and the trade is
      reversible in one constant.
    - **The structural cure is named and is not this row's**: the composite looks through an
      opening with the DESTINATION STANDPOINT'S camera, which is the wrong camera — that is why
      coverage collapses to zero when two standpoints are far apart laterally. A destination view
      derived at the opening's own axis, or a bottom band assembled from the destination room's own
      floor texture, is rows 35/36's machinery and belongs there.
15. **The `go` region is the opening, unchanged.** No `regions` list, no horizon-to-sill sliver, no
    second space for the row-26 clause and the control placement to disagree with (F1, F4, F5, F8,
    F10 all answered by not building the thing). The rect stays the one home of a way through's
    extent.
16. **The chevron never gives up its whole self** (F6, F7, F40–F42). The yield exists because the
    chrome ECLIPSES a target. So the test is the BUTTON: if some part of the chevron is over no way
    through at all, the part that is over one yields and the rest still turns; if the ways through
    cover the button entirely, the chevron keeps its own meaning, because the alternative is a
    facing with no pointer turn on it. No threshold constant, no new coordinate space, and the
    guarantee is per facing rather than per aperture.
17. Checked: the six chevrons in the manor that are wholly inside a way through are pinned as a
    membership (both of the entrance court's, and four over flights), and the court is driven with
    a real mouse at both viewports — both chevrons turn, and a click inside the mouth away from the
    chrome still walks. `hall/N` and `great_hall/N` are driven at phone width, where the yield must
    still fire. `ways.spec` also asserts that no opening's band outside the destination's frame
    carries more than a colour, which a single reinstated blit fails.
18. The two ledger arms that guard the extension (`renderer.through_view_corners`,
    `renderer.through_view_painted`) move to the new call sites and are re-proved red by deletion,
    so the mechanism keeps its guard rather than losing it.

### What the second round changed, and on whose authority

- **The row's clause governs unamended** [Navigator, ratifying against my own revision-2 narrowing]:
  the target is EVERY facing that draws a flight, not the four the exit is stated on. A flight is
  the one way through drawn on facings its exit does not belong to, so the aperture carries
  `turn_to` and the page turns you to it and then walks it — the two intents a keyboard user
  already presses, from one click on the thing itself. Twelve facings, not four (F51).
- **Emitter inputs are frozen** [Navigator]: `flightsForFacing` feeds prompts and scaffold boxes
  that round-locked corpora and in-flight re-asks depend on, so `raw_w`/`raw_h` and the clamped
  rect stay derived from the noses and the footprint. Revision 2's item 2 is REVERSED (F11 answered
  the other way): the declared extent and the hit region are two different point sets on purpose,
  the divergence is named at both sites, and nothing about a click depends on the rectangle.
- **(d) may be a bounded interim** [Navigator]: non-fabrication over continuity, price measured,
  0 %-coverage cases argued rather than swept in — which is what item 14 does.
- **The halo is a silhouette, not a wireframe** (F44): tracing thirty tread quads would draw a
  wireframe over the picture, so the halo is drawn the way an entity's is — the region's own rings
  stamped and smeared one ring outward — which traces the true outer boundary of exactly what the
  resolver claims.
- **`floor_poly` is IN the region, and here is the argument** (F43): on an ascent it is the ground
  the flight stands on, under its own body; on a descent it is the mouth of the well you step into
  and it is the only part of the stair the frame holds. Both are the flight and a player aiming at
  either means the stair. It is also what the shipped build already claimed on a descending facing,
  so leaving it out would have taken a target away.
- **Side-on flights answer a click now, so F14's silence is gone** — with it, the residue that
  said "nothing happens and there is no line". What replaces it is named in `architecture.md`:
  the four facings whose standpoint stands INSIDE a flight still draw none and answer none, which
  is honest and is `manor.spec`'s census.

## Where the edges are

- **Determinism (§12.2).** Measured, not asserted (F28): all 88 facings rendered from a
  `git archive` of `6f578b1` and from this tree and compared pixel for pixel — **53 byte-identical,
  35 moved**, and the 35 are the twelve that draw a flight (the lighting) plus twenty-three
  openings whose composite carried an extension band, one of them the furnished world's `study/E`
  (F37/F38: the demo world IS in the changed set and is named). No other facing moved.
- **The row-15 batch** is pinned by `plan.spec` to its own commit `1ea511c` and re-rendered from a
  `git archive` of it, so neither (b) nor (d) can make it stale (F23/F52). This row's own batch,
  `design/batches/row25-stair/`, carries both sides drawn by one script from two trees.
- **The human's eye** (F24, F50): ten before/after pairs including a 0 %-coverage door and the
  court's mouth, with the one open look question named in the README. The Navigator surfaces it
  with the live-link note the playbook requires.
- **Row 26's `usablyInFrame`** is untouched: its flight arm still reads `raw_w`/`raw_h`, still
  derived from the noses and the footprint, and this row moved neither.
- **The painted-flight fence** (F26): `[row32:stair.painted_flight_lost]` refuses promotion of any
  wall whose room draws a flight, so no painted facing draws one and (b) is a grid-mode device. The
  day a stair wall is promoted, which of the painted stair and the derived flight owns the click is
  row 27's question one target class out, and it is named as unowned rather than assumed.
- **The key arms** (F48): no shipped meta carries a key from the right or from below, so
  `keyVector`'s other arms are exercised by rendering a doctored meta beside the real one and
  requiring the ordering to follow the token.
- **Rasterisation** (F22): the flight's drawing stays flat rect fills, polygon fills and strokes,
  and the falloff over it is the frame's own stepped cells on the frame's own integer tiling — no
  canvas gradient object anywhere, which is the idiom the sprite painters forbid for cross-engine
  reasons.
- **Not touched:** the world documents, the plan, the standpoint law, `promote-backdrop`'s flight
  clause, the emitter's flight language, `THROUGH_DIM`, the arrival prose, `flightsForFacing`.
