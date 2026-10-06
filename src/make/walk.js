// Walking, as a body does it (one set of rules for the player and for the checks that walk a place): you
// stand on a floor, a tread or a landing within a step of your feet; never in a floor's well, nor within a
// body's width of a wall or a piece of furniture; through a doorway only while its door stands open; and
// a flight overhead stops you only where it leaves less than a head's room.
// makeWalk({ plan, levelOf, blocks, isOpen }) -> { groundAt(x, y, h) -> h' | null, floorOf(h), roomAt(x, y, h) }
import { surfaceZ } from "./plans/stairs.js";

export const BODY = { half: 0.22, step: 0.45, head: 1.95, soffit: 0.3 };

export function makeWalk({ plan, levelOf, blocks = [], isOpen = () => true, body = BODY }) {
  const floors = [...plan.floors].sort((a, b) => a.level - b.level);
  const floorOf = (h) => { let f = floors[0].id; for (const q of floors) if (levelOf(q.id) <= h + 1.2) f = q.id; return f; };
  const inRect = (r, x, y, m = 0) => x > r.x0 + m && x < r.x1 - m && y > r.y0 + m && y < r.y1 - m;
  const strip = (R) => (R.x1 - R.x0) < (R.y1 - R.y0) ? { x0: R.x0 - 0.35, x1: R.x1 + 0.35, y0: R.y0 + 0.08, y1: R.y1 - 0.08 } : { x0: R.x0 + 0.08, x1: R.x1 - 0.08, y0: R.y0 - 0.35, y1: R.y1 + 0.35 };
  const rooms = plan.rooms.filter(r => r.type !== "open");
  // each well as the floor above sees it: railed on its sides (a body's width off the rail), open at the
  // foot end, where the flight arrives and the next goes on
  const wells = (plan.wells || []).map(w => { const H = w.hole, F = w.rect, m = body.half;
    return { to: w.to, keep: { x0: H.x0 - (F.x0 < H.x0 - 0.01 ? 0 : m), x1: H.x1 + (F.x1 > H.x1 + 0.01 ? 0 : m), y0: H.y0 - (F.y0 < H.y0 - 0.01 ? 0 : m), y1: H.y1 + (F.y1 > H.y1 + 0.01 ? 0 : m) } }; });
  // floor you can stand on at (x, y) on floor f
  function floorHere(f, x, y) {
    if (wells.some(w => w.to === f && inRect(w.keep, x, y))) return false;                           // the well, and its balustrade
    if (blocks.some(b => b.floor === f && x > b.x0 - 0.18 && x < b.x1 + 0.18 && y > b.y0 - 0.18 && y < b.y1 + 0.18)) return false;
    if (rooms.some(r => r.floor === f && inRect(r.rect, x, y, body.half))) return true;
    return plan.openings.some(o => o.floor === f && o.rect && inRect(strip(o.rect), x, y) && isOpen(o.id));
  }
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
  return { groundAt, floorOf, roomAt, floorHere };
}
