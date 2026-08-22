# Row 21 — the painted promotion

Eleven frames, and the two to open first are **01-study-N.png** and
**10-demo-study-N-painted-with-placeholders.png**. The first is the room as the live link now
serves it: the painting Kabe approved on 2026-08-21, standing in the world, walked to rather than
looked at. The second is the same wall in the furnished demo world, with the V1 placeholder desk
and chair still standing on it — the seam this row leaves open, shown rather than described.

Every frame is the scene canvas at native 1536×1024, cold `file://` load, no chrome, nothing
hovered, reached by real intents through the harness. `capture.mjs` is committed beside them and
`plan.spec` re-runs it and requires every frame back byte-identical, so nothing here can go stale
without the suite saying so.

## What is in the frames

| frame | what it is |
|---|---|
| 01 | study/N — **painted**. The one admitted wall. |
| 02 | study/E — grid, with the passage showing through the doorway. |
| 03, 04 | study/S, study/W — grid. Not yet admitted; see the gate table. |
| 05–08 | the cross passage's four facings — grid. `hall/N` and `hall/S` correctly show a wall in your face and no floor: a 2.60 m room seen across its short axis. |
| 09 | study/E again, reached the long way round — through the passage and back — so a crossing that quietly changed the world would show here as a different picture. |
| 10 | the furnished demo world on the painted wall: **the V2/V1 seam**. |
| 11 | the furnished world with the door open, the passage behind it. |

Beside them, `measured/<loc>-<facing>-marked.png`: each candidate with every line the measurement
used drawn on it and labelled with its pixel value. A ruler lying on nothing is visible to a human
in one look and to no amount of JSON — that is what those eight are for.

## What the row changed, in one line each

- **The live link boots the painted world.** The bare URL is the manor's two rooms, walkable,
  empty of objects, painted where a wall has been admitted and holodeck grid where it has not. The
  furnished demo world is at `?world=demo-study` and the README says so.
- **A doorway is a fact about the building.** It comes from the room's own geometry, not from the
  door leaf standing in it, which is what lets a room with nothing in it be walked through at all.
- **Through an opening you see the next room, never void.** Measured: the study's doorway held
  92,061 pixels darker than luminance 12 before this row and holds **none** now.

## The questions this batch carries

Four of them are the row-20 batch's, which has not had its verdict yet and rides with this one.

1. **The eye height.** `design/approvals.log` records the camera A/B — the low eye of the promoted
   `cand-2` against `cand-4-standing-eye.png` — as AWAITING. This row promoted the approved
   low-eye frame and says so: if the standing eye wins, the promotion is a re-run of a committed
   script against a new candidate, not a rewrite.
2. **The two long-wall passage facings** (05, 07 in the row-20 batch; 08 and 06 here) show no
   floor, no ceiling line and no corner. That is correct for the room and it may still be wrong for
   the product.
3. **Turning translates the body.** One 90° press moves the viewer 2.38 m across the study, and
   the passage's two ends are 4.00 m apart. The lens is one lens; the position is not one position.
   §4b item 9's multi-standpoint rooms are where that is fixed.
4. **The schematics' stamp** — what the approval covers and what it does not.

And three that are this row's own:

5. **How dark should the room beyond a doorway be?** It is dimmed to 58 % of its own brightness by
   a constant nobody has ruled. Open 02 and 11 and say whether the next room reads as depth or as a
   picture pasted in a hole. Frame 07 is the hard case and a critic called it honestly: from the
   passage looking west, the study through the doorway is drawn at 0.28 scale on top of the dim,
   and what is left is a dark rectangle with a sliver of floor. It is not void — every measurement
   says so — and it is not yet a room.
6. **A half-painted room.** The study's north wall is fine oil realism and its other three are
   procedural grid. The fiction says unestablished space renders as the holodeck's own scaffold, and
   the README says it in the player's voice — but a room in two materials is a look, and the look
   is Kabe's.
7. **An empty world.** Nothing in the painted world can be picked up, opened or refused. The
   showcase's interactable half returns with the sprite phase, which is next. Said plainly rather
   than left for a reader to notice: **two of the five decomposed qualities have no subject in
   these frames at all** — *contact* (every grounded object darkens the ground under it) and
   *occlusion chains* (objects overlap objects) need objects, and there are none. Frames 10 and 11
   are the only ones where either can be judged, and what they show is V1 placeholder shapes. An
   empty room passing is not the same as a room that passed.

And two an artifact critic put on the table, both already ANSWERED with authority — recorded here
so you see what was decided in your name and can overturn either:

8. **The painting and the plan disagree about where the hearth is, by 1.41 m.** The drawing you
   approved puts the study's chimney breast at 1.65–3.85 m along the north wall — dead centre of
   the frame. The painting you approved puts its fireplace at 0.87–1.78 m, well to the left of it.
   **Ruled: the PLAN amends to the painting.** The wall map's hearth position was drafted by an
   agent; the painting's is what your own eye approved on 2026-08-21, and blueprint §5 makes the
   approved image the geometric authority. The amendment is execution rather than judgement now —
   it moves a drawn carrier, so it re-renders the sheets and re-anchors their stamp, and it moves
   the study's south standpoint (which stands where it does to clear this very hearth). Nothing is
   staged on that wall until it lands. Row 21 records the disagreement per carrier in the meta and
   holds the number by test so it cannot drift while it waits.
9. **The light in the approved study is the hearth fire — left of centre, below the horizon**,
   against the orientation contract's UL45. **Ruled, under §10's own standing disposition: a facing
   whose measured key defies UL rules its own sprites' light**, as one more dimension of the
   variant manifest, with UL45 the default for unmeasured or neutral-keyed walls. So the study's
   north wall gets a fire-lit sprite set. `replicator/contract.json` carries the fork closed, with
   the authority chain in it.
10. **On a phone the picture is 31 % of the screen.** 390×260 of an 844-tall display, with the
    narration and inventory strips below it holding nothing at all in the empty world. That is the
    layout doing exactly what it was told (contain-fit, chrome reserved); whether an empty painted
    room should give the picture more of the glass is a look call.

## The gate, and why only one wall was admitted

```
facing      standpt       px/m     TARGET   focal px   verdict
hall/E         6.00      88.85      168.3        533   FAIL  -47.2%
hall/N         2.15          -      469.8          -   WITHHELD
hall/S         2.15          -      469.8          -   WITHHELD
hall/W         6.00     106.00      168.3        636   FAIL  -37.0%
study/E        4.09     235.50      246.9        963   FAIL   -4.6%
study/N        4.35     232.22      232.2       1010   PASS
study/S        3.85          -      262.3          -   WITHHELD
study/W        4.09     233.22      246.9        954   FAIL   -5.6%
```

A candidate is admitted when the camera it was painted at is the camera the project projects at —
its scale times its own drawn standpoint distance, against the 1010 px the approved `study/N`
measures, within ±3 %. **WITHHELD is not FAIL:** it means nothing in that painting can be turned
into a scale, which is our defect and not the painter's, and it carries no re-ask.

The causes are diagnosed in `design/plan-draft/measured/misses.jsonl`, one line per wall, and two of
them are now refused before an image is made rather than after
(`design/plan-draft/measured/prompt_lint.py`): a prompt that forbids the camera change it is asking
for — five of the seven did, and two walls came back corner-for-corner identical to the round
before — and a prompt that declares no feature the gate can measure. Whether that moves the
first-roll pass rate is the next round's answer; the baseline is 0 of 7.
