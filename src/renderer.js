/* renderer.js — pure draw (blueprint §7).
 *
 * render(target, world, staging, library, backdrops, viewstate, options) -> target
 *
 * Pure: inputs only, no module state, no Date/Math.random/global reads; draws
 * onto the passed canvas and returns it. Equal inputs paint equal pixels.
 * (One licensed exception: hitTest's 1x1 sample scratch — hit reads are not
 * rendering and carry no determinism duty; see sampleAlpha.)
 *
 * Row 1 drew §7 step 1 only — the backdrop layer. `backdrops` maps
 * "location/facing" -> { image, meta }; a facing with no backdrop entry takes
 * the procedural holodeck grid, the §7 product mode for unestablished space
 * (in-fiction and literal; real backdrops later occlude it, never delete it).
 * Row 2 adds steps 2–6: entities, parts at state-interpolated offsets,
 * swap-state bodies, per-entity tint, contact shadows, cavity clipping —
 * placement math flowing exclusively through groundplane.js (never
 * re-derived), plus the pure `layout` and the `hitTest` walk.
 *
 * Meta flows as data: the render resolves meta = backdrops[key]?.meta ??
 * GRID_META and both the grid and entity math draw from that resolved
 * object, never from inline literals.
 */
(function () {
  "use strict";

  /* Canonical grid meta (§7 grid mode / §5 shape). key_tint is deliberately
   * non-identity so §12.8's tint assertion is satisfiable on grid backdrops.
   * Tests assert against literals, never against this constant (§12.5's
   * independence rule, applied early).
   *
   * `px_per_m_at_bottom` is 332.8, not §5's example 210. The grid is a
   * backdrop we synthesize rather than measure, so its meta has to be
   * self-consistent, and §5 states the same floor twice: once as the scale
   * lerp between (floor_line_y, px_per_m_at_wall) and (bottom of frame,
   * px_per_m_at_bottom), and once as the horizon device, y = horizon_y·H +
   * 1.6·scale, which is what makes `horizon_y` mean "the horizon at eye
   * height 1.6 m". Both are linear in (y, scale) and both already pass
   * through (645.12, 96); the second fixes the other end at
   * (1024, (1024 − 0.48·1024)/1.6) = (1024, 332.8). At 210 the two disagreed
   * and the lerp won: every floor object's feet were drawn further down the
   * frame than its own eye height allows — the desk 31 px low, the chair 86 —
   * so scale said one depth while the ground said another, and §12.5 could
   * not see it because both sides of a height check use the scale. At 332.8
   * the lerp IS the horizon device and the two agree exactly, everywhere. The
   * nearest floor in frame moves from 1.9 m in front of the viewer to 1.01 m:
   * the frame bottom cuts the floor near your own feet, which is what the
   * camera-has-feet quality asks for.
   *
   * [AI] amending an [AI] adoption — §7's grid-canonical list took §5's
   * EXAMPLE values wholesale; §5's own block is Kabe's illustration of the
   * schema and is untouched, to be measured per backdrop at row 4. The wider
   * incoherence in those example numbers (16 m of wall in frame against
   * `wall_width_m` 4.2, a 133° field against §10's 50 mm) is [HUMAN] and
   * stands open in blueprint §5 as a question for Kabe.
   *
   * `wall_width_m` is 16.0, not §5's example 4.2, for the same reason: the
   * grid draws 1536 px of wall at 96 px/m, so the wall in frame IS 16 m and
   * saying 4.2 made the meta contradict its own picture. Staging reads
   * `u ∈ [0,1]` as "across the facing's wall width" (§4), so at 4.2 the whole
   * document could only address the central 403 px of a 1536 px frame — 26%
   * of every facing was unreachable, and no check could see it because both
   * sides of every §12.5 assertion read the same meta. `px_per_m_at_wall ×
   * wall_width_m ≈ canvas width` is now asserted independently, so a meta
   * that is self-consistent and still wrong about the frame fails; row 4's
   * eight measured metas inherit that gate. The staged `u` values move with
   * it (§4's own license), each keeping its metre offset from the wall
   * centre, so the room is composed exactly as before.
   *
   * What this does NOT settle, and is Kabe's: 16 m of wall at 3.5 m is a
   * ~133° view, against §10's `focal_mm: 50` (≈40°). Blueprint §5 carries the
   * question in full — it needs answering before row 4 authors real meta,
   * because the answer decides every backdrop prompt.
   *
   * calibration_ref/_px are §5-required fields: the grid's own metre lines
   * on the wall are its known-height feature, so its meta can be audited
   * against its pixels like any other. */
  var GRID_META = {
    floor_line_y: 0.63,
    px_per_m_at_wall: 96,
    px_per_m_at_bottom: 332.8,
    wall_width_m: 16,
    key_tint: "#c8b489",
    image_h_px: 1024,
    horizon_y: 0.48,
    key_dir: "UL",
    calibration_ref: "wall grid module, 1.0 m at the wall plane",
    calibration_px: 96
  };

  /* Grid-drawing constants. The former GRID_K = 336 px·m is now derived in
   * drawGrid — meta.px_per_m_at_wall × camera_wall_m (the plan-§2 amendment:
   * GRID_K was always px_per_m_at_wall × 3.5 implicitly; deriving it keeps
   * grid transverse lines and entity depth math agreeing from one home,
   * groundplane.js). Identical value (96 × 3.5 = 336) on grid canonical
   * meta — same pixels as row 1. Colours and alphas are pinned: lines stroke
   * in key_tint at 0.25 (minor) / 0.55 (major); glyph strokes at 0.9. */
  var WALL_BASE = "#10141b";
  /* The floor carries enough luminance for a contact shadow to take some of
   * it away. At the old #0b0e13 the brightest pixel on the floor was 19/255,
   * so a pool at 0.35 alpha could darken it by at most 6 — "every grounded
   * object darkens the ground under it" was true of the code and invisible
   * in the picture, and grid mode is a product mode (§7), not placeholder
   * art. Still darker than the wall: unestablished space, lit from nowhere. */
  var FLOOR_BASE = "#1e242e";
  var ALPHA_MINOR = 0.25;
  var ALPHA_MAJOR = 0.55;
  var ALPHA_GLYPH = 0.45;

  /* Entity-pass constants (§7 steps 5–6). One tint constant for M0; the
   * shadow peaks at 0.35 and fades to nothing (plan §3). */
  var TINT_ALPHA = 0.18;
  var SHADOW_PEAK = 0.35;
  /* ry = SHADOW_RY × rx, but never thinner than SHADOW_MIN_RY. "Contact" is
   * a named quality — every grounded object darkens the ground under it, a
   * pool at the contact point — and a pure ratio gives a small object a
   * two-pixel hairline whose upper half hides behind its own feet. The
   * candlestick's footprint is 0.16 m: at the old 0.18 ratio its whole
   * shadow was 3 px tall. Width stays exactly §7's footprint span. */
  var SHADOW_RY = 0.3;
  var SHADOW_MIN_RY = 4;
  /* A contact pool thrown by a key light from upper-left (contract UL45)
   * falls down and to the right. A pool centred exactly under the base is a
   * one-light tell that reads as a sticker the moment row 4's lit backdrops
   * arrive — and, at V1, centring it hides its darkest part behind the
   * object's own feet, which is most of why contact is hard to see on the
   * grid. Fractions of rx, so it scales with the object. */
  var SHADOW_DX = 0.22;
  var SHADOW_DY = 0.35;

  /* The pinned §5 viewport width. layout takes no canvas (it is placement,
   * not paint), so the u-mapping's canvasW is this constant — the same
   * 1536×1024 logical canvas everything else pins. */
  var CANVAS_W = 1536;

  /* Resolve the ground-plane module (browser classic script or Node). All
   * placement math flows through it — never re-derived here (§12.8). */
  function groundplane() {
    return (typeof window !== "undefined" && window.HOLO && window.HOLO.groundplane)
      ? window.HOLO.groundplane : require("./groundplane.js");
  }

  /* Snap a coordinate to the half-integer centre of the pixel row/column
   * containing it, so 1px strokes fill exact pixel rows — crisp and
   * rasteriser-independent. Grid strokes only; entity math never snaps. */
  function snap(v) { return Math.floor(v) + 0.5; }

  /* Facing glyph letterforms: stroked polylines in a unit box (x right,
   * y down), never fillText — font rasterisation varies across platforms and
   * would make hash tests environment-fragile. Each entry is a list of
   * polylines. */
  var GLYPHS = {
    N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
    E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.75, 0.5]]],
    S: [[[1, 0], [0, 0], [0, 0.5], [1, 0.5], [1, 1], [0, 1]]],
    W: [[[0, 0], [0.25, 1], [0.5, 0.35], [0.75, 1], [1, 0]]]
  };

  function strokePolylines(ctx, polylines, x0, y0, w, h) {
    ctx.beginPath();
    for (var i = 0; i < polylines.length; i++) {
      var line = polylines[i];
      for (var j = 0; j < line.length; j++) {
        var x = x0 + line[j][0] * w;
        var y = y0 + line[j][1] * h;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  function drawGrid(ctx, meta, facing, W, H, openings) {
    var gp = groundplane();
    var floorY = meta.floor_line_y * meta.image_h_px;
    var eyeY = meta.horizon_y * meta.image_h_px;
    var sWall = meta.px_per_m_at_wall;
    var sBottom = meta.px_per_m_at_bottom;
    var cx = W / 2; // centre-by-default; a measured wall origin arrives with real meta
    /* Derived grid constant (was the literal 336): px_per_m_at_wall × the
     * camera-to-wall distance, the same number scaleAtDepth divides by —
     * grid canonical meta yields exactly 336, so row 1's pixels stand. */
    var gridK = meta.px_per_m_at_wall *
      (meta.camera_wall_m != null ? meta.camera_wall_m : gp.CAMERA_WALL_M);

    // Bases.
    ctx.fillStyle = WALL_BASE;
    ctx.fillRect(0, 0, W, Math.ceil(floorY));
    ctx.fillStyle = FLOOR_BASE;
    ctx.fillRect(0, Math.ceil(floorY), W, H - Math.ceil(floorY));

    ctx.lineWidth = 1;
    ctx.strokeStyle = meta.key_tint;

    // Wall verticals: every metre at wall scale, centred on cx, full width.
    ctx.globalAlpha = ALPHA_MINOR;
    var m;
    for (m = Math.ceil(-cx / sWall); cx + m * sWall <= W; m++) {
      var vx = snap(cx + m * sWall);
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, snap(floorY));
      ctx.stroke();
    }
    // Wall horizontals: every metre up from the floor line.
    for (m = 1; floorY - m * sWall >= 0; m++) {
      var hy = snap(floorY - m * sWall);
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(W, hy);
      ctx.stroke();
    }

    // Floor longitudinals: fan from wall x = cx + m*sWall to bottom
    // x = cx + m*sBottom, for every metre line that can intersect the frame.
    var span = Math.ceil(Math.max(cx, W - cx) / sWall) + 1;
    for (m = -span; m <= span; m++) {
      ctx.beginPath();
      ctx.moveTo(snap(cx + m * sWall), snap(floorY));
      ctx.lineTo(snap(cx + m * sBottom), H);
      ctx.stroke();
    }
    // Floor transverse lines at 0.5m depth steps, depth -> scale = K/d ->
    // screen-y through the same ground-plane function entities use.
    var dWall = gridK / sWall;
    var dBottom = gridK / sBottom;
    for (var d = Math.ceil(dBottom / 0.5) * 0.5; d < dWall; d += 0.5) {
      if (d <= dBottom) continue;
      var ty = snap(gp.yAtScale(gridK / d, meta));
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(W, ty);
      ctx.stroke();
    }

    // Majors: the floor line and the eye line (horizon_y — 1.6m above the
    // floor line at wall scale: the camera-has-feet statement, in-fiction).
    ctx.globalAlpha = ALPHA_MAJOR;
    ctx.beginPath();
    ctx.moveTo(0, snap(floorY));
    ctx.lineTo(W, snap(floorY));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, snap(eyeY));
    ctx.lineTo(W, snap(eyeY));
    ctx.stroke();

    // Facing glyph: in-fiction signage, 1m tall at wall scale, centred on
    // the wall at the eye line. Carries facing only — rooms may legitimately
    // render identical until entities arrive.
    var glyph = GLYPHS[facing];
    if (glyph) {
      // 1.5 m tall at wall scale. On a bare facing the glyph is the ONLY
      // thing that changes when you turn, and at 1 m it was one small
      // letterform — 0.03% of the frame, which on a phone is no response at
      // all to pressing an arrow key. Larger than this and it crowds the
      // furniture standing in front of it.
      var gh = sWall * 1.5;
      var gw = gh * (2 / 3);
      var gx = cx - gw / 2;
      var gy = eyeY - gh / 2;
      /* Stand the glyph clear of any doorway. Centred on the wall it landed
       * inside the opening (and behind the shut leaf), which is where the
       * two door facings became the same picture: study/E and hall/W are
       * both a wall, a door and nothing else, and the one mark that says
       * which way you are looking was painted over. §7 gives the glyph the
       * job of making facings visually distinct. */
      if (openings) {
        for (var oi = 0; oi < openings.length; oi++) {
          var o = openings[oi];
          if (gx < o.x + o.w && gx + gw > o.x && gy < o.y + o.h && gy + gh > o.y) {
            var toLeft = o.x - gw - sWall * 0.5;
            var toRight = o.x + o.w + sWall * 0.5;
            gx = (toLeft >= sWall * 0.25) ? toLeft : toRight;
          }
        }
      }
      ctx.globalAlpha = ALPHA_GLYPH;
      // Weight, not shout: the glyph has to answer an arrow key on a bare
      // wall, and it must not be the most legible object in a room. Alpha
      // carries the second half — the pixel count that makes a turn visible
      // does not depend on how loud they are.
      // Stroke weight scales with the glyph so the mark carries real ink:
      // at 3 px on a 1 m letterform, turning between two bare facings
      // changed 426 pixels of 1.5 M — no visible response to an arrow key.
      ctx.lineWidth = Math.max(3, Math.round(gh / 18));
      strokePolylines(ctx, glyph, gx, gy, gw, gh);
      ctx.lineWidth = 1;
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ */
  /* Doorways                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * apertures(world, staging, library, meta, viewstate) -> [ { exit, via,
   * x, y, w, h } ] — the wall opening of every exit the player is facing,
   * in scene px, derived from the document (`locations[].exits`) and the
   * leaf's own §4 wall placement. Never from coordinates in truth.
   *
   * A doorway exists whether or not its leaf is shut, so the opening is
   * drawn for every exit on the facing and the closed leaf occludes it
   * exactly. §11 gives real backdrops a painted door frame/opening; grid
   * mode is the stand-in for unestablished space and must not show a
   * plank vanishing from unbroken wall — nor leave `go` with no target
   * but the edge-on sliver of an opened leaf.
   *
   * KNOWLEDGE-FILTERED, like every other read of the world: the opening is
   * derived from the leaf's placement and its record, so a door outside
   * `knowledge.player` must leave no opening either. "The renderer never
   * reads unknown entities" is categorical in the intention, and an
   * unfiltered doorway would draw the shape of a thing the player has not
   * been told about.
   */
  function apertures(world, staging, library, meta, viewstate) {
    var gp = groundplane();
    var facingKey = viewstate.location + "/" + viewstate.facing;
    var known = {};
    var players = (world.knowledge && world.knowledge.player) || [];
    for (var k = 0; k < players.length; k++) known[players[k]] = true;
    var out = [];
    for (var l = 0; l < world.locations.length; l++) {
      var loc = world.locations[l];
      if (loc.id !== viewstate.location) continue;
      var exits = loc.exits || [];
      for (var x = 0; x < exits.length; x++) {
        var exit = exits[x];
        if (exit.facing !== viewstate.facing) continue;
        if (!known[exit.via]) continue;
        var placement = (staging.placements || {})[exit.via];
        if (!placement) continue;
        var list = (Object.prototype.toString.call(placement) === "[object Array]")
          ? placement : [placement];
        var fp = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].facing === facingKey) { fp = list[i]; break; }
        }
        if (!fp) continue;
        var entity = null;
        for (var e = 0; e < world.entities.length; e++) {
          if (world.entities[e].id === exit.via) { entity = world.entities[e]; break; }
        }
        var lib = entity ? library[entity.sprite] : null;
        if (!lib) continue;
        var place = gp.placeHost(fp, lib.record, meta, CANVAS_W);
        if (!place) continue;
        out.push({
          exit: exit.id,
          via: exit.via,
          x: place.x0,
          y: place.y0,
          w: place.x1 - place.x0,
          h: place.y1 - place.y0
        });
      }
    }
    return out;
  }

  /* The opening shows the space beyond, not a panel painted on the wall.
   * A flat fill with a jamb read as a framed dark picture hung where the
   * doorway is — the flattest thing in the frame, and the one place the
   * two-room premise most needs depth. So the far room's own ground plane
   * continues through it: its wall darkens with distance, its floor line
   * sits a little above this room's (the far wall is further away), and the
   * grid's transverse lines carry on across the gap. All of it is derived
   * from the same meta the grid is drawn from — grid mode only; a real
   * backdrop paints its own opening (blueprint §11 requires the painted one
   * to coincide with the leaf's placement rectangle, which is what the page
   * uses as the way-through target). */
  var BEYOND_WALL = "#080b10";
  var BEYOND_FLOOR = "#141922";

  function drawApertures(ctx, list, meta) {
    var floorY = meta.floor_line_y * meta.image_h_px;
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(a.x, a.y, a.w, a.h);
      ctx.clip();
      // The far room, one room deeper: its floor line rides higher.
      var beyondFloorY = floorY - (floorY - meta.horizon_y * meta.image_h_px) * 0.45;
      ctx.fillStyle = BEYOND_WALL;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.fillStyle = BEYOND_FLOOR;
      ctx.fillRect(a.x, beyondFloorY, a.w, a.y + a.h - beyondFloorY);
      // Its floor picked out by the same transverse device the grid uses.
      ctx.globalAlpha = ALPHA_MINOR;
      ctx.strokeStyle = meta.key_tint;
      ctx.lineWidth = 1;
      for (var k = 1; k <= 3; k++) {
        var ty = snap(beyondFloorY + (a.y + a.h - beyondFloorY) * (k / 4) * (k / 4));
        ctx.beginPath();
        ctx.moveTo(a.x, ty);
        ctx.lineTo(a.x + a.w, ty);
        ctx.stroke();
      }
      ctx.globalAlpha = ALPHA_MAJOR;
      ctx.beginPath();
      ctx.moveTo(a.x, snap(beyondFloorY));
      ctx.lineTo(a.x + a.w, snap(beyondFloorY));
      ctx.stroke();
      ctx.restore();
      // The jamb.
      ctx.save();
      ctx.globalAlpha = ALPHA_MAJOR;
      ctx.strokeStyle = meta.key_tint;
      ctx.lineWidth = 2;
      ctx.strokeRect(snap(a.x), snap(a.y), Math.round(a.w), Math.round(a.h));
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Layout (§7 steps 2–3 + §2 placement math) — pure, no options: what   */
  /* stands where can never branch on a debug switch.                     */
  /* ------------------------------------------------------------------ */

  /* LAYOUT ENTRY SHAPE — the one structure render, hitTest, and the
   * index.html bootstrap (hover/click) all consume. layout() returns a flat
   * ARRAY of these, in draw order (back-to-front: hosts sorted by baselineY
   * ascending, ties by id; each host's anchor_on children follow it
   * immediately — after the host's parts, which draw inside the host's own
   * composite — sorted by child id):
   *
   * {
   *   id:        entity id (string)
   *   kind:      "host" | "child"
   *   hostId:    hosting entity id for children, null for hosts
   *   record:    the §6 sprite record (reference, never copied)
   *   images:    library[record-sprite].images (body/parts/states/thumb)
   *   f:         sprite-px -> scene-px factor (heightPx / record.px.h)
   *   drawX/Y:   scene coords of the BODY image's top-left (the body frame;
   *              swap-state images and parts offset from it via record data)
   *   baseX:     scene x where anchors.base lands (closed shadow centre)
   *   baselineY: scene y of the base contact line (hosts: ground-plane
   *              baseline, the sort key; children: the host-surface point)
   *   state:     the entity's current state, or null when stateless
   *   swap:      null, or — for swap archetypes in a non-closed state —
   *              { state, image, origin: {x,y}, extent: {x0,x1} }
   *              (origin/extent in body pixel space, per the plan-§1 swap
   *              contract; the closed state IS the body image and never
   *              appears here)
   *   parts:     [ { id, image, origin, slide, t } ] — one per record part,
   *              t already state-derived (part.states[state], else 0);
   *              render may override t via options, hitTest never does
   *   clip:      null, or { x, y, w, h } scene-coords rect — the host's
   *              transformed drawer_cavity, applied to the child's shadow,
   *              body and tint blits alike, and honoured by hitTest
   * }
   */
  function layout(world, staging, library, meta, viewstate) {
    var gp = groundplane();
    var facingKey = viewstate.location + "/" + viewstate.facing;

    var known = {};
    var players = (world.knowledge && world.knowledge.player) || [];
    for (var i = 0; i < players.length; i++) known[players[i]] = true;

    var held = {};   // entity id -> true when held by the player
    var inHost = {}; // child id -> host id for ["in", child, host]
    var rels = world.relations || [];
    for (i = 0; i < rels.length; i++) {
      var rel = rels[i];
      if (rel[0] === "held_by" && rel[2] === "player") held[rel[1]] = true;
      if (rel[0] === "in") inHost[rel[1]] = rel[2];
    }

    var entities = {};
    for (i = 0; i < world.entities.length; i++) entities[world.entities[i].id] = world.entities[i];

    function libFor(entity) {
      var lib = library[entity.sprite];
      if (!lib) {
        throw new Error("no library record for sprite \"" + entity.sprite +
          "\" (entity " + entity.id + ")");
      }
      return lib;
    }

    function stateParts(record, state) {
      var out = [];
      var parts = record.parts || [];
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        var t = (state != null && part.states && part.states[state] != null)
          ? part.states[state] : 0;
        out.push({ id: part.id, origin: part.origin, slide: part.slide, t: t });
      }
      return out;
    }

    /* Collect direct (host) placements on this facing and anchor_on
     * placements (children ride their host's facing). */
    var hosts = [];
    var childPlacements = []; // { entity, hostId, regionName, t }
    var placements = staging.placements || {};
    for (i = 0; i < world.entities.length; i++) {
      var entity = world.entities[i];
      if (!known[entity.id]) continue;      // knowledge filter — unknown is absent
      if (held[entity.id]) continue;        // held by the player — off the scene
      var placement = placements[entity.id];
      if (!placement) continue;
      if (placement.anchor_on) {
        var dot = placement.anchor_on.indexOf(".");
        childPlacements.push({
          entity: entity,
          hostId: placement.anchor_on.slice(0, dot),
          regionName: placement.anchor_on.slice(dot + 1),
          t: placement.t
        });
        continue;
      }
      var facingPlacement = null;
      if (Object.prototype.toString.call(placement) === "[object Array]") {
        for (var a = 0; a < placement.length; a++) {
          if (placement[a].facing === facingKey) { facingPlacement = placement[a]; break; }
        }
      } else if (placement.facing === facingKey) {
        facingPlacement = placement;
      }
      if (!facingPlacement) continue;

      var lib = libFor(entity);
      var record = lib.record;

      /* Placement through groundplane.placeHost — the one home shared with
       * the fixture validator's static overlap check (never re-derived on
       * either side). */
      var place = gp.placeHost(facingPlacement, record, meta, CANVAS_W);
      if (!place) {
        throw new Error("unknown attachment \"" + facingPlacement.attachment +
          "\" staging entity " + entity.id);
      }
      var baselineY = place.baselineY;
      var f = place.f;
      var baseX = place.baseX;
      var state = (entity.state != null) ? entity.state : null;

      var swap = null;
      if (state != null && state !== "closed" &&
          record.states_images && record.states_images[state]) {
        // Whole-image swap (§7): the closed state IS the body image — the
        // record carries only non-closed states; never index states["closed"].
        swap = {
          state: state,
          image: lib.images.states[state].image,
          origin: record.states_images[state].origin,
          extent: lib.images.states[state].extent
        };
      }

      hosts.push({
        id: entity.id,
        kind: "host",
        hostId: null,
        record: record,
        images: lib.images,
        f: f,
        drawX: place.drawX,
        drawY: place.drawY,
        baseX: baseX,
        baselineY: baselineY,
        state: state,
        swap: swap,
        parts: stateParts(record, state),
        clip: null
      });
    }

    // Farther first; ties break by entity id (determinism).
    hosts.sort(function (a, b) {
      if (a.baselineY !== b.baselineY) return a.baselineY - b.baselineY;
      return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
    });

    // Children draw immediately after their host (after the host's parts,
    // which live inside the host's composite), sorted by id.
    childPlacements.sort(function (a, b) {
      return a.entity.id < b.entity.id ? -1 : (a.entity.id > b.entity.id ? 1 : 0);
    });

    /* Children ride their host's facing — and a child may itself host a
     * child (`anchor_on` chains). The harness's reachability walk already
     * recurses through the chain, so the renderer must too: a two-hop child
     * the renderer dropped while the harness let you take it is the picture
     * lying about the document. Chains are walked depth-first from each
     * directly-staged host; a cycle cannot repeat because every entity is
     * emitted at most once. */
    var out = [];
    for (i = 0; i < hosts.length; i++) {
      appendWithChildren(hosts[i]);
    }
    return out;

    function appendWithChildren(host) {
      out.push(host);
      var placed = {};
      for (var q = 0; q < out.length; q++) placed[out[q].id] = true;
      for (var c = 0; c < childPlacements.length; c++) {
        var cp = childPlacements[c];
        if (cp.hostId !== host.id) continue;
        if (placed[cp.entity.id]) continue;
        var hostEntity = entities[host.id];

        // "in"-contained children draw only when the host stands open (the
        // knowledge half of the reveal is already filtered above); they are
        // clipped to the host's transformed anchor region — the SAME region
        // the placement names, never a hardcoded `drawer_cavity` (a fixture
        // may anchor contents in any region the record declares; clipping to
        // a different one silently erased the child, or threw, on any host
        // without that exact anchor).
        var contained = inHost[cp.entity.id] != null;
        if (contained && hostEntity.state !== "open") continue;

        var childLib = libFor(cp.entity);
        var childRecord = childLib.record;
        var region = host.record.anchors[cp.regionName];
        if (!region) {
          throw new Error("no anchor region \"" + cp.regionName + "\" on " +
            host.record.id + " (staging " + cp.entity.id + ")");
        }
        var t = cp.t;
        // Diagonal lerp along the host anchor region, in host body px.
        var ax = region.x0 + t * (region.x1 - region.x0);
        var ay = region.y0 + t * (region.y1 - region.y0);
        var bx = host.drawX + host.f * ax;
        var by = host.drawY + host.f * ay;
        // Child scale derives from the HOST's baseline ground scale.
        var childHeightPx = childRecord.dims_m.h * gp.scaleAtY(host.baselineY, meta);
        var childF = childHeightPx / childRecord.px.h;

        var clip = null;
        if (contained) {
          clip = {
            x: host.drawX + host.f * region.x0,
            y: host.drawY + host.f * region.y0,
            w: host.f * (region.x1 - region.x0),
            h: host.f * (region.y1 - region.y0)
          };
        }

        var childState = (cp.entity.state != null) ? cp.entity.state : null;
        var childEntry = {
          id: cp.entity.id,
          kind: "child",
          hostId: host.id,
          record: childRecord,
          images: childLib.images,
          f: childF,
          drawX: bx - childF * childRecord.anchors.base.x,
          drawY: by - childF * childRecord.anchors.base.y,
          baseX: bx,
          baselineY: by,
          state: childState,
          swap: null, // no swap archetype anchors on a host in M0; closed-body rule holds
          parts: stateParts(childRecord, childState),
          clip: clip
        };
        // Recurse: this child may itself host anchored children.
        appendWithChildren(childEntry);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render (§7 steps 1–6)                                               */
  /* ------------------------------------------------------------------ */

  function makeCanvas(doc, w, h) {
    var c = doc.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function applyClip(ctx, clip) {
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
  }

  /* Contact shadow (§7 step 6 / plan §3): radial-gradient ellipse, peak
   * SHADOW_PEAK at centre fading to 0, ry = SHADOW_RY × rx. Drawn directly
   * on the scene — the shadow is never tinted. */
  function drawShadow(ctx, cx, cy, rx) {
    if (!(rx > 0)) return;
    // ry: the ratio, floored so a small footprint still gets a pool, and
    // capped at rx so a tiny one does not become a vertical smear.
    var ryF = Math.min(1, Math.max(SHADOW_RY, SHADOW_MIN_RY / rx));
    ctx.save();
    ctx.translate(cx + SHADOW_DX * rx, cy + SHADOW_DY * rx * ryF);
    ctx.scale(1, ryF);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(0,0,0," + SHADOW_PEAK + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Effective part transform for a given t: draw position offsets by slide
   * fractions of the BODY's pixel dims; size lerps to scale_open. Shared by
   * render (options-resolved t) and hitTest (state-derived t). */
  function partPlacement(entry, part, t) {
    var image = entry.images.parts[part.id];
    return {
      image: image,
      x: entry.drawX + entry.f * (part.origin.x + t * part.slide.dx * entry.record.px.w),
      y: entry.drawY + entry.f * (part.origin.y + t * part.slide.dy * entry.record.px.h),
      k: entry.f * (1 + t * (part.slide.scale_open - 1))
    };
  }

  /**
   * stamp(ctx, entry, options) — draw one layout entry's own pixels (body or
   * swap-state image, then parts at their interpolated offsets) with no
   * tint, no shadow and no clip. The render's composite step and the page's
   * hover outline both go through it, so the highlight traces exactly the
   * shape that was drawn: a bounding rectangle around the sprite is an
   * editor's selection marquee, not a place you are standing in.
   */
  function stamp(ctx, e, options) {
    options = options || {};
    if (e.swap) {
      ctx.drawImage(e.swap.image,
        e.drawX + e.f * e.swap.origin.x,
        e.drawY + e.f * e.swap.origin.y,
        e.swap.image.width * e.f,
        e.swap.image.height * e.f);
    } else {
      ctx.drawImage(e.images.body,
        e.drawX, e.drawY,
        e.images.body.width * e.f,
        e.images.body.height * e.f);
    }
    for (var p = 0; p < e.parts.length; p++) {
      var part = e.parts[p];
      var t = (options.parts === false) ? 0
        : (options.part_t && options.part_t[e.id] != null)
          ? options.part_t[e.id] : part.t;
      var pp = partPlacement(e, part, t);
      ctx.drawImage(pp.image, pp.x, pp.y,
        pp.image.width * pp.k, pp.image.height * pp.k);
    }
  }

  /**
   * Pure draw: (world, staging, library, backdropMeta, viewstate) -> canvas,
   * §7's tuple completed with a target canvas (a pure function still needs
   * somewhere to draw) and the §7-licensed options argument — every switch a
   * renderer input, so equal inputs still hash equal:
   *   backdrop_only: true — stop after step 1
   *   no_backdrop:   true — skip step 1 (entities composite onto transparency)
   *   shadows: false — skip contact shadows
   *   tint:    false — skip the tint pass
   *   parts:   false — force every part to t = 0
   *   part_t:  { entityId: t } — per-entity part mid-states
   */
  function render(target, world, staging, library, backdrops, viewstate, options) {
    options = options || {};
    var W = target.width;
    var H = target.height;
    var key = viewstate.location + "/" + viewstate.facing;
    var entry = backdrops ? backdrops[key] : null;
    var meta = (entry && entry.meta) ? entry.meta : GRID_META;
    var ctx = target.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // Step 1: backdrop or grid (row 1, unchanged).
    if (!options.no_backdrop) {
      if (entry && entry.image) {
        ctx.drawImage(entry.image, 0, 0, W, H);
      } else {
        // The doorway belongs to the wall, not to the entity pass: it is
        // backdrop content (§11) and so must be inside backdrop_only, or a
        // flip pair would differ by a hole in the wall. The grid takes the
        // openings first so it can stand its facing glyph clear of them.
        var openings = apertures(world, staging, library, meta, viewstate);
        drawGrid(ctx, meta, viewstate.facing, W, H, openings);
        drawApertures(ctx, openings, meta);
      }
    }
    if (options.backdrop_only) return target;

    // Steps 2–3: the draw list (placement never branches on options).
    var list = layout(world, staging, library, meta, viewstate);
    if (list.length === 0) return target;

    var doc = target.ownerDocument ||
      (typeof document !== "undefined" ? document : null);

    for (var i = 0; i < list.length; i++) {
      var e = list[i];

      // (a) Contact shadow — on the scene, before (so under) the composite,
      // never tinted; clipped when the entry is (a cavity content's shadow
      // must not escape the cavity either).
      if (options.shadows !== false && !e.record.airborne) {
        var cx, rx;
        if (e.swap) {
          // Non-closed swap state: shadow under the DRAWN extent, not the
          // closed footprint (a full-width shadow under an edge-on sliver
          // is the lie this rule exists to prevent).
          cx = e.drawX + e.f * (e.swap.extent.x0 + e.swap.extent.x1) / 2;
          rx = e.f * (e.swap.extent.x1 - e.swap.extent.x0) / 2;
        } else {
          cx = e.baseX;
          rx = e.f * (e.record.anchors.footprint.x1 - e.record.anchors.footprint.x0) / 2;
        }
        ctx.save();
        if (e.clip) applyClip(ctx, e.clip);
        drawShadow(ctx, cx, e.baselineY, rx);
        ctx.restore();
      }

      // (b) Body composite on a full-size offscreen: body (or swap-state
      // image at its origin offset) plus parts at interpolated offsets.
      var comp = makeCanvas(doc, W, H);
      var cctx = comp.getContext("2d");
      stamp(cctx, e, options);

      // (c) Tint pass on the WHOLE composite (§7 step 6): multiply key_tint
      // at TINT_ALPHA over the drawn pixels, restore the composite's own
      // alpha with destination-in — an untinted drawer face on a tinted
      // desk is exactly the divergence one composite prevents.
      var out = comp;
      if (options.tint !== false) {
        var tinted = makeCanvas(doc, W, H);
        var tctx = tinted.getContext("2d");
        tctx.drawImage(comp, 0, 0);
        tctx.globalCompositeOperation = "multiply";
        tctx.globalAlpha = TINT_ALPHA;
        tctx.fillStyle = meta.key_tint;
        tctx.fillRect(0, 0, W, H);
        tctx.globalCompositeOperation = "destination-in";
        tctx.globalAlpha = 1;
        tctx.drawImage(comp, 0, 0); // shape alpha from the untinted copy
        out = tinted;
      }

      // Single blit to the scene, clip honoured.
      ctx.save();
      if (e.clip) applyClip(ctx, e.clip);
      ctx.drawImage(out, 0, 0);
      ctx.restore();
    }
    return target;
  }

  /* ------------------------------------------------------------------ */
  /* Hit testing                                                         */
  /* ------------------------------------------------------------------ */

  /* Shared 1x1 sample scratch — hitTest only, never render: hit reads carry
   * no determinism duty (task-licensed cache; keeps sampling allocation-
   * light without reading back whole sprite canvases). */
  var hitScratch = null;

  function sampleAlpha(image, sx, sy) {
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    if (sx < 0 || sy < 0 || sx >= image.width || sy >= image.height) return 0;
    if (!hitScratch) {
      var doc = image.ownerDocument ||
        (typeof document !== "undefined" ? document : null);
      hitScratch = doc.createElement("canvas");
      hitScratch.width = 1;
      hitScratch.height = 1;
    }
    var sctx = hitScratch.getContext("2d", { willReadFrequently: true });
    sctx.clearRect(0, 0, 1, 1);
    sctx.drawImage(image, sx, sy, 1, 1, 0, 0, 1, 1);
    return sctx.getImageData(0, 0, 1, 1).data[3];
  }

  /**
   * hitTest(layoutResult, library, px, py) -> entity id | null.
   *
   * Walks the draw list back-to-front (topmost first) and returns the first
   * entity whose DRAWN pixels have alpha >= 16 at (px, py) — body or swap-
   * state image plus parts at their state-derived offsets; clip rects
   * applied (a clipped-away pixel never hits); contact shadows are NEVER
   * hit regions (the floor in front of the desk is floor, not desk).
   * Bounding boxes alone never decide — every candidate is settled by a
   * pixel read at the inverse transform. `library` is accepted for
   * signature stability; entries carry their image refs already.
   */
  function hitTest(layoutResult, library, px, py) {
    for (var i = layoutResult.length - 1; i >= 0; i--) {
      var e = layoutResult[i];
      if (e.clip && (px < e.clip.x || px >= e.clip.x + e.clip.w ||
                     py < e.clip.y || py >= e.clip.y + e.clip.h)) continue;

      // Parts draw over the body — sample them first, at state-derived t
      // (hitTest takes no options; the settled scene is what is clickable).
      var hit = false;
      for (var p = e.parts.length - 1; p >= 0 && !hit; p--) {
        var pp = partPlacement(e, e.parts[p], e.parts[p].t);
        if (sampleAlpha(pp.image, (px - pp.x) / pp.k, (py - pp.y) / pp.k) >= 16) hit = true;
      }
      if (!hit) {
        if (e.swap) {
          var sx0 = e.drawX + e.f * e.swap.origin.x;
          var sy0 = e.drawY + e.f * e.swap.origin.y;
          if (sampleAlpha(e.swap.image, (px - sx0) / e.f, (py - sy0) / e.f) >= 16) hit = true;
        } else if (sampleAlpha(e.images.body,
            (px - e.drawX) / e.f, (py - e.drawY) / e.f) >= 16) {
          hit = true;
        }
      }
      if (hit) return e.id;
    }
    return null;
  }

  var api = {
    render: render,
    layout: layout,
    apertures: apertures,
    stamp: stamp,
    hitTest: hitTest,
    GRID_META: GRID_META
  };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.renderer = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
