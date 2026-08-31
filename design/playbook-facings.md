# The facing playbook — which instructions each facing prompts

**The code is the authority; this file is the index.** Every situation below is a
branch that already runs in the emitter. Nothing here is a second copy of an
instruction, and changing a line in this file changes no prompt. The tag
vocabulary is `TAGS` in `tools/playbook.mjs`; `tests/playwright/playbook.spec.mjs`
refuses a tag this table does not carry and a row this table invents.

## Where it comes from

[HUMAN, Kabe, 2026-08-30, verbatim] "Because different angles and different room
types, prompt, different orientations, and styles. We should have a playbook of
different instructions for room, image generation, depending on which direction
and room piece type we are working on. When the map schematic is initially
generated, every location in every direction should prompt the appropriate set of
instructions. And some may overlay — for example, an up-close wall facing with a
corner on the right hand side and the wall extending off of the picture to the
left is one set of instructions for long rooms in that corner spot, but also
another set of instructions is prompted if there is a door. If there is no door,
we skip that processing of course."

## How to read it

`node tools/playbook.mjs --pack <name>` prints every `loc/F` in a pack with its
ordered tags (`--json` for tooling). The same list rides out with the ask: each
packet's `PACKET.md` carries a `Situations:` line and each manifest entry a
`situations` array, so a return can be attributed to the instruction sets that
composed it.

**Tags overlay.** `enclosed, follower, run-wall:corner-left, door` is four
instruction blocks in one ask. **An absence yields no tag** — there is no
`no-door`, because "if there is no door, we skip that processing of course". The
one apparent exception, `no-window`, is a SAID absence: the register states it
out loud, because a wall that does not say it gets a window painted into it.

## The tags

| tag | what it means | which code emits its instructions | the instruction's gist |
|---|---|---|---|
| `enclosed` | A built wall faces you: the facing's plan type is `enclosed` (or a corridor's), so the ask describes a surface, its corners and what stands on it. | `tools/plan-projection.mjs` — `deriveMeta (facing_type)` | "The wall you face is square on" — surface, corners, scale. |
| `open-facing` | No wall faces you at all: the facing's plan type is `open` and it quotes its scale at a `far_line`, so the ask describes open ground running to the horizon. | `tools/frame-language.mjs` — `g5RoomLines / g5WallLines (out, GROUND)` | "no wall at all on this side" — open ground out to the horizon under open sky. |
| `lead` | This is the wall its room paints FIRST — the most-carried one — and it is handed to the room's other three as Image 1. | `tools/edge-seed.mjs` — `leadFacing / seedPlan` | Paint this wall first; it becomes the room's Image 1. |
| `follower` | This wall is painted AFTER its room's lead and carries the lead's picture as Image 1; its packet waits (`depends_on`) until the lead's picture is on disk. | `tools/edge-seed.mjs` — `seedPlan (continues, depends_on)` | "Image 1 is a wall of THIS room" — match its fabric, light and fixtures. |
| `run-wall:corner-left` | A long room's side wall: the corner stands in view on the LEFT and the flat wall runs off the RIGHT edge of the picture with no corner and no return wall. | `tools/frame-language.mjs` — `g5PictureLines (offL/offR branch)` | "On the right there is NO corner and NO return wall: the flat wall simply continues and leaves the picture." |
| `run-wall:corner-right` | A long room's side wall: the corner stands in view on the RIGHT and the flat wall runs off the LEFT edge of the picture with no corner and no return wall. | `tools/frame-language.mjs` — `g5PictureLines (offL/offR branch)` | "On the left there is NO corner and NO return wall: the flat wall simply continues and leaves the picture." |
| `deep-view` | The wall you face is not this cell's own edge: the view passes through a full-width open edge and lands on a farther cell's wall, so the near cell's side walls, floor and ceiling fill the rest of the frame. | `tools/make-scaffold.mjs` — `deepViewOf` | The far wall spans only part of the frame; this cell's own surfaces continue toward you and fill the rest. |
| `same-wall-image` | The deep view's Image 1 is THIS SAME WALL promoted at close range: the ask says paint the identical wall with everything on it, from further back, changing the camera distance and nothing else. | `tools/make-scaffold.mjs` — `sameWallImageFor (role_sentence)` | "Change the camera distance and nothing else." |
| `open-side` | An `open_edge` stands on this facing's OWN edge — a court mouth or threshold — so the ask says there is no wall here at all across its full width, and the ground runs out through it. | `tools/frame-language.mjs` — `g5WallLines (openSide branch)` | "there is no wall here at all" — no gate, parapet, railing or hedge across any part of it. |
| `door` | At least one door opening stands on this wall: the ask rules its width and 2.00 m head height and says where along the wall it sits. | `tools/plan-projection.mjs` — `facingCarriers (door) -> scaffoldRects -> g5WallLines` | Ruled opening width x 2.00 m head, placed along the wall. |
| `door:N` | N doors stand on this wall (N >= 2): the ask counts them and places each one separately, so two doorcases cannot collapse into one. | `tools/frame-language.mjs` — `g5WallLines (kindGroups / nWord counting)` | "two doorways", each placed — the count is said before the places. |
| `window` | At least one window stands on this wall: the ask rules the sill and head, names which casement opens, and states the pack's glazing. | `tools/plan-projection.mjs` — `windowsForFacing / facingCarriers (window)` | Ruled sill and head, the casement that opens, the pack's glazing. |
| `window:N` | N windows stand on this wall (N >= 2): the ask counts them and places each one, and a two-window wall also gets the `between the two windows` position phrase. | `tools/frame-language.mjs` — `positionPhrase (between the two windows)` | The count is said, and a feature between them is placed as "between the two windows". |
| `no-window` | This facing carries no glazed opening, and the ask SAYS SO — a wall that does not say it gets a window painted into it. | `tools/frame-language.mjs` — `g5WallLines (!wins.length branch)` | "there is no window: this wall carries no glazed opening of any kind". |
| `fireplace` | A chimneypiece breast stands on this wall: the ask rules the breast width and gives the firebox and the height above the floor by convention. | `tools/plan-projection.mjs` — `facingCarriers (fireplace) -> scaffoldRects` | Ruled breast width; firebox and height above floor by convention. |
| `stairs` | A flight is drawn in this view: the ask names its direction, its treads in view, where it runs off, and (climbing up) its well. | `tools/plan-projection.mjs` — `stairsForFacing / flightsForFacing -> g5FlightLines` | Direction, treads in view, where the flight leaves the frame, the well. |
| `blank` | This facing carries no opening and no built feature at all: the ask says the room's one fabric runs across the whole of it, unbroken corner to corner, and names no second fabric. | `tools/frame-language.mjs` — `g5WallLines (!rects.length branch)` | "nothing stands on it... the fabric named above runs across the whole of it, unbroken corner to corner". |

## The overlay, worked

`underground-2` `platform_far/W` returns
`enclosed, lead, deep-view, same-wall-image, door, no-window` — six instruction
sets on one wall: a built surface, painted first in its room, seen through a
full-width open edge onto a farther cell's wall, with Image 1 being that same
wall promoted at close range, a doorway standing in it, and the sentence that
says no window is there. Remove the door from the plan and the `door` block is
simply not prompted; nothing else moves.

## Known defect, found by this index and not fixed here

`deepViewOf(plan, "entrance_court/S")` (manor) matches `entrance_approach/S`.
Both are `open` facings, which carry `camera_far_m` and no `camera_wall_m`, so it
returns `{close_cam: undefined, deep_cam: undefined, back_m: null}`; both that
backdrop and its meta are on disk, so `sameWallImageFor` passes its own existence
guard and throws `TypeError: Cannot read properties of undefined (reading
'toFixed')`. Re-emitting that packet would crash. `situationsOf` refuses to claim
`same-wall-image` there, which is why the manor's report shows none.
