// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/nav-manor
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
//
// `metas` is DERIVED, not authored: the §5 backdrop meta of every facing the
// world names, projected from this fixture's plan (its own plan.json, or the
// one its plan.ref points at) through
// tools/plan-projection.mjs (blueprint §4b). Its one home is the plan; edit
// the plan, re-bake. The page hands these to the renderer as backdrop entries
// carrying a meta and no image.
window.HOLO_FIXTURES = window.HOLO_FIXTURES || {};
window.HOLO_FIXTURES["nav-manor"] = {
  id: "nav-manor",
  fp: "83e86980",
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
  "entities": [],
  "relations": [],
  "knowledge": {
    "player": []
  }
},
  staging: {
  "schema": "holo-emitter-staging/0.1",
  "placements": {}
},
  narration: {
  "schema": "holo-emitter-narration/0.1",
  "lines": {
    "go.door_study_hall.arrive": "You step through into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_hall_study.arrive": "You pass back into the study, where ink and oak dust close about you again. The doorway stands open behind you.",
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
    "floor_line_y": 0.758789,
    "px_per_m_at_wall": 232.222,
    "px_per_m_at_bottom": 459.3,
    "wall_width_m": 5.45,
    "key_tint": "#c89663",
    "image_h_px": 1024,
    "horizon_y": 0.512109,
    "key_dir": "L-BELOW",
    "calibration_ref": "the fireplace opening, inner stone jamb to inner stone jamb, taken at 0.90 m. Not a ruling but an inference, and the one the approved frame was blessed at: the brief's '~1.4 m' puts this room's storey at 4.66 m and is refuted by the picture.",
    "calibration_px": 209,
    "camera_wall_m": 4.35,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 142,
    "corner_x1_px": 1389,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/study-N/cand-2.png",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1010.2,
    "nearest_floor_m": 2.1994,
    "measured_room": {
      "storey_height_m": 2.997,
      "wall_width_m": 5.37,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            518.4,
            1029.2
          ],
          "plan_centre_px": 773.8,
          "painted_px": [
            341,
            550
          ],
          "painted_centre_px": 445.5,
          "centre_delta_px": -328.3,
          "centre_delta_m": -1.414,
          "painted_feature": "the fireplace OPENING (the plan holds the whole breast, which is wider)"
        }
      ]
    },
    "openings": []
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
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op13",
        "via": "door1",
        "x": 918.2200488997555,
        "y": 296.00293398533006,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": 1.1
      }
    ]
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
    "camera_wall_m": 3.85,
    "openings": []
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
    "camera_wall_m": 4.09,
    "openings": []
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
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op15",
        "via": null,
        "x": 1482.4186046511627,
        "y": 89.91441860465113,
        "w": 476.279069767442,
        "h": 952.5581395348837,
        "beyond_m": 5.3,
        "beyond_offset_m": 0
      }
    ]
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
    "camera_wall_m": 6,
    "openings": []
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
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op14",
        "via": null,
        "x": 1720.5581395348836,
        "y": 89.91441860465113,
        "w": 476.2790697674418,
        "h": 952.5581395348837,
        "beyond_m": 9,
        "beyond_offset_m": 0
      }
    ]
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
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op13",
        "via": "door1",
        "x": 682.6666666666666,
        "y": 368.7093333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 6.05,
        "beyond_offset_m": 1.1
      }
    ]
  }
}
};
