# Reading "Building Into the Fusion Era" for holo-emitter (2026-10-14)

Kabe's doc (rev 21, 2026-10-14; local copy `~/.config/colony/monitor/fusion-era.md`), read once, with no test or model runs, for what it means here. Anything below that would change scope, order or what gets built is Kabe's call. It is offered here and nothing has been started.

## Where the doc's picture of holo-emitter is out of date

- **The engine.** The doc describes a Myst-like 2D client: painted walls, composited sprites, standpoint cameras, with a Three.js build "somewhere, owner unconfirmed". The Three.js build is this project's main client, and has been since 2026-10-06, on three.js r186 with WebGPU first and WebGL 2 as fallback.
  - The manor is real-time 3D geometry: 22 rooms, walked freely by thumb or keyboard.
  - Its things come from a kinds catalogue, are built by rule, and work: doors, drawers, candles, switches, keypads, seats.
  - The phone tier is tested in every suite.
  - The painted 2D pipeline still exists as fixtures and tools (replicator/, `fixtures/*/world.json`, `design/plan-draft/approval.lock`), but it isn't the product path. The painted-shell rooms Kabe graded "Phenomenal" (2026-09-28) live on as the look's textures on real geometry.
- **The camera.** Directive 7 says to constrain the camera to standpoints. That fits painted walls, not this build. Kabe has asked for free walking, sitting in chairs and looking down into drawers. Free movement is what the 3D build was chosen for. Standpoints remain useful as stations: we already set testers and story beats down at the spot.
- **Model calls.** Not "build time only". The page plays with no model at all. Story text is read by pattern-buffer's library; the voice and narrator only pick and word lines; images are built procedurally.
- **Photonic** is the people layer: bodies, wardrobe, walking and seats. It is held private in our tree until Kabe answers g57063d. Its own lead should state its role, as the doc asks.

## Takeaways, each with a recommendation

1. **Answer keys: strong here, except for taste.** Most of what we build is graded by generated checks: kinds refused at definition, 40-plus checks, kept tables compared for "same data", counts instead of timings, and mutation runs proving a check can go red (tonight's light contract and narrator conditions). What has no key is the look: lighting, weather, style fit.
   **Rec:** keep Kabe's graded side-by-sides as hashed verdicts, as approval.lock did for the plan. A "looks right" test would then fail when a graded still drifts beyond tolerance on the pinned software renderer. This is a scope call: it adds a review step for Kabe whenever we change the look.
2. **C2, the scene projection, is half-built already.** The recipe golden lane (`patternbuffer.recipe-facts/1` → `planRecipe` → a playable room, with the proof) is a C2-shaped seam with goldens on both sides (r1.4.1, text and authored facts). The outbox (`src/make/facts-out.js`) is the reverse direction: placements and play events in pattern-buffer's words.
   **Rec:** propose to pattern-buffer that C2 grows from recipe-facts/1 rather than starting fresh. This is cross-project contract work, so it needs Kabe's nod.
3. **One truth.** The doc wants holo-emitter's world store to be a projection of pattern-buffer's log. Ours (`src/make/world.js`) already uses pattern-buffer's shape (entities, assertions, latest-wins) and lives in the browser's localStorage. Making it a true projection needs pattern-buffer's JS module in our public repo, and that is gate gdc6893, still open with Kabe.
   **Rec:** answer gdc6893 with this doc in mind. The doc's direction argues for yes.
4. **C4, structured acts.** This already exists: every click is one works act, written as a fact (take, put, a state, sitting, a keypad's code).
   **Rec:** offer the outbox's event facts to construct as C4's first form, with facts-out.spec as the golden. This is cheap, but it is a contract, so construct and Kabe should agree it.
5. **Keys at the scene-graph level, not pixels.** This is already our practice: facts dumps, counted costs, a footprint mask checked as data. The missing piece is a byte-exact golden of each recipe's placements: the same facts in should give the same placements out. That is the doc's differential test.
   **Rec:** add one golden file per recipe. It is small and within the main demo's approved scope, so I'd do it after the token crunch unless Kabe says otherwise.
6. **The ten-second proof of continuity.** Take-and-drop now survives a reload: the page stays on the hall's table. That is exactly the doc's "the drawer you opened is open".
   **Rec:** script the continuity clip from it (open, take, leave, come back, still there). Add the grid-resolving-into-a-room transition when a room arrives (missing parts already render as holodeck grid). Both are player-facing features, so Kabe's call.
7. **The phone budget.** The per-layer cost line exists (`&perf`), and tonight's weather is counted on the phone tier. What's missing is a real iPhone reading.
   **Rec:** Kabe opens three links with `&perf` (the dark room, rain at the forecourt, the case house) and screenshots the card. Two minutes of his time gives real numbers that every later budget can lean on.
8. **Distribution as a Claude artifact.** The doc's first channel conflicts with our size. The published runtime tree is about 173 MB, with assets on jsDelivr and per-device textures. An artifact page holds 16 MB, and its scripts may load only from a few CDNs.
   **Rec:** before choosing artifact-first, measure what a minimal artifact build of one recipe room needs (three.js bundled and pinned, procedural textures only). This is research for later, so Kabe decides if and when.
9. **The art pipeline doesn't split here.** Things are built procedurally from kinds and parts, so there are no generated meshes and no licensed asset packs. The doc's art-pipeline risk is mostly avoided. Keep it that way: ideas only from other projects (cybercity, worldspring with credit).
10. **Engine creep, and the research loop (risk 9).** This applies to us honestly. R79 ran two review rounds, and tonight added weather and sitting refinements. Each is grounded in Kabe's words, but none moves Gate B (a stranger plays a session at zero founder cost).
    **Rec:** ask Kabe whether this project's next milestone should be shaped as Gate B's holo-emitter slice (C2/C3/C4 consumed, a flagship room, the phone budget met) rather than deeper engine work. This is the biggest scope question in the doc for us.

## What I'd bring to Kabe as decisions

- Reshape the next milestone toward Gate B's slice? (takeaway 10)
- gdc6893, pattern-buffer's JS module in our public repo: the doc argues yes (takeaway 3).
- Founder verdicts as hashed keys for the look (takeaway 1).
- The continuity clip and the grid transition as the next player-facing work (takeaway 6).
- Whether artifact-first distribution is worth a size study (takeaway 8).
