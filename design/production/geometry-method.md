# Sound geometry at creation: the proposed method

Kabe, 2026-10-06: "a lot of little details that get geometrically shaky … preventative principles for failed generations"; "it should've been caught at its original creation"; "is it the most valid method?"; "As long as it stays efficient." Consultation cc8f89b (two model families) and a prior-art pass (below) agree. All of it runs when a kind is made. None of it costs anything in play. Waiting on gate g21e766.

## 1. Relations, not coordinates

Recipes say how a part meets its parent. The builder places it in closed form: one move, or one turn and a move, from the parent's box. There is no solver and no search, so it takes microseconds a part. A general constraint solver (CadQuery's IPOPT, Infinigen's annealing) is what to avoid.

| Relation | What it does | Prevents |
|---|---|---|
| `on(parent, sink = 0)` | The underside goes to the parent's top. `sink` is a declared let-in. | floating, burying |
| `against(face, parent, face, gap)` | The general form of `on`, for any face (Infinigen's `snap_against`). | a shelf off its wall |
| `align(axis, u, parent_u, off)` | Anchors as 0..1 fractions of each box (ShapeAssembly's `attach`). | parts off centre, overhanging |
| `spans(a, b, axis)` | Sized and placed by the gap between two parts (ShapeAssembly's `squeeze`). | rails short of, or through, their stiles |
| `fills(opening)` | A lid, door or panel sized to its opening, plus an overlap. | a lid that doesn't close the opening |
| `array`, `mirror` | Repeats and reflections. A mirror reverses winding (`mirror()` in `lab/painted/procedural.js`). | inside-out faces |
| `hinge(edge, axis, range)` / `slide(axis, range)` | The pivot is a named edge. Rest is zero. Limits are explicit (URDF, build123d, Articraft). | a pivot typed by hand off its edge |
| `wall(faces)` | Which faces may meet a wall. Placement tests the swept volume against them. | a lid striking the wall |

**Swept volume:** each mover's boxes are unioned over about 8 poses, the end pose included, then padded a little. The kind publishes it, and room placement keeps it clear. Nobody computes a true swept volume; Articraft and Infinigen-Sim sample poses as we would.

**Pitfalls to design out (from the sources):**
- ShapeAssembly's greedy attaches depend on the order they are written in, and a second attach can silently stretch a part. So each part takes one placing relation, and its size comes from its own data or from `spans`.
- ProcTHOR assumes that opening a thing affects nothing near it. Our swept volumes replace that assumption.
- Sampled sweeps can miss a collision between two samples. The end pose is always one of the samples.

## 2. Rules every mesh obeys, checked when a kind is made

| Rule | How | Cost (measured on a 2,000-triangle part) |
|---|---|---|
| closed, two-sided at every edge, no degenerate triangles | Manifold builds it or refuses (`status()`) | about 4 ms a part |
| faces outward | signed volume above 0. Manifold builds an inside-out mesh, but gives it a negative volume. | near zero |
| no part inside another, beyond its declared `sink` | `a.intersect(b).volume()`, an exact volume replacing check 14's sampling | 0.07 ms a pair for boxes, 8 ms for two tori |
| no two parts sharing a face (shimmer) | our own: a hash on each triangle's plane, candidates pruned by three-mesh-bvh | not yet built. No library does this. |
| the parts form one whole | a graph of touching parts (`minGap`), then a flood fill | about 1 ms |
| every part seen (check 13) | the depth grid. three-mesh-bvh rays for speed. | 25 ms per 48 points by brute force; 0.3–1.5 ms with BVH |

The libraries are Manifold (Apache-2.0, 0.5 MB wasm) and three-mesh-bvh (MIT). The projected cost is under a second for all kinds, against 8 s today. That figure is a projection, not a measurement.

## 3. Test the checks: planted faults

Mutate good kinds: mirror a part, drop a triangle, sink a part, fill a hollow, lift a part off its wall, duplicate a face, detach a part. Then record which check catches which. The result is a catch rate per fault class. A class nothing catches is named, and a check that goes blind is noticed, as the front-lit panel did on 2026-10-06. Nothing like this is published for mesh checks, so this harness is our own.

## 4. The eye, for taste

Faults show in diagnostic views: flat light, a colour per part, inside-out faces magenta, flagged parts red. What Kabe looks at is motion, at phone scale, in one standard test room (a wall behind, a corner, a narrow passage), with everything opened and closed. The question there is whether it reads as a real 1660 thing. Only new, changed or flagged kinds come to him.

## Prior art (2026-10-06)

- [ShapeAssembly](https://github.com/rkjones4/ShapeAssembly) (Jones 2020). Its ideas are used here; its code may not be (its licence is non-commercial).
- [Infinigen Indoors](https://arxiv.org/html/2406.11824) (BSD-3): `StableAgainst`, `SupportedBy` and `CoPlanar` on named faces, closed-form snaps.
- [ProcTHOR](https://arxiv.org/html/2206.06994) and [Holodeck](https://arxiv.org/html/2312.09067) (Apache-2.0). Holodeck found that LLM-written coordinates collide, which is why it has a relation layer.
- [build123d joints](https://build123d.readthedocs.io/en/latest/joints.html): closed-form `connect_to`.
- [Articraft](https://arxiv.org/html/2605.15187) (2026, Apache-2.0): LLM-authored articulated assets checked by `expect_contact`, `expect_gap`, `expect_no_collision_at_poses` and `allow_overlap(reason)`. It is the closest to us.
- [Manifold](https://github.com/elalish/manifold), [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh).
- Validators: Blender's 3D-Print Toolbox, [glTF-Validator](https://github.com/KhronosGroup/glTF-Validator), and Unreal Data Validation, whose model is to run on save and in CI.
- Benchmarks: `bench.mjs` and `b2.mjs` in the session scratchpad, Node 22 and three 0.186.1.
