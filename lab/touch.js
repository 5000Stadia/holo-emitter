// Touch controls for the walkable labs: the left half of the screen is a walking stick (it appears where
// your thumb lands), the right half looks (drag), and a quick tap anywhere acts on what is under it.
// touchControls(canvas, { onLook(dx, dy, speed), onTap(clientX, clientY), onDown(x, y), onLift(), strideLock })
//   -> { stick: {x, y} in -1..1, active, stride 0..1, auto, stop() }
// The stick has a small dead zone (a resting thumb doesn't creep); pushed past four-fifths of its reach it
// strides (stride ramps 0..1; the knob glows brass), so walking needs no second finger (Apple, WWDC26 358: a
// small tilt walks, a large one sprints). With strideLock, drawing the thumb on up to the chevron above the
// stick and letting go keeps striding where you look, until any touch on the left half, or the page's stop().
// Looking is scaled to the screen (a swipe across its short side turns you as far on a small phone as on a
// tablet), with a gentle gain on fast flicks only; everything lets go when the page loses focus (a call, a
// notification); nothing starts inside the notch's or the home bar's safe area.
import { ICONS } from "./ui/cues.js";
const insets = () => { const p = document.createElement("div"); p.style.cssText = "position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);visibility:hidden";
  document.body.append(p); const c = getComputedStyle(p), r = { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 }; p.remove(); return r; };
export const isTouch = () => matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
// a drag that starts on a thumb button is a look, not a press: the button hands it here
let lookSink = null;
const SLOP = 12;                                              // px a touch may wander and still be a tap (Android's touch slop is 8 dp)
// the rad-per-px gain a look drag gets: 1 for a slow drag, rising to 1.5 for a flick (a U-turn in one swipe)
const flick = (speed) => 1 + Math.min(0.5, Math.max(0, speed - 0.9) * 0.5);

export function touchControls(canvas, { onLook = () => {}, onTap = () => {}, onDown = () => {}, onLift = () => {}, strideLock = false } = {}) {
  const st = { stick: { x: 0, y: 0 }, active: false, stride: 0, auto: false, stop: () => {} };
  const R = 60, DEAD = 0.12, RUN = 0.8, LOCK = 2.1;           // the stick's reach, px; its dead zone and where striding starts, as shares of it; the lock's chevron, reaches above
  const lookScale = () => 2.2 * 420 / Math.max(300, Math.min(innerWidth, innerHeight));
  const base = document.createElement("div"), knob = document.createElement("div"), chev = document.createElement("div");
  for (const [el, size, bg] of [[base, 2 * R, "rgba(236,228,210,0.12)"], [knob, 54, "rgba(201,169,97,0.55)"], [chev, 40, "rgba(22,19,16,0.45)"]])
    Object.assign(el.style, { position: "fixed", width: size + "px", height: size + "px", marginLeft: -size / 2 + "px", marginTop: -size / 2 + "px", boxSizing: "border-box",
      borderRadius: "50%", background: bg, border: "1px solid rgba(236,228,210,0.35)", pointerEvents: "none", zIndex: 4, display: "none", transition: "background .12s, box-shadow .12s" });
  chev.innerHTML = `<svg width="38" height="38" viewBox="0 0 24 24" style="display:block"><path d="M7 14l5-5 5 5M7 18l5-5 5 5" fill="none" stroke="#ece4d2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  document.body.append(base, knob, chev);
  let stickId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0, lt = 0, armed = 0;
  const downs = new Map();                                   // for telling a tap from a drag
  const show = (on) => { base.style.display = knob.style.display = on ? "block" : "none"; if (!on) chev.style.display = "none"; };
  const glow = () => { const s = st.stride > 0.5 || st.auto;
    knob.style.background = s ? "rgba(232,196,120,0.9)" : "rgba(201,169,97,0.55)"; knob.style.boxShadow = s ? "0 0 14px rgba(232,196,120,0.75)" : "none";
    chev.style.background = armed ? "rgba(201,163,92,0.75)" : "rgba(22,19,16,0.45)"; };
  const stopAuto = () => { if (!st.auto) return; st.auto = false; st.active = false; st.stick.x = st.stick.y = 0; st.stride = 0; show(false); glow(); };
  st.stop = stopAuto;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    // any touch on the left half ends a locked stride (and that touch is not also a tap on what lies under it)
    const ended = st.auto && e.clientX < innerWidth / 2; if (ended) stopAuto();
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), far: ended });
    if (!ended) onDown(e.clientX, e.clientY);
    if (e.clientX < innerWidth / 2 && stickId === null) {
      const I = insets(); stickId = e.pointerId; sx = Math.max(R + I.l + 8, e.clientX); sy = Math.min(innerHeight - R - I.b - 8, Math.max(R + I.t, e.clientY)); st.active = true; armed = 0;
      base.style.left = knob.style.left = chev.style.left = sx + "px"; base.style.top = knob.style.top = sy + "px"; chev.style.top = Math.max(24 + I.t, sy - LOCK * R) + "px";
      show(true);
    } else if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; lt = e.timeStamp; }
  });
  canvas.addEventListener("pointermove", (e) => {
    const d0 = downs.get(e.pointerId); if (d0 && !d0.far && Math.hypot(e.clientX - d0.x, e.clientY - d0.y) >= SLOP) { d0.far = true; onLift(); }
    if (e.pointerId === stickId) {
      let dx = e.clientX - sx, dy = e.clientY - sy; const d = Math.hypot(dx, dy), raw = d / R;
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.left = sx + dx + "px"; knob.style.top = sy + dy + "px";
      const m = Math.hypot(dx, dy) / R, k = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD) / (m || 1);
      st.stick.x = dx / R * k; st.stick.y = dy / R * k;
      st.stride = Math.max(0, Math.min(1, (raw - RUN) / (1 - RUN)));
      // the lock: shown while striding forward; armed with the thumb on it
      if (strideLock) { chev.style.display = st.stride > 0 && dy < -0.5 * Math.abs(dx) ? "block" : chev.style.display;
        const cy = parseFloat(chev.style.top); armed = Math.hypot(e.clientX - sx, e.clientY - cy) < 34 ? 1 : 0; }
      glow();
    } else if (e.pointerId === lookId) {
      const k = lookScale(), dt = Math.max(1, e.timeStamp - lt), mx = e.clientX - lx, my = e.clientY - ly, speed = Math.hypot(mx, my) / dt, g = flick(speed);
      onLook(mx * k * g, my * k * g, speed); lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
    }
  });
  const up = (e) => {
    const d = downs.get(e.pointerId); downs.delete(e.pointerId);
    // (a cancelled touch is never a tap: the system took it, for a gesture or a call)
    if (d && !d.far && e.type === "pointerup" && Math.hypot(e.clientX - d.x, e.clientY - d.y) < SLOP && performance.now() - d.t < 350) onTap(e.clientX, e.clientY); else if (d && !d.far) onLift();
    if (e.pointerId === stickId) { stickId = null;
      if (armed && e.type === "pointerup") { st.auto = true; st.stick.x = 0; st.stick.y = -1; st.stride = 1; knob.style.left = sx + "px"; knob.style.top = sy - R + "px"; chev.style.display = "block"; glow(); }
      else { st.stick.x = st.stick.y = 0; st.stride = 0; st.active = false; show(false); glow(); } armed = 0; }
    if (e.pointerId === lookId) lookId = null;
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  const release = () => { downs.clear(); stickId = lookId = null; st.stick.x = st.stick.y = 0; st.stride = 0; st.active = st.auto = false; show(false); glow(); };
  addEventListener("blur", release); document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
  lookSink = (dx, dy, speed) => { const k = lookScale(), g = flick(speed); onLook(dx * k * g, dy * k * g, speed); };
  return st;
}

// A thumb button: a tap (lifted within the slop, under 600 ms) presses it; a drag that starts on it looks,
// as the canvas would (the right thumb rests where the buttons are, and a look begun on one had pressed it:
// the use button acted on pointerdown). The click that follows a press is swallowed: a press that opens the
// talk panel had its click land on the panel's Accuse button under the thumb, 13 times in 14 (second playtest).
function thumbButton(b, onPress) {
  const swallow = (e) => { e.stopPropagation(); e.preventDefault(); };
  let id = null, x0 = 0, y0 = 0, lx = 0, ly = 0, lt = 0, t0 = 0, dragging = false;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (id !== null) return; id = e.pointerId; x0 = lx = e.clientX; y0 = ly = e.clientY; t0 = lt = e.timeStamp; dragging = false;
    try { b.setPointerCapture(id); } catch (_) {} b.style.filter = "brightness(1.6)"; });
  b.addEventListener("pointermove", (e) => { if (e.pointerId !== id) return;
    if (!dragging && Math.hypot(e.clientX - x0, e.clientY - y0) >= SLOP) { dragging = true; b.style.filter = ""; }
    if (dragging && lookSink) { const dt = Math.max(1, e.timeStamp - lt); lookSink(e.clientX - lx, e.clientY - ly, Math.hypot(e.clientX - lx, e.clientY - ly) / dt); }
    lx = e.clientX; ly = e.clientY; lt = e.timeStamp; });
  const end = (e) => { if (e.pointerId !== id) return; id = null; b.style.filter = "";
    if (!dragging && e.type === "pointerup" && e.timeStamp - t0 < 600) { addEventListener("click", swallow, { capture: true, once: true }); setTimeout(() => removeEventListener("click", swallow, { capture: true }), 600); onPress(); } };
  b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
}
// the thumb buttons sit in from the safe area by CSS (a phone turned over moves its notch; the insets had been read once)
const safe = (side, px) => `calc(${px}px + env(safe-area-inset-${side}, 0px))`;

// The thumb's action button (bottom right, clear of the home bar): it shows what the centre dot is on
// (an open hand to take, a pointing finger to use, a padlock when it is shut) and does it when pressed;
// hidden when the dot is on nothing. actionButton(onPress) -> show(mode | null)
export function actionButton(onPress) {
  const b = document.createElement("button");
  b.setAttribute("aria-label", "Use");
  Object.assign(b.style, { position: "fixed", right: safe("right", 18), bottom: safe("bottom", 22), width: "72px", height: "72px", borderRadius: "50%", zIndex: 4,
    border: "1px solid rgba(236,228,210,0.45)", background: "rgba(22,19,16,0.6)", display: "none", padding: "0", touchAction: "none" });
  thumbButton(b, onPress);
  document.body.append(b);
  let shown;
  return (mode) => { if (mode === shown) return; shown = mode; b.style.display = mode ? "grid" : "none"; b.style.placeItems = "center";
    if (mode) { b.innerHTML = ICONS[mode].replace('width="24" height="24"', 'width="40" height="40"'); b.setAttribute("aria-label", mode === "take" ? "Take" : mode === "locked" ? "Locked" : mode === "talk" ? "Talk" : mode === "look" ? "Look" : "Use"); } };
}

// Crouch: a smaller button above the thumb's use button, toggling (pressed: down); onToggle(down)
export function crouchButton(onToggle) {
  const b = document.createElement("button"); let down = false;
  b.setAttribute("aria-label", "Crouch"); b.textContent = "⌄";
  Object.assign(b.style, { position: "fixed", right: safe("right", 30), bottom: safe("bottom", 112), width: "48px", height: "48px", borderRadius: "50%", zIndex: 4, color: "#ece4d2", font: "22px sans-serif",
    border: "1px solid rgba(236,228,210,0.45)", background: "rgba(22,19,16,0.6)", padding: "0", touchAction: "none" });
  const paint = () => { b.style.background = down ? "rgba(201,163,92,0.55)" : "rgba(22,19,16,0.6)"; };
  thumbButton(b, () => { down = !down; paint(); onToggle(down); });
  document.body.append(b);
  return (d) => { down = d; paint(); };
}

// A word on the controls, once each, at the moment it helps (Myst Mobile's reviews: "no tutorial on the
// controls"; prior art in design/perf/prior-art-touch-controls.md): a small line between the thumbs, gone
// after a few seconds; never again on this device once seen. hint(key, text, ms)
let hintEl = null;
export function hint(key, text, ms = 5000) {
  const K = `holo-emitter/hint/${key}`;
  try { if (localStorage.getItem(K)) return false; localStorage.setItem(K, "1"); } catch (_) { if (hint[key]) return false; hint[key] = 1; }
  if (!hintEl) { hintEl = document.createElement("div"); hintEl.setAttribute("role", "status");
    Object.assign(hintEl.style, { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 4, maxWidth: "min(46ch, calc(100vw - 48px))", boxSizing: "border-box",
      padding: "7px 12px", background: "rgba(18,15,12,0.82)", border: "1px solid rgba(201,163,92,0.6)", borderRadius: "16px", color: "#ece4d2", font: "12px/1.4 'IBM Plex Mono', ui-monospace, monospace",
      textAlign: "center", pointerEvents: "none", transition: "opacity .3s", opacity: "0" });
    document.body.append(hintEl); }
  // between the thumbs: upright, above the stick's ground (a third of the way up), and turned over, at the foot between
  // them (the top is the house's line)
  hintEl.style.bottom = safe("bottom", innerWidth > innerHeight ? 16 : Math.round(innerHeight * 0.36));
  hintEl.textContent = text; hintEl.style.opacity = "1"; clearTimeout(hint.t); hint.t = setTimeout(() => { hintEl.style.opacity = "0"; }, ms);
  return true;
}

// Doors for the thumb (touch only; the keyboard and mouse walk as they did):
//  - steer: walking roughly at a doorway (within ~30 degrees, 1.5 m), your heading bends onto its middle, so you go
//    through rather than stop on the jamb (corner correction, as 2D action games do; the jamb slide stays behind it)
//  - push: walking into a shut door for 0.3 s opens it, as the use button would (PUBG and Fortnite's auto-open);
//    a locked one refuses once, in its own words
// doorAssist({ openings, floorAt(h) -> floor id, open(openingId) -> bool, shut(openingId) -> thing | null, use(thing) })
export function doorAssist({ openings, floorAt, isOpen, shutDoor, use, autodoor = true }) {
  const ops = openings.filter(o => o.rect && o.joins.length === 2).map(o => { const R = o.rect, ew = o.axis === "EW";
    return { id: o.id, floor: o.floor, ew, cx: (R.x0 + R.x1) / 2, cy: (R.y0 + R.y1) / 2, hw: (ew ? R.y1 - R.y0 : R.x1 - R.x0) / 2, ht: (ew ? R.x1 - R.x0 : R.y1 - R.y0) / 2 }; });
  // the doorway you are walking at: along its axis s (signed distance to its middle plane), across it l
  const ahead = (x, y, h, ux, uy, reach) => { const f = floorAt(h); let best = null;
    for (const o of ops) { if (o.floor !== f) continue;
      const ax = o.ew ? 1 : 0, ay = o.ew ? 0 : 1, s = (o.cx - x) * ax + (o.cy - y) * ay, l = (x - o.cx) * ay - (y - o.cy) * ax, along = ux * ax + uy * ay;
      if (Math.abs(s) > reach || Math.abs(along) < 0.86 || Math.sign(s) !== Math.sign(along) || Math.abs(l) > o.hw + 0.6) continue;   // within 30 degrees, coming at it
      if (!best || Math.abs(s) < Math.abs(best.s)) best = { o, s, l, ax, ay, along }; }
    return best; };
  let pushT = 0, pushed = null;
  return {
    steer(x, y, h, dx, dy) { const L = Math.hypot(dx, dy); if (!L) return [dx, dy];
      const a = ahead(x, y, h, dx / L, dy / L, 1.5); if (!a) return [dx, dy];
      if (!isOpen(a.o.id) && !autodoor) return [dx, dy];
      const room = Math.max(0, a.o.hw - 0.3);                 // where the body's middle may be and clear both jambs
      if (Math.abs(a.l) <= room || Math.abs(a.s) < 0.25) return [dx, dy];       // clear of both jambs, or already in it
      // bend towards the doorway's middle, the more the nearer (a half at 1.5 m, all of it within 0.75 m)
      const gx = a.o.cx - x, gy = a.o.cy - y, gl = Math.hypot(gx, gy) || 1, w = Math.min(1, 0.75 / Math.max(0.3, Math.abs(a.s)));
      const nx = dx / L * (1 - w) + gx / gl * w, ny = dy / L * (1 - w) + gy / gl * w, n = Math.hypot(nx, ny) || 1;
      return [nx / n * L, ny / n * L]; },
    // after a move: blocked (you made little way), walking at a shut door within 1 m of its middle: open it after 0.3 s
    push(x, y, h, ux, uy, blocked, dt) { if (!autodoor || !blocked) { pushT = 0; return null; }
      const a = ahead(x, y, h, ux, uy, 1.0); if (!a || Math.abs(a.l) > a.o.hw) { pushT = 0; return null; }
      const b = shutDoor(a.o.id); if (!b) { pushT = 0; return null; }
      pushT += dt; if (pushT < 0.3) return null; pushT = 0;
      if (pushed === a.o.id && performance.now() - (this.at || 0) < 2500) return null;   // a locked door says so once a push
      pushed = a.o.id; this.at = performance.now(); return use(b); },
    near(x, y, h, ux, uy) { return ahead(x, y, h, ux, uy, 1.0); },
  };
}

// Fullscreen: a button (top right) that asks for real fullscreen where the browser allows it (Android,
// desktop) and locks landscape on phones; on an iPhone, where Safari refuses fullscreen to pages, it
// says how to get the same thing: Share, then Add to Home Screen (the page then opens with no bars).
export function fullscreenButton() {
  const b = document.createElement("button");
  b.setAttribute("aria-label", "Full screen"); b.textContent = "⛶";
  Object.assign(b.style, { position: "fixed", top: safe("top", 12), right: safe("right", 12), zIndex: 5, width: "44px", height: "44px", borderRadius: "6px",
    border: "1px solid rgba(236,228,210,0.35)", background: "rgba(22,19,16,0.72)", color: "#ece4d2", fontSize: "22px", lineHeight: "40px", cursor: "pointer" });
  const tip = document.createElement("div");
  Object.assign(tip.style, { position: "fixed", top: safe("top", 64), right: safe("right", 12), zIndex: 5, maxWidth: "260px", padding: "10px 12px", background: "rgba(22,19,16,0.9)",
    border: "1px solid rgba(236,228,210,0.35)", color: "#ece4d2", font: "13px/1.5 system-ui, sans-serif", display: "none", borderRadius: "6px" });
  tip.textContent = "Safari on iPhone keeps its bars for web pages. For full screen: tap Share, then Add to Home Screen, and open it from there.";
  const standalone = matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;                                     // already opened from the home screen: nothing to do
  b.addEventListener("click", async (e) => {
    e.stopPropagation();
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (req) {
      try { await req.call(el, { navigationUI: "hide" }); try { await screen.orientation.lock("landscape"); } catch (_) {} return; } catch (_) {}
    }
    tip.style.display = tip.style.display === "none" ? "block" : "none";
    setTimeout(() => { tip.style.display = "none"; }, 7000);
  });
  document.body.append(b, tip);
}
