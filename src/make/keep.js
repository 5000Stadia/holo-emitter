// What a load works out once and need not work out again (R65): small tables (the kinds' sizes and swings, a room's
// placement), each signed by the code that makes them and the data it reads. Two sources, tried in order:
//   - shipped: worked out at authoring for our own places (tools/keep-tables.mjs), a JSON file beside the page;
//   - kept: worked out on an earlier visit in this browser (a place generated live has no authoring step).
// A table is used only when its signature is this code's: every module its maker imports, followed from the entry
// modules named (their text, hashed), and the inputs the caller names. Anything missing is worked out as before and
// kept for the next visit, so a stale or absent table costs the old time, never a wrong house.
//   signOf(entries, inputs) -> Promise<{ sig, files }>     entries: module paths from the site root; inputs: any JSON
//   kept(name, sig, { shipped }) -> Promise<data | null>
//   keep(name, sig, data)
import { fnv } from "./id.js";

const ROOT = new URL("../../", import.meta.url);
const hashText = (s) => fnv(s).toString(36) + fnv(s, 0x9747b28c).toString(36);
const source = new Map();
const read = (f) => { if (!source.has(f)) source.set(f, fetch(new URL(f, ROOT)).then(r => r.ok ? r.text() : `missing:${f}`).catch(() => `missing:${f}`)); return source.get(f); };
// (the modules this page has already loaded, so each fetch is the browser's cache; only our own, relative imports:
// three is pinned by version in the page)
export async function signOf(entries, inputs = null) {
  const seen = new Set(), queue = [...entries];
  while (queue.length) { const f = queue.shift(); if (seen.has(f)) continue; seen.add(f);
    const text = await read(f);
    for (const m of text.matchAll(/(?:^|[;\s])(?:import|export)\s[^;]*?from\s*["'](\.{1,2}\/[^"']+)["']/g)) queue.push(new URL(m[1], new URL(f, ROOT)).pathname.replace(ROOT.pathname, "")); }
  const files = [...seen].sort(), texts = await Promise.all(files.map(read));
  return { sig: hashText(files.map((f, i) => `${f}\n${hashText(texts[i])}`).join("\n") + "\n" + JSON.stringify(inputs)), files };
}
const KEY = (name) => `holo/keep/${name}`;
export async function kept(name, sig, { shipped = null } = {}) {
  if (shipped) { try { const r = await fetch(new URL(shipped, ROOT)); if (r.ok) { const t = await r.json(); if (t.sig === sig) return t.data; } } catch (_) {} }
  try { const t = JSON.parse(localStorage.getItem(KEY(name)) || "null"); if (t?.sig === sig) return t.data; } catch (_) {}
  return null;
}
export function keep(name, sig, data) { try { localStorage.setItem(KEY(name), JSON.stringify({ sig, data })); } catch (_) {} }
