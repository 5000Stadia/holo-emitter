// The keys of a keypad, on the screen (R79's keypad; prior art in design/references/traits/plan-r2.md): ten small keys in
// the world can't be hit on a phone (a thumb wants 9-10 mm, 48 px; WCAG 2.5.5, Material), so using a keypad opens its keys
// as a panel: twelve 60 px keys, a dot for each digit keyed, the code tried as its last digit goes in (no Enter key for four
// digits), a buzz and a shake for a wrong one, a short glow for the right one. Number keys work on a keyboard, Escape
// closes. Once you know its code (a person told you, a note showed you) a button keys it in for you: no aim needed.
// Guessing is allowed and costs nothing: no lockout (the proof never counts on it; src/make/case.js).
//   codePad({ length, remembered, onEnter(digits) -> { ok, said }, onClose }) -> { close() }
export function codePad({ length = 4, remembered = null, onEnter, onClose = () => {} }) {
  document.exitPointerLock?.();
  const el = document.createElement("div"); el.id = "codepad"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "keypad");
  el.style.cssText = "position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(6,6,8,.45)";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✕"];
  el.innerHTML = `<div class="pad" style="background:#16181b;border:1px solid #5b6168;border-radius:14px;padding:16px;width:min(300px,86vw);box-shadow:0 10px 40px rgba(0,0,0,.6);font:500 16px/1.2 system-ui;color:#e6e9ec">
    <div class="dots" aria-live="polite" style="display:flex;gap:12px;justify-content:center;height:22px;margin:4px 0 14px"></div>
    <div class="keys" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${keys.map(k => `<button data-k="${k}" aria-label="${k === "⌫" ? "delete" : k === "✕" ? "close" : k}" style="height:60px;font:600 24px system-ui;color:#e6e9ec;background:#2a2e33;border:1px solid #444b52;border-radius:10px;touch-action:manipulation">${k}</button>`).join("")}</div>
    ${remembered ? `<button data-k="known" style="margin-top:12px;width:100%;min-height:52px;font:600 16px system-ui;color:#10140f;background:#9fd18a;border:0;border-radius:10px">Use the code you know</button>` : ""}
  </div>`;
  document.body.appendChild(el);
  const pad = el.querySelector(".pad"), dots = el.querySelector(".dots");
  let got = "", busy = false;
  const draw = (tone = null) => { dots.innerHTML = Array.from({ length }, (_, i) => `<span style="width:14px;height:14px;border-radius:50%;border:2px solid ${tone || "#c9ced3"};background:${i < got.length ? tone || "#c9ced3" : "transparent"}"></span>`).join(""); };
  const close = () => { removeEventListener("keydown", onKey, true); el.remove(); onClose(); };
  const tryIt = (digits) => { busy = true; const r = onEnter(digits) || {};
    if (r.ok) { draw("#8fd16f"); setTimeout(close, 380); return; }
    draw("#e0644f"); pad.animate([{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(0)" }], { duration: 320 });
    navigator.vibrate?.(120); setTimeout(() => { got = ""; busy = false; draw(); }, 420); };
  const press = (k) => { if (busy) return;
    if (k === "✕") return close();
    if (k === "known") { got = remembered; draw(); return tryIt(got); }
    if (k === "⌫") { got = got.slice(0, -1); return draw(); }
    if (/^\d$/.test(k) && got.length < length) { got += k; draw(); if (got.length === length) tryIt(got); } };
  el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) press(b.dataset.k); else if (e.target === el) close(); });
  const onKey = (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("⌫"); else if (e.key === "Escape") press("✕"); else return; e.preventDefault(); e.stopPropagation(); };
  addEventListener("keydown", onKey, true);
  draw();
  return { close };
}
