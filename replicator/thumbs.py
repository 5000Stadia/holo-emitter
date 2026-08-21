"""Stage 3c — thumbs (blueprint §9.3c).

§9.3c says "content-bbox-centred **crop**, 128px". A 128 px crop of a 919 px
desk is a patch of oak, so this scales the content bbox to fit instead — a
declared deviation with that reason.

Filter: LANCZOS, decided by looking. An earlier draft chose nearest-neighbour
for determinism; both are deterministic, and at the ~8x decimation a real sprite
needs, nearest-neighbour drops the teardrop pulls and the reveal gaps and leaves
an inventory tile that reads as noise, while LANCZOS gives a legible desk. The
RGB bleed of stage 1 is what stops the resample pulling transparent black into
the edges.

Pure.
"""

import numpy as np
from PIL import Image

from . import imaging as im

FILTERS = {
    "NEAREST": Image.NEAREST,
    "BOX": Image.BOX,
    "BILINEAR": Image.BILINEAR,
    "LANCZOS": Image.LANCZOS,
}


class ThumbError(ValueError):
    pass


def make_thumb(rgba, *, size_px, content_px, filter="LANCZOS"):
    """A square `size_px` thumb with the content bbox scaled to `content_px`."""
    if filter not in FILTERS:
        raise ThumbError("unknown thumb filter %r; known: %s"
                         % (filter, ", ".join(sorted(FILTERS))))
    box = im.alpha_bbox(rgba[..., 3], 1)
    if box is None:
        raise ThumbError("no content to make a thumb from")
    x0, y0, x1, y1 = box
    content = rgba[y0:y1, x0:x1]
    ch, cw = content.shape[:2]
    scale = content_px / float(max(cw, ch))
    w = max(1, int(round(cw * scale)))
    h = max(1, int(round(ch * scale)))
    small = Image.fromarray(content, "RGBA").resize((w, h), FILTERS[filter])
    canvas = Image.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
    canvas.paste(small, ((size_px - w) // 2, (size_px - h) // 2))
    return np.array(canvas)


def thumb_gate(thumb, takeable, size_px, content_px=None, cfg=None):
    """Every takeable record carries a square thumb, and only takeables do.

    The presence half is a tautology inside the pipeline -- it makes the thumb
    iff takeable and then asks whether it did -- so the gate also checks the
    thumb's own pixels: a blank or clipped tile is a real defect a real ingest
    can produce, and it is what the inventory strip actually shows.

    `cfg` is `contract.json` gates.thumb. Both pixel clauses were literals here,
    which put a HARD gate's thresholds outside the freeze and outside the hash a
    record's provenance claims traceability to.
    """
    cfg = cfg or {"min_coverage": 0.01, "edge_margin_px": 2}
    have = thumb is not None
    ok = True
    msgs = []
    if takeable and not have:
        ok = False
        msgs.append("a takeable record carries no thumb")
    if not takeable and have:
        ok = False
        msgs.append("a non-takeable record carries a thumb — the record lies the other way")
    shape = None
    coverage = None
    fills = None
    if have:
        shape = [int(thumb.shape[1]), int(thumb.shape[0])]
        if thumb.shape[0] != size_px or thumb.shape[1] != size_px:
            ok = False
            msgs.append("the thumb is %dx%d, not the pinned %dx%d square"
                        % (shape[0], shape[1], size_px, size_px))
        alpha = thumb[..., 3]
        coverage = float((alpha > 0).mean())
        if coverage < cfg["min_coverage"]:
            ok = False
            msgs.append("the thumb is blank (%.2f%% of it carries any content): the inventory "
                        "strip would show an empty tile" % (coverage * 100))
        box = im.alpha_bbox(alpha, 1)
        if box is not None and content_px:
            longest = max(box[2] - box[0], box[3] - box[1])
            fills = round(longest / float(content_px), 3)
            if longest > size_px - cfg["edge_margin_px"]:
                ok = False
                msgs.append("the thumb's content touches its own edge (%d px of %d): it has been "
                            "clipped rather than fitted" % (longest, size_px))
    return {
        "id": "thumb",
        "severity": "hard",
        "passed": ok,
        "measured": {"takeable": bool(takeable), "thumb_px": shape,
                     "coverage": None if coverage is None else round(coverage, 4),
                     "content_fill": fills},
        "threshold": {"square_px": size_px, "min_coverage": cfg["min_coverage"],
                      "edge_margin_px": cfg["edge_margin_px"]},
        "message": "; ".join(msgs) if msgs else "thumb present exactly when takeable, square",
    }
