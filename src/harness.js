/* harness.js — intents -> document mutation -> envelope -> redraw (§8).
 *
 * Row 2 carries the complete intent list: `turn`, `toggle`, `take`, `go`.
 * The harness owns viewstate at runtime; nothing but dispatch() ever changes
 * it, and nothing but the harness's subscriber ever triggers a paint — there
 * is no second, harness-bypassing view path.
 *
 * The turn ring (row 1, unchanged): the fixed compass ring N->E->S->W
 * governs; `turn right` steps forward along it (N->E), `turn left` steps
 * backward (N->W); a facing absent from the location's `facings` list in
 * world.json is skipped. A turn that would resolve to the current facing (a
 * one-facing location) is a refusal, never a no-op view event — and at row 2
 * a refused turn carries the `turn.*.refused` narration line. A valid turn
 * stays silent (no narration field).
 *
 * Validation precedence per intent (plan §4 — order is load-bearing: the
 * unknown check runs first so no refusal ever leaks the existence of an
 * unknown entity):
 *   toggle e: exists AND known? -> refused_unknown. has states? ->
 *     refused_static. staged (directly or via anchor_on host chain) on the
 *     current location/facing? -> refused_unreachable. else flip
 *     closed<->open -> outcome open/closed; an open that reveals unknown
 *     `in`-contents adds them to knowledge (knowledge_add events) -> outcome
 *     open_reveal.
 *   take e: exists AND known? -> refused_unknown. takeable? ->
 *     refused_fixed. already held_by player? -> refused_held. reachable this
 *     facing? -> refused_unreachable. contained (`in`) with host not open?
 *     -> refused_contained. else add ["held_by", e, "player"], remove its
 *     in/on relation -> outcome taken.
 *   go x: exit exists? -> refused_unknown. from/facing match viewstate? ->
 *     refused_unreachable. via-door open? -> refused_closed. else viewstate
 *     becomes to/arrive_facing -> outcome arrive.
 *
 * Envelope: { turn_id, intent, events: [...] } plus, for every
 * world-mutating success and every refusal, a `narration` string (valid
 * `turn` has none). Refusals carry events: [] and trigger no redraw — the
 * picture never changes when the world doesn't. Narration lookup: key
 * `${intent}.${target}.${outcome}`, falling back to `${intent}.*.${outcome}`;
 * a missing line shows the product-voiced fault line and puts the key on
 * console.error — never silently blank.
 *
 * enumerateNarrationDomain(world, staging) — exported beside create — is the
 * §12.9 emittable (intent x target x outcome) domain of a fixture, sharing
 * the vocabulary and predicates the dispatcher uses so the two cannot drift.
 * The validator imports it through the UMD guard.
 *
 * The envelope format is the future websocket wire format; this module is
 * the stand-in for the Construct transport server and holds no renderer
 * internals.
 */
(function () {
  "use strict";

  var RING = ["N", "E", "S", "W"];

  /* Product-voiced fault line for a missing narration key (the intention's
   * standing voice rule: the rendered surface speaks as the product; the
   * developer detail goes to the console). */
  var FAULT_LINE = "The pattern falters; the words do not come.";

  /* Outcome vocabulary — one home, shared by the dispatcher and the domain
   * enumeration so they cannot drift. */
  var OUTCOME = {
    OPEN: "open",
    CLOSED: "closed",
    OPEN_REVEAL: "open_reveal",
    TAKEN: "taken",
    ARRIVE: "arrive",
    REFUSED: "refused",
    REFUSED_UNKNOWN: "refused_unknown",
    REFUSED_STATIC: "refused_static",
    REFUSED_FIXED: "refused_fixed",
    REFUSED_HELD: "refused_held",
    REFUSED_UNREACHABLE: "refused_unreachable",
    REFUSED_CLOSED: "refused_closed",
    REFUSED_CONTAINED: "refused_contained"
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /* ----- shared predicates (dispatcher AND enumeration read these) ----- */

  function findEntity(world, id) {
    for (var i = 0; i < world.entities.length; i++) {
      if (world.entities[i].id === id) return world.entities[i];
    }
    return null;
  }

  function findExit(world, id) {
    for (var i = 0; i < world.locations.length; i++) {
      var exits = world.locations[i].exits || [];
      for (var j = 0; j < exits.length; j++) {
        if (exits[j].id === id) return exits[j];
      }
    }
    return null;
  }

  function hasStates(entity) {
    return !!(entity && entity.states && entity.states.length);
  }

  function isTakeable(entity) {
    return !!(entity && entity.takeable);
  }

  function isKnown(world, id) {
    return world.knowledge.player.indexOf(id) !== -1;
  }

  function heldByPlayer(world, id) {
    for (var i = 0; i < world.relations.length; i++) {
      var rel = world.relations[i];
      if (rel[0] === "held_by" && rel[1] === id && rel[2] === "player") return true;
    }
    return false;
  }

  /* Host of an `in` relation: ["in", id, host] -> host id, else null. */
  function inHostId(world, id) {
    for (var i = 0; i < world.relations.length; i++) {
      var rel = world.relations[i];
      if (rel[0] === "in" && rel[1] === id) return rel[2];
    }
    return null;
  }

  /* Contents ["in", c, id] with c outside knowledge.player — the reveal set. */
  function unknownContents(world, id) {
    var out = [];
    for (var i = 0; i < world.relations.length; i++) {
      var rel = world.relations[i];
      if (rel[0] === "in" && rel[2] === id && !isKnown(world, rel[1])) out.push(rel[1]);
    }
    return out;
  }

  /* Every "location/facing" key an entity is staged on — directly, via a
   * placement array (multi-facing, e.g. door1), or via its anchor_on host
   * chain (an anchored child stands wherever its host stands). */
  function stagedKeys(id, staging, seen) {
    seen = seen || {};
    if (seen[id]) return [];
    seen[id] = true;
    var placement = staging.placements[id];
    if (!placement) return [];
    var list = Array.isArray(placement) ? placement : [placement];
    var keys = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p.facing) {
        keys.push(p.facing);
      } else if (p.anchor_on) {
        var hostKeys = stagedKeys(p.anchor_on.split(".")[0], staging, seen);
        for (var j = 0; j < hostKeys.length; j++) keys.push(hostKeys[j]);
      }
    }
    return keys;
  }

  /* Every "location/facing" key a player can stand at in this world. */
  function allFacingKeys(world) {
    var keys = [];
    for (var i = 0; i < world.locations.length; i++) {
      var loc = world.locations[i];
      for (var j = 0; j < loc.facings.length; j++) {
        keys.push(loc.id + "/" + loc.facings[j]);
      }
    }
    return keys;
  }

  /* Narration lookup: specific key, wildcard fallback, product-voiced fault
   * line + console.error when neither exists — never silently blank. */
  function narrationLine(narration, type, target, outcome) {
    var lines = (narration && narration.lines) || {};
    var specific = type + "." + target + "." + outcome;
    if (Object.prototype.hasOwnProperty.call(lines, specific)) return lines[specific];
    var wildcard = type + ".*." + outcome;
    if (Object.prototype.hasOwnProperty.call(lines, wildcard)) return lines[wildcard];
    console.error("missing narration: " + specific);
    return FAULT_LINE;
  }

  /* ----- the harness ----- */

  function create(fixture) {
    var world = clone(fixture.world);
    var staging = clone(fixture.staging);
    var narration = clone(fixture.narration);
    var viewstate = clone(fixture.viewstate);
    var envelopes = [];
    var subscriber = null;
    var turnId = 0;

    function location() {
      for (var i = 0; i < world.locations.length; i++) {
        if (world.locations[i].id === viewstate.location) return world.locations[i];
      }
      return null;
    }

    function nextFacing(dir) {
      var loc = location();
      if (!loc) return null;
      var step = dir === "right" ? 1 : -1;
      var idx = RING.indexOf(viewstate.facing);
      // n stops before a full loop: a turn that would resolve to the current
      // facing (a one-facing location) is a refusal, not a no-op view event.
      for (var n = 1; n < RING.length; n++) {
        var candidate = RING[(idx + step * n + RING.length * n) % RING.length];
        if (loc.facings.indexOf(candidate) !== -1) return candidate;
      }
      return null;
    }

    /* Staged on the current location/facing, directly or via host chain —
     * and every host in that chain KNOWN. The renderer reaches an anchored
     * child only through its host, so an unknown host means the child was
     * never drawn; without the same filter here the harness happily took a
     * notebook off a desk the player had never been shown, emitting a
     * success envelope and an inventory tile for something that had never
     * been on screen. `stagedKeys` itself stays knowledge-blind because the
     * §12.9 enumeration is about what a fixture can emit, not about what one
     * player currently knows. */
    function chainKnown(id, seen) {
      seen = seen || {};
      if (seen[id]) return true;
      seen[id] = true;
      if (!isKnown(world, id)) return false;
      var placement = staging.placements[id];
      if (!placement) return true;
      var list = Array.isArray(placement) ? placement : [placement];
      for (var i = 0; i < list.length; i++) {
        if (list[i].anchor_on &&
            !chainKnown(list[i].anchor_on.split(".")[0], seen)) return false;
      }
      return true;
    }

    function reachable(id) {
      var key = viewstate.location + "/" + viewstate.facing;
      if (!chainKnown(id)) return false;
      return stagedKeys(id, staging).indexOf(key) !== -1;
    }

    function refuse(envelope, type, target, outcome) {
      envelope.narration = narrationLine(narration, type, target, outcome);
    }

    /* A frame this transport cannot read at all — an unknown intent type, a
     * missing field, a malformed `turn`. §8's rule is that an invalid intent
     * emits no events AND a refusal line, so it never returns a silent
     * envelope; the line is the product-voiced fault line (the wire, not the
     * world, is what failed, so it is not a fixture-authored refusal and it
     * is outside the §12.9 domain) and the detail goes to the console.
     * Reached over the wire from Construct later; reached from the shipped
     * UI never — every affordance builds a well-formed intent. */
    function malformed(envelope, detail) {
      console.error("unreadable intent: " + detail);
      envelope.narration = FAULT_LINE;
    }

    function handleTurn(intent, envelope) {
      if (intent.dir !== "left" && intent.dir !== "right") {
        return malformed(envelope, "turn dir \"" + intent.dir + "\"");
      }
      var facing = nextFacing(intent.dir);
      if (facing !== null) {
        viewstate.facing = facing;
        envelope.events.push({
          type: "view",
          location: viewstate.location,
          facing: facing
        });
      } else {
        refuse(envelope, "turn", "*", OUTCOME.REFUSED);
      }
    }

    function handleToggle(intent, envelope) {
      var id = intent.entity;
      var entity = findEntity(world, id);
      if (!entity || !isKnown(world, id)) {
        return refuse(envelope, "toggle", id, OUTCOME.REFUSED_UNKNOWN);
      }
      if (!hasStates(entity)) {
        return refuse(envelope, "toggle", id, OUTCOME.REFUSED_STATIC);
      }
      if (!reachable(id)) {
        return refuse(envelope, "toggle", id, OUTCOME.REFUSED_UNREACHABLE);
      }
      /* Step along the entity's OWN declared `states` (§3), never a
       * hardcoded closed/open flip: an entity declaring other state names
       * was previously written a state absent from its own list, silently.
       * M0 pins two-state closed/open everywhere (the §7 swap rule reads
       * "closed" as the body image and the outcome vocabulary is named for
       * them) and the fixture validator enforces that pin — this walk is
       * what keeps truth and the declaration in step regardless. */
      var idx = entity.states.indexOf(entity.state);
      if (idx === -1) {
        return refuse(envelope, "toggle", id, OUTCOME.REFUSED_STATIC);
      }
      var to = entity.states[(idx + 1) % entity.states.length];
      entity.state = to;
      envelope.events.push({ type: "state", entity: id, to: to });
      var outcome = to === "open" ? OUTCOME.OPEN : OUTCOME.CLOSED;
      if (to === "open") {
        var revealed = unknownContents(world, id);
        for (var i = 0; i < revealed.length; i++) {
          world.knowledge.player.push(revealed[i]);
          envelope.events.push({ type: "knowledge_add", entity: revealed[i] });
        }
        if (revealed.length > 0) outcome = OUTCOME.OPEN_REVEAL;
      }
      envelope.narration = narrationLine(narration, "toggle", id, outcome);
    }

    function handleTake(intent, envelope) {
      var id = intent.entity;
      var entity = findEntity(world, id);
      if (!entity || !isKnown(world, id)) {
        return refuse(envelope, "take", id, OUTCOME.REFUSED_UNKNOWN);
      }
      if (!isTakeable(entity)) {
        return refuse(envelope, "take", id, OUTCOME.REFUSED_FIXED);
      }
      if (heldByPlayer(world, id)) {
        return refuse(envelope, "take", id, OUTCOME.REFUSED_HELD);
      }
      if (!reachable(id)) {
        return refuse(envelope, "take", id, OUTCOME.REFUSED_UNREACHABLE);
      }
      var hostId = inHostId(world, id);
      if (hostId !== null) {
        var host = findEntity(world, hostId);
        if (!host || host.state !== "open") {
          return refuse(envelope, "take", id, OUTCOME.REFUSED_CONTAINED);
        }
      }
      var added = ["held_by", id, "player"];
      world.relations.push(added);
      envelope.events.push({ type: "relation_add", rel: clone(added) });
      for (var i = 0; i < world.relations.length; i++) {
        var rel = world.relations[i];
        if ((rel[0] === "in" || rel[0] === "on") && rel[1] === id) {
          world.relations.splice(i, 1);
          envelope.events.push({ type: "relation_remove", rel: clone(rel) });
          break;
        }
      }
      envelope.narration = narrationLine(narration, "take", id, OUTCOME.TAKEN);
    }

    function handleGo(intent, envelope) {
      var id = intent.exit;
      var exit = findExit(world, id);
      if (!exit) {
        return refuse(envelope, "go", id, OUTCOME.REFUSED_UNKNOWN);
      }
      if (exit.from !== viewstate.location || exit.facing !== viewstate.facing) {
        return refuse(envelope, "go", id, OUTCOME.REFUSED_UNREACHABLE);
      }
      var door = findEntity(world, exit.via);
      if (!door || door.state !== "open") {
        return refuse(envelope, "go", id, OUTCOME.REFUSED_CLOSED);
      }
      viewstate.location = exit.to;
      viewstate.facing = exit.arrive_facing;
      envelope.events.push({
        type: "view",
        location: viewstate.location,
        facing: viewstate.facing
      });
      envelope.narration = narrationLine(narration, "go", id, OUTCOME.ARRIVE);
    }

    function dispatch(intent) {
      turnId += 1;
      var envelope = { turn_id: turnId, intent: clone(intent), events: [] };
      if (!intent || typeof intent !== "object") {
        malformed(envelope, "not an intent object");
      } else if (intent.type === "turn") {
        handleTurn(intent, envelope);
      } else if (intent.type === "toggle") {
        if (typeof intent.entity !== "string") malformed(envelope, "toggle without an entity");
        else handleToggle(intent, envelope);
      } else if (intent.type === "take") {
        if (typeof intent.entity !== "string") malformed(envelope, "take without an entity");
        else handleTake(intent, envelope);
      } else if (intent.type === "go") {
        if (typeof intent.exit !== "string") malformed(envelope, "go without an exit");
        else handleGo(intent, envelope);
      } else {
        malformed(envelope, "unknown intent type \"" + intent.type + "\"");
      }
      envelopes.push(envelope);
      if (envelope.events.length > 0 && subscriber) subscriber(clone(viewstate));
      return envelope;
    }

    /* The boot paint: invoke the subscriber once with the current viewstate.
     * No envelope — nothing was intended, nothing changed — so the journal's
     * length equals the input-event count exactly. */
    function redraw() {
      if (subscriber) subscriber(clone(viewstate));
    }

    return {
      world: world,
      staging: staging,
      narration: narration,
      get viewstate() { return clone(viewstate); },
      envelopes: envelopes,
      subscribe: function (fn) { subscriber = fn; },
      dispatch: dispatch,
      redraw: redraw
    };
  }

  /* ----- §12.9 emittable domain (plan §4/§5) ----- */

  /* The (intent x target x outcome) domain the dispatcher can emit on this
   * fixture, as sorted narration keys. Built from the same predicates the
   * dispatcher validates through, so enumeration and dispatch cannot drift.
   * `turn.*.refused` joins only when some location has fewer than 2 facings
   * (elsewhere it is an authoring duty, checked separately by the validator);
   * the three per-intent `refused_unknown` wildcards are always members — a
   * bogus id is always dispatchable. */
  function enumerateNarrationDomain(world, staging) {
    var keys = [];
    var standpoints = allFacingKeys(world);

    /* An off-facing dispatch exists iff the player can stand somewhere the
     * entity is not staged (multi-facing worlds always allow one). */
    function offFacingExists(id) {
      var staged = stagedKeys(id, staging);
      for (var i = 0; i < standpoints.length; i++) {
        if (staged.indexOf(standpoints[i]) === -1) return true;
      }
      return false;
    }

    for (var i = 0; i < world.entities.length; i++) {
      var e = world.entities[i];
      if (hasStates(e)) {
        keys.push("toggle." + e.id + "." + OUTCOME.OPEN);
        keys.push("toggle." + e.id + "." + OUTCOME.CLOSED);
        if (offFacingExists(e.id)) {
          keys.push("toggle." + e.id + "." + OUTCOME.REFUSED_UNREACHABLE);
        }
        if (unknownContents(world, e.id).length > 0) {
          keys.push("toggle." + e.id + "." + OUTCOME.OPEN_REVEAL);
        }
      } else {
        keys.push("toggle." + e.id + "." + OUTCOME.REFUSED_STATIC);
      }
      if (isTakeable(e)) {
        keys.push("take." + e.id + "." + OUTCOME.TAKEN);
        keys.push("take." + e.id + "." + OUTCOME.REFUSED_HELD);
        if (offFacingExists(e.id)) {
          keys.push("take." + e.id + "." + OUTCOME.REFUSED_UNREACHABLE);
        }
        var hostId = inHostId(world, e.id);
        if (hostId !== null && hasStates(findEntity(world, hostId))) {
          keys.push("take." + e.id + "." + OUTCOME.REFUSED_CONTAINED);
        }
      } else {
        keys.push("take." + e.id + "." + OUTCOME.REFUSED_FIXED);
      }
    }

    for (var l = 0; l < world.locations.length; l++) {
      var exits = world.locations[l].exits || [];
      for (var x = 0; x < exits.length; x++) {
        var exit = exits[x];
        keys.push("go." + exit.id + "." + OUTCOME.ARRIVE);
        keys.push("go." + exit.id + "." + OUTCOME.REFUSED_CLOSED);
        for (var s = 0; s < standpoints.length; s++) {
          if (standpoints[s] !== exit.from + "/" + exit.facing) {
            keys.push("go." + exit.id + "." + OUTCOME.REFUSED_UNREACHABLE);
            break;
          }
        }
      }
    }

    keys.push("toggle.*." + OUTCOME.REFUSED_UNKNOWN);
    keys.push("take.*." + OUTCOME.REFUSED_UNKNOWN);
    keys.push("go.*." + OUTCOME.REFUSED_UNKNOWN);
    for (var t = 0; t < world.locations.length; t++) {
      if (world.locations[t].facings.length < 2) {
        keys.push("turn.*." + OUTCOME.REFUSED);
        break;
      }
    }

    return keys.sort();
  }

  var api = { create: create, enumerateNarrationDomain: enumerateNarrationDomain };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.harness = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
