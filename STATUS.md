# Row 45 — the paintings arrive by URL, one wall at a time

## What Kabe saw

> "Sometimes loading hangs on first launch. UI is present but then hangs
> without images loading. It's consistent enough in multiple browsers and
> different refreshes that it seems like it is an issue."

Nothing hung. `backdrops/baked.js` was 44 MB of base64 — all 71 promoted walls,
every world's, as `data:` URIs — loaded as a blocking `<script>` after the UI's
own scripts, and the page held its first frame until every one of them had
downloaded, parsed and decoded. The UI came up because the UI is cheap. The room
did not, because the room was carrying the whole manor.

## The rule

**A wall is fetched, not carried.** `bake-backdrops.mjs` still encodes each
promoted PNG at q92 — the row-21 number, unchanged, 2.6 MB of PNG to ~0.5 MB of
JPEG for a mean channel move of 1.7 of 255 — but it writes one file per wall to
`backdrops/served/<loc>/<F>.jpg` and leaves `backdrops/baked.js` holding the
manifest alone: which facings have a painting, what each is called, what it
weighs. 44,310,116 bytes → 14,037.

The page asks for the wall in front of it and nothing else on the way in. That
one `<img>` is in the document before the load event, so `load` still means "the
wall you are looking at is in" and every case that opens the page and reads the
canvas back is entitled to what it always assumed. After load it arms the
prefetch: the room's other three facings and each exit's arrival facing — the
whole set of walls the next input can put in front of you — so a turn or a step
lands on a picture that is already in.

**A wall that is not in yet has a picture of its own.** The grid, which is what
this product already draws for space that has not been established, plus
`painting loading…` in the readout, which is the difference between "not yet"
and "hangs". §12.2 determinism is a claim about the DOCUMENT — baked, synchronous,
unmoved; a picture arriving a moment later is presentation, and it repaints
through a path that deliberately does not count as a harness paint (a refusal
case reads `paints` across two ticks).

**A wall that fails is marked, not forgotten.** Re-asking on the repaint the
failure itself triggers is an endless fetch loop; forgetting it means a page left
open across a publish holds a grid for ever. So the mark is cleared when the view
moves: turn away and back and it asks again.

## What it cost, measured

| | critical path to the first painted wall, `?world=cyberpunk-2` |
|---|---|
| before | **45,279,701 B (45.3 MB)** — page + scripts + fixture + `library/baked.js` + all 71 paintings |
| after | **1,438,313 B (1.44 MB)** — the same, with `noodle_bar/N.jpg` (454,691 B) and a 14 kB manifest in place of the bundle |

31x. Of the 1.44 MB, 0.58 MB is `library/baked.js` (the ingested sprites, left
baked: it is under the 1 MB bar and it is `data:` URIs already parsed by the time
the first frame runs) and 0.45 MB is the wall itself.

The published tree shrinks with it: `publish-site.sh` ships `backdrops/served/`
(33 MB) and the manifest instead of the 44 MB bundle and 4.7 MB of study PNGs,
and refuses above 500 MB — the 2026-08-22 incident was a Pages build that could
not cope and served a stale site in silence.

## What holds it

- `tests/playwright/delivery.spec.mjs` — one wall on the way in (counted at the
  load event, against 71 in the manifest); the neighbours fetched after the first
  frame and no further; and a tree where **only** `study/N.jpg` exists and the
  other 70 walls 404: the first frame is still the painting, the turn into the
  hole draws the grid with `painting loading…` beside the place and the aspect,
  nothing apologises, nothing throws, and returning re-asks.
- `fixtures.spec.mjs` backdrop staleness now byte-compares **the served tree**,
  not only the manifest. The manifest holds no pixels, so a case that compared
  only it would have left the flipped-wall hole the row-21 case was written to
  close standing wide open.
- `playwright.config.mjs` passes `--allow-file-access-from-files` to Chromium.
  A `file://` page drawing a `file://` image taints the canvas there and every
  hash case reads it back — that is a browser default about local files, not a
  fact about the product (the live site serves same-origin over https and taints
  nothing). It was the last thing the `data:` bake was buying, and it cost 44 MB.

## Known red, not this row's

`fixtures.spec.mjs` "promotion staleness" is red on `main` as well — the plan
holds no facing `back_office/E`, from the loop in flight. Verified by stashing
this row's diff and running it against HEAD.
