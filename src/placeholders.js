/* placeholders.js — procedural placeholder sprite library (plan §1, row 2).
 *
 * Classic script attaching to window.HOLO; the two-line UMD guard at the
 * bottom lets Node `require` the exact same file (the fixture validator reads
 * `records` this way — build() is browser-only and must never be called
 * without a DOM document).
 *
 * `records` is plain JSON-clean data: one complete blueprint-§6 record per
 * sprite id used in fixtures/demo-study/world.json. It must survive
 * JSON.parse(JSON.stringify(records)) deep-equal — no functions, no
 * undefined. Path strings ("parts/drawer_front.png", "states/open.png",
 * "thumb.png") are kept for §6 contract fidelity even though pixels are
 * procedural; the renderer never reads the paths, it reads the image table
 * that build() returns.
 *
 * [AI] extension beyond §6: each record carries `px: { w, h }` — the body
 * canvas dimensions, the PNG-dimension stand-in the Node-side validator
 * needs for anchor-bounds checks (a real record.json's sprite.png supplies
 * these at row 4; the procedural library has no file to measure).
 *
 * build(document) — the argument is the DOM document, used ONLY for
 * createElement("canvas") — returns the library object the renderer binds to:
 *
 *   library[id] = {
 *     record,                          // the §6 record (from `records`)
 *     images: {
 *       body: <canvas>,                // sprite.png equivalent (trimmed RGBA)
 *       parts: { <part_id>: <canvas> },            // desk only
 *       states: { open: { image: <canvas>,          // door only
 *                         extent: { x0, x1 } } },   // drawn bottom-opaque
 *                                                   // x-extent, BODY px space
 *       thumb: <canvas>                // takeables only, 128×128
 *     }
 *   }
 *
 * images.parts keys derive from record.parts[].id and images.states keys
 * from record.states_images keys — derived from the record, never beside it.
 * `extent` is computed at build time from the open state's own pixels
 * (bottom-two-rows alpha ≥ 128 scan, offset by origin.x), so it matches what
 * is drawn by construction; the swap-state contact shadow reads it.
 *
 * Painters are strictly deterministic: flat fills and strokes only — no
 * fillText, no gradients, no Math.random, no Date. Muted palette per plan §1
 * (oak #6b4a2f / #8a6a45, iron #3a3d42, brass #a98836, vellum #d8c9a3),
 * UL45 shading (top faces lightest, viewer-left mid, right/front darkest),
 * 1px darker outline — one consistent hand. Every body canvas is trimmed:
 * opaque content touches the top and bottom rows and the left and right
 * columns (§12.5 measures rendered alpha bounds against dims_m.h; padding
 * would fail the heights tests). Authoring scale: 200 px/m furniture,
 * 400 px/m takeables.
 *
 * Pinned test contracts honoured here (mechanisms.spec / walkthrough):
 * - desk: floor-level stretcher rail opaque across the leg span for the
 *   bottom 8% of rows; the drawer face exists ONLY in the part image — the
 *   body paints a darkened recess (opaque oak × 0.45) in the part's closed
 *   rect, so body mean luminance there < 0.7 × part mean luminance.
 * - chair: solid back panel — opaque over the middle 60% of trimmed width
 *   for its top-third rows.
 * - door: closed leaf visually symmetric (centred ring pull, no readable
 *   hinge side); open state is a ~0.25 m edge-on sliver, its own trimmed
 *   canvas at origin.x = 0 (viewer-left) with origin.y + open height ==
 *   body height exactly (the closed-frame swap gate, within 2%); the
 *   doorway aperture is NOT painted — the scene shows through.
 * - candlestick: stem ≥ 6 px wide throughout at authoring scale.
 * - takeable thumbs: 128×128, content-centred, ≥ 500 opaque px, distinct.
 */
(function () {
  "use strict";

  /* Plan-§1 palette — the one hand. */
  var OAK = "#6b4a2f";        // dark oak: right/front faces
  var OAK_LIGHT = "#8a6a45";  // light oak: top faces
  var IRON = "#3a3d42";
  var BRASS = "#a98836";
  var VELLUM = "#d8c9a3";
  var SILVER = "#aab0b6";     // muted silver for coin-silver (derived, same hand)

  /* Multiply a hex colour's channels by f (clamped) — deterministic shading. */
  function shade(hex, f) {
    var r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
    var g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
    var b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /* ------------------------------------------------------------------ */
  /* records — plain JSON-clean §6 data (see header).                   */
  /* ------------------------------------------------------------------ */

  var records = {
    /* Authored at 200 px/m: h 0.78 m -> 156 px; canvas width 280 carries the
     * 3/4-view depth beyond dims_m.w × 200. drawer_cavity is authored where
     * the OPEN drawer interior sits (contents draw only when open) and is
     * tall enough (54 px; screen ≈ 31 px at f ≈ 0.569) to contain the key
     * unclipped at t = 0.5: key needs 24 desk-px above its base, base lands
     * at the cavity diagonal midpoint y = 51, top at 27 ≥ y0 = 24.
     *
     * slide.dy is 0.24, not the smaller travel a drawer needs to merely look
     * open: children draw AFTER their host's parts (§7 step 3), so the open
     * drawer front must clear the cavity entirely or the revealed key draws
     * on top of the face and reads as lying on the drawer's edge rather than
     * inside it. Front top when open = origin.y + dy·h = 61.4 > the key's
     * base at 51. A heights.spec case holds this: the revealed key's drawn
     * rect sits wholly above the open drawer front. */
    "desk-joined-oak-1660": {
      "schema": "sprite/0.1",
      "id": "desk-joined-oak-1660",
      "noun": "joined oak writing desk",
      "archetype": "sliding",
      "attachment": "floor_against",
      "dims_m": { "h": 0.78, "w": 1.3, "d": 0.55 },
      "px": { "w": 280, "h": 156 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 140, "y": 156 },
        "footprint": { "x0": 0, "x1": 280 },
        "surface_top": { "x0": 30, "y0": 4, "x1": 250, "y1": 14 },
        "drawer_cavity": { "x0": 40, "y0": 24, "x1": 156, "y1": 78 }
      },
      "parts": [
        { "id": "drawer_front", "image": "parts/drawer_front.png",
          "origin": { "x": 60, "y": 24 },
          "slide": { "dx": -0.1, "dy": 0.24, "scale_open": 1.06 },
          "states": { "closed": 0, "open": 1 } }
      ],
      "takeable": false,
      "airborne": false,
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1" }
    },

    "chair-joined": {
      "schema": "sprite/0.1",
      "id": "chair-joined",
      "noun": "joined wainscot chair",
      "archetype": "static",
      "attachment": "floor_free",
      "dims_m": { "h": 1.05, "w": 0.6, "d": 0.55 },
      "px": { "w": 140, "h": 210 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 70, "y": 210 },
        "footprint": { "x0": 0, "x1": 140 }
      },
      "takeable": false,
      "airborne": false,
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1" }
    },

    /* Swap archetype: body IS the closed state; states_images.open registers
     * to closed-sprite (body) pixel space via origin — the open sliver sits
     * at the viewer-left edge (origin.x = 0) and both images are 400 px
     * tall, so origin.y = 0 makes bottom registration exact (gate: within
     * 2% of body height). */
    "door-plank": {
      "schema": "sprite/0.1",
      "id": "door-plank",
      "noun": "plank door",
      "archetype": "swap",
      "attachment": "wall_mounted",
      "dims_m": { "h": 2, "w": 0.9, "d": 0.05 },
      "px": { "w": 180, "h": 400 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 90, "y": 400 },
        "footprint": { "x0": 0, "x1": 180 }
      },
      "states_images": {
        "open": { "image": "states/open.png", "origin": { "x": 0, "y": 0 } }
      },
      "takeable": false,
      "airborne": false,
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1" }
    },

    /* surface_top rides the board whose top sits at y = 112:
     * (360 − 112) / 200 = 1.24 m above the floor (~1.2 m per plan §1). */
    "shelf-oak": {
      "schema": "sprite/0.1",
      "id": "shelf-oak",
      "noun": "back-panelled oak bookcase",
      "archetype": "static",
      "attachment": "floor_against",
      "dims_m": { "h": 1.8, "w": 1, "d": 0.3 },
      "px": { "w": 224, "h": 360 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 112, "y": 360 },
        "footprint": { "x0": 0, "x1": 224 },
        "surface_top": { "x0": 24, "y0": 112, "x1": 200, "y1": 120 }
      },
      "takeable": false,
      "airborne": false,
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1" }
    },

    "candlestick-brass": {
      "schema": "sprite/0.1",
      "id": "candlestick-brass",
      "noun": "brass candlestick",
      "archetype": "static",
      "attachment": "floor_free",
      "dims_m": { "h": 0.55, "w": 0.16, "d": 0.16 },
      "px": { "w": 32, "h": 110 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 16, "y": 110 },
        "footprint": { "x0": 0, "x1": 32 }
      },
      "takeable": false,
      "airborne": false,
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1" }
    },

    /* Takeables author at 400 px/m; anchor-hosted takeables carry the
     * minted §6 token attachment: "anchored" (plan §1). */
    "key-iron": {
      "schema": "sprite/0.1",
      "id": "key-iron",
      "noun": "iron key",
      "archetype": "static",
      "attachment": "anchored",
      "dims_m": { "h": 0.12, "w": 0.2, "d": 0.02 },
      "px": { "w": 80, "h": 48 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 48, "y": 48 },
        "footprint": { "x0": 16, "x1": 80 }
      },
      "takeable": true,
      "airborne": false,
      "thumb": "thumb.png",
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1",
        "dims_deviation": "dims_m.h 0.12 m is a V1 legibility cheat; a wrought iron door key of this period is ~0.075 m. Row 4 ships the honest size and the asset scale probe is where it is settled.",
        "v1_apparent_size": "at V1 this draws ~5.8 CSS px across on a 390 px phone — below any tap target. See dims_deviation and blueprint §5." }
    },

    "notebook-vellum": {
      "schema": "sprite/0.1",
      "id": "notebook-vellum",
      "noun": "vellum notebook",
      "archetype": "static",
      "attachment": "anchored",
      "dims_m": { "h": 0.22, "w": 0.16, "d": 0.03 },
      "px": { "w": 64, "h": 88 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 32, "y": 88 },
        "footprint": { "x0": 0, "x1": 64 }
      },
      "takeable": true,
      "airborne": false,
      "thumb": "thumb.png",
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1",
        "v1_apparent_size": "at V1 this draws ~4.6 CSS px across on a 390 px phone — below any tap target. Apparent size follows the open camera question in blueprint §5, not this record's dims_m, which are honest." }
    },

    "coin-silver": {
      "schema": "sprite/0.1",
      "id": "coin-silver",
      "noun": "silver coin",
      "archetype": "static",
      "attachment": "anchored",
      "dims_m": { "h": 0.06, "w": 0.06, "d": 0.005 },
      "px": { "w": 24, "h": 24 },
      "view_side": "left",
      "light": "UL45",
      "period": { "earliest": 1640, "latest": 1700, "region": "England" },
      "anchors": {
        "base": { "x": 12, "y": 24 },
        "footprint": { "x0": 0, "x1": 24 }
      },
      "takeable": true,
      "airborne": false,
      "thumb": "thumb.png",
      "provenance": { "source": "procedural-placeholder", "tool": "placeholders-v1",
        "dims_deviation": "dims_m.h 0.06 m is a V1 legibility cheat; an English silver shilling is ~0.028 m. Even cheated it draws ~6 px, so the fix is asset scale at row 4, not a bigger number here.",
        "v1_apparent_size": "at V1 this draws ~1.7 CSS px across on a 390 px phone — a finger cannot hit it. See dims_deviation and blueprint §5." }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Painters (browser-only; called through build).                     */
  /* ------------------------------------------------------------------ */

  function canvasOf(doc, w, h) {
    var c = doc.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  /* Flat-filled rect with a crisp 1px darker outline. */
  function box(ctx, x, y, w, h, fill, line) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    if (line) {
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  }

  /* Desk, 280×156, 3/4 view with the left side toward the viewer.
   * Rows 0..15 top slab (lightest) — touches the top row and both columns;
   * rows 140..155 stretcher rail, opaque across the full leg span (bottom
   * 8% of 156 is rows 144+ — the rail covers 140..155: test pin). The
   * drawer recess (opaque oak × 0.45) fills exactly the part's closed rect
   * x 60..180, y 24..64; the drawer face lives ONLY in the part image. */
  function paintDesk(doc) {
    var c = canvasOf(doc, 280, 156);
    var ctx = c.getContext("2d");
    var TOP = OAK_LIGHT;
    var LEFTF = shade(OAK_LIGHT, 0.82);
    var FRONT = OAK;
    var RECESS = shade(OAK, 0.45);
    var LINE = shade(OAK, 0.55);
    box(ctx, 0, 16, 44, 80, LEFTF, LINE);    // left side face (viewer-left, mid)
    box(ctx, 44, 16, 236, 80, FRONT, LINE);  // front case (darkest)
    box(ctx, 0, 0, 280, 16, TOP, LINE);      // top slab (lightest)
    ctx.fillStyle = RECESS;                  // cut drawer cavity, opaque
    ctx.fillRect(60, 24, 120, 40);
    box(ctx, 0, 96, 30, 60, FRONT, LINE);    // near-left leg
    box(ctx, 250, 96, 30, 60, FRONT, LINE);  // near-right leg
    ctx.fillStyle = LEFTF;                   // left face of the near leg
    ctx.fillRect(0, 96, 8, 60);
    box(ctx, 0, 140, 280, 16, FRONT, LINE);  // floor-level stretcher rail
    return c;
  }

  /* Drawer front part, 120×40, fully opaque: oak face, lighter UL bevel,
   * centred iron teardrop pull. */
  function paintDrawerFront(doc) {
    var c = canvasOf(doc, 120, 40);
    var ctx = c.getContext("2d");
    var LINE = shade(OAK, 0.55);
    box(ctx, 0, 0, 120, 40, OAK, LINE);
    ctx.fillStyle = OAK_LIGHT;               // top/left bevel lightest (UL45)
    ctx.fillRect(2, 2, 116, 3);
    ctx.fillRect(2, 2, 3, 36);
    ctx.fillStyle = shade(OAK, 0.8);         // bottom/right bevel darker
    ctx.fillRect(115, 2, 3, 36);
    ctx.fillRect(2, 35, 116, 3);
    ctx.fillStyle = IRON;                    // teardrop pull
    ctx.beginPath();
    ctx.arc(60, 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(55, 17);
    ctx.lineTo(65, 17);
    ctx.lineTo(60, 30);
    ctx.closePath();
    ctx.fill();
    return c;
  }

  /* Chair, 140×210, wainscot form. Back panel box x 24..116, y 0..126 is
   * solid — covers the pin: opaque over the middle 60% of trimmed width
   * (x 28..112) for the top-third rows (0..70). Seat spans the full trimmed
   * width (columns 0 and 139); stretcher reaches the bottom row. */
  function paintChair(doc) {
    var c = canvasOf(doc, 140, 210);
    var ctx = c.getContext("2d");
    var TOP = OAK_LIGHT;
    var FRONT = OAK;
    var LINE = shade(OAK, 0.55);
    box(ctx, 24, 0, 92, 126, FRONT, LINE);            // solid back (pin)
    ctx.fillStyle = shade(OAK_LIGHT, 0.82);           // fielded panel, mid
    ctx.fillRect(36, 14, 68, 84);
    ctx.fillStyle = shade(OAK_LIGHT, 0.95);           // panel field
    ctx.fillRect(44, 22, 52, 68);
    box(ctx, 0, 108, 140, 20, TOP, LINE);             // seat (top, lightest)
    box(ctx, 0, 128, 20, 82, FRONT, LINE);            // legs
    box(ctx, 120, 128, 20, 82, FRONT, LINE);
    box(ctx, 0, 196, 140, 14, FRONT, LINE);           // floor stretcher
    return c;
  }

  /* Door closed, 180×400, fully opaque: five vertical planks in a symmetric
   * tone pattern (A B A B A), two full-width iron straps, centred iron ring
   * pull — no readable hinge side. */
  function paintDoorClosed(doc) {
    var c = canvasOf(doc, 180, 400);
    var ctx = c.getContext("2d");
    var LINE = shade(OAK, 0.5);
    var tones = [OAK, shade(OAK, 0.9), OAK, shade(OAK, 0.9), OAK];
    for (var i = 0; i < 5; i++) box(ctx, i * 36, 0, 36, 400, tones[i], LINE);
    ctx.fillStyle = IRON;                             // symmetric straps
    ctx.fillRect(0, 56, 180, 10);
    ctx.fillRect(0, 334, 180, 10);
    ctx.fillRect(84, 188, 12, 12);                    // pull mounting boss
    ctx.strokeStyle = IRON;                           // centred ring pull
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(90, 210, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    return c;
  }

  /* Door open state, 50×400 — a ~0.25 m-wide full-height edge-on sliver in
   * its own trimmed canvas (drawn at origin.x = 0 in body space). The
   * doorway aperture is NOT painted: transparency, the scene shows through. */
  function paintDoorOpen(doc) {
    var c = canvasOf(doc, 50, 400);
    var ctx = c.getContext("2d");
    box(ctx, 0, 0, 50, 400, OAK, shade(OAK, 0.5));    // edge-on leaf, dark
    ctx.fillStyle = shade(OAK_LIGHT, 0.82);           // viewer-left face, mid
    ctx.fillRect(0, 0, 14, 400);
    ctx.fillStyle = IRON;                             // strap ends + pull edge
    ctx.fillRect(0, 56, 50, 10);
    ctx.fillRect(0, 334, 50, 10);
    ctx.fillRect(30, 202, 8, 16);
    return c;
  }

  /* Shelf, 224×360, back-panelled bookcase — the whole case is opaque
   * (back panel + sides + boards), so the stick1 overlap region in the
   * lower half is solid. Board front edges (lightest) at 1.5 / 1.2 / 0.8 /
   * 0.4 m; surface_top rides the 1.2 m board (y 112). */
  function paintShelf(doc) {
    var c = canvasOf(doc, 224, 360);
    var ctx = c.getContext("2d");
    var TOP = OAK_LIGHT;
    var LINE = shade(OAK, 0.55);
    box(ctx, 16, 0, 192, 360, shade(OAK, 0.7), LINE); // back panel (opaque)
    box(ctx, 0, 0, 16, 360, shade(OAK_LIGHT, 0.82), LINE); // left side, mid
    box(ctx, 208, 0, 16, 360, OAK, LINE);             // right side, darkest
    var ys = [52, 112, 192, 272];
    for (var i = 0; i < ys.length; i++) box(ctx, 16, ys[i], 192, 10, TOP, LINE);
    box(ctx, 0, 0, 224, 14, TOP, LINE);               // top board
    box(ctx, 0, 346, 224, 14, OAK, LINE);             // plinth
    return c;
  }

  /* Candlestick, 32×110, brass floor-standing: candle touches the top row,
   * full-width base touches the bottom row and both columns, stem 8 px wide
   * throughout (≥ 6 px pin). */
  function paintCandlestick(doc) {
    var c = canvasOf(doc, 32, 110);
    var ctx = c.getContext("2d");
    var LINE = shade(BRASS, 0.5);
    box(ctx, 12, 0, 8, 16, VELLUM, shade(VELLUM, 0.6));   // candle
    box(ctx, 2, 14, 28, 8, BRASS, LINE);                  // drip pan
    box(ctx, 12, 20, 8, 78, BRASS, LINE);                 // stem (solid)
    box(ctx, 8, 44, 16, 8, BRASS, LINE);                  // knop
    box(ctx, 8, 68, 16, 8, BRASS, LINE);                  // knop
    box(ctx, 0, 96, 32, 14, shade(BRASS, 0.85), LINE);    // base (full width)
    ctx.fillStyle = shade(BRASS, 1.25);                   // UL stem highlight
    ctx.fillRect(12, 20, 3, 78);
    return c;
  }

  /* Key, 80×48: round bow at left (punched hole), shaft, bit at right.
   * Forged flats pin full-alpha pixels at row 0, the bottom row, and
   * column 0; the bit reaches column 79 and the bottom row. Bottom-row
   * opaque extent is x 16..80 — footprint {16, 80}, base midpoint 48. */
  function paintKey(doc) {
    var c = canvasOf(doc, 80, 48);
    var ctx = c.getContext("2d");
    ctx.fillStyle = IRON;
    ctx.beginPath();
    ctx.arc(24, 24, 24, 0, Math.PI * 2);              // bow
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out"; // bow hole (transparent)
    ctx.beginPath();
    ctx.arc(24, 24, 7, 0, Math.PI * 2);               // small hole: a chunky
    ctx.fill();                                       // forged bow (keeps the
    ctx.globalCompositeOperation = "source-over";     // rendered key solid)
    ctx.fillStyle = IRON;
    ctx.fillRect(16, 0, 16, 5);                       // forged flat: top row
    ctx.fillRect(16, 43, 16, 5);                      // forged flat: bottom row
    ctx.fillRect(0, 18, 6, 12);                       // forged flat: column 0
    ctx.fillRect(40, 17, 36, 14);                     // shaft (stout)
    ctx.fillRect(66, 19, 14, 29);                     // bit (column 79, bottom)
    ctx.globalCompositeOperation = "destination-out"; // ward notch
    ctx.fillRect(70, 30, 5, 7);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = shade(IRON, 1.6);                 // UL top highlight
    ctx.fillRect(40, 19, 36, 2);
    return c;
  }

  /* Notebook, 64×88, fully opaque: limp vellum cover propped upright, spine
   * fold at left, wrap-around tie with iron clasp. */
  function paintNotebook(doc) {
    var c = canvasOf(doc, 64, 88);
    var ctx = c.getContext("2d");
    var LINE = shade(VELLUM, 0.5);
    box(ctx, 0, 0, 64, 88, VELLUM, LINE);
    ctx.fillStyle = shade(VELLUM, 0.78);              // spine fold
    ctx.fillRect(0, 0, 10, 88);
    ctx.fillStyle = shade(VELLUM, 0.7);               // wrap-around tie
    ctx.fillRect(10, 40, 54, 8);
    ctx.fillStyle = IRON;                             // clasp
    ctx.fillRect(52, 39, 8, 10);
    ctx.strokeStyle = LINE;                           // ruled label panel
    ctx.lineWidth = 1;
    ctx.strokeRect(14.5, 8.5, 42, 24);
    return c;
  }

  /* Coin, 24×24: silver disc with a cross stamp (period-plausible) — the
   * cross arms pin full-alpha pixels at all four canvas edges. */
  function paintCoin(doc) {
    var c = canvasOf(doc, 24, 24);
    var ctx = c.getContext("2d");
    ctx.fillStyle = SILVER;
    ctx.beginPath();
    ctx.arc(12, 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(SILVER, 0.8);               // cross stamp
    ctx.fillRect(10, 0, 4, 24);
    ctx.fillRect(0, 10, 24, 4);
    ctx.strokeStyle = shade(SILVER, 0.6);             // inner ring
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(12, 12, 9, 0, Math.PI * 2);
    ctx.stroke();
    return c;
  }

  /* Painter table — build() derives which entries it reads from the record
   * (parts keys from record.parts[].id, states keys from record.states_images),
   * so the images table can never carry a key the record does not name. */
  var PAINTERS = {
    "desk-joined-oak-1660": { body: paintDesk, parts: { "drawer_front": paintDrawerFront } },
    "chair-joined": { body: paintChair },
    "door-plank": { body: paintDoorClosed, states: { "open": paintDoorOpen } },
    "shelf-oak": { body: paintShelf },
    "candlestick-brass": { body: paintCandlestick },
    "key-iron": { body: paintKey },
    "notebook-vellum": { body: paintNotebook },
    "coin-silver": { body: paintCoin }
  };

  /* 128×128 content-centred thumb of a body canvas (takeables). Nearest-
   * neighbour scaling keeps the render deterministic and hard-edged. */
  function makeThumb(doc, body) {
    var c = canvasOf(doc, 128, 128);
    var ctx = c.getContext("2d");
    var s = 112 / Math.max(body.width, body.height);
    var w = Math.round(body.width * s);
    var h = Math.round(body.height * s);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(body, Math.round((128 - w) / 2), Math.round((128 - h) / 2), w, h);
    return c;
  }

  /* Bottom-opaque x-extent of a state canvas (alpha ≥ 128 over the bottom
   * two rows, the §9 base-anchor convention), offset into body pixel space
   * by origin.x — the swap-state contact shadow's span. */
  function bottomOpaqueExtent(canvas, originX) {
    var w = canvas.width;
    var h = canvas.height;
    var data = canvas.getContext("2d").getImageData(0, h - 2, w, 2).data;
    var minX = -1;
    var maxX = -1;
    for (var x = 0; x < w; x++) {
      for (var r = 0; r < 2; r++) {
        if (data[(r * w + x) * 4 + 3] >= 128) {
          if (minX < 0) minX = x;
          maxX = x;
          break;
        }
      }
    }
    return { x0: originX + minX, x1: originX + maxX + 1 };
  }

  /**
   * Build the placeholder library. `doc` is the DOM document, used only for
   * createElement("canvas"); Node callers use `records` and never call this.
   */
  function build(doc) {
    if (!doc || typeof doc.createElement !== "function") {
      throw new Error("placeholders.build requires a DOM document");
    }
    var lib = {};
    var ids = Object.keys(records);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var record = records[id];
      var painters = PAINTERS[id];
      var images = { body: painters.body(doc) };
      if (record.parts) {
        images.parts = {};
        for (var p = 0; p < record.parts.length; p++) {
          var partId = record.parts[p].id;
          images.parts[partId] = painters.parts[partId](doc);
        }
      }
      if (record.states_images) {
        images.states = {};
        var stateNames = Object.keys(record.states_images);
        for (var s = 0; s < stateNames.length; s++) {
          var name = stateNames[s];
          var img = painters.states[name](doc);
          images.states[name] = {
            image: img,
            extent: bottomOpaqueExtent(img, record.states_images[name].origin.x)
          };
        }
      }
      if (record.takeable) images.thumb = makeThumb(doc, images.body);
      lib[id] = { record: record, images: images };
    }
    return lib;
  }

  var api = { records: records, build: build };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.placeholders = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
