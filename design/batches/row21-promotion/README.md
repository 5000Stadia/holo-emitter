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

1. **The eye height — ANSWERED while this batch was being made.** You picked **B**, the standing
   eye. The wall in frame 01 is the low-eye `cand-2`, promoted before your word landed and left
   exactly as it is: the promotion is a committed script, so the swap is a re-run against a new
   candidate rather than a rewrite, and the production run that follows regenerates every wall
   against `cand-4` as its camera reference. What you are looking at here is the mechanism, on the
   frame that was available; the room you get is the standing one.

   **What your word routes to, stated so it cannot be lost between sessions.** The
   **standing-eye wave supersedes the promoted camera**: `backdrops/study/N.png` is the last wall
   that will ever stand at the low eye, and the production run regenerates the study and the
   passage together with the manor's, every one of them against `cand-4-standing-eye` as the camera
   reference. Nothing in this row promotes at the standing eye and nothing in the cand-3 round
   promotes at all.

   **And the harness was pointed at `cand-4` to get you its measured eye height. It issues none,
   and the reason is worth one paragraph** — the enforced eye is meant to be `cand-4`'s own
   measurement, so this is the number the production run starts from:
   - the **ruled** horizon instrument does not resolve on that frame. The ceiling-ramp fit — the
     one the Navigator ruled at row 20 over the vanishing-point vote — returns y 86 against a
     ceiling line detected at y 120, where on the approved frame it returns 524.4 exactly.
   - the **superseded** instrument does resolve, at y 541, and would put `cand-4`'s eye at
     **0.99 m** — *lower* than its own reading of the low-eye frame it replaces (1.20 m). A
     standing-eye frame that measures shorter than the frame it stands in for is the measurement
     telling you it is measuring something else.
   - the two rulers on that frame **straddle**: the fireplace opening is where it was (jambs 342
     and 554, 213 px of a ruled 0.90 m → 236.7 px/m, a 1029 px lens at the drawn 4.35 m, **+1.9 %**
     and inside the band), while the wainscot rail sits 180 px above the floor against the approved
     room's 213 — a 20 % disagreement. The camera is probably fine and the joinery moved, but
     "probably" is not a measurement.

   So the re-tune is the production run's first step, exactly as it was before your word landed;
   what your word changed is which frame it re-tunes against.
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
study/E        4.09     235.50      246.9        963   FAIL  -4.6%
study/N        4.35     232.22      232.2       1010   PASS
study/S        3.85          -      262.3          -   WITHHELD
study/W        4.09     233.22      246.9        954   FAIL  -5.6%
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

## The cand-3 round, which promotes nothing, and what it says about the recipe

The seven walls were painted a third time under a new rule — blueprint §11's **universal anchor**:
*the wainscot chair-rail stands at exactly 0.95 m above the floor on every panelled wall in the
manor*, so that being measurable is a property of the wall specification rather than of whichever
feature a prompt happened to ask for. **Nothing here promotes**, and that was decided before the
numbers were: your B ruling routes every wall through the standing-eye wave, so this round is
recipe validation. `python3 design/plan-draft/measured/measure.py --round cand3` then
`python3 design/plan-draft/measured/gate.py --round cand3`:

```
facing      standpt       px/m     TARGET   focal px   verdict
hall/E         6.00          -      168.3          -   WITHHELD
hall/N         2.15          -      469.8          -   WITHHELD
hall/S         2.15          -      469.8          -   WITHHELD
hall/W         6.00          -      168.3          -   WITHHELD
study/E        4.09     228.42      246.9        934   FAIL  -7.5%
study/N        4.35          -      232.2          -   NOT GATED
study/S        3.85          -      262.3          -   WITHHELD
study/W        4.09     230.53      246.9        943   FAIL  -6.6%
```

**0 of 7 admitted, which is the same as the round before it.** The one number strictly comparable
across the two rounds is that one, because the instruments differ on purpose: cand-2 was read with
windows re-tuned to each frame and two of its rulers were read by eye, and cand-3 is read by the
declared anchor alone with **every detector window left exactly where cand-2 put it**. Re-tuning a
window until the feature appears in it is how you answer a different question. The control holds
either way: the approved frame goes through the cand-3 code and returns its committed floor line
(777) and its committed rail (213 px above it) to the pixel.

Why each wall is withheld is in the ledger, and three of the reasons are new:

- **`hall/N` and `hall/S` declare the anchor and then forbid the floor it is measured above.** A
  height above a datum the frame does not show is not a length in that frame. Both were WITHHELD at
  cand-2 for want of a ruler, and they are WITHHELD again — under the very rule written to stop it.
- **`hall/E` and `hall/W` paint one moulding line where a chair-rail is two** (a capping shadow
  above the rail's own undercut, 0.082 m apart on the approved frame). One horizontal is not a
  wainscot, and a detector that converts it to a scale is measuring a floorboard.
- **`study/S` paints two lines 0.27 m apart** — three times the module — so whatever they are, they
  are not one chair-rail.

`study/E` and `study/W` are the two that measure, and they measure **−7.5 %** and **−6.6 %**: the
camera still did not move as far as it was asked to, in the same direction and by about the same
amount as at cand-2. That is the honest headline. **The prompt lint is still apparatus and has not
clocked as an improvement** (production law clause 5), and the round exposed a fault in the lint
itself worth your knowing about, because it is the shape of failure a gate can have that nobody
looks for: **it refused all seven compliant prompts on a comma.** Its `Gate anchor:` parser wanted
the metres to follow one, the seat wrote *"at exactly 0.95m above the floor, running the full
wall"*, and so the round meant to test the rule was generated against a tool that rejected
obedience to it. The parser reads the metres wherever they stand now, and the lint's refusal count
means something again: **5 of the 8 cand-3 prompts pass it**, and the 3 it refuses are the two that
forbid their own datum plus one that declares no anchor at all.
