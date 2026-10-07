// A scene document (lab/alice/scene-schema.md, holo-emitter-scene/0.1): what a text establishes about a place,
// written once by the one AI step. Nothing in it is trusted until checked here, in code (R49; prior art: Google's
// LangExtract keeps where each extraction stands in its source): every `quote` must stand in the text word for
// word (line breaks and runs of spaces read as one space), every reference must name something the document
// declares, and every thing has one parent (Inform 7's world model). Pure.
// checkScene(scene, text) -> { ok, findings: [{ at, what }], quotes }
export function checkScene(scene, text) {
  const norm = (s) => s.replace(/\s+/g, " ").trim(), body = norm(text), findings = [];
  let quotes = 0;
  (function walk(v, at) {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${at}[${i}]`));
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (k === "quote" && typeof x === "string") { quotes++; if (!body.includes(norm(x))) findings.push({ at, what: `quote not in the text: "${x.slice(0, 60)}"` }); }
      else walk(x, at ? `${at}.${k}` : k);
    }
  })(scene, "");
  const ids = new Set([...(scene.rooms || []), ...(scene.openings || []), ...(scene.things || [])].map(x => x.id));
  const actions = new Set((scene.actions || []).map(a => a.id)), events = new Set((scene.events || []).map(e => e.id));
  for (const t of scene.things || []) {
    if (t.at && typeof t.at === "object" && t.at.of && !ids.has(t.at.of)) findings.push({ at: `things.${t.id}.at`, what: `stands ${t.at.rel} "${t.at.of}", which the scene doesn't declare` });
    if (t.exists && typeof t.exists === "object" && t.exists.after && !actions.has(t.exists.after) && !events.has(t.exists.after)) findings.push({ at: `things.${t.id}.exists`, what: `after "${t.exists.after}", no such action or event` });
  }
  for (const o of scene.openings || []) {
    if (o.key && o.key !== "open" && !ids.has(o.key)) findings.push({ at: `openings.${o.id}.key`, what: `key "${o.key}" isn't a thing` });
    if (o.hidden_by && !ids.has(o.hidden_by)) findings.push({ at: `openings.${o.id}.hidden_by`, what: `"${o.hidden_by}" isn't a thing` });
  }
  for (const a of scene.actions || []) if (a.thing && a.thing !== "player" && !ids.has(a.thing)) findings.push({ at: `actions.${a.id}`, what: `acts on "${a.thing}", which the scene doesn't declare` });
  return { ok: !findings.length, findings, quotes };
}
