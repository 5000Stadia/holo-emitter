// The questioning panel (M7, R57): how you speak to a suspect, keep your notebook and make your accusation, on a phone
// first (a bottom sheet under the thumb, the suspect's projection still in view above it), then on a desktop (a card
// docked at the right). It holds no case: the host (the manor page, or lab/ui/talk-demo.html) asks src/make/talk.js and
// calls back in with the answer. A conversation in a 1660 house, so: their lines in a serif, yours in mono, set down
// like a transcript, not bubbles; no label or colour tells a lie from the truth or a deflection from "I know nothing of
// that" (the player must catch it), the one honest sign is a brass rule when a line put something in your notebook.
//
//   makeTalkPanel({ onAsk(topicId, stance), onSay(text), onShow(clueOrThingId, topicId), onAccuse(choice), onClose(),
//                   onOpenAccusation(), onOpenNotebook(), onOpenPaper(id) })   // the last three: the panel asks, the host answers
//     -> { open({ who, name, role?, portrait: canvas, intro?, topics, evidence }), say({ who: "them"|"you"|"aside", text, act, noted }),
//          setTopics(list), setEvidence(list), markAsked(topicId), busy(bool), guarded(bool), close(), openNotebook(summary),
//          openAccusation({ suspects, pillars, groups? }), accusationResult({ group, ok, text? }), verdict({ title, text }),
//          openReader({ title, hand?, ground?, parts | sheets, noted?, onClose? }), fresh(), isOpen(), destroy() }
//   fresh(): the notebook's brass dot (something new in it: a clue noted, a question raised).
//   stance is "ask" or "press" (a toggle that applies to the next topic); "show" is onShow(id, topicId): the drawer names the
//   matter it is shown on ("Show it on: This morning at the door", the last matter raised with this person, changed by a
//   row of the matters), and with none raised yet it asks for one before anything is shown; topicId is never empty.
//   markAsked(topicId): a matter the host read from the player's own words (or raised itself): its chip shows asked, and
//   it is the matter the next thing shown goes on. say({ who: "you" }) with the very line the panel just set down (the
//   player's typed question, which send() shows at once) is not set down twice.
//   topics [{ id, label }], in the order the host wants them (what you have learned first): the first six not yet asked are
//   shown, the rest behind "More…", so the player is never stuck and the text box is only a shortcut. Ids "person:<id>" read as
//   "What of <name>". guarded(true) is a suspect who has closed up (a wrong item shown): the chips dim, nothing is lost.
//   A topic { dry: true } (asking it now would give nothing new: src/make/talk.js topicsFor) is shown after the others,
//   dimmed; one { retired: true } (all its facts learned) leaves the six shown, still under "More…".
//   evidence [{ id, label, kind: "clue"|"thing" }].
//   notebook summary { leads?: { open: [{ id, text, where?, now? }], done: [...] }, persons: [{ id, name, note, claims?: [{ label, broken?, by? }],
//     fresh?: n }], clues: [{ id, label, from }], contradictions: [{ id, text, by? }], papers?: [{ id, title }] };
//     leads (what stands open, src/make/leads.js) are the first tab when given: the Justice's open questions, each with whom
//     to ask or where to go and where those people are now, then those settled; persons are a court record: where each is
//     now, the claims heard from them, a broken one struck through with what broke it, and how many matters are still worth
//     raising (fresh, the chips' own reckoning).
//     papers (what you have read) get their own tab, and tapping one calls onOpenPaper(id): the host answers with openReader.
//   reader: a paper as it is written, on parchment or paper (design/case/case-1660.papers.json documents the shape and is
//     passed straight in). hand "secretary" | "italic" | "engrossing"; ground "parchment" | "paper" (by the hand if absent);
//     parts [{ text, mark?, hand? }] flow as paragraphs ("\n\n" a new one, "\n" a line), inline marks rasure | struck | added |
//     caps, block marks { mark, text | parts } head | margin | sign | seal | endorsed | aside (what you see, not what is
//     written); sheets [{ title, hand, ground?, parts }] for a bundle. noted [label | { label }] is the brass "In your book"
//     line when the reading put clues in the notebook. Nothing marks where the clue is but the paper itself.
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
  --fell:"IM Fell English",Georgia,"Times New Roman",serif;--fellsc:"IM Fell English SC","IM Fell English",Georgia,serif;--hand:"Fondamento","IM Fell English",Georgia,serif;
  --grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .36 0 0 0 0 .24 0 0 0 0 .1 0 0 0 .3 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  --scrape:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='60'%3E%3Cfilter id='s'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .9' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .32 0 0 0 0 .16 0 0 0 1.1 -.42'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23s)'/%3E%3C/svg%3E");
  --mottle:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.011' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .32 0 0 0 0 .1 0 0 0 .55 -.16'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E");
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
.tp-name{font:600 25px/1.05 var(--serif);color:var(--brass);letter-spacing:.03em;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow-wrap:anywhere}
.tp-name.long{font-size:21px;line-height:1.02}
.tp-role{color:var(--dim);font-size:11px;line-height:1.3;letter-spacing:.04em;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
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
.tp-chips{flex:none;display:flex;gap:8px;overflow-x:auto;padding:5px 16px 9px;scrollbar-width:none;scroll-snap-type:x proximity;scroll-padding-inline:16px;overscroll-behavior-x:contain;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(90deg,transparent 0,#000 12px,#000 calc(100% - 30px),transparent)}
.tp-chips::-webkit-scrollbar{display:none}
.tp-chip{flex:none;scroll-snap-align:start;min-height:44px;min-width:44px;padding:0 15px;border-radius:22px;border:1px solid var(--line);background:rgba(236,228,210,.05);font:500 18px/1 var(--serif);white-space:nowrap}
.tp-chip.press::after{content:"press";margin-left:7px;font:500 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--brass)}
.tp-chip.asked{border-style:dashed;color:var(--dim)}
.tp-chip.dry{opacity:.5;color:var(--dim)}
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
.tp-grid{flex:1;min-height:0;overflow-y:auto;padding:12px 16px 14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;gap:10px;align-content:start}
.tp-card{min-height:76px;height:auto;min-width:0;text-align:left;padding:9px 11px 10px;border:1px solid var(--line);border-radius:8px;background:rgba(236,228,210,.045);display:flex;flex-direction:column;gap:5px;justify-content:flex-start;overflow:hidden}
.tp-card.held{border-color:var(--brass);box-shadow:inset 0 0 0 1px var(--brass)}
.tp-cards-sect{grid-column:1/-1;margin:4px 0 -4px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-on{flex:none;padding:8px 0 2px;border-bottom:1px solid var(--line)}
.tp-on-lab{padding:0 16px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-on-lab b{font:500 17px/1.25 var(--serif);letter-spacing:0;text-transform:none;color:var(--brass);margin-left:4px}
.tp-on.ask .tp-on-lab{color:#d6a08c}
.tp-on .tp-chips{padding-top:6px}
.tp-chip[aria-pressed=true]{border-color:var(--brass);color:var(--brass);background:rgba(201,163,92,.14)}
.tp-card.thing{border-color:rgba(201,163,92,.5);background:rgba(201,163,92,.07)}
.tp-card small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-card span{font:500 17px/1.15 var(--serif);overflow-wrap:break-word}
.tp-card:hover{border-color:var(--brass)}
.tp-tabs{flex:none;display:flex;gap:4px;padding:8px 12px 0;overflow-x:auto;scrollbar-width:none}
.tp-tabs::-webkit-scrollbar{display:none}
.tp-tab{flex:1 0 auto;min-height:44px;min-width:44px;white-space:nowrap;padding:0 5px;border:0;border-bottom:2px solid var(--line);background:none;color:var(--dim);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.tp-tab[aria-selected=true]{color:var(--brass);border-color:var(--brass)}
.tp-page{flex:1;min-height:0;overflow-y:auto;padding:12px 18px 18px;display:flex;flex-direction:column;gap:14px}
.tp-entry h3{margin:0;font:600 22px/1.1 var(--serif);color:var(--ink)}
.tp-entry p{margin:2px 0 0;color:var(--dim);font-size:12px}
.tp-entry.line{padding-left:12px;border-left:1px solid var(--line)}
.tp-entry.struck h3{text-decoration:line-through;text-decoration-thickness:1px;color:var(--dim)}
.tp-entry .by{color:var(--brass);font-size:11px}
.tp-entry.line h3{font:500 19px/1.3 var(--serif)}
.tp-entry.catch{border-left-color:var(--brass)}
.tp-entry.lead{padding-left:12px;border-left:2px solid var(--brass)}
.tp-entry.lead h3{font:500 20px/1.25 var(--serif)}
.tp-entry.lead p{font-size:12.5px;line-height:1.4;margin-top:4px}
.tp-entry.lead p.now{color:var(--brass);opacity:.85;font-size:11.5px}
.tp-entry.lead.done{border-left:1px solid var(--line);opacity:.62}
.tp-entry.lead.done h3{font-size:18px}
.tp-sect{margin:6px 0 -6px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-claims{list-style:none;margin:6px 0 0;padding:0 0 0 12px;border-left:1px solid var(--line);display:flex;flex-direction:column;gap:3px}
.tp-claims li{font:500 17px/1.3 var(--serif)}
.tp-claims li.broken s{text-decoration:line-through 1.5px;text-decoration-color:var(--brass);color:var(--dim)}
.tp-claims li small{display:block;font:11px/1.35 var(--mono);color:var(--brass);letter-spacing:.01em}
.tp-entry p.fresh{color:var(--ink);opacity:.8}
.tp-acc{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:6px 20px 14px}
.tp-lede{color:var(--dim);font-size:12px;margin:2px 0 12px}
.tp-sentence{font:500 25px/2.15 var(--serif);margin:0}
.tp-sentence .w{margin:0 4px 0 0;white-space:nowrap}
.tp-sentence .nb{white-space:nowrap}
.tp-sentence .stop{margin-left:-5px}
.tp-sentence .nb .tp-blank{white-space:normal;max-width:calc(100% - 12px);text-align:left;vertical-align:bottom;line-height:1.2;padding:9px 8px 7px}
.tp-blank{display:inline-block;vertical-align:baseline;min-height:44px;min-width:92px;padding:0 8px;border:0;border-bottom:2px dashed var(--brass);background:rgba(201,163,92,.1);color:#b79a62;font:italic 500 21px/1 var(--serif);border-radius:4px 4px 0 0;line-height:40px}
.tp-blank.sealed::after{content:" ✦";font-size:14px;color:var(--brass);font-style:normal}
.tp-picknote{margin:10px 16px 4px;color:var(--dim);font:italic 500 17px/1.35 var(--serif)}
.tp-picknote:empty{display:none}
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
.tp-verdict{margin:0 0 14px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.tp-verdict h2{margin:6px 0 8px;font:600 32px/1.05 var(--serif);color:var(--brass)}
.tp-note.rebut{color:var(--ink);font-style:normal}
.tp-verdict p{margin:0 0 10px;font:500 20px/1.35 var(--serif)}
.tp-paper{width:100%;min-height:52px;display:flex;align-items:center;gap:12px;text-align:left;padding:8px 12px;border:1px solid rgba(201,163,92,.45);border-radius:8px;background:rgba(201,163,92,.07);font:500 20px/1.15 var(--serif)}
.tp-paper svg{flex:none;width:22px;height:22px;stroke:var(--brass);fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.tp-paper:hover{border-color:var(--brass)}
.tp-sheet.tall.rd{height:auto;max-height:min(calc(var(--vvh,100vh) * .9),780px)}
.rd .tp-read{flex:0 1 auto}
.tp-rdhead .tp-title{font-size:21px;line-height:1.12}
.tp-read{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 12px 24px;display:flex;flex-direction:column;gap:14px;outline:0}
.tp-leafcap{flex:none;margin:4px 4px -6px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.tp-leaf{--quill:#2e1d0d;--faint:rgba(70,45,18,.62);flex:none;position:relative;color:var(--quill);padding:22px 20px 24px;border-radius:2px;font:18.5px/1.5 var(--fell);
  box-shadow:0 8px 26px rgba(0,0,0,.6),inset 0 0 0 1px rgba(90,60,20,.22),inset 0 0 42px rgba(120,78,28,.34);-webkit-hyphens:auto;hyphens:auto;overflow-wrap:break-word;animation:tp-in .3s ease-out}
.tp-leaf::after{content:"";display:block;clear:both}
.tp-leaf.parchment{background:var(--mottle),var(--grain),radial-gradient(130% 90% at 45% 35%,#f3e5c3,#e6d1a2 62%,#d2b67f)}
.tp-leaf.paper{background:var(--grain),repeating-linear-gradient(90deg,transparent 0 34px,rgba(110,80,40,.06) 34px 35px),repeating-linear-gradient(0deg,transparent 0 2px,rgba(110,80,40,.03) 2px 3px),linear-gradient(170deg,#f3ecdb,#e8dcc0);
  box-shadow:0 8px 26px rgba(0,0,0,.6),inset 0 0 0 1px rgba(90,60,20,.18),inset 0 0 30px rgba(120,78,28,.22)}
.tp-leaf p{margin:0 0 .65em}
.tp-leaf .h-engrossing,.tp-leaf.h-engrossing{font-family:var(--fell);font-style:normal}
.tp-leaf.h-engrossing{--quill:#2c1d0e;font-size:17.5px;text-align:justify;line-height:1.55}
.tp-leaf .h-italic,.tp-leaf.h-italic{font-family:var(--fell);font-style:italic}
.tp-leaf .h-secretary,.tp-leaf.h-secretary{font-family:var(--hand);font-style:normal}
.tp-leaf.h-secretary{--quill:#3a2312;font-size:17.5px;line-height:1.6}
.tp-caps{font:1.45em/1 var(--fellsc);letter-spacing:.03em}
.tp-ras{padding:.08em .2em;margin:0 -.05em;color:#090502;letter-spacing:.07em;word-spacing:.12em;text-shadow:0 0 .8px rgba(20,10,0,.75),.3px 0 .6px rgba(20,10,0,.35);-webkit-box-decoration-break:clone;box-decoration-break:clone;
  background:var(--scrape),linear-gradient(90deg,rgba(250,243,222,0),rgba(250,243,222,.62) .5em,rgba(247,239,214,.5) 45%,rgba(250,243,222,.66) calc(100% - .5em),rgba(250,243,222,0))}
.tp-leaf s{text-decoration:line-through 1.5px;text-decoration-color:rgba(46,29,13,.85);color:var(--faint)}
.tp-add{white-space:nowrap}
.tp-add sup{font-size:.68em;line-height:0;vertical-align:.95em;margin-left:-.1em}
.tp-marg{float:right;width:44%;margin:.1em -.3em .5em .75em;padding:.05em 0 .1em .55em;border-left:1px solid rgba(60,35,10,.32);font-size:.8em;line-height:1.38;text-align:left}
.tp-dhead{margin:0 0 .55em;text-align:center;font-size:1.04em}
.tp-sign{margin:.15em 0 .55em;text-align:right}
.tp-sealrow{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin:.3em 0 .6em}
.tp-seal{flex:none;width:44px;height:44px;border-radius:50%;position:relative;background:radial-gradient(circle at 37% 33%,#c4493b,#8e2419 56%,#5c130c);box-shadow:0 2px 4px rgba(0,0,0,.4)}
.tp-seal::after{content:"";position:absolute;inset:7px;border-radius:50%;border:1.5px solid rgba(255,190,170,.28)}
.tp-endorse{clear:both;margin:1em 0 0;padding-top:.65em;border-top:1px dashed rgba(60,35,10,.34);font-size:.86em;line-height:1.4;color:var(--faint)}
.tp-endorse small{display:block;margin-bottom:.45em;font:500 9.5px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;font-style:normal;color:rgba(70,45,18,.55)}
.tp-desc{clear:both;margin:0 0 .75em;font:italic 500 16px/1.32 var(--serif);color:var(--faint);text-align:left}
.tp-desc + .tp-desc,.tp-leaf > :last-child.tp-desc{margin-bottom:0}
.tp-rdfoot{flex:none;padding:9px 16px 12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:3px}
.tp-rdfoot:empty{display:none}
.tp-rdfoot .tp-noted{margin:0}
.tp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
@media (min-width:700px){
  .tp-sheet{left:auto;right:16px;bottom:calc(var(--vvb,0px) + 16px);width:410px;height:min(660px,calc(var(--vvh,100vh) - 32px));border:1px solid var(--brass);border-radius:14px}
  .tp-sheet.tall{left:50%;right:auto;margin-left:-290px;width:580px;height:min(740px,calc(var(--vvh,100vh) - 32px))}
  .tp-sheet.short{height:min(520px,calc(var(--vvh,100vh) - 32px))}
  .tp-sheet.tall.rd{height:auto;max-height:min(740px,calc(var(--vvh,100vh) - 32px))}
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
  paper: '<svg viewBox="0 0 24 24"><path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M15 3.5V7h3.5M9 11h6.5M9 14h6.5M9 17h4"/></svg>',
};
// the papers' faces: IM Fell (the Fell types, cut in the 1670s) for the engrossing and italic hands, Fondamento for the
// secretary's everyday hand; Georgia stands in until they load, or for good if they never do
const FONTS = "https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=Fondamento&display=swap";

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
    onOpenAccusation = null, onOpenNotebook = null, onOpenPaper = null, history: useHistory = true } = options;

  if (!document.getElementById("tp-css")) document.head.append(h("style", { id: "tp-css", text: CSS }));
  if (!document.getElementById("tp-fonts")) document.head.append(h("link", { id: "tp-fonts", rel: "stylesheet", href: FONTS }));
  const root = h("div", { class: "tp" });
  document.body.append(root);

  const S = { who: null, name: "", role: "", portrait: null, intro: "", topics: [], evidence: [], stance: "ask", busy: false, lastTopic: null, more: false, guarded: false,
    logs: new Map(), asked: new Map(), last: new Map(), nbFresh: false };
  const raised = (id) => { S.lastTopic = id; if (S.who != null && id) S.last.set(S.who, id); };
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
    // (the host echoing the player's typed line, already set down by send(): once is enough)
    if (e.who === "you" && log.at(-1)?.who === "you" && log.at(-1).typed && !e.tag && log.at(-1).text === e.text) { log.at(-1).typed = false; return; }
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
    // what has something new first, then the dry (dimmed), then the retired (only under More…)
    const done = askedOf(S.who), front = [...S.topics.filter((t) => !t.dry && !t.retired), ...S.topics.filter((t) => t.dry && !t.retired)];
    const all = [...front, ...S.topics.filter((t) => t.retired)], list = S.more ? all : front.slice(0, MAXCHIPS);
    for (const t of list) chipsEl.append(h("button", { class: "tp-chip" + (done.has(t.id) ? " asked" : "") + (t.dry || t.retired ? " dry" : "") + (t.press && !t.dry ? " press" : ""), type: "button", "data-topic": t.id, "aria-label": t.press && !t.dry ? `${topicLabel(t)}, press for more` : null, "data-dry": t.dry || t.retired ? "" : null, text: topicLabel(t), onclick: () => chip(t) }));
    if (all.length > list.length || S.more) chipsEl.append(h("button", { class: "tp-chip more", type: "button", text: S.more ? "Fewer" : "More…", "aria-expanded": String(!!S.more), onclick: () => { S.more = !S.more; renderChips(); } }));
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
    raised(t.id);
    append({ who: "you", tag: stance, text: topicLabel(t).replace(/^./, (c) => c.toLowerCase()) });
    setStance("ask"); renderChips();
    onAsk(t.id, stance);
  }
  function send() {
    const text = input.value.trim();
    if (!text || S.busy) return;
    input.value = "";
    append({ who: "you", text, typed: true });
    onSay(text);
  }
  function stanceTap(k) {
    if (S.busy && k !== "accuse") return;
    if (k === "ask" || k === "press") { setStance(k === "press" && S.stance === "press" ? "ask" : k); return; }
    if (k === "show") openDrawer();
    if (k === "accuse") (onOpenAccusation || (() => {}))();
  }

  // ---- the evidence drawer -----------------------------------------------------------------------------------------------
  // what is shown goes on a matter, named at the top ("Show it on: This morning at the door"), the last raised with this
  // person or one chosen from the row; with none yet, the drawer asks for one, and a card tapped first waits for it
  const drawer = sheet("", "Show what?");
  const grid = h("div", { class: "tp-grid" }), onLab = h("div", { class: "tp-on-lab", role: "status" }), onChips = h("div", { class: "tp-chips", role: "group", "aria-label": "Show it on which matter" });
  const onRow = h("div", { class: "tp-on" }, onLab, onChips);
  drawer.append(grip(drawer), h("div", { class: "tp-head" }, h("button", { class: "tp-ib", "aria-label": "Back to the conversation", html: ICON.back, onclick: back }), h("div", { class: "tp-title", text: "Show what?" }), h("button", { class: "tp-ib", "aria-label": "Close", html: ICON.close, onclick: back })), onRow, grid);
  const D = { topic: null, ev: null };
  const topicById = (id) => S.topics.find((t) => t.id === id);
  function renderOn() {
    const cur = D.topic && topicById(D.topic);
    onRow.classList.toggle("ask", !cur); onChips.scrollLeft = 0;
    onLab.replaceChildren(...(cur ? ["Show it on:", h("b", { text: topicLabel(cur) })] : [D.ev ? "Show it on which matter? Choose one:" : "First, on which matter? Choose one:"]));
    // the chosen matter first, then those with something new, the dry, the retired
    const order = [...S.topics.filter((t) => !t.dry && !t.retired), ...S.topics.filter((t) => t.dry && !t.retired), ...S.topics.filter((t) => t.retired)];
    if (cur) order.sort((a, b) => (b.id === cur.id) - (a.id === cur.id));
    onChips.replaceChildren(...order.map((t) => h("button", { class: "tp-chip" + (t.dry || t.retired ? " dry" : ""), type: "button", "data-on": t.id, "aria-pressed": String(t.id === D.topic), text: topicLabel(t),
      onclick: () => { D.topic = t.id; if (D.ev) { const ev = S.evidence.find((e) => e.id === D.ev); if (ev) return pick(ev); } renderOn(); onChips.scrollLeft = 0; } })));
  }
  function renderDrawer() {
    renderOn(); grid.replaceChildren();
    if (!S.evidence.length) { grid.append(h("div", { class: "tp-empty", style: "grid-column:1/-1", text: "You hold nothing, and have learned nothing, worth putting before them." })); return; }
    // what is in your hand first, then what you have learned (the latest first)
    const things = S.evidence.filter((e) => e.kind === "thing"), learned = S.evidence.filter((e) => e.kind !== "thing").reverse();
    const sects = things.length > 0 && learned.length > 0;
    const card = (ev) => h("button", { class: "tp-card " + (ev.kind === "thing" ? "thing" : "clue") + (D.ev === ev.id ? " held" : ""), type: "button", "data-evidence": ev.id, "aria-pressed": D.ev === ev.id ? "true" : null, onclick: () => pick(ev) },
      sects ? null : h("small", { text: ev.kind === "thing" ? "In your hand" : "Learned" }), h("span", { text: ev.label }));
    if (sects) grid.append(h("div", { class: "tp-cards-sect", text: "In your hand" }), ...things.map(card), h("div", { class: "tp-cards-sect", text: "What you have learned" }), ...learned.map(card));
    else grid.append(...[...things, ...learned].map(card));
  }
  function openDrawer() {
    if (layerOpen("drawer")) return;
    D.topic = S.last.get(S.who) || null; if (D.topic && !topicById(D.topic)) D.topic = null; D.ev = null;
    renderDrawer(); show({ id: "drawer", el: drawer, focus: () => { onChips.scrollLeft = 0; return (D.topic ? grid : onChips).querySelector("button"); } });
  }
  function pick(ev) {
    if (!D.topic) { D.ev = ev.id; renderDrawer(); onChips.querySelector("button")?.focus({ preventScroll: true }); return; }
    const t = topicById(D.topic), topic = D.topic; D.ev = null;
    back();
    raised(topic);
    append({ who: "you", tag: "show", text: `${ev.label}, on ${t ? topicLabel(t).replace(/^./, (c) => c.toLowerCase()) : topic}` });
    setStance("ask");
    onShow(ev.id, topic);
  }

  // ---- the notebook ------------------------------------------------------------------------------------------------------
  const nb = sheet("tall", "Your notebook");
  const nbTabs = h("div", { class: "tp-tabs", role: "tablist" }), nbPage = h("div", { class: "tp-page", role: "tabpanel", tabindex: "0" });
  nb.append(grip(nb), h("div", { class: "tp-head" }, h("div", { class: "tp-title", text: "Your notebook" }), h("button", { class: "tp-ib", "aria-label": "Close notebook", html: ICON.close, onclick: back })), nbTabs, nbPage);
  let nbData = { leads: null, persons: [], clues: [], contradictions: [], papers: [] }, nbTab = null;
  const lineOf = (cls, title, ...ps) => h("div", { class: "tp-entry " + cls }, h("h3", { text: title }), ...ps.filter(Boolean));
  function renderNotebook() {
    const tabs = [["persons", "Persons", nbData.persons], ["clues", "Clues", nbData.clues], ["catch", "Caught out", nbData.contradictions]];
    if (nbData.leads) tabs.unshift(["leads", "Open", nbData.leads.open]);
    if (nbData.papers.length) tabs.push(["papers", "Papers", nbData.papers]);
    if (!tabs.some(([k]) => k === nbTab)) nbTab = nbData.leads ? "leads" : "clues";
    nbTabs.replaceChildren(...tabs.map(([k, label, list]) => h("button", { class: "tp-tab", role: "tab", "data-tab": k, "aria-selected": String(nbTab === k), text: `${label} ${list.length || ""}`.trim(), onclick: () => { nbTab = k; renderNotebook(); } })));
    nbPage.replaceChildren();
    const quiet = { leads: "Nothing stands open.", persons: "No one met yet.", clues: "Nothing set down yet.", catch: "No one caught in a falsehood, yet." }[nbTab];
    const list = tabs.find(([k]) => k === nbTab)[2];
    if (!list.length && !(nbTab === "leads" && nbData.leads.done.length)) nbPage.append(h("div", { class: "tp-empty", text: quiet }));
    if (nbTab === "leads") {
      if (!list.length && nbData.leads.done.length) nbPage.append(h("p", { class: "tp-note", text: "Nothing stands open." }));
      for (const x of list) nbPage.append(lineOf("lead", x.text, x.where && h("p", { text: x.where }), x.now && h("p", { class: "now", text: x.now })));
      if (nbData.leads.done.length) nbPage.append(h("div", { class: "tp-sect", text: "Settled" }), ...nbData.leads.done.map((x) => lineOf("lead done", x.text)));
      return;
    }
    for (const x of list) {
      if (nbTab === "persons") nbPage.append(h("div", { class: "tp-entry" }, h("h3", { text: x.name }), x.note ? h("p", { text: x.note }) : null,
        x.fresh != null ? h("p", { class: "fresh", text: x.fresh ? `${x.fresh} ${x.fresh === 1 ? "matter" : "matters"} still worth raising` : "Nothing new to ask them now" }) : null,
        x.claims?.length ? h("ul", { class: "tp-claims", "aria-label": `What ${x.name} has told you` }, x.claims.map((c) => h("li", { class: c.broken ? "broken" : null },
          c.broken ? [h("s", { text: c.label }), h("span", { class: "tp-sr", text: " (broken)" }), c.by ? h("small", { text: "broken by " + c.by }) : null] : c.label))) : null));
      // (a clue that was a lie, once broken, struck through with what broke it: a naive player had kept weighing them)
      else if (nbTab === "clues") nbPage.append(lineOf("line" + (x.struck ? " struck" : ""), x.label, x.from && h("p", { text: x.from }), x.struck && h("p", { class: "by", text: `broken by ${x.struck}` })));
      else if (nbTab === "catch") nbPage.append(lineOf("line catch", x.text || x.label, x.by && h("p", { text: "broken by " + x.by })));
      else nbPage.append(h("button", { class: "tp-paper", type: "button", "data-paper": x.id, html: ICON.paper, onclick: () => onOpenPaper?.(x.id) }, h("span", { text: x.title || x.label || x.id })));
    }
  }
  function openNotebook(summary) {
    if (summary) nbData = { leads: summary.leads || null, persons: summary.persons || [], clues: summary.clues || [], contradictions: summary.contradictions || [], papers: summary.papers || [] };
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
    // (a seal on a blank you hold proof for, not saying which answer it proves: after Golden Idol's word bank)
    const blank = (key) => { const v = labelOf(key), locked = A.locked.has(groupOf(key).id), sealed = !locked && A.pillars.find((p) => p.id === key)?.sealed;
      return h("button", { class: "tp-blank" + (v ? " set" : "") + (locked ? " right" : "") + (sealed ? " sealed" : ""), title: sealed ? "you hold proof for this" : null, type: "button", "data-blank": key, text: v || blankName(key),
        "aria-label": `${blankName(key)}: ${v || "not chosen"}${locked ? ", confirmed" : ""}`, disabled: done || locked || A.waiting || null, onclick: () => pickBlank(key) }); };
    // (a blank and the stop after it don't part: the line never starts "; he died of", nor ends on a lone ".")
    const keys = ["suspect", ...A.pillars.map((p) => p.id)];
    keys.forEach((key, i) => {
      const next = A.pillars[i]; let lead = next ? next.lead ?? LEADS[next.id] ?? `, ${next.label}:` : ".", stop = "";
      const m = lead.match(/^([;,.])\s*(.*)$/); if (m) { stop = m[1]; lead = m[2]; }
      s.append(h("span", { class: "nb" }, blank(key), stop ? h("span", { class: "stop", text: stop }) : null));
      if (next) s.append(" ", h("span", { class: "w", text: lead }), " ");
    });
    const verdictEl = A.verdict ? h("div", { class: "tp-verdict", role: "status" }, h("h2", { text: A.verdict.title || "" }), A.verdict.text ? h("p", { text: A.verdict.text }) : null) : null;
    accBody.replaceChildren(...[
      verdictEl,
      A.verdict ? null : h("p", { class: "tp-lede", text: "Fill each blank from what you have learned, then confirm it a few at a time: a group is accepted only when every blank in it is right." }), s,
      A.aside && !A.verdict ? h("p", { class: "tp-note rebut", text: A.aside }) : null,
      A.note ? h("p", { class: "tp-note", role: "status", text: A.note }) : null].filter(Boolean));
    accFoot.replaceChildren();
    if (done) { accFoot.append(h("button", { class: "tp-btn", type: "button", text: "Close", onclick: back })); return; }
    for (const g of A.groups) {
      const locked = A.locked.has(g.id), ready = g.keys.every((k) => A.picks[k] != null);
      accFoot.append(h("button", { class: "tp-btn" + (locked ? " quiet" : ""), type: "button", "data-group": g.id, disabled: locked || !ready || A.waiting || null,
        text: locked ? "Confirmed: " + g.label : "Confirm " + g.label, onclick: () => confirmGroup(g) }));
    }
  }
  // what the room answers, brought into view under the sentence (it had been drawn below the fold)
  function noteInView() {
    requestAnimationFrame(() => { const n = accBody.querySelector(".tp-note:last-of-type"); if (!n) return;
      const top = n.offsetTop - accBody.offsetTop, room = accBody.clientHeight;
      if (top + n.offsetHeight > accBody.scrollTop + room) accBody.scrollTo({ top: Math.max(0, top + n.offsetHeight - room + 12), behavior: "smooth" }); });
  }
  function confirmGroup(g) {
    A.waiting = g.id; A.note = "The room waits."; A.aside = ""; renderAccusation();
    onAccuse({ group: g.id, picks: Object.fromEntries(g.keys.map((k) => [k, A.picks[k]])), all: { ...A.picks } });
  }
  const pk = sheet("short", "Choose");
  const pkTitle = h("div", { class: "tp-title" }), pkList = h("ul", { class: "tp-opts", role: "radiogroup" }), pkNote = h("p", { class: "tp-picknote", role: "note" });
  pk.append(grip(pk), h("div", { class: "tp-head" }, pkTitle, h("button", { class: "tp-ib", "aria-label": "Cancel", html: ICON.close, onclick: back })), pkNote, pkList);
  function pickBlank(key) {
    const cur = A.picks[key];
    pkTitle.textContent = key === "suspect" ? "Who is guilty?" : "Choose: " + blankName(key);
    // (only what you have learned of is offered: an answer appears when a clue or a person names it)
    const P = A.pillars.find((p) => p.id === key), more = P?.unknown || 0, opts = optsOf(key);
    pkNote.textContent = !opts.length ? "Nothing you have learned answers this yet." : more ? "More may come to light as you learn." : "";
    pkList.replaceChildren(...opts.map((o) => h("li", {}, h("button", { class: "tp-opt", type: "button", role: "radio", "aria-checked": String(o.id === cur), "data-option": o.id, text: o.label,
      onclick: () => { A.picks[key] = o.id; back(); renderAccusation(); } }))));
    show({ id: "picker", el: pk, focus: () => pkList.querySelector("[aria-checked=true]") || pkList.querySelector("button") });
  }
  function openAccusation(spec) {
    const pillars = spec.pillars || [], keys = ["suspect", ...pillars.map((p) => p.id)];
    A = { suspects: spec.suspects || [], pillars, picks: {}, verdict: null, locked: new Set(), waiting: null, note: "", aside: "", groups: spec.groups?.length ? spec.groups : [{ id: "all", label: "the accusation", keys }] };
    renderAccusation();
    if (!layerOpen("accusation")) show({ id: "accusation", el: acc, focus: () => accBody.querySelector("button") });
  }

  // ---- the reader: a paper as it is written, in its hand, on parchment or paper; the clue is there to be noticed, unmarked --
  const rd = sheet("tall rd", "A paper");
  const rdTitle = h("div", { class: "tp-title" }), rdBody = h("div", { class: "tp-read", tabindex: "0" }), rdFoot = h("div", { class: "tp-rdfoot", role: "status" });
  rd.append(grip(rd), h("div", { class: "tp-head tp-rdhead" }, rdTitle, h("button", { class: "tp-ib", "aria-label": "Put it down", html: ICON.close, onclick: back })), rdBody, rdFoot);
  const HANDS = new Set(["secretary", "italic", "engrossing"]), BLOCKS = new Set(["head", "margin", "sign", "seal", "endorsed", "aside"]);
  const SAYS = { rasure: "scraped and written over: ", struck: "struck through: ", added: "written in above: " };   // for a screen reader, what the eye sees
  const handCls = (x) => (HANDS.has(x) ? "h-" + x : null);
  const lines = (t) => String(t ?? "").split("\n").flatMap((l, i) => (i ? [h("br"), l] : [l]));
  function run(part, text) {                                       // one inline run
    const m = part.mark, cls = handCls(part.hand), sr = SAYS[m] ? h("span", { class: "tp-sr", text: "(" + SAYS[m] }) : null, end = sr ? h("span", { class: "tp-sr", text: ")" }) : null;
    if (m === "rasure") return h("span", { class: ["tp-ras", cls].filter(Boolean).join(" ") }, sr, lines(text), end);
    if (m === "struck") return h("s", { class: cls }, sr, lines(text), end);
    if (m === "added") return h("span", { class: ["tp-add", cls].filter(Boolean).join(" ") }, sr, h("span", { "aria-hidden": "true", text: "\u2038" }), h("sup", {}, lines(text)), end);
    if (m === "caps") return h("span", { class: ["tp-caps", cls].filter(Boolean).join(" ") }, lines(text));
    return h("span", { class: cls }, lines(text));
  }
  function block(part) {
    const body = part.parts ? part.parts.map((q) => run(q, q.text)) : [run({ hand: part.hand }, part.text)];
    switch (part.mark) {
      case "margin": return h("aside", { class: "tp-marg", "aria-label": "In the margin" }, body);
      case "head": return h("div", { class: "tp-dhead" }, body);
      case "sign": return h("div", { class: "tp-sign" }, body);
      case "seal": return h("div", { class: "tp-sealrow" }, h("span", {}, body), h("i", { class: "tp-seal", role: "img", "aria-label": "a seal of red wax" }));
      case "endorsed": return h("div", { class: "tp-endorse" }, h("small", { text: "On the back" }), h("div", {}, body));
      default: return h("p", { class: "tp-desc" }, part.parts ? part.parts.map((q) => q.text).join("") : part.text);   // aside
    }
  }
  function leaf(sh) {
    const hand = HANDS.has(sh.hand) ? sh.hand : "secretary", ground = sh.ground === "paper" || sh.ground === "parchment" ? sh.ground : hand === "engrossing" ? "parchment" : "paper";
    const el = h("article", { class: `tp-leaf ${ground} h-${hand}`, "aria-label": sh.title || null });
    let p = null; const para = () => p || (p = el.appendChild(h("p")));
    for (const part of sh.parts || []) {
      if (BLOCKS.has(part.mark)) { p = null; el.append(block(part)); continue; }
      String(part.text ?? "").split(/\n{2,}/).forEach((chunk, i) => { if (i) p = null; if (chunk) para().append(run(part, chunk)); });
    }
    return el;
  }
  function openReader(doc = {}) {
    const sheets = doc.sheets?.length ? doc.sheets : [doc];
    rdTitle.textContent = doc.title || sheets[0].title || "A paper"; rd.setAttribute("aria-label", rdTitle.textContent);
    rdBody.replaceChildren(...sheets.flatMap((sh) => (sheets.length > 1 && sh.title ? [h("div", { class: "tp-leafcap", text: sh.title }), leaf(sh)] : [leaf(sh)])));
    rdFoot.replaceChildren(...(doc.noted || []).map((n) => h("div", { class: "tp-noted", text: "In your book: " + (n.label || n) })));
    if (doc.noted?.length) { S.nbFresh = true; nbBtn.classList.add("fresh"); }
    rdBody.scrollTop = 0;
    const layer = stack.find((l) => l.id === "reader");
    if (layer) { layer.onHide = doc.onClose; return; }
    show({ id: "reader", el: rd, focus: () => rdBody, onHide: doc.onClose });
  }

  // ---- the API -----------------------------------------------------------------------------------------------------------
  const api = {
    open({ who, name, role = "", portrait = null, intro = "", topics = [], evidence = [] }) {
      S.who = who; S.name = name || who; S.role = role; S.portrait = portrait; S.intro = intro; S.topics = topics; S.evidence = evidence;
      S.lastTopic = S.last.get(who) || null; S.busy = false; S.more = false; S.guarded = false; root.classList.remove("tp-busy");
      nameEl.textContent = S.name; nameEl.classList.toggle("long", S.name.length > 15); roleEl.textContent = role; talk.setAttribute("aria-label", "Speaking with " + S.name);
      paintPortrait(portrait, S.name); setStance("ask"); renderLog(); renderChips(); sendBtn.disabled = false;
      if (!layerOpen("talk")) show({ id: "talk", el: talk, focus: () => chipsEl.querySelector("button") || input, onHide: () => { S.stance = "ask"; onClose(); } });
      return api;
    },
    say({ who = "them", text, act, noted }) {
      // (an aside while the accusation is open, the accused's answer to it, is said there too, under the sentence)
      if (who === "aside" && A && !A.verdict && stack.at(-1)?.id === "accusation") { A.aside = text; renderAccusation(); noteInView(); }
      const e = { who, text, act }; if (noted?.length) e.noted = noted;
      append(e);
      if (noted?.length) { S.nbFresh = true; nbBtn.classList.add("fresh"); }
    },
    setTopics(list) { S.topics = list || []; renderChips(); if (layerOpen("drawer")) renderOn(); },
    markAsked(topicId) { if (!topicId || S.who == null) return; askedOf(S.who).add(topicId); raised(topicId); renderChips(); },
    setEvidence(list) { S.evidence = list || []; if (layerOpen("drawer")) renderDrawer(); },
    busy(b) {
      S.busy = !!b; S.thinkShown = false; root.classList.toggle("tp-busy", S.busy); sendBtn.disabled = S.busy;
      for (const x of [...chipsEl.children, stances.ask, stances.press, stances.show]) x.setAttribute("aria-disabled", String(S.busy));
      logEl.querySelector(".tp-think")?.remove(); clearTimeout(thinkTimer);
      // a quick answer should not flash a "…": it appears only if the wait is longer than THINK_AFTER ms
      if (S.busy && S.who != null) thinkTimer = setTimeout(() => { if (S.busy) { S.thinkShown = true; logEl.append(thinking()); scrollLog(); } }, THINK_AFTER);
    },
    guarded(on) { S.guarded = !!on; setStance(S.stance); },
    fresh() { S.nbFresh = true; nbBtn.classList.add("fresh"); },
    close() {
      while (stack.length) popTop();
      if (useHistory && pushed > 0) { skip++; const n = pushed; pushed = 0; history.go(-n); }
    },
    openNotebook,
    openAccusation,
    openReader,
    accusationResult({ group, ok, text }) {
      if (!A) return; A.waiting = null;
      if (ok) { A.locked.add(group); A.note = text || ""; }
      else A.note = text || "Something in that does not hold. Think again, and change what you must.";
      renderAccusation(); noteInView();
    },
    verdict({ title, text }) { if (!A) return; A.verdict = { title, text }; A.waiting = null; A.note = ""; A.aside = ""; renderAccusation(); if (layerOpen("accusation")) { accBody.scrollTop = 0; accBody.scrollLeft = 0; } },
    isOpen: () => stack.length > 0,
    destroy() { api.close(); removeEventListener("popstate", onPop); document.removeEventListener("keydown", onKey, true); removeEventListener("resize", fit);
      if (vv) { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); } root.remove(); },
  };
  return api;
}
