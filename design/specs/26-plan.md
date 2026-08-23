# Row 26 — build plan

Row 26 of `design/intention.md`; brief in `design/specs/26-gate-of-the-manor.md`. Revised after the
plan critic's PASS WITH CORRECTIONS and the Navigator's rulings on F3, F4, F5, F8, F9 and F12; the
row itself was amended at F4 (`65678c0`), so what were deviations in the first draft are now the
row's own words and are not restated here.

Every number below was measured in this worktree by running the shipped `deriveMeta` /
`openingFor` / `standpointFor` against `fixtures/demo-study/plan.json` and
`fixtures/nav-manor/world.json`, not estimated.

---

## 0. What the code says that the first reading of the brief did not

**0.1 The trigger is the plan's own census** — every DOOR the plan draws on that facing joining two
rooms it holds. `standpointFor` is a function of the plan, and one `plan.json` serves two worlds
(`demo-study` names two rooms, `nav-manor` twenty-two); a world-scoped trigger asks one drawn
document for two different standpoints on the same facing, and is circular exactly where the defect
is — `op14` is unwalked *because* it is off frame. Ruled into the row at F4.

**0.2 Flights and thresholds are excluded from the census, for measured reasons.**

| way-through | rect the meta carries | its RAW extent |
|---|---|---|
| `back_stair/E` `back_stair_flight` | x 969 w 567 | x 969 → 4987 (4018 px) |
| `back_stair_head/W` `back_stair_flight` | x 0 w 564 | x −1233 → 564 (1797 px) |
| `great_stair_hall/N` `great_stair` | x 0 w 317 | x −4320 → 317 (4637 px) |
| `stair_landing/S` `great_stair` | x 1263 w 273 | x 1263 → 5193 (3930 px) |
| `entrance_court/S` `op_court_mouth` | x −779 w 3095 | unclamped, 3095 px |

`stairsForFacing` clamps `x/y/w/h` to the canvas (`tools/plan-projection.mjs` ~line 871), so a
flight's rect is *already* the frame intersection: "fully in frame" is vacuous for it, and where the
clamped rect touches an edge the naive test demands a slide of exactly one margin's width for
nothing. I ran that mistake before catching it. A flight's real body is 1797–4637 px wide and no
lateral slide will ever contain it; its on-frame extent is 272.9–566.8 px, well over the bar. The
two thresholds show 1068.5 and 1536.0 px. Neither kind is a subject for a lateral remedy, and row 25
owns the flight's hit region. The tightened CLAUSE in §3 still guards all three kinds — only the
remedy is narrowed to the case a remedy exists for.

**0.3 A lateral slide is not a pixel offset on the wall.** `groundplane.xAtScale` maps `u` through
`wallCentrePx + (u−0.5)·span_px_at_wall·(s/px_per_m_at_wall)`. Shifting `wallCentrePx` alone moves
every depth by the same pixel count, which is true only at the wall plane; the floor, the flights and
any furniture sit at other scales and would shear. The eye moving δ metres to the right moves a
point at scale `s` by `−δ·s`, so the correction is depth-dependent and belongs inside `xAtScale`
(§4.2).

---

## 1. Where the defect is, in numbers

`hall` is `x 31–39, y 9.6–12.2` — an 8.00 m passage 2.60 m deep. `hall/N` and `hall/S` are
threshold standpoints at `camera_wall_m 2.15`, so `px_per_m_at_wall = 1024/2.15 = 476.279`. The
standpoint sits on the cross-axis centre, `x = 35`. The two doors do not:

| opening | plan rect | offset from the room's centre, in the facing's own RIGHT sense | projects at |
|---|---|---|---|
| `op15` (hall→buttery), on `hall/N` | x 36.5–37.5 | +1.5 → +2.5 m | x 1482.4 … 1958.7, **54 px on frame** |
| `op14` (hall→kitchen), on `hall/S` | x 32.0–33.0 | +2.0 → +3.0 m | x 1720.6 … 2196.8, **0 px on frame** |

Both are 476 px wide and both fall off the right-hand edge, because both doors are near the same end
of a passage viewed from its middle. Nothing else in the manor is in this state (§5).

---

## 2. The usable margin, derived — two numbers, each with its own job

Row 2's tolerance lives in `index.html`, minted at `84400cc` ("Row 2, tenth pass: a doorway with
thickness, and forgiveness for any small target"), and it is two constants:

- `TAKEABLE_MARGIN_CSS = 4` (line 749) — *"a takeable owns its own drawn rectangle plus a hand's-width
  margin, and nothing beyond it"*. The forgiveness RING's width.
- `SMALL_TARGET_CSS = 24` (line 765) — *"Below this, in CSS pixels, a target is one a hand cannot hit
  exactly and the forgiveness applies. Above it the object is big enough to answer for itself."*

What connects them to a FRAME edge: **at a clipped edge the ring is worth nothing.** `canvasPoint`
maps a pointer event into canvas coordinates and there are no pointer events outside the canvas
element, so the half of the ring lying past the frame edge can never be clicked. A clipped aperture
does not get row 2's forgiveness on the clipped side and must satisfy row 2's *unforgiven* test
instead.

**Conversion.** `#stage` is `width: min(100%, max(120px, calc((100svh − 7.6rem) × 1536/1024)))`, so
on a portrait phone the stage is the viewport's own width and `1 CSS px = 1536/stageCssWidth` canvas
px. The narrowest width this product is driven at anywhere in its own suite **today** is **320 CSS
px** (`voice.spec.mjs` 320×700 and 320×568; at both the stage resolves to 320).

> **`FRAME_MARGIN_PX = ceil(TAKEABLE_MARGIN_CSS × 1536 / 320) = ceil(19.2) = 20 canvas px.**
> **`MIN_USABLE_APERTURE_PX = ceil(SMALL_TARGET_CSS × 1536 / 320) = ceil(115.2) = 116 canvas px.**

`FRAME_MARGIN_PX` is the inset the slide leaves beyond each edge of a door, so row 2's ring exists on
both sides of it. `MIN_USABLE_APERTURE_PX` is the row's **stated minimum on-frame aperture width**:
116 canvas px — 24.2 CSS px at 320, 29.5 at 390, 116 at native.

**Two honesties written into the comment beside the constants.** (i) `SMALL_TARGET_CSS` was authored
for a *takeable*, not a doorway; applying it to an aperture is **an analogy** — the same hand, the
same screen, the same question "can a finger land on this exactly" — and it is named as an analogy
rather than presented as a law row 2 already stated about doorways. (ii) 320 is *today's* narrowest
driven width, not a declared support floor; the census is invariant to `FRAME_MARGIN_PX` anywhere in
[16, 52] and to `MIN_USABLE_APERTURE_PX` in [95, 308] (verified by re-running §5 at those bounds), so
nothing here turns on the exact choice — what turns on it is only that the number has a source. A
test re-reads both CSS constants out of `index.html` and re-computes the ceilings, so moving row 2's
tolerance turns row 26's constants red rather than silently decoupling them.

---

## 3. The tightened clause, stated

**The predicate, one home.** `usablyInFrame(rect, canvasW, canvasH)` is exported from
`tools/validate-plan.mjs`:

> A way-through is usably in frame when the part of it inside the frame is at least
> `min(rect.w, MIN_USABLE_APERTURE_PX)` wide **and** at least `min(rect.h, MIN_USABLE_APERTURE_PX)`
> tall.

`min(declared, bar)` and not the bar alone, deliberately, and this is the row's own done clause: the
bar refuses a doorway the FRAME has eaten and does not refuse a doorway that is honestly small
because you are standing 15.30 m from it. Ten of the manor's doors draw under 24 CSS px on a phone;
they are unclipped and they are not this row's subject. A *fraction* bar was tried and rejected:
`way_entrance_court_entrance_approach` is 3095 px wide and shows 1536 of itself, so any fraction bar
above 49.6 % would refuse a threshold that works today.

**Two readers, not three.** The exit clause in `tools/validate-fixtures.mjs` (~line 1003), and the
slide's own feasibility test (§4.1). **`waysThrough`'s `off` test stays LOOSE, exactly as it is
today** (Navigator's ruling, F5): there is no deadlock to avoid, because a sliver a world walks is
`[row26:exit.opening_unusable]` and a sliver no world walks is `[row15:exit.opening_unwalked]`, and
both have real remedies — slide the standpoint, or walk the way. Leaving it loose is also what keeps
§10's last sentence true: no exemption in this project widens by a character in this row.

**Two tokens, not one widened token.** `[row21:exit.opening_offscreen]` keeps its exact predicate
(wholly off one of the four edges) and its exact message. The tightening arrives as a second,
adjacent finding, in the same `else if` chain, after it:

```
[row26:exit.opening_unusable]
world.json: exit "<id>" walks through <loc>/<facing>'s opening "<id>" at x,y w×h, of which only
<n> px are on the <W>×<H> frame — under the <MIN_USABLE_APERTURE_PX> px a hand can hit without
the forgiveness the frame edge cannot give it
```

Why a second token: the file's own rule at `exit.via_unfilled` — *"The two arms carry two tokens,
because one token over two behaviours is one countable thing the ledger can only ever exercise on
whichever arm its case reaches."* "Nobody can see it" and "a sliver nobody can hit" are two
behaviours with two messages, and the precedence is stated and tested — wholly-off reports
`opening_offscreen` and nothing else, partially-on-but-under-bar reports `opening_unusable` and
nothing else.

**The `via`-is-an-entity gate is deliberate, and the comment says so** (F16). Both clauses sit inside
`if (!entities.has(ex.via))`. Where `via` names a LEAF, the aperture is the leaf's own §4 placement
and is governed by the staging clauses and `stagingDivergence`, not by the building's meta — so the
frame test would be asking the wrong document. `demo-study`'s two exits are leaf-vias, which is why
that world is untouched by this clause and must stay so.

**The ledger (row 18's family).** In `tests/playwright/guards.spec.mjs`, `exit.opening_unusable`
joins the token list with `everyArm` over four arms — `sliver_right`, `sliver_left`, `sliver_top`,
`sliver_bottom` — built as `exit.opening_offscreen`'s four are, by mutating the baked nav metas so
the opening straddles one edge with `MIN_USABLE_APERTURE_PX − 1` px inside it. Four, because the
vertical half of the older clause was once dropped with the suite green. The completeness scan reads
emit sites, so the new `findings.push` is picked up by construction; the arm list is what this row
adds by hand.

---

## 4. The lateral-slide clause, stated

### 4.1 The law (`tools/validate-plan.mjs`, inside `standpointFor` — still one function)

`standpointFor` gains a third branch after the existing two, which decide distance only. Its four
return points are funnelled into one so the slide cannot be skipped on a path.

> **The point to slide from.** The rule/threshold branch's point, and `s = FOCAL_PX / d` where `d` is
> that point's measured distance to the line the facing views. The slide moves the cross-axis
> coordinate only; the normal coordinate — and therefore `camera_wall_m` — never changes.
>
> **The census.** Every opening of kind `door` the plan draws on this facing whose two `joins` are
> both rooms the plan holds. For each, its lateral extent in metres from the room's cross-axis
> centre, in the facing's own `RIGHT` sense, projected at `s`: `L = canvasW/2 + lo·s`,
> `R = canvasW/2 + hi·s`. (This is `openingsForFacing`'s own arithmetic reduced to the wall plane —
> `xAtScale(from_m/width, s0)` with the corners not yet set is `canvasW/2 + (from_m − width/2)·s0` —
> so the two cannot disagree, and it is checked by the case in §8 that asserts a slid facing's
> derived opening x.)
>
> **The feasible set, which INCLUDES the standable band** (Navigator's ruling, F3 — there is no
> post-hoc clamp). Writing `t` for the picture's shift in canvas px, so the standpoint moves `t/s`
> metres along `RIGHT[facing]`:
>
> - each door contributes `Tᵢ = [Rᵢ − canvasW + FRAME_MARGIN_PX, Lᵢ − FRAME_MARGIN_PX]`, the shifts
>   that put the whole of it in frame with the margin beyond each jamb;
> - the standable band contributes the room's own cross span inset by
>   `C = plan.standpoint_threshold_clearance_m` (0.45 m), minus, for every obstruction in
>   `standpointObstructions(plan, room)` whose span along the VIEWING axis strictly contains the
>   standpoint's normal coordinate, the interval `[o.cross0 − C, o.cross1 + C]`. The normal-axis test
>   is strict containment and is NOT itself inflated by `C`: inflating it makes every masonry band a
>   threshold standpoint legitimately stands `C` in front of forbid the whole room. (I made that
>   mistake first; it forbade all four hall facings.) The result is a union of intervals.
>
> `F = (⋂ᵢ Tᵢ) ∩ standable`, a union of closed intervals in `t`.
>
> **The choice.** The slide is quantised to the drawing's own precision (`DRAWN_DP` = 2, so 0.01 m)
> and it is the SLIDE that is quantised, never the coordinate — `plan.json`'s standpoints are not
> two-decimal numbers today (`hall/N`'s y is `10.049999999999999`) and rounding a coordinate would
> move a facing that is not sliding. So: within each interval of `F`, take the least-magnitude
> 0.01 m multiple that lies inside it (`0` where the interval contains 0); the slide is the
> least-magnitude of those, ties going to the lesser (leftward) one so it is a function and not a
> preference. This subsumes "nearest first, then the other direction": where the nearest multiple to
> the least-magnitude feasible point is itself feasible it is chosen, and where it is not the rule
> looks outward within the same interval before looking at another.
>
> **The honest failure.** If no interval of `F` contains a 0.01 m multiple — because `⋂Tᵢ` is empty,
> because it misses the standable band, or because what survives is narrower than a centimetre — the
> facing **keeps the centred standpoint unchanged**, and the doors that fail §3 are reported by
> `[row26:exit.opening_unusable]` when a world walks them. No partial slide: a partial slide is a
> picture that improves without satisfying the law, and it would hide the finding the law exists to
> raise.

**There is no "too wide to fit" arm, and the reason is a number** (F1). The first draft carried a
degraded arm for a way-through wider than the frame can hold. The census is doors; the widest door
this plan projects is **476.3 px**; `w + 2·FRAME_MARGIN_PX > canvasW` needs
`FRAME_MARGIN_PX > (1536 − 476.3)/2 = 529.9`, which is 26× the derived value. An arm that cannot
fire is the six-bite family, so the arm is deleted and that bound is written where it would have
been: a door wide enough to make `Tᵢ` empty simply refuses, through the branch above, which the
constructed case in §8 exercises.

`standpointFor` returns `{ point, source }` unchanged in shape. `source` stays `"rule" |
"threshold"` — the existing enum, naming the DISTANCE branch — so `plan.standpoint_clear`'s
hard/warning split and `plan.standpoint_source`'s validation are untouched, and the standable band
being inside the feasible set means the slide can never produce the case `standpoint_clear` reports.
`[row20:plan.standpoint_stands_back]`'s message gains the slide, so a mismatched facing is described
truthfully rather than as a stand-back that never moved sideways (F6).

### 4.2 The picture that follows (`src/groundplane.js`)

A derived meta gains one field, `eye_offset_m`: the standpoint's signed lateral displacement from the
room's cross-axis centre, in the facing's own `RIGHT` sense. It is **emitted only when non-zero**
(Navigator's ruling, F8), so exactly two metas gain a key and 86 keep their bytes; `(meta.eye_offset_m
|| 0)` covers its absence everywhere it is read, and `META_KEYS` learns it either way. It is computed
from `fc.standpoint` and the room rect, not from `standpointFor`'s return, so a `drawn` standpoint
(§4b item 9's reserved multi-standpoint rooms) would get a correct picture for free the day one is
authored.

`wallCentrePx` learns the wall-plane half — where corners and `wall_x0_px` are absent it returns
`canvasW/2 − eye_offset_m · px_per_m_at_wall` — and `xAtScale` gains the depth-dependent half:

```
xAtScale(u, s, meta, canvasW) =
    wallCentrePx(meta, canvasW)
  + (u − 0.5) · wallSpanPxAtWall(meta) · (s / meta.px_per_m_at_wall)
  − (meta.eye_offset_m || 0) · (s − meta.px_per_m_at_wall)
```

The correction is zero at the wall plane and zero on every meta without an offset, so it moves no
pixel in the product except on the two facings that slide. It does not double-count against a meta
whose corners carry the shift, because `wallCentrePx` always answers "where is the wall's centre AT
THE WALL PLANE" and the new term only supplies the depth dependence; algebraically, with corners
present it reduces to `canvasW/2 + ((u−0.5)·spanM − δ)·s`, which is the same expression as without
them.

**Ordering, which is a trap** (F14): `deriveMeta` must set `eye_offset_m` on the meta **before**
`openingsForFacing` and before the `corner_x0_px`/`corner_x1_px` computation, or both read a meta
that does not know the eye has moved and the whole change is a silent no-op that still passes a
standpoint-only assertion. §8's case asserts a slid facing's derived **opening x**, not just its
standpoint, so the ordering has a witness.

Three consequences worth stating because they are what make this safe:

- **Staged `u` values do not move.** `u = (targetX − xAtScale(0))/(xAtScale(1) − xAtScale(0))`; the
  eye term is common to numerator and denominator and cancels exactly. `staging.json` is untouched
  and `stagingDivergence` cannot fire.
- **The frame's centre is still the eye ray**, which is why the through-view composite at
  `renderer.js:1288` (`dx = W/2 + k(beyond_offset_m·sDest − W/2)`) needs no change: it already
  measures standpoint to standpoint.
- **`structureInView` and `facingsContaining` read only the standpoint's NORMAL coordinate**, so the
  slide changes neither, and row 19's `projectionFault` refusals (depth-based — the hall's south
  camera 0.10 m off the press) are unchanged.

---

## 5. Which facings move — the whole census, run

**48 of the manor's 88 facings carry at least one way through**: 46 carry a door, 2 carry the court
mouth, and 4 of those 46 also carry a flight — no facing carries a flight alone, which is why
`46 + 2 + 4 = 52` double-counts and the honest total is 48. Directed, that is 56 ways: 50 door, 2
threshold, 4 flight. On-frame widths by kind today: doors 0.0–330.3 px, flights 272.9–566.8 px,
thresholds 1068.5 and 1536.0 px.

Running §4.1 over all 48 with `FRAME_MARGIN_PX = 20`:

| facing | trigger | least slide | standpoint | standable band |
|---|---|---|---|---|
| `hall/N` | `op15` shows 54 of 476 px | `t = 443 px` → **+0.93 m** along `RIGHT[N]` | `x 35.00 → 35.93` | `[31.45, 38.55]` |
| `hall/S` | `op14` shows 0 of 476 px | `t = 681 px` → **+1.43 m** along `RIGHT[S]` (i.e. −x) | `x 35.00 → 33.57` | `[31.45, 38.55]` |

**Nothing else moves. Nothing refuses.** `entrance_court/E,W`, `privy_garden/E,W`, `great_hall/E,W`
and `solar/E,W` carry doors under the 116 px bar (67 and 94 px) and stay exactly where they are,
because each is wholly in frame and `min(declared, bar)` is the declared width.

After the slide both doors land at x 1039.5 … 1515.8 — 476 px each, 121 CSS px wide on a 390 px
phone, a whole doorway with 20 px of frame beyond the jamb. Neither room's own wall corner is pulled
into frame (the 8.00 m wall spans x −1580 … 2230 on `hall/N` and −1818 … 1992 on `hall/S`), so no
void appears at either edge.

§3's predicate over all 55 shipped exits **before** the fix: exactly one fails — `hall/N`/`op15`, at
54 px. After: zero, over 56.

---

## 6. The 56th exit returns, and existing law forces it

`hall/S` slides, `op14` comes fully in frame, `waysThrough` reports `hall → kitchen` as walkable, and
the SHIPPED `[row15:exit.opening_unwalked]` — untouched by this row — refuses a plan that draws a way
no exit walks. `kitchen/N → hall via op14` already exists; the one that returns is `door_hall_kitchen`
(`from hall, facing S, to kitchen, arrive_facing S, via op14`), taking the manor to 56 exits.

It brings its own work: `narration.json` gains exactly `go.door_hall_kitchen.arrive` and
`go.door_hall_kitchen.refused_unreachable`, in the product's voice, globally distinct from all 114
existing lines, or §12.9's domain coverage and the pairwise-distinctness clause both fire.
`design/surface-strings.md` records them.

And `waysThrough(...).offscreen` empties on `nav-manor` even under the loose test, because `op14`
lands wholly on frame — **verified after the build, not assumed** (F5), and the bake's exemption
warning then prints nothing. The mechanism stays: a plan whose slide refuses still needs it.

---

## 7. Every file the build touches, and why

**The law**
1. `tools/validate-plan.mjs` — `MIN_USABLE_APERTURE_PX`, `FRAME_MARGIN_PX`, `usablyInFrame`, the
   third branch in `standpointFor`, and the `[row20:plan.standpoint_stands_back]` message (line 773)
   describing a slid facing truthfully.
2. `src/groundplane.js` — `eye_offset_m` in `wallCentrePx` and `xAtScale` (§4.2). Every pixel-side
   reader reaches the u-mapping through here, so this is the only renderer-side edit.
3. `tools/plan-projection.mjs` — `deriveMeta` sets `eye_offset_m` before openings and corners;
   `waysThrough`'s `off` test **unchanged**, but its header note (~lines 906–925) dies in the same
   change, because it says the passage's off-frame door "is a fact about where the standpoint law
   puts the body" and that "§4b item 9's multi-standpoint rooms are its fix", and both are false
   after this row. `rebuildFacings` needs no change: it already calls `standpointFor`.
4. `tools/validate-fixtures.mjs` — the `[row26:exit.opening_unusable]` arm after the untouched
   `[row21:exit.opening_offscreen]`, with F16's sentence; `eye_offset_m` into `META_KEYS` (not
   `META_REQUIRED` — a measured meta has none).
5. `tools/bake-fixtures.mjs` — line ~170, the exemption warning **string** as well as its comment:
   it names `op14` and multi-standpoint rooms as the fix.

**The documents the law derives**
6. `fixtures/demo-study/plan.json` — `node tools/plan-projection.mjs --rebuild-facings`. Two numbers
   move: `hall.facings.N.standpoint.x` → 35.93 and `hall.facings.S.standpoint.x` → 33.57. Every
   other field of every other room is byte-unchanged.
7. `design/plan-draft/draw_plan.py` (~line 734) — `standpoints.tsv` gains a `standpoint_offset_m`
   column, 2 dp, signed in the facing's own RIGHT sense. Without it the sheet's derived `pending`
   line cannot learn that two standpoints slid: `scopeFromDelta`'s families are all columns of that
   file and `camera_wall_m` does not move here.
8. `design/plan-draft/standpoints.tsv`, `manor-ground.svg`, `manor-upper.svg`, `*.png`,
   `render.lock`, `projection.md` — regenerated in the README's order: `--rebuild-facings`,
   `draw_plan.py`, `render.sh`, `plan-projection --write`, `bake-fixtures`. The sheets print
   **UNAPPROVED REVISION**.
9. `design/plan-draft/approval.lock` — `plan` and `undrawn` digests **not touched**; only the
   `pending` line, replaced with the exact string the suite computes.
10. `design/approvals.log` — one `AWAITING KABE` entry naming row 26's batch. The Navigator posts it.
11. `design/batches/row20-lens/12-schematic-ground.png`, `13-schematic-upper.png` — re-copied from
    the live sheets, which `plan.spec` byte-compares and which have moved.

**The baked artifacts**
12. `fixtures/nav-manor/world.json` (+1 exit), `fixtures/nav-manor/narration.json` (+2 lines), and
    both `fixture.js` files via `node tools/bake-fixtures.mjs`. Metas that change, measured by
    diffing derived metas under the slid standpoints: **`hall/N`, `hall/S`** (openings x,
    `corner_x0/1_px`, `beyond_offset_m`, the new field) and **`kitchen/N`, `buttery_pantry/S`**
    (`beyond_offset_m` only — their destination's standpoint moved). No other facing's meta changes
    by a byte.
13. `backdrops/baked.js` — **not rebaked.** The only promoted measured metas are the study's and no
    study facing slides; `bake-backdrops.mjs` is run once to confirm a no-op and the result reported,
    not assumed.

**The tests**
14. `tests/playwright/helpers.mjs` — the test-side re-derivation types `corner_x0_px: W/2 − half`,
    false for the two slid facings. It gains a per-facing offset literal (typed from
    `standpoints.tsv`, the rule the camera distances already follow) and `mathFor` gains §4.2's term.
    It stays an independent re-implementation, never an import.
15. `tests/playwright/guards.spec.mjs` — §3's four arms.
16. `tests/playwright/manor.spec.mjs` — the derived bar is **added** to the exit sweep, never
    substituted (F7): `minW > 12`, `minSide > 12` and `minArea > 500` all survive as the absolute
    floor the file's own comment requires, and the on-frame bar
    `≥ min(declared, MIN_USABLE_APERTURE_PX)` joins them. Also the blank-doorway map at lines
    191–216 loses `"hall/S": 1` (op14 is walked now), the exemption expectation at line 258 becomes
    `[]` with a comment saying why it emptied, and the §12.2 ROUTE gains the 56th passage so it is
    hashed like the other 55 (F15 — stated once, here).
17. `tests/playwright/validator.spec.mjs` — lines 526, 556, 558: `55 → 56`.
18. `tests/playwright/nav-walkthrough.spec.mjs` — line 486's "28 of the manor's 55 exits" re-counted
    at 390×844, and the row's own walk (§8.1).
19. `tests/playwright/plan.spec.mjs` — `FAMILIES` gains
    `{ column: "standpoint_offset_m", said: "the standpoints' own lateral slides" }`, chosen so the
    joined sentence reads as English ("the standpoint distances and the standpoints' own lateral
    slides on N of the manor's 88 facings, changed since the sheet he approved") — the joined string
    is read before it is pasted (F13); the header comparison learns to accept an ADDED column while
    still failing on a removed or renamed one; `ROW15_COMMIT` pinning (§9.2); the constants case
    (§2); and the slide-law cases (§8.4).

**The prose that would otherwise be false**
20. `design/architecture.md` — the standpoint law's third branch and the two constants; line ~1253
    (names only `opening_offscreen`); lines ~2185–2195 (the manor has "exactly one" exemption, it is
    `op14`, "55 exits and not 56", "§4b item 9's multi-standpoint rooms are its fix"); and the four
    further "55 exits" at ~2030, ~2205, ~2308, ~2610; and the row-15 batch residue (§9.2).
21. `design/blueprint.md` — only where it claims multi-standpoint is the fix for this defect. Item 9
    itself stays reserved (§10).

---

## 8. Verification, where the defect lives

**8.1 The shipped page, driven as a player.** In `nav-walkthrough.spec.mjs`, from a cold `file://`
load of the manor world: `go` into the passage, turn to N by real `turn` intents, read the aperture
the renderer actually produced, and **click a real drawn pixel of the buttery doorway with a real
pointer event** — `page.mouse.click` at the aperture's own centre through the live
`getBoundingClientRect` — at 390×844 and 320×568, asserting the location became `buttery_pantry`.
Then the same for `hall/S` → `kitchen`. Not `HOLO_APP.resolve`: this suite has been burned once by a
case that asked `resolve` and never sent an event.

**8.2 The aperture sweep, and its numbers go in the close.** `apertureList()` after real dispatch on
all 56 exits, intersected with the canvas, uniform-sampled through `hitAtPoint`, counting on-frame px
and clickable share, at both viewports. Reported before/after. **The worst clickable share is the
close's headline number** (F9), so nobody reads the clause as promising more than it does — it bars
frame-eating, and an honestly small distant door is still a small target.

**8.3 The before/after pictures.** `design/batches/row26-gate/` with its own `capture.mjs`:
`hall/N` and `hall/S` BEFORE, drawn from row 15's hand-off commit through the `git archive` route
`row21-promotion` already uses, and AFTER from HEAD; plus the two re-rendered schematics with the
moved markers. The batch's frames are re-rendered and byte-compared by `plan.spec` like every other
batch's.

**8.4 The slide law's own cases, including a CONSTRUCTED refusal** (F2). Against the shipped plan:
the two facings that slide and their exact coordinates; the least-magnitude property (one centimetre
less and a door is off frame, one centimetre more is not the chosen slide); and every other facing
unmoved. Against **scratch plans built in the test, never the shipped one**, both refusal
sub-branches:

- `⋂Tᵢ` empty — a room with two doors at opposite ends of a wall too long for one frame to hold
  both; the standpoint must stay centred and the world walking either door must produce
  `[row26:exit.opening_unusable]`;
- `⋂Tᵢ` non-empty but disjoint from the standable band — the same room with the slide it needs
  falling outside the room's own inset span (or inside a hearth that spans the standpoint's depth);
  same expected outcome.

Deleting the refusal branch — returning the slid point regardless — turns both red, and that is
asserted the way the offscreen arms assert theirs.

**8.5 The rest.** Full suite in both engines; `validate-plan`, `validate-fixtures` and
`bake-fixtures` clean; §12.2's round-trip hash identity over the 56-passage route;
`git status --porcelain` empty after every scratch run.

**8.6 The adversarial proof (brief §6).** An author's delete-and-confirm-red is insufficient. A fresh
critic in its own worktree at the built commit gets the artifact-critic brief plus one instruction:
*construct a plan and world in which a player is given a `go` target they cannot hit — a doorway the
frame has eaten — and make the suite stay green.* The four arms, the two tokens, the constants and
the six previous bites of this family are named in its brief so it does not rediscover them. The row
does not close until that critic reports in writing that it failed.

---

## 9. The shape of the hand-off, and the edges

**9.1 The redline's three red cases — ruled, not a fork.** Moving a drawn standpoint changes
`manor-ground.svg`'s geometry, so `plan.spec.mjs:3201` ("the derived drawing's geometry is Kabe's
approved geometry, unchanged"), `:3210` ("the standpoint table … byte-equals the approved one") and
`:3215` ("only the two caption strings differ") go red against `APPROVAL_COMMIT`. That literal
*"moves only when the DRAWING moves and Kabe has said yes to the new one"*, and
`design/plan-draft/README.md` makes both re-anchor steps a human's. The row therefore hands off with
those three cases red by design, the sheets stamped UNAPPROVED REVISION, and `AWAITING KABE` in
`design/approvals.log` — the row's own done clause now says so, and row 22 sits in the same state.
The builder touches neither `approval.lock`'s digests nor `APPROVAL_COMMIT`.

**9.2 The row-15 batch's `10-hall-N-no-floor-line.png`.** `plan.spec` re-renders every row-15 batch
frame from HEAD and byte-compares it; the slide makes that frame a picture today's build cannot draw.
Re-capturing would replace evidence Kabe has never ruled on (the batch is `AWAITING KABE`) — the
exact objection `design/architecture.md`'s residue item 8 records, settled once already when the
row-21 batch was pinned to its own commit `ad82ede`. So: `ROW15_COMMIT` pinned, `git archive` into a
scratch tree, `capture.mjs <out> <tree>` (row 15's script already takes the second argument). The
frame stays as it was and row 26's own batch carries the "after".

**9.3 What this row must not touch.** `nearAperture`'s poly skip and the flight hit region (row 25
(a)); the flight's flat value (row 25 (b)); the threshold rect's height (row 25 (c)); the
through-view's edge extension (row 25 (d)); wayfinding (row 24); the screen-reader silence (row 10).
The slide makes `hall/N`'s through-view composite land off-axis for the first time — that is
`beyond_offset_m` working as designed, and it goes in the batch as a picture rather than becoming a
row-25 fix here.

---

## 10. What does not move, restated so a critic can hold the row to it

- **The lens.** `groundplane.FOCAL_PX = 1024`, one lens on every facing, `assertRuledLens` and
  `meta.one_lens` untouched. The slide changes no scale: `px_per_m_at_wall` on `hall/N` and `hall/S`
  is 476.279 before and after, because the standpoint's distance to its wall does not change.
- **The eye.** The standing eye, 1.183 m, `assertRuledEye` untouched. The camera stays level; no
  pitch, no pan, no rotation — the slide is a translation of the body along the wall.
- **`camera_wall_m` / `camera_far_m`.** Unchanged on all 88 facings, so `standpoints.tsv`'s distance
  column, `measure.py`'s re-ask targets, `misses.jsonl` and every gate number stay where row 22
  leaves them.
- **The wide-view licence stays dead.** No second camera, no widened frame, no `camera: "wide"`.
- **§4b item 9's multi-standpoint reservation stays reserved.** The cross passage keeps ONE
  standpoint per facing; this row changes where the single standpoint stands, never how many there
  are. The great hall and the long gallery remain item 9's first honest use.
- **No refusal or exemption is widened.** `[row21:exit.opening_offscreen]`'s predicate and message
  are byte-identical after this row, and so is `waysThrough`'s exemption test;
  `[row21:exit.via_unfilled]`, `[row15:exit.opening_unwalked]`, `[row20:plan.standpoint_clear]`,
  `[row19:projection.refuses_*]` and `[row20:plan.standpoint_branch]` are unchanged. The only
  movement in the guard surface is one new token that refuses MORE than before.
- **`staging.json`, the 55 existing exits, and every other room's standpoint.** Untouched — and the
  `u`-invariance in §4.2 is why the first of those is provable rather than hoped for.
