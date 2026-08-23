# Row 23 — the scaffold matrix

**What this directory is, at P0.** The two scaffolds the technique matrix will be run against, and
the numbers behind them. No candidate has been generated yet; the dispatch is held at CP-23A.

Blueprint §11b [HUMAN, 2026-08-22]: *"Both a text description and a reference image, that looks
similar to the hollow grid, but may even have elements that we need that have a text word in a
certain space. For example, the word bird in a place where we would want to see a bird."*

## The two walls, and why there are two

| | `study/N` | `study/E` |
|---|---|---|
| what it carries | the **camera ground truth** — Kabe's own ruled reference | the **carrier probe** |
| camera | `cand-5-reference.png`, 819.6 px focal, eye 1.183 m, **Kabe-ruled** | its own **cand-6 admitted reading**, 835.2 px, eye 1.138 m — admitted, not promoted, and never the ruled reference |
| the plan's carrier | fireplace, 1.65–3.85 m | door `op13`, 3.00–4.00 m |
| where the carrier sits | box centre **4.7 px** from the wall centre | **1.100 m** off the wall centre |
| what the no-label ask painted | hearth 330.4…569.2 | door 673…860 — **dead centre**, 1.5 px off the corner midpoint |
| the stamped box | 566.9…981.5 | 890.5…1094.7 |
| overlap of the two | almost total | **none** |
| carrier tolerance | 324.4 px | 226.1 px |
| detector | the stone case's outer moulding — **no detector exists in the corpus** | the door opening — an **existing tier-1 ruler** |

That last row is the argument. On `study/N`, obeying the label and centring a hearth by reflex are
nearly the same act, so its carrier arm is weak however it is scored — a property of the wall, not
of the metric. On `study/E` they are **opposite** acts. `study/N` carries the camera; `study/E`
carries the discrimination; neither carries both, and nothing here averages them.

## The frames

- `study-N-frame.png` / `study-N-scaffold.png` — bare grid frame, and the same frame with the
  plan's carriers stamped.
- `study-E-frame.png` / `study-E-scaffold.png` — the same pair for the door wall.
- `study-{N,E}.scaffold.json` — the sidecars: the meta used and where it came from, both horizontal
  spaces and their divergence, every stamped rect with the metres it came from, the aperture rects
  recorded but not stamped, every pre-committed detector bracket with its derivation, the plan's
  drawn digest, and the renderer's own SHA-256.

## How they were made, and how to check them

```
node tools/make-scaffold.mjs study/N --out design/batches/row23-scaffold
node tools/make-scaffold.mjs study/E --camera reading --round cand6 --out design/batches/row23-scaffold
npx playwright test -c tests/playwright scaffold.spec.mjs --project=chromium
```

The frame is not drawn by the tool: it is `src/renderer.js`'s own `render()`, called in a real page
over the real baked world. `scaffold.spec.mjs` asserts that against the live `#scene` at the page's
own options, and asserts the label pass touches only rects the sidecar declared. Two of its cases
have already gone red on real defects during P0 — a legend box overhanging its own rect by six
pixels, and a route replay that compared `study/E` against `study/N`.

## Three things a reader is owed before the numbers arrive

1. **This is an obedience experiment.** The scaffold stamps the hearth where `plan.json` draws it,
   and blueprint §5 makes the approved *image* the geometric authority — row 22 exists to move the
   plan onto the painting. So the position `study/N`'s scaffold asks for is one the project has
   already ruled wrong. What the matrix measures is whether a request method gets **obeyed**, never
   which method paints the better room. Nothing from this round is ever promoted.
2. **`study/N`'s scaffold asks for a lower ceiling than its own ground truth has.** The meta's
   `storey_height_m` is the ruled 2.80, so the grid draws its ceiling at y 221 where the reference
   paints y 118 — 0.55 m apart. That is correct behaviour and it means the ceiling line is measured,
   printed, and scores nothing. It also conditions the ceiling-ramp fit the eye reading comes from,
   so each roll's ramp residuals print beside its eye number.
3. **Two horizontal spaces exist, and where.** A measured meta whose painting is wider than the plan
   rules carries both an aperture space (the corner span, where a promoted wall's click target
   lives) and a ruler space (`px_per_m_at_wall`, where the gate measures). They diverge **13.25 %**
   on `study/N`, **18.34 %** on `study/E`, **26.0 %** on `study/W`. Every metric mark on a scaffold
   is stamped in ruler space — an instruction the gate punishes for being obeyed is not an
   instruction — and the aperture rect is recorded beside it. Neither promoted wall carries a door,
   so the conflict is unexercised today and arrives with `study/E`'s promotion: **row 27** owns it.
