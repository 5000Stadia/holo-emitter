# Row 29 — finding (a), tail: the open-facing MEASURE-ERR and the vista's promotion

Row 29 in `design/intention.md`. This spec is finding **(a)**'s second clause only — "the
open-facing MEASURE-ERR (float×None on camera_far walls) fixed so they can even be measured" —
and the promotion path that clause exists to unblock. The garden re-ask's material voice (a),
the per-room voices (a2), the window repetition breaker (b) and the per-room coherence clause
(c) are not this spec's.

## What is broken, exactly

Four facings of the manor are typed `open` in the plan — `entrance_court/S`,
`entrance_approach/E`, `entrance_approach/S`, `entrance_approach/W`. An open facing has no wall
plane: it carries `camera_far_m` instead of `camera_wall_m`, and its scale is quoted at the far
line the plan draws (`far_line`), not at a surface.

Sixteen painted candidates for those four walls are on disk (four rolls each). None of them has
ever been read, for two separate reasons:

1. **The instrument crashes.** `row23_lib.measure_candidate` computes
   `focal = ppm * side["meta_used"]["camera_wall_m"]`, and on an open facing that field is
   `None`. `TypeError: unsupported operand type(s) for *: 'float' and 'NoneType'`. The
   per-candidate guard in `row23_run.sweep` catches it, prints `MEASURE-ERR`, and skips — so no
   reading is ever written, `worst is None`, and the wall is re-asked with
   `"no candidate of this wall could be measured at all"`. It has now spent its whole retry cap
   (4 of 3) on a crash in our own arithmetic. **`retries.json` records all four as refused.**
2. **The promotion refuses by design.** `row23_run.promote_reading` opens with
   `if e.get("camera_wall_m") is None: return None, "…its promotion path is not built yet"`.

## The honest instrument for an outdoor frame, and its defence

The question row 29 asks is what an open facing's frame can honestly be measured on. The answer
is already declared, by the emitter, before any candidate existed — `tools/room-voices.mjs`,
voice `outdoors_open`:

> "A facing the plan types `open` has no wall at all: the view runs out over the forecourt or the
> park. **What closes it and gives the gate its ruler is the low coursed-stone boundary wall that
> fences a forecourt of this date, its coping at the ruled height.**"

So the instrument is a **two-line far-plane ruler**: the wall-**ground** line where the boundary
wall meets the ground at the far line, and the **coping** line 0.95 m above it. Both are inside
brackets the wall's own scaffold wrote down (`floor_window`, `rail_band`), and both are read by
the detectors the corpus already owns — `pick_floor` and `module_in_bands`. This is byte-for-byte
the same pair of detectors an enclosed facing's chair-rail ruler uses; only the *name* of the
anchor changes, and the scaffold names it.

From the two lines:

    px_per_m_at_far_line = coping_above_ground_px / 0.95
    implied_focal_px     = px_per_m_at_far_line × camera_far_m      (the plan's, law (a))
    eye_height_m         = (ground_row − declared_eye_line) / px_per_m_at_far_line

**The three instruments that were considered and rejected as the horizon, and why.**

* *The sky/ground boundary.* Wrong here by construction. On a level camera the true horizon is
  the ground plane's vanishing line — the ground at infinity. These frames have no ground at
  infinity: the voice closes every one of them with a boundary wall, so the sky/ground boundary
  in the picture **is the coping**, which stands 0.95 m up at the far line and therefore sits
  *below* the eye line. On `entrance_court/S` it is 8.9 px below it — two and a half times the
  ±8 % licence the horizon row answers to. Adopting it would put the horizon in the wrong place
  every time and never say so.
* *The ceiling-ramp intersection* (row 20's ruled instrument, row 32's improved one). It fits the
  two side-wall/ceiling junctions. An open facing has neither: no ceiling, and no side walls —
  `wallBands` returns `[]` for it and the validator refuses corners on it outright
  (`row11:meta.open_no_corners`). Run anyway it returns either nothing (`unfitted-horizon` on
  9 of the 16 candidates in the probe) or a fit through two unrelated edges (`ramp 462.3` on one
  frame, 64 px from where a level camera's eye line is). **It has no subject outdoors and is not
  run.**
* *A second ground datum at a second known distance.* Two ground rows at two ruled distances do
  fix the horizon. The frame has exactly one ruled distance — the far line — so this is not
  available. Counting it out loud: the pinhole gives `y_ground = y_h + f·e/d` and
  `y_coping = y_h + f·(e−0.95)/d`; their difference fixes `f` (given the ruled `d`), and one
  equation in `y_h` and `e` remains. **An open frame fixes the LENS and cannot fix the EYE.**

Therefore the ruling this spec builds:

> **On an open facing the horizon is the camera's own declared eye line, and the frame's answer
> to it is the ground row.** The horizon is not a reading off the picture and is never presented
> as one. What the picture *is* gated on is the far-line ground row: the scaffold placed it at
> `horizon + eye × px_per_m`, and `measure_candidate` already reads the eye off it
> (`eye = (floor_y − ref.horizon_y_px) / ppm`) and gates it at ±8 % like every other wall. So the
> eye is gated by a measured row, not asserted — this is not a gate that cannot fail. What is
> gone is the *second, independent* perspective reading an enclosed frame carries, and its
> absence is stated in the record rather than papered over with a ramp fitted to nothing.

The light is read the same way, off a row the frame gives: outdoors the surface overhead is the
sky, and the top of the only built surface in frame is the coping, so `measure.light` is called
with the **measured coping row** where an enclosed facing passes its ceiling row. Its "wall band"
then falls on the boundary wall's own face, which is the only built surface an open frame has.

## The build

Six changes, smallest first. Everything the fenced study walls and the 34 already-promoted manor
walls touch is unchanged, and no band moves anywhere.

1. **`design/plan-draft/measured/row23_lib.py` — the depth anchor is resolved, once.**
   A `_camera_distance(meta_used)` helper returns `(distance, field_name)` from
   `camera_wall_m` / `camera_far_m`, and a facing that names neither is a
   `measurement_withheld` with a sentence saying so — never a `TypeError`. `cfg_from_sidecar`
   carries `facing_type`, the resolved distance and which field it came from.
   `measure_candidate` multiplies by the resolved distance.
2. **`row23_lib._promotion_half` — the far-line ruler, on an open facing only.**
   No `pick_ceiling`, no `find_corners_recession`, no `ceiling_ramp_vp`. Corners stay `None`
   (the law forbids them on an open facing), `storey_height_m` and `implied_wall_width_m` stay
   `None` (an open space has neither), the horizon is `cfg["horizon_declared"]`, the eye is the
   ground row against it at the frame's own measured scale, and the light is read at the coping
   row. It reports itself as instrument `far-line-ruler` and refuses (SUSPECT PAINTING) where the
   eye it reads is outside `EYE_RANGE`.
3. **`row23_lib.promotion_doc` — the vista's §5 record.** `_horizon_votes.far_line_ruler`
   beside `ceiling_ramp_intersection` (which is `null` on a vista, and the reader must handle it
   rather than find a fake one); `_which_horizon` states the ruling above in the record itself;
   `calibration_ref` names **the coping** and not the chair-rail — an outdoor record that says
   "wainscot chair-rail" is finding (a) written into the ledger — while keeping the
   `taken at <n> m` phrase `geometry.spec`'s calibration audit parses.
4. **`row23_run.py` — the sweep.** `promote_reading`'s open refusal is deleted; the depth anchor
   and the facing type come from the plan's own facing (law (a)'s authority for both), with the
   manifest entry's `camera_wall_m` still honoured where it carries one. The camera-miss
   correction says "at the far line" on an open facing instead of "at the wall plane".
5. **`tools/promote-backdrop.mjs` — the vista's promotion.** `drawn` resolves
   `camera_wall_m ?? camera_far_m`; an open facing's horizon comes from `far_line_ruler` and a
   walled one's from the ramp, each required and neither substitutable for the other; the meta
   carries `camera_far_m` + `far_line` and no `camera_wall_m`, null corners, null storey. Two
   gates that only apply to a vista, stated: the scale at the far line inside the standing lens
   band (this is the existing band, reached through the far distance), and the eye the ground row
   implies inside ±`MEASURED_BAND` of the drawing eye — because a vista has no ramp, this is the
   only place the tool can see the eye at all.
6. **`tools/make-scaffold.mjs` — the emitter, per production law clause 6.** The manifest entry
   emits `camera_far_m` and `facing_type` beside `camera_wall_m`, so the NEXT map's open facings
   arrive at the sweep with their own depth anchor and never depend on a second read of the plan.
   (The manifest's existing `type` is the ROOM's type — `entrance_court/N` is `enclosed` and is
   labelled `open` by it — which is why the facing type is added rather than reused.)
7. **[ADDED MID-BUILD] The vista's ask is part of what it answers to.** The first sweep promoted
   `entrance_court/S` from its roll-2 candidate: a **panelled parlour with a chair-rail and two
   enclosed corners**, painted from the prompt this wall carried *before* the `outdoors_open`
   voice existed. Every gate this project owns passed it — the camera gate measured the
   panelling's own chair-rail, called it the boundary wall's coping and returned +4.5 % — and the
   manor's front court went into the store as an interior. That is the Captain's finding (a)
   verbatim, shipped by the very row that exists to remove it, so the row cannot leave it.
   `prompt_lint.py` and `room-voices.mjs` answer the FORWARD half (an outdoor prompt may not name
   interior fabric); nothing answered the backward half, that the art already on disk was asked
   for before that clause existed. So: **an open facing is promoted only from a candidate whose
   own prompt sidecar names no interior fabric**, through the lint's own word list and never a
   third copy of it — refused in `promote-backdrop.mjs` (`[row29:vista.indoor_ask]`,
   `[row29:vista.ask_unreadable]`) and dropped from the pool in the sweep, so the wall falls to
   its outdoor rolls and earns their correction rather than holding on a refusal about an ask
   nobody will make again. On any map emitted after the voice table this clause is a no-op by
   construction, which is the honest statement of what it is for.

8. **[ADDED MID-BUILD] Two records that were lying, and one being destroyed.** Promoting the
   vistas surfaced three record defects, each of which this row created or ran into and none of
   which it may leave: (i) a wall promoted in an earlier pass kept the `correction` and
   `hold_family` written while the instrument was crashing on it, so the ledger said a painted
   wall was waiting for a repaint — the correction now MOVES to `answered_correction` on
   promotion, and moves rather than goes because on `privy_garden/N` that field is Kabe's own
   veto; (ii) a PARKED wall was skipped entirely by the sweep, so whatever sentence it held when
   its cap ran out stayed on it forever whichever route wrote it — a parked wall is now
   re-decided from the pixels like any other, its cap still governing; (iii) `measure.py`'s
   `write_misses` tested `facing` before it tested the round, so one run of the documented writer
   silently deleted **every row-32 miss** and would have deleted this row's — the function's own
   header defect ("the law's evidence must not live in a file whose generator destroys it")
   committed a third time. Order swapped, sort key guarded, verified by running the writer over
   the file and diffing.

## Edges — what this must not touch, and what feels it

* **No band moves.** Not `MEASURED_BAND`, not `EYE_RANGE`, not the ±8 % brackets. An open facing
  is admitted by the same numbers as every other wall or it is not admitted.
* **The fenced walls stay fenced.** `NEVER_PROMOTE` (`study/N`, `study/W`) and `M0_ROOMS`
  (`study`, `hall`) are untouched; none of the four is in either.
* **The enclosed path is byte-identical.** The ramp, the corners, `pick_ceiling`, row 32's
  candidate-row choice and every existing hold family run exactly as before on a facing that
  carries `camera_wall_m`. The 34 promoted manor metas must re-derive to the same bytes
  (`fixtures.spec`'s staleness case re-runs `promote-backdrop.mjs` from each meta and compares).
* **Row 25's open questions are not answered here.** The court mouth's `go` region claiming the
  void above the horizon (25c) and the edge-extension through-view (25d) are row 25's. What this
  spec must not do is make either worse *silently*: `entrance_court/S` carries the manor's one
  `threshold` opening, and promoting it changes that facing from grid to paint. If the
  through-view device composites the approach over the painted vista, that is named in the
  report as a finding for row 25 rather than fixed here — with one exception, below.
* **One renderer clause is in scope if the render shows it.** Row 15's through-view exists
  because a *grid* facing draws a wall across the whole view where the plan says open ground. A
  painted vista draws that open ground. If the promoted `entrance_court/S` renders the approach
  pasted through its mouth over its own painted ground, the honest clause is that a `threshold`
  on a `backdrop: "vista"` facing draws no through-view — the picture is already the thing the
  device was invented to substitute for.
* **Nothing is published and nothing is dispatched.** The sweep promotes and bakes; it never
  publishes, and no re-ask packet is cut.

## Done

* All four open facings measure without a `MEASURE-ERR`; each resolves to promoted, to a
  diagnosed re-ask carrying a correction a prompt can act on, or to an honestly-named hold.
* No wall that is promoted today changes.
* The full suite is green.

## How the four resolved

All sixteen candidates now read; the whole timings ledger's 304 `MEASURE-ERR` records were these
four walls and there are none left.

| wall | outcome | on what |
|---|---|---|
| `entrance_approach/E` | **PROMOTED** | `row23-e0de241b`, −1.3 % focal, eye 1.256 m |
| `entrance_approach/S` | **PROMOTED** | `row23-4cebd01f`, −1.3 % focal, eye 1.142 m |
| `entrance_approach/W` | **PROMOTED** | `row23-ec10aaae`, +1.1 % focal, eye 1.226 m |
| `entrance_court/S` | **PARKED, diagnosed** | its two outdoor-voiced rolls draw the boundary wall 12.0 % small (33.7 px/m against the ruled 38.3 at the far line) — correction: "draw 1.136× larger: 38.3 px/m at the far line, not 33.7". Its two other rolls are the pre-voice interiors clause 7 refuses. The cap is spent, so the wall holds rather than buying a roll; cutting a new packet is a dispatch and is not this row's. |

Run state before → after: 34 → **37 promoted**, 4 → **0 retrying**, 42 held (unchanged), 3 → 4
parked, 2 admitted-not-promoted (unchanged). Per candidate the vista path clocks **0.37 s p50**
against the walled ceiling-ramp path's **4.12 s**, because it runs no instrument on a feature the
picture does not have. Both numbers are in `misses.jsonl` as this row's clock record.

## What this row found and did NOT fix

* **The manifest's `type` is the ROOM's type.** `entrance_court/N|E|W` and `entrance_approach/N`
  are `enclosed` facings of `open` rooms and every manifest entry calls them `open`. Nothing
  routed on it before this row, so nothing was wrong; the sweep and the emitter now both carry a
  true `facing_type` beside it. The stale field is left where it is rather than renamed, because
  a manifest is a generated artifact and renaming a field in it re-cuts every scaffold digest.
* **`entrance_court/S` is the only threshold-bearing open facing**, and it is not promoted, so the
  question of what a painted vista does with a `threshold` aperture does not arise today. It would
  the moment that wall is repainted and promoted: `wallBands` gives an open facing no band, so the
  court mouth survives `crossesAnyBand`, and `drawThroughOpening` would composite the approach's
  picture into a 3095 × 706 rectangle over the vista's own painted ground. The honest clause when
  it arrives is that a `threshold` on a `backdrop: "vista"` facing draws no through-view — the
  picture is already the thing row 15's device was invented to substitute for. **Not built here**:
  it is latent, its rectangle is row 25(c)'s and its composite row 25(d)'s, and a renderer clause
  with no shipped wall to fire on is a guard nobody can prove.
* **Interior fabric on an outdoor room's ENCLOSED facings** is finding (a)'s head, not its tail.
  `privy_garden/N` is promoted and its `measured_room.ruled_storey_height_m` still reads 2.8 m
  from its floor. The vista clauses here are scoped to `facing_type === "open"` on purpose, so
  nothing already in the store moves.
