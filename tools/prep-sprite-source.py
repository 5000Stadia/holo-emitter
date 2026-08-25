#!/usr/bin/env python3
"""Prepare a painter's return so `replicator.ingest` can matte it (row 42).

Production law is that the tool makes the sprite, not a hand-cut PNG. The
replicator's stage 1 is the only thing allowed to decide alpha, and it decides
it from ONE input: an RGB image standing on a plain mid-grey ground, sampled
from the 1-px border ring (`replicator/matte.py sample_background`). Two of row
42's returns cannot be handed to it as they arrived, for two different reasons,
and this tool is the two preparations — each deterministic, each measured, and
each writing its numbers to a report beside the image.

  --pad-fraction F
      The leaf arrived FULL BLEED: 839x1875 of door and no ground at all.
      `matte._check_margin` refuses that by name (the border ring is 100 %
      off-ground, the sampled median is the door's own oak, and the silhouette
      would come out bitten), and the contract's `framing.margin` is "full
      object centered, generous even margin on every side". There is no
      full-bleed flag in the contract and this tool does not invent one: it
      supplies the margin the contract asks for, in the ground colour, so the
      matte's own border sample is what it was written to be.

  --key-checkerboard
      The casement arrived with a PAINTED transparency checkerboard — a
      two-tone square tiling the painter drew where alpha should have been.
      Handing that to the matte would key nothing (the ground ring is white,
      luminance 254, and `_check_ground_plausible`'s band stops at 215) and
      would ship a casement with an opaque chequered pane. The tiling is
      detected rather than guessed:

        * the TWO TONES are the two modes of the achromatic near-white
          pixels, taken as medians of the two sides of their own midpoint;
        * the TILE PERIOD is measured, per window, as the first
          autocorrelation peak of the binarised pattern along each axis, and
          the median over windows is reported. It is a validation, not a
          predictor: an image generator's checkerboard drifts, so no global
          phase is fitted and none is needed.

      A pixel is keyed when it is achromatic AND its luminance lies inside the
      closed band the two tones span, widened by --tone-tolerance. That set is
      exactly what the tiling and its own blur can produce, and nothing else in
      this image reaches it: the cames and the frame are iron. Keyed components
      smaller than one tile are put back, so a bright speck ON the ironwork is
      not mistaken for glass.

Both preparations write the ground as ONE exact colour, so the matte's tolerance
rule computes sigma 0, drift 0 and clamps to its floor of 8 — the tightest net
the contract admits, and the one that eats the least of the object.
"""

import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from replicator import imaging as im  # noqa: E402


def _luminance_mean(rgb):
    """The flat channel mean. Deliberately NOT `imaging.luminance`'s weighted
    one: the question here is "are these two tones the same grey", and a
    checkerboard's tones are achromatic, so the flat mean is the honest
    statistic and is independent of any weighting choice."""
    return rgb.mean(axis=2)


def detect_tones(rgb, chroma_max, floor):
    """The two tones of the tiling, as medians either side of their midpoint.

    `floor` is a luminance below which nothing in this image is background —
    it exists only to keep the iron out of the histogram, and the tones that
    come back are checked against it by the caller.
    """
    g = _luminance_mean(rgb)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    cand = (chroma <= chroma_max) & (g >= floor)
    if cand.sum() < 1000:
        raise SystemExit("no two-tone candidate region: only %d px are achromatic "
                         "and brighter than %g" % (int(cand.sum()), floor))
    vals = g[cand]
    mid = 0.5 * (float(vals.min()) + float(vals.max()))
    hi = vals[vals >= mid]
    lo = vals[vals < mid]
    if len(hi) < 100 or len(lo) < 100:
        raise SystemExit("the bright achromatic region is not two-tone: %d above and "
                         "%d below its own midpoint %.1f" % (len(hi), len(lo), mid))
    return float(np.median(lo)), float(np.median(hi)), int(cand.sum())


def _runs_along(mask_line, binar_line, out):
    """Collect the lengths of complete constant-tone runs on one scan line.

    A run is COMPLETE only when both of its ends are a tone change with the
    pattern still under the scan — a run that ends because the came started is
    a truncated tile and says nothing about the period, so the first and last
    run of every pattern segment are dropped.
    """
    n = len(mask_line)
    i = 0
    while i < n:
        if not mask_line[i]:
            i += 1
            continue
        j = i
        while j < n and mask_line[j]:
            j += 1
        seg = binar_line[i:j]
        if len(seg) >= 3:
            edges = np.nonzero(seg[1:] != seg[:-1])[0] + 1
            if len(edges) >= 2:
                out.extend(np.diff(edges).tolist())
        i = j


def measure_period(mask, binar):
    """The tile side, as the MODAL complete run length of the binarised
    pattern along both axes.

    A run length is the tile side by construction — a checkerboard scanned
    along either axis alternates tone every tile — and the statistic is taken
    over every complete run in the image, so a tiling that drifts is measured
    where it stands rather than fitted to one global phase it does not have.
    (This one does drift: a rigid lattice fitted to the whole 1402 px width
    agrees with the observed parity on 50.1 % of confident pixels, which is
    chance. A generator drew this checkerboard; it did not tile it.)

    The MODE and not the median, because the tones carry the painter's own
    texture: a speckle that crosses the midpoint splits one tile into three
    runs, which drags a median down without moving the peak. The full
    distribution goes into the report beside it so the peak can be judged.
    """
    runs = []
    for y in range(mask.shape[0]):
        _runs_along(mask[y], binar[y], runs)
    for x in range(mask.shape[1]):
        _runs_along(mask[:, x], binar[:, x], runs)
    if not runs:
        return None, 0, None
    arr = np.asarray(runs, np.int64)
    counts = np.bincount(arr, minlength=2)
    counts[:2] = 0                      # a 1-px run is speckle, never a tile
    mode = int(np.argmax(counts))
    hist = {int(v): int(counts[v]) for v in range(len(counts))
            if counts[v] >= 0.25 * counts[mode]}
    return float(mode), int(arr.size), hist


def choose_ground(rgb, object_mask, radius, lo=40, hi=215):
    """The mid-grey that looks least like this object.

    The matte samples its ground from the border ring and floods every pixel
    within tolerance of it; gate (b) then re-hunts at `holes.tolerance_multiplier`
    times that tolerance and FAILS on any enclosed region of ground colour the
    matte left opaque. A synthetic ground is written by this tool, so the tool
    owes the ground the separation a studio would have given it — and the
    quantity that decides it is exactly gate (b)'s: how much of the object lies
    within the re-hunt radius of the ground.

    Measured, not assumed. On row 42's casement the studio grey the corpus
    arrives on (128) puts 21,619 object pixels inside that radius, in two
    components over the minimum hole area — the ironwork is achromatic and the
    grey is IN it, so the ingest failed gate (b) with "the matte missed a gap"
    on a 155 px patch of iron. The band 140..215 leaves none.

    The band is the contract's own plausible-ground band, so what comes back is
    always a ground `matte._check_ground_plausible` will accept.
    """
    px = rgb[object_mask]
    best = None
    scan = []
    for v in range(lo, hi + 1):
        d = np.sqrt(((px - float(v)) ** 2).sum(axis=1))
        n = int((d <= radius).sum())
        scan.append((v, n))
        if best is None or n < best[1]:
            best = (v, n)
    v, n = best
    top = sorted(scan, key=lambda r: r[1])[:5]
    return (v, v, v), {
        "rule": ("the mid-grey in the contract's plausible band 40..215 with the fewest "
                 "object pixels inside gate (b)'s re-hunt radius"),
        "radius_px": round(radius, 3),
        "chosen": v,
        "object_px_within_radius": n,
        "object_px_within_radius_fraction": round(n / float(max(1, len(px))), 6),
        "best_five": [{"grey": g, "object_px_within_radius": c} for g, c in top],
        "studio_grey_128": next(c for g, c in scan if g == 128),
    }


def key_checkerboard(rgb, chroma_max, tone_tol, tone_floor):
    """Return (mask_of_background, report)."""
    g = _luminance_mean(rgb)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    lo_tone, hi_tone, cand_px = detect_tones(rgb, chroma_max, tone_floor)

    band_lo = lo_tone - tone_tol
    band_hi = hi_tone + tone_tol
    raw = (chroma <= chroma_max) & (g >= band_lo) & (g <= band_hi)

    binar = (g >= 0.5 * (lo_tone + hi_tone))
    tile, run_n, hist = measure_period(raw, binar)
    if tile is None:
        raise SystemExit("nothing in this image scans as a run of alternating tones — "
                         "refusing to key by colour alone")
    tile_area = max(4, int(round(tile * tile)))

    # WHICH KEYED REGIONS BECOME TRANSPARENT IS THE MATTE'S DECISION, NOT THIS
    # TOOL'S. An earlier pass put every keyed component smaller than one tile
    # back as object, to guard against a bright speck on the ironwork being
    # mistaken for glass. That guard already exists one stage downstream and is
    # the contract's: `matte`'s enclosed-hole rule punches a similar region only
    # at or above `hole_min_area_px`, and keeps everything smaller as object.
    # Re-deciding it here would put a second, differently-derived threshold in
    # front of the frozen one. So the small components are MEASURED and
    # reported, and the ground is written under all of them.
    mask = raw
    labels, n = im.label_components(raw)
    sizes = np.bincount(labels.ravel(), minlength=n + 1)[1:]
    small_n = int(((sizes < tile_area) & (sizes > 0)).sum())
    small_px = int(sizes[sizes < tile_area].sum())

    obj = ~mask
    obj_labels, obj_n = im.label_components(obj)
    obj_sizes = np.bincount(obj_labels.ravel(), minlength=obj_n + 1)[1:]
    biggest = int(obj_sizes.max()) if obj_n else 0
    # A came severed by the key shows up as the ironwork ceasing to be one
    # piece. Pieces at or under one tile's area are speckle in the glass, not
    # lattice, and are counted separately rather than folded in.
    real_pieces = int((obj_sizes > tile_area).sum())

    # HOW MUCH OF THE CAME THE TOLERANCE IS TOUCHING, which is the one thing a
    # keyed count cannot say on its own. The replicator asks the same question
    # of its own matte (gate (g), `tolerance_sensitivity`): sweep the number and
    # see how far the silhouette moves. Here the sweep is the tone tolerance,
    # and what it measures is the antialias band between a came and the glass —
    # the only pixels whose classification the number can change.
    sweep = []
    for t in (0, 2, 4, 6, 8, 12, 16):
        m = (chroma <= chroma_max) & (g >= lo_tone - t) & (g <= hi_tone + t)
        sweep.append({"tone_tolerance": t, "keyed_px": int(m.sum()),
                      "object_px": int((~m).sum())})
    plateau = [s for s in sweep if s["tone_tolerance"] >= 4]
    spread = max(s["object_px"] for s in plateau) - min(s["object_px"] for s in plateau)

    report = {
        "tones": {"grey": round(lo_tone, 2), "white": round(hi_tone, 2),
                  "band": [round(band_lo, 2), round(band_hi, 2)],
                  "chroma_max": chroma_max,
                  "candidate_px": cand_px},
        "tile_px": round(tile, 3),
        "tile_runs_measured": run_n,
        "tile_run_histogram_peak_quarter": hist,
        "keyed_px": int(mask.sum()),
        "keyed_fraction": round(float(mask.mean()), 5),
        "keyed_components": int(n),
        "keyed_components_under_one_tile": {"components": small_n, "px": small_px,
                                            "one_tile_px": tile_area},
        "object_px": int(obj.sum()),
        "object_components_over_one_tile": real_pieces,
        "object_largest_component_px": biggest,
        "object_largest_component_fraction": round(biggest / float(max(1, obj.sum())), 5),
        "tolerance_sweep": sweep,
        "tolerance_plateau_object_spread_px": int(spread),
        "tolerance_plateau_object_spread_fraction": round(spread / float(max(1, obj.sum())), 5),
    }
    return mask, report


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("--out", required=True)
    ap.add_argument("--ground", default="auto",
                    help="the mid-grey the matte will sample: R,G,B, or `auto` (the "
                         "default) to choose the mid-grey this object looks least like "
                         "— see choose_ground")
    ap.add_argument("--pad-fraction", type=float, default=0.0,
                    help="margin added on every side, as a fraction of the longer side")
    ap.add_argument("--key-checkerboard", action="store_true")
    ap.add_argument("--chroma-max", type=float, default=8.0)
    ap.add_argument("--tone-tolerance", type=float, default=6.0)
    ap.add_argument("--tone-floor", type=float, default=236.0)
    ap.add_argument("--report")
    args = ap.parse_args(argv)

    with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "replicator", "contract.json")) as fh:
        contract = json.load(fh)
    radius = (contract["gates"]["holes"]["tolerance_multiplier"]
              * contract["ingest"]["matte"]["tolerance_rule"]["min"])

    src = np.asarray(Image.open(args.source).convert("RGB")).astype(np.float64)
    h, w = src.shape[:2]
    report = {"source": args.source, "source_px": [int(w), int(h)]}

    out = src.copy()
    mask = None
    if args.key_checkerboard:
        mask, kr = key_checkerboard(out, args.chroma_max,
                                    args.tone_tolerance, args.tone_floor)
        report["key"] = kr

    object_mask = np.ones((h, w), bool) if mask is None else ~mask
    if args.ground == "auto":
        ground, gr = choose_ground(src, object_mask, radius)
        report["ground_choice"] = gr
    else:
        ground = tuple(int(v) for v in args.ground.split(","))
        if len(ground) != 3 or not all(0 <= v <= 255 for v in ground):
            raise SystemExit("--ground wants R,G,B in 0..255, or `auto`")
    lum = float(im.luminance(np.asarray(ground, np.float64)[None, None, :])[0, 0])
    if not (40.0 <= lum <= 215.0):
        raise SystemExit(
            "--ground %s has luminance %.1f, outside the matte's own plausible-ground "
            "band 40..215 (replicator/matte.py _check_ground_plausible): the ingest "
            "would refuse it." % (ground, lum))
    report["ground_rgb"] = list(ground)
    report["ground_luminance"] = round(lum, 2)
    if mask is not None:
        out[mask] = np.asarray(ground, np.float64)

    pad = int(round(args.pad_fraction * max(h, w)))
    if pad > 0:
        padded = np.empty((h + 2 * pad, w + 2 * pad, 3), np.float64)
        padded[:] = np.asarray(ground, np.float64)
        padded[pad:pad + h, pad:pad + w] = out
        out = padded
    report["pad_px"] = pad
    report["out_px"] = [int(out.shape[1]), int(out.shape[0])]

    # The border ring the matte will sample, measured here so the report says
    # whether the preparation actually gave it one.
    ring = np.concatenate([out[0], out[-1], out[:, 0], out[:, -1]]).reshape(-1, 3)
    med = np.median(ring, axis=0)
    report["border_ring"] = {
        "median_rgb": [round(float(v), 2) for v in med],
        "sigma": round(float(ring.std(axis=0).max()), 4),
        "off_ground_fraction": round(
            float((im.rgb_distance(ring, ground) > 0.5).mean()), 6),
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB").save(args.out)
    report["out"] = args.out

    text = json.dumps(report, indent=2, sort_keys=True)
    if args.report:
        os.makedirs(os.path.dirname(os.path.abspath(args.report)), exist_ok=True)
        with open(args.report, "w") as fh:
            fh.write(text + "\n")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
