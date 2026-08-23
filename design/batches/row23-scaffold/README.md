# Row 23 — the scaffold matrix

**Open `look-sheet.png` first.** Every frame the matrix produced, beside the two references, on one
sheet. Nothing on it is marked as a winner, because nothing won.

---

## What was asked, and what came back

Blueprint §11b [HUMAN, 2026-08-22]: *"Both a text description and a reference image, that looks
similar to the hollow grid, but may even have elements that we need that have a text word in a
certain space. For example, the word bird in a place where we would want to see a bird."*

Three request techniques, four rolls each, on two walls — 24 paintings:

| | t1 | t2 | t3 |
|---|---|---|---|
| what the painter was given | bare layout frame + style ref | **the same frame with labelled carriers** | labelled frame + a placement paragraph |

**The headline result: the labels moved nothing this instrument can see.**

| wall | leaned toward the LABEL (t1 / t2 / t3) | spread | P(this \| the three are identical) |
|---|---|---|---|
| study/E | 1 / 1 / 1 — three of four leaned to the *reflex* in every cell | 0 | **1.000** |
| study/N | 3 / 3 / 3 | 0 | **1.000** |

| wall | camera admitted (t1 / t2 / t3) | P(this \| identical) |
|---|---|---|
| study/E | 4 / 4 / 2 | 0.535 |
| study/N | 2 / 2 / 3 | 0.915 |

17 of 24 admitted on the camera. **No technique separated from any other on either arm.**

That is a null result and it is recorded as one. The run-off §5.6 licensed was **declined** by the
Navigator: at a spread of zero and p = 1.000 there is nothing eight more rolls could resolve.

---

## The two walls, and why there had to be two

| | `study/N` | `study/E` |
|---|---|---|
| carries | the **camera ground truth** — Kabe's own ruled reference | the **carrier probe** |
| camera | `cand-5-reference.png`, 819.6 px, eye 1.183 m, **ruled** | its own **admitted cand-6 reading**, 835.2 px, eye 1.138 m — *not* a ruled reference |
| plan carrier | fireplace, 1.65–3.85 m | door `op13`, 3.00–4.00 m |
| where it sits | box centre **4.7 px** from the wall centre | **1.100 m** off the wall centre |
| what the no-label ask painted | hearth 330.4…569.2 | door 673…860 — **dead centre** |
| the two rects | overlap almost entirely | **no overlap at all** |

On `study/N`, obeying the label and centring a hearth by reflex are nearly the same act — so that
wall could never have answered the question. On `study/E` they are opposite acts, which is why the
row was amended to run on both. `study/E` is where the answer above comes from.

---

## Three things a reader is owed

**1. This is an obedience experiment, and it was run against a hearth the project has already ruled
wrong.** The scaffold stamps the hearth where `plan.json` draws it; blueprint §5 makes the approved
*image* the geometric authority and row 22 exists to move the plan onto the painting. What the
matrix measures is whether a request method gets **obeyed**, never which method paints the better
room. Nothing from this round is promoted.

**2. The instrument had to refuse before it could be trusted, and that cost the arm.** Two detector
mistakes were caught by controlling against frames whose answers the corpus already holds:

- taking the strongest step in each band read `study/N`'s floor line 16 px low — a **12 % error in
  implied focal length**. The corpus's own rules are now injected and this round supplies only the
  windows; `study/N` now reads floor 749, rail 179 above it, focal 819.6, eye 1.183 — identical to
  the committed corpus.
- taking the strongest admissible edge pair put `study/E`'s door at 907…1113 where that painting
  draws it at **673…860** — it would have scored a 217 px miss as a 17 px hit. It now enumerates
  every admissible pair and **refuses when the best two disagree**.

The consequence: on a panelled wall two pairs always disagree, so **the edge-pair arm is unread on
all 24 rolls** and `adherence_raw` has no index anywhere. The lean above comes from a
two-hypothesis test whose hypotheses — the scaffold's ask, and that wall's own *measured* no-label
reflex — were both fixed before any candidate existed.

**3. `study/N`'s scaffold asks for a lower ceiling than its own ground truth has.** The meta's
`storey_height_m` is the ruled 2.80, so the grid draws its ceiling at y 221 where the reference
paints y 118 — 0.55 m apart. Correct behaviour; it means the ceiling scores nothing, and it
conditions the ramp fit the eye reading comes from, so each roll's ramp residuals print beside it.

---

## The question the numbers cannot answer, and it is yours

Every column here is geometry, and geometry cannot see whether a room that obeyed its scaffold
**reads as a room or as a diagram obeyed**. That is what the look sheet is for, and it is the whole
reason no recipe is crowned by code.

Worth your eye in particular: on several `study/E` frames the door is visibly off-centre — toward
where the label asked — while the lean metric scored them toward the reflex. The picture and the
number disagree there, and the picture is the one that decides what ships.

---

## Still out — the last eight

| packet | rolls | what it tests |
|---|---|---|
| `packets/study-N/lens` | 4 | the **20 % lens gap**: the same wall drawn at the ruled 1024 px lens (235 px/m) instead of the painted 819.6. Which camera the manor finishes at is an open question with your name on it. |
| `packets/study-N/t4` | 4 | the **content scaffold**: `study/W`'s promoted pixels inherited into `study/N`'s left return, floor and ceiling. Half of §11b — the right return stays grid because its neighbour is not promoted. |

The lens arm's technique was picked by the rule written down before any candidate returned
(§5.6: highest admitted count) — **t3**, on 3 admitted of 4 against 2 and 2.

---

## How to check any of it

```
python3 design/plan-draft/measured/measure.py --round row23     # measure every return on disk
python3 design/plan-draft/measured/gate.py    --round row23     # the camera half
python3 design/plan-draft/measured/row23_report.py              # the table + separation report
python3 design/plan-draft/measured/row23_looksheet.py           # rebuild look-sheet.png
node tools/make-scaffold.mjs study/N --out design/batches/row23-scaffold
npx playwright test -c tests/playwright scaffold.spec.mjs --project=chromium
```

`measured/` holds every frame with the lines the measurement used drawn on it, including the window
each carrier was hunted in — because a window that does not contain its carrier is visible to a
human in one look and to no amount of JSON. The readings never see `assignment.json`; the join to
techniques happens only in the report.
