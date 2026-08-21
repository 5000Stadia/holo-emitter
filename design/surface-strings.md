# holo-emitter — every string the surface can show

The complete enumeration of what this page can put in front of a person, in every state it can be
in, with the audience each string is addressed to. Written because a stranger opening the public
link read the project talking to itself about its own rules, and nothing in the build could see it.

`tests/playwright/voice.spec.mjs` **parses the fenced blocks below** — they are test input, not
illustration. Editing this file changes what the suite asserts, so an edit here is a code-class
change and is examined as one; it ships in the work commit, never in a state-only closing commit.

**Only the fenced blocks are parsed.** Prose outside them is prose: reformat it, wrap it, add a
paragraph, and no guard moves. Inside a fence the format is load-bearing and the parser **hard-fails
on a line it cannot read** rather than silently dropping it, because a guard that goes quiet when
its input breaks is the failure mode this project has already paid for twice.

---

## The rule [HUMAN, quoted — `design/intention.md`, *What everything passes through*]

> **The product's voice on every rendered string** [HUMAN, 2026-08-19]: anything the page can show
> a player — chrome, status lines, errors — speaks as the product to a player, in the product's
> voice. Developer speech goes to the console; method speech goes nowhere. Every artifact
> examination reads every reachable surface string as its intended audience.

## The gate [AI]

Three questions, asked of every string:

1. **Audience.** Does it speak to a player about the world, rather than about this project's
   construction — its paths, commands, fingerprints, module names, spec rows, method vocabulary?
2. **Voice.** Would a stranger reading the page hear one speaker?
3. **Truth** (for any string authored here): is it true of the state it reports, on **every branch**
   of that state?

**Control names [AI].** A control's accessible name is the shortest true name of what it does. It
is announced as a button name, not as a sentence, so there is no seam to hear.

**Region names [AI].** A region's name says what the player will find there, in the product's
voice, and may be a phrase rather than a verb. `Narration log` and `Inventory` would fail — they
name the mechanism.

**The forbidden move, stated so it can be applied [AI].** A *system naming its own condition in
system terms* fails: `Loading…`, `Status: OK`, `Something went wrong`. A *product whose fiction
contains the apparatus may report the apparatus's condition in the fiction's terms* — this product
**is** an emitter projecting a pattern (blueprint §1 makes the device literal), so a failing
projection is a fact about the place, not a program describing itself. That is what separates
`The projection wavers; the pattern will not resolve.` from `Something went wrong`.
**Its residue, named rather than licensed away:** a stranger cannot then tell a broken deploy from
an intended mood. That is a taste call and it is in `QUESTIONS`.
Costume fails too — inflating a short string into dialogue (`Thou bearest:`).

**Speech about the visitor's own device is not developer speech [AI].** A browser that will not run
scripts is a fact about their machine, not about our repository. That is the one licence class, and
the class list is **closed** — adding one is Kabe's, not a builder's.

**What a verdict means for "every string is player-voiced product speech" [AI]:**

| Verdict | The clause… |
|---|---|
| `PASS` | **holds** |
| `LICENSED:device` | **holds** — the licence records the ground on which a string naming a mechanism still passes, not an exemption |
| `OPEN` | **not yet certified** — the honest shortfall, and every `OPEN` row is named in `QUESTIONS` |

## The voice, positively [AI-on-[AI] — **advisory until Kabe ratifies it**]

Prohibitions cannot generate a sentence, and later chrome rows need something that can. But the
provenance matters and is easy to get wrong: the 38 narration lines are **[AI]-authored** (row 2's
builder) and their register is "authoring discipline, gated by Kabe's transcript read at row 5" —
builder-written and ungated. So this is [AI] derived from [AI] prose. It is **advisory**, it is in
`QUESTIONS`, and it does not bind a later row until he has ruled.

- **Person and tense.** Second person, present. *"You take the iron key."*
- **Subject.** A material thing or the place: oak, iron, brass, vellum, latch, runner, reach,
  weight. Never a component, a state name, or an operation.
- **Fault register.** The *projection* is the subject — `projection`, `pattern`, `resolve`, `hold`.
  Faults are reported, never apologised for and never instructed around.
- **Control and region names.** The two boundaries above.
- **Forbidden.** Costume; a system naming its own condition in system terms; instruction about the
  chrome.

## Reachable [AI]

A string is reachable if **a shipped code path can put it on a surface**. Data-dependence is
separate: strings sourced from fixture or record data are enumerated from the committed tree, and
every composing site disposes its degenerate values below. A hand-edited bake supplies its own
prose — the page's duty is that *its own* strings are clean and that foreign data cannot make it
emit developer speech.

**A sink is judged generically, and the unobserved class falls out of that** rather than being a
carve-out for rows the tests cannot reach: `inventory.js` names whatever record it is handed, so
**every bound record's `noun` is reachable through that sink**. The world's current `takeable`
flags decide only whether a *test* can drive one onto the surface today — which is why #17–21 are
members with `PASS` and `observed: no`, and why that column is computed from the fixture rather
than written by hand.

**What "the rendered surface" covers.** What `index.html` renders, in any state, through any sink
below. **Not** anything a reader reaches by leaving the rendered page: neither the repository's own
documents (Pages serves `main` root, so `design/` travels with the code — this file included, dense
with `§` and spec-row references), **nor `index.html` and `src/*.js` themselves, whose comments
carry far more method vocabulary than the documents do and need no guessing at all — View Source
is one keystroke.** An earlier version of this paragraph argued carefully about the harder case and
never mentioned the easier one sitting beside it. The line drawn here is *rendered surface*, not
*served bytes*; whether that is the right line, given the complaint was framed as what a stranger
at the alpha link can read, is in `QUESTIONS`.

**Text painted into art** — a book spine, a tapestry motto, lettering a generator puts in a
backdrop — is a string the surface shows a player, in nobody's authored voice. None exists at V1
(the library is procedural and the renderer forbids text APIs), so there is nothing to enumerate
today. It is **inside** this domain in principle, and the only place it can be prevented is row 4's
prompt sheets, so it is handed to row 4 rather than left to arrive unowned.

**Out of domain, per mechanism** (not one sentence for five different things):

| Mechanism | Disposition |
|---|---|
| Zoom / large default font | **In domain.** The pane guard runs at 320 px and at 200%. |
| forced-colors, user stylesheet | Out — they restyle the same strings. Owner: row 10. |
| browser translation | Out, reason named: it replaces every string with a machine register, so it defeats voice rather than vocabulary and no guard here could hold it. Known limit, no owner — nothing in M0 addresses it. |
| print | Out — no print stylesheet, and the product is not a document. |

## The maintenance rule [AI]

**A row that adds, changes or removes a surface *or console* string extends this file in the same
commit — with a verdict and an adjudicator — and the suite is red until it does.**

- `verdict` is a closed vocabulary. The guard fails on an empty cell, on `UNJUDGED`, and on any
  value outside the set. `OPEN` is admissible **only** for a row `QUESTIONS` also names.
- `adjudicator` names the examination on record as having read the string **as a stranger** — not
  the hand that wrote it. **What this guarantees, stated honestly:** the check is non-emptiness, so
  it forces a later row to *name* an examination; it does not prove one happened. It is a
  convention with a falsifiable name in it, not a proof. It exists because a token list is green
  against the very defect class this row was created by — *"The document is the sole truth"* on the
  product face passes every vocabulary check — so the durable mechanism cannot be the token list.
- **Degenerate-value rule.** Every surface string composed at runtime enumerates its degenerate
  values — absent, null, empty, non-string, over-long — and disposes each, in `SINKS`.

## What this apparatus does NOT hold [AI] — read before trusting a green suite

Four artifact critiques hardened these guards; the fourth still found holes, and they are written
here rather than left for the next reader to rediscover:

- **The swept-state set is derived from this spec's source text, and a `STATE:` marker in a
  comment counts.** Delete a test body, keep its comment, and the equality stays green. Every
  state whose name is a runtime-built label (`facing-*`, the `module-missing-*` loop, the two
  boot branches, the tile counts) is registered that way. **`fullyParallel: true` is why**: a
  module-level Set cannot aggregate across workers, so recording labels at run time needs a
  shared-file or teardown mechanism this row did not build. Until it exists, a comment can
  certify a state.
- **The sink census's site identity is `file :: write-kind`**, so a *second* `.textContent =` in
  a file that already has one is pre-enumerated and invisible. The block's prose claims site-level
  coverage; the identity is coarser than that.
- **Touch, pen and keyboard states are not swept.** `index.html` branches on `pointerType` and
  registers a `keydown` handler; the sweep drives mouse and `dispatch` only. A string written from
  the touch branch of `pointerup` reaches a phone with the suite green.
- **The scripts-off state is swept at one size.** The zoom/width matrix runs with scripts on, so
  the one `LICENSED` string — the only sentence in the only state with no console — is not
  measured for legibility at 320 px and 200%, where it is clipped mid-predicate.
- **`COLLECT` does not pierce shadow roots** and does not read `::marker`/`::placeholder`;
  `attachShadow` is not in `UNUSED_SINKS`.
- **The batch's `announced-surface.txt` is generated by an uncommitted script** and no test reads
  it; its "in order" claim is not held by anything, and it has been wrong once.

None of these is a defect in the shipped strings — the fourth critique could not make the shipped
tree show a developer or method string in any state it could reach. They are gaps in what the
apparatus would *catch next time*, which is what a later row inherits.

## For the next artifact critic [AI]

The intention's standing duty is that *every* artifact examination reads every reachable surface
string as its intended audience. A vocabulary list carries words and cannot carry voice, so when
this project's next row is examined, its brief should carry: **read the running page as a stranger
first and open this file afterwards**; try to make the page show a developer string (break the
bake, hand it a bad viewstate, disable JS — error paths count); attack the `SINKS` and `STATES`
completeness claims independently, with the page in front of you, because they are claims the
builder made; and ask of **each** state, not only the healthy one, whether the assembled surface
reads as standing somewhere or as a diagram.

## The first encounter, as a sequence [AI]

The blocks below are a set; what a stranger meets is ordered, and "standing somewhere" is a
property of the order. At t=0: the tab reads `holo-emitter`; the stage draws the study's north
facing in grid mode with its facing glyph; two chevrons stand at the edges; **the bottom chrome is
empty**. The first authored sentence a player can cause is whichever narration line their first
click earns — which may well be a refusal. The tab title cannot be captured by the test harness
(it screenshots the page, not browser chrome), so it is described here rather than shown.

## Engine-conditional claims [AI]

Verified on Chromium and Firefox only; **WebKit is unverified by anyone** and Safari/iOS is the
likeliest engine for a phone visitor at the public link:

- the narration pane's wrapping and clipping behaviour (the load-bearing property of the status
  band's removal);
- computed `::before`/`::after` `content` collection;
- text extraction from a scripts-disabled context (the shipped suite does it today, but that
  availability is not guaranteed uniform across engines; if it fails on one, that state is swept on
  the other and this line is why).

---

## STRINGS

Every reachable surface string. `observed: no` is **derived, not written**: admissible only when
the sink is the inventory tile name and the entity is not `takeable` in the committed `world.json`,
which the test computes from the fixture so it cannot be widened by hand.

The 38 narration lines and the record nouns are carried **verbatim** here and byte-compared against
their homes (`fixtures/demo-study/narration.json`, the bound library), so the copy cannot drift and
a human still reads the whole product face in one place.

```STRINGS
id | surface | state | verdict | observed | adjudicator | string
3 | #narration | boot viewstate the world does not hold (either branch) | PASS | yes | row7-artifact-critic | The projection was set to a view this pattern does not hold.
4 | #narration | a script never arrived / the app never took, before any frame | PASS | yes | row7-artifact-critic | The projection will not hold. Nothing of this place can be shown.
5 | #narration | a throw on the render path, after boot | PASS | yes | row7-artifact-critic | The projection wavers; the pattern will not resolve.
6 | #narration | a narration key resolves to nothing; an intent the transport cannot read | PASS | yes | row7-artifact-critic | The pattern falters; the words do not come.
7 | #narration | scripts disabled | LICENSED:device | yes | row7-artifact-critic | This place is projected by your browser, and your browser is not running scripts. Nothing can be shown here until it does.
8 | document title | always | OPEN | yes | row7-artifact-critic | holo-emitter
9 | #chevron-left aria-label | always | PASS | yes | row7-artifact-critic | turn left
10 | #chevron-right aria-label | always | PASS | yes | row7-artifact-critic | turn right
11 | #narration aria-label | always | PASS | yes | row7-artifact-critic | what the room says
12 | #inventory aria-label | always | PASS | yes | row7-artifact-critic | what you are carrying
13 | inventory tile name | held entity whose record has no usable noun, OR whose sprite binds to no record at all | PASS | yes | row7-artifact-critic | something you carry
64 | #narration | the inventory strip throws while the picture is intact | PASS | yes | row7-artifact-critic | What you carry is with you still, though it will not show itself here.
14 | inventory tile name | key1 held | PASS | yes | row7-artifact-critic | iron key
15 | inventory tile name | note1 held | PASS | yes | row7-artifact-critic | vellum notebook
16 | inventory tile name | coin1 held | PASS | yes | row7-artifact-critic | silver coin
17 | inventory tile name | desk1 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | joined oak writing desk
18 | inventory tile name | chair1 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | joined wainscot chair
19 | inventory tile name | door1 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | plank door
20 | inventory tile name | shelf1 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | back-panelled oak bookcase
21 | inventory tile name | stick1 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | brass candlestick
22 | scene canvas | grid mode, facing N | PASS | yes | row7-artifact-critic | N
23 | scene canvas | grid mode, facing E | PASS | yes | row7-artifact-critic | E
24 | scene canvas | grid mode, facing S | PASS | yes | row7-artifact-critic | S
25 | scene canvas | grid mode, facing W | PASS | yes | row7-artifact-critic | W
26 | #narration | toggle.desk1.open_reveal | PASS | yes | row7-artifact-critic | The drawer resists, then gives. Inside, an iron key.
27 | #narration | toggle.desk1.open | PASS | yes | row7-artifact-critic | The drawer slides out along its runners, easy with long use.
28 | #narration | toggle.desk1.closed | PASS | yes | row7-artifact-critic | You press the drawer home, and it seats with a soft knock of oak on oak.
29 | #narration | toggle.door1.open | PASS | yes | row7-artifact-critic | The iron ring turns, the latch lifts, and the plank door swings wide.
30 | #narration | toggle.door1.closed | PASS | yes | row7-artifact-critic | The door falls to, and the latch drops into its keeper.
31 | #narration | toggle.desk1.refused_unreachable | PASS | yes | row7-artifact-critic | The desk is beyond your reach from where you stand.
32 | #narration | toggle.door1.refused_unreachable | PASS | yes | row7-artifact-critic | The door will not answer from here; you must come before it.
33 | #narration | toggle.chair1.refused_static | PASS | yes | row7-artifact-critic | The chair is joined oak through and through; nothing in it opens or shuts.
34 | #narration | toggle.stick1.refused_static | PASS | yes | row7-artifact-critic | The candlestick is a single casting of brass; there is nothing in it to work.
35 | #narration | toggle.shelf1.refused_static | PASS | yes | row7-artifact-critic | The shelf is fixed boards, pegged fast; it keeps no hinge and no drawer.
36 | #narration | toggle.note1.refused_static | PASS | yes | row7-artifact-critic | The notebook has neither clasp nor lock; its leaves simply lie as they lie.
37 | #narration | toggle.coin1.refused_static | PASS | yes | row7-artifact-critic | The coin is one small disc of silver; it neither opens nor closes.
38 | #narration | toggle.key1.refused_static | PASS | yes | row7-artifact-critic | The key holds no working of its own; it is made for a lock, not to be one.
39 | #narration | take.key1.taken | PASS | yes | row7-artifact-critic | You take the iron key. It is cold, and lighter than it looks.
40 | #narration | take.note1.taken | PASS | yes | row7-artifact-critic | You lift the vellum notebook, and its leaves whisper as they settle.
41 | #narration | take.coin1.taken | PASS | yes | row7-artifact-critic | The silver coin comes away from the shelf board with a faint scrape.
42 | #narration | take.key1.refused_held | PASS | yes | row7-artifact-critic | The iron key is already in your keeping.
43 | #narration | take.note1.refused_held | PASS | yes | row7-artifact-critic | The notebook is with you already, safe among what you carry.
44 | #narration | take.coin1.refused_held | PASS | yes | row7-artifact-critic | The coin already rides with you; your fingers know its edge.
45 | #narration | take.key1.refused_unreachable | PASS | yes | row7-artifact-critic | The key is not within reach of your hand from here.
46 | #narration | take.note1.refused_unreachable | PASS | yes | row7-artifact-critic | The notebook lies too far off; you are not near enough to take it.
47 | #narration | take.coin1.refused_unreachable | PASS | yes | row7-artifact-critic | The coin is out of your reach; your arm does not stretch so far.
48 | #narration | take.key1.refused_contained | PASS | yes | row7-artifact-critic | The drawer is shut over the key; it must be opened again first.
49 | #narration | take.desk1.refused_fixed | PASS | yes | row7-artifact-critic | The desk is heavy joined oak, pegged at every corner; it will not be carried.
50 | #narration | take.chair1.refused_fixed | PASS | yes | row7-artifact-critic | The wainscot chair is a solid burden of oak; it keeps its place.
51 | #narration | take.door1.refused_fixed | PASS | yes | row7-artifact-critic | The door hangs on its iron hinges, and there it will hang.
52 | #narration | take.stick1.refused_fixed | PASS | yes | row7-artifact-critic | The brass candlestick is a great floor-piece, heavier than it has any right to be; it stays where it was set.
53 | #narration | take.shelf1.refused_fixed | PASS | yes | row7-artifact-critic | The bookshelf is a full press of oak against the wall; no strength of yours will shift it.
54 | #narration | go.door_study_hall.arrive | PASS | yes | row7-artifact-critic | You step through into the hall and come about to face the doorway you came by. The air is wider here, and cooler.
55 | #narration | go.door_hall_study.arrive | PASS | yes | row7-artifact-critic | You pass back into the study, where ink and oak dust close about you again.
56 | #narration | go.door_study_hall.refused_closed | PASS | yes | row7-artifact-critic | The door is shut against you; the latch has not been lifted.
57 | #narration | go.door_hall_study.refused_closed | PASS | yes | row7-artifact-critic | The way back stands barred; the door wants opening first.
58 | #narration | go.door_study_hall.refused_unreachable | PASS | yes | row7-artifact-critic | The way to the hall does not open from where you stand.
59 | #narration | go.door_hall_study.refused_unreachable | PASS | yes | row7-artifact-critic | The way to the study is not before you; you must come to it first.
60 | #narration | toggle.*.refused_unknown | PASS | yes | row7-artifact-critic | Nothing of that description offers itself to your hand.
61 | #narration | take.*.refused_unknown | PASS | yes | row7-artifact-critic | You reach, and your hand closes on nothing of the sort.
62 | #narration | go.*.refused_unknown | PASS | yes | row7-artifact-critic | No such passage is to be found; the walls keep their counsel.
63 | #narration | turn.*.refused — a room that really has one facing (a doctored one-facing world). NOT the broken-boot state: a viewstate naming a location the world lacks is a broken document, not a one-aspect room, and saying "you face all there is to face" there put a false sentence directly under a true one. That branch now takes the transport fault line, #6. | PASS | yes | row7-artifact-critic | The room offers no other aspect; you face all there is to face.
```

```COUNT
STRINGS 62
STATES 36
```

**Enumerated is not swept.** `COUNT` is the authority for how many rows there are; five of them
(#17–21) reach no surface on the shipped tree, so any report cites *enumerated* and *swept*
separately rather than letting one number stand for both. The two figures are read off the fenced
blocks, never written beside them — a prose count went stale the moment a row was added.

The chevron glyphs `‹` and `›` are marks, not words, and are not `STRINGS` members; the runtime
sweep skips them by exact value, recorded here so the exception is visible rather than silent.

## STATES

The sweep drives exactly this set and the test asserts the driven set equals it, so a state cannot
enter `STRINGS` without entering the sweep or the reverse.

```STATES
cold-boot
facing-study-E
facing-study-S
facing-study-W
facing-hall-N
facing-hall-E
facing-hall-S
facing-hall-W
drawer-open-key-revealed
one-tile-held
two-tiles-held
three-tiles-held
refusal
refusal-repeated
all-narration-triples
broken-boot-location
broken-boot-facing
module-missing-renderer
module-missing-harness
module-missing-placeholders
module-missing-inventory
module-missing-groundplane
module-missing-fixture
render-fault
halted-but-painted
viewport-changed-after-load
missing-narration-key
unreadable-intent
noun-missing
scripts-disabled
capture-mode
pointer-hover
pointer-click
width-320
width-1366
zoom-200
```



**Stringless states, hand-enumerated with their dispositions** — no branch-of-sink derivation can
produce these, because their content is an absence:

- **Every healthy load** — the whole bottom chrome carries no words until the player acts. The
  storefront's silence is `QUESTIONS`.
- **A refusal repeated in a row** — one line, then silence, by design: a count in the fiction's
  voice would be a string about the message stream, in the one place that speaks only about the
  world.
- **Parse → first paint** — an empty stage, two chevrons, the tab title. Accepted: one task on a
  static page, and a loading line would be onboarding prose this row may not author.
- **`<canvas>` fallback** — empty. A browser without 2D canvas cannot render this product at all.
  Accepted for M0, deliberately not filled: canvas fallback text is exposed to assistive technology
  as the canvas's content, so authoring it is an accessibility decision, not a strings one.
- **`<meta name="description">` / Open Graph** — absent. A share card is a string another system
  shows *about* the page. Accepted for M0.
- **GitHub Pages' 404 body** — GitHub's surface, not ours. Accepted for M0.

## SINKS

Every site in the shipped source that can put a string on a surface. The test extracts these by
pattern over **all** such calls and asserts the set equals this block, so a new site makes the
suite red until it is entered here with its branches and degenerate values.

```SINKS
index.html | textContent | composed
src/inventory.js | title | composed
src/inventory.js | setAttribute aria-label | composed
```

Sites are named by the identity the census detects — `file :: write`, matched in **both**
directions, so a new sink and a deleted row are each red. Three more surfaces are literals in
`index.html` rather than write sites and are enumerated in `STRINGS` instead: the `<title>`, the
five `aria-label` attributes, and the `<noscript>` body. `src/renderer.js`'s `GLYPHS` table is
guarded by its own equality check against #22–25.

**Degenerate values, disposed per composed site:**

- `appendNarration(line)` — a non-string never reaches it: `updateChrome` guards
  `typeof envelope.narration === "string"`, and the harness substitutes its own product-voiced
  fault line when a narration key resolves to nothing. Over-long: the pane wraps and scrolls.
- `tile.title` / `aria-label` — absent, empty or non-string `noun` falls back to `something you
  carry` (#13) with the record id on `console.error`. **A sprite that binds to no record at all**
  is the branch one line above, and it had no disposal: the tile was appended with no name, no
  role and nothing on the console — a nameless empty box beside prose saying you had just picked
  something up. It takes the same fallback and its own console fault. Over-long: the tile's name
  is not rendered as text, so length is not a surface concern.

## UNUSED_SINKS

**One principle, applied both ways:** a sink is listed only when its appearance in this page would
mean an unaudited string had arrived — never to withhold a technique a later row may legitimately
need. Unsafe HTML sinks and modal text sinks qualify, because each puts text on screen outside
every sink the census knows. `createTextNode`, `.alt =`, `.placeholder =`, `aria-roledescription`,
`aria-valuetext`, `aria-placeholder`, `<a href>`, inline `<svg>` and `document.title =` are
deliberately **not** listed: they are ordinary techniques rows 8–10 may need, and a string arriving
through any of them is caught by the runtime sweep, which reads all nine naming attributes. (It
read six until an artifact critic put a spec-row reference and a repo path into
`aria-roledescription` and watched the whole suite stay green — the justification named a net that
did not cover them.) Listing them would be
a capability decision binding three later rows.

```UNUSED_SINKS
innerHTML
insertAdjacentHTML
outerHTML
document.write
srcdoc
alert(
confirm(
prompt(
fillText
strokeText
measureText
```

`fillText`/`strokeText`/`measureText` are here as a **secondary** net only. The canvas's one
textual mark — the facing glyph — is drawn as stroked polylines, so an API deny-list proves nothing
about it; the real guard is that the renderer's `GLYPHS` table must have exactly the members
enumerated at #22–25.

## VOCABULARY

Matched on **shapes, not bare words**, because a bare-word list collides with the product's own
vocabulary: `envelope` is Kabe's own example of a scene object (blueprint §9.2), so a row-4 record
reading `vellum envelope` would go red and the cheap fix would be renaming the object. Bare `gate`,
`envelope`, `pattern`, `record` are world words and are not listed.

```VOCABULARY
DEVELOPER | \b[\w.-]+\.(json|mjs|js|png|html|py)\b
DEVELOPER | \b(node|npx|npm|git)\s+[\w./-]+
DEVELOPER | \b(fixtures|tools|src|library|backdrops|design)/
DEVELOPER | \bBOOT ERROR\b
DEVELOPER | \b(viewstate|staging\.json|world\.json|narration\.json|bake-fixtures|placeholders)\b
DEVELOPER | \b[a-z]+[A-Z][a-zA-Z]*\(
DEVELOPER | \bTODO\b|\bFIXME\b
METHOD | §
METHOD | \bV[123]\b
METHOD | \b(spec row|done clause|flip test|blind comparison|plan critic|artifact critic|Navigator|Builder|Reviewer|provenance tag)\b
```

`DEVELOPER` is forbidden on the surface and **allowed on the console** — that is its home.
`METHOD` is forbidden in **both**: "nowhere" means nowhere.

## LICENSED

Exact strings admitted against `VOCABULARY`. **One class, closed.**

```LICENSED
device | This place is projected by your browser, and your browser is not running scripts. Nothing can be shown here until it does.
```

Ground: speech about the **visitor's own machine** is not speech about this project, and this is
the one state in which no console exists — a visitor who cannot be told the mechanism cannot act.
The rejected reading, recorded so the fork is visible: "in any state" forbids naming any mechanism,
so this becomes *"This place will not appear"* and the visitor is left unable to act. Declined.

## CONSOLE

The developer channel's members. The maintenance rule covers these too — an earlier draft left the
console's enumeration in a plan file that dies at close, which would have made the audit complete
over one destination out of two.

```CONSOLE
index.html | boot witness | holo-emitter — fixture bake fp <fp> / truth: fixtures/demo-study/*.json / after editing a fixture, re-bake: node tools/bake-fixtures.mjs
index.html | inventory fault: <detail>
index.html | boot fault: <detail>
index.html | render fault: <detail>
index.html | BOOT ERROR: viewstate <json> names no location/facing in world.json — every turn will be refused. Fix fixtures/demo-study/viewstate.json and run: node tools/bake-fixtures.mjs
src/harness.js | missing narration: <key>
src/harness.js | unreadable intent: <detail>
src/inventory.js | record has no usable noun: <sprite> (entity <id>)
src/inventory.js | no library record for sprite: <sprite> (entity <id>)
```

**Stated hole:** the `METHOD` scan over console strings runs on **source literals only**, so a
console string composed at runtime escapes it; the runtime half is the observed console output on
the swept states, on two engines, on one machine — never on the deployed page.

## QUESTIONS

Every `OPEN` verdict, and every decision this row records but may not make. Recorded **where the
Navigator will find them** — only the Navigator can put anything in front of Kabe, and no
mechanism in a document creates that message.

```QUESTIONS
8 | the tab title | Reading A: blueprint §1 is [HUMAN] and spells the product `holo-emitter` lowercase as one of a family (pattern-buffer, construct), and a product's own name is product speech. Reading B: §1 spells a name in prose and rules nothing about what a browser tab shows a stranger; a lowercase hyphenated slug reads as a repository. Left unchanged, because the conservative act cannot be a provenance violation and is reversible by a new row while a rename would not be.
- | the fault register | After this row every fault surface is in-fiction and unactionable by design, so a stranger cannot tell a broken deploy from an intended mood. Taste, and it may not be settled by the hand that authored the register.
- | the storefront's silence | A healthy cold load now shows a picture and no words at all. This row did not create it — before the sweep the only words were developer speech — and Kabe allocated row 9 for the intro himself, sequenced after row 4. Remedies: move row 9 ahead of rows 3–4; allocate a small row for one line of arrival prose now; or accept the silence until row 9 lands.
- | the picture's size | Deleting the status band drops the chrome reserve 8.8rem to 7.6rem, so the picture is larger on every height-bound viewport. A look change in a row sequenced before the presentation row.
- | the voice specification | The positively-stated register above binds later chrome rows and is [AI] derived from [AI] prose. Advisory until ratified.
- | the facing glyph | Kept, and argued from the product. But on a bare facing in grid mode the product's entire answer to `turn` is a changed letter on a wall — the diagram quality in its purest form, and what a stranger meets today. Row 4's assets are the fix; recorded so it is not mistaken for a decision nobody looked at.
- | the pane's log form | The narration pane accumulates, so a player who has acted five times reads a transcript stacked under the picture. That is a readout, and it touches the second quality. Chrome form rather than a string, so outside this row's domain — recorded with an owner rather than deferred to a call after the close.
- | what the deploy serves | Pages serves `main` root, so the design documents AND `index.html`/`src/*.js` — whose comments carry the most method vocabulary of anything published — are readable at the public link, the source with a single keystroke. Nothing on the page links to the documents; the source needs no link. The intention's "`design/` travels with the code" is [AI-predicted, marked "correct me"], so whether the boundary above is the right one is Kabe's.
- | the bottom chrome's alignment | The prose and the tiles sit flush at the window edge while the picture is centred, so at 1920x1080 the words hang 233px off the frame into the letterbox. Aligning them to the stage was tried and reverted: it costs a whole line of prose at 750x342, and the narration is the only thing here that speaks. Row 8 can move the reserve and have both. Recorded here because it was previously filed only in a CSS comment, which is not where the Navigator looks.
- | control names, world vs machine | The inherited boundary does not decide row 8's first string: is `fullscreen` the shortest true name of what the button does, or is it a property of the visitor's window rather than of the world — the ground on which `Loading…` fails? Named here because two competent builders will otherwise ship different chrome.
```

**Rows 8–10 may not cite the voice specification as authority until it is ratified.** It is [AI]
derived from [AI] prose; that is what "advisory" means, and a row citing it as settled would be the
provenance scar running forward.
