// Letting go of vertex arrays the GPU already holds (design/perf/phone-2026.md §4: the page kept ~187 MB of vertex
// arrays on the CPU after uploading them, toward an iPhone tab's ~1.5 GB). Phones by default; ?geodrop=0 keeps
// everything, ?geodrop=1 lets go on a desktop too.
//
// What still reads a mesh's arrays after the first frame, and so what is kept (read 2026-10-08, three r186):
//   - positions and the index, of every mesh: the page raycasts against them. aim() / aimOne() / nearAim() test
//     works.meshes() (the things that work), lookMeshes (the body), the presences' hit columns; goTo(), the double
//     tap, casts against the whole scene (a floor, a wall, any thing, the ground, a hedge); the authoring checks
//     (__seal, __sight, __fight) read them too. A raycast reads positions and the index only: the normals and uvs it
//     interpolates into a hit (hit.normal, hit.uv) are read by nothing here (goTo uses hit.face.normal, which three
//     works out from the positions).
//   - attributes rewritten while playing: the hillside's impostor attributes (an InstancedBufferGeometry: skipped
//     whole), anything dynamic or instanced, anything interleaved.
//   - any attribute the GPU hasn't been sent yet: a mesh's first pass (often the still shadow map, positions only)
//     uploads only what that pass reads; its normals and uvs go up when the main pass first draws it (warm.js compiles
//     the rooms ahead, so that is soon). An attribute goes only once it is uploaded itself.
// What reads none of them: walking (walk.js, terrain.js groundAt, the hillside's and the forecourt's blocked() are
// plan arithmetic), what can be seen (manor.visibleFrom / show: the plan's doorways and stairs), the works' motions
// (a drawer, a door, a candle burning down move or scale their nodes, never their geometry), frustum culling (the
// bounding spheres, made from the positions, which stay), every merge and settle (at build, before the first frame).
//
// So: normals, uvs, colours and the like let go once uploaded; positions and indexes kept. A dropped attribute keeps
// its typed array's type (an empty one: three r186 reads array.constructor / BYTES_PER_ELEMENT when it makes a new
// pipeline, and WebGPU picks the index format by it) and its count (a plain property); it refuses needsUpdate (a
// re-upload would send nothing), with a warning.
import { StaticDrawUsage } from "three/webgpu";
const Q = new URLSearchParams(typeof location === "object" ? location.search : "");

export function geodropWanted(phone) { return Q.get("geodrop") ? Q.get("geodrop") !== "0" : !!phone; }

export function makeGeoDrop(renderer, root, { every = 1500, budget = 3 } = {}) {
  const backend = renderer.backend, done = new WeakSet(), empty = new Map();
  const S = { sweeps: 0, geometries: 0, attributes: 0, dropped: 0, ms: 0, refused: 0 };
  const buf = (a) => a.isInterleavedBufferAttribute ? a.data : a;
  // sent to the GPU: WebGPU's backend keeps a GPUBuffer for it, WebGL 2's a WebGLBuffer
  const uploaded = (a) => { const b = buf(a); if (!backend.has(b)) return false; const d = backend.get(b); return !!(d.buffer || d.bufferGPU); };
  const blank = (arr) => { let e = empty.get(arr.constructor); if (!e) empty.set(arr.constructor, e = new arr.constructor(0)); return e; };
  const droppable = (a) => !a.isInterleavedBufferAttribute && !a.isInstancedBufferAttribute && !a.isStorageBufferAttribute && !a.isStorageInstancedBufferAttribute
    && a.usage === StaticDrawUsage && a.array && a.array.length > 0;
  function drop(a) {
    S.dropped += a.array.byteLength; S.attributes++;
    a.array = blank(a.array);
    Object.defineProperty(a, "needsUpdate", { configurable: true, set(v) { if (v) { S.refused++; console.warn("geodrop: needsUpdate on a vertex array already let go (?geodrop=0 keeps them)", a.name || ""); } } });
  }
  // one geometry: done once every attribute it has is either kept or let go
  function settle(g) {
    if (g.isInstancedBufferGeometry || !g.attributes.position) { done.add(g); return; }
    let left = false;
    for (const [name, a] of Object.entries(g.attributes)) {
      if (name === "position" || !droppable(a)) continue;
      if (uploaded(a)) drop(a); else left = true;
    }
    if (!left) { done.add(g); S.geometries++; }
  }
  let stack = null, timer = null;
  function sweep() {
    const t0 = performance.now();
    if (!stack) { stack = [root]; S.sweeps++; }
    while (stack.length && performance.now() - t0 < budget) {
      const o = stack.pop();
      if (o.isMesh && o.geometry && !done.has(o.geometry) && uploaded(o.geometry.attributes.position || { array: null })) settle(o.geometry);
      for (let i = 0; i < o.children.length; i++) stack.push(o.children[i]);
    }
    if (!stack.length) stack = null;
    S.ms += performance.now() - t0;
    timer = setTimeout(sweep, stack ? 50 : every);
  }
  return {
    start() { if (!timer) timer = setTimeout(sweep, every); },
    stop() { clearTimeout(timer); timer = null; },
    stats: () => ({ ...S, droppedMB: +(S.dropped / 1048576).toFixed(1), ms: Math.round(S.ms) }),
  };
}
