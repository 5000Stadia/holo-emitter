# holo-emitter — per-quality loss criteria

**Frozen at row 3's close, before any backdrop or composite exists.** Blueprint §12.10 requires
these to be written ahead of the art so they cannot be shaped by what the art turns out to be.
Changing a criterion after a composite exists is a visible, dated, reasoned edit to this file, made
outside a grading pass and never during one.

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

- **Object** — a thing in the space that a person could pick up or carry out of the room without
  tools. A chair, a chest, a candlestick, a book, a coin are objects. **Architecture** is everything
  else: walls, floor, ceiling, a fireplace, a window, a door leaf hanging in its frame, a
  built-in shelf. The test is applied identically to both sides, so our door leaf and a Myst door
  are both architecture even though ours happens to be drawn as a sprite.
- **Grounded object** — an object whose lowest visible part meets the floor, or which rests on the
  top surface of another object.
- **Overlapping pair** — two objects whose painted areas cross, so one hides part of the other. Two
  objects standing near each other, or whose bounding rectangles touch while no paint crosses, are
  not a pair.
- **The frame's key** — the direction the dominant light comes from, read off the architecture:
  which side of a doorway reveal is bright, which way the cast shadows lie, where the window or the
  fire is.

## The two rules every criterion uses

**The contradiction rule.** Some tells are not a matter of degree. Where a criterion names a
contradiction, **one instance in one frame loses the quality outright**, provided the grader cannot
find an equivalent instance anywhere on the anchor side. These are the tells that read as wrong
rather than as weak, and they are how a document like this stays faithful to a bar that reads
"NOTHING may read as a sticker".

**The rate rule.** Otherwise, compare rates, with a tie band of one member of the larger population:

```
    rate = marked ÷ population
    ours loses  ⟺  rate_ours − rate_anchor  >  1 ÷ max(pop_ours, pop_anchor)
```

*Worked, three ways.*
- One object in our frame, and it is marked; the anchor has 10 objects and 1 marked.
  `1.000 − 0.100 = 0.900 > 1/10 = 0.100` — **ours loses.** A small population cannot hide a sticker.
- Forty objects of ours, 6 marked; anchor 10 objects, 1 marked.
  `0.150 − 0.100 = 0.050 > 1/40 = 0.025` — **ours loses.**
- Same, 5 marked. `0.125 − 0.100 = 0.025`, not greater than `0.025` — **tie.**

It is a comparison of *rates*, deliberately: a build must not become safer by deleting objects,
which is the exact incentive quality 3 needs reversed.

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

**Population.** Every overlapping pair, counted **across the whole set of frames** rather than per
frame — depth built by overlap is a property of a set of views, and one frame may honestly contain
none.

**Empty set: LOST.** If no two objects overlap anywhere in the set, the quality is not met: it has
been avoided, not achieved. This is the one place where a licensed-empty frame must not be allowed
to launder an absence into a tie.

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
this file was frozen, against two frames:

- **Not ours:** `design/references/style-seed-warm.png` — a real c.1660 interior with objects in it,
  and the image the sprite corpus was generated against. It stands in for the anchor side. This seat
  cannot open the commercial anchors (the intention routes them through public stills and Kabe's own
  play), so this dry run proves the criteria *discriminate*; it does not stand in for the §12.10
  grading pass, and the anchor side of that pass is still Myst, Riven and Machinarium.
- **Ours:** the study's north view as the demo renders it today — V1 placeholder sprites on the
  holodeck grid, captured to the §12.6 spec.

| | style seed (not ours) | ours, study/N today |
|---|---|---|
| objects | ~12 (chair, chest, jug, lamp, candlesticks, books, notebook, inkwell, fire irons) | 3 (desk, chair, notebook) |
| Q1 marked | 0 — everything sits in one firelit key | **3** — T1.3 on all three: warm brown objects against a cold blue-grey ground |
| Q2 marked | 0 — the chair, the chest and the books all darken what they stand on | **2** — the chair's pool is detached, sitting below and right of its feet (T2.2); no darkening is visible under the desk at all (T2.1) |
| Q3 pairs / marked | many pairs, 0 marked | 1 pair (chair × desk), 0 marked — the chair correctly covers the desk |
| Q4 marked | 0 | **1 frame** — T4.1 succeeds instantly: flat shapes on a wireframe grid |
| Q5 marked | 0 — the near table surface is cut by the frame bottom | 0 — the grid floor runs to the bottom edge and the horizon reads at standing height |

**What the dry run establishes.** Every criterion produced a different verdict on the two frames,
and three of them produced *marks with named tells* on a real artifact rather than an impression —
so the set discriminates and is losable, which is what freezing it required. It also shows the
criteria are not vacuous in the other direction: Q3 and Q5 marked nothing on our own placeholder
frame, so they are not simply firing on everything V1.

**What it does not establish.** Ours is a V1 placeholder frame on the holodeck grid, which §12.10
never grades; a warm object on a cold grid is exactly what V1 is supposed to look like. None of
these marks is a verdict on the product. Two are worth carrying forward as observations and are in
the row's closing report rather than here, because this file is criteria and not findings.

---

## What this document does not decide

Kabe's "I want a person to feel like they are standing somewhere, not looking at a diagram" is not
decomposed here and is not graded by an agent. It is his sentence and his verdict, run against the
played anchors, per §12.10. Nothing here substitutes for it, and a build that ties every quality
above can still fail his.
