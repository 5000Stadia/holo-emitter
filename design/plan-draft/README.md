# Row 12 — the manor plan, drawn for redline

**This is a drawing, not a row.** Nothing derives from it until Kabe has OK'd it
(blueprint §4b: *"The plan drawing itself is visual direction: it goes to Kabe as an image for
OK before anything derives from it."*). No `plan.json`, no projection code, no meta field is
written from these numbers yet.

| file | what it is |
|---|---|
| `manor-ground.png` / `.svg` | artboard 1 — ground floor **and grounds** |
| `manor-upper.png` / `.svg` | artboard 2 — upper floor, same footprint and scale |
| `standpoints.tsv` | the standpoint table, machine-readable |
| `draw_plan.py` | the drawing's source. Every metre is a literal here; the SVG is a projection of it |
| `render.sh` | SVG → PNG at 2× through headless Chrome |

Redline the PNGs. To take a redline in: edit the metre literals at the top of `draw_plan.py`,
`python3 draw_plan.py`, `./render.sh`. The script refuses to finish if rooms overlap, if rooms
and partitions do not tile the interior gross area exactly, or if any room is unreachable on
foot from the entrance approach — so a redline cannot silently break the plan.

---

## The house

c.1660 English **hall-and-cross-wings (H-plan)**: a central hall range running E–W, two
cross-wings running N–S, the recess on the south forming the entrance court and the recess on
the north forming the privy garden. Overall footprint 39.60 × 25.50 m. Exterior and structural
walls 0.60 m; interior partitions 0.35 m; the privy garden wall 0.45 m.

The **high end** of the house is west (dining parlour, great stair, library), the **low /
service end** is east (cross passage, kitchen, buttery, servants' hall) — which is where the M0
study and its "hall" sit.

### Ground floor and grounds

| room | type | clear size (m) | note |
|---|---|---|---|
| GREAT HALL | enclosed | 14.60 × 9.30 | front door on the court, garden door on the north, fireplace on the north wall |
| STUDY | enclosed | 5.45 × 4.80 | **the existing M0 room.** Fireplace N, door E, leaded windows S onto the court, blank paneling W |
| CROSS PASSAGE | corridor | 8.00 × 2.60 | **the existing M0 "hall".** Study door at the W end, leaded window at the E end, shelf/paneling N, tapestry S |
| KITCHEN | enclosed | 8.00 × 8.65 | great fireplace on the south wall; own door to the court |
| BUTTERY & PANTRY | enclosed | 8.00 × 4.95 | off the passage's north side |
| SERVANTS' HALL | enclosed | 8.00 × 7.05 | door to the privy garden |
| BACK STAIR | corridor | 5.45 × 4.15 | straight flight, **up travels east** |
| DINING PARLOUR | enclosed | 8.80 × 7.60 | own door to the court |
| GREAT STAIR HALL | corridor | 8.80 × 5.65 | straight flight against the west wall, **up travels north** |
| LIBRARY | enclosed | 8.80 × 6.45 | |
| GARDEN ROOM | enclosed | 8.80 × 3.55 | covered way out to the privy garden |
| ENTRANCE COURT | open | 20.40 × 9.00 | three sides are real manor exterior wall; the fourth (south) is open |
| PRIVY GARDEN | open | 20.40 × 5.55 | three sides manor exterior wall, one built garden wall |
| ENTRANCE APPROACH | open | 32.00 × 20.00 | no enclosure at all except the house front it runs up to |

### Upper floor

| room | type | clear size (m) | note |
|---|---|---|---|
| SOLAR (GREAT CHAMBER) | enclosed | 14.60 × 9.30 | over the great hall, sharing its stack |
| LONG GALLERY | corridor | 8.00 × 24.30 | the whole east wing, windows both sides |
| MASTER BEDCHAMBER | enclosed | 8.80 × 7.60 | |
| GUEST CHAMBER | enclosed | 8.80 × 6.45 | |
| MUNIMENT ROOM | enclosed | 5.45 × 4.80 | over the study, sharing its stack |
| STAIR LANDING | corridor | 8.80 × 5.65 | great stair head; **down travels south** |
| BACK STAIR HEAD | corridor | 5.45 × 4.15 | **down travels west** |
| CLOSET CHAMBER | enclosed | 8.80 × 3.55 | |

Every fireplace on the upper floor stands on the one below it — the stacks are continuous.

---

## Deviations from the Navigator's proposed roster

Blueprint §4b proposed: *ground* great hall, study, library, dining parlour, kitchen, screens
passage; *upper* long gallery, master bedchamber, guest chamber, solar; *grounds* central
courtyard, walled garden, entrance approach. Here is what changed and why.

**D1 — "central courtyard" is drawn as the H-plan's south entrance court, open to the south.**
A true central courtyard means a quadrangle, which needs a fourth range the roster has no rooms
for. The H's south recess is the period-honest courtyard of this house type, and it satisfies
law (b) exactly: its north, east and west walls *are* the manor's exterior walls, and nothing
closes it on the south.

**D2 — "walled garden" is drawn as a privy garden in the H's north recess, closed by ONE built
garden wall.** Three of its four sides are actual manor exterior wall. The fourth is a 0.45 m
masonry garden wall drawn as a real built structure (poché, thickness, heavy stroke, its own
legend entry). **This needs Kabe's word**, because §4b's law (b) says *"The building's one
exterior outline is the single source of every outdoor wall"*, and a garden wall is a second
built outline. The drawing takes the reading that law (b) forbids *invented* enclosure, not
*built* structure. If Kabe rules the other way, delete the wall: the garden becomes lawn and its
N facing turns from `enclosed 4.16` into `open` with a far-line distance.
The garden has no gate — it is reached only from inside the house (garden room, great hall,
servants' hall), which is what "privy" means.

**D3 — the screens passage is sited as the service cross passage in the east wing, not across
the low end of the great hall.** This is forced, and it is the one place where period form
yielded to the existing artifact. §11's hall wall map is *W: door to the study · E: leaded
window at the far end · N: paneled wall with the shelf · S: tapestry*, and §11's study map is
*N: fireplace · E: door · S: leaded windows · W: blank paneling*. Together those demand a
corridor running **E–W** with a solid exterior end wall on the east, the study on its west, and
the study's own south wall exterior for its windows. A classic N–S screens passage across the
hall's low end cannot give all three. So the great hall keeps its front door and a doorway to
the back stair, and the M0 corridor is the house's service cross passage. Both existing wall
maps are true as drawn.

**D4 — the cross passage gains two openings §11's wall map does not draw.** A corridor that
serves only the study is what M0 has; the manor needs it to be a thoroughfare, so it takes a
door **south to the kitchen** and a door **north to the buttery**. §11 gives those two facings a
tapestry and a paneled wall with the shelf. **Kabe's call, and it is live before row 4's prompt
sheets**: either hall/N and hall/S are prompted with a door opening in them, or the manor's
extra exits wait for a later row and the two doors here are drawn but not built at row 15. The
shelf sits at `u = 0.30`; the drawn buttery door is at the far end of the same wall, so they do
not fight.

**D5 — rooms added that the roster does not name.** Every one is either required or period-
standard, and the wings have to be filled with something honest:
*GREAT STAIR HALL* and *BACK STAIR* (+ their heads upstairs) — the roster asks for "stairs
connecting, placed honestly" and stairs need rooms; *BUTTERY & PANTRY* and *SERVANTS' HALL* —
the service end of a c.1660 manor, and they give the cross passage somewhere to go;
*GARDEN ROOM* — the west wing's north end, and covered access to the privy garden;
*MUNIMENT ROOM* and *CLOSET CHAMBER* — the upper floor over the study and over the garden room.

**D6 — the great hall is ceiled, with the solar over it.** An open-to-the-roof hall would leave
nothing above it and the roster's solar homeless. Ceiling the hall and putting the great chamber
over it is correct for 1660 and is what makes the two floors line up.

**D7 — "solar" is drawn as the great chamber over the hall** and labelled *SOLAR (GREAT
CHAMBER)*. At 14.60 × 9.30 it is far larger than a medieval solar; that is what a great chamber
over a great hall is.

**D8 — the long gallery is 24.30 × 8.00, a 3:1 room.** Real galleries run 6–7 m wide and 40–50 m
long. This one is as long as the wing can be and as narrow as the kitchen below it allows. If
the gallery's proportion matters more than the kitchen's, the east wing narrows and the kitchen
loses width.

**D9 — the study is 5.45 × 4.80 m, not §5's example `wall_width_m: 4.2`.** §5's block is Kabe's
illustration of the schema, to be measured per backdrop at row 4; from row 12 on the plan is
where those numbers come from. The study's N and S walls are 5.45 m; its E and W walls 4.80 m.
Both sit inside the 4.5–5.5 m the study's existing readings want.

---

## Law (a) — the standpoints

Every facing on both artboards carries a standpoint marker (a circle), a dashed leader running
to the wall line that facing views, and the measured distance printed beside it. **That printed
number is `camera_wall_m`.** Nothing downstream may invent one; it is read off this drawing, and
corner positions derive from it.

The rule the drawing uses, stated once so a redline can change it in one place
(`K = 0.25` in `draw_plan.py`): *the standpoint for a facing stands on the room's own axis,
displaced from the room centre away from the viewed wall by 25% of the room's dimension along
that axis.* So `camera_wall_m = 0.75 × (room dimension normal to that wall)`, and
`wall_width_m` is the full width of the wall in view. Nobody stands closer than a quarter of the
room's depth to the wall behind them.

Two things this makes visible that were not visible before:

- **The study lands at 3.60 / 4.09 m** — close to the grid-canonical `camera_wall_m` of 3.5
  (blueprint §7), so the existing room needs no camera surprise.
- **Five spaces have facings wider than the frame can hold.** §7 pins grid canonical at
  96 px/m on a 1536 px canvas, which is exactly **16.0 m of wall in frame**. The entrance court
  and privy garden (20.40 m), the long gallery's long views (24.30 m) and the entrance approach
  (32.00 m, against a 39.60 m house front) all exceed it. Those facings cannot show their whole
  wall at the pinned scale — either they get their own camera, or their `wall_width_m` is
  clipped to what is actually in frame and the staging u-domain clips with it. This is §5's open
  field-of-view question arriving with numbers attached, and it wants an answer before the bake.

### The table

`camera_wall_m` in bold is the number the bake reads. Facing type is per facing, and can differ
from the room's type — the privy garden is an *open* room whose four facings are all *enclosed*,
because every one of them really does have a built wall across it.

| floor | room | room type | facing | facing type | camera_wall_m | wall_width_m | wall line viewed |
|---|---|---|---|---|---|---|---|
| ground | GREAT HALL | enclosed | N | enclosed | **6.97** | 14.60 |  |
| ground | GREAT HALL | enclosed | E | enclosed | **10.95** | 9.30 |  |
| ground | GREAT HALL | enclosed | S | enclosed | **6.97** | 14.60 |  |
| ground | GREAT HALL | enclosed | W | enclosed | **10.95** | 9.30 |  |
| ground | STUDY | enclosed | N | enclosed | **3.60** | 5.45 |  |
| ground | STUDY | enclosed | E | enclosed | **4.09** | 4.80 |  |
| ground | STUDY | enclosed | S | enclosed | **3.60** | 5.45 |  |
| ground | STUDY | enclosed | W | enclosed | **4.09** | 4.80 |  |
| ground | BACK STAIR | corridor | N | enclosed | **3.11** | 5.45 |  |
| ground | BACK STAIR | corridor | E | enclosed | **4.09** | 4.15 |  |
| ground | BACK STAIR | corridor | S | enclosed | **3.11** | 5.45 |  |
| ground | BACK STAIR | corridor | W | enclosed | **4.09** | 4.15 |  |
| ground | CROSS PASSAGE | corridor | N | enclosed | **1.95** | 8.00 |  |
| ground | CROSS PASSAGE | corridor | E | corridor | **6.00** | 2.60 |  |
| ground | CROSS PASSAGE | corridor | S | enclosed | **1.95** | 8.00 |  |
| ground | CROSS PASSAGE | corridor | W | corridor | **6.00** | 2.60 |  |
| ground | KITCHEN | enclosed | N | enclosed | **6.49** | 8.00 |  |
| ground | KITCHEN | enclosed | E | enclosed | **6.00** | 8.65 |  |
| ground | KITCHEN | enclosed | S | enclosed | **6.49** | 8.00 |  |
| ground | KITCHEN | enclosed | W | enclosed | **6.00** | 8.65 |  |
| ground | BUTTERY & PANTRY | enclosed | N | enclosed | **3.71** | 8.00 |  |
| ground | BUTTERY & PANTRY | enclosed | E | enclosed | **6.00** | 4.95 |  |
| ground | BUTTERY & PANTRY | enclosed | S | enclosed | **3.71** | 8.00 |  |
| ground | BUTTERY & PANTRY | enclosed | W | enclosed | **6.00** | 4.95 |  |
| ground | SERVANTS' HALL | enclosed | N | enclosed | **5.29** | 8.00 |  |
| ground | SERVANTS' HALL | enclosed | E | enclosed | **6.00** | 7.05 |  |
| ground | SERVANTS' HALL | enclosed | S | enclosed | **5.29** | 8.00 |  |
| ground | SERVANTS' HALL | enclosed | W | enclosed | **6.00** | 7.05 |  |
| ground | DINING PARLOUR | enclosed | N | enclosed | **5.70** | 8.80 |  |
| ground | DINING PARLOUR | enclosed | E | enclosed | **6.60** | 7.60 |  |
| ground | DINING PARLOUR | enclosed | S | enclosed | **5.70** | 8.80 |  |
| ground | DINING PARLOUR | enclosed | W | enclosed | **6.60** | 7.60 |  |
| ground | GREAT STAIR HALL | corridor | N | enclosed | **4.24** | 8.80 |  |
| ground | GREAT STAIR HALL | corridor | E | enclosed | **6.60** | 5.65 |  |
| ground | GREAT STAIR HALL | corridor | S | enclosed | **4.24** | 8.80 |  |
| ground | GREAT STAIR HALL | corridor | W | enclosed | **6.60** | 5.65 |  |
| ground | LIBRARY | enclosed | N | enclosed | **4.84** | 8.80 |  |
| ground | LIBRARY | enclosed | E | enclosed | **6.60** | 6.45 |  |
| ground | LIBRARY | enclosed | S | enclosed | **4.84** | 8.80 |  |
| ground | LIBRARY | enclosed | W | enclosed | **6.60** | 6.45 |  |
| ground | GARDEN ROOM | enclosed | N | enclosed | **2.66** | 8.80 |  |
| ground | GARDEN ROOM | enclosed | E | enclosed | **6.60** | 3.55 |  |
| ground | GARDEN ROOM | enclosed | S | enclosed | **2.66** | 8.80 |  |
| ground | GARDEN ROOM | enclosed | W | enclosed | **6.60** | 3.55 |  |
| ground | ENTRANCE COURT | open | N | enclosed | **6.75** | 20.40 | hall range front |
| ground | ENTRANCE COURT | open | E | enclosed | **15.30** | 9.00 | east wing front |
| ground | ENTRANCE COURT | open | S | open | **26.75** | 20.40 | no wall - ground to far line |
| ground | ENTRANCE COURT | open | W | enclosed | **15.30** | 9.00 | west wing front |
| ground | PRIVY GARDEN | open | N | enclosed | **4.16** | 20.40 | garden wall (built) |
| ground | PRIVY GARDEN | open | E | enclosed | **15.30** | 5.55 | east wing flank |
| ground | PRIVY GARDEN | open | S | enclosed | **4.16** | 20.40 | hall range back |
| ground | PRIVY GARDEN | open | W | enclosed | **15.30** | 5.55 | west wing flank |
| ground | ENTRANCE APPROACH | open | N | enclosed | **15.00** | 32.00 | wing fronts; court mouth open at centre (hall front 24.0 m) |
| ground | ENTRANCE APPROACH | open | E | open | **24.00** | 20.00 | no wall |
| ground | ENTRANCE APPROACH | open | S | open | **15.00** | 32.00 | no wall |
| ground | ENTRANCE APPROACH | open | W | open | **24.00** | 20.00 | no wall |
| upper | SOLAR (GREAT CHAMBER) | enclosed | N | enclosed | **6.97** | 14.60 |  |
| upper | SOLAR (GREAT CHAMBER) | enclosed | E | enclosed | **10.95** | 9.30 |  |
| upper | SOLAR (GREAT CHAMBER) | enclosed | S | enclosed | **6.97** | 14.60 |  |
| upper | SOLAR (GREAT CHAMBER) | enclosed | W | enclosed | **10.95** | 9.30 |  |
| upper | MUNIMENT ROOM | enclosed | N | enclosed | **3.60** | 5.45 |  |
| upper | MUNIMENT ROOM | enclosed | E | enclosed | **4.09** | 4.80 |  |
| upper | MUNIMENT ROOM | enclosed | S | enclosed | **3.60** | 5.45 |  |
| upper | MUNIMENT ROOM | enclosed | W | enclosed | **4.09** | 4.80 |  |
| upper | BACK STAIR HEAD | corridor | N | enclosed | **3.11** | 5.45 |  |
| upper | BACK STAIR HEAD | corridor | E | enclosed | **4.09** | 4.15 |  |
| upper | BACK STAIR HEAD | corridor | S | enclosed | **3.11** | 5.45 |  |
| upper | BACK STAIR HEAD | corridor | W | enclosed | **4.09** | 4.15 |  |
| upper | LONG GALLERY | corridor | N | corridor | **18.22** | 8.00 |  |
| upper | LONG GALLERY | corridor | E | enclosed | **6.00** | 24.30 |  |
| upper | LONG GALLERY | corridor | S | corridor | **18.22** | 8.00 |  |
| upper | LONG GALLERY | corridor | W | enclosed | **6.00** | 24.30 |  |
| upper | MASTER BEDCHAMBER | enclosed | N | enclosed | **5.70** | 8.80 |  |
| upper | MASTER BEDCHAMBER | enclosed | E | enclosed | **6.60** | 7.60 |  |
| upper | MASTER BEDCHAMBER | enclosed | S | enclosed | **5.70** | 8.80 |  |
| upper | MASTER BEDCHAMBER | enclosed | W | enclosed | **6.60** | 7.60 |  |
| upper | STAIR LANDING | corridor | N | enclosed | **4.24** | 8.80 |  |
| upper | STAIR LANDING | corridor | E | enclosed | **6.60** | 5.65 |  |
| upper | STAIR LANDING | corridor | S | enclosed | **4.24** | 8.80 |  |
| upper | STAIR LANDING | corridor | W | enclosed | **6.60** | 5.65 |  |
| upper | GUEST CHAMBER | enclosed | N | enclosed | **4.84** | 8.80 |  |
| upper | GUEST CHAMBER | enclosed | E | enclosed | **6.60** | 6.45 |  |
| upper | GUEST CHAMBER | enclosed | S | enclosed | **4.84** | 8.80 |  |
| upper | GUEST CHAMBER | enclosed | W | enclosed | **6.60** | 6.45 |  |
| upper | CLOSET CHAMBER | enclosed | N | enclosed | **2.66** | 8.80 |  |
| upper | CLOSET CHAMBER | enclosed | E | enclosed | **6.60** | 3.55 |  |
| upper | CLOSET CHAMBER | enclosed | S | enclosed | **2.66** | 8.80 |  |
| upper | CLOSET CHAMBER | enclosed | W | enclosed | **6.60** | 3.55 |  |

---

## Law (b) — where outdoor walls come from

The building's exterior outline is drawn as one heavy black path over the wall poché, so the law
is checkable by eye: **every wall an outdoor space sees is on that line.**

- **Entrance court** — N is the hall range's front, E and W are the wings' fronts, S is open.
- **Privy garden** — S is the hall range's back, E and W are the wings' flanks, N is the one
  built garden wall (D2).
- **Entrance approach** — its only wall is the house front it runs up to (15.00 m from the N
  standpoint; the hall range front behind the court mouth is 24.00 m). Its other three facings
  are marked `open` and carry the distance to the **drawn ground line**, not to any wall. No
  hedge, no boundary, no invented enclosure.

---

## Orientation law (blueprint §3)

Every opening on the drawing carries a doubled arrow with both travel directions written on it:
you arrive facing the way you went. `door1` — the existing M0 exit, marked ★ — is the study's
east wall to the cross passage's west wall, so `study E → hall`, `hall W → study`, exactly as
`fixtures/demo-study/world.json` has it after row 13.

Stairs are exits and obey the same law:

| stair | up travels | arrives facing | down travels | arrives facing |
|---|---|---|---|---|
| GREAT STAIR (west wing) | north | N | south | S |
| BACK STAIR (hall range, NE) | east | E | west | W |

Both are straight single flights, which is why they can obey it: a dog-leg or a newel stair
reverses the traveller and would need the "world's own fiction demands a turn" exception §3
declines to give the schema a field for. **If Kabe wants a period open-well great stair, that
exception is the cost** — flagged rather than decided here.

---

## What the drawing does not yet answer

1. **D2** — is a built garden wall inside law (b), or does the privy garden lose its wall?
2. **D4** — do hall/N and hall/S get door openings prompted into them at row 4?
3. The five over-wide outdoor/gallery facings above: own camera, or clipped `wall_width_m`?
4. Whether the great stair may become an open-well stair at the cost of the orientation law's
   straight-flight simplicity.
