#!/bin/bash
# seat-watch.sh — the dead-air watchdog for the asset seat. [row 33]
#
# Born from a measured incident (2026-08-24): the Codex seat's input wedged and
# 56 owed images sat unpainted for ~3.5 hours while every other monitor watched
# the measuring loop, not the painter. Kabe, verbatim: "Ugh we want to prevent
# the dead air time like that."
#
# Every run: count OWED images (manifest + retries rolls whose candidate file
# does not exist), find the newest candidate's age, and read the seat's pane.
# If work is owed AND nothing has landed for STALE_S seconds AND the seat is
# not visibly Working: log a seat.dead_air record to the timings ledger and
# re-issue the standing order (text, then Enter as its own event — the wedge
# ate combined sends). If the tmux session is gone, relaunch it first.
# Deterministic; no model in the loop. Run under tmux: seat-watch.
set -u
cd "$(git rev-parse --show-toplevel)"
STALE_S=${STALE_S:-900}
ORDER="Standing paint order. Run: git pull. Then read design/batches/row23-scaffold/manor/retries.json and design/batches/row23-scaffold/manor/manifest.json. For every roll listed anywhere in them whose candidate file does not exist on disk: attach that packet directory's style-seed-warm.png as Image 1 and scaffold.png as Image 2, send its prompt.txt verbatim to image generation, save the image to the exact candidate path. Do not judge results; work straight through; reply with counts when done. Fence: write only under backdrops/, never src/, never design/."

owed=$(python3 - <<'EOF'
import json, os
owed = 0
for f in ("design/batches/row23-scaffold/manor/manifest.json",
          "design/batches/row23-scaffold/manor/retries.json"):
    if not os.path.exists(f): continue
    doc = json.load(open(f))
    for e in doc.get("entries", []):
        if e.get("skipped"): continue
        for r in e.get("rolls", []):
            if not os.path.exists(r["candidate"]):
                owed += 1
print(owed)
EOF
)
[ "$owed" = "0" ] && exit 0

newest=$(find backdrops/source -name "row23-*.png" -printf "%T@\n" 2>/dev/null | sort -n | tail -1)
age=$(python3 -c "import time; print(int(time.time() - float('${newest:-0}')))")
[ "$age" -lt "$STALE_S" ] && exit 0

if ! tmux has-session -t holoemitter-assets 2>/dev/null; then
  tmux new-session -d -s holoemitter-assets -c "$(pwd)" codex
  sleep 12
elif tmux capture-pane -t holoemitter-assets -p 2>/dev/null | grep -q "Working ("; then
  exit 0   # painting; a long single image is not dead air
fi

python3 - "$owed" "$age" <<'EOF'
import json, sys, time
owed, age = sys.argv[1], sys.argv[2]
rec = {"ts_start": time.time() - float(age), "ts_end": time.time(),
       "step": "seat.dead_air",
       "key": "owed:%s" % owed,
       "detail": {"owed_images": int(owed), "stale_s": int(age),
                  "action": "order re-issued by seat-watch"}}
open("design/plan-draft/measured/timings.jsonl", "a").write(json.dumps(rec) + "\n")
EOF
tmux send-keys -t holoemitter-assets -l "$ORDER"
sleep 1
tmux send-keys -t holoemitter-assets Enter
echo "seat-watch: $owed owed, ${age}s stale — order re-issued"
