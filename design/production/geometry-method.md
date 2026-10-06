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

## 5. Rooms sound by construction, and what fills them (Kabe, 2026-10-06; gate g5d5249, consultation c7dd918)

Kabe's words, then my reading, in the order they came.

- "sims 4 logic, walls are prepped in units of one door width … a grid that can snap … allow cool architectures like a large octagon room"; "Might even work well at half that width … 1/4 1/8". The consult (two families) answered: cracks are prevented by shared structure, not by a grid. The house is one solid with the rooms and openings carved out of it, so a wrong number gives too much wall, never a hole. The grid is a snapping aid at any fineness.
- "translate this too to grid width on a floors room and thats the path check as well … doors windows and chair sides off desks could claim unavailable the empty area that needs reservation". *Reading:* a claim grid per floor, about 10 cm. Cells are solid (walls, footprints), reserved (door swing, window light, hearth mouth, stair run, drawer pull, a chair's draw-out: nothing placed, still walkable) or free. Placement searches free cells. The path check flood-fills the free cells, kept a body's half-width from anything solid.
- "you could build initial blueprint in this grid". *Reading:* one grid serves to draw the plan, to carve the house and to check it. Rooms are outlines whose corners snap to grid points, not filled cells, so diagonals stay straight.
- "hexagonal or octagonal grid". *Reading, my recommendation:* a square grid with corners free in 45° directions, plus declared exact shapes (a regular polygon of any number of sides, an arc). A hex grid loses right angles, and octagons tile only together with squares.
- "give it that freedom on an endless point grid … circular dome at some point … Walls that cover a space completely are of course unavailable … desks that have a setting to snap their rears to a wall can still snap to that wall as their first anchor point and where that object further covers on the grid … makes that square unavailable". *Reading:*
  - The blueprint has free shape, stored in whole millimetres.
  - The walls are the truth, and the grid only keeps the books.
  - Objects anchor to the exact wall. On a curve they sit tangent, and the spot is refused if the ends stand too far off.
  - A dome is a 3D cut (Manifold) when its time comes.
- "objects CAN anchor to the floor and have requirements on proximity to, directional orientation … Coatrack wants to be by the front door … against the wall. A rug wants to be away from the wall and also doesn't want to take up a reserved space so furniture could go on it". *Reading:*
  - Each kind declares an anchor (floor, wall, ceiling, on a thing), musts (hard rules) and prefers (scores), and its orientation.
  - Candidate places are computed directly (wall runs, spots by doors, the room's centre and other main points), filtered by the musts and ranked by the prefers. Ties go by the seed.
  - Claims are kept per layer: floor cover, standing, wall, overhead. A rug takes the floor-cover layer only.
  - The existing habits (wall, free, beside, hearth, hung) become instances of this. Prior art: Infinigen Indoors' hard and soft constraints; the Sims' rugs.
- "The context and history of a room should determine its fullness or sparseness … there should be a required layer for furnishing … if the story states that the key to the barn is in the study … required rooms and objects … prioritized first before the additional furnishings is run, to make sure we never have to take the step of finding room for required items". *Reading:* furnishing runs in tiers, and the blueprint is made to fit tier 1.
  1. **Required.** Assertions from the story (pattern-buffer's entity/assertion shape: key/barn in study, study in house) enter at the blueprint. A required object pulls in its chain of containers (the key needs a desk with a drawer, the desk a wall run), and the blueprint sizes the room to hold the chain with its reservations. That is counted on the grid before anything is built. If the room can't fit it, the plan changes, never the requirement. These are placed first.
  2. **Anchor.** The piece that names the room.
  3. **Ordinary furnishing,** to a fullness set by the room's context: its status, use, owner, period and history (lived in, newly let, abandoned, after a fire). Fullness is measured as the share of standing-layer cells claimed, plus the count of small things, and furnishing stops at that target.
