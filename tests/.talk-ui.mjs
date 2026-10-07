// Click through lab/ui/talk-demo.html at a phone (390x844, touch) and a desktop (1280x800); screenshot each state; check
// no console errors and that every tap target in an open sheet is at least 44px. node tests/.talk-ui.mjs [outdir] [baseurl]
import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";
const OUT = process.argv[2] || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/talkui";
const BASE = process.argv[3] || "http://localhost:8794";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };

async function run(tag, ctxOpts) {
  const ctx = await b.newContext(ctxOpts), p = await ctx.newPage(), errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  const shot = (n) => p.screenshot({ path: `${OUT}/${tag}-${n}.png` });
  const tap = (sel) => (ctxOpts.hasTouch ? p.locator(sel).first().tap() : p.locator(sel).first().click());
  const sheetOn = () => p.locator(".tp-sheet.on").last();
  const answered = async () => { await p.waitForTimeout(900); };                    // the stub answers after 650 ms
  const small = async (label) => {
    const bad = await p.evaluate(() => [...document.querySelectorAll(".tp-sheet.on:not([aria-hidden]) :is(button,input)")].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || e.getAttribute("aria-label") || e.className).slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.w < 44 || x.h < 44));
    ok(!bad.length, `${tag} ${label}: tap targets >= 44px ${bad.length ? JSON.stringify(bad) : ""}`);
  };
  await p.goto(`${BASE}/lab/ui/talk-demo.html`); await p.waitForFunction(() => window.__ok); await p.waitForTimeout(400);
  await shot("01-world");

  await tap("[data-go=hale]"); await p.waitForTimeout(500); await shot("02-opened"); await small("opened");
  ok(await p.locator(".tp-chip").count() >= 4, `${tag}: topic chips shown`);
  // ask: the alibi (a lie, set exactly as a truth is)
  await tap("[data-topic=last_evening]"); await p.waitForTimeout(450);
  ok(await p.locator(".tp-think").count() === 1, `${tag}: the quiet "..." shows after a wait`); await shot("03-thinking");
  await answered(); await shot("04-lie");
  const lieHtml = await p.locator(".tp-them").last().evaluate((e) => e.className);
  ok(!/lie|noted/.test(lieHtml), `${tag}: a lie is not marked (${lieHtml})`);
  // a quick answer shows no thinking line
  await tap("[data-topic=land_sale]"); await p.waitForTimeout(120); ok(await p.locator(".tp-think").count() === 0, `${tag}: no "..." flashes before 300ms`); await answered();
  // deflect, then press for more
  await tap("[data-topic=muniment_room]"); await answered();
  await tap(".tp-st:has-text('Press for more')"); await p.waitForTimeout(100); await shot("05-press-armed");
  await tap("[data-topic=muniment_room]"); await answered(); await shot("06-pressed");
  ok(await p.locator(".tp-them.noted").count() === 1, `${tag}: pressing yields a clue (brass rule)`);
  // show evidence with the one clue (wrong for the lie) -> closes up
  await tap("[data-topic=last_evening]"); await answered();
  await tap(".tp-st:has-text('Show evidence')"); await p.waitForTimeout(400); await shot("07-drawer"); await small("drawer");
  await tap("[data-evidence=c_key]"); await p.waitForTimeout(600); await shot("08-wrong-item-guarded");
  ok(await p.locator(".guarded").count() === 1, `${tag}: guarded after a wrong item`);
  // free text
  await p.fill(".tp-in", "Where were you last evening, truly?"); await shot("09-typed");
  await p.keyboard.press("Enter"); await answered(); await shot("10-own-words");

  // Verney: learn two clues; the notebook
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok(await p.locator(".tp-sheet.on").count() === 0, `${tag}: Escape closes the sheet`);
  await tap("[data-go=verney]"); await p.waitForTimeout(400);
  await tap("[data-topic=the_cellar]"); await answered();                           // gated: deflects
  await tap("[data-topic=the_master]"); await answered();
  await tap("[data-topic=the_cellar]"); await answered(); await shot("11-verney");
  await tap("[aria-label=Notebook]"); await p.waitForTimeout(400); await shot("12-notebook-clues"); await small("notebook");
  await tap(".tp-tab:has-text('Persons')"); await shot("13-notebook-persons");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok(await p.locator(".tp-sheet.on").count() === 1, `${tag}: Escape closes only the notebook`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);

  // back to Hale: break the lie with the cellar book
  await tap("[data-go=hale]"); await p.waitForTimeout(400);
  await tap("[data-topic=last_evening]"); await answered();
  await tap(".tp-st:has-text('Show evidence')"); await p.waitForTimeout(300);
  await tap("[data-evidence=c_cellar_book]"); await answered(); await p.waitForTimeout(300); await shot("14-lie-broken");
  await tap("[aria-label=Notebook]"); await p.waitForTimeout(300); await tap(".tp-tab:has-text('Caught out')"); await shot("15-caught-out");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);

  // accusation: a wrong group, then a right one
  await tap(".tp-st:has-text('Accuse')"); await p.waitForTimeout(400); await shot("16-accusation-empty"); await small("accusation");
  await tap("[data-blank=suspect]"); await p.waitForTimeout(300); await shot("17-picker"); await small("picker");
  await tap("[data-option=verney]"); await p.waitForTimeout(200);
  await tap("[data-blank=victim]"); await tap("[data-option=edmund]");
  await tap("[data-blank=means]"); await tap("[data-option=claret]");
  await p.waitForTimeout(200); await shot("18-accusation-filled");
  await tap("[data-group=g1]"); await p.waitForTimeout(800); await shot("19-group-wrong");
  await tap("[data-blank=suspect]"); await tap("[data-option=hale]");
  await tap("[data-group=g1]"); await p.waitForTimeout(800);
  await tap("[data-blank=motive]"); await tap("[data-option=rents]");
  await tap("[data-blank=lock]"); await tap("[data-option=hale]"); await shot("20-group1-locked");
  await tap("[data-group=g2]"); await p.waitForTimeout(900); await shot("21-verdict");
  ok(await p.locator(".tp-verdict h2").count() === 1, `${tag}: verdict shown`);
  await tap(".tp-foot .tp-btn"); await p.waitForTimeout(300);
  // browser Back closes the top layer
  await tap("[aria-label=Notebook]"); await p.waitForTimeout(300);
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.locator(".tp-sheet.on").count() === 1, `${tag}: browser Back closes the notebook`);

  if (ctxOpts.hasTouch) {                                                           // the keyboard: a short visual viewport with the box focused
    await p.locator(".tp-in").focus(); await p.setViewportSize({ width: 390, height: 520 }); await p.waitForTimeout(400); await shot("22-keyboard");
    const r = await p.evaluate(() => { const s = document.querySelector(".tp-sheet.on").getBoundingClientRect(); return { top: s.top, bottom: s.bottom, h: innerHeight }; });
    ok(r.top >= 0 && r.bottom <= r.h + 1, `${tag}: the sheet fits the short viewport ${JSON.stringify(r)}`);
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(400); await p.locator(".tp-in").blur(); await shot("23-landscape");
  }
  ok(!errs.length, `${tag}: no console errors ${errs.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

await run("phone", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await run("desk", { viewport: { width: 1280, height: 800 } });
await b.close();
console.log(fails ? `${fails} FAILED` : "all ok"); process.exit(fails ? 1 : 0);
