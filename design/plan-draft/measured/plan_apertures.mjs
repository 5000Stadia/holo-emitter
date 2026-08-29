#!/usr/bin/env node
/* The plan's doors and windows on one facing, as rectangles in the DECLARED
 * camera's frame — the TARGETS `mesh_warp.py` pins a painting's own apertures
 * to.
 *
 *     node design/plan-draft/measured/plan_apertures.mjs <plan.json> <room> <F>
 *
 * It owns no geometry. Every rectangle comes back out of
 * `tools/plan-projection.mjs` — `metaForFacing` for the room box and its
 * doors, `windowsForFacing` for the glazing — so this file cannot drift from
 * the projection the scaffold and the renderer already share. `mesh_warp.py`
 * shells out to it because the projection lives in JavaScript and the warp
 * lives in Python, and a second Python implementation of `xAtScale` is exactly
 * the drift row 27 paid for twice.
 *
 * It prints ONE line of JSON and always exits 0 on a facing it cannot derive:
 * `{ok:false, why}` is a fact about the plan, and the caller says what to do
 * about it.
 */
import { readFileSync } from "fs";
import * as P from "../../../tools/plan-projection.mjs";

const [planPath, room, facing] = process.argv.slice(2);
if (!planPath || !room || !facing) {
  console.error("usage: plan_apertures.mjs <plan.json> <room> <facing>");
  process.exit(2);
}

let plan;
try {
  plan = JSON.parse(readFileSync(planPath, "utf8"));
} catch (e) {
  console.log(JSON.stringify({ ok: false, why: "plan unreadable: " + String(e.message || e) }));
  process.exit(0);
}

let meta;
try {
  meta = P.metaForFacing(plan, room, facing);
} catch (e) {
  console.log(JSON.stringify({ ok: false, why: String(e.message || e) }));
  process.exit(0);
}

let windows = [];
let windowsWhy = null;
try {
  windows = P.windowsForFacing(plan, room, facing, meta) || [];
} catch (e) {
  windowsWhy = String(e.message || e);
}

/* Doors only. `meta.openings` also carries THRESHOLDS (the floor strip a
 * doorway lays down), which are not apertures in the wall plane and have no
 * counterpart in what `door_measure.py` reads off a painting. */
const openings = (meta.openings || []).filter((o) => o.kind === "door");

console.log(JSON.stringify({
  ok: true,
  meta: {
    corner_x0_px: meta.corner_x0_px,
    corner_x1_px: meta.corner_x1_px,
    floor_line_y: meta.floor_line_y,
    horizon_y: meta.horizon_y,
    image_h_px: meta.image_h_px,
    px_per_m_at_wall: meta.px_per_m_at_wall,
    storey_height_m: meta.storey_height_m,
    wall_width_m: meta.wall_width_m,
    facing_type: meta.facing_type
  },
  openings,
  windows,
  windows_why: windowsWhy
}));
