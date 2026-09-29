// Every opening in a house must be walkable: from one room's middle, squarely through the opening, to the
// other's, under the page's own walking rules (window.__walk). Exits 1 if any fails.
//   node tools/house-walk.mjs [url-base]
import { chromium } from 'playwright';
let failed = 0;
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const q of ['?plan=grand&near=999', '?near=999']) {
  const p = await b.newPage({ viewport: { width: 640, height: 400 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://192.168.68.58:8793/lab/house/' + q, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ok, null, { timeout: 600000 });
  const out = await p.evaluate(() => {
    const plan = window.__plan, fails = [];
    const c = (R) => ({ x: (R.x0 + R.x1) / 2, y: (R.y0 + R.y1) / 2 });
    let ok = 0;
    for (const o of plan.openings) {
      if (!o.rect || o.joins.length < 2) continue;
      const [A, B] = o.joins.map(id => plan.rooms.find(r => r.id === id));
      if (!A || !B || A.type === 'open' || B.type === 'open') continue;
      const a = c(A.rect), d = c(o.rect), bb = c(B.rect), f = o.floor || A.floor, R = o.rect;
      // square through the opening: from A's middle to just in front of it, straight through, then on to B's middle
      const alongX = (R.x1 - R.x0) < (R.y1 - R.y0);             // the passage runs along x
      const side = (p) => alongX ? Math.sign(p.x - d.x) : Math.sign(p.y - d.y);
      const off = (s) => alongX ? { x: d.x + s * 0.6, y: d.y } : { x: d.x, y: d.y + s * 0.6 };
      const pA = off(side(a)), pB = off(side(bb));
      const leg = (s, t) => window.__walk(s.x, s.y, t.x, t.y, f);
      const r1 = leg(a, pA), r2 = r1.done ? leg(pA, pB) : null, r3 = r2 && r2.done ? leg(pB, bb) : null;
      const last = r3 || r2 || r1;
      if (r3 && r3.done) ok++; else fails.push(`${o.id} ${A.name} -> ${B.name}: stopped at (${last.x.toFixed(2)}, ${last.y.toFixed(2)}) leg ${r3 ? 3 : r2 ? 2 : 1}`);
    }
    return { ok, fails };
  });
  failed += out.fails.length; console.log(q, 'passable', out.ok, 'failed', out.fails.length); for (const f of out.fails.slice(0, 8)) console.log('  ', f);
  console.log(errs.slice(0, 3).join(' | ') || '  no errors');
  await p.close();
}
await b.close();
process.exit(failed ? 1 : 0);
