// The host seam over the unchanged vendor queue: local pending writes, not a second world document.
import { openQueue, idbBackend, httpTransport } from "../vendor/patternbuffer/index.mjs";
import { withLock } from "../vendor/patternbuffer/lock.mjs";

const KEYS = ["entity", "attribute", "value", "value_type", "valid_from", "valid_to", "timeless"];
export const recordItems = (facts) => facts.map(f => Object.fromEntries(KEYS.filter(k => Object.hasOwn(f, k)).map(k => [k, structuredClone(f[k])])));

// Both ends must be this machine. No default endpoint, credentials, query, fragment, or redirect to another host.
export function localPbUrl(pb, hostname) {
  if (!pb) return null;
  const u = new URL(pb), local = /^(localhost|127\.0\.0\.1)$/;
  if (!local.test(hostname) || !local.test(u.hostname) || !["http:", "https:"].includes(u.protocol) || u.username || u.password || u.search || u.hash)
    throw new Error("pattern-buffer: ?pb needs an http(s) loopback URL on a localhost/127.0.0.1 page");
  return u.href;
}

export async function openFactsQueue({ worldId, pb = null, hostname = "", backend = idbBackend("holo-emitter/patternbuffer"), fetch: fetchFn = globalThis.fetch } = {}) {
  let error = null, refused = 0, base = null, transport = null;
  const report = (e) => { error = e?.message || String(e); console.warn("pattern-buffer:", error); };
  const onRefused = (call) => { refused++; error = "the service refused a queued record; removed from pending"; console.warn("pattern-buffer:", error, call); };
  // These names must be configured on the supplied runner for this world: worldId namespaces storage, not the wire.
  const recorder = await openQueue({ backend, worldId, session: "holo-play", role: "recorder", onRefused });
  const author = await openQueue({ backend, worldId, session: "holo-author", role: "author", onRefused });
  try { base = localPbUrl(pb, hostname);
    if (base) transport = httpTransport(base, { fetch: (url, init) => fetchFn(url, { ...init, redirect: "error", credentials: "omit" }) });
  } catch (e) { report(e); }

  let writes = Promise.resolve(), sending = null, again = false;
  // Network never holds up enqueueing or the diagnostic's persistence barrier. Only explicit ?pb enables a flush.
  function flush() {
    if (!transport) return Promise.resolve();
    again = true;
    if (sending) return sending;
    sending = (async () => { while (again) { again = false; await author.flush(transport); await recorder.flush(transport); } })()
      .catch(report).finally(() => { sending = null; });
    return sending;
  }
  const enqueue = (fn) => { writes = writes.then(fn).then(() => { void flush(); }).catch(report); };
  const summary = (calls) => { const items = calls.flatMap(c => c.args.items); return { pending: items.length, calls: calls.length, items: items.slice(-10) }; };
  // Reloading does not discard unsent facts, even with ?fresh. IndexedDB durability is separate from eviction protection.
  try { await recorder.pending(); await author.pending(); } catch (e) { report(e); }
  void flush();
  return {
    record(facts) { if (!facts.length) return; const items = recordItems(facts); enqueue(() => recorder.add(items)); },
    author(facts) { if (!facts.length) return; const items = recordItems(facts), signature = JSON.stringify(items), key = `holo:placements:${encodeURIComponent(worldId)}`;
      enqueue(() => withLock(backend, key, async () => {
        if (await backend.get(key) === signature) return;
        await author.add(items, { frame: "canon" });
        // Add before marking: a crash may repeat a batch, never silently lose it (the queue is at least once).
        await backend.put(key, signature);
      })); },
    flush,
    async snapshot() { await writes;
      const state = { worldId, persisted: recorder.persisted, transport: base, error, refused };
      try { return { ...state, ...summary(await recorder.pending()), author: summary(await author.pending()) }; }
      catch (e) { report(e); return { ...state, pending: null, calls: null, items: [], author: null, error }; }
    },
  };
}
