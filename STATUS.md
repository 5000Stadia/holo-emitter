# Row 43 — the aperture is the inside edge of its frame, and it is traced

## What Kabe ruled

> "use the rectangle detection to identify the approximate door thresholds for a
> following tracing step, where the inside edge of the door is then traced and
> is allowed to veer off of the path of the detected rectangle as long as it
> returns and produces a closed loop."

> "these need to be pretty algorithmic and quick whatever it looks like."

With the frame that proves it (`design/audit/door-corner-inside-edge-2026-08-29.jpg`):
the detected corner (blue) sat inside the dark void ~55 px left of the frame's
actual inside corner (pink).

## The rule

**The rectangle is a prior, not an answer.** `door_measure.py` reads the void —
the maximally stable dark run — and the void's edge is where the paint stops
being black, which on any door with a reveal is short of the jamb. So its
rectangle is now the STARTING GUESS for a tracing pass, and the aperture is what
the pass finds: the jamb's inner edge where it meets the head and the threshold.

**One cyclic dynamic-programming pass, and the loop closes by construction.**
`design/plan-draft/measured/aperture_trace.py` samples the prior's perimeter into
256 points; at each it reads the picture along the outward normal within ±band
(60 px by default) and scores every offset by three things in units of the wall's
own void-to-frame contrast — the size of the step across it (`W_EDGE`), whether
what lies INSIDE the step is the void rather than stone (`W_DARK`, which is what
keeps the loop off the frame's outer arris), and how far it stands from the prior
(`W_PRIOR`, which is the ruling's "nearest the prior"). A single cyclic pass with
an L1 smoothness cost on the offset between neighbouring samples then chooses all
256 offsets at once, with sample 0's offset pinned and paid for at the closure, so
"veer off and return" is the shape of the search and not a hope about the output.
The L1 min-convolution is two prefix scans, which is what makes a 121-offset band
cost 26 ms on a 1536×1024 wall rather than a second.

**The corners are geometry, not samples.** The loop is cut into four by the
prior's own sides; each side gets a total-least-squares line with one rejection
pass. Where both of a corner's sides are straight the corner is their
INTERSECTION — the point the ruling names, which no sample sits on. Where one
side curves, a circle is fitted through the curve and everything its neighbours
have bent into, and the corner is where the straight side touches that arc: on a
half-round head, the springing. `head_kind` is `straight` or `arched` off the
head's sagitta about its own chord, and an arched head carries its fitted centre
and radius.

**Nothing is wired in.** Not promotion, not the warp, not the renderer — by
ruling, until the numbers below are read.

## The numbers

Synthetic (`test_aperture_trace.py`, all pass): a rectangular void with a lit
reveal reproduces its four corners to 0.00 px and reads `straight`; a half-round
head is followed to 0.99 px over the arc (4.34 px at the two grazing samples on
the springing itself, where the arc runs parallel to the search ray) and reads
`arched` at sagitta 0.328 of width; a prior displaced 40 px in each of six
directions recovers the true corners to 1.41 px worst; the same pixels give the
same polygon twice, in 25 ms (40 ms at a 110 px band).

The store: 31 promoted door walls, 26 ms median, 36 ms worst. `buttery_pantry/S`
is Kabe's frame, found in this corpus: the void's run stopped at x 413 and the
trace moved the right jamb out to 463 — 50 px onto the actual reveal.

**Where it is not yet good enough, said plainly.** The threshold is the weak
side: at the foot of a doorway the room beyond is lit, the dark-inside cue
inverts, and the loop follows the floor patch instead of the sill on most walls.
And on the dark panelled manor doors (`muniment_room/E`, `closet_chamber/S`) the
loop wanders onto neighbouring mouldings for a hundred px and comes back, and
the confidence — which is normalised by the wall's own contrast — does not fall
when it does. A confidence that cannot see that is the next thing to fix.
