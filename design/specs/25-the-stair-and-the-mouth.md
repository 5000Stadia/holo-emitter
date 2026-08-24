# Row 25 — the staircase a player can use, and the mouth that means what it draws

The row is in `design/intention.md`'s spec list and `design/architecture.md`'s *Where rows 15 and
19 stop* carries its measurements; nothing of the target or the done clause is copied here. What
follows is how it will be built and where the edges are.

## What the current build measures, before any fix

Everything below is measured on today's `main` (6f578b1), on the shipped nav world, through the
page's own `resolve()` at 1536×1200 — not read off the row's text, because the world has 56 exits
and painted walls now and the row's numbers were taken on a grid world.

**The flights.** Share of the flight's own drawn body (`mass_poly` ∪ `treads_poly`, sampled every
2 px) at which a real point resolves to travel:

| facing | direction | drawn body px on frame | share that travels |
|---|---|---|---|
| `back_stair/E` | up | 514,856 | 100 % |
| `great_stair_hall/N` | up | 209,600 | 100 % |
| `back_stair_head/W` | **down** | 29,240 | **71.3 %** |
| `stair_landing/S` | **down** | 42,864 | **0 %** |

The row names two causes and the measurement finds a third, which is the one that decides the
shape of the fix: on a DESCENDING flight `poly` is not the treads' hull at all. It is
`floor_poly` — the fallback taken whenever fewer than six nose points survive or none of them is
on the frame — and a descending flight's own body is drawn BELOW its footprint ring, so the hit
region and the drawn body are disjoint sets on `stair_landing/S`. The clamped rect is not what
loses the click there; the polygon is.

**Candidate regions, measured on the frame** (same sampling): the union of the drawn rings
(`mass_poly` ∪ `treads_poly` ∪ `floor_poly`) and the convex hull of all of their points are the
SAME SET on every one of the four travel facings — hull over-claim 0.0 %, body coverage 100 %.
The hull is therefore not a looser region than the union here; it is the union, expressed as one
ring a halo can trace.

**The ways through.** Share of each way-through's on-frame rect that the destination's own frame
actually covers, the rest being `drawImage` edge extension:

| facing | exit | rect | on-frame px | destination covers |
|---|---|---|---|---|
| `entrance_court/S` | `way_…_entrance_approach` | 3095 × 706 | 1,083,749 | **37.7 %** |
| `entrance_approach/N` | `way_…_entrance_court` | 1069 × 588 | 628,359 | **16.1 %** |
| `buttery_pantry/S` | `door_…_hall` | 166 × 500 | 83,000 | **0 %** |
| `great_hall/N` | `door_…_privy_garden` | 185 × 232 | 42,841 | **0 %** |
| `kitchen/N` | `door_…_hall` | 158 × 315 | 49,790 | **0 %** |
| `hall/S` | `door_…_kitchen` | 476 × 887 | 422,469 | **5.9 %** |
| `hall/N` | `door_…_buttery_pantry` | 476 × 887 | 422,469 | **9.6 %** |

50 doors, median coverage 100 %. So the row's "22–38 % destination" is right about the two
mouths and understates the corpus: five DOORS are at or under 10 %, three of them at zero, where
the whole opening is one edge pixel stretched across it.

## The plan

### (a) The hit region is the body the picture draws

1. `stairsForFacing` (`tools/plan-projection.mjs`) builds `poly` from EVERY point of the drawn
   body — the mass rings, the tread quads and the footprint ring — as their convex hull,
   unconditionally. The conditional fallback goes: it is what makes a descending flight's region
   disjoint from its body, and "fewer than six nose points" is a proxy for a question the body
   itself answers.
2. `index.html`'s `apertureHolds`: where an aperture carries a polygon, **the polygon decides**.
   The clamped rect is no longer consulted for those, because `x/y/w/h` are the intersection of a
   NARROWER point set with the frame and cannot bound the body they do not contain.
3. `nearAperture` stops skipping poly apertures. The margin is measured from the POLYGON's own
   edge (point-to-segment distance), never from the rect — the rect is the overshoot the skip was
   written to avoid, and measuring from the outline gives the forgiveness without it.
4. Checked where the defect lives: a new `tests/playwright/stair.spec.mjs` walks to each of the
   four travel facings, samples every drawn body pixel and asserts 100 % of them resolve to that
   flight's own exit; then puts REAL `page.mouse.click`s on the two descending facings at the
   body's extremes and asserts the location changed. Over-claim is asserted too (the region may
   not claim bare floor beside the flight), so the case cannot be satisfied by widening.

### (b) The flight's faces separate under the one key

5. The projection stops emitting an undifferentiated `treads_poly` and says what each face IS:
   a per-quad `treads_face` (`going` | `riser`) and, for both, a view-space outward normal
   (`x` right, `y` into the frame, `z` up) derived from the plan's own run and across axes. The
   mass rings get theirs the same way. Nothing about light is decided in the projection.
6. `renderer.js` shades each face by ONE key — the §7 upper-left key the returns already obey
   (`RETURN_LEFT` darker than the facing wall, `RETURN_RIGHT` lighter) — as a Lambert term over
   `STAIR_BASE`: an up-facing going takes most of it, a riser less, a stringer turned toward the
   key more than one turned away. `STAIR_BASE` stays the flight's own tone and becomes the
   unlit end of the range rather than the whole of it.
7. Checked by measuring the frame: the single most common colour over a stair facing drops well
   under the 22–32 % the row measures, the three face classes' mean luminances separate by a
   stated margin, and the ORDER follows the key (going > riser, and the stringer that turns
   toward the key > the one that turns away). Ordering, not absolute values, so the case cannot
   be satisfied by re-tuning a constant.

### (c) A `go` region that claims only what is drawn, and a chevron that yields only where it must

8. **The mouth.** A threshold's rect runs from the top of the frame to the ground at the mouth,
   and above the horizon the only thing under most of it is edge extension. The `go` region
   becomes the union of two rectangles the document can defend: the GROUND BAND (from the horizon
   — the ground plane's own vanishing line — down to the mouth's ground line) and the part of the
   mouth the destination's own frame actually covers. Everything else the mouth's rect claims is
   the manufactured strip, and it stops answering `go`.
9. It is carried as `regions` — a list of rings — on the aperture, computed in ONE place
   (`renderer.wayRegions`), which the page uses for hit-testing and for the hover halo and which
   reads the same `throughPlacement` the composite is drawn with. The rect stays exactly as it is
   in the meta and the fixture, so `[row26:exit.opening_unusable]`, the control placement and the
   validator read the number they already read.
10. **The chevron.** `turnOrGoThrough` yields to a way through only where the chrome is what
    makes it hard to hit: if the way through's own clear span outside the chevron strips is at
    least `MIN_USABLE_APERTURE_PX`, the chevron keeps its meaning and turns. That is the yield's
    own stated justification — "a person clicking a doorway they can plainly see", where the
    chevron is in the way — applied to the case it was not tested on: a 20.4 m mouth spanning the
    whole frame, where nothing is in the way of anything.
11. Checked on `entrance_court/S` (both chevrons turn, and a click in the ground band still
    walks), on `entrance_approach/N` (the real composite and the ground band both walk; the
    stretched strip does not), and on `hall/N` — the facing the yield was built for — which must
    stay green at both viewports.

### (d) The through-mouth composite

12. Re-measured (the table above) and PROPOSED, not executed. The row leaves this judgement open
    and the measurement says the second branch of its done clause cannot be claimed honestly:
    three doors show a room that is entirely one stretched pixel. It also says the first branch —
    "shows only what the destination's frame covers" — cannot be taken by deletion alone, because
    the uncovered part of an opening is then void, which is the defect row 21's through-view was
    built to end, and because the extension carries two ledger arms
    (`renderer.through_view_corners`, `renderer.through_view_painted`) that a bare deletion would
    turn into gates with no subject. The proposal, with its numbers, goes into
    `design/architecture.md` and to the Navigator: the composite's real fault is that the
    destination's frame is the wrong picture to look through an opening at — its camera is a
    standpoint's, not the opening's — and the fix is a destination view derived at the opening's
    own axis, which is a row, not a clause.

## Where the edges are

- **Determinism (§12.2).** (a) and (c) move no pixel: `poly` is not drawn, and the composite and
  its clip are untouched. (b) DOES move pixels, on grid-mode flights only — no painted facing
  draws a flight body — so the §12.6 capture set and every painted hash are unaffected, and the
  scene hash for the twelve stair facings changes deliberately.
- **The bake.** (a) and (b) change `meta.stairs[]`, so `fixtures/nav-manor/fixture.js` and
  `fixtures/demo-study/fixture.js` are re-baked in the same commit; `fixtures.spec`'s staleness
  case is the guard.
- **Row 26's `usablyInFrame`** reads `raw_w`/`raw_h`, which stay derived from the same points they
  are derived from today. The clamped rect keeps its meaning; nothing about that clause moves.
- **Not touched:** the world documents, the plan, the standpoint law, the batches, the emitter's
  flight language, `promote-backdrop`'s flight clause. `flightsForFacing` reads `noses` and
  `floor_poly` and keeps reading them.
- **What outside this feels it:** anything that reads `treads_poly` positionally
  (`manor.spec`'s solidity case, `make-scaffold`'s flight box) — the array stays what it is and
  gains a parallel list rather than changing shape.
