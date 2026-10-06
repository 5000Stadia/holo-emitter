# R47: a building's purpose decides its rooms (the plan, 2026-10-05)

The facts are in `program-1660-research.md` and `digest-r47.md`. The review (c7cb6e2, one consultant answered) made four points:
- I adopt two of them myself: plan types as envelope, section and access graph; furniture last.
- The other two wait on Kabe (gate g8d6c49):
  - P1: the plan is stored as truth and sealed when seen.
  - P2: one reachability check under the world's own rules.

## 1. The program (data)

`src/make/programs/england-1660.js`.

**The room types** the household needs, each with:
- its floor or floors;
- a size range;
- a count range;
- whether it rises two storeys;
- the types it must open from or to.

**The sequences:**
- screens passage → buttery, kitchen, pantry;
- hall → parlours;
- hall → great stair → great chamber → withdrawing chamber → best bedchamber → closet;
- lord's chamber or steward's room → muniment room, by one door;
- a back stair from service to the chambers;
- the long gallery from the stair head.

A program is what an ingestion pass writes for a place ("a gentry seat, c.1660, Derbyshire, many manors"). It's data, not code.

## 2. The plan type: envelope, section, access graph (review point 1, adopted)

Plan types are code (parts of a building). The first is the Sudbury-style **hybrid E-plan**.

**The envelope:**
- a main range with a central porch, and two wings;
- a symmetrical front, its window bays set by the front's rhythm rather than by the rooms;
- proportions taken from published plans of the houses the research cites, and recorded with each number.

**The section:**
- storey heights per floor;
- a hall that rises through two floors, so nothing stands above it;
- flues stacked through the floors above each hearth;
- garrets under the roof.

**The access graph** comes from the program's sequences. Rooms fill the envelope's slots in the order the graph needs: service at the low end, parlours and the great stair at the high end, the state apartment over the parlour wing.

The output is the existing plan schema (`holo-emitter-plan/0.1`), so `plan-compile.js`, the house walker and the brief compiler all read it unchanged.

**A new check:** the access graph as built follows the program's sequences. This shows the purpose decided the rooms. It's proposed to Kabe, as every check is.

## 3. Room grammar (data per room type)

A room type is a kind-like record:
- height rule;
- floor (flags, gypsum plaster, boards, matting);
- walls (wainscot, tapestry, gilt leather, limewash);
- ceiling (plaster compartments, beams);
- windows (mullioned casements, size by rank);
- hearth (open kitchen hearth with jack and spits; chimneypiece with grate; none);
- light (candles, sconces, firelight);
- anchor furniture.

It extends R45's brief pins, so the muniment room's brief becomes one room type among many, and the honoured/adjusted/conflict report covers every room. Pins that cut across rooms (one way in, no fire) stay in the brief.

## 4. Doorways show the next room's light

Adjacent rooms are built and lit, so an open door shows the room beyond in its own light. The holodeck grid stands only where nothing is planned yet.

## 5. Furniture, last (review point 4, adopted)

Each room type gets one anchor piece that names it:
- **hall:** long table and forms;
- **kitchen:** hearth with jack and spits;
- **buttery:** hogsheads on stands, with taps;
- **bedchamber:** standing bed with curtains on rods, and a close stool;
- **parlour:** court cupboard and chairs;
- **gallery:** portraits;
- **study and muniment room:** presses.

Kinds Alice's hall of doors will also need come first: locking doors and keys, curtains on rods, tables, hanging lights, bottles. Stop when someone shown unlabelled shots from each doorway can name every room type.

## 6. Kabe's answers (gate g8d6c49, 2026-10-06)

His words: "P1 only change I see is if theres magic something, consider Alice here. It seems like that p2 approach is more efficient so I cant see why not a yes."

- **P1, accepted with an adjustment.** The plan's geometry is sealed into the world document when first seen, and the generator only fills what's unseen. The seal guards against generator drift, never against the story. Magic (Alice's hall that changes, a door that shrinks, a room rearranged) reaches the sealed plan as the story's own assertions, with story provenance. The same solver takes a hand plan, a program, or a text's pins, and reports honoured, adjusted or conflict.
- **P2, accepted.** One check, every room reachable by the world's own actions at the player's current size, replaces "every room reachable" and "nothing in an opening". "Same plan, same house" stays. Like every check, it goes to Kabe to vet in its final form.
