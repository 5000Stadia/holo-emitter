#!/bin/sh
# Renders each artboard SVG to PNG at 2x through headless Chrome.
# Two Chrome quirks are worked around here: a standalone SVG document gets the
# body margin (so the SVG is wrapped in a zero-margin HTML page), and
# --window-size loses ~85px of viewport height (so the window is over-sized and
# the PNG is cropped back to the artboard's exact pixel size).
set -e
D=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
# render.lock records which SVG each PNG was rasterised from. The PNG is the
# artifact a human actually looks at, and its bytes depend on this machine's
# browser, so they cannot be regenerated for comparison — but the SVG it came
# from can be. A redline that runs draw_plan.py and forgets render.sh leaves a
# PNG whose recorded source hash no longer matches the committed SVG, and the
# suite says so.
LOCK="$D/render.lock"
: > "$LOCK"
for f in manor-ground manor-upper; do
  W=$(sed -n 's/.*<svg[^>]*width="\([0-9]*\)".*/\1/p' "$D/$f.svg" | head -1)
  H=$(sed -n 's/.*<svg[^>]*height="\([0-9]*\)".*/\1/p' "$D/$f.svg" | head -1)
  cat > "$T/$f.html" <<HTML
<!doctype html><html><body style="margin:0;padding:0;background:#fff">
<img src="file://$D/$f.svg" width="$W" height="$H" style="display:block">
</body></html>
HTML
  google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=2 --default-background-color=ffffff \
    --screenshot="$D/$f.png" --window-size=$W,$((H + 140)) \
    "file://$T/$f.html" 2>/dev/null
  python3 -c "
from PIL import Image
im = Image.open('$D/$f.png').crop((0, 0, 2*$W, 2*$H))
im.save('$D/$f.png')
print('$D/$f.png', im.size, 'from ${W}x${H} artboard')"
  printf '%s  svg=%s  png=%s\n' "$f" \
    "$(sha256sum "$D/$f.svg" | cut -d" " -f1)" \
    "$(sha256sum "$D/$f.png" | cut -d" " -f1)" >> "$LOCK"
done
echo "wrote $LOCK"
rm -rf "$T"
