// A household's program, c. 1660: what rooms a Midlands gentry seat needed, on which floor, how many,
// and the order a person goes through them. Data only: it is what one ingestion pass writes for a
// place ("a gentry seat, c.1660, Derbyshire, many manors"); the plan type (src/make/plans/) lays it
// into an envelope and the room types (src/make/rooms/) build each room. Facts and sources:
// design/house/program-1660-research.md (cited below as R §n).
export const GENTRY_SEAT_1660 = {
  program: "england-1660/gentry-seat",
  plan_type: "hybrid-e",                       // R §1.1: the Sudbury-style hybrid for a 1660 Midlands seat
  floors: ["ground", "first", "garret"],
  // the rooms: type, floor, how many (a range drawn from the place's seed), and why
  rooms: [
    { type: "porch", floor: "ground", count: 1 },
    { type: "screens_passage", floor: "ground", count: 1, why: "R §1.4.1: 2–3 doors to buttery, kitchen, pantry" },
    { type: "great_hall", floor: "ground", count: 1, rises: 2, why: "R §2: older halls two storeys (Oakwell); by 1679 an entrance room (Dunkenhalgh)" },
    { type: "great_parlour", floor: "ground", count: 1, why: "R §1.4.3: off the hall, the best furniture" },
    { type: "little_parlour", floor: "ground", count: 1, why: "R §1.2: the living parlour" },
    { type: "study", floor: "ground", count: 1, why: "R §2: Dunkenhalgh's two studies by the library chamber" },
    { type: "great_stair", floor: "ground", count: 1, rises: 2, why: "R §1.4.4: the stair to the great chamber" },
    { type: "back_stair", floor: "ground", count: 1, rises: 3, why: "R §1.4.7: servants' stairs" },
    { type: "kitchen", floor: "ground", count: 1, rises: 2, why: "R §2: two-storey kitchens (Belton, Haddon)" },
    { type: "buttery", floor: "ground", count: 1 },
    { type: "pantry", floor: "ground", count: 1 },
    { type: "larder", floor: "ground", count: 1 },
    { type: "servants_hall", floor: "ground", count: [0, 1] },
    { type: "great_chamber", floor: "first", count: 1, why: "R §1.2: the great dining chamber above the great parlour" },
    { type: "withdrawing_chamber", floor: "first", count: 1 },
    { type: "best_bedchamber", floor: "first", count: 1 },
    { type: "closet", floor: "first", count: [2, 3], why: "R §1.4.6: off bedchambers" },
    { type: "bedchamber", floor: "first", count: [2, 3] },
    { type: "muniment_room", floor: "first", count: 1, why: "R §1.4.10: on the family floor, by the owner's closet or the steward's room; one way in" },
    { type: "nursery", floor: "first", count: [0, 1] },
    { type: "long_gallery", floor: "garret", count: 1, why: "R §1.4.8: the old plan's top floor (Hardwick, second floor)" },
    { type: "servants_chamber", floor: "garret", count: [2, 3], why: "R §1.4.11: garners and maids' chambers in the garrets" },
  ],
  // the order a person goes through them: [from, to]; a room may also open where the plan type needs
  sequences: [
    ["porch", "screens_passage"], ["screens_passage", "great_hall"],
    ["screens_passage", "buttery"], ["screens_passage", "kitchen"], ["screens_passage", "pantry"],
    ["kitchen", "larder"], ["kitchen", "servants_hall"],
    ["great_hall", "great_parlour"], ["great_hall", "great_stair"], ["great_parlour", "little_parlour"], ["little_parlour", "study"],
    ["great_stair", "great_chamber"], ["great_chamber", "withdrawing_chamber"], ["withdrawing_chamber", "best_bedchamber"], ["best_bedchamber", "closet"],
    ["closet", "muniment_room"],
    ["great_stair", "long_gallery"],
    ["back_stair", "servants_chamber"], ["back_stair", "bedchamber"], ["bedchamber", "closet"],
  ],
};
