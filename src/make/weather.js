// The weather (R71; Kabe, 2026-10-13: "Were gonna need a weather/time of day system"), one state every place draws: what
// falls (rain, snow or nothing, and how hard), the fog, the cloud cover and how wet the ground is. Read from the address
// until construct's set_conditions writes it (?weather=rain|snow|fog|overcast|clear, ?rain= ?snow= ?fog= ?cover= ?wet=,
// each 0..1); the time contract with construct and pattern-buffer is not settled here.
//   weatherOf(params)              -> { falls: "rain"|"snow"|null, amount, fog, cover, wet, snowCover }
//   lightUnder(w)                  -> what the sky gives under it: { sun, hemi, sky: { top, horizon }, fog: { color, near, far }, glass }
//   precipitation(THREE, tsl, w, { count, box, mask }) -> { mesh, tick(t) } or null: rain or snow as stateless particles
// The particles keep no state: each is a seed; where it is comes from the seed, the clock and the eye in the vertex
// shader (a box of fall that goes with you, wrapped), so a frame costs one draw and no CPU work however many fall. Under a
// roof none is drawn: a top-down mask of the house's footprint (its rooms, every floor) collapses any particle inside it,
// so rain is seen through windows and doorways and never falls in a room. Pure apart from what it builds; no AI.

const clamp01 = (v) => Math.max(0, Math.min(1, +v || 0));

export function weatherOf(q) {
  const get = (k) => (q.get ? q.get(k) : q[k]), has = (k) => get(k) != null && get(k) !== "";
  const kind = (get("weather") || "").toLowerCase();
  const w = { falls: null, amount: 0, fog: 0, cover: 0, wet: 0, snowCover: 0 };
  if (kind === "rain" || has("rain")) Object.assign(w, { falls: "rain", amount: has("rain") ? clamp01(get("rain")) : 0.7, cover: 0.9, fog: 0.25, wet: 1 });
  else if (kind === "snow" || has("snow")) Object.assign(w, { falls: "snow", amount: has("snow") ? clamp01(get("snow")) : 0.6, cover: 0.85, fog: 0.2, snowCover: 0.8 });
  else if (kind === "fog") Object.assign(w, { fog: 0.8, cover: 0.7, wet: 0.3 });
  else if (kind === "overcast") Object.assign(w, { cover: 0.9 });
  if (has("fog")) w.fog = clamp01(get("fog"));
  if (has("cover")) w.cover = clamp01(get("cover"));
  if (has("wet")) w.wet = clamp01(get("wet"));
  if (w.falls && w.amount <= 0) w.falls = null;
  w.cover = Math.max(w.cover, w.fog * 0.9);   // (thick fog hides the sky as cloud does)
  return w;
}
export const anyWeather = (w) => !!(w.falls || w.fog > 0 || w.cover > 0 || w.wet > 0 || w.snowCover > 0);

// what the sky gives under the weather, as scales on the clear day's (or night's) own: cloud takes the sun's direct light
// and most of its shadow and spreads it as fill; the sky greys toward the cloud's colour; fog draws the haze in from 220 m
// to a few metres (it starts a room's depth away, so a room's own air stays clear)
export function lightUnder(w, { night = false } = {}) {
  const c = w.cover, f = w.fog;
  const grey = night ? 0x10141a : 0x9aa3ab, mist = night ? 0x0c1016 : 0xb4bcc2;
  return {
    sun: 1 - 0.75 * c, shadow: c < 0.6, hemi: 1 + 0.6 * c,
    sky: { toward: grey, by: Math.min(1, c * 0.95) },
    // (thick fog, 0.8: from 14 m to 95 m; a rain's mist, 0.25: from 105 m to 770 m)
    fog: { toward: mist, by: Math.min(1, f + c * 0.3), near: 12 + 208 * Math.pow(1 - f, 3), far: 70 + 1430 * Math.pow(1 - f, 2.5) },
    glass: 1 - 0.55 * c,
  };
}

// the house's footprint as a top-down mask (1 under a roof): plan rects in metres (x east, y north), drawn into a small
// texture over the house's extent and a margin; outside it nothing is masked
export function footprintMask(THREE, rects, { px = 0.5, margin = 2 } = {}) {
  if (!rects.length) return null;
  const x0 = Math.min(...rects.map(r => r.x0)) - margin, x1 = Math.max(...rects.map(r => r.x1)) + margin, y0 = Math.min(...rects.map(r => r.y0)) - margin, y1 = Math.max(...rects.map(r => r.y1)) + margin;
  const W = Math.min(1024, Math.ceil((x1 - x0) / px)), H = Math.min(1024, Math.ceil((y1 - y0) / px)), data = new Uint8Array(W * H * 4);
  for (const r of rects) for (let j = Math.max(0, Math.floor((r.y0 - y0) / (y1 - y0) * H)); j < Math.min(H, Math.ceil((r.y1 - y0) / (y1 - y0) * H)); j++)
    for (let i = Math.max(0, Math.floor((r.x0 - x0) / (x1 - x0) * W)); i < Math.min(W, Math.ceil((r.x1 - x0) / (x1 - x0) * W)); i++) data[(j * W + i) * 4] = 255;
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); tex.needsUpdate = true; tex.magFilter = tex.minFilter = THREE.NearestFilter;
  return { tex, x0, x1, y0, y1 };
}

// rain: thin streaks falling fast, a little slanted by the wind; snow: small flakes drifting down, swaying. count: how many
// in the box at full amount (a phone's fewer); box: the fall's width and height in metres, centred on the eye; mask: the
// footprint, with roof: the height under which a masked particle is hidden
export function precipitation(THREE, tsl, w, { count = 6000, box = [36, 22], mask = null, roof = 30 } = {}) {
  if (!w.falls) return null;
  const { Fn, attribute, uniform, vec2, vec3, vec4, float, fract, sin, cos, cameraPosition, normalize, cross, texture, select, mix } = tsl;
  const rain = w.falls === "rain", n = Math.max(1, Math.round(count * w.amount));
  // n quads, four corners each: corner (x across, y along), seed (three numbers, the same for a quad's corners)
  const corner = new Float32Array(n * 8), seed = new Float32Array(n * 12), index = new Uint32Array(n * 6), pos = new Float32Array(n * 12);
  let s = 0x9e3779b9; const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  for (let i = 0; i < n; i++) { const a = rnd(), b = rnd(), c = rnd();
    [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]].forEach(([u, v], k) => { corner.set([u, v], (i * 4 + k) * 2); seed.set([a, b, c], (i * 4 + k) * 3); });
    index.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("corner", new THREE.BufferAttribute(corner, 2)); g.setAttribute("seed", new THREE.BufferAttribute(seed, 3)); g.setIndex(new THREE.BufferAttribute(index, 1));
  const t = uniform(0), B = float(box[0]), Hh = float(box[1]);
  const speed = rain ? 7.5 : 0.9, len = rain ? 0.42 : 0.025, wide = rain ? 0.012 : 0.025, slant = rain ? 0.12 : 0;
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, forceSinglePass: true });   // (a streak faces you: one pass, not a transparent double side's two)
  m.positionNode = Fn(() => {
    const sd = attribute("seed", "vec3"), cn = attribute("corner", "vec2"), cam = cameraPosition;
    // where it is: wrapped round the eye on x and z; falling through the box's height, at its own pace (snow sways)
    const pace = float(speed).mul(float(0.8).add(sd.z.mul(0.4)));
    const fall = fract(sd.y.add(t.mul(pace).div(Hh)));
    const sway = rain ? float(0) : sin(t.mul(0.7).add(sd.x.mul(40.0))).mul(0.35);
    const x = cam.x.add(fract(sd.x.sub(cam.x.div(B))).sub(0.5).mul(B)).add(sway).add(fall.mul(Hh).mul(slant));
    const z = cam.z.add(fract(sd.z.sub(cam.z.div(B))).sub(0.5).mul(B)).add(rain ? float(0) : cos(t.mul(0.5).add(sd.y.mul(31.0))).mul(0.25));
    const y = cam.y.add(Hh.mul(0.5)).sub(fall.mul(Hh));
    // under a roof (inside the footprint, below its top): nothing drawn
    let shown = float(1);
    if (mask) { const u = x.sub(mask.x0).div(mask.x1 - mask.x0), v = z.negate().sub(mask.y0).div(mask.y1 - mask.y0);
      const inBox = u.greaterThan(0).and(u.lessThan(1)).and(v.greaterThan(0)).and(v.lessThan(1));
      const roofed = select(inBox, texture(mask.tex, vec2(u, v)).level(0).r, float(0)).mul(select(y.lessThan(roof), float(1), float(0)));
      shown = float(1).sub(roofed); }
    // a streak (or a flake) turned to face the eye about the upright
    const c = vec3(x, y, z), side = normalize(cross(vec3(0, 1, 0), c.sub(cam)));
    return c.add(side.mul(cn.x.mul(wide).mul(shown))).add(vec3(float(slant).mul(-1), 1, 0).mul(cn.y.mul(len).mul(shown)));
  })();
  m.colorNode = vec4(rain ? vec3(0.78, 0.82, 0.88) : vec3(0.96, 0.97, 1.0), 1);
  // (faded right by the eye and towards the box's edge: a drop on your nose is overdraw on a phone, and the edge is where it wraps)
  const d = tsl.distance(tsl.positionWorld, cameraPosition), near = tsl.smoothstep(float(1.2), float(3.0), d), far = float(1).sub(tsl.smoothstep(float(box[0] * 0.3), float(box[0] * 0.5), d));
  m.opacityNode = float(rain ? 0.32 + 0.2 * w.amount : 0.85).mul(near).mul(far);
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = `weather:${w.falls}`;
  mesh.userData.weather = { falls: w.falls, count: n };
  return { mesh, count: n, tick: (sec) => { t.value = sec; } };
}
