# holo-emitter

**[▶ Open it in your browser](https://5000stadia.github.io/holo-emitter/)**

A Myst-like scene client for the browser: generated backdrops, composited sprites, and a single
world document as the only truth — the picture is a projection of it. You turn, walk between
rooms, open a drawer, and take what you find; the world is exactly as you left it when you
return.

Static hosting only — the demo runs from `file://` or GitHub Pages with zero network requests
after load.

## Run it

Use the browser link above, or open `index.html` locally (double-click works — no server, no
build). Unestablished space renders as the holodeck grid; turn with the arrow keys or the edge
chevrons. Everything clickable is reachable by keyboard alone too — Tab to it, Enter or Space to
act — and the button in the corner fills the screen with the picture (a plain in-page fallback
takes over wherever the browser withholds real fullscreen).

So far: two rooms, four facings each, and the first of them painted. The study's north wall —
the hearth with a fire in it — is a real room now; every other direction is still the holodeck
grid, which is what unestablished space looks like from inside the emitter. Each is a room you
stand inside rather than a wall you face: the walls end in corners where the building's own plan
says they do, the side walls run back toward you, and there is a ceiling overhead at the height of
the storey — so the study is a study-sized room and the cross passage is a passage. Everything is
drawn through one lens, a 24 mm one, the same in every direction you can turn to; before that each
direction had a lens of its own and they ran from a fisheye to a portrait lens, which made every
wall of the study look like the end of a corridor. Walk east through the doorway and the passage
is already visible through it — an opening shows the room on the other side of it, not a black
rectangle. The words of the room appear beneath the picture as you go.

The painted rooms are empty while the furniture is being made: nothing in them can be picked up or
opened yet. The furnished world — the desk whose drawer opens on something, the door with a latch,
the things that ride in the strip at the bottom of the page — is one link away, at
[`index.html?world=demo-study`](https://5000stadia.github.io/holo-emitter/?world=demo-study).
Go there to see what the world *does*, not what it looks like: its objects are flat stand-in
shapes, drawn by a few lines of code, and they are standing in a painted room they were never made
to match. They are replaced by real ones next.

## Tests

```
npx playwright test -c tests/playwright
```

Headless Chromium and Firefox, both running every test. Requires `npm install` once (and
`npx playwright install chromium firefox` if no browser is cached), plus `python3`, which a few
of the tests use to redraw the floor plans and check they still come out the same.

## The replicator

The furniture, the doors and the things you pick up start life as flat generated pictures on a grey
studio ground. The replicator is what turns one of those into something the world can hold: it cuts
the object away from its ground, works out where it stands on the floor and what parts of it move,
and writes it into `library/` with a small document describing what it is and how big it really is.

```
sudo apt-get install -y python3-numpy python3-pil
python3 -m unittest discover -s replicator/tests -t . -v
```

Nothing else is needed — Python, numpy and Pillow. To put a picture through it, run it **from the
repository root** (that is what puts `replicator` on Python's path) and give the picture and the
destination as paths:

```
python3 -m replicator.ingest ~/pictures/chair.png --id oak-chair --noun "joined chair" \
  --archetype static --attachment floor_against --height-m 1.05 --width-m 0.6 --depth-m 0.55 \
  --out library/ --preview-dir /tmp/prev
```

The height, width and depth are the real object's, in metres, and it will tell you if they disagree
with the picture's own proportions — a chair declared a third wider than it draws is a chair that
will stand in the room at the wrong size beside everything else.

It is hard to satisfy, and it says why: a halo left around the cut, a gap it missed between the
legs, a shadow baked into the picture, a drawer that slides off the front of the thing it belongs
to. Some things it only warns about — a light coming from the wrong side is one, because that is a
judgement for the eye rather than for a number — and it says those out loud too, without refusing.
Add `--check` to hear the verdict while it writes nothing at all, and `--preview-dir` to see the
object composited small against a dark room and a light one, closed and open, with the shadow pool
the room will actually draw under it — which is where a bad cut shows.

When it refuses, the exit code says whose problem it is: **2** means the picture needs making
again, **3** means the command does (a travel you typed, a size you gave), **4** means the contract
file itself is wrong, and **5** means the object is outside what the settings were built for.

## Editing the world

There are two worlds in the page and the link picks between them: `fixtures/nav-manor/` is the
painted one you arrive in, and `fixtures/demo-study/` is the furnished one at `?world=demo-study`.
Each holds the same four documents (`world.json` is truth, `staging.json` is presentation,
`narration.json` is what the room says, `viewstate.json` is where you boot). Browsers cannot fetch
JSON from `file://` pages, so each world is baked into a `fixture.js` beside it — after editing any
fixture JSON, run the bake for that world:

```
node tools/bake-fixtures.mjs                                   # the furnished world
node tools/bake-fixtures.mjs --fixture-dir fixtures/nav-manor   # the painted one
```

The paintings themselves are baked the same way and for the same reason:
`backdrops/<room>/<facing>.png` is the picture, and `node tools/bake-backdrops.mjs` embeds the
promoted ones into `backdrops/baked.js` so the page can draw them with nothing to fetch. A wall
only gets there once it has been measured and admitted — `python3
design/plan-draft/measured/measure.py` measures the candidates, `gate.py` prints the verdict, and
`node tools/promote-backdrop.mjs --facing study/N --candidate <png>` refuses any candidate the gate
did not admit.

The bake checks the fixtures first and refuses to bake an invalid world (a coordinate in
`world.json`, a world fact in `staging.json`, a reference that resolves nowhere, a missing
narration line) — it prints numbered findings instead. The page prints the bake's fingerprint to
the browser console when it loads; if it did not change after your edit, the bake did not run.

## The map

`fixtures/demo-study/plan.json` is the building itself, in metres: a two-storey manor of
twenty-two rooms, courts and gardens, with the two rooms you can walk today sited inside it. It
says where every wall, door, window, hearth and stair stands, and where you are standing when you
look at each one. The drawings in `design/plan-draft/` are made from it, not the other way round:

```
node tools/plan-projection.mjs --rebuild-facings   # where you stand in each room, from the rooms
python3 design/plan-draft/draw_plan.py             # the two floor plans, from the document
./design/plan-draft/render.sh                      # and as pictures, at twice the size
```

Change a room in the plan and re-run all three, and the drawing changes with it. The first
command is not optional after a room moves: the plan stores where you stand in each room and how
far the wall is, and moving a wall makes those stale — the drawing script refuses a plan whose
stored standpoints no longer match its rooms rather than drawing a lie.

A redrawn sheet says **UNAPPROVED REVISION** on its face until a human approves it and the new
hash is written into `design/plan-draft/approval.lock`; the full recipe, including that step and
the tests that hold the approved drawing, is in `design/plan-draft/README.md`. The hash covers what
the sheet draws. Change something it does not draw — where a candlestick stands, say — and the
sheet keeps its approval and says on its own face that something outside the drawing has moved.

The rooms you walk take their shape from this document: how wide each wall is, how far you stand
from it, how high the storey is, and therefore where the corners fall and where the ceiling sits.
Move a wall in the plan, re-bake, and the room changes on screen.

The bake will not accept a building whose rooms overlap, whose doors lead nowhere, whose rooms
cannot be walked to from the front of the house, or that puts a wall where the house does not
build one.
