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
| 2026-10-05 | R45 muniment room from the period brief | 19 min | 7 | ~1,000 | 10 ms | 0.43 s | 5.1 s |

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
