"""The whole ingest, as one pure function.

`ingest_sprite` takes decoded images and flags, returns every artifact in
memory plus the gate report, and touches no file. That is blueprint §4b rule 1
("every derivation an importable pure function; every CLI a thin wrapper"): a
future live host imports this and feeds it frames off a wire instead of a disk,
and `ingest.py` above it does nothing but decode, call this once, and write.

The test that proves the CLI is thin runs this on in-memory arrays and
byte-compares its encoded outputs against the files the CLI writes.
"""

from dataclasses import dataclass, field

import numpy as np

from . import anchors as anchors_mod
from . import contract as contract_mod
from . import gates as gates_mod
from . import imaging as im
from . import matte as matte_mod
from . import parts as parts_mod
from . import preview as preview_mod
from . import record as record_mod
from . import states as states_mod
from . import thumbs as thumbs_mod


class IngestError(ValueError):
    """A usage or input problem: the invocation must change, not the image."""


@dataclass
class IngestResult:
    record: dict = None
    body: np.ndarray = None
    parts: dict = field(default_factory=dict)
    states: dict = field(default_factory=dict)
    thumb: np.ndarray = None
    previews: dict = field(default_factory=dict)
    gates: list = field(default_factory=list)
    derived: dict = field(default_factory=dict)
    measured: dict = field(default_factory=dict)
    operator_gates: set = field(default_factory=set)

    @property
    def failures(self):
        return [g["id"] for g in self.gates if g["severity"] == "hard" and not g["passed"]]

    @property
    def operator_failures(self):
        """The hard failures whose only inputs are the operator's own flags.

        The CLI's exit codes partition by WHO MUST ACT, and the asset seat's
        autonomous lane branches on them — exit 2 means "regenerate the source".
        But `slide`, `open_state`, `registration`, `alignment` and an overridden
        `f` fail on flag values, not on the image, and all of them exited 2: the
        lane would regenerate a picture that was never the problem.
        """
        return [g for g in self.failures if g in self.operator_gates]

    @property
    def warnings(self):
        return [g["id"] for g in self.gates if g["severity"] == "warn" and not g["passed"]]

    @property
    def ok(self):
        return not self.failures


def _matte_one(src_rgb, contract, object_class=None):
    """Stage 1 with this image's own computed tolerance and scale rules."""
    tol_rule = contract_mod.for_class(contract, "ingest.matte.tolerance_rule", object_class)
    spa_rule = contract_mod.for_class(contract, "ingest.matte.spatial_rule", object_class)
    stats = matte_mod.ground_statistics(src_rgb)
    tolerance = matte_mod.tolerance_for(stats, tol_rule)
    content_h = matte_mod.content_height(src_rgb, stats["bg"], tolerance)
    spatial = matte_mod.spatial_params(content_h, spa_rule)
    result = matte_mod.matte(
        src_rgb,
        tolerance=tolerance,
        hole_min_area_px=spatial["hole_min_area_px"],
        edge_erode_px=spatial["edge_erode_px"],
        feather_px=contract["ingest"]["matte"]["feather_px"],
        rgb_bleed_px=spatial["rgb_bleed_px"],
        max_erode_excess_ratio=contract["gates"]["over_matte"]["max_erode_excess_ratio"],
        framing_rule=contract_mod.for_class(contract, "ingest.matte.framing_rule",
                                            object_class))
    return result, {"tolerance": round(tolerance, 3), "ground": stats,
                    "spatial": spatial, "content_height_px": content_h}


def _limit_resolution(rgba, max_h):
    """The stored-resolution policy (contract ingest.output)."""
    from PIL import Image
    h = rgba.shape[0]
    if h <= max_h:
        return rgba, None
    w = max(1, int(round(rgba.shape[1] * max_h / float(h))))
    out = np.array(Image.fromarray(rgba, "RGBA").resize((w, max_h), Image.LANCZOS))
    return out, {"from": [int(rgba.shape[1]), int(h)], "to": [w, int(max_h)]}


def _chroma(rgba, alpha_opaque, alpha_solid):
    """Quality 1's temperature half, measured. Nothing gates it — see §B."""
    a = rgba[..., 3]
    rgb = rgba[..., :3].astype(np.float64)
    solid = a >= alpha_solid
    if solid.sum() == 0:
        solid = a >= alpha_opaque
    if solid.sum() == 0:
        return {}
    mean = rgb[solid].mean(axis=0)
    total = float(mean.sum()) or 1.0
    return {
        "mean_rgb": [round(float(v), 2) for v in mean],
        "mean_chromaticity": [round(float(v / total), 4) for v in mean],
        "mean_saturation": round(float(im.saturation(rgb[solid][None, :, :])[0].mean()), 4),
        "warm_cool_index": round(float((mean[0] - mean[2]) / max(mean.mean(), 1e-6)), 4),
        "note": "no gate acts on this and the renderer has no mechanism to correct it: "
                "§7's tint is one constant pull toward the facing's key_tint and §1's "
                "non-goals forbid relighting beyond it. Quality 1's temperature half is "
                "uncertified by this pipeline and unfixable downstream — see the row-3 "
                "closing report.",
    }


SAFE_NAME = __import__("re").compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")


def _check_names(names, flag):
    """Part and state names become path segments and record keys."""
    seen = set()
    for name in names:
        if not SAFE_NAME.match(name or ""):
            raise IngestError(
                "%s name %r is not usable: it becomes a file path segment and a record key, so "
                "it must be lowercase letters, digits, hyphen or underscore, 1-64 characters, "
                "starting with a letter or digit" % (flag, name))
        if name in seen:
            raise IngestError("%s name %r is given twice; each must be unique" % (flag, name))
        seen.add(name)


def ingest_sprite(*, source_rgb, contract, sprite_id, noun, archetype, attachment,
                  dims_m, view_side=None, period=None, takeable=False, airborne=False,
                  source="generated", object_class=None, environment=None,
                  anchor_regions=None, footprint_src=None,
                  part_specs=None, state_specs=None, previews=True):
    """Run every stage in memory and return the artifacts plus the gate report.

    `part_specs`  — [{"id", "mask": bool array in SOURCE coords, "slide": {dx,dy,scale_open},
                      "states": {...}, "cavity_src": (x0,y0,x1,y1) or None,
                      "source_rgb": the source, for the mask adherence measure}]
    `state_specs` — [{"name", "source_rgb", "origin": (x,y) or None,
                      "datum": (x0,y0,x1,y1) or None}]
    """
    vocab = contract["ingest"]["vocabularies"]
    if attachment not in vocab["attachment"]:
        raise IngestError("--attachment %r is not one of %s"
                          % (attachment, ", ".join(vocab["attachment"])))
    if archetype not in vocab["archetype"]:
        raise IngestError("--archetype %r is not one of %s"
                          % (archetype, ", ".join(vocab["archetype"])))
    part_specs = list(part_specs or [])
    state_specs = list(state_specs or [])
    _check_names([s["id"] for s in part_specs], "--part")
    _check_names([s["name"] for s in state_specs], "--state")
    if part_specs and archetype != "sliding":
        raise IngestError("--part given but --archetype is %r; a part-bearing sprite is "
                          "`sliding` (the record would disagree with its own artifacts)"
                          % archetype)
    if state_specs and archetype != "swap":
        raise IngestError("--state given but --archetype is %r; a two-state sprite is `swap`"
                          % archetype)
    # ...and the converse, which was missing. `--archetype sliding` with no
    # --part emitted a green record for a sprite that declares a moving part and
    # carries none: the world reads the archetype and offers an interaction that
    # does nothing. An archetype is a promise about the artifacts beside it.
    if archetype == "sliding" and not part_specs:
        raise IngestError(
            "--archetype sliding needs at least one --part: the record would declare a moving "
            "part and ship no part image, and the world offers an interaction from the archetype")
    if archetype == "swap" and not state_specs:
        raise IngestError(
            "--archetype swap needs at least one --state: the record would declare a second "
            "state and ship no image for it")
    if airborne and attachment in ("floor_against", "floor_free"):
        raise IngestError(
            "--airborne with --attachment %r is a contradiction: airborne says nothing touches "
            "the floor and the attachment says where on the floor it stands. The renderer draws "
            "no contact pool for an airborne sprite while gate (f) goes on certifying the "
            "footprint one would be drawn from." % attachment)

    alpha_opaque = contract["gates"]["alpha_opaque"]["value"]
    alpha_solid = contract["gates"]["alpha_opaque"]["solid_value"]
    result = IngestResult()
    gates = []

    # ---- stage 1: matte -------------------------------------------------
    m, minfo = _matte_one(source_rgb, contract, object_class)
    body = m.rgba
    pre_inpaint = body.copy()

    arrived_content_h = int(m.rgba.shape[0])
    body, resized = _limit_resolution(
        body, contract_mod.for_class(contract, "ingest.output", object_class)
        ["max_content_height_px"])
    if resized:
        pre_inpaint = body.copy()
    scale_back = 1.0 if not resized else body.shape[0] / float(m.rgba.shape[0])

    px = {"w": int(body.shape[1]), "h": int(body.shape[0])}
    trim = m.trim_offset

    # ---- gate (g): is the matte eating the object? ----------------------
    sens, sens_detail = matte_mod.tolerance_sensitivity(
        source_rgb, m.bg_color, minfo["tolerance"],
        sweep=contract["gates"]["over_matte"]["sweep"])
    gates.append(gates_mod.gate_over_matte(
        sens, m.stats["erode_excess_ratio"],
        contract_mod.for_class(contract, "gates.over_matte", object_class), sens_detail))

    # ---- stage 2: anchors ----------------------------------------------
    contact_cfg = contract_mod.for_class(contract, "gates.contact", object_class)
    # `alpha_opaque` is threaded in rather than read from the module constant:
    # its contract basis names base.y and the footprint's contact columns, and a
    # threshold the contract states but the code does not consult is a threshold
    # the record's provenance hash lies about.
    anch, anch_prov = anchors_mod.derive_anchors(body, contact_cfg["band_fraction"],
                                                 alpha_opaque=alpha_opaque)
    if footprint_src is not None:
        scaled = (footprint_src[0] * scale_back, footprint_src[1] * scale_back)
        anch = anchors_mod.apply_footprint_override(
            anch, scaled, (trim[0] * scale_back, trim[1] * scale_back), px)
        anch_prov["chosen"] = "operator_override"
        anch_prov["override"] = {"x0": anch["footprint"]["x0"], "x1": anch["footprint"]["x1"]}
    for name, region in (anchor_regions or {}).items():
        if name == "drawer_cavity":
            continue  # handled with the part it belongs to
        anch = anchors_mod.apply_manual_region(
            anch, name, tuple(v * scale_back for v in region),
            (trim[0] * scale_back, trim[1] * scale_back), px)

    prev_cfg = contract_mod.for_class(contract, "ingest.preview", object_class)
    halo_cfg = dict(contract_mod.for_class(contract, "gates.halo", object_class))
    halo_cfg["_draw_height_px"] = prev_cfg["draw_height_px"]

    # ---- stage 3: parts -------------------------------------------------
    part_records = []
    for spec in part_specs:
        mask_body = parts_mod.translate_mask(spec["mask"], trim, m.rgba.shape)
        if resized:
            from PIL import Image
            mask_body = np.array(Image.fromarray(
                (mask_body.astype(np.uint8) * 255), "L").resize(
                    (px["w"], px["h"]), Image.NEAREST)) >= 128
        cav_cfg = contract_mod.for_class(contract, "ingest.cavity", object_class)
        cut = parts_mod.cut_part(body, mask_body, darken=cav_cfg["darken"],
                                blur_radius=cav_cfg["blur_radius_px"])
        body = cut.body_rgba

        adherence = parts_mod.mask_adherence_per_edge(spec.get("source_rgb", source_rgb),
                                                      spec["mask"])
        gates.append(gates_mod.part_mask_adherence_gate(
            adherence, contract_mod.for_class(contract, "gates.part_mask", object_class)))

        slide = spec["slide"]
        cavity = parts_mod.derived_cavity(cut.closed_rect)
        cav_cfg2 = contract_mod.for_class(contract, "ingest.cavity", object_class)
        min_dy, opening_max_dy = parts_mod.dy_bounds(
            cut.closed_rect, cavity, px, cav_cfg2["clearance_fraction"],
            cav_cfg2["overshoot_fraction"])
        # The upper bound: the open front's TOP edge must still be inside the
        # body. Without it a drawer can travel clean off the canvas, satisfy the
        # minimum, and pass the open-state check because its rectangle no longer
        # overlaps the cavity it was supposed to open.
        max_dy = (px["h"] - cut.closed_rect["y0"]) / float(px["h"])
        backing = parts_mod.carcass_backing(body, cut.part_rgba, cut.origin, slide, px,
                                            t=1.0, alpha_opaque=alpha_opaque)
        gates.append(gates_mod.slide_gate(
            float(slide["dy"]), min_dy, float(slide["dx"]), view_side or "left",
            max_dy=max_dy, scale_open=float(slide.get("scale_open", 1.0)),
            opening_max_dy=opening_max_dy, max_dx=cav_cfg2["max_dx_fraction"],
            backing=backing, min_backing=cav_cfg2["min_carcass_backing"],
            scale_open_min=cav_cfg2["scale_open_min"],
            scale_open_max=cav_cfg2["scale_open_max"]))

        flagged = (anchor_regions or {}).get("drawer_cavity")
        if flagged is not None:
            f = anchors_mod.apply_manual_region(
                {}, "drawer_cavity", tuple(v * scale_back for v in flagged),
                (trim[0] * scale_back, trim[1] * scale_back), px)["drawer_cavity"]
            tol = (contract_mod.for_class(contract, "ingest.cavity", object_class)
                   ["agreement_tolerance_fraction"]) * (cut.closed_rect["y1"] -
                                                        cut.closed_rect["y0"])
            worst = max(abs(f["x0"] - cavity["x0"]), abs(f["y0"] - cavity["y0"]),
                        abs(f["x1"] - cavity["x1"]), abs(f["y1"] - cavity["y1"]))
            if worst > tol:
                raise IngestError(
                    "--anchor drawer_cavity disagrees with the derived cavity by %.1f px "
                    "(budget %.1f px). Flagged %s, derived %s. The cavity is behind the drawer "
                    "front and is not visible on the closed image; it is derived as the closed "
                    "rect minus the travelled front, which is row 2's pinned convention "
                    "(contents sit where they are visible when open)."
                    % (worst, tol, f, cavity))
            anch["drawer_cavity"] = cavity
        else:
            anch["drawer_cavity"] = cavity

        opened, open_rect = parts_mod.open_state_composite(
            body, cut.part_rgba, cut.origin, slide, px, t=1.0)
        visible = {"x0": cavity["x0"], "y0": cavity["y0"], "x1": cavity["x1"],
                   "y1": cavity["y0"] + (cavity["y1"] - cavity["y0"]) *
                   contract_mod.for_class(contract, "ingest.cavity", object_class)
                   ["clearance_fraction"]}
        gates.append(gates_mod.open_state_gate(open_rect, visible))

        closed_composite, _ = parts_mod.open_state_composite(
            body, cut.part_rgba, cut.origin, slide, px, t=0.0)
        gates.append(gates_mod.gate_state_diff(
            closed_composite, pre_inpaint, mask_body,
            contract_mod.for_class(contract, "gates.state_diff", object_class)))

        result.parts[spec["id"]] = cut.part_rgba
        part_records.append({
            "id": spec["id"],
            "image": "parts/%s.png" % spec["id"],
            "origin": dict(cut.origin),
            "slide": dict(slide),
            "states": dict(spec.get("states") or {"closed": 0.0, "open": 1.0}),
        })
        result.derived.setdefault("parts", {})[spec["id"]] = {
            "closed_rect": cut.closed_rect,
            "cavity": cavity,
            "min_dy_clearance": round(float(min_dy), 4),
            "max_dy_at_opening": round(float(opening_max_dy), 4),
            "cavity_drawn_px": round(float(cavity["y1"] - cavity["y0"]) *
                                     prev_cfg["draw_height_px"] / float(px["h"]), 2),
            "mask_adherence": adherence,
            **cut.stats,
        }

    # ---- stage 3b: two-state -------------------------------------------
    states_images = {}
    for spec in state_specs:
        sm, sinfo = _matte_one(spec["source_rgb"], contract, object_class)
        # The state image obeys the same stored-resolution cap as the body, and
        # by the same factor: a body downscaled to 1024 beside a full-resolution
        # state image registers at the wrong scale, and every origin below is in
        # BODY pixel space.
        state_rgba = sm.rgba
        if scale_back != 1.0:
            from PIL import Image as _Image
            sh = max(1, int(round(state_rgba.shape[0] * scale_back)))
            sw = max(1, int(round(state_rgba.shape[1] * scale_back)))
            state_rgba = np.array(_Image.fromarray(state_rgba, "RGBA")
                                  .resize((sw, sh), _Image.LANCZOS))
        derived_origin = None
        evidence = None
        if spec.get("datum") is not None:
            reg_cfg = contract_mod.for_class(contract, "gates.registration", object_class)
            dx, dy, evidence = states_mod.locate_datum(
                source_rgb, spec["source_rgb"], spec["datum"],
                search_fraction=reg_cfg["search_fraction"])
            derived_origin = states_mod.origin_from_datum((dx, dy), m.trim_offset,
                                                          sm.trim_offset)
            derived_origin = {"x": derived_origin["x"] * scale_back,
                              "y": derived_origin["y"] * scale_back}
            result.derived.setdefault("states", {})[spec["name"]] = {
                "datum_offset": [dx, dy], "datum_evidence": dict(evidence),
                "derived_origin": derived_origin, "matte": sinfo}
        st = states_mod.prepare_state(
            spec["name"], state_rgba, body, spec.get("origin"), derived_origin, evidence,
            contract_mod.for_class(contract, "gates.registration", object_class),
            alignment_cfg=contract_mod.for_class(contract, "gates.alignment", object_class))
        gates.append(st.gate)
        gates.append(st.registration)
        gates.append(gates_mod.gate_light(
            state_rgba, contract_mod.for_class(contract, "gates.light", object_class),
            label="states.%s" % spec["name"]))
        # §9.3b says gate (e) applies to both images; a haloed open leaf would
        # otherwise reach the room with nothing having looked at its edge.
        #
        # And the rest of the image-quality set with it. The open state is an
        # INDEPENDENTLY GENERATED picture that goes through its own matte, so it
        # can carry its own baked studio shadow, its own unpunched gap between a
        # door's muntins, and its own over-eaten silhouette — none of which the
        # closed body's gates can see, because they never look at it. A clean
        # closed cupboard beside an open state with a shadow welded on shipped
        # green. `label` puts the image in each id so the board says which
        # picture each verdict is about.
        state_label = "states.%s" % spec["name"]
        gates.append(gates_mod.gate_halo(state_rgba, sm.bg_color, halo_cfg,
                                         label=state_label))
        gates.append(gates_mod.gate_holes(
            state_rgba, sm.bg_color,
            {"tolerance": sinfo["tolerance"] *
                          contract["gates"]["holes"]["tolerance_multiplier"],
             "min_area_px": sinfo["spatial"]["hole_min_area_px"]},
            label=state_label))
        gates.append(gates_mod.gate_shadow(
            state_rgba, sm.bg_color,
            contract_mod.for_class(contract, "gates.shadow", object_class),
            label=state_label))
        s_sens, s_detail = matte_mod.tolerance_sensitivity(
            spec["source_rgb"], sm.bg_color, sinfo["tolerance"],
            sweep=contract["gates"]["over_matte"]["sweep"])
        gates.append(gates_mod.gate_over_matte(
            s_sens, sm.stats["erode_excess_ratio"],
            contract_mod.for_class(contract, "gates.over_matte", object_class),
            s_detail, label=state_label))
        result.states[spec["name"]] = st.rgba
        states_images[spec["name"]] = {"image": "states/%s.png" % spec["name"],
                                       "origin": dict(st.origin)}

    # ---- stage 3c: thumbs ----------------------------------------------
    thumb_cfg = contract_mod.for_class(contract, "ingest.thumb", object_class)
    thumb = None
    if takeable:
        thumb = thumbs_mod.make_thumb(body, size_px=thumb_cfg["size_px"],
                                      content_px=thumb_cfg["content_px"],
                                      filter=thumb_cfg["filter"])
        result.thumb = thumb
    gates.append(thumbs_mod.thumb_gate(
        thumb, takeable, thumb_cfg["size_px"], thumb_cfg["content_px"],
        cfg=contract_mod.for_class(contract, "gates.thumb", object_class)))

    # ---- stage 4: the rest of the gates ---------------------------------
    # The matte clauses judge the MATTE -- the full-resolution silhouette stage 1
    # produced -- and not the stored sprite. The stored-resolution policy is a
    # separate decision, and letting its LANCZOS downscale blur an edge before
    # gate (a) looks at it would let the policy launder a halo: on the grey-halo
    # control the cap alone lifted the inner-band ratio from 0.05 to 0.78.
    gates.append(gates_mod.gate_halo(m.rgba, m.bg_color, halo_cfg, drawn=body))
    gates.append(gates_mod.gate_holes(
        m.rgba, m.bg_color,
        {"tolerance": minfo["tolerance"] *
                      contract["gates"]["holes"]["tolerance_multiplier"],
         "min_area_px": minfo["spatial"]["hole_min_area_px"]}))
    # Gate (c) judges the SOURCE's resolution, per §9.4(c) -- "min resolution:
    # content bbox >= 512px tall" is a statement about what arrived. What is
    # stored is a separate policy (ingest.output), and conflating them would
    # either forbid storing near draw scale or hollow out the gate.
    gates.append(gates_mod.gate_resolution(
        arrived_content_h, takeable,
        contract_mod.for_class(contract, "gates.resolution", object_class)))
    gates.append(gates_mod.gate_shadow(
        m.rgba, m.bg_color, contract_mod.for_class(contract, "gates.shadow", object_class)))
    gates.append(gates_mod.gate_contact(anch, px, attachment, contact_cfg, anch_prov))
    light_gate = gates_mod.gate_light(
        body, contract_mod.for_class(contract, "gates.light", object_class))
    gates.append(light_gate)
    dims_cfg = contract_mod.for_class(contract, "gates.dims", object_class)
    cross = record_mod.dims_cross_check(
        {"h": float(dims_m["h"]), "w": float(dims_m["w"]), "d": float(dims_m["d"])},
        px, contract["camera"]["turn_deg"], dims_cfg)
    gates.append(gates_mod.gate_dims(cross, dims_cfg))

    # ---- previews (looked at, not only measured) ------------------------
    # Four full composites at draw scale are not free, and blueprint §4b rule 1's
    # whole point is that a live host imports this per frame. They are computed
    # when someone is going to look at them and not otherwise.
    for name, ground in (prev_cfg["grounds"].items() if previews else ()):
        for state, t in (("closed", 0.0), ("open", 1.0)):
            shown = preview_mod.with_parts(body, result.parts, part_records, t=t) \
                if part_records else body
            canvas, _ = preview_mod.composite_preview(
                shown, ground, prev_cfg["draw_height_px"])
            result.previews["%s-%s" % (name, state)] = preview_mod.annotate_contact(
                canvas, shown, anch, px, prev_cfg["draw_height_px"],
                attachment=attachment, airborne=airborne)
            if not part_records:
                break

    # ---- stage 5: the record -------------------------------------------
    measured = {
        "light": dict(light_gate["measured"],
                      agrees_with_declared=bool(light_gate["passed"])),
        "chroma": _chroma(body, alpha_opaque, alpha_solid),
        "contact": anch_prov,
        "edge": {"composited_rim": gates[-1]["measured"].get("composited_rim")
                 if gates and "composited_rim" in gates[-1].get("measured", {}) else
                 next((g["measured"].get("composited_rim") for g in gates
                       if g["id"] == "a"), None)},
        "geometry": {"content_px": [px["w"], px["h"]],
                     "draw_height_px": prev_cfg["draw_height_px"],
                     "resized": resized},
        "matte": minfo,
    }
    result.measured = measured
    result.derived["matte"] = m.stats
    result.derived["anchors"] = anch_prov

    result.record = record_mod.build(
        sprite_id=sprite_id, noun=noun, archetype=archetype, attachment=attachment,
        dims_m=dims_m, px=px, view_side=view_side or contract["camera"]["side"],
        light=contract["light"]["key"],
        period=period or {k: v for k, v in contract["ingest"]["period"].items()},
        anchors=anch, takeable=takeable, airborne=airborne,
        parts=part_records or None, states_images=states_images or None,
        thumb="thumb.png" if takeable else None,
        source=source, contract_identity=contract_mod.identity(contract),
        environment=environment or {},
        gates=[{k: g[k] for k in ("id", "severity", "passed", "measured", "threshold",
                                  "message")} for g in gates],
        derived=result.derived, measured=measured,
        turn_deg=contract["camera"]["turn_deg"], dims_cfg=dims_cfg)

    result.body = body
    result.gates = gates
    # Which of the hard gates that ran take an operator flag as their only input.
    # Gate (f) joins them only when --footprint overrode the derived contact band;
    # otherwise it judges the image's own pixels.
    op = set()
    if part_specs:
        op |= {"slide", "open_state"}
    if state_specs:
        op |= {"alignment", "registration"}
    if footprint_src is not None:
        op.add("f")
    result.operator_gates = op
    return result
