import { test as base, expect } from "@playwright/test";
import { mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const appUrl = (root = repoRoot) =>
  pathToFileURL(join(root, "index.html")).href;

/** Copy the runnable tree (index.html, src/, fixtures/, tools/) into a fresh
 * scratch directory so a test can edit viewstate.json and re-bake without
 * ever mutating the repo tree. Caller gets the path; cleanup is automatic
 * at process exit via the OS tmpdir, and we also remove eagerly. */
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
    renderDirect(viewstate, canvas) {
      const c = canvas || document.createElement("canvas");
      c.width = 1536;
      c.height = 1024;
      const fx = window.HOLO_FIXTURE;
      window.HOLO.renderer.render(c, fx.world, fx.staging, {}, {}, viewstate, {});
      return c;
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
 * - every page carries the no-network guard (§12.7 first half): any http(s)
 *   request in any test fails the run. */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(IN_PAGE);
    const httpRequests = [];
    context.on("page", (p) => {
      p.on("request", (req) => {
        if (/^https?:\/\//.test(req.url())) httpRequests.push(req.url());
      });
    });
    await use(context);
    expect(httpRequests, "zero network requests (§12.7)").toEqual([]);
  }
});

export { expect };

/* §5 literals, derived independently of GRID_META (§12.5's independence rule:
 * tests assert literals, never the renderer's constant). */
export const LIT = {
  H: 1024,
  W: 1536,
  floor_line_y: 0.63,
  horizon_y: 0.48,
  px_per_m_at_wall: 96,
  px_per_m_at_bottom: 210,
  k: 336 // the grid-drawing constant, from the plan
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
