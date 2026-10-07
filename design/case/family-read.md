# R55: the family read (construct, pattern-buffer, pattern-buffer-evolution, epistemic-projector)

Read-only; no code run. Paths are `repo/path:line`.

## 1. The four repos

**construct** (`5000Stadia/construct`, MIT). "Construct Projector": a Python 3.11 interactive-fiction engine, about 31k lines (`turnloop.py` alone is 8k), 378 commits from 2026-06-12 to 2026-07-28, then parked at a "button-up" with a designed next step (`docs/design/NEXT-UP.md`). It runs as a CLI/REPL (`construct start|play|turn`), as outbound-only Telegram/Discord bots, or as a library (`construct/session.py`, `Session.open(...).turn(text)`). No HTTP server. Persistence: one SQLite pattern-buffer file per player slot (`game.py:134 slot_path`, `<scenario>.<player>.play.world`) plus a `*.meta.json`. `worlds/bodycase` is a Victorian murder mystery with the cast/clue shape M7 needs.

**Models.** One interface, `Provider.complete(prompt, schema, tier)` returns schema-validated JSON (`provider.py:80`). Two tiers: main `gpt-5.5`, cheap `gpt-5.4-mini`, effort low (narration floors at high). Wires:
- `OpenAIProvider` (default): `https://api.openai.com/v1/responses` with `OPENAI_API_KEY` (`provider.py:661-717`).
- `CodexProvider` (opt-in, `CONSTRUCT_PROVIDER=codex`): the OAuth path (`provider.py:346-430`). It re-reads `~/.codex/auth.json` on every call (written by `codex login`) and takes `tokens.access_token` and `account_id`. It POSTs SSE to `https://chatgpt.com/backend-api/codex/responses` with `Authorization: Bearer`, `chatgpt-account-id`, `OpenAI-Beta: responses=experimental`, `store:false`, `text.format = json_schema`. A 401 fails fast with "run codex login". There is no token refresh in the code, and the payload cap is 40 KB (`:46`).
- Calls per turn (`docs/design/TURN-LATENCY.md`): classify, player_ingest, furnish (once per scene), `npc_turn` per present NPC, weave_pick, narrate (main), post_extract, time_estimate: 6-8 calls, about 85 s steady state, design target about 2. Building a world from prose: about 15 min.

**pattern-buffer** (`5000Stadia/pattern-buffer`, MIT, pip name `pbuffer` 0.2.0). Zero-dependency Python (stdlib `sqlite3`), about 12k lines, 183 commits (2026-06-11 to 07-28), 554 tests, all specs shipped (`specs/STATUS.md`). A library, plus an MCP stdio server of 39 model-free tools (`specs/MCP-WRAPPER-V1.md`). Model use is an injected `(prompt, schema)->json` for classification, extraction and `ask`; the reads need none. Storage: an append-only SQLite log (UPDATE is blocked by trigger, `buffer.py:59`).

**pattern-buffer-evolution** (no licence file). Not code: a closed research record (31 commits, 07-27 to 07-28; `RESULT.md`, `TAKE-BACK.md`, `PORTABLE-FINDINGS.md`) asking whether an assertion store answers questions that long-context or RAG cannot. Result: at 20 papers (24.6k words), **no**; only fold-at-time was a clean win. Portable findings: derived constructs need declared canonical ids; retraction differs from supersession; a decline goes stale.

**epistemic-projector** (no licence file; README says it is now private). A 9-commit experimental harness (07-26 to 07-28), closed. A "projector" composes answers over the store under a named, swappable policy (`projector/envelope.py`), plus one Anthropic API-key adapter.

## 2. construct's story structure

No acts as such: destination and pacing live in a hidden `plot:` frame the narrator never sees.
- **Phase** `setup|rising|crisis|climax|falling` (`arc/grammar.py:17`).
- **Beat** `(beat_id, phase, weight required|optional|flavor, achievable_via: Expr, unreachable_if: Expr, correlates)` (`grammar.py:40`): a world-state condition, path-independent, never a scripted scene. `Expr` is `StateIs|Located|InFrame|Occurred|BeatAchieved|ClockFired|TurnsQuiet|Quantity` combined by `AllOf|AnyOf|AtLeast|Not` (`arc/conditions.py`), evaluated three-valued (`truth.py`: unknown never satisfies either way).
- **Pillar** `(pillar_id, label, required, genuine_via, false_via)` (`grammar.py:57`). The causes of the ending: motive, means, opportunity. Coverage is tri-state (genuine / false / unfilled), read from the player's knowledge frame.
- **ConclusionShape** `(delta_type, tension (entity, stronger, weaker), world_condition, premise)` (`:94`): the backbone, with 5 delta types.
- **Clock** `(fires_when, effects with caused_by, rung, rearm)` (`:78`): pre-authored world moves.
- **Genre overlay** (`story_shapes.py:16`): 9 shapes (`deduction, bond, endurance, contest, gambit, discovery, mastery, farce, transformation`), each with a medium, withheld thing, judgment and payoff, . Theme and style are free text in meta (`bodycase.meta.json`). The "seed" is the player's premise text fed to `author_story`.
- **Choosing what happens next** is mostly code. `navigate()` (`arc/executor.py:744`) maps `turns_quiet` to a rung: surface at 3, draw 5, converge 7, confront 9, and holds if a beat just landed. A cheap `weave_pick` (`cohorts.py:249`, `let_run|pepper_hook|deliver_card`) picks among pre-built hook cards. Clocks fire on conditions. The narrator gets a briefing with no `plot:` rows.
- **State:** canon, `knows:*`, `plot:main` and `session:main` (turn ledger, pacing decisions) frames, all in pattern-buffer.

The investigation machinery (`cast.py`) is the part M7 wants:
- `Clue(clue_id, pillar_id, surface_fact (e,a,v), coverage_effect genuine|false|context, is_red_herring, reveal_mode, reveal_condition, debunked_by, hook_text)` (`cast.py:40`).
- `CastNode(node_id, shape_role, surface_role, holds_clues, presence at_scene|nearby|offscene, location, first_witness, is_culprit, pronouns)` (`:67`).
- Each clue's fact is seeded into the holder's `knows:<npc>` frame (`cast_seed_plan :535`). A clue reaches the player only through `revealable_clues` (`:574`) gated by `reveal_condition`, one fresh clue per NPC per turn, written to `knows:<player>` (`turnloop.py:5501`).
- `check_solvability` (`cast.py:178`): each required pillar has a live-reachable genuine clue; each strong red herring a reachable `debunked_by`; one culprit; every holder physically reachable.
- The live gate is crude: `_is_pressing` (`turnloop.py:803`) counts any "?" as pressure, and `traded`/`contradicted` modes (`cast.py:26`) are not live (`:36`).

## 3. pattern-buffer's truth model against holo-emitter's

`Assertion(seq, id, world_id, entity, attribute, value_type entity|literal|unresolved|delta, value, valid_from, valid_to, frame, status, confidence, asserted_at)` (`pattern-buffer/src/patternbuffer/model.py:79`). Facts:
- **Entities** are typed strings (`person:marn`, `event:...`). Assertions have ids, so metadata is assertions (`superseded_by`, `source`, `justified_by`, `caused_by`).
- **Provenance** `stated|observed|inferred|assumed|generated|default|retracted` plus confidence (`model.py:17`).
- **Time:** world `valid_from/to` and `asserted_at` (log sequence).
- **Who knows what** is a frame: `knows:<id>` holds exactly that character's facts; canon is truth. A frame can hold a different value from canon (contested truth, WHITEPAPER §6), so a false belief is representable. `frame_diff` (`porcelain.py:784`) gives what A knows that B doesn't; `who_knows(entity, attr, value)` (`:776`) gives the inverse. Both are computed, never stored. Out-of-frame facts are not redacted; they are absent.
- **Lies are not first-class.** A lie is a claim (an event: X told Y F) that differs from `knows:X`. Construct approximates it with `coverage_effect: false` clues and `alibi` fields. M7 must add `claims`.

holo-emitter's `src/make/world.js`: assertions are 5-tuples `[subject, attribute, value, provenance, as-of]` (`:20`), read as latest-wins, with entities keyed by hash ids born from an address (`id.js:16`) and relations `in|on|held_by|under`. It lacks: a frame (so no `knows:*`), assertion ids, retract/supersede records, as-of queries, the status vocabulary (provenance is a free string), and event entities with `caused_by`. Adding a sixth tuple element `frame` (default `canon`), plus `who_knows` and `frame_diff` (about 40 lines of JS), covers what a case needs.

## 4. epistemic-projector

It bears lightly. It is about answering questions over a document store, not characters. What transfers is its answer vocabulary: `present`, `declared_empty`, `undeclared_empty`, `retracted`, `explicitly_declined_by_source` (`projector/envelope.py`). That is the right set of states for a suspect: *tells*, *doesn't know* (nothing in their frame), *knows and refuses* (a source that looked and declined is not silent), *has withdrawn it*. Its rule that a decline is recomputed from the record every time, never carried forward (`LESSONS.md §1`), is exactly "a suspect who refused yesterday may talk after you show the letter." Take the states and rule, not the code.

## 5. For M7

**Reuse as is (the design, ported to JS data and functions).**
- Frame-isolated knowledge: a suspect's call sees only their own sheet, so they cannot leak (construct's "structural absence").
- The `Clue`/`CastNode`/`Pillar` field set as the case schema.
- Coverage tri-state and conclusion-as-effect. The accusation can be pure code: culprit id plus pillar coverage.
- `check_solvability` plus staging, merged with `reach.js` so "physically reachable" means the room and the locked door are reachable, not just a presence tier.
- The `navigate` rung table. The `(prompt, schema)->json` provider with tiers, timeouts, a payload cap and fail-open.

**Adapt.**
- Reveal gates: add `requires {learned:[clue ids], holding:[thing ids]}`, evaluated with `works.js` gate vocabulary (`$var`, `@holding`, state). This is the missing live `contradicted`.
- Topic selection by closed enum instead of `_is_pressing`; frames into `world.js`.
- Clue-bearing things (letter, drawer, key, muniment room) are holo-emitter things, with `clue` pointing at a case clue id.

**Missing.** Claims (what a suspect will say, true or false); a 1660 voice per suspect; an accusation scene; any JS or browser path to construct or pattern-buffer; an HTTP wrapper.

**Do not reuse.** The prose-to-world ingest and arc authoring (about 15 min, many calls), `turnloop.py`, the bots. The evolution result says a store buys little at this size. Author the case once as JSON and play it with no model.

**The narrowest model calls** (all schema-checked, any fail falls back to the topic list):
1. **Read** (small model). In: `suspect`, `utterance` (at most 200 chars), `topics[{id,label}]` (at most 16, this suspect plus global). Out: `{topic: id|"none", stance: ask|press|accuse|show|chat}`.
2. **Voice** (small model). In: `persona` (about 60 words: period, register, tics), `act: tell|deflect|refuse|lie|dontknow`, `facts[{id,text}]` (at most 3, the only things it may state, empty for dontknow), the last 2 lines, `max_words`. Out: `{line, used:[fact ids]}`. Checks: `used` is a subset of `facts`; the line names no entity from the world lexicon that is not in persona, facts, the player's words or what the player already knows; the length holds. One retry, then the fact text itself in plain words.
3. **Beat** (small model; rare). In: backbone line (theme, shape, phase), `menu[{id, kind arrival|discovery|lie_exposed|pressure, seed}]` of at most 5, each one code has already proved true now, and `quiet_turns`. Out: `{pick: id, line}` (at most 40 words). No model: code takes the first of the menu by rung and prints its seed. The opening and the closing narration are two more calls, each over code-built facts.

About 2 calls per question: 60 to 70 in a play of 30 questions.

**Contract sketch** (JSON, both directions closed-vocabulary):
```
case/1  { id, seed, theme, shape:"deduction", era:"1660",
  pillars:[{id,label,required}],
  cast:[{id,name,role,presence,home,first_witness,is_culprit,voice:{register,tics},
     knows:[{id,fact:[s,a,v]}], claims:[{id,fact,false,why}],
     clues:[{id,pillar,fact,effect:"genuine|false|context",
        gate:{topic,stance,requires:{learned:[],holding:[]}},hook,debunked_by}]}],
  things:[{id,kind,at,clue}],
  beats:[{id,phase,weight,when:Expr,hook}], clocks:[{id,when:Expr,effects:[Effect]}] }
emitter -> narrator  { turn, at:room, present:[ids], learned:[clue ids], held:[ids],
                       opened:[ids], said:[{who,topic,act}], quiet }
narrator -> emitter  { beat:{id,line, effects:[Effect]} }   Effect = spawn_person{id,at}
                       | move_person{id,to} | set_var{name,value} | reveal_thing{id}
```
Effects are a closed list run by `works.js` rules, so the narrator moves the world only by the world's own rules. Code writes `learned` and `said` as assertions in `knows:player`.

**Where calls run.** From a dev-only Node relay in `tools/` (about 60 fresh lines, `(prompt, schema)` in, JSON out), not the page. The public site cannot hold a credential, so published play uses the topic list, or a visitor's own key.

## 6. Risks

- **OAuth path.** `CodexProvider` uses a personal ChatGPT subscription token from `~/.codex/auth.json` against an undocumented consumer endpoint (`chatgpt.com/backend-api/codex/responses`). It sends `originator: pi` and a `pi (...)` User-Agent, i.e. it presents itself as another client (`provider.py:413-426`). Construct's README warns that subscription auth is for personal interactive use and recommends a metered key. Nothing refreshes the token, so it works only while the `codex` CLI keeps the file fresh, and the endpoint can change unannounced. Keep it to local development behind the `(prompt, schema)` seam, never in the page or public site.
- **Secrets.** Scanned all four for key, token, JWT and private-key patterns: none. Only canary strings in `epistemic-projector/tests` (`sk-test-...`, `sk-LEAK-...`) and a gitignored, 0600 Telegram-token design in `construct/setup.py`. No `.env` files are committed.
- **Licences.** construct and pattern-buffer are MIT (5000Stadia). pattern-buffer-evolution and epistemic-projector have no licence file (all rights reserved by default); same author, but ask before copying code.
- **State.** All four are quiet since 2026-07-28. pattern-buffer's README says `pip install pbuffer` but its road list says "not yet packaged to PyPI"; unverified.
