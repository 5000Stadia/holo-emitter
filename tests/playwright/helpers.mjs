import { test as base, expect } from "@playwright/test";
import { mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const appUrl = (root = repoRoot) =>
  pathToFileURL(join(root, "index.html")).href;

/** Viewport for every pointer-driven spec (plan §8): the canvas displays at
 * scale 1, so canvas pixels are CSS pixels and small takeables stay
 * clickable. 1024 + 9.6rem bottom chrome ≈ 1178; 1200 gives headroom. */
export const POINTER_VIEWPORT = { width: 1536, height: 1200 };

/** Copy the runnable tree (index.html, src/, fixtures/, tools/) into a fresh
 * scratch directory so a test can edit fixtures and re-bake without ever
 * mutating the repo tree. */
export function stageTree() {
  const dir = mkdtempSync(join(tmpdir(), "holo-emitter-"));
  for (const p of ["index.html", "src", "fixtures", "tools"]) {
    cpSync(join(repoRoot, p), join(dir, p), { recursive: true });
  }
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
    /* Direct pure render of an arbitrary (possibly doctored) world/staging. */
    renderW(world, staging, viewstate, options, canvas) {
      const c = canvas || document.createElement("canvas");
      c.width = 1536;
      c.height = 1024;
      window.HOLO.renderer.render(
        c, world, staging, window.__T.lib(), {}, viewstate, options || {});
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
        window.HOLO_APP.library, window.HOLO.renderer.GRID_META,
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
    /* Fraction of pixels in a horizontal band (rows y-1..y+1) whose red
     * channel exceeds the base by a threshold — the blend-tolerant line
     * predicate. Base colours are darker than any key_tint blend. */
    lineFraction(canvas, y, x0 = 0, x1 = null) {
      const W = canvas.width;
      if (x1 === null) x1 = W;
      const data = canvas.getContext("2d").getImageData(x0, y - 1, x1 - x0, 3).data;
      const cols = x1 - x0;
      let hit = 0;
      for (let x = 0; x < cols; x++) {
        for (let r = 0; r < 3; r++) {
          if (data[(r * cols + x) * 4] > 40) { hit++; break; }
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
      need(T.lineFraction(canvas, exp.floorRow) > 0.9, "floor line row");
      need(T.lineFraction(canvas, exp.eyeRow) > 0.9, "eye line row");
      for (const r of exp.transverseRows) {
        need(T.lineFraction(canvas, r) > 0.9, "transverse row " + r);
      }
      for (const r of exp.clearRows) {
        need(T.lineFraction(canvas, r) < 0.1, "clear row " + r);
      }
      need(T.rowMean(canvas, exp.eyeRow) > T.rowMean(canvas, exp.plainWallRow) + 30,
        "eye line brighter than plain wall row");
      need(T.colFraction(canvas, exp.wallCentreCol, 0, exp.eyeRow - 60) > 0.9,
        "vertical metre line at wall centre");
      return out;
    }
  };
};

/* Suite-wide fixtures:
 * - every page the suite opens carries the in-page utilities;
 * - every page carries the no-network guard (§12.7 first half): any request
 *   to a non-local scheme, and any WebSocket (which emits no request event),
 *   in any test fails the run. */
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
export const LIT = {
  H: 1024,
  W: 1536,
  floor_line_y: 0.63,
  horizon_y: 0.48,
  px_per_m_at_wall: 96,
  px_per_m_at_bottom: 210,
  wall_width_m: 4.2,
  camera_wall_m: 3.5, // the pinned grid-canonical camera distance (plan §2)
  k: 336 // the grid-drawing constant = px_per_m_at_wall * camera_wall_m
};

/* Test-side re-implementation of the ground-plane math from the literals —
 * never an import of src/groundplane.js. */
export const MATH = {
  floorY: LIT.floor_line_y * LIT.H,
  sAtY(y) {
    return LIT.px_per_m_at_wall +
      ((y - MATH.floorY) / (LIT.H - MATH.floorY)) *
      (LIT.px_per_m_at_bottom - LIT.px_per_m_at_wall);
  },
  yAtS(s) {
    return MATH.floorY +
      ((s - LIT.px_per_m_at_wall) / (LIT.px_per_m_at_bottom - LIT.px_per_m_at_wall)) *
      (LIT.H - MATH.floorY);
  },
  sAtDepth(d) {
    return LIT.px_per_m_at_wall * LIT.camera_wall_m / (LIT.camera_wall_m - d);
  },
  yAtDepth(d) { return MATH.yAtS(MATH.sAtDepth(d)); },
  xAtU(u, y) { return LIT.W / 2 + (u - 0.5) * LIT.wall_width_m * MATH.sAtY(y); },
  /* Full placement of a floor/wall entity from staging + record data. */
  place(placement, record) {
    let baselineY;
    if (placement.attachment === "floor_against") {
      baselineY = MATH.yAtDepth(record.dims_m.d);
    } else if (placement.attachment === "floor_free") {
      baselineY = MATH.yAtDepth(placement.depth_m);
    } else { // wall_mounted
      baselineY = MATH.floorY - (placement.v || 0) * LIT.px_per_m_at_wall;
    }
    const s = MATH.sAtY(baselineY);
    const heightPx = record.dims_m.h * s;
    const f = heightPx / record.px.h;
    const baseX = MATH.xAtU(placement.u, baselineY);
    return {
      baselineY, s, heightPx, f, baseX,
      drawX: baseX - f * record.anchors.base.x,
      drawY: baselineY - f * record.anchors.base.y
    };
  }
};

export function gridExpectations() {
  const floorY = LIT.floor_line_y * LIT.H; // 645.12
  const eyeY = LIT.horizon_y * LIT.H; // 491.52
  const floorRow = Math.floor(floorY); // 645
  const eyeRow = Math.floor(eyeY); // 491
  const transverseRows = [];
  for (const d of [3.0, 2.5, 2.0]) {
    const scale = LIT.k / d;
    const t = (scale - LIT.px_per_m_at_wall) /
      (LIT.px_per_m_at_bottom - LIT.px_per_m_at_wall);
    transverseRows.push(Math.floor(floorY + t * (LIT.H - floorY)));
  }
  return {
    floorRow,
    eyeRow,
    transverseRows, // [698, 772, 884]
    clearRows: [
      Math.floor((transverseRows[0] + transverseRows[1]) / 2),
      Math.floor((transverseRows[1] + transverseRows[2]) / 2)
    ],
    plainWallRow: 500, // no wall metre-line (549, 453) and no eye line here
    wallCentreCol: 768
  };
}
