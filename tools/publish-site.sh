#!/bin/bash
# publish-site.sh — push the runtime site to gh-pages and verify it serves.
#
# The repo carries hundreds of MB of provenance art that broke Pages' legacy
# build (it errored and silently served a stale site — the "Still just 2
# rooms" incident, 2026-08-22). The live site therefore deploys from an
# orphan gh-pages branch holding ONLY the runtime files (~35 MB: the page, the
# code, the fixtures, the ingested library and one JPEG per promoted wall),
# rebuilt and force-pushed by this script from the current HEAD of the checkout
# it runs in.
#
# Usage: tools/publish-site.sh
# Verifies by fetching the served fixture and counting locations; exits
# non-zero if the served world does not match the local bake.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
HEAD_SHA=$(git rev-parse --short HEAD)

# [2026-08-24] NO STALE FIXTURE SHIPS. The manor fixture had been refused by
# its own bake for hours (a pre-row-25 flight record on one meta) and every
# publish in between served plan-derived doors 200 px from the painted ones —
# Kabe: "The door just doesn't line up". A refused or out-of-date bake now
# refuses the publish, with the finding, instead of shipping what it can.
for fd in fixtures/*/; do
  [ -f "$fd/world.json" ] || continue
  if ! out=$(node tools/bake-fixtures.mjs --fixture-dir "$fd" 2>&1); then
    echo "publish refused: $fd bake refused —" >&2; echo "$out" | head -5 >&2; exit 2
  fi
  if ! git diff --quiet -- "$fd/fixture.js"; then
    echo "publish refused: $fd/fixture.js was stale against the promoted metas; it is re-baked now — commit it and publish again" >&2; exit 2
  fi
done

# [production law clause 6, 2026-08-25] NO STALE DERIVED ARTIFACT SHIPS EITHER,
# and for the fixture's own reason. The bake above is one derived artifact out
# of a dozen: the material provenance report and its legacy ledger, the room
# consistency measure and its README, the window calibration, the snapped and
# repaired readings, the edge-strip records — every one of them is generated
# FROM the store, and the loop that moves the store used to leave them behind.
# A publish that ships a store nobody's audit describes is the "Still just 2
# rooms" incident wearing a different artifact, so it is refused here on exactly
# the same terms, by exactly the check the suite reads. The check writes
# nothing; the regen is a separate, deliberate act.
if ! derive=$(python3 design/plan-draft/measured/derived.py --check 2>&1); then
  echo "publish refused: a derived artifact is stale against the store —" >&2
  echo "$derive" | grep -E '^(STALE|UNPROVEN)|^ ' >&2
  echo "run: python3 design/plan-draft/measured/derived.py --regen  (then commit what moves)" >&2
  exit 2
fi

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
# [Kabe, 2026-08-30] "Still getting a blend like this" — his browser held the
# previous src/renderer.js: Pages serves scripts with max-age=600 and the page
# named them by bare URL, so a publish could be masked for ten minutes by any
# cache in the way. Every script the shipped page loads is named with the
# commit it was published from; a new publish is a new URL, nothing to purge.
# The repo's own index.html is untouched (the suite reads it by bare names).
sed -i -E "s#(<script src=\"[^\"?]+\.js)\"#\1?v=$HEAD_SHA\"#g; s#(fixture\.js)\"><#\1?v=$HEAD_SHA\"><#g" "$S"/index.html
touch "$S"/.nojekyll
cp -r src "$S"/src
cp -r fixtures "$S"/fixtures
# [Row 45] THE PAINTINGS SHIP AS FILES, one per wall, and the page fetches the
# one it is looking at. Until this row the tree carried `backdrops/baked.js`
# with all 71 walls inside it as data: URIs — 44 MB on the critical path to the
# first pixel of the first wall, which is what Kabe was watching when he said
# "Sometimes loading hangs on first launch. UI is present but then hangs
# without images loading." The served tree is 33 MB of JPEG and NONE of it
# blocks: one 0.5 MB request stands between a visitor and a painted room.
#
# `backdrops/served/` is generated by `node tools/bake-backdrops.mjs` and the
# suite refuses a stale one; the promoted PNGs themselves (176 MB) are the
# store's own artifact and have never been what a browser reads.
mkdir -p "$S"/backdrops
cp backdrops/baked.js "$S"/backdrops/
cp -r backdrops/served "$S"/backdrops/served
cp -r library "$S"/library
# [Kabe, 2026-08-30] "Only first rooms images load for me." EVERY PAINTING THE
# MANIFEST NAMES MUST BE IN THE TREE BEING SHIPPED — the hospital publish copied
# `served/` while the loop's bake was rebuilding it and shipped a manifest with
# twelve walls whose JPEGs were not there. The manifest is the contract; the
# tree is checked against it before anything is pushed.
# The manifest's entries read `file: "<loc>/<F>.jpg"`, served under backdrops/served/.
manifest_files() { grep -oE 'file: "[A-Za-z0-9_-]+/[NESW]\.jpg"' backdrops/baked.js | sed 's#^file: "#backdrops/served/#; s#"$##' | sort -u || true; }
N_MANIFEST=$(manifest_files | wc -l)
[ "$N_MANIFEST" -gt 0 ] || { echo "publish refused: the manifest names no paintings (backdrops/baked.js)" >&2; exit 2; }
MISSING=$(manifest_files | while read -r j; do [ -f "$S/$j" ] || echo "$j"; done)
if [ -n "$MISSING" ]; then
  echo "publish refused: the manifest names paintings the served tree does not hold (a bake was mid-rebuild?):" >&2
  echo "$MISSING" | head -20 >&2
  exit 2
fi

# And the tree stays a size Pages will take. The soft limit is 1 GB for a
# published site; this refuses well below it, because the failure mode is the
# one this whole script exists for — the 2026-08-22 incident, where a build
# that could not cope errored and served a stale site in silence.
SITE_MB=$(du -sm "$S" | cut -f1)
if [ "$SITE_MB" -gt 500 ]; then
  echo "publish refused: the runtime tree is ${SITE_MB} MB — GitHub Pages takes 1 GB and this is the size that broke it before" >&2
  exit 2
fi
echo "publish: runtime tree ${SITE_MB} MB, ${N_MANIFEST} paintings all present"

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
  [ "$GOT" = "$WANT" ] || continue
  # And the paintings themselves, every one the manifest names, by HEAD.
  NOT_LIVE=$(manifest_files \
    | xargs -P 16 -I{} sh -c 'c=$(curl -s -o /dev/null -w "%{http_code}" "https://5000stadia.github.io/holo-emitter/{}?cb=$RANDOM"); [ "$c" = 200 ] || echo "{} $c"' | wc -l)
  [ "$NOT_LIVE" = 0 ] && {
    note publish.verify "$T_VERIFY" "{\"polls\":$i,\"ids\":$GOT,\"served\":true}"
    echo "live: world serves ($GOT ids, every painting 200) @ $HEAD_SHA"; exit 0; }
  echo "publish: ids serve, $NOT_LIVE painting(s) not yet 200 — waiting"
done
note publish.verify "$T_VERIFY" "{\"polls\":30,\"ids\":${GOT:-0},\"served\":false}"
echo "publish-site: live world still stale after 5 min (want $WANT ids, got ${GOT:-0})" >&2
exit 1
