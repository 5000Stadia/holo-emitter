# long_gallery/W — RE-ASK 3 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> camera PASS; held for the promotion instrument [promotion-refused]: promote refused: long_gallery/W: the plan rules 2 way(s) through this wall and the painting shows 1 — a doorway the world walks through with no hole in the picture is not promotable, because a player 

**Image 3 is this wall's edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/long_gallery/S.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `69fee64d2bef` from a painting at `ef86f296459d`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — an indoor location: the strip anchors material tone and the wainscot line across the corner.

Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/long_gallery-W/row23-a761f3a6.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 135.6 px per metre at the wall plane, window + window + door + door + window + window.
Voice: **long_gallery** (room id); gate anchor **the wainscot chair-rail above the floor**, 0.95 m.
The earlier ask for this wall is still at `../` and is not overwritten.
Write only under `backdrops/`. Never `src/`, never `design/`.
