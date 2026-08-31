# platform/N — technique t2 (labelled scaffold)

> **This ask WAITS for `platform/W`. Do not paint it until that wall's picture is on disk.**
>
> [row 42] Every location paints one wall first — its LEAD, the most-carried wall — and the other three are painted with the lead's own picture in front of the painter, which is what makes the four read as one room. This facing continues `platform/W`, which has no picture yet.

**Image 2 is this wall's edge seed.** `edge-seed-right.png` is the 10 % of `backdrops/platform/E.png` that abuts this picture — its left-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `caf7c54ed882` from a painting at `ae86700aa213`). The prompt names its role in words: _Image 2 is a reference of exactly what sits at this picture's right edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — this facing continues `platform/W`, which has no picture yet, so the ask waits for it. [row 42] Every location paints its LEAD wall first and the rest follow it; indoors the other three all follow the lead directly.

There is NO Image 1 in this packet and none is to be found elsewhere — the medium is in the prompt's own words. Attach `scaffold.png` as **Image 1** and `edge-seed-right.png` as **Image 2**, in that
order, then send `prompt.txt` verbatim. Generate 2 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/platform-N/row23-ab082589.png` |
| roll 2 | `backdrops/source/platform-N/row23-cefe9913.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 213.3 px per metre at the wall plane, no carrier — unbroken cream crackle-glazed tiling above the dado band with dark bottle-green glazed tiles below.
Situations: enclosed, follower, run-wall:corner-left, no-window, blank (see `design/playbook-facings.md`).
Voice: **platform_vault** (room id); gate anchor **the tiled dado band's top edge above the floor**, 1.20 m.
Register: **g5-noappendix** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every
roll below is attributable to it: the reading of a return joins to this line through the roll id.
Write only under `backdrops/`. Never `src/`, never `design/`.
