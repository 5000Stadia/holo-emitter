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
  fp: "acd2fd76",
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
    "floor_line_y": 0.795436,
    "px_per_m_at_wall": 243.81,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6,
    "key_tint": "#c8a983",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 260,
    "camera_wall_m": 4.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 36.57142857142867,
    "corner_x1_px": 1499.4285714285713,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/noodle_bar-N/warped.png",
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
    "focal_px": 992.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.177,
      "wall_width_m": 5.069,
      "ruled_storey_height_m": 3.2,
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
          "scale": 1.263,
          "target_px": 1462.9,
          "source_px": 1158
        },
        "revealed_px": 35977,
        "remeasured": {
          "px_per_m_at_wall": 236.364,
          "floor_line_y": 0.794922,
          "corner_x0_px": 213,
          "corner_x1_px": 1411,
          "corner_scale_px_per_m": 199.667
        },
        "warped_from": "backdrops/source/noodle_bar-N/row23-42ca34fd.png",
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
  "noodle_bar/E": {
    "floor_line_y": 0.776658,
    "px_per_m_at_wall": 227.556,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.6,
    "key_tint": "#c8b58f",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 232,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 130.84444444444455,
    "corner_x1_px": 1405.1555555555556,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/noodle_bar-E/warped.png",
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
    "focal_px": 949.1,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.087,
      "wall_width_m": 6.036,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 5.6,
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
          "scale": 1.147,
          "target_px": 273.1,
          "source_px": 238
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 210.909,
          "floor_line_y": 0.755859,
          "corner_x0_px": 131,
          "corner_x1_px": 1404,
          "corner_scale_px_per_m": 227.321
        },
        "warped_from": "backdrops/source/noodle_bar-E/row23-5fe4dd71.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            665.6,
            870.4
          ],
          "plan_centre_px": 768,
          "painted_px": [
            666,
            871
          ],
          "painted_centre_px": 768.5,
          "centre_delta_px": 0.5,
          "centre_delta_m": 0.002,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door01",
        "kind": "door",
        "via": null,
        "x": 662,
        "y": 340,
        "w": 212,
        "h": 455,
        "beyond_m": 4.4,
        "beyond_offset_m": 0,
        "measured": true,
        "polygon": [
          [
            668.5,
            340
          ],
          [
            673.49,
            340
          ],
          [
            678.48,
            340
          ],
          [
            683.47,
            340
          ],
          [
            688.46,
            340
          ],
          [
            693.46,
            340
          ],
          [
            698.45,
            340
          ],
          [
            703.44,
            340
          ],
          [
            708.43,
            340
          ],
          [
            713.43,
            340
          ],
          [
            718.42,
            340
          ],
          [
            723.41,
            340
          ],
          [
            728.4,
            340
          ],
          [
            733.39,
            340
          ],
          [
            738.39,
            340
          ],
          [
            743.38,
            340
          ],
          [
            748.37,
            340
          ],
          [
            753.36,
            340
          ],
          [
            758.36,
            340
          ],
          [
            763.35,
            340
          ],
          [
            768.34,
            340
          ],
          [
            773.33,
            340
          ],
          [
            778.32,
            340
          ],
          [
            783.32,
            340
          ],
          [
            788.31,
            340
          ],
          [
            793.3,
            340
          ],
          [
            798.29,
            340
          ],
          [
            803.29,
            340
          ],
          [
            808.28,
            340
          ],
          [
            813.27,
            340
          ],
          [
            818.26,
            340
          ],
          [
            823.25,
            340
          ],
          [
            828.25,
            340
          ],
          [
            833.24,
            340
          ],
          [
            838.23,
            340
          ],
          [
            843.22,
            340
          ],
          [
            848.21,
            340
          ],
          [
            853.21,
            340
          ],
          [
            858.2,
            340
          ],
          [
            863.19,
            340
          ],
          [
            868.18,
            340
          ],
          [
            874,
            342.18
          ],
          [
            874,
            347.17
          ],
          [
            874,
            352.16
          ],
          [
            874,
            357.15
          ],
          [
            874,
            362.14
          ],
          [
            874,
            367.14
          ],
          [
            871,
            372.13
          ],
          [
            871,
            377.12
          ],
          [
            871,
            382.11
          ],
          [
            871,
            387.11
          ],
          [
            871,
            392.1
          ],
          [
            871,
            397.09
          ],
          [
            871,
            402.08
          ],
          [
            871,
            407.07
          ],
          [
            871,
            412.07
          ],
          [
            871,
            417.06
          ],
          [
            871,
            422.05
          ],
          [
            871,
            427.04
          ],
          [
            871,
            432.04
          ],
          [
            871,
            437.03
          ],
          [
            871,
            442.02
          ],
          [
            871,
            447.01
          ],
          [
            871,
            452
          ],
          [
            871,
            457
          ],
          [
            871,
            461.99
          ],
          [
            871,
            466.98
          ],
          [
            871,
            471.97
          ],
          [
            871,
            476.96
          ],
          [
            871,
            481.96
          ],
          [
            871,
            486.95
          ],
          [
            871,
            491.94
          ],
          [
            871,
            496.93
          ],
          [
            871,
            501.93
          ],
          [
            871,
            506.92
          ],
          [
            871,
            511.91
          ],
          [
            871,
            516.9
          ],
          [
            871,
            521.89
          ],
          [
            871,
            526.89
          ],
          [
            871,
            531.88
          ],
          [
            871,
            536.87
          ],
          [
            871,
            541.86
          ],
          [
            871,
            546.86
          ],
          [
            871,
            551.85
          ],
          [
            871,
            556.84
          ],
          [
            871,
            561.83
          ],
          [
            871,
            566.82
          ],
          [
            871,
            571.82
          ],
          [
            871,
            576.81
          ],
          [
            871,
            581.8
          ],
          [
            871,
            586.79
          ],
          [
            871,
            591.79
          ],
          [
            871,
            596.78
          ],
          [
            871,
            601.77
          ],
          [
            871,
            606.76
          ],
          [
            871,
            611.75
          ],
          [
            871,
            616.75
          ],
          [
            871,
            621.74
          ],
          [
            871,
            626.73
          ],
          [
            871,
            631.72
          ],
          [
            871,
            636.71
          ],
          [
            871,
            641.71
          ],
          [
            871,
            646.7
          ],
          [
            871,
            651.69
          ],
          [
            872,
            656.68
          ],
          [
            873,
            661.68
          ],
          [
            873,
            666.67
          ],
          [
            873,
            671.66
          ],
          [
            873,
            676.65
          ],
          [
            873,
            681.64
          ],
          [
            873,
            686.64
          ],
          [
            873,
            691.63
          ],
          [
            873,
            696.62
          ],
          [
            873,
            701.61
          ],
          [
            873,
            706.61
          ],
          [
            873,
            711.6
          ],
          [
            873,
            716.59
          ],
          [
            873,
            721.58
          ],
          [
            873,
            726.57
          ],
          [
            873,
            731.57
          ],
          [
            872,
            736.56
          ],
          [
            872,
            741.55
          ],
          [
            872,
            746.54
          ],
          [
            872,
            751.54
          ],
          [
            872,
            756.53
          ],
          [
            872,
            761.52
          ],
          [
            872,
            766.51
          ],
          [
            872,
            771.5
          ],
          [
            868.5,
            795
          ],
          [
            863.51,
            795
          ],
          [
            858.52,
            795
          ],
          [
            853.53,
            795
          ],
          [
            848.54,
            795
          ],
          [
            843.54,
            795
          ],
          [
            838.55,
            795
          ],
          [
            833.56,
            795
          ],
          [
            828.57,
            795
          ],
          [
            823.57,
            795
          ],
          [
            818.58,
            795
          ],
          [
            813.59,
            795
          ],
          [
            808.6,
            795
          ],
          [
            803.61,
            795
          ],
          [
            798.61,
            795
          ],
          [
            793.62,
            795
          ],
          [
            788.63,
            795
          ],
          [
            783.64,
            795
          ],
          [
            778.64,
            795
          ],
          [
            773.65,
            795
          ],
          [
            768.66,
            795
          ],
          [
            763.67,
            795
          ],
          [
            758.68,
            795
          ],
          [
            753.68,
            795
          ],
          [
            748.69,
            795
          ],
          [
            743.7,
            795
          ],
          [
            738.71,
            795
          ],
          [
            733.71,
            795
          ],
          [
            728.72,
            795
          ],
          [
            723.73,
            795
          ],
          [
            718.74,
            795
          ],
          [
            713.75,
            795
          ],
          [
            708.75,
            795
          ],
          [
            703.76,
            795
          ],
          [
            698.77,
            795
          ],
          [
            693.78,
            795
          ],
          [
            688.79,
            795
          ],
          [
            683.79,
            795
          ],
          [
            678.8,
            795
          ],
          [
            673.81,
            795
          ],
          [
            668.82,
            795
          ],
          [
            662,
            771.82
          ],
          [
            662,
            766.83
          ],
          [
            664,
            761.84
          ],
          [
            665,
            756.85
          ],
          [
            665,
            751.86
          ],
          [
            665,
            746.86
          ],
          [
            665,
            741.87
          ],
          [
            665,
            736.88
          ],
          [
            665,
            731.89
          ],
          [
            665,
            726.89
          ],
          [
            665,
            721.9
          ],
          [
            665,
            716.91
          ],
          [
            665,
            711.92
          ],
          [
            665,
            706.93
          ],
          [
            665,
            701.93
          ],
          [
            665,
            696.94
          ],
          [
            665,
            691.95
          ],
          [
            665,
            686.96
          ],
          [
            665,
            681.96
          ],
          [
            665,
            676.97
          ],
          [
            665,
            671.98
          ],
          [
            665,
            666.99
          ],
          [
            665,
            662
          ],
          [
            665,
            657
          ],
          [
            665,
            652.01
          ],
          [
            665,
            647.02
          ],
          [
            665,
            642.03
          ],
          [
            665,
            637.04
          ],
          [
            665,
            632.04
          ],
          [
            665,
            627.05
          ],
          [
            665,
            622.06
          ],
          [
            665,
            617.07
          ],
          [
            665,
            612.07
          ],
          [
            665,
            607.08
          ],
          [
            665,
            602.09
          ],
          [
            665,
            597.1
          ],
          [
            665,
            592.11
          ],
          [
            665,
            587.11
          ],
          [
            665,
            582.12
          ],
          [
            665,
            577.13
          ],
          [
            665,
            572.14
          ],
          [
            665,
            567.14
          ],
          [
            665,
            562.15
          ],
          [
            665,
            557.16
          ],
          [
            665,
            552.17
          ],
          [
            665,
            547.18
          ],
          [
            665,
            542.18
          ],
          [
            665,
            537.19
          ],
          [
            665,
            532.2
          ],
          [
            665,
            527.21
          ],
          [
            665,
            522.21
          ],
          [
            665,
            517.22
          ],
          [
            665,
            512.23
          ],
          [
            665,
            507.24
          ],
          [
            665,
            502.25
          ],
          [
            665,
            497.25
          ],
          [
            665,
            492.26
          ],
          [
            665,
            487.27
          ],
          [
            665,
            482.28
          ],
          [
            665,
            477.29
          ],
          [
            665,
            472.29
          ],
          [
            665,
            467.3
          ],
          [
            665,
            462.31
          ],
          [
            665,
            457.32
          ],
          [
            665,
            452.32
          ],
          [
            665,
            447.33
          ],
          [
            665,
            442.34
          ],
          [
            665,
            437.35
          ],
          [
            665,
            432.36
          ],
          [
            665,
            427.36
          ],
          [
            665,
            422.37
          ],
          [
            665,
            417.38
          ],
          [
            665,
            412.39
          ],
          [
            665,
            407.39
          ],
          [
            665,
            402.4
          ],
          [
            665,
            397.41
          ],
          [
            665,
            392.42
          ],
          [
            665,
            387.43
          ],
          [
            665,
            382.43
          ],
          [
            665,
            377.44
          ],
          [
            665,
            372.45
          ],
          [
            665,
            367.46
          ],
          [
            664,
            362.46
          ],
          [
            664,
            357.47
          ],
          [
            664,
            352.48
          ],
          [
            662,
            347.49
          ],
          [
            662,
            342.5
          ]
        ],
        "corners": [
          [
            665,
            340
          ],
          [
            870.19,
            340
          ],
          [
            872.41,
            795
          ],
          [
            665,
            795
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9569,
        "polygon_used": true,
        "depth_m": 0.2
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
  "noodle_bar/S": {
    "floor_line_y": 0.795436,
    "px_per_m_at_wall": 243.81,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6,
    "key_tint": "#c8b174",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 249,
    "camera_wall_m": 4.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 36.57142857142867,
    "corner_x1_px": 1499.4285714285713,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/noodle_bar-S/warped.png",
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
    "focal_px": 950.7,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.079,
      "wall_width_m": 6.308,
      "ruled_storey_height_m": 3.2,
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
          "scale": 1.127,
          "target_px": 1462.9,
          "source_px": 1298
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 226.364,
          "floor_line_y": 0.773438,
          "corner_x0_px": 37,
          "corner_x1_px": 1465,
          "corner_scale_px_per_m": 238
        },
        "warped_from": "backdrops/source/noodle_bar-S/row23-4106c388.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            573,
            963
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
        "x": 572.95,
        "y": 326.91,
        "w": 390.1,
        "h": 243.81,
        "sill_m": 1,
        "head_m": 2,
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
  "noodle_bar/W": {
    "floor_line_y": 0.776658,
    "px_per_m_at_wall": 227.556,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.6,
    "key_tint": "#c8b18f",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 130.84444444444455,
    "corner_x1_px": 1405.1555555555556,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/noodle_bar-W/warped.png",
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
    "focal_px": 1006.4,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.081,
      "wall_width_m": 5.697,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 5.6,
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
          "scale": 1.047,
          "target_px": 1274.3,
          "source_px": 1217
        },
        "revealed_px": 83596,
        "remeasured": {
          "px_per_m_at_wall": 223.636,
          "floor_line_y": 0.776367,
          "corner_x0_px": 131,
          "corner_x1_px": 1405,
          "corner_scale_px_per_m": 227.5
        },
        "warped_from": "backdrops/source/noodle_bar-W/row23-70f45eab.png",
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
  "back_office/N": {
    "floor_line_y": 0.795436,
    "px_per_m_at_wall": 243.81,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 4.2,
    "key_tint": "#c8b7a0",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 241,
    "camera_wall_m": 4.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.2,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 256,
    "corner_x1_px": 1280,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/back_office-N/warped.png",
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
    "focal_px": 920.2,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.442,
      "wall_width_m": 4.587,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 4.2,
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
          "scale": 1.047,
          "target_px": 780.2,
          "source_px": 745
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 219.091,
          "floor_line_y": 0.774414,
          "corner_x0_px": 275,
          "corner_x1_px": 1280,
          "corner_scale_px_per_m": 239.286
        },
        "warped_from": "backdrops/source/back_office-N/row23-7c95225a.png",
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
  "back_office/E": {
    "floor_line_y": 0.829236,
    "px_per_m_at_wall": 273.067,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.6,
    "key_tint": "#c8bba6",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 266,
    "camera_wall_m": 3.75,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 3.413333333333412,
    "corner_x1_px": 1532.5866666666666,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/back_office-E/warped.png",
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
    "focal_px": 906.8,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.25,
      "wall_width_m": 4.652,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 5.6,
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
          "scale": 1.567,
          "target_px": 1529.2,
          "source_px": 976
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 241.818,
          "floor_line_y": 0.803711,
          "corner_x0_px": 84,
          "corner_x1_px": 1209,
          "corner_scale_px_per_m": 200.893
        },
        "warped_from": "backdrops/source/back_office-E/row23-bac80793.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            604.2,
            931.8
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
        "x": 604.16,
        "y": 303,
        "w": 327.68,
        "h": 273.07,
        "sill_m": 1,
        "head_m": 2,
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
  "back_office/S": {
    "floor_line_y": 0.795436,
    "px_per_m_at_wall": 243.81,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 4.2,
    "key_tint": "#c8bbab",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 263,
    "camera_wall_m": 4.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.2,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 256,
    "corner_x1_px": 1280,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/back_office-S/warped.png",
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
    "focal_px": 1004.2,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.17,
      "wall_width_m": 4.329,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 4.2,
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
          "scale": 1.105,
          "target_px": 780.2,
          "source_px": 706
        },
        "revealed_px": 76800,
        "remeasured": {
          "px_per_m_at_wall": 239.091,
          "floor_line_y": 0.773438,
          "corner_x0_px": 250,
          "corner_x1_px": 1285,
          "corner_scale_px_per_m": 246.429
        },
        "warped_from": "backdrops/source/back_office-S/row23-7fc68c04.png",
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
  "back_office/W": {
    "floor_line_y": 0.829236,
    "px_per_m_at_wall": 273.067,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.6,
    "key_tint": "#c8baa3",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 299,
    "camera_wall_m": 3.75,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 3.413333333333412,
    "corner_x1_px": 1532.5866666666666,
    "storey_height_m": 3.2,
    "camera_id": "measured:backdrops/source-warped/back_office-W/warped.png",
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
    "focal_px": 1019.3,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 2.877,
      "wall_width_m": 4.194,
      "ruled_storey_height_m": 3.2,
      "ruled_wall_width_m": 5.6,
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
          "name": "door:door01:left..door:door01:right",
          "scale": 1.293,
          "target_px": 245.8,
          "source_px": 190
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 271.818,
          "floor_line_y": 0.803711,
          "corner_x0_px": 381,
          "corner_x1_px": 1521,
          "corner_scale_px_per_m": 203.571
        },
        "warped_from": "backdrops/source/back_office-W/row23-6afb2c06.png",
        "tool": "design/plan-draft/measured/mesh_warp.py"
      },
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            645.1,
            890.9
          ],
          "plan_centre_px": 768,
          "painted_px": [
            644,
            891
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
        "y": 303,
        "w": 277,
        "h": 546,
        "beyond_m": 6.2,
        "beyond_offset_m": 0,
        "measured": true,
        "polygon": [
          [
            647,
            303
          ],
          [
            652.99,
            303
          ],
          [
            658.98,
            303
          ],
          [
            664.97,
            303
          ],
          [
            670.96,
            303
          ],
          [
            676.96,
            303
          ],
          [
            682.95,
            303
          ],
          [
            688.94,
            303
          ],
          [
            694.93,
            303
          ],
          [
            700.93,
            303
          ],
          [
            706.92,
            303
          ],
          [
            712.91,
            303
          ],
          [
            718.9,
            303
          ],
          [
            724.89,
            303
          ],
          [
            730.89,
            303
          ],
          [
            736.88,
            303
          ],
          [
            742.87,
            303
          ],
          [
            748.86,
            303
          ],
          [
            754.86,
            303
          ],
          [
            760.85,
            303
          ],
          [
            766.84,
            303
          ],
          [
            772.83,
            303
          ],
          [
            778.82,
            303
          ],
          [
            784.82,
            303
          ],
          [
            790.81,
            303
          ],
          [
            796.8,
            303
          ],
          [
            802.79,
            303
          ],
          [
            808.79,
            303
          ],
          [
            814.78,
            303
          ],
          [
            820.77,
            303
          ],
          [
            826.76,
            303
          ],
          [
            832.75,
            303
          ],
          [
            838.75,
            303
          ],
          [
            844.74,
            303
          ],
          [
            850.73,
            303
          ],
          [
            856.72,
            303
          ],
          [
            862.71,
            303
          ],
          [
            868.71,
            303
          ],
          [
            874.7,
            303
          ],
          [
            880.69,
            303
          ],
          [
            886.68,
            303
          ],
          [
            912,
            304.68
          ],
          [
            912,
            310.67
          ],
          [
            899,
            316.66
          ],
          [
            899,
            322.65
          ],
          [
            899,
            328.64
          ],
          [
            899,
            334.64
          ],
          [
            899,
            340.63
          ],
          [
            899,
            346.62
          ],
          [
            899,
            352.61
          ],
          [
            899,
            358.61
          ],
          [
            899,
            364.6
          ],
          [
            899,
            370.59
          ],
          [
            899,
            376.58
          ],
          [
            899,
            382.57
          ],
          [
            899,
            388.57
          ],
          [
            899,
            394.56
          ],
          [
            899,
            400.55
          ],
          [
            899,
            406.54
          ],
          [
            899,
            412.54
          ],
          [
            899,
            418.53
          ],
          [
            899,
            424.52
          ],
          [
            899,
            430.51
          ],
          [
            899,
            436.5
          ],
          [
            899,
            442.5
          ],
          [
            899,
            448.49
          ],
          [
            899,
            454.48
          ],
          [
            899,
            460.47
          ],
          [
            899,
            466.46
          ],
          [
            899,
            472.46
          ],
          [
            899,
            478.45
          ],
          [
            899,
            484.44
          ],
          [
            899,
            490.43
          ],
          [
            899,
            496.43
          ],
          [
            899,
            502.42
          ],
          [
            899,
            508.41
          ],
          [
            899,
            514.4
          ],
          [
            899,
            520.39
          ],
          [
            899,
            526.39
          ],
          [
            899,
            532.38
          ],
          [
            899,
            538.37
          ],
          [
            899,
            544.36
          ],
          [
            899,
            550.36
          ],
          [
            899,
            556.35
          ],
          [
            899,
            562.34
          ],
          [
            899,
            568.33
          ],
          [
            899,
            574.32
          ],
          [
            899,
            580.32
          ],
          [
            899,
            586.31
          ],
          [
            899,
            592.3
          ],
          [
            899,
            598.29
          ],
          [
            899,
            604.29
          ],
          [
            899,
            610.28
          ],
          [
            899,
            616.27
          ],
          [
            899,
            622.26
          ],
          [
            899,
            628.25
          ],
          [
            899,
            634.25
          ],
          [
            899,
            640.24
          ],
          [
            899,
            646.23
          ],
          [
            899,
            652.22
          ],
          [
            899,
            658.21
          ],
          [
            899,
            664.21
          ],
          [
            899,
            670.2
          ],
          [
            899,
            676.19
          ],
          [
            899,
            682.18
          ],
          [
            899,
            688.18
          ],
          [
            899,
            694.17
          ],
          [
            899,
            700.16
          ],
          [
            899,
            706.15
          ],
          [
            899,
            712.14
          ],
          [
            899,
            718.14
          ],
          [
            899,
            724.13
          ],
          [
            899,
            730.12
          ],
          [
            899,
            736.11
          ],
          [
            899,
            742.11
          ],
          [
            899,
            748.1
          ],
          [
            899,
            754.09
          ],
          [
            899,
            760.08
          ],
          [
            899,
            766.07
          ],
          [
            899,
            772.07
          ],
          [
            899,
            778.06
          ],
          [
            899,
            784.05
          ],
          [
            899,
            790.04
          ],
          [
            899,
            796.04
          ],
          [
            899,
            802.03
          ],
          [
            899,
            808.02
          ],
          [
            899,
            814.01
          ],
          [
            899,
            820
          ],
          [
            888,
            849
          ],
          [
            882.01,
            849
          ],
          [
            876.02,
            849
          ],
          [
            870.03,
            849
          ],
          [
            864.04,
            849
          ],
          [
            858.04,
            849
          ],
          [
            852.05,
            849
          ],
          [
            846.06,
            849
          ],
          [
            840.07,
            849
          ],
          [
            834.07,
            849
          ],
          [
            828.08,
            849
          ],
          [
            822.09,
            849
          ],
          [
            816.1,
            849
          ],
          [
            810.11,
            849
          ],
          [
            804.11,
            849
          ],
          [
            798.12,
            849
          ],
          [
            792.13,
            849
          ],
          [
            786.14,
            849
          ],
          [
            780.14,
            849
          ],
          [
            774.15,
            849
          ],
          [
            768.16,
            849
          ],
          [
            762.17,
            849
          ],
          [
            756.18,
            849
          ],
          [
            750.18,
            849
          ],
          [
            744.19,
            849
          ],
          [
            738.2,
            849
          ],
          [
            732.21,
            849
          ],
          [
            726.21,
            849
          ],
          [
            720.22,
            849
          ],
          [
            714.23,
            849
          ],
          [
            708.24,
            849
          ],
          [
            702.25,
            849
          ],
          [
            696.25,
            849
          ],
          [
            690.26,
            849
          ],
          [
            684.27,
            849
          ],
          [
            678.28,
            849
          ],
          [
            672.29,
            849
          ],
          [
            666.29,
            849
          ],
          [
            660.3,
            849
          ],
          [
            654.31,
            849
          ],
          [
            648.32,
            849
          ],
          [
            636,
            821.32
          ],
          [
            636,
            815.33
          ],
          [
            636,
            809.34
          ],
          [
            636,
            803.35
          ],
          [
            636,
            797.36
          ],
          [
            636,
            791.36
          ],
          [
            636,
            785.37
          ],
          [
            636,
            779.38
          ],
          [
            636,
            773.39
          ],
          [
            636,
            767.39
          ],
          [
            636,
            761.4
          ],
          [
            636,
            755.41
          ],
          [
            636,
            749.42
          ],
          [
            635,
            743.43
          ],
          [
            635,
            737.43
          ],
          [
            635,
            731.44
          ],
          [
            635,
            725.45
          ],
          [
            635,
            719.46
          ],
          [
            635,
            713.46
          ],
          [
            635,
            707.47
          ],
          [
            635,
            701.48
          ],
          [
            635,
            695.49
          ],
          [
            635,
            689.5
          ],
          [
            635,
            683.5
          ],
          [
            635,
            677.51
          ],
          [
            635,
            671.52
          ],
          [
            635,
            665.53
          ],
          [
            635,
            659.54
          ],
          [
            635,
            653.54
          ],
          [
            635,
            647.55
          ],
          [
            635,
            641.56
          ],
          [
            635,
            635.57
          ],
          [
            635,
            629.57
          ],
          [
            635,
            623.58
          ],
          [
            635,
            617.59
          ],
          [
            635,
            611.6
          ],
          [
            635,
            605.61
          ],
          [
            635,
            599.61
          ],
          [
            635,
            593.62
          ],
          [
            635,
            587.63
          ],
          [
            635,
            581.64
          ],
          [
            635,
            575.64
          ],
          [
            635,
            569.65
          ],
          [
            635,
            563.66
          ],
          [
            635,
            557.67
          ],
          [
            635,
            551.68
          ],
          [
            635,
            545.68
          ],
          [
            635,
            539.69
          ],
          [
            635,
            533.7
          ],
          [
            636,
            527.71
          ],
          [
            636,
            521.71
          ],
          [
            636,
            515.72
          ],
          [
            636,
            509.73
          ],
          [
            636,
            503.74
          ],
          [
            636,
            497.75
          ],
          [
            636,
            491.75
          ],
          [
            636,
            485.76
          ],
          [
            636,
            479.77
          ],
          [
            636,
            473.78
          ],
          [
            636,
            467.79
          ],
          [
            636,
            461.79
          ],
          [
            636,
            455.8
          ],
          [
            636,
            449.81
          ],
          [
            636,
            443.82
          ],
          [
            636,
            437.82
          ],
          [
            636,
            431.83
          ],
          [
            636,
            425.84
          ],
          [
            636,
            419.85
          ],
          [
            636,
            413.86
          ],
          [
            636,
            407.86
          ],
          [
            636,
            401.87
          ],
          [
            636,
            395.88
          ],
          [
            636,
            389.89
          ],
          [
            636,
            383.89
          ],
          [
            636,
            377.9
          ],
          [
            636,
            371.91
          ],
          [
            636,
            365.92
          ],
          [
            636,
            359.93
          ],
          [
            636,
            353.93
          ],
          [
            636,
            347.94
          ],
          [
            636,
            341.95
          ],
          [
            636,
            335.96
          ],
          [
            636,
            329.96
          ],
          [
            636,
            323.97
          ],
          [
            636,
            317.98
          ],
          [
            636,
            311.99
          ],
          [
            636,
            306
          ]
        ],
        "corners": [
          [
            636.57,
            303
          ],
          [
            899,
            303
          ],
          [
            899,
            849
          ],
          [
            634.11,
            849
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.7186,
        "polygon_used": true,
        "depth_m": 0.2
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
