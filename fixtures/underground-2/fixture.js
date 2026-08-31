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
  fp: "2fb4f5a0",
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
    "floor_line_y": 0.619395,
    "px_per_m_at_wall": 91.429,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c89d6a",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 102,
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
    "camera_id": "measured:backdrops/source-warped/platform_far-W/warped.png",
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
    "focal_px": 952,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.365,
      "wall_width_m": 6.882,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 7,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "corner_left",
              0
            ],
            [
              "door:door01:left",
              0
            ],
            [
              "door:door01:right",
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
              "door:door01:head",
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
          "name": "ceiling_line..door:door01:head",
          "scale": 1.067,
          "target_px": 128,
          "source_px": 120
        },
        "revealed_px": 3492,
        "remeasured": {
          "px_per_m_at_wall": 85,
          "floor_line_y": 0.608398,
          "corner_x0_px": 475,
          "corner_x1_px": 1060,
          "corner_scale_px_per_m": 91.406
        },
        "warped_from": "backdrops/source/platform_far-W/row23-95cdd884.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            713.1,
            822.9
          ],
          "plan_centre_px": 768,
          "painted_px": [
            713,
            823
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
        "x": 711,
        "y": 450,
        "w": 113,
        "h": 184,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            714.1,
            451
          ],
          [
            716.3,
            451
          ],
          [
            718.51,
            451
          ],
          [
            720.71,
            451
          ],
          [
            722.91,
            451
          ],
          [
            725.12,
            451
          ],
          [
            727.32,
            451
          ],
          [
            729.52,
            451
          ],
          [
            731.73,
            451
          ],
          [
            733.93,
            451
          ],
          [
            736.13,
            451
          ],
          [
            738.34,
            451
          ],
          [
            740.54,
            451
          ],
          [
            742.74,
            451
          ],
          [
            744.95,
            451
          ],
          [
            747.15,
            451
          ],
          [
            749.35,
            451
          ],
          [
            751.55,
            451
          ],
          [
            753.76,
            451
          ],
          [
            755.96,
            451
          ],
          [
            758.16,
            451
          ],
          [
            760.37,
            451
          ],
          [
            762.57,
            451
          ],
          [
            764.77,
            451
          ],
          [
            766.98,
            451
          ],
          [
            769.18,
            451
          ],
          [
            771.38,
            451
          ],
          [
            773.59,
            451
          ],
          [
            775.79,
            451
          ],
          [
            777.99,
            451
          ],
          [
            780.2,
            451
          ],
          [
            782.4,
            451
          ],
          [
            784.6,
            451
          ],
          [
            786.8,
            451
          ],
          [
            789.01,
            451
          ],
          [
            791.21,
            451
          ],
          [
            793.41,
            451
          ],
          [
            795.62,
            451
          ],
          [
            797.82,
            451
          ],
          [
            800.02,
            451
          ],
          [
            802.23,
            451
          ],
          [
            804.43,
            451
          ],
          [
            806.63,
            451
          ],
          [
            808.84,
            451
          ],
          [
            811.04,
            451
          ],
          [
            813.24,
            451
          ],
          [
            815.45,
            451
          ],
          [
            817.65,
            451
          ],
          [
            819.85,
            451
          ],
          [
            822.05,
            450
          ],
          [
            824,
            452.26
          ],
          [
            824,
            454.46
          ],
          [
            824,
            456.66
          ],
          [
            824,
            458.87
          ],
          [
            823,
            461.07
          ],
          [
            823,
            463.27
          ],
          [
            823,
            465.48
          ],
          [
            823,
            467.68
          ],
          [
            823,
            469.88
          ],
          [
            823,
            472.09
          ],
          [
            823,
            474.29
          ],
          [
            823,
            476.49
          ],
          [
            823,
            478.7
          ],
          [
            823,
            480.9
          ],
          [
            823,
            483.1
          ],
          [
            823,
            485.3
          ],
          [
            823,
            487.51
          ],
          [
            823,
            489.71
          ],
          [
            823,
            491.91
          ],
          [
            823,
            494.12
          ],
          [
            823,
            496.32
          ],
          [
            823,
            498.52
          ],
          [
            823,
            500.73
          ],
          [
            823,
            502.93
          ],
          [
            823,
            505.13
          ],
          [
            823,
            507.34
          ],
          [
            823,
            509.54
          ],
          [
            823,
            511.74
          ],
          [
            823,
            513.95
          ],
          [
            823,
            516.15
          ],
          [
            823,
            518.35
          ],
          [
            823,
            520.55
          ],
          [
            823,
            522.76
          ],
          [
            823,
            524.96
          ],
          [
            823,
            527.16
          ],
          [
            823,
            529.37
          ],
          [
            823,
            531.57
          ],
          [
            823,
            533.77
          ],
          [
            823,
            535.98
          ],
          [
            823,
            538.18
          ],
          [
            823,
            540.38
          ],
          [
            823,
            542.59
          ],
          [
            823,
            544.79
          ],
          [
            823,
            546.99
          ],
          [
            823,
            549.2
          ],
          [
            823,
            551.4
          ],
          [
            823,
            553.6
          ],
          [
            822,
            555.8
          ],
          [
            822,
            558.01
          ],
          [
            822,
            560.21
          ],
          [
            822,
            562.41
          ],
          [
            822,
            564.62
          ],
          [
            822,
            566.82
          ],
          [
            822,
            569.02
          ],
          [
            822,
            571.23
          ],
          [
            822,
            573.43
          ],
          [
            822,
            575.63
          ],
          [
            822,
            577.84
          ],
          [
            822,
            580.04
          ],
          [
            822,
            582.24
          ],
          [
            822,
            584.45
          ],
          [
            822,
            586.65
          ],
          [
            822,
            588.85
          ],
          [
            822,
            591.05
          ],
          [
            822,
            593.26
          ],
          [
            822,
            595.46
          ],
          [
            822,
            597.66
          ],
          [
            822,
            599.87
          ],
          [
            822,
            602.07
          ],
          [
            822,
            604.27
          ],
          [
            822,
            606.48
          ],
          [
            822,
            608.68
          ],
          [
            822,
            610.88
          ],
          [
            822,
            613.09
          ],
          [
            822,
            615.29
          ],
          [
            822,
            617.49
          ],
          [
            822,
            619.7
          ],
          [
            822,
            621.9
          ],
          [
            821.9,
            634
          ],
          [
            819.7,
            634
          ],
          [
            817.49,
            634
          ],
          [
            815.29,
            634
          ],
          [
            813.09,
            634
          ],
          [
            810.88,
            634
          ],
          [
            808.68,
            634
          ],
          [
            806.48,
            634
          ],
          [
            804.27,
            634
          ],
          [
            802.07,
            634
          ],
          [
            799.87,
            634
          ],
          [
            797.66,
            634
          ],
          [
            795.46,
            634
          ],
          [
            793.26,
            634
          ],
          [
            791.05,
            634
          ],
          [
            788.85,
            634
          ],
          [
            786.65,
            634
          ],
          [
            784.45,
            634
          ],
          [
            782.24,
            634
          ],
          [
            780.04,
            634
          ],
          [
            777.84,
            634
          ],
          [
            775.63,
            634
          ],
          [
            773.43,
            634
          ],
          [
            771.23,
            634
          ],
          [
            769.02,
            634
          ],
          [
            766.82,
            634
          ],
          [
            764.62,
            634
          ],
          [
            762.41,
            634
          ],
          [
            760.21,
            634
          ],
          [
            758.01,
            634
          ],
          [
            755.8,
            634
          ],
          [
            753.6,
            634
          ],
          [
            751.4,
            634
          ],
          [
            749.2,
            634
          ],
          [
            746.99,
            634
          ],
          [
            744.79,
            634
          ],
          [
            742.59,
            634
          ],
          [
            740.38,
            634
          ],
          [
            738.18,
            634
          ],
          [
            735.98,
            634
          ],
          [
            733.77,
            634
          ],
          [
            731.57,
            634
          ],
          [
            729.37,
            634
          ],
          [
            727.16,
            634
          ],
          [
            724.96,
            634
          ],
          [
            722.76,
            634
          ],
          [
            720.55,
            634
          ],
          [
            718.35,
            634
          ],
          [
            716.15,
            634
          ],
          [
            713.95,
            634
          ],
          [
            713,
            621.74
          ],
          [
            713,
            619.54
          ],
          [
            713,
            617.34
          ],
          [
            713,
            615.13
          ],
          [
            713,
            612.93
          ],
          [
            713,
            610.73
          ],
          [
            713,
            608.52
          ],
          [
            713,
            606.32
          ],
          [
            713,
            604.12
          ],
          [
            713,
            601.91
          ],
          [
            713,
            599.71
          ],
          [
            713,
            597.51
          ],
          [
            713,
            595.3
          ],
          [
            713,
            593.1
          ],
          [
            713,
            590.9
          ],
          [
            713,
            588.7
          ],
          [
            713,
            586.49
          ],
          [
            713,
            584.29
          ],
          [
            713,
            582.09
          ],
          [
            713,
            579.88
          ],
          [
            713,
            577.68
          ],
          [
            713,
            575.48
          ],
          [
            713,
            573.27
          ],
          [
            713,
            571.07
          ],
          [
            713,
            568.87
          ],
          [
            713,
            566.66
          ],
          [
            713,
            564.46
          ],
          [
            713,
            562.26
          ],
          [
            713,
            560.05
          ],
          [
            713,
            557.85
          ],
          [
            713,
            555.65
          ],
          [
            713,
            553.45
          ],
          [
            713,
            551.24
          ],
          [
            713,
            549.04
          ],
          [
            713,
            546.84
          ],
          [
            713,
            544.63
          ],
          [
            713,
            542.43
          ],
          [
            713,
            540.23
          ],
          [
            713,
            538.02
          ],
          [
            713,
            535.82
          ],
          [
            713,
            533.62
          ],
          [
            713,
            531.41
          ],
          [
            713,
            529.21
          ],
          [
            713,
            527.01
          ],
          [
            713,
            524.8
          ],
          [
            713,
            522.6
          ],
          [
            713,
            520.4
          ],
          [
            713,
            518.2
          ],
          [
            713,
            515.99
          ],
          [
            713,
            513.79
          ],
          [
            713,
            511.59
          ],
          [
            713,
            509.38
          ],
          [
            713,
            507.18
          ],
          [
            713,
            504.98
          ],
          [
            713,
            502.77
          ],
          [
            713,
            500.57
          ],
          [
            713,
            498.37
          ],
          [
            713,
            496.16
          ],
          [
            713,
            493.96
          ],
          [
            713,
            491.76
          ],
          [
            713,
            489.55
          ],
          [
            713,
            487.35
          ],
          [
            713,
            485.15
          ],
          [
            713,
            482.95
          ],
          [
            713,
            480.74
          ],
          [
            713,
            478.54
          ],
          [
            713,
            476.34
          ],
          [
            713,
            474.13
          ],
          [
            713,
            471.93
          ],
          [
            713,
            469.73
          ],
          [
            713,
            467.52
          ],
          [
            713,
            465.32
          ],
          [
            713,
            463.12
          ],
          [
            712,
            460.91
          ],
          [
            712,
            458.71
          ],
          [
            712,
            456.51
          ],
          [
            711,
            454.3
          ],
          [
            711,
            452.1
          ]
        ],
        "corners": [
          [
            713,
            451
          ],
          [
            823.75,
            451
          ],
          [
            821.44,
            634
          ],
          [
            713,
            634
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9976,
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
