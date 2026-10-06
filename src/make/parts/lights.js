// Light that people make: a candle in its candlestick. The stick burns down while it is lit (a
// process: the mover "candle" scales from its socket, the mover "flame" rides its top); the flame and
// its light belong to the light group "flame", shown only while lit; the flame flickers.
import { definePart } from "../catalogue.js";

definePart("candlestick", {
  build(c, { length = 0.2, radius = 0.011, x = 0, y = 0, z = 0 }) {
    const { THREE } = c, lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, yy]) => new THREE.Vector2(r, yy)), seg);
    const base = lathe([[0, 0], [0.05, 0], [0.05, 0.012], [0.022, 0.03], [0.012, 0.05], [0.014, 0.12], [0.01, 0.15], [0.016, 0.16], [0.022, 0.17], [0.014, 0.175], [0, 0.175]]);
    base.translate(x, y, z); c.add(base, "metal");
    // the candle stands in the socket; it burns down from the top
    const top = y + 0.175;
    c.mover("candle", [x, top, z]);
    const stick = new THREE.CylinderGeometry(radius * 0.92, radius, length, 14); stick.translate(x, top + length / 2, z); c.add(stick, "wax", { mover: "candle" });
    // the flame: a small glowing teardrop on the wick, and its light; built at the socket, the burning
    // process lifts it to the candle's top
    c.mover("flame", [x, top, z]);
    const wick = new THREE.CylinderGeometry(0.0012, 0.0012, 0.008, 5); wick.translate(x, top + 0.004, z); c.add(wick, "dark", { mover: "flame" });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.92 });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), flameMat); flame.scale.set(1, 2.6, 1);
    flame.position.set(x, top + 0.02, z); flame.userData.lightGroup = "flame";
    const light = new THREE.PointLight(0xffb070, 0.6, 4, 2); light.position.set(x, top + 0.04, z); light.userData.lightGroup = "flame";
    c.extra(flame, "flame"); c.extra(light, "flame");
    // it flickers while it burns: two slow waves and a quick one, the light following the flame
    c.animate((t, isLit) => { if (!isLit("light")) return;
      const f = 1 + 0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1 + 1.7) + 0.04 * Math.sin(t * 29.7);
      flame.scale.set(1, 2.6 * f, 1); light.intensity = 0.6 * f; });
    c.footprint({ w: 0.1, d: 0.1, h: 0.175 + length });
  },
});
