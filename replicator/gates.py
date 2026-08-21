"""Stage 4 — gates (blueprint §9.4, with two additions and one amendment).

Every gate returns its **measured value whether it passes or fails**, so a green
gate is auditable and a threshold nowhere near being exercised is visible.

  (a) halo          hard, four clauses
  (b) holes         hard
  (c) resolution    hard
  (d) state diff    hard, parts only
  (e) light         WARN ONLY, per §9.4
  (f) contact       hard, floor-attached only        [AI, row 3 — added]
  (g) over-matte    hard                             [AI, row 3 — added]

Pure: reads in-memory artifacts and the contract dict, returns findings, prints
nothing.
"""

import numpy as np

from . import imaging as im
from . import preview as pv


def _result(gid, severity, passed, measured, threshold, message):
    return {"id": gid, "severity": severity, "passed": bool(passed),
            "measured": measured, "threshold": threshold, "message": message}


# --------------------------------------------------------------------------- a

def gate_halo(rgba, bg_color, cfg, drawn=None):
    """(a) The edge must not read as the ground it was cut from.

    §9.4's letter is "mean saturation of border-adjacent semi-alpha pixels must
    not read grey". Taken alone as an absolute saturation floor that clause
    **false-fails an honestly grey object**, and M0's takeables are an iron key
    and a silver coin. These four clauses keep the intent and add the viewpoint
    the flip test actually uses:

      a2  the inner band's (depth 2..4 px) saturation relative to the deep
          interior (depth > 10) — the RATIO form is what lets a uniformly grey
          object through
      a3  the same band's ground-distance ratio — the clause that still carries
          signal when the object has no saturation at all
      a4  the composited rim's **coverage residual** over a dark ground and a
          light one at real draw scale — the only clause that can see a halo
          which appears in the room and not on the studio grey

    An absolute edge-distance clause was drafted and dropped: an iron key's own
    colour sits about as far from mid-grey as a halo does, so it would have
    false-failed the object rather than the halo. a3 is its relative form.

    a4 needs no fitted number at all. Straight-alpha compositing says a rim
    pixel of coverage `a` over ground G against local interior L must land at
    exactly `a*L + (1-a)*G`, so the normalized residual is ZERO for a correct
    edge whatever the colours are. Constructed clean controls measure |median|
    0.019-0.155; the grey-halo control measures 0.305 dark and 0.519 light.
    Known limit, stated rather than hidden: a ~2px generator antialias band
    scores about 0.10 and passes, which is why the MATTE erodes it rather than
    this gate catching it.

    [AI, row 3] This changes a [HUMAN] gate definition. Blueprint §9.4 carries
    the amendment note, in the form row 2 used at §9.3b, reversible by Kabe as a
    new-row decision.
    """
    a = rgba[..., 3].astype(np.float64)
    rgb = rgba[..., :3]
    ring = (a > 0) & (a < 255)
    opaque = a >= 255

    measured = {}
    clauses = []

    measured["ring_px"] = int(ring.sum())
    if ring.sum():
        measured["edge_bg_distance"] = round(
            float(im.rgb_distance(rgb, bg_color)[ring].mean()), 3)

    inner = im.erode(opaque, 1) & ~im.erode(opaque, 4)
    deep = im.erode(opaque, 10)
    if inner.sum() > 0 and deep.sum() > 0:
        sat = im.saturation(rgb)
        dist = im.rgb_distance(rgb, bg_color)
        sat_ratio = float(sat[inner].mean() / max(float(sat[deep].mean()), 1e-9))
        dist_ratio = float(dist[inner].mean() / max(float(dist[deep].mean()), 1e-9))
        measured["inner_band_saturation"] = round(float(sat[inner].mean()), 4)
        measured["deep_saturation"] = round(float(sat[deep].mean()), 4)
        measured["inner_band_saturation_ratio"] = round(sat_ratio, 4)
        measured["inner_band_bg_distance_ratio"] = round(dist_ratio, 4)
        clauses.append(("a2 inner-band saturation ratio",
                        sat_ratio >= cfg["inner_band_saturation_ratio_min"],
                        round(sat_ratio, 4), cfg["inner_band_saturation_ratio_min"]))
        clauses.append(("a3 inner-band ground-distance ratio",
                        dist_ratio >= cfg["inner_band_bg_distance_ratio_min"],
                        round(dist_ratio, 4), cfg["inner_band_bg_distance_ratio_min"]))
    else:
        measured["inner_band_px"] = int(inner.sum())
        measured["deep_px"] = int(deep.sum())

    # a4 alone judges the sprite AS STORED, because it asks what the renderer
    # will draw; a2/a3 judge the matte that produced it.
    rims = pv.rim_lift_ratios(rgba if drawn is None else drawn,
                              cfg["rim_grounds"], cfg["_draw_height_px"])
    measured["composited_rim"] = rims
    unmeasured = []
    for name, rim in sorted(rims.items()):
        if rim is None or rim["lift_ratio"] is None:
            # Silence here would be the worst outcome: a hard-edged silhouette --
            # the sticker tell itself -- leaves no measurable rim at draw scale,
            # so the one clause that can see a halo in the room drops out and
            # the report used to say "all halo clauses hold".
            unmeasured.append(name)
            continue
        # A correctly antialiased edge composites to a coverage-weighted blend,
        # so its lift over the ground is about the mean coverage of the ring --
        # `rim_lift_expected`. Bounded in BOTH directions: too high is a grey
        # halo, too low is a dark fringe, and both read as a cut-out.
        # Signed, not absolute. The residual runs POSITIVE for a grey halo
        # (light the coverage does not account for) and NEGATIVE for a downscale
        # dark fringe, and the negative side grows as the sprite gets smaller: a
        # clean 128 px takeable -- gate (c)'s own floor, and the size class of
        # M0's key and coin -- sits at -0.25, closer to a symmetric 0.30 bound
        # than the grey-halo control's +0.33. One bound for both directions made
        # the clean small case nearly indistinguishable from the defect.
        res = rim["coverage_residual"]
        clauses.append(("a4 composited rim over the %s ground (halo side)" % name,
                        res <= cfg["coverage_residual_max"],
                        round(res, 4), cfg["coverage_residual_max"]))
        clauses.append(("a4 composited rim over the %s ground (dark-fringe side)" % name,
                        res >= -cfg["coverage_residual_dark_max"],
                        round(res, 4), -cfg["coverage_residual_dark_max"]))

    measured["a4_unmeasured_grounds"] = unmeasured
    failed = [c for c in clauses if not c[1]]
    note = ("" if not unmeasured else
            " — NOTE: the composited-rim clause could not be measured over the %s ground "
            "(too few rim pixels at draw scale, which is what a hard-edged silhouette looks "
            "like), so that clause did not run" % ", ".join(unmeasured))
    msg = (("all halo clauses that could run hold (%s)"
            % ", ".join("%s %g" % (c[0], c[2]) for c in clauses)) + note
           if not failed else
           "; ".join("%s: measured %g against %g" % (c[0], c[2], c[3]) for c in failed) + note)
    return _result("a", "hard", not failed, measured,
                   {k: v for k, v in cfg.items() if not k.startswith("_")}, msg)


# --------------------------------------------------------------------------- b

def gate_holes(rgba, bg_color, cfg):
    """(b) Enclosed ground-coloured regions still at alpha > 0.

    Two things make this able to fail without failing on every real image:

    * the tolerance is **looser** than the matte's (26 vs 14), so a leg gap
      whose interior is a graded grey — outside the matte's net — is caught;
    * the flood is seeded from the border **and from every transparent pixel**,
      so the tolerance-26 fringe around an already-punched hole is reached and
      is not counted as a missed hole. Without that, every real image fails.
    """
    a = rgba[..., 3]
    rgb = rgba[..., :3]
    h, w = a.shape
    similar = im.rgb_distance(rgb, bg_color) <= cfg["tolerance"]
    transparent = a == 0
    # Every transparent pixel is background by definition, so the flood only has
    # to start where a similar OPAQUE pixel touches transparency -- a thin
    # frontier -- rather than from every transparent pixel. Seeding from all of
    # them built hundreds of thousands of Python tuples on a legged sprite for
    # exactly the same result.
    tu, td, tl, tr = im.neighbours4(transparent)
    frontier = similar & ~transparent & (tu | td | tl | tr)
    seeds = im.border_seeds(h, w) + [(int(y), int(x))
                                     for y, x in zip(*np.nonzero(frontier))]
    reached = im.span_fill(similar | transparent, seeds) | transparent
    suspect = similar & (a > 0) & ~reached
    labels, n = im.label_components(suspect)
    areas = np.bincount(labels.ravel(), minlength=n + 1)[1:]
    big = [int(v) for v in areas if v >= cfg["min_area_px"]]
    measured = {"regions": len(big), "largest_area_px": max(big) if big else 0,
                "suspect_px": int(suspect.sum())}
    msg = ("no enclosed ground-coloured region remains above %d px at tolerance %g"
           % (cfg["min_area_px"], cfg["tolerance"]) if not big else
           "%d enclosed ground-coloured region(s) remain at alpha > 0, largest %d px "
           "(tolerance %g, min area %d) — the matte missed a gap"
           % (len(big), max(big), cfg["tolerance"], cfg["min_area_px"]))
    return _result("b", "hard", not big, measured, dict(cfg), msg)


# --------------------------------------------------------------------------- c

def gate_resolution(content_height_px, takeable, cfg):
    """(c) Content bbox height: >= 512 px for furniture, >= 128 px for takeables.

    Measured on the matted SOURCE, before the stored-resolution policy applies.
    """
    height = int(content_height_px)
    floor = (cfg["min_content_height_px_takeable"] if takeable
             else cfg["min_content_height_px"])
    ok = height >= floor
    return _result("c", "hard", ok,
                   {"content_height_px": int(height), "takeable": bool(takeable)},
                   {"min_content_height_px": floor},
                   "content bbox is %d px tall against a floor of %d" % (height, floor))


# --------------------------------------------------------------------------- d

def gate_state_diff(recomposited, original_matte, part_mask, cfg):
    """(d) Cutting a part and putting it back must change nothing else.

    The composite of body-with-cavity plus part at closed, against the matted
    original *before* inpainting, measured **outside** the part's own mask over
    pixels either image calls opaque.
    """
    a = recomposited[..., :3].astype(np.float64)
    b = original_matte[..., :3].astype(np.float64)
    considered = (~part_mask) & ((recomposited[..., 3] >= im.ALPHA_OPAQUE) |
                                 (original_matte[..., 3] >= im.ALPHA_OPAQUE))
    if considered.sum() == 0:
        return _result("d", "hard", True, {"considered_px": 0}, dict(cfg),
                       "no pixels outside the part mask to compare")
    diff = np.abs(a - b).max(axis=2)
    mean_abs = float(np.abs(a - b)[considered].mean())
    over = int((diff[considered] > cfg["pixel_over_threshold"]).sum())
    ok = mean_abs <= cfg["max_mean_abs"] and over <= cfg["max_pixels_over"]
    measured = {"considered_px": int(considered.sum()),
                "mean_abs_channel_diff": round(mean_abs, 4),
                "pixels_over_threshold": over,
                "max_channel_diff": round(float(diff[considered].max()), 2)}
    return _result("d", "hard", ok, measured, dict(cfg),
                   "outside the part mask: mean |diff| %.4f (limit %g), %d px over a "
                   "channel diff of %g (limit %d)"
                   % (mean_abs, cfg["max_mean_abs"], over,
                      cfg["pixel_over_threshold"], cfg["max_pixels_over"]))


# --------------------------------------------------------------------------- e

def light_estimate(rgba, expected_deg=115.5):
    """Sobel bright-side direction, plus the per-third tilt.

    The Sobel field is masked to the object's **interior**, eroded 4 px, because
    the silhouette boundary is the strongest gradient in any matted sprite and
    it points in every direction at once.

    The per-third tilt is deliberately the *same* measure the shipped
    `mechanisms.spec.mjs` uses ("every sprite carries the horizontal half of
    UL45": left-third minus right-third mean luminance over alpha >= 250,
    must exceed 2), so a gate-(e) pass here predicts that Playwright clause
    instead of disagreeing with it.
    """
    a = rgba[..., 3]
    lum = im.luminance(rgba[..., :3])
    interior = im.erode(a >= im.ALPHA_OPAQUE, 4)
    out = {"interior_px": int(interior.sum())}

    if interior.sum() > 16:
        kx = np.array([[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]])
        ky = kx.T
        p = np.pad(lum, 1, mode="edge")
        gx = np.zeros_like(lum)
        gy = np.zeros_like(lum)
        for dy in range(3):
            for dx in range(3):
                w = p[dy:dy + lum.shape[0], dx:dx + lum.shape[1]]
                gx += w * kx[dy, dx]
                gy += w * ky[dy, dx]
        gx = np.where(interior, gx, 0.0)
        gy = np.where(interior, gy, 0.0)
        # Image y runs downward; negate it so the angle is measured with "up" positive.
        angle = float(np.degrees(np.arctan2(-gy.sum(), gx.sum())))
        # NOT the geometric 135 degrees. A Sobel bright-side estimate has a
        # systematic pull toward 90 for any top-lit object, so the reference is
        # the estimator's own measured response to a constructed correctly-UL45
        # -lit solid (115.5). Using 135 forces a band so wide it admits
        # everything from overhead to horizontal-left, which leaves the gate
        # with no content on the one quality it exists for.
        expected = float(expected_deg)
        dev = abs(((angle - expected + 180.0) % 360.0) - 180.0)
        out["estimate_deg"] = round(angle, 2)
        out["expected_deg"] = expected
        out["deviation_deg"] = round(dev, 2)

    solid = a >= im.ALPHA_SOLID
    w = rgba.shape[1]
    xs = np.arange(w)[None, :]
    left = solid & (xs < w / 3.0)
    right = solid & (xs >= 2.0 * w / 3.0)
    if left.sum() and right.sum():
        out["third_tilt"] = round(float(lum[left].mean() - lum[right].mean()), 3)
        out["left_third_luminance"] = round(float(lum[left].mean()), 2)
        out["right_third_luminance"] = round(float(lum[right].mean()), 2)
    return out


def gate_light(rgba, cfg, label="body"):
    """(e) WARN ONLY, per §9.4. Never blocks; the deviation is recorded."""
    est = light_estimate(rgba, cfg["expected_deg"])
    ok = True
    msgs = []
    if "deviation_deg" in est and est["deviation_deg"] > cfg["max_deviation_deg"]:
        ok = False
        msgs.append("bright-side estimate %.1f deg deviates %.1f deg from the %.1f deg a "
                    "constructed UL45 control measures (budget %g deg)"
                    % (est["estimate_deg"], est["deviation_deg"], cfg["expected_deg"],
                       cfg["max_deviation_deg"]))
    if "third_tilt" in est and est["third_tilt"] < cfg["min_third_tilt"]:
        ok = False
        msgs.append("left-third minus right-third luminance is %.2f, under the %g the shipped "
                    "mechanisms.spec light clause requires — this sprite does not carry the "
                    "horizontal half of UL45 and that Playwright case will go red when it "
                    "replaces a placeholder" % (est["third_tilt"], cfg["min_third_tilt"]))
    return _result("e", "warn", ok, dict(est, image=label), dict(cfg),
                   "; ".join(msgs) if msgs else "light reads as UL45 on both measures")


# --------------------------------------------------------------------------- f

def gate_contact(anchors, px, attachment, cfg, provenance=None):
    """(f) The footprint the contact pool is drawn from must be sound. [AI, row 3]

    Nothing in §9.4 looks at `anchors.footprint`, and it is what the renderer
    draws every grounded object's contact shadow from. Measured on the corpus
    desk, §9.2's bottom-two-rows derivation finds one ball foot and nothing else
    — the measured values live in the emitted record's `measured.contact`, their
    one home — against a quality that reads "nothing sits on a floor without
    it". So the footprint is *derived from the contact band* and this
    gate judges the derivation, not an operator's typing: an absolute-fraction
    floor would hard-fail every three-quarter sprite unless a human measured it
    first, which would make the autonomous sprite lane the intention promises
    impossible.

      hard  — the band is degenerate (no columns, or a span under one pixel)
      warn  — band and bottom-two-rows disagree beyond the pinned ratio; the
              warning is the visible sign that a judgement was made, and it is
              where an operator's --footprint override earns its place
    """
    grounded = attachment in ("floor_against", "floor_free")
    fp = anchors.get("footprint") or {}
    span = float(fp.get("x1", 0)) - float(fp.get("x0", 0))
    frac = span / float(px["w"]) if px["w"] else 0.0
    measured = {"footprint_span_px": round(span, 2),
                "footprint_fraction_of_width": round(frac, 4),
                "attachment": attachment}
    if provenance:
        measured["derivation"] = provenance
    if not grounded:
        return _result("f", "hard", True, measured, dict(cfg),
                       "not floor-attached — no ground contact to check")
    if span < 1.0:
        return _result("f", "hard", False, measured, dict(cfg),
                       "the contact-band derivation is degenerate (span %.2f px): there is "
                       "nothing to draw a contact pool from" % span)
    ratio = (provenance or {}).get("band_over_bottom_two_rows")
    if ratio is not None and ratio > cfg["disagreement_warn_ratio"]:
        return _result("f", "warn", False, measured, dict(cfg),
                       "the contact band spans %.1fx the bottom-two-rows extent — a real "
                       "three-quarter stance, but a judgement was made: check it against the "
                       "image, and override with --footprint x0,x1 in SOURCE coordinates if "
                       "the band caught something that is not a foot" % ratio)
    return _result("f", "hard", True, measured, dict(cfg),
                   "footprint spans %.1f%% of the sprite width, derived from the contact band"
                   % (frac * 100))


def gate_shadow(rgba, bg_color, cfg):
    """(h) No baked studio shadow welded to the silhouette. [AI, row 3]

    `negative_block` forbids "cast shadow on the background" and generators
    produce them anyway. A soft shadow on the seamless is further than the
    matte's tolerance from the border median, so the matte keeps it as **opaque
    object pixels**: every other gate then accepts it, and gate (f) is even
    rewarded by the widened footprint. The sprite carries its studio shadow into
    a room lit by another key — the sticker tell produced by the gate set rather
    than caught by it.

    A shadow of the ground is ground-toned: near the ground's own hue, nearly
    unsaturated, and darker than the ground but not as dark as the object.
    """
    a = rgba[..., 3]
    rgb = rgba[..., :3]
    opaque = a >= im.ALPHA_OPAQUE
    if opaque.sum() == 0:
        return _result("h", "hard", True, {}, dict(cfg), "nothing opaque to check")
    lum = im.luminance(rgb)
    sat = im.saturation(rgb)
    bg_lum = float(im.luminance(np.asarray(bg_color, np.float64)[None, None, :])[0, 0])
    toned = (opaque & (sat <= cfg["max_saturation"]) &
             (lum <= bg_lum * cfg["luminance_upper"]) &
             (lum >= bg_lum * cfg["luminance_lower"]))

    # Fraction alone cannot work: an iron key is ground-toned from end to end,
    # and it is an object, not a shadow. What separates them is *position
    # relative to the object* — a cast shadow lies BELOW the thing that casts
    # it. So the measure is the share of opaque pixels that are ground-toned
    # AND sit below the lowest non-ground-toned opaque pixel in their own
    # column. A uniformly grey object has no non-toned pixels above, so it
    # scores zero by construction; a shadow pooled under an oak desk scores its
    # whole self.
    solid = opaque & ~toned
    h, w = lum.shape
    rows = np.arange(h)[:, None]
    solid_rows = np.where(solid, rows, -1)
    lowest_solid = solid_rows.max(axis=0)            # -1 where a column has none
    below = toned & (rows > lowest_solid[None, :]) & (lowest_solid[None, :] >= 0)
    frac = float(toned.sum()) / float(opaque.sum())
    below_frac = float(below.sum()) / float(opaque.sum())
    measured = {"ground_toned_fraction": round(frac, 5),
                "toned_below_object_fraction": round(below_frac, 5),
                "ground_luminance": round(bg_lum, 2)}
    ok = below_frac <= cfg["max_toned_below_object_fraction"]
    return _result("h", "hard", ok, measured, dict(cfg),
                   "no ground-toned pool below the object (%.3f%% of opaque pixels)"
                   % (below_frac * 100) if ok else
                   "%.2f%% of opaque pixels are ground-toned and sit below the object's own "
                   "lowest solid pixel in their column — this is a cast shadow matted into "
                   "the silhouette. The contract's negative_block forbids "
                   "\"cast shadow on the background\"; regenerate the source."
                   % (below_frac * 100))


# --------------------------------------------------------------------------- g

def gate_over_matte(sensitivity, erode_excess, cfg, detail=None):
    """(g) The matte must not be eating the object. [AI, row 3]

    §9.4 hunts leftover holes and never hunts a bitten silhouette; a key with
    its shaft matted away reads as a broken sticker and exits zero.

    The measure is **tolerance sensitivity**, not a comparison against one fixed
    conservative tolerance: `|A(0.75t) - A(1.25t)| / A(t)`, where `t` is this
    image's own computed tolerance. A well-separated object barely moves when
    the tolerance moves a quarter either way; an object whose colour is near the
    ground's moves a lot, and that is exactly the object at risk of being eaten.

    Measured: clean 0.0000, legged 0.0000, squat iron disc 0.0000, part source
    0.0000, and a constructed control with a pale limb six levels off the ground
    0.0340. A fixed conservative tolerance was tried first and rejected: at
    tolerance 5 the corpus's own ground noise stopped the flood fill and the
    "conservative" silhouette swallowed the whole frame, which would have failed
    a good image for a reason that had nothing to do with the object.
    """
    ok = (sensitivity <= cfg["max_tolerance_sensitivity"] and
          erode_excess <= cfg["max_erode_excess_ratio"])
    measured = {"tolerance_sensitivity": round(float(sensitivity), 5),
                "erode_excess_ratio": round(float(erode_excess), 5)}
    if detail:
        measured.update(detail)
    return _result("g", "hard", ok, measured, dict(cfg),
                   "silhouette moves %.2f%% of its area across a +/-25%% tolerance sweep "
                   "(limit %.2f%%), erosion cost %.2fx what its perimeter predicts (limit %.2fx)"
                   % (sensitivity * 100, cfg["max_tolerance_sensitivity"] * 100,
                      erode_excess, cfg["max_erode_excess_ratio"]) +
                   ("" if ok else " — the object's own colour is close enough to the ground "
                                  "that the matte is eating it, not cutting it."))


# --------------------------------------------------------------------------- misc

def gate_dims(cross):
    """The declared dimensions against the drawn ones. Warn.

    It was computed and written into the record with no severity at all, so a
    `--width-m` off by a third emitted no line and did not touch the exit code.
    The corpus desk measures 0.70: the world calls it 1.30 m wide and it draws
    0.98 m wide in the room. The renderer scales by height, so §12.5 cannot see
    it, and it is comparison-criteria's own T5.3 (scale disagreement).

    Warn, not hard: `dims_m` is the operator's, sourced from period reference,
    and blueprint §5 says the project camera is unsettled — so a disagreement is
    real information and not a proof of error.
    """
    return _result("dims", "warn", bool(cross.get("agrees")),
                   {k: cross[k] for k in ("drawn_width_m", "implied_width_m", "ratio")},
                   {"ratio_band": [0.85, 1.15]},
                   "declared dimensions agree with the drawn width (ratio %s)"
                   % cross.get("ratio") if cross.get("agrees") else
                   "the object draws %.3f m wide where dims_m implies %.3f m (ratio %s): the "
                   "record's width and its own pixels disagree, and the renderer scales by "
                   "height so nothing downstream will notice"
                   % (cross.get("drawn_width_m") or 0.0, cross.get("implied_width_m") or 0.0,
                      cross.get("ratio")))


def part_mask_adherence_gate(adherence, cfg):
    """Warn when a part mask's boundary does not sit on the reveal gaps.

    Warn, not hard: measured on the corpus desk the fitted mask scores 0.51 and
    masks displaced 20-30 px score 0.24-0.27, which discriminates but not
    sharply enough to block on — the drawer's own highlight band is nearly as
    dark as a reveal. The real evidence is the overlay image
    `replicator.maskgen --overlay` writes for the eye.
    """
    if adherence is None:
        return _result("part_mask", "warn", True, {}, dict(cfg),
                       "no mask boundary to measure")
    # Reported, with no verdict. On constructed art this separates perfectly
    # (exact mask 1.00; displaced 20px in, 20px out or 30px on one edge all
    # 0.00), and on the corpus desk the ordering INVERTS: the fitted mask scores
    # 0.21 while the same mask displaced 25 and 30 px scores 0.31 and 0.33. A
    # statistic that ranks a wrong mask above a right one cannot carry a
    # verdict, and dressing it as a warning would have it read as evidence. The
    # evidence a mask follows the reveals is the overlay `replicator.maskgen
    # --overlay` writes, and that is what was looked at.
    return _result("part_mask", "report", True, dict(adherence), dict(cfg),
                   "mask-boundary adherence %.2f on its worst edge (%s) — REPORTED, NOT GATED: "
                   "this statistic separates cleanly on constructed art and inverts on the "
                   "corpus, so it carries no verdict. Check the maskgen overlay."
                   % (adherence["within_3px_fraction"], adherence.get("worst_edge")))


def slide_gate(supplied_dy, min_dy, dx, view_side, max_dy=None, scale_open=None,
               opening_max_dy=None, max_dx=None, backing=None, min_backing=None):
    """The declared travel must clear the cavity it slides out of.

    Row 2's lesson turned into a check: `slide.dy` 0.24 was chosen for the
    placeholder desk so the revealed key draws *inside* the cavity rather than
    on the drawer's face, because children draw after their host's parts. A
    `dy` copied from a document example reproduces that defect invisibly.
    """
    ok = supplied_dy >= min_dy
    msgs = []
    if backing is not None and min_backing is not None and backing < min_backing:
        ok = False
        msgs.append("at full travel only %.0f%% of the open part still lies against the body's "
                    "own carcass (floor %.0f%%): the rest hangs over the gaps between the legs, "
                    "which at draw scale reads as a plank on the floor rather than as an open "
                    "drawer" % (backing * 100, min_backing * 100))
    if opening_max_dy is not None and supplied_dy > opening_max_dy:
        ok = False
        msgs.append("slide.dy %g carries the open front past its own opening (limit %.4f). A "
                    "drawer slides OUT of its recess and stays at it; travel beyond this reads "
                    "as a plank lying on the floor, which is what the corpus desk did at dy "
                    "0.24 with only a lower bound in force" % (supplied_dy, opening_max_dy))
    if max_dx is not None and abs(dx) > max_dx:
        ok = False
        msgs.append("slide.dx %g moves the part more than %.2f of the body width sideways; a "
                    "drawer pulls toward the viewer, not across the carcass" % (dx, max_dx))
    if max_dy is not None and supplied_dy > max_dy:
        ok = False
        msgs.append("slide.dy %g travels past the body's own bottom edge (limit %.4f): a part "
                    "that leaves the canvas satisfies a minimum-travel bound while being "
                    "nowhere the player can see it" % (supplied_dy, max_dy))
    if scale_open is not None and not (0.2 <= scale_open <= 3.0):
        ok = False
        msgs.append("slide.scale_open %g is outside 0.2..3.0" % scale_open)
    if not ok and supplied_dy < min_dy:
        msgs.append("slide.dy %g does not clear the cavity: the open front's top edge must "
                    "reach it, which needs dy >= %.4f. A revealed child would draw on the "
                    "face of the drawer instead of inside it." % (supplied_dy, min_dy))
    warn = None
    if view_side == "left" and dx > 0:
        warn = ("slide.dx %g pulls the part toward screen-right on a viewer-left "
                "three-quarter object" % dx)
    elif view_side == "right" and dx < 0:
        warn = ("slide.dx %g pulls the part toward screen-left on a viewer-right "
                "three-quarter object" % dx)
    if warn:
        msgs.append(warn)
    return _result("slide", "hard", ok,
                   {"dy": supplied_dy, "min_dy_clearance": round(float(min_dy), 4), "dx": dx,
                    "max_dy_at_opening": (None if opening_max_dy is None
                                          else round(float(opening_max_dy), 4)),
                    "scale_open": scale_open,
                    "carcass_backing": (None if backing is None else round(float(backing), 4))},
                   {"min_dy_clearance": round(float(min_dy), 4),
                    "max_dy_at_opening": (None if opening_max_dy is None
                                          else round(float(opening_max_dy), 4))},
                   "; ".join(msgs) if msgs else
                   "travel clears the cavity (dy %g >= %.4f)" % (supplied_dy, min_dy))


def open_state_gate(open_rect, cavity):
    """The open part must not cover the cavity its contents show through."""
    if cavity is None:
        return _result("open_state", "hard", True, {}, {},
                       "no cavity region to keep clear")
    covers = not (open_rect["y0"] >= cavity["y1"] or open_rect["y1"] <= cavity["y0"] or
                  open_rect["x0"] >= cavity["x1"] or open_rect["x1"] <= cavity["x0"])
    return _result("open_state", "hard", not covers,
                   {"open_rect": open_rect, "cavity": cavity}, {},
                   "the open part clears the cavity" if not covers else
                   "at full travel the part still covers the cavity — anything revealed "
                   "inside would draw on the part's face")
