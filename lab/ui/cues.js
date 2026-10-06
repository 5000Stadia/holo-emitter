// The cursor's three cues, as small drawn icons (Kabe, 2026-10-06: "not pop up text but simply change
// to a small icon for take and one for act"): an open hand to take, a pointing finger to use, a padlock
// when something shuts it. Pointer-locked, the centre dot becomes the icon; with a free mouse, the
// cursor does. The words go to a visually hidden live label, for screen readers only.
const STROKE = `stroke="#f2ead8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="rgba(20,16,12,0.55)"`;
export const ICONS = {
  take: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path ${STROKE} d="M8 12V5.5a1.4 1.4 0 0 1 2.8 0V11m0-6.5V4a1.4 1.4 0 0 1 2.8 0v7m0-6a1.4 1.4 0 0 1 2.8 0v6.5m0-4a1.4 1.4 0 0 1 2.8 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4.6 15.4a1.5 1.5 0 0 1 2.3-1.9L8 14.6"/></svg>`,
  act: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path ${STROKE} d="M9.5 13V4.6a1.5 1.5 0 0 1 3 0V11l4.6.9a2.4 2.4 0 0 1 1.9 2.7l-.7 4.4A3.5 3.5 0 0 1 14.8 22H11a3.6 3.6 0 0 1-2.9-1.5l-3.3-4.6a1.5 1.5 0 0 1 2.3-1.9z"/></svg>`,
  locked: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect ${STROKE} x="5" y="11" width="14" height="10" rx="2"/><path ${STROKE} fill="none" d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.4" fill="#f2ead8"/></svg>`,
};
const cursorOf = (k) => `url("data:image/svg+xml,${encodeURIComponent(ICONS[k])}") 12 12, pointer`;

// mount the cue on a page: dot is the centre dot element, canvas the 3D canvas
export function cues(dot, canvas) {
  const live = Object.assign(document.createElement("div"), { role: "status", ariaLive: "polite" });
  live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  document.body.append(live);
  let shown = null;
  return function show(cue, locked) {
    const key = cue ? cue.mode : null;
    if (cue && live.textContent !== cue.label) live.textContent = cue.label;
    if (key === shown) return;
    shown = key;
    dot.innerHTML = locked && key ? ICONS[key] : "";
    dot.classList.toggle("icon", !!(locked && key));
    canvas.style.cursor = !locked && key ? cursorOf(key) : "";
  };
}
