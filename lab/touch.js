// Touch controls for the walkable labs: the left half of the screen is a walking stick (it appears where
// your thumb lands), the right half looks (drag), and a quick tap anywhere acts on what is under it.
// touchControls(canvas, { onLook(dx, dy), onTap(clientX, clientY) }) -> { stick: {x, y} in -1..1, active }
export const isTouch = () => matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

export function touchControls(canvas, { onLook = () => {}, onTap = () => {} } = {}) {
  const st = { stick: { x: 0, y: 0 }, active: false };
  const R = 60;                                              // the stick's reach, px
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
      stickId = e.pointerId; sx = e.clientX; sy = e.clientY; st.active = true;
      base.style.left = knob.style.left = sx + "px"; base.style.top = knob.style.top = sy + "px";
      base.style.display = knob.style.display = "block";
    } else if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId === stickId) {
      let dx = e.clientX - sx, dy = e.clientY - sy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.left = sx + dx + "px"; knob.style.top = sy + dy + "px";
      st.stick.x = dx / R; st.stick.y = dy / R;
    } else if (e.pointerId === lookId) { onLook((e.clientX - lx) * 2.2, (e.clientY - ly) * 2.2); lx = e.clientX; ly = e.clientY; }
  });
  const up = (e) => {
    const d = downs.get(e.pointerId); downs.delete(e.pointerId);
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10 && performance.now() - d.t < 350) onTap(e.clientX, e.clientY);
    if (e.pointerId === stickId) { stickId = null; st.stick.x = st.stick.y = 0; st.active = false; base.style.display = knob.style.display = "none"; }
    if (e.pointerId === lookId) lookId = null;
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  return st;
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
