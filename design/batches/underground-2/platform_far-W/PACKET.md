# platform_far/W — technique t2 (labelled scaffold)

**Image 1 IS THE WALL THIS PACKET PAINTS.** `same-wall-platform-W.png` is `backdrops/platform/W.png` — the promoted painting of platform/W, the SAME wall this ask repaints from further back. It rides RAW (nothing filled, nothing removed); the prompt's own Image 1 sentence carries the identity and the camera move. Nothing in it is another room.

**Image 3 is this wall's edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/platform_far/S.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `9cb94f7e057d` from a painting at `bbcad055fecf`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — an indoor location: the strip anchors material tone and the wainscot line across the corner (promoted).

Attach `same-wall-platform-W.png` as **Image 1** (platform/W, this room's own wall with its openings removed), `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/platform_far-W/row23-a6a27b21.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 91.4 px per metre at the wall plane, door.
Voice: **platform_vault** (room id); gate anchor **the tiled dado band's top edge above the floor**, 1.20 m.
Register: **g5-noappendix** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every
roll below is attributable to it: the reading of a return joins to this line through the roll id.
Write only under `backdrops/`. Never `src/`, never `design/`.
