"""Constructed source images: the calibration controls and the negative controls.

Two jobs, deliberately in one module because they are one artifact:

* **Calibration controls** are how a threshold earns `authority: "control"`. Their
  ground truth is known by construction — a halo of known width, a solid lit from
  a known direction, a legged object with a known stance — so a bound measured on
  them is independent of the corpus the gates will judge. This is the whole point
  of §A of the row-3 plan: *no hard gate may be calibrated on the corpus it
  judges.*
* **Negative controls** are the must-fail images blueprint §9.4 requires, one per
  hard gate rather than the single one §9.4 names, so "every gate goes red when
  you break what it guards" is something the suite runs rather than something a
  report claims.

Everything is deterministic — flat fills, analytic ramps, a fixed pseudo-noise
sequence with no RNG state — so two runs produce identical bytes.

    python3 -m replicator.synth --case halo --out /tmp/nc.png
    python3 -m replicator.synth --list
"""

import argparse
import sys

import numpy as np

from . import imaging as im

GROUND = (144, 144, 143)          # the corpus's own seamless mid-grey, for realism
OAK = (110, 72, 40)
OAK_LIGHT = (140, 96, 56)
OAK_DARK = (78, 50, 28)
IRON = (86, 88, 92)


def _noise(shape, amplitude, seed=7):
    """A fixed, RNG-free pseudo-noise field: deterministic across runs and machines."""
    h, w = shape
    y = np.arange(h)[:, None]
    x = np.arange(w)[None, :]
    n = ((y * 7349 + x * 2917 + seed * 104729) % 1021) / 1021.0 - 0.5
    return n * 2.0 * amplitude


def _canvas(size, ground=GROUND, noise=1.0):
    a = np.zeros((size, size, 3), np.float64)
    a[:] = np.asarray(ground, np.float64)
    a += _noise((size, size), noise)[..., None]
    return a


def _rect(a, x0, y0, x1, y1, colour):
    a[y0:y1, x0:x1] = np.asarray(colour, np.float64)


def _u8(a):
    return np.clip(a, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- clean bodies

def clean_sprite(size=700, content=560, takeable=False):
    """A clean, well-formed source: opaque body, crisp edges, no halo, no shadow.

    Every gate must be green on this. Lit UL45 by construction — the left face is
    brighter than the right and the top brighter than both — so it is also the
    positive control for gate (e).
    """
    a = _canvas(size)
    m = (size - content) // 2
    top_h = content // 6
    _rect(a, m, m, size - m, m + top_h, OAK_LIGHT)                 # top face
    _rect(a, m, m + top_h, m + content // 3, size - m, OAK)        # left face, lit
    _rect(a, m + content // 3, m + top_h, size - m, size - m, OAK_DARK)  # right, shaded
    if takeable:
        return _u8(a)
    return _u8(a)


def legged_sprite(size=900, stance=(120, 780), foot_spread=150):
    """A three-quarter legged object: near foot lowest, far feet higher up.

    The stance is known by construction, which is what lets the contact-band
    derivation be calibrated without ever measuring the corpus desk.
    """
    a = _canvas(size)
    body_top, body_bottom = 180, 520
    _rect(a, stance[0], body_top, stance[1], body_bottom, OAK)
    _rect(a, stance[0], body_top, stance[1], body_top + 40, OAK_LIGHT)
    # four legs: the near pair reaches lower than the far pair
    near_y, far_y = 860, 860 - foot_spread
    for x, y in ((stance[0] + 20, far_y), (stance[1] - 60, far_y),
                 (stance[0] + 90, near_y), (stance[1] - 130, near_y)):
        _rect(a, x, body_bottom, x + 40, y, OAK_DARK)
    return _u8(a)


def squat_sprite(size=700, radius=300):
    """A disc lying flat: contact is a narrow band, not its whole width."""
    a = _canvas(size)
    cy, cx = size // 2, size // 2
    y = np.arange(size)[:, None]
    x = np.arange(size)[None, :]
    disc = (((y - cy) / (radius * 0.28)) ** 2 + ((x - cx) / float(radius)) ** 2) <= 1.0
    a[disc] = np.asarray(IRON, np.float64)
    return _u8(a)


def neutral_disc(size=700, radius=300, tone=118):
    """A **genuinely achromatic** object: R = G = B at every pixel.

    The control set had no such member. `IRON` is (86, 88, 92) — tinted grey,
    saturation 0.065 — and every other control carries colour, so nothing in the
    set could reach the case where gate (a)'s a2 ratio has a zero denominator.
    A neutrally rendered iron key or silver coin IS this object, both of them
    M0 takeables, and before the fix gate (a) hard-failed it for having no
    colour, at exit 2, "regenerate the source", which no regeneration could fix.

    Deliberately NOT the ground's own tone: it must be a real object the matte
    can cut, so it sits well clear of the mid-grey seamless while staying on the
    achromatic axis.
    """
    a = _canvas(size)
    cy, cx = size // 2, size // 2
    y = np.arange(size)[:, None]
    x = np.arange(size)[None, :]
    disc = ((y - cy) / float(radius)) ** 2 + ((x - cx) / float(radius)) ** 2 <= 1.0
    # A gentle top-left falloff so the object is not a flat plate, still R=G=B.
    shade = 1.0 - 0.18 * ((y - cy) / float(radius) + (x - cx) / float(radius)) / 2.0
    v = np.clip(tone * shade, 0, 255)
    for c in range(3):
        a[..., c] = np.where(disc, v, a[..., c])
    return _u8(a)


def lit_solid(size=900, direction="UL"):
    """A box lit from a named direction — the reference input for gate (e).

    `direction` is one of UL (the contract's key), UR, or TOP. The estimator's
    response to UL is what `gates.light.expected_deg` is set from; its responses
    to UR and TOP are what the band must reject.
    """
    a = _canvas(size)
    m = size // 6
    top_h = (size - 2 * m) // 5
    bright, mid, dark = 200.0, 140.0, 90.0
    if direction == "UL":
        left, right = mid, dark
    elif direction == "UR":
        left, right = dark, mid
    elif direction == "TOP":
        left = right = (mid + dark) / 2.0
    else:
        raise ValueError("direction must be UL, UR or TOP")
    _rect(a, m, m, size - m, m + top_h, (bright, bright * 0.86, bright * 0.62))
    _rect(a, m, m + top_h, size // 2, size - m, (left, left * 0.86, left * 0.62))
    _rect(a, size // 2, m + top_h, size - m, size - m, (right, right * 0.86, right * 0.62))
    return _u8(a)


# ---------------------------------------------------------- negative controls

def negative_control_halo(size=800, content=560, halo_px=8, halo=(168, 166, 163)):
    """§9.4's named negative control: a grey halo on grey ground.

    The halo colour is deliberately *outside* any sane matte tolerance of the
    ground, so the matte keeps it as object pixels — which is exactly how a real
    halo survives — and it is wide enough to be a band rather than an antialias
    ring. Gate (a) must fail this.
    """
    a = _canvas(size)
    m = (size - content) // 2
    obj = np.zeros((size, size), bool)
    obj[m:size - m, m:size - m] = True
    ring = im.dilate(obj, halo_px) & ~obj
    a[ring] = np.asarray(halo, np.float64)
    a[obj] = np.asarray(OAK, np.float64)
    a[m:m + content // 6, m:size - m] = np.asarray(OAK_LIGHT, np.float64)
    return _u8(a)


def negative_control_hole(size=700, content=520, interior=(160, 159, 157)):
    """An enclosed gap whose grey is graded away from the ground.

    Outside the matte's own tolerance, so the matte does not punch it; inside
    gate (b)'s looser one, so the gate must catch a hole the matte missed. This
    is the whole reason the two tolerances differ.
    """
    a = _canvas(size)
    m = (size - content) // 2
    _rect(a, m, m, size - m, size - m, OAK)
    _rect(a, m, m, size - m, m + content // 6, OAK_LIGHT)
    gy0, gy1 = size // 2 - 60, size // 2 + 60
    gx0, gx1 = size // 2 - 60, size // 2 + 60
    grad = np.linspace(-6, 6, gx1 - gx0)[None, :, None]
    a[gy0:gy1, gx0:gx1] = np.asarray(interior, np.float64)[None, None, :] + grad
    return _u8(a)


def negative_control_undersized(size=200, content=100):
    """Content bbox far under gate (c)'s floor."""
    a = _canvas(size)
    m = (size - content) // 2
    _rect(a, m, m, size - m, size - m, OAK)
    return _u8(a)


def negative_control_shadow(size=800, content=520, shadow_px=90, depth=0.34):
    """A soft cast shadow pooled under the object, on the seamless ground.

    `negative_block` forbids it and generators produce it anyway. The shadow is
    further than tolerance from the border median, so the matte keeps it as
    **opaque object pixels**: without gate (h) the sprite arrives with its studio
    shadow welded on, gate (f) is rewarded by the widened footprint, and gate (a)
    sees object-coloured pixels. Gate (h) must fail this.
    """
    a = _canvas(size)
    m = (size - content) // 2
    base = size - m
    y = np.arange(size)[:, None].astype(np.float64)
    x = np.arange(size)[None, :].astype(np.float64)
    r = (((y - base) / (shadow_px * 0.45)) ** 2 +
         ((x - size / 2.0) / (content * 0.62)) ** 2)
    fall = np.clip(1.0 - r, 0.0, 1.0)
    a *= (1.0 - depth * fall)[..., None]
    _rect(a, m, m, size - m, base, OAK)
    _rect(a, m, m, size - m, m + content // 6, OAK_LIGHT)
    return _u8(a)


def negative_control_bitten(size=800, content=560):
    """An object whose own colour is within a hair of the ground.

    A conservative matte keeps it; a tolerant one eats it. Gate (g) must fail on
    the divergence rather than shipping a sprite with a limb missing.
    """
    a = _canvas(size)
    m = (size - content) // 2
    _rect(a, m, m, size - m, size - m, OAK)
    _rect(a, m, m, size - m, m + content // 6, OAK_LIGHT)
    # A pale limb with a SOFT edge, ramping from a hair off the ground to well
    # clear of it. A flat-coloured limb sits on one side of the tolerance or the
    # other and the silhouette does not move as the tolerance sweeps -- which
    # made an earlier version of this control pass by accident. A graded limb is
    # what a real thin pale feature looks like, and it is what makes the
    # silhouette genuinely tolerance-dependent.
    lx0, lx1 = size // 2 - 150, size // 2 + 150
    ly0, ly1 = 6, m
    ramp = np.linspace(4.0, 14.0, ly1 - ly0)[::-1][:, None, None]
    base = np.asarray(GROUND, np.float64)[None, None, :]
    a[ly0:ly1, lx0:lx1] = base + ramp
    return _u8(a)


def part_source(size=800, content=600):
    """A body with a rectangular 'drawer front' bounded by dark reveal gaps.

    Used for the parts stage, gate (d), the slide checks and the mask fit — the
    reveal gaps are what the fitter finds.
    """
    a = _canvas(size)
    m = (size - content) // 2
    _rect(a, m, m, size - m, size - m, OAK)
    _rect(a, m, m, size - m, m + content // 8, OAK_LIGHT)
    fx0, fy0 = m + 60, m + content // 3
    fx1, fy1 = size - m - 60, m + 2 * content // 3
    _rect(a, fx0 - 4, fy0 - 4, fx1 + 4, fy1 + 4, (34, 22, 12))   # reveal gap
    _rect(a, fx0, fy0, fx1, fy1, OAK_LIGHT)                       # the front
    _rect(a, (fx0 + fx1) // 2 - 12, fy0 + 30, (fx0 + fx1) // 2 + 12, fy0 + 70,
          (169, 136, 54))                                         # a brass pull
    return _u8(a), {"x0": fx0, "y0": fy0, "x1": fx1, "y1": fy1}


def state_pair(size=800, leaf_w=260, leaf_h=600, jamb=(169, 136, 54)):
    """A closed leaf and an edge-on open leaf, sharing a frame datum.

    The datum is the door frame's jamb mark, and it is present **in both images
    at the same source position** — which is the whole point: two independently
    generated state images are each centred on their own silhouette, so the only
    thing that can register them is a feature both of them show. The ingester
    locates it by correlation and derives the origin from it, so the alignment
    gate stops being a check on a number the operator typed.
    """
    m = (size - leaf_h) // 2
    left = size // 2 - leaf_w // 2
    jx0, jy0 = left - 34, m + leaf_h // 2 - 30
    jx1, jy1 = left - 8, m + leaf_h // 2 + 30

    def _jamb(a):
        """The jamb mark, identical in both images — and NOT a plain bar.

        A featureless vertical rectangle is translationally ambiguous along its
        own axis and matches any other vertical bar in the frame (the open
        image's edge-on sliver is one). Normalized cross-correlation scored a
        rival within 0.012 of the true peak on the original control, so the
        peak-margin clause refused the project's own datum — correctly. The
        control is a *good* datum now: a peg crossing the jamb gives it
        structure on both axes and one place it fits.
        """
        _rect(a, jx0, jy0, jx1, jy1, jamb)
        _rect(a, jx0 - 9, jy0 + 18, jx1 + 9, jy0 + 30, OAK_DARK)   # the peg

    closed = _canvas(size)
    _rect(closed, left, m, left + leaf_w, m + leaf_h, OAK)
    _rect(closed, left + leaf_w // 2 - 10, m + leaf_h // 2 - 10,
          left + leaf_w // 2 + 10, m + leaf_h // 2 + 10, OAK_LIGHT)
    _jamb(closed)

    opened = _canvas(size)
    sliver = 46
    _rect(opened, left, m, left + sliver, m + leaf_h, OAK_DARK)
    _jamb(opened)

    return _u8(closed), _u8(opened), {
        "leaf_w": leaf_w, "leaf_h": leaf_h, "top": m, "left": left,
        # The datum rect deliberately includes ground either side of the jamb:
        # a patch of flat colour has no variance to correlate on, which the
        # ingester refuses by name.
        "datum": (jx0 - 14, jy0 - 14, jx1 + 14, jy1 + 14)}


# ------------------------------------------------------------------ registry

CASES = {
    "clean": lambda: clean_sprite(),
    "legged": lambda: legged_sprite(),
    "squat": lambda: squat_sprite(),
    "neutral": lambda: neutral_disc(),
    "lit-ul": lambda: lit_solid(direction="UL"),
    "lit-ur": lambda: lit_solid(direction="UR"),
    "lit-top": lambda: lit_solid(direction="TOP"),
    "halo": negative_control_halo,
    "hole": negative_control_hole,
    "undersized": negative_control_undersized,
    "shadow": negative_control_shadow,
    "bitten": negative_control_bitten,
    "part": lambda: part_source()[0],
    "state-closed": lambda: state_pair()[0],
    "state-open": lambda: state_pair()[1],
}


def main(argv=None):
    p = argparse.ArgumentParser(prog="replicator.synth",
                                description="Write a constructed control image.")
    p.add_argument("--case", help="which control (see --list)")
    p.add_argument("--out")
    p.add_argument("--list", action="store_true")
    args = p.parse_args(argv)
    if args.list or not args.case:
        print("\n".join(sorted(CASES)), file=sys.stderr)
        return 0 if args.list else 3
    if args.case not in CASES:
        print("unknown case %r; --list shows them all" % args.case, file=sys.stderr)
        return 3
    if not args.out:
        print("--case needs --out", file=sys.stderr)
        return 3
    from PIL import Image
    Image.fromarray(CASES[args.case]()).save(args.out)
    print("wrote %s (%s)" % (args.out, args.case), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
