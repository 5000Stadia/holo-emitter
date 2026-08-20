// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
window.HOLO_FIXTURE = {
  fp: "cc2b9fe7",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    { "id": "study", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_study_hall", "from": "study", "facing": "E",
                   "to": "hall", "arrive_facing": "W", "via": "door1" } ] },
    { "id": "hall", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_hall_study", "from": "hall", "facing": "W",
                   "to": "study", "arrive_facing": "E", "via": "door1" } ] }
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
    "desk1":  { "facing": "study/N", "attachment": "floor_against", "u": 0.42, "mirror": false },
    "chair1": { "facing": "study/N", "attachment": "floor_free",    "u": 0.52, "depth_m": 1.2 },
    "door1":  [ { "facing": "study/E", "attachment": "wall_mounted", "u": 0.50, "v": 0.0 },
                { "facing": "hall/W",  "attachment": "wall_mounted", "u": 0.50, "v": 0.0 } ],
    "note1":  { "anchor_on": "desk1.surface_top", "t": 0.35 },
    "key1":   { "anchor_on": "desk1.drawer_cavity", "t": 0.5 },
    "shelf1": { "facing": "hall/N",  "attachment": "floor_against", "u": 0.30, "mirror": false },
    "stick1": { "facing": "hall/N",  "attachment": "floor_free", "u": 0.36, "depth_m": 0.9 },
    "coin1":  { "anchor_on": "shelf1.surface_top", "t": 0.6 }
  }
},
  narration: { "schema": "holo-emitter-narration/0.1", "lines": {} },
  viewstate: { "location": "study", "facing": "N" }
};
