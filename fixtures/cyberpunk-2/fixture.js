// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/cyberpunk-2
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
window.HOLO_FIXTURES["cyberpunk-2"] = {
  id: "cyberpunk-2",
  fp: "9b46682c",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    {
      "id": "noodle_bar",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_noodle_bar_back_office",
          "from": "noodle_bar",
          "facing": "E",
          "to": "back_office",
          "arrive_facing": "E",
          "via": "door01"
        }
      ]
    },
    {
      "id": "back_office",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_back_office_noodle_bar",
          "from": "back_office",
          "facing": "W",
          "to": "noodle_bar",
          "arrive_facing": "W",
          "via": "door01"
        }
      ]
    }
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
    "toggle.*.refused_unknown": "Nothing here answers to that.",
    "take.*.refused_unknown": "There is nothing of the kind to take.",
    "go.*.refused_unknown": "No such way is to be found; the walls keep their counsel.",
    "turn.*.refused": "You cannot turn that way here.",
    "go.door_back_office_noodle_bar.arrive": "You pass from the back office into the noodle counter.",
    "go.door_back_office_noodle_bar.refused_unreachable": "The way to the noodle counter is not before you from here.",
    "go.door_noodle_bar_back_office.arrive": "You pass from the noodle counter into the back office.",
    "go.door_noodle_bar_back_office.refused_unreachable": "The way to the back office is not before you from here."
  }
},
  viewstate: {
  "location": "noodle_bar",
  "facing": "N"
},
  metas: {
  "noodle_bar/N": {
    "floor_line_y": 0.7954361979166666,
    "px_per_m_at_wall": 243.8095238095238,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 243.8095238095238,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 36.57142857142867,
    "corner_x1_px": 1499.4285714285713,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.2,
    "openings": [],
    "stairs": []
  },
  "noodle_bar/E": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 227.55555555555554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 130.84444444444455,
    "corner_x1_px": 1405.1555555555556,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 665.6000000000001,
        "y": 340.1871111111111,
        "w": 204.79999999999995,
        "h": 455.1111111111111,
        "beyond_m": 4.4,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "noodle_bar/S": {
    "floor_line_y": 0.7954361979166666,
    "px_per_m_at_wall": 243.8095238095238,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 243.8095238095238,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 36.57142857142867,
    "corner_x1_px": 1499.4285714285713,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.2,
    "openings": [],
    "stairs": []
  },
  "noodle_bar/W": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 227.55555555555554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 130.84444444444455,
    "corner_x1_px": 1405.1555555555556,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [],
    "stairs": []
  },
  "back_office/N": {
    "floor_line_y": 0.7954361979166666,
    "px_per_m_at_wall": 243.8095238095238,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.2,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 243.8095238095238,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.2,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 256,
    "corner_x1_px": 1280,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.2,
    "openings": [],
    "stairs": []
  },
  "back_office/E": {
    "floor_line_y": 0.8292361979166667,
    "px_per_m_at_wall": 273.06666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 273.06666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 3.413333333333412,
    "corner_x1_px": 1532.5866666666666,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.75,
    "openings": [],
    "stairs": []
  },
  "back_office/S": {
    "floor_line_y": 0.7954361979166666,
    "px_per_m_at_wall": 243.8095238095238,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.2,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 243.8095238095238,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.2,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 256,
    "corner_x1_px": 1280,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.2,
    "openings": [],
    "stairs": []
  },
  "back_office/W": {
    "floor_line_y": 0.8292361979166667,
    "px_per_m_at_wall": 273.06666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 273.06666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 3.413333333333412,
    "corner_x1_px": 1532.5866666666666,
    "focal_px": 1024,
    "storey_height_m": 3.2,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.75,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 645.1200000000001,
        "y": 303.00453333333337,
        "w": 245.76,
        "h": 546.1333333333333,
        "beyond_m": 6.2,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  }
}
};
