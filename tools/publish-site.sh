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
S=$(mktemp -d)
trap 'rm -rf "$S"' EXIT

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
for i in $(seq 1 30); do
  sleep 10
  GOT=$(curl -s "https://5000stadia.github.io/holo-emitter/fixtures/nav-manor/world.json?cb=$RANDOM" \
    | grep -c '"id"' || true)
  [ "$GOT" = "$WANT" ] && { echo "live: world serves ($GOT ids) @ $HEAD_SHA"; exit 0; }
done
echo "publish-site: live world still stale after 5 min (want $WANT ids, got ${GOT:-0})" >&2
exit 1
