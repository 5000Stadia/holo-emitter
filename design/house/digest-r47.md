# R47 digest: a building's purpose decides its rooms (facts only, 2026-10-05)

## What R47 must do (ROADMAP.md, R47)

"A building's purpose decides its rooms: a c.1660 manor's program per floor (hall, parlour, great chamber, gallery, kitchen, buttery, muniment room…) lays out the plan, then each room type builds by its own grammar (heights, finishes, light, furniture), and doorways show the next room's own light." The roadmap also asks for checks that always hold:
- every room is reachable;
- nothing stands in an opening;
- the same plan always builds the same house.

The person's prior critique, via a twin agent: the whole manor was "one room copied" (holo-emitter-codex m1e9ea4).

## The goal it serves (ROADMAP.md Vision; lab/PRODUCTION-NOTES.md)

- "Describe a world, live render the world."
- The far test: "throw the Alice in Wonderland story at pattern buffer and have holo emitter ingest it in such a way, that I can play a 3-D interactive world based on the book."
- The approach the person wants is "a rigorous rule set and separation of object types, and behaviors". AI is used only to author a recipe, plus one ingestion pass per place. Deployment and play make zero AI calls.
- Every obvious functional thing works (person, 2026-10-05): doors, lids, drawers, curtains, taps, levers, and processes over time.

## What exists

- **The plan schema** (`lab/house/plan.json`, `holo-emitter-plan/0.1`):
  - rooms with rect, floor and archetype (hall, chamber, service, …);
  - openings (door or open edge, joining two rooms) with rects;
  - windows, fireplaces, stairs, objects;
  - floors with storey heights (2.8 m each, uniform).
- **Two plans today:**
  - a hand plan, 22 rooms on 2 floors (the hall-and-solar "packs/manor");
  - a generator (`lab/house/plan-gen.js`): an H-plan, rooms 4.2–6.6 m either side of central corridors, names drawn from a list by floor. With `?plan=grand` it gives 111 rooms on 3 floors.
- **The plan compiler** (`plan-compile.js`): a pure function from plan to each wall's elements. The house builder (`house.js`) uses one style for the whole house, varied only by archetype: limewashed walls and flags for service, panelling and boards otherwise.
- **The period brief for one room** (R45, `lab/brief/manor-1660.json`, `brief.js`): the room's function, and pins the build must honour (one door, iron door, small barred windows, presses, chest, table, no hearth). Each pin is reported as honoured, adjusted or in conflict with the plan. Example: the plan gives the muniment room two doors, so the report says to close one.
- **The production system** (R48, `src/make/`):
  - parts are code, kinds are data;
  - influences (owner by possession, room purpose by space) blend into a context;
  - habit rules dress containers (shelves);
  - a world document holds entities and assertions, with rooms sealed by their inputs when first seen;
  - working affordances, gates, variables and rules;
  - a holodeck grid stands in for a missing part;
  - the bench gives the same layout hash across browsers.

## Measured costs (lab/house/TIMING.md; design/production/digest-2026-10-05.md)

| Build | Cost |
|---|---|
| Hand plan, 22 rooms | Compile 1.5 ms; geometry 3.3 s (about 150 ms a room) |
| Generated plan, 111 rooms on 3 floors | Compile 9 ms; about 147 ms a room (16.3 s total); walkable in 4.7 s with the nearest rooms first |
| Peak in the great hall | About 1,000 draws, 1.6M triangles, 255 MB heap |

- One room rebuilds in about 0.5 s.
- The strongroom from its brief builds in about 1.5 s, including its label atlas.
- The kit (procedural materials) takes about 2–3 s, once per style.

## Period facts (design/house/program-1660-research.md, with sources)

- **Plan types:**
  - Old: a hall with a screens passage to service at the low end, parlour and great chamber at the high end, in an H, E or courtyard layout (Hardwick, Haddon).
  - New: the double-pile, compact, with a central hall holding the stair, service in a semi-basement, a corridor and back stairs (Pratt's Coleshill c.1650–62; Clarendon House; Belton 1685–87).
  - Derbyshire reality: Eyam Hall (1671–76) is Jacobean in look, with a flagged hall and mullioned windows. Sudbury (c.1660–91) is a hybrid: an E-plan with a Restoration great stair, saloon and long gallery, state rooms on one side and service on the other.
  - The research recommends the hybrid for a 1660 Midlands seat, with a double-pile variant for a "modern" owner. That recommendation is the researcher's inference.
- **Sequences:**
  - Screens passage, with 2–3 doors, to buttery, kitchen and pantry; the buttery has a stair to the beer cellar.
  - The hall became an entrance room by 1679, not a dining room. Parlours sit off the hall.
  - The great stair leads to the first-floor great dining chamber, above the great parlour.
  - The state apartment runs great chamber, withdrawing chamber, bedchamber, closet. Close stools stood in closets.
  - Back stairs and corridors are the new plan's (Coleshill).
  - The long gallery is on the top floor in the old plan (Hardwick 166 ft) and on the first floor at Sudbury.
  - The muniment room is strong and fire-safe, on the family floor near the steward's room or the owner's closet (Braithwait; Thornbury).
  - Servants lodged over service rooms and in garrets.
- **Scale:** Lancashire greater-gentry inventories list 24–37 bedchambers and 20–30 servants; a mid-gentry Derbyshire house is a fraction of that. There are no sourced hall or parlour dimensions. Coleshill's block is 124 × 62 ft (about 38 × 19 m), on 4 levels.
- **Room fabric and furnishing:** each room type has sourced floors (flags in the hall, Derbyshire gypsum plaster on upper floors, boards, matting), walls (wainscot, tapestry, gilt leather, limewash in service rooms), ceilings, windows (mullioned casements; sashes only from the 1670s), and fireplaces (open kitchen hearths with jacks and spits; grates with andirons in the main rooms). Inventories give furniture by room: the hall's long table and forms, the parlour's Turkey-work chairs and court cupboard, the bedchamber's standing bed with curtains on rods and close stool, the kitchen's jack, spits and racks, the buttery's hogsheads on stands, the larder's powdering tubs.
- **Light:** tallow candles were commonest, wax in the best rooms, rushlights still in use; there were wall sconces and branched candlesticks; firelight; windows "more glass than wall" at Hardwick.

## The decision

How should R47 turn "a building's purpose" into the plan and the rooms? Possible shapes:
- generate the plan from a program, by a layout algorithm;
- keep a hand plan and assign room types by rules;
- a small set of period plan types (the hybrid, the double-pile), each parametrised and filled from the program;
- some mix of these.

Where should room grammar live? A room as a kind over parts, like furniture? A brief of pins per room type, like R45? Something else?

How much furniture authoring does a convincing house need, and in what order? And what has to hold for the Alice test (R49): a hall of doors described in a few paragraphs, turned into a playable room by one ingestion pass and no AI after.
