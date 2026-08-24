# entrance_approach/N — RE-ASK 5 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> camera PASS; held for the promotion instrument [suspect-painting]: the left and right returns of this wall converge at y 428.0, which puts the viewer's eye 3.160 m above the wall-foot line this frame draws — nobody stands there, and the frame's own ruler says otherwise, so the two readings of one picture disagree. Both returns must read as real receding surfaces: each meets the surface overhead along ONE straight unbroken line running from its corner to the edge of frame, and those two lines must meet each other at row 526 of the 1024-row frame — the eye line Image 2 marks. The wall-foot line, the corners and the scale stay exactly where Image 2 puts them.

**Image 3 is this wall's edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/entrance_approach/W.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `3778671e1c9a` from a painting at `0496f61b7883`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Seeding here is **required** — an open location: continuity across the turn is the point, and this neighbour is painted.

Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/entrance_approach-N/row23-607d5f66.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 52.4 px per metre at the wall plane, window + window.
Voice: **outdoors_walled** (room id); gate anchor **the stone string-course above the ground**, 0.95 m.
The earlier ask for this wall is still at `../` and is not overwritten.
Write only under `backdrops/`. Never `src/`, never `design/`.
