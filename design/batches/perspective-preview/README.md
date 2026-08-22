# Perspective preview — what a real lens would do to these two rooms

**This is a preview, not a change.** Nothing in `src/`, in the tests, in the schema or in the plan
was touched to make these frames. The renderer already takes every geometric fact it draws from a
facing's meta — how many pixels a metre of wall is, where the wall meets the floor, where the two
corners fall — so a lens-pinned world is nothing but **different numbers in that meta**. These five
captures fed the shipped render path those numbers and photographed the result. The demo on the
Pages URL is unaffected and still draws exactly what it drew yesterday.

Five captures, the scene canvas element alone at native 1536×1024, cold `file://` load, Chromium,
no chrome — §12.6's capture spec, the same frame every hash test and the flip test read. Grid-mode
placeholder art (V1): nothing here is judged on finish.

The one line of lineage behind the number, from `design/plan-draft/perspective-research.md` §8.2:

| the only measured camera in the genre | architectural photography's stated ceiling | what this study's own north wall requires |
|---|---|---|
| **Presto Studios, 70.6°** (25.4 mm) — their own released source, the Norad Delta room camera, taken from the same models the pre-rendered art was made from | **73.7°** (24 mm) — "never wider than 24 mm on full frame"; one notch wider is where real-estate clients start complaining | **74.2°** — standing at the approved standpoint rule, 0.75 × room depth |

Three numbers, 3.6° apart, arrived at from three unrelated directions. `24 mm` is the middle one.

---

## Pair 1 — the study, looking north

`01a-studyN-shipped.png` · `01b-studyN-24mm.png` · `01c-studyN-25.4mm.png`

**`01a` — what ships today.** The study is 5.45 m wide and you stand 3.60 m back, and the picture
draws that wall **523 pixels across a 1536-pixel frame — 34% of the width**. The other two thirds
are side wall running away from you. The floor takes **37% of the frame height** and starts 1.04 m
in front of your feet. It is a generous, deep, dramatic picture, and the reason it looks like that
is that the implied lens here is **8 mm — a 131° fisheye**. The room is 5.45 × 4.80 m, very nearly
square, and it reads as a tunnel.

**`01b` — the same room on a 24 mm lens (73.7°).** The wall now fills the frame side to side: 1550
pixels of wall across a 1536-pixel frame, so **100% of the frame width is the north wall** and
**99.1% of the wall is in view**. The two corners land 7 pixels *outside* each edge — that close.
Ceiling line at y 150, floor line at y 947: you can see the whole room from its ceiling to its
skirting, which is what "a room reads as a room" was supposed to buy. What it costs is the floor.
**Only 7.6% of the frame is floor**, and the nearest floorboard you can see is **3.08 m away** —
three paces in front of you, against 1.04 m today. The Riven quality the intention names, *"rails
cut by the frame bottom at your own feet"*, is gone from this frame. The desk is also now large
enough to be cut by the right-hand edge of the picture, because it stands near the eastern corner.

**`01c` — Presto's own number, 25.4 mm.** Almost the same picture, slightly tighter: the wall draws
1647 px, so **93.3% of the wall is in view** and the corners sit 56 pixels outside each edge. The
floor drops to **4.8% of the frame** and the nearest floor is 3.27 m away.

**The taste fork this pair was built to show did not divide.** The brief expected `01b`'s corners
just inside the frame and `01c`'s just outside. In the study they are outside on **both**: 7 px at
24 mm, 56 px at 25.4 mm. The reason is arithmetic, not a mistake — the study's north wall *requires*
74.2° and 24 mm supplies 73.7°, so it misses by half a degree and the corners miss by seven pixels.
The honest reading is that **no lens inside the researched band puts both of the study's corners in
frame from the approved standpoint.** 24 mm gets to within a hair of it; 25.4 mm is a visibly
tighter crop of the same idea. If both corners have to be in frame, the lever is where you stand,
not what lens you use — which is the second open question below.

## Pair 2 — the cross passage, looking east (the arrival view)

`02a-hallE-shipped.png` · `02b-hallE-24mm.png`

**`02a` — what ships today.** The passage's 2.60 m end wall, 6.00 m away, draws **250 pixels — 16%
of the frame width**. Six sevenths of what you see is the two side walls converging, and the end
wall with the facing letter on it is a small panel in the middle distance. The floor is 37% of the
frame and starts 1.73 m ahead. The implied lens here is 13.5 mm, a 106° view; **one turn in this
room swings the effective lens by 25° against the study's north view and by 46° against the
passage's own north view.**

**`02b` — the same view on 24 mm.** The end wall grows to **444 pixels, 29% of the frame width**,
both corners comfortably inside it (546 and 990), and the ceiling line comes down from y 376 to
y 287. It reads far more like a corridor you are standing in and far less like a vanishing-point
diagram — the wall you are walking toward is now a destination rather than a postage stamp. The
floor gives up ground but not all of it: **25% of the frame** is still floor, though its near edge
moves out to 3.08 m. **This is the pair where pinning the lens plainly wins**, and it wins for the
same reason it costs in the study: the passage is a long view and 24 mm is *narrower* than what it
draws today, where the study is a short view and 24 mm is *wider*.

---

## The numbers, side by side

| frame | lens | hFOV | px per metre at the wall | wall, % of frame width | wall, % of wall in view | corners | floor, % of frame height | nearest floor in view |
|---|---|---|---|---|---|---|---|---|
| `01a` study/N | 8 mm (f 346 px) | 131.5° | 96 | 34.1% | 100% | 506 / 1030 — **both in** | 37.0% | 1.04 m |
| `01b` study/N | 24 mm (f 1024 px) | 73.7° | 284.4 | 100% | 99.1% | −7 / 1543 — **both just out** | 7.6% | 3.08 m |
| `01c` study/N | 25.4 mm (f 1088 px) | 70.4° | 302.2 | 100% | 93.3% | −56 / 1592 — **both out** | 4.8% | 3.27 m |
| `02a` hall/E | 13.5 mm (f 576 px) | 106.3° | 96 | 16.3% | 100% | 643 / 893 — **both in** | 37.0% | 1.73 m |
| `02b` hall/E | 24 mm (f 1024 px) | 73.7° | 170.7 | 28.9% | 100% | 546 / 990 — **both in** | 25.3% | 3.08 m |

Read the floor column downward and the whole trade is visible in one place: **the shipped floor is
a fisheye artifact.** Every facing shows 37% floor today only because the lens is different on every
facing and all of them are absurdly wide. Under a pinned lens the nearest visible floor is the same
distance on *every* facing in the manor — 3.08 m at 24 mm — which is one number to rule on instead
of fifteen anomalies, and it is further out than it is today on all of them.

Two things that are true of every lens-pinned frame here and are not a defect: the corners of a
*wide* room leave the frame (the study's do), and objects near the wall draw about three times
larger than they do today because a metre of wall is three times as many pixels. Both are what a
real camera does.

---

## The two questions that are yours, not ours

Verbatim from `design/plan-draft/perspective-research.md`.

**One — must a room show both of its corners?** This is the only thing in the whole document pushing
the number past Presto's:

> **Where this criterion could be rejected — stated because it is mine, not the sources'.** If Kabe
> decides a room may read as a room *without* both corners in frame — which is what real vision
> does — then 28 mm or even 35 mm become live, the pictures move toward the natural register, and
> the cost is that most facings show a wall rather than a room. That is a taste call, and it is the
> one genuine fork in this document.

**Two — where you stand is costing more than what lens you use.** This one is on the drawing you
approved, so it is yours to move or leave:

> **Stand further back — the strong lever, and the one coupled to the lens.**
> `standpoint_stand_back` 0.25 is why three facings show no floor at all, *and* why the lens is
> forced to the ceiling. Viewing the study's north wall from **4.30 m** instead of 3.60 m gives,
> at 24 mm, the whole wall *plus both corners plus side wall* and ~12% floor — or lets 28 mm do
> the job instead. **The standpoint rule is costing more room-read than the lens is.** It is on
> the approved drawing, so it is Kabe's.

`01b` is the frame that makes the second question concrete: seven pixels of corner and 7.6% of floor
are both bought back by standing 0.70 m further into the room, without touching the lens at all.

---

## How these were made, and what they are not

The metas were derived by the project's own `tools/plan-projection.mjs` for the shipped frames and,
for the lens frames, by taking that same derived meta and replacing `px_per_m_at_wall` with
`f / camera_wall_m` — then re-deriving `floor_line_y`, the nearest visible floor and the corner
positions with blueprint §5's own equations at the interim eye height of 1.60 m. `horizon_y` was
left alone: it is the lens shift, not a scale, and pinning the lens does not move it. The floor line
in every frame was then re-measured **off the captured pixels** (the median wall/floor luminance
step across every column inside the facing band) and agrees with the arithmetic to within 6 px in
all five — the detector reads a few pixels high by construction, and the residual is constant.

`01c` is labelled 25.4 mm because that is Presto's lens, but a focal length of 1088 px on a
1536-px-wide frame is 25.5 mm and 70.4°, not 70.6° — Presto's exact number is 1084 px. The 0.2°
is below anything visible and nothing here turns on it.

These frames are **direction, not a proposal that has been built**. No row is allocated against
them, nothing in the repository draws this way, and blueprint §5's law still stands: the camera is
settled for good by row 4's approved backdrop.
