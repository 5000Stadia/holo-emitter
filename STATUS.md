# `deep-view-derived` — a deep facing is assembled, not painted

## What is here

`design/plan-draft/measured/deep_view.py` and `test_deep_view.py`, plus the two
candidates the module derived for `packs/underground-2`.

A DEEP FACING — one whose declared `wall_line` is not its own room's edge, which
is `tools/validate-plan.mjs`'s `throughLine` law and the whole of the detection
— is no longer painted on its own roll. Its 1536x1024 frame is assembled from
the promoted paintings of the cells the view crosses:

* the wall it views is the FAR cell's painting of that same wall, projected
  from the deep standpoint (`platform_far/E` for `platform/E`);
* each cell the walk crosses owns a DEPTH BAND of the view, and inside its band
  the side walls, the floor and the ceiling are that cell's own `N` and `S`
  paintings, mapped plane by plane;
* where no promoted painting shows a surface, the last painted texel is
  extended along that surface's own receding lines — `mesh_warp`'s fill — and
  the record names the surface and counts the pixels.

`row35_snap`'s five-plane box (`box`, `assign`) answers "which surface is this
output pixel"; `mesh_warp`'s `ray_exit`, `resample_clamped`, `write_png` and
`sha256` do the sampling, the fill and the io. No second projective
implementation was written.

Determinism: no clock, no randomness, no host in the pixels or the record. The
candidate id is `sha256` over `DERIVATION` + the input paintings' bytes + the
geometry that placed them, so a rerun that changes nothing rewrites the same
file, and a change to the assembly is a NEW candidate rather than the same id
with different pixels behind it.

## Run it

    python3 design/plan-draft/measured/deep_view.py --pack underground-2 --list
    python3 design/plan-draft/measured/deep_view.py --pack underground-2 --facing platform/E
    python3 design/plan-draft/measured/deep_view.py --pack underground-2 --all
    cd design/plan-draft/measured && python3 -m unittest test_deep_view   # 18 OK

## What it produced

| facing | candidate | paint | far cell |
|---|---|---|---|
| `platform/E` | `backdrops/source/platform-E/row23-deep81a0fbeb.png` | 67.9 % | `platform_far` |
| `platform_far/W` | `backdrops/source/platform_far-W/row23-deep807c6d39.png` | 67.7 % | `platform` |

Each has its `.deep.json` beside it: inputs and their sha256s, `k_camera` and
`k_corners`, the quads, every fallback, `missing_sources`, `extended_px`.
Both read five promoted rolls and invent no wall: **every pixel of every side
wall in both frames is paint.**

## Known limits, in the order they matter

1. **32 % of each frame is recession fill, all of it floor and ceiling.** The
   floor immediately in front of the standpoint and the ceiling directly
   overhead are outside every existing painting's frame — a 6.4 m room at
   4.8 m on a 1536 px canvas simply does not contain them. The side walls take
   none of this fill. If it needs to come down, the next source to add is each
   cell's BACK facing (`platform/W` for `platform/E`): it is an exact source
   for those planes, and the only rule is that a facing which is itself deep
   may never be a source.
2. **`platform_far/E`'s meta disagrees with itself**: `px_per_m_at_wall` 197.5
   against corner columns that give 166.6 over the ruled 6.4 m, and an eye at
   1.044 m against the drawing's 1.183. The assembly follows the CORNERS and
   the plan's metres horizontally and the meta's `px_per_m_at_wall` vertically,
   so the far wall lands on the plan's declared corners; the disagreement is
   reported as `k_camera` 0.4286 vs `k_corners` 0.5489 and `sources[*].eye_m`
   rather than split silently. `platform_far/W` has no such gap (both 0.4286).
3. **The floor and ceiling are cut down the view axis**, left half from the
   cell's left painting and right half from its right one. The cut is crisp and
   where the geometry puts it, but the two rolls differ in exposure, so the
   join is visible on the near floor. A brightness match at the seam is not
   attempted here.
4. **The tone steps at the crossed edge** where one cell's rolls give way to
   the next's. That is the corpus disagreeing with itself, not the assembly;
   the seam is a cut with no feather, as ruled.

## Not done

* The candidates were written in THIS WORKTREE only. Nothing was copied into
  the live store, no `run-state` was touched, no tmux loop was restarted, and
  no promoted file was modified or deleted. To put them in front of the loop,
  copy the two `backdrops/source/<loc>-<F>/` directories into the main
  checkout; they are ordinary candidates from there on.
* No measure or promote pass was run against them, so nothing here says the
  gate accepts them.
* Only `underground-2` was exercised. `--all` walks any pack's deep facings and
  refuses, by name, a facing whose far cell is not promoted.
