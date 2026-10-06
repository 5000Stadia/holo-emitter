# Checks proposed, waiting for Kabe's vetting

None of these is in the test list yet. Each belongs to a kind or a part (plan §6). They join the tests only once Kabe has said yes.

| # | Belongs to | The check | Why |
|---|---|---|---|
| 1 | the catalogue | A malformed kind is refused at definition, with the reason: a bad name, an unknown field, a missing part, an unknown motion, or a need on an affordance it doesn't have. | A kind is data, often written by AI at authoring. A bad one should fail loudly, not build something wrong. Run by hand 2026-10-05: all five cases refused. |
| 2 | every kind with affordances | **Every movable works.** Build the kind, drive each affordance to its moved state and back. Check the mover moved, came home exactly, and that each process reaches its phase targets when the clock jumps. | Kabe, 2026-10-05: "every obvious functional thing to do something". This catches a part that declares a mover but never moves it. |
| 3 | every kind with affordances, placed in a room | **Open, it strikes nothing.** Each mover, at its moved state, stays clear of the walls and of other things. | Found by eye on 2026-10-05: the chest's open lid swung its hasps 2 cm into the wall behind. It was fixed by standing the chest a hand off the wall. |
| 4 | identity | **Ids agree everywhere.** Fixed birth addresses hash to fixed ids and seeds, checked against stored values on every browser the bench runs on. | Plan §3: the layout hash must match on the laptop and the phone, and ids are where that starts. |
| 5 | the works layer | **Gates and rules hold.** On a scripted stage:
- a locked door refuses until its key is held, then unlocks and opens in one act;
- a burning candle can't be taken;
- lighting 2 of 4 candles leaves the rule unfired, and the 3rd fires it: the variable is set, the door is unlocked and opened;
- reloading the store gives the same states. | Kabe, 2026-10-05: "a locked door shouldn't open until I have its key"; "Light 3 of these candles!" should just work. |
