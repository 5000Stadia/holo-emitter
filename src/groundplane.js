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
 * CAMERA_WALL_M = 3.5 is the named home of the unplanned-facing fallback
 * meta's own camera distance (it is what row 1's GRID_K = 336 = 96 * 3.5
 * already meant). It is NOT a default for anyone else: since row 11 every
 * meta names its own depth anchor, and one that names none is an error rather
 * than a silent 3.5 m (see cameraDistance). The completion
 * is flagged to Kabe in blueprint §5's [AI] note; §12.5's V1 green witnesses
 * implementation-against-model, not model-against-intent.
 *
 * u-mapping (pinned at row 1, homed here at row 2 because the validator's
 * overlap check must import it): u in [0,1] spans the central wall_width_m
 * metres; x(u, y) = cx + (u - 0.5) * wall_width_m * scaleAtY(y), cx
 * centre-by-default (canvasW / 2; a measured wall origin arrives with real
 * meta at row 4).
 *
 * Corner-bounded u-domain (row 11). A meta that knows where its wall ENDS
 * carries `corner_x0_px` / `corner_x1_px`, and then the u-domain IS the wall
 * between them: the centre and the span come from the corners rather than
 * from canvasW/2 and wall_width_m. On every meta this project can produce
 * today the two readings give the same number to the last bit — the corners
 * are xAtScale(0) and xAtScale(1) at wall scale by construction — so nothing
 * moves by this alone. What it buys is that the corner verticals the renderer
 * draws and the u the staging addresses are ONE arithmetic: row 2 paid twice
 * for a placement layer re-derived beside the function it should have called,
 * and row 12's critic caught the same shape a third time in deriveMeta.
 *
 * Where a meta has no corners — an unplanned facing, or a view that is part
 * building and part open ground — the domain spans wall_width_m with no
 * clamp, and `wall_segments` is what says where the building actually is.
 * That is the stated rule, not a fallthrough.
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
   * The distance from the camera to the plane (or the drawn far line) this
   * facing's depths are measured against.
   *
   * TYPED, and with no silent tail (row 11). An `enclosed` or `corridor`
   * facing views a wall plane and carries `camera_wall_m`; an `open` facing
   * views a drawn ground line with no surface on it and carries
   * `camera_far_m` INSTEAD — the field name is different rather than merely
   * differently-valued precisely so a consumer has to handle it. Until row 11
   * this function ended `?? CAMERA_WALL_M`, which handed a 20.4 m courtyard a
   * 3.5 m wall distance in silence. A meta naming neither is an error the
   * caller sees, not a default it never learns about.
   */
  function cameraDistance(meta) {
    if (meta) {
      if (meta.camera_wall_m != null) return meta.camera_wall_m;
      if (meta.camera_far_m != null) return meta.camera_far_m;
    }
    throw new Error(
      "meta carries neither camera_wall_m nor camera_far_m — a facing with no " +
      "depth anchor cannot be projected (blueprint §5)");
  }

  /**
   * Pixels per metre for a floor point depth_m metres in front of the wall
   * (pinhole anchored at the wall plane; see header note).
   */
  function scaleAtDepth(depthM, meta) {
    var cam = cameraDistance(meta);
    return meta.px_per_m_at_wall * cam / (cam - depthM);
  }

  /** Baseline screen-y for a floor point depth_m in front of the wall. */
  function yAtDepth(depthM, meta) {
    return yAtScale(scaleAtDepth(depthM, meta), meta);
  }

  /* Has this meta been told where its wall ends? */
  function hasCorners(meta) {
    return meta != null &&
      typeof meta.corner_x0_px === "number" &&
      typeof meta.corner_x1_px === "number";
  }

  /**
   * The wall's span in pixels AT THE WALL PLANE, and the screen x of its
   * centre. Corners win where they exist; §5's `wall_x0_px` extension point
   * (a measured origin for an uncentred wall) is next; centre-by-default
   * last.
   */
  function wallSpanPxAtWall(meta) {
    if (hasCorners(meta)) return meta.corner_x1_px - meta.corner_x0_px;
    return meta.wall_width_m * meta.px_per_m_at_wall;
  }

  function wallCentrePx(meta, canvasW) {
    if (hasCorners(meta)) return (meta.corner_x0_px + meta.corner_x1_px) / 2;
    if (meta && meta.wall_x0_px != null) {
      return meta.wall_x0_px + meta.wall_width_m * meta.px_per_m_at_wall / 2;
    }
    return canvasW / 2;
  }

  /**
   * Screen x for staging u at scale s. u in [0,1] spans the wall — corner to
   * corner where the meta knows its corners, the central wall_width_m metres
   * otherwise.
   *
   * The span is stated at the WALL plane and rescaled by s / px_per_m_at_wall,
   * which is the same thing the old `wall_width_m * s` said and stays true
   * when the span comes from measured corners instead of from a width.
   */
  function xAtScale(u, s, meta, canvasW) {
    return wallCentrePx(meta, canvasW) +
      (u - 0.5) * wallSpanPxAtWall(meta) * (s / meta.px_per_m_at_wall);
  }

  /**
   * uDomain(meta, s, canvasW) -> { x0, x1 } — where the room's own wall stands
   * at scale s. The renderer clips the facing wall and the floor with it and
   * the fixture validator checks placements against it ("staging never
   * addresses wall that does not exist").
   *
   * It is NOT a render-time clamp that slides an out-of-room object back
   * inside: a picture that quietly moves what the document placed is the same
   * lie as one that ignores it. Out-of-room staging is a validator finding.
   */
  function uDomain(meta, s, canvasW) {
    return { x0: xAtScale(0, s, meta, canvasW), x1: xAtScale(1, s, meta, canvasW) };
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
    uDomain: uDomain,
    hasCorners: hasCorners,
    wallSpanPxAtWall: wallSpanPxAtWall,
    wallCentrePx: wallCentrePx,
    cameraDistance: cameraDistance,
    placeHost: placeHost,
    CAMERA_WALL_M: CAMERA_WALL_M
  };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.groundplane = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
