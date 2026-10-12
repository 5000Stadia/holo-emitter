# How a sibling project's module comes into holo-emitter (joint draft with Photonic, 2026-10-12)

**Kabe, 2026-10-12**, on whether Photonic's people code may go into our public repo (R60):

> "For one I simply want what is the most elegant introduction. Eventually, all of these modules will likely combine to one system that has a shape that makes more sense than where we are at right now because we have so many arms that need deep Detailing and focus. That being said we run into this issue. To properly develop photonic, we need to run it in HE this may be a moment to consider how to both elegantly shape those projects to be able to be developed with a clean line while still being maximally integratable, and also with that type of posturing can improve the architecture and rule set that we have for what proper integration looks likefor effective future connectors turned integrated elements. That should be a discussion between U2 and the Answer should be the direction of your best form for implementation."

Kabe, the same day, to Photonic: copying Photonic's code into holo-emitter's public repo: **"Not yet"**. Our vendored copy stays local and untracked, and the 300-in-the-manor whole-frame test waits.

**My reading:**
- **The question is wider than R60.** Kabe wants one way in for every sibling project, which will end as one system: Photonic now, then pattern-buffer and construct, then connectors to come.
- **Each project develops on its own clean line and still runs live inside holo-emitter.** Photonic can't be properly developed except in our rooms.
- **The rules for integration are to be written down** and improved by this first case.
- **"U2"** is Photonic's agent and me deciding together. The answer is our best form, built. Kabe doesn't pick between options.
- **What stays his:** anything public, and any milestone this reshapes.

**How we got here:**
- Opening draft: m157366.
- Photonic's reply: m62c801. It agreed with all six rules, sharpened four and added four.
- Prior art: `prior-art-integration.md`.
- Still to come: two fresh outside opinions before we settle (colony consult). This shapes every module after Photonic.

## The rules

1. **Host and module, and who owns the data.**
   - holo-emitter hosts the world. A module never imports from the host. Everything it needs comes through the `ctx` it is handed, and it loads its own data relative to its own `import.meta.url` (gait basis, body packs, atlases), so the host never knows a module's paths.
   - Entry: `await makeX(THREE, { ctx })`.
   - Each module exports `CONTRACT = { name, semver, requires, optional }`. The host checks the major version at load and refuses a mismatch by name. Semver is for the contract; pins are commit hashes.
   - `three` and `three/tsl` stay bare specifiers resolved by the host's import map. There is one three.js, the host's.
2. **One frame: a third, tiny shared package.** It holds data and validators only, and nothing depends on it for behaviour. Neither side owns it; both pin it. It covers:
   - axes (y up, metres, facing +z at heading 0) and floors with their heights;
   - the id format;
   - time (seconds; world clock against frame clock);
   - colour space and tone mapping (skin must agree with the host's lights);
   - the frame budget (20 ms whole: 13 ms manor, 7 ms people, from g7a1a75, to be revised on Kabe's phone);
   - the three.js version.

   Our adapter's [x, y, h] to [x, y, −z] flip becomes a conversion in that package, used only until it is gone.
3. **Live development without copying.** Pages load modules through an import map.
   - In production a name points at a pinned commit of the module's public runtime line.
   - On the desktop, `?dev=NAME` points at the module's own working tree, served locally with CORS. That is single-spa's import-map-overrides pattern.
   - iOS Safari won't reliably load http://localhost from an https page, so the phone uses a pinned preview through jsDelivr (`cdn.jsdelivr.net/gh/<repo>@<sha>/…`).
   - Updating is a one-line pin bump.
4. **Contract tests both ways.**
   - holo-emitter publishes a recorded `ctx` fixture: the manor's ground (`walk.stand`), routes and `place.roomAt`, serialised. Our host checks (nothing floats, no wall passing, body fits door, faces never fight) then run in node in the module's CI before every pin, with no renderer.
   - The module's conformance suite runs against our real `ctx` the other way. For Photonic that is: the same document gives the same person, the golden 200 digest, and state round-trips.
   - A failure names whose side broke.
5. **Capabilities, not internals.**
   - The host offers named capabilities, and a module declares which it needs, so a test host can stand in.
   - Offered today: `walk.route`, `walk.stand`, `place.roomAt`, `claims`.
   - Wanted next: `budget`, a world clock and date, surfaces and seats with heights, and a line-of-sight query.
6. **The public line.**
   - Each module keeps its private working repo, plus a public runtime line built from it by a script. The runtime line holds only what runs, with licences.
   - holo-emitter's public site serves only pinned runtime lines.
   - Making any line public is Kabe's call, per module.
7. **Lifecycle.** A module offers `dispose()` and `state()`/`add(state)`, so a dev reload or a pin bump inside a running world swaps it without losing anyone.
8. **Budget in, cost out.** `ctx.budget` tells a module its milliseconds. The module reports `stats()` (what it drew per tier, its CPU ms a frame) and adapts to stay inside. Whether "the cost justifies the delivery" can then be checked live.
9. **Events out, not callbacks in.** A module never calls into the host mid-frame. The host polls `events()` (arrived, no_way, bumped, said_end, …), so neither side re-enters the other.
10. **The same pattern beyond JavaScript.** pattern-buffer is Python behind a JSON-lines child. It keeps the same contract with semver, conformance both ways and declared capabilities. Only the transport differs, so construct and pattern-buffer fit later.

## What it asks of Kabe, once settled

One decision: a public runtime line for Photonic, either as `/lib` beside `/lab` in 5000Stadia/photonic-phone-test or as a new repo. holo-emitter's site would pin it. Our own repo still never holds a copy, so his "Not yet" stands as he said it. This goes to him after the outside opinions.

## Until settled

Photonic's vendored copy stays untracked and off the site.
