// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir fixtures/nav-manor
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
window.HOLO_FIXTURES["nav-manor"] = {
  id: "nav-manor",
  fp: "8a7f776d",
  world: {
  "schema": "holo-emitter/0.1",
  "locations": [
    {
      "id": "back_stair",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_back_stair_great_hall",
          "from": "back_stair",
          "facing": "W",
          "to": "great_hall",
          "arrive_facing": "W",
          "via": "op11"
        },
        {
          "id": "door_back_stair_servants_hall",
          "from": "back_stair",
          "facing": "E",
          "to": "servants_hall",
          "arrive_facing": "E",
          "via": "op12"
        },
        {
          "id": "stair_back_stair_back_stair_head",
          "from": "back_stair",
          "facing": "E",
          "to": "back_stair_head",
          "arrive_facing": "E",
          "via": "back_stair_flight"
        }
      ]
    },
    {
      "id": "back_stair_head",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_back_stair_head_long_gallery",
          "from": "back_stair_head",
          "facing": "E",
          "to": "long_gallery",
          "arrive_facing": "E",
          "via": "op24"
        },
        {
          "id": "door_back_stair_head_solar",
          "from": "back_stair_head",
          "facing": "W",
          "to": "solar",
          "arrive_facing": "W",
          "via": "op23"
        },
        {
          "id": "stair_back_stair_head_back_stair",
          "from": "back_stair_head",
          "facing": "W",
          "to": "back_stair",
          "arrive_facing": "W",
          "via": "back_stair_flight"
        }
      ]
    },
    {
      "id": "buttery_pantry",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_buttery_pantry_hall",
          "from": "buttery_pantry",
          "facing": "S",
          "to": "hall",
          "arrive_facing": "S",
          "via": "op15"
        },
        {
          "id": "door_buttery_pantry_servants_hall",
          "from": "buttery_pantry",
          "facing": "N",
          "to": "servants_hall",
          "arrive_facing": "N",
          "via": "op16"
        }
      ]
    },
    {
      "id": "closet_chamber",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_closet_chamber_guest_chamber",
          "from": "closet_chamber",
          "facing": "S",
          "to": "guest_chamber",
          "arrive_facing": "S",
          "via": "op20"
        }
      ]
    },
    {
      "id": "dining_parlour",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_dining_parlour_entrance_court",
          "from": "dining_parlour",
          "facing": "E",
          "to": "entrance_court",
          "arrive_facing": "E",
          "via": "op03"
        },
        {
          "id": "door_dining_parlour_great_stair_hall",
          "from": "dining_parlour",
          "facing": "N",
          "to": "great_stair_hall",
          "arrive_facing": "N",
          "via": "op06"
        }
      ]
    },
    {
      "id": "entrance_approach",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "way_entrance_approach_entrance_court",
          "from": "entrance_approach",
          "facing": "N",
          "to": "entrance_court",
          "arrive_facing": "N",
          "via": "op_court_mouth"
        }
      ]
    },
    {
      "id": "entrance_court",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_entrance_court_dining_parlour",
          "from": "entrance_court",
          "facing": "W",
          "to": "dining_parlour",
          "arrive_facing": "W",
          "via": "op03"
        },
        {
          "id": "door_entrance_court_great_hall",
          "from": "entrance_court",
          "facing": "N",
          "to": "great_hall",
          "arrive_facing": "N",
          "via": "op01"
        },
        {
          "id": "door_entrance_court_kitchen",
          "from": "entrance_court",
          "facing": "E",
          "to": "kitchen",
          "arrive_facing": "E",
          "via": "op02"
        },
        {
          "id": "way_entrance_court_entrance_approach",
          "from": "entrance_court",
          "facing": "S",
          "to": "entrance_approach",
          "arrive_facing": "S",
          "via": "op_court_mouth"
        }
      ]
    },
    {
      "id": "garden_room",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_garden_room_library",
          "from": "garden_room",
          "facing": "S",
          "to": "library",
          "arrive_facing": "S",
          "via": "op08"
        },
        {
          "id": "door_garden_room_privy_garden",
          "from": "garden_room",
          "facing": "E",
          "to": "privy_garden",
          "arrive_facing": "E",
          "via": "op09"
        }
      ]
    },
    {
      "id": "great_hall",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_great_hall_back_stair",
          "from": "great_hall",
          "facing": "E",
          "to": "back_stair",
          "arrive_facing": "E",
          "via": "op11"
        },
        {
          "id": "door_great_hall_entrance_court",
          "from": "great_hall",
          "facing": "S",
          "to": "entrance_court",
          "arrive_facing": "S",
          "via": "op01"
        },
        {
          "id": "door_great_hall_great_stair_hall",
          "from": "great_hall",
          "facing": "W",
          "to": "great_stair_hall",
          "arrive_facing": "W",
          "via": "op04"
        },
        {
          "id": "door_great_hall_library",
          "from": "great_hall",
          "facing": "W",
          "to": "library",
          "arrive_facing": "W",
          "via": "op05"
        },
        {
          "id": "door_great_hall_privy_garden",
          "from": "great_hall",
          "facing": "N",
          "to": "privy_garden",
          "arrive_facing": "N",
          "via": "op10"
        }
      ]
    },
    {
      "id": "great_stair_hall",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_great_stair_hall_dining_parlour",
          "from": "great_stair_hall",
          "facing": "S",
          "to": "dining_parlour",
          "arrive_facing": "S",
          "via": "op06"
        },
        {
          "id": "door_great_stair_hall_great_hall",
          "from": "great_stair_hall",
          "facing": "E",
          "to": "great_hall",
          "arrive_facing": "E",
          "via": "op04"
        },
        {
          "id": "door_great_stair_hall_library",
          "from": "great_stair_hall",
          "facing": "N",
          "to": "library",
          "arrive_facing": "N",
          "via": "op07"
        },
        {
          "id": "stair_great_stair_hall_stair_landing",
          "from": "great_stair_hall",
          "facing": "N",
          "to": "stair_landing",
          "arrive_facing": "N",
          "via": "great_stair"
        }
      ]
    },
    {
      "id": "guest_chamber",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_guest_chamber_closet_chamber",
          "from": "guest_chamber",
          "facing": "N",
          "to": "closet_chamber",
          "arrive_facing": "N",
          "via": "op20"
        },
        {
          "id": "door_guest_chamber_stair_landing",
          "from": "guest_chamber",
          "facing": "S",
          "to": "stair_landing",
          "arrive_facing": "S",
          "via": "op19"
        }
      ]
    },
    {
      "id": "hall",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_hall_buttery_pantry",
          "from": "hall",
          "facing": "N",
          "to": "buttery_pantry",
          "arrive_facing": "N",
          "via": "op15"
        },
        {
          "id": "door_hall_study",
          "from": "hall",
          "facing": "W",
          "to": "study",
          "arrive_facing": "W",
          "via": "door1"
        }
      ]
    },
    {
      "id": "kitchen",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_kitchen_entrance_court",
          "from": "kitchen",
          "facing": "W",
          "to": "entrance_court",
          "arrive_facing": "W",
          "via": "op02"
        },
        {
          "id": "door_kitchen_hall",
          "from": "kitchen",
          "facing": "N",
          "to": "hall",
          "arrive_facing": "N",
          "via": "op14"
        }
      ]
    },
    {
      "id": "library",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_library_garden_room",
          "from": "library",
          "facing": "N",
          "to": "garden_room",
          "arrive_facing": "N",
          "via": "op08"
        },
        {
          "id": "door_library_great_hall",
          "from": "library",
          "facing": "E",
          "to": "great_hall",
          "arrive_facing": "E",
          "via": "op05"
        },
        {
          "id": "door_library_great_stair_hall",
          "from": "library",
          "facing": "S",
          "to": "great_stair_hall",
          "arrive_facing": "S",
          "via": "op07"
        }
      ]
    },
    {
      "id": "long_gallery",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_long_gallery_back_stair_head",
          "from": "long_gallery",
          "facing": "W",
          "to": "back_stair_head",
          "arrive_facing": "W",
          "via": "op24"
        },
        {
          "id": "door_long_gallery_muniment_room",
          "from": "long_gallery",
          "facing": "W",
          "to": "muniment_room",
          "arrive_facing": "W",
          "via": "op25"
        }
      ]
    },
    {
      "id": "master_bedchamber",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_master_bedchamber_stair_landing",
          "from": "master_bedchamber",
          "facing": "N",
          "to": "stair_landing",
          "arrive_facing": "N",
          "via": "op18"
        }
      ]
    },
    {
      "id": "muniment_room",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_muniment_room_long_gallery",
          "from": "muniment_room",
          "facing": "E",
          "to": "long_gallery",
          "arrive_facing": "E",
          "via": "op25"
        },
        {
          "id": "door_muniment_room_solar",
          "from": "muniment_room",
          "facing": "W",
          "to": "solar",
          "arrive_facing": "W",
          "via": "op22"
        }
      ]
    },
    {
      "id": "privy_garden",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_privy_garden_garden_room",
          "from": "privy_garden",
          "facing": "W",
          "to": "garden_room",
          "arrive_facing": "W",
          "via": "op09"
        },
        {
          "id": "door_privy_garden_great_hall",
          "from": "privy_garden",
          "facing": "S",
          "to": "great_hall",
          "arrive_facing": "S",
          "via": "op10"
        },
        {
          "id": "door_privy_garden_servants_hall",
          "from": "privy_garden",
          "facing": "E",
          "to": "servants_hall",
          "arrive_facing": "E",
          "via": "op17"
        }
      ]
    },
    {
      "id": "servants_hall",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_servants_hall_back_stair",
          "from": "servants_hall",
          "facing": "W",
          "to": "back_stair",
          "arrive_facing": "W",
          "via": "op12"
        },
        {
          "id": "door_servants_hall_buttery_pantry",
          "from": "servants_hall",
          "facing": "S",
          "to": "buttery_pantry",
          "arrive_facing": "S",
          "via": "op16"
        },
        {
          "id": "door_servants_hall_privy_garden",
          "from": "servants_hall",
          "facing": "W",
          "to": "privy_garden",
          "arrive_facing": "W",
          "via": "op17"
        }
      ]
    },
    {
      "id": "solar",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_solar_back_stair_head",
          "from": "solar",
          "facing": "E",
          "to": "back_stair_head",
          "arrive_facing": "E",
          "via": "op23"
        },
        {
          "id": "door_solar_muniment_room",
          "from": "solar",
          "facing": "E",
          "to": "muniment_room",
          "arrive_facing": "E",
          "via": "op22"
        },
        {
          "id": "door_solar_stair_landing",
          "from": "solar",
          "facing": "W",
          "to": "stair_landing",
          "arrive_facing": "W",
          "via": "op21"
        }
      ]
    },
    {
      "id": "stair_landing",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_stair_landing_guest_chamber",
          "from": "stair_landing",
          "facing": "N",
          "to": "guest_chamber",
          "arrive_facing": "N",
          "via": "op19"
        },
        {
          "id": "door_stair_landing_master_bedchamber",
          "from": "stair_landing",
          "facing": "S",
          "to": "master_bedchamber",
          "arrive_facing": "S",
          "via": "op18"
        },
        {
          "id": "door_stair_landing_solar",
          "from": "stair_landing",
          "facing": "E",
          "to": "solar",
          "arrive_facing": "E",
          "via": "op21"
        },
        {
          "id": "stair_stair_landing_great_stair_hall",
          "from": "stair_landing",
          "facing": "S",
          "to": "great_stair_hall",
          "arrive_facing": "S",
          "via": "great_stair"
        }
      ]
    },
    {
      "id": "study",
      "facings": [
        "N",
        "E",
        "S",
        "W"
      ],
      "exits": [
        {
          "id": "door_study_hall",
          "from": "study",
          "facing": "E",
          "to": "hall",
          "arrive_facing": "E",
          "via": "door1"
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
    "go.door_back_stair_great_hall.arrive": "Out of the back stair, you come into the great hall. The roof timbers go up into the dark, and the floor rings under you. The doorway stands open behind you.",
    "go.door_back_stair_great_hall.refused_unreachable": "The way from the back stair into the great hall is not before you.",
    "go.door_back_stair_head_long_gallery.arrive": "You leave the back stair head and come into the long gallery. The gallery runs off further than a room has any right to, window after window. The doorway stands open behind you.",
    "go.door_back_stair_head_long_gallery.refused_unreachable": "No passage from the back stair head to the long gallery stands where you are looking.",
    "go.door_back_stair_head_solar.arrive": "The back stair head gives onto the solar, and you step through into it. The great chamber over the hall, and the light lies long across the boards. The doorway stands open behind you.",
    "go.door_back_stair_head_solar.refused_unreachable": "The back stair head does not open into the solar from here.",
    "go.door_back_stair_servants_hall.arrive": "You pass from the back stair into the servants' hall. A long board with the benches pushed under it, and the day's work sounding somewhere beyond. The doorway stands open behind you.",
    "go.door_back_stair_servants_hall.refused_unreachable": "That way — the back stair to the servants' hall — lies elsewhere in the house.",
    "go.door_buttery_pantry_hall.arrive": "You cross out of the buttery and pantry and into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_buttery_pantry_hall.refused_unreachable": "You are not at the passage between the buttery and pantry and the cross passage.",
    "go.door_buttery_pantry_servants_hall.arrive": "The buttery and pantry lets you go, and the servants' hall takes you. A long board with the benches pushed under it, and the day's work sounding somewhere beyond. The doorway stands open behind you.",
    "go.door_buttery_pantry_servants_hall.refused_unreachable": "The door between the buttery and pantry and the servants' hall is not the one before you.",
    "go.door_closet_chamber_guest_chamber.arrive": "Out of the closet chamber, you come into the guest chamber. Made ready and not lived in; the bed is smooth and the grate is cold. The doorway stands open behind you.",
    "go.door_closet_chamber_guest_chamber.refused_unreachable": "The way from the closet chamber into the guest chamber is not before you.",
    "go.door_dining_parlour_entrance_court.arrive": "You leave the dining parlour and come into the entrance court. Open sky, gravel underfoot, and three fronts of the house standing round you. The doorway stands open behind you.",
    "go.door_dining_parlour_entrance_court.refused_unreachable": "No passage from the dining parlour to the entrance court stands where you are looking.",
    "go.door_dining_parlour_great_stair_hall.arrive": "The dining parlour gives onto the great stair hall, and you step through into it. The stair goes up out of the dark, and the whole height of the house stands above you. The doorway stands open behind you.",
    "go.door_dining_parlour_great_stair_hall.refused_unreachable": "The dining parlour does not open into the great stair hall from here.",
    "go.door_entrance_court_dining_parlour.arrive": "You pass from the entrance court into the dining parlour. Panelling to the shoulder, and the light comes in mannerly through glass. The doorway stands open behind you.",
    "go.door_entrance_court_dining_parlour.refused_unreachable": "That way — the entrance court to the dining parlour — lies elsewhere in the house.",
    "go.door_entrance_court_great_hall.arrive": "You cross out of the entrance court and into the great hall. The roof timbers go up into the dark, and the floor rings under you. The doorway stands open behind you.",
    "go.door_entrance_court_great_hall.refused_unreachable": "You are not at the passage between the entrance court and the great hall.",
    "go.door_entrance_court_kitchen.arrive": "The entrance court lets you go, and the kitchen takes you. Ash and cold fat hang in the air, and the great hearth is a mouth in the wall. The doorway stands open behind you.",
    "go.door_entrance_court_kitchen.refused_unreachable": "The door between the entrance court and the kitchen is not the one before you.",
    "go.door_garden_room_library.arrive": "Out of the garden room, you come into the library. Leather and paper, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_garden_room_library.refused_unreachable": "The way from the garden room into the library is not before you.",
    "go.door_garden_room_privy_garden.arrive": "You leave the garden room and come into the privy garden. Clipped box and turned earth, walled close against the world. The doorway stands open behind you.",
    "go.door_garden_room_privy_garden.refused_unreachable": "No passage from the garden room to the privy garden stands where you are looking.",
    "go.door_great_hall_back_stair.arrive": "The great hall gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.",
    "go.door_great_hall_back_stair.refused_unreachable": "The great hall does not open into the back stair from here.",
    "go.door_great_hall_entrance_court.arrive": "You pass from the great hall into the entrance court. Open sky, gravel underfoot, and three fronts of the house standing round you. The doorway stands open behind you.",
    "go.door_great_hall_entrance_court.refused_unreachable": "That way — the great hall to the entrance court — lies elsewhere in the house.",
    "go.door_great_hall_great_stair_hall.arrive": "You cross out of the great hall and into the great stair hall. The stair goes up out of the dark, and the whole height of the house stands above you. The doorway stands open behind you.",
    "go.door_great_hall_great_stair_hall.refused_unreachable": "You are not at the passage between the great hall and the great stair hall.",
    "go.door_great_hall_library.arrive": "The great hall lets you go, and the library takes you. Leather and paper, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_great_hall_library.refused_unreachable": "The door between the great hall and the library is not the one before you.",
    "go.door_great_hall_privy_garden.arrive": "Out of the great hall, you come into the privy garden. Clipped box and turned earth, walled close against the world. The doorway stands open behind you.",
    "go.door_great_hall_privy_garden.refused_unreachable": "The way from the great hall into the privy garden is not before you.",
    "go.door_great_stair_hall_dining_parlour.arrive": "You leave the great stair hall and come into the dining parlour. Panelling to the shoulder, and the light comes in mannerly through glass. The doorway stands open behind you.",
    "go.door_great_stair_hall_dining_parlour.refused_unreachable": "No passage from the great stair hall to the dining parlour stands where you are looking.",
    "go.door_great_stair_hall_great_hall.arrive": "The great stair hall gives onto the great hall, and you step through into it. The roof timbers go up into the dark, and the floor rings under you. The doorway stands open behind you.",
    "go.door_great_stair_hall_great_hall.refused_unreachable": "The great stair hall does not open into the great hall from here.",
    "go.door_great_stair_hall_library.arrive": "You pass from the great stair hall into the library. Leather and paper, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_great_stair_hall_library.refused_unreachable": "That way — the great stair hall to the library — lies elsewhere in the house.",
    "go.door_guest_chamber_closet_chamber.arrive": "You cross out of the guest chamber and into the closet chamber. A small close room off the chamber, for prayer or for nothing. The doorway stands open behind you.",
    "go.door_guest_chamber_closet_chamber.refused_unreachable": "You are not at the passage between the guest chamber and the closet chamber.",
    "go.door_guest_chamber_stair_landing.arrive": "The guest chamber lets you go, and the stair landing takes you. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_guest_chamber_stair_landing.refused_unreachable": "The door between the guest chamber and the stair landing is not the one before you.",
    "go.door_hall_buttery_pantry.arrive": "Out of the cross passage, you come into the buttery and pantry. Shelved and shuttered, it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.",
    "go.door_hall_buttery_pantry.refused_unreachable": "The way from the cross passage into the buttery and pantry is not before you.",
    "go.door_hall_study.arrive": "You pass back into the study, where ink and oak dust close about you again. The doorway stands open behind you.",
    "go.door_hall_study.refused_unreachable": "The way to the study is not before you; you must come to it first.",
    "go.door_kitchen_entrance_court.arrive": "The kitchen gives onto the entrance court, and you step through into it. Open sky, gravel underfoot, and three fronts of the house standing round you. The doorway stands open behind you.",
    "go.door_kitchen_entrance_court.refused_unreachable": "The kitchen does not open into the entrance court from here.",
    "go.door_kitchen_hall.arrive": "You pass from the kitchen into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_kitchen_hall.refused_unreachable": "That way — the kitchen to the cross passage — lies elsewhere in the house.",
    "go.door_library_garden_room.arrive": "You cross out of the library and into the garden room. Green light off the garden, and the floor is flagged and cool. The doorway stands open behind you.",
    "go.door_library_garden_room.refused_unreachable": "You are not at the passage between the library and the garden room.",
    "go.door_library_great_hall.arrive": "The library lets you go, and the great hall takes you. The roof timbers go up into the dark, and the floor rings under you. The doorway stands open behind you.",
    "go.door_library_great_hall.refused_unreachable": "The door between the library and the great hall is not the one before you.",
    "go.door_library_great_stair_hall.arrive": "Out of the library, you come into the great stair hall. The stair goes up out of the dark, and the whole height of the house stands above you. The doorway stands open behind you.",
    "go.door_library_great_stair_hall.refused_unreachable": "The way from the library into the great stair hall is not before you.",
    "go.door_long_gallery_back_stair_head.arrive": "You leave the long gallery and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.",
    "go.door_long_gallery_back_stair_head.refused_unreachable": "No passage from the long gallery to the back stair head stands where you are looking.",
    "go.door_long_gallery_muniment_room.arrive": "The long gallery gives onto the muniment room, and you step through into it. Deeds and dust in presses to the ceiling, and one small window keeping watch. The doorway stands open behind you.",
    "go.door_long_gallery_muniment_room.refused_unreachable": "The long gallery does not open into the muniment room from here.",
    "go.door_master_bedchamber_stair_landing.arrive": "You pass from the master bedchamber into the stair landing. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_master_bedchamber_stair_landing.refused_unreachable": "That way — the master bedchamber to the stair landing — lies elsewhere in the house.",
    "go.door_muniment_room_long_gallery.arrive": "You cross out of the muniment room and into the long gallery. The gallery runs off further than a room has any right to, window after window. The doorway stands open behind you.",
    "go.door_muniment_room_long_gallery.refused_unreachable": "You are not at the passage between the muniment room and the long gallery.",
    "go.door_muniment_room_solar.arrive": "The muniment room lets you go, and the solar takes you. The great chamber over the hall, and the light lies long across the boards. The doorway stands open behind you.",
    "go.door_muniment_room_solar.refused_unreachable": "The door between the muniment room and the solar is not the one before you.",
    "go.door_privy_garden_garden_room.arrive": "Out of the privy garden, you come into the garden room. Green light off the garden, and the floor is flagged and cool. The doorway stands open behind you.",
    "go.door_privy_garden_garden_room.refused_unreachable": "The way from the privy garden into the garden room is not before you.",
    "go.door_privy_garden_great_hall.arrive": "You leave the privy garden and come into the great hall. The roof timbers go up into the dark, and the floor rings under you. The doorway stands open behind you.",
    "go.door_privy_garden_great_hall.refused_unreachable": "No passage from the privy garden to the great hall stands where you are looking.",
    "go.door_privy_garden_servants_hall.arrive": "The privy garden gives onto the servants' hall, and you step through into it. A long board with the benches pushed under it, and the day's work sounding somewhere beyond. The doorway stands open behind you.",
    "go.door_privy_garden_servants_hall.refused_unreachable": "The privy garden does not open into the servants' hall from here.",
    "go.door_servants_hall_back_stair.arrive": "You pass from the servants' hall into the back stair. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.",
    "go.door_servants_hall_back_stair.refused_unreachable": "That way — the servants' hall to the back stair — lies elsewhere in the house.",
    "go.door_servants_hall_buttery_pantry.arrive": "You cross out of the servants' hall and into the buttery and pantry. Shelved and shuttered, it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.",
    "go.door_servants_hall_buttery_pantry.refused_unreachable": "You are not at the passage between the servants' hall and the buttery and pantry.",
    "go.door_servants_hall_privy_garden.arrive": "The servants' hall lets you go, and the privy garden takes you. Clipped box and turned earth, walled close against the world. The doorway stands open behind you.",
    "go.door_servants_hall_privy_garden.refused_unreachable": "The door between the servants' hall and the privy garden is not the one before you.",
    "go.door_solar_back_stair_head.arrive": "Out of the solar, you come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.",
    "go.door_solar_back_stair_head.refused_unreachable": "The way from the solar into the back stair head is not before you.",
    "go.door_solar_muniment_room.arrive": "You leave the solar and come into the muniment room. Deeds and dust in presses to the ceiling, and one small window keeping watch. The doorway stands open behind you.",
    "go.door_solar_muniment_room.refused_unreachable": "No passage from the solar to the muniment room stands where you are looking.",
    "go.door_solar_stair_landing.arrive": "The solar gives onto the stair landing, and you step through into it. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_solar_stair_landing.refused_unreachable": "The solar does not open into the stair landing from here.",
    "go.door_stair_landing_guest_chamber.arrive": "You pass from the stair landing into the guest chamber. Made ready and not lived in; the bed is smooth and the grate is cold. The doorway stands open behind you.",
    "go.door_stair_landing_guest_chamber.refused_unreachable": "That way — the stair landing to the guest chamber — lies elsewhere in the house.",
    "go.door_stair_landing_master_bedchamber.arrive": "You cross out of the stair landing and into the master bedchamber. Hangings, a great bed, and the hush that sleeps in a room by day. The doorway stands open behind you.",
    "go.door_stair_landing_master_bedchamber.refused_unreachable": "You are not at the passage between the stair landing and the master bedchamber.",
    "go.door_stair_landing_solar.arrive": "The stair landing lets you go, and the solar takes you. The great chamber over the hall, and the light lies long across the boards. The doorway stands open behind you.",
    "go.door_stair_landing_solar.refused_unreachable": "The door between the stair landing and the solar is not the one before you.",
    "go.door_study_hall.arrive": "You step through into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_study_hall.refused_unreachable": "The way to the cross passage does not open from where you stand.",
    "go.stair_back_stair_back_stair_head.arrive": "You leave the back stair and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The stair falls away behind you.",
    "go.stair_back_stair_back_stair_head.refused_unreachable": "The stair from the back stair up to the back stair head is not before you.",
    "go.stair_back_stair_head_back_stair.arrive": "The back stair head gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The stair rises behind you.",
    "go.stair_back_stair_head_back_stair.refused_unreachable": "The stair from the back stair head down to the back stair is not before you.",
    "go.stair_great_stair_hall_stair_landing.arrive": "You pass from the great stair hall into the stair landing. The stair-head, and the house below sounding faintly up the well. The stair falls away behind you.",
    "go.stair_great_stair_hall_stair_landing.refused_unreachable": "The stair from the great stair hall up to the stair landing is not before you.",
    "go.stair_stair_landing_great_stair_hall.arrive": "You cross out of the stair landing and into the great stair hall. The stair goes up out of the dark, and the whole height of the house stands above you. The stair rises behind you.",
    "go.stair_stair_landing_great_stair_hall.refused_unreachable": "The stair from the stair landing down to the great stair hall is not before you.",
    "go.way_entrance_approach_entrance_court.arrive": "The entrance approach lets you go, and the entrance court takes you. Open sky, gravel underfoot, and three fronts of the house standing round you. The court mouth stands open behind you.",
    "go.way_entrance_approach_entrance_court.refused_unreachable": "The mouth of the court between the entrance approach and the entrance court is not before you.",
    "go.way_entrance_court_entrance_approach.arrive": "Out of the entrance court, you come into the entrance approach. The gravel runs away south, and the house stands off at its own distance. The court mouth stands open behind you.",
    "go.way_entrance_court_entrance_approach.refused_unreachable": "The mouth of the court between the entrance court and the entrance approach is not before you.",
    "toggle.*.refused_unknown": "Nothing of that description offers itself to your hand.",
    "take.*.refused_unknown": "You reach, and your hand closes on nothing of the sort.",
    "go.*.refused_unknown": "No such passage is to be found; the walls keep their counsel.",
    "turn.*.refused": "The room offers no other aspect; you face all there is to face."
  }
},
  viewstate: { "location": "study", "facing": "N" },
  metas: {
  "back_stair/N": {
    "floor_line_y": 0.8941553833400322,
    "px_per_m_at_wall": 329.2604501607717,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 329.2604501607717,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -129.2347266881029,
    "corner_x1_px": 1665.234726688103,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.11,
    "openings": [],
    "stairs": []
  },
  "back_stair/E": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.15,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.15,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 248.48899755501213,
    "corner_x1_px": 1287.5110024449878,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op12",
        "kind": "door",
        "via": null,
        "x": 273.52567237163805,
        "y": 321.5503667481662,
        "w": 200.29339853300735,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": -4.55
      }
    ],
    "stairs": [
      {
        "id": "back_stair_flight",
        "kind": "stair",
        "via": null,
        "direction": "up",
        "treads": 17,
        "rise_m": 2.8,
        "u0": 0.674699,
        "u1": 0.939759,
        "depth_near_m": 5,
        "depth_far_m": 0.4,
        "x": 969.1924119241186,
        "y": 77.37154471544738,
        "w": 566.8075880758814,
        "h": 946.6284552845526,
        "poly": [
          [
            2444.069057,
            1357.131076
          ],
          [
            1808.461665,
            805.610635
          ],
          [
            1522.381351,
            557.376987
          ],
          [
            1359.692452,
            416.21083
          ],
          [
            1254.7258,
            325.130621
          ],
          [
            1181.390108,
            261.49679
          ],
          [
            1127.259892,
            214.527669
          ],
          [
            1085.664234,
            178.43486
          ],
          [
            1052.701105,
            149.832551
          ],
          [
            1025.935827,
            126.608155
          ],
          [
            1003.770596,
            107.375248
          ],
          [
            985.113367,
            91.186255
          ],
          [
            969.192412,
            77.371545
          ],
          [
            1274.449864,
            77.371545
          ],
          [
            1314.52675,
            91.186255
          ],
          [
            1361.4915,
            107.375248
          ],
          [
            1417.286736,
            126.608155
          ],
          [
            1484.661403,
            149.832551
          ],
          [
            1567.637553,
            178.43486
          ],
          [
            1672.343866,
            214.527669
          ],
          [
            1808.602686,
            261.49679
          ],
          [
            1993.206325,
            325.130621
          ],
          [
            2257.432724,
            416.21083
          ],
          [
            2666.959952,
            557.376987
          ],
          [
            3387.093157,
            805.610635
          ],
          [
            4987.070385,
            1357.131076
          ]
        ],
        "floor_poly": [
          [
            1522.381351,
            1757.042259
          ],
          [
            1359.692452,
            1491.578856
          ],
          [
            1254.7258,
            1320.302237
          ],
          [
            1181.390108,
            1200.638618
          ],
          [
            1127.259892,
            1112.313037
          ],
          [
            1085.664234,
            1044.440398
          ],
          [
            1052.701105,
            990.653666
          ],
          [
            1025.935827,
            946.980114
          ],
          [
            1003.770596,
            910.812572
          ],
          [
            985.113367,
            880.369121
          ],
          [
            969.192412,
            854.390515
          ],
          [
            1274.449864,
            854.390515
          ],
          [
            1314.52675,
            880.369121
          ],
          [
            1361.4915,
            910.812572
          ],
          [
            1417.286736,
            946.980114
          ],
          [
            1484.661403,
            990.653666
          ],
          [
            1567.637553,
            1044.440398
          ],
          [
            1672.343866,
            1112.313037
          ],
          [
            1808.602686,
            1200.638618
          ],
          [
            1993.206325,
            1320.302237
          ],
          [
            2257.432724,
            1491.578856
          ],
          [
            2666.959952,
            1757.042259
          ]
        ],
        "well_poly": [
          [
            1359.692452,
            -793.5782
          ],
          [
            1254.7258,
            -559.466371
          ],
          [
            1181.390108,
            -395.902489
          ],
          [
            1127.259892,
            -275.173442
          ],
          [
            1085.664234,
            -182.40078
          ],
          [
            1052.701105,
            -108.881638
          ],
          [
            1025.935827,
            -49.185837
          ],
          [
            1003.770596,
            0.250271
          ],
          [
            985.113367,
            41.862326
          ],
          [
            969.192412,
            77.371545
          ],
          [
            1274.449864,
            77.371545
          ],
          [
            1314.52675,
            41.862326
          ],
          [
            1361.4915,
            0.250271
          ],
          [
            1417.286736,
            -49.185837
          ],
          [
            1484.661403,
            -108.881638
          ],
          [
            1567.637553,
            -182.40078
          ],
          [
            1672.343866,
            -275.173442
          ],
          [
            1808.602686,
            -395.902489
          ],
          [
            1993.206325,
            -559.466371
          ],
          [
            2257.432724,
            -793.5782
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "back_stair/S": {
    "floor_line_y": 0.8334992609797297,
    "px_per_m_at_wall": 276.7567567567567,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 276.7567567567567,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 13.837837837837924,
    "corner_x1_px": 1522.162162162162,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 3.7,
    "openings": [],
    "stairs": []
  },
  "back_stair/W": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.15,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.15,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 248.48899755501213,
    "corner_x1_px": 1287.5110024449878,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op11",
        "kind": "door",
        "via": null,
        "x": 561.4474327628361,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 14.95,
        "beyond_offset_m": -2.575
      }
    ],
    "stairs": []
  },
  "back_stair_head/N": {
    "floor_line_y": 0.8941553833400322,
    "px_per_m_at_wall": 329.2604501607717,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 329.2604501607717,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -129.2347266881029,
    "corner_x1_px": 1665.234726688103,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.11,
    "openings": [],
    "stairs": []
  },
  "back_stair_head/E": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.15,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.15,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 248.48899755501213,
    "corner_x1_px": 1287.5110024449878,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op24",
        "kind": "door",
        "via": null,
        "x": 724.1858190709046,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": 4.075
      }
    ],
    "stairs": []
  },
  "back_stair_head/S": {
    "floor_line_y": 0.8334992609797297,
    "px_per_m_at_wall": 276.7567567567567,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 276.7567567567567,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 13.837837837837924,
    "corner_x1_px": 1522.162162162162,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 3.7,
    "openings": [],
    "stairs": []
  },
  "back_stair_head/W": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.15,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.15,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 248.48899755501213,
    "corner_x1_px": 1287.5110024449878,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op23",
        "kind": "door",
        "via": null,
        "x": 561.4474327628361,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 14.95,
        "beyond_offset_m": -2.575
      }
    ],
    "stairs": [
      {
        "id": "back_stair_flight",
        "kind": "stair",
        "via": null,
        "direction": "down",
        "treads": 17,
        "rise_m": 2.8,
        "u0": 0.060241,
        "u1": 0.325301,
        "depth_near_m": 5.05,
        "depth_far_m": 0.45,
        "x": 0,
        "y": 858.9,
        "w": 564.0439560439567,
        "h": 165.10000000000002,
        "poly": [
          [
            -1232.604534,
            1822.930227
          ],
          [
            -783.25,
            1531.65
          ],
          [
            -498.730463,
            1347.218979
          ],
          [
            -302.404313,
            1219.956604
          ],
          [
            -158.767795,
            1126.848658
          ],
          [
            -49.119342,
            1055.772428
          ],
          [
            37.328427,
            999.735327
          ],
          [
            107.234609,
            954.420799
          ],
          [
            164.932422,
            917.01997
          ],
          [
            213.363128,
            885.626257
          ],
          [
            254.593407,
            858.9
          ],
          [
            564.043956,
            858.9
          ],
          [
            547.664804,
            885.626257
          ],
          [
            528.425209,
            917.01997
          ],
          [
            505.50416,
            954.420799
          ],
          [
            477.733211,
            999.735327
          ],
          [
            443.390947,
            1055.772428
          ],
          [
            399.831972,
            1126.848658
          ],
          [
            342.770889,
            1219.956604
          ],
          [
            264.778309,
            1347.218979
          ],
          [
            151.75,
            1531.65
          ],
          [
            -26.760705,
            1822.930227
          ]
        ],
        "floor_poly": [
          [
            -1232.604534,
            1822.930227
          ],
          [
            -783.25,
            1531.65
          ],
          [
            -498.730463,
            1347.218979
          ],
          [
            -302.404313,
            1219.956604
          ],
          [
            -158.767795,
            1126.848658
          ],
          [
            -49.119342,
            1055.772428
          ],
          [
            37.328427,
            999.735327
          ],
          [
            107.234609,
            954.420799
          ],
          [
            164.932422,
            917.01997
          ],
          [
            213.363128,
            885.626257
          ],
          [
            254.593407,
            858.9
          ],
          [
            564.043956,
            858.9
          ],
          [
            547.664804,
            885.626257
          ],
          [
            528.425209,
            917.01997
          ],
          [
            505.50416,
            954.420799
          ],
          [
            477.733211,
            999.735327
          ],
          [
            443.390947,
            1055.772428
          ],
          [
            399.831972,
            1126.848658
          ],
          [
            342.770889,
            1219.956604
          ],
          [
            264.778309,
            1347.218979
          ],
          [
            151.75,
            1531.65
          ],
          [
            -26.760705,
            1822.930227
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "buttery_pantry/N": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 227.55555555555554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -142.22222222222217,
    "corner_x1_px": 1678.2222222222222,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [
      {
        "id": "op16",
        "kind": "door",
        "via": null,
        "x": 654.2222222222222,
        "y": 340.1871111111111,
        "w": 227.55555555555566,
        "h": 455.1111111111111,
        "beyond_m": 7.4,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "buttery_pantry/E": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.95,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.95,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 345.6,
    "corner_x1_px": 1190.4,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [],
    "stairs": []
  },
  "buttery_pantry/S": {
    "floor_line_y": 0.7766584201388889,
    "px_per_m_at_wall": 227.55555555555554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 227.55555555555554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -142.22222222222217,
    "corner_x1_px": 1678.2222222222222,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.5,
    "openings": [
      {
        "id": "op15",
        "kind": "door",
        "via": null,
        "x": 199.1111111111111,
        "y": 340.1871111111111,
        "w": 227.5555555555556,
        "h": 455.1111111111111,
        "beyond_m": 2.95,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "buttery_pantry/W": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.95,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.95,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 345.6,
    "corner_x1_px": 1190.4,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [],
    "stairs": []
  },
  "closet_chamber/N": {
    "floor_line_y": 0.8953824344758065,
    "px_per_m_at_wall": 330.3225806451613,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 330.3225806451613,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -685.4193548387098,
    "corner_x1_px": 2221.4193548387098,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.1,
    "openings": [],
    "stairs": []
  },
  "closet_chamber/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 3.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 492.6060606060606,
    "corner_x1_px": 1043.3939393939395,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "closet_chamber/S": {
    "floor_line_y": 0.8953824344758065,
    "px_per_m_at_wall": 330.3225806451613,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 330.3225806451613,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -685.4193548387098,
    "corner_x1_px": 2221.4193548387098,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.1,
    "openings": [
      {
        "id": "op20",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 256.22645161290325,
        "w": 330.32258064516145,
        "h": 660.6451612903226,
        "beyond_m": 6.8,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "closet_chamber/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 3.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 492.6060606060606,
    "corner_x1_px": 1043.3939393939395,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "dining_parlour/N": {
    "floor_line_y": 0.6792240767045454,
    "px_per_m_at_wall": 143.2167832167832,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 143.2167832167832,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 137.84615384615392,
    "corner_x1_px": 1398.1538461538462,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 7.15,
    "openings": [
      {
        "id": "op06",
        "kind": "door",
        "via": null,
        "x": 624.7832167832167,
        "y": 409.0918881118881,
        "w": 143.21678321678326,
        "h": 286.4335664335664,
        "beyond_m": 6,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "dining_parlour/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 178.42424242424238,
    "corner_x1_px": 1357.5757575757575,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op03",
        "kind": "door",
        "via": null,
        "x": 674.909090909091,
        "y": 399.3412121212122,
        "w": 155.15151515151513,
        "h": 310.3030303030303,
        "beyond_m": 21,
        "beyond_offset_m": -0.1
      }
    ],
    "stairs": []
  },
  "dining_parlour/S": {
    "floor_line_y": 0.6792240767045454,
    "px_per_m_at_wall": 143.2167832167832,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 143.2167832167832,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 137.84615384615392,
    "corner_x1_px": 1398.1538461538462,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 7.15,
    "openings": [],
    "stairs": []
  },
  "dining_parlour/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 178.42424242424238,
    "corner_x1_px": 1357.5757575757575,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "entrance_approach/N": {
    "floor_line_y": 0.5742810402014067,
    "px_per_m_at_wall": 52.37851662404092,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 32,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 52.37851662404092,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.2,
        "kind": "wall"
      },
      {
        "from_m": 26.6,
        "to_m": 32,
        "kind": "wall"
      }
    ],
    "wall_continuous": false,
    "corner_x0_px": null,
    "corner_x1_px": null,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 19.55,
    "openings": [
      {
        "id": "op_court_mouth",
        "kind": "threshold",
        "via": null,
        "x": 254.690537084399,
        "y": 526.1,
        "w": 1068.5217391304348,
        "h": 61.96378516624043,
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ],
    "stairs": []
  },
  "entrance_approach/E": {
    "floor_line_y": 0.5630611979166666,
    "px_per_m_at_wall": 42.666666666666664,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 42.666666666666664,
    "facing_type": "open",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "vista",
    "wall_segments": [],
    "wall_continuous": false,
    "corner_x0_px": null,
    "corner_x1_px": null,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_far_m": 24,
    "far_line": 35.8,
    "openings": [],
    "stairs": []
  },
  "entrance_approach/S": {
    "floor_line_y": 0.5926361979166667,
    "px_per_m_at_wall": 68.26666666666667,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 32,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 68.26666666666667,
    "facing_type": "open",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "vista",
    "wall_segments": [],
    "wall_continuous": false,
    "corner_x0_px": null,
    "corner_x1_px": null,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_far_m": 15,
    "far_line": -20,
    "openings": [],
    "stairs": []
  },
  "entrance_approach/W": {
    "floor_line_y": 0.5630611979166666,
    "px_per_m_at_wall": 42.666666666666664,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 42.666666666666664,
    "facing_type": "open",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "vista",
    "wall_segments": [],
    "wall_continuous": false,
    "corner_x0_px": null,
    "corner_x1_px": null,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_far_m": 24,
    "far_line": 3.8,
    "openings": [],
    "stairs": []
  },
  "entrance_court/N": {
    "floor_line_y": 0.6521321043494153,
    "px_per_m_at_wall": 119.76608187134502,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 119.76608187134502,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 20.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -453.61403508771923,
    "corner_x1_px": 1989.6140350877192,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 8.55,
    "openings": [
      {
        "id": "op01",
        "kind": "door",
        "via": null,
        "x": 324.8654970760235,
        "y": 428.2511111111112,
        "w": 191.6257309941521,
        "h": 239.53216374269005,
        "beyond_m": 9.9,
        "beyond_offset_m": -2.9
      }
    ],
    "stairs": []
  },
  "entrance_court/E": {
    "floor_line_y": 0.5910897926879085,
    "px_per_m_at_wall": 66.9281045751634,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 66.9281045751634,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 466.8235294117647,
    "corner_x1_px": 1069.1764705882354,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 15.3,
    "openings": [
      {
        "id": "op02",
        "kind": "door",
        "via": null,
        "x": 734.5359477124183,
        "y": 471.41973856209154,
        "w": 66.92810457516339,
        "h": 133.8562091503268,
        "beyond_m": 8.6,
        "beyond_offset_m": -0.425
      }
    ],
    "stairs": []
  },
  "entrance_court/S": {
    "floor_line_y": 0.5579938303154206,
    "px_per_m_at_wall": 38.2803738317757,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 38.2803738317757,
    "facing_type": "open",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "vista",
    "wall_segments": [],
    "wall_continuous": false,
    "corner_x0_px": null,
    "corner_x1_px": null,
    "focal_px": 1023.9999999999999,
    "storey_height_m": null,
    "nearest_floor_m": 2.4330026109660574,
    "camera_far_m": 26.75,
    "far_line": -20,
    "openings": [
      {
        "id": "op_court_mouth",
        "kind": "threshold",
        "via": null,
        "x": -779.3777777777777,
        "y": 526.1,
        "w": 3094.7555555555555,
        "h": 179.46548148148156,
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ],
    "stairs": []
  },
  "entrance_court/W": {
    "floor_line_y": 0.5910897926879085,
    "px_per_m_at_wall": 66.9281045751634,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 66.9281045751634,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 466.8235294117647,
    "corner_x1_px": 1069.1764705882354,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 15.3,
    "openings": [
      {
        "id": "op03",
        "kind": "door",
        "via": null,
        "x": 734.5359477124183,
        "y": 471.41973856209154,
        "w": 66.92810457516339,
        "h": 133.8562091503268,
        "beyond_m": 9.4,
        "beyond_offset_m": -0.1
      }
    ],
    "stairs": []
  },
  "garden_room/N": {
    "floor_line_y": 0.8953824344758065,
    "px_per_m_at_wall": 330.3225806451613,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 330.3225806451613,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -685.4193548387098,
    "corner_x1_px": 2221.4193548387098,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.1,
    "openings": [],
    "stairs": []
  },
  "garden_room/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 3.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 492.6060606060606,
    "corner_x1_px": 1043.3939393939395,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op09",
        "kind": "door",
        "via": null,
        "x": 709.8181818181818,
        "y": 399.3412121212122,
        "w": 155.15151515151524,
        "h": 310.3030303030303,
        "beyond_m": 21,
        "beyond_offset_m": 0.85
      }
    ],
    "stairs": []
  },
  "garden_room/S": {
    "floor_line_y": 0.8953824344758065,
    "px_per_m_at_wall": 330.3225806451613,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 330.3225806451613,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -685.4193548387098,
    "corner_x1_px": 2221.4193548387098,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 3.1,
    "openings": [
      {
        "id": "op08",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 256.22645161290325,
        "w": 330.32258064516145,
        "h": 660.6451612903226,
        "beyond_m": 6.8,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "garden_room/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 3.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 492.6060606060606,
    "corner_x1_px": 1043.3939393939395,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "great_hall/N": {
    "floor_line_y": 0.6474418476341808,
    "px_per_m_at_wall": 115.70621468926554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 14.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 115.70621468926554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -76.65536723163837,
    "corner_x1_px": 1612.6553672316384,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 8.85,
    "openings": [
      {
        "id": "op10",
        "kind": "door",
        "via": null,
        "x": 1253.9661016949153,
        "y": 431.56802259887,
        "w": 185.12994350282497,
        "h": 231.41242937853107,
        "beyond_m": 6.15,
        "beyond_offset_m": 2.9
      }
    ],
    "stairs": []
  },
  "great_hall/E": {
    "floor_line_y": 0.6218060609303653,
    "px_per_m_at_wall": 93.51598173515983,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 93.51598173515983,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 333.15068493150676,
    "corner_x1_px": 1202.8493150684933,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 10.95,
    "openings": [
      {
        "id": "op11",
        "kind": "door",
        "via": null,
        "x": 510.83105022831046,
        "y": 449.6974429223744,
        "w": 93.51598173515981,
        "h": 187.03196347031965,
        "beyond_m": 5.8,
        "beyond_offset_m": -2.575
      }
    ],
    "stairs": []
  },
  "great_hall/S": {
    "floor_line_y": 0.6474418476341808,
    "px_per_m_at_wall": 115.70621468926554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 14.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 115.70621468926554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -76.65536723163837,
    "corner_x1_px": 1612.6553672316384,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 8.85,
    "openings": [
      {
        "id": "op01",
        "kind": "door",
        "via": null,
        "x": 675.4350282485876,
        "y": 431.56802259887,
        "w": 185.12994350282474,
        "h": 231.41242937853107,
        "beyond_m": 29.6,
        "beyond_offset_m": -2.9
      }
    ],
    "stairs": []
  },
  "great_hall/W": {
    "floor_line_y": 0.6218060609303653,
    "px_per_m_at_wall": 93.51598173515983,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 93.51598173515983,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 333.15068493150676,
    "corner_x1_px": 1202.8493150684933,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 10.95,
    "openings": [
      {
        "id": "op04",
        "kind": "door",
        "via": null,
        "x": 464.0730593607305,
        "y": 449.6974429223744,
        "w": 93.51598173515987,
        "h": 187.03196347031965,
        "beyond_m": 9.4,
        "beyond_offset_m": -2.875
      },
      {
        "id": "op05",
        "kind": "door",
        "via": null,
        "x": 931.6529680365297,
        "y": 449.6974429223744,
        "w": 93.51598173515981,
        "h": 187.03196347031965,
        "beyond_m": 9.4,
        "beyond_offset_m": 3.525
      }
    ],
    "stairs": []
  },
  "great_stair_hall/N": {
    "floor_line_y": 0.74126953125,
    "px_per_m_at_wall": 196.9230769230769,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 196.9230769230769,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -98.46153846153845,
    "corner_x1_px": 1634.4615384615386,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.2,
    "openings": [
      {
        "id": "op07",
        "kind": "door",
        "via": null,
        "x": 571.076923076923,
        "y": 365.21384615384613,
        "w": 196.92307692307702,
        "h": 393.8461538461538,
        "beyond_m": 6.8,
        "beyond_offset_m": 0
      }
    ],
    "stairs": [
      {
        "id": "great_stair",
        "kind": "stair",
        "via": null,
        "direction": "up",
        "treads": 17,
        "rise_m": 2.8,
        "u0": 0.068182,
        "u1": 0.25,
        "depth_near_m": 5,
        "depth_far_m": 0.2,
        "x": 0,
        "y": 194.93840000000012,
        "w": 317.4399999999999,
        "h": 829.0615999999999,
        "poly": [
          [
            -4320.492308,
            1669.120308
          ],
          [
            -2948.314607,
            1199.811461
          ],
          [
            -2159.00885,
            929.855044
          ],
          [
            -1646.248175,
            754.481898
          ],
          [
            -1286.360248,
            631.393913
          ],
          [
            -1019.848649,
            540.24227
          ],
          [
            -814.545455,
            470.024976
          ],
          [
            -651.536481,
            414.273047
          ],
          [
            -518.972763,
            368.93393
          ],
          [
            -409.053381,
            331.339573
          ],
          [
            -316.432787,
            299.661705
          ],
          [
            -237.325228,
            272.605532
          ],
          [
            -168.974504,
            249.228385
          ],
          [
            -109.32626,
            228.827639
          ],
          [
            -56.817955,
            210.868878
          ],
          [
            -10.24,
            194.9384
          ],
          [
            317.44,
            194.9384
          ],
          [
            290.473815,
            210.868878
          ],
          [
            260.074271,
            228.827639
          ],
          [
            225.541076,
            249.228385
          ],
          [
            185.969605,
            272.605532
          ],
          [
            140.170492,
            299.661705
          ],
          [
            86.548043,
            331.339573
          ],
          [
            22.910506,
            368.93393
          ],
          [
            -53.83691,
            414.273047
          ],
          [
            -148.210526,
            470.024976
          ],
          [
            -267.07027,
            540.24227
          ],
          [
            -421.36646,
            631.393913
          ],
          [
            -629.722628,
            754.481898
          ],
          [
            -926.584071,
            929.855044
          ],
          [
            -1383.550562,
            1199.811461
          ],
          [
            -2177.969231,
            1669.120308
          ]
        ],
        "floor_poly": [
          [
            -2948.314607,
            1683.047416
          ],
          [
            -2159.00885,
            1437.324071
          ],
          [
            -1646.248175,
            1277.693577
          ],
          [
            -1286.360248,
            1165.654783
          ],
          [
            -1019.848649,
            1082.685514
          ],
          [
            -814.545455,
            1018.771388
          ],
          [
            -651.536481,
            968.02412
          ],
          [
            -518.972763,
            926.754942
          ],
          [
            -409.053381,
            892.535302
          ],
          [
            -316.432787,
            863.701049
          ],
          [
            -237.325228,
            839.073617
          ],
          [
            -168.974504,
            817.794958
          ],
          [
            -109.32626,
            799.225517
          ],
          [
            -56.817955,
            782.878853
          ],
          [
            -10.24,
            768.3784
          ],
          [
            317.44,
            768.3784
          ],
          [
            290.473815,
            782.878853
          ],
          [
            260.074271,
            799.225517
          ],
          [
            225.541076,
            817.794958
          ],
          [
            185.969605,
            839.073617
          ],
          [
            140.170492,
            863.701049
          ],
          [
            86.548043,
            892.535302
          ],
          [
            22.910506,
            926.754942
          ],
          [
            -53.83691,
            968.02412
          ],
          [
            -148.210526,
            1018.771388
          ],
          [
            -267.07027,
            1082.685514
          ],
          [
            -421.36646,
            1165.654783
          ],
          [
            -629.722628,
            1277.693577
          ],
          [
            -926.584071,
            1437.324071
          ],
          [
            -1383.550562,
            1683.047416
          ]
        ],
        "well_poly": [
          [
            -2159.00885,
            -719.419292
          ],
          [
            -1646.248175,
            -501.226131
          ],
          [
            -1286.360248,
            -348.084348
          ],
          [
            -1019.848649,
            -234.676649
          ],
          [
            -814.545455,
            -147.314737
          ],
          [
            -651.536481,
            -77.950129
          ],
          [
            -518.972763,
            -21.540778
          ],
          [
            -409.053381,
            25.232811
          ],
          [
            -316.432787,
            64.645311
          ],
          [
            -237.325228,
            98.30766
          ],
          [
            -168.974504,
            127.392691
          ],
          [
            -109.32626,
            152.774589
          ],
          [
            -56.817955,
            175.118254
          ],
          [
            -10.24,
            194.9384
          ],
          [
            317.44,
            194.9384
          ],
          [
            290.473815,
            175.118254
          ],
          [
            260.074271,
            152.774589
          ],
          [
            225.541076,
            127.392691
          ],
          [
            185.969605,
            98.30766
          ],
          [
            140.170492,
            64.645311
          ],
          [
            86.548043,
            25.232811
          ],
          [
            22.910506,
            -21.540778
          ],
          [
            -53.83691,
            -77.950129
          ],
          [
            -148.210526,
            -147.314737
          ],
          [
            -267.07027,
            -234.676649
          ],
          [
            -421.36646,
            -348.084348
          ],
          [
            -629.722628,
            -501.226131
          ],
          [
            -926.584071,
            -719.419292
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "great_stair_hall/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 329.69696969696963,
    "corner_x1_px": 1206.3030303030305,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op04",
        "kind": "door",
        "via": null,
        "x": 671.030303030303,
        "y": 399.3412121212122,
        "w": 155.15151515151524,
        "h": 310.3030303030303,
        "beyond_m": 15.2,
        "beyond_offset_m": -2.875
      }
    ],
    "stairs": []
  },
  "great_stair_hall/S": {
    "floor_line_y": 0.74126953125,
    "px_per_m_at_wall": 196.9230769230769,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 196.9230769230769,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -98.46153846153845,
    "corner_x1_px": 1634.4615384615386,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.2,
    "openings": [
      {
        "id": "op06",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 365.21384615384613,
        "w": 196.9230769230769,
        "h": 393.8461538461538,
        "beyond_m": 7.95,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "great_stair_hall/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 329.69696969696963,
    "corner_x1_px": 1206.3030303030305,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "guest_chamber/N": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 17.066666666666606,
    "corner_x1_px": 1518.9333333333334,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op20",
        "kind": "door",
        "via": null,
        "x": 597.3333333333333,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 3.9,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "guest_chamber/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 267.6363636363636,
    "corner_x1_px": 1268.3636363636365,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "guest_chamber/S": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 17.066666666666606,
    "corner_x1_px": 1518.9333333333334,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op19",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 6,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "guest_chamber/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 267.6363636363636,
    "corner_x1_px": 1268.3636363636365,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "hall/N": {
    "floor_line_y": 1.0640020893895348,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 476.27906976744185,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1137.1162790697674,
    "corner_x1_px": 2673.116279069767,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op15",
        "kind": "door",
        "via": null,
        "x": 1482.4186046511627,
        "y": 136.9799999999999,
        "w": 476.279069767442,
        "h": 952.5581395348837,
        "beyond_m": 5.3,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "hall/E": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 2.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 546.1333333333333,
    "corner_x1_px": 989.8666666666667,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [],
    "stairs": []
  },
  "hall/S": {
    "floor_line_y": 1.0640020893895348,
    "px_per_m_at_wall": 476.27906976744185,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 476.27906976744185,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1137.1162790697674,
    "corner_x1_px": 2673.116279069767,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "openings": [
      {
        "id": "op14",
        "kind": "door",
        "via": null,
        "x": 1720.5581395348836,
        "y": 136.9799999999999,
        "w": 476.2790697674418,
        "h": 952.5581395348837,
        "beyond_m": 9,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "hall/W": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 2.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 2.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 546.1333333333333,
    "corner_x1_px": 989.8666666666667,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op13",
        "kind": "door",
        "via": "door1",
        "x": 682.6666666666666,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 6.05,
        "beyond_offset_m": 1.1
      }
    ],
    "stairs": []
  },
  "kitchen/N": {
    "floor_line_y": 0.6960499626829738,
    "px_per_m_at_wall": 157.78120184899845,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 157.78120184899845,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 136.8751926040062,
    "corner_x1_px": 1399.1248073959937,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.49,
    "openings": [
      {
        "id": "op14",
        "kind": "door",
        "via": null,
        "x": 294.6563944530046,
        "y": 397.1927580893683,
        "w": 157.78120184899848,
        "h": 315.5624036979969,
        "beyond_m": 2.95,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "kitchen/E": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 29.866666666666674,
    "corner_x1_px": 1506.1333333333332,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [],
    "stairs": []
  },
  "kitchen/S": {
    "floor_line_y": 0.6960499626829738,
    "px_per_m_at_wall": 157.78120184899845,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 157.78120184899845,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 136.8751926040062,
    "corner_x1_px": 1399.1248073959937,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.49,
    "openings": [],
    "stairs": []
  },
  "kitchen/W": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 29.866666666666674,
    "corner_x1_px": 1506.1333333333332,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op02",
        "kind": "door",
        "via": null,
        "x": 610.1333333333333,
        "y": 386.6653333333333,
        "w": 170.66666666666663,
        "h": 341.3333333333333,
        "beyond_m": 21,
        "beyond_offset_m": -0.425
      }
    ],
    "stairs": []
  },
  "library/N": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 17.066666666666606,
    "corner_x1_px": 1518.9333333333334,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op08",
        "kind": "door",
        "via": null,
        "x": 597.3333333333333,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 3.9,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "library/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 267.6363636363636,
    "corner_x1_px": 1268.3636363636365,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op05",
        "kind": "door",
        "via": null,
        "x": 888.2424242424242,
        "y": 399.3412121212122,
        "w": 155.151515151515,
        "h": 310.3030303030303,
        "beyond_m": 15.2,
        "beyond_offset_m": 3.525
      }
    ],
    "stairs": []
  },
  "library/S": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 17.066666666666606,
    "corner_x1_px": 1518.9333333333334,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op07",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 6,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "library/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 6.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 267.6363636363636,
    "corner_x1_px": 1268.3636363636365,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "long_gallery/N": {
    "floor_line_y": 0.5786981810853458,
    "px_per_m_at_wall": 56.2019758507135,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 56.2019758507135,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 543.192096597146,
    "corner_x1_px": 992.807903402854,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 18.22,
    "openings": [],
    "stairs": []
  },
  "long_gallery/E": {
    "floor_line_y": 0.6704582729718543,
    "px_per_m_at_wall": 135.6291390728477,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 24.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 135.6291390728477,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 24.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -879.8940397350996,
    "corner_x1_px": 2415.8940397351,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 7.55,
    "openings": [],
    "stairs": []
  },
  "long_gallery/S": {
    "floor_line_y": 0.5786981810853458,
    "px_per_m_at_wall": 56.2019758507135,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 56.2019758507135,
    "facing_type": "corridor",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 543.192096597146,
    "corner_x1_px": 992.807903402854,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 18.22,
    "openings": [],
    "stairs": []
  },
  "long_gallery/W": {
    "floor_line_y": 0.6704582729718543,
    "px_per_m_at_wall": 135.6291390728477,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 24.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 135.6291390728477,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 24.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -879.8940397350996,
    "corner_x1_px": 2415.8940397351,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 7.55,
    "openings": [
      {
        "id": "op25",
        "kind": "door",
        "via": null,
        "x": 530.6490066225165,
        "y": 415.29099337748346,
        "w": 135.6291390728477,
        "h": 271.2582781456954,
        "beyond_m": 6.05,
        "beyond_offset_m": -0.75
      },
      {
        "id": "op24",
        "kind": "door",
        "via": null,
        "x": 1208.7947019867552,
        "y": 415.29099337748346,
        "w": 135.62913907284747,
        "h": 271.2582781456954,
        "beyond_m": 6.05,
        "beyond_offset_m": 4.075
      }
    ],
    "stairs": []
  },
  "master_bedchamber/N": {
    "floor_line_y": 0.6792240767045454,
    "px_per_m_at_wall": 143.2167832167832,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 143.2167832167832,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 137.84615384615392,
    "corner_x1_px": 1398.1538461538462,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 7.15,
    "openings": [
      {
        "id": "op18",
        "kind": "door",
        "via": null,
        "x": 624.7832167832167,
        "y": 409.0918881118881,
        "w": 143.21678321678326,
        "h": 286.4335664335664,
        "beyond_m": 6,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "master_bedchamber/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 178.42424242424238,
    "corner_x1_px": 1357.5757575757575,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "master_bedchamber/S": {
    "floor_line_y": 0.6792240767045454,
    "px_per_m_at_wall": 143.2167832167832,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 143.2167832167832,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 137.84615384615392,
    "corner_x1_px": 1398.1538461538462,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 7.15,
    "openings": [],
    "stairs": []
  },
  "master_bedchamber/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 178.42424242424238,
    "corner_x1_px": 1357.5757575757575,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "muniment_room/N": {
    "floor_line_y": 0.7857235542385058,
    "px_per_m_at_wall": 235.40229885057474,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 235.40229885057474,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 126.52873563218384,
    "corner_x1_px": 1409.4712643678163,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.35,
    "openings": [],
    "stairs": []
  },
  "muniment_room/E": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 167.11980440097796,
    "corner_x1_px": 1368.880195599022,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op25",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": -0.75
      }
    ],
    "stairs": []
  },
  "muniment_room/S": {
    "floor_line_y": 0.8210422585227273,
    "px_per_m_at_wall": 265.97402597402595,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 265.97402597402595,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 43.220779220779264,
    "corner_x1_px": 1492.7792207792209,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 3.85,
    "openings": [],
    "stairs": []
  },
  "muniment_room/W": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 167.11980440097796,
    "corner_x1_px": 1368.880195599022,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op22",
        "kind": "door",
        "via": null,
        "x": 517.6332518337408,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 14.95,
        "beyond_offset_m": 2.25
      }
    ],
    "stairs": []
  },
  "privy_garden/N": {
    "floor_line_y": 0.7457303155637256,
    "px_per_m_at_wall": 200.78431372549022,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 200.78431372549022,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 20.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1280,
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.1,
    "openings": [],
    "stairs": []
  },
  "privy_garden/E": {
    "floor_line_y": 0.5910897926879085,
    "px_per_m_at_wall": 66.9281045751634,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 66.9281045751634,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 582.2745098039215,
    "corner_x1_px": 953.7254901960785,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 15.3,
    "openings": [
      {
        "id": "op17",
        "kind": "door",
        "via": null,
        "x": 786.4052287581699,
        "y": 471.41973856209154,
        "w": 66.9281045751635,
        "h": 133.8562091503268,
        "beyond_m": 8.6,
        "beyond_offset_m": 0.9
      }
    ],
    "stairs": []
  },
  "privy_garden/S": {
    "floor_line_y": 0.7457303155637256,
    "px_per_m_at_wall": 200.78431372549022,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 20.4,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 200.78431372549022,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 20.4,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -1280,
    "corner_x1_px": 2816,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.1,
    "openings": [
      {
        "id": "op10",
        "kind": "door",
        "via": null,
        "x": 185.72549019607845,
        "y": 362.05921568627457,
        "w": 321.25490196078454,
        "h": 401.56862745098044,
        "beyond_m": 9.9,
        "beyond_offset_m": 2.9
      }
    ],
    "stairs": []
  },
  "privy_garden/W": {
    "floor_line_y": 0.5910897926879085,
    "px_per_m_at_wall": 66.9281045751634,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.55,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 66.9281045751634,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.55,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 582.2745098039215,
    "corner_x1_px": 953.7254901960785,
    "focal_px": 1024,
    "storey_height_m": null,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 15.3,
    "openings": [
      {
        "id": "op09",
        "kind": "door",
        "via": null,
        "x": 783.0588235294118,
        "y": 471.41973856209154,
        "w": 66.92810457516339,
        "h": 133.8562091503268,
        "beyond_m": 9.4,
        "beyond_offset_m": 0.85
      }
    ],
    "stairs": []
  },
  "servants_hall/N": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 147.39393939393938,
    "corner_x1_px": 1388.6060606060605,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "servants_hall/E": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.05,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.05,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 166.4000000000001,
    "corner_x1_px": 1369.6,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [],
    "stairs": []
  },
  "servants_hall/S": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 147.39393939393938,
    "corner_x1_px": 1388.6060606060605,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op16",
        "kind": "door",
        "via": null,
        "x": 690.4242424242424,
        "y": 399.3412121212122,
        "w": 155.15151515151524,
        "h": 310.3030303030303,
        "beyond_m": 5.3,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "servants_hall/W": {
    "floor_line_y": 0.7109361979166666,
    "px_per_m_at_wall": 170.66666666666666,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 7.05,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 170.66666666666666,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.05,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 166.4000000000001,
    "corner_x1_px": 1369.6,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6,
    "openings": [
      {
        "id": "op12",
        "kind": "door",
        "via": null,
        "x": 192.0000000000001,
        "y": 386.6653333333333,
        "w": 136.53333333333325,
        "h": 341.3333333333333,
        "beyond_m": 6.05,
        "beyond_offset_m": -4.55
      },
      {
        "id": "op17",
        "kind": "door",
        "via": null,
        "x": 704,
        "y": 386.6653333333333,
        "w": 170.66666666666674,
        "h": 341.3333333333333,
        "beyond_m": 21,
        "beyond_offset_m": 0.9
      }
    ],
    "stairs": []
  },
  "solar/N": {
    "floor_line_y": 0.6474418476341808,
    "px_per_m_at_wall": 115.70621468926554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 14.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 115.70621468926554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -76.65536723163837,
    "corner_x1_px": 1612.6553672316384,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 8.85,
    "openings": [],
    "stairs": []
  },
  "solar/E": {
    "floor_line_y": 0.6218060609303653,
    "px_per_m_at_wall": 93.51598173515983,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 93.51598173515983,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 333.15068493150676,
    "corner_x1_px": 1202.8493150684933,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 10.95,
    "openings": [
      {
        "id": "op23",
        "kind": "door",
        "via": null,
        "x": 510.83105022831046,
        "y": 449.6974429223744,
        "w": 93.51598173515981,
        "h": 187.03196347031965,
        "beyond_m": 5.8,
        "beyond_offset_m": -2.575
      },
      {
        "id": "op22",
        "kind": "door",
        "via": null,
        "x": 978.4109589041096,
        "y": 449.6974429223744,
        "w": 93.51598173515993,
        "h": 187.03196347031965,
        "beyond_m": 5.8,
        "beyond_offset_m": 2.25
      }
    ],
    "stairs": []
  },
  "solar/S": {
    "floor_line_y": 0.6474418476341808,
    "px_per_m_at_wall": 115.70621468926554,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 14.6,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 115.70621468926554,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -76.65536723163837,
    "corner_x1_px": 1612.6553672316384,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 8.85,
    "openings": [],
    "stairs": []
  },
  "solar/W": {
    "floor_line_y": 0.6218060609303653,
    "px_per_m_at_wall": 93.51598173515983,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 9.3,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 93.51598173515983,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 333.15068493150676,
    "corner_x1_px": 1202.8493150684933,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 10.95,
    "openings": [
      {
        "id": "op21",
        "kind": "door",
        "via": null,
        "x": 464.0730593607305,
        "y": 449.6974429223744,
        "w": 93.51598173515987,
        "h": 187.03196347031965,
        "beyond_m": 9.4,
        "beyond_offset_m": -2.875
      }
    ],
    "stairs": []
  },
  "stair_landing/N": {
    "floor_line_y": 0.74126953125,
    "px_per_m_at_wall": 196.9230769230769,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 196.9230769230769,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -98.46153846153845,
    "corner_x1_px": 1634.4615384615386,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.2,
    "openings": [
      {
        "id": "op19",
        "kind": "door",
        "via": null,
        "x": 571.076923076923,
        "y": 365.21384615384613,
        "w": 196.92307692307702,
        "h": 393.8461538461538,
        "beyond_m": 6.8,
        "beyond_offset_m": 0
      }
    ],
    "stairs": []
  },
  "stair_landing/E": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 329.69696969696963,
    "corner_x1_px": 1206.3030303030305,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [
      {
        "id": "op21",
        "kind": "door",
        "via": null,
        "x": 671.030303030303,
        "y": 399.3412121212122,
        "w": 155.15151515151524,
        "h": 310.3030303030303,
        "beyond_m": 15.2,
        "beyond_offset_m": -2.875
      }
    ],
    "stairs": []
  },
  "stair_landing/S": {
    "floor_line_y": 0.74126953125,
    "px_per_m_at_wall": 196.9230769230769,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 8.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 196.9230769230769,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": -98.46153846153845,
    "corner_x1_px": 1634.4615384615386,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 5.2,
    "openings": [
      {
        "id": "op18",
        "kind": "door",
        "via": null,
        "x": 768,
        "y": 365.21384615384613,
        "w": 196.9230769230769,
        "h": 393.8461538461538,
        "beyond_m": 7.95,
        "beyond_offset_m": 0
      }
    ],
    "stairs": [
      {
        "id": "great_stair",
        "kind": "stair",
        "via": null,
        "direction": "down",
        "treads": 17,
        "rise_m": 2.8,
        "u0": 0.75,
        "u1": 0.931818,
        "depth_near_m": 5.45,
        "depth_far_m": 0.65,
        "x": 1263.1208791208792,
        "y": 792.3399999999999,
        "w": 272.8791208791208,
        "h": 231.66000000000008,
        "poly": [
          [
            3329.712375,
            1903.602609
          ],
          [
            2707.118987,
            1568.817165
          ],
          [
            2327.983707,
            1364.945784
          ],
          [
            2072.858603,
            1227.758058
          ],
          [
            1889.452416,
            1129.135549
          ],
          [
            1751.250321,
            1054.820513
          ],
          [
            1643.373714,
            996.81232
          ],
          [
            1556.828012,
            950.274336
          ],
          [
            1485.85567,
            912.110572
          ],
          [
            1426.600172,
            880.247274
          ],
          [
            1376.381255,
            853.243193
          ],
          [
            1333.278229,
            830.06552
          ],
          [
            1295.878704,
            809.954776
          ],
          [
            1263.120879,
            792.34
          ],
          [
            1623.208791,
            792.34
          ],
          [
            1679.790489,
            809.954776
          ],
          [
            1744.389668,
            830.06552
          ],
          [
            1818.840349,
            853.243193
          ],
          [
            1905.582115,
            880.247274
          ],
          [
            2007.932521,
            912.110572
          ],
          [
            2130.521112,
            950.274336
          ],
          [
            2280.009143,
            996.81232
          ],
          [
            2466.341463,
            1054.820513
          ],
          [
            2705.054173,
            1129.135549
          ],
          [
            3021.846678,
            1227.758058
          ],
          [
            3462.517312,
            1364.945784
          ],
          [
            4117.387342,
            1568.817165
          ],
          [
            5192.77592,
            1903.602609
          ]
        ],
        "floor_poly": [
          [
            3329.712375,
            1903.602609
          ],
          [
            2707.118987,
            1568.817165
          ],
          [
            2327.983707,
            1364.945784
          ],
          [
            2072.858603,
            1227.758058
          ],
          [
            1889.452416,
            1129.135549
          ],
          [
            1751.250321,
            1054.820513
          ],
          [
            1643.373714,
            996.81232
          ],
          [
            1556.828012,
            950.274336
          ],
          [
            1485.85567,
            912.110572
          ],
          [
            1426.600172,
            880.247274
          ],
          [
            1376.381255,
            853.243193
          ],
          [
            1333.278229,
            830.06552
          ],
          [
            1295.878704,
            809.954776
          ],
          [
            1263.120879,
            792.34
          ],
          [
            1623.208791,
            792.34
          ],
          [
            1679.790489,
            809.954776
          ],
          [
            1744.389668,
            830.06552
          ],
          [
            1818.840349,
            853.243193
          ],
          [
            1905.582115,
            880.247274
          ],
          [
            2007.932521,
            912.110572
          ],
          [
            2130.521112,
            950.274336
          ],
          [
            2280.009143,
            996.81232
          ],
          [
            2466.341463,
            1054.820513
          ],
          [
            2705.054173,
            1129.135549
          ],
          [
            3021.846678,
            1227.758058
          ],
          [
            3462.517312,
            1364.945784
          ],
          [
            4117.387342,
            1568.817165
          ],
          [
            5192.77592,
            1903.602609
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "stair_landing/W": {
    "floor_line_y": 0.6930119554924243,
    "px_per_m_at_wall": 155.15151515151516,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.65,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 155.15151515151516,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 329.69696969696963,
    "corner_x1_px": 1206.3030303030305,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 6.6,
    "openings": [],
    "stairs": []
  },
  "study/N": {
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 188.421,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.45,
    "key_tint": "#c8986f",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "R-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own prompt declares it as the measurement anchor",
    "calibration_px": 179,
    "camera_wall_m": 4.35,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 188,
    "corner_x1_px": 1351,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/study-N/cand-5-reference.png",
    "measured_round": "cand5ref",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 819.6,
    "nearest_floor_m": 1.9474,
    "measured_room": {
      "storey_height_m": 3.349,
      "wall_width_m": 6.172,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            565.4,
            980
          ],
          "plan_centre_px": 772.7,
          "painted_px": [
            379,
            550
          ],
          "painted_centre_px": 464.5,
          "centre_delta_px": -308.2,
          "centre_delta_m": -1.636,
          "painted_feature": "the fireplace OPENING (the plan holds the whole breast, which is wider)"
        }
      ]
    },
    "openings": []
  },
  "study/E": {
    "floor_line_y": 0.803011585039731,
    "px_per_m_at_wall": 250.36674816625919,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 4.8,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 250.36674816625919,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 167.11980440097796,
    "corner_x1_px": 1368.880195599022,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 4.09,
    "openings": [
      {
        "id": "op13",
        "kind": "door",
        "via": "door1",
        "x": 918.2200488997555,
        "y": 321.5503667481662,
        "w": 250.36674816625919,
        "h": 500.73349633251837,
        "beyond_m": 8.6,
        "beyond_offset_m": 1.1
      }
    ],
    "stairs": []
  },
  "study/S": {
    "floor_line_y": 0.8210422585227273,
    "px_per_m_at_wall": 265.97402597402595,
    "px_per_m_at_bottom": 420.8791208791208,
    "wall_width_m": 5.45,
    "key_tint": "#c8b489",
    "image_h_px": 1024,
    "horizon_y": 0.51376953125,
    "key_dir": "UL",
    "calibration_ref": "wall grid module, 1.0 m at the wall plane",
    "calibration_px": 265.97402597402595,
    "facing_type": "enclosed",
    "camera_id": "grid",
    "provisional": true,
    "backdrop": "wall",
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "wall_continuous": true,
    "corner_x0_px": 43.220779220779264,
    "corner_x1_px": 1492.7792207792209,
    "focal_px": 1023.9999999999999,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.4330026109660574,
    "camera_wall_m": 3.85,
    "openings": [],
    "stairs": []
  },
  "study/W": {
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 192.632,
    "px_per_m_at_bottom": 432.01,
    "wall_width_m": 4.8,
    "key_tint": "#c89b72",
    "image_h_px": 1024,
    "horizon_y": 0.515332,
    "key_dir": "R-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own prompt declares it as the measurement anchor",
    "calibration_px": 183,
    "camera_wall_m": 4.09,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 186,
    "corner_x1_px": 1351,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/study-W/cand-6.png",
    "measured_round": "cand6",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 787.9,
    "nearest_floor_m": 1.8237,
    "measured_room": {
      "storey_height_m": 3.271,
      "wall_width_m": 6.048,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.8,
      "carriers": []
    },
    "openings": []
  }
}
};
