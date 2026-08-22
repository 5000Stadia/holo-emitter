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

WHAT IT CLOCKED, per the production law's fifth clause (an improvement must
clock as one): run over the seven cand-2 prompts this refuses 5 for (1) and 7
for (2). The accuracy metric it is aimed at is the FIRST-ROLL PASS RATE, whose
baseline is 0 of 7, and the next round is what says whether these two clauses
moved it. Recorded here rather than asserted: if the next round misses again
for a third reason, this file gained a clause and did not gain a verdict.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SOURCE = os.path.join(REPO, "backdrops", "source")

# The correction half of the contradiction: a sentence that moves the camera or
# resizes the wall plane. Any one of these is an instruction to change scale.
CORRECTION = re.compile(
    r"(move the camera|enlarge the (far|central)|must span about|spans approximately|"
    r"shorten only the apparent camera)", re.I)
# The prohibition half, in the words the seat's own template uses.
FORBIDS_SCALE = re.compile(r"avoid:[^\n]*changing the camera scale", re.I)
# A prompt that forbids every feature the gate can measure.
FORBIDS_ALL_FEATURES = re.compile(r"no corners in frame", re.I)
ANCHOR = re.compile(r"^gate anchor:\s*(.+?),\s*([0-9]*\.?[0-9]+)\s*m\b", re.I | re.M)


def lint(path):
    """(findings, anchor) for one prompt file."""
    text = open(path, encoding="utf-8").read()
    out = []
    m = ANCHOR.search(text)
    if not m:
        out.append(
            "no `Gate anchor:` line — the prompt must name the feature the "
            "acceptance gate will measure and its ruled size in metres "
            "(`Gate anchor: the door opening's height at the wall plane, 2.00 m`). "
            "Without it the gate is left to find a ruler in the picture, which "
            "is how hall/N and hall/S came back unmeasurable and were withheld "
            "[row21:prompt.no_gate_anchor]")
    if FORBIDS_SCALE.search(text) and CORRECTION.search(text):
        out.append(
            "contradicts itself about the camera: it forbids `changing the "
            "camera scale` and then instructs one (%r). The negative won on "
            "five of seven cand-2 walls and two came back corner-for-corner "
            "identical to the round before "
            "[row21:prompt.contradictory_scale]" % CORRECTION.search(text).group(0))
    if FORBIDS_ALL_FEATURES.search(text) and not m:
        out.append(
            "forbids corners AND names no gate anchor, so the frame it asks "
            "for contains nothing of ruled size at all — an image that cannot "
            "be admitted however well it is painted "
            "[row21:prompt.unmeasurable_by_design]")
    return out, (m.group(0) if m else None)


def main(argv):
    files = argv[1:]
    if not files:
        for d in sorted(os.listdir(SOURCE)):
            p = os.path.join(SOURCE, d)
            if not os.path.isdir(p) or d == "refs":
                continue
            files += [os.path.join(p, f) for f in sorted(os.listdir(p))
                      if f.endswith(".prompt.txt")]
    bad = 0
    for f in files:
        findings, anchor = lint(f)
        rel = os.path.relpath(f, REPO)
        if findings:
            bad += 1
            print("REFUSED %s" % rel)
            for x in findings:
                print("    - %s" % x)
        else:
            print("ok      %s  (%s)" % (rel, anchor))
    print("\n%d of %d prompt(s) refused." % (bad, len(files)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
