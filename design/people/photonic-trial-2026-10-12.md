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
