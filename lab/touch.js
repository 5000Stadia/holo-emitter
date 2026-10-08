// Touch controls for the walkable labs: the left half of the screen is a walking stick (it appears where
// your thumb lands), the right half looks (drag), and a quick tap anywhere acts on what is under it.
// touchControls(canvas, { onLook(dx, dy), onTap(clientX, clientY) }) -> { stick: {x, y} in -1..1, active }
// The stick has a small dead zone (a resting thumb doesn't creep); looking is scaled to the screen, so a
// swipe across it turns you as far on a small phone as on a tablet; everything lets go when the page
// loses focus (a call, a notification); nothing starts inside the notch's or the home bar's safe area.
import { ICONS } from "./ui/cues.js";
const insets = () => { const p = document.createElement("div"); p.style.cssText = "position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);visibility:hidden";
  document.body.append(p); const c = getComputedStyle(p), r = { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 }; p.remove(); return r; };
export const isTouch = () => matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

export function touchControls(canvas, { onLook = () => {}, onTap = () => {} } = {}) {
  const st = { stick: { x: 0, y: 0 }, active: false };
  const R = 60, DEAD = 0.12;                                 // the stick's reach, px; its dead zone, as a share of it
  const lookScale = () => 2.2 * 420 / Math.max(300, Math.min(innerWidth, innerHeight));
  const base = document.createElement("div"), knob = document.createElement("div");
  for (const [el, size, bg] of [[base, 2 * R, "rgba(236,228,210,0.12)"], [knob, 54, "rgba(201,169,97,0.55)"]])
    Object.assign(el.style, { position: "fixed", width: size + "px", height: size + "px", marginLeft: -size / 2 + "px", marginTop: -size / 2 + "px",
      borderRadius: "50%", background: bg, border: "1px solid rgba(236,228,210,0.35)", pointerEvents: "none", zIndex: 4, display: "none" });
  document.body.append(base, knob);
  let stickId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0;
  const downs = new Map();                                   // for telling a tap from a drag
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (e.clientX < innerWidth / 2 && stickId === null) {
      const I = insets(); stickId = e.pointerId; sx = Math.max(R + I.l + 8, e.clientX); sy = Math.min(innerHeight - R - I.b - 8, Math.max(R + I.t, e.clientY)); st.active = true;
      base.style.left = knob.style.left = sx + "px"; base.style.top = knob.style.top = sy + "px";
      base.style.display = knob.style.display = "block";
    } else if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId === stickId) {
      let dx = e.clientX - sx, dy = e.clientY - sy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.left = sx + dx + "px"; knob.style.top = sy + dy + "px";
      const m = Math.hypot(dx, dy) / R, k = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD) / (m || 1);
      st.stick.x = dx / R * k; st.stick.y = dy / R * k;
    } else if (e.pointerId === lookId) { const k = lookScale(); onLook((e.clientX - lx) * k, (e.clientY - ly) * k); lx = e.clientX; ly = e.clientY; }
  });
  const up = (e) => {
    const d = downs.get(e.pointerId); downs.delete(e.pointerId);
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10 && performance.now() - d.t < 350) onTap(e.clientX, e.clientY);
    if (e.pointerId === stickId) { stickId = null; st.stick.x = st.stick.y = 0; st.active = false; base.style.display = knob.style.display = "none"; }
    if (e.pointerId === lookId) lookId = null;
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  const release = () => { downs.clear(); stickId = lookId = null; st.stick.x = st.stick.y = 0; st.active = false; base.style.display = knob.style.display = "none"; };
  addEventListener("blur", release); document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
  return st;
}

// The thumb's action button (bottom right, clear of the home bar): it shows what the centre dot is on
// (an open hand to take, a pointing finger to use, a padlock when it is shut) and does it when pressed;
// hidden when the dot is on nothing. actionButton(onPress) -> show(mode | null)
export function actionButton(onPress) {
  const b = document.createElement("button"), I = insets();
  b.setAttribute("aria-label", "Use");
  Object.assign(b.style, { position: "fixed", right: 18 + I.r + "px", bottom: 22 + I.b + "px", width: "72px", height: "72px", borderRadius: "50%", zIndex: 4,
    border: "1px solid rgba(236,228,210,0.45)", background: "rgba(22,19,16,0.6)", display: "none", padding: "0", touchAction: "none" });
  // (the click that follows a press is swallowed: the press opens the talk panel, and its click landed on the panel's
  // Accuse button under the thumb, 13 times in 14 in the second playtest)
  const swallow = (e) => { e.stopPropagation(); e.preventDefault(); };
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); addEventListener("click", swallow, { capture: true, once: true }); setTimeout(() => removeEventListener("click", swallow, { capture: true }), 600); onPress(); });
  document.body.append(b);
  let shown;
  return (mode) => { if (mode === shown) return; shown = mode; b.style.display = mode ? "grid" : "none"; b.style.placeItems = "center";
    if (mode) { b.innerHTML = ICONS[mode].replace('width="24" height="24"', 'width="40" height="40"'); b.setAttribute("aria-label", mode === "take" ? "Take" : mode === "locked" ? "Locked" : mode === "talk" ? "Talk" : mode === "look" ? "Look" : "Use"); } };
}

// Crouch: a smaller button above the thumb's use button, toggling (pressed: down); onToggle(down)
export function crouchButton(onToggle) {
  const b = document.createElement("button"), I = insets(); let down = false;
  b.setAttribute("aria-label", "Crouch"); b.textContent = "⌄";
  Object.assign(b.style, { position: "fixed", right: 30 + I.r + "px", bottom: 112 + I.b + "px", width: "48px", height: "48px", borderRadius: "50%", zIndex: 4, color: "#ece4d2", font: "22px sans-serif",
    border: "1px solid rgba(236,228,210,0.45)", background: "rgba(22,19,16,0.6)", padding: "0", touchAction: "none" });
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); down = !down; b.style.background = down ? "rgba(201,163,92,0.55)" : "rgba(22,19,16,0.6)"; onToggle(down); });
  document.body.append(b);
  return (d) => { down = d; b.style.background = d ? "rgba(201,163,92,0.55)" : "rgba(22,19,16,0.6)"; };
}

// Fullscreen: a button (top right) that asks for real fullscreen where the browser allows it (Android,
// desktop) and locks landscape on phones; on an iPhone, where Safari refuses fullscreen to pages, it
// says how to get the same thing: Share, then Add to Home Screen (the page then opens with no bars).
export function fullscreenButton() {
  const b = document.createElement("button");
  b.setAttribute("aria-label", "Full screen"); b.textContent = "⛶";
  Object.assign(b.style, { position: "fixed", top: "12px", right: "12px", zIndex: 5, width: "44px", height: "44px", borderRadius: "6px",
    border: "1px solid rgba(236,228,210,0.35)", background: "rgba(22,19,16,0.72)", color: "#ece4d2", fontSize: "22px", lineHeight: "40px", cursor: "pointer" });
  const tip = document.createElement("div");
  Object.assign(tip.style, { position: "fixed", top: "64px", right: "12px", zIndex: 5, maxWidth: "260px", padding: "10px 12px", background: "rgba(22,19,16,0.9)",
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
