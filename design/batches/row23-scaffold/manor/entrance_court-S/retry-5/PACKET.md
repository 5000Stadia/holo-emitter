# entrance_court/S — RE-ASK 5 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> draw 1.136x larger: 38.3 px/m at the far line, not 33.7

> **This ask waits for `entrance_court/E`.**
>
> entrance_court is an open location — no wall corners stand between its facings, so a seam here is a seam in open country. Its facings are painted in adjacency order from the first completed direction, and this one continues `entrance_court/E`, which is not painted yet. Row 38's one licensed exception to one-pass parallelism, and it is scoped to open locations.

Attach `style-seed-warm.png` as **Image 1** and `scaffold.png` as **Image 2**, in that
order, then send `prompt.txt` verbatim. Generate 2 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/entrance_court-S/row23-e117db11.png` |
| roll 2 | `backdrops/source/entrance_court-S/row23-39248dd0.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 38.3 px per metre at the wall plane, open_edge.
Voice: **outdoors_open** (facing type `open` — no wall stands at this wall line); gate anchor **the boundary wall coping above the ground**, 0.95 m.
The earlier ask for this wall is still at `../` and is not overwritten.
Write only under `backdrops/`. Never `src/`, never `design/`.
