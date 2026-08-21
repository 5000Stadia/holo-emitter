// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
window.HOLO_FIXTURE = {
  fp: "719c6ff6",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    { "id": "study", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_study_hall", "from": "study", "facing": "E",
                   "to": "hall", "arrive_facing": "E", "via": "door1" } ] },
    { "id": "hall", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_hall_study", "from": "hall", "facing": "W",
                   "to": "study", "arrive_facing": "W", "via": "door1" } ] }
  ],
  "entities": [
    { "id": "desk1",    "sprite": "desk-joined-oak-1660", "location": "study",
      "states": ["closed","open"], "state": "closed" },
    { "id": "key1",     "sprite": "key-iron",      "takeable": true },
    { "id": "note1",    "sprite": "notebook-vellum", "takeable": true },
    { "id": "chair1",   "sprite": "chair-joined",  "location": "study" },
    { "id": "door1",    "sprite": "door-plank",    "location": "study",
      "states": ["closed","open"], "state": "closed", "transition": true },
    { "id": "stick1",   "sprite": "candlestick-brass", "location": "hall" },
    { "id": "shelf1",   "sprite": "shelf-oak",     "location": "hall" },
    { "id": "coin1",    "sprite": "coin-silver",   "takeable": true }
  ],
  "relations": [
    ["in",  "key1",  "desk1"],
    ["on",  "note1", "desk1"],
    ["on",  "coin1", "shelf1"]
  ],
  "knowledge": {
    "player": ["desk1","note1","chair1","door1","stick1","shelf1","coin1"]
  }
},
  staging: {
  "schema": "holo-emitter-staging/0.1",
  "placements": {
    "desk1": {
      "facing": "study/N",
      "attachment": "floor_against",
      "u": 0.479,
      "mirror": false
    },
    "chair1": {
      "facing": "study/N",
      "attachment": "floor_free",
      "u": 0.5052,
      "depth_m": 1.2
    },
    "door1": [
      {
        "facing": "study/E",
        "attachment": "wall_mounted",
        "u": 0.5,
        "v": 0.0
      },
      {
        "facing": "hall/W",
        "attachment": "wall_mounted",
        "u": 0.5,
        "v": 0.0
      }
    ],
    "note1": {
      "anchor_on": "desk1.surface_top",
      "t": 0.35
    },
    "key1": {
      "anchor_on": "desk1.drawer_cavity",
      "t": 0.5
    },
    "shelf1": {
      "facing": "hall/N",
      "attachment": "floor_against",
      "u": 0.4475,
      "mirror": false
    },
    "stick1": {
      "facing": "hall/N",
      "attachment": "floor_free",
      "u": 0.4632,
      "depth_m": 0.75
    },
    "coin1": {
      "anchor_on": "shelf1.surface_top",
      "t": 0.6
    }
  }
},
  narration: {
  "schema": "holo-emitter-narration/0.1",
  "lines": {
    "toggle.desk1.open_reveal": "The drawer resists, then gives. Inside, an iron key.",
    "toggle.desk1.open": "The drawer slides out along its runners, easy with long use.",
    "toggle.desk1.closed": "You press the drawer home, and it seats with a soft knock of oak on oak.",
    "toggle.door1.open": "The iron ring turns, the latch lifts, and the plank door swings wide.",
    "toggle.door1.closed": "The door falls to, and the latch drops into its keeper.",
    "toggle.desk1.refused_unreachable": "The desk is beyond your reach from where you stand.",
    "toggle.door1.refused_unreachable": "The door will not answer from here; you must come before it.",
    "toggle.chair1.refused_static": "The chair is joined oak through and through; nothing in it opens or shuts.",
    "toggle.stick1.refused_static": "The candlestick is a single casting of brass; there is nothing in it to work.",
    "toggle.shelf1.refused_static": "The shelf is fixed boards, pegged fast; it keeps no hinge and no drawer.",
    "toggle.note1.refused_static": "The notebook has neither clasp nor lock; its leaves simply lie as they lie.",
    "toggle.coin1.refused_static": "The coin is one small disc of silver; it neither opens nor closes.",
    "toggle.key1.refused_static": "The key holds no working of its own; it is made for a lock, not to be one.",
    "take.key1.taken": "You take the iron key. It is cold, and lighter than it looks.",
    "take.note1.taken": "You lift the vellum notebook, and its leaves whisper as they settle.",
    "take.coin1.taken": "The silver coin comes away from the shelf board with a faint scrape.",
    "take.key1.refused_held": "The iron key is already in your keeping.",
    "take.note1.refused_held": "The notebook is with you already, safe among what you carry.",
    "take.coin1.refused_held": "The coin already rides with you; your fingers know its edge.",
    "take.key1.refused_unreachable": "The key is not within reach of your hand from here.",
    "take.note1.refused_unreachable": "The notebook lies too far off; you are not near enough to take it.",
    "take.coin1.refused_unreachable": "The coin is out of your reach; your arm does not stretch so far.",
    "take.key1.refused_contained": "The drawer is shut over the key; it must be opened again first.",
    "take.desk1.refused_fixed": "The desk is heavy joined oak, pegged at every corner; it will not be carried.",
    "take.chair1.refused_fixed": "The wainscot chair is a solid burden of oak; it keeps its place.",
    "take.door1.refused_fixed": "The door hangs on its iron hinges, and there it will hang.",
    "take.stick1.refused_fixed": "The brass candlestick is a great floor-piece, heavier than it has any right to be; it stays where it was set.",
    "take.shelf1.refused_fixed": "The bookshelf is a full press of oak against the wall; no strength of yours will shift it.",
    "go.door_study_hall.arrive": "You step through into the hall. The air is wider here, and cooler.",
    "go.door_hall_study.arrive": "You pass back into the study, where ink and oak dust close about you again.",
    "go.door_study_hall.refused_closed": "The door is shut against you; the latch has not been lifted.",
    "go.door_hall_study.refused_closed": "The way back stands barred; the door wants opening first.",
    "go.door_study_hall.refused_unreachable": "The way to the hall does not open from where you stand.",
    "go.door_hall_study.refused_unreachable": "The way to the study is not before you; you must come to it first.",
    "toggle.*.refused_unknown": "Nothing of that description offers itself to your hand.",
    "take.*.refused_unknown": "You reach, and your hand closes on nothing of the sort.",
    "go.*.refused_unknown": "No such passage is to be found; the walls keep their counsel.",
    "turn.*.refused": "The room offers no other aspect; you face all there is to face."
  }
},
  viewstate: { "location": "study", "facing": "N" }
};
