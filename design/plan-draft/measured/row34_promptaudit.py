#!/usr/bin/env python3
"""Row 34 — the prompt-hygiene audit, and the gate the generation-3 arms answer to.

    python3 design/plan-draft/measured/row34_promptaudit.py            # every row-34 prompt
    python3 design/plan-draft/measured/row34_promptaudit.py FILE ...
    python3 design/plan-draft/measured/row34_promptaudit.py --strict FILE ...   # exit 1 on any finding

WHY THIS EXISTS AS A TOOL AND NOT AS A PARAGRAPH. `design/production-law.md`
clause 6: a correction lands in the emitter, a gate or the instrument, never in a
per-run note. The model-specific research produced four claims about prompt TEXT
that we can check mechanically before an image exists, so they are checked
mechanically. `prompt_lint.py` is untouched — it owns the gate-anchor and voice
rules and this owns the model-behaviour rules, because merging them would put a
researched claim and a scarred one behind the same exit code.

THE FOUR RULES, EACH WITH THE EVIDENCE TIER IT CARRIES:

  DEAD VOCABULARY        [attributed corpus] Terms with ZERO occurrences across a
                         529-prompt attributed corpus for this model family:
                         "vanishing point", "one-point perspective",
                         "orthographic", "camera height <N>m", "archviz",
                         "V-Ray". Not "these hurt" — "no practitioner writing for
                         this model uses them", which makes them untested
                         vocabulary rather than craft.

  NOUN REPETITION        [community, replicated] Repeating a countable noun
                         multiplies the object. A prompt that says "door" five
                         times is asking, in one reading, for five doors. Counted
                         per countable noun; the wall's own carrier count is the
                         licence, so a wall with two doors may say "door" twice
                         as often as a wall with one.

  TAG-STYLE COMMA PROSE  [community] Comma-separated fragment lists induce grid
                         and collage artefacts where conversational prose does
                         not. Measured as the share of lines that are fragments
                         with a high comma density and no verb-ish token.

  STYLE-OF TRIGGER       [community] "in the style of" is a specific trigger for
                         pastiche and for text artefacts. Flagged wherever it
                         appears.

WHAT THIS TOOL IS NOT. Every rule above is RESEARCHED, not scarred — none of it
has yet been shown to move a number on OUR instrument. That is exactly what
generation 3 is for, and it is why the tool reports by default and only refuses
under `--strict`, which the generation-3 composers opt into and the earlier
generations' prompts do not.
"""
import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SOURCE = os.path.join(REPO, "backdrops", "source")

#: Zero occurrences in the attributed corpus. Each is a phrase rather than a
#: word, so "the vanishing light" is not caught and "vanishing point" is.
DEAD_VOCABULARY = [
    (re.compile(r"vanishing\s+point", re.I), "vanishing point"),
    (re.compile(r"\bone[- ]point\s+perspective", re.I), "one-point perspective"),
    (re.compile(r"\btwo[- ]point\s+perspective", re.I), "two-point perspective"),
    (re.compile(r"\borthographic\b", re.I), "orthographic"),
    (re.compile(r"camera\s+height\s+[\d.]+\s*m\b", re.I), "camera height <N>m"),
    (re.compile(r"\barchviz\b", re.I), "archviz"),
    (re.compile(r"\bv-?ray\b", re.I), "V-Ray"),
    (re.compile(r"\bfocal\s+length\b", re.I), "focal length"),
    (re.compile(r"\bprincipal\s+point\b", re.I), "principal point"),
]

STYLE_OF = re.compile(r"in\s+the\s+style\s+of", re.I)

#: The countable things a room prompt names. Uncountable surfaces (floor, wall,
#: ceiling) are NOT here: "the wall" repeated does not ask for more walls, and
#: including them would make the rule fire on every prompt this project writes.
COUNTABLE = ["door", "window", "fireplace", "hearth", "chimney", "beam", "shield",
             "bay", "chair", "table", "candle", "lamp", "painting"]

#: A line reads as a tag list when it is mostly comma-separated short fragments.
#: Three commas in a line with no finite verb is the shape; the threshold is
#: stated here rather than tuned per prompt.
TAG_COMMAS = 3
#: An IMPERATIVE is prose, not a tag list. The rule is about fragment
#: enumerations — "oak, brass, vellum, leaded glass" — and "Do not invent
#: additional typography." is a sentence with a verb in it. Leaving the
#: imperatives out made the tool refuse the very positive-substitution line the
#: research recommends, which is the tool being wrong rather than the prompt.
VERBISH = re.compile(r"\b(is|are|runs?|stands?|meets?|falls?|carries|sits?|has|have|"
                     r"contains?|reaches?|spans?|shows?|draws?|paints?|comes?|goes?|"
                     r"begins?|ends?|holds?|marks?|governs?|wins?|looks?|"
                     r"do|does|don't|invent|keep|keeps?|leave|leaves?|make|makes?|use|uses?)\b",
                     re.I)


#: Compounds that contain a countable noun and are not one. "chair-rail" is a
#: moulding, not a chair, and counting it made every panelled wall in this row
#: read as asking for five chairs — a false positive found by running the tool
#: over the corpus before trusting it.
NOT_THE_NOUN = re.compile(r"\bchair[- ]rail", re.I)

#: A NEGATED mention does not multiply an object. "this wall carries no window"
#: names the noun in order to exclude it, and counting it forced the composers
#: toward silence about things they must positively exclude. Only affirmative
#: mentions are counted.
NEGATED = re.compile(r"\b(no|not|never|without|zero)\s+(\w+\s+){0,2}$", re.I)


def count_nouns(text):
    masked = NOT_THE_NOUN.sub("MOULDING", text)
    out = {}
    for n in COUNTABLE:
        c = 0
        for m in re.finditer(r"\b%ss?\b" % re.escape(n), masked, re.I):
            if NEGATED.search(masked[max(0, m.start() - 40):m.start()]):
                continue
            c += 1
        if c:
            out[n] = c
    return out


def tag_lines(text):
    bad = []
    for line in text.split("\n"):
        s = line.strip()
        if not s or s.count(",") < TAG_COMMAS:
            continue
        if not VERBISH.search(s):
            bad.append(s)
    return bad


def audit(path, carrier_counts=None):
    """(findings, facts) for one prompt. `carrier_counts` is the wall's own
    licence for noun repetition — a wall with two doors may say `door` twice as
    often as a wall with one, so the allowance is derived, never typed."""
    text = open(path, encoding="utf-8").read()
    findings = []
    for pat, name in DEAD_VOCABULARY:
        m = pat.search(text)
        if m:
            findings.append("dead vocabulary: %r — zero occurrences across the attributed "
                            "corpus for this model family, so it is untested vocabulary "
                            "rather than craft [row34:prompt.dead_vocabulary]" % m.group(0))
    m = STYLE_OF.search(text)
    if m:
        findings.append("carries %r, a community-reported trigger for pastiche and for text "
                        "artefacts [row34:prompt.style_of_trigger]" % m.group(0))
    nouns = count_nouns(text)
    for n, c in sorted(nouns.items() if carrier_counts is not None else []):
        licensed = 1 + 2 * carrier_counts.get(n, 0)
        if c > licensed:
            findings.append("says %r %d times against a licence of %d for this wall (one "
                            "mention plus two per carrier the plan actually draws); repeating a "
                            "countable noun multiplies the object "
                            "[row34:prompt.noun_repetition]" % (n, c, licensed))
    tags = tag_lines(text)
    if tags:
        findings.append("has %d comma-tag line(s) with no finite verb, the shape that induces "
                        "grid and collage artefacts where prose does not; first is %r "
                        "[row34:prompt.tag_style_prose]" % (len(tags), tags[0][:70]))
    return findings, {"nouns": nouns, "tag_lines": len(tags), "chars": len(text),
                      "noun_rule": "applied" if carrier_counts is not None else
                                   "abstained - this wall's carrier licence is not knowable here"}


def carriers_for(path):
    """The wall's own carrier counts, off the row-34 manifests, so the noun
    licence is the plan's rather than a guess. Returns {} when the prompt is not
    one of this row's."""
    import json
    base = os.path.basename(os.path.dirname(path))
    for name in ("manifest.json", "manifest-gen2.json", "manifest-gen3.json"):
        p = os.path.join(REPO, "design", "batches", "row34-evolution", name)
        if not os.path.exists(p):
            continue
        for w in json.load(open(p)).get("walls", []):
            loc, fac = w["key"].split("/")
            if "%s-%s" % (loc, fac) != base:
                continue
            out = {}
            for s in w.get("stamped", []):
                out[s["kind"]] = out.get(s["kind"], 0) + 1
            return out
    # UNKNOWN, AND IT SAYS SO RATHER THAN GUESSING ZERO. A facing's carriers are
    # DERIVED (`plan-projection.facingCarriers`), not stored on the room, so this
    # file cannot compute them for a wall outside row 34's own manifests. The
    # first version returned {} there, which read as "no carriers" and scored a
    # five-window gallery against a licence of one — 38 of the manor's 88 prompts
    # "failed" on a window count the plan itself asks for. A gate whose
    # denominator is wrong is worse than no gate, so the noun rule ABSTAINS where
    # it cannot know the licence, and the summary counts the abstentions.
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="*")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 on any finding (the generation-3 composers opt in)")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    files = a.files
    if not files:
        for d in sorted(os.listdir(SOURCE)):
            p = os.path.join(SOURCE, d)
            if not os.path.isdir(p):
                continue
            files += [os.path.join(p, f) for f in sorted(os.listdir(p))
                      if f.startswith("row34-") and f.endswith(".prompt.txt")]
    bad = abstained = 0
    for f in sorted(files):
        findings, facts = audit(f, carriers_for(f))
        if facts["noun_rule"].startswith("abstained"):
            abstained += 1
        rel = os.path.relpath(f, REPO)
        if findings:
            bad += 1
            print("FINDINGS %s" % rel)
            for x in findings:
                print("    - %s" % x)
        elif not a.quiet:
            print("clean    %s  (%s)" % (rel, ", ".join(
                "%s x%d" % (k, v) for k, v in sorted(facts["nouns"].items())) or "no countable noun"))
    print("\n%d of %d prompt(s) carry findings." % (bad, len(files)))
    if abstained:
        print("%d of them had the noun rule ABSTAIN: their carrier licence is not knowable "
              "from this file, and a wrong denominator is worse than no gate." % abstained)
    return 1 if (bad and a.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
