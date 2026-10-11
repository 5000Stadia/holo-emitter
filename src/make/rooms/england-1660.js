// Room types for an English house, c. 1660: each room's own grammar, as data. What it stands on, what
// its walls and ceiling are, how it is lit by day and night, its hearth, and the one piece of
// furniture that names it (its anchor; the rest comes last, R47 plan §5); then its ordinary things (also: what
// else such a room held, each [kind, at most]), placed until the room is as full as its fullness (the share of its
// floor its furniture stands on, R54 step 6; Kabe: "the context and history of a room should determine its fullness
// or sparseness"; scaled by the room's history, src/make/place.js HISTORY: shut up, newly let, lived in). Fullness
// is chosen throughout: state rooms kept their floors clear, their chairs to the walls; service rooms were crowded
// with work; a long gallery was for walking. The house builder reads
// these by the type the plan gives each room. An anchor is a kind, or [kind, how many]. Facts and sources: design/house/program-1660-research.md
// (R §n); where the research found nothing, the choice is marked "chosen".
//   floor: flags | boards | gypsum (Derbyshire plaster floors) | matting (over boards)
//   walls: wainscot (oak panelling) | tapestry (hung over plain walls) | limewash | stone
//   ceiling: plaster (plain) | compartments (moulded ribs) | beams (exposed joists)
//   hearth: chimneypiece (with grate and andirons) | kitchen (open, with jack and spits) | none
//   windows: state (large mullion-and-transom) | plain (mullioned) | small (one light) | none
export const ROOM_TYPES_1660 = {
  porch: { fullness: 0, also: [], floor: "flags", walls: "stone", ceiling: "plaster", hearth: "none", windows: "small", light: ["day"], anchor: [["form/joined", 2]], why: "benches along the porch's sides, where callers wait" },
  screens_passage: { floor: "flags", walls: "wainscot", ceiling: "beams", hearth: "none", windows: "none", light: ["candle_at_door"], anchor: [],
    why: "R §2: narrow, between hall and service; flags chosen" },
  great_hall: { fullness: 0.14, also: [["chest/boarded", 1], ["form/joined", 2]], floor: "flags", walls: "wainscot", ceiling: "beams", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "branched_candlestick"],
    anchor: ["table/long-hall", ["form/joined", 2], ["chair/joined", 2], "arms/pikes"], why: "R §2: flags (Eyam); window seats (Hardwick); long table and forms (Worden 1643); open hearth with firedogs (Haddon)" },
  great_parlour: { fullness: 0.18, also: [["chair/joined", 2], ["chest/boarded", 1]], floor: "boards", walls: "wainscot", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["table/carpeted", "cupboard/court", ["chair/turkey-work", 6]], why: "R §2: painted panelling and plaster ceiling (Oakwell); court cupboard, Turkey-work chairs (Bank Hall c.1670)" },
  little_parlour: { fullness: 0.16, also: [["chest/boarded", 1], ["cupboard/press", 1], ["stool/close", 0]], floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["wheel/spinning", "table/gateleg", ["chair/joined", 4]], why: "R §1.2: the living parlour; furniture chosen" },
  study: { fullness: 0.12, also: [["chest/boarded", 1], ["chair/joined", 1]], floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "candles"],
    anchor: [["press/glazed-pepys", 2], "table/joined-with-drawer", "chair/joined"], why: "R §2: presses and shelves (Dunkenhalgh's studies)" },
  great_stair: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "none", windows: "plain", light: ["day", "candle_at_stairhead"], anchor: [],
    why: "R §2: Restoration great stair (Sudbury); pictures at the stair-head (Dunkenhalgh 1702)" },
  back_stair: { floor: "boards", walls: "limewash", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "rushlight"], anchor: [] },
  kitchen: { fullness: 0.14, also: [["tub/powdering", 2], ["chest/boarded", 1], ["form/joined", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "kitchen", windows: "plain", light: ["day", "fire"],
    anchor: ["hearth/kitchen-jack", "table/kitchen", "cupboard/press"], why: "R §2: jack, racks and spits (Dunkenhalgh 1679); open fireplaces (Haddon); stone" },
  buttery: { fullness: 0.24, also: [["barrel/hogshead-on-stand", 2], ["tub/powdering", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day", "candle_at_door"],
    anchor: [["barrel/hogshead-on-stand", 2]], why: "R §2: hogsheads on stands with iron hoops (Dunkenhalgh)" },
  pantry: { fullness: 0.2, also: [["chest/boarded", 1], ["tub/powdering", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day"], anchor: ["dresser/pewter", "cupboard/press"],
    why: "R §2: cupboards (Hardwick 1601, uncertain)" },
  larder: { fullness: 0.12, also: [["tub/powdering", 2], ["barrel/hogshead-on-stand", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day"], anchor: ["rack/flitches", ["tub/powdering", 3]],
    why: "R §2: powdering, beef and souse tubs (Dunkenhalgh); bacon flitches (Lytham)" },
  bakehouse: { fullness: 0.12, also: [["tub/powdering", 2], ["chest/boarded", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "kitchen", windows: "plain", light: ["day", "fire"], anchor: ["oven/bread", "trough/kneading"],
    why: "R §1.2: bakehouse among the service rooms (Ashmore pp.89-97)" },
  servants_hall: { fullness: 0.14, also: [["chest/boarded", 1], ["chair/joined", 1]], floor: "flags", walls: "limewash", ceiling: "beams", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "rushlight"],
    anchor: ["table/long-hall", ["form/joined", 2], "rail/pegs"], why: "R §2: a servants' table and forms (Worden 1643); chosen otherwise" },
  great_chamber: { fullness: 0.16, also: [["chest/boarded", 1], ["cupboard/court", 1]], floor: "boards", walls: "tapestry", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["table/drawing", ["chair/turkey-work", 8]], why: "R §2: tapestry (Hardwick high great chamber); drawing table, carpets, chairs and stools (Rufford, Dunkenhalgh)" },
  withdrawing_chamber: { fullness: 0.12, also: [["cabinet/japanned", 1], ["chest/boarded", 1]], floor: "boards", walls: "tapestry", ceiling: "plaster", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["couch/daybed", ["chair/turkey-work", 6]], why: "R §2: hangings, setwork chairs (Dunkenhalgh 1679)" },
  best_bedchamber: { fullness: 0.16, also: [["chest/boarded", 1], ["cabinet/japanned", 1]], floor: "boards", walls: "tapestry", ceiling: "plaster", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["bed/standing-curtained", "stool/close", ["chair/turkey-work", 2]], why: "R §2: standing bed with curtains on rods, close stools (Bank Hall 1632)" },
  bedchamber: { fullness: 0.2, also: [["chair/joined", 1], ["stool/close", 1]], floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["bed/standing-curtained", "chest/boarded"], why: "R §2: bedchambers hung with bayes or wainscot (Dunkenhalgh)" },
  closet: { fullness: 0.1, also: [["chest/boarded", 1]], floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "candles"],
    anchor: ["cabinet/japanned", "stool/close"], why: "R §2: cabinets, linen, sweetmeats; close stools in closets (Dunkenhalgh 4 of 7)" },
  muniment_room: { floor: "flags", walls: "stone", ceiling: "vault", hearth: "none", windows: "small", light: ["day", "candles"],
    anchor: ["press/evidence", "chest/iron-bound"], brief: "manor-1660.json#muniment_room", why: "R45's brief; Braithwait's strong, close chamber" },
  nursery: { fullness: 0.14, also: [["chest/boarded", 1], ["chair/joined", 1]], floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["cradle/hooded", "bed/standing-curtained", "chair/child"], why: "R §2: child's chair, going cart, wooden horses (Middleton, Dunkenhalgh)" },
  long_gallery: { fullness: 0.02, also: [["chair/turkey-work", 4]], floor: "matting", walls: "wainscot", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "candles"],
    anchor: [["picture/portrait", 14]], why: "R §2: matting (Hardwick); panelling (Haddon); portraits, maps, a billiard table (Dunkenhalgh)" },
  servants_chamber: { fullness: 0.06, also: [["chest/boarded", 2], ["stool/close", 1]], floor: "gypsum", walls: "limewash", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "rushlight"],
    anchor: [["bed/truckle", 2], "chest/boarded"], why: "R §2: gypsum floors in attic servants' quarters (SPAB); chaff beds, truckle beds (Ashmore)" },
};
