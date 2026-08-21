# holo-emitter — per-quality loss criteria

*[AI], row 3. These decompose five qualities that are Kabe's, and they are an agent's reading of
how to judge them — so **Kabe may amend any of them at any time**, and doing so is not a breach of
the freeze below.*

**Frozen at row 3's close, before any backdrop or composite exists.** Blueprint §12.10 requires
these to be written ahead of the art so they cannot be shaped by what the art turns out to be.
**What the freeze forbids is precisely one thing: tuning a criterion to the composites it will
judge.** It does not forbid Kabe correcting it, and it does not forbid fixing an error found by
running it. Any change after this row is a visible, dated, reasoned edit to this file, made outside
a grading pass and never during one.

## What this is for

At Done, §12.10 sets our eight facing composites beside stills from the anchors named in
`design/intention.md` — Myst, Riven, Machinarium. A fresh agent, told nothing about this project,
judges the five decomposed qualities from *What "good" means here*, one at a time, against the
criteria below. Kabe judges "standing somewhere" himself, running the played anchors. A tie closes
a quality. A loss allocates a new spec row that blocks Done.

**Everything below is written to be applied by someone who has never read another line of this
project.** That is not a stylistic choice. The same criterion has to be applied to a Riven frame,
and a rule phrased in this project's vocabulary — entity ids, staged placements, record fields —
can only be applied to one side of the comparison, which would make the whole exercise one-sided.

## How to look

Every one of our frames is captured to §12.6's spec and nothing else: **the scene canvas element at
native 1536×1024, Playwright element screenshot, cold `file://` load, no chrome, no hover.** Anchor
frames are normalized to the same size and format first. A grader working from a downscaled,
windowed or recompressed capture is not running this test — the soft edge tells these criteria hunt
survive only at native scale.

**Honesty note**, §12.10's own: this is *criterion-anchored*, not blind. A grader can usually tell
which frame is ours from era and medium alone. The mitigations are that the A/B labels are
randomized and that the grader is not told which verdict unblocks anything.

**Evidence.** Every mark names the frame it was made in and describes the thing in words a stranger
could use to point at it — "the tall chair to the left of the writing desk", not an id. A quality is
never lost on an unattributed impression.

## Vocabulary, defined from the picture

- **Object** — a discrete thing depicted as standing in, on, or against the space, separable by eye
  from the ground plane and the wall behind it. A chair, a chest, a candlestick, a coin, a door leaf
  hanging in its frame, a handrail running across a rock, a boat on water. **Not** objects: the
  ground plane itself, the walls, the ceiling, the sky, the water, and anything drawn as part of the
  surface it lies on (a painted panel, a rug pattern, a wall sconce painted into the plaster).
  *An earlier draft defined this as "a thing a person could pick up", which is symmetric and wrong:
  run against the Riven anchor it made the population zero, because a rail and a rock spire are not
  portable. The test above is the one the dry run below produced.*
- **Grounded object** — an object whose lowest visible part meets the ground plane, or which rests
  on the top surface of another object.
- **Crossing pair** — **any** two distinct depicted things whose painted areas cross, so that one
  hides part of the other. Deliberately not restricted to objects: the intention's own examples of
  this quality are "column-before-building, ship-hull-behind-waterline", which are architecture and
  landscape.
- **The frame's key** — the direction the dominant light comes from, read off the frame itself:
  which side of a doorway reveal is bright, which way the cast shadows lie, where the window, the
  fire or the sun is.

## The three rules every criterion uses

**The contradiction rule.** Some tells are not a matter of degree. Where a criterion names a
contradiction, **one instance in one frame loses the quality outright**, provided the grader cannot
find an equivalent instance anywhere on the anchor side. These are the tells that read as wrong
rather than as weak, and they are how a document like this stays faithful to a bar that reads
"NOTHING may read as a sticker".

**The rate rule.** Otherwise, compare rates:

```
    rate = marked ÷ population
    ours loses  ⟺  rate_ours − rate_anchor  >  1 ÷ (max(pop_ours, pop_anchor) + 1)
```

*Worked, four ways.*
- Eleven objects of ours, 4 marked; anchor 10 objects, 1 marked.
  `0.364 − 0.100 = 0.264 > 1/12 = 0.083` — **ours loses.**
- Ten of ours, 1 marked; anchor 10, 1 marked. `0.000 > 1/11` is false — **tie.**
- Forty of ours, 5 marked; anchor 10, 1 marked. `0.125 − 0.100 = 0.025 > 1/41 = 0.024` — **ours
  loses.** Being marked at a quarter more than the anchor's rate is a loss however large the set is.
- **One** of ours and it is marked; anchor 1, 0 marked. `1.000 − 0.000 = 1.000 > 1/2 = 0.5` —
  **ours loses.** The `+ 1` in the denominator is there for exactly this: with a bare `1 ÷ max(pop)`
  a population of one could never lose, whatever the grader marked, and any criterion judged over a
  single member — a whole-set population included — would have certified itself green by arithmetic.

It is a comparison of *rates*, deliberately: a build must not become safer by deleting objects,
which is the exact incentive quality 3 needs reversed.

**The empty-anchor rule.** If a quality's population is empty **on the anchor side** — the Riven
still has no crossing pair of *objects* at all, and a landscape frame may have no grounded
furniture — then `rate_anchor` is undefined and that frame cannot judge that quality. The grader
moves to another of the three anchors; §12.10 names three precisely so this is possible. If none of
them has a non-empty population for that quality, the quality is judged **against our own set
alone, by the contradiction rules only** — and the grading record says so, because a quality graded
without an anchor is a weaker verdict and must not be reported as if it had one.

## Populations, and the bare-facing license

§12.6 licenses four facings — study S/W, hall E/S — to be deliberately empty; their flip pairs
assert composite == backdrop exactly. An empty frame has no object to stand on a floor and none to
overlap another, so:

- **A frame with no objects contributes nothing to the one-light, contact, occlusion or one-hand
  populations.** It can neither lose them nor win them.
- **A frame with no objects is fully in the camera-has-feet population**, because that quality is
  carried by the picture and its horizon rather than by anything composited.
- **An empty population is not automatically a pass.** Each criterion states its own empty-set rule
  below; two say "out of scope" and one says "lost".

---

## Quality 1 — One light

> "Every sprite shares the backdrop's key direction and colour temperature (contract `UL45` +
> `key_tint` pull). In the Riven frame, rail, rock, and water share one sun and one haze."

**Population.** Every object in every frame; one mark per object per frame it appears in. The
architecture is the reference, not a member. **Empty set: out of scope.**

**Tells.**
- **T1.1 Direction contradiction.** The object's bright side faces away from the frame's key — the
  wall behind it is lit from the left and its highlights sit on its right — or its own cast shadow
  falls toward the light. *Contradiction.*
- **T1.2 Flat under a directional key.** The frame has a clearly readable key and the object has no
  readable lit and shadowed side at all. *Rate.*
- **T1.3 Temperature break.** The object reads a different colour of light from the surfaces it
  touches: cool where the frame is firelit, or warm where it stands in cold window light. *Rate.*
- **T1.4 Contrast break.** The object's darkest-to-brightest range is visibly harder or flatter than
  everything around it. *Rate.*

**A build that loses this.** Eight frames, eleven objects, rooms lit warmly from a fireplace. Every
object is a studio render dropped in: the chair, the desk and the candlestick each read cooler than
the panelling they stand against (T1.3 ×3) and the key in the drawer has no shadow side (T1.2).
Anchor: 1 of 10. `4/11 − 1/10 = 0.264 > 1/11 = 0.091` — lost. Or a single sprite mirrored for the
far wall so its highlights land on the wrong side — one T1.1 — lost outright.

## Quality 2 — Contact

> "Every grounded object darkens the ground under it. Machinarium pools occlusion at every contact
> point; nothing sits on a floor without it."

**Population.** Every grounded object in every frame. Objects fixed to a wall with space beneath
them and objects visibly in flight are out — darkening under them would be the defect. Anything
shown outside the scene, in a strip or a cursor, is out. **Empty set: out of scope.**

**Tells.**
- **T2.1 No pool.** The object meets the floor with no darkening whatever. *Contradiction* —
  "nothing sits on a floor without it" is stated absolutely and is graded that way.
- **T2.2 Detached pool.** There is darkening, but clear floor separates it from the object's own
  contact line, or it is offset to one side. *Rate.*
- **T2.3 Wrong span.** The darkening is plainly wider or narrower than where the object meets the
  floor: a disc shadowed across its whole width, a four-legged thing shadowed under one leg, a
  swung-open door leaf shadowed at the width of the closed one. *Rate.*
- **T2.4 Shadow toward the light.** The pool leans toward the side the key comes from. *Rate.*
- **T2.5 Pool without contact.** Darkening under something that is not standing on that surface.
  *Rate.*

**A build that loses this.** Six grounded objects. The desk's four feet are shadowed under the
nearest foot only, a pool a tenth of the width of its stance (T2.3); the chair's pool sits a hand's
breadth behind its back legs (T2.2); the coin on the shelf has none at all (T2.1) — lost outright on
the coin.

## Quality 3 — Occlusion chains

> "Objects overlap objects, not just the backdrop (draw order by baseline). Myst's frame sells depth
> with column-before-building, ship-hull-behind-waterline — not with scale."

**Population.** Every **crossing pair**, counted **across the whole set of eight frames** rather
than per frame — depth built by overlap is a property of a set of views, and one frame may honestly
contain none. The grader is handed our eight frames as a labelled group for this quality and this
one only; every other population is counted inside a single frame.

**A frame with no objects contributes no pairs and is never marked.** That is the bare-facing
license operating exactly as §12.6 intends: a licensed-empty facing cannot lose this quality, and
cannot lose contact either. No facing ever auto-loses anything.

**An empty population over the whole set is a LOSS, not a tie.** If no two things cross anywhere in
all eight frames, the quality has been avoided rather than achieved. This is a statement about the
set and never about a facing, which is what keeps it consistent with the license above.

**Tells.**
- **T3.1 Wrong order.** The nearer object is hidden by the farther one — a chair standing in front
  of a desk with its back cut away by the desk. *Contradiction.*
- **T3.2 Seam at the crossing.** The overlap edge shows a rim, a halo, or a hard step where one
  object crosses the other, rather than one shape simply covering another. *Rate.*
- **T3.3 Depth by size alone.** Objects are scaled for distance but arranged so nothing ever crosses
  anything, in every frame holding more than one object. *Rate, per frame with two or more objects.*

**A build that loses this.** The walking stick leaning on the bookcase is drawn over the shelf it
should be behind (T3.1) — lost outright. Or: every object placed with a careful gap around it so
nothing ever crosses; population zero — lost by the empty-set rule.

## Quality 4 — One hand

> "Sprites and backdrops share palette, grain, and rendering style; interactables are distinguished
> by position and behaviour, never by looking pasted (Machinarium's whole craft)."

**Population.** Every frame containing at least one object, judged as a whole picture — this asks
whether the frame reads as one image, which is not a per-object question. **Empty set: out of
scope.**

**Tells.**
- **T4.1 The three-second point.** Given the frame for three seconds and asked "which parts of this
  were added on top?", the grader points, is right, and names what gave it away. This is the flip
  test's own bar. *Contradiction*, provided the grader cannot do the same on the anchor frame.
- **T4.2 Grain mismatch.** The objects carry a different surface texture from the walls — a
  different brush or noise scale, a different amount of detail per inch. *Rate.*
- **T4.3 Palette mismatch.** An object's colours fall outside the range the rest of the frame uses.
  *Rate.*
- **T4.4 Visible rim.** A light or dark line follows an object's outline, separating it from what is
  behind it. *Rate.*
- **T4.5 Resolution break.** An object is visibly softer or blockier than the wall behind it, as if
  scaled from a different size. *Rate.*

**A build that loses this.** In the study's north view the grader says within three seconds: "the
desk and the chair — they have a pale outline the panelling does not" (T4.1 with T4.4). Lost
outright, unless the same trick works on the anchor frame.

## Quality 5 — The camera has feet

> "Consistent eye height (contract §10 — 6 ft, pitched slightly down, per Kabe's 2026-08-20 ruling)
> and facing geometry, so the viewer infers a body position — Riven's rails are cut by the frame
> bottom at your own feet; Kabe's reference anchors the same way through a near desk surface."

**Population.** **Every frame**, empty ones included: this quality is carried by the picture and its
horizon rather than by anything composited. Frames differing only in an object's state (a drawer
open rather than closed) are not judged separately; they share their view's camera. **Empty set:
cannot occur.**

**Tells.**
- **T5.1 No near ground.** Nothing is cut by the bottom edge of the frame; the floor stops short of
  it and the picture reads as a view *of* a room rather than a view *from inside* one.
  *Contradiction.*
- **T5.2 The horizon moves.** Two views of the same room read at visibly different eye heights.
  *Contradiction.*
- **T5.3 Scale disagreement.** A thing of familiar size reads doll-sized or giant against the wall
  it stands at, or reads at two different sizes in two views of one room. *Rate.*
- **T5.4 Wrong height.** The picture reads as taken from well above or below standing height —
  looking down onto the tops of things, or up at their undersides. *Rate.*

**A build that loses this.** The floor meets the bottom edge in six frames, and in the hall's east
view it ends a hand's breadth above it with a strip of nothing beneath (T5.1) — lost outright. Or
the study's four views put the horizon at three different heights (T5.2) — lost outright.

---

## The freeze's evidence: a dry run, before freezing

A criterion set that has never been executed cannot be known to discriminate, and the first time it
runs must not be the pass where it may no longer change. So it was run once, on 2026-08-21, before
this file was frozen, against three frames — two of them from the anchor routes the intention names,
opened for this purpose and not committed (this repository is public and those frames are not ours).

- **Riven** — `upload.wikimedia.org/wikipedia/en/0/00/Riven-prison.png`, 400×258. The prison island:
  a handrail bridge running from the frame bottom across water to a rock spire with a structure on
  it.
- **Machinarium** — `upload.wikimedia.org/wikipedia/en/d/db/Machinarium-ss.png`, 397×251. A dense
  courtyard of pipes, towers and small figures.
- **Ours** — the study's north view as the demo renders it today, captured to the §12.6 spec
  (1536×1024, cold `file://`, no chrome). **V-stage V1**: procedural placeholder sprites on the
  holodeck grid, which §12.10 never grades.

| | Riven | Machinarium | ours (V1) |
|---|---|---|---|
| objects | 3 — the rail, the spire structure, the far stack | ~9 — the two figures, the well, the bench, lamps, the barrel | 3 — desk, chair, notebook |
| Q1 marked | 0 | 0 | **3** — T1.3 on all three: warm brown objects on a cold blue-grey ground |
| Q2 grounded / marked | 2 / 0 | 6 / 0 | 3 / **2** — the chair's pool sits below and right of its feet (T2.2); no darkening is visible under the desk (T2.1) |
| Q3 crossing pairs / marked | many / 0 | many / 0 | 1 (chair × desk) / 0 — the chair correctly covers the desk |
| Q4 marked (per frame) | 0 | 0 | **1** — T4.1 succeeds instantly: flat shapes on a wireframe grid |
| Q5 marked | 0 — the rail is cut by the frame bottom at your feet | 0 | 0 — the grid floor runs to the bottom edge, horizon at standing height |

**Three things the dry run changed before the freeze, which is what it was for.**

1. **The object definition was wrong.** It read "a thing a person could pick up or carry out without
   tools" — symmetric, and it made Riven's population **zero**, because a handrail and a rock spire
   are not portable. A quality cannot be compared against an anchor it cannot be counted on. The
   definition above is the corrected one.
2. **Occlusion's population had to widen past objects.** Under the portable test, Riven and
   Machinarium both had zero *object* pairs while being full of crossing masses — and the
   intention's own examples for this quality are "column-before-building,
   ship-hull-behind-waterline", which are architecture. Hence **crossing pair**: any two distinct
   depicted things.
3. **An empty anchor population needed a rule.** Even corrected, a landscape frame can have no
   grounded furniture, leaving `rate_anchor` undefined. Hence the empty-anchor rule above.

**What the dry run establishes.** Every criterion returned a different verdict across the three
frames; three produced marks with named tells on a real artifact rather than an impression; and two
(Q3, Q5) marked nothing on any of the three, so the set is not simply firing on everything. It
discriminates, and it is losable.

**What it does not establish, said plainly.** The anchor stills are 400×258 — a sixth of the §12.6
capture spec's linear resolution. At that size the coarse tells are legible (T1.1, T2.1, T3.1,
T5.1) and the fine ones are **not**: T4.2 grain, T4.4 a visible rim, T4.5 a resolution break cannot
honestly be judged there. The row-6 pass must normalize all frames to a common size *and* record
which tells that size can carry; if the only obtainable anchor still is small, the fine tells are
judged on our side against the contradiction rules alone and the grading record says so. And ours
is a V1 placeholder frame: **marks against it are expected and are not evidence against a
criterion** — a warm object on a cold grid is exactly what V1 looks like, and no criterion was
softened because V1 failed it.

## What this document does not decide

Kabe's "I want a person to feel like they are standing somewhere, not looking at a diagram" is not
decomposed here and is not graded by an agent. It is his sentence and his verdict, run against the
played anchors, per §12.10. Nothing here substitutes for it, and a build that ties every quality
above can still fail his.
