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
  fp: "a4883fd6",
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
    "floor_line_y": 0.756836,
    "px_per_m_at_wall": 200,
    "px_per_m_at_bottom": 395.45,
    "wall_width_m": 6.4,
    "key_tint": "#c8a57a",
    "image_h_px": 1024,
    "horizon_y": 0.508008,
    "key_dir": "L-ABOVE",
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
    "corner_x0_px": 96,
    "corner_x1_px": 1420,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/writing_room-N/row23-f3bc53b6.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "6ccb6fc568cf",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 960,
    "nearest_floor_m": 2.4276,
    "measured_room": {
      "storey_height_m": 3.565,
      "wall_width_m": 6.62,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            648,
            888
          ],
          "plan_centre_px": 768,
          "painted_px": [
            660,
            876
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
        "x": 655,
        "y": 356,
        "w": 226,
        "h": 419,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            662.48,
            356
          ],
          [
            667.44,
            356
          ],
          [
            672.4,
            356
          ],
          [
            677.36,
            356
          ],
          [
            682.32,
            356
          ],
          [
            687.29,
            356
          ],
          [
            692.25,
            356
          ],
          [
            697.21,
            356
          ],
          [
            702.17,
            356
          ],
          [
            707.13,
            356
          ],
          [
            712.09,
            356
          ],
          [
            717.05,
            356
          ],
          [
            722.01,
            356
          ],
          [
            726.97,
            356
          ],
          [
            731.93,
            356
          ],
          [
            736.89,
            356
          ],
          [
            741.86,
            356
          ],
          [
            746.82,
            356
          ],
          [
            751.78,
            356
          ],
          [
            756.74,
            356
          ],
          [
            761.7,
            356
          ],
          [
            766.66,
            356
          ],
          [
            771.62,
            356
          ],
          [
            776.58,
            356
          ],
          [
            781.54,
            356
          ],
          [
            786.5,
            356
          ],
          [
            791.46,
            356
          ],
          [
            796.43,
            356
          ],
          [
            801.39,
            356
          ],
          [
            806.35,
            356
          ],
          [
            811.31,
            356
          ],
          [
            816.27,
            356
          ],
          [
            821.23,
            356
          ],
          [
            826.19,
            356
          ],
          [
            831.15,
            356
          ],
          [
            836.11,
            356
          ],
          [
            841.07,
            356
          ],
          [
            846.04,
            356
          ],
          [
            851,
            356
          ],
          [
            855.96,
            356
          ],
          [
            860.92,
            356
          ],
          [
            865.88,
            356
          ],
          [
            870.84,
            356
          ],
          [
            875.8,
            356
          ],
          [
            881,
            360.76
          ],
          [
            881,
            365.72
          ],
          [
            881,
            370.68
          ],
          [
            881,
            375.64
          ],
          [
            881,
            380.61
          ],
          [
            881,
            385.57
          ],
          [
            881,
            390.53
          ],
          [
            881,
            395.49
          ],
          [
            881,
            400.45
          ],
          [
            881,
            405.41
          ],
          [
            881,
            410.37
          ],
          [
            881,
            415.33
          ],
          [
            881,
            420.29
          ],
          [
            881,
            425.25
          ],
          [
            881,
            430.21
          ],
          [
            881,
            435.18
          ],
          [
            881,
            440.14
          ],
          [
            881,
            445.1
          ],
          [
            881,
            450.06
          ],
          [
            881,
            455.02
          ],
          [
            881,
            459.98
          ],
          [
            881,
            464.94
          ],
          [
            881,
            469.9
          ],
          [
            881,
            474.86
          ],
          [
            881,
            479.82
          ],
          [
            881,
            484.79
          ],
          [
            881,
            489.75
          ],
          [
            881,
            494.71
          ],
          [
            881,
            499.67
          ],
          [
            881,
            504.63
          ],
          [
            881,
            509.59
          ],
          [
            881,
            514.55
          ],
          [
            881,
            519.51
          ],
          [
            881,
            524.47
          ],
          [
            881,
            529.43
          ],
          [
            881,
            534.39
          ],
          [
            881,
            539.36
          ],
          [
            881,
            544.32
          ],
          [
            881,
            549.28
          ],
          [
            881,
            554.24
          ],
          [
            881,
            559.2
          ],
          [
            881,
            564.16
          ],
          [
            881,
            569.12
          ],
          [
            881,
            574.08
          ],
          [
            881,
            579.04
          ],
          [
            881,
            584
          ],
          [
            881,
            588.96
          ],
          [
            881,
            593.93
          ],
          [
            881,
            598.89
          ],
          [
            881,
            603.85
          ],
          [
            881,
            608.81
          ],
          [
            881,
            613.77
          ],
          [
            881,
            618.73
          ],
          [
            881,
            623.69
          ],
          [
            881,
            628.65
          ],
          [
            881,
            633.61
          ],
          [
            881,
            638.57
          ],
          [
            881,
            643.54
          ],
          [
            881,
            648.5
          ],
          [
            881,
            653.46
          ],
          [
            881,
            658.42
          ],
          [
            881,
            663.38
          ],
          [
            881,
            668.34
          ],
          [
            881,
            673.3
          ],
          [
            881,
            678.26
          ],
          [
            881,
            683.22
          ],
          [
            881,
            688.18
          ],
          [
            881,
            693.14
          ],
          [
            881,
            698.11
          ],
          [
            881,
            703.07
          ],
          [
            881,
            708.03
          ],
          [
            881,
            712.99
          ],
          [
            881,
            717.95
          ],
          [
            881,
            722.91
          ],
          [
            881,
            727.87
          ],
          [
            881,
            732.83
          ],
          [
            881,
            737.79
          ],
          [
            881,
            742.75
          ],
          [
            881,
            747.71
          ],
          [
            881,
            752.68
          ],
          [
            881,
            757.64
          ],
          [
            881,
            762.6
          ],
          [
            881,
            767.56
          ],
          [
            881,
            772.52
          ],
          [
            873.52,
            775
          ],
          [
            868.56,
            775
          ],
          [
            863.6,
            775
          ],
          [
            858.64,
            775
          ],
          [
            853.68,
            775
          ],
          [
            848.71,
            775
          ],
          [
            843.75,
            775
          ],
          [
            838.79,
            775
          ],
          [
            833.83,
            775
          ],
          [
            828.87,
            775
          ],
          [
            823.91,
            775
          ],
          [
            818.95,
            775
          ],
          [
            813.99,
            775
          ],
          [
            809.03,
            775
          ],
          [
            804.07,
            775
          ],
          [
            799.11,
            775
          ],
          [
            794.14,
            775
          ],
          [
            789.18,
            775
          ],
          [
            784.22,
            775
          ],
          [
            779.26,
            775
          ],
          [
            774.3,
            775
          ],
          [
            769.34,
            775
          ],
          [
            764.38,
            775
          ],
          [
            759.42,
            775
          ],
          [
            754.46,
            775
          ],
          [
            749.5,
            775
          ],
          [
            744.54,
            775
          ],
          [
            739.57,
            775
          ],
          [
            734.61,
            775
          ],
          [
            729.65,
            775
          ],
          [
            724.69,
            775
          ],
          [
            719.73,
            775
          ],
          [
            714.77,
            775
          ],
          [
            709.81,
            775
          ],
          [
            704.85,
            775
          ],
          [
            699.89,
            775
          ],
          [
            694.93,
            775
          ],
          [
            689.96,
            775
          ],
          [
            685,
            775
          ],
          [
            680.04,
            775
          ],
          [
            675.08,
            775
          ],
          [
            670.12,
            775
          ],
          [
            665.16,
            775
          ],
          [
            660.2,
            775
          ],
          [
            655,
            770.24
          ],
          [
            655,
            765.28
          ],
          [
            655,
            760.32
          ],
          [
            655,
            755.36
          ],
          [
            655,
            750.39
          ],
          [
            655,
            745.43
          ],
          [
            655,
            740.47
          ],
          [
            655,
            735.51
          ],
          [
            655,
            730.55
          ],
          [
            655,
            725.59
          ],
          [
            655,
            720.63
          ],
          [
            655,
            715.67
          ],
          [
            655,
            710.71
          ],
          [
            655,
            705.75
          ],
          [
            655,
            700.79
          ],
          [
            655,
            695.82
          ],
          [
            655,
            690.86
          ],
          [
            655,
            685.9
          ],
          [
            655,
            680.94
          ],
          [
            655,
            675.98
          ],
          [
            655,
            671.02
          ],
          [
            655,
            666.06
          ],
          [
            655,
            661.1
          ],
          [
            655,
            656.14
          ],
          [
            655,
            651.18
          ],
          [
            655,
            646.21
          ],
          [
            655,
            641.25
          ],
          [
            655,
            636.29
          ],
          [
            655,
            631.33
          ],
          [
            655,
            626.37
          ],
          [
            655,
            621.41
          ],
          [
            655,
            616.45
          ],
          [
            655,
            611.49
          ],
          [
            655,
            606.53
          ],
          [
            655,
            601.57
          ],
          [
            655,
            596.61
          ],
          [
            655,
            591.64
          ],
          [
            655,
            586.68
          ],
          [
            655,
            581.72
          ],
          [
            655,
            576.76
          ],
          [
            655,
            571.8
          ],
          [
            655,
            566.84
          ],
          [
            655,
            561.88
          ],
          [
            655,
            556.92
          ],
          [
            655,
            551.96
          ],
          [
            655,
            547
          ],
          [
            655,
            542.04
          ],
          [
            655,
            537.07
          ],
          [
            655,
            532.11
          ],
          [
            655,
            527.15
          ],
          [
            655,
            522.19
          ],
          [
            655,
            517.23
          ],
          [
            655,
            512.27
          ],
          [
            655,
            507.31
          ],
          [
            655,
            502.35
          ],
          [
            655,
            497.39
          ],
          [
            655,
            492.43
          ],
          [
            655,
            487.46
          ],
          [
            655,
            482.5
          ],
          [
            655,
            477.54
          ],
          [
            655,
            472.58
          ],
          [
            655,
            467.62
          ],
          [
            655,
            462.66
          ],
          [
            655,
            457.7
          ],
          [
            655,
            452.74
          ],
          [
            655,
            447.78
          ],
          [
            655,
            442.82
          ],
          [
            655,
            437.86
          ],
          [
            655,
            432.89
          ],
          [
            655,
            427.93
          ],
          [
            655,
            422.97
          ],
          [
            655,
            418.01
          ],
          [
            655,
            413.05
          ],
          [
            655,
            408.09
          ],
          [
            655,
            403.13
          ],
          [
            655,
            398.17
          ],
          [
            655,
            393.21
          ],
          [
            655,
            388.25
          ],
          [
            655,
            383.29
          ],
          [
            655,
            378.32
          ],
          [
            655,
            373.36
          ],
          [
            655,
            368.4
          ],
          [
            655,
            363.44
          ],
          [
            655,
            358.48
          ]
        ],
        "corners": [
          [
            655,
            356
          ],
          [
            881,
            356
          ],
          [
            881,
            775
          ],
          [
            655,
            775
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9085,
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
  "writing_room/E": {
    "floor_line_y": 0.75,
    "px_per_m_at_wall": 205,
    "px_per_m_at_bottom": 408.25,
    "wall_width_m": 6.4,
    "key_tint": "#c8a071",
    "image_h_px": 1024,
    "horizon_y": 0.497852,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
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
    "corner_x0_px": 104,
    "corner_x1_px": 1431,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/writing_room-E/row23-25f33033.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "4743941cf38d",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 984,
    "nearest_floor_m": 2.4103,
    "measured_room": {
      "storey_height_m": 3.488,
      "wall_width_m": 6.473,
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
  "writing_room/S": {
    "floor_line_y": 0.751953,
    "px_per_m_at_wall": 206.667,
    "px_per_m_at_bottom": 421.63,
    "wall_width_m": 6.4,
    "key_tint": "#c8a77e",
    "image_h_px": 1024,
    "horizon_y": 0.513477,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 248,
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
    "corner_x0_px": 100,
    "corner_x1_px": 1435,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/writing_room-S/row23-17ab75e2.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "4743941cf38d",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 992,
    "nearest_floor_m": 2.3528,
    "measured_room": {
      "storey_height_m": 3.421,
      "wall_width_m": 6.46,
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
  "writing_room/W": {
    "floor_line_y": 0.749023,
    "px_per_m_at_wall": 204.167,
    "px_per_m_at_bottom": 406.37,
    "wall_width_m": 6.4,
    "key_tint": "#c8a276",
    "image_h_px": 1024,
    "horizon_y": 0.495605,
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
    "corner_x0_px": 106,
    "corner_x1_px": 1429,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/writing_room-W/row23-1864f7a5.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "63dbd6de142e",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 980,
    "nearest_floor_m": 2.4116,
    "measured_room": {
      "storey_height_m": 3.497,
      "wall_width_m": 6.48,
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
    "floor_line_y": 0.619395,
    "px_per_m_at_wall": 91.429,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8b898",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 108,
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
    "camera_id": "measured:backdrops/source-warped/gallery-E/warped.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "5c5cc2cde041",
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
    "focal_px": 1008,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.556,
      "wall_width_m": 6.444,
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
          "scale": 1.002,
          "target_px": 580.3,
          "source_px": 579
        },
        "revealed_px": 49086,
        "remeasured": {
          "px_per_m_at_wall": 90,
          "floor_line_y": 0.624023,
          "corner_x0_px": 478,
          "corner_x1_px": 1058,
          "corner_scale_px_per_m": 90.625
        },
        "warped_from": "backdrops/source/gallery-E/row23-4443b35e.png",
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
  "gallery/S": {
    "floor_line_y": 0.74707,
    "px_per_m_at_wall": 203.333,
    "px_per_m_at_bottom": 412.23,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b08e",
    "image_h_px": 1024,
    "horizon_y": 0.500879,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 244,
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
    "corner_x1_px": 1438,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery-S/row23-dce57a09.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "63dbd6de142e",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 976,
    "nearest_floor_m": 2.3676,
    "measured_room": {
      "storey_height_m": 3.428,
      "wall_width_m": 13.367,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door01",
          "plan_px": [
            646,
            890
          ],
          "plan_centre_px": 768,
          "painted_px": [
            663,
            872
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
        "x": 654,
        "y": 368,
        "w": 229,
        "h": 397,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            665.37,
            368
          ],
          [
            670.1,
            368
          ],
          [
            674.84,
            368
          ],
          [
            679.57,
            368
          ],
          [
            684.3,
            368
          ],
          [
            689.04,
            368
          ],
          [
            693.77,
            368
          ],
          [
            698.51,
            368
          ],
          [
            703.24,
            368
          ],
          [
            707.98,
            368
          ],
          [
            712.71,
            368
          ],
          [
            717.45,
            368
          ],
          [
            722.18,
            368
          ],
          [
            726.91,
            368
          ],
          [
            731.65,
            368
          ],
          [
            736.38,
            368
          ],
          [
            741.12,
            368
          ],
          [
            745.85,
            368
          ],
          [
            750.59,
            368
          ],
          [
            755.32,
            368
          ],
          [
            760.05,
            368
          ],
          [
            764.79,
            368
          ],
          [
            769.52,
            368
          ],
          [
            774.26,
            368
          ],
          [
            778.99,
            368
          ],
          [
            783.73,
            368
          ],
          [
            788.46,
            368
          ],
          [
            793.2,
            368
          ],
          [
            797.93,
            368
          ],
          [
            802.66,
            368
          ],
          [
            807.4,
            368
          ],
          [
            812.13,
            368
          ],
          [
            816.87,
            368
          ],
          [
            821.6,
            368
          ],
          [
            826.34,
            368
          ],
          [
            831.07,
            368
          ],
          [
            835.8,
            368
          ],
          [
            840.54,
            368
          ],
          [
            845.27,
            368
          ],
          [
            850.01,
            368
          ],
          [
            854.74,
            368
          ],
          [
            859.48,
            368
          ],
          [
            864.21,
            368
          ],
          [
            868.95,
            368
          ],
          [
            883,
            369.68
          ],
          [
            880,
            374.41
          ],
          [
            880,
            379.15
          ],
          [
            879,
            383.88
          ],
          [
            879,
            388.62
          ],
          [
            879,
            393.35
          ],
          [
            879,
            398.09
          ],
          [
            879,
            402.82
          ],
          [
            880,
            407.55
          ],
          [
            880,
            412.29
          ],
          [
            880,
            417.02
          ],
          [
            880,
            421.76
          ],
          [
            880,
            426.49
          ],
          [
            880,
            431.23
          ],
          [
            881,
            435.96
          ],
          [
            881,
            440.7
          ],
          [
            881,
            445.43
          ],
          [
            881,
            450.16
          ],
          [
            881,
            454.9
          ],
          [
            881,
            459.63
          ],
          [
            881,
            464.37
          ],
          [
            881,
            469.1
          ],
          [
            881,
            473.84
          ],
          [
            881,
            478.57
          ],
          [
            881,
            483.3
          ],
          [
            881,
            488.04
          ],
          [
            881,
            492.77
          ],
          [
            881,
            497.51
          ],
          [
            881,
            502.24
          ],
          [
            881,
            506.98
          ],
          [
            881,
            511.71
          ],
          [
            880,
            516.45
          ],
          [
            880,
            521.18
          ],
          [
            880,
            525.91
          ],
          [
            880,
            530.65
          ],
          [
            880,
            535.38
          ],
          [
            880,
            540.12
          ],
          [
            880,
            544.85
          ],
          [
            880,
            549.59
          ],
          [
            880,
            554.32
          ],
          [
            880,
            559.05
          ],
          [
            880,
            563.79
          ],
          [
            880,
            568.52
          ],
          [
            880,
            573.26
          ],
          [
            880,
            577.99
          ],
          [
            880,
            582.73
          ],
          [
            880,
            587.46
          ],
          [
            880,
            592.2
          ],
          [
            880,
            596.93
          ],
          [
            880,
            601.66
          ],
          [
            880,
            606.4
          ],
          [
            880,
            611.13
          ],
          [
            880,
            615.87
          ],
          [
            880,
            620.6
          ],
          [
            880,
            625.34
          ],
          [
            880,
            630.07
          ],
          [
            880,
            634.8
          ],
          [
            880,
            639.54
          ],
          [
            880,
            644.27
          ],
          [
            880,
            649.01
          ],
          [
            880,
            653.74
          ],
          [
            880,
            658.48
          ],
          [
            880,
            663.21
          ],
          [
            880,
            667.95
          ],
          [
            880,
            672.68
          ],
          [
            880,
            677.41
          ],
          [
            880,
            682.15
          ],
          [
            880,
            686.88
          ],
          [
            880,
            691.62
          ],
          [
            880,
            696.35
          ],
          [
            880,
            701.09
          ],
          [
            880,
            705.82
          ],
          [
            880,
            710.55
          ],
          [
            880,
            715.29
          ],
          [
            880,
            720.02
          ],
          [
            880,
            724.76
          ],
          [
            880,
            729.49
          ],
          [
            881,
            734.23
          ],
          [
            881,
            738.96
          ],
          [
            881,
            743.7
          ],
          [
            881,
            748.43
          ],
          [
            881,
            753.16
          ],
          [
            881,
            757.9
          ],
          [
            881,
            762.63
          ],
          [
            869.63,
            765
          ],
          [
            864.9,
            765
          ],
          [
            860.16,
            765
          ],
          [
            855.43,
            765
          ],
          [
            850.7,
            765
          ],
          [
            845.96,
            765
          ],
          [
            841.23,
            765
          ],
          [
            836.49,
            765
          ],
          [
            831.76,
            765
          ],
          [
            827.02,
            765
          ],
          [
            822.29,
            765
          ],
          [
            817.55,
            765
          ],
          [
            812.82,
            765
          ],
          [
            808.09,
            765
          ],
          [
            803.35,
            765
          ],
          [
            798.62,
            765
          ],
          [
            793.88,
            765
          ],
          [
            789.15,
            765
          ],
          [
            784.41,
            765
          ],
          [
            779.68,
            765
          ],
          [
            774.95,
            765
          ],
          [
            770.21,
            765
          ],
          [
            765.48,
            765
          ],
          [
            760.74,
            765
          ],
          [
            756.01,
            765
          ],
          [
            751.27,
            765
          ],
          [
            746.54,
            765
          ],
          [
            741.8,
            765
          ],
          [
            737.07,
            765
          ],
          [
            732.34,
            765
          ],
          [
            727.6,
            765
          ],
          [
            722.87,
            765
          ],
          [
            718.13,
            765
          ],
          [
            713.4,
            765
          ],
          [
            708.66,
            765
          ],
          [
            703.93,
            765
          ],
          [
            699.2,
            765
          ],
          [
            694.46,
            765
          ],
          [
            689.73,
            765
          ],
          [
            684.99,
            765
          ],
          [
            680.26,
            765
          ],
          [
            675.52,
            765
          ],
          [
            670.79,
            765
          ],
          [
            666.05,
            765
          ],
          [
            654,
            763.32
          ],
          [
            654,
            758.59
          ],
          [
            654,
            753.85
          ],
          [
            654,
            749.12
          ],
          [
            654,
            744.38
          ],
          [
            654,
            739.65
          ],
          [
            654,
            734.91
          ],
          [
            655,
            730.18
          ],
          [
            655,
            725.45
          ],
          [
            655,
            720.71
          ],
          [
            655,
            715.98
          ],
          [
            655,
            711.24
          ],
          [
            655,
            706.51
          ],
          [
            655,
            701.77
          ],
          [
            655,
            697.04
          ],
          [
            655,
            692.3
          ],
          [
            655,
            687.57
          ],
          [
            655,
            682.84
          ],
          [
            655,
            678.1
          ],
          [
            655,
            673.37
          ],
          [
            655,
            668.63
          ],
          [
            655,
            663.9
          ],
          [
            655,
            659.16
          ],
          [
            655,
            654.43
          ],
          [
            655,
            649.7
          ],
          [
            655,
            644.96
          ],
          [
            655,
            640.23
          ],
          [
            663,
            635.49
          ],
          [
            663,
            630.76
          ],
          [
            663,
            626.02
          ],
          [
            663,
            621.29
          ],
          [
            663,
            616.55
          ],
          [
            663,
            611.82
          ],
          [
            663,
            607.09
          ],
          [
            663,
            602.35
          ],
          [
            663,
            597.62
          ],
          [
            663,
            592.88
          ],
          [
            663,
            588.15
          ],
          [
            663,
            583.41
          ],
          [
            663,
            578.68
          ],
          [
            663,
            573.95
          ],
          [
            659,
            569.21
          ],
          [
            654,
            564.48
          ],
          [
            654,
            559.74
          ],
          [
            654,
            555.01
          ],
          [
            654,
            550.27
          ],
          [
            654,
            545.54
          ],
          [
            654,
            540.8
          ],
          [
            654,
            536.07
          ],
          [
            654,
            531.34
          ],
          [
            654,
            526.6
          ],
          [
            654,
            521.87
          ],
          [
            654,
            517.13
          ],
          [
            654,
            512.4
          ],
          [
            654,
            507.66
          ],
          [
            654,
            502.93
          ],
          [
            654,
            498.2
          ],
          [
            654,
            493.46
          ],
          [
            654,
            488.73
          ],
          [
            654,
            483.99
          ],
          [
            654,
            479.26
          ],
          [
            654,
            474.52
          ],
          [
            654,
            469.79
          ],
          [
            655,
            465.05
          ],
          [
            655,
            460.32
          ],
          [
            655,
            455.59
          ],
          [
            655,
            450.85
          ],
          [
            655,
            446.12
          ],
          [
            655,
            441.38
          ],
          [
            655,
            436.65
          ],
          [
            655,
            431.91
          ],
          [
            655,
            427.18
          ],
          [
            655,
            422.45
          ],
          [
            655,
            417.71
          ],
          [
            655,
            412.98
          ],
          [
            655,
            408.24
          ],
          [
            655,
            403.51
          ],
          [
            656,
            398.77
          ],
          [
            656,
            394.04
          ],
          [
            656,
            389.3
          ],
          [
            656,
            384.57
          ],
          [
            655,
            379.84
          ],
          [
            655,
            375.1
          ],
          [
            654,
            370.37
          ]
        ],
        "corners": [
          [
            665.37,
            368
          ],
          [
            881.28,
            368
          ],
          [
            879.29,
            765
          ],
          [
            666.05,
            765
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.752,
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
  "gallery/W": {
    "floor_line_y": 0.749023,
    "px_per_m_at_wall": 205,
    "px_per_m_at_bottom": 408.5,
    "wall_width_m": 6.4,
    "key_tint": "#c8b08d",
    "image_h_px": 1024,
    "horizon_y": 0.496191,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
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
    "corner_x0_px": 102,
    "corner_x1_px": 1430,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery-W/row23-3695662c.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "63dbd6de142e",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 984,
    "nearest_floor_m": 2.4088,
    "measured_room": {
      "storey_height_m": 3.454,
      "wall_width_m": 6.478,
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
  "gallery_far/N": {
    "floor_line_y": 0.75,
    "px_per_m_at_wall": 204.167,
    "px_per_m_at_bottom": 431.12,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8ac80",
    "image_h_px": 1024,
    "horizon_y": 0.525098,
    "key_dir": "L-ABOVE",
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
    "corner_x0_px": -1280,
    "corner_x1_px": 1429,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery_far-N/row23-f1322202.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "0bf842295009",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 980,
    "nearest_floor_m": 2.2732,
    "measured_room": {
      "storey_height_m": 3.429,
      "wall_width_m": 13.269,
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
  "gallery_far/E": {
    "floor_line_y": 0.75,
    "px_per_m_at_wall": 205,
    "px_per_m_at_bottom": 411.94,
    "wall_width_m": 6.4,
    "key_tint": "#c8b088",
    "image_h_px": 1024,
    "horizon_y": 0.502344,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
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
    "corner_x0_px": 91,
    "corner_x1_px": 1431,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery_far-E/row23-4f1ecd11.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "63dbd6de142e",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 984,
    "nearest_floor_m": 2.3887,
    "measured_room": {
      "storey_height_m": 3.473,
      "wall_width_m": 6.537,
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
  "gallery_far/S": {
    "floor_line_y": 0.749023,
    "px_per_m_at_wall": 204.167,
    "px_per_m_at_bottom": 418.51,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8af83",
    "image_h_px": 1024,
    "horizon_y": 0.509961,
    "key_dir": "L-ABOVE",
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
    "corner_x0_px": 96,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/gallery_far-S/row23-0943e33a.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "63dbd6de142e",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 980,
    "nearest_floor_m": 2.3416,
    "measured_room": {
      "storey_height_m": 3.424,
      "wall_width_m": 13.322,
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
  "gallery_far/W": {
    "floor_line_y": 0.619395,
    "px_per_m_at_wall": 91.429,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.4,
    "key_tint": "#c8b292",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 99,
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
    "camera_id": "measured:backdrops/source/gallery_far-W/row23-6678e2fc.png",
    "camera_reference": "ruled",
    "measured_round": "meshwarp",
    "instrument": "5c5cc2cde041",
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
    "focal_px": 924,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.673,
      "wall_width_m": 7.018,
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
          "scale": 1.014,
          "target_px": 587.1,
          "source_px": 579
        },
        "revealed_px": 6151,
        "remeasured": {
          "px_per_m_at_wall": 82.5,
          "floor_line_y": 0.612305,
          "corner_x0_px": 478,
          "corner_x1_px": 1057,
          "corner_scale_px_per_m": 90.469
        },
        "warped_from": "backdrops/source/gallery_far-W/row23-6678e2fc.png",
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
  "saloon/N": {
    "floor_line_y": 0.616211,
    "px_per_m_at_wall": 93.333,
    "px_per_m_at_bottom": 432.33,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8874c",
    "image_h_px": 1024,
    "horizon_y": 0.510547,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 112,
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
    "corner_x0_px": 405,
    "corner_x1_px": 1646,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon-N/row23-b292a653.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1045.3,
    "nearest_floor_m": 2.4179,
    "measured_room": {
      "storey_height_m": 3.407,
      "wall_width_m": 13.296,
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
  "saloon/E": {
    "floor_line_y": 0.611328,
    "px_per_m_at_wall": 89.167,
    "px_per_m_at_bottom": 463.91,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c88d4e",
    "image_h_px": 1024,
    "horizon_y": 0.518848,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 107,
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
    "corner_x0_px": -110,
    "corner_x1_px": 1050,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon-E/row23-3d4c527c.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 998.7,
    "nearest_floor_m": 2.1527,
    "measured_room": {
      "storey_height_m": 3.32,
      "wall_width_m": 13.009,
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
  "saloon/S": {
    "floor_line_y": 0.745117,
    "px_per_m_at_wall": 203.333,
    "px_per_m_at_bottom": 454.14,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8a580",
    "image_h_px": 1024,
    "horizon_y": 0.538477,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 244,
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
    "corner_x1_px": 1434,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon-S/row23-f3a2cc96.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 976,
    "nearest_floor_m": 2.1491,
    "measured_room": {
      "storey_height_m": 3.374,
      "wall_width_m": 13.348,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            646,
            890
          ],
          "plan_centre_px": 768,
          "painted_px": [
            655,
            879
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
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 651,
        "y": 353,
        "w": 232,
        "h": 410,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            657.48,
            353
          ],
          [
            662.43,
            353
          ],
          [
            667.38,
            353
          ],
          [
            672.34,
            353
          ],
          [
            677.29,
            353
          ],
          [
            682.24,
            353
          ],
          [
            687.2,
            353
          ],
          [
            692.15,
            353
          ],
          [
            697.1,
            353
          ],
          [
            702.05,
            353
          ],
          [
            707.01,
            353
          ],
          [
            711.96,
            353
          ],
          [
            716.91,
            353
          ],
          [
            721.87,
            353
          ],
          [
            726.82,
            353
          ],
          [
            731.77,
            353
          ],
          [
            736.73,
            353
          ],
          [
            741.68,
            353
          ],
          [
            746.63,
            353
          ],
          [
            751.59,
            353
          ],
          [
            756.54,
            353
          ],
          [
            761.49,
            353
          ],
          [
            766.45,
            353
          ],
          [
            771.4,
            353
          ],
          [
            776.35,
            353
          ],
          [
            781.3,
            353
          ],
          [
            786.26,
            353
          ],
          [
            791.21,
            353
          ],
          [
            796.16,
            353
          ],
          [
            801.12,
            353
          ],
          [
            806.07,
            353
          ],
          [
            811.02,
            353
          ],
          [
            815.98,
            353
          ],
          [
            820.93,
            353
          ],
          [
            825.88,
            353
          ],
          [
            830.84,
            353
          ],
          [
            835.79,
            353
          ],
          [
            840.74,
            353
          ],
          [
            845.7,
            353
          ],
          [
            850.65,
            353
          ],
          [
            855.6,
            353
          ],
          [
            860.55,
            353
          ],
          [
            865.51,
            353
          ],
          [
            870.46,
            353
          ],
          [
            875.41,
            353
          ],
          [
            883,
            354.37
          ],
          [
            883,
            359.32
          ],
          [
            882,
            364.27
          ],
          [
            880,
            369.23
          ],
          [
            880,
            374.18
          ],
          [
            880,
            379.13
          ],
          [
            880,
            384.09
          ],
          [
            880,
            389.04
          ],
          [
            880,
            393.99
          ],
          [
            879,
            398.95
          ],
          [
            879,
            403.9
          ],
          [
            879,
            408.85
          ],
          [
            879,
            413.8
          ],
          [
            879,
            418.76
          ],
          [
            879,
            423.71
          ],
          [
            879,
            428.66
          ],
          [
            879,
            433.62
          ],
          [
            879,
            438.57
          ],
          [
            879,
            443.52
          ],
          [
            879,
            448.48
          ],
          [
            879,
            453.43
          ],
          [
            879,
            458.38
          ],
          [
            879,
            463.34
          ],
          [
            879,
            468.29
          ],
          [
            879,
            473.24
          ],
          [
            879,
            478.2
          ],
          [
            879,
            483.15
          ],
          [
            879,
            488.1
          ],
          [
            879,
            493.05
          ],
          [
            879,
            498.01
          ],
          [
            879,
            502.96
          ],
          [
            879,
            507.91
          ],
          [
            879,
            512.87
          ],
          [
            879,
            517.82
          ],
          [
            879,
            522.77
          ],
          [
            879,
            527.73
          ],
          [
            879,
            532.68
          ],
          [
            879,
            537.63
          ],
          [
            879,
            542.59
          ],
          [
            879,
            547.54
          ],
          [
            879,
            552.49
          ],
          [
            879,
            557.45
          ],
          [
            879,
            562.4
          ],
          [
            879,
            567.35
          ],
          [
            879,
            572.3
          ],
          [
            879,
            577.26
          ],
          [
            879,
            582.21
          ],
          [
            879,
            587.16
          ],
          [
            879,
            592.12
          ],
          [
            879,
            597.07
          ],
          [
            879,
            602.02
          ],
          [
            879,
            606.98
          ],
          [
            879,
            611.93
          ],
          [
            879,
            616.88
          ],
          [
            879,
            621.84
          ],
          [
            879,
            626.79
          ],
          [
            879,
            631.74
          ],
          [
            879,
            636.7
          ],
          [
            879,
            641.65
          ],
          [
            879,
            646.6
          ],
          [
            879,
            651.55
          ],
          [
            879,
            656.51
          ],
          [
            879,
            661.46
          ],
          [
            879,
            666.41
          ],
          [
            879,
            671.37
          ],
          [
            879,
            676.32
          ],
          [
            879,
            681.27
          ],
          [
            879,
            686.23
          ],
          [
            879,
            691.18
          ],
          [
            879,
            696.13
          ],
          [
            879,
            701.09
          ],
          [
            879,
            706.04
          ],
          [
            879,
            710.99
          ],
          [
            879,
            715.95
          ],
          [
            879,
            720.9
          ],
          [
            879,
            725.85
          ],
          [
            879,
            730.8
          ],
          [
            879,
            735.76
          ],
          [
            879,
            740.71
          ],
          [
            882,
            745.66
          ],
          [
            882,
            750.62
          ],
          [
            882,
            755.57
          ],
          [
            883,
            760.52
          ],
          [
            876.52,
            763
          ],
          [
            871.57,
            763
          ],
          [
            866.62,
            763
          ],
          [
            861.66,
            763
          ],
          [
            856.71,
            763
          ],
          [
            851.76,
            763
          ],
          [
            846.8,
            763
          ],
          [
            841.85,
            763
          ],
          [
            836.9,
            763
          ],
          [
            831.95,
            763
          ],
          [
            826.99,
            763
          ],
          [
            822.04,
            763
          ],
          [
            817.09,
            763
          ],
          [
            812.13,
            763
          ],
          [
            807.18,
            763
          ],
          [
            802.23,
            763
          ],
          [
            797.27,
            763
          ],
          [
            792.32,
            763
          ],
          [
            787.37,
            763
          ],
          [
            782.41,
            763
          ],
          [
            777.46,
            763
          ],
          [
            772.51,
            763
          ],
          [
            767.55,
            763
          ],
          [
            762.6,
            763
          ],
          [
            757.65,
            763
          ],
          [
            752.7,
            763
          ],
          [
            747.74,
            763
          ],
          [
            742.79,
            763
          ],
          [
            737.84,
            763
          ],
          [
            732.88,
            763
          ],
          [
            727.93,
            763
          ],
          [
            722.98,
            763
          ],
          [
            718.02,
            763
          ],
          [
            713.07,
            763
          ],
          [
            708.12,
            763
          ],
          [
            703.16,
            763
          ],
          [
            698.21,
            763
          ],
          [
            693.26,
            763
          ],
          [
            688.3,
            763
          ],
          [
            683.35,
            763
          ],
          [
            678.4,
            763
          ],
          [
            673.45,
            763
          ],
          [
            668.49,
            763
          ],
          [
            663.54,
            763
          ],
          [
            658.59,
            763
          ],
          [
            651,
            761.63
          ],
          [
            653,
            756.68
          ],
          [
            654,
            751.73
          ],
          [
            654,
            746.77
          ],
          [
            654,
            741.82
          ],
          [
            654,
            736.87
          ],
          [
            654,
            731.91
          ],
          [
            654,
            726.96
          ],
          [
            654,
            722.01
          ],
          [
            654,
            717.05
          ],
          [
            654,
            712.1
          ],
          [
            654,
            707.15
          ],
          [
            654,
            702.2
          ],
          [
            654,
            697.24
          ],
          [
            654,
            692.29
          ],
          [
            654,
            687.34
          ],
          [
            654,
            682.38
          ],
          [
            654,
            677.43
          ],
          [
            654,
            672.48
          ],
          [
            654,
            667.52
          ],
          [
            654,
            662.57
          ],
          [
            654,
            657.62
          ],
          [
            654,
            652.66
          ],
          [
            654,
            647.71
          ],
          [
            654,
            642.76
          ],
          [
            654,
            637.8
          ],
          [
            654,
            632.85
          ],
          [
            654,
            627.9
          ],
          [
            654,
            622.95
          ],
          [
            654,
            617.99
          ],
          [
            654,
            613.04
          ],
          [
            654,
            608.09
          ],
          [
            654,
            603.13
          ],
          [
            654,
            598.18
          ],
          [
            654,
            593.23
          ],
          [
            654,
            588.27
          ],
          [
            654,
            583.32
          ],
          [
            654,
            578.37
          ],
          [
            654,
            573.41
          ],
          [
            654,
            568.46
          ],
          [
            654,
            563.51
          ],
          [
            654,
            558.55
          ],
          [
            654,
            553.6
          ],
          [
            654,
            548.65
          ],
          [
            654,
            543.7
          ],
          [
            654,
            538.74
          ],
          [
            654,
            533.79
          ],
          [
            654,
            528.84
          ],
          [
            654,
            523.88
          ],
          [
            654,
            518.93
          ],
          [
            654,
            513.98
          ],
          [
            654,
            509.02
          ],
          [
            654,
            504.07
          ],
          [
            654,
            499.12
          ],
          [
            654,
            494.16
          ],
          [
            654,
            489.21
          ],
          [
            654,
            484.26
          ],
          [
            654,
            479.3
          ],
          [
            654,
            474.35
          ],
          [
            654,
            469.4
          ],
          [
            654,
            464.45
          ],
          [
            654,
            459.49
          ],
          [
            654,
            454.54
          ],
          [
            654,
            449.59
          ],
          [
            654,
            444.63
          ],
          [
            654,
            439.68
          ],
          [
            654,
            434.73
          ],
          [
            654,
            429.77
          ],
          [
            654,
            424.82
          ],
          [
            654,
            419.87
          ],
          [
            651,
            414.91
          ],
          [
            651,
            409.96
          ],
          [
            651,
            405.01
          ],
          [
            651,
            400.05
          ],
          [
            651,
            395.1
          ],
          [
            651,
            390.15
          ],
          [
            651,
            385.2
          ],
          [
            651,
            380.24
          ],
          [
            651,
            375.29
          ],
          [
            651,
            370.34
          ],
          [
            651,
            365.38
          ],
          [
            651,
            360.43
          ],
          [
            651,
            355.48
          ]
        ],
        "corners": [
          [
            654,
            353
          ],
          [
            879,
            353
          ],
          [
            879,
            763
          ],
          [
            654,
            763
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9558,
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
  "saloon/W": {
    "floor_line_y": 0.748047,
    "px_per_m_at_wall": 205.833,
    "px_per_m_at_bottom": 422.68,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8a885",
    "image_h_px": 1024,
    "horizon_y": 0.508887,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 247,
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
    "corner_x0_px": 105,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon-W/row23-ace950ee.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 988,
    "nearest_floor_m": 2.3375,
    "measured_room": {
      "storey_height_m": 3.396,
      "wall_width_m": 13.171,
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
  "saloon_e/N": {
    "floor_line_y": 0.613281,
    "px_per_m_at_wall": 90.833,
    "px_per_m_at_bottom": 461.28,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8894c",
    "image_h_px": 1024,
    "horizon_y": 0.518457,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 109,
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
    "corner_x0_px": -110,
    "corner_x1_px": 1049,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_e-N/row23-4d98da62.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "0c4cc51dae2a",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1017.3,
    "nearest_floor_m": 2.2054,
    "measured_room": {
      "storey_height_m": 3.281,
      "wall_width_m": 12.76,
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
  "saloon_e/E": {
    "floor_line_y": 0.749023,
    "px_per_m_at_wall": 205,
    "px_per_m_at_bottom": 439.47,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c88b4d",
    "image_h_px": 1024,
    "horizon_y": 0.52959,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
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
    "corner_x1_px": 1434,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_e-E/row23-e3c9eb4e.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 984,
    "nearest_floor_m": 2.2391,
    "measured_room": {
      "storey_height_m": 3.356,
      "wall_width_m": 13.239,
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
  "saloon_e/S": {
    "floor_line_y": 0.749023,
    "px_per_m_at_wall": 205.833,
    "px_per_m_at_bottom": 403.14,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8aa8a",
    "image_h_px": 1024,
    "horizon_y": 0.487207,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 247,
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
    "corner_x0_px": 106,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_e-S/row23-c9aec937.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 988,
    "nearest_floor_m": 2.4508,
    "measured_room": {
      "storey_height_m": 3.425,
      "wall_width_m": 13.166,
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
  "saloon_e/W": {
    "floor_line_y": 0.610352,
    "px_per_m_at_wall": 88.333,
    "px_per_m_at_bottom": 484.34,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b6a1",
    "image_h_px": 1024,
    "horizon_y": 0.523438,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 106,
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
    "corner_x0_px": 428,
    "corner_x1_px": 1646,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_e-W/row23-bf507e82.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "0c4cc51dae2a",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 989.3,
    "nearest_floor_m": 2.0426,
    "measured_room": {
      "storey_height_m": 3.487,
      "wall_width_m": 13.789,
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
  "saloon_n/N": {
    "floor_line_y": 0.74707,
    "px_per_m_at_wall": 206.667,
    "px_per_m_at_bottom": 428.68,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c89158",
    "image_h_px": 1024,
    "horizon_y": 0.511621,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 248,
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
    "corner_x0_px": 105,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_n-N/row23-d12c4aab.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 992,
    "nearest_floor_m": 2.3141,
    "measured_room": {
      "storey_height_m": 3.368,
      "wall_width_m": 13.118,
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
  "saloon_n/E": {
    "floor_line_y": 0.608398,
    "px_per_m_at_wall": 86.667,
    "px_per_m_at_bottom": 477.16,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c88a4e",
    "image_h_px": 1024,
    "horizon_y": 0.521484,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 104,
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
    "corner_x0_px": 496,
    "corner_x1_px": 1646,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_n-E/row23-0025d4bc.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "cb3e458c6d24",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 970.7,
    "nearest_floor_m": 2.0343,
    "measured_room": {
      "storey_height_m": 3.231,
      "wall_width_m": 13.269,
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
  "saloon_n/S": {
    "floor_line_y": 0.625977,
    "px_per_m_at_wall": 90,
    "px_per_m_at_bottom": 396.67,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b69d",
    "image_h_px": 1024,
    "horizon_y": 0.516211,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 108,
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
    "corner_x0_px": -110,
    "corner_x1_px": 1040,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_n-S/row23-fc4fc120.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "cb3e458c6d24",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1008,
    "nearest_floor_m": 2.5412,
    "measured_room": {
      "storey_height_m": 3.533,
      "wall_width_m": 12.778,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            714,
            822
          ],
          "plan_centre_px": 768,
          "painted_px": [
            742,
            834
          ],
          "painted_centre_px": 788,
          "centre_delta_px": 20,
          "centre_delta_m": 0.222,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "door02",
        "kind": "door",
        "via": null,
        "x": 740,
        "y": 456,
        "w": 95,
        "h": 185,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            743.08,
            456
          ],
          [
            745.25,
            456
          ],
          [
            747.41,
            456
          ],
          [
            749.57,
            456
          ],
          [
            751.74,
            456
          ],
          [
            753.9,
            456
          ],
          [
            756.07,
            456
          ],
          [
            758.23,
            456
          ],
          [
            760.39,
            456
          ],
          [
            762.56,
            456
          ],
          [
            764.72,
            456
          ],
          [
            766.89,
            456
          ],
          [
            769.05,
            456
          ],
          [
            771.21,
            456
          ],
          [
            773.38,
            456
          ],
          [
            775.54,
            456
          ],
          [
            777.71,
            456
          ],
          [
            779.87,
            456
          ],
          [
            782.04,
            456
          ],
          [
            784.2,
            456
          ],
          [
            786.36,
            456
          ],
          [
            788.53,
            456
          ],
          [
            790.69,
            456
          ],
          [
            792.86,
            456
          ],
          [
            795.02,
            456
          ],
          [
            797.18,
            456
          ],
          [
            799.35,
            456
          ],
          [
            801.51,
            456
          ],
          [
            803.68,
            456
          ],
          [
            805.84,
            456
          ],
          [
            808,
            456
          ],
          [
            810.17,
            456
          ],
          [
            812.33,
            456
          ],
          [
            814.5,
            456
          ],
          [
            816.66,
            456
          ],
          [
            818.82,
            456
          ],
          [
            820.99,
            456
          ],
          [
            823.15,
            456
          ],
          [
            825.32,
            456
          ],
          [
            827.48,
            456
          ],
          [
            829.64,
            456
          ],
          [
            831.81,
            456
          ],
          [
            833.97,
            456
          ],
          [
            835,
            458.14
          ],
          [
            835,
            460.3
          ],
          [
            835,
            462.46
          ],
          [
            835,
            464.63
          ],
          [
            835,
            466.79
          ],
          [
            835,
            468.96
          ],
          [
            834,
            471.12
          ],
          [
            834,
            473.29
          ],
          [
            834,
            475.45
          ],
          [
            834,
            477.61
          ],
          [
            834,
            479.78
          ],
          [
            834,
            481.94
          ],
          [
            834,
            484.11
          ],
          [
            834,
            486.27
          ],
          [
            834,
            488.43
          ],
          [
            834,
            490.6
          ],
          [
            834,
            492.76
          ],
          [
            834,
            494.93
          ],
          [
            834,
            497.09
          ],
          [
            834,
            499.25
          ],
          [
            834,
            501.42
          ],
          [
            834,
            503.58
          ],
          [
            834,
            505.75
          ],
          [
            834,
            507.91
          ],
          [
            834,
            510.07
          ],
          [
            834,
            512.24
          ],
          [
            834,
            514.4
          ],
          [
            834,
            516.57
          ],
          [
            834,
            518.73
          ],
          [
            834,
            520.89
          ],
          [
            834,
            523.06
          ],
          [
            834,
            525.22
          ],
          [
            834,
            527.39
          ],
          [
            834,
            529.55
          ],
          [
            834,
            531.71
          ],
          [
            834,
            533.88
          ],
          [
            834,
            536.04
          ],
          [
            834,
            538.21
          ],
          [
            834,
            540.37
          ],
          [
            834,
            542.54
          ],
          [
            834,
            544.7
          ],
          [
            833,
            546.86
          ],
          [
            833,
            549.03
          ],
          [
            833,
            551.19
          ],
          [
            833,
            553.36
          ],
          [
            833,
            555.52
          ],
          [
            833,
            557.68
          ],
          [
            833,
            559.85
          ],
          [
            833,
            562.01
          ],
          [
            833,
            564.18
          ],
          [
            833,
            566.34
          ],
          [
            833,
            568.5
          ],
          [
            833,
            570.67
          ],
          [
            833,
            572.83
          ],
          [
            833,
            575
          ],
          [
            833,
            577.16
          ],
          [
            833,
            579.32
          ],
          [
            833,
            581.49
          ],
          [
            833,
            583.65
          ],
          [
            833,
            585.82
          ],
          [
            833,
            587.98
          ],
          [
            833,
            590.14
          ],
          [
            833,
            592.31
          ],
          [
            833,
            594.47
          ],
          [
            833,
            596.64
          ],
          [
            833,
            598.8
          ],
          [
            833,
            600.96
          ],
          [
            833,
            603.13
          ],
          [
            833,
            605.29
          ],
          [
            833,
            607.46
          ],
          [
            833,
            609.62
          ],
          [
            833,
            611.79
          ],
          [
            833,
            613.95
          ],
          [
            833,
            616.11
          ],
          [
            833,
            618.28
          ],
          [
            833,
            620.44
          ],
          [
            833,
            622.61
          ],
          [
            833,
            624.77
          ],
          [
            833,
            626.93
          ],
          [
            833,
            629.1
          ],
          [
            833,
            631.26
          ],
          [
            833,
            633.43
          ],
          [
            833,
            635.59
          ],
          [
            833,
            637.75
          ],
          [
            833,
            639.92
          ],
          [
            832.92,
            641
          ],
          [
            830.75,
            641
          ],
          [
            828.59,
            641
          ],
          [
            826.43,
            641
          ],
          [
            824.26,
            641
          ],
          [
            822.1,
            641
          ],
          [
            819.93,
            641
          ],
          [
            817.77,
            641
          ],
          [
            815.61,
            641
          ],
          [
            813.44,
            641
          ],
          [
            811.28,
            641
          ],
          [
            809.11,
            641
          ],
          [
            806.95,
            641
          ],
          [
            804.79,
            641
          ],
          [
            802.62,
            641
          ],
          [
            800.46,
            641
          ],
          [
            798.29,
            641
          ],
          [
            796.13,
            641
          ],
          [
            793.96,
            641
          ],
          [
            791.8,
            641
          ],
          [
            789.64,
            641
          ],
          [
            787.47,
            641
          ],
          [
            785.31,
            641
          ],
          [
            783.14,
            641
          ],
          [
            780.98,
            641
          ],
          [
            778.82,
            641
          ],
          [
            776.65,
            641
          ],
          [
            774.49,
            641
          ],
          [
            772.32,
            641
          ],
          [
            770.16,
            641
          ],
          [
            768,
            641
          ],
          [
            765.83,
            641
          ],
          [
            763.67,
            641
          ],
          [
            761.5,
            641
          ],
          [
            759.34,
            641
          ],
          [
            757.18,
            641
          ],
          [
            755.01,
            641
          ],
          [
            752.85,
            641
          ],
          [
            750.68,
            641
          ],
          [
            748.52,
            641
          ],
          [
            746.36,
            641
          ],
          [
            744.19,
            641
          ],
          [
            742.03,
            641
          ],
          [
            742,
            638.86
          ],
          [
            742,
            636.7
          ],
          [
            742,
            634.54
          ],
          [
            742,
            632.37
          ],
          [
            742,
            630.21
          ],
          [
            742,
            628.04
          ],
          [
            742,
            625.88
          ],
          [
            742,
            623.71
          ],
          [
            742,
            621.55
          ],
          [
            742,
            619.39
          ],
          [
            742,
            617.22
          ],
          [
            742,
            615.06
          ],
          [
            742,
            612.89
          ],
          [
            742,
            610.73
          ],
          [
            742,
            608.57
          ],
          [
            742,
            606.4
          ],
          [
            742,
            604.24
          ],
          [
            742,
            602.07
          ],
          [
            742,
            599.91
          ],
          [
            742,
            597.75
          ],
          [
            742,
            595.58
          ],
          [
            742,
            593.42
          ],
          [
            742,
            591.25
          ],
          [
            742,
            589.09
          ],
          [
            742,
            586.93
          ],
          [
            742,
            584.76
          ],
          [
            742,
            582.6
          ],
          [
            742,
            580.43
          ],
          [
            742,
            578.27
          ],
          [
            742,
            576.11
          ],
          [
            742,
            573.94
          ],
          [
            742,
            571.78
          ],
          [
            742,
            569.61
          ],
          [
            742,
            567.45
          ],
          [
            742,
            565.29
          ],
          [
            742,
            563.12
          ],
          [
            742,
            560.96
          ],
          [
            742,
            558.79
          ],
          [
            742,
            556.63
          ],
          [
            742,
            554.46
          ],
          [
            742,
            552.3
          ],
          [
            742,
            550.14
          ],
          [
            742,
            547.97
          ],
          [
            742,
            545.81
          ],
          [
            742,
            543.64
          ],
          [
            742,
            541.48
          ],
          [
            742,
            539.32
          ],
          [
            741,
            537.15
          ],
          [
            741,
            534.99
          ],
          [
            741,
            532.82
          ],
          [
            741,
            530.66
          ],
          [
            741,
            528.5
          ],
          [
            741,
            526.33
          ],
          [
            741,
            524.17
          ],
          [
            741,
            522
          ],
          [
            741,
            519.84
          ],
          [
            741,
            517.68
          ],
          [
            741,
            515.51
          ],
          [
            741,
            513.35
          ],
          [
            741,
            511.18
          ],
          [
            741,
            509.02
          ],
          [
            741,
            506.86
          ],
          [
            741,
            504.69
          ],
          [
            741,
            502.53
          ],
          [
            741,
            500.36
          ],
          [
            741,
            498.2
          ],
          [
            741,
            496.04
          ],
          [
            741,
            493.87
          ],
          [
            741,
            491.71
          ],
          [
            740,
            489.54
          ],
          [
            740,
            487.38
          ],
          [
            740,
            485.21
          ],
          [
            740,
            483.05
          ],
          [
            740,
            480.89
          ],
          [
            740,
            478.72
          ],
          [
            740,
            476.56
          ],
          [
            740,
            474.39
          ],
          [
            740,
            472.23
          ],
          [
            740,
            470.07
          ],
          [
            740,
            467.9
          ],
          [
            740,
            465.74
          ],
          [
            740,
            463.57
          ],
          [
            740,
            461.41
          ],
          [
            740,
            459.25
          ],
          [
            740,
            457.08
          ]
        ],
        "corners": [
          [
            740.38,
            456
          ],
          [
            834.73,
            456
          ],
          [
            832.22,
            641
          ],
          [
            742.81,
            641
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9908,
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
  "saloon_n/W": {
    "floor_line_y": 0.748047,
    "px_per_m_at_wall": 205,
    "px_per_m_at_bottom": 425.65,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8a582",
    "image_h_px": 1024,
    "horizon_y": 0.513965,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 246,
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
    "corner_x1_px": 1429,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_n-W/row23-3f0ca26f.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 984,
    "nearest_floor_m": 2.3118,
    "measured_room": {
      "storey_height_m": 3.405,
      "wall_width_m": 13.215,
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
  "saloon_ne/N": {
    "floor_line_y": 0.75,
    "px_per_m_at_wall": 214.167,
    "px_per_m_at_bottom": 419.05,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c89158",
    "image_h_px": 1024,
    "horizon_y": 0.488672,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 257,
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
    "corner_x1_px": 1428,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_ne-N/row23-7de84459.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1028,
    "nearest_floor_m": 2.4532,
    "measured_room": {
      "storey_height_m": 3.273,
      "wall_width_m": 12.644,
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
    "floor_line_y": 0.748047,
    "px_per_m_at_wall": 205.833,
    "px_per_m_at_bottom": 418.93,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c88d51",
    "image_h_px": 1024,
    "horizon_y": 0.504687,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 247,
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
    "corner_x0_px": 104,
    "corner_x1_px": 2816,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_ne-E/row23-57107a12.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "5c5cc2cde041",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 988,
    "nearest_floor_m": 2.3584,
    "measured_room": {
      "storey_height_m": 3.381,
      "wall_width_m": 13.176,
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
  "saloon_ne/S": {
    "floor_line_y": 0.611328,
    "px_per_m_at_wall": 87.5,
    "px_per_m_at_bottom": 447.64,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b7a0",
    "image_h_px": 1024,
    "horizon_y": 0.516895,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 105,
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
    "corner_x0_px": 436,
    "corner_x1_px": 1646,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_ne-S/row23-1f82601e.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "cb3e458c6d24",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 980,
    "nearest_floor_m": 2.1893,
    "measured_room": {
      "storey_height_m": 3.394,
      "wall_width_m": 13.829,
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
  "saloon_ne/W": {
    "floor_line_y": 0.615234,
    "px_per_m_at_wall": 90.833,
    "px_per_m_at_bottom": 436.95,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b49e",
    "image_h_px": 1024,
    "horizon_y": 0.514258,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 1.20 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 109,
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
    "corner_x0_px": -110,
    "corner_x1_px": 1053,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon_ne-W/row23-e425c78c.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "cb3e458c6d24",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1017.3,
    "nearest_floor_m": 2.3283,
    "measured_room": {
      "storey_height_m": 3.38,
      "wall_width_m": 12.804,
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
  }
}
};
