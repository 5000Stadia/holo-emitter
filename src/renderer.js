/* renderer.js — pure draw (blueprint §7).
 *
 * render(target, world, staging, library, backdrops, viewstate, options) -> target
 *
 * Pure: inputs only, no module state, no Date/Math.random/global reads; draws
 * onto the passed canvas and returns it. Equal inputs paint equal pixels.
 *
 * Row 1 draws §7 step 1 only — the backdrop layer. `backdrops` maps
 * "location/facing" -> { image, meta }; a facing with no backdrop entry takes
 * the procedural holodeck grid, the §7 product mode for unestablished space
 * (in-fiction and literal; real backdrops later occlude it, never delete it).
 * Steps 2–6 (entities, parts, tint, contact shadows) arrive at row 2.
 *
 * Meta flows as data: the render resolves meta = backdrops[key]?.meta ??
 * GRID_META and the grid draws from that resolved object, never from inline
 * literals — one home feeds grid now and entity math at row 2.
 */
(function () {
  "use strict";

  /* Canonical grid meta (§7 grid mode / §5 shape). key_tint is deliberately
   * non-identity so §12.8's tint assertion is satisfiable on grid backdrops.
   * Tests assert against literals, never against this constant (§12.5's
   * independence rule, applied early). */
  var GRID_META = {
    floor_line_y: 0.63,
    px_per_m_at_wall: 96,
    px_per_m_at_bottom: 210,
    wall_width_m: 4.2,
    key_tint: "#c8b489",
    image_h_px: 1024,
    horizon_y: 0.48,
    key_dir: "UL"
  };

  /* Grid-drawing constants. GRID_K renders the meta, it does not extend it:
   * any k satisfies the meta's two lerp endpoints; 336 px·m is chosen only
   * because it yields a legible transverse line count (three). Colours and
   * alphas are pinned: lines stroke in key_tint at 0.25 (minor) / 0.55
   * (major); glyph strokes at 0.9. */
  var GRID_K = 336;
  var WALL_BASE = "#10141b";
  var FLOOR_BASE = "#0b0e13";
  var ALPHA_MINOR = 0.25;
  var ALPHA_MAJOR = 0.55;
  var ALPHA_GLYPH = 0.9;

  /* Snap a coordinate to the half-integer centre of the pixel row/column
   * containing it, so 1px strokes fill exact pixel rows — crisp and
   * rasteriser-independent. */
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

  function drawGrid(ctx, meta, facing, W, H) {
    var gp = (typeof window !== "undefined" && window.HOLO)
      ? window.HOLO.groundplane : require("./groundplane.js");
    var floorY = meta.floor_line_y * meta.image_h_px;
    var eyeY = meta.horizon_y * meta.image_h_px;
    var sWall = meta.px_per_m_at_wall;
    var sBottom = meta.px_per_m_at_bottom;
    var cx = W / 2; // centre-by-default; a measured wall origin arrives with real meta

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
    // screen-y through the same ground-plane function entities will use.
    var dWall = GRID_K / sWall;
    var dBottom = GRID_K / sBottom;
    for (var d = Math.ceil(dBottom / 0.5) * 0.5; d < dWall; d += 0.5) {
      if (d <= dBottom) continue;
      var ty = snap(gp.yAtScale(GRID_K / d, meta));
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
      var gh = sWall;            // 1m tall at wall scale
      var gw = gh * (2 / 3);
      ctx.globalAlpha = ALPHA_GLYPH;
      ctx.lineWidth = 3;
      strokePolylines(ctx, glyph, cx - gw / 2, eyeY - gh / 2, gw, gh);
      ctx.lineWidth = 1;
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Pure draw: (world, staging, library, backdropMeta, viewstate) -> canvas,
   * §7's tuple completed with a target canvas (a pure function still needs
   * somewhere to draw) and the §7-licensed options argument (debug/test
   * switches — unused at row 1).
   */
  function render(target, world, staging, library, backdrops, viewstate, options) {
    var W = target.width;
    var H = target.height;
    var key = viewstate.location + "/" + viewstate.facing;
    var entry = backdrops ? backdrops[key] : null;
    var meta = (entry && entry.meta) ? entry.meta : GRID_META;
    var ctx = target.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    if (entry && entry.image) {
      ctx.drawImage(entry.image, 0, 0, W, H);
    } else {
      drawGrid(ctx, meta, viewstate.facing, W, H);
    }
    return target;
  }

  var api = { render: render, GRID_META: GRID_META };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.renderer = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
