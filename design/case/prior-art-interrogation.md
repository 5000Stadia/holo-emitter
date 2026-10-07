# Prior art: questioning characters (M7 / R57)

Opened = page fetched and read this session. Snippet = seen only in a search result summary. Lead = not opened.

## What shipped games do

**Façade (2005)** — the closest ancestor of "question in your own words". [Mateas & Stern, "Natural Language Understanding in Façade: Surface-text Processing"](https://www.cp.eng.chula.ac.th/~vishnu/gameResearch/story_november_2005/MateasSternTIDSE04.pdf) (opened, read as text). Two phases: surface text to **discourse acts** by forward-chaining template rules, then a context-dependent choice of reaction. About 25 acts (agree, criticize, praise, explain, refer-to-object, "cannot understand"...): a "strong many-to-few mapping" that ignores most semantics and keeps pragmatics. ~800 template rules (~6800 compiled), under 300 ms on a 2 GHz machine. Design choice worth copying: rules "err on the side of being overly permissive", because a character that extracts some meaning from a broad set of inputs beats one that says "huh?" to most. Context steers players to fitting language. Reception ([Wikipedia](https://en.wikipedia.org/wiki/Fa%C3%A7ade_(video_game)), opened): "revolutionary" (Adams), but "the parser's not perfect", awkward stares at unrecognised input, easy to abuse.

**L.A. Noire (2011)** ([Wikipedia](https://en.wikipedia.org/wiki/L.A._Noire), opened). Per answer: believe / doubt / accuse of lying; a lie needs evidence submitted. Praised as the most compelling part; criticised because the three choices were "vague and sometimes illogical" and play was passive (listen, press a button). Lesson: the stance verbs are right, but their labels must say what you are doing (Doubt reads as hunch; the player cannot tell what the system will do).

**Ace Attorney** ([Wikipedia](https://en.wikipedia.org/wiki/Ace_Attorney), opened). Testimony is a list of statements; **press** any one for more, **present** evidence against one. Wrong presentation costs a life. Praised for contradiction-finding; criticised for trial and error and press-order dependencies. This is the cleanest model of "how a lie is broken": the lie is a statement, the breaker is a named item.

**Her Story (2015)** ([Wikipedia](https://en.wikipedia.org/wiki/Her_Story_(video_game)), opened). 271 clips behind a keyword search; the author swapped script words for synonyms so searches would not match everything; seen-clips tracking; "essentially Googling" gave pacing and "contemplative gaps". Lesson: free text can be a plain keyword lookup into authored testimony, no model.

**Return of the Obra Dinn** ([Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn), opened) and **The Case of the Golden Idol** ([Wikipedia](https://en.wikipedia.org/wiki/The_Case_of_the_Golden_Idol), opened). No-model accusation: collect words/clues, fill blanks in an account; Obra Dinn confirms correct fates only in **groups of three** to stop guessing; Golden Idol locks a segment when all its words are right. Both praised; Golden Idol criticised for guessable final names and obscure/non-separated clues. Directly reusable as the accusation scene.

**Disco Elysium** ([Wikipedia](https://en.wikipedia.org/wiki/Disco_Elysium), opened). Dialogue trees plus skill voices that advise; no free text. Praised. Lesson: choices can be rich if the options carry the voice and consequences.

## LLM-driven games

- **Vaudeville** (Bumblebee, early access 2023). Type or speak to suspects. [Keen Gamer preview](https://www.keengamer.com/articles/previews/vaudeville-preview-the-ai-questioning-to-nowhere/) (opened): organic, varied replies, but characters contradict each other (chief and coroner both "insist they are correct"), echo your words back, misread you; the mystery becomes a loop. The failure to avoid: facts held by the model rather than the world.
- **Suck Up!** (Proxima). Voice persuasion of LLM neighbours. Snippet only ([search summary](https://store.steampowered.com/app/2726370/Suck_Up/) lead; Steam "Mixed 51% of 189" via a third-party aggregator, unverified): idea liked, immersion breaks, repetitive.
- **Covert Protocol** (Inworld/Nvidia GDC 2024): a detective asks a porter, receptionist and guest for a room number. Snippets only ([TechRadar](https://www.techradar.com/gaming/a-new-nvidia-tech-demo-features-real-time-ai-characters-that-react-to-player-decisions), [Nvidia](https://www.nvidia.com/en-au/geforce/news/nvidia-ace-gdc-gtc-2024-ai-character-game-and-app-demo-videos/): leads): hands-on "you can tell you're talking to an NPC"; no latency or cost figures published.
- **Event[0], 1001 Nights, Hidden Door, AI Dungeon**: not found or not opened. No claims.

## Research

- [Sato et al., "A Werewolf agent that does not truly trust LLMs"](https://arxiv.org/abs/2409.01575) (abstract opened): a rule-based layer decides whether to emit the LLM line or a prepared template; fewer inconsistencies, seen as more human. Same shape as our check-then-fallback.
- [Mitigating Hallucination in Fictional Character Role-Play, RoleFact](https://arxiv.org/html/2406.17260v2) (opened): characters import outside knowledge; fix is verifying claims against the character's script and dropping unsupported ones (+18% precision on adversarial questions; retrieved-only gave high factuality but dull replies). Supports a fact-list-only prompt plus a post-check, and warns that it costs liveliness.
- [KNUDGE, Ontologically Faithful NPC Dialogue](https://arxiv.org/abs/2212.10618) (abstract opened): generated NPC dialogue held to a game ontology; models "competent... room for future work". Confirms checking against a world model is an open problem, not solved.
- Leads, not opened: [MIRAGE](https://arxiv.org/abs/2501.01652) (LLMs in murder-mystery role-play; reported over-trust and context drift, via a secondary summary), [Neeko](https://arxiv.org/pdf/2402.13717), [CHARM](https://arxiv.org/pdf/2609.01352) (character knowledge boundary vs model boundary), [Holmes](https://github.com/eliotjlee/holmes) (hobby LLM suspects project).
- Cost per session: no source found with a figure. Do not quote one; R59 measures ours. Latency: Façade's 300 ms is the only opened number; a "3 s to first token raises abandonment 25-40%" claim on CostHawk is unsourced (snippet), treat as folklore.

## What M7 adopts

1. **Stances as the verbs** (Ace Attorney, L.A. Noire): **ask, press, show, accuse**. Label by effect: "Ask about X", "Press: you said Y", "Show: the letter", "Accuse". Avoid L.A. Noire's vague Doubt.
2. **A lie is a stored statement with a named breaker** (Ace Attorney): `claims[].debunked_by` already in the schema. Press yields detail; show-with-the-right-item breaks it; a wrong item costs the suspect's patience, not a life (soft: they close up for a few turns).
3. **Free text = intent reading into a closed enum, Façade style** (permissive; many-to-few; a "cannot understand" act). Order: keyword/template match first (ms, no model), model read only when that fails, topic list when both fail. This also makes the no-model game a first-class mode, as the vision demands.
4. **The model voices, never decides** (Sato, RoleFact): code picks act + at most 3 facts; model writes a line; post-check on `used` and on entity names; one retry; then the plain fact text in period phrasing. Accept some flatness; Vaudeville shows the opposite failure costs more.
5. **Accusation is a no-model fill-in scene** (Obra Dinn/Golden Idol): culprit, means, motive, opportunity from your notebook; confirm in groups so guessing cannot win; wrong accusation costs standing, not the game.
6. **Menus vs free text:** default to 4-6 visible topic chips drawn from what the player has learned, with a text box as an optional shortcut. The chips guarantee the player is never stuck (Golden Idol's obscure-clue complaint; Vaudeville's loop), the box delivers "your own words".
7. **Latency budget (target, ours, to be measured):** template read under 50 ms; if a model read or voice call is needed show the suspect "considering" (a held gesture on the bust) and cap at about 3 s, then fall back to the fact text. Never block walking.
8. **Conversation not database:** (a) the suspect remembers what you asked (`said`) and refers back ("As I told you in the hall..."); (b) answers include a stance beat (a glance at the door, a pause) from code; (c) each answer opens exactly one new thread or hook; (d) Her Story's gap: leave silences, let the player walk away and return changed.
9. **Pacing/fairness:** Golden Idol's lesson is to separate essential from texture clues; our `effect: genuine|false|context` does that, and the fair-play check guarantees reachability.
10. **Logs:** record every intent decision (template/model/menu) so R59 can show how often each path fired.
