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

  /* THE UNPLANNED-FACING FALLBACK META (§7 grid mode / §5 shape).
   *
   * Row 11 changed what this constant IS. Until row 11 it was the geometry of
   * every facing the demo drew. Now every facing the overhead plan holds
   * carries its own meta — a MEASURED one where a painted backdrop exists
   * (row 20's eight), the plan's derived one otherwise — and this is what is
   * left: the meta for a facing NO PLAN HOLDS, unestablished space whose
   * extent nobody has drawn.
   *
   * That is why it carries `facing_type: null` and null corners rather than
   * borrowing one of §5's three tokens. A room whose extent is unknown must
   * not claim two corners, so this draws what it has always drawn: one
   * unbounded wall, no corners, no side-wall returns.
   *
   * EVERY NUMBER HERE IS DERIVED, AND ROW 20 IS WHY. The project pins a LENS
   * (f = 1024 px, 24 mm — `groundplane.FOCAL_PX`, bound to §10's
   * `camera.focal_mm`), so `px_per_m_at_wall` is no longer a constant anyone
   * may author: it is `FOCAL_PX / camera_wall_m`. The three inputs are the
   * fallback's own camera distance (4.0 m), the measured drawing eye height
   * (1.183 m) and the measured horizon (526.1 / 1024) — all three named and
   * argued in `src/groundplane.js`. What comes out, and what blueprint §7
   * states as this constant's one written home:
   *
   *     px_per_m_at_wall    1024 / 4.0              = 256
   *     horizon_y           526.1 / 1024            = 0.513770
   *     floor_line_y        horizon_y + eye/4       = 0.809520
   *     px_per_m_at_bottom  (1024 - 526.1) / eye     = 420.879
   *     nearest visible floor  1024 / 420.879       = 2.4330 m
   *
   * `wall_width_m` stays 16.0 and its MEANING changed: it used to be "the wall
   * the frame holds at 96 px/m", which was true only of a pinned scale. Under
   * a pinned lens the frame holds 6.0 m at this distance, so 16.0 m is now
   * deliberately WIDER than the frame — an unbounded wall, so that nothing
   * about a facing nobody has drawn reads as a claim that its wall ends.
   *
   * key_tint is deliberately non-identity so §12.8's tint assertion is
   * satisfiable on grid backdrops. Tests assert against literals, never
   * against this constant (§12.5's independence rule).
   *
   * calibration_ref/_px are §5-required fields: the grid's own metre lines on
   * the wall are its known-height feature, so its meta can be audited against
   * its pixels like any other, and the audit passes on its own arithmetic
   * (256 px for a 1.0 m module at 256 px/m).
   *
   * WHY THE EYE HEIGHT IS 1.183 AND NOT 1.60 OR §10's 1.83. Blueprint §5
   * rules that the geometry is determined by the orientation of the approved
   * image generation; row 11's 1.60 m was named an interim awaiting exactly
   * that measurement; the approved backdrops arrived at row 20 and measure
   * 1.183 m with no pitch, by the ceiling-ramp horizon the Navigator ruled
   * on its 0.3 px residual against a vanishing-point vote's 30 px scatter. §10's contract camera is unchanged and still what
   * backdrops are prompted at — the generator was asked for 1.83 m pitched
   * down and drew 1.183 m level, and that divergence is on the record
   * (`design/plan-draft/measured/`), not corrected by an agent.
   *
   * The lower camera is what returns the intention's fifth quality: the
   * frame-bottom floor cut comes in to 2.23 m, where every 24 mm preview frame
   * this project drew put it at 3.08 m and the fisheye it replaces put it at
   * 1.04 m. */
  var GRID_META = (function () {
    var gp = groundplane();
    var cam = gp.CAMERA_WALL_M;                  // 4.0 m — see groundplane.js
    var px = gp.pxPerMAtWall(cam);               // 1024 / 4.0 = 256
    var eye = gp.DRAWING_EYE_M;                  // 1.183 m, measured
    var hy = gp.HORIZON_Y;                       // 526.1 / 1024 = 0.51377
    return {
      floor_line_y: hy + eye * px / 1024,        // 0.809520
      px_per_m_at_wall: px,                      // 256
      px_per_m_at_bottom: (1024 - hy * 1024) / eye,  // 420.8791
      wall_width_m: 16,
      key_tint: "#c8b489",
      image_h_px: 1024,
      horizon_y: hy,                             // 0.51377
      key_dir: "UL",
      calibration_ref: "wall grid module, 1.0 m at the wall plane",
      calibration_px: px,                        // 256
      camera_wall_m: cam,
      facing_type: null,
      corner_x0_px: null,
      corner_x1_px: null
    };
  })();

  /* Grid-drawing constants. The former GRID_K = 336 px·m is derived in
   * drawGrid — meta.px_per_m_at_wall × camera_wall_m, one home in
   * groundplane.js, so grid transverse lines and entity depth math cannot
   * disagree. Under row 20's pinned lens that product IS the focal length,
   * 1024 px, on every meta the project can produce — the grid constant and
   * the lens turn out to be the same number, which is what "one lens" means
   * expressed in the drawing rather than in the meta. Colours and alphas are
   * pinned: lines stroke in key_tint at 0.25 (minor) / 0.55 (major). */
  var WALL_BASE = "#10141b";
  /* The floor carries enough luminance for a contact shadow to take a
   * VISIBLE amount away, on this floor and not on a stand-in for row 4's.
   * Row 1's #0b0e13 left 19/255 to take, so a pool could darken it by 6; the
   * first correction reached 46 and ~16, still under the 20-level bar the
   * §12.8 magnitude clause sets, which made that bar arithmetically
   * unreachable in the mode the demo ships. At #2c3542 (66 on the brightest
   * channel) and a 0.45 peak the pool clears it with room. "Every grounded
   * object darkens the ground under it" is a named quality and grid mode is
   * a product mode (§7), not placeholder art. Still darker than the wall:
   * unestablished space, lit from nowhere. */
  var FLOOR_BASE = "#2c3542";
  /* [Row 15] A flight's own tone. This was first set BETWEEN the wall it
   * stands off (#10141b) and the floor it stands on (#2c3542), on the reasoning
   * that a staircase should read as fabric in the room rather than as a hole in
   * it. Between two tones 28 levels apart is about eleven levels from each,
   * which is not a separation, and drawn at the 0.55 alpha the fill was
   * inheriting it came out FIVE levels from the wall — invisible, with the
   * wall's grid showing through it.
   *
   * A flight is the one piece of building fabric that stands OFF every plane
   * and in front of them, so it is lighter than both rather than between them:
   * a solid catching the light, in a frame where the planes are unlit space.
   * (74,88,112) is 30 levels above the floor's brightest channel and 58 above
   * the wall's, which survives the frame-wide key falloff at either corner. */
  var STAIR_BASE = "#4a5870";
  /* [Row 25] THE POOL WHERE THE FLIGHT MEETS THE FLOOR — width in px, alpha —
   * widest and faintest first, so three flat strokes make a falloff outward
   * from the contact line. §7's contact rule is written for sprites with a
   * footprint span; a flight's footprint is a RING the projection already
   * carries, so the pool is that ring stroked rather than an ellipse fitted to
   * it. The peak is below the entity pool's 0.45 because a stair's contact runs
   * the length of a stringer rather than pooling under one small base. */
  var CONTACT_STEPS = [[18, 0.10], [11, 0.14], [5, 0.20]];
  /* The near room's own sill line, at the foot of a threshold's mouth: one
     pixel the through-view is not allowed to paint over. */
  var SILL_PX = 2;
  /* The two side-wall returns (row 11). One lighting model with the rest of
   * the frame: a per-plane facing tone, then the frame-wide key falloff over
   * it. With the key at upper-left (`key_dir: "UL"`, and every sprite shaded
   * to match) the LEFT return's visible face turns away from the light and
   * the RIGHT return's turns toward it — so left is darker than the facing
   * wall and right is lighter. Getting this backwards would be a one-light
   * defect in the mode the demo ships, and it is checked rather than trusted:
   * mechanisms.spec asserts the ordering across the three planes and the
   * falloff's own direction WITHIN each of them. */
  var RETURN_LEFT = "#0a0d12";
  var RETURN_RIGHT = "#1a202b";
  var ALPHA_MINOR = 0.25;
  var ALPHA_MAJOR = 0.55;
  var ALPHA_GLYPH = 0.45;
  /* Peak alpha of the grid's own key falloff, at the upper-left corner. */
  var KEY_FALLOFF = 0.13;

  /* Entity-pass constants (§7 steps 5–6). One tint constant for M0; the
   * shadow peaks at 0.35 and fades to nothing (plan §3). */
  var TINT_ALPHA = 0.18;
  var SHADOW_PEAK = 0.45;
  /* ry = SHADOW_RY × rx, but never thinner than SHADOW_MIN_RY. "Contact" is
   * a named quality — every grounded object darkens the ground under it, a
   * pool at the contact point — and a pure ratio gives a small object a
   * two-pixel hairline whose upper half hides behind its own feet. The
   * candlestick's footprint is 0.16 m: at the old 0.18 ratio its whole
   * shadow was 3 px tall. Width stays exactly §7's footprint span. */
  var SHADOW_RY = 0.3;
  var SHADOW_MIN_RY = 4;
  /* rx has a floor for the same reason ry does. The coin's footprint is a
   * 12-px band on a 24-px sprite, which at its drawn scale is under a pixel
   * wide: its whole pool came to FIVE darkened pixels — the hairline the
   * quantitative contact check exists to rule out, passing because nothing
   * floored the width or the area. */
  var SHADOW_MIN_RX = 4;
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

  /* THE FRAME'S OWN KEY FALLOFF, and it is ONE function because two surfaces
   * need it. The grid lays it over the whole frame; the flight — drawn later,
   * over the top of it — takes the same cells clipped to its own body, so the
   * one solid in the room sits in the room's light instead of being uniformly
   * lit across a frame that is not. Same stepped `key_tint` cells on the same
   * integer tiling: the same light, not a second one.
   *
   * `bounds` limits which cells are visited (a flight covers a fifth of the
   * frame at most) without moving a single cell edge, because the boundaries
   * are computed from the frame either way — a second tiling would paint the
   * corduroy the exact-integer rule exists to prevent. */
  var FALLOFF_CELLS_X = 96;
  var FALLOFF_CELLS_Y = 64;
  function keyFalloff(ctx, meta, W, H, bounds) {
    var cellsX = FALLOFF_CELLS_X, cellsY = FALLOFF_CELLS_Y;
    var gx0 = 0, gx1 = cellsX, gy0 = 0, gy1 = cellsY;
    if (bounds) {
      gx0 = Math.max(0, Math.floor((bounds.x0 * cellsX) / W) - 1);
      gx1 = Math.min(cellsX, Math.ceil((bounds.x1 * cellsX) / W) + 1);
      gy0 = Math.max(0, Math.floor((bounds.y0 * cellsY) / H) - 1);
      gy1 = Math.min(cellsY, Math.ceil((bounds.y1 * cellsY) / H) + 1);
    }
    ctx.save();
    ctx.fillStyle = meta.key_tint;
    for (var gx = gx0; gx < gx1; gx++) {
      // Exact integer tiling: cells that overlap by a pixel paint that pixel
      // twice, and a stepped falloff turns into a corduroy of alternating
      // bands 17 luminance levels apart.
      var px0 = Math.round((gx * W) / cellsX);
      var px1 = Math.round(((gx + 1) * W) / cellsX);
      for (var gy = gy0; gy < gy1; gy++) {
        var py0 = Math.round((gy * H) / cellsY);
        var py1 = Math.round(((gy + 1) * H) / cellsY);
        var tf = (gx / (cellsX - 1) + gy / (cellsY - 1)) / 2; // 0 at upper-left
        ctx.globalAlpha = KEY_FALLOFF * (1 - tf);
        ctx.fillRect(px0, py0, px1 - px0, py1 - py0);
      }
    }
    ctx.restore();
  }

  /* WHERE THE KEY IS, read off the facing's own meta and never assumed. §11
   * rules one light per frame — the backdrop's own — and `key_dir` is the
   * field that carries it: "UL" on grid canonical, and "L-ABOVE", "C-ABOVE",
   * "L-BELOW" among the manor's measured paintings. The token names a
   * horizontal side (L/C/R) and a vertical one (ABOVE/BELOW, or the U/D of the
   * compact form), and the third component is the same for all of them: a key
   * is in FRONT of what it lights, or nothing facing the viewer would catch it.
   * Returned in the view space the projection states its face normals in —
   * x right, y into the frame, z up — as a unit vector pointing at the light. */
  function keyVector(meta) {
    var tok = String((meta && meta.key_dir) || "UL").toUpperCase();
    var h = 0, v = 1;
    if (/(^|-)L/.test(tok) || tok.indexOf("UL") === 0) h = -1;
    else if (/(^|-)R/.test(tok) || tok.indexOf("UR") === 0) h = 1;
    if (tok.indexOf("BELOW") >= 0 || /(^|-)D/.test(tok)) v = -1;
    /* THE KEY IS ABOVE BEFORE IT IS TO ONE SIDE. A vector with equal
     * horizontal and vertical parts lights a wall as hard as it lights a floor,
     * and a staircase's big side face then reads brighter than its treads —
     * which is a light from the side, not one from above the shoulder. The
     * elevation carries more than twice the sideways term, so a tread top takes
     * most of the key and a stringer takes a third of it, and the forward part
     * is what stops a face turned at the viewer being unlit. */
    var x = h * 0.5, y = -0.5, z = v * 1.2;
    var n = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / n, y / n, z / n];
  }

  function hexToRgb(hex) {
    var s = String(hex || "").replace("#", "");
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    if (!isFinite(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ONE KEY ON A FACE. The unlit end is the surface's own tone and the lit end
   * is that tone carried toward the light's own colour — which is what "shares
   * the backdrop's key direction and colour temperature" means for a face the
   * grid draws rather than a sprite it stamps. Lambert, clamped at zero: a face
   * turned away from the key takes none of it and stays exactly the tone the
   * flight had before this row, so nothing gets darker than the value round
   * four measured against the wall behind it. */
  var FACE_GAIN = 0.5;
  function shadeFace(baseRgb, tintRgb, normal, light) {
    var d = 0;
    if (normal && normal.length === 3) {
      d = normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2];
    }
    if (!(d > 0)) d = 0;
    var t = FACE_GAIN * d;
    return "rgb(" +
      Math.round(baseRgb[0] + (tintRgb[0] - baseRgb[0]) * t) + "," +
      Math.round(baseRgb[1] + (tintRgb[1] - baseRgb[1]) * t) + "," +
      Math.round(baseRgb[2] + (tintRgb[2] - baseRgb[2]) * t) + ")";
  }

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

  /* [Row 15] A closed ring of scene-pixel points, as the §5 meta carries a
   * flight's outline. Not `strokePolylines`: that one maps a normalized glyph
   * into a box, and these points are already where they belong. */
  function fillRing(ctx, ring) {
    if (!ring || ring.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(ring[0][0], ring[0][1]);
    for (var i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function strokeRing(ctx, ring) {
    if (!ring || ring.length < 3) return;
    ctx.beginPath();
    for (var i = 0; i < ring.length; i++) {
      if (i === 0) ctx.moveTo(ring[i][0], ring[i][1]);
      else ctx.lineTo(ring[i][0], ring[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * The wall in view, as a list of bands in the §4 u-domain. Row 11's whole
   * typed-geometry model is this one function: `enclosed`, `corridor` and
   * `open` are not three drawings, they are three band lists.
   *
   *   open                    -> no bands at all (no facing wall exists)
   *   wall_continuous: false  -> the bands `wall_segments` names (part
   *                              building, part open ground — law (b))
   *   otherwise               -> one band spanning the view
   *
   * Corner verticals stand at every band edge; side-wall returns are drawn
   * only where ONE continuous band spans the view AND the meta knows its
   * corners, because that is what having two corners means.
   */
  function wallBands(meta) {
    if (meta.facing_type === "open") return [];
    if (meta.wall_continuous === false && meta.wall_segments) {
      var out = [];
      for (var i = 0; i < meta.wall_segments.length; i++) {
        var seg = meta.wall_segments[i];
        out.push({ u0: seg.from_m / meta.wall_width_m, u1: seg.to_m / meta.wall_width_m });
      }
      return out;
    }
    return [{ u0: 0, u1: 1 }];
  }

  /* Is this screen x-span inside a single built band of the wall in view?
   * Bands are given in the §4 u-domain; a span straddling two bands is not
   * inside either, which is the point — the gap between them is not wall. */
  /* [Row 15] THE OTHER HALF OF THE SAME LAW. A doorway needs a band to be a
   * hole in; a THRESHOLD is the absence of a band and needs the opposite —
   * nothing built may stand across it, or it is a way through a wall. Blueprint
   * §4b law (b) states one sentence and these two functions are its two
   * directions. */
  function crossesAnyBand(x0, x1, bands, meta) {
    var gp = groundplane();
    for (var i = 0; i < bands.length; i++) {
      var b0 = gp.xAtScale(bands[i].u0, meta.px_per_m_at_wall, meta, CANVAS_W);
      var b1 = gp.xAtScale(bands[i].u1, meta.px_per_m_at_wall, meta, CANVAS_W);
      var lo = Math.min(b0, b1), hi = Math.max(b0, b1);
      if (x0 < hi - 0.5 && x1 > lo + 0.5) return true;
    }
    return false;
  }

  function spannedByBand(x0, x1, bands, meta) {
    var gp = groundplane();
    for (var i = 0; i < bands.length; i++) {
      var b0 = gp.xAtScale(bands[i].u0, meta.px_per_m_at_wall, meta, CANVAS_W);
      var b1 = gp.xAtScale(bands[i].u1, meta.px_per_m_at_wall, meta, CANVAS_W);
      var lo = Math.min(b0, b1), hi = Math.max(b0, b1);
      if (x0 >= lo - 0.5 && x1 <= hi + 0.5) return true;
    }
    return false;
  }

  function drawGrid(ctx, meta, facing, W, H, openings) {
    var gp = groundplane();
    var floorY = meta.floor_line_y * meta.image_h_px;
    var eyeY = meta.horizon_y * meta.image_h_px;
    var sWall = meta.px_per_m_at_wall;
    var sBottom = meta.px_per_m_at_bottom;
    /* Derived grid constant (was the literal 336): px_per_m_at_wall × the
     * camera-to-wall distance, the same number scaleAtDepth divides by —
     * one home, groundplane.cameraDistance, which is typed since row 11 (an
     * open facing's anchor is `camera_far_m` and there is no silent 3.5 m). */
    var gridK = sWall * gp.cameraDistance(meta);
    var bands = wallBands(meta);
    /* The room is bounded — two corners and two side-wall returns — exactly
     * when the meta knows where its wall ends. A facing no plan holds carries
     * null corners and draws the unbounded wall it always drew: a room whose
     * extent nobody has drawn must not claim two corners. */
    var bounded = gp.hasCorners(meta) && bands.length === 1 &&
      bands[0].u0 === 0 && bands[0].u1 === 1;
    var X = function (u, s) { return gp.xAtScale(u, s, meta, W); };
    var cL = bounded ? meta.corner_x0_px : null;
    var cR = bounded ? meta.corner_x1_px : null;
    /* Where the wall-floor line of each return leaves the frame: through the
     * bottom edge on a narrow room (hall/E: x 390 at y 1024), through the
     * side edge on a wide one (study/N: x 0 at y ≈ 1007). Same polygon. */
    var xb0 = bounded ? X(0, sBottom) : 0;
    var xb1 = bounded ? X(1, sBottom) : W;
    /* THE CEILING, and it is drawn only where a meta says how high the room
     * is. Since row 11's direction verdict [HUMAN 2026-08-21] both floors of
     * the plan carry `storey_height_m` 2.8, so every bounded facing — enclosed
     * and corridor — has one; an open space carries no storey height and has
     * no corners to hang one between, so nothing here fires for it. The device
     * exists because the alternative is a room bounded left and right and
     * unbounded upward: the frame holds several metres of wall above the
     * floor line, against a c.1660 storey of roughly 2.6–3.0 m, so the corners
     * ran off the top and the room read as a shaft. 2.8 m is period-plausible
     * and sits under blueprint §4's standing licence — a value we can change
     * any time, not a measurement. A meta that omits the field still draws no
     * ceiling, which is what an unplanned facing gets. */
    var storeyM = (meta.storey_height_m > 0) ? meta.storey_height_m : null;
    var ceilY = storeyM != null ? floorY - storeyM * sWall : 0;
    var wallTop = Math.max(0, ceilY);

    /* The left return's region: left of the corner above the floor line, left
     * of the junction below it, clipped to the frame. Traced rather than
     * assembled from a self-intersecting polygon, because the junction may
     * leave through either edge. */
    function leftReturn() {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cL, 0);
      ctx.lineTo(cL, floorY);
      if (xb0 >= 0) { ctx.lineTo(xb0, H); ctx.lineTo(0, H); }
      else { ctx.lineTo(0, floorY + (cL / (cL - xb0)) * (H - floorY)); }
      ctx.closePath();
    }
    /* Everything below the line through two points, as a clip path. Used to
     * cut the returns at their own wall-ceiling junction where the room has a
     * height: without it the return's grid runs on across the ceiling plane. */
    function belowLine(ax, ay, bx, by) {
      var far = 1e5;
      var m2 = (by - ay) / ((bx - ax) || 1e-9);
      var yAt = function (x) { return ay + m2 * (x - ax); };
      ctx.beginPath();
      ctx.moveTo(-far, yAt(-far));
      ctx.lineTo(far, yAt(far));
      ctx.lineTo(far, H + far);
      ctx.lineTo(-far, H + far);
      ctx.closePath();
    }
    /* Everything ABOVE a line — the mirror of belowLine. */
    function aboveLine(ax, ay, bx, by) {
      var far = 1e5;
      var m2 = (by - ay) / ((bx - ax) || 1e-9);
      var yAt = function (x) { return ay + m2 * (x - ax); };
      ctx.beginPath();
      ctx.moveTo(-far, yAt(-far));
      ctx.lineTo(far, yAt(far));
      ctx.lineTo(far, -far);
      ctx.lineTo(-far, -far);
      ctx.closePath();
    }
    /* THE CEILING THE ROOM ACTUALLY HAS — the floor's mirror, and clipped for
     * the same reason. It is the region above the wall-ceiling line between
     * the corners AND above both side-wall ceiling junctions; three clips
     * compose to it. Row 11 shipped the ceiling's own fan unclipped for a
     * commit and its longitudinals painted straight across both returns and
     * across the void wedge above them, which is the floor's own bug drawn
     * upside down. */
    function ceilingFloor() { ceilingRegion(); }
    function ceilingRegion() {
      ctx.beginPath();
      ctx.rect(-1e5, -1e5, 2e5, 1e5 + ceilY);
      ctx.clip();
      var sC = Math.max(sBottom, storeyM > 0 ? (H + 2) / storeyM : sBottom);
      var yC = groundplane().yAtScale(sC, meta) - storeyM * sC;
      aboveLine(cL, ceilY, X(0, sC), yC);
      ctx.clip();
      aboveLine(cR, ceilY, X(1, sC), yC);
      ctx.clip();
    }
    function ceilingCut(side) {
      if (storeyM == null) return;
      var u = side === 0 ? 0 : 1;
      belowLine(u === 0 ? cL : cR, ceilY, X(u, sBottom), H - storeyM * sBottom);
      ctx.clip();
    }
    function rightReturn() {
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(cR, 0);
      ctx.lineTo(cR, floorY);
      if (xb1 <= W) { ctx.lineTo(xb1, H); ctx.lineTo(W, H); }
      else { ctx.lineTo(W, floorY + ((W - cR) / (xb1 - cR)) * (H - floorY)); }
      ctx.closePath();
    }
    /* The floor the room actually has: between the two junctions. Outside
     * them is not floor at all — it is the return continuing toward you. */
    function roomFloor() {
      ctx.beginPath();
      if (!bounded) { ctx.rect(0, floorY, W, H - floorY); return; }
      ctx.moveTo(cL, floorY);
      ctx.lineTo(cR, floorY);
      if (xb1 <= W) { ctx.lineTo(xb1, H); }
      else { ctx.lineTo(W, floorY + ((W - cR) / (xb1 - cR)) * (H - floorY)); ctx.lineTo(W, H); }
      if (xb0 >= 0) { ctx.lineTo(xb0, H); }
      else { ctx.lineTo(0, H); ctx.lineTo(0, floorY + (cL / (cL - xb0)) * (H - floorY)); }
      ctx.closePath();
    }
    /* One band's own rectangle on the wall plane. */
    function bandRect(b) {
      var x0 = X(b.u0, sWall), x1 = X(b.u1, sWall);
      return { x: x0, w: x1 - x0 };
    }

    // Bases.
    /* Above the floor line: the facing wall where a band stands, and the
     * unestablished void where none does. An `open` facing has no band at
     * all, so nothing here paints a wall it does not have — that is the whole
     * of what "open" renders, and what its far line looks like belongs to
     * row 4's scenic-vista backdrop, not to an [AI] band invented here. */
    ctx.fillStyle = BEYOND_WALL;
    ctx.fillRect(0, 0, W, Math.ceil(floorY));
    ctx.fillStyle = WALL_BASE;
    for (var bi = 0; bi < bands.length; bi++) {
      var br = bandRect(bands[bi]);
      ctx.fillRect(br.x, wallTop, br.w, Math.ceil(floorY) - wallTop);
    }
    ctx.fillStyle = FLOOR_BASE;
    ctx.fillRect(0, Math.ceil(floorY), W, H - Math.ceil(floorY));
    /* The returns, in ONE lighting model with everything else: a per-plane
     * facing tone first, the frame-wide key falloff over it second. With the
     * key at upper-left the left return's face turns away from it and the
     * right return's turns toward it — the same statement the sprite painters
     * make with their across-width ramp, applied to the room's own geometry,
     * and the reason a corner reads even where no line falls on it. */
    if (bounded) {
      ctx.save();
      leftReturn();
      ctx.clip();
      ceilingCut(0);
      ctx.fillStyle = RETURN_LEFT;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      rightReturn();
      ctx.clip();
      ceilingCut(1);
      ctx.fillStyle = RETURN_RIGHT;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      /* No ceiling PLANE fill. A ceiling is drawn here the way the walls and
       * the floor are — by its own grid — and the fill it used to carry was
       * `#080a0e` over a void base of `#080b10`, two tones apart in one
       * channel: measured through the real draw path it moved nothing a
       * detector could name, so the mechanism was a fill nobody could see and
       * a case nobody could write. The ceiling's content is its line work
       * below (`renderer.ceiling_lines`), which is measurable and cased. */
    }

    /* The key falls on the ground too. Every sprite carries UL45 and every
     * contact pool is thrown down-right, and they stood on a wall and floor
     * of exactly uniform luminance at every x — shaded objects on an
     * unshaded ground, which is the flip test's failure in miniature. §7
     * calls grid mode a product mode, not placeholder art, and this meta
     * declares `key_dir: "UL"`. A stepped falloff in `key_tint` from the
     * upper left, in flat rect fills rather than a canvas gradient object
     * (those rasterise differently across engines, which is why the sprite
     * painters forbid them). It leaves every GRID_META number alone: this is
     * paint, not geometry. */
    keyFalloff(ctx, meta, W, H, null);

    ctx.lineWidth = 1;
    ctx.strokeStyle = meta.key_tint;

    var m, bandI, band, bx0, bx1;
    var centreX = gp.wallCentrePx(meta, W);
    var halfM = gp.wallSpanPxAtWall(meta) / sWall / 2; // half the wall, in metres

    /* The facing wall's own grid, clipped to each band. Before row 11 these
     * ran the width of the frame, which drew wall where the room has none. */
    ctx.globalAlpha = ALPHA_MINOR;
    for (bandI = 0; bandI < bands.length; bandI++) {
      band = bands[bandI];
      bx0 = X(band.u0, sWall);
      bx1 = X(band.u1, sWall);
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx0, wallTop, bx1 - bx0, floorY - wallTop);
      ctx.clip();
      for (m = Math.ceil((bx0 - centreX) / sWall); centreX + m * sWall <= bx1; m++) {
        var vx = snap(centreX + m * sWall);
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.lineTo(vx, snap(floorY));
        ctx.stroke();
      }
      for (m = 1; floorY - m * sWall >= 0; m++) {
        var hy = snap(floorY - m * sWall);
        ctx.beginPath();
        ctx.moveTo(bx0, hy);
        ctx.lineTo(bx1, hy);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* The returns' own grid: verticals at each half-metre of depth, rising
     * from the wall-floor junction; horizontals fanning from the corner, one
     * per metre of height. Both are the same plane the facing wall's grid
     * describes, seen edge-on — which is what makes the corner read as a
     * corner rather than as a change of paint. */
    if (bounded) {
      var camM = gp.cameraDistance(meta);
      var spanPx = gp.wallSpanPxAtWall(meta);
      for (var side = 0; side < 2; side++) {
        var u = side === 0 ? 0 : 1;
        /* How far along the return to keep drawing. The FLOOR's lerp is
         * exhausted at px_per_m_at_bottom — that is where the floor leaves the
         * frame — but the wall beside you does not stop there: it runs on past
         * your own feet. Stopping at the floor's last depth left a corridor's
         * lower corners as flat unlined slabs, which read as void rather than
         * as the wall you are standing between. So the return is drawn on to
         * the scale at which it leaves the frame edge. */
        var sEdge = spanPx > 0
          ? 2 * (side === 0 ? centreX : (W - centreX)) * sWall / spanPx
          : sBottom;
        var sMax = Math.max(sBottom, sEdge);
        ctx.save();
        if (side === 0) leftReturn(); else rightReturn();
        ctx.clip();
        ceilingCut(side);
        ctx.globalAlpha = ALPHA_MINOR;
        for (var dd = 0.5; dd < camM; dd += 0.5) {
          var ss = gp.scaleAtDepth(dd, meta);
          if (!(ss <= sMax)) break;
          var rx = snap(X(u, ss));
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx, snap(gp.yAtScale(ss, meta)));
          ctx.stroke();
        }
        for (m = 1; floorY - m * sWall >= 0; m++) {
          ctx.beginPath();
          ctx.moveTo(X(u, sWall), floorY - m * sWall);
          ctx.lineTo(X(u, sMax), gp.yAtScale(sMax, meta) - m * sMax);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* The floor, clipped to the floor the room actually has. Longitudinals
     * are the metre lines inside the room — the two extremes ARE the
     * wall-floor junctions of the returns, and they are drawn as majors
     * below. */
    ctx.save();
    roomFloor();
    ctx.clip();
    ctx.globalAlpha = ALPHA_MINOR;
    for (m = Math.ceil(-halfM); m <= Math.floor(halfM); m++) {
      ctx.beginPath();
      ctx.moveTo(snap(centreX + m * sWall), snap(floorY));
      ctx.lineTo(snap(centreX + m * sBottom), H);
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
    ctx.restore();

    /* Majors: the room's own continuous wall-floor line — the band's foot
     * plus the two junctions — and the eye line. The eye line runs the full
     * width whatever the geometry: a level camera's horizon is one line
     * across every surface in the frame, wall, return and floor alike. */
    ctx.globalAlpha = ALPHA_MAJOR;
    if (bounded) {
      ctx.beginPath();
      ctx.moveTo(cL, snap(floorY));
      ctx.lineTo(cR, snap(floorY));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cL, snap(floorY));
      ctx.lineTo(xb0, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cR, snap(floorY));
      ctx.lineTo(xb1, H);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, snap(floorY));
      ctx.lineTo(W, snap(floorY));
      ctx.stroke();
    }
    /* The eye line is a camera fact and runs the full width — across the
     * facing wall, both returns and the floor alike, because a level camera's
     * horizon is one line across every surface in the frame. Where there is no
     * surface it is not drawn: on a facing with no band the region above the
     * far line is unestablished void, and a major stroke through it would be a
     * horizon asserted where the document holds nothing, next to a rule that
     * says an open facing draws "the ground, and no wall". */
    if (bands.length) {
      ctx.beginPath();
      ctx.moveTo(0, snap(eyeY));
      ctx.lineTo(W, snap(eyeY));
      ctx.stroke();
    }

    /* THE CORNERS. Two of them, at the ends of the u-domain the staging
     * addresses — `xAtScale(0)` and `xAtScale(1)` at wall scale, which is
     * what `corner_x0_px`/`corner_x1_px` are — running from the floor line up
     * to `wallTop`: the wall-ceiling line where the room has a height, the top
     * of frame where it does not (an unplanned facing, whose extent nobody has
     * drawn). */
    if (bounded) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(snap(cL), wallTop);
      ctx.lineTo(snap(cL), snap(floorY));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(snap(cR), wallTop);
      ctx.lineTo(snap(cR), snap(floorY));
      ctx.stroke();
      ctx.lineWidth = 1;
      /* Where the room has a height, the wall-ceiling line is the floor line's
       * twin and the ceiling's own longitudinals fan from it. */
      if (storeyM != null && wallTop > 0) {
        /* [Row 15] A STAIRWELL IS A HOLE IN THE CEILING, and the ceiling is
         * line work, so the hole costs one clip path and no new appearance.
         * `great_stair`'s top tread lands at y ≈ 174 against this room's
         * ceiling line at y ≈ 187: without this the picture shows a staircase
         * running into an unbroken plane, which is the picture asserting an
         * enclosure the document has no aperture in — the inverse of "never
         * void" and the same defect one storey up.
         *
         * The well is `meta.stairs[].well_poly`, the flight's own footprint
         * lifted to the storey height, DERIVED from the two things the plan
         * holds (the flight's rect and its floor's height) because the plan
         * carries no floor opening and this row may not add a field to it.
         * Even-odd against the whole frame, so everything below is drawn
         * everywhere except through the well. */
        var wells = meta.stairs || [];
        ctx.save();
        var anyWell = false;
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        for (var wi = 0; wi < wells.length; wi++) {
          var wp = wells[wi].well_poly;
          if (!wp || wp.length < 3) continue;
          anyWell = true;
          ctx.moveTo(wp[0][0], wp[0][1]);
          for (var wj = 1; wj < wp.length; wj++) ctx.lineTo(wp[wj][0], wp[wj][1]);
          ctx.closePath();
        }
        if (anyWell) ctx.clip("evenodd");
        /* The wall-ceiling line is drawn OUTSIDE the ceiling's clip, exactly
         * as the wall-floor line is drawn outside anything: it runs corner to
         * corner along the top of the facing wall and is inside the room by
         * construction, so it needs no clip — and inside one it was a coin
         * flip. The clip's edge is the line's own y, so whether the 1 px
         * stroke survived depended on the fractional part of `ceilY`: at the
         * 1.83 m camera row 11 briefly drew, 398.4 kept it at full strength;
         * at the ruled interim's 376.32 the same code left five pixels of it,
         * and deleting the stroke altogether changed two pixels in the frame.
         * A stroke whose visibility turns on a rounding is not a mechanism. */
        ctx.beginPath();
        ctx.moveTo(cL, snap(ceilY));
        ctx.lineTo(cR, snap(ceilY));
        ctx.stroke();
        ctx.save();
        ceilingFloor();
        ctx.clip();
        var sCeilJ = Math.max(sBottom, storeyM > 0 ? (H + 2) / storeyM : sBottom);
        var yCeilJ = gp.yAtScale(sCeilJ, meta) - storeyM * sCeilJ;
        ctx.beginPath();
        ctx.moveTo(cL, snap(ceilY));
        ctx.lineTo(X(0, sCeilJ), yCeilJ);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cR, snap(ceilY));
        ctx.lineTo(X(1, sCeilJ), yCeilJ);
        ctx.stroke();
        ctx.globalAlpha = ALPHA_MINOR;
        /* The ceiling's fan runs to the scale at which it leaves the TOP of
         * frame, not to the one at which the FLOOR leaves the bottom. Row 11
         * shipped it at `sBottom` for a commit and the ceiling stopped 209 px
         * down: the nearest fifth of the frame had no ceiling in it at all,
         * in the very pair a human is asked to judge the device by. Same
         * reasoning as the returns' own `sMax`, and the same arithmetic —
         * the surface does not stop where a different surface leaves. */
        var sCeil = Math.max(sBottom, storeyM > 0 ? (H + 2) / storeyM : sBottom);
        var yCeil = gp.yAtScale(sCeil, meta) - storeyM * sCeil;
        for (m = Math.ceil(-halfM); m <= Math.floor(halfM); m++) {
          ctx.beginPath();
          ctx.moveTo(snap(centreX + m * sWall), snap(ceilY));
          ctx.lineTo(snap(centreX + m * sCeil), yCeil);
          ctx.stroke();
        }
        /* And the ceiling's transverse set, the floor's mirrored: without it
         * the ceiling is five radiating strokes rather than a surface. */
        var dWallC = gridK / sWall;
        for (var dc = 0.5; dc < dWallC; dc += 0.5) {
          var sc = gridK / dc;
          if (sc < sWall) continue;
          if (sc > sCeil) continue;
          var ty2 = snap(gp.yAtScale(sc, meta) - storeyM * sc);
          ctx.beginPath();
          ctx.moveTo(0, ty2);
          ctx.lineTo(W, ty2);
          ctx.stroke();
        }
        ctx.globalAlpha = ALPHA_MAJOR;
        ctx.restore();
        ctx.restore();   // the stairwell clip
      }
    }

    /* [Row 15] THE THRESHOLD'S OWN LINE ON THE GROUND, and it is the only mark
     * a threshold gets.
     *
     * Blueprint §4b law (b) forbids an invented enclosure where no building
     * stands, so a mouth gets no jamb, no reveal, no soffit and no fill. What
     * the law does not forbid is a line on the ground — the grid already draws
     * a transverse ground line every half metre — and without one the manor's
     * 20.4 m court mouth would be a `go` target on featureless ground, which is
     * the very thing the flights above are drawn to avoid. So the line where
     * this space ends and the next begins is drawn, at the position the plan
     * holds, and nothing else is. */
    var mouths = meta.openings || [];
    for (var mi = 0; mi < mouths.length; mi++) {
      var mth = mouths[mi];
      if (mth.kind !== "threshold") continue;
      ctx.save();
      ctx.strokeStyle = meta.key_tint;
      ctx.globalAlpha = ALPHA_MAJOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, mth.x), snap(mth.y + mth.h));
      ctx.lineTo(Math.min(W, mth.x + mth.w), snap(mth.y + mth.h));
      ctx.stroke();
      ctx.restore();
    }

    /* [Row 15] THE FLIGHTS. A stair is a fact about the building exactly as a
     * doorway is, and the grid draws it for the same reason it draws the
     * doorway's jamb: a `go` target on featureless floor is the picture
     * failing to say what the document holds, in a page whose own rule is that
     * dead space is dead.
     *
     * It is drawn from `meta.stairs` rather than from the aperture list — from
     * the BUILDING rather than from the world — because a flight standing in a
     * room is visible whether or not you may climb it, and drawing it shows no
     * void. That is the one place this differs from an unwalked doorway, whose
     * hole would show void where the document holds a room, and which is
     * therefore painted as plain wall.
     *
     * Two things are drawn and they answer two different views. The footprint
     * on the FLOOR is the flight's own plan position — the well seen from
     * above, the ground under the steps seen from below — and it is all that
     * survives on a descending flight, whose steps drop below the frame within
     * a metre at this eye height. The tread NOSES are the flight itself, each
     * at its own depth and its own height, which is what makes an ascending
     * one read as a climb rather than as a rectangle. */
    var flights = meta.stairs || [];
    for (var si = 0; si < flights.length; si++) {
      var fl = flights[si];
      ctx.save();
      /* A FLIGHT STANDS IN FRONT OF THINGS, so it is a SOLID and not a wire,
       * and it is drawn TREAD BY TREAD rather than as one outline. A flight's
       * outline self-crosses whenever the run lies across the view instead of
       * along it — the two stringers sit at different depths, both pass
       * through the view axis, and a ring that walks up one and back down the
       * other ties itself in a bow at the centre of the frame. A tread is a
       * quadrilateral from any angle. Filled in its own tone, each one stops
       * the room's floor grid where the stair stands in front of it, which is
       * the one place this drawing occludes anything and the one piece of
       * building fabric that stands off a wall. */
      var quads = fl.treads_poly || [];
      var mass = fl.mass_poly || [];
      /* A SOLID IS OPAQUE BY ITS OWN DECLARATION. This fill inherited whatever
       * alpha the line work before it happened to leave — 0.55 — and a body
       * drawn at 0.55 in a tone eleven levels off the wall behind it lands five
       * levels off it, which is nothing, and lets the wall's own grid read
       * straight through the thing that is supposed to be standing in front of
       * it. An occluder that does not occlude is the picture saying "nothing is
       * here" where the document holds a staircase. */
      ctx.globalAlpha = 1;
      /* [ROW 25] AND EVERY FACE OF IT TAKES THE ROOM'S OWN KEY. The whole solid
       * was one flat `#4a5870` — 22–32 % of a frame in a single value, tread top
       * and riser and stringer alike — which made it the only unlit thing in a
       * product whose §7 rules one key and whose two side returns already obey
       * it. The tone stays the flight's own and becomes the UNLIT end: a face
       * turned away from the key is exactly what it was before this row, and a
       * face turned toward it is carried that far toward the key's own colour.
       * The direction each face turns is the projection's (`treads_normal`,
       * `mass_normal`), the key is this facing's own (`key_dir`, `key_tint`),
       * and nothing here decides either. */
      var baseRgb = hexToRgb(STAIR_BASE);
      var tintRgb = hexToRgb(meta.key_tint);
      var light = keyVector(meta);
      var massN = fl.mass_normal || [];
      var quadN = fl.treads_normal || [];
      /* THE POOL AT THE CONTACT LINE, FIRST — under the body, so the body sits
       * in it rather than over a clean floor. "Every grounded object darkens the
       * ground under it" is a named quality and a lit solid standing on an
       * untouched floor is the sticker the flip test is for. Three stepped
       * strokes rather than a canvas gradient, the same reason the falloff is
       * stepped: gradient objects rasterise differently across engines. */
      if (fl.floor_poly && fl.floor_poly.length >= 3) {
        ctx.strokeStyle = "#000000";
        ctx.lineJoin = "round";
        for (var ci = 0; ci < CONTACT_STEPS.length; ci++) {
          ctx.lineWidth = CONTACT_STEPS[ci][0];
          ctx.globalAlpha = CONTACT_STEPS[ci][1];
          strokeRing(ctx, fl.floor_poly);
        }
        ctx.globalAlpha = 1;
        ctx.lineJoin = "miter";
      }
      /* The two closed strings first — the flight's own mass, stepped along
       * the top and standing on the floor, far side before near — then the
       * treads over them. */
      for (var mi = 0; mi < mass.length; mi++) {
        ctx.fillStyle = shadeFace(baseRgb, tintRgb, massN[mi], light);
        fillRing(ctx, mass[mi]);
      }
      for (var qi = 0; qi < quads.length; qi++) {
        ctx.fillStyle = shadeFace(baseRgb, tintRgb, quadN[qi], light);
        fillRing(ctx, quads[qi]);
      }
      /* AND THE FLIGHT STANDS IN THE ROOM'S OWN LIGHT, not beside it: the same
       * falloff cells the frame carries, clipped to the body. Without this the
       * solid is uniformly lit across a frame that is not, which is the collage
       * tell the flip test exists to catch. */
      var bodyRings = (fl.hit_polys || []).length ? fl.hit_polys : mass.concat(quads);
      if (bodyRings.length) {
        ctx.save();
        ctx.beginPath();
        var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
        for (var bi = 0; bi < bodyRings.length; bi++) {
          var br = bodyRings[bi];
          if (!br || br.length < 3) continue;
          ctx.moveTo(br[0][0], br[0][1]);
          for (var bj = 1; bj < br.length; bj++) ctx.lineTo(br[bj][0], br[bj][1]);
          ctx.closePath();
          for (var bk = 0; bk < br.length; bk++) {
            if (br[bk][0] < bx0) bx0 = br[bk][0];
            if (br[bk][0] > bx1) bx1 = br[bk][0];
            if (br[bk][1] < by0) by0 = br[bk][1];
            if (br[bk][1] > by1) by1 = br[bk][1];
          }
        }
        ctx.clip();
        keyFalloff(ctx, meta, W, H, { x0: bx0, x1: bx1, y0: by0, y1: by1 });
        ctx.restore();
      }
      ctx.strokeStyle = meta.key_tint;
      /* The footprint on the floor: the well seen from above, the ground under
       * the steps seen from below, and on a descending flight the only thing
       * of the stair the frame holds. */
      ctx.globalAlpha = ALPHA_MINOR;
      ctx.lineWidth = 1;
      strokeRing(ctx, fl.floor_poly);
      /* And every nose, which is what makes a climb read as a climb — from the
       * list that says it is a nose. Reading the first edge of every quad
       * drew the foot of each riser as well, which is not an edge of anything
       * a climber can see. */
      ctx.globalAlpha = ALPHA_MAJOR;
      ctx.lineWidth = 2;
      var noses = fl.noses || [];
      for (var qj = 0; qj < noses.length; qj++) {
        ctx.beginPath();
        ctx.moveTo(noses[qj][0][0], noses[qj][0][1]);
        ctx.lineTo(noses[qj][1][0], noses[qj][1][1]);
        ctx.stroke();
      }
      if (quads.length) {
        var last = quads[quads.length - 1];
        /* The two stringers, so the flight has edges as well as rungs. */
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(quads[0][0][0], quads[0][0][1]);
        for (var qk = 0; qk < quads.length; qk++) ctx.lineTo(quads[qk][3][0], quads[qk][3][1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(quads[0][1][0], quads[0][1][1]);
        for (var ql = 0; ql < quads.length; ql++) ctx.lineTo(quads[ql][2][0], quads[ql][2][1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Facing glyph: in-fiction signage, 1m tall at wall scale, centred on
    // the wall at the eye line. Carries facing only — rooms may legitimately
    // render identical until entities arrive.
    var glyph = GLYPHS[facing];
    if (glyph) {
      /* 0.6 m tall at wall scale, and it stays GEOMETRY rather than becoming
         a frame-relative mark. Row 2 set it at 1.5 m because at 96 px/m that
         drew 144 px and at 1 m it was 0.03% of the frame — no response at all
         to an arrow key on a phone. Row 20's pinned lens makes wall scale a
         per-facing number running 170 → 476 px/m, and 1.5 m of it is 256 px
         on the widest view and 714 px — 70% of the frame height — on the
         nearest wall in the manor. A metre-high letter filling a room is the
         diagram Kabe named. At 0.35 m the mark draws 60 → 167 px: bigger where
         the wall is close, which is what something painted on a wall does, and
         under a fifth of the frame even on the nearest wall the manor has,
         which is the bar his sentence sets and a size a test measures. §7 calls it in-fiction signage
         on the grid wall and it still is one — capping it in frame fractions
         would have made it chrome wearing the wall's clothes. */
      var gh = sWall * 0.35;
      var gw = gh * (2 / 3);
      /* The glyph stands on the largest band in view, and must lie INSIDE it
       * — a mark painted past a corner is signage floating in the side wall.
       * Where there is no band at all (an `open` facing) it is centred on the
       * view: `turn` is silent by design (§8 gives it no narration key), so
       * on a bare facing the glyph is the entire response to an arrow key and
       * no facing type may lose it.
       *
       * Candidates in order — left of an opening, right of it, ABOVE it —
       * and the third is why the list has three. Centred, the glyph landed
       * inside the doorway (and behind the shut leaf), which is where study/E
       * and hall/W became the same picture. But `hall/W` is a 1.0 m door in
       * the middle of a 2.60 m corridor end wall: both sideways dodges land
       * outside a corner, and only the space above the lintel is left. */
      var gBand = null;
      for (bandI = 0; bandI < bands.length; bandI++) {
        var cand = { x0: X(bands[bandI].u0, sWall), x1: X(bands[bandI].u1, sWall) };
        if (!gBand || (cand.x1 - cand.x0) > (gBand.x1 - gBand.x0)) gBand = cand;
      }
      var bandLo = gBand ? gBand.x0 : 0;
      var bandHi = gBand ? gBand.x1 : W;
      var gcx = gBand ? (gBand.x0 + gBand.x1) / 2 : W / 2;
      var gx = gcx - gw / 2;
      var gy = eyeY - gh / 2;

      function hitsOpening(x, y) {
        if (!openings) return false;
        for (var oi = 0; oi < openings.length; oi++) {
          var o = openings[oi];
          if (x < o.x + o.w && x + gw > o.x && y < o.y + o.h && y + gh > o.y) return true;
        }
        return false;
      }
      function fitsBand(x) { return x >= bandLo && x + gw <= bandHi; }

      if (hitsOpening(gx, gy)) {
        // The opening the glyph collides with drives the dodge.
        var hit = null;
        for (var oj = 0; oj < openings.length; oj++) {
          var oo = openings[oj];
          if (gx < oo.x + oo.w && gx + gw > oo.x && gy < oo.y + oo.h && gy + gh > oo.y) {
            hit = oo;
            break;
          }
        }
        var toLeft = hit.x - gw - sWall * 0.5;
        var toRight = hit.x + hit.w + sWall * 0.5;
        var above = hit.y - gh - sWall * 0.25;
        if (fitsBand(toLeft) && !hitsOpening(toLeft, gy)) {
          gx = toLeft;
        } else if (fitsBand(toRight) && !hitsOpening(toRight, gy)) {
          gx = toRight;
        } else if (above >= 0) {
          gy = above;
        } else {
          gx = fitsBand(toLeft) ? toLeft : toRight;
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
    /* A DOORWAY NEEDS A WALL TO BE A HOLE IN. Blueprint §5 law (b) [HUMAN,
     * 2026-08-21]: "outdoor walls are only present as represented by exterior
     * building walls" — so a facing with no band has nothing to cut an opening
     * through, and painting one there is the picture asserting a wall the
     * document does not hold. Before row 11 there was no way to say that;
     * after it there is, and this is the aperture path reading it for itself
     * rather than trusting the staging validator to have caught it upstream.
     * An artifact critic rendered `study/E` with an `open` meta and got a
     * jamb, two reveals, a soffit and a full plank leaf standing in void.
     *
     * The check is per OPENING, not per facing: on a segmented view the
     * opening must fall inside a band that is actually built, which is law (b)
     * at the resolution the law is written at. */
    var bandsHere = wallBands(meta);
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
        /* [ROW 25] A FLIGHT YOU CAN SEE IS A FLIGHT YOU CAN CLIMB.
         *
         * Every other way through is a hole in the wall you are facing, so an
         * exit on another facing is honestly absent from this picture. A FLIGHT
         * is not: `deriveMeta` draws it on every facing of its own room that
         * can see it, because a staircase standing on floor you are looking at
         * is not absent — and until this row it was drawn on eight facings that
         * answered no click at all, which is the same sentence as the defect
         * this row was allocated for ("a player sees it and cannot use it")
         * eight more times. Row 15's rule that the world says where you may
         * walk is unchanged: the exit still belongs to its own facing, the
         * aperture carries WHICH facing that is (`turn_to`), and the page turns
         * you to it before it walks you — the two intents a keyboard user
         * already presses, from one click on the thing itself. */
        var offFacing = null;
        if (exit.facing !== viewstate.facing) {
          var seenHere = gp.openingFor(meta, exit.via);
          if (!seenHere || seenHere.kind !== "stair") continue;
          offFacing = exit.facing;
        }
        var entity = null;
        for (var e = 0; e < world.entities.length; e++) {
          if (world.entities[e].id === exit.via) { entity = world.entities[e]; break; }
        }
        var rect = null;
        var source = null;
        var open_ = true;
        var beyond = null;
        var kind = "door";
        var polys = null;
        var direction = null;
        if (entity) {
          /* A LEAF IS AN ENTITY, and everything that follows from that holds:
           * the opening is derived from its own §4 placement, and it is
           * knowledge-filtered, because a door the player has not been told
           * about must leave no hole. */
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
          var lib = library[entity.sprite];
          if (!lib) continue;
          var place = gp.placeHost(fp, lib.record, meta, CANVAS_W);
          if (!place) continue;
          rect = { x: place.x0, y: place.y0, w: place.x1 - place.x0, h: place.y1 - place.y0 };
          source = "leaf";
          open_ = entity.state === "open";
        } else {
          /* [Row 21] A DOORWAY WITH NO LEAF IS ARCHITECTURE — a hole in the
           * wall, carried by the facing's own §5 meta (derived from the plan
           * for a synthesized facing, measured off the painting for a real
           * one). It is NOT knowledge-filtered, and that is not an exemption
           * from the intention's rule: the wall has the hole whether or not
           * the player knows anything, the backdrop paints it either way, and
           * filtering it would make the picture contradict the painting it is
           * drawn from. What stays filtered is every ENTITY, which is what the
           * rule is about.
           *
           * An exit whose `via` matches no leaf and no opening gets no
           * aperture here and no `go` target on the page; the fixture
           * validator refuses that world, so it is a typo's refusal rather
           * than a silent hole in a wall. */
          /* [Row 15] Through `groundplane.openingFor`, the ONE home of what an
           * exit's `via` names — the entity that fills a hole, or the plan's
           * own name for the hole, the threshold or the flight. 25 of the
           * manor's 26 openings carry no entity and neither of its stairs ever
           * will, so a leaf-or-nothing lookup made all but one of the building
           * unwalkable. */
          var found = gp.openingFor(meta, exit.via);
          if (!found) continue;
          rect = { x: found.x, y: found.y, w: found.w, h: found.h };
          source = "building";
          beyond = found;
          kind = found.kind || "door";
          /* [Row 25] THE REGION IS THE RINGS THE PICTURE DRAWS. A flight
           * carries a list of them — its stringers, its goings and risers, and
           * its footprint — and a point is on the flight when it is inside one.
           * A doorway and a mouth carry none: their region is their own
           * rectangle, which is the hole in the wall. */
          polys = found.hit_polys || null;
          direction = found.direction || null;
        }
        /* WHAT A WAY THROUGH NEEDS OF THE WALL, per kind, and it is law (b)
         * read in both directions. A doorway must fall inside a band that is
         * actually built. A threshold must fall where NOTHING is built — a
         * mouth across a standing wall is a hole nobody cut. A flight stands on
         * the floor and asks the wall for nothing at all. */
        if (kind === "door") {
          if (!spannedByBand(rect.x, rect.x + rect.w, bandsHere, meta)) continue;
        } else if (kind === "threshold") {
          if (crossesAnyBand(rect.x, rect.x + rect.w, bandsHere, meta)) continue;
        }
        /* WHAT LIES BEYOND is a fact about the building either way, so a
         * leaf-derived aperture reads it off the same meta opening the
         * building-fact path uses: the leaf says where the hole is drawn, the
         * building says what stands on the other side of it. A meta that
         * carries no opening for this exit leaves both numbers null and the
         * renderer draws no room beyond — silence, never a guess. */
        if (!beyond) beyond = gp.openingFor(meta, exit.via);
        out.push({
          exit: exit.id,
          via: exit.via,
          to: exit.to,
          arrive_facing: exit.arrive_facing,
          source: source,
          kind: kind,
          polys: polys,
          /* The facing this exit belongs to, where it is not the one you are
           * standing on — a flight seen from beside it. Null everywhere else,
           * so a reader that does not know about it behaves exactly as before. */
          turn_to: offFacing,
          direction: direction,
          open: open_,
          beyond_m: beyond ? beyond.beyond_m : null,
          beyond_offset_m: beyond ? beyond.beyond_offset_m : null,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h
        });
      }
    }
    /* [Row 15] WHICH HAND EACH WAY THROUGH IS ON, where a facing has more than
     * one. A control's accessible name is the shortest true name of what it
     * does, and "walk through the doorway" said twice on one wall names
     * neither. Computed here, from the drawn rectangles, because the page must
     * not re-derive an ordering the picture already fixes. */
    var unfilled = [];
    for (var oi2 = 0; oi2 < out.length; oi2++) if (out[oi2].source === "building" && out[oi2].kind === "door") unfilled.push(out[oi2]);
    unfilled.sort(function (a, b) { return a.x - b.x; });
    for (var oj2 = 0; oj2 < unfilled.length; oj2++) {
      unfilled[oj2].siblings = unfilled.length;
      /* Left and right, for exactly two. A wall with THREE unfilled doorways
       * would need an ordinal and the manor has none — and a string nobody can
       * reach may not be enumerated in the audit, so naming a case that does
       * not exist would be a row no sweep could ever see. Recorded as a limit
       * rather than answered: the FOUR facings that carry two carry two —
       * great_hall/W, long_gallery/W, servants_hall/W and solar/E. (This
       * said eight, counting the four walls that carry a doorway AND a
       * stair; `siblings` counts doorways, because a stair is named by
       * climbing and never needs a hand.) */
      unfilled[oj2].hand = unfilled.length !== 2 ? null : (oj2 === 0 ? "left" : "right");
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
  /* Read at the size the opening actually draws — 86 scene px, 22 CSS px on a
   * phone. At near-black against near-black the beyond-room device was there
   * and invisible, and the doorway read as a framed dark picture hung on the
   * wall. Darker than this room's wall (it is further off and unlit) but far
   * enough apart from each other to carry depth at a thumbnail's size. */
  var BEYOND_WALL = "#080b10";
  /* The doorway's own thickness, lit by the same upper-left key: the near
   * reveal catches it, the far one does not, the soffit is in shadow under
   * the lintel. These are what make an opening read as an opening at the
   * size it actually draws — 22 CSS px wide on a phone. */
  var REVEAL_NEAR = "#39424f";
  var REVEAL_FAR = "#171d26";
  var REVEAL_SOFFIT = "#10141b";

  /* The frame stands proud of the leaf, because a doorway is wider than the
   * door in it. Drawn flush, the leaf covered the jamb exactly and a shut
   * door was a plank on unbroken wall: "a doorway exists whether or not its
   * leaf is shut" was true of the code and invisible in the picture. */
  function jambOf(a) {
    var j = Math.max(3, Math.round(a.w * 0.05));
    return { x: a.x - j, y: a.y - j, w: a.w + 2 * j, h: a.h + j };
  }

  /* [Row 21] THROUGH AN OPENING, THE DESTINATION ROOM — never void.
   *
   * What stood here before was a dark fill: the aperture was a hole in the
   * wall with nothing behind it, 69,120 near-black pixels on `study/E`, 4.4 %
   * of the frame. That is the picture saying VOID where the document holds a
   * room, which makes it product truth rather than polish.
   *
   * The device is one for painted and synthesized facings alike: draw the
   * destination facing's OWN picture — its painted backdrop if it has one,
   * else its grid drawn from its own §5 meta — scaled by
   * `d_dest / (d_here + d_dest)`, positioned so the two horizons coincide and
   * the destination's centre falls on the opening's, clipped to the opening,
   * and dimmed. The scale is the pinhole's: the far room's wall stands at this
   * room's standpoint distance PLUS its own, so it draws by that ratio
   * smaller. Aligning the horizons is what makes the floor beyond continue the
   * floor here rather than start a second, unrelated camera.
   *
   * WHICH facing: the exit's `arrive_facing` in the room it leads to. What you
   * see through the door is what you will be looking at once you have walked
   * through it — the same room, the same camera, one step later.
   *
   * WHAT IS AND IS NOT DRAWN, corrected [F13 — this comment used to say the
   * opposite of the code, forty lines above the line that contradicted it]:
   * the destination IS drawn with whatever the document stands in it, through
   * the real renderer and the same knowledge filter (knowledge is the world's,
   * not the standpoint's), because a doorway that showed an empty passage
   * would deny the bookcase the document puts there. What it is NOT drawn with
   * is its own apertures: `no_through` stops the recursion at one room, so the
   * doorway BEYOND this one is drawn as what it is at that distance — an
   * unlit opening — rather than as a second room seen through two holes. */
  var THROUGH_DIM = 0.42;
  /* [ROW 25] How much of the destination's own edge the extension's colour is
   * averaged over. One row is what the stretch used, and one row of a painting
   * is as much an accident of where the crop fell as it is a fact about the
   * room; sixteen is a band wide enough to be the room's colour there and
   * narrow enough to still be the EDGE's. */
  var EDGE_BAND = 16;

  /* The mean colour of a rectangle of the destination's own frame, as a fill
   * string. One read per band — never the whole frame per opening. */
  function bandMean(srcCtx, x, y, w, h) {
    var d;
    try { d = srcCtx.getImageData(x, y, Math.max(1, w), Math.max(1, h)).data; }
    catch (err) { return "rgb(0,0,0)"; }
    var r = 0, g = 0, b = 0, n = d.length / 4;
    for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    if (!n) return "rgb(0,0,0)";
    return "rgb(" + Math.round(r / n) + "," + Math.round(g / n) + "," + Math.round(b / n) + ")";
  }

  function drawThroughOpening(ctx, a, meta, world, staging, library, backdrops, doc, options) {
    /* A SHUT DOOR SHOWS NO ROOM. The leaf is a sprite with its own alpha and
     * it does not fill its placement rectangle to the pixel, so a lit room
     * drawn behind a closed leaf leaks around its edges — which is the picture
     * asserting a way through that the document has shut. */
    if (a.open === false) return false;
    if (!backdrops || !a.to || !a.arrive_facing) return false;
    var entry = backdrops[a.to + "/" + a.arrive_facing];
    if (!entry || !entry.meta) return false;
    /* [F5] `null >= 0` IS TRUE IN JAVASCRIPT, and this guard was written as
     * `!(a.beyond_m >= 0)`. A meta that cannot say what lies beyond an opening
     * writes `beyond_m: null`, so the guard never fired: `D` collapsed to this
     * room's own distance and the far room drew 3.1x too large, silently. The
     * test is a real number test now, and a non-finite value is a FINDING
     * rather than a silent fallback — row 19's rule, applied here. */
    if (typeof a.beyond_m !== "number" || !isFinite(a.beyond_m) || a.beyond_m < 0) {
      if (a.beyond_m !== null && a.beyond_m !== undefined) {
        throw new Error("renderer: opening " + a.exit + " carries beyond_m " +
          JSON.stringify(a.beyond_m) + " — a distance to the far wall must be a finite number");
      }
      return false;   // the meta says nothing about what is beyond, so neither does the picture
    }
    var destMeta = entry.meta;
    var W = CANVAS_W, H = Math.round(meta.image_h_px);
    var gp = groundplane();
    var dHere, dDest;
    try {
      dHere = gp.cameraDistance(meta);
      dDest = gp.cameraDistance(destMeta);
    } catch (err) {
      return false;               // a meta anchored to neither plane: say nothing
    }
    /* THE TRANSFORM IS A PINHOLE'S, and both terms come from the document.
     * The destination's own wall stands `dHere + beyond_m` from this camera
     * and its painting draws that wall at `dDest`, so the frame scales by
     * their ratio — NOT by `dDest / (dHere + dDest)`, which assumes the far
     * camera stands in the doorway and draws the next room 26 % too large in
     * this manor. The destination's view axis is `beyond_offset_m` to the side
     * of this one, which at the far wall's own scale is where its centre
     * belongs. Vertically the horizons coincide: both cameras are level and at
     * one eye height, so a floor point at any distance lands on the same row
     * in both frames and the floor beyond continues the floor here — that
     * agreement is what stops the sill reading as a step. */
    var D = dHere + a.beyond_m;
    var k = dDest / D;
    var off = makeCanvas(doc, W, H);
    /* The destination's WHOLE picture — its painting or its grid, and whatever
     * the document stands in it — through the real renderer, because the world
     * places a bookcase in that passage and a doorway that showed an empty one
     * would deny it. One call rather than two branches: a painted destination
     * and a drawn one differ inside `render`, and a second copy of that
     * decision here is a second place for them to stop agreeing.
     *
     * `no_through` stops the recursion at one room: looking through a door
     * never draws the door beyond it. Every other option is inherited, so a
     * flip pair's backdrop-only half is backdrop-only on both sides of the
     * wall and a sprite seen through a doorway is judged like any other. */
    var innerOpts = {
      no_through: true,
      backdrop_only: !!(options && options.backdrop_only),
      tint: options ? options.tint : undefined,
      shadows: options ? options.shadows : undefined,
      parts: options ? options.parts : undefined,
      part_t: options ? options.part_t : undefined
    };
    render(off, world, staging, library, backdrops,
      { location: a.to, facing: a.arrive_facing }, innerOpts);
    var hHere = meta.horizon_y * meta.image_h_px;
    var hDest = destMeta.horizon_y * destMeta.image_h_px;
    var sDest = destMeta.px_per_m_at_wall;
    var dx = W / 2 + k * ((a.beyond_offset_m || 0) * sDest - W / 2);
    var dy = hHere - k * hDest;
    var dw = W * k, dh = H * k;
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.x, a.y, a.w, a.h);
    ctx.clip();
    /* The far room is smaller than the hole it is seen through, so its frame
     * does not cover the opening — and the strip left over is the floor at
     * your own feet and the wall beside your shoulder, which the destination's
     * own frame simply does not contain. Its edges are extended into that
     * strip rather than left as void: the floor beyond does continue toward
     * you, and a hard edge where a picture ran out would be a claim about the
     * room that nobody made. */
    /* [F6] THE CORNERS TOO. Four edge strips fill a CROSS, not a rectangle:
     * the four corner regions between them stayed void, and the void grows
     * with distance — 1.6 % of an opening on a facing the demo does not ship,
     * 53 % of it with the far room 40 m away.
     *
     * [ROW 25] AND WHAT FILLS THEM CLAIMS COLOUR, NOT DETAIL. Every one of
     * these regions used to be a single row or column of the destination
     * STRETCHED across it, and on this manor that is most of what a player sees
     * through an opening: `hall/N`'s 476 × 953 doorway is 9.6 % destination and
     * the rest horizontal bands of smeared brown, `entrance_approach/N`'s mouth
     * 16.1 % with two 608 × 368 blocks each derived from one pixel, and three
     * doors are at ZERO — a room made entirely of one stretched pixel. A
     * picture that invents structure nobody drew is the [AI] appearance the
     * flip test exists to catch.
     *
     * So the extension is a FLAT FILL of the destination's own edge band on
     * that side (its outer `EDGE_BAND` px, averaged), and each corner the mean
     * of the destination's own corner block. What it asserts is one fact — the
     * room beyond continues in this colour — which is true of a camera's crop
     * of a real room, and nothing whatever about its structure. Where the
     * destination's frame does not reach the opening AT ALL there is no edge to
     * continue, so the claim weakens accordingly and the whole opening takes
     * the mean of the destination's WHOLE frame: a room of this colour is
     * there, and this picture cannot say more.
     *
     * The stretch is not restored by deleting this: what the extension exists
     * to prevent is VOID in an opening the document holds a room behind, which
     * is row 21's clause, and a colour claim keeps that promise while the
     * stretched one broke a different one. The structural cure — a destination
     * view derived at the OPENING's own axis rather than at the destination
     * standpoint's, which is why coverage collapses to zero when two standpoints
     * are far apart — is named in `design/architecture.md` and is not this
     * row's. */
    var lft = Math.max(0, dx - a.x), rgt = Math.max(0, a.x + a.w - (dx + dw));
    var top = Math.max(0, dy - a.y), bot = Math.max(0, a.y + a.h - (dy + dh));
    var oc = off.getContext("2d");
    var covers = (dx < a.x + a.w) && (dx + dw > a.x) && (dy < a.y + a.h) && (dy + dh > a.y);
    if (!covers) {
      /* NOTHING OF THE DESTINATION'S FRAME IS IN THIS OPENING. Not a rare
       * corner: `buttery_pantry/S`, `great_hall/N` and `kitchen/N` all look
       * through a door at a part of the room their destination's own camera
       * never saw. */
      ctx.fillStyle = bandMean(oc, 0, 0, W, H);
      ctx.fillRect(a.x, a.y, a.w, a.h);
    } else {
      if (bot > 0) { ctx.fillStyle = bandMean(oc, 0, H - EDGE_BAND, W, EDGE_BAND); ctx.fillRect(dx, dy + dh, dw, bot); }
      if (top > 0) { ctx.fillStyle = bandMean(oc, 0, 0, W, EDGE_BAND); ctx.fillRect(dx, a.y, dw, top); }
      if (lft > 0) { ctx.fillStyle = bandMean(oc, 0, 0, EDGE_BAND, H); ctx.fillRect(a.x, dy, lft, dh); }
      if (rgt > 0) { ctx.fillStyle = bandMean(oc, W - EDGE_BAND, 0, EDGE_BAND, H); ctx.fillRect(dx + dw, dy, rgt, dh); }
      if (lft > 0 && top > 0) { ctx.fillStyle = bandMean(oc, 0, 0, EDGE_BAND, EDGE_BAND); ctx.fillRect(a.x, a.y, lft, top); }
      if (rgt > 0 && top > 0) { ctx.fillStyle = bandMean(oc, W - EDGE_BAND, 0, EDGE_BAND, EDGE_BAND); ctx.fillRect(dx + dw, a.y, rgt, top); }
      if (lft > 0 && bot > 0) { ctx.fillStyle = bandMean(oc, 0, H - EDGE_BAND, EDGE_BAND, EDGE_BAND); ctx.fillRect(a.x, dy + dh, lft, bot); }
      if (rgt > 0 && bot > 0) { ctx.fillStyle = bandMean(oc, W - EDGE_BAND, H - EDGE_BAND, EDGE_BAND, EDGE_BAND); ctx.fillRect(dx + dw, dy + dh, rgt, bot); }
    }
    ctx.drawImage(off, dx, dy, dw, dh);
    /* Dimmed, because it is another room seen from outside it through a hole
     * in a wall — and because at full brightness the opening reads as a second
     * frame pasted into the first rather than as depth. The amount is a look
     * decision made by a constant, and it goes to Kabe in the row's batch as
     * one. */
    ctx.globalAlpha = THROUGH_DIM;
    ctx.fillStyle = "#000000";
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.restore();
    return true;
  }

  function drawApertures(ctx, list, meta, world, staging, library, backdrops, doc, options) {
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      /* [Row 15] ONLY A DOORWAY IS A HOLE IN A WALL.
       *
       * A THRESHOLD draws nothing at all. It is the absence of a wall, and the
       * picture already shows exactly that — a gap between the bands on a
       * walled facing, open ground on an `open` one. A jamb or a fill there
       * would be the invented enclosure blueprint §4b law (b) forbids, and a
       * far room pasted into it would make an [AI] appearance the established
       * look where ruling (1) gives an open far line to a generated vista.
       *
       * A STAIR is drawn by the grid, from `meta.stairs`, because it is
       * building geometry standing on the floor rather than a hole cut through
       * a plane — and because it must appear on a facing whose backdrop is
       * synthesized whether or not any exit climbs it. */
      /* [Row 15, corrected] A THRESHOLD DRAWS THE GROUND THROUGH ITSELF.
       *
       * The paragraph above is right that a threshold has no jamb, no reveal
       * and no soffit — there is no wall there to have a thickness — and right
       * that an invented far ROOM would be the [AI] appearance ruling (1)
       * reserves for a generated vista. It was wrong to conclude that a
       * threshold therefore draws NOTHING. On the manor's own front way in,
       * `entrance_approach/N`, "nothing" came to 1,068 lit pixels in a
       * 1068 x 61 band — one hairline lying exactly on the wall-floor line it
       * could not be told apart from — under five hundred pixels of flat
       * black. The document holds a 20.4 m opening onto a court; the picture
       * said unestablished void, and the click travelled through it anyway.
       *
       * What goes through the gap is the GROUND, which is not invented: the
       * destination's own floor plane, drawn by the destination's own facing,
       * which on an open one is ground to its far line and nothing above it —
       * §4b law (b) and row 15's minimal-honest rule unchanged, seen through a
       * mouth instead of from inside it. It is the same composite a doorway
       * onto that same court already makes a few metres east, and the
       * never-void case already demands the ground be there in that one. */
      var isThreshold = a.kind === "threshold";
      if (a.kind && a.kind !== "door" && !isThreshold) continue;
      if (isThreshold) {
        if (!(options && options.no_through)) {
          ctx.save();
          ctx.beginPath();
          /* THE SILL LINE IS THE NEAR ROOM'S, so the mouth is composited ABOVE
           * it and not over it. The mouth's own mark on the ground — the line
           * that says the floor you are standing on ends here and another
           * begins — is drawn by the grid, and a through-view clipped to the
           * whole rectangle painted the far room's floor straight over its
           * last row and rubbed it out. One pixel, and it is the pixel that
           * distinguishes this ground from that one. */
          ctx.rect(a.x, a.y, a.w, Math.max(0, a.h - SILL_PX));
          ctx.clip();
          drawThroughOpening(ctx, a, meta, world, staging, library, backdrops, doc, options);
          ctx.restore();
        }
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(a.x, a.y, a.w, a.h);
      ctx.clip();

      /* Unlit space, and the WALL'S OWN THICKNESS carrying the depth: a
       * reveal down each inside edge and a soffit across the top, lit by the
       * same upper-left key as everything else, so the near jamb face reads
       * brighter than the far one.
       *
       * Not a floor line inside the opening. Two earlier attempts both
       * failed, in opposite ways. Raising a far floor line drew a room one
       * step deeper than the `go` delivers — the picture saying what the
       * document does not. Putting it at this room's own floor line is
       * truthful and draws NOTHING: the aperture rect is the leaf's
       * placement rectangle, whose bottom is the leaf's baseline, which for
       * a `wall_mounted` leaf at `v: 0` is exactly `floor_line_y ·
       * image_h_px` — so the floor fill had zero height and every transverse
       * line fell below the clip. The check written for it passed on the
       * jamb's own bottom stroke. A doorway's thickness is inside the rect
       * by construction, needs no room below the baseline, and claims
       * nothing about the room beyond. */
      ctx.fillStyle = BEYOND_WALL;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      /* And over it, the room that is actually there. The fill above stays as
       * the ground the through-view is composited onto and as what remains
       * where the document names no destination — an aperture to nowhere is a
       * world the validator refuses, so this is a floor under the device, not
       * a second device. */
      if (!(options && options.no_through)) {
        drawThroughOpening(ctx, a, meta, world, staging, library, backdrops, doc, options);
      }

      var reveal = Math.max(3, a.w * 0.14);
      var soffit = Math.max(2, a.w * 0.09);
      // Near jamb (viewer-left, toward the key) catches the light; the far
      // one is barely off the void.
      ctx.fillStyle = REVEAL_NEAR;
      ctx.fillRect(a.x, a.y + soffit, reveal, a.h - soffit);
      ctx.fillStyle = REVEAL_FAR;
      ctx.fillRect(a.x + a.w - reveal * 0.6, a.y + soffit, reveal * 0.6, a.h - soffit);
      ctx.fillStyle = REVEAL_SOFFIT;
      ctx.fillRect(a.x, a.y, a.w, soffit);

      ctx.restore();
      // The jamb, standing proud of the leaf.
      var j = jambOf(a);
      ctx.save();
      ctx.globalAlpha = ALPHA_MAJOR;
      ctx.strokeStyle = meta.key_tint;
      ctx.lineWidth = 2;
      ctx.strokeRect(snap(j.x), snap(j.y), Math.round(j.w), Math.round(j.h));
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
      /* NOTHING HANGS ON A WALL THAT IS NOT THERE. Blueprint §5 law (b): a
       * wall exists only where the building stands, so a `wall_mounted`
       * entity whose span is not on a built band is not in this view.
       *
       * This is in LAYOUT rather than beside `apertures` on purpose. Row 11's
       * first pass put the guard on the aperture alone and the picture still
       * drew the plank: the hole vanished and the door stayed, 11,415 opaque
       * pixels standing in open void, hit-tested, hover-highlighted and
       * toggleable, because the leaf, the opening, the hit region and the
       * keyboard control are four separate code paths reading the same
       * document. One read, here, is what makes them agree — `hitTest` and
       * the page's resolver both walk this list, and `apertures` asks the
       * same question of the same bands. */
      if (facingPlacement.attachment === "wall_mounted" &&
          !spannedByBand(place.x0, place.x1, wallBands(meta), meta)) {
        continue;
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
        hangs: facingPlacement.attachment === "wall_mounted" &&
          (facingPlacement.v || 0) > 0,
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
    rx = Math.max(rx, SHADOW_MIN_RX);
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

  /* Integer canvas rect covering everything a layout entry draws — the body
   * or swap-state image plus every part at both ends of its travel — clamped
   * to the canvas. Used to bound the tint pass's per-pixel work. */
  function drawnRect(e, W, H) {
    var x0, y0, x1, y1;
    if (e.swap) {
      x0 = e.drawX + e.f * e.swap.origin.x;
      y0 = e.drawY + e.f * e.swap.origin.y;
      x1 = x0 + e.swap.image.width * e.f;
      y1 = y0 + e.swap.image.height * e.f;
    } else {
      x0 = e.drawX; y0 = e.drawY;
      x1 = x0 + e.images.body.width * e.f;
      y1 = y0 + e.images.body.height * e.f;
    }
    for (var p = 0; p < e.parts.length; p++) {
      for (var t = 0; t <= 1; t++) {
        var pp = partPlacement(e, e.parts[p], t);
        x0 = Math.min(x0, pp.x); y0 = Math.min(y0, pp.y);
        x1 = Math.max(x1, pp.x + pp.image.width * pp.k);
        y1 = Math.max(y1, pp.y + pp.image.height * pp.k);
      }
    }
    var ix = Math.max(0, Math.floor(x0) - 2);
    var iy = Math.max(0, Math.floor(y0) - 2);
    return {
      x: ix, y: iy,
      w: Math.min(W, Math.ceil(x1) + 2) - ix,
      h: Math.min(H, Math.ceil(y1) + 2) - iy
    };
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
   *   no_through: true — draw no room beyond an opening (row 21). Set by the
   *     through-view itself on the frame it draws INSIDE an opening, so the
   *     recursion stops at one room; a caller may set it to render the void
   *     the device replaced, which is what its ledger case measures against.
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

    var doc0 = target.ownerDocument ||
      (typeof document !== "undefined" ? document : null);

    // Step 1: backdrop or grid (row 1, unchanged).
    if (!options.no_backdrop) {
      if (entry && entry.image) {
        ctx.drawImage(entry.image, 0, 0, W, H);
        /* [Row 21] A painted facing paints its own doorway, its own jamb and
         * its own reveals — §11 requires the painted opening to coincide with
         * the click target, and the meta's measured `openings` is what makes
         * that true by construction. What the painting cannot hold is the room
         * on the other side, which is a fact about the world rather than about
         * this wall: the destination shows through the measured rectangle. */
        var painted = options.no_through ? []
          : apertures(world, staging, library, meta, viewstate);
        for (var ai = 0; ai < painted.length; ai++) {
          drawThroughOpening(ctx, painted[ai], meta, world, staging, library, backdrops, doc0, options);
        }
      } else {
        // The doorway belongs to the wall, not to the entity pass: it is
        // backdrop content (§11) and so must be inside backdrop_only, or a
        // flip pair would differ by a hole in the wall. The grid takes the
        // openings first so it can stand its facing glyph clear of them.
        var openings = apertures(world, staging, library, meta, viewstate);
        drawGrid(ctx, meta, viewstate.facing, W, H, openings);
        drawApertures(ctx, openings, meta, world, staging, library, backdrops, doc0, options);
      }
    }
    if (options.backdrop_only) return target;

    // Steps 2–3: the draw list (placement never branches on options).
    var list = layout(world, staging, library, meta, viewstate);
    if (list.length === 0) return target;

    var doc = doc0;

    for (var i = 0; i < list.length; i++) {
      var e = list[i];

      // (a) Contact shadow — on the scene, before (so under) the composite,
      // never tinted; clipped when the entry is (a cavity content's shadow
      // must not escape the cavity either).
      /* `airborne` is §7's own opt-out, and a wall_mounted placement raised
       * off the floor is the same case by geometry: a pool under something
       * hanging on a wall is a pool in mid-air. At V1 every wall placement
       * sits at v = 0 — the leaf stands on the floor and keeps its
       * contact — so this only bites when §4's licensed `v > 0` is used,
       * which is exactly why it is here before row 4 uses it. */
      if (options.shadows !== false && !e.record.airborne && !e.hangs) {
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
      // Requested with the read hint up front: asking for the same context
      // again with different options is ignored AND warns, once per entity
      // per frame, in the console row 7 is about to make load-bearing.
      var cctx = comp.getContext("2d", { willReadFrequently: true });
      stamp(cctx, e, options);

      // (c) Tint pass on the WHOLE composite (§7 step 6): multiply key_tint
      // at TINT_ALPHA over the drawn pixels — an untinted drawer face on a
      // tinted desk is exactly the divergence one composite prevents.
      //
      // The alpha channel is then copied back BYTE FOR BYTE from the
      // untinted composite. The obvious way to re-clip — `destination-in`
      // with the composite as source — multiplies the two alphas, so a
      // half-transparent pixel comes out at a quarter: it squares every
      // partial alpha in the sprite. Placeholder art is hard-edged and shows
      // nothing, but §9.1's matting feathers 1 px, so every matted edge
      // arriving at rows 3–4 would lose half its alpha and harden into
      // exactly the cut-out silhouette the flip test exists to catch. It
      // also made §12.8's tint clause pass with the tint switched off,
      // because the squaring alone changed the pixels.
      //
      // Bounded to the entity's own drawn rect: this is a per-pixel pass and
      // the frame is 1.5 M pixels.
      var out = comp;
      if (options.tint !== false) {
        var tinted = makeCanvas(doc, W, H);
        var tctx = tinted.getContext("2d", { willReadFrequently: true });
        tctx.drawImage(comp, 0, 0);
        var r = drawnRect(e, W, H);
        tctx.globalCompositeOperation = "multiply";
        tctx.globalAlpha = TINT_ALPHA;
        tctx.fillStyle = meta.key_tint;
        // Only over the entity's own rect: `multiply` composites source-over,
        // so a full-canvas fill leaves TINT_ALPHA of the tint colour lying
        // across the whole frame once the alpha is no longer re-clipped.
        tctx.fillRect(r.x, r.y, r.w, r.h);
        tctx.globalCompositeOperation = "source-over";
        tctx.globalAlpha = 1;
        if (r.w > 0 && r.h > 0) {
          var srcA = cctx.getImageData(r.x, r.y, r.w, r.h);
          var dstA = tctx.getImageData(r.x, r.y, r.w, r.h);
          for (var q = 3; q < dstA.data.length; q += 4) dstA.data[q] = srcA.data[q];
          tctx.putImageData(dstA, r.x, r.y);
        }
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
