# platform/N — technique t2 (labelled scaffold)

**Image 1 is a DERIVED style seed, not a wall.** `style-platform.png` is `backdrops/platform/W.png` — platform/W, this room's own wall (sha256 `b8d9efefdd5b`) — with every opening and carrier on it filled in from that wall's OWN adjacent fabric by `tools/style-seed.mjs`: 1 rectangle(s), 32.94 % of the wall, the floor and the ceiling untouched. The fill report rides beside it as `style-platform.json` and the store's copy is `backdrops/style-seeds/platform-W.png` (sha256 `4a39035ad090`). every opening that was in this painting is gone from the seed: 1 way(s) through and 0 glazed opening(s) went in, and NOTHING the detectors read in the result stands anywhere the fill touched; the count did not rise, so nothing was manufactured either So it carries this room's materials, its palette and its light and NO ARCHITECTURE AT ALL: how many openings the wall being painted carries, where they stand and every dimension of them come from the layout image and the words.

**Image 3 is this wall's edge seed.** `edge-seed-left.png` is the 10 % of `backdrops/platform/W.png` that abuts this picture — its right-hand 154 columns, full frame height, cut by `tools/crop-edge-seed.py` (sha256 `72f25b6a1fc7` from a painting at `b8d9efefdd5b`). The prompt names its role in words: _Image 3 is a reference of exactly what sits at this picture's left edge - the scene continues from it seamlessly._

Seeding here is **opportunistic** — an indoor location: the strip anchors material tone and the wainscot line across the corner (promoted).

Attach `style-platform.png` as **Image 1** (platform/W, this room's own wall with its openings removed), `scaffold.png` as **Image 2** and `edge-seed-left.png` as **Image 3**, in that
order, then send `prompt.txt` verbatim. Generate 1 images and save them to the
exact paths below — the measurement runs the moment a file appears at one of them.

| roll 1 | `backdrops/source/platform-N/row23-ab082589.png` |

The prompt files are already on disk beside them. Do not rewrite them.

This wall: 213.3 px per metre at the wall plane, no carrier — unbroken cream crackle-glazed tiling above the dado band with dark bottle-green glazed tiles below.
Voice: **platform_vault** (room id); gate anchor **the tiled dado band's top edge above the floor**, 1.20 m.
Register: **g5-noappendix** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every
roll below is attributable to it: the reading of a return joins to this line through the roll id.
Write only under `backdrops/`. Never `src/`, never `design/`.
