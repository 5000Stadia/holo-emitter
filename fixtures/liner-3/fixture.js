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
  fp: "eff9a7c1",
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
    "floor_line_y": 0.75,
    "px_per_m_at_wall": 198.333,
    "px_per_m_at_bottom": 403.81,
    "wall_width_m": 6.4,
    "wall_run_m": 12.8,
    "key_tint": "#c8b193",
    "image_h_px": 1024,
    "horizon_y": 0.508691,
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
    "corner_x1_px": 1482,
    "storey_height_m": 3.4,
    "camera_id": "measured:backdrops/source/saloon-S/row23-1e52b8ef.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "instrument": "6ccb6fc568cf",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 952,
    "nearest_floor_m": 2.3575,
    "measured_room": {
      "storey_height_m": 3.645,
      "wall_width_m": 13.926,
      "ruled_storey_height_m": 3.4,
      "ruled_wall_width_m": 6.4,
      "carriers": [
        {
          "kind": "door",
          "id": "door02",
          "plan_px": [
            649,
            887
          ],
          "plan_centre_px": 768,
          "painted_px": [
            661,
            880
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
        "x": 656,
        "y": 356,
        "w": 229,
        "h": 412,
        "beyond_m": 6.6,
        "beyond_offset_m": 0,
        "depth_m": 0.2,
        "measured": true,
        "polygon": [
          [
            663.46,
            356
          ],
          [
            668.39,
            356
          ],
          [
            673.32,
            356
          ],
          [
            678.25,
            356
          ],
          [
            683.18,
            356
          ],
          [
            688.11,
            356
          ],
          [
            693.04,
            356
          ],
          [
            697.97,
            356
          ],
          [
            702.9,
            356
          ],
          [
            707.83,
            356
          ],
          [
            712.76,
            356
          ],
          [
            717.69,
            356
          ],
          [
            722.62,
            356
          ],
          [
            727.55,
            356
          ],
          [
            732.48,
            356
          ],
          [
            737.41,
            356
          ],
          [
            742.34,
            356
          ],
          [
            747.27,
            356
          ],
          [
            752.2,
            356
          ],
          [
            757.13,
            356
          ],
          [
            762.06,
            356
          ],
          [
            766.99,
            356
          ],
          [
            771.92,
            356
          ],
          [
            776.85,
            356
          ],
          [
            781.78,
            356
          ],
          [
            786.71,
            356
          ],
          [
            791.64,
            356
          ],
          [
            796.57,
            356
          ],
          [
            801.5,
            356
          ],
          [
            806.43,
            356
          ],
          [
            811.36,
            356
          ],
          [
            816.29,
            356
          ],
          [
            821.21,
            356
          ],
          [
            826.14,
            356
          ],
          [
            831.07,
            356
          ],
          [
            836,
            356
          ],
          [
            840.93,
            356
          ],
          [
            845.86,
            356
          ],
          [
            850.79,
            356
          ],
          [
            855.72,
            356
          ],
          [
            860.65,
            356
          ],
          [
            865.58,
            356
          ],
          [
            870.51,
            356
          ],
          [
            875.44,
            356
          ],
          [
            881,
            356.37
          ],
          [
            881,
            361.3
          ],
          [
            881,
            366.23
          ],
          [
            881,
            371.16
          ],
          [
            881,
            376.09
          ],
          [
            881,
            381.02
          ],
          [
            881,
            385.95
          ],
          [
            881,
            390.88
          ],
          [
            881,
            395.81
          ],
          [
            881,
            400.74
          ],
          [
            881,
            405.67
          ],
          [
            881,
            410.6
          ],
          [
            881,
            415.53
          ],
          [
            881,
            420.46
          ],
          [
            881,
            425.39
          ],
          [
            881,
            430.32
          ],
          [
            881,
            435.25
          ],
          [
            881,
            440.18
          ],
          [
            881,
            445.11
          ],
          [
            881,
            450.04
          ],
          [
            881,
            454.96
          ],
          [
            881,
            459.89
          ],
          [
            881,
            464.82
          ],
          [
            881,
            469.75
          ],
          [
            881,
            474.68
          ],
          [
            881,
            479.61
          ],
          [
            881,
            484.54
          ],
          [
            881,
            489.47
          ],
          [
            881,
            494.4
          ],
          [
            881,
            499.33
          ],
          [
            881,
            504.26
          ],
          [
            881,
            509.19
          ],
          [
            881,
            514.12
          ],
          [
            881,
            519.05
          ],
          [
            881,
            523.98
          ],
          [
            881,
            528.91
          ],
          [
            881,
            533.84
          ],
          [
            881,
            538.77
          ],
          [
            881,
            543.7
          ],
          [
            881,
            548.63
          ],
          [
            881,
            553.56
          ],
          [
            881,
            558.49
          ],
          [
            881,
            563.42
          ],
          [
            881,
            568.35
          ],
          [
            881,
            573.28
          ],
          [
            881,
            578.21
          ],
          [
            881,
            583.14
          ],
          [
            881,
            588.07
          ],
          [
            881,
            593
          ],
          [
            881,
            597.93
          ],
          [
            881,
            602.86
          ],
          [
            881,
            607.79
          ],
          [
            881,
            612.71
          ],
          [
            881,
            617.64
          ],
          [
            881,
            622.57
          ],
          [
            881,
            627.5
          ],
          [
            881,
            632.43
          ],
          [
            881,
            637.36
          ],
          [
            881,
            642.29
          ],
          [
            881,
            647.22
          ],
          [
            881,
            652.15
          ],
          [
            881,
            657.08
          ],
          [
            881,
            662.01
          ],
          [
            881,
            666.94
          ],
          [
            881,
            671.87
          ],
          [
            881,
            676.8
          ],
          [
            881,
            681.73
          ],
          [
            881,
            686.66
          ],
          [
            881,
            691.59
          ],
          [
            881,
            696.52
          ],
          [
            881,
            701.45
          ],
          [
            881,
            706.38
          ],
          [
            881,
            711.31
          ],
          [
            881,
            716.24
          ],
          [
            881,
            721.17
          ],
          [
            881,
            726.1
          ],
          [
            881,
            731.03
          ],
          [
            881,
            735.96
          ],
          [
            881,
            740.89
          ],
          [
            881,
            745.82
          ],
          [
            881,
            750.75
          ],
          [
            881,
            755.68
          ],
          [
            881,
            760.61
          ],
          [
            885,
            765.54
          ],
          [
            877.54,
            768
          ],
          [
            872.61,
            768
          ],
          [
            867.68,
            768
          ],
          [
            862.75,
            768
          ],
          [
            857.82,
            768
          ],
          [
            852.89,
            768
          ],
          [
            847.96,
            768
          ],
          [
            843.03,
            768
          ],
          [
            838.1,
            768
          ],
          [
            833.17,
            768
          ],
          [
            828.24,
            768
          ],
          [
            823.31,
            768
          ],
          [
            818.38,
            768
          ],
          [
            813.45,
            768
          ],
          [
            808.52,
            768
          ],
          [
            803.59,
            768
          ],
          [
            798.66,
            768
          ],
          [
            793.73,
            768
          ],
          [
            788.8,
            768
          ],
          [
            783.87,
            768
          ],
          [
            778.94,
            768
          ],
          [
            774.01,
            768
          ],
          [
            769.08,
            768
          ],
          [
            764.15,
            768
          ],
          [
            759.22,
            768
          ],
          [
            754.29,
            768
          ],
          [
            749.36,
            768
          ],
          [
            744.43,
            768
          ],
          [
            739.5,
            768
          ],
          [
            734.57,
            768
          ],
          [
            729.64,
            768
          ],
          [
            724.71,
            768
          ],
          [
            719.79,
            768
          ],
          [
            714.86,
            768
          ],
          [
            709.93,
            768
          ],
          [
            705,
            768
          ],
          [
            700.07,
            768
          ],
          [
            695.14,
            768
          ],
          [
            690.21,
            768
          ],
          [
            685.28,
            768
          ],
          [
            680.35,
            768
          ],
          [
            675.42,
            768
          ],
          [
            670.49,
            768
          ],
          [
            665.56,
            768
          ],
          [
            657,
            767.63
          ],
          [
            657,
            762.7
          ],
          [
            657,
            757.77
          ],
          [
            657,
            752.84
          ],
          [
            657,
            747.91
          ],
          [
            657,
            742.98
          ],
          [
            657,
            738.05
          ],
          [
            657,
            733.12
          ],
          [
            657,
            728.19
          ],
          [
            657,
            723.26
          ],
          [
            657,
            718.33
          ],
          [
            657,
            713.4
          ],
          [
            657,
            708.47
          ],
          [
            660,
            703.54
          ],
          [
            660,
            698.61
          ],
          [
            660,
            693.68
          ],
          [
            660,
            688.75
          ],
          [
            660,
            683.82
          ],
          [
            660,
            678.89
          ],
          [
            660,
            673.96
          ],
          [
            660,
            669.04
          ],
          [
            660,
            664.11
          ],
          [
            660,
            659.18
          ],
          [
            660,
            654.25
          ],
          [
            660,
            649.32
          ],
          [
            660,
            644.39
          ],
          [
            660,
            639.46
          ],
          [
            660,
            634.53
          ],
          [
            660,
            629.6
          ],
          [
            660,
            624.67
          ],
          [
            660,
            619.74
          ],
          [
            660,
            614.81
          ],
          [
            660,
            609.88
          ],
          [
            660,
            604.95
          ],
          [
            660,
            600.02
          ],
          [
            660,
            595.09
          ],
          [
            660,
            590.16
          ],
          [
            660,
            585.23
          ],
          [
            660,
            580.3
          ],
          [
            660,
            575.37
          ],
          [
            660,
            570.44
          ],
          [
            660,
            565.51
          ],
          [
            660,
            560.58
          ],
          [
            660,
            555.65
          ],
          [
            660,
            550.72
          ],
          [
            660,
            545.79
          ],
          [
            660,
            540.86
          ],
          [
            660,
            535.93
          ],
          [
            660,
            531
          ],
          [
            660,
            526.07
          ],
          [
            657,
            521.14
          ],
          [
            657,
            516.21
          ],
          [
            657,
            511.29
          ],
          [
            657,
            506.36
          ],
          [
            657,
            501.43
          ],
          [
            657,
            496.5
          ],
          [
            657,
            491.57
          ],
          [
            657,
            486.64
          ],
          [
            657,
            481.71
          ],
          [
            657,
            476.78
          ],
          [
            657,
            471.85
          ],
          [
            657,
            466.92
          ],
          [
            657,
            461.99
          ],
          [
            657,
            457.06
          ],
          [
            657,
            452.13
          ],
          [
            657,
            447.2
          ],
          [
            657,
            442.27
          ],
          [
            657,
            437.34
          ],
          [
            657,
            432.41
          ],
          [
            657,
            427.48
          ],
          [
            657,
            422.55
          ],
          [
            657,
            417.62
          ],
          [
            657,
            412.69
          ],
          [
            657,
            407.76
          ],
          [
            657,
            402.83
          ],
          [
            657,
            397.9
          ],
          [
            657,
            392.97
          ],
          [
            657,
            388.04
          ],
          [
            657,
            383.11
          ],
          [
            657,
            378.18
          ],
          [
            656,
            373.25
          ],
          [
            656,
            368.32
          ],
          [
            656,
            363.39
          ],
          [
            656,
            358.46
          ]
        ],
        "corners": [
          [
            655.67,
            356
          ],
          [
            881,
            356
          ],
          [
            881,
            768
          ],
          [
            662.22,
            768
          ]
        ],
        "head_kind": "straight",
        "trace_confidence": 0.9505,
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
