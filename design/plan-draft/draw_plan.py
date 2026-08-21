#!/usr/bin/env python3
"""Draws the manor plan schematic (two artboards) as precise SVG, FROM the plan.

The plan document is the source: `fixtures/demo-study/plan.json` holds every
metre of real building, and this script is a byte-deterministic projection of
it (blueprint 4b shape item 10 - "the schematic is a byte-deterministic
derived render existing only for human gates and semantic sanity"). Nothing
spatial is typed here any more; what lives here is the PICTURE - colours,
stroke weights, label nudges, artboard extents, legend copy, the star.

The plan's checks live in `tools/validate-plan.mjs`, not in this file. This
script calls that validator and refuses to draw an invalid plan, so a redline
still cannot silently break the plan, and each check has one home instead of
two.

To take a redline in: see the recipe in `design/plan-draft/README.md`. It has
five steps, not two, and the last of them is a human one - the sheet's approval
stamp is tied to the sha256 in `design/plan-draft/approval.lock`, so a redrawn
sheet says UNAPPROVED REVISION until Kabe approves it and that hash is
re-anchored.

Run:  python3 design/plan-draft/draw_plan.py [--plan PATH] [--skip-validate]

--skip-validate draws without calling tools/validate-plan.mjs. It exists for
the case where node is unavailable and the plan has already been checked by
hand; using it means the sheet is drawn from an unchecked document, which is
what the validator exists to prevent.
"""
import hashlib, json, os, subprocess, sys

S = 26.0          # px per metre (both artboards, same scale)
OUT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(OUT))
DEFAULT_PLAN = os.path.join(REPO, "fixtures", "demo-study", "plan.json")
APPROVAL = os.path.join(OUT, "approval.lock")


# What the SHEET actually draws. The approval stamp is an assertion about what
# Kabe saw, and he saw walls, the exterior outline, openings, windows,
# fireplaces, stairs, standpoints with their distances, and room
# geometry/labels/types. He did not see the furniture - the sheet draws none -
# and `plan.objects` was inverse-projected out of staging.json by an agent
# after the approval, which `design/architecture.md` records.
#
# Row 11 narrowed the stamp's INPUT to exactly that drawn content, on the
# Navigator's ruling, so that a composition value blueprint §4's standing
# licence lets an agent move does not falsely read as "a human must re-approve
# this drawing". The lock still fires on ANY change to a drawn field.
#
# The un-drawn remainder is NOT thrown away: `undrawn_digest` covers it and the
# lock records it too, so a change there is VISIBLE on the sheet even though it
# is non-blocking. Narrowing the input without keeping that second record would
# delete the only trace that unapproved fields had moved.
DRAWN_KEYS = ("schema", "version", "units", "north", "standpoint_stand_back",
              "entrance", "wall_thickness", "outline", "floors", "wall_bands",
              "rooms", "openings", "windows", "fireplaces", "stairs")


def _canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def plan_digests(plan):
    """(drawn, undrawn) sha256 over the plan, split by what the sheet draws."""
    drawn = {k: plan[k] for k in DRAWN_KEYS if k in plan}
    undrawn = {k: v for k, v in plan.items() if k not in DRAWN_KEYS}
    return (hashlib.sha256(_canonical(drawn)).hexdigest(),
            hashlib.sha256(_canonical(undrawn)).hexdigest())


def approval_line(plan_path, validated):
    """The provenance line printed under the title.

    The sheet is a DERIVED render, so "APPROVED 2026-08-21" cannot be a
    constant in this file: every re-render from an edited plan would keep
    asserting a human gate that was given to a different document. The stamp is
    a fact about specific bytes - approval.lock records the sha256 Kabe
    approved - and about whether anything checked them.
    """
    with open(plan_path) as fh:
        plan_doc = json.load(fh)
    digest, undrawn = plan_digests(plan_doc)
    approved_sha, approved_on, approved_undrawn = "", "", ""
    try:
        with open(APPROVAL) as fh:
            for line in fh:
                if line.startswith("plan "):
                    _, approved_sha, approved_on = line.split()
                elif line.startswith("undrawn "):
                    _, approved_undrawn = line.split()
    except OSError:
        pass
    rel = os.path.relpath(plan_path, REPO)
    if not validated:
        return ("holo-emitter - overhead plan. DRAWN WITHOUT VALIDATION from %s "
                "(sha %s) - no approval stamp: nothing checked this document. "
                "Drawn at 26 px per metre; use the scale bar. All room "
                "dimensions are clear internal metres." % (rel, digest[:8]))
    if digest == approved_sha:
        drift = ("" if undrawn == approved_undrawn else
                 " Content the sheet does not draw has changed since then "
                 "(sha %s); the drawing is unaffected." % undrawn[:8])
        return ("holo-emitter - overhead plan. APPROVED %s; DERIVED from %s.%s "
                "Drawn at 26 px per metre; use the scale bar. All room "
                "dimensions are clear internal metres." % (approved_on, rel, drift))
    return ("holo-emitter - overhead plan. UNAPPROVED REVISION of %s (sha %s; "
            "the sheet Kabe approved on %s was drawn from sha %s) - this sheet "
            "goes back to Kabe. Drawn at 26 px per metre; use the scale bar. "
            "All room dimensions are clear internal metres."
            % (rel, digest[:8], approved_on or "an unrecorded date",
               (approved_sha or "unrecorded")[:8]))

# ---------------------------------------------------------------- the picture
# Presentation only. A number here moves a LABEL, never a room. Keyed by the
# plan's room ids.
LABEL = {
    "hall": dict(lone=True, lnudge=0.88,
                 lab={"S": "below", "E": "above", "W": "above"}),
    "great_stair_hall": dict(lnudgex=0.6),
    "stair_landing": dict(lnudgex=0.6),
}
# The star marking door1, the existing M0 exit - hand-placed to clear the
# travel arrows.
STARS_GROUND = [(30.05, 11.62)]
# Where each stair's label sits; the leader runs from here to the flight.
STAIR_LABEL_POS = {"great_stair": (8.3, 13.5), "back_stair_flight": (25.95, 18.45)}


def check_plan(path):
    """Refuse to draw a plan the standing validator rejects. The checks the
    first drawing ran itself are `tools/validate-plan.mjs` now."""
    tool = os.path.join(REPO, "tools", "validate-plan.mjs")
    try:
        r = subprocess.run(["node", tool, "--fixture-dir", os.path.dirname(path)],
                           capture_output=True, text=True)
    except (FileNotFoundError, OSError):
        sys.exit("draw_plan: node is needed to run tools/validate-plan.mjs, and "
                 "an unchecked drawing is what that validator exists to prevent. "
                 "Install node, or run the validator yourself and re-run with "
                 "--skip-validate.")
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        sys.exit("draw_plan: refusing to draw an invalid plan")


# ------------------------------------------------------- plan -> drawing data
# Adapters. Each returns the shape the drawing code below already consumes, so
# the picture-making code is untouched by the inversion.
def _rect(d):
    r = d["rect"]
    return (r["x0"], r["x1"], r["y0"], r["y1"])


def load(path):
    with open(path) as fh:
        plan = json.load(fh)
    d = {"plan": plan}
    d["OUTLINE"] = [tuple(p) for p in plan["outline"]]
    d["EXT_BANDS"] = [_rect(b) for b in plan["wall_bands"] if b["kind"] == "exterior"]
    gw = [b for b in plan["wall_bands"] if b["kind"] == "garden"]
    d["GW"] = _rect(gw[0]) if gw else None
    d["EXT"] = plan["wall_thickness"]["exterior"]
    d["INT"] = plan["wall_thickness"]["partition"]
    d["GWT"] = plan["wall_thickness"]["garden"]
    d["K"] = plan["standpoint_stand_back"]
    for floor in ("ground", "upper"):
        d[("rooms", floor)] = [_room(r) for r in plan["rooms"] if r["floor"] == floor]
        d[("parts", floor)] = [_rect(b) for b in plan["wall_bands"]
                               if b["kind"] == "partition" and floor in b["floors"]]
        d[("doors", floor)] = [
            (_rect(o)[0], _rect(o)[1], _rect(o)[2], _rect(o)[3], o["axis"],
             "N/S" if o["axis"] == "NS" else "E/W", o["joins"][0], o["joins"][1])
            for o in plan["openings"]
            if o["floor"] == floor and o["kind"] == "door"]
        d[("wins", floor)] = [_rect(w) for w in plan["windows"] if w["floor"] == floor]
        d[("fires", floor)] = [_rect(f) for f in plan["fireplaces"] if f["floor"] == floor]
    d[("stairs", "ground")] = [_stair(s, plan, "up") for s in plan["stairs"]]
    d[("stairs", "upper")] = [_stair(s, plan, "down") for s in plan["stairs"]]
    return d


def _room(r):
    """One room, in the shape draw_floor reads. `sp` carries the plan's own
    standpoints - law (a)'s drawn distances, read out of the document rather
    than recomputed here, so the number printed on the sheet IS the number the
    plan holds."""
    x0, x1, y0, y1 = _rect(r)
    sp = []
    for f in ("N", "E", "S", "W"):
        fc = r["facings"][f]
        sp.append(dict(f=f, p=(fc["standpoint"]["x"], fc["standpoint"]["y"]),
                       dist=fc.get("camera_wall_m", fc.get("camera_far_m")),
                       ftype=fc["type"],
                       wall_w=fc["wall_width_m"], line=fc["wall_line"],
                       note=fc.get("note", "")))
    lab = LABEL.get(r["id"], {})
    return dict(id=r["id"], name=r["name"], typ=r["type"],
                x0=x0, x1=x1, y0=y0, y1=y1, sp=sp,
                lab=lab.get("lab", {}), lone=lab.get("lone", False),
                lnudge=lab.get("lnudge", 0.0), lnudgex=lab.get("lnudgex", 0.0))


def _stair(s, plan, sense):
    """A flight, drawn on the floor it rises from or lands on. `up` and `down`
    are the plan's travel directions - blueprint 3's orientation law."""
    x0, x1, y0, y1 = _rect(s)
    d = s[sense]
    # Picture data keyed by a document id needs a fallback, or renaming a stair
    # in a perfectly valid plan kills the render with a raw KeyError. The
    # fallback puts the label 2 m west of the flight's own centre - not as nice
    # as the hand-placed positions, and it says so on stderr.
    if s["id"] in STAIR_LABEL_POS:
        lbx, lby = STAIR_LABEL_POS[s["id"]]
    else:
        lbx, lby = (x0 + x1) / 2.0 - 2.0, (y0 + y1) / 2.0
        sys.stderr.write("draw_plan: no hand-placed label position for stair "
                         "%r; using the flight's centre. Add it to "
                         "STAIR_LABEL_POS to place it properly.\n" % s["id"])
    lab = ("UP \u2192 " if sense == "up" else "DN \u2192 ") + d
    return (x0, x1, y0, y1, d, s["treads"], lab, lbx, lby)


def standpoints(r):
    """Law (a)'s standpoints, as the plan document holds them."""
    return r["sp"]


# ---------------------------------------------------------------- svg helpers
def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


class Board:
    def __init__(self, x0, x1, y0, y1, mx, my, w, h):
        self.x0, self.y1, self.mx, self.my = x0, y1, mx, my
        self.w, self.h = w, h
        self.o = []

    def X(self, x): return self.mx + (x - self.x0) * S
    def Y(self, y): return self.my + (self.y1 - y) * S

    def rect(self, x0, x1, y0, y1, **kw):
        a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in kw.items())
        self.o.append('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" %s/>'
                      % (self.X(x0), self.Y(y1), (x1 - x0) * S, (y1 - y0) * S, a))

    def prect(self, px, py, pw, ph, **kw):
        a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in kw.items())
        self.o.append('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" %s/>'
                      % (px, py, pw, ph, a))

    def line(self, x0, y0, x1, y1, **kw):
        a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in kw.items())
        self.o.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" %s/>'
                      % (self.X(x0), self.Y(y0), self.X(x1), self.Y(y1), a))

    def pline(self, x0, y0, x1, y1, **kw):
        a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in kw.items())
        self.o.append('<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" %s/>'
                      % (x0, y0, x1, y1, a))

    def text(self, x, y, s, size=11, anchor="middle", fill="#111",
             weight="normal", dy=0, family="DejaVu Sans, Arial, sans-serif",
             ls="0", halo=3.2, dx=0):
        h = ('paint-order="stroke" stroke="#ffffff" stroke-width="%s" '
             'stroke-linejoin="round"' % halo) if halo else ""
        self.o.append('<text x="%.2f" y="%.2f" font-size="%s" text-anchor="%s" '
                      'fill="%s" font-weight="%s" font-family="%s" '
                      'letter-spacing="%s" %s>%s</text>'
                      % (self.X(x) + dx, self.Y(y) + dy, size, anchor, fill,
                         weight, family, ls, h, esc(s)))

    def rtext(self, x, y, s, angle, size=9, fill="#111", weight="bold"):
        self.o.append('<text transform="translate(%.2f,%.2f) rotate(%d)" '
                      'font-size="%s" text-anchor="middle" fill="%s" '
                      'font-weight="%s" font-family="DejaVu Sans, Arial, '
                      'sans-serif" paint-order="stroke" stroke="#ffffff" '
                      'stroke-width="3.4" stroke-linejoin="round">%s</text>'
                      % (self.X(x), self.Y(y), angle, size, fill, weight,
                         esc(s)))

    def ptext(self, px, py, s, size=11, anchor="start", fill="#111",
              weight="normal", family="DejaVu Sans, Arial, sans-serif"):
        self.o.append('<text x="%.2f" y="%.2f" font-size="%s" text-anchor="%s" '
                      'fill="%s" font-weight="%s" font-family="%s">%s</text>'
                      % (px, py, size, anchor, fill, weight, family, esc(s)))

    def path(self, pts, **kw):
        a = " ".join('%s="%s"' % (k.replace("_", "-"), v) for k, v in kw.items())
        d = "M " + " L ".join("%.2f,%.2f" % (self.X(x), self.Y(y)) for x, y in pts) + " Z"
        self.o.append('<path d="%s" %s/>' % (d, a))


DEFS = '''<defs>
<pattern id="hatch" width="6" height="6" patternTransform="rotate(45)"
         patternUnits="userSpaceOnUse">
  <line x1="0" y1="0" x2="0" y2="6" stroke="#5b5147" stroke-width="1.6"/>
</pattern>
<marker id="arw" markerWidth="8" markerHeight="8" refX="7" refY="3"
        orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="#1b5e9c"/></marker>
<marker id="arwT" markerWidth="9" markerHeight="9" refX="8" refY="3.2"
        orient="auto"><path d="M0,0 L8,3.2 L0,6.4 z" fill="#8a2f12"/></marker>
<marker id="tick" markerWidth="6" markerHeight="6" refX="3" refY="3"
        orient="auto"><line x1="3" y1="0.5" x2="3" y2="5.5" stroke="#1b5e9c"
        stroke-width="1.2"/></marker>
</defs>'''

C_EXT = "#2b2620"     # exterior wall poche
C_INT = "#8d8479"     # interior partition poche
C_GW = "#6f5a3d"      # garden wall poche
C_FLOOR = "#faf7f1"
C_OPEN = "#eef3e6"    # open (outdoor) ground
C_CAM = "#1b5e9c"     # standpoints
C_DOOR = "#8a2f12"    # openings + travel arrows


def draw_floor(b, rooms, parts, doors, wins, fires, stairs, garden_wall):
    # --- open ground first (outdoor rooms), then interior floors
    for r in rooms:
        if r["typ"] == "open":
            b.rect(r["x0"], r["x1"], r["y0"], r["y1"], fill=C_OPEN,
                   stroke="#c3cfb2", stroke_width="1", stroke_dasharray="5 4")
        else:
            b.rect(r["x0"], r["x1"], r["y0"], r["y1"], fill=C_FLOOR, stroke="none")
    # --- wall poche
    for (x0, x1, y0, y1) in EXT_BANDS:
        b.rect(x0, x1, y0, y1, fill=C_EXT, stroke="none")
    for (x0, x1, y0, y1) in parts:
        b.rect(x0, x1, y0, y1, fill=C_INT, stroke="#3a352e", stroke_width="0.8")
    if garden_wall:
        b.rect(*GW, fill=C_GW, stroke="#2b2620", stroke_width="2.4")
    # --- openings knock holes in the poche
    for (x0, x1, y0, y1, axis, lab, a, c) in doors:
        b.rect(x0, x1, y0, y1, fill="#ffffff", stroke="none")
    for (x0, x1, y0, y1) in wins:
        b.rect(x0, x1, y0, y1, fill="#ffffff", stroke="none")
        if x1 - x0 > y1 - y0:
            yy = (y0 + y1) / 2.0
            b.line(x0, yy, x1, yy, stroke="#2b2620", stroke_width="1.6")
        else:
            xx = (x0 + x1) / 2.0
            b.line(xx, y0, xx, y1, stroke="#2b2620", stroke_width="1.6")
    # --- heavy exterior outline (law (b) is visually checkable on this line)
    b.path(OUTLINE, fill="none", stroke="#000", stroke_width="4.2",
           stroke_linejoin="miter")
    # --- fireplaces
    for (x0, x1, y0, y1) in fires:
        b.rect(x0, x1, y0, y1, fill="url(#hatch)", stroke="#3a352e",
               stroke_width="1.1")
    # --- door travel arrows (orientation law: you arrive facing the way you went)
    for (x0, x1, y0, y1, axis, lab, a, c) in doors:
        cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
        if axis == "NS":
            b.line(cx, cy - 1.15, cx, cy + 1.15, stroke=C_DOOR, stroke_width="1.5",
                   marker_end="url(#arwT)", marker_start="url(#arwT)")
            b.text(cx + 0.28, cy, lab, size=8.5, anchor="start", fill=C_DOOR,
                   weight="bold", dy=3)
        else:
            b.line(cx - 1.15, cy, cx + 1.15, cy, stroke=C_DOOR, stroke_width="1.5",
                   marker_end="url(#arwT)", marker_start="url(#arwT)")
            b.text(cx, cy + 0.34, lab, size=8.5, anchor="middle", fill=C_DOOR,
                   weight="bold")
    # --- stairs
    for (x0, x1, y0, y1, d, n, lab, lbx, lby) in stairs:
        b.rect(x0, x1, y0, y1, fill="#f3ece0", stroke="#3a352e", stroke_width="1.1")
        if d in ("N", "S"):
            for i in range(1, n):
                yy = y0 + (y1 - y0) * i / n
                b.line(x0, yy, x1, yy, stroke="#6b6257", stroke_width="0.9")
            mx = (x0 + x1) / 2.0
            if d == "N":
                b.line(mx, y0 + 0.3, mx, y1 - 0.3, stroke=C_DOOR,
                       stroke_width="1.8", marker_end="url(#arwT)")
            else:
                b.line(mx, y1 - 0.3, mx, y0 + 0.3, stroke=C_DOOR,
                       stroke_width="1.8", marker_end="url(#arwT)")
            b.line(lbx, lby, (x0 + x1) / 2.0, (y0 + y1) / 2.0,
                   stroke=C_DOOR, stroke_width="0.8",
                   stroke_dasharray="3 2")
            b.rtext(lbx, lby, lab, 0, size=9.5, fill=C_DOOR)
        else:
            for i in range(1, n):
                xx = x0 + (x1 - x0) * i / n
                b.line(xx, y0, xx, y1, stroke="#6b6257", stroke_width="0.9")
            my = (y0 + y1) / 2.0
            if d == "E":
                b.line(x0 + 0.3, my, x1 - 0.3, my, stroke=C_DOOR,
                       stroke_width="1.8", marker_end="url(#arwT)")
            else:
                b.line(x1 - 0.3, my, x0 + 0.3, my, stroke=C_DOOR,
                       stroke_width="1.8", marker_end="url(#arwT)")
            b.line(lbx, lby, (x0 + x1) / 2.0, (y0 + y1) / 2.0,
                   stroke=C_DOOR, stroke_width="0.8",
                   stroke_dasharray="3 2")
            b.rtext(lbx, lby, lab, 0, size=9.5, fill=C_DOOR)
    # --- room labels + standpoints
    rows = []
    for r in rooms:
        cx, cy = (r["x0"] + r["x1"]) / 2.0, (r["y0"] + r["y1"]) / 2.0
        w, d = r["x1"] - r["x0"], r["y1"] - r["y0"]
        big = min(w, d) > 5.0
        ns = 12.5 if big else 10.5
        ly = cy + r.get("lnudge", 0.0)
        lx = cx + r.get("lnudgex", 0.0)
        if r.get("lone"):
            b.text(lx, ly, "%s · %s · %.2f × %.2f m"
                   % (r["name"], r["typ"], w, d), size=9.4, weight="bold")
        else:
            b.text(lx, ly, r["name"], size=ns, weight="bold", dy=-20)
            b.text(lx, ly, "%s · %.2f × %.2f m" % (r["typ"], w, d), size=9.2,
                   fill="#4a443c", dy=-8)
        for sp in standpoints(r):
            f, (px, py), dist = sp["f"], sp["p"], sp["dist"]
            # dashed leader from the standpoint to the wall line it views
            if f == "N": lx, ly = px, sp["line"]
            elif f == "S": lx, ly = px, sp["line"]
            elif f == "E": lx, ly = sp["line"], py
            else: lx, ly = sp["line"], py
            b.line(px, py, lx, ly, stroke=C_CAM, stroke_width="0.9",
                   stroke_dasharray="4 3", marker_end="url(#arw)")
            b.o.append('<circle cx="%.2f" cy="%.2f" r="3.1" fill="#fff" '
                       'stroke="%s" stroke-width="1.6"/>'
                       % (b.X(px), b.Y(py), C_CAM))
            tag = "%s %.2f" % (f, dist)
            if sp["ftype"] == "open":
                tag += " open"
            ld = r["lab"].get(f, {"N": "below", "S": "above",
                                  "E": "below", "W": "below"}[f])
            if ld == "below":
                b.text(px, py, tag, size=8.6, fill=C_CAM, weight="bold",
                       dy=14, anchor="middle")
            elif ld == "above":
                b.text(px, py, tag, size=8.6, fill=C_CAM, weight="bold",
                       dy=-8, anchor="middle")
            elif ld == "W":
                b.text(px - 0.28, py, tag, size=8.6, fill=C_CAM,
                       weight="bold", dy=3, anchor="end")
            else:
                b.text(px + 0.28, py, tag, size=8.6, fill=C_CAM,
                       weight="bold", dy=3, anchor="start")
            rows.append((r["name"], r["typ"], f, sp["ftype"], dist,
                         sp["wall_w"], sp["note"]))
    return rows


def scalebar(b, px, py):
    b.ptext(px, py - 8, "SCALE  (metres)", 10, weight="bold")
    for i in range(10):
        b.prect(px + i * S, py, S, 8, fill="#2b2620" if i % 2 == 0 else "#fff",
                stroke="#2b2620", stroke_width="0.8")
    for i in (0, 5, 10):
        b.ptext(px + i * S, py + 22, "%d" % i, 9.5, anchor="middle")
    b.prect(px, py + 30, 10 * S, 0, fill="none")


def northarrow(b, px, py):
    b.o.append('<g transform="translate(%.1f,%.1f)">' % (px, py))
    b.o.append('<path d="M0,-34 L11,14 L0,4 L-11,14 Z" fill="#2b2620"/>')
    b.o.append('<circle cx="0" cy="-10" r="30" fill="none" stroke="#2b2620" '
               'stroke-width="1.2"/>')
    b.o.append('<text x="0" y="35" font-size="14" font-weight="bold" '
               'text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif"'
               '>N</text></g>')


def legend(b, px, py, lines):
    y = py
    for kind, txt in lines:
        if kind == "h":
            b.ptext(px, y, txt, 11.5, weight="bold"); y += 17
        elif kind == "t":
            b.ptext(px, y, txt, 9.6, fill="#3a352e"); y += 13.5
        elif kind == "gap":
            y += 8
        else:
            b.prect(px, y - 9, 22, 10, **kind); b.ptext(px + 28, y, txt, 9.6)
            y += 17
    return y


NOTE_A = ("LAW (a) - every facing's standpoint is marked, with its measured "
          "distance to the wall line it views. camera_wall_m is READ OFF THIS "
          "DRAWING, never invented.")
NOTE_B = ("LAW (b) - outdoor walls exist ONLY where the manor's exterior wall "
          "stands. The heavy black outline is the single source of every "
          "outdoor wall; the privy garden wall is the one further BUILT "
          "structure and is drawn as one.")


def fit_check(name, b, rooms, parts, stars):
    """The artboard extents are picture literals, and a building that outgrows
    them draws off-canvas in silence. This turns that into a refusal that names
    what fell off which edge."""
    bad = []
    def look(what, x0, x1, y0, y1):
        if x0 < b.x0 - 1e-9 or x1 > b.x0 + (b.w - b.mx * 2) / S + 1e-9 \
           or y1 > b.y1 + 1e-9 or y0 < b.y1 - (b.h - b.my - 120) / S - 1e-9:
            bad.append("%s (%.2f..%.2f, %.2f..%.2f)" % (what, x0, x1, y0, y1))
    for r in rooms:
        look(r["id"], r["x0"], r["x1"], r["y0"], r["y1"])
    for (x0, x1, y0, y1) in parts:
        look("wall band", x0, x1, y0, y1)
    for (sx, sy) in stars:
        look("star", sx, sx, sy, sy)
    if bad:
        sys.exit("draw_plan: %s - the plan does not fit this artboard's extents "
                 "(x %.2f.., y ..%.2f, %dx%d px at %g px/m). Off the sheet: %s. "
                 "The extents are picture literals in build(); widen them, or "
                 "the sheet silently loses building."
                 % (name, b.x0, b.y1, b.w, b.h, S, "; ".join(bad)))


def build(name, title, sub, rooms, parts, doors, wins, fires, stairs,
          gw, y0, y1, W, H, stars=(), extra_notes=()):
    b = Board(-1.0, 40.6, y0, y1, 40, 104, W, H)
    b.o.append('<rect x="0" y="0" width="%d" height="%d" fill="#ffffff"/>' % (W, H))
    b.ptext(40, 40, title, 25, weight="bold")
    b.ptext(40, 62, sub, 11.5, fill="#4a443c")
    b.ptext(40, 80, PROVENANCE, 10, fill="#6b6257")
    b.pline(40, 90, W - 40, 90, stroke="#2b2620", stroke_width="1.6")
    fit_check(name, b, rooms, parts, stars)
    rows = draw_floor(b, rooms, parts, doors, wins, fires, stairs, gw)
    for (sx, sy) in stars:
        b.text(sx, sy, "\u2605", size=15, fill=C_DOOR, weight="bold", dy=5)
    ph = b.my + (y1 - y0) * S
    b.pline(40, ph + 26, W - 40, ph + 26, stroke="#2b2620", stroke_width="1")
    scalebar(b, 40, ph + 62)
    northarrow(b, 40 + 10 * S + 90, ph + 72)
    legend(b, 40 + 10 * S + 190, ph + 50, [
        ("h", "SYMBOLS"),
        # The three measurements come from the plan, not from this file: they
        # are dimensions of the building, and a legend that types them can
        # disagree with the walls it describes.
        ({"fill": C_EXT}, "exterior / structural wall, %.2f m" % EXT),
        ({"fill": C_INT, "stroke": "#3a352e", "stroke-width": "0.8"},
         "interior partition, %.2f m" % INT),
        ({"fill": C_GW, "stroke": "#2b2620", "stroke-width": "2"},
         "garden wall (built structure), %.2f m" % GWT),
        ({"fill": "url(#hatch)", "stroke": "#3a352e", "stroke-width": "1"},
         "fireplace / chimney breast"),
    ])
    legend(b, 40 + 10 * S + 560, ph + 50, [
        ("h", "READING THE STANDPOINTS"),
        ("t", "o  standpoint for one facing; the dashed leader runs to the wall"),
        ("t", "   line that facing views. The printed number IS camera_wall_m."),
        ("t", "N 3.60  =  facing N, standpoint 3.60 m from the N wall line."),
        ("t", "\"open\" = no facing wall; the number is to the drawn far ground line."),
        ("t", "Doubled red arrows = an opening, with the travel directions"),
        ("t", "   through it. You arrive facing the way you went (orientation law)."),
    ])
    b.pline(40, ph + 156, W - 40, ph + 156, stroke="#c9c2b6", stroke_width="1")
    b.ptext(40, ph + 176, NOTE_A, 10, fill="#1b5e9c", weight="bold")
    b.ptext(40, ph + 192, NOTE_B, 10, fill="#1b5e9c", weight="bold")
    yy = ph + 212
    for n in extra_notes:
        b.ptext(40, yy, n, 9.6, fill="#3a352e"); yy += 14
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
           'viewBox="0 0 %d %d">%s%s</svg>'
           % (W, H, W, H, DEFS, "".join(b.o)))
    p = os.path.join(OUT, name + ".svg")
    open(p, "w").write(svg)
    return rows, p


def main():
    argv = sys.argv[1:]
    plan_path = DEFAULT_PLAN
    if "--plan" in argv:
        plan_path = os.path.abspath(argv[argv.index("--plan") + 1])
    validated = "--skip-validate" not in argv
    if validated:
        check_plan(plan_path)
    globals()["PROVENANCE"] = approval_line(plan_path, validated)
    D = load(plan_path)
    g = globals()
    for k in ("OUTLINE", "EXT_BANDS", "GW", "EXT", "INT", "GWT", "K"):
        g[k] = D[k]

    rg, pg = build("manor-ground.svg".replace(".svg", ""),
                   "MANOR PLAN - GROUND FLOOR & GROUNDS",
                   "c.1660 English manor, hall-and-cross-wings (H-plan). "
                   "North at top.",
                   D[("rooms", "ground")], D[("parts", "ground")],
                   D[("doors", "ground")], D[("wins", "ground")],
                   D[("fires", "ground")], D[("stairs", "ground")], True,
                   -21.0, 26.5, 1520, 1620, stars=STARS_GROUND,
                   extra_notes=[
    "\u2605  door1 - the existing M0 exit. STUDY east wall <-> CROSS PASSAGE west "
    "wall, which is world.json's 'hall'. Blueprint 11's study wall map holds as "
    "drawn: fireplace N, door E, leaded windows S, blank paneling W.",
    "Blueprint 11's hall wall map holds too - shelf/paneling N, tapestry S, "
    "leaded window at the E end - but the manor gives the passage two further "
    "openings (N to the buttery, S to the kitchen) that map does not draw. "
    "Flagged for Kabe in the README.",
    "Every interior opening on this sheet joins the two spaces it names, and every "
    "space is reachable on foot from the ENTRANCE APPROACH - checked by "
    "tools/validate-plan.mjs, both floors, stairs included, which also refuses to "
    "let this sheet be drawn from a plan that fails."])
    ru, pu = build("manor-upper", "MANOR PLAN - UPPER FLOOR",
                   "Same footprint and scale as the ground floor artboard. "
                   "North at top.",
                   D[("rooms", "upper")], D[("parts", "upper")],
                   D[("doors", "upper")], D[("wins", "upper")],
                   D[("fires", "upper")], D[("stairs", "upper")], False,
                   -1.0, 26.5, 1520, 1100, extra_notes=[
    "The two stairs are the only exits between floors. GREAT STAIR: up travels "
    "north, so you arrive on this floor facing N; down travels south. BACK STAIR: "
    "up travels east, down travels west. Orientation law, blueprint 3.",
    "Chimney stacks are continuous: every fireplace here stands on the one below "
    "it (solar/great hall, master bedchamber/dining parlour, guest chamber/library, "
    "muniment room/study, long gallery/servants' hall)."])
    print(pg); print(pu)
    with open(os.path.join(OUT, "standpoints.tsv"), "w") as fh:
        fh.write("floor\troom\troom_type\tfacing\tfacing_type\t"
                 "camera_wall_m\twall_width_m\tnote\n")
        for fl, rows in (("ground", rg), ("upper", ru)):
            for (rn, rt, f, ft, dist, ww, note) in rows:
                fh.write("%s\t%s\t%s\t%s\t%s\t%.2f\t%.2f\t%s\n"
                         % (fl, rn, rt, f, ft, dist, ww, note))
    print("plan:", plan_path)


if __name__ == "__main__":
    main()
