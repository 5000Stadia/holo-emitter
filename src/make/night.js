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

// the stars (Kabe, 2026-10-13: "Moon tests the sky should have stars unless otherwise covered by clouds/fog"): a dome just
// inside the sky, painted once on a canvas as the sky's own picture (a phone's GPU draws a point one pixel wide whatever its
// size, so they are dots in a texture, not points), the same stars on every device and every night (a fixed seed). A bright
// moon drowns the faint ones, as it does (a full moon leaves about a quarter); `cover` (0 clear, 1 overcast or thick fog: the
// weather's, R71) hides them. Above the horizon only, spread evenly over the dome, a few bright and many faint.
// starDome(THREE, moon, { cover, width, rng }) -> a Mesh to put in the sky (it follows the eye), or null when none can be seen
export function starDome(THREE, moon, { cover = 0, width = 4096, rng = Math.random, radius = 2350 } = {}) {
  const k = Math.max(0, Math.min(1, moon)), clear = 1 - Math.max(0, Math.min(1, cover)); if (clear <= 0.02) return null;
  const W = width, H = width / 2, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const n = 2600, cut = 0.03 + 0.39 * k; let drawn = 0;   // (the moon's glare: under a full moon only the brighter quarter shows; a new moon, two thirds)
  for (let i = 0; i < n; i++) {
    const y = 0.04 + 0.96 * rng(), u = rng(), m = rng() ** 3, tint = rng();   // evenly over the dome above the horizon; brightness skewed faint
    if (m < cut) continue;
    const row = Math.acos(y) / Math.PI * H, col = u * W, b = Math.min(1, (m - cut) / (1 - cut) * 1.15);
    // (near the zenith the picture is stretched across: a star drawn narrower there stays round on the dome)
    const sx = Math.max(0.6, Math.sqrt(Math.max(0, 1 - y * y))), r = (0.7 + 1.3 * m) * (W / 4096);
    g.fillStyle = `rgba(${tint < 0.15 ? "255,226,196" : tint > 0.85 ? "200,214,255" : "236,240,255"},${(0.35 + 0.65 * b).toFixed(3)})`;
    g.beginPath(); g.ellipse(col, row, r / sx, r, 0, 0, 2 * Math.PI); g.fill(); drawn++;
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: clear, fog: false, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  mesh.name = "stars"; mesh.renderOrder = -2; mesh.userData.stars = drawn; return mesh;
}
