// The story's place, at generation (R49): the scene document checked against its text (every quote word for word),
// its things matched to kinds, the plan laid out and run through the plan checks (check 17) and the soundness
// rules (check 11), the story compiled and its softlock search run over every state its deeds reach.
// node tools/check-story.mjs [lab/alice/hall.json lab/alice/hall.txt]
import { readFileSync } from "node:fs";
import { carve } from "../src/make/carve.js";
import { planChecks } from "../src/make/plan-checks.js";
import { soundness } from "../src/make/sound.js";
import { compileRoom } from "../lab/house/plan-compile.js";
import { houseSpecs, storeys } from "../src/make/house-spec.js";
import { STORY_ROOM_TYPES } from "../src/make/rooms/story.js";
import { checkScene } from "../src/make/scene.js";
import { matchKinds } from "../src/make/match.js";
import { planStoryHall } from "../src/make/plans/story-hall.js";
import { compileStory, storyModel, bodyAt } from "../src/make/story.js";
import { settle, value } from "../src/make/catalogue.js";
const [sf = "lab/alice/hall.json", tf = "lab/alice/hall.txt"] = process.argv.slice(2);
const files = ["furniture-1660", "household-1660", "strongroom-1660", "house-1660", "alice-1865"];
const KINDS = (await Promise.all(files.map(f => import(`../src/make/kinds/${f}.js`).catch(() => ({ default: [] }))))).flatMap(m => m.default || []);
const sizeOf = (name, over = {}) => { const k = KINDS.find(q => q.kind === name); if (!k) return null; const s = settle(k, 0, over); return k.size ? value(k.size, s) : null; };
const t0 = performance.now(), scene = JSON.parse(readFileSync(sf, "utf8")), text = readFileSync(tf, "utf8");
const check = checkScene(scene, text), match = matchKinds(scene, KINDS);
const plan = planStoryHall(scene, { kinds: match.kinds }), t1 = performance.now();
const { levelOf } = storeys(plan, 0.35), specs = houseSpecs(plan, { types: STORY_ROOM_TYPES }), carved = carve({ plan, specs, levelOf, gap: 0.35 });
const pc = planChecks({ plan, specs, carved, sizeOf }), sd = soundness({ plan, compileRoom }), t2 = performance.now();
const story = compileStory(scene), tops = { golden_key: 0.75, bottle: 0.75 };      // the table's top (the page measures the built one)
const M = storyModel(story, { reachOf: (id, s) => (tops[id] ?? 0) <= bodyAt(story.sizes[s]).reach, consumables: story.actions.flatMap(a => a.effects.filter(e => e.gone).map(e => e.gone)) });
const lit = M.strands(M.start), t3 = performance.now();
console.log(JSON.stringify({ scene: { ok: check.ok, quotes: check.quotes, findings: check.findings }, match, chosen: plan.chosen.map(c => `${c.what}: ${JSON.stringify(c.value)}`),
  plan: { ok: pc.ok, findings: (pc.findings || []).slice(0, 12) }, sound: { findings: (sd.findings || sd).slice?.(0, 12) ?? sd },
  softlock: { states: lit.states, stranded: lit.stranded.length, first: lit.stranded[0], rescued: lit.stranded.every(x => M.rescue({ size: x.state.size, held: new Set(x.state.held), gone: new Set(x.state.gone), unlocked: new Set(x.state.unlocked) }).length > 0) },
  unread: story.unread.length, ms: { scene_match_plan: +(t1 - t0).toFixed(1), checks: +(t2 - t1).toFixed(1), softlock: +(t3 - t2).toFixed(1) } }, null, 1));
