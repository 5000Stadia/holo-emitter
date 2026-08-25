# servants_hall/W — CONSISTENCY RE-ASK 9 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In SERVANTS' HALL, every wall is plain limewashed plaster carried straight down to the floor, unbroken by any timber lining, joinery or moulding; every ceiling is plain exposed oak joists with boards between them; every floor is a floor of worn red brick laid on edge in straight courses running away from you, every brick a long narrow rectangle end-on, no square pavers and no herringbone. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured, in the ASKS rather than in the pixels: every promoted facing of this room was commissioned in the materials this plan rules for it, and N, S, W were asked in WORDING that has since been refined. The fabric is not in dispute; what is being forced is the refined wording above.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **materials** across NESW at **D = 1** (the cut is the plan's own ruling materials), and E agree with each other while this one does not.

**Image 1 is a DERIVED style seed, not a wall.** `style-servants_hall.png` is `backdrops/servants_hall/N.png` — servants_hall/N, this room's own wall (sha256 `382886b360fc`) — with every opening and carrier on it filled in from that wall's OWN adjacent fabric by `tools/style-seed.mjs`: 1 rectangle(s), 37.53 % of the wall, the floor and the ceiling untouched. The fill report rides beside it as `style-servants_hall.json` and the store's copy is `backdrops/style-seeds/servants_hall-N.png` (sha256 `cecf5cdbe5fe`). every opening that was in this painting is gone from the seed: 0 way(s) through and 1 glazed opening(s) went in, and NOTHING the detectors read in the result stands anywhere the fill touched; the count did not rise, so nothing was manufactured either So it carries this room's materials, its palette and its light and NO ARCHITECTURE AT ALL: how many openings the wall being painted carries, where they stand and every dimension of them come from the layout image and the words.

**No edge seed rides with this ask.** `servants_hall/S` — that neighbour is itself outside the room's agreeing walls, so its pixels are not evidence of what the room is; `servants_hall/N` — that neighbour is itself outside the room's agreeing walls, so its pixels are not evidence of what the room is. The materials are named in words in the prompt instead, and the words are the room's own ruling out of `tools/room-voices.mjs` — not another wall's pixels.

Attach `style-servants_hall.png` as **Image 1** (servants_hall/N, this room's own wall with its openings removed) and `scaffold.png` as **Image 2**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/servants_hall-W/row23-b3cb691a.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 170.7 px per metre at the wall plane, door + door.
Voice: **servants_hall** (room id); gate anchor **the plain oak hanging rail above the floor**, 0.95 m.
Register: **g5-noappendix** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every
roll below is attributable to it: the reading of a return joins to this line through the roll id.
The promoted painting this replaces is still at `backdrops/servants_hall/W.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
