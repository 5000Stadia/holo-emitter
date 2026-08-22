// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
//
// `metas` is DERIVED, not authored: the §5 backdrop meta of every facing the
// world names, projected from fixtures/demo-study/plan.json through
// tools/plan-projection.mjs (blueprint §4b). Its one home is the plan; edit
// the plan, re-bake. The page hands these to the renderer as backdrop entries
// carrying a meta and no image.
window.HOLO_FIXTURE = {
  fp: "d8bf9ed6",
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
      "u": 0.844036697248,
      "mirror": false
    },
    "chair1": {
      "facing": "study/N",
      "attachment": "floor_free",
      "u": 0.834495412844,
      "depth_m": 1.2
    },
    "door1": [
      {
        "facing": "study/E",
        "attachment": "wall_mounted",
        "u": 0.729166666667,
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
      "facing": "hall/E",
      "attachment": "floor_against",
      "u": 0.403846153846,
      "mirror": false
    },
    "stick1": {
      "facing": "hall/E",
      "attachment": "floor_free",
      "u": 0.461538461538,
      "depth_m": 0.5
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
    "go.door_study_hall.arrive": "You step through into the cross passage. The air is cooler here, and moves.",
    "go.door_hall_study.arrive": "You pass back into the study, where ink and oak dust close about you again.",
    "go.door_study_hall.refused_closed": "The door is shut against you; the latch has not been lifted.",
    "go.door_hall_study.refused_closed": "The way back stands barred; the door wants opening first.",
    "go.door_study_hall.refused_unreachable": "The way to the cross passage does not open from where you stand.",
    "go.door_hall_study.refused_unreachable": "The way to the study is not before you; you must come to it first.",
    "toggle.*.refused_unknown": "Nothing of that description offers itself to your hand.",
    "take.*.refused_unknown": "You reach, and your hand closes on nothing of the sort.",
    "go.*.refused_unknown": "No such passage is to be found; the walls keep their counsel.",
    "turn.*.refused": "The room offers no other aspect; you face all there is to face."
  }
},
  viewstate: { "location": "study", "facing": "N" },
  metas: {
  "study/N": {
    "floor_line_y": 0.7621668462643678,
    "px_per_m_at_wall": 235.40229885057474,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 235.40229885057474,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 126.52873563218384,
    "corner_x1_px": 1409.4712643678163,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 4.35
  },
  "study/E": {
    "floor_line_y": 0.7780629202322739,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 167.11980440097796,
    "corner_x1_px": 1368.880195599022,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 4.09
  },
  "study/S": {
    "floor_line_y": 0.7946418425324675,
    "px_per_m_at_wall": 265.97402597402595,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 265.97402597402595,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 43.220779220779264,
    "corner_x1_px": 1492.7792207792209,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 3.85
  },
  "study/W": {
    "floor_line_y": 0.7780629202322739,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 167.11980440097796,
    "corner_x1_px": 1368.880195599022,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 4.09
  },
  "hall/N": {
    "floor_line_y": 1.0180396075581395,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 476.27906976744185,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1137.1162790697674,
    "corner_x1_px": 2673.116279069767,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 2.15
  },
  "hall/E": {
    "floor_line_y": 0.6934010416666666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 2.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 546.1333333333333,
    "corner_x1_px": 989.8666666666667,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 6
  },
  "hall/S": {
    "floor_line_y": 1.0180396075581395,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 476.27906976744185,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1137.1162790697674,
    "corner_x1_px": 2673.116279069767,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 2.15
  },
  "hall/W": {
    "floor_line_y": 0.6934010416666666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 459.2967133992186,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.512109375,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 2.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 546.1333333333333,
    "corner_x1_px": 989.8666666666667,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.2294955964771814,
    "camera_wall_m": 6
  }
}
};
