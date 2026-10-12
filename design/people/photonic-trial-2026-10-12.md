# Photonic's people in our harness: the first trial (2026-10-12, R60/R61)

**What was tried:** Photonic's `makePeople` (its R4, commit 248dd73), in our harness (`?people=photonic`), behind a small adapter (`src/people/photonic.js`).
- **Kept local:** the vendored copy and the adapter are untracked and stripped from the site until Kabe answers Photonic's gate g57063d, whether that code goes public (the monitor's note n3fb468). If he says yes, both are committed as planned.

**What works:**
- In Alice's hall (6) and the banqueting house (20), people walk our routes, change rooms and arrive. No page errors. Our checks find nothing floating, sinking, inside a wall or stuck in a door.
- 300 in the manor: 900 frames of 1/30 s stepped in 10.0 s on desktop, about 11 ms a frame with our routing. Our reference crowd takes 54.5 s.

**What doesn't fit yet** (sent to Photonic, m73c316):
1. **Nobody steps aside.** After 30 s in the manor, 110 of 300 overlap another body.
2. **An empty route crashed its tick.** The adapter now always returns a point.
3. **No "no way".** The adapter turns it into a `no_way` event.
4. **Routes are found at once inside `goTo`.** Our sliced search, which keeps to a frame's budget, isn't used.
5. **26.6 MB of walk data,** even for 6 people.

**Not measured yet:** a phone.

## After Photonic's fixes (6b4d2fc, the same night)

- **Fixed:** the empty route, "no way", routes found in slices within a frame's budget, and memory (20 people 2.3 MB, 300 people 7.2 MB).
- **Stepping aside:** people now step aside through our moving-bodies layer. Manor, 300 for 30 s:

  | | Before | After |
  |---|---|---|
  | People overlapping someone | 110 | 71 |
  | Inside the house's solids | 0 | 9 |
  | Sinking under the floor | 0 | 4 |
  | Arrivals | 214 | 165 |
  | 900 frames stepped (desktop) | 10.0 s | 21.5 s |

- **Why the new findings:** a sidestep doesn't ask the house whether its spot can be stood on. I offered `ctx.walk.stand(pos, floor, half)` (m5c95e0).
