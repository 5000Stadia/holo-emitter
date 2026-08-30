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
  fp: "7d85d3cf",
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
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6,
    "key_tint": "#c8c3b7",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 185,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 128,
    "corner_x1_px": 1408,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/reception-N/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
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
    "focal_px": 986.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.449,
      "wall_width_m": 6.227,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6,
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
          "scale": 1.056,
          "target_px": 1280,
          "source_px": 1212
        },
        "revealed_px": 32256,
        "remeasured": {
          "px_per_m_at_wall": 205.556,
          "floor_line_y": 0.740234,
          "corner_x0_px": 128,
          "corner_x1_px": 1408,
          "corner_scale_px_per_m": 213.333
        },
        "warped_from": "backdrops/source/reception-N/row23-18cde1b6.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            554.7,
            981.3
          ],
          "plan_centre_px": 768,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": [],
    "windows": [
      {
        "id": "win01",
        "kind": "window",
        "x": 554.67,
        "y": 330.47,
        "w": 426.67,
        "h": 256,
        "sill_m": 0.9,
        "head_m": 2.1,
        "measured": false
      }
    ],
    "window_evidence": {
      "unpainted": 1,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 1,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "reception/E": {
    "floor_line_y": 0.776658,
    "px_per_m_at_wall": 227.556,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8c5be",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 185,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 39.822222222222194,
    "corner_x1_px": 1496.177777777778,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/reception-E/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
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
    "focal_px": 925,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.026,
      "wall_width_m": 7.083,
      "ruled_storey_height_m": 3,
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
          "axis": "x",
          "name": "corner_left..door:door01:left",
          "scale": 1.112,
          "target_px": 591.6,
          "source_px": 532
        },
        "revealed_px": 124416,
        "remeasured": {
          "px_per_m_at_wall": 205.556,
          "floor_line_y": 0.761719,
          "corner_x0_px": 40,
          "corner_x1_px": 1496,
          "corner_scale_px_per_m": 227.5
        },
        "warped_from": "backdrops/source/reception-E/row23-89d98c96.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            631.5,
            904.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            631,
            904
          ],
          "painted_centre_px": 767.5,
          "centre_delta_px": -0.5,
          "centre_delta_m": -0.002,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 624,
        "y": 340,
        "w": 286,
        "h": 455,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            633.79,
            340
          ],
          [
            639.36,
            340
          ],
          [
            644.93,
            340
          ],
          [
            650.5,
            340
          ],
          [
            656.07,
            340
          ],
          [
            661.64,
            340
          ],
          [
            667.21,
            340
          ],
          [
            672.78,
            340
          ],
          [
            678.35,
            340
          ],
          [
            683.92,
            340
          ],
          [
            689.49,
            340
          ],
          [
            695.06,
            340
          ],
          [
            700.63,
            340
          ],
          [
            706.2,
            340
          ],
          [
            711.77,
            340
          ],
          [
            717.34,
            340
          ],
          [
            722.91,
            340
          ],
          [
            728.48,
            340
          ],
          [
            734.05,
            340
          ],
          [
            739.62,
            340
          ],
          [
            745.19,
            340
          ],
          [
            750.76,
            340
          ],
          [
            756.33,
            340
          ],
          [
            761.9,
            340
          ],
          [
            767.47,
            340
          ],
          [
            773.04,
            340
          ],
          [
            778.61,
            340
          ],
          [
            784.18,
            340
          ],
          [
            789.75,
            340
          ],
          [
            795.32,
            340
          ],
          [
            800.89,
            340
          ],
          [
            806.46,
            340
          ],
          [
            812.04,
            340
          ],
          [
            817.61,
            340
          ],
          [
            823.18,
            340
          ],
          [
            828.75,
            340
          ],
          [
            834.32,
            340
          ],
          [
            839.89,
            340
          ],
          [
            845.46,
            340
          ],
          [
            851.03,
            340
          ],
          [
            856.6,
            340
          ],
          [
            862.17,
            340
          ],
          [
            867.74,
            340
          ],
          [
            873.31,
            340
          ],
          [
            878.88,
            340
          ],
          [
            884.45,
            340
          ],
          [
            890.02,
            340
          ],
          [
            895.59,
            340
          ],
          [
            901.16,
            340
          ],
          [
            910,
            342.73
          ],
          [
            910,
            348.3
          ],
          [
            906,
            353.87
          ],
          [
            906,
            359.44
          ],
          [
            905,
            365.01
          ],
          [
            905,
            370.58
          ],
          [
            905,
            376.15
          ],
          [
            905,
            381.72
          ],
          [
            905,
            387.29
          ],
          [
            905,
            392.86
          ],
          [
            905,
            398.43
          ],
          [
            905,
            404
          ],
          [
            905,
            409.57
          ],
          [
            905,
            415.14
          ],
          [
            905,
            420.71
          ],
          [
            905,
            426.29
          ],
          [
            905,
            431.86
          ],
          [
            905,
            437.43
          ],
          [
            905,
            443
          ],
          [
            905,
            448.57
          ],
          [
            905,
            454.14
          ],
          [
            905,
            459.71
          ],
          [
            905,
            465.28
          ],
          [
            905,
            470.85
          ],
          [
            905,
            476.42
          ],
          [
            905,
            481.99
          ],
          [
            905,
            487.56
          ],
          [
            905,
            493.13
          ],
          [
            905,
            498.7
          ],
          [
            905,
            504.27
          ],
          [
            905,
            509.84
          ],
          [
            905,
            515.41
          ],
          [
            905,
            520.98
          ],
          [
            905,
            526.55
          ],
          [
            905,
            532.12
          ],
          [
            905,
            537.69
          ],
          [
            905,
            543.26
          ],
          [
            905,
            548.83
          ],
          [
            905,
            554.4
          ],
          [
            905,
            559.97
          ],
          [
            905,
            565.54
          ],
          [
            905,
            571.11
          ],
          [
            905,
            576.68
          ],
          [
            905,
            582.25
          ],
          [
            905,
            587.82
          ],
          [
            905,
            593.39
          ],
          [
            905,
            598.96
          ],
          [
            905,
            604.54
          ],
          [
            905,
            610.11
          ],
          [
            905,
            615.68
          ],
          [
            905,
            621.25
          ],
          [
            905,
            626.82
          ],
          [
            905,
            632.39
          ],
          [
            905,
            637.96
          ],
          [
            905,
            643.53
          ],
          [
            905,
            649.1
          ],
          [
            905,
            654.67
          ],
          [
            905,
            660.24
          ],
          [
            905,
            665.81
          ],
          [
            905,
            671.38
          ],
          [
            904,
            676.95
          ],
          [
            904,
            682.52
          ],
          [
            904,
            688.09
          ],
          [
            904,
            693.66
          ],
          [
            904,
            699.23
          ],
          [
            904,
            704.8
          ],
          [
            904,
            710.37
          ],
          [
            904,
            715.94
          ],
          [
            904,
            721.51
          ],
          [
            904,
            727.08
          ],
          [
            905,
            732.65
          ],
          [
            905,
            738.22
          ],
          [
            906,
            743.79
          ],
          [
            906,
            749.36
          ],
          [
            906,
            754.93
          ],
          [
            906,
            760.5
          ],
          [
            906,
            766.07
          ],
          [
            906,
            771.64
          ],
          [
            910,
            777.21
          ],
          [
            901.21,
            795
          ],
          [
            895.64,
            795
          ],
          [
            890.07,
            795
          ],
          [
            884.5,
            795
          ],
          [
            878.93,
            795
          ],
          [
            873.36,
            795
          ],
          [
            867.79,
            795
          ],
          [
            862.22,
            795
          ],
          [
            856.65,
            795
          ],
          [
            851.08,
            795
          ],
          [
            845.51,
            795
          ],
          [
            839.94,
            795
          ],
          [
            834.37,
            795
          ],
          [
            828.8,
            795
          ],
          [
            823.23,
            795
          ],
          [
            817.66,
            795
          ],
          [
            812.09,
            795
          ],
          [
            806.52,
            795
          ],
          [
            800.95,
            795
          ],
          [
            795.38,
            795
          ],
          [
            789.81,
            795
          ],
          [
            784.24,
            795
          ],
          [
            778.67,
            795
          ],
          [
            773.1,
            795
          ],
          [
            767.53,
            795
          ],
          [
            761.96,
            795
          ],
          [
            756.39,
            795
          ],
          [
            750.82,
            795
          ],
          [
            745.25,
            795
          ],
          [
            739.68,
            795
          ],
          [
            734.11,
            795
          ],
          [
            728.54,
            795
          ],
          [
            722.96,
            795
          ],
          [
            717.39,
            795
          ],
          [
            711.82,
            795
          ],
          [
            706.25,
            795
          ],
          [
            700.68,
            795
          ],
          [
            695.11,
            795
          ],
          [
            689.54,
            795
          ],
          [
            683.97,
            795
          ],
          [
            678.4,
            795
          ],
          [
            672.83,
            795
          ],
          [
            667.26,
            795
          ],
          [
            661.69,
            795
          ],
          [
            656.12,
            795
          ],
          [
            650.55,
            795
          ],
          [
            644.98,
            795
          ],
          [
            639.41,
            795
          ],
          [
            633.84,
            795
          ],
          [
            624,
            777.27
          ],
          [
            624,
            771.7
          ],
          [
            628,
            766.13
          ],
          [
            628,
            760.56
          ],
          [
            628,
            754.99
          ],
          [
            628,
            749.42
          ],
          [
            628,
            743.85
          ],
          [
            628,
            738.28
          ],
          [
            628,
            732.71
          ],
          [
            628,
            727.14
          ],
          [
            628,
            721.57
          ],
          [
            631,
            716
          ],
          [
            631,
            710.43
          ],
          [
            631,
            704.86
          ],
          [
            631,
            699.29
          ],
          [
            631,
            693.71
          ],
          [
            631,
            688.14
          ],
          [
            631,
            682.57
          ],
          [
            631,
            677
          ],
          [
            631,
            671.43
          ],
          [
            631,
            665.86
          ],
          [
            631,
            660.29
          ],
          [
            631,
            654.72
          ],
          [
            631,
            649.15
          ],
          [
            631,
            643.58
          ],
          [
            631,
            638.01
          ],
          [
            631,
            632.44
          ],
          [
            631,
            626.87
          ],
          [
            631,
            621.3
          ],
          [
            631,
            615.73
          ],
          [
            631,
            610.16
          ],
          [
            631,
            604.59
          ],
          [
            631,
            599.02
          ],
          [
            631,
            593.45
          ],
          [
            631,
            587.88
          ],
          [
            631,
            582.31
          ],
          [
            631,
            576.74
          ],
          [
            631,
            571.17
          ],
          [
            631,
            565.6
          ],
          [
            631,
            560.03
          ],
          [
            631,
            554.46
          ],
          [
            631,
            548.89
          ],
          [
            631,
            543.32
          ],
          [
            631,
            537.75
          ],
          [
            631,
            532.18
          ],
          [
            631,
            526.61
          ],
          [
            631,
            521.04
          ],
          [
            631,
            515.46
          ],
          [
            631,
            509.89
          ],
          [
            631,
            504.32
          ],
          [
            631,
            498.75
          ],
          [
            631,
            493.18
          ],
          [
            631,
            487.61
          ],
          [
            631,
            482.04
          ],
          [
            631,
            476.47
          ],
          [
            631,
            470.9
          ],
          [
            631,
            465.33
          ],
          [
            631,
            459.76
          ],
          [
            631,
            454.19
          ],
          [
            631,
            448.62
          ],
          [
            631,
            443.05
          ],
          [
            631,
            437.48
          ],
          [
            631,
            431.91
          ],
          [
            631,
            426.34
          ],
          [
            631,
            420.77
          ],
          [
            631,
            415.2
          ],
          [
            631,
            409.63
          ],
          [
            631,
            404.06
          ],
          [
            631,
            398.49
          ],
          [
            631,
            392.92
          ],
          [
            631,
            387.35
          ],
          [
            631,
            381.78
          ],
          [
            631,
            376.21
          ],
          [
            631,
            370.64
          ],
          [
            631,
            365.07
          ],
          [
            628,
            359.5
          ],
          [
            628,
            353.93
          ],
          [
            624,
            348.36
          ],
          [
            624,
            342.79
          ]
        ],
        "corners": [
          [
            631,
            340
          ],
          [
            905.28,
            340
          ],
          [
            904.53,
            795
          ],
          [
            631,
            795
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9852,
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
  "reception/S": {
    "floor_line_y": 0.743164,
    "px_per_m_at_wall": 211.111,
    "px_per_m_at_bottom": 415.84,
    "wall_width_m": 6,
    "key_tint": "#c8c7c2",
    "image_h_px": 1024,
    "horizon_y": 0.47832,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 190,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 137,
    "corner_x1_px": 1401,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/reception-S/row23-23bdb263.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1013.3,
    "nearest_floor_m": 2.4368,
    "measured_room": {
      "storey_height_m": 3.188,
      "wall_width_m": 5.987,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6,
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
  "reception/W": {
    "floor_line_y": 0.762695,
    "px_per_m_at_wall": 230,
    "px_per_m_at_bottom": 402.18,
    "wall_width_m": 6.4,
    "key_tint": "#c8c5ba",
    "image_h_px": 1024,
    "horizon_y": 0.445703,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 207,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 62,
    "corner_x1_px": 1471,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/reception-W/row23-c735210e.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1035,
    "nearest_floor_m": 2.5735,
    "measured_room": {
      "storey_height_m": 3.004,
      "wall_width_m": 6.126,
      "ruled_storey_height_m": 3,
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
  "treatment_room/N": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.2,
    "key_tint": "#c8c2bc",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 184,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.2,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 213.33333333333326,
    "corner_x1_px": 1322.6666666666667,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/treatment_room-N/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
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
    "focal_px": 981.3,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.253,
      "wall_width_m": 5.449,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 5.2,
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
          "scale": 0.938,
          "target_px": 1109.3,
          "source_px": 1183
        },
        "revealed_px": 160401,
        "remeasured": {
          "px_per_m_at_wall": 204.444,
          "floor_line_y": 0.741211,
          "corner_x0_px": 210,
          "corner_x1_px": 1324,
          "corner_scale_px_per_m": 214.231
        },
        "warped_from": "backdrops/source/treatment_room-N/row23-7cae834a.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            554.7,
            981.3
          ],
          "plan_centre_px": 768,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": [],
    "windows": [
      {
        "id": "win02",
        "kind": "window",
        "x": 554.67,
        "y": 330.47,
        "w": 426.67,
        "h": 256,
        "sill_m": 0.9,
        "head_m": 2.1,
        "measured": false
      }
    ],
    "window_evidence": {
      "unpainted": 1,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 1,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "treatment_room/E": {
    "floor_line_y": 0.762822,
    "px_per_m_at_wall": 215.579,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8bdb0",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 171,
    "camera_wall_m": 4.75,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 78.14736842105265,
    "corner_x1_px": 1457.8526315789472,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/treatment_room-E/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
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
    "focal_px": 902.5,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.284,
      "wall_width_m": 7.321,
      "ruled_storey_height_m": 3,
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
              "door:door02:left",
              0
            ],
            [
              "door:door02:right",
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
              "door:door02:head",
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
          "name": "door:door02:right..corner_right",
          "scale": 1.277,
          "target_px": 560.5,
          "source_px": 439
        },
        "revealed_px": 99840,
        "remeasured": {
          "px_per_m_at_wall": 190,
          "floor_line_y": 0.743164,
          "corner_x0_px": 72,
          "corner_x1_px": 1463,
          "corner_scale_px_per_m": 217.344
        },
        "warped_from": "backdrops/source/treatment_room-E/row23-b9551bf5.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            638.7,
            897.3
          ],
          "plan_centre_px": 768,
          "painted_px": [
            639,
            897
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
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 632,
        "y": 350,
        "w": 265,
        "h": 431,
        "beyond_m": 7,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            641.61,
            350
          ],
          [
            646.84,
            350
          ],
          [
            652.07,
            350
          ],
          [
            657.29,
            350
          ],
          [
            662.52,
            350
          ],
          [
            667.75,
            350
          ],
          [
            672.97,
            350
          ],
          [
            678.2,
            350
          ],
          [
            683.43,
            350
          ],
          [
            688.65,
            350
          ],
          [
            693.88,
            350
          ],
          [
            699.11,
            350
          ],
          [
            704.33,
            350
          ],
          [
            709.56,
            350
          ],
          [
            714.79,
            350
          ],
          [
            720.01,
            350
          ],
          [
            725.24,
            350
          ],
          [
            730.46,
            350
          ],
          [
            735.69,
            350
          ],
          [
            740.92,
            350
          ],
          [
            746.14,
            350
          ],
          [
            751.37,
            350
          ],
          [
            756.6,
            350
          ],
          [
            761.82,
            350
          ],
          [
            767.05,
            350
          ],
          [
            772.28,
            350
          ],
          [
            777.5,
            350
          ],
          [
            782.73,
            350
          ],
          [
            787.96,
            350
          ],
          [
            793.18,
            350
          ],
          [
            798.41,
            350
          ],
          [
            803.64,
            350
          ],
          [
            808.86,
            350
          ],
          [
            814.09,
            350
          ],
          [
            819.32,
            350
          ],
          [
            824.54,
            350
          ],
          [
            829.77,
            350
          ],
          [
            835,
            350
          ],
          [
            840.22,
            350
          ],
          [
            845.45,
            350
          ],
          [
            850.68,
            350
          ],
          [
            855.9,
            350
          ],
          [
            861.13,
            350
          ],
          [
            866.36,
            350
          ],
          [
            871.58,
            350
          ],
          [
            876.81,
            350
          ],
          [
            882.04,
            350
          ],
          [
            887.26,
            350
          ],
          [
            892.49,
            350
          ],
          [
            897,
            350.71
          ],
          [
            897,
            355.94
          ],
          [
            897,
            361.17
          ],
          [
            897,
            366.39
          ],
          [
            897,
            371.62
          ],
          [
            897,
            376.85
          ],
          [
            897,
            382.07
          ],
          [
            897,
            387.3
          ],
          [
            897,
            392.53
          ],
          [
            897,
            397.75
          ],
          [
            897,
            402.98
          ],
          [
            897,
            408.21
          ],
          [
            897,
            413.43
          ],
          [
            897,
            418.66
          ],
          [
            897,
            423.89
          ],
          [
            897,
            429.11
          ],
          [
            897,
            434.34
          ],
          [
            897,
            439.57
          ],
          [
            897,
            444.79
          ],
          [
            897,
            450.02
          ],
          [
            897,
            455.25
          ],
          [
            897,
            460.47
          ],
          [
            897,
            465.7
          ],
          [
            897,
            470.93
          ],
          [
            897,
            476.15
          ],
          [
            897,
            481.38
          ],
          [
            897,
            486.61
          ],
          [
            897,
            491.83
          ],
          [
            897,
            497.06
          ],
          [
            897,
            502.29
          ],
          [
            897,
            507.51
          ],
          [
            897,
            512.74
          ],
          [
            897,
            517.96
          ],
          [
            897,
            523.19
          ],
          [
            897,
            528.42
          ],
          [
            897,
            533.64
          ],
          [
            897,
            538.87
          ],
          [
            897,
            544.1
          ],
          [
            897,
            549.32
          ],
          [
            897,
            554.55
          ],
          [
            897,
            559.78
          ],
          [
            897,
            565
          ],
          [
            897,
            570.23
          ],
          [
            897,
            575.46
          ],
          [
            897,
            580.68
          ],
          [
            897,
            585.91
          ],
          [
            897,
            591.14
          ],
          [
            896,
            596.36
          ],
          [
            896,
            601.59
          ],
          [
            896,
            606.82
          ],
          [
            896,
            612.04
          ],
          [
            896,
            617.27
          ],
          [
            896,
            622.5
          ],
          [
            896,
            627.72
          ],
          [
            896,
            632.95
          ],
          [
            896,
            638.18
          ],
          [
            896,
            643.4
          ],
          [
            896,
            648.63
          ],
          [
            896,
            653.86
          ],
          [
            896,
            659.08
          ],
          [
            896,
            664.31
          ],
          [
            896,
            669.54
          ],
          [
            896,
            674.76
          ],
          [
            896,
            679.99
          ],
          [
            896,
            685.21
          ],
          [
            896,
            690.44
          ],
          [
            896,
            695.67
          ],
          [
            896,
            700.89
          ],
          [
            896,
            706.12
          ],
          [
            896,
            711.35
          ],
          [
            896,
            716.57
          ],
          [
            896,
            721.8
          ],
          [
            896,
            727.03
          ],
          [
            896,
            732.25
          ],
          [
            896,
            737.48
          ],
          [
            896,
            742.71
          ],
          [
            896,
            747.93
          ],
          [
            896,
            753.16
          ],
          [
            896,
            758.39
          ],
          [
            894.39,
            781
          ],
          [
            889.16,
            781
          ],
          [
            883.93,
            781
          ],
          [
            878.71,
            781
          ],
          [
            873.48,
            781
          ],
          [
            868.25,
            781
          ],
          [
            863.03,
            781
          ],
          [
            857.8,
            781
          ],
          [
            852.57,
            781
          ],
          [
            847.35,
            781
          ],
          [
            842.12,
            781
          ],
          [
            836.89,
            781
          ],
          [
            831.67,
            781
          ],
          [
            826.44,
            781
          ],
          [
            821.21,
            781
          ],
          [
            815.99,
            781
          ],
          [
            810.76,
            781
          ],
          [
            805.54,
            781
          ],
          [
            800.31,
            781
          ],
          [
            795.08,
            781
          ],
          [
            789.86,
            781
          ],
          [
            784.63,
            781
          ],
          [
            779.4,
            781
          ],
          [
            774.18,
            781
          ],
          [
            768.95,
            781
          ],
          [
            763.72,
            781
          ],
          [
            758.5,
            781
          ],
          [
            753.27,
            781
          ],
          [
            748.04,
            781
          ],
          [
            742.82,
            781
          ],
          [
            737.59,
            781
          ],
          [
            732.36,
            781
          ],
          [
            727.14,
            781
          ],
          [
            721.91,
            781
          ],
          [
            716.68,
            781
          ],
          [
            711.46,
            781
          ],
          [
            706.23,
            781
          ],
          [
            701,
            781
          ],
          [
            695.78,
            781
          ],
          [
            690.55,
            781
          ],
          [
            685.32,
            781
          ],
          [
            680.1,
            781
          ],
          [
            674.87,
            781
          ],
          [
            669.64,
            781
          ],
          [
            664.42,
            781
          ],
          [
            659.19,
            781
          ],
          [
            653.96,
            781
          ],
          [
            648.74,
            781
          ],
          [
            643.51,
            781
          ],
          [
            639,
            760.29
          ],
          [
            639,
            755.06
          ],
          [
            639,
            749.83
          ],
          [
            639,
            744.61
          ],
          [
            639,
            739.38
          ],
          [
            639,
            734.15
          ],
          [
            639,
            728.93
          ],
          [
            639,
            723.7
          ],
          [
            639,
            718.47
          ],
          [
            639,
            713.25
          ],
          [
            639,
            708.02
          ],
          [
            639,
            702.79
          ],
          [
            639,
            697.57
          ],
          [
            639,
            692.34
          ],
          [
            639,
            687.11
          ],
          [
            639,
            681.89
          ],
          [
            639,
            676.66
          ],
          [
            639,
            671.43
          ],
          [
            639,
            666.21
          ],
          [
            639,
            660.98
          ],
          [
            639,
            655.75
          ],
          [
            639,
            650.53
          ],
          [
            639,
            645.3
          ],
          [
            639,
            640.07
          ],
          [
            639,
            634.85
          ],
          [
            639,
            629.62
          ],
          [
            639,
            624.39
          ],
          [
            639,
            619.17
          ],
          [
            639,
            613.94
          ],
          [
            639,
            608.71
          ],
          [
            639,
            603.49
          ],
          [
            639,
            598.26
          ],
          [
            639,
            593.04
          ],
          [
            639,
            587.81
          ],
          [
            639,
            582.58
          ],
          [
            639,
            577.36
          ],
          [
            639,
            572.13
          ],
          [
            639,
            566.9
          ],
          [
            639,
            561.68
          ],
          [
            639,
            556.45
          ],
          [
            639,
            551.22
          ],
          [
            639,
            546
          ],
          [
            639,
            540.77
          ],
          [
            639,
            535.54
          ],
          [
            639,
            530.32
          ],
          [
            639,
            525.09
          ],
          [
            639,
            519.86
          ],
          [
            639,
            514.64
          ],
          [
            639,
            509.41
          ],
          [
            639,
            504.18
          ],
          [
            639,
            498.96
          ],
          [
            639,
            493.73
          ],
          [
            639,
            488.5
          ],
          [
            639,
            483.28
          ],
          [
            639,
            478.05
          ],
          [
            639,
            472.82
          ],
          [
            639,
            467.6
          ],
          [
            639,
            462.37
          ],
          [
            639,
            457.14
          ],
          [
            639,
            451.92
          ],
          [
            639,
            446.69
          ],
          [
            639,
            441.46
          ],
          [
            639,
            436.24
          ],
          [
            639,
            431.01
          ],
          [
            639,
            425.79
          ],
          [
            639,
            420.56
          ],
          [
            639,
            415.33
          ],
          [
            639,
            410.11
          ],
          [
            639,
            404.88
          ],
          [
            639,
            399.65
          ],
          [
            639,
            394.43
          ],
          [
            639,
            389.2
          ],
          [
            639,
            383.97
          ],
          [
            639,
            378.75
          ],
          [
            639,
            373.52
          ],
          [
            639,
            368.29
          ],
          [
            639,
            363.07
          ],
          [
            632,
            357.84
          ],
          [
            632,
            352.61
          ]
        ],
        "corners": [
          [
            639,
            350
          ],
          [
            897.74,
            350
          ],
          [
            895.45,
            781
          ],
          [
            639,
            781
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9927,
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
  "treatment_room/S": {
    "floor_line_y": 0.760228,
    "px_per_m_at_wall": 213.333,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.2,
    "key_tint": "#c8c3bc",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 168,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.2,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 213.33333333333326,
    "corner_x1_px": 1322.6666666666667,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/treatment_room-S/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
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
    "focal_px": 896,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.37,
      "wall_width_m": 5.952,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 5.2,
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
          "scale": 0.88,
          "target_px": 640,
          "source_px": 727
        },
        "revealed_px": 177745,
        "remeasured": {
          "px_per_m_at_wall": 186.667,
          "floor_line_y": 0.749023,
          "corner_x0_px": 213,
          "corner_x1_px": 1324,
          "corner_scale_px_per_m": 213.654
        },
        "warped_from": "backdrops/source/treatment_room-S/row23-8bcadcb4.png",
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
  "treatment_room/W": {
    "floor_line_y": 0.743164,
    "px_per_m_at_wall": 211.111,
    "px_per_m_at_bottom": 462.46,
    "wall_width_m": 6.4,
    "key_tint": "#c8c2b9",
    "image_h_px": 1024,
    "horizon_y": 0.527441,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 190,
    "camera_wall_m": 4.75,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 155,
    "corner_x1_px": 1352,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/treatment_room-W/row23-d1a7cbe0.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1002.8,
    "nearest_floor_m": 2.1684,
    "measured_room": {
      "storey_height_m": 3.136,
      "wall_width_m": 5.67,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            641.3,
            894.7
          ],
          "plan_centre_px": 768,
          "painted_px": [
            635,
            900
          ],
          "painted_centre_px": 767.5,
          "centre_delta_px": -0.5,
          "centre_delta_m": -0.002,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 635,
        "y": 252,
        "w": 265,
        "h": 509,
        "beyond_m": 6.2,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            638.02,
            252
          ],
          [
            644.07,
            252
          ],
          [
            650.12,
            252
          ],
          [
            656.16,
            252
          ],
          [
            662.21,
            252
          ],
          [
            668.26,
            252
          ],
          [
            674.3,
            252
          ],
          [
            680.35,
            252
          ],
          [
            686.4,
            252
          ],
          [
            692.45,
            252
          ],
          [
            698.49,
            252
          ],
          [
            704.54,
            252
          ],
          [
            710.59,
            252
          ],
          [
            716.63,
            252
          ],
          [
            722.68,
            252
          ],
          [
            728.73,
            252
          ],
          [
            734.77,
            252
          ],
          [
            740.82,
            252
          ],
          [
            746.87,
            252
          ],
          [
            752.91,
            252
          ],
          [
            758.96,
            252
          ],
          [
            765.01,
            252
          ],
          [
            771.05,
            252
          ],
          [
            777.1,
            252
          ],
          [
            783.15,
            252
          ],
          [
            789.2,
            252
          ],
          [
            795.24,
            252
          ],
          [
            801.29,
            252
          ],
          [
            807.34,
            252
          ],
          [
            813.38,
            252
          ],
          [
            819.43,
            252
          ],
          [
            825.48,
            252
          ],
          [
            831.52,
            252
          ],
          [
            837.57,
            252
          ],
          [
            843.62,
            252
          ],
          [
            849.66,
            252
          ],
          [
            855.71,
            252
          ],
          [
            861.76,
            252
          ],
          [
            867.8,
            252
          ],
          [
            873.85,
            252
          ],
          [
            879.9,
            252
          ],
          [
            885.95,
            252
          ],
          [
            891.99,
            252
          ],
          [
            898.04,
            252
          ],
          [
            900,
            256.09
          ],
          [
            900,
            262.13
          ],
          [
            900,
            268.18
          ],
          [
            900,
            274.23
          ],
          [
            900,
            280.27
          ],
          [
            900,
            286.32
          ],
          [
            900,
            292.37
          ],
          [
            900,
            298.41
          ],
          [
            900,
            304.46
          ],
          [
            900,
            310.51
          ],
          [
            900,
            316.55
          ],
          [
            900,
            322.6
          ],
          [
            900,
            328.65
          ],
          [
            900,
            334.7
          ],
          [
            900,
            340.74
          ],
          [
            900,
            346.79
          ],
          [
            900,
            352.84
          ],
          [
            900,
            358.88
          ],
          [
            900,
            364.93
          ],
          [
            900,
            370.98
          ],
          [
            900,
            377.02
          ],
          [
            899,
            383.07
          ],
          [
            899,
            389.12
          ],
          [
            899,
            395.16
          ],
          [
            899,
            401.21
          ],
          [
            899,
            407.26
          ],
          [
            899,
            413.3
          ],
          [
            899,
            419.35
          ],
          [
            899,
            425.4
          ],
          [
            899,
            431.45
          ],
          [
            899,
            437.49
          ],
          [
            899,
            443.54
          ],
          [
            899,
            449.59
          ],
          [
            899,
            455.63
          ],
          [
            899,
            461.68
          ],
          [
            899,
            467.73
          ],
          [
            899,
            473.77
          ],
          [
            899,
            479.82
          ],
          [
            899,
            485.87
          ],
          [
            899,
            491.91
          ],
          [
            899,
            497.96
          ],
          [
            899,
            504.01
          ],
          [
            899,
            510.05
          ],
          [
            899,
            516.1
          ],
          [
            899,
            522.15
          ],
          [
            899,
            528.2
          ],
          [
            899,
            534.24
          ],
          [
            899,
            540.29
          ],
          [
            899,
            546.34
          ],
          [
            899,
            552.38
          ],
          [
            899,
            558.43
          ],
          [
            899,
            564.48
          ],
          [
            899,
            570.52
          ],
          [
            899,
            576.57
          ],
          [
            899,
            582.62
          ],
          [
            899,
            588.66
          ],
          [
            899,
            594.71
          ],
          [
            899,
            600.76
          ],
          [
            899,
            606.8
          ],
          [
            899,
            612.85
          ],
          [
            899,
            618.9
          ],
          [
            899,
            624.95
          ],
          [
            899,
            630.99
          ],
          [
            899,
            637.04
          ],
          [
            899,
            643.09
          ],
          [
            899,
            649.13
          ],
          [
            899,
            655.18
          ],
          [
            899,
            661.23
          ],
          [
            899,
            667.27
          ],
          [
            899,
            673.32
          ],
          [
            899,
            679.37
          ],
          [
            899,
            685.41
          ],
          [
            899,
            691.46
          ],
          [
            899,
            697.51
          ],
          [
            899,
            703.55
          ],
          [
            899,
            709.6
          ],
          [
            899,
            715.65
          ],
          [
            899,
            721.7
          ],
          [
            899,
            727.74
          ],
          [
            899,
            733.79
          ],
          [
            899,
            739.84
          ],
          [
            899,
            745.88
          ],
          [
            899,
            751.93
          ],
          [
            899,
            757.98
          ],
          [
            896.98,
            761
          ],
          [
            890.93,
            761
          ],
          [
            884.88,
            761
          ],
          [
            878.84,
            761
          ],
          [
            872.79,
            761
          ],
          [
            866.74,
            761
          ],
          [
            860.7,
            761
          ],
          [
            854.65,
            761
          ],
          [
            848.6,
            761
          ],
          [
            842.55,
            761
          ],
          [
            836.51,
            761
          ],
          [
            830.46,
            761
          ],
          [
            824.41,
            761
          ],
          [
            818.37,
            761
          ],
          [
            812.32,
            761
          ],
          [
            806.27,
            761
          ],
          [
            800.23,
            761
          ],
          [
            794.18,
            761
          ],
          [
            788.13,
            761
          ],
          [
            782.09,
            761
          ],
          [
            776.04,
            761
          ],
          [
            769.99,
            761
          ],
          [
            763.95,
            761
          ],
          [
            757.9,
            761
          ],
          [
            751.85,
            761
          ],
          [
            745.8,
            761
          ],
          [
            739.76,
            761
          ],
          [
            733.71,
            761
          ],
          [
            727.66,
            761
          ],
          [
            721.62,
            761
          ],
          [
            715.57,
            761
          ],
          [
            709.52,
            761
          ],
          [
            703.48,
            761
          ],
          [
            697.43,
            761
          ],
          [
            691.38,
            761
          ],
          [
            685.34,
            761
          ],
          [
            679.29,
            761
          ],
          [
            673.24,
            761
          ],
          [
            667.2,
            761
          ],
          [
            661.15,
            761
          ],
          [
            655.1,
            761
          ],
          [
            649.05,
            761
          ],
          [
            643.01,
            761
          ],
          [
            636.96,
            761
          ],
          [
            635,
            756.91
          ],
          [
            635,
            750.87
          ],
          [
            635,
            744.82
          ],
          [
            635,
            738.77
          ],
          [
            635,
            732.73
          ],
          [
            635,
            726.68
          ],
          [
            635,
            720.63
          ],
          [
            635,
            714.59
          ],
          [
            635,
            708.54
          ],
          [
            635,
            702.49
          ],
          [
            635,
            696.45
          ],
          [
            635,
            690.4
          ],
          [
            635,
            684.35
          ],
          [
            635,
            678.3
          ],
          [
            635,
            672.26
          ],
          [
            635,
            666.21
          ],
          [
            635,
            660.16
          ],
          [
            635,
            654.12
          ],
          [
            635,
            648.07
          ],
          [
            635,
            642.02
          ],
          [
            635,
            635.98
          ],
          [
            635,
            629.93
          ],
          [
            635,
            623.88
          ],
          [
            635,
            617.84
          ],
          [
            635,
            611.79
          ],
          [
            635,
            605.74
          ],
          [
            635,
            599.7
          ],
          [
            635,
            593.65
          ],
          [
            635,
            587.6
          ],
          [
            635,
            581.55
          ],
          [
            635,
            575.51
          ],
          [
            635,
            569.46
          ],
          [
            635,
            563.41
          ],
          [
            635,
            557.37
          ],
          [
            635,
            551.32
          ],
          [
            635,
            545.27
          ],
          [
            635,
            539.23
          ],
          [
            635,
            533.18
          ],
          [
            635,
            527.13
          ],
          [
            635,
            521.09
          ],
          [
            635,
            515.04
          ],
          [
            635,
            508.99
          ],
          [
            635,
            502.95
          ],
          [
            635,
            496.9
          ],
          [
            635,
            490.85
          ],
          [
            635,
            484.8
          ],
          [
            635,
            478.76
          ],
          [
            635,
            472.71
          ],
          [
            635,
            466.66
          ],
          [
            635,
            460.62
          ],
          [
            635,
            454.57
          ],
          [
            635,
            448.52
          ],
          [
            635,
            442.48
          ],
          [
            635,
            436.43
          ],
          [
            635,
            430.38
          ],
          [
            635,
            424.34
          ],
          [
            635,
            418.29
          ],
          [
            635,
            412.24
          ],
          [
            635,
            406.2
          ],
          [
            635,
            400.15
          ],
          [
            635,
            394.1
          ],
          [
            635,
            388.05
          ],
          [
            635,
            382.01
          ],
          [
            635,
            375.96
          ],
          [
            635,
            369.91
          ],
          [
            635,
            363.87
          ],
          [
            635,
            357.82
          ],
          [
            635,
            351.77
          ],
          [
            635,
            345.73
          ],
          [
            635,
            339.68
          ],
          [
            635,
            333.63
          ],
          [
            635,
            327.59
          ],
          [
            635,
            321.54
          ],
          [
            635,
            315.49
          ],
          [
            635,
            309.45
          ],
          [
            635,
            303.4
          ],
          [
            635,
            297.35
          ],
          [
            635,
            291.3
          ],
          [
            635,
            285.26
          ],
          [
            635,
            279.21
          ],
          [
            635,
            273.16
          ],
          [
            635,
            267.12
          ],
          [
            635,
            261.07
          ],
          [
            635,
            255.02
          ]
        ],
        "corners": [
          [
            635,
            252
          ],
          [
            899.52,
            252
          ],
          [
            898.67,
            761
          ],
          [
            635,
            761
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9981,
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
  "ward/N": {
    "floor_line_y": 0.75293,
    "px_per_m_at_wall": 222.222,
    "px_per_m_at_bottom": 430.92,
    "wall_width_m": 6.8,
    "key_tint": "#c8c0b6",
    "image_h_px": 1024,
    "horizon_y": 0.489844,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 200,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 119,
    "corner_x1_px": 1430,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/ward-N/row23-72a53369.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1066.7,
    "nearest_floor_m": 2.4753,
    "measured_room": {
      "storey_height_m": 3.218,
      "wall_width_m": 5.9,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6.8,
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
  "ward/E": {
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 200,
    "px_per_m_at_bottom": 415.94,
    "wall_width_m": 6.4,
    "key_tint": "#c8c1ba",
    "image_h_px": 1024,
    "horizon_y": 0.482715,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 180,
    "camera_wall_m": 5.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 174,
    "corner_x1_px": 1367,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/ward-E/row23-cc91eb7f.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1020,
    "nearest_floor_m": 2.4523,
    "measured_room": {
      "storey_height_m": 3.115,
      "wall_width_m": 5.965,
      "ruled_storey_height_m": 3,
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
  "ward/S": {
    "floor_line_y": 0.753906,
    "px_per_m_at_wall": 222.222,
    "px_per_m_at_bottom": 459.61,
    "wall_width_m": 6.8,
    "key_tint": "#c8c3bd",
    "image_h_px": 1024,
    "horizon_y": 0.523535,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 200,
    "camera_wall_m": 4.8,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 101,
    "corner_x1_px": 1439,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/ward-S/row23-90e3ccad.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1066.7,
    "nearest_floor_m": 2.3208,
    "measured_room": {
      "storey_height_m": 3.132,
      "wall_width_m": 6.021,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6.8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            545.8,
            990.2
          ],
          "plan_centre_px": 768,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": [],
    "windows": [
      {
        "id": "win03",
        "kind": "window",
        "x": 573.24,
        "y": 305.33,
        "w": 393.53,
        "h": 266.67,
        "sill_m": 0.9,
        "head_m": 2.1,
        "measured": false
      }
    ],
    "window_evidence": {
      "unpainted": 1,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 1,
      "painted": 0,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "ward/W": {
    "floor_line_y": 0.726562,
    "px_per_m_at_wall": 194.444,
    "px_per_m_at_bottom": 450.17,
    "wall_width_m": 6.4,
    "key_tint": "#c8bda0",
    "image_h_px": 1024,
    "horizon_y": 0.518652,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 175,
    "camera_wall_m": 5.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 123,
    "corner_x1_px": 1411,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source/ward-W/row23-647d9ce1.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 991.7,
    "nearest_floor_m": 2.2029,
    "measured_room": {
      "storey_height_m": 3.034,
      "wall_width_m": 6.624,
      "ruled_storey_height_m": 3,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            651.3,
            884.7
          ],
          "plan_centre_px": 768,
          "painted_px": [
            652,
            889
          ],
          "painted_centre_px": 770.5,
          "centre_delta_px": 2.5,
          "centre_delta_m": 0.013,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 649,
        "y": 296,
        "w": 243,
        "h": 448,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            654.68,
            296
          ],
          [
            660.03,
            296
          ],
          [
            665.38,
            296
          ],
          [
            670.73,
            296
          ],
          [
            676.08,
            296
          ],
          [
            681.43,
            296
          ],
          [
            686.79,
            296
          ],
          [
            692.14,
            296
          ],
          [
            697.49,
            296
          ],
          [
            702.84,
            296
          ],
          [
            708.19,
            296
          ],
          [
            713.54,
            296
          ],
          [
            718.89,
            296
          ],
          [
            724.25,
            296
          ],
          [
            729.6,
            296
          ],
          [
            734.95,
            296
          ],
          [
            740.3,
            296
          ],
          [
            745.65,
            296
          ],
          [
            751,
            296
          ],
          [
            756.36,
            296
          ],
          [
            761.71,
            296
          ],
          [
            767.06,
            296
          ],
          [
            772.41,
            296
          ],
          [
            777.76,
            296
          ],
          [
            783.11,
            296
          ],
          [
            788.46,
            296
          ],
          [
            793.82,
            296
          ],
          [
            799.17,
            296
          ],
          [
            804.52,
            296
          ],
          [
            809.87,
            296
          ],
          [
            815.22,
            296
          ],
          [
            820.57,
            296
          ],
          [
            825.93,
            296
          ],
          [
            831.28,
            296
          ],
          [
            836.63,
            296
          ],
          [
            841.98,
            296
          ],
          [
            847.33,
            296
          ],
          [
            852.68,
            296
          ],
          [
            858.04,
            296
          ],
          [
            863.39,
            296
          ],
          [
            868.74,
            296
          ],
          [
            874.09,
            296
          ],
          [
            879.44,
            296
          ],
          [
            884.79,
            296
          ],
          [
            891,
            297.14
          ],
          [
            891,
            302.5
          ],
          [
            889,
            307.85
          ],
          [
            889,
            313.2
          ],
          [
            889,
            318.55
          ],
          [
            889,
            323.9
          ],
          [
            889,
            329.25
          ],
          [
            889,
            334.61
          ],
          [
            889,
            339.96
          ],
          [
            889,
            345.31
          ],
          [
            889,
            350.66
          ],
          [
            889,
            356.01
          ],
          [
            889,
            361.36
          ],
          [
            889,
            366.71
          ],
          [
            889,
            372.07
          ],
          [
            889,
            377.42
          ],
          [
            889,
            382.77
          ],
          [
            889,
            388.12
          ],
          [
            889,
            393.47
          ],
          [
            889,
            398.82
          ],
          [
            889,
            404.18
          ],
          [
            889,
            409.53
          ],
          [
            889,
            414.88
          ],
          [
            889,
            420.23
          ],
          [
            889,
            425.58
          ],
          [
            889,
            430.93
          ],
          [
            889,
            436.29
          ],
          [
            889,
            441.64
          ],
          [
            889,
            446.99
          ],
          [
            889,
            452.34
          ],
          [
            889,
            457.69
          ],
          [
            889,
            463.04
          ],
          [
            889,
            468.39
          ],
          [
            889,
            473.75
          ],
          [
            889,
            479.1
          ],
          [
            889,
            484.45
          ],
          [
            889,
            489.8
          ],
          [
            889,
            495.15
          ],
          [
            889,
            500.5
          ],
          [
            889,
            505.86
          ],
          [
            889,
            511.21
          ],
          [
            889,
            516.56
          ],
          [
            889,
            521.91
          ],
          [
            889,
            527.26
          ],
          [
            889,
            532.61
          ],
          [
            889,
            537.96
          ],
          [
            889,
            543.32
          ],
          [
            889,
            548.67
          ],
          [
            889,
            554.02
          ],
          [
            889,
            559.37
          ],
          [
            889,
            564.72
          ],
          [
            889,
            570.07
          ],
          [
            889,
            575.43
          ],
          [
            889,
            580.78
          ],
          [
            889,
            586.13
          ],
          [
            889,
            591.48
          ],
          [
            889,
            596.83
          ],
          [
            889,
            602.18
          ],
          [
            889,
            607.54
          ],
          [
            889,
            612.89
          ],
          [
            889,
            618.24
          ],
          [
            889,
            623.59
          ],
          [
            889,
            628.94
          ],
          [
            889,
            634.29
          ],
          [
            889,
            639.64
          ],
          [
            889,
            645
          ],
          [
            889,
            650.35
          ],
          [
            889,
            655.7
          ],
          [
            889,
            661.05
          ],
          [
            889,
            666.4
          ],
          [
            889,
            671.75
          ],
          [
            889,
            677.11
          ],
          [
            889,
            682.46
          ],
          [
            889,
            687.81
          ],
          [
            889,
            693.16
          ],
          [
            889,
            698.51
          ],
          [
            889,
            703.86
          ],
          [
            889,
            709.21
          ],
          [
            889,
            714.57
          ],
          [
            889,
            719.92
          ],
          [
            889,
            725.27
          ],
          [
            892,
            730.62
          ],
          [
            892,
            735.97
          ],
          [
            892,
            741.32
          ],
          [
            886.32,
            744
          ],
          [
            880.97,
            744
          ],
          [
            875.62,
            744
          ],
          [
            870.27,
            744
          ],
          [
            864.92,
            744
          ],
          [
            859.57,
            744
          ],
          [
            854.21,
            744
          ],
          [
            848.86,
            744
          ],
          [
            843.51,
            744
          ],
          [
            838.16,
            744
          ],
          [
            832.81,
            744
          ],
          [
            827.46,
            744
          ],
          [
            822.11,
            744
          ],
          [
            816.75,
            744
          ],
          [
            811.4,
            744
          ],
          [
            806.05,
            744
          ],
          [
            800.7,
            744
          ],
          [
            795.35,
            744
          ],
          [
            790,
            744
          ],
          [
            784.64,
            744
          ],
          [
            779.29,
            744
          ],
          [
            773.94,
            744
          ],
          [
            768.59,
            744
          ],
          [
            763.24,
            744
          ],
          [
            757.89,
            744
          ],
          [
            752.54,
            744
          ],
          [
            747.18,
            744
          ],
          [
            741.83,
            744
          ],
          [
            736.48,
            744
          ],
          [
            731.13,
            744
          ],
          [
            725.78,
            744
          ],
          [
            720.43,
            744
          ],
          [
            715.07,
            744
          ],
          [
            709.72,
            744
          ],
          [
            704.37,
            744
          ],
          [
            699.02,
            744
          ],
          [
            693.67,
            744
          ],
          [
            688.32,
            744
          ],
          [
            682.96,
            744
          ],
          [
            677.61,
            744
          ],
          [
            672.26,
            744
          ],
          [
            666.91,
            744
          ],
          [
            661.56,
            744
          ],
          [
            656.21,
            744
          ],
          [
            649,
            742.86
          ],
          [
            649,
            737.5
          ],
          [
            649,
            732.15
          ],
          [
            649,
            726.8
          ],
          [
            649,
            721.45
          ],
          [
            652,
            716.1
          ],
          [
            652,
            710.75
          ],
          [
            652,
            705.39
          ],
          [
            652,
            700.04
          ],
          [
            652,
            694.69
          ],
          [
            652,
            689.34
          ],
          [
            652,
            683.99
          ],
          [
            652,
            678.64
          ],
          [
            652,
            673.29
          ],
          [
            652,
            667.93
          ],
          [
            652,
            662.58
          ],
          [
            652,
            657.23
          ],
          [
            652,
            651.88
          ],
          [
            652,
            646.53
          ],
          [
            652,
            641.18
          ],
          [
            652,
            635.82
          ],
          [
            652,
            630.47
          ],
          [
            652,
            625.12
          ],
          [
            652,
            619.77
          ],
          [
            652,
            614.42
          ],
          [
            652,
            609.07
          ],
          [
            652,
            603.71
          ],
          [
            652,
            598.36
          ],
          [
            652,
            593.01
          ],
          [
            652,
            587.66
          ],
          [
            652,
            582.31
          ],
          [
            652,
            576.96
          ],
          [
            652,
            571.61
          ],
          [
            652,
            566.25
          ],
          [
            652,
            560.9
          ],
          [
            652,
            555.55
          ],
          [
            652,
            550.2
          ],
          [
            652,
            544.85
          ],
          [
            652,
            539.5
          ],
          [
            652,
            534.14
          ],
          [
            652,
            528.79
          ],
          [
            652,
            523.44
          ],
          [
            652,
            518.09
          ],
          [
            652,
            512.74
          ],
          [
            652,
            507.39
          ],
          [
            652,
            502.04
          ],
          [
            652,
            496.68
          ],
          [
            652,
            491.33
          ],
          [
            652,
            485.98
          ],
          [
            652,
            480.63
          ],
          [
            652,
            475.28
          ],
          [
            652,
            469.93
          ],
          [
            652,
            464.57
          ],
          [
            652,
            459.22
          ],
          [
            652,
            453.87
          ],
          [
            652,
            448.52
          ],
          [
            652,
            443.17
          ],
          [
            652,
            437.82
          ],
          [
            652,
            432.46
          ],
          [
            652,
            427.11
          ],
          [
            652,
            421.76
          ],
          [
            652,
            416.41
          ],
          [
            652,
            411.06
          ],
          [
            652,
            405.71
          ],
          [
            652,
            400.36
          ],
          [
            652,
            395
          ],
          [
            652,
            389.65
          ],
          [
            652,
            384.3
          ],
          [
            652,
            378.95
          ],
          [
            652,
            373.6
          ],
          [
            652,
            368.25
          ],
          [
            652,
            362.89
          ],
          [
            652,
            357.54
          ],
          [
            652,
            352.19
          ],
          [
            652,
            346.84
          ],
          [
            652,
            341.49
          ],
          [
            652,
            336.14
          ],
          [
            652,
            330.79
          ],
          [
            652,
            325.43
          ],
          [
            652,
            320.08
          ],
          [
            652,
            314.73
          ],
          [
            652,
            309.38
          ],
          [
            652,
            304.03
          ],
          [
            649,
            298.68
          ]
        ],
        "corners": [
          [
            652,
            296
          ],
          [
            889,
            296
          ],
          [
            889,
            744
          ],
          [
            652,
            744
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9931,
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
