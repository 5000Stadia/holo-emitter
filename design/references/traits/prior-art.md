# Prior art: object characteristics (traits) that are inherited, stack, demand things, relate, and test themselves

Pass of 2026-10-13, read-only. "(unsure)" marks what I could not confirm from a source. Our starting point: `defineKind` in
`src/make/catalogue.js` already refuses unknown fields and bad `requires`; kinds already carry a loose `traits` list (read only
by `place.js`); `works.js` consumes affordances/rules generically but nothing says "a lit candle lights its surroundings".

## Sources (mechanism, then link)

- **Dark Engine (Thief / System Shock 2).** Objects are bare IDs; everything is a *property* (name, range, help text published
  to the editor so designers tune without code). Properties inherit down a tree of abstract objects (archetypes; 4,000+ in
  Thief), a concrete object overrides locally; found values are cached, failed lookups too. Lessons the authors list: override
  semantics are subtle (local value equal to inherited: keep or drop?), and you need tools showing *why* an object has a value.
  Church, "Object Systems": https://www.slideserve.com/giolla/object-systems
- **Dark Engine metaproperties.** A metaproperty is a named bundle of properties (e.g. M-FrobInert) added to archetypes or
  added/removed at runtime; it masks the object's own properties with higher priority. This is the stacking mechanism.
  https://thiefmissions.com/tutorials/Spike14CompleteTut.html , https://github.com/NamelessVoice/nvscript
- **Dark Engine links.** Typed directed edges between objects, optionally carrying data. A lever/switch (StdLever script)
  emits on/off along its `ControlDevice` links to whatever is linked (door, light with AnimLight, relay); an "inverter" object
  sits between for a lights-start-on case. Targets are selectable by link flavor (`&ControlDevice`) or by archetype/metaproperty
  (`@Archetype`, nearest `^`). https://github-wiki-see.page/m/Daraan/Dark-Squirrel-Scripts/wiki/1.-DScripts
  (SwitchLink: no source found; unsure it is a distinct link type.)
- **Caves of Qud.** XML blueprints with `Inherits`; each carries `part`s (C# component classes: Render, Armor...), `tag`s (flat
  key/values), `stag` (semantic tags used for population/encounter tables), `mixin`s (copy parts/tags from another blueprint
  with Include/Exclude filter), `removepart`; `Load="Merge"` patches. Known wart: deleting an inherited tag is reportedly broken.
  https://wiki.cavesofqud.com/wiki/Modding:Objects ; talk: Bucklew, "Data-Driven Engines of Qud and Sproggiwood", IRDC 2015
  (title only; not read).
- **Cataclysm: DDA (JSON).** `copy-from` single inheritance; `relative`/`proportional` numeric tweaks; `extend`/`delete` on
  list fields; items carry a `flags` array consumed by engine code; `abstract` entries exist only to be inherited and are
  discarded. Explicitly warns deep chains get unreadable. https://docs.cataclysmdda.org/JSON/JSON_INHERITANCE.html
- **Dwarf Fortress raws.** One object per `[TYPE:ID]` with bracket tokens; `*_TEMPLATE` types (materials, tissues) and
  `CREATURE_VARIATION` reuse token sets; some templates are *required to exist* or generation errors ("missing *").
  https://dwarffortresswiki.org/index.php/Raw_file (token-merge and `COPY_TAGS_FROM` semantics not covered there: unsure.)
- **Unreal Gameplay Tags.** Hierarchical dotted tags (`Character.Enemy.Zombie`) registered in a dictionary (ini/data table/C++
  macro); unknown tags are not accepted. Held in containers; `HasAny/HasAll`, plus boolean query trees.
  https://dev.epicgames.com/documentation/en-us/unreal-engine/using-gameplay-tags-in-unreal-engine
- **Unreal GAS.** An ability declares tags it needs on the actor to run (*ActivationRequiredTags*), tags that refuse it
  (*ActivationBlockedTags*), tags it applies while active (*ActivationOwnedTags*). Silent refusal is a known pain (hence
  `showdebug abilitysystem`). https://docs.unrealengine.com/5.1/en-US/PythonAPI/class/GameplayAbility.html
- **Bevy required components (0.15).** `#[require(Team, Sprite)]` on a component: spawning it inserts the rest, transitively
  (Sprite -> Transform -> GlobalTransform); defaults via `Default`, or a constructor/closure; no Default and no constructor is a
  compile error; only inserted if the caller did not supply one. Replaced flat "bundles" because authors had to list every
  dependency. https://bevy.org/news/bevy-0-15/
- **Unity `RequireComponent`.** Auto-adds the dependency on `AddComponent`; does not repair objects that already lack it.
  The cautionary half: a check only at one entry point. https://docs.unity3d.com/ScriptReference/RequireComponent.html
- **Flecs.** Relationships are first-class: a *pair* (Relation, Target), e.g. `(Eats, Apples)`; several targets per relation;
  wildcard queries `(Eats, *)`; `IsA` gives prefab-style inheritance with override. Relation traits: `With` (must come together
  with another id), `OneOf` (target must be a child of X), `Exclusive`, `Symmetric`, `Transitive`, `Traversable`,
  `OnInstantiate: Override|Inherit|DontInherit`, cleanup (`OnDelete`, `OnDeleteTarget`).
  https://github.com/SanderMertens/flecs/blob/master/docs/Relationships.md , .../ComponentTraits.md
- **Bethesda Creation Kit keywords.** Keywords are flat semantic tags on forms (e.g. ActorTypeRobot on every robot); conditions,
  recipes, perks and scripts test them, so mods work with new content that carries the keyword. Reportedly immutable at runtime;
  form lists used when scripts must mutate (forum claim). https://falloutck.uesp.net/wiki/Keyword (403 on fetch; from search
  excerpt: unsure of details.)
- **Godot groups.** Named tags on nodes, many per node, created on first use (no registry, so typos create new groups);
  `call_group()` / `get_nodes_in_group()` consume them generically.
  https://docs.godotengine.org/en/stable/tutorials/scripting/groups.html
- **Model-based / property-based testing.** fast-check: random command sequences with `check(model)` precondition and
  `run(model, real)`, shrinking and replay seeds. https://fast-check.dev/docs/advanced/model-based-testing/ . I found no game
  engine that generates tests per component; this is a gap, not a convention. (Dark Engine/Qud/Flecs: nothing found.)
- Not found despite trying: Arkane (Dishonored/Prey) object-system internals; Doug Church's archetype/link slides (page
  covered properties and links only). The Mahk interview at computerenhance.com is 2.5 h, content not summarised.

## Adopt / adapt / reject for us

(a) *Applied by category, inherited.* ADAPT Dark/CDDA: a trait is a named bundle defined once (our `defineTrait`), and a
**family** (`candle/*`, `light/*`) lists default traits, so a kind gets `burns`, `emits-light` from its family and may override.
Keep inheritance one level: family -> kind (CDDA's own warning on deep chains; Dark's override subtlety). REJECT Qud
`Load=Merge`/`*delete` style removal; a kind opts out by an explicit `not: [...]` that is itself validated.
Provide a `why(kind, field)` explainer from day one (Dark's lesson: say where a value came from).

(b) *Stack.* ADOPT the Dark metaproperty / Qud mixin model: an ordered list of traits per kind, plus Bevy-style transitive
`requires` so `lamp` pulls in `powered` pulls in `electrical`. Conflicts (two traits writing one field) are an error at
definition, not last-wins (this is where Dark's masking priority bit people). Our existing `traits` list becomes this.

(c) *Declare requirements, refuse when defined.* ADOPT Bevy `#[require]` + GAS Required/Blocked, but as a *refusal* (we have
no Default to fall back on): a trait states `needs`: parts/affordances/settings/slots/size it must find, `blocks`: traits it
cannot coexist with, and defineKind throws with the kind and trait named. Unity's lesson: validate on every path in (kind
definition, place-time `over` settings, `start` states), not only one. Closed registry like Unreal: an unknown trait name is an
error (Godot's free-form groups are the typo hazard to avoid).

(d) *Consumed generically.* ADOPT Godot/Creation Kit/Qud `stag` pattern: engine code asks "things with trait X in area A" and
acts on the trait's data; levels never wire it. Our `works.js` rules already do "count of kind in area in state"; extend the
query noun from kind to trait. The candle bug is exactly a missing generic consumer: `emits-light` should be the one trait the
light pool reads, so any lit thing (candle, neon sign, screen) lights its surroundings by the same path.

(e) *Relations.* see next section.

(f) *Generated behaviour tests per trait.* ADAPT, nothing to copy. Each trait ships a **contract**: `given` (a minimal
instance), `act` (the affordance/state change), `expect` (an observable in the engine's own outputs: light pool contains an
entry, rule fired, state stored). A runner iterates every kind x every trait it carries, builds the instance headless in node
(kinds are pure, no THREE), applies the contract. Add fast-check-style generation for the *sequences* (toggle, burn, relight,
restore from store) with the trait's invariants as the model; shrink to the shortest failing sequence. The end-to-end check for
"lit candle lights surroundings" is then the `emits-light` contract run against the real page pool, once, not per candle.
REJECT Dark-style tests only in the editor; Unreal's silent refusal: our refusals must say which trait and which need.

## Relations (switch -> light, breaker -> circuit)

Pattern across Dark (typed link carrying on/off), Flecs (typed pair with traits): a relation is a **typed, directed,
first-class record**, not a field inside either object, with a name (flavor) and optional payload, and the *trait* on each end
says what it can send or receive. Recommended model:

1. Relation record `{ type: "controls", from: switch, to: light|circuit, as: "toggle"|"invert"|"hold" }`; types from a closed
   registry, each with: legal end traits (switch trait `controls-out`, target `controllable`), cardinality (Flecs
   `Exclusive`/`OneOf` equivalents: one breaker per circuit), and validity checked when the relation is created.
2. Placement: relations belong to the **place** (room/scene data), because they join instances; a kind may only declare a
   *default pattern* ("a wall switch wants one `controls` target in the same room"). Kind-level only is wrong (the light is
   elsewhere); object-level fields (Dark's own mistake risk: stale references) are avoided by linking by stable id.
3. Transitive power: `breaker -> circuit -> lamps` as two `controls` hops with `powered = all upstream on`, computed lazily on a
   state change (our "nothing simulated while no one looks" fits): `powered` is a derived state, never stored.
4. Orphans are a defined-time error or a declared exception: a switch with no target, a lamp wired to nothing (the "escape
   rooms wanted" exceptions already in memory); generation-time millisecond arithmetic, not play.
5. Authoring: a relation can be auto-drawn by a rule from traits ("every `controllable` light in this room joins the nearest
   `wall-switch`"; Dark's `^Archetype` nearest-match), so levels rarely hand-wire; explicit relations override.

## What changes in code (small)

`defineTrait` registry (`needs`, `blocks`, `requires`, `provides`, `contract`); family default traits; `defineKind` validates the
list; one `relation` store beside the existing state store ("<id>.<aff>", "$var", "!rule" keys already exist); a contract runner
under `tests/`; `works.js` queries by trait. Sci-fi traits reuse the same shapes: `powered`, `emits-light`, `screen`, `neon`.
