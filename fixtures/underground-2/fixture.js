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
  fp: "8168d3be",
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8965c",
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
    "corner_x0_px": 85.33333333333348,
    "corner_x1_px": 2816.0000000000005,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform-N/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "da5967ad854c",
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
    "focal_px": 980,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.389,
      "wall_width_m": 6.015,
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
              "run_end_right",
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
          "scale": 1.075,
          "target_px": 725.3,
          "source_px": 675
        },
        "revealed_px": 4872,
        "remeasured": {
          "px_per_m_at_wall": 204.167,
          "floor_line_y": 0.759766,
          "corner_x0_px": 82,
          "corner_x1_px": 1310,
          "corner_scale_px_per_m": 191.875
        },
        "warped_from": "backdrops/source/platform-N/row23-ab082589.png",
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
  "platform/E": {
    "floor_line_y": 0.617188,
    "px_per_m_at_wall": 91.667,
    "px_per_m_at_bottom": 430.98,
    "wall_width_m": 6.4,
    "key_tint": "#c8965c",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
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
    "corner_x0_px": 530,
    "corner_x1_px": 1005,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/platform-E/row23-d3cc96ec.png",
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
    "focal_px": 1026.7,
    "nearest_floor_m": 2.3822,
    "measured_room": {
      "storey_height_m": 3.731,
      "wall_width_m": 5.182,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8985b",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 243,
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
    "corner_x0_px": -1280.0000000000005,
    "corner_x1_px": 1450.6666666666665,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform-S/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "da5967ad854c",
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
    "focal_px": 972,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.304,
      "wall_width_m": 5.052,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "run_end_left",
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
          "name": "run_end_left..corner_right",
          "scale": 1.169,
          "target_px": 1450.7,
          "source_px": 1241
        },
        "revealed_px": 43246,
        "remeasured": {
          "px_per_m_at_wall": 202.5,
          "floor_line_y": 0.728516,
          "corner_x0_px": 428,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 159.844
        },
        "warped_from": "backdrops/source/platform-S/row23-614418d6.png",
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
  "platform/W": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8a071",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 240,
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
    "camera_id": "measured:backdrops/source-warped/platform-W/warped.png",
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
    "focal_px": 960,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.365,
      "wall_width_m": 6.83,
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
          "scale": 1.26,
          "target_px": 298.7,
          "source_px": 237
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 200,
          "floor_line_y": 0.760742,
          "corner_x0_px": 85,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 213.438
        },
        "warped_from": "backdrops/source/platform-W/row23-4c9f614b.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            640,
            896
          ],
          "plan_centre_px": 768,
          "painted_px": [
            638,
            896
          ],
          "painted_centre_px": 767,
          "centre_delta_px": -1,
          "centre_delta_m": -0.005,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 620,
        "y": 352,
        "w": 294,
        "h": 426,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            640.68,
            352
          ],
          [
            646.03,
            352
          ],
          [
            651.38,
            352
          ],
          [
            656.73,
            352
          ],
          [
            662.08,
            352
          ],
          [
            667.43,
            352
          ],
          [
            672.79,
            352
          ],
          [
            678.14,
            352
          ],
          [
            683.49,
            352
          ],
          [
            688.84,
            352
          ],
          [
            694.19,
            352
          ],
          [
            699.54,
            352
          ],
          [
            704.89,
            352
          ],
          [
            710.25,
            352
          ],
          [
            715.6,
            352
          ],
          [
            720.95,
            352
          ],
          [
            726.3,
            352
          ],
          [
            731.65,
            352
          ],
          [
            737,
            352
          ],
          [
            742.36,
            352
          ],
          [
            747.71,
            352
          ],
          [
            753.06,
            352
          ],
          [
            758.41,
            352
          ],
          [
            763.76,
            352
          ],
          [
            769.11,
            352
          ],
          [
            774.46,
            352
          ],
          [
            779.82,
            352
          ],
          [
            785.17,
            352
          ],
          [
            790.52,
            352
          ],
          [
            795.87,
            352
          ],
          [
            801.22,
            352
          ],
          [
            806.57,
            352
          ],
          [
            811.93,
            352
          ],
          [
            817.28,
            352
          ],
          [
            822.63,
            352
          ],
          [
            827.98,
            352
          ],
          [
            833.33,
            352
          ],
          [
            838.68,
            352
          ],
          [
            844.04,
            352
          ],
          [
            849.39,
            352
          ],
          [
            854.74,
            352
          ],
          [
            860.09,
            352
          ],
          [
            865.44,
            353
          ],
          [
            870.79,
            353
          ],
          [
            876.14,
            353
          ],
          [
            881.5,
            353
          ],
          [
            886.85,
            353
          ],
          [
            892.2,
            352
          ],
          [
            900,
            353.55
          ],
          [
            900,
            358.9
          ],
          [
            899,
            364.25
          ],
          [
            899,
            369.61
          ],
          [
            898,
            374.96
          ],
          [
            898,
            380.31
          ],
          [
            898,
            385.66
          ],
          [
            898,
            391.01
          ],
          [
            898,
            396.36
          ],
          [
            898,
            401.71
          ],
          [
            898,
            407.07
          ],
          [
            897,
            412.42
          ],
          [
            897,
            417.77
          ],
          [
            897,
            423.12
          ],
          [
            897,
            428.47
          ],
          [
            897,
            433.82
          ],
          [
            897,
            439.18
          ],
          [
            897,
            444.53
          ],
          [
            897,
            449.88
          ],
          [
            897,
            455.23
          ],
          [
            897,
            460.58
          ],
          [
            897,
            465.93
          ],
          [
            897,
            471.29
          ],
          [
            897,
            476.64
          ],
          [
            897,
            481.99
          ],
          [
            897,
            487.34
          ],
          [
            897,
            492.69
          ],
          [
            897,
            498.04
          ],
          [
            897,
            503.39
          ],
          [
            897,
            508.75
          ],
          [
            897,
            514.1
          ],
          [
            897,
            519.45
          ],
          [
            897,
            524.8
          ],
          [
            897,
            530.15
          ],
          [
            897,
            535.5
          ],
          [
            897,
            540.86
          ],
          [
            897,
            546.21
          ],
          [
            897,
            551.56
          ],
          [
            897,
            556.91
          ],
          [
            897,
            562.26
          ],
          [
            897,
            567.61
          ],
          [
            897,
            572.96
          ],
          [
            897,
            578.32
          ],
          [
            897,
            583.67
          ],
          [
            897,
            589.02
          ],
          [
            897,
            594.37
          ],
          [
            897,
            599.72
          ],
          [
            897,
            605.07
          ],
          [
            897,
            610.43
          ],
          [
            897,
            615.78
          ],
          [
            897,
            621.13
          ],
          [
            897,
            626.48
          ],
          [
            897,
            631.83
          ],
          [
            897,
            637.18
          ],
          [
            897,
            642.54
          ],
          [
            897,
            647.89
          ],
          [
            897,
            653.24
          ],
          [
            897,
            658.59
          ],
          [
            897,
            663.94
          ],
          [
            897,
            669.29
          ],
          [
            897,
            674.64
          ],
          [
            897,
            680
          ],
          [
            897,
            685.35
          ],
          [
            897,
            690.7
          ],
          [
            897,
            696.05
          ],
          [
            897,
            701.4
          ],
          [
            897,
            706.75
          ],
          [
            897,
            712.11
          ],
          [
            897,
            717.46
          ],
          [
            897,
            722.81
          ],
          [
            897,
            728.16
          ],
          [
            897,
            733.51
          ],
          [
            898,
            738.86
          ],
          [
            901,
            744.21
          ],
          [
            901,
            749.57
          ],
          [
            901,
            754.92
          ],
          [
            901,
            760.27
          ],
          [
            901,
            765.62
          ],
          [
            914,
            770.97
          ],
          [
            914,
            776.32
          ],
          [
            893.32,
            778
          ],
          [
            887.97,
            778
          ],
          [
            882.62,
            778
          ],
          [
            877.27,
            778
          ],
          [
            871.92,
            778
          ],
          [
            866.57,
            778
          ],
          [
            861.21,
            778
          ],
          [
            855.86,
            778
          ],
          [
            850.51,
            778
          ],
          [
            845.16,
            778
          ],
          [
            839.81,
            778
          ],
          [
            834.46,
            778
          ],
          [
            829.11,
            778
          ],
          [
            823.75,
            778
          ],
          [
            818.4,
            778
          ],
          [
            813.05,
            778
          ],
          [
            807.7,
            778
          ],
          [
            802.35,
            778
          ],
          [
            797,
            778
          ],
          [
            791.64,
            778
          ],
          [
            786.29,
            778
          ],
          [
            780.94,
            778
          ],
          [
            775.59,
            778
          ],
          [
            770.24,
            778
          ],
          [
            764.89,
            778
          ],
          [
            759.54,
            778
          ],
          [
            754.18,
            778
          ],
          [
            748.83,
            778
          ],
          [
            743.48,
            778
          ],
          [
            738.13,
            778
          ],
          [
            732.78,
            778
          ],
          [
            727.43,
            778
          ],
          [
            722.07,
            778
          ],
          [
            716.72,
            778
          ],
          [
            711.37,
            778
          ],
          [
            706.02,
            778
          ],
          [
            700.67,
            778
          ],
          [
            695.32,
            778
          ],
          [
            689.96,
            778
          ],
          [
            684.61,
            778
          ],
          [
            679.26,
            778
          ],
          [
            673.91,
            778
          ],
          [
            668.56,
            778
          ],
          [
            663.21,
            778
          ],
          [
            657.86,
            778
          ],
          [
            652.5,
            778
          ],
          [
            647.15,
            778
          ],
          [
            641.8,
            778
          ],
          [
            620,
            777.45
          ],
          [
            620,
            772.1
          ],
          [
            629,
            766.75
          ],
          [
            629,
            761.39
          ],
          [
            629,
            756.04
          ],
          [
            629,
            750.69
          ],
          [
            632,
            745.34
          ],
          [
            632,
            739.99
          ],
          [
            632,
            734.64
          ],
          [
            632,
            729.29
          ],
          [
            633,
            723.93
          ],
          [
            633,
            718.58
          ],
          [
            633,
            713.23
          ],
          [
            633,
            707.88
          ],
          [
            633,
            702.53
          ],
          [
            633,
            697.18
          ],
          [
            633,
            691.82
          ],
          [
            633,
            686.47
          ],
          [
            633,
            681.12
          ],
          [
            633,
            675.77
          ],
          [
            633,
            670.42
          ],
          [
            633,
            665.07
          ],
          [
            633,
            659.71
          ],
          [
            633,
            654.36
          ],
          [
            633,
            649.01
          ],
          [
            633,
            643.66
          ],
          [
            633,
            638.31
          ],
          [
            633,
            632.96
          ],
          [
            633,
            627.61
          ],
          [
            633,
            622.25
          ],
          [
            633,
            616.9
          ],
          [
            633,
            611.55
          ],
          [
            633,
            606.2
          ],
          [
            633,
            600.85
          ],
          [
            633,
            595.5
          ],
          [
            633,
            590.14
          ],
          [
            633,
            584.79
          ],
          [
            633,
            579.44
          ],
          [
            633,
            574.09
          ],
          [
            633,
            568.74
          ],
          [
            633,
            563.39
          ],
          [
            633,
            558.04
          ],
          [
            633,
            552.68
          ],
          [
            633,
            547.33
          ],
          [
            633,
            541.98
          ],
          [
            633,
            536.63
          ],
          [
            633,
            531.28
          ],
          [
            633,
            525.93
          ],
          [
            633,
            520.57
          ],
          [
            633,
            515.22
          ],
          [
            633,
            509.87
          ],
          [
            633,
            504.52
          ],
          [
            633,
            499.17
          ],
          [
            633,
            493.82
          ],
          [
            633,
            488.46
          ],
          [
            633,
            483.11
          ],
          [
            632,
            477.76
          ],
          [
            632,
            472.41
          ],
          [
            632,
            467.06
          ],
          [
            632,
            461.71
          ],
          [
            632,
            456.36
          ],
          [
            632,
            451
          ],
          [
            632,
            445.65
          ],
          [
            632,
            440.3
          ],
          [
            632,
            434.95
          ],
          [
            632,
            429.6
          ],
          [
            632,
            424.25
          ],
          [
            632,
            418.89
          ],
          [
            632,
            413.54
          ],
          [
            631,
            408.19
          ],
          [
            631,
            402.84
          ],
          [
            631,
            397.49
          ],
          [
            631,
            392.14
          ],
          [
            631,
            386.79
          ],
          [
            631,
            381.43
          ],
          [
            631,
            376.08
          ],
          [
            631,
            370.73
          ],
          [
            631,
            365.38
          ],
          [
            631,
            360.03
          ],
          [
            631,
            354.68
          ]
        ],
        "corners": [
          [
            632.14,
            352
          ],
          [
            897,
            352
          ],
          [
            897,
            778
          ],
          [
            633.52,
            778
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.6228,
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c89b6d",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 208,
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
    "corner_x0_px": -1280.0000000000005,
    "corner_x1_px": 1450.6666666666665,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform_far-N/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "da5967ad854c",
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
    "focal_px": 832,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.831,
      "wall_width_m": 4.194,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "warp": {
        "pins": 4,
        "residuals": {
          "max_px": 0,
          "column_px": [
            [
              "run_end_left",
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
          "scale": 1.097,
          "target_px": 725.3,
          "source_px": 661
        },
        "revealed_px": 39544,
        "remeasured": {
          "px_per_m_at_wall": 173.333,
          "floor_line_y": 0.732422,
          "corner_x0_px": 724,
          "corner_x1_px": 1451,
          "corner_scale_px_per_m": 113.594
        },
        "warped_from": "backdrops/source/platform_far-N/row23-de93168c.png",
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
  "platform_far/E": {
    "floor_line_y": 0.734375,
    "px_per_m_at_wall": 197.5,
    "px_per_m_at_bottom": 458.02,
    "wall_width_m": 6.4,
    "key_tint": "#c89c67",
    "image_h_px": 1024,
    "horizon_y": 0.533008,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 237,
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
    "corner_x0_px": 237,
    "corner_x1_px": 1303,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/platform_far-E/row23-e23c4ed5.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "06f0bf598473",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 948,
    "nearest_floor_m": 2.0698,
    "measured_room": {
      "storey_height_m": 3.62,
      "wall_width_m": 5.398,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c89e6d",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 242,
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
    "corner_x0_px": 85.33333333333348,
    "corner_x1_px": 2816.0000000000005,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source-warped/platform_far-S/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "da5967ad854c",
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
    "focal_px": 968,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.387,
      "wall_width_m": 3.441,
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
              "run_end_right",
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
          "name": "corner_left..run_end_right",
          "scale": 1.067,
          "target_px": 1449.7,
          "source_px": 1359.1
        },
        "revealed_px": 1023,
        "remeasured": {
          "px_per_m_at_wall": 201.667,
          "floor_line_y": 0.748047,
          "corner_x0_px": 85,
          "corner_x1_px": 779,
          "corner_scale_px_per_m": 108.438
        },
        "warped_from": "backdrops/source/platform_far-S/row23-0fa71f22.png",
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
    "camera_id": "composed:tools/deep-draft.py mode compose (declared camera)",
    "provisional": false,
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
      }
    ],
    "stairs": [],
    "measured": false,
    "camera_reference": "declared",
    "composed_from": {
      "tool": "tools/deep-draft.py --compose",
      "args": "backdrops/composed/platform_far-W.args.json",
      "sha256": "a18ed61aa8e28df648b023bd3af023d4ca8df12a5e9965ea75847d701b7f2251",
      "sources": {
        "platform/W": "b8d9efefdd5b",
        "platform/N": "5e86e2b712a5",
        "platform/S": "391ae070744b",
        "platform_far/N": "973cd42e0aad",
        "platform_far/S": "c0ced8b80f93"
      },
      "why": "[Kabe, 2026-08-31] 'cut out the floors and the walls and the ceilings... geometrically and deterministically... skew them to the proper geometry for the wire frame' - every plane projected from the promoted close art of both cells; corners land within 1 px; no painter pass survived the instruments for this facing, so the composed frame stands"
    },
    "instrument": "composed"
  }
}
};
