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
  fp: "1afaed8e",
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
    "key_tint": "#c8aa84",
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
      "storey_height_m": 3.304,
      "wall_width_m": 4.375,
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
          "corner_x1_px": 1247,
          "corner_scale_px_per_m": 172.333
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
        "x": 666,
        "y": 340,
        "w": 205,
        "h": 434,
        "beyond_m": 4.4,
        "beyond_offset_m": 0,
        "measured": true
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
    "key_tint": "#c8b698",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 267,
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
    "focal_px": 1019.5,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.263,
      "wall_width_m": 6.023,
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
          "scale": 1.105,
          "target_px": 1462.9,
          "source_px": 1324
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 242.727,
          "floor_line_y": 0.794922,
          "corner_x0_px": 37,
          "corner_x1_px": 1499,
          "corner_scale_px_per_m": 243.667
        },
        "warped_from": "backdrops/source/noodle_bar-S/row23-883dcbba.png",
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
        "x": 547,
        "y": 290,
        "w": 443,
        "h": 316,
        "sill_m": 0.857,
        "head_m": 2.159,
        "measured": true
      }
    ],
    "window_evidence": {
      "unpainted": 0,
      "read_by": "design/plan-draft/measured/window_measure.py",
      "ruled": 1,
      "painted": 1,
      "unruled": [],
      "note": "every glazed opening the painting shows answers to a window the plan rules"
    }
  },
  "noodle_bar/W": {
    "floor_line_y": 0.776658,
    "px_per_m_at_wall": 227.556,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.6,
    "key_tint": "#c8b290",
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
    "key_tint": "#c8b69e",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.10 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 276,
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
    "focal_px": 940.9,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.153,
      "wall_width_m": 5.978,
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
          "scale": 1.201,
          "target_px": 1529.2,
          "source_px": 1273
        },
        "revealed_px": 0,
        "remeasured": {
          "px_per_m_at_wall": 250.909,
          "floor_line_y": 0.807617,
          "corner_x0_px": 10,
          "corner_x1_px": 1510,
          "corner_scale_px_per_m": 267.857
        },
        "warped_from": "backdrops/source/back_office-E/row23-746058a5.png",
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
      "wall_width_m": 4.325,
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
          "corner_x1_px": 1284,
          "corner_scale_px_per_m": 246.19
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
        "x": 644,
        "y": 303,
        "w": 247,
        "h": 520,
        "beyond_m": 6.2,
        "beyond_offset_m": 0,
        "measured": true
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
