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
ANCHOR = re.compile(r"^gate anchor:\s*(.+?),\s*([0-9]*\.?[0-9]+)\s*m\b", re.I | re.M)

# THE RULERS THE GATE ACTUALLY HAS, and their ruled sizes in metres. A `Gate
# anchor:` line that names something else, or names one of these at the wrong
# size, is not an anchor — it is a sentence. A critic wrote
# `Gate anchor: nothing whatsoever, 0 m` and satisfied both of the clauses that
# depend on an anchor being present.
RULERS = [
    (re.compile(r"door[^,]*height|head[^,]*(?:soffit|threshold)", re.I), 2.00,
     "the door opening's height at the wall plane"),
    (re.compile(r"door[^,]*width", re.I), 1.00, "the door opening's width"),
    (re.compile(r"fireplace|hearth", re.I), 0.90, "the fireplace opening, jamb to jamb"),
    (re.compile(r"\bbay\b|mullion", re.I), 0.90, "a window bay between its outer mullion centres"),
    (re.compile(r"chair[- ]?rail|wainscot|dado", re.I), 0.95,
     "the wainscot chair-rail above the floor (blueprint §11's universal anchor)"),
    (re.compile(r"end wall|corridor width|passage width", re.I), 2.60,
     "the cross passage's end wall"),
]


def anchor_problem(text, m):
    """Why this prompt's `Gate anchor:` line is not one, or None."""
    if not m:
        return ("no `Gate anchor:` line")
    what, size = m.group(1).strip(), float(m.group(2))
    if size <= 0:
        return ("`Gate anchor: %s, %s m` declares a size of nothing — a ruler with "
                "no length measures nothing" % (what, m.group(2)))
    for pat, ruled, name in RULERS:
        if pat.search(what):
            if abs(size - ruled) > 0.01:
                return ("`Gate anchor: %s, %.2f m` names %s, which this project rules "
                        "at %.2f m — the prompt and the gate would be measuring the "
                        "same feature against different lengths" % (what, size, name, ruled))
            return None
    return ("`Gate anchor: %s, %.2f m` names no feature the gate can measure. The "
            "rulers are: %s" % (what, size, "; ".join(n for _, _, n in RULERS)))


def lint(path):
    """(findings, anchor) for one prompt file."""
    text = open(path, encoding="utf-8").read()
    out = []
    m = ANCHOR.search(text)
    problem = anchor_problem(text, m)
    if problem:
        out.append(
            "%s — the prompt must name the feature the acceptance gate will "
            "measure and its ruled size in metres (`Gate anchor: the door "
            "opening's height at the wall plane, 2.00 m`), and the gate must "
            "have that ruler. Without it the gate is left to find a ruler in "
            "the picture, which is how hall/N and hall/S came back "
            "unmeasurable and were withheld [row21:prompt.no_gate_anchor]"
            % problem)
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
