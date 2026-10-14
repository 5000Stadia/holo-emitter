# Recipe: take-and-drop (v1)

**Kabe, 2026-10-13:** "We also need to consider the placement of our items and locations in pattern buffer on placement and status changes in pattern buffer as well. When an item is taken for example." (R75)

**The story** (pattern-buffer's proposal): a page lies in a book in the study. The player takes it, carries it to the hall and puts it down there.

**The mechanism:** every placement we make, and every change in play, written to pattern-buffer as facts.
- **Placements:** where each thing stands, in which room, in what. They are the world's truth, written through an AUTHOR session (AUTHOR-RECORD-V1, `frame='canon'`, never to the player's view). When construct hosts, it writes them or opens the session for us.
- **Play events:** taken, put down, opened, switched, lit. They go through the view module's queue (`js/patternbuffer` queue.mjs, as recorder) to the service's `record` verb. Until a service is reachable they wait as a pending overlay the page draws, and the feed later confirms them, canon winning. `record` writes each to canon and to the player's frame, as observed.

| stage | reads | hands on | its check | status |
|---|---|---|---|---|
| holo-emitter | its own placer and works' store | generation: `obj:page · in · obj:book` (or `in · place:study`); built-in things first marked `obj:door · fixture · true`, then their `in`. Play: `obj:page · held_by · person:player` (taken, at t); `obj:page · in · place:hall` (put down, at t2); `obj:coat · worn_by · person:player`; `obj:box · state · open`, `obj:light · state · on` (our own state words, used consistently) | every works change produces its fact; a fixture is never carried off | not yet: our side of R75 (the author session at load, the queue for play) |
| pattern-buffer | placements through an author session; play events through the queue to record | the containment family (`in`, `held_by`, `worn_by`, `carried_by`) folds as one key, so each move supersedes the last; fixtures are constitutive and never move | the page reads `in place:hall` after the drop, never back in the book (the flicker construct measured, closed by CONTAINMENT-DURABILITY-V1); the player's frame matches canon after each recorded event | built: containment folding, record, author sessions. CONTAINMENT-DURABILITY-V1 is building |
| construct | the facts | hosting, it writes placements or opens the author session | — | asked |
| photonic | — | (a person who takes something writes the same `held_by`) | — | not needed yet |

**End to end:** load the study, and its placements are in canon. Take the page: `held_by · person:player`. Put it down in the hall: `in · place:hall`. Reload, and it is in the hall.
