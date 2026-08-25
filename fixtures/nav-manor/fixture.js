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
  fp: "178cbb61",
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
          "id": "door_hall_kitchen",
          "from": "hall",
          "facing": "S",
          "to": "kitchen",
          "arrive_facing": "S",
          "via": "op14"
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
    "go.door_back_stair_great_hall.arrive": "Out of the back stair, you come into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.",
    "go.door_back_stair_great_hall.refused_unreachable": "The way from the back stair into the great hall is not before you.",
    "go.door_back_stair_head_long_gallery.arrive": "You leave the back stair head and come into the long gallery. The gallery runs off further than a room has any right to, and your steps run off with it. The doorway stands open behind you.",
    "go.door_back_stair_head_long_gallery.refused_unreachable": "No passage from the back stair head to the long gallery stands where you are looking.",
    "go.door_back_stair_head_solar.arrive": "The back stair head gives onto the solar, and you step through into it. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.",
    "go.door_back_stair_head_solar.refused_unreachable": "The back stair head does not open into the solar from here.",
    "go.door_back_stair_servants_hall.arrive": "You pass from the back stair into the servants' hall. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.",
    "go.door_back_stair_servants_hall.refused_unreachable": "That way — the back stair to the servants' hall — lies elsewhere in the house.",
    "go.door_buttery_pantry_hall.arrive": "You cross out of the buttery and pantry and into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_buttery_pantry_hall.refused_unreachable": "You are not at the passage between the buttery and pantry and the cross passage.",
    "go.door_buttery_pantry_servants_hall.arrive": "The buttery and pantry lets you go, and the servants' hall takes you. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.",
    "go.door_buttery_pantry_servants_hall.refused_unreachable": "The door between the buttery and pantry and the servants' hall is not the one before you.",
    "go.door_closet_chamber_guest_chamber.arrive": "Out of the closet chamber, you come into the guest chamber. Made ready and not lived in; nothing here has been disturbed. The doorway stands open behind you.",
    "go.door_closet_chamber_guest_chamber.refused_unreachable": "The way from the closet chamber into the guest chamber is not before you.",
    "go.door_dining_parlour_entrance_court.arrive": "You leave the dining parlour and come into the entrance court. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.",
    "go.door_dining_parlour_entrance_court.refused_unreachable": "No passage from the dining parlour to the entrance court stands where you are looking.",
    "go.door_dining_parlour_great_stair_hall.arrive": "The dining parlour gives onto the great stair hall, and you step through into it. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.",
    "go.door_dining_parlour_great_stair_hall.refused_unreachable": "The dining parlour does not open into the great stair hall from here.",
    "go.door_entrance_court_dining_parlour.arrive": "You pass from the entrance court into the dining parlour. A room kept for company, and the air in it is still. The doorway stands open behind you.",
    "go.door_entrance_court_dining_parlour.refused_unreachable": "That way — the entrance court to the dining parlour — lies elsewhere in the house.",
    "go.door_entrance_court_great_hall.arrive": "You cross out of the entrance court and into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.",
    "go.door_entrance_court_great_hall.refused_unreachable": "You are not at the passage between the entrance court and the great hall.",
    "go.door_entrance_court_kitchen.arrive": "The entrance court lets you go, and the kitchen takes you. Ash and cold fat hang in the air, and everything here is built for work. The doorway stands open behind you.",
    "go.door_entrance_court_kitchen.refused_unreachable": "The door between the entrance court and the kitchen is not the one before you.",
    "go.door_garden_room_library.arrive": "Out of the garden room, you come into the library. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_garden_room_library.refused_unreachable": "The way from the garden room into the library is not before you.",
    "go.door_garden_room_privy_garden.arrive": "You leave the garden room and come into the privy garden. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.",
    "go.door_garden_room_privy_garden.refused_unreachable": "No passage from the garden room to the privy garden stands where you are looking.",
    "go.door_great_hall_back_stair.arrive": "The great hall gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.",
    "go.door_great_hall_back_stair.refused_unreachable": "The great hall does not open into the back stair from here.",
    "go.door_great_hall_entrance_court.arrive": "You pass from the great hall into the entrance court. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.",
    "go.door_great_hall_entrance_court.refused_unreachable": "That way — the great hall to the entrance court — lies elsewhere in the house.",
    "go.door_great_hall_great_stair_hall.arrive": "You cross out of the great hall and into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.",
    "go.door_great_hall_great_stair_hall.refused_unreachable": "You are not at the passage between the great hall and the great stair hall.",
    "go.door_great_hall_library.arrive": "The great hall lets you go, and the library takes you. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_great_hall_library.refused_unreachable": "The door between the great hall and the library is not the one before you.",
    "go.door_great_hall_privy_garden.arrive": "Out of the great hall, you come into the privy garden. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.",
    "go.door_great_hall_privy_garden.refused_unreachable": "The way from the great hall into the privy garden is not before you.",
    "go.door_great_stair_hall_dining_parlour.arrive": "You leave the great stair hall and come into the dining parlour. A room kept for company, and the air in it is still. The doorway stands open behind you.",
    "go.door_great_stair_hall_dining_parlour.refused_unreachable": "No passage from the great stair hall to the dining parlour stands where you are looking.",
    "go.door_great_stair_hall_great_hall.arrive": "The great stair hall gives onto the great hall, and you step through into it. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.",
    "go.door_great_stair_hall_great_hall.refused_unreachable": "The great stair hall does not open into the great hall from here.",
    "go.door_great_stair_hall_library.arrive": "You pass from the great stair hall into the library. Paper and leather in the air, and a stillness that seems to be listening. The doorway stands open behind you.",
    "go.door_great_stair_hall_library.refused_unreachable": "That way — the great stair hall to the library — lies elsewhere in the house.",
    "go.door_guest_chamber_closet_chamber.arrive": "You cross out of the guest chamber and into the closet chamber. A small close room off the chamber, for prayer or for nothing. The doorway stands open behind you.",
    "go.door_guest_chamber_closet_chamber.refused_unreachable": "You are not at the passage between the guest chamber and the closet chamber.",
    "go.door_guest_chamber_stair_landing.arrive": "The guest chamber lets you go, and the stair landing takes you. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_guest_chamber_stair_landing.refused_unreachable": "The door between the guest chamber and the stair landing is not the one before you.",
    "go.door_hall_buttery_pantry.arrive": "Out of the cross passage, you come into the buttery and pantry. Cool and close, and it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.",
    "go.door_hall_buttery_pantry.refused_unreachable": "The way from the cross passage into the buttery and pantry is not before you.",
    "go.door_hall_kitchen.arrive": "You turn out of the cross passage and the kitchen takes you in. Its heat reaches the doorway before you do, and under the heat is ash and scoured board. The doorway stands open behind you.",
    "go.door_hall_kitchen.refused_unreachable": "The passage's own door into the kitchen is not the one before you.",
    "go.door_hall_study.arrive": "You pass back into the study, where ink and oak dust close about you again. The doorway stands open behind you.",
    "go.door_hall_study.refused_unreachable": "The way to the study is not before you; you must come to it first.",
    "go.door_kitchen_entrance_court.arrive": "The kitchen gives onto the entrance court, and you step through into it. The air moves here, and the house stands back from you on every side but one. The doorway stands open behind you.",
    "go.door_kitchen_entrance_court.refused_unreachable": "The kitchen does not open into the entrance court from here.",
    "go.door_kitchen_hall.arrive": "You come out of the kitchen into the cross passage. The air is cooler here, and moves, and the passage runs away east and west. The doorway stands open behind you.",
    "go.door_kitchen_hall.refused_unreachable": "That way — the kitchen to the cross passage — lies elsewhere in the house.",
    "go.door_library_garden_room.arrive": "You cross out of the library and into the garden room. The floor is flagged and cool, and the garden is a step away. The doorway stands open behind you.",
    "go.door_library_garden_room.refused_unreachable": "You are not at the passage between the library and the garden room.",
    "go.door_library_great_hall.arrive": "The library lets you go, and the great hall takes you. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.",
    "go.door_library_great_hall.refused_unreachable": "The door between the library and the great hall is not the one before you.",
    "go.door_library_great_stair_hall.arrive": "Out of the library, you come into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The doorway stands open behind you.",
    "go.door_library_great_stair_hall.refused_unreachable": "The way from the library into the great stair hall is not before you.",
    "go.door_long_gallery_back_stair_head.arrive": "You leave the long gallery and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.",
    "go.door_long_gallery_back_stair_head.refused_unreachable": "No passage from the long gallery to the back stair head stands where you are looking.",
    "go.door_long_gallery_muniment_room.arrive": "The long gallery gives onto the muniment room, and you step through into it. Deeds and dust, and a silence kept on purpose. The doorway stands open behind you.",
    "go.door_long_gallery_muniment_room.refused_unreachable": "The long gallery does not open into the muniment room from here.",
    "go.door_master_bedchamber_stair_landing.arrive": "You pass from the master bedchamber into the stair landing. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_master_bedchamber_stair_landing.refused_unreachable": "That way — the master bedchamber to the stair landing — lies elsewhere in the house.",
    "go.door_muniment_room_long_gallery.arrive": "You cross out of the muniment room and into the long gallery. The gallery runs off further than a room has any right to, and your steps run off with it. The doorway stands open behind you.",
    "go.door_muniment_room_long_gallery.refused_unreachable": "You are not at the passage between the muniment room and the long gallery.",
    "go.door_muniment_room_solar.arrive": "The muniment room lets you go, and the solar takes you. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.",
    "go.door_muniment_room_solar.refused_unreachable": "The door between the muniment room and the solar is not the one before you.",
    "go.door_privy_garden_garden_room.arrive": "Out of the privy garden, you come into the garden room. The floor is flagged and cool, and the garden is a step away. The doorway stands open behind you.",
    "go.door_privy_garden_garden_room.refused_unreachable": "The way from the privy garden into the garden room is not before you.",
    "go.door_privy_garden_great_hall.arrive": "You leave the privy garden and come into the great hall. The floor rings under you, and the room runs on further than a voice would carry. The doorway stands open behind you.",
    "go.door_privy_garden_great_hall.refused_unreachable": "No passage from the privy garden to the great hall stands where you are looking.",
    "go.door_privy_garden_servants_hall.arrive": "The privy garden gives onto the servants' hall, and you step through into it. Low and plain, with the day's work sounding somewhere beyond it. The doorway stands open behind you.",
    "go.door_privy_garden_servants_hall.refused_unreachable": "The privy garden does not open into the servants' hall from here.",
    "go.door_servants_hall_back_stair.arrive": "You pass from the servants' hall into the back stair. The walls draw close, plastered and plain, and the air smells of tallow. The doorway stands open behind you.",
    "go.door_servants_hall_back_stair.refused_unreachable": "That way — the servants' hall to the back stair — lies elsewhere in the house.",
    "go.door_servants_hall_buttery_pantry.arrive": "You cross out of the servants' hall and into the buttery and pantry. Cool and close, and it keeps the sour-sweet breath of ale and stored things. The doorway stands open behind you.",
    "go.door_servants_hall_buttery_pantry.refused_unreachable": "You are not at the passage between the servants' hall and the buttery and pantry.",
    "go.door_servants_hall_privy_garden.arrive": "The servants' hall lets you go, and the privy garden takes you. Walled close against the world, and quiet enough to hear yourself in. The doorway stands open behind you.",
    "go.door_servants_hall_privy_garden.refused_unreachable": "The door between the servants' hall and the privy garden is not the one before you.",
    "go.door_solar_back_stair_head.arrive": "Out of the solar, you come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The doorway stands open behind you.",
    "go.door_solar_back_stair_head.refused_unreachable": "The way from the solar into the back stair head is not before you.",
    "go.door_solar_muniment_room.arrive": "You leave the solar and come into the muniment room. Deeds and dust, and a silence kept on purpose. The doorway stands open behind you.",
    "go.door_solar_muniment_room.refused_unreachable": "No passage from the solar to the muniment room stands where you are looking.",
    "go.door_solar_stair_landing.arrive": "The solar gives onto the stair landing, and you step through into it. The stair-head, and the house below sounding faintly up the well. The doorway stands open behind you.",
    "go.door_solar_stair_landing.refused_unreachable": "The solar does not open into the stair landing from here.",
    "go.door_stair_landing_guest_chamber.arrive": "You pass from the stair landing into the guest chamber. Made ready and not lived in; nothing here has been disturbed. The doorway stands open behind you.",
    "go.door_stair_landing_guest_chamber.refused_unreachable": "That way — the stair landing to the guest chamber — lies elsewhere in the house.",
    "go.door_stair_landing_master_bedchamber.arrive": "You cross out of the stair landing and into the master bedchamber. The hush that sleeps in a room by day, and a floor that does not creak. The doorway stands open behind you.",
    "go.door_stair_landing_master_bedchamber.refused_unreachable": "You are not at the passage between the stair landing and the master bedchamber.",
    "go.door_stair_landing_solar.arrive": "The stair landing lets you go, and the solar takes you. The great chamber over the hall, and it runs away from you further than it should. The doorway stands open behind you.",
    "go.door_stair_landing_solar.refused_unreachable": "The door between the stair landing and the solar is not the one before you.",
    "go.door_study_hall.arrive": "You step through into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.",
    "go.door_study_hall.refused_unreachable": "The way to the cross passage does not open from where you stand.",
    "go.stair_back_stair_back_stair_head.arrive": "You leave the back stair and come into the back stair head. A landing barely wide enough to turn in, with the flight dropping away. The stair falls away behind you.",
    "go.stair_back_stair_back_stair_head.refused_unreachable": "The stair from the back stair up to the back stair head is not before you.",
    "go.stair_back_stair_head_back_stair.arrive": "The back stair head gives onto the back stair, and you step through into it. The walls draw close, plastered and plain, and the air smells of tallow. The stair rises behind you.",
    "go.stair_back_stair_head_back_stair.refused_unreachable": "The stair from the back stair head down to the back stair is not before you.",
    "go.stair_great_stair_hall_stair_landing.arrive": "You pass from the great stair hall into the stair landing. The stair-head, and the house below sounding faintly up the well. The stair falls away behind you.",
    "go.stair_great_stair_hall_stair_landing.refused_unreachable": "The stair from the great stair hall up to the stair landing is not before you.",
    "go.stair_stair_landing_great_stair_hall.arrive": "You cross out of the stair landing and into the great stair hall. The stair goes up out of the dark, and your voice goes up with it. The stair rises behind you.",
    "go.stair_stair_landing_great_stair_hall.refused_unreachable": "The stair from the stair landing down to the great stair hall is not before you.",
    "go.way_entrance_approach_entrance_court.arrive": "The entrance approach lets you go, and the entrance court takes you. The air moves here, and the house stands back from you on every side but one. The court mouth stands open behind you.",
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
    "floor_line_y": 0.882812,
    "px_per_m_at_wall": 337.895,
    "px_per_m_at_bottom": 439.9,
    "wall_width_m": 5.45,
    "key_tint": "#c85c0a",
    "image_h_px": 1024,
    "horizon_y": 0.494629,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 321,
    "camera_wall_m": 3.11,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 97,
    "corner_x1_px": 1441,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/back_stair-N/row23-98d329eb.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1050.9,
    "nearest_floor_m": 2.3888,
    "measured_room": {
      "storey_height_m": 2.604,
      "wall_width_m": 3.978,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": []
    },
    "openings": []
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
        "x": 969.192412,
        "y": 77.371545,
        "w": 566.807588,
        "h": 946.628455,
        "raw_w": 4017.877973,
        "raw_h": 1679.670714,
        "hit_polys": [
          [
            [
              2666.959952,
              557.376987
            ],
            [
              2257.432724,
              416.21083
            ],
            [
              1993.206325,
              325.130621
            ],
            [
              1808.602686,
              261.49679
            ],
            [
              1672.343866,
              214.527669
            ],
            [
              1567.637553,
              178.43486
            ],
            [
              1484.661403,
              149.832551
            ],
            [
              1417.286736,
              126.608155
            ],
            [
              1361.4915,
              107.375248
            ],
            [
              1314.52675,
              91.186255
            ],
            [
              1274.449864,
              77.371545
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
          [
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
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ],
            [
              1254.7258,
              1320.302237
            ],
            [
              1359.692452,
              1491.578856
            ],
            [
              1522.381351,
              1757.042259
            ]
          ],
          [
            [
              4987.070385,
              1357.131076
            ],
            [
              2444.069057,
              1357.131076
            ],
            [
              1808.461665,
              1041.983265
            ],
            [
              3387.093157,
              1041.983265
            ]
          ],
          [
            [
              3387.093157,
              1041.983265
            ],
            [
              1808.461665,
              1041.983265
            ],
            [
              1808.461665,
              805.610635
            ],
            [
              3387.093157,
              805.610635
            ]
          ],
          [
            [
              3387.093157,
              805.610635
            ],
            [
              1808.461665,
              805.610635
            ],
            [
              1522.381351,
              728.757741
            ],
            [
              2666.959952,
              728.757741
            ]
          ],
          [
            [
              2666.959952,
              728.757741
            ],
            [
              1522.381351,
              728.757741
            ],
            [
              1522.381351,
              557.376987
            ],
            [
              2666.959952,
              557.376987
            ]
          ],
          [
            [
              2666.959952,
              557.376987
            ],
            [
              1522.381351,
              557.376987
            ],
            [
              1359.692452,
              550.631833
            ],
            [
              2257.432724,
              550.631833
            ]
          ],
          [
            [
              2257.432724,
              550.631833
            ],
            [
              1359.692452,
              550.631833
            ],
            [
              1359.692452,
              416.21083
            ],
            [
              2257.432724,
              416.21083
            ]
          ],
          [
            [
              2257.432724,
              416.21083
            ],
            [
              1359.692452,
              416.21083
            ],
            [
              1254.7258,
              435.705245
            ],
            [
              1993.206325,
              435.705245
            ]
          ],
          [
            [
              1993.206325,
              435.705245
            ],
            [
              1254.7258,
              435.705245
            ],
            [
              1254.7258,
              325.130621
            ],
            [
              1993.206325,
              325.130621
            ]
          ],
          [
            [
              1993.206325,
              325.130621
            ],
            [
              1254.7258,
              325.130621
            ],
            [
              1181.390108,
              355.410973
            ],
            [
              1808.602686,
              355.410973
            ]
          ],
          [
            [
              1808.602686,
              355.410973
            ],
            [
              1181.390108,
              355.410973
            ],
            [
              1181.390108,
              261.49679
            ],
            [
              1808.602686,
              261.49679
            ]
          ],
          [
            [
              1808.602686,
              261.49679
            ],
            [
              1181.390108,
              261.49679
            ],
            [
              1127.259892,
              296.14452
            ],
            [
              1672.343866,
              296.14452
            ]
          ],
          [
            [
              1672.343866,
              296.14452
            ],
            [
              1127.259892,
              296.14452
            ],
            [
              1127.259892,
              214.527669
            ],
            [
              1672.343866,
              214.527669
            ]
          ],
          [
            [
              1672.343866,
              214.527669
            ],
            [
              1127.259892,
              214.527669
            ],
            [
              1085.664234,
              250.601988
            ],
            [
              1567.637553,
              250.601988
            ]
          ],
          [
            [
              1567.637553,
              250.601988
            ],
            [
              1085.664234,
              250.601988
            ],
            [
              1085.664234,
              178.43486
            ],
            [
              1567.637553,
              178.43486
            ]
          ],
          [
            [
              1567.637553,
              178.43486
            ],
            [
              1085.664234,
              178.43486
            ],
            [
              1052.701105,
              214.511099
            ],
            [
              1484.661403,
              214.511099
            ]
          ],
          [
            [
              1484.661403,
              214.511099
            ],
            [
              1052.701105,
              214.511099
            ],
            [
              1052.701105,
              149.832551
            ],
            [
              1484.661403,
              149.832551
            ]
          ],
          [
            [
              1484.661403,
              149.832551
            ],
            [
              1052.701105,
              149.832551
            ],
            [
              1025.935827,
              185.206152
            ],
            [
              1417.286736,
              185.206152
            ]
          ],
          [
            [
              1417.286736,
              185.206152
            ],
            [
              1025.935827,
              185.206152
            ],
            [
              1025.935827,
              126.608155
            ],
            [
              1417.286736,
              126.608155
            ]
          ],
          [
            [
              1417.286736,
              126.608155
            ],
            [
              1025.935827,
              126.608155
            ],
            [
              1003.770596,
              160.937736
            ],
            [
              1361.4915,
              160.937736
            ]
          ],
          [
            [
              1361.4915,
              160.937736
            ],
            [
              1003.770596,
              160.937736
            ],
            [
              1003.770596,
              107.375248
            ],
            [
              1361.4915,
              107.375248
            ]
          ],
          [
            [
              1361.4915,
              107.375248
            ],
            [
              1003.770596,
              107.375248
            ],
            [
              985.113367,
              140.510184
            ],
            [
              1314.52675,
              140.510184
            ]
          ],
          [
            [
              1314.52675,
              140.510184
            ],
            [
              985.113367,
              140.510184
            ],
            [
              985.113367,
              91.186255
            ],
            [
              1314.52675,
              91.186255
            ]
          ],
          [
            [
              1314.52675,
              91.186255
            ],
            [
              985.113367,
              91.186255
            ],
            [
              969.192412,
              123.078543
            ],
            [
              1274.449864,
              123.078543
            ]
          ],
          [
            [
              1274.449864,
              123.078543
            ],
            [
              969.192412,
              123.078543
            ],
            [
              969.192412,
              77.371545
            ],
            [
              1274.449864,
              77.371545
            ]
          ],
          [
            [
              2666.959952,
              1757.042259
            ],
            [
              2257.432724,
              1491.578856
            ],
            [
              1993.206325,
              1320.302237
            ],
            [
              1808.602686,
              1200.638618
            ],
            [
              1672.343866,
              1112.313037
            ],
            [
              1567.637553,
              1044.440398
            ],
            [
              1484.661403,
              990.653666
            ],
            [
              1417.286736,
              946.980114
            ],
            [
              1361.4915,
              910.812572
            ],
            [
              1314.52675,
              880.369121
            ],
            [
              1274.449864,
              854.390515
            ],
            [
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ],
            [
              1254.7258,
              1320.302237
            ],
            [
              1359.692452,
              1491.578856
            ],
            [
              1522.381351,
              1757.042259
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              4987.070385,
              1357.131076
            ],
            [
              2444.069057,
              1357.131076
            ],
            [
              1808.461665,
              1041.983265
            ],
            [
              3387.093157,
              1041.983265
            ]
          ],
          [
            [
              3387.093157,
              1041.983265
            ],
            [
              1808.461665,
              1041.983265
            ],
            [
              1808.461665,
              805.610635
            ],
            [
              3387.093157,
              805.610635
            ]
          ],
          [
            [
              3387.093157,
              805.610635
            ],
            [
              1808.461665,
              805.610635
            ],
            [
              1522.381351,
              728.757741
            ],
            [
              2666.959952,
              728.757741
            ]
          ],
          [
            [
              2666.959952,
              728.757741
            ],
            [
              1522.381351,
              728.757741
            ],
            [
              1522.381351,
              557.376987
            ],
            [
              2666.959952,
              557.376987
            ]
          ],
          [
            [
              2666.959952,
              557.376987
            ],
            [
              1522.381351,
              557.376987
            ],
            [
              1359.692452,
              550.631833
            ],
            [
              2257.432724,
              550.631833
            ]
          ],
          [
            [
              2257.432724,
              550.631833
            ],
            [
              1359.692452,
              550.631833
            ],
            [
              1359.692452,
              416.21083
            ],
            [
              2257.432724,
              416.21083
            ]
          ],
          [
            [
              2257.432724,
              416.21083
            ],
            [
              1359.692452,
              416.21083
            ],
            [
              1254.7258,
              435.705245
            ],
            [
              1993.206325,
              435.705245
            ]
          ],
          [
            [
              1993.206325,
              435.705245
            ],
            [
              1254.7258,
              435.705245
            ],
            [
              1254.7258,
              325.130621
            ],
            [
              1993.206325,
              325.130621
            ]
          ],
          [
            [
              1993.206325,
              325.130621
            ],
            [
              1254.7258,
              325.130621
            ],
            [
              1181.390108,
              355.410973
            ],
            [
              1808.602686,
              355.410973
            ]
          ],
          [
            [
              1808.602686,
              355.410973
            ],
            [
              1181.390108,
              355.410973
            ],
            [
              1181.390108,
              261.49679
            ],
            [
              1808.602686,
              261.49679
            ]
          ],
          [
            [
              1808.602686,
              261.49679
            ],
            [
              1181.390108,
              261.49679
            ],
            [
              1127.259892,
              296.14452
            ],
            [
              1672.343866,
              296.14452
            ]
          ],
          [
            [
              1672.343866,
              296.14452
            ],
            [
              1127.259892,
              296.14452
            ],
            [
              1127.259892,
              214.527669
            ],
            [
              1672.343866,
              214.527669
            ]
          ],
          [
            [
              1672.343866,
              214.527669
            ],
            [
              1127.259892,
              214.527669
            ],
            [
              1085.664234,
              250.601988
            ],
            [
              1567.637553,
              250.601988
            ]
          ],
          [
            [
              1567.637553,
              250.601988
            ],
            [
              1085.664234,
              250.601988
            ],
            [
              1085.664234,
              178.43486
            ],
            [
              1567.637553,
              178.43486
            ]
          ],
          [
            [
              1567.637553,
              178.43486
            ],
            [
              1085.664234,
              178.43486
            ],
            [
              1052.701105,
              214.511099
            ],
            [
              1484.661403,
              214.511099
            ]
          ],
          [
            [
              1484.661403,
              214.511099
            ],
            [
              1052.701105,
              214.511099
            ],
            [
              1052.701105,
              149.832551
            ],
            [
              1484.661403,
              149.832551
            ]
          ],
          [
            [
              1484.661403,
              149.832551
            ],
            [
              1052.701105,
              149.832551
            ],
            [
              1025.935827,
              185.206152
            ],
            [
              1417.286736,
              185.206152
            ]
          ],
          [
            [
              1417.286736,
              185.206152
            ],
            [
              1025.935827,
              185.206152
            ],
            [
              1025.935827,
              126.608155
            ],
            [
              1417.286736,
              126.608155
            ]
          ],
          [
            [
              1417.286736,
              126.608155
            ],
            [
              1025.935827,
              126.608155
            ],
            [
              1003.770596,
              160.937736
            ],
            [
              1361.4915,
              160.937736
            ]
          ],
          [
            [
              1361.4915,
              160.937736
            ],
            [
              1003.770596,
              160.937736
            ],
            [
              1003.770596,
              107.375248
            ],
            [
              1361.4915,
              107.375248
            ]
          ],
          [
            [
              1361.4915,
              107.375248
            ],
            [
              1003.770596,
              107.375248
            ],
            [
              985.113367,
              140.510184
            ],
            [
              1314.52675,
              140.510184
            ]
          ],
          [
            [
              1314.52675,
              140.510184
            ],
            [
              985.113367,
              140.510184
            ],
            [
              985.113367,
              91.186255
            ],
            [
              1314.52675,
              91.186255
            ]
          ],
          [
            [
              1314.52675,
              91.186255
            ],
            [
              985.113367,
              91.186255
            ],
            [
              969.192412,
              123.078543
            ],
            [
              1274.449864,
              123.078543
            ]
          ],
          [
            [
              1274.449864,
              123.078543
            ],
            [
              969.192412,
              123.078543
            ],
            [
              969.192412,
              77.371545
            ],
            [
              1274.449864,
              77.371545
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "mass_normal": [
          [
            1,
            0,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              4987.070385,
              1357.131076
            ],
            [
              2444.069057,
              1357.131076
            ]
          ],
          [
            [
              3387.093157,
              805.610635
            ],
            [
              1808.461665,
              805.610635
            ]
          ],
          [
            [
              2666.959952,
              557.376987
            ],
            [
              1522.381351,
              557.376987
            ]
          ],
          [
            [
              2257.432724,
              416.21083
            ],
            [
              1359.692452,
              416.21083
            ]
          ],
          [
            [
              1993.206325,
              325.130621
            ],
            [
              1254.7258,
              325.130621
            ]
          ],
          [
            [
              1808.602686,
              261.49679
            ],
            [
              1181.390108,
              261.49679
            ]
          ],
          [
            [
              1672.343866,
              214.527669
            ],
            [
              1127.259892,
              214.527669
            ]
          ],
          [
            [
              1567.637553,
              178.43486
            ],
            [
              1085.664234,
              178.43486
            ]
          ],
          [
            [
              1484.661403,
              149.832551
            ],
            [
              1052.701105,
              149.832551
            ]
          ],
          [
            [
              1417.286736,
              126.608155
            ],
            [
              1025.935827,
              126.608155
            ]
          ],
          [
            [
              1361.4915,
              107.375248
            ],
            [
              1003.770596,
              107.375248
            ]
          ],
          [
            [
              1314.52675,
              91.186255
            ],
            [
              985.113367,
              91.186255
            ]
          ],
          [
            [
              1274.449864,
              77.371545
            ],
            [
              969.192412,
              77.371545
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              2666.959952,
              557.376987
            ],
            [
              2257.432724,
              416.21083
            ],
            [
              1993.206325,
              325.130621
            ],
            [
              1808.602686,
              261.49679
            ],
            [
              1672.343866,
              214.527669
            ],
            [
              1567.637553,
              178.43486
            ],
            [
              1484.661403,
              149.832551
            ],
            [
              1417.286736,
              126.608155
            ],
            [
              1361.4915,
              107.375248
            ],
            [
              1314.52675,
              91.186255
            ],
            [
              1274.449864,
              77.371545
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
          [
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
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ],
            [
              1254.7258,
              1320.302237
            ],
            [
              1359.692452,
              1491.578856
            ],
            [
              1522.381351,
              1757.042259
            ]
          ]
        ],
        "floor_poly": [
          [
            2666.959952,
            1757.042259
          ],
          [
            2257.432724,
            1491.578856
          ],
          [
            1993.206325,
            1320.302237
          ],
          [
            1808.602686,
            1200.638618
          ],
          [
            1672.343866,
            1112.313037
          ],
          [
            1567.637553,
            1044.440398
          ],
          [
            1484.661403,
            990.653666
          ],
          [
            1417.286736,
            946.980114
          ],
          [
            1361.4915,
            910.812572
          ],
          [
            1314.52675,
            880.369121
          ],
          [
            1274.449864,
            854.390515
          ],
          [
            969.192412,
            854.390515
          ],
          [
            985.113367,
            880.369121
          ],
          [
            1003.770596,
            910.812572
          ],
          [
            1025.935827,
            946.980114
          ],
          [
            1052.701105,
            990.653666
          ],
          [
            1085.664234,
            1044.440398
          ],
          [
            1127.259892,
            1112.313037
          ],
          [
            1181.390108,
            1200.638618
          ],
          [
            1254.7258,
            1320.302237
          ],
          [
            1359.692452,
            1491.578856
          ],
          [
            1522.381351,
            1757.042259
          ]
        ],
        "well_poly": [
          [
            2257.432724,
            -793.5782
          ],
          [
            1993.206325,
            -559.466371
          ],
          [
            1808.602686,
            -395.902489
          ],
          [
            1672.343866,
            -275.173442
          ],
          [
            1567.637553,
            -182.40078
          ],
          [
            1484.661403,
            -108.881638
          ],
          [
            1417.286736,
            -49.185837
          ],
          [
            1361.4915,
            0.250271
          ],
          [
            1314.52675,
            41.862326
          ],
          [
            1274.449864,
            77.371545
          ],
          [
            969.192412,
            77.371545
          ],
          [
            985.113367,
            41.862326
          ],
          [
            1003.770596,
            0.250271
          ],
          [
            1025.935827,
            -49.185837
          ],
          [
            1052.701105,
            -108.881638
          ],
          [
            1085.664234,
            -182.40078
          ],
          [
            1127.259892,
            -275.173442
          ],
          [
            1181.390108,
            -395.902489
          ],
          [
            1254.7258,
            -559.466371
          ],
          [
            1359.692452,
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
    "stairs": [
      {
        "id": "back_stair_flight",
        "kind": "stair",
        "via": null,
        "direction": "up",
        "treads": 17,
        "rise_m": 2.8,
        "x": 0,
        "y": 0,
        "w": 1536,
        "h": 1024,
        "raw_w": 2004.425532,
        "raw_h": 1220.085106,
        "hit_polys": [
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1362.932651,
              828.3415
            ],
            [
              1282.618926,
              779.454885
            ],
            [
              1202.3052,
              730.568269
            ],
            [
              1121.991475,
              681.681654
            ],
            [
              1041.677749,
              632.795038
            ],
            [
              961.364024,
              583.908423
            ],
            [
              881.050298,
              535.021807
            ],
            [
              800.736573,
              486.135192
            ],
            [
              720.422847,
              437.248576
            ],
            [
              640.109122,
              388.361961
            ],
            [
              559.795396,
              339.475345
            ],
            [
              479.481671,
              290.58873
            ],
            [
              399.167945,
              241.702114
            ],
            [
              318.85422,
              192.815499
            ],
            [
              238.540494,
              143.928883
            ],
            [
              158.226769,
              95.042268
            ],
            [
              77.913043,
              46.155652
            ],
            [
              77.913043,
              877.228116
            ],
            [
              158.226769,
              877.228116
            ],
            [
              238.540494,
              877.228116
            ],
            [
              318.85422,
              877.228116
            ],
            [
              399.167945,
              877.228116
            ],
            [
              479.481671,
              877.228116
            ],
            [
              559.795396,
              877.228116
            ],
            [
              640.109122,
              877.228116
            ],
            [
              720.422847,
              877.228116
            ],
            [
              800.736573,
              877.228116
            ],
            [
              881.050298,
              877.228116
            ],
            [
              961.364024,
              877.228116
            ],
            [
              1041.677749,
              877.228116
            ],
            [
              1121.991475,
              877.228116
            ],
            [
              1202.3052,
              877.228116
            ],
            [
              1282.618926,
              877.228116
            ],
            [
              1362.932651,
              877.228116
            ],
            [
              1443.246377,
              877.228116
            ]
          ],
          [
            [
              1759.319149,
              1041.585957
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              933.967459,
              539.197972
            ],
            [
              816.060075,
              467.42826
            ],
            [
              698.152691,
              395.658548
            ],
            [
              580.245307,
              323.888836
            ],
            [
              462.337922,
              252.119124
            ],
            [
              344.430538,
              180.349412
            ],
            [
              226.523154,
              108.5797
            ],
            [
              108.61577,
              36.809987
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              -245.106383,
              -178.499149
            ],
            [
              -245.106383,
              1041.585957
            ],
            [
              -127.198999,
              1041.585957
            ],
            [
              -9.291615,
              1041.585957
            ],
            [
              108.61577,
              1041.585957
            ],
            [
              226.523154,
              1041.585957
            ],
            [
              344.430538,
              1041.585957
            ],
            [
              462.337922,
              1041.585957
            ],
            [
              580.245307,
              1041.585957
            ],
            [
              698.152691,
              1041.585957
            ],
            [
              816.060075,
              1041.585957
            ],
            [
              933.967459,
              1041.585957
            ],
            [
              1051.874844,
              1041.585957
            ],
            [
              1169.782228,
              1041.585957
            ],
            [
              1287.689612,
              1041.585957
            ],
            [
              1405.596996,
              1041.585957
            ],
            [
              1523.50438,
              1041.585957
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1759.319149,
              1041.585957
            ]
          ],
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1759.319149,
              1041.585957
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1362.932651,
              877.228116
            ]
          ],
          [
            [
              1362.932651,
              877.228116
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1362.932651,
              828.3415
            ]
          ],
          [
            [
              1362.932651,
              828.3415
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1523.50438,
              969.816245
            ],
            [
              1282.618926,
              828.3415
            ]
          ],
          [
            [
              1282.618926,
              828.3415
            ],
            [
              1523.50438,
              969.816245
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1282.618926,
              779.454885
            ]
          ],
          [
            [
              1282.618926,
              779.454885
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1405.596996,
              898.046533
            ],
            [
              1202.3052,
              779.454885
            ]
          ],
          [
            [
              1202.3052,
              779.454885
            ],
            [
              1405.596996,
              898.046533
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1202.3052,
              730.568269
            ]
          ],
          [
            [
              1202.3052,
              730.568269
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1287.689612,
              826.276821
            ],
            [
              1121.991475,
              730.568269
            ]
          ],
          [
            [
              1121.991475,
              730.568269
            ],
            [
              1287.689612,
              826.276821
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1121.991475,
              681.681654
            ]
          ],
          [
            [
              1121.991475,
              681.681654
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1169.782228,
              754.507109
            ],
            [
              1041.677749,
              681.681654
            ]
          ],
          [
            [
              1041.677749,
              681.681654
            ],
            [
              1169.782228,
              754.507109
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1041.677749,
              632.795038
            ]
          ],
          [
            [
              1041.677749,
              632.795038
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1051.874844,
              682.737397
            ],
            [
              961.364024,
              632.795038
            ]
          ],
          [
            [
              961.364024,
              632.795038
            ],
            [
              1051.874844,
              682.737397
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              961.364024,
              583.908423
            ]
          ],
          [
            [
              961.364024,
              583.908423
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              933.967459,
              610.967685
            ],
            [
              881.050298,
              583.908423
            ]
          ],
          [
            [
              881.050298,
              583.908423
            ],
            [
              933.967459,
              610.967685
            ],
            [
              933.967459,
              539.197972
            ],
            [
              881.050298,
              535.021807
            ]
          ],
          [
            [
              881.050298,
              535.021807
            ],
            [
              933.967459,
              539.197972
            ],
            [
              816.060075,
              539.197972
            ],
            [
              800.736573,
              535.021807
            ]
          ],
          [
            [
              800.736573,
              535.021807
            ],
            [
              816.060075,
              539.197972
            ],
            [
              816.060075,
              467.42826
            ],
            [
              800.736573,
              486.135192
            ]
          ],
          [
            [
              800.736573,
              486.135192
            ],
            [
              816.060075,
              467.42826
            ],
            [
              698.152691,
              467.42826
            ],
            [
              720.422847,
              486.135192
            ]
          ],
          [
            [
              720.422847,
              486.135192
            ],
            [
              698.152691,
              467.42826
            ],
            [
              698.152691,
              395.658548
            ],
            [
              720.422847,
              437.248576
            ]
          ],
          [
            [
              720.422847,
              437.248576
            ],
            [
              698.152691,
              395.658548
            ],
            [
              580.245307,
              395.658548
            ],
            [
              640.109122,
              437.248576
            ]
          ],
          [
            [
              640.109122,
              437.248576
            ],
            [
              580.245307,
              395.658548
            ],
            [
              580.245307,
              323.888836
            ],
            [
              640.109122,
              388.361961
            ]
          ],
          [
            [
              640.109122,
              388.361961
            ],
            [
              580.245307,
              323.888836
            ],
            [
              462.337922,
              323.888836
            ],
            [
              559.795396,
              388.361961
            ]
          ],
          [
            [
              559.795396,
              388.361961
            ],
            [
              462.337922,
              323.888836
            ],
            [
              462.337922,
              252.119124
            ],
            [
              559.795396,
              339.475345
            ]
          ],
          [
            [
              559.795396,
              339.475345
            ],
            [
              462.337922,
              252.119124
            ],
            [
              344.430538,
              252.119124
            ],
            [
              479.481671,
              339.475345
            ]
          ],
          [
            [
              479.481671,
              339.475345
            ],
            [
              344.430538,
              252.119124
            ],
            [
              344.430538,
              180.349412
            ],
            [
              479.481671,
              290.58873
            ]
          ],
          [
            [
              479.481671,
              290.58873
            ],
            [
              344.430538,
              180.349412
            ],
            [
              226.523154,
              180.349412
            ],
            [
              399.167945,
              290.58873
            ]
          ],
          [
            [
              399.167945,
              290.58873
            ],
            [
              226.523154,
              180.349412
            ],
            [
              226.523154,
              108.5797
            ],
            [
              399.167945,
              241.702114
            ]
          ],
          [
            [
              399.167945,
              241.702114
            ],
            [
              226.523154,
              108.5797
            ],
            [
              108.61577,
              108.5797
            ],
            [
              318.85422,
              241.702114
            ]
          ],
          [
            [
              318.85422,
              241.702114
            ],
            [
              108.61577,
              108.5797
            ],
            [
              108.61577,
              36.809987
            ],
            [
              318.85422,
              192.815499
            ]
          ],
          [
            [
              318.85422,
              192.815499
            ],
            [
              108.61577,
              36.809987
            ],
            [
              -9.291615,
              36.809987
            ],
            [
              238.540494,
              192.815499
            ]
          ],
          [
            [
              238.540494,
              192.815499
            ],
            [
              -9.291615,
              36.809987
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              238.540494,
              143.928883
            ]
          ],
          [
            [
              238.540494,
              143.928883
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              -127.198999,
              -34.959725
            ],
            [
              158.226769,
              143.928883
            ]
          ],
          [
            [
              158.226769,
              143.928883
            ],
            [
              -127.198999,
              -34.959725
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              158.226769,
              95.042268
            ]
          ],
          [
            [
              158.226769,
              95.042268
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              -245.106383,
              -106.729437
            ],
            [
              77.913043,
              95.042268
            ]
          ],
          [
            [
              77.913043,
              95.042268
            ],
            [
              -245.106383,
              -106.729437
            ],
            [
              -245.106383,
              -178.499149
            ],
            [
              77.913043,
              46.155652
            ]
          ],
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1362.932651,
              877.228116
            ],
            [
              1282.618926,
              877.228116
            ],
            [
              1202.3052,
              877.228116
            ],
            [
              1121.991475,
              877.228116
            ],
            [
              1041.677749,
              877.228116
            ],
            [
              961.364024,
              877.228116
            ],
            [
              881.050298,
              877.228116
            ],
            [
              800.736573,
              877.228116
            ],
            [
              720.422847,
              877.228116
            ],
            [
              640.109122,
              877.228116
            ],
            [
              559.795396,
              877.228116
            ],
            [
              479.481671,
              877.228116
            ],
            [
              399.167945,
              877.228116
            ],
            [
              318.85422,
              877.228116
            ],
            [
              238.540494,
              877.228116
            ],
            [
              158.226769,
              877.228116
            ],
            [
              77.913043,
              877.228116
            ],
            [
              -245.106383,
              1041.585957
            ],
            [
              -127.198999,
              1041.585957
            ],
            [
              -9.291615,
              1041.585957
            ],
            [
              108.61577,
              1041.585957
            ],
            [
              226.523154,
              1041.585957
            ],
            [
              344.430538,
              1041.585957
            ],
            [
              462.337922,
              1041.585957
            ],
            [
              580.245307,
              1041.585957
            ],
            [
              698.152691,
              1041.585957
            ],
            [
              816.060075,
              1041.585957
            ],
            [
              933.967459,
              1041.585957
            ],
            [
              1051.874844,
              1041.585957
            ],
            [
              1169.782228,
              1041.585957
            ],
            [
              1287.689612,
              1041.585957
            ],
            [
              1405.596996,
              1041.585957
            ],
            [
              1523.50438,
              1041.585957
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1759.319149,
              1041.585957
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1759.319149,
              1041.585957
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1362.932651,
              877.228116
            ]
          ],
          [
            [
              1362.932651,
              877.228116
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1362.932651,
              828.3415
            ]
          ],
          [
            [
              1362.932651,
              828.3415
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1523.50438,
              969.816245
            ],
            [
              1282.618926,
              828.3415
            ]
          ],
          [
            [
              1282.618926,
              828.3415
            ],
            [
              1523.50438,
              969.816245
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1282.618926,
              779.454885
            ]
          ],
          [
            [
              1282.618926,
              779.454885
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1405.596996,
              898.046533
            ],
            [
              1202.3052,
              779.454885
            ]
          ],
          [
            [
              1202.3052,
              779.454885
            ],
            [
              1405.596996,
              898.046533
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1202.3052,
              730.568269
            ]
          ],
          [
            [
              1202.3052,
              730.568269
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1287.689612,
              826.276821
            ],
            [
              1121.991475,
              730.568269
            ]
          ],
          [
            [
              1121.991475,
              730.568269
            ],
            [
              1287.689612,
              826.276821
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1121.991475,
              681.681654
            ]
          ],
          [
            [
              1121.991475,
              681.681654
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1169.782228,
              754.507109
            ],
            [
              1041.677749,
              681.681654
            ]
          ],
          [
            [
              1041.677749,
              681.681654
            ],
            [
              1169.782228,
              754.507109
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1041.677749,
              632.795038
            ]
          ],
          [
            [
              1041.677749,
              632.795038
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1051.874844,
              682.737397
            ],
            [
              961.364024,
              632.795038
            ]
          ],
          [
            [
              961.364024,
              632.795038
            ],
            [
              1051.874844,
              682.737397
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              961.364024,
              583.908423
            ]
          ],
          [
            [
              961.364024,
              583.908423
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              933.967459,
              610.967685
            ],
            [
              881.050298,
              583.908423
            ]
          ],
          [
            [
              881.050298,
              583.908423
            ],
            [
              933.967459,
              610.967685
            ],
            [
              933.967459,
              539.197972
            ],
            [
              881.050298,
              535.021807
            ]
          ],
          [
            [
              881.050298,
              535.021807
            ],
            [
              933.967459,
              539.197972
            ],
            [
              816.060075,
              539.197972
            ],
            [
              800.736573,
              535.021807
            ]
          ],
          [
            [
              800.736573,
              535.021807
            ],
            [
              816.060075,
              539.197972
            ],
            [
              816.060075,
              467.42826
            ],
            [
              800.736573,
              486.135192
            ]
          ],
          [
            [
              800.736573,
              486.135192
            ],
            [
              816.060075,
              467.42826
            ],
            [
              698.152691,
              467.42826
            ],
            [
              720.422847,
              486.135192
            ]
          ],
          [
            [
              720.422847,
              486.135192
            ],
            [
              698.152691,
              467.42826
            ],
            [
              698.152691,
              395.658548
            ],
            [
              720.422847,
              437.248576
            ]
          ],
          [
            [
              720.422847,
              437.248576
            ],
            [
              698.152691,
              395.658548
            ],
            [
              580.245307,
              395.658548
            ],
            [
              640.109122,
              437.248576
            ]
          ],
          [
            [
              640.109122,
              437.248576
            ],
            [
              580.245307,
              395.658548
            ],
            [
              580.245307,
              323.888836
            ],
            [
              640.109122,
              388.361961
            ]
          ],
          [
            [
              640.109122,
              388.361961
            ],
            [
              580.245307,
              323.888836
            ],
            [
              462.337922,
              323.888836
            ],
            [
              559.795396,
              388.361961
            ]
          ],
          [
            [
              559.795396,
              388.361961
            ],
            [
              462.337922,
              323.888836
            ],
            [
              462.337922,
              252.119124
            ],
            [
              559.795396,
              339.475345
            ]
          ],
          [
            [
              559.795396,
              339.475345
            ],
            [
              462.337922,
              252.119124
            ],
            [
              344.430538,
              252.119124
            ],
            [
              479.481671,
              339.475345
            ]
          ],
          [
            [
              479.481671,
              339.475345
            ],
            [
              344.430538,
              252.119124
            ],
            [
              344.430538,
              180.349412
            ],
            [
              479.481671,
              290.58873
            ]
          ],
          [
            [
              479.481671,
              290.58873
            ],
            [
              344.430538,
              180.349412
            ],
            [
              226.523154,
              180.349412
            ],
            [
              399.167945,
              290.58873
            ]
          ],
          [
            [
              399.167945,
              290.58873
            ],
            [
              226.523154,
              180.349412
            ],
            [
              226.523154,
              108.5797
            ],
            [
              399.167945,
              241.702114
            ]
          ],
          [
            [
              399.167945,
              241.702114
            ],
            [
              226.523154,
              108.5797
            ],
            [
              108.61577,
              108.5797
            ],
            [
              318.85422,
              241.702114
            ]
          ],
          [
            [
              318.85422,
              241.702114
            ],
            [
              108.61577,
              108.5797
            ],
            [
              108.61577,
              36.809987
            ],
            [
              318.85422,
              192.815499
            ]
          ],
          [
            [
              318.85422,
              192.815499
            ],
            [
              108.61577,
              36.809987
            ],
            [
              -9.291615,
              36.809987
            ],
            [
              238.540494,
              192.815499
            ]
          ],
          [
            [
              238.540494,
              192.815499
            ],
            [
              -9.291615,
              36.809987
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              238.540494,
              143.928883
            ]
          ],
          [
            [
              238.540494,
              143.928883
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              -127.198999,
              -34.959725
            ],
            [
              158.226769,
              143.928883
            ]
          ],
          [
            [
              158.226769,
              143.928883
            ],
            [
              -127.198999,
              -34.959725
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              158.226769,
              95.042268
            ]
          ],
          [
            [
              158.226769,
              95.042268
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              -245.106383,
              -106.729437
            ],
            [
              77.913043,
              95.042268
            ]
          ],
          [
            [
              77.913043,
              95.042268
            ],
            [
              -245.106383,
              -106.729437
            ],
            [
              -245.106383,
              -178.499149
            ],
            [
              77.913043,
              46.155652
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ]
        ],
        "mass_normal": [
          [
            0,
            1,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "noses": [
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1759.319149,
              1041.585957
            ]
          ],
          [
            [
              1362.932651,
              828.3415
            ],
            [
              1641.411765,
              969.816245
            ]
          ],
          [
            [
              1282.618926,
              779.454885
            ],
            [
              1523.50438,
              898.046533
            ]
          ],
          [
            [
              1202.3052,
              730.568269
            ],
            [
              1405.596996,
              826.276821
            ]
          ],
          [
            [
              1121.991475,
              681.681654
            ],
            [
              1287.689612,
              754.507109
            ]
          ],
          [
            [
              1041.677749,
              632.795038
            ],
            [
              1169.782228,
              682.737397
            ]
          ],
          [
            [
              961.364024,
              583.908423
            ],
            [
              1051.874844,
              610.967685
            ]
          ],
          [
            [
              881.050298,
              535.021807
            ],
            [
              933.967459,
              539.197972
            ]
          ],
          [
            [
              800.736573,
              486.135192
            ],
            [
              816.060075,
              467.42826
            ]
          ],
          [
            [
              720.422847,
              437.248576
            ],
            [
              698.152691,
              395.658548
            ]
          ],
          [
            [
              640.109122,
              388.361961
            ],
            [
              580.245307,
              323.888836
            ]
          ],
          [
            [
              559.795396,
              339.475345
            ],
            [
              462.337922,
              252.119124
            ]
          ],
          [
            [
              479.481671,
              290.58873
            ],
            [
              344.430538,
              180.349412
            ]
          ],
          [
            [
              399.167945,
              241.702114
            ],
            [
              226.523154,
              108.5797
            ]
          ],
          [
            [
              318.85422,
              192.815499
            ],
            [
              108.61577,
              36.809987
            ]
          ],
          [
            [
              238.540494,
              143.928883
            ],
            [
              -9.291615,
              -34.959725
            ]
          ],
          [
            [
              158.226769,
              95.042268
            ],
            [
              -127.198999,
              -106.729437
            ]
          ],
          [
            [
              77.913043,
              46.155652
            ],
            [
              -245.106383,
              -178.499149
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              1443.246377,
              877.228116
            ],
            [
              1362.932651,
              828.3415
            ],
            [
              1282.618926,
              779.454885
            ],
            [
              1202.3052,
              730.568269
            ],
            [
              1121.991475,
              681.681654
            ],
            [
              1041.677749,
              632.795038
            ],
            [
              961.364024,
              583.908423
            ],
            [
              881.050298,
              535.021807
            ],
            [
              800.736573,
              486.135192
            ],
            [
              720.422847,
              437.248576
            ],
            [
              640.109122,
              388.361961
            ],
            [
              559.795396,
              339.475345
            ],
            [
              479.481671,
              290.58873
            ],
            [
              399.167945,
              241.702114
            ],
            [
              318.85422,
              192.815499
            ],
            [
              238.540494,
              143.928883
            ],
            [
              158.226769,
              95.042268
            ],
            [
              77.913043,
              46.155652
            ],
            [
              77.913043,
              877.228116
            ],
            [
              158.226769,
              877.228116
            ],
            [
              238.540494,
              877.228116
            ],
            [
              318.85422,
              877.228116
            ],
            [
              399.167945,
              877.228116
            ],
            [
              479.481671,
              877.228116
            ],
            [
              559.795396,
              877.228116
            ],
            [
              640.109122,
              877.228116
            ],
            [
              720.422847,
              877.228116
            ],
            [
              800.736573,
              877.228116
            ],
            [
              881.050298,
              877.228116
            ],
            [
              961.364024,
              877.228116
            ],
            [
              1041.677749,
              877.228116
            ],
            [
              1121.991475,
              877.228116
            ],
            [
              1202.3052,
              877.228116
            ],
            [
              1282.618926,
              877.228116
            ],
            [
              1362.932651,
              877.228116
            ],
            [
              1443.246377,
              877.228116
            ]
          ],
          [
            [
              1759.319149,
              1041.585957
            ],
            [
              1641.411765,
              969.816245
            ],
            [
              1523.50438,
              898.046533
            ],
            [
              1405.596996,
              826.276821
            ],
            [
              1287.689612,
              754.507109
            ],
            [
              1169.782228,
              682.737397
            ],
            [
              1051.874844,
              610.967685
            ],
            [
              933.967459,
              539.197972
            ],
            [
              816.060075,
              467.42826
            ],
            [
              698.152691,
              395.658548
            ],
            [
              580.245307,
              323.888836
            ],
            [
              462.337922,
              252.119124
            ],
            [
              344.430538,
              180.349412
            ],
            [
              226.523154,
              108.5797
            ],
            [
              108.61577,
              36.809987
            ],
            [
              -9.291615,
              -34.959725
            ],
            [
              -127.198999,
              -106.729437
            ],
            [
              -245.106383,
              -178.499149
            ],
            [
              -245.106383,
              1041.585957
            ],
            [
              -127.198999,
              1041.585957
            ],
            [
              -9.291615,
              1041.585957
            ],
            [
              108.61577,
              1041.585957
            ],
            [
              226.523154,
              1041.585957
            ],
            [
              344.430538,
              1041.585957
            ],
            [
              462.337922,
              1041.585957
            ],
            [
              580.245307,
              1041.585957
            ],
            [
              698.152691,
              1041.585957
            ],
            [
              816.060075,
              1041.585957
            ],
            [
              933.967459,
              1041.585957
            ],
            [
              1051.874844,
              1041.585957
            ],
            [
              1169.782228,
              1041.585957
            ],
            [
              1287.689612,
              1041.585957
            ],
            [
              1405.596996,
              1041.585957
            ],
            [
              1523.50438,
              1041.585957
            ],
            [
              1641.411765,
              1041.585957
            ],
            [
              1759.319149,
              1041.585957
            ]
          ]
        ],
        "floor_poly": [
          [
            1443.246377,
            877.228116
          ],
          [
            1362.932651,
            877.228116
          ],
          [
            1282.618926,
            877.228116
          ],
          [
            1202.3052,
            877.228116
          ],
          [
            1121.991475,
            877.228116
          ],
          [
            1041.677749,
            877.228116
          ],
          [
            961.364024,
            877.228116
          ],
          [
            881.050298,
            877.228116
          ],
          [
            800.736573,
            877.228116
          ],
          [
            720.422847,
            877.228116
          ],
          [
            640.109122,
            877.228116
          ],
          [
            559.795396,
            877.228116
          ],
          [
            479.481671,
            877.228116
          ],
          [
            399.167945,
            877.228116
          ],
          [
            318.85422,
            877.228116
          ],
          [
            238.540494,
            877.228116
          ],
          [
            158.226769,
            877.228116
          ],
          [
            77.913043,
            877.228116
          ],
          [
            -245.106383,
            1041.585957
          ],
          [
            -127.198999,
            1041.585957
          ],
          [
            -9.291615,
            1041.585957
          ],
          [
            108.61577,
            1041.585957
          ],
          [
            226.523154,
            1041.585957
          ],
          [
            344.430538,
            1041.585957
          ],
          [
            462.337922,
            1041.585957
          ],
          [
            580.245307,
            1041.585957
          ],
          [
            698.152691,
            1041.585957
          ],
          [
            816.060075,
            1041.585957
          ],
          [
            933.967459,
            1041.585957
          ],
          [
            1051.874844,
            1041.585957
          ],
          [
            1169.782228,
            1041.585957
          ],
          [
            1287.689612,
            1041.585957
          ],
          [
            1405.596996,
            1041.585957
          ],
          [
            1523.50438,
            1041.585957
          ],
          [
            1641.411765,
            1041.585957
          ],
          [
            1759.319149,
            1041.585957
          ]
        ],
        "well_poly": [
          [
            1443.246377,
            46.155652
          ],
          [
            1362.932651,
            46.155652
          ],
          [
            1282.618926,
            46.155652
          ],
          [
            1202.3052,
            46.155652
          ],
          [
            1121.991475,
            46.155652
          ],
          [
            1041.677749,
            46.155652
          ],
          [
            961.364024,
            46.155652
          ],
          [
            881.050298,
            46.155652
          ],
          [
            800.736573,
            46.155652
          ],
          [
            720.422847,
            46.155652
          ],
          [
            640.109122,
            46.155652
          ],
          [
            559.795396,
            46.155652
          ],
          [
            479.481671,
            46.155652
          ],
          [
            399.167945,
            46.155652
          ],
          [
            318.85422,
            46.155652
          ],
          [
            238.540494,
            46.155652
          ],
          [
            158.226769,
            46.155652
          ],
          [
            77.913043,
            46.155652
          ],
          [
            -245.106383,
            -178.499149
          ],
          [
            -127.198999,
            -178.499149
          ],
          [
            -9.291615,
            -178.499149
          ],
          [
            108.61577,
            -178.499149
          ],
          [
            226.523154,
            -178.499149
          ],
          [
            344.430538,
            -178.499149
          ],
          [
            462.337922,
            -178.499149
          ],
          [
            580.245307,
            -178.499149
          ],
          [
            698.152691,
            -178.499149
          ],
          [
            816.060075,
            -178.499149
          ],
          [
            933.967459,
            -178.499149
          ],
          [
            1051.874844,
            -178.499149
          ],
          [
            1169.782228,
            -178.499149
          ],
          [
            1287.689612,
            -178.499149
          ],
          [
            1405.596996,
            -178.499149
          ],
          [
            1523.50438,
            -178.499149
          ],
          [
            1641.411765,
            -178.499149
          ],
          [
            1759.319149,
            -178.499149
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "back_stair/W": {
    "floor_line_y": 0.803012,
    "px_per_m_at_wall": 250.367,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 4.15,
    "key_tint": "#c89151",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 238,
    "camera_wall_m": 4.09,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.15,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 55.59,
    "corner_x1_px": 1480.41,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/back_stair-W/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 2.999,
      "wall_width_m": 5.691,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.15,
      "carriers": [
        {
          "kind": "door",
          "id": "op11",
          "plan_px": [
            561.4,
            811.8
          ],
          "plan_centre_px": 686.6,
          "painted_px": [
            770,
            981
          ],
          "painted_centre_px": 875.5,
          "centre_delta_px": 188.9,
          "centre_delta_m": 0.754,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ],
      "flight_evidence": {
        "read": true,
        "ratio": 0.9356,
        "body_px": 193004,
        "ring_px": 36810,
        "body_edge": 35.003,
        "ring_edge": 37.41,
        "why": null,
        "asked": {
          "prompt": "backdrops/source/back_stair-W/row23-7d7caa79.prompt.txt",
          "via": "the roll this snapped frame was rectified from (backdrops/source/back_stair-W/row23-7d7caa79.png)"
        },
        "geometry": "snapped onto the declared camera; the u-domain is this painting's own corners",
        "against_the_ask": [
          {
            "id": "back_stair_flight",
            "agreed_px": 193004,
            "disputed_px": 118342,
            "agreed_of_union": 0.62,
            "aim_of_this_lands_on_the_ask": true,
            "aim_of_the_ask_lands_on_this": true,
            "apart_px": 96.4,
            "apart_m": 0.385,
            "over": false
          }
        ]
      }
    },
    "openings": [
      {
        "id": "op11",
        "kind": "door",
        "via": null,
        "x": 770,
        "y": 262,
        "w": 211,
        "h": 560,
        "beyond_m": 14.95,
        "beyond_offset_m": -2.575,
        "measured": true
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
        "x": 0,
        "y": 0,
        "w": 488.313286,
        "h": 1024,
        "raw_w": 3582.541254,
        "raw_h": 2267.184503,
        "hit_polys": [
          [
            [
              63.96103,
              858.90025
            ],
            [
              7.421587,
              835.570463
            ],
            [
              -58.991866,
              808.166377
            ],
            [
              -138.113384,
              775.518582
            ],
            [
              -233.976345,
              735.962789
            ],
            [
              -352.522929,
              687.047086
            ],
            [
              -502.884816,
              625.003482
            ],
            [
              -699.854834,
              543.728033
            ],
            [
              -969.078608,
              432.638623
            ],
            [
              -1359.242748,
              271.645767
            ],
            [
              -1975.446567,
              17.382491
            ],
            [
              -1975.446567,
              1822.925869
            ],
            [
              -1359.242748,
              1531.647035
            ],
            [
              -969.078608,
              1347.216895
            ],
            [
              -699.854834,
              1219.955128
            ],
            [
              -502.884816,
              1126.847627
            ],
            [
              -352.522929,
              1055.771737
            ],
            [
              -233.976345,
              999.734903
            ],
            [
              -138.113384,
              954.420592
            ],
            [
              -58.991866,
              917.019942
            ],
            [
              7.421587,
              885.626379
            ],
            [
              63.96103,
              858.90025
            ]
          ],
          [
            [
              488.313286,
              858.90025
            ],
            [
              465.852411,
              835.570463
            ],
            [
              439.468985,
              808.166377
            ],
            [
              408.037149,
              775.518582
            ],
            [
              369.954603,
              735.962789
            ],
            [
              322.860754,
              687.047086
            ],
            [
              263.12795,
              625.003482
            ],
            [
              184.879586,
              543.728033
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -321.862335,
              1822.925869
            ],
            [
              -77.069037,
              1531.647035
            ],
            [
              77.927676,
              1347.216895
            ],
            [
              184.879586,
              1219.955128
            ],
            [
              263.12795,
              1126.847627
            ],
            [
              322.860754,
              1055.771737
            ],
            [
              369.954603,
              999.734903
            ],
            [
              408.037149,
              954.420592
            ],
            [
              439.468985,
              917.019942
            ],
            [
              465.852411,
              885.626379
            ],
            [
              488.313286,
              858.90025
            ]
          ],
          [
            [
              63.96103,
              858.90025
            ],
            [
              488.313286,
              858.90025
            ],
            [
              465.852411,
              885.626379
            ],
            [
              7.421587,
              885.626379
            ]
          ],
          [
            [
              7.421587,
              885.626379
            ],
            [
              465.852411,
              885.626379
            ],
            [
              465.852411,
              835.570463
            ],
            [
              7.421587,
              835.570463
            ]
          ],
          [
            [
              7.421587,
              835.570463
            ],
            [
              465.852411,
              835.570463
            ],
            [
              439.468985,
              862.59316
            ],
            [
              -58.991866,
              862.59316
            ]
          ],
          [
            [
              -58.991866,
              862.59316
            ],
            [
              439.468985,
              862.59316
            ],
            [
              439.468985,
              808.166377
            ],
            [
              -58.991866,
              808.166377
            ]
          ],
          [
            [
              -58.991866,
              808.166377
            ],
            [
              439.468985,
              808.166377
            ],
            [
              408.037149,
              835.152585
            ],
            [
              -138.113384,
              835.152585
            ]
          ],
          [
            [
              -138.113384,
              835.152585
            ],
            [
              408.037149,
              835.152585
            ],
            [
              408.037149,
              775.518582
            ],
            [
              -138.113384,
              775.518582
            ]
          ],
          [
            [
              -138.113384,
              775.518582
            ],
            [
              408.037149,
              775.518582
            ],
            [
              369.954603,
              801.905818
            ],
            [
              -233.976345,
              801.905818
            ]
          ],
          [
            [
              -233.976345,
              801.905818
            ],
            [
              369.954603,
              801.905818
            ],
            [
              369.954603,
              735.962789
            ],
            [
              -233.976345,
              735.962789
            ]
          ],
          [
            [
              -233.976345,
              735.962789
            ],
            [
              369.954603,
              735.962789
            ],
            [
              322.860754,
              760.792016
            ],
            [
              -352.522929,
              760.792016
            ]
          ],
          [
            [
              -352.522929,
              760.792016
            ],
            [
              322.860754,
              760.792016
            ],
            [
              322.860754,
              687.047086
            ],
            [
              -352.522929,
              687.047086
            ]
          ],
          [
            [
              -352.522929,
              687.047086
            ],
            [
              322.860754,
              687.047086
            ],
            [
              263.12795,
              708.644173
            ],
            [
              -502.884816,
              708.644173
            ]
          ],
          [
            [
              -502.884816,
              708.644173
            ],
            [
              263.12795,
              708.644173
            ],
            [
              263.12795,
              625.003482
            ],
            [
              -502.884816,
              625.003482
            ]
          ],
          [
            [
              -502.884816,
              625.003482
            ],
            [
              263.12795,
              625.003482
            ],
            [
              184.879586,
              640.331903
            ],
            [
              -699.854834,
              640.331903
            ]
          ],
          [
            [
              -699.854834,
              640.331903
            ],
            [
              184.879586,
              640.331903
            ],
            [
              184.879586,
              543.728033
            ],
            [
              -699.854834,
              543.728033
            ]
          ],
          [
            [
              -699.854834,
              543.728033
            ],
            [
              184.879586,
              543.728033
            ],
            [
              77.927676,
              546.960907
            ],
            [
              -969.078608,
              546.960907
            ]
          ],
          [
            [
              -969.078608,
              546.960907
            ],
            [
              77.927676,
              546.960907
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -969.078608,
              432.638623
            ]
          ],
          [
            [
              -969.078608,
              432.638623
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -77.069037,
              411.645908
            ],
            [
              -1359.242748,
              411.645908
            ]
          ],
          [
            [
              -1359.242748,
              411.645908
            ],
            [
              -77.069037,
              411.645908
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -1359.242748,
              271.645767
            ]
          ],
          [
            [
              -1359.242748,
              271.645767
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -321.862335,
              197.936829
            ],
            [
              -1975.446567,
              197.936829
            ]
          ],
          [
            [
              -1975.446567,
              197.936829
            ],
            [
              -321.862335,
              197.936829
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -1975.446567,
              17.382491
            ]
          ],
          [
            [
              -1975.446567,
              17.382491
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -766.309741,
              -190.073981
            ],
            [
              -3094.227968,
              -190.073981
            ]
          ],
          [
            [
              -3094.227968,
              -190.073981
            ],
            [
              -766.309741,
              -190.073981
            ],
            [
              -766.309741,
              -444.258634
            ],
            [
              -3094.227968,
              -444.258634
            ]
          ],
          [
            [
              63.96103,
              858.90025
            ],
            [
              7.421587,
              885.626379
            ],
            [
              -58.991866,
              917.019942
            ],
            [
              -138.113384,
              954.420592
            ],
            [
              -233.976345,
              999.734903
            ],
            [
              -352.522929,
              1055.771737
            ],
            [
              -502.884816,
              1126.847627
            ],
            [
              -699.854834,
              1219.955128
            ],
            [
              -969.078608,
              1347.216895
            ],
            [
              -1359.242748,
              1531.647035
            ],
            [
              -1975.446567,
              1822.925869
            ],
            [
              -321.862335,
              1822.925869
            ],
            [
              -77.069037,
              1531.647035
            ],
            [
              77.927676,
              1347.216895
            ],
            [
              184.879586,
              1219.955128
            ],
            [
              263.12795,
              1126.847627
            ],
            [
              322.860754,
              1055.771737
            ],
            [
              369.954603,
              999.734903
            ],
            [
              408.037149,
              954.420592
            ],
            [
              439.468985,
              917.019942
            ],
            [
              465.852411,
              885.626379
            ],
            [
              488.313286,
              858.90025
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              63.96103,
              858.90025
            ],
            [
              488.313286,
              858.90025
            ],
            [
              465.852411,
              885.626379
            ],
            [
              7.421587,
              885.626379
            ]
          ],
          [
            [
              7.421587,
              885.626379
            ],
            [
              465.852411,
              885.626379
            ],
            [
              465.852411,
              835.570463
            ],
            [
              7.421587,
              835.570463
            ]
          ],
          [
            [
              7.421587,
              835.570463
            ],
            [
              465.852411,
              835.570463
            ],
            [
              439.468985,
              862.59316
            ],
            [
              -58.991866,
              862.59316
            ]
          ],
          [
            [
              -58.991866,
              862.59316
            ],
            [
              439.468985,
              862.59316
            ],
            [
              439.468985,
              808.166377
            ],
            [
              -58.991866,
              808.166377
            ]
          ],
          [
            [
              -58.991866,
              808.166377
            ],
            [
              439.468985,
              808.166377
            ],
            [
              408.037149,
              835.152585
            ],
            [
              -138.113384,
              835.152585
            ]
          ],
          [
            [
              -138.113384,
              835.152585
            ],
            [
              408.037149,
              835.152585
            ],
            [
              408.037149,
              775.518582
            ],
            [
              -138.113384,
              775.518582
            ]
          ],
          [
            [
              -138.113384,
              775.518582
            ],
            [
              408.037149,
              775.518582
            ],
            [
              369.954603,
              801.905818
            ],
            [
              -233.976345,
              801.905818
            ]
          ],
          [
            [
              -233.976345,
              801.905818
            ],
            [
              369.954603,
              801.905818
            ],
            [
              369.954603,
              735.962789
            ],
            [
              -233.976345,
              735.962789
            ]
          ],
          [
            [
              -233.976345,
              735.962789
            ],
            [
              369.954603,
              735.962789
            ],
            [
              322.860754,
              760.792016
            ],
            [
              -352.522929,
              760.792016
            ]
          ],
          [
            [
              -352.522929,
              760.792016
            ],
            [
              322.860754,
              760.792016
            ],
            [
              322.860754,
              687.047086
            ],
            [
              -352.522929,
              687.047086
            ]
          ],
          [
            [
              -352.522929,
              687.047086
            ],
            [
              322.860754,
              687.047086
            ],
            [
              263.12795,
              708.644173
            ],
            [
              -502.884816,
              708.644173
            ]
          ],
          [
            [
              -502.884816,
              708.644173
            ],
            [
              263.12795,
              708.644173
            ],
            [
              263.12795,
              625.003482
            ],
            [
              -502.884816,
              625.003482
            ]
          ],
          [
            [
              -502.884816,
              625.003482
            ],
            [
              263.12795,
              625.003482
            ],
            [
              184.879586,
              640.331903
            ],
            [
              -699.854834,
              640.331903
            ]
          ],
          [
            [
              -699.854834,
              640.331903
            ],
            [
              184.879586,
              640.331903
            ],
            [
              184.879586,
              543.728033
            ],
            [
              -699.854834,
              543.728033
            ]
          ],
          [
            [
              -699.854834,
              543.728033
            ],
            [
              184.879586,
              543.728033
            ],
            [
              77.927676,
              546.960907
            ],
            [
              -969.078608,
              546.960907
            ]
          ],
          [
            [
              -969.078608,
              546.960907
            ],
            [
              77.927676,
              546.960907
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -969.078608,
              432.638623
            ]
          ],
          [
            [
              -969.078608,
              432.638623
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -77.069037,
              411.645908
            ],
            [
              -1359.242748,
              411.645908
            ]
          ],
          [
            [
              -1359.242748,
              411.645908
            ],
            [
              -77.069037,
              411.645908
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -1359.242748,
              271.645767
            ]
          ],
          [
            [
              -1359.242748,
              271.645767
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -321.862335,
              197.936829
            ],
            [
              -1975.446567,
              197.936829
            ]
          ],
          [
            [
              -1975.446567,
              197.936829
            ],
            [
              -321.862335,
              197.936829
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -1975.446567,
              17.382491
            ]
          ],
          [
            [
              -1975.446567,
              17.382491
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -766.309741,
              -190.073981
            ],
            [
              -3094.227968,
              -190.073981
            ]
          ],
          [
            [
              -3094.227968,
              -190.073981
            ],
            [
              -766.309741,
              -190.073981
            ],
            [
              -766.309741,
              -444.258634
            ],
            [
              -3094.227968,
              -444.258634
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "mass_normal": [
          [
            -1,
            0,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              63.96103,
              858.90025
            ],
            [
              488.313286,
              858.90025
            ]
          ],
          [
            [
              7.421587,
              835.570463
            ],
            [
              465.852411,
              835.570463
            ]
          ],
          [
            [
              -58.991866,
              808.166377
            ],
            [
              439.468985,
              808.166377
            ]
          ],
          [
            [
              -138.113384,
              775.518582
            ],
            [
              408.037149,
              775.518582
            ]
          ],
          [
            [
              -233.976345,
              735.962789
            ],
            [
              369.954603,
              735.962789
            ]
          ],
          [
            [
              -352.522929,
              687.047086
            ],
            [
              322.860754,
              687.047086
            ]
          ],
          [
            [
              -502.884816,
              625.003482
            ],
            [
              263.12795,
              625.003482
            ]
          ],
          [
            [
              -699.854834,
              543.728033
            ],
            [
              184.879586,
              543.728033
            ]
          ],
          [
            [
              -969.078608,
              432.638623
            ],
            [
              77.927676,
              432.638623
            ]
          ],
          [
            [
              -1359.242748,
              271.645767
            ],
            [
              -77.069037,
              271.645767
            ]
          ],
          [
            [
              -1975.446567,
              17.382491
            ],
            [
              -321.862335,
              17.382491
            ]
          ],
          [
            [
              -3094.227968,
              -444.258634
            ],
            [
              -766.309741,
              -444.258634
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              63.96103,
              858.90025
            ],
            [
              7.421587,
              835.570463
            ],
            [
              -58.991866,
              808.166377
            ],
            [
              -138.113384,
              775.518582
            ],
            [
              -233.976345,
              735.962789
            ],
            [
              -352.522929,
              687.047086
            ],
            [
              -502.884816,
              625.003482
            ],
            [
              -699.854834,
              543.728033
            ],
            [
              -969.078608,
              432.638623
            ],
            [
              -1359.242748,
              271.645767
            ],
            [
              -1975.446567,
              17.382491
            ],
            [
              -1975.446567,
              1822.925869
            ],
            [
              -1359.242748,
              1531.647035
            ],
            [
              -969.078608,
              1347.216895
            ],
            [
              -699.854834,
              1219.955128
            ],
            [
              -502.884816,
              1126.847627
            ],
            [
              -352.522929,
              1055.771737
            ],
            [
              -233.976345,
              999.734903
            ],
            [
              -138.113384,
              954.420592
            ],
            [
              -58.991866,
              917.019942
            ],
            [
              7.421587,
              885.626379
            ],
            [
              63.96103,
              858.90025
            ]
          ],
          [
            [
              488.313286,
              858.90025
            ],
            [
              465.852411,
              835.570463
            ],
            [
              439.468985,
              808.166377
            ],
            [
              408.037149,
              775.518582
            ],
            [
              369.954603,
              735.962789
            ],
            [
              322.860754,
              687.047086
            ],
            [
              263.12795,
              625.003482
            ],
            [
              184.879586,
              543.728033
            ],
            [
              77.927676,
              432.638623
            ],
            [
              -77.069037,
              271.645767
            ],
            [
              -321.862335,
              17.382491
            ],
            [
              -321.862335,
              1822.925869
            ],
            [
              -77.069037,
              1531.647035
            ],
            [
              77.927676,
              1347.216895
            ],
            [
              184.879586,
              1219.955128
            ],
            [
              263.12795,
              1126.847627
            ],
            [
              322.860754,
              1055.771737
            ],
            [
              369.954603,
              999.734903
            ],
            [
              408.037149,
              954.420592
            ],
            [
              439.468985,
              917.019942
            ],
            [
              465.852411,
              885.626379
            ],
            [
              488.313286,
              858.90025
            ]
          ]
        ],
        "floor_poly": [
          [
            63.96103,
            858.90025
          ],
          [
            7.421587,
            885.626379
          ],
          [
            -58.991866,
            917.019942
          ],
          [
            -138.113384,
            954.420592
          ],
          [
            -233.976345,
            999.734903
          ],
          [
            -352.522929,
            1055.771737
          ],
          [
            -502.884816,
            1126.847627
          ],
          [
            -699.854834,
            1219.955128
          ],
          [
            -969.078608,
            1347.216895
          ],
          [
            -1359.242748,
            1531.647035
          ],
          [
            -1975.446567,
            1822.925869
          ],
          [
            -321.862335,
            1822.925869
          ],
          [
            -77.069037,
            1531.647035
          ],
          [
            77.927676,
            1347.216895
          ],
          [
            184.879586,
            1219.955128
          ],
          [
            263.12795,
            1126.847627
          ],
          [
            322.860754,
            1055.771737
          ],
          [
            369.954603,
            999.734903
          ],
          [
            408.037149,
            954.420592
          ],
          [
            439.468985,
            917.019942
          ],
          [
            465.852411,
            885.626379
          ],
          [
            488.313286,
            858.90025
          ]
        ],
        "well_poly": [
          [
            63.96103,
            71.20715
          ],
          [
            7.421587,
            34.675803
          ],
          [
            -58.991866,
            -8.235355
          ],
          [
            -138.113384,
            -59.357466
          ],
          [
            -233.976345,
            -121.296583
          ],
          [
            -352.522929,
            -197.892076
          ],
          [
            -502.884816,
            -295.044118
          ],
          [
            -699.854834,
            -422.310675
          ],
          [
            -969.078608,
            -596.261934
          ],
          [
            -1359.242748,
            -848.355359
          ],
          [
            -77.069037,
            -848.355359
          ],
          [
            77.927676,
            -596.261934
          ],
          [
            184.879586,
            -422.310675
          ],
          [
            263.12795,
            -295.044118
          ],
          [
            322.860754,
            -197.892076
          ],
          [
            369.954603,
            -121.296583
          ],
          [
            408.037149,
            -59.357466
          ],
          [
            439.468985,
            -8.235355
          ],
          [
            465.852411,
            34.675803
          ],
          [
            488.313286,
            71.20715
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "back_stair_head/N": {
    "floor_line_y": 0.864258,
    "px_per_m_at_wall": 315.789,
    "px_per_m_at_bottom": 442.84,
    "wall_width_m": 5.45,
    "key_tint": "#c88f57",
    "image_h_px": 1024,
    "horizon_y": 0.526855,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 300,
    "camera_wall_m": 3.11,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 102,
    "corner_x1_px": 1430,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/back_stair_head-N/row23-c08999db.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 982.1,
    "nearest_floor_m": 2.2177,
    "measured_room": {
      "storey_height_m": 2.597,
      "wall_width_m": 4.205,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": []
    },
    "openings": []
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
    "stairs": [
      {
        "id": "back_stair_flight",
        "kind": "stair",
        "via": null,
        "direction": "down",
        "treads": 17,
        "rise_m": 2.8,
        "x": 969.192412,
        "y": 854.390515,
        "w": 566.807588,
        "h": 169.60948499999995,
        "raw_w": 1697.7675400000003,
        "raw_h": 1003.6473819999999,
        "hit_polys": [
          [
            [
              1808.602686,
              1858.037897
            ],
            [
              1672.343866,
              1602.014147
            ],
            [
              1567.637553,
              1405.276038
            ],
            [
              1484.661403,
              1249.367855
            ],
            [
              1417.286736,
              1122.774106
            ],
            [
              1361.4915,
              1017.937549
            ],
            [
              1314.52675,
              929.69305
            ],
            [
              1274.449864,
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
            ]
          ],
          [
            [
              1181.390108,
              1858.037897
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              985.113367,
              929.69305
            ],
            [
              969.192412,
              854.390515
            ],
            [
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ]
          ],
          [
            [
              1808.602686,
              1858.037897
            ],
            [
              1181.390108,
              1858.037897
            ],
            [
              1127.259892,
              1683.630999
            ],
            [
              1672.343866,
              1683.630999
            ]
          ],
          [
            [
              1672.343866,
              1683.630999
            ],
            [
              1127.259892,
              1683.630999
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1672.343866,
              1602.014147
            ]
          ],
          [
            [
              1672.343866,
              1602.014147
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1085.664234,
              1477.443166
            ],
            [
              1567.637553,
              1477.443166
            ]
          ],
          [
            [
              1567.637553,
              1477.443166
            ],
            [
              1085.664234,
              1477.443166
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1567.637553,
              1405.276038
            ]
          ],
          [
            [
              1567.637553,
              1405.276038
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1052.701105,
              1314.046402
            ],
            [
              1484.661403,
              1314.046402
            ]
          ],
          [
            [
              1484.661403,
              1314.046402
            ],
            [
              1052.701105,
              1314.046402
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1484.661403,
              1249.367855
            ]
          ],
          [
            [
              1484.661403,
              1249.367855
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1025.935827,
              1181.372103
            ],
            [
              1417.286736,
              1181.372103
            ]
          ],
          [
            [
              1417.286736,
              1181.372103
            ],
            [
              1025.935827,
              1181.372103
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1417.286736,
              1122.774106
            ]
          ],
          [
            [
              1417.286736,
              1122.774106
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1003.770596,
              1071.500037
            ],
            [
              1361.4915,
              1071.500037
            ]
          ],
          [
            [
              1361.4915,
              1071.500037
            ],
            [
              1003.770596,
              1071.500037
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              1361.4915,
              1017.937549
            ]
          ],
          [
            [
              1361.4915,
              1017.937549
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              985.113367,
              979.016979
            ],
            [
              1314.52675,
              979.016979
            ]
          ],
          [
            [
              1314.52675,
              979.016979
            ],
            [
              985.113367,
              979.016979
            ],
            [
              985.113367,
              929.69305
            ],
            [
              1314.52675,
              929.69305
            ]
          ],
          [
            [
              1314.52675,
              929.69305
            ],
            [
              985.113367,
              929.69305
            ],
            [
              969.192412,
              900.097513
            ],
            [
              1274.449864,
              900.097513
            ]
          ],
          [
            [
              1274.449864,
              900.097513
            ],
            [
              969.192412,
              900.097513
            ],
            [
              969.192412,
              854.390515
            ],
            [
              1274.449864,
              854.390515
            ]
          ],
          [
            [
              2666.959952,
              1757.042259
            ],
            [
              2257.432724,
              1491.578856
            ],
            [
              1993.206325,
              1320.302237
            ],
            [
              1808.602686,
              1200.638618
            ],
            [
              1672.343866,
              1112.313037
            ],
            [
              1567.637553,
              1044.440398
            ],
            [
              1484.661403,
              990.653666
            ],
            [
              1417.286736,
              946.980114
            ],
            [
              1361.4915,
              910.812572
            ],
            [
              1314.52675,
              880.369121
            ],
            [
              1274.449864,
              854.390515
            ],
            [
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ],
            [
              1254.7258,
              1320.302237
            ],
            [
              1359.692452,
              1491.578856
            ],
            [
              1522.381351,
              1757.042259
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              1808.602686,
              1858.037897
            ],
            [
              1181.390108,
              1858.037897
            ],
            [
              1127.259892,
              1683.630999
            ],
            [
              1672.343866,
              1683.630999
            ]
          ],
          [
            [
              1672.343866,
              1683.630999
            ],
            [
              1127.259892,
              1683.630999
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1672.343866,
              1602.014147
            ]
          ],
          [
            [
              1672.343866,
              1602.014147
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1085.664234,
              1477.443166
            ],
            [
              1567.637553,
              1477.443166
            ]
          ],
          [
            [
              1567.637553,
              1477.443166
            ],
            [
              1085.664234,
              1477.443166
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1567.637553,
              1405.276038
            ]
          ],
          [
            [
              1567.637553,
              1405.276038
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1052.701105,
              1314.046402
            ],
            [
              1484.661403,
              1314.046402
            ]
          ],
          [
            [
              1484.661403,
              1314.046402
            ],
            [
              1052.701105,
              1314.046402
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1484.661403,
              1249.367855
            ]
          ],
          [
            [
              1484.661403,
              1249.367855
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1025.935827,
              1181.372103
            ],
            [
              1417.286736,
              1181.372103
            ]
          ],
          [
            [
              1417.286736,
              1181.372103
            ],
            [
              1025.935827,
              1181.372103
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1417.286736,
              1122.774106
            ]
          ],
          [
            [
              1417.286736,
              1122.774106
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1003.770596,
              1071.500037
            ],
            [
              1361.4915,
              1071.500037
            ]
          ],
          [
            [
              1361.4915,
              1071.500037
            ],
            [
              1003.770596,
              1071.500037
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              1361.4915,
              1017.937549
            ]
          ],
          [
            [
              1361.4915,
              1017.937549
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              985.113367,
              979.016979
            ],
            [
              1314.52675,
              979.016979
            ]
          ],
          [
            [
              1314.52675,
              979.016979
            ],
            [
              985.113367,
              979.016979
            ],
            [
              985.113367,
              929.69305
            ],
            [
              1314.52675,
              929.69305
            ]
          ],
          [
            [
              1314.52675,
              929.69305
            ],
            [
              985.113367,
              929.69305
            ],
            [
              969.192412,
              900.097513
            ],
            [
              1274.449864,
              900.097513
            ]
          ],
          [
            [
              1274.449864,
              900.097513
            ],
            [
              969.192412,
              900.097513
            ],
            [
              969.192412,
              854.390515
            ],
            [
              1274.449864,
              854.390515
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "mass_normal": [
          [
            1,
            0,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              1808.602686,
              1858.037897
            ],
            [
              1181.390108,
              1858.037897
            ]
          ],
          [
            [
              1672.343866,
              1602.014147
            ],
            [
              1127.259892,
              1602.014147
            ]
          ],
          [
            [
              1567.637553,
              1405.276038
            ],
            [
              1085.664234,
              1405.276038
            ]
          ],
          [
            [
              1484.661403,
              1249.367855
            ],
            [
              1052.701105,
              1249.367855
            ]
          ],
          [
            [
              1417.286736,
              1122.774106
            ],
            [
              1025.935827,
              1122.774106
            ]
          ],
          [
            [
              1361.4915,
              1017.937549
            ],
            [
              1003.770596,
              1017.937549
            ]
          ],
          [
            [
              1314.52675,
              929.69305
            ],
            [
              985.113367,
              929.69305
            ]
          ],
          [
            [
              1274.449864,
              854.390515
            ],
            [
              969.192412,
              854.390515
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              1808.602686,
              1858.037897
            ],
            [
              1672.343866,
              1602.014147
            ],
            [
              1567.637553,
              1405.276038
            ],
            [
              1484.661403,
              1249.367855
            ],
            [
              1417.286736,
              1122.774106
            ],
            [
              1361.4915,
              1017.937549
            ],
            [
              1314.52675,
              929.69305
            ],
            [
              1274.449864,
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
            ]
          ],
          [
            [
              1181.390108,
              1858.037897
            ],
            [
              1127.259892,
              1602.014147
            ],
            [
              1085.664234,
              1405.276038
            ],
            [
              1052.701105,
              1249.367855
            ],
            [
              1025.935827,
              1122.774106
            ],
            [
              1003.770596,
              1017.937549
            ],
            [
              985.113367,
              929.69305
            ],
            [
              969.192412,
              854.390515
            ],
            [
              969.192412,
              854.390515
            ],
            [
              985.113367,
              880.369121
            ],
            [
              1003.770596,
              910.812572
            ],
            [
              1025.935827,
              946.980114
            ],
            [
              1052.701105,
              990.653666
            ],
            [
              1085.664234,
              1044.440398
            ],
            [
              1127.259892,
              1112.313037
            ],
            [
              1181.390108,
              1200.638618
            ]
          ]
        ],
        "floor_poly": [
          [
            2666.959952,
            1757.042259
          ],
          [
            2257.432724,
            1491.578856
          ],
          [
            1993.206325,
            1320.302237
          ],
          [
            1808.602686,
            1200.638618
          ],
          [
            1672.343866,
            1112.313037
          ],
          [
            1567.637553,
            1044.440398
          ],
          [
            1484.661403,
            990.653666
          ],
          [
            1417.286736,
            946.980114
          ],
          [
            1361.4915,
            910.812572
          ],
          [
            1314.52675,
            880.369121
          ],
          [
            1274.449864,
            854.390515
          ],
          [
            969.192412,
            854.390515
          ],
          [
            985.113367,
            880.369121
          ],
          [
            1003.770596,
            910.812572
          ],
          [
            1025.935827,
            946.980114
          ],
          [
            1052.701105,
            990.653666
          ],
          [
            1085.664234,
            1044.440398
          ],
          [
            1127.259892,
            1112.313037
          ],
          [
            1181.390108,
            1200.638618
          ],
          [
            1254.7258,
            1320.302237
          ],
          [
            1359.692452,
            1491.578856
          ],
          [
            1522.381351,
            1757.042259
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "back_stair_head/S": {
    "floor_line_y": 0.833499,
    "px_per_m_at_wall": 276.757,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 5.45,
    "key_tint": "#c89e72",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 263,
    "camera_wall_m": 3.7,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 125.31,
    "corner_x1_px": 1410.69,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/back_stair_head-S/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.193,
      "wall_width_m": 4.645,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [],
      "flight_evidence": {
        "read": true,
        "ratio": 1.4313,
        "body_px": 151478,
        "ring_px": 44634,
        "body_edge": 44.825,
        "ring_edge": 31.317,
        "why": null,
        "asked": {
          "prompt": "backdrops/source/back_stair_head-S/row23-4df7ac87.prompt.txt",
          "via": "the roll this snapped frame was rectified from (backdrops/source/back_stair_head-S/row23-4df7ac87.png)"
        },
        "geometry": "snapped onto the declared camera; the u-domain is this painting's own corners",
        "against_the_ask": [
          {
            "id": "back_stair_flight",
            "agreed_px": 146870,
            "disputed_px": 25704,
            "agreed_of_union": 0.851,
            "aim_of_this_lands_on_the_ask": true,
            "aim_of_the_ask_lands_on_this": true,
            "apart_px": 10.1,
            "apart_m": 0.036,
            "over": false
          }
        ]
      }
    },
    "openings": [],
    "stairs": [
      {
        "id": "back_stair_flight",
        "kind": "stair",
        "via": null,
        "direction": "down",
        "treads": 17,
        "rise_m": 2.8,
        "x": 0,
        "y": 877.227802,
        "w": 1536,
        "h": 146.772198,
        "raw_w": 1708.152848,
        "raw_h": 1169.134372,
        "hit_polys": [
          [
            [
              1138.110864,
              1561.641021
            ],
            [
              1069.668252,
              1512.754362
            ],
            [
              1001.22564,
              1463.867704
            ],
            [
              932.783028,
              1414.981045
            ],
            [
              864.340416,
              1366.094387
            ],
            [
              795.897804,
              1317.207728
            ],
            [
              727.455192,
              1268.32107
            ],
            [
              659.01258,
              1219.434411
            ],
            [
              590.569968,
              1170.547753
            ],
            [
              522.127356,
              1121.661094
            ],
            [
              453.684744,
              1072.774436
            ],
            [
              385.242132,
              1023.887778
            ],
            [
              316.79952,
              975.001119
            ],
            [
              248.356908,
              926.114461
            ],
            [
              179.914296,
              877.227802
            ],
            [
              179.914296,
              877.227802
            ],
            [
              248.356908,
              877.227802
            ],
            [
              316.79952,
              877.227802
            ],
            [
              385.242132,
              877.227802
            ],
            [
              453.684744,
              877.227802
            ],
            [
              522.127356,
              877.227802
            ],
            [
              590.569968,
              877.227802
            ],
            [
              659.01258,
              877.227802
            ],
            [
              727.455192,
              877.227802
            ],
            [
              795.897804,
              877.227802
            ],
            [
              864.340416,
              877.227802
            ],
            [
              932.783028,
              877.227802
            ],
            [
              1001.22564,
              877.227802
            ],
            [
              1069.668252,
              877.227802
            ],
            [
              1138.110864,
              877.227802
            ]
          ],
          [
            [
              1311.354247,
              2046.362174
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              5.119716,
              1041.58532
            ],
            [
              105.599295,
              1041.58532
            ],
            [
              206.078875,
              1041.58532
            ],
            [
              306.558454,
              1041.58532
            ],
            [
              407.038033,
              1041.58532
            ],
            [
              507.517612,
              1041.58532
            ],
            [
              607.997192,
              1041.58532
            ],
            [
              708.476771,
              1041.58532
            ],
            [
              808.95635,
              1041.58532
            ],
            [
              909.43593,
              1041.58532
            ],
            [
              1009.915509,
              1041.58532
            ],
            [
              1110.395088,
              1041.58532
            ],
            [
              1210.874667,
              1041.58532
            ],
            [
              1311.354247,
              1041.58532
            ]
          ],
          [
            [
              1138.110864,
              1561.641021
            ],
            [
              1311.354247,
              2046.362174
            ],
            [
              1210.874667,
              2046.362174
            ],
            [
              1069.668252,
              1561.641021
            ]
          ],
          [
            [
              1069.668252,
              1561.641021
            ],
            [
              1210.874667,
              2046.362174
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1069.668252,
              1512.754362
            ]
          ],
          [
            [
              1069.668252,
              1512.754362
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1110.395088,
              1974.592398
            ],
            [
              1001.22564,
              1512.754362
            ]
          ],
          [
            [
              1001.22564,
              1512.754362
            ],
            [
              1110.395088,
              1974.592398
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1001.22564,
              1463.867704
            ]
          ],
          [
            [
              1001.22564,
              1463.867704
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1009.915509,
              1902.822623
            ],
            [
              932.783028,
              1463.867704
            ]
          ],
          [
            [
              932.783028,
              1463.867704
            ],
            [
              1009.915509,
              1902.822623
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              932.783028,
              1414.981045
            ]
          ],
          [
            [
              932.783028,
              1414.981045
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              909.43593,
              1831.052848
            ],
            [
              864.340416,
              1414.981045
            ]
          ],
          [
            [
              864.340416,
              1414.981045
            ],
            [
              909.43593,
              1831.052848
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              864.340416,
              1366.094387
            ]
          ],
          [
            [
              864.340416,
              1366.094387
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              808.95635,
              1759.283073
            ],
            [
              795.897804,
              1366.094387
            ]
          ],
          [
            [
              795.897804,
              1366.094387
            ],
            [
              808.95635,
              1759.283073
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              795.897804,
              1317.207728
            ]
          ],
          [
            [
              795.897804,
              1317.207728
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              708.476771,
              1687.513297
            ],
            [
              727.455192,
              1317.207728
            ]
          ],
          [
            [
              727.455192,
              1317.207728
            ],
            [
              708.476771,
              1687.513297
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              727.455192,
              1268.32107
            ]
          ],
          [
            [
              727.455192,
              1268.32107
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              607.997192,
              1615.743522
            ],
            [
              659.01258,
              1268.32107
            ]
          ],
          [
            [
              659.01258,
              1268.32107
            ],
            [
              607.997192,
              1615.743522
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              659.01258,
              1219.434411
            ]
          ],
          [
            [
              659.01258,
              1219.434411
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              507.517612,
              1543.973747
            ],
            [
              590.569968,
              1219.434411
            ]
          ],
          [
            [
              590.569968,
              1219.434411
            ],
            [
              507.517612,
              1543.973747
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              590.569968,
              1170.547753
            ]
          ],
          [
            [
              590.569968,
              1170.547753
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              407.038033,
              1472.203972
            ],
            [
              522.127356,
              1170.547753
            ]
          ],
          [
            [
              522.127356,
              1170.547753
            ],
            [
              407.038033,
              1472.203972
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              522.127356,
              1121.661094
            ]
          ],
          [
            [
              522.127356,
              1121.661094
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              306.558454,
              1400.434197
            ],
            [
              453.684744,
              1121.661094
            ]
          ],
          [
            [
              453.684744,
              1121.661094
            ],
            [
              306.558454,
              1400.434197
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              453.684744,
              1072.774436
            ]
          ],
          [
            [
              453.684744,
              1072.774436
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              206.078875,
              1328.664421
            ],
            [
              385.242132,
              1072.774436
            ]
          ],
          [
            [
              385.242132,
              1072.774436
            ],
            [
              206.078875,
              1328.664421
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              385.242132,
              1023.887778
            ]
          ],
          [
            [
              385.242132,
              1023.887778
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              105.599295,
              1256.894646
            ],
            [
              316.79952,
              1023.887778
            ]
          ],
          [
            [
              316.79952,
              1023.887778
            ],
            [
              105.599295,
              1256.894646
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              316.79952,
              975.001119
            ]
          ],
          [
            [
              316.79952,
              975.001119
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              5.119716,
              1185.124871
            ],
            [
              248.356908,
              975.001119
            ]
          ],
          [
            [
              248.356908,
              975.001119
            ],
            [
              5.119716,
              1185.124871
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              248.356908,
              926.114461
            ]
          ],
          [
            [
              248.356908,
              926.114461
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              -95.359863,
              1113.355096
            ],
            [
              179.914296,
              926.114461
            ]
          ],
          [
            [
              179.914296,
              926.114461
            ],
            [
              -95.359863,
              1113.355096
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              179.914296,
              877.227802
            ]
          ],
          [
            [
              1343.4387,
              877.227802
            ],
            [
              1274.996088,
              877.227802
            ],
            [
              1206.553476,
              877.227802
            ],
            [
              1138.110864,
              877.227802
            ],
            [
              1069.668252,
              877.227802
            ],
            [
              1001.22564,
              877.227802
            ],
            [
              932.783028,
              877.227802
            ],
            [
              864.340416,
              877.227802
            ],
            [
              795.897804,
              877.227802
            ],
            [
              727.455192,
              877.227802
            ],
            [
              659.01258,
              877.227802
            ],
            [
              590.569968,
              877.227802
            ],
            [
              522.127356,
              877.227802
            ],
            [
              453.684744,
              877.227802
            ],
            [
              385.242132,
              877.227802
            ],
            [
              316.79952,
              877.227802
            ],
            [
              248.356908,
              877.227802
            ],
            [
              179.914296,
              877.227802
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              5.119716,
              1041.58532
            ],
            [
              105.599295,
              1041.58532
            ],
            [
              206.078875,
              1041.58532
            ],
            [
              306.558454,
              1041.58532
            ],
            [
              407.038033,
              1041.58532
            ],
            [
              507.517612,
              1041.58532
            ],
            [
              607.997192,
              1041.58532
            ],
            [
              708.476771,
              1041.58532
            ],
            [
              808.95635,
              1041.58532
            ],
            [
              909.43593,
              1041.58532
            ],
            [
              1009.915509,
              1041.58532
            ],
            [
              1110.395088,
              1041.58532
            ],
            [
              1210.874667,
              1041.58532
            ],
            [
              1311.354247,
              1041.58532
            ],
            [
              1411.833826,
              1041.58532
            ],
            [
              1512.313405,
              1041.58532
            ],
            [
              1612.792985,
              1041.58532
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              1138.110864,
              1561.641021
            ],
            [
              1311.354247,
              2046.362174
            ],
            [
              1210.874667,
              2046.362174
            ],
            [
              1069.668252,
              1561.641021
            ]
          ],
          [
            [
              1069.668252,
              1561.641021
            ],
            [
              1210.874667,
              2046.362174
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1069.668252,
              1512.754362
            ]
          ],
          [
            [
              1069.668252,
              1512.754362
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1110.395088,
              1974.592398
            ],
            [
              1001.22564,
              1512.754362
            ]
          ],
          [
            [
              1001.22564,
              1512.754362
            ],
            [
              1110.395088,
              1974.592398
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1001.22564,
              1463.867704
            ]
          ],
          [
            [
              1001.22564,
              1463.867704
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1009.915509,
              1902.822623
            ],
            [
              932.783028,
              1463.867704
            ]
          ],
          [
            [
              932.783028,
              1463.867704
            ],
            [
              1009.915509,
              1902.822623
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              932.783028,
              1414.981045
            ]
          ],
          [
            [
              932.783028,
              1414.981045
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              909.43593,
              1831.052848
            ],
            [
              864.340416,
              1414.981045
            ]
          ],
          [
            [
              864.340416,
              1414.981045
            ],
            [
              909.43593,
              1831.052848
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              864.340416,
              1366.094387
            ]
          ],
          [
            [
              864.340416,
              1366.094387
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              808.95635,
              1759.283073
            ],
            [
              795.897804,
              1366.094387
            ]
          ],
          [
            [
              795.897804,
              1366.094387
            ],
            [
              808.95635,
              1759.283073
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              795.897804,
              1317.207728
            ]
          ],
          [
            [
              795.897804,
              1317.207728
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              708.476771,
              1687.513297
            ],
            [
              727.455192,
              1317.207728
            ]
          ],
          [
            [
              727.455192,
              1317.207728
            ],
            [
              708.476771,
              1687.513297
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              727.455192,
              1268.32107
            ]
          ],
          [
            [
              727.455192,
              1268.32107
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              607.997192,
              1615.743522
            ],
            [
              659.01258,
              1268.32107
            ]
          ],
          [
            [
              659.01258,
              1268.32107
            ],
            [
              607.997192,
              1615.743522
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              659.01258,
              1219.434411
            ]
          ],
          [
            [
              659.01258,
              1219.434411
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              507.517612,
              1543.973747
            ],
            [
              590.569968,
              1219.434411
            ]
          ],
          [
            [
              590.569968,
              1219.434411
            ],
            [
              507.517612,
              1543.973747
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              590.569968,
              1170.547753
            ]
          ],
          [
            [
              590.569968,
              1170.547753
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              407.038033,
              1472.203972
            ],
            [
              522.127356,
              1170.547753
            ]
          ],
          [
            [
              522.127356,
              1170.547753
            ],
            [
              407.038033,
              1472.203972
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              522.127356,
              1121.661094
            ]
          ],
          [
            [
              522.127356,
              1121.661094
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              306.558454,
              1400.434197
            ],
            [
              453.684744,
              1121.661094
            ]
          ],
          [
            [
              453.684744,
              1121.661094
            ],
            [
              306.558454,
              1400.434197
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              453.684744,
              1072.774436
            ]
          ],
          [
            [
              453.684744,
              1072.774436
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              206.078875,
              1328.664421
            ],
            [
              385.242132,
              1072.774436
            ]
          ],
          [
            [
              385.242132,
              1072.774436
            ],
            [
              206.078875,
              1328.664421
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              385.242132,
              1023.887778
            ]
          ],
          [
            [
              385.242132,
              1023.887778
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              105.599295,
              1256.894646
            ],
            [
              316.79952,
              1023.887778
            ]
          ],
          [
            [
              316.79952,
              1023.887778
            ],
            [
              105.599295,
              1256.894646
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              316.79952,
              975.001119
            ]
          ],
          [
            [
              316.79952,
              975.001119
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              5.119716,
              1185.124871
            ],
            [
              248.356908,
              975.001119
            ]
          ],
          [
            [
              248.356908,
              975.001119
            ],
            [
              5.119716,
              1185.124871
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              248.356908,
              926.114461
            ]
          ],
          [
            [
              248.356908,
              926.114461
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              -95.359863,
              1113.355096
            ],
            [
              179.914296,
              926.114461
            ]
          ],
          [
            [
              179.914296,
              926.114461
            ],
            [
              -95.359863,
              1113.355096
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              179.914296,
              877.227802
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ]
        ],
        "mass_normal": [
          [
            0,
            1,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "noses": [
          [
            [
              1138.110864,
              1561.641021
            ],
            [
              1311.354247,
              2046.362174
            ]
          ],
          [
            [
              1069.668252,
              1512.754362
            ],
            [
              1210.874667,
              1974.592398
            ]
          ],
          [
            [
              1001.22564,
              1463.867704
            ],
            [
              1110.395088,
              1902.822623
            ]
          ],
          [
            [
              932.783028,
              1414.981045
            ],
            [
              1009.915509,
              1831.052848
            ]
          ],
          [
            [
              864.340416,
              1366.094387
            ],
            [
              909.43593,
              1759.283073
            ]
          ],
          [
            [
              795.897804,
              1317.207728
            ],
            [
              808.95635,
              1687.513297
            ]
          ],
          [
            [
              727.455192,
              1268.32107
            ],
            [
              708.476771,
              1615.743522
            ]
          ],
          [
            [
              659.01258,
              1219.434411
            ],
            [
              607.997192,
              1543.973747
            ]
          ],
          [
            [
              590.569968,
              1170.547753
            ],
            [
              507.517612,
              1472.203972
            ]
          ],
          [
            [
              522.127356,
              1121.661094
            ],
            [
              407.038033,
              1400.434197
            ]
          ],
          [
            [
              453.684744,
              1072.774436
            ],
            [
              306.558454,
              1328.664421
            ]
          ],
          [
            [
              385.242132,
              1023.887778
            ],
            [
              206.078875,
              1256.894646
            ]
          ],
          [
            [
              316.79952,
              975.001119
            ],
            [
              105.599295,
              1185.124871
            ]
          ],
          [
            [
              248.356908,
              926.114461
            ],
            [
              5.119716,
              1113.355096
            ]
          ],
          [
            [
              179.914296,
              877.227802
            ],
            [
              -95.359863,
              1041.58532
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              1138.110864,
              1561.641021
            ],
            [
              1069.668252,
              1512.754362
            ],
            [
              1001.22564,
              1463.867704
            ],
            [
              932.783028,
              1414.981045
            ],
            [
              864.340416,
              1366.094387
            ],
            [
              795.897804,
              1317.207728
            ],
            [
              727.455192,
              1268.32107
            ],
            [
              659.01258,
              1219.434411
            ],
            [
              590.569968,
              1170.547753
            ],
            [
              522.127356,
              1121.661094
            ],
            [
              453.684744,
              1072.774436
            ],
            [
              385.242132,
              1023.887778
            ],
            [
              316.79952,
              975.001119
            ],
            [
              248.356908,
              926.114461
            ],
            [
              179.914296,
              877.227802
            ],
            [
              179.914296,
              877.227802
            ],
            [
              248.356908,
              877.227802
            ],
            [
              316.79952,
              877.227802
            ],
            [
              385.242132,
              877.227802
            ],
            [
              453.684744,
              877.227802
            ],
            [
              522.127356,
              877.227802
            ],
            [
              590.569968,
              877.227802
            ],
            [
              659.01258,
              877.227802
            ],
            [
              727.455192,
              877.227802
            ],
            [
              795.897804,
              877.227802
            ],
            [
              864.340416,
              877.227802
            ],
            [
              932.783028,
              877.227802
            ],
            [
              1001.22564,
              877.227802
            ],
            [
              1069.668252,
              877.227802
            ],
            [
              1138.110864,
              877.227802
            ]
          ],
          [
            [
              1311.354247,
              2046.362174
            ],
            [
              1210.874667,
              1974.592398
            ],
            [
              1110.395088,
              1902.822623
            ],
            [
              1009.915509,
              1831.052848
            ],
            [
              909.43593,
              1759.283073
            ],
            [
              808.95635,
              1687.513297
            ],
            [
              708.476771,
              1615.743522
            ],
            [
              607.997192,
              1543.973747
            ],
            [
              507.517612,
              1472.203972
            ],
            [
              407.038033,
              1400.434197
            ],
            [
              306.558454,
              1328.664421
            ],
            [
              206.078875,
              1256.894646
            ],
            [
              105.599295,
              1185.124871
            ],
            [
              5.119716,
              1113.355096
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              -95.359863,
              1041.58532
            ],
            [
              5.119716,
              1041.58532
            ],
            [
              105.599295,
              1041.58532
            ],
            [
              206.078875,
              1041.58532
            ],
            [
              306.558454,
              1041.58532
            ],
            [
              407.038033,
              1041.58532
            ],
            [
              507.517612,
              1041.58532
            ],
            [
              607.997192,
              1041.58532
            ],
            [
              708.476771,
              1041.58532
            ],
            [
              808.95635,
              1041.58532
            ],
            [
              909.43593,
              1041.58532
            ],
            [
              1009.915509,
              1041.58532
            ],
            [
              1110.395088,
              1041.58532
            ],
            [
              1210.874667,
              1041.58532
            ],
            [
              1311.354247,
              1041.58532
            ]
          ]
        ],
        "floor_poly": [
          [
            1343.4387,
            877.227802
          ],
          [
            1274.996088,
            877.227802
          ],
          [
            1206.553476,
            877.227802
          ],
          [
            1138.110864,
            877.227802
          ],
          [
            1069.668252,
            877.227802
          ],
          [
            1001.22564,
            877.227802
          ],
          [
            932.783028,
            877.227802
          ],
          [
            864.340416,
            877.227802
          ],
          [
            795.897804,
            877.227802
          ],
          [
            727.455192,
            877.227802
          ],
          [
            659.01258,
            877.227802
          ],
          [
            590.569968,
            877.227802
          ],
          [
            522.127356,
            877.227802
          ],
          [
            453.684744,
            877.227802
          ],
          [
            385.242132,
            877.227802
          ],
          [
            316.79952,
            877.227802
          ],
          [
            248.356908,
            877.227802
          ],
          [
            179.914296,
            877.227802
          ],
          [
            -95.359863,
            1041.58532
          ],
          [
            5.119716,
            1041.58532
          ],
          [
            105.599295,
            1041.58532
          ],
          [
            206.078875,
            1041.58532
          ],
          [
            306.558454,
            1041.58532
          ],
          [
            407.038033,
            1041.58532
          ],
          [
            507.517612,
            1041.58532
          ],
          [
            607.997192,
            1041.58532
          ],
          [
            708.476771,
            1041.58532
          ],
          [
            808.95635,
            1041.58532
          ],
          [
            909.43593,
            1041.58532
          ],
          [
            1009.915509,
            1041.58532
          ],
          [
            1110.395088,
            1041.58532
          ],
          [
            1210.874667,
            1041.58532
          ],
          [
            1311.354247,
            1041.58532
          ],
          [
            1411.833826,
            1041.58532
          ],
          [
            1512.313405,
            1041.58532
          ],
          [
            1612.792985,
            1041.58532
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
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
        "x": 0,
        "y": 858.9,
        "w": 564.043956,
        "h": 165.10000000000002,
        "raw_w": 1796.64849,
        "raw_h": 1187.9953329999998,
        "hit_polys": [
          [
            [
              254.593407,
              1646.592308
            ],
            [
              213.363128,
              1686.520112
            ],
            [
              164.932422,
              1733.420881
            ],
            [
              107.234609,
              1789.296007
            ],
            [
              37.328427,
              1856.993836
            ],
            [
              -49.119342,
              1940.7107
            ],
            [
              -158.767795,
              2046.895333
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
            ]
          ],
          [
            [
              564.043956,
              1646.592308
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              399.831972,
              2046.895333
            ],
            [
              399.831972,
              1126.848658
            ],
            [
              443.390947,
              1055.772428
            ],
            [
              477.733211,
              999.735327
            ],
            [
              505.50416,
              954.420799
            ],
            [
              528.425209,
              917.01997
            ],
            [
              547.664804,
              885.626257
            ],
            [
              564.043956,
              858.9
            ]
          ],
          [
            [
              254.593407,
              1646.592308
            ],
            [
              564.043956,
              1646.592308
            ],
            [
              547.664804,
              1736.575978
            ],
            [
              213.363128,
              1736.575978
            ]
          ],
          [
            [
              213.363128,
              1736.575978
            ],
            [
              547.664804,
              1736.575978
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              213.363128,
              1686.520112
            ]
          ],
          [
            [
              213.363128,
              1686.520112
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              528.425209,
              1787.847608
            ],
            [
              164.932422,
              1787.847608
            ]
          ],
          [
            [
              164.932422,
              1787.847608
            ],
            [
              528.425209,
              1787.847608
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              164.932422,
              1733.420881
            ]
          ],
          [
            [
              164.932422,
              1733.420881
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              505.50416,
              1848.92995
            ],
            [
              107.234609,
              1848.92995
            ]
          ],
          [
            [
              107.234609,
              1848.92995
            ],
            [
              505.50416,
              1848.92995
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              107.234609,
              1789.296007
            ]
          ],
          [
            [
              107.234609,
              1789.296007
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              477.733211,
              1922.936799
            ],
            [
              37.328427,
              1922.936799
            ]
          ],
          [
            [
              37.328427,
              1922.936799
            ],
            [
              477.733211,
              1922.936799
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              37.328427,
              1856.993836
            ]
          ],
          [
            [
              37.328427,
              1856.993836
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              443.390947,
              2014.455556
            ],
            [
              -49.119342,
              2014.455556
            ]
          ],
          [
            [
              -49.119342,
              2014.455556
            ],
            [
              443.390947,
              2014.455556
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              -49.119342,
              1940.7107
            ]
          ],
          [
            [
              -49.119342,
              1940.7107
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              399.831972,
              2046.895333
            ],
            [
              -158.767795,
              2046.895333
            ]
          ],
          [
            [
              254.593407,
              858.9
            ],
            [
              213.363128,
              885.626257
            ],
            [
              164.932422,
              917.01997
            ],
            [
              107.234609,
              954.420799
            ],
            [
              37.328427,
              999.735327
            ],
            [
              -49.119342,
              1055.772428
            ],
            [
              -158.767795,
              1126.848658
            ],
            [
              -302.404313,
              1219.956604
            ],
            [
              -498.730463,
              1347.218979
            ],
            [
              -783.25,
              1531.65
            ],
            [
              -1232.604534,
              1822.930227
            ],
            [
              -26.760705,
              1822.930227
            ],
            [
              151.75,
              1531.65
            ],
            [
              264.778309,
              1347.218979
            ],
            [
              342.770889,
              1219.956604
            ],
            [
              399.831972,
              1126.848658
            ],
            [
              443.390947,
              1055.772428
            ],
            [
              477.733211,
              999.735327
            ],
            [
              505.50416,
              954.420799
            ],
            [
              528.425209,
              917.01997
            ],
            [
              547.664804,
              885.626257
            ],
            [
              564.043956,
              858.9
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              254.593407,
              1646.592308
            ],
            [
              564.043956,
              1646.592308
            ],
            [
              547.664804,
              1736.575978
            ],
            [
              213.363128,
              1736.575978
            ]
          ],
          [
            [
              213.363128,
              1736.575978
            ],
            [
              547.664804,
              1736.575978
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              213.363128,
              1686.520112
            ]
          ],
          [
            [
              213.363128,
              1686.520112
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              528.425209,
              1787.847608
            ],
            [
              164.932422,
              1787.847608
            ]
          ],
          [
            [
              164.932422,
              1787.847608
            ],
            [
              528.425209,
              1787.847608
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              164.932422,
              1733.420881
            ]
          ],
          [
            [
              164.932422,
              1733.420881
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              505.50416,
              1848.92995
            ],
            [
              107.234609,
              1848.92995
            ]
          ],
          [
            [
              107.234609,
              1848.92995
            ],
            [
              505.50416,
              1848.92995
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              107.234609,
              1789.296007
            ]
          ],
          [
            [
              107.234609,
              1789.296007
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              477.733211,
              1922.936799
            ],
            [
              37.328427,
              1922.936799
            ]
          ],
          [
            [
              37.328427,
              1922.936799
            ],
            [
              477.733211,
              1922.936799
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              37.328427,
              1856.993836
            ]
          ],
          [
            [
              37.328427,
              1856.993836
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              443.390947,
              2014.455556
            ],
            [
              -49.119342,
              2014.455556
            ]
          ],
          [
            [
              -49.119342,
              2014.455556
            ],
            [
              443.390947,
              2014.455556
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              -49.119342,
              1940.7107
            ]
          ],
          [
            [
              -49.119342,
              1940.7107
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              399.831972,
              2046.895333
            ],
            [
              -158.767795,
              2046.895333
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "ramp"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0.707107,
            0.707107
          ]
        ],
        "mass_normal": [
          [
            -1,
            0,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              254.593407,
              1646.592308
            ],
            [
              564.043956,
              1646.592308
            ]
          ],
          [
            [
              213.363128,
              1686.520112
            ],
            [
              547.664804,
              1686.520112
            ]
          ],
          [
            [
              164.932422,
              1733.420881
            ],
            [
              528.425209,
              1733.420881
            ]
          ],
          [
            [
              107.234609,
              1789.296007
            ],
            [
              505.50416,
              1789.296007
            ]
          ],
          [
            [
              37.328427,
              1856.993836
            ],
            [
              477.733211,
              1856.993836
            ]
          ],
          [
            [
              -49.119342,
              1940.7107
            ],
            [
              443.390947,
              1940.7107
            ]
          ],
          [
            [
              -158.767795,
              2046.895333
            ],
            [
              399.831972,
              2046.895333
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              254.593407,
              1646.592308
            ],
            [
              213.363128,
              1686.520112
            ],
            [
              164.932422,
              1733.420881
            ],
            [
              107.234609,
              1789.296007
            ],
            [
              37.328427,
              1856.993836
            ],
            [
              -49.119342,
              1940.7107
            ],
            [
              -158.767795,
              2046.895333
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
            ]
          ],
          [
            [
              564.043956,
              1646.592308
            ],
            [
              547.664804,
              1686.520112
            ],
            [
              528.425209,
              1733.420881
            ],
            [
              505.50416,
              1789.296007
            ],
            [
              477.733211,
              1856.993836
            ],
            [
              443.390947,
              1940.7107
            ],
            [
              399.831972,
              2046.895333
            ],
            [
              399.831972,
              1126.848658
            ],
            [
              443.390947,
              1055.772428
            ],
            [
              477.733211,
              999.735327
            ],
            [
              505.50416,
              954.420799
            ],
            [
              528.425209,
              917.01997
            ],
            [
              547.664804,
              885.626257
            ],
            [
              564.043956,
              858.9
            ]
          ]
        ],
        "floor_poly": [
          [
            254.593407,
            858.9
          ],
          [
            213.363128,
            885.626257
          ],
          [
            164.932422,
            917.01997
          ],
          [
            107.234609,
            954.420799
          ],
          [
            37.328427,
            999.735327
          ],
          [
            -49.119342,
            1055.772428
          ],
          [
            -158.767795,
            1126.848658
          ],
          [
            -302.404313,
            1219.956604
          ],
          [
            -498.730463,
            1347.218979
          ],
          [
            -783.25,
            1531.65
          ],
          [
            -1232.604534,
            1822.930227
          ],
          [
            -26.760705,
            1822.930227
          ],
          [
            151.75,
            1531.65
          ],
          [
            264.778309,
            1347.218979
          ],
          [
            342.770889,
            1219.956604
          ],
          [
            399.831972,
            1126.848658
          ],
          [
            443.390947,
            1055.772428
          ],
          [
            477.733211,
            999.735327
          ],
          [
            505.50416,
            954.420799
          ],
          [
            528.425209,
            917.01997
          ],
          [
            547.664804,
            885.626257
          ],
          [
            564.043956,
            858.9
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "buttery_pantry/N": {
    "floor_line_y": 0.787109,
    "px_per_m_at_wall": 225.263,
    "px_per_m_at_bottom": 394.6,
    "wall_width_m": 8,
    "key_tint": "#c8ab83",
    "image_h_px": 1024,
    "horizon_y": 0.503906,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 214,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 166,
    "corner_x1_px": 1366,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/buttery_pantry-N/row23-27fc2560.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1013.7,
    "nearest_floor_m": 2.5689,
    "measured_room": {
      "storey_height_m": 3.312,
      "wall_width_m": 5.327,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "door",
          "id": "op16",
          "plan_px": [
            655.4,
            880.6
          ],
          "plan_centre_px": 768,
          "painted_px": [
            659,
            858
          ],
          "painted_centre_px": 758.5,
          "centre_delta_px": -9.5,
          "centre_delta_m": -0.042,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op16",
        "kind": "door",
        "via": null,
        "x": 659,
        "y": 305,
        "w": 199,
        "h": 501,
        "beyond_m": 7.4,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "buttery_pantry/E": {
    "floor_line_y": 0.725586,
    "px_per_m_at_wall": 173.684,
    "px_per_m_at_bottom": 409.91,
    "wall_width_m": 4.95,
    "key_tint": "#c8a57d",
    "image_h_px": 1024,
    "horizon_y": 0.523828,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 165,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.95,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 210,
    "corner_x1_px": 1313,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/buttery_pantry-E/row23-7c019f47.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.5423,
    "measured_room": {
      "storey_height_m": 3.236,
      "wall_width_m": 6.351,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.95,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            685.5,
            946
          ],
          "plan_centre_px": 815.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "buttery_pantry/S": {
    "floor_line_y": 0.767578,
    "px_per_m_at_wall": 216.842,
    "px_per_m_at_bottom": 486.2,
    "wall_width_m": 8,
    "key_tint": "#c89a68",
    "image_h_px": 1024,
    "horizon_y": 0.580469,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 206,
    "camera_wall_m": 4.5,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 135,
    "corner_x1_px": 1404,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/buttery_pantry-S/row23-7f7836f8.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 975.8,
    "nearest_floor_m": 2.007,
    "measured_room": {
      "storey_height_m": 3.274,
      "wall_width_m": 5.852,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "door",
          "id": "op15",
          "plan_px": [
            225.9,
            442.7
          ],
          "plan_centre_px": 334.3,
          "painted_px": [
            247,
            413
          ],
          "painted_centre_px": 330,
          "centre_delta_px": -4.3,
          "centre_delta_m": -0.02,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op15",
        "kind": "door",
        "via": null,
        "x": 247,
        "y": 286,
        "w": 166,
        "h": 500,
        "beyond_m": 2.95,
        "beyond_offset_m": 1.43,
        "measured": true
      }
    ]
  },
  "buttery_pantry/W": {
    "floor_line_y": 0.720703,
    "px_per_m_at_wall": 175.789,
    "px_per_m_at_bottom": 411.6,
    "wall_width_m": 4.95,
    "key_tint": "#c88446",
    "image_h_px": 1024,
    "horizon_y": 0.5125,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 167,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 4.95,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 267,
    "corner_x1_px": 1273,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/buttery_pantry-W/row23-f538206d.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1054.7,
    "nearest_floor_m": 2.5625,
    "measured_room": {
      "storey_height_m": 3.117,
      "wall_width_m": 5.723,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.95,
      "carriers": []
    },
    "openings": []
  },
  "closet_chamber/N": {
    "floor_line_y": 0.881836,
    "px_per_m_at_wall": 324.211,
    "px_per_m_at_bottom": 428.3,
    "wall_width_m": 8.8,
    "key_tint": "#c8ab79",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 308,
    "camera_wall_m": 3.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 95,
    "corner_x1_px": 1460,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/closet_chamber-N/row23-0f623c34.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1005.1,
    "nearest_floor_m": 2.3466,
    "measured_room": {
      "storey_height_m": 2.733,
      "wall_width_m": 4.21,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            -204.6,
            281.7
          ],
          "plan_centre_px": 38.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "closet_chamber/E": {
    "floor_line_y": 0.704102,
    "px_per_m_at_wall": 162.105,
    "px_per_m_at_bottom": 361.53,
    "wall_width_m": 3.55,
    "key_tint": "#c89a64",
    "image_h_px": 1024,
    "horizon_y": 0.463574,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 154,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 134,
    "corner_x1_px": 1398,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/closet_chamber-E/row23-4a1211ed.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1069.9,
    "nearest_floor_m": 2.9593,
    "measured_room": {
      "storey_height_m": 2.986,
      "wall_width_m": 7.797,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 3.55,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            707.2,
            950.4
          ],
          "plan_centre_px": 828.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
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
    "floor_line_y": 0.706055,
    "px_per_m_at_wall": 156.842,
    "px_per_m_at_bottom": 399.81,
    "wall_width_m": 3.55,
    "key_tint": "#c89052",
    "image_h_px": 1024,
    "horizon_y": 0.516309,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 149,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 419,
    "corner_x1_px": 1132,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/closet_chamber-W/row23-fc09b6a5.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1035.2,
    "nearest_floor_m": 2.5891,
    "measured_room": {
      "storey_height_m": 3.762,
      "wall_width_m": 4.546,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 3.55,
      "carriers": []
    },
    "openings": []
  },
  "dining_parlour/N": {
    "floor_line_y": 0.692383,
    "px_per_m_at_wall": 146.316,
    "px_per_m_at_bottom": 447.95,
    "wall_width_m": 8.8,
    "key_tint": "#c8722c",
    "image_h_px": 1024,
    "horizon_y": 0.543164,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 139,
    "camera_wall_m": 7.15,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 144,
    "corner_x1_px": 1406,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/dining_parlour-N/row23-585a2dca.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1046.2,
    "nearest_floor_m": 2.3354,
    "measured_room": {
      "storey_height_m": 3.014,
      "wall_width_m": 8.625,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            255.9,
            548.5
          ],
          "plan_centre_px": 402.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "door",
          "id": "op06",
          "plan_px": [
            621.7,
            768
          ],
          "plan_centre_px": 694.8,
          "painted_px": [
            770,
            857
          ],
          "painted_centre_px": 813.5,
          "centre_delta_px": 118.7,
          "centre_delta_m": 0.811,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op06",
        "kind": "door",
        "via": null,
        "x": 770,
        "y": 414,
        "w": 87,
        "h": 295,
        "beyond_m": 6,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "dining_parlour/E": {
    "floor_line_y": 0.704102,
    "px_per_m_at_wall": 155.789,
    "px_per_m_at_bottom": 448.07,
    "wall_width_m": 7.6,
    "key_tint": "#c88434",
    "image_h_px": 1024,
    "horizon_y": 0.546387,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 148,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 162,
    "corner_x1_px": 1376,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/dining_parlour-E/row23-a873b6ba.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1028.2,
    "nearest_floor_m": 2.2947,
    "measured_room": {
      "storey_height_m": 3.768,
      "wall_width_m": 7.793,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.6,
      "carriers": [
        {
          "kind": "door",
          "id": "op03",
          "plan_px": [
            674.5,
            830.3
          ],
          "plan_centre_px": 752.4,
          "painted_px": [
            715,
            807
          ],
          "painted_centre_px": 761,
          "centre_delta_px": 8.6,
          "centre_delta_m": 0.055,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op03",
        "kind": "door",
        "via": null,
        "x": 715,
        "y": 376,
        "w": 92,
        "h": 345,
        "beyond_m": 21,
        "beyond_offset_m": -0.1,
        "measured": true
      }
    ]
  },
  "dining_parlour/S": {
    "floor_line_y": 0.6875,
    "px_per_m_at_wall": 147.368,
    "px_per_m_at_bottom": 372.46,
    "wall_width_m": 8.8,
    "key_tint": "#c87025",
    "image_h_px": 1024,
    "horizon_y": 0.48291,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 140,
    "camera_wall_m": 7.15,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 133,
    "corner_x1_px": 1394,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/dining_parlour-S/row23-1ec3581d.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1053.7,
    "nearest_floor_m": 2.829,
    "measured_room": {
      "storey_height_m": 3.434,
      "wall_width_m": 8.557,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            473.3,
            694.3
          ],
          "plan_centre_px": 583.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            989.1,
            1210.1
          ],
          "plan_centre_px": 1099.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "dining_parlour/W": {
    "floor_line_y": 0.702148,
    "px_per_m_at_wall": 160,
    "px_per_m_at_bottom": 379.52,
    "wall_width_m": 7.6,
    "key_tint": "#c8a472",
    "image_h_px": 1024,
    "horizon_y": 0.485059,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 152,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 218,
    "corner_x1_px": 1328,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/dining_parlour-W/row23-e09cd1e4.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1056,
    "nearest_floor_m": 2.7825,
    "measured_room": {
      "storey_height_m": 3.931,
      "wall_width_m": 6.938,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.6,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            544,
            784
          ],
          "plan_centre_px": 664,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
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
        "y": 0,
        "w": 1068.5217391304348,
        "h": 588.0637851662405,
        "beyond_m": 9,
        "beyond_offset_m": 0.4
      }
    ],
    "stairs": []
  },
  "entrance_approach/E": {
    "floor_line_y": 0.56543,
    "px_per_m_at_wall": 42.105,
    "px_per_m_at_bottom": 396.3,
    "wall_width_m": 20,
    "key_tint": "#c8b691",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the low boundary wall's stone coping above the ground at the far line, taken at 0.95 m — tools/room-voices.mjs's `outdoors_open` voice rules the coping there on a forecourt wall of this date and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 40,
    "camera_far_m": 24,
    "far_line": 35.8,
    "facing_type": "open",
    "wall_continuous": false,
    "wall_segments": [],
    "corner_x0_px": null,
    "corner_x1_px": null,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/entrance_approach-E/row23-e0de241b.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "vista",
    "focal_px": 1010.5,
    "nearest_floor_m": 2.5499,
    "measured_room": {
      "storey_height_m": null,
      "wall_width_m": null,
      "ruled_storey_height_m": null,
      "ruled_wall_width_m": 20,
      "carriers": []
    },
    "openings": []
  },
  "entrance_approach/S": {
    "floor_line_y": 0.588867,
    "px_per_m_at_wall": 67.368,
    "px_per_m_at_bottom": 436.19,
    "wall_width_m": 32,
    "key_tint": "#c8a05c",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the low boundary wall's stone coping above the ground at the far line, taken at 0.95 m — tools/room-voices.mjs's `outdoors_open` voice rules the coping there on a forecourt wall of this date and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 64,
    "camera_far_m": 15,
    "far_line": -20,
    "facing_type": "open",
    "wall_continuous": false,
    "wall_segments": [],
    "corner_x0_px": null,
    "corner_x1_px": null,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/entrance_approach-S/row23-4cebd01f.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "vista",
    "focal_px": 1010.5,
    "nearest_floor_m": 2.3167,
    "measured_room": {
      "storey_height_m": null,
      "wall_width_m": null,
      "ruled_storey_height_m": null,
      "ruled_wall_width_m": 32,
      "carriers": []
    },
    "openings": []
  },
  "entrance_approach/W": {
    "floor_line_y": 0.56543,
    "px_per_m_at_wall": 43.158,
    "px_per_m_at_bottom": 406.21,
    "wall_width_m": 20,
    "key_tint": "#c8be8d",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the low boundary wall's stone coping above the ground at the far line, taken at 0.95 m — tools/room-voices.mjs's `outdoors_open` voice rules the coping there on a forecourt wall of this date and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 41,
    "camera_far_m": 24,
    "far_line": 3.8,
    "facing_type": "open",
    "wall_continuous": false,
    "wall_segments": [],
    "corner_x0_px": null,
    "corner_x1_px": null,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/entrance_approach-W/row23-ec10aaae.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "vista",
    "focal_px": 1035.8,
    "nearest_floor_m": 2.5499,
    "measured_room": {
      "storey_height_m": null,
      "wall_width_m": null,
      "ruled_storey_height_m": null,
      "ruled_wall_width_m": 20,
      "carriers": []
    },
    "openings": []
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
    "floor_line_y": 0.591797,
    "px_per_m_at_wall": 68.421,
    "px_per_m_at_bottom": 426.37,
    "wall_width_m": 9,
    "key_tint": "#c8c2bd",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 65,
    "camera_wall_m": 15.3,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 98,
    "corner_x1_px": 1425,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/entrance_court-E/row23-d4ef2d94.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1046.8,
    "nearest_floor_m": 2.4552,
    "measured_room": {
      "storey_height_m": 3.405,
      "wall_width_m": 19.395,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 9,
      "carriers": [
        {
          "kind": "door",
          "id": "op02",
          "plan_px": [
            733.8,
            802.2
          ],
          "plan_centre_px": 768,
          "painted_px": [
            718,
            820
          ],
          "painted_centre_px": 769,
          "centre_delta_px": 1,
          "centre_delta_m": 0.015,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op02",
        "kind": "door",
        "via": null,
        "x": 718,
        "y": 489,
        "w": 102,
        "h": 117,
        "beyond_m": 8.6,
        "beyond_offset_m": -0.425,
        "measured": true
      }
    ]
  },
  "entrance_court/S": {
    "floor_line_y": 0.553711,
    "px_per_m_at_wall": 36.842,
    "px_per_m_at_bottom": 448.5,
    "wall_width_m": 20.4,
    "key_tint": "#c8bdae",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the low boundary wall's stone coping above the ground at the far line, taken at 0.95 m — tools/room-voices.mjs's `outdoors_open` voice rules the coping there on a forecourt wall of this date and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 35,
    "camera_far_m": 26.75,
    "far_line": -20,
    "facing_type": "open",
    "wall_continuous": false,
    "wall_segments": [],
    "corner_x0_px": null,
    "corner_x1_px": null,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/entrance_court-S/row23-e117db11.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "vista",
    "focal_px": 985.5,
    "nearest_floor_m": 2.1974,
    "measured_room": {
      "storey_height_m": null,
      "wall_width_m": null,
      "ruled_storey_height_m": null,
      "ruled_wall_width_m": 20.4,
      "carriers": [
        {
          "kind": "open_edge",
          "id": "op_court_mouth",
          "plan_px": [
            392.2,
            1143.8
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
    "openings": [
      {
        "id": "op_court_mouth",
        "kind": "threshold",
        "via": null,
        "x": -779.38,
        "y": 0,
        "w": 3094.76,
        "h": 694.51,
        "beyond_m": 0,
        "beyond_offset_m": 0.4,
        "measured": false
      }
    ]
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
    "floor_line_y": 0.900391,
    "px_per_m_at_wall": 332.632,
    "px_per_m_at_bottom": 418.33,
    "wall_width_m": 8.8,
    "key_tint": "#c8a165",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 316,
    "camera_wall_m": 3.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 313,
    "corner_x1_px": 1394,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/garden_room-N/row23-88dcb306.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1031.2,
    "nearest_floor_m": 2.4649,
    "measured_room": {
      "storey_height_m": 2.727,
      "wall_width_m": 3.25,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            -229.9,
            269.1
          ],
          "plan_centre_px": 19.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "garden_room/E": {
    "floor_line_y": 0.702148,
    "px_per_m_at_wall": 154.737,
    "px_per_m_at_bottom": 503.3,
    "wall_width_m": 3.55,
    "key_tint": "#c89961",
    "image_h_px": 1024,
    "horizon_y": 0.569922,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 147,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 331,
    "corner_x1_px": 1207,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/garden_room-E/row23-78bced76.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1021.3,
    "nearest_floor_m": 2.0291,
    "measured_room": {
      "storey_height_m": 2.869,
      "wall_width_m": 5.661,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 3.55,
      "carriers": [
        {
          "kind": "door",
          "id": "op09",
          "plan_px": [
            710,
            864.7
          ],
          "plan_centre_px": 787.3,
          "painted_px": [
            726,
            888
          ],
          "painted_centre_px": 807,
          "centre_delta_px": 19.7,
          "centre_delta_m": 0.127,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op09",
        "kind": "door",
        "via": null,
        "x": 726,
        "y": 379,
        "w": 162,
        "h": 340,
        "beyond_m": 21,
        "beyond_offset_m": 0.85,
        "measured": true
      }
    ]
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
    "floor_line_y": 0.693012,
    "px_per_m_at_wall": 155.152,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 3.55,
    "key_tint": "#c89b63",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 147,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 3.55,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 289.42,
    "corner_x1_px": 1246.58,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/garden_room-W/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.12,
      "wall_width_m": 6.169,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 3.55,
      "carriers": []
    },
    "openings": []
  },
  "great_hall/N": {
    "floor_line_y": 0.647442,
    "px_per_m_at_wall": 115.706,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 14.6,
    "key_tint": "#c89862",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 110,
    "camera_wall_m": 8.85,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 85.9,
    "corner_x1_px": 1450.1,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-doors/great_hall-N/doored.png",
    "camera_reference": "ruled",
    "measured_round": "row36doors",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.376,
      "wall_width_m": 11.79,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 14.6,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            212.6,
            559.7
          ],
          "plan_centre_px": 386.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            791.1,
            964.7
          ],
          "plan_centre_px": 877.9,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "door",
          "id": "op10",
          "plan_px": [
            1254,
            1439.1
          ],
          "plan_centre_px": 1346.5,
          "painted_px": [
            1230,
            1439
          ],
          "painted_centre_px": 1334.5,
          "centre_delta_px": -12,
          "centre_delta_m": -0.104,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op10",
        "kind": "door",
        "via": null,
        "x": 1230,
        "y": 432,
        "w": 209,
        "h": 231,
        "beyond_m": 6.15,
        "beyond_offset_m": 2.9,
        "measured": true
      }
    ]
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
    "floor_line_y": 0.638672,
    "px_per_m_at_wall": 112.632,
    "px_per_m_at_bottom": 438.46,
    "wall_width_m": 14.6,
    "key_tint": "#c8b99e",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 107,
    "camera_wall_m": 8.85,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 673,
    "corner_x1_px": 1446,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/great_hall-S/row23-0bc11e98.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 996.8,
    "nearest_floor_m": 2.2734,
    "measured_room": {
      "storey_height_m": 3.765,
      "wall_width_m": 6.863,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 14.6,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            13.4,
            182.3
          ],
          "plan_centre_px": 97.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            294.9,
            463.9
          ],
          "plan_centre_px": 379.4,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "door",
          "id": "op01",
          "plan_px": [
            677.9,
            858.1
          ],
          "plan_centre_px": 768,
          "painted_px": [
            697,
            777
          ],
          "painted_centre_px": 737,
          "centre_delta_px": -31,
          "centre_delta_m": -0.275,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            970.7,
            1139.7
          ],
          "plan_centre_px": 1055.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            1252.3,
            1421.3
          ],
          "plan_centre_px": 1336.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": [
      {
        "id": "op01",
        "kind": "door",
        "via": null,
        "x": 697,
        "y": 433,
        "w": 80,
        "h": 221,
        "beyond_m": 29.6,
        "beyond_offset_m": -2.9,
        "measured": true
      }
    ]
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
        "x": 0,
        "y": 194.9384,
        "w": 317.44,
        "h": 829.0616,
        "raw_w": 4637.9323079999995,
        "raw_h": 1488.109016,
        "hit_polys": [
          [
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
              -10.24,
              768.3784
            ],
            [
              -56.817955,
              782.878853
            ],
            [
              -109.32626,
              799.225517
            ],
            [
              -168.974504,
              817.794958
            ],
            [
              -237.325228,
              839.073617
            ],
            [
              -316.432787,
              863.701049
            ],
            [
              -409.053381,
              892.535302
            ],
            [
              -518.972763,
              926.754942
            ],
            [
              -651.536481,
              968.02412
            ],
            [
              -814.545455,
              1018.771388
            ],
            [
              -1019.848649,
              1082.685514
            ],
            [
              -1286.360248,
              1165.654783
            ],
            [
              -1646.248175,
              1277.693577
            ],
            [
              -2159.00885,
              1437.324071
            ],
            [
              -2948.314607,
              1683.047416
            ]
          ],
          [
            [
              -1383.550562,
              1199.811461
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              22.910506,
              368.93393
            ],
            [
              86.548043,
              331.339573
            ],
            [
              140.170492,
              299.661705
            ],
            [
              185.969605,
              272.605532
            ],
            [
              225.541076,
              249.228385
            ],
            [
              260.074271,
              228.827639
            ],
            [
              290.473815,
              210.868878
            ],
            [
              317.44,
              194.9384
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
          [
            [
              -4320.492308,
              1669.120308
            ],
            [
              -2177.969231,
              1669.120308
            ],
            [
              -1383.550562,
              1360.890112
            ],
            [
              -2948.314607,
              1360.890112
            ]
          ],
          [
            [
              -2948.314607,
              1360.890112
            ],
            [
              -1383.550562,
              1360.890112
            ],
            [
              -1383.550562,
              1199.811461
            ],
            [
              -2948.314607,
              1199.811461
            ]
          ],
          [
            [
              -2948.314607,
              1199.811461
            ],
            [
              -1383.550562,
              1199.811461
            ],
            [
              -926.584071,
              1056.722301
            ],
            [
              -2159.00885,
              1056.722301
            ]
          ],
          [
            [
              -2159.00885,
              1056.722301
            ],
            [
              -926.584071,
              1056.722301
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -2159.00885,
              929.855044
            ]
          ],
          [
            [
              -2159.00885,
              929.855044
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -629.722628,
              859.124234
            ],
            [
              -1646.248175,
              859.124234
            ]
          ],
          [
            [
              -1646.248175,
              859.124234
            ],
            [
              -629.722628,
              859.124234
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -1646.248175,
              754.481898
            ]
          ],
          [
            [
              -1646.248175,
              754.481898
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -421.36646,
              720.437391
            ],
            [
              -1286.360248,
              720.437391
            ]
          ],
          [
            [
              -1286.360248,
              720.437391
            ],
            [
              -421.36646,
              720.437391
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -1286.360248,
              631.393913
            ]
          ],
          [
            [
              -1286.360248,
              631.393913
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -267.07027,
              617.734162
            ],
            [
              -1019.848649,
              617.734162
            ]
          ],
          [
            [
              -1019.848649,
              617.734162
            ],
            [
              -267.07027,
              617.734162
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -1019.848649,
              540.24227
            ]
          ],
          [
            [
              -1019.848649,
              540.24227
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -148.210526,
              538.618278
            ],
            [
              -814.545455,
              538.618278
            ]
          ],
          [
            [
              -814.545455,
              538.618278
            ],
            [
              -148.210526,
              538.618278
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -814.545455,
              470.024976
            ]
          ],
          [
            [
              -814.545455,
              470.024976
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -53.83691,
              475.800944
            ],
            [
              -651.536481,
              475.800944
            ]
          ],
          [
            [
              -651.536481,
              475.800944
            ],
            [
              -53.83691,
              475.800944
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              -651.536481,
              414.273047
            ]
          ],
          [
            [
              -651.536481,
              414.273047
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              22.910506,
              424.716031
            ],
            [
              -518.972763,
              424.716031
            ]
          ],
          [
            [
              -518.972763,
              424.716031
            ],
            [
              22.910506,
              424.716031
            ],
            [
              22.910506,
              368.93393
            ],
            [
              -518.972763,
              368.93393
            ]
          ],
          [
            [
              -518.972763,
              368.93393
            ],
            [
              22.910506,
              368.93393
            ],
            [
              86.548043,
              382.357367
            ],
            [
              -409.053381,
              382.357367
            ]
          ],
          [
            [
              -409.053381,
              382.357367
            ],
            [
              86.548043,
              382.357367
            ],
            [
              86.548043,
              331.339573
            ],
            [
              -409.053381,
              331.339573
            ]
          ],
          [
            [
              -409.053381,
              331.339573
            ],
            [
              86.548043,
              331.339573
            ],
            [
              140.170492,
              346.664984
            ],
            [
              -316.432787,
              346.664984
            ]
          ],
          [
            [
              -316.432787,
              346.664984
            ],
            [
              140.170492,
              346.664984
            ],
            [
              140.170492,
              299.661705
            ],
            [
              -316.432787,
              299.661705
            ]
          ],
          [
            [
              -316.432787,
              299.661705
            ],
            [
              140.170492,
              299.661705
            ],
            [
              185.969605,
              316.18
            ],
            [
              -237.325228,
              316.18
            ]
          ],
          [
            [
              -237.325228,
              316.18
            ],
            [
              185.969605,
              316.18
            ],
            [
              185.969605,
              272.605532
            ],
            [
              -237.325228,
              272.605532
            ]
          ],
          [
            [
              -237.325228,
              272.605532
            ],
            [
              185.969605,
              272.605532
            ],
            [
              225.541076,
              289.840283
            ],
            [
              -168.974504,
              289.840283
            ]
          ],
          [
            [
              -168.974504,
              289.840283
            ],
            [
              225.541076,
              289.840283
            ],
            [
              225.541076,
              249.228385
            ],
            [
              -168.974504,
              249.228385
            ]
          ],
          [
            [
              -168.974504,
              249.228385
            ],
            [
              225.541076,
              249.228385
            ],
            [
              260.074271,
              266.854164
            ],
            [
              -109.32626,
              266.854164
            ]
          ],
          [
            [
              -109.32626,
              266.854164
            ],
            [
              260.074271,
              266.854164
            ],
            [
              260.074271,
              228.827639
            ],
            [
              -109.32626,
              228.827639
            ]
          ],
          [
            [
              -109.32626,
              228.827639
            ],
            [
              260.074271,
              228.827639
            ],
            [
              290.473815,
              246.619501
            ],
            [
              -56.817955,
              246.619501
            ]
          ],
          [
            [
              -56.817955,
              246.619501
            ],
            [
              290.473815,
              246.619501
            ],
            [
              290.473815,
              210.868878
            ],
            [
              -56.817955,
              210.868878
            ]
          ],
          [
            [
              -56.817955,
              210.868878
            ],
            [
              290.473815,
              210.868878
            ],
            [
              317.44,
              228.670165
            ],
            [
              -10.24,
              228.670165
            ]
          ],
          [
            [
              -10.24,
              228.670165
            ],
            [
              317.44,
              228.670165
            ],
            [
              317.44,
              194.9384
            ],
            [
              -10.24,
              194.9384
            ]
          ],
          [
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
          ]
        ],
        "treads_poly": [
          [
            [
              -4320.492308,
              1669.120308
            ],
            [
              -2177.969231,
              1669.120308
            ],
            [
              -1383.550562,
              1360.890112
            ],
            [
              -2948.314607,
              1360.890112
            ]
          ],
          [
            [
              -2948.314607,
              1360.890112
            ],
            [
              -1383.550562,
              1360.890112
            ],
            [
              -1383.550562,
              1199.811461
            ],
            [
              -2948.314607,
              1199.811461
            ]
          ],
          [
            [
              -2948.314607,
              1199.811461
            ],
            [
              -1383.550562,
              1199.811461
            ],
            [
              -926.584071,
              1056.722301
            ],
            [
              -2159.00885,
              1056.722301
            ]
          ],
          [
            [
              -2159.00885,
              1056.722301
            ],
            [
              -926.584071,
              1056.722301
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -2159.00885,
              929.855044
            ]
          ],
          [
            [
              -2159.00885,
              929.855044
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -629.722628,
              859.124234
            ],
            [
              -1646.248175,
              859.124234
            ]
          ],
          [
            [
              -1646.248175,
              859.124234
            ],
            [
              -629.722628,
              859.124234
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -1646.248175,
              754.481898
            ]
          ],
          [
            [
              -1646.248175,
              754.481898
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -421.36646,
              720.437391
            ],
            [
              -1286.360248,
              720.437391
            ]
          ],
          [
            [
              -1286.360248,
              720.437391
            ],
            [
              -421.36646,
              720.437391
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -1286.360248,
              631.393913
            ]
          ],
          [
            [
              -1286.360248,
              631.393913
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -267.07027,
              617.734162
            ],
            [
              -1019.848649,
              617.734162
            ]
          ],
          [
            [
              -1019.848649,
              617.734162
            ],
            [
              -267.07027,
              617.734162
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -1019.848649,
              540.24227
            ]
          ],
          [
            [
              -1019.848649,
              540.24227
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -148.210526,
              538.618278
            ],
            [
              -814.545455,
              538.618278
            ]
          ],
          [
            [
              -814.545455,
              538.618278
            ],
            [
              -148.210526,
              538.618278
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -814.545455,
              470.024976
            ]
          ],
          [
            [
              -814.545455,
              470.024976
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -53.83691,
              475.800944
            ],
            [
              -651.536481,
              475.800944
            ]
          ],
          [
            [
              -651.536481,
              475.800944
            ],
            [
              -53.83691,
              475.800944
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              -651.536481,
              414.273047
            ]
          ],
          [
            [
              -651.536481,
              414.273047
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              22.910506,
              424.716031
            ],
            [
              -518.972763,
              424.716031
            ]
          ],
          [
            [
              -518.972763,
              424.716031
            ],
            [
              22.910506,
              424.716031
            ],
            [
              22.910506,
              368.93393
            ],
            [
              -518.972763,
              368.93393
            ]
          ],
          [
            [
              -518.972763,
              368.93393
            ],
            [
              22.910506,
              368.93393
            ],
            [
              86.548043,
              382.357367
            ],
            [
              -409.053381,
              382.357367
            ]
          ],
          [
            [
              -409.053381,
              382.357367
            ],
            [
              86.548043,
              382.357367
            ],
            [
              86.548043,
              331.339573
            ],
            [
              -409.053381,
              331.339573
            ]
          ],
          [
            [
              -409.053381,
              331.339573
            ],
            [
              86.548043,
              331.339573
            ],
            [
              140.170492,
              346.664984
            ],
            [
              -316.432787,
              346.664984
            ]
          ],
          [
            [
              -316.432787,
              346.664984
            ],
            [
              140.170492,
              346.664984
            ],
            [
              140.170492,
              299.661705
            ],
            [
              -316.432787,
              299.661705
            ]
          ],
          [
            [
              -316.432787,
              299.661705
            ],
            [
              140.170492,
              299.661705
            ],
            [
              185.969605,
              316.18
            ],
            [
              -237.325228,
              316.18
            ]
          ],
          [
            [
              -237.325228,
              316.18
            ],
            [
              185.969605,
              316.18
            ],
            [
              185.969605,
              272.605532
            ],
            [
              -237.325228,
              272.605532
            ]
          ],
          [
            [
              -237.325228,
              272.605532
            ],
            [
              185.969605,
              272.605532
            ],
            [
              225.541076,
              289.840283
            ],
            [
              -168.974504,
              289.840283
            ]
          ],
          [
            [
              -168.974504,
              289.840283
            ],
            [
              225.541076,
              289.840283
            ],
            [
              225.541076,
              249.228385
            ],
            [
              -168.974504,
              249.228385
            ]
          ],
          [
            [
              -168.974504,
              249.228385
            ],
            [
              225.541076,
              249.228385
            ],
            [
              260.074271,
              266.854164
            ],
            [
              -109.32626,
              266.854164
            ]
          ],
          [
            [
              -109.32626,
              266.854164
            ],
            [
              260.074271,
              266.854164
            ],
            [
              260.074271,
              228.827639
            ],
            [
              -109.32626,
              228.827639
            ]
          ],
          [
            [
              -109.32626,
              228.827639
            ],
            [
              260.074271,
              228.827639
            ],
            [
              290.473815,
              246.619501
            ],
            [
              -56.817955,
              246.619501
            ]
          ],
          [
            [
              -56.817955,
              246.619501
            ],
            [
              290.473815,
              246.619501
            ],
            [
              290.473815,
              210.868878
            ],
            [
              -56.817955,
              210.868878
            ]
          ],
          [
            [
              -56.817955,
              210.868878
            ],
            [
              290.473815,
              210.868878
            ],
            [
              317.44,
              228.670165
            ],
            [
              -10.24,
              228.670165
            ]
          ],
          [
            [
              -10.24,
              228.670165
            ],
            [
              317.44,
              228.670165
            ],
            [
              317.44,
              194.9384
            ],
            [
              -10.24,
              194.9384
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "mass_normal": [
          [
            -1,
            0,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              -4320.492308,
              1669.120308
            ],
            [
              -2177.969231,
              1669.120308
            ]
          ],
          [
            [
              -2948.314607,
              1199.811461
            ],
            [
              -1383.550562,
              1199.811461
            ]
          ],
          [
            [
              -2159.00885,
              929.855044
            ],
            [
              -926.584071,
              929.855044
            ]
          ],
          [
            [
              -1646.248175,
              754.481898
            ],
            [
              -629.722628,
              754.481898
            ]
          ],
          [
            [
              -1286.360248,
              631.393913
            ],
            [
              -421.36646,
              631.393913
            ]
          ],
          [
            [
              -1019.848649,
              540.24227
            ],
            [
              -267.07027,
              540.24227
            ]
          ],
          [
            [
              -814.545455,
              470.024976
            ],
            [
              -148.210526,
              470.024976
            ]
          ],
          [
            [
              -651.536481,
              414.273047
            ],
            [
              -53.83691,
              414.273047
            ]
          ],
          [
            [
              -518.972763,
              368.93393
            ],
            [
              22.910506,
              368.93393
            ]
          ],
          [
            [
              -409.053381,
              331.339573
            ],
            [
              86.548043,
              331.339573
            ]
          ],
          [
            [
              -316.432787,
              299.661705
            ],
            [
              140.170492,
              299.661705
            ]
          ],
          [
            [
              -237.325228,
              272.605532
            ],
            [
              185.969605,
              272.605532
            ]
          ],
          [
            [
              -168.974504,
              249.228385
            ],
            [
              225.541076,
              249.228385
            ]
          ],
          [
            [
              -109.32626,
              228.827639
            ],
            [
              260.074271,
              228.827639
            ]
          ],
          [
            [
              -56.817955,
              210.868878
            ],
            [
              290.473815,
              210.868878
            ]
          ],
          [
            [
              -10.24,
              194.9384
            ],
            [
              317.44,
              194.9384
            ]
          ]
        ],
        "mass_poly": [
          [
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
              -10.24,
              768.3784
            ],
            [
              -56.817955,
              782.878853
            ],
            [
              -109.32626,
              799.225517
            ],
            [
              -168.974504,
              817.794958
            ],
            [
              -237.325228,
              839.073617
            ],
            [
              -316.432787,
              863.701049
            ],
            [
              -409.053381,
              892.535302
            ],
            [
              -518.972763,
              926.754942
            ],
            [
              -651.536481,
              968.02412
            ],
            [
              -814.545455,
              1018.771388
            ],
            [
              -1019.848649,
              1082.685514
            ],
            [
              -1286.360248,
              1165.654783
            ],
            [
              -1646.248175,
              1277.693577
            ],
            [
              -2159.00885,
              1437.324071
            ],
            [
              -2948.314607,
              1683.047416
            ]
          ],
          [
            [
              -1383.550562,
              1199.811461
            ],
            [
              -926.584071,
              929.855044
            ],
            [
              -629.722628,
              754.481898
            ],
            [
              -421.36646,
              631.393913
            ],
            [
              -267.07027,
              540.24227
            ],
            [
              -148.210526,
              470.024976
            ],
            [
              -53.83691,
              414.273047
            ],
            [
              22.910506,
              368.93393
            ],
            [
              86.548043,
              331.339573
            ],
            [
              140.170492,
              299.661705
            ],
            [
              185.969605,
              272.605532
            ],
            [
              225.541076,
              249.228385
            ],
            [
              260.074271,
              228.827639
            ],
            [
              290.473815,
              210.868878
            ],
            [
              317.44,
              194.9384
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
    "floor_line_y": 0.705078,
    "px_per_m_at_wall": 161.053,
    "px_per_m_at_bottom": 408.7,
    "wall_width_m": 5.65,
    "key_tint": "#c8a67c",
    "image_h_px": 1024,
    "horizon_y": 0.513281,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 153,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 215,
    "corner_x1_px": 1316,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/great_stair_hall-E/row23-5800e5f1.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1062.9,
    "nearest_floor_m": 2.6008,
    "measured_room": {
      "storey_height_m": 2.85,
      "wall_width_m": 6.836,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.65,
      "carriers": [
        {
          "kind": "door",
          "id": "op04",
          "plan_px": [
            667.3,
            828.4
          ],
          "plan_centre_px": 747.9,
          "painted_px": [
            657,
            863
          ],
          "painted_centre_px": 760,
          "centre_delta_px": 12.1,
          "centre_delta_m": 0.075,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op04",
        "kind": "door",
        "via": null,
        "x": 657,
        "y": 340,
        "w": 206,
        "h": 382,
        "beyond_m": 15.2,
        "beyond_offset_m": -2.875,
        "measured": true
      }
    ]
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
    "stairs": [
      {
        "id": "great_stair",
        "kind": "stair",
        "via": null,
        "direction": "up",
        "treads": 17,
        "rise_m": 2.8,
        "x": 1263.120879,
        "y": 0,
        "w": 272.87912099999994,
        "h": 1024,
        "raw_w": 3929.655041,
        "raw_h": 2493.217392,
        "hit_polys": [
          [
            [
              1623.208791,
              792.34
            ],
            [
              1679.790489,
              770.434445
            ],
            [
              1744.389668,
              745.42493
            ],
            [
              1818.840349,
              716.601414
            ],
            [
              1905.582115,
              683.019415
            ],
            [
              2007.932521,
              643.394545
            ],
            [
              2130.521112,
              595.93448
            ],
            [
              2280.009143,
              538.06032
            ],
            [
              2466.341463,
              465.921926
            ],
            [
              2705.054173,
              373.50451
            ],
            [
              3021.846678,
              250.858569
            ],
            [
              3462.517312,
              80.25332
            ],
            [
              4117.387342,
              -173.279038
            ],
            [
              5192.77592,
              -589.614783
            ],
            [
              5192.77592,
              1903.602609
            ],
            [
              4117.387342,
              1568.817165
            ],
            [
              3462.517312,
              1364.945784
            ],
            [
              3021.846678,
              1227.758058
            ],
            [
              2705.054173,
              1129.135549
            ],
            [
              2466.341463,
              1054.820513
            ],
            [
              2280.009143,
              996.81232
            ],
            [
              2130.521112,
              950.274336
            ],
            [
              2007.932521,
              912.110572
            ],
            [
              1905.582115,
              880.247274
            ],
            [
              1818.840349,
              853.243193
            ],
            [
              1744.389668,
              830.06552
            ],
            [
              1679.790489,
              809.954776
            ],
            [
              1623.208791,
              792.34
            ]
          ],
          [
            [
              1263.120879,
              792.34
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              3329.712375,
              -589.614783
            ],
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
            ]
          ],
          [
            [
              1623.208791,
              792.34
            ],
            [
              1263.120879,
              792.34
            ],
            [
              1295.878704,
              809.954776
            ],
            [
              1679.790489,
              809.954776
            ]
          ],
          [
            [
              1679.790489,
              809.954776
            ],
            [
              1295.878704,
              809.954776
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1679.790489,
              770.434445
            ]
          ],
          [
            [
              1679.790489,
              770.434445
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1333.278229,
              787.745225
            ],
            [
              1744.389668,
              787.745225
            ]
          ],
          [
            [
              1744.389668,
              787.745225
            ],
            [
              1333.278229,
              787.745225
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1744.389668,
              745.42493
            ]
          ],
          [
            [
              1744.389668,
              745.42493
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1376.381255,
              762.148674
            ],
            [
              1818.840349,
              762.148674
            ]
          ],
          [
            [
              1818.840349,
              762.148674
            ],
            [
              1376.381255,
              762.148674
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1818.840349,
              716.601414
            ]
          ],
          [
            [
              1818.840349,
              716.601414
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1426.600172,
              732.32638
            ],
            [
              1905.582115,
              732.32638
            ]
          ],
          [
            [
              1905.582115,
              732.32638
            ],
            [
              1426.600172,
              732.32638
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1905.582115,
              683.019415
            ]
          ],
          [
            [
              1905.582115,
              683.019415
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1485.85567,
              697.137751
            ],
            [
              2007.932521,
              697.137751
            ]
          ],
          [
            [
              2007.932521,
              697.137751
            ],
            [
              1485.85567,
              697.137751
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              2007.932521,
              643.394545
            ]
          ],
          [
            [
              2007.932521,
              643.394545
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              1556.828012,
              654.991123
            ],
            [
              2130.521112,
              654.991123
            ]
          ],
          [
            [
              2130.521112,
              654.991123
            ],
            [
              1556.828012,
              654.991123
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              2130.521112,
              595.93448
            ]
          ],
          [
            [
              2130.521112,
              595.93448
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              1643.373714,
              603.59632
            ],
            [
              2280.009143,
              603.59632
            ]
          ],
          [
            [
              2280.009143,
              603.59632
            ],
            [
              1643.373714,
              603.59632
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              2280.009143,
              538.06032
            ]
          ],
          [
            [
              2280.009143,
              538.06032
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              1751.250321,
              539.534249
            ],
            [
              2466.341463,
              539.534249
            ]
          ],
          [
            [
              2466.341463,
              539.534249
            ],
            [
              1751.250321,
              539.534249
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              2466.341463,
              465.921926
            ]
          ],
          [
            [
              2466.341463,
              465.921926
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              1889.452416,
              457.463514
            ],
            [
              2705.054173,
              457.463514
            ]
          ],
          [
            [
              2705.054173,
              457.463514
            ],
            [
              1889.452416,
              457.463514
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2705.054173,
              373.50451
            ]
          ],
          [
            [
              2705.054173,
              373.50451
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2072.858603,
              348.548518
            ],
            [
              3021.846678,
              348.548518
            ]
          ],
          [
            [
              3021.846678,
              348.548518
            ],
            [
              2072.858603,
              348.548518
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              3021.846678,
              250.858569
            ]
          ],
          [
            [
              3021.846678,
              250.858569
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              2327.983707,
              197.043544
            ],
            [
              3462.517312,
              197.043544
            ]
          ],
          [
            [
              3462.517312,
              197.043544
            ],
            [
              2327.983707,
              197.043544
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              3462.517312,
              80.25332
            ]
          ],
          [
            [
              3462.517312,
              80.25332
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              2707.118987,
              -28.104354
            ],
            [
              4117.387342,
              -28.104354
            ]
          ],
          [
            [
              4117.387342,
              -28.104354
            ],
            [
              2707.118987,
              -28.104354
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              4117.387342,
              -173.279038
            ]
          ],
          [
            [
              4117.387342,
              -173.279038
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              3329.712375,
              -397.828829
            ],
            [
              5192.77592,
              -397.828829
            ]
          ],
          [
            [
              5192.77592,
              -397.828829
            ],
            [
              3329.712375,
              -397.828829
            ],
            [
              3329.712375,
              -589.614783
            ],
            [
              5192.77592,
              -589.614783
            ]
          ],
          [
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
            ],
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
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              1623.208791,
              792.34
            ],
            [
              1263.120879,
              792.34
            ],
            [
              1295.878704,
              809.954776
            ],
            [
              1679.790489,
              809.954776
            ]
          ],
          [
            [
              1679.790489,
              809.954776
            ],
            [
              1295.878704,
              809.954776
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1679.790489,
              770.434445
            ]
          ],
          [
            [
              1679.790489,
              770.434445
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1333.278229,
              787.745225
            ],
            [
              1744.389668,
              787.745225
            ]
          ],
          [
            [
              1744.389668,
              787.745225
            ],
            [
              1333.278229,
              787.745225
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1744.389668,
              745.42493
            ]
          ],
          [
            [
              1744.389668,
              745.42493
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1376.381255,
              762.148674
            ],
            [
              1818.840349,
              762.148674
            ]
          ],
          [
            [
              1818.840349,
              762.148674
            ],
            [
              1376.381255,
              762.148674
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1818.840349,
              716.601414
            ]
          ],
          [
            [
              1818.840349,
              716.601414
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1426.600172,
              732.32638
            ],
            [
              1905.582115,
              732.32638
            ]
          ],
          [
            [
              1905.582115,
              732.32638
            ],
            [
              1426.600172,
              732.32638
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1905.582115,
              683.019415
            ]
          ],
          [
            [
              1905.582115,
              683.019415
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1485.85567,
              697.137751
            ],
            [
              2007.932521,
              697.137751
            ]
          ],
          [
            [
              2007.932521,
              697.137751
            ],
            [
              1485.85567,
              697.137751
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              2007.932521,
              643.394545
            ]
          ],
          [
            [
              2007.932521,
              643.394545
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              1556.828012,
              654.991123
            ],
            [
              2130.521112,
              654.991123
            ]
          ],
          [
            [
              2130.521112,
              654.991123
            ],
            [
              1556.828012,
              654.991123
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              2130.521112,
              595.93448
            ]
          ],
          [
            [
              2130.521112,
              595.93448
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              1643.373714,
              603.59632
            ],
            [
              2280.009143,
              603.59632
            ]
          ],
          [
            [
              2280.009143,
              603.59632
            ],
            [
              1643.373714,
              603.59632
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              2280.009143,
              538.06032
            ]
          ],
          [
            [
              2280.009143,
              538.06032
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              1751.250321,
              539.534249
            ],
            [
              2466.341463,
              539.534249
            ]
          ],
          [
            [
              2466.341463,
              539.534249
            ],
            [
              1751.250321,
              539.534249
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              2466.341463,
              465.921926
            ]
          ],
          [
            [
              2466.341463,
              465.921926
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              1889.452416,
              457.463514
            ],
            [
              2705.054173,
              457.463514
            ]
          ],
          [
            [
              2705.054173,
              457.463514
            ],
            [
              1889.452416,
              457.463514
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2705.054173,
              373.50451
            ]
          ],
          [
            [
              2705.054173,
              373.50451
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2072.858603,
              348.548518
            ],
            [
              3021.846678,
              348.548518
            ]
          ],
          [
            [
              3021.846678,
              348.548518
            ],
            [
              2072.858603,
              348.548518
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              3021.846678,
              250.858569
            ]
          ],
          [
            [
              3021.846678,
              250.858569
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              2327.983707,
              197.043544
            ],
            [
              3462.517312,
              197.043544
            ]
          ],
          [
            [
              3462.517312,
              197.043544
            ],
            [
              2327.983707,
              197.043544
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              3462.517312,
              80.25332
            ]
          ],
          [
            [
              3462.517312,
              80.25332
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              2707.118987,
              -28.104354
            ],
            [
              4117.387342,
              -28.104354
            ]
          ],
          [
            [
              4117.387342,
              -28.104354
            ],
            [
              2707.118987,
              -28.104354
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              4117.387342,
              -173.279038
            ]
          ],
          [
            [
              4117.387342,
              -173.279038
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              3329.712375,
              -397.828829
            ],
            [
              5192.77592,
              -397.828829
            ]
          ],
          [
            [
              5192.77592,
              -397.828829
            ],
            [
              3329.712375,
              -397.828829
            ],
            [
              3329.712375,
              -589.614783
            ],
            [
              5192.77592,
              -589.614783
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "mass_normal": [
          [
            1,
            0,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              1623.208791,
              792.34
            ],
            [
              1263.120879,
              792.34
            ]
          ],
          [
            [
              1679.790489,
              770.434445
            ],
            [
              1295.878704,
              770.434445
            ]
          ],
          [
            [
              1744.389668,
              745.42493
            ],
            [
              1333.278229,
              745.42493
            ]
          ],
          [
            [
              1818.840349,
              716.601414
            ],
            [
              1376.381255,
              716.601414
            ]
          ],
          [
            [
              1905.582115,
              683.019415
            ],
            [
              1426.600172,
              683.019415
            ]
          ],
          [
            [
              2007.932521,
              643.394545
            ],
            [
              1485.85567,
              643.394545
            ]
          ],
          [
            [
              2130.521112,
              595.93448
            ],
            [
              1556.828012,
              595.93448
            ]
          ],
          [
            [
              2280.009143,
              538.06032
            ],
            [
              1643.373714,
              538.06032
            ]
          ],
          [
            [
              2466.341463,
              465.921926
            ],
            [
              1751.250321,
              465.921926
            ]
          ],
          [
            [
              2705.054173,
              373.50451
            ],
            [
              1889.452416,
              373.50451
            ]
          ],
          [
            [
              3021.846678,
              250.858569
            ],
            [
              2072.858603,
              250.858569
            ]
          ],
          [
            [
              3462.517312,
              80.25332
            ],
            [
              2327.983707,
              80.25332
            ]
          ],
          [
            [
              4117.387342,
              -173.279038
            ],
            [
              2707.118987,
              -173.279038
            ]
          ],
          [
            [
              5192.77592,
              -589.614783
            ],
            [
              3329.712375,
              -589.614783
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              1623.208791,
              792.34
            ],
            [
              1679.790489,
              770.434445
            ],
            [
              1744.389668,
              745.42493
            ],
            [
              1818.840349,
              716.601414
            ],
            [
              1905.582115,
              683.019415
            ],
            [
              2007.932521,
              643.394545
            ],
            [
              2130.521112,
              595.93448
            ],
            [
              2280.009143,
              538.06032
            ],
            [
              2466.341463,
              465.921926
            ],
            [
              2705.054173,
              373.50451
            ],
            [
              3021.846678,
              250.858569
            ],
            [
              3462.517312,
              80.25332
            ],
            [
              4117.387342,
              -173.279038
            ],
            [
              5192.77592,
              -589.614783
            ],
            [
              5192.77592,
              1903.602609
            ],
            [
              4117.387342,
              1568.817165
            ],
            [
              3462.517312,
              1364.945784
            ],
            [
              3021.846678,
              1227.758058
            ],
            [
              2705.054173,
              1129.135549
            ],
            [
              2466.341463,
              1054.820513
            ],
            [
              2280.009143,
              996.81232
            ],
            [
              2130.521112,
              950.274336
            ],
            [
              2007.932521,
              912.110572
            ],
            [
              1905.582115,
              880.247274
            ],
            [
              1818.840349,
              853.243193
            ],
            [
              1744.389668,
              830.06552
            ],
            [
              1679.790489,
              809.954776
            ],
            [
              1623.208791,
              792.34
            ]
          ],
          [
            [
              1263.120879,
              792.34
            ],
            [
              1295.878704,
              770.434445
            ],
            [
              1333.278229,
              745.42493
            ],
            [
              1376.381255,
              716.601414
            ],
            [
              1426.600172,
              683.019415
            ],
            [
              1485.85567,
              643.394545
            ],
            [
              1556.828012,
              595.93448
            ],
            [
              1643.373714,
              538.06032
            ],
            [
              1751.250321,
              465.921926
            ],
            [
              1889.452416,
              373.50451
            ],
            [
              2072.858603,
              250.858569
            ],
            [
              2327.983707,
              80.25332
            ],
            [
              2707.118987,
              -173.279038
            ],
            [
              3329.712375,
              -589.614783
            ],
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
            ]
          ]
        ],
        "floor_poly": [
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
          ],
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
          ]
        ],
        "well_poly": [
          [
            1623.208791,
            162.186154
          ],
          [
            1679.790489,
            138.109152
          ],
          [
            1744.389668,
            110.620502
          ],
          [
            1818.840349,
            78.939778
          ],
          [
            1905.582115,
            42.028874
          ],
          [
            2007.932521,
            -1.523918
          ],
          [
            2130.521112,
            -53.688589
          ],
          [
            2280.009143,
            -117.29968
          ],
          [
            2466.341463,
            -196.588986
          ],
          [
            2705.054173,
            -298.167526
          ],
          [
            3021.846678,
            -432.971073
          ],
          [
            3462.517312,
            -620.488024
          ],
          [
            4117.387342,
            -899.152456
          ],
          [
            2707.118987,
            -899.152456
          ],
          [
            2327.983707,
            -620.488024
          ],
          [
            2072.858603,
            -432.971073
          ],
          [
            1889.452416,
            -298.167526
          ],
          [
            1751.250321,
            -196.588986
          ],
          [
            1643.373714,
            -117.29968
          ],
          [
            1556.828012,
            -53.688589
          ],
          [
            1485.85567,
            -1.523918
          ],
          [
            1426.600172,
            42.028874
          ],
          [
            1376.381255,
            78.939778
          ],
          [
            1333.278229,
            110.620502
          ],
          [
            1295.878704,
            138.109152
          ],
          [
            1263.120879,
            162.186154
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
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
    "stairs": [
      {
        "id": "great_stair",
        "kind": "stair",
        "via": null,
        "direction": "up",
        "treads": 17,
        "rise_m": 2.8,
        "x": 261.818182,
        "y": 149.78,
        "w": 1117.090909,
        "h": 651.6363640000001,
        "raw_w": 1117.090909,
        "raw_h": 651.6363640000001,
        "hit_polys": [
          [
            [
              396.8,
              727.998667
            ],
            [
              444.988235,
              699.888863
            ],
            [
              493.176471,
              671.779059
            ],
            [
              541.364706,
              643.669255
            ],
            [
              589.552941,
              615.559451
            ],
            [
              637.741176,
              587.449647
            ],
            [
              685.929412,
              559.339843
            ],
            [
              734.117647,
              531.230039
            ],
            [
              782.305882,
              503.120235
            ],
            [
              830.494118,
              475.010431
            ],
            [
              878.682353,
              446.900627
            ],
            [
              926.870588,
              418.790824
            ],
            [
              975.058824,
              390.68102
            ],
            [
              1023.247059,
              362.571216
            ],
            [
              1071.435294,
              334.461412
            ],
            [
              1119.623529,
              306.351608
            ],
            [
              1167.811765,
              278.241804
            ],
            [
              1216,
              250.132
            ],
            [
              1216,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              396.8,
              727.998667
            ]
          ],
          [
            [
              261.818182,
              801.416364
            ],
            [
              327.529412,
              763.084813
            ],
            [
              393.240642,
              724.753262
            ],
            [
              458.951872,
              686.421711
            ],
            [
              524.663102,
              648.09016
            ],
            [
              590.374332,
              609.75861
            ],
            [
              656.085561,
              571.427059
            ],
            [
              721.796791,
              533.095508
            ],
            [
              787.508021,
              494.763957
            ],
            [
              853.219251,
              456.432406
            ],
            [
              918.930481,
              418.100856
            ],
            [
              984.641711,
              379.769305
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1378.909091,
              149.78
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ],
          [
            [
              396.8,
              727.998667
            ],
            [
              261.818182,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              444.988235,
              727.998667
            ]
          ],
          [
            [
              444.988235,
              727.998667
            ],
            [
              327.529412,
              801.416364
            ],
            [
              327.529412,
              763.084813
            ],
            [
              444.988235,
              699.888863
            ]
          ],
          [
            [
              444.988235,
              699.888863
            ],
            [
              327.529412,
              763.084813
            ],
            [
              393.240642,
              763.084813
            ],
            [
              493.176471,
              699.888863
            ]
          ],
          [
            [
              493.176471,
              699.888863
            ],
            [
              393.240642,
              763.084813
            ],
            [
              393.240642,
              724.753262
            ],
            [
              493.176471,
              671.779059
            ]
          ],
          [
            [
              493.176471,
              671.779059
            ],
            [
              393.240642,
              724.753262
            ],
            [
              458.951872,
              724.753262
            ],
            [
              541.364706,
              671.779059
            ]
          ],
          [
            [
              541.364706,
              671.779059
            ],
            [
              458.951872,
              724.753262
            ],
            [
              458.951872,
              686.421711
            ],
            [
              541.364706,
              643.669255
            ]
          ],
          [
            [
              541.364706,
              643.669255
            ],
            [
              458.951872,
              686.421711
            ],
            [
              524.663102,
              686.421711
            ],
            [
              589.552941,
              643.669255
            ]
          ],
          [
            [
              589.552941,
              643.669255
            ],
            [
              524.663102,
              686.421711
            ],
            [
              524.663102,
              648.09016
            ],
            [
              589.552941,
              615.559451
            ]
          ],
          [
            [
              589.552941,
              615.559451
            ],
            [
              524.663102,
              648.09016
            ],
            [
              590.374332,
              648.09016
            ],
            [
              637.741176,
              615.559451
            ]
          ],
          [
            [
              637.741176,
              615.559451
            ],
            [
              590.374332,
              648.09016
            ],
            [
              590.374332,
              609.75861
            ],
            [
              637.741176,
              587.449647
            ]
          ],
          [
            [
              637.741176,
              587.449647
            ],
            [
              590.374332,
              609.75861
            ],
            [
              656.085561,
              609.75861
            ],
            [
              685.929412,
              587.449647
            ]
          ],
          [
            [
              685.929412,
              587.449647
            ],
            [
              656.085561,
              609.75861
            ],
            [
              656.085561,
              571.427059
            ],
            [
              685.929412,
              559.339843
            ]
          ],
          [
            [
              685.929412,
              559.339843
            ],
            [
              656.085561,
              571.427059
            ],
            [
              721.796791,
              571.427059
            ],
            [
              734.117647,
              559.339843
            ]
          ],
          [
            [
              734.117647,
              559.339843
            ],
            [
              721.796791,
              571.427059
            ],
            [
              721.796791,
              533.095508
            ],
            [
              734.117647,
              531.230039
            ]
          ],
          [
            [
              734.117647,
              531.230039
            ],
            [
              721.796791,
              533.095508
            ],
            [
              787.508021,
              533.095508
            ],
            [
              782.305882,
              531.230039
            ]
          ],
          [
            [
              782.305882,
              531.230039
            ],
            [
              787.508021,
              533.095508
            ],
            [
              787.508021,
              494.763957
            ],
            [
              782.305882,
              503.120235
            ]
          ],
          [
            [
              782.305882,
              503.120235
            ],
            [
              787.508021,
              494.763957
            ],
            [
              853.219251,
              494.763957
            ],
            [
              830.494118,
              503.120235
            ]
          ],
          [
            [
              830.494118,
              503.120235
            ],
            [
              853.219251,
              494.763957
            ],
            [
              853.219251,
              456.432406
            ],
            [
              830.494118,
              475.010431
            ]
          ],
          [
            [
              830.494118,
              475.010431
            ],
            [
              853.219251,
              456.432406
            ],
            [
              918.930481,
              456.432406
            ],
            [
              878.682353,
              475.010431
            ]
          ],
          [
            [
              878.682353,
              475.010431
            ],
            [
              918.930481,
              456.432406
            ],
            [
              918.930481,
              418.100856
            ],
            [
              878.682353,
              446.900627
            ]
          ],
          [
            [
              878.682353,
              446.900627
            ],
            [
              918.930481,
              418.100856
            ],
            [
              984.641711,
              418.100856
            ],
            [
              926.870588,
              446.900627
            ]
          ],
          [
            [
              926.870588,
              446.900627
            ],
            [
              984.641711,
              418.100856
            ],
            [
              984.641711,
              379.769305
            ],
            [
              926.870588,
              418.790824
            ]
          ],
          [
            [
              926.870588,
              418.790824
            ],
            [
              984.641711,
              379.769305
            ],
            [
              1050.352941,
              379.769305
            ],
            [
              975.058824,
              418.790824
            ]
          ],
          [
            [
              975.058824,
              418.790824
            ],
            [
              1050.352941,
              379.769305
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              975.058824,
              390.68102
            ]
          ],
          [
            [
              975.058824,
              390.68102
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              1116.064171,
              341.437754
            ],
            [
              1023.247059,
              390.68102
            ]
          ],
          [
            [
              1023.247059,
              390.68102
            ],
            [
              1116.064171,
              341.437754
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1023.247059,
              362.571216
            ]
          ],
          [
            [
              1023.247059,
              362.571216
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1181.775401,
              303.106203
            ],
            [
              1071.435294,
              362.571216
            ]
          ],
          [
            [
              1071.435294,
              362.571216
            ],
            [
              1181.775401,
              303.106203
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1071.435294,
              334.461412
            ]
          ],
          [
            [
              1071.435294,
              334.461412
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1247.486631,
              264.774652
            ],
            [
              1119.623529,
              334.461412
            ]
          ],
          [
            [
              1119.623529,
              334.461412
            ],
            [
              1247.486631,
              264.774652
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1119.623529,
              306.351608
            ]
          ],
          [
            [
              1119.623529,
              306.351608
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1313.197861,
              226.443102
            ],
            [
              1167.811765,
              306.351608
            ]
          ],
          [
            [
              1167.811765,
              306.351608
            ],
            [
              1313.197861,
              226.443102
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1167.811765,
              278.241804
            ]
          ],
          [
            [
              1167.811765,
              278.241804
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1378.909091,
              188.111551
            ],
            [
              1216,
              278.241804
            ]
          ],
          [
            [
              1216,
              278.241804
            ],
            [
              1378.909091,
              188.111551
            ],
            [
              1378.909091,
              149.78
            ],
            [
              1216,
              250.132
            ]
          ],
          [
            [
              396.8,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1216,
              727.998667
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              396.8,
              727.998667
            ],
            [
              261.818182,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              444.988235,
              727.998667
            ]
          ],
          [
            [
              444.988235,
              727.998667
            ],
            [
              327.529412,
              801.416364
            ],
            [
              327.529412,
              763.084813
            ],
            [
              444.988235,
              699.888863
            ]
          ],
          [
            [
              444.988235,
              699.888863
            ],
            [
              327.529412,
              763.084813
            ],
            [
              393.240642,
              763.084813
            ],
            [
              493.176471,
              699.888863
            ]
          ],
          [
            [
              493.176471,
              699.888863
            ],
            [
              393.240642,
              763.084813
            ],
            [
              393.240642,
              724.753262
            ],
            [
              493.176471,
              671.779059
            ]
          ],
          [
            [
              493.176471,
              671.779059
            ],
            [
              393.240642,
              724.753262
            ],
            [
              458.951872,
              724.753262
            ],
            [
              541.364706,
              671.779059
            ]
          ],
          [
            [
              541.364706,
              671.779059
            ],
            [
              458.951872,
              724.753262
            ],
            [
              458.951872,
              686.421711
            ],
            [
              541.364706,
              643.669255
            ]
          ],
          [
            [
              541.364706,
              643.669255
            ],
            [
              458.951872,
              686.421711
            ],
            [
              524.663102,
              686.421711
            ],
            [
              589.552941,
              643.669255
            ]
          ],
          [
            [
              589.552941,
              643.669255
            ],
            [
              524.663102,
              686.421711
            ],
            [
              524.663102,
              648.09016
            ],
            [
              589.552941,
              615.559451
            ]
          ],
          [
            [
              589.552941,
              615.559451
            ],
            [
              524.663102,
              648.09016
            ],
            [
              590.374332,
              648.09016
            ],
            [
              637.741176,
              615.559451
            ]
          ],
          [
            [
              637.741176,
              615.559451
            ],
            [
              590.374332,
              648.09016
            ],
            [
              590.374332,
              609.75861
            ],
            [
              637.741176,
              587.449647
            ]
          ],
          [
            [
              637.741176,
              587.449647
            ],
            [
              590.374332,
              609.75861
            ],
            [
              656.085561,
              609.75861
            ],
            [
              685.929412,
              587.449647
            ]
          ],
          [
            [
              685.929412,
              587.449647
            ],
            [
              656.085561,
              609.75861
            ],
            [
              656.085561,
              571.427059
            ],
            [
              685.929412,
              559.339843
            ]
          ],
          [
            [
              685.929412,
              559.339843
            ],
            [
              656.085561,
              571.427059
            ],
            [
              721.796791,
              571.427059
            ],
            [
              734.117647,
              559.339843
            ]
          ],
          [
            [
              734.117647,
              559.339843
            ],
            [
              721.796791,
              571.427059
            ],
            [
              721.796791,
              533.095508
            ],
            [
              734.117647,
              531.230039
            ]
          ],
          [
            [
              734.117647,
              531.230039
            ],
            [
              721.796791,
              533.095508
            ],
            [
              787.508021,
              533.095508
            ],
            [
              782.305882,
              531.230039
            ]
          ],
          [
            [
              782.305882,
              531.230039
            ],
            [
              787.508021,
              533.095508
            ],
            [
              787.508021,
              494.763957
            ],
            [
              782.305882,
              503.120235
            ]
          ],
          [
            [
              782.305882,
              503.120235
            ],
            [
              787.508021,
              494.763957
            ],
            [
              853.219251,
              494.763957
            ],
            [
              830.494118,
              503.120235
            ]
          ],
          [
            [
              830.494118,
              503.120235
            ],
            [
              853.219251,
              494.763957
            ],
            [
              853.219251,
              456.432406
            ],
            [
              830.494118,
              475.010431
            ]
          ],
          [
            [
              830.494118,
              475.010431
            ],
            [
              853.219251,
              456.432406
            ],
            [
              918.930481,
              456.432406
            ],
            [
              878.682353,
              475.010431
            ]
          ],
          [
            [
              878.682353,
              475.010431
            ],
            [
              918.930481,
              456.432406
            ],
            [
              918.930481,
              418.100856
            ],
            [
              878.682353,
              446.900627
            ]
          ],
          [
            [
              878.682353,
              446.900627
            ],
            [
              918.930481,
              418.100856
            ],
            [
              984.641711,
              418.100856
            ],
            [
              926.870588,
              446.900627
            ]
          ],
          [
            [
              926.870588,
              446.900627
            ],
            [
              984.641711,
              418.100856
            ],
            [
              984.641711,
              379.769305
            ],
            [
              926.870588,
              418.790824
            ]
          ],
          [
            [
              926.870588,
              418.790824
            ],
            [
              984.641711,
              379.769305
            ],
            [
              1050.352941,
              379.769305
            ],
            [
              975.058824,
              418.790824
            ]
          ],
          [
            [
              975.058824,
              418.790824
            ],
            [
              1050.352941,
              379.769305
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              975.058824,
              390.68102
            ]
          ],
          [
            [
              975.058824,
              390.68102
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              1116.064171,
              341.437754
            ],
            [
              1023.247059,
              390.68102
            ]
          ],
          [
            [
              1023.247059,
              390.68102
            ],
            [
              1116.064171,
              341.437754
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1023.247059,
              362.571216
            ]
          ],
          [
            [
              1023.247059,
              362.571216
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1181.775401,
              303.106203
            ],
            [
              1071.435294,
              362.571216
            ]
          ],
          [
            [
              1071.435294,
              362.571216
            ],
            [
              1181.775401,
              303.106203
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1071.435294,
              334.461412
            ]
          ],
          [
            [
              1071.435294,
              334.461412
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1247.486631,
              264.774652
            ],
            [
              1119.623529,
              334.461412
            ]
          ],
          [
            [
              1119.623529,
              334.461412
            ],
            [
              1247.486631,
              264.774652
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1119.623529,
              306.351608
            ]
          ],
          [
            [
              1119.623529,
              306.351608
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1313.197861,
              226.443102
            ],
            [
              1167.811765,
              306.351608
            ]
          ],
          [
            [
              1167.811765,
              306.351608
            ],
            [
              1313.197861,
              226.443102
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1167.811765,
              278.241804
            ]
          ],
          [
            [
              1167.811765,
              278.241804
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1378.909091,
              188.111551
            ],
            [
              1216,
              278.241804
            ]
          ],
          [
            [
              1216,
              278.241804
            ],
            [
              1378.909091,
              188.111551
            ],
            [
              1378.909091,
              149.78
            ],
            [
              1216,
              250.132
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "mass_normal": [
          [
            0,
            1,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "noses": [
          [
            [
              396.8,
              727.998667
            ],
            [
              261.818182,
              801.416364
            ]
          ],
          [
            [
              444.988235,
              699.888863
            ],
            [
              327.529412,
              763.084813
            ]
          ],
          [
            [
              493.176471,
              671.779059
            ],
            [
              393.240642,
              724.753262
            ]
          ],
          [
            [
              541.364706,
              643.669255
            ],
            [
              458.951872,
              686.421711
            ]
          ],
          [
            [
              589.552941,
              615.559451
            ],
            [
              524.663102,
              648.09016
            ]
          ],
          [
            [
              637.741176,
              587.449647
            ],
            [
              590.374332,
              609.75861
            ]
          ],
          [
            [
              685.929412,
              559.339843
            ],
            [
              656.085561,
              571.427059
            ]
          ],
          [
            [
              734.117647,
              531.230039
            ],
            [
              721.796791,
              533.095508
            ]
          ],
          [
            [
              782.305882,
              503.120235
            ],
            [
              787.508021,
              494.763957
            ]
          ],
          [
            [
              830.494118,
              475.010431
            ],
            [
              853.219251,
              456.432406
            ]
          ],
          [
            [
              878.682353,
              446.900627
            ],
            [
              918.930481,
              418.100856
            ]
          ],
          [
            [
              926.870588,
              418.790824
            ],
            [
              984.641711,
              379.769305
            ]
          ],
          [
            [
              975.058824,
              390.68102
            ],
            [
              1050.352941,
              341.437754
            ]
          ],
          [
            [
              1023.247059,
              362.571216
            ],
            [
              1116.064171,
              303.106203
            ]
          ],
          [
            [
              1071.435294,
              334.461412
            ],
            [
              1181.775401,
              264.774652
            ]
          ],
          [
            [
              1119.623529,
              306.351608
            ],
            [
              1247.486631,
              226.443102
            ]
          ],
          [
            [
              1167.811765,
              278.241804
            ],
            [
              1313.197861,
              188.111551
            ]
          ],
          [
            [
              1216,
              250.132
            ],
            [
              1378.909091,
              149.78
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              396.8,
              727.998667
            ],
            [
              444.988235,
              699.888863
            ],
            [
              493.176471,
              671.779059
            ],
            [
              541.364706,
              643.669255
            ],
            [
              589.552941,
              615.559451
            ],
            [
              637.741176,
              587.449647
            ],
            [
              685.929412,
              559.339843
            ],
            [
              734.117647,
              531.230039
            ],
            [
              782.305882,
              503.120235
            ],
            [
              830.494118,
              475.010431
            ],
            [
              878.682353,
              446.900627
            ],
            [
              926.870588,
              418.790824
            ],
            [
              975.058824,
              390.68102
            ],
            [
              1023.247059,
              362.571216
            ],
            [
              1071.435294,
              334.461412
            ],
            [
              1119.623529,
              306.351608
            ],
            [
              1167.811765,
              278.241804
            ],
            [
              1216,
              250.132
            ],
            [
              1216,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              396.8,
              727.998667
            ]
          ],
          [
            [
              261.818182,
              801.416364
            ],
            [
              327.529412,
              763.084813
            ],
            [
              393.240642,
              724.753262
            ],
            [
              458.951872,
              686.421711
            ],
            [
              524.663102,
              648.09016
            ],
            [
              590.374332,
              609.75861
            ],
            [
              656.085561,
              571.427059
            ],
            [
              721.796791,
              533.095508
            ],
            [
              787.508021,
              494.763957
            ],
            [
              853.219251,
              456.432406
            ],
            [
              918.930481,
              418.100856
            ],
            [
              984.641711,
              379.769305
            ],
            [
              1050.352941,
              341.437754
            ],
            [
              1116.064171,
              303.106203
            ],
            [
              1181.775401,
              264.774652
            ],
            [
              1247.486631,
              226.443102
            ],
            [
              1313.197861,
              188.111551
            ],
            [
              1378.909091,
              149.78
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ]
        ],
        "floor_poly": [
          [
            396.8,
            727.998667
          ],
          [
            444.988235,
            727.998667
          ],
          [
            493.176471,
            727.998667
          ],
          [
            541.364706,
            727.998667
          ],
          [
            589.552941,
            727.998667
          ],
          [
            637.741176,
            727.998667
          ],
          [
            685.929412,
            727.998667
          ],
          [
            734.117647,
            727.998667
          ],
          [
            782.305882,
            727.998667
          ],
          [
            830.494118,
            727.998667
          ],
          [
            878.682353,
            727.998667
          ],
          [
            926.870588,
            727.998667
          ],
          [
            975.058824,
            727.998667
          ],
          [
            1023.247059,
            727.998667
          ],
          [
            1071.435294,
            727.998667
          ],
          [
            1119.623529,
            727.998667
          ],
          [
            1167.811765,
            727.998667
          ],
          [
            1216,
            727.998667
          ],
          [
            1378.909091,
            801.416364
          ],
          [
            1313.197861,
            801.416364
          ],
          [
            1247.486631,
            801.416364
          ],
          [
            1181.775401,
            801.416364
          ],
          [
            1116.064171,
            801.416364
          ],
          [
            1050.352941,
            801.416364
          ],
          [
            984.641711,
            801.416364
          ],
          [
            918.930481,
            801.416364
          ],
          [
            853.219251,
            801.416364
          ],
          [
            787.508021,
            801.416364
          ],
          [
            721.796791,
            801.416364
          ],
          [
            656.085561,
            801.416364
          ],
          [
            590.374332,
            801.416364
          ],
          [
            524.663102,
            801.416364
          ],
          [
            458.951872,
            801.416364
          ],
          [
            393.240642,
            801.416364
          ],
          [
            327.529412,
            801.416364
          ],
          [
            261.818182,
            801.416364
          ]
        ],
        "well_poly": [
          [
            396.8,
            250.132
          ],
          [
            444.988235,
            250.132
          ],
          [
            493.176471,
            250.132
          ],
          [
            541.364706,
            250.132
          ],
          [
            589.552941,
            250.132
          ],
          [
            637.741176,
            250.132
          ],
          [
            685.929412,
            250.132
          ],
          [
            734.117647,
            250.132
          ],
          [
            782.305882,
            250.132
          ],
          [
            830.494118,
            250.132
          ],
          [
            878.682353,
            250.132
          ],
          [
            926.870588,
            250.132
          ],
          [
            975.058824,
            250.132
          ],
          [
            1023.247059,
            250.132
          ],
          [
            1071.435294,
            250.132
          ],
          [
            1119.623529,
            250.132
          ],
          [
            1167.811765,
            250.132
          ],
          [
            1216,
            250.132
          ],
          [
            1378.909091,
            149.78
          ],
          [
            1313.197861,
            149.78
          ],
          [
            1247.486631,
            149.78
          ],
          [
            1181.775401,
            149.78
          ],
          [
            1116.064171,
            149.78
          ],
          [
            1050.352941,
            149.78
          ],
          [
            984.641711,
            149.78
          ],
          [
            918.930481,
            149.78
          ],
          [
            853.219251,
            149.78
          ],
          [
            787.508021,
            149.78
          ],
          [
            721.796791,
            149.78
          ],
          [
            656.085561,
            149.78
          ],
          [
            590.374332,
            149.78
          ],
          [
            524.663102,
            149.78
          ],
          [
            458.951872,
            149.78
          ],
          [
            393.240642,
            149.78
          ],
          [
            327.529412,
            149.78
          ],
          [
            261.818182,
            149.78
          ]
        ],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "guest_chamber/N": {
    "floor_line_y": 0.72168,
    "px_per_m_at_wall": 173.684,
    "px_per_m_at_bottom": 406.19,
    "wall_width_m": 8.8,
    "key_tint": "#c8aa87",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 165,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 89,
    "corner_x1_px": 1412,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/guest_chamber-N/row23-96eb20b1.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.5656,
    "measured_room": {
      "storey_height_m": 3.46,
      "wall_width_m": 7.617,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "door",
          "id": "op20",
          "plan_px": [
            594.3,
            768
          ],
          "plan_centre_px": 681.2,
          "painted_px": [
            641,
            856
          ],
          "painted_centre_px": 748.5,
          "centre_delta_px": 67.3,
          "centre_delta_m": 0.387,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op20",
        "kind": "door",
        "via": null,
        "x": 641,
        "y": 331,
        "w": 215,
        "h": 408,
        "beyond_m": 3.9,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "guest_chamber/E": {
    "floor_line_y": 0.693012,
    "px_per_m_at_wall": 155.152,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 6.45,
    "key_tint": "#c88e49",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 147,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 206.5,
    "corner_x1_px": 1329.5,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/guest_chamber-E/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.774,
      "wall_width_m": 7.238,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 6.45,
      "carriers": []
    },
    "openings": []
  },
  "guest_chamber/S": {
    "floor_line_y": 0.725586,
    "px_per_m_at_wall": 174.737,
    "px_per_m_at_bottom": 405.15,
    "wall_width_m": 8.8,
    "key_tint": "#c89c73",
    "image_h_px": 1024,
    "horizon_y": 0.51748,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 166,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 126,
    "corner_x1_px": 1402,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/guest_chamber-S/row23-a64f40f9.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1048.4,
    "nearest_floor_m": 2.5877,
    "measured_room": {
      "storey_height_m": 3.663,
      "wall_width_m": 7.302,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            243.8,
            593.3
          ],
          "plan_centre_px": 418.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "door",
          "id": "op19",
          "plan_px": [
            768,
            942.7
          ],
          "plan_centre_px": 855.4,
          "painted_px": [
            964,
            1161
          ],
          "painted_centre_px": 1062.5,
          "centre_delta_px": 207.1,
          "centre_delta_m": 1.185,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op19",
        "kind": "door",
        "via": null,
        "x": 964,
        "y": 292,
        "w": 197,
        "h": 451,
        "beyond_m": 6,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "guest_chamber/W": {
    "floor_line_y": 0.704102,
    "px_per_m_at_wall": 160,
    "px_per_m_at_bottom": 424.05,
    "wall_width_m": 6.45,
    "key_tint": "#c89f6d",
    "image_h_px": 1024,
    "horizon_y": 0.524805,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 152,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 228,
    "corner_x1_px": 1308,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/guest_chamber-W/row23-686d6ba6.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1056,
    "nearest_floor_m": 2.4903,
    "measured_room": {
      "storey_height_m": 3.613,
      "wall_width_m": 6.75,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 6.45,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            484,
            724
          ],
          "plan_centre_px": 604,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            884,
            1124
          ],
          "plan_centre_px": 1004,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
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
    "corner_x0_px": -1580.0558139534883,
    "corner_x1_px": 2230.1767441860466,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "eye_offset_m": 0.93,
    "openings": [
      {
        "id": "op15",
        "kind": "door",
        "via": null,
        "x": 1039.4790697674418,
        "y": 136.9799999999999,
        "w": 476.279069767442,
        "h": 952.5581395348837,
        "beyond_m": 5.3,
        "beyond_offset_m": -0.93
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
    "corner_x0_px": -1818.1953488372092,
    "corner_x1_px": 1992.0372093023257,
    "focal_px": 1024,
    "storey_height_m": 2.8,
    "nearest_floor_m": 2.433002610966058,
    "camera_wall_m": 2.15,
    "eye_offset_m": 1.43,
    "openings": [
      {
        "id": "op14",
        "kind": "door",
        "via": null,
        "x": 1039.4790697674418,
        "y": 136.9799999999999,
        "w": 476.279069767442,
        "h": 952.5581395348837,
        "beyond_m": 9,
        "beyond_offset_m": -1.43
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
        "beyond_offset_m": 0.93
      }
    ],
    "stairs": []
  },
  "kitchen/E": {
    "floor_line_y": 0.725586,
    "px_per_m_at_wall": 174.737,
    "px_per_m_at_bottom": 412.4,
    "wall_width_m": 8.65,
    "key_tint": "#c8804e",
    "image_h_px": 1024,
    "horizon_y": 0.523828,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 166,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.65,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 190,
    "corner_x1_px": 1458,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/kitchen-E/row23-94a463ee.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1048.4,
    "nearest_floor_m": 2.5422,
    "measured_room": {
      "storey_height_m": 3.182,
      "wall_width_m": 7.257,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.65,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            842.3,
            1104.4
          ],
          "plan_centre_px": 973.3,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "kitchen/S": {
    "floor_line_y": 0.709961,
    "px_per_m_at_wall": 161.053,
    "px_per_m_at_bottom": 458.52,
    "wall_width_m": 8,
    "key_tint": "#c8a47d",
    "image_h_px": 1024,
    "horizon_y": 0.55293,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 153,
    "camera_wall_m": 6.49,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 229,
    "corner_x1_px": 1335,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/kitchen-S/row23-7de99c6d.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1045.2,
    "nearest_floor_m": 2.2796,
    "measured_room": {
      "storey_height_m": 3.49,
      "wall_width_m": 6.867,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            526.4,
            1009.6
          ],
          "plan_centre_px": 768,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            768,
            1009.6
          ],
          "plan_centre_px": 888.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "kitchen/W": {
    "floor_line_y": 0.725586,
    "px_per_m_at_wall": 174.737,
    "px_per_m_at_bottom": 401.11,
    "wall_width_m": 8.65,
    "key_tint": "#c88f56",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 166,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.65,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 104,
    "corner_x1_px": 1461,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/kitchen-W/row23-3da016f1.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1048.4,
    "nearest_floor_m": 2.6138,
    "measured_room": {
      "storey_height_m": 2.976,
      "wall_width_m": 7.766,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.65,
      "carriers": [
        {
          "kind": "door",
          "id": "op02",
          "plan_px": [
            606.4,
            781.1
          ],
          "plan_centre_px": 693.7,
          "painted_px": [
            630,
            793
          ],
          "painted_centre_px": 711.5,
          "centre_delta_px": 17.8,
          "centre_delta_m": 0.102,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op02",
        "kind": "door",
        "via": null,
        "x": 630,
        "y": 403,
        "w": 163,
        "h": 340,
        "beyond_m": 21,
        "beyond_offset_m": -0.425,
        "measured": true
      }
    ]
  },
  "library/N": {
    "floor_line_y": 0.725586,
    "px_per_m_at_wall": 173.684,
    "px_per_m_at_bottom": 398.7,
    "wall_width_m": 8.8,
    "key_tint": "#c8894d",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 165,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 151,
    "corner_x1_px": 1371,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/library-N/row23-3eb92ee4.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.6138,
    "measured_room": {
      "storey_height_m": 3.04,
      "wall_width_m": 7.024,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "door",
          "id": "op08",
          "plan_px": [
            594.3,
            768
          ],
          "plan_centre_px": 681.2,
          "painted_px": [
            621,
            794
          ],
          "painted_centre_px": 707.5,
          "centre_delta_px": 26.3,
          "centre_delta_m": 0.151,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op08",
        "kind": "door",
        "via": null,
        "x": 621,
        "y": 370,
        "w": 173,
        "h": 373,
        "beyond_m": 3.9,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "library/E": {
    "floor_line_y": 0.681641,
    "px_per_m_at_wall": 147.368,
    "px_per_m_at_bottom": 391.86,
    "wall_width_m": 6.45,
    "key_tint": "#c89b62",
    "image_h_px": 1024,
    "horizon_y": 0.489746,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 140,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 199,
    "corner_x1_px": 1316,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/library-E/row23-780b6a83.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 972.6,
    "nearest_floor_m": 2.4821,
    "measured_room": {
      "storey_height_m": 3.929,
      "wall_width_m": 7.58,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 6.45,
      "carriers": [
        {
          "kind": "door",
          "id": "op05",
          "plan_px": [
            882.2,
            1029.6
          ],
          "plan_centre_px": 955.9,
          "painted_px": [
            947,
            1116
          ],
          "painted_centre_px": 1031.5,
          "centre_delta_px": 75.6,
          "centre_delta_m": 0.513,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op05",
        "kind": "door",
        "via": null,
        "x": 947,
        "y": 294,
        "w": 169,
        "h": 404,
        "beyond_m": 15.2,
        "beyond_offset_m": 3.525,
        "measured": true
      }
    ]
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
    "floor_line_y": 0.698242,
    "px_per_m_at_wall": 157.895,
    "px_per_m_at_bottom": 396.94,
    "wall_width_m": 6.45,
    "key_tint": "#c89d63",
    "image_h_px": 1024,
    "horizon_y": 0.498926,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 150,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 6.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 246,
    "corner_x1_px": 1303,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/library-W/row23-68e2896a.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.6254,
    "measured_room": {
      "storey_height_m": 3.629,
      "wall_width_m": 6.694,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 6.45,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            487.7,
            724.6
          ],
          "plan_centre_px": 606.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            882.5,
            1119.3
          ],
          "plan_centre_px": 1000.9,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "long_gallery/N": {
    "floor_line_y": 0.583008,
    "px_per_m_at_wall": 56.842,
    "px_per_m_at_bottom": 399.18,
    "wall_width_m": 8,
    "key_tint": "#c89a66",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 54,
    "camera_wall_m": 18.22,
    "facing_type": "corridor",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 484,
    "corner_x1_px": 1044,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/long_gallery-N/row23-59887309.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1035.7,
    "nearest_floor_m": 2.5945,
    "measured_room": {
      "storey_height_m": 5.964,
      "wall_width_m": 9.852,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            654.3,
            739.6
          ],
          "plan_centre_px": 696.9,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "long_gallery/E": {
    "floor_line_y": 0.663086,
    "px_per_m_at_wall": 132.632,
    "px_per_m_at_bottom": 482.46,
    "wall_width_m": 24.3,
    "key_tint": "#c89052",
    "image_h_px": 1024,
    "horizon_y": 0.535352,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 126,
    "camera_wall_m": 7.55,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 24.3,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 132,
    "corner_x1_px": 1453,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/long_gallery-E/row23-670a301b.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1001.4,
    "nearest_floor_m": 2.0756,
    "measured_room": {
      "storey_height_m": 3.031,
      "wall_width_m": 9.96,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 24.3,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            -724.1,
            -525.2
          ],
          "plan_centre_px": -624.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            -458.8,
            -193.6
          ],
          "plan_centre_px": -326.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            403.3,
            602.2
          ],
          "plan_centre_px": 502.7,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            1199.1,
            1398
          ],
          "plan_centre_px": 1298.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            1862.2,
            2061.2
          ],
          "plan_centre_px": 1961.7,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "long_gallery/S": {
    "floor_line_y": 0.582031,
    "px_per_m_at_wall": 55.789,
    "px_per_m_at_bottom": 397.39,
    "wall_width_m": 8,
    "key_tint": "#c87f3b",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 53,
    "camera_wall_m": 18.22,
    "facing_type": "corridor",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 559,
    "corner_x1_px": 987,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/long_gallery-S/row23-1d39131d.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1016.5,
    "nearest_floor_m": 2.5579,
    "measured_room": {
      "storey_height_m": 8.604,
      "wall_width_m": 7.672,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            768,
            851.7
          ],
          "plan_centre_px": 809.8,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
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
    "floor_line_y": 0.679224,
    "px_per_m_at_wall": 143.217,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 8.8,
    "key_tint": "#c88b44",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 136,
    "camera_wall_m": 7.15,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 114.21,
    "corner_x1_px": 1421.79,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-doors/master_bedchamber-N/doored.png",
    "camera_reference": "ruled",
    "measured_round": "row36doors",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 3.619,
      "wall_width_m": 9.13,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            266.7,
            553.2
          ],
          "plan_centre_px": 410,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "door",
          "id": "op18",
          "plan_px": [
            624.8,
            768
          ],
          "plan_centre_px": 696.4,
          "painted_px": [
            627,
            767
          ],
          "painted_centre_px": 697,
          "centre_delta_px": 0.6,
          "centre_delta_m": 0.004,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op18",
        "kind": "door",
        "via": null,
        "x": 627,
        "y": 411,
        "w": 140,
        "h": 285,
        "beyond_m": 6,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "master_bedchamber/E": {
    "floor_line_y": 0.693012,
    "px_per_m_at_wall": 155.152,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 7.6,
    "key_tint": "#c8863b",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 147,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 255.35,
    "corner_x1_px": 1280.65,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/master_bedchamber-E/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 2.773,
      "wall_width_m": 6.608,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.6,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            411.2,
            597.3
          ],
          "plan_centre_px": 504.2,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            954.2,
            1140.4
          ],
          "plan_centre_px": 1047.3,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "master_bedchamber/S": {
    "floor_line_y": 0.676758,
    "px_per_m_at_wall": 135.789,
    "px_per_m_at_bottom": 405.25,
    "wall_width_m": 8.8,
    "key_tint": "#c8b49c",
    "image_h_px": 1024,
    "horizon_y": 0.513867,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 129,
    "camera_wall_m": 7.15,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 146,
    "corner_x1_px": 1389,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/master_bedchamber-S/row23-88c52bf2.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 970.9,
    "nearest_floor_m": 2.3958,
    "measured_room": {
      "storey_height_m": 3.888,
      "wall_width_m": 9.154,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            496.4,
            700.1
          ],
          "plan_centre_px": 598.3,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            971.7,
            1175.4
          ],
          "plan_centre_px": 1073.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "master_bedchamber/W": {
    "floor_line_y": 0.706055,
    "px_per_m_at_wall": 160,
    "px_per_m_at_bottom": 394.58,
    "wall_width_m": 7.6,
    "key_tint": "#c8ad8a",
    "image_h_px": 1024,
    "horizon_y": 0.505566,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 152,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 276,
    "corner_x1_px": 1324,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/master_bedchamber-W/row23-13474627.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1056,
    "nearest_floor_m": 2.6763,
    "measured_room": {
      "storey_height_m": 3.375,
      "wall_width_m": 6.55,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.6,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            544,
            784
          ],
          "plan_centre_px": 664,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "muniment_room/N": {
    "floor_line_y": 0.780273,
    "px_per_m_at_wall": 222.105,
    "px_per_m_at_bottom": 435.76,
    "wall_width_m": 5.45,
    "key_tint": "#c89d6c",
    "image_h_px": 1024,
    "horizon_y": 0.551855,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 211,
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
    "corner_x0_px": 225,
    "corner_x1_px": 1310,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/muniment_room-N/row23-46bf6894.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 966.2,
    "nearest_floor_m": 2.2172,
    "measured_room": {
      "storey_height_m": 3.188,
      "wall_width_m": 4.885,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            529.2,
            1017.9
          ],
          "plan_centre_px": 773.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "muniment_room/E": {
    "floor_line_y": 0.783203,
    "px_per_m_at_wall": 244.211,
    "px_per_m_at_bottom": 440.71,
    "wall_width_m": 4.8,
    "key_tint": "#c89663",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 232,
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
    "corner_x0_px": 170,
    "corner_x1_px": 1384,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/muniment_room-E/row23-60d54205.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 998.8,
    "nearest_floor_m": 2.2664,
    "measured_room": {
      "storey_height_m": 3.067,
      "wall_width_m": 4.971,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.8,
      "carriers": [
        {
          "kind": "door",
          "id": "op25",
          "plan_px": [
            768,
            1012.2
          ],
          "plan_centre_px": 890.1,
          "painted_px": [
            843,
            1051
          ],
          "painted_centre_px": 947,
          "centre_delta_px": 56.9,
          "centre_delta_m": 0.233,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op25",
        "kind": "door",
        "via": null,
        "x": 843,
        "y": 230,
        "w": 208,
        "h": 572,
        "beyond_m": 8.6,
        "beyond_offset_m": -0.75,
        "measured": true
      }
    ]
  },
  "muniment_room/S": {
    "floor_line_y": 0.797852,
    "px_per_m_at_wall": 247.368,
    "px_per_m_at_bottom": 420.59,
    "wall_width_m": 5.45,
    "key_tint": "#c89253",
    "image_h_px": 1024,
    "horizon_y": 0.50918,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 235,
    "camera_wall_m": 3.85,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.45,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 174,
    "corner_x1_px": 1367,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/muniment_room-S/row23-7bcf46be.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 952.4,
    "nearest_floor_m": 2.2644,
    "measured_room": {
      "storey_height_m": 2.89,
      "wall_width_m": 4.823,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.45,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            316.6,
            662.9
          ],
          "plan_centre_px": 489.7,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            885.5,
            1231.8
          ],
          "plan_centre_px": 1058.7,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "muniment_room/W": {
    "floor_line_y": 0.790039,
    "px_per_m_at_wall": 252.632,
    "px_per_m_at_bottom": 418.94,
    "wall_width_m": 4.8,
    "key_tint": "#c89659",
    "image_h_px": 1024,
    "horizon_y": 0.471094,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 240,
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
    "corner_x0_px": 172,
    "corner_x1_px": 1379,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/muniment_room-W/row23-19d4346a.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1033.3,
    "nearest_floor_m": 2.4664,
    "measured_room": {
      "storey_height_m": 2.85,
      "wall_width_m": 4.778,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 4.8,
      "carriers": [
        {
          "kind": "door",
          "id": "op22",
          "plan_px": [
            515.4,
            768
          ],
          "plan_centre_px": 641.7,
          "painted_px": [
            592,
            810
          ],
          "painted_centre_px": 701,
          "centre_delta_px": 59.3,
          "centre_delta_m": 0.235,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op22",
        "kind": "door",
        "via": null,
        "x": 592,
        "y": 276,
        "w": 218,
        "h": 533,
        "beyond_m": 14.95,
        "beyond_offset_m": 2.25,
        "measured": true
      }
    ]
  },
  "privy_garden/N": {
    "floor_line_y": 0.750977,
    "px_per_m_at_wall": 198.947,
    "px_per_m_at_bottom": 361.97,
    "wall_width_m": 20.4,
    "key_tint": "#c8c4c0",
    "image_h_px": 1024,
    "horizon_y": 0.44707,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 189,
    "camera_wall_m": 5.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 20.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 143,
    "corner_x1_px": 1415,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/privy_garden-N/row23-11d58c22.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1014.6,
    "nearest_floor_m": 2.8031,
    "measured_room": {
      "storey_height_m": 3.267,
      "wall_width_m": 6.394,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 20.4,
      "carriers": []
    },
    "openings": []
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
    "floor_line_y": 0.737305,
    "px_per_m_at_wall": 189.474,
    "px_per_m_at_bottom": 412.14,
    "wall_width_m": 20.4,
    "key_tint": "#c8c3bd",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 180,
    "camera_wall_m": 5.1,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 20.4,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 97,
    "corner_x1_px": 1420,
    "storey_height_m": null,
    "camera_id": "measured:backdrops/source/privy_garden-S/row23-506337da.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 966.3,
    "nearest_floor_m": 2.3446,
    "measured_room": {
      "storey_height_m": 3.378,
      "wall_width_m": 6.983,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 20.4,
      "carriers": [
        {
          "kind": "door",
          "id": "op10",
          "plan_px": [
            218.5,
            521.7
          ],
          "plan_centre_px": 370.1,
          "painted_px": [
            439,
            527
          ],
          "painted_centre_px": 483,
          "centre_delta_px": 112.9,
          "centre_delta_m": 0.596,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            995.4,
            1279.6
          ],
          "plan_centre_px": 1137.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": [
      {
        "id": "op10",
        "kind": "door",
        "via": null,
        "x": 439,
        "y": 472,
        "w": 88,
        "h": 283,
        "beyond_m": 9.9,
        "beyond_offset_m": 2.9,
        "measured": true
      }
    ]
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
    "floor_line_y": 0.706055,
    "px_per_m_at_wall": 157.895,
    "px_per_m_at_bottom": 461.19,
    "wall_width_m": 8,
    "key_tint": "#c88a48",
    "image_h_px": 1024,
    "horizon_y": 0.553027,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 150,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 241,
    "corner_x1_px": 1269,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/servants_hall-N/row23-e7912869.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.2596,
    "measured_room": {
      "storey_height_m": 3.35,
      "wall_width_m": 6.511,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            452.2,
            689.1
          ],
          "plan_centre_px": 570.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "servants_hall/E": {
    "floor_line_y": 0.71582,
    "px_per_m_at_wall": 173.684,
    "px_per_m_at_bottom": 431.42,
    "wall_width_m": 7.05,
    "key_tint": "#c8b08c",
    "image_h_px": 1024,
    "horizon_y": 0.524316,
    "key_dir": "L-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 165,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.05,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 146,
    "corner_x1_px": 1374,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/servants_hall-E/row23-a1213e7d.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1042.1,
    "nearest_floor_m": 2.4155,
    "measured_room": {
      "storey_height_m": 3.443,
      "wall_width_m": 7.07,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.05,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            312.1,
            572.6
          ],
          "plan_centre_px": 442.3,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            659.4,
            1006.8
          ],
          "plan_centre_px": 833.1,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "servants_hall/S": {
    "floor_line_y": 0.706055,
    "px_per_m_at_wall": 161.053,
    "px_per_m_at_bottom": 407.25,
    "wall_width_m": 8,
    "key_tint": "#c87b38",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 153,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 188,
    "corner_x1_px": 1388,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/servants_hall-S/row23-aa3b7fd3.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1062.9,
    "nearest_floor_m": 2.6101,
    "measured_room": {
      "storey_height_m": 4.228,
      "wall_width_m": 7.451,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8,
      "carriers": [
        {
          "kind": "door",
          "id": "op16",
          "plan_px": [
            687.5,
            848.5
          ],
          "plan_centre_px": 768,
          "painted_px": [
            701,
            868
          ],
          "painted_centre_px": 784.5,
          "centre_delta_px": 16.5,
          "centre_delta_m": 0.102,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op16",
        "kind": "door",
        "via": null,
        "x": 701,
        "y": 372,
        "w": 167,
        "h": 351,
        "beyond_m": 5.3,
        "beyond_offset_m": 0,
        "measured": true
      }
    ]
  },
  "servants_hall/W": {
    "floor_line_y": 0.710936,
    "px_per_m_at_wall": 170.667,
    "px_per_m_at_bottom": 420.88,
    "wall_width_m": 7.05,
    "key_tint": "#c87d31",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 162,
    "camera_wall_m": 6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 7.05,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 121.97,
    "corner_x1_px": 1414.03,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source-snapped/servants_hall-W/snapped.png",
    "camera_reference": "ruled",
    "measured_round": "row35snap",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1024,
    "nearest_floor_m": 2.433,
    "measured_room": {
      "storey_height_m": 4.005,
      "wall_width_m": 7.571,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 7.05,
      "carriers": [
        {
          "kind": "door",
          "id": "op12",
          "plan_px": [
            192,
            328.5
          ],
          "plan_centre_px": 260.3,
          "painted_px": [
            296,
            426
          ],
          "painted_centre_px": 361,
          "centre_delta_px": 100.7,
          "centre_delta_m": 0.59,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        },
        {
          "kind": "door",
          "id": "op17",
          "plan_px": [
            704,
            874.7
          ],
          "plan_centre_px": 789.3,
          "painted_px": [
            731,
            917
          ],
          "painted_centre_px": 824,
          "centre_delta_px": 34.7,
          "centre_delta_m": 0.203,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op12",
        "kind": "door",
        "via": null,
        "x": 296,
        "y": 350,
        "w": 130,
        "h": 378,
        "beyond_m": 6.05,
        "beyond_offset_m": -4.55,
        "measured": true
      },
      {
        "id": "op17",
        "kind": "door",
        "via": null,
        "x": 731,
        "y": 350,
        "w": 185,
        "h": 378,
        "beyond_m": 21,
        "beyond_offset_m": 0.9,
        "measured": true
      }
    ]
  },
  "solar/N": {
    "floor_line_y": 0.657227,
    "px_per_m_at_wall": 117.895,
    "px_per_m_at_bottom": 434.02,
    "wall_width_m": 14.6,
    "key_tint": "#c8ad87",
    "image_h_px": 1024,
    "horizon_y": 0.529395,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 112,
    "camera_wall_m": 8.85,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 88,
    "corner_x1_px": 1484,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/solar-N/row23-0d155462.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1043.4,
    "nearest_floor_m": 2.404,
    "measured_room": {
      "storey_height_m": 4.462,
      "wall_width_m": 11.841,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 14.6,
      "carriers": [
        {
          "kind": "fireplace",
          "id": null,
          "plan_px": [
            202.1,
            555.8
          ],
          "plan_centre_px": 378.9,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            791.6,
            968.4
          ],
          "plan_centre_px": 880,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            1263.2,
            1440
          ],
          "plan_centre_px": 1351.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "solar/E": {
    "floor_line_y": 0.62793,
    "px_per_m_at_wall": 95.789,
    "px_per_m_at_bottom": 469.34,
    "wall_width_m": 9.3,
    "key_tint": "#c88b46",
    "image_h_px": 1024,
    "horizon_y": 0.53252,
    "key_dir": "L-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 91,
    "camera_wall_m": 10.95,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 201,
    "corner_x1_px": 1330,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/solar-E/row23-5e45b619.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1048.9,
    "nearest_floor_m": 2.2348,
    "measured_room": {
      "storey_height_m": 4.541,
      "wall_width_m": 11.786,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 9.3,
      "carriers": [
        {
          "kind": "door",
          "id": "op23",
          "plan_px": [
            504.6,
            600.4
          ],
          "plan_centre_px": 552.5,
          "painted_px": [
            408,
            543
          ],
          "painted_centre_px": 475.5,
          "centre_delta_px": -77,
          "centre_delta_m": -0.804,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        },
        {
          "kind": "door",
          "id": "op22",
          "plan_px": [
            983.5,
            1079.3
          ],
          "plan_centre_px": 1031.4,
          "painted_px": [
            975,
            1114
          ],
          "painted_centre_px": 1044.5,
          "centre_delta_px": 13.1,
          "centre_delta_m": 0.137,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op23",
        "kind": "door",
        "via": null,
        "x": 408,
        "y": 382,
        "w": 135,
        "h": 261,
        "beyond_m": 5.8,
        "beyond_offset_m": -2.575,
        "measured": true
      },
      {
        "id": "op22",
        "kind": "door",
        "via": null,
        "x": 975,
        "y": 382,
        "w": 139,
        "h": 261,
        "beyond_m": 5.8,
        "beyond_offset_m": 2.25,
        "measured": true
      }
    ]
  },
  "solar/S": {
    "floor_line_y": 0.657227,
    "px_per_m_at_wall": 122.105,
    "px_per_m_at_bottom": 413.86,
    "wall_width_m": 14.6,
    "key_tint": "#c8a97e",
    "image_h_px": 1024,
    "horizon_y": 0.51377,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 116,
    "camera_wall_m": 8.85,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 14.6,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 541,
    "corner_x1_px": 1455,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/solar-S/row23-0d788619.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "camera_source": "declared",
    "suspect_perspective": true,
    "tolerance_ruling": "design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: \"I think its pretty close and we can accept a tolerance for drift here\"",
    "declared_fields": [
      "horizon_y"
    ],
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1080.6,
    "nearest_floor_m": 2.6111,
    "measured_room": {
      "storey_height_m": 3.923,
      "wall_width_m": 7.485,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 14.6,
      "carriers": [
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            -50.1,
            133.1
          ],
          "plan_centre_px": 41.5,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            255.2,
            438.3
          ],
          "plan_centre_px": 346.7,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            987.8,
            1170.9
          ],
          "plan_centre_px": 1079.4,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        },
        {
          "kind": "window",
          "id": null,
          "plan_px": [
            1293.1,
            1476.2
          ],
          "plan_centre_px": 1384.6,
          "painted_px": null,
          "painted_centre_px": null,
          "centre_delta_px": null,
          "centre_delta_m": null,
          "painted_feature": null
        }
      ]
    },
    "openings": []
  },
  "solar/W": {
    "floor_line_y": 0.629883,
    "px_per_m_at_wall": 96.842,
    "px_per_m_at_bottom": 403.98,
    "wall_width_m": 9.3,
    "key_tint": "#c89c6e",
    "image_h_px": 1024,
    "horizon_y": 0.513184,
    "key_dir": "C-BELOW",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 92,
    "camera_wall_m": 10.95,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 9.3,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 241,
    "corner_x1_px": 1305,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/solar-W/row23-2a1561fb.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1060.4,
    "nearest_floor_m": 2.6249,
    "measured_room": {
      "storey_height_m": 4.678,
      "wall_width_m": 10.987,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 9.3,
      "carriers": [
        {
          "kind": "door",
          "id": "op21",
          "plan_px": [
            453.3,
            550.1
          ],
          "plan_centre_px": 501.7,
          "painted_px": [
            420,
            577
          ],
          "painted_centre_px": 498.5,
          "centre_delta_px": -3.2,
          "centre_delta_m": -0.033,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op21",
        "kind": "door",
        "via": null,
        "x": 420,
        "y": 382,
        "w": 157,
        "h": 263,
        "beyond_m": 9.4,
        "beyond_offset_m": -2.875,
        "measured": true
      }
    ]
  },
  "stair_landing/N": {
    "floor_line_y": 0.731445,
    "px_per_m_at_wall": 192.632,
    "px_per_m_at_bottom": 394.75,
    "wall_width_m": 8.8,
    "key_tint": "#c88c52",
    "image_h_px": 1024,
    "horizon_y": 0.475488,
    "key_dir": "C-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 183,
    "camera_wall_m": 5.2,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 8.8,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 105,
    "corner_x1_px": 1352,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/stair_landing-N/row23-e594b388.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1001.7,
    "nearest_floor_m": 2.5375,
    "measured_room": {
      "storey_height_m": 3.13,
      "wall_width_m": 6.474,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 8.8,
      "carriers": [
        {
          "kind": "door",
          "id": "op19",
          "plan_px": [
            575.4,
            768
          ],
          "plan_centre_px": 671.7,
          "painted_px": [
            652,
            852
          ],
          "painted_centre_px": 752,
          "centre_delta_px": 80.3,
          "centre_delta_m": 0.417,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ],
      "flight_evidence": {
        "read": true,
        "ratio": 0.6444,
        "body_px": 85080,
        "ring_px": 27500,
        "body_edge": 28.295,
        "ring_edge": 43.907,
        "why": null,
        "asked": {
          "prompt": "backdrops/source/stair_landing-N/row23-e594b388.prompt.txt",
          "via": "beside the candidate"
        },
        "geometry": "this painting's own measured camera",
        "against_the_ask": [
          {
            "id": "great_stair",
            "agreed_px": 56669,
            "disputed_px": 36976,
            "agreed_of_union": 0.605,
            "aim_of_this_lands_on_the_ask": true,
            "aim_of_the_ask_lands_on_this": true,
            "apart_px": 62.9,
            "apart_m": 0.327,
            "over": false
          }
        ]
      }
    },
    "openings": [
      {
        "id": "op19",
        "kind": "door",
        "via": null,
        "x": 652,
        "y": 279,
        "w": 200,
        "h": 470,
        "beyond_m": 6.8,
        "beyond_offset_m": 0,
        "measured": true
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
        "x": 0,
        "y": 759.483429,
        "w": 404.28,
        "h": 264.516571,
        "raw_w": 2350.0154439999997,
        "raw_h": 1111.6469860000002,
        "hit_polys": [
          [
            [
              -558.024079,
              1871.130415
            ],
            [
              -410.289256,
              1645.077799
            ],
            [
              -292.989075,
              1465.593961
            ],
            [
              -197.597099,
              1319.632397
            ],
            [
              -118.499838,
              1198.603769
            ],
            [
              -51.850671,
              1096.622269
            ],
            [
              5.074606,
              1009.51953
            ],
            [
              54.259336,
              934.260788
            ],
            [
              97.181818,
              868.584062
            ],
            [
              134.966448,
              810.768889
            ],
            [
              168.483636,
              759.483429
            ],
            [
              168.483636,
              759.483429
            ],
            [
              134.966448,
              775.797294
            ],
            [
              97.181818,
              794.188255
            ],
            [
              54.259336,
              815.07997
            ],
            [
              5.074606,
              839.019717
            ],
            [
              -51.850671,
              866.72703
            ],
            [
              -118.499838,
              899.167265
            ],
            [
              -197.597099,
              937.666377
            ],
            [
              -292.989075,
              984.096636
            ],
            [
              -410.289256,
              1041.190304
            ],
            [
              -558.024079,
              1113.097464
            ]
          ],
          [
            [
              -16.32973,
              1871.130415
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              338.150142,
              934.260788
            ],
            [
              363,
              868.584062
            ],
            [
              384.875312,
              810.768889
            ],
            [
              404.28,
              759.483429
            ],
            [
              404.28,
              759.483429
            ],
            [
              384.875312,
              775.797294
            ],
            [
              363,
              794.188255
            ],
            [
              338.150142,
              815.07997
            ],
            [
              309.674772,
              839.019717
            ],
            [
              276.718033,
              866.72703
            ],
            [
              238.131673,
              899.167265
            ],
            [
              192.338521,
              937.666377
            ],
            [
              137.111588,
              984.096636
            ],
            [
              69.200957,
              1041.190304
            ],
            [
              -16.32973,
              1113.097464
            ]
          ],
          [
            [
              -558.024079,
              1871.130415
            ],
            [
              -16.32973,
              1871.130415
            ],
            [
              69.200957,
              1712.176409
            ],
            [
              -410.289256,
              1712.176409
            ]
          ],
          [
            [
              -410.289256,
              1712.176409
            ],
            [
              69.200957,
              1712.176409
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              -410.289256,
              1645.077799
            ]
          ],
          [
            [
              -410.289256,
              1645.077799
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              137.111588,
              1525.781127
            ],
            [
              -292.989075,
              1525.781127
            ]
          ],
          [
            [
              -292.989075,
              1525.781127
            ],
            [
              137.111588,
              1525.781127
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              -292.989075,
              1465.593961
            ]
          ],
          [
            [
              -292.989075,
              1465.593961
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              192.338521,
              1374.198971
            ],
            [
              -197.597099,
              1374.198971
            ]
          ],
          [
            [
              -197.597099,
              1374.198971
            ],
            [
              192.338521,
              1374.198971
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              -197.597099,
              1319.632397
            ]
          ],
          [
            [
              -197.597099,
              1319.632397
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              238.131673,
              1248.509853
            ],
            [
              -118.499838,
              1248.509853
            ]
          ],
          [
            [
              -118.499838,
              1248.509853
            ],
            [
              238.131673,
              1248.509853
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              -118.499838,
              1198.603769
            ]
          ],
          [
            [
              -118.499838,
              1198.603769
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              276.718033,
              1142.601317
            ],
            [
              -51.850671,
              1142.601317
            ]
          ],
          [
            [
              -51.850671,
              1142.601317
            ],
            [
              276.718033,
              1142.601317
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              -51.850671,
              1096.622269
            ]
          ],
          [
            [
              -51.850671,
              1096.622269
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              309.674772,
              1052.144483
            ],
            [
              5.074606,
              1052.144483
            ]
          ],
          [
            [
              5.074606,
              1052.144483
            ],
            [
              309.674772,
              1052.144483
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              5.074606,
              1009.51953
            ]
          ],
          [
            [
              5.074606,
              1009.51953
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              338.150142,
              973.987728
            ],
            [
              54.259336,
              973.987728
            ]
          ],
          [
            [
              54.259336,
              973.987728
            ],
            [
              338.150142,
              973.987728
            ],
            [
              338.150142,
              934.260788
            ],
            [
              54.259336,
              934.260788
            ]
          ],
          [
            [
              54.259336,
              934.260788
            ],
            [
              338.150142,
              934.260788
            ],
            [
              363,
              905.781965
            ],
            [
              97.181818,
              905.781965
            ]
          ],
          [
            [
              97.181818,
              905.781965
            ],
            [
              363,
              905.781965
            ],
            [
              363,
              868.584062
            ],
            [
              97.181818,
              868.584062
            ]
          ],
          [
            [
              97.181818,
              868.584062
            ],
            [
              363,
              868.584062
            ],
            [
              384.875312,
              845.740484
            ],
            [
              134.966448,
              845.740484
            ]
          ],
          [
            [
              134.966448,
              845.740484
            ],
            [
              384.875312,
              845.740484
            ],
            [
              384.875312,
              810.768889
            ],
            [
              134.966448,
              810.768889
            ]
          ],
          [
            [
              134.966448,
              810.768889
            ],
            [
              384.875312,
              810.768889
            ],
            [
              404.28,
              792.480158
            ],
            [
              168.483636,
              792.480158
            ]
          ],
          [
            [
              168.483636,
              792.480158
            ],
            [
              404.28,
              792.480158
            ],
            [
              404.28,
              759.483429
            ],
            [
              168.483636,
              759.483429
            ]
          ],
          [
            [
              -1945.735444,
              1788.540002
            ],
            [
              -1377.756235,
              1512.086751
            ],
            [
              -1008.77704,
              1332.493033
            ],
            [
              -749.804065,
              1206.442784
            ],
            [
              -558.024079,
              1113.097464
            ],
            [
              -410.289256,
              1041.190304
            ],
            [
              -292.989075,
              984.096636
            ],
            [
              -197.597099,
              937.666377
            ],
            [
              -118.499838,
              899.167265
            ],
            [
              -51.850671,
              866.72703
            ],
            [
              5.074606,
              839.019717
            ],
            [
              54.259336,
              815.07997
            ],
            [
              97.181818,
              794.188255
            ],
            [
              134.966448,
              775.797294
            ],
            [
              168.483636,
              759.483429
            ],
            [
              404.28,
              759.483429
            ],
            [
              384.875312,
              775.797294
            ],
            [
              363,
              794.188255
            ],
            [
              338.150142,
              815.07997
            ],
            [
              309.674772,
              839.019717
            ],
            [
              276.718033,
              866.72703
            ],
            [
              238.131673,
              899.167265
            ],
            [
              192.338521,
              937.666377
            ],
            [
              137.111588,
              984.096636
            ],
            [
              69.200957,
              1041.190304
            ],
            [
              -16.32973,
              1113.097464
            ],
            [
              -127.360248,
              1206.442784
            ],
            [
              -277.291971,
              1332.493033
            ],
            [
              -490.911504,
              1512.086751
            ],
            [
              -819.741573,
              1788.540002
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              -558.024079,
              1871.130415
            ],
            [
              -16.32973,
              1871.130415
            ],
            [
              69.200957,
              1712.176409
            ],
            [
              -410.289256,
              1712.176409
            ]
          ],
          [
            [
              -410.289256,
              1712.176409
            ],
            [
              69.200957,
              1712.176409
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              -410.289256,
              1645.077799
            ]
          ],
          [
            [
              -410.289256,
              1645.077799
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              137.111588,
              1525.781127
            ],
            [
              -292.989075,
              1525.781127
            ]
          ],
          [
            [
              -292.989075,
              1525.781127
            ],
            [
              137.111588,
              1525.781127
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              -292.989075,
              1465.593961
            ]
          ],
          [
            [
              -292.989075,
              1465.593961
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              192.338521,
              1374.198971
            ],
            [
              -197.597099,
              1374.198971
            ]
          ],
          [
            [
              -197.597099,
              1374.198971
            ],
            [
              192.338521,
              1374.198971
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              -197.597099,
              1319.632397
            ]
          ],
          [
            [
              -197.597099,
              1319.632397
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              238.131673,
              1248.509853
            ],
            [
              -118.499838,
              1248.509853
            ]
          ],
          [
            [
              -118.499838,
              1248.509853
            ],
            [
              238.131673,
              1248.509853
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              -118.499838,
              1198.603769
            ]
          ],
          [
            [
              -118.499838,
              1198.603769
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              276.718033,
              1142.601317
            ],
            [
              -51.850671,
              1142.601317
            ]
          ],
          [
            [
              -51.850671,
              1142.601317
            ],
            [
              276.718033,
              1142.601317
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              -51.850671,
              1096.622269
            ]
          ],
          [
            [
              -51.850671,
              1096.622269
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              309.674772,
              1052.144483
            ],
            [
              5.074606,
              1052.144483
            ]
          ],
          [
            [
              5.074606,
              1052.144483
            ],
            [
              309.674772,
              1052.144483
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              5.074606,
              1009.51953
            ]
          ],
          [
            [
              5.074606,
              1009.51953
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              338.150142,
              973.987728
            ],
            [
              54.259336,
              973.987728
            ]
          ],
          [
            [
              54.259336,
              973.987728
            ],
            [
              338.150142,
              973.987728
            ],
            [
              338.150142,
              934.260788
            ],
            [
              54.259336,
              934.260788
            ]
          ],
          [
            [
              54.259336,
              934.260788
            ],
            [
              338.150142,
              934.260788
            ],
            [
              363,
              905.781965
            ],
            [
              97.181818,
              905.781965
            ]
          ],
          [
            [
              97.181818,
              905.781965
            ],
            [
              363,
              905.781965
            ],
            [
              363,
              868.584062
            ],
            [
              97.181818,
              868.584062
            ]
          ],
          [
            [
              97.181818,
              868.584062
            ],
            [
              363,
              868.584062
            ],
            [
              384.875312,
              845.740484
            ],
            [
              134.966448,
              845.740484
            ]
          ],
          [
            [
              134.966448,
              845.740484
            ],
            [
              384.875312,
              845.740484
            ],
            [
              384.875312,
              810.768889
            ],
            [
              134.966448,
              810.768889
            ]
          ],
          [
            [
              134.966448,
              810.768889
            ],
            [
              384.875312,
              810.768889
            ],
            [
              404.28,
              792.480158
            ],
            [
              168.483636,
              792.480158
            ]
          ],
          [
            [
              168.483636,
              792.480158
            ],
            [
              404.28,
              792.480158
            ],
            [
              404.28,
              759.483429
            ],
            [
              168.483636,
              759.483429
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "mass_normal": [
          [
            -1,
            0,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              -558.024079,
              1871.130415
            ],
            [
              -16.32973,
              1871.130415
            ]
          ],
          [
            [
              -410.289256,
              1645.077799
            ],
            [
              69.200957,
              1645.077799
            ]
          ],
          [
            [
              -292.989075,
              1465.593961
            ],
            [
              137.111588,
              1465.593961
            ]
          ],
          [
            [
              -197.597099,
              1319.632397
            ],
            [
              192.338521,
              1319.632397
            ]
          ],
          [
            [
              -118.499838,
              1198.603769
            ],
            [
              238.131673,
              1198.603769
            ]
          ],
          [
            [
              -51.850671,
              1096.622269
            ],
            [
              276.718033,
              1096.622269
            ]
          ],
          [
            [
              5.074606,
              1009.51953
            ],
            [
              309.674772,
              1009.51953
            ]
          ],
          [
            [
              54.259336,
              934.260788
            ],
            [
              338.150142,
              934.260788
            ]
          ],
          [
            [
              97.181818,
              868.584062
            ],
            [
              363,
              868.584062
            ]
          ],
          [
            [
              134.966448,
              810.768889
            ],
            [
              384.875312,
              810.768889
            ]
          ],
          [
            [
              168.483636,
              759.483429
            ],
            [
              404.28,
              759.483429
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              -558.024079,
              1871.130415
            ],
            [
              -410.289256,
              1645.077799
            ],
            [
              -292.989075,
              1465.593961
            ],
            [
              -197.597099,
              1319.632397
            ],
            [
              -118.499838,
              1198.603769
            ],
            [
              -51.850671,
              1096.622269
            ],
            [
              5.074606,
              1009.51953
            ],
            [
              54.259336,
              934.260788
            ],
            [
              97.181818,
              868.584062
            ],
            [
              134.966448,
              810.768889
            ],
            [
              168.483636,
              759.483429
            ],
            [
              168.483636,
              759.483429
            ],
            [
              134.966448,
              775.797294
            ],
            [
              97.181818,
              794.188255
            ],
            [
              54.259336,
              815.07997
            ],
            [
              5.074606,
              839.019717
            ],
            [
              -51.850671,
              866.72703
            ],
            [
              -118.499838,
              899.167265
            ],
            [
              -197.597099,
              937.666377
            ],
            [
              -292.989075,
              984.096636
            ],
            [
              -410.289256,
              1041.190304
            ],
            [
              -558.024079,
              1113.097464
            ]
          ],
          [
            [
              -16.32973,
              1871.130415
            ],
            [
              69.200957,
              1645.077799
            ],
            [
              137.111588,
              1465.593961
            ],
            [
              192.338521,
              1319.632397
            ],
            [
              238.131673,
              1198.603769
            ],
            [
              276.718033,
              1096.622269
            ],
            [
              309.674772,
              1009.51953
            ],
            [
              338.150142,
              934.260788
            ],
            [
              363,
              868.584062
            ],
            [
              384.875312,
              810.768889
            ],
            [
              404.28,
              759.483429
            ],
            [
              404.28,
              759.483429
            ],
            [
              384.875312,
              775.797294
            ],
            [
              363,
              794.188255
            ],
            [
              338.150142,
              815.07997
            ],
            [
              309.674772,
              839.019717
            ],
            [
              276.718033,
              866.72703
            ],
            [
              238.131673,
              899.167265
            ],
            [
              192.338521,
              937.666377
            ],
            [
              137.111588,
              984.096636
            ],
            [
              69.200957,
              1041.190304
            ],
            [
              -16.32973,
              1113.097464
            ]
          ]
        ],
        "floor_poly": [
          [
            -1945.735444,
            1788.540002
          ],
          [
            -1377.756235,
            1512.086751
          ],
          [
            -1008.77704,
            1332.493033
          ],
          [
            -749.804065,
            1206.442784
          ],
          [
            -558.024079,
            1113.097464
          ],
          [
            -410.289256,
            1041.190304
          ],
          [
            -292.989075,
            984.096636
          ],
          [
            -197.597099,
            937.666377
          ],
          [
            -118.499838,
            899.167265
          ],
          [
            -51.850671,
            866.72703
          ],
          [
            5.074606,
            839.019717
          ],
          [
            54.259336,
            815.07997
          ],
          [
            97.181818,
            794.188255
          ],
          [
            134.966448,
            775.797294
          ],
          [
            168.483636,
            759.483429
          ],
          [
            404.28,
            759.483429
          ],
          [
            384.875312,
            775.797294
          ],
          [
            363,
            794.188255
          ],
          [
            338.150142,
            815.07997
          ],
          [
            309.674772,
            839.019717
          ],
          [
            276.718033,
            866.72703
          ],
          [
            238.131673,
            899.167265
          ],
          [
            192.338521,
            937.666377
          ],
          [
            137.111588,
            984.096636
          ],
          [
            69.200957,
            1041.190304
          ],
          [
            -16.32973,
            1113.097464
          ],
          [
            -127.360248,
            1206.442784
          ],
          [
            -277.291971,
            1332.493033
          ],
          [
            -490.911504,
            1512.086751
          ],
          [
            -819.741573,
            1788.540002
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
  },
  "stair_landing/E": {
    "floor_line_y": 0.700195,
    "px_per_m_at_wall": 158.947,
    "px_per_m_at_bottom": 402.32,
    "wall_width_m": 5.65,
    "key_tint": "#c89c67",
    "image_h_px": 1024,
    "horizon_y": 0.504395,
    "key_dir": "R-ABOVE",
    "calibration_ref": "the wainscot chair-rail's undercut shadow above the wall's own floor line, taken at 0.95 m — blueprint §11 rules it there on every panelled wall in the manor and this facing's own scaffold declares it as the measurement anchor",
    "calibration_px": 151,
    "camera_wall_m": 6.6,
    "facing_type": "enclosed",
    "wall_continuous": true,
    "wall_segments": [
      {
        "from_m": 0,
        "to_m": 5.65,
        "kind": "wall"
      }
    ],
    "corner_x0_px": 275,
    "corner_x1_px": 1244,
    "storey_height_m": 2.8,
    "camera_id": "measured:backdrops/source/stair_landing-E/row23-178cf7b9.png",
    "camera_reference": "ruled",
    "measured_round": "manor",
    "provisional": false,
    "measured": true,
    "backdrop": "wall",
    "focal_px": 1049.1,
    "nearest_floor_m": 2.6075,
    "measured_room": {
      "storey_height_m": 3.077,
      "wall_width_m": 6.096,
      "ruled_storey_height_m": 2.8,
      "ruled_wall_width_m": 5.65,
      "carriers": [
        {
          "kind": "door",
          "id": "op21",
          "plan_px": [
            668.7,
            827.6
          ],
          "plan_centre_px": 748.1,
          "painted_px": [
            683,
            865
          ],
          "painted_centre_px": 774,
          "centre_delta_px": 25.9,
          "centre_delta_m": 0.163,
          "painted_feature": "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)"
        }
      ]
    },
    "openings": [
      {
        "id": "op21",
        "kind": "door",
        "via": null,
        "x": 683,
        "y": 339,
        "w": 182,
        "h": 378,
        "beyond_m": 15.2,
        "beyond_offset_m": -2.875,
        "measured": true
      }
    ]
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
        "x": 1263.120879,
        "y": 792.34,
        "w": 272.87912099999994,
        "h": 231.65999999999997,
        "raw_w": 3929.655041,
        "raw_h": 1119.2477,
        "hit_polys": [
          [
            [
              1623.208791,
              1422.493846
            ],
            [
              1679.790489,
              1442.280069
            ],
            [
              1744.389668,
              1464.869948
            ],
            [
              1818.840349,
              1490.904829
            ],
            [
              1905.582115,
              1521.237816
            ],
            [
              2007.932521,
              1557.029035
            ],
            [
              2130.521112,
              1599.897405
            ],
            [
              2280.009143,
              1652.17232
            ],
            [
              2466.341463,
              1717.331425
            ],
            [
              2705.054173,
              1800.807584
            ],
            [
              3021.846678,
              1911.5877
            ],
            [
              3021.846678,
              1227.758058
            ],
            [
              2705.054173,
              1129.135549
            ],
            [
              2466.341463,
              1054.820513
            ],
            [
              2280.009143,
              996.81232
            ],
            [
              2130.521112,
              950.274336
            ],
            [
              2007.932521,
              912.110572
            ],
            [
              1905.582115,
              880.247274
            ],
            [
              1818.840349,
              853.243193
            ],
            [
              1744.389668,
              830.06552
            ],
            [
              1679.790489,
              809.954776
            ],
            [
              1623.208791,
              792.34
            ]
          ],
          [
            [
              1263.120879,
              1422.493846
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2072.858603,
              1911.5877
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
            ]
          ],
          [
            [
              1623.208791,
              1422.493846
            ],
            [
              1263.120879,
              1422.493846
            ],
            [
              1295.878704,
              1481.8004
            ],
            [
              1679.790489,
              1481.8004
            ]
          ],
          [
            [
              1679.790489,
              1481.8004
            ],
            [
              1295.878704,
              1481.8004
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1679.790489,
              1442.280069
            ]
          ],
          [
            [
              1679.790489,
              1442.280069
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1333.278229,
              1507.190244
            ],
            [
              1744.389668,
              1507.190244
            ]
          ],
          [
            [
              1744.389668,
              1507.190244
            ],
            [
              1333.278229,
              1507.190244
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1744.389668,
              1464.869948
            ]
          ],
          [
            [
              1744.389668,
              1464.869948
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1376.381255,
              1536.452089
            ],
            [
              1818.840349,
              1536.452089
            ]
          ],
          [
            [
              1818.840349,
              1536.452089
            ],
            [
              1376.381255,
              1536.452089
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1818.840349,
              1490.904829
            ]
          ],
          [
            [
              1818.840349,
              1490.904829
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1426.600172,
              1570.544781
            ],
            [
              1905.582115,
              1570.544781
            ]
          ],
          [
            [
              1905.582115,
              1570.544781
            ],
            [
              1426.600172,
              1570.544781
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1905.582115,
              1521.237816
            ]
          ],
          [
            [
              1905.582115,
              1521.237816
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1485.85567,
              1610.77224
            ],
            [
              2007.932521,
              1610.77224
            ]
          ],
          [
            [
              2007.932521,
              1610.77224
            ],
            [
              1485.85567,
              1610.77224
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              2007.932521,
              1557.029035
            ]
          ],
          [
            [
              2007.932521,
              1557.029035
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              1556.828012,
              1658.954047
            ],
            [
              2130.521112,
              1658.954047
            ]
          ],
          [
            [
              2130.521112,
              1658.954047
            ],
            [
              1556.828012,
              1658.954047
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              2130.521112,
              1599.897405
            ]
          ],
          [
            [
              2130.521112,
              1599.897405
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              1643.373714,
              1717.70832
            ],
            [
              2280.009143,
              1717.70832
            ]
          ],
          [
            [
              2280.009143,
              1717.70832
            ],
            [
              1643.373714,
              1717.70832
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              2280.009143,
              1652.17232
            ]
          ],
          [
            [
              2280.009143,
              1652.17232
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              1751.250321,
              1790.943748
            ],
            [
              2466.341463,
              1790.943748
            ]
          ],
          [
            [
              2466.341463,
              1790.943748
            ],
            [
              1751.250321,
              1790.943748
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              2466.341463,
              1717.331425
            ]
          ],
          [
            [
              2466.341463,
              1717.331425
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              1889.452416,
              1884.766589
            ],
            [
              2705.054173,
              1884.766589
            ]
          ],
          [
            [
              2705.054173,
              1884.766589
            ],
            [
              1889.452416,
              1884.766589
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2705.054173,
              1800.807584
            ]
          ],
          [
            [
              2705.054173,
              1800.807584
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2072.858603,
              2009.277649
            ],
            [
              3021.846678,
              2009.277649
            ]
          ],
          [
            [
              3021.846678,
              2009.277649
            ],
            [
              2072.858603,
              2009.277649
            ],
            [
              2072.858603,
              1911.5877
            ],
            [
              3021.846678,
              1911.5877
            ]
          ],
          [
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
            ],
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
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              1623.208791,
              1422.493846
            ],
            [
              1263.120879,
              1422.493846
            ],
            [
              1295.878704,
              1481.8004
            ],
            [
              1679.790489,
              1481.8004
            ]
          ],
          [
            [
              1679.790489,
              1481.8004
            ],
            [
              1295.878704,
              1481.8004
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1679.790489,
              1442.280069
            ]
          ],
          [
            [
              1679.790489,
              1442.280069
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1333.278229,
              1507.190244
            ],
            [
              1744.389668,
              1507.190244
            ]
          ],
          [
            [
              1744.389668,
              1507.190244
            ],
            [
              1333.278229,
              1507.190244
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1744.389668,
              1464.869948
            ]
          ],
          [
            [
              1744.389668,
              1464.869948
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1376.381255,
              1536.452089
            ],
            [
              1818.840349,
              1536.452089
            ]
          ],
          [
            [
              1818.840349,
              1536.452089
            ],
            [
              1376.381255,
              1536.452089
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1818.840349,
              1490.904829
            ]
          ],
          [
            [
              1818.840349,
              1490.904829
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1426.600172,
              1570.544781
            ],
            [
              1905.582115,
              1570.544781
            ]
          ],
          [
            [
              1905.582115,
              1570.544781
            ],
            [
              1426.600172,
              1570.544781
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1905.582115,
              1521.237816
            ]
          ],
          [
            [
              1905.582115,
              1521.237816
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1485.85567,
              1610.77224
            ],
            [
              2007.932521,
              1610.77224
            ]
          ],
          [
            [
              2007.932521,
              1610.77224
            ],
            [
              1485.85567,
              1610.77224
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              2007.932521,
              1557.029035
            ]
          ],
          [
            [
              2007.932521,
              1557.029035
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              1556.828012,
              1658.954047
            ],
            [
              2130.521112,
              1658.954047
            ]
          ],
          [
            [
              2130.521112,
              1658.954047
            ],
            [
              1556.828012,
              1658.954047
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              2130.521112,
              1599.897405
            ]
          ],
          [
            [
              2130.521112,
              1599.897405
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              1643.373714,
              1717.70832
            ],
            [
              2280.009143,
              1717.70832
            ]
          ],
          [
            [
              2280.009143,
              1717.70832
            ],
            [
              1643.373714,
              1717.70832
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              2280.009143,
              1652.17232
            ]
          ],
          [
            [
              2280.009143,
              1652.17232
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              1751.250321,
              1790.943748
            ],
            [
              2466.341463,
              1790.943748
            ]
          ],
          [
            [
              2466.341463,
              1790.943748
            ],
            [
              1751.250321,
              1790.943748
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              2466.341463,
              1717.331425
            ]
          ],
          [
            [
              2466.341463,
              1717.331425
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              1889.452416,
              1884.766589
            ],
            [
              2705.054173,
              1884.766589
            ]
          ],
          [
            [
              2705.054173,
              1884.766589
            ],
            [
              1889.452416,
              1884.766589
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2705.054173,
              1800.807584
            ]
          ],
          [
            [
              2705.054173,
              1800.807584
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2072.858603,
              2009.277649
            ],
            [
              3021.846678,
              2009.277649
            ]
          ],
          [
            [
              3021.846678,
              2009.277649
            ],
            [
              2072.858603,
              2009.277649
            ],
            [
              2072.858603,
              1911.5877
            ],
            [
              3021.846678,
              1911.5877
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "mass_normal": [
          [
            1,
            0,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "noses": [
          [
            [
              1623.208791,
              1422.493846
            ],
            [
              1263.120879,
              1422.493846
            ]
          ],
          [
            [
              1679.790489,
              1442.280069
            ],
            [
              1295.878704,
              1442.280069
            ]
          ],
          [
            [
              1744.389668,
              1464.869948
            ],
            [
              1333.278229,
              1464.869948
            ]
          ],
          [
            [
              1818.840349,
              1490.904829
            ],
            [
              1376.381255,
              1490.904829
            ]
          ],
          [
            [
              1905.582115,
              1521.237816
            ],
            [
              1426.600172,
              1521.237816
            ]
          ],
          [
            [
              2007.932521,
              1557.029035
            ],
            [
              1485.85567,
              1557.029035
            ]
          ],
          [
            [
              2130.521112,
              1599.897405
            ],
            [
              1556.828012,
              1599.897405
            ]
          ],
          [
            [
              2280.009143,
              1652.17232
            ],
            [
              1643.373714,
              1652.17232
            ]
          ],
          [
            [
              2466.341463,
              1717.331425
            ],
            [
              1751.250321,
              1717.331425
            ]
          ],
          [
            [
              2705.054173,
              1800.807584
            ],
            [
              1889.452416,
              1800.807584
            ]
          ],
          [
            [
              3021.846678,
              1911.5877
            ],
            [
              2072.858603,
              1911.5877
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              1623.208791,
              1422.493846
            ],
            [
              1679.790489,
              1442.280069
            ],
            [
              1744.389668,
              1464.869948
            ],
            [
              1818.840349,
              1490.904829
            ],
            [
              1905.582115,
              1521.237816
            ],
            [
              2007.932521,
              1557.029035
            ],
            [
              2130.521112,
              1599.897405
            ],
            [
              2280.009143,
              1652.17232
            ],
            [
              2466.341463,
              1717.331425
            ],
            [
              2705.054173,
              1800.807584
            ],
            [
              3021.846678,
              1911.5877
            ],
            [
              3021.846678,
              1227.758058
            ],
            [
              2705.054173,
              1129.135549
            ],
            [
              2466.341463,
              1054.820513
            ],
            [
              2280.009143,
              996.81232
            ],
            [
              2130.521112,
              950.274336
            ],
            [
              2007.932521,
              912.110572
            ],
            [
              1905.582115,
              880.247274
            ],
            [
              1818.840349,
              853.243193
            ],
            [
              1744.389668,
              830.06552
            ],
            [
              1679.790489,
              809.954776
            ],
            [
              1623.208791,
              792.34
            ]
          ],
          [
            [
              1263.120879,
              1422.493846
            ],
            [
              1295.878704,
              1442.280069
            ],
            [
              1333.278229,
              1464.869948
            ],
            [
              1376.381255,
              1490.904829
            ],
            [
              1426.600172,
              1521.237816
            ],
            [
              1485.85567,
              1557.029035
            ],
            [
              1556.828012,
              1599.897405
            ],
            [
              1643.373714,
              1652.17232
            ],
            [
              1751.250321,
              1717.331425
            ],
            [
              1889.452416,
              1800.807584
            ],
            [
              2072.858603,
              1911.5877
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
            ]
          ]
        ],
        "floor_poly": [
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
          ],
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
    "stairs": [
      {
        "id": "great_stair",
        "kind": "stair",
        "via": null,
        "direction": "down",
        "treads": 17,
        "rise_m": 2.8,
        "x": 261.818182,
        "y": 727.998667,
        "w": 1117.090909,
        "h": 296.00133300000005,
        "raw_w": 1117.090909,
        "raw_h": 725.05406,
        "hit_polys": [
          [
            [
              396.8,
              1205.865333
            ],
            [
              444.988235,
              1177.755529
            ],
            [
              493.176471,
              1149.645725
            ],
            [
              541.364706,
              1121.535922
            ],
            [
              589.552941,
              1093.426118
            ],
            [
              637.741176,
              1065.316314
            ],
            [
              685.929412,
              1037.20651
            ],
            [
              734.117647,
              1009.096706
            ],
            [
              782.305882,
              980.986902
            ],
            [
              830.494118,
              952.877098
            ],
            [
              878.682353,
              924.767294
            ],
            [
              926.870588,
              896.65749
            ],
            [
              975.058824,
              868.547686
            ],
            [
              1023.247059,
              840.437882
            ],
            [
              1071.435294,
              812.328078
            ],
            [
              1119.623529,
              784.218275
            ],
            [
              1167.811765,
              756.108471
            ],
            [
              1216,
              727.998667
            ],
            [
              1216,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              396.8,
              727.998667
            ]
          ],
          [
            [
              261.818182,
              1453.052727
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ],
          [
            [
              396.8,
              1205.865333
            ],
            [
              261.818182,
              1453.052727
            ],
            [
              327.529412,
              1453.052727
            ],
            [
              444.988235,
              1205.865333
            ]
          ],
          [
            [
              444.988235,
              1205.865333
            ],
            [
              327.529412,
              1453.052727
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              444.988235,
              1177.755529
            ]
          ],
          [
            [
              444.988235,
              1177.755529
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              393.240642,
              1414.721176
            ],
            [
              493.176471,
              1177.755529
            ]
          ],
          [
            [
              493.176471,
              1177.755529
            ],
            [
              393.240642,
              1414.721176
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              493.176471,
              1149.645725
            ]
          ],
          [
            [
              493.176471,
              1149.645725
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              458.951872,
              1376.389626
            ],
            [
              541.364706,
              1149.645725
            ]
          ],
          [
            [
              541.364706,
              1149.645725
            ],
            [
              458.951872,
              1376.389626
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              541.364706,
              1121.535922
            ]
          ],
          [
            [
              541.364706,
              1121.535922
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              524.663102,
              1338.058075
            ],
            [
              589.552941,
              1121.535922
            ]
          ],
          [
            [
              589.552941,
              1121.535922
            ],
            [
              524.663102,
              1338.058075
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              589.552941,
              1093.426118
            ]
          ],
          [
            [
              589.552941,
              1093.426118
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              590.374332,
              1299.726524
            ],
            [
              637.741176,
              1093.426118
            ]
          ],
          [
            [
              637.741176,
              1093.426118
            ],
            [
              590.374332,
              1299.726524
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              637.741176,
              1065.316314
            ]
          ],
          [
            [
              637.741176,
              1065.316314
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              656.085561,
              1261.394973
            ],
            [
              685.929412,
              1065.316314
            ]
          ],
          [
            [
              685.929412,
              1065.316314
            ],
            [
              656.085561,
              1261.394973
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              685.929412,
              1037.20651
            ]
          ],
          [
            [
              685.929412,
              1037.20651
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              721.796791,
              1223.063422
            ],
            [
              734.117647,
              1037.20651
            ]
          ],
          [
            [
              734.117647,
              1037.20651
            ],
            [
              721.796791,
              1223.063422
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              734.117647,
              1009.096706
            ]
          ],
          [
            [
              734.117647,
              1009.096706
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              787.508021,
              1184.731872
            ],
            [
              782.305882,
              1009.096706
            ]
          ],
          [
            [
              782.305882,
              1009.096706
            ],
            [
              787.508021,
              1184.731872
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              782.305882,
              980.986902
            ]
          ],
          [
            [
              782.305882,
              980.986902
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              853.219251,
              1146.400321
            ],
            [
              830.494118,
              980.986902
            ]
          ],
          [
            [
              830.494118,
              980.986902
            ],
            [
              853.219251,
              1146.400321
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              830.494118,
              952.877098
            ]
          ],
          [
            [
              830.494118,
              952.877098
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              918.930481,
              1108.06877
            ],
            [
              878.682353,
              952.877098
            ]
          ],
          [
            [
              878.682353,
              952.877098
            ],
            [
              918.930481,
              1108.06877
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              878.682353,
              924.767294
            ]
          ],
          [
            [
              878.682353,
              924.767294
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              984.641711,
              1069.737219
            ],
            [
              926.870588,
              924.767294
            ]
          ],
          [
            [
              926.870588,
              924.767294
            ],
            [
              984.641711,
              1069.737219
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              926.870588,
              896.65749
            ]
          ],
          [
            [
              926.870588,
              896.65749
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              1050.352941,
              1031.405668
            ],
            [
              975.058824,
              896.65749
            ]
          ],
          [
            [
              975.058824,
              896.65749
            ],
            [
              1050.352941,
              1031.405668
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              975.058824,
              868.547686
            ]
          ],
          [
            [
              975.058824,
              868.547686
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              1116.064171,
              993.074118
            ],
            [
              1023.247059,
              868.547686
            ]
          ],
          [
            [
              1023.247059,
              868.547686
            ],
            [
              1116.064171,
              993.074118
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1023.247059,
              840.437882
            ]
          ],
          [
            [
              1023.247059,
              840.437882
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1181.775401,
              954.742567
            ],
            [
              1071.435294,
              840.437882
            ]
          ],
          [
            [
              1071.435294,
              840.437882
            ],
            [
              1181.775401,
              954.742567
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1071.435294,
              812.328078
            ]
          ],
          [
            [
              1071.435294,
              812.328078
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1247.486631,
              916.411016
            ],
            [
              1119.623529,
              812.328078
            ]
          ],
          [
            [
              1119.623529,
              812.328078
            ],
            [
              1247.486631,
              916.411016
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1119.623529,
              784.218275
            ]
          ],
          [
            [
              1119.623529,
              784.218275
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1313.197861,
              878.079465
            ],
            [
              1167.811765,
              784.218275
            ]
          ],
          [
            [
              1167.811765,
              784.218275
            ],
            [
              1313.197861,
              878.079465
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1167.811765,
              756.108471
            ]
          ],
          [
            [
              1167.811765,
              756.108471
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1378.909091,
              839.747914
            ],
            [
              1216,
              756.108471
            ]
          ],
          [
            [
              1216,
              756.108471
            ],
            [
              1378.909091,
              839.747914
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1216,
              727.998667
            ]
          ],
          [
            [
              396.8,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1216,
              727.998667
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ]
        ],
        "treads_poly": [
          [
            [
              396.8,
              1205.865333
            ],
            [
              261.818182,
              1453.052727
            ],
            [
              327.529412,
              1453.052727
            ],
            [
              444.988235,
              1205.865333
            ]
          ],
          [
            [
              444.988235,
              1205.865333
            ],
            [
              327.529412,
              1453.052727
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              444.988235,
              1177.755529
            ]
          ],
          [
            [
              444.988235,
              1177.755529
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              393.240642,
              1414.721176
            ],
            [
              493.176471,
              1177.755529
            ]
          ],
          [
            [
              493.176471,
              1177.755529
            ],
            [
              393.240642,
              1414.721176
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              493.176471,
              1149.645725
            ]
          ],
          [
            [
              493.176471,
              1149.645725
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              458.951872,
              1376.389626
            ],
            [
              541.364706,
              1149.645725
            ]
          ],
          [
            [
              541.364706,
              1149.645725
            ],
            [
              458.951872,
              1376.389626
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              541.364706,
              1121.535922
            ]
          ],
          [
            [
              541.364706,
              1121.535922
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              524.663102,
              1338.058075
            ],
            [
              589.552941,
              1121.535922
            ]
          ],
          [
            [
              589.552941,
              1121.535922
            ],
            [
              524.663102,
              1338.058075
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              589.552941,
              1093.426118
            ]
          ],
          [
            [
              589.552941,
              1093.426118
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              590.374332,
              1299.726524
            ],
            [
              637.741176,
              1093.426118
            ]
          ],
          [
            [
              637.741176,
              1093.426118
            ],
            [
              590.374332,
              1299.726524
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              637.741176,
              1065.316314
            ]
          ],
          [
            [
              637.741176,
              1065.316314
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              656.085561,
              1261.394973
            ],
            [
              685.929412,
              1065.316314
            ]
          ],
          [
            [
              685.929412,
              1065.316314
            ],
            [
              656.085561,
              1261.394973
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              685.929412,
              1037.20651
            ]
          ],
          [
            [
              685.929412,
              1037.20651
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              721.796791,
              1223.063422
            ],
            [
              734.117647,
              1037.20651
            ]
          ],
          [
            [
              734.117647,
              1037.20651
            ],
            [
              721.796791,
              1223.063422
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              734.117647,
              1009.096706
            ]
          ],
          [
            [
              734.117647,
              1009.096706
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              787.508021,
              1184.731872
            ],
            [
              782.305882,
              1009.096706
            ]
          ],
          [
            [
              782.305882,
              1009.096706
            ],
            [
              787.508021,
              1184.731872
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              782.305882,
              980.986902
            ]
          ],
          [
            [
              782.305882,
              980.986902
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              853.219251,
              1146.400321
            ],
            [
              830.494118,
              980.986902
            ]
          ],
          [
            [
              830.494118,
              980.986902
            ],
            [
              853.219251,
              1146.400321
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              830.494118,
              952.877098
            ]
          ],
          [
            [
              830.494118,
              952.877098
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              918.930481,
              1108.06877
            ],
            [
              878.682353,
              952.877098
            ]
          ],
          [
            [
              878.682353,
              952.877098
            ],
            [
              918.930481,
              1108.06877
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              878.682353,
              924.767294
            ]
          ],
          [
            [
              878.682353,
              924.767294
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              984.641711,
              1069.737219
            ],
            [
              926.870588,
              924.767294
            ]
          ],
          [
            [
              926.870588,
              924.767294
            ],
            [
              984.641711,
              1069.737219
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              926.870588,
              896.65749
            ]
          ],
          [
            [
              926.870588,
              896.65749
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              1050.352941,
              1031.405668
            ],
            [
              975.058824,
              896.65749
            ]
          ],
          [
            [
              975.058824,
              896.65749
            ],
            [
              1050.352941,
              1031.405668
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              975.058824,
              868.547686
            ]
          ],
          [
            [
              975.058824,
              868.547686
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              1116.064171,
              993.074118
            ],
            [
              1023.247059,
              868.547686
            ]
          ],
          [
            [
              1023.247059,
              868.547686
            ],
            [
              1116.064171,
              993.074118
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1023.247059,
              840.437882
            ]
          ],
          [
            [
              1023.247059,
              840.437882
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1181.775401,
              954.742567
            ],
            [
              1071.435294,
              840.437882
            ]
          ],
          [
            [
              1071.435294,
              840.437882
            ],
            [
              1181.775401,
              954.742567
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1071.435294,
              812.328078
            ]
          ],
          [
            [
              1071.435294,
              812.328078
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1247.486631,
              916.411016
            ],
            [
              1119.623529,
              812.328078
            ]
          ],
          [
            [
              1119.623529,
              812.328078
            ],
            [
              1247.486631,
              916.411016
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1119.623529,
              784.218275
            ]
          ],
          [
            [
              1119.623529,
              784.218275
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1313.197861,
              878.079465
            ],
            [
              1167.811765,
              784.218275
            ]
          ],
          [
            [
              1167.811765,
              784.218275
            ],
            [
              1313.197861,
              878.079465
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1167.811765,
              756.108471
            ]
          ],
          [
            [
              1167.811765,
              756.108471
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1378.909091,
              839.747914
            ],
            [
              1216,
              756.108471
            ]
          ],
          [
            [
              1216,
              756.108471
            ],
            [
              1378.909091,
              839.747914
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1216,
              727.998667
            ]
          ]
        ],
        "treads_face": [
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser",
          "going",
          "riser"
        ],
        "treads_normal": [
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "mass_normal": [
          [
            0,
            1,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "noses": [
          [
            [
              396.8,
              1205.865333
            ],
            [
              261.818182,
              1453.052727
            ]
          ],
          [
            [
              444.988235,
              1177.755529
            ],
            [
              327.529412,
              1414.721176
            ]
          ],
          [
            [
              493.176471,
              1149.645725
            ],
            [
              393.240642,
              1376.389626
            ]
          ],
          [
            [
              541.364706,
              1121.535922
            ],
            [
              458.951872,
              1338.058075
            ]
          ],
          [
            [
              589.552941,
              1093.426118
            ],
            [
              524.663102,
              1299.726524
            ]
          ],
          [
            [
              637.741176,
              1065.316314
            ],
            [
              590.374332,
              1261.394973
            ]
          ],
          [
            [
              685.929412,
              1037.20651
            ],
            [
              656.085561,
              1223.063422
            ]
          ],
          [
            [
              734.117647,
              1009.096706
            ],
            [
              721.796791,
              1184.731872
            ]
          ],
          [
            [
              782.305882,
              980.986902
            ],
            [
              787.508021,
              1146.400321
            ]
          ],
          [
            [
              830.494118,
              952.877098
            ],
            [
              853.219251,
              1108.06877
            ]
          ],
          [
            [
              878.682353,
              924.767294
            ],
            [
              918.930481,
              1069.737219
            ]
          ],
          [
            [
              926.870588,
              896.65749
            ],
            [
              984.641711,
              1031.405668
            ]
          ],
          [
            [
              975.058824,
              868.547686
            ],
            [
              1050.352941,
              993.074118
            ]
          ],
          [
            [
              1023.247059,
              840.437882
            ],
            [
              1116.064171,
              954.742567
            ]
          ],
          [
            [
              1071.435294,
              812.328078
            ],
            [
              1181.775401,
              916.411016
            ]
          ],
          [
            [
              1119.623529,
              784.218275
            ],
            [
              1247.486631,
              878.079465
            ]
          ],
          [
            [
              1167.811765,
              756.108471
            ],
            [
              1313.197861,
              839.747914
            ]
          ],
          [
            [
              1216,
              727.998667
            ],
            [
              1378.909091,
              801.416364
            ]
          ]
        ],
        "mass_poly": [
          [
            [
              396.8,
              1205.865333
            ],
            [
              444.988235,
              1177.755529
            ],
            [
              493.176471,
              1149.645725
            ],
            [
              541.364706,
              1121.535922
            ],
            [
              589.552941,
              1093.426118
            ],
            [
              637.741176,
              1065.316314
            ],
            [
              685.929412,
              1037.20651
            ],
            [
              734.117647,
              1009.096706
            ],
            [
              782.305882,
              980.986902
            ],
            [
              830.494118,
              952.877098
            ],
            [
              878.682353,
              924.767294
            ],
            [
              926.870588,
              896.65749
            ],
            [
              975.058824,
              868.547686
            ],
            [
              1023.247059,
              840.437882
            ],
            [
              1071.435294,
              812.328078
            ],
            [
              1119.623529,
              784.218275
            ],
            [
              1167.811765,
              756.108471
            ],
            [
              1216,
              727.998667
            ],
            [
              1216,
              727.998667
            ],
            [
              1167.811765,
              727.998667
            ],
            [
              1119.623529,
              727.998667
            ],
            [
              1071.435294,
              727.998667
            ],
            [
              1023.247059,
              727.998667
            ],
            [
              975.058824,
              727.998667
            ],
            [
              926.870588,
              727.998667
            ],
            [
              878.682353,
              727.998667
            ],
            [
              830.494118,
              727.998667
            ],
            [
              782.305882,
              727.998667
            ],
            [
              734.117647,
              727.998667
            ],
            [
              685.929412,
              727.998667
            ],
            [
              637.741176,
              727.998667
            ],
            [
              589.552941,
              727.998667
            ],
            [
              541.364706,
              727.998667
            ],
            [
              493.176471,
              727.998667
            ],
            [
              444.988235,
              727.998667
            ],
            [
              396.8,
              727.998667
            ]
          ],
          [
            [
              261.818182,
              1453.052727
            ],
            [
              327.529412,
              1414.721176
            ],
            [
              393.240642,
              1376.389626
            ],
            [
              458.951872,
              1338.058075
            ],
            [
              524.663102,
              1299.726524
            ],
            [
              590.374332,
              1261.394973
            ],
            [
              656.085561,
              1223.063422
            ],
            [
              721.796791,
              1184.731872
            ],
            [
              787.508021,
              1146.400321
            ],
            [
              853.219251,
              1108.06877
            ],
            [
              918.930481,
              1069.737219
            ],
            [
              984.641711,
              1031.405668
            ],
            [
              1050.352941,
              993.074118
            ],
            [
              1116.064171,
              954.742567
            ],
            [
              1181.775401,
              916.411016
            ],
            [
              1247.486631,
              878.079465
            ],
            [
              1313.197861,
              839.747914
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1378.909091,
              801.416364
            ],
            [
              1313.197861,
              801.416364
            ],
            [
              1247.486631,
              801.416364
            ],
            [
              1181.775401,
              801.416364
            ],
            [
              1116.064171,
              801.416364
            ],
            [
              1050.352941,
              801.416364
            ],
            [
              984.641711,
              801.416364
            ],
            [
              918.930481,
              801.416364
            ],
            [
              853.219251,
              801.416364
            ],
            [
              787.508021,
              801.416364
            ],
            [
              721.796791,
              801.416364
            ],
            [
              656.085561,
              801.416364
            ],
            [
              590.374332,
              801.416364
            ],
            [
              524.663102,
              801.416364
            ],
            [
              458.951872,
              801.416364
            ],
            [
              393.240642,
              801.416364
            ],
            [
              327.529412,
              801.416364
            ],
            [
              261.818182,
              801.416364
            ]
          ]
        ],
        "floor_poly": [
          [
            396.8,
            727.998667
          ],
          [
            444.988235,
            727.998667
          ],
          [
            493.176471,
            727.998667
          ],
          [
            541.364706,
            727.998667
          ],
          [
            589.552941,
            727.998667
          ],
          [
            637.741176,
            727.998667
          ],
          [
            685.929412,
            727.998667
          ],
          [
            734.117647,
            727.998667
          ],
          [
            782.305882,
            727.998667
          ],
          [
            830.494118,
            727.998667
          ],
          [
            878.682353,
            727.998667
          ],
          [
            926.870588,
            727.998667
          ],
          [
            975.058824,
            727.998667
          ],
          [
            1023.247059,
            727.998667
          ],
          [
            1071.435294,
            727.998667
          ],
          [
            1119.623529,
            727.998667
          ],
          [
            1167.811765,
            727.998667
          ],
          [
            1216,
            727.998667
          ],
          [
            1378.909091,
            801.416364
          ],
          [
            1313.197861,
            801.416364
          ],
          [
            1247.486631,
            801.416364
          ],
          [
            1181.775401,
            801.416364
          ],
          [
            1116.064171,
            801.416364
          ],
          [
            1050.352941,
            801.416364
          ],
          [
            984.641711,
            801.416364
          ],
          [
            918.930481,
            801.416364
          ],
          [
            853.219251,
            801.416364
          ],
          [
            787.508021,
            801.416364
          ],
          [
            721.796791,
            801.416364
          ],
          [
            656.085561,
            801.416364
          ],
          [
            590.374332,
            801.416364
          ],
          [
            524.663102,
            801.416364
          ],
          [
            458.951872,
            801.416364
          ],
          [
            393.240642,
            801.416364
          ],
          [
            327.529412,
            801.416364
          ],
          [
            261.818182,
            801.416364
          ]
        ],
        "well_poly": [],
        "beyond_m": null,
        "beyond_offset_m": null
      }
    ]
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
    "camera_reference": "measured",
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
    "camera_reference": "measured",
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
