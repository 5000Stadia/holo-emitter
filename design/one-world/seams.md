# Seams between projects

**Kabe, 2026-10-13 (to Photonic, on gate g1eeae0):** "Lets use the project elements in the separate projects. Lets use pattern buffer for pattern buffer shaped world state even in photonic. When holo emitter puts people in the world it uses photonic etc", and "if theres an issue a message ticket immediately can go from Project 1 to 2 to inform them of an issue and discuss whos side its on to fix. Id think that evolution supports better future integration when it becomes one seamless whole".

**My reading:**
- Each part has one home project and is used from there:
  - pattern-buffer holds what is true about the world;
  - Photonic supplies the people;
  - holo-emitter hosts the place and draws it;
  - construct proposes the story.
- When something breaks where two projects meet, the one that finds it writes to the other at once. The two agree whose side the fix is on, and the lesson goes into the integration rules (`integration.md`).

## How a seam ticket goes

1. The message starts with `SEAM:`, then says:
   - what was seen;
   - how to reproduce it;
   - which side it is suspected to be on;
   - a proposed fix.
2. Both sides agree whose fix it is. Each logs it below.
3. Once fixed, the rule it teaches goes into `integration.md`.

## The phone bridge (agreed 2026-10-13: holo-emitter, Photonic, pattern-buffer)

pattern-buffer is Python and the game runs in Safari.

- **The browser holds and applies pattern-buffer's answers. It never computes them.** There is no JS port of the engine (UNIFIED-WORLD-ACCESS §7), so there is one source of truth.
- **The store is seeded from the static export:** `python -m patternbuffer.mirror export > view.json`. When a service arrives, nothing else changes.
- **The store is checked against pattern-buffer's vectors:** `tests/vectors/view-feed-v1.json`. It holds 3 replay sequences: the start document, the feed answers, and the expected document after each. The reference is `apply()` in `src/patternbuffer/mirror.py`. The document format is `specs/VIEW-EXPORT-V1.md` §1–3 and §7; the cursor is opaque.
- **Writes on the device before a service exists** (Photonic's own):
  - they are kept as a separate pending list of record items `{entity, attribute, value, value_type, valid_from?}`;
  - they are shown as a provisional overlay on the document;
  - they are sent through `record` once a service exists;
  - they are never merged into `known` by local rules, which would be a second fold that could disagree with pattern-buffer's.
- **Gaps pattern-buffer will specify when one of us raises them:**
  - an author-side write (`record` into the player's view);
  - people in the present layer.
- **Hosting a service is Kabe's call.**

## Log

| Date | From → to | What | Whose fix | Rule learnt |
|---|---|---|---|---|
| 2026-10-13 | Photonic → holo-emitter | three's WebGPURenderer on iOS 18.7: the half-float MSAA target cost ~14 ms a frame at DPR 2 whatever was drawn | holo-emitter (`src/make/render.js`): direct pipeline the phone default | A shared frame has one renderer: its fixed costs are measured on the person's phone and settled for every module at once |

## Vendoring
- **pattern-buffer's browser module** (`js/patternbuffer/`, VIEW-JS-V1 with our three review points: storage persistence and reseeding, the cross-tab lock, apply never per frame) is in at pattern-buffer main 586dff6 (m7bc36c). We vendor it from that commit when the manor's state comes from pattern-buffer; with people off, its documents are byte-identical to `view-feed-v1.json`.
