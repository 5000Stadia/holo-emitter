#!/bin/bash
# baton-watch.sh — WHO HAS THE BATON, is it moving, and a nudge if not. [row 33]
#
# Kabe, verbatim (2026-08-24): "As part of the watchdog can it set a status of
# what agent has the baton to lead the current status and confirm its still
# active periodically and if not nudge it?"
#
# The baton is DERIVED from the stores, never asserted: whoever owes the next
# action holds it. Holders this script can see and nudge (deterministic, no
# model): the SEAT (images owed), the LOOP (candidates unmeasured / statuses
# unswept), PUBLISH (promotions newer than the last publish). Dev-layer holders
# (builders, the Navigator's merges, Kabe's gates) are the Navigator's 2-hour
# sampler's to confirm — a bash script cannot see inside agent sessions, and
# saying so here is honester than pretending.
#
# Every run writes the status to baton.json (and one line to its log); a holder
# found idle while holding is NUDGED (seat: re-issue the standing order; loop:
# restart the tmux session) and the incident lands in the timings ledger as
# baton.stalled with its numbers. Run standing under tmux: seat-watch.
set -u
cd "$(git rev-parse --show-toplevel)"
STALE_S=${STALE_S:-900}
# [B-ROUTING] THE LOOP IS ALIVE WHEN A PASS HAS COMPLETED, and this is how long
# it may go without completing one. It has to exceed the longest HONEST pass:
# a routing pass that takes the ruled exits snaps a wall at a time (~12 s each,
# a dozen of them on a heavy pass) and then validates and bakes the store once.
# Half an hour is well past that and well short of the two hours the row-30 cut
# was found after.
LOOP_STALE_S=${LOOP_STALE_S:-1800}
SCRATCH="/tmp/claude-1000/-home-k-Projects-holo-emitter/5e2abd72-bfa5-4129-bf0e-f0d5de0c1360/scratchpad"
ORDER="Standing paint order. Run: git pull. Then read design/batches/row23-scaffold/manor/retries.json, design/batches/row23-scaffold/manor/manifest.json and design/batches/row36-assembly/swatches/swatch-index.json (swatch packets attach NO image - their PACKET.md says so; other packets name their images incl. any edge-seed Image 3). For every roll listed anywhere in them whose candidate file does not exist on disk: attach that packet directory's style-seed-warm.png as Image 1 and scaffold.png as Image 2, send its prompt.txt verbatim to image generation, save the image to the exact candidate path. Do not judge results; work straight through; reply with counts when done. Fence: write only under backdrops/, never src/, never design/."

read -r OWED UNMEASURED UNPUBLISHED PASS_AGE <<EOF2
$(python3 - <<'EOF'
import json, os, glob, time
owed = 0
for f in ("design/batches/row23-scaffold/manor/manifest.json",
          "design/batches/row23-scaffold/manor/retries.json",
          "design/batches/row36-assembly/swatches/swatch-index.json"):
    if not os.path.exists(f): continue
    doc = json.load(open(f))
    for e in (doc.get("entries") or doc.get("packets") or []):
        if e.get("skipped"): continue
        for r in e.get("rolls", []):
            path = r.get("candidate") or r.get("dest")
            if path and not os.path.exists(path): owed += 1
# unmeasured: rolls of LIVING walls whose candidate exists but has no reading.
# Orphan candidates of terminal walls (promoted/parked/fenced) are the sweep's
# to ignore by design; counting them held the baton at "loop owed 50" forever,
# which is a standing false positive a real stall could hide behind.
state = {}
sp = "design/batches/row23-scaffold/manor/run-state.json"
if os.path.exists(sp):
    state = json.load(open(sp)).get("walls", {})
TERMINAL = {"promoted", "parked", "admitted-not-promoted"}
readings = {os.path.basename(p)[:-5] for p in glob.glob("design/plan-draft/measured/manor/????????.json")}
unmeasured = 0
for f in ("design/batches/row23-scaffold/manor/manifest.json",
          "design/batches/row23-scaffold/manor/retries.json"):
    if not os.path.exists(f): continue
    for e in json.load(open(f)).get("entries", []):
        if e.get("skipped"): continue
        if state.get(e.get("key", e.get("facing", "")), {}).get("status") in TERMINAL: continue
        for r in e.get("rolls", []):
            if os.path.exists(r["candidate"]) and r["id"] not in readings:
                unmeasured += 1
# unpublished: any promoted wall png newer than the last publish.site record
# last_pass: [B-ROUTING] when the sweep last FINISHED a pass. The loop writes
# `sweep.pass` after the pass returns and never before, so this is the loop's
# own summary timestamp and not a claim about a process being up.
last_pub = 0.0
last_pass = 0.0
if os.path.exists("design/plan-draft/measured/timings.jsonl"):
    for line in open("design/plan-draft/measured/timings.jsonl"):
        try:
            r = json.loads(line)
            if r.get("step") == "publish.site": last_pub = max(last_pub, r.get("ts_end", 0))
            elif r.get("step") == "sweep.pass": last_pass = max(last_pass, r.get("ts_end", 0))
        except Exception: pass
unpub = sum(1 for p in glob.glob("backdrops/*/[NESW].png") if os.path.getmtime(p) > last_pub)
print(owed, unmeasured, unpub,
      int(time.time() - last_pass) if last_pass else -1)
EOF
)
EOF2

BATON="none"; DETAIL="all quiet: nothing owed anywhere this script can see"
[ "${UNPUBLISHED:-0}" -gt 0 ] && { BATON="publish";  DETAIL="$UNPUBLISHED promoted wall(s) newer than the last publish - Navigator's publish-site.sh is owed"; }
[ "${UNMEASURED:-0}" -gt 0 ] && { BATON="loop";     DETAIL="$UNMEASURED candidate(s) on disk with no reading - the sweep loop is owed"; }
[ "${OWED:-0}" -gt 0 ]      && { BATON="seat";     DETAIL="$OWED image(s) owed - the painter is owed"; }

ACTIVE="unknown"; NUDGED="no"
case "$BATON" in
  seat)
    newest=$(find backdrops/source backdrops/textures/source -name "row*-*.png" -printf "%T@\n" 2>/dev/null | sort -n | tail -1)
    age=$(python3 -c "import time; print(int(time.time() - float('${newest:-0}')))")
    if tmux capture-pane -t holoemitter-assets -p 2>/dev/null | grep -q "Working ("; then ACTIVE="yes"
    elif [ "$age" -lt "$STALE_S" ]; then ACTIVE="yes"
    else
      ACTIVE="no"; NUDGED="yes"
      tmux has-session -t holoemitter-assets 2>/dev/null || { tmux new-session -d -s holoemitter-assets -c "$(pwd)" codex; sleep 12; }
      tmux send-keys -t holoemitter-assets -l "$ORDER"; sleep 1; tmux send-keys -t holoemitter-assets Enter
    fi ;;
  loop)
    # [B-ROUTING] A LOOP IS ALIVE WHEN A PASS HAS COMPLETED, not when a tmux
    # session exists. The session test could not tell a working loop from one
    # wedged inside a pass it will never finish — which is not hypothetical:
    # after the host restart a single pass had not finished in two hours while
    # new returns queued behind old holds, `manor-loop` was up the whole time,
    # and this script reported the baton held and active. So liveness is the
    # loop's own summary timestamp (`sweep.pass`, written when a pass RETURNS)
    # and a loop that runs forever without finishing one reads as stalled and
    # is restarted — the wedged session is killed first, because starting a
    # second `manor-loop` beside it is not a restart.
    if [ "${PASS_AGE:--1}" -ge 0 ] && [ "${PASS_AGE}" -lt "$LOOP_STALE_S" ]; then
      ACTIVE="yes"
      DETAIL="$DETAIL (last pass completed ${PASS_AGE}s ago)"
    else
      ACTIVE="no"; NUDGED="yes"
      if [ "${PASS_AGE:--1}" -lt 0 ]; then
        DETAIL="$DETAIL; no sweep pass has ever completed in the ledger"
      else
        DETAIL="$DETAIL; no pass has completed in ${PASS_AGE}s (limit ${LOOP_STALE_S}s)"
      fi
      tmux kill-session -t manor-loop 2>/dev/null
      tmux new-session -d -s manor-loop "python3 design/plan-draft/measured/row23_run.py --watch >> $SCRATCH/manor-loop.log 2>&1"
    fi ;;
  publish)
    ACTIVE="waiting-on-navigator" ;;  # publish is the one act kept human-adjacent
esac

python3 - "$BATON" "$ACTIVE" "$NUDGED" "$DETAIL" "${PASS_AGE:--1}" <<'EOF'
import json, sys, time, os
baton, active, nudged, detail, pass_age = sys.argv[1:6]
status = {"ts": time.time(), "baton": baton, "active": active,
          "nudged": nudged, "detail": detail,
          # [B-ROUTING] seconds since the sweep last COMPLETED a pass, -1 when
          # the ledger holds none. This is what the loop's liveness is read off.
          "loop_pass_age_s": int(pass_age)}
json.dump(status, open("design/batches/row23-scaffold/manor/baton.json", "w"), indent=1)
if nudged == "yes":
    rec = {"ts_start": time.time(), "ts_end": time.time(), "step": "baton.stalled",
           "key": baton, "detail": {"holder": baton, "state": detail,
                                     "action": "nudged by baton-watch"}}
    open("design/plan-draft/measured/timings.jsonl", "a").write(json.dumps(rec) + "\n")
print("baton=%s active=%s nudged=%s | %s" % (baton, active, nudged, detail))
EOF
