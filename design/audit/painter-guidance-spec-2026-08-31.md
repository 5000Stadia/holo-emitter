# Painter guidance spec — the seat's own answer (2026-08-31)

[Kabe]: 'ask it how to guide it properly to accomplish the declared visual object'.
Captured verbatim from the holoemitter-assets seat (gpt-5.6-sol xhigh), pane transcript:

• ## 1. Guide-image construction rules
  1. Fix the raster and control points.
      - Canvas: 1536×1024. Never resize or crop it.
      - Far-wall physical-seam centerline corners:
          - top-left: (475,322)
          - top-right: (1060,322)
          - bottom-left: (475,620)
          - bottom-right: (1060,620)
      - Preserve the existing camera, horizon, field of view, vanishing point,
        and near-plane junctions.
      - Treat the far-wall rectangle and the completed near section as locked
        source pixels.
  2. Replace the wireframe with permanent architecture.
      - The two upper red rays become the moulded wall-to-ceiling cornices.
      - The two lower red rays become physical wall-to-floor contact seams with
        narrow occlusion shadows.
      - Add permanent vertical corner seams at x=475 and x=1060, running from
        y=322 to y=620. Use narrow dark ceramic grout or metal angle trim with a
        restrained contact shadow.
      - Continue a horizontal cornice across the far wall between its top
        corners.
      - Continue a horizontal wall-to-floor seam across the far wall between its
        bottom corners.
      - Center every feature on the original red geometry. Give the vertical
        seams enough visual weight to survive generation—approximately 6–8
        pixels at native resolution—but never shift their centerlines.
      - These are finished architectural features, not construction marks. They
        must persist in the output.
  3. Preserve the far wall exactly.
      - Do not regenerate, scale, extend, or blend across its perimeter.
      - Retain its cream upper tiles, green lower tiles, dado, blank enamel
        disc, tile scale, and lighting.
      - Pixels immediately outside its vertical seams must visibly belong to the
        side-wall planes.
      - If masking or compositing is available, exclude the far wall and its
        four perimeter features from the editable mask and composite them back
        after generation.
  4. Pre-fill the ceiling plane completely.
      - Replace every pale ceiling-band pixel with a coarse continuation of the
        broad painted-concrete soffit.
      - Carry the left and right cornices from the completed near section to the
        immutable top corners.
      - Both longitudinal cornices must follow the existing 11.2m projection and
        converge toward the scaffold’s fixed vanishing point.
      - The far-wall cornice remains horizontal between the top corners.
      - Do not leave neutral fill, guide strokes, or ambiguous unassigned
        pixels.
  5. Pre-fill both side-wall planes completely.
      - Above the dado: cream crackle-glazed rectangular tiles, lightly sooted
        toward the ceiling.
      - Below the dado: dark bottle-green glazed tiles.
      - Continue the physical dado cap from the completed near section to its
        existing intersection with each far-wall corner seam.
      - Longitudinal cornice, dado, and grout courses must converge to the same
        fixed vanishing point.
      - Vertical grout joints remain vertical while their spacing and tile width
        diminish monotonically with depth.
      - Match the far-wall tile scale at the terminal seams. Do not use near-
        camera tile scale beside the far wall.
      - Stop side-wall material at the centerlines of the two permanent vertical
        corner seams. Never wrap it onto the far wall.
  6. Pre-fill the floor plane completely.
      - Continue the smooth grey concrete through the entire former pale area.
      - Continue the worn white guidance line from the completed foreground
        toward the fixed vanishing point, narrowing monotonically with depth and
        terminating at the center of the far-wall floor seam.
      - Carry the left and right wall-floor contact seams exactly along the two
        lower red rays to the immutable bottom corners.
      - Add only restrained contact shadowing; do not create skirting, fixtures,
        or floor-mounted objects.
  7. Make plane ownership visually redundant.
     The same geometry must be stated by several independent cues:
      - physical cornices;
      - physical vertical far-wall corner seams;
      - physical floor contact seams;
      - converging dado rails;
      - converging tile courses;
      - diminishing tile spacing;
      - the narrowing floor guidance line;
      - appropriate occlusion shadows.
     No plane boundary should depend on a single thin line.
  8. Leave no unpainted or abstract guide marks.
      - The former pale band must be 100% pre-filled.
      - Remove the black/red construction strokes after replacing them with
        physical features.
      - The prepared guide should already read as a complete, low-detail
        rendering with the correct 11.2m depth.
      - Every visible line in Image 1 must be either material detail or
        permanent architecture. The generator must never be asked to erase a
        geometry-bearing mark.
  9. Enforce exactness outside the generator.
     Prompting cannot guarantee pixel-exact geometry. If “exactly” is literal:
      - lock the completed near section and far wall with an edit mask;
      - lock the four corner seams and cornice/floor boundary layer;
      - restrict generated pixels to the pre-filled continuation planes;
      - composite the locked pixels and physical-boundary layer back over the
        return.
  ## 2. Exact replacement ask
  Correction on the previous attempt at this exact wall. This is constrained
  surface completion of Image 1, not scene generation, redesign, or
  recomposition.
  Use Image 1 at its native 1536 by 1024 resolution. Its camera position, field
  of view, horizon, vanishing point, composition, room depth, plane assignments,
  and architectural boundaries are final and immutable. Do not crop, resize,
  zoom, translate, widen, narrow, deepen, shorten, or recompose the image.
  The camera-to-far-wall distance is exactly 11.2 metres. Preserve that
  unusually long depth even if a shorter, more conventionally proportioned room
  would look more familiar.
  At the native 1536 by 1024 resolution, the immutable far-wall corner-seam
  centerlines are:
  top-left (475,322);
  top-right (1060,322);
  bottom-left (475,620);
  bottom-right (1060,620).
  Those four points are fixed control points. The far wall remains exactly
  inside the rectangle they define. Do not move any corner. Do not change the
  far wall’s width, height, scale, or apparent distance. Do not extend front-
  facing far-wall material beyond either vertical corner seam. Pixels
  immediately left of the left seam belong to the left side wall. Pixels
  immediately right of the right seam belong to the right side wall. They must
  never be interpreted or painted as additional far wall.
  The completed near section and the existing far wall are finished source
  material. Preserve them. The far wall’s cream tiles, green lower tiles,
  horizontal dado, blank enamel disc, tile scale, lighting, and position must
  remain unchanged. A circle stays a circle at the same size and position.
  Every pixel in the prepared continuation area already belongs to its final
  plane. Preserve those plane assignments:
  the upper plane is ceiling;
  the lower plane is floor;
  the left polygon is the left side wall;
  the right polygon is the right side wall;
  the central rectangle bounded by the four fixed corner seams is the far wall.
  Never reassign pixels from one plane to another.
  All visible boundaries in Image 1 are permanent physical architecture, not
  temporary guide marks. Preserve them on their existing centerlines:
  the two converging wall-to-ceiling cornices;
  the two converging wall-to-floor contact seams;
  the left and right vertical far-wall corner seams;
  the horizontal cornice across the top of the far wall;
  the horizontal contact seam across the bottom of the far wall;
  and the continuous dado rail.
  Do not erase, relocate, straighten, relax, replace, or reinterpret any of
  these features.
  Finish only the surface quality of the already pre-filled continuation planes.
  Continue the existing convergence exactly. The longitudinal cornices, dado
  rails, grout courses, floor seams, and white floor guidance line must retain
  the fixed vanishing point shown in Image 1. Side-wall tile spacing must
  continue diminishing toward the far wall. The white floor guidance line must
  continue narrowing toward the fixed center of the far-wall floor seam. Do not
  regularize this perspective into a shorter room.
  Geometry takes priority over seamlessness, realism, symmetry, and conventional
  room proportions. If a texture transition conflicts with the fixed geometry,
  keep the geometry and resolve the texture only within its existing plane.
  Never solve a mismatch by moving a corner, extending the far wall, changing a
  plane boundary, or repainting finished material.
  The room remains completely empty: no furniture, nobody, and no loose props.
  No legible text anywhere. Add no light fixtures, fans, ceiling-mounted
  objects, or floor-mounted objects. The room is lit evenly and warmly as if by
  lamps outside the frame.
  Maintain the established fabric:
  cream crackle-glazed rectangular wall tiles above the dado, lightly sooted
  toward the top;
  dark bottle-green glazed tiles below the dado;
  a broad flat-painted concrete soffit springing from the moulded cornice;
  smooth grey concrete underfoot;
  and one worn white painted guidance line running down the room.
  Return the same 1536 by 1024 composition with the fixed 11.2 metre RED
  geometry intact. Surface completion is permitted. Geometric reinterpretation
  is not.
─ Worked for 2m 31s ────────────────────────────────────────────────────────────
› Ask Codex to do anything
  gpt-5.6-sol xhigh · ~/Projects/holo-emitter
