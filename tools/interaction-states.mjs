// Capture the code room's drawer-and-key states (close and room-wide), each once the drawer has settled,
// then check the regressions: 1 vs 4 identical (both closed), 2 vs 5 differ only at the key, 5 vs 6 identical (reload).
//   node tools/interaction-states.mjs lab/painted/interaction
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 960, height: 600 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
const open = async (fresh) => { await p.goto('http://192.168.68.58:8793/lab/painted/?mode=v2' + (fresh ? '&fresh' : ''), { waitUntil: 'networkidle' }); await p.waitForFunction(() => window.__ok, null, { timeout: 180000 }); await p.addStyleTag({ content: '#gate, .hud, #line, #hint, #held { display: none !important; }' }); };
p.setDefaultTimeout(180000);
const CAMS = { close: [2.44, 1.25, 180, -54], room: [2.4, 4.3, 180, -14] };
const state = async () => { const w = await p.evaluate(() => window.__world()); return `${w.entities.find(e => e.id === 'desk1').state} | known: ${w.knowledge.player.join(',')} | ${w.relations.map(r => r.join(' ')).join('; ')}`; };
const cap = async (n) => { await p.waitForFunction(() => window.__settled(), null, { timeout: 120000 }); for (const [c, v] of Object.entries(CAMS)) { await p.evaluate(a => window.__place(...a), v); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${n}-${c}.png` }); } console.log(n, '::', await state()); };
const d = (it) => p.evaluate(i => window.__dispatch(i), it);
await open(true);                       await cap('1-clean-closed');
await d({ type: 'toggle', entity: 'desk1' }); await cap('2-opened-key-revealed');
await d({ type: 'take', entity: 'key1' });    await cap('3-key-taken-cavity-empty');
await d({ type: 'toggle', entity: 'desk1' }); await cap('4-closed-after-take');
await d({ type: 'toggle', entity: 'desk1' }); await cap('5-reopened-still-empty');
await open(false);                      await cap('6-returned-persisted');
console.log(errs.join('\n') || 'no errors');
await b.close();
