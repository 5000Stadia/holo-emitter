# holo-emitter

This is an experimental project. The commit history is a working log, not a showcase.

Expect false starts, abandoned experiments and unfinished edges. The goal is a browser holodeck: walk into a place and feel that you are standing there. Phone first, with desktop controls too.

It sits beside pattern-buffer, which holds the world's truth, and construct, which supplies the drama. holo-emitter makes those facts a place you can stand in.

[Open the current demos in your browser](https://5000stadia.github.io/holo-emitter/lab/)

## What works today

The main client is real-time 3D, built with three.js r186. It uses WebGPU first, with a WebGL 2 fallback. Rooms and things are built by rule from the kinds catalogue in `src/make/`. They are not painted images for each camera facing.

The walkable manor is a 1660 gentry house with 35 rooms on three floors. Rooms are built by their purpose, with period materials and furniture.

Doors swing. Drawers slide. Candles light. Switches control lights across a room. Keypads draw bolts. Click a chair to sit in it, then look down into the drawer beneath you. Light is pooled to a phone's budget rather than adding a scene light for every candle.

Weather adds rain, snow and fog. Rain and snow fall outdoors and show through the windows. The ground turns wet or snowy. Snow does not cover the roofs yet.

The world document holds the state; the picture follows it. Open something, leave, and return to find it as you left it. Things you take and put down also stay put across a reload.

The public demos make no model calls during play. Kinds, story facts and dialogue are authored beforehand. Building and playing the scene run in code.

## What to try

The lab link above is the starting point. Its cards open the current demos.

- **Coherence recipes, the main demo.** Small rooms built from pattern-buffer's story facts. `switched-light` starts in darkness: find the switch and light the room. `code-lock` adds a told code, a keypad and a way out. `take-and-drop` lets you open a book, take its loose page and carry it to another room's table. Choices the facts leave open are listed.
- **Death at Michaelmas, 1660.** A murder mystery in the manor. Question the household, read papers, search drawers and chests, and build an accusation from evidence. The case and its lines are written once. It keeps your progress.
- **The manor and its land.** Walk through the house, sit at a desk, open the gates and go out into the fields. Try the weather and night cards too.
- **The object stages and other places.** Try a switch, keypad or piece of furniture on its own. The lab also has Alice's hall of doors, a London street, a forest scale test and performance tools.

The recipe addresses are:

```text
lab/manor/?plan=recipe&recipe=switched-light
lab/manor/?plan=recipe&recipe=code-lock
lab/manor/?plan=recipe&recipe=take-and-drop
```

These are working demos, not finished games. Some scenes still use plain stand-ins. The performance card (`&perf`) shows loading stages and each layer's cost on your device.

## Run locally

Serve the repository root:

```sh
python3 -m http.server 8794 --bind 127.0.0.1
```

Open `http://localhost:8794/lab/` in your browser. Use the lab cards to choose a scene. The main 3D client needs HTTP serving; double-clicking the old root `index.html` opens the earlier painted client instead.

## Tests

Checks are generated from kinds and their declared characteristics at authoring. They exercise geometry, motion, lights and mechanism reachability before a place is played. Browser regressions live in `tests/playwright/`.

Install the test dependencies and browsers:

```sh
npm install
npx playwright install chromium firefox
```

Keep the local server running, then run the named client suites:

```sh
npx playwright test -c tests/playwright \
  checks.spec.mjs emitters.spec.mjs candle-lights.spec.mjs crowd-lights.spec.mjs \
  door-lights.spec.mjs keypad.spec.mjs recipe-demo.spec.mjs facts-out.spec.mjs \
  narrator-conditions.spec.mjs keep.spec.mjs sit.spec.mjs weather.spec.mjs accuse-phone.spec.mjs \
  --project chromium
```

The current client suites include:

- `checks.spec.mjs` — catalogue, geometry, motion, placement and reachability checks.
- `emitters.spec.mjs`, `candle-lights.spec.mjs`, `crowd-lights.spec.mjs`, `door-lights.spec.mjs` — generated light contracts, switched lights and the counted phone light budget.
- `keypad.spec.mjs` — code entry and the linked door it works.
- `recipe-demo.spec.mjs`, `facts-out.spec.mjs` — story facts turned into rooms, and play written back as facts.
- `narrator-conditions.spec.mjs` — story conditions evaluated in code.
- `keep.spec.mjs`, `sit.spec.mjs`, `weather.spec.mjs`, `accuse-phone.spec.mjs` — persistence, seating, weather and the phone accusation flow.

Local full-directory discovery currently fails in `brief-room.spec.mjs`: `framesOf` is reported as a missing named export while loading `src/make/walls.js` as CommonJS. The command above selects the named suites instead.

The test configuration also has a Firefox project. Renderer-specific checks skip paths that are unavailable. Some checks use Python. Headless resource counts are not a substitute for frame-time readings on a real phone.

## Where things live

- `src/make/` — kinds, parts, room planning, placement, interaction, light and world state.
- `lab/` — the public demos and test stages.
- `tests/playwright/` — authoring checks and browser regressions.
- `design/` — intentions, plans, daily notes and evidence. It is a working record, not a claim that every planned feature is finished.

## Earlier work

The painted-wall and sprite pipeline remains in `tools/`, `replicator/`, `fixtures/` and `packs/`. It includes image prompts, the sprite ingester and baked scene fixtures. Some data and tools are still reused. This earlier work is kept, but it is no longer the main rendering path.
