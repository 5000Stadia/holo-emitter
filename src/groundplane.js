/* groundplane.js — screen-y <-> scale mapping (blueprint §5).
 *
 * Classic script attaching to window.HOLO; the two-line UMD guard at the
 * bottom lets Node `require` the exact same file (row 2's validator imports
 * this — never a re-derivation; pixel truth stays §12.8's).
 *
 * The §5 ground-plane function: for a baseline screen-y between
 * floor_line_y (depth = wall) and 1.0 (depth = nearest), the pixel scale is
 * lerp(px_per_m_at_wall, px_per_m_at_bottom). All functions are pure.
 *
 * Depth (row 2): §5's "convert depth_m -> baseline-y by inverse lerp" is
 * completed [AI] with a pinhole anchored at the wall — scale(d) =
 * px_per_m_at_wall * camera_wall_m / (camera_wall_m - d), d in metres from
 * the wall toward the camera — then y through yAtScale (the inverse lerp).
 * CAMERA_WALL_M = 3.5 is the grid-canonical camera-to-wall distance (it is
 * what row 1's GRID_K = 336 = 96 * 3.5 already meant); a measured backdrop
 * meta may carry its own `camera_wall_m` field, which wins. The completion
 * is flagged to Kabe in blueprint §5's [AI] note; §12.5's V1 green witnesses
 * implementation-against-model, not model-against-intent.
 *
 * u-mapping (pinned at row 1, homed here at row 2 because the validator's
 * overlap check must import it): u in [0,1] spans the central wall_width_m
 * metres; x(u, y) = cx + (u - 0.5) * wall_width_m * scaleAtY(y), cx
 * centre-by-default (canvasW / 2; a measured wall origin arrives with real
 * meta at row 4).
 */
(function () {
  "use strict";

  var CAMERA_WALL_M = 3.5;

  /**
   * Pixels per metre at a baseline screen-y.
   * @param {number} y      baseline screen-y in pixels (canvas space)
   * @param {object} meta   §5 backdrop meta (floor_line_y, px_per_m_at_wall,
   *                        px_per_m_at_bottom, image_h_px)
   * @returns {number} pixels per metre at that baseline
   */
  function scaleAtY(y, meta) {
    var floorY = meta.floor_line_y * meta.image_h_px;
    var t = (y - floorY) / (meta.image_h_px - floorY);
    return meta.px_per_m_at_wall +
      t * (meta.px_per_m_at_bottom - meta.px_per_m_at_wall);
  }

  /**
   * Inverse of scaleAtY: the baseline screen-y at which the ground plane has
   * the given pixel scale.
   */
  function yAtScale(scale, meta) {
    var floorY = meta.floor_line_y * meta.image_h_px;
    var t = (scale - meta.px_per_m_at_wall) /
      (meta.px_per_m_at_bottom - meta.px_per_m_at_wall);
    return floorY + t * (meta.image_h_px - floorY);
  }

  /**
   * Pixels per metre for a floor point depth_m metres in front of the wall
   * (pinhole anchored at the wall plane; see header note).
   */
  function scaleAtDepth(depthM, meta) {
    var cam = (meta && meta.camera_wall_m != null) ? meta.camera_wall_m : CAMERA_WALL_M;
    return meta.px_per_m_at_wall * cam / (cam - depthM);
  }

  /** Baseline screen-y for a floor point depth_m in front of the wall. */
  function yAtDepth(depthM, meta) {
    return yAtScale(scaleAtDepth(depthM, meta), meta);
  }

  /**
   * Screen x for staging u at baseline y: u in [0,1] spans the central
   * wall_width_m metres, centre-by-default.
   */
  function xAtScale(u, s, meta, canvasW) {
    return canvasW / 2 + (u - 0.5) * meta.wall_width_m * s;
  }

  function xAtU(u, y, meta, canvasW) {
    return xAtScale(u, scaleAtY(y, meta), meta, canvasW);
  }

  /**
   * placeHost — the ONE home of §4/§5 placement for a directly-staged
   * entity. The renderer's layout and the fixture validator's static overlap
   * check both call this, so the static guarantee is bound to the pixels the
   * renderer actually draws: change placement here and both move together
   * (row 2's finding — importing scaleAtY while re-deriving the placement
   * layer above it left the validator asserting overlaps in a world the
   * renderer no longer drew).
   *
   * @param {object} placement §4 facing-placement (attachment, u, v, depth_m)
   * @param {object} record    §6 sprite record (dims_m, px, anchors)
   * @param {object} meta      §5 backdrop meta
   * @param {number} canvasW   logical canvas width (the §5 pinned 1536)
   * @returns {object|null} { baselineY, s, heightPx, f, baseX, drawX, drawY,
   *                          x0, x1, y0, y1 } — the last four the footprint
   *                          x-span and the vertical span, in scene px; null
   *                          for an unknown attachment token.
   *
   * Scale by attachment class: floor placements take the ground-plane scale
   * at their baseline; a wall_mounted placement hangs ON the wall plane, so
   * it takes px_per_m_at_wall whatever its height above the floor line — the
   * ground-plane lerp describes the FLOOR, and reading it at a raised
   * baseline shrinks a hung object by the amount it was raised.
   */
  function placeHost(placement, record, meta, canvasW) {
    var baselineY, s;
    if (placement.attachment === "floor_against") {
      baselineY = yAtDepth(record.dims_m.d, meta);
      s = scaleAtY(baselineY, meta);
    } else if (placement.attachment === "floor_free") {
      baselineY = yAtDepth(placement.depth_m, meta);
      s = scaleAtY(baselineY, meta);
    } else if (placement.attachment === "wall_mounted") {
      // v is METRES above the wall floor line (u and t are normalized, v is
      // not — a §4 completion); the wall plane fixes the scale.
      baselineY = meta.floor_line_y * meta.image_h_px -
        (placement.v || 0) * meta.px_per_m_at_wall;
      s = meta.px_per_m_at_wall;
    } else {
      return null;
    }
    var heightPx = record.dims_m.h * s;
    var f = heightPx / record.px.h;
    // The u-mapping spans wall_width_m at the placement's own scale, so a
    // hung object's x is fixed on the wall too.
    var baseX = xAtScale(placement.u, s, meta, canvasW);
    var drawX = baseX - f * record.anchors.base.x;
    var drawY = baselineY - f * record.anchors.base.y;
    return {
      baselineY: baselineY,
      s: s,
      heightPx: heightPx,
      f: f,
      baseX: baseX,
      drawX: drawX,
      drawY: drawY,
      x0: drawX + f * record.anchors.footprint.x0,
      x1: drawX + f * record.anchors.footprint.x1,
      y0: baselineY - heightPx,
      y1: baselineY
    };
  }

  var api = {
    scaleAtY: scaleAtY,
    yAtScale: yAtScale,
    scaleAtDepth: scaleAtDepth,
    yAtDepth: yAtDepth,
    xAtU: xAtU,
    xAtScale: xAtScale,
    placeHost: placeHost,
    CAMERA_WALL_M: CAMERA_WALL_M
  };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.groundplane = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
