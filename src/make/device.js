// What kind of device this is, for the engine's per-device choices (design/perf/phone-2026.md). Safe outside a browser.
//   PHONE: a coarse pointer on a small screen (render.js's tier, texjobs.js's pool)
//   TEX_HALF: textures at phone density (texjobs.js: at most 512 a side, the floor at half its px/m, pixels let go once
//     uploaded; books.js: its atlases at half size). ?tex=half / ?tex=full override the device
const Q = new URLSearchParams(typeof location === "object" ? location.search : "");
export const PHONE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches && typeof screen === "object" && Math.min(screen.width, screen.height) < 900;
export const TEX_HALF = Q.get("tex") ? Q.get("tex") === "half" : PHONE;
// a canvas drawn at full size, kept at half on a phone (the copy the GPU gets; the full one is let go)
export function halfCanvas(c) {
  if (!TEX_HALF || typeof document !== "object" || c.width < 1024) return c;
  const h = document.createElement("canvas"); h.width = c.width >> 1; h.height = c.height >> 1;
  const g = h.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, h.width, h.height);
  c.width = c.height = 1;            // (its pixels freed now, not when it is collected)
  return h;
}
