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

- The **orientation contract** (blueprint §10): every generated sprite and backdrop prompt appends its blocks. Enforced by replicator gate §9.4e.
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

## The spec list

| # | What to build now | What done looks like |
|---|---|---|
| 1 | Static shell and renderer skeleton: `index.html`, renderer drawing holodeck-grid placeholder backdrops for both rooms × four facings from real `world.json`/`staging.json` fixtures, `turn` via arrow keys and edge chevrons (blueprint §2, §7 draw order, §8 turn only). | Opened from `file://`, all eight facings reachable by turning; renderer is a pure function; determinism check (§12.2) green on placeholders. V1 look. |
| 2 | Full harness and world behaviour on placeholder sprites: `toggle`/`take`/`go`, envelope, knowledge reveal, inventory strip, narration from `narration.json`, ground-plane math (§5, §7, §8; `groundplane.js`, `inventory.js`). | Playwright walkthrough (§12.1) plus determinism, state isolation, knowledge checks (§12.2–4) all green on placeholder assets. |
| 3 | Replicator ingest v1: matte, anchors, parts, gates, `record.json` emission, `contract.json` (§9, §10). | Both 1660s desk generations pass matting and gates; the teardrop-pull desk lands as `desk-joined-oak-1660` with working `drawer_front` part; gate unit tests green. |
| 4 | Asset production: 8 backdrops + meta calibration, 8 sprites through the replicator (§11), staged into the fixtures. | All assets in `library/` and `backdrops/` with gates green; geometric check (§12.5) green; consumption-camera screenshots of all eight facings batched for Kabe. V2 look. |
| 5 | Integration and acceptance: real assets in the walkthrough, full §12 run, README GIF. | §12.1–5 and §12.7 green; 20-second walkthrough GIF in the README; flip-test screenshot pairs (§12.6) delivered to Kabe — their pass closes M0's look. |
| 6 | Done: GitHub Pages live, blind comparison over the whole product, close-out per the method. | Pages URL serves the demo with zero post-load requests; blind comparison run; playbook and felt-deviation tickets filed. |

**Next ID:** 7
