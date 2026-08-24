#!/usr/bin/env python3
"""Row 34 — the evolution's fitness, its separation discipline, and its breeding.

    python3 design/plan-draft/measured/row34_fitness.py                    # score generation 1
    python3 design/plan-draft/measured/row34_fitness.py --plan-generation-2
    python3 design/plan-draft/measured/row34_fitness.py --batch DIR --readings DIR --out FILE

`design/specs/34-plan.md` §5 and §6 are the contract, and every rule this file
applies was written down there before generation 1 was dispatched.

THIS FILE NAMES NO ARM.
-----------------------
Not the control, not the governing frame's arm, not any of them. The arm ids,
their channel triples, the control's id and the mutation ladder are all READ out
of `assignment.json`, which was committed before any candidate existed. That is
the mechanical half of the fence Kabe ruled [HUMAN, 2026-08-24]: "Yeah but test
my direction against our tests as well." An arm literal in this file would be a
place where a privileged arm could hide, so there is no place: the scorer cannot
tell which arm is whose idea, and `evolution.spec.mjs` scans this file to keep
it that way.

THE PRIMARY IS THE ADMISSIBLE HORIZON, AND NO BAND MOVES.
---------------------------------------------------------
`admissible` is `_promotion.ramp is not None` — the row-20 ruled instrument
fitted the two side-wall junctions and the fit passed row 32's three tests. This
file does not re-implement any of that and does not widen any of it; it counts.

WHY THE TEST IS EXACT AND WHY IT IS CORRECTED
----------------------------------------------
Four pooled rolls per arm is a screen. Row 23 §5.5's second draft advertised an
error rate that was wrong in the direction that flattered it, and the correction
was to compute the true one rather than to argue. So: one-sided Fisher's exact
test, computed by enumeration; Holm-Bonferroni over the whole arm-versus-control
family; a minimum margin; and `min_detectable_effect` printed beside every table
so the run's own weakness is a number rather than a claim. If nothing clears,
the headline is NO SEPARATION and the breeding takes the declared null branch.
No clause anywhere in this file turns a number into a crown.
"""
import argparse
import json
import os
import sys
from math import comb
from statistics import median

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BATCH = os.path.join(ROOT, "design", "batches", "row34-evolution")
READINGS = os.path.join(HERE, "row34")

#: Plan §5.4. Fixed before generation 1 and not reachable from the data.
ALPHA_SCREEN = 0.10
ALPHA_CONFIRM = 0.05
MARGIN_MIN = 2

HEADLINE_NONE = "NO SEPARATION"
HEADLINE_SEP = "SEPARATION: %s"
HEADLINE_SPLIT = "SPLIT: %s"
HEADLINE_BROKEN = "RUN BROKEN: every reading is withheld"

NOTE_NO_TEXT_PAINTED = (
    "NOTE: the instrument has no text_painted detector — 23-plan §5.4 named the flag "
    "and P0 never built it, and this row adds no detector. A painted label is a SILENT "
    "pass in these numbers. What guards the ask instead is prompt_lint.py plus a suite "
    "case asserting the no-lettering constraint is in every arm's prompt.")
NOTE_MINIMAL_TEXT = (
    "NOTE: the minimal-text arm is MINIMAL, not none: three body sentences plus the three "
    "header lines prompt_lint.py requires of every prompt in this project.")
NOTE_CAMERA = (
    "NOTE: the camera column is SECONDARY. Every arm asks for the same camera and all 21 "
    "hold-family walls already pass it, so a camera separation would be evidence about "
    "camera behaviour and not about the manipulation (row 23 §5.5, and it governs here).")


# ------------------------------------------------------------------ loading

def load(batch, readings, generation):
    assign_name = "assignment.json" if generation == 1 else "assignment-gen%d.json" % generation
    assign = json.load(open(os.path.join(batch, assign_name)))
    manifest = json.load(open(os.path.join(batch, "manifest.json")))
    docs = {}
    for roll in assign["rolls"]:
        if roll["generation"] != generation:
            continue
        p = os.path.join(readings, roll["id"] + ".json")
        docs[roll["id"]] = json.load(open(p)) if os.path.exists(p) else None
    return assign, manifest, docs


# ------------------------------------------------------------------ fitness

def roll_metrics(reading, declared_row):
    """One roll's fitness quantities, read out of a reading the instrument
    already produced. Nothing here measures a pixel.

    `WITHHELD` is a fact about US — a frame that is not 1536x1024, a bracket
    outside the picture — and it counts against NOTHING: the roll leaves every
    denominator, which is the wave's own meaning kept exactly.

    `ABSENT` is not withheld and is not excluded. A frame whose floor line or
    declared anchor is outside the standing licence gives the instrument no
    scale, and with no scale there is no horizon: it scores `admissible = False`,
    correctly, and stays in the denominator.
    """
    if reading is None:
        return {"missing": True}
    if reading.get("verdict") == "WITHHELD":
        return {"withheld": True, "blocked_on": reading.get("blocked_on")}
    p = reading.get("_promotion") or {}
    ramp = p.get("ramp")
    tried = [t for t in (p.get("ceiling_rows_tried") or [])
             if t.get("sigma_y_px") is not None]
    best = min(tried, key=lambda t: t["sigma_y_px"]) if tried else None
    return {
        "withheld": False,
        "admissible": ramp is not None,
        "camera_pass": reading.get("verdict") == "PASS",
        "verdict": reading.get("verdict"),
        "kind": reading.get("kind"),
        "d_horizon_px": (abs(ramp["y"] - declared_row) if ramp else None),
        "d_horizon_any_px": (abs(best["horizon_y_px"] - declared_row)
                             if best and best.get("horizon_y_px") is not None else None),
        "sigma_best_px": (best["sigma_y_px"] if best else None),
        "hold_family": p.get("hold_family"),
    }


def _med(xs):
    xs = [x for x in xs if x is not None]
    return round(median(xs), 2) if xs else None


def cells(assign, docs, generation):
    """(arm, wall) -> the rolls' metrics, and the per-cell summary."""
    declared = {}
    out = {}
    for roll in assign["rolls"]:
        if roll["generation"] != generation:
            continue
        d = docs.get(roll["id"])
        row = d.get("_declared_horizon_row") if d else None
        if row is not None:
            declared[roll["wall"]] = row
        out.setdefault((roll["arm"], roll["wall"]), []).append(
            (roll["id"], roll_metrics(d, row)))
    return out, declared


def summarise(rolls):
    """One cell: k of n, with the withheld rolls out of the denominator."""
    live = [m for _, m in rolls if not m.get("withheld") and not m.get("missing")]
    return {
        "n_rolls": len(rolls),
        "n_withheld": sum(1 for _, m in rolls if m.get("withheld")),
        "n_missing": sum(1 for _, m in rolls if m.get("missing")),
        "n": len(live),
        "admissible": sum(1 for m in live if m["admissible"]),
        "camera_pass": sum(1 for m in live if m["camera_pass"]),
        "d_horizon_px": _med([m["d_horizon_px"] for m in live]),
        "d_horizon_any_px": _med([m["d_horizon_any_px"] for m in live]),
        "sigma_best_px": _med([m["sigma_best_px"] for m in live]),
    }


# ------------------------------------------------------------- the statistics

def fisher_one_sided(a, n_a, c, n_c):
    """P(the arm's count is at least this high | arm and control identical).

    The exact hypergeometric tail, enumerated. No normal approximation and no
    continuity correction: at n = 4 an approximation is not an approximation of
    anything, and row 23's lesson was that an advertised rate has to be the true
    one.
    """
    total = a + c
    n = n_a + n_c
    if n == 0 or total == 0 or total == n:
        return 1.0
    denom = comb(n, total)
    num = 0
    for x in range(a, min(n_a, total) + 1):
        if 0 <= total - x <= n_c:
            num += comb(n_a, x) * comb(n_c, total - x)
    return num / denom


def holm(pvals, alpha):
    """Holm-Bonferroni, step-down. Returns a reject flag per input position and
    the threshold each was compared against."""
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    reject = [False] * m
    thresh = [None] * m
    still = True
    for rank, i in enumerate(order):
        t = alpha / (m - rank)
        thresh[i] = t
        if still and pvals[i] <= t:
            reject[i] = True
        else:
            still = False
    return reject, thresh


def separates(clears_holm, margin, split, margin_min=MARGIN_MIN):
    """The three clauses of plan §5.4 that turn numbers into a separation, as one
    pure function so the suite can test each clause on its own.

    AT GENERATION 1'S n THE MARGIN CLAUSE DOES NO INDEPENDENT WORK, and saying so
    is more useful than pretending it is a second guard: with 4 pooled rolls a
    side and six comparisons, the only result that clears Holm at all is 4 of 4
    against 0 of 4, whose margin is 4. The clause becomes binding at the larger
    pooled n a confirmation generation reaches, and it is kept because it is the
    guard that survives a change in n — which is exactly the kind of change that
    silently loosens a rule nobody re-derived. The suite tests it as a unit
    rather than through a fixture that cannot reach it.
    """
    return bool(clears_holm) and margin >= margin_min and not split


def min_detectable_effect(n_a, n_c, m_comparisons, alpha, margin_min):
    """The smallest arm-versus-control result that could clear the discipline.

    Enumerated over every possible pair of counts rather than asserted, so
    adding an arm tightens Holm and this number moves with it. The threshold
    used is Holm's TIGHTEST step (alpha / m), because an arm cannot know it will
    be the last one tested and this is the guarantee.
    """
    best = None
    thresh = alpha / m_comparisons if m_comparisons else alpha
    for c in range(n_c + 1):
        for a in range(n_a + 1):
            if a - c < margin_min:
                continue
            p = fisher_one_sided(a, n_a, c, n_c)
            if p <= thresh:
                key = (a - c, a)
                if best is None or key < best[0]:
                    best = (key, {"arm_admissible": a, "arm_n": n_a,
                                  "control_admissible": c, "control_n": n_c,
                                  "margin": a - c, "fisher_p": round(p, 6),
                                  "holm_tightest_threshold": round(thresh, 6)})
    return None if best is None else best[1]


# ---------------------------------------------------------------- evaluation

def evaluate(assign, docs, generation, alpha=None, margin_min=MARGIN_MIN):
    """The whole judgement, with every rule from plan §5.4 applied in order."""
    control = assign["_control"]
    arms = [a["id"] for a in assign["_arms"]]
    arm_index = {a: i for i, a in enumerate(arms)}
    alpha = alpha if alpha is not None else ALPHA_SCREEN
    cellmap, declared = cells(assign, docs, generation)
    walls = sorted({w for _, w in cellmap})

    per_cell = {k: summarise(v) for k, v in cellmap.items()}

    def pooled(arm):
        rolls = []
        for w in walls:
            rolls += cellmap.get((arm, w), [])
        return summarise(rolls)

    pool = {a: pooled(a) for a in arms}
    # A BROKEN RUN IS NOT A NULL, and the difference is load-bearing: a null is a
    # finding this row records honestly, while a generation where nothing could
    # be measured has produced no evidence at all and must not be bred from. The
    # whole table is still computed and printed — a reader needs to see the
    # withheld column that convicts it — and only the headline changes.
    broken = sum(pool[a]["n"] for a in arms) == 0

    contenders = [a for a in arms if a != control]
    cp = pool[control]
    comps = []
    for a in contenders:
        s = pool[a]
        p = fisher_one_sided(s["admissible"], s["n"], cp["admissible"], cp["n"])
        comps.append({
            "arm": a,
            "admissible": s["admissible"], "n": s["n"],
            "control_admissible": cp["admissible"], "control_n": cp["n"],
            "margin": s["admissible"] - cp["admissible"],
            "fisher_p": round(p, 6),
            "d_horizon_px": s["d_horizon_px"],
            "d_horizon_any_px": s["d_horizon_any_px"],
            "sigma_best_px": s["sigma_best_px"],
        })
    rej, th = holm([c["fisher_p"] for c in comps], alpha)
    for c, r, t in zip(comps, rej, th):
        c["holm_threshold"] = round(t, 6)
        c["clears_holm"] = r
        c["clears_margin"] = c["margin"] >= margin_min
        # A SPLIT IS NOT A WIN. An arm that clears pooled and loses to the
        # control on one of the two walls has not shown the thing the two walls
        # were chosen to test, and it carries forward as an entrant rather than
        # as a winner.
        c["split"] = any(
            per_cell.get((c["arm"], w), {}).get("admissible", 0)
            < per_cell.get((control, w), {}).get("admissible", 0) for w in walls)
        c["separates"] = separates(r, c["margin"], c["split"], margin_min)

    def rank_key(c):
        s = pool[c["arm"]]
        rate = (s["admissible"] / s["n"]) if s["n"] else 0.0
        return (-rate,
                s["d_horizon_px"] if s["d_horizon_px"] is not None else 1e9,
                s["sigma_best_px"] if s["sigma_best_px"] is not None else 1e9,
                arm_index[c["arm"]])

    winners = sorted([c for c in comps if c["separates"]], key=rank_key)
    splits = sorted([c for c in comps
                     if c["clears_holm"] and c["clears_margin"] and c["split"]],
                    key=rank_key)
    if broken:
        headline = HEADLINE_BROKEN
        winners, splits = [], []
    elif winners:
        headline = HEADLINE_SEP % winners[0]["arm"]
    elif splits:
        headline = HEADLINE_SPLIT % splits[0]["arm"]
    else:
        headline = HEADLINE_NONE

    mde = min_detectable_effect(cp["n"] or len(walls) * 2, cp["n"] or len(walls) * 2,
                                len(comps), alpha, margin_min)
    return {
        "generation": generation, "walls": walls, "declared_horizon_row": declared,
        "control": control, "arms": arms, "alpha": alpha, "margin_min": margin_min,
        "per_cell": per_cell, "pooled": pool, "comparisons": comps,
        "winners": [w["arm"] for w in winners], "splits": [s["arm"] for s in splits],
        "ranked": [c["arm"] for c in sorted(comps, key=rank_key)],
        "min_detectable_effect": mde,
        "headline": headline,
    }


# ------------------------------------------------------------- the breeding

def _sig(ch, channels):
    return "|".join(str(ch[c]) for c in channels)


def crossings(a_ch, b_ch, channels, taken):
    """Each of the channel settings from one parent or the other, enumerated in
    a fixed order so the output is reproducible from the parents alone. A
    crossing that reproduces something already in the pool is dropped.

    The mask rides out with each crossing because it is what makes the id
    unique: five crossings of one pair all called `v1xv4` would be five rows
    nobody could tell apart in the very table they exist to be compared in.
    """
    out = []
    for mask in range(1, 2 ** len(channels) - 1):
        ch = {}
        for i, c in enumerate(channels):
            ch[c] = b_ch[c] if (mask >> i) & 1 else a_ch[c]
        s = _sig(ch, channels)
        if s in taken:
            continue
        taken.add(s)
        out.append((mask, ch))
    return out


def plan_next_generation(assign, result, budget):
    """Generation 2's arms — a deterministic function of generation 1's
    readings, with the rules written down before those readings existed.

    NO ARM HAS A SEAT BY NAME. The control is the one standing entrant and it is
    there as the yardstick, re-rolled fresh every generation because a control
    measured once and reused turns drift into signal. Everything else is earned.
    """
    control = assign["_control"]
    chan = {a["id"]: a["channels"] for a in assign["_arms"]}
    channels = sorted(next(iter(chan.values())).keys())
    amps = assign.get("_amplification", {})
    cap = budget["arms_gen1"]

    if result["headline"] == HEADLINE_BROKEN:
        return {"branch": "C", "refused": True, "arms": [], "rolls": 0, "budget": budget,
                "_why": "every reading in generation 1 is withheld. That is a broken run and "
                        "not a null result, and a generation planned from it would breed from "
                        "nothing. Fix the returns and re-measure."}

    taken = {_sig(chan[a], channels) for a in chan}
    out = [{"arm": control, "channels": chan[control], "origin": "the control, re-rolled fresh"}]

    if result["winners"]:
        branch = "A"
        ranked = result["winners"]
        w1 = ranked[0]
        out.append({"arm": w1, "channels": chan[w1], "origin": "winner"})
        if len(ranked) > 1:
            out.append({"arm": ranked[1], "channels": chan[ranked[1]], "origin": "runner-up"})
        # BREADTH BEFORE DEPTH, and it is round-robin rather than partner-by-
        # partner for a reason worth stating: taking every crossing of the
        # winner with the FIRST partner before touching the second fills a
        # generation with five variations on one pair, which is a narrower
        # search than the one that produced the winner. One crossing per partner
        # in rank order, then a second from each, is the same enumeration read
        # across instead of down, and it is just as deterministic.
        pools = [(other, crossings(chan[w1], chan[other], channels, taken))
                 for other in result["ranked"] if other != w1]
        depth = 0
        while len(out) < cap and any(depth < len(p) for _, p in pools):
            for other, p in pools:
                if len(out) >= cap or depth >= len(p):
                    continue
                mask, ch = p[depth]
                out.append({"arm": "%sx%sm%d" % (w1, other, mask), "channels": ch,
                            "origin": "crossing", "parents": [w1, other],
                            "needs_composer": True})
            depth += 1
    else:
        branch = "B"
        # THE CONTINUOUS LADDER, and it fires only because the rate said nothing.
        # A fit outside the licence is not a horizon, so these quantities may
        # never crown anything (plan §5.2); all they may do is seed.
        def cont_key(a):
            s = result["pooled"][a]
            return (s["d_horizon_any_px"] if s["d_horizon_any_px"] is not None else 1e9,
                    s["sigma_best_px"] if s["sigma_best_px"] is not None else 1e9,
                    [x["id"] for x in assign["_arms"]].index(a))
        pool = sorted([a for a in result["arms"] if a != control], key=cont_key)
        top = pool[:2]
        for a in top:
            out.append({"arm": a + "A", "channels": chan[a], "origin": "amplified",
                        "parents": [a], "amplification": amps.get(a),
                        "needs_composer": True})
        if len(top) == 2:
            for mask, ch in crossings(chan[top[0]], chan[top[1]], channels, taken):
                if len(out) >= cap:
                    break
                out.append({"arm": "%sx%sm%d" % (top[0], top[1], mask), "channels": ch,
                            "origin": "crossing", "parents": top, "needs_composer": True})
        # THE OPPOSITE EXTREME, so a null does not re-run the same field with the
        # same field's blind spot. "Opposite" is read off the SPECTRUM the id map
        # carries — image-carries-all at one end, text-carries-all at the other —
        # and is the arm furthest along it from the one that led on the
        # continuous quantities. Measured as a distance on that axis rather than
        # as "the worst arm", which is a different thing and would breed from
        # failure.
        order = [s["arm"] for s in (assign.get("_spectrum") or [])]
        if top and order and len(out) < cap:
            here = order.index(top[0]) if top[0] in order else 0
            far = sorted([a for a in result["arms"] if a != control
                          and a in order and all(o["arm"] != a for o in out)],
                         key=lambda a: (-abs(order.index(a) - here), order.index(a)))
            if far:
                out.append({"arm": far[0], "channels": chan[far[0]],
                            "origin": "opposite extreme of the image/text spectrum",
                            "spectrum_distance": abs(order.index(far[0]) - here)})

    out = out[:cap]
    rolls = len(out) * budget["walls"] * budget["rolls_per_arm_per_wall"]
    over = rolls > budget["images_per_screening_generation"]
    return {
        "branch": branch, "refused": over, "arms": out, "rolls": rolls,
        "budget": budget,
        "_needs_composer": "an arm marked needs_composer names a channel combination no "
                           "composer implements yet; writing it in tools/evolution-arms.mjs is "
                           "the mechanical follow-on, and its channel triple is fixed here "
                           "rather than chosen later",
        "_why_refused": (None if not over else
                         "the planned arms would cost %d rolls against a declared %d"
                         % (rolls, budget["images_per_screening_generation"])),
    }


# ------------------------------------------------------------------ the report

def report(assign, result, gen_next=None):
    L = []
    L.append("# Row 34 — the breakout evolution run")
    L.append("")
    L.append("GENERATION %d — %d rolls, %d arms, %d walls, %d rolls each"
             % (result["generation"],
                sum(result["pooled"][a]["n_rolls"] for a in result["arms"]),
                len(result["arms"]), len(result["walls"]),
                assign["_budget"]["rolls_per_arm_per_wall"]))
    L.append("")
    L.append("| arm | wall | adm | cam | d_horizon_px | d_horizon_any_px | sigma_best_px | withheld |")
    L.append("|---|---|---|---|---|---|---|---|")
    for a in result["arms"]:
        for w in result["walls"]:
            s = result["per_cell"].get((a, w))
            if not s:
                continue
            L.append("| %s | %s | %d/%d | %d/%d | %s | %s | %s | %d |"
                     % (a, w, s["admissible"], s["n"], s["camera_pass"], s["n"],
                        s["d_horizon_px"], s["d_horizon_any_px"], s["sigma_best_px"],
                        s["n_withheld"]))
    L.append("")
    L.append("## Pooled, against the control")
    L.append("")
    L.append("| arm | adm k/n | control k/n | margin | Fisher p | Holm thr | clears | split | separates |")
    L.append("|---|---|---|---|---|---|---|---|---|")
    for c in result["comparisons"]:
        L.append("| %s | %d/%d | %d/%d | %+d | %.6f | %.6f | %s | %s | %s |"
                 % (c["arm"], c["admissible"], c["n"], c["control_admissible"],
                    c["control_n"], c["margin"], c["fisher_p"], c["holm_threshold"],
                    "yes" if c["clears_holm"] else "no",
                    "yes" if c["split"] else "no",
                    "YES" if c["separates"] else "no"))
    L.append("")
    mde = result.get("min_detectable_effect")
    L.append("MIN DETECTABLE EFFECT AT THIS N: " + (
        "none — at this n and this correction, no result could clear the discipline"
        if not mde else
        "%d of %d against %d of %d (margin %+d, Fisher p %.6f, Holm's tightest step %.6f)"
        % (mde["arm_admissible"], mde["arm_n"], mde["control_admissible"],
           mde["control_n"], mde["margin"], mde["fisher_p"],
           mde["holm_tightest_threshold"])))
    L.append("")
    L.append("HEADLINE: " + result["headline"])
    L.append("")

    # ---- the spectrum, which is how the table is read (plan §5.6a) ----------
    spec = assign.get("_spectrum") or []
    if spec:
        L.append("## Where does precision belong")
        L.append("")
        L.append("[HUMAN, 2026-08-24] \"Visual reference for visual orientation generalities, "
                 "text for well defined articulation of anchored requirements and detail of "
                 "the reference generalizations.\"")
        L.append("")
        L.append("| precision lives in | bound? | arm | adm k/n | d_horizon_px | reads |")
        L.append("|---|---|---|---|---|---|")
        for s in spec:
            p = result["pooled"].get(s["arm"])
            if not p:
                continue
            L.append("| %s | %s | %s | %d/%d | %s | %s |"
                     % (s["precision_in"], s["bound"] or "-", s["arm"],
                        p["admissible"], p["n"], p["d_horizon_px"], s["reads"]))
        L.append("")
        hp = assign.get("_headline_pairing")
        if hp:
            b, u = result["pooled"].get(hp["bound"]), result["pooled"].get(hp["unbound"])
            if b and u:
                L.append("HEADLINE PAIRING — %s (bound) %d/%d against %s (unbound) %d/%d. %s"
                         % (hp["bound"], b["admissible"], b["n"], hp["unbound"],
                            u["admissible"], u["n"], hp["question"]))
                L.append("")
    for n in (NOTE_CAMERA, NOTE_NO_TEXT_PAINTED, NOTE_MINIMAL_TEXT):
        L.append(n)
        L.append("")
    if gen_next:
        L.append("## Generation %d, planned by the rule written before generation %d returned"
                 % (result["generation"] + 1, result["generation"]))
        L.append("")
        L.append("Branch **%s**%s. %d rolls of a declared %d."
                 % (gen_next["branch"], " — REFUSED" if gen_next["refused"] else "",
                    gen_next.get("rolls", 0),
                    gen_next["budget"]["images_per_screening_generation"]))
        L.append("")
        for a in gen_next["arms"]:
            L.append("- `%s` — %s%s" % (a["arm"], a["origin"],
                                        " (needs a composer)" if a.get("needs_composer") else ""))
        L.append("")
    if result["headline"] == HEADLINE_NONE:
        L.append("On a null: production law clause 5 — a change moving neither accuracy nor "
                 "speed \"is apparatus, and apparatus must argue for its life or be removed\". "
                 "A null across every generation puts this row's own machinery on trial, and "
                 "this report says so in those words rather than burying it.")
        L.append("")
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------- the CLI

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--generation", type=int, default=1)
    ap.add_argument("--batch", default=BATCH)
    ap.add_argument("--readings", default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--plan-generation-2", action="store_true")
    ap.add_argument("--plan-out", default=None,
                    help="where the next generation's plan is written (default: the batch)")
    ap.add_argument("--confirm", action="store_true",
                    help="score as the confirmation generation (alpha 0.05, fresh rolls only)")
    ap.add_argument("--json", action="store_true", help="print the result as JSON")
    a = ap.parse_args(argv)
    readings = a.readings or (READINGS if a.generation == 1
                              else "%s-gen%d" % (READINGS, a.generation))
    assign, manifest, docs = load(a.batch, readings, a.generation)
    result = evaluate(assign, docs, a.generation,
                      alpha=(ALPHA_CONFIRM if a.confirm else ALPHA_SCREEN))
    gen_next = None
    if a.plan_generation_2:
        gen_next = plan_next_generation(assign, result, assign["_budget"])
        path = a.plan_out or os.path.join(
            a.batch, "generation-%d-plan.json" % (a.generation + 1))
        with open(path, "w") as fh:
            json.dump(gen_next, fh, indent=2)
            fh.write("\n")
        print("generation plan written to " +
              (path[len(ROOT) + 1:] if path.startswith(ROOT) else path))
    text = report(assign, result, gen_next)
    out = a.out or os.path.join(a.batch, "REPORT.md")
    with open(out, "w") as fh:
        fh.write(text)
    if a.json:
        printable = dict(result)
        printable["per_cell"] = {"%s|%s" % k: v for k, v in result["per_cell"].items()}
        print(json.dumps(printable, indent=2))
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
