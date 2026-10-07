// DRAFT check (unvetted — for Kabe's vetting before joining the list): src/make/assets.js.
// A throwaway page + a fake "CDN" on another port; the manifest's cdn field points at it.
// Asserts: listed fetch/img go to the CDN; unlisted ones do not; with the CDN answering 404,
// refusing, or hanging, the Pages bytes arrive and the page's window error listeners hear
// NOTHING about the CDN; with no manifest the file is inert. Run: node tests/.assets-hook.mjs
import http from "node:http"; import fs from "node:fs";
import { chromium } from "playwright";
const code = fs.readFileSync(new URL("../src/make/assets.js", import.meta.url), "utf8");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
let mode = "ok", hits = { cdn: 0, pages: 0 };
const cdn = http.createServer((q, r) => { hits.cdn++; if (mode === "404") { r.writeHead(404, { "access-control-allow-origin": "*" }); return r.end("no"); } if (mode === "hang") return;
  r.writeHead(200, { "access-control-allow-origin": "*", "content-type": q.url.endsWith(".png") ? "image/png" : "text/plain" }); r.end(q.url.endsWith(".png") ? PNG : "from-cdn"); }).listen(0);
const pages = http.createServer((q, r) => { const u = q.url.split("?")[0];
  if (u === "/site/") { r.writeHead(200, { "content-type": "text/html" }); return r.end(`<!doctype html><meta charset=utf-8><script src="/site/src/make/assets.js"></script><body>`); }
  if (u === "/site/src/make/assets.js") { r.writeHead(200, { "content-type": "text/javascript" }); return r.end(MANIFEST ? `globalThis.HOLO_ASSET_MANIFEST=${JSON.stringify(MANIFEST)};\n` + code : code); }
  hits.pages++; r.writeHead(200, { "content-type": u.endsWith(".png") ? "image/png" : "text/plain" }); r.end(u.endsWith(".png") ? PNG : "from-pages"); }).listen(0);
let MANIFEST = null;
const b = await chromium.launch(); let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("FAIL", m); } else console.log("ok  ", m); };
async function run(m, withManifest) {
  mode = m; hits = { cdn: 0, pages: 0 };
  MANIFEST = withManifest ? { v: 1, cdn: `http://localhost:${cdn.address().port}/gh@`, groups: { abc: ["data/a.txt", "img/a.png"] } } : null;
  const pg = await (await b.newContext()).newPage();
  await pg.addInitScript(() => { window.__errs = []; window.addEventListener("error", e => window.__errs.push(e.target && e.target.src || "x"), true); });
  await pg.goto(`http://localhost:${pages.address().port}/site/`);
  const r = await pg.evaluate(async () => {
    const t1 = await (await fetch("/site/data/a.txt")).text(), t2 = await (await fetch("/site/data/other.txt")).text();
    const im = (src) => new Promise(res => { const i = new Image(); i.onload = () => res("load"); i.onerror = () => res("error"); i.src = src; });
    const i1 = await im("/site/img/a.png?v=1"), i2 = await im("/site/img/other.png");
    const hdr = await (await fetch("/site/data/a.txt", { headers: { range: "bytes=0-3" } })).text();
    return { t1, t2, i1, i2, hdr, errs: window.__errs.slice(), a: { served: HoloAssets.served, fellBack: HoloAssets.fellBack, files: HoloAssets.files } };
  });
  await pg.context().close(); return r;
}
let r = await run("ok", true);
ok(r.t1 === "from-cdn" && r.i1 === "load" && r.a.served === 2 && r.a.fellBack === 0, "listed fetch + img (with ?v=) come from the CDN");
ok(r.t2 === "from-pages" && r.i2 === "load", "unlisted ones stay on Pages");
ok(r.hdr === "from-pages", "a fetch with headers (Range) is never redirected");
for (const m of ["404", "hang"]) { r = await run(m, true);
  ok(r.t1 === "from-pages" && r.i1 === "load" && r.errs.length === 0 && r.a.fellBack >= 1, `CDN ${m}: Pages bytes arrive, no window error event, ${r.a.fellBack} fell back`); }
r = await run("ok", false);
ok(r.t1 === "from-pages" && r.i1 === "load" && hits.cdn === 0 && r.a.files === 0, "no manifest: inert");
await b.close(); cdn.close(); pages.close(); console.log(bad ? `${bad} FAILED` : "all passed"); process.exit(bad ? 1 : 0);
