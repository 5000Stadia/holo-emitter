// A place from a scene document (R49; lab/alice/scene-schema.md): the rooms, openings and things a text
// establishes, laid out by rule with no AI. What the text bounds is honoured (a roof her head strikes at nine feet,
// a door fifteen inches high); what it leaves open is chosen here, by rules written down, and listed in
// `plan.chosen` with why, so nothing chosen passes for something the text said. The first scene is Alice's hall
// of doors: one long, low hall with doors all round, all locked; behind a low curtain at one end a little door,
// and a passage not much larger than a rat-hole to a garden seen but not entered.
// planStoryHall(scene, { kinds: { [thingId]: kind } }) -> plan (holo-emitter-plan/0.1), with plan.story: what the
// story layer needs (lamps, the curtain's opening, the things and where each stands)
import { bodyAt } from "../story.js";

// how a shape word reads, where the text gives no number (chosen, after Tenniel's plates and a hall's ordinary
// proportion): a long room three times as long as it is wide
const SHAPE = { long: { W: 4.2, L: 12.6 }, square: { W: 6, L: 6 }, open: { W: 5, L: 8 } };
const HEIGHT = { low: 2.6, high: 4.2, open: 3.2 };
const WALL = 0.75, PART = 0.3,   // WALL: the outer wall, as the carve makes it (src/make/carve.js EXT)
      DOOR = { w: 0.9, h: 2.05 }, DOOR_EVERY = 2.6;

export function planStoryHall(scene, { kinds } = {}) {
  const chosen = [], choose = (what, value, why) => { chosen.push({ what, value, why }); return value; };
  const hallS = scene.rooms.find(r => r.id === "hall") || scene.rooms[0];
  const sh = SHAPE[hallS.shape?.plan] || SHAPE.open;
  // the roof: as the shape word says, but under any bound the text sets (her head strikes it at nine feet)
  const roof = (hallS.bounds || []).filter(b => /ceiling|roof/.test(b.what) && b.max_m).map(b => b.max_m)[0];
  let H = HEIGHT[hallS.shape?.height] || HEIGHT.open;
  if (roof && H > roof - 0.1) H = choose("the hall's height", +(roof - 0.14).toFixed(2), `under the roof the text bounds at ${roof} m (her head strikes it at nine feet)`);
  else choose("the hall's height", H, `"${hallS.shape?.height}": no number in the text`);
  choose("the hall's length and width", [sh.L, sh.W], `"${hallS.shape?.plan}": three times as long as wide; the text gives no number`);
  const plan = { schema: "holo-emitter-plan/0.1", generated: { type: "story-hall", scene: scene.source }, units: "m", north: "+y",
    floors: [{ id: "ground", level: 0, storey_height_m: H }], rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], wells: [], objects: [], required: [], chosen };
  const hall = { id: hallS.id, floor: "ground", name: (hallS.name || "the hall").replace(/^the /, "").toUpperCase(), type: "enclosed", room_type: "story_hall", archetype: "state",
    rect: { x0: 0, x1: sh.L, y0: 0, y1: sh.W } };
  plan.rooms.push(hall);
  // the little door and what lies behind it: the opening the text sizes, at the hall's west end (which end is
  // open in the text: chosen, the far end from where she came in)
  const little = scene.openings.find(o => o.count === 1 && o.in === hall.id && o.size?.height_m);
  const lw = little ? choose("the little door's width", 0.25, "the text gives its height only; Tenniel draws it about two thirds as wide") : 0;
  const cy = sh.W / 2;
  if (little) {
    const passS = scene.rooms.find(r => r.id === little.to);
    const pass = { id: little.to, floor: "ground", name: "PASSAGE", type: "enclosed", room_type: "rat_hole", archetype: "service",
      height_m: choose("the passage's height", 0.45, "\"not much larger than a rat-hole\": a little above the door"),
      rect: { x0: -PART - 2.4, x1: -PART, y0: +(cy - 0.2).toFixed(3), y1: +(cy + 0.2).toFixed(3) } };
    choose("the passage's length and width", [2.4, 0.4], "\"a small passage\": long enough that the garden lies at its end, not at the door");
    if (passS) plan.rooms.push(pass);
    plan.openings.push({ id: little.id, kind: "door", floor: "ground", axis: "EW", T: PART, joins: [hall.id, pass.id], height_m: little.size.height_m,
      rect: { x0: -PART, x1: 0, y0: +(cy - lw / 2).toFixed(3), y1: +(cy + lw / 2).toFixed(3) },
      door: { lock: little.locked ? "locked" : "unlocked", key: kinds?.[little.key] || "key/none" }, hidden_by: little.hidden_by || null,
      latch: choose("the little door locks when it is shut", true, "the text leaves it open, but she needs the key again after leaving the door: \"she found she had forgotten the little golden key\"") });
    // the passage's far end, open on the garden
    const end = scene.openings.find(o => o.in === pass.id);
    const garden = { id: "garden", floor: "ground", name: "GARDEN", type: "open", archetype: "open", room_type: "court", rect: { x0: pass.rect.x0 - WALL - 8, x1: pass.rect.x0 - WALL, y0: cy - 4, y1: cy + 4 } };
    plan.rooms.push(garden);
    // a doorway with no door, as the passage is wide and high (the outdoors first among what it joins: no room hangs a leaf)
    if (end) plan.openings.push({ id: end.id, kind: "door", floor: "ground", axis: "EW", T: WALL, joins: [garden.id, pass.id], height_m: +(pass.height_m - 0.04).toFixed(3),
      rect: { x0: pass.rect.x0 - WALL, x1: pass.rect.x0, y0: pass.rect.y0 + 0.04, y1: pass.rect.y1 - 0.04 } });
  }
  // doors all round: along both long walls and the near end, one every DOOR_EVERY metres, none within a door's
  // width of a corner (how many is open in the text: chosen by the wall's length); each opens on space the text
  // never establishes, and is locked for good (no key in the text opens them)
  const many = scene.openings.find(o => o.count === "many" && o.in === hall.id);
  if (many) {
    const beyond = (id, rect) => { plan.rooms.push({ id, floor: "ground", name: "UNESTABLISHED", type: "open", archetype: "open", room_type: "unestablished", rect }); return id; };
    const north = beyond("beyond_n", { x0: 0, x1: sh.L, y0: sh.W + WALL, y1: sh.W + WALL + 2 }), south = beyond("beyond_s", { x0: 0, x1: sh.L, y0: -WALL - 2, y1: -WALL });
    const east = beyond("beyond_e", { x0: sh.L + WALL, x1: sh.L + WALL + 2, y0: 0, y1: sh.W });
    const n = Math.max(1, Math.floor((sh.L - 2 * DOOR.w) / DOOR_EVERY)), at = (i) => sh.L / 2 + (i - (n - 1) / 2) * DOOR_EVERY;
    choose("how many doors", 2 * n + 1, `"doors all round": one every ${DOOR_EVERY} m along each long wall, and one at the near end`);
    let k = 0; const door = (rect, joins, axis) => plan.openings.push({ id: `${many.id}:${k++}`, kind: "door", floor: "ground", axis, T: WALL, joins, rect, door: { lock: "locked", key: "key/none" } });
    for (let i = 0; i < n; i++) { const x = +at(i).toFixed(3);
      door({ x0: x - DOOR.w / 2, x1: x + DOOR.w / 2, y0: sh.W, y1: sh.W + WALL }, [hall.id, north], "NS");
      door({ x0: x - DOOR.w / 2, x1: x + DOOR.w / 2, y0: -WALL, y1: 0 }, [hall.id, south], "NS"); }
    door({ x0: sh.L, x1: sh.L + WALL, y0: cy - DOOR.w / 2, y1: cy + DOOR.w / 2 }, [hall.id, east], "EW");
  }
  // the things, each by the one relation the text gives it (Inform 7's one parent per thing; WordsEye's senses of
  // "on", "under", "hangs"); a thing standing in a room is placed first among the room's furniture, as required
  const story = { lamps: [], hides: [], later: [], things: [] };
  const byId = new Map(scene.things.map(t => [t.id, t]));
  for (const t of scene.things) {
    const kind = kinds?.[t.id]; if (!kind) continue;
    const rel = t.at?.rel, of = t.at?.of, later = typeof t.exists === "object" ? t.exists.after : null;
    story.things.push({ id: t.id, kind, rel, of, later });
    if (later) { story.later.push({ id: t.id, kind, after: later, rel, of }); continue; }
    if (rel === "hangs" && of === hall.id && scene.openings.some(o => o.hidden_by === t.id)) { story.hides.push({ id: t.id, kind, opening: scene.openings.find(o => o.hidden_by === t.id).id }); continue; }
    if (rel === "hangs" && of === hall.id) { story.lamps.push({ id: t.id, kind }); continue; }
    if (rel === "in" && of === hall.id) plan.required.push({ kind, room: hall.id, place: { anchor: "floor", prefer: [{ centre: true, weight: 1 }] }, story: t.id });
    else if (["on", "under", "in"].includes(rel) && byId.has(of)) {
      const host = kinds[of], slot = rel === "on" ? "top" : rel === "under" ? "under" : "inside";
      plan.required.push({ kind, room: hall.id, in: { kind: host, slot }, story: t.id });
    }
  }
  // the required list in the order things hold each other: a host before what it holds
  plan.required.sort((a, b) => depth(a) - depth(b));
  function depth(e) { let d = 0, k = e; while (k?.in) { d++; k = plan.required.find(q => q.kind === k.in.kind); } return d; }
  // the lamps: a row down the middle (how many is open: one every 2.1 m, clear of the ends)
  if (story.lamps.length) { const nL = Math.floor(sh.L / 2.1); choose("how many lamps", nL, "\"a row of lamps hanging from the roof\": one every 2.1 m down the middle");
    story.lampAt = Array.from({ length: nL }, (_, i) => [+(sh.L / 2 + (i - (nL - 1) / 2) * 2.1).toFixed(3), cy]); }
  // the player's bodies, one a size (the checks walk the place with each), and a claim grid fine enough for the smallest
  const hs = (scene.player?.sizes || []).map(z => typeof z.height_m === "number" ? z.height_m : 1.2);
  plan.bodies = hs.map(h => { const b = bodyAt(h); return { half: b.half, step: Math.max(0.05, b.step), head: b.head, soffit: 0.3 }; });
  plan.claim_cell = Math.min(...hs) < 0.6 ? 0.05 : 0.1;
  plan.story = story; plan.entrance = hall.id;
  return plan;
}
