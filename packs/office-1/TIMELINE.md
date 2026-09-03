# office-1 — request to implementation, timed (2026-09-03)

Kabe, 00:57: "Alright, lets do a test. Make the dunder mifflin office." Also: "time, and monitor the effective and productive methodologies here."

| clock | stage | wall | method | verdict |
|---|---|---|---|---|
| 00:57–01:03 | plan authored (6 rooms, 5 openings, from the set's layout simplified to rectangles), palette, furnishing manifest (13 asset queries, 38 placements) | ~6 min | hand-authored JSON from knowledge of the set; one file each | productive: the plan is the whole "design" and it is 3 KB |
| 01:03–01:05 | 13 assets fetched on demand | **109 s** (6–13 s each) | `tools/furnish.py` → `catalogue-fetch.py`: Sketchfab public search → licence filter → Objaverse mirror → stand → gate | productive; 3 of 13 picks wrong by NAME (a whole conference room, a chair+table combo, a row of chairs), 1 with no shippable hit (copier) |
| 01:03–01:08 | generator taught pack-driven furnishing: `at` (design decision), `pair` (chair behind/facing its desk), `around` (chairs around a table), `wants` with boxes taking one wall | ~5 min | edits to `tools/lab-room3d.py`; one bad anchor cost a retry | productive |
| 01:08 | first push refused: page 128 MB (13 textured meshes inlined as base64) | — | inline data URIs | **unproductive at scale**; replaced by serving `library/<id>/model.glb` (page now 38 KB) |
| 01:10–01:12 | 4 picks re-fetched with `--must` / `--avoid` name filters | 25 s | name-word filters on Sketchfab hits | productive for 3 of 4 (real conference table, a copier, a single chair); the conference chair needed a third query and finally reused the office-chair query |
| 01:12–01:16 | amend, push, publish, Pages propagation | ~4 min | publish-site ships `library/` | fine |

**Total, request → walkable office on the site: ~19 min**, of which the pipeline itself (fetch + stand + gate + build) was under 3 minutes and the rest was authoring the plan and fixing two tool limits (inline size, name filtering).

**Methods that proved out:** on-demand retrieval per query (no bulk download, ~8 s an asset); design decisions as `at` for anchors, `pair` for chairs, `around` for tables, `wants` for the rest; serving meshes rather than inlining. **Methods that did not:** ranking by Sketchfab relevance alone (needs the caption index for "single chair, not a set"); inlining assets; declared dims as a gate for retrieved objects.
