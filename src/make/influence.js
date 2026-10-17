// Influences (design/production/plan.md §4): one shape for everything that bends what a place holds:
// an owner, a household, a room's purpose, a parish, a trade, the weather, an event. Each is
// { who, reach, weight, traits, heroes }: reach is "space" (it touches what lies within it: a room, a
// street) or "possession" (it touches its owner's things wherever they are); traits are what it
// bends (means, care, topics, what is kept, …); heroes are the few named things it must have.
// The context at a point is the weighted blend of the influences that reach it. Pure: node can check it.

const isWeights = (v) => v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(x => typeof x === "number");
const isRange = (v) => Array.isArray(v) && v.length === 2 && v.every(x => typeof x === "number");

// numbers and ranges average by weight; weight maps (topics, what is kept) add by weight; anything
// else (a word, a list) is the heaviest influence's
export function blend(influences) {
  const list = influences.filter(Boolean), total = list.reduce((a, i) => a + (i.weight ?? 1), 0) || 1, ctx = {};
  const keys = new Set(list.flatMap(i => Object.keys(i.traits || {})));
  for (const k of [...keys].sort()) {
    const has = list.filter(i => i.traits && i.traits[k] !== undefined).map(i => [i.weight ?? 1, i.traits[k]]);
    const w = has.reduce((a, [x]) => a + x, 0);
    if (has.every(([, v]) => typeof v === "number")) ctx[k] = has.reduce((a, [x, v]) => a + x * v, 0) / w;
    else if (has.every(([, v]) => isRange(v))) ctx[k] = [0, 1].map(j => has.reduce((a, [x, v]) => a + x * v[j], 0) / w);
    else if (has.every(([, v]) => isWeights(v))) { ctx[k] = {}; for (const [x, v] of has) for (const [kk, n] of Object.entries(v)) ctx[k][kk] = (ctx[k][kk] || 0) + x * n / total; }
    else ctx[k] = has.reduce((best, cur) => cur[0] > best[0] ? cur : best)[1];
  }
  ctx.from = list.map(i => i.who);
  ctx.heroes = list.flatMap(i => i.heroes || []);
  return ctx;
}
// the influences that reach a thing: those of the spaces it lies within, and those of whoever keeps it
export const reaching = ({ spaces = [], keeper = null }) => [...spaces, keeper].filter(Boolean);
