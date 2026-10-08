# Development receipts

What each piece cost to make, so asset-building efficiency can be pushed toward a real holodeck:
build a place in the time it takes to walk to it. One receipt per piece, newest first.

- **Wall-clock** is my time from first step to verified, split by stage:
  - *research*: facts about the place;
  - *design*: the brief and rules;
  - *pieces*: new kit parts;
  - *assembly*: compiler and page;
  - *verify*: renders, checks and fixes.

  Piece-making is kept separate from design and assembly, as you asked for the manor timing.
- **Runtime** is what the browser spends, measured in the page (`window.__receipt()`).
  - It's measured on this machine, which has no GPU (SwiftShader).
  - A real GPU is much faster at the light bake (estimated 1–3 s against 33 s here). Compile and build times are CPU work and won't change much.
- **Reuse** lists what came from the kit already built, against what had to be made new. The trend to
  watch: each new place should need fewer new pieces.

| Date | Piece | Wall-clock | New pieces | New lines | Compile | Build | Walkable (no bake) |
|---|---|---|---|---|---|---|---|
| 2026-10-05 | A review pass on the shelf recipe (2 rounds, fresh reviewer) and its changes | 11 min + reviewer | 0 new kinds; recipe rules changed | ~150 | – | 0.20 s (three units) | – |
| 2026-10-05 | Owners: the widow, the smith, Sir Fancy-Pants (habit rules + 13 trinket recipes) | 5 min | owner profiles, 13 trinkets | ~260 | – | 0.17 s (three shelves) | – |
| 2026-10-05 | Live titles; shelves filled by the owner's means and the room's purpose | 4.5 min | title atlas, 4 bindings, contexts | ~170 | – | 0.16 s (wall) | – |
| 2026-10-05 | The book as its own recipe; a 581-book library wall from it | 5 min | 1 recipe (book) + library wall | ~230 | – | 0.12 s (wall) | – |
| 2026-10-05 | A bookpress full of books, c. 1666 (one object, conception to checked) | 9 min | 1 object (+ spine atlas, acanthus) | ~200 (+84 stage) | – | 0.18 s | – |
| 2026-10-05 | R45 fixes from your review (rolls, corners, stonework, floor) | 7 min | 1 (flagstones) | ~110 | 11 ms | 1.38 s | 5.8 s |
| 2026-10-05 | R45 muniment room from the period brief | 19 min | 7 | ~1,000 | 10 ms | 0.43 s | 5.1 s |

---

## A review pass on a recipe (2026-10-05)

You proposed reviewing the recipe instead of building a test harness first: "is this a correct depiction under criteria X? If not, which step needs adding or changing?", then running the recipe again.

**How it ran:**
- The owners' shelves were written out as text: every shelf, its items left to right, the gaps.
- A fresh reviewer (Sonnet 5.5, never shown the code) judged each owner against the recipe's steps S1–S6 and named the step to change.
- At most two rounds.

**Wall-clock: about 11 min of mine, from 17:20 to 17:31.** The reviewer took about 1, 2 and 0.6 min across three answers, using about 150k tokens in all. My first brief left out the shelf layouts, so its first answer judged the rules alone.

**What it changed in the recipe** (each rule now serves every future shelf):

| Step | Before | After |
|---|---|---|
| S3 (its most important) | The shelf's height chose the book's format | Every work carries its own format. A shelf takes only works of its size; folios sit at the bottom. A household Bible (quarto) lies flat at hand. |
| S1 | Counts were too generous | Counts follow means. The widow owns 0–4 books, most often 1–2. A middling household owns about 2. |
| S1 / S4 | A jug or tankard held a run of books | Only things that stay put hold a run. Things are drawn without replacement, so no duplicates. |
| S1 | The smith kept horseshoes and nail pots on the house shelf | His tools stay in the smithy. |
| S2 | One unit for everyone | The unit comes from means: two wall boards for the widow, a short open unit for the smith, a full press for the gentleman. |
| S4 | Things placed anywhere | Heavy things go low, daily and breakable things at hand, nothing above 1.3 m in a working house. Things group beside the books. |
| S5 | Display inside the case; a clock on a shelf | Curiosities stand on top of the case. No clock or candlestick on display. |
| S6 | Great bindings were mostly gilt, mixed at random; sets of any title | Mostly plain calf in matched runs, gilt a minority, no loose pamphlets. Volumes only for works that ran to them. Each work once per unit. A gilt label always names its book. |
| S6 | 59 named works | Each subject grows more from its authors and their works, Latin for the classics. Blank spines in the gentleman's press fell from about 90% to 23–28%. |

**Final verdicts:**
- **Widow:** right.
- **Smith and gentleman:** "partly", with the round-two fixes applied but not re-reviewed, because of the two-round cap.

**Not yet:** the curiosity kinds the reviewer asked for (skull, dial, telescope, bust, writing box) don't exist.

**Where the cost sits:** this is authoring cost, paid once per recipe. Building the three units still takes 0.2 s and **no AI calls**.

 (2026-10-05)

You pointed out that a person, poor or not, keeps their books together, and that the empty part of a shelf holds other things. Asked: what does the poor widow have on her shelf, the blacksmith, Sir Fancy-Pants?

**Wall-clock: about 5 min, from 15:05:58 to 15:10:33**, including two renders and two fixes.

**Built:**
- **An owner profile (`lab/brief/owners.js`).** This is the part the one AI call would write, here written by hand: means, subjects, what else they keep, what's in daily use, what's heavy enough to hold books, how they keep things.
- **13 trinket recipes (`lab/brief/trinkets.js`):** candlestick, jug, tankard, bottle, bowl, box, horseshoe, pot of nails, globe, lantern clock, porcelain, shell, letters.
- **Habit rules, the same for everyone:**
  - books stay together in one run, tucked to the left;
  - few books go on the shelf nearest the eye;
  - a run that stops short is held by something heavy, or by books laid flat;
  - daily things go at hand height;
  - a great house keeps its top shelf for display.

| Owner | Books | Things |
|---|---|---|
| The widow | 4, at eye level | candlesticks, jugs, a bottle, a box |
| The smith | 7, the last laid flat | horseshoes, pots of nails, tankards, bottles |
| Sir Fancy-Pants | 159 | porcelain and a shell on the display shelf |

No fit faults. All three shelves build in 0.17 s.

**Fixed on the way:**
- The shelves rendered black, because merging dropped their wood's per-board tones.
- The gentleman's curiosities had nowhere to go until display became a rule.

 filled by context (2026-10-05)

You noticed every white vellum book said "Placita". You also asked whether a shelf could be filled to suit its setting: how full, which subjects, which bindings, wealthy against squalor.

**Wall-clock: 4.5 min, from 14:38:16 to 14:42:39**, including two renders.

**Titles are live text:**
- 59 period titles (Coke's *Reports*, Camden's *Britannia*, Year Books, Hooker, almanacs, chapbooks …) are drawn once per look into a title atlas, in three styles:
  - gilt capitals on a lettering-piece, with volume numbers for sets;
  - ink on a pasted paper label;
  - ink written down a vellum spine.
- The shader lays each book's title onto its spine. A book's title comes from its seed and the context's subjects.

**Context is a fill profile from the brief:** the owner's means (`great`, `gentry`, `middling`, `poor`) plus the room's purpose (a muniment room leans to law and estate papers). It sets:
- fullness;
- order (by size, or mixed);
- the share of each binding: gilt calf, plain sheep, vellum, paper pamphlets;
- multi-volume sets kept together;
- heaps lying flat;
- subjects;
- wear.

It's only probabilities fed to the same recipe, so it costs nothing extra at runtime.

| Same wall, same seed | Books | Build | Geometry |
|---|---|---|---|
| `great` | 600: full, ordered by size, mostly gilt calf, sets such as *Camden Britannia* I–IV and *Year Books* I–IV | 0.16 s | 100 KB |
| `poor` | 273: sparse, mixed, pamphlets in wrappers, plain sheep, heaps lying flat, darker with wear | 0.16 s | 60 KB |

No fit faults in either.

**Left for later:** a lone thin pamphlet can stand upright in a gap. It should lean or lie flat. That's a rule for unsupported thin books.

 (2026-10-05)

You asked for sub-components to be objects of their own. The book is now the catalogue's first recipe (`lab/brief/book.js`):
- A book is a **size class plus a seed**; height, thickness, binding, spine design and tone all follow from them.
- Takeable is decided from size (`takeable()`).
- Shelves get packed by `fillRow()`, which reports any book through a shelf or an end.
- `buildBook()` builds one book alone, as the thing a player picks up.
- Many books are drawn as one shape repeated, each copy with its own size, place, spine and tone.

**Wall-clock: about 5 min, 14:08 to 14:13**, including both renders.

| | Before (books inline) | After (book recipe, instanced) |
|---|---|---|
| Bookpress, 152–154 books | books ≈ 240 KB of geometry, merged | books ≈ 15 KB (one shape + 92 bytes a copy) |
| Bookpress whole | 7.07 MB geometry, 0.13–0.18 s | 6.84 MB (the carving is now nearly all of it), 0.19 s |
| **Library wall, 4.2 m, 4 bays, 581 books** | – | **0.12 s, 3 meshes, 80 KB geometry, 7k triangles, no faults** |
| Book recipe | – | 10.5 KB, 4.2 KB compressed |

**What it shows:**
- A wall of 581 books costs less than the one bookpress, whose carving dominates.
- The spine designs (256 per look) are made once per look, so variety costs nothing per book.
- The next cost to cut is carving. A carved band could take the same treatment: one leaf drawn many times, or a relief done in the shader instead of 40,000 triangles.

 (2026-10-05)

You asked how long one period object takes from conception to completion, quality checks included.

**What it is:** a glazed bookpress after Samuel Pepys's of 1666, the first English glazed bookcases ([Sympson the Joiner](https://en.wikipedia.org/wiki/Sympson_the_Joiner); [Magdalene College](https://www.magd.cam.ac.uk/alumni/supporting-magdalene/making-gift/pepys-restoration-project/preserve-press)):
- oak, with a low, deeper glazed base for folios;
- paired upper doors of 21 small panes each between heavy glazing bars;
- carved leaf bands on the cornice and the base;
- brass escutcheons and knobs;
- 152 books shelved by size, as Pepys did, folios at the bottom. They're calf bound, with now and then a vellum or red morocco binding, each with five raised bands, gilt fillets and fleurons, and a red or black lettering-piece. The last book in each row leans into the gap.

**Wall-clock: 9 min 01 s, from 10:52:36 to 11:01:37.** That covers research to a checked object. The receipt and commit took about 1.5 min more.

| Stage | Time | What |
|---|---|---|
| Research | 1 min | Pepys's presses: form, glazing, carving, shelving by size |
| Design and piece | 1.2 min | `lab/brief/bookpress.js`: carcass, mouldings, carving, shelves sized to the books, books packed by row, the leaning book solved so its head rests on the case's end, doors, spine atlas |
| Stage | 0.7 min | `lab/brief/object.html`: any object against a limewashed wall on flags, with aimable cameras. One-off; every later object reuses it |
| Quality, 3 rounds | 6 min | **Round 1:** the spines were blank, because the kit's wood variation shifts texture coordinates and that scrambled the spine atlas; the carving read as a zigzag; the glass was milky. **Round 2:** spines right; the carving read as eggs. **Round 3:** pointed leaves with a midrib, plus a fit check built into the object: every book clear of the shelf above, inside the case's ends, not sunk in its shelf. No faults. |

**Runtime:**
- built in 0.13–0.18 s after the kit;
- 6 meshes, merged per material;
- 54k triangles, about 40k of them the carving.

**What the next object reuses:**
- the stage;
- the merge-per-material pattern;
- the rule that atlas-mapped parts (spines, labels) never take the wood variation;
- the built-in fit check.

**What would cut the time:**
- The fit check found nothing this time. The 6 min of checking was mostly render-and-look rounds, at about 40 s per render here.
- With a GPU, or a lighter render for checking, each round drops to seconds. That is the largest lever left for objects of this size.

---

## R45, fix round: what your eye caught (2026-10-05)

You found three faults:
1. rolls and bundles pushed into one another;
2. presses overlapping at a corner;
3. the floor's stone chopped into small random rectangles.

**Wall-clock: about 7 min, from 08:36 to 08:43**, with no research or design.

| Fault | Cause | Fix | Now guarded by |
|---|---|---|---|
| Rolls and bundles intersecting | Placed at random x in each pigeonhole, with a second tier floating at a fixed height | Packed: rolls of one size side by side, the second tier resting in the grooves, the bundle in the width left | Construction; nothing random is left to collide |
| A press running behind its neighbour in the corner | The north press ran into the corner; the east press stood in front of its last column, and those drawers couldn't open | Presses stop one press-depth short of every corner, leaving a square of open floor | A new check, run by `tools/brief-check.mjs` and the test: nothing stands where another piece needs room to be used (drawers pulled, a lid raised). It fails on the old build. |
| Floor chopped into small rectangles | The shared flag texture's joints didn't wrap at the 2 m tile edge, leaving sliver stones; the stones were also small | The strongroom gets its own flags: 0.6–1.1 m slabs in courses running across the room, joints offset, a 4 m tile, lime-pointed joints. The shared texture's sliver is fixed too, which helps the manor's halls. | By eye |
| Wall stone (I also redid it) | 33 cm near-square blocks, randomly cut | Level ashlar courses 0.4 m high, stones 0.75–1.3 m, every joint broken over the one below, joints filled by the wash | By eye |

**What it costs while you walk:**
- Build went from 0.43 s to 1.38 s, because the two new 1024² stone textures are generated at build time.
- They belong to the look, not the room: a house built in this look makes them once.
- Moving them into the kit, with a cache, is the next step for a multi-room build.

**What this round teaches the pipeline:**
- Every new piece that holds other pieces (presses holding rolls, walls meeting at corners) needs a packing rule, not scatter, and a check that items don't intrude on each other's clearance.
- Repeating textures need joints that wrap at the tile edge, or the seam shows as a sliver.

---

## R45: the muniment room from the period brief (2026-10-05)

A fireproof strongroom of c. 1660, built from a written brief plus the manor's plan. No painting was used.

**Wall-clock: about 19 min, from 07:02 to 07:21.**

| Stage | Time | What |
|---|---|---|
| Research | 2 min | Steane 2010 on muniment rooms (vaults, iron doors, barred and shuttered windows, no heating, nests of labelled drawers, multi-lock chests); Hardwick Hall's 1603 evidence room |
| Design | 1.5 min | `lab/brief/manor-1660.json`: the place, the room's function, 8 pins with sources |
| Assembly, compiler | 2.5 min | `brief.js` (pins → schematic + report); the plan compiler moved out of `house.js` into `lab/house/plan-compile.js` so Node can test it; `tools/brief-check.mjs` |
| Pieces | 3.5 min | `strongroom.js` (limewash, vault, stone walls, iron-bound door, barred window, press, chest, label atlas) and the page |
| Verify | 9.5 min | 3 render rounds. Round 1 came out ochre because it borrowed the panelled room's plaster, so I made a real limewash over faint courses, gave the door paler oak and visible ironwork, and made the fill neutral. Plus about 3 min of server and screenshot friction. Then tests, and the drawer/key and collision check |

**New pieces (7):**
1. a limewash-over-coursed-stone texture;
2. a segmental stone vault;
3. a stone wall that springs the vault, with an impost course and a plinth;
4. an oak door bound in iron (strap hinges, nails, stock lock, ring);
5. a small window, splayed, with an iron grid and inside shutters;
6. a press of labelled drawers with pigeonholes of rolled deeds;
7. an iron-bound chest under two locks, with a label atlas for 320 drawers.

**Reused from the kit:**
- the grown oak (every member its own cut) and the flags;
- dressed stone, leaded quarries and the outside view;
- the joined table with its drawer, and the key;
- the harness and world document (drawer and key rules unchanged);
- the light bake (`gi.js`), the touch controls and fullscreen;
- the manor's plan and its compiler.

**New lines: about 1,000.**
- `strongroom.js` 364, `index.html` 294, `brief.js` 172;
- the brief 48, the test 50, the checker 35;
- `plan-compile.js` 53, moved rather than new.

**Runtime (SwiftShader, 960×600):**

| | |
|---|---|
| Fetch plan and brief | 8 ms |
| Compile the brief | 10–18 ms |
| Kit (oak, flags, textures) | 2.9 s. Shared: a house pays this once. |
| Build the room | 0.43 s |
| Light bake (75 probes, 2 bounces) | 32.6 s here; estimated 1–3 s on a GPU. Phones skip it. |
| Walkable | 5.1 s without the bake, 36 s with it here |
| Scene | 82 meshes (merged per material), 109k triangles, 1,996 parts, 5 presses, 320 drawers |

**What the brief did** (the room's report, key `B` in the page):
- adjusted:
  - the plan's fireplace was taken out;
  - the windows went from 1.4×1.5 m to 0.7×0.8 m, with the sill at 1.2 m, barred and shuttered.
- honoured: stone and vault, iron doors, the table between the windows, the chest, the presses.
- conflict: the plan gives the room two doors (to the solar and to the long gallery), so it's a room you walk through. The plan decides where people can walk, so both doors are built. The report says to close the gallery door in the plan.

**Efficiency notes for next time:**
- The 3 min of server and screenshot friction is fixed overhead; a standing render script removes it.
- The ochre round happened because a material was reused outside its period; a look package would have caught it.
- Most of the time went to pieces and to verifying them. The compiler and brief took under 5 min. Next rooms that reuse these pieces (presses, iron doors, vaults) should cost mostly design time.

## Strongroom drawers that pull, and labels after a blind review (2026-10-05)

**Asked:** every press drawer opens and closes, as a feature of the press, like the table's drawer. Also: why so many names on so many drawers ("is this a post office?"), and would the review pass catch the disorder?

**The answer, tested:** a fresh reviewer was given the old layout cold, with every label written out and no hint. Its first two faults were exactly these: the scrambled order, and 63 manors cycled across 224 drawers with "ii, iii, iv". It also found:
- other families' real seats among the manors (Chatsworth, Haddon);
- no drawers for the family's own papers;
- deeds rolled where they would have been folded flat;
- the table set between the windows rather than in one.

The strongroom predates the review rule, so it had never had this pass. **Lesson:** a review layout must write out everything the eye reads, including the words on labels. If the layout had said "224 labelled drawers", nothing would have been caught.

**Built:**
- **Drawers.** One instanced bank for the whole room: box, bottom, deeds, label, plate and ring are 6 draw calls for all 224 drawers. Each drawer slides out 0.25 m, with folded deeds inside, and is aimed by instance. The hint names the drawer ("open the drawer · Ashover 7"). Which drawers are pulled is an overlay kept per viewer: generated dressing, not world entities (plan §3). The seeded ajar drawers stay ajar until you touch them.
- **Labels** (`brief.js` `labelDrawers`), driven by the brief's `holdings`. The family's papers come first: Crown Grants, Inquisitions, Wardship, Fines & Recoveries, Settlements, Marriage Articles, Wills, Sequestration, Composition, Pardon 1660. Then each manor is one sorted, numbered run, sized by weight and never split across presses. Each press has a letter, and spare drawers are left blank (32 of them).
- **Pigeonholes:** tied bundles of folded deeds in about 70%, court rolls rolled in about 30%.
- **The table** stands in the window nearest the wall's middle; the chest sits beside it.
- **GI** now reads instance positions, which also fixes instanced books.

**Time:**

| Stage | Time |
|---|---|
| Read and plan | 8 min |
| Blind review round 1 | 1 min (agent 47 s) |
| Drawer bank and page | 20 min |
| Labelling recipe and pigeonholes | 15 min |
| Verify (screens, checks) | 12 min |
| **Wall clock** | **about 64 min** |

**Code:** about 200 lines new and 70 replaced; `drawerInside` was factored out of the table to be shared.

**Runtime (SwiftShader, 960×600):**
- build 1.33 s, up from 0.43 s; the label atlas now measures text to fit;
- 82 meshes;
- walkable 6.3 s, with no bake;
- the brief-room checks (6) pass.

**Round 2** (a fresh reviewer, 52 s): *mostly right; labels not yet.* The two-round cap was then reached, so its fixes were applied without a third round:
- **Labels:** each place's drawers by kind of evidence (Feoffments, Leases, Rentals & Surveys), overflow numbered i, ii.
- **Spelling:** places spelled as in 1660 (Asshover, Tibshelfe, Southnormanton).
- **New:** Accompts; the vellum calendar of the evidences on the table.
- **Moved:**
  - Letters Patent, the Pardon, Uses & Entails and the Wills went into the chest;
  - Crich went out (its lords were well known);
  - three manors went out of county (Skegbye, Elaston, Swepston).
- **Order:** the capital manor first, then the manors in the order they came to the family.
- **Runs:** each runs down its own columns, never across a press; spares are blank at the column feet.
- **Presses:** sized to the holdings plus 12% spare. One press of 15×8 now holds all of it, and the E and W walls are left bare.
- **Not taken:** the secretary hand. There's no font for it, so the labels stay italic.

Added time: about 25 min. The room's checks pass. Build 1.5 s; 73 meshes; 120 drawers.

**What a working drawer costs** (measured 2026-10-05, SwiftShader, 3 runs):
- **Build, measured A/B:** the same table built with a working drawer and with a fixed drawer front (no sides, back, bottom or cavity), 40 builds × 4 rounds, warm. Working: 4.3 ms, 32 meshes. Fixed: 3.95 ms, 27 meshes. **Difference: about 0.4 ms.** An earlier estimate of 2 ms, made from the share of pieces, was wrong. The table's first build in the room takes 14–23 ms because of one-time warm-up. All 120 press drawers, working, take 3–5 ms together.
- **Play:** moving one drawer costs 3.3 µs a frame, and only while it moves.
- **Authoring:** the press drawer bank took about 20 min, written once. That is the real cost.

## R48 steps 1–3: the production system's core, things that work, the strongroom from kinds (2026-10-05)

**Built** (`src/make/`):
- **Identity:** an id and a seed from the birth address, by integer hashing only.
- **The catalogue:** parts as code, kinds as data. A kind is checked against its schema and pinned by a content hash. Settings are drawn from the seed to the millimetre, one stream per setting.
- **Build:** the body merged per material; each mover a group about its pivot; banks of instanced movers; slots; animations.
- **Looks:** material roles mapped to materials.
- **Works:** one interaction layer for every thing.
  - Mechanisms: slide, hinge, lever (springs back), switch, process.
  - Processes are worked out from elapsed time and pause when switched off.
  - A need can be another affordance's state, or something the world answers ("@holding: key").
  - State is an overlay of what someone changed.

**The strongroom is now 8 things from 6 kinds**, all working:
- 120 press drawers;
- the table drawer, still owned by the harness, with the key in its slot;
- the chest: its padlocks need the desk's key, the lid needs the padlocks open, and inside are tied bundles and two letters patent with their seals;
- two doors, which open onto the holodeck grid (unestablished space);
- the shutters on both windows. Closing them dims that window's daylight.
- a tallow candle that lights, flickers and burns down over about 4 hours.

The hand-wired table drawer and press drawers are gone from the room.

**Found by eye:** the open chest lid drove its hasps 2 cm into the wall. Fixed by standing the chest 7 cm off the wall and opening the lid to 95°. This became proposed check 3 (`design/production/checks-proposed.md`).

**Time:**

| Stage | Time |
|---|---|
| Plan the steps | 10 min |
| Core and works | 35 min |
| Parts and kinds (ported from strongroom.js and procedural.js) | 40 min |
| Room and page | 25 min |
| Verify | 25 min |
| **Wall clock** | **about 2 h 15 min** |

**Code:** `src/make/` is about 700 lines; about 330 lines left `strongroom.js` and `index.html`.

**Runtime (SwiftShader):**
- 8 things built from kinds in 98 ms;
- the room build is 1.46 s, as before (the label atlas and the kit dominate);
- 10/10 room tests pass; brief-check all holds.

## R48 step 4, plus gates, variables and rules (2026-10-05)

**Step 4: books and shelves from kinds.**
- `book.js` and `bookpress.js` moved into `src/make/parts/` (`books.js`, `bookcases.js`).
- The Pepys press is rebuilt as a part using material roles, and its four glazed doors now open.
- `trinkets.js` became 14 pure-data kinds over six generic shape parts (lathe, cylinder, box, torus, sphere, cone) plus a declared mover. The obvious ones work:
  - the tankard's lid and the box's lid lift;
  - the globe turns;
  - a candle stub lights and burns down.
- `owners.js` became influences (the widow, the smith and Sir Fancy-Pants as possession influences; room purposes as space influences), blended by `influence.js`. The shelf habit reads the blend, not a hard-coded owner. Things on shelves are built from their own kinds as children, so each one works.
- New: `?o=kinds`, a gallery of every kind; `?o=puzzle`, the gates-and-rules stage.

**Gates, variables and rules** (Kabe, mid-step: "a locked door shouldn't open until I have its key"; "Light 3 of these candles!").
- **Gates:** an action, or taking a thing, may require another affordance's state, an engine variable, or something in the inventory (a kind, a family, or an id).
- **Locks** are opened on the way when you hold the key.
- **Actions set variables.**
- **Rules** (data, from the place or story):
  - when: a count of things by kind and area in a state, a variable, a thing's state, something held, all-of or any-of;
  - then: set variables and/or put things' affordances in states with their motion;
  - they fire once unless told otherwise, and they chain.
- **Taking** puts things in the inventory (key G, or shift-click).

**Scripted run on `?o=puzzle`, all as asked:**
- door A refuses, then the key is taken, then "the key turns in the lock" and it opens;
- door B refuses;
- a lit candle can't be taken ("not while it burns");
- after 2 candles, door B is still locked and closed;
- the 3rd candle fires the rule: `candles_lit` is set, door B unlocks and opens, and the line is said.

**In the strongroom:** the gallery door is locked and its key is not there. That keeps the brief's one way in during play, while the plan still has two doors.

**Time:**

| Stage | Time |
|---|---|
| Step 4 | about 75 min |
| Gates and rules | about 35 min |
| Verify | 20 min |

**Runtime (SwiftShader):**

| Object | Build | Detail |
|---|---|---|
| Puzzle stage | 36 ms | |
| Pepys press | 252 ms | 163 books |
| Library wall | 182 ms | 593 books |
| The three keepers' shelves | 172 ms | |
| All 15 small kinds | 18 ms | |

The room's tests pass, 10/10.

**Known:** the gentleman's section still spills into other subjects when its two subjects run dry. This was the reviewer's "partly" from round 2; the behaviour is unchanged.

## R48 step 5: the world document (2026-10-05)

**Built** (`src/make/world.js`, `layout.js`):
- **The world document,** in pattern-buffer's shape: entities, and assertions of the form [subject, attribute, value, provenance, as-of]. A read takes the latest.
- **Committing:** a generated thing becomes an entity only when it's changed, taken, or named.
- **Relations** (in, on, held_by, under) are assertions; moving a thing clears its old relation.
- **Rooms are sealed by their inputs** when first seen.
- **The works overlay is a fold of the world:** each change is written back as an assertion about the thing itself.
- **The layout hash:** every built thing and every instance, positions rounded to 0.1 mm and turns to 0.1 mrad, plus a raw hash over the unrounded floats.
- **Story heroes:** a named book stands first in its row, and the rest of the row repacks.
- **The strongroom** now keeps its world in this document. The room is sealed on first sight with its compiled brief. The saved world starts afresh only when the kinds change, which means a new release rather than a new story.

**Checked in the browser:**
- **Locality:** case B was identical; in case A only the quarto row changed (18 of 154 placements).
- **Sealed when seen:** a room seen as the gentleman's stayed his after the story made the widow the owner; a new room took the widow. The world document was 2.3 KB.
- **Hashes:** Chromium and Firefox gave identical layout and raw hashes. WebKit wasn't run (it needs `libwoff1`).
- **The strongroom across a reload:** the drawer and shutter states held, 3 entities were committed, and the document was 10 KB, of which about 9.5 KB is the sealed brief.

**Time:**

| Stage | Time |
|---|---|
| Build | about 40 min |
| Checks | 15 min |
| The single landing page and republish (asked for mid-step) | 15 min |

## R48 steps 6 and 7: light by state; play never waits (2026-10-05)

**Light by state** (`lab/painted/gi.js` `bakeGroups` and `setWeights`):
- The bounce light is baked once per group: the sun, each window's sky, each candle's flame. Every other group stays dark during each bake.
- The grid shown is their sum, weighted by state:
  - each window by how far its shutters stand open;
  - the sun by the windows' mean openness;
  - each candle by whether it's lit.
- A state change re-mixes the grid with no new bake.
- I found and fixed one bug: re-setting the lights had switched the flat fills back on while the bake was in use.

**Measured brightness in the strongroom** (out of 255): daylight 37; all shutters closed 0.4; closed with the candle lit 19.

**Bake cost:** 81 s for 4 groups in SwiftShader, against 33 s for the single bake before. I estimate a few seconds on a GPU, but that is unmeasured; the phone bench (step 8) will measure it. Phones skip the bake.

**Play never waits:**
- A kind may name a part not written yet if it gives its size. It then builds as holodeck grid at that size, can be taken, and is rebuilt in place, at the same address, when the part is defined.
- Demo: Alice's DRINK ME bottle (`?o=arrival`). It starts as grid; 3 s later its paper-tag part is defined and the bottle turns real.

**Time:**

| Stage | Time |
|---|---|
| Light by state | about 35 min |
| Play never waits | about 20 min |
| Verify | 20 min |

## R48 step 8: the bench (2026-10-05)

`lab/bench/` rebuilds 7 cases with the production system:
- the strongroom;
- the three keepers' shelves;
- the Pepys press;
- a library wall;
- every small kind.

For each case it shows the layout hash, a ✓ against `reference.json`, the raw-float hash, the build time, the fps and the 1% low, plus the device's GPU and browser. There's a button to copy the results. `tools/bench-reference.mjs` remakes the reference headless.

**Measured:**

| Engine | Result |
|---|---|
| Chromium (reference) | – |
| Firefox | all 7 layouts match the reference |
| WebKit | not run: needs `libwoff1` |
| The phone | Kabe's to run |

Build times in Firefox on software rendering:

| Case | Build |
|---|---|
| The strongroom | 617 ms |
| The widow's shelves | 13 ms |
| The smith's shelves | 14 ms |
| The gentleman's case | 52 ms |
| The bookpress | 112 ms |
| The library wall | 121 ms |
| All the kinds | 14 ms |

**Time:** about 25 min.

## Frame rate on a real GPU, and the cause of the slowdown (2026-10-05)

Headless Chromium can drive this machine's AMD Radeon RX 460, through ANGLE on Vulkan, with WebGPU too on https. Every frame-rate number before this one was SwiftShader on the CPU.

**The strongroom at 1280×720, 2× pixel density:**

| Setting | fps | p99 frame |
|---|---|---|
| As built | 4 | 309 ms |
| GTAO off | 49 | 62 ms |
| + MSAA off | 56 | 36 ms |
| + shadows off | 63 | 33 ms |
| + area lights off | 63 | 33 ms |
| + bounce bake off | 84 | 24 ms |
| As built, 1× density | 64 | 47 ms |

GTAO (16 samples at double resolution) was over 90% of the frame. It's now off unless `?ao=1`, and laptop density is capped at 1.5. Result: **85 fps** on the laptop (p99 23 ms); the phone-shaped touch page runs at **655 fps** on this GPU.

New switches for the bench: `?dpr=`, `?ao=`, `?msaa=0`, `?shadows=0`, `?area=0`, `?gi=`.

## Scale test: a forest (2026-10-05)

`lab/scale/forest.html` runs on three.js r186 with `WebGPURenderer` and falls back to WebGL 2.
- **The scene:** a 1 km² hillside with 87,370 trees of three kinds, placed from a seed and built in about 0.4 s.
- **Far trees:** every tree is a lit impostor (two crossed cards rendered from its model), all in one static instanced draw per kind. The GPU folds away the impostors within 90 m (60 m on phones) through a TSL position node.
- **Near trees:** full models, rebuilt from a 16 m grid every 4 m you walk.
- **Shadows** from a 120 m sun box that follows you; fog beyond.

**Measured on the RX 460:**

| Setup | fps | p99 | draws | triangles |
|---|---|---|---|---|
| WebGPU, laptop | 140 | 8.7 ms | 11 | 2.8M |
| WebGL 2, laptop | 121 | 24.8 ms | 11 | 2.8M |
| WebGPU, phone shape | 405 | 3.2 ms | 11 | 1.6M |

Before the proportions were fixed and the crowns made finer, it ran at 187 / 143 / 659 fps.

**Reading:** the engine has ample room for scale when the scene is batched. The picture is crude: what limits it is how the trees are written, not the renderer.

**Time:** about 50 min.

## The fps lab, first ledger (2026-10-05)

**The setup:**
- **One scene, defined once:** `lab/fps/spec.json`, with 18 cases each changing one thing, and `layout.json`, the positions from a seed.
- **Built in:**
  - three.js r186, on WebGPU and WebGL 2 (`lab/fps/three.html`);
  - Godot 4.7.2 (`lab/fps/godot/`), exported for the web with the no-threads template from the command line.
- **Run** by `tools/fps-lab.mjs` in headless Chrome on the RX 460, at 1280×720, 1×, for 6 s after a 2 s warm-up.
- **Results** in `results.json`; the ledger is `lab/fps/index.html`.
- **Fairness** was checked by looking at each engine's picture side by side (`notes.json`).

**Findings:**
- **Instancing:** 10× in every engine.
- **Godot:** less overhead per object (1,000 meshes at 217 fps against 148 on WebGPU and 135 on WebGL 2) and cheaper shadows.
- **three.js:** faster on raw triangles (23M at 66 fps against 44) and on instancing (10,000 at 332 against 231).
- **Physics:** Rapier's step beats Godot's (3.1 against 4.7 ms for 500 boxes).
- **Not comparable:** Godot's web renderer drew no AO, no visible point lights and no clearcoat, and its bloom is uncalibrated; those cases are marked.
- **three.js AO** cost about 0.1 ms at 1×, 1280×720. The 4 fps strongroom earlier was AO at double density with 16 samples.
- **Download:** Godot's web engine is 39.5 MB of WebAssembly; three.js's WebGPU build is 0.8 MB.

**Time:** about 1 h 40 min, including the Godot download (1.4 GB, web templates kept) and the export.

**fps lab, round 2 (2026-10-06):** 16 new cases, all on the RX 460.

**three.js countermeasures:**
- **WebGPU render bundles:**

  | Case | Before | Bundled |
  |---|---|---|
  | 1,000 separate meshes | 148 fps | 1,337 fps |
  | 10,000 separate meshes | 12 fps | 247 fps |
  | Street of 5,000 meshes | 23 fps | 330 fps |

- **Shared material:** 148 to 401 fps.
- **Static sun shadow** (`light.shadow.autoUpdate`; the renderer-wide switch is ignored by `WebGPURenderer`): 86 to 136 fps.
- **Big casters only:** 86 to 106 fps.
- **Frozen matrices:** no effect.

**The busy street:**

| Version | three.js | Godot |
|---|---|---|
| Separate meshes | 23 fps | 35 fps |
| Instanced per type | 1,342 fps | 658 fps |
| Instanced per type, with shadows | 559 fps | 525 fps |

BatchedMesh in WebGPU still issues a draw per object, because WebGPU has no multi-draw.

**Distance (a telephoto at 4 km):** ordinary depth breaks the facade panels; logarithmic depth holds them at no measurable cost; reversed depth only partly holds; Godot holds.

**C#:** Godot 4's C# can't export to the web as of 4.7. hjoykim/THREE is a desktop-only C# port.

**Time:** about 1 h 15 min.

**fps lab, round 3 (2026-10-06):** 11 cases from the research.

| Case | Result |
|---|---|
| Candles: 64 point lights | 117 fps default; 147 clustered (WebGPU only); 116 dynamic (no faster per frame; its gain is no recompile when lights change) |
| SSAO at half resolution | about 0.5 ms |
| Resolution scaling, draw-bound scene | no gain |
| Pixel-heavy scene: full | 227 fps |
| Pixel-heavy scene: at 1× density | 721 fps |
| Pixel-heavy scene: half resolution plus FSR1 | 174 fps; the upscaling costs more than it saves on this GPU |

Also: three.js's core remapped to its minified build, 162 KB less to download.

**Time:** about 35 min.

## The strongroom on WebGPU (2026-10-06)

**Built:**
- `src/make/nodes.js`: `nodeify(scene)` turns every material into its node twin. Three GLSL hooks were rewritten in TSL:
  - wood's patina and soot, a `MeshStandardNodeMaterial` subclass overriding `setupDiffuseColor`;
  - the drawer labels' atlas cells;
  - the books' spines and titles.
- **Books** pack their per-instance cell, title and label into one interleaved buffer, and the page/spine flags into one vec2. WebGPU allows 8 vertex buffers; the books needed 9.
- `src/make/light.js`: bounce light by state through three r186's GPU `LightProbeGrid`, one grid per light group, intensity = state weight × scale. It replaces `gi.js`'s CPU bake.
- **The strongroom and the object viewer** run on `WebGPURenderer`, falling back to WebGL 2.
- **Post:** none by default; `?ao=1` gives SSAO at half resolution.

**Measured (RX 460):**
- **Walkable:** 6.6 s without the bake; 11.8 s with it.
- **The bake:** 6.3 s on the GPU for 4 groups.
- **Brightness at the reference view:** daylight 37.3 (37 before); shuttered 2.1; candlelit 19.5. Light by state is intact.
- **Errors:** none on either backend.

**Time:** about 1 h 20 min.

## Cursor cues, render on change, candles that don't recompile (2026-10-06)

- **Cursor cues** (Kabe: "not pop up text but simply change to a small icon for take and one for act"):
  - `works.cue(t)` gives take, act or locked; `lab/ui/cues.js` draws a hand, a pointing finger or a padlock.
  - Pointer-locked, the centre dot becomes the icon; with a free mouse, the cursor does.
  - The words go only to a visually hidden live label.
  - Checked: finger on the press drawers, padlock on the locked chest, the plain cursor on the vault.
- **Render on change:**

  | State | Frames drawn per second |
  |---|---|
  | Standing still | 0 |
  | Walking | 59 |
  | A lit candle | every frame while visible (its flame flickers) |

- **A light group switches its lights by intensity, not presence.** Lighting a candle used to recompile every material, dropping to 22 fps; it now costs one 23 ms frame.

**Time:** about 40 min.

## R47: anchor furniture, the furnishing habit, open hearths, tapestry (2026-10-06)

- **22 furniture kinds as data** (`src/make/kinds/furniture-1660.js`), each from the inventories. Every obvious working part works:
  - bed curtains fold back round the foot posts;
  - cupboard, press, cabinet and oven doors open, and lids lift;
  - the gateleg's gate swings out under its leaf. A new **release** gate stops it folding while the leaf rests on it, and raising the leaf swings the gate out first (auto);
  - the draw-table's leaves run out and rise level with the top;
  - the hogshead's tap turns;
  - the spit goes round while the jack is wound. This uses a new `spinner` part, which only runs while the spit is in sight.
- **The furnishing habit** (`src/make/furnish.js`):
  - **Where things stand:** pieces go back to a wall, at the middle of the longest clear run. They keep clear of door swings, the hearth and its fender, stairs, and (if taller than the sill) window light.
  - **Free tables** take half the room's length, with forms along their sides.
  - **Hearth and walls:** the spit goes in the fire's mouth, and portraits hang between windows.
  - **Tight rooms:** a piece gives up to 30% of its width to fit, and may then stand beside a window.
  - **Doorways:** every placement is refused if any doorway in the room could no longer reach the others (a flood fill at a body's width).
  - **Result:** all 23 furnished rooms get every anchor. The walker keeps a body's width from furniture.
- **Open hearths:** the kitchen and bakehouse get a wide square mouth, rubble jambs and an oak bressummer.
- **Tapestry rooms:** hung with verdure drawn in code, over every clear stretch of wall.

**Measured (headless, WebGL 2):**

| | Build | Things |
|---|---|---|
| Unfurnished | 4561 ms | 38 |
| Furnished | 4759 ms | 121 |

- **Cost of furnishing:** +198 ms for 83 pieces, about 2.4 ms each. Walkable time didn't change (11.1 s against 10.8 s).
- **The furniture bench** (`object.html?o=furniture&k=…`): each kind builds in 2–42 ms.

**Code:**
- **New:**
  - `furnish.js` (~130 lines);
  - `furniture-1660.js` (~190 lines of data);
  - hearth and tapestry code in `manor.js` and `procedural.js` (~60 lines).
- **Reused:** the shape parts, `joined_table`, `boarded_box`, `buildWall`, and the reach rules.

**Time:**

| Stage | Time |
|---|---|
| Kinds, with two render-and-fix rounds | about 1 h 10 min |
| Habit | about 45 min |
| Hearth and tapestry | about 30 min |

## R47: the blind review, two rounds (2026-10-06)

- **Shots:** `tests/.doorways.mjs` stands inside a doorway of every room type (23 types), with that door open and hidden, and looks at the room's middle.
  - **Which doorway:** one whose look-in no furniture blocks, then the one that sees the most of the room's pieces.
  - **Time:** 23 shots in about 70 s, headless on WebGPU.
- **Round 1:** a fresh reviewer, given no list of types, read 13 of 23 with confidence 3 or more. See `design/house/r47-blind-review.md`.
- **Round 2 response:**
  - 8 new kinds: cradle, daybed, carpeted table, spinning wheel, pikes, flitches, pewter dresser, peg rail;
  - portraits painted in code; a Turkey carpet and rush matting drawn in code;
  - the habit sets the naming piece facing the doorway, and hangs pieces high in tall rooms.
- **Bundles investigated:** kept on request only. The measurement is in `design/perf/plan.md`.

**Time:**

| Stage | Time |
|---|---|
| Round 1, with the shot fixes | about 1 h |
| Round 2 kinds and habit changes | about 50 min |

## R47: stairs as they were built, and a check that the place is sound (2026-10-06)

**What Kabe found walking the manor on his phone:**
- a stair across the hall door;
- stairs turning with no landing, and an upper floor you'd climb over the edge to reach;
- only the first room's doors would open;
- a wall surface cut wrongly across the porch door;
- a sheet of geometry over a hall window.

**The root of all of it:** the plan was checked as a graph of rooms, never as a body walking it, or a wall holding its openings.

**Fixed:**
- **Stairs** (`src/make/plans/stairs.js`):
  - **Form:** each storey is a dog-leg (flight, half-landing, flight back), with the storeys stacked on one footprint.
  - **Great stair:** broad and shallow round an open well, 0.165 m risers and 0.28 m goings, which is what a Coleshill-period stair is like.
  - **Back stair:** steep and narrow round a newel.
  - **Placement:** the footprint goes where no door on any floor it touches opens onto a flight, a landing or a well. The stair halls' doors now stand at the foot, where you arrive.
  - **Built** as treads and risers on a sloping soffit, open beneath, with newel posts under the landing. A balustrade (turned balusters, moulded rail, newels) runs up each flight's open side and round each floor's well.
- **Walking** (`src/make/walk.js`), one set of rules for the player and the checks:
  - you step only onto a surface within a step of your feet;
  - you never walk into a well;
  - a flight overhead stops you only where it leaves less than a head's room.
- **Doors you can use:** what you can aim at was cached on the first frame, when only the hall's things were visible. It now follows what is in view.
- **Windows:**
  - they keep clear of doorways; a window had been put in the porch doorway;
  - they keep 0.75 m clear of chimneys; the old test never fired on the outer walls;
  - hearths keep 0.8 m from doors.
- **Doors own their reveal:** the oak lining through the wall is drawn whenever the door is seen, so no sky shows round a shut door.
- **The check:** `src/make/sound.js` is proposed as check 11, waiting for Kabe's vetting. It found 28 faults in the morning's plan, and the plan now passes.

**Measured:**

| | Time |
|---|---|
| Plan soundness, headless | 0.23 s |
| Walking the house physically on a 0.2 m grid | under a second |

**Time:** about 2 h.

## A way through every room, escape rooms and hoards (2026-10-06)

- **`src/make/passage.js`:** after anything that stops a body is placed, a body the player's size still reaches every exit, stair and usable piece of the room.
  - It runs about 1.3 ms a test, at generation only, with nothing rendered.
  - Rooms may declare separate walkways (regions), and an obstacle may carry a gate (a barricade a prybar clears).
- **`src/make/reach.js`:** walks room parts, so a barricade works like a lock and a tool left on the far side is a softlock.
- **The furnishing habit:** uses it for every piece, keeping earlier pieces reachable.
- **Measured** (`tools/escape-demo.mjs`):
  - escape room with the prybar inside: escapable;
  - escape room with the prybar outside: softlock named;
  - hoard: 60 piles over 52% of a 7.6 × 9.3 m floor, still walkable;
  - the whole manor's soundness: 0.29 s.

**Time:** about 45 min.

## Things that open onto an inside; a panel per kind (2026-10-06)

**Fixed:**
- **Opening onto solid:** 9 kinds did. They are now built on a new `carcass` part (a hollow case open at the top or front), or turned hollow, each with its contents.
- **Doors:** shut doors no longer show a slot under the leaf, and each doorway has its own oak threshold.

**New tools:**
- `__opensOnto()` takes 0.5 s for every kind together. It is proposed as check 12.
- `tools/kind-panels.mjs` draws a kind from five sides, at rest and moved, in about 6 s a kind.

**Time:** about 50 min.

## The cradle; the light follows what you see; fires (2026-10-06)

- **Cradle:** it is now hollow, with bedding, and its rockers are broad and stand past its sides. The panel had shown it as a block.
- **Light** (Kabe: a room seen through a doorway isn't lit properly until you walk in):
  - **Window light:** a fixed pool of 8 window lights, up from 6. The room you stand in takes up to 4. Each room seen through an open doorway then takes a window in turn, nearest first, so every visible room shows its own daylight.
  - **Fires:** a pool of 3 flickering fire lights goes to the lit hearths of the rooms you can see. Each lit hearth has logs, embers and flames, drawn only while its room is.
  - **No recompiles:** the light count never changes.
- **Measured** (RX 460, WebGPU, 900 × 560, frame time against the previous version):

  | View | Before | Now |
  |---|---|---|
  | The hall | 2.97 ms | 2.50 ms |
  | Stair hall into the parlours | 3.34 ms | 3.56 ms |
  | The kitchen | 1.89 ms | 1.72 ms |

  The differences are within noise. Baked fill per room (a pool of probe grids, each room's bake copied in) stays in reserve: it isn't needed at this cost.

**Time:** about 1 h.

## Sound geometry at creation: checks 13–15 (2026-10-06)

- **Prior art first:** two helpers, about 4 min, found three-mesh-bvh (an inside test in 0.3–1.5 ms where ours took 25 ms) and Manifold (exact volumes; an inside-out mesh reads as negative volume). Relations, from ShapeAssembly, Infinigen and Articraft, come next.
- **The rules,** for all 55 kinds at rest and moved:

  | Check | Time |
  |---|---|
  | 13 and 14, the depth grid and the winding number | about 8.3 s |
  | 15, the mesh rules by Manifold | 1.2 s |

  Manifold is about 0.5 MB of wasm, loaded only when a kind is checked.
- **Found and fixed:** 196 findings to none. The fixes were at the source: turned shapes, rings, domes and mouldings are now sound by construction. The rest were fixed in the kinds; see check 15 in `design/production/checks-proposed.md`.
- **Code:** `src/make/mesh-rules.js` (new, about 150 lines); `audit.js` (new); changes to the shapes, joinery, ironwork and procedural kit.
- **Time:** about 3 h with the door investigation and the consultation.
- **Planted faults** (`tools/plant-faults.mjs`, 126 plantings in 23 s): each check's catch rate is now measured instead of assumed, and the misses showed where the rules were missing. Two cheap rules followed: *below* (into the floor or wall) and *through* (out of another part on both sides). With them, sunk parts are caught 19% → 52% of the time and buried ones 67% → 90%. They also found the lantern clock half inside its wall, the cloaks 4 cm into theirs, and the spit through its andirons.

## Rooms sound by construction, and placement by rules (R54 steps 5–6, 2026-10-06)

- **The design came from you.** Kabe's grid, wall and placement ideas were checked by two consultations (c7dd918, then cf4d451 on the plan) and two prior-art passes:
  - grid and wall systems: the Sims 4, Skyrim's modular kits, Sweet Home 3D, IFC, UnrealEd;
  - 2D boolean libraries: clipper2-ts chosen; Boost licence, integer arithmetic.
- **Placement prior art:** Infinigen Indoors, Merrell 2011, Make it Home, Holodeck, ProcTHOR. We kept their rule vocabulary and their scoring, but not their searches.
- **Time and new code:**

  | Stage | Clock time (commit times) | New code |
  |---|---|---|
  | Design and consultations | about 1 h | — |
  | 5a–5d: the carve, plan checks, claim grid, planted plan faults | 16:37–17:15 | `carve.js` 133 lines, `plan-checks.js` 76, `claims.js` 87, `house-spec.js` 48 |
  | 5e: walls by edge, the octagon | to 18:34 | `walls.js` 39 lines, `plans/banqueting.js` 36 |
  | 6: placement by rules | to 19:04 | `place.js` 247 lines, which replaces `furnish.js` (139 lines) |
  | Your open faults, fixed at their source | to 19:35 | rails, risen rooms, outside panes, the japanned cabinet |

  The Clipper2 library itself is vendored as is, 125 KB.
- **Running cost, at generation, never in play:**

  | Step | Cost | Note |
  |---|---|---|
  | The carve | about 35 ms in Node | 38 height bands, about 14,600 triangles |
  | The plan checks | about 45 ms | |
  | Placing everything in 34 rooms | about 0.6 s | plus 0.5 s measuring kinds, which was already being paid |
  | The claim grid's walking lookups | an array read each | |
- **Results:**
  - Seal: no leak and no gap in any of the 34 rooms. Before, four rooms leaked.
  - Planted plan faults: 10 of 10 caught.
  - Walking acceptance: everything passes.
  - 152 pieces placed: 100 anchors and 52 ordinary things.
  - The story's key goes in its desk's drawer, and the desk is placed for it.
  - All 55 kinds clean.

## R49: the hall of doors, from the book to a room you can play (2026-10-06)

- **What:** *Alice's Adventures in Wonderland*, from the hall in Chapter I to the opening of Chapter II, as a hall
  you play at `lab/manor/?plan=alice-hall`.
  - Take the golden key, find the little door behind the curtain, unlock it, look through it (too big).
  - The bottle comes to be. Drink it and you are ten inches high, with the key out of reach.
  - The cake makes you more than nine feet high, stooping under the roof.
  - The bottle comes back (the story's magic, since the literal reading strands you). Drink, and go through.
  - Everything the page says is Carroll's sentence. The garden is seen down the passage but not entered.
- **AI calls: two, both at authoring, none at build or play.**

  | Call | What | Time | Tokens (whole helper run) |
  |---|---|---|---|
  | Ingestion | the text to the scene document (`lab/alice/hall.json`: 2 rooms, 3 openings, 8 things, 21 actions, 3 events, 102 quotes) | 107 s | about 60 k |
  | Recipes | 7 kinds composed, 3 new parts, against the kind checks, with two review rounds | about 15 min | about 240 k |

  A read-only prior-art pass (86 s, about 60 k tokens) informed the design. It is not part of the pipeline.
- **Kinds tallied:**
  - **Existing (1):** `door/panelled`, for the hall's 9 doors (locked for good) and for the little door (0.25 × 0.381 m, golden key).
  - **Newly composed (7):** the glass three-legged table, the golden key, the low curtain, the DRINK ME bottle (its
    label a part of it), the glass box, the EAT ME cake, the hanging lamp.
  - **New parts (3):** `lettering` (a tag's text, and words marked in currants), `slot` (where a thing holds another),
    and `flame` (a glow without a candle). Only `lettering` is a shape no part could make. The other two filled gaps
    in the catalogue's plumbing.
- **Time, description to playable:**

  | Step | Cost | Where |
  |---|---|---|
  | Checking the scene document against the text | about 2 ms | `src/make/scene.js` |
  | Matching things to kinds, laying out the plan, compiling the story | 31–74 ms in the page | match, plan type, story |
  | The plan checks and the soundness rules, every body size | 0.8 s in Node, at generation | `tools/check-story.mjs` |
  | The softlock search: 15 states, 5 stranded in the literal reading, each rescued | 3 ms | `src/make/story.js` |
  | Building the hall | 127–156 ms | `buildManor` |
  | Walkable, on WebGPU on the desktop | 7.1–8.0 s | 5.6 s of it is the shared texture kit, the same as the manor's |

- **Clock time:** begun 23:15 and playable by about 23:50, with the ingestion, the prior-art pass and the recipes run
  in parallel.
- **New code:** 604 lines.
  - scene check 39, matcher 24, story 92, story in play 123, plan type 102, room types 11;
  - kinds 101 and parts 80, both written by the recipe helper;
  - the generation check 32.
- **Changed, for every place:**
  - The soundness rules walk with each of a place's bodies. A doorway is judged by a body that fits it.
  - The plan checks probe a low room within its height.
  - The claim grid's cell is set by the plan.
  - A doorway's inset scales with a little door.
  - A door can take its own height and its lock and key; a room can be lower than its storey.
  - The works layer can put down what you hold.
  - The manor still passes everything, and 10 of 10 planted plan faults are still caught.
- **Choices the text leaves open,** listed by the plan with why:
  - the hall is 12.6 × 4.2 × 2.6 m;
  - there are 9 doors and 6 lamps;
  - the little door is 25 cm wide;
  - the passage is 2.4 × 0.4 × 0.45 m;
  - the little door locks when it is shut;
  - Alice's usual height is 1.2 m.

## R46 (in progress): the manor's outside, its ground and hillside, textures off the main thread (2026-10-07)

- **Done**
  - **The house from outside** (`src/make/exterior.js`):
    - stone-slate roofs over the plan's ranges, meeting in valleys;
    - coped gables with ball finials;
    - 12 stacks;
    - glazing with mullions;
    - limestone ashlar on the carve's outer faces.
  - **The ground** (`terrain.js`, `terrain-mesh.js`):
    - deterministic world-coordinate noise (PCG, heights in mm);
    - the house on its terrace;
    - a graded drive;
    - quadtree tiles with skirts, in a render bundle on WebGPU.
  - **Walking out** through the porch and down the drive.
  - **The forecourt's railed wall**, piers and working gates.
  - **The hillside** (`fields.js`, `hillside.js`): closes with dry-stone walls and hawthorn hedges, field gates, hedgerow trees, ridge and furrow.
  - **The texture kit's textures drawn in workers**, cached by recipe.
- **Kabe's direction, 2026-10-07:** "isolated demos for the time being". Joining the manor to London waits.
- **AI at authoring:** a consultation (two views, $2.11); three research and prior-art passes; four builder helpers (the hillside, the textures, the street, checks 1–16). The network dropped every helper twice; each resumed.
- **Clock time:** begun 00:16, the outside through the forecourt by 00:37, then the hillside and the textures merged by 09:03 (with Kabe asleep between; the helpers ran about 1.5 h and 0.6 h).
- **New code:** about 1,590 lines.
  - noise 28;
  - terrain 81, tiles 78, fields 50;
  - exterior 129, forecourt 45;
  - outdoor parts 43, outdoor kinds 30;
  - hillside 531;
  - texture workers 577.
- **Costs**

  | Step | Cost | Note |
  |---|---|---|
  | Shell from the plan | 4.7 ms | data |
  | Shell build | 15–48 ms | |
  | A height sample | about 4 µs | |
  | A ground tile | 2.5 ms | |
  | A hillside tile | near 6–8 ms, far 0.6 ms | |
  | `blocked()` | about 0.1 µs | |
  | Hillside per frame | about 2.3 ms | RX 460 |

  - Outdoors at 49 fps against 51 indoors on the loaded desktop. Bundling the ground took it from 244 tile draws at 23 fps to 88 tiles.
  - Textures: the manor walkable in 7.6 s on a first visit against 16.8 s (WebGPU), 26 of 28 views byte-identical (the other 2 within the page's own noise). Alice's hall 4.1 s, cached 1.5 s.
- **What's left before the first frame (measured under load):**
  - about 0.9 s wiring;
  - 1 s of first tiles;
  - about 3 s of the first render's pipeline compiling.

  `compileAsync` ahead of it was worse (13 s). Fewer distinct materials is the way, per the fps lab's shared-material result.

### R46: the London street package (2026-10-07)

- **What:** `src/make/street.js` (828 lines), by a helper, reviewed; the demo page is `lab/scale/street.html`.
- **What it builds:** a 150 m street, c.1660, from rules over the sourced period research.
  - **The street:** 51 lots (3 inns, 4 lanes, 1 entry), 20 signs, 19 stacks, 24 outshuts, 77 posts.
  - **Behind it:** 258 stand-ins for the back-land.
  - **Determinism:** the same digest whether built forward, reversed or shuffled.
- **Build:** about 740 ms in all.
  - the plan, 16–19 ms;
  - textures, about 300 ms;
  - geometry, about 370 ms;
  - upload, about 50 ms.
- **Draw (RX 460):**
  - first frame, about 1.3 s;
  - 60 fps at vsync (p99 17.4 ms);
  - vsync off: 204 fps on WebGPU, 180 on WebGL 2;
  - 97 draws and about 317k triangles in view.
- **Faces sharing one plane:** fixed at their sources, from 36,024 pairs to 3,214 (about 14 m², mostly inside timbers).
- **Three review rounds:**
  - **Round 1:** sky showed through the jetties; the raised view read as a film set; the roofs were flat orange; the posts looked like bollards.
  - **Round 2:** the backs were framed; back-land stand-ins added; the timbers made to read.
  - **Round 3:** geometry made sound by construction.
- **Left for later:**
  - interiors, and working shutters and doors;
  - people, carts, smoke and lit lanterns;
  - streaming by block, and its textures in workers.
- **Waiting for Kabe's vetting:** the walk and face checks, still in the lab script only.

## Heavy files from jsDelivr (gate g8dfd99, 2026-10-07)
- **New code:** src/make/assets.js (~110 lines), tools/asset-manifest.mjs (~100), tools/inject-assets.mjs (~40), 15 lines in tools/publish-site.sh, tests/.assets-hook.mjs (draft, awaiting vetting). Reused: nothing (jsDelivr's `gh/<repo>@<sha>/<path>` form is its own).
- **Moved:** 197 files, 129 MB (123 paintings, 26 meshes, the painted-room textures, gallery images) in 49 commits; 9.7 KB manifest. Publish cost: about 80 s once, for one HEAD per commit to warm jsDelivr.
- **Run time:** the hook adds nothing measurable per request (a hash lookup); a first visit costs the same bytes and time as before; a visit after Pages' 10 minutes re-validates no heavy file at all.

## Vertex arrays let go on phones (2026-10-08)
- **New code:** src/make/geodrop.js (~75 lines), 5 lines in lab/manor/index.html; tests/.geodrop.mjs (memory), tests/.geodrop-play.mjs (the case played by taps, to diff against ?geodrop=0). Reused: nothing (three r186's WebGPU backend has no onUpload hook: its call is commented out).
- **What goes:** normals, uvs, colours and other static attributes, each once the GPU has it; positions and indexes stay (every raycast: aim, the double tap's goTo over the whole scene, the body, the presences, the authoring checks). Phones by default; ?geodrop=0 keeps all, ?geodrop=1 on a desktop.
- **Measured** (headless Chromium, RX 460, 390×844 at DPR 3, ?case=case-1660&fresh, after warm and a GC):
  - held vertex arrays 187 → 68 MB (118.6 MB let go, 4105 attributes of 1344 geometries);
  - JS heap with array buffers (performance.memory) 247 → 130 MB;
  - renderer process RSS 537–542 → 390–420 MB (WebGL 2: 507 → 352 MB); GPU process and renderer.info unchanged.
- **Run time:** the sweep 25–35 ms in all by walkable + 10 s, in 3 ms slices every 1.5 s; then about 25 ms a minute of play (a walk of the scene graph every 1.5 s, new ground and hillside tiles let go as they come).
- **Checked:** the case by taps at a phone (Dame Anne, the muniment key and candlestick, Daniel's chest reached into, the body, d18 opened and walked through, double taps on floor, wall and ground, the gates, down the hill): every step the same as ?geodrop=0 (positions to 0.02 m from key-hold timing), screenshots within 0.5 of a level; WebGL 2 the same; every material rebuilt and the shadow redrawn after the drop, no error; __sight/__fight/__seal identical.

## R59 receipts (bot stand-in), 2026-10-08

**What it stands in for:** R59 asks for the case played from arrival to accusation on a phone in 30–60 minutes, with the receipts. Until Kabe walks it himself, `tests/.naive-play.mjs` plays case-1660 the way a first-time player would, knowing nothing of the solution:
- 390×844, touch, WebGPU, `&voice=0`;
- it reaches into opened things;
- it asks the notebook for thoughts when stuck;
- it types some questions in its own words;
- it reloads once mid-case;
- it restarts and resumes after a browser crash.

The report is `design/case/naive-play2-2026-10-08.md`.

**New code:** `tests/.naive-play.mjs`, 407 → 609 lines (+285, −83):
- the reach-in scan (step up to an opened thing and tilt over it for the "take out" hand);
- thoughts, taken through the notebook in a conversation and followed at once;
- typing, using phrasings from `tests/fixtures/intent-corpus-1660.json` for the matter meant, limited to words the game has shown, and recording what each line was read as;
- presses on chips the panel badges "press";
- a first visit to new places and people before re-asking;
- the reload check;
- crash restart from the mirrored saved case (`--crash-at N` tests it);
- launch retries;
- the person-time estimate.

Reused: this morning's search, questioning and accusation. No game file changed.

**Clock time:** 12:55–14:45, about 1 h 50 min.
- Reading: 10 min.
- The bot and its probes: 45 min.
- Runs: four sets of six seeds, about 25 min each of machine time, two seeds at a time. Three sets were discarded as the bot was made fairer; each discard is named in the report's method.
- Report and receipts: 20 min.
- No helpers, no consults.

**Per play** (six seeds, this machine, RX 460, other agents' GPU benchmarks running alongside):

| seed | hand | solved | turns | person min (est.) | clues | wrong tries | thoughts | typed (read as none) | model calls | bot wall |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | chips | yes | 138 | 35.0 | 30/47 | 1 | 6 | 10 (1) | 0 | 423 s |
| 2 | typing | yes | 123 | 34.1 | 26/47 | 1 | 5 | 22 (0) | 0 | 375 s |
| 3 | chips | yes | 118 | 27.4 | 31/47 | 1 | 4 | 8 (0) | 0 | 368 s |
| 4 | typing | yes | 101 | 26.5 | 26/47 | 3 | 3 | 23 (0) | 0 | 255 s |
| 5 | chips | yes | 148 | 35.7 | 37/47 | 1 | 6 | 10 (0) | 0 | 465 s |
| 6 | typing | yes | 141 | 41.1 | 35/47 | 0 | 7 | 38 (0) | 0 | 383 s |

- **Cost per play:**
  - 0 model calls in every run, so $0;
  - person time 26.5–41.1 min (median 34.6), from the per-action table in the report (chip 6 s, typed 20 s, room search 40 s, walk 25 s plus 20 s a floor, paper 45 s, thought 10 s);
  - typing is the biggest swing: 2.7 min on chip seeds, 7.3–12.7 min on typing seeds.
- **The game's own receipt line,** seed 3 for example: "(Solved in 5.2 minutes: 73 questions, 8 in your own words; 31 of 47 clues; 1 wrong try; 4 thoughts asked.)". The minutes are the bot's clock, not a person's.
- **Resume:**
  - a reload at turns 66–71 resumed clues, notebook, leads and room in 6 of 6 runs;
  - a killed browser (seed 3, turn 92) resumed with 27 of 27 clues and the same leads;
  - 0 page errors and 0 bot errors in all six.
- **Top game fixes** (detail and file:line in the report):
  1. a shut drawer's padlock key can be aimed and taken as "the key". It happened in 4 of 6 runs, and 3 of 6 never learned the key's cut cord;
  2. the notebook opens only inside a conversation;
  3. reach-in is lost on reload;
  4. an opened chest is hard to reach into from 2.5 m;
  5. typed questions naming a person read as "What of <person>" (10 of 111 lines);
  6. position and clock are saved only on a turn.
