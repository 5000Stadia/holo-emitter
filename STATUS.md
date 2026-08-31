# `facing-playbook` — every location in every direction, and what it prompts

## The ruling this answers

[HUMAN, Kabe, 2026-08-30, verbatim] "Because different angles and different room
types, prompt, different orientations, and styles. We should have a playbook of
different instructions for room, image generation, depending on which direction
and room piece type we are working on. When the map schematic is initially
generated, every location in every direction should prompt the appropriate set
of instructions. And some may overlay — for example, an up-close wall facing with
a corner on the right hand side and the wall extending off of the picture to the
left is one set of instructions for long rooms in that corner spot, but also
another set of instructions is prompted if there is a door. If there is no door,
we skip that processing of course."

## What is here

Every situation the ruling names was ALREADY BUILT, as a branch, scattered
across `plan-projection.mjs`, `make-scaffold.mjs`, `edge-seed.mjs` and the g5
register in `frame-language.mjs`. What did not exist was the INDEX. This branch
adds one and changes no prompt text.

* `tools/playbook.mjs` — `situationsOf(plan, key)` returns a facing's ordered
  situation tags, read off the same functions the emitter reads (`facingCarriers`,
  `deriveMeta`, `runSpanOf`, `leadFacing`, `deepViewOf`), so a tag cannot drift
  from the sentence it stands for. `TAGS` is the vocabulary with a line each;
  `EMITTED_BY` and `GIST` are the doc's other two columns. `node tools/playbook.mjs
  --pack <name>` prints every `loc/F` with its tags (`--json` for tooling).
* `design/playbook-facings.md` — the table, generated from those three exports.
  The code is the authority; the file is the index.
* `tools/make-scaffold.mjs` — two wire-ins and nothing else: every `PACKET.md`
  gains one `Situations:` line and every manifest entry a `situations` array, so
  a return is attributable to the instruction sets that composed its ask.
* `tests/playwright/playbook.spec.mjs` — 17 node-side cases in the Playwright
  runner. Green.

## The vocabulary

17 tags. Type (`enclosed` | `open-facing`), painting order (`lead` | `follower`),
frame shape (`run-wall:corner-left` | `run-wall:corner-right`, `deep-view`,
`same-wall-image`, `open-side`), and what stands in it (`door`, `door:N`,
`window`, `window:N`, `no-window`, `fireplace`, `stairs`, `blank`).

**Overlay is the mechanism.** `underground-2` `platform_far/W` returns
`enclosed, lead, deep-view, same-wall-image, door, no-window` — six sets on one
wall. **An absence yields no tag**: there is no `no-door`, because "if there is
no door, we skip that processing of course". `no-window` is not an exception —
the register SAYS "there is no window" out loud, because a wall that does not say
it gets one painted into it. A said absence is an instruction; an unsaid one is
not.

## Found, and NOT fixed here

`deepViewOf(plan, "entrance_court/S")` (manor) matches `entrance_approach/S`.
Both are `open` facings, which carry `camera_far_m` and no `camera_wall_m`, so it
returns `{close_cam: undefined, deep_cam: undefined, back_m: null}`. That
backdrop and its meta are both on disk, so `sameWallImageFor` passes its own
existence guard and throws:

    TypeError: Cannot read properties of undefined (reading 'toFixed')
      at sameWallImageFor (tools/make-scaffold.mjs:3682)

Re-emitting that packet would crash in `attachStyle`. This branch is an index,
not a repair: `situationsOf` refuses to claim `same-wall-image` there and says
why in a comment, and the defect is written down here and in the document rather
than patched under cover of an unrelated row. The fix is a `close_cam == null`
guard in `deepViewOf` or `sameWallImageFor`, and it is a behaviour change that
wants its own row.

## Undone

* The retry and consistency packet writers get the `Situations:` line and the
  `situations` array, but their manifests were not re-emitted — no emit was run,
  because an emit dispatches asks.
* `run-wall:corner-*` reads `deriveMeta`'s corner pixels, which is the plan's
  derived meta. The live emit resolves the PAGE's meta, and a measured backdrop
  meta supersedes the derived one; on a facing whose measured corners differ in
  sign from the derived ones the tag and the sentence could part company. No such
  facing exists today (no painted facing in any pack is a run wall).
* `situationsOf` is not called by `frame-language.mjs`. It indexes the register's
  branches; it does not drive them. Making the register read the tags — one
  instruction block per tag, in one table — is the row this one makes possible.
