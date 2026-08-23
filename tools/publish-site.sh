#!/bin/bash
# publish-site.sh — push the runtime site to gh-pages and verify it serves.
#
# The repo carries hundreds of MB of provenance art that broke Pages' legacy
# build (it errored and silently served a stale site — the "Still just 2
# rooms" incident, 2026-08-22). The live site therefore deploys from an
# orphan gh-pages branch holding ONLY the runtime files (~7 MB), rebuilt and
# force-pushed by this script from the current HEAD of the checkout it runs in.
#
# Usage: tools/publish-site.sh
# Verifies by fetching the served fixture and counting locations; exits
# non-zero if the served world does not match the local bake.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HEAD_SHA=$(git rev-parse --short HEAD)

# [row 33] THE PUBLISH CLOCKS ITSELF, and it is the step with the least evidence
# behind it: this script force-pushes an ORPHAN branch, so each publish erases
# the previous one's commit and the whole published history is one commit deep.
# The backfill could mine exactly ONE publish out of the entire project. From
# here the ledger keeps them all — and keeps the two halves apart, because they
# are different problems: the push is ours, the verification wait is a CDN's.
ROOT_DIR=$(pwd)
now() { python3 -c 'import time; print(time.time())'; }
note() {  # note <step> <ts_start> <detail-json>; never fails the publish
  HOLO_NOTE_ROOT="$ROOT_DIR" python3 "$ROOT_DIR/tools/timings_note.py" "$1" "$2" "$3" || true
}
T_PUBLISH=$(now)
S=$(mktemp -d)
# ONE EXIT TRAP. bash keeps only the last handler registered for a signal, so
# the scratch removal and the clock share this one rather than silently
# replacing each other — which is what a second `trap ... EXIT` line would do.
trap 'RC=$?; rm -rf "$S"; note publish.site "$T_PUBLISH" "{\"head\":\"$HEAD_SHA\",\"exit_code\":$RC}"' EXIT

cp index.html "$S"/
touch "$S"/.nojekyll
cp -r src "$S"/src
cp -r fixtures "$S"/fixtures
mkdir -p "$S"/backdrops/study
cp backdrops/study/*.png backdrops/study/*.json "$S"/backdrops/study/ 2>/dev/null || true
cp backdrops/baked.js "$S"/backdrops/
cp -r library "$S"/library

git -C "$S" init -q -b gh-pages
git -C "$S" add -A
git -C "$S" -c user.name="publish-site" -c user.email="noreply@5000stadia" \
  commit -qm "runtime site @ $HEAD_SHA"
git -C "$S" push -qf https://github.com/5000Stadia/holo-emitter.git gh-pages
gh api -X POST repos/5000Stadia/holo-emitter/pages/builds >/dev/null

WANT=$(grep -c '"id"' fixtures/nav-manor/world.json)
# [row 33] The wait is measured on its own: it is the one part of a publish that
# is not this project's to make faster, and pooling it with the push would hide
# both numbers.
T_VERIFY=$(now)
for i in $(seq 1 30); do
  sleep 10
  GOT=$(curl -s "https://5000stadia.github.io/holo-emitter/fixtures/nav-manor/world.json?cb=$RANDOM" \
    | grep -c '"id"' || true)
  [ "$GOT" = "$WANT" ] && {
    note publish.verify "$T_VERIFY" "{\"polls\":$i,\"ids\":$GOT,\"served\":true}"
    echo "live: world serves ($GOT ids) @ $HEAD_SHA"; exit 0; }
done
note publish.verify "$T_VERIFY" "{\"polls\":30,\"ids\":${GOT:-0},\"served\":false}"
echo "publish-site: live world still stale after 5 min (want $WANT ids, got ${GOT:-0})" >&2
exit 1
