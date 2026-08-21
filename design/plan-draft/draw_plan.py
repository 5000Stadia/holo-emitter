#!/usr/bin/env python3
"""Draws the row-12 manor plan schematic (two artboards) as precise SVG.

Every number below is metres of real building. The SVG is a projection of this
table at a fixed scale, so the drawing cannot disagree with itself: room rects
tile the wall bands, standpoints are computed from the rects, and every printed
camera_wall_m is the measured standpoint->wall-line distance, not a typed guess.

Run:  python3 design/plan-draft/draw_plan.py
"""
import math, os

S = 26.0          # px per metre (both artboards, same scale)
OUT = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- wall bands
EXT = 0.60        # exterior / structural wall thickness
INT = 0.35        # interior partition thickness
GWT = 0.45        # garden wall thickness

# vertical wall bands (x0, x1, y0, y1)
W0 = (0.0, 0.6, 0.0, 25.5)      # west wing, west exterior
W1 = (9.4, 10.0, 0.0, 25.5)     # west wing east / central range west (shared)
W2 = (30.4, 31.0, 0.0, 25.5)    # east wing west / central range east (shared)
W3 = (39.0, 39.6, 0.0, 25.5)    # east wing, east exterior
# horizontal wall bands
H0a = (0.0, 10.0, 0.0, 0.6)     # west wing, south exterior
H0b = (30.4, 39.6, 0.0, 0.6)    # east wing, south exterior
H1 = (9.4, 31.0, 9.0, 9.6)      # central range, south exterior (court front)
H2 = (9.4, 31.0, 18.9, 19.5)    # central range, north exterior (garden front)
H3a = (0.0, 10.0, 24.9, 25.5)   # west wing, north exterior
H3b = (30.4, 39.6, 24.9, 25.5)  # east wing, north exterior
GW = (10.0, 30.4, 25.05, 25.5)  # PRIVY GARDEN WALL - a real built structure

EXT_BANDS = [W0, W1, W2, W3, H0a, H0b, H1, H2, H3a, H3b]

# interior partitions, per floor
PART_G = [
    (0.6, 9.4, 8.2, 8.55), (0.6, 9.4, 14.2, 14.55), (0.6, 9.4, 21.0, 21.35),
    (31.0, 39.0, 9.25, 9.6), (31.0, 39.0, 12.2, 12.55), (31.0, 39.0, 17.5, 17.85),
    (24.6, 24.95, 9.6, 18.9), (24.95, 30.4, 14.4, 14.75),
]
PART_U = [
    (0.6, 9.4, 8.2, 8.55), (0.6, 9.4, 14.2, 14.55), (0.6, 9.4, 21.0, 21.35),
    (24.6, 24.95, 9.6, 18.9), (24.95, 30.4, 14.4, 14.75),
]

# building footprint outline (union of west wing, central range, east wing)
OUTLINE = [(0, 0), (10, 0), (10, 9), (30.4, 9), (30.4, 0), (39.6, 0),
           (39.6, 25.5), (30.4, 25.5), (30.4, 19.5), (10, 19.5), (10, 25.5),
           (0, 25.5)]

# ---------------------------------------------------------------- rooms
# (id, name, room-type, x0, x1, y0, y1, facing-type overrides, extras)
def R(id, name, typ, x0, x1, y0, y1, ft=None, line=None, note=None, lab=None,
      **extra):
    f = {"N": "enclosed", "E": "enclosed", "S": "enclosed", "W": "enclosed"}
    if ft: f.update(ft)
    d = dict(id=id, name=name, typ=typ, x0=x0, x1=x1, y0=y0, y1=y1,
             ft=f, line=line or {}, note=note or {}, lab=lab or {})
    d.update(extra)
    return d

GROUND = [
    R("GH", "GREAT HALL", "enclosed", 10.0, 24.6, 9.6, 18.9),
    R("ST", "STUDY", "enclosed", 24.95, 30.4, 9.6, 14.4),
    R("BS", "BACK STAIR", "corridor", 24.95, 30.4, 14.75, 18.9),
    R("CP", "CROSS PASSAGE", "corridor", 31.0, 39.0, 9.6, 12.2,
      ft={"E": "corridor", "W": "corridor"}, lab={"S": "below", "E": "above", "W": "above"},
      lone=True, lnudge=0.88),
    R("KI", "KITCHEN", "enclosed", 31.0, 39.0, 0.6, 9.25),
    R("BP", "BUTTERY & PANTRY", "enclosed", 31.0, 39.0, 12.55, 17.5),
    R("SV", "SERVANTS' HALL", "enclosed", 31.0, 39.0, 17.85, 24.9),
    R("DP", "DINING PARLOUR", "enclosed", 0.6, 9.4, 0.6, 8.2),
    R("GS", "GREAT STAIR HALL", "corridor", 0.6, 9.4, 8.55, 14.2,
      lnudgex=0.6),
    R("LI", "LIBRARY", "enclosed", 0.6, 9.4, 14.55, 21.0),
    R("GR", "GARDEN ROOM", "enclosed", 0.6, 9.4, 21.35, 24.9),
    R("EC", "ENTRANCE COURT", "open", 10.0, 30.4, 0.0, 9.0,
      ft={"S": "open"}, line={"S": -20.0},
      note={"N": "hall range front", "E": "east wing front",
            "W": "west wing front", "S": "no wall - ground to far line"}),
    R("PG", "PRIVY GARDEN", "open", 10.0, 30.4, 19.5, 25.05,
      note={"N": "garden wall (built)", "S": "hall range back",
            "E": "east wing flank", "W": "west wing flank"}),
    R("EA", "ENTRANCE APPROACH", "open", 3.8, 35.8, -20.0, 0.0,
      ft={"S": "open", "E": "open", "W": "open"},
      line={"N": 0.0, "S": -20.0, "E": 35.8, "W": 3.8},
      note={"N": "wing fronts; court mouth open at centre (hall front 24.0 m)",
            "S": "no wall", "E": "no wall", "W": "no wall"}),
]

UPPER = [
    R("SO", "SOLAR (GREAT CHAMBER)", "enclosed", 10.0, 24.6, 9.6, 18.9),
    R("MU", "MUNIMENT ROOM", "enclosed", 24.95, 30.4, 9.6, 14.4),
    R("BH", "BACK STAIR HEAD", "corridor", 24.95, 30.4, 14.75, 18.9),
    R("LG", "LONG GALLERY", "corridor", 31.0, 39.0, 0.6, 24.9,
      ft={"N": "corridor", "S": "corridor"}),
    R("MB", "MASTER BEDCHAMBER", "enclosed", 0.6, 9.4, 0.6, 8.2),
    R("SL", "STAIR LANDING", "corridor", 0.6, 9.4, 8.55, 14.2,
      lnudgex=0.6),
    R("GC", "GUEST CHAMBER", "enclosed", 0.6, 9.4, 14.55, 21.0),
    R("CC", "CLOSET CHAMBER", "enclosed", 0.6, 9.4, 21.35, 24.9),
]

# ---------------------------------------------------------------- openings
# (x0,x1,y0,y1, axis, label, from, to)   axis "NS" or "EW"
DOORS_G = [
    (16.5, 18.1, 9.0, 9.6, "NS", "N/S", "Entrance Court", "Great Hall"),
    (30.4, 31.0, 4.0, 5.0, "EW", "E/W", "Entrance Court", "Kitchen"),
    (9.4, 10.0, 4.0, 5.0, "EW", "E/W", "Dining Parlour", "Entrance Court"),
    (9.4, 10.0, 11.0, 12.0, "EW", "E/W", "Great Stair Hall", "Great Hall"),
    (9.4, 10.0, 16.0, 17.0, "EW", "E/W", "Library", "Great Hall"),
    (4.0, 5.0, 8.2, 8.55, "NS", "N/S", "Dining Parlour", "Great Stair Hall"),
    (4.0, 5.0, 14.2, 14.55, "NS", "N/S", "Great Stair Hall", "Library"),
    (4.0, 5.0, 21.0, 21.35, "NS", "N/S", "Library", "Garden Room"),
    (9.4, 10.0, 22.5, 23.5, "EW", "E/W", "Garden Room", "Privy Garden"),
    (21.5, 23.1, 18.9, 19.5, "NS", "N/S", "Great Hall", "Privy Garden"),
    (24.6, 24.95, 16.0, 17.0, "EW", "E/W", "Great Hall", "Back Stair"),
    (30.4, 31.0, 18.0, 18.8, "EW", "E/W", "Back Stair", "Servants' Hall"),
    (30.4, 31.0, 10.4, 11.4, "EW", "E/W", "Study", "Cross Passage"),
    (32.0, 33.0, 9.25, 9.6, "NS", "N/S", "Kitchen", "Cross Passage"),
    (36.5, 37.5, 12.2, 12.55, "NS", "N/S", "Cross Passage", "Buttery & Pantry"),
    (34.5, 35.5, 17.5, 17.85, "NS", "N/S", "Buttery & Pantry", "Servants' Hall"),
    (30.4, 31.0, 21.0, 22.0, "EW", "E/W", "Privy Garden", "Servants' Hall"),
]
DOORS_U = [
    (4.0, 5.0, 8.2, 8.55, "NS", "N/S", "Master Bedchamber", "Stair Landing"),
    (4.0, 5.0, 14.2, 14.55, "NS", "N/S", "Stair Landing", "Guest Chamber"),
    (4.0, 5.0, 21.0, 21.35, "NS", "N/S", "Guest Chamber", "Closet Chamber"),
    (9.4, 10.0, 11.0, 12.0, "EW", "E/W", "Stair Landing", "Solar"),
    (24.6, 24.95, 11.0, 12.0, "EW", "E/W", "Solar", "Muniment Room"),
    (24.6, 24.95, 16.0, 17.0, "EW", "E/W", "Solar", "Back Stair Head"),
    (30.4, 31.0, 16.0, 17.0, "EW", "E/W", "Back Stair Head", "Long Gallery"),
    (30.4, 31.0, 11.0, 12.0, "EW", "E/W", "Solar", "Long Gallery"),
]

# windows: (x0,x1,y0,y1)
WIN_G = [(25.8, 27.2, 9.0, 9.6), (28.1, 29.5, 9.0, 9.6),          # study S
         (11.5, 13.0, 9.0, 9.6), (14.0, 15.5, 9.0, 9.6),          # hall S
         (20.0, 21.5, 9.0, 9.6), (22.5, 24.0, 9.0, 9.6),
         (17.5, 19.0, 18.9, 19.5),                                 # hall N
         (39.0, 39.6, 10.4, 11.4),                                 # passage E
         (33.5, 35.0, 0.0, 0.6), (39.0, 39.6, 3.0, 4.5),           # kitchen
         (2.0, 3.5, 0.0, 0.6), (5.5, 7.0, 0.0, 0.6),               # parlour S
         (0.0, 0.6, 3.0, 4.5),                                     # parlour W
         (0.0, 0.6, 16.0, 17.5), (0.0, 0.6, 18.5, 20.0),           # library W
         (0.0, 0.6, 10.0, 12.5),                                   # stair W
         (2.0, 3.5, 24.9, 25.5),                                   # garden rm N
         (39.0, 39.6, 14.0, 15.5),                                 # buttery E
         (39.0, 39.6, 22.5, 24.0), (33.0, 34.5, 24.9, 25.5)]       # servants
WIN_U = [(25.8, 27.2, 9.0, 9.6), (28.1, 29.5, 9.0, 9.6),
         (11.5, 13.0, 9.0, 9.6), (14.0, 15.5, 9.0, 9.6),
         (20.0, 21.5, 9.0, 9.6), (22.5, 24.0, 9.0, 9.6),
         (17.5, 19.0, 18.9, 19.5), (21.5, 23.0, 18.9, 19.5),
         (2.0, 3.5, 0.0, 0.6), (5.5, 7.0, 0.0, 0.6),
         (0.0, 0.6, 3.0, 4.5), (0.0, 0.6, 10.0, 12.5),
         (0.0, 0.6, 16.0, 17.5), (0.0, 0.6, 18.5, 20.0),
         (2.0, 3.5, 24.9, 25.5),
         (39.0, 39.6, 3.0, 4.5), (39.0, 39.6, 8.0, 9.5),
         (39.0, 39.6, 14.0, 15.5), (39.0, 39.6, 22.5, 24.0),
         (33.0, 34.5, 24.9, 25.5), (33.5, 35.0, 0.0, 0.6),
         (30.4, 31.0, 4.0, 5.5), (30.4, 31.0, 6.5, 8.0),      # gallery W
         (30.4, 31.0, 21.0, 22.5), (30.4, 31.0, 23.0, 24.5),
         (9.4, 10.0, 2.0, 3.2), (9.4, 10.0, 5.5, 6.7),        # master E
         (9.4, 10.0, 22.0, 23.5)]                             # closet E

# fireplaces: (x0,x1,y0,y1) - the hearth breast, projecting into the room
FIRE_G = [(26.6, 28.8, 13.9, 14.4),   # STUDY, north wall  [blueprint 11]
          (12.5, 15.5, 18.3, 18.9),   # great hall, north wall
          (33.5, 36.5, 0.6, 1.4),     # kitchen, great fireplace
          (1.5, 3.5, 7.6, 8.2),       # dining parlour
          (6.0, 8.0, 14.55, 15.15),   # library
          (38.4, 39.0, 20.0, 22.0)]   # servants' hall, east wall stack
FIRE_U = [(26.6, 28.8, 13.9, 14.4),   # muniment room (study stack)
          (12.5, 15.5, 18.3, 18.9),   # solar (great hall stack)
          (1.5, 3.5, 7.6, 8.2),       # master bedchamber (parlour stack)
          (6.0, 8.0, 14.55, 15.15),   # guest chamber (library stack)
          (38.4, 39.0, 20.0, 22.0)]   # long gallery (servants' hall stack)

# stairs: (x0,x1,y0,y1, dir, treads, label)
# (x0,x1,y0,y1, up-direction, treads, label, label x, label y)
STAIR_G = [(1.2, 2.8, 9.2, 14.0, "N", 17, "UP → N", 8.3, 13.5),
           (25.4, 30.0, 15.0, 16.1, "E", 17, "UP → E", 25.95, 18.45)]
STAIR_U = [(1.2, 2.8, 9.2, 14.0, "S", 17, "DN → S", 8.3, 13.5),
           (25.4, 30.0, 15.0, 16.1, "W", 17, "DN → W", 25.95, 18.45)]

K = 0.25          # standpoint stand-back as a fraction of the room dimension


def standpoints(r):
    """Four standpoints per room, and the measured distance to the wall line
    each one views. This is the ONE place camera_wall_m comes from."""
    cx, cy = (r["x0"] + r["x1"]) / 2.0, (r["y0"] + r["y1"]) / 2.0
    w, d = r["x1"] - r["x0"], r["y1"] - r["y0"]
    out = []
    for f in ("N", "E", "S", "W"):
        if f == "N":
            p = (cx, cy - K * d); line = r["line"].get("N", r["y1"]); dist = line - p[1]
            ww = w
        elif f == "S":
            p = (cx, cy + K * d); line = r["line"].get("S", r["y0"]); dist = p[1] - line
            ww = w
        elif f == "E":
            p = (cx - K * w, cy); line = r["line"].get("E", r["x1"]); dist = line - p[0]
            ww = d
        else:
            p = (cx + K * w, cy); line = r["line"].get("W", r["x0"]); dist = p[0] - line
            ww = d
        out.append(dict(f=f, p=p, dist=dist, ftype=r["ft"][f], wall_w=ww,
                        line=line, note=r["note"].get(f, "")))
    return out


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


def build(name, title, sub, rooms, parts, doors, wins, fires, stairs,
          gw, y0, y1, W, H, stars=(), extra_notes=()):
    b = Board(-1.0, 40.6, y0, y1, 40, 104, W, H)
    b.o.append('<rect x="0" y="0" width="%d" height="%d" fill="#ffffff"/>' % (W, H))
    b.ptext(40, 40, title, 25, weight="bold")
    b.ptext(40, 62, sub, 11.5, fill="#4a443c")
    b.ptext(40, 80, "holo-emitter row 12 - overhead plan, DRAFT for redline. "
            "Drawn at 26 px per metre; use the scale bar. All room dimensions "
            "are clear internal metres.", 10, fill="#6b6257")
    b.pline(40, 90, W - 40, 90, stroke="#2b2620", stroke_width="1.6")
    rows = draw_floor(b, rooms, parts, doors, wins, fires, stairs, gw)
    for (sx, sy) in stars:
        b.text(sx, sy, "\u2605", size=15, fill=C_DOOR, weight="bold", dy=5)
    ph = b.my + (y1 - y0) * S
    b.pline(40, ph + 26, W - 40, ph + 26, stroke="#2b2620", stroke_width="1")
    scalebar(b, 40, ph + 62)
    northarrow(b, 40 + 10 * S + 90, ph + 72)
    legend(b, 40 + 10 * S + 190, ph + 50, [
        ("h", "SYMBOLS"),
        ({"fill": C_EXT}, "exterior / structural wall, 0.60 m"),
        ({"fill": C_INT, "stroke": "#3a352e", "stroke-width": "0.8"},
         "interior partition, 0.35 m"),
        ({"fill": C_GW, "stroke": "#2b2620", "stroke-width": "2"},
         "garden wall (built structure), 0.45 m"),
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
    rg, pg = build("manor-ground.svg".replace(".svg", ""),
                   "MANOR PLAN - GROUND FLOOR & GROUNDS",
                   "c.1660 English manor, hall-and-cross-wings (H-plan). "
                   "North at top.",
                   GROUND, PART_G, DOORS_G, WIN_G, FIRE_G, STAIR_G, True,
                   -21.0, 26.5, 1520, 1620, stars=[(30.05, 11.62)],
                   extra_notes=[
    "\u2605  door1 - the existing M0 exit. STUDY east wall <-> CROSS PASSAGE west "
    "wall, which is world.json's 'hall'. Blueprint 11's study wall map holds as "
    "drawn: fireplace N, door E, leaded windows S, blank paneling W.",
    "Blueprint 11's hall wall map holds too - shelf/paneling N, tapestry S, "
    "leaded window at the E end - but the manor gives the passage two further "
    "openings (N to the buttery, S to the kitchen) that map does not draw. "
    "Flagged for Kabe in the README.",
    "Every interior opening on this sheet joins two named spaces, and every space "
    "is reachable on foot from the ENTRANCE APPROACH (checked by the drawing "
    "script, both floors, stairs included)."])
    ru, pu = build("manor-upper", "MANOR PLAN - UPPER FLOOR",
                   "Same footprint and scale as the ground floor artboard. "
                   "North at top.",
                   UPPER, PART_U, DOORS_U, WIN_U, FIRE_U, STAIR_U, False,
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
    # ---- self-checks: tiling, overlaps, reachability
    problems = []
    for fl, rooms, doors in (("ground", GROUND, DOORS_G), ("upper", UPPER, DOORS_U)):
        idx = [r for r in rooms if r["typ"] != "open"] if fl == "ground" else rooms
        for i, a in enumerate(idx):
            for c in idx[i + 1:]:
                ox = min(a["x1"], c["x1"]) - max(a["x0"], c["x0"])
                oy = min(a["y1"], c["y1"]) - max(a["y0"], c["y0"])
                if ox > 1e-9 and oy > 1e-9:
                    problems.append("%s: %s overlaps %s" % (fl, a["name"], c["name"]))
        names = set(r["name"].title().replace("'S", "'s") for r in rooms)
        adj = {}
        for (x0, x1, y0, y1, ax, lab, A, B) in doors:
            adj.setdefault(A, set()).add(B); adj.setdefault(B, set()).add(A)
        if fl == "ground":
            adj.setdefault("Great Stair Hall", set()).add("Stair Landing")
            adj.setdefault("Back Stair", set()).add("Back Stair Head")
            adj.setdefault("Entrance Approach", set()).add("Entrance Court")
            adj.setdefault("Entrance Court", set()).add("Entrance Approach")
    # global reachability across both floors
    adj = {}
    for (x0, x1, y0, y1, ax, lab, A, B) in DOORS_G + DOORS_U:
        adj.setdefault(A, set()).add(B); adj.setdefault(B, set()).add(A)
    for A, B in (("Great Stair Hall", "Stair Landing"),
                 ("Back Stair", "Back Stair Head"),
                 ("Entrance Approach", "Entrance Court")):
        adj.setdefault(A, set()).add(B); adj.setdefault(B, set()).add(A)
    seen, stack = set(), ["Entrance Approach"]
    while stack:
        n = stack.pop()
        if n in seen: continue
        seen.add(n)
        stack.extend(adj.get(n, ()))
    want = set()
    for r in GROUND + UPPER:
        nm = r["name"].title().replace("'S", "'s")
        nm = {"Solar (Great Chamber)": "Solar"}.get(nm, nm)
        want.add(nm)
    missing = sorted(w for w in want if w not in seen)
    stray = sorted(s for s in seen if s not in want)
    if missing: problems.append("unreachable: %s" % missing)
    if stray: problems.append("door names not matching a room: %s" % stray)
    # tiling: interior area of each wing/range must equal the sum of its rooms
    def area(rs): return sum((r["x1"] - r["x0"]) * (r["y1"] - r["y0"]) for r in rs)
    for fl, rooms, parts in (("ground", GROUND, PART_G), ("upper", UPPER, PART_U)):
        rs = [r for r in rooms if r["typ"] != "open"]
        gross = 8.8 * 24.3 + 8.0 * 24.3 + 20.4 * 9.3
        pa = sum((p[1] - p[0]) * (p[3] - p[2]) for p in parts)
        if abs(area(rs) + pa - gross) > 1e-6:
            problems.append("%s: rooms+partitions %.4f != interior gross %.4f"
                            % (fl, area(rs) + pa, gross))
    print("SELF-CHECK:", "OK" if not problems else problems)


if __name__ == "__main__":
    main()
