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
| 2026-10-05 | Live titles; shelves filled by the owner's means and the room's purpose | 4.5 min | title atlas, 4 bindings, contexts | ~170 | – | 0.16 s (wall) | – |
| 2026-10-05 | The book as its own recipe; a 581-book library wall from it | 5 min | 1 recipe (book) + library wall | ~230 | – | 0.12 s (wall) | – |
| 2026-10-05 | A bookpress full of books, c. 1666 (one object, conception to checked) | 9 min | 1 object (+ spine atlas, acanthus) | ~200 (+84 stage) | – | 0.18 s | – |
| 2026-10-05 | R45 fixes from your review (rolls, corners, stonework, floor) | 7 min | 1 (flagstones) | ~110 | 11 ms | 1.38 s | 5.8 s |
| 2026-10-05 | R45 muniment room from the period brief | 19 min | 7 | ~1,000 | 10 ms | 0.43 s | 5.1 s |

---

## Live titles, and shelves filled by context (2026-10-05)

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
