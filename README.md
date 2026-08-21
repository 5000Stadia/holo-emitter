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

So far: two rooms on the holodeck grid, four facings each, furnished with stand-in shapes while
the real art is fabricated. Click things — the desk drawer opens (something waits inside), the
door between the rooms opens and takes you through, and what you pick up rides in the strip at
the bottom of the page. The words of the room appear beneath the picture as you act.

## Tests

```
npx playwright test -c tests/playwright
```

Headless Chromium and Firefox, both running every test. Requires `npm install` once (and
`npx playwright install chromium firefox` if no browser is cached).

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

The world lives in `fixtures/demo-study/*.json` (`world.json` is truth, `staging.json` is
presentation, `viewstate.json` is where you boot). Browsers cannot fetch JSON from `file://`
pages, so the fixtures are baked into `fixtures/demo-study/fixture.js` — after editing any
fixture JSON, run:

```
node tools/bake-fixtures.mjs
```

The bake checks the fixtures first and refuses to bake an invalid world (a coordinate in
`world.json`, a world fact in `staging.json`, a reference that resolves nowhere, a missing
narration line) — it prints numbered findings instead. The page prints the bake's fingerprint to
the browser console when it loads; if it did not change after your edit, the bake did not run.
