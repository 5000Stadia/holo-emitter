// The questioning panel (M7, R57): how you speak to a suspect, keep your notebook and make your accusation, on a phone
// first (a bottom sheet under the thumb, the suspect's projection still in view above it), then on a desktop (a card
// docked at the right). It holds no case: the host (the manor page, or lab/ui/talk-demo.html) asks src/make/talk.js and
// calls back in with the answer. A conversation in a 1660 house, so: their lines in a serif, yours in mono, set down
// like a transcript, not bubbles; no label or colour tells a lie from the truth or a deflection from "I know nothing of
// that" (the player must catch it), the one honest sign is a brass rule when a line put something in your notebook.
//
//   makeTalkPanel({ onAsk(topicId, stance), onSay(text), onShow(clueOrThingId, lastTopicId), onAccuse(choice), onClose(),
//                   onOpenAccusation(), onOpenNotebook() })     // the last two: the panel asks, the host answers by calling
//     -> { open({ who, name, role?, portrait: canvas, intro?, topics, evidence }), say({ who: "them"|"you"|"aside", text, act, noted }),
//          setTopics(list), setEvidence(list), busy(bool), guarded(bool), close(), openNotebook(summary),
//          openAccusation({ suspects, pillars, groups? }), accusationResult({ group, ok, text? }), verdict({ title, text }), isOpen(), destroy() }
//   stance is "ask" or "press" (a toggle that applies to the next topic); "show" is onShow, which carries the last topic.
//   topics [{ id, label }], in the order the host wants them (what you have learned first): the first six not yet asked are
//   shown, the rest behind "More…", so the player is never stuck and the text box is only a shortcut. Ids "person:<id>" read as
//   "What of <name>". guarded(true) is a suspect who has closed up (a wrong item shown): the chips dim, nothing is lost.
//   evidence [{ id, label, kind: "clue"|"thing" }].
//   notebook summary { persons: [{ id, name, note }], clues: [{ id, label, from }], contradictions: [{ id, text }] }.
//   accusation { suspects: [{ id, name }], pillars: [{ id, label, lead?, options: [{ id, label }] }],
//     groups?: [{ id, label, keys: ["suspect", pillarId, ...] }] }; blanks are confirmed a group at a time (after Return of the
//     Obra Dinn), so guessing one blank cannot win: onAccuse({ group, picks: { key: optionId }, all }) and the host answers
//     accusationResult({ group, ok }): ok locks the group's blanks, not ok says only that something in it does not hold.
//     With no groups, all blanks are one group. When every group is locked the host calls verdict({ title, text }).
//   Escape, the browser's Back, and a swipe down close the top layer. Keyboard: the sheet follows window.visualViewport.

const MAXCHIPS = 6, THINK_AFTER = 300;
const LEADS = { victim: "killed", killed: "killed", means: "by", method: "by", weapon: "by", motive: "because", why: "because", lock: "; the door was locked by", door: "; the door was locked by", locked: "; the door was locked by" };

const CSS = `
.tp{--ink:#ece4d2;--dim:#a89e88;--line:rgba(236,228,210,.18);--brass:#c9a35c;--paper:rgba(18,15,12,.965);--serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  position:fixed;inset:0;z-index:30;pointer-events:none;color:var(--ink);font:13px/1.45 var(--mono);-webkit-text-size-adjust:100%}
.tp *{box-sizing:border-box}
.tp :where(button){font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.tp button:focus-visible,.tp input:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.tp-sheet{position:absolute;left:0;right:0;bottom:var(--vvb,0px);height:min(calc(var(--vvh,100vh) * .64),600px);display:none;flex-direction:column;pointer-events:auto;
  background:var(--paper);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid var(--brass);border-radius:16px 16px 0 0;
  box-shadow:0 -14px 44px rgba(0,0,0,.6);padding-bottom:env(safe-area-inset-bottom);outline:0;animation:tp-up .22s ease-out}
.tp-sheet.tall{height:min(calc(var(--vvh,100vh) * .9),780px)}
.tp-sheet.short{height:min(calc(var(--vvh,100vh) * .6),520px)}
.tp-sheet.on{display:flex}
@keyframes tp-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes tp-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes tp-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.tp-grip{flex:none;height:18px;display:grid;place-items:center;touch-action:none;cursor:grab}
.tp-grip::before{content:"";width:38px;height:4px;border-radius:2px;background:var(--line)}
.tp-head{flex:none;display:flex;align-items:center;gap:12px;padding:0 8px 8px 16px;border-bottom:1px solid var(--line)}
.tp-port{flex:none;width:48px;height:48px;border-radius:50%;border:1px solid var(--brass);overflow:hidden;background:#0d0b09}
.tp-port canvas{display:block;width:100%;height:100%}
.tp-id{flex:1;min-width:0}
.tp-name{font:600 25px/1.05 var(--serif);color:var(--brass);letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-role{color:var(--dim);font-size:11px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-ib{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid transparent;background:none;display:grid;place-items:center;color:var(--dim)}
.tp-ib:hover{color:var(--ink);border-color:var(--line)}
.tp-ib svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.tp-ib .dot{position:absolute;margin:-14px 0 0 14px;width:8px;height:8px;border-radius:50%;background:var(--brass);display:none}
.tp-ib.fresh .dot{display:block}
.tp-title{font:600 24px/1.1 var(--serif);color:var(--brass);letter-spacing:.03em;flex:1;padding:6px 0}
.tp-log{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 16px 8px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth}
.tp-who{font:500 10.5px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:2px 0 -4px 13px}
.tp-them{font:500 20px/1.34 var(--serif);max-width:30em;padding-left:12px;border-left:1px solid var(--line);animation:tp-in .25s ease-out}
.tp-them p{margin:0}
.tp-them.noted{border-left:2px solid var(--brass);padding-left:11px}
.tp-you{align-self:flex-end;max-width:86%;margin:0;text-align:right;color:var(--dim);font:12.5px/1.5 var(--mono);animation:tp-in .2s ease-out}
.tp-you b{font-weight:500;color:var(--brass);letter-spacing:.08em;text-transform:uppercase;font-size:10.5px;margin-right:6px}
.tp-aside{align-self:center;text-align:center;max-width:28em;margin:2px 0;font:italic 500 17px/1.35 var(--serif);color:var(--dim)}
.tp-noted{align-self:flex-start;margin:-5px 0 0 13px;font-size:11px;color:var(--brass);letter-spacing:.02em;animation:tp-in .3s ease-out}
.tp-think{align-self:flex-start;margin-left:13px;font:500 30px/1 var(--serif);color:var(--ink);animation:tp-pulse 1.3s ease-in-out infinite}
.tp-empty{color:var(--dim);font:italic 500 17px/1.35 var(--serif);text-align:center;margin:auto 0;padding:0 12px}
.tp-hint{flex:none;padding:2px 16px 0;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-chips{flex:none;display:flex;gap:8px;overflow-x:auto;padding:5px 16px 9px;scrollbar-width:none;scroll-snap-type:x proximity;overscroll-behavior-x:contain;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 30px),transparent)}
.tp-chips::-webkit-scrollbar{display:none}
.tp-chip{flex:none;scroll-snap-align:start;min-height:44px;min-width:44px;padding:0 15px;border-radius:22px;border:1px solid var(--line);background:rgba(236,228,210,.05);font:500 18px/1 var(--serif);white-space:nowrap}
.tp-chip.asked{border-style:dashed;color:var(--dim)}
.tp-chip:hover{border-color:var(--dim)}
.pressing .tp-chip{border-color:var(--brass)}
.guarded .tp-chip:not(.more){opacity:.5;border-style:dotted}
.guarded .tp-hint{color:#d6a08c}
.tp-stances{flex:none;display:grid;grid-template-columns:.8fr 1.2fr 1.25fr .85fr;gap:6px;padding:0 16px 8px}
.tp-st{min-height:44px;min-width:44px;border:1px solid var(--line);border-radius:8px;background:none;color:var(--dim);font-weight:500;font-size:12px;line-height:1.15;letter-spacing:.01em;padding:0 4px}
.tp-st[aria-pressed=true]{border-color:var(--brass);color:var(--brass);background:rgba(201,163,92,.12)}
.tp-st.acc{color:#d6a08c;border-color:rgba(214,160,140,.32)}
.tp-compose{flex:none;display:flex;gap:8px;padding:0 16px 12px}
.tp-in{flex:1;min-width:0;height:44px;border-radius:22px;border:1px solid var(--line);background:rgba(0,0,0,.4);color:var(--ink);padding:0 16px;font:16px var(--mono)}
.tp-in::placeholder{color:var(--dim);font:italic 500 18px var(--serif)}
.tp-send{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--brass);background:rgba(201,163,92,.16);display:grid;place-items:center;color:var(--brass)}
.tp-send svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.tp-send:disabled,.tp-busy .tp-chip,.tp-busy .tp-st{opacity:.4;cursor:default}
.tp.kb .tp-hint,.tp.kb .tp-chips,.tp.kb .tp-stances{display:none}
.tp-grid{flex:1;min-height:0;overflow-y:auto;padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start}
.tp-card{min-height:76px;text-align:left;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:rgba(236,228,210,.045);display:flex;flex-direction:column;gap:6px;justify-content:space-between}
.tp-card.thing{border-color:rgba(201,163,92,.5);background:rgba(201,163,92,.07)}
.tp-card small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-card span{font:500 19px/1.12 var(--serif)}
.tp-card:hover{border-color:var(--brass)}
.tp-tabs{flex:none;display:flex;gap:6px;padding:8px 16px 0}
.tp-tab{flex:1;min-height:44px;white-space:nowrap;padding:0 2px;border:0;border-bottom:2px solid var(--line);background:none;color:var(--dim);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.tp-tab[aria-selected=true]{color:var(--brass);border-color:var(--brass)}
.tp-page{flex:1;min-height:0;overflow-y:auto;padding:12px 18px 18px;display:flex;flex-direction:column;gap:14px}
.tp-entry h3{margin:0;font:600 22px/1.1 var(--serif);color:var(--ink)}
.tp-entry p{margin:2px 0 0;color:var(--dim);font-size:12px}
.tp-entry.line{padding-left:12px;border-left:1px solid var(--line)}
.tp-entry.line h3{font:500 19px/1.3 var(--serif)}
.tp-entry.catch{border-left-color:var(--brass)}
.tp-acc{flex:1;min-height:0;overflow-y:auto;padding:6px 20px 14px}
.tp-lede{color:var(--dim);font-size:12px;margin:2px 0 12px}
.tp-sentence{font:500 25px/2.15 var(--serif);margin:0}
.tp-sentence .w{margin:0 4px 0 0;white-space:nowrap}
.tp-blank{display:inline-block;vertical-align:baseline;min-height:44px;min-width:92px;padding:0 8px;border:0;border-bottom:2px dashed var(--brass);background:rgba(201,163,92,.1);color:#b79a62;font:italic 500 21px/1 var(--serif);border-radius:4px 4px 0 0;line-height:40px}
.tp-blank.set{border-bottom-style:solid;color:var(--brass);font-style:normal;font-weight:600;background:none}
.tp-blank.right{color:#a9c98a;border-bottom-color:#a9c98a}
.tp-note{margin:10px 0 0;font:italic 500 18px/1.35 var(--serif);color:var(--dim)}
.tp-foot{flex:none;padding:10px 16px 14px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center;flex-wrap:wrap}

.tp-btn{flex:1 1 100%;min-height:48px;min-width:44px;border:1px solid var(--brass);border-radius:8px;background:rgba(201,163,92,.16);color:var(--brass);font-weight:500;letter-spacing:.04em;font-size:13px}
.tp-btn.quiet{border-color:var(--line);background:none;color:var(--dim)}
.tp-btn:disabled{opacity:.35;cursor:default}
.tp-opts{flex:1;min-height:0;overflow-y:auto;padding:4px 10px 10px;list-style:none;margin:0}
.tp-opt{width:100%;min-height:52px;text-align:left;padding:8px 12px;border:0;border-bottom:1px solid var(--line);background:none;display:flex;align-items:center;gap:12px;font:500 20px/1.2 var(--serif)}
.tp-opt::before{content:"";flex:none;width:16px;height:16px;border-radius:50%;border:1px solid var(--dim)}
.tp-opt[aria-checked=true]{color:var(--brass)}
.tp-opt[aria-checked=true]::before{border-color:var(--brass);background:radial-gradient(var(--brass) 45%,transparent 50%)}
.tp-verdict h2{margin:6px 0 8px;font:600 32px/1.05 var(--serif);color:var(--brass)}
.tp-verdict p{margin:0 0 10px;font:500 20px/1.35 var(--serif)}
@media (min-width:700px){
  .tp-sheet{left:auto;right:16px;bottom:calc(var(--vvb,0px) + 16px);width:410px;height:min(660px,calc(var(--vvh,100vh) - 32px));border:1px solid var(--brass);border-radius:14px}
  .tp-sheet.tall{left:50%;right:auto;margin-left:-290px;width:580px;height:min(740px,calc(var(--vvh,100vh) - 32px))}
  .tp-sheet.short{height:min(520px,calc(var(--vvh,100vh) - 32px))}
}
@media (max-height:520px){
  .tp-sheet{height:calc(var(--vvh,100vh) - 12px)}
  .tp-grip{height:10px}
  .tp-port{width:38px;height:38px}
  .tp-stances,.tp-chips{padding-bottom:5px}
  .tp-hint{display:none}
}
@media (prefers-reduced-motion:reduce){.tp *,.tp-sheet{animation:none!important;scroll-behavior:auto!important}}
`;

const ICON = {
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M12 6.5C9.8 5 6.8 4.5 3.5 5v13c3.3-.5 6.3 0 8.5 1.5 2.2-1.5 5.200-2 8.500-1.500V5c-3.300-.5-6.300 0-8.500 1.500z"/><path d="M12 6.500v13"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M4 12h14M12 5l7 7-7 7"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
};

function h(tag, a = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids.flat().filter((x) => x != null));
  return e;
}

export function makeTalkPanel(options = {}) {
  const { onAsk = () => {}, onSay = () => {}, onShow = () => {}, onAccuse = () => {}, onClose = () => {},
    onOpenAccusation = null, onOpenNotebook = null, history: useHistory = true } = options;

  if (!document.getElementById("tp-css")) document.head.append(h("style", { id: "tp-css", text: CSS }));
  const root = h("div", { class: "tp" });
  document.body.append(root);

  const S = { who: null, name: "", role: "", portrait: null, intro: "", topics: [], evidence: [], stance: "ask", busy: false, lastTopic: null, more: false, guarded: false,
    logs: new Map(), asked: new Map(), nbFresh: false };
  const logOf = (w) => { if (!S.logs.has(w)) S.logs.set(w, []); return S.logs.get(w); };
  const askedOf = (w) => { if (!S.asked.has(w)) S.asked.set(w, new Set()); return S.asked.get(w); };

  // ---- layers: sheets stacked over one another; Escape, Back and a swipe close the top one -------------------------------
  const stack = []; let pushed = 0, skip = 0;
  function sheet(cls, label) {
    const el = h("section", { class: "tp-sheet " + cls, role: "dialog", "aria-modal": "true", "aria-label": label, tabindex: "-1" });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Tab") trap(e, el);
      if (e.key !== "Escape") e.stopPropagation();                  // typing here must not walk the player
    });
    el.addEventListener("keyup", (e) => e.stopPropagation());
    el.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    root.append(el);
    return el;
  }
  function trap(e, el) {
    const f = [...el.querySelectorAll("button:not([disabled]),input,[tabindex='0']")].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function show(layer) {
    const below = stack.at(-1);
    if (below) { below.el.inert = true; below.el.setAttribute("aria-hidden", "true"); }
    layer.prev = document.activeElement;
    stack.push(layer); layer.el.classList.add("on");
    if (useHistory) { try { history.pushState({ tp: stack.length }, ""); pushed++; } catch (_) {} }
    requestAnimationFrame(() => { try { (layer.focus?.() || layer.el).focus({ preventScroll: true }); } catch (_) {} });
  }
  function popTop() {
    const l = stack.pop(); if (!l) return;
    l.el.classList.remove("on");
    const b = stack.at(-1);
    if (b) { b.el.inert = false; b.el.removeAttribute("aria-hidden"); }
    try { (l.prev && l.prev.isConnected ? l.prev : b?.el)?.focus({ preventScroll: true }); } catch (_) {}
    l.onHide?.();
  }
  function back() {                                                // the player closes the top layer
    if (!stack.length) return;
    popTop();
    if (useHistory && pushed > 0) { pushed--; skip++; history.back(); }
  }
  const onPop = () => { if (skip > 0) { skip--; return; } if (stack.length) { pushed = Math.max(0, pushed - 1); popTop(); } };
  const onKey = (e) => { if (e.key === "Escape" && stack.length) { e.preventDefault(); e.stopPropagation(); back(); } };
  addEventListener("popstate", onPop); document.addEventListener("keydown", onKey, true);
  const layerOpen = (id) => stack.some((l) => l.id === id);

  // swipe down on a grip closes the sheet
  function grip(el) {
    const g = h("div", { class: "tp-grip", "aria-hidden": "true" });
    let y0 = null, dy = 0;
    g.addEventListener("pointerdown", (e) => { y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); el.style.transition = "none"; });
    g.addEventListener("pointermove", (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; el.style.transition = ""; el.style.transform = ""; if (dy > 90) back(); };
    g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
    return g;
  }

  // ---- the keyboard: follow the visual viewport so the sheet is never hidden by it, and nothing jumps ----------------------
  const vv = window.visualViewport; let baseH = vv ? vv.height + vv.offsetTop : innerHeight;
  const input = h("input", { class: "tp-in", type: "text", maxlength: "200", enterkeyhint: "send", autocomplete: "off", autocapitalize: "sentences", spellcheck: "false", "aria-label": "Ask in your own words", placeholder: "Ask in your own words…" });
  function fit() {
    const H = vv ? vv.height : innerHeight, top = vv ? vv.offsetTop : 0;
    if (document.activeElement !== input) baseH = Math.max(baseH, H + top);
    root.style.setProperty("--vvh", H + "px");
    root.style.setProperty("--vvb", Math.max(0, innerHeight - (H + top)) + "px");
    root.classList.toggle("kb", document.activeElement === input && H + top < baseH * 0.85);
    if (root.classList.contains("kb")) scrollLog();
  }
  if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
  addEventListener("resize", fit);
  input.addEventListener("focus", () => setTimeout(fit, 50)); input.addEventListener("blur", () => setTimeout(fit, 50));
  fit();

  // ---- the conversation sheet --------------------------------------------------------------------------------------------
  const talk = sheet("", "Speaking with");
  const portCanvas = h("canvas", { width: 96, height: 96 }), nameEl = h("div", { class: "tp-name" }), roleEl = h("div", { class: "tp-role" });
  const nbBtn = h("button", { class: "tp-ib", "aria-label": "Notebook", html: ICON.book + '<i class="dot"></i>', onclick: () => (onOpenNotebook ? onOpenNotebook() : null) });
  const closeBtn = h("button", { class: "tp-ib", "aria-label": "Close", html: ICON.close, onclick: back });
  const logEl = h("div", { class: "tp-log", role: "log", "aria-live": "polite", "aria-relevant": "additions", tabindex: "0", "aria-label": "The conversation" });
  const hintEl = h("div", { class: "tp-hint" }), chipsEl = h("div", { class: "tp-chips", role: "group", "aria-label": "Matters to raise" });
  const stances = {};
  const stRow = h("div", { class: "tp-stances", role: "group", "aria-label": "How to put it" });
  for (const [k, label] of [["ask", "Ask"], ["press", "Press for more"], ["show", "Show evidence…"], ["accuse", "Accuse"]]) {
    stances[k] = h("button", { class: "tp-st" + (k === "accuse" ? " acc" : ""), text: label, "aria-pressed": k === "show" || k === "accuse" ? null : String(k === "ask"),
      "aria-haspopup": k === "show" ? "dialog" : null, onclick: () => stanceTap(k) });
    stRow.append(stances[k]);
  }
  const sendBtn = h("button", { class: "tp-send", "aria-label": "Send", html: ICON.send, type: "button", onclick: send });
  const compose = h("form", { class: "tp-compose", onsubmit: (e) => { e.preventDefault(); send(); } }, input, sendBtn);
  talk.append(grip(talk), h("div", { class: "tp-head" }, h("div", { class: "tp-port", "aria-hidden": "true" }, portCanvas), h("div", { class: "tp-id" }, nameEl, roleEl), nbBtn, closeBtn), logEl, hintEl, chipsEl, stRow, compose);

  let thinkTimer = 0;
  const scrollLog = () => { logEl.scrollTop = logEl.scrollHeight; };

  function paintPortrait(src, name) {
    const g = portCanvas.getContext("2d"); g.fillStyle = "#0d0b09"; g.fillRect(0, 0, 96, 96);
    if (src && src.width) { const side = Math.min(src.width, src.height); g.drawImage(src, (src.width - side) / 2, (src.height - side) * 0.2, side, side, 0, 0, 96, 96); }
    else { g.fillStyle = "#c9a35c"; g.font = '600 46px "Cormorant Garamond",Georgia,serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText((name || "?").replace(/^(Master|Mistress|Sir|Lady|Dame|Mr\.?|Mrs\.?)\s+/i, "").charAt(0).toUpperCase(), 48, 52); }
  }

  function entryEls(e, prevKind) {
    if (e.who === "you") return [h("p", { class: "tp-you" }, e.tag ? h("b", { text: e.tag }) : null, e.text)];
    if (e.who === "aside") return [h("p", { class: "tp-aside", text: e.text })];
    // every spoken act (a telling, a lie, a deflection, "I know nothing of that") is set the same: only the words differ
    const out = [];
    if (prevKind !== "them") out.push(h("div", { class: "tp-who", text: S.name }));
    out.push(h("div", { class: "tp-them" + (e.noted?.length ? " noted" : "") }, h("p", { text: e.text })));
    for (const n of e.noted || []) out.push(h("div", { class: "tp-noted", text: "In your book: " + (n.label || n) }));
    return out;
  }
  function renderLog() {
    logEl.replaceChildren();
    const log = logOf(S.who);
    if (!log.length) logEl.append(h("div", { class: "tp-empty", text: S.intro || "Ask what you will." }));
    let prev = null;
    for (const e of log) { logEl.append(...entryEls(e, prev)); prev = e.who === "them" ? "them" : e.who; }
    if (S.busy && S.thinkShown) logEl.append(thinking());
    scrollLog();
  }
  const thinking = () => h("div", { class: "tp-think", role: "status", "aria-label": `${S.name} is thinking`, text: "…" });
  function append(e) {
    const log = logOf(S.who), prev = log.at(-1)?.who ?? null;
    log.push(e);
    if (S.who == null || !talk.classList.contains("on")) return;
    logEl.querySelector(".tp-empty")?.remove();
    const th = logEl.querySelector(".tp-think"); if (th) th.remove();
    logEl.append(...entryEls(e, prev)); if (S.busy && th) logEl.append(thinking());
    scrollLog();
  }

  const topicLabel = (t) => (t.id.startsWith("person:") || t.kind === "person") && !/^what of /i.test(t.label) ? "What of " + t.label : t.label;
  function renderChips() {
    chipsEl.replaceChildren();
    const done = askedOf(S.who), all = S.topics, list = S.more ? all : all.slice(0, MAXCHIPS);
    for (const t of list) chipsEl.append(h("button", { class: "tp-chip" + (done.has(t.id) ? " asked" : ""), type: "button", "data-topic": t.id, text: topicLabel(t), onclick: () => chip(t) }));
    if (all.length > MAXCHIPS) chipsEl.append(h("button", { class: "tp-chip more", type: "button", text: S.more ? "Fewer" : "More…", "aria-expanded": String(!!S.more), onclick: () => { S.more = !S.more; renderChips(); } }));
    setStance(S.stance);
  }
  function setStance(s) {
    S.stance = s;
    stances.ask.setAttribute("aria-pressed", String(s === "ask")); stances.press.setAttribute("aria-pressed", String(s === "press"));
    hintEl.textContent = S.guarded ? "They have closed up" : s === "press" ? "Press on which matter?" : "Raise a matter";
    root.classList.toggle("pressing", s === "press"); root.classList.toggle("guarded", !!S.guarded);
  }
  function chip(t) {
    if (S.busy) return;
    const stance = S.stance === "press" ? "press" : "ask";
    askedOf(S.who).add(t.id);
    S.lastTopic = t.id;
    append({ who: "you", tag: stance, text: topicLabel(t).replace(/^./, (c) => c.toLowerCase()) });
    setStance("ask"); renderChips();
    onAsk(t.id, stance);
  }
  function send() {
    const text = input.value.trim();
    if (!text || S.busy) return;
    input.value = "";
    append({ who: "you", text });
    onSay(text);
  }
  function stanceTap(k) {
    if (S.busy && k !== "accuse") return;
    if (k === "ask" || k === "press") { setStance(k === "press" && S.stance === "press" ? "ask" : k); return; }
    if (k === "show") openDrawer();
    if (k === "accuse") (onOpenAccusation || (() => {}))();
  }

  // ---- the evidence drawer -----------------------------------------------------------------------------------------------
  const drawer = sheet("", "Show what?");
  const grid = h("div", { class: "tp-grid" });
  drawer.append(grip(drawer), h("div", { class: "tp-head" }, h("button", { class: "tp-ib", "aria-label": "Back to the conversation", html: ICON.back, onclick: back }), h("div", { class: "tp-title", text: "Show what?" }), h("button", { class: "tp-ib", "aria-label": "Close", html: ICON.close, onclick: back })), grid);
  function renderDrawer() {
    grid.replaceChildren();
    if (!S.evidence.length) { grid.append(h("div", { class: "tp-empty", style: "grid-column:1/-1", text: "You hold nothing, and have learned nothing, worth putting before them." })); return; }
    for (const ev of S.evidence) grid.append(h("button", { class: "tp-card " + (ev.kind === "thing" ? "thing" : "clue"), type: "button", "data-evidence": ev.id, onclick: () => pick(ev) },
      h("small", { text: ev.kind === "thing" ? "In your hand" : "Learned" }), h("span", { text: ev.label })));
  }
  function openDrawer() { if (layerOpen("drawer")) return; renderDrawer(); show({ id: "drawer", el: drawer, focus: () => grid.querySelector("button") }); }
  function pick(ev) {
    back();
    append({ who: "you", tag: "show", text: ev.label });
    setStance("ask");
    onShow(ev.id, S.lastTopic);
  }

  // ---- the notebook ------------------------------------------------------------------------------------------------------
  const nb = sheet("tall", "Your notebook");
  const nbTabs = h("div", { class: "tp-tabs", role: "tablist" }), nbPage = h("div", { class: "tp-page", role: "tabpanel", tabindex: "0" });
  nb.append(grip(nb), h("div", { class: "tp-head" }, h("div", { class: "tp-title", text: "Your notebook" }), h("button", { class: "tp-ib", "aria-label": "Close notebook", html: ICON.close, onclick: back })), nbTabs, nbPage);
  let nbData = { persons: [], clues: [], contradictions: [] }, nbTab = "clues";
  function renderNotebook() {
    const tabs = [["persons", "Persons", nbData.persons], ["clues", "Clues", nbData.clues], ["catch", "Caught out", nbData.contradictions]];
    nbTabs.replaceChildren(...tabs.map(([k, label, list]) => h("button", { class: "tp-tab", role: "tab", "aria-selected": String(nbTab === k), text: `${label} ${list.length || ""}`.trim(), onclick: () => { nbTab = k; renderNotebook(); } })));
    nbPage.replaceChildren();
    const quiet = { persons: "No one met yet.", clues: "Nothing set down yet.", catch: "No one caught in a falsehood, yet." }[nbTab];
    const list = nbTab === "persons" ? nbData.persons : nbTab === "clues" ? nbData.clues : nbData.contradictions;
    if (!list.length) nbPage.append(h("div", { class: "tp-empty", text: quiet }));
    for (const x of list) {
      if (nbTab === "persons") nbPage.append(h("div", { class: "tp-entry" }, h("h3", { text: x.name }), x.note ? h("p", { text: x.note }) : null));
      else if (nbTab === "clues") nbPage.append(h("div", { class: "tp-entry line" }, h("h3", { text: x.label }), x.from ? h("p", { text: x.from }) : null));
      else nbPage.append(h("div", { class: "tp-entry line catch" }, h("h3", { text: x.text })));
    }
  }
  function openNotebook(summary) {
    if (summary) nbData = { persons: summary.persons || [], clues: summary.clues || [], contradictions: summary.contradictions || [] };
    S.nbFresh = false; nbBtn.classList.remove("fresh");
    renderNotebook();
    if (!layerOpen("notebook")) show({ id: "notebook", el: nb, focus: () => nbTabs.querySelector("[aria-selected=true]") });
  }

  // ---- the accusation ----------------------------------------------------------------------------------------------------
  const acc = sheet("tall", "Make your accusation");
  const accBody = h("div", { class: "tp-acc" }), accFoot = h("div", { class: "tp-foot" });
  acc.append(grip(acc), h("div", { class: "tp-head" }, h("div", { class: "tp-title", text: "The Accusation" }), h("button", { class: "tp-ib", "aria-label": "Close accusation", html: ICON.close, onclick: back })), accBody, accFoot);
  let A = null;
  const optsOf = (key) => (key === "suspect" ? A.suspects.map((s) => ({ id: s.id, label: s.name })) : A.pillars.find((p) => p.id === key).options);
  const labelOf = (key) => { const v = A.picks[key]; return v == null ? null : optsOf(key).find((o) => o.id === v)?.label; };
  const blankName = (key) => (key === "suspect" ? "who" : A.pillars.find((p) => p.id === key).label);
  const groupOf = (key) => A.groups.find((g) => g.keys.includes(key));
  function renderAccusation() {
    const done = !!A.verdict, s = h("p", { class: "tp-sentence" });
    const blank = (key) => { const v = labelOf(key), locked = A.locked.has(groupOf(key).id);
      return h("button", { class: "tp-blank" + (v ? " set" : "") + (locked ? " right" : ""), type: "button", "data-blank": key, text: v || blankName(key),
        "aria-label": `${blankName(key)}: ${v || "not chosen"}${locked ? ", confirmed" : ""}`, disabled: done || locked || A.waiting || null, onclick: () => pickBlank(key) }); };
    s.append(blank("suspect"));
    A.pillars.forEach((p) => {
      let lead = p.lead ?? LEADS[p.id] ?? `, ${p.label}:`;
      const m = lead.match(/^([;,.])\s*(.*)$/);
      if (m) { s.append("\u2060" + m[1], " "); lead = m[2]; } else s.append(" ");
      s.append(h("span", { class: "w", text: lead }), " ", blank(p.id));
    });
    s.append(".");
    accBody.replaceChildren(...[
      A.verdict ? null : h("p", { class: "tp-lede", text: "Fill each blank from what you have learned, then confirm it a few at a time: a group is accepted only when every blank in it is right." }), s,
      A.note ? h("p", { class: "tp-note", role: "status", text: A.note }) : null,
      A.verdict ? h("div", { class: "tp-verdict", role: "status" }, h("h2", { text: A.verdict.title || "" }), A.verdict.text ? h("p", { text: A.verdict.text }) : null) : null].filter(Boolean));
    accFoot.replaceChildren();
    if (done) { accFoot.append(h("button", { class: "tp-btn", type: "button", text: "Close", onclick: back })); return; }
    for (const g of A.groups) {
      const locked = A.locked.has(g.id), ready = g.keys.every((k) => A.picks[k] != null);
      accFoot.append(h("button", { class: "tp-btn" + (locked ? " quiet" : ""), type: "button", "data-group": g.id, disabled: locked || !ready || A.waiting || null,
        text: locked ? "Confirmed: " + g.label : "Confirm " + g.label, onclick: () => confirmGroup(g) }));
    }
  }
  function confirmGroup(g) {
    A.waiting = g.id; A.note = "The room waits."; renderAccusation();
    onAccuse({ group: g.id, picks: Object.fromEntries(g.keys.map((k) => [k, A.picks[k]])), all: { ...A.picks } });
  }
  const pk = sheet("short", "Choose");
  const pkTitle = h("div", { class: "tp-title" }), pkList = h("ul", { class: "tp-opts", role: "radiogroup" });
  pk.append(grip(pk), h("div", { class: "tp-head" }, pkTitle, h("button", { class: "tp-ib", "aria-label": "Cancel", html: ICON.close, onclick: back })), pkList);
  function pickBlank(key) {
    const cur = A.picks[key];
    pkTitle.textContent = key === "suspect" ? "Who is guilty?" : "Choose: " + blankName(key);
    pkList.replaceChildren(...optsOf(key).map((o) => h("li", {}, h("button", { class: "tp-opt", type: "button", role: "radio", "aria-checked": String(o.id === cur), "data-option": o.id, text: o.label,
      onclick: () => { A.picks[key] = o.id; back(); renderAccusation(); } }))));
    show({ id: "picker", el: pk, focus: () => pkList.querySelector("[aria-checked=true]") || pkList.querySelector("button") });
  }
  function openAccusation(spec) {
    const pillars = spec.pillars || [], keys = ["suspect", ...pillars.map((p) => p.id)];
    A = { suspects: spec.suspects || [], pillars, picks: {}, verdict: null, locked: new Set(), waiting: null, note: "", groups: spec.groups?.length ? spec.groups : [{ id: "all", label: "the accusation", keys }] };
    renderAccusation();
    if (!layerOpen("accusation")) show({ id: "accusation", el: acc, focus: () => accBody.querySelector("button") });
  }

  // ---- the API -----------------------------------------------------------------------------------------------------------
  const api = {
    open({ who, name, role = "", portrait = null, intro = "", topics = [], evidence = [] }) {
      S.who = who; S.name = name || who; S.role = role; S.portrait = portrait; S.intro = intro; S.topics = topics; S.evidence = evidence;
      S.lastTopic = null; S.busy = false; S.more = false; S.guarded = false; root.classList.remove("tp-busy");
      nameEl.textContent = S.name; roleEl.textContent = role; talk.setAttribute("aria-label", "Speaking with " + S.name);
      paintPortrait(portrait, S.name); setStance("ask"); renderLog(); renderChips(); sendBtn.disabled = false;
      if (!layerOpen("talk")) show({ id: "talk", el: talk, focus: () => chipsEl.querySelector("button") || input, onHide: () => { S.stance = "ask"; onClose(); } });
      return api;
    },
    say({ who = "them", text, act, noted }) {
      const e = { who, text, act }; if (noted?.length) e.noted = noted;
      append(e);
      if (noted?.length) { S.nbFresh = true; nbBtn.classList.add("fresh"); }
    },
    setTopics(list) { S.topics = list || []; renderChips(); },
    setEvidence(list) { S.evidence = list || []; if (layerOpen("drawer")) renderDrawer(); },
    busy(b) {
      S.busy = !!b; S.thinkShown = false; root.classList.toggle("tp-busy", S.busy); sendBtn.disabled = S.busy;
      for (const x of [...chipsEl.children, stances.ask, stances.press, stances.show]) x.setAttribute("aria-disabled", String(S.busy));
      logEl.querySelector(".tp-think")?.remove(); clearTimeout(thinkTimer);
      // a quick answer should not flash a "…": it appears only if the wait is longer than THINK_AFTER ms
      if (S.busy && S.who != null) thinkTimer = setTimeout(() => { if (S.busy) { S.thinkShown = true; logEl.append(thinking()); scrollLog(); } }, THINK_AFTER);
    },
    guarded(on) { S.guarded = !!on; setStance(S.stance); },
    close() {
      while (stack.length) popTop();
      if (useHistory && pushed > 0) { skip++; const n = pushed; pushed = 0; history.go(-n); }
    },
    openNotebook,
    openAccusation,
    accusationResult({ group, ok, text }) {
      if (!A) return; A.waiting = null;
      if (ok) { A.locked.add(group); A.note = text || ""; }
      else A.note = text || "Something in that does not hold. Think again, and change what you must.";
      renderAccusation();
    },
    verdict({ title, text }) { if (!A) return; A.verdict = { title, text }; A.waiting = null; A.note = ""; renderAccusation(); if (layerOpen("accusation")) accBody.scrollTop = 0; },
    isOpen: () => stack.length > 0,
    destroy() { api.close(); removeEventListener("popstate", onPop); document.removeEventListener("keydown", onKey, true); removeEventListener("resize", fit);
      if (vv) { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); } root.remove(); },
  };
  return api;
}
