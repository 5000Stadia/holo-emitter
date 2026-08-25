# Row 25 — the stair a player can use, and the mouth that means what it draws

Ten pairs. Every frame in `before/` is drawn by `capture.mjs` from a `git archive` of
**6f578b1** — the commit this row opened against — and every frame in `after/` by the same script
from this row's own tree, so a pair is two pictures of one thing rather than two scripts'
opinions. Scene canvas alone, 1536 × 1024, cold `file://` load, Chromium, no chrome, no hover,
focus blurred; every facing reached by real intents through the harness.

**What changed and what did not, measured rather than claimed.** All 88 facings of the manor were
rendered from both trees and their pixels compared: **53 are byte-identical**, and the 35 that
moved are the twelve facings that draw a flight (the lighting) and twenty-three openings whose
composite carried an edge extension (the flat fill), one of them in the furnished demo world
(`study/E`). No other facing moved.

| frame | what to look at |
|---|---|
| `01-back_stair-E-flight-lit` | The flight was one flat `#4a5870` over every face. Its goings, risers and stringers now take the room's own key — the tone is the unlit end of the range, so nothing is darker than it was. |
| `02-great_stair_hall-W-across-the-run` | The facing the row measured **22.2 % of a frame in one value** on. Largest single value now under 7 %. |
| `03-stair_landing-S-descending` | The Captain's own report — "tapping stairs from upstairs doesnt go dow stairs". **0 % of this drawn staircase travelled on a click; 100 % does now.** |
| `04-back_stair_head-W-descending` | The other descending facing: 71.8 % → 100 %. |
| `05-great_stair_hall-S-flight-from-beside` | A flight drawn on a facing its exit is not stated on. Eight of the twelve were like this and answered no click at all; a click here now turns you to the stair and climbs it. |
| `06-hall-N-doorway-through` | 476 × 953 px of doorway that was **9.6 % room and 90 % one column of it stretched sideways** — the horizontal banding. The extension claims colour now and no structure. |
| `07-great_hall-N-zero-coverage-door` | A door whose destination frame does not reach the opening at all: the whole of it was one stretched pixel. |
| `08-entrance_court-S-mouth` | **The row's two open questions, both below.** A 3095 × 706 px mouth, 37.7 % of it real destination frame. Before: the rest is smeared sky and ground. After: flat bands of the destination's own edge colour. The smear invents detail nobody drew; the flat fill is honest and shows its seams at this size. Kabe's call. |
| `09-entrance_approach-N-mouth` | The manor's own front way in, from the other side. |
| `10-demo-study-E-door-open-through` | The furnished world, which this row touches in exactly one way: the composite through the study's own doorway. |

**Also true of the after side and not visible in a still:** both chevrons in the entrance court
turn the room again (they walked the player out of it over their whole area), while a doorway a
chevron partly covers is still walked; and every drawn pixel of every flight travels, at
1536 × 1200 and at 390 × 844, with real clicks measured at the extremes of the descending bodies.

## The two questions for Kabe, both on frame 08

The row's own text is answered and the suite holds it. What is left is a pair of judgements the
Builder may state but not settle, and both are readable on the SAME pair —
`08-entrance_court-S-mouth`, with `09-entrance_approach-N-mouth` as the same mouth from the other
side.

**1. The look, on a mouth this size.** On a doorway the flat fill is plainly the better picture —
`06-hall-N-doorway-through` stops reading as corduroy. On the court's 3095 × 706 mouth, where the
fill dwarfs the 37.7 % that is real destination frame, the flat bands show their own edges, and
the Builder's judgement is that they read no better than the smear did. Reversing it is a real
change rather than a constant: the eight flat fills are the mechanism, so the smear comes back
only by restoring the eight blits and dropping the case that refuses them.

**2. The sky walks you.** Measured on the shipped build, through the page's own `resolve()` at
1536 × 1200, every 2 px over the whole frame:

| facing | of the frame, answers "walk" | of that, above the horizon | so, of the whole frame |
|---|---|---|---|
| `entrance_court/S` | **69.3 %** | 74.4 % | **51.6 % is sky that walks you** |
| `entrance_approach/N` | 40.6 % | 88.9 % | 36.1 % |

**Both rows measure the same on the before tree, to the pixel**: this row did not widen the region by a
pixel and did not narrow it by one either. What it changed is what is DRAWN there. Inside the
court's mouth, above the destination's own horizon, 31.3 % is the approach's own painted sky and
the rest was a stretched pixel and is now the flat colour of the sky beside it.

So the row's clause — *no `go` region claims frame the picture draws nothing in* — is met, and
met by fixing the picture rather than by shrinking the claim: every pixel of that band is drawn
from the destination document. The open question is whether that is ENOUGH for a band this size.
A player looking out of the court at open sky and clicking it is walked to the approach. Two
readings, and only Kabe's is authoritative:

- **It is right.** The court's south side is a gateway with no wall above it; the sky in that
  opening IS the way out, the same way the ground in it is, and a click on any of it meaning
  "go out" is the building being honest about its own shape.
- **It is wrong.** A player does not read sky as a door. The region should stop at the
  destination's own horizon, which would cost the court 74.4 % of its walk area and hand it back
  to the pointer as nothing — and would put this row's own headline defect (a picture inviting a
  click it refuses) back at the front door in the other direction, since the sky above that line
  is still drawn as the room beyond.

The structural cure for both questions is the same and is not this row's: the composite looks
through the opening with the DESTINATION STANDPOINT'S camera rather than the opening's own axis,
which is why coverage collapses at all. Rows 35/36.
