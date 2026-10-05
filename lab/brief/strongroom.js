// The strongroom's pieces (R45): a room compiled from the period brief (brief.js) built in code.
// Limewashed stone walls, a flagged floor and a segmental stone vault; oak doors bound in iron in plain
// stone reveals; small barred windows with inside shutters; presses of drawers labelled by manor, with
// pigeonholes of rolled deeds over; an iron-bound chest under two locks; and the table with the drawer
// (procedural.js). Everything from the kit (procedural.js makeKit): no image, no mesh file.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildDesk, rect, slab, quad, run, loft, metric, metricAny, block, rng, hash, leadedTexture, outsideTexture, stoneTexture, grime, canvasTex, normalFrom, fbm } from "../painted/procedural.js";

const PLACE = (W, D) => ({ N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } });

// the segmental vault's height across its span: chord c, rise h, at s from one springing wall
function vaultArc(c, spring, crown) {
  const h = crown - spring, R = (c * c / 4 + h * h) / (2 * h);
  return { R, h, y: (s) => spring + Math.sqrt(Math.max(0, R * R - (s - c / 2) ** 2)) - (R - h) };
}

// a merge-as-you-go bucket per material: thousands of drawer parts become a few draw calls
function buckets(THREE, K) {
  const map = new Map();
  return {
    add(g, mat, spread = 0.18, xf = null) {
      if (mat.vertexColors && !g.attributes.color) K.board(g, spread);
      if (!g.attributes.color) { const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(1); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (g.index) g = g.toNonIndexed();
      if (xf) g.applyMatrix4(xf);
      if (!map.has(mat)) map.set(mat, []);
      map.get(mat).push(g); K.parts++;
    },
    flush(into, name) {
      for (const [mat, gs] of map) {
        const keep = gs.map(g => { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
        const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = m.receiveShadow = true;
        m.userData = { instance: `${name}/${mat.userData.cls || "part"}`, material: mat.userData.cls || "other", owner: name };
        into.add(m);
      }
      map.clear();
    },
  };
}

// limewash over coursed stone: near white, washed on unevenly, the courses faintly showing through
function limewashTexture(THREE, N = 512) {
  const H = new Float32Array(N * N), cuts = [];
  const NC = 6, r = rng(1660); for (let j = 0; j < NC; j++) { const c = []; let x = r() * 0.2; while (x < 1) { c.push(x); x += 0.16 + r() * 0.2; } cuts.push(c); }
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, row = Math.floor(v * NC), fv = v * NC - row;
      const cs = cuts[row]; let du = 1; for (const c of cs) du = Math.min(du, Math.abs(u - c), Math.abs(u - c - 1), Math.abs(u - c + 1));
      const joint = Math.min(fv, 1 - fv) < 0.025 || du < 0.004;   // the wash has filled the joints: they show as a shallow line
      const m = fbm(u * 4, v * 4, 4, 4, 4, 71), f = fbm(u * 64, v * 64, 64, 64, 2, 73), wash = fbm(u * 7, v * 7, 7, 7, 3, 79);
      const k = (0.9 + 0.1 * m + 0.04 * f) * (joint ? 0.95 : 1) * (1 - 0.06 * Math.max(0, wash - 0.55) * 4), o = (y * N + x) * 4;
      d[o] = 224 * k; d[o + 1] = 219 * k; d[o + 2] = 204 * k; d[o + 3] = 255;
      H[y * N + x] = (joint ? -0.22 : 0) + m * 0.45 + f * 0.25;
    }
  });
  for (const t of [map]) t.repeat.set(0.5, 0.5);
  const nm = normalFrom(THREE, H, N, N, 1.2); nm.repeat.set(0.5, 0.5);
  return { map, normalMap: nm };
}

export function strongroomMaterials(THREE, K) {
  const { M } = K;
  if (K.SR) return K.SR;
  const iron = new THREE.MeshStandardMaterial({ color: 0x55504a, metalness: 0.3, roughness: 0.55, vertexColors: true }); iron.userData.cls = "iron";
  const lw = limewashTexture(THREE);
  const dressed = new THREE.MeshStandardMaterial({ ...stoneTexture(THREE, 512, [150, 140, 122], false), roughness: 0.86, normalScale: new THREE.Vector2(0.6, 0.6) }); dressed.userData.cls = "stone";
  const lime = grime(THREE, new THREE.MeshStandardMaterial({ ...lw, roughness: 0.96, normalScale: new THREE.Vector2(0.5, 0.5) })); lime.userData.cls = "limewash";
  const vault = new THREE.MeshStandardMaterial({ ...lw, roughness: 0.97, normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide }); vault.userData.cls = "limewash";
  // the door's boards: weathered oak, paler and greyer than the waxed presses
  const doorOak = new THREE.MeshStandardMaterial({ map: M.oak.map, normalMap: M.oak.normalMap, roughness: 0.75, vertexColors: true, color: new THREE.Color(1.35, 1.28, 1.18) }); doorOak.userData.cls = "oak";
  const parch = new THREE.MeshStandardMaterial({ color: 0xcdb98e, roughness: 0.92, vertexColors: true }); parch.userData.cls = "parchment";
  const tape = new THREE.MeshStandardMaterial({ color: 0x7a2a22, roughness: 0.8 }); tape.userData.cls = "tape";
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 }); dark.userData.cls = "dark";
  const flags = new THREE.MeshStandardMaterial({ map: M.flags.map, normalMap: M.flags.normalMap, roughness: 0.82 }); flags.userData.cls = "flags";
  for (const t of [flags.map, flags.normalMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return (K.SR = { iron, dressed, lime, vault, parch, tape, dark, flags, doorOak });
}

// ---------------------------------------------------------------- a stone wall
// N and S spring the vault: they stop at the springing. The end walls rise to the vault's curve.
function stoneWall(THREE, K, S, F, L, elems, top, vaultTop) {
  const grp = new THREE.Group(), lights = [], B = buckets(THREE, K);
  const holes = [], notches = [];
  for (const e of elems) {
    if (e.kind === "window") holes.push(rect(e.r0, e.r1, e.sill, e.top));
    if (e.kind === "door") notches.push([e.r0, e.r1, e.top]);
  }
  const outline = [[0, 0]];
  for (const [a, b, t] of notches.sort((p, q) => p[0] - q[0])) outline.push([a, 0], [a, t], [b, t], [b, 0]);
  outline.push([L, 0]);
  if (vaultTop) for (let k = 0; k <= 32; k++) { const r = L * (1 - k / 32); outline.push([r, vaultTop(r) + 0.02]); }
  else outline.push([L, top], [0, top]);
  B.add(slab(THREE, outline, holes), S.lime);
  // the wall's core behind, so no seam opens onto nothing
  const X = 0.05, core = [[-X, -X]];
  for (const [a, b, t] of notches) core.push([a, -X], [a, t], [b, t], [b, -X]);
  core.push([L + X, -X]);
  if (vaultTop) for (let k = 0; k <= 32; k++) { const r = L * (1 - k / 32); core.push([r + (k === 0 ? X : k === 32 ? -X : 0), vaultTop(r) + 0.1]); }
  else core.push([L + X, top + 0.1], [-X, top + 0.1]);
  B.add(slab(THREE, core, holes, -0.04), S.dark);
  // a chamfered impost course where the vault springs
  if (!vaultTop) B.add(run(THREE, -0.02, L + 0.02, top - 0.1, [[0, 0], [0, 0.02], [0.05, 0.075], [0.1, 0.075], [0.1, 0]]), S.dressed);
  // a low plinth of dressed stone, chamfered, broken at the doors
  { const cuts = notches.map(([a, b]) => [a, b]).sort((p, q) => p[0] - q[0]); let x = 0;
    for (const [a, b] of [...cuts, [L, L]]) { if (a - x > 0.05) B.add(run(THREE, x, a, 0, [[0, 0], [0, 0.04], [0.12, 0.04], [0.15, 0.012], [0.15, 0]]), S.dressed); x = b; } }

  for (const e of elems) {
    const T = e.T ?? 0.5;
    if (e.kind === "door") lights.push(...ironDoor(THREE, K, S, B, e, T));
    if (e.kind === "window") lights.push(...barredWindow(THREE, K, S, B, grp, F, e, T));
  }
  B.flush(grp, F);
  return { grp, lights };
}

// ---------------------------------------------------------------- an oak door bound in iron
function ironDoor(THREE, K, S, B, e, T) {
  const { M } = K, t = e.top, w = e.r1 - e.r0, r = rng(Math.round(e.r0 * 1000) + 17);
  // plain stone reveals, chamfered at the arris
  B.add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, -T], [e.r0, t, -T], [e.r0, t, 0]), S.dressed);
  B.add(quad(THREE, [e.r1, 0, -T], [e.r1, 0, 0], [e.r1, t, 0], [e.r1, t, -T]), S.dressed);
  B.add(quad(THREE, [e.r0, t, 0], [e.r0, t, -T], [e.r1, t, -T], [e.r1, t, 0]), S.dressed);
  B.add(quad(THREE, [e.r0, 0.003, -T], [e.r0, 0.003, 0], [e.r1, 0.003, 0], [e.r1, 0.003, -T]), S.dressed);
  B.add(loft(THREE, [[e.r0, 0], [e.r0, t], [e.r1, t], [e.r1, 0]], [[0, 0.004], [0.045, -0.04], [0.05, -0.05]], false, false), S.dressed);
  // the leaf: vertical boards, set back in the reveal where it closes on its rebate
  const z = -0.12, n = Math.max(4, Math.round(w / 0.17)), bw = w / n, lt = 0.055;
  for (let i = 0; i < n; i++) {
    const g = metric(new THREE.BoxGeometry(bw - 0.004, t - 0.01, lt - (i % 2) * 0.004)); g.translate(e.r0 + bw * (i + 0.5), (t - 0.01) / 2, z - lt / 2);
    B.add(g, S.doorOak, 0.3);
  }
  // strap hinges across the leaf, with rounded ends, and nails along them and in rows between
  const iz = z + 0.004;
  for (const y of [0.28, t / 2, t - 0.3]) {
    const g = new THREE.BoxGeometry(w - 0.05, 0.055, 0.008); g.translate(e.r0 + (w - 0.05) / 2 + 0.01, y, iz); B.add(g, S.iron, 0.2);
    const end = new THREE.CylinderGeometry(0.04, 0.04, 0.008, 16); end.rotateX(Math.PI / 2); end.translate(e.r1 - 0.06, y, iz); B.add(end, S.iron, 0.2);
    for (let x = e.r0 + 0.06; x < e.r1 - 0.05; x += 0.12) { const h = new THREE.ConeGeometry(0.009, 0.008, 4); h.rotateX(Math.PI / 2); h.rotateZ(Math.PI / 4); h.translate(x, y, iz + 0.008); B.add(h, S.iron, 0.3); }
  }
  for (let y = 0.15; y < t - 0.1; y += 0.16) for (let i = 0; i <= n; i++) {
    if ([0.28, t / 2, t - 0.3].some(s => Math.abs(s - y) < 0.07)) continue;
    const h = new THREE.ConeGeometry(0.008, 0.007, 4); h.rotateX(Math.PI / 2); h.rotateZ(Math.PI / 4); h.translate(e.r0 + i * bw + (i === 0 ? 0.03 : i === n ? -0.03 : 0), y + (r() - 0.5) * 0.01, z + 0.004); B.add(h, S.iron, 0.3);
  }
  // a stock lock: an oak block under an iron plate, a keyhole, a ring to pull by
  const lx = e.r1 - 0.17, ly = 1.02;
  { const g = metric(new THREE.BoxGeometry(0.3, 0.2, 0.07)); g.translate(lx, ly, iz + 0.035); B.add(g, M.oakH, 0.2); }
  { const g = new THREE.BoxGeometry(0.2, 0.13, 0.006); g.translate(lx, ly, iz + 0.073); B.add(g, S.iron, 0.15); }
  { const g = new THREE.BoxGeometry(0.012, 0.03, 0.004); g.translate(lx + 0.02, ly - 0.01, iz + 0.077); B.add(g, S.dark); }
  { const g = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10); g.rotateX(Math.PI / 2); g.translate(lx + 0.02, ly + 0.008, iz + 0.077); B.add(g, S.dark); }
  { const g = new THREE.TorusGeometry(0.055, 0.007, 8, 24); g.translate(lx - 0.06, ly - 0.16, iz + 0.012); B.add(g, S.iron, 0.2); }
  return [];
}

// ---------------------------------------------------------------- a small window, barred and shuttered
function barredWindow(THREE, K, S, B, grp, F, e, T) {
  const sp = e.splay ?? 0.16, G = -T + 0.12;
  const o = [[e.r0, e.sill], [e.r1, e.sill], [e.r1, e.top], [e.r0, e.top]];
  const i = [[e.r0 + sp, e.sill + 0.06], [e.r1 - sp, e.sill + 0.06], [e.r1 - sp, e.top - 0.04], [e.r0 + sp, e.top - 0.04]];
  // a deep splayed embrasure, limewashed, with a stone sill sloping down into the room
  B.add(quad(THREE, [...o[0], 0], [...i[0], G], [...i[3], G], [...o[3], 0]), S.lime);
  B.add(quad(THREE, [...i[1], G], [...o[1], 0], [...o[2], 0], [...i[2], G]), S.lime);
  B.add(quad(THREE, [...o[2], 0], [...o[3], 0], [...i[3], G], [...i[2], G]), S.lime);
  B.add(quad(THREE, [...o[0], 0], [...o[1], 0], [...i[1], G], [...i[0], G]), S.dressed);
  // a plain chamfered stone frame round the light
  B.add(loft(THREE, rect(i[0][0], i[1][0], i[0][1], i[2][1]), [[0, G], [0, G + 0.02], [0.04, G + 0.02], [0.05, G]], true, false), S.dressed);
  const gx0 = i[0][0] + 0.04, gx1 = i[1][0] - 0.04, gy0 = i[0][1] + 0.04, gy1 = i[2][1] - 0.04, gw = gx1 - gx0, gh = gy1 - gy0;
  // leaded quarries, plain
  { const g = new THREE.PlaneGeometry(gw, gh); g.translate((gx0 + gx1) / 2, (gy0 + gy1) / 2, G - 0.006);
    const m = new THREE.MeshBasicMaterial({ map: leadedTexture(THREE, gw, gh, 0, 300 + K.parts), color: new THREE.Color(1.0, 0.99, 0.94), transparent: true, depthWrite: false });
    const glass = new THREE.Mesh(g, m); glass.userData = { instance: `${F}/${e.id}/glass`, material: "glass", owner: F }; grp.add(glass); }
  // the world outside, 2.5 m beyond
  K.outside = K.outside || new THREE.MeshBasicMaterial({ map: outsideTexture(THREE), color: new THREE.Color(1.06, 1.06, 1.06) });
  { const g = new THREE.PlaneGeometry(gw + 5, 4.2); g.translate((gx0 + gx1) / 2, e.sill + 0.3, G - 2.5);
    const pane = new THREE.Mesh(g, K.outside); pane.userData = { instance: `${F}/${e.id}/outside`, material: "glass", owner: F }; grp.add(pane); }
  // the iron grid: round stanchions run into the head and sill, flat saddle bars across, a hand inside the glass
  const bz = G + 0.05, nb = Math.max(2, Math.round(gw / 0.11));
  for (let k = 1; k < nb + 1; k++) { const x = gx0 + gw * k / (nb + 1); const g = new THREE.CylinderGeometry(0.011, 0.011, gh + 0.1, 8); g.translate(x, (gy0 + gy1) / 2, bz); B.add(g, S.iron, 0.2); }
  for (const f of [0.33, 0.67]) { const g = new THREE.BoxGeometry(gw + 0.08, 0.035, 0.012); g.translate((gx0 + gx1) / 2, gy0 + gh * f, bz + 0.012); B.add(g, S.iron, 0.2); }
  // inside shutters, folded back against the splays
  if (e.shutters) {
    const lw = (i[1][0] - i[0][0]) / 2, lh = i[2][1] - i[0][1] - 0.02;
    for (const side of [0, 1]) {
      const a = side ? i[1] : i[0], b = side ? o[1] : o[0];
      const dir = new THREE.Vector2(b[0] - a[0], T + G).normalize();     // along the splay, glass to room
      const nrm = side ? new THREE.Vector2(-dir.y, dir.x) : new THREE.Vector2(dir.y, -dir.x);
      const cx = a[0] + dir.x * (lw / 2 + 0.02) + nrm.x * 0.03 * (side ? -1 : 1), cz = G + 0.02 + dir.y * (lw / 2 + 0.02);
      const g = metric(new THREE.BoxGeometry(lw, lh, 0.022));
      g.rotateY(-Math.atan2(dir.y, dir.x)); g.translate(cx + (side ? -0.02 : 0.02), a[1] + lh / 2 + 0.01, cz);
      B.add(g, K.M.oak, 0.25);
    }
  }
  // daylight through the glass, facing the room
  const al = new THREE.RectAreaLight(0xe9eef0, 5.5, gw, gh);
  al.position.set((gx0 + gx1) / 2, (gy0 + gy1) / 2, G + 0.06); al.lookAt((gx0 + gx1) / 2, (gy0 + gy1) / 2, 5);
  grp.add(al);
  return [al];
}

// ---------------------------------------------------------------- the labels: one atlas for the room
function labelAtlas(THREE, names, count) {
  const cw = 160, ch = 56, cols = 24, rows = Math.ceil(count / cols);
  const c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext("2d"), r = rng(1603);
  const roman = ["", " ii", " iii", " iv", " v", " vi"];
  for (let k = 0; k < count; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
    // paper, browned at the edges, pasted on a little askew
    const tone = 214 + r() * 22;
    g.fillStyle = `rgb(${tone},${tone - 14},${tone - 42})`; g.fillRect(x, y, cw, ch);
    const gr = g.createRadialGradient(x + cw / 2, y + ch / 2, 10, x + cw / 2, y + ch / 2, cw * 0.62);
    gr.addColorStop(0, "rgba(120,80,30,0)"); gr.addColorStop(1, `rgba(110,70,30,${0.25 + r() * 0.25})`);
    g.fillStyle = gr; g.fillRect(x, y, cw, ch);
    const name = names[k % names.length] + roman[Math.floor(k / names.length) % roman.length];
    g.save(); g.translate(x + cw / 2, y + ch * 0.62); g.rotate((r() - 0.5) * 0.05);
    g.fillStyle = `rgba(${40 + r() * 20},${26 + r() * 10},${14},0.88)`;
    g.font = `italic ${name.length > 12 ? 19 : 23}px Georgia, "Times New Roman", serif`; g.textAlign = "center";
    g.fillText(name, 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); m.userData.cls = "paper";
  return { m, uv: (k) => { const u0 = (k % cols) / cols, v1 = 1 - Math.floor(k / cols) / rows; return [u0, v1 - 1 / rows, u0 + 1 / cols, v1]; } };
}

// ---------------------------------------------------------------- a press of drawers, pigeonholes over
function press(THREE, K, S, B, e, labels) {
  const { M } = K, r = rng(Math.round(e.r0 * 977) + e.label0);
  const W = e.r1 - e.r0, Dp = e.depth, Hh = e.height, side = 0.035, plinth = 0.1, cornice = 0.12;
  const cw = (W - 2 * side) / e.cols, rh = 0.14, ph = 0.24;
  const x0 = e.r0 + side, y0 = plinth, yD = y0 + e.rows * rh, yP = yD + e.pigeonholes * ph;
  const box = (w, h, d, x, y, z, mat = M.oak, spread = 0.12) => { const g = metric(new THREE.BoxGeometry(w, h, d)); g.translate(x, y, z); B.add(g, mat, spread); };
  // the carcass: ends, back, a plinth set back, a top under a moulded cornice
  for (const x of [e.r0 + side / 2, e.r1 - side / 2]) box(side, Hh, Dp, x, Hh / 2, Dp / 2);
  box(W, Hh, 0.015, (e.r0 + e.r1) / 2, Hh / 2, 0.008, S.dark);
  box(W - 0.02, plinth, Dp - 0.04, (e.r0 + e.r1) / 2, plinth / 2, (Dp - 0.04) / 2);
  box(W, 0.025, Dp, (e.r0 + e.r1) / 2, yP + 0.0125, Dp / 2);
  box(W - 2 * side, Hh - yP - 0.025, 0.02, (e.r0 + e.r1) / 2, (yP + 0.025 + Hh) / 2, Dp - 0.01, M.oakH);
  B.add(run(THREE, e.r0 - 0.03, e.r1 + 0.03, Hh - cornice + 0.02, [[0, Dp], [0, Dp + 0.01], [0.03, Dp + 0.015], [0.06, Dp + 0.035], [0.09, Dp + 0.05], [0.1, Dp + 0.05], [0.1, 0]]), M.oakH, 0.08);
  // the grid's front: rails between rows, muntins between columns, a dark void behind each drawer
  for (let j = 0; j <= e.rows; j++) box(W - 2 * side, 0.014, Dp - 0.02, (e.r0 + e.r1) / 2, y0 + j * rh, (Dp - 0.02) / 2, M.oakH, 0.06);
  for (let j = 1; j <= e.pigeonholes; j++) box(W - 2 * side, 0.016, Dp - 0.02, (e.r0 + e.r1) / 2, yD + j * ph, (Dp - 0.02) / 2, M.oakH, 0.06);
  for (let i = 1; i < e.cols; i++) box(0.014, yP - y0, Dp - 0.02, x0 + i * cw, (y0 + yP) / 2, (Dp - 0.02) / 2, M.oak, 0.06);
  // the drawers: each its own cut of oak, a label, an iron ring on a plate; a few left a little open
  const L = labels;
  let k = e.label0;
  for (let j = 0; j < e.rows; j++) for (let i = 0; i < e.cols; i++, k++) {
    const cx = x0 + (i + 0.5) * cw, cy = y0 + (j + 0.5) * rh;
    const out = r() < 0.06 ? 0.02 + r() * 0.07 : r() * 0.004, fz = Dp - 0.012 + out;
    box(cw - 0.018, rh - 0.018, 0.018, cx, cy, fz - 0.009, M.oak, 0.32);
    if (out > 0.015) { box(0.012, rh - 0.03, out + 0.01, cx - cw / 2 + 0.015, cy - 0.004, fz - 0.02 - out / 2, M.oak, 0.2); box(0.012, rh - 0.03, out + 0.01, cx + cw / 2 - 0.015, cy - 0.004, fz - 0.02 - out / 2, M.oak, 0.2); }
    // the label, pasted above the ring
    const [u0, v0, u1, v1] = L.uv(k), lw = cw * 0.62, lh = lw * 56 / 160;
    const lg = new THREE.PlaneGeometry(lw, lh); lg.translate(cx, cy + 0.022, fz + 0.0015);
    const uv = lg.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) ? u1 : u0, uv.getY(q) ? v1 : v0);
    B.add(lg, L.m);
    const pl = new THREE.CylinderGeometry(0.011, 0.011, 0.004, 10); pl.rotateX(Math.PI / 2); pl.translate(cx, cy - 0.022, fz + 0.002); B.add(pl, S.iron, 0.15);
    const ring = new THREE.TorusGeometry(0.016, 0.0028, 6, 16, Math.PI * 2); ring.rotateX(-0.35); ring.translate(cx, cy - 0.038, fz + 0.007); B.add(ring, S.iron, 0.15);
  }
  // pigeonholes: rolled deeds and folded bundles, tied with tape, lying deep in each hole
  for (let j = 0; j < e.pigeonholes; j++) for (let i = 0; i < e.cols; i++) {
    const cx = x0 + (i + 0.5) * cw, by = yD + j * ph + 0.008;
    const nRoll = Math.floor(r() * 4);
    for (let q = 0; q < nRoll; q++) {
      const rad = 0.022 + r() * 0.018, len = Dp * (0.55 + r() * 0.35);
      const g = new THREE.CylinderGeometry(rad, rad, len, 12); g.rotateX(Math.PI / 2);
      const x = cx - cw / 2 + 0.03 + rad + r() * (cw - 0.06 - 2 * rad), y = by + rad + (q > 1 ? rad * 1.6 : 0);
      g.translate(x, y, Dp - len / 2 - 0.02 - r() * 0.03); B.add(g, S.parch, 0.24);
      if (r() < 0.6) { const t = new THREE.TorusGeometry(rad + 0.001, 0.0025, 4, 14); t.translate(x, y, Dp - len * 0.4); B.add(t, S.tape); }
    }
    if (r() < 0.55) {
      const bw = cw * (0.4 + r() * 0.3), bh = 0.03 + r() * 0.08;
      const g = metric(new THREE.BoxGeometry(bw, bh, Dp * 0.7)); g.translate(cx + (r() - 0.5) * (cw - bw - 0.04) * 0.8, by + bh / 2, Dp * 0.45); B.add(g, S.parch, 0.3);
    }
  }
  return { r0: e.r0, r1: e.r1, depth: Dp + 0.06 };
}

// ---------------------------------------------------------------- an iron-bound chest under two locks
function chest(THREE, K, S, B, e) {
  const { M } = K, { w, d, h } = e, x = e.r, z = d / 2 + 0.03;
  const box = (bw, bh, bd, bx, by, bz, mat = M.oak, spread = 0.18) => { const g = metric(new THREE.BoxGeometry(bw, bh, bd)); g.translate(bx, by, bz); B.add(g, mat, spread); };
  // skids, a body of wide planks, a lid with a moulded edge
  for (const sx of [-1, 1]) box(0.08, 0.05, d, x + sx * (w / 2 - 0.1), 0.025, z, M.oakH);
  const bodyH = h - 0.1;
  for (let k = 0; k < 3; k++) box(w, bodyH / 3 - 0.004, 0.035, x, 0.05 + bodyH / 3 * (k + 0.5), z + d / 2 - 0.0175, M.oakH, 0.3);
  box(w, bodyH, d - 0.035, x, 0.05 + bodyH / 2, z - 0.0175, M.oak, 0.2);
  box(w + 0.03, 0.045, d + 0.03, x, 0.05 + bodyH + 0.0225, z, M.oakH, 0.2);
  // iron: bands wrapping front, lid and back, a band round the foot, angle irons at the corners
  for (const f of [-0.36, 0, 0.36]) {
    const bx = x + f * w;
    box(0.045, h - 0.05, 0.006, bx, 0.05 + (h - 0.05) / 2, z + d / 2 + 0.003, S.iron, 0.2);
    box(0.045, 0.006, d + 0.035, bx, h + 0.003, z, S.iron, 0.2);
    for (let y = 0.12; y < h - 0.05; y += 0.1) { const n = new THREE.ConeGeometry(0.007, 0.006, 4); n.rotateX(Math.PI / 2); n.translate(bx, y, z + d / 2 + 0.009); B.add(n, S.iron, 0.3); }
  }
  box(w + 0.01, 0.04, 0.006, x, 0.1, z + d / 2 + 0.004, S.iron, 0.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.006, h - 0.06, 0.05, x + sx * (w / 2 + 0.003), 0.05 + (h - 0.06) / 2, z + sz * (d / 2 - 0.02), S.iron, 0.2);
  // two hasps and two padlocks
  for (const f of [-0.18, 0.18]) {
    const hx = x + f * w;
    box(0.04, 0.14, 0.008, hx, h - 0.06, z + d / 2 + 0.009, S.iron, 0.2);
    box(0.07, 0.07, 0.025, hx, h - 0.17, z + d / 2 + 0.03, S.iron, 0.2);
    const sh = new THREE.TorusGeometry(0.024, 0.005, 6, 16, Math.PI); sh.translate(hx, h - 0.135, z + d / 2 + 0.03); B.add(sh, S.iron, 0.2);
  }
  // iron handles at the ends
  for (const sx of [-1, 1]) { const g = new THREE.TorusGeometry(0.05, 0.007, 6, 16, Math.PI); g.rotateZ(Math.PI); g.rotateY(Math.PI / 2); g.translate(x + sx * (w / 2 + 0.012), h * 0.62, z); B.add(g, S.iron, 0.2); }
  return { r0: x - w / 2 - 0.02, r1: x + w / 2 + 0.02, depth: d + 0.06 };
}

// ---------------------------------------------------------------- the room
export function buildStrongroom(THREE, K, spec, names) {
  const t0 = performance.now();
  const { W, D, H } = spec.room, S = strongroomMaterials(THREE, K);
  const grp = new THREE.Group(), lights = [], colliders = [];
  const P = PLACE(W, D);
  const v = spec.finish.vault, span = v.axis === "EW" ? D : W;
  const arc = vaultArc(span, v.spring, v.crown);
  // the floor: flags, 2 m to the tile
  { const g = new THREE.PlaneGeometry(W, D); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W / 2, uv.getY(i) * D / 2);
    const f = new THREE.Mesh(g, S.flags); f.rotation.x = -Math.PI / 2; f.position.set(W / 2, 0, -D / 2); f.receiveShadow = true;
    f.userData = { instance: "floor", material: "flags", owner: "floor" }; grp.add(f); }
  // the vault: a segmental barrel from springing wall to springing wall, limewashed stone
  { const L = v.axis === "EW" ? W : D, n = 40, pos = [], uv = [];
    const th0 = Math.asin((span / 2) / arc.R);
    for (let k = 0; k < n; k++) for (const [a, b] of [[k, k + 1]]) {
      const pt = (q, along) => { const th = -th0 + 2 * th0 * q / n, s = span / 2 + arc.R * Math.sin(th), y = arc.y(s);
        return v.axis === "EW" ? [along, y, -s] : [s, y, -along]; };
      const A = pt(a, 0), B2 = pt(b, 0), C = pt(b, L), D2 = pt(a, L);
      pos.push(...A, ...C, ...B2, ...A, ...D2, ...C);
      const ua = arc.R * 2 * th0 * a / n, ub = arc.R * 2 * th0 * b / n;
      uv.push(0, ua, L, ub, 0, ub, 0, ua, L, ua, L, ub);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, S.vault); m.receiveShadow = m.castShadow = true; m.userData = { instance: "vault", material: "limewash", owner: "ceiling" }; grp.add(m); }
  // the walls, then what stands against them
  const stats = { presses: 0, drawers: 0 };
  const count = Object.values(spec.walls).flat().filter(e => e.kind === "press").reduce((n, e) => n + e.cols * e.rows, 0);
  const labels = labelAtlas(THREE, names, Math.max(1, count));
  let desk = null;
  for (const F of ["N", "E", "S", "W"]) {
    const L = F === "N" || F === "S" ? W : D, elems = spec.walls[F] || [];
    const spring = v.springWalls.includes(F);
    const w = stoneWall(THREE, K, S, F, L, elems.filter(e => e.kind === "door" || e.kind === "window"), v.spring, spring ? null : (r) => arc.y(F === "E" || F === "S" ? r : r));
    w.grp.position.set(...P[F].pos); w.grp.rotation.y = P[F].rot; grp.add(w.grp); lights.push(...w.lights);
    const fur = new THREE.Group(), B = buckets(THREE, K);
    for (const e of elems) {
      let fp = null;
      if (e.kind === "press") { fp = press(THREE, K, S, B, e, labels); stats.presses++; stats.drawers += e.cols * e.rows; }
      if (e.kind === "chest") fp = chest(THREE, K, S, B, e);
      if (e.kind === "desk") {
        desk = buildDesk(THREE, K, { W: e.width });
        desk.group.position.set(e.r, 0, 0.04); fur.add(desk.group);
        fp = { r0: e.r - e.width / 2 - 0.03, r1: e.r + e.width / 2 + 0.03, depth: 0.64 };
      }
      if (fp) colliders.push({ F, ...fp });
    }
    B.flush(fur, `${F}/furniture`);
    fur.position.copy(w.grp.position); fur.rotation.y = P[F].rot; grp.add(fur);
  }
  // colliders in room metres (X east from the west wall, Y north from the south wall)
  const boxes = colliders.map(c => {
    const at = { N: (r, o) => [r, D - o], S: (r, o) => [W - r, o], E: (r, o) => [W - o, D - r], W: (r, o) => [o, r] }[c.F];
    const p = [at(c.r0, 0), at(c.r1, 0), at(c.r0, c.depth), at(c.r1, c.depth)];
    return { x0: Math.min(...p.map(q => q[0])), x1: Math.max(...p.map(q => q[0])), y0: Math.min(...p.map(q => q[1])), y1: Math.max(...p.map(q => q[1])) };
  });
  return { group: grp, lights, desk, colliders: boxes, stats: { ...stats, parts: K.parts, ms: Math.round(performance.now() - t0) } };
}
