# Nouns → catalogue → load: what a unique load looks like

Kabe, 2026-09-02: "consider what a unique load would look like if we make an engine that connects nouns, to the catalogue, to then load in" and "track how long it takes to use these assets, from request to implementation".

## The path, per noun

| stage | what happens | LLM | cold (first time) | warm (cached) |
|---|---|---|---|---|
| 1 request | the world spec names a noun with a class and dims (`{"noun": "side chair", "class": "chair", "dims_m": …, "period": "1934 liner"}`) | none per noun; the spec is one call per world | — | — |
| 2 normalise | noun → catalogue key: class + period bucket + style bucket (`chair/1930s/moderne`) | none (a table, plus a CLIP text embedding on the CPU for free text) | ms | ms |
| 3 retrieve | key → candidates: (a) our library (`library/<id>/record.json`), (b) Objaverse-LVIS category + Cap3D caption/CLIP nearest neighbours, licence-filtered, (c) the CC0 registries | none | 1–3 s index lookup (the LVIS index loads once) | ms |
| 4 acquire | (a) nothing; (b) download the GLB (1–20 MB from Hugging Face); (c) on a miss, paint → mesh (seat ~4 min, TripoSR ~2 min CPU) | none (the paint prompt is a template) | 2–10 s download, or ~6 min generated | 0 |
| 5 stand | `tools/mesh-ground.py`: support plane, then the class rule (`chair` → seat level at 0.45 m, `table` → top level, else base); decimate | none | 5–40 s (75k-face meshes) | 0 |
| 6 gate | `tools/mesh-gate.py`: shape vs declared dims, triangle budget; `grounding` record | none | < 1 s | 0 |
| 7 register | `library/<id>/{model.glb, record.json}` with provenance, licence, timings | none | < 1 s | — |
| 8 place | the placement rule (`against_wall`, `at_table`, …) from the class | none | ms | ms |
| 9 load | the page fetches `library/<id>/model.glb` (served, not inlined, once the library is served) and drops it in | none | 0.2–2 s per MB | cached by the browser |

So a **unique load** is: request → key → miss in our library → hit in Objaverse → download → stand → gate → register → place → load. Cold, that is roughly **10–60 s** for a retrieved object and **~6–7 min** for a generated one; warm, it is the browser fetching a GLB it already has. Every stage writes its seconds into `record.json.timings`, so the scorecard's "request to implementation" column is measured, not guessed.

## What makes it deterministic

- The key is a function of the spec, not of an LLM's mood; the same noun in the same world resolves to the same asset.
- Retrieval ranks by embedding distance and licence, then takes the first candidate that passes the gate; ties break by uid. Re-running yields the same pick.
- Generation only on a miss, and the miss is recorded so the next world with that noun hits.

## What stays open

- **Style**: a retrieved chair is *a* chair. Two levers: rank candidates by CLIP similarity to the world's style block render, or repaint the retrieved object's silhouette through the seat and re-mesh. Both are measurable on the same wall.
- **Licences**: Objaverse objects are mostly CC-BY (attribution file per world) with some CC0; anything else is filtered out at retrieval.
- **Serving**: the library grows past what a page can inline; the runtime fetches per asset from `backdrops/`-style storage, exactly as the paintings are served today.

## The catalogue as a project of its own (Kabe, 2026-09-02 23:10)

"Maximize an internal catalogue for quick retrieval based on text searches. That seems like a valid GitHub project in itself."

What it would be, and nothing more:

1. **An index**: one local table over TexVerse + Objaverse-LVIS + the CC0 registries — uid, source, licence, name, caption, category, dims from the mesh bounds, thumbnail URL, and a CLIP text embedding of the caption. Built once (hours), updated by diff. Parquet or SQLite; a few hundred MB for a million rows.
2. **A query**: text → embedding → nearest rows, filtered by licence and class, deterministic ties. Under 50 ms on a CPU. Returns candidates with thumbnails so a human or a page can pick.
3. **A fetch**: uid → GLB download → stand (support plane + class rule) → gate (class ranges, triangle budget) → a record with provenance and timings. What we measured today: 24 s cold with a warm annotation cache, 5 s of it download.
4. **A cache**: everything fetched lives under `library/<id>/` with its record; a second request is a file read.
5. **A miss**: when nothing scores above threshold, hand the noun to the generator path (paint → mesh) and register the result under the same key, so the catalogue grows where the worlds actually need it.

Boundaries: no LLM in the loop; no hosting of other people's assets beyond the cache (licences travel with the record); no style opinions in the index — style is a re-rank the consumer applies. A CLI and a tiny HTTP endpoint; the engine is one client of it.

Measured so far (Objaverse, this box): index load 0 s warm; annotations 17–176 s first time per category, then cached; download 5 s; stand 1–5 s; gate < 1 s. The gate as written compares to the requester's declared dims, which is wrong for a retrieved object (it has its own proportions): it needs class ranges. Two of two retrievals "failed" that way today and were fine.
