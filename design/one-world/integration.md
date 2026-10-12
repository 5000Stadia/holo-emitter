# How a sibling project's module comes into holo-emitter (draft, 2026-10-12)

**Kabe, 2026-10-12**, on whether Photonic's people code may go into our public repo (R60):

> "For one I simply want what is the most elegant introduction. Eventually, all of these modules will likely combine to one system that has a shape that makes more sense than where we are at right now because we have so many arms that need deep Detailing and focus. That being said we run into this issue. To properly develop photonic, we need to run it in HE this may be a moment to consider how to both elegantly shape those projects to be able to be developed with a clean line while still being maximally integratable, and also with that type of posturing can improve the architecture and rule set that we have for what proper integration looks likefor effective future connectors turned integrated elements. That should be a discussion between U2 and the Answer should be the direction of your best form for implementation."

**My reading:**
- **The question is wider than R60.** It isn't only whether to commit Photonic's code. He wants one way in for every sibling project, which will end as one system:
  - Photonic now;
  - pattern-buffer and construct next;
  - connectors to come.
- **Each project develops on its own clean line and still runs live inside holo-emitter.** Photonic can't be properly developed except in our rooms.
- **The rules for integration are to be written down** and improved by this first case.
- **"U2"** means Photonic's agent and me, deciding together. The answer is our best form, built. Kabe doesn't pick between options.
- **What stays his:** publishing any module's code (it leaves his hands), and a reshaped milestone if this needs one.

**Where it stands:** I opened the discussion with Photonic (m157366), and a prior-art helper is reviewing how open projects do this. Two fresh outside opinions come before we settle, since the choice shapes every later module. The result replaces this draft.

**The opening draft sent to Photonic:**
1. **Host and module.** holo-emitter hosts the world. A module never imports from the host; everything comes through the `ctx` it is handed.
2. **One frame.** A shared conventions file both sides import: axes, units, floors, ids, time and frame budgets. No per-side coordinate glue.
3. **Live dev without vendoring.** Pages load modules through an import map. It points at a pinned commit in production, and at the module's own local checkout with `?dev=NAME`.
4. **Contract tests both ways.** Our host checks are a conformance suite that runs against a fake `ctx` in the module's repo. Its tests run against our real `ctx`.
5. **Capabilities, not internals.** A module declares the capabilities it needs (walk.route, walk.stand, place.roomAt, claims, budget).
6. **Public line.** Each module keeps its own repo, and our site serves only what is pinned and licensed. Publishing stays Kabe's call per module.

**Until settled:** Photonic's vendored copy stays untracked and off the site, as before.
