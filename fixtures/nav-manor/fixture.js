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
  fp: "f318bf4d",
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
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 188.421,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.45,
    "key_tint": "#c8986f",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "R-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own prompt declares it as the measurement anchor",
    "calibration_px": 179,
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
    "corner_x0_px": 188,
    "corner_x1_px": 1351,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/study-N/cand-5-reference.png",
    "measured_round": "cand5ref",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 819.6,
    "nearest_floor_m": 1.9474,
    "measured_room": {
      "storey_height_m": 3.349,
      "wall_width_m": 6.172,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            565.4,
            980
          ],
          "plan_centre_px": 772.7,
          "painted_px": [
            379,
            550
          ],
          "painted_centre_px": 464.5,
          "centre_delta_px": -308.2,
          "centre_delta_m": -1.636,
          "painted_feature": "the fireplace OPENING (the plan holds the whole breast, which is wider)"
        }
      ]
    },
    "openings": []
  },
  "study/E": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op13",
        "via": "door1",
        "x": 918.2200488997555,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": 1.1
      }
    ]
  },
  "study/S": {
    "floor_line_y": 0.8210422585227273,
    "px_per_m_at_wall": 265.97402597402595,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 3.85,
    "openings": []
  },
  "study/W": {
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 192.632,
    "px_per_m_at_bottom": 432.01,
    "wall_width_m": 4.8,
    "key_tint": "#c89b72",
    "image_h_px": 1024,
    "horizon_y": 0.515332,
    "key_dir": "R-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own prompt declares it as the measurement anchor",
    "calibration_px": 183,
    "camera_wall_m": 4.09,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 186,
    "corner_x1_px": 1351,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/study-W/cand-6.png",
    "measured_round": "cand6",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 787.9,
    "nearest_floor_m": 1.8237,
    "measured_room": {
      "storey_height_m": 3.271,
      "wall_width_m": 6.048,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.8,
      "carriers": []
    },
    "openings": []
  },
  "hall/N": {
    "floor_line_y": 1.0640020893895348,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op15",
        "via": null,
        "x": 1482.4186046511627,
        "y": 136.9799999999999,
        "w": 476.279069767442,
        "h": 952.5581395348837,
        "beyond_m": 5.3,
        "beyond_offset_m": 0
      }
    ]
  },
  "hall/E": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": []
  },
  "hall/S": {
    "floor_line_y": 1.0640020893895348,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op14",
        "via": null,
        "x": 1720.5581395348836,
        "y": 136.9799999999999,
        "w": 476.2790697674418,
        "h": 952.5581395348837,
        "beyond_m": 9,
        "beyond_offset_m": 0
      }
    ]
  },
  "hall/W": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
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
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op13",
        "via": "door1",
        "x": 682.6666666666666,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 6.05,
        "beyond_offset_m": 1.1
      }
    ]
  }
}
};
