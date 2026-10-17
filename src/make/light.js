// Bounce light by state, on the GPU (design/production/plan.md §3; R48 step 6): one of three's
// LightProbeGrid (r186) per light group (the sun, each window's sky, each candle), each baked with
// only its own lights on and the others' grids dark. A grid is a light, so the scene takes the sum,
// each grid's intensity its group's weight times the scale: a shutter closed, a candle lit, relights
// the room with no new bake. The same face as lab/painted/gi.js (bakeGroups, setWeights, setScale),
// so a page swaps one for the other; the WebGL renderer keeps gi.js.
import { LightProbeGrid } from "three/addons/lighting/LightProbeGrid.js";

export function makeProbeGI({ min, max, n = [5, 3, 5] }) {
  const grids = new Map(), weights = {};
  let scale = 1;
  const size = [0, 1, 2].map(a => max[a] - min[a]), centre = [0, 1, 2].map(a => (max[a] + min[a]) / 2);
  const apply = () => { for (const [name, g] of grids) g.intensity = (weights[name] ?? 1) * scale; };
  // groups: { name: [lights and glowing meshes] }
  async function bakeGroups(renderer, scene, groups, { onStep = () => {}, scale: s = 1, bounces = 1, cubemapSize = 16 } = {}) {
    scale = s;
    const t0 = performance.now(), all = Object.values(groups).flat(), was = new Map(all.map(o => [o, o.visible]));
    for (const name of Object.keys(groups)) {
      const g = new LightProbeGrid(...size, ...n); g.position.set(...centre); scene.add(g); grids.set(name, g);
    }
    for (const [name, members] of Object.entries(groups)) {
      onStep(`bouncing the light · ${name}`); await new Promise(r => setTimeout(r));
      for (const o of all) o.visible = members.includes(o);
      for (const [other, g] of grids) g.visible = other === name;     // only its own grid, for its bounce pass; never another group's
      grids.get(name).bake(renderer, scene, { cubemapSize, bounces, near: 0.05, far: 30 });
    }
    for (const [o, v] of was) o.visible = v;
    for (const g of grids.values()) g.visible = true;
    apply();
    return { ms: Math.round(performance.now() - t0), groups: grids.size, probes: n[0] * n[1] * n[2] };
  }
  const setWeights = (ws) => { Object.assign(weights, ws); apply(); };
  return { install: () => {}, bakeGroups, setWeights, weights, setScale: (s) => { scale = s; apply(); } };
}
