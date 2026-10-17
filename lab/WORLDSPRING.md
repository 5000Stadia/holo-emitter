# Anchors from Worldspring

github.com/Dun-John/worldspring generates a fantasy world in the browser from one seed, from
continent to furnished rooms (Rust → WASM, PixiJS, top-down 2D). Kabe, 2026-10-05: "Just use
those inspiring anchors for reference and determine the best code that serves our project."
So these are references; the code here is written for holo-emitter.

| Anchor (where in worldspring) | What we take | Lands in |
|---|---|---|
| Every artifact is a pure function of (world file, job key); deps point only at coarser levels or parent features (`crates/worldgen/src/pipeline/mod.rs`) | Rooms and places keyed and built in any order with the same result; caches keyed by the world's hash | R48 |
| Samples are a function of global lattice index, never origin + local (`CLAUDE.md` Rules, `lod/terrain_refine.rs`) | Terrain, noise and look blends evaluated in world coordinates, so seams agree by construction | R48, R46 |
| Building function → archetype → per-level room program (rooms, relative size, filler, corridor) → furnishing per room kind (`interior/mod.rs` `arch_of`, `program`, `furnish`) | A c.1660 manor's program decides the rooms before the grammar decides their look | R47 |
| Vital checks only: every room reachable, stairs aligned, furniture never on a doorway; native = WASM byte-identical (`tests/vital.rs`) | house-walk plus "nothing in an opening" and "same plan, same house" | R47 |
| Sketch strokes and pins steer generation; what can't be honoured is reported as a conflict with its place (`t0/sketch.rs`) | The period brief as pins, with a conflict report | R45 |
| Edits layered over generation, outside the world hash; `GEN_VERSION` in every world file, old generators kept (`world.rs`, `app/src/world/versions.ts`) | The world document records the generator version; a saved world never shifts | R48 |
| Generation in workers (`app/src/gen/*.worker.ts`) | Room geometry built off the main thread | R48 |
| `?bench` fly-throughs and a perf floor on a reference laptop (≥ 30 fps 1% lows) | A `?bench` walk Kabe runs on his own devices | R48 |
| `?gallery=1` shows every procedural sprite for batch approval | A page of every kit part, later | Later |
| mapd: MCP tools, live ops sync while you watch | The interface for pattern-buffer and a building agent, later | Later |

Not taken: the 5-ft grid, D&D rules, the fantasy catalogue, the 2D map style, Rust.
