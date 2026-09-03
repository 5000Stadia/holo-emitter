# chair-liner-1934-side — reconstruction report

A c.1934 ocean-liner writing-room side chair, rebuilt as a procedural Three.js model under the
`img2threejs` skill. Code-only: no mesh import, no texture, no image file, no external art.

## How to use it

```js
import { createChairLiner1934Model } from './src/createChairLiner1934Model.js';

const chair = createChairLiner1934Model();   // THREE.Group, real metres
scene.add(chair);
chair.position.set(x, 0, z);                 // y = 0 is the floor; the ferrules sit on it
chair.rotation.y = facingRadians;            // the chair faces +z at rotation 0
```

`createChairLiner1934Model` is also the module's default export. The file imports only the bare
specifier `"three"`, so the host needs `three` resolvable (import map, bundler or node_modules) and
nothing else.

**Frame contract.** Local origin at the centre of the footprint on the floor plane; `y = 0` is the
underside of the chrome ferrules; `+y` up; `+z` is the direction a sitter faces; right-handed, so
the chair's own left is `+x`. Units are real metres.

| measurement | model | declared |
|---|---|---|
| height | 0.8800 m | 0.88 m |
| width | 0.4780 m | 0.46 m |
| depth | 0.5244 m | 0.50 m |
| seat crown | 0.443 m | — |
| triangles | 5 412 | budget 6 000 |
| meshes / materials | 15 / 4 | budget 16 draw calls |
| textures | 0 | — |

Width and depth run 4-5 % over the declared figures. That is deliberate and measured: at the fitted
camera the declared 0.46 x 0.50 box renders about 8 % narrower than the reference relative to its
height, so the plan was opened up until the silhouette matched, and stopped there. The height, which
is the number a walking figure reads against, is exact.

## Deliverables

| path | what it is |
|---|---|
| `object-sculpt-spec.json` | the sculpt spec; passes `validate_sculpt_spec.py --strict-quality` |
| `src/createChairLiner1934Model.ts` | the generated factory (`generate_threejs_factory.py`, pass `optimization-pass`) |
| `src/createChairLiner1934Model.js` | plain ES-module port of the same factory |
| `tools/regeom.py` | the chair's dimensions; rewrites every descriptor in the spec from one table |
| `tools/port_ts_to_js.py` | the TS to JS porter |
| `tools/align_iou.py`, `tools/best_iou.py`, `tools/material_delta.py` | the review measurements |
| `tools/serve.py`, `render.html` | the review viewer and its capture sink |
| `renders/` | every review capture, comparison sheet and overlay |
| `parts.json`, `coverage.json` | assembly-gate manifest and result |
| `material-analysis.json`, `material-evidence/` | reference PBR extraction (evidence, not shipped art) |

To rebuild after a spec edit:

```bash
python3 tools/regeom.py                                            # if dimensions changed
python3 ~/.claude/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py \
        object-sculpt-spec.json --strict-quality
python3 ~/.claude/skills/img2threejs/forge/stage3_build/generate_threejs_factory.py \
        object-sculpt-spec.json --out src/createChairLiner1934Model.ts \
        --pass-id optimization-pass --force
python3 tools/port_ts_to_js.py src/createChairLiner1934Model.ts src/createChairLiner1934Model.js
```

To review it again: `python3 tools/serve.py 8712`, then open
`http://127.0.0.1:8712/render.html` - it renders nine viewpoints and POSTs each into `renders/`.

## What passed

Every gate the skill requires, at every pass.

| gate | result |
|---|---|
| strict-quality spec validation | PASS |
| Tier 1 `diagnose_render` (all five passes) | PASS - final: silhouette IoU **0.859** (threshold 0.85), aspect delta **0.049** (0.05), scale delta **0.035** (0.08), per-part colour dE **13.8** (20) |
| map-stripped render evidence | PASS - `renders/ref-flat.png`, every material replaced by one unlit flat grey |
| `diagnose_render_multi_angle` | PASS - no degenerate view across three orbits |
| `turntable_gate` (0/90/180/270 deg) | PASS - full azimuth coverage, no collapse. Run with `--allow-holes`: the reveal slot and the gaps between the legs are real background enclosed by the silhouette, which is the chair, not a hole through it |
| `orchestrate_passes check` | PASS at each of the five passes |
| `check_part_coverage` | **0 errors, 0 warnings** - 15 built parts, none fused, none anonymous, every inventoried detail resolves |
| action-ready hierarchy | PASS - 15 named pivot nodes each with a mesh child, 12 sockets, 15 collider proxies, 3 destruction groups, `root.userData.sculptRuntime` populated |
| no-texture audit | PASS - 4 materials, every one of 18 map slots null; `renderer.info.memory.textures` counts only the viewer's own environment |

Bilateral-symmetry error is reported at 0.198. That is not a defect: the reference **photograph
scores 0.191 on the same measure**, because a chair at a 40-degree three-quarter view is not
bilaterally symmetric in image space. Confirmed by running `diagnose_render` with the reference as
both inputs.

## What did not pass, or is not there

1. **Wood figure is absent.** The bird's-eye mottle on the sycamore and the streak stripes on the
   macassar ebony are albedo patterns. Reproducing them needs a map, and this build emits none by
   contract. Their statistics (contrast, scale, isotropy, direction) are recorded in each material's
   `localOverrides` so nothing is lost, and removing the `textureless` declaration and regenerating
   turns the generator's procedural canvas set back on. **This is the single largest visual gap**
   between render and reference, and it is a stated approximation, not a match.
2. **The reference's top rail carries a slight upward crown.** The shell is a linear extrusion, so
   its top edge is straight in 3D and the crown is not expressed. The rolled top edge and its
   quarter-turn corner return are present; the crown is not.
3. **The model is ~3 % narrower than the reference relative to its height** (aspect delta 0.049
   against a 0.05 threshold - inside, but only just). Widening further would push the plan past
   0.49 m and further from the declared 0.46 m, so it was left.
4. **Ferrules read brighter than the reference's.** An environment-response reading, not a shape
   error; the lathed profile carries the proud shoulder and the rolled rim.
5. **The rear of the chair is inferred, not observed.** One view. See confidence below.

## Per-region confidence

| region | confidence | basis |
|---|---|---|
| overall proportions, height, seat height | 0.92 | declared dimensions plus pixel measurement; height exact, feet exactly on y=0 |
| reveal slot (position, height, what crosses it) | 0.90 | directly visible and unambiguous in the reference |
| seat apron, bullnose lipping, pad plan | 0.88 | fully visible on two faces; the rear rail is inferred from the two visible ones |
| leg taper ladder and front-leg placement | 0.88 | measured radius-by-radius down the near leg, agrees within 0.001 m at every station |
| back shell chord, thickness, side-edge round | 0.85 | measured; the thickness is read from the visible left edge |
| chrome ferrules | 0.80 | small in frame (8 px at the review camera), read from a 3x zoom |
| back-shell recline angle | 0.65 | measures anywhere between 12 and 16 degrees depending on how much silhouette shift is attributed to perspective; **13.5 degrees chosen by silhouette fit** |
| rear-leg rake and sabre knee | 0.65 | the near rear leg carried the measurement; the far one is partly occluded |
| rear face of the shell, seat underside, rear apron rail | 0.55 | never visible; modelled as continuations of the visible surfaces |
| wood figure | 0.30 | statistics only, and not emitted |

## The review camera

Not guessed. Three independent estimates were made, then the disagreement was settled by search:

- two-vanishing-point orthogonality on the apron's bottom edge and the pad's lower edge gives
  f ~ 1390 px on a 1254 px square frame, i.e. ~48 degrees vertical field;
- a plane homography on the four foot positions gives yaw -40.6 degrees, rms 9.4 px;
- the ratio of the projected front rail to the projected side rail gives 32 degrees (weakest: it
  assumes the apron's plan proportions, which are themselves inferred).

Then 192 camera candidates were rendered and scored by **align-then-IoU** (`tools/best_iou.py`:
both silhouettes normalised for scale and shift before comparison, because raw IoU between a
photograph and a procedural render is dominated by framing, exactly as the skill's own
`self_correction.md` warns). Winner, and the review camera for every pass:

```
yaw -40 deg, camera height 0.75 m, distance 1.555 m, 40 deg vertical field,
target (-0.027, 0.386, 0)
```

The camera height was cross-checked against a second, independent cue - where the peak of the
shell's top edge falls along its own span - which the reference puts at 0.265 of the span and the
chosen camera puts at 0.273.

## Pass history

| pass | action | AI-vision | what changed |
|---|---|---|---|
| blockout | refine-spec | 0.74 | front-leg shoulders intersected the apron's rounded corners; stiles stood proud of the shell |
| blockout | **continue** | 0.78 | legs moved inboard, leg tops sunk below the apron's top face, shell moved forward to lap the stiles, arc resampled 13 to 19 stations |
| structural-pass | refine-spec | 0.79 | roll radii read as beads, not bullnoses; pad inset left apron top face showing inside the band |
| structural-pass | **continue** | 0.81 | lip 0.014 to 0.010 m, pad inset 0.047 to 0.030 m, pad roll 0.014 to 0.011 m |
| form-refinement | **continue** | 0.82 | four ferrules; model minimum Y exactly 0, height exactly 0.880 m |
| material-pass | **continue** | 0.84 | four albedos tuned against reference per-family medians; dE 3.4 / 6.6 / 5.0 / 6.7 |
| optimization-pass | **continue** | 0.84 | nothing decimated - the budget was met by authoring, not trimming |

**Correction budget: 2 of 6 used** (both `refine-spec`, one each in the first two passes). Per-pass
limit 3, never approached. The loop was not stopped by the budget; it finished.

## Approximate cost

- 7 recorded reviews across 5 passes; 2 correction iterations.
- ~200 browser renders in the camera search, ~120 in review capture runs, 9 viewpoints per run.
- Roughly 0.55 M tokens end to end, dominated by the camera fit and the four material-tuning rounds.

## What to look at

1. `renders/cmp-final.png` - reference against render at the reference's own camera.
2. `renders/views-sheet.png` - front, side, rear, and the walk view at 1.62 m eye height.
3. `renders/overlay-aligned.png` - the two silhouettes superimposed; yellow is agreement.
4. `renders/zoom-seat.png`, `renders/zoom-foot.png` - the bullnose and a ferrule at 3x, which the
   comparison sheet is too small to judge.

## Honest summary

The chair reads as the reference chair: silhouette, proportion, the reclined concave shell with its
rolled top edge, the open reveal slot, four round tapered legs with the rear pair raked, the pale
lipping band framing the blue pad, chrome at all four feet, and four separable material responses
within dE 7 of the reference's own medians. It holds from four azimuths and at walking eye height.
It is 5 412 triangles with no texture, which is what a first-person walk needs.

It is **not** a reproduction of the reference's surface. The wood figure is not there, the top
rail's crown is not there, and everything behind the chair is inference from one view. Fidelity
0.84 on the skill's scale means "strong procedural match for real-time use" - not "near-reference".
