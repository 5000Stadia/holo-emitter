# Row 27 — the aperture/ruler ruling for door-bearing promoted walls

The row is in `design/intention.md`'s spec list; nothing of its target or its done clause is
copied here. What follows is how it was built and where the edges are.

## What forced it now

Row 27 was allocated as a *ruling to write before the first door-bearing wall is promoted*. The
production harvest promoted twenty-two, eleven of them door-bearing, before that happened, and the
Captain found the consequence on the live site the same day: "library door doesnt match up",
"Multiple doors dont match up". So this is the ruling executed against a corpus that already
exists, and the row carries a demotion pass it would not have needed if it had run in its
sequenced place.

## The ruling built under

Not a new judgment. Blueprint §11 — "the painted door opening must coincide with the door leaf's
§4 placement rectangle… if the two diverge, the picture shows a doorway in one place and accepts
the click in another" — plus row 22's precedent, which is blueprint §5 making the approved image
the geometric authority and amending the plan to the painting. **On a promoted wall the painted
door governs its own rectangle.** The world's exits do not move: `library → great_hall` is still
`library → great_hall`, and `id`, `via`, `kind` and the two `beyond_*` metres stay the plan's.

Row 27's own fork — which of a measured meta's two horizontal spaces a promoted door answers to —
is answered where it is asked: the **corner span**, because that is the space a click target lives
in (§11). `px_per_m_at_wall` is printed beside every comparison so the divergence (up to 33 % on
this corpus) stays visible rather than becoming invisible by being resolved.

## The plan, as built

1. **`design/plan-draft/measured/door_measure.py`** — the instrument. A painted doorway here is a
   *void*: the space beyond is unlit relative to the wall plane. The detector takes each column's
   median luminance over the middle 70 % of a ruled door's height, sweeps every darkness cut from
   1 to the wall's own median, and keeps the runs whose edges do not move — 1-D maximal stability.
   Nothing in it is told what width to look for, so a painting that disobeys reads as disobedient.
   The head is the void's top moved onto the lintel's own step; the foot is the wall's measured
   floor line, which is the convention `measure.py`'s hand reading used.

   *Rejected:* strongest-vertical-edge-pair refinement, which is what row 23's `carrier_edges`
   does. On the control frame it moved a reading that was 1 px out to 47 px out, onto the outer
   moulding — the exact trap `measure.py`'s `read_opening` docstring names.

2. **The reading lives in the measurement, not in the promotion.** `promotion_doc`'s rule: every
   field the promotion tool reads is a value the measurement already took, so re-running the
   promotion cannot produce a number nobody measured, and `fixtures.spec`'s staleness case stays a
   check on the document rather than on a detector.

3. **`tools/promote-backdrop.mjs`** assigns and guards. Which painted hole is which doorway is
   fixed by an order-preserving minimum-displacement assignment (doorways keep their order along a
   wall however far the painter slides them). Three clauses, each with a ledger arm:
   `door.painted_width`, `door.painted_overlap`, `door.unmeasured_exit`. The old
   `_measured_px.opening_*` path is gone — one home for the reading, not two.

4. **Tolerance, derived.** A painted way through is admitted between **half and one and a half**
   of blueprint §11's ruled 1.00 m opening at the wall's corner scale. Half a ruled leaf is 0.50 m,
   which nobody walks through; one and a half is 1.50 m, wider than any single-leaf opening the
   plan draws anywhere in the manor. The band is wide *and says why*: what is measured is the void,
   whose edges are the reveal's inside and the architrave's outside, and §11 rules neither — so
   this is a floor on doorway-ness, not a scale tolerance. The scale is already gated at ±8 % by
   the lens band the same tool applies.

5. **The corpus.** `row23_run.py --recheck-doors` puts every already-promoted door-bearing wall
   back through the instrument and demotes what does not survive, with its reason in the run
   state. `promote_reading` now calls the detector, so the production sweep keeps working.

## Where the edges are

- **This must not touch the world.** No exit, no `via`, no `arrive_facing`, no plan. The plan's
  `openings` are untouched; the amendment is per-promotion and lives in the meta.
- **It must not touch a wall with no door.** The detector is only consulted where the plan rules a
  way through, so the sixteen doorless promoted walls re-derive to identical bytes.
- **`meta.building_fields` is unaffected** — `openings` is not in the validator's BUILDING list, so
  a measured rectangle is not a painting re-ruling the building.
- **Downstream that feels it:** `drawThroughOpening` (the destination is composited into this
  rectangle), `nearAperture` and the page's `go` routing, `exit.opening_unusable`'s minimum, and
  any sprite whose §4 placement is a door leaf — none staged today, which is row 28's subject.
- **Not fixed here:** the two demoted walls need re-asks, and the detector cannot read a doorway
  with a lit room behind it. Both are named in `design/architecture.md` as residue.
