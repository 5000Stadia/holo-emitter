# Row 11 — direction package: the room has corners

**ANSWERED, 2026-08-21.** Kabe: *"Sounds good on the outline"* — the package is blessed, with the
Navigator's recommendation taken on each of the specific pairs. Every question below carries its
disposition; the rulings themselves live where they govern (blueprint §§4b/5, `design/architecture.md`),
not here. **This directory is now the record of the frames the verdict was given against**, kept for
that reason rather than as a reference set: what ships combines three answers no single frame here
shows (the 1.60 m eye of `04b`, the ceiling of `05b`, the desk of `08a`), so no image in it is a
picture of the current build. It graduates nothing to `design/references/`, whose entries are
pictures of what exists.

**This was visual DIRECTION, not verification.** `design/playbook.md` §3.4 [HUMAN, 2026-08-20]:
*"better to get my ok on the visual directions as they form then after the fact"* — and its list of
direction-setting artifacts names **edge/corner treatment** explicitly. Blueprint §5 says the same
for the painted half: *"how much return looks best is settled by Kabe's eye in the probe loop, then
written into the prompt sheets and the measured `corner_x*_px` fields."* Row 11 was that treatment
for the grid, so it came before the lock rather than after.

Fourteen captures, the scene canvas element alone at native 1536×1024, cold `file://` load,
Chromium, no chrome — §12.6's capture spec, the same frame every hash test and the flip test read.
Grid-mode placeholder art (V1): nothing here is judged on finish. **Six questions**, each a pair or
a single glance.

---

**The bounded room and its corners are approved as shipped**, which is what the three frames below
were asked about.

## What changed, in one sentence

The endless 16 m wall is gone. Every facing now takes its geometry from the manor plan you
approved: how wide the wall in view is, how far you stand from it, and therefore where the two
corners fall and how the side walls run back toward you.

| | `01` study/N | `02` hall/W | `03` hall/N |
|---|---|---|---|
| | a 5.45 m wall at 3.60 m | the cross passage, 2.60 m end wall at 6.00 m | the 8.00 m wall at 1.95 m |

`02` is worth a second look for two reasons: the cross passage's two ends are typed **corridor** on
your drawing, so M0 ships corridor as well as enclosed — it cost nothing, because a corridor is the
same drawing with the plan's own numbers in it. And the facing letter sits **above the doorway**
there: a 1.0 m door in the middle of a 2.60 m wall leaves no room beside it.

`03` is the candlestick, re-composed. The passage's real 1.95 m standpoint makes perspective much
stronger than the 3.5 m the demo used to assume, and the candlestick dropped almost clear of the
bookcase — the authored overlap fell to 48 crossing pixels against a floor of 50. It moved 0.25 m
nearer the wall (0.75 → 0.50 m) under §4's standing licence and measures 332. **The picture is the
check**: does it read as a candlestick standing in front of a bookcase, or as one parked against it?

---

## Question 1 — how high is the camera? `04a` vs `04b`

**ANSWERED: `04b`. Eye 1.60 m ships as the interim.** §10's ruled 1.83 m returns with row 4's
measured camera, which can honour the −8° pitch half of the same ruling; the height without the
pitch degrades the floor cut it was given to improve. §5's camera-has-feet gate is asserted at
1.60 m, so it holds on the pixels that are actually drawn. Recorded in blueprint §5 and §7's
grid-canonical amendment.

You ruled six feet on 2026-08-20: *"we should be a bit higher as a view angle looking down at about
a 6ft height. For better visual presentation."* The contract carries both halves of that — eye
1.83 m **and** a −8° downward pitch. Nothing in this project models pitch, and adding one moves
every pixel in it with no measured camera to aim at, so row 11 took the height alone.

Taking the height without the tilt pushes the floor's near edge **further away**, which is the
opposite of what the ruling was for. Both frames are `hall/E`, the deepest view in the demo:

- **`04a` — eye 1.83 m (what ships today).** The floor starts **1.98 m** in front of you.
- **`04b` — eye 1.60 m (what it replaced).** The floor starts **1.73 m** in front of you.

Across all eight facings the height alone moves the near floor edge out on six and in on two:
study N/S 1.01 → 1.19 m, study E/W 1.01 → 1.35 m, hall E/W 1.01 → **1.98 m**, hall N/S 1.01 →
**0.64 m**.

**Whichever you prefer ships as the interim**; row 4's approved backdrop measures the real camera
and supersedes both. Nothing about this is settled by us.

---

## Question 2 — does the room have a ceiling? `05a` vs `05b`

**ANSWERED: `05b`. Yes — 2.8 m, and every enclosed and corridor facing draws its ceiling.**
`plan.floors[].storey_height_m` carries it on both floors, under §4's standing licence (a value we
may change, not a measurement). It is un-drawn content for the approval stamp — a plan view draws no
vertical dimension — so the drawn digest is byte-identical to the plan Kabe signed and the second
digest reports the change on the sheet's own face. An open space carries no storey height.

The plan carries no room height, so the corners currently run off the top of the frame. At the
demo's scale the frame holds **6.95 m of wall above the floor**, against a c.1660 storey of roughly
2.6–3.0 m — so the room is bounded left and right and open upward.

- **`05a` — as it ships.** Two corners, no top.
- **`05b` — with a room height of 2.8 m** (a period-plausible placeholder, nothing more): floor,
  four walls, ceiling.

If you want `05b`, 2.8 m goes into the plan as a value we can change any time, and the sheets are
unaffected — a room height is not something the drawing draws.

---

## Question 3 — the corner does not move with the distance. `06a` vs `06b`

**ANSWERED with 4 and 5 below: the fixed scale stands for the grid era.** The corner is a fact
about the wall rather than about where you stand, and the model is settled for good by row 4's
approved backdrop — which is blueprint §5's law already, so no agent picks it. Recorded in
blueprint §5 and `design/architecture.md`.

You wrote: *"the horizontal corner of the room needs to be determined in location based on the
distance expected between the player and that wall."* Under the scale this demo has always drawn
with, that is **not what happens**: the corner's position depends on how wide the wall is and not
on how far away you stand. `06a` and `06b` are the same wall at 3.60 m and at 1.80 m — the corners
are in the identical place; what changes is how steeply the side walls run and how the floor
foreshortens.

The alternative is a fixed lens instead of a fixed scale, which is what a real camera does and what
your sentence describes. Its cost, computed: at the contract's 50 mm the study's 5.45 m wall would
draw 3230 px across a 1536 px frame — **neither corner in view**. Wide rooms would show no corners
at all.

So: keep today's model and accept that the corner is a fact about the wall, not about where you
stand? Or pin the lens and accept that only narrow rooms show their corners? This is the same
open question as *how wide a view is this* — at today's scale the study is a ~131° view against
the contract's ~40° — and row 4's approved backdrop is where the real camera comes from either way.

---

## Question 4 — turning changes the shape of the view. `07a` vs `07b`

**ANSWERED with 3: the fixed scale stands; row 4's approved backdrop settles the camera.**

Both frames are the **same standpoint** in the cross passage. The viewer has not moved a step; they
have turned once.

- **`07a` — looking north.** An 8.00 m wall 1.95 m away. Effective view: **152°**. The floor starts
  0.64 m in front of you.
- **`07b` — looking east.** A 2.60 m wall 6.00 m away. Effective view: **106°**. The floor starts
  1.98 m in front of you.

One turn swings the lens by 46° and the near edge of the floor by 1.34 m. This is the same cause as
question 3 — the scale is fixed and the distance is not — seen from inside one room instead of
across two. It is why the two frames feel like different rooms.

## Question 5 — a near-square room reads as a tunnel

**ANSWERED with 3: the fixed scale stands; row 4's approved backdrop settles the camera.**

Look at `01` again. The study is **5.45 × 4.80 m** — very nearly square. Its far wall is a third of
the frame and the two side walls are the other two thirds. The arithmetic is exactly right; what it
produces is a view wide enough that a square room reads long. Same cause again.

**Questions 3, 4 and 5 are one question**, and it is the one row 4's approved backdrop answers for good.
Whatever you say sets the interim look.

## Question 6 — where should the desk stand? `08a` (what ships now) vs `08b`

**ANSWERED: `08a` — the north wall, east of the hearth, chair moved with it.** Confirmed as the
shipped position rather than an interim; the footprints' notes in `plan.json` and
`design/architecture.md` say so, and nothing is pending on this any more.

The study's chimney breast occupies the middle 2.2 m of the north wall, and the desk was standing
**inside** it — 0.65 m² of a 0.715 m² footprint, so 91% of the desk was in the masonry, on the wall
the demo opens on and the one the drawer, the key and the chair all belong to. You could not see it,
because the grid paints no hearth; you would have seen it the day row 4's backdrop painted one.

A plan that puts furniture inside its own building contradicts itself, so rather than wait, **`08a`
is what ships today, as an interim**: the desk moved east along the north wall, clear of the hearth
(plan x 28.9–30.2), with the chair moved to keep the pair. **Your answer replaces it**, and the
alternative is rendered so the choice is a glance:

- **`08a` — the north wall, east of the hearth.** What every other frame in both batches shows.
- **`08b` — the west wall**, desk and chair together. `08c` is what the room you first see becomes
  if they leave the north wall: bare.

If neither is right, say where and it is a footprint in the plan and a line of staging.

One thing the frames taught us that a description would have hidden: moving the desk without moving
the chair breaks their overlap. They draw at different distances from you, so keeping the same gap
in metres opens the gap on screen from 50 pixels to 118, and the chair stops crossing the desk. The
pair moves together or not at all.

---

## Three things we are reporting rather than fixing

1. **The desk was standing in the study's chimney breast** — see question 6. Fixed, and confirmed
   by your answer; the plan now refuses any furniture placed inside the
   building rather than reporting it as a note nobody had to read.
2. **The furniture's positions were never authored in metres.** The desk, chair, bookcase and
   candlestick were placed on screen first and converted to plan positions afterwards, against the
   old 16 m wall. Their metre positions are legal and unremarkable but nobody chose them as metres;
   re-composing the two rooms properly is your call and row 4's work.
3. **A doorway on a side wall is drawn as blank wall.** Standing in the study looking south you
   would see the hall door in the left-hand wall, and the grid shows plain wall there (also a
   thumb's width of it on the passage's north and south views). Nothing you can walk through is
   lost — the door still works from the facing it is on — and it is far less wrong than the old
   picture, which had no side walls at all. Row 15 is where an object appears on every facing that
   contains it.
