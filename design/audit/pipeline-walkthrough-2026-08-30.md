# The current image-generation pipeline, phase by phase (2026-08-30)

[Kabe]: "Current setup please. Go deeper in each phase... For each phase
describe in long simple language what the phase does and how it gets there in
detail. I want to really hands on scrutinize the whole process for image gen."

## Phase 0 — The plan (the only hand-made thing)
Declares the world as data; everything downstream derives from it.
packs/<pack>/plan.json draws each room as box units (box_unit_m 6.4 in
pack.json); a wall is a side; an opening is a span with depth_m. voices.json
holds material words. The platform being two box units long is the entire
reason deep views exist (11.2 m camera instead of 4.8 m).

## Phase 1 — The declared camera (geometry before any pixels)
deriveMeta (tools/plan-projection.mjs): camera on the room centreline,
camera_wall_m read off the drawing (law (a)); FOCAL_PX 1024. Similar
triangles: 6.4 m at 11.2 m spans 6.4x1024/11.2 = 585 px, centred -> corners at
columns 475.4/1060.6; floor row 634.3; eye row 526.1; px-per-metre at the wall
91.4. runSpanOf extends side walls across crossed open edges (long-room law).
This is the contract every later phase measures against.

## Phase 2 — The fixture bake and the page
bake-fixtures writes metas into fixtures/<pack>/fixture.js; the emitter runs
headless Chromium on the page and reads meta FROM the page, so packet and
client cannot disagree. A stale fixture refuses by name.

## Phase 3 — The worklist
Art is generated once, promoted once, thereafter read: a promoted backdrop, a
candidate on disk, or a spent retry budget removes a facing from the order,
each reason recorded in the manifest. Store-truth: deleting a promoted pair
makes a wall owed; the loop's RE-DECIDE notices within a pass.

## Phase 4 — The packet (everything the painter sees)
4a. Image 2, the scaffold: ink-on-paper-v2 line drawing computed from the
    meta — lines where surfaces meet, outlined boxes where carriers stand;
    deliberately paper-looking; the prompt says in words what it is not.
4b. Image 1, the content reference, by strict ladder (styleImageFor):
    deep facing -> the true-shape build (warp of best prior roll, revealed
    zones blurred in place; earlier rungs this ladder climbed through:
    uniform draft, corrected-previous, frame lines — see STEPS 16-23);
    normal wall -> a derived style seed (another wall of the room with every
    opening filled in by its own fabric) gated by the seed-gate law: a
    candidate teaches only after its own camera PASS.
4c. Image 3, the edge seed: the 10% strip (154 cols) of the promoted
    neighbour that abuts this picture's edge.
4d. The prompt (frame-language.mjs, g5-noappendix), ordered by what painters
    get wrong most: use case -> 1.20 m gate anchor -> materials -> this
    wall's features -> composition/framing (fully quantitative in plain
    words: "corners about a third in... spans about half the picture's
    width - no closer and no larger") -> medium -> Image-1 clause ->
    constraints (empty room, no text).
4e. The roll table: deterministic ids (rollId), exact save paths. Because ids
    repeat across rounds, readings and latches key on BYTES (sha).

## Phase 5 — The painting act
The seat reads PACKET.md, attaches Images 1/2/3 in order, sends prompt.txt
verbatim, saves to exact paths, never judges. Measured generator behaviour:
obeys materials, light, anchor scale, and object shapes when named (a 0.75
squeezed disc repainted at 0.95 under "a circle stays a circle"); disobeys
the ROOM BOX (25-35% expansion across six reference styles whenever any
margin exists); images out-argue sentences (row 40, seed-gate experiment).

## Phase 6 — The reading (camera instrument)
row35_snap.measure: floor line by foot_of (strongest step within 12 rows
above the shadow minimum); dado band top edge as the 1.20 m ruler; painted
rail px / 1.20 = the painting's own px-per-metre; from that + floor-to-eye
separation, implied focal and eye height; each vs declared in a +/-8% band ->
PASS/FAIL. Cached by candidate sha + instrument id (instrument.py hashes the
measuring code). BLIND SPOT (measured): the ruler sees material scale, not
corner span — a 33%-wide wall with right-sized tiles PASSes camera; only the
warp's corner-read sees the box.

## Phase 7 — The promotion instrument and routing
A camera PASS is not a promotion. The promotion path fits the perspective:
each return must meet the ceiling along ONE straight line, both converging at
the declared eye row (526). No fittable junction -> HELD as unfitted-horizon
with a correction sentence in run-state. Row 32's tolerance ruling ("pretty
close and we can accept a tolerance for drift") lets the DECLARED camera
stand in for the destroyed quantity via the exits. promote-backdrop.mjs
re-checks ruler laws (wall-foot vs eye band); _validate_promoted audits the
stored meta. Held corrections ride --emit-retries (cap 3); the byte-keyed
exit_attempt latch stops retrying identical bytes.

## Phase 8 — The warp exit (the correction step)
Snap the candidate's own landmarks -> pins (source->target) -> per-axis
piecewise resample -> residuals 0.00 px. Revealed pixels (mapping past the
painted frame) are filled by extending each pixel's surface along its own
recession, cross-faded 24 px — THIS is the edge smear; its exact mask is now
saved as revealed.png. The warped frame is re-measured; then the CLOSE gate
[Kabe, L-CLOSE]: the warp may FINISH only within stretch 0.93-1.075 and
reveal <= 8%; beyond, it only TEACHES (frame + mask become the next Image 1)
and the wall stays held. When it does finish, the per-axis squeeze ovals
round objects by exactly the stretch ratio (measured 63/84 = 0.750).

## Phase 9 — Store, bake, publish
backdrops/<loc>/<f>.png + meta (which camera it stands on, warp block,
instrument id). Per-pid bake dirs; publish-site.sh refuses missing manifest
paintings, HEADs every live painting, sha-stamps script URLs and byte-stamps
painting URLs, refuses stale fixtures (re-bake -> commit -> publish again).

## Phase 10 — The client draw
renderer.js draws the standpoint's painting; through an opening, the next
room's painting inside the threshold (far room ends at the leaf's plane,
PASSAGE_SHARE 0.5 of depth_m; sealed seam standard: 1-px randomized
transparency darkening, SEAM_LINE_SHADE 0.11, blur 0.55; two deep). A deep
facing is currently just another stored png — the client does not know it
was ever special.

## Where today's defects live
The oval is born in Phase 8 (per-axis squeeze) but caused in Phase 5 (box
recomposition); the edge smear is Phase 8's reveal fill; "camera PASS but
wall wide" is Phase 6's ruler blind spot; nothing promotes tonight because
Phase 8's CLOSE gate is doing what was ruled.
