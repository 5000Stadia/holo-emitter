// A baked irradiance grid: real bounce light for a code-built room, computed from the room itself.
// Probes on a grid each capture a small cube map of the scene as it is lit (sun, sky in the glass,
// window light); the capture becomes 9 spherical-harmonic coefficients per probe, kept in a float
// texture. Every standard material then adds, as indirect diffuse light, the trilinear blend of the
// 8 nearest probes evaluated for its world normal. A second pass re-captures with the first bounce
// on, so light goes round twice. It replaces hand-placed "bounce" softboxes.
import * as THREE from "three";
import { LightProbeGenerator } from "three/addons/lights/LightProbeGenerator.js";

export function makeGI({ min, max, n = [4, 3, 4] }) {
  const count = n[0] * n[1] * n[2];
  const data = new Float32Array(9 * count * 4);
  const tex = new THREE.DataTexture(data, 9, count, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.needsUpdate = true;
  const U = {
    uGITex: { value: tex }, uGI: { value: 0 },
    uGIMin: { value: new THREE.Vector3(...min) }, uGIMax: { value: new THREE.Vector3(...max) }, uGIN: { value: new THREE.Vector3(...n) },
  };
  const probes = [];
  for (let k = 0; k < n[2]; k++) for (let j = 0; j < n[1]; j++) for (let i = 0; i < n[0]; i++)
    probes.push(new THREE.Vector3(...[0, 1, 2].map(a => min[a] + (max[a] - min[a]) * ([i, j, k][a] / Math.max(1, n[a] - 1)))));

  // add the grid to a material's indirect diffuse light, keeping whatever hook it already has
  function install(mat) {
    if (!mat || !mat.isMeshStandardMaterial || mat.userData.gi) return;
    mat.userData.gi = true;
    const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey.bind(mat);
    mat.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vGIW;")
        .replace("#include <project_vertex>", "#include <project_vertex>\n#ifdef USE_INSTANCING\nvGIW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\nvGIW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vGIW; uniform sampler2D uGITex; uniform float uGI; uniform vec3 uGIMin, uGIMax, uGIN;`)
        .replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>
        #if defined( RE_IndirectDiffuse )
        if (uGI > 0.0) {
          vec3 gp = clamp((vGIW - uGIMin) / max(uGIMax - uGIMin, vec3(1e-4)), 0.0, 1.0) * (uGIN - 1.0);
          vec3 g0 = floor(gp), f = gp - g0;
          vec3 shc[9]; for (int q = 0; q < 9; q++) shc[q] = vec3(0.0);
          for (int c = 0; c < 8; c++) {
            vec3 o = vec3(float(c & 1), float((c >> 1) & 1), float((c >> 2) & 1));
            vec3 gi = min(g0 + o, uGIN - 1.0);
            float w = mix(1.0 - f.x, f.x, o.x) * mix(1.0 - f.y, f.y, o.y) * mix(1.0 - f.z, f.z, o.z);
            int idx = int(gi.x + gi.y * uGIN.x + gi.z * uGIN.x * uGIN.y);
            for (int q = 0; q < 9; q++) shc[q] += w * texelFetch(uGITex, ivec2(q, idx), 0).rgb;
          }
          irradiance += uGI * max(shGetIrradianceAt(inverseTransformDirection(geometryNormal, viewMatrix), shc), vec3(0.0));
        }
        #endif`);
    };
    mat.customProgramCacheKey = () => prevKey() + "|gi";
    mat.needsUpdate = true;
  }

  // capture: every probe a cube map, every cube map 9 SH coefficients; bounces > 1 capture with GI on
  async function bake(renderer, scene, { size = 32, bounces = 2, scale = 1, onStep = () => {} } = {}) {
    const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType });
    const cam = new THREE.CubeCamera(0.05, 30, rt);
    const t0 = performance.now();
    for (let b = 0; b < bounces; b++) {
      U.uGI.value = b === 0 ? 0 : scale;
      const next = new Float32Array(data.length);
      for (let p = 0; p < probes.length; p++) {
        if (p % 8 === 0) { onStep(`bouncing the light (${b + 1}/${bounces}) ${Math.round(100 * p / probes.length)}%`); await new Promise(r => setTimeout(r)); }
        cam.position.copy(probes[p]); cam.update(renderer, scene);
        const sh = LightProbeGenerator.fromCubeRenderTarget(renderer, rt).sh.coefficients;
        for (let q = 0; q < 9; q++) { const o = (p * 9 + q) * 4; next[o] = sh[q].x; next[o + 1] = sh[q].y; next[o + 2] = sh[q].z; next[o + 3] = 1; }
      }
      data.set(next); tex.needsUpdate = true;
    }
    U.uGI.value = scale; rt.dispose();
    return { ms: Math.round(performance.now() - t0), probes: probes.length, bounces };
  }
  // Light by state (design/production/plan.md §3): light adds, so each group of lights (the sun, one
  // window's sky, a candle) is baked on its own, every other group dark, and the grid shown is their
  // sum, each weighted by its state: a shutter closed, a candle lit. No new bake when a state changes.
  // groups: { name: [lights and glowing meshes] }; a group's weight starts at 1.
  const groupData = new Map(), weights = {};
  async function bakeGroups(renderer, scene, groups, opts = {}) {
    const all = Object.values(groups).flat(), was = new Map(all.map(o => [o, o.visible]));
    const out = {};
    for (const [name, members] of Object.entries(groups)) {
      for (const o of all) o.visible = members.includes(o);
      out[name] = await bake(renderer, scene, { ...opts, onStep: (t) => (opts.onStep || (() => {}))(`${t} · ${name}`) });
      groupData.set(name, data.slice()); if (!(name in weights)) weights[name] = 1;
    }
    for (const [o, v] of was) o.visible = v;
    mix();
    return out;
  }
  function mix() {
    data.fill(0);
    for (const [name, d] of groupData) { const w = weights[name] ?? 0; if (w) for (let i = 0; i < d.length; i++) data[i] += w * d[i]; }
    for (let i = 3; i < data.length; i += 4) data[i] = 1;
    tex.needsUpdate = true;
  }
  const setWeights = (ws) => { let changed = false; for (const [k, v] of Object.entries(ws)) if (weights[k] !== v) { weights[k] = v; changed = true; } if (changed && groupData.size) mix(); };
  return { install, bake, bakeGroups, setWeights, weights, uniforms: U, probes, setScale: (s) => { U.uGI.value = s; } };
}
