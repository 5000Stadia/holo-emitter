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
  fp: "ea5aa639",
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8ab87",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 238,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/booking_hall-N/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "7991604bcb26",
    "camera_source": "declared",
    "declared_fields": [
      "horizon_y",
      "px_per_m_at_wall",
      "floor_line_y",
      "corner_x0_px",
      "corner_x1_px"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 952,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.449,
      "wall_width_m": 6.887,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "corner_right",
              0
            ]
          ],
          "row_px": [
            [
              "ceiling_line",
              0
            ],
            [
              "floor_line",
              0
            ]
          ]
        },
        "worst_segment": {
          "axis": "y",
          "name": "ceiling_line..floor_line",
          "scale": 1.106,
          "target_px": 725.3,
          "source_px": 656
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 198.333,
          "floor_line_y": 0.759766,
          "corner_x0_px": 85,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 213.438
        },
        "warped_from": "backdrops/source/booking_hall-N/row23-2f60265e.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": []
    },
    "openings": [],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "booking_hall/E": {
    "floor_line_y": 0.738281,
    "px_per_m_at_wall": 200.833,
    "px_per_m_at_bottom": 425.38,
    "wall_width_m": 6.4,
    "key_tint": "#c8a780",
    "image_h_px": 1024,
    "horizon_y": 0.504199,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 241,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 142,
    "corner_x1_px": 1392,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/booking_hall-E/row23-9828f287.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "7991604bcb26",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 964,
    "nearest_floor_m": 2.2662,
    "measured_room": {
      "storey_height_m": 3.296,
      "wall_width_m": 6.224,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            647.5,
            888.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            653,
            873
          ],
          "painted_centre_px": 763,
          "centre_delta_px": -5,
          "centre_delta_m": -0.025,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 642,
        "y": 339,
        "w": 240,
        "h": 417,
        "beyond_m": 13,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            655.5,
            339
          ],
          [
            660.49,
            339
          ],
          [
            665.48,
            339
          ],
          [
            670.47,
            339
          ],
          [
            675.46,
            339
          ],
          [
            680.46,
            339
          ],
          [
            685.45,
            339
          ],
          [
            690.44,
            339
          ],
          [
            695.43,
            339
          ],
          [
            700.43,
            339
          ],
          [
            705.42,
            339
          ],
          [
            710.41,
            339
          ],
          [
            715.4,
            339
          ],
          [
            720.39,
            339
          ],
          [
            725.39,
            339
          ],
          [
            730.38,
            339
          ],
          [
            735.37,
            339
          ],
          [
            740.36,
            339
          ],
          [
            745.36,
            339
          ],
          [
            750.35,
            339
          ],
          [
            755.34,
            339
          ],
          [
            760.33,
            339
          ],
          [
            765.32,
            339
          ],
          [
            770.32,
            339
          ],
          [
            775.31,
            339
          ],
          [
            780.3,
            339
          ],
          [
            785.29,
            339
          ],
          [
            790.29,
            339
          ],
          [
            795.28,
            339
          ],
          [
            800.27,
            339
          ],
          [
            805.26,
            339
          ],
          [
            810.25,
            339
          ],
          [
            815.25,
            339
          ],
          [
            820.24,
            339
          ],
          [
            825.23,
            339
          ],
          [
            830.22,
            339
          ],
          [
            835.21,
            339
          ],
          [
            840.21,
            339
          ],
          [
            845.2,
            339
          ],
          [
            850.19,
            339
          ],
          [
            855.18,
            339
          ],
          [
            860.18,
            339
          ],
          [
            865.17,
            339
          ],
          [
            870.16,
            339
          ],
          [
            882,
            339.15
          ],
          [
            882,
            344.14
          ],
          [
            880,
            349.14
          ],
          [
            873,
            354.13
          ],
          [
            873,
            359.12
          ],
          [
            873,
            364.11
          ],
          [
            873,
            369.11
          ],
          [
            873,
            374.1
          ],
          [
            873,
            379.09
          ],
          [
            873,
            384.08
          ],
          [
            873,
            389.07
          ],
          [
            873,
            394.07
          ],
          [
            873,
            399.06
          ],
          [
            873,
            404.05
          ],
          [
            873,
            409.04
          ],
          [
            873,
            414.04
          ],
          [
            873,
            419.03
          ],
          [
            873,
            424.02
          ],
          [
            873,
            429.01
          ],
          [
            873,
            434
          ],
          [
            873,
            439
          ],
          [
            873,
            443.99
          ],
          [
            873,
            448.98
          ],
          [
            873,
            453.97
          ],
          [
            873,
            458.96
          ],
          [
            873,
            463.96
          ],
          [
            873,
            468.95
          ],
          [
            873,
            473.94
          ],
          [
            873,
            478.93
          ],
          [
            873,
            483.93
          ],
          [
            873,
            488.92
          ],
          [
            873,
            493.91
          ],
          [
            873,
            498.9
          ],
          [
            873,
            503.89
          ],
          [
            873,
            508.89
          ],
          [
            873,
            513.88
          ],
          [
            873,
            518.87
          ],
          [
            873,
            523.86
          ],
          [
            873,
            528.86
          ],
          [
            873,
            533.85
          ],
          [
            873,
            538.84
          ],
          [
            873,
            543.83
          ],
          [
            873,
            548.82
          ],
          [
            873,
            553.82
          ],
          [
            873,
            558.81
          ],
          [
            873,
            563.8
          ],
          [
            873,
            568.79
          ],
          [
            873,
            573.79
          ],
          [
            873,
            578.78
          ],
          [
            873,
            583.77
          ],
          [
            873,
            588.76
          ],
          [
            873,
            593.75
          ],
          [
            873,
            598.75
          ],
          [
            873,
            603.74
          ],
          [
            873,
            608.73
          ],
          [
            873,
            613.72
          ],
          [
            873,
            618.71
          ],
          [
            873,
            623.71
          ],
          [
            873,
            628.7
          ],
          [
            873,
            633.69
          ],
          [
            873,
            638.68
          ],
          [
            873,
            643.68
          ],
          [
            873,
            648.67
          ],
          [
            873,
            653.66
          ],
          [
            873,
            658.65
          ],
          [
            873,
            663.64
          ],
          [
            873,
            668.64
          ],
          [
            873,
            673.63
          ],
          [
            873,
            678.62
          ],
          [
            873,
            683.61
          ],
          [
            873,
            688.61
          ],
          [
            873,
            693.6
          ],
          [
            873,
            698.59
          ],
          [
            873,
            703.58
          ],
          [
            873,
            708.57
          ],
          [
            873,
            713.57
          ],
          [
            873,
            718.56
          ],
          [
            878,
            723.55
          ],
          [
            879,
            728.54
          ],
          [
            879,
            733.54
          ],
          [
            873,
            738.53
          ],
          [
            873,
            743.52
          ],
          [
            873,
            748.51
          ],
          [
            873,
            753.5
          ],
          [
            870.5,
            756
          ],
          [
            865.51,
            756
          ],
          [
            860.52,
            756
          ],
          [
            855.53,
            756
          ],
          [
            850.54,
            756
          ],
          [
            845.54,
            756
          ],
          [
            840.55,
            756
          ],
          [
            835.56,
            756
          ],
          [
            830.57,
            756
          ],
          [
            825.57,
            756
          ],
          [
            820.58,
            756
          ],
          [
            815.59,
            756
          ],
          [
            810.6,
            756
          ],
          [
            805.61,
            756
          ],
          [
            800.61,
            756
          ],
          [
            795.62,
            756
          ],
          [
            790.63,
            756
          ],
          [
            785.64,
            756
          ],
          [
            780.64,
            756
          ],
          [
            775.65,
            756
          ],
          [
            770.66,
            756
          ],
          [
            765.67,
            756
          ],
          [
            760.68,
            756
          ],
          [
            755.68,
            756
          ],
          [
            750.69,
            756
          ],
          [
            745.7,
            756
          ],
          [
            740.71,
            756
          ],
          [
            735.71,
            756
          ],
          [
            730.72,
            756
          ],
          [
            725.73,
            756
          ],
          [
            720.74,
            756
          ],
          [
            715.75,
            756
          ],
          [
            710.75,
            756
          ],
          [
            705.76,
            756
          ],
          [
            700.77,
            756
          ],
          [
            695.78,
            756
          ],
          [
            690.79,
            756
          ],
          [
            685.79,
            756
          ],
          [
            680.8,
            756
          ],
          [
            675.81,
            756
          ],
          [
            670.82,
            756
          ],
          [
            665.82,
            756
          ],
          [
            660.83,
            756
          ],
          [
            655.84,
            756
          ],
          [
            652,
            753.85
          ],
          [
            652,
            748.86
          ],
          [
            652,
            743.86
          ],
          [
            646,
            738.87
          ],
          [
            646,
            733.88
          ],
          [
            646,
            728.89
          ],
          [
            646,
            723.89
          ],
          [
            653,
            718.9
          ],
          [
            653,
            713.91
          ],
          [
            653,
            708.92
          ],
          [
            653,
            703.93
          ],
          [
            653,
            698.93
          ],
          [
            653,
            693.94
          ],
          [
            653,
            688.95
          ],
          [
            653,
            683.96
          ],
          [
            653,
            678.96
          ],
          [
            653,
            673.97
          ],
          [
            653,
            668.98
          ],
          [
            653,
            663.99
          ],
          [
            653,
            659
          ],
          [
            653,
            654
          ],
          [
            653,
            649.01
          ],
          [
            653,
            644.02
          ],
          [
            653,
            639.03
          ],
          [
            653,
            634.04
          ],
          [
            653,
            629.04
          ],
          [
            653,
            624.05
          ],
          [
            653,
            619.06
          ],
          [
            653,
            614.07
          ],
          [
            653,
            609.07
          ],
          [
            653,
            604.08
          ],
          [
            653,
            599.09
          ],
          [
            653,
            594.1
          ],
          [
            653,
            589.11
          ],
          [
            653,
            584.11
          ],
          [
            653,
            579.12
          ],
          [
            653,
            574.13
          ],
          [
            653,
            569.14
          ],
          [
            653,
            564.14
          ],
          [
            653,
            559.15
          ],
          [
            653,
            554.16
          ],
          [
            653,
            549.17
          ],
          [
            653,
            544.18
          ],
          [
            653,
            539.18
          ],
          [
            653,
            534.19
          ],
          [
            653,
            529.2
          ],
          [
            653,
            524.21
          ],
          [
            653,
            519.21
          ],
          [
            653,
            514.22
          ],
          [
            653,
            509.23
          ],
          [
            653,
            504.24
          ],
          [
            653,
            499.25
          ],
          [
            653,
            494.25
          ],
          [
            653,
            489.26
          ],
          [
            653,
            484.27
          ],
          [
            653,
            479.28
          ],
          [
            653,
            474.29
          ],
          [
            653,
            469.29
          ],
          [
            653,
            464.3
          ],
          [
            653,
            459.31
          ],
          [
            653,
            454.32
          ],
          [
            653,
            449.32
          ],
          [
            653,
            444.33
          ],
          [
            653,
            439.34
          ],
          [
            653,
            434.35
          ],
          [
            653,
            429.36
          ],
          [
            653,
            424.36
          ],
          [
            653,
            419.37
          ],
          [
            653,
            414.38
          ],
          [
            653,
            409.39
          ],
          [
            653,
            404.39
          ],
          [
            653,
            399.4
          ],
          [
            653,
            394.41
          ],
          [
            653,
            389.42
          ],
          [
            653,
            384.43
          ],
          [
            653,
            379.43
          ],
          [
            653,
            374.44
          ],
          [
            653,
            369.45
          ],
          [
            643,
            364.46
          ],
          [
            643,
            359.46
          ],
          [
            643,
            354.47
          ],
          [
            643,
            349.48
          ],
          [
            643,
            344.49
          ],
          [
            642,
            339.5
          ]
        ],
        "corners": [
          [
            653,
            339
          ],
          [
            873,
            339
          ],
          [
            873,
            756
          ],
          [
            653,
            756
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.8943,
        "polygon_used": true
      }
    ],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "booking_hall/S": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8aa82",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 209,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/booking_hall-S/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "7991604bcb26",
    "camera_source": "declared",
    "declared_fields": [
      "horizon_y",
      "px_per_m_at_wall",
      "floor_line_y",
      "corner_x0_px",
      "corner_x1_px"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 836,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.68,
      "wall_width_m": 7.843,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "corner_right",
              0
            ]
          ],
          "row_px": [
            [
              "ceiling_line",
              0
            ],
            [
              "floor_line",
              0
            ]
          ]
        },
        "worst_segment": {
          "axis": "y",
          "name": "ceiling_line..floor_line",
          "scale": 1.044,
          "target_px": 725.3,
          "source_px": 695
        },
        "revealed_px": 20,
        "remeasured": {
          "px_per_m_at_wall": 174.167,
          "floor_line_y": 0.731445,
          "corner_x0_px": 85,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 213.438
        },
        "warped_from": "backdrops/source/booking_hall-S/row23-5fc9fd07.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": []
    },
    "openings": [],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "booking_hall/W": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8b49e",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 258,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/booking_hall-W/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "7991604bcb26",
    "camera_source": "declared",
    "declared_fields": [
      "horizon_y",
      "px_per_m_at_wall",
      "floor_line_y",
      "corner_x0_px",
      "corner_x1_px"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1032,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.433,
      "wall_width_m": 6.354,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "corner_right",
              0
            ]
          ],
          "row_px": [
            [
              "ceiling_line",
              0
            ],
            [
              "floor_line",
              0
            ]
          ]
        },
        "worst_segment": {
          "axis": "y",
          "name": "ceiling_line..floor_line",
          "scale": 1.104,
          "target_px": 725.3,
          "source_px": 657
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 215,
          "floor_line_y": 0.760742,
          "corner_x0_px": 85,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 213.438
        },
        "warped_from": "backdrops/source/booking_hall-W/row23-f1727b12.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": []
    },
    "openings": [],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
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
    "corner_x0_px": 85.33333333333348,
    "corner_x1_px": 2816.0000000000005,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "stairs": []
  },
  "platform/E": {
    "floor_line_y": 0.619395,
    "px_per_m_at_wall": 91.429,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c89c67",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 110,
    "camera_wall_m": 11.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 475.4285714285714,
    "corner_x1_px": 1060.5714285714287,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform-E/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "57236a09a2ea",
    "camera_source": "declared",
    "declared_fields": [
      "horizon_y",
      "px_per_m_at_wall",
      "floor_line_y",
      "corner_x0_px",
      "corner_x1_px"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1026.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.535,
      "wall_width_m": 6.404,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "corner_right",
              0
            ]
          ],
          "row_px": [
            [
              "ceiling_line",
              0
            ],
            [
              "floor_line",
              0
            ]
          ]
        },
        "worst_segment": {
          "axis": "x",
          "name": "corner_left..corner_right",
          "scale": 1.072,
          "target_px": 585.1,
          "source_px": 546
        },
        "revealed_px": 88195,
        "remeasured": {
          "px_per_m_at_wall": 91.667,
          "floor_line_y": 0.614258,
          "corner_x0_px": 474,
          "corner_x1_px": 1061,
          "corner_scale_px_per_m": 91.719
        },
        "warped_from": "backdrops/source/platform-E/row23-d3cc96ec.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": []
    },
    "openings": [],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
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
    "corner_x0_px": -1280.0000000000005,
    "corner_x1_px": 1450.6666666666665,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "stairs": []
  },
  "platform/W": {
    "floor_line_y": 0.75293,
    "px_per_m_at_wall": 204.167,
    "px_per_m_at_bottom": 415.09,
    "wall_width_m": 6.4,
    "key_tint": "#c8a97e",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 245,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 126,
    "corner_x1_px": 1390,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/platform-W/row23-4c9f614b.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "57236a09a2ea",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 980,
    "nearest_floor_m": 2.3609,
    "measured_room": {
      "storey_height_m": 3.331,
      "wall_width_m": 6.191,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            645.5,
            890.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            630,
            888
          ],
          "painted_centre_px": 759,
          "centre_delta_px": -9,
          "centre_delta_m": -0.044,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 623,
        "y": 307,
        "w": 272,
        "h": 464,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            632.82,
            307
          ],
          [
            638.46,
            307
          ],
          [
            644.1,
            307
          ],
          [
            649.74,
            307
          ],
          [
            655.38,
            307
          ],
          [
            661.02,
            307
          ],
          [
            666.66,
            307
          ],
          [
            672.3,
            307
          ],
          [
            677.95,
            307
          ],
          [
            683.59,
            307
          ],
          [
            689.23,
            307
          ],
          [
            694.87,
            307
          ],
          [
            700.51,
            307
          ],
          [
            706.15,
            307
          ],
          [
            711.79,
            307
          ],
          [
            717.43,
            307
          ],
          [
            723.07,
            307
          ],
          [
            728.71,
            307
          ],
          [
            734.35,
            307
          ],
          [
            739.99,
            307
          ],
          [
            745.63,
            307
          ],
          [
            751.27,
            307
          ],
          [
            756.91,
            307
          ],
          [
            762.55,
            307
          ],
          [
            768.2,
            307
          ],
          [
            773.84,
            307
          ],
          [
            779.48,
            307
          ],
          [
            785.12,
            307
          ],
          [
            790.76,
            307
          ],
          [
            796.4,
            307
          ],
          [
            802.04,
            307
          ],
          [
            807.68,
            307
          ],
          [
            813.32,
            307
          ],
          [
            818.96,
            307
          ],
          [
            824.6,
            307
          ],
          [
            830.24,
            307
          ],
          [
            835.88,
            307
          ],
          [
            841.52,
            307
          ],
          [
            847.16,
            307
          ],
          [
            852.8,
            307
          ],
          [
            858.45,
            307
          ],
          [
            864.09,
            307
          ],
          [
            869.73,
            307
          ],
          [
            875.37,
            307
          ],
          [
            881.01,
            307
          ],
          [
            886.65,
            307
          ],
          [
            895,
            311.29
          ],
          [
            893,
            316.93
          ],
          [
            892,
            322.57
          ],
          [
            892,
            328.21
          ],
          [
            892,
            333.85
          ],
          [
            892,
            339.49
          ],
          [
            892,
            345.13
          ],
          [
            892,
            350.77
          ],
          [
            892,
            356.41
          ],
          [
            892,
            362.05
          ],
          [
            892,
            367.7
          ],
          [
            892,
            373.34
          ],
          [
            892,
            378.98
          ],
          [
            892,
            384.62
          ],
          [
            892,
            390.26
          ],
          [
            892,
            395.9
          ],
          [
            892,
            401.54
          ],
          [
            892,
            407.18
          ],
          [
            892,
            412.82
          ],
          [
            892,
            418.46
          ],
          [
            892,
            424.1
          ],
          [
            892,
            429.74
          ],
          [
            892,
            435.38
          ],
          [
            892,
            441.02
          ],
          [
            892,
            446.66
          ],
          [
            892,
            452.3
          ],
          [
            891,
            457.95
          ],
          [
            891,
            463.59
          ],
          [
            891,
            469.23
          ],
          [
            891,
            474.87
          ],
          [
            891,
            480.51
          ],
          [
            891,
            486.15
          ],
          [
            891,
            491.79
          ],
          [
            891,
            497.43
          ],
          [
            891,
            503.07
          ],
          [
            891,
            508.71
          ],
          [
            891,
            514.35
          ],
          [
            891,
            519.99
          ],
          [
            889,
            525.63
          ],
          [
            889,
            531.27
          ],
          [
            889,
            536.91
          ],
          [
            889,
            542.55
          ],
          [
            889,
            548.2
          ],
          [
            889,
            553.84
          ],
          [
            889,
            559.48
          ],
          [
            889,
            565.12
          ],
          [
            890,
            570.76
          ],
          [
            890,
            576.4
          ],
          [
            890,
            582.04
          ],
          [
            890,
            587.68
          ],
          [
            890,
            593.32
          ],
          [
            890,
            598.96
          ],
          [
            890,
            604.6
          ],
          [
            890,
            610.24
          ],
          [
            890,
            615.88
          ],
          [
            890,
            621.52
          ],
          [
            890,
            627.16
          ],
          [
            890,
            632.8
          ],
          [
            890,
            638.45
          ],
          [
            890,
            644.09
          ],
          [
            890,
            649.73
          ],
          [
            890,
            655.37
          ],
          [
            890,
            661.01
          ],
          [
            890,
            666.65
          ],
          [
            890,
            672.29
          ],
          [
            890,
            677.93
          ],
          [
            890,
            683.57
          ],
          [
            890,
            689.21
          ],
          [
            890,
            694.85
          ],
          [
            890,
            700.49
          ],
          [
            890,
            706.13
          ],
          [
            890,
            711.77
          ],
          [
            890,
            717.41
          ],
          [
            890,
            723.05
          ],
          [
            890,
            728.7
          ],
          [
            890,
            734.34
          ],
          [
            890,
            739.98
          ],
          [
            890,
            745.62
          ],
          [
            890,
            751.26
          ],
          [
            890,
            756.9
          ],
          [
            890,
            762.54
          ],
          [
            890,
            768.18
          ],
          [
            885.18,
            771
          ],
          [
            879.54,
            771
          ],
          [
            873.9,
            771
          ],
          [
            868.26,
            771
          ],
          [
            862.62,
            771
          ],
          [
            856.98,
            771
          ],
          [
            851.34,
            771
          ],
          [
            845.7,
            771
          ],
          [
            840.05,
            771
          ],
          [
            834.41,
            771
          ],
          [
            828.77,
            771
          ],
          [
            823.13,
            771
          ],
          [
            817.49,
            771
          ],
          [
            811.85,
            771
          ],
          [
            806.21,
            771
          ],
          [
            800.57,
            771
          ],
          [
            794.93,
            771
          ],
          [
            789.29,
            771
          ],
          [
            783.65,
            771
          ],
          [
            778.01,
            771
          ],
          [
            772.37,
            771
          ],
          [
            766.73,
            771
          ],
          [
            761.09,
            771
          ],
          [
            755.45,
            771
          ],
          [
            749.8,
            771
          ],
          [
            744.16,
            771
          ],
          [
            738.52,
            771
          ],
          [
            732.88,
            771
          ],
          [
            727.24,
            771
          ],
          [
            721.6,
            771
          ],
          [
            715.96,
            771
          ],
          [
            710.32,
            771
          ],
          [
            704.68,
            771
          ],
          [
            699.04,
            771
          ],
          [
            693.4,
            771
          ],
          [
            687.76,
            771
          ],
          [
            682.12,
            771
          ],
          [
            676.48,
            771
          ],
          [
            670.84,
            771
          ],
          [
            665.2,
            771
          ],
          [
            659.55,
            771
          ],
          [
            653.91,
            771
          ],
          [
            648.27,
            771
          ],
          [
            642.63,
            771
          ],
          [
            636.99,
            771
          ],
          [
            631.35,
            771
          ],
          [
            627,
            766.71
          ],
          [
            627,
            761.07
          ],
          [
            627,
            755.43
          ],
          [
            627,
            749.79
          ],
          [
            627,
            744.15
          ],
          [
            627,
            738.51
          ],
          [
            627,
            732.87
          ],
          [
            627,
            727.23
          ],
          [
            627,
            721.59
          ],
          [
            627,
            715.95
          ],
          [
            627,
            710.3
          ],
          [
            627,
            704.66
          ],
          [
            627,
            699.02
          ],
          [
            627,
            693.38
          ],
          [
            627,
            687.74
          ],
          [
            627,
            682.1
          ],
          [
            627,
            676.46
          ],
          [
            627,
            670.82
          ],
          [
            627,
            665.18
          ],
          [
            627,
            659.54
          ],
          [
            627,
            653.9
          ],
          [
            627,
            648.26
          ],
          [
            627,
            642.62
          ],
          [
            627,
            636.98
          ],
          [
            627,
            631.34
          ],
          [
            627,
            625.7
          ],
          [
            627,
            620.05
          ],
          [
            627,
            614.41
          ],
          [
            627,
            608.77
          ],
          [
            627,
            603.13
          ],
          [
            627,
            597.49
          ],
          [
            627,
            591.85
          ],
          [
            627,
            586.21
          ],
          [
            627,
            580.57
          ],
          [
            627,
            574.93
          ],
          [
            627,
            569.29
          ],
          [
            627,
            563.65
          ],
          [
            627,
            558.01
          ],
          [
            627,
            552.37
          ],
          [
            627,
            546.73
          ],
          [
            625,
            541.09
          ],
          [
            625,
            535.45
          ],
          [
            625,
            529.8
          ],
          [
            625,
            524.16
          ],
          [
            625,
            518.52
          ],
          [
            625,
            512.88
          ],
          [
            625,
            507.24
          ],
          [
            625,
            501.6
          ],
          [
            625,
            495.96
          ],
          [
            625,
            490.32
          ],
          [
            625,
            484.68
          ],
          [
            625,
            479.04
          ],
          [
            625,
            473.4
          ],
          [
            625,
            467.76
          ],
          [
            625,
            462.12
          ],
          [
            625,
            456.48
          ],
          [
            625,
            450.84
          ],
          [
            625,
            445.2
          ],
          [
            625,
            439.55
          ],
          [
            625,
            433.91
          ],
          [
            625,
            428.27
          ],
          [
            625,
            422.63
          ],
          [
            625,
            416.99
          ],
          [
            625,
            411.35
          ],
          [
            625,
            405.71
          ],
          [
            625,
            400.07
          ],
          [
            625,
            394.43
          ],
          [
            625,
            388.79
          ],
          [
            625,
            383.15
          ],
          [
            625,
            377.51
          ],
          [
            625,
            371.87
          ],
          [
            625,
            366.23
          ],
          [
            625,
            360.59
          ],
          [
            625,
            354.95
          ],
          [
            625,
            349.3
          ],
          [
            625,
            343.66
          ],
          [
            625,
            338.02
          ],
          [
            625,
            332.38
          ],
          [
            625,
            326.74
          ],
          [
            625,
            321.1
          ],
          [
            624,
            315.46
          ],
          [
            623,
            309.82
          ]
        ],
        "corners": [
          [
            623.5,
            307
          ],
          [
            892.52,
            307
          ],
          [
            888.45,
            771
          ],
          [
            628.43,
            771
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9492,
        "polygon_used": true
      }
    ],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
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
    "corner_x0_px": -1280.0000000000005,
    "corner_x1_px": 1450.6666666666665,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "stairs": []
  },
  "platform_far/E": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8a479",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 274,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 85.33333333333326,
    "corner_x1_px": 1450.6666666666667,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform_far-E/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "57236a09a2ea",
    "camera_source": "declared",
    "declared_fields": [
      "horizon_y",
      "px_per_m_at_wall",
      "floor_line_y",
      "corner_x0_px",
      "corner_x1_px"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1096,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.145,
      "wall_width_m": 5.983,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "corner_right",
              0
            ]
          ],
          "row_px": [
            [
              "ceiling_line",
              0
            ],
            [
              "floor_line",
              0
            ]
          ]
        },
        "worst_segment": {
          "axis": "y",
          "name": "ceiling_line..floor_line",
          "scale": 1.036,
          "target_px": 725.3,
          "source_px": 700
        },
        "revealed_px": 35733,
        "remeasured": {
          "px_per_m_at_wall": 228.333,
          "floor_line_y": 0.760742,
          "corner_x0_px": 85,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 213.438
        },
        "warped_from": "backdrops/source/platform_far-E/row23-6d3f2346.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": []
    },
    "openings": [],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
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
    "corner_x0_px": 85.33333333333348,
    "corner_x1_px": 2816.0000000000005,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "stairs": []
  },
  "platform_far/W": {
    "floor_line_y": 0.619141,
    "px_per_m_at_wall": 98.333,
    "px_per_m_at_bottom": 435.62,
    "wall_width_m": 6.4,
    "key_tint": "#c89e67",
    "image_h_px": 1024,
    "horizon_y": 0.508105,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 118,
    "camera_wall_m": 11.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 473,
    "corner_x1_px": 1061,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/platform_far-W/row23-a6a27b21.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "57236a09a2ea",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1101.3,
    "nearest_floor_m": 2.5282,
    "measured_room": {
      "storey_height_m": 3.397,
      "wall_width_m": 5.98,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            709,
            827
          ],
          "plan_centre_px": 768,
          "painted_px": [
            712,
            824
          ],
          "painted_centre_px": 768,
          "centre_delta_px": 0,
          "centre_delta_m": 0,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 712,
        "y": 448,
        "w": 111,
        "h": 186,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            713.16,
            448
          ],
          [
            715.49,
            448
          ],
          [
            717.82,
            449
          ],
          [
            720.15,
            449
          ],
          [
            722.48,
            449
          ],
          [
            724.8,
            449
          ],
          [
            727.13,
            449
          ],
          [
            729.46,
            449
          ],
          [
            731.79,
            449
          ],
          [
            734.12,
            449
          ],
          [
            736.45,
            449
          ],
          [
            738.77,
            449
          ],
          [
            741.1,
            449
          ],
          [
            743.43,
            449
          ],
          [
            745.76,
            449
          ],
          [
            748.09,
            449
          ],
          [
            750.41,
            449
          ],
          [
            752.74,
            449
          ],
          [
            755.07,
            449
          ],
          [
            757.4,
            449
          ],
          [
            759.73,
            449
          ],
          [
            762.05,
            449
          ],
          [
            764.38,
            449
          ],
          [
            766.71,
            449
          ],
          [
            769.04,
            449
          ],
          [
            771.37,
            449
          ],
          [
            773.7,
            449
          ],
          [
            776.02,
            449
          ],
          [
            778.35,
            449
          ],
          [
            780.68,
            449
          ],
          [
            783.01,
            449
          ],
          [
            785.34,
            449
          ],
          [
            787.66,
            449
          ],
          [
            789.99,
            449
          ],
          [
            792.32,
            449
          ],
          [
            794.65,
            449
          ],
          [
            796.98,
            449
          ],
          [
            799.3,
            449
          ],
          [
            801.63,
            449
          ],
          [
            803.96,
            449
          ],
          [
            806.29,
            449
          ],
          [
            808.62,
            449
          ],
          [
            810.95,
            449
          ],
          [
            813.27,
            449
          ],
          [
            815.6,
            449
          ],
          [
            817.93,
            449
          ],
          [
            820.26,
            449
          ],
          [
            822.59,
            449
          ],
          [
            823,
            448.91
          ],
          [
            823,
            451.24
          ],
          [
            823,
            453.57
          ],
          [
            823,
            455.9
          ],
          [
            823,
            458.23
          ],
          [
            823,
            460.55
          ],
          [
            823,
            462.88
          ],
          [
            823,
            465.21
          ],
          [
            823,
            467.54
          ],
          [
            823,
            469.87
          ],
          [
            823,
            472.2
          ],
          [
            823,
            474.52
          ],
          [
            823,
            476.85
          ],
          [
            823,
            479.18
          ],
          [
            823,
            481.51
          ],
          [
            823,
            483.84
          ],
          [
            823,
            486.16
          ],
          [
            823,
            488.49
          ],
          [
            823,
            490.82
          ],
          [
            823,
            493.15
          ],
          [
            823,
            495.48
          ],
          [
            823,
            497.8
          ],
          [
            823,
            500.13
          ],
          [
            823,
            502.46
          ],
          [
            823,
            504.79
          ],
          [
            823,
            507.12
          ],
          [
            823,
            509.45
          ],
          [
            823,
            511.77
          ],
          [
            823,
            514.1
          ],
          [
            823,
            516.43
          ],
          [
            823,
            518.76
          ],
          [
            823,
            521.09
          ],
          [
            823,
            523.41
          ],
          [
            823,
            525.74
          ],
          [
            823,
            528.07
          ],
          [
            823,
            530.4
          ],
          [
            823,
            532.73
          ],
          [
            823,
            535.05
          ],
          [
            823,
            537.38
          ],
          [
            823,
            539.71
          ],
          [
            823,
            542.04
          ],
          [
            823,
            544.37
          ],
          [
            823,
            546.7
          ],
          [
            823,
            549.02
          ],
          [
            823,
            551.35
          ],
          [
            823,
            553.68
          ],
          [
            823,
            556.01
          ],
          [
            823,
            558.34
          ],
          [
            823,
            560.66
          ],
          [
            823,
            562.99
          ],
          [
            823,
            565.32
          ],
          [
            823,
            567.65
          ],
          [
            823,
            569.98
          ],
          [
            823,
            572.3
          ],
          [
            823,
            574.63
          ],
          [
            823,
            576.96
          ],
          [
            823,
            579.29
          ],
          [
            823,
            581.62
          ],
          [
            823,
            583.95
          ],
          [
            823,
            586.27
          ],
          [
            823,
            588.6
          ],
          [
            823,
            590.93
          ],
          [
            823,
            593.26
          ],
          [
            823,
            595.59
          ],
          [
            823,
            597.91
          ],
          [
            823,
            600.24
          ],
          [
            823,
            602.57
          ],
          [
            823,
            604.9
          ],
          [
            823,
            607.23
          ],
          [
            823,
            609.55
          ],
          [
            823,
            611.88
          ],
          [
            823,
            614.21
          ],
          [
            823,
            616.54
          ],
          [
            823,
            618.87
          ],
          [
            823,
            621.2
          ],
          [
            823,
            623.52
          ],
          [
            823,
            625.85
          ],
          [
            823,
            628.18
          ],
          [
            823,
            630.51
          ],
          [
            823,
            632.84
          ],
          [
            822.84,
            634
          ],
          [
            820.51,
            634
          ],
          [
            818.18,
            634
          ],
          [
            815.85,
            634
          ],
          [
            813.52,
            634
          ],
          [
            811.2,
            634
          ],
          [
            808.87,
            634
          ],
          [
            806.54,
            634
          ],
          [
            804.21,
            634
          ],
          [
            801.88,
            634
          ],
          [
            799.55,
            634
          ],
          [
            797.23,
            634
          ],
          [
            794.9,
            634
          ],
          [
            792.57,
            634
          ],
          [
            790.24,
            634
          ],
          [
            787.91,
            634
          ],
          [
            785.59,
            634
          ],
          [
            783.26,
            634
          ],
          [
            780.93,
            634
          ],
          [
            778.6,
            634
          ],
          [
            776.27,
            634
          ],
          [
            773.95,
            634
          ],
          [
            771.62,
            634
          ],
          [
            769.29,
            634
          ],
          [
            766.96,
            634
          ],
          [
            764.63,
            634
          ],
          [
            762.3,
            634
          ],
          [
            759.98,
            634
          ],
          [
            757.65,
            634
          ],
          [
            755.32,
            634
          ],
          [
            752.99,
            634
          ],
          [
            750.66,
            634
          ],
          [
            748.34,
            634
          ],
          [
            746.01,
            634
          ],
          [
            743.68,
            634
          ],
          [
            741.35,
            634
          ],
          [
            739.02,
            634
          ],
          [
            736.7,
            634
          ],
          [
            734.37,
            634
          ],
          [
            732.04,
            634
          ],
          [
            729.71,
            634
          ],
          [
            727.38,
            634
          ],
          [
            725.05,
            634
          ],
          [
            722.73,
            634
          ],
          [
            720.4,
            634
          ],
          [
            718.07,
            634
          ],
          [
            715.74,
            634
          ],
          [
            713.41,
            634
          ],
          [
            712,
            633.09
          ],
          [
            712,
            630.76
          ],
          [
            712,
            628.43
          ],
          [
            712,
            626.1
          ],
          [
            712,
            623.77
          ],
          [
            712,
            621.45
          ],
          [
            712,
            619.12
          ],
          [
            712,
            616.79
          ],
          [
            712,
            614.46
          ],
          [
            712,
            612.13
          ],
          [
            712,
            609.8
          ],
          [
            712,
            607.48
          ],
          [
            712,
            605.15
          ],
          [
            712,
            602.82
          ],
          [
            712,
            600.49
          ],
          [
            712,
            598.16
          ],
          [
            712,
            595.84
          ],
          [
            712,
            593.51
          ],
          [
            712,
            591.18
          ],
          [
            712,
            588.85
          ],
          [
            712,
            586.52
          ],
          [
            712,
            584.2
          ],
          [
            712,
            581.87
          ],
          [
            712,
            579.54
          ],
          [
            712,
            577.21
          ],
          [
            712,
            574.88
          ],
          [
            712,
            572.55
          ],
          [
            712,
            570.23
          ],
          [
            712,
            567.9
          ],
          [
            712,
            565.57
          ],
          [
            712,
            563.24
          ],
          [
            712,
            560.91
          ],
          [
            712,
            558.59
          ],
          [
            712,
            556.26
          ],
          [
            712,
            553.93
          ],
          [
            712,
            551.6
          ],
          [
            712,
            549.27
          ],
          [
            712,
            546.95
          ],
          [
            712,
            544.62
          ],
          [
            712,
            542.29
          ],
          [
            712,
            539.96
          ],
          [
            712,
            537.63
          ],
          [
            712,
            535.3
          ],
          [
            712,
            532.98
          ],
          [
            712,
            530.65
          ],
          [
            712,
            528.32
          ],
          [
            712,
            525.99
          ],
          [
            712,
            523.66
          ],
          [
            712,
            521.34
          ],
          [
            712,
            519.01
          ],
          [
            712,
            516.68
          ],
          [
            712,
            514.35
          ],
          [
            712,
            512.02
          ],
          [
            712,
            509.7
          ],
          [
            712,
            507.37
          ],
          [
            712,
            505.04
          ],
          [
            712,
            502.71
          ],
          [
            712,
            500.38
          ],
          [
            712,
            498.05
          ],
          [
            712,
            495.73
          ],
          [
            712,
            493.4
          ],
          [
            712,
            491.07
          ],
          [
            712,
            488.74
          ],
          [
            712,
            486.41
          ],
          [
            712,
            484.09
          ],
          [
            712,
            481.76
          ],
          [
            712,
            479.43
          ],
          [
            712,
            477.1
          ],
          [
            712,
            474.77
          ],
          [
            712,
            472.45
          ],
          [
            712,
            470.12
          ],
          [
            712,
            467.79
          ],
          [
            712,
            465.46
          ],
          [
            712,
            463.13
          ],
          [
            712,
            460.8
          ],
          [
            712,
            458.48
          ],
          [
            712,
            456.15
          ],
          [
            712,
            453.82
          ],
          [
            712,
            451.49
          ],
          [
            712,
            449.16
          ]
        ],
        "corners": [
          [
            712,
            449
          ],
          [
            823,
            449
          ],
          [
            823,
            634
          ],
          [
            712,
            634
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.982,
        "polygon_used": true
      }
    ],
    "windows": [],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 0,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  }
}
};
