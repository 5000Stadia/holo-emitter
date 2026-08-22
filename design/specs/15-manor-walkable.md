# Rows 15 and 19 — the manor walkable, and carrier clearance completed

Rows 15 and 19 of `design/intention.md`. Row 19's own text sequences it **WITH** row 15 ("same run
licensed — the manor is where these become reachable in earnest"), so one plan covers both and one
close takes both rows out of the list. The targets and their done clauses live in the spec list and
are not restated here.

Where the two rows meet: row 15 multiplies the number of facings, objects-in-view and carriers by
eleven, and every clause row 19 names is a clause that had one subject or none before the manor
existed. Building them apart would mean building row 19's clauses against a world that cannot
exercise them, which is the "gates that cannot fail" family this project has paid for five times.
**Two of row 19's five clauses are the exception and §2.6 says so by name** — the manor does not
grow them a subject either, and their evidence is a doctored document and a boundary case.

---

## 1. What exists to build on (verified by running it, not by reading it)

- `fixtures/demo-study/plan.json` holds the whole manor already: 2 floors, **22 rooms**, 26
  openings (25 `door`, 1 `open_edge`), 48 windows, 11 fireplaces, **2 stairs**, 4 objects.
  Every room carries all four facings; `deriveMeta` returns a complete §5 meta for all **88**
  facings with **zero** validator findings against the meta clause set.
- `facingOfOpening` resolves both sides of all 26 openings. The graph is connected: every one of
  the 22 rooms is reachable from any other through openings and the two stairs.
- A draft manor `world.json` (56 exits) run through `validatePlan` produced **exactly one family**
  of findings — an exit whose `via` names an opening the plan has no `entity` for — 50 of them,
  and nothing else. Through `validate(fixtureDir)` the same family (54, `[row21:exit.via_unfilled]`)
  plus 108 §12.9 narration-coverage findings and **nothing else**.
- `fixtures/nav-manor/` is the EMPTY painted world the bare link boots (`plan.ref` → the manor
  plan). 2 locations, 2 exits, 0 entities. `backdrops/study/N` is the one promoted painting.

So the manor is already drawn, already validated, already projectable. What is missing is the
topology in `world.json`, the two ways through the building the code cannot yet name, and the prose.

## 2. The shape of the work

### 2.1 `exit.via` may name the building, not only a leaf

Exits resolve `via` against a transition ENTITY (row 2) or, since row 21, against a facing meta's
opening whose `via` equals it. `via` is `entity ?? null`, and **exactly one** of the manor's 26
openings carries an `entity` (`op13` → `door1`). So 24 door openings, the court mouth and both
stairs are unaddressable.

The fix is not to give every opening an `entity`: `openings` is inside `draw_plan.py`'s
`DRAWN_KEYS`, so writing 25 new fields into the plan moves the drawn digest of the drawing Kabe
approved and prints UNAPPROVED REVISION — a redline that ends at a human, for a change no human
asked for.

Instead: **an exit names the thing it passes through, and a hole in a wall has a name of its own.**
`exit.via` resolves, in this order and no other:

1. a transition entity the world holds (a leaf) — unchanged, still knowledge-filtered;
2. a meta opening/threshold/flight whose **`via`** equals it (row 21's building fact);
3. one whose **`id`** equals it — the plan's own name for the hole, the mouth or the flight.

`via` keeps its recorded meaning ("the entity that fills it, or null") and `id` keeps its, so
`architecture.md`'s sentence about `op14`/`op15` appearing as `via: null` geometry stays true *of
the demo world* (§8 corrects it for the manor).

**One home, and it is bound rather than asserted [F31].** `groundplane.openingFor(meta, via)`, on
the module both the renderer and the fixture validator already import. `validator.spec` **displaces
it at runtime** and requires both the renderer's aperture list and the validator's verdict to move
with it — the same binding row 12 had to build for `placeHost` after "imports the scale functions
and re-derives the layer above them" satisfied a row's letter and defeated it.

`tools/validate-plan.mjs`'s `crossCheckWorld` is **not** a second implementation of that lookup and
must not read as one: `openingFor` resolves a **meta** (scene pixels, one facing), `crossCheckWorld`
resolves the **plan** (metres, both sides of an opening). Two documents, two questions. What binds
them is a case asserting that on the shipped corpus every exit that resolves in one resolves in the
other, and that the entity-before-id precedence is the same in both.

**Truth naming a presentation id, chosen deliberately [F45].** `world.json` is the home of topology
truth and §4b item 11 makes it a document a host emits over a wire; after this row it cannot be
resolved without the plan revision that names `op07`. The alternative — an exit naming only its two
rooms, with the opening derived — was rejected because two rooms can share more than one opening
(the manor does not today, and a solver-authored plan will) and because the derivation would then
live in the renderer instead of in the document. The coupling is real, it is one-directional (a
rename is caught by `[row21:exit.via_unfilled]`), and it is written here in §4b item 11's own terms
so the transport row does not discover it.

### 2.2 A stair is a fact about the building, exactly as a doorway is

`world.json`'s stair exits name a flight; nothing in the picture or in the meta knew a flight
existed. `deriveMeta` gains `meta.stairs[]`, and the grid draws it.

**Every field, with its source [F4].** `id`, `treads`, and the run/width extents come from
`plan.stairs[]`'s own `id`, `treads` and `rect`. `direction` is `"up"` when the room is
`joins[0]` and `"down"` when it is `joins[1]`, which is the same convention `crossCheckWorld`
already reads. `rise_m` is the **lower** room's floor's `storey_height_m` — one definition, true
from both ends. `u0`/`u1`, `depth_near_m`/`depth_far_m` are the plan rect in the view's own terms.
`x/y/w/h`, `poly` and `floor_poly` are those metres projected. **The named limit**: the plan carries
no vertical datum, so `rise_m` is a storey height and not a measured total rise — floor structure is
unmodelled, exactly as `architecture.md` already records for `treads` (checked against a 10–30 band
because there is no rise to check against).

**ONE geometry, and it is a rising flight, not marks on a floor [F1, F2].** A tread at depth `d` and
height `h` draws at `y = horizon_px + (eye − h)·f/d`. That is the pinhole this project already pins,
read at a height instead of at zero, and its consequence is the opposite of what this plan's first
draft guessed: with the measured eye at 1.08775 m, a tread above eye height draws **above** the
horizon and the spacing **widens** toward the top. The first draft said "the top treads are a few
pixels apart", which is what a flight painted flat on the floor would do, and it was wrong.

That projection is **new camera math and it gets one home**: `groundplane.yAtHeight(depthM,
heightM, meta)`. `heights.spec` binds it — the drawn tread positions are predicted test-side from
the plan's own numbers (rect, treads, storey height, standpoint) and **measured off the render**,
which is §12.5 (v)'s own shape; and `mechanisms.spec` displaces the function and requires the
picture to move. Nothing anywhere re-derives it.

**Two things are drawn, and they answer two different views.** The footprint on the FLOOR is the
flight's own plan position — the well seen from above, the ground under the steps seen from below —
and it is all that survives on a descending flight, whose steps drop below the frame within a metre
at this eye height (measured: from `stair_landing/S` the visible well is y 769–1024). The tread
NOSES are the flight itself, and on an ascending one they run from the frame bottom to y ≈ 174.

**A flight does not run into an unbroken ceiling [F3].** `great_stair`'s top tread lands at y ≈ 174
against `great_stair_hall/N`'s ceiling line at y ≈ 187, so without this the picture would show a
staircase disappearing into a plane the document has no aperture in. The plan cannot express a
floor opening and this row may not add one, so the renderer derives it: the flight's footprint
lifted to the storey height is the **well**, and the ceiling's line work — its wall-ceiling line,
its junctions, its fan and its transverse set — is clipped out of it. A stairwell is a hole in the
ceiling, and the ceiling is line work, so the hole costs one clip path and no new appearance. The
well is carried in the meta as `well_poly` so the renderer reads it rather than recomputing it.

**`up` and `down`, and what anchors them [F5, F6].** `up` and `down` are compass directions of
travel, not room names, and `crossCheckWorld` already reads them that way. Two new plan clauses
anchor them as far as a drawn plan can: `[row15:plan.stair_directions]` requires `up` and `down` to
be **opposite**, and requires the flight rect's **longer axis** to be the axis they name — the run
of a flight is the direction it travels, and that is drawn content. What it cannot anchor is which
END is the top, because the two rooms a flight joins are stacked and have identical rects; that
residual is named here rather than left to be discovered. Both shipped flights pass: `great_stair`
runs 4.8 m N–S against 1.6 m E–W with `up: "N"`; `back_stair_flight` 4.6 m E–W against 1.1 m N–S
with `up: "E"`.

**A stair IS an aperture, and there is one resolution path [F9].** `apertures()` returns it, so the
hit region, the hover halo, the page's `go` resolver and row 10's keyboard control all read one
list — which is the guard row 11 had to move into `layout` after 11,415 opaque pixels of door stood
in open void. `[row21:exit.opening_offscreen]` and `[row21:exit.via_unfilled]` reach it through
`openingFor`. What is different from a doorway is only what is DRAWN and what the wall is asked
for: a doorway must fall inside a band that stands, a flight asks the wall for nothing, and a
threshold must fall where nothing stands (§2.3).

**Its hit region is its outline, not its bounding box.** A flight is a quad on a receding plane;
a rectangle around it answers "climb the stair" for a click on the bare floor beside it, and this
project's resolver has been wrong in exactly that direction before (the notebook answering clicks
85 px away on bare wall). The aperture carries `poly` and `resolve` tests the point inside it.

**A flight appears on one facing of its room and on no other [F8].** That is row 11's omission
census gaining its largest member, and it is stated as such rather than filed quietly: §2.7's
census is per facing and names it, and the batch carries a frame of a stair room's OTHER facing so
Kabe sees what turning inside one looks like. Multi-facing presence for building fabric is §4b item
9's and is not this row's (§5).

### 2.3 An open threshold is the absence of a wall, and it is walkable

`op_court_mouth` (`kind: "open_edge"`, 20.4 m) is the only way between the entrance approach and
the entrance court, so without it one plan room is unreachable and the row's done clause fails.

`meta.openings` entries gain `kind: "door" | "threshold"`, typed by
`[row15:meta.opening_kind]` — the renderer's two branches are opposites and a missing kind would
take the door branch and cut a jamb into open ground.

**The rectangle, and it does not cover the sky [F11].** Everything beyond a threshold lies on the
ground plane, and on a level camera the ground plane runs from the threshold's own line **up to the
horizon and no further**. So the rect is the mouth's width at the mouth's own distance, from the
horizon down to the ground at the mouth: on `entrance_approach/N` 1068 × 57 px, on
`entrance_court/S` full-width × 165 px. No constant, no cap chosen by hand, and the top edge is a
camera fact.

**What is drawn, and the one thing that is [F10].** The first draft said "nothing", and then called
it clickable — which is a 20.4 m `go` target on featureless ground, the exact defect §2.2 refuses
for the stair, argued away one section later. Law (b) does forbid painting an enclosure there; what
it does not forbid is a **line on the ground**, and the grid already draws a transverse ground line
every half metre. So the threshold draws its own ground line — the line where this space ends and
the next begins, at a position the plan holds — as a major stroke, and nothing else: no jamb, no
reveal, no soffit, no fill. The mark is the document's, and the two band ends beside it frame it.

**No through-view, stated as a choice.** What lies beyond an outdoor mouth is a vista, and ruling
(1) gives the vista to a generated backdrop; a frame pasted into the gap would make an [AI]
appearance the established look by default. `beyond_m: null` is how the meta says so, and
`drawThroughOpening` reads null as silence rather than as a guess.

**`apertures` inverts the band test for it.** A doorway needs a band to be a hole in; a threshold
needs the absence of one, or it is a way through a standing wall. One law, two directions,
`spannedByBand` and `crossesAnyBand`.

**What its scale is quoted at, and what is unsettled [F12].** The mouth's distance is measured from
the standpoint to the mouth's own line — not to a wall line and not to a far line — so law (a) is
untouched and nothing is read off an unsettled quantity. What remains unsettled and is row 4's is
what an open facing's far line LOOKS like; this row draws the honest minimum already in place.

### 2.4 `world.json` grows the manor

22 locations × 4 facings, **56 exits** — 25 door openings and the court mouth in both directions
(52), plus the two stairs in both directions (4). `entities`, `relations` and `knowledge.player`
stay empty. Exit ids follow the two that exist: `door_<from>_<to>`, `stair_<from>_<to>`,
`way_<from>_<to>`; `door_study_hall` and `door_hall_study` keep their ids and their prose, which
carry Kabe's own live finding of 2026-08-22.

`arrive_facing === facing` on all 56, including stairs where the facing must equal the flight's
`up` out of the lower room and `down` out of the upper.

**Authored, not generated [F46].** `world.json` is the home of topology truth and the plan is
presentation-side; generating truth from presentation inverts the split the project rests on. That
does leave a large second copy of one fact, against this project's own newest rule — *prefer
deleting the second copy of a fact to writing a guard that compares the two* — and the exception is
stated in one sentence: **the copy is the one the wire will carry**, and the rule's own remedy
(delete one) would delete either the document a transport emits or the document a human approved.
So it is guarded, and the guard is the half that was missing:

- `[row15:plan.opening_unwalked]` — **scope, stated once [F34]**: an opening or a stair must be
  walkable in **both** directions whenever the world names **both** rooms it joins. `demo-study`
  names two rooms and stays green as a consequence of the rule, not by an exception carved for it.
- `[row15:plan.rooms_reachable]` — a breadth-first walk from the boot viewstate's location reaches
  every room the world names. Connectivity is not implied by the clause above.

**And reachability is a hand, not a graph [F33].** `[row15:plan.rooms_reachable]` is satisfied by a
graph while a phone player cannot hit a door. Measured, at 390×844, over all 56 exits: **29 are
under 44 CSS px wide**, 10 are under 24, and the smallest is 17 × 34 (the entrance court's flanks,
whose standpoint stands 15.30 m off its wall). Three things follow, and none of them is a widened
tolerance:

1. **The pointing tolerance ring reaches doorways.** §7's amendment is "a widening tolerance ring
   for targets too small to hit exactly", and `resolve` applied it to takeables and to a leaf but
   never to an opening. It applies to any aperture now, under the same "clearly smaller than what
   is exactly under the point" rule, so a near miss on a 17 px doorway lands on the doorway instead
   of on nothing.
2. **The measured minimum is pinned**, per exit and at the shipped phone width, so it cannot get
   quietly worse; the current worst is a number in the test and in the batch.
3. **The cause is the standpoint law's uncapped stand-back, and that is Kabe's** —
   `architecture.md` records that a cap on `standpoint_stand_back` "would be a rule for the
   document, with one home … and it is Kabe's to set". The distribution goes to him in the batch:
   88 standpoints, min 2.15 m, median 6.60 m, **11 over 12 m and 10 over 15 m**, max 26.75 m [F44].

### 2.5 The prose

112 lines (56 arrivals + 56 unreachable refusals) plus the four wildcards.

**Room names are authored, not case-transformed [F24].** "MUNIMENT ROOM" is a draughtsman's label
on a schematic; a cased label read aloud is a diagram label. The plan's names are an authoring
input; the player-facing names ("the muniment room", "the cross passage", "the buttery and pantry",
"the solar") are written, and `surface-strings.md`'s byte-compare covers the authored form.

**Arrival prose is per direction where direction changes what is true [F7].** Ascending, the flight
is behind you and falls away; descending, it rises behind you. A doorway stands open behind you; the
court mouth stands open behind you. §12.9 cannot see a false sentence — non-empty, distinct and
resolvable are all satisfied by one — so the four forms are enumerated rather than left to the ear.

**Distinctness is a consequence of the topology** (every line names both rooms), which is exactly
why it proves nothing about taste. So: **the manor's whole transcript goes into the batch** as
`TRANSCRIPT.md`, 112 lines a human can read in one sitting, with its own question [F47]. This is
the largest body of player-facing prose in the product and it would otherwise ship judged only by a
test it satisfies by construction.

`design/surface-strings.md`'s `STRINGS` block grows by the same 108 rows and its `COUNT` moves with
it. **Which half of `voice.spec` holds them [F39]:** the byte-compare against every world's
`narration.json` in both directions, and the audit-integrity clauses — not the runtime DOM sweep,
which row 14 records as structurally unable to leave the study. Row 14 is **not** a prerequisite:
nothing here depends on the sweep reaching a second room, and the manor's lines are held by the
comparison and by `nav-walkthrough`'s own reading of arrival lines off the real pane.

### 2.6 Row 19 — carrier clearance completed

Five clauses. Each has a ledger case that fails on that clause alone and names it.

1. `[row19:plan.object_clear_of_thresholds]` — the second carrier. An object footprint overlapping
   a door's or an open edge's own rect stands in a doorway.
2. `[row19:plan.object_clear_of_standpoints]` — the third carrier. An object footprint containing
   any standpoint of its own room stands where the viewer stands. **The critic's first
   construction.**
3. `[row19:plan.object_projects_finitely]` — **a validator finding, at validate time, on the corpus
   the bake refuses on [F28]**. For every facing whose view contains an object, the projected scale
   must be finite **and greater than zero**; `plan-projection.mjs`'s own refusal is belt-and-braces
   beneath it, not the clause. **The done clause's words are narrower than the defect it cites
   [F29]**: `-1152` is finite, so `Number.isFinite` alone ships green with the cited construction
   passing. The reading built is "finite and > 0", and the close says so.
4. `[row19:staging.wall_mounted_over_storey]` — a `wall_mounted` placement whose top (`v` + the
   record's height) rises above the facing's `storey_height_m`. **The critic's second construction**
   — a 2.0 m door in a 1.85 m room.
5. `[row19:plan.opening_over_storey]` — the same bound on the building: a derived opening's ruled
   2.00 m head above a floor whose `storey_height_m` is less than that.

**Two of the five still have no subject in either shipped world, and §1's coupling argument does
not cover them [F27].** Clause 4 needs staging (the nav world has none; the demo world's door is
2.0 m in a 2.8 m storey) and clause 5 needs a floor under 2.00 m (both manor floors carry 2.8).
Their evidence is a doctored document plus a boundary case, and that is said plainly rather than
counted as manor coverage.

**Precedence, written before the cases are constructed [F30].** The ledger requires each case to
trip its clause and nothing else, so a construction that trips two makes the case a matter of
whoever picked the construction. One fault, one finding, in this order, extending row 20's own rule
that a standpoint in masonry takes precedence over the branch and placement clauses:

> `plan.standpoint_clear` → `object_clear_of_standpoints` → `object_clear_of_carriers` →
> `object_clear_of_stairs` → `object_clear_of_thresholds` → `objects_do_not_share_floor` →
> `object_projects_finitely`

An object that trips more than one reports only the first, because the first is the one that
explains the rest — an object standing on a standpoint necessarily projects badly.

**Which clauses carry a number, and which have no boundary to pin [F50].** 1 and 2 are containment
predicates: their only "boundary" is a geometric epsilon and a case there pins nothing a critic
could widen, so they get an adjacency case instead — a footprint sharing an edge with a threshold
is clear, one overlapping it by a millimetre is not. 3, 4 and 5 carry real numbers (zero, the
storey height, the ruled 2.00 m head) and each gets a two-sided boundary case **phrased in absolute
terms**, because the row that pinned `meta.one_lens` learned that `TOL × 4` is true for every value
of `TOL`.

**Where the tokens are scanned from [F32].** Clause 3's emit site is `tools/plan-projection.mjs`.
Row 18 — which makes the completeness scan read `renderer.js` and `bake-fixtures.mjs` — is **not
built**, and this row does not assume it. `guards.spec`'s `EMITTING_DIRS` already walks `tools/` to
the bottom, so `plan-projection.mjs` and both validators are covered today; `src/renderer.js` is
**not**, so the row's renderer mechanisms are held by ledger cases in the existing renderer family
and by `MECHANISMS` declarations, exactly as row 21's were, and row 18 still owns the scan.

### 2.7 What the picture must not start saying

Eighty more facings begin to render. Four guards, all per facing:

- **The omission census goes manor-wide, per facing, derived [F18].** Not a total: a count per kind
  is satisfied by the right totals over the wrong walls, which is precisely the weakening row 11
  paid for. The census is pinned as an object keyed by facing — 88 entries, each the count of
  carriers the plan holds on that wall and the picture does not draw — plus the drawn set. A wall
  that goes blank names itself.
- **Law (b)'s rendered half runs on every facing, not a sample [F17].** The document-side check is
  per facing already and sampling the rendered half re-introduces the shape round 4 removed. Every
  one of the 88 metas is rendered and measured: no wall pixel outside a band, a corner exactly
  where the meta says one is and nowhere else. One page, 88 renders, measured scalars.
- **The `+` junction guard runs manor-wide, and it finds eight [F19].** It exists for Kabe's own
  verbatim symptom. Computed over all 88: **eight facings of non-corridor rooms show more side wall
  than facing wall** — `garden_room/E,W` and `closet_chamber/E,W` at 64 %, `entrance_court/E,W` at
  61 %, `privy_garden/E,W` at 76 %. Every one is a narrow room viewed along its long axis from a
  stand-back standpoint. This is a **plan warning**, not a finding, on the project's own precedent:
  a validator that refused them would refuse the approved plan, and one that could not see them is
  why nobody would ever find them. They are computed, printed, carried into `projection.md`, and
  put to Kabe in the batch with a frame — the facing type is his.
- **`[row21:exit.opening_offscreen]`'s predicate, stated then reported [F21].** The clause refuses
  an opening **wholly** off the frame; a sill below the frame bottom is the honest picture under a
  pinned lens, which is why row 20 retired the fits-the-frame clause rather than softening it. On
  the real corpus: `hall/N` and `hall/S` carry `op14`/`op15` at y 90 with their sills 18 px below
  the frame, and **no exit of the 56 fires the clause**. Reported as a measurement, not asserted as
  an outcome.

**An outdoor wall has no top, and that is a look question with a name [F16].** `storeyHeight`
returns null for an `open`-typed room, so the privy garden's and the entrance court's walls draw
from the floor line to the frame edge with corner verticals to match. The plan holds no outdoor
wall height and adding one is a drawn field. This row does not invent one: it renders what the
document holds, records the consequence here, and puts a walled-garden facing in the batch as its
own question. Under-specification, named — not a height the picture claims.

**The facing glyph is now on every wall in the product [F22].** Row 20 sized it against "a room
with a label on the wall is a diagram". After this row nearly the whole product is bare facings.
The row ships it unchanged and shows Kabe a frame, because re-judging it is a look call and his.

### 2.8 §12.2 and §12.8 across the new facings, with subjects that exist

- **"Leave a room and return and the world is exactly as you left it" is measured where something
  could have changed [F25].** In `nav-manor` — no entities, no relations, empty knowledge, a
  viewstate of exactly `{location, facing}` — a hash identity across a round trip cannot fail; it
  is §12.2 restated, and it is the sixth appearance of the family §1 opens by naming. So the round
  trip runs in a **staged tree**: `nav-manor` copied, given one toggleable entity and one takeable,
  re-baked, walked through twenty rooms across both floors and back, and the assertion is that the
  **changed** state survives — the thing is still open, the thing is still held, the picture of the
  room is the picture it was, and the truth document says so.
- **Which §12.8 switches have a subject on an empty facing, counted honestly [F26].** `tint`,
  `shadows`, `parts` and `part_t` are per-entity and produce an identical hash where nothing is
  staged. On a stair, threshold or open facing what discriminates is `no_backdrop` and
  `backdrop_only` — two, not six. The other four run on the staged world above, where they have a
  subject. The row reports two and four, not six.
- **§12.2 clause 1** (fresh-load hash identity) and **clause 2** (replay) over a manor route
  crossing both floors, in both engines.

### 2.9 The walkthrough

`nav-walkthrough.spec.mjs` grows a manor route driven by **real clicks and real arrow keys**, at
desktop and at 390×844: study → cross passage → kitchen → entrance court → (threshold) entrance
approach → back → great hall → back stair → **up** → back stair head → long gallery → muniment room
→ solar → stair landing → **down** → great stair hall → library → great hall → and home. Every
arrival line read back off the pane. The keyboard half is not a variant of the pointer half: row
10's rule is that every intent a pointer can emit is reachable by keyboard alone, and a stair and a
threshold are two aperture kinds that rule has never covered.

### 2.10 What gets measured and reported rather than assumed

- **The worst facing's repaint cost, throttled [F40].** Row 21's through-view is a full extra render
  per open doorway (63.9 ms against 12.9 on `study/E`). The manor's stair halls and great hall carry
  several doors on one wall. The worst facing is measured per turn at 4× and 6× CPU throttling and
  the number goes in the batch; bounding the scratch to the opening rect is named as the fix and is
  not taken here, because it must not move a hash.
- **Cold boot at 390×844 with 88 baked metas [F42]**, beside `backdrops/baked.js`'s existing
  megabytes — shown as a measurement a human can see, not a figure in a README.
- **Suite runtime, both engines [F43].** The 90 s timeout is a known cliff and a Firefox case has
  already failed once under load. The row states which sweeps go manor-wide and which sample, with
  a measured total.
- **The narration pane at the end of a twenty-room walk [F23]**, in the batch, because the scene
  canvas may not carry a fix and any answer is chrome.
- **Arrival displacement per exit [F13]** — the metres a player crosses on arrival, the way row 20
  measured the 90° turn at 2.38 m. It is the evidence the deferral in §5 will eventually be decided
  on.
- **A door onto an OPEN destination [F41].** `great_hall/S` looks through `op01` into
  `entrance_court/S`, which has `camera_far_m` and no `camera_wall_m`. The device already handles it
  (`cameraDistance` is typed), and this row asserts it: the through-view is measured on that
  opening, and a test asserts that **none** of `drawThroughOpening`'s three silent `return false`
  paths fires anywhere in the manor — so "never void" stops being conditional on conditions nobody
  had checked.

## 3. What this must not touch

- **`fixtures/demo-study/plan.json`.** Not one byte. Row 22 is the row licensed to move it.
- **`design/plan-draft/`'s sheets, `approval.lock`, `APPROVAL_COMMIT`.** Same reason.
- **The demo world.** `fixtures/demo-study/{world,staging,narration,viewstate}.json` do not change.
- **`backdrops/`.** The promotion stands as row 21 built it.
- **`src/groundplane.js`'s camera constants, `replicator/contract.json`.**
- **The renderer's draw order, tint, shadow and hit-test contracts.** New drawing is additive.

**What DOES move in the demo world's pictures, measured rather than claimed [F37].** The first draft
said "no existing facing's pixels may move — measured, not asserted", and this repository has no
committed cross-commit canvas guard; the geometry battery measures geometry. Two things are true and
both are stated: (a) the demo world's eight facings are unaffected by design — `door1` resolves by
entity as before, and `study/E`/`hall/W` are the only facings with an aperture; (b) the **navigation
world's `hall/N` and `hall/S` DO move**, because the manor world names `op14` and `op15` as exits
and those walls gain doorways. `design/batches/row21-promotion/`'s frames 06 and 08 are pictures of
those facings and are **re-captured**, which is that batch's own designed behaviour ("pictures of
what the link serves now") and is recorded in this row's batch README so Kabe is told rather than
left to notice. The row runs the by-hand cross-commit hash capture over the demo world's eight
facings and reports the result.

## 4. What outside this feels the change

- `tools/bake-fixtures.mjs` bakes 88 metas for the nav world instead of 8.
- `design/surface-strings.md` grows by 108 rows — a code-class change, in the work commit.
- `design/architecture.md`: the manor's own section, and every sentence the row falsifies, **derived
  from what the row changes rather than recalled [F48]** — the "not built yet: row 15's manor" line,
  the two-room framing of the nav world, the census scope, the `op14`/`op15` "neither of which any
  exit names" sentence, the multi-standpoint hand-off, the "nothing drawn two doorways deep" limit
  becoming ordinary, and row 21's residue note that its three through-view ledger cases "measure
  states no shipped world reaches … until row 15's manor makes those states ordinary" — which this
  row discharges by moving them onto real chains.
- `README.md` describes a two-room demo; the link now walks a manor.
- **Row 10's assistive surface [F49]**: row 21 recorded that a screen-reader user hears nothing on
  seven of eight facings of the empty world. After this row that is ~86 of 88. The row does not fix
  it and does not leave it unowned: it rides to **row 10** with its new size named in that row's
  own text, which the Navigator holds.
- **Wayfinding has no owner and needs one [F14, F15].** No compass, no map, no 180° turn; the
  arrival line is spoken once and a player who turns twice is not told again; §4b notes the plan
  makes a minimap "a render of an artifact that already exists". At 22 rooms this stops being a
  limit and becomes the design. **Allocated as a new row** (Next ID) rather than absorbed here.

## 5. Deliberately not in this row

- **Multi-standpoint rooms (§4b item 9), and arrival at the threshold.** [HUMAN, 2026-08-21]: *"when
  we go through the door first we should be standing IN the door right?"* — and row 20's residue and
  `architecture.md` hand it to row 15 by name three times. **Deferred by Navigator ruling recorded
  here against that sentence [F13], not inferred from an [AI]-packaged row text**: multiplying or
  moving standpoints is DRAWN content, so it moves the digest of the drawing Kabe approved and ends
  at a human redline exactly as row 22 does — and it needs a facing re-keying the plan schema does
  not have. What this row owes it is the evidence: the arrival displacement per exit, measured and
  batched (§2.10).
- **The scenic vista** (row 4's), **painting any room**, **through-view two doorways deep** and the
  destination's parallax (row 21's named limits, now ordinary rather than theoretical).
- **A cap on `standpoint_stand_back`** — Kabe's, with the distribution batched (§2.4).

## 6. The human gate [F35]

The playbook: *"any row that changes what the player sees carries in its done 'the human has
approved consumption-camera screenshots'."* This is the largest visible change since row 1 and it
ships with the row-21 convention, wired the same way:

`design/batches/row15-manor/` with `capture.mjs` beside the frames, byte-compared by `plan.spec`
against what the code draws today; an entry in `design/approvals.log` naming that directory with
`-` in its commit column, which `plan.spec` reads as an open gate and which requires the batch to
be in the tree with pictures in it. The row **closes on batch delivery**, as rows 4 and 21 do — the
human gate never blocks a run — and the close says in writing that Kabe's verdict is outstanding
and where it is recorded.

**Frames [F36]:** the great hall; a typical chamber; the long gallery (corridor); the privy garden
(open room, walled facing — the outdoor-wall-height question); the entrance court (open type); the
entrance approach's threshold; a stair going up and the same room's other facing (what turning in a
stair room looks like); a stair going down; `hall/N` (a facing with no floor line and a new
doorway); a through-view into an open destination; and a demo-world facing BEFORE/AFTER, re-rendered
from the parent commit through the same script, so "no existing facing moved" is a picture and not a
claim. Plus `TRANSCRIPT.md` (the 112 lines) and the measured tables of §2.10.

**Row 22 sequencing [F38].** Row 22 moves the study's hearth and `study/S`'s standpoint and
cascades through the derived meta, `standpoints.tsv`, `helpers.mjs`'s literals and `projection.md`.
If row 15 lands first — as it is about to — the row-15 batch's `study/*` frames and its pinned
per-facing literals move when row 22 lands. That is why the batch carries its own `capture.mjs` and
why the literals are read from `standpoints.tsv` rather than typed: row 22 re-runs one script and
re-renders one batch, and this paragraph is where its builder is told so.

## 7. Order of work

1. `groundplane.openingFor` and `yAtHeight`; the three `via` resolution sites; the displacement
   bindings.
2. `deriveMeta`: opening `kind`, thresholds, `meta.stairs` with `poly`/`floor_poly`/`well_poly`.
3. Renderer: aperture kinds, the flight's line work, the ceiling's clip, the threshold's ground
   line, the band test inverted, the tolerance ring reaching apertures.
4. `world.json` + the two completeness clauses + the reachability measurement.
5. Narration + `surface-strings.md` + `TRANSCRIPT.md`.
6. Row 19's five clauses, their precedence, their ledger and boundary cases.
7. Tests: census, law (b) rendered, the `+` guard, offscreen, §12.2/§12.8, walkthrough, keyboard.
8. Documents: `architecture.md`, `README.md`, the new wayfinding row.
9. The batch and the approvals entry.

## 8. Sentences this row falsifies elsewhere, and what replaces them

`architecture.md`: *"The cross passage's north wall carries `op15` and its south wall `op14`,
neither of which any exit names"* — true of the demo world, false of the manor. What survives is the
rule beneath it: a meta carries every door the plan puts on a facing, and the renderer cuts a hole
only where the WORLD says there is a way through. The manor world says there is; the demo world
still does not.

## 9. The edges I expect to be wrong about

- The stair's `poly` is the tread noses; on a descending flight there are none in frame and the
  polygon falls back to the well's own outline. Whether that reads as a target a player aims at is
  a question the batch asks.
- The threshold on an open facing spans the whole frame width at 165 px tall. It is the ground
  beyond the mouth and nothing else is clickable out there, but it is a large target reached by
  aiming at ground.
- Eight facings fail the `+` guard and two show no floor line. The census will say whether there
  are more of the second kind.
- 88 baked metas is roughly eleven times the JSON the page parses at boot.
