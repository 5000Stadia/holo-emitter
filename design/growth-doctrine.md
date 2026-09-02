# The growth doctrine — rooms larger than 1x1 (2026-08-31)

[Kabe]: "we need to intelligently document the workflow steps when you enter a
room that is larger than 1x1. Consider this section we just did more of the
phase one of multiple steps forward."

Standing laws every phase obeys: only shape-safe transforms touch pixels
(uniform scale, translate, flip - a circle stays a circle, L-ENVELOPE); drawn
lines anchor at PAINTED junctions and run at vp-true angles; snaps are
translate-clamped into the instrument bands; everything angle-dependent is a
RING the painter generates; every roll is judged by the standing instruments;
the deterministic frame (composed or grow draft) is the fallback; retires are
round-stamped.

## Phase 0 — vocabulary
A room is N x M boxes (box_unit_m each). Facings classify per-axis from the
plan: CROSS facings see a wall one box away (the 1x1 regime the painter
reliably nails); LONG facings see down an axis longer than one box; REVERSE
facings look back down a long axis from its far end.

## Phase 1 — the straight-in long view (DONE, platform/E: +0.26/-2.34)
The grow step, as landed:
1. The 1x1 BASE for the axis = the promoted close view of the far wall
   (generated first on entering any big room - the room's seed).
2. Cut the back wall out of the base AT THE PAINTED MOLDING TOP (pixel-
   detected; the molding rides the WALL side). Wipe lamp-rod stubs from the
   ceiling band above the cut (box-1 edge notably clean).
3. The shell (sides, ceiling, floor) keeps its own painted angles - zero
   reprojection - and becomes the front box of the long view.
4. The cut wall SNAPS: uniform scale + position solved so its painted
   junctions land on the vp-true rays from the base's junctions; then a
   translate-only shift into the declared floor band (+/-8 px) so a faithful
   roll cannot fail its own reading.
5. The ring between shell and wall is wireframe: four junction rays only
   (no dado lines - they bias phantom dividers), launched at painted
   junctions, aimed through the declared vp.
6. Ask: paint the middle seamlessly; nothing outside the ring changes;
   fabric named for provenance (row 29). Back-wall doors ride the cutout;
   side-box doors are drawn in the ring + named (ring_doors).
7. Instruments judge; tolerance/measured promote; the draft (or the composed
   frame) is the fallback.
Tools: deep-draft.py mode "grow" + the grow driver args; emitter branch
`grow_draft` (backdrops/grown/<key>.png ships when present).

## Phase 2 — the sideways long room (1x2: length to the LEFT/RIGHT of entry)
[Kabe]: "Walking into the 2x1. Immediate wall in front, and left, but turn
right and you have an additional one box room depth... instead of immediate
entrance facing producing the two deep image, it will turn right to generate
the depth in the way we did before."
The entrance facing is a normal CROSS wall (1x1 regime). The TURN facing
(right/left down the length) is the LONG facing and takes phase 1 verbatim.
Nothing new mechanically: which facings are long falls out of the plan
(camera_wall_m > box depth); the emitter's grow branch already keys on the
facing, not on the entry direction.

## Phase 3 — the reverse view (far end, looking back)
[Kabe, verbatim]: "from the immediate perspective of the far side of that
direction turned around. Because for reference you can have almost everything
but back wall. Horizontal flip the image first. Then pull the end of the
ceiling inside details to the front and the front to the back, which
stretches and skews it in reverse. Do the same to the side walls and floor.
Then thats the reference image looking back for the enhance and fill the gap
on the back wall."
Steps (to build):
1. Source = the COMPLETED long view of the same axis (phase 1's promoted
   painting - reference chains from finished work).
2. HORIZONTAL FLIP (shape-safe).
3. DEPTH-REVERSE each sweep plane (ceiling, floor, both sides): a 1-D remap
   along the recession that carries far content to near and near to far -
   the deliberate reverse stretch/skew Kabe names. This is a sweep-plane
   operation only; flag: objects painted ON sweeps will skew - they land in
   enhance territory, and the far wall never does (it is the gap).
4. The back wall of the reverse view was BEHIND the original camera: it is
   the gap - wireframe box + doors drawn/named as in phase 1.
5. Enhance-and-fill ask; instruments; fallback.

## Phase 4 — T-junctions (arms of e.g. 3, 2 and 4 boxes)
Decompose into arms sharing the junction box. Order: LONGEST ARM FIRST
(phase 1), then its reverse (phase 3), then the next-longest arm, etc. The
junction box's facings are turn facings (phase 2). Where one arm's ring spans
another arm's opening, the opening is drawn + named in the ring exactly as a
ring door.

## Phase 5 — squares (2x2, 3x3)
Two long axes: longest first (tie: the entry axis), then its reverse, then
the cross axis by phase 2, then its reverse. Off-axis/diagonal standpoints
chain from the nearest completed view - the chaining mechanism Kabe has
DEFERRED ("I'll consider that approach after this is refined"); nothing here
builds it yet.

## The ordering law, in one line
[Kabe]: "first look the direction of the longest distance" - longest axis,
then its reverse, then the remaining axes in falling length; every step's
reference is finished, judged work from an earlier step.

## Amendment (2026-08-31): lights are after-assets
[Kabe]: "make sure that all image generation does not include light fixtures.
It may be smarter to only think of light fixtures as an after asset... the
original plan does still make the most sense. We just need to make sure we
have no ceiling or floor objects, such as light fixtures, or fans or whatever
- or else this process will upside down them."
No generation carries ceiling- or floor-mounted objects; rooms are lit evenly
as if by out-of-frame lamps; fixtures are placed later as assets (the entity
layer). This is the prerequisite that makes phase 3's flip clean - the flip's
only real casualty was fixture orientation. Voices amended; the constraint
rides every minimal ask; the register's material composer follows when rooms
are next re-seeded.

## Amendment (2026-08-31): the wireframe's perspective comes from the 1x1
[Kabe]: "Establish wireframe perspective off 1x1s structure." The ring's rays
run in the BASE'S OWN measured perspective: the painted junction lines are
edge-fit outside the wall box and intersected for the base's true vanishing
point; the declared vp is only the fallback for a degenerate fit. A warped (geometry-exact) base KEEPS the declared vp outright - the fit's
edge noise must not steer a chain whose structure is exact by construction;
the measured-vp path is for raw painted bases.

## Amendment (2026-08-31): the image-led grow (grow2)
[Kabe, verbatim]: "let the image generation produce the corner lines - that's
exact angle is determined by the image itself - and we match in our wire frame
section to the distance where we estimate the far wall to be, and then we stop
those corner lines at an average estimated depth that we believe the back wall
should exist in our wire frame, then the back wall cut out we just set in the
averaged, approximate area and scale, such that the corners are as close to
the back corner wire frame pieces as can be... the image generation will
effectively fill in the gaps and maintain the correct enough visual angles."
No vp forcing, no per-scene pins (a floor line, a dado - the setting decides
what exists; nothing is fit to one scene). Mechanics (deep-draft mode grow2):
each corner line is TRACKED from the paint at its painted junction (prior aim
= corner-through-vp, the paint's own edge rules; the prior stands only where
the sliver is too thin to track); each line stops at the estimated depth
(pure scale toward the image's own centre by the declared depth ratio); the
cutout settles by least-squares UNIFORM scale + translation onto the four
stops. Where the image's angles disagree with declared, the image wins and
the generation reconciles. This also removes the two corner-anchored warps
that compounded the off-centre floor in the first long room (the diagnosis
that led here).


## Amendment — the corner-line detector (2026-08-31)

[Kabe, verbatim]: "I think an intelligent approach is actually to have a corner
line detector overlaid on the image generated and extending into the wire
frame, and then you were just lining up the two generated lines." Earlier, same
day: "one pixel wide, so actually it's a long line coming out of the gray wire
frame section and we position its height and a width so that it pretty
seamlessly overlaps the image corners."

Mechanism (deep-draft.py grow2): detect the painted corner line in the shell as
its own line and extend it into the wireframe — the wireframe line IS the
detected line, aligned by construction, drawn 1px over the paint and 3px inside
the panel. Score = edge energy x cross-line fabric contrast: a grout seam,
masonry course or ceiling beam has the same fabric on both sides and loses to
the true junction, which separates fabrics. Junction pairs register JOINTLY
with mirrored magnitudes (the score is the sum of both sides), so a one-sided
high-contrast impostor — a shadow edge, a wall corner — cannot outvote two true
junction lines; each side then refines independently within +/-15%, so the
paint still rules the exact angle. Priors (corner-through-declared-vp) are aim
only; winner-by-score arbitration between pair sides was tried and failed (the
impostor outscored the truth), which is why the pair votes as one.

Battle-tested 2026-08-31 on four fabrics: booking_hall/N (floor grout
diagonals), kitchen-N, great_hall-N (ceiling beams), back_office-N (steep
modern drop-ceiling corners + a wall pipe): 16/16 corners on the true
junctions, including the steep ones the vp prior underestimated.


## Amendment — grow3, the cover-fit prep guide (2026-08-31)

[Kabe, verbatim, the plan]: "Generate the 1x1 image, produce the wire frame
geometry for the 2x1. Cut the side walls, cieling, floor, back wall. Now,
scale while maintaining aspect ratio so that piece fully covers the wireframe
version and cut/crop off what overlays over the wireframe line out of that
element. No skewing or warping just locked scaling. Same with back wall...
If the image generated element is larger then the wireframe cutout of that
section it scales down to the exact size... that doesn't have a pixel shrink
smaller then the wireframe section then crop off what overlapped... If the
image generated element is smaller... it scales up to the exact size that
closes that gap. And again crop off element outside of the corner boundry."
Correction: "we shouldn't scale it to fully cover the 2x1, just the front 1x1
section." And the ask law: "The fill the gap image pass should understand its
finishing the image from our prep guide image."

Mechanism (deep-draft.py grow3): the image-first corner detector finds the
1x1's own corner lines; OUR corrected lines run through those detected close
corners toward the declared vp, deep corners at the declared depth ratio.
Each plane is cut along the detected lines, uniformly scaled (locked aspect —
L-ENVELOPE by construction) to the minimal size that covers its own FRONT
footprint bounded by the corrected lines, and cropped at those lines; the
middle ring stays wireframe gap with the close-to-deep corner lines drawn;
the back wall cover-fits the deep rect the same way. Coverage carries the
angle mismatch to the crop seams, where the finishing pass reconciles. The
ask frames Image 1 as a prep guide being FINISHED, never as a style reference.


**LOCKED AS STANDARD** [Kabe, 2026-08-31]: "Let's lock this process in as the
standard because that corner alignment was so clean on the first try." grow3
is the standing grow construction; registry law G-PREP.


## Amendment — phase 1 is the close set, complete (2026-08-31)

[Kabe, verbatim]: "Actually, the phase that we should do before any of this
really should be the positions that forward face the wall right in front,
including in this room, the location looking at the door so that we can use
those generated assets in the guide image when it is being looked at from a
distance." And: "So the real first phase one should not include any distance
generation, but every location you can stand facing any immediate wall."

Ordering law restated: PHASE 1 = every standpoint facing an immediate wall
(camera at the close distance), doors included, fixture-free — and NOTHING at
distance. Deep and backward views are built only after, as G-PREP guides
whose far-wall element is cover-fit from the CLOSE painting of the wall being
faced (never from the seed's own back-wall cut), and whose door assets come
from the close door-wall painting.


## Amendment — the close-guide landing loop (2026-09-01, liner-3)

Standing directive [Kabe, 2026-09-01]: "assure a strong programatic process
that produces good results... if we have to do re-rolls I would like you to
assess the situation with the re-rolls because I really want to minimize the
chances that the image execution is not usable."

The re-roll assessment, gallery/N (eight rolls read). Unguided, the painter
shrinks the wall (0.76-0.93 of ruled). Given a close guide as Image 1 it
returns the guide's own scale within ~2% (z 1.0954 -> 1.104/1.091; z 1.0 ->
1.007/0.994; z 0.975 -> 0.995/0.994), so scale is no longer where rolls are
lost. What still lost them was the RETURN: the painter also follows whatever
junction lines the guide draws on the side walls, and a guide whose returns
were lifted from the roll carried the roll's own convergence (returns meeting
at y 390-475 against the ruled 526). Four consecutive PASS-scale rolls were
refused as suspect for that alone.

The construction, tools/close-guide.py + tools/roll-loop.py --guide close:

* The guide is ruled on the DECLARED camera (deriveMeta), never the fixture
  bake — a promoted wall's bake carries the MEASURED camera, and a guide ruled
  on it would teach the last painting's error to the next.
* --precomp z is applied to the ruled geometry about the vanishing point
  BEFORE the planes are cut (never a post-zoom crop: a z<1 paste reveals
  border). Z_TARGET 0.975: the warp finisher enlarges a slightly-small
  painting by cropping (0 px revealed) but shrinks a large one only by
  revealing edge (1.043 -> 8.6% > the 8% budget), so a hair under ruled lands
  every roll inside the finisher.
* The returns are drawn from the ruled convergence only: return covers are
  Gaussian-softened (RETURN_BLUR 10) and the ceiling/floor covers are sourced
  BETWEEN the returns (RETURN_MARGIN 80), so no junction line of the roll's
  own survives; the ruled seams are then ruled over the top. The ask states
  the drawn rows.
* The loop learns z from the pair's measured scale (z <- z * 0.975 / mean),
  clamped to [0.85, 1.3] and to the row that keeps the cornice in frame.

The verifier hazards the campaign found, all hardened (row23_lib.py,
promote-backdrop.mjs):

* run corner scale — the run's corner span was divided by the CELL width
  (door02 read 0.45x); promote-backdrop divides the runSpanOf span.
* one-return admissibility — a 37-px return "fitted" a horizon at 583 from a
  ceiling score of 1.6 against a floor of 48.8, meeting at x 380; a
  one-return fit must meet on the principal column (+/-15% W), inside the
  slope search, with both junctions textured (min score >= 15% of max).
* one picture, one eye — the gate reads the eye off the floor line against
  the ruled horizon row; the returns are a second reading of the same eye.
  Where they converge more than the licence (+/-20 px) plus their own bar
  from that row, the painting is suspect (the 0.8-2.2 m eye band alone
  admitted a return at y 390, eye 1.89 m against the gate's 1.22).
* the ceiling-row tie — the cove light sits 8 px above the cornice on the
  liner's panelled walls and both rows fit a horizon; "tightest wins" chose
  the light band on 9246d44a (y 459 +/-6) and the cornice on its twin
  35d3ce83 (540 +/-12). Among admissible rows the one agreeing with the
  gate's row wins the tie, then the tighter.
* all PASS arrivals are offered to promotion in |delta focal| order; a
  refused nearest no longer parks the wall while a fitted twin waits.

Landing: attempt 7 pair 0.995/0.994 of ruled, both PASS (-6.6% focal; the
painter sets the chair rail ~7 px low, and the rail-to-floor band is the
focal ruler), 35d3ce83 promoted measured, horizon 540. The wall is the guide
handed back — which is the point: the deterministic engine draws the
picture, the painter finishes the surfaces.

## Amendment — the instrument laws the liner-3 close campaign paid for (2026-09-01)

Every roll lost in the liner-3 close set after the loop landed gallery/N was
lost to an INSTRUMENT or a GUIDE defect, not to painter randomness — each one
found by reading the refused roll against its reading and fixed in the tree
(the re-roll assessment Kabe asked for, applied roll by roll). The laws:

* **The rail is read by the ruler's own line.** `module_in_bands` takes the
  darkest row of the rail band; on an ebony dado with a chrome capping strip
  the darkest row lies anywhere in the dado (gallery_far/N's ruled-scale rolls
  FAILed -11/-13%; earlier passes at -6/-7% by luck; saloon_n/N's +2.3% was
  two errors cancelling). `world.json ruler.line: "bright-strip"` (with
  `line_why`) makes `_floor_and_rail` take the brightest row instead, and the
  rail's contrast is then (max-median)/median. A pack states which way its
  ruler reads; the reading records `rail_read` (rule, darkest_row, strip).
* **The corner witness is blind at the eye.** A junction line's slope is
  (row - horizon)/(x - VP_x): the capping strip runs level at eye height and
  witnesses nothing. `witness_corner` fits the kink of the foot and cornice
  lines (the rail abstains within FLAT_WITNESS_PX 40 of the horizon), snaps
  to the strongest vertical seam >= CORNER_SEAM_MIN 12 within +/-30 px, and
  is asked for BOTH walls: the promotion half took its two-return breakpoints
  from a median that a frame-edge trace polluted (writing_room/E: 761/884 for
  corners at 104/1431 -> "unfitted-horizon" on a clean roll). Off a seam the
  witness abstains and the ruled column stands.
* **A guide draws only lit returns.** close-guide's return strips are clamped
  to the zoomed roll's own extent (RETURN_MIN_PX 24) and cut at the witnessed
  corner; a strip that reached past the roll was black, and the painter copies
  what the guide draws on a return (saloon_n/N: a black slab, then an invented
  double corner; saloon_e/E 091fd1d6 doubled its corner from the same cause
  and was RETIRED, backdrops/source/saloon_e-E/retired/README.md).
* **A black return is a family, not a hold.** `void-return` (row23_lib): a
  return band whose luma <= 12 while the wall reads >= 40 is a painting
  fault; it re-asks with the forward correction ("a lit receding side wall in
  the same finish as the facing wall ... not a dark void, a doorway or a
  shadow"), and is never warped through.
* **Instrument hash, world excluded.** The reading cache keys on the
  instrument files; a world.json convention change re-reads only by an
  instrument edit landing with it (the rail rule did).
* **The deep loop is the close loop.** `roll-loop.py --guide deep` rebuilds
  Image 1 before every pair with tools/deep-guide.py (far wall = every cell on
  the wall line from ITS close painting; ceiling/floor/side walls from the
  shell straight ahead; all cut at MEASURED rows, one uniform scale each), z
  learned from the pair against the facing's own declared deep camera. It
  refuses until the close set it consumes is promoted (phase-1 law).
* **Followers cut from their lead.** `--from-wall` builds a wall's first guide
  from a promoted sibling in the same room (writing_room/E,S,W from N; each
  landed on its first pair): the room's own fabric at the ruled scale, no
  unguided rolls spent to seed it.
