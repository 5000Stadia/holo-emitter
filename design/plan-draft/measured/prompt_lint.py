#!/usr/bin/env python3
"""The backdrop prompt lint — the miss ledger's causes, baked in.

    python3 design/plan-draft/measured/prompt_lint.py            # every prompt
    python3 design/plan-draft/measured/prompt_lint.py FILE ...   # named ones

Exit 1 if any prompt is refused.

WHY THIS EXISTS. `design/production-law.md` clause 3: a miss is only CLOSED
when its cause is baked in algorithmically -- a prompt-template change, a gate
clause, a solver constraint. The cand-2 round missed on all seven walls and
`misses.jsonl` diagnoses two causes that are properties of the PROMPTS rather
than of the generator, and both are mechanical enough to refuse before an image
is ever made:

  (1) THE PROMPT CONTRADICTED ITSELF ABOUT THE CAMERA. Five of the seven carry
      `Avoid: changing the camera scale` in one paragraph and `move the camera
      closer until ... spans approximately N pixels` in the next. The negative
      won every time: study/E and study/W came back corner-for-corner identical
      to the round before them, 1194 px and 1246 px, against a 1346 px ask.
      A re-ask that forbids the correction it is asking for is not a re-ask.

  (2) THE PROMPT LEFT THE GATE NOTHING TO MEASURE. hall/N and hall/S were
      prompted with "NO floor line. NO visible floor. NO ceiling line. NO
      corners in frame" and a wall with "no feature, carrier, opening, or
      decoration", and the paintings obeyed perfectly. Both are WITHHELD in the
      ledger -- not because the painting failed but because nothing in it can be
      converted into a scale. A wall the gate cannot measure cannot be admitted,
      so a prompt that asks for one is asking for an image that can never ship.

THE FIX FOR (2) IS A DECLARATION, not a guess: every prompt names its own
`Gate anchor:` -- the feature the gate will measure and its ruled size in
metres. That makes the prompt and the gate agree about what the ruler is before
the image exists, which is the one thing neither could check afterwards.

  (3) THE PROMPT DECLARED AN ANCHOR AND FORBADE ITS DATUM. Earned by the cand-3
      round, at row 21's close. The seven regenerated cand-3 prompts declare
      blueprint §11's universal anchor -- the wainscot chair-rail at 0.95 m
      ABOVE THE FLOOR --
      and `passage-N` and `passage-S` then ask for a frame with "No floor, no
      ceiling, and no corners". A height above a datum the frame does not show
      is not a length in that frame: both came back WITHHELD again, for the same
      reason as at cand-2 and through a clause that was supposed to have closed
      it. A declaration is only a declaration when the thing it is measured from
      is in the picture.

WHAT IT CLOCKED, per the production law's fifth clause (an improvement must
clock as one): over the seven cand-2 prompts it refuses 5 for (1) and 7 for (2).
Over the seven cand-3 prompts -- the first round generated with it standing --
the first-roll pass rate is UNMOVED at 0 of 7, and the round is diagnosed at
`design/plan-draft/measured/cand3/` and in `misses.jsonl`. Two of the three
causes it now names are (3), which this file could not see when those prompts
were written. **So this is still apparatus with an argument and not yet a
clocked improvement**, and the honest reading of the cand-3 round is worse than
that: this lint's own `Gate anchor:` parser refused all seven cand-3 prompts on
a comma -- it required the metres to follow one, and the seat wrote "at exactly
0.95m above the floor, running the full wall" -- so the round that was meant to
test the rule was generated against a tool that rejected a compliant prompt. The
parser reads the metres wherever they stand on the line now. A gate that refuses
compliant work teaches the seat nothing, and it makes the tool's own refusal
count read as discrimination when it is noise.
"""
import os
import re
import sys

from pack import active_pack, PackRefused, strip_pack_args   # the location, as data

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SOURCE = os.path.join(REPO, "backdrops", "source")

# THE CORRECTION HALF, structural rather than a phrase list. A critic defeated
# the first version of this clause with one paraphrase ("back the camera off
# until the wall reads 1346 pixels across"), so what is looked for now is the
# SHAPE of a scale instruction: a pixel target for a plane, or a verb that
# moves the camera, or a verb that resizes what is in frame.
CORRECTION = re.compile(
    r"("
    r"(?:span|spans|spanning|reads?|measures?|wide|across|width)[^.\n]{0,60}?\d{2,4}\s*(?:px|pixels)"
    r"|\d{2,4}\s*(?:px|pixels)[^.\n]{0,60}?(?:wide|across|span|spans)"
    r"|(?:move|moves|moving|back|backs|backing|bring|brings|push|pushes|pull|pulls|"
    r"step|steps|shorten|shortens|lengthen|lengthens)[^.\n]{0,40}?camera"
    r"|camera[^.\n]{0,40}?(?:closer|further|farther|back|forward|nearer)"
    r"|(?:enlarge|enlarges|shrink|shrinks|reduce|reduces|increase|increases|scale up|scale down)"
    r"[^.\n]{0,60}?(?:wall|opening|doorway|window|plane|bay)"
    r")", re.I)
# THE PROHIBITION HALF, anywhere in the file. It was `avoid:[^\n]*…`, so the
# same contradiction survived being written as a bullet list under `Avoid:`.
FORBIDS_SCALE = re.compile(
    r"(?:avoid|do not|don't|never)[^.]{0,120}?chang\w*\s+the\s+camera\s+scale"
    r"|chang\w*\s+the\s+camera\s+scale[^.]{0,40}?(?:is forbidden|not permitted)", re.I | re.S)
# A prompt that forbids the features the gate can measure. Any one of these is
# enough on its own to make a frame unmeasurable without a declared anchor.
FORBIDS_ALL_FEATURES = re.compile(
    r"no\s+corners?\s+in\s+frame|no\s+visible\s+corners?|no\s+floor\s+line|"
    r"no\s+visible\s+floor|no\s+ceiling\s+line", re.I)
# THE ANCHOR LINE, AND THE METRES WHEREVER THEY STAND ON IT. This was
# `^gate anchor:\s*(.+?),\s*(N)\s*m\b` -- the size had to follow a comma -- and
# it therefore refused every one of the seven regenerated cand-3 prompts, which
# declare the ruled anchor as "wainscot chair-rail at exactly 0.95m above the floor, running
# the full wall". The round meant to test this rule was generated against a tool
# that rejected a compliant prompt, and the tool's refusal count read as
# discrimination when it was noise. The line is what the seat writes; the size
# is the first length in metres on it, and the whole line is what the ruler
# table is matched against.
ANCHOR_LINE = re.compile(r"^gate anchor:\s*(.+)$", re.I | re.M)
ANCHOR_SIZE = re.compile(r"([0-9]*\.?[0-9]+)\s*(?:m\b|metres?\b|meters?\b)", re.I)
# A height above a datum the frame does not show is not a length in that frame.
# GROUND COUNTS AS A DATUM TOO (row 29). An outdoor facing has no floor; its
# anchor is a masonry course measured above the GROUND, and the same reasoning
# applies word for word -- so both the datum and its prohibition are read in
# either vocabulary rather than the outdoor half slipping past unchecked.
FORBIDS_FLOOR = re.compile(
    r"no\s+floor\b|no\s+floor\s+line|no\s+visible\s+floor|"
    r"floor\s+is\s+not\s+visible|without\s+a\s+floor\s+line|"
    r"no\s+ground\s+line|no\s+visible\s+ground|ground\s+is\s+not\s+visible", re.I)
ANCHOR_ON_FLOOR = re.compile(r"above\s+(?:the\s+)?(?:floor|ground)", re.I)

# THE RULERS THE GATE ACTUALLY HAS, and their ruled sizes in metres, READ FROM
# THE ACTIVE PACK (`packs/<name>/world.json`'s `rulers[]`). A `Gate anchor:`
# line that names something else, or names one of these at the wrong size, is
# not an anchor -- it is a sentence. A critic wrote
# `Gate anchor: nothing whatsoever, 0 m` and satisfied both of the clauses that
# depend on an anchor being present.
#
# THIS TABLE USED TO BE TYPED HERE: nine tuples of one house's own vocabulary.
# `design/production-law.md` clause 8 -- the theme never bleeds into the code.
# A second location could not be linted without editing this file, which is the
# defect the clause names. The regex sources moved into `world.json` verbatim,
# so the manor's behaviour is unchanged; `packs/_probe/` proves the same lint
# standing over another idiom, and the ruler is a pack's first refusal.
#
# The row-29 reasoning that put the voiced anchors in the table is now in the
# pack's own `rulers_note`, beside the table it justifies: a service room has
# no wainscot and a garden wall has neither, but `row23_lib.py` measures ONE
# horizontal at `rail_above / ruler.height_m`, so a voice renames the FEATURE
# at the ruled height rather than moving it. That divisor is the instrument's;
# the names are the world's.


# ---------------------------------------------------------------- row 29
# THE VOICE CLAUSES. `design/production-law.md` clause 6: a correction lands in
# the emitter, a gate or the instrument, never in a per-run paragraph. Kabe's
# two walk findings are gates here, so a future map cannot repeat them however
# its prompts are written.
#
#   (4) AN EXTERIOR PROMPT THAT ASKS FOR INTERIOR FABRIC. [HUMAN, 2026-08-24,
#       verbatim] "exterior garden has interior wall outside". `privy_garden/N`
#       was promoted with oak panelling and a chair-rail in an open garden and
#       was vetoed and demoted the same day. Every prompt now declares its side
#       of the door on its `Use case:` line, and an exterior one may not name
#       interior fabric at all -- not even to forbid it, because a prompt that
#       says "no panelling" has still put the word in front of the generator.
#
#   (5) A NON-PANELLED ROOM THAT ASKS FOR PANELLING. [HUMAN, same walk] "is
#       every room in this house parlor walls?" A prompt whose declared anchor
#       is NOT the wainscot chair-rail is a room with no wainscot in it, and
#       naming panelling there is the study's paragraph leaking into the
#       scullery again.
#
#   (6) HERALDRY OUT OF ITS RATION. [HUMAN, same walk] "this same window
#       everywhere? With the ensignias on it?" Armorial glass in 1660 is the
#       great hall's, and at most one shield in the principal parlour. A prompt
#       that asks for it anywhere else is refused.
# The SHAPES are the engine's -- a prompt states its side of the door on a
# `Use case:` line and its subject on an `Asset type:` line whatever world it
# paints. The WORD LISTS are the pack's: `refusals.interior_fabric`,
# `refusals.panelling`, `refusals.rationed_line`, `refusals.entitled_to_rationed`.
EXTERIOR_USE = re.compile(r"^use case:[^\n]*\bexterior\b", re.I | re.M)
ASSET_TYPE = re.compile(r"^asset type:[^\n]*$", re.I | re.M)


class Rules(object):
    """The active pack's ruler table and refusal word lists, compiled once.

    Everything on it used to be a module-level literal in this file. It is the
    one object that knows which world is being linted; every clause below reads
    it, and none of them names a material."""

    def __init__(self, pack):
        self.pack = pack
        self.rulers = pack.rulers
        self.interior_fabric = re.compile(pack.refusal("interior_fabric"), re.I)
        self.panelling = re.compile(pack.refusal("panelling"), re.I)
        self.rationed_line = re.compile(pack.refusal("rationed_line"), re.I | re.M)
        self.entitled_to_rationed = re.compile(pack.refusal("entitled_to_rationed"), re.I)

    def why(self, key):
        """The pack's own justification for a clause, quoted into the finding.
        A refusal a reader cannot act on teaches nothing (clause 11), and the
        reason a word is forbidden belongs to the world that forbids it -- not
        to this file."""
        w = self.pack.why(key)
        return (" " + w) if w else ""

    @property
    def example_anchor(self):
        """A `Gate anchor:` line this pack would accept, for the message that
        asks for one. Its first ruler, stated the way the parser reads it."""
        if not self.rulers:
            return "the ruled horizontal, %.2f m" % self.pack.ruler_height_m
        _, size, name = self.rulers[0]
        return "%s, %.2f m" % (name, size)


_RULES = {}


def rules(pack=None):
    """The compiled rules for the active pack (or a named one). Cached."""
    p = pack if pack is not None else active_pack()
    if p.name not in _RULES:
        _RULES[p.name] = Rules(p)
    return _RULES[p.name]


def interior_fabric():
    """The active pack's interior-fabric word list, for the one caller outside
    this file (`row23_run.py`'s outdoor-correction redaction). One word list,
    read through the lint that owns it -- never a second copy."""
    return rules().interior_fabric


def anchor_problem(text, m, R=None):
    """Why this prompt's `Gate anchor:` line is not one, or None."""
    R = R or rules()
    if not m:
        return ("no `Gate anchor:` line")
    what = m.group(1).strip()
    size_m = ANCHOR_SIZE.search(what)
    if not size_m:
        return ("`Gate anchor: %s` states no size in metres — a ruler is a "
                "feature AND a length, and the gate has to have both before the "
                "image exists" % what)
    size = float(size_m.group(1))
    if size <= 0:
        return ("`Gate anchor: %s` declares a size of nothing — a ruler with "
                "no length measures nothing" % what)
    for pat, ruled, name in R.rulers:
        if pat.search(what):
            if abs(size - ruled) > 0.01:
                return ("`Gate anchor: %s` names %s at %.2f m, which this project "
                        "rules at %.2f m — the prompt and the gate would be "
                        "measuring the same feature against different lengths"
                        % (what, name, size, ruled))
            return None
    return ("`Gate anchor: %s` names no feature the gate can measure. The "
            "rulers are: %s" % (what, "; ".join(n for _, _, n in R.rulers)))


def lint(path, R=None):
    """(findings, anchor) for one prompt file, against the active pack."""
    R = R or rules()
    text = open(path, encoding="utf-8").read()
    out = []
    m = ANCHOR_LINE.search(text)
    problem = anchor_problem(text, m, R)
    if problem:
        out.append(
            "%s — the prompt must name the feature the acceptance gate will "
            "measure and its ruled size in metres (`Gate anchor: %s`), and the "
            "gate must have that ruler. Without it the gate is left to find a "
            "ruler in the picture, which is how hall/N and hall/S came back "
            "unmeasurable and were withheld [row21:prompt.no_gate_anchor]"
            % (problem, R.example_anchor))
    if FORBIDS_SCALE.search(text) and CORRECTION.search(text):
        out.append(
            "contradicts itself about the camera: it forbids `changing the "
            "camera scale` and then instructs one (%r). The negative won on "
            "five of seven cand-2 walls and two came back corner-for-corner "
            "identical to the round before "
            "[row21:prompt.contradictory_scale]" % CORRECTION.search(text).group(0))
    if FORBIDS_ALL_FEATURES.search(text) and problem:
        out.append(
            "forbids corners AND names no gate anchor, so the frame it asks "
            "for contains nothing of ruled size at all — an image that cannot "
            "be admitted however well it is painted "
            "[row21:prompt.unmeasurable_by_design]")
    if not problem and m and ANCHOR_ON_FLOOR.search(m.group(1)) \
            and FORBIDS_FLOOR.search(text):
        out.append(
            "declares an anchor measured ABOVE THE FLOOR and then forbids the "
            "floor: %r. A height above a datum the frame does not show is not a "
            "length in that frame, which is how passage-N and passage-S came "
            "back WITHHELD a second time, at cand-3, under the very rule "
            "written to stop it [row21:prompt.anchor_datum_forbidden]"
            % FORBIDS_FLOOR.search(text).group(0))
    # ---- row 29's voice clauses -------------------------------------------
    if EXTERIOR_USE.search(text):
        hit = R.interior_fabric.search(text)
        if hit:
            out.append(
                "declares an EXTERIOR scene on its `Use case:` line and then "
                "names interior fabric (%r). An outdoor facing's prompt may not "
                "name this world's interior fabric at all, not even to forbid "
                "it, because a prompt that forbids a word has still put that "
                "word in front of the generator.%s "
                "[row29:prompt.interior_fabric_outdoors]"
                % (hit.group(0), R.why("interior_fabric")))
    elif not problem and m and not R.panelling.search(m.group(1)):
        hit = R.panelling.search(text)
        if hit:
            out.append(
                "declares `%s` -- an anchor that is NOT the ruled one, so this "
                "is a room without that fabric in it -- and then names %r "
                "anyway. That is one room's material paragraph leaking into a "
                "room that never had it.%s [row29:prompt.voice_incoherent]"
                % (m.group(0).strip(), hit.group(0), R.why("panelling")))
    arms = R.rationed_line.search(text)
    if arms:
        asset = ASSET_TYPE.search(text)
        where = asset.group(0) if asset else ""
        if not R.entitled_to_rationed.search(where):
            out.append(
                "declares a RATIONED feature (%r) on a wall whose `%s` names "
                "none of the places this world entitles to it. A feature that "
                "appears everywhere is not a distinction, and unrationed it "
                "reads as one wall copied down a corridor.%s "
                "[row29:prompt.heraldry_unrationed]"
                % (arms.group(0)[:60], where.strip() or "Asset type:",
                   R.why("rationed")))
    return out, (m.group(0) if m else None)


def main(argv):
    import time                                                    # [row 33]
    import timings                                                 # [row 33]
    _t = time.time()                                               # [row 33]
    try:
        R = rules()
    except PackRefused as e:
        print("REFUSED %s" % e)
        return 1
    files = strip_pack_args(argv[1:])
    if not files:
        for d in sorted(os.listdir(SOURCE)):
            p = os.path.join(SOURCE, d)
            if not os.path.isdir(p) or d == "refs":
                continue
            files += [os.path.join(p, f) for f in sorted(os.listdir(p))
                      if f.endswith(".prompt.txt")]
    bad = 0
    for f in files:
        findings, anchor = lint(f, R)
        rel = os.path.relpath(f, REPO)
        if findings:
            bad += 1
            print("REFUSED %s" % rel)
            for x in findings:
                print("    - %s" % x)
        else:
            print("ok      %s  (%s)" % (rel, anchor))
    print("\n%d of %d prompt(s) refused.  [pack: %s]" % (bad, len(files), R.pack.name))
    timings.record("lint.prompts", _t, time.time(), None,          # [row 33]
                   {"prompts": len(files), "refused": bad})
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
