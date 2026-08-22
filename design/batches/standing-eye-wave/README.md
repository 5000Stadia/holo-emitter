# Standing-eye wave — the study at the camera "B" names

**What you are looking at, and the two questions this batch asks:** the study's
north and west walls are painted at the new camera and its east and south walls
are still grid, so the corners where paint meets paint — and where paint meets
grid — are the thing to look at. The second question is `02-study-E`: the gate
admitted it and it is **not promoted**, and the reason is below.

[HUMAN, 2026-08-22] — your own word, from `design/approvals.log`: **"B"**, the
standing eye. That ruling put every wall of the manor through one regeneration
against a single new camera reference. This is the first wave back.

## The frames, ordered for the seams

Each of the study's four corners is **two facings that have to look like the
same room where they meet**. Read them in pairs, side by side:

| corner | one facing | the other | what meets there |
|---|---|---|---|
| **north-west** | `01-study-N`, its LEFT corner at x 188 | `03-study-W`, its RIGHT corner at x 1351 | the same corner of the room, painted twice — **this is the pair to look at** |
| **north-east** | `01-study-N`, its RIGHT corner at x 1351 | `02-study-E` | paint meeting grid |
| **south-east** | `02-study-E` | `04-study-S` | grid meeting grid |
| **south-west** | `03-study-W`, its LEFT corner at x 186 | `04-study-S` | paint meeting grid |

- **`01-study-N`** — the camera reference itself, **promoted**. Its
  seam-adjacent facings are `03-study-W` at its left corner and `02-study-E` at
  its right.
- **`03-study-W`** — admitted at **−3.9 %** focal, **−2.9 %** eye, **promoted**.
  Its seam-adjacent facings are `04-study-S` at its left corner and
  `01-study-N` at its right.
- **`02-study-E`** — **admitted by the gate and NOT promoted**, which is the
  one decision in this batch that needs your word. Its painting is good: +1.9 %
  focal, −3.8 % eye, both well inside the band. What stops it is that the
  painting puts the doorway **dead centre of frame and the approved plan puts
  it 1.11 m to the right** — and the furnished world cuts its hole where the
  PLAN says, so promoting the wall would show a hole in the paint beside a
  painted door that does not open. The plan is the document that moves (row 22
  already carries the same amendment for the hearth) and that redline is
  yours, not an agent's. The frame here is the grid, which is what the wall
  draws until it lands. Its seam-adjacent facings are `01-study-N` at its left
  corner and `04-study-S` at its right.
- **`04-study-S`** — **not admitted**, and still the grid. Its own prompt
  declared the chair-rail anchor and the painting drew a window-seat sill where
  the rail should be, so nothing in it converts to a scale. It is
  seam-adjacent to both `02-study-E` and `03-study-W`.
- **`05-demo-study-E-door-open-through`** — the furnished world, the leaf
  opened: the passage drawn through the doorway with the V1 placeholder sprites
  standing on the study's floor. The east wall is grid here for the reason
  above, so this frame is the through-view and the sprite seam, not a paint
  seam.

## The gate table

`python3 design/plan-draft/measured/gate.py --round cand6`

```
facing      standpt       px/m     TARGET   focal px     eye m    dfocal      deye   verdict
hall/E         6.00     171.58      136.6       1030    1.2653    +25.6%     +7.0%   FAIL
hall/N         2.15     301.05      381.2        647         -    -21.0%         -   FAIL
hall/S         2.15          -      381.2          -         -         -         -   WITHHELD
hall/W         6.00     161.05      136.6        966    1.3343    +17.9%    +12.8%   FAIL
study/E        4.09     204.21      200.4        835    1.1380     +1.9%     -3.8%   PASS
study/S        3.85          -      212.9          -         -         -         -   WITHHELD
study/W        4.09     192.63      200.4        788    1.1488     -3.9%     -2.9%   PASS
```

**2 of 7 admitted, and one of the two promoted.** The first-roll pass rate over
three rounds is **0 of 7 (cand-2), 0 of 7 (cand-3), 2 of 7 (cand-6)** — the
first movement this production line has had. `study/W` is in the world;
`study/E` is admitted and held, for the reason in the frame list above. The
reference `study/N` is promoted too and is not in this table, because a
reference is read rather than admitted.

**A FAIL is a fact about a painting** and carries a delta and a target scale the
asset seat can act on. **A WITHHELD is a fact about our own measurement** and
carries what has to change instead: `study/S` and `hall/S` are withheld because
neither paints the wainscot chair-rail its own prompt declares as the
measurement anchor, so no scale could be issued from either and no camera
re-ask may be sent against one.

## Six questions

1. **The corners.** Do the four pairs above read as one room? This is the whole
   point of the batch.
2. **Paint against grid.** Two walls of four are paint. Is a half-painted room
   acceptable while the rest of the wave comes back, or should the study wait
   until all four are paint?
3. **The doorway, and the wall that is waiting on it.** `02-study-E` passed the
   camera gate and is held back only because its painted door is 1.11 m from
   where the plan puts it. The painting is the geometric authority under
   blueprint §5, so the fix is a plan amendment — row 22 already carries the
   hearth's, which grew from 1.41 m to 1.64 m in this wave. Confirm the plan
   moves to the painting again, for the door as well as the hearth, and the
   east wall promotes with it.
4. **`05`, the through-view.** The passage beyond is dimmed to 58 % of its own
   brightness. Right, too dark, or not dark enough?
5. **`05`, the sprite seam.** The V1 placeholder desk and chair stand in the
   study at the new camera. That is the seam row 4's sprite lane has to
   close — is the mismatch what you expected?
6. **The lens.** A painted facing now draws at an **819.6 px** lens where an
   unpainted one draws the ruled **1024 px** — 20 %, where the last wave carried
   1.4 %. The generator answered "standing adult eye" by widening the lens
   rather than raising the camera. Either the manor finishes painting at 819.6
   and the ruled 24 mm lens becomes a generation-side fiction, or every wall
   re-asks against 1024 and the reference itself is regenerated. This one is
   not an agent's to take.

## How the frames were made, and how to check them

`node design/batches/standing-eye-wave/capture.mjs <outDir>` — the scene canvas
alone at native 1536×1024, cold `file://` load, Chromium, no chrome, no hover,
every frame reached by real intents through the harness. The suite re-runs it
and byte-compares, so a frame that is not what the code draws today goes red,
and it compares the gate table above to what the tool prints, line for line and
to the end of the tool's own table.

`measured/` holds the frame each wall was measured on with **every line the
measurement used drawn on it** — the floor line, the ceiling line, the corners,
the ceiling-ramp horizon, the chair-rail and the cross-rulers. A ruler lying on
nothing is visible to a human in one look and to no amount of JSON.
