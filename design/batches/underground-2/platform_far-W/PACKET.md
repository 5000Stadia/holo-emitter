# platform_far/W — technique t2 (labelled scaffold)

**Image 1 IS THE WARP'S OWN OUTPUT for this very view** — `true-shape-platform_far-W.png`, copied from `backdrops/source-warped/platform_far-W/warped.png`: architecture geometry-exact and full-frame, objects ovalled by the per-axis correction, and every zone the warp's fill had smeared BLURRED IN PLACE (the revealed mask decides where) - full-frame, no margins, nothing to expand into. The prompt asks: keep every line of architecture and the framing exactly (corners and cornice may not move outward), repaint the blurred areas sharp, redraw every OBJECT in its true shape (a circle stays a circle) [true-shape recreate, 2026-08-30 — the painter re-normalizes shapes unless ordered to copy, and a full-frame reference leaves nothing to zoom into].

**Image 3 is this wall's edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/platform_far/S.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `c9fee6194405` from a painting at `c0ced8b80f93`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — an indoor location: the strip anchors material tone and the wainscot line across the corner (promoted).

Attach `true-shape-platform_far-W.png` as **Image 1** (the warp's geometry-exact output of this very view, objects to be redrawn true), `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 2 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/platform_far-W/row23-a6a27b21.png` |
| roll 2 | `backdrops/source/platform_far-W/row23-95cdd884.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 91.4 px per metre at the wall plane, door.
Situations: enclosed, lead, deep-view, same-wall-image, door, no-window (see `design/playbook-facings.md`).
Voice: **platform_vault** (room id); gate anchor **the tiled dado band's top edge above the floor**, 1.20 m.
Register: **g5-noappendix** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every
roll below is attributable to it: the reading of a return joins to this line through the roll id.
Write only under `backdrops/`. Never `src/`, never `design/`.
