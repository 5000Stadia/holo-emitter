// Room types for an English house, c. 1660: each room's own grammar, as data. What it stands on, what
// its walls and ceiling are, how it is lit by day and night, its hearth, and the one piece of
// furniture that names it (its anchor; the rest comes last, R47 plan §5). The house builder reads
// these by the type the plan gives each room. Facts and sources: design/house/program-1660-research.md
// (R §n); where the research found nothing, the choice is marked "chosen".
//   floor: flags | boards | gypsum (Derbyshire plaster floors) | matting (over boards)
//   walls: wainscot (oak panelling) | tapestry (hung over plain walls) | limewash | stone
//   ceiling: plaster (plain) | compartments (moulded ribs) | beams (exposed joists)
//   hearth: chimneypiece (with grate and andirons) | kitchen (open, with jack and spits) | none
//   windows: state (large mullion-and-transom) | plain (mullioned) | small (one light) | none
export const ROOM_TYPES_1660 = {
  porch: { floor: "flags", walls: "stone", ceiling: "plaster", hearth: "none", windows: "small", light: ["day"], anchor: [] },
  screens_passage: { floor: "flags", walls: "wainscot", ceiling: "beams", hearth: "none", windows: "none", light: ["candle_at_door"], anchor: [],
    why: "R §2: narrow, between hall and service; flags chosen" },
  great_hall: { floor: "flags", walls: "wainscot", ceiling: "beams", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "branched_candlestick"],
    anchor: ["table/long-hall", "form/joined"], why: "R §2: flags (Eyam); window seats (Hardwick); long table and forms (Worden 1643); open hearth with firedogs (Haddon)" },
  great_parlour: { floor: "boards", walls: "wainscot", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["cupboard/court", "chair/turkey-work"], why: "R §2: painted panelling and plaster ceiling (Oakwell); court cupboard, Turkey-work chairs (Bank Hall c.1670)" },
  little_parlour: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["table/gateleg", "chair/joined"], why: "R §1.2: the living parlour; furniture chosen" },
  study: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "candles"],
    anchor: ["press/glazed-pepys", "table/joined-with-drawer"], why: "R §2: presses and shelves (Dunkenhalgh's studies)" },
  great_stair: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "none", windows: "plain", light: ["day", "candle_at_stairhead"], anchor: [],
    why: "R §2: Restoration great stair (Sudbury); pictures at the stair-head (Dunkenhalgh 1702)" },
  back_stair: { floor: "boards", walls: "limewash", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "rushlight"], anchor: [] },
  kitchen: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "kitchen", windows: "plain", light: ["day", "fire"],
    anchor: ["hearth/kitchen-jack", "table/kitchen"], why: "R §2: jack, racks and spits (Dunkenhalgh 1679); open fireplaces (Haddon); stone" },
  buttery: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day", "candle_at_door"],
    anchor: ["barrel/hogshead-on-stand"], why: "R §2: hogsheads on stands with iron hoops (Dunkenhalgh)" },
  pantry: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day"], anchor: ["cupboard/press"],
    why: "R §2: cupboards (Hardwick 1601, uncertain)" },
  larder: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "none", windows: "small", light: ["day"], anchor: ["tub/powdering"],
    why: "R §2: powdering, beef and souse tubs (Dunkenhalgh); bacon flitches (Lytham)" },
  bakehouse: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "kitchen", windows: "plain", light: ["day", "fire"], anchor: ["oven/bread", "trough/kneading"],
    why: "R §1.2: bakehouse among the service rooms (Ashmore pp.89-97)" },
  servants_hall: { floor: "flags", walls: "limewash", ceiling: "beams", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "rushlight"],
    anchor: ["table/long-hall", "form/joined"], why: "R §2: a servants' table and forms (Worden 1643); chosen otherwise" },
  great_chamber: { floor: "boards", walls: "tapestry", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["table/drawing", "chair/turkey-work"], why: "R §2: tapestry (Hardwick high great chamber); drawing table, carpets, chairs and stools (Rufford, Dunkenhalgh)" },
  withdrawing_chamber: { floor: "boards", walls: "tapestry", ceiling: "plaster", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["chair/turkey-work"], why: "R §2: hangings, setwork chairs (Dunkenhalgh 1679)" },
  best_bedchamber: { floor: "boards", walls: "tapestry", ceiling: "plaster", hearth: "chimneypiece", windows: "state", light: ["day", "fire", "wax_candles"],
    anchor: ["bed/standing-curtained", "stool/close"], why: "R §2: standing bed with curtains on rods, close stools (Bank Hall 1632)" },
  bedchamber: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["bed/standing-curtained", "chest/boarded"], why: "R §2: bedchambers hung with bayes or wainscot (Dunkenhalgh)" },
  closet: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "candles"],
    anchor: ["cabinet/japanned", "stool/close"], why: "R §2: cabinets, linen, sweetmeats; close stools in closets (Dunkenhalgh 4 of 7)" },
  muniment_room: { floor: "flags", walls: "stone", ceiling: "vault", hearth: "none", windows: "small", light: ["day", "candles"],
    anchor: ["press/evidence", "chest/iron-bound"], brief: "manor-1660.json#muniment_room", why: "R45's brief; Braithwait's strong, close chamber" },
  nursery: { floor: "boards", walls: "wainscot", ceiling: "plaster", hearth: "chimneypiece", windows: "plain", light: ["day", "fire", "candles"],
    anchor: ["chair/child"], why: "R §2: child's chair, going cart, wooden horses (Middleton, Dunkenhalgh)" },
  long_gallery: { floor: "matting", walls: "wainscot", ceiling: "compartments", hearth: "chimneypiece", windows: "state", light: ["day", "candles"],
    anchor: ["picture/portrait"], why: "R §2: matting (Hardwick); panelling (Haddon); portraits, maps, a billiard table (Dunkenhalgh)" },
  servants_chamber: { floor: "gypsum", walls: "limewash", ceiling: "plaster", hearth: "none", windows: "small", light: ["day", "rushlight"],
    anchor: ["bed/truckle"], why: "R §2: gypsum floors in attic servants' quarters (SPAB); chaff beds, truckle beds (Ashmore)" },
};
