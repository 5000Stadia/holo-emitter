// Night, by the moon (Kabe, 2026-10-12: "seeing outside the difference between the full moon and the new moon"): what the
// sun, the sky's fill, the sky itself, the haze and the windows give by night, from the moon's lit share (0 new, 0.5 a
// half, 1 full). A full moon is ~1/400,000 of the sun, too dark to see by on a screen, so the night is drawn as the eye
// sees it, dim and blue, its shapes readable under a full moon and gone under a new one but where a fire, a window or what
// you carry lights them. Pure numbers; lab/manor ?moon=full|new|half|0..1 sets them on its lights.
// nightLight(moon) -> { moon: { color, intensity }, hemi: { sky, ground, intensity }, sky: { top, horizon }, fog, glass, windows }
//   glass: what the day painted into the leaded lights keeps (a multiplier); windows: the window lights' share of their day
const mix = (a, b, t) => { const c = (x, s) => (x >> s) & 255, m = (s) => Math.round(c(a, s) + (c(b, s) - c(a, s)) * t); return (m(16) << 16) | (m(8) << 8) | m(0); };

export function moonOf(q) {
  if (q == null) return null;
  const named = { full: 1, gibbous: 0.75, half: 0.5, crescent: 0.2, new: 0 };
  return q in named ? named[q] : Math.max(0, Math.min(1, Number(q) || 0));
}

export function nightLight(moon) {
  const k = Math.max(0, Math.min(1, moon));
  return {
    moon: { color: 0xa9bde6, intensity: 0.5 * k },
    hemi: { sky: 0x3a4a72, ground: 0x0d0b09, intensity: 0.035 + 0.065 * k },
    sky: { top: mix(0x020309, 0x0b1424, k), horizon: mix(0x070a12, 0x1a2538, k) },
    fog: mix(0x04060b, 0x18212f, k),
    glass: 0.03 + 0.14 * k,
    windows: 0.01 + 0.06 * k,
  };
}

// the moon in the sky: a disc lit on the side towards the sun, its lit share `moon`; null at a new moon (nothing to see)
export function moonDisc(THREE, moon, { size = 64, color = "#e9eef6" } = {}) {
  if (!(moon > 0.03)) return null;
  const cv = document.createElement("canvas"); cv.width = cv.height = size; const g = cv.getContext("2d"), r = size / 2 - 1;
  // the lit side: the right half-disc, then an ellipse of the terminator's width added (gibbous) or taken away (crescent)
  const c = size / 2, w = Math.abs(1 - 2 * moon) * r;
  g.fillStyle = color; g.beginPath(); g.arc(c, c, r, -Math.PI / 2, Math.PI / 2); g.fill();
  if (moon < 0.5) g.globalCompositeOperation = "destination-out";
  g.beginPath(); g.ellipse(c, c, Math.max(0.01, w), r, 0, 0, 2 * Math.PI); g.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, depthWrite: false }));
}
