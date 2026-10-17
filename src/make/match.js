// What each thing a text names is, from the catalogue (R49 step 2), with no AI: the kinds of the thing's own noun
// (the family before a kind's slash: "table" for table/gateleg), ranked by how many of the text's words for it
// (what it is made of, how it is described) the kind's name and its why share. A thing the text puts round
// another (a label round a bottle's neck) is part of that thing, not a kind of its own. A noun with no kind
// is reported, for a recipe to be written (AI at authoring only, counted).
// matchKinds(scene, kinds: [{ kind, why }]) -> { kinds: { [thingId]: kind }, missing: [thingId], parts: [thingId] }
const STOP = new Set(["a", "an", "the", "of", "with", "and", "on", "in", "it", "its", "all", "made", "round", "she", "had", "not", "before", "under", "lying", "from", "very", "which", "was", "were", "to"]);
const words = (s) => (s || "").toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
const singular = (w) => w.replace(/(ies)$/, "y").replace(/([^s])s$/, "$1");

export function matchKinds(scene, kinds) {
  const out = {}, missing = [], parts = [];
  for (const t of scene.things) {
    if (t.at?.rel === "round" && scene.things.some(q => q.id === t.at.of)) { parts.push(t.id); continue; }
    const noun = singular((t.noun || "").toLowerCase()), said = new Set([...words(t.words), ...words(typeof t.material === "string" ? t.material : "")].map(singular));
    said.delete(noun);   // the noun itself picks the family; only the other words choose within it
    const cands = kinds.filter(k => k.kind.split("/")[0] === noun).map(k => {
      const has = new Set([...words(k.kind.replace(/[/-]/g, " ")), ...words(k.why)].map(singular));
      return { k: k.kind, score: [...said].filter(w => has.has(w)).length };
    }).sort((a, b) => b.score - a.score || a.k.localeCompare(b.k));
    if (cands.length && cands[0].score > 0) out[t.id] = cands[0].k; else missing.push(t.id);
  }
  return { kinds: out, missing, parts };
}
