# What lens a Myst-like renders interiors at — research, and a number

**[AI, research]** Commissioned to ground one decision: what horizontal field of view this
project's fixed 1536×1024 frame should render interiors at, so that *"a room looks like nothing
but a room."* Kabe's framing: *"whats the standard here, we dont need to reinvent effective
perspective to a human theres enough historical sources and screenshots to analyze the expected
presentation."*

Nothing here is a ruling. It is evidence and a recommendation, and it decides nothing that
blueprint §5 has kept open.

---

## 0. The answer, first

**Set `focal_mm` to 24. Pin the LENS instead of the SCALE.**

| | value |
|---|---|
| focal length | **24 mm** on the 36×24 mm format the frame already is |
| focal length in pixels | **1024 px** — exactly the frame height |
| horizontal FOV | **73.7°** |
| vertical FOV | **53.1°** |
| diagonal FOV | 84.1° |
| edge stretch | 1.25× · corner stretch 1.35× |
| derived scale | `px_per_m_at_wall = 1024 / camera_wall_m` (no longer pinned at 96) |

**24 mm is not the comfortable middle of the general evidence. It is the
architectural-photography *ceiling*, spent deliberately — because this manor's rooms are too
small for the comfortable middle to be reachable at all.** §8.2 proves that with the study's own
metres: at 35 mm you would have to stand 5.30 m from the study's north wall to see it, in a room
4.80 m deep. The natural register is not narrowly missed here; it is geometrically unavailable.

**And the genre agrees, measurably.** The one place a Myst-like's *interior* render camera
survives in readable form is Presto Studios' own released source for The Journeyman Project:
Pegasus Prime — `kTanFieldOfView = 0.7082373180482f`, commented *"From globe room models"*, over
a 512×256 view. That is **70.6° horizontal / 39.0° vertical — a 25.4 mm lens** (§9.2), and its
design value is a hand-set round 19.5° half-vertical. So:

```
  70.6°  Presto's measured interior camera (25.4 mm)  ─┐
                                                        ├─ the answer is in here
  73.7°  architectural photography's stated ceiling ────┘  (24-25 mm)
  74.2°  what this study's own wall requires
```

**A three-degree window where the genre's only measured interior camera, the architectural
trade's hard limit, and this building's own geometry all coincide.** 24 mm is recommended over
Presto's 25.4 mm only because the study needs the last 3.6° to close on its corners.

Band, if Kabe wants a knob: **65°–74° hFOV (24–28 mm)**, forced by the building rather than
chosen by taste. Below 65° the study cannot show its own wall from anywhere inside itself.
Above ~79° you enter the region where the trades' audiences demonstrably complain.

Two riders, both mechanism-carrying and both cheap:

1. **Get the downward reach from a lens SHIFT, not from the −8° pitch.** `horizon_y` already
   *is* a lens shift, `groundplane.js` already implements it, and pitch is modelled by nothing
   in this project. Archviz, architectural photography and Kubrick's own camera operator all
   independently say the same thing, and one of them measured it (§7).
2. **The standpoint rule and the lens are one decision, not two.** `standpoint_stand_back` 0.25
   stands the camera close, which is *why* the answer is forced to the ceiling. Moving it is
   the only way to buy back a narrower lens (§8.6).

---

## 1. Craft verdict — how settled is this, and how far can inference be trusted?

**Settled — unusually so — and the consensus is correct. But the baseline was wrong in two
specific and expensive ways, and both are ways this project already fell.**

- **The number is settled, across six unrelated lineages.** Vision science, classical drafting,
  photographic optics, architectural photography, archviz practice, and cinematography all
  place "natural" interior presentation at roughly **40–55° hFOV**, a defensible coverage
  ceiling at **~75°**, and reliable rejection past **~90°**. These camps do not read each
  other. Two of them have *experiments* behind them (§5). This is about as settled as a
  perceptual craft question gets, and Kabe's instinct — that it needn't be reinvented — is
  right.
- **Wrong way #1: I asked "what FOV?" and never asked "FOV of what, held fixed against what?"**
  A camera has three independent knobs — lens, shift, standpoint — and this project currently
  has *none* of them, because it pins a scale. Picking a better single number cannot fix a
  design that has no lens (§8.1).
- **Wrong way #2: I assumed the game-industry FOV convention was evidence.** It is not. The
  90–106° PC convention is traceable to a single 1993 constant in DOOM's source and has **no
  perceptual basis whatever** (§5.4). Inheriting it would have been the most natural mistake
  available, and every serious source says so.

**On the genre's own number, the answer came out in two halves.** Myst, Riven and Myst III
genuinely have no single value — the frames are flat blits with no camera data (`engines/mohawk`
has no FOV constant at all), and Myst III's is per-node script data. But the *engines* of the
surrounding family do carry constants, and they cluster: Presto's interior camera at 70.6°,
QuickTime VR's default at ~68° vertical, ZVision's Zork Nemesis at 78.4° horizontal, PhoenixVR's
Amerzone at 90°. **The genre sits 70–90°, wider than archviz, and its narrow edge is exactly
where archviz's ceiling is** (§9.4). That overlap is the answer.

**Craft-heaviness: medium-high.** Not obscure — but documented in six vocabularies that do not
cite each other, and the loudest available answer (the game convention) is the wrong one.

---

## 2. The baseline, pre-registered before any search

Written before the first query, so "research counts only above the floor" is checkable rather
than asserted. **[D]** directional · **[S]** specified (carries a mechanism) · **[C]** calibrated.

| # | claim | tag | verdict |
|---|---|---|---|
| B1 | Photographic "normal" is 50 mm on 36×24: hFOV 39.6°, vFOV 27.0°, diag 46.8°; naturalness = a print viewed at ~the focal length subtends the scene's own angle | [C] | **Confirmed, and the reasoning I gave was the folk version.** Banks's lab says the photography texts' explanations are "either vague or merely restatements of the phenomenon." The real rule is `d_COP = f·m` (§5.1) |
| B2 | Zero-distortion FOV = the angle the screen subtends at the eye (~46-48° for a 24" at 60 cm) | [S] | **Confirmed and measured**: 24" @ 60 cm = **47.8°**. Nearly exact |
| B3 | Console ~65-75°, PC 90-106°, Quake-era 90° at 4:3 | [C] | **Confirmed as convention, demolished as evidence** (§5.4) |
| B4 | Edge stretch 1/cos θ; 1.41× at 90°; objectionable somewhere 90-100° | [C] | **Confirmed to the decimal** — 1.40× ⇔ 88.8° hFOV — but **incomplete**: a flat frontoparallel wall takes *zero* stretch (§4.3). That omission matters more than the number |
| B5 | Archviz shoots interiors 24-35 mm, 24 mm the "don't go wider" line | [D] | **Beaten → [C]**, and the guess was exactly right: 24 mm FF is the stated hard ceiling in architectural photography (§5.5) |
| B6 | Myst-likes sit wider than normal, narrower than FPS; guess 55-75° | [D] | **Direction right, premise wrong** — the genre has no single value; it is per-shot (§9) |
| B7 | Fixed frame ⇒ choose for the worst case | [S] | **Confirmed and made the deciding argument** (§8.2) |
| B8 | A pinned scale is not a lens | [S] | **Confirmed, and became the whole answer** |
| B9 | vFOV matters more than hFOV for "room-ness" | [D] | **Wrong.** The binding vertical constraint is the *floor line*, set by shift as much as by FOV (§8.4) |
| B10 | At 3:2 an hFOV borrowed from Myst's 4:3 under-delivers vertically | [D] | **Confirmed and made exact** — Riven's frames are 1.551, essentially this project's 1.5 (§9.1) |

**What the baseline could not have contained:** that the frame is *exactly* the 36×24 format so
focal lengths transfer with no conversion (§4.1); that a 5%-detectable-distortion threshold
derives 36° FOV and a 54 mm lens from first principles (§5.1); that Cyan's own engine ships 45°
and its own players call it unplayable (§6.1); that the correct instrument for "looking down"
is shift, with a *measured* precedent (§7); and that pinning the lens dissolves three of
`projection.md` §0's open questions at once (§8.5).

---

## 3. Where the knowledge lives — named practitioners, venues, lineage

| lineage | who / what | venue | worth |
|---|---|---|---|
| **Vision science** | **Martin Banks's lab, Berkeley** — Vishwanath, Girshick & Banks 2005; Cooper, Piazza & Banks 2012; Vangorp et al. 2013 | *Nature Neuroscience*, *J. Vision*, *ACM TOG* | **Highest.** The only *experiments* in the domain. §5.1-5.3 |
| **Classical perspective** | The **60° cone of vision** — David Chelsea, Proko, drafting pedagogy | — | Predates photography; owes nothing to any other camp |
| **Graphics theory** | **Zorin & Barr**, SIGGRAPH 1995 | cims.nyu.edu | The impossibility theorem: straight lines *or* round spheres, never both |
| **Cyan, source code** | **Plasma** engine (realMyst → Uru → Myst V), open-sourced as `H-uru/Plasma` | GitHub | A shipped default from the studio that invented the genre. §6.1 |
| **Cyan, products** | Obduction, Myst 2021, Firmament, Riven 2024 | PCGamingWiki API | Cyan's modern answer and its documented failure mode. §6.2 |
| **Presto Studios, own source** | **The Journeyman Project: Pegasus Prime** — Presto released their source; ScummVM's `pegasus` engine carries `Copyright (C) 1995-1997 Presto Studios, Inc.` on every file | GitHub | **The single best genre datum in existence** — an *interior* render camera as a literal constant. §9.2 |
| **Presto Studios** | Myst III: Exile, via ScummVM's `myst3` engine | GitHub | Proves FOV was authored **per shot**. §9.3 |
| **Presto Studios, testimony** | **David Sieks**, "Artist's View", Dec/Jan 1995 (Buried in Time); **Greg Uhler**, Feb 1998 (Legacy of Time) and Oct 2001 (Myst III); **Michael Saladino**, Dec 2002 | *Game Developer* magazine, via archive.org | Method rather than numbers — but the method is the finding. §9.2 |
| **Apple** | QuickTime VR panorama format — `VRMakePano.c` sample; QTFF spec pp. 289-292 | developer.apple.com archive | The default-FOV *rule*, verified against real movie files. §9.4 |
| **Other node engines** | ZVision (Zork Nemesis, Grand Inquisitor); PhoenixVR (Amerzone 1999, Dracula); Tetraedge (Amerzone 2011); Bagel (The Space Bar) | ScummVM, GitHub | Four more exact constants, from independent studios. §9.4 |
| **Riven reconstruction** | **The Starry Expanse Project** — Stuart Attenborrow, "Everett" | starryexpanse.com | The only people who have *solved* Riven's cameras. Unpublished. §10 |
| **Cyan, testimony** | **Rand Miller** on the original method | Time Extension | *"we could curate every shot and pick the exact angle"* |
| **Archviz, vendor** | **Chaos** (V-Ray / Enscape) | blog.chaos.com | "The 90° default is wrong; use 24 mm tilt-shift." §5.5 |
| **Architectural photography** | **Usman Dawood** (Architectural Photography Almanac); Mike Kelley; Larry Lohrman (PFRE) | — | The hard ceiling, and the complaint threshold above it. §5.5 |
| **Cinematography** | **Roger Deakins**; **Gordon Willis**; **Garrett Brown** (Steadicam, *The Shining*); **David Mullen ASC** | rogerdeakins.com forums, *American Cinematographer* | The neutral register, and the level-camera finding. §5.6, §7 |
| **Game convention** | id Software 1993 source; PCGamingWiki glossary | GitHub, pcgamingwiki.com | Vocabulary and mechanism — **not** evidence. §5.4 |

**Lineage cautions — recorded because uncoordinated agreement is the whole point:**

- **Kingslake, Ray, Belt, Modrak & Anthes, London et al. are ONE citation chain**, not five
  sources, and Banks's lab dismisses their reasoning outright. Do not count them separately.
- **Cooper/Piazza/Banks 2012 (*J. Vision*) and Banks/Cooper/Piazza 2014 (*Ecological
  Psychology*) are the same paper republished.** One source.
- **Most modern graphics work on this question descends from one lab** (Banks, Berkeley) —
  Vangorp 2013, Lai 2021 and Shih 2019 all cite back to Vishwanath 2005 and/or Cooper 2012.
  Weight the cluster as *one strong lineage*, not four.
- **PCGamingWiki's and Wikipedia's console/PC FOV bands are the same uncited folk claim.** Not
  corroboration of each other.
- **Cyan's Plasma constant (§6.1) and the realMyst players' complaint (§6.3) are the same
  number from the code side and the player side.** Counted as one finding with two faces.

---

## 4. Vocabulary, defined

- **hFOV / vFOV / dFOV** — horizontal, vertical, diagonal. *Which axis a number refers to is the
  single largest source of error in this literature.* PCGamingWiki: horizontal "is by far the
  more common way." Myst III's engine is horizontal (§9.3); Cyan's Plasma (§6.1), QuickTime VR
  and ZVision all store **vertical**. Presto's Pegasus stores a tangent (§9.2). Always convert
  before comparing — half the apparent disagreement in this domain is axis confusion.
- **Hor+ / Vert−** — how FOV responds to aspect. *Hor+* fixes vertical and widens horizontally;
  *Vert−* fixes horizontal and loses vertical. `H = 2·arctan(tan(V/2)·w/h)`. Plasma is Hor+.
  4:3 @ 90° → 16:9 @ **106.26°** — that is where "106" comes from.
- **rFOV vs tFOV** (PCGamingWiki) — *rendered* FOV versus the *true* FOV the physical screen
  subtends. "Geometry will appear distorted if there is a mismatch." §4.2.
- **COP — centre of projection.** The point where the eye must sit for a picture to cast the
  same retinal image as the scene. `d_COP = f · m` (focal length × magnification).
- **Normal lens** — focal length equal to the frame diagonal: 43.3 mm on 36×24.
- **Cone of vision** — classical drafting's 60° cone; outside it a construction reads
  "distorted... fuzzy and indistinct."
- **Lens shift / tilt-shift / two-point perspective** — moving the frame relative to the optical
  axis *without rotating the camera*, so verticals stay parallel. This project already has it:
  it is `horizon_y`.
- **Three-point perspective / keystoning** — what rotating gets you: converging verticals, walls
  that "look like [they] may be sloping."
- **Camera matching** (Starry Expanse) — recovering position, rotation and **lens angle** from a
  rendered frame. Seven variables.
- **Lens angle** — Softimage/Blender's word for FOV. *Searching this instead of "FOV" is what
  opened the Starry Expanse methodology.*
- **Edge stretch / marginal distortion** — the 1/cos θ off-axis magnification of rectilinear
  projection. Not a lens flaw; a property of projecting onto a plane.
- **Local slant compensation** — the mechanism by which viewers correct for looking at a picture
  from the side (works to |45°|) but *not* for looking at it from the wrong distance (fails).

### 4.1 The fact that makes everything transfer cleanly

**1536 × 1024 is 3:2. So is 36 × 24 mm.** The frame is *exactly* the 35 mm still format in
proportion. Therefore:

```
focal_px = focal_mm × 1536 / 36 = focal_mm × 42.667
hFOV = 2·atan(18 / focal_mm)      vFOV = 2·atan(12 / focal_mm)
```

Every focal length in the photographic, archviz and cinematography literature transfers with
**no crop-factor conversion at all**. So `focal_mm` in blueprint §10 is already the right unit;
a prompt sheet can say "24 mm lens" and be understood by an archviz artist, an architectural
photographer and an image generator alike; and the entire external literature is directly
usable rather than approximately usable.

### 4.2 The mechanism, and the numbers behind it

PCGamingWiki states it cleanly:

> "If user sets in-game horizontal FOV to value of 90°, game engine renders geometry according
> to the assumption that the user is facing left/right edges of the screen at a 45° angle...
> the cause of visible distortions is a mismatch between engine assumption of the user's
> position and user's actual position relative to the display."

The actual screen geometry (computed, `FOV = 2·atan(size / 2·distance)`):

| setup | hFOV |
|---|---|
| 24" @ 60 cm | **47.8°** |
| 27" @ 60 cm | 53.0° |
| 27" @ 80 cm | 41.0° |
| a 1536-px canvas not filling a 27" @ 60 cm | ~33° |
| 55" TV @ 10 ft | 22.6° |

**For 90° hFOV to be geometrically correct you would have to sit 26.6 cm from a 24" monitor.**
Nobody renders at the correct FOV; the question is only how far past it to go. This project at
24 mm overruns by roughly 1.5–2.2×, which is ordinary. The study *today*, at **131.5°**,
overruns by 3–4× — and that is why the shipped placeholder reads as a canyon rather than a
study.

### 4.3 The correction to my own baseline that matters most

Edge stretch is `1/cos θ` radially, area `1/cos³θ` — **but only for off-axis three-dimensional
objects.** A **flat frontoparallel surface takes no distortion at all**: rectilinear projection
maps a wall parallel to the image plane with perfectly uniform magnification.

For this project that is decisive and favourable. A node's backdrop is largely *the viewed
wall, frontoparallel* — which is undistorted at any FOV — plus wedges of receding side wall and
a few objects, which are where the whole stretch penalty lands. **This manor can afford more
width than a scene full of people or foreground furniture could.** David Mullen ASC states the
same trade from the opposite side: *"are there people on the edge of frame or architecture? If
architecture, then barrel distortion will be more distracting than rectilinear correction. If
people, the opposite may be true."* — which is Zorin & Barr's impossibility theorem reached
independently by a working cinematographer.

---

## 5. What beat the baseline — the evidence, by lineage

### 5.1 The strongest single citation: a distortion threshold turned into an FOV

**Vishwanath, Girshick & Banks (2005), *Nature Neuroscience* 8:1401–1410**
[10.1038/nn1553](https://doi.org/10.1038/nn1553) · free: https://pmc.ncbi.nlm.nih.gov/articles/PMC2727473/

> *"Assuming that a 5% deviation from the correct aspect ratio is readily detectable, we can
> determine what field of view yields deviations of this magnitude... the value of S_local
> yielding a deviation of 5% is 18°. To ensure that S_local is not larger than 18°, θ must be
> **36° or smaller**. Then for w = 35 mm and θ = 36°, **f = 54 mm**, which is quite close to the
> recommended 49–53 mm."*

**Why this beats the baseline:** it is not a rule of thumb but a *transfer function* — give it a
detectability threshold and it returns an FOV. My B1 asserted 50 mm was "normal"; this derives
54 mm from a stated perceptual threshold. **Flag the assumption:** the 5% figure is *stated*,
not measured, in that paper.

The same paper measured the off-axis tolerance (n=6, viewing angles −45° to +45°): *"perceived
shape was nearly invariant across a wide range of viewing angles"*, breaking down only beyond
|45°|, via **local slant compensation**. So pictures survive being looked at from the side —
but, per §5.2, not from the wrong distance.

### 5.2 The key experiment: viewers do not compensate for distance, and picture size rules

**Cooper, Piazza & Banks (2012), *Journal of Vision* 12(5):8**
[10.1167/12.5.8](https://doi.org/10.1167/12.5.8) · http://www.emilyacooper.org/pubs/2012CooperPiazza_JOV.pdf

- Formalises the rule photography texts only gesture at: **`d_COP = f · m`**. "If the viewer's
  eye is positioned at the picture's COP, the image cast by the picture onto the retina matches
  the image that would be cast by the original scene."
- *Experiment 1* (n=5, bite bar): observers **do not compensate** for viewing from the wrong
  distance. Wrong distance → wrong perceived 3D structure, directly.
- *Experiment 2* (n=8 + 11; focal lengths 22–160 mm; prints 6×4 cm to 100×67 cm; 136 trials
  each): **focal length had essentially no effect on preferred viewing distance** (regression
  slope 0.1 against the 614% required to track the COP). **Picture size determined everything.**
- The regression: **`d_pref ≈ 1.3 × picture diagonal + 25 cm`** (restated by Vangorp et al.
  2013). The 25 cm intercept "is the same as the nearest comfortable viewing distance."
- *"Subjects were not establishing a constant field of view; rather, they preferred a small
  field (~22°) with small prints and a larger field (~36°) with large prints."*
- Recommended focal length `f_rec = 55 + 1096/l_p` → *"for prints 35 cm or larger, the
  recommended focal length is ~50 mm."*
- Reality check: **3,930 Flickr SLR photos, median 35 mm-equivalent focal length = 68 mm** —
  *longer* than the 50 mm rule.

**The cost this imposes on us, stated plainly.** Applying `d_pref` to this frame: shown at a
35 cm diagonal, a viewer sits ~70 cm away and the frame subtends **27.9° diagonal**. We render
84.1° diagonal at 24 mm. The mismatch is **3.0×** — and Experiment 1 says it will *not* be
compensated, so the rooms will read as deeper and more expansive than their metres. This is the
mechanism behind archviz's "makes rooms look significantly larger than reality."

**But no achievable value removes it**: at 35 mm the mismatch is 2.3×, at 50 mm still 1.7×, and
matching it exactly would need ~85 mm — which cannot show a room at all. **The mismatch is
inherent to depicting interiors on screens.** It is uniform across all 88 facings, so it costs
consistency nothing. Record it; do not chase it.

### 5.3 The measured acceptability threshold

**Vangorp, Richardt, Cooper, Chaurasia, Banks & Drettakis (2013), *ACM TOG* 32(4):58**
[10.1145/2461912.2461971](https://doi.org/10.1145/2461912.2461971)

n=6, ~7.5 hours each, 3,072 measurements per person; façades with **90° convex corners** at
eccentricities ±7.1° and ±32.0°; rating 1–5 from "perfect" to "no way!". Fitted acceptability:
`rating(α) = 2.05 + 0.12·(α−93°)` above 93°, `2.05 − 0.08·(α−93°)` below.

**At their working threshold, a 90° corner is acceptable when *perceived* as ~81°–101° — a
tolerance of about −9°/+11°.** Observers landed *between* full and no compensation, drifting
toward uncompensated for deeper façades.

This is the closest thing that exists to a measured "when does architecture look wrong," and it
is about *corners in rooms* — the exact stimulus this project renders.

### 5.4 The game convention is not evidence — primary-source demolition

The 90–106° PC convention descends from one 1993 constant. Read directly from id Software's
released source, not quoted second-hand:

```c
// DOOM — linuxdoom-1.10/tables.h
#define FINEANGLES      8192

// DOOM — linuxdoom-1.10/r_main.c
// Fineangles in the SCREENWIDTH wide window.
#define FIELDOFVIEW     2048
    // Calc focallength
    //  so FIELDOFVIEW angles covers SCREENWIDTH.
    focallength = FixedDiv (centerxfrac,
                            finetangent[FINEANGLES/4+FIELDOFVIEW/2] );

// Quake — WinQuake/screen.c
cvar_t scr_fov = {"fov","90"};  // 10 - 170
    r_refdef.fov_x = scr_fov.value;
    r_refdef.fov_y = CalcFov (r_refdef.fov_x, ...);   // vertical DERIVED -> literally Vert-

// Quake III — cg_main.c :  cg_fov "90"   cg_zoomfov "22.5"
```

**2048 / 8192 × 360° = exactly 90.0°**, and the comments settle the axis: it is *horizontal*,
"covers SCREENWIDTH." Every PC-shooter FOV number in circulation is a descendant of that line.

PCGamingWiki's console-55-75 / PC-85-110 page is `{{cleanup}}`-tagged, cites **no research**,
and its only citations for the couch-distance rationale are two YouTube videos. Wikipedia
repeats the same uncited claim. **No GDC talk states FOV numbers** — Nesky's "50 Camera
Mistakes" (GDC 2014) is entirely qualitative. And modern console practice contradicts the band
anyway (CoD MW II ships a console slider defaulting to 80).

**Conclusion: the loudest number in the domain has no perceptual pedigree. Do not inherit it.**
This is the single most useful negative finding in the file, because 90° is exactly what a
reasonable engineer would have picked.

**And the motion-sickness literature does not transfer.** Fernandes & Feiner (2016) define
their FOV restrictor's rate as a function of angular velocity and speed, and state that for "a
virtually stationary participant... no part of the circular cutout occludes any of the VE" —
the intervention goes to *zero* with zero self-motion. (Their SSQ result is also **null**,
p=0.370; the significant effect was in-session discomfort.) Every VIMS paradigm requires
continuous optic flow. Draper et al. 2001 and Bos et al. 2010 disagree even on the *sign* of
the FOV-comfort effect. **A fixed node still has no motion, so none of this applies** — which
also means the Obduction and realMyst discomfort reports (§6.3) transfer only as *perceptual*
verdicts on the static image, not as comfort claims.

### 5.5 Architecture and archviz — the ceiling, named **[transferred: archviz / arch. photography]**

- **Chaos (V-Ray / Enscape), vendor guidance:** *"24mm (Tilt-Shift) which is a 67 degree FOV in
  Enscape"* — against a default of *"14.5mm which is a 90 degree FOV."* Professional
  architectural photographers avoid wider lenses because they *"tend to distort the image,
  making a scene look less realistic."* 115° is named as a single-project exception. Chaos also
  gives the two-point rule: it keeps *"vertical lines perfectly vertical,"* without which walls
  *"look like [they] may be sloping or not vertical."*
- **Usman Dawood, Architectural Photography Almanac:** *"I highly recommend against shooting
  with any lens wider than **24mm on a full-frame camera or 15mm on an APS-C camera**."* (The
  two are internally consistent — 15 mm APS-C = 22.5 mm FF — so this is a real boundary, not a
  slogan.) His own practice starts around 45 mm.
- **Render Infinity, the commissioning brief:** *"In professional archviz commissioning, 'send
  us a 35 mm shot of the living room' is the standard camera brief."* 24 mm for "a room where
  the brief requires showing the full layout in one shot"; 50 mm for hero/detail. Camera height
  **1500–1800 mm** standing, **1600 mm** residential standard. And: *"Keep the camera body
  perfectly level at all times. Move the camera up or down by adjusting its Z position, never
  by rotating the X axis."*
- **Larry Lohrman, Photography For Real Estate:** complaints rise below ~22 mm (79° hFOV);
  16 mm (97°) draws *"cartoon like."*
- **Classical drafting:** the 60° cone of vision — "anything that lays inside the cone will be
  seen as perfectly normal, while anything outside of the cone will be distorted." As a
  *circular* cone that means diagonal ≤ 60°, i.e. a 38–40 mm lens.

**Beats the baseline:** B5 guessed 24-35 mm with 24 mm as the limit. That guess was right, but
research supplies what a guess cannot — that 24 mm is a *stated ceiling* from a named
practitioner with a self-consistent cross-format check, that the archviz default (90°) is
considered wrong *by the vendor*, and **tilt-shift** as the named discipline (§7).

### 5.6 Cinematography — the neutral register **[transferred: film]**

Three independent derivations of the "neutral" lens land together:

- **Roger Deakins**, asked for a single prime on Super 35: *"I would have said a 32mm."* His
  workhorses: *"A 35mm or a 32mm, yes, but I also use a 40mm and a 50mm regularly."* →
  **32–35 mm S35 = 42.5°–39.1° hFOV**.
- **Neil Oseman**, deriving from the format diagonal, independently arrives at 32 mm on S35.
- **Gordon Willis**, *The Godfather*: a 40 mm on 35 mm Academy = **30.7° hFOV**, i.e. 1.47×
  *longer* than normal, chosen because it *"produced a natural-looking picture that would not
  rob any attention from the story."*

**The format trap, recorded because it invalidates most secondary writing:** "18 mm" means
opposite things. 18 mm full-frame = **90.0° hFOV** (genuinely wide); 18 mm Super 35 = **69.3°**
(unremarkable). Always state the format. The transferable version: *wide/uneasy begins around
80–90° hFOV; neutral sits around 35–50° hFOV.*

---

## 6. The genre's own numbers

### 6.1 Cyan's own engine: 45° horizontal, 33.75° vertical

`H-uru/Plasma` — Cyan Worlds' engine, the lineage from realMyst through Uru to Myst V. The
default camera, in **two independent places**:

```cpp
// Sources/Plasma/FeatureLib/pfCamera/plVirtualCamNeu.cpp
float plVirtualCam1::fFOVw        = 45.0f;
float plVirtualCam1::fFOVh        = 33.75f;
float plVirtualCam1::fAspectRatio = 4.f/3.f;

// Sources/Plasma/FeatureLib/pfCamera/plCameraModifier.cpp
plCameraModifier1::plCameraModifier1()
    : fBrain(), fSubObj(), fFOVw(45.0f), fFOVh(33.75f), ...
```

Aspect behaviour is **Hor+** (`SetAspectRatio` → `SetFOV`, rescaling `tan(w/2)` by
`aspect/(4/3)`). Ported to 3:2 by Cyan's own rule, 45° at 4:3 becomes **50.0° hFOV — a 38.6 mm
lens**. Two further facts from the same source:

- FOV is authored **per camera** in 3ds Max (`plCameraComponents.cpp` reads `theCam->GetFOV(Now)`).
  The 45° is a *fallback*, not a house style.
- Cyan shipped a console command `Camera.SetFOV "float x, float y"` — *"Set the field of view
  for all cameras."*

**Beats the baseline hard:** B6 guessed the genre sat at 55-75°. The studio that created the
genre ships **50°** at this aspect — narrower than my entire guessed range.

### 6.2 Cyan's modern products

From PCGamingWiki (site 403s plain fetches; **its API is open** — see §10):

| game | year | engine | FOV |
|---|---|---|---|
| Obduction | 2016 | UE4 | slider **90–120°**, default **90°** |
| Myst | 2021 | UE4 | slider **75–120°**, **default 90°** |
| Firmament | 2023 | UE | slider **75–120°** |
| Riven | 2024 | UE5 | slider **75–120°** |
| realMyst | 2000 | Plasma | not exposed; hackable via `game_init.dat` in `sho.dni` |
| Myst III / IV / V | 2001-05 | Presto / Plasma | **not adjustable** — node-based |

Note the drift: Obduction's slider *floor* was 90°; every Cyan title since lowered it to 75°.
The studio widened its range downward, three products running.

**But read the 90° carefully — it is weaker evidence than it looks.** 90° is Unreal's own
`UCameraComponent::FieldOfView` default, and Epic's 90° descends from id's (§5.4). So Cyan's
modern default is not a choice Cyan made to match the 1997 stills; it is a default they did not
change. What looks like three independent studios converging on 90° is **one 1993 constant
inherited twice.** The *downward* drift of the slider floor — 90 → 75 — is the part that
carries information, because that one they actually changed.

### 6.3 The paid-for negative results — both edges, both from discomfort

**Too wide.** PCGamingWiki's Obduction page carries an *Issues fixed → Motion sickness* section:
*"The game can cause motion sickness due to its default field of view (FOV) and frame timing."*
Documented fix: *"Set the in-game FOV to the minimum available... If the FOV resets to 90, use
the Universal Unreal Engine 4 Unlocker to force a lower value via the console, e.g. `fov 75` or
`fov 70`."*

**Too narrow.** GOG's "realMyst FOV?" thread. *MinigunFiend*: *"The FOV must be something like
40, and I can't play for longer than five minutes without getting a headache and nausea"* —
calling the default *"absolutely god-awful."* *Imonobor* and *Namur* corroborate, and note the
game *"seems to change the FOV in different areas"* — exactly what Plasma's per-camera
authoring predicts.

**The convergence is the point.** Players guessing "something like 40" from the screen, and
`fFOVw = 45.0f` in the source, are the same number reached from opposite directions:

```
  45-50°   Cyan Plasma default ......... documented as headache-inducing
  65-74°   ← forced band for this manor (§8.2)
  90°      Cyan modern default ......... documented as nausea-inducing; fix is 70-75
```

**Caveat, per §5.4:** both complaints come from free-roam mouse-look games. The *comfort*
argument does not transfer to a still. What transfers is the perceptual verdict on the image:
45° reads as binoculars, 90° reads as stretched.

---

## 7. Pitch versus shift — resolved, with a measured precedent

Blueprint §10 rules the generation camera at eye **1.83 m with −8° pitch** [HUMAN, 2026-08-20:
*"we should be a bit higher as a view angle looking down at about a 6ft height"*].
`projection.md` §7 records that **nothing in this project models pitch** — `groundplane.js` has
no pitch term and adding one moves every shipped pixel.

Four independent voices say the pitch is the wrong instrument:

- **Chaos:** two-point perspective keeps *"vertical lines perfectly vertical"*; the named remedy
  when you must look down is **tilt-shift**.
- **Render Infinity:** *"Keep the camera body perfectly level at all times... never by rotating
  the X axis."*
- **Mike Kelley** (architectural photographer) shoots *"nearly 85% of his pictures"* on a 24 mm
  tilt-shift — shift, never tilt.
- **Garrett Brown**, Steadicam operator on Kubrick's *The Shining*, in *American Cinematographer*
  — and this one is a **test result**, not a preference:

> *"Since he wished to use wide lenses, in particular the Cooke 18mm, he used the capability of
> the Steadicam to rapidly boom up and down **to avoid distorting the sets**... rather than
> tilting and **risking the keystoning of the verticals**."*
> *"**We determined by testing** that the 9.8mm Kinoptik looked best, and that the ideal lens
> height was about 24″... **The distortion was negligible when the camera was held level
> fore-and-aft.**"*

A **9.8 mm Kinoptik on Academy is 96.5° hFOV** — wider than anything contemplated here — and it
read as acceptable *because the axis was held level.* **Keeping the camera level buys back a
great deal of width, and it is free.** That is the highest-leverage single move available to
this project, and it costs no code.

**And this project already has the shift.** `horizon_y` is the eye line's position in frame; a
`horizon_y` ≠ 0.5 under a level camera *is* a vertical lens shift, and §5's camera-has-feet
gate is already written in those terms. The authored 0.48 is a 2% downward shift.

| | −8° pitch | lens shift |
|---|---|---|
| modelled by this project | **no** — §7 says so | **yes** — `horizon_y` |
| verticals | converge (three-point, keystoned) | parallel (two-point) |
| moves shipped pixels | every one | only via `horizon_y` |
| magnitude at f=1024 px | horizon down **144 px** (14% of frame) | `horizon_y` 0.45 = 51 px (5%) |

**Recommendation:** express *"looking down at about a 6ft height"* as **eye 1.83 m +
`horizon_y` ≈ 0.45**, and retire the −8° pitch. Same intent, parallel verticals, zero new code.
A proposal for Kabe — §10's contract camera is [HUMAN].

---

## 8. The recommendation, with its arithmetic

### 8.1 Why "pin the lens" is the whole answer

`px_per_m_at_wall` is pinned at 96 and the standpoint distance runs 1.95 m → 26.75 m. Implied
focal length is `px_per_m_at_wall × camera_wall_m`, so **the lens is a function of room depth**:

| facing | focal px | hFOV | lens |
|---|---|---|---|
| CROSS PASSAGE/N | 187 | **152.6°** | 4 mm |
| STUDY/N | 346 | **131.5°** | 8 mm |
| GREAT HALL/N | 669 | 97.9° | 16 mm |
| GREAT HALL/E | 1051 | 72.3° | 25 mm |
| LONG GALLERY/N | 1749 | 47.4° | 41 mm |
| ENTRANCE COURT/S | 2014 | 41.7° | 47 mm |

**The manor is currently shot on eleven different lenses spanning a factor of 11, from a 4 mm
fisheye to a 47 mm normal.** Blueprint §5 already says this — *"It is not a 50 mm lens... a
133° horizontal field of view"* — and `projection.md` §6 records the factor of 11. The
contribution here is the diagnosis: *that is what pinning a scale means*, and it is the reason
a room does not look like a room.

The premise underneath is "the viewed wall should fill the frame." Kill it. Here is what that
premise actually demands:

| facing | standpoint | wall | hFOV needed to fit the wall |
|---|---|---|---|
| CROSS PASSAGE/E | 6.00 m | 2.60 m | 24.5° |
| LONG GALLERY/N | 18.22 m | 8.00 m | 24.8° |
| GREAT HALL/E | 10.95 m | 9.30 m | 46.0° |
| STUDY/E | 4.09 m | 4.80 m | 60.8° |
| STUDY/N | 3.60 m | 5.45 m | 74.2° |
| GREAT HALL/N | 6.97 m | 14.60 m | 92.6° |
| LONG GALLERY/E | 6.00 m | 24.30 m | 127.4° |
| CROSS PASSAGE/N | 1.95 m | 8.00 m | **128.0°** |

**24.5° to 128.0°.** No lens satisfies it, none ever could, and the requirement is not even
true to life — standing 1.95 m from an 8 m wall, a person does not see the whole wall either.
**The premise is the bug.**

### 8.2 Why the answer is forced to 65–74°, and why 24 mm within it

**The deciding computation.** Take the criterion *"a room reads as a room when you can see the
viewed wall meet its two corners."* For the study — the M0 room, the one that must read first —
5.45 m wide and only **4.80 m deep**:

| lens | hFOV | standpoint needed to see the whole 5.45 m wall | possible in a 4.80 m room? |
|---|---|---|---|
| 50 mm | 39.6° | 7.57 m | **impossible** |
| 43 mm | 45.4° | 6.51 m | **impossible** |
| 35 mm | 54.4° | 5.30 m | **impossible** |
| 28 mm | 65.5° | 4.24 m | possible — camera 0.56 m from the back wall |
| 24 mm | 73.7° | 3.64 m | comfortable |

**The natural register — everything from Vishwanath's 36° through the cinematographers' 39-45°
to archviz's 35 mm — cannot be used in this manor.** Not narrowly missed: geometrically
unavailable. Required hFOV for the study's north wall:

- standing hard against the opposite wall (4.80 m): **59.2°**
- with realistic 0.5 m clearance (4.30 m): **64.7°**
- at the approved standpoint rule, 0.75 × depth (3.60 m): **74.2°**

So the band is **65°–74°**, set by the building, and where in it you land is set by the
standpoint rule. At the *approved* rule, the answer is 74.2° — and 24 mm delivers **73.7°**.

**Five further arguments land on the same value:**

1. **The genre's only measured interior camera is 3.1° away.** Presto Studios' own released
   source puts their Norad Delta *room* camera at **70.6° hFOV / 25.4 mm** (§9.2), taken "from
   globe room models" — the same models the pre-rendered art was made from. Nothing in this
   research is closer to the actual question, and it corroborates rather than contradicts:
   Presto 70.6°, archviz ceiling 73.7°, this study's requirement 74.2°.
2. **It is the stated ceiling, not an overrun.** Usman Dawood's "never wider than 24 mm on full
   frame" is exactly 73.7°. We are spending the ceiling, not exceeding it — and one notch wider
   (22 mm, 79°) is where real-estate clients begin to complain.
3. **The standpoint rule points here on its own.** With `camera_wall_m = 0.75 × depth`, the FOV
   that exactly frames the viewed wall of a **square** room is `2·atan(1/1.5) = 67.4°`; of a 4:3
   room, 83.2°. The manor's rooms run square to 2:1, so the rule's intrinsic band is 67°–83°.
4. **The subject is architecture, not people.** Per §4.3 the frontoparallel far wall takes zero
   stretch, and per Mullen architecture punishes *curvature* rather than rectilinear stretch.
   An empty room can spend width a peopled frame could not.
5. **It is a nameable lens.** Because the frame is exactly 36×24 (§4.1), "24 mm" is exact.
   Row 4's prompt sheets get their camera brief in one line: *"24 mm lens, camera level, eye
   height 1.83 m."*

**Where this criterion could be rejected — stated because it is mine, not the sources'.** If
Kabe decides a room may read as a room *without* both corners in frame — which is what real
vision does — then 28 mm or even 35 mm become live, the pictures move toward the natural
register, and the cost is that most facings show a wall rather than a room. That is a taste
call, and it is the one genuine fork in this document.

### 8.3 What it costs, against every boundary the research found

| hFOV | edge stretch | lens (FF) | what it is |
|---|---|---|---|
| 36° | 1.05× | 54 mm | **Vishwanath's 5%-detectable ceiling** (derivation) |
| 39.6° | 1.06× | 50 mm | photographic "normal" convention |
| 41–53° | 1.07–1.12× | 37–48 mm | **true geometry of a desk monitor** |
| 45.4° | 1.08× | 43 mm | normal = frame diagonal |
| 50° | 1.09× | 38.6 mm | **Cyan's Plasma default at 3:2** — players call it too narrow |
| 54.4° | 1.12× | 35 mm | archviz standard brief · **unreachable in the study** |
| 57.8° | 1.14× | 32.6 mm | QuickTime VR **cubic** default (45° vertical) |
| **65.5°** | **1.19×** | **28 mm** | **conservative end of the forced band** |
| **70.6°** | **1.23×** | **25.4 mm** | **Presto's measured interior room camera** |
| **73.7°** | **1.25×** | **24 mm** | **recommended · architectural photography's stated ceiling** |
| 74.2° | 1.25× | 23.9 mm | what the study's own north wall requires |
| 78.4° | 1.29× | 22.2 mm | Zork Nemesis (ZVision) |
| 79° | 1.30× | 22 mm | real-estate complaint onset |
| 83.9° | 1.34× | 20 mm | QuickTime VR cylindrical default (68° vertical) |
| ~89° | 1.40× | 18 mm | rejection line (arithmetic + convergence) |
| 90° | 1.41× | 18 mm | **id Software 1993 — no perceptual basis**; Cyan's modern default |
| 96–100° | 1.50× | 16 mm | "cartoon like"; 80–92% reject in Lai et al.'s user study |
| **131.5°** | **2.46×** | **8 mm** | **the study today** |

Corner stretch at 24 mm is 1.35×, against **2.88× today**.

### 8.4 What each facing then shows

At 24 mm, eye 1.83 m, `horizon_y` 0.45 (5% downward shift), level camera:

| facing | standpoint | wall | wall in frame | far wall's foot? | ceiling line? |
|---|---|---|---|---|---|
| CROSS PASSAGE/N | 1.95 | 8.00 | 37% | **no** | no |
| GARDEN ROOM/N | 2.66 | 8.80 | 45% | **no** | yes |
| BACK STAIR/N | 3.11 | 5.45 | 86% | **no** | yes |
| STUDY/N | 3.60 | 5.45 | **99%** | yes | yes |
| STUDY/E | 4.09 | 4.80 | 100% | yes | yes |
| LIBRARY/N | 4.84 | 8.80 | 82% | yes | yes |
| DINING PARLOUR/N | 5.70 | 8.80 | 97% | yes | yes |
| CROSS PASSAGE/E | 6.00 | 2.60 | 100% | yes | yes |
| KITCHEN/N | 6.49 | 8.00 | 100% | yes | yes |
| GREAT HALL/N | 6.97 | 14.60 | 72% | yes | no |
| GREAT HALL/E | 10.95 | 9.30 | 100% | yes | yes |
| LONG GALLERY/N | 18.22 | 8.00 | 100% | yes | yes |

**The study's north view shows its entire wall, corner to corner, with both the floor line and
the ceiling line in frame.** That is what "a room looks like nothing but a room" means here.

### 8.5 What pinning the lens dissolves

Three of `projection.md` §0's open questions stop being questions:

- **§0 Q9 — "the implied lens is not constant."** Constant by construction.
- **§0 Q8 — "the floor cut is not at your feet on most facings."** Under a pinned lens the
  nearest floor in frame is `eye / tan(bottom-edge angle)` — **identical on every facing**
  (3.33 m at 24 mm with `horizon_y` 0.45). Fifteen anomalies become one number to rule on.
- **§0 Q4 — the wide-view trigger, and §5's `fits` vs `ruling` fork.** Both readings exist only
  to stop wide walls being clipped by a pinned scale. With a pinned lens there is no fitting
  and no clipping: a 24.30 m wall seen from 6.00 m simply extends past the frame, as in life.
  **`WIDE_VIEW_POLICIES` and its ten-facing disagreement can be deleted entirely.**

### 8.6 The residue — honestly

**This changes the look, and Kabe must see it before it is adopted.**

| study/N | today (pinned scale) | 24 mm |
|---|---|---|
| focal | 346 px (8 mm, 131.5°) | 1024 px (24 mm, 73.7°) |
| `px_per_m_at_wall` | 96 | **284.4** |
| the 5.45 m wall spans | 523 px — **34% of frame width** | 1550 px — **the whole frame** |
| `floor_line_y` | 0.652 → 35% of frame is floor | 0.958 → **4% of frame is floor** |

The generous foreground floor in the shipped placeholder is a **fisheye artifact**. A real lens
at this standpoint sees mostly wall. If Kabe wants the Riven quality the intention names —
*"rails cut by the frame bottom at your own feet"* — the levers, cheapest first:

1. **More shift.** `horizon_y` 0.42 puts the nearest floor at 3.16 m; 0.31 puts it at 2.66 m and
   gives the study ~18% floor. Costs ceiling headroom. Free, and keeps verticals parallel.
2. **Stand further back — the strong lever, and the one coupled to the lens.**
   `standpoint_stand_back` 0.25 is why three facings show no floor at all, *and* why the lens is
   forced to the ceiling. Viewing the study's north wall from **4.30 m** instead of 3.60 m gives,
   at 24 mm, the whole wall *plus both corners plus side wall* and ~12% floor — or lets 28 mm do
   the job instead. **The standpoint rule is costing more room-read than the lens is.** It is on
   the approved drawing, so it is Kabe's.
3. **A wider lens.** 20 mm gives 13% floor — at 1.47× corner stretch, past the ceiling, and
   into the complaint region. Not recommended.

**Two mismatches to flag rather than bury:**

- **Sprites do not stretch.** Entities are drawn as flat sprites at `u` positions. A real 24 mm
  lens elongates an off-axis object by up to 1.35×; a pasted sprite will not. Render Infinity
  names this exact failure ("chair legs widen at the base"). `chair1` sits at 1.20 m depth and
  37.2° off axis. Row 4's prompt sheets are where that is matched or ignored deliberately.
- **The rooms will read larger than their metres** (§5.2), by a factor no reachable lens
  removes. Uniform across all 88 facings, so it costs consistency nothing.

---

## 9. What Myst and Riven measurably did

### 9.1 Riven — the frames, and why the lens is not recoverable from them

- **608 × 392 pixels, 256 colours**; over 4,000 rendered scenes plus ~1,000 QuickTime movies;
  rendered in **Alias** on 13 SGI Indigo workstations, some frames over an hour each; islands
  ~2.5 M triangles. (Myst Journey, *Riven Behind the Scenes*.)
- **Aspect 1.551 — essentially this project's 1.5.** Any framing borrowed from Riven transfers
  almost exactly. This is the useful half of B10.
- Myst (1993): **StrataVision 3D** on Macintosh Quadras, ~2,500 rendered images; Robyn Miller
  and Chuck Carter.
- **Riven ships no camera metadata.** The frames are flat blits; the cameras lived only in
  Cyan's Alias scene files. The FOV is recoverable only by photogrammetry — see §10.

### 9.2 The measured anchor: Presto's own interior render camera

**This is the single most valuable finding in the file** — the one number Kabe asked for, from a
Myst-like's *interior*, in the developer's own code rather than inferred from a screenshot.

Presto Studios released the source to **The Journeyman Project: Pegasus Prime**. ScummVM's
`pegasus` engine carries `Copyright (C) 1995-1997 Presto Studios, Inc.` on every file. In the
Norad Delta globe room:

```c
// engines/pegasus/neighborhood/norad/delta/globegame.cpp
// From globe room models
static const GlobeGame::Point3D kCameraLocation = { 0.53f, 4.4f, -0.86f };
static const GlobeGame::Point3D kGlobeCenter    = { -31.5f, 8.0f, 0.0f };
static const float kGlobeRadius          = 8.25f;
static const float kTanFieldOfView       = 0.7082373180482f;
static const float kPicturePlaneDistance = 10.0f; // Completely arbitrary.

// h, v in [0, 511][0, 255]   -- the 512x256 navigation window
void GlobeGame::screenPointTo3DPoint(int16 h, int16 v, Point3D &pt) {
    pt.x = kCameraLocation.x - kPicturePlaneDistance;
    pt.y = kCameraLocation.y + (128 - v) * kPicturePlaneDistance * kTanFieldOfView / 256;
    pt.z = kCameraLocation.z + (h - 256) * kPicturePlaneDistance * kTanFieldOfView / 256;
}
```

Over the 512×256 window this is exact:

| | |
|---|---|
| half-horizontal | `atan(0.7082373180482)` = 35.3075° |
| **horizontal FOV** | **70.615°** |
| half-vertical | `atan(0.7082373180482 / 2)` = **19.500004°** |
| **vertical FOV** | **39.000°** |
| **35 mm equivalent** | **25.4 mm** |
| on this project's 3:2 frame | f = **1084 px** |

**Two things make this a real datum rather than an arbitrary game constant.**

1. The comment **`// From globe room models`**. These constants were taken from the 3D model the
   pre-rendered art was made from, because the game ray-casts screen clicks onto the globe *as
   drawn in Presto's imagery*. If the FOV were wrong, clicking would miss. **It is therefore
   Presto's actual render camera for an interior room.**
2. The half-vertical solves to **19.500004°** — a hand-set round number, not a fitted residue.
   Presto chose "39° vertical" deliberately.

A second, weaker Presto number sits in the Mars sequence — and it is instructive about the
difference between an authored camera and a shipped one:

```c
// engines/pegasus/neighborhood/mars/spacechase3d.h
// This is approximately right for a field of view of 72 degrees
// (Should be set to the tangent of FOV).
//static const float kTangentFOV = 0.76254;
static const float kTangentFOV = 1.0;
```

The commented value is 74.65° hFOV; the **shipped** value 1.0 is 90.0°. For an arcade chase they
took the wide default; for the *room*, they used 70.6°.

**What Presto said about method, in a real venue.** No one at Presto ever published a focal
length, but two statements in *Game Developer* magazine describe the discipline:

- **David Sieks, "Artist's View", Dec/Jan 1995** (Buried in Time): *"The first step was finding
  an actual video camera lens that would match the perspective of the rendered environments."*
  **The CG camera was the fixed reference and the physical lens was fitted to it** — the reverse
  of the direction one would assume, and a direct precedent for pinning a lens and building to it.
- **Greg Uhler, Feb 1998** (Legacy of Time): *"We took screen shots of the view from within a
  node and tried to match this in Electric Image. The nodes had distortion and correction which
  was difficult to match in 3D. However, after a few days of experimentation, we were able to
  match the view from the node."* — camera matching, by hand, days per view.

**And a correction to the brief's premise, measured rather than assumed.** Legacy of Time does
**not** use QuickTime VR: the demo ISO contains **SmoothMove** (Infinite Pictures) — chunk tags
`IPSM`/`BTMP`/`HSPT`, `.PAX`/`.PAD` files, `SMSeq.dll` — and no QTVR atoms at all. Its node
panoramas are **1536 × 768 equirectangular JPEGs** (2:1 = a full 360°×180° sphere), i.e.
**4.267 px per degree**: a 70° view samples ~299 source pixels. Like QTVR, SmoothMove calls FOV
"Zoom" (`SetViewZoom(double, long, DisplayType)`).

### 9.3 Myst III — FOV was set **per shot**, by script

From ScummVM's `myst3` engine (formerly ResidualVM's Presto engine):

```cpp
// engines/myst3/script.cpp
OP(163, cameraSetFOV, "e");
void Script::cameraSetFOV(Context &c, const Opcode &cmd) {
    int32 fov = _vm->_state->valueOrVarValue(cmd.args[0]);
    _vm->_state->setLookAtFOV(fov);
}

// engines/myst3/gfx.cpp — fov is HORIZONTAL
float aspectRatio = kOriginalWidth / (float) kFrameHeight;   // 640/360 = 1.778
float xmaxValue = nearClipPlane * tan(fov * M_PI / 360.0);
float ymaxValue = xmaxValue / aspectRatio;

// engines/myst3/gfx.h
static const int kOriginalWidth  = 640;
static const int kOriginalHeight = 480;
static const int kFrameHeight    = 360;   // the live view is 16:9 inside a 4:3 screen
```

**There is no default FOV constant in the engine at all** — `lookatFOV` initialises to 0 and is
set entirely from the game's own scripts. Presto authored the field of view **per node**. The
same is true of Cyan's Plasma (§6.1), and realMyst's players observed it *"chang[ing] the FOV in
different areas."*

Rand Miller, on the original Riven's method: *"we could curate every shot and pick the exact
angle."*

### 9.4 The wider family — every exact constant found, from independent studios

Each of these is a literal in a shipped engine, not a claim about one. Full angles, degrees;
35 mm-equivalent on a 36 mm frame.

| game / engine | the constant, verbatim | vFOV | hFOV | ≈ lens |
|---|---|---|---|---|
| **Journeyman Project: Pegasus Prime** (Presto) — *interior room* | `kTanFieldOfView = 0.7082373180482f` over 512×256 | **39.0** | **70.6** | **25.4 mm** |
| Journeyman — Mars chase, *shipped* | `kTangentFOV = 1.0` | – | 90.0 | 18 mm |
| Journeyman — Mars chase, *commented* | `//kTangentFOV = 0.76254` | – | 74.7 | 23.6 mm |
| **QuickTime VR** cylindrical, Apple's rule | `defaultFieldOfView = (myTheta*2) * .8` on a typical 85° tilt range | **68.0** | 83.9 @4:3 | 20 mm |
| QuickTime VR 1.0 | `defZoom = 1.5 * myTheta` (75% of range) | 63.8 | 79.3 @4:3 | 21.7 mm |
| QuickTime VR **cubic** | `defaultFieldOfView = 45.0f` (min 5, max 90/120) | 45.0 | 57.8 @4:3 | 32.6 mm |
| **Zork Nemesis** (ZVision, 512×320) | `verticalFOV = deg2rad(27.0f)` — a *half*-angle, via `cylinderRadius = (_halfHeight+0.5f)/tan(verticalFOV)` | 54.0 | 78.4 | 22.1 mm |
| Zork Grand Inquisitor (ZVision, 640×344) | same constant | 54.0 | 86.9 | 19.0 mm |
| **Amerzone 1999**, Dracula: Resurrection, Cameron Files (PhoenixVR) | `_fov(kPi2)`; `gx = tanf(fov/2), gy = gx*h/w` | 73.7 | **90.0** | 18 mm |
| Amerzone 2011 remake (Tetraedge) | `float fov = 60.0f; //TODO: ("HD") ? 60.0f : 45.0f` | 60.0 / 45.0 | 75.2 / 57.8 @4:3 | 23.4 / 32.6 mm |
| The Space Bar (Bagel) | `#define DEF_FOV (360 / (12.8/3))` | – | 84.4 | 19.9 mm |
| Cyan Plasma (§6.1) | `fFOVw(45.0f), fFOVh(33.75f)` | 33.75 | 45.0 | 43.5 mm |
| any cubemap node's *face* render | — | 90.0 | 90.0 | 18 mm |

**Apple's QTVR rule, verified against real files rather than trusted.** The QTFF spec (pp.
289-292) stores `minFieldOfView` / `maxFieldOfView` / `defaultFieldOfView` as Float32 degrees,
**vertical** — horizontal is never stored, the player derives it from window aspect (Hor+, same
convention as Plasma). Apple's own `VRMakePano.c` sets `defaultFieldOfView` to **80%** of the
full vertical range. Parsing the `pdat` atoms of five real QTVR movies off archive.org gives
`defFOV/maxFOV` of exactly **0.800000** in two unrelated third-party files, and
`maxFieldOfView == maxTilt − minTilt` exactly in all five. The rule is real.

**Clean negatives, worth as much as the positives:** `engines/mohawk` (Myst, Riven) and
`engines/mtropolis` (Obsidian) contain **no FOV constant at all** — flat 2D still-image engines
with no reprojection. The FOV is baked into the artwork and is not in the code to be found.
Rhem's manual confirms 90°/180° turns and four cardinal facings but states no FOV. VCruise
(Reah, Schizm) has `kNumDirections = 8` — 45° yaw steps — and no FOV constant.

**One lineage warning that changes a reading in §6.2.** Myst (2021) and Riven (2024) default to
**90°, which is Unreal's own `UCameraComponent::FieldOfView` default.** That is not evidence
Cyan chose 90° to match the 1997 stills — it is evidence they did not change Epic's default. And
Epic's 90° descends from id's (§5.4). What looked like three independent 90°s is **one constant
inherited twice.**

### 9.5 So what did the genre "do"? — the honest answer

**Two answers, and they do not conflict.**

*As practice:* "whichever this shot wants." Myst, Riven and Myst III varied it per view, by
hand — Rand Miller's *"we could curate every shot"*, Myst III's `cameraSetFOV` opcode, Uhler's
days of matching one node in Electric Image.

*As numbers:* the family's engine constants cluster tightly, at **70–90° horizontal**, and the
narrow end of that cluster is where the careful work sits. Presto's *interior* camera is 70.6°;
QTVR's default is ~68° vertical; Zork Nemesis is 78.4°; the 90°s are all either arcade sequences
or inherited engine defaults (§9.4).

**The genre's band is 70–90°. Architecture's band is 54–74°. They overlap at 70–74°, and that
overlap is where both Presto's measured room camera and this project's own geometry land.**

That cuts three specific ways here:

- **It does not license varying the lens in this project.** Cyan and Presto varied it *by hand*,
  per shot, with an art director's eye, in worlds with no floor plan and no derived meta. This
  project generates eighty-eight facings from a plan. A varying lens without a hand on it is
  precisely the current bug (§8.1).
- **The genre runs wider than the trades, and knows why.** Node navigation rewards width —
  more room covered per node, fewer nodes, turns that stitch. Interior credibility rewards
  narrowness. The genre's answer to that tension, where it was authored rather than inherited,
  is ~70°.
- **Presto's method transfers even where their number would not.** Sieks: the CG camera was the
  fixed reference and the *lens was fitted to it*. That is precisely "pin the lens, build to it."
- **Consistency is this project's substitute for art direction.** One lens across eighty-eight
  facings is what makes a manor feel like one building. Cyan bought coherence with four years of
  hand-curated shots; a pinned lens is how you buy it from a plan.

---

## 10. Routes — recorded while open, including the dead ends

**Worked, and how.**

| route | the way in that worked | what it taught |
|---|---|---|
| **PCGamingWiki** | site 403s all plain fetches; **its MediaWiki API is wide open**: `curl "https://www.pcgamingwiki.com/w/api.php?action=parse&page=PAGE&prop=wikitext&format=json"` | Every FOV row in §6.2, plus Obduction's motion-sickness section |
| **ScummVM / H-uru / id source** | `curl raw.githubusercontent.com/...`; `gh api -X GET search/code -f q='TERM repo:OWNER/REPO'` (gh is authenticated and has network) | §5.4, §6.1, §9.2 — the only *exact* numbers in this file |
| **Paywalled papers** | `api.crossref.org/works/<doi>` and Europe PMC return abstracts where publishers Cloudflare-block; author-hosted PDFs (emilyacooper.org) carry clean text layers | The whole of §5.1-5.3 |
| **`r.jina.ai` proxy** | `curl "https://r.jina.ai/<url>"` returns 200 on 403ing sites (theasc.com, PCGW) | Cinematography primary sources |
| **Wikipedia media** | `api.php?action=query&prop=imageinfo&iiprop=url` resolves `File:` pages to fetchable URLs | Genre frames for the measurement attempt |
| **Released studio source inside ScummVM** | ScummVM re-licenses donated source and keeps the original notice — `grep` for `Copyright (C) ... Studios` finds it. `engines/pegasus` is **Presto's own 1995-97 code** | §9.2, the best datum in the file. *Look for the studio's copyright line before assuming an engine is a clean-room reimplementation.* |
| **Parsing shipped game data directly** | `curl` a demo ISO from `archive.org/download/<id>/<file>`, then brute-scan for chunk tags | Legacy of Time uses **SmoothMove, not QTVR**; its node panoramas are 1536×768 equirectangular |
| **QTVR movie atoms** | `curl` a `.mov`, brute-scan for `pdat`, read Float32-BE at atom offset +32 | Verified Apple's 80%-of-range default FOV rule against five real files (§9.4) |
| **Trade magazines** | `archive.org/advancedsearch.php` for `collection:game_developer_magazine`, download each `*_djvu.txt`, grep locally (the full-text search endpoints are unreachable) | The Sieks and Uhler quotes in §9.2 |
| **Vocabulary pivot** | searching **"lens angle"** rather than "FOV" | Opened the entire Starry Expanse camera-matching methodology |
| **Vocabulary pivot 2** | QTVR and SmoothMove both call field of view **"Zoom"** (`defZoom`, `SetViewZoom`) | Searching "fov" alone misses the entire panoramic-node generation |

**Dead ends, with reasons, so they are not re-walked.**

- **Measuring FOV off an original Myst/Riven frame.** Attempted. Downloaded genuine Riven frames
  from Starry Expanse (`boiler-overlay.jpg` 930×598, `ytramcaveexit.jpg` 677×436 — both at
  Riven's 1.55 aspect) plus Wikipedia's Journeyman Project and Myst III frames. **It is
  under-determined, and here is why**, so nobody tries again: a single image of a bare
  rectangular room yields the room's width and height *in units of eye height*, but the focal
  length cancels — every feature on the far wall sits at the same depth. Recovering focal length
  needs either (a) two vanishing points from an oblique view of known-orthogonal walls
  (`f² = −(V₁−P)·(V₂−P)`), or (b) a known metric length at a **second** depth. Riven's world is
  organic rock and curved metal with few reliable orthogonal pairs; the Journeyman frame renders
  its view into a small HUD-inset viewport; available images are 380-930 px, below useful
  line-fitting precision. Feasible only with native-resolution oblique *interior* frames and a
  real line detector (this environment has numpy + PIL only — no OpenCV, no scipy).
- **Starry Expanse's solved cameras.** They *have* the numbers — structure-from-motion recovered
  "all of the original camera positions," and their posts say lens angle is one of the seven
  solved variables and that "getting this value exactly right is imperative." **They have never
  published them.** Their forum closed Feb 2019 (members moved to Discord); no public repo
  carries camera data. **This is the single highest-value unopened door in the domain** — one
  message to that Discord would likely produce Riven's actual solved lens angles.
- **Myst III's actual FOV values.** Script-driven, so they live in the game's `.m3u` data, not in
  any source file. Recoverable only from an installed copy.
- **realMyst's default FOV.** In `game_init.dat` inside the `sho.dni` archive (per user *Namur*);
  needs the game and Dragon UnPACKer. The forum's own estimate — "something like 40" — matches
  Plasma's 45° closely enough that the exact value would change nothing.
- **Cyan artists on lens choice.** Searched Rand Miller, Robyn Miller, Chuck Carter, Richard
  Watson (RAWA), Josh Staub, and the *Riven Behind the Scenes* / *From Myst to Riven* material.
  Plenty on software, render times and triangle counts; **nothing on camera or lens.** It
  appears never to have been asked in public.
- **Photographic optics primary texts** (Kingslake; Ray, *Applied Photographic Optics*).
  Archive.org copies are lending-restricted; `_djvu.txt` is a stub. **Cite Cooper et al. Eq. 2
  for `d_COP = f·m` instead** — peer-reviewed and formally stated.
- **GDC.** No talk states FOV numbers. Nesky's "50 Camera Mistakes" (GDC 2014) is qualitative
  throughout. WSGF's FOV article is a 2008 stub with zero degree values. `wsgf.org` 403s.
- **No Presto FOV or lens number is published anywhere in prose.** Exhausted: all 702 archived
  `prestostudios.com` URLs; 296 issues of *Game Developer* grepped locally; Adventure Classic
  Gaming, Adventure Gamers, Digital Antiquarian, HG101, MobyGames; Phil Saunders' site (404) and
  ArtStation; Victor Navone's blog. **No postmortem exists for Pegasus Prime or JP1.** The
  number in §9.2 came from their code, which is why it exists at all.
- **A seductive false positive, retracted rather than buried.** Presto's commented
  `0.76254` → 74.65° hFOV matches ScummVM's QTVR initialiser `56 × 4/3 = 74.67°` to 0.02°,
  which looks like Presto hardcoding the QuickTime VR default. **It is coincidence.** ScummVM's
  56° is itself an uncited 2025 initialiser (commit `c4ac20265`), immediately overwritten at node
  load by `setFOV(hdr.defZoom)`, and has no Apple provenance — searches for QTVR + "56 degrees"
  return nothing, and *Inside Macintosh: QuickTime VR*'s "57 degrees" is just 180/π. Do not cite
  56°, and do not rebuild this bridge.
- **Actual `angle()` literals from Zork Nemesis / ZGI script data** are unpublished. Note that
  Marisa-Chan/Zengine and ducalex/Zorkmid both show `pana_angle = 60.0`, but **Zorkmid is a C
  port of Zengine — one lineage** — and 60 in that formula yields a nonsensical ~140° hFOV, so
  it is always script-overwritten. Do not cite 60.
- **ffmpeg, libquicktime and GStreamer have no QTVR panorama parsing at all** (`pdat`, `pano`,
  `STpn`, `qtvr`, `vrsc`, `pHdr` → zero hits). FreePV is the one unexhausted independent viewer.
- **The claim that "reducing FOV from 140° to 90° cut SSQ by X."** No source. Lin et al. 2002
  gives direction and an asymptote above 140° but no delta; Fernandes & Feiner 2016's SSQ
  comparison is explicitly null (p=0.370). That framing is unsupported.

---

## 11. Where the sources contradict each other

**Disagreement 1 — the real one. Vision science and classical drafting say ≤ 36–60°.
Architecture says 24 mm / 73.7°.** Independent camps, and neither is wrong:

- The **perception/drafting** camp assumes you can choose the picture's angular subtense to
  match the construction. Under that condition, exceeding it genuinely does look wrong, and
  Vishwanath derives the number rather than asserting it.
- The **architecture** camp photographs rooms that physically cannot be backed out of, for
  viewers on screens much smaller than the scene. They exceed the cone knowingly and pay in
  corner stretch, because the alternative is a photograph of a wall.

**This project is in the architecture condition, and §8.2 proves it is not a preference: the
natural register is geometrically unreachable inside a 4.80 m room.** Follow architecture, and
record that the classical 60° cone is being overrun by 24° of diagonal, deliberately, at a
corner-stretch cost of 1.35×.

**Disagreement 2 — the genre runs wider than the trades, and both are right.** Node engines
cluster at **70–90°**; architecture and archviz cap at **54–74°**. The mechanism is not taste:
node navigation is *paid for* in width — more of the room covered per node, fewer nodes to
author, turns that stitch together — whereas an architectural still has no navigation to serve
and spends its whole budget on credibility. **This project has node navigation but pre-rendered
stills, so it sits in both camps at once, and the honest answer is the overlap: 70–74°.** That
the genre's one *authored interior* camera (70.6°) sits at the bottom of the genre band rather
than its middle is the tell — where Presto was making a room rather than a corridor to move
through, they came down to meet the trades.

**Disagreement 3 — Draper et al. (2001) vs Bos et al. (2010)** disagree on the *sign* of the
FOV/comfort effect (Draper found a U-shape around 1.0× image scale; Bos found *more* sickness
when internal and external FOV were congruent). Genuinely independent, genuinely unresolved —
and per §5.4 irrelevant to a still image. Do not present "match FOV to screen geometry for
comfort" as settled.

**Two apparent conflicts that are not conflicts:**

- **Cyan's 45° vs Cyan's 90°.** Fifteen years and a change of camera model apart — hand-authored
  per-shot versus mouse-look free-roam default. Both documented as uncomfortable at their
  extremes, so they bracket rather than contradict.
- **Console 55-75° vs PC 85-110°.** Same putative rule, different screen distance — except §5.4
  shows neither is grounded, and desk geometry (41-53°) is nowhere near either. The conventions
  are the outlier, not the data.

---

## 12. What this asks of Kabe

Five things, each a number rather than a worry, none of them changeable by an agent:

1. **`focal_mm`: 50 → 24**, and `px_per_m_at_wall` derived as `1024 / camera_wall_m` rather than
   pinned at 96. (Blueprint §5's open field-of-view question, answered with evidence.)
2. **The look changes** — the study's wall goes from 34% of frame width to the whole frame, its
   floor from 35% of frame height to 4%. §8.6. This needs an eye, not an argument.
3. **Pitch → shift.** Re-express §10's −8° as `horizon_y` ≈ 0.45. §7. This one has a *test
   result* behind it, not just practice.
4. **`standpoint_stand_back` 0.25** is what forces the lens to its ceiling and what costs the
   most room-read. It is on the approved drawing. §8.6 lever 2.
5. **`WIDE_VIEW_POLICIES` can be deleted** — both readings — once the lens is pinned. §8.5.

And one fork that is genuinely a taste call, not an evidence call: **must a room show both its
corners to read as a room?** §8.2 assumes yes, and that assumption is what forces the last 3.6°
from Presto's 70.6° up to 24 mm's 73.7°. If the answer is no, 25–28 mm opens up — and 25.4 mm
would put this project on exactly the lens Presto used for a room.

**The strongest single sentence to hand Kabe:** the only interior camera in this entire genre
that survives as a readable number is Presto Studios' own, at **70.6° / 25.4 mm**; architectural
photography's stated hard ceiling is **73.7° / 24 mm**; this study's north wall needs **74.2°**.
Three unrelated authorities, one three-degree window. The recommendation is that window's top,
and the only reason it is the top rather than the middle is this building's own metres.

---

### Sources

**Vision science and graphics**
- Vishwanath, Girshick & Banks (2005), *Nature Neuroscience* 8:1401–1410 — [10.1038/nn1553](https://doi.org/10.1038/nn1553) · https://pmc.ncbi.nlm.nih.gov/articles/PMC2727473/
- Cooper, Piazza & Banks (2012), *Journal of Vision* 12(5):8 — [10.1167/12.5.8](https://doi.org/10.1167/12.5.8) · http://www.emilyacooper.org/pubs/2012CooperPiazza_JOV.pdf
- Vangorp, Richardt, Cooper, Chaurasia, Banks & Drettakis (2013), *ACM TOG* 32(4):58 — [10.1145/2461912.2461971](https://doi.org/10.1145/2461912.2461971)
- Hagen & Elliott (1976), *J. Exp. Psychol. HPP* 2:479–490 — [10.1037/0096-1523.2.4.479](https://doi.org/10.1037/0096-1523.2.4.479)
- Zorin & Barr (1995), SIGGRAPH — https://cims.nyu.edu/gcl/papers/zorin1995cgp.pdf
- Lai, Shih, Liang & Yang, *Correcting Face Distortion in Wide-Angle Videos* — [arXiv:2111.09950](https://arxiv.org/abs/2111.09950)
- Fernandes & Feiner (2016), IEEE 3DUI — https://www.cs.columbia.edu/2016/combating-vr-sickness/images/combating-vr-sickness.pdf

**The genre**
- **ScummVM `pegasus` engine — Presto Studios' own released source, © 1995-1997 Presto Studios, Inc.** — https://github.com/scummvm/scummvm/tree/master/engines/pegasus (the interior camera is in `neighborhood/norad/delta/globegame.cpp`)
- H-uru/Plasma (Cyan Worlds' engine, open source) — https://github.com/H-uru/Plasma
- ScummVM `myst3` engine (Presto Studios' Myst III) — https://github.com/scummvm/scummvm/tree/master/engines/myst3
- ScummVM `zvision` (Zork Nemesis, Grand Inquisitor), `mohawk` (Myst, Riven), `mtropolis` (Obsidian), `vcruise` (Reah, Schizm) — https://github.com/scummvm/scummvm/tree/master/engines
- Apple, `VRMakePano.c` (QuickTime VR sample code) — https://developer.apple.com/library/archive/samplecode/vrmakepano/Listings/VRMakePano_c.html
- Apple, QuickTime File Format spec, pp. 289-292 (QTVR panorama atoms)
- David Sieks, "Artist's View", *Game Developer* Dec/Jan 1995 — https://archive.org/details/GDM_DecJan_1995
- Greg Uhler, *Game Developer* Feb 1998 (Legacy of Time) — https://archive.org/details/GDM_February_1998
- id Software DOOM / Quake / Quake III source — https://github.com/id-Software
- PCGamingWiki — /wiki/Obduction · /Myst_(2021) · /Riven_(2024) · /Firmament · /realMyst · /Glossary:Field_of_view_(FOV)
- The Starry Expanse Project — https://starryexpanse.com/2012/04/12/camera_matching/ · https://starryexpanse.com/2018/04/18/the-pointy-end-of-camera-matching/
- Myst Journey, *Riven Behind the Scenes* — https://mystjourney.com/riven/making-of/
- Time Extension, Rand Miller interview — https://www.timeextension.com/features/interview-i-was-not-sure-we-were-going-to-pull-it-off-cyans-rand-miller-on-remaking-riven-from-the-ground-up
- GOG forums, *realMyst FOV?* — https://www.gog.com/forum/myst_series/realmyst_fov

**Architecture, archviz, cinematography**
- Chaos (V-Ray/Enscape) — https://blog.chaos.com/best-practices-finding-the-right-perspective
- Usman Dawood, Architectural Photography Almanac — https://apalmanac.com/business/five-mistakes-beginner-architectural-photographers-should-avoid-2053
- Render Infinity — https://renderinfinity.com/blog/rendering-for-interior-design-focal-length/
- Larry Lohrman, Photography For Real Estate — https://photographyforrealestate.net/perspective-distortion-in-real-estate-photography/
- Garrett Brown on *The Shining*, *American Cinematographer* — https://theasc.com/article/steadicam-shining-revisited/
- Gordon Willis on *The Godfather*, ASC — https://theasc.com/post/the-film-book/gordon-willis-tribute-the-godfather/
- Roger Deakins forums — https://www.rogerdeakins.com/forums/topic/chasing-a-legacy-a-single-prime/ · https://www.rogerdeakins.com/forums/topic/barrel-distortion/
- Neil Oseman, *The Normal Lens* — https://neiloseman.com/the-normal-lens/
- Proko, *Cone of Vision* — https://www.proko.com/community/topics/perspective-question-cone-of-vision
