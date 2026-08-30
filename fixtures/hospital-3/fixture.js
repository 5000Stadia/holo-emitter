// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/hospital-3
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
window.HOLO_FIXTURES["hospital-3"] = {
  id: "hospital-3",
  fp: "9e42e8dd",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    {
      "id": "reception",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_reception_treatment_room",
          "from": "reception",
          "facing": "E",
          "to": "treatment_room",
          "arrive_facing": "E",
          "via": "door01"
        }
      ]
    },
    {
      "id": "treatment_room",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_treatment_room_reception",
          "from": "treatment_room",
          "facing": "W",
          "to": "reception",
          "arrive_facing": "W",
          "via": "door01"
        },
        {
          "id": "door_treatment_room_ward",
          "from": "treatment_room",
          "facing": "E",
          "to": "ward",
          "arrive_facing": "E",
          "via": "door02"
        }
      ]
    },
    {
      "id": "ward",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_ward_treatment_room",
          "from": "ward",
          "facing": "W",
          "to": "treatment_room",
          "arrive_facing": "W",
          "via": "door02"
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
    "go.door_reception_treatment_room.arrive": "You pass from the reception into the treatment room.",
    "go.door_reception_treatment_room.refused_unreachable": "The way from the reception to the treatment room is not before you from here.",
    "go.door_treatment_room_reception.arrive": "You pass from the treatment room into the reception.",
    "go.door_treatment_room_reception.refused_unreachable": "The way from the treatment room to the reception is not before you from here.",
    "go.door_treatment_room_ward.arrive": "You pass from the treatment room into the ward.",
    "go.door_treatment_room_ward.refused_unreachable": "The way from the treatment room to the ward is not before you from here.",
    "go.door_ward_treatment_room.arrive": "You pass from the ward into the treatment room.",
    "go.door_ward_treatment_room.refused_unreachable": "The way from the ward to the treatment room is not before you from here."
  }
},
  viewstate: {
  "location": "reception",
  "facing": "N"
},
  metas: {
  "reception/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
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
    "corner_x0_px": 128,
    "corner_x1_px": 1408,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "reception/E": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 39.822222222222194,
    "corner_x1_px": 1496.177777777778,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 631.4666666666667,
        "y": 340.1871111111111,
        "w": 273.0666666666665,
        "h": 455.1111111111111,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  },
  "reception/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
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
    "corner_x0_px": 128,
    "corner_x1_px": 1408,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "reception/W": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 39.822222222222194,
    "corner_x1_px": 1496.177777777778,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [],
    "stairs": []
  },
  "treatment_room/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.2,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.2,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 213.33333333333326,
    "corner_x1_px": 1322.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "treatment_room/E": {
    "floor_line_y": 0.7628221628289473,
    "px_per_m_at_wall": 215.57894736842104,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 215.57894736842104,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 78.14736842105265,
    "corner_x1_px": 1457.8526315789472,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.75,
    "openings": [
      {
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 638.6526315789474,
        "y": 349.972,
        "w": 258.69473684210504,
        "h": 431.1578947368421,
        "beyond_m": 7,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  },
  "treatment_room/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.2,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.2,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 213.33333333333326,
    "corner_x1_px": 1322.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "treatment_room/W": {
    "floor_line_y": 0.7628221628289473,
    "px_per_m_at_wall": 215.57894736842104,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 215.57894736842104,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 78.14736842105265,
    "corner_x1_px": 1457.8526315789472,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.75,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 638.6526315789474,
        "y": 349.972,
        "w": 258.69473684210504,
        "h": 431.1578947368421,
        "beyond_m": 6.2,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  },
  "ward/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 42.66666666666663,
    "corner_x1_px": 1493.3333333333335,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "ward/E": {
    "floor_line_y": 0.7457303155637256,
    "px_per_m_at_wall": 200.78431372549022,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 200.78431372549022,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 125.49019607843127,
    "corner_x1_px": 1410.5098039215686,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.1,
    "openings": [],
    "stairs": []
  },
  "ward/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 213.33333333333334,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 42.66666666666663,
    "corner_x1_px": 1493.3333333333335,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "ward/W": {
    "floor_line_y": 0.7457303155637256,
    "px_per_m_at_wall": 200.78431372549022,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 200.78431372549022,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 125.49019607843127,
    "corner_x1_px": 1410.5098039215686,
    "focal_px": 1024,
    "storey_height_m": 3,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.1,
    "openings": [
      {
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 647.5294117647059,
        "y": 362.05921568627457,
        "w": 240.94117647058818,
        "h": 401.56862745098044,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  }
}
};
