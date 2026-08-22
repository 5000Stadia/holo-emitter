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
   picture pasted in a hole.
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
