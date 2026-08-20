/* harness.js — intents -> document mutation -> envelope -> redraw (§8).
 *
 * Row 1 carries only `turn`. The harness owns viewstate at runtime; nothing
 * but dispatch() ever changes it, and nothing but the harness's subscriber
 * ever triggers a paint — there is no second, harness-bypassing view path.
 *
 * The turn ring: the fixed compass ring N->E->S->W governs; `turn right`
 * steps forward along it (N->E), `turn left` steps backward (N->W); a facing
 * absent from the location's `facings` list in world.json is skipped.
 *
 * Envelope for a valid turn (the §8 shape; `turn` is silent — no narration
 * field): { turn_id, intent, events: [{ type: "view", location, facing }] }.
 * The `view` event type is row-1 authorship [AI], revisable at row 2 when
 * world-mutating events arrive; it exists so a valid turn is distinguishable
 * from a refusal. Invalid intents append { turn_id, intent, events: [] } and
 * trigger no redraw — the picture never changes when the world doesn't.
 * Refusal narration is deferred to row 2 with §12.9 (no prose exists yet and
 * no UI-emittable refusal exists at row 1).
 *
 * The envelope format is the future websocket wire format; this module is
 * the stand-in for the Construct transport server and holds no renderer
 * internals.
 */
(function () {
  "use strict";

  var RING = ["N", "E", "S", "W"];

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

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

    function dispatch(intent) {
      turnId += 1;
      var envelope = { turn_id: turnId, intent: clone(intent), events: [] };
      if (intent && intent.type === "turn" &&
          (intent.dir === "left" || intent.dir === "right")) {
        var facing = nextFacing(intent.dir);
        if (facing !== null) {
          viewstate.facing = facing;
          envelope.events.push({
            type: "view",
            location: viewstate.location,
            facing: facing
          });
        }
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

  var api = { create: create };

  if (typeof window !== "undefined") {
    window.HOLO = window.HOLO || {};
    window.HOLO.harness = api;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
