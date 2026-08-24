#!/bin/bash
# services.sh — the standing services, idempotently. [Kabe, 2026-08-24: "make
# sure we dont have any loose running systems that will be abandoned in having
# to restart you"]
#
#   tools/services.sh up      start each service ONLY if absent (never a duplicate)
#   tools/services.sh status  one line per service: up/down
#   tools/services.sh down    stop them all (a deliberate act, never a side effect)
#
# After any restart of the Navigator's host, `up` is the whole bring-up. The
# registry (design/registry.md) names these as SVC-SEAT, SVC-LOOP, SVC-WATCH.
set -u
cd "$(git rev-parse --show-toplevel)"
S="${HOLO_SCRATCH:-/tmp/claude-1000/-home-k-Projects-holo-emitter/5e2abd72-bfa5-4129-bf0e-f0d5de0c1360/scratchpad}"
mkdir -p "$S"
declare -A CMD=(
  [holoemitter-assets]="codex"
  [manor-loop]="python3 design/plan-draft/measured/row23_run.py --watch >> $S/manor-loop.log 2>&1"
  [seat-watch]="while true; do bash tools/baton-watch.sh >> $S/seat-watch.log 2>&1; sleep 300; done"
)
case "${1:-status}" in
  up)
    for s in "${!CMD[@]}"; do
      if tmux has-session -t "$s" 2>/dev/null; then echo "$s: already up"; else
        tmux new-session -d -s "$s" -c "$(pwd)" "${CMD[$s]}" && echo "$s: started"; fi
    done ;;
  down)
    for s in "${!CMD[@]}"; do tmux kill-session -t "$s" 2>/dev/null && echo "$s: stopped"; done ;;
  status|*)
    for s in "${!CMD[@]}"; do
      tmux has-session -t "$s" 2>/dev/null && echo "$s: up" || echo "$s: DOWN"; done ;;
esac
