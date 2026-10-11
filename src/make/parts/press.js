// A press of drawers with pigeonholes over (Windsor's aerary, Hardwick's evidence room): the carcass,
// the drawers as one instanced bank whose every drawer pulls, and the pigeonholes' contents as a
// habit rule. The thing's frame: centred on x, back at z = 0, the floor at y = 0.
import { definePart } from "../catalogue.js";
import { plainBox } from "./joinery.js";
import { run } from "../../../lab/painted/procedural.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "../id.js";

const PLINTH = 0.1, SIDE = 0.035;
// where the grid of drawers and holes lies, from the press's settings
export function pressGrid({ width, height, depth, cols, rows, pigeonholes, drawer_h = 0.14, hole_h = 0.24 }) {
  const cw = (width - 2 * SIDE) / cols, x0 = -width / 2 + SIDE, y0 = PLINTH, yD = y0 + rows * drawer_h, yP = yD + pigeonholes * hole_h;
  return { cw, rh: drawer_h, ph: hole_h, x0, y0, yD, yP, W: width, Dp: depth, Hh: height };
}

// the carcass: ends, back, a plinth set back, a top under a moulded cornice; rails between the rows
// of drawers and holes, muntins between the columns, a dark back behind every opening
definePart("press_carcass", {
  build(c, p) {
    const { THREE } = c, G = pressGrid(p), { W, Dp, Hh, x0, y0, yD, yP, cw, rh, ph } = G;
    const box = (w, h, d, x, y, z, role = "wood", spread = 0.12) => c.add(plainBox(THREE, w, h, d, x, y, z), role, { spread });
    // what it holds must fit inside it, or it is refused, not built inside out (a negative board)
    if (yP + 0.025 > Hh - 0.1) throw new Error(`press_carcass: ${p.rows} rows of drawers and ${p.pigeonholes} of pigeonholes stand ${(yP + 0.025).toFixed(2)} m, more than its ${Hh} m`);
    for (const x of [-W / 2 + SIDE / 2, W / 2 - SIDE / 2]) box(SIDE, Hh, Dp, x, Hh / 2, Dp / 2);
    box(W, Hh, 0.015, 0, Hh / 2, 0.008, "dark");
    box(W - 0.02, PLINTH, Dp - 0.04, 0, PLINTH / 2, (Dp - 0.04) / 2);
    box(W, 0.025, Dp, 0, yP + 0.0125, Dp / 2);
    box(W - 2 * SIDE, Hh - yP - 0.025, 0.02, 0, (yP + 0.025 + Hh) / 2, Dp - 0.01, "wood_face");
    c.add(run(THREE, -W / 2 - 0.03, W / 2 + 0.03, Hh - 0.1, [[0, Dp], [0, Dp + 0.01], [0.03, Dp + 0.015], [0.06, Dp + 0.035], [0.09, Dp + 0.05], [0.1, Dp + 0.05], [0.1, 0]]), "wood_face", { spread: 0.08 });
    for (let j = 0; j <= p.rows; j++) box(W - 2 * SIDE, 0.014, Dp - 0.02, 0, y0 + j * rh, (Dp - 0.02) / 2, "wood_face", 0.06);
    for (let j = 1; j <= p.pigeonholes; j++) box(W - 2 * SIDE, 0.016, Dp - 0.02, 0, yD + j * ph, (Dp - 0.02) / 2, "wood_face", 0.06);
    for (let i = 1; i < p.cols; i++) box(0.014, yP - y0, Dp - 0.02, x0 + i * cw, (y0 + yP) / 2, (Dp - 0.02) / 2, "wood", 0.06);
    c.footprint({ w: W, d: Dp + 0.06, h: Hh });
  },
});

// The drawers: one instanced mesh per part (box, bottom, deeds, label, plate, ring) for the whole
// press. Each drawer its own cut of oak, its own label (labels: one string per drawer, rows from the
// top, "place\nkind" for two lines, "" for a spare), a stack of folded deeds inside if it is in use.
// A few stand a little open, as the last hand left them (their rest). The bank slides drawer i by t.
definePart("drawer_bank", {
  build(c, p) {
    const { THREE, K } = c, G = pressGrid(p), { cw, rh, x0, y0, Dp } = G, n = p.cols * p.rows, r = c.r("drawers");
    const fw = cw - 0.018, fh = rh - 0.018, dd = Dp - 0.06, yIn = -fh / 2 + 0.015, labels = p.labels || [];
    const atlas = labelAtlas(THREE, labels, n), box = (w, h, d, x, y, z) => plainBox(THREE, w, h, d, x, y, z);
    const prep = (g, role, spread) => { const mat = c.mat(role); if (mat.vertexColors) { if (spread) K.board(g, spread); if (!g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3)); } return [g, mat]; };
    const parts = {
      box: prep(mergeGeometries([box(fw, fh, 0.018, 0, 0, -0.009), box(0.01, fh - 0.03, dd, -(fw / 2 - 0.015), -0.006, -0.018 - dd / 2), box(0.01, fh - 0.03, dd, fw / 2 - 0.015, -0.006, -0.018 - dd / 2), box(fw - 0.04, fh - 0.03, 0.01, 0, -0.006, -0.018 - dd + 0.005)]), "wood", 0.06),
      bottom: prep(box(fw - 0.03, 0.006, dd, 0, yIn - 0.003, -0.018 - dd / 2), "wood_inside", 0.1),
      deeds: prep(box(1, 1, 1, 0, 0.5, 0), "parchment", 0),
      label: [(() => { const lw = cw * 0.58, g = new THREE.PlaneGeometry(lw, lw * LABEL_H / 160); g.translate(0, 0.026, 0.0015); return g; })(), atlas.material],
      plate: prep((() => { const g = new THREE.CylinderGeometry(0.011, 0.011, 0.004, 10); g.rotateX(Math.PI / 2); g.translate(0, -0.022, 0.002); return g; })(), "iron", 0),
      ring: prep((() => { const g = new THREE.TorusGeometry(0.016, 0.0028, 6, 16); g.rotateX(-0.35); g.translate(0, -0.038, 0.007); return g; })(), "iron", 0),
    };
    const meshes = {};
    for (const [name, [g, mat]] of Object.entries(parts)) {
      const m = new THREE.InstancedMesh(g, mat, n); m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
      m.userData = { instance: `${c.id}/drawers/${name}`, material: mat.userData.cls || name, owner: c.id };
      meshes[name] = m;
    }
    // drawer i: row from the top, column from the left
    const list = [], tone = new THREE.Color(), rect = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / p.cols), col = i % p.cols;
      const k = 1 - 0.16 + r() * 0.32, warm = 1 + (r() - 0.5) * 0.08; meshes.box.setColorAt(i, tone.setRGB(k * warm, k, k / warm));
      rect.set(atlas.uv(i), i * 4);
      const ajar = r() < 0.06 ? 0.02 + r() * 0.07 : r() * 0.004;
      list.push({ x: x0 + (col + 0.5) * cw, y: y0 + (p.rows - 1 - row + 0.5) * rh, z: Dp - 0.012, ajar, deeds: labels[i] ? Math.min(fh - 0.04, 0.025 + r() * 0.07) : 0.001, label: labels[i] || "" });
    }
    meshes.label.geometry.setAttribute("aRect", new THREE.InstancedBufferAttribute(rect, 4));
    meshes.box.instanceColor.needsUpdate = true;
    const travel = dd * 0.7, m4 = new THREE.Matrix4(), slide = new THREE.Matrix4(), q = new THREE.Matrix4(), s = new THREE.Matrix4();
    const set = (i, t) => {
      const d = list[i];
      slide.makeTranslation(d.x, d.y, d.z + t * travel);
      meshes.box.setMatrixAt(i, slide); meshes.bottom.setMatrixAt(i, slide); meshes.label.setMatrixAt(i, slide);
      meshes.plate.setMatrixAt(i, slide); meshes.ring.setMatrixAt(i, slide);
      meshes.deeds.setMatrixAt(i, m4.multiplyMatrices(slide, q.makeTranslation(0, yIn, -0.018 - dd * 0.45)).multiply(s.makeScale(fw - 0.07, d.deeds, dd * 0.78)));
      for (const m of Object.values(meshes)) { m.instanceMatrix.needsUpdate = true; m.boundingSphere = null; }
    };
    for (let i = 0; i < n; i++) set(i, list[i].ajar / travel);
    c.bank(p.mover || "drawers", { meshes: Object.values(meshes), count: n, set, rest: (i) => list[i].ajar / travel, labelOf: (i) => list[i].label.replace("\n", " · ") });
  },
});

// The pigeonholes over the columns in use: most hold deeds folded flat, docketed and tied in bundles,
// stacked side by side; some hold the court rolls, the one record kept rolled, packed on the floor of
// the hole and in the grooves between. Packed, not scattered.
definePart("pigeonhole_fill", {
  build(c, p) {
    const { THREE } = c, G = pressGrid(p), { cw, x0, yD, ph, Dp } = G, r = c.r("pigeonholes");
    for (let j = 0; j < p.pigeonholes; j++) for (let i = 0; i < p.cols; i++) {
      if (p.full && !p.full[i]) continue;
      const left = x0 + i * cw + 0.011, right = x0 + (i + 1) * cw - 0.011, by = yD + j * ph + 0.008, roof = yD + (j + 1) * ph - 0.012;
      if (r() < 0.3) {
        const R = 0.022 + r() * 0.016, fit = Math.floor((right - left) / (2 * R + 0.003));
        const nLow = Math.max(1, Math.min(fit, Math.ceil(fit * (0.5 + r() * 0.5))));
        const roll = (x, y) => {
          const len = Dp * (0.55 + r() * 0.3), z = Dp - len / 2 - 0.025 - r() * 0.03;
          const g = new THREE.CylinderGeometry(R, R, len, 12); g.rotateX(Math.PI / 2); g.translate(x, y, z); c.add(g, "parchment", { spread: 0.24 });
          if (r() < 0.6) { const t = new THREE.TorusGeometry(R + 0.0012, 0.0025, 4, 14); t.translate(x, y, z + len * 0.12); c.add(t, "tape"); }
        };
        const xs = [];
        for (let q = 0; q < nLow; q++) { const x = left + R + q * (2 * R + 0.003); xs.push(x); roll(x, by + R); }
        for (let q = 0; q + 1 < xs.length; q++) if (r() < 0.45 && by + R + Math.sqrt(3) * (R + 0.0015) + R < roof) roll((xs[q] + xs[q + 1]) / 2, by + R + Math.sqrt(3) * (R + 0.0015));
        continue;
      }
      const n = r() < 0.5 ? 1 : 2, gap = 0.004, sw = (right - left - gap * (n - 1)) / n;
      for (let q = 0; q < n; q++) {
        const cx = left + sw / 2 + q * (sw + gap), d = Dp * (0.5 + r() * 0.2), z = Dp - d / 2 - 0.03 - r() * 0.02;
        let y = by;
        const packets = 1 + Math.floor(r() * 4);
        for (let t = 0; t < packets && y < roof - 0.03; t++) {
          const h = Math.min(roof - y - 0.004, 0.018 + r() * 0.03), w = sw * (0.82 + r() * 0.16), dz = d * (0.9 + r() * 0.1), px = cx + (r() - 0.5) * (sw - w);
          c.add(plainBox(THREE, w, h, dz, px, y + h / 2, z), "parchment", { spread: 0.3 });
          if (r() < 0.7) { const tp = new THREE.BoxGeometry(w + 0.003, h + 0.003, 0.01); tp.translate(px, y + h / 2, z + dz * 0.15); c.add(tp, "tape"); }
          y += h + 0.001;
        }
      }
    }
  },
});

// The evidences in a box: bundles of folded deeds, docketed and tied, laid flat in rows across the
// box's floor and stacked a few deep; a roll or two of letters patent on top. Fills the inside the
// box part reports (its footprint's inside), so it fits whatever box it is in.
definePart("evidence_bundles", {
  build(c, { w, d, h, skids = true }) {
    const { THREE } = c, r = c.r("bundles"), t = 0.03, sk = skids ? 0.05 : 0;
    const x0 = -w / 2 + t + 0.01, x1 = w / 2 - t - 0.01, z0 = t + 0.01, z1 = d - t - 0.01, floor = sk + t;
    const bw = 0.2, bd = 0.15, cols = Math.floor((x1 - x0) / (bw + 0.01)), rows = Math.floor((z1 - z0) / (bd + 0.01));
    let topY = floor; const stacks = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      let y = floor;
      for (let k = 0, n = 1 + Math.floor(r() * 3); k < n; k++) {
        const hh = 0.02 + r() * 0.03, ww = bw * (0.85 + r() * 0.15), dd = bd * (0.85 + r() * 0.15);
        const x = x0 + (i + 0.5) * (bw + 0.01) + (r() - 0.5) * 0.01, z = z0 + (j + 0.5) * (bd + 0.01) + (r() - 0.5) * 0.01;
        // a bundle under another in its stack is never seen (the chest's walls hide its sides)
        const under = k < n - 1;
        c.add(plainBox(THREE, ww, hh, dd, x, y + hh / 2, z), "parchment", { spread: 0.3, seen: !under });
        if (r() < 0.8) { const tp = new THREE.BoxGeometry(0.012, hh + 0.003, dd + 0.003); tp.translate(x, y + hh / 2, z); c.add(tp, "tape", { seen: !under }); }
        y += hh + 0.001;
      }
      topY = Math.max(topY, y);
      stacks.push({ x0: x0 + i * (bw + 0.01), x1: x0 + (i + 1) * (bw + 0.01), z0: z0 + j * (bd + 0.01), z1: z0 + (j + 1) * (bd + 0.01), y });
    }
    // how high the bundles stand under a footprint (what a thing laid there rests on)
    const restAt = (xa, xb, za, zb) => Math.max(floor, ...stacks.filter(s => s.x1 > xa && s.x0 < xb && s.z1 > za && s.z0 < zb).map(s => s.y));
    // letters patent, rolled, laid on top, the great seal on its tag lying beside each
    for (let k = 0; k < 2; k++) {
      const R = 0.03, len = w * 0.55, z = z0 + 0.08 + k * 0.16, x = -w * 0.1 + k * 0.08, y = restAt(x - len / 2, x + len / 2, z - R, z + R) + R - 0.001;      // on the bundles under it, not the tallest anywhere
      const g = new THREE.CylinderGeometry(R, R, len, 14); g.rotateZ(Math.PI / 2); g.translate(x, y, z); c.add(g, "parchment", { spread: 0.2 });
      const sx = x + len / 2 + 0.06, seal = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20); seal.translate(sx, restAt(sx - 0.05, sx + 0.05, z - 0.05, z + 0.05) + 0.006 - 0.001, z); c.add(seal, "seal_wax");
    }
    // the box's slot "inside", moved from its floor onto the bundles: toward the front, clear of the rolls and their
    // seals (they lie in the first 30 cm from the back), on the highest stack under a paper's breadth there
    { const zc = Math.min(z1 - 0.06, Math.max(z0 + 0.36, (z0 + 0.3 + z1) / 2)), xc = -w * 0.22;
      c.slot("inside", [xc, restAt(xc - 0.08, xc + 0.08, zc - 0.07, zc + 0.07), zc]); (c.info.slots ||= {}).inside = { area: [Math.min(0.36, w * 0.3), Math.max(0.08, Math.min(0.14, z1 - zc))] }; }
  },
});

// ---------------------------------------------------------------- the labels: one atlas per press
const LABEL_H = 72;                                              // a cell is 160 × 72 px
function labelAtlas(THREE, texts, count) {
  count = Math.max(1, count);
  const cw = 160, ch = LABEL_H, cols = 24, rows = Math.ceil(count / cols);
  const cv = document.createElement("canvas"); cv.width = cols * cw; cv.height = rows * ch;
  const g = cv.getContext("2d"), r = rng(1603);
  for (let k = 0; k < count; k++) {
    const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
    // paper, browned at the edges, pasted on a little askew
    const tone = 214 + r() * 22;
    g.fillStyle = `rgb(${tone},${tone - 14},${tone - 42})`; g.fillRect(x, y, cw, ch);
    const gr = g.createRadialGradient(x + cw / 2, y + ch / 2, 10, x + cw / 2, y + ch / 2, cw * 0.62);
    gr.addColorStop(0, "rgba(120,80,30,0)"); gr.addColorStop(1, `rgba(110,70,30,${0.25 + r() * 0.25})`);
    g.fillStyle = gr; g.fillRect(x, y, cw, ch);
    const name = texts[k] || "", tilt = (r() - 0.5) * 0.05, ink = `rgba(${40 + r() * 20},${26 + r() * 10},${14},0.88)`;
    if (!name) continue;                                         // a spare drawer: the paper pasted, nothing written yet
    // a place over its kind of evidence, two lines; the place a little larger
    const lines = name.split("\n");
    g.save(); g.translate(x + cw / 2, y + ch / 2); g.rotate(tilt);
    g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((t, q) => {
      let px = lines.length > 1 ? (q ? 19 : 22) : 25;
      do g.font = `italic ${px}px Georgia, "Times New Roman", serif`; while (g.measureText(t).width > cw - 14 && --px > 11);
      g.fillText(t, 0, lines.length > 1 ? (q ? 14 : -12) : 2);
    });
    g.restore();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); material.userData.cls = "paper";
  // each drawer reads its own cell of the atlas from a per-instance rectangle
  material.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec4 aRect;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = mix(aRect.xy, aRect.zw, uv);\n#endif");
  };
  material.customProgramCacheKey = () => "drawer-label";
  material.userData.node = "atlas-cell";                      // the WebGPU path reads aRect in TSL (src/make/nodes.js)
  return { material, uv: (k) => { const u0 = (k % cols) / cols, v1 = 1 - Math.floor(k / cols) / rows; return [u0, v1 - 1 / rows, u0 + 1 / cols, v1]; } };
}
