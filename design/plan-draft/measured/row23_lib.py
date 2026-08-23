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
    return dict(
        wall=side["facing"],
        ppm=ppm,
        image_h_px=m["image_h_px"],
        corner_x0=m["corner_x0_px"], corner_x1=m["corner_x1_px"],
        floor_window=(int(fw["centre"] - fw["half_width"]),
                      int(fw["centre"] + fw["half_width"])),
        rail_band=(int(rb["centre"] - rb["half_width"]),
                   int(rb["centre"] + rb["half_width"])),
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
    floor_y, floor_cands, _ = picks["pick_floor"](L, fcfg)
    mod = picks["module_in_bands"](L, floor_y, cfg["rail_band"], cfg["rail_columns"])
    rail_above = mod["dado_rail_above_floor_px"]
    return floor_y, mod, rail_above


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
    L = luma(rgb)

    floor_y, mod, rail_above = _floor_and_rail(L, cfg, picks)
    a, b = cfg["floor_window"]
    floor_in_band = (a <= floor_y <= b)
    rail_y = mod["dado_rail_y_px"]
    ra, rb = cfg["rail_band"]
    rail_in_band = (ra <= rail_y <= rb)

    out = dict(
        _measured_px=dict(
            wall_floor_line_y_px=int(floor_y),
            chair_rail_y_px=int(rail_y),
            dado_rail_above_floor_px=int(rail_above),
            capping_above_floor_px=mod.get("capping_above_floor_px"),
        ),
        _windows=dict(floor=cfg["floor_window"], rail=cfg["rail_band"],
                      ceiling=cfg["ceiling_band"], columns=cfg["rail_columns"],
                      _derivation=cfg["_derivation"]),
    )

    absent = []
    if not floor_in_band:
        absent.append("the floor line reads y %d, outside the y %d..%d the standing "
                      "licence allows" % (floor_y, a, b))
    if not rail_in_band:
        absent.append("the chair-rail reads y %d, outside the y %d..%d the standing "
                      "licence allows - this frame declares the anchor the gate votes "
                      "on and does not paint it there" % (rail_y, ra, rb))

    # ---- the camera, off the declared anchor and nothing else ---------------
    ppm = focal = eye = None
    if floor_in_band and rail_in_band and rail_above > 4:
        ppm = rail_above / 0.95
        focal = ppm * side["meta_used"]["camera_wall_m"]
        # The eye rides the identity §5 asserts: the floor-to-horizon separation
        # IS eye x px_per_m_at_wall, read against this wall's own horizon.
        eye = (floor_y - ref["horizon_y_px"]) / ppm
    elif rail_above <= 4:
        absent.append("the chair-rail reads %d px above the floor line, which is not "
                      "a height" % rail_above)

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
