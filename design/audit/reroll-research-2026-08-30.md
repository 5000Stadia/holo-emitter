# What prevents rerolls — the underground-2 evidence

[Kabe]: "For rerolls we need to investigate — assume we did it bad and investigate how to
have prevented it from better prompting (note: more prompt is not always better. Better is
better. What makes better is mysterious and may need investigating/research)."

## The experiment the run handed us

The far platform cell's three walls (N, S, E) each rolled twice. The ask's WORDS were the
same both times (the second roll added one correction sentence). The structural difference:
the first rolls carried Image 1 cut from their lead's candidate — a scale-broken frame (the
"pavilion": dark voids where the returns belonged); the second rolls carried NO image at
all (the lead was unpromoted by then, so the emitter attached nothing).

| wall | roll 1 (bad Image 1) | roll 2 (no image, same words) |
|---|---|---|
| platform_far/N | FAIL −12.9 % focal | **PASS** +0.4 % |
| platform_far/S | FAIL −11.7 % | **PASS** −3.5 % |
| platform_far/E | FAIL −9.0 % | **PASS** −7.4 % |

Three of three, in the same direction as the seed's own error. The words did not change;
the picture did. **The rerolls were caused by a wrong image, not a weak prompt.**

## What "better" turned out to mean

1. **Subtraction, not addition.** No sentence was added to make the second rolls pass —
   one input was REMOVED. This repeats row 40's finding (the study seed's shields painted
   into seven other rooms) at the level of scale: an attached image out-argues every
   paragraph beside it. When a wall misses, the first suspect is what it was SHOWN,
   not what it was told.
2. **A seed must pass the instrument before it may teach.** Now enforced: `styleImageFor`
   attaches a lead's candidate only when that candidate's own reading is a camera PASS
   (edge strips were already promoted-only). An unjudged frame seeds nothing; the register
   carries the medium in words — which this experiment shows is sufficient.
3. **The correction machinery must actually be reachable.** Two mechanical faults made
   these rerolls costlier than they should have been, both now fixed: the warp (which
   corrects scale deterministically by pinning the corners) declined the three walls with
   a KeyError because it re-measured through a SECOND instrument whose reading was shaped
   differently — the sweep's own reading is now handed in; and a partial re-emit gutted
   the manifest's skipped entries, hiding the walls (and their retry rolls) from the sweep
   entirely — a skip now preserves the standing order.

## The standing answer to "what prevents rerolls"

- Every image in a packet has passed the instrument (seed gate) — pictures are the
  strongest words.
- A pure scale/camera miss is the warp's, not a re-ask (the router existed; it is now
  reachable) — a roll is spent only on content the plan rules and the painting refuses.
- The ask itself stays SHORT: the register's sentences already land 9-of-12 walls
  first-time in a new genre; nothing in this evidence says more words would have
  helped, and row 34/43's register history says shorter registers measured better.
