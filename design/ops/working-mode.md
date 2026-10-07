# Working mode: spend freely, plan ahead, wait rarely (2026-10-07)

How this project has run since Kabe said "Go ham" (with weekly usage at 23% and a reset at 4:00 the next day), and why. It is offered to colony as a general suggestion.

## The principle

The scarce resource is the person's attention, not tokens or compute. Waiting on the person costs the most. An agent sitting idle with nothing queued is close behind. Tokens spent on parallel, useful work cost the least, especially when unused allowance would expire.

## What it looks like

1. **Run in parallel, on purpose.** Up to seven helpers at once, each owning files no other helper touches.
   - Researchers read prior art, period sources, and the family's own repos.
   - Builders make the UI, the narrator engine, the relay, textures, background workers and the kinds.
   - A stronger-tier helper takes hard problems (the case's authoring, first-frame compiling), in its own worktree when it touches shared files.
   - Every result is reviewed (code run, screenshots looked at) before it's committed.
2. **Foresee the gates.** While planning an item, list the decisions it will need, and ask them all at once in the day's session, each with a default.
   - A skipped answer means the default. The person can approve "the creative choices" in one line.
   - That's how M7's premise, tone, portraits, model access and checks were settled without stopping work.
3. **Keep a day's approved queue.** There is always approved work to move to when a helper is out or a question is pending. Nobody waits idle on a helper.
4. **One daily session** (`design/daily/YYYY-MM-DD.md`). It holds what landed (with links), the time ledger, numbered decisions with defaults, the queue, and brainstorm prompts. The person spends a few minutes once a day. Unforeseen questions are the only interruptions.
5. **Measure it.** `tools/attention-ledger.mjs` reads the transcripts (helpers' too) and reports each day as working, waiting on the person, and idle.

## Today's numbers (2026-10-07, as of the evening)

| | |
|---|---|
| Working | 34% (5.1 h) |
| Waiting on Kabe | 1% (0.1 h) |
| Idle | 65% (9.6 h) |

Most of the idle time was overnight: the network dropped every helper several times, and turns ended on "waiting on helpers". Since the daily session and the queue began this afternoon, there have been 20 commits.

What landed:
- **M7:** the case, the fair-play check, questioning in code, the talk panel, the narrator engine, the relay with the OpenAI sign-in, and the case playing in the manor.
- **The outside:** textures made from their construction, the outside's textures in workers, and check 24.

## What still costs

- **Network drops** kill helpers mid-task. Resuming them works, but it should be automatic.
- **Shared files** (the manor page, `manor.js`) force sequencing, which is why I kept the page myself.
- **Machine load.** Seven helpers running browsers slow each other's timing measurements, so absolute timings from heavy days are only relative.
- **Commits.** A helper's commit can sweep up another's uncommitted edit (it happened once). Helpers commit only their own paths.
