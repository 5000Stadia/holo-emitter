// Pictures (code; the kinds that hang them are data): a portrait painted in code for each sitter, from
// the thing's own seed: a dark ground, a bust in black or a colour of the day, a white falling band or
// lace collar, a face and hands in flesh tones, sometimes a curtain swag or a column, as the provincial
// painters of the 1650s set them. No image is fetched or generated; the canvas is drawn here.
import { definePart } from "../catalogue.js";

definePart("portrait_canvas", {
  build(c, { W, H, y, z = 0.05 }) {
    const { THREE } = c, r = c.r("portrait"), pick = (a) => a[Math.floor(r() * a.length)];
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = Math.round(256 * H / W); const g = cv.getContext("2d"), w = cv.width, h = cv.height;
    // the ground: dark olive or brown, lighter behind the head
    const ground = pick(["#2a261c", "#2e2a20", "#22241e", "#30261c"]); g.fillStyle = ground; g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * 0.5, h * 0.32, 4, w * 0.5, h * 0.32, w * 0.6); glow.addColorStop(0, "rgba(120,100,70,0.35)"); glow.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = glow; g.fillRect(0, 0, w, h);
    if (r() < 0.5) { g.fillStyle = pick(["#5a1e1a", "#3a2a40", "#4a3a1a"]); g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.45, 0); g.quadraticCurveTo(w * 0.2, h * 0.25, 0, h * 0.4); g.fill(); }
    // the body: shoulders and a coat or gown
    const cx = w * (0.46 + r() * 0.08), coat = pick(["#141210", "#1a1614", "#2a1a14", "#1e2430", "#3a2418", "#141210"]);
    g.fillStyle = coat; g.beginPath(); g.moveTo(cx - w * 0.42, h); g.quadraticCurveTo(cx - w * 0.36, h * 0.52, cx, h * 0.5); g.quadraticCurveTo(cx + w * 0.36, h * 0.52, cx + w * 0.42, h); g.fill();
    // the collar: a plain falling band or a lace one
    g.fillStyle = "#e8e4d8"; const lace = r() < 0.5; g.beginPath();
    g.moveTo(cx - w * 0.16, h * 0.5); g.lineTo(cx + w * 0.16, h * 0.5); g.lineTo(cx + w * (lace ? 0.2 : 0.12), h * 0.6); g.lineTo(cx - w * (lace ? 0.2 : 0.12), h * 0.6); g.fill();
    if (lace) { g.fillStyle = "#b8b4a8"; for (let x = -0.18; x < 0.19; x += 0.04) { g.beginPath(); g.arc(cx + w * x, h * 0.6, w * 0.016, 0, Math.PI); g.fill(); } }
    // the head: an oval of flesh, hair or a cap round it, eyes and a mouth as shadows
    const skin = pick(["#c8a080", "#d0a888", "#b89070"]), hair = pick(["#2a1c12", "#4a3020", "#6a5a48", "#1a1410", "#8a7a68"]);
    g.fillStyle = hair; g.beginPath(); g.ellipse(cx, h * 0.34, w * 0.15, h * 0.13, 0, 0, Math.PI * 2); g.fill();
    if (r() < 0.6) { g.beginPath(); g.ellipse(cx, h * 0.45, w * 0.17, h * 0.06, 0, 0, Math.PI); g.fill(); }        // hair to the shoulders
    g.fillStyle = skin; g.beginPath(); g.ellipse(cx, h * 0.37, w * 0.105, h * 0.1, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(60,40,30,0.55)"; for (const dx of [-0.04, 0.04]) { g.beginPath(); g.ellipse(cx + w * dx, h * 0.355, w * 0.016, h * 0.007, 0, 0, Math.PI * 2); g.fill(); }
    g.fillRect(cx - w * 0.025, h * 0.42, w * 0.05, h * 0.006);
    if (r() < 0.5) { g.fillStyle = skin; g.beginPath(); g.ellipse(cx + w * 0.12, h * 0.86, w * 0.06, h * 0.035, 0.3, 0, Math.PI * 2); g.fill(); }  // a hand
    // varnish: warm, darkened at the edges
    const v = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8); v.addColorStop(0, "rgba(90,60,10,0.08)"); v.addColorStop(1, "rgba(10,6,2,0.55)"); g.fillStyle = v; g.fillRect(0, 0, w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }); mat.userData.cls = "painting";
    const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, y + H / 2, z);
    c.add(geo, mat, { sheet: true });                                  // the canvas: a sheet in its frame
  },
});
