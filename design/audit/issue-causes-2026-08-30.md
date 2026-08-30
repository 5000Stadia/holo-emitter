# When the issues came up, and why — 2026-08-30

[Kabe]: "Take note of when issues came up and why so we can refine what caused the issues."

Every issue from today's two runs (hospital-3, underground-2) and the seam work, timestamped
from the commits that fixed them, then the five causes they reduce to. The per-step detail
lives in each run's STEPS.md; this is the distillation.

## The ledger

| when | issue | root cause | class |
|---|---|---|---|
| 02:19 (found 09:00) | "Only first rooms images load" — live site served 67 of 83 paintings | publish copied `served/` while a loop's bake was rebuilding it destructively; verify counted ids, not paintings | D |
| 09:58 | Kabe still saw the old renderer after a fix went live | bare script URLs behind a 10-min CDN cache | A |
| 10:11 | ward/W's door cill missed; treatment_room/W "worked" | the floor reader clamped to a ±20 px bracket around the DECLARED row; the true foot lay outside; 6 px of luck vs 9 px of miss | B |
| 10:15 | a pass re-promoted twelve walls on the OLD floor rows | reading cache keyed by candidate id only — not by the instrument that read it | A |
| 10:38 | the true foot fell outside the licence and walls were re-asked instead of warped | one bracket served as both search window and licence; widening the search made the minimum rule grab the skirting | C |
| 11:05 | reception/E "front room spills into back room" | a transient reader's warp record survived (no instrument identity on records); my reset trusted "promoted" | A |
| 11:10 | the fixed promotion was rolled back by the validator | my own new `instrument` field was unknown to the meta vocabulary — the discipline catching its own installer | C |
| 15:42 | the deep facing's ask read "there is no wall here at all ... stone piers" (the manor court's words) and every column band vanished | the crossed open edge registered as a carrier of the viewed wall; the register's pier language is manor theme living in code | B, C |
| 15:43 | `FileNotFoundError` in `served.building/` | three pack loops bake one shared tree; my atomic-swap dir had a FIXED name — concurrent bakes deleted each other's work | D |
| 15:46 | the repainted deep walls held on a reading of paintings that no longer existed | re-emitted asks reuse roll ids; the painter delivered NEW bytes at the SAME paths; the cache keyed by id served the old readings | A |
| 15:48 | the loop crashed (NameError) | my latch patch referenced a variable out of scope — patched live, unreviewed, while three loops ran | E |
| 15:51 | the warp promoted the deep wall and promotion refused it: door01 and way01 "share 110 px" | the same crossed-edge law existed in ONE of the two projection functions (facingCarriers) and not the other (openingsForFacing) | C |
| 15:49–55 | three "held" reports repeated after every fix | stale state replays: loops hold code and manifests in memory; I edited run-state under a live loop | E |

## The five causes

**A. A derived thing that does not name everything it is a function of.** A reading is a
function of the frame's BYTES and the INSTRUMENT; a cache key of "candidate id" named
neither. Same shape: warp records without a reader's identity, script URLs without a
version. *Refinement, now law in the tree: readings, warp records, round documents and
metas carry `instrument` and `candidate_sha256`; the instrument digest covers the JS half
of the pipeline; published script URLs carry the commit sha.*

**B. The theme leaking into the code.** The floor line was "the shadow under the skirting"
(1660), windows had stone mullions, a long room's ask grew the manor court's stone piers.
*Refinement: every such word or rule moves into pack data (`conventions.*`); the fourth
pack (underground) is the first whose every prompt came out clean on the first emit —
except the one place (piers) a NEW mechanism (deep facings) reached old code.*

**C. Two homes for one truth.** Search window and licence in one bracket; band-top rounding
done twice two ways; the crossed-edge law in one projection function but not its sibling;
sill/head literals beside pack values. *Refinement: when a rule is stated, grep for its
siblings before shipping — the second copy is where the next bug already lives.*

**D. Concurrent writers of shared artifacts.** The served tree had three bakers and one
fixed temp dir; the publish copied mid-rebuild. *Refinement: build-aside + atomic swap +
per-process names; verifiers check the CONTENT (every painting live), not a proxy (ids).*

**E. Mutating a live system's state by hand.** Editing run-state under a running loop,
patching code the loops had loaded, an unreviewed inline patch crashing the sweep.
*Refinement: the reset-and-restart is one gesture (kill loop → edit → start loop), never
interleaved; a patch that touches the loop's own control flow gets a syntax parse BEFORE
the file is written (the one that crashed was written first, checked second).*

Standing residue tracked elsewhere: B-FLOOR builder 2, the pack-blind readings/round
directory, the painter seat's stale AgentPost hooks, the suite's pre-existing red.
