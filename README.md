# holo-emitter

A Myst-like scene client for the browser: generated backdrops, composited sprites, and a single
world document as the only truth — the picture is a projection of it. You turn, walk between
rooms, open a drawer, and take what you find; the world is exactly as you left it when you
return. Ships with **the replicator**, a build-time pipeline that turns a generated image into a
library sprite with anchors and metadata.

Static hosting only — the demo runs from `file://` or GitHub Pages with zero network requests
after load.

## Run it

Open `index.html` in a browser (double-click works — no server, no build). Unestablished space
renders as the holodeck grid; turn with the arrow keys or the edge chevrons.

So far: two rooms on the holodeck grid, four facings each, turning only. Entities, doors, and
the drawer arrive in later layers.

## Tests

```
npx playwright test -c tests/playwright
```

Headless Chromium; requires `npm install` once (and `npx playwright install chromium` if no
browser is cached).

## Editing the world

The world lives in `fixtures/demo-study/*.json` (`world.json` is truth, `staging.json` is
presentation, `viewstate.json` is where you boot). Browsers cannot fetch JSON from `file://`
pages, so the fixtures are baked into `fixtures/demo-study/fixture.js` — after editing any
fixture JSON, run:

```
node tools/bake-fixtures.mjs
```

The page footer shows the bake's fingerprint; if it did not change after your edit, the bake did
not run.
