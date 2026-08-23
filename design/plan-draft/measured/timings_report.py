#!/usr/bin/env python3
"""The pipeline's stopwatch — the analyzer. [Row 33]

    python3 design/plan-draft/measured/timings_report.py            # read and report
    python3 design/plan-draft/measured/timings_report.py --backfill # mine Test 1 first
    python3 design/plan-draft/measured/timings_report.py --monitor  # one line, exit 1 on a flag

[HUMAN, 2026-08-24, verbatim] "I want you or a subtask to be constantly
monitoring and sampling the performance of these steps we really need to get it
down to a highly efficient process. I want it to be so quick it could almost be
live in the future. Lets track length of time for each step and ask how can this
be faster while maintaining quality"

WHAT THIS COMPUTES AND WHAT IT REFUSES TO GUESS.

  per step      count, p50, p95, total wall-clock, and throughput (events per
                minute over the step's OWN active span, not over the run).
  idle gaps     spans where NOTHING ran while work was pending. Pending is
                computed — a wall is pending from its first emit/generate record
                until its terminal one, and any wall whose recorded status in
                `run-state.json` is not terminal is pending to the end of the
                ledger. A gap with nothing pending is a QUIET gap and is named
                as one: the pipeline was idle because there was no work, which
                is not a defect.
  regression    per step, the RECENT window against the ledger's own trailing
                BASELINE. A flag carries both p50s and their ratio, because a
                flag that does not carry its arithmetic is an assertion.
  top           the step holding the largest share of measured wall-clock,
                named with its number (row 33's own clause).

MARKERS. A record whose `ts_end <= ts_start` knows WHEN a step landed and not
HOW LONG it took — a git commit timestamp is all a bake left behind, and the
backfill says so in `detail.derivation`. Markers are counted, listed and
excluded from every duration statistic; they still count as activity, so a gap
is not invented across a step whose duration is unknown.

NO MODEL RUNS HERE, and no loop. Row 30's lens is the law this file is under:
this is template-and-numbers, deterministic, and the standing monitor is a
scheduler calling `--monitor` on a cadence, never a process that watches.
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import timings                                            # noqa: E402  the writer

DEFAULT_REPORT = os.path.join(HERE, "timings-report.md")

#: A wall in one of these states is no longer waiting on the pipeline.
TERMINAL_STATUS = {"promoted", "parked", "admitted-not-promoted", "admitted"}

#: Steps that mark a wall as entering the pipeline / leaving it.
ENTER_STEPS = ("emit.", "generate.")
LEAVE_STEPS = ("promote.wall", "park.wall")


# ------------------------------------------------------------------ #
# Reading                                                             #
# ------------------------------------------------------------------ #
def load(path):
    """Records and the count of lines that were not records.

    A torn or half-written line is DROPPED AND COUNTED, never repaired: the
    count is the writer's own concurrency claim under test on real data, and a
    reader that quietly fixed lines would make that claim unfalsifiable.
    """
    recs, bad = [], 0
    if not os.path.exists(path):
        return recs, bad
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                bad += 1
                continue
            if not isinstance(r, dict) or "ts_start" not in r or "ts_end" not in r \
               or "step" not in r:
                bad += 1
                continue
            recs.append(r)
    recs.sort(key=lambda r: (r["ts_start"], r["ts_end"]))
    return recs, bad


def is_marker(r):
    return float(r["ts_end"]) <= float(r["ts_start"])


def dur(r):
    return float(r["ts_end"]) - float(r["ts_start"])


def pct(sorted_vals, q):
    """Nearest-rank percentile. No interpolation: the value reported is a
    duration something actually took."""
    if not sorted_vals:
        return None
    i = int(round(q * (len(sorted_vals) - 1)))
    return sorted_vals[max(0, min(i, len(sorted_vals) - 1))]


def human(s):
    if s is None:
        return "--"
    if s < 1:
        return "%.0f ms" % (s * 1000)
    if s < 90:
        return "%.2f s" % s
    if s < 5400:
        return "%.1f min" % (s / 60)
    return "%.2f h" % (s / 3600)


def clock(ts):
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))


# ------------------------------------------------------------------ #
# Per-step statistics                                                 #
# ------------------------------------------------------------------ #
def step_stats(recs):
    by = {}
    for r in recs:
        by.setdefault(r["step"], []).append(r)
    out = []
    for name, rs in sorted(by.items()):
        timed = [r for r in rs if not is_marker(r)]
        ds = sorted(dur(r) for r in timed)
        span_lo = min(float(r["ts_start"]) for r in rs)
        span_hi = max(float(r["ts_end"]) for r in rs)
        span = max(span_hi - span_lo, 0.0)
        out.append({
            "step": name,
            "count": len(rs),
            "markers": len(rs) - len(timed),
            "backfilled": sum(1 for r in rs if r.get("backfilled")),
            "p50": pct(ds, 0.50), "p95": pct(ds, 0.95),
            "min": ds[0] if ds else None, "max": ds[-1] if ds else None,
            # None, not 0: an all-marker step has NO measured wall-clock, and
            # printing "0 ms" would say the bakes were free.
            "total": sum(ds) if ds else None,
            # Throughput over the step's OWN active span. A step that ran 86
            # times in one second and a step that ran 86 times over two days
            # are different pipelines, and dividing both by the run's length
            # would say the same number about them.
            "per_min": (len(rs) / (span / 60.0)) if span > 1e-9 else None,
            "span_s": span, "first": span_lo, "last": span_hi,
        })
    out.sort(key=lambda s: -(s["total"] or 0))
    return out


def top_contributor(stats):
    timed = [s for s in stats if (s["total"] or 0) > 0]
    if not timed:
        return None
    grand = sum(s["total"] for s in timed)
    top = timed[0]
    return {"step": top["step"], "total": top["total"], "grand": grand,
            "share": (top["total"] / grand) if grand else 0.0,
            "count": top["count"], "p50": top["p50"]}


# ------------------------------------------------------------------ #
# Idle gaps                                                           #
# ------------------------------------------------------------------ #
def merged_activity(recs):
    """[start, end] spans over which SOMETHING was running, merged."""
    spans = []
    for r in recs:
        a, b = float(r["ts_start"]), float(r["ts_end"])
        spans.append((a, max(b, a)))
    spans.sort()
    merged = []
    for a, b in spans:
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    return merged


def pending_timeline(recs, run_state):
    """(enter, leave) epoch per wall key, from the ledger and the run state.

    ENTER is the wall's first emit/generate record — the moment the pipeline
    owed it a painting. LEAVE is its first terminal record. A wall the ledger
    never terminates but whose recorded status is terminal leaves at its last
    record; a wall whose status is NOT terminal (held, retry, waiting) never
    leaves, because it is still owed today.
    """
    enter, leave, last = {}, {}, {}
    for r in recs:
        k = r.get("key")
        if not k:
            continue
        a, b = float(r["ts_start"]), float(r["ts_end"])
        last[k] = max(last.get(k, b), b)
        if r["step"].startswith(ENTER_STEPS):
            enter[k] = min(enter.get(k, a), a)
        if r["step"].startswith(LEAVE_STEPS) and not r.get("detail", {}).get("refused"):
            leave[k] = min(leave.get(k, b), b)
    walls = (run_state or {}).get("walls", {})
    for k, t in list(enter.items()):
        if k in leave:
            continue
        status = (walls.get(k) or {}).get("status")
        if status in TERMINAL_STATUS:
            leave[k] = last.get(k, t)
    return enter, leave


def pending_at(enter, leave, t):
    n = 0
    for k, a in enter.items():
        if a <= t and (k not in leave or leave[k] > t):
            n += 1
    return n


#: The handoffs a piece of work makes between steps. A pipeline's latency is
#: not the sum of its steps; it is the sum of its steps AND the time work spends
#: on the floor between them, and only the second kind is free to delete.
HANDOFFS = [
    ("generate.roll", "measure.candidate",
     "a candidate on disk, waiting for the sweep to read it"),
    ("emit.packet", "generate.roll",
     "a packet dispatched, waiting for the seat to paint it"),
]


def queue_latency(recs):
    """Per handoff: how long work SAT between two steps, keyed by roll id.

    This is the idle the ledger convicts most sharply, and it is invisible to a
    gap scan: while a candidate sits unmeasured, other candidates are being
    generated, so SOMETHING is always running and the activity timeline never
    breaks. The work still waited, and the waiting is the latency.
    """
    #  A roll id identifies one image and is the sharpest join. A facing key is
    #  the fallback, for a step that is per-wall rather than per-roll (a packet
    #  carries several rolls) — chosen per handoff, never mixed, because joining
    #  on both at once counts a two-roll wall three times. Earliest end wins on
    #  both sides: the handoff is measured from the moment the work was ready to
    #  the moment it was taken.
    by_roll, by_key = {}, {}
    for r in recs:
        b, key = float(r["ts_end"]), r.get("key")
        rid = (r.get("detail") or {}).get("roll_id")
        if rid:
            cur = by_roll.setdefault(r["step"], {})
            if rid not in cur or b < cur[rid][0]:
                cur[rid] = (b, key)
        if key:
            cur = by_key.setdefault(r["step"], {})
            if key not in cur or b < cur[key][0]:
                cur[key] = (b, key)
    out = []
    for a_step, b_step, what in HANDOFFS:
        if by_roll.get(a_step) and by_roll.get(b_step):
            A, B, joined = by_roll[a_step], by_roll[b_step], "roll id"
        else:
            A, B, joined = by_key.get(a_step, {}), by_key.get(b_step, {}), "facing"
        pairs = []
        for rid, (ta, key) in A.items():
            if rid in B and B[rid][0] >= ta:
                pairs.append((B[rid][0] - ta, key or B[rid][1], rid))
        if not pairs:
            continue
        waits = sorted(p[0] for p in pairs)
        pairs.sort(key=lambda p: -p[0])
        out.append({"from": a_step, "to": b_step, "what": what, "joined": joined,
                    "n": len(pairs), "p50": pct(waits, 0.50),
                    "p95": pct(waits, 0.95), "max": waits[-1],
                    "total": sum(waits), "worst": pairs[:5]})
    return out


def idle_gaps(recs, run_state, threshold):
    """Gaps in activity, each labelled IDLE (work pending) or QUIET (none)."""
    merged = merged_activity(recs)
    enter, leave = pending_timeline(recs, run_state)
    gaps = []
    for (a1, b1), (a2, _b2) in zip(merged, merged[1:]):
        if a2 - b1 < threshold:
            continue
        mid = (b1 + a2) / 2.0
        n = pending_at(enter, leave, mid)
        before = [r["step"] for r in recs if abs(float(r["ts_end"]) - b1) < 1e-6]
        after = [r["step"] for r in recs if abs(float(r["ts_start"]) - a2) < 1e-6]
        gaps.append({
            "start": b1, "end": a2, "seconds": a2 - b1,
            "pending": n, "idle": n > 0,
            "last_step": before[0] if before else "?",
            "next_step": after[0] if after else "?",
        })
    gaps.sort(key=lambda g: -g["seconds"])
    return gaps


# ------------------------------------------------------------------ #
# Regression against the ledger's own trailing baseline               #
# ------------------------------------------------------------------ #
def regressions(recs, window, min_baseline, factor):
    """One entry per step whose recent p50 has risen past the baseline's.

    The baseline is the ledger's own history and nothing else — no literal, no
    remembered number — so the flag survives a machine change and a step that
    was always slow never flags.
    """
    by = {}
    for r in recs:
        if is_marker(r):
            continue
        by.setdefault(r["step"], []).append(r)
    flags, checked = [], []
    for name, rs in sorted(by.items()):
        rs.sort(key=lambda r: float(r["ts_end"]))
        if len(rs) < window + min_baseline:
            checked.append({"step": name, "verdict": "too few events",
                            "have": len(rs), "need": window + min_baseline})
            continue
        recent = sorted(dur(r) for r in rs[-window:])
        base = sorted(dur(r) for r in rs[:-window])
        rp, bp = pct(recent, 0.50), pct(base, 0.50)
        ratio = (rp / bp) if bp else None
        entry = {"step": name, "recent_p50": rp, "baseline_p50": bp,
                 "ratio": ratio, "window": window, "baseline_n": len(base),
                 "recent_p95": pct(recent, 0.95), "baseline_p95": pct(base, 0.95)}
        if ratio is not None and ratio >= factor:
            flags.append(entry)
        else:
            entry["verdict"] = "steady"
            checked.append(entry)
    flags.sort(key=lambda f: -(f["ratio"] or 0))
    return flags, checked


# ------------------------------------------------------------------ #
# Backfill — Test 1's own history, honestly marked                    #
# ------------------------------------------------------------------ #
def _git(tree, *args):
    try:
        r = subprocess.run(["git", "-C", tree] + list(args),
                           capture_output=True, text=True, timeout=60)
        return r.stdout if r.returncode == 0 else ""
    except Exception:
        return ""


def _cluster(items, gap=120.0):
    """[(key, detail, mtime)] -> spans, by reading a batch as a batch.

    A file's mtime is when a step FINISHED and nothing on disk says when it
    started. Within a burst — files written seconds apart by one loop — the
    previous file's mtime is when this one began, which is the only start time
    the evidence actually carries. The first item of a burst has no predecessor,
    so it takes the burst's own median step; a burst of one is a MARKER, because
    inventing a duration for it would be the guess this file refuses to make.
    """
    items = sorted(items, key=lambda x: x[2])
    bursts, cur = [], []
    for it in items:
        if cur and it[2] - cur[-1][2] > gap:
            bursts.append(cur)
            cur = []
        cur.append(it)
    if cur:
        bursts.append(cur)
    out = []
    for burst in bursts:
        deltas = sorted(b[2] - a[2] for a, b in zip(burst, burst[1:]))
        med = deltas[len(deltas) // 2] if deltas else None
        for i, (key, detail, mt) in enumerate(burst):
            if i == 0:
                if med is None:
                    out.append((key, detail, mt, mt, True))     # marker
                else:
                    out.append((key, detail, mt - med, mt, False))
            else:
                out.append((key, detail, burst[i - 1][2], mt, False))
    return out


def _facing_key(dirname):
    """`great_hall-N` -> `great_hall/N`."""
    loc, _, f = dirname.rpartition("-")
    return "%s/%s" % (loc, f) if loc and len(f) == 1 else dirname


def mine(tree):
    """Every step event Test 1 left evidence for. Nothing is invented."""
    out = []
    srcdir = os.path.join(tree, "backdrops", "source")
    anomalies = []

    # 1. GENERATION — the one step no code of ours runs, and the one the record
    #    already proves is derivable: the emitter writes the prompt file, the
    #    external seat writes the candidate beside it.
    for png in sorted(glob.glob(os.path.join(srcdir, "*", "row23-*.png"))):
        prompt = png[:-4] + ".prompt.txt"
        if not os.path.exists(prompt):
            continue
        key = _facing_key(os.path.basename(os.path.dirname(png)))
        a, b = os.path.getmtime(prompt), os.path.getmtime(png)
        rel = os.path.relpath(png, tree)
        det = {"candidate": rel, "roll_id": os.path.basename(png)[6:-4],
               "derivation": "prompt-file mtime to candidate-file mtime — the "
                             "generating seat is external and leaves the file "
                             "as its only clock"}
        if b <= a:
            det["derivation"] += ("; the prompt is NEWER than the candidate "
                                  "(the packet was re-emitted after the image "
                                  "arrived), so only the arrival is known")
            anomalies.append(rel)
            out.append(("generate.roll", key, b, b, det))
        else:
            out.append(("generate.roll", key, a, b, det))

    # 2. EMIT — one scaffold render + packet write per facing, in one burst.
    packs = []
    for scaf in glob.glob(os.path.join(tree, "design", "batches", "row23-scaffold",
                                       "manor", "*", "scaffold.png")):
        d = os.path.dirname(scaf)
        packs.append((_facing_key(os.path.basename(d)),
                      {"packet": os.path.relpath(d, tree),
                       "derivation": "scaffold.png mtimes, read as the burst they "
                                     "were written in (see _cluster)"},
                      os.path.getmtime(scaf)))
    for key, det, a, b, marker in _cluster(packs):
        out.append(("emit.facing", key, a, b, det))
    packets = []
    for pk in glob.glob(os.path.join(tree, "design", "batches", "row23-scaffold",
                                     "manor", "*", "PACKET.md")):
        d = os.path.dirname(pk)
        packets.append((_facing_key(os.path.basename(d)),
                        {"packet": os.path.relpath(d, tree),
                         "derivation": "PACKET.md mtimes, read as the burst they were "
                                       "written in (see _cluster)"},
                        os.path.getmtime(pk)))
    for key, det, a, b, marker in _cluster(packets):
        out.append(("emit.packet", key, a, b, det))

    # 3. MEASURE — one reading document per candidate, likewise a burst per sweep.
    meas = []
    for j in glob.glob(os.path.join(tree, "design", "plan-draft", "measured",
                                    "manor", "*.json")):
        rid = os.path.basename(j)[:-5]
        key = None
        try:
            doc = json.load(open(j))
            cand = doc.get("candidate") or ""
            if cand:
                key = _facing_key(os.path.basename(os.path.dirname(cand)))
        except Exception:
            pass
        meas.append((key, {"reading": os.path.relpath(j, tree), "roll_id": rid,
                           "derivation": "reading-document mtimes, read as the sweep "
                                         "burst they were written in (see _cluster)"},
                     os.path.getmtime(j)))
    for key, det, a, b, marker in _cluster(meas):
        out.append(("measure.candidate", key, a, b, det))

    # 4. PROMOTE — the meta, which is the last file a promotion writes.
    #
    #    NOT the promoted PNG's mtime to its meta's, which was this backfill's
    #    first reading and is wrong: row 27's recheck rewrote 22 metas at 11:00
    #    against PNGs promoted five hours earlier, so that pair reported
    #    promotions taking 5.6 and 14.6 hours and flagged a 20,000,000x
    #    regression off its own arithmetic. Two files being present is not
    #    evidence that one run wrote both. The metas are read as the bursts they
    #    were written in, exactly like the readings.
    proms = []
    for meta in glob.glob(os.path.join(tree, "backdrops", "*", "*.meta.json")):
        loc = os.path.basename(os.path.dirname(meta))
        if loc == "source":
            continue
        f = os.path.basename(meta).split(".")[0]
        proms.append(("%s/%s" % (loc, f),
                      {"meta": os.path.relpath(meta, tree),
                       "derivation": "the meta's mtime — the last file a promotion "
                                     "writes — read as the burst it was written in "
                                     "(see _cluster). A LOWER BOUND: the bake that "
                                     "follows a promotion left no per-wall evidence",
                       "lower_bound": True},
                      os.path.getmtime(meta)))
    for key, det, a, b, marker in _cluster(proms):
        out.append(("promote.wall", key, a, b, det))

    # 5. BAKE and PUBLISH — commits, which know when and never how long.
    for line in _git(tree, "log", "--format=%H %ct %s", "--", "backdrops/baked.js").splitlines():
        sha, _, rest = line.partition(" ")
        ct, _, subj = rest.partition(" ")
        try:
            t = float(ct)
        except ValueError:
            continue
        out.append(("bake.backdrops", None, t, t,
                    {"commit": sha[:9], "subject": subj[:120],
                     "derivation": "git commit timestamp — a commit records when a "
                                   "bake landed, never how long it took. MARKER"}))
    for ref in ("origin/gh-pages", "gh-pages"):
        log = _git(tree, "log", "--format=%H %ct %s", ref)
        if not log:
            continue
        for line in log.splitlines():
            sha, _, rest = line.partition(" ")
            ct, _, subj = rest.partition(" ")
            try:
                t = float(ct)
            except ValueError:
                continue
            out.append(("publish.site", None, t, t,
                        {"commit": sha[:9], "subject": subj[:120], "ref": ref,
                         "derivation": "the published branch's own commit. The publish "
                                       "script force-pushes an ORPHAN branch, so each "
                                       "publish erases the last one's record and this "
                                       "history is one commit deep by construction. "
                                       "MARKER"}))
        break
    return out, anomalies


#: The identity of a record for de-duplication. SIX decimals, which is exactly
#: what `timings.record` stores: rounding the mined value to three and the
#: stored value to three does not commute across a .0005 boundary, and two
#: records per re-run slipped through the first version of this on real data.
def _sig(step, key, a, b):
    return (step, key, round(float(a), 6), round(float(b), 6))


def _seen_keys(recs):
    return {_sig(r["step"], r.get("key"), r["ts_start"], r["ts_end"]) for r in recs}


def backfill(tree, ledger, until=None):
    """Write what is missing, and nothing that is already there.

    `until` bounds the mining to one run. It exists because a file's mtime is
    destroyed the moment anything rewrites it, and a tree under active work
    rewrites plenty: while this row was being built, a concurrent instrument
    re-ran 132 of the 214 manor readings to byte-identical files, moving their
    mtimes hours past the sweep that actually took them. A cutoff at the commit
    that closed the run keeps the mined window to evidence that had already
    landed, and everything past it is skipped and counted rather than folded in.
    """
    existing, _bad = load(ledger)
    seen = _seen_keys(existing)
    mined, anomalies = mine(tree)
    written, after = 0, 0
    for step, key, a, b, det in mined:
        if until is not None and float(b) > until:
            after += 1
            continue
        sig = _sig(step, key, a, b)
        if sig in seen:
            continue
        seen.add(sig)
        timings.record(step, a, b, key=key, detail=det, backfilled=True, path=ledger)
        written += 1
    return {"mined": len(mined), "written": written,
            "skipped": len(mined) - written - after, "after_cutoff": after,
            "until": until, "anomalies": anomalies, "tree": tree}


def resolve_until(word, tree):
    """`--until` as an epoch: a number, an ISO datetime, or any git revision.

    A revision is the useful form: the cutoff a run deserves is the commit that
    closed it, and naming that commit is a citation rather than a chosen number.
    """
    if not word:
        return None
    try:
        return float(word)
    except ValueError:
        pass
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return time.mktime(time.strptime(word, fmt))
        except ValueError:
            continue
    out = _git(tree, "log", "-1", "--format=%ct", word).strip()
    if out:
        return float(out)
    raise SystemExit("timings_report: --until %r is not an epoch, an ISO datetime, "
                     "or a revision this tree knows" % word)


def flattened_mtimes(tree):
    """A fresh worktree checkout stamps every file with the checkout second.

    Mining that tree would report a two-day production run as four seconds, so
    the tool says which tree it read and whether that tree's timestamps are the
    run's or the checkout's.
    """
    ps = glob.glob(os.path.join(tree, "backdrops", "source", "*", "row23-*.png"))
    if len(ps) < 10:
        return None
    ts = [os.path.getmtime(p) for p in ps]
    spread = max(ts) - min(ts)
    return {"files": len(ps), "spread_s": spread, "flat": spread < 600}


# ------------------------------------------------------------------ #
# Rendering                                                           #
# ------------------------------------------------------------------ #
def render(recs, bad_lines, stats, top, gaps, queues, flags, checked, opts, back=None,
           flat=None, run_state_path=None):
    L = []
    a = L.append
    a("# The pipeline's stopwatch — timings report")
    a("")
    a("GENERATED FILE — the one truth is `design/plan-draft/measured/timings.jsonl`.")
    a("Re-run: `python3 design/plan-draft/measured/timings_report.py`.")
    a("")
    if not recs:
        a("The ledger is empty. Nothing has been instrumented into it yet, and")
        a("`--backfill` has not been run against a tree that carries Test 1's evidence.")
        return "\n".join(L) + "\n"
    span = max(float(r["ts_end"]) for r in recs) - min(float(r["ts_start"]) for r in recs)
    nback = sum(1 for r in recs if r.get("backfilled"))
    a("%d record(s) over %s, %s to %s. %d backfilled, %d measured live, %d marker(s)."
      % (len(recs), human(span), clock(min(float(r['ts_start']) for r in recs)),
         clock(max(float(r['ts_end']) for r in recs)), nback, len(recs) - nback,
         sum(1 for r in recs if is_marker(r))))
    if bad_lines:
        a("")
        a("**%d unreadable line(s) in the ledger.** A torn line is the writer's "
          "atomicity claim failing on real data; it is dropped and counted, never "
          "repaired." % bad_lines)
    if flat and flat["flat"]:
        a("")
        a("**The mined tree's mtimes are flat** (%d candidate files spanning %.0f s): "
          "this is a fresh checkout, whose timestamps are the checkout's and not the "
          "run's. Point `--tree` at the working tree the run happened in."
          % (flat["files"], flat["spread_s"]))
    if back:
        a("")
        a("Backfill mined `%s`: %d event(s), %d written, %d already in the ledger."
          % (back["tree"], back["mined"], back["written"], back["skipped"]))
        if back.get("until"):
            a("Bounded at **%s** — %d event(s) whose evidence was written after the "
              "cutoff are excluded, because a tree under active work rewrites mtimes "
              "and one run's ledger holds one run's evidence."
              % (clock(back["until"]), back["after_cutoff"]))
        if back["anomalies"]:
            a("%d candidate(s) whose prompt file is newer than the image "
              "(re-emitted packets); only their arrival is recorded."
              % len(back["anomalies"]))

    a("")
    a("## Per step")
    a("")
    a("| step | n | p50 | p95 | min | max | total | per min | first | last |")
    a("|---|--:|--:|--:|--:|--:|--:|--:|---|---|")
    for s in stats:
        note = " *(%d marker)*" % s["markers"] if s["markers"] else ""
        a("| `%s`%s | %d | %s | %s | %s | %s | %s | %s | %s | %s |"
          % (s["step"], note, s["count"], human(s["p50"]), human(s["p95"]),
             human(s["min"]), human(s["max"]), human(s["total"]),
             ("%.1f" % s["per_min"]) if s["per_min"] else "--",
             clock(s["first"])[5:16], clock(s["last"])[5:16]))

    a("")
    a("## The top contributor")
    a("")
    if top:
        a("**`%s` — %s of %s of measured wall-clock (%.1f%%), over %d event(s), p50 %s.**"
          % (top["step"], human(top["total"]), human(top["grand"]),
             100 * top["share"], top["count"], human(top["p50"])))
    else:
        a("No step in the ledger carries a duration yet — every record is a marker.")

    a("")
    a("## Idle gaps")
    a("")
    a("A gap longer than %s. IDLE means work was pending across it; QUIET means "
      "nothing was owed and the pipeline was right to be still." % human(opts.gap_threshold))
    if run_state_path:
        a("")
        a("Pending is computed against `%s`." % run_state_path)
    a("")
    if not gaps:
        a("None.")
    else:
        a("| verdict | from | to | length | walls pending | last step | next step |")
        a("|---|---|---|--:|--:|---|---|")
        for g in gaps:
            a("| **%s** | %s | %s | %s | %d | `%s` | `%s` |"
              % ("IDLE" if g["idle"] else "quiet", clock(g["start"])[5:16],
                 clock(g["end"])[5:16], human(g["seconds"]), g["pending"],
                 g["last_step"], g["next_step"]))
        tot = sum(g["seconds"] for g in gaps if g["idle"])
        if tot:
            a("")
            a("**%s of dead air with work pending** across %d gap(s)."
              % (human(tot), sum(1 for g in gaps if g["idle"])))

    a("")
    a("## Queue latency — the idle a gap scan cannot see")
    a("")
    a("A gap scan asks whether ANYTHING was running. This asks whether THIS PIECE OF "
      "WORK was. While a finished candidate sits unmeasured the next candidate is being "
      "generated, so the activity timeline never breaks and the wall waits anyway. This "
      "is where the run's hours actually went, and unlike a step's own duration it is "
      "free to delete: nothing has to be made faster for a handoff to stop waiting.")
    a("")
    if not queues:
        a("No handoff in this ledger has both of its steps yet.")
    else:
        a("| handoff | joined on | n | p50 | p95 | worst | what waited |")
        a("|---|---|--:|--:|--:|--:|---|")
        for q in queues:
            a("| `%s` -> `%s` | %s | %d | %s | %s | %s | %s |"
              % (q["from"], q["to"], q["joined"], q["n"], human(q["p50"]),
                 human(q["p95"]), human(q["max"]), q["what"]))
        for q in queues:
            a("")
            a("Longest waits at `%s` -> `%s`: %s."
              % (q["from"], q["to"],
                 "; ".join("%s %s" % (w[1] or w[2], human(w[0])) for w in q["worst"])))

    a("")
    a("## Regression against the ledger's own trailing baseline")
    a("")
    a("Recent window: last %d event(s) of a step. Baseline: everything before it, "
      "at least %d event(s). Flag at recent p50 >= %.2fx baseline p50."
      % (opts.window, opts.min_baseline, opts.regress_factor))
    a("")
    if flags:
        for f in flags:
            a("- **REGRESSION `%s`** — recent p50 %s against a baseline p50 of %s over "
              "%d event(s): **%s**. p95 %s against %s."
              % (f["step"], human(f["recent_p50"]), human(f["baseline_p50"]),
                 f["baseline_n"], ratio_word(f["ratio"]), human(f["recent_p95"]),
                 human(f["baseline_p95"])))
    else:
        a("None flagged.")
    steady = [c for c in checked if c.get("verdict") == "steady"]
    thin = [c for c in checked if c.get("verdict") == "too few events"]
    if steady:
        a("")
        for c in steady:
            a("- steady `%s` — recent p50 %s against %s (%s)."
              % (c["step"], human(c["recent_p50"]), human(c["baseline_p50"]),
                 ratio_word(c["ratio"])))
    if thin:
        a("")
        a("Not yet checkable (a step needs %d event(s) before it has a baseline to "
          "regress against): %s."
          % (opts.window + opts.min_baseline,
             ", ".join("`%s` (%d)" % (c["step"], c["have"]) for c in thin)))

    if nback:
        a("")
        a("## What the backfill cannot know")
        a("")
        a("Every backfilled record above is derived from a file's mtime or a commit, and "
          "each carries its `detail.derivation`. Four limits are structural, and the live "
          "ledger is what removes all four — a step that writes its own record leaves "
          "evidence an overwrite cannot destroy.")
        a("")
        a("1. **A re-read overwrites its own clock, and it was caught doing it.** A "
          "reading document has one mtime. Row 27's recheck rewrote every door-bearing "
          "wall's, and while row 33 was being built a concurrent instrument re-ran 132 "
          "of the 214 manor readings to byte-identical files — same numbers, mtimes "
          "hours later. So a re-read candidate's `generate.roll` -> `measure.candidate` "
          "wait is measured to the RE-READ and is longer than the run's own handoff was. "
          "`--until` bounds the mining to one run, which is the mitigation; the live "
          "ledger is the cure, because it appends and an append cannot be overwritten.")
        a("2. **A promotion's duration is a lower bound.** The meta is the last file it "
          "writes; the bake that follows left no per-wall evidence.")
        a("3. **Bakes and publishes are markers.** A commit knows when, never how long.")
        a("4. **The publish history is one commit deep by construction.** "
          "`tools/publish-site.sh` force-pushes an orphan branch, so each publish erases "
          "the last one's record. That is why it now writes to this ledger before it "
          "pushes.")

    a("")
    a("## The question this is here to ask")
    a("")
    a("[HUMAN, 2026-08-24] \"how can this be faster while maintaining quality\" — and "
      "quality is the constraint, not the casualty: no gate is weakened for speed, and "
      "these clocks sit BESIDE the pass rates in `misses.jsonl` per production law "
      "clause 5. The numbers above answer the first half; the second half is the "
      "gates' own, and neither is allowed to move the other.")
    return "\n".join(L) + "\n"


def verdict_line(recs, top, gaps, queues, flags):
    """The one line a scheduler reads. Everything else is in the markdown."""
    if not recs:
        return "timings: the ledger is empty."
    idle = [g for g in gaps if g["idle"]]
    parts = ["%d record(s)" % len(recs)]
    if top:
        parts.append("top `%s` %s (%.0f%%)" % (top["step"], human(top["total"]),
                                               100 * top["share"]))
    parts.append("%d idle gap(s)%s" % (len(idle),
                 (", worst " + human(max(g["seconds"] for g in idle))) if idle else ""))
    if queues:
        q = max(queues, key=lambda x: x["p50"] or 0)
        parts.append("worst queue `%s`->`%s` p50 %s"
                     % (q["from"], q["to"], human(q["p50"])))
    if flags:
        parts.append("REGRESSION: " + ", ".join(
            "%s %s" % (f["step"], ratio_word(f["ratio"])) for f in flags))
    else:
        parts.append("no regression")
    return "timings: " + "; ".join(parts) + "."


def ratio_word(x):
    if x is None:
        return "--"
    return ("%.0fx" % x) if x >= 100 else ("%.2fx" % x)


# ------------------------------------------------------------------ #
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--ledger", default=None,
                    help="the timings ledger (default: HOLO_TIMINGS, else the repo's)")
    ap.add_argument("--out", default=None,
                    help="where the markdown goes (default: measured/timings-report.md; "
                         "'-' writes none)")
    ap.add_argument("--tree", default=ROOT,
                    help="the working tree --backfill mines. A fresh worktree's mtimes "
                         "are the checkout's, not the run's")
    ap.add_argument("--run-state", default=None,
                    help="run-state.json, for what was pending during a gap")
    ap.add_argument("--until", default=None,
                    help="bound --backfill to evidence at or before this moment: an "
                         "epoch float, an ISO datetime, or HEAD for the commit "
                         "timestamp of HEAD. A tree under active work rewrites mtimes, "
                         "and a cutoff keeps one run's evidence to one run")
    ap.add_argument("--backfill", action="store_true",
                    help="mine the evidence Test 1 already left, marked backfilled:true")
    ap.add_argument("--monitor", action="store_true",
                    help="one line, exit 1 on any regression flag. For a scheduler's "
                         "cadence; this process never loops")
    ap.add_argument("--gap-threshold", type=float, default=300.0)
    ap.add_argument("--window", type=int, default=10)
    ap.add_argument("--min-baseline", type=int, default=5)
    ap.add_argument("--regress-factor", type=float, default=1.5)
    a = ap.parse_args(argv)

    ledger = a.ledger or timings.ledger_path() or timings.DEFAULT_LEDGER
    back = None
    flat = flattened_mtimes(a.tree) if a.backfill else None
    if a.backfill:
        back = backfill(a.tree, ledger, resolve_until(a.until, a.tree))

    recs, bad = load(ledger)
    rs_path = a.run_state or os.path.join(
        ROOT, "design", "batches", "row23-scaffold", "manor", "run-state.json")
    run_state = json.load(open(rs_path)) if os.path.exists(rs_path) else None

    stats = step_stats(recs)
    top = top_contributor(stats)
    gaps = idle_gaps(recs, run_state, a.gap_threshold)
    queues = queue_latency(recs)
    flags, checked = regressions(recs, a.window, a.min_baseline, a.regress_factor)

    if a.monitor:
        print(verdict_line(recs, top, gaps, queues, flags))
        return 1 if flags else 0

    text = render(recs, bad, stats, top, gaps, queues, flags, checked, a, back, flat,
                  os.path.relpath(rs_path, ROOT) if run_state else None)
    if a.out != "-":
        out = a.out or DEFAULT_REPORT
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(text)
    sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
