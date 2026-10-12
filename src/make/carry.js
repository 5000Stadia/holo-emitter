// The light you carry (Kabe, 2026-10-12: "slightly increasing the light within a small radius of the player … a completely
// dark room … the desk is faintly in view when prior it was completely not visible … a couple of expected light forms such
// as flashlight or held candlelight … the default should be a very dim illumination"). By default only the eye's own: a
// faint, short pool round you, lost in a lit room and all there is in a dark one, so what is near shows and what is far
// does not. A held candle (warm, wider, at your hand, flickering) and a flashlight (a cone from your eye) are the light
// forms a story can hand you; `none` is nothing. Both lights are in the scene from the start and only their strengths
// change, so changing what you carry never recompiles (every lit pixel pays for every light, lit or not: a phone's 3 ms).
// No shadows: a light at the eye casts them behind what it lights, out of sight.
// makeCarry(THREE, { spot, mode, eye, cap }) -> { lights, set(mode), mode, update(camera, now, focus) -> flickering }
//   focus: how far off what you look at is (m); the eye's pool is held so that nothing in focus is lit more than it would be
//   at `cap` (Kabe, 2026-10-12: "when I go up to objects having them be so notably bright when I am close to them … seems
//   a bit unrealistic … the maximum brightness not … higher than what I would expect moonlight to be"; the radius and every
//   level further off as they were). Its strength follows (focus / cap)^2 under cap, eased like an eye adapting, not stepped
//   eye: the eye's pool as a share of its full strength, by how lit the place already is (a daylit house 0.35, where it is
//   a slight lift at arm's length; the dark 1, where it is all there is): the eye adapts, a candle or a torch does not
//   spot: false keeps the flashlight's cone out of the scene (its cost unpaid); set("flashlight") then carries the candle
export const CARRY = {
  none: null,
  eye: { kind: "point", color: 0xffead2, intensity: 1.6, distance: 0, decay: 2, at: [0, 0, 0] },
  candle: { kind: "point", color: 0xff9c4a, intensity: 7, distance: 0, decay: 2, at: [0.22, -0.32, -0.3], flicker: true },
  flashlight: { kind: "spot", color: 0xfff4e4, intensity: 40, distance: 0, decay: 2, angle: 0.36, penumbra: 0.55, at: [0.12, -0.18, 0] },
};

export function makeCarry(THREE, { spot = true, mode = "eye", eye = 1, cap = 0.7 } = {}) {
  const point = new THREE.PointLight(0xffffff, 0, 1, 2), cone = spot ? new THREE.SpotLight(0xffffff, 0, 1, 0.4, 0.5, 2) : null;
  const lights = cone ? [point, cone, cone.target] : [point];
  const P = new THREE.Vector3(), F = new THREE.Vector3();
  let cur = null, name = "none", adapt = 1, last = 0;
  function set(m) {
    if (!(m in CARRY)) m = "eye";
    if (m === "flashlight" && !cone) m = "candle";
    name = m; cur = CARRY[m]; point.intensity = 0; if (cone) cone.intensity = 0;
    if (!cur) return name;
    const l = cur.kind === "spot" ? cone : point;
    l.color.setHex(cur.color); l.distance = cur.distance; l.decay = cur.decay;
    if (cur.kind === "spot") { l.angle = cur.angle; l.penumbra = cur.penumbra; }
    return name;
  }
  // follows the eye: `at` is right, up, back of the eye in its own frame (a candle held low and to the right, before you)
  function update(camera, now, focus = Infinity) {
    if (!cur) return false;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    const want = Math.min(1, (Math.max(0.05, focus) / cap) ** 2); adapt += (want - adapt) * (dt ? 1 - Math.exp(-dt / 0.18) : 1);
    const l = cur.kind === "spot" ? cone : point;
    P.set(...cur.at).applyQuaternion(camera.quaternion).add(camera.position); l.position.copy(P);
    if (cur.kind === "spot") { F.set(0, 0, -1).applyQuaternion(camera.quaternion); cone.target.position.copy(camera.position).addScaledVector(F, 4); cone.target.updateMatrixWorld(); }
    const t = now / 1000;
    l.intensity = cur.intensity * (name === "eye" ? eye * adapt : 1) * (cur.flicker ? 0.88 + 0.07 * Math.sin(t * 8.1) + 0.05 * Math.sin(t * 13.7 + 1.3) : 1);
    return !!cur.flicker || (name === "eye" && Math.abs(want - adapt) > 0.01);
  }
  set(mode);
  return { lights, set, update, get mode() { return name; } };
}
