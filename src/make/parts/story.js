// Parts a story's things need (R49, the Alice hall): words on a thing, a place where something is set on or in
// it, and a lamp's flame. Each is small and general: lettering is a paper tag tied round a neck (a label that
// reads) or letters marked in currants on a cake; a slot is a point, in the thing's frame, where the placer
// sets what the story says stands on it or in it; a flame is the candle's glow, without the candle.
import { definePart } from "../catalogue.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// five by seven capitals, the ones the story's words need; a letter not here is an error, never a guess
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
};

// the paper of a label, printed once per text
const PAPERS = new Map();
function paperOf(THREE, text) {
  if (PAPERS.has(text)) return PAPERS.get(text);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const g = cv.getContext("2d");
  g.fillStyle = "#efe3c4"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#8a7448"; g.lineWidth = 3; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = "#2a1c10"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 50px Georgia, serif"; g.fillText(text, 128, 66, 230);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }); mat.userData.cls = "paper";
  PAPERS.set(text, mat); return mat;
}

// lettering: style "tag" (a paper label hung by a string loop round a neck of radius `neck`, its top edge at
// at[1]; the card hangs in front, +z) or style "currants" (the words marked in currants on a flat surface at
// at[1], the lines top to bottom away from +z, the first line farthest; "EAT ME" is "EAT" over "ME"). A part's
// own `on` or `frame` puts it; the currants' lowest point is at y = 0 of what it is given.
definePart("lettering", {
  build(c, { style = "tag", text, at = [0, 0, 0], neck = 0.0125, w = 0.05, h = 0.02, pitch = 0.0024, mover = null }) {
    const { THREE } = c;
    if (style === "tag") {
      const card = new THREE.BoxGeometry(w, h, 0.002), tube = 0.0012, loopR = neck;
      card.translate(at[0], at[1] - h / 2 + 0.0004, at[2] + loopR + tube + 0.0006);
      const loop = new THREE.TorusGeometry(loopR, tube, 5, 20); loop.rotateX(Math.PI / 2); loop.translate(at[0], at[1], at[2]);
      c.add(card, paperOf(THREE, text), { mover, spread: 0 }); c.add(loop, "tape", { mover, spread: 0.05 });
      return;
    }
    // currants: each lit cell of the letters' grid is a small dark ball, a little flattened
    const lines = text.split(" "), cols = Math.max(...lines.map(l => l.length * 6 - 1)), rows = lines.length * 8 - 1, r = pitch * 0.5, balls = [];
    lines.forEach((line, li) => [...line].forEach((ch, ci) => {
      const gl = GLYPHS[ch]; if (!gl) throw new Error(`lettering: no glyph for ${ch}`);
      const x0 = (cols - (line.length * 6 - 1)) / 2;                         // each line centred
      gl.forEach((row, j) => { [...row].forEach((on, i) => { if (on !== "1") return;
        const s = new THREE.SphereGeometry(r, 6, 4); s.scale(1, 0.9, 1);
        s.translate(at[0] + (x0 + ci * 6 + i - (cols - 1) / 2) * pitch, r * 0.9, at[2] + (li * 8 + j - (rows - 1) / 2) * pitch); balls.push(s); }); });
    }));
    c.add(mergeGeometries(balls.map(b => b.toNonIndexed()), false), "dark", { mover, spread: 0.1 });
  },
});

// a place where the story sets something: a point in the thing's frame (on a mover, if it rides one)
definePart("slot", { build(c, { name, at = [0, 0, 0], mover = null }) { c.slot(name, at, mover); } });

// a flame and its glow, as a candle's, for a lamp: shown while its affordance (`when`, default "light") is
// moved; a light group `group` the affordance turns on and off; it flickers. light 0 makes no point light
// (a row of lamps would be a row of lights): the flame and a soft glow only.
definePart("flame", {
  build(c, { at = [0, 0, 0], r = 0.007, light = 0.6, reach = 5, group = "flame", when = "light" }) {
    const { THREE } = c;
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.92 });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), flameMat); flame.scale.set(1, 2.4, 1); flame.position.set(...at); flame.userData.lightGroup = group;
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.16, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(r * 3.4, 12, 8), glowMat); glow.position.set(...at); glow.userData.lightGroup = group;
    c.extra(flame); c.extra(glow);
    let lamp = null;
    if (light > 0) { lamp = new THREE.PointLight(0xffb070, light, reach, 2); lamp.position.set(at[0], at[1] + r, at[2]); lamp.userData.lightGroup = group; c.extra(lamp); }
    c.animate((t, isLit) => { if (!isLit(when)) return;
      const f = 1 + 0.07 * Math.sin(t * 6.1 + at[0] * 40) + 0.05 * Math.sin(t * 11.3 + 1.7) + 0.03 * Math.sin(t * 27.9);
      flame.scale.set(1, 2.4 * f, 1); glow.scale.setScalar(1 + (f - 1) * 0.5); if (lamp) lamp.intensity = (lamp.userData.on ?? light) * f; });
  },
});
