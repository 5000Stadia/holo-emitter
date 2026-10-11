// A person present in the house, as the holodeck shows them (M7, R57; Kabe, 2026-10-07: bodies and crowds wait; the
// project's own fiction gives a projection its reason): a life-size bust that turns to face you, a faint scanning
// shimmer over it, and a disc of the holodeck grid on the floor where they stand. Its picture is any canvas (painted
// in code by the portrait part now; a portrait made once at authoring later), so the image can change without the
// presence changing. makePresence(THREE, { picture: canvas, name, at: [x, y, floorZ], height }) -> { group, tick(t, camera) }
export function makePresence(THREE, { picture, name, at, height = 1.62, seed = 1 }) {
  // (node materials from the start: the page's late conversion of every material twinned these without their alpha map,
  // and on WebGPU without their picture: a white slab, 2026-10-07)
  const Basic = THREE.MeshBasicNodeMaterial || THREE.MeshBasicMaterial;
  const group = new THREE.Group(); group.name = `presence:${name}`; group.position.set(at[0], at[2], -at[1]);
  const W = 0.62, H = W * picture.height / picture.width;
  const tex = new THREE.CanvasTexture(picture); tex.colorSpace = THREE.SRGBColorSpace;
  // the bust: the picture, edges fading to nothing (no frame: a projection, not a painting)
  const fade = document.createElement("canvas"); fade.width = 64; fade.height = 64; { const g = fade.getContext("2d"), r = g.createRadialGradient(32, 26, 10, 32, 30, 34); r.addColorStop(0, "#fff"); r.addColorStop(0.75, "#fff"); r.addColorStop(1, "#000"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const bust = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new Basic({ map: tex, alphaMap: new THREE.CanvasTexture(fade), transparent: true, depthWrite: false, opacity: 0.92, side: THREE.DoubleSide }));
  bust.position.y = height - H * 0.42; group.add(bust);
  // the shimmer: thin bright lines drifting down over it
  const lines = document.createElement("canvas"); lines.width = 4; lines.height = 64; { const g = lines.getContext("2d"); g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, 4, 64); for (let y = 0; y < 64; y += 8) { g.fillStyle = "rgba(150,210,255,0.22)"; g.fillRect(0, y, 4, 1); } }
  const lt = new THREE.CanvasTexture(lines); lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set(1, H * 30);
  const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new Basic({ map: lt, alphaMap: bust.material.alphaMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  shimmer.position.z = 0.002; bust.add(shimmer);                     // on the bust, turning with it
  // the floor: a disc of the holodeck grid, glowing faintly, where they stand
  const disc = document.createElement("canvas"); disc.width = disc.height = 256; { const g = disc.getContext("2d"), c = 128;
    const r = g.createRadialGradient(c, c, 10, c, c, c); r.addColorStop(0, "rgba(120,190,255,0.35)"); r.addColorStop(1, "rgba(120,190,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(170,220,255,0.5)"; g.lineWidth = 1.5; for (let k = 0; k <= 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
    g.globalCompositeOperation = "destination-in"; const m = g.createRadialGradient(c, c, 60, c, c, c); m.addColorStop(0, "#000"); m.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = m; g.fillRect(0, 0, 256, 256); }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new Basic({ map: new THREE.CanvasTexture(disc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.012; group.add(floor);
  // the beam: a faint column of the emitter's light from the disc up to the bust, so the two read as one person standing
  // there (without it the bust floated, and on a phone seemed to hang behind whatever stood beyond the disc)
  const beamH = bust.position.y - H * 0.3, ramp = document.createElement("canvas"); ramp.width = 4; ramp.height = 64;
  { const g = ramp.getContext("2d"), r = g.createLinearGradient(0, 64, 0, 0); r.addColorStop(0, "rgba(140,200,255,0.55)"); r.addColorStop(0.7, "rgba(140,200,255,0.18)"); r.addColorStop(1, "rgba(140,200,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 4, 64); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, beamH, 24, 1, true), new Basic({ map: new THREE.CanvasTexture(ramp), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.32 }));
  beam.position.y = beamH / 2 + 0.01; group.add(beam);
  // what you aim at to talk: an invisible column the body would fill
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, height, 8), new Basic({ visible: false })); hit.position.y = height / 2; hit.userData.presence = name; group.add(hit);
  group.userData = { presence: name, hit };
  // each frame: turn to face you (about the vertical), the shimmer drifting, a faint breath of brightness
  function tick(t, camera) {
    const dx = camera.position.x - group.position.x, dz = camera.position.z - group.position.z; bust.rotation.y = Math.atan2(dx, dz);
    lt.offset.y = (t * 0.06) % 1; bust.material.opacity = 0.86 + 0.06 * Math.sin(t * 1.7 + seed);
  }
  return { group, tick, hit };
}
