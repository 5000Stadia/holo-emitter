# door-leaf-plank-oak — the leaf that goes in a detected door frame

**What it replaces.** `src/placeholders.js`'s `door-leaf-plank-oak-v1`, which is
procedural placeholder art and says so on its own record (`placeholder: true`,
`provenance.painter_ask` pointing here). The renderer already places it: row 42
fits a leaf to the rectangle `door_measure.py` read off the wall's own painting,
so this sprite arrives into a job that is already working.

Send `prompt.txt` verbatim. **Attach no image.** Generate **1** image and save it
to the exact path below.

| roll 1 | `library-src/door-leaf-plank-oak/source.png` |

**Transparent ground.** This is a SPRITE, not a wall: everything that is not the
door leaf must be transparent, because what is behind it is the painted doorway
and the room through it.

**Neutral light** — row 37's rule [HUMAN, 2026-08-24, verbatim: *"all panels meed
to have no light source and there should be a light lighting shader over the top
regarding light sources"*]. This supersedes the orientation contract's `UL45` key
for every asset generated from here on: the leaf is lit by the scene it is placed
in, and any key painted into it is light in the wrong place forever.

**The one thing this leaf must have that `door-plank` may not.** A READABLE HINGE
SIDE, on the viewer's LEFT. Blueprint §11 authors `door-plank` visually symmetric
on purpose — one image serving a doorway seen from two rooms — and row 42 swings
the leaf to its hinge side, which needs a side to swing to. Straps, plates and
pintles on the left; ring pull over on the right.

**Proportions are not fixed and do not need to be.** The renderer scales this to
the painted opening on both axes, and the manor's painted doorways run from
0.71 m to 1.78 m wide. Draw an honest leaf at roughly 0.9 m × 2.0 m; the fit does
the rest, and the residue is recorded on the record as `provenance.v1_aspect`.

Second state (`door leaf swung near-flat, close to edge-on`) is a follow-up ask
and NOT part of this one: the placeholder's own open state ships until then.

Write only under `library-src/`. Never `src/`, never `design/`, never `backdrops/`.
