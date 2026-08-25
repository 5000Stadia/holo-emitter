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
 * CAMERA_WALL_M (4.0 m since row 20) is the named home of the unplanned-facing
 * fallback meta's own camera distance. It is NOT a default for anyone else:
 * since row 11 every meta names its own depth anchor, and one that names none
 * is an error rather than a silent fallback (see cameraDistance). Under row
 * 20's pinned lens `scaleAtDepth` reduces to f / distance, so this function IS
 * a pinhole rather than a completion of one — blueprint §5's [AI] note is
 * rewritten to say so.
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

  /* THE LENS (row 20). Blueprint §10's ruling [HUMAN, 2026-08-21, "full steam
   * ahead"]: interiors render at a pinned LENS, not a pinned scale —
   * f = 1024 px on the 1536-wide frame, so `px_per_m_at_wall = FOCAL_PX /
   * cameraDistance(meta)` and the scale is a per-facing consequence rather
   * than a constant.
   *
   * The frame is EXACTLY the 36×24 mm still format in proportion (1536×1024 is
   * 3:2), so a focal length in millimetres transfers with no crop factor:
   * FOCAL_PX = FOCAL_MM × canvasW / FRAME_W_MM = 24 × 1536 / 36 = 1024 px, an
   * exact integer. hFOV = 2·atan(768/1024) = 73.74°.
   *
   * The authored home of the millimetres is `replicator/contract.json`
   * `camera.focal_mm` (blueprint §10, [HUMAN]); `assertRuledLens` in
   * tools/plan-projection.mjs pins this constant to that file and the bake
   * refuses when they drift, so the number here is bound to a document rather
   * than merely agreeing with one.
   *
   * WHAT PINNING IT BUYS, in one line: the implied focal length used to run
   * 187 px → 2014 px across the manor — a 4 mm fisheye to a 47 mm normal, a
   * different lens on every facing — and that is what made every direction of
   * the study read as a corridor.
   *
   * AND THE MODEL COLLAPSES TO ONE PINHOLE. A floor point at distance d draws
   * at y = horizon_px + f·eye/d and at scale f/d, so scale(y) = (y −
   * horizon_px)/eye: linear in y, zero exactly at the authored horizon, and
   * `scaleAtDepth` reduces to f/(cam − d) = f/distance. §5's scale lerp and
   * §5's horizon device were already one camera per facing since row 11; what
   * this changes is that it is now the SAME camera on every facing. */
  var FOCAL_MM = 24;
  var FRAME_W_MM = 36;
  var CANVAS_W_PX = 1536;
  var FOCAL_PX = FOCAL_MM * CANVAS_W_PX / FRAME_W_MM;   // 1024, exactly

  /* The unplanned-facing fallback's own camera distance. 4.0 m rather than
   * row 1's 3.5: under a pinned lens every other number in that meta is
   * derived from it, and 4.0 makes the scale an exact decimal a human can
   * check in the blueprint (256 px/m) where 3.5 gives 292.57142857142856.
   * `floor_line_y` is 0.809520 at the measured eye — no longer a round
   * number, because the eye stopped being an authored one and became a
   * measurement off the approved picture. It is a choice about space nobody has drawn, and
   * nothing the demo renders resolves to it. */
  var CAMERA_WALL_M = 4.0;

  /* THE CAMERA THIS PROJECT DRAWS AT, measured off the approved backdrops
   * rather than authored (row 20). Blueprint §5 [HUMAN, 2026-08-20]: "The
   * geometry elements should be determined by the orientation of the approved
   * initial image generation." That generation arrived, Kabe approved it, and
   * it was measured off its own pixels — `design/plan-draft/measured/`, a
   * re-runnable harness whose control reproduces the probe's own read of this
   * image: the horizon at y 524.4 of 1024 and the eye 1.08775 m above the
   * floor, with no pitch. The principal point sits ABOVE frame centre, the
   * opposite sign to §10's −8°.
   *
   * WHICH HORIZON, and why this one. Two instruments measure it and they
   * disagree by up to 66 px across the eight approved backdrops: a
   * vanishing-point vote over Sobel gradients, and a robust fit of the two
   * side-wall/ceiling junctions — lines parallel to the view axis, which must
   * therefore converge ON the horizon. The Navigator ruled the ramp fit on its
   * evidence: 0.29–0.34 px residual over 61 columns a side, against a vote
   * whose three regions scatter by 30 px; and adopting it makes the study's
   * four independently generated frames agree about their eye height 2.6×
   * better (spread 0.131 m against 0.346 m). Nothing was regenerated for it.
   *
   * THE STANDING-EYE WAVE MOVED BOTH NUMBERS, and it is the one thing in this
   * comment that is not row 20's. [HUMAN 2026-08-22, design/approvals.log at
   * 964188d] ruled "B" — the standing eye — over the low-eye frame row 21
   * promoted, on interaction visibility over mood. The camera that ruling
   * names is `backdrops/source/study-N/cand-5-reference.png`, and it was
   * measured by the same harness and the same ruled instrument:
   * `design/plan-draft/measured/measure.py --round cand5ref`, whose reference
   * set is `measured/cand5ref/study-N.json`. The horizon is the ceiling-ramp
   * intersection at y 526.1 of 1024 (residual 0.30/0.29 px over 61 columns a
   * side) and the eye is 1.183 m — 1.7 px and 0.095 m from row 20's, which is
   * the honest size of what "the standing eye" bought at this generator: the
   * frame shows more floor because the LENS widened, not because the camera
   * rose. The old numbers were 1.08775 m and 524.4/1024; the anchor is the
   * chair-rail rather than the fireplace, and those two rulers agree on the
   * reference frame to 1.43 %.
   *
   * This supersedes row 11's 1.60 m, which was named an interim awaiting
   * exactly this measurement. §10's ruled 1.83 m is the GENERATION camera and
   * is untouched — the generator was asked for it on all eight and drew about
   * 1.1–1.5 m every time, and that divergence is recorded rather than
   * corrected, because §5 makes the approved image the authority and §10's
   * field is [HUMAN]. The intention's fifth quality asks for a CONSISTENT eye
   * height, and measurement delivers one; it is simply not the height the
   * briefs name.
   *
   * What the lower camera buys is that quality's other half: the frame bottom
   * cuts the floor at 2.23 m instead of the 3.08 m every 24 mm preview frame
   * drew. `horizon_y` is the lens SHIFT (a level camera with its frame moved,
   * not a tilted one), and it stays one. */
  var DRAWING_EYE_M = 1.183;
  var HORIZON_Y = 526.1 / 1024;

  /** Pixels per metre at the wall plane, for a camera-to-plane distance. */
  function pxPerMAtWall(distanceM) { return FOCAL_PX / distanceM; }

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

  /**
   * The focal length this meta implies, in pixels — `px_per_m_at_wall` × the
   * distance to the plane that scale is quoted at.
   *
   * On a DERIVED meta this is FOCAL_PX by construction, and the row that
   * pinned the lens says so out loud rather than counting it as a green gate.
   * On a MEASURED backdrop meta it is evidence: the scale is read off the
   * painting and the distance is read off the approved drawing, so their
   * product is a claim about a picture that can be wrong.
   */
  function focalPx(meta) {
    return meta.px_per_m_at_wall * cameraDistance(meta);
  }

  /** Baseline screen-y for a floor point depth_m in front of the wall. */
  function yAtDepth(depthM, meta) {
    return yAtScale(scaleAtDepth(depthM, meta), meta);
  }

  /**
   * [Row 15] A POINT AT A HEIGHT, at a depth — the one thing this module could
   * not do, and what a flight of stairs is made of.
   *
   * Everything before this row sat on the ground: `yAtDepth` is the floor at
   * `depth_m`, and a `wall_mounted` object's height is read at WALL scale
   * because the ground-plane lerp describes the floor and reading it at a
   * raised baseline shrinks the object by the amount it was raised (row 2 paid
   * 30 % at v = 1.0 for that). Neither answers "where does a point `h` metres
   * above the floor, `d` metres in front of the wall, draw".
   *
   * Under row 20's pinned lens it is one line. A floor point at distance `D`
   * from the camera draws at `y = horizon + eye·f/D` and at scale `f/D`, so a
   * point `h` above it draws `h·(f/D)` higher:
   *
   *     y = horizon + (eye − h) · scale
   *
   * and `yAtScale` already IS `horizon + eye·scale` in this model, so the term
   * subtracted is exactly `h · scaleAtDepth(d)`. Written here rather than
   * inline in the renderer because this project has twice paid for a private
   * copy of geometry that lives in this file, and because it is the term a
   * displacement test can move.
   *
   * A point at eye height draws ON the horizon and one above it draws above,
   * with the spacing between equal steps WIDENING as they rise — which is what
   * a staircase does and what a staircase painted flat on the floor does not.
   */
  function yAtHeight(depthM, heightM, meta) {
    var s = scaleAtDepth(depthM, meta);
    return yAtScale(s, meta) - heightM * s;
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

  /* [Row 26] How far the EYE stands to the side of the room's own cross-axis
   * centre, in metres, signed the way `u` is. Zero everywhere but the two
   * facings row 26's lateral slide moves, and absent from every meta that does
   * not need it — so `|| 0` is the reading, not a default standing in for a
   * missing field. */
  function eyeOffsetM(meta) {
    return (meta && typeof meta.eye_offset_m === "number") ? meta.eye_offset_m : 0;
  }

  function wallCentrePx(meta, canvasW) {
    if (hasCorners(meta)) return (meta.corner_x0_px + meta.corner_x1_px) / 2;
    if (meta && meta.wall_x0_px != null) {
      return meta.wall_x0_px + meta.wall_width_m * meta.px_per_m_at_wall / 2;
    }
    /* [Row 26] The wall's centre AT THE WALL PLANE, which is not the frame's
     * centre once the eye has slid: a body δ metres to the right sees the
     * wall's centre δ·px_per_m_at_wall pixels to the left. Corners and
     * `wall_x0_px` already state that in pixels where they exist — a derived
     * meta's corners come back through `xAtScale` at wall scale and carry it
     * by construction, a measured one's are what someone measured off the
     * painting — so this arm is the only one that has to add it. */
    return canvasW / 2 - eyeOffsetM(meta) * meta.px_per_m_at_wall;
  }

  /**
   * Screen x for staging u at scale s. u in [0,1] spans the wall — corner to
   * corner where the meta knows its corners, the central wall_width_m metres
   * otherwise.
   *
   * The span is stated at the WALL plane and rescaled by s / px_per_m_at_wall,
   * which is the same thing the old `wall_width_m * s` said and stays true
   * when the span comes from measured corners instead of from a width.
   *
   * [ROW 26] AND THE LAST TERM IS THE EYE, WHICH IS NOT A PIXEL OFFSET. A body
   * standing δ metres to the side of the room's axis moves a point at scale
   * `s` by `−δ·s` — a DEPTH-DEPENDENT shift, because the eye is a position and
   * not a slide of the picture. Shifting `wallCentrePx` alone moves every
   * depth by the same pixel count, which is true only at the wall plane: the
   * floor, the flights and everything standing in the room would shear against
   * the wall behind them. So the wall-plane half lives in `wallCentrePx` and
   * this term supplies the rest, `−δ·(s − px_per_m_at_wall)`, which is zero at
   * the wall plane and zero on every meta with no offset. Together they are
   * `canvasW/2 + ((u−0.5)·span_m − δ)·s`, whichever arm named the centre —
   * so a meta whose corners already carry the shift is not counted twice.
   */
  function xAtScale(u, s, meta, canvasW) {
    return wallCentrePx(meta, canvasW) +
      (u - 0.5) * wallSpanPxAtWall(meta) * (s / meta.px_per_m_at_wall) -
      eyeOffsetM(meta) * (s - meta.px_per_m_at_wall);
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
   * [Row 15] WHAT AN EXIT'S `via` NAMES, resolved in one place.
   *
   * `world.json`'s exits say what you pass through, and there are three kinds
   * of thing that can be named. A LEAF is an entity, and the caller resolves
   * that first because a door the player has not been told about must leave no
   * hole (row 21). The other two are facts about the BUILDING and live in the
   * facing's own §5 meta:
   *
   *   - an opening whose `via` is that entity — a hole a leaf fills;
   *   - an opening, threshold or stair addressed by the PLAN'S OWN NAME for
   *     it (`id`), because 25 of the manor's 26 openings carry no entity and
   *     both of its stairs never will.
   *
   * The alternative — writing an `entity` onto every opening in `plan.json` —
   * moves the drawn digest of the drawing Kabe approved, which is a redline
   * that ends at a human, for a change no human asked for.
   *
   * `via` keeps meaning "the entity that fills it, or null" and `id` keeps
   * meaning "the plan's name for this hole", so a meta still reports the two
   * doorways in the cross passage that no exit walks through as geometry with
   * `via: null`. The ORDER is fixed: an id that is also an entity id resolves
   * to the entity, because a leaf governs the hole it stands in.
   *
   * The renderer and the fixture validator both call this. Two copies of a
   * lookup is how row 2 paid twice for a private inverse of `xAtScale`.
   */
  function openingFor(meta, via) {
    if (!meta || via == null) return null;
    var list = (meta.openings || []).concat(meta.stairs || []);
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].via != null && list[i].via === via) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === via) return list[i];
    }
    return null;
  }

  /**
   * [ROW 42] leafFor(world, via) -> entity | null — WHICH ENTITY FILLS THE HOLE
   * `via` NAMES, and the one home of that question.
   *
   * `openingFor` above resolves `via` to a hole in the BUILDING. This resolves
   * the same token to the LEAF standing in it, and the two are separate
   * lookups because the manor names its exits after the plan's own openings
   * (`op01`) while the study names its after the leaf (`door1`). Both readings
   * are live and both must keep working:
   *
   *   - `via` IS the entity's id — the row-2 world, where an exit walks through
   *     a door the document declares and the plan's opening carries `via:
   *     "door1"` to say which hole that is;
   *   - the entity declares `fills: "<opening id>"` — row 42's binding, which
   *     is what lets a leaf be hung in a doorway the PLAN named and the
   *     PAINTING measured without rewriting 26 exits or the approved drawing.
   *
   * Three readers call this and none may re-derive it: the renderer (which hole
   * has a leaf in it), the harness (a shut leaf refuses `go`) and the fixture
   * validator (a transition entity is staged in exactly the locations whose
   * exits name it). Row 21 paid for that lesson from the other side — the leaf,
   * the opening, the hit region and the keyboard control were four code paths
   * reading one document, and a plank stood in open void because they
   * disagreed.
   *
   * The order is fixed and matches `openingFor`'s: an id that names an entity
   * wins, because a leaf governs the hole it stands in.
   */
  function leafFor(world, via) {
    if (!world || via == null) return null;
    var ents = world.entities || [];
    var i;
    for (i = 0; i < ents.length; i++) if (ents[i] && ents[i].id === via) return ents[i];
    for (i = 0; i < ents.length; i++) if (ents[i] && ents[i].fills === via) return ents[i];
    return null;
  }

  /**
   * [ROW 42] windowFor(meta, id) — the painted WINDOW `id` names in this
   * facing's meta, or null. `meta.windows` is the promotion's record of where
   * `window_measure.py` read each glazed opening off the painting, and it is
   * absent on every wall measured before row 42 — so "not found" is the common
   * case and it is a silence, never a zero.
   */
  function windowFor(meta, id) {
    if (!meta || id == null) return null;
    var list = (meta && meta.windows) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  /**
   * [ROW 42] apertureRect(meta, entity) -> { x, y, w, h } | null — THE RECTANGLE
   * THE PAINTING MEASURED for the hole this entity fills.
   *
   * [HUMAN, 2026-08-24, verbatim] "Then we can have door assets and window
   * assets we literally place in the door frame to open/close and same with the
   * windows possibly" — so the leaf's rectangle is the DETECTED frame, not the
   * plan's. `door_measure.py` (row 27) and `window_measure.py` (row 42) read
   * those two frames off the approved image and the promotion writes them into
   * `meta.openings` / `meta.windows` with `measured: true`.
   *
   * MEASURED, AND ONLY MEASURED. A derived meta's opening is the PLAN's
   * rectangle wearing the same field names, and fitting a leaf to it would be
   * this function claiming a measurement nobody took — on `entrance_court/N`
   * that plan rectangle is 1.60 m wide where the painting of the other side of
   * the same doorway draws 0.71 m. So an unmeasured facing returns null and its
   * leaf stands where §4 puts it, exactly as it did before this row; the leaf
   * moves onto the paint the day that wall is promoted, and not before.
   *
   * The caller decides what null MEANS, because the two kinds of aperture
   * answer differently: a doorway is architecture the plan guarantees and its
   * leaf falls back to §4 placement, while a casement on a wall whose glass
   * nobody has measured is exactly the sprite-on-blank-paint the promotion's
   * `window.unpainted` clause refuses, so the renderer refuses it too.
   */
  function apertureRect(meta, entity) {
    if (!meta || !entity || entity.fills == null) return null;
    var r = (entity.kind === "window")
      ? windowFor(meta, entity.fills)
      : openingFor(meta, entity.fills);
    if (!r || r.measured !== true) return null;
    if (!(r.w > 0) || !(r.h > 0)) return null;
    return { x: r.x, y: r.y, w: r.w, h: r.h };
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
    yAtHeight: yAtHeight,
    xAtU: xAtU,
    xAtScale: xAtScale,
    uDomain: uDomain,
    openingFor: openingFor,
    leafFor: leafFor,
    windowFor: windowFor,
    apertureRect: apertureRect,
    hasCorners: hasCorners,
    wallSpanPxAtWall: wallSpanPxAtWall,
    wallCentrePx: wallCentrePx,
    cameraDistance: cameraDistance,
    focalPx: focalPx,
    pxPerMAtWall: pxPerMAtWall,
    placeHost: placeHost,
    CAMERA_WALL_M: CAMERA_WALL_M,
    DRAWING_EYE_M: DRAWING_EYE_M,
    HORIZON_Y: HORIZON_Y,
    FOCAL_MM: FOCAL_MM,
    FRAME_W_MM: FRAME_W_MM,
    FOCAL_PX: FOCAL_PX
  };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.groundplane = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
