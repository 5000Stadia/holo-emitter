# holo-emitter-scene/0.1: what a text establishes about a place

One JSON document per scene, written once by reading the text (the one AI step; nothing after it uses AI). It
records only what the text establishes. Every fact carries `quote`, the words that establish it, verbatim from
the text. A fact the build needs that the text leaves open is written `"open"`, with `hint` for what the text
suggests, if anything. Never invent.

```jsonc
{
  "schema": "holo-emitter-scene/0.1",
  "source": { "work": "...", "author": "...", "year": 1865, "chapter": "...", "from": "first words of the scene", "to": "last words" },
  "place": { "name": "...", "underground": true, "quote": "...", "look": "open" | { "words": "...", "quote": "..." } },
  "rooms": [{
    "id": "hall", "name": "...", "quote": "...",
    "shape": { "plan": "long" | "square" | "round" | "open", "height": "low" | "high" | "open", "quote": "..." },
    // sizes in metres only where the text gives or bounds them (e.g. a height you can't stand up in at nine feet)
    "bounds": [{ "what": "ceiling", "max_m": 2.74, "why": "...", "quote": "..." }],
    "light": [{ "what": "...", "quote": "..." }],
    "dark": true | false | "open"
  }],
  "openings": [{
    "id": "...", "in": "hall", "to": "room id, 'outside', or 'nowhere' (the text never says)", "count": 1 | "many",
    "size": { "height_m": 0.38, "quote": "..." } | "open",
    "locked": true, "key": "thing id" | null | "open",
    "hidden_by": "thing id" | null,
    "quote": "..."
  }],
  "things": [{
    "id": "...", "noun": "...", "words": "how the text describes it", "quote": "...",
    "material": "..." | "open", "size": { "words": "tiny", "m": null | 0.05 } | "open",
    "at": { "rel": "on" | "under" | "in" | "round" | "behind" | "hangs" | "beside", "of": "room or thing id", "quote": "..." },
    "exists": "from the start" | { "after": "event id", "quote": "..." },
    "text_on_it": "..." | null
  }],
  "player": {
    "who": "...",
    "sizes": [{ "id": "usual" | "small" | "large", "height_m": 0.254 | "open", "quote": "..." }]
  },
  "actions": [{
    "id": "...", "verb": "open | take | drink | eat | unlock | look | go through | ...", "thing": "thing or opening id",
    "needs": [{ "what": "holding key | size small | ...", "quote": "..." }],
    "effect": [{ "what": "player size small | thing gone | opening opened | ...", "quote": "..." }],
    "fails": [{ "when": "...", "says": "what the text says happens", "quote": "..." }],
    "quote": "..."
  }],
  "events": [{ "id": "...", "after": "action id", "quote": "..." }],
  "goal": { "words": "...", "quote": "..." },
  "beyond": [{ "what": "what is seen past the scene's edge but not entered", "through": "opening id", "words": "...", "quote": "..." }],
  "not_in_this_text": ["facts a builder might expect that this text does not establish"]
}
```
