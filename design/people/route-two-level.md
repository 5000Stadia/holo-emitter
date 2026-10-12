# Routes in two levels: parked for M8 (2026-10-12)

**Why it's needed:** our route search costs about 9 µs a node.
- Photonic's crowd of 300 in the manor arrives 70 times in 30 s at 400 nodes a frame (about 3.6 ms), against a mark of 190.
- More budget only buys more conflict:
  - 1,000 nodes: 95 arrivals, 10.9 s;
  - 2,000 nodes: 124 arrivals, 20 s.
- A cross-house route takes up to 40,000 nodes.
- **The fix is fewer nodes per route, not cheaper nodes.** Remembering each cell's ground within a search has already halved the cost (committed 4035261).

**Parked:** a first cut, `seekVia`, is in the stash "R60 parked for M8" (`git stash list`). It isn't wired in or measured.
- It runs Dijkstra over a point just inside each side of every open door, then the grid search between consecutive points.
- It falls back to the plain search across floors, within one room, or when a stretch finds no way.
- Parked on the monitor's note n8ee660: Kabe's order is M7, then M9's grass, then M8.

**Prior art** (a helper's pass, 2026-10-12):
- **HPA\*** (Botea, Müller and Schaeffer 2004, https://webdocs.cs.ualberta.ca/~mmueller/ps/hpastar.pdf), with rooms as its clusters.
  - Our plan already holds the coarse graph it has to compute.
  - Its costs within a room can be straight-line distances.
  - Refine only the next stretch, as the walker reaches it, not the whole route: a door can shut mid-walk.
- **Recast/Detour** (zlib licence, https://github.com/recastnavigation/recastnavigation): a coarse corridor first, straightened as the agent moves.
  - Doors open or shut, and a body's width, become a filter on each search (`dtQueryFilter`), not a graph per width.
  - Searches run in slices (`initSlicedFindPath` and `updateSlicedFindPath`), as ours do.
- **Doorway crossings:** don't aim for a doorway's midpoint. Use each doorway as a portal shrunk by the body's half-width, and run the funnel algorithm (Mononen, http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html) over the portal sequence. A door too narrow for the body shrinks to nothing and drops out.
- **The grid search:** run it only between funnel corners, within the two rooms' rects.
- **If a door shuts:** plan again from the current room.

**Its pass mark, when M8 comes:** 300 in the manor arrive at least 190 times in 30 s, within 3–4 ms of routing a frame, with no one inside and none sinking (Photonic's round of 2026-10-12, all met except arrivals).
