# R79 consult digest: facts only (2026-10-13)

## What the person asked (verbatim, ROADMAP.md R79)
- "we need to have some object type characteristics, such as produces light that are categorical applied elements to certain types of objects automatically upon their creation. There may be other characteristics as well and objects should be able to have multiple characteristics … automatic and effective guidance, instructions, flow chart, or whatever is the most elegant in building itself … so that things like a candle that produces no light won't be created. We need to future proof the design process … consider we are making a one shot module for Blade Runner dystopian future."
- "imagine more modern era … a light switch that is in a different part of the room [from] the light it turns on."
- "relational object status changes based on other objects would include switch, unlocking a door … a keypad having the right code in it and then pressing enter unlocking another door … modularize the design of those relationships in a special way so that when a system needs to make those shapes it can do so"; escape rooms with puzzles as a test suite. Whether puzzle composition is a separate project is an open gate (gae5acb).
- Standing direction (project memory): checks are cheap arithmetic at generation time, never in play; exceptions are declared data, not relaxed rules; every obvious movable/switch works by default; code first, no AI needed to play.

## The system today (sources in the repo)
- Kinds are data records registered by `defineKind` (`src/make/catalogue.js:31`), 72 kinds across six files in `src/make/kinds/`. It refuses unknown fields, bad motions, `requires` naming a missing affordance, `starts` naming a missing process, malformed settings.
- Parts are code (`src/make/parts/*.js`, 11 files); a kind lists its parts. A candle's part (`parts/lights.js`) builds a flame mesh and a PointLight tagged `lightGroup: "flame"`.
- Affordances (`slide`, `hinge`, `lever`, `switch`, `state`, each with two states) are the things you act on. A candle: `light: { motion: "switch", lights: "flame", starts: "burn" }`; processes (burning down) are timed phases.
- `src/make/works.js` runs affordances generically, keeps state in one store (`<id>.<aff>`, `$var`), and has a rules engine: conditions (`count` of things of a kind/state in an address, `var`, `thing` in state, `holding`) and effects (`set` a variable, `do`: turn another thing's affordance). Rules are written by the place or the story. Affordances can `require` another affordance's state, an engine variable, or `@holding` an item (a locked door needs its key).
- Kinds already allow a `traits` field: a loose list (e.g. `["free"]`, `["beside"]`) read only by `src/make/place.js` for placement.
- `src/make/passage.js`: generation-time path check per room (under 1 ms); obstacles may carry a declared `gate` (a barricade a prybar clears) and the reach check names softlocks.
- Kind-level authoring checks exist for geometry (`src/make/audit.js`: every part seen, no part buried in another; `mesh-rules.js`).
- Lights: the page (`lab/manor/index.html`) takes every light out of the scene into fixed pools (3 fire lights on a phone, a few window rect lights) ranked by what each gives where you stand; each page wires its own lights into the pools.

## The failure that started this (2026-10-13)
- The candle kind was correct. Lighting it ran the act, which asked the light pool to look again at once, before the switch's animation had raised the light's strength above 0; the pool skipped it and nothing looked again until the player moved. Every candle kind was affected. Fixed in the page; a test now proves "lit where you stand, it lights" for one candle. Nothing generic proves a characteristic's promise end to end, and each page consumes lights its own way.

## Prior art (digest: `design/references/traits/prior-art.md`, sourced)
- Dark Engine (Thief/SS2): properties inherited down archetype trees; metaproperties as stackable bundles; typed directed links (`ControlDevice`) carrying on/off from a lever to doors/lights. Its authors' lessons: override semantics are subtle; tools must show why an object has a value.
- Caves of Qud blueprints (inheritance, parts, tags, mixins); Cataclysm DDA (`copy-from`, warns deep chains get unreadable); Dwarf Fortress raws/templates.
- Unreal Gameplay Tags (closed hierarchical registry) and GAS (required/blocked tags; silent refusal a known pain).
- Bevy 0.15 required components (transitive, inserted with defaults); Unity RequireComponent (checked only at one entry point).
- Flecs relationships: first-class typed pairs with relation traits (exclusive, one-of, transitive, cleanup on delete).
- Creation Kit keywords, Godot groups (free-form: typo hazard): engine queries "things with tag X".
- Property/model-based testing (fast-check). No engine found that generates behaviour tests per component.
- Puzzle composition prior art (not yet researched in depth): LucasArts puzzle dependency charts; lock-and-key dungeon generation.

## The decision
How should R79 shape characteristics (what they are, how kinds get them, what they require), the links between things (switch → light, key → lock, keypad code → door, breaker → circuit), where each lives (kind, family, place), and how each characteristic's promise is proven automatically, so that new settings (a Blade Runner one-shot) get correct, playable objects with no troubleshooting by the person, and checks stay cheap and at generation time?
