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
chevrons.

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
narration line) — it prints numbered findings instead. The page footer shows the bake's
fingerprint; if it did not change after your edit, the bake did not run.
