# holo-emitter — intention

## What we're making

In Kabe's words [HUMAN]: "holo-emitter, a Myst-like holographic scene client — a browser world you navigate by turning and walking, built from generated backdrops with composited sprites, where a single document is the only truth and the picture is a projection of it. Plus the replicator, the build-time pipeline that turns a generated image into a library sprite. It sits beside pattern-buffer (the truth store) and construct (the drama engine) in the 5000Stadia family, and depends on neither. Unestablished space renders as the holodeck grid, in-fiction and literal. M0 is two rooms, four facings, a drawer that opens, a key you did not know existed until it did."

## What "good" means here

Kabe's bar, verbatim [HUMAN]:

- "The flip test is the bar": "composite versus backdrop-only, three seconds each, and NOTHING may read as a sticker. If it reads as a collage of cut-outs the project has failed no matter how correct the state machine is."
- "The document is the sole truth and the picture never lies about it" — checkable as blueprint §12.2 (determinism) and §12.3 (state isolation).
- "Knowledge-frame rendering is honest — the key does not exist on screen until it is revealed" — checkable as blueprint §12.4.
- "Leave a room and return and the world is exactly as you left it" — checkable inside blueprint §12.1.
- "I want a person to feel like they are standing somewhere, not looking at a diagram."

What "not a sticker" decomposes into — extracted by opening the anchors (below), so two builds can be compared item by item:

1. **One light.** Every sprite shares the backdrop's key direction and colour temperature (contract `UL45` + `key_tint` pull). In the Riven frame, rail, rock, and water share one sun and one haze.
2. **Contact.** Every grounded object darkens the ground under it. Machinarium pools occlusion at every contact point; nothing sits on a floor without it.
3. **Occlusion chains.** Objects overlap objects, not just the backdrop (draw order by baseline). Myst's frame sells depth with column-before-building, ship-hull-behind-waterline — not with scale.
4. **One hand.** Sprites and backdrops share palette, grain, and rendering style; interactables are distinguished by position and behaviour, never by looking pasted (Machinarium's whole craft).
5. **The camera has feet.** Consistent eye height (contract 1.6m) and facing geometry, so the viewer infers a body position — Riven's rails are cut by the frame bottom at your own feet.

The replicator's bar: gates in blueprint §9.4 are the floor; a sprite that passes gates but fails the flip test has failed.

**Anchor:** Myst and Riven [HUMAN: "for the standing-in-a-place feeling"] — commercial, so the agent side opens stills and Let's Plays (Wikipedia files `Myst-library and ship.jpg`, `Riven-prison.png`; YouTube walkthroughs), and Kabe runs the played side of any comparison themselves. Secondary anchor, Navigator-added [AI]: Machinarium (Amanita Design) for 2D backdrop-plus-object compositing craft — openable the same way (`Machinarium-ss.png`). Comparisons judge the five decomposed qualities above plus Kabe's "standing somewhere" sentence.

## What everything passes through

- The **orientation contract** (blueprint §10): every generated sprite and backdrop prompt appends its blocks. Sprite arrivals are checked by gate §9.4e (warn-only, deviation recorded); backdrops never pass the ingester — their light contract is the authored `key_dir` and horizon fields (§5), asserted at §12.5.
- The **one-light and contact rules** (qualities 1–2 above): enforced by renderer tint and contact shadow (§7), judged at the flip test.
- The **truth/presentation split**: `world.json` never holds pixels, `staging.json` never holds facts, the renderer is the only meeting place (§2). Enforceable by schema check.
- The **envelope** as the only mutation path (§8); the renderer stays a pure function (§7).
- The M0 **material world**: c. 1660 English interior — oak, iron, brass, vellum, leaded glass — one key light throughout.
- **Provenance tags** on decisions in design documents: [HUMAN] and [AI], per the playbook — human-tagged decisions cannot be overruled by an agent.

## What it must never do

- **No runtime network calls, ever** (§12.7: zero requests after load, runs from `file://`). A backend dependency makes this a different product.
- **The renderer never reads unknown entities** — knowledge honesty is load-bearing, not cosmetic (§3).
- **Truth never gains coordinates** — the day `world.json` holds a pixel, the projection premise is dead.
- **The picture never changes when the world doesn't** (§8: invalid intents emit no events).

## Where it goes

Kabe [HUMAN]: "Remote is already configured at github.com/5000Stadia/holo-emitter, public, empty — push gate-approved work as the method says, no per-push asks." Branch `main`. Standing authority, Navigator publishes: each spec row's closing commit is pushed when it closes; nothing unexamined is pushed alone (this front-door scaffold travels with row 1's first close). `design/` travels with the code [AI-predicted from the method repo's own practice — correct me]. GitHub Pages hosting is enabled as part of Done (§12.7), same standing authority. Anchor screenshots are studied from their public routes, never committed — this repository is public and those frames are not ours.

Other irreversible acts: image generation via the ChatGPT/Codex image path is an authorized hand [HUMAN: "the ChatGPT image path is a legitimate hand for backdrops and sprite sources"]; any *new* paid account or spend beyond existing subscriptions is asked first. Nothing else irreversible is authorized standing.

**The asset hand**, split by class [HUMAN]: "the EIGHT BACKDROPS set the whole look - route those through me interactively, generations until the human loves the room, exactly the fishing-game loop. The EIGHT SPRITES are contract-driven and gate-checked - autonomous hand, my eye batched at the flip test." Mechanically [AI]: backdrops — the Navigator authors a per-facing prompt sheet (contract blocks appended, `key_dir` UL, calibration feature named); Kabe drives generation in the ChatGPT image UI, taste applied at generation time, and drops winners into `backdrops/source/`. Sprites — a per-batch spawned tool subagent (hands, not minds: it reads only the contract and the sprite's record stub) calls the OpenAI Images API (`gpt-image-1`) via `OPENAI_API_KEY` from the environment; outputs go straight through the replicator's gates, and gate failures regenerate. The key is supplied by Kabe, lives in the environment or a git-ignored file, and is never committed. Written context holds style — the contract externalizes what the profiled studio kept in session memory [HUMAN: "written context beats lived context; the spec already made that bet"]. No standing second seat.

## The spec list

Rows package Kabe's blueprint [HUMAN]; row text and done clauses are Navigator-authored [AI] unless quoted. **V-stages** (playbook §5.3): V1 = correct geometry and behaviour on placeholder art; V2 = real assets, pre-human-gate; V3 = flip-test passed by Kabe. A failed human gate or lost comparison quality allocates *new* rows (Next ID) — closed rows are never reopened, and their pushed closing commits stand.

| # | What to build now | What done looks like |
|---|---|---|
| 1 | Static shell and renderer skeleton: `index.html`, renderer drawing holodeck-grid placeholder backdrops for both rooms × four facings from schema-complete `world.json`/`staging.json` fixtures (blueprint §3–4 as amended), `turn` via arrow keys and edge chevrons — no navigation or mutation path beyond §8's `turn`. | Opened from `file://`, each room's four facings cycle by turning; both rooms verified by rendering their viewstates directly from the fixture, not via any added navigation; renderer is a pure function; §12.2 first clause (identical fixture + viewstate twice → identical hash) green. V1. |
| 2 | Full harness and world behaviour on placeholder sprites: `toggle`/`take`/`go`, envelope, knowledge reveal, refusals, inventory strip, narration, ground-plane math, staging validator (rejects `mirror:true`, requires the named overlap pairs) (§5, §7, §8). | §12.1 (walkthrough with refusal cases), §12.2 (both clauses), §12.3, §12.4 (positive filter test), §12.8 (mechanisms fire + overlaps intersect), §12.9 (narration coverage) all green on placeholders. V1. |
| 3 | Replicator ingest v1: matte, anchors, parts, two-state mode, thumbs, gates, `record.json`, `contract.json` (§9–10). | Both 1660s desk generations pass matting and gates; the teardrop-pull desk lands as `desk-joined-oak-1660` with working `drawer_front`; two-state alignment gate and thumb gate exercised by unit tests. |
| 4 | Asset production, probe first: study/N backdrop (Kabe-driven, per the asset hand in *Where it goes*) + desk sprite (autonomous hand) composited, flip pair to Kabe **before** the remaining assets; then 8 backdrops + full meta (`key_dir`, `horizon_y`, `calibration_ref`) and 8 sprites through the replicator, staged (§11). | Probe pair delivered and passed; all assets gate-green in `library/` and `backdrops/`; §12.5 (geometry + horizon) green on all eight facings; full-browser screenshots (1280×800, cold `file://`) of all eight facings batched for Kabe. V2. |
| 5 | Integration and acceptance: real assets through the full walkthrough, README GIF. | §12.1–12.5 and §12.7–12.9 green; 20-second walkthrough GIF in the README; §12.6 flip pairs batched to Kabe — their pass closes M0's look at V3. |
| 6 | Done: GitHub Pages live, blind comparison (§12.10), close-out per the method. | Pages URL serves the demo with zero post-load requests; §12.10 shows no quality lost — a loss allocates a row that blocks Done; playbook and felt-deviation tickets filed; seats and worktrees closed. |

**Next ID:** 7
