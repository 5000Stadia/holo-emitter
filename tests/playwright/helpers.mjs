import { test as base, expect } from "@playwright/test";
import { mkdirSync, mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const appUrl = (root = repoRoot) =>
  pathToFileURL(join(root, "index.html")).href;

/** Viewport for every pointer-driven spec (plan §8): the canvas displays at
 * scale 1, so canvas pixels are CSS pixels and small takeables stay
 * clickable. 1024 + 7.6rem bottom chrome ≈ 1146; 1200 gives headroom. */
export const POINTER_VIEWPORT = { width: 1536, height: 1200 };

/** Copy the runnable tree (index.html, src/, fixtures/, tools/) into a fresh
 * scratch directory so a test can edit fixtures and re-bake without ever
 * mutating the repo tree. */
export function stageTree() {
  const dir = mkdtempSync(join(tmpdir(), "holo-emitter-"));
  for (const p of ["index.html", "src", "fixtures", "tools"]) {
    cpSync(join(repoRoot, p), join(dir, p), { recursive: true });
  }
  /* Row 11: the bake asserts its ruled eye height against blueprint §10's
     authored home, `replicator/contract.json`, so that file is a bake input
     now and a staged tree without it refuses for a reason that has nothing to
     do with the fixture under test. Only the contract is copied — the rest of
     the replicator is another row's lane and nothing here runs it. */
  mkdirSync(join(dir, "replicator"), { recursive: true });
  cpSync(join(repoRoot, "replicator", "contract.json"),
    join(dir, "replicator", "contract.json"));
  return dir;
}

export function bake(root, args = []) {
  return execFileSync("node", [join(root, "tools", "bake-fixtures.mjs"), ...args], {
    encoding: "utf8"
  });
}

export function setViewstate(root, viewstate) {
  writeFileSync(
    join(root, "fixtures", "demo-study", "viewstate.json"),
    JSON.stringify(viewstate) + "\n"
  );
  bake(root, ["--fixture-dir", join(root, "fixtures", "demo-study")]);
}

export function removeTree(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/* In-page test utilities, injected before app scripts; the functions run at
 * call time, when window.HOLO exists. SHA-256 via WebCrypto: file:// is a
 * secure context in Chromium, and getImageData bytes make the hash
 * pixel-exact and immune to PNG encoders and CSS scaling. */
const IN_PAGE = () => {
  window.__T = {
    async hashCanvas(canvas) {
      const ctx = canvas.getContext("2d");
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    },
    hashScene() {
      return window.__T.hashCanvas(document.getElementById("scene"));
    },
    async hashRegion(canvas, x0, y0, w, h) {
      const data = canvas.getContext("2d").getImageData(x0, y0, w, h).data;
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    },
    /* One shared placeholder library per page (deterministic painters make
     * separate builds pixel-identical anyway). */
    lib() {
      if (!window.__T._lib) window.__T._lib = window.HOLO.placeholders.build(document);
      return window.__T._lib;
    },
    /* Direct pure render of the baked fixture at a viewstate. */
    renderDirect(viewstate, canvas, options) {
      const fx = window.HOLO_FIXTURE;
      return window.__T.renderW(fx.world, fx.staging, viewstate, options, canvas);
    },
    /* The backdrop map the PAGE renders with. Since row 11 it carries a
       derived §5 meta per facing, so a test that passes `{}` here renders a
       different room from the one on screen — every shipped facing resolves
       to the plan's geometry, not to the unplanned-facing fallback. */
    bd() {
      return (window.HOLO_APP && window.HOLO_APP.backdrops) || {};
    },
    /* The meta a facing resolves to, exactly as the page resolves it. */
    metaOf(viewstate) {
      const e = window.__T.bd()[viewstate.location + "/" + viewstate.facing];
      return (e && e.meta) ? e.meta : window.HOLO.renderer.GRID_META;
    },
    /* Direct pure render of an arbitrary (possibly doctored) world/staging. */
    renderW(world, staging, viewstate, options, canvas) {
      const c = canvas || document.createElement("canvas");
      c.width = 1536;
      c.height = 1024;
      window.HOLO.renderer.render(
        c, world, staging, window.__T.lib(), window.__T.bd(), viewstate, options || {});
      return c;
    },
    /* Render onto a FLAT-FILL backdrop image at grid canonical meta. The
     * grid's own floor is near-black, where a black contact shadow has
     * almost nothing left to darken; a lit floor is where the shadow's
     * strength can actually be measured — and this is also the only path
     * that exercises the renderer's real-backdrop branch before row 4. */
    renderOnFill(world, staging, viewstate, options, fill) {
      const bd = document.createElement("canvas");
      bd.width = 1536;
      bd.height = 1024;
      const g = bd.getContext("2d");
      g.fillStyle = fill;
      g.fillRect(0, 0, 1536, 1024);
      const c = document.createElement("canvas");
      c.width = 1536;
      c.height = 1024;
      const backdrops = {};
      backdrops[viewstate.location + "/" + viewstate.facing] =
        { image: bd, meta: window.__T.metaOf(viewstate) };
      window.HOLO.renderer.render(
        c, world, staging, window.__T.lib(), backdrops, viewstate, options || {});
      return c;
    },
    clone(o) { return JSON.parse(JSON.stringify(o)); },
    /* A doctored copy of the baked world with named entities deleted
     * (relations and knowledge entries scrubbed with them). */
    worldWithout(ids, baseWorld) {
      const w = window.__T.clone(baseWorld || window.HOLO_FIXTURE.world);
      w.entities = w.entities.filter((e) => !ids.includes(e.id));
      w.relations = (w.relations || []).filter(
        (r) => !ids.includes(r[1]) && !ids.includes(r[2]));
      w.knowledge.player = w.knowledge.player.filter((id) => !ids.includes(id));
      return w;
    },
    /* Alpha bounding box of a canvas at a threshold; null if empty. */
    alphaBounds(canvas, threshold = 1) {
      const { width: W, height: H } = canvas;
      const data = canvas.getContext("2d").getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (data[(y * W + x) * 4 + 3] >= threshold) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    },
    /* Pixels where both canvases have alpha >= threshold; returns count and
     * up to `keep` sample points. */
    maskIntersect(a, b, threshold = 128, keep = 64) {
      const W = a.width, H = a.height;
      const da = a.getContext("2d").getImageData(0, 0, W, H).data;
      const db = b.getContext("2d").getImageData(0, 0, W, H).data;
      let count = 0;
      const samples = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4 + 3;
          if (da[i] >= threshold && db[i] >= threshold) {
            count++;
            if (samples.length < keep && (count % 37 === 1)) samples.push({ x, y });
          }
        }
      }
      return { count, samples };
    },
    /* Diff bounding box + count between two same-size canvases. */
    diffBounds(a, b) {
      const W = a.width, H = a.height;
      const da = a.getContext("2d").getImageData(0, 0, W, H).data;
      const db = b.getContext("2d").getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1, count = 0;
      const samples = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (da[i] !== db[i] || da[i + 1] !== db[i + 1] ||
              da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) {
            count++;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            if (samples.length < 16) samples.push({ x, y });
          }
        }
      }
      return count === 0 ? { count: 0 } : { count, x0, y0, x1, y1, samples };
    },
    /* Pixel RGBA at a point. */
    px(canvas, x, y) {
      const d = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
      return [d[0], d[1], d[2], d[3]];
    },
    isOverlayBlank() {
      const c = document.getElementById("overlay");
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
      return true;
    },
    /* Drawn bounding box of a layout entry (current state image or body,
     * intersected with its clip), in scene coords. */
    entryBBox(entry) {
      let x, y, w, h;
      if (entry.swap) {
        x = entry.drawX + entry.f * entry.swap.origin.x;
        y = entry.drawY + entry.f * entry.swap.origin.y;
        w = entry.f * entry.swap.image.width;
        h = entry.f * entry.swap.image.height;
      } else {
        x = entry.drawX;
        y = entry.drawY;
        w = entry.f * entry.record.px.w;
        h = entry.f * entry.record.px.h;
      }
      if (entry.clip) {
        const x1 = Math.min(x + w, entry.clip.x + entry.clip.w);
        const y1 = Math.min(y + h, entry.clip.y + entry.clip.h);
        x = Math.max(x, entry.clip.x);
        y = Math.max(y, entry.clip.y);
        w = x1 - x;
        h = y1 - y;
      }
      return { x, y, w, h };
    },
    currentLayout() {
      return window.HOLO.renderer.layout(
        window.HOLO_APP.harness.world, window.HOLO_APP.harness.staging,
        window.HOLO_APP.library, window.__T.metaOf(window.HOLO_APP.harness.viewstate),
        window.HOLO_APP.harness.viewstate);
    },
    /* Canvas coords of an opaque, hitTest-confirmed point of an entity in
     * the app's CURRENT layout (used for walkthrough clicks; the chair
     * refusal click is derived test-side instead — see walkthrough.spec). */
    clickPoint(id) {
      const layout = window.__T.currentLayout();
      const entry = layout.find((e) => e.id === id);
      if (!entry) return null;
      const b = window.__T.entryBBox(entry);
      for (let dy = 0; dy < b.h; dy += 2) {
        for (let dx = 0; dx < b.w; dx += 2) {
          const x = Math.floor(b.x + dx), y = Math.floor(b.y + dy);
          if (x < 0 || y < 0 || x >= 1536 || y >= 1024) continue;
          if (window.HOLO.renderer.hitTest(layout, window.HOLO_APP.library, x, y) === id) {
            return { x, y };
          }
        }
      }
      return null;
    },
    /* A point inside the doorway the player is facing that the page's own
     * routing sends to `go` — i.e. one that hits no drawn entity, including
     * the tolerance ring. This is where a person clicks to walk through: the
     * opening, not the edge-on sliver of the swung leaf. Returns null when
     * the facing has no exit. */
    aperturePoint() {
      const A = window.HOLO_APP;
      const list = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate);
      if (!list.length) return null;
      const a = list[0];
      for (let fy = 0.5; fy <= 0.9; fy += 0.04) {
        for (let fx = 0.95; fx >= 0.05; fx -= 0.02) {
          const x = Math.round(a.x + fx * a.w);
          const y = Math.round(a.y + fy * a.h);
          if (A.hitAtPoint(x, y) === null) return { x, y, exit: a.exit };
        }
      }
      return null;
    },
    /* Fraction of pixels in a horizontal band (rows y-1..y+1) whose red
     * channel exceeds the base by a threshold — the blend-tolerant line
     * predicate. Base colours are darker than any key_tint blend. */
    /* Self-calibrating against the band's own background rather than an
       absolute level: a grid line is a pixel brighter than the surface it is
       drawn on, and the wall and floor bases are product colours that move. */
    lineFraction(canvas, y, x0 = 0, x1 = null) {
      const W = canvas.width;
      if (x1 === null) x1 = W;
      const data = canvas.getContext("2d").getImageData(x0, y - 1, x1 - x0, 3).data;
      const cols = x1 - x0;
      const reds = [];
      for (let r = 0; r < 3; r++) {
        for (let x = 0; x < cols; x++) reds.push(data[(r * cols + x) * 4]);
      }
      reds.sort((a, b) => a - b);
      const base = reds[Math.floor(reds.length / 2)];
      let hit = 0;
      for (let x = 0; x < cols; x++) {
        for (let r = 0; r < 3; r++) {
          if (data[(r * cols + x) * 4] > base + 6) { hit++; break; }
        }
      }
      return hit / cols;
    },
    /* Mean red channel of a single row — used for major-vs-plain brightness. */
    rowMean(canvas, y) {
      const W = canvas.width;
      const data = canvas.getContext("2d").getImageData(0, y, W, 1).data;
      let sum = 0;
      for (let x = 0; x < W; x++) sum += data[x * 4];
      return sum / W;
    },
    /* Column line predicate over a vertical span. */
    colFraction(canvas, x, y0, y1) {
      const rows = y1 - y0;
      const data = canvas.getContext("2d").getImageData(x - 1, y0, 3, rows).data;
      let hit = 0;
      for (let y = 0; y < rows; y++) {
        for (let c = 0; c < 3; c++) {
          if (data[(y * 3 + c) * 4] > 40) { hit++; break; }
        }
      }
      return hit / rows;
    },
    /* The shared grid-structure predicate (§12.8's grid clause is defined as
     * determinism PLUS this — "not blank" can never satisfy it). Geometry
     * expectations are computed by the CALLER from §5 literals and passed in. */
    gridStructure(canvas, exp) {
      const T = window.__T;
      const out = { ok: true, failures: [] };
      const need = (cond, name) => {
        if (!cond) { out.ok = false; out.failures.push(name); }
      };
      /* Row 11: every floor predicate is measured over the x-range the room
         actually has at that row. Before the corners, the floor ran the width
         of the frame and a full-width fraction was the right question; now a
         transverse line that spanned the frame would be drawing floor the
         room does not own. */
      const [fx0, fx1] = exp.floorSpan;
      need(T.lineFraction(canvas, exp.floorRow, Math.ceil(fx0) + 2, Math.floor(fx1) - 2) > 0.9,
        "wall-floor line, corner to corner");
      /* And it must STOP at the corners: just outside them the wall-floor
         line is not there (the side wall's junction has left it by then). */
      need(T.lineFraction(canvas, exp.eyeRow) > 0.9, "eye line (full width, a level camera's horizon)");
      exp.transverseRows.forEach((r, i) => {
        const [x0, x1] = exp.transverseSpans[i];
        need(T.lineFraction(canvas, r, Math.ceil(x0) + 3, Math.floor(x1) - 3) > 0.9,
          "transverse row " + r);
      });
      exp.clearRows.forEach((r, i) => {
        const [x0, x1] = exp.clearSpans[i];
        need(T.lineFraction(canvas, r, Math.ceil(x0) + 3, Math.floor(x1) - 3) < 0.1,
          "clear row " + r);
      });
      need(T.rowMean(canvas, exp.eyeRow) > T.rowMean(canvas, exp.plainWallRow) + 20,
        "eye line brighter than plain wall row");
      /* Wall ink is scanned BETWEEN the wall-ceiling line and the eye line —
         the room has a ceiling now, so above `ceilRow` there is no wall to
         find and a scan from y 0 would be asking the ceiling for wall. */
      const wallY0 = exp.ceilRow + 6, wallY1 = exp.eyeRow - 10;
      need(T.colFraction(canvas, exp.wallCentreCol, wallY0, wallY1) > 0.9,
        "vertical metre line at wall centre");
      /* THE CORNERS. Two verticals, at the ends of the u-domain the staging
         addresses, running from the wall-ceiling line to the floor line. */
      exp.cornerCols.forEach((c) => {
        need(T.colFraction(canvas, Math.round(c), wallY0, wallY1) > 0.9,
          "corner vertical at x " + Math.round(c));
      });
      return out;
    }
  };
};

/* Suite-wide fixtures:
 * - every page the suite opens carries the in-page utilities;
 * - every page carries the no-network guard (§12.7 first half): any request
 *   to a non-local scheme, and any WebSocket (which emits no request event),
 *   in any test fails the run. */
/* The in-page utilities, for a spec that needs a context option the shared
 * fixture cannot carry (touch emulation, scripts disabled): make one with
 * `browser.newContext(...)` and hand it here before the first navigation. */
export async function equipContext(context) {
  await context.addInitScript(IN_PAGE);
  return context;
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(IN_PAGE);
    const offenders = [];
    context.on("page", (p) => {
      p.on("request", (req) => {
        if (!/^(file|data|about|blob):/.test(req.url())) offenders.push(req.url());
      });
      p.on("websocket", (ws) => offenders.push("websocket: " + ws.url()));
    });
    await use(context);
    expect(offenders, "zero network requests (§12.7)").toEqual([]);
  }
});

export { expect };

/* §5 literals plus the pinned depth-model constant, derived independently of
 * the shipped code (§12.5's independence rule: tests assert literals and
 * re-implement the math, never importing groundplane.js — the validator does
 * the importing; the tests do the re-deriving). */
/* THE TEST SIDE'S OWN NUMBERS (§12.5's independence rule).
 *
 * Literals, never an import — and since row 11 literals of TWO documents:
 *
 *   - the camera: blueprint §7's grid-canonical amendment, and §5's rule
 *     that the approved image is the geometric authority — so since row 20
 *     the eye and the horizon are MEASURED off `study/N` rather than
 *     authored: horizon 524.4/1024, eye 1.08775 m, a 1024 px lens, and
 *     1536×1024. `floor_line_y` and `px_per_m_at_bottom`
 *     are then §5's own horizon device, written out here as arithmetic rather
 *     than copied. §10's ruled 1.83 m is here too, under its own name, because
 *     it is a different camera with a different job: generation.
 *   - the two per-facing numbers, TYPED BY HAND from the approved
 *     `design/plan-draft/standpoints.tsv` — the sheet Kabe signed, which
 *     plan.spec byte-compares against the approval commit. NOT from
 *     `projection.md`, which is GENERATED by the very `deriveMeta` these
 *     tests exist to check: literals laundered through a generated markdown
 *     file are still the code's own answer, and a shared bug self-agrees
 *     everywhere a test asks the code where things are.
 *
 * So `LIT.facing(loc, f)` can disagree with `deriveMeta`, which is the point.
 */
export const LIT = {
  H: 1024,
  W: 1536,
  /* THE LENS (row 20). Typed here, never imported: `src/groundplane.js` holds
     the same number and this file is what would go red if it moved. 24 mm on
     the 36 mm-wide format this frame is, which is exactly 1024 px. */
  focal_px: 1024,
  /* THE HORIZON, and it is the lens SHIFT — a level camera with its frame
     moved, not a tilted one. Measured off the approved `study/N` backdrop at
     y 524.4 of 1024 by the CEILING-RAMP FIT, which the Navigator ruled in
     over the vanishing-point vote: the two disagree by up to 66 px across the
     eight frames and the ramp fit closes at a 0.3 px residual. */
  horizon_y: 524.4 / 1024,
  /* THE DRAWING CAMERA'S EYE HEIGHT, MEASURED (row 20). Blueprint §5 [HUMAN,
     2026-08-20] rules that the geometry is determined by the orientation of
     the approved image generation; the approved backdrops arrived and measure
     1.08775 m, level, by the ceiling-ramp horizon the Navigator ruled on its
     0.3 px residual. This supersedes row 11's 1.60 m interim, which was named
     an interim awaiting exactly this measurement. */
  eye_m: 1.08775,
  /* THE GENERATION CAMERA. [HUMAN, 2026-08-20] "about a 6ft height" —
     blueprint §10 `camera.eye_height_m`, which backdrops are PROMPTED at and
     which the generator did not honour. No pixel here is drawn at it. */
  ruled_eye_m: 1.83,
  /* The UNPLANNED-FACING fallback's own numbers. Every one is a consequence of
     the three above and its own camera distance — under a pinned lens nothing
     about a meta's scale is authored. 16.0 m of wall is now deliberately WIDER
     than the frame holds (6.0 m at 4.0 m away), so an extent nobody has drawn
     makes no claim about where its wall ends. */
  camera_wall_m: 4.0,
  px_per_m_at_wall: 1024 / 4.0,                    // 256
  floor_line_y: 524.4 / 1024 + 1.08775 * (1024 / 4.0) / 1024,
  px_per_m_at_bottom: (1024 - 524.4) / 1.08775,
  wall_width_m: 16,
  k: 1024,      // px_per_m_at_wall × camera_wall_m — the focal length itself
  /* Every planned facing's room height [HUMAN 2026-08-21] — `plan.floors[].
     storey_height_m`, the same on both floors. */
  storey_height_m: 2.8,

  /* [wall_width_m, camera_wall_m, facing_type], typed from the approved
     standpoints table as row 20's standpoint law rebuilt it. study N/S and
     hall N/S stand at the far side of their rooms because their walls do not
     fit the frame from the drawn standpoint; study E/W and hall E/W keep the
     drawn one because theirs do. study/S is 3.85 rather than 4.35 because the
     chimney breast is behind you on that facing and you cannot stand in it. */
  FACINGS: {
    "study/N": [5.45, 4.35, "enclosed"],
    "study/E": [4.80, 4.09, "enclosed"],
    "study/S": [5.45, 3.85, "enclosed"],
    "study/W": [4.80, 4.09, "enclosed"],
    "hall/N": [8.00, 2.15, "enclosed"],
    "hall/E": [2.60, 6.00, "corridor"],
    "hall/S": [8.00, 2.15, "enclosed"],
    "hall/W": [2.60, 6.00, "corridor"]
  },
  facingKeys() { return Object.keys(LIT.FACINGS); },

  /** The meta a shipped facing must have, computed here from the two typed
   *  numbers and the camera — never read off the code. */
  facing(loc, f) {
    const key = typeof f === "string" ? loc + "/" + f : loc;
    const row = LIT.FACINGS[key];
    if (!row) throw new Error("no test-side literals for " + key);
    const [wall_width_m, camera_wall_m, facing_type] = row;
    /* THE LENS: pixels per metre is a consequence of how far away the wall is,
       not a constant. This is row 20 in one line. */
    const px = LIT.focal_px / camera_wall_m;
    const half = (wall_width_m / 2) * px;
    return {
      key, wall_width_m, camera_wall_m, facing_type,
      storey_height_m: LIT.storey_height_m,
      px_per_m_at_wall: px,
      /* And so is the floor line: it sits eye-height below the horizon AT WALL
         SCALE, so a near wall puts it lower in the frame. Under the pinned
         scale it was the same number on all eight facings. */
      floor_line_y: LIT.horizon_y + LIT.eye_m * px / LIT.H,
      px_per_m_at_bottom: LIT.px_per_m_at_bottom,
      horizon_y: LIT.horizon_y,
      image_h_px: LIT.H,
      corner_x0_px: LIT.W / 2 - half,
      corner_x1_px: LIT.W / 2 + half,
      /* The intention's "camera has feet" number: where the floor first
         appears in front of the viewer. Under a pinned lens it is
         `f / px_per_m_at_bottom` — the lens and the horizon decide it and the
         standpoint does not — so it is the SAME on every facing in the manor,
         where it used to be fifteen different anomalies. */
      nearest_floor_m: LIT.focal_px / LIT.px_per_m_at_bottom
    };
  }
};

/* Test-side re-implementation of the ground-plane math from a meta's own
 * literals — never an import of src/groundplane.js. */
export function mathFor(m) {
  const floorY = m.floor_line_y * m.image_h_px;
  const centre = (m.corner_x0_px + m.corner_x1_px) / 2;
  const span = m.corner_x1_px - m.corner_x0_px;
  const M = {
    meta: m,
    floorY,
    sAtY(y) {
      return m.px_per_m_at_wall +
        ((y - floorY) / (m.image_h_px - floorY)) *
        (m.px_per_m_at_bottom - m.px_per_m_at_wall);
    },
    yAtS(s) {
      return floorY +
        ((s - m.px_per_m_at_wall) / (m.px_per_m_at_bottom - m.px_per_m_at_wall)) *
        (m.image_h_px - floorY);
    },
    sAtDepth(d) {
      return m.px_per_m_at_wall * m.camera_wall_m / (m.camera_wall_m - d);
    },
    yAtDepth(d) { return M.yAtS(M.sAtDepth(d)); },
    xAtScale(u, s) { return centre + (u - 0.5) * span * (s / m.px_per_m_at_wall); },
    xAtU(u, y) { return M.xAtScale(u, M.sAtY(y)); },
    /* Full placement of a floor/wall entity from staging + record data.
     * A wall_mounted placement hangs ON the wall plane, so its scale is
     * px_per_m_at_wall at any v — the ground-plane lerp describes the floor,
     * and reading it at a raised baseline shrinks the hung object by exactly
     * the amount it was raised. */
    place(placement, record) {
      let baselineY, s;
      if (placement.attachment === "floor_against") {
        baselineY = M.yAtDepth(record.dims_m.d);
        s = M.sAtY(baselineY);
      } else if (placement.attachment === "floor_free") {
        baselineY = M.yAtDepth(placement.depth_m);
        s = M.sAtY(baselineY);
      } else { // wall_mounted
        baselineY = floorY - (placement.v || 0) * m.px_per_m_at_wall;
        s = m.px_per_m_at_wall;
      }
      const heightPx = record.dims_m.h * s;
      const f = heightPx / record.px.h;
      const baseX = M.xAtScale(placement.u, s);
      return {
        baselineY, s, heightPx, f, baseX,
        drawX: baseX - f * record.anchors.base.x,
        drawY: baselineY - f * record.anchors.base.y
      };
    }
  };
  return M;
}

/* The unplanned-facing fallback's own arithmetic, for callers that mean that
 * meta specifically (its corners are null in the code; the fallback draws an
 * unbounded wall, and the centred pair below is what its u-domain spans). */
export const MATH = mathFor({
  floor_line_y: LIT.floor_line_y,
  px_per_m_at_wall: LIT.px_per_m_at_wall,
  px_per_m_at_bottom: LIT.px_per_m_at_bottom,
  image_h_px: LIT.H,
  horizon_y: LIT.horizon_y,
  wall_width_m: LIT.wall_width_m,
  camera_wall_m: LIT.camera_wall_m,
  corner_x0_px: LIT.W / 2 - (LIT.wall_width_m / 2) * LIT.px_per_m_at_wall,
  corner_x1_px: LIT.W / 2 + (LIT.wall_width_m / 2) * LIT.px_per_m_at_wall
});

/** The arithmetic for one shipped facing. */
export const MF = (loc, f) => mathFor(LIT.facing(loc, f));

/**
 * What the grid must draw on ONE facing, computed test-side from that
 * facing's own literals. Row 11 made this per-facing: the wall-floor line
 * runs corner to corner rather than across the frame, and every floor line is
 * clipped to the floor the room actually has — so each row predicate carries
 * the x-range it must be measured over.
 */
export function gridExpectations(loc = "study", f = "S") {
  const m = LIT.facing(loc, f);
  const M = mathFor(m);
  const floorY = M.floorY;
  const eyeY = m.horizon_y * m.image_h_px;
  const gridK = m.px_per_m_at_wall * m.camera_wall_m;
  const dBottom = gridK / m.px_per_m_at_bottom;
  const dWall = m.camera_wall_m;
  const depths = [];
  for (let d = Math.ceil(dBottom / 0.5) * 0.5; d < dWall - 1e-9; d += 0.5) {
    if (d <= dBottom) continue;
    depths.push(d);
  }
  const rowAt = (d) => Math.floor(M.yAtS(gridK / d));
  /* The three farthest (nearest the wall): they have the most floor around
     them, where a near row in a narrow room can be a sliver. Descending
     depth, so the rows ascend down the frame like the old triple did. */
  const chosen = depths.slice(-3).reverse();
  const transverseRows = chosen.map(rowAt);
  const spanAt = (y) => {
    const s = M.sAtY(y);
    return [Math.max(0, M.xAtScale(0, s)), Math.min(LIT.W, M.xAtScale(1, s))];
  };
  const clearRows = [];
  for (let i = 0; i + 1 < transverseRows.length; i++) {
    clearRows.push(Math.floor((transverseRows[i] + transverseRows[i + 1]) / 2));
  }
  return {
    meta: m,
    depths: chosen,
    floorRow: Math.floor(floorY),
    eyeRow: Math.floor(eyeY),
    transverseRows,
    transverseSpans: transverseRows.map(spanAt),
    clearRows,
    clearSpans: clearRows.map(spanAt),
    /* The wall-floor line runs corner to corner, not across the frame. */
    floorSpan: [m.corner_x0_px, m.corner_x1_px],
    cornerCols: [m.corner_x0_px, m.corner_x1_px],
    plainWallRow: 500, // no wall metre-line and not the eye line
    wallCentreCol: 768, // the m = 0 wall vertical, inside every shipped band
    /* The wall-ceiling line: where the facing wall now STOPS going up. Since
       the ceiling ruling the wall is a band between two lines rather than a
       plane running off the top of frame, so every scan for wall ink takes
       its upper bound from here instead of from y 0. */
    ceilRow: Math.ceil(floorY - m.storey_height_m * m.px_per_m_at_wall)
  };
}
