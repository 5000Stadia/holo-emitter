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
  function xAtU(u, y, meta, canvasW) {
    return canvasW / 2 + (u - 0.5) * meta.wall_width_m * scaleAtY(y, meta);
  }

  var api = {
    scaleAtY: scaleAtY,
    yAtScale: yAtScale,
    scaleAtDepth: scaleAtDepth,
    yAtDepth: yAtDepth,
    xAtU: xAtU,
    CAMERA_WALL_M: CAMERA_WALL_M
  };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.groundplane = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
