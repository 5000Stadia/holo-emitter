// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/underground-2
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
window.HOLO_FIXTURES["underground-2"] = {
  id: "underground-2",
  fp: "d30d218b",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    {
      "id": "booking_hall",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_booking_hall_platform",
          "from": "booking_hall",
          "facing": "E",
          "to": "platform",
          "arrive_facing": "E",
          "via": "door01"
        }
      ]
    },
    {
      "id": "platform",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_platform_booking_hall",
          "from": "platform",
          "facing": "W",
          "to": "booking_hall",
          "arrive_facing": "W",
          "via": "door01"
        },
        {
          "id": "way_platform_platform_far",
          "from": "platform",
          "facing": "E",
          "to": "platform_far",
          "arrive_facing": "E",
          "via": "way01"
        }
      ]
    },
    {
      "id": "platform_far",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_platform_far_platform",
          "from": "platform_far",
          "facing": "W",
          "to": "platform",
          "arrive_facing": "W",
          "via": "way01"
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
    "go.door_booking_hall_platform.arrive": "You pass from the booking hall into the platform.",
    "go.door_booking_hall_platform.refused_unreachable": "The way from the booking hall to the platform is not before you from here.",
    "go.door_platform_booking_hall.arrive": "You pass from the platform into the booking hall.",
    "go.door_platform_booking_hall.refused_unreachable": "The way from the platform to the booking hall is not before you from here.",
    "go.way_platform_far_platform.arrive": "You walk back along the platform.",
    "go.way_platform_far_platform.refused_unreachable": "The way back along the platform is not before you from here.",
    "go.way_platform_platform_far.arrive": "You walk on down the platform.",
    "go.way_platform_platform_far.refused_unreachable": "The way on down the platform is not before you from here."
  }
},
  viewstate: {
  "location": "booking_hall",
  "facing": "N"
},
  metas: {
  "booking_hall/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "booking_hall/E": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 640,
        "y": 351.8066666666667,
        "w": 255.9999999999999,
        "h": 426.6666666666667,
        "beyond_m": 13,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  },
  "booking_hall/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "booking_hall/W": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform/E": {
    "floor_line_y": 0.61939453125,
    "px_per_m_at_wall": 91.42857142857143,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 91.42857142857143,
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
    "corner_x0_px": 475.4285714285714,
    "corner_x1_px": 1060.5714285714287,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [
      {
        "id": "way01",
        "kind": "threshold",
        "via": null,
        "x": 85.33333333333337,
        "y": 0,
        "w": 1365.333333333333,
        "h": 778.4733333333334,
        "beyond_m": 0,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "platform/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform/W": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 640,
        "y": 351.8066666666667,
        "w": 255.9999999999999,
        "h": 426.6666666666667,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      }
    ],
    "stairs": []
  },
  "platform_far/N": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform_far/E": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform_far/S": {
    "floor_line_y": 0.7602278645833334,
    "px_per_m_at_wall": 213.33333333333334,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
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
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "stairs": []
  },
  "platform_far/W": {
    "floor_line_y": 0.61939453125,
    "px_per_m_at_wall": 91.42857142857143,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 91.42857142857143,
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
    "corner_x0_px": 475.4285714285714,
    "corner_x1_px": 1060.5714285714287,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 713.1428571428571,
        "y": 451.4028571428571,
        "w": 109.71428571428567,
        "h": 182.85714285714286,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2
      },
      {
        "id": "way01",
        "kind": "threshold",
        "via": null,
        "x": 85.33333333333314,
        "y": 0,
        "w": 1365.333333333334,
        "h": 778.4733333333334,
        "beyond_m": 0,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  }
}
};
