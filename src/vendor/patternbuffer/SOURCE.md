# Source

Copied unchanged from [5000Stadia/pattern-buffer](https://github.com/5000Stadia/pattern-buffer).

- Commit: `e12277b551cd1cab17c241f8fc3d627c4f7e2d94`.
- Source path: `js/patternbuffer/` (`*.mjs` and `README.md`).
- Licence: MIT, copyright (c) 2026 5000Stadia. The complete, unchanged notice from the repository's root `LICENSE` is included as [LICENSE](LICENSE).

Updates are copied whole from that source path at a recorded commit, never hand-edited here. Host-specific integration lives outside this directory; only this provenance file is maintained locally.

## Host wiring

`src/make/patternbuffer.js` keeps `holo-play` (recorder) separate from `holo-author` (author). The IndexedDB queue is local by default. An explicit `?pb=<url>` enables transport only when both the page and the HTTP(S) endpoint are localhost or 127.0.0.1; redirects are refused.

`await window.__pbQueue()` waits for local enqueue commits, then reports pending recorder facts and the last ten items, with author placements separate. It does not wait for network delivery. The `persisted` flag reports eviction protection, not whether an IndexedDB transaction committed. `?fresh` does not discard unsent calls. Storage failures and service refusals are visible in the console and diagnostic; a failed storage write is not automatically retried. Network failures leave calls pending.

The standalone runner must serve this same world and declare those exact session names:

```sh
python -m patternbuffer.service --world PATH --world-id ID --view-frame knows:person:player --recorder holo-play --author holo-author
```

`worldId` namespaces local storage; it is not sent in the call body. One runner serves one world. A missing session declaration produces a visible refusal. Under a host author such as construct, play events go to that host instead; recorder sessions are a standalone-runner facility.
