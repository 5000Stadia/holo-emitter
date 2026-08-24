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
SCRATCH="/tmp/claude-1000/-home-k-Projects-holo-emitter/5e2abd72-bfa5-4129-bf0e-f0d5de0c1360/scratchpad"
ORDER="Standing paint order. Run: git pull. Then read design/batches/row23-scaffold/manor/retries.json and design/batches/row23-scaffold/manor/manifest.json. For every roll listed anywhere in them whose candidate file does not exist on disk: attach that packet directory's style-seed-warm.png as Image 1 and scaffold.png as Image 2, send its prompt.txt verbatim to image generation, save the image to the exact candidate path. Do not judge results; work straight through; reply with counts when done. Fence: write only under backdrops/, never src/, never design/."

read -r OWED UNMEASURED UNPUBLISHED <<EOF2
$(python3 - <<'EOF'
import json, os, glob
owed = 0
for f in ("design/batches/row23-scaffold/manor/manifest.json",
          "design/batches/row23-scaffold/manor/retries.json"):
    if not os.path.exists(f): continue
    for e in json.load(open(f)).get("entries", []):
        if e.get("skipped"): continue
        for r in e.get("rolls", []):
            if not os.path.exists(r["candidate"]): owed += 1
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
last_pub = 0.0
if os.path.exists("design/plan-draft/measured/timings.jsonl"):
    for line in open("design/plan-draft/measured/timings.jsonl"):
        try:
            r = json.loads(line)
            if r.get("step") == "publish.site": last_pub = max(last_pub, r.get("ts_end", 0))
        except Exception: pass
unpub = sum(1 for p in glob.glob("backdrops/*/[NESW].png") if os.path.getmtime(p) > last_pub)
print(owed, unmeasured, unpub)
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
    newest=$(find backdrops/source -name "row23-*.png" -printf "%T@\n" 2>/dev/null | sort -n | tail -1)
    age=$(python3 -c "import time; print(int(time.time() - float('${newest:-0}')))")
    if tmux capture-pane -t holoemitter-assets -p 2>/dev/null | grep -q "Working ("; then ACTIVE="yes"
    elif [ "$age" -lt "$STALE_S" ]; then ACTIVE="yes"
    else
      ACTIVE="no"; NUDGED="yes"
      tmux has-session -t holoemitter-assets 2>/dev/null || { tmux new-session -d -s holoemitter-assets -c "$(pwd)" codex; sleep 12; }
      tmux send-keys -t holoemitter-assets -l "$ORDER"; sleep 1; tmux send-keys -t holoemitter-assets Enter
    fi ;;
  loop)
    if tmux has-session -t manor-loop 2>/dev/null; then ACTIVE="yes"
    else
      ACTIVE="no"; NUDGED="yes"
      tmux new-session -d -s manor-loop "python3 design/plan-draft/measured/row23_run.py --watch >> $SCRATCH/manor-loop.log 2>&1"
    fi ;;
  publish)
    ACTIVE="waiting-on-navigator" ;;  # publish is the one act kept human-adjacent
esac

python3 - "$BATON" "$ACTIVE" "$NUDGED" "$DETAIL" <<'EOF'
import json, sys, time, os
baton, active, nudged, detail = sys.argv[1:5]
status = {"ts": time.time(), "baton": baton, "active": active,
          "nudged": nudged, "detail": detail}
json.dump(status, open("design/batches/row23-scaffold/manor/baton.json", "w"), indent=1)
if nudged == "yes":
    rec = {"ts_start": time.time(), "ts_end": time.time(), "step": "baton.stalled",
           "key": baton, "detail": {"holder": baton, "state": detail,
                                     "action": "nudged by baton-watch"}}
    open("design/plan-draft/measured/timings.jsonl", "a").write(json.dumps(rec) + "\n")
print("baton=%s active=%s nudged=%s | %s" % (baton, active, nudged, detail))
EOF
