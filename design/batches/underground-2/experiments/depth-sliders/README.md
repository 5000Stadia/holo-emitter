# Depth-slider experiment (2026-08-31, the Captain's order)

Which lever makes the generator hold the declared 11.2 m far wall?
Variants (2 rolls each, every roll an INDEPENDENT stateless generation -
prompt + Image 1 only, no shared context - the Captain's fresh-painter law):

| variant | guide | ask |
|---|---|---|
| A | guide-old.png (r3 prep: pale band + ink lines) | ask_new.txt (seat's plane-locked spec ask) |
| B | guide-new.png (grow4: full pre-fill + physical seams) | ask_old.txt (r3 prep ask) |
| C | guide-new.png | ask_new.txt |
| D | guide-new.png | ask_new_nodepth.txt (spec ask minus explicit 11.2 m wording) |

Outputs: backdrops/source/platform-E/exp-{a,b,c,d}{1,2}.png
Measurement: corner-walk span -> implied depth, plus the loop's dado ruler.
Spec provenance: design/audit/painter-guidance-spec-2026-08-31.md

## Results (2026-08-31, 8 rolls, fresh-painter law)

| roll | span px | implied depth | stripe px | verdict vs declared (585 / 11.2m / 110) |
|---|---|---|---|---|
| a1 | 555 | 11.81m | 78 | span close (+5%), stripe thin |
| a2 | 945 | 6.94m | 75 | attractor |
| b1 | 735 | 8.92m | 85 | attractor-ish |
| b2 | 567 | 11.56m | 81 | span close (+3%), stripe thin |
| c1 | 591 | 11.09m | 114 | BOTH TRUE - first fully instrument-true deep roll of the campaign |
| c2 | 1041 | 6.30m | 88 | attractor |
| d1 | 843 | 7.77m | 80 | attractor |
| d2 | 387 | 16.93m | 82 | overshoot - variance exploded without depth wording |

Read: no slider LOCKS depth; the full combo (new guide + new ask, C) produced
the first roll true on both instruments; explicit depth wording appears to
bound the variance (D lost it in both directions); near-target rate rose from
0/6 (all prior campaigns) to 3/8 within ~5%. The recipe is C + roll-until-pass
with the strict gates unchanged.

## Genre cross-test (waves 1-2, 2026-08-31/09-01)

Wave 1 shipped contaminated prompts (curly-quote + reflow bugs): the painter
built the PLATFORM far wall inside the manor and hospital on command -
proof that fabric follows the ask's words with near-total fidelity.
Wave 2 (clean prompts, v2 image-led guides): all six returns hold their own
genre fabric and read natural. Depths: kitchen 15.28/4.89m, ward 9.38/4.84m,
noodle 8.99/unmeasurable. Wave 1 depths: kitchen 17.48/4.95, noodle
11.56 (hit)/14.09, ward unmeasurable.

CUMULATIVE VERDICT: no guide or ask construction locks depth in any genre;
near-target rate ~1 in 5-6 rolls everywhere. Fabric, look, plane structure
and seam alignment are all controllable; depth alone is not. The deterministic
path (composed reprojection of promoted close art + enhance ask, far-E's own
promotion route) remains the only construction that guarantees depth.

## Arm B — reference-teaching (2026-09-01)

Image 1 = the rectified frame of the best prior miss (the warp teaching
before, touching nothing after - the Captain's original law). Four rolls:
uniform scales 1.1346, 0.9842, 1.0474, 1.0315; reveals 0.023, 0.043, 0, 0.
Verdict: a VARIANCE-SHRINKER - Arm A scattered 0.61..1.56; Arm B holds
0.98..1.13 with 3/4 inside ~5%. Adopted: the standard's Image 1 becomes the
rectified best-miss whenever one exists; selection + verifier-raw then land
the winner.
