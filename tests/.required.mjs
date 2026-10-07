// The story's things placed first (R54 step 6): a key required in the study, in its desk's drawer. The desk is
// placed for it, the key is in the drawer (it rides with it when the drawer opens), and the room's anchors do
// not add a second desk. Then a key required in a room that has no desk: the desk comes with it.
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = {};
for (const [name, req, room] of [["study", "key/iron@study:table/joined-with-drawer.drawer", "study"], ["nursery", "key/iron@nursery:table/joined-with-drawer.drawer", "nursery"]]) {
  const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://localhost:8794/lab/manor/index.html?webgl=1&fresh=1&require=${encodeURIComponent(req)}`, { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
  out[name] = await p.evaluate((room) => { const g = window.__manor.placements.get(room), M = window.__manor;
    const key = M.things.find(b => b.kind.kind === "key/iron" && b.node.parent && b.node.userData.room === room), desk = M.things.find(b => b.kind.kind === "table/joined-with-drawer" && b.node.userData.room === room);
    const inDrawer = !!(key && desk && desk.movers.get("drawer") && (() => { let o = key.node.parent; while (o) { if (o === desk.movers.get("drawer")) return true; o = o.parent; } return false; })());
    return { order: g.placed.map(q => `${q.kind}(${q.tier})`).slice(0, 4), desks: g.placed.filter(q => q.kind === "table/joined-with-drawer").length, inDrawer, refused: g.refused }; }, room);
  out[name].errors = errs.slice(0, 3); await p.close(); }
console.log(JSON.stringify(out, null, 1)); await b.close();
