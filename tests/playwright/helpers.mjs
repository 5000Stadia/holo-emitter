import { test as base, expect } from "@playwright/test";
import { mkdirSync, mkdtempSync, cpSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/* THE WORLD A SPEC OPENS, and why it is written down here.
 *
 * [Row 21] The page carries two baked worlds and the bare URL boots the
 * painted navigation one — that is what the live link serves. Every spec
 * written before this row is about the FURNISHED world: the drawer, the key,
 * the chair refusal, the two staged overlap pairs. So `appUrl` asks for that
 * world by name, and the specs that are about what a visitor actually opens
 * use `navUrl` (no query at all), which is the only URL nobody has to
 * remember. A spec that says nothing gets the world it was written against;
 * the default the product ships is tested deliberately rather than by
 * accident. */
export const appUrl = (root = repoRoot) =>
  pathToFileURL(join(root, "index.html")).href + "?world=demo-study";

/** The bare URL — the painted navigation world, exactly as a visitor opens it. */
export const navUrl = (root = repoRoot) =>
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
  /* [Row 21] The promoted paintings and their metas. Both halves are needed
     and for different reasons: `backdrops/<loc>/<facing>.meta.json` is a BAKE
     input (the meta resolution's first tier), so a staged tree without it
     bakes a different fixture.js from the committed one; and
     `backdrops/baked.js` is a script the page loads, so a staged tree without
     it fires the boot handler's missing-module fault and every test in that
     tree reads an apology instead of a room. `source/` is the asset seat's
     lane — candidates, not backdrops — and is 20 MB of it, so it stays. */
  cpSync(join(repoRoot, "backdrops"), join(dir, "backdrops"), {
    recursive: true,
    filter: (src) => !src.split(/[\\/]/).includes("source")
  });
  /* [Row 42] The ingested library, for the same two reasons the backdrops are
     copied: `library/baked.js` is a script the page loads, so a staged tree
     without it fires the boot handler's missing-module fault and every test in
     that tree reads an apology instead of a room; and `library/<id>/record.json`
     is what `src/placeholders.js` resolves an id to under `require`, so a
     staged tree without it bakes fixtures against a DIFFERENT record from the
     committed one. `promoted.json` comes with them because it is what decides
     which of the two the page draws. */
  cpSync(join(repoRoot, "library"), join(dir, "library"), { recursive: true });
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

/* ------------------------------------------------------------------ */
/* IS THE COMMITTED ARTIFACT STILL A DESCRIPTION OF THE STORE?         */
/* ------------------------------------------------------------------ */
/**
 * [production law clause 6] The one freshness question, asked one way.
 *
 * A dozen committed files in this repository are GENERATED FROM the promoted
 * store — the material provenance report, the legacy ledger, the room
 * consistency measure and its README, the window calibration, the snapped and
 * repaired readings, the edge-strip records in `retries.json`, the bakes. Eight
 * cases across six spec files compare one of those artifacts against something
 * live, and every one of them was red on `main` whenever the manor loop had run
 * and green on a frozen tree — because the loop moved the store and nothing
 * regenerated what the store's movement invalidated.
 *
 * The cases were not wrong to compare. What they could not say is WHICH of the
 * two failures they had found: the machine failed to regenerate an artifact, or
 * the claim the artifact carries has actually stopped being true. This helper is
 * that sentence, and it is the SAME sentence `tools/publish-site.sh` refuses on
 * and the same one `row23_run.py --derive-check` prints, because all three read
 * `design/plan-draft/measured/derived.py`. A case that calls this first is red
 * for staleness only when the machine failed, and red for its own claim only
 * when the claim is false.
 *
 * It writes nothing, and on this corpus it costs about a quarter of a second.
 */
export function derivedFreshness(id) {
  const out = execFileSync("python3", [
    join(repoRoot, "design", "plan-draft", "measured", "derived.py"),
    "--check", "--json", "--only", id
  ], { cwd: repoRoot, encoding: "utf8", env: { ...process.env, HOLO_TIMINGS: "off" },
    stdio: ["ignore", "pipe", "pipe"] });
  const doc = JSON.parse(out);
  const rec = doc.artifacts.find((a) => a.id === id);
  if (!rec) throw new Error(`derived.py knows no artifact called ${id}`);
  return rec;
}

/** Assert it, with the reason and the command that remakes it. */
export function expectDerived(id) {
  const rec = derivedFreshness(id);
  const why = (rec.why || []).map(([p, w]) => `\n    ${p}: ${w}`).join("");
  expect(rec.state,
    `${id} is ${rec.state} against the store, so what this case is about cannot be ` +
    `asked yet. This is the MACHINE failing to regenerate a derived artifact, not ` +
    `the claim below being false — the loop is meant to do it after any pass that ` +
    `promoted, superseded, re-snapped or void-repaired anything.${why}\n` +
    `  remake: ${rec.regen}`).toBe("fresh");
  return rec;
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
      /* [row 42] `fx` horizontally, `f` vertically — the same number for
         everything §4 places, and two numbers for a leaf or casement fitted to
         a painted rectangle. */
      const fx = entry.fx == null ? entry.f : entry.fx;
      if (entry.swap) {
        x = entry.drawX + fx * entry.swap.origin.x;
        y = entry.drawY + entry.f * entry.swap.origin.y;
        w = fx * entry.swap.image.width;
        h = entry.f * entry.swap.image.height;
      } else {
        x = entry.drawX;
        y = entry.drawY;
        w = fx * entry.record.px.w;
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
    /* [Row 15] AND IT MAY BE ASKED FOR A NAMED EXIT. It returned `list[0]`
       whatever was wanted, which was harmless while every facing carried at
       most one way through and is not now: eight facings of the manor carry
       two, and a spec asking for one could walk the other and pass. */
    aperturePoint(exitId) {
      const A = window.HOLO_APP;
      const list = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate);
      if (!list.length) return null;
      const a = exitId ? list.find((x) => x.exit === exitId) : list[0];
      if (!a) return null;
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

/* WALK THERE; DO NOT ASSERT FROM THE DOOR-MAT.
 *
 * [Rows 15/19] Several of `manor.spec`'s first-draft cases computed all
 * eighty-eight facings analytically, never left the boot facing, and then
 * asserted a property of "the page" — a property that could only ever be false
 * somewhere they had not gone. A recheck reinstated the exact defect one of
 * them was written for and the whole suite stayed green. So a claim about what
 * the PAGE DOES stands on the facing it is about, reached by real intents, with
 * the go veil given time to settle.
 *
 * [Row 25] Lifted here from `manor.spec` when a second spec needed the same
 * walk: a claim about a facing the stair spec stands on has to be reached the
 * same way the manor's claims are, and two copies of a walk is two places for
 * "we never actually got there" to hide. */
export async function standAt(page, room, facing) {
  const path = await page.evaluate(({ room }) => {
    const A = window.HOLO_APP, W = A.harness.world;
    const start = A.harness.viewstate.location;
    const prev = new Map([[start, null]]);
    const q = [start];
    while (q.length) {
      const cur = q.shift();
      if (cur === room) break;
      for (const ex of (W.locations.find((l) => l.id === cur).exits || [])) {
        if (!prev.has(ex.to)) { prev.set(ex.to, [cur, ex.id]); q.push(ex.to); }
      }
    }
    if (!prev.has(room)) throw new Error(`no walked route to ${room}`);
    const out = [];
    for (let c = room; prev.get(c); c = prev.get(c)[0]) out.unshift(prev.get(c)[1]);
    return out;
  }, { room });
  for (const id of path) {
    const want = await page.evaluate((id) => {
      const A = window.HOLO_APP, W = A.harness.world;
      return (W.locations.find((l) => l.id === A.harness.viewstate.location).exits || [])
        .find((e) => e.id === id).facing;
    }, id);
    for (let i = 0; i < 4; i++) {
      const f = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
      if (f === want) break;
      await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "right" }));
      await page.waitForTimeout(120);
    }
    await page.evaluate((id) => window.HOLO_APP.dispatch({ type: "go", exit: id }), id);
    await page.waitForTimeout(450);
  }
  for (let i = 0; i < 4; i++) {
    const f = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
    if (f === facing) break;
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "right" }));
    await page.waitForTimeout(150);
  }
  const at = await page.evaluate(() =>
    window.HOLO_APP.harness.viewstate.location + "/" + window.HOLO_APP.harness.viewstate.facing);
  expect(at, "the walk arrived where the case says it stands").toBe(`${room}/${facing}`);
}

/** A real click at a scene-canvas point, scaled to wherever the stage is. */
export async function clickCanvasPoint(page, pt) {
  const box = await page.locator("#scene").boundingBox();
  await page.mouse.click(box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024);
}

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
 *     authored: horizon 526.1/1024, eye 1.183 m, a 1024 px lens, and
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
     y 526.1 of 1024 by the CEILING-RAMP FIT, which the Navigator ruled in
     over the vanishing-point vote: the two disagree by up to 66 px across the
     eight frames and the ramp fit closes at a 0.3 px residual. */
  horizon_y: 526.1 / 1024,
  /* THE DRAWING CAMERA'S EYE HEIGHT, MEASURED. Blueprint §5 [HUMAN,
     2026-08-20] rules that the geometry is determined by the orientation of
     the approved image generation; row 20 measured 1.08775 m off the low-eye
     `study/N`, and [HUMAN 2026-08-22, design/approvals.log at 964188d] "B"
     replaced that camera with the standing eye. The frame that ruling names is
     `backdrops/source/study-N/cand-5-reference.png`, and the standing-eye wave
     measured it by the same ceiling-ramp instrument: horizon y 526.1 of 1024
     at a 0.30/0.29 px residual, eye 1.183 m. Both numbers here are typed from
     `design/plan-draft/measured/cand5ref/study-N.json`, never imported. */
  eye_m: 1.183,
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
  floor_line_y: 526.1 / 1024 + 1.183 * (1024 / 4.0) / 1024,
  px_per_m_at_bottom: (1024 - 526.1) / 1.183,
  wall_width_m: 16,
  k: 1024,      // px_per_m_at_wall × camera_wall_m — the focal length itself
  /* Every planned facing's room height [HUMAN 2026-08-21] — `plan.floors[].
     storey_height_m`, the same on both floors. */
  storey_height_m: 2.8,

  /* [wall_width_m, camera_wall_m, facing_type, standpoint_offset_m], typed from
     the approved standpoints table as row 20's standpoint law rebuilt it and
     row 26 extended it. study N/S and hall N/S stand at the far side of their
     rooms because their walls do not fit the frame from the drawn standpoint;
     study E/W and hall E/W keep the drawn one because theirs do. study/S is
     3.85 rather than 4.35 because the chimney breast is behind you on that
     facing and you cannot stand in it.

     [ROW 26] AND THE FOURTH NUMBER IS WHERE ALONG THE WALL THE BODY STANDS.
     The passage's two doors sit near one end of an 8.00 m room, so a viewer on
     its cross-axis centre saw 54 px of a 476 px doorway; the standpoint law
     slides the body instead. Typed from `design/plan-draft/standpoints.tsv`
     like the distances beside it — the committed artifact, so a re-derivation
     that moves it turns this file red rather than sliding through. Omitted
     means zero, which is where 86 of the manor's 88 facings stand. */
  FACINGS: {
    "study/N": [5.45, 4.35, "enclosed"],
    "study/E": [4.80, 4.09, "enclosed"],
    "study/S": [5.45, 3.85, "enclosed"],
    "study/W": [4.80, 4.09, "enclosed"],
    "hall/N": [8.00, 2.15, "enclosed", 0.93],
    "hall/E": [2.60, 6.00, "corridor"],
    "hall/S": [8.00, 2.15, "enclosed", 1.43],
    "hall/W": [2.60, 6.00, "corridor"]
  },
  facingKeys() { return Object.keys(LIT.FACINGS); },

  /* [Row 21] THE FACINGS THAT ARE PAINTED, and their numbers are MEASURED, so
     they cannot be computed from the lens the way the rest of this block is.
     Typed by hand from the committed `backdrops/<loc>/<facing>.meta.json` —
     which `tools/promote-backdrop.mjs` generates from
     `design/plan-draft/measured/<loc>-<facing>.json`, and which is a
     measurement of a painting rather than an answer from the code these tests
     check. Exactly the same rule as the standpoints above: typed from the
     committed artifact, so a re-measurement that moves the camera turns this
     file red instead of sliding through.

     THE STANDING-EYE WAVE REPLACED ONE PAINTED FACING WITH THREE. [HUMAN
     2026-08-22] "B" supersedes the low-eye `study/N` row 21 promoted; the
     study's north, east and west walls are now painted, all three at the
     standing camera measured off `cand-5-reference`. What moved, worth seeing
     in one place: the scale, by −20 % (188.421 px/m on the north wall where
     the ruled 24 mm lens at the drawn 4.35 m would draw 235.402) — the
     generator drew the standing-eye brief with a WIDER LENS rather than a
     higher camera, and that divergence between a painted facing and an
     unpainted one is the largest this project has carried. The band that
     admits it is ±8 % around the reference's own 819.6 px, not around the
     ruled 1024.

     AND study/E IS ADMITTED AND NOT PROMOTED, which is why it is not here.
     The cand-6 gate passes it at +1.9 % focal and −3.8 % eye, and its painted
     doorway stands 1.11 m from where the approved plan puts it — so promoting
     it cuts the furnished world's aperture at the LEAF's staged rectangle,
     1.11 m from the hole the painting draws, and the demo shows a hole beside
     a painted door. §11's "the painted opening must coincide with the click
     target" is what that breaks. The plan is the document that moves (row 22
     already carries the hearth's amendment) and that is Kabe's redline, not an
     agent's, so the wall waits. */
  MEASURED: {
    "study/N": {
      px_per_m_at_wall: 188.421,
      floor_line_y: 0.731445,
      horizon_y: 0.51377,
      px_per_m_at_bottom: 420.88,
      corner_x0_px: 188,
      corner_x1_px: 1351,
      /* The storey the PAINTING draws — 3.349 m against the plan's ruled 2.80,
         which is the warn-tier disagreement the meta records in
         `measured_room`. Typed here because a test that wants to point a scan
         at the painting's own wall-ceiling junction has to know where the
         painting put it, and the declared storey puts it far higher. */
      measured_storey_m: 3.349,
      nearest_floor_m: 1.9474,
      calibration_px: 179,
      measured: true
    },
    "study/W": {
      px_per_m_at_wall: 192.632,
      floor_line_y: 0.731445,
      horizon_y: 0.515332,
      px_per_m_at_bottom: 432.01,
      corner_x0_px: 186,
      corner_x1_px: 1351,
      measured_storey_m: 3.271,
      nearest_floor_m: 1.8237,
      calibration_px: 183,
      measured: true
    }
  },

  /** The meta a shipped facing must have, computed here from the two typed
   *  numbers and the camera — never read off the code. */
  facing(loc, f) {
    const key = typeof f === "string" ? loc + "/" + f : loc;
    const row = LIT.FACINGS[key];
    if (!row) throw new Error("no test-side literals for " + key);
    const [wall_width_m, camera_wall_m, facing_type, offset] = row;
    /* THE LENS: pixels per metre is a consequence of how far away the wall is,
       not a constant. This is row 20 in one line. */
    const px = LIT.focal_px / camera_wall_m;
    const half = (wall_width_m / 2) * px;
    /* [Row 26] The eye's own displacement along the wall, in pixels at the
       wall plane: the wall's centre sits that far to the other side of the
       frame's centre, which is what moves the corners below. */
    const eye = offset || 0;
    const eyeShift = eye * px;
    return {
      key, wall_width_m, camera_wall_m, facing_type,
      eye_offset_m: eye,
      storey_height_m: LIT.storey_height_m,
      px_per_m_at_wall: px,
      /* And so is the floor line: it sits eye-height below the horizon AT WALL
         SCALE, so a near wall puts it lower in the frame. Under the pinned
         scale it was the same number on all eight facings. */
      floor_line_y: LIT.horizon_y + LIT.eye_m * px / LIT.H,
      px_per_m_at_bottom: LIT.px_per_m_at_bottom,
      horizon_y: LIT.horizon_y,
      image_h_px: LIT.H,
      corner_x0_px: LIT.W / 2 - eyeShift - half,
      corner_x1_px: LIT.W / 2 - eyeShift + half,
      /* The intention's "camera has feet" number: where the floor first
         appears in front of the viewer. Under a pinned lens it is
         `f / px_per_m_at_bottom` — the lens and the horizon decide it and the
         standpoint does not — so it is the SAME on every facing in the manor,
         where it used to be fifteen different anomalies. */
      nearest_floor_m: LIT.focal_px / LIT.px_per_m_at_bottom,
      measured: false,
      /* What the LENS says this facing's scale would be, kept beside the
         measured one so a test can say how far the painting is from the ruled
         camera without re-deriving it. On a facing with no painting the two
         are the same number by construction. */
      derived_px_per_m_at_wall: px
    };
  }
};

/* A painted facing's meta is its measurement, overlaid on the derivation. The
   overlay is here rather than inside `facing()` so the derived answer stays
   readable beside it: what is measured, what is the building's, and where they
   differ, all in one place. */
const _facing = LIT.facing.bind(LIT);
/** The meta a facing's geometry IMPLIES — the lens, the standpoint, the plan —
 *  with no painting in it. This is what `plan-projection` derives and what
 *  `projection.md` prints, and it stays reachable because a painted facing has
 *  both numbers and a reader needs to be able to name which one it means. */
LIT.derivedFacing = (loc, f) => _facing(loc, f);
LIT.facing = function (loc, f) {
  const m = _facing(loc, f);
  const over = LIT.MEASURED[m.key];
  return over ? Object.assign(m, over) : m;
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
    /* [Row 26] The eye's own term, re-derived here rather than imported like
       everything else in this file. A body δ metres to the side of the room's
       axis moves a point at scale `s` by −δ·s; `centre` already carries the
       wall-plane half of that (the corners are measured from the drawn sheet),
       so what is left is the depth dependence, zero at the wall plane. Without
       it this arithmetic would agree with the renderer on the wall and
       disagree with it on the floor — which is the one place an independent
       re-derivation is worth having. */
    xAtScale(u, s) {
      return centre + (u - 0.5) * span * (s / m.px_per_m_at_wall)
        - (m.eye_offset_m || 0) * (s - m.px_per_m_at_wall);
    },
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
