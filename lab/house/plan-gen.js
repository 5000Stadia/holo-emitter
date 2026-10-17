// A large manor, generated: an H-plan of a main range and two wings, three floors, rooms either side of
// central corridors, two stair halls, windows on every outside wall, hearths in the principal rooms,
// writing tables in the studies and chambers. Same schema as packs/manor's plan (lab/house reads both).
//   generatePlan({ seed, length, wing, floors }) -> plan

function rng(seed) { let s = seed >>> 0; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }
const EXT = 0.6, PART = 0.35, COR = 2.1, DOOR = 1.1;

const NAMES = {
  ground: { hall: ["Great Hall"], chamber: ["Dining Parlour", "Library", "Study", "Withdrawing Room", "Morning Room", "Summer Parlour", "Steward's Room", "Chapel Closet", "Gun Room", "Justice Room", "Music Room", "Billiard Room"],
            service: ["Kitchen", "Buttery", "Pantry", "Servants' Hall", "Scullery", "Still Room", "Bakehouse", "Brewhouse", "Laundry", "Larder", "Dairy", "Wash House"] },
  first: { hall: ["Great Chamber"], chamber: ["State Bedchamber", "Blue Chamber", "Red Chamber", "Yellow Chamber", "Dressing Room", "Closet", "Lady's Chamber", "Lord's Chamber", "Tapestry Room", "Oak Chamber", "Nursery", "Guest Chamber", "Muniment Room", "Cabinet"] },
  second: { chamber: ["Garret", "Maids' Chamber", "Footmen's Room", "Lumber Room", "Governess's Room", "Box Room", "Night Nursery", "Linen Room", "Attic Chamber", "Housekeeper's Room"] },
};

export function generatePlan({ seed = 1660, length = 64, wing = 24, floors = 3 } = {}) {
  const r = rng(seed);
  const L = length, DEP = 15.2, WL = wing;
  const floorIds = ["ground", "first", "second"].slice(0, floors);
  const plan = {
    schema: "holo-emitter-plan/0.1-generated", units: "m", north: "+y", generated: { seed, length, wing, floors },
    floors: floorIds.map((id, i) => ({ id, level: i, storey_height_m: 2.8 })),
    rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], objects: [],
  };
  let n = 0; const id = (p) => `${p}${++n}`;
  const used = {};
  const nameFor = (floor, arche) => {
    const pool = (NAMES[floor] || NAMES.second)[arche] || (NAMES[floor] || NAMES.second).chamber;
    const k = `${floor}/${arche}`; used[k] = (used[k] || 0) + 1;
    const base = pool[(used[k] - 1) % pool.length];
    return used[k] > pool.length ? `${base} ${Math.ceil(used[k] / pool.length)}` : base;
  };
  // split [a, b] into rooms of 4.2-6.6 m with partitions between; returns [x0, x1] spans
  const split = (a, b) => {
    const out = []; let x = a;
    while (b - x > 0.1) {
      let w = 4.2 + r() * 2.4;
      if (b - (x + w + PART) < 4.0) w = b - x;               // the last room takes the rest
      out.push([x, x + w]); x += w + PART;
    }
    return out;
  };

  // the layout is split once and shared by every floor, so walls stack and the stair halls line up
  const yS = [EXT, 6.4], yC = [6.4 + PART, 6.4 + PART + COR], yN = [yC[1] + PART, DEP - EXT];
  const mid = L / 2, big = 13;
  const SOUTH = [...split(EXT, mid - big / 2 - PART), [mid - big / 2, mid + big / 2], ...split(mid + big / 2 + PART, L - EXT)];
  const wcx = [[6.4 + PART, 6.4 + PART + COR], [L - (6.4 + PART + COR), L - (6.4 + PART)]];
  const NORTH = [[EXT, wcx[0][0] - PART], [wcx[0][1] + PART, wcx[1][0] - PART], [wcx[1][1] + PART, L - EXT]].map(([a, b]) => split(a, b)).flat();
  const WING = split(DEP - EXT + PART, DEP + WL - EXT);
  for (const floor of floorIds) {
    const service = floor === "ground";
    // ---- the main range: south rooms | corridor | north rooms
    const corridor = { id: id(`${floor}_gallery`), floor, name: floor === "first" ? "Long Gallery" : "Corridor", type: "corridor", archetype: "corridor", rect: { x0: EXT, x1: L - EXT, y0: yC[0], y1: yC[1] } };
    plan.rooms.push(corridor);
    for (const x of [0, L - EXT]) plan.windows.push({ floor, rect: { x0: x, x1: x + EXT, y0: yC[0] + 0.35, y1: yC[1] - 0.35 } });
    // south row: the principal rooms, a great room at the centre
    const southRooms = SOUTH.map(([x0, x1]) => {
      const great = Math.abs((x0 + x1) / 2 - mid) < 0.5 && floor !== "second";
      const arche = great ? "hall" : "chamber";
      const room = { id: id(`${floor}_s`), floor, name: nameFor(floor, arche), type: "enclosed", archetype: arche, rect: { x0, x1, y0: yS[0], y1: yS[1] } };
      plan.rooms.push(room); return room;
    });
    // north row: broken where the wing corridors come through; stair halls; the service end on the ground
    const northRooms = [];
    const stairAt = [L * 0.3, L * 0.62];                   // two stair halls
    {
      for (const [x0, x1] of NORTH) {
        const isStair = stairAt.some(s => s > x0 && s < x1) && x1 - x0 > 5.2;
        const east = (x0 + x1) / 2 > L * 0.66;
        const arche = isStair ? "stair" : service && east ? "service" : "chamber";
        const room = { id: id(`${floor}_n`), floor, name: isStair ? "Stair Hall" : nameFor(floor, arche), type: isStair ? "corridor" : "enclosed", archetype: arche, rect: { x0, x1, y0: yN[0], y1: yN[1] } };
        plan.rooms.push(room); northRooms.push(room);
      }
    }
    // ---- the wings: west rooms | corridor | east rooms, running north from the main range
    const wings = [];
    for (const [w0, isEast] of [[0, false], [L - DEP, true]]) {
      const xW = [w0 + EXT, w0 + 6.4], xC = [w0 + 6.4 + PART, w0 + 6.4 + PART + COR], xE = [xC[1] + PART, w0 + DEP - EXT];
      const y0 = DEP - EXT + PART, y1 = DEP + WL - EXT;
      const wcor = { id: id(`${floor}_wing`), floor, name: floor === "first" ? "Wing Gallery" : "Wing Passage", type: "corridor", archetype: "corridor", rect: { x0: xC[0], x1: xC[1], y0: yC[1], y1 } };
      plan.rooms.push(wcor);
      plan.openings.push({ id: id("oe"), kind: "open_edge", floor, rect: { x0: xC[0], x1: xC[1], y0: yC[1], y1: yC[1] }, joins: [corridor.id, wcor.id] });
      plan.windows.push({ floor, rect: { x0: xC[0] + 0.35, x1: xC[1] - 0.35, y0: y1, y1: y1 + EXT } });
      for (const [xa, xb, side] of [[xW[0], xW[1], "W"], [xE[0], xE[1], "E"]]) {
        for (const [ya, yb] of WING) {
          const arche = service && isEast ? "service" : "chamber";
          const room = { id: id(`${floor}_w`), floor, name: nameFor(floor, arche), type: "enclosed", archetype: arche, rect: { x0: xa, x1: xb, y0: ya, y1: yb } };
          plan.rooms.push(room); wings.push({ room, side, wcor, w0 });
        }
      }
    }
    // ---- doors: every room onto its corridor at the middle of that wall
    const door = (room, rect, other) => plan.openings.push({ id: id("d"), kind: "door", floor, rect, joins: [room.id, other.id] });
    for (const room of southRooms) { const c = (room.rect.x0 + room.rect.x1) / 2; door(room, { x0: c - DOOR / 2, x1: c + DOOR / 2, y0: yS[1], y1: yC[0] }, corridor); }
    for (const room of northRooms) { const c = (room.rect.x0 + room.rect.x1) / 2 + (room.archetype === "stair" ? -1.6 : 0); door(room, { x0: c - DOOR / 2, x1: c + DOOR / 2, y0: yC[1], y1: yN[0] }, corridor); }
    for (const { room, side, wcor } of wings) {
      const c = (room.rect.y0 + room.rect.y1) / 2;
      const rect = side === "W" ? { x0: room.rect.x1, x1: wcor.rect.x0, y0: c - DOOR / 2, y1: c + DOOR / 2 } : { x0: wcor.rect.x1, x1: room.rect.x0, y0: c - DOOR / 2, y1: c + DOOR / 2 };
      door(room, rect, wcor);
    }
    // an enfilade: some neighbours in the south row open into each other, near the windows
    for (let i = 0; i < southRooms.length - 1; i++) if (r() < 0.55) {
      const a = southRooms[i], b = southRooms[i + 1];
      plan.openings.push({ id: id("d"), kind: "door", floor, rect: { x0: a.rect.x1, x1: b.rect.x0, y0: 2.2, y1: 2.2 + DOOR }, joins: [a.id, b.id] });
    }
    // ---- windows on every outside wall, one to each 3 m of it
    const winAlong = (a, b, make) => { const k = Math.max(1, Math.floor((b - a) / 3)); for (let i = 0; i < k; i++) { const c = a + (b - a) * (i + 0.5) / k; make(c); } };
    for (const room of southRooms) winAlong(room.rect.x0, room.rect.x1, c => plan.windows.push({ floor, rect: { x0: c - 0.7, x1: c + 0.7, y0: 0, y1: EXT } }));
    for (const room of northRooms) {
      const { x0, x1 } = room.rect;
      if (x0 > DEP && x1 < L - DEP) winAlong(x0, x1, c => plan.windows.push({ floor, rect: { x0: c - 0.7, x1: c + 0.7, y0: DEP - EXT, y1: DEP } }));
    }
    for (const { room, side, w0 } of wings) {
      const outer = side === "W" ? w0 === 0 : w0 !== 0;        // the wing's outside face; the other faces the court
      const x = side === "W" ? w0 : w0 + DEP - EXT;
      winAlong(room.rect.y0, room.rect.y1, c => plan.windows.push({ floor, rect: { x0: x, x1: x + EXT, y0: c - 0.7, y1: c + 0.7 } }));
      void outer;
    }
    // ---- hearths: principal rooms and the kitchen, on a wall with nothing else on it where the hearth
    // would stand (no door, no window, a hand clear either side); tried side walls first, then the rest
    const blocks = (room, F, a, b) => [...plan.openings.filter(o => o.floor === floor && o.rect), ...plan.windows.filter(w => w.floor === floor)].some(o => {
      const R = o.rect, q = room.rect, pad = 0.3;
      if (F === "W" && Math.abs(R.x1 - q.x0) < 0.7 && R.x0 < q.x0 + 0.01) return R.y1 > a - pad && R.y0 < b + pad;
      if (F === "E" && Math.abs(R.x0 - q.x1) < 0.7 && R.x1 > q.x1 - 0.01) return R.y1 > a - pad && R.y0 < b + pad;
      if (F === "S" && Math.abs(R.y1 - q.y0) < 0.7 && R.y0 < q.y0 + 0.01) return R.x1 > a - pad && R.x0 < b + pad;
      if (F === "N" && Math.abs(R.y0 - q.y1) < 0.7 && R.y1 > q.y1 - 0.01) return R.x1 > a - pad && R.x0 < b + pad;
      return false;
    });
    for (const room of plan.rooms.filter(q => q.floor === floor && (q.archetype === "hall" || (q.archetype === "chamber" && r() < 0.8) || /Kitchen/.test(q.name)))) {
      const { x0, x1, y0, y1 } = room.rect;
      if (y1 - y0 < 3.6 || x1 - x0 < 3.6) continue;
      const w = room.archetype === "hall" || /Kitchen/.test(room.name) ? 3.0 : 2.2;
      const cy = (y0 + y1) / 2, cx = (x0 + x1) / 2;
      const tries = [
        ["W", { x0, x1: x0 + 0.5, y0: cy - w / 2, y1: cy + w / 2 }, cy - w / 2, cy + w / 2, y1 - y0],
        ["E", { x0: x1 - 0.5, x1, y0: cy - w / 2, y1: cy + w / 2 }, cy - w / 2, cy + w / 2, y1 - y0],
        ["N", { x0: cx - w / 2, x1: cx + w / 2, y0: y1 - 0.5, y1 }, cx - w / 2, cx + w / 2, x1 - x0],
        ["S", { x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + 0.5 }, cx - w / 2, cx + w / 2, x1 - x0],
      ];
      const pick = tries.find(([F, rect, a, b, len]) => len > w + 0.8 && !blocks(room, F, a, b));
      if (pick) plan.fireplaces.push({ floor, room: room.id, rect: pick[1] });
    }
    // ---- writing tables: studies, libraries and chambers, under a window
    for (const room of plan.rooms.filter(q => q.floor === floor && q.archetype === "chamber")) {
      if (r() < 0.45) continue;
      plan.objects.push({ kind: "desk", floor, room: room.id, under: "window" });
    }
  }
  // ---- stairs: ground -> first in the west stair hall, first -> second in the east one
  const halls = (floor) => plan.rooms.filter(q => q.floor === floor && q.archetype === "stair").sort((a, b) => a.rect.x0 - b.rect.x0);
  const pairs = [["ground", "first", 0], ["first", "second", 1]].slice(0, floors - 1);
  for (const [from, to, k] of pairs) {
    const h = halls(from)[k] || halls(from)[0]; if (!h) continue;
    const { x0, x1, y0, y1 } = h.rect, run = 4.8;
    const sx0 = Math.max(x0 + 0.3, x1 - 0.3 - run);
    plan.stairs.push({ id: id("stair"), kind: "straight", treads: 17, from, to, up: "E", rect: { x0: sx0, x1: sx0 + run, y0: y1 - 1.7, y1: y1 - 0.1 }, joins: [h.id, (halls(to).find(q => Math.abs(q.rect.x0 - x0) < 0.01) || h).id] });
  }
  plan.entrance = plan.rooms.find(q => q.archetype === "hall")?.id;
  return plan;
}
