/* groundplane.js — screen-y <-> scale mapping (blueprint §5).
 *
 * Classic script attaching to window.HOLO; the two-line UMD guard at the
 * bottom lets Node `require` the exact same file (row 2's validator imports
 * this — never a re-derivation; pixel truth stays §12.8's).
 *
 * The §5 ground-plane function: for a baseline screen-y between
 * floor_line_y (depth = wall) and 1.0 (depth = nearest), the pixel scale is
 * lerp(px_per_m_at_wall, px_per_m_at_bottom). All functions are pure.
 */
(function () {
  "use strict";

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

  var api = { scaleAtY: scaleAtY, yAtScale: yAtScale };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.groundplane = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
