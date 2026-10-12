# pattern-buffer audit: time, world conditions, and the hand-off to holo-emitter (2026-10-11)

Read-only. PB = `/home/k/pattern-buffer` (HEAD 87d3470); construct = `/home/k/Newproject` (main ce6186c, plus branch `holo-bridge`).

## 1. How pattern-buffer models time

**The row.** Each assertion has two time axes (`src/patternbuffer/model.py:183-211`, `docs/WHITEPAPER.md:68-99`):
- `valid_from` / `valid_to`: world time, held as a **unitless finite float**. The interval is half-open. `None` means timeless, which is legal only for CONSTITUTIVE and DISPOSITIONAL rows.
- `asserted_at`: transaction time. It is the log sequence number, permanently (amendment A1, WHITEPAPER:99).
- Wall-clock "learned at" is not a column. It is a reified meta-row, `learned_at_wallclock`, which the gate stamps only in `observe_or_unknown` (tracking) worlds (`ingest.py:11-14`, `ingest.py:1542`, `model.py:113-129`). Fiction worlds leave it out.

**No unit and no calendar.** PB never says what a unit of valid time is. Each host chooses:
- **construct** uses an ordinal play axis.
  - Turn *n* sits at `TURN_EPOCH(1000) + n`, raised above every seeded row when needed (`construct/arc/timeline.py:44, 82-105`).
  - Source chunks sit at `i * 1_000_000` (`timeline.py:55-63`).
  - The holo bridge uses `1.0 + turn` (`holo-bridge:construct/holo/world.py:17, 34, 62`).
- **PB's own case-1660 probe** uses **minutes since 1660-08-31 00:00** as valid time (`research/case-1660-probe-r4:evals/case_1660_probe/build4.py:62-65`; the probe world's valid_from runs 0 to 42360).
- So "story clock as valid time" has already been tried, and works, for this case.

**The scene cursor.** `SceneCursor.position` is the ingest pose (`ingest.py:417-423`). Any write without `valid_from` is stamped there (`ingest.py:1262-1266`). Write verbs place it with `at=` (`porcelain.py:148-169`).
- With `cursor_authoritative=True`, the cursor overrides each item's valid_from. The overridden value is kept as a `source_valid_from` meta, "for host promotion to a typed year/era fact" (`ingest.py:1495-1503`).
- **Rule:** the cursor starts at 0.0 on every open. A host must re-pose it before an untimed write, for example from `axis_heads()["valid_head"]` (`docs/ADOPTION.md:314-317`, `porcelain.py:362-371`).

**Lifetimes.** Each row has a durability class: CONSTITUTIVE, DISPOSITIONAL, STATE or EVENT (WHITEPAPER:117-145).
- STATE is valid-time bounded and is superseded per `(entity, attribute, frame)`.
- An EVENT is an `event:` entity whose rows are its record. It is never folded (WHITEPAPER:128; `model.py:202-219`).
- Hosts may pin a class per attribute: `attr:<name> · durability · STATE` (WHITEPAPER:142).
- Fold policies are `last_write` and `accrue` (WHITEPAPER:351-355).

**Snapshots at a time.** Every read takes `as_of`, a valid time, and `asserted_as_of`, a log position (WHITEPAPER:677-680; ADOPTION:561-600).
- `snapshot(scope, frame, as_of, lens, budget, since)` makes zero model calls and zero writes.
- Lenses (WHITEPAPER:333-343):
  - `establishing_set`: the world at rest;
  - `current_state`: state folded to `as_of`;
  - `what_happened`: event records;
  - `character_sheet`;
  - `situation`: standing truth plus live events since `since`.
- **Instants need width.** `[t, t)` is invisible, so write `[t, t+1)` (ADOPTION:321-325).

**Clocks.** The whitepaper describes `fires_when` clocks (WHITEPAPER:319, 374), but **the engine has no evaluator or scheduler**. Execution is a host concern (`specs/TRACKING-MODE-V1.md:51-54`). Looping time is deferred; the engine clock stays monotonic (`docs/ROADMAP-deferred.md:90`).

**construct's diegetic clock is a second, separate axis that already lives in canon** (`construct/clock.py`; `docs/design/DIEGETIC-TIME.md`):
- `time:elapsed · elapsed_minutes`, declared `fold_policy=accrue`. Each turn appends a `+N` delta (`clock.py:162-164, 218-240`; `semantics.py:60`).
- `time:calendar`, plus optional per-place calendars: `hours_per_day`, fractional `phases` (night/dawn/morning/noon/afternoon/dusk/evening), `offset_minutes` (`clock.py:24-118, 177-206`).
- Phase is always derived, never stored (`clock.py:1-10`).
- Advances come from a deterministic action table (`clock.py:260-279`) or from the `estimate_elapsed` model cohort for "wait until dusk" and "three days later".
- **Gap 1: the clock is read at the head.** `read_clock` takes no `as_of` (`clock.py:209-215`), so a past snapshot does not return the clock as it stood then. The deltas are cursor-stamped, so an as-of read would work if it were passed.
- **Gap 2: the holo bridge ignores the case's clock.** It stamps turns at `1.0 + n` and does not ingest the case's ISO timeline (`holo world.py:82-141, 198-235`).

## 2. World conditions today, and where they fit

**Nothing models weather, sun, moon phase, season or temperature.** Searches of `src/`, `docs/` and `specs/` find only these:
- era as a CONSTITUTIVE example (WHITEPAPER:123; `classify.py:207`);
- `temperature > 50` as an example `where()` comparison (`specs/NUMERIC-QUANTITIES-V1.md:38`);
- one kind-default fill, `room · lighting · "unremarkable"`, a render fill marked `default` and never a fact (`project.py:30-34`);
- "the unasserted lamp is off, drawn off" as the closed-world projection stance (WHITEPAPER:360).

**Weather cannot enter through prose ingest today.** The extractor prompt says "Atmosphere and sensory texture are not assertions" and "atmosphere is not an assertion" (`ingest.py:223-224` full prompt, `ingest.py:272` lean prompt). Moving air, rain and light are explicitly not movement (`ingest.py:186, 258`). So weather "established in the story" reaches PB only if construct writes it through `ingest_structured`. `p.ingest(text)` would drop it by design.

construct's briefing only says "with weather … as the scene holds them" in prose (`briefing.py:406`). It does tell the narrator the hour, "render its FEEL — light, sounds" (`briefing.py:280-286`).

**PB's doctrine decides what may be stored: the membrane test.** "Could the engine recompute this row from other present facts? then it is derived and must never be stored" (`docs/HOST-DISCIPLINE.md:179-184`; LEXICON:39). Applied here:

| Condition | Reducible? | So it is |
|---|---|---|
| Time of day, day number, phase band | yes: clock + calendar | **derived** (as construct already does) |
| Sun and moon direction, moon phase and illumination, darkness | yes: date-time + place (lat/lon) + calendar system, astronomically | **derived**, never stored |
| Season | yes: date + latitude | derived |
| Weather (sky, rain, fog, wind, temperature) | **no**: the story says it or invents it | **stored STATE** |
| The story moment itself (epoch + elapsed) | no | stored: calendar CONSTITUTIVE, elapsed as accrue deltas |
| A story fact that breaks astronomy ("a full moon that night" in a world whose moon differs, perpetual night) | no | a stated row or a calendar parameter that **overrides** the derivation |

**Proposed shape, in PB's vocabulary (no new primitive, no engine change):**

1. **Anchor the clock to a calendar date.** Add timeless CONSTITUTIVE rows on construct's existing `time:calendar` (or a place's own calendar via its `part_of` chain):
   - `epoch` (ISO local date-time of minute 0, e.g. `"1660-08-31T00:00"`);
   - `calendar_system` (`julian` | `gregorian`);
   - `latitude_deg`, `longitude_deg` and `utc_offset_minutes` (or `local_mean_time: true`);
   - an optional `moon` (`synodic_days`, `phase_at_epoch`) and `suns` for invented worlds.

   `time:elapsed` stays the clock. **Each delta is stamped at the turn's valid_from**, so `state(time:elapsed, elapsed_minutes, as_of=T)` is the story moment at T. This is the "object within the chronological period": the period is the valid-time interval, and the story's clock and weather are rows inside it.
2. **Weather is one entity per region.** For example `weather:wyck_vale`, with `kind · weather` (timeless) and `part_of`/`in` the region place, so `snapshot([place])` reaches it by containment.
   - Its STATE rows:
     - `sky` (closed set: clear | fair | broken | overcast | fog | rain | storm | snow);
     - `cloud_cover` (0..1);
     - `precipitation` (none | drizzle | rain | heavy | snow);
     - `visibility_m`;
     - `wind_ms`;
     - `wind_from_deg`;
     - `temperature_c`.
   - Declare each with `attr:<x> · durability · STATE` and `fold_policy · last_write` (READ-SURFACE-V1 §1-2). That keeps folding deterministic and away from the model.
   - Each change is a new row at the turn's `at`. Supersession closes the old value, and `as_of` replays the night.
   - A storm that matters to the plot can also be `event:storm_breaks` (kind=weather_change, `caused_by`), but STATE rows are enough for rendering.
3. **Unknown weather is a thunk, not a default.** If the story never said, construct leaves `weather:x · sky` unresolved. The first projection that needs it calls `resolve()`. Under `invent_under_canon` the answer is written once as `generated`, consistent with era and season, and memoized forever (WHITEPAPER:204-226). That is PB's "invented once, then kept" guarantee, applied to the sky.
4. **Conditions as evidence.** A witness's perception is a `knows:person:X` row, frozen at perception time (HOST-DISCIPLINE:169-177). A lie is a `says:` row, as the bridge already models lies (`holo world.py:12-14`).
   - So that `frame_diff` can catch "the moon was bright, I saw his face", the condition must be a canon row. Derived values are not rows.
   - **Rule:** when a condition is load-bearing for a clue, the author asserts it as a `stated` row (e.g. `sky:wyck_vale · moonlight · none`, or `weather · sky · overcast`). A generation-time check confirms that it agrees with the derivation.
5. **Pins.** A world-shaping condition such as perpetual night or a siege winter uses the existing `world_defining` pin, so it is always in `establishing_set` (WHITEPAPER:141; `project.py:263-301`).

## 3. How construct reads and writes, and how a renderer gets changes

**Writes.** These go only through the gate (`porcelain.py:384-497`):
- `ingest_structured(items, at=, atomic=, classify="rules")`, model-free and milliseconds;
- `commit_set` (all or nothing);
- `retract`;
- `resolve`.

The holo bridge already writes the player's events with no model call (`holo world.py:198-235`). Weather and clock rows would go the same way.

**Reads.** All are model-free except `ask`:
- `state(e, a, as_of)` returns `unknown | known | conflicted | unresolved`;
- `snapshot(..., lens="situation", since=)`;
- `events(since, until)`;
- `axis_heads()`.

**PB never calls out and has no subscription.** "The engine never calls you" (`llms.txt:10-11`; VISION: "never calls them"). Nothing in `src/` hooks, notifies or subscribes. Change detection is pull-based:
- the write `Receipt.seq_range` (`porcelain.py:135-146`);
- `axis_heads()["asserted_head"]` moving;
- reads at `asserted_as_of` to diff two log positions.

**The renderer never writes** (`llms.txt:31`). That matches holo-emitter's boundary: events out, beats in, effects from a closed list (`design/case/boundary-with-construct.md`).

**Today's transport** is construct's bridge (`holo-bridge:docs/design/HOLO-EMITTER-BRIDGE.md` §4):
- `POST /events {turn, events}`;
- `GET /deck?since=v` returns 200 with a new deck, or 204;
- a single worker thread per world;
- localhost only. A phone on Pages needs a hosted bridge, which is Kabe's call.

Conditions fit the same poll. The deck, or a sibling `GET /conditions?since=seq`, carries a conditions block that construct reads from PB. holo-emitter never touches PB.

## 4. Physical mechanics PB already carries

- **Containment** is a single-parent tree; moving is the only operation (WHITEPAPER:103-114). The family is `in | within | held_by | worn_by | carried_by` (`model.py:24`). Reads are `locate`/`contents`. Containment cycles are refused as-of (`ingest.py:972-1008`).
- **Composition** uses `part_of` for fixtures and sub-places: a desk is part of an office. It is separate from containment (`model.py:29-33`; WHITEPAPER §25.3).
- **Passage and locks** (RFC-003; WHITEPAPER §25.5):
  - `connects_to` is the lateral graph.
  - **Portals** carry `open | shut | locked` and `guarded_by`.
  - A host-declared, kind-scoped `traversal:<kind>` sets `blocks_when_state` / `blocks_when_relation` (`indexes.py:2014-2022`).
  - `route()` returns clear, blocked (with evidence) or obscured.
  - `path()` is as-of-aware.
  - There is no key-to-lock rule in the engine; that is a host rule, which the case already carries.
- **Object states** are ordinary STATE rows (`state · open`, a candle `lit`), superseded per key. Kind-defaults fill in at render time only, marked `default` (`project.py:30-41`).
- **Movement:** a `kind=moved` event carries `agent` / `origin` / `destination` / `manner`, with timestamps from the cursor. `in_transit()` lists moves not yet arrived (`ingest.py:606-737`; LEXICON:66).
- **Knowledge and propagation:**
  - `knows:<id>` frames; perception writes one frozen row (HOST-DISCIPLINE:169).
  - `who_knows`, `frame_diff` (dramatic irony), and `says:` for claims.
  - Out-of-frame rows are absent, not redacted (WHITEPAPER §6).
  - **There is no automatic propagation** (sight lines, hearing, telling). The host writes each perception.
- **Quantities:** `accrue` totals and `where(attr, op, value)` comparisons (`porcelain.py:604-615`), e.g. `temperature_c < 0`.
- **Light** is not modeled: no light sources, illumination or line of sight. A candle's `lit` is a state like any other. Whether a room is dark is a derivation for holo-emitter (sun altitude + weather + light sources + shutters), or a stated row where the story needs it as evidence.

## 5. A minimal "conditions" contract (proposal)

**Units:** minutes, degrees, metres, m/s, °C, a 0..1 fraction. Ids are PB-shaped.

| Field | Unit / type | Lives in PB as | Owner (writes) |
|---|---|---|---|
| `calendar.epoch` | ISO local date-time | `time:calendar · epoch` CONSTITUTIVE | story / construct (authoring) |
| `calendar.system` | `julian` \| `gregorian` | `time:calendar · calendar_system` | story / construct |
| `calendar.lat`, `.lon`, `.utc_offset_min` | deg, deg, min | `time:calendar` or place calendar | story / construct (holo-emitter may propose from its map) |
| `calendar.hours_per_day`, `.phases`, `.moon?` | as `clock.py` | existing calendar rows | story / construct |
| `clock.elapsed_min` | integer minutes | `time:elapsed · elapsed_minutes` accrue deltas, each at the turn's valid_from | construct commits; holo-emitter **proposes** advances in events out |
| `weather.<region>.sky`, `cloud_cover`, `precipitation`, `visibility_m`, `wind_ms`, `wind_from_deg`, `temperature_c` | closed sets / units above | `weather:<region>` STATE, `last_write`, `stated` or `generated` | construct (story beats, world tick, resolver) |
| `pinned.*` (a moon or darkness a clue rests on) | stated row | canon STATE, plus `knows:`/`says:` copies | story author |
| `derived.local_time`, `phase_band`, `sun_dir`, `moon_dir`, `moon_phase`, `moon_illum`, `season`, `light_level` | computed | **never stored** (membrane test) | holo-emitter computes for rendering; construct computes phase bands for prose |
| `as_of`, `asserted_head` | float, int | the read coordinates | PB (via construct's reads) |

**How a change flows:**
1. **Out.** A holo-emitter action, such as "rest till dawn", a long walk or opening shutters, goes in an event batch: `{type:"time", advance_min, reason}`, or the usual `open`/`take`. holo-emitter never writes conditions itself.
2. **Commit.** construct turns it into rows with `ingest_structured([...], at=turn_time(turn), classify="rules", atomic=True)`:
   - the `elapsed_minutes` delta;
   - any weather STATE change, from a beat, a world tick, or a `resolve()` that forces the unknown sky once.
3. **Read.** construct reads one coordinate: `state(time:elapsed, …, as_of=t)`, the calendar rows, and `snapshot([weather:region], lens="current_state", as_of=t)`. Pinned rows are read in the player's frame where it matters.
4. **Ship.** construct publishes `{v, asserted_head, as_of, calendar, elapsed_min, weather, pinned}` beside the deck: the same `GET …?since=v` poll, with 204 when nothing has changed.
5. **Render.** holo-emitter derives the sun, moon, stars, fog and exposure, and which lamps are lit, from `epoch + elapsed` and the place. For 1660 that means converting Julian to Gregorian, a 10-day shift, before any ephemeris. Between versions it runs the clock forward locally with the same deterministic table (`clock.py:260-279`). It snaps to construct's value when a new version lands, and keeps the old one if the bridge is absent. The no-model play stays whole.
6. **Effects in.** A beat can carry one new closed effect, `set_conditions {advance_min | jump_to_phase | weather:{…}}`. holo-emitter applies it locally at once and reports it back in its next event batch, so construct records it in PB: a single writer, one log.

**Open questions:**
- **(a)** Should the case world's valid time be story minutes (as PB's probe did, which lets the 21:00–01:00 timeline go in natively), or should it stay turn-ordinal with the clock as data (construct's convention)?
- **(b)** Do construct's fractional phase bands give way to solar ones when a calendar carries lat/lon? Otherwise "dusk" in prose and dusk on screen will drift apart.
- **(c)** Who hosts the bridge for phones (Kabe's call, already open).
