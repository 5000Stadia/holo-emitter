// Walking, as a body does it (one set of rules for the player and for the checks that walk a place): you
// stand on a floor, a tread or a landing within a step of your feet; never in a floor's well, nor within a
// body's width of a wall or a piece of furniture; through a doorway only while its door stands open; and
// a flight overhead stops you only where it leaves less than a head's room.
// makeWalk({ plan, levelOf, blocks, isOpen }) -> { groundAt(x, y, h) -> h' | null, floorOf(h), roomAt(x, y, h) }
import { surfaceZ } from "./plans/stairs.js";
import { houseClaims } from "./claims.js";

export const BODY = { half: 0.22, step: 0.45, head: 1.95, soffit: 0.3 };

export function makeWalk({ plan, levelOf, blocks = [], isOpen = () => true, body = BODY, claims: given = null }) {
  const floors = [...plan.floors].sort((a, b) => a.level - b.level);
  const floorOf = (h) => { let f = floors[0].id; for (const q of floors) if (levelOf(q.id) <= h + 1.2) f = q.id; return f; };
  const inRect = (r, x, y, m = 0) => x > r.x0 + m && x < r.x1 - m && y > r.y0 + m && y < r.y1 - m;
  const rooms = plan.rooms.filter(r => r.type !== "open");
  // floor you can stand on at (x, y) on floor f: the house's claim grid (src/make/claims.js), a body's half-width off
  // every wall and everything built that stops it, never in a well, through a doorway only while it is open
  const claims = given || houseClaims({ plan, blocks, half: body.half });
  const floorHere = (f, x, y) => claims.canStand(f, x, y, body.half, isOpen);
  function groundAt(x, y, h) {
    let best = null;
    for (const s of plan.stairs) {
      const z = surfaceZ(s, x, y, true); if (z == null) continue;
      const b = levelOf(s.from), top = b + (levelOf(s.to) - b) * z;
      if (Math.abs(top - h) <= body.step) { if (best == null || Math.abs(top - h) < Math.abs(best - h)) best = top; }
      else if (top > h + body.step && top - body.soffit < h + body.head) return null;                // a flight in the way, or no headroom under it
    }
    if (best != null) return best;
    const f = floorOf(h), L = levelOf(f);
    return Math.abs(L - h) <= body.step && floorHere(f, x, y) ? L : null;
  }
  const roomAt = (x, y, h) => rooms.find(r => r.floor === floorOf(h) && inRect(r.rect, x, y));
  return { groundAt, floorOf, roomAt, floorHere, claims };
}
