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
| forced-colors, user stylesheet | Out, reason named (row 10 disposes its owner-line): the accessible names this row adds are plain DOM text, read by assistive tech independent of any forced-colors restyling; the affordances that DO carry colour — the hover halo and row 10's own keyboard-focus halo — are canvas pixels, not styled DOM, so forced-colors mode neither helps nor breaks them, true of the pre-existing hover halo before this row and unchanged by it. |
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
- **Rows 8–10's fifteen new strings (#65–79) are not swept by `voice.spec.mjs`'s own runtime
  sweep.** That mechanism's `STATES`-derivation self-check scans only its own file's source for
  what it drove, and the existing sweep's facing loop never opens the desk or leaves the study on
  the shipped fixture (`design/intention.md` row 14, unfixed) — so genuinely observing these strings
  meant new, standalone test files (`fullscreen.spec.mjs`, `keyboard.spec.mjs`) that parse the
  audit's fenced blocks independently rather than widening `voice.spec.mjs` itself. That independent
  parsing is a **second implementation of the same parser**, not a re-derivation of `voice.spec.mjs`'s
  guard — a divergence between the two parsers would not be caught by either.

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
- **Row 8's fallback branch, and row 10's positioning mitigation, are both iOS-Safari-specific
  claims this repo cannot check.** WebKit will not launch on this machine (already an accepted
  project-wide limit). Row 8's premise — that `requestFullscreen` is genuinely withheld on iOS
  Safari, and that dropping the chrome reserve is the best available in-page substitute — is argued
  from the row's own text, not verified against a real device. Row 10's rough per-entity
  positioning of the (invisible) keyboard controls is a mitigation against a VoiceOver activation
  hazard that could not be tested here either way. The artifact critic's appended instruction to try
  both features by hand on a real phone is the check this section cannot substitute for.

---

## STRINGS

Every reachable surface string. `observed: no` is **derived, not written**: admissible only when
the sink is the inventory tile name and the entity is not `takeable` in the committed `world.json`,
which the test computes from the fixture so it cannot be widened by hand.

The narration lines of every shipped world and every record's noun are carried **verbatim** here and
byte-compared against their homes (each `fixtures/<world>/narration.json`, the bound library), so the
copy cannot drift and a human still reads the whole product face in one place.

The `id` is a stable handle and not an ordering: rows sit where their string belongs, and a row
added later takes the next free number rather than renumbering the ones a question already cites.

**The standing readout's rows are derived from the worlds, not hand-kept** (#194–221). The readout
over the picture's top-left corner says where you stand — the place and the aspect, in the
document's own names for them — so its string set is *every location id every shipped world holds*
plus the four aspects plus the mark between them, and `tests/playwright/whereami.spec.mjs` reads
the location ids off `fixtures/*/world.json` and asserts the enumeration equals them in **both**
directions. A twenty-third room, or a renamed one, is therefore red here before it is a surprise
on the surface. The readout is filled only with a view the world actually holds — the
`atrium`-shaped viewstate that the broken-boot sweep drives leaves it blank and withdrawn — so no
name reaches the surface that no world contains, which is what makes a closed enumeration possible
at all.

Its **audience judgment**, since a room id is machine-shaped where a narration line is not: the id
names a room in the world, not this project's construction — it is world data on a surface, the
same class as a record's `noun`, and the four aspects are already on the scene canvas as painted
glyphs (#22–25). What is genuinely open is *taste*, not audience: `master_bedchamber` is the
document's handle and a stranger reads underscores. That is recorded in `QUESTIONS` under *the
standing readout* rather than settled here, because the instrument is Kabe's own ask and row 24
owns how much of it is always on.

```STRINGS
id | surface | state | verdict | observed | adjudicator | string
3 | #narration | boot viewstate the world does not hold (either branch) | PASS | yes | row7-artifact-critic | The projection was set to a view this pattern does not hold.
4 | #narration | a script never arrived / the app never took, before any frame | PASS | yes | row7-artifact-critic | The projection will not hold. Nothing of this place can be shown.
5 | #narration | a throw on the render path, after boot | PASS | yes | row7-artifact-critic | The projection wavers; the pattern will not resolve.
6 | #narration | a narration key resolves to nothing; an intent the transport cannot read | PASS | yes | row7-artifact-critic | The pattern falters; the words do not come.
7 | #narration | scripts disabled | LICENSED:device | yes | row7-artifact-critic | This place is projected by your browser, and your browser is not running scripts. Nothing can be shown here until it does.
8 | document title | always | PASS | yes | kabe-ruling-1d05819 | Holo Emitter Static Demo
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
54 | #narration | go.door_study_hall.arrive (the furnished world; a leaf stands in that opening) | PASS | yes | row21-kabe-live-finding | You step through into the cross passage. The air is cooler here, and moves. The door stands open behind you.
55 | #narration | go.door_hall_study.arrive (the furnished world) | PASS | yes | row21-kabe-live-finding | You pass back into the study, where ink and oak dust close about you again. The door stands open behind you.
56 | #narration | go.door_study_hall.refused_closed | PASS | yes | row7-artifact-critic | The door is shut against you; the latch has not been lifted.
57 | #narration | go.door_hall_study.refused_closed | PASS | yes | row7-artifact-critic | The way back stands barred; the door wants opening first.
58 | #narration | go.door_study_hall.refused_unreachable | PASS | yes | row7-artifact-critic | The way to the cross passage does not open from where you stand.
59 | #narration | go.door_hall_study.refused_unreachable | PASS | yes | row7-artifact-critic | The way to the study is not before you; you must come to it first.
60 | #narration | toggle.*.refused_unknown | PASS | yes | row7-artifact-critic | Nothing of that description offers itself to your hand.
61 | #narration | take.*.refused_unknown | PASS | yes | row7-artifact-critic | You reach, and your hand closes on nothing of the sort.
62 | #narration | go.*.refused_unknown | PASS | yes | row7-artifact-critic | No such passage is to be found; the walls keep their counsel.
63 | #narration | turn.*.refused — a room that really has one facing (a doctored one-facing world). NOT the broken-boot state: a viewstate naming a location the world lacks is a broken document, not a one-aspect room, and saying "you face all there is to face" there put a false sentence directly under a true one. That branch now takes the transport fault line, #6. | PASS | yes | row7-artifact-critic | The room offers no other aspect; you face all there is to face.
65 | #fullscreen-toggle aria-label | not in fullscreen (real API or the in-page fallback) | PASS | yes | row8-10-artifact-critic | fill the screen
66 | #fullscreen-toggle aria-label | fullscreen active (real API or the in-page fallback — one state drives both, so the label never claims one when only the other holds) | PASS | yes | row8-10-artifact-critic | leave the full screen
67 | entity-control aria-label | desk1 closed | PASS | yes | row8-10-artifact-critic | open the joined oak writing desk
68 | entity-control aria-label | desk1 open | PASS | yes | row8-10-artifact-critic | close the joined oak writing desk
69 | entity-control aria-label | door1 closed | PASS | yes | row8-10-artifact-critic | open the plank door
70 | entity-control aria-label | door1 open | PASS | yes | row8-10-artifact-critic | close the plank door
71 | entity-control aria-label | chair1, static (no states) | PASS | yes | row8-10-artifact-critic | the joined wainscot chair
72 | entity-control aria-label | stick1, static (no states) | PASS | yes | row8-10-artifact-critic | the brass candlestick
73 | entity-control aria-label | shelf1, static (no states) | PASS | yes | row8-10-artifact-critic | the back-panelled oak bookcase
74 | entity-control aria-label | key1, takeable, revealed and not yet held | PASS | yes | row8-10-artifact-critic | take the iron key
75 | entity-control aria-label | note1, takeable, not yet held | PASS | yes | row8-10-artifact-critic | take the vellum notebook
76 | entity-control aria-label | coin1, takeable, not yet held | PASS | yes | row8-10-artifact-critic | take the silver coin
77 | entity-control go-control aria-label | door1 open, on the facing of either exit it serves — one shared leaf, one string, named from the leaf's own record rather than a per-exit lookup | PASS | yes | row8-10-artifact-critic | walk through the plank door
81 | #narration | go.door_study_hall.arrive (the painted navigation world, where the opening is the building's and no leaf stands in it) | PASS | yes | row21-kabe-live-finding | You step through into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.
82 | #narration | go.door_hall_study.arrive (the painted navigation world) | PASS | yes | row21-kabe-live-finding | You pass back into the study, where ink and oak dust close about you again. The doorway stands open behind you.
80 | entity-control go-control aria-label | an exit through an opening no leaf fills — the doorway as a fact about the building, which is what the painted navigation world walks through [row 21] | PASS | yes | row21-painted-promotion | walk through the doorway
78 | #scene aria-label | always | PASS | yes | row8-10-artifact-critic | what you see
79 | entity-control aria-label | a bound entity's record has no usable noun (degenerate case; forced by a doctored record, not reachable on the shipped tree in ordinary play) | PASS | yes | row8-10-artifact-critic | something here
83 | #narration | go.door_back_stair_great_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the back stair, you come into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.
84 | #narration | go.door_back_stair_great_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the back stair into the great hall is not before you.
85 | #narration | go.door_back_stair_head_long_gallery.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the back stair head and come into the long gallery. The gallery runs off further than a room has any right to, and your steps run off with it. The doorway stands open behind you.
86 | #narration | go.door_back_stair_head_long_gallery.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the back stair head to the long gallery stands where you are looking.
87 | #narration | go.door_back_stair_head_solar.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The back stair head gives onto the solar, and you step through into it. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.
88 | #narration | go.door_back_stair_head_solar.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The back stair head does not open into the solar from here.
89 | #narration | go.door_back_stair_servants_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the back stair into the servants' hall. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.
90 | #narration | go.door_back_stair_servants_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the back stair to the servants' hall — lies elsewhere in the house.
91 | #narration | go.door_buttery_pantry_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the buttery and pantry and into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.
92 | #narration | go.door_buttery_pantry_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the buttery and pantry and the cross passage.
93 | #narration | go.door_buttery_pantry_servants_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The buttery and pantry lets you go, and the servants' hall takes you. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.
94 | #narration | go.door_buttery_pantry_servants_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the buttery and pantry and the servants' hall is not the one before you.
95 | #narration | go.door_closet_chamber_guest_chamber.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the closet chamber, you come into the guest chamber. Made ready and not lived in; nothing here has been disturbed. The doorway stands open behind you.
96 | #narration | go.door_closet_chamber_guest_chamber.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the closet chamber into the guest chamber is not before you.
97 | #narration | go.door_dining_parlour_entrance_court.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the dining parlour and come into the entrance court. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.
98 | #narration | go.door_dining_parlour_entrance_court.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the dining parlour to the entrance court stands where you are looking.
99 | #narration | go.door_dining_parlour_great_stair_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The dining parlour gives onto the great stair hall, and you step through into it. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.
100 | #narration | go.door_dining_parlour_great_stair_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The dining parlour does not open into the great stair hall from here.
101 | #narration | go.door_entrance_court_dining_parlour.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the entrance court into the dining parlour. A room kept for company, and the air in it is still. The doorway stands open behind you.
102 | #narration | go.door_entrance_court_dining_parlour.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the entrance court to the dining parlour — lies elsewhere in the house.
103 | #narration | go.door_entrance_court_great_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the entrance court and into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.
104 | #narration | go.door_entrance_court_great_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the entrance court and the great hall.
105 | #narration | go.door_entrance_court_kitchen.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The entrance court lets you go, and the kitchen takes you. Ash and cold fat hang in the air, and everything here is built for work. The doorway stands open behind you.
106 | #narration | go.door_entrance_court_kitchen.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the entrance court and the kitchen is not the one before you.
107 | #narration | go.door_garden_room_library.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the garden room, you come into the library. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.
108 | #narration | go.door_garden_room_library.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the garden room into the library is not before you.
109 | #narration | go.door_garden_room_privy_garden.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the garden room and come into the privy garden. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.
110 | #narration | go.door_garden_room_privy_garden.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the garden room to the privy garden stands where you are looking.
111 | #narration | go.door_great_hall_back_stair.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The great hall gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.
112 | #narration | go.door_great_hall_back_stair.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The great hall does not open into the back stair from here.
113 | #narration | go.door_great_hall_entrance_court.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the great hall into the entrance court. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.
114 | #narration | go.door_great_hall_entrance_court.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the great hall to the entrance court — lies elsewhere in the house.
115 | #narration | go.door_great_hall_great_stair_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the great hall and into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.
116 | #narration | go.door_great_hall_great_stair_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the great hall and the great stair hall.
117 | #narration | go.door_great_hall_library.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The great hall lets you go, and the library takes you. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.
118 | #narration | go.door_great_hall_library.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the great hall and the library is not the one before you.
119 | #narration | go.door_great_hall_privy_garden.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the great hall, you come into the privy garden. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.
120 | #narration | go.door_great_hall_privy_garden.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the great hall into the privy garden is not before you.
121 | #narration | go.door_great_stair_hall_dining_parlour.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the great stair hall and come into the dining parlour. A room kept for company, and the air in it is still. The doorway stands open behind you.
122 | #narration | go.door_great_stair_hall_dining_parlour.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the great stair hall to the dining parlour stands where you are looking.
123 | #narration | go.door_great_stair_hall_great_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The great stair hall gives onto the great hall, and you step through into it. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.
124 | #narration | go.door_great_stair_hall_great_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The great stair hall does not open into the great hall from here.
125 | #narration | go.door_great_stair_hall_library.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the great stair hall into the library. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.
126 | #narration | go.door_great_stair_hall_library.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the great stair hall to the library — lies elsewhere in the house.
127 | #narration | go.door_guest_chamber_closet_chamber.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the guest chamber and into the closet chamber. A small close room off the chamber, for prayer or for nothing. The doorway stands open behind you.
128 | #narration | go.door_guest_chamber_closet_chamber.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the guest chamber and the closet chamber.
129 | #narration | go.door_guest_chamber_stair_landing.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The guest chamber lets you go, and the stair landing takes you. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.
130 | #narration | go.door_guest_chamber_stair_landing.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the guest chamber and the stair landing is not the one before you.
131 | #narration | go.door_hall_buttery_pantry.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the cross passage, you come into the buttery and pantry. Cool and close, and it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.
132 | #narration | go.door_hall_buttery_pantry.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the cross passage into the buttery and pantry is not before you.
192 | #narration | go.door_hall_kitchen.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row26-gate | You turn out of the cross passage and the kitchen takes you in. Its heat reaches the doorway before you do, and under the heat is ash and scoured board. The doorway stands open behind you.
193 | #narration | go.door_hall_kitchen.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row26-gate | The passage's own door into the kitchen is not the one before you.
133 | #narration | go.door_kitchen_entrance_court.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The kitchen gives onto the entrance court, and you step through into it. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.
134 | #narration | go.door_kitchen_entrance_court.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The kitchen does not open into the entrance court from here.
135 | #narration | go.door_kitchen_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row26-gate | You come out of the kitchen into the cross passage. The air is cooler here, and moves, and the passage runs away east and west. The doorway stands open behind you.
136 | #narration | go.door_kitchen_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the kitchen to the cross passage — lies elsewhere in the house.
137 | #narration | go.door_library_garden_room.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the library and into the garden room. The floor is flagged and cool, and the garden is a step away. The doorway stands open behind you.
138 | #narration | go.door_library_garden_room.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the library and the garden room.
139 | #narration | go.door_library_great_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The library lets you go, and the great hall takes you. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.
140 | #narration | go.door_library_great_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the library and the great hall is not the one before you.
141 | #narration | go.door_library_great_stair_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the library, you come into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.
142 | #narration | go.door_library_great_stair_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the library into the great stair hall is not before you.
143 | #narration | go.door_long_gallery_back_stair_head.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the long gallery and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.
144 | #narration | go.door_long_gallery_back_stair_head.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the long gallery to the back stair head stands where you are looking.
145 | #narration | go.door_long_gallery_muniment_room.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The long gallery gives onto the muniment room, and you step through into it. Deeds and dust, and a silence kept on purpose. The doorway stands open behind you.
146 | #narration | go.door_long_gallery_muniment_room.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The long gallery does not open into the muniment room from here.
147 | #narration | go.door_master_bedchamber_stair_landing.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the master bedchamber into the stair landing. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.
148 | #narration | go.door_master_bedchamber_stair_landing.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the master bedchamber to the stair landing — lies elsewhere in the house.
149 | #narration | go.door_muniment_room_long_gallery.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the muniment room and into the long gallery. The gallery runs off further than a room has any right to, and your steps run off with it. The doorway stands open behind you.
150 | #narration | go.door_muniment_room_long_gallery.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the muniment room and the long gallery.
151 | #narration | go.door_muniment_room_solar.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The muniment room lets you go, and the solar takes you. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.
152 | #narration | go.door_muniment_room_solar.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the muniment room and the solar is not the one before you.
153 | #narration | go.door_privy_garden_garden_room.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the privy garden, you come into the garden room. The floor is flagged and cool, and the garden is a step away. The doorway stands open behind you.
154 | #narration | go.door_privy_garden_garden_room.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the privy garden into the garden room is not before you.
155 | #narration | go.door_privy_garden_great_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the privy garden and come into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.
156 | #narration | go.door_privy_garden_great_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the privy garden to the great hall stands where you are looking.
157 | #narration | go.door_privy_garden_servants_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The privy garden gives onto the servants' hall, and you step through into it. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.
158 | #narration | go.door_privy_garden_servants_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The privy garden does not open into the servants' hall from here.
159 | #narration | go.door_servants_hall_back_stair.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the servants' hall into the back stair. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.
160 | #narration | go.door_servants_hall_back_stair.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the servants' hall to the back stair — lies elsewhere in the house.
161 | #narration | go.door_servants_hall_buttery_pantry.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the servants' hall and into the buttery and pantry. Cool and close, and it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.
162 | #narration | go.door_servants_hall_buttery_pantry.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the servants' hall and the buttery and pantry.
163 | #narration | go.door_servants_hall_privy_garden.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The servants' hall lets you go, and the privy garden takes you. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.
164 | #narration | go.door_servants_hall_privy_garden.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the servants' hall and the privy garden is not the one before you.
165 | #narration | go.door_solar_back_stair_head.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the solar, you come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.
166 | #narration | go.door_solar_back_stair_head.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The way from the solar into the back stair head is not before you.
167 | #narration | go.door_solar_muniment_room.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the solar and come into the muniment room. Deeds and dust, and a silence kept on purpose. The doorway stands open behind you.
168 | #narration | go.door_solar_muniment_room.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | No passage from the solar to the muniment room stands where you are looking.
169 | #narration | go.door_solar_stair_landing.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The solar gives onto the stair landing, and you step through into it. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.
170 | #narration | go.door_solar_stair_landing.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The solar does not open into the stair landing from here.
171 | #narration | go.door_stair_landing_guest_chamber.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the stair landing into the guest chamber. Made ready and not lived in; nothing here has been disturbed. The doorway stands open behind you.
172 | #narration | go.door_stair_landing_guest_chamber.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | That way — the stair landing to the guest chamber — lies elsewhere in the house.
173 | #narration | go.door_stair_landing_master_bedchamber.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the stair landing and into the master bedchamber. The hush that sleeps in a room by day, and a floor that does not creak. The doorway stands open behind you.
174 | #narration | go.door_stair_landing_master_bedchamber.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | You are not at the passage between the stair landing and the master bedchamber.
175 | #narration | go.door_stair_landing_solar.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The stair landing lets you go, and the solar takes you. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.
176 | #narration | go.door_stair_landing_solar.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The door between the stair landing and the solar is not the one before you.
177 | #narration | go.stair_back_stair_back_stair_head.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You leave the back stair and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The stair falls away behind you.
178 | #narration | go.stair_back_stair_back_stair_head.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The stair from the back stair up to the back stair head is not before you.
179 | #narration | go.stair_back_stair_head_back_stair.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The back stair head gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The stair rises behind you.
180 | #narration | go.stair_back_stair_head_back_stair.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The stair from the back stair head down to the back stair is not before you.
181 | #narration | go.stair_great_stair_hall_stair_landing.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You pass from the great stair hall into the stair landing. The stair-head, and the house below sounding faintly up the well. The stair falls away behind you.
182 | #narration | go.stair_great_stair_hall_stair_landing.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The stair from the great stair hall up to the stair landing is not before you.
183 | #narration | go.stair_stair_landing_great_stair_hall.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | You cross out of the stair landing and into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The stair rises behind you.
184 | #narration | go.stair_stair_landing_great_stair_hall.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The stair from the stair landing down to the great stair hall is not before you.
185 | #narration | go.way_entrance_approach_entrance_court.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | The entrance approach lets you go, and the entrance court takes you. The air moves here, and the house stands back from you on every side but one. The court mouth stands open behind you.
186 | #narration | go.way_entrance_approach_entrance_court.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The mouth of the court between the entrance approach and the entrance court is not before you.
187 | #narration | go.way_entrance_court_entrance_approach.arrive (the manor's arrival prose, painted navigation world) | PASS | yes | row15-manor | Out of the entrance court, you come into the entrance approach. The gravel runs away south, and the house stands off at its own distance. The court mouth stands open behind you.
188 | #narration | go.way_entrance_court_entrance_approach.refused_unreachable (the manor's refusal prose, painted navigation world) | PASS | yes | row15-manor | The mouth of the court between the entrance court and the entrance approach is not before you.
189 | entity-control go-control aria-label | an exit UP a flight of stairs — the way through is the flight itself, and a control's accessible name is the shortest true name of what it does [row 15] | PASS | yes | row15-manor | climb the stair
190 | entity-control go-control aria-label | an exit DOWN a flight of stairs, which from the landing above is the same flight and not the same act | PASS | yes | row15-manor | go down the stair
191 | entity-control go-control aria-label | an exit across an OPEN THRESHOLD — the manor's court mouth, where no wall stands and there is nothing to walk through | PASS | yes | row15-manor | cross the threshold
192 | entity-control go-control aria-label | one of TWO unfilled doorways on the same wall, the left-hand one — four facings of the manor carry two, and neither has a leaf to be named after [row 15] | PASS | yes | row15-manor | walk through the doorway on the left
193 | entity-control go-control aria-label | the right-hand of two unfilled doorways on one wall | PASS | yes | row15-manor | walk through the doorway on the right
194 | #whereami aria-label | always | PASS | yes | kabe-ask-2026-08-24 | where you stand
195 | #whereami separator | always | PASS | yes | kabe-ask-2026-08-24 | ·
196 | #whereami place | standing in back_stair, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | back_stair
197 | #whereami place | standing in back_stair_head, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | back_stair_head
198 | #whereami place | standing in buttery_pantry, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | buttery_pantry
199 | #whereami place | standing in closet_chamber, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | closet_chamber
200 | #whereami place | standing in dining_parlour, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | dining_parlour
201 | #whereami place | standing in entrance_approach, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | entrance_approach
202 | #whereami place | standing in entrance_court, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | entrance_court
203 | #whereami place | standing in garden_room, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | garden_room
204 | #whereami place | standing in great_hall, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | great_hall
205 | #whereami place | standing in great_stair_hall, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | great_stair_hall
206 | #whereami place | standing in guest_chamber, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | guest_chamber
207 | #whereami place | standing in hall, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | hall
208 | #whereami place | standing in kitchen, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | kitchen
209 | #whereami place | standing in library, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | library
210 | #whereami place | standing in long_gallery, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | long_gallery
211 | #whereami place | standing in master_bedchamber, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | master_bedchamber
212 | #whereami place | standing in muniment_room, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | muniment_room
213 | #whereami place | standing in privy_garden, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | privy_garden
214 | #whereami place | standing in servants_hall, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | servants_hall
215 | #whereami place | standing in solar, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | solar
216 | #whereami place | standing in stair_landing, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | stair_landing
217 | #whereami place | standing in study, in any world that holds it | PASS | yes | kabe-ask-2026-08-24 | study
218 | #whereami facing | standing on any facing whose aspect is N | PASS | yes | kabe-ask-2026-08-24 | N
219 | #whereami facing | standing on any facing whose aspect is E | PASS | yes | kabe-ask-2026-08-24 | E
220 | #whereami facing | standing on any facing whose aspect is S | PASS | yes | kabe-ask-2026-08-24 | S
221 | #whereami facing | standing on any facing whose aspect is W | PASS | yes | kabe-ask-2026-08-24 | W
222 | #narration | toggle.leaf_op22.open (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The plank door swings back on its straps, and the muniment room's dry paper smell reaches the solar.
223 | #narration | toggle.leaf_op22.closed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | You pull the plank door to. The iron ring settles against the boards and the room beyond is shut away.
224 | #narration | toggle.leaf_op22.refused_unreachable (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The door between the solar and the muniment room is not the door in front of you.
225 | #narration | take.leaf_op22.refused_fixed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The door is hung on strap hinges older than you; it goes nowhere but back and forth.
226 | #narration | go.door_solar_muniment_room.refused_closed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The plank door is shut against the muniment room. It would open, if you laid a hand on it.
227 | #narration | go.door_muniment_room_solar.refused_closed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The plank door is shut against the solar. It would open, if you laid a hand on it.
228 | #narration | toggle.casement_win10.open (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The leaded casement swings inward and the kitchen takes a breath of outside air.
229 | #narration | toggle.casement_win10.closed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | You draw the casement to and drop the latch. The quarries hold the light in their lead again.
230 | #narration | toggle.casement_win10.refused_unreachable (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | That window is in the kitchen, and you are not looking at it.
231 | #narration | take.casement_win10.refused_fixed (the placed leaf and casement, painted navigation world) | PASS | yes | row42-leaves | The casement is hung in its own stone light and will not come away from it.
232 | inventory tile name | leaf_op22 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | oak plank door
233 | inventory tile name | casement_win10 held — not takeable on the shipped tree | PASS | no | not on a surface — enumerated only | leaded casement
```

```COUNT
STRINGS 233
STATES 36
```

**Enumerated is not swept.** `COUNT` is the authority for how many rows there are; seven of them
(#17–21, and row 42's #232–233) reach no surface on the shipped tree, so any report cites *enumerated*
and *swept* separately rather than letting one number stand for both. The two figures are read off the fenced
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
index.html | setAttribute aria-label | composed
src/inventory.js | title | composed
src/inventory.js | setAttribute aria-label | composed
```

Sites are named by the identity the census detects — `file :: write`, matched in **both**
directions, so a new sink and a deleted row are each red. Three more surfaces are literals in
`index.html` rather than write sites and are enumerated in `STRINGS` instead: the `<title>`, the
six `aria-label` attributes (rows 8–10 make the scene canvas's `role="img" aria-label` the fifth,
alongside the two chevrons, `#narration` and `#inventory`, and the standing readout's *where you
stand* (#194) is the sixth — the fullscreen button's own literal
`aria-label` is not one of them: it is unconditionally overwritten by `syncFullscreenUI()` before
the page is ever observed, so its two live values are `index.html`'s new composed site, not a
literal one), the standing readout's separator mark (#195, a literal text node between its two
composed halves), and the `<noscript>` body. `src/renderer.js`'s `GLYPHS` table is guarded by its own equality
check against #22–25.

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
- `updateWhereami(viewstate)` — the standing readout's two halves share `index.html`'s
  `textContent` site with `appendNarration`. There is no degenerate value to dispose, because the
  site writes nothing it has not first found in the world: a viewstate naming a location the
  document lacks, or an aspect that location lacks, writes the empty string to both halves and
  hides the element. Absent, empty and non-string `location`/`facing` all fail that same lookup and
  take the same branch. Over-long: one line, `white-space: nowrap` with `text-overflow: ellipsis`
  and a `max-width` inside the stage, so a long id is clipped rather than reflowing the corner.
- `index.html`'s `setAttribute aria-label` (row 8–10, the fullscreen button and every entity/
  go-control): the fullscreen button's two values are fixed literals, degenerate only if the
  `syncFullscreenUI()` call site itself is ever deleted, which is a code defect the sink census
  guards independent of any data. The entity/go-control labels are composed from a bound record's
  `noun`; absent, empty, or non-string falls back to `something here` (#79) with the sprite id and
  entity id on `console.error` — the same disposal shape `inventory.js`'s own missing-noun branch
  already uses, applied to this new sink. Over-long: not rendered as visible text (the control is
  never seen), so length is not a surface concern, matching the inventory tile's own reasoning.

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
index.html | boot witness | holo-emitter — fixture bake fp <fp> / truth: fixtures/<the world booted>/*.json / after editing a fixture, re-bake: node tools/bake-fixtures.mjs [--fixture-dir fixtures/<the world booted>]
index.html | inventory fault: <detail>
index.html | boot fault: <detail>
index.html | render fault: <detail>
index.html | BOOT ERROR: viewstate <json> names no location/facing in world.json — every turn will be refused. Fix fixtures/demo-study/viewstate.json and run: node tools/bake-fixtures.mjs
index.html | BOOT ERROR: no baked world "<id>" — the page carries <list>. Bake it with: node tools/bake-fixtures.mjs --fixture-dir fixtures/<id>
index.html | BACKDROP ERROR: the baked painting for <facing> did not decode — that facing falls back to the grid. Re-run: node tools/bake-backdrops.mjs
index.html | SPRITE ERROR: the baked sprite <id> did not decode — it will draw as nothing. Re-run: node tools/bake-library.mjs
index.html | entity control: record has no usable noun: <sprite> (entity <id>)
index.html | entity-controls fault: <detail>
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
- | the fault register | After this row every fault surface is in-fiction and unactionable by design, so a stranger cannot tell a broken deploy from an intended mood. Taste, and it may not be settled by the hand that authored the register.
- | the storefront's silence | A healthy cold load now shows a picture and no words at all. This row did not create it — before the sweep the only words were developer speech — and Kabe allocated row 9 for the intro himself, sequenced after row 4. Remedies: move row 9 ahead of rows 3–4; allocate a small row for one line of arrival prose now; or accept the silence until row 9 lands.
- | the picture's size | Deleting the status band drops the chrome reserve 8.8rem to 7.6rem, so the picture is larger on every height-bound viewport. A look change in a row sequenced before the presentation row.
- | the voice specification | The positively-stated register above binds later chrome rows and is [AI] derived from [AI] prose. Advisory until ratified.
- | the facing glyph | Kept, and argued from the product. But on a bare facing in grid mode the product's entire answer to `turn` is a changed letter on a wall — the diagram quality in its purest form, and what a stranger meets today. Row 4's assets are the fix; recorded so it is not mistaken for a decision nobody looked at.
- | the pane's log form | The narration pane accumulates, so a player who has acted five times reads a transcript stacked under the picture. That is a readout, and it touches the second quality. Chrome form rather than a string, so outside this row's domain — recorded with an owner rather than deferred to a call after the close.
- | what the deploy serves | Pages serves `main` root, so the design documents AND `index.html`/`src/*.js` — whose comments carry the most method vocabulary of anything published — are readable at the public link, the source with a single keystroke. Nothing on the page links to the documents; the source needs no link. The intention's "`design/` travels with the code" is [AI-predicted, marked "correct me"], so whether the boundary above is the right one is Kabe's.
- | the bottom chrome's alignment | The prose and the tiles sit flush at the window edge while the picture is centred, so at 1920x1080 the words hang 233px off the frame into the letterbox. Aligning them to the stage was tried and reverted: it costs a whole line of prose at 750x342, and the narration is the only thing here that speaks. Row 8 can move the reserve and have both. **Re-examined and re-declined at row 8** (not silently buried a second time): the row's own tradeoff — a full line of narration lost at phone landscape — is a taste call for Kabe, not a mechanics fix a presentation-only fullscreen row should fold in on its own judgement. Row 8 did, however, drop the reserve to zero under `html.fs-active` (fullscreen/maximized mode hides the bottom chrome entirely), which sidesteps the question there without answering it for the normal, non-fullscreen view. Still open.
- | the standing readout | Kabe asked for it in his own words, 2026-08-24: "I'd like a text overlay somewhere stating room identified and direction for my reference." It ships as a corner label over the picture, and it prints the document's own handles — `master_bedchamber · N`, underscores and all — because the reference value is in the id. Three things are his and are recorded rather than decided: whether a review instrument belongs on the product face at all once row 24 lands (it is chrome, so a capture never sees it, but a stranger at the public link does); whether the id or a spoken room name is what it should say; and how much of the wayfinding instrument is always on, which row 24's done clause already reserves to him. Until he rules, this is the first sliver of row 24 and nothing more.
- | control names, world vs machine | The inherited boundary does not decide row 8's first string: is `fullscreen` the shortest true name of what the button does, or is it a property of the visitor's window rather than of the world — the ground on which `Loading…` fails? Named here because two competent builders will otherwise ship different chrome. **Proposed resolution, row 8 (not a close — only the Navigator closes a line filed for Kabe):** the chevrons already establish that control names in this product are plain functional descriptions, not fiction ("turn left", not narrated prose), and "speech about the visitor's own device is not developer speech" already licenses naming a fact about the visitor's own window (the `LICENSED:device` ground for the no-JS message). Both together argue the button's name is a normal control name like any other. Row 8 also sidesteps the literal question by never using the word "fullscreen" in either string ("fill the screen" / "leave the full screen"), so the practical case ships either way this rules. Advisory until Kabe ratifies it, same standing as the voice specification below.
```

**Rows 8–10 may not cite the voice specification as authority until it is ratified.** It is [AI]
derived from [AI] prose; that is what "advisory" means, and a row citing it as settled would be the
provenance scar running forward.
