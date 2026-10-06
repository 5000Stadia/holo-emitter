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
