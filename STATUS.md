# The warped walls promoted 0 of 11 — what it was, and where it stands

Worktree `agent-a7d632077b316b052`, two commits, not merged.

  bc712af  A warped frame's ruler, floor line and corners are the declared camera's too
  da64673  --warp-held: garden_room/S and closet_chamber/S promote through the warp

## The one measurement

`closet_chamber/S`, warped, read three ways at once:

| | |
|---|---|
| declared meta (`side.meta_used`, and `metaForFacing` agrees to the digit) | corners **-685.4 .. 2221.4 px** = 2906.8 over **8.80 m** = **330.32 px/m**; ruler **330.32 px/m**; floor line **916.87 px** |
| the warp's door target (`plan_apertures.mjs` → `op20`) | **768.0 .. 1098.3** = **330.3 px** = the plan's own 1.00 m at 330.32 px/m |
| the warp's corner targets | 53.2 .. 1482.8 — *the painted width at the declared scale*, because both declared corners fall outside a 1536 px frame |
| `door_measure` on the **OUTPUT**, at the declared corner scale | **768..1098, 330 px, 0.999 m → 1.00×** |

The warp hits its target to a pixel, and every target is the declared camera's.
The hypothesis in the brief — `plan_apertures.mjs` projecting at the painting's
measured meta — is false: it projects at 330.32, the scaffold's own.

The second meta was made **downstream**. `promote-backdrop.mjs` takes its
`apertureScale` from `(meta.corner_x1_px - meta.corner_x0_px) / wall_width_m`,
and the meta it was handed was a **re-measurement of the warped frame**. That
frame shows no corner at all — the declared ones are 685 px off each side — so
the instrument returned the two recession breaks it can see, 53 and 1483. Called
the ends of an 8.80 m wall those are **162.4 px/m**, half the declared ruler, and
`162.4 × 8.8 = 1429 = 1482.78 - 53.22` to the digit. The door was drawn at one
camera and measured at another.

## The fix

For a warped frame (`m._warp` present), the four numbers the warp DETERMINED are
the declared camera's in the promoted meta as well — the wall's **scale**, its
two **corner columns**, and the **floor row** — on exactly the argument the lens
band already carries: *the geometry is the declared camera's by construction*.
The re-measurement is recorded beside them under `measured_room.warp.remeasured`
and nothing is gated on it. The lens band itself is untouched: the reassignment
sits below it, so the focal check still reads the number taken off the pixels.

The floor line had to go with them. Keeping it was the same defect one axis over:
the instrument re-read that row **31.9 px high** (885.0 against the 916.9 the
warp wrote) and its ruler 5.7 % short, and dividing the one camera's floor line
by the other camera's ruler manufactured an eye of **1.087 m — 8.2 % out** from
two readings that were each 1.183 m on their own terms. `great_hall/E` failed the
same way at 8.8 %. Where the check actually lives is the row pin's own
`residual_px`, 0.000 by construction and carried onto the meta.

`WARPED_CAMERA_FIELDS` says so in the record: a warped meta names all five
declared fields and `validate-fixtures.mjs` holds it to exactly those, where the
tolerance path still names the one horizon it declares.

**Test** (`test_mesh_warp.py::test_the_warped_output_reads_at_one_meta`): fixture
B is warped and the OUTPUT is re-read with the promotion's own two instruments —
`door_measure` on the written PNG against the plan width **at the corner scale**
(1.000×, within 3 %), and the red corner studs against `corner_x0/x1_px` (0.09 px
and 0.00 px, within 1 px). `test_mesh_warp.py` and `test_warp_exit.py` pass.

## `--warp-held`, the 11 walls the warp carries

| wall | verdict | promoted |
|---|---|---|
| garden_room/S | promoted on the declared camera | **yes** |
| closet_chamber/S | promoted on the declared camera | **yes** |
| great_hall/E | `[row27:door.unmeasured_exit]` | no |
| back_stair/E | `[row40:material.ask_silent]` | no |
| back_stair_head/E | `[row40:material.ask_silent]` | no |
| back_stair_head/W | `[row40:material.ask_silent]` | no |
| great_stair_hall/W | `[row40:material.ask_silent]` | no |
| stair_landing/W | `[row40:material.ask_silent]` | no |
| great_stair_hall/N | `[row32:stair.painted_flight_lost]` | no |
| great_stair_hall/S | `[row32:stair.painted_flight_lost]` | no |
| stair_landing/S | `[row32:stair.painted_flight_lost]` | no |

**No wall refuses on `[row27:door.painted_width]` any more** — the clause that
refused all 11 is gone from the corpus. The bake derives and validates clean.

The nine that still refuse are **re-asks, not corrections**, and no warp reaches
any of them:

* `[row40:material.*]` — *"it was painted from an ask that never named this
  room's ruled walls or overhead or underfoot … the ask
  `backdrops/source-warped/back_stair-E/warped.prompt.txt` says none of it."*
  The warp copies the original roll's prompt beside the corrected frame rather
  than inventing one, and these rolls predate the material paragraph.
* `[row32:stair.painted_flight_lost]` — *"the plan draws 1 flight(s) in this view
  (great_stair) and the ask … never named a staircase … this roll was asked for
  before the flight language existed."*
* `[row27:door.unmeasured_exit]`, `great_hall/E` — *"the plan rules 1 way(s)
  through this wall and the painting shows 0 — a doorway the world walks through
  with no hole in the picture is not promotable."* A content miss, not a scale
  one; that wall's warp also reveals 752 443 px of frame edge and squeezes the
  strip left of `op11` to ×0.555, so the painting is a long way from its plan.

The brief expected ≥ 8 of 11. The door band was not the only thing in the way:
under it sat nine walls whose ASK is out of date. Two promoted; the rest need a
re-roll, which `--warp-held` already routes them to.
