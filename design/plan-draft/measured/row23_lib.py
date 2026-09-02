"""Row 23 — the technique matrix's measurement, scoring and report.

Split out of `measure.py` the way `measure_lib.py` is: `measure.py --round row23`
is the entry point and this file is the round's own machinery, so the shared
detectors stay in one home and this round's judgement stays in another.

WHAT MAKES THIS ROUND DIFFERENT FROM EVERY ROUND BEFORE IT
----------------------------------------------------------
The cand-2/3/6 rounds asked "what camera is this painting at". This one asks
"did the painter do what the picture told them", which puts a new thing at risk:
the DETECTOR CONFIGURATION. A window placed by a hand that knows which technique
produced a frame is a free parameter pointed at the answer, and the technique
matrix would measure the hand.

So there is no per-candidate configuration in this file, and there cannot be
one. `cfg_from_sidecar` derives every search window from the SCAFFOLD's own
declared geometry — and a scaffold is per WALL, not per technique. Two frames of
the same wall from different techniques are measured through byte-identical
windows, by construction rather than by discipline.

THE BRACKETS ARE THE STANDING BAND, PROPAGATED
-----------------------------------------------
An unstated bracket width silently sets the verdict: a legible feature three
pixels outside a hand-chosen window is a measurement failure scored as
disobedience. Every width here is `MEASURED_BAND` (blueprint §5's +/-8 % on the
implied focal length AND the eye height) carried through a geometry the scaffold
declares, and the sidecar wrote all of them down before any image existed:

    floor     +/-8 % of the floor-to-horizon separation, which IS eye x ppm
    rail      +/-8 % of the anchor's own height above the floor line
    ceiling   +/-8 % of the ceiling-to-floor span
    carrier   the stamped box dilated by THIS WALL's own measured
              reflex-versus-plan separation

THREE VERDICTS, AND THE MIDDLE ONE IS NEW
------------------------------------------
    PASS / FAIL              a fact about the PAINTING's camera, as always.
    scaffold_feature_absent  a fact about the painting: the feature the scaffold
                             declares is not inside the band the standing licence
                             allows. NEW at this round, and it counts against its
                             technique.
    measurement_withheld     a fact about US: the detector could not run at all
                             (a frame that is not 1536x1024, a moved control).
                             It counts against nothing and stops the round.

The wave's `measurement_withheld` kept its exact meaning rather than being
widened to cover the new case, because a machine-readable kind that has quietly
changed what it asserts is worse than a missing one.

AND SINCE THE MANOR RUN, THIS IS ALSO THE PROMOTION'S INSTRUMENT
----------------------------------------------------------------
`row23_run.py` promotes the walls this file admits, and the §5 record
`tools/promote-backdrop.mjs` reads is built by `promotion_doc` below out of the
very reading that admitted them — see `_promotion_half` for why there is no
second measurement pass and what happened when there was one.
"""
import json
import os
from math import comb

import numpy as np

from measure_lib import load, luma, col_step_profile, top_cols

W, H = 1536, 1024

# THE NO-LABEL BASELINE, per wall, measured and not assumed — the second
# hypothesis `carrier_hypothesis` weighs the scaffold's ask against. study/N is
# row 22's measurement of the approved reference's stone case (outer mouldings
# 0.756 and 2.023 m along the wall, taken from the left corner at that
# painting's own ruler); study/E is the standing-eye wave's own reading of the
# cand-6 door opening, the painting that put a plan-off-centre door dead centre.
REFLEX_PX = {"study/N": (330.4, 569.2), "study/E": (673.0, 860.0)}


# ----------------------------------------------------------------- the config

#: [row 29(a)] THE DEPTH ANCHOR HAS TWO FIELD NAMES AND EXACTLY ONE MEANING.
#:
#: `src/groundplane.js`'s `cameraDistance` has been typed since row 11: an
#: `enclosed` or `corridor` facing views a wall plane and carries
#: `camera_wall_m`; an `open` facing views a drawn ground line with no surface
#: on it and carries `camera_far_m` INSTEAD. This file never learned that. It
#: multiplied by `camera_wall_m` unconditionally, which on the manor's four
#: open facings is `None`, and `float * None` took every one of their sixteen
#: candidates down as a MEASURE-ERR — read by the loop as sixteen bad
#: paintings, and paid for with the whole retry cap of four walls.
#:
#: Resolved once, here, with the same precedence and the same refusal as the
#: renderer's: a facing naming NEITHER is an error the caller sees rather than
#: a default it never learns about.
def camera_distance(meta_used):
    """(distance_m, which_field) for a facing's depth anchor, or (None, None)."""
    if meta_used.get("camera_wall_m") is not None:
        return meta_used["camera_wall_m"], "camera_wall_m"
    if meta_used.get("camera_far_m") is not None:
        return meta_used["camera_far_m"], "camera_far_m"
    return None, None


def _conv_y(kind, floor_y, ppm):
    """Vertical extent of a stamped carrier where the manifest carries none.

    The manor manifest's `stamped` copies hold only (kind, x0, x1) — the
    emitter dropped the vertical fields, found when the first live arrival
    took the sweep down with KeyError 'y0'. The verticals are not data the
    manifest lost so much as data it never needed to carry: the scaffold drew
    them FROM THE CONVENTION TABLE (plan spec §2.5 — a plan view holds no
    vertical dimension), so the same table re-derives them here, at the wall
    plane's own scale, exactly as the label pass stamped them.
    """
    if kind == "fireplace":
        return (floor_y - 1.60 * ppm, floor_y)          # floor line -> 1.60 m
    if kind == "window":
        return (floor_y - 2.00 * ppm, floor_y - 0.90 * ppm)  # sill 0.90 -> head 2.00
    return (floor_y - 2.00 * ppm, floor_y)              # door and anything door-like


#: [row 35] The reference camera every manor wall answers to, in the two numbers
#: that are not per-wall. Their authored home is `src/groundplane.js`
#: (`DRAWING_EYE_M`, `HORIZON_Y`); these are the python-side copies the sweep
#: has carried since the manor run, moved here from `row23_run.sweep` when a
#: second reader appeared, so that the two readers cannot drift apart.
DRAWING_EYE_M = 1.183
HORIZON_Y = 0.51377


def side_from_entry(key, entry, facing_record):
    """[row 35] The per-wall scaffold record, out of the manifest and the plan.

    ONE HOME, BECAUSE THERE ARE NOW TWO READERS. This block was written inline
    in `row23_run.sweep` when the sweep was the only thing that measured a manor
    wall. `row35_snap.py` measures one too — the snap's input geometry is the
    same reading the gate takes, through the same windows, or it is a second
    instrument by the very mechanism `_promotion_half` records — so the record
    the two of them build is one function rather than two copies. Nothing about
    what it builds changed in the move; the comments are the sweep's own.

    `facing_record` is the PLAN's facing (`row23_run.facing_of`), which is the
    authority for the facing's type and for an open facing's depth anchor.
    """
    e, fac = entry, (facing_record or {})
    side = {"facing": key,
            "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                          # An OPEN facing has no wall to be a distance from;
                          # its scale is quoted at the FAR LINE, and the field
                          # name is the mechanism (row 11) — so both are carried
                          # and `camera_distance` resolves which one this facing
                          # has. The manifest is preferred where it carries the
                          # wall distance, and the drawing supplies the far one,
                          # which the manifest of this map never emitted.
                          "camera_wall_m": (e.get("camera_wall_m")
                                            if e.get("camera_wall_m") is not None
                                            else fac.get("camera_wall_m")),
                          "camera_far_m": (e.get("camera_far_m")
                                           if e.get("camera_far_m") is not None
                                           else fac.get("camera_far_m")),
                          "image_h_px": 1024,
                          "floor_line_y": e.get("floor_line_y", 0.7857),
                          "horizon_y": HORIZON_Y,
                          "corner_x0_px": e.get("corner_x0_px"),
                          "corner_x1_px": e.get("corner_x1_px"),
                          "storey_height_m": e.get("storey_height_m"),
                          "wall_width_m": e.get("wall_width_m")},
            "brackets": e["brackets"], "stamped": e["stamped"],
            "outputs": {"scaffold": e["packet"] + "/scaffold.png",
                        "scaffold_sha256": e["scaffold_sha256"]}}
    # [row 29(a)] THE FACING'S TYPE, FROM THE DRAWING. This read `e["type"]`,
    # which is the ROOM's type in the manor manifest — so the four enclosed
    # facings of the two open rooms (`entrance_court/N|E|W`,
    # `entrance_approach/N`) were labelled `open` in every reading they wrote,
    # and a promotion routing on it would take a walled painting down the vista
    # path. The manifest's own `facing_type` is preferred where the emitter now
    # writes one; the drawing answers where it does not.
    side["meta_used"]["facing_type"] = (
        e.get("facing_type") or fac.get("type") or e.get("type"))
    # The anchor's NAME, so an outdoor record does not say "chair-rail". The
    # scaffold's own voice named it when the packet was cut.
    side["meta_used"]["anchor_label"] = {
        "coping": "boundary-wall coping",
        "string_course": "string course",
        "dado_capping": "dado capping",
        "chair_rail": "chair-rail",
    }.get((e.get("voice") or {}).get("anchor"))
    return side


def reference_from_entry(entry):
    """[row 35] The camera a manor wall's candidates are read against.

    Off the wall's OWN manifest entry, never a global one — a manor of 88
    facings has 88 standpoints and therefore 88 scales, and pooling them is the
    defect row 20 removed. Moved out of `row23_run.sweep` beside
    `side_from_entry` for the same reason.
    """
    return dict(focal_px=entry["implied_focal_px"], eye_m=DRAWING_EYE_M,
                horizon_y_px=1024 * HORIZON_Y, band=0.08,
                source="the wall's own manifest entry",
                authority="the meta the page holds for this facing")


def cfg_from_sidecar(side):
    """CFG_ROW23 — a FUNCTION of the wall's scaffold, never a table.

    Everything a detector needs, computed from what the scaffold declared before
    any candidate existed. There is no per-candidate entry and no place to put
    one, which is what makes the round technique-blind rather than carefully
    handled.
    """
    m = side["meta_used"]
    b = side["brackets"]
    floor_y = m["floor_line_y"] * m["image_h_px"]
    ppm = m["px_per_m_at_wall"]
    fw, rb, cb = b["floor_window"], b["rail_band"], b["ceiling_band"]
    # [Kabe, 2026-08-30] THE FLOOR LICENCE IS THE PACK'S. The scaffold's bracket
    # is +/-20 px around the DECLARED floor row, and on every hospital and
    # cyberpunk wall the painted foot stands 10-60 px above it: the old reader
    # clamped to the bracket's edge and nobody saw; the foot rule reads the
    # truth and the truth fell outside the licence, which computes no scale at
    # all and re-asks the painter for a wall the warp corrects in a second.
    # A pack says how far its painters' feet may stand from the declared row
    # (`conventions.floor_licence_px`); the manor says nothing and keeps 20.
    # The SEARCH keeps the scaffold's bracket (a wider minimum-search picks the
    # dark skirting itself: reception/E read 42 px high the first time); only
    # the LICENCE widens.
    _lic = ((_PACK.world.get("conventions") or {}).get("floor_licence_px")) if _PACK else None
    _lic = float(_lic) if isinstance(_lic, (int, float)) and _lic > fw["half_width"] else float(fw["half_width"])

    # HOTFIX (live run 2026-08-24, second crash): manor brackets carry FLOAT
    # column endpoints, and on a wall whose corners overrun the frame they are
    # negative or past 1535 (great_hall/N: -76.7 … 1612.7). The corpus's
    # `cols_of` needs integer, in-frame spans — floats reached numpy as an
    # index array and took the sweep down. Clamped and floored here, at the one
    # place the columns are made; an empty span is dropped rather than passed.
    cols = []
    for x in b["rail_columns"]:
        lo, hi = max(0, int(x[0])), min(1535, int(x[1]))
        if hi > lo:
            cols.append((lo, hi))
    rail_band = (int(rb["centre"] - rb["half_width"]),
                 int(rb["centre"] + rb["half_width"]))
    cam_m, cam_field = camera_distance(m)
    return dict(
        wall=side["facing"],
        ppm=ppm,
        # [row 29(a)] The typed depth anchor, resolved once — see
        # `camera_distance`. `camera_wall_m` is kept beside it because the
        # withheld sentence below quotes the wall case by name.
        camera_wall_m=m.get("camera_wall_m"),
        camera_m=cam_m,
        camera_field=cam_field,
        # [row 29(a)] The FACING's type, not its room's. The manor manifest's
        # `type` is `room.type` (`entrance_court/N` is an enclosed facing of an
        # open room and the manifest calls it `open`), so a reader that routes
        # on it routes four enclosed facings down the vista path. The sweep
        # sets this from the plan's own facing.
        facing_type=m.get("facing_type"),
        # [row 29(a)] WHAT THE ANCHOR IS CALLED, so a record of an outdoor frame
        # does not say "chair-rail". The scaffold's own voice names it (the
        # manifest carries `voice.anchor` per wall); where a caller supplies
        # nothing, the facing type decides, because an open facing's anchor is
        # the boundary wall's coping by `room-voices.mjs`'s own ruling. The
        # ruled height is one number either way — see `RULER_M`.
        anchor_label=(m.get("anchor_label") or
                      ("boundary-wall coping" if m.get("facing_type") == "open"
                       else "chair-rail")),
        image_h_px=m["image_h_px"],
        corner_x0=m["corner_x0_px"], corner_x1=m["corner_x1_px"],
        floor_window=(int(fw["centre"] - fw["half_width"]),
                      int(fw["centre"] + fw["half_width"])),
        floor_licence=(int(fw["centre"] - _lic), int(fw["centre"] + _lic)),
        rail_band=rail_band,
        # THE CEILING SEARCH RUNS FROM THE FRAME TOP TO THE BOTTOM OF THE
        # DECLARED CEILING BRACKET, and it is open upward on purpose. The
        # bracket is +/-8 % around where the PLAN's storey puts the junction,
        # and the manor paintings routinely draw a taller room than the plan
        # rules: `great_hall/N` paints its ceiling at y 218 against a bracket of
        # 313..364, so searching the bracket alone finds a panel head, calls it
        # a ceiling, and every corner and every ramp is then fitted at the wrong
        # row. Opening the span downward instead is worse — at (8, chair-rail)
        # `back_stair/N` picks the wainscot capping at y 530 over its real
        # ceiling at 60, because `pick_ceiling` takes the STRONGEST admissible
        # horizontal and a capping shadow outruns a plaster junction. So: as
        # high as the picture goes, no lower than the licence allows a ceiling
        # to be. Both endpoints are the scaffold's.
        ceiling_search=(8, (int(cb["centre"] + cb["half_width"]) if cb
                            else max(24, rail_band[0]))),
        ceiling_band=(None if not cb else
                      (max(0, int(cb["centre"] - cb["half_width"])),
                       int(cb["centre"] + cb["half_width"]))),
        rail_columns=cols,
        # THE FLOOR SEARCH IS WIDER THAN THE FLOOR WINDOW, on purpose. The
        # corpus's `pick_floor` needs candidates from a real band and then picks
        # the lowest TRUE horizontal inside the declared bracket; handing it only
        # the bracket leaves it nothing to reject.
        floor_search=(max(0, int(fw["centre"] - 6 * fw["half_width"])),
                      min(H - 1, int(fw["centre"] + 6 * fw["half_width"]))),
        carriers=[dict(kind=s["kind"],
                       x0=s["x0"], x1=s["x1"],
                       y0=s.get("y0", _conv_y(s["kind"], floor_y, ppm)[0]),
                       y1=s.get("y1", _conv_y(s["kind"], floor_y, ppm)[1]),
                       ruled_m=round((s["x1"] - s["x0"]) / ppm, 4),
                       tolerance_px=b["carrier_tolerance_px"],
                       reflex=REFLEX_PX.get(side["facing"]),
                       window=(int(w["x0"]), int(w["x1"])))
                  for s, w in zip(side["stamped"], b["carrier_windows"])],
        carrier_tolerance_px=b["carrier_tolerance_px"],
        floor_line_declared=floor_y,
        # [row 32] THE ONE BRACKET THIS ROUND NEVER HAD. Floor, rail and ceiling
        # each got MEASURED_BAND propagated through a geometry the scaffold
        # declares; the HORIZON never did, because until now nothing asked how
        # well a frame fixed it. Same construction, same band: the ruled
        # floor-to-horizon separation IS eye x px_per_m_at_wall, so +/-8 % of it
        # is the licence the horizon row answers to, and a fitted horizon whose
        # own standard error is wider than that licence has not decided
        # anything. Nothing here is chosen.
        horizon_declared=m["horizon_y"] * m["image_h_px"],
        horizon_bracket_px=(b["band"] *
                            (floor_y - m["horizon_y"] * m["image_h_px"])),
        _derivation=b["_derivation"],
    )


# -------------------------------------------------------------- the detectors

def _floor_and_rail(L, cfg, picks):
    """The floor line and the declared anchor, through the CORPUS's own rules.

    An earlier draft of this file took the strongest luminance step inside each
    band, and it was wrong on both control frames — 16 px low on `study/N`'s
    floor line, which moved its implied focal length by 12 %. The lower band is
    full of things that are not the floor: the skirting cap is the STRONGEST
    step on all eight paintings and sits ~34 px above it, floorboard seams are
    strong but converge, and the panelling's base rails are horizontal and are
    not the floor either. `measure.py` already encodes that rule and the wave
    was measured with it.

    So the rules are injected rather than re-derived. What this round supplies
    is the WINDOWS — from the scaffold, per wall — and what the corpus supplies
    is how to read inside them. Re-deriving a detector this project already paid
    for is how a round ends up measuring its own new mistake.
    """
    fcfg = dict(floor_cols=cfg["rail_columns"],
                floor_range=cfg["floor_search"],
                floor_window=cfg["floor_window"])
    floor_y, floor_cands, ev = picks["pick_floor"](L, fcfg)
    # [Kabe, 2026-08-30] THE FLOOR LINE IS THE FOOT, NOT THE SHADOW UNDER IT.
    # `pick_floor`'s minimum is the manor's convention (the darkest row of the
    # shadow seam under the skirting, a few rows BELOW the wall's foot); on the
    # hospital every wall read 5-11 px under its painted base, the door's seam
    # sat below the room's back corner and Kabe saw it. "The centre of the door
    # jamb can't be lower than the back corner of the current room." A pack
    # that wants the seam says so (`conventions.floor_line: "shadow-seam"`,
    # the manor's); every other pack gets the foot above the shadow.
    convention = ((_PACK.world.get("conventions") or {}).get("floor_line")) if _PACK else None
    read = dict(minimum=int(floor_y), rule="shadow-seam",
                saturated=bool(floor_y <= cfg["floor_window"][0] + 1 or floor_y >= cfg["floor_window"][1] - 1))
    if convention == "skirting-base":
        # [liner-3, 2026-09-01] THE FOOT IS THE BASE OF THE DARK SKIRTING. On
        # a wall whose dado and skirting are ebony over a pale floor the
        # luminance minimum sits INSIDE the skirting band and `foot_of` walks
        # up to its top: gallery/N read 749 for a foot painted at 778 and the
        # scale came out 0.86 for a wall drawn at 1.00. This convention takes
        # the strongest LIGHTENING step (dark above, light below) at or under
        # the minimum, inside the licence - where the skirting meets the floor.
        # [liner-3 deep, 2026-09-01] THE FOOT IS THE LOWEST DARK-OVER-LIGHT
        # STEP IN THE LICENCE, NOT THE STRONGEST UNDER THE MINIMUM. Two
        # failures of the first draft on saloon/N's far wall: (1) the
        # minimum is `pick_floor`'s, taken inside the 17 px floor WINDOW, and
        # a far wall painted 10 px nearer than the plan puts its skirting
        # above that window - the minimum then sits on the carpet (637 for a
        # foot at 624) and the search that starts 4 rows over it finds a
        # carpet row (693, +56 % focal); (2) a chrome trim line on the
        # skirting's top is a stronger lightening step than the skirting's
        # own foot (3b3923c7: 69 at 631 over 43 at 642). So the search is
        # the whole licence, a step is read over four rows either side, a
        # candidate is a step at least half the strongest whose rows above
        # are darker than half the rows below (ebony over floor: a carpet
        # motif never is), and the foot is the LOWEST candidate - the base of
        # the dark band, under any trim on it.
        lo, hi = cfg["floor_licence"]
        cols = np.concatenate([np.arange(int(a), int(b)) for a, b in cfg["rail_columns"]])
        prof = L[:, cols].mean(axis=1)
        y0, y1 = int(max(4, lo)), int(min(L.shape[0] - 5, hi))
        ys = np.arange(y0, y1 + 1)
        above = np.array([prof[y - 3:y + 1].mean() for y in ys])
        below = np.array([prof[y + 1:y + 5].mean() for y in ys])
        step = below - above
        base = int(floor_y)
        # A candidate is RELATIVE, never a share of the strongest step: on
        # writing_room/E's navy carpet the foot step is 3 -> 21 under a
        # chrome trim's 3 -> 125, and "half the strongest" chose the trim
        # (732 for a foot at 770). Ebony above (<= 48 in any light), the
        # rows below at least twice it, and at least 8 luma of step.
        if len(step):
            ok = (above <= 48) & (below >= 2.0 * above) & (step >= 8)
            base = int(ys[np.nonzero(ok)[0][-1]]) if ok.any() else int(ys[int(np.argmax(step))])
        read.update(rule="skirting-base", foot=base,
                    saturated=bool(base <= lo + 1 or base >= hi - 1))
        floor_y = base
    elif convention != "shadow-seam":
        foot = foot_of(floor_y, floor_cands)
        read.update(rule="foot", foot=(None if foot is None else int(foot)))
        if foot is not None:
            floor_y = foot
    mod = picks["module_in_bands"](L, floor_y, cfg["rail_band"], cfg["rail_columns"])
    mod["floor_read"] = read
    # [liner-3, 2026-09-01] A BRIGHT ANCHOR IS THE BAND'S MAXIMUM, NOT ITS
    # MINIMUM. `module_in_bands` reads the rail as the darkest row of the band
    # (the manor's undercut under a painted capping). Over an ebony dado the
    # darkest row is the dado itself, anywhere in the band: gallery_far/N
    # dca24599's chrome strip sits at y 523 and the rail read 541 - the band's
    # last row - so a wall painted on the ruled camera (close-guide scale
    # 0.993) FAILED at -11 %; every liner-3 pass so far read 8-15 px under the
    # strip and passed at -6..-7 % by the luck of where the dado's argmin fell.
    # A pack whose ruler is a light line over a dark field says so
    # (`ruler.line: "bright-strip"`), and its rail is the band's brightest row.
    # [saloon/W b60854c9, 426e0fd2] ... and the LINE IS READ AGAINST THE FIELD
    # IT CAPS, not against the band: on the saloon's pale burl the chrome
    # strip is 173 over a wall of 162 (a rise of 0.21 on the band's median;
    # 0.04 on its twin) and both rolls read the strip at the ruled row and were
    # refused as ABSENT. The strip is a bright row with the dark field
    # immediately beneath it (162 -> 7 across three rows); the row that
    # maximises that step is the strip, and the step is its contrast.
    rail_read = dict(rule="darkest-row")
    if (_PACK.ruler.get("line") if _PACK else None) == "bright-strip":
        a, b = cfg["rail_band"]
        cols = np.concatenate([np.arange(int(x0), int(x1)) for x0, x1 in cfg["rail_columns"]])
        Hh = L.shape[0]
        rows = np.arange(int(a), int(b) + 1)
        prof = L[:, cols].mean(axis=1)
        below = np.array([prof[min(Hh - 1, r + 3):min(Hh, r + 12)].mean() for r in rows])
        step = prof[rows] - below
        i = int(np.argmax(step))
        strip = int(rows[i])
        top = float(prof[strip])
        contrast = round((top - float(below[i])) / top, 3) if top > 0 else 0.0
        rail_read = dict(rule="bright-strip", darkest_row=int(mod["dado_rail_y_px"]), strip=strip,
                         strip_luma=round(top, 1), field_below=round(float(below[i]), 1), contrast=contrast)
        mod["dado_rail_y_px"] = strip
        mod["dado_rail_above_floor_px"] = floor_y - strip
    mod["rail_read"] = rail_read
    rail_above = mod["dado_rail_above_floor_px"]
    return floor_y, mod, rail_above


def foot_of(minimum_y, cands, reach=12, below=2):
    """The wall's foot above its shadow: the STRONGEST step candidate within
    `reach` rows above the shadow-seam minimum (or `below` rows under it, where
    the step and the seam coincide). None where no candidate stands there, and
    the caller keeps the minimum.

    Pure, so it is testable on candidate lists alone: eight hospital and
    cyberpunk walls read by eye (treatment_room/W 755, ward/W 735, reception/N
    747, reception/E 781, ward/S 772, noodle_bar/E 776) are what fixed `reach`."""
    best = None
    for c in cands or []:
        y = c.get("y")
        if y is None or y < minimum_y - reach or y > minimum_y + below:
            continue
        if best is None or c.get("strength", 0) > best.get("strength", 0):
            best = c
    return None if best is None else best["y"]


#: [row 32] The names a hold answers to. One per sub-family, so a wall that is
#: still holding says WHICH thing is true of it and the sweep can route on it
#: instead of on prose.
UNFITTED_HORIZON = "unfitted-horizon"
SUSPECT_PAINTING = "suspect-painting"
#: [liner-3, saloon_n/N 31e7ffbd, 2026-09-01] A return painted as a black slab.
#: The gate reads only the facing wall's columns and passed the frame at
#: -1.2 %; the return between the frame edge and the corner was void (mean
#: luma 0.6 over the wall band against 139 on the wall). Not a tolerance
#: family: no warp fills a surface nobody painted, and the correction is to
#: paint it.
VOID_RETURN = "void-return"
#: a return darker than this over the wall band, on a wall brighter than
#: VOID_WALL_MIN, is void
VOID_RETURN_MAX, VOID_WALL_MIN = 12.0, 40.0

#: [row 32, the Captain's tolerance ruling 2026-08-24] The two names the
#: DECLARED-CAMERA promotion path answers to, and the one place they are listed.
#:
#: design/approvals.log: "I think its pretty close and we can accept a tolerance
#: for drift here". Both families are one situation seen from two sides — a wall
#: whose ruler passed its ±8 % band and whose PERSPECTIVE is unusable, either
#: because the two returns converge where no eye stands or because they converge
#: nowhere the error bar admits. Neither is a scale failure, which is what makes
#: them suspects rather than misses, and the declared camera fills exactly the
#: quantity the contradiction destroys: the horizon.
#:
#: `tools/promote-backdrop.mjs` holds the JavaScript copy of this list, beside
#: the refusal that enforces it; the two are asserted equal by the suite for the
#: same reason `prompt_lint`'s word list and `room-voices.mjs`'s are.
TOLERANCE_FAMILIES = (SUSPECT_PAINTING, UNFITTED_HORIZON)


def _admissible(ramp, ceil_y, floor_y, bracket):
    """[row 32] Is this convergence a horizon, or is it two lines crossing?

    Three tests, and not one of them carries a number of its own:

      determinacy   the intersection's own standard error is inside the
                    standing licence for the horizon row (`horizon_bracket_px`)
      in-picture    the convergence lies in the frame. Lines parallel to the
                    view axis converge on the PRINCIPAL POINT, and the prompt
                    rules the camera level with zero tilt, so a principal point
                    outside the picture is two edges crossing, not a horizon.
      between       the horizon lies between the frame's own measured ceiling
                    line and its own measured floor line — an eye inside the
                    room it is standing in. This is the test that refuses the
                    degenerate fit where both ramps come back flat and cross
                    one row below the ceiling with a residual of zero.
    """
    if ramp is None:
        return False, "no pair of side-wall junctions could be fitted at all"
    if ramp.get("sigma_y_px") is None:
        return False, "the fit reports no error bar"
    if ramp["sigma_y_px"] > bracket:
        return (False,
                "the two side-wall junctions converge at y %.1f but only to "
                "+/-%.1f px, and the standing licence on the horizon row is "
                "+/-%.1f px" % (ramp["y"], ramp["sigma_y_px"], bracket))
    if not (0.0 <= ramp["x"] <= float(W)):
        return (False,
                "the two side-wall junctions cross at x %.1f, outside the "
                "picture — a level camera's principal point is in its own "
                "frame, so this is two edges meeting and not a horizon"
                % ramp["x"])
    if not (ceil_y < ramp["y"] < floor_y):
        return (False,
                "the convergence lands at y %.1f, which is not between this "
                "frame's own ceiling line (y %d) and its own floor line (y %d)"
                % (ramp["y"], ceil_y, floor_y))
    if ramp.get("return_side"):
        # [liner-3] ONE RETURN IS TWO LINES THROUGH ONE POINT, and a sliver of
        # a return (gallery/N: 37 px) lets a slope search settle on cornice
        # moulding or carpet and report a tight bar on a line that is not
        # there (ceiling score 1.6 against the floor's 48.8, meeting at x 380
        # with +/-6.8 px). Three tests the pivoted fit owes on top of the
        # pair's: the two junctions are parallel to the view axis, so they
        # meet on the PRINCIPAL COLUMN; a slope that ran to the search's own
        # boundary was not found; and a junction an order weaker than its
        # partner is texture.
        half = 0.15 * W
        if abs(ramp["x"] - W / 2.0) > half:
            return (False,
                    "the one return's ceiling and floor junctions meet at x "
                    "%.1f, but lines parallel to the view axis meet on the "
                    "principal column (x %d +/- %d): this is a junction and "
                    "a stripe of texture crossing, not a horizon"
                    % (ramp["x"], W // 2, int(half)))
        mc, mf = abs(ramp.get("ceiling_slope", 0.0)), abs(ramp.get("floor_slope", 0.0))
        if min(mc, mf) <= 0.045 or max(mc, mf) >= 1.59:
            return (False,
                    "a junction slope ran to the search's own boundary "
                    "(ceiling %.3f, floor %.3f): the line was not found, the "
                    "range was" % (mc, mf))
        sc, sf = ramp.get("ceiling_score") or 0.0, ramp.get("floor_score") or 0.0
        if min(sc, sf) < 0.15 * max(sc, sf):
            return (False,
                    "the two junctions scored %.2f (ceiling) and %.2f (floor): "
                    "the weaker is under a seventh of the stronger, which is "
                    "texture along the search line and not a junction"
                    % (sc, sf))
    return True, None


#: [row 29(a)] The name the vista's horizon answers to, so a reader routes on a
#: token rather than on prose — and so a record that adopted the declared eye
#: line can never be mistaken for one that fitted a ramp.
FAR_LINE_RULER = "far-line-ruler"
CEILING_RAMP = "ceiling-ramp"


def _promotion_half_open(rgb, L, cfg, floor_y, rail_y, ppm, picks):
    """[row 29(a)] The other half of a VISTA's reading — the far-line ruler.

    WHAT AN OUTDOOR FRAME CAN HONESTLY BE MEASURED ON, and the three things it
    cannot. An `open` facing has no wall plane, no ceiling and no side walls:
    `deriveMeta` gives it `camera_far_m` instead of `camera_wall_m`, the
    renderer's `wallBands` returns no band for it at all, and the fixture
    validator refuses it corners outright (`row11:meta.open_no_corners`). So
    every instrument the enclosed path runs — `pick_ceiling`,
    `find_corners_recession`, `ceiling_ramp_vp` — is asked about something that
    is not in the picture, and is not run here.

    WHAT IS: the ruler the emitter DECLARED before any candidate existed.
    `tools/room-voices.mjs`, voice `outdoors_open`: "What closes it and gives
    the gate its ruler is the low coursed-stone boundary wall that fences a
    forecourt of this date, its coping at the ruled height." That is two lines
    the scaffold brackets and the corpus's own detectors read — the wall-GROUND
    line at the far plane (`pick_floor`, inside `floor_window`) and the COPING
    0.95 m above it (`module_in_bands`, inside `rail_band`) — and their
    separation over 0.95 m IS `px_per_m_at_wall` at the far line. Both are the
    gate's own readings, passed in; nothing is measured twice.

    AND THE HORIZON IS NOT ONE OF THEM. Counted out on the pinhole, with the
    ground at `d` and the coping at `h = 0.95` on it:

        y_ground = y_h + f·e/d          y_coping = y_h + f·(e − h)/d

    The difference fixes `f` from the ruled `d`, and one equation in two
    unknowns (`y_h`, `e`) remains. AN OPEN FRAME FIXES THE LENS AND CANNOT FIX
    THE EYE — there is no second ground datum at a second ruled distance in it.
    The three candidates for one, and why each is refused:

      the sky/ground boundary   would be the horizon if the ground ran level to
                                infinity. In these paintings it is never that.
                                Where the boundary wall occludes the distance it
                                IS the coping — 0.95 m up at the far line, and
                                therefore BELOW the eye line, by 8.9 px on
                                `entrance_court/S` against a ±3.6 px licence.
                                Where country shows over the wall it is a RIDGE
                                (`entrance_approach/W` draws its treeline at
                                y 430, ~96 px ABOVE the declared eye line),
                                which is what ground standing higher than the
                                viewer looks like and is not a vanishing line at
                                all. Fitting either would report a horizon the
                                picture never fixed, and neither could say so.
      the ceiling ramp          has no subject: no ceiling, no side walls. Run
                                anyway on these frames it returns nothing on
                                nine of sixteen candidates and, on the rest, a
                                fit through two unrelated edges.
      a second ground datum     the frame has exactly one ruled distance.

    So the horizon here is the CAMERA'S OWN DECLARED EYE LINE — the row the
    scaffold drew and the prompt names — and it is reported as a declaration,
    under its own instrument name, never as a reading. That does not make this
    a gate that cannot fail: the scaffold placed the far-line GROUND row at
    `horizon + eye × px_per_m`, `measure_candidate` reads the eye off it at the
    frame's own measured scale, and the camera gate holds it to the same ±8 %
    every other wall answers to. What is genuinely absent is the SECOND,
    independent perspective reading an enclosed frame carries, and this record
    says so rather than fitting a ramp to nothing.

    THE LIGHT, off a row the frame gives. `measure.light` reads the surface
    OVERHEAD — the plane the key bounces off — in a band above the junction it
    is handed. Outdoors that surface is the sky, and the top of the only built
    thing in frame is the coping, so the coping row is what is passed: the
    tint patch lands in sky, and the function's own "wall band" lands on the
    boundary wall's face, which is the one built surface an open frame has.
    """
    eye_range = picks["EYE_RANGE"]
    horizon_y = cfg["horizon_declared"]
    lit = picks["light"](rgb, L, int(rail_y), floor_y, None, None)
    eye = (floor_y - horizon_y) / ppm if ppm else None

    why, family = [], None
    if eye is None or not (eye_range[0] <= eye <= eye_range[1]):
        family = SUSPECT_PAINTING
        why.append(
            "SUSPECT PAINTING: this frame draws its far-line ground row at y "
            "%.1f, which at the scale its own coping declares (%.1f px/m at the "
            "far line) puts the eye %.3f m above the ground there, outside "
            "%.1f-%.1f m. The ruler and the ground row are two readings of one "
            "picture and they cannot both be true, and no band is widened to "
            "admit that."
            % (floor_y, ppm, eye if eye is not None else float("nan"),
               eye_range[0], eye_range[1]))

    return dict(
        # An open facing has no ceiling line, no corners, no storey and no wall
        # width. Every one of those is None because the thing is absent from the
        # picture, not because the detector failed to find it — and the law
        # forbids three of them on a vista outright.
        ceiling_y_px=None, ceiling_candidates=[], ceiling_rows_tried=[],
        corner_x0_px=None, corner_x1_px=None, corner_evidence=None,
        horizon_bracket_px=round(cfg["horizon_bracket_px"], 2),
        ramp=None, votes={}, light=lit,
        storey_height_m=None,
        implied_wall_width_m=None,
        eye_height_m=(None if eye is None else round(eye, 4)),
        horizon_instrument=FAR_LINE_RULER,
        far_line_ruler=dict(
            instrument=FAR_LINE_RULER,
            y=horizon_y,
            ground_row_px=round(float(floor_y), 2),
            coping_row_px=round(float(rail_y), 2),
            coping_above_ground_px=round(float(floor_y) - float(rail_y), 2),
            ruled_coping_m=RULER_M,
            px_per_m_at_far_line=round(ppm, 3) if ppm else None,
            eye_height_m=(None if eye is None else round(eye, 4)),
            camera_far_m=cfg["camera_m"],
            _which_horizon=(
                "DECLARED, not fitted. An open frame's two ruled lines — the "
                "far-line ground row and the coping 0.95 m above it — fix the "
                "LENS and leave the eye and the horizon in one equation with "
                "two unknowns, so this row is the camera's own eye line and "
                "the picture's answer to it is the ground row, which the "
                "camera gate holds at the standing +/-8 %.")),
        hold_family=family,
        withheld_because=why)


def _promotion_half(rgb, L, cfg, floor_y, ppm, picks, carriers=(), rail_y=None):
    """Everything a PROMOTION needs that a camera verdict does not.

    ONE INSTRUMENT, AND THIS IS THE OTHER HALF OF IT. Until 2026-08-24 the
    manor loop measured each frame twice: once here, for the gate, and once
    through `measure.py`'s `measure_wave`, for the document
    `tools/promote-backdrop.mjs` reads. That second call was given a config
    synthesised from the same manifest brackets WIDENED THREEFOLD — a
    `module_band` of the rail bracket +/-3 half-widths where the gate reads
    +/-1 — and a detector's window is part of the detector, so the two calls
    were two instruments. They disagreed: `great_hall/N` read 117.9 px/m at the
    gate and 104.2 px/m at the promotion, `back_stair/N` 337.9 against 363.2,
    and the promotion's WITHHELD was then computed from a scale no gate had
    ever admitted. Two answers for one quantity is exactly what the loop was
    written to avoid, so the second call is gone and this is what replaced it.

    Nothing here is a new detector. The rules are `measure.py`'s own, injected
    through `picks` like `pick_floor` and `module_in_bands` already are, and
    every window is the scaffold's:

        ceiling line   `pick_ceiling` over the scaffold's rail columns, above
                       the declared chair-rail bracket (see `ceiling_search`) —
                       and, since row 32, CHOSEN from among that call's own
                       candidate horizontals by which one the side walls
                       converge on best (see below)
        corners        `find_corners_recession`, the row-32 rule: where the
                       wall's own architecture stops being axis-aligned
        horizon        `ceiling_ramp_vp` — the row-20 ruled instrument, the two
                       side-wall/ceiling ramps fitted and intersected
        light          `light`, whole-frame, for `key_tint` and `key_dir`

    WHAT ROW 32 CHANGED, AND WHY THE RULING DID NOT MOVE
    ----------------------------------------------------
    The horizon is still the ceiling-ramp intersection and nothing else. What
    changed is what the ramps are given to work with, because the production
    run held 58 of 85 walls and 32 of those holds said "no corners":

    * THE CORNERS. `find_corners_cand2` asks whether the CEILING junction is
      still horizontal at column x. On the study's plaster ceilings that step
      is the strongest thing in the top of the frame; on the manor's boarded
      and beamed ceilings it is not there to collapse, so the scan walked to
      the frame edge and returned None. The row-32 rule asks the whole wall
      instead — a wall square to the camera draws only horizontals and
      verticals, a return draws obliques — and reads both corners off where
      that stops. Blind against the 19 walls the old rule DID read, it lands a
      median 21.5 px away; against the four study controls, whose corners are
      committed, 1 to 6 px.
    * WHICH ROW IS THE CEILING. `pick_ceiling` returns the STRONGEST admissible
      horizontal, and under a boarded ceiling that is a beam. So the ramps are
      fitted at each of its candidates in turn and the row the two side walls
      converge on most sharply is adopted — the picture's own answer to which
      of its horizontals is the junction. This cannot invent a horizon: every
      candidate still has to pass `_admissible`, and a candidate that does not
      is not eligible to be chosen.
    * AN ERROR BAR, AND THE THREE THINGS IT DECIDES. See `_admissible`.

    The scale, the floor line and the calibration feature are NOT recomputed:
    they are the gate's own, passed in, so the number a wall was admitted on is
    the number its meta ships.

    `EYE_RANGE` rides in beside the rules for the same reason they do: it is
    `measure.py`'s own physical-plausibility range and this file does not get
    to keep a second copy of it. NO BAND MOVED at row 32 and none may: the
    suspect family is separated by the error bar, never by widening this.
    """
    # [row 29(a)] A VISTA IS READ BY THE OTHER INSTRUMENT, and the branch is
    # here rather than at the call site so that one function still answers
    # "everything a promotion needs" for every facing type.
    if cfg.get("facing_type") == "open":
        return _promotion_half_open(rgb, L, cfg, floor_y, rail_y, ppm, picks)
    eye_range = picks["EYE_RANGE"]
    ceil_y, ceil_cands, _ = picks["pick_ceiling"](
        L, dict(ceil_cols=cfg["rail_columns"], ceil_range=cfg["ceiling_search"]))
    bracket = cfg["horizon_bracket_px"]
    # A door reveal and a window splay recede like a side wall does, so the
    # frame's own carriers come out of the corner profile. Measured where this
    # reading found them, asked where it did not — never a hand-placed box.
    exclude = []
    for c in (carriers or []):
        if c.get("found"):
            exclude.append((c["x0"], c["x1"]))
        else:
            exclude.append((c["asked_x0"], c["asked_x1"]))
    cx0, cx1, corner_ev = picks["find_corners_recession"](
        L, ceil_y, floor_y, cfg["horizon_declared"], exclude)
    # [liner-3, Kabe: a run wall "should extend the flat wall off screen"] A
    # DECLARED CORNER OUTSIDE THE FRAME IS NOT IN THE PICTURE TO FIND. The
    # recession rule still returns a breakpoint on that side - some panel joint
    # in the flat wall - and the two-ramp horizon then intersects a real return
    # with the far wall's own cornice. So: the open side's corner is the plan's,
    # carried as declared, and the horizon is read off the one return alone
    # (its ceiling ramp against its floor ramp, `single_return_vp`).
    one_return = None
    if cfg.get("corner_x0") is not None and cfg["corner_x0"] < 0:
        one_return, cx0 = "right", int(round(cfg["corner_x0"]))
    elif cfg.get("corner_x1") is not None and cfg["corner_x1"] > W:
        one_return, cx1 = "left", int(round(cfg["corner_x1"]))
    else:
        # [liner-3, writing_room/E 25f33033 / 613d2d07, 2026-09-01] A SEAM THE
        # WALL'S WHOLE HEIGHT OUTRANKS A BREAKPOINT. On a two-return wall the
        # recession breakpoint answered 761/884 and 96/1066 for corners painted
        # at 104/1431 (chrome corner beads, seam strength 50+), and the horizon
        # was then "unfitted" on one roll and "suspect" on the other - two
        # faithful reproductions of their own guide held for a corner nobody
        # measured. The same witness the one-return case stands on reads both
        # sides; it overrides the breakpoint only where it stands on a seam.
        try:
            wc = picks.get("witness_corner")
            if wc is None:
                from measure import witness_corner as wc
            corner_ev = dict(corner_ev or {})
            for side_ in ("left", "right"):
                kx, kev = wc(L, side_, floor_y=floor_y, rail_y=rail_y, ceil_y=ceil_y,
                             horizon_y=cfg["horizon_declared"])
                on_seam = kx is not None and bool((kev or {}).get("seams"))
                corner_ev["%s_witness" % side_] = dict(kev or {}, x=kx, used=on_seam)
                if on_seam:
                    if side_ == "left":
                        cx0 = int(kx)
                    else:
                        cx1 = int(kx)
        except Exception as e:  # a witness that cannot be read leaves the breakpoint
            corner_ev = dict(corner_ev or {}, witness_error=str(e))
    if one_return:
        corner_ev = dict(corner_ev or {}, open_side=("left" if one_return == "right" else "right"),
                         open_side_corner="declared: the plan's corner stands outside the frame")
        # [liner-3, 2026-09-01] THE ONE RETURN'S CORNER IS WHERE THE PAINTED
        # LINES KINK. The recession breakpoint has nothing to fit on a narrow
        # return (gallery/N: r2 0.01-0.1, corners answered at 26..211 for a
        # corner painted at 85) and every ramp read from a wrong corner
        # converged somewhere no eye stands (y 782, 635). The foot, the
        # capping strip and the cornice each kink at the corner; their median
        # is the corner the ramps are pivoted on, each witness recorded.
        try:
            wc = picks.get("witness_corner")
            if wc is None:
                from measure import witness_corner as wc
            kx, kev = wc(L, one_return, floor_y=floor_y, rail_y=rail_y, ceil_y=ceil_y,
                         horizon_y=cfg["horizon_declared"])
        except Exception as e:  # a witness that cannot be read leaves the breakpoint
            kx, kev = None, {"error": str(e)}
        if kx is not None:
            if one_return == "left":
                cx0 = kx
            else:
                cx1 = kx
            corner_ev["return_corner"] = dict(kev, x=kx,
                rule="median of the foot, capping-strip and cornice kinks on the return side")

    # THE CEILING ROW IS THE ONE THE SIDE WALLS AGREE ON. Every candidate is
    # tried; the admissible one with the tightest convergence wins; if none is
    # admissible the frame has not fixed a horizon and says so.
    ramp, ramp_why, tried = None, None, []
    # [liner-3] Where two rows both fit, the one that agrees with the gate's
    # own eye wins before the tighter one. The cove-light band sits 8 px above
    # the cornice on the liner's panelled walls and both rows fit a horizon;
    # on a 92 px return the light band's junction met at y 459 to +/-6 and
    # the cornice's at 520 to +/-8 (gallery/N 9246d44a), so "tightest wins"
    # chose the wrong edge and called the whole picture suspect, while its
    # twin roll (35d3ce83, same guide) drew the tie the other way. One
    # picture, one eye: a row whose convergence lands inside the licence of
    # the row the gate stands on is the row the gate already read.
    gate_h = 1024 * HORIZON_Y
    def _rank(r):
        agrees = abs(r["y"] - gate_h) <= bracket + r["sigma_y_px"]
        return (0 if agrees else 1, r["sigma_y_px"])
    if cx0 is not None and cx1 is not None:
        for c in ceil_cands:
            y = c["y"] - 1
            if one_return:
                srv = picks.get("single_return_vp")
                if srv is None:
                    from measure import single_return_vp as srv
                r = srv(L, y, floor_y, cx1 if one_return == "right" else cx0,
                        one_return, with_error=True)
            else:
                r = picks["ceiling_ramp_vp"](L, y, cx0, cx1, with_error=True)
            ok, why = _admissible(r, y, floor_y, bracket)
            tried.append(dict(ceiling_y_px=y, admissible=ok,
                              sigma_y_px=(r or {}).get("sigma_y_px"),
                              horizon_y_px=(r or {}).get("y"),
                              agrees_with_gate=(bool(_rank(r)[0] == 0) if ok else None),
                              why=why))
            if ok and (ramp is None or _rank(r) < _rank(ramp)):
                ramp, ceil_y = r, y
        if ramp is None:
            ramp_why = (tried[0]["why"] if tried else
                        "no candidate ceiling row could be fitted at all")
    else:
        missing = ("neither corner" if (cx0 is None and cx1 is None)
                   else "only one corner")
        ramp_why = ("the wall's own architecture never stops being square to "
                    "the camera, so this frame gives %s" % missing)

    votes = {}
    if cx0 is not None or cx1 is not None:
        votes, _, _ = picks["horizon_votes"](L, ceil_y, floor_y, cx0, cx1)
    lit = picks["light"](rgb, L, ceil_y, floor_y, cx0, cx1)

    storey = (floor_y - ceil_y) / ppm if ppm else None
    width = ((cx1 - cx0) / ppm) if (ppm and cx0 is not None and cx1 is not None) else None
    eye = ((floor_y - ramp["y"]) / ppm) if (ramp and ppm) else None

    why, family = [], None
    if ramp is None:
        family = UNFITTED_HORIZON
        why.append(
            "the ceiling-ramp horizon is the instrument row 20 ruled, and it "
            "fits the two side-wall/ceiling junctions outside this frame's own "
            "corners: %s. A facing whose side walls fix no horizon issues no "
            "eye height, which is a WITHHELD and not a zero." % ramp_why)
    else:
        sigma_eye = ramp["sigma_y_px"] / ppm if ppm else 0.0
        if eye_range[0] - sigma_eye <= eye <= eye_range[1] + sigma_eye:
            if not (eye_range[0] <= eye <= eye_range[1]):
                # Outside the range, but by less than the reading's own error
                # bar: the picture has not said anything the bar cannot say.
                family = UNFITTED_HORIZON
                why.append(
                    "the horizon this painting's side walls converge on (y "
                    "%.1f +/- %.1f px) puts the eye at %.3f m, outside %.1f-"
                    "%.1f m by less than the reading's own error bar (%.3f m). "
                    "That is not a painting disagreeing with its ruler; it is a "
                    "reading that has not decided, and a WITHHELD is what a "
                    "reading that has not decided issues."
                    % (ramp["y"], ramp["sigma_y_px"], eye, eye_range[0],
                       eye_range[1], sigma_eye))
        else:
            family = SUSPECT_PAINTING
            why.append(
                "SUSPECT PAINTING: the horizon this painting's own side walls "
                "converge on (y %.1f, fixed to +/-%.1f px, inside the +/-%.1f "
                "px the standing licence allows the horizon row) puts the eye "
                "at %.3f m above its own floor line at the scale its own gate "
                "anchor declares (%.1f px/m), outside %.1f-%.1f m. Both "
                "readings are determinate and they are of one picture, so they "
                "cannot both be true: the ruler and the perspective disagree, "
                "and no band is widened to admit that."
                % (ramp["y"], ramp["sigma_y_px"], bracket, eye, ppm,
                   eye_range[0], eye_range[1]))
    if family is None and ramp is not None:
        # [liner-3] ONE PICTURE, ONE EYE. The gate has already read this
        # frame's eye off its floor line and its ruler against the horizon
        # row the prompt rules (a level camera, zero tilt: the row is the
        # principal row), and admitted it within its band. The returns are
        # a second reading of the same eye; where they put it more than the
        # horizon licence and their own bar away from the gate's row, the
        # two readings are of one picture and cannot both be true — a
        # return painted at another camera's convergence (gallery/N
        # a9024bfc: the wall at the ruled scale, its 92 px return meeting at
        # y 390, an eye of 1.89 m against the gate's 1.22). That is the
        # suspect family's own definition, and the 0.8-2.2 m band alone was
        # letting it through as the painting's "own" camera.
        gate_h = 1024 * HORIZON_Y
        if abs(ramp["y"] - gate_h) > bracket + ramp["sigma_y_px"]:
            family = SUSPECT_PAINTING
            why.append(
                "SUSPECT PAINTING: this frame's returns converge at y %.1f "
                "(+/-%.1f px), %.0f px from the horizon row %.1f its own gate "
                "reading stands on, beyond the +/-%.1f px licence and the "
                "reading's own bar. The wall is drawn at one camera and its "
                "return at another; two readings of one picture disagree "
                "about where the eye is, and neither is widened to admit "
                "the other." % (ramp["y"], ramp["sigma_y_px"],
                                abs(ramp["y"] - gate_h), gate_h, bracket))

    void = {}
    if ceil_y is not None and floor_y is not None and floor_y - ceil_y > 40:
        r0, r1 = int(ceil_y) + 10, int(floor_y) - 10
        wall_l = float(L[r0:r1, int(max(0, cx0 or 0)) + 8:int(min(W, cx1 or W)) - 8].mean()) \
            if int(min(W, cx1 or W)) - int(max(0, cx0 or 0)) > 40 else None
        for side_, a_, b_ in (("left", 4, (cx0 or 0) - 6), ("right", (cx1 or W) + 6, W - 4)):
            if b_ - a_ >= 20:
                lum = float(L[r0:r1, int(a_):int(b_)].mean())
                void[side_] = round(lum, 1)
                if wall_l is not None and wall_l >= VOID_WALL_MIN and lum <= VOID_RETURN_MAX:
                    family = VOID_RETURN
                    why.append(
                        "VOID RETURN: the %s return (x %d..%d, rows %d..%d) is painted "
                        "black (mean luma %.1f against %.1f on the wall). The plan rules "
                        "a lit side wall there; a surface nobody painted is not "
                        "warped or tolerated, it is asked for."
                        % (side_, a_, b_, r0, r1, lum, wall_l))
    return dict(
        ceiling_y_px=ceil_y, ceiling_candidates=ceil_cands,
        ceiling_rows_tried=tried, return_luma=void,
        corner_x0_px=cx0, corner_x1_px=cx1, corner_evidence=corner_ev,
        horizon_bracket_px=round(bracket, 2),
        ramp=ramp, votes=votes, light=lit,
        storey_height_m=(None if storey is None else round(storey, 4)),
        implied_wall_width_m=(None if width is None else round(width, 4)),
        eye_height_m=(None if eye is None else round(eye, 4)),
        # [row 29(a)] Which instrument fixed the horizon, as a token. A walled
        # facing's is row 20's ramp; a vista's is the far-line ruler and says so
        # under its own name, so no reader can mistake one for the other.
        horizon_instrument=CEILING_RAMP,
        far_line_ruler=None,
        hold_family=family,
        withheld_because=why)


def carrier_edges(L, cfg, carrier):
    """The painted carrier's two vertical edges, inside the declared window.

    THE WINDOW IS THE SCAFFOLD'S BOX DILATED BY THIS WALL'S OWN MEASURED
    REFLEX-VERSUS-PLAN SEPARATION, so it spans everywhere the painting could
    plausibly have put the feature — including exactly where the unlabelled ask
    already put it once. It is wide on purpose: a narrow window would find the
    feature near the box and score obedience it had not earned.

    AND IT REFUSES TO CHOOSE. Taking the strongest admissible pair is what the
    first draft did, and on BOTH control frames it took the wrong one — it put
    `study/E`'s door at 907..1113 where that painting draws it at 673..860, and
    would have scored a 217 px miss as a 17 px hit. That is not a detector being
    noisy; it is a detector inventing obedience, which is the one result this
    round must never manufacture.

    So every admissible pair is enumerated, and where the best two DISAGREE
    about the answer by more than the arm's own tolerance, the choice of pair
    would choose the verdict — which is exactly the corpus's own straddle
    trigger, and the honest output is that the carrier could not be read here.
    """
    x0w, x1w = carrier["window"]
    x0w, x1w = max(1, int(x0w)), min(W - 2, int(x1w))
    y0, y1 = int(max(0, carrier["y0"])), int(min(H - 1, carrier["y1"]))
    if y1 - y0 < 8 or x1w - x0w < 8:
        return None, "the declared window is smaller than the detector can read"
    xs, d = col_step_profile(L, x0w, x1w, y0, y1)
    cands = top_cols(xs, d, 16, min_sep=8)
    want = carrier["x1"] - carrier["x0"]
    tol_w = 0.25 * want                       # a quarter of the ruled width
    pairs = []
    for i in range(len(cands)):
        for j in range(i + 1, len(cands)):
            a, b = sorted((cands[i][0], cands[j][0]))
            if abs((b - a) - want) > tol_w:
                continue
            pairs.append(dict(x0=float(a), x1=float(b),
                              strength=float(cands[i][1] + cands[j][1]),
                              width_px=float(b - a),
                              edge_delta_px=round((abs(a - carrier["x0"]) +
                                                   abs(b - carrier["x1"])) / 2.0, 2)))
    if not pairs:
        return None, ("no pair of vertical edges inside the declared window is within "
                      "a quarter of the ruled width of each other")
    # [liner-3, 2026-09-01] A DOOR THE PACK DECLARES AS A VOID IS DARK BETWEEN
    # ITS EDGES. On a panelled wall every veneer joint is a strong vertical and
    # every joint pair one panel apart is an admissible door-width pair, so the
    # straddle rule below could never read a liner door (gallery/N: 629..895 at
    # 6 px from the ask, refused for the panel joint pair 415..629). A pack
    # whose doors open onto unlit shadow (`conventions.door_reads_as: "void"`)
    # says so, and a pair whose interior is as bright as the wall around it is
    # panelling, not a doorway - a physical fact of the picture, not a choice.
    _void = ((_PACK.world.get("conventions") or {}).get("door_reads_as")) if _PACK else None
    if carrier["kind"] == "door" and _void == "void":
        wall_level = float(np.median(L[y0:y1, x0w:x1w].mean(axis=0)))
        def interior(q):
            a, b = int(q["x0"]) + 12, int(q["x1"]) - 12
            return float(L[y0:y1, a:b].mean()) if b > a else wall_level
        dark = [q for q in pairs if interior(q) < 0.5 * wall_level]
        if not dark:
            return None, ("no admissible edge pair has the unlit void this world's "
                          "doors open onto between its edges")
        pairs = dark
    pairs.sort(key=lambda z: -z["strength"])
    best = pairs[0]
    # THE DISAGREEMENT THRESHOLD IS THE STANDING LICENCE APPLIED TO THE ARM'S
    # OWN SCALE, not the scale itself. Using the whole tolerance let a rival pair
    # 209 px away from the winner count as agreement on a 226 px arm - which is
    # nearly the entire dynamic range, and is how the first draft scored
    # study/E's 217 px miss as a 17 px hit. 8 % of the arm is the same +/-8 %
    # every other bracket in this round is derived from.
    straddle = 0.08 * carrier["tolerance_px"]
    rivals = [q for q in pairs[1:]
              if abs(q["edge_delta_px"] - best["edge_delta_px"]) > straddle]
    if rivals:
        return None, (
            "the choice of edge pair would choose the verdict: the strongest pair sits "
            "%.0f..%.0f (%.0f px from the ask) and another admissible pair sits "
            "%.0f..%.0f (%.0f px from the ask), which disagree by more than the %.0f px "
            "this arm can resolve"
            % (best["x0"], best["x1"], best["edge_delta_px"],
               rivals[0]["x0"], rivals[0]["x1"], rivals[0]["edge_delta_px"], straddle))
    best["candidates"] = [[int(x), round(s, 2)] for x, s in cands[:8]]
    best["searched"] = [x0w, x1w, y0, y1]
    best["ruled_width_px"] = round(want, 2)
    best["admissible_pairs"] = len(pairs)
    return best, None



def carrier_hypothesis(L, cfg, carrier):
    """Did the label move the carrier? A two-hypothesis test, both declared.

    WHY THIS EXISTS. The edge-pair detector above is honest and, on both control
    frames, unreadable: a panelled wall carries many strong vertical edges, and
    once the detector refuses to choose between admissible pairs it refuses
    nearly always. Reported alone that would leave the row's headline arm blank
    on most rolls — a true statement about our optics that says nothing about
    the paintings.

    So the question is asked in the form it is actually being asked in. There
    are exactly TWO places this round cares about, and BOTH are declared before
    any candidate exists:

        ASK     the edges the scaffold stamps, from the sidecar
        REFLEX  the edges the unlabelled ask already produced on this wall,
                from the corpus — study/N's stone case at 330..569,
                study/E's door opening at 673..860

    Nothing is searched for and nothing is chosen: the column-edge energy inside
    a fixed window around each declared pair is summed, and the answer is which
    of the two the painting put its edges at. A generator that ignored the label
    lands on REFLEX; one that followed it lands on ASK; one that did neither
    lands on neither and says so.

    `margin` is the log ratio of the two energies, so 0 is a dead heat. Its sign
    is the finding and its size is the confidence — and because both hypotheses
    were fixed in advance, neither can be tuned toward the answer.
    """
    ask = (carrier["x0"], carrier["x1"])
    reflex = carrier.get("reflex")
    if reflex is None:
        return None
    y0, y1 = int(max(0, carrier["y0"])), int(min(H - 1, carrier["y1"]))
    lo = int(max(1, min(ask[0], reflex[0]) - 60))
    hi = int(min(W - 2, max(ask[1], reflex[1]) + 60))
    if y1 - y0 < 8 or hi - lo < 8:
        return None
    xs, d = col_step_profile(L, lo, hi, y0, y1)
    half = max(6.0, 0.02 * cfg["ppm"])        # +/-2 cm of wall, never under 6 px

    def energy(pair):
        m = np.zeros(len(xs), dtype=bool)
        for x in pair:
            m |= np.abs(xs - x) <= half
        return float(d[m].sum())

    e_ask, e_reflex = energy(ask), energy(reflex)
    tot = float(d.sum()) or 1.0
    import math
    margin = math.log((e_ask + 1e-6) / (e_reflex + 1e-6))
    return dict(
        ask_px=[round(ask[0], 1), round(ask[1], 1)],
        reflex_px=[round(reflex[0], 1), round(reflex[1], 1)],
        half_width_px=round(half, 1),
        energy_at_ask=round(e_ask, 2), energy_at_reflex=round(e_reflex, 2),
        share_at_ask=round(e_ask / tot, 4), share_at_reflex=round(e_reflex / tot, 4),
        log_margin=round(margin, 3),
        leans=("ask" if margin > 0.15 else "reflex" if margin < -0.15 else "neither"),
        _why="both hypotheses are declared before any candidate exists - the ask "
             "from the scaffold's sidecar, the reflex from this wall's own "
             "measured no-label painting - so neither can be tuned toward the "
             "answer and nothing is searched for.")


# ------------------------------------------------------------- one candidate

def measure_candidate(path, side, cfg, ref, picks):
    """One returned frame, through this wall's own windows.

    `ref` is the camera this wall's candidates are read against — the Kabe-ruled
    reference set for `study/N`, and `study/E`'s OWN admitted cand-6 reading for
    `study/E`, which is stated in the output rather than blurred into the other.
    """
    rgb = load(path)
    if rgb.shape[0] != H or rgb.shape[1] != W:
        return dict(verdict="WITHHELD", kind="measurement_withheld",
                    blocked_on="the frame is %dx%d, not %dx%d - no window in this "
                               "round addresses it" % (rgb.shape[1], rgb.shape[0], W, H))
    # A WINDOW THAT IS NOT IN THE PICTURE IS A WITHHELD, NOT A CRASH.
    # `hall/N` and `hall/S` stand 2.15 m from an 8.00 m wall: at the ruled lens
    # that wall is 3810 px of a 1536 px frame and its foot lands at y 1089 of a
    # 1024-row picture, so the scaffold's own floor bracket is 1044..1134 —
    # entirely below the frame. `pick_floor` then took the argmin of an empty
    # profile and the wall reported MEASURE-ERR, which reads as a bad painting.
    # It is not: no painting of this facing can put the declared anchor's datum
    # in frame, because the STANDPOINT is what puts it out. Said plainly, once,
    # so the loop holds the wall instead of spending rolls on it.
    # [row 29(a)] A FACING WITH NO DEPTH ANCHOR IS A WITHHELD, NOT A TypeError.
    # Until this row the arithmetic below multiplied by `camera_wall_m`
    # unconditionally; on the four `open` facings that field is None and every
    # candidate died in the sweep's per-candidate guard as a MEASURE-ERR — which
    # reads as sixteen unpaintable frames and spent four walls' retry caps. Said
    # once, here, in the same voice as the standpoint case below.
    if cfg["camera_m"] is None:
        return dict(verdict="WITHHELD", kind="measurement_withheld",
                    blocked_on=(
                        "this facing's record names neither camera_wall_m nor "
                        "camera_far_m, so there is no distance for the scale this "
                        "frame carries to be quoted AT — an enclosed facing views a "
                        "wall plane and an open one views a drawn far line, and a "
                        "reading with no plane behind it converts to no lens. "
                        "Nothing about the painting is at fault and no repainting "
                        "answers it: the record does."))
    for name, lo, hi in (("floor bracket", *cfg["floor_window"]),
                         ("chair-rail bracket", *cfg["rail_band"])):
        if lo >= H or hi <= 0 or hi <= lo:
            return dict(verdict="WITHHELD", kind="measurement_withheld",
                        blocked_on=(
                            "the scaffold's %s for this facing is y %d..%d of a "
                            "%d-row frame — standing %s m from a %s m wall at the "
                            "ruled lens puts the wall's own foot below the picture. "
                            "There is no datum in this frame for the declared anchor "
                            "to be a height above, and no repainting moves it: the "
                            "standpoint does."
                            % (name, lo, hi, H, cfg["camera_m"],
                               side["meta_used"].get("wall_width_m"))))
    if not cfg["rail_columns"]:
        return dict(verdict="WITHHELD", kind="measurement_withheld",
                    blocked_on="every column band this scaffold declares falls "
                               "outside the frame, so there is nothing to read down")
    L = luma(rgb)

    floor_y, mod, rail_above = _floor_and_rail(L, cfg, picks)
    a, b = cfg.get("floor_licence") or cfg["floor_window"]
    floor_in_band = (a <= floor_y <= b)
    rail_y = mod["dado_rail_y_px"]
    ra, rb = cfg["rail_band"]
    rail_in_band = (ra <= rail_y <= rb)
    # [liner-3, 2026-09-01] THE ARGMIN OF A FLAT BAND IS NOT AN ANCHOR. The
    # rail is the band's luminance minimum, and a band the painter left the
    # anchor out of still has a minimum: gallery_far/N 8b6b3e2b's capping strip
    # sat at y 570, the band 501..542 held only veneer, its darkest veneer row
    # (513) was read as the rail and a wall painted at 0.81 scale PASSED at
    # +3 % and was promoted. A pack whose anchor is a high-contrast line
    # declares the dip it must show (`ruler.contrast_min`, with its why);
    # shallower than that, the band holds no anchor and the reading says so.
    rail_dip = None
    _cmin = (_PACK.ruler.get("contrast_min") if _PACK else None)
    if _cmin is not None:
        _p = np.asarray(mod.get("profile") or [], dtype=float)
        if len(_p):
            _med = float(np.median(_p))
            if (mod.get("rail_read") or {}).get("rule") == "bright-strip":
                # the anchor is a light line over a dark field: its contrast
                # is the step from the strip into the field beneath it
                rail_dip = float(mod["rail_read"]["contrast"])
            else:
                rail_dip = round((_med - float(_p.min())) / _med, 3) if _med > 0 else 0.0
            if rail_dip < float(_cmin):
                rail_in_band = False

    out = dict(
        _measured_px=dict(
            wall_floor_line_y_px=int(floor_y),
            chair_rail_y_px=int(rail_y),
            dado_rail_above_floor_px=int(rail_above),
            floor_read=mod.get("floor_read"),
            rail_read=mod.get("rail_read"),
            capping_above_floor_px=mod.get("capping_above_floor_px"),
            rail_dip=rail_dip,
        ),
        _windows=dict(floor=cfg["floor_window"], rail=cfg["rail_band"],
                      ceiling=cfg["ceiling_band"], columns=cfg["rail_columns"],
                      _derivation=cfg["_derivation"]),
    )

    absent = []
    if not floor_in_band:
        absent.append("the floor line reads y %d, outside the y %d..%d the standing "
                      "licence allows" % (floor_y, a, b))
    if not rail_in_band and rail_dip is not None and rail_dip < float(_cmin) \
            and (mod.get("rail_read") or {}).get("rule") == "bright-strip":
        _rr = mod["rail_read"]
        absent.append("the %s is not painted inside y %d..%d: no row there is a light line "
                      "over a dark field - the brightest step (y %d, luma %.0f over %.0f beneath) "
                      "is %.2f of the strip against the %.2f this world's anchor shows wherever "
                      "it is drawn, and the gate does not vote on fabric"
                      % (cfg["anchor_label"], ra, rb, _rr["strip"], _rr["strip_luma"], _rr["field_below"],
                         rail_dip, float(_cmin)))
    elif not rail_in_band and rail_dip is not None and rail_dip < float(_cmin):
        absent.append("the %s is not painted inside y %d..%d: the band's luminance "
                      "dip is %.2f of its median against the %.2f this world's anchor "
                      "shows wherever it is drawn - the darkest row (y %d) is fabric, "
                      "not the anchor, and the gate does not vote on fabric"
                      % (cfg["anchor_label"], ra, rb, rail_dip, float(_cmin), rail_y))
    elif not rail_in_band:
        absent.append("the %s reads y %d, outside the y %d..%d the standing "
                      "licence allows - this frame declares the anchor the gate votes "
                      "on and does not paint it there"
                      % (cfg["anchor_label"], rail_y, ra, rb))

    # ---- the camera, off the declared anchor and nothing else ---------------
    ppm = focal = eye = None
    if floor_in_band and rail_in_band and rail_above > 4:
        ppm = rail_above / RULER_M
        # [row 29(a)] Through the typed anchor. On an open facing this is
        # `camera_far_m` and the scale is quoted at the FAR LINE, which is the
        # only plane that frame has; the arithmetic is otherwise the same one.
        focal = ppm * cfg["camera_m"]
        # The eye rides the identity §5 asserts: the floor-to-horizon separation
        # IS eye x px_per_m_at_wall, read against this wall's own horizon.
        eye = (floor_y - ref["horizon_y_px"]) / ppm
    elif rail_above <= 4:
        absent.append("the %s reads %d px above the floor line, which is not "
                      "a height" % (cfg["anchor_label"], rail_above))

    # ---- the carriers, inside their declared windows -----------------------
    carriers = []
    for c in cfg["carriers"]:
        got, why = carrier_edges(L, cfg, c)
        rec = dict(kind=c["kind"], asked_x0=c["x0"], asked_x1=c["x1"],
                   ruled_m=c["ruled_m"], window=c["window"])
        rec["hypothesis"] = carrier_hypothesis(L, cfg, c)
        if got is None:
            rec.update(found=False, why=why)
            absent.append("the %s: %s" % (c["kind"], why))
        else:
            rec.update(found=True, x0=got["x0"], x1=got["x1"],
                       width_px=got["width_px"],
                       edge_delta_px=round((abs(got["x0"] - c["x0"]) +
                                            abs(got["x1"] - c["x1"])) / 2.0, 2),
                       candidates=got["candidates"], searched=got["searched"])
        carriers.append(rec)
    out["carriers"] = carriers

    out["px_per_m_at_wall"] = None if ppm is None else round(ppm, 3)
    out["implied_focal_px"] = None if focal is None else round(focal, 1)
    out["eye_height_m"] = None if eye is None else round(eye, 4)
    out["_absent"] = absent

    # ---- the promotion half, off the SAME pixels and the SAME scale ---------
    # Read here rather than in a second pass so that the document a promotion
    # ships and the reading a gate admitted are one measurement of one frame.
    out["_promotion"] = (None if ppm is None else
                         _promotion_half(rgb, L, cfg, floor_y, ppm, picks,
                                         carriers, rail_y=rail_y))

    band = ref["band"]
    if ppm is None:
        out["verdict"] = "ABSENT"
        out["kind"] = "scaffold_feature_absent"
    else:
        df = (focal - ref["focal_px"]) / ref["focal_px"]
        de = (eye - ref["eye_m"]) / ref["eye_m"]
        out["delta_focal_pct"] = round(100 * df, 2)
        out["delta_eye_pct"] = round(100 * de, 2)
        ok = abs(df) <= band and abs(de) <= band
        out["verdict"] = "PASS" if ok else "FAIL"
        out["kind"] = None if ok else "generation_miss"
    return out


# --------------------------------------------------------- the promotion doc

#: blueprint §11's universal wainscot anchor, and the one this round measures
#: the camera off. Stated once here because the sentence below is PARSED —
#: `geometry.spec`'s calibration audit pulls the metres out of `calibration_ref`
#: with /taken at ([\d.]+) m/ and checks that `calibration_px` over that size IS
#: `px_per_m_at_wall` — so the number in the prose and the number in the
#: arithmetic have to be one number.
# ---------------------------------------------------------------------------
# THE LOCATION, AS DATA. `design/production-law.md` clause 8: the theme never
# bleeds into the code. The ruled height below used to be typed here as 0.95
# with the name of one house's joinery on it; it is the ACTIVE PACK's ruler now
# (`packs/<name>/world.json`), selected by `--pack` / `HOLO_PACK` / `manor`.
# The DIVISOR is still this instrument's -- one horizontal, one number -- and
# that is exactly why it must come from the pack: a second location measures by
# its own horizontal at its own height, and an instrument that types the first
# one's number can only ever measure the first one.
from pack import active_pack

_PACK = active_pack()
RULER_M = _PACK.ruler_height_m          # the one divisor: px above the datum / RULER_M
RULER_KIND = _PACK.ruler["kind"]        # what the reading is called in its record
RULER_DATUM = _PACK.ruler_datum         # what that height is measured from
# ---------------------------------------------------------------------------


def promotion_doc(reading, side, ref, round_name, source_sha256):
    """The §5 record `tools/promote-backdrop.mjs` reads, off THIS reading.

    Nothing is measured here. Every field is a value `measure_candidate`
    already read off the frame that passed the gate, shaped into the document
    the promotion tool takes — so re-running the promotion cannot produce a
    number the gate never saw, which is what a second measurement pass could.

    Returns `(doc, refusals)`. A non-empty `refusals` is a WITHHELD in the
    round's own sense — but since row 32 it is no longer one thing. It carries
    a NAMED SUB-FAMILY (`hold_family` on the reading), and the two names route
    differently: a `suspect-painting` is a fact about the PICTURE and buys a
    re-ask with a correction the emitter can act on, while an
    `unfitted-horizon` is a fact about what this frame gives the instrument.
    Both are refusals here; `row23_run.py` decides what each one costs.
    """
    p = reading.get("_promotion")
    ppm = reading.get("px_per_m_at_wall")
    if ppm is None or p is None:
        return None, ["no scale could be read off this frame, so there is "
                      "nothing for a meta to be a meta of"]
    m = reading["_measured_px"]
    ramp = p["ramp"]
    lit = p["light"]
    # [row 29(a)] WHICH INSTRUMENT FIXED THE HORIZON, and the record says so in
    # a token before it says so in prose. A walled facing's horizon is row 20's
    # ceiling-ramp intersection, FITTED. A vista's is the camera's own declared
    # eye line, DECLARED — an open frame's two ruled lines fix the lens and
    # leave the eye and the horizon in one equation with two unknowns, so there
    # is no ramp to fit and none is manufactured. `ceiling_ramp_intersection`
    # stays null on a vista precisely so a reader has to handle the case.
    far = p.get("far_line_ruler")
    is_open = p.get("horizon_instrument") == FAR_LINE_RULER
    horizon_px = (ramp["y"] if ramp else (far["y"] if far else None))
    anchor = ("the low boundary wall's stone coping above the ground at the "
              "far line" if is_open else
              "the wainscot chair-rail's undercut shadow above the wall's own "
              "floor line")
    doc = {
      "_source_sha256": source_sha256,
      "_what_this_is": (
        ("The manor production reading for %s, measured off %s by "
         "design/plan-draft/measured/row23_run.py through the row-23 "
         "instrument — the SAME reading its camera gate admitted, shaped into "
         "the §5 record tools/promote-backdrop.mjs takes. Every search window "
         "is the wall's own scaffold's, declared in %s/manifest.json before any "
         "candidate existed.")
        % (side["facing"], side["candidate"], os.path.relpath(_PACK.paths["batch_dir"]))),
      "_role": ("manor production wall, measured against the camera its own "
                "manifest entry declares"),
      "verdict": reading["verdict"],
      "facing_type": side["meta_used"].get("facing_type", "enclosed"),
      "image_h_px": side["meta_used"]["image_h_px"],
      "floor_line_y": round(m["wall_floor_line_y_px"] / float(side["meta_used"]["image_h_px"]), 6),
      "horizon_y": (round(horizon_px / float(side["meta_used"]["image_h_px"]), 6)
                    if horizon_px is not None else None),
      "px_per_m_at_wall": ppm,
      "px_per_m_at_bottom": (
          round((side["meta_used"]["image_h_px"] - horizon_px) / p["eye_height_m"], 2)
          if (horizon_px is not None and p["eye_height_m"]) else None),
      "implied_focal_px": reading["implied_focal_px"],
      "eye_height_m": p["eye_height_m"],
      "storey_height_m": p["storey_height_m"],
      "drawn_standpoint_m": (side["meta_used"].get("camera_wall_m")
                             if not is_open
                             else side["meta_used"].get("camera_far_m")),
      "delta_focal_pct": reading.get("delta_focal_pct"),
      "delta_eye_pct": reading.get("delta_eye_pct"),
      "band_pct": ref["band"] * 100,
      "wall_width_m": p["implied_wall_width_m"],
      "camera_wall_m": side["meta_used"].get("camera_wall_m"),
      # [row 29(a)] An open facing's depth anchor, under the field name the law
      # gives it: `src/groundplane.js` types the two apart on purpose, so this
      # record does too rather than quoting a far line as a wall distance.
      "camera_far_m": side["meta_used"].get("camera_far_m"),
      "corner_x0_px": p["corner_x0_px"],
      "corner_x1_px": p["corner_x1_px"],
      "key_tint": lit["key_tint"],
      "key_dir": "%s-%s" % (
          lit["key_dir_measured"],
          "ABOVE" if (horizon_px is not None and
                      lit["key_dir_brightest_y"] < horizon_px)
          else ("BELOW" if horizon_px is not None else "NO-HORIZON")),
      # [row 29(a)] AND THE ANCHOR IS NAMED FOR WHAT IT IS. This sentence used
      # to say "wainscot chair-rail" on every wall, which on an outdoor frame
      # is the Captain's finding (a) — interior fabric outside — written into
      # the ledger itself. The RULED HEIGHT is one number for both (see
      # `RULER_M`), and the `taken at <n> m` phrase is kept verbatim
      # because `geometry.spec`'s calibration audit parses it.
      "calibration_ref": (
        "%s, taken at %.2f m — %s and this facing's own scaffold declares it "
        "as the measurement anchor"
        % (anchor, RULER_M,
           "tools/room-voices.mjs's `outdoors_open` voice rules the coping "
           "there on a forecourt wall of this date" if is_open else
           "blueprint §11 rules it there on every panelled wall in the manor")),
      "calibration_px": m["dado_rail_above_floor_px"],
      "calibration_tier": 1,
      "_ruler_policy": {
        "adopted": "coping" if is_open else "chair_rail",
        "ruled_m": RULER_M,
        "rule": (
          "ONE RULER, AND IT IS THE ONE THE SCAFFOLD DECLARES. The camera "
          "verdict, the calibration feature and this document's scale are all "
          "the same %s reading inside the same +/-8 %% bracket, taken "
          "once. There is no second window and no second pass."
          % ("coping" if is_open else "chair-rail")),
      },
      "_which_horizon": (far["_which_horizon"] if is_open else
        "THE CEILING-RAMP INTERSECTION, which the Navigator ruled at row 20 "
        "over the vanishing-point vote. The two side-wall/ceiling junctions "
        "run parallel to the view axis and must converge on the horizon; they "
        "are fitted outside this frame's own measured corners and intersected. "
        "A facing whose side walls fix no horizon issues no eye height, which "
        "is a WITHHELD and not a zero. Row 32 left that ruling where it stood "
        "and changed only what the ramps are given: corners read off where the "
        "wall stops being square to the camera rather than off a plaster step, "
        "the junction row chosen from pick_ceiling's own candidates by which "
        "one the side walls converge on most sharply, and an error bar on the "
        "intersection measured against the standing licence for the horizon "
        "row (see corner_evidence, ceiling_rows_tried and horizon_bracket_px "
        "in _measured_px's siblings on the reading)."),
      "_horizon_votes": {"per_region": p["votes"],
                         "adopted_y": horizon_px,
                         "adopted_instrument": p.get("horizon_instrument"),
                         "adopted_rule": (
                             "the far-line ruler's declared eye line - see "
                             "_which_horizon" if is_open else
                             "the ceiling-ramp intersection - see _which_horizon"),
                         "ceiling_ramp_intersection": ramp,
                         # [row 29(a)] The vista's own instrument, under its own
                         # key. A reader takes ONE of these two and the other is
                         # null, so a promotion cannot be handed a horizon that
                         # was fixed by an instrument it did not ask for.
                         "far_line_ruler": far},
      "_measured_px": dict(m, wall_ceiling_line_y_px=p["ceiling_y_px"],
                           corner_x0_px=p["corner_x0_px"],
                           corner_x1_px=p["corner_x1_px"],
                           horizon_y_px=horizon_px),
      "_windows": reading["_windows"],
      "_carriers": reading["carriers"],
      "_light": lit,
      "_derived": {
          "eye_height_m": p["eye_height_m"],
          "storey_height_m": p["storey_height_m"],
          "implied_wall_width_m": p["implied_wall_width_m"],
          "px_per_m_at_bottom": (
              round((side["meta_used"]["image_h_px"] - horizon_px) / p["eye_height_m"], 4)
              if (horizon_px is not None and p["eye_height_m"]) else None),
          "implied_camera_wall_m": (round(side["meta_used"]["image_h_px"] / ppm, 4)
                                    if ppm else None)},
      "_withheld_because": p["withheld_because"],
      "_hold_family": p.get("hold_family"),
      "_round": round_name,
    }
    return doc, list(p["withheld_because"])


# ------------------------------------------------------------------- scoring

def score(reading, side, ref):
    """§5.4's index, unclamped, with every component named beside it.

    THE CARRIER TERM IS NOT OPTIONAL AND IS NOT IMPUTED. A roll whose carrier
    could not be found has NO index (N5): averaging the two surviving terms
    would reward exactly the rolls whose obedience could not be verified, and
    imputing a worst case would invent a number. It is listed in its own column
    instead, and every summary prints "indexed j of admitted k" so the shrinkage
    is visible rather than folded into a mean.
    """
    band = ref["band"]
    tol = side["brackets"]["carrier_tolerance_px"]
    if reading.get("px_per_m_at_wall") is None:
        return dict(indexed=False, why="no camera could be read")
    carriers = [c for c in reading["carriers"] if c.get("found")]
    if len(carriers) != len(reading["carriers"]) or not carriers:
        return dict(indexed=False, why="the declared carrier was not found in its own window")
    d_focal = abs(reading["delta_focal_pct"]) / 100.0
    d_eye = abs(reading["delta_eye_pct"]) / 100.0
    d_edges = sum(c["edge_delta_px"] for c in carriers) / len(carriers)
    raw = 1.0 - (d_focal / band + d_eye / band + d_edges / tol) / 3.0
    return dict(indexed=True,
                d_focal=round(d_focal, 5), d_eye=round(d_eye, 5),
                d_carrier_edges_px=round(d_edges, 2),
                tolerance_px=tol, band=band,
                adherence_raw=round(raw, 4),
                adherence_pct=round(100 * max(0.0, raw), 1))


# --------------------------------------------------------- separation report

def _pmf(n, p):
    return [comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)]


def separation_probability(counts, n):
    """P(a spread at least this wide | every technique identical), worst case.

    A REPORTED STATISTIC, NEVER AN AUTHORITY. §5.5 deletes the crown clause for
    a reason no amount of arithmetic repairs: gate-PASS is a pure CAMERA verdict
    and every cell of the matrix asked for the same camera, so a wide camera
    separation is evidence about camera behaviour and not about labels. The
    carrier arm is the one the labels move.

    Maximised over the unknown common p rather than evaluated at a guess,
    because the honest question is "how often would numbers like these arise
    from nothing at all", and picking a favourable p would answer a different
    one.
    """
    if not counts:
        return None
    spread = max(counts) - min(counts)
    t = len(counts)
    worst = 0.0
    at = None
    for i in range(1, 100):
        p = i / 100.0
        f = _pmf(n, p)
        tot = 0.0
        for combo in _iter_counts(t, n):
            pr = 1.0
            for k in combo:
                pr *= f[k]
            if max(combo) - min(combo) >= spread:
                tot += pr
        if tot > worst:
            worst, at = tot, p
    return dict(observed_counts=list(counts), n_per_technique=n,
                observed_spread=spread,
                p_at_least_this_extreme=round(worst, 4),
                worst_case_at_p=at,
                _reading="the probability that techniques which are actually identical "
                         "would produce a spread at least this wide, maximised over the "
                         "unknown common pass probability",
                _governs="this is a CAMERA statistic. Every cell asked for the same "
                         "camera, so a separation here is evidence about camera "
                         "behaviour, not about labels; the carrier arm is the one the "
                         "labels move.")


def _iter_counts(t, n):
    if t == 1:
        for k in range(n + 1):
            yield (k,)
        return
    for k in range(n + 1):
        for rest in _iter_counts(t - 1, n):
            yield (k,) + rest
