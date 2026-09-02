// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/liner-3
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
window.HOLO_FIXTURES["liner-3"] = {
  id: "liner-3",
  fp: "8ca7e9e4",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    {
      "id": "writing_room",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_writing_room_gallery",
          "from": "writing_room",
          "facing": "N",
          "to": "gallery",
          "arrive_facing": "N",
          "via": "door01"
        }
      ]
    },
    {
      "id": "gallery",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_gallery_writing_room",
          "from": "gallery",
          "facing": "S",
          "to": "writing_room",
          "arrive_facing": "S",
          "via": "door01"
        },
        {
          "id": "door_gallery_saloon",
          "from": "gallery",
          "facing": "N",
          "to": "saloon",
          "arrive_facing": "N",
          "via": "door02"
        },
        {
          "id": "way_gallery_gallery_far",
          "from": "gallery",
          "facing": "E",
          "to": "gallery_far",
          "arrive_facing": "E",
          "via": "way01"
        }
      ]
    },
    {
      "id": "gallery_far",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_gallery_far_gallery",
          "from": "gallery_far",
          "facing": "W",
          "to": "gallery",
          "arrive_facing": "W",
          "via": "way01"
        }
      ]
    },
    {
      "id": "saloon",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_saloon_gallery",
          "from": "saloon",
          "facing": "S",
          "to": "gallery",
          "arrive_facing": "S",
          "via": "door02"
        },
        {
          "id": "way_saloon_saloon_e",
          "from": "saloon",
          "facing": "E",
          "to": "saloon_e",
          "arrive_facing": "E",
          "via": "way02"
        },
        {
          "id": "way_saloon_saloon_n",
          "from": "saloon",
          "facing": "N",
          "to": "saloon_n",
          "arrive_facing": "N",
          "via": "way04"
        }
      ]
    },
    {
      "id": "saloon_e",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_saloon_e_saloon",
          "from": "saloon_e",
          "facing": "W",
          "to": "saloon",
          "arrive_facing": "W",
          "via": "way02"
        },
        {
          "id": "way_saloon_e_saloon_ne",
          "from": "saloon_e",
          "facing": "N",
          "to": "saloon_ne",
          "arrive_facing": "N",
          "via": "way05"
        }
      ]
    },
    {
      "id": "saloon_n",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_saloon_n_saloon_ne",
          "from": "saloon_n",
          "facing": "E",
          "to": "saloon_ne",
          "arrive_facing": "E",
          "via": "way03"
        },
        {
          "id": "way_saloon_n_saloon",
          "from": "saloon_n",
          "facing": "S",
          "to": "saloon",
          "arrive_facing": "S",
          "via": "way04"
        }
      ]
    },
    {
      "id": "saloon_ne",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_saloon_ne_saloon_n",
          "from": "saloon_ne",
          "facing": "W",
          "to": "saloon_n",
          "arrive_facing": "W",
          "via": "way03"
        },
        {
          "id": "way_saloon_ne_saloon_e",
          "from": "saloon_ne",
          "facing": "S",
          "to": "saloon_e",
          "arrive_facing": "S",
          "via": "way05"
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
    "go.door_gallery_saloon.arrive": "You pass from the long gallery into the grand saloon.",
    "go.door_gallery_saloon.refused_unreachable": "The way from the long gallery to the grand saloon is not before you from here.",
    "go.door_gallery_writing_room.arrive": "You pass from the long gallery into the writing room.",
    "go.door_gallery_writing_room.refused_unreachable": "The way from the long gallery to the writing room is not before you from here.",
    "go.door_saloon_gallery.arrive": "You pass from the grand saloon into the long gallery.",
    "go.door_saloon_gallery.refused_unreachable": "The way from the grand saloon to the long gallery is not before you from here.",
    "go.door_writing_room_gallery.arrive": "You pass from the writing room into the long gallery.",
    "go.door_writing_room_gallery.refused_unreachable": "The way from the writing room to the long gallery is not before you from here.",
    "go.way_gallery_far_gallery.arrive": "You walk back along the long gallery.",
    "go.way_gallery_far_gallery.refused_unreachable": "The way back along the long gallery is not before you from here.",
    "go.way_gallery_gallery_far.arrive": "You walk on down the long gallery.",
    "go.way_gallery_gallery_far.refused_unreachable": "The way on down the long gallery is not before you from here.",
    "go.way_saloon_e_saloon.arrive": "You walk westward along the grand saloon's southern side.",
    "go.way_saloon_e_saloon.refused_unreachable": "The way westward along the grand saloon's southern side is not before you from here.",
    "go.way_saloon_e_saloon_ne.arrive": "You walk northward along the grand saloon's eastern side.",
    "go.way_saloon_e_saloon_ne.refused_unreachable": "The way northward along the grand saloon's eastern side is not before you from here.",
    "go.way_saloon_n_saloon.arrive": "You walk southward along the grand saloon's western side.",
    "go.way_saloon_n_saloon.refused_unreachable": "The way southward along the grand saloon's western side is not before you from here.",
    "go.way_saloon_n_saloon_ne.arrive": "You walk eastward along the grand saloon's northern side.",
    "go.way_saloon_n_saloon_ne.refused_unreachable": "The way eastward along the grand saloon's northern side is not before you from here.",
    "go.way_saloon_ne_saloon_e.arrive": "You walk southward along the grand saloon's eastern side.",
    "go.way_saloon_ne_saloon_e.refused_unreachable": "The way southward along the grand saloon's eastern side is not before you from here.",
    "go.way_saloon_ne_saloon_n.arrive": "You walk westward along the grand saloon's northern side.",
    "go.way_saloon_ne_saloon_n.refused_unreachable": "The way westward along the grand saloon's northern side is not before you from here.",
    "go.way_saloon_saloon_e.arrive": "You walk eastward along the grand saloon's southern side.",
    "go.way_saloon_saloon_e.refused_unreachable": "The way eastward along the grand saloon's southern side is not before you from here.",
    "go.way_saloon_saloon_n.arrive": "You walk northward along the grand saloon's western side.",
    "go.way_saloon_saloon_n.refused_unreachable": "The way northward along the grand saloon's western side is not before you from here."
  }
},
  viewstate: {
  "location": "writing_room",
  "facing": "N"
},
  metas: {
  "writing_room/N": {
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
  "writing_room/E": {
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
  "writing_room/S": {
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
  "writing_room/W": {
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
  "gallery/N": {
    "floor_line_y": 0.750977,
    "px_per_m_at_wall": 199.167,
    "px_per_m_at_bottom": 421.04,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8ae89",
    "image_h_px": 1024,
    "horizon_y": 0.527441,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 239,
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
    "corner_x0_px": 92,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery-N/row23-35d3ce83.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "7c45fc4d1f01",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 956,
    "nearest_floor_m": 2.2706,
    "measured_room": {
      "storey_height_m": 3.525,
      "wall_width_m": 13.677,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            648.5,
            887.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            662,
            873
          ],
          "painted_centre_px": 767.5,
          "centre_delta_px": -0.5,
          "centre_delta_m": -0.003,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 653,
        "y": 368,
        "w": 229,
        "h": 401,
        "beyond_m": 13,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            664.38,
            368
          ],
          [
            669.15,
            368
          ],
          [
            673.91,
            369
          ],
          [
            678.68,
            369
          ],
          [
            683.45,
            369
          ],
          [
            688.21,
            369
          ],
          [
            692.98,
            369
          ],
          [
            697.74,
            369
          ],
          [
            702.51,
            368
          ],
          [
            707.27,
            368
          ],
          [
            712.04,
            368
          ],
          [
            716.8,
            368
          ],
          [
            721.57,
            368
          ],
          [
            726.34,
            368
          ],
          [
            731.1,
            368
          ],
          [
            735.87,
            368
          ],
          [
            740.63,
            368
          ],
          [
            745.4,
            368
          ],
          [
            750.16,
            368
          ],
          [
            754.93,
            369
          ],
          [
            759.7,
            369
          ],
          [
            764.46,
            368
          ],
          [
            769.23,
            368
          ],
          [
            773.99,
            370
          ],
          [
            778.76,
            370
          ],
          [
            783.52,
            370
          ],
          [
            788.29,
            370
          ],
          [
            793.05,
            370
          ],
          [
            797.82,
            370
          ],
          [
            802.59,
            370
          ],
          [
            807.35,
            370
          ],
          [
            812.12,
            370
          ],
          [
            816.88,
            370
          ],
          [
            821.65,
            370
          ],
          [
            826.41,
            370
          ],
          [
            831.18,
            370
          ],
          [
            835.95,
            370
          ],
          [
            840.71,
            370
          ],
          [
            845.48,
            370
          ],
          [
            850.24,
            370
          ],
          [
            855.01,
            370
          ],
          [
            859.77,
            370
          ],
          [
            864.54,
            370
          ],
          [
            869.3,
            370
          ],
          [
            882,
            371.07
          ],
          [
            881,
            375.84
          ],
          [
            880,
            380.6
          ],
          [
            880,
            385.37
          ],
          [
            880,
            390.13
          ],
          [
            880,
            394.9
          ],
          [
            880,
            399.66
          ],
          [
            881,
            404.43
          ],
          [
            881,
            409.2
          ],
          [
            881,
            413.96
          ],
          [
            881,
            418.73
          ],
          [
            881,
            423.49
          ],
          [
            881,
            428.26
          ],
          [
            882,
            433.02
          ],
          [
            882,
            437.79
          ],
          [
            882,
            442.55
          ],
          [
            882,
            447.32
          ],
          [
            882,
            452.09
          ],
          [
            882,
            456.85
          ],
          [
            882,
            461.62
          ],
          [
            882,
            466.38
          ],
          [
            882,
            471.15
          ],
          [
            882,
            475.91
          ],
          [
            882,
            480.68
          ],
          [
            882,
            485.45
          ],
          [
            882,
            490.21
          ],
          [
            881,
            494.98
          ],
          [
            881,
            499.74
          ],
          [
            881,
            504.51
          ],
          [
            881,
            509.27
          ],
          [
            881,
            514.04
          ],
          [
            881,
            518.8
          ],
          [
            881,
            523.57
          ],
          [
            881,
            528.34
          ],
          [
            881,
            533.1
          ],
          [
            881,
            537.87
          ],
          [
            881,
            542.63
          ],
          [
            881,
            547.4
          ],
          [
            881,
            552.16
          ],
          [
            881,
            556.93
          ],
          [
            881,
            561.7
          ],
          [
            877,
            566.46
          ],
          [
            877,
            571.23
          ],
          [
            873,
            575.99
          ],
          [
            873,
            580.76
          ],
          [
            873,
            585.52
          ],
          [
            873,
            590.29
          ],
          [
            873,
            595.05
          ],
          [
            873,
            599.82
          ],
          [
            873,
            604.59
          ],
          [
            873,
            609.35
          ],
          [
            873,
            614.12
          ],
          [
            873,
            618.88
          ],
          [
            873,
            623.65
          ],
          [
            873,
            628.41
          ],
          [
            873,
            633.18
          ],
          [
            881,
            637.95
          ],
          [
            881,
            642.71
          ],
          [
            881,
            647.48
          ],
          [
            881,
            652.24
          ],
          [
            881,
            657.01
          ],
          [
            881,
            661.77
          ],
          [
            881,
            666.54
          ],
          [
            881,
            671.3
          ],
          [
            881,
            676.07
          ],
          [
            881,
            680.84
          ],
          [
            881,
            685.6
          ],
          [
            881,
            690.37
          ],
          [
            881,
            695.13
          ],
          [
            881,
            699.9
          ],
          [
            881,
            704.66
          ],
          [
            881,
            709.43
          ],
          [
            881,
            714.2
          ],
          [
            881,
            718.96
          ],
          [
            881,
            723.73
          ],
          [
            881,
            728.49
          ],
          [
            881,
            733.26
          ],
          [
            881,
            738.02
          ],
          [
            881,
            742.79
          ],
          [
            881,
            747.55
          ],
          [
            881,
            752.32
          ],
          [
            881,
            757.09
          ],
          [
            881,
            761.85
          ],
          [
            881,
            766.62
          ],
          [
            870.62,
            769
          ],
          [
            865.85,
            769
          ],
          [
            861.09,
            769
          ],
          [
            856.32,
            769
          ],
          [
            851.55,
            769
          ],
          [
            846.79,
            769
          ],
          [
            842.02,
            769
          ],
          [
            837.26,
            769
          ],
          [
            832.49,
            769
          ],
          [
            827.73,
            769
          ],
          [
            822.96,
            769
          ],
          [
            818.2,
            769
          ],
          [
            813.43,
            769
          ],
          [
            808.66,
            769
          ],
          [
            803.9,
            769
          ],
          [
            799.13,
            769
          ],
          [
            794.37,
            769
          ],
          [
            789.6,
            769
          ],
          [
            784.84,
            769
          ],
          [
            780.07,
            769
          ],
          [
            775.3,
            769
          ],
          [
            770.54,
            769
          ],
          [
            765.77,
            769
          ],
          [
            761.01,
            769
          ],
          [
            756.24,
            769
          ],
          [
            751.48,
            769
          ],
          [
            746.71,
            769
          ],
          [
            741.95,
            769
          ],
          [
            737.18,
            769
          ],
          [
            732.41,
            769
          ],
          [
            727.65,
            769
          ],
          [
            722.88,
            769
          ],
          [
            718.12,
            769
          ],
          [
            713.35,
            769
          ],
          [
            708.59,
            769
          ],
          [
            703.82,
            769
          ],
          [
            699.05,
            769
          ],
          [
            694.29,
            769
          ],
          [
            689.52,
            769
          ],
          [
            684.76,
            769
          ],
          [
            679.99,
            769
          ],
          [
            675.23,
            769
          ],
          [
            670.46,
            769
          ],
          [
            665.7,
            769
          ],
          [
            653,
            767.93
          ],
          [
            653,
            763.16
          ],
          [
            653,
            758.4
          ],
          [
            653,
            753.63
          ],
          [
            653,
            748.87
          ],
          [
            653,
            744.1
          ],
          [
            653,
            739.34
          ],
          [
            653,
            734.57
          ],
          [
            653,
            729.8
          ],
          [
            653,
            725.04
          ],
          [
            653,
            720.27
          ],
          [
            653,
            715.51
          ],
          [
            653,
            710.74
          ],
          [
            653,
            705.98
          ],
          [
            653,
            701.21
          ],
          [
            653,
            696.45
          ],
          [
            653,
            691.68
          ],
          [
            653,
            686.91
          ],
          [
            653,
            682.15
          ],
          [
            653,
            677.38
          ],
          [
            653,
            672.62
          ],
          [
            653,
            667.85
          ],
          [
            653,
            663.09
          ],
          [
            653,
            658.32
          ],
          [
            653,
            653.55
          ],
          [
            653,
            648.79
          ],
          [
            653,
            644.02
          ],
          [
            653,
            639.26
          ],
          [
            653,
            634.49
          ],
          [
            653,
            629.73
          ],
          [
            653,
            624.96
          ],
          [
            653,
            620.2
          ],
          [
            653,
            615.43
          ],
          [
            653,
            610.66
          ],
          [
            653,
            605.9
          ],
          [
            653,
            601.13
          ],
          [
            653,
            596.37
          ],
          [
            653,
            591.6
          ],
          [
            653,
            586.84
          ],
          [
            653,
            582.07
          ],
          [
            653,
            577.3
          ],
          [
            653,
            572.54
          ],
          [
            653,
            567.77
          ],
          [
            653,
            563.01
          ],
          [
            653,
            558.24
          ],
          [
            653,
            553.48
          ],
          [
            653,
            548.71
          ],
          [
            653,
            543.95
          ],
          [
            653,
            539.18
          ],
          [
            653,
            534.41
          ],
          [
            653,
            529.65
          ],
          [
            653,
            524.88
          ],
          [
            653,
            520.12
          ],
          [
            653,
            515.35
          ],
          [
            653,
            510.59
          ],
          [
            653,
            505.82
          ],
          [
            653,
            501.05
          ],
          [
            653,
            496.29
          ],
          [
            653,
            491.52
          ],
          [
            653,
            486.76
          ],
          [
            653,
            481.99
          ],
          [
            653,
            477.23
          ],
          [
            653,
            472.46
          ],
          [
            653,
            467.7
          ],
          [
            653,
            462.93
          ],
          [
            653,
            458.16
          ],
          [
            653,
            453.4
          ],
          [
            653,
            448.63
          ],
          [
            653,
            443.87
          ],
          [
            653,
            439.1
          ],
          [
            653,
            434.34
          ],
          [
            653,
            429.57
          ],
          [
            653,
            424.8
          ],
          [
            653,
            420.04
          ],
          [
            653,
            415.27
          ],
          [
            653,
            410.51
          ],
          [
            654,
            405.74
          ],
          [
            654,
            400.98
          ],
          [
            654,
            396.21
          ],
          [
            654,
            391.45
          ],
          [
            654,
            386.68
          ],
          [
            654,
            381.91
          ],
          [
            654,
            377.15
          ],
          [
            654,
            372.38
          ]
        ],
        "corners": [
          [
            653,
            366.5
          ],
          [
            869.3,
            370
          ],
          [
            870.62,
            769
          ],
          [
            653,
            769
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.7605,
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
  "gallery/E": {
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
    "openings": [],
    "stairs": []
  },
  "gallery/S": {
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
    "corner_x0_px": -1280,
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
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333314,
    "cell_x1_px": 1450.6666666666667,
    "stairs": []
  },
  "gallery/W": {
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
  "gallery_far/N": {
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
    "corner_x0_px": -1280,
    "corner_x1_px": 1450.6666666666665,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333326,
    "cell_x1_px": 1450.6666666666665,
    "stairs": []
  },
  "gallery_far/E": {
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
  "gallery_far/S": {
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
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333348,
    "cell_x1_px": 1450.6666666666667,
    "stairs": []
  },
  "gallery_far/W": {
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
    "openings": [],
    "stairs": []
  },
  "saloon/N": {
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
    "corner_x1_px": 1645.7142857142858,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285714,
    "cell_x1_px": 1060.5714285714287,
    "stairs": []
  },
  "saloon/E": {
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
    "corner_x0_px": -109.71428571428555,
    "corner_x1_px": 1060.5714285714287,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285715,
    "cell_x1_px": 1060.5714285714287,
    "stairs": []
  },
  "saloon/S": {
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
    "corner_x0_px": -1280,
    "corner_x1_px": 1450.6666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [
      {
        "id": "door02",
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
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333314,
    "cell_x1_px": 1450.6666666666667,
    "stairs": []
  },
  "saloon/W": {
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
    "corner_x0_px": 85.33333333333303,
    "corner_x1_px": 2815.9999999999995,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333303,
    "cell_x1_px": 1450.6666666666665,
    "stairs": []
  },
  "saloon_e/N": {
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
    "corner_x0_px": -109.71428571428567,
    "corner_x1_px": 1060.5714285714284,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285714,
    "cell_x1_px": 1060.5714285714284,
    "stairs": []
  },
  "saloon_e/E": {
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
    "corner_x0_px": -1279.9999999999995,
    "corner_x1_px": 1450.666666666667,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333348,
    "cell_x1_px": 1450.666666666667,
    "stairs": []
  },
  "saloon_e/S": {
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
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333348,
    "cell_x1_px": 1450.6666666666667,
    "stairs": []
  },
  "saloon_e/W": {
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
    "corner_x0_px": 475.42857142857133,
    "corner_x1_px": 1645.7142857142856,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.42857142857133,
    "cell_x1_px": 1060.5714285714284,
    "stairs": []
  },
  "saloon_n/N": {
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
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333326,
    "cell_x1_px": 1450.666666666667,
    "stairs": []
  },
  "saloon_n/E": {
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
    "corner_x0_px": 475.4285714285715,
    "corner_x1_px": 1645.7142857142858,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285715,
    "cell_x1_px": 1060.5714285714284,
    "stairs": []
  },
  "saloon_n/S": {
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
    "corner_x0_px": -109.71428571428567,
    "corner_x1_px": 1060.5714285714287,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [
      {
        "id": "door02",
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
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285714,
    "cell_x1_px": 1060.5714285714287,
    "stairs": []
  },
  "saloon_n/W": {
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
    "corner_x0_px": -1280,
    "corner_x1_px": 1450.6666666666665,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333348,
    "cell_x1_px": 1450.6666666666665,
    "stairs": []
  },
  "saloon_ne/N": {
    "floor_line_y": 0.745117,
    "px_per_m_at_wall": 198.333,
    "px_per_m_at_bottom": 418.61,
    "wall_width_m": 6.4,
    "key_tint": "#c8935d",
    "image_h_px": 1024,
    "horizon_y": 0.515625,
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
    "corner_x0_px": -1280,
    "corner_x1_px": 1422,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_ne-N/row23-5cfb5cff.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "a4c0f4033b43",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 952,
    "nearest_floor_m": 2.2742,
    "measured_room": {
      "storey_height_m": 3.479,
      "wall_width_m": 13.624,
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
  "saloon_ne/E": {
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
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.8,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 85.33333333333348,
    "cell_x1_px": 1450.6666666666665,
    "stairs": []
  },
  "saloon_ne/S": {
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
    "corner_x0_px": 475.4285714285715,
    "corner_x1_px": 1645.7142857142858,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285715,
    "cell_x1_px": 1060.5714285714287,
    "stairs": []
  },
  "saloon_ne/W": {
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
    "corner_x0_px": -109.71428571428567,
    "corner_x1_px": 1060.5714285714284,
    "focal_px": 1024,
    "storey_height_m": 3.4,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 11.2,
    "openings": [],
    "wall_run_m": 12.8,
    "cell_x0_px": 475.4285714285715,
    "cell_x1_px": 1060.5714285714284,
    "stairs": []
  }
}
};
