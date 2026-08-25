# master_bedchamber/W — CONSISTENCY RE-ASK 1 (technique t2, labelled scaffold)

> **Why this wall is being asked again**
>
> This room is ruled to ONE set of materials and this facing does not show them. In MASTER BEDCHAMBER, every wall is oak wainscot to chair height with wall hangings above it, those hangings being a full set of woven tapestry hangings in faded green, umber and dull gold, hung from a rail just below the ceiling and falling to the wainscot capping; every ceiling is a plain lime-plastered ceiling; every floor is wide oak floorboards. Paint exactly those materials on every surface in this view and nothing else — not a different wall lining, not a different ceiling, not a different floor. Measured: this room's ceiling splits EW against NS with NO majority (worst pair D=4.474), so the materials above are the plan's ruling and not another wall's.

This wall is already promoted. It is being asked again because the room it stands in does not read as one room: `design/plan-draft/measured/room_consistency.py` measures **ceiling** across ENSW at **D = 4.474** (the cut is 3.75), and the room splits EW against NS with no majority — so every facing is being re-asked and the ruling comes from the room's voice, not from another wall.

**No edge seed rides with this ask.** `master_bedchamber/S` — that neighbour is itself outside the room's agreeing walls, so its pixels are not evidence of what the room is; `master_bedchamber/N` — that neighbour is itself outside the room's agreeing walls, so its pixels are not evidence of what the room is. The materials are named in words in the prompt instead, and the words are the room's own ruling out of `tools/room-voices.mjs` — not another wall's pixels.

Attach `style-seed-warm.png` as **Image 1** and `scaffold.png` as **Image 2**, in that
order, then send `prompt.txt` verbatim. Generate 1 image(s) and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/master_bedchamber-W/row23-13474627.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 157.9 px per metre at the wall plane, window.
Voice: **bedchamber** (room id); gate anchor **the wainscot chair-rail above the floor**, 0.95 m.
The promoted painting this replaces is still at `backdrops/master_bedchamber/W.png` and is not overwritten by this packet; promotion is the sweep's decision, not this emitter's.
Write only under `backdrops/`. Never `src/`, never `design/`.
