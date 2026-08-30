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
  fp: "dede0736",
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
    "calibration_px": 179,
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
    "focal_px": 954.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.665,
      "wall_width_m": 6.436,
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
          "axis": "y",
          "name": "ceiling_line..floor_line",
          "scale": 1.067,
          "target_px": 640,
          "source_px": 600
        },
        "revealed_px": 32256,
        "remeasured": {
          "px_per_m_at_wall": 198.889,
          "floor_line_y": 0.759766,
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
    "calibration_px": 198,
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
    "focal_px": 990,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 2.896,
      "wall_width_m": 6.605,
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
          "scale": 1.11,
          "target_px": 591.6,
          "source_px": 533
        },
        "revealed_px": 124416,
        "remeasured": {
          "px_per_m_at_wall": 220,
          "floor_line_y": 0.776367,
          "corner_x0_px": 40,
          "corner_x1_px": 1493,
          "corner_scale_px_per_m": 227.031
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
            628,
            906
          ],
          "painted_centre_px": 767,
          "centre_delta_px": -1,
          "centre_delta_m": -0.004,
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
        "w": 285,
        "h": 455,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            630.86,
            340
          ],
          [
            636.59,
            340
          ],
          [
            642.32,
            340
          ],
          [
            648.04,
            340
          ],
          [
            653.77,
            340
          ],
          [
            659.5,
            340
          ],
          [
            665.22,
            340
          ],
          [
            670.95,
            340
          ],
          [
            676.68,
            340
          ],
          [
            682.4,
            340
          ],
          [
            688.13,
            340
          ],
          [
            693.86,
            340
          ],
          [
            699.58,
            340
          ],
          [
            705.31,
            340
          ],
          [
            711.04,
            340
          ],
          [
            716.76,
            340
          ],
          [
            722.49,
            340
          ],
          [
            728.21,
            340
          ],
          [
            733.94,
            340
          ],
          [
            739.67,
            340
          ],
          [
            745.39,
            340
          ],
          [
            751.12,
            340
          ],
          [
            756.85,
            340
          ],
          [
            762.57,
            340
          ],
          [
            768.3,
            340
          ],
          [
            774.03,
            340
          ],
          [
            779.75,
            340
          ],
          [
            785.48,
            340
          ],
          [
            791.21,
            340
          ],
          [
            796.93,
            340
          ],
          [
            802.66,
            340
          ],
          [
            808.39,
            340
          ],
          [
            814.11,
            340
          ],
          [
            819.84,
            340
          ],
          [
            825.57,
            340
          ],
          [
            831.29,
            340
          ],
          [
            837.02,
            340
          ],
          [
            842.75,
            340
          ],
          [
            848.47,
            340
          ],
          [
            854.2,
            340
          ],
          [
            859.93,
            340
          ],
          [
            865.65,
            340
          ],
          [
            871.38,
            340
          ],
          [
            877.11,
            340
          ],
          [
            882.83,
            340
          ],
          [
            888.56,
            340
          ],
          [
            894.29,
            340
          ],
          [
            900.01,
            340
          ],
          [
            905.74,
            340
          ],
          [
            909,
            345.46
          ],
          [
            909,
            351.19
          ],
          [
            906,
            356.92
          ],
          [
            906,
            362.64
          ],
          [
            906,
            368.37
          ],
          [
            906,
            374.1
          ],
          [
            906,
            379.82
          ],
          [
            906,
            385.55
          ],
          [
            906,
            391.28
          ],
          [
            906,
            397
          ],
          [
            906,
            402.73
          ],
          [
            906,
            408.46
          ],
          [
            906,
            414.18
          ],
          [
            906,
            419.91
          ],
          [
            906,
            425.64
          ],
          [
            906,
            431.36
          ],
          [
            906,
            437.09
          ],
          [
            906,
            442.82
          ],
          [
            906,
            448.54
          ],
          [
            906,
            454.27
          ],
          [
            906,
            460
          ],
          [
            906,
            465.72
          ],
          [
            906,
            471.45
          ],
          [
            906,
            477.18
          ],
          [
            906,
            482.9
          ],
          [
            906,
            488.63
          ],
          [
            906,
            494.36
          ],
          [
            906,
            500.08
          ],
          [
            906,
            505.81
          ],
          [
            906,
            511.54
          ],
          [
            906,
            517.26
          ],
          [
            906,
            522.99
          ],
          [
            906,
            528.71
          ],
          [
            906,
            534.44
          ],
          [
            906,
            540.17
          ],
          [
            906,
            545.89
          ],
          [
            906,
            551.62
          ],
          [
            906,
            557.35
          ],
          [
            906,
            563.07
          ],
          [
            906,
            568.8
          ],
          [
            906,
            574.53
          ],
          [
            906,
            580.25
          ],
          [
            906,
            585.98
          ],
          [
            906,
            591.71
          ],
          [
            906,
            597.43
          ],
          [
            906,
            603.16
          ],
          [
            906,
            608.89
          ],
          [
            906,
            614.61
          ],
          [
            906,
            620.34
          ],
          [
            906,
            626.07
          ],
          [
            906,
            631.79
          ],
          [
            906,
            637.52
          ],
          [
            906,
            643.25
          ],
          [
            906,
            648.97
          ],
          [
            906,
            654.7
          ],
          [
            906,
            660.43
          ],
          [
            906,
            666.15
          ],
          [
            906,
            671.88
          ],
          [
            906,
            677.61
          ],
          [
            906,
            683.33
          ],
          [
            906,
            689.06
          ],
          [
            906,
            694.79
          ],
          [
            906,
            700.51
          ],
          [
            906,
            706.24
          ],
          [
            906,
            711.96
          ],
          [
            906,
            717.69
          ],
          [
            906,
            723.42
          ],
          [
            906,
            729.14
          ],
          [
            906,
            734.87
          ],
          [
            906,
            740.6
          ],
          [
            906,
            746.32
          ],
          [
            906,
            752.05
          ],
          [
            906,
            757.78
          ],
          [
            906,
            763.5
          ],
          [
            906,
            769.23
          ],
          [
            906,
            774.96
          ],
          [
            906,
            780.68
          ],
          [
            906,
            786.41
          ],
          [
            906,
            792.14
          ],
          [
            903.14,
            795
          ],
          [
            897.41,
            795
          ],
          [
            891.68,
            795
          ],
          [
            885.96,
            795
          ],
          [
            880.23,
            795
          ],
          [
            874.5,
            795
          ],
          [
            868.78,
            795
          ],
          [
            863.05,
            795
          ],
          [
            857.32,
            795
          ],
          [
            851.6,
            795
          ],
          [
            845.87,
            795
          ],
          [
            840.14,
            795
          ],
          [
            834.42,
            795
          ],
          [
            828.69,
            795
          ],
          [
            822.96,
            795
          ],
          [
            817.24,
            795
          ],
          [
            811.51,
            795
          ],
          [
            805.79,
            795
          ],
          [
            800.06,
            795
          ],
          [
            794.33,
            795
          ],
          [
            788.61,
            795
          ],
          [
            782.88,
            795
          ],
          [
            777.15,
            795
          ],
          [
            771.43,
            795
          ],
          [
            765.7,
            795
          ],
          [
            759.97,
            795
          ],
          [
            754.25,
            795
          ],
          [
            748.52,
            795
          ],
          [
            742.79,
            795
          ],
          [
            737.07,
            795
          ],
          [
            731.34,
            795
          ],
          [
            725.61,
            795
          ],
          [
            719.89,
            795
          ],
          [
            714.16,
            795
          ],
          [
            708.43,
            795
          ],
          [
            702.71,
            795
          ],
          [
            696.98,
            795
          ],
          [
            691.25,
            795
          ],
          [
            685.53,
            795
          ],
          [
            679.8,
            795
          ],
          [
            674.07,
            795
          ],
          [
            668.35,
            795
          ],
          [
            662.62,
            795
          ],
          [
            656.89,
            795
          ],
          [
            651.17,
            795
          ],
          [
            645.44,
            795
          ],
          [
            639.71,
            795
          ],
          [
            633.99,
            795
          ],
          [
            628.26,
            795
          ],
          [
            628,
            789.54
          ],
          [
            628,
            783.81
          ],
          [
            628,
            778.08
          ],
          [
            628,
            772.36
          ],
          [
            628,
            766.63
          ],
          [
            628,
            760.9
          ],
          [
            628,
            755.18
          ],
          [
            628,
            749.45
          ],
          [
            628,
            743.72
          ],
          [
            628,
            738
          ],
          [
            628,
            732.27
          ],
          [
            628,
            726.54
          ],
          [
            628,
            720.82
          ],
          [
            628,
            715.09
          ],
          [
            628,
            709.36
          ],
          [
            628,
            703.64
          ],
          [
            628,
            697.91
          ],
          [
            628,
            692.18
          ],
          [
            628,
            686.46
          ],
          [
            628,
            680.73
          ],
          [
            628,
            675
          ],
          [
            628,
            669.28
          ],
          [
            628,
            663.55
          ],
          [
            628,
            657.82
          ],
          [
            628,
            652.1
          ],
          [
            628,
            646.37
          ],
          [
            628,
            640.64
          ],
          [
            628,
            634.92
          ],
          [
            628,
            629.19
          ],
          [
            628,
            623.46
          ],
          [
            628,
            617.74
          ],
          [
            628,
            612.01
          ],
          [
            628,
            606.29
          ],
          [
            628,
            600.56
          ],
          [
            628,
            594.83
          ],
          [
            628,
            589.11
          ],
          [
            628,
            583.38
          ],
          [
            628,
            577.65
          ],
          [
            628,
            571.93
          ],
          [
            628,
            566.2
          ],
          [
            628,
            560.47
          ],
          [
            628,
            554.75
          ],
          [
            628,
            549.02
          ],
          [
            628,
            543.29
          ],
          [
            628,
            537.57
          ],
          [
            628,
            531.84
          ],
          [
            628,
            526.11
          ],
          [
            628,
            520.39
          ],
          [
            628,
            514.66
          ],
          [
            628,
            508.93
          ],
          [
            628,
            503.21
          ],
          [
            628,
            497.48
          ],
          [
            628,
            491.75
          ],
          [
            628,
            486.03
          ],
          [
            628,
            480.3
          ],
          [
            628,
            474.57
          ],
          [
            628,
            468.85
          ],
          [
            628,
            463.12
          ],
          [
            628,
            457.39
          ],
          [
            628,
            451.67
          ],
          [
            628,
            445.94
          ],
          [
            628,
            440.21
          ],
          [
            628,
            434.49
          ],
          [
            628,
            428.76
          ],
          [
            628,
            423.04
          ],
          [
            628,
            417.31
          ],
          [
            628,
            411.58
          ],
          [
            628,
            405.86
          ],
          [
            628,
            400.13
          ],
          [
            628,
            394.4
          ],
          [
            628,
            388.68
          ],
          [
            628,
            382.95
          ],
          [
            628,
            377.22
          ],
          [
            628,
            371.5
          ],
          [
            628,
            365.77
          ],
          [
            628,
            360.04
          ],
          [
            628,
            354.32
          ],
          [
            624,
            348.59
          ],
          [
            624,
            342.86
          ]
        ],
        "corners": [
          [
            628,
            340
          ],
          [
            906,
            340
          ],
          [
            906,
            795
          ],
          [
            628,
            795
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9971,
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
    "floor_line_y": 0.740234,
    "px_per_m_at_wall": 207.778,
    "px_per_m_at_bottom": 413.85,
    "wall_width_m": 6,
    "key_tint": "#c8c7c2",
    "image_h_px": 1024,
    "horizon_y": 0.47832,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 187,
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
    "focal_px": 997.3,
    "nearest_floor_m": 2.4099,
    "measured_room": {
      "storey_height_m": 3.225,
      "wall_width_m": 6.083,
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
    "floor_line_y": 0.750977,
    "px_per_m_at_wall": 216.667,
    "px_per_m_at_bottom": 393.41,
    "wall_width_m": 6.4,
    "key_tint": "#c8c5ba",
    "image_h_px": 1024,
    "horizon_y": 0.445703,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 195,
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
    "focal_px": 975,
    "nearest_floor_m": 2.4783,
    "measured_room": {
      "storey_height_m": 3.134,
      "wall_width_m": 6.503,
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
    "calibration_px": 179,
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
    "focal_px": 954.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.359,
      "wall_width_m": 5.581,
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
          "scale": 0.935,
          "target_px": 1109.3,
          "source_px": 1187
        },
        "revealed_px": 165265,
        "remeasured": {
          "px_per_m_at_wall": 198.889,
          "floor_line_y": 0.744141,
          "corner_x0_px": 213,
          "corner_x1_px": 1323,
          "corner_scale_px_per_m": 213.462
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
    "calibration_px": 173,
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
    "focal_px": 913.1,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.288,
      "wall_width_m": 7.226,
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
          "scale": 1.265,
          "target_px": 560.5,
          "source_px": 443
        },
        "revealed_px": 99840,
        "remeasured": {
          "px_per_m_at_wall": 192.222,
          "floor_line_y": 0.750977,
          "corner_x0_px": 73,
          "corner_x1_px": 1462,
          "corner_scale_px_per_m": 217.031
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
            903
          ],
          "painted_centre_px": 771,
          "centre_delta_px": 3,
          "centre_delta_m": 0.014,
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
        "w": 271,
        "h": 431,
        "beyond_m": 7,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            641.67,
            350
          ],
          [
            647,
            350
          ],
          [
            652.34,
            350
          ],
          [
            657.68,
            350
          ],
          [
            663.01,
            350
          ],
          [
            668.35,
            350
          ],
          [
            673.68,
            350
          ],
          [
            679.02,
            350
          ],
          [
            684.36,
            350
          ],
          [
            689.69,
            350
          ],
          [
            695.03,
            350
          ],
          [
            700.36,
            350
          ],
          [
            705.7,
            350
          ],
          [
            711.04,
            350
          ],
          [
            716.37,
            350
          ],
          [
            721.71,
            350
          ],
          [
            727.04,
            350
          ],
          [
            732.38,
            350
          ],
          [
            737.71,
            350
          ],
          [
            743.05,
            350
          ],
          [
            748.39,
            350
          ],
          [
            753.72,
            350
          ],
          [
            759.06,
            350
          ],
          [
            764.39,
            350
          ],
          [
            769.73,
            350
          ],
          [
            775.07,
            350
          ],
          [
            780.4,
            350
          ],
          [
            785.74,
            350
          ],
          [
            791.07,
            350
          ],
          [
            796.41,
            350
          ],
          [
            801.75,
            350
          ],
          [
            807.08,
            350
          ],
          [
            812.42,
            350
          ],
          [
            817.75,
            350
          ],
          [
            823.09,
            350
          ],
          [
            828.43,
            350
          ],
          [
            833.76,
            350
          ],
          [
            839.1,
            350
          ],
          [
            844.43,
            350
          ],
          [
            849.77,
            350
          ],
          [
            855.11,
            350
          ],
          [
            860.44,
            350
          ],
          [
            865.78,
            350
          ],
          [
            871.11,
            350
          ],
          [
            876.45,
            350
          ],
          [
            881.79,
            350
          ],
          [
            887.12,
            350
          ],
          [
            892.46,
            350
          ],
          [
            897.79,
            350
          ],
          [
            903,
            350.13
          ],
          [
            903,
            355.46
          ],
          [
            903,
            360.8
          ],
          [
            903,
            366.14
          ],
          [
            903,
            371.47
          ],
          [
            903,
            376.81
          ],
          [
            903,
            382.14
          ],
          [
            903,
            387.48
          ],
          [
            903,
            392.82
          ],
          [
            903,
            398.15
          ],
          [
            903,
            403.49
          ],
          [
            903,
            408.82
          ],
          [
            903,
            414.16
          ],
          [
            903,
            419.5
          ],
          [
            903,
            424.83
          ],
          [
            903,
            430.17
          ],
          [
            903,
            435.5
          ],
          [
            903,
            440.84
          ],
          [
            903,
            446.18
          ],
          [
            903,
            451.51
          ],
          [
            903,
            456.85
          ],
          [
            903,
            462.18
          ],
          [
            903,
            467.52
          ],
          [
            903,
            472.86
          ],
          [
            903,
            478.19
          ],
          [
            903,
            483.53
          ],
          [
            903,
            488.86
          ],
          [
            903,
            494.2
          ],
          [
            903,
            499.54
          ],
          [
            903,
            504.87
          ],
          [
            903,
            510.21
          ],
          [
            903,
            515.54
          ],
          [
            903,
            520.88
          ],
          [
            903,
            526.21
          ],
          [
            903,
            531.55
          ],
          [
            903,
            536.89
          ],
          [
            903,
            542.22
          ],
          [
            903,
            547.56
          ],
          [
            903,
            552.89
          ],
          [
            903,
            558.23
          ],
          [
            903,
            563.57
          ],
          [
            903,
            568.9
          ],
          [
            903,
            574.24
          ],
          [
            903,
            579.57
          ],
          [
            903,
            584.91
          ],
          [
            903,
            590.25
          ],
          [
            903,
            595.58
          ],
          [
            903,
            600.92
          ],
          [
            903,
            606.25
          ],
          [
            903,
            611.59
          ],
          [
            903,
            616.93
          ],
          [
            903,
            622.26
          ],
          [
            903,
            627.6
          ],
          [
            903,
            632.93
          ],
          [
            903,
            638.27
          ],
          [
            903,
            643.61
          ],
          [
            903,
            648.94
          ],
          [
            903,
            654.28
          ],
          [
            903,
            659.61
          ],
          [
            903,
            664.95
          ],
          [
            903,
            670.29
          ],
          [
            903,
            675.62
          ],
          [
            903,
            680.96
          ],
          [
            903,
            686.29
          ],
          [
            903,
            691.63
          ],
          [
            903,
            696.96
          ],
          [
            902,
            702.3
          ],
          [
            902,
            707.64
          ],
          [
            902,
            712.97
          ],
          [
            902,
            718.31
          ],
          [
            902,
            723.64
          ],
          [
            902,
            728.98
          ],
          [
            902,
            734.32
          ],
          [
            902,
            739.65
          ],
          [
            902,
            744.99
          ],
          [
            902,
            750.32
          ],
          [
            902,
            755.66
          ],
          [
            902,
            761
          ],
          [
            902,
            766.33
          ],
          [
            900.33,
            781
          ],
          [
            895,
            781
          ],
          [
            889.66,
            781
          ],
          [
            884.32,
            781
          ],
          [
            878.99,
            781
          ],
          [
            873.65,
            781
          ],
          [
            868.32,
            781
          ],
          [
            862.98,
            781
          ],
          [
            857.64,
            781
          ],
          [
            852.31,
            781
          ],
          [
            846.97,
            781
          ],
          [
            841.64,
            781
          ],
          [
            836.3,
            781
          ],
          [
            830.96,
            781
          ],
          [
            825.63,
            781
          ],
          [
            820.29,
            781
          ],
          [
            814.96,
            781
          ],
          [
            809.62,
            781
          ],
          [
            804.29,
            781
          ],
          [
            798.95,
            781
          ],
          [
            793.61,
            781
          ],
          [
            788.28,
            781
          ],
          [
            782.94,
            781
          ],
          [
            777.61,
            781
          ],
          [
            772.27,
            781
          ],
          [
            766.93,
            781
          ],
          [
            761.6,
            781
          ],
          [
            756.26,
            781
          ],
          [
            750.93,
            781
          ],
          [
            745.59,
            781
          ],
          [
            740.25,
            781
          ],
          [
            734.92,
            781
          ],
          [
            729.58,
            781
          ],
          [
            724.25,
            781
          ],
          [
            718.91,
            781
          ],
          [
            713.57,
            781
          ],
          [
            708.24,
            781
          ],
          [
            702.9,
            781
          ],
          [
            697.57,
            781
          ],
          [
            692.23,
            781
          ],
          [
            686.89,
            781
          ],
          [
            681.56,
            781
          ],
          [
            676.22,
            781
          ],
          [
            670.89,
            781
          ],
          [
            665.55,
            781
          ],
          [
            660.21,
            781
          ],
          [
            654.88,
            781
          ],
          [
            649.54,
            781
          ],
          [
            644.21,
            781
          ],
          [
            639,
            768.87
          ],
          [
            639,
            763.54
          ],
          [
            639,
            758.2
          ],
          [
            639,
            752.86
          ],
          [
            639,
            747.53
          ],
          [
            639,
            742.19
          ],
          [
            639,
            736.86
          ],
          [
            639,
            731.52
          ],
          [
            639,
            726.18
          ],
          [
            639,
            720.85
          ],
          [
            639,
            715.51
          ],
          [
            639,
            710.18
          ],
          [
            639,
            704.84
          ],
          [
            639,
            699.5
          ],
          [
            639,
            694.17
          ],
          [
            639,
            688.83
          ],
          [
            639,
            683.5
          ],
          [
            639,
            678.16
          ],
          [
            639,
            672.82
          ],
          [
            639,
            667.49
          ],
          [
            639,
            662.15
          ],
          [
            639,
            656.82
          ],
          [
            639,
            651.48
          ],
          [
            639,
            646.14
          ],
          [
            639,
            640.81
          ],
          [
            639,
            635.47
          ],
          [
            639,
            630.14
          ],
          [
            639,
            624.8
          ],
          [
            639,
            619.46
          ],
          [
            639,
            614.13
          ],
          [
            639,
            608.79
          ],
          [
            639,
            603.46
          ],
          [
            639,
            598.12
          ],
          [
            639,
            592.79
          ],
          [
            639,
            587.45
          ],
          [
            639,
            582.11
          ],
          [
            639,
            576.78
          ],
          [
            639,
            571.44
          ],
          [
            639,
            566.11
          ],
          [
            639,
            560.77
          ],
          [
            639,
            555.43
          ],
          [
            639,
            550.1
          ],
          [
            639,
            544.76
          ],
          [
            639,
            539.43
          ],
          [
            639,
            534.09
          ],
          [
            639,
            528.75
          ],
          [
            639,
            523.42
          ],
          [
            639,
            518.08
          ],
          [
            639,
            512.75
          ],
          [
            639,
            507.41
          ],
          [
            639,
            502.07
          ],
          [
            639,
            496.74
          ],
          [
            639,
            491.4
          ],
          [
            639,
            486.07
          ],
          [
            639,
            480.73
          ],
          [
            639,
            475.39
          ],
          [
            639,
            470.06
          ],
          [
            639,
            464.72
          ],
          [
            639,
            459.39
          ],
          [
            639,
            454.05
          ],
          [
            639,
            448.71
          ],
          [
            639,
            443.38
          ],
          [
            639,
            438.04
          ],
          [
            639,
            432.71
          ],
          [
            639,
            427.37
          ],
          [
            639,
            422.04
          ],
          [
            639,
            416.7
          ],
          [
            639,
            411.36
          ],
          [
            639,
            406.03
          ],
          [
            639,
            400.69
          ],
          [
            639,
            395.36
          ],
          [
            639,
            390.02
          ],
          [
            639,
            384.68
          ],
          [
            639,
            379.35
          ],
          [
            639,
            374.01
          ],
          [
            639,
            368.68
          ],
          [
            639,
            363.34
          ],
          [
            632,
            358
          ],
          [
            632,
            352.67
          ]
        ],
        "corners": [
          [
            639,
            350
          ],
          [
            903,
            350
          ],
          [
            903,
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
    "calibration_px": 171,
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
    "focal_px": 912,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.337,
      "wall_width_m": 5.853,
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
          "scale": 0.889,
          "target_px": 640,
          "source_px": 720
        },
        "revealed_px": 177984,
        "remeasured": {
          "px_per_m_at_wall": 190,
          "floor_line_y": 0.753906,
          "corner_x0_px": 213,
          "corner_x1_px": 1325,
          "corner_scale_px_per_m": 213.846
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
    "floor_line_y": 0.753906,
    "px_per_m_at_wall": 223.333,
    "px_per_m_at_bottom": 431.47,
    "wall_width_m": 6.8,
    "key_tint": "#c8c0b6",
    "image_h_px": 1024,
    "horizon_y": 0.489844,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 201,
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
    "focal_px": 1072,
    "nearest_floor_m": 2.4845,
    "measured_room": {
      "storey_height_m": 3.206,
      "wall_width_m": 5.87,
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
    "floor_line_y": 0.74573,
    "px_per_m_at_wall": 200.784,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8bda0",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.90 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 170,
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
    "corner_x0_px": 125.49019607843127,
    "corner_x1_px": 1410.5098039215686,
    "storey_height_m": 3,
    "camera_id": "measured:backdrops/source-warped/ward-W/warped.png",
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
    "focal_px": 963.3,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.198,
      "wall_width_m": 6.845,
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
          "axis": "y",
          "name": "ceiling_line..door:door02:head",
          "scale": 1.414,
          "target_px": 200.8,
          "source_px": 142
        },
        "revealed_px": 27190,
        "remeasured": {
          "px_per_m_at_wall": 188.889,
          "floor_line_y": 0.746094,
          "corner_x0_px": 121,
          "corner_x1_px": 1414,
          "corner_scale_px_per_m": 202.031
        },
        "warped_from": "backdrops/source/ward-W/row23-647d9ce1.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            647.5,
            888.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            648,
            888
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
        "x": 645,
        "y": 362,
        "w": 246,
        "h": 402,
        "beyond_m": 5.4,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            650.51,
            362
          ],
          [
            655.52,
            362
          ],
          [
            660.54,
            362
          ],
          [
            665.55,
            362
          ],
          [
            670.57,
            362
          ],
          [
            675.59,
            362
          ],
          [
            680.6,
            362
          ],
          [
            685.62,
            362
          ],
          [
            690.63,
            362
          ],
          [
            695.65,
            362
          ],
          [
            700.66,
            362
          ],
          [
            705.68,
            362
          ],
          [
            710.7,
            362
          ],
          [
            715.71,
            362
          ],
          [
            720.73,
            362
          ],
          [
            725.74,
            362
          ],
          [
            730.76,
            362
          ],
          [
            735.77,
            362
          ],
          [
            740.79,
            362
          ],
          [
            745.8,
            362
          ],
          [
            750.82,
            362
          ],
          [
            755.84,
            362
          ],
          [
            760.85,
            362
          ],
          [
            765.87,
            362
          ],
          [
            770.88,
            362
          ],
          [
            775.9,
            362
          ],
          [
            780.91,
            362
          ],
          [
            785.93,
            362
          ],
          [
            790.95,
            362
          ],
          [
            795.96,
            362
          ],
          [
            800.98,
            362
          ],
          [
            805.99,
            362
          ],
          [
            811.01,
            362
          ],
          [
            816.02,
            362
          ],
          [
            821.04,
            362
          ],
          [
            826.05,
            362
          ],
          [
            831.07,
            362
          ],
          [
            836.09,
            362
          ],
          [
            841.1,
            362
          ],
          [
            846.12,
            362
          ],
          [
            851.13,
            362
          ],
          [
            856.15,
            362
          ],
          [
            861.16,
            362
          ],
          [
            866.18,
            362
          ],
          [
            871.2,
            362
          ],
          [
            876.21,
            362
          ],
          [
            881.23,
            362
          ],
          [
            886.24,
            362
          ],
          [
            890,
            365.26
          ],
          [
            888,
            370.27
          ],
          [
            888,
            375.29
          ],
          [
            888,
            380.3
          ],
          [
            888,
            385.32
          ],
          [
            888,
            390.34
          ],
          [
            888,
            395.35
          ],
          [
            888,
            400.37
          ],
          [
            888,
            405.38
          ],
          [
            888,
            410.4
          ],
          [
            888,
            415.41
          ],
          [
            888,
            420.43
          ],
          [
            888,
            425.45
          ],
          [
            888,
            430.46
          ],
          [
            888,
            435.48
          ],
          [
            888,
            440.49
          ],
          [
            888,
            445.51
          ],
          [
            888,
            450.52
          ],
          [
            888,
            455.54
          ],
          [
            888,
            460.55
          ],
          [
            888,
            465.57
          ],
          [
            888,
            470.59
          ],
          [
            888,
            475.6
          ],
          [
            888,
            480.62
          ],
          [
            888,
            485.63
          ],
          [
            888,
            490.65
          ],
          [
            888,
            495.66
          ],
          [
            888,
            500.68
          ],
          [
            888,
            505.7
          ],
          [
            888,
            510.71
          ],
          [
            888,
            515.73
          ],
          [
            888,
            520.74
          ],
          [
            888,
            525.76
          ],
          [
            888,
            530.77
          ],
          [
            888,
            535.79
          ],
          [
            888,
            540.8
          ],
          [
            888,
            545.82
          ],
          [
            888,
            550.84
          ],
          [
            888,
            555.85
          ],
          [
            888,
            560.87
          ],
          [
            888,
            565.88
          ],
          [
            888,
            570.9
          ],
          [
            888,
            575.91
          ],
          [
            888,
            580.93
          ],
          [
            888,
            585.95
          ],
          [
            888,
            590.96
          ],
          [
            888,
            595.98
          ],
          [
            888,
            600.99
          ],
          [
            888,
            606.01
          ],
          [
            888,
            611.02
          ],
          [
            888,
            616.04
          ],
          [
            888,
            621.05
          ],
          [
            888,
            626.07
          ],
          [
            888,
            631.09
          ],
          [
            888,
            636.1
          ],
          [
            888,
            641.12
          ],
          [
            888,
            646.13
          ],
          [
            888,
            651.15
          ],
          [
            888,
            656.16
          ],
          [
            888,
            661.18
          ],
          [
            888,
            666.2
          ],
          [
            888,
            671.21
          ],
          [
            888,
            676.23
          ],
          [
            888,
            681.24
          ],
          [
            888,
            686.26
          ],
          [
            888,
            691.27
          ],
          [
            888,
            696.29
          ],
          [
            888,
            701.3
          ],
          [
            888,
            706.32
          ],
          [
            888,
            711.34
          ],
          [
            888,
            716.35
          ],
          [
            888,
            721.37
          ],
          [
            888,
            726.38
          ],
          [
            888,
            731.4
          ],
          [
            888,
            736.41
          ],
          [
            888,
            741.43
          ],
          [
            888,
            746.45
          ],
          [
            888,
            751.46
          ],
          [
            891,
            756.48
          ],
          [
            891,
            761.49
          ],
          [
            885.49,
            764
          ],
          [
            880.48,
            764
          ],
          [
            875.46,
            764
          ],
          [
            870.45,
            764
          ],
          [
            865.43,
            764
          ],
          [
            860.41,
            764
          ],
          [
            855.4,
            764
          ],
          [
            850.38,
            764
          ],
          [
            845.37,
            764
          ],
          [
            840.35,
            764
          ],
          [
            835.34,
            764
          ],
          [
            830.32,
            764
          ],
          [
            825.3,
            764
          ],
          [
            820.29,
            764
          ],
          [
            815.27,
            764
          ],
          [
            810.26,
            764
          ],
          [
            805.24,
            764
          ],
          [
            800.23,
            764
          ],
          [
            795.21,
            764
          ],
          [
            790.2,
            764
          ],
          [
            785.18,
            764
          ],
          [
            780.16,
            764
          ],
          [
            775.15,
            764
          ],
          [
            770.13,
            764
          ],
          [
            765.12,
            764
          ],
          [
            760.1,
            764
          ],
          [
            755.09,
            764
          ],
          [
            750.07,
            764
          ],
          [
            745.05,
            764
          ],
          [
            740.04,
            764
          ],
          [
            735.02,
            764
          ],
          [
            730.01,
            764
          ],
          [
            724.99,
            764
          ],
          [
            719.98,
            764
          ],
          [
            714.96,
            764
          ],
          [
            709.95,
            764
          ],
          [
            704.93,
            764
          ],
          [
            699.91,
            764
          ],
          [
            694.9,
            764
          ],
          [
            689.88,
            764
          ],
          [
            684.87,
            764
          ],
          [
            679.85,
            764
          ],
          [
            674.84,
            764
          ],
          [
            669.82,
            764
          ],
          [
            664.8,
            764
          ],
          [
            659.79,
            764
          ],
          [
            654.77,
            764
          ],
          [
            649.76,
            764
          ],
          [
            645,
            760.74
          ],
          [
            645,
            755.73
          ],
          [
            645,
            750.71
          ],
          [
            648,
            745.7
          ],
          [
            648,
            740.68
          ],
          [
            648,
            735.66
          ],
          [
            648,
            730.65
          ],
          [
            648,
            725.63
          ],
          [
            648,
            720.62
          ],
          [
            648,
            715.6
          ],
          [
            648,
            710.59
          ],
          [
            648,
            705.57
          ],
          [
            648,
            700.55
          ],
          [
            648,
            695.54
          ],
          [
            648,
            690.52
          ],
          [
            648,
            685.51
          ],
          [
            648,
            680.49
          ],
          [
            648,
            675.48
          ],
          [
            648,
            670.46
          ],
          [
            648,
            665.45
          ],
          [
            648,
            660.43
          ],
          [
            648,
            655.41
          ],
          [
            648,
            650.4
          ],
          [
            648,
            645.38
          ],
          [
            648,
            640.37
          ],
          [
            648,
            635.35
          ],
          [
            648,
            630.34
          ],
          [
            648,
            625.32
          ],
          [
            648,
            620.3
          ],
          [
            648,
            615.29
          ],
          [
            648,
            610.27
          ],
          [
            648,
            605.26
          ],
          [
            648,
            600.24
          ],
          [
            648,
            595.23
          ],
          [
            648,
            590.21
          ],
          [
            648,
            585.2
          ],
          [
            648,
            580.18
          ],
          [
            648,
            575.16
          ],
          [
            648,
            570.15
          ],
          [
            648,
            565.13
          ],
          [
            648,
            560.12
          ],
          [
            648,
            555.1
          ],
          [
            648,
            550.09
          ],
          [
            648,
            545.07
          ],
          [
            648,
            540.05
          ],
          [
            648,
            535.04
          ],
          [
            648,
            530.02
          ],
          [
            648,
            525.01
          ],
          [
            648,
            519.99
          ],
          [
            648,
            514.98
          ],
          [
            648,
            509.96
          ],
          [
            648,
            504.95
          ],
          [
            648,
            499.93
          ],
          [
            648,
            494.91
          ],
          [
            648,
            489.9
          ],
          [
            648,
            484.88
          ],
          [
            648,
            479.87
          ],
          [
            648,
            474.85
          ],
          [
            648,
            469.84
          ],
          [
            648,
            464.82
          ],
          [
            648,
            459.8
          ],
          [
            648,
            454.79
          ],
          [
            648,
            449.77
          ],
          [
            648,
            444.76
          ],
          [
            648,
            439.74
          ],
          [
            648,
            434.73
          ],
          [
            648,
            429.71
          ],
          [
            648,
            424.7
          ],
          [
            648,
            419.68
          ],
          [
            648,
            414.66
          ],
          [
            648,
            409.65
          ],
          [
            648,
            404.63
          ],
          [
            648,
            399.62
          ],
          [
            648,
            394.6
          ],
          [
            648,
            389.59
          ],
          [
            648,
            384.57
          ],
          [
            648,
            379.55
          ],
          [
            648,
            374.54
          ],
          [
            647,
            369.52
          ],
          [
            645,
            364.51
          ]
        ],
        "corners": [
          [
            648,
            362
          ],
          [
            888,
            362
          ],
          [
            888,
            764
          ],
          [
            648,
            764
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9995,
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
