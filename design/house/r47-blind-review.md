# R47 blind review: can every room be named from its doorway?

The stop rule (r47-plan.md §5): someone shown unlabelled shots from each doorway names every room type.

**Method:**
- `tests/.doorways.mjs` takes one shot per room type, standing just inside a doorway with that door open and hidden, looking at the room's middle, with the HUD hidden.
- A fresh reviewer (Opus, no access to the project) gets the 23 shots shuffled, with no list of types. It names each room as a period inventory would, gives a confidence from 1 to 5, and says what is missing.
- Two rounds at most.

## Round 1 (2026-10-06)

**Read right with confidence 3 or more (13):**
- great hall, great parlour, kitchen, great stair;
- great chamber, closet, bedchamber, bakehouse;
- servants' chamber, study, muniment room, long gallery, buttery.

**Right but with low confidence (4):**
- best bedchamber ("bedchamber", but which one?);
- servants' hall (2: "it reads almost the same as the hall");
- withdrawing chamber (2);
- pantry (1–2).

**Wrong or unreadable (6):**
- **nursery:** read as "bedchamber";
- **little parlour:** nearly empty;
- **larder:** "one tub can't name the room";
- **porch, screens passage and back stair:** the shot was blocked or looked outdoors.

**What the reviewer asked for, and the round-2 response:**

| The reviewer's point | Round 2 |
|---|---|
| Rank the bedchambers | best chamber: two Turkey-work chairs; nursery: a hooded cradle that rocks |
| Parlours are boxes with a chair or two | great parlour: a table under a Turkey carpet; withdrawing chamber: a daybed; little parlour: a spinning wheel that turns |
| Hall and servants' hall alike | the hall: pikes and a halberd hung on the wall; the servants' hall: a peg rail with cloaks |
| Service rooms near empty | larder: flitches of bacon on a rack and three tubs; pantry: a dresser with pewter |
| The study has one press in a big room | two presses and a chair |
| The gallery's frames are blank | portraits painted in code, each its own sitter |
| The matting floor is untextured | woven rush matting |
| Stair without balusters | noted for later |
| The bakehouse oven stands free | noted for later |
