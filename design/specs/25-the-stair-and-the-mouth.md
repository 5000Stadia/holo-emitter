# Row 25 — the staircase a player can use, and the mouth that means what it draws

The row is in `design/intention.md`'s spec list and `design/architecture.md`'s *Where rows 15 and
19 stop* carries its measurements; nothing of the target or the done clause is copied here. What
follows is how it is built and where the edges are. **Revision 2** answers the plan critic's
F1–F32; the shape that changed most is (c) and (d), which are now ONE decision (its F2/F4).

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
2. The DECLARED extent — `x/y/w/h` and `raw_w`/`raw_h` — is re-derived from the SAME points as the
   region (F11), and `flightsForFacing`'s `raw_box` with it, so row 26's
   `[row26:exit.opening_unusable]` scores the body that answers clicks rather than a narrower one.
   One point set, three readers.
3. `index.html`'s `apertureHolds`: where an aperture carries `hit_polys`, THEY decide and the
   clamped rect is not consulted — it is the intersection of the body with the frame and cannot
   bound a body it has already been cut from. `nearAperture` stops skipping such apertures; the
   ring is measured from the nearest ring's own edges (point-to-segment), never from a rectangle,
   and it is still last and still smallest-wins. The hover halo strokes the same rings, so the
   highlight traces exactly what the resolver claims (F8's constraint, and the halo's own rule).
4. **The degenerate case is stated** (F12): a flight whose rings are all empty is not emitted at
   all (the existing `!floorQuad.length && !steps.length` and zero-area guards), and a flight
   emitted with a region carrying no on-frame area is what `[row26:exit.opening_unusable]` refuses
   — now over the same body. `validate-fixtures`' `[row15:meta.stairs_list]` arm moves from `poly`
   to `hit_polys` so a flight with no region is still a finding rather than a silent hole.
5. **Which flights** (F14): the row's clause is measured on the four facings a flight is a `go`
   target on, because row 15 ruled that a flight seen side-on is drawn and is not walkable — "the
   picture shows the building; the world says where you may walk". This row does not reverse that
   ruling. What it owes is to say what the product does on the other eight: nothing happens, and
   there is no line. That is recorded in `architecture.md` as residue against row 24's family
   (wayfinding has no owner), not fixed here, because the fix is a new player-facing string and
   this row would be authoring the wayfinding voice by the back door.
6. **Region versus ink** (F15): a flight's region is geometry, not alpha, and it says so — a flight
   is drawn from `meta.stairs` by the grid rather than stamped from a sprite, so there is no alpha
   channel to bound. The rings ARE the fill instructions; testing them is testing the ink.
7. Checked where the defect lives, at BOTH viewports (F25): `tests/playwright/stair.spec.mjs`
   walks to each of the four travel facings, samples every drawn body pixel at 2 px through the
   page's own `resolve()` and asserts 100 % travel, that the region claims under 1 % the picture
   draws no stair in, and that nothing answers "climb" from farther outside the drawn body than
   §7's ring (4 CSS px, converted per viewport). Then REAL `page.mouse.click`s at the four extreme
   drawn pixels of each descending flight. Runtime declared (F29): ~10 s per facing per viewport
   in Chromium, ~2 minutes for the file in both engines.

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

The critic's F2 is the reason these are one item. Round four's rectangle claims a mouth's whole
opening; the composite fills that opening with stretched pixels; and the two halves cannot be
fixed apart — shrinking the region alone leaves the picture inviting a click it refuses (which is
this row's own headline defect, at the front door), and shrinking the picture alone leaves void.

14. **The extension claims COLOUR, not detail.** The eight `drawImage` edge and corner blits are
    replaced by eight flat fills, each the MEAN of the destination frame's own outer band on that
    side (16 px), sampled once per opening from the offscreen the destination was rendered into.
    The destination's real frame is drawn exactly as it is drawn today. What the composite then
    asserts outside that frame is one fact — "the room beyond continues in this colour" — and
    nothing about its structure, where today it asserts a room made of horizontal bands that
    nobody drew.
    - This is the done clause's second branch, stated plainly and honestly rather than claimed for
      the mechanism as it stands: extension is honest exactly as far as a colour claim, because
      the destination's frame is a camera's crop and the room does continue past it; it stops
      being honest the moment it manufactures detail, which is what a stretched pixel row is.
      Deleting it outright is refused with its reason (F3/F9): the uncovered part of an opening is
      then void, which is the defect row 21's through-view was built to end, and three of these
      doors are at 0 % coverage, so deletion would put a black hole in the wall of three rooms.
    - The structural cure is named and is not this row's: the composite looks through an opening
      with the DESTINATION STANDPOINT'S camera, which is the wrong camera — that is why coverage
      collapses to zero when the two standpoints are far apart laterally. Rows 36/37 are assembling
      floors and a lighting pass, and a through-view whose bottom band comes from the destination
      room's own floor texture is theirs to build. This row proposes; the Navigator ratifies.
15. **The `go` region is then the opening, unchanged** — because after (14) every pixel it claims
    is a pixel the picture draws with something the document holds. `regions` machinery, a
    horizon-to-sill sliver, and a second space for the row-26 clause and the control placement to
    disagree with (F1, F4, F5, F8, F10) are all refused with that as the reason. The rect stays
    the one home of a way through's extent.
16. **The chevron yields unless the way through spans the frame** (F6, F7). The yield exists
    because chrome ECLIPSES a target — "a person clicking a doorway they can plainly see", where
    the chevron is in the way of it. A way through whose on-frame span covers the full width of
    the frame is not being eclipsed by a 4 %-wide button; it is the room. So: if the aperture's
    span covers the frame edge to edge, the chevron keeps its own meaning and turns; otherwise it
    yields exactly as row 15 built it. No threshold constant, no new coordinate space, and the
    pairs round four named stay yielding — `great_hall/N`'s 185 px garden door under a phone
    chevron, `hall/N`'s doorway, both stairs — because none of them spans the frame.
17. Checked: `entrance_court/S` (both chevrons turn, at both viewports; a click inside the mouth
    away from the chrome still walks), `entrance_approach/N` (the mouth still walks), `hall/N` at
    both viewports and `great_hall/N` on a phone (the yield still fires where round four found it),
    and the composite measured — the share of every opening that is real destination frame is
    unchanged, and the share that carries manufactured DETAIL is zero, asserted by comparing each
    extension band against a flat fill of itself.
18. The two ledger arms that guard the extension (`renderer.through_view_corners`,
    `renderer.through_view_painted`) move to the new call sites and are re-proved red by deletion,
    so the mechanism keeps its guard rather than losing it (no gate weakened).

## Where the edges are

- **Determinism (§12.2).** (a) moves no pixel. (b) moves pixels on the twelve stair-carrying
  facings of the nav world, deliberately. (c)/(d) move pixels inside every composited opening —
  47 door-bearing walls plus the two mouths — deliberately. The no-pixel-moved half is MEASURED
  the way this repository measures it (F28): a `git archive` of the pre-row commit, both trees
  captured over the same facing list, byte-compared, with the changed set enumerated by name
  rather than asserted in prose.
- **The row-15 batch** is pinned by `plan.spec` to its own commit `1ea511c` and re-rendered from a
  `git archive` of it, so (b) and (d) cannot make it stale (F23) — the fence row 21's batch has.
  The row-26 batch carries the AFTER for that pair.
- **The human's eye** (F24): the row produces `design/batches/row25-stair/` — before/after frames
  of a lit flight, a descending facing, `hall/N`'s doorway and `entrance_court/S` — and the
  Navigator surfaces it with the live-link note the playbook requires. The shading and the flat
  extension are look decisions and they go to Kabe as images.
- **Row 26's `usablyInFrame`** now scores the same body that answers a click (item 2). Its bar and
  its arithmetic are untouched.
- **The painted-flight fence** (F26): `[row32:stair.painted_flight_lost]` refuses promotion of any
  wall whose room draws a flight, so no painted facing draws one today. (b) is therefore a
  grid-mode device, and the row records that dependency rather than inheriting it silently; the
  day a stair wall is promoted, which of the painted stair and the derived flight owns the click
  is row 27's question one target class out, and it is named as unowned.
- **The scaffold** (F27): `flightRects` stamps the clamped rect, which after item 2 is derived
  from the same body as the region — so painter, gate and player read one shape.
- **Sequencing** (F30): this row re-bakes both fixtures and touches `src/renderer.js`,
  `index.html`, `tools/plan-projection.mjs` and `tools/validate-fixtures.mjs`. It runs on a
  worktree off `main` at 6f578b1 and hands a commit, not a branch.
- **Not touched:** the world documents, the plan, the standpoint law, `promote-backdrop`'s flight
  clause, the emitter's flight language, `THROUGH_DIM`, the arrival prose.
